// =================================================================
/**
 * @file a6_train_ticket.js
 * @description A6 模擬火車購票 - 基於 A4 架構
 * @unit A6 - 模擬火車購票
 * @version 1.4.0
 * @lastModified 2026-02-22
 *
 * 核心功能：
 * - NPC 對話式購票流程
 * - 車站選擇（北中南東分區）
 * - 車種選擇（區間車、莒光號、自強號、普悠瑪）
 * - 票價計算（基於距離與車種）
 * - 繼承 A4 的付款與找零系統
 * - 擬真車票生成與展示
 *
 * 記憶體管理（v1.2.0）：
 * - [Phase 1] TimerManager/EventManager 基礎設施
 * - [Phase 2] 27 個 setTimeout 遷移至 TimerManager（79 個調用點）
 * - [Phase 3] 48 個 addEventListener 遷移至 EventManager（遊戲流程事件）
 *
 * Debug Logger（v1.3.0）：
 * - 298 個 console 轉換為 Game.Debug 分類開關系統
 * - 14 個分類: init, state, ui, audio, speech, coin, payment, product, flow, assist, hint, timer, event, error
 * - 保留 3 個內部 Debug 實作 + 14 個 audio .catch() 處理器
 *
 * 動畫整合（v1.4.0）：
 * - 新增 injectGlobalAnimationStyles() 統一動畫注入機制
 * - 7 個 @keyframes 從 HTML 遷移至 JS（errorX-appear, correct-tick-appear, pulse-highlight, bounce, spin, fadeIn, celebrate）
 * - 消除 HTML 中 bounce 重複定義（原有 2 處）
 */
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const Game = {
        // ═══════════════════════════════════════════════════════════════════════════
        // TimerManager: 統一管理所有 setTimeout（Phase 1 基礎設施）
        // ═══════════════════════════════════════════════════════════════════════════
        TimerManager: {
            timers: new Map(),
            timerIdCounter: 0,

            setTimeout(callback, delay, category = 'default') {
                const id = ++this.timerIdCounter;
                const timerId = window.setTimeout(() => {
                    this.timers.delete(id);
                    callback();
                }, delay);
                this.timers.set(id, { timerId, category });
                return id;
            },

            clearTimeout(id) {
                const timer = this.timers.get(id);
                if (timer) {
                    window.clearTimeout(timer.timerId);
                    this.timers.delete(id);
                }
            },

            clearAll() {
                Game.Debug.log('timer', `TimerManager.clearAll(): ${this.timers.size} 個計時器`);
                this.timers.forEach(timer => window.clearTimeout(timer.timerId));
                this.timers.clear();
            },

            clearByCategory(category) {
                let count = 0;
                this.timers.forEach((timer, id) => {
                    if (timer.category === category) {
                        window.clearTimeout(timer.timerId);
                        this.timers.delete(id);
                        count++;
                    }
                });
                if (count > 0) {
                    Game.Debug.log('timer', `清理 ${category} 類別: ${count} 個`);
                }
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════
        // EventManager: 統一管理所有 addEventListener（Phase 1 基礎設施）
        // ═══════════════════════════════════════════════════════════════════════════
        EventManager: {
            listeners: [],

            on(element, type, handler, options = {}, category = 'default') {
                if (!element) return -1;
                element.addEventListener(type, handler, options);
                return this.listeners.push({ element, type, handler, options, category }) - 1;
            },

            removeAll() {
                Game.Debug.log('event', `EventManager.removeAll(): ${this.listeners.length} 個監聽器`);
                this.listeners.forEach(l => {
                    if (l?.element) {
                        try { l.element.removeEventListener(l.type, l.handler, l.options); } catch(e) {}
                    }
                });
                this.listeners = [];
            },

            removeByCategory(category) {
                let count = 0;
                this.listeners.forEach((l, i) => {
                    if (l?.category === category && l.element) {
                        try { l.element.removeEventListener(l.type, l.handler, l.options); } catch(e) {}
                        this.listeners[i] = null;
                        count++;
                    }
                });
                if (count > 0) {
                    Game.Debug.log('event', `清理 ${category} 類別: ${count} 個`);
                }
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════
        // Debug Logger: FLAGS 分類開關系統
        // ═══════════════════════════════════════════════════════════════════════════
        Debug: {
            FLAGS: {
                all: false,      // 主開關：開啟後顯示所有分類
                init: false,     // 初始化
                state: false,    // 狀態管理
                ui: false,       // UI 渲染
                audio: false,    // 音效播放
                speech: false,   // 語音合成
                coin: false,     // 錢幣操作
                payment: false,  // 付款邏輯
                product: false,  // 商品/服務選擇
                flow: false,     // 遊戲流程
                assist: false,   // 輔助模式
                hint: false,     // 提示系統
                timer: false,    // 計時器
                event: false,    // 事件監聯
                error: true      // 錯誤（預設開啟）
            },
            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[A6-${category}]`, ...args);
                }
            },
            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[A6-${category}]`, ...args);
                }
            },
            error(...args) {
                console.error('[A6-ERROR]', ...args);
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════
        // 🎬 全局動畫樣式注入（避免重複定義）
        // ═══════════════════════════════════════════════════════════════════════════
        injectGlobalAnimationStyles() {
            if (document.getElementById('a6-global-animations')) return;

            const style = document.createElement('style');
            style.id = 'a6-global-animations';
            style.innerHTML = `
                /* 錯誤標記 × 出現動畫 */
                @keyframes errorX-appear {
                    from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    60% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
                /* 正確標記 ✓ 出現動畫 */
                @keyframes correct-tick-appear {
                    from { transform: scale(0) rotate(-180deg); opacity: 0; }
                    to { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                /* 簡單模式高亮脈衝 */
                @keyframes pulse-highlight {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 193, 7, 0.8); }
                    50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(255, 193, 7, 1); }
                }
                /* 上下彈跳（輔助點擊提示） */
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                /* Loading 旋轉 */
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                /* 完成畫面淡入 */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                /* 完成畫面慶祝 */
                @keyframes celebrate {
                    0% { transform: scale(0.8) rotate(-10deg); opacity: 0; }
                    50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                /* 確認付款按鈕就緒脈動（同 A4）*/
                @keyframes pulse {
                    0%   { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
                    70%  { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
                }
                #confirm-payment-btn.ready {
                    background: linear-gradient(135deg, #4caf50, #388e3c) !important;
                    animation: pulse 1.5s infinite;
                }
                #confirm-payment-btn {
                    transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
                }
                #confirm-payment-btn:hover:not(:disabled) {
                    background: #F57C00 !important;
                    animation: none;
                    transform: translateY(-2px);
                }
            `;
            document.head.appendChild(style);
            Game.Debug.log('init', '🎬 全局動畫樣式注入完成');
        },

        // =====================================================
        // 🔧 金額轉換輔助函數 - 使用共用模組
        // =====================================================
        convertAmountToSpeech(amount) {
            // 使用共用模組的金額轉換函數
            return NumberSpeechUtils.convertToTraditionalCurrency(amount);
        },

        // =====================================================
        // 狀態管理系統
        // =====================================================
        state: {
            settings: {
                taskType: null,          // preset(預設), free(自由購票)
                difficulty: null,        // easy, normal, hard
                walletAmount: null,      // 100, 500, 1000
                walletMode: null,        // preset(預設), custom(自訂金額)
                customWalletAmount: null,    // 自訂金額總額
                customWalletDetails: null,   // 自訂錢包詳細內容 {1: qty, 5: qty, ...}
                questionCount: null,     // 測驗題數
                clickMode: false,        // 輔助點擊模式開關
            },
            audioUnlocked: false,
            gameState: {
                currentScene: 'settings',

                // 🆕 購票流程狀態
                ticketProcess: {
                    step: 0,                // 當前步驟
                    startStation: null,     // 起站
                    endStation: null,       // 訖站
                    trainType: null,        // 車種 ID
                    ticketCount: 1,         // 購票張數
                    unitPrice: 0,           // 單價
                    totalPrice: 0,          // 總價
                    trainInfo: {            // 車次資訊
                        trainNumber: null,
                        departureTime: null,
                        departureDate: null,
                        seatCar: null,
                        seatNumber: null
                    }
                },

                // 繼承 A4 的錢包和交易狀態
                playerWallet: [],
                walletTotal: 0,
                currentTransaction: {
                    totalCost: 0,
                    amountPaid: 0,
                    paidMoney: [],
                    changeExpected: 0,
                    changeReceived: []
                },

                // 處理狀態標誌
                isProcessingPayment: false,
                isProcessingChange: false,
                isProcessingSpeech: false,
                isShowingModal: false,
                isTransitioning: false,
                changeCompleted: false,

                // 🆕 普通模式錯誤追蹤（每個步驟獨立計數）
                stepErrorCounts: {
                    askStart: 0,      // 出發站錯誤次數
                    askEnd: 0,        // 到達站錯誤次數
                    askType: 0,       // 車種錯誤次數
                    askCount: 0       // 張數錯誤次數
                },
                stepHintsShown: {
                    askStart: false,  // 出發站提示是否已顯示
                    askEnd: false,    // 到達站提示是否已顯示
                    askType: false,   // 車種提示是否已顯示
                    askCount: false   // 張數提示是否已顯示
                },
                // 付款和找零錯誤計數
                paymentErrorCount: 0,
                changeErrorCount: 0,

                // 🆕 輔助點擊模式狀態管理
                clickModeState: {
                    enabled: false,              // 設定中是否啟用
                    active: false,               // 是否正在運作
                    currentPhase: null,          // 當前階段：welcome/askStart/askEnd/askType/askCount/confirm/payment/change
                    currentStep: 0,              // 當前步驟索引
                    actionQueue: [],             // 操作序列
                    waitingForClick: false,      // 是否等待用戶點擊繼續
                    waitingForStart: false,      // 是否等待用戶點擊開始
                    lastClickTime: 0,            // 上次點擊時間戳記（防抖動）
                    promptVisible: false,        // 提示是否顯示中
                    paymentQueue: null,          // 付款序列
                    paymentIndex: 0,             // 付款索引
                    changeQueue: null,           // 找零序列
                    changeIndex: 0,              // 找零索引
                    isAutomatedClick: false,     // 🔧 是否為自動化觸發的點擊
                    // 🆕 新增（參考 A5）
                    clickReadyTime: 0,           // 點擊準備就緒時間（用於防快速點擊）
                    isExecuting: false,          // 是否正在執行操作（防止競態條件）
                    _visualDelayTimer: null      // 視覺延遲計時器
                },

                // 🆕 防重複機制
                lastWalletAmount: 0,             // 記錄上一輪的錢包金額
                lastPresetTask: null,            // 記錄上一輪的預設任務（出發站、抵達站、車種、張數）
            },
            quiz: {
                currentQuestion: 0,
                score: 0,
                questions: [],
                startTime: null,
                attempts: 0,
                usedSeats: []  // 🎫 記錄本次測驗中已使用的座位
            },
            loadingQuestion: false,
            sceneListeners: [],
            // 🆕 自訂車站資料（從 localStorage 載入）
            customStations: []
        },

        // 🆕 自訂車站代理站對照表（每區域的主要站）
        PROXY_STATIONS: {
            north: 'taipei',      // 北部 → 臺北
            central: 'taichung',  // 中部 → 臺中
            south: 'kaohsiung',   // 南部 → 高雄
            east: 'hualien'       // 東部 → 花蓮
        },

        // 🆕 自訂車站最大數量
        MAX_CUSTOM_STATIONS: 6,

        // 🆕 台鐵全線車站資料庫（含英文拼音）
        TRA_STATION_DATABASE: [
            // === 北段（基隆→崎頂）===
            { name: '基隆', en: 'Keelung', region: 'north' },
            { name: '三坑', en: 'Sankeng', region: 'north' },
            { name: '八堵', en: 'Badu', region: 'north' },
            { name: '七堵', en: 'Qidu', region: 'north' },
            { name: '百福', en: 'Baifu', region: 'north' },
            { name: '五堵', en: 'Wudu', region: 'north' },
            { name: '汐止', en: 'Xizhi', region: 'north' },
            { name: '汐科', en: 'Xike', region: 'north' },
            { name: '南港', en: 'Nangang', region: 'north' },
            { name: '松山', en: 'Songshan', region: 'north' },
            { name: '臺北', en: 'Taipei', region: 'north' },
            { name: '萬華', en: 'Wanhua', region: 'north' },
            { name: '板橋', en: 'Banqiao', region: 'north' },
            { name: '浮洲', en: 'Fuzhou', region: 'north' },
            { name: '樹林', en: 'Shulin', region: 'north' },
            { name: '南樹林', en: 'Nan Shulin', region: 'north' },
            { name: '山佳', en: 'Shanjia', region: 'north' },
            { name: '鶯歌', en: 'Yingge', region: 'north' },
            { name: '桃園', en: 'Taoyuan', region: 'north' },
            { name: '內壢', en: 'Neili', region: 'north' },
            { name: '中壢', en: 'Zhongli', region: 'north' },
            { name: '埔心', en: 'Puxin', region: 'north' },
            { name: '楊梅', en: 'Yangmei', region: 'north' },
            { name: '富岡', en: 'Fugang', region: 'north' },
            { name: '新富', en: 'Xinfu', region: 'north' },
            { name: '北湖', en: 'Beihu', region: 'north' },
            { name: '湖口', en: 'Hukou', region: 'north' },
            { name: '新豐', en: 'Xinfeng', region: 'north' },
            { name: '竹北', en: 'Zhubei', region: 'north' },
            { name: '北新竹', en: 'North Hsinchu', region: 'north' },
            { name: '新竹', en: 'Hsinchu', region: 'north' },
            { name: '三姓橋', en: 'Sanxingqiao', region: 'north' },
            { name: '香山', en: 'Xiangshan', region: 'north' },
            { name: '崎頂', en: 'Qiding', region: 'north' },
            // === 宜蘭線（暖暖→福隆，北段）===
            { name: '暖暖', en: 'Nuannuan', region: 'north' },
            { name: '四腳亭', en: 'Sijiaoting', region: 'north' },
            { name: '瑞芳', en: 'Ruifang', region: 'north' },
            { name: '猴硐', en: 'Houtong', region: 'north' },
            { name: '三貂嶺', en: 'Sandiaoling', region: 'north' },
            { name: '牡丹', en: 'Mudan', region: 'north' },
            { name: '雙溪', en: 'Shuangxi', region: 'north' },
            { name: '貢寮', en: 'Gongliao', region: 'north' },
            { name: '福隆', en: 'Fulong', region: 'north' },
            // === 平溪線 ===
            { name: '大華', en: 'Dahua', region: 'north' },
            { name: '十分', en: 'Shifen', region: 'north' },
            { name: '望古', en: 'Wanggu', region: 'north' },
            { name: '嶺腳', en: 'Lingjiao', region: 'north' },
            { name: '平溪', en: 'Pingxi', region: 'north' },
            { name: '菁桐', en: 'Jingtong', region: 'north' },
            // === 深澳線 ===
            { name: '海科館', en: 'Haikeguan', region: 'north' },
            { name: '八斗子', en: 'Badouzi', region: 'north' },
            // === 內灣線 / 六家線 ===
            { name: '竹中', en: 'Zhuzhong', region: 'north' },
            { name: '六家', en: 'Liujia', region: 'north' },
            { name: '上員', en: 'Shangyuan', region: 'north' },
            { name: '榮華', en: 'Ronghua', region: 'north' },
            { name: '竹東', en: 'Zhudong', region: 'north' },
            { name: '橫山', en: 'Hengshan', region: 'north' },
            { name: '九讚頭', en: 'Jiuzantou', region: 'north' },
            { name: '合興', en: 'Hexing', region: 'north' },
            { name: '富貴', en: 'Fugui', region: 'north' },
            { name: '內灣', en: 'Neiwan', region: 'north' },
            // === 海線（竹南→彰化）===
            { name: '竹南', en: 'Zhunan', region: 'central' },
            { name: '談文', en: 'Tanwen', region: 'central' },
            { name: '大山', en: 'Dashan', region: 'central' },
            { name: '後龍', en: 'Houlong', region: 'central' },
            { name: '龍港', en: 'Longgang', region: 'central' },
            { name: '白沙屯', en: 'Baishatun', region: 'central' },
            { name: '新埔', en: 'Xinpu', region: 'central' },
            { name: '通霄', en: 'Tongxiao', region: 'central' },
            { name: '苑裡', en: 'Yuanli', region: 'central' },
            { name: '日南', en: 'Rinan', region: 'central' },
            { name: '大甲', en: 'Dajia', region: 'central' },
            { name: '臺中港', en: 'Taichung Port', region: 'central' },
            { name: '清水', en: 'Qingshui', region: 'central' },
            { name: '沙鹿', en: 'Shalu', region: 'central' },
            { name: '龍井', en: 'Longjing', region: 'central' },
            { name: '大肚', en: 'Dadu', region: 'central' },
            // === 山線（竹南→彰化）===
            { name: '造橋', en: 'Zaoqiao', region: 'central' },
            { name: '豐富', en: 'Fengfu', region: 'central' },
            { name: '苗栗', en: 'Miaoli', region: 'central' },
            { name: '南勢', en: 'Nanshi', region: 'central' },
            { name: '銅鑼', en: 'Tongluo', region: 'central' },
            { name: '三義', en: 'Sanyi', region: 'central' },
            { name: '泰安', en: 'Taian', region: 'central' },
            { name: '后里', en: 'Houli', region: 'central' },
            { name: '豐原', en: 'Fengyuan', region: 'central' },
            { name: '栗林', en: 'Lilin', region: 'central' },
            { name: '潭子', en: 'Tanzi', region: 'central' },
            { name: '頭家厝', en: 'Toujiacuo', region: 'central' },
            { name: '松竹', en: 'Songzhu', region: 'central' },
            { name: '太原', en: 'Taiyuan', region: 'central' },
            { name: '精武', en: 'Jingwu', region: 'central' },
            { name: '臺中', en: 'Taichung', region: 'central' },
            { name: '五權', en: 'Wuquan', region: 'central' },
            { name: '大慶', en: 'Daqing', region: 'central' },
            { name: '烏日', en: 'Wuri', region: 'central' },
            { name: '新烏日', en: 'Xinwuri', region: 'central' },
            { name: '成功', en: 'Chenggong', region: 'central' },
            // === 彰化→二水 ===
            { name: '彰化', en: 'Changhua', region: 'central' },
            { name: '花壇', en: 'Huatan', region: 'central' },
            { name: '大村', en: 'Dacun', region: 'central' },
            { name: '員林', en: 'Yuanlin', region: 'central' },
            { name: '永靖', en: 'Yongjing', region: 'central' },
            { name: '社頭', en: 'Shetou', region: 'central' },
            { name: '田中', en: 'Tianzhong', region: 'central' },
            { name: '二水', en: 'Ershui', region: 'central' },
            // === 集集線 ===
            { name: '源泉', en: 'Yuanquan', region: 'central' },
            { name: '濁水', en: 'Zhuoshui', region: 'central' },
            { name: '龍泉', en: 'Longquan', region: 'central' },
            { name: '集集', en: 'Jiji', region: 'central' },
            { name: '水里', en: 'Shuili', region: 'central' },
            { name: '車埕', en: 'Checheng', region: 'central' },
            // === 南段（林內→高雄）===
            { name: '林內', en: 'Linnei', region: 'south' },
            { name: '石榴', en: 'Shiliu', region: 'south' },
            { name: '斗六', en: 'Douliu', region: 'south' },
            { name: '斗南', en: 'Dounan', region: 'south' },
            { name: '石龜', en: 'Shigui', region: 'south' },
            { name: '大林', en: 'Dalin', region: 'south' },
            { name: '民雄', en: 'Minxiong', region: 'south' },
            { name: '嘉北', en: 'Jiabei', region: 'south' },
            { name: '嘉義', en: 'Chiayi', region: 'south' },
            { name: '水上', en: 'Shuishang', region: 'south' },
            { name: '南靖', en: 'Nanjing', region: 'south' },
            { name: '後壁', en: 'Houbi', region: 'south' },
            { name: '新營', en: 'Xinying', region: 'south' },
            { name: '柳營', en: 'Liuying', region: 'south' },
            { name: '林鳳營', en: 'Linfengying', region: 'south' },
            { name: '隆田', en: 'Longtian', region: 'south' },
            { name: '拔林', en: 'Balin', region: 'south' },
            { name: '善化', en: 'Shanhua', region: 'south' },
            { name: '南科', en: 'Nanke', region: 'south' },
            { name: '新市', en: 'Xinshi', region: 'south' },
            { name: '永康', en: 'Yongkang', region: 'south' },
            { name: '大橋', en: 'Daqiao', region: 'south' },
            { name: '臺南', en: 'Tainan', region: 'south' },
            { name: '保安', en: 'Baoan', region: 'south' },
            { name: '仁德', en: 'Rende', region: 'south' },
            { name: '中洲', en: 'Zhongzhou', region: 'south' },
            { name: '大湖', en: 'Dahu', region: 'south' },
            { name: '路竹', en: 'Luzhu', region: 'south' },
            { name: '岡山', en: 'Gangshan', region: 'south' },
            { name: '橋頭', en: 'Qiaotou', region: 'south' },
            { name: '楠梓', en: 'Nanzi', region: 'south' },
            { name: '新左營', en: 'Xinzuoying', region: 'south' },
            { name: '左營', en: 'Zuoying', region: 'south' },
            { name: '內惟', en: 'Neiwei', region: 'south' },
            { name: '美術館', en: 'Meishuguan', region: 'south' },
            { name: '鼓山', en: 'Gushan', region: 'south' },
            { name: '三塊厝', en: 'Sankuaicuo', region: 'south' },
            { name: '高雄', en: 'Kaohsiung', region: 'south' },
            // === 屏東線 ===
            { name: '鳳山', en: 'Fengshan', region: 'south' },
            { name: '後庄', en: 'Houzhuang', region: 'south' },
            { name: '九曲堂', en: 'Jiuqutang', region: 'south' },
            { name: '六塊厝', en: 'Liukuaicuo', region: 'south' },
            { name: '屏東', en: 'Pingtung', region: 'south' },
            { name: '歸來', en: 'Guilai', region: 'south' },
            { name: '麟洛', en: 'Linluo', region: 'south' },
            { name: '西勢', en: 'Xishi', region: 'south' },
            { name: '竹田', en: 'Zhutian', region: 'south' },
            { name: '潮州', en: 'Chaozhou', region: 'south' },
            { name: '崁頂', en: 'Kanding', region: 'south' },
            { name: '南州', en: 'Nanzhou', region: 'south' },
            { name: '鎮安', en: 'Zhenan', region: 'south' },
            { name: '林邊', en: 'Linbian', region: 'south' },
            { name: '佳冬', en: 'Jiadong', region: 'south' },
            { name: '東海', en: 'Donghai', region: 'south' },
            { name: '枋寮', en: 'Fangliao', region: 'south' },
            // === 沙崙線 ===
            { name: '長榮大學', en: 'CJCU', region: 'south' },
            { name: '沙崙', en: 'Shalun', region: 'south' },
            // === 南迴線（枋寮側）===
            { name: '枋山', en: 'Fangshan', region: 'south' },
            { name: '內獅', en: 'Neishi', region: 'south' },
            { name: '加祿', en: 'Jialu', region: 'south' },
            // === 宜蘭線（石城→蘇澳，東段）===
            { name: '石城', en: 'Shicheng', region: 'east' },
            { name: '大里', en: 'Dali', region: 'east' },
            { name: '大溪', en: 'Daxi', region: 'east' },
            { name: '龜山', en: 'Guishan', region: 'east' },
            { name: '外澳', en: 'Waiao', region: 'east' },
            { name: '頭城', en: 'Toucheng', region: 'east' },
            { name: '頂埔', en: 'Dingpu', region: 'east' },
            { name: '礁溪', en: 'Jiaoxi', region: 'east' },
            { name: '四城', en: 'Sicheng', region: 'east' },
            { name: '宜蘭', en: 'Yilan', region: 'east' },
            { name: '二結', en: 'Erjie', region: 'east' },
            { name: '中里', en: 'Zhongli', region: 'east' },
            { name: '羅東', en: 'Luodong', region: 'east' },
            { name: '冬山', en: 'Dongshan', region: 'east' },
            { name: '新馬', en: 'Xinma', region: 'east' },
            { name: '蘇澳新', en: 'Su-aoxin', region: 'east' },
            { name: '蘇澳', en: 'Suao', region: 'east' },
            // === 北迴線 ===
            { name: '永樂', en: 'Yongle', region: 'east' },
            { name: '東澳', en: 'Dongao', region: 'east' },
            { name: '南澳', en: 'Nanao', region: 'east' },
            { name: '武塔', en: 'Wuta', region: 'east' },
            { name: '漢本', en: 'Hanben', region: 'east' },
            { name: '和平', en: 'Heping', region: 'east' },
            { name: '和仁', en: 'Heren', region: 'east' },
            { name: '崇德', en: 'Chongde', region: 'east' },
            { name: '新城', en: 'Xincheng', region: 'east' },
            { name: '景美', en: 'Jingmei', region: 'east' },
            { name: '北埔', en: 'Beipu', region: 'east' },
            { name: '花蓮', en: 'Hualien', region: 'east' },
            // === 臺東線 ===
            { name: '吉安', en: 'Jian', region: 'east' },
            { name: '志學', en: 'Zhixue', region: 'east' },
            { name: '平和', en: 'Pinghe', region: 'east' },
            { name: '壽豐', en: 'Shoufeng', region: 'east' },
            { name: '豐田', en: 'Fengtian', region: 'east' },
            { name: '南平', en: 'Nanping', region: 'east' },
            { name: '鳳林', en: 'Fenglin', region: 'east' },
            { name: '萬榮', en: 'Wanrong', region: 'east' },
            { name: '光復', en: 'Guangfu', region: 'east' },
            { name: '大富', en: 'Dafu', region: 'east' },
            { name: '富源', en: 'Fuyuan', region: 'east' },
            { name: '瑞穗', en: 'Ruisui', region: 'east' },
            { name: '三民', en: 'Sanmin', region: 'east' },
            { name: '玉里', en: 'Yuli', region: 'east' },
            { name: '東里', en: 'Dongli', region: 'east' },
            { name: '東竹', en: 'Dongzhu', region: 'east' },
            { name: '富里', en: 'Fuli', region: 'east' },
            { name: '池上', en: 'Chishang', region: 'east' },
            { name: '海端', en: 'Haiduan', region: 'east' },
            { name: '關山', en: 'Guanshan', region: 'east' },
            { name: '瑞和', en: 'Ruihe', region: 'east' },
            { name: '瑞源', en: 'Ruiyuan', region: 'east' },
            { name: '鹿野', en: 'Luye', region: 'east' },
            { name: '山里', en: 'Shanli', region: 'east' },
            { name: '臺東', en: 'Taitung', region: 'east' },
            // === 南迴線（臺東側）===
            { name: '康樂', en: 'Kangle', region: 'east' },
            { name: '知本', en: 'Zhiben', region: 'east' },
            { name: '太麻里', en: 'Taimali', region: 'east' },
            { name: '金崙', en: 'Jinlun', region: 'east' },
            { name: '瀧溪', en: 'Longxi', region: 'east' },
            { name: '大武', en: 'Dawu', region: 'east' },
        ],

        // =====================================================
        // 車站資料系統
        // =====================================================
        storeData: {
            // 金錢資料（繼承 A4）
            moneyItems: [
                { value: 1, name: '1元', images: { front: '../images/money/1_yuan_front.png', back: '../images/money/1_yuan_back.png' } },
                { value: 5, name: '5元', images: { front: '../images/money/5_yuan_front.png', back: '../images/money/5_yuan_back.png' } },
                { value: 10, name: '10元', images: { front: '../images/money/10_yuan_front.png', back: '../images/money/10_yuan_back.png' } },
                { value: 50, name: '50元', images: { front: '../images/money/50_yuan_front.png', back: '../images/money/50_yuan_back.png' } },
                { value: 100, name: '100元', images: { front: '../images/money/100_yuan_front.png', back: '../images/money/100_yuan_back.png' } },
                { value: 500, name: '500元', images: { front: '../images/money/500_yuan_front.png', back: '../images/money/500_yuan_back.png' } },
                { value: 1000, name: '1000元', images: { front: '../images/money/1000_yuan_front.png', back: '../images/money/1000_yuan_back.png' } }
            ],

            // 🆕 車站資料（基於真實台鐵資料）
            StationData: {
                // 完整32站列表（依環島順序，含岡山站）
                stationList: [
                    "基隆", "七堵", "南港", "松山", "臺北", "萬華", "板橋", "樹林",
                    "桃園", "中壢", "新竹", "竹南", "苗栗", "豐原", "臺中", "彰化",
                    "員林", "斗六", "嘉義", "新營", "臺南", "岡山", "新左營", "高雄",
                    "屏東", "潮州", "臺東", "玉里", "花蓮", "蘇澳新", "宜蘭", "瑞芳"
                ],

                // ID 對應表（用於程式內部識別）
                Stations: {
                    'keelung': { index: 0, name: '基隆' },
                    'qidu': { index: 1, name: '七堵' },
                    'nangang': { index: 2, name: '南港' },
                    'songshan': { index: 3, name: '松山' },
                    'taipei': { index: 4, name: '臺北' },
                    'wanhua': { index: 5, name: '萬華' },
                    'banqiao': { index: 6, name: '板橋' },
                    'shulin': { index: 7, name: '樹林' },
                    'taoyuan': { index: 8, name: '桃園' },
                    'zhongli': { index: 9, name: '中壢' },
                    'hsinchu': { index: 10, name: '新竹' },
                    'zhunan': { index: 11, name: '竹南' },
                    'miaoli': { index: 12, name: '苗栗' },
                    'fengyuan': { index: 13, name: '豐原' },
                    'taichung': { index: 14, name: '臺中' },
                    'changhua': { index: 15, name: '彰化' },
                    'yuanlin': { index: 16, name: '員林' },
                    'douliu': { index: 17, name: '斗六' },
                    'chiayi': { index: 18, name: '嘉義' },
                    'xinying': { index: 19, name: '新營' },
                    'tainan': { index: 20, name: '臺南' },
                    'gangshan': { index: 21, name: '岡山' },
                    'zuoying': { index: 22, name: '新左營' },
                    'kaohsiung': { index: 23, name: '高雄' },
                    'pingtung': { index: 24, name: '屏東' },
                    'chaozhou': { index: 25, name: '潮州' },
                    'taitung': { index: 26, name: '臺東' },
                    'yuli': { index: 27, name: '玉里' },
                    'hualien': { index: 28, name: '花蓮' },
                    'suaoxin': { index: 29, name: '蘇澳新' },
                    'yilan': { index: 30, name: '宜蘭' },
                    'ruifang': { index: 31, name: '瑞芳' }
                },

                // 區域劃分（用於UI分組顯示）
                regions: {
                    north: [
                        { id: 'keelung', name: '基隆', displayName: '基隆' },
                        { id: 'qidu', name: '七堵', displayName: '七堵' },
                        { id: 'ruifang', name: '瑞芳', displayName: '瑞芳' },
                        { id: 'nangang', name: '南港', displayName: '南港' },
                        { id: 'songshan', name: '松山', displayName: '松山' },
                        { id: 'taipei', name: '臺北', displayName: '台北' },
                        { id: 'wanhua', name: '萬華', displayName: '萬華' },
                        { id: 'banqiao', name: '板橋', displayName: '板橋' },
                        { id: 'shulin', name: '樹林', displayName: '樹林' },
                        { id: 'taoyuan', name: '桃園', displayName: '桃園' },
                        { id: 'zhongli', name: '中壢', displayName: '中壢' },
                        { id: 'hsinchu', name: '新竹', displayName: '新竹' }
                    ],
                    central: [
                        { id: 'zhunan', name: '竹南', displayName: '竹南' },
                        { id: 'miaoli', name: '苗栗', displayName: '苗栗' },
                        { id: 'fengyuan', name: '豐原', displayName: '豐原' },
                        { id: 'taichung', name: '臺中', displayName: '台中' },
                        { id: 'changhua', name: '彰化', displayName: '彰化' },
                        { id: 'yuanlin', name: '員林', displayName: '員林' },
                        { id: 'douliu', name: '斗六', displayName: '斗六' }
                    ],
                    south: [
                        { id: 'chiayi', name: '嘉義', displayName: '嘉義' },
                        { id: 'xinying', name: '新營', displayName: '新營' },
                        { id: 'tainan', name: '臺南', displayName: '台南' },
                        { id: 'gangshan', name: '岡山', displayName: '岡山' },
                        { id: 'zuoying', name: '新左營', displayName: '新左營' },
                        { id: 'kaohsiung', name: '高雄', displayName: '高雄' },
                        { id: 'pingtung', name: '屏東', displayName: '屏東' },
                        { id: 'chaozhou', name: '潮州', displayName: '潮州' }
                    ],
                    east: [
                        { id: 'yilan', name: '宜蘭', displayName: '宜蘭' },
                        { id: 'suaoxin', name: '蘇澳新', displayName: '蘇澳新' },
                        { id: 'hualien', name: '花蓮', displayName: '花蓮' },
                        { id: 'yuli', name: '玉里', displayName: '玉里' },
                        { id: 'taitung', name: '臺東', displayName: '台東' }
                    ]
                },

                // 🎯 真實票價表：自強號全票（基於OCR數據 x2，32x32含岡山站）
                // fareMatrix[起站索引][終站索引] = 全票票價
                // 注意：岡山站（索引21）的數據是根據莒光號比例推算
                fareMatrixTzeChiang: [
                    [0,34,66,76,98,106,122,140,192,222,338,390,434,540,580,626,660,744,818,870,954,1010,1038,1056,1102,1136,890,734,526,302,246,44],
                    [34,0,44,54,76,86,100,118,174,204,320,372,416,524,564,612,646,728,802,856,940,996,1024,1044,1090,1122,888,730,522,296,240,38],
                    [66,44,0,34,34,42,56,74,130,164,282,336,378,486,526,576,614,698,772,826,912,968,996,1014,1060,1094,916,762,558,334,280,82],
                    [76,54,34,0,34,46,64,120,154,272,328,370,478,518,568,608,692,766,820,906,960,990,1008,1054,1088,922,768,566,342,288,92],
                    [98,76,34,34,0,34,34,44,100,132,254,310,354,460,500,550,592,676,750,804,892,946,976,994,1040,1074,936,784,584,360,306,114],
                    [106,86,42,46,34,0,34,34,90,124,246,302,346,454,492,542,584,670,744,798,886,940,970,988,1034,1066,942,790,592,368,316,124],
                    [122,100,56,64,34,34,0,34,74,108,232,288,332,440,480,530,572,660,732,788,876,930,960,978,1024,1058,952,800,604,380,328,138],
                    [140,118,74,120,44,34,34,0,56,90,216,272,318,426,466,516,556,646,720,774,864,920,948,966,1012,1046,964,814,616,396,342,156],
                    [192,174,130,154,100,90,74,56,0,34,166,222,268,380,418,468,510,608,682,736,826,882,912,930,976,1010,1000,852,656,442,390,208],
                    [222,204,164,272,132,124,108,90,34,0,134,194,238,352,390,440,482,580,658,712,804,860,890,908,954,988,1022,872,678,470,418,238],
                    [338,320,282,328,254,246,232,216,166,134,0,64,116,236,278,332,372,470,558,620,710,770,800,822,868,902,1108,958,772,580,526,352],
                    [390,372,336,370,310,302,288,272,222,194,64,0,52,182,224,276,320,418,506,570,666,726,756,776,826,860,1132,1000,816,628,580,404],
                    [434,416,378,478,354,346,332,318,268,238,116,52,0,130,178,230,274,376,462,528,630,690,720,740,790,826,1098,1034,852,664,618,448],
                    [540,524,486,518,460,454,440,426,380,352,236,182,130,0,48,108,158,264,354,420,528,598,630,650,700,734,1014,1118,936,754,710,556],
                    [580,564,526,568,500,492,480,466,418,390,278,224,178,48,0,60,110,222,316,380,488,558,594,616,666,702,982,1132,966,788,744,594],
                    [626,612,576,608,550,542,530,516,468,440,332,276,230,108,60,0,50,168,262,330,438,508,544,570,624,660,944,1092,1006,830,786,638],
                    [660,646,614,692,592,584,572,556,510,482,372,320,274,158,110,50,0,120,218,286,396,468,504,528,586,624,910,1060,1038,864,820,672],
                    [744,728,698,766,676,670,660,646,608,580,470,418,376,264,222,168,120,0,106,182,296,370,406,430,488,530,834,984,1116,940,898,756],
                    [818,802,772,820,750,744,732,720,682,658,558,506,462,354,316,262,218,106,0,78,204,280,318,342,400,442,760,914,1098,1008,968,830],
                    [870,856,826,906,804,798,788,774,736,712,620,570,528,420,380,330,286,182,78,0,132,210,250,274,336,378,706,864,1046,1060,1018,880],
                    [954,940,912,960,892,886,876,864,826,804,710,666,630,528,488,438,396,296,204,132,0,86,130,158,222,268,614,776,962,1138,1102,966],
                    [1010,996,968,990,946,940,930,920,882,860,770,726,690,598,558,508,468,370,280,210,86,0,44,74,144,192,546,716,906,1082,1124,1020],
                    [1038,1024,996,1008,976,970,960,948,912,890,800,756,720,630,594,544,504,406,318,250,130,44,0,34,100,152,510,684,878,1054,1094,1048],
                    [1056,1044,1014,1054,994,988,978,966,930,908,822,776,740,650,616,570,528,430,342,274,158,74,34,0,68,72,122,486,664,860,1034,1076],
                    [1102,1090,1060,1088,1040,1034,1024,1012,976,954,868,826,790,700,666,624,586,488,400,336,222,144,100,68,0,52,426,614,812,988,1030,1114],
                    [1136,1122,1094,922,1074,1066,1058,1046,1010,988,902,860,826,734,702,660,624,530,442,378,268,192,152,72,52,0,224,462,672,716,862,1132],
                    [890,888,916,768,936,942,952,964,1000,1022,1108,1132,1098,1014,982,944,910,834,760,706,614,546,510,122,426,224,0,268,494,548,704,884],
                    [734,730,762,566,784,790,800,814,852,872,958,1000,1034,1118,1132,1092,1060,984,914,864,776,716,684,486,614,462,268,0,258,314,514,602],
                    [526,522,558,342,584,592,604,616,656,678,772,816,852,936,966,1006,1038,1116,1098,1046,962,906,878,664,812,672,494,258,0,64,264,490],
                    [302,296,334,288,360,368,380,396,442,470,580,628,664,754,788,830,864,940,1008,1060,1138,1082,1054,860,988,716,548,314,64,0,206,490],
                    [246,240,280,144,306,316,328,342,390,418,526,580,618,710,744,786,820,898,968,1018,1102,1124,1094,1034,1030,862,704,514,264,206,0,412],
                    [44,38,82,92,114,124,138,156,208,238,352,404,448,556,594,638,672,756,830,880,966,1020,1048,1076,1114,1132,884,602,490,490,412,0]
                ],

                // 🎯 真實票價表：莒光號全票（基於OCR數據 x2，32x32完整含岡山站）
                // fareMatrixChuKuang[起站索引][終站索引] = 莒光號全票票價
                fareMatrixChuKuang: [
                    [0,26,50,58,74,82,94,108,148,172,260,300,334,418,448,482,510,574,630,670,736,780,802,816,852,876,688,566,406,232,188,34],
                    [26,0,34,42,58,66,78,92,134,156,246,288,320,404,434,472,498,562,620,660,726,768,790,806,840,866,684,564,402,228,186,30],
                    [50,34,0,26,26,32,44,58,100,126,216,260,292,376,406,444,474,538,596,638,704,746,768,784,818,844,708,588,430,258,216,64],
                    [58,42,26,0,26,36,50,94,118,210,252,286,370,400,438,470,534,590,632,698,742,764,778,814,840,712,592,436,264,222,72],
                    [74,58,26,26,0,26,34,76,102,196,238,272,356,386,424,456,522,578,620,688,730,752,768,802,828,722,604,450,278,236,88],
                    [82,66,32,36,26,0,26,70,94,190,232,266,350,380,418,450,516,574,616,684,726,748,762,798,824,728,610,456,284,244,96],
                    [94,78,44,50,34,26,0,58,84,180,222,256,340,370,410,442,508,566,608,676,718,740,756,790,816,736,618,466,294,252,106],
                    [108,92,58,94,76,70,58,0,44,70,166,210,244,328,358,398,430,498,556,598,666,710,732,746,782,806,744,628,476,306,264,120],
                    [148,134,100,118,102,94,84,44,0,26,128,172,206,292,324,362,394,468,526,568,638,682,704,718,754,778,772,656,506,342,300,160],
                    [172,156,126,210,196,190,180,70,26,0,102,148,184,270,302,340,372,448,508,550,620,664,686,702,736,762,790,674,524,362,322,182],
                    [260,246,216,252,238,232,222,166,128,102,0,50,90,182,214,256,288,364,430,478,548,594,618,634,670,696,856,740,596,448,406,272],
                    [300,288,260,252,238,232,222,210,172,148,50,0,40,140,172,212,246,322,390,440,514,560,584,600,638,664,874,772,630,484,448,312],
                    [334,320,292,370,356,350,340,244,206,184,90,40,0,100,136,178,212,290,358,406,486,532,556,572,610,638,848,798,656,512,478,344],
                    [418,404,376,400,386,380,370,328,292,270,182,140,100,0,38,84,122,204,274,324,408,462,486,502,540,566,782,864,722,582,548,428],
                    [448,434,406,438,424,418,410,358,324,302,214,172,136,38,0,46,86,172,244,292,376,432,460,476,514,542,758,874,746,608,574,458],
                    [482,472,444,470,456,450,442,398,362,340,256,212,178,84,46,0,38,130,202,254,338,392,420,440,482,508,728,844,776,640,606,492],
                    [510,498,474,534,522,516,508,430,394,372,288,246,212,122,86,38,0,92,168,220,306,360,388,408,452,482,704,818,802,666,634,518],
                    [574,562,538,590,578,574,566,498,468,448,364,322,290,204,172,130,92,0,82,140,228,284,312,332,376,410,644,760,860,740,694,584],
                    [630,620,596,632,620,616,608,556,526,508,430,390,358,274,244,202,168,82,0,60,158,216,244,264,308,342,586,706,848,778,746,640],
                    [670,660,638,698,688,684,676,598,568,550,478,440,406,324,292,254,220,140,60,0,100,162,192,212,260,292,544,668,808,818,786,680],
                    [736,726,704,742,730,726,718,666,638,620,548,514,486,408,376,338,306,228,158,100,0,66,100,122,172,206,474,598,742,878,852,744],
                    [780,768,746,764,752,748,740,710,682,664,594,560,532,462,432,392,360,284,216,162,66,0,34,56,112,148,422,552,700,836,868,788],
                    [802,790,768,778,768,762,756,732,704,686,618,584,556,486,460,420,388,312,244,192,100,34,0,26,78,116,394,528,678,814,846,810],
                    [816,806,784,814,802,798,790,746,718,702,634,600,572,502,476,440,408,332,264,212,122,56,26,0,56,94,374,512,664,798,830,824],
                    [852,840,818,840,828,824,816,782,754,736,670,638,610,540,514,482,452,376,308,260,172,112,78,56,0,40,330,474,626,762,796,860],
                    [876,866,844,712,722,728,736,806,778,762,696,664,638,566,542,508,482,410,342,292,206,148,116,94,40,0,296,444,598,738,770,876],
                    [688,684,708,592,604,610,618,744,772,790,856,874,848,782,758,728,704,644,586,544,474,422,394,374,330,296,0,172,356,518,554,666],
                    [566,564,588,436,450,456,466,628,656,674,740,772,798,864,874,844,818,760,706,668,598,552,528,512,474,444,172,0,206,382,422,544],
                    [406,402,430,264,278,284,294,476,506,524,596,630,656,722,746,776,802,860,848,808,742,700,678,664,626,598,356,206,0,198,242,378],
                    [232,228,258,222,236,244,252,306,342,362,448,484,512,582,608,640,666,726,778,818,878,836,814,798,762,738,518,382,198,0,50,160],
                    [188,186,216,72,88,96,106,264,300,322,406,448,478,548,574,606,634,694,746,786,852,868,846,830,796,770,554,422,242,50,0,126],
                    [34,30,64,72,114,124,138,120,160,182,272,312,344,428,458,492,518,584,640,680,744,788,810,824,860,876,666,544,378,160,126,0]
                ],

                // 車種資料與費率
                trainTypes: [
                    {
                        id: 'local',
                        name: '區間車',
                        rate: 0.6,  // 約為自強號的60%
                        color: '#607D8B',
                        description: '每站都停，票價最便宜'
                    },
                    {
                        id: 'chu-kuang',
                        name: '莒光號',
                        rate: 0.8,  // 約為自強號的80%
                        color: '#FF9800',
                        description: '部分車站停靠，速度中等'
                    },
                    {
                        id: 'tze-chiang',
                        name: '自強號',
                        rate: 1.0,  // 基準價格
                        color: '#F44336',
                        description: '主要大站停靠，速度較快'
                    },
                    {
                        id: 'puyuma',
                        name: '普悠瑪',
                        rate: 1.1,  // 約為自強號的110%
                        color: '#E91E63',
                        description: '直達特快車，票價最高'
                    }
                ]
            }
        },

        // =====================================================
        // 語音配置系統
        // =====================================================
        SpeechConfig: {
            ticketWindow: {
                welcome: "您好！歡迎光臨火車站。請問今天要從哪裡出發？",
                askDestination: (start) => `從${start}出發。請問要搭到哪一站？`,
                askTrainType: (start, end) => `您要從${start}到${end}。請問您要搭什麼車？`,
                askTicketCount: (trainType) => `了解，${trainType}。請問要買幾張票？`,
                confirm: (start, end, trainType, count, total) =>
                    `${start}到${end}，${trainType}，${count}張票。總共是${total}元，請確認。`
            },
            paying: {
                request: (amount) => `總共是${amount}元，請付款。`,
                received: (paid, change) => `收您${paid}元，找您${change}元。`
            },
            checking: {
                verify: (change) => `請確認找零${change}元是否正確。`
            },
            ticketResult: {
                success: (car, seat) =>
                    `這是您的車票，座位在${car}車${seat}號，請確認票面資訊，祝您旅途愉快！`
            }
        },

        // =====================================================
        // 場景配置系統
        // =====================================================
        SceneConfig: {
            'settings': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 settings 場景');
                    context.renderSettingsUI();
                },
                onExit: () => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 settings 場景');
                }
            },

            'ticketWindow': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 ticketWindow 場景');

                    // 🎯 預設模式檢查：如果是預設模式，保留已生成的購票資料
                    if (context.state.settings.taskType !== 'preset' ||
                        (!context.state.gameState.ticketProcess.startStation && !context.state.gameState.ticketProcess.presetTask)) {
                        // 自由購票模式或資料未生成：重置購票流程
                        Game.Debug.log('flow', '🔄 [場景管理] 重置購票流程（自由購票模式）');
                        context.state.gameState.ticketProcess = {
                            step: 0,
                            startStation: null,
                            endStation: null,
                            trainType: null,
                            ticketCount: 1,
                            unitPrice: 0,
                            totalPrice: 0,
                            // 🎯 追蹤使用者是否已點擊選擇（用於預設模式）
                            userSelectedStartStation: false,
                            userSelectedEndStation: false,
                            trainInfo: {
                                trainNumber: null,
                                departureTime: null,
                                departureDate: null,
                                seatCar: null,
                                seatNumber: null
                            }
                        };
                    } else {
                        Game.Debug.log('flow', '✅ [場景管理] 保留預設模式生成的購票資料');
                    }

                    // 🆕 普通/困難模式預設任務：重置錯誤計數（presetTask 已在 generatePresetQuestion 中生成）
                    if ((context.state.settings.difficulty === 'normal' || context.state.settings.difficulty === 'hard') &&
                        context.state.settings.taskType === 'preset') {
                        context.resetNormalModeState();
                        // 🔧 如果 presetTask 還未設定（舊題目或直接進入），才生成新任務
                        if (!context.state.gameState.ticketProcess.presetTask) {
                            Game.Debug.warn('flow', '⚠️ [場景管理] presetTask 未設定，重新生成');
                            context.generateNormalModePresetTask();
                        } else {
                            Game.Debug.log('flow', '✅ [場景管理] 使用已生成的 presetTask');
                        }
                    }

                    // 啟動 NPC 對話
                    context.DialogueManager.start();
                },
                onExit: () => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 ticketWindow 場景');
                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }
                }
            },

            'paying': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 paying 場景');
                    // 重置狀態標誌
                    context.state.gameState.isProcessingPayment = false;
                    context.state.gameState.isProcessingChange = false;
                    context.state.gameState.isProcessingSpeech = false;
                    context.state.gameState.isShowingModal = false;
                    context.state.gameState.isTransitioning = false;
                    context.state.gameState.changeCompleted = false;

                    // 設定目標金額
                    const totalPrice = context.state.gameState.ticketProcess.totalPrice;
                    context.state.gameState.currentTransaction.totalCost = totalPrice;
                    context.state.gameState.currentTransaction.amountPaid = 0;
                    context.state.gameState.currentTransaction.paidMoney = [];
                    context.state.gameState.currentTransaction.changeExpected = 0;
                    context.state.gameState.currentTransaction.changeReceived = [];

                    // 🔧 Bug 1 修復：強制重置 droppedItems，確保第 2 題付款區為空
                    context.state.gameState.droppedItems = null;
                    // 🔧 Bug 2 修復：重置提示圖片路徑，讓下一題重新生成
                    context.state.gameState.hintImagePaths = null;

                    // 🎯 確保錢包金額一定大於票價
                    const currentWalletTotal = context.state.gameState.walletTotal;
                    if (currentWalletTotal < totalPrice) {
                        Game.Debug.warn('payment', `⚠️ [錢包檢查] 錢包金額不足！當前: ${currentWalletTotal}, 需要: ${totalPrice}`);

                        // 根據難度自動調整錢包金額
                        let newWalletAmount;
                        if (context.state.settings.difficulty === 'easy') {
                            // 簡單模式：1.5 ~ 2 倍
                            const minWallet = Math.ceil(totalPrice * 1.5);
                            const maxWallet = totalPrice * 2;
                            newWalletAmount = Math.ceil((minWallet + Math.random() * (maxWallet - minWallet)) / 10) * 10;
                        } else {
                            // 普通/困難模式：固定分層上限，讓找零金額更隨機（模仿 A3/A4）
                            const walletCap =
                                totalPrice <= 100 ? 300 :
                                totalPrice <= 300 ? 700 :
                                totalPrice <= 600 ? 1300 :
                                totalPrice + 500;
                            const minWallet = totalPrice + 10;
                            const maxWallet = walletCap;
                            newWalletAmount = Math.ceil((minWallet + Math.random() * (maxWallet - minWallet)) / 10) * 10;
                        }

                        // 確保新錢包金額大於票價（防止進位問題）
                        if (newWalletAmount < totalPrice) {
                            newWalletAmount = Math.ceil(totalPrice / 10) * 10 + 10;
                        }

                        Game.Debug.log('payment', `✅ [錢包調整] 自動調整錢包金額為: ${newWalletAmount}`);

                        // 更新設定並重新初始化錢包
                        context.state.settings.walletAmount = newWalletAmount;
                        context.initializeWallet();
                    }

                    // 渲染付款場景
                    context.renderPaymentSceneUI();
                },
                onExit: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 paying 場景');
                    if (context.audio && context.audio.successSound) {
                        context.audio.successSound.onended = null;
                    }
                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }
                    if (context.state.sceneListeners) {
                        context.state.sceneListeners.forEach(({element, event, handler}) => {
                            const el = document.querySelector(element);
                            if (el) el.removeEventListener(event, handler);
                        });
                        context.state.sceneListeners = [];
                    }
                }
            },

            'changeCalculation': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 changeCalculation 場景');
                    context.renderChangeCalculationSceneUI();
                },
                onExit: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 changeCalculation 場景');
                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }
                }
            },

            'checking': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 checking 場景');
                    context.renderChangeVerificationUI();
                },
                onExit: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 checking 場景');
                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }
                }
            },

            'ticketResult': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 ticketResult 場景');
                    // 生成車票資訊
                    context.generateTicketInfo();
                    // 渲染車票展示
                    context.renderTicketResultUI();

                    // 🆕 輔助點擊模式：建立動作佇列，等待用戶點擊
                    if (context.state.settings.clickMode && context.state.gameState.clickModeState.enabled) {
                        context.ClickMode.buildActionQueue('ticketResult');
                        // 設置等待點擊狀態（不自動執行）
                        context.state.gameState.clickModeState.waitingForClick = true;
                    }
                },
                onExit: () => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 ticketResult 場景');
                }
            }
        },

        // =====================================================
        // 🆕 輔助點擊模式管理器
        // =====================================================
        ClickMode: {
            // 初始化（歡迎場景）
            initForWelcome() {
                const settings = Game.state.settings;
                const clickState = Game.state.gameState.clickModeState;

                if (!settings.clickMode) {
                    return; // 未啟用，直接返回
                }

                Game.Debug.log('assist', '[ClickMode] 初始化輔助點擊模式（歡迎場景）');

                clickState.enabled = true;
                clickState.active = false;
                clickState.currentPhase = 'welcome';
                clickState.waitingForStart = true;

                // 綁定全域點擊事件
                this.bind();

                // 顯示提示
                this.showPrompt('點擊任意處開始');
            },

            // 初始化（測驗題目）
            initForQuestion() {
                const settings = Game.state.settings;
                const clickState = Game.state.gameState.clickModeState;

                if (!settings.clickMode) {
                    return;
                }

                Game.Debug.log('assist', '[ClickMode] 初始化輔助點擊模式（新題目）');

                clickState.enabled = true;
                clickState.active = true; // 直接啟動
                clickState.currentPhase = null;

                // 綁定全域點擊事件
                this.bind();
            },

            // 綁定全域點擊事件
            bind() {
                if (this._boundHandler) return; // 防止重複綁定

                // 建立輔助點擊遮罩（全程覆蓋，直到 click mode 結束）
                if (!document.getElementById('click-exec-overlay')) {
                    const _ov = document.createElement('div');
                    _ov.id = 'click-exec-overlay';
                    const _tbEl = document.querySelector('.title-bar');
                    const _tbBottom = _tbEl ? Math.round(_tbEl.getBoundingClientRect().bottom) : 60;
                    _ov.style.cssText = `position:fixed;top:${_tbBottom}px;left:0;right:0;bottom:0;z-index:10100;pointer-events:all;touch-action:none;background:transparent;`;
                    document.body.appendChild(_ov);
                }

                this._boundHandler = (e) => this.handleClick(e);
                // 使用捕獲階段確保最早攔截
                document.addEventListener('click', this._boundHandler, true);
                Game.Debug.log('assist', '[ClickMode] 全域點擊監聽器已綁定');
            },

            // 解除綁定
            unbind() {
                document.getElementById('click-exec-overlay')?.remove();
                if (this._boundHandler) {
                    document.removeEventListener('click', this._boundHandler, true);
                    this._boundHandler = null;
                    Game.Debug.log('assist', '[ClickMode] 全域點擊監聽器已解除');
                }
            },

            // 🆕 啟用點擊模式並設置視覺延遲（參考 A5）
            enableClickModeWithVisualDelay(source = 'unknown') {
                const clickState = Game.state.gameState.clickModeState;

                Game.Debug.log('assist', `[ClickMode] 🔒 視覺元素出現 (來源: ${source})，鎖定點擊`);

                // 1. 立即鎖定點擊
                clickState.waitingForClick = false;

                // 2. 清除之前的計時器（防止重複調用）
                if (clickState._visualDelayTimer) {
                    Game.TimerManager.clearTimeout(clickState._visualDelayTimer);
                    clickState._visualDelayTimer = null;
                }

                // 3. 檢測視覺提示是否已經存在
                const existingHintElement = document.querySelector(
                    '.region-btn-hint, .station-btn-hint, .confirm-btn-hint, .train-type-hint, .step-hint'
                );

                if (existingHintElement) {
                    // 🎯 視覺提示已存在，立即解鎖
                    Game.Debug.log('assist', '[ClickMode] 🔍 視覺提示已存在，立即解鎖');
                    clickState.waitingForClick = true;
                    clickState.clickReadyTime = Date.now() - 1000; // 時間回溯技巧
                    clickState.isExecuting = false;
                } else {
                    // ⏱️ 視覺提示尚未出現，設置 0.5秒 延遲
                    Game.Debug.log('assist', '[ClickMode] ⏱️ 視覺提示尚未出現，0.5秒後解鎖');
                    clickState._visualDelayTimer = Game.TimerManager.setTimeout(() => {
                        Game.Debug.log('assist', '[ClickMode] 🟢 0.5秒已過，解除鎖定');
                        clickState.waitingForClick = true;
                        clickState.clickReadyTime = Date.now() - 1000;
                        clickState.isExecuting = false;
                        clickState._visualDelayTimer = null;
                    }, 500, 'clickMode');

                    // 🛡️ 安全網：1.5秒後強制解鎖（防止永久鎖定）
                    Game.TimerManager.setTimeout(() => {
                        if (clickState && !clickState.waitingForClick) {
                            Game.Debug.log('assist', '[ClickMode] ⚠️ 無視覺提示，啟動安全網解鎖（1.5秒）');
                            clickState.waitingForClick = true;
                            clickState.clickReadyTime = Date.now() - 1000;
                            clickState.isExecuting = false;
                        }
                    }, 1500, 'clickMode');
                }
            },

            // 點擊事件處理
            handleClick(e) {
                const clickState = Game.state.gameState.clickModeState;

                // 🔧 檢查是否為自動化觸發的點擊
                if (clickState.isAutomatedClick) {
                    clickState.isAutomatedClick = false; // 重置標記
                    Game.Debug.log('assist', '[ClickMode] 自動化點擊，不攔截');
                    return; // 不攔截，讓按鈕的原生事件處理器執行
                }

                // 程式觸發的點擊直接放行
                if (!e.isTrusted) return;

                // 篩選不應被攔截的點擊
                if (e.target.closest('.back-to-menu-btn') ||
                    e.target.closest('.modal-overlay') ||
                    e.target.closest('.modal-content') ||
                    e.target.closest('#my-wallet-modal') ||
                    e.target.closest('#custom-wallet-modal') ||
                    e.target.closest('#number-input-popup')) {
                    Game.Debug.log('assist', '[ClickMode] 點擊在模態視窗或UI按鈕上，不攔截');
                    return;
                }

                // 檢查等待開始狀態
                if (clickState.waitingForStart) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleStartClick();
                    return;
                }

                // 檢查等待繼續狀態
                if (clickState.waitingForClick) {
                    // 🆕 防快速點擊機制升級：600ms（參考 A5）
                    const now = Date.now();
                    const readyTime = clickState.clickReadyTime || 0;
                    const timeSinceReady = now - readyTime;

                    if (timeSinceReady < 600) {
                        Game.Debug.log('assist', `[ClickMode] ⏳ 點擊過快，忽略 (${timeSinceReady}ms < 600ms)`);
                        return;
                    }

                    e.preventDefault();
                    e.stopPropagation();
                    this.handleContinueClick();
                    return;
                }
            },

            // 處理開始點擊
            handleStartClick() {
                Game.Debug.log('assist', '[ClickMode] 處理開始點擊');

                const clickState = Game.state.gameState.clickModeState;
                clickState.waitingForStart = false;
                clickState.active = true;
                this.hidePrompt();

                Game.Debug.log('assist', '[ClickMode] 輔助點擊模式已啟動');

                // 🆕 如果已經建立了動作佇列，立即執行
                if (clickState.actionQueue && clickState.actionQueue.length > 0) {
                    Game.TimerManager.setTimeout(() => {
                        this.executeNext();
                    }, 500, 'clickMode');
                }
            },

            // 處理繼續點擊
            handleContinueClick() {
                Game.Debug.log('assist', '[ClickMode] 處理繼續點擊');

                const clickState = Game.state.gameState.clickModeState;

                clickState.waitingForClick = false;
                this.hidePrompt();

                // 根據當前階段分別處理
                if (clickState.currentPhase === 'payment' && clickState.paymentQueue) {
                    // 付款階段：放置一個金錢
                    this.executeNextPayment();
                } else if (clickState.currentPhase === 'payment' && !clickState.paymentQueue &&
                           clickState.currentStep >= clickState.actionQueue.length) {
                    // 🎯 payMoney 動作已執行完、所有金錢放置完成，等學生點擊確認付款
                    const confirmBtn = document.getElementById('confirm-payment-btn');
                    if (confirmBtn) {
                        clickState.isAutomatedClick = true;
                        confirmBtn.click();
                        Game.Debug.log('assist', '[ClickMode] 已點擊確認付款按鈕');
                    }
                } else if (clickState.currentPhase === 'change' && clickState.changeQueue) {
                    // 找零階段：放置一個找零
                    this.executeNextChange();
                } else if (clickState.currentPhase === 'change' && !clickState.changeQueue &&
                           clickState.currentStep >= clickState.actionQueue.length) {
                    // 🎯 所有找零放置完成，等學生點擊確認找零
                    const confirmBtn = document.getElementById('confirm-change-btn');
                    if (confirmBtn) {
                        clickState.isAutomatedClick = true;
                        confirmBtn.click();
                        Game.Debug.log('assist', '[ClickMode] 已點擊確認找零按鈕');
                    }
                } else {
                    // 🔧 其他階段：檢查當前階段的所有動作是否已完成
                    if (clickState.currentStep >= clickState.actionQueue.length) {
                        Game.Debug.log('assist', '[ClickMode] 當前階段已完成，等待場景轉換，忽略點擊');
                        return;
                    }

                    // 其他階段：執行下一個動作
                    Game.TimerManager.setTimeout(() => {
                        this.executeNext();
                    }, 300, 'clickMode');
                }
            },

            // 建立動作佇列
            buildActionQueue(phase) {
                Game.Debug.log('assist', '[ClickMode] 建立動作佇列:', phase);

                const clickState = Game.state.gameState.clickModeState;
                clickState.currentPhase = phase;
                clickState.currentStep = 0;
                clickState.actionQueue = [];

                switch(phase) {
                    case 'askStart':
                        // 選擇出發站 + 確認（分兩次點擊）
                        clickState.actionQueue = [
                            { type: 'selectStation', data: 'start' },
                            { type: 'confirmStation', data: 'start' }
                        ];
                        break;

                    case 'askEnd':
                        // 選擇抵達站 + 確認（分兩次點擊）
                        clickState.actionQueue = [
                            { type: 'selectStation', data: 'end' },
                            { type: 'confirmStation', data: 'end' }
                        ];
                        break;

                    case 'askType':
                        // 選擇車種
                        clickState.actionQueue = [{ type: 'selectTrainType', data: null }];
                        break;

                    case 'askCount':
                        // 選擇張數
                        clickState.actionQueue = [{ type: 'selectTicketCount', data: null }];
                        break;

                    case 'confirm':
                        // 確認購票
                        clickState.actionQueue = [{ type: 'confirmOrder', data: null }];
                        break;

                    case 'payment':
                        // 付款（分次執行）
                        clickState.actionQueue = [{ type: 'payMoney', data: null }];
                        break;

                    case 'change':
                        // 找零（分次執行）
                        clickState.actionQueue = [{ type: 'selectChange', data: null }];
                        break;

                    case 'ticketResult':
                        // 拿取車票/下一題/完成
                        clickState.actionQueue = [{ type: 'clickNextButton', data: null }];
                        break;
                }

                Game.Debug.log('assist', '[ClickMode] 動作佇列已建立:', clickState.actionQueue);

                // 🔧 所有階段都等待用戶點擊，不自動執行
                // 付款和找零階段也需要等待用戶點擊才開始
                if (clickState.active && (phase === 'payment' || phase === 'change')) {
                    clickState.waitingForClick = true;
                    Game.Debug.log('assist', '[ClickMode] 等待用戶點擊開始', phase, '階段');
                }

                // 🆕 簡單模式：啟動視覺延遲機制（參考 A5）
                if (Game.state.settings.difficulty === 'easy' && clickState.active) {
                    this.enableClickModeWithVisualDelay(`BuildQueue-${phase}`);
                }
            },

            // 執行下一個動作
            executeNext() {
                const clickState = Game.state.gameState.clickModeState;

                if (!clickState.active) {
                    Game.Debug.log('assist', '[ClickMode] 模式未啟用，停止執行');
                    return;
                }

                if (clickState.currentStep >= clickState.actionQueue.length) {
                    Game.Debug.log('assist', '[ClickMode] 所有動作已完成，等待場景轉換');
                    // 🔧 設置等待點擊狀態，讓用戶可以點擊等待語音播放完成並轉換到下一步
                    clickState.waitingForClick = true;

                    // 🆕 簡單模式：啟動視覺延遲機制（參考 A5）
                    if (Game.state.settings.difficulty === 'easy') {
                        this.enableClickModeWithVisualDelay('ExecuteNext-Completed');
                    }
                    return;
                }

                const action = clickState.actionQueue[clickState.currentStep];
                Game.Debug.log('assist', `[ClickMode] 執行動作 ${clickState.currentStep + 1}/${clickState.actionQueue.length}:`, action.type);

                clickState.currentStep++;
                this.executeAction(action);
            },

            // 執行具體動作
            executeAction(action) {
                switch(action.type) {
                    case 'selectStation':
                        this.autoSelectStation(action.data);
                        break;
                    case 'confirmStation':
                        this.autoConfirmStation(action.data);
                        break;
                    case 'selectTrainType':
                        this.autoSelectTrainType();
                        break;
                    case 'selectTicketCount':
                        this.autoSelectTicketCount();
                        break;
                    case 'confirmOrder':
                        this.autoConfirmOrder();
                        break;
                    case 'payMoney':
                        this.autoPayMoney();
                        break;
                    case 'selectChange':
                        this.autoSelectChange();
                        break;
                    case 'clickNextButton':
                        this.manualClickNextButton();
                        break;
                    default:
                        Game.Debug.warn('assist', '[A6-ClickMode] 未知動作類型:', action.type);
                        this.showWaitPrompt();
                }
            },

            // 🆕 自動選擇車站
            autoSelectStation(type) {
                Game.Debug.log('assist', '[ClickMode] 自動選擇車站:', type);

                const ticketProcess = Game.state.gameState.ticketProcess;
                if (!ticketProcess) {
                    Game.Debug.warn('assist', '[A6-ClickMode] 找不到購票流程資料');
                    return;
                }

                // 🔧 簡單模式直接從 ticketProcess 讀取，普通/困難模式從 presetTask 讀取
                const targetStation = type === 'start' ?
                    (ticketProcess.presetTask ? ticketProcess.presetTask.startStation : ticketProcess.startStation) :
                    (ticketProcess.presetTask ? ticketProcess.presetTask.endStation : ticketProcess.endStation);

                const stationButtons = document.querySelectorAll('.station-btn');

                let targetButton = null;
                for (const btn of stationButtons) {
                    if (btn.dataset.station === targetStation) {
                        targetButton = btn;
                        break;
                    }
                }

                if (targetButton) {
                    // 只點擊車站按鈕，不自動確認
                    Game.TimerManager.setTimeout(() => {
                        // 🔧 設置自動化點擊標記
                        const clickState = Game.state.gameState.clickModeState;
                        clickState.isAutomatedClick = true;

                        targetButton.click();
                        Game.Debug.log('assist', '[ClickMode] 已點擊車站:', targetStation);

                        // 設置等待下一次點擊
                        clickState.waitingForClick = true;
                        Game.Debug.log('assist', '[ClickMode] 等待用戶點擊以確認車站');

                        // 🆕 簡單模式：啟動視覺延遲機制（參考 A5）
                        if (Game.state.settings.difficulty === 'easy') {
                            Game.ClickMode.enableClickModeWithVisualDelay('AutoSelectStation');
                        }
                    }, 800, 'clickMode');
                } else {
                    Game.Debug.warn('assist', '[A6-ClickMode] 找不到車站按鈕');
                }
            },

            // 🆕 自動確認車站
            autoConfirmStation(type) {
                Game.Debug.log('assist', '[ClickMode] 自動確認車站:', type);

                const confirmBtnId = type === 'start' ? 'confirm-departure-btn' : 'confirm-arrival-btn';
                const confirmBtn = document.getElementById(confirmBtnId);

                if (confirmBtn) {
                    Game.TimerManager.setTimeout(() => {
                        // 🔧 設置自動化點擊標記
                        const clickState = Game.state.gameState.clickModeState;
                        clickState.isAutomatedClick = true;

                        confirmBtn.click();
                        Game.Debug.log('assist', '[ClickMode] 已點擊確認按鈕:', confirmBtnId);
                    }, 800, 'clickMode');
                } else {
                    Game.Debug.warn('assist', '[A6-ClickMode] 找不到確認按鈕:', confirmBtnId);
                }
            },

            // 🆕 自動選擇車種
            autoSelectTrainType() {
                Game.Debug.log('assist', '[ClickMode] 自動選擇車種');

                const ticketProcess = Game.state.gameState.ticketProcess;
                if (!ticketProcess) {
                    Game.Debug.warn('assist', '[A6-ClickMode] 找不到購票流程資料');
                    return;
                }

                // 🔧 簡單模式直接從 ticketProcess 讀取，普通/困難模式從 presetTask 讀取
                const targetType = ticketProcess.presetTask ? ticketProcess.presetTask.trainType : ticketProcess.trainType;
                const trainTypeCard = document.querySelector(`.train-type-card[data-type="${targetType}"]`);

                if (trainTypeCard) {
                    Game.TimerManager.setTimeout(() => {
                        // 🔧 防止步驟已前進後才觸發
                        const currentStepName = Game.DialogueManager.steps[Game.DialogueManager.currentStep];
                        if (currentStepName !== 'askType') {
                            Game.Debug.warn('assist', '⚠️ [ClickMode] autoSelectTrainType timeout 已過期，當前步驟:', currentStepName);
                            return;
                        }

                        // 🔧 設置自動化點擊標記
                        const clickState = Game.state.gameState.clickModeState;
                        clickState.isAutomatedClick = true;

                        trainTypeCard.click();
                        Game.Debug.log('assist', '[ClickMode] 已點擊車種:', targetType);
                    }, 800, 'clickMode');
                } else {
                    Game.Debug.warn('assist', '[A6-ClickMode] 找不到車種卡片');
                }
            },

            // 🆕 自動選擇張數
            autoSelectTicketCount() {
                Game.Debug.log('assist', '[ClickMode] 自動選擇張數');

                const ticketProcess = Game.state.gameState.ticketProcess;
                if (!ticketProcess) {
                    Game.Debug.warn('assist', '[A6-ClickMode] 找不到購票流程資料');
                    return;
                }

                // 🔧 簡單模式直接從 ticketProcess 讀取，普通/困難模式從 presetTask 讀取
                const targetCount = ticketProcess.presetTask ? ticketProcess.presetTask.ticketCount : ticketProcess.ticketCount;

                // 調整到目標張數
                const currentCount = Game.state.gameState.ticketProcess.ticketCount;
                const diff = targetCount - currentCount;

                if (diff > 0) {
                    // 需要增加
                    const increaseBtn = document.getElementById('count-plus');
                    if (increaseBtn) {
                        let clickCount = 0;
                        const doClick = () => {
                            if (clickCount < diff) {
                                // 🔧 設置自動化點擊標記
                                const clickState = Game.state.gameState.clickModeState;
                                clickState.isAutomatedClick = true;

                                increaseBtn.click();
                                clickCount++;
                                Game.TimerManager.setTimeout(doClick, 300, 'clickMode');
                            } else {
                                // 點擊確認按鈕
                                Game.TimerManager.setTimeout(() => {
                                    const confirmBtn = document.getElementById('confirm-count-btn');
                                    if (confirmBtn) {
                                        // 🔧 設置自動化點擊標記
                                        const clickState = Game.state.gameState.clickModeState;
                                        clickState.isAutomatedClick = true;

                                        confirmBtn.click();
                                        Game.Debug.log('assist', '[ClickMode] 已點擊確認張數按鈕');
                                    }
                                }, 500, 'clickMode');
                            }
                        };
                        Game.TimerManager.setTimeout(doClick, 300, 'clickMode');
                    }
                } else if (diff < 0) {
                    // 需要減少
                    const decreaseBtn = document.getElementById('count-minus');
                    if (decreaseBtn) {
                        let clickCount = 0;
                        const doClick = () => {
                            if (clickCount < Math.abs(diff)) {
                                // 🔧 設置自動化點擊標記
                                const clickState = Game.state.gameState.clickModeState;
                                clickState.isAutomatedClick = true;

                                decreaseBtn.click();
                                clickCount++;
                                Game.TimerManager.setTimeout(doClick, 300, 'clickMode');
                            } else {
                                // 點擊確認按鈕
                                Game.TimerManager.setTimeout(() => {
                                    const confirmBtn = document.getElementById('confirm-count-btn');
                                    if (confirmBtn) {
                                        // 🔧 設置自動化點擊標記
                                        const clickState = Game.state.gameState.clickModeState;
                                        clickState.isAutomatedClick = true;

                                        confirmBtn.click();
                                        Game.Debug.log('assist', '[ClickMode] 已點擊確認張數按鈕');
                                    }
                                }, 500, 'clickMode');
                            }
                        };
                        Game.TimerManager.setTimeout(doClick, 300, 'clickMode');
                    }
                } else {
                    // 張數正確，直接確認
                    Game.TimerManager.setTimeout(() => {
                        const confirmBtn = document.getElementById('confirm-count-btn');
                        if (confirmBtn) {
                            // 🔧 設置自動化點擊標記
                            const clickState = Game.state.gameState.clickModeState;
                            clickState.isAutomatedClick = true;

                            confirmBtn.click();
                            Game.Debug.log('assist', '[ClickMode] 已點擊確認張數按鈕（張數已正確）');
                        } else {
                            Game.Debug.warn('assist', '[A6-ClickMode] 找不到確認張數按鈕');
                        }
                    }, 800, 'clickMode');
                }
            },

            // 🆕 自動確認訂單
            autoConfirmOrder() {
                Game.Debug.log('assist', '[ClickMode] 自動確認訂單');

                const confirmBtn = document.getElementById('confirm-order-btn');
                if (confirmBtn) {
                    Game.TimerManager.setTimeout(() => {
                        // 🔧 設置自動化點擊標記
                        const clickState = Game.state.gameState.clickModeState;
                        clickState.isAutomatedClick = true;

                        confirmBtn.click();
                        Game.Debug.log('assist', '[ClickMode] 已確認訂單');
                    }, 500, 'clickMode');
                } else {
                    Game.Debug.warn('assist', '[A6-ClickMode] 找不到確認按鈕');
                }
            },

            // 🆕 自動付款（分次執行）
            autoPayMoney() {
                Game.Debug.log('assist', '[ClickMode] 準備付款');

                const totalCost = Game.state.gameState.currentTransaction.totalCost;
                const playerWallet = Game.state.gameState.playerWallet;

                // 使用最佳付款方案
                const paymentSolution = Game.calculateOptimalPayment(totalCost, playerWallet);

                if (!paymentSolution || paymentSolution.length === 0) {
                    Game.Debug.warn('assist', '[A6-ClickMode] 找不到付款方案');
                    return;
                }

                Game.Debug.log('assist', '[ClickMode] 使用付款方案:', paymentSolution);

                const clickState = Game.state.gameState.clickModeState;
                clickState.paymentQueue = paymentSolution;
                clickState.paymentIndex = 0;

                Game.Debug.log('assist', '[ClickMode] 付款序列已準備，共', paymentSolution.length, '個金錢');

                // 🔧 直接執行第一次付款（不需要再點擊一次）
                Game.TimerManager.setTimeout(() => {
                    this.executeNextPayment();
                }, 500, 'clickMode');
            },

            // 🆕 手動點擊下一題或完成按鈕（不自動執行）
            manualClickNextButton() {
                Game.Debug.log('assist', '[ClickMode] 手動點擊下一題/完成按鈕');

                // 檢查是否有下一題按鈕
                const nextBtn = document.getElementById('next-question-btn');
                const finishBtn = document.getElementById('finish-btn');

                if (nextBtn) {
                    Game.TimerManager.setTimeout(() => {
                        // 🔧 設置自動化點擊標記
                        const clickState = Game.state.gameState.clickModeState;
                        clickState.isAutomatedClick = true;

                        nextBtn.click();
                        Game.Debug.log('assist', '[ClickMode] 已點擊下一題按鈕');
                    }, 500, 'clickMode');
                } else if (finishBtn) {
                    Game.TimerManager.setTimeout(() => {
                        // 🔧 設置自動化點擊標記
                        const clickState = Game.state.gameState.clickModeState;
                        clickState.isAutomatedClick = true;

                        finishBtn.click();
                        Game.Debug.log('assist', '[ClickMode] 已點擊完成按鈕');
                    }, 500, 'clickMode');
                } else {
                    Game.Debug.warn('assist', '[A6-ClickMode] 找不到下一題或完成按鈕');
                }
            },

            // 🆕 自動找零
            autoSelectChange() {
                Game.Debug.log('assist', '[ClickMode] 準備找零');

                const transaction = Game.state.gameState.currentTransaction;
                if (!transaction) {
                    Game.Debug.warn('assist', '[A6-ClickMode] 找不到交易資料');
                    return;
                }

                const changeAmount = transaction.changeExpected;
                const difficulty = Game.state.settings.difficulty;

                Game.Debug.log('assist', '[ClickMode] 找零金額:', changeAmount, '難度:', difficulty);

                if (changeAmount <= 0) {
                    // 不需找零，直接自動點擊確認
                    Game.Debug.log('assist', '[ClickMode] 不需找零，自動確認');
                    Game.TimerManager.setTimeout(() => {
                        const confirmBtn = document.getElementById('confirm-change-btn');
                        if (confirmBtn) {
                            const clickState = Game.state.gameState.clickModeState;
                            clickState.isAutomatedClick = true;
                            confirmBtn.click();
                        }
                    }, 1000, 'clickMode');
                    return;
                }

                if (difficulty === 'easy') {
                    // 🔧 簡單模式：建立找零佇列，逐一放置到「我的錢包」
                    Game.Debug.log('assist', '[ClickMode] 簡單模式 - 逐一放置找零');
                    const changeList = Game.state.gameState.easyChangeList;
                    if (!changeList || changeList.length === 0) {
                        Game.Debug.warn('assist', '[A6-ClickMode] 找不到找零清單');
                        return;
                    }

                    const clickState = Game.state.gameState.clickModeState;
                    clickState.changeQueue = changeList.map(item => item.value);
                    clickState.changeIndex = 0;
                    clickState.currentPhase = 'change';

                    // 執行第一次放置
                    Game.TimerManager.setTimeout(() => {
                        this.executeNextChange();
                    }, 500, 'clickMode');
                } else {
                    // 🔧 普通/困難模式：需要選擇正確的找零選項（暫不支援輔助點擊）
                    Game.Debug.warn('assist', '[A6-ClickMode] 普通/困難模式的找零驗證暫不支援輔助點擊');
                }
            },

            // 顯示提示
            showPrompt(text) {
                const clickState = Game.state.gameState.clickModeState;
                if (clickState.promptVisible) return;

                const prompt = document.createElement('div');
                prompt.id = 'click-mode-prompt';
                prompt.className = 'click-mode-prompt';
                prompt.innerHTML = `
                    <div class="prompt-content">
                        <div class="prompt-icon">👆</div>
                        <div class="prompt-text">${text}</div>
                    </div>
                `;

                document.body.appendChild(prompt);
                clickState.promptVisible = true;

                Game.TimerManager.setTimeout(() => {
                    prompt.classList.add('visible');
                }, 10, 'uiAnimation');
            },

            // 隱藏提示
            hidePrompt() {
                const prompt = document.getElementById('click-mode-prompt');
                if (prompt) {
                    prompt.classList.remove('visible');
                    Game.TimerManager.setTimeout(() => {
                        prompt.remove();
                    }, 300, 'uiAnimation');
                }

                Game.state.gameState.clickModeState.promptVisible = false;
            },

            // 顯示等待提示
            showWaitPrompt() {
                const clickState = Game.state.gameState.clickModeState;
                clickState.waitingForClick = true;
                this.showPrompt('點擊任意處繼續');
            },

            // 🆕 執行下一次付款
            executeNextPayment() {
                const clickState = Game.state.gameState.clickModeState;
                const paymentQueue = clickState.paymentQueue;

                // 🔧 修復：檢查 paymentQueue 是否為 null
                if (!paymentQueue) {
                    Game.Debug.log('assist', '[ClickMode] paymentQueue 為 null，跳過執行');
                    return;
                }

                const currentIndex = clickState.paymentIndex;

                Game.Debug.log('assist', '[ClickMode] executeNextPayment - 當前索引:', currentIndex, '/', paymentQueue.length);

                if (currentIndex >= paymentQueue.length) {
                    Game.Debug.log('assist', '[ClickMode] 所有金錢已放置完成');
                    clickState.paymentQueue = null;
                    clickState.paymentIndex = 0;
                    return;
                }

                const moneyValue = paymentQueue[currentIndex]; // 這是一個數字，如 1000

                // 找到對應的錢幣在錢包中的DOM元素
                const walletArea = document.getElementById('wallet-display');
                const moneyItems = walletArea.querySelectorAll('.money-item');

                let moneyItem = null;
                for (const item of moneyItems) {
                    const itemValue = parseInt(item.dataset.value);
                    const itemIndex = item.dataset.index;
                    // 檢查該錢幣是否還在顯示中（未被使用）
                    if (itemValue === moneyValue && item.style.display !== 'none') {
                        moneyItem = item;
                        break;
                    }
                }

                Game.Debug.log('assist', '[ClickMode] 尋找金額:', moneyValue, '找到:', moneyItem);

                if (moneyItem) {
                    const index = moneyItem.dataset.index;
                    const position = currentIndex;

                    // 直接更新狀態（模仿拖放邏輯）
                    if (!Game.state.gameState.droppedItems) {
                        Game.state.gameState.droppedItems = [];
                    }

                    Game.state.gameState.droppedItems[position] = { value: moneyValue, index };
                    Game.state.gameState.currentTransaction.amountPaid += moneyValue;

                    if (!Game.state.gameState.currentTransaction.paidMoney) {
                        Game.state.gameState.currentTransaction.paidMoney = [];
                    }
                    // 🆕 儲存 imagePath 以避免重新渲染時圖片變化
                    const moneyData = Game.state.gameState.playerWallet[parseInt(index)];
                    const imagePath = Game.getRandomMoneyImage(moneyData);
                    Game.state.gameState.currentTransaction.paidMoney.push({ index, value: moneyValue, imagePath });

                    Game.Debug.log('assist', '[ClickMode] 已放置金錢:', moneyValue);

                    // 🎙️ 播放語音：你付了×元（累計總額）
                    const totalPaid = Game.state.gameState.currentTransaction.amountPaid;
                    Game.Speech.speak(`你付了${totalPaid}元`);

                    // 隱藏錢包中的該錢幣
                    moneyItem.style.display = 'none';

                    // 🔄 重新渲染付款區
                    const paymentArea = document.getElementById('payment-area');
                    const confirmBtn = document.getElementById('confirm-payment-btn');
                    const totalCost = Game.state.gameState.currentTransaction.totalCost;

                    if (Game.state.settings.difficulty === 'easy') {
                        // 簡單模式：重新生成提示HTML
                        const playerWallet = Game.state.gameState.playerWallet;
                        const optimalPayment = Game.calculateOptimalPayment(totalCost, playerWallet);
                        paymentArea.innerHTML = Game.generatePaymentHintHTML(optimalPayment);
                        Game.setupHintDropZones(paymentArea, Game.state.gameState.currentTransaction.amountPaid, Game.state.gameState.currentTransaction.paidMoney, confirmBtn);
                    } else {
                        // 普通/困難模式：顯示實際付款的錢幣
                        Game.renderPaymentMoney(paymentArea, Game.state.gameState.currentTransaction.paidMoney);
                    }

                    Game._updateCurrentPaymentBadge();

                    // 更新付款按鈕狀態
                    Game.updatePaymentButton();
                    Game.updateWalletTotalDisplay();

                    // 檢查是否完成付款
                    if (totalPaid >= totalCost) {
                        Game.Debug.log('assist', '✅ [ClickMode] 付款完成');

                        // 更新確認按鈕
                        const confirmBtn = document.getElementById('confirm-payment-btn');
                        if (confirmBtn) {
                            confirmBtn.disabled = false;
                            confirmBtn.style.cursor = 'pointer';
                            confirmBtn.style.opacity = '1';
                            confirmBtn.textContent = '確認付款';
                            confirmBtn.classList.add('ready');
                        }

                        clickState.paymentQueue = null;
                        clickState.paymentIndex = 0;

                        // 🎯 簡單+輔助點擊：不自動點擊，等學生點擊後再確認付款
                        this.enableClickModeWithVisualDelay('PaymentConfirm');
                        Game.Debug.log('assist', '[ClickMode] 等待學生點擊確認付款按鈕');
                    } else {
                        // 還有更多金錢要放置
                        clickState.paymentIndex++;
                        clickState.waitingForClick = true;
                        // 🔇 不顯示提示彈窗（用戶要求移除）
                        // this.showPrompt('點擊任意處繼續');
                        Game.Debug.log('assist', '[ClickMode] 等待用戶點擊放置下一個金錢');

                        // 🆕 簡單模式：啟動視覺延遲機制（參考 A5）
                        if (Game.state.settings.difficulty === 'easy') {
                            this.enableClickModeWithVisualDelay('ExecuteNextPayment');
                        }
                    }
                } else {
                    Game.Debug.warn('assist', '[A6-ClickMode] 找不到對應的錢幣，金額:', moneyValue);
                }
            },

            // 🆕 執行下一次找零（逐一將金錢從店家找零放入我的錢包）
            executeNextChange() {
                const clickState = Game.state.gameState.clickModeState;
                const changeQueue = clickState.changeQueue;

                if (!changeQueue) return;

                const currentIndex = clickState.changeIndex;
                Game.Debug.log('assist', `[ClickMode] executeNextChange - 放置第 ${currentIndex + 1}/${changeQueue.length} 個找零`);

                if (currentIndex >= changeQueue.length) {
                    // 全部放完，顯示按鈕，等學生點擊確認
                    clickState.changeQueue = null;
                    clickState.changeIndex = 0;

                    const confirmBtn = document.getElementById('confirm-change-btn');
                    if (confirmBtn) {
                        confirmBtn.disabled = false;
                        confirmBtn.style.display = 'block';
                    }
                    // 🎯 簡單+輔助點擊：顯示「點這裡」提示動畫，等學生點擊後再確認找零
                    Game.TimerManager.setTimeout(() => {
                        Game.highlightConfirmButton('confirm-change-btn');
                    }, 300, 'hint');
                    this.enableClickModeWithVisualDelay('ChangeConfirm');
                    Game.Debug.log('assist', '[ClickMode] 等待學生點擊確認找零按鈕');
                    return;
                }

                // 找到店家找零區對應 index 的金錢元素
                const sourceArea = document.getElementById('easy-change-money');
                const sourceItem = sourceArea ? sourceArea.querySelector(
                    `.easy-change-money[data-change-index="${currentIndex}"]`
                ) : null;

                if (sourceItem) {
                    // 隱藏店家的金錢（標記已放置）
                    sourceItem.style.display = 'none';
                    sourceItem.classList.add('placed');

                    // 點亮錢包對應位置
                    const targetArea = document.getElementById('easy-change-targets');
                    const targetItem = targetArea ? targetArea.querySelector(
                        `.easy-change-target[data-target-index="${currentIndex}"]`
                    ) : null;
                    if (targetItem) {
                        targetItem.classList.remove('faded');
                        targetItem.classList.add('lit-up');
                        targetItem.style.opacity = '1';
                        // 同簡單模式拖曳：明確設定內層 img 不透明度，確保亮度一致
                        const targetImg = targetItem.querySelector('img');
                        if (targetImg) targetImg.style.opacity = '1';
                    }

                    // 更新 easyChangeDropped 狀態
                    Game.state.gameState.easyChangeDropped[currentIndex] = true;

                    // 播放語音（累計金額）
                    const droppedValues = changeQueue.slice(0, currentIndex + 1);
                    const cumulativeTotal = droppedValues.reduce((sum, v) => sum + v, 0);
                    Game.Speech.speak(`已找回${Game.convertAmountToSpeech(cumulativeTotal)}`);

                    // 檢查是否全部放完
                    const allDropped = Game.state.gameState.easyChangeDropped.every(d => d);

                    if (allDropped) {
                        // 全部完成，顯示按鈕，等學生點擊確認
                        clickState.changeQueue = null;
                        clickState.changeIndex = 0;

                        const confirmBtn = document.getElementById('confirm-change-btn');
                        if (confirmBtn) {
                            confirmBtn.disabled = false;
                            confirmBtn.style.display = 'block';
                        }
                        // 🎯 簡單+輔助點擊：顯示「點這裡」提示動畫，等學生點擊後再確認找零
                        Game.TimerManager.setTimeout(() => {
                            Game.highlightConfirmButton('confirm-change-btn');
                        }, 300, 'hint');
                        this.enableClickModeWithVisualDelay('ChangeConfirm');
                        Game.Debug.log('assist', '[ClickMode] 等待學生點擊確認找零按鈕');
                    } else {
                        // 等待下一次點擊
                        clickState.changeIndex++;
                        clickState.waitingForClick = true;
                        Game.Debug.log('assist', '[ClickMode] 等待用戶點擊放置下一個找零');

                        if (Game.state.settings.difficulty === 'easy') {
                            this.enableClickModeWithVisualDelay('ExecuteNextChange');
                        }
                    }
                } else {
                    Game.Debug.warn('assist', '[A6-ClickMode] 找不到找零金錢元素，index:', currentIndex);
                }
            },

            // 重置狀態
            reset() {
                Game.Debug.log('assist', '[ClickMode] 重置狀態');

                const clickState = Game.state.gameState.clickModeState;
                clickState.active = false;
                clickState.currentPhase = null;
                clickState.currentStep = 0;
                clickState.actionQueue = [];
                clickState.waitingForClick = false;
                clickState.waitingForStart = false;
                clickState.paymentQueue = null;
                clickState.paymentIndex = 0;
                clickState.changeQueue = null;
                clickState.changeIndex = 0;

                this.hidePrompt();
                this.unbind();
            }
        },

        // =====================================================
        // 場景管理器
        // =====================================================
        SceneManager: {
            switchScene(newScene, context) {
                Game.Debug.log('flow', `🎬 [場景管理] 切換場景: ${context.state.gameState.currentScene} → ${newScene}`);

                const currentScene = context.state.gameState.currentScene;
                const currentConfig = context.SceneConfig[currentScene];
                const newConfig = context.SceneConfig[newScene];

                // 執行當前場景的 onExit
                if (currentConfig && currentConfig.onExit) {
                    Game.Debug.log('flow', `🧹 [場景管理] 清理場景: ${currentScene}`);
                    currentConfig.onExit.call(context, context);
                }

                // 更新場景狀態
                context.state.gameState.currentScene = newScene;

                // 執行新場景的 onEnter
                if (newConfig && newConfig.onEnter) {
                    Game.Debug.log('flow', `🚀 [場景管理] 初始化場景: ${newScene}`);
                    newConfig.onEnter.call(context, context);
                }
            }
        },

        // =====================================================
        // NPC 對話管理器
        // =====================================================
        DialogueManager: {
            currentStep: 0,
            steps: ['askStart', 'askEnd', 'askType', 'askCount', 'confirm'],

            start() {
                // 預設模式和自由模式都從第一步開始
                // 差別在於預設模式會自動高亮正確答案
                this.currentStep = 0;
                this.showStep('askStart');
            },

            showStep(stepName) {
                Game.Debug.log('flow', `💬 [對話管理] 顯示步驟: ${stepName}`);
                const process = Game.state.gameState.ticketProcess;

                let speechText = '';

                switch(stepName) {
                    case 'askStart':
                        speechText = Game.SpeechConfig.ticketWindow.welcome;
                        Game.renderTicketWindowUI('askStart', speechText);
                        Game.TimerManager.setTimeout(() => {
                            // 🆕 普通模式：主語音播完後再播彈窗語音
                            const isNormalPreset = Game.state.settings.difficulty === 'normal' &&
                                Game.state.settings.taskType === 'preset';
                            Game.Speech.speak(speechText, {
                                callback: isNormalPreset ? () => {
                                    const pt = Game.state.gameState.ticketProcess.presetTask;
                                    if (pt && pt.startStationName) {
                                        const rn = Game.getRegionNameByStation(pt.startStation);
                                        Game.Speech.speak(`從${rn}，${pt.startStationName}出發`);
                                    }
                                } : null,
                                skipOnInterrupt: true
                            });
                            // 普通模式：顯示步驟彈窗（視覺，500ms 後）
                            if (isNormalPreset) {
                                Game.TimerManager.setTimeout(() => {
                                    Game.showNormalModeStepPopup('askStart');
                                }, 500, 'dialogue');
                            }
                            // 🆕 困難模式：顯示步驟彈窗（包含出發站和到達站）
                            if (Game.state.settings.difficulty === 'hard' &&
                                Game.state.settings.taskType === 'preset') {
                                Game.TimerManager.setTimeout(() => {
                                    Game.showHardModeStepPopup('askStart');
                                }, 500, 'dialogue');
                            }
                        }, 100, 'dialogue');
                        break;

                    case 'askEnd':
                        const startName = Game.getStationName(process.startStation);
                        speechText = Game.SpeechConfig.ticketWindow.askDestination(startName);
                        Game.renderTicketWindowUI('askEnd', speechText);
                        Game.TimerManager.setTimeout(() => {
                            // 🆕 普通模式：主語音播完後再播彈窗語音
                            const isNormalPresetEnd = Game.state.settings.difficulty === 'normal' &&
                                Game.state.settings.taskType === 'preset';
                            Game.Speech.speak(speechText, {
                                callback: isNormalPresetEnd ? () => {
                                    const pt = Game.state.gameState.ticketProcess.presetTask;
                                    if (pt && pt.endStationName) {
                                        const rn = Game.getRegionNameByStation(pt.endStation);
                                        Game.Speech.speak(`要抵達${rn}，${pt.endStationName}`);
                                    }
                                } : null,
                                skipOnInterrupt: true
                            });
                            // 普通模式：顯示步驟彈窗
                            if (isNormalPresetEnd) {
                                Game.TimerManager.setTimeout(() => {
                                    Game.showNormalModeStepPopup('askEnd');
                                }, 500, 'dialogue');
                            }
                        }, 100, 'dialogue');
                        break;

                    case 'askType':
                        const startName2 = Game.getStationName(process.startStation);
                        const endName = Game.getStationName(process.endStation);
                        speechText = Game.SpeechConfig.ticketWindow.askTrainType(startName2, endName);
                        Game.renderTicketWindowUI('askType', speechText);
                        Game.TimerManager.setTimeout(() => {
                            // 🆕 普通模式：主語音播完後再播彈窗語音
                            const isNormalPresetType = Game.state.settings.difficulty === 'normal' &&
                                Game.state.settings.taskType === 'preset';
                            Game.Speech.speak(speechText, {
                                callback: isNormalPresetType ? () => {
                                    const pt = Game.state.gameState.ticketProcess.presetTask;
                                    if (pt && pt.trainTypeName) {
                                        Game.Speech.speak(`要搭乘${pt.trainTypeName}`);
                                    }
                                } : null,
                                skipOnInterrupt: true
                            });
                            // 普通模式：顯示步驟彈窗
                            if (isNormalPresetType) {
                                Game.TimerManager.setTimeout(() => {
                                    Game.showNormalModeStepPopup('askType');
                                }, 500, 'dialogue');
                            }
                            // 🆕 困難模式：顯示步驟彈窗
                            if (Game.state.settings.difficulty === 'hard' &&
                                Game.state.settings.taskType === 'preset') {
                                Game.TimerManager.setTimeout(() => {
                                    Game.showHardModeStepPopup('askType');
                                }, 500, 'dialogue');
                            }
                        }, 100, 'dialogue');
                        break;

                    case 'askCount':
                        const trainTypeName = Game.getTrainTypeName(process.trainType);
                        speechText = Game.SpeechConfig.ticketWindow.askTicketCount(trainTypeName);
                        Game.renderTicketWindowUI('askCount', speechText);
                        Game.TimerManager.setTimeout(() => {
                            // 🆕 普通模式：主語音播完後再播彈窗語音
                            const isNormalPresetCount = Game.state.settings.difficulty === 'normal' &&
                                Game.state.settings.taskType === 'preset';
                            Game.Speech.speak(speechText, {
                                callback: isNormalPresetCount ? () => {
                                    const pt = Game.state.gameState.ticketProcess.presetTask;
                                    if (pt && pt.ticketCount) {
                                        Game.Speech.speak(`要買${pt.ticketCount}張票`);
                                    }
                                } : null,
                                skipOnInterrupt: true
                            });
                            // 普通模式：顯示步驟彈窗
                            if (isNormalPresetCount) {
                                Game.TimerManager.setTimeout(() => {
                                    Game.showNormalModeStepPopup('askCount');
                                }, 500, 'dialogue');
                            }
                            // 🆕 困難模式：顯示步驟彈窗
                            if (Game.state.settings.difficulty === 'hard' &&
                                Game.state.settings.taskType === 'preset') {
                                Game.TimerManager.setTimeout(() => {
                                    Game.showHardModeStepPopup('askCount');
                                }, 500, 'dialogue');
                            }
                        }, 100, 'dialogue');
                        break;

                    case 'confirm':
                        // 計算價格
                        const unitPrice = Game.calculateTicketPrice(
                            process.startStation,
                            process.endStation,
                            process.trainType
                        );
                        process.unitPrice = unitPrice;
                        process.totalPrice = unitPrice * process.ticketCount;

                        // 顯示確認畫面
                        const startName3 = Game.getStationName(process.startStation);
                        const endName2 = Game.getStationName(process.endStation);
                        const trainTypeName2 = Game.getTrainTypeName(process.trainType);

                        speechText = Game.SpeechConfig.ticketWindow.confirm(
                            startName3, endName2, trainTypeName2,
                            process.ticketCount, process.totalPrice
                        );
                        Game.renderTicketWindowUI('confirm', speechText);
                        Game.TimerManager.setTimeout(() => {
                            Game.Speech.speak(speechText);
                        }, 100, 'dialogue');
                        break;
                }
            },

            nextStep(selectedData) {
                const process = Game.state.gameState.ticketProcess;
                const currentStepName = this.steps[this.currentStep];

                Game.Debug.log('flow', `➡️ [對話管理] 從 ${currentStepName} 前進，選擇: ${selectedData}`);

                switch(currentStepName) {
                    case 'askStart':
                        process.startStation = selectedData;
                        this.currentStep++;
                        this.showStep('askEnd');
                        break;

                    case 'askEnd':
                        // askEnd 需要點擊「確認」按鈕才會進入 askType
                        process.endStation = selectedData;
                        this.currentStep++;
                        this.showStep('askType');
                        break;

                    case 'askType':
                        process.trainType = selectedData;
                        this.currentStep++;
                        this.showStep('askCount');
                        break;

                    case 'askCount':
                        process.ticketCount = selectedData;
                        this.currentStep++;
                        this.showStep('confirm');
                        break;

                    case 'confirm':
                        // 進入付款場景
                        Game.SceneManager.switchScene('paying', Game);
                        break;
                }
            },

            reset() {
                this.currentStep = 0;

                // 🆕 清空購票流程資料
                Game.state.gameState.ticketProcess = {
                    startStation: null,
                    endStation: null,
                    trainType: null,
                    ticketCount: 1,
                    unitPrice: 0,
                    totalPrice: 0
                };
            }
        },

        // =====================================================
        // 音效系統（繼承 A4）
        // =====================================================
        audio: {
            dropSound: null,
            errorSound: null,
            successSound: null,
            checkoutSound: null,

            init() {
                try {
                    this.dropSound = new Audio('../audio/units/drop-sound.mp3');
                    this.dropSound.preload = 'auto';
                    this.dropSound.volume = 0.5;

                    this.errorSound = new Audio('../audio/units/error.mp3');
                    this.errorSound.preload = 'auto';

                    this.successSound = new Audio('../audio/units/correct02.mp3');
                    this.successSound.preload = 'auto';

                    this.checkoutSound = new Audio('../audio/units/checkout.mp3');
                    this.checkoutSound.preload = 'auto';
                    this.checkoutSound.volume = 0.5;
                } catch (error) {
                    Game.Debug.warn('audio', '音效檔案載入失敗:', error);
                }
            },

            playDropSound() {
                if (this.dropSound) {
                    this.dropSound.currentTime = 0;
                    this.dropSound.play().catch(error => console.log('播放音效失敗:', error));
                }
            },

            playErrorSound(callback = null) {
                if (this.errorSound) {
                    try {
                        this.errorSound.currentTime = 0;
                        this.errorSound.onended = null;
                        if (callback) {
                            this.errorSound.onended = callback;
                        }
                        this.errorSound.play().catch(error => {
                            console.log('播放錯誤音效失敗:', error);
                            if (callback) Game.TimerManager.setTimeout(callback, 100, 'audio');
                        });
                    } catch (error) {
                        console.log('錯誤音效系統錯誤:', error);
                        if (callback) Game.TimerManager.setTimeout(callback, 100, 'audio');
                    }
                } else {
                    Game.Debug.log('audio', '🔊 errorSound 未載入，直接執行回調');
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'audio');
                }
            },

            playSuccessSound(callback = null) {
                Game.Debug.log('audio', '🔊 播放成功音效');
                Game.startFireworksAnimation();

                if (this.successSound) {
                    try {
                        this.successSound.currentTime = 0;
                        if (callback) {
                            this.successSound.onended = callback;
                        }
                        this.successSound.play().catch(error => {
                            console.log('播放音效失敗:', error);
                            if (callback) Game.TimerManager.setTimeout(callback, 100, 'audio');
                        });
                    } catch (error) {
                        Game.Debug.warn('audio', '音效系統錯誤:', error);
                        if (callback) Game.TimerManager.setTimeout(callback, 100, 'audio');
                    }
                } else {
                    Game.Debug.log('audio', '🔊 successSound 未載入，直接執行回調');
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'audio');
                }
            }
        },

        // =====================================================
        // 語音系統（繼承 A4）
        // =====================================================
        Speech: {
            synth: window.speechSynthesis,
            voice: null,
            isReady: false,

            init() {
                Game.Debug.log('speech', '🎙️ 初始化語音系統');

                let voiceInitAttempts = 0;
                const maxAttempts = 5;

                const setVoice = () => {
                    const voices = this.synth.getVoices();
                    voiceInitAttempts++;

                    Game.Debug.log('speech', '🎙️ 取得語音列表', {
                        voiceCount: voices.length,
                        attempt: voiceInitAttempts
                    });

                    if (voices.length === 0) {
                        if (voiceInitAttempts < maxAttempts) {
                            Game.Debug.log('speech', '🎙️ 語音列表為空，將重試');
                            Game.TimerManager.setTimeout(setVoice, 500, 'speech');
                        } else {
                            Game.Debug.log('speech', '🎙️ 手機端無語音，啟用靜音模式');
                            this.voice = null;
                            this.isReady = true;
                        }
                        return;
                    }

                    this.voice =
                        voices.find(v => v.name.startsWith('Microsoft Yating')) ||   // 微軟 Yating 第一優先
                        voices.find(v => /microsoft/i.test(v.name) && /online/i.test(v.name) && v.lang.startsWith('zh')) || // 微軟 Online 次之
                        voices.find(v => /google/i.test(v.name) && v.lang.startsWith('zh')) ||                               // Google 次之
                        voices.find(v => v.name.startsWith('Microsoft Hanhan')) ||   // 微軟涵涵 優先 2
                        voices.find(v => v.name === 'Google 國語（臺灣）') ||          // Google 線上 優先 3
                        voices.find(v => v.lang === 'zh-TW') ||                      // 任何 zh-TW
                        voices.find(v => v.lang.startsWith('zh')) ||                 // 任何 zh
                        voices[0];

                    Game.Debug.log('speech', '🎙️ 選擇語音:', this.voice ? this.voice.name : '無');
                    this.isReady = true;
                };

                if (this.synth.getVoices().length > 0) {
                    setVoice();
                } else {
                    this.synth.addEventListener('voiceschanged', setVoice);
                }
            },

            speak(text, optionsOrCallback = null) {
                Game.Debug.log('speech', '🎙️ 播放語音:', text);

                // 🔧 支持兩種調用方式：speak(text, callback) 或 speak(text, {interrupt, callback})
                let callback = null;
                let interrupt = true; // 預設中斷之前的語音

                let skipOnInterrupt = false; // 🆕 中斷時跳過 callback

                if (typeof optionsOrCallback === 'function') {
                    // 傳統方式：直接傳入回調函數
                    callback = optionsOrCallback;
                } else if (typeof optionsOrCallback === 'object' && optionsOrCallback !== null) {
                    // 新方式：傳入選項對象
                    callback = optionsOrCallback.callback || null;
                    interrupt = optionsOrCallback.interrupt !== undefined ? optionsOrCallback.interrupt : true;
                    skipOnInterrupt = optionsOrCallback.skipOnInterrupt || false;
                }

                if (!this.isReady || !this.voice) {
                    Game.Debug.log('speech', '🎙️ 語音系統未就緒，跳過播放');
                    if (callback && typeof callback === 'function') {
                        Game.TimerManager.setTimeout(callback, 100, 'speech');
                    }
                    return;
                }

                // 根據 interrupt 選項決定是否取消之前的語音
                if (interrupt) {
                    this.synth.cancel();
                }

                const utterance = new SpeechSynthesisUtterance(text);
                utterance.voice = this.voice;
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;

                if (callback && typeof callback === 'function') {
                    let callbackExecuted = false;
                    const safeCallback = () => {
                        if (!callbackExecuted) {
                            callbackExecuted = true;
                            callback();
                        }
                    };
                    utterance.onend = safeCallback;
                    utterance.onerror = (event) => {
                        Game.Debug.log('speech', '🎙️ 語音播放錯誤:', event.error);
                        // 🆕 skipOnInterrupt：中斷時不觸發 callback（防止自動語音在錯誤時機觸發）
                        if (skipOnInterrupt && event.error === 'interrupted') {
                            callbackExecuted = true; // 同時阻止 10s 備援計時器
                            return;
                        }
                        safeCallback();
                    };
                    Game.TimerManager.setTimeout(safeCallback, 10000, 'speech');
                } else {
                    utterance.onerror = (event) => {
                        Game.Debug.log('speech', '🎙️ 語音播放錯誤:', event.error);
                    };
                }

                this.synth.speak(utterance);
            }
        },

        // =====================================================
        // 煙火動畫（修改版：中間單次爆發）
        // =====================================================
        startFireworksAnimation() {
            if (typeof confetti !== 'undefined') {
                // 中間位置單次煙火爆發
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { x: 0.5, y: 0.5 },
                    colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
                });
            }
        },

        // =====================================================
        // 核心計算方法
        // =====================================================

        // 🎯 計算票價（使用真實台鐵票價表，智能處理岡山站）
        calculateTicketPrice(startId, endId, trainTypeId) {
            // 🆕 解析自訂車站 → 代理站（用於票價查詢）
            const resolvedStartId = this.resolveStationId(startId);
            const resolvedEndId = this.resolveStationId(endId);

            // 取得車站索引（使用解析後的 ID）
            const startStation = this.storeData.StationData.Stations[resolvedStartId];
            const endStation = this.storeData.StationData.Stations[resolvedEndId];

            if (!startStation || !endStation) {
                Game.Debug.error(`❌ [票價] 找不到車站: ${startId}(${resolvedStartId}) 或 ${endId}(${resolvedEndId})`);
                return 100; // 預設票價
            }

            const startIdx = startStation.index;
            const endIdx = endStation.index;
            const isGangshanInvolved = (startIdx === 21 || endIdx === 21);

            // 根據車種取得費率
            const trainType = this.storeData.StationData.trainTypes.find(
                t => t.id === trainTypeId
            );
            const typeRate = trainType ? trainType.rate : 1.0;

            let baseFare;
            let fareSource;

            // 🔍 智能查詢邏輯：
            if (trainTypeId === 'chu-kuang') {
                // 莒光號：直接使用莒光號票價表（完整32站）
                baseFare = this.storeData.StationData.fareMatrixChuKuang[startIdx][endIdx];
                fareSource = '莒光號票價表';
            } else if (isGangshanInvolved) {
                // 涉及岡山站 且 非莒光號：使用莒光號數據 × 車種費率/莒光號費率
                // 莒光號費率是0.8，所以其他車種相對莒光號的比例是 typeRate/0.8
                const chuKuangBaseFare = this.storeData.StationData.fareMatrixChuKuang[startIdx][endIdx];
                baseFare = Math.round(chuKuangBaseFare * (typeRate / 0.8));
                fareSource = '莒光號推算';
            } else {
                // 不涉及岡山站：使用自強號票價表（31站，無岡山）
                // 注意：自強號矩陣是31x31，索引21之後需要-1
                const adjustedStartIdx = startIdx > 21 ? startIdx - 1 : startIdx;
                const adjustedEndIdx = endIdx > 21 ? endIdx - 1 : endIdx;
                const tzeChiangBase = this.storeData.StationData.fareMatrixTzeChiang[adjustedStartIdx][adjustedEndIdx];
                baseFare = Math.round(tzeChiangBase * typeRate);
                fareSource = '自強號票價表';
            }

            Game.Debug.log('payment', '💰 [票價計算-智能查詢]', {
                起站: startStation.name,
                訖站: endStation.name,
                車種: trainType ? trainType.name : trainTypeId,
                涉及岡山: isGangshanInvolved,
                查詢來源: fareSource,
                基準票價: baseFare,
                費率: typeRate,
                最終票價: baseFare
            });

            return baseFare;
        },

        // 生成車票資訊（為每張票生成獨立座位）
        generateTicketInfo() {
            const process = this.state.gameState.ticketProcess;
            const ticketCount = process.ticketCount || 1;

            // 生成車次號碼（100~999）
            const trainNumber = Math.floor(Math.random() * 900) + 100;

            // 生成發車時間（整點或半點，06:00 ~ 22:00）
            const hour = Math.floor(Math.random() * 17) + 6;
            const minute = Math.random() < 0.5 ? '00' : '30';
            const departureTime = `${hour.toString().padStart(2, '0')}:${minute}`;

            // 生成日期（今天）
            const today = new Date();
            const year = today.getFullYear();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const date = today.getDate().toString().padStart(2, '0');
            const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
            const weekday = weekdays[today.getDay()];
            const departureDate = `${year}/${month}/${date} (${weekday})`;

            // 為每張票生成不同的座位
            const tickets = [];
            for (let i = 0; i < ticketCount; i++) {
                let seatCar, seatNumber, seatKey;
                do {
                    seatCar = Math.floor(Math.random() * 12) + 1;
                    seatNumber = Math.floor(Math.random() * 60) + 1;
                    seatKey = `${seatCar}-${seatNumber}`;
                } while (this.state.quiz.usedSeats.includes(seatKey));

                // 記錄已使用的座位
                this.state.quiz.usedSeats.push(seatKey);
                Game.Debug.log('product', '🎫 [座位分配]', seatKey, '已使用座位:', this.state.quiz.usedSeats);

                tickets.push({
                    trainNumber: trainNumber,
                    departureTime: departureTime,
                    departureDate: departureDate,
                    seatCar: seatCar,
                    seatNumber: seatNumber
                });
            }

            // 儲存所有車票資訊（數組）
            process.trainInfo = tickets;

            Game.Debug.log('product', '🎫 [車票生成]', `共${ticketCount}張`, process.trainInfo);
        },

        // 取得車站名稱
        getStationName(stationId) {
            // 🆕 先檢查自訂車站
            const customStation = this.state.customStations.find(s => s.id === stationId);
            if (customStation) return customStation.displayName;

            // 檢查現有車站
            const regions = this.storeData.StationData.regions;
            for (const regionKey in regions) {
                const station = regions[regionKey].find(s => s.id === stationId);
                if (station) return station.displayName;
            }
            return stationId;
        },

        // 取得車種名稱
        getTrainTypeName(trainTypeId) {
            const trainType = this.storeData.StationData.trainTypes.find(t => t.id === trainTypeId);
            return trainType ? trainType.name : trainTypeId;
        },

        // 取得車站所屬地區
        getStationRegion(stationId) {
            // 🆕 先檢查自訂車站
            const customStation = this.state.customStations.find(s => s.id === stationId);
            if (customStation) return customStation.region;

            // 檢查現有車站
            const regions = this.storeData.StationData.regions;
            for (const regionKey in regions) {
                const station = regions[regionKey].find(s => s.id === stationId);
                if (station) return regionKey;
            }
            return null;
        },

        // 根據車站ID獲取區域中文名稱
        getRegionNameByStation(stationId) {
            const regionKey = this.getStationRegion(stationId);
            const regionNames = {
                north: '北部',
                central: '中部',
                south: '南部',
                east: '東部'
            };
            return regionNames[regionKey] || '';
        },

        // =====================================================
        // 提示系統（簡單模式專用）
        // =====================================================

        // 清除所有提示
        clearAllHints() {
            // 清除地區按鈕提示
            document.querySelectorAll('.region-btn-hint').forEach(el => {
                el.classList.remove('region-btn-hint');
            });

            // 清除車站按鈕提示
            document.querySelectorAll('.station-btn-hint').forEach(el => {
                el.classList.remove('station-btn-hint');
            });

            // 清除確認按鈕提示
            document.querySelectorAll('.confirm-btn-hint').forEach(el => {
                el.classList.remove('confirm-btn-hint');
            });

            // 清除車種卡片提示
            document.querySelectorAll('.train-type-hint').forEach(el => {
                el.classList.remove('train-type-hint');
            });
        },

        // 高亮顯示地區按鈕
        highlightRegionButton(regionId) {
            // 移除所有地區按鈕的提示
            document.querySelectorAll('.station-tab').forEach(btn => {
                btn.classList.remove('region-btn-hint');
            });

            // 添加提示到目標地區按鈕
            const regionBtn = document.querySelector(`.station-tab[data-region="${regionId}"]`);
            if (regionBtn) {
                regionBtn.classList.add('region-btn-hint');

                // 🆕 自動切換tab（不觸發click事件，避免重複調用）
                document.querySelectorAll('.station-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('[data-region-content]').forEach(c => c.style.display = 'none');

                regionBtn.classList.add('active');
                const regionContent = document.querySelector(`[data-region-content="${regionId}"]`);
                if (regionContent) {
                    regionContent.style.display = 'grid';
                }

                Game.Debug.log('hint', '[Train] 顯示地區提示:', regionId);
            }
        },

        // 高亮顯示車站按鈕
        highlightStationButton(stationId) {
            // 移除所有車站按鈕的提示
            document.querySelectorAll('.station-btn').forEach(btn => {
                btn.classList.remove('station-btn-hint');
            });

            // 添加提示到目標車站按鈕
            const stationBtn = document.querySelector(`[data-station="${stationId}"]`);
            if (stationBtn) {
                stationBtn.classList.add('station-btn-hint');
                Game.Debug.log('hint', '[Train] 顯示車站提示:', stationId);
            } else {
                Game.Debug.log('hint', '[Train] ⚠️ 找不到車站按鈕:', stationId);
            }
        },

        // 更新提示（簡單模式預設任務專用）
        updateHints(selectionType) {
            // 🔧 修改：支持普通模式和困難模式（只限預設任務）
            if (this.state.settings.taskType !== 'preset') {
                return;
            }

            const process = this.state.gameState.ticketProcess;
            let targetStationId = null;
            let targetRegionId = null;

            // 根據選擇類型確定目標車站
            if (selectionType === 'departure') {
                targetStationId = process.presetTask ? process.presetTask.startStation : process.startStation;
            } else if (selectionType === 'arrival') {
                targetStationId = process.presetTask ? process.presetTask.endStation : process.endStation;
            }

            if (!targetStationId) {
                Game.Debug.log('hint', '[Train] 無法顯示提示：目標車站未設定');
                return;
            }

            // 取得目標車站所屬地區
            targetRegionId = this.getStationRegion(targetStationId);

            if (!targetRegionId) {
                Game.Debug.log('hint', '[Train] 無法顯示提示：找不到車站所屬地區');
                return;
            }

            Game.Debug.log('hint', `[Train] 提示動畫 - 選擇類型: ${selectionType}, 目標車站: ${targetStationId}, 目標地區: ${targetRegionId}`);

            // 🆕 清除之前的提示（Phase 2：使用 TimerManager）
            this.TimerManager.clearByCategory('stationHint');

            // 延遲顯示提示，確保DOM已渲染（Phase 2：遷移至 TimerManager）
            this.TimerManager.setTimeout(() => {
                // 🎯 第一階段：顯示地區按鈕提示（黃框但無「點這裡」文字）
                this.highlightRegionButton(targetRegionId);

                // 🎯 第二階段：同時顯示車站按鈕提示（黃框+「點這裡」文字）
                this.TimerManager.setTimeout(() => {
                    this.highlightStationButton(targetStationId);
                }, 500, 'stationHint');
            }, 300, 'stationHint');
        },

        // 高亮顯示確認按鈕
        highlightConfirmButton(buttonId) {
            // 移除所有按鈕的提示
            document.querySelectorAll('.confirm-btn-hint').forEach(btn => {
                btn.classList.remove('confirm-btn-hint');
            });

            // 添加提示到目標按鈕
            const confirmBtn = document.getElementById(buttonId);
            if (confirmBtn) {
                confirmBtn.classList.add('confirm-btn-hint');
                Game.Debug.log('hint', '[Train] 顯示確認按鈕提示:', buttonId);
            }
        },

        // 高亮顯示車種卡片
        highlightTrainType(trainTypeId) {
            // 移除所有車種卡片的提示
            document.querySelectorAll('.train-type-card').forEach(card => {
                card.classList.remove('train-type-hint');
            });

            // 添加提示到目標車種卡片
            const trainTypeCard = document.querySelector(`.train-type-card[data-type="${trainTypeId}"]`);
            if (trainTypeCard) {
                trainTypeCard.classList.add('train-type-hint');
                Game.Debug.log('hint', '[Train] 顯示車種提示:', trainTypeId);
            } else {
                Game.Debug.log('hint', '[Train] ⚠️ 找不到車種卡片:', trainTypeId);
            }
        },

        // =====================================================
        // UI 渲染方法
        // =====================================================

        // 渲染設定頁面
        renderSettingsUI() {
            // [Phase 2/3] 返回設定時清除計時器和事件監聽器
            this.TimerManager.clearAll();
            this.EventManager.removeAll();
            if (window.TutorContext) {
                TutorContext.update({ screen: 'settings' });
                TutorContext.getLiveData = null;
            }

            const app = document.getElementById('app');
            const { taskType, difficulty, walletMode, walletAmount, questionCount, clickMode } = this.state.settings;

            app.innerHTML = `
                <div class="store-layout">
                    <div class="settings-content">
                        <!-- 單元標題和說明（移到白框內） -->
                        <div class="settings-header" style="margin-bottom: 30px;">
                        <div class="settings-title-row">
                            <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                            <h1>單元A6：模擬火車購票</h1>
                        </div>
                            <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 0; line-height: 1.6;">學習火車購票流程，包含選擇出發站、抵達站、車種與張數</p>
                        </div>

                        <!-- 🎯 選擇難度 -->
                        <div class="setting-group">
                            <label>🎯 選擇難度：</label>
                            <div class="button-group">
                                <button class="selection-btn ${difficulty === 'easy' ? 'active' : ''}"
                                        data-type="difficulty" data-value="easy">
                                    簡單
                                </button>
                                <button class="selection-btn ${difficulty === 'normal' ? 'active' : ''}"
                                        data-type="difficulty" data-value="normal">
                                    普通
                                </button>
                                <button class="selection-btn ${difficulty === 'hard' ? 'active' : ''}"
                                        data-type="difficulty" data-value="hard">
                                    困難
                                </button>
                            </div>
                            <div id="difficulty-description" class="setting-description" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 0.95em; color: #666; text-align: left;">
                                ${this.getDifficultyDescription(difficulty)}
                            </div>
                        </div>


                        <!-- 🔧 輔助點擊模式（僅簡單模式可用） -->
                        <div class="setting-group clickmode-section"
                             style="background: #fff3cd; padding: 15px; border-radius: 10px; border: 2px solid #ffcc02;
                                     display: ${difficulty === 'easy' ? 'block' : 'none'};">

                            <label style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2em;">♿</span>
                                <span>輔助點擊模式（單鍵操作）：</span>
                            </label>

                            <p style="font-size: 0.9em; color: #666; margin: 8px 0 12px 0; line-height: 1.5;">
                                啟用後，只要偵測到點擊，系統會自動依序完成選站、選車種、選張數、付款、找零等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式 + 預設購票」</strong>
                            </p>

                            <div class="button-group">
                                <button class="selection-btn ${clickMode ? 'active' : ''}"
                                        data-type="clickMode" data-value="true">
                                    ✓ 啟用
                                </button>
                                <button class="selection-btn ${!clickMode ? 'active' : ''}"
                                        data-type="clickMode" data-value="false">
                                    ✗ 停用
                                </button>
                            </div>
                        </div>

                        <!-- 📋 任務類型 -->
                        <div class="setting-group">
                            <label>📋 任務類型：</label>
                            <div class="button-group">
                                <button class="selection-btn ${taskType === 'preset' ? 'active' : ''}"
                                        data-type="taskType" data-value="preset">
                                    預設
                                </button>
                                <button class="selection-btn ${taskType === 'free' ? 'active' : ''}"
                                        data-type="taskType" data-value="free"
                                        ${clickMode ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                    自由購票${clickMode ? ' (輔助模式不可用)' : ''}
                                </button>
                            </div>
                        </div>

                        <!-- 💰 錢包金額 -->
                        <div class="setting-group" id="wallet-mode-group">
                            <label><img src="../images/common/icons_wallet.png" alt="💰" style="width:1em;height:1em;vertical-align:middle;margin-right:2px;" onerror="this.outerHTML='💰'"> 錢包金額：</label>
                            <div class="button-group">
                                ${taskType === 'preset' ? `
                                    <button class="selection-btn ${walletMode === 'preset' ? 'active' : ''}"
                                            data-type="walletMode" data-value="preset"
                                            disabled style="opacity: 0.7; cursor: not-allowed;">
                                        預設（自動配置）
                                    </button>
                                ` : ''}
                                ${taskType === 'free' ? `
                                    <button class="selection-btn ${walletMode === '500' ? 'active' : ''}"
                                            data-type="walletMode" data-value="500">
                                        500元
                                    </button>
                                    <button class="selection-btn ${walletMode === '1000' ? 'active' : ''}"
                                            data-type="walletMode" data-value="1000">
                                        1000元
                                    </button>
                                    <button class="selection-btn ${walletMode === '2000' ? 'active' : ''}"
                                            data-type="walletMode" data-value="2000">
                                        2000元
                                    </button>
                                    <button class="selection-btn ${walletMode === 'custom' ? 'active' : ''}"
                                            data-type="walletMode" data-value="custom">
                                        自訂金額
                                    </button>
                                ` : ''}
                            </div>
                            ${taskType === 'free' && walletMode === 'custom' ? `
                                <div style="margin-top: 12px; text-align: center;">
                                    <span style="color: #666; font-size: 14px;">
                                        已設定：<span id="custom-wallet-display" style="color: #FF9800; font-weight: bold;">${this.state.settings.customWalletAmount || '未設定'}</span> 元
                                    </span>
                                </div>
                            ` : ''}
                        </div>

                        <!-- 📊 測驗題數 -->
                        <div class="setting-group">
                            <label>📊 測驗題數：</label>
                            <div class="button-group">
                                <button class="selection-btn ${questionCount === 1 ? 'active' : ''}"
                                        data-type="questionCount" data-value="1">
                                    1 題
                                </button>
                                <button class="selection-btn ${questionCount === 3 ? 'active' : ''}"
                                        data-type="questionCount" data-value="3">
                                    3 題
                                </button>
                                <button class="selection-btn ${questionCount === 5 ? 'active' : ''}"
                                        data-type="questionCount" data-value="5">
                                    5 題
                                </button>
                                <button class="selection-btn ${questionCount === 10 ? 'active' : ''}"
                                        data-type="questionCount" data-value="10">
                                    10 題
                                </button>
                                <button class="selection-btn ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? 'active' : ''}"
                                        data-type="questionCount" data-value="custom">
                                    自訂
                                </button>
                            </div>
                            <div class="custom-question-display" style="display: ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? 'block' : 'none'}; margin-top: 10px;">
                                <input type="text" id="custom-question-count-a6"
                                       value="${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? questionCount + '題' : ''}"
                                       placeholder="請輸入題數"
                                       style="padding: 8px; border-radius: 5px; border: 2px solid ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? '#667eea' : '#ddd'}; background: ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? '#667eea' : 'white'}; color: ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                                       readonly onclick="Game.handleCustomQuestionClick()">
                            </div>
                        </div>

                        <!-- 🆕 🚉 自訂車站 -->
                        <div class="setting-group">
                            <label>🚉 自訂車站：</label>
                            <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                                <button id="add-station-btn" class="selection-btn"
                                        style="background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%); color: white; border: none;"
                                        ${this.state.customStations.length >= this.MAX_CUSTOM_STATIONS ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                    + 新增車站
                                </button>
                                ${this.state.customStations.length > 0 ? `
                                    <button id="clear-all-stations-btn" class="selection-btn"
                                            style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; border: none;">
                                        🗑️ 清除全部
                                    </button>
                                ` : ''}
                                ${this.state.customStations.map(station => `
                                    <span class="custom-station-tag" data-station-id="${station.id}"
                                          style="background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
                                                 border: 2px dashed #9c27b0; padding: 8px 12px; border-radius: 20px;
                                                 display: inline-flex; align-items: center; gap: 8px; font-size: 14px;">
                                        ★${station.name}
                                        <button class="delete-station-btn" data-station-id="${station.id}"
                                                style="background: #ff5252; color: white; border: none; border-radius: 50%;
                                                       width: 20px; height: 20px; cursor: pointer; font-size: 12px; line-height: 1;">
                                            ✕
                                        </button>
                                    </span>
                                `).join('')}
                            </div>
                            <div style="margin-top: 8px; font-size: 0.85em; color: #666;">
                                ${this.state.customStations.length === 0 ? '尚未新增自訂車站' : `已新增 ${this.state.customStations.length}/${this.MAX_CUSTOM_STATIONS} 個`}
                                ${this.state.customStations.length > 0 ? '<span style="margin-left: 8px; color: #9c27b0;">💡 自訂車站會自動加入預設任務中</span>' : ''}
                            </div>
                        </div>

                        <!-- 🎁 獎勵系統 -->
                        <div class="setting-group">
                            <label>🎁 獎勵系統：</label>
                            <div class="button-group">
                                <a href="#" id="settings-reward-link" class="selection-btn"
                                   style="color: #000 !important; font-weight: bold !important; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">
                                    開啟獎勵系統
                                </a>
                            </div>
                        </div>

                        <!-- 📝 作業單 -->
                        <div class="setting-group">
                            <label style="text-align: left; display: block;">📝 作業單：</label>
                            <div class="button-group">
                                <a href="#" id="settings-worksheet-link" class="selection-btn"
                                   style="color: #000 !important; font-weight: bold !important; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">
                                    產生作業單
                                </a>
                            </div>
                        </div>

                        <div class="game-buttons">
                            <button class="back-to-main-btn" onclick="Game.backToMainMenu()" aria-label="返回主畫面">
                                返回主畫面
                            </button>
                            <button id="start-game-btn" class="start-btn" disabled>
                                開始購票
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // 統一的設定選擇邏輯
            const updateStartButton = () => {
                const startBtn = document.getElementById('start-game-btn');
                const { taskType, difficulty, walletMode, customWalletAmount, questionCount } = this.state.settings;

                let isValid = false;

                if (taskType === 'preset') {
                    // 預設模式：需要 taskType, difficulty, questions
                    isValid = taskType && difficulty && questionCount;
                } else if (taskType === 'free') {
                    // 自由購票模式：需要錢包金額（預設選項或自訂金額）
                    const hasValidWallet = ['500', '1000', '2000'].includes(walletMode) ||
                                          (walletMode === 'custom' && customWalletAmount > 0);
                    isValid = taskType && difficulty && hasValidWallet && questionCount;
                }

                if (isValid) {
                    startBtn.disabled = false;
                    startBtn.classList.remove('disabled');
                } else {
                    startBtn.disabled = true;
                    startBtn.classList.add('disabled');
                }
            };

            // 統一的按鈕選擇事件處理
            document.querySelectorAll('.selection-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const type = btn.dataset.type;
                    const value = btn.dataset.value;

                    // 移除同類型按鈕的 active 狀態
                    document.querySelectorAll(`[data-type="${type}"]`).forEach(b => {
                        b.classList.remove('active');
                    });

                    // 添加當前按鈕的 active 狀態
                    btn.classList.add('active');

                    // 播放選擇音效
                    try {
                        const selectSound = new Audio('../audio/units/click.mp3');
                        selectSound.volume = 0.5;
                        selectSound.play().catch(() => {});
                    } catch(e) {}

                    // 更新狀態
                    if (type === 'taskType') {
                        this.state.settings.taskType = value;

                        // 🆕 切換任務類型時，只更新錢包金額區域（避免整個UI閃爍）
                        if (value === 'preset') {
                            this.state.settings.walletMode = 'preset';
                        } else if (value === 'free') {
                            // 自由購票模式：不預設選擇，讓使用者自行選擇錢包金額
                            this.state.settings.walletMode = null;
                            this.state.settings.customWalletAmount = null;
                        }

                        // 只更新錢包金額區域
                        this.updateWalletModeGroup();
                    } else if (type === 'difficulty') {
                        this.state.settings.difficulty = value;

                        // 🆕 更新輔助點擊模式顯示/隱藏
                        const clickModeSection = document.querySelector('.clickmode-section');
                        if (clickModeSection) {
                            if (value === 'easy') {
                                clickModeSection.style.display = 'block';
                            } else {
                                clickModeSection.style.display = 'none';
                                // 非簡單模式時，自動停用輔助點擊模式
                                this.state.settings.clickMode = false;
                            }
                        }

                        // 🔧 [新增] 更新難度說明
                        this.updateDifficultyDescription(value);
                    } else if (type === 'walletMode') {
                        this.state.settings.walletMode = value;

                        // 🆕 自訂金額模式：顯示自訂錢包彈窗
                        if (value === 'custom') {
                            this.showCustomWalletModal();
                        } else {
                            this.state.settings.walletAmount = null;
                            this.state.settings.customWalletAmount = null;
                            this.state.settings.customWalletDetails = null;
                        }
                    } else if (type === 'walletAmount') {
                        this.state.settings.walletAmount = parseInt(value);
                    } else if (type === 'questionCount') {
                        // 🆕 自訂題數模式：顯示數字輸入器
                        if (value === 'custom') {
                            this.showNumberInput('questionCount');
                        } else {
                            this.state.settings.questionCount = parseInt(value);

                            // 🔧 [修正] 當選擇預設題數時，隱藏自訂題數顯示框
                            const customDisplay = document.querySelector('.custom-question-display');
                            const customInput = document.getElementById('custom-question-count-a6');
                            if (customDisplay && customInput) {
                                customDisplay.style.display = 'none';
                                customInput.value = '';
                                customInput.style.background = 'white';
                                customInput.style.color = '#333';
                                customInput.style.borderColor = '#ddd';
                            }
                        }
                    } else if (type === 'clickMode') {
                        // 🆕 輔助點擊模式
                        this.state.settings.clickMode = value === 'true';

                        // 啟用輔助點擊模式時，自動設置為預設購票
                        if (this.state.settings.clickMode) {
                            this.state.settings.taskType = 'preset';
                            this.state.settings.walletMode = 'preset';
                        }

                        // 更新任務類型區域（重新渲染以顯示/隱藏禁用狀態）
                        this.updateTaskTypeButtons();
                        // 更新錢包金額區域
                        this.updateWalletModeGroup();
                    }

                    updateStartButton();
                });
            });

            // 開始按鈕事件
            document.getElementById('start-game-btn').addEventListener('click', () => {
                this.startGame();
            });

            // 🎁 獎勵系統連結事件
            const settingsRewardLink = document.getElementById('settings-reward-link');
            if (settingsRewardLink) {
                settingsRewardLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                });
            }

            // 📝 作業單連結事件
            const worksheetLink = document.getElementById('settings-worksheet-link');
            if (worksheetLink) {
                worksheetLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    // 作業單使用自己的預設值與工具列設定，不受遊戲設定影響
                    const params = new URLSearchParams({ unit: 'a6' });
                    window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
                });
            }


            // 🆕 自訂車站新增按鈕事件
            const addStationBtn = document.getElementById('add-station-btn');
            if (addStationBtn) {
                addStationBtn.addEventListener('click', () => {
                    if (this.state.customStations.length < this.MAX_CUSTOM_STATIONS) {
                        this.showAddStationModal();
                    }
                });
            }

            // 🆕 自訂車站刪除按鈕事件
            document.querySelectorAll('.delete-station-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const stationId = btn.dataset.stationId;
                    if (confirm('確定要刪除此自訂車站嗎？')) {
                        this.deleteCustomStation(stationId);
                        this.renderSettingsUI(); // 重新渲染設定頁面
                    }
                });
            });

            // 🆕 清除所有自訂車站按鈕事件
            const clearAllBtn = document.getElementById('clear-all-stations-btn');
            if (clearAllBtn) {
                clearAllBtn.addEventListener('click', () => {
                    if (confirm('確定要清除所有自訂車站嗎？')) {
                        this.clearAllCustomStations();
                    }
                });
            }

            // 🆕 初始化時更新開始按鈕狀態（確保頁面載入時按鈕狀態正確）
            this.TimerManager.setTimeout(() => {
                updateStartButton();
            }, 0, 'uiUpdate');
        },

        // 🔧 [新增] 取得難度說明
        getDifficultyDescription(difficulty) {
            const descriptions = {
                'easy': '簡單：系統會有視覺、語音提示，引導每個步驟。',
                'normal': '普通：自己完成操作，錯誤3次會自動提示。',
                'hard': '困難：自己完成操作，沒有自動提示。'
            };
            return descriptions[difficulty] || '請選擇難度';
        },

        // 🔧 [新增] 更新難度說明顯示
        updateDifficultyDescription(difficulty) {
            const descElement = document.getElementById('difficulty-description');
            if (descElement) {
                descElement.textContent = this.getDifficultyDescription(difficulty);
            }
        },

        // 🆕 只更新錢包金額區域（避免整個UI閃爍）
        updateWalletModeGroup() {
            const { taskType, walletMode } = this.state.settings;
            const walletModeGroup = document.getElementById('wallet-mode-group');

            if (!walletModeGroup) {
                Game.Debug.warn('ui', '⚠️ 找不到 wallet-mode-group 元素');
                return;
            }

            // 生成錢包金額區域的 HTML
            const walletModeHTML = `
                <label><img src="../images/common/icons_wallet.png" alt="💰" style="width:1em;height:1em;vertical-align:middle;margin-right:2px;" onerror="this.outerHTML='💰'"> 錢包金額：</label>
                <div class="button-group">
                    ${taskType === 'preset' ? `
                        <button class="selection-btn ${walletMode === 'preset' ? 'active' : ''}"
                                data-type="walletMode" data-value="preset"
                                disabled style="opacity: 0.7; cursor: not-allowed;">
                            預設（自動配置）
                        </button>
                    ` : ''}
                    ${taskType === 'free' ? `
                        <button class="selection-btn ${walletMode === '500' ? 'active' : ''}"
                                data-type="walletMode" data-value="500">
                            500元
                        </button>
                        <button class="selection-btn ${walletMode === '1000' ? 'active' : ''}"
                                data-type="walletMode" data-value="1000">
                            1000元
                        </button>
                        <button class="selection-btn ${walletMode === '2000' ? 'active' : ''}"
                                data-type="walletMode" data-value="2000">
                            2000元
                        </button>
                        <button class="selection-btn ${walletMode === 'custom' ? 'active' : ''}"
                                data-type="walletMode" data-value="custom">
                            自訂金額
                        </button>
                    ` : ''}
                </div>
                ${taskType === 'free' && walletMode === 'custom' ? `
                    <div style="margin-top: 12px; text-align: center;">
                        <span style="color: #666; font-size: 14px;">
                            已設定：<span id="custom-wallet-display" style="color: #FF9800; font-weight: bold;">${this.state.settings.customWalletAmount || '未設定'}</span> 元
                        </span>
                    </div>
                ` : ''}
            `;

            // 更新 DOM
            walletModeGroup.innerHTML = walletModeHTML;

            // 重新綁定該區域內的按鈕事件監聽器
            const walletModeButtons = walletModeGroup.querySelectorAll('.selection-btn');
            walletModeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const value = btn.getAttribute('data-value');

                    // 移除所有 active 狀態
                    walletModeButtons.forEach(b => b.classList.remove('active'));

                    // 添加當前按鈕的 active 狀態
                    btn.classList.add('active');

                    // 更新狀態
                    this.state.settings.walletMode = value;

                    // 根據選擇處理錢包金額
                    if (value === 'custom') {
                        // 自訂金額模式：顯示自訂錢包彈窗
                        this.showCustomWalletModal();
                    } else if (['500', '1000', '2000'].includes(value)) {
                        // 預設金額選項：直接設定金額
                        const amount = parseInt(value);
                        this.state.settings.customWalletAmount = amount;
                        this.state.settings.customWalletDetails = null;
                        Game.Debug.log('payment', `✅ 已選擇預設錢包金額: ${amount}元`);
                    } else {
                        this.state.settings.walletAmount = null;
                        this.state.settings.customWalletAmount = null;
                        this.state.settings.customWalletDetails = null;
                    }

                    // 更新開始按鈕狀態
                    this.updateStartButtonState();
                });
            });

            Game.Debug.log('ui', '✅ 已更新錢包金額區域', { taskType, walletMode });
        },

        // 🆕 更新任務類型按鈕（輔助點擊模式啟用時禁用自由購票）
        updateTaskTypeButtons() {
            const { taskType, clickMode } = this.state.settings;
            const taskTypeGroup = document.querySelector('.setting-group:has([data-type="taskType"])');

            if (!taskTypeGroup) {
                Game.Debug.warn('ui', '⚠️ 找不到任務類型區域');
                return;
            }

            // 重新生成任務類型按鈕 HTML
            const buttonGroupHTML = `
                <label>📋 任務類型：</label>
                <div class="button-group">
                    <button class="selection-btn ${taskType === 'preset' ? 'active' : ''}"
                            data-type="taskType" data-value="preset">
                        預設
                    </button>
                    <button class="selection-btn ${taskType === 'free' ? 'active' : ''}"
                            data-type="taskType" data-value="free"
                            ${clickMode ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        自由購票${clickMode ? ' (輔助模式不可用)' : ''}
                    </button>
                </div>
            `;

            // 更新 DOM
            taskTypeGroup.innerHTML = buttonGroupHTML;

            // 重新綁定事件
            const taskTypeButtons = taskTypeGroup.querySelectorAll('.selection-btn');
            taskTypeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // 如果按鈕被禁用，不執行
                    if (btn.disabled) {
                        return;
                    }

                    const value = btn.getAttribute('data-value');

                    // 移除所有 active 狀態
                    taskTypeButtons.forEach(b => b.classList.remove('active'));

                    // 添加當前按鈕的 active 狀態
                    btn.classList.add('active');

                    // 更新狀態
                    this.state.settings.taskType = value;

                    // 切換任務類型時，更新錢包金額區域
                    if (value === 'preset') {
                        this.state.settings.walletMode = 'preset';
                    } else if (value === 'free') {
                        this.state.settings.walletMode = 'custom';
                    }

                    // 更新錢包金額區域
                    this.updateWalletModeGroup();
                    // 更新開始按鈕狀態
                    this.updateStartButtonState();
                });
            });

            Game.Debug.log('ui', '✅ 已更新任務類型區域', { taskType, clickMode });
        },

        // 🆕 更新開始按鈕狀態
        updateStartButtonState() {
            const { taskType, difficulty, walletMode, walletAmount, customWalletAmount, questionCount } = this.state.settings;
            const startBtn = document.getElementById('start-game-btn');

            Game.Debug.log('ui', '🔍 [開始按鈕] 檢查狀態:', {
                taskType,
                difficulty,
                walletMode,
                walletAmount,
                customWalletAmount,
                questionCount
            });

            if (!startBtn) {
                Game.Debug.warn('ui', '⚠️ [開始按鈕] 找不到開始按鈕元素');
                return;
            }

            let canStart = taskType && difficulty && questionCount;

            // 檢查錢包設定
            if (taskType === 'preset') {
                // 預設模式不需要檢查錢包（會自動配置）
                canStart = canStart;
            } else if (taskType === 'free') {
                // 自由購票模式：需要選擇預設金額(500/1000/2000)或自訂金額
                const hasValidWallet = ['500', '1000', '2000'].includes(walletMode) ||
                                      (walletMode === 'custom' && customWalletAmount > 0);
                canStart = canStart && hasValidWallet;
            }

            Game.Debug.log('ui', '🔍 [開始按鈕] 檢查結果: canStart =', canStart);

            if (canStart) {
                startBtn.disabled = false;
                startBtn.classList.remove('disabled');
                // 移除內聯樣式，讓CSS規則生效
                startBtn.style.opacity = '';
                startBtn.style.cursor = '';
                startBtn.style.background = '';
                startBtn.onclick = () => this.startGame();
                Game.Debug.log('ui', '✅ [開始按鈕] 已啟用');
            } else {
                startBtn.disabled = true;
                startBtn.classList.add('disabled');
                // disabled狀態的樣式由CSS處理，不需要內聯樣式
                startBtn.style.opacity = '';
                startBtn.style.cursor = '';
                startBtn.style.background = '';
                startBtn.onclick = () => this.showMissingSettings();
                Game.Debug.log('ui', '❌ [開始按鈕] 保持禁用');
            }
        },

        // 開始遊戲（從設定頁面進入遊戲）
        startGame() {
            Game.Debug.log('flow', '🎮 [設定] 開始遊戲', this.state.settings);

            // [Phase 2/3] 開始遊戲時清除計時器和事件監聽器
            this.TimerManager.clearAll();
            this.EventManager.removeAll();
            this.state.isProcessing = false;

            // 🎫 重置已使用的座位記錄
            this.state.quiz.usedSeats = [];
            this.state.quiz.currentQuestion = 0;
            this.state.quiz.score = 0;
            this.state.quiz.startTime = Date.now();
            this._completionScreenShown = false;
            if (window.TutorContext) {
                TutorContext.reset();
                TutorContext.update({ screen: 'game', phase: 'selectItem', difficulty: this.state.settings.difficulty, totalQuestions: this.state.settings.questionCount, questionIndex: 0 });
                const _a6 = this;
                TutorContext.getLiveData = () => {
                    const tx = _a6.state.gameState.currentTransaction || {};
                    return {
                        fromStation:  tx.startStation  || null,
                        toStation:    tx.endStation    || null,
                        ticketType:   tx.trainType     || null,
                        count:        tx.ticketCount   ?? null,
                        totalPrice:   tx.totalCost     ?? null,
                        wallet:       _a6.state.gameState.walletTotal ?? null,
                    };
                };
            }

            // 🔧 [新增] 重置輔助點擊模式狀態
            if (this.state.gameState.clickModeState) {
                this.state.gameState.clickModeState.enabled = false;
                this.state.gameState.clickModeState.active = false;
                this.state.gameState.clickModeState.currentPhase = null;
                this.state.gameState.clickModeState.currentStep = 0;
                this.state.gameState.clickModeState.actionQueue = [];
                this.state.gameState.clickModeState.waitingForClick = false;
                Game.Debug.log('hint', '[Train] 重置輔助點擊模式狀態');
            }

            // 如果是預設模式，先生成預設題目
            if (this.state.settings.taskType === 'preset') {
                this.generatePresetQuestion();
            }

            // 初始化錢包
            this.initializeWallet();

            // 🆕 輔助點擊模式：初始化（第一題）
            if (this.state.settings.clickMode) {
                this.ClickMode.initForWelcome();
            }

            // 切換到售票窗口場景
            this.SceneManager.switchScene('ticketWindow', this);
        },

        // 顯示缺少的設定項目
        showMissingSettings() {
            const s = this.state.settings;
            const missing = [];

            if (!s.taskType) missing.push('任務類型');
            if (!s.difficulty) missing.push('遊戲難度');
            if (!s.questionCount) missing.push('測驗題數');

            // 檢查自由購票模式的錢包金額
            if (s.taskType === 'free') {
                const hasValidWallet = ['500', '1000', '2000'].includes(s.walletMode) ||
                                      (s.walletMode === 'custom' && s.customWalletAmount > 0);
                if (!hasValidWallet) {
                    missing.push('錢包金額（請選擇預設金額或輸入自訂金額）');
                }
            }

            if (missing.length > 0) {
                alert('請先完成以下設定：\n\n' + missing.map(m => '• ' + m).join('\n'));
            }
        },

        // 🆕 生成預設題目（預設模式使用）
        generatePresetQuestion() {
            Game.Debug.log('flow', '📝 [預設模式] 生成預設題目');

            // 獲取上一輪的預設任務（用於防重複）
            const lastTask = this.state.gameState.lastPresetTask;

            // 🆕 取得所有可用車站（現有站 + 自訂站）
            const builtInStations = Object.keys(this.storeData.StationData.Stations);
            const customStationIds = this.state.customStations.map(s => s.id);
            const allStations = [...builtInStations, ...customStationIds];

            let startStation;
            let endStation;

            // 🆕 如果有自訂車站，每題必定包含一個自訂車站
            if (customStationIds.length > 0) {
                // 隨機選一個自訂車站
                const customStation = customStationIds[Math.floor(Math.random() * customStationIds.length)];
                // 🔧 Bug 5 修復：取得自訂車站的代理站 ID
                const resolvedCustomProxyId = this.resolveStationId(customStation);
                // 隨機決定是出發站還是到達站
                const isStartStation = Math.random() < 0.5;

                if (isStartStation) {
                    startStation = customStation;
                    // 從所有車站中選一個不同的作為到達站
                    // 🔧 Bug 5 修復：過濾掉 resolve 為相同代理站的車站（防止票價 0 元）
                    const availableEnd = allStations.filter(s => {
                        const resolvedOtherId = this.resolveStationId(s);
                        return resolvedOtherId !== resolvedCustomProxyId &&
                               s !== customStation &&
                               (!lastTask || s !== lastTask.endStation);
                    });
                    endStation = availableEnd[Math.floor(Math.random() * availableEnd.length)];
                    Game.Debug.log('flow', `📝 [自訂車站] 出發站使用自訂: ${this.getStationName(startStation)}`);
                } else {
                    endStation = customStation;
                    // 從所有車站中選一個不同的作為出發站
                    // 🔧 Bug 5 修復：過濾掉 resolve 為相同代理站的車站（防止票價 0 元）
                    const availableStart = allStations.filter(s => {
                        const resolvedOtherId = this.resolveStationId(s);
                        return resolvedOtherId !== resolvedCustomProxyId &&
                               s !== customStation &&
                               (!lastTask || s !== lastTask.startStation);
                    });
                    startStation = availableStart[Math.floor(Math.random() * availableStart.length)];
                    Game.Debug.log('flow', `📝 [自訂車站] 到達站使用自訂: ${this.getStationName(endStation)}`);
                }
            } else {
                // 沒有自訂車站時，維持原本邏輯
                if (lastTask && allStations.length > 1) {
                    // 排除上一輪的出發站
                    const availableStart = allStations.filter(s => s !== lastTask.startStation);
                    startStation = availableStart[Math.floor(Math.random() * availableStart.length)];
                    Game.Debug.log('flow', `📝 [防重複-出發站] 排除上一輪: ${this.getStationName(lastTask.startStation)}, 選擇新值: ${this.getStationName(startStation)}`);
                } else {
                    startStation = allStations[Math.floor(Math.random() * allStations.length)];
                }

                // 🔧 Bug 5 修復：取得出發站的代理站 ID（用於防止相同代理站配對）
                const resolvedStartProxyId = this.resolveStationId(startStation);

                // 隨機選擇抵達站（與出發站不同 + 避免與上一輪重複 + 避免相同代理站）
                let attempts = 0;
                do {
                    endStation = allStations[Math.floor(Math.random() * allStations.length)];
                    const resolvedEndProxyId = this.resolveStationId(endStation);
                    attempts++;
                    // 🔧 Bug 5 修復：額外檢查 resolve 後的代理站不能相同
                    if (resolvedEndProxyId === resolvedStartProxyId) {
                        continue; // 跳過相同代理站
                    }
                } while (
                    (endStation === startStation || (lastTask && endStation === lastTask.endStation) || this.resolveStationId(endStation) === resolvedStartProxyId) &&
                    allStations.length > 2 &&
                    attempts < 20
                );

                if (lastTask) {
                    Game.Debug.log('flow', `📝 [防重複-抵達站] 排除上一輪: ${this.getStationName(lastTask.endStation)}, 選擇新值: ${this.getStationName(endStation)}`);
                }
            }

            // 隨機選擇車種（避免與上一輪重複）
            const trainTypes = ['local', 'chu-kuang', 'tze-chiang', 'puyuma'];
            let trainType;

            if (lastTask && trainTypes.length > 1) {
                // 排除上一輪的車種
                const availableTypes = trainTypes.filter(t => t !== lastTask.trainType);
                trainType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                Game.Debug.log('flow', `📝 [防重複-車種] 排除上一輪: ${this.getTrainTypeName(lastTask.trainType)}, 選擇新值: ${this.getTrainTypeName(trainType)}`);
            } else {
                trainType = trainTypes[Math.floor(Math.random() * trainTypes.length)];
            }

            // 隨機選擇張數（1-3張，避免與上一輪重複）
            let ticketCount;
            let attempts2 = 0;
            do {
                ticketCount = Math.floor(Math.random() * 3) + 1;
                attempts2++;
            } while (lastTask && ticketCount === lastTask.ticketCount && attempts2 < 5);

            if (lastTask) {
                Game.Debug.log('flow', `📝 [防重複-張數] 上一輪: ${lastTask.ticketCount}張, 本次: ${ticketCount}張`);
            }

            // 計算票價
            const unitPrice = this.calculateTicketPrice(startStation, endStation, trainType);
            const totalPrice = unitPrice * ticketCount;

            // 🎯 簡單模式：直接將正確答案存入 ticketProcess（供提示系統使用）
            // 🎯 普通/困難模式：只儲存在 presetTask 中，ticketProcess.startStation 保持為 null
            const isEasyMode = this.state.settings.difficulty === 'easy';

            // 儲存預設題目資料
            this.state.gameState.ticketProcess = {
                startStation: isEasyMode ? startStation : null,
                endStation: isEasyMode ? endStation : null,
                trainType: trainType,
                ticketCount: ticketCount,
                unitPrice: unitPrice,
                totalPrice: totalPrice,
                // 🎯 預設模式：初始時標記為未點擊，需要使用者點擊後才顯示
                userSelectedStartStation: false,
                userSelectedEndStation: false,
                trainInfo: {
                    trainNumber: null,
                    departureTime: null,
                    departureDate: null,
                    seatCar: null,
                    seatNumber: null
                }
            };

            // 根據票價自動計算錢包金額（確保大於票價 + 避免與上一輪重複）
            let walletAmount;
            let walletAttempts = 0;

            do {
                if (this.state.settings.difficulty === 'easy') {
                    // 🎯 簡單模式：錢包金額必定大於票價（1.5 ~ 2 倍）
                    const minWallet = Math.ceil(totalPrice * 1.5);
                    const maxWallet = totalPrice * 2;
                    walletAmount = Math.ceil((minWallet + Math.random() * (maxWallet - minWallet)) / 10) * 10; // 進位到10的倍數
                } else {
                    // 普通/困難模式：固定分層上限，讓找零金額更隨機（模仿 A3/A4）
                    const walletCap =
                        totalPrice <= 100 ? 300 :
                        totalPrice <= 300 ? 700 :
                        totalPrice <= 600 ? 1300 :
                        totalPrice + 500;
                    const minWallet = totalPrice + 10;
                    walletAmount = Math.ceil((minWallet + Math.random() * (walletCap - minWallet)) / 10) * 10;
                }
                walletAttempts++;
            } while (walletAmount === this.state.gameState.lastWalletAmount && walletAttempts < 50);

            // 保存本輪錢包金額供下一輪比較
            if (this.state.gameState.lastWalletAmount !== 0) {
                Game.Debug.log('flow', `📝 [防重複-錢包金額] 上一輪: ${this.state.gameState.lastWalletAmount}元, 本次: ${walletAmount}元`);
            }
            this.state.gameState.lastWalletAmount = walletAmount;
            this.state.settings.walletAmount = walletAmount;

            Game.Debug.log('flow', '📝 [預設模式] 題目生成完成:', {
                起站: this.getStationName(startStation),
                訖站: this.getStationName(endStation),
                車種: this.getTrainTypeName(trainType),
                張數: ticketCount,
                單價: unitPrice,
                總價: totalPrice,
                錢包金額: walletAmount
            });

            // 🆕 保存本輪預設任務供下一輪比較
            this.state.gameState.lastPresetTask = {
                startStation: startStation,
                endStation: endStation,
                trainType: trainType,
                ticketCount: ticketCount
            };

            // 🆕 普通/困難模式：將正確答案儲存到 presetTask（供提示系統使用）
            if (!isEasyMode) {
                const trainTypeData = this.storeData.StationData.trainTypes.find(t => t.id === trainType);

                this.state.gameState.ticketProcess.presetTask = {
                    startStation: startStation,
                    startStationName: this.getStationName(startStation),
                    endStation: endStation,
                    endStationName: this.getStationName(endStation),
                    trainType: trainType,
                    trainTypeName: trainTypeData ? trainTypeData.name : trainType,
                    ticketCount: ticketCount
                };

                Game.Debug.log('flow', '🎯 [普通/困難模式] 預設任務已儲存:', this.state.gameState.ticketProcess.presetTask);
            }
        },

        // 將固定金額（500/1000/2000）隨機分解為硬幣紙鈔組合（≤10張）
        generateRandomWalletDecomposition(amount) {
            // 拆解規則：每種面額可以拆成哪些小面額（只用 10/50/100/500/1000，跳過 1/5）
            const breakRules = {
                1000: [500, 500],                    // +1 張
                500:  [100, 100, 100, 100, 100],     // +4 張
                100:  [50, 50],                      // +1 張
                50:   [10, 10, 10, 10, 10],          // +4 張
            };

            // Step 1：貪婪最少張數起點
            let items = [];
            let remaining = amount;
            for (const d of [1000, 500, 100, 50, 10]) {
                while (remaining >= d) { items.push(d); remaining -= d; }
            }

            // Step 2：隨機目標張數（現有張數 ~ 10）
            const targetCount = items.length + Math.floor(Math.random() * (10 - items.length + 1));

            // Step 3：反覆隨機拆解，直到達到目標或無法再拆
            let attempts = 0;
            while (items.length < targetCount && attempts < 50) {
                attempts++;
                // 找出拆解後不超過 10 張的候選
                const breakable = items
                    .map((v, i) => ({ v, i }))
                    .filter(({ v }) => breakRules[v] &&
                        items.length - 1 + breakRules[v].length <= 10);
                if (breakable.length === 0) break;

                const { v, i } = breakable[Math.floor(Math.random() * breakable.length)];
                items.splice(i, 1, ...breakRules[v]);
            }

            // 轉換為 {面額: 數量} 格式（與 customWalletDetails 相同）
            const details = {};
            for (const d of items) details[d] = (details[d] || 0) + 1;

            // 防止過多小面額積累（如 500→10×50）：超過 5 枚時兩兩合回較大面額
            while ((details[50] || 0) >= 6) {
                details[50] -= 2;
                details[100] = (details[100] || 0) + 1;
            }
            while ((details[10] || 0) >= 6) {
                details[10] -= 5;
                details[50] = (details[50] || 0) + 1;
            }

            Game.Debug.log('payment', `💰 [隨機錢包] ${amount}元 → ${Object.values(details).reduce((a,b)=>a+b,0)}張:`, details);
            return details;
        },

        // 初始化錢包
        initializeWallet() {
            this.state.gameState.playerWallet = [];

            // 🆕 檢查是否使用自訂錢包（有詳細內容）
            if (this.state.settings.customWalletAmount && this.state.settings.customWalletDetails) {
                // 使用自訂錢包詳細內容
                const walletAmount = this.state.settings.customWalletAmount;
                this.state.gameState.walletTotal = walletAmount;

                Game.Debug.log('payment', '💰 [錢包] 初始化自訂錢包:', walletAmount);

                const denominations = [1000, 500, 100, 50, 10, 5, 1];
                for (const denom of denominations) {
                    const quantity = this.state.settings.customWalletDetails[denom] || 0;
                    for (let i = 0; i < quantity; i++) {
                        const moneyData = this.storeData.moneyItems.find(m => m.value === denom);
                        if (moneyData) {
                            // 🔧 Bug 2 修復：初始化時決定並儲存 imagePath，避免重新渲染時圖片變化
                            const walletItem = {...moneyData};
                            walletItem.imagePath = this.getRandomMoneyImage(walletItem);
                            this.state.gameState.playerWallet.push(walletItem);
                        }
                    }
                }
            } else if (this.state.settings.customWalletAmount && !this.state.settings.customWalletDetails) {
                // 500/1000/2000 快速選項：每題隨機組成（≤10張）
                const walletAmount = this.state.settings.customWalletAmount;
                this.state.gameState.walletTotal = walletAmount;
                const details = this.generateRandomWalletDecomposition(walletAmount);
                for (const denom of [1000, 500, 100, 50, 10]) {
                    const qty = details[denom] || 0;
                    for (let i = 0; i < qty; i++) {
                        const moneyData = this.storeData.moneyItems.find(m => m.value === denom);
                        if (moneyData) {
                            const walletItem = {...moneyData};
                            walletItem.imagePath = this.getRandomMoneyImage(walletItem);
                            this.state.gameState.playerWallet.push(walletItem);
                        }
                    }
                }
            } else {
                // 預設任務：貪婪演算法（從大到小塞滿）
                const walletAmount = this.state.settings.walletAmount;
                this.state.gameState.walletTotal = walletAmount;

                Game.Debug.log('payment', '💰 [錢包] 初始化錢包:', walletAmount);

                let remaining = walletAmount;
                const moneyItems = this.storeData.moneyItems.slice().reverse(); // 從大到小

                for (const item of moneyItems) {
                    while (remaining >= item.value) {
                        // 🔧 Bug 2 修復：初始化時決定並儲存 imagePath，避免重新渲染時圖片變化
                        const walletItem = {...item};
                        walletItem.imagePath = this.getRandomMoneyImage(walletItem);
                        this.state.gameState.playerWallet.push(walletItem);
                        remaining -= item.value;
                    }
                }
            }

            Game.Debug.log('payment', '💰 [錢包] 錢幣組合:', this.state.gameState.playerWallet.map(m => m.name).join(', '));
        },

        // =====================================================
        // 🆕 自訂錢包系統
        // =====================================================

        // 自訂錢包的幣值數量狀態
        customWalletQuantities: {
            1: 0,
            5: 0,
            10: 0,
            50: 0,
            100: 0,
            500: 0,
            1000: 0
        },

        // 顯示自訂錢包金額輸入彈窗
        showCustomWalletModal() {
            // 初始化數量（如果之前有設定過，則使用之前的設定）
            if (this.state.settings.customWalletDetails) {
                this.customWalletQuantities = { ...this.state.settings.customWalletDetails };
            } else {
                this.customWalletQuantities = { 1: 0, 5: 0, 10: 0, 50: 0, 100: 0, 500: 0, 1000: 0 };
            }

            const denominations = [1000, 500, 100, 50, 10, 5, 1];

            let moneyItemsHTML = denominations.map(value => {
                const quantity = this.customWalletQuantities[value] || 0;
                // 🆕 使用隨機正反面圖片
                const moneyData = this.storeData.moneyItems.find(m => m.value === value);
                const side = Math.random() < 0.5 ? 'front' : 'back';
                const imagePath = moneyData ? this.getRandomMoneyImage(moneyData) : `../images/money/${value}_yuan_${side}.png`;

                return `
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 10px 15px;
                        background: #f8f9fa;
                        border-radius: 10px;
                        margin: 8px 0;
                    ">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${imagePath}" alt="${value}元" style="
                                width: ${value >= 100 ? '80px' : '50px'};
                                height: auto;
                                object-fit: contain;
                            ">
                            <span style="font-size: 18px; font-weight: bold; color: #333;">${value}元</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button onclick="Game.adjustCustomWalletQuantity(${value}, -1)"
                                    style="
                                        width: 36px;
                                        height: 36px;
                                        border: none;
                                        background: #e74c3c;
                                        color: white;
                                        font-size: 20px;
                                        font-weight: bold;
                                        border-radius: 50%;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                    ">−</button>
                            <span id="custom-wallet-qty-${value}" style="
                                font-size: 20px;
                                font-weight: bold;
                                min-width: 40px;
                                text-align: center;
                                color: #2c3e50;
                            ">${quantity}</span>
                            <button onclick="Game.adjustCustomWalletQuantity(${value}, 1)"
                                    style="
                                        width: 36px;
                                        height: 36px;
                                        border: none;
                                        background: #27ae60;
                                        color: white;
                                        font-size: 20px;
                                        font-weight: bold;
                                        border-radius: 50%;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                    ">+</button>
                        </div>
                    </div>
                `;
            }).join('');

            const totalAmount = this.calculateCustomWalletTotal();

            const modalHTML = `
                <div id="custom-wallet-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                ">
                    <div style="
                        background: white;
                        padding: 25px;
                        border-radius: 20px;
                        box-shadow: 0 15px 40px rgba(0,0,0,0.3);
                        max-width: 450px;
                        width: 90%;
                        max-height: 85vh;
                        overflow-y: auto;
                    ">
                        <h3 style="
                            text-align: center;
                            color: #2c3e50;
                            margin-bottom: 20px;
                            font-size: 24px;
                        "><img src="../images/common/icons_wallet.png" alt="💰" style="width:1em;height:1em;vertical-align:middle;margin-right:2px;" onerror="this.outerHTML='💰'"> 自訂錢包內容</h3>

                        <div style="margin-bottom: 15px;">
                            ${moneyItemsHTML}
                        </div>

                        <div style="
                            background: linear-gradient(135deg, #667eea, #764ba2);
                            color: white;
                            padding: 15px;
                            border-radius: 12px;
                            text-align: center;
                            margin: 15px 0;
                        ">
                            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">錢包總金額</div>
                            <div id="custom-wallet-total" style="font-size: 28px; font-weight: bold;">
                                ${totalAmount} 元
                            </div>
                        </div>

                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <button onclick="Game.closeCustomWalletModal()" style="
                                flex: 1;
                                padding: 12px;
                                background: #95a5a6;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: bold;
                                cursor: pointer;
                            ">取消</button>
                            <button onclick="Game.confirmCustomWallet()" style="
                                flex: 1;
                                padding: 12px;
                                background: linear-gradient(135deg, #667eea, #764ba2);
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: bold;
                                cursor: pointer;
                            ">確認</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
        },

        // 調整自訂錢包幣值數量
        adjustCustomWalletQuantity(value, delta) {
            this.customWalletQuantities[value] = Math.max(0, (this.customWalletQuantities[value] || 0) + delta);

            // 更新顯示
            const qtyDisplay = document.getElementById(`custom-wallet-qty-${value}`);
            if (qtyDisplay) {
                qtyDisplay.textContent = this.customWalletQuantities[value];
            }

            // 更新總金額
            const totalAmount = this.calculateCustomWalletTotal();
            const totalDisplay = document.getElementById('custom-wallet-total');
            if (totalDisplay) {
                totalDisplay.textContent = `${totalAmount} 元`;
            }
        },

        // 計算自訂錢包總金額
        calculateCustomWalletTotal() {
            let total = 0;
            for (const [value, quantity] of Object.entries(this.customWalletQuantities)) {
                total += parseInt(value) * quantity;
            }
            return total;
        },

        // 確認自訂錢包設定
        confirmCustomWallet() {
            const totalAmount = this.calculateCustomWalletTotal();

            if (totalAmount === 0) {
                alert('請至少設定一個錢幣！');
                return;
            }

            if (totalAmount > 5000) {
                alert('錢包金額不能超過5000元');
                return;
            }

            // 儲存詳細的幣值數量
            this.state.settings.customWalletDetails = { ...this.customWalletQuantities };
            this.state.settings.customWalletAmount = totalAmount;
            this.state.settings.walletMode = 'custom';

            Game.Debug.log('hint', '[Train] 自訂錢包:', this.customWalletQuantities, '總金額:', totalAmount);
            this.closeCustomWalletModal();

            // 🆕 只更新錢包金額區域（避免整個頁面閃爍）
            this.updateWalletModeGroup();

            // 🆕 更新開始按鈕狀態
            this.updateStartButtonState();
        },

        // 關閉自訂錢包彈窗
        closeCustomWalletModal() {
            const modal = document.getElementById('custom-wallet-modal');
            if (modal) {
                modal.remove();
            }
        },

        // =====================================================
        // 🆕 自訂車站彈窗系統
        // =====================================================

        // 顯示新增車站彈窗
        showAddStationModal() {
            const regionNames = {
                north: '北部',
                central: '中部',
                south: '南部',
                east: '東部'
            };

            const modalHTML = `
                <div id="add-station-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                ">
                    <div style="
                        background: white;
                        padding: 30px;
                        border-radius: 20px;
                        box-shadow: 0 15px 40px rgba(0,0,0,0.3);
                        max-width: 400px;
                        width: 90%;
                    ">
                        <h3 style="
                            text-align: center;
                            color: #9c27b0;
                            margin-bottom: 25px;
                            font-size: 24px;
                        ">🚉 新增車站</h3>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 10px; font-weight: bold; color: #333;">區域：</label>
                            <div id="region-buttons" style="display: flex; flex-wrap: wrap; gap: 10px;">
                                ${Object.entries(regionNames).map(([key, name]) => `
                                    <button class="region-select-btn" data-region="${key}"
                                            style="flex: 1; min-width: 70px; padding: 12px 15px; border: 2px solid #9c27b0;
                                                   border-radius: 10px; background: white; color: #9c27b0;
                                                   font-size: 16px; font-weight: bold; cursor: pointer;
                                                   transition: all 0.3s ease;">
                                        ${name}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div style="margin-bottom: 20px; position: relative;">
                            <label style="display: block; margin-bottom: 10px; font-weight: bold; color: #333;">車站名稱：</label>
                            <input type="text" id="new-station-name" placeholder="請輸入車站名稱（例：基隆、礁溪）"
                                   maxlength="10" autocomplete="off"
                                   style="width: 100%; padding: 12px 15px; border: 2px solid #ddd;
                                          border-radius: 10px; font-size: 16px; box-sizing: border-box;">
                            <div id="station-autocomplete" style="
                                position: absolute; left: 0; right: 0;
                                max-height: 200px; overflow-y: auto;
                                border: 1px solid #ddd; border-top: none;
                                border-radius: 0 0 10px 10px;
                                display: none; background: white; z-index: 2001;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                            "></div>
                        </div>

                        <div id="proxy-station-hint" style="
                            background: #f3e5f5;
                            padding: 12px;
                            border-radius: 10px;
                            margin-bottom: 20px;
                            font-size: 14px;
                            color: #7b1fa2;
                            display: none;
                        ">
                            <span id="proxy-hint-text"></span>
                        </div>

                        <div id="station-error-msg" style="
                            color: #f44336;
                            font-size: 14px;
                            margin-bottom: 15px;
                            display: none;
                        "></div>

                        <div style="display: flex; gap: 10px;">
                            <button onclick="Game.closeAddStationModal()" style="
                                flex: 1;
                                padding: 14px;
                                background: #95a5a6;
                                color: white;
                                border: none;
                                border-radius: 10px;
                                font-size: 16px;
                                font-weight: bold;
                                cursor: pointer;
                            ">取消</button>
                            <button id="confirm-add-station-btn" onclick="Game.confirmAddStation()" style="
                                flex: 1;
                                padding: 14px;
                                background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
                                color: white;
                                border: none;
                                border-radius: 10px;
                                font-size: 16px;
                                font-weight: bold;
                                cursor: pointer;
                            ">確認新增</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // 記錄選中的區域
            this._selectedRegion = null;

            // 綁定區域按鈕事件
            document.querySelectorAll('.region-select-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    // 移除其他按鈕的選中狀態
                    document.querySelectorAll('.region-select-btn').forEach(b => {
                        b.style.background = 'white';
                        b.style.color = '#9c27b0';
                    });
                    // 設定當前按鈕為選中狀態
                    btn.style.background = 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)';
                    btn.style.color = 'white';

                    this._selectedRegion = btn.dataset.region;

                    // 顯示代理站提示
                    const hintDiv = document.getElementById('proxy-station-hint');
                    const hintText = document.getElementById('proxy-hint-text');
                    const proxyName = this.getProxyStationName(this._selectedRegion);
                    hintText.textContent = `📍 票價將與「${proxyName}」站相同`;
                    hintDiv.style.display = 'block';
                });
            });

            // 🆕 自動完成功能
            this._selectedStationEn = null;
            const stationInput = document.getElementById('new-station-name');
            const autocompleteDiv = document.getElementById('station-autocomplete');
            const regionNameMap = { north: '北部', central: '中部', south: '南部', east: '東部' };

            stationInput.addEventListener('input', () => {
                const query = stationInput.value.trim();
                if (!query) {
                    autocompleteDiv.style.display = 'none';
                    return;
                }

                // 正規化查詢：臺↔台 互通搜尋
                const normalizeText = (text) => text.replace(/臺/g, '台');
                const normalizedQuery = normalizeText(query);

                const matches = this.TRA_STATION_DATABASE.filter(s => {
                    const normalizedName = normalizeText(s.name);
                    return normalizedName.includes(normalizedQuery) || s.name.includes(query);
                }).slice(0, 10);

                if (matches.length === 0) {
                    autocompleteDiv.style.display = 'none';
                    return;
                }

                autocompleteDiv.innerHTML = matches.map(s => `
                    <div class="station-suggestion" data-name="${s.name}" data-en="${s.en}" data-region="${s.region}"
                         style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f0f0f0;
                                display: flex; justify-content: space-between; align-items: center;
                                transition: background 0.2s;"
                         onmouseover="this.style.background='#f3e5f5'"
                         onmouseout="this.style.background='white'">
                        <span style="font-weight: bold; color: #333;">${s.name}</span>
                        <span style="font-size: 12px; color: #999;">${s.en} / ${regionNameMap[s.region] || s.region}</span>
                    </div>
                `).join('');
                autocompleteDiv.style.display = 'block';

                // 綁定建議項目點擊事件
                autocompleteDiv.querySelectorAll('.station-suggestion').forEach(item => {
                    item.addEventListener('click', () => {
                        const name = item.dataset.name;
                        const en = item.dataset.en;
                        const region = item.dataset.region;

                        // 填入站名
                        stationInput.value = name;
                        this._selectedStationEn = en;
                        autocompleteDiv.style.display = 'none';

                        // 自動選擇區域
                        document.querySelectorAll('.region-select-btn').forEach(b => {
                            b.style.background = 'white';
                            b.style.color = '#9c27b0';
                        });
                        const regionBtn = document.querySelector(`.region-select-btn[data-region="${region}"]`);
                        if (regionBtn) {
                            regionBtn.style.background = 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)';
                            regionBtn.style.color = 'white';
                        }
                        this._selectedRegion = region;

                        // 顯示代理站提示
                        const hintDiv = document.getElementById('proxy-station-hint');
                        const hintText = document.getElementById('proxy-hint-text');
                        const proxyName = this.getProxyStationName(region);
                        hintText.textContent = `📍 票價將與「${proxyName}」站相同`;
                        hintDiv.style.display = 'block';

                        // 隱藏錯誤訊息
                        const errorMsg = document.getElementById('station-error-msg');
                        if (errorMsg) errorMsg.style.display = 'none';
                    });
                });
            });

            // 點擊外部關閉自動完成
            document.getElementById('add-station-modal').addEventListener('click', (e) => {
                if (!e.target.closest('#station-autocomplete') && e.target.id !== 'new-station-name') {
                    autocompleteDiv.style.display = 'none';
                }
            });
        },

        // 關閉新增車站彈窗
        closeAddStationModal() {
            const modal = document.getElementById('add-station-modal');
            if (modal) {
                modal.remove();
            }
            this._selectedRegion = null;
            this._selectedStationEn = null;
        },

        // 確認新增車站
        confirmAddStation() {
            const nameInput = document.getElementById('new-station-name');
            const errorMsg = document.getElementById('station-error-msg');
            const name = nameInput.value.trim();

            // 驗證
            if (!this._selectedRegion) {
                errorMsg.textContent = '請選擇區域';
                errorMsg.style.display = 'block';
                return;
            }

            if (!name) {
                errorMsg.textContent = '請輸入車站名稱';
                errorMsg.style.display = 'block';
                nameInput.focus();
                return;
            }

            if (name.length > 10) {
                errorMsg.textContent = '車站名稱不可超過10個字';
                errorMsg.style.display = 'block';
                return;
            }

            if (this.isStationNameDuplicate(name)) {
                errorMsg.textContent = '此車站名稱已存在';
                errorMsg.style.display = 'block';
                return;
            }

            // 🆕 驗證是否在台鐵車站資料庫中（臺↔台 互通）
            const normalizeForSearch = (text) => text.replace(/臺/g, '台');
            const normalizedName = normalizeForSearch(name);
            const dbStation = this.TRA_STATION_DATABASE.find(s =>
                s.name === name || normalizeForSearch(s.name) === normalizedName
            );
            if (!dbStation && !this.isStationInBuiltInData(name)) {
                errorMsg.textContent = '此車站不在台鐵車站資料中，請從建議列表中選擇';
                errorMsg.style.display = 'block';
                return;
            }
            // 若從資料庫找到，自動設定區域和英文
            if (dbStation) {
                if (!this._selectedRegion) this._selectedRegion = dbStation.region;
                this._selectedStationEn = dbStation.en;
            }

            // 新增車站
            const success = this.addCustomStation(name, this._selectedRegion);
            if (success) {
                // 語音播報新增成功
                this.Speech.speak(`已新增${name}車站`);
                this.closeAddStationModal();
                this.renderSettingsUI(); // 重新渲染設定頁面
            } else {
                errorMsg.textContent = '新增失敗，請稍後再試';
                errorMsg.style.display = 'block';
            }
        },

        // =====================================================
        // 🆕 普通模式彈窗系統
        // =====================================================

        /**
         * 顯示普通模式步驟提示彈窗
         * @param {string} step - 步驟名稱 ('askStart', 'askEnd', 'askType', 'askCount')
         */
        showNormalModeStepPopup(step) {
            const process = this.state.gameState.ticketProcess;
            let icon = '';
            let title = '';
            let taskDescription = '';

            const speakerBtnStyle = `
                background: linear-gradient(135deg, #4caf50, #45a049);
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: white;
                padding: 6px;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
                flex-shrink: 0;
            `;

            // 根據步驟設定彈窗內容
            switch(step) {
                case 'askStart':
                    icon = '🚉';
                    title = '出發站選擇';
                    if (process.presetTask && process.presetTask.startStationName) {
                        const regionName = this.getRegionNameByStation(process.presetTask.startStation);
                        taskDescription = `<p class="task-instruction">請選擇從以下車站出發：</p>
                            <div class="task-item" style="display:flex;align-items:center;gap:10px;padding:12px 15px;background:white;border-radius:8px;">
                                <button onclick="Game.speakStationInfo('start','${regionName}','${process.presetTask.startStationName}')"
                                    style="${speakerBtnStyle}" title="播放出發站資訊">🔊</button>
                                <span class="task-item-name">📍 「${regionName}」 - 「${process.presetTask.startStationName}」站</span>
                            </div>`;
                    }
                    break;
                case 'askEnd':
                    icon = '🎯';
                    title = '到達站選擇';
                    if (process.presetTask && process.presetTask.endStationName) {
                        const regionName = this.getRegionNameByStation(process.presetTask.endStation);
                        taskDescription = `<p class="task-instruction">請選擇前往以下車站：</p>
                            <div class="task-item" style="display:flex;align-items:center;gap:10px;padding:12px 15px;background:white;border-radius:8px;">
                                <button onclick="Game.speakStationInfo('end','${regionName}','${process.presetTask.endStationName}')"
                                    style="${speakerBtnStyle}" title="播放到達站資訊">🔊</button>
                                <span class="task-item-name">📍 「${regionName}」 - 「${process.presetTask.endStationName}」站</span>
                            </div>`;
                    }
                    break;
                case 'askType':
                    icon = '🚃';
                    title = '車種選擇';
                    if (process.presetTask && process.presetTask.trainTypeName) {
                        const trainTypeName = process.presetTask.trainTypeName;
                        taskDescription = `<p class="task-instruction">請選擇以下車種：</p>
                            <div class="task-item" style="display:flex;align-items:center;gap:10px;padding:12px 15px;background:white;border-radius:8px;">
                                <button onclick="Game.speakTrainTypeInfo('${trainTypeName}')"
                                    style="${speakerBtnStyle}" title="播放車種資訊">🔊</button>
                                <span class="task-item-icon">🚄</span>
                                <span class="task-item-name">${trainTypeName}</span>
                            </div>`;
                    }
                    break;
                case 'askCount':
                    icon = '🎫';
                    title = '購票張數';
                    if (process.presetTask && process.presetTask.ticketCount) {
                        const ticketCount = process.presetTask.ticketCount;
                        taskDescription = `<p class="task-instruction">請購買以下張數：</p>
                            <div class="task-item" style="display:flex;align-items:center;gap:10px;padding:12px 15px;background:white;border-radius:8px;">
                                <button onclick="Game.speakTicketCountInfo(${ticketCount})"
                                    style="${speakerBtnStyle}" title="播放張數資訊">🔊</button>
                                <span class="task-item-icon">🔢</span>
                                <span class="task-item-name">${ticketCount} 張</span>
                            </div>`;
                    }
                    break;
            }

            // 創建彈窗HTML
            const modalHTML = `
                <div class="step-modal-overlay" id="stepModal">
                    <div class="step-modal-content">
                        <div class="step-modal-header">
                            <span class="step-modal-icon">${icon}</span>
                            <h2 style="text-align: center;">${title}</h2>
                        </div>
                        <div class="step-modal-body">
                            ${taskDescription}
                        </div>
                        <div class="step-modal-footer">
                            <button class="step-modal-btn" onclick="Game.dismissStepPopup('${step}')">我知道了</button>
                        </div>
                    </div>
                </div>
            `;

            // 添加彈窗到頁面
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            Game.Debug.log('ui', `📋 [彈窗] 顯示步驟提示: ${step}`);
        },

        /**
         * 關閉步驟提示彈窗
         * @param {string} step - 步驟名稱
         */
        dismissStepPopup(step) {
            this.playSound('click');
            const modal = document.getElementById('stepModal');
            if (modal) {
                modal.remove();
                Game.Debug.log('ui', `📋 [彈窗] 關閉步驟提示: ${step}`);
            }
        },

        /**
         * 🆕 顯示困難模式步驟提示彈窗
         * @param {string} step - 步驟名稱 ('askStart', 'askType', 'askCount')
         */
        showHardModeStepPopup(step) {
            const process = this.state.gameState.ticketProcess;
            let icon = '';
            let title = '';
            let taskDescription = '';

            // 根據步驟設定彈窗內容
            switch(step) {
                case 'askStart':
                case 'askEnd':
                    // 困難模式：顯示出發站和到達站
                    icon = '🚉';
                    title = '購票資訊';
                    if (process.presetTask && process.presetTask.startStationName && process.presetTask.endStationName) {
                        const startRegionName = this.getRegionNameByStation(process.presetTask.startStation) || '未知地區';
                        const endRegionName = this.getRegionNameByStation(process.presetTask.endStation) || '未知地區';

                        // 🔧 檢查出發站是否已選擇（已選擇且正確才顯示灰底）
                        // 只有當startStation有值且不為空字符串時才認為已完成
                        const startStationValue = process.startStation;
                        const isNull = startStationValue === null;
                        const isUndefined = startStationValue === undefined;
                        const isEmpty = startStationValue === '';
                        const isString = typeof startStationValue === 'string';
                        const hasLength = isString && startStationValue.length > 0;

                        const isStartCompleted = !isNull && !isUndefined && !isEmpty && isString && hasLength;
                        const startBgColor = isStartCompleted ? '#e0e0e0' : 'white';
                        const startTextColor = isStartCompleted ? '#999' : 'black';

                        // 详细调试日志
                        const debugInfo = {
                            step: step,
                            startStation: startStationValue,
                            isNull: isNull,
                            isUndefined: isUndefined,
                            isEmpty: isEmpty,
                            isString: isString,
                            hasLength: hasLength,
                            isCompleted: isStartCompleted,
                            bgColor: startBgColor
                        };
                        Game.Debug.log('hint', '[A6-Hint] 出發站狀態:', debugInfo);
                        Game.Debug.log('hint', '[A6-Hint] 原始值:', JSON.stringify(debugInfo));

                        taskDescription = `<p class="task-instruction">請購買以下車票：</p>
                            <div class="task-item" style="
                                white-space: nowrap;
                                width: 100%;
                                max-width: 450px;
                                margin: 0 auto 12px auto;
                                background: ${startBgColor};
                                padding: 12px 15px;
                                border-radius: 8px;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                            ">
                                <button onclick="Game.speakStationInfo('start', '${startRegionName}', '${process.presetTask.startStationName}')"
                                    style="
                                        background: linear-gradient(135deg, #4caf50, #45a049);
                                        border: none;
                                        font-size: 20px;
                                        cursor: pointer;
                                        color: white;
                                        padding: 6px;
                                        border-radius: 50%;
                                        width: 35px;
                                        height: 35px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
                                        flex-shrink: 0;
                                    "
                                    title="播放出發站資訊">🔊</button>
                                <span class="task-item-name" style="color: ${startTextColor}; flex: 1;">📍 出發站：「${startRegionName}」-「${process.presetTask.startStationName}」站</span>
                            </div>
                            <div class="task-item" style="
                                white-space: nowrap;
                                width: 100%;
                                max-width: 450px;
                                margin: 0 auto;
                                background: white;
                                padding: 12px 15px;
                                border-radius: 8px;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                            ">
                                <button onclick="Game.speakStationInfo('end', '${endRegionName}', '${process.presetTask.endStationName}')"
                                    style="
                                        background: linear-gradient(135deg, #4caf50, #45a049);
                                        border: none;
                                        font-size: 20px;
                                        cursor: pointer;
                                        color: white;
                                        padding: 6px;
                                        border-radius: 50%;
                                        width: 35px;
                                        height: 35px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
                                        flex-shrink: 0;
                                    "
                                    title="播放到達站資訊">🔊</button>
                                <span class="task-item-name" style="color: black; flex: 1;">🎯 到達站：「${endRegionName}」-「${process.presetTask.endStationName}」站</span>
                            </div>`;
                    }
                    break;
                case 'askType':
                    icon = '🚃';
                    title = '車種選擇';
                    if (process.presetTask && process.presetTask.trainTypeName) {
                        taskDescription = `<p class="task-instruction">請選擇以下車種：</p>
                            <div class="task-item" style="
                                display: flex;
                                align-items: center;
                                gap: 15px;
                                padding: 15px;
                                background: white;
                                border-radius: 8px;
                            ">
                                <button onclick="Game.speakTrainTypeInfo('${process.presetTask.trainTypeName}')"
                                    style="
                                        background: linear-gradient(135deg, #4caf50, #45a049);
                                        border: none;
                                        font-size: 20px;
                                        cursor: pointer;
                                        color: white;
                                        padding: 6px;
                                        border-radius: 50%;
                                        width: 35px;
                                        height: 35px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
                                        flex-shrink: 0;
                                    "
                                    title="播放車種資訊">🔊</button>
                                <span class="task-item-icon">🚄</span>
                                <span class="task-item-name">${process.presetTask.trainTypeName}</span>
                            </div>`;
                    }
                    break;
                case 'askCount':
                    icon = '🎫';
                    title = '購票張數';
                    if (process.presetTask && process.presetTask.ticketCount) {
                        taskDescription = `<p class="task-instruction">請購買以下張數：</p>
                            <div class="task-item" style="
                                display: flex;
                                align-items: center;
                                gap: 15px;
                                padding: 15px;
                                background: white;
                                border-radius: 8px;
                            ">
                                <button onclick="Game.speakTicketCountInfo(${process.presetTask.ticketCount})"
                                    style="
                                        background: linear-gradient(135deg, #4caf50, #45a049);
                                        border: none;
                                        font-size: 20px;
                                        cursor: pointer;
                                        color: white;
                                        padding: 6px;
                                        border-radius: 50%;
                                        width: 35px;
                                        height: 35px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
                                        flex-shrink: 0;
                                    "
                                    title="播放張數資訊">🔊</button>
                                <span class="task-item-icon">🔢</span>
                                <span class="task-item-name">${process.presetTask.ticketCount} 張</span>
                            </div>`;
                    }
                    break;
            }

            // 創建彈窗HTML
            const modalHTML = `
                <div class="step-modal-overlay" id="stepModal">
                    <div class="step-modal-content">
                        <div class="step-modal-header">
                            <span class="step-modal-icon">${icon}</span>
                            <h2 style="text-align: center;">${title}</h2>
                        </div>
                        <div class="step-modal-body">
                            ${taskDescription}
                        </div>
                        <div class="step-modal-footer">
                            <button class="step-modal-btn" onclick="Game.dismissStepPopup('${step}')">我知道了</button>
                        </div>
                    </div>
                </div>
            `;

            // 添加彈窗到頁面
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            Game.Debug.log('ui', `📋 [困難模式彈窗] 顯示步驟提示: ${step}`);
        },

        /**
         * 🆕 播放站點資訊語音
         * @param {string} type - 站點類型 ('start' 或 'end')
         * @param {string} regionName - 地區名稱
         * @param {string} stationName - 站點名稱
         */
        speakStationInfo(type, regionName, stationName) {
            Game.Debug.log('speech', `🔊 [站點語音] 播放${type === 'start' ? '出發站' : '到達站'}資訊:`, regionName, stationName);

            // 播放點擊音效
            this.playSound('click');

            // 播放語音
            const speechText = type === 'start'
                ? `從${regionName}，${stationName}出發`
                : `要抵達${regionName}，${stationName}`;

            this.Speech.speak(speechText);
        },

        /**
         * 🆕 播放車種資訊語音
         * @param {string} trainTypeName - 車種名稱
         */
        speakTrainTypeInfo(trainTypeName) {
            Game.Debug.log('audio', '🔊 [車種語音] 播放車種資訊:', trainTypeName);

            // 播放點擊音效
            this.playSound('click');

            // 播放語音
            this.Speech.speak(`要搭乘${trainTypeName}`);
        },

        /**
         * 🆕 播放張數資訊語音
         * @param {number} ticketCount - 票券張數
         */
        speakTicketCountInfo(ticketCount) {
            Game.Debug.log('audio', '🔊 [張數語音] 播放張數資訊:', ticketCount);

            // 播放點擊音效
            this.playSound('click');

            // 播放語音
            this.Speech.speak(`要買${ticketCount}張票`);
        },

        /**
         * 🆕 顯示完整任務彈窗（困難模式提示按鈕）
         * 顯示所有任務資訊，已完成的項目顯示為灰色
         */
        showCompleteTaskModal() {
            const process = this.state.gameState.ticketProcess;
            const presetTask = process.presetTask;

            if (!presetTask) {
                Game.Debug.warn('flow', '⚠️ 找不到預設任務資料');
                return;
            }

            // 檢查各步驟完成狀態
            const isStartCompleted = process.startStation !== null;
            const isEndCompleted = process.endStation !== null;
            const isTypeCompleted = process.trainType !== null;
            const isCountCompleted = process.ticketCount !== null;

            Game.Debug.log('ui', '[A6-TaskModal] 任務完成狀態:', {
                出發站: isStartCompleted,
                到達站: isEndCompleted,
                車種: isTypeCompleted,
                張數: isCountCompleted
            });

            // 取得地區名稱
            const startRegionName = this.getRegionNameByStation(presetTask.startStation);
            const endRegionName = this.getRegionNameByStation(presetTask.endStation);

            // 構建任務項目HTML
            const taskItems = `
                <div class="task-item ${isStartCompleted ? 'completed' : ''}" style="margin-bottom: 12px;">
                    ${isStartCompleted ? '<span class="task-check">✓</span>' : ''}
                    <span class="task-item-name">📍 出發站：「${startRegionName}」-「${presetTask.startStationName}」站</span>
                </div>
                <div class="task-item ${isEndCompleted ? 'completed' : ''}" style="margin-bottom: 12px;">
                    ${isEndCompleted ? '<span class="task-check">✓</span>' : ''}
                    <span class="task-item-name">🎯 到達站：「${endRegionName}」-「${presetTask.endStationName}」站</span>
                </div>
                <div class="task-item ${isTypeCompleted ? 'completed' : ''}" style="margin-bottom: 12px;">
                    ${isTypeCompleted ? '<span class="task-check">✓</span>' : ''}
                    <span class="task-item-name">🚄 車種：${presetTask.trainTypeName}</span>
                </div>
                <div class="task-item ${isCountCompleted ? 'completed' : ''}" style="margin-bottom: 12px;">
                    ${isCountCompleted ? '<span class="task-check">✓</span>' : ''}
                    <span class="task-item-name">🔢 張數：${presetTask.ticketCount} 張</span>
                </div>
            `;

            // 創建彈窗HTML
            const modalHTML = `
                <div class="step-modal-overlay" id="stepModal">
                    <div class="step-modal-content">
                        <div class="step-modal-header">
                            <span class="step-modal-icon">🎫</span>
                            <h2 style="text-align: center;">購票任務</h2>
                        </div>
                        <div class="step-modal-body">
                            <p class="task-instruction">請購買以下車票：</p>
                            ${taskItems}
                        </div>
                        <div class="step-modal-footer">
                            <button class="step-modal-btn" onclick="Game.dismissStepPopup('taskModal')">我知道了</button>
                        </div>
                    </div>
                </div>

                <style>
                    .task-item.completed {
                        opacity: 0.5;
                        position: relative;
                    }

                    .task-item.completed .task-item-name {
                        color: #999 !important;
                    }

                    .task-check {
                        position: absolute;
                        right: 10px;
                        top: 50%;
                        transform: translateY(-50%);
                        font-size: 1.5em;
                        color: #4CAF50;
                    }
                </style>
            `;

            // 添加彈窗到頁面
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            Game.Debug.log('ui', '[A6-TaskModal] 顯示完整任務彈窗');
        },

        /**
         * 顯示步驟提示（第3次錯誤後）
         * @param {string} step - 步驟名稱
         * @param {string} correctValue - 正確答案
         */
        showNormalModeStepHint(step, correctValue) {
            // 錢包彈窗已開啟時不顯示提示（操作區被遮住）
            if (document.getElementById('my-wallet-modal')) return;
            Game.Debug.log('hint', `💡 [普通模式提示] 顯示步驟提示: ${step}, 正確答案: ${correctValue}`);

            // 清除舊的提示
            document.querySelectorAll('.step-hint').forEach(el => {
                el.classList.remove('step-hint');
            });

            switch(step) {
                case 'askStart':
                case 'askEnd':
                    // 車站提示：高亮正確的車站按鈕
                    const stationBtn = document.querySelector(`.station-btn[data-station="${correctValue}"]`);
                    if (stationBtn) {
                        stationBtn.classList.add('step-hint');
                        // 確保該車站所在的區域標籤頁是顯示的
                        const regionId = this.getStationRegion(correctValue);
                        const regionTab = document.querySelector(`.station-tab[data-region="${regionId}"]`);
                        if (regionTab) {
                            regionTab.click();
                        }
                    }
                    break;
                case 'askType':
                    // 車種提示：高亮正確的車種卡片
                    const trainCard = document.querySelector(`.train-type-card[data-type="${correctValue}"]`);
                    if (trainCard) {
                        trainCard.classList.add('step-hint');
                    }
                    break;
                case 'askCount':
                    // 票數提示：高亮正確的票數按鈕或顯示文字提示
                    const countDisplay = document.querySelector('.count-display');
                    if (countDisplay) {
                        // 設定正確的票數
                        this.state.gameState.ticketProcess.ticketCount = correctValue;
                        countDisplay.textContent = correctValue;
                        countDisplay.classList.add('step-hint');
                    }
                    break;
            }
        },

        /**
         * 清除步驟提示
         * @param {string} step - 步驟名稱（可選）
         */
        clearStepHints(step) {
            document.querySelectorAll('.step-hint').forEach(el => {
                el.classList.remove('step-hint');
            });
        },

        /**
         * 重置所有錯誤計數和提示狀態
         */
        resetNormalModeState() {
            this.state.gameState.stepErrorCounts = {
                askStart: 0,
                askEnd: 0,
                askType: 0,
                askCount: 0
            };
            this.state.gameState.stepHintsShown = {
                askStart: false,
                askEnd: false,
                askType: false,
                askCount: false
            };
            this.state.gameState.paymentErrorCount = 0;
            this.state.gameState.changeErrorCount = 0;
            Game.Debug.log('hint', '🔄 [普通模式] 錯誤計數已重置');
        },


        /**
         * 生成普通模式預設任務
         */
        generateNormalModePresetTask() {
            const process = this.state.gameState.ticketProcess;
            const regions = ['north', 'central', 'south', 'east'];

            // 🆕 取得所有可用車站（現有站 + 自訂站）
            const builtInStations = Object.keys(this.storeData.StationData.Stations);
            const customStationIds = this.state.customStations.map(s => s.id);

            let startStationId, startStationName, endStationId, endStationName;

            // 🆕 如果有自訂車站，每題必定包含一個自訂車站
            if (customStationIds.length > 0) {
                const customStation = customStationIds[Math.floor(Math.random() * customStationIds.length)];
                const resolvedCustomProxyId = this.resolveStationId(customStation);
                const isStartStation = Math.random() < 0.5;

                if (isStartStation) {
                    startStationId = customStation;
                    startStationName = this.getStationName(customStation);
                    // 從內建車站選一個不同代理站的
                    const available = builtInStations.filter(s => this.resolveStationId(s) !== resolvedCustomProxyId);
                    const pick = available[Math.floor(Math.random() * available.length)];
                    endStationId = pick;
                    endStationName = this.getStationName(pick);
                } else {
                    endStationId = customStation;
                    endStationName = this.getStationName(customStation);
                    const available = builtInStations.filter(s => this.resolveStationId(s) !== resolvedCustomProxyId);
                    const pick = available[Math.floor(Math.random() * available.length)];
                    startStationId = pick;
                    startStationName = this.getStationName(pick);
                }
                Game.Debug.log('flow', `📝 [普通模式-自訂車站] 出發: ${startStationName}, 到達: ${endStationName}`);
            } else {
                // 沒有自訂車站時，維持原本邏輯
                const startRegion = regions[Math.floor(Math.random() * regions.length)];
                const startRegionStations = this.storeData.StationData.regions[startRegion];
                const startStation = startRegionStations[Math.floor(Math.random() * startRegionStations.length)];

                let endStation;
                do {
                    const endRegion = regions[Math.floor(Math.random() * regions.length)];
                    const endRegionStations = this.storeData.StationData.regions[endRegion];
                    endStation = endRegionStations[Math.floor(Math.random() * endRegionStations.length)];
                } while (endStation.id === startStation.id);

                startStationId = startStation.id;
                startStationName = startStation.displayName;
                endStationId = endStation.id;
                endStationName = endStation.displayName;
            }

            // 隨機選擇車種
            const trainTypes = [
                { id: 'local', name: '區間車' },
                { id: 'chu-kuang', name: '莒光號' },
                { id: 'tze-chiang', name: '自強號' },
                { id: 'puyuma', name: '普悠瑪' }
            ];
            const trainType = trainTypes[Math.floor(Math.random() * trainTypes.length)];

            // 隨機選擇票數（1-3張）
            const ticketCount = Math.floor(Math.random() * 3) + 1;

            // 存儲預設任務
            process.presetTask = {
                startStation: startStationId,
                startStationName: startStationName,
                endStation: endStationId,
                endStationName: endStationName,
                trainType: trainType.id,
                trainTypeName: trainType.name,
                ticketCount: ticketCount
            };

            Game.Debug.log('flow', '🎯 [普通模式] 生成預設任務:', process.presetTask);
        },

        // 渲染售票窗口UI
        renderTicketWindowUI(step, npcText = '您好！歡迎光臨火車站。請問今天要從哪裡出發？') {
            const app = document.getElementById('app');
            const process = this.state.gameState.ticketProcess;

            // 🆕 清除之前步驟的提示timeout，避免干擾
            if (this._hintTimeout1) clearTimeout(this._hintTimeout1);
            if (this._hintTimeout2) clearTimeout(this._hintTimeout2);

            let contentHTML = '';
            let resultHTML = '';
            let titleText = '火車站售票窗口 第一步：買票';

            switch(step) {
                case 'askStart':
                    // 🆕 輔助點擊模式：建立動作佇列，等待用戶點擊
                    if (this.state.settings.clickMode && this.state.gameState.clickModeState.enabled) {
                        this.ClickMode.buildActionQueue('askStart');
                        // 🔧 buildActionQueue 已通過 enableClickModeWithVisualDelay 處理等待狀態
                        // this.state.gameState.clickModeState.waitingForClick = true;
                    }

                    resultHTML = this.generateResultDisplayHTML();
                    contentHTML = this.generateStationSelectionHTML(null, 'departure') + resultHTML;
                    resultHTML = ''; // 已合併到 contentHTML 中
                    titleText = '第一步：確認起迄站';
                    break;
                case 'askEnd':
                    // 🆕 輔助點擊模式：建立動作佇列，等待用戶點擊
                    if (this.state.settings.clickMode && this.state.gameState.clickModeState.enabled) {
                        this.ClickMode.buildActionQueue('askEnd');
                        // 🔧 buildActionQueue 已通過 enableClickModeWithVisualDelay 處理等待狀態
                        // this.state.gameState.clickModeState.waitingForClick = true;
                    }

                    resultHTML = this.generateResultDisplayHTML();
                    contentHTML = this.generateStationSelectionHTML(process.startStation, 'arrival') + resultHTML;
                    resultHTML = ''; // 已合併到 contentHTML 中
                    titleText = '第一步：確認起迄站';
                    break;
                case 'askType':
                    // 🆕 輔助點擊模式：建立動作佇列，等待用戶點擊
                    if (this.state.settings.clickMode && this.state.gameState.clickModeState.enabled) {
                        this.ClickMode.buildActionQueue('askType');
                        // 🔧 buildActionQueue 已通過 enableClickModeWithVisualDelay 處理等待狀態
                        // this.state.gameState.clickModeState.waitingForClick = true;
                    }

                    contentHTML = this.generateTrainTypeSelectionHTML();
                    titleText = '第二步：確認車種';
                    break;
                case 'askCount':
                    // 🆕 輔助點擊模式：建立動作佇列，等待用戶點擊
                    if (this.state.settings.clickMode && this.state.gameState.clickModeState.enabled) {
                        this.ClickMode.buildActionQueue('askCount');
                        // 🔧 buildActionQueue 已通過 enableClickModeWithVisualDelay 處理等待狀態
                        // this.state.gameState.clickModeState.waitingForClick = true;
                    }

                    contentHTML = this.generateTicketCountSelectionHTML();
                    titleText = '第三步：確認張數';
                    break;
                case 'confirm':
                    // 🆕 輔助點擊模式：建立動作佇列，等待用戶點擊
                    if (this.state.settings.clickMode && this.state.gameState.clickModeState.enabled) {
                        this.ClickMode.buildActionQueue('confirm');
                        // 🔧 buildActionQueue 已通過 enableClickModeWithVisualDelay 處理等待狀態
                        // this.state.gameState.clickModeState.waitingForClick = true;
                    }

                    contentHTML = this.generateOrderConfirmHTML();
                    titleText = '第四步：確認購票資訊';
                    break;
            }

            app.innerHTML = `
                <div class="store-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">🚂</span>
                        </div>
                        <div class="title-bar-center">
                            <h1>${titleText}</h1>
                        </div>
                        <div class="title-bar-right">
                            <span class="quiz-progress-info">第 ${this.state.quiz.currentQuestion + 1} / ${this.state.settings.questionCount} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>

                    <div class="ticket-window-combined">
                        <div class="clerk-section">
                            <div class="npc-character">
                                <img src="../images/a6/train_clerk.png" alt="火車站售票員" style="width: 100%; height: 100%; object-fit: contain;">
                            </div>
                            ${(this.state.settings.difficulty === 'hard' || this.state.settings.difficulty === 'normal') && this.state.settings.taskType === 'preset' &&
                              ['askStart', 'askEnd', 'askType', 'askCount'].includes(step) ? `
                                <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                                <button class="npc-hint-btn" id="npc-hint-btn" onclick="Game.showStepHint('${step}')">
                                    💡 提示
                                </button>
                            ` : ''}
                            ${this.state.settings.taskType === 'free' ? `
                                <button class="npc-hint-btn" id="my-wallet-btn" onclick="Game.showMyWallet()">
                                    <img src="../images/common/icons_wallet.png" alt="💰" style="width:1.5em;height:1.5em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='💰'"> 我的錢包
                                </button>
                            ` : ''}
                        </div>
                        <div class="right-section">
                            <div class="npc-dialogue-box">
                                <p class="npc-dialogue-text" id="npc-text">${npcText}</p>
                            </div>
                            <div class="ticket-window-content">
                                ${contentHTML}
                            </div>
                        </div>
                    </div>

                    ${resultHTML}
                </div>
            `;

            // 🎯 簡單模式：顯示提示動畫（只在簡單模式下自動顯示）
            if (this.state.settings.difficulty === 'easy' && this.state.settings.taskType === 'preset') {
                if (step === 'askStart') {
                    this.updateHints('departure');
                } else if (step === 'askEnd') {
                    this.updateHints('arrival');
                }
            }
        },

        // 🆕 困難模式：顯示步驟提示（只有按下提示按鈕才會顯示）
        showStepHint(step) {
            Game.Debug.log('hint', '💡 [困難模式提示] 步驟:', step);

            const presetTask = this.state.gameState.ticketProcess.presetTask;
            if (!presetTask) {
                Game.Debug.warn('flow', '⚠️ 找不到預設任務資料');
                return;
            }

            // 🔧 [新增] 困難模式 + 指定任務：顯示分步驟任務彈窗
            const difficulty = this.state.settings.difficulty;
            const taskType = this.state.settings.taskType;

            if (difficulty === 'hard' && taskType === 'preset') {
                Game.Debug.log('hint', '[困難模式提示] 顯示步驟任務彈窗:', step);
                this.showHardModeStepPopup(step);
                return;
            }

            // 🆕 普通模式 + 指定任務：顯示步驟任務彈窗（不直接顯示動畫提示）
            if (difficulty === 'normal' && taskType === 'preset') {
                Game.Debug.log('hint', '[普通模式提示] 顯示步驟任務彈窗:', step);
                this.showNormalModeStepPopup(step);
                return;
            }

            // 🔧 [原有邏輯] 其他模式：顯示提示動畫
            // 根據不同步驟播放語音提示並顯示動畫
            let speechText = '';
            let hintType = '';

            switch(step) {
                case 'askStart':
                    speechText = `要從${presetTask.startStationName}出發`;
                    hintType = 'departure';
                    break;
                case 'askEnd':
                    speechText = `要到${presetTask.endStationName}`;
                    hintType = 'arrival';
                    break;
                case 'askType':
                    speechText = `要搭乘${presetTask.trainTypeName}`;
                    hintType = 'trainType';
                    break;
                case 'askCount':
                    speechText = `要買${presetTask.ticketCount}張票`;
                    hintType = 'ticketCount';
                    break;
            }

            // 播放語音
            if (speechText) {
                this.Speech.speak(speechText);
            }

            // 顯示視覺提示動畫
            if (hintType === 'departure' || hintType === 'arrival') {
                this.updateHints(hintType);
            } else if (hintType === 'trainType') {
                this.updateTrainTypeHint();
            } else if (hintType === 'ticketCount') {
                this.updateTicketCountHint();
            }

            // 標記該步驟已顯示提示
            this.state.gameState.stepHintsShown[step] = true;
        },

        // 🆕 顯示我的錢包（自由購票模式）
        showMyWallet() {
            Game.Debug.log('payment', '💰 [自由購票] 顯示錢包');

            const walletTotal = this.state.gameState.walletTotal;
            const playerWallet = this.state.gameState.playerWallet;

            // 統計各幣值的數量
            const denominations = {};
            playerWallet.forEach(money => {
                if (!denominations[money.value]) {
                    denominations[money.value] = 0;
                }
                denominations[money.value]++;
            });

            // 按照幣值大小排序並生成顯示項目
            const sortedDenoms = [1000, 500, 100, 50, 10, 5, 1];
            let moneyItemsHTML = sortedDenoms
                .filter(value => denominations[value] > 0) // 只顯示有的幣值
                .map(value => {
                    const quantity = denominations[value];
                    // 🆕 使用隨機正反面圖片
                    const moneyData = this.storeData.moneyItems.find(m => m.value === value);
                    const side = Math.random() < 0.5 ? 'front' : 'back';
                    const imagePath = moneyData ? this.getRandomMoneyImage(moneyData) : `../images/money/${value}_yuan_${side}.png`;

                    return `
                        <div style="
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            padding: 10px 15px;
                            background: #f8f9fa;
                            border-radius: 10px;
                            margin: 8px 0;
                        ">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <img src="${imagePath}" alt="${value}元" style="
                                    width: ${value >= 100 ? '80px' : '50px'};
                                    height: auto;
                                    object-fit: contain;
                                ">
                                <span style="font-size: 18px; font-weight: bold; color: #333;">${value}元</span>
                            </div>
                            <div style="
                                font-size: 20px;
                                font-weight: bold;
                                color: #2c3e50;
                            ">× ${quantity}</div>
                        </div>
                    `;
                }).join('');

            // 如果錢包是空的
            if (moneyItemsHTML === '') {
                moneyItemsHTML = `
                    <div style="
                        text-align: center;
                        padding: 30px;
                        color: #999;
                        font-size: 16px;
                    ">
                        錢包是空的
                    </div>
                `;
            }

            const modalHTML = `
                <div id="my-wallet-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                " onclick="if(event.target.id === 'my-wallet-modal') Game.closeMyWalletModal()">
                    <div style="
                        background: white;
                        padding: 25px;
                        border-radius: 20px;
                        box-shadow: 0 15px 40px rgba(0,0,0,0.3);
                        max-width: 450px;
                        width: 90%;
                        max-height: 85vh;
                        overflow-y: auto;
                    " onclick="event.stopPropagation()">
                        <h3 style="
                            text-align: center;
                            color: #2c3e50;
                            margin-bottom: 20px;
                            font-size: 24px;
                        "><img src="../images/common/icons_wallet.png" alt="💰" style="width:1.5em;height:1.5em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='💰'"> 我的錢包</h3>

                        <div style="margin-bottom: 15px;">
                            ${moneyItemsHTML}
                        </div>

                        <div style="
                            background: linear-gradient(135deg, #FF9800, #F57C00);
                            color: white;
                            padding: 15px;
                            border-radius: 12px;
                            text-align: center;
                            margin: 15px 0;
                        ">
                            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">錢包總金額</div>
                            <div style="font-size: 28px; font-weight: bold;">
                                ${walletTotal} 元
                            </div>
                        </div>

                        <div style="display: flex; justify-content: center; margin-top: 20px;">
                            <button onclick="Game.closeMyWalletModal()" style="
                                padding: 12px 40px;
                                background: linear-gradient(135deg, #667eea, #764ba2);
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: bold;
                                cursor: pointer;
                            ">關閉</button>
                        </div>
                    </div>
                </div>
            `;

            // 顯示彈窗
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // 播放語音
            this.Speech.speak(`您的錢包裡有${this.convertAmountToSpeech(walletTotal)}`);

            Game.Debug.log('payment', '💰 錢包總額:', walletTotal, '明細:', denominations);
        },

        // 🆕 關閉我的錢包彈窗
        closeMyWalletModal() {
            const modal = document.getElementById('my-wallet-modal');
            if (modal) {
                modal.remove();
            }
        },

        // 🆕 顯示數字輸入器（用於自訂題數）
        showNumberInput(type = 'questionCount') {
            // 檢查是否已存在數字輸入器
            const existingPopup = document.getElementById('number-input-popup');
            if (existingPopup) {
                Game.Debug.log('ui', '🔄 發現已存在的數字輸入器，先清除再重新創建');
                this.closeNumberInput();
                this.TimerManager.setTimeout(() => {
                    this.createNumberInput(type);
                }, 10, 'uiAnimation');
                return;
            }

            this.createNumberInput(type);
        },

        // 🔧 [新增] 點擊自訂題數輸入框時，觸發自訂按鈕
        handleCustomQuestionClick() {
            const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
            if (customBtn) {
                customBtn.click();
            }
        },

        // 🆕 創建數字輸入器
        createNumberInput(type = 'questionCount') {
            const title = '請輸入題數';

            const inputPopupHTML = `
                <div id="number-input-popup" class="number-input-popup" data-input-type="${type}">
                    <div class="number-input-container">
                        <div class="number-input-header">
                            <h3>${title}</h3>
                            <button class="close-btn" onclick="Game.closeNumberInput()">×</button>
                        </div>
                        <div class="number-input-display">
                            <input type="text" id="number-display" readonly value="">
                        </div>
                        <div class="number-input-buttons">
                            <button onclick="Game.appendNumber('1')">1</button>
                            <button onclick="Game.appendNumber('2')">2</button>
                            <button onclick="Game.appendNumber('3')">3</button>
                            <button onclick="Game.clearNumber()" class="clear-btn">清除</button>

                            <button onclick="Game.appendNumber('4')">4</button>
                            <button onclick="Game.appendNumber('5')">5</button>
                            <button onclick="Game.appendNumber('6')">6</button>
                            <button onclick="Game.backspaceNumber()" class="backspace-btn">⌫</button>

                            <button onclick="Game.appendNumber('7')">7</button>
                            <button onclick="Game.appendNumber('8')">8</button>
                            <button onclick="Game.appendNumber('9')">9</button>
                            <button onclick="Game.confirmNumber()" class="confirm-btn">確認</button>

                            <button onclick="Game.appendNumber('0')" class="zero-btn">0</button>
                        </div>
                    </div>
                </div>
            `;

            // 添加數字輸入器樣式
            const inputStyles = `
                <style id="number-input-styles">
                    .number-input-popup {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.7);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 10000;
                        animation: fadeIn 0.3s ease-out;
                    }

                    .number-input-container {
                        background: white;
                        border-radius: 15px;
                        padding: 20px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        width: 320px;
                        max-width: 95vw;
                        animation: bounceIn 0.3s ease-out;
                    }

                    .number-input-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #f0f0f0;
                        padding-bottom: 10px;
                    }

                    .number-input-header h3 {
                        margin: 0;
                        color: #333;
                        font-size: 18px;
                    }

                    .close-btn {
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .close-btn:hover {
                        background: #f0f0f0;
                    }

                    .number-input-display {
                        margin-bottom: 20px;
                    }

                    #number-display {
                        width: 100%;
                        padding: 15px;
                        font-size: 24px;
                        text-align: center;
                        border: 2px solid #ddd;
                        border-radius: 8px;
                        background: #f9f9f9;
                    }

                    .number-input-buttons {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 10px;
                    }

                    .number-input-buttons button {
                        padding: 15px;
                        font-size: 18px;
                        font-weight: bold;
                        border: 2px solid #ddd;
                        border-radius: 8px;
                        background: white;
                        color: #333;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .number-input-buttons button:hover {
                        background: #f0f0f0;
                        transform: translateY(-1px);
                    }

                    .number-input-buttons button:active {
                        transform: translateY(0);
                        background: #e0e0e0;
                    }

                    .number-input-buttons button.clear-btn {
                        background: #ff6b6b !important;
                        color: white !important;
                        border-color: #ff6b6b !important;
                        padding: 15px 8px !important;
                        font-size: 14px !important;
                        width: auto !important;
                        min-width: 60px !important;
                        max-width: 80px !important;
                    }

                    .number-input-buttons button.clear-btn:hover {
                        background: #ff5252 !important;
                    }

                    .number-input-buttons button.backspace-btn {
                        background: #ffa726 !important;
                        color: white !important;
                        border-color: #ffa726 !important;
                        padding: 15px 8px !important;
                        font-size: 16px !important;
                        width: auto !important;
                        min-width: 60px !important;
                        max-width: 80px !important;
                    }

                    .number-input-buttons button.backspace-btn:hover {
                        background: #ff9800 !important;
                    }

                    .number-input-buttons button.confirm-btn {
                        background: #4caf50 !important;
                        color: white !important;
                        border-color: #4caf50 !important;
                        grid-row: span 2;
                        padding: 15px 8px !important;
                        font-size: 14px !important;
                        width: auto !important;
                        min-width: 60px !important;
                        max-width: 80px !important;
                    }

                    .number-input-buttons button.confirm-btn:hover {
                        background: #45a049 !important;
                    }

                    .number-input-buttons button.zero-btn {
                        grid-column: span 3;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    @keyframes bounceIn {
                        from {
                            opacity: 0;
                            transform: scale(0.3) translateY(-50px);
                        }
                        50% {
                            opacity: 1;
                            transform: scale(1.05) translateY(10px);
                        }
                        70% {
                            transform: scale(0.95) translateY(-5px);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }
                </style>
            `;

            // 添加到頁面
            if (!document.getElementById('number-input-styles')) {
                document.head.insertAdjacentHTML('beforeend', inputStyles);
            }
            document.body.insertAdjacentHTML('beforeend', inputPopupHTML);
        },

        // 🆕 關閉數字輸入器
        closeNumberInput() {
            const popup = document.getElementById('number-input-popup');
            if (popup) popup.remove();
        },

        // 🆕 添加數字到輸入框
        appendNumber(digit) {
            const display = document.getElementById('number-display');
            if (!display) return;
            this.playSound('keypad');
            if (display.value === '' || display.value === '0') {
                display.value = digit;
            } else {
                display.value += digit;
            }
        },

        // 🆕 清除輸入
        clearNumber() {
            const display = document.getElementById('number-display');
            if (!display) return;
            this.playSound('keypad');
            display.value = '';
        },

        // 🆕 退格
        backspaceNumber() {
            const display = document.getElementById('number-display');
            if (!display) return;
            this.playSound('keypad');
            if (display.value.length > 1) {
                display.value = display.value.slice(0, -1);
            } else {
                display.value = '';
            }
        },

        // 🆕 確認輸入的數字
        confirmNumber() {
            const display = document.getElementById('number-display');
            const popup = document.getElementById('number-input-popup');
            const inputType = popup ? popup.dataset.inputType : 'questionCount';

            if (!display) return;

            const inputValue = parseInt(display.value);

            if (inputType === 'questionCount') {
                // 題數輸入
                if (inputValue > 0 && inputValue <= 100) {
                    // 更新設定
                    this.state.settings.questionCount = inputValue;
                    Game.Debug.log('ui', `[Setting] 自訂題數已設定: questionCount = ${inputValue}`);
                    this.playSound('click');

                    // 🔧 [修正] 直接更新DOM，避免重新渲染整個設定畫面（防止閃爍）
                    const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
                    if (customBtn) {
                        const group = customBtn.closest('.button-group');
                        group.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                        customBtn.classList.add('active');
                    }

                    const customDisplay = document.querySelector('.custom-question-display');
                    const customInput = document.getElementById('custom-question-count-a6');
                    if (customDisplay && customInput) {
                        customDisplay.style.display = 'block';
                        customInput.value = `${inputValue}題`;
                        customInput.style.background = '#667eea';
                        customInput.style.color = 'white';
                        customInput.style.borderColor = '#667eea';
                    }

                    // 🔧 [修正] 更新開始按鈕狀態（避免按鈕卡在"請完成所有設定選項"）
                    this.updateStartButtonState();

                    // 關閉數字輸入器
                    this.closeNumberInput();
                } else {
                    alert('請輸入1-100之間的有效題數！');
                }
            }
        },

        // 🆕 更新車種提示動畫
        updateTrainTypeHint() {
            const presetTask = this.state.gameState.ticketProcess.presetTask;
            if (!presetTask) return;

            // 清除所有車種卡片的提示
            document.querySelectorAll('.train-type-card').forEach(card => {
                card.classList.remove('train-type-hint');
            });

            // 添加「點這裡」提示動畫到正確的車種卡片
            const correctCard = document.querySelector(`.train-type-card[data-type="${presetTask.trainType}"]`);
            if (correctCard) {
                correctCard.classList.add('train-type-hint');
                Game.Debug.log('hint', '[Train] 顯示車種提示:', presetTask.trainType);
            }
        },

        // 🆕 更新張數提示動畫（自動切換到正確張數）
        updateTicketCountHint() {
            const presetTask = this.state.gameState.ticketProcess.presetTask;
            if (!presetTask) return;

            // 🆕 自動切換張數顯示到正確答案
            const display = document.getElementById('ticket-count-display');
            if (display) {
                display.textContent = presetTask.ticketCount;
                // 添加高亮動畫
                display.style.animation = 'pulse-highlight 1.5s infinite';
                display.style.boxShadow = '0 0 20px rgba(255, 193, 7, 0.8)';
                display.style.border = '3px solid #FFC107';
                display.style.borderRadius = '10px';
                Game.Debug.log('hint', '[Train] 自動切換張數到:', presetTask.ticketCount);
            }
        },

        // 🆕 普通/困難模式：顯示付款提示
        showPaymentHint() {
            Game.Debug.log('hint', '💡 [付款提示] 提示按鈕被點擊');

            // 🆕 點擊提示按鈕後，開始顯示實際已付金額
            this._showPaidAmount = true;

            const targetCost = this.state.gameState.currentTransaction.totalCost;
            const paidAmount = this.state.gameState.currentTransaction.amountPaid;

            // 🆕 更新徽章顯示實際已付金額
            this._updateCurrentPaymentBadge();

            // 🆕 困難模式：播放已付金額語音
            if (this.state.settings.difficulty === 'hard' && paidAmount > 0) {
                this.Speech.speak(`已付${this.convertAmountToSpeech(paidAmount)}`, { interrupt: true });
            }

            // 如果已經有付款，先清空回到錢包
            if (paidAmount > 0) {
                this.returnAllPaidMoney();
            }

            // 計算最佳付款方案，並以彈窗呈現
            this.TimerManager.setTimeout(() => {
                const allAvailableMoney = [...this.state.gameState.playerWallet];
                const optimalPayment = this.calculateOptimalPayment(targetCost, allAvailableMoney);

                if (!optimalPayment || optimalPayment.length === 0) {
                    this.Speech.speak('你的錢包裡沒有足夠的錢');
                    return;
                }

                // 生成語音提示文字
                let speechText = `建議付款：`;
                const valueCounts = {};
                optimalPayment.forEach(val => {
                    valueCounts[val] = (valueCounts[val] || 0) + 1;
                });
                const parts = [];
                for (const val in valueCounts) {
                    parts.push(`${val}元${valueCounts[val]}張`);
                }
                speechText += parts.join('、');

                // 建立提示清單 HTML（含金錢圖片）
                let hintListHTML = '';
                const sortedValues = Object.keys(valueCounts).map(Number).sort((a, b) => b - a);
                sortedValues.forEach(val => {
                    const cnt = valueCounts[val];
                    const moneyData = this.storeData.moneyItems.find(item => item.value === val);
                    const imgSrc = moneyData ? this.getRandomMoneyImage(moneyData) : '';
                    const isCoin = val < 100;
                    const imgStyle = isCoin
                        ? 'width:50px;height:50px;object-fit:contain;'
                        : 'width:80px;height:auto;max-height:50px;object-fit:contain;';
                    hintListHTML += `
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:10px 14px;background:#f9f9f9;border-radius:10px;border:1px solid #eee;">
                            ${imgSrc ? `<img src="${imgSrc}" alt="${val}元" style="${imgStyle}">` : ''}
                            <span style="font-size:20px;font-weight:bold;color:#333;">${val}元</span>
                            <span style="color:#999;font-size:16px;">×</span>
                            <span style="font-size:20px;font-weight:bold;color:#e65100;">${cnt} 張</span>
                        </div>`;
                });

                // 儲存提示資料供確認按鈕使用
                this._lastOptimalPayment = optimalPayment;
                this._lastPaymentHintSpeech = speechText;

                // 🆕 顯示提示彈窗
                const existingModal = document.getElementById('paymentHintModal');
                if (existingModal) existingModal.remove();

                const modalHTML = `
                    <div class="step-modal-overlay" id="paymentHintModal" style="z-index:10050;">
                        <div class="step-modal-content">
                            <div class="step-modal-header">
                                <span class="step-modal-icon">💡</span>
                                <h2 style="text-align:center;">付款提示</h2>
                            </div>
                            <div class="step-modal-body">
                                <p class="task-instruction">建議的付款方式：</p>
                                ${hintListHTML}
                            </div>
                            <div class="step-modal-footer" style="display:flex;gap:10px;justify-content:center;">
                                <button onclick="Game.replayPaymentHintSpeech()"
                                    style="background:linear-gradient(135deg,#4caf50,#45a049);border:none;color:white;padding:8px 18px;border-radius:25px;cursor:pointer;font-size:16px;display:flex;align-items:center;gap:6px;">
                                    🔊 再播一次
                                </button>
                                <button class="step-modal-btn" onclick="Game.confirmPaymentHint()">我知道了</button>
                            </div>
                        </div>
                    </div>
                `;

                document.body.insertAdjacentHTML('beforeend', modalHTML);

                // 自動播放語音
                this.Speech.speak(speechText, { interrupt: true });

                Game.Debug.log('hint', '💡 [付款提示] 彈窗已顯示，語音:', speechText);
            }, 100, 'payment');
        },

        /**
         * 🆕 重播付款提示語音
         */
        replayPaymentHintSpeech() {
            this.playSound('click');
            if (this._lastPaymentHintSpeech) {
                this.Speech.speak(this._lastPaymentHintSpeech, { interrupt: true });
            }
        },

        /**
         * 🆕 確認付款提示彈窗，套用視覺勾勾提示
         */
        confirmPaymentHint() {
            this.playSound('click');
            const modal = document.getElementById('paymentHintModal');
            if (modal) modal.remove();
            if (this._lastOptimalPayment) {
                this.showWalletHintWithTicks(this._lastOptimalPayment.map(val => ({ value: val })));
            }
        },

        // 🆕 清空所有已付款項並退回錢包
        returnAllPaidMoney() {
            const paidMoney = [...this.state.gameState.currentTransaction.paidMoney];

            paidMoney.forEach(item => {
                this.handleMoneyReturn(item.index);
            });

            Game.Debug.log('hint', '💰 [付款提示] 已清空所有付款');
        },

        // 🆕 在錢包中顯示提示打勾標記
        showWalletHintWithTicks(moneyObjects) {
            // 移除所有現有的打勾標記
            document.querySelectorAll('.money-item').forEach(item => {
                item.classList.remove('show-correct-tick');
            });

            // 為建議的錢幣添加打勾標記
            const walletItems = document.querySelectorAll('#wallet-display .money-item');
            const usedIndices = new Set();

            moneyObjects.forEach(moneyObj => {
                for (let i = 0; i < walletItems.length; i++) {
                    const item = walletItems[i];
                    const itemValue = parseInt(item.dataset.value);
                    const itemIndex = item.dataset.index;

                    if (itemValue === moneyObj.value && !usedIndices.has(itemIndex) && item.style.display !== 'none') {
                        item.classList.add('show-correct-tick');
                        usedIndices.add(itemIndex);
                        break;
                    }
                }
            });
        },

        // 生成車站選擇HTML
        generateStationSelectionHTML(excludeStationId, selectionType) {
            const regions = this.storeData.StationData.regions;
            const regionNames = {
                north: '北部',
                central: '中部',
                south: '南部',
                east: '東部'
            };

            const isDeparture = selectionType === 'departure';
            const selectionTitle = isDeparture
                ? '<h2 style="text-align: center; color: #1976d2; margin-bottom: 20px;">🚉 請選擇出發站</h2>'
                : '<h2 style="text-align: center; color: #388e3c; margin-bottom: 20px;">🎯 請選擇抵達站</h2>';

            let html = selectionTitle;
            html += '<div class="station-tabs">';
            for (const regionKey in regions) {
                html += `<button class="station-tab" data-region="${regionKey}">${regionNames[regionKey]}</button>`;
            }
            html += '</div>';

            for (const regionKey in regions) {
                const stations = regions[regionKey];
                html += `<div class="station-grid" data-region-content="${regionKey}" style="display: none;">`;

                // 渲染現有車站
                for (const station of stations) {
                    const isDisabled = station.id === excludeStationId;
                    const disabledClass = isDisabled ? 'disabled' : '';

                    html += `
                        <button class="station-btn ${disabledClass}"
                                data-station="${station.id}"
                                ${isDisabled ? 'disabled' : ''}>
                            ${station.displayName}
                        </button>
                    `;
                }

                // 🆕 渲染該區域的自訂車站
                const customStationsInRegion = this.state.customStations.filter(s => s.region === regionKey);
                for (const customStation of customStationsInRegion) {
                    const isDisabled = customStation.id === excludeStationId;
                    const disabledClass = isDisabled ? 'disabled' : '';

                    html += `
                        <button class="station-btn custom-station ${disabledClass}"
                                data-station="${customStation.id}"
                                data-custom="true"
                                ${isDisabled ? 'disabled' : ''}
                                style="border: 2px dashed #9c27b0; background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);">
                            ★${customStation.displayName}
                        </button>
                    `;
                }

                html += '</div>';
            }

            // 添加確認和重新選擇按鈕（出發站和抵達站都顯示）
            const btnId = isDeparture ? 'departure' : 'arrival';
            html += `
                <div style="text-align: center; margin-top: 30px; display: flex; justify-content: center; gap: 20px;">
                    <button class="reset-station-btn" id="reset-${btnId}-btn"
                        style="padding: 15px 40px; border: 2px solid #ff9800; border-radius: 25px;
                        background: white; color: #ff9800;
                        font-size: 18px; font-weight: bold; cursor: pointer;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        transition: all 0.3s ease;">
                        重新選擇
                    </button>
                    <button class="confirm-station-btn" id="confirm-${btnId}-btn" disabled
                        style="padding: 15px 50px; border: none; border-radius: 25px;
                        background: #ccc; color: #666;
                        font-size: 18px; font-weight: bold; cursor: not-allowed;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        transition: all 0.3s ease; opacity: 0.6;">
                        確認
                    </button>
                </div>
            `;

            // 綁定事件（在渲染後執行）
            this.TimerManager.setTimeout(() => {
                // Tab 切換
                document.querySelectorAll('.station-tab').forEach((tab, index) => {
                    // 🎯 簡單模式預設任務：只激活目標地區
                    const isEasyPreset = this.state.settings.difficulty === 'easy' &&
                                        this.state.settings.taskType === 'preset';

                    if (isEasyPreset) {
                        const process = this.state.gameState.ticketProcess;
                        const targetStationId = isDeparture ? process.startStation : process.endStation;
                        const targetRegionId = this.getStationRegion(targetStationId);

                        // 只激活目標地區
                        if (tab.dataset.region === targetRegionId) {
                            tab.classList.add('active');
                            document.querySelector(`[data-region-content="${tab.dataset.region}"]`).style.display = 'grid';
                        }
                    } else {
                        // 其他模式：激活第一個地區
                        if (index === 0) {
                            tab.classList.add('active');
                            document.querySelector(`[data-region-content="${tab.dataset.region}"]`).style.display = 'grid';
                        }
                    }

                    // Phase 3：遷移至 EventManager
                    this.EventManager.on(tab, 'click', () => {
                        this.playSound('click');
                        document.querySelectorAll('.station-tab').forEach(t => t.classList.remove('active'));
                        document.querySelectorAll('[data-region-content]').forEach(c => c.style.display = 'none');

                        tab.classList.add('active');
                        document.querySelector(`[data-region-content="${tab.dataset.region}"]`).style.display = 'grid';

                        // 🎯 簡單模式：當點擊地區按鈕時，清除地區提示並顯示車站提示（第二階段）
                        if (this.state.settings.difficulty === 'easy' &&
                            this.state.settings.taskType === 'preset') {
                            // 清除地區按鈕提示
                            document.querySelectorAll('.region-btn-hint').forEach(el => {
                                el.classList.remove('region-btn-hint');
                            });

                            const process = this.state.gameState.ticketProcess;
                            const targetStationId = isDeparture ? process.startStation : process.endStation;
                            const targetRegionId = this.getStationRegion(targetStationId);

                            // 如果點擊的是正確的地區，顯示車站提示
                            if (tab.dataset.region === targetRegionId) {
                                // 延遲顯示車站提示，確保DOM已渲染
                                this.TimerManager.setTimeout(() => {
                                    this.highlightStationButton(targetStationId);
                                }, 300, 'uiAnimation');
                            }
                        }
                    }, {}, 'stationSelect');
                });

                // 🎯 預設模式：記錄正確答案（用於除錯）
                const isPresetMode = this.state.settings.taskType === 'preset';
                const process = this.state.gameState.ticketProcess;
                let correctStationId = null;

                if (isPresetMode) {
                    correctStationId = isDeparture ? process.startStation : process.endStation;
                    Game.Debug.log('flow', `🎯 [預設模式] 正確答案: ${correctStationId}`);
                }

                // 註：舊的自動高亮代碼已移除，改用新的提示系統（updateHints）

                // 車站選擇（出發站和抵達站統一處理：點擊選中，確認按鈕進入下一步）
                let selectedStation = null;
                const confirmBtn = document.getElementById(`confirm-${btnId}-btn`);
                const resetBtn = document.getElementById(`reset-${btnId}-btn`);

                if (isDeparture) {
                    // 出發站：點擊選中，確認按鈕進入下一步（Phase 3：遷移至 EventManager）
                    document.querySelectorAll('.station-btn:not(.disabled)').forEach(btn => {
                        this.EventManager.on(btn, 'click', () => {
                            this.playSound('click');
                            const stationId = btn.dataset.station;
                            Game.Debug.log('flow', '🚉 選擇出發站:', stationId);

                            // 🎯 簡單模式預設任務：驗證是否選擇正確
                            const isEasyPreset = this.state.settings.taskType === 'preset' &&
                                                this.state.settings.difficulty === 'easy';
                            if (isEasyPreset) {
                                const correctStation = this.state.gameState.ticketProcess.startStation;
                                if (stationId !== correctStation) {
                                    // ❌ 選擇錯誤，顯示錯誤訊息
                                    Game.Debug.log('hint', '❌ [簡單模式] 選擇錯誤的出發站');
                                    this.showErrorFeedback(btn, '請選擇正確的出發站');
                                    this.playSound('error');
                                    return; // 阻止繼續
                                }
                            }

                            // 🆕 普通模式預設任務：錯誤追蹤
                            const isNormalPreset = this.state.settings.taskType === 'preset' &&
                                                  this.state.settings.difficulty === 'normal';
                            if (isNormalPreset) {
                                const correctStation = this.state.gameState.ticketProcess.presetTask.startStation;
                                if (stationId !== correctStation) {
                                    // ❌ 選擇錯誤
                                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                                    this.state.gameState.stepErrorCounts.askStart++;
                                    const errorCount = this.state.gameState.stepErrorCounts.askStart;
                                    Game.Debug.log('hint', `❌ [普通模式] 選擇錯誤的出發站 (錯誤次數: ${errorCount})`);
                                    this.showErrorFeedback(btn, '請再試一次');
                                    this.playErrorSound(); // 🆕 播放錯誤音效

                                    // 第3次錯誤後顯示提示（只在非困難模式）
                                    if (this.state.settings.difficulty !== 'hard' && errorCount >= 3 && !this.state.gameState.stepHintsShown.askStart) {
                                        this.state.gameState.stepHintsShown.askStart = true;
                                        this.TimerManager.setTimeout(() => {
                                            this.showNormalModeStepHint('askStart', correctStation);
                                        }, 500, 'hint');
                                    }
                                    return; // 阻止繼續
                                }
                            }

                            // 🆕 困難模式預設任務：錯誤追蹤（不自動顯示提示）
                            const isHardPreset = this.state.settings.taskType === 'preset' &&
                                                this.state.settings.difficulty === 'hard';
                            if (isHardPreset) {
                                const correctStation = this.state.gameState.ticketProcess.presetTask.startStation;
                                if (stationId !== correctStation) {
                                    // ❌ 選擇錯誤
                                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                                    this.state.gameState.stepErrorCounts.askStart++;
                                    const errorCount = this.state.gameState.stepErrorCounts.askStart;
                                    Game.Debug.log('hint', `❌ [困難模式] 選擇錯誤的出發站 (錯誤次數: ${errorCount})`);
                                    this.showErrorFeedback(btn, '請再試一次');
                                    this.playErrorSound();
                                    // 困難模式：不自動顯示提示，只能透過提示按鈕
                                    return; // 阻止繼續
                                }
                            }

                            // 🎯 清除高亮動畫和提示
                            this.clearAllHints();
                            btn.style.animation = '';
                            btn.style.boxShadow = '';
                            btn.style.border = '';

                            // 移除所有按鈕的選中樣式
                            document.querySelectorAll('.station-btn').forEach(b => {
                                b.classList.remove('selected');
                                b.style.backgroundColor = '';
                                b.style.color = '';
                                b.style.fontWeight = '';
                            });

                            // 添加選中樣式
                            btn.classList.add('selected');
                            btn.style.backgroundColor = '#1976d2';
                            btn.style.color = 'white';
                            btn.style.fontWeight = 'bold';

                            selectedStation = stationId;

                            // 🎯 預設模式：標記使用者已點擊選擇出發站
                            const isPresetMode = this.state.settings.taskType === 'preset';
                            if (isPresetMode) {
                                this.state.gameState.ticketProcess.userSelectedStartStation = true;
                                Game.Debug.log('flow', '✅ [預設模式] 使用者已選擇出發站');
                            }

                            // 🎯 更新結果顯示面板（但不播放語音，等按確認後才播放）
                            const stationName = this.getStationName(stationId);
                            const startStationDisplay = document.getElementById('start-station-display');
                            if (startStationDisplay) {
                                startStationDisplay.textContent = stationName;
                                startStationDisplay.style.animation = 'pulse 0.3s ease';
                            }

                            // 啟用確認按鈕
                            confirmBtn.disabled = false;
                            confirmBtn.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';
                            confirmBtn.style.color = 'white';
                            confirmBtn.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
                            confirmBtn.style.opacity = '1';
                            confirmBtn.style.cursor = 'pointer';

                            // 🎯 簡單模式：顯示確認按鈕提示
                            if (this.state.settings.difficulty === 'easy' &&
                                this.state.settings.taskType === 'preset') {
                                this.TimerManager.setTimeout(() => {
                                    this.highlightConfirmButton('confirm-departure-btn');
                                }, 300, 'hint');
                            }
                        }, {}, 'stationSelect');
                    });

                    // 確認按鈕事件（Phase 3：遷移至 EventManager）
                    this.EventManager.on(confirmBtn, 'click', () => {
                        this.playSound('click');
                        if (selectedStation && !confirmBtn.disabled) {
                            Game.Debug.log('flow', '✅ 確認出發站:', selectedStation);

                            // 🚫 禁用確認按鈕，防止重複點擊
                            confirmBtn.disabled = true;
                            confirmBtn.style.opacity = '0.5';
                            confirmBtn.style.cursor = 'not-allowed';

                            // 🚫 禁用所有車站按鈕，防止在進入下一步前重新選擇
                            document.querySelectorAll('.station-btn').forEach(b => {
                                b.disabled = true;
                                b.style.cursor = 'not-allowed';
                                b.style.opacity = '0.6';
                            });

                            // 🚫 禁用所有地區標籤按鈕
                            document.querySelectorAll('.station-tab').forEach(t => {
                                t.disabled = true;
                                t.style.cursor = 'not-allowed';
                                t.style.opacity = '0.6';
                            });

                            // 🎯 清除所有車站按鈕的高亮動畫和提示
                            this.clearAllHints();
                            document.querySelectorAll('.station-btn').forEach(b => {
                                b.style.animation = '';
                                b.style.boxShadow = '';
                                b.style.border = '';
                            });

                            // 🆕 普通模式：播放煙火和答對音效
                            const isNormalPreset = this.state.settings.taskType === 'preset' &&
                                                  this.state.settings.difficulty === 'normal';
                            if (isNormalPreset) {
                                // 播放答對音效
                                this.playCorrectSound();
                                // 播放煙火動畫
                                this.playFireworks();
                            }

                            // 🔊 播放語音及更新NPC文字提示
                            const stationName = this.getStationName(selectedStation);
                            const departureMessage = `好的，從${stationName}站出發`;
                            const npcTextElement = document.getElementById('npc-text');
                            if (npcTextElement) {
                                npcTextElement.textContent = departureMessage;
                            }

                            // 🎙️ 播放語音並等待播放完成後才進入下一步
                            this.Speech.speak(departureMessage, () => {
                                // 語音播放完成後才進入下一步
                                this.DialogueManager.nextStep(selectedStation);
                            });
                        }
                    }, {}, 'stationSelect');

                    // 🔄 重新選擇按鈕事件（Phase 3：遷移至 EventManager）
                    if (resetBtn) {
                        this.EventManager.on(resetBtn, 'click', () => {
                            Game.Debug.log('flow', '🔄 重新選擇出發站');

                            // 清空選擇
                            selectedStation = null;

                            // 移除所有按鈕的選中樣式
                            document.querySelectorAll('.station-btn').forEach(b => {
                                b.classList.remove('selected');
                                b.style.backgroundColor = '';
                                b.style.color = '';
                                b.style.fontWeight = '';
                                b.style.animation = '';
                                b.style.boxShadow = '';
                                b.style.border = '';
                            });

                            // 禁用確認按鈕
                            confirmBtn.disabled = true;
                            confirmBtn.style.background = '#ccc';
                            confirmBtn.style.color = '#666';
                            confirmBtn.style.cursor = 'not-allowed';
                            confirmBtn.style.opacity = '0.6';

                            // 清空結果顯示
                            const startStationDisplay = document.getElementById('start-station-display');
                            if (startStationDisplay) {
                                startStationDisplay.textContent = '---';
                            }
                        }, {}, 'stationSelect');
                    }
                } else {
                    // 抵達站：點擊只選擇，不進入下一步（Phase 3：遷移至 EventManager）
                    let selectedArrivalStation = null;

                    document.querySelectorAll('.station-btn:not(.disabled)').forEach(btn => {
                        this.EventManager.on(btn, 'click', () => {
                            this.playSound('click');
                            const stationId = btn.dataset.station;

                            // 🎯 簡單模式預設任務：驗證是否選擇正確
                            const isEasyPreset = this.state.settings.taskType === 'preset' &&
                                                this.state.settings.difficulty === 'easy';
                            if (isEasyPreset) {
                                const correctStation = this.state.gameState.ticketProcess.endStation;
                                if (stationId !== correctStation) {
                                    // ❌ 選擇錯誤，顯示錯誤訊息
                                    Game.Debug.log('hint', '❌ [簡單模式] 選擇錯誤的抵達站');
                                    this.showErrorFeedback(btn, '請選擇正確的抵達站');
                                    this.playSound('error');
                                    return; // 阻止繼續
                                }
                            }

                            // 🆕 普通模式預設任務：錯誤追蹤
                            const isNormalPreset = this.state.settings.taskType === 'preset' &&
                                                  this.state.settings.difficulty === 'normal';
                            if (isNormalPreset) {
                                const correctStation = this.state.gameState.ticketProcess.presetTask.endStation;
                                if (stationId !== correctStation) {
                                    // ❌ 選擇錯誤
                                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                                    this.state.gameState.stepErrorCounts.askEnd++;
                                    const errorCount = this.state.gameState.stepErrorCounts.askEnd;
                                    Game.Debug.log('hint', `❌ [普通模式] 選擇錯誤的抵達站 (錯誤次數: ${errorCount})`);
                                    this.showErrorFeedback(btn, '請再試一次');
                                    this.playErrorSound(); // 🆕 播放錯誤音效

                                    // 第3次錯誤後顯示提示（只在非困難模式）
                                    if (this.state.settings.difficulty !== 'hard' && errorCount >= 3 && !this.state.gameState.stepHintsShown.askEnd) {
                                        this.state.gameState.stepHintsShown.askEnd = true;
                                        this.TimerManager.setTimeout(() => {
                                            this.showNormalModeStepHint('askEnd', correctStation);
                                        }, 500, 'hint');
                                    }
                                    return; // 阻止繼續
                                }
                            }

                            // 🆕 困難模式預設任務：錯誤追蹤（不自動顯示提示）
                            const isHardPreset = this.state.settings.taskType === 'preset' &&
                                                this.state.settings.difficulty === 'hard';
                            if (isHardPreset) {
                                const correctStation = this.state.gameState.ticketProcess.presetTask.endStation;
                                if (stationId !== correctStation) {
                                    // ❌ 選擇錯誤
                                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                                    this.state.gameState.stepErrorCounts.askEnd++;
                                    const errorCount = this.state.gameState.stepErrorCounts.askEnd;
                                    Game.Debug.log('hint', `❌ [困難模式] 選擇錯誤的抵達站 (錯誤次數: ${errorCount})`);
                                    this.showErrorFeedback(btn, '請再試一次');
                                    this.playErrorSound();
                                    // 困難模式：不自動顯示提示，只能透過提示按鈕
                                    return; // 阻止繼續
                                }
                            }

                            // 🎯 清除所有提示動畫
                            this.clearAllHints();

                            // 移除所有按鈕的選中樣式
                            document.querySelectorAll('.station-btn').forEach(b => {
                                b.classList.remove('selected');
                                b.style.backgroundColor = '';
                                b.style.color = '';
                                b.style.fontWeight = '';
                            });

                            // 添加選中樣式
                            btn.classList.add('selected');
                            btn.style.backgroundColor = '#388e3c';
                            btn.style.color = 'white';
                            btn.style.fontWeight = 'bold';

                            selectedArrivalStation = stationId;
                            Game.Debug.log('flow', '🚉 選擇抵達站:', selectedArrivalStation);

                            // 🎯 預設模式：標記使用者已點擊選擇抵達站
                            const isPresetMode = this.state.settings.taskType === 'preset';
                            if (isPresetMode) {
                                this.state.gameState.ticketProcess.userSelectedEndStation = true;
                                Game.Debug.log('flow', '✅ [預設模式] 使用者已點擊抵達站按鈕');
                            }

                            // 🎯 更新結果顯示面板（但不播放語音，等按確認後才播放）
                            const stationName = this.getStationName(selectedArrivalStation);
                            const endStationDisplay = document.getElementById('end-station-display');
                            if (endStationDisplay) {
                                endStationDisplay.textContent = stationName;
                                endStationDisplay.style.animation = 'pulse 0.3s ease';
                            }

                            // 啟用確認按鈕
                            confirmBtn.disabled = false;
                            confirmBtn.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';
                            confirmBtn.style.color = 'white';
                            confirmBtn.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
                            confirmBtn.style.opacity = '1';
                            confirmBtn.style.cursor = 'pointer';

                            // 🎯 簡單模式：顯示確認按鈕提示（Phase 2：遷移至 TimerManager）
                            if (this.state.settings.difficulty === 'easy' &&
                                this.state.settings.taskType === 'preset') {
                                this.TimerManager.setTimeout(() => {
                                    this.highlightConfirmButton('confirm-arrival-btn');
                                }, 300, 'hint');
                            }
                        }, {}, 'stationSelect');
                    });

                    // 確認按鈕事件（Phase 3：遷移至 EventManager）
                    this.EventManager.on(confirmBtn, 'click', () => {
                        this.playSound('click');
                        if (selectedArrivalStation && !confirmBtn.disabled) {
                            Game.Debug.log('flow', '✅ 確認抵達站:', selectedArrivalStation);

                            // 🚫 禁用確認按鈕，防止重複點擊
                            confirmBtn.disabled = true;
                            confirmBtn.style.opacity = '0.5';
                            confirmBtn.style.cursor = 'not-allowed';

                            // 🚫 禁用所有車站按鈕，防止在進入下一步前重新選擇
                            document.querySelectorAll('.station-btn').forEach(b => {
                                b.disabled = true;
                                b.style.cursor = 'not-allowed';
                                b.style.opacity = '0.6';
                            });

                            // 🚫 禁用所有地區標籤按鈕
                            document.querySelectorAll('.station-tab').forEach(t => {
                                t.disabled = true;
                                t.style.cursor = 'not-allowed';
                                t.style.opacity = '0.6';
                            });

                            // 🎯 清除所有車站按鈕的高亮動畫和提示
                            this.clearAllHints();
                            document.querySelectorAll('.station-btn').forEach(b => {
                                b.style.animation = '';
                                b.style.boxShadow = '';
                                b.style.border = '';
                            });

                            // 🆕 普通模式：播放煙火和答對音效
                            const isNormalPreset = this.state.settings.taskType === 'preset' &&
                                                  this.state.settings.difficulty === 'normal';
                            if (isNormalPreset) {
                                // 播放答對音效
                                this.playCorrectSound();
                                // 播放煙火動畫
                                this.playFireworks();
                            }

                            // 🔊 播放語音及更新NPC文字提示
                            const stationName = this.getStationName(selectedArrivalStation);
                            const arrivalMessage = `好的，要到達${stationName}站`;
                            const npcTextElement = document.getElementById('npc-text');
                            if (npcTextElement) {
                                npcTextElement.textContent = arrivalMessage;
                            }

                            // 🎙️ 播放語音並等待播放完成後才進入下一步
                            this.Speech.speak(arrivalMessage, () => {
                                // 語音播放完成後才進入下一步
                                this.DialogueManager.nextStep(selectedArrivalStation);
                            });
                        }
                    }, {}, 'stationSelect');

                    // 🔄 重新選擇按鈕事件（Phase 3：遷移至 EventManager）
                    const resetBtn = document.getElementById('reset-arrival-btn');
                    if (resetBtn) {
                        this.EventManager.on(resetBtn, 'click', () => {
                            Game.Debug.log('flow', '🔄 重新選擇 - 從頭開始');

                            // 清空所有購票流程資料（保留預設任務，避免提示鈕找不到資料）
                            const savedPresetTask = this.state.gameState.ticketProcess.presetTask;
                            this.state.gameState.ticketProcess = {
                                startStation: null,
                                endStation: null,
                                trainType: null,
                                ticketCount: 1,
                                unitPrice: 0,
                                totalPrice: 0,
                                userSelectedStartStation: false,
                                userSelectedEndStation: false,
                                presetTask: savedPresetTask || null
                            };

                            // 重新開始對話流程（從選擇出發站開始）
                            this.DialogueManager.start();
                        }, {}, 'stationSelect');
                    }
                }
            }, 100, 'gameUI');

            return html;
        },

        // 🆕 生成結果顯示HTML
        generateResultDisplayHTML() {
            const process = this.state.gameState.ticketProcess;
            const isPresetMode = this.state.settings.taskType === 'preset';

            // 🎯 預設模式：只有在使用者點擊後才顯示站點名稱
            let startName, endName;

            if (isPresetMode) {
                // 預設模式：檢查使用者是否已經點擊選擇過
                startName = (process.userSelectedStartStation && process.startStation)
                    ? this.getStationName(process.startStation)
                    : '---';
                endName = (process.userSelectedEndStation && process.endStation)
                    ? this.getStationName(process.endStation)
                    : '---';
            } else {
                // 自由模式：直接顯示已選擇的站點
                startName = process.startStation ? this.getStationName(process.startStation) : '---';
                endName = process.endStation ? this.getStationName(process.endStation) : '---';
            }

            return `
                <div class="result-display-panel" style="
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    border: 2px solid #1976d2;
                    border-radius: 15px;
                    padding: 20px;
                    margin: 30px 0 0 0;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                ">
                    <h3 style="text-align: center; color: #0d47a1; margin-bottom: 15px;">
                        📋 已選擇的車站
                    </h3>
                    <div style="display: flex; justify-content: space-around; align-items: center;">
                        <div style="text-align: center;">
                            <div style="font-size: 14px; color: #666; margin-bottom: 5px;">出發站</div>
                            <div id="start-station-display" style="font-size: 24px; font-weight: bold; color: #1976d2;">${startName}</div>
                        </div>
                        <div style="font-size: 40px; color: #666;">→</div>
                        <div style="text-align: center;">
                            <div style="font-size: 14px; color: #666; margin-bottom: 5px;">抵達站</div>
                            <div id="end-station-display" style="font-size: 24px; font-weight: bold; color: #388e3c;">${endName}</div>
                        </div>
                    </div>
                </div>
            `;
        },

        // 生成車種選擇HTML
        generateTrainTypeSelectionHTML() {
            const trainTypes = this.storeData.StationData.trainTypes;
            const process = this.state.gameState.ticketProcess;

            // 計算每種車的預估票價
            const prices = trainTypes.map(type => {
                const price = this.calculateTicketPrice(
                    process.startStation,
                    process.endStation,
                    type.id
                );
                return { ...type, price };
            });

            let html = '<div class="train-type-grid">';

            for (const type of prices) {
                html += `
                    <div class="train-type-card" data-type="${type.id}">
                        <div class="train-type-name" style="color: ${type.color};">${type.name}</div>
                        <div class="train-type-description">${type.description}</div>
                        <div class="train-type-price">NT$ ${type.price}</div>
                    </div>
                `;
            }

            html += '</div>';

            // 綁定事件（Phase 2：遷移至 TimerManager）
            this.TimerManager.setTimeout(() => {
                // 🎯 簡單模式預設任務：顯示「點這裡」提示動畫
                const isEasyPreset = this.state.settings.difficulty === 'easy' &&
                                    this.state.settings.taskType === 'preset';
                if (isEasyPreset && process.trainType) {
                    Game.Debug.log('flow', `🎯 [簡單模式預設任務] 正確車種: ${process.trainType}`);
                    this.TimerManager.setTimeout(() => {
                        this.highlightTrainType(process.trainType);
                    }, 300, 'hint');
                }

                // Phase 3：遷移至 EventManager
                document.querySelectorAll('.train-type-card').forEach(card => {
                    this.EventManager.on(card, 'click', () => {
                        this.playSound('click');
                        const trainTypeId = card.dataset.type;
                        Game.Debug.log('flow', '🚄 選擇車種:', trainTypeId);

                        // 🔧 防止重複觸發：檢查對話管理器是否仍在 askType 步驟
                        const currentStepName = this.DialogueManager.steps[this.DialogueManager.currentStep];
                        if (currentStepName !== 'askType') {
                            Game.Debug.log('flow', '⚠️ [車種選擇] 忽略重複點擊，當前步驟:', currentStepName);
                            return;
                        }

                        // 清除車種提示
                        this.clearAllHints();

                        // 🎯 簡單模式預設任務：驗證是否選擇正確
                        const isEasyPreset = this.state.settings.taskType === 'preset' &&
                                            this.state.settings.difficulty === 'easy';
                        if (isEasyPreset) {
                            const correctTrainType = this.state.gameState.ticketProcess.trainType;
                            if (trainTypeId !== correctTrainType) {
                                // ❌ 選擇錯誤，顯示錯誤訊息
                                Game.Debug.log('hint', '❌ [簡單模式] 選擇錯誤的車種');
                                this.showErrorFeedback(card, '請選擇正確的車種');
                                this.playSound('error');
                                return; // 阻止繼續
                            }
                        }

                        // 🆕 普通模式預設任務：錯誤追蹤
                        const isNormalPreset = this.state.settings.taskType === 'preset' &&
                                              this.state.settings.difficulty === 'normal';
                        if (isNormalPreset) {
                            const correctTrainType = this.state.gameState.ticketProcess.presetTask.trainType;
                            if (trainTypeId !== correctTrainType) {
                                // ❌ 選擇錯誤
                                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                                this.state.gameState.stepErrorCounts.askType++;
                                const errorCount = this.state.gameState.stepErrorCounts.askType;
                                Game.Debug.log('hint', `❌ [普通模式] 選擇錯誤的車種 (錯誤次數: ${errorCount})`);
                                this.showErrorFeedback(card, '請再試一次');
                                this.playErrorSound();

                                // 第3次錯誤後顯示提示（只在非困難模式）（Phase 2：遷移至 TimerManager）
                                if (this.state.settings.difficulty !== 'hard' && errorCount >= 3 && !this.state.gameState.stepHintsShown.askType) {
                                    this.state.gameState.stepHintsShown.askType = true;
                                    this.TimerManager.setTimeout(() => {
                                        this.showNormalModeStepHint('askType', correctTrainType);
                                    }, 500, 'hint');
                                }
                                return; // 阻止繼續
                            }
                        }

                        // 🆕 困難模式預設任務：錯誤追蹤（不自動顯示提示）
                        const isHardPreset = this.state.settings.taskType === 'preset' &&
                                            this.state.settings.difficulty === 'hard';
                        if (isHardPreset) {
                            const correctTrainType = this.state.gameState.ticketProcess.presetTask.trainType;
                            if (trainTypeId !== correctTrainType) {
                                // ❌ 選擇錯誤
                                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                                this.state.gameState.stepErrorCounts.askType++;
                                const errorCount = this.state.gameState.stepErrorCounts.askType;
                                Game.Debug.log('hint', `❌ [困難模式] 選擇錯誤的車種 (錯誤次數: ${errorCount})`);
                                this.showErrorFeedback(card, '請再試一次');
                                this.playErrorSound();
                                // 困難模式：不自動顯示提示，只能透過提示按鈕
                                return; // 阻止繼續
                            }
                        }

                        // 🎯 清除高亮動畫
                        card.style.animation = '';
                        card.style.boxShadow = '';
                        card.style.border = '';

                        // 🆕 普通模式：播放煙火和答對音效
                        const isNormalPreset2 = this.state.settings.taskType === 'preset' &&
                                               this.state.settings.difficulty === 'normal';
                        if (isNormalPreset2) {
                            this.playCorrectSound();
                            this.playFireworks();
                        }

                        this.DialogueManager.nextStep(trainTypeId);
                    }, {}, 'trainTypeSelect');
                });
            }, 100, 'gameUI');

            return html;
        },

        // 生成票數選擇HTML
        generateTicketCountSelectionHTML() {
            let html = `
                <div class="ticket-count-selector">
                    <button class="count-btn" id="count-minus">−</button>
                    <div class="count-display" id="count-display">1</div>
                    <button class="count-btn" id="count-plus">+</button>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button class="order-btn order-btn-confirm" id="confirm-count-btn"
                        style="padding: 15px 40px; border: none; border-radius: 25px;
                        background: linear-gradient(135deg, #4caf50, #388e3c); color: white;
                        font-size: 16px; font-weight: bold; cursor: pointer;">
                        確認張數
                    </button>
                </div>
            `;

            // 綁定事件（Phase 2：遷移至 TimerManager）
            this.TimerManager.setTimeout(() => {
                // 🎯 預設模式：自動設置正確張數
                const isPresetMode = this.state.settings.taskType === 'preset';
                const isEasyPreset = isPresetMode && this.state.settings.difficulty === 'easy';
                const isNormalPreset = isPresetMode && this.state.settings.difficulty === 'normal';
                const process = this.state.gameState.ticketProcess;
                let count = 1;

                // 🆕 普通模式預設任務：從0開始（需要用戶自行調整）
                if (isNormalPreset) {
                    count = 0;
                    Game.Debug.log('flow', '🎯 [普通模式預設任務] 初始張數設為0');
                }
                // 簡單模式：直接設置為預設張數
                else if (isEasyPreset && process.ticketCount) {
                    count = process.ticketCount;
                    Game.Debug.log('flow', '🎯 [簡單模式預設任務] 自動設置張數:', count);
                }

                const display = document.getElementById('count-display');
                const minusBtn = document.getElementById('count-minus');
                const plusBtn = document.getElementById('count-plus');
                const confirmBtn = document.getElementById('confirm-count-btn');

                const updateDisplay = () => {
                    display.textContent = count;

                    // 🎯 簡單模式預設任務：禁用加減按鈕
                    if (isEasyPreset) {
                        minusBtn.disabled = true;
                        plusBtn.disabled = true;
                        minusBtn.style.opacity = '0.3';
                        plusBtn.style.opacity = '0.3';
                        minusBtn.style.cursor = 'not-allowed';
                        plusBtn.style.cursor = 'not-allowed';
                    } else {
                        // 🆕 普通模式預設任務：允許減到0
                        const minCount = isNormalPreset ? 0 : 1;
                        minusBtn.disabled = count <= minCount;
                        plusBtn.disabled = count >= 5;
                        minusBtn.style.opacity = count <= minCount ? '0.3' : '1';
                        plusBtn.style.opacity = count >= 5 ? '0.3' : '1';
                    }
                };

                // Phase 3：遷移至 EventManager
                this.EventManager.on(minusBtn, 'click', () => {
                    this.playSound('click');
                    // 🎯 簡單模式預設任務：不允許更改張數
                    if (isEasyPreset) {
                        Game.Debug.log('hint', '❌ [簡單模式] 不允許更改張數');
                        this.showErrorFeedback(minusBtn, '簡單模式不可更改張數');
                        this.playSound('error');
                        return;
                    }

                    // 🆕 普通模式預設任務：允許減到0
                    const minCount = isNormalPreset ? 0 : 1;
                    if (count > minCount) {
                        count--;
                        updateDisplay();
                    }
                }, {}, 'ticketCount');

                this.EventManager.on(plusBtn, 'click', () => {
                    this.playSound('click');
                    // 🎯 簡單模式預設任務：不允許更改張數
                    if (isEasyPreset) {
                        Game.Debug.log('hint', '❌ [簡單模式] 不允許更改張數');
                        this.showErrorFeedback(plusBtn, '簡單模式不可更改張數');
                        this.playSound('error');
                        return;
                    }

                    if (count < 5) {
                        count++;
                        updateDisplay();
                    }
                }, {}, 'ticketCount');

                this.EventManager.on(confirmBtn, 'click', () => {
                    this.playSound('click');
                    // 🆕 從顯示元素讀取當前票數（確保讀取最新值）
                    const currentCount = parseInt(display.textContent) || count;
                    Game.Debug.log('flow', '🎫 選擇張數:', currentCount);

                    // 🆕 普通模式預設任務：驗證張數
                    const isNormalPreset = this.state.settings.taskType === 'preset' &&
                                          this.state.settings.difficulty === 'normal';
                    if (isNormalPreset) {
                        const correctCount = this.state.gameState.ticketProcess.presetTask.ticketCount;
                        if (currentCount !== correctCount) {
                            // ❌ 選擇錯誤
                            window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                            this.state.gameState.stepErrorCounts.askCount++;
                            const errorCount = this.state.gameState.stepErrorCounts.askCount;
                            Game.Debug.log('hint', `❌ [普通模式] 選擇錯誤的張數 (錯誤次數: ${errorCount})`);
                            this.showErrorFeedback(confirmBtn, '請再試一次');
                            this.playErrorSound(); // 🆕 播放錯誤音效

                            // 第3次錯誤後顯示提示（只在非困難模式）（Phase 2：遷移至 TimerManager）
                            if (this.state.settings.difficulty !== 'hard' && errorCount >= 3 && !this.state.gameState.stepHintsShown.askCount) {
                                this.state.gameState.stepHintsShown.askCount = true;
                                this.TimerManager.setTimeout(() => {
                                    this.showNormalModeStepHint('askCount', correctCount);
                                }, 500, 'hint');
                            }
                            return; // 阻止繼續
                        }
                    }

                    // 🆕 困難模式預設任務：錯誤追蹤（不自動顯示提示）
                    const isHardPreset = this.state.settings.taskType === 'preset' &&
                                        this.state.settings.difficulty === 'hard';
                    if (isHardPreset) {
                        const correctCount = this.state.gameState.ticketProcess.presetTask.ticketCount;
                        if (currentCount !== correctCount) {
                            // ❌ 選擇錯誤
                            window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                            this.state.gameState.stepErrorCounts.askCount++;
                            const errorCount = this.state.gameState.stepErrorCounts.askCount;
                            Game.Debug.log('hint', `❌ [困難模式] 選擇錯誤的張數 (錯誤次數: ${errorCount})`);
                            this.showErrorFeedback(confirmBtn, '請再試一次');
                            this.playErrorSound();
                            // 困難模式：不自動顯示提示，只能透過提示按鈕
                            return; // 阻止繼續
                        }
                    }

                    // 🎯 清除高亮動畫
                    if (display) {
                        display.style.animation = '';
                        display.style.boxShadow = '';
                        display.style.border = '';
                    }

                    // 🆕 普通模式：播放煙火和答對音效
                    const isNormalPreset2 = this.state.settings.taskType === 'preset' &&
                                           this.state.settings.difficulty === 'normal';
                    if (isNormalPreset2) {
                        this.playCorrectSound();
                        this.playFireworks();
                    }

                    this.DialogueManager.nextStep(currentCount);
                }, {}, 'ticketCount');

                updateDisplay();

                // 🎯 簡單模式：高亮顯示正確答案（只在簡單模式下自動顯示）（Phase 2：遷移至 TimerManager）
                if (this.state.settings.difficulty === 'easy' && isPresetMode && process.ticketCount) {
                    this.TimerManager.setTimeout(() => {
                        if (display) {
                            display.style.animation = 'pulse-highlight 1.5s infinite';
                            display.style.boxShadow = '0 0 20px rgba(255, 193, 7, 0.8)';
                            display.style.border = '3px solid #FFC107';
                            display.style.borderRadius = '10px';
                            Game.Debug.log('hint', '✨ [簡單模式] 高亮顯示張數');
                        }
                    }, 500, 'hint');
                    // 🎯 簡單模式：顯示確認張數按鈕「點這裡」提示動畫
                    this.TimerManager.setTimeout(() => {
                        this.highlightConfirmButton('confirm-count-btn');
                    }, 700, 'hint');
                }
            }, 100, 'gameUI');

            return html;
        },

        // 生成訂單確認HTML
        generateOrderConfirmHTML() {
            const process = this.state.gameState.ticketProcess;
            const startName = this.getStationName(process.startStation);
            const endName = this.getStationName(process.endStation);
            const trainTypeName = this.getTrainTypeName(process.trainType);

            let html = `
                <div class="order-summary-card">
                    <div class="order-summary-title">訂單確認</div>

                    <div class="order-item">
                        <span class="order-item-label">起站</span>
                        <span class="order-item-value">${startName}</span>
                    </div>

                    <div class="order-item">
                        <span class="order-item-label">訖站</span>
                        <span class="order-item-value">${endName}</span>
                    </div>

                    <div class="order-item">
                        <span class="order-item-label">車種</span>
                        <span class="order-item-value">${trainTypeName}</span>
                    </div>

                    <div class="order-item">
                        <span class="order-item-label">數量</span>
                        <span class="order-item-value">${process.ticketCount} 張</span>
                    </div>

                    <div class="order-item">
                        <span class="order-item-label">單價</span>
                        <span class="order-item-value">NT$ ${process.unitPrice}</span>
                    </div>

                    <div class="order-total">
                        <span class="order-total-label">總計</span>
                        <span class="order-total-value">NT$ ${process.totalPrice}</span>
                    </div>

                    <div class="order-actions">
                        <button class="order-btn order-btn-reset" id="reset-order-btn">重新選擇</button>
                        <button class="order-btn order-btn-confirm" id="confirm-order-btn">確認購票</button>
                    </div>
                </div>
            `;

            // 綁定事件（Phase 2：遷移至 TimerManager）
            this.TimerManager.setTimeout(() => {
                // Phase 3：遷移至 EventManager
                this.EventManager.on(document.getElementById('reset-order-btn'), 'click', () => {
                    this.playSound('click');
                    Game.Debug.log('flow', '🔄 重新選擇');
                    this.DialogueManager.reset();
                    this.DialogueManager.start();
                }, {}, 'orderConfirm');

                // Phase 3：遷移至 EventManager
                this.EventManager.on(document.getElementById('confirm-order-btn'), 'click', () => {
                    this.playSound('click');
                    // 🆕 自由購票模式（所有難度）：檢查錢包金額是否足夠
                    const isFreeMode = this.state.settings.taskType === 'free';

                    if (isFreeMode) {
                        const totalPrice = this.state.gameState.ticketProcess.totalPrice;
                        const walletTotal = this.state.gameState.walletTotal;

                        if (walletTotal < totalPrice) {
                            Game.Debug.log('payment', `❌ [自由購票模式] 錢包金額不足！錢包: ${walletTotal}, 票價: ${totalPrice}`);

                            // 🔊 播放錯誤提示音
                            this.playSound('error');

                            // 播放語音提示
                            this.Speech.speak('你的錢不夠，請重新選擇');

                            // 🎯 在「重新選擇」按鈕上顯示提示動畫
                            const resetBtn = document.getElementById('reset-order-btn');
                            if (resetBtn) {
                                // 添加動畫效果
                                resetBtn.style.position = 'relative';
                                resetBtn.style.animation = 'pulse-highlight 1.5s ease-in-out infinite';

                                // 添加「點這裡」提示
                                const hint = document.createElement('div');
                                hint.textContent = '點這裡';
                                hint.style.cssText = `
                                    position: absolute;
                                    top: -35px;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    background: linear-gradient(135deg, #FF9800, #F57C00);
                                    color: white;
                                    padding: 8px 16px;
                                    border-radius: 20px;
                                    font-size: 14px;
                                    font-weight: bold;
                                    box-shadow: 0 4px 15px rgba(255, 152, 0, 0.4);
                                    animation: bounce 0.6s ease-in-out infinite;
                                    pointer-events: none;
                                    z-index: 100;
                                `;
                                resetBtn.appendChild(hint);

                                // 點擊重新選擇後移除動畫（Phase 3：遷移至 EventManager）
                                this.EventManager.on(resetBtn, 'click', () => {
                                    resetBtn.style.animation = '';
                                    if (hint.parentNode) {
                                        hint.remove();
                                    }
                                }, { once: true }, 'orderConfirm');
                            }

                            return; // 阻止進入付款場景
                        }
                    }

                    Game.Debug.log('flow', '✅ 確認購票，進入付款場景');
                    this.DialogueManager.nextStep(null);
                }, {}, 'orderConfirm');

                // 🎯 簡單模式：顯示確認購票按鈕「點這裡」提示動畫
                if (this.state.settings.difficulty === 'easy' &&
                    this.state.settings.taskType === 'preset') {
                    this.TimerManager.setTimeout(() => {
                        this.highlightConfirmButton('confirm-order-btn');
                    }, 300, 'hint');
                }
            }, 100, 'gameUI');

            return html;
        },

        // 渲染付款場景UI（參考 A4 滿版面設計）
        renderPaymentSceneUI() {
            if (window.TutorContext) TutorContext.update({ phase: 'payment' });
            // 🆕 輔助點擊模式：建立付款動作佇列
            if (this.state.settings.clickMode && this.state.gameState.clickModeState.enabled) {
                this.ClickMode.buildActionQueue('payment');
            }

            const app = document.getElementById('app');
            const totalCost = this.state.gameState.currentTransaction.totalCost;

            // 🆕 重置付款金額顯示標記（困難模式專用）
            this._showPaidAmount = false;

            // 🎯 簡單模式：計算最佳付款方案（包含自由模式和預設任務）
            let optimalPayment = null;
            if (this.state.settings.difficulty === 'easy') {
                optimalPayment = this.calculateOptimalPayment(totalCost, this.state.gameState.playerWallet);
                Game.Debug.log('payment', '💡 [A6-付款場景] 簡單模式最佳付款:', optimalPayment);
            }

            // 🎙️ NPC 對話內容
            const npcText = `請付款 ${totalCost} 元。請將錢幣拖曳到付款區。`;

            app.innerHTML = `
                <div class="store-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">🚂</span>
                        </div>
                        <div class="title-bar-center">
                            <h1>第五步：付款</h1>
                        </div>
                        <div class="title-bar-right">
                            <span class="quiz-progress-info">第 ${this.state.quiz.currentQuestion + 1} / ${this.state.settings.questionCount} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>

                    <div class="ticket-window-combined">
                        <div class="clerk-section">
                            <div class="npc-character">
                                <img src="../images/a6/train_clerk.png" alt="火車站售票員" style="width: 100%; height: 100%; object-fit: contain;">
                            </div>
                            ${(this.state.settings.difficulty === 'hard' || this.state.settings.difficulty === 'normal') ? `
                                <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;margin-top:14px;">
                                <button class="npc-hint-btn" id="npc-payment-hint-btn" onclick="Game.showPaymentHint()">
                                    💡 提示
                                </button>
                            ` : ''}
                        </div>
                        <div class="right-section">
                            <div class="npc-dialogue-box">
                                <p class="npc-dialogue-text" id="npc-text">${npcText}</p>
                            </div>
                            <div class="ticket-window-content" style="display: flex; flex-direction: column; gap: 20px;">
                                <!-- 付款區域 -->
                                <div class="payment-info-display-top" style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 15px; width: 100%; margin-bottom: 10px;">
                                    <span class="payment-info-badge product-price-badge" style="background: linear-gradient(135deg, #fff9c4, #fff59d); padding: 8px 16px; border-radius: 20px; font-size: 16px; font-weight: bold; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                        票價: <span class="price-amount">${totalCost}</span> 元
                                    </span>
                                    <span class="payment-info-badge paid-amount-badge" style="background: linear-gradient(135deg, ${(this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard') ? '#fff9c4, #fff59d' : '#e3f2fd, #bbdefb'}); padding: 8px 16px; border-radius: 20px; font-size: 16px; font-weight: bold; color: #333; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: inline-block;">
                                        ${(this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard') ? '目前付款' : '已付金額'}: <span class="paid-amount-value">${this.state.settings.difficulty === 'hard' ? '？？？' : '0'}</span> 元
                                    </span>
                                </div>

                                <!-- 付款放置區 -->
                                <div id="payment-area" class="payment-zone" style="min-height: 120px; width: 100%; border: 3px dashed #FF9800; border-radius: 15px; padding: 20px; text-align: center; background: linear-gradient(135deg, #FFF8E1 0%, #FFE0B2 100%); transition: all 0.3s ease; box-sizing: border-box; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 10px;">
                                    ${this.generatePaymentHintHTML(optimalPayment)}
                                </div>

                                <!-- 確認付款按鈕 -->
                                <div style="text-align: center; margin: 10px 0;">
                                    <button id="confirm-payment-btn" ${this.state.settings.difficulty === 'hard' ? '' : 'disabled'}
                                        style="padding: 15px 50px; background: linear-gradient(135deg, #4caf50, #388e3c); color: white; border: none; border-radius: 25px; font-size: 18px; font-weight: bold; cursor: ${this.state.settings.difficulty === 'hard' ? 'pointer' : 'not-allowed'}; opacity: ${this.state.settings.difficulty === 'hard' ? '1' : '0.5'}; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.2); transition: all 0.3s ease;">
                                        確認付款
                                    </button>
                                </div>

                                <!-- 錢包區域 -->
                                <div class="wallet-area-top">
                                    <div class="wallet-content" style="width: 100%; padding: 15px; background: rgba(255, 255, 255, 0.3); border-radius: 12px; border: 2px dashed #90caf9; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box;">
                                        <!-- 錢包標題 -->
                                        <div class="wallet-total-header" style="text-align: center; font-size: 18px; font-weight: bold; color: var(--text-primary); margin: 0 auto 15px auto; padding: 8px 16px; background: linear-gradient(135deg, #fff9c4, #fff59d); border-radius: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                            <img src="../images/common/icons_wallet.png" alt="💰" style="width:1.5em;height:1.5em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='💰'"> 我的錢包＝${this.state.gameState.playerWallet.reduce((s, m) => s + m.value, 0)}元
                                        </div>

                                        <!-- 錢包內容 -->
                                        <div id="wallet-display" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; width: 100%;">
                                            ${this.generateWalletHTML()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 🎙️ 播放語音（Phase 2：遷移至 TimerManager）
            this.TimerManager.setTimeout(() => {
                this.Speech.speak(npcText);
            }, 500, 'speech');

            this.setupPaymentDragAndDrop();
        },

        // 計算最佳付款方案（簡單模式專用）
        calculateOptimalPayment(targetAmount, availableMoney) {
            Game.Debug.log('payment', '💡 [A6-計算最佳付款]', { targetAmount, availableMoney });

            // 🔧 防護：targetAmount 無效時提前返回，避免 new Array(NaN) 拋出 RangeError
            if (!targetAmount || typeof targetAmount !== 'number' || isNaN(targetAmount) || targetAmount <= 0) {
                Game.Debug.warn('payment', '❌ [A6-付款計算] 無效的目標金額，跳過計算:', targetAmount);
                return null;
            }

            // 🔧 簡單模式特殊處理：找等於或超過目標金額的最接近幣值
            if (this.state.settings.difficulty === 'easy') {
                // 收集所有 >= 目標金額的錢幣
                const validCoins = availableMoney.filter(money => money.value >= targetAmount);

                if (validCoins.length > 0) {
                    // 按面額排序（從小到大），選擇最接近目標金額的
                    validCoins.sort((a, b) => a.value - b.value);
                    const bestCoin = validCoins[0];
                    Game.Debug.log('payment', '💡 [A6-簡單模式] 使用單一大面額支付:', bestCoin.value);
                    return [bestCoin.value];
                }
            }

            // 計算每種面額的數量（普通模式和困難模式）
            const coinCounts = {};
            availableMoney.forEach(money => {
                coinCounts[money.value] = (coinCounts[money.value] || 0) + 1;
            });

            Game.Debug.log('payment', '💰 [A6-付款計算] 可用錢幣統計:', coinCounts);

            const allCoins = Object.keys(coinCounts).map(Number).sort((a, b) => a - b); // 從小到大排序

            // 策略1: 尋找精確付款方案（不找零）
            function findExactPayment(target, coinsList, counts) {
                if (!target || isNaN(target) || target <= 0 || target > 100000) return null;
                const dp = new Array(target + 1).fill(null);
                dp[0] = [];

                for (let amount = 1; amount <= target; amount++) {
                    for (const coin of coinsList) {
                        if (coin <= amount && counts[coin] > 0) {
                            const prevAmount = amount - coin;
                            if (dp[prevAmount] !== null) {
                                const usedCoins = {};
                                dp[prevAmount].forEach(c => {
                                    usedCoins[c] = (usedCoins[c] || 0) + 1;
                                });

                                if ((usedCoins[coin] || 0) < counts[coin]) {
                                    const newSolution = [...dp[prevAmount], coin];
                                    if (dp[amount] === null || newSolution.length < dp[amount].length) {
                                        dp[amount] = newSolution;
                                    }
                                }
                            }
                        }
                    }
                }

                return dp[target];
            }

            // 首先嘗試找精確付款方案
            let exactSolution = findExactPayment(targetAmount, allCoins, coinCounts);

            if (exactSolution) {
                Game.Debug.log('payment', '✅ [A6-付款計算] 找到精確付款方案:', exactSolution);
                return exactSolution;
            }

            // 策略2: 找零最小值方案（改進算法：嘗試所有合理組合）
            Game.Debug.log('payment', '💡 [A6-付款計算] 找不到精確付款，尋找找零最小的方案');

            let bestSolution = null;
            let minChange = Infinity;

            // 使用動態規劃找出所有可能的付款金額（在合理範圍內）
            const walletTotal = availableMoney.reduce((sum, m) => sum + m.value, 0);
            const maxAmount = walletTotal; // 使用錢包總額作為上限

            // DP陣列：dp[amount] = 達到該金額的最少錢幣組合
            const dp = new Array(maxAmount + 1).fill(null);
            dp[0] = [];

            for (let amount = 0; amount <= maxAmount; amount++) {
                if (dp[amount] === null) continue;

                for (const coin of allCoins) {
                    const newAmount = amount + coin;
                    if (newAmount > maxAmount) continue;

                    // 檢查是否還有這個面額的錢幣可用
                    const usedCoins = {};
                    dp[amount].forEach(c => {
                        usedCoins[c] = (usedCoins[c] || 0) + 1;
                    });

                    if ((usedCoins[coin] || 0) < coinCounts[coin]) {
                        const newSolution = [...dp[amount], coin];
                        if (dp[newAmount] === null || newSolution.length < dp[newAmount].length) {
                            dp[newAmount] = newSolution;
                        }
                    }
                }
            }

            // 找出所有 >= targetAmount 的方案中找零最少的
            for (let amount = targetAmount; amount <= maxAmount; amount++) {
                if (dp[amount] !== null) {
                    const change = amount - targetAmount;
                    if (change < minChange) {
                        minChange = change;
                        bestSolution = dp[amount];
                    }
                }
            }

            // 如果找不到方案，返回空數組
            if (!bestSolution) {
                Game.Debug.warn('payment', '⚠️ [A6-付款計算] 無法找到合適的付款組合');
                return [];
            }

            Game.Debug.log('payment', '✅ [A6-付款計算] 最終方案:', bestSolution, '找零:', minChange);
            return bestSolution;
        },

        // 生成錢包HTML（簡化版，不顯示提示）
        generateWalletHTML() {
            const wallet = this.state.gameState.playerWallet;
            let html = '';

            for (let i = 0; i < wallet.length; i++) {
                const money = wallet[i];
                const isCoin = money.value < 100;
                const moneyClass = isCoin ? 'coin' : 'banknote';

                // 🔧 Bug 2 修復：使用預存的 imagePath，避免重新渲染時圖片變化
                const imagePath = money.imagePath || this.getRandomMoneyImage(money);
                html += `
                    <div class="money-item ${moneyClass}"
                         draggable="true"
                         data-index="${i}"
                         data-value="${money.value}"
                         style="padding: 10px;
                                background: white;
                                border: 2px solid #ddd;
                                border-radius: 10px;
                                cursor: grab;
                                text-align: center;
                                transition: all 0.3s ease;
                                position: relative;">
                        <img src="${imagePath}" alt="${money.name}"
                            style="width: ${isCoin ? '50px' : '80px'}; height: auto;">
                        <div style="margin-top: 5px; font-weight: bold;">${money.name}</div>
                    </div>
                `;
            }

            return html;
        },

        // 生成付款提示HTML（顯示在付款區的淡化金錢圖示）
        generatePaymentHintHTML(optimalPayment) {
            if (!optimalPayment || optimalPayment.length === 0) {
                return `<div class="payment-placeholder" style="color: #FF9800; font-size: 16px; font-weight: bold;">
                            💰 請將錢幣拖曳到此
                        </div>`;
            }

            Game.Debug.log('hint', '💡 [A6-付款提示] 生成提示圖示:', optimalPayment);

            // 初始化droppedItems狀態
            if (!this.state.gameState.droppedItems || this.state.gameState.droppedItems.length !== optimalPayment.length) {
                this.state.gameState.droppedItems = new Array(optimalPayment.length).fill(null);
            }

            // 🔧 Bug 2 修復：初始化提示圖片路徑狀態（只在第一次生成時隨機決定）
            if (!this.state.gameState.hintImagePaths || this.state.gameState.hintImagePaths.length !== optimalPayment.length) {
                this.state.gameState.hintImagePaths = optimalPayment.map(value => {
                    const moneyData = this.storeData.moneyItems.find(item => item.value === value);
                    return moneyData ? this.getRandomMoneyImage(moneyData) : '';
                });
            }

            let html = '';
            optimalPayment.forEach((value, index) => {
                // 找到對應的金錢資料
                const moneyData = this.storeData.moneyItems.find(item => item.value === value);
                if (moneyData) {
                    const isCoin = value < 100;

                    // 檢查此位置是否已經放置錢幣
                    const droppedItem = this.state.gameState.droppedItems[index];
                    const isLitUp = droppedItem !== null;

                    // 動態決定樣式
                    const hintClass = isLitUp ? 'payment-hint-item lit-up' : 'payment-hint-item faded';
                    const opacity = isLitUp ? '1' : '0.4';
                    const imgOpacity = isLitUp ? '1' : '0.5';
                    // 只有未點亮的提示可以接受拖放
                    const pointerEvents = isLitUp ? 'none' : 'auto';

                    // 🔧 Bug 2 修復：使用預存的 imagePath
                    const hintImagePath = this.state.gameState.hintImagePaths[index];

                    html += `
                        <div class="${hintClass}"
                             data-hint-value="${value}"
                             data-hint-index="${index}"
                             data-position="${index}"
                             style="padding: 10px;
                                    background: rgba(255, 255, 255, 0.3);
                                    border: 2px dashed #FF9800;
                                    border-radius: 10px;
                                    text-align: center;
                                    opacity: ${opacity};
                                    pointer-events: ${pointerEvents};
                                    position: relative;
                                    transition: all 0.3s ease;
                                    cursor: ${isLitUp ? 'default' : 'pointer'};">
                            <img src="${hintImagePath}" alt="${moneyData.name}"
                                style="width: ${isCoin ? '50px' : '80px'}; height: auto; opacity: ${imgOpacity}; transition: opacity 0.3s ease; pointer-events: none;">
                            <div style="margin-top: 5px; font-weight: bold; color: #FF9800; pointer-events: none;">${moneyData.name}</div>
                        </div>
                    `;
                }
            });

            return html;
        },

        // 設置拖放功能（精簡版）
        setupPaymentDragAndDrop() {
            const moneyItems = document.querySelectorAll('.money-item');
            const paymentArea = document.getElementById('payment-area');
            const confirmBtn = document.getElementById('confirm-payment-btn');

            // 🆕 使用狀態管理，而不是局部變量
            if (!this.state.gameState.currentTransaction.paidMoney) {
                this.state.gameState.currentTransaction.paidMoney = [];
            }
            if (this.state.gameState.currentTransaction.amountPaid === undefined) {
                this.state.gameState.currentTransaction.amountPaid = 0;
            }

            // Phase 3：遷移至 EventManager
            moneyItems.forEach(item => {
                this.EventManager.on(item, 'dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', item.dataset.index);
                    item.style.opacity = '0.5';

                    // 🆕 使用去背圖片作為拖曳預覽（Phase 2：遷移至 TimerManager）
                    const img = item.querySelector('img');
                    if (img) {
                        const dragImg = img.cloneNode(true);
                        dragImg.style.width = img.offsetWidth * 1.2 + 'px';
                        dragImg.style.height = img.offsetHeight * 1.2 + 'px';
                        dragImg.style.position = 'absolute';
                        dragImg.style.top = '-9999px';
                        dragImg.style.left = '-9999px';
                        document.body.appendChild(dragImg);
                        if (e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                            e.dataTransfer.setDragImage(dragImg, dragImg.offsetWidth / 2, dragImg.offsetHeight / 2);
                        }
                        this.TimerManager.setTimeout(() => dragImg.remove(), 0, 'dragCleanup');
                    }
                }, {}, 'paymentDrag');

                this.EventManager.on(item, 'dragend', (e) => {
                    item.style.opacity = '1';
                }, {}, 'paymentDrag');
            });

            this.EventManager.on(paymentArea, 'dragover', (e) => {
                e.preventDefault();
                paymentArea.style.background = '#bbdefb';
            }, {}, 'paymentDrag');

            this.EventManager.on(paymentArea, 'dragleave', () => {
                paymentArea.style.background = '';
            }, {}, 'paymentDrag');

            // 🎯 更新的拖放邏輯：支援拖曳到特定提示位置（Phase 3：遷移至 EventManager）
            this.EventManager.on(paymentArea, 'drop', (e) => {
                e.preventDefault();
                paymentArea.style.background = '';

                const index = e.dataTransfer.getData('text/plain');

                // 驗證 index 是否有效（防止多行文字或特殊字符）
                if (!index || index.includes('\n') || index.trim() === '') {
                    Game.Debug.error('💥 [A6-付款] 無效的拖曳資料:', index);
                    return;
                }

                const walletArea = document.getElementById('wallet-display');
                const moneyItem = walletArea ? walletArea.querySelector(`[data-index="${CSS.escape(index)}"]`) : null;

                if (!moneyItem) {
                    Game.Debug.error('💥 [A6-付款] 找不到錢幣項目:', index);
                    return;
                }

                const value = parseInt(moneyItem.dataset.value);
                const isEasyMode = this.state.settings.difficulty === 'easy';

                // 🎯 檢查是否拖曳到特定的提示位置（簡單模式）
                // 使用事件坐標來檢測實際的放置目標
                let hintItem = null;
                let clientX = e.clientX;
                let clientY = e.clientY;

                // 處理觸控事件
                if (!clientX && e.changedTouches && e.changedTouches.length > 0) {
                    clientX = e.changedTouches[0].clientX;
                    clientY = e.changedTouches[0].clientY;
                }

                if (clientX && clientY) {
                    const elementAtPoint = document.elementFromPoint(clientX, clientY);
                    hintItem = elementAtPoint ? elementAtPoint.closest('.payment-hint-item') : null;
                    Game.Debug.log('payment', '🎯 [A6-付款] 檢測拖放目標:', { clientX, clientY, hintItem: hintItem ? hintItem.className : 'null' });
                }
                // 備用方案：檢查e.target
                if (!hintItem) {
                    hintItem = e.target.closest('.payment-hint-item');
                }

                if (isEasyMode) {
                    // 簡單模式：必須拖曳到特定的提示位置
                    if (hintItem && hintItem.classList.contains('faded')) {
                        const position = parseInt(hintItem.dataset.position);
                        const expectedValue = parseInt(hintItem.dataset.hintValue);

                        // 檢查金額是否匹配
                        if (value === expectedValue && this.state.gameState.droppedItems[position] === null) {
                            // ✅ 放置成功！點亮該提示位置
                            this.state.gameState.droppedItems[position] = { value, index };
                            this.state.gameState.currentTransaction.amountPaid += value;
                            // 🆕 儲存 imagePath 以避免重新渲染時圖片變化
                            const moneyData = this.state.gameState.playerWallet[parseInt(index)];
                            const imagePath = this.getRandomMoneyImage(moneyData);
                            this.state.gameState.currentTransaction.paidMoney.push({ index, value, imagePath });

                            Game.Debug.log('payment', '💡 [A6-付款] 錢幣放置到提示位置:', { position, value });

                            // 🎙️ 播放語音：累計已付金額
                            const totalPaid = this.state.gameState.currentTransaction.amountPaid;
                            this.Speech.speak(`你付了${this.convertAmountToSpeech(totalPaid)}`);

                            // 隱藏錢包中的該錢幣
                            moneyItem.style.display = 'none';

                            // 重新渲染提示
                            const optimalPayment = this.calculateOptimalPayment(
                                this.state.gameState.currentTransaction.totalCost,
                                this.state.gameState.playerWallet
                            );
                            paymentArea.innerHTML = this.generatePaymentHintHTML(optimalPayment);

                            // 重新設置提示項目的拖放監聽器
                            this.setupHintDropZones(paymentArea, this.state.gameState.currentTransaction.amountPaid, this.state.gameState.currentTransaction.paidMoney, confirmBtn);

                            // 更新已付金額顯示
                            this._updateCurrentPaymentBadge();

                            // 🆕 更新按鈕文本
                            this.updatePaymentButton();
                            this.updateWalletTotalDisplay();
                        } else {
                            Game.Debug.log('payment', '❌ [A6-付款] 金額不匹配或位置已被佔用:', { value, expectedValue, position });
                        }
                    } else {
                        // 簡單模式下，如果沒有拖曳到提示位置，則拒絕放置
                        Game.Debug.log('payment', '❌ [A6-付款] 簡單模式下必須拖曳到特定的提示位置');
                    }
                } else {
                    // 普通/困難模式或拖曳到整個付款區
                    this.state.gameState.currentTransaction.amountPaid += value;
                    // 🆕 儲存 imagePath 以避免重新渲染時圖片變化
                    const moneyData = this.state.gameState.playerWallet[parseInt(index)];
                    const imagePath = this.getRandomMoneyImage(moneyData);
                    this.state.gameState.currentTransaction.paidMoney.push({ index, value, imagePath });

                    // 清空並重新渲染付款區
                    paymentArea.innerHTML = '';

                    if (isEasyMode) {
                        const optimalPayment = this.calculateOptimalPayment(
                            this.state.gameState.currentTransaction.totalCost,
                            this.state.gameState.playerWallet
                        );
                        paymentArea.innerHTML = this.generatePaymentHintHTML(optimalPayment);
                        this.setupHintDropZones(paymentArea, this.state.gameState.currentTransaction.amountPaid, this.state.gameState.currentTransaction.paidMoney, confirmBtn);
                    } else {
                        // 普通/困難模式：顯示實際付款的錢幣（可拖回）
                        this.renderPaymentMoney(paymentArea, this.state.gameState.currentTransaction.paidMoney);
                    }

                    // 隱藏錢包中的錢幣
                    moneyItem.style.display = 'none';

                    this._updateCurrentPaymentBadge();

                    // 🆕 更新按鈕文本
                    this.updatePaymentButton();
                    this.updateWalletTotalDisplay();

                    // 🎙️ 播放語音：累計已付金額（困難模式未按提示前不播，讓學生自判）
                    const totalPaid = this.state.gameState.currentTransaction.amountPaid;
                    if (this.state.settings.difficulty !== 'hard' || this._showPaidAmount) {
                        this.TimerManager.setTimeout(() => {
                            this.Speech.speak(`你付了${this.convertAmountToSpeech(totalPaid)}`);
                        }, 50, 'paymentSpeech');
                    }
                }
            }, {}, 'paymentDrag');

            // Phase 3：遷移至 EventManager
            this.EventManager.on(confirmBtn, 'click', () => {
                const targetCost = this.state.gameState.currentTransaction.totalCost;
                const difficulty = this.state.settings.difficulty;

                // 🆕 從狀態讀取付款金額和付款錢幣列表
                const paidAmount = this.state.gameState.currentTransaction.amountPaid;
                const paidMoney = this.state.gameState.currentTransaction.paidMoney;

                // 🆕 普通/困難模式：調用驗證函數
                if (difficulty === 'normal' || difficulty === 'hard') {
                    const validationResult = this.validatePayment(paidAmount, paidMoney, targetCost);
                    if (!validationResult.success) {
                        return; // 驗證失敗，不繼續
                    }
                }

                // 簡單模式和困難模式，或普通模式驗證通過
                if (paidAmount >= targetCost) {
                    this.state.gameState.currentTransaction.changeExpected = paidAmount - targetCost;

                    Game.Debug.log('payment', '💰 付款完成', {
                        應付: targetCost,
                        實付: paidAmount,
                        找零: this.state.gameState.currentTransaction.changeExpected
                    });

                    // 播放成功音效和煙火動畫
                    this.playSound('correct');
                    this.startFireworksAnimation();

                    // 延遲後進入下一個場景（等待動畫播放）（Phase 2：遷移至 TimerManager）
                    this.TimerManager.setTimeout(() => {
                        if (this.state.gameState.currentTransaction.changeExpected > 0) {
                            // 困難模式且需要找零：進入找零計算頁面
                            if (difficulty === 'hard') {
                                this.SceneManager.switchScene('changeCalculation', this);
                            } else {
                                // 其他模式：進入找零驗證頁面
                                this.SceneManager.switchScene('checking', this);
                            }
                        } else {
                            // 剛好付款，直接顯示車票
                            this.SceneManager.switchScene('ticketResult', this);
                        }
                    }, 1000, 'transition');
                }
            }, {}, 'paymentDrag');

            // 🎯 初始設置提示項目的拖放監聽器
            this.setupHintDropZones(paymentArea, this.state.gameState.currentTransaction.amountPaid, this.state.gameState.currentTransaction.paidMoney, confirmBtn);

            // 🆕 設置錢包區域的拖回功能（普通/困難模式）（Phase 3：遷移至 EventManager）
            const walletArea = document.getElementById('wallet-display');
            if (walletArea && (this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard')) {
                this.EventManager.on(walletArea, 'dragover', (e) => {
                    e.preventDefault();
                    walletArea.style.background = 'rgba(76, 175, 80, 0.1)';
                }, {}, 'paymentDrag');

                this.EventManager.on(walletArea, 'dragleave', () => {
                    walletArea.style.background = '';
                }, {}, 'paymentDrag');

                this.EventManager.on(walletArea, 'drop', (e) => {
                    e.preventDefault();
                    walletArea.style.background = '';

                    const data = e.dataTransfer.getData('text/plain');

                    // 檢查是否從付款區拖回
                    if (data.startsWith('payment-')) {
                        const moneyIndex = data.replace('payment-', '');
                        this.handleMoneyReturn(moneyIndex);
                    }
                }, {}, 'paymentDrag');
            }

            // 🆕 設置TouchDragUtility支援（觸控端）
            if (window.TouchDragUtility && walletArea && paymentArea) {
                Game.Debug.log('event', '✅ [A6-付款-觸控] TouchDragUtility 已載入，開始註冊');

                const isEasyMode = this.state.settings.difficulty === 'easy';

                // 註冊錢包金錢為可拖曳元素
                window.TouchDragUtility.registerDraggable(
                    walletArea,
                    '.money-item',
                    {
                        onDragStart: (element, event) => {
                            const moneyItem = element.closest('.money-item');
                            if (!moneyItem || moneyItem.style.display === 'none') return false;

                            const index = moneyItem.dataset.index;
                            Game.Debug.log('payment', '📱 [A6-付款-觸控] 開始拖動錢幣:', index);
                            moneyItem.style.opacity = '0.5';

                            // 儲存當前拖曳的項目索引
                            this._currentDragIndex = index;
                            return true;
                        },
                        onDrop: (draggedElement, dropZone, event) => {
                            // 🔧 輔助點擊模式：不允許使用者直接拖曳付款，須透過點擊模式操作
                            if (this.state.settings.clickMode && this.state.gameState.clickModeState?.active) {
                                this.playSound('error');
                                return;
                            }

                            const moneyItem = draggedElement.closest('.money-item');
                            if (!moneyItem) return;

                            const index = this._currentDragIndex;
                            const value = parseInt(moneyItem.dataset.value);

                            Game.Debug.log('payment', '📱 [A6-付款-觸控] 放置錢幣:', { index, value });

                            // 檢查放置目標
                            if (isEasyMode) {
                                // 簡單模式：必須放置到特定的提示位置
                                const hintItem = dropZone.closest('.payment-hint-item');
                                if (hintItem && hintItem.classList.contains('faded')) {
                                    const position = parseInt(hintItem.dataset.position);
                                    const expectedValue = parseInt(hintItem.dataset.hintValue);

                                    // 檢查金額是否匹配
                                    if (value === expectedValue && this.state.gameState.droppedItems[position] === null) {
                                        // ✅ 放置成功！點亮該提示位置
                                        this.state.gameState.droppedItems[position] = { value, index };
                                        this.state.gameState.currentTransaction.amountPaid += value;
                                        // 🆕 儲存 imagePath 以避免重新渲染時圖片變化
                                        const moneyData = this.state.gameState.playerWallet[parseInt(index)];
                                        const imagePath = this.getRandomMoneyImage(moneyData);
                                        this.state.gameState.currentTransaction.paidMoney.push({ index, value, imagePath });

                                        Game.Debug.log('payment', '💡 [A6-付款-觸控] 錢幣放置到提示位置:', { position, value });

                                        // 🎙️ 播放語音：累計已付金額
                                        const totalPaidT = this.state.gameState.currentTransaction.amountPaid;
                                        this.Speech.speak(`你付了${this.convertAmountToSpeech(totalPaidT)}`);

                                        // 隱藏錢包中的該錢幣
                                        moneyItem.style.display = 'none';

                                        // 重新渲染提示
                                        const optimalPayment = this.calculateOptimalPayment(
                                            this.state.gameState.currentTransaction.totalCost,
                                            this.state.gameState.playerWallet
                                        );
                                        paymentArea.innerHTML = this.generatePaymentHintHTML(optimalPayment);

                                        // 重新設置提示項目的拖放監聽器
                                        this.setupHintDropZones(paymentArea, this.state.gameState.currentTransaction.amountPaid, this.state.gameState.currentTransaction.paidMoney, confirmBtn);

                                        // 重新註冊TouchDragUtility放置區
                                        const newHintItems = paymentArea.querySelectorAll('.payment-hint-item.faded');
                                        newHintItems.forEach(hint => {
                                            window.TouchDragUtility.registerDropZone(hint, () => true);
                                        });

                                        this._updateCurrentPaymentBadge();

                                        // 🆕 更新按鈕文本
                                        this.updatePaymentButton();
                                        this.updateWalletTotalDisplay();
                                    } else {
                                        Game.Debug.log('payment', '❌ [A6-付款-觸控] 金額不匹配或位置已被佔用:', { value, expectedValue, position });
                                    }
                                } else {
                                    Game.Debug.log('payment', '❌ [A6-付款-觸控] 簡單模式下必須拖曳到特定的提示位置');
                                }
                            } else {
                                // 普通/困難模式：可以放置到整個付款區
                                this.state.gameState.currentTransaction.amountPaid += value;
                                // 🆕 儲存 imagePath 以避免重新渲染時圖片變化
                                const moneyData = this.state.gameState.playerWallet[parseInt(index)];
                                const imagePath = this.getRandomMoneyImage(moneyData);
                                this.state.gameState.currentTransaction.paidMoney.push({ index, value, imagePath });

                                // 重新渲染付款區
                                this.renderPaymentMoney(paymentArea, this.state.gameState.currentTransaction.paidMoney);

                                // 隱藏錢包中的錢幣
                                moneyItem.style.display = 'none';

                                this._updateCurrentPaymentBadge();

                                // 🆕 更新按鈕文本
                                this.updatePaymentButton();
                                this.updateWalletTotalDisplay();

                                // 🎙️ 播放語音：累計已付金額（困難模式未按提示前不播）
                                const totalPaidT2 = this.state.gameState.currentTransaction.amountPaid;
                                if (this.state.settings.difficulty !== 'hard' || this._showPaidAmount) {
                                    this.TimerManager.setTimeout(() => {
                                        this.Speech.speak(`你付了${this.convertAmountToSpeech(totalPaidT2)}`);
                                    }, 50, 'paymentSpeech');
                                }
                            }
                        },
                        onDragEnd: (element, event) => {
                            const moneyItem = element.closest('.money-item');
                            if (moneyItem) {
                                moneyItem.style.opacity = '1';
                            }
                            this._currentDragIndex = null;
                        }
                    }
                );

                // 註冊放置區
                if (isEasyMode) {
                    // 簡單模式：註冊每個提示位置為放置區
                    const hintItems = paymentArea.querySelectorAll('.payment-hint-item.faded');
                    hintItems.forEach(hint => {
                        window.TouchDragUtility.registerDropZone(hint, () => true);
                    });
                    Game.Debug.log('event', `✅ [A6-付款-觸控] 註冊了 ${hintItems.length} 個提示位置為放置區`);
                } else {
                    // 普通/困難模式：註冊整個付款區為放置區
                    window.TouchDragUtility.registerDropZone(paymentArea, () => true);
                    Game.Debug.log('event', '✅ [A6-付款-觸控] 註冊付款區為放置區');

                    // 🆕 普通/困難模式：同時註冊錢包區為放置區（用於拖回功能）
                    window.TouchDragUtility.registerDropZone(walletArea, () => true);
                    Game.Debug.log('event', '✅ [A6-付款-觸控] 註冊錢包區為放置區（拖回功能）');
                }

                Game.Debug.log('event', '✅ [A6-付款-觸控] 觸控拖曳支援設置完成');
            }
        },

        // 為每個提示項目設置拖放監聽器（Phase 3：遷移至 EventManager）
        setupHintDropZones(paymentArea, paidAmount, paidMoney, confirmBtn) {
            const hintItems = paymentArea.querySelectorAll('.payment-hint-item.faded');

            hintItems.forEach(hint => {
                // dragover 事件：顯示可以放置的視覺回饋
                this.EventManager.on(hint, 'dragover', (e) => {
                    e.preventDefault();
                    hint.style.background = 'rgba(76, 175, 80, 0.2)';
                    hint.style.borderColor = '#4CAF50';
                }, {}, 'paymentDrag');

                // dragleave 事件：移除視覺回饋
                this.EventManager.on(hint, 'dragleave', () => {
                    hint.style.background = 'rgba(255, 255, 255, 0.3)';
                    hint.style.borderColor = '#FF9800';
                }, {}, 'paymentDrag');
            });
        },

        // 🆕 渲染付款區的金錢（可拖回錢包）
        renderPaymentMoney(paymentArea, paidMoney) {
            const walletArea = document.getElementById('wallet-display');
            if (!walletArea) return;

            paymentArea.innerHTML = paidMoney.map((m, index) => {
                const originalItem = walletArea.querySelector(`[data-index="${CSS.escape(m.index)}"]`);
                if (!originalItem) return '';

                const isCoin = m.value < 100;
                const moneyData = this.state.gameState.playerWallet[parseInt(m.index)];
                if (!moneyData) return '';

                return `
                    <div class="payment-money-item lit-up"
                         draggable="true"
                         data-money-index="${m.index}"
                         data-money-value="${m.value}"
                         data-instance-id="payment_${index}"
                         style="padding: 10px;
                                background: white;
                                border: 2px solid #4CAF50;
                                border-radius: 10px;
                                cursor: grab;
                                text-align: center;
                                transition: all 0.3s ease;
                                position: relative;">
                        <img src="${m.imagePath || this.getRandomMoneyImage(moneyData)}" alt="${moneyData.name}"
                            style="width: ${isCoin ? '50px' : '80px'}; height: auto; pointer-events: none;">
                        <div style="margin-top: 5px; font-weight: bold; pointer-events: none;">${moneyData.name}</div>
                    </div>
                `;
            }).join('');

            // 為付款區的金錢添加拖曳事件（Phase 3：遷移至 EventManager）
            const paymentItems = paymentArea.querySelectorAll('.payment-money-item');
            paymentItems.forEach(item => {
                this.EventManager.on(item, 'dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', `payment-${item.dataset.moneyIndex}`);
                    item.style.opacity = '0.5';

                    // 🆕 使用去背圖片作為拖曳預覽（Phase 2：遷移至 TimerManager）
                    const img = item.querySelector('img');
                    if (img) {
                        const dragImg = img.cloneNode(true);
                        dragImg.style.width = img.offsetWidth * 1.2 + 'px';
                        dragImg.style.height = img.offsetHeight * 1.2 + 'px';
                        dragImg.style.position = 'absolute';
                        dragImg.style.top = '-9999px';
                        dragImg.style.left = '-9999px';
                        document.body.appendChild(dragImg);
                        if (e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                            e.dataTransfer.setDragImage(dragImg, dragImg.offsetWidth / 2, dragImg.offsetHeight / 2);
                        }
                        this.TimerManager.setTimeout(() => dragImg.remove(), 0, 'dragCleanup');
                    }
                }, {}, 'paymentDrag');

                this.EventManager.on(item, 'dragend', (e) => {
                    item.style.opacity = '1';
                }, {}, 'paymentDrag');

                // 點擊取回
                this.EventManager.on(item, 'click', () => {
                    this.handleMoneyReturn(item.dataset.moneyIndex);
                }, {}, 'paymentDrag');
            });

            // 🆕 為付款區的金錢添加TouchDragUtility支援（觸控端拖回功能）
            if (window.TouchDragUtility && paymentArea && walletArea) {
                Game.Debug.log('event', '✅ [A6-付款-觸控拖回] 註冊付款金錢的觸控拖曳');

                // 註冊付款區的金錢為可拖曳元素
                window.TouchDragUtility.registerDraggable(
                    paymentArea,
                    '.payment-money-item',
                    {
                        onDragStart: (element, event) => {
                            const paymentItem = element.closest('.payment-money-item');
                            if (!paymentItem) return false;

                            const moneyIndex = paymentItem.dataset.moneyIndex;
                            Game.Debug.log('payment', '📱 [A6-付款-觸控拖回] 開始拖動付款金錢:', moneyIndex);
                            paymentItem.style.opacity = '0.5';

                            // 儲存當前拖曳的項目索引
                            this._currentDragPaymentIndex = moneyIndex;
                            return true;
                        },
                        onDrop: (draggedElement, dropZone, event) => {
                            Game.Debug.log('payment', '📱 [A6-付款-觸控拖回] onDrop被調用:', {
                                hasDropZone: !!dropZone,
                                dropZoneId: dropZone?.id,
                                dropZoneClass: dropZone?.className
                            });

                            // 檢查是否拖到錢包區（支援錢包區本身、父元素或子元素）
                            const isWalletZone = dropZone && (
                                dropZone.id === 'wallet-display' ||                    // 是錢包區本身
                                dropZone.closest('#wallet-display') ||                 // 是錢包區的子元素
                                dropZone.contains(document.getElementById('wallet-display'))  // 是錢包區的父元素
                            );

                            if (isWalletZone) {
                                const moneyIndex = this._currentDragPaymentIndex;
                                Game.Debug.log('payment', '📱 [A6-付款-觸控拖回] 拖回錢包:', moneyIndex);
                                this.handleMoneyReturn(moneyIndex);
                            } else {
                                Game.Debug.log('payment', '❌ [A6-付款-觸控拖回] 未拖到錢包區:', {
                                    dropZone: dropZone?.id || 'null',
                                    isWalletZone: false
                                });
                            }
                        },
                        onDragEnd: (element, event) => {
                            const paymentItem = element.closest('.payment-money-item');
                            if (paymentItem) {
                                paymentItem.style.opacity = '1';
                            }
                            this._currentDragPaymentIndex = null;
                        }
                    }
                );

                // 註冊錢包區為放置區
                window.TouchDragUtility.registerDropZone(walletArea, () => true);

                Game.Debug.log('event', '✅ [A6-付款-觸控拖回] 付款金錢觸控拖回支援設置完成');
            }
        },

        // 🆕 處理金錢取回（從付款區拖回錢包）
        handleMoneyReturn(moneyIndex) {
            Game.Debug.log('payment', '🔄 [A6-取回金錢] 處理金錢取回:', moneyIndex);

            const paymentArea = document.getElementById('payment-area');
            const walletArea = document.getElementById('wallet-display');
            const confirmBtn = document.getElementById('confirm-payment-btn');

            if (!paymentArea || !walletArea) return;

            // 從paidMoney中移除
            const paidMoneyIndex = this.state.gameState.currentTransaction.paidMoney.findIndex(
                m => m.index === moneyIndex
            );

            if (paidMoneyIndex === -1) {
                Game.Debug.error('❌ 找不到對應的已付款金錢');
                return;
            }

            const returnedMoney = this.state.gameState.currentTransaction.paidMoney.splice(paidMoneyIndex, 1)[0];

            // 更新已付金額
            this.state.gameState.currentTransaction.amountPaid -= returnedMoney.value;

            // 顯示錢包中的該錢幣
            const walletItem = walletArea.querySelector(`[data-index="${CSS.escape(moneyIndex)}"]`);
            if (walletItem) {
                walletItem.style.display = '';
            }

            // 重新渲染付款區
            const difficulty = this.state.settings.difficulty;
            if (difficulty === 'normal' || difficulty === 'hard') {
                this.renderPaymentMoney(paymentArea, this.state.gameState.currentTransaction.paidMoney);
            }

            this._updateCurrentPaymentBadge();

            // 🆕 更新按鈕文本
            this.updatePaymentButton();
            this.updateWalletTotalDisplay();

            Game.Debug.log('payment', '✅ [A6-取回金錢] 金錢已取回，當前已付金額:', this.state.gameState.currentTransaction.amountPaid);
        },

        // 🆕 更新錢包總計顯示
        updateWalletTotalDisplay() {
            const header = document.querySelector('.wallet-total-header');
            if (!header) return;
            const walletTotal = this.state.gameState.playerWallet.reduce((s, m) => s + m.value, 0);
            const paidTotal = this.state.gameState.currentTransaction.amountPaid || 0;
            header.innerHTML = `<img src="../images/common/icons_wallet.png" alt="💰" style="width:1.5em;height:1.5em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='💰'"> 我的錢包＝${walletTotal - paidTotal}元`;
        },

        // 🆕 更新付款按鈕文本
        updatePaymentButton() {
            const confirmBtn = document.getElementById('confirm-payment-btn');
            if (!confirmBtn) return;

            const paidAmount = this.state.gameState.currentTransaction.amountPaid;
            const targetCost = this.state.gameState.currentTransaction.totalCost;
            const difficulty = this.state.settings.difficulty;
            const isHardMode = difficulty === 'hard';

            // 🆕 困難模式：按鈕固定為「確認付款」且隨時可點擊
            if (isHardMode) {
                confirmBtn.textContent = '確認付款';
                confirmBtn.disabled = false;
                confirmBtn.style.opacity = '1';
                confirmBtn.style.cursor = 'pointer';
                confirmBtn.classList.add('ready');
                return;
            }

            // 其他模式：根據付款金額更新按鈕
            if (paidAmount >= targetCost) {
                // 金額足夠：顯示"確認付款" + 脈動動畫
                confirmBtn.textContent = '確認付款';
                confirmBtn.disabled = false;
                confirmBtn.style.opacity = '1';
                confirmBtn.style.cursor = 'pointer';
                confirmBtn.classList.add('ready');

                // 🎯 簡單模式：顯示「點這裡」提示動畫
                if (difficulty === 'easy') {
                    this.TimerManager.setTimeout(() => {
                        this.highlightConfirmButton('confirm-payment-btn');
                    }, 300, 'hint');
                }
            } else {
                // 金額不足：保持「確認付款」文字，移除動畫
                confirmBtn.textContent = '確認付款';
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = '0.5';
                confirmBtn.style.cursor = 'not-allowed';
                confirmBtn.classList.remove('ready');
            }
        },

        // 🆕 更新「目前付款」徽章顯示
        _updateCurrentPaymentBadge() {
            const val = document.querySelector('.paid-amount-value');
            if (!val) return;
            const difficulty = this.state.settings.difficulty;
            const paidAmount = this.state.gameState.currentTransaction.amountPaid;
            if (difficulty === 'hard') {
                if (this._showPaidAmount) val.textContent = paidAmount;
                // else keep "？？？"
            } else {
                val.textContent = paidAmount;
            }
        },

        // 🆕 在付款區顯示錯誤提示（紅色×動畫）
        highlightPaymentMoney(moneyList) {
            Game.Debug.log('hint', '🔥 [錯誤提示] highlightPaymentMoney 被調用', { moneyList });

            // 清除之前的錯誤提示效果
            const existingHighlights = document.querySelectorAll('.payment-money-item.show-error-x');
            existingHighlights.forEach(item => {
                item.classList.remove('show-error-x');
            });

            // 統計需要提示的錢幣數量
            const moneyCount = {};
            moneyList.forEach(money => {
                const value = money.value;
                moneyCount[value] = (moneyCount[value] || 0) + 1;
            });
            Game.Debug.log('hint', '🔥 [錯誤提示] 需要提示的錢幣統計:', moneyCount);

            // 獲取所有付款區的錢幣元素
            const allPaymentItems = document.querySelectorAll('.payment-money-item');

            // 按面額分組付款區錢幣
            const paymentItemsByValue = {};
            allPaymentItems.forEach(item => {
                const value = parseInt(item.dataset.moneyValue);
                if (!paymentItemsByValue[value]) {
                    paymentItemsByValue[value] = [];
                }
                paymentItemsByValue[value].push(item);
            });

            // 為相應數量的付款區錢幣添加錯誤提示效果
            let highlightCount = 0;
            Object.keys(moneyCount).forEach(valueStr => {
                const value = parseInt(valueStr);
                const needCount = moneyCount[valueStr];
                const availableItems = paymentItemsByValue[value] || [];

                const itemsToHighlight = availableItems.slice(0, Math.min(needCount, availableItems.length));
                itemsToHighlight.forEach(element => {
                    element.classList.add('show-error-x');
                    highlightCount++;
                    Game.Debug.log('hint', `🔥 [錯誤提示] 已為錢幣 ${element.dataset.moneyValue}元 添加×動畫`);
                });
            });
            Game.Debug.log('hint', '🔥 [錯誤提示] 實際添加效果的錢幣數量:', highlightCount);

            // 3秒後移除錯誤提示效果（Phase 2：遷移至 TimerManager）
            this.TimerManager.setTimeout(() => {
                const highlightedItems = document.querySelectorAll('.show-error-x');
                Game.Debug.log('hint', `🔥 [錯誤提示] 3秒後移除×動畫，數量: ${highlightedItems.length}`);
                highlightedItems.forEach(item => {
                    item.classList.remove('show-error-x');
                });
            }, 3000, 'feedback');
        },

        // 🆕 普通模式：付款驗證函數
        validatePayment(paidAmount, paidMoney, targetCost) {
            Game.Debug.log('payment', '🔍 [普通模式] 驗證付款', { paidAmount, targetCost });

            // --- 步驟 1: 檢查金額不足 ---
            if (paidAmount < targetCost) {
                this.playErrorSound();

                // 增加錯誤計數
                this.state.gameState.paymentErrorCount++;
                const errorCount = this.state.gameState.paymentErrorCount;
                Game.Debug.log('hint', `❌ [普通模式] 付款金額不足 (錯誤次數: ${errorCount})`);

                // 退回所有金錢到錢包
                this.returnAllPaidMoney();

                this.Speech.speak('付款金額不足，請重新付款');

                return { success: false, reason: 'insufficient' };
            }

            // --- 步驟 2: 檢查過度付款 ---
            if (paidAmount > targetCost) {
                // 從paidMoney轉換為錢包格式的money對象
                const paidMoneyObjects = paidMoney.map(pm => {
                    const walletIndex = parseInt(pm.index);
                    return this.state.gameState.playerWallet[walletIndex];
                }).filter(m => m !== undefined);

                const moneyToReturn = this.findOptimalReturnMoney(paidMoneyObjects, targetCost);

                // 情況 A: 有更好的付款方式
                if (moneyToReturn && moneyToReturn.length > 0) {
                    this.playErrorSound();

                    // 增加錯誤計數
                    this.state.gameState.paymentErrorCount++;
                    const errorCount = this.state.gameState.paymentErrorCount;
                    Game.Debug.log('hint', `❌ [普通模式] 過度付款 (錯誤次數: ${errorCount})`);

                    // 退回所有金錢到錢包（不顯示×提示）
                    this.returnAllPaidMoney();

                    this.Speech.speak('你付了太多的錢，請重新付款');

                    return { success: false, reason: 'overpayment' };
                }

                // 情況 B: 雖然多付了，但這是最佳付款方式
                Game.Debug.log('payment', '✅ [普通模式] 多付但這是最佳方案，允許繼續');
            }

            // 重置錯誤計數（付款成功）
            this.state.gameState.paymentErrorCount = 0;

            return { success: true };
        },

        // 🆕 尋找需要退回的錢幣（檢查是否有更優付款方式）
        findOptimalReturnMoney(paidMoney, targetAmount) {
            Game.Debug.log('payment', '🔍 [尋找最優付款] 檢查是否過度付款', { paidMoney, targetAmount });

            // 獲取當前錢包中的所有錢幣（包括已付的）
            const allMoney = [...this.state.gameState.playerWallet];

            // 計算哪些錢幣可以被收回（paidMoney中的）
            const paidValues = paidMoney.map(m => m.value);

            // 嘗試從已付的錢中找出可以收回的組合
            // 目標：找出收回後，剩餘的錢依然 >= targetAmount
            const result = [];

            // 按面額從小到大排序，優先收回小額錢幣
            const sortedPaid = [...paidMoney].sort((a, b) => a.value - b.value);

            for (const money of sortedPaid) {
                // 計算如果收回這張錢，剩餘金額
                const currentPaid = paidMoney.reduce((sum, m) => sum + m.value, 0);
                const remainingIfReturn = currentPaid - money.value - result.reduce((sum, m) => sum + m.value, 0);

                // 如果收回後剩餘金額仍然 >= targetAmount，則可以收回
                if (remainingIfReturn >= targetAmount) {
                    result.push(money);
                }
            }

            return result;
        },

        // 🆕 生成退回錢幣的提示訊息
        generateReturnMoneyMessage(moneyToReturn) {
            const moneyCount = {};
            moneyToReturn.forEach(money => {
                const name = money.name || `${money.value}元`;
                moneyCount[name] = (moneyCount[name] || 0) + 1;
            });

            const parts = Object.entries(moneyCount).map(([name, count]) => {
                return count > 1 ? `${count}個${name}` : name;
            });

            return `請收回${parts.join('、')}`;
        },

        // ========== A6 困難模式：找零計算頁面 ==========
        renderChangeCalculationSceneUI() {
            Game.Debug.log('ui', '🎨 [A6-找零計算] 渲染找零計算頁面');

            const app = document.getElementById('app');
            const transaction = this.state.gameState.currentTransaction;
            const { totalCost, amountPaid, changeExpected } = transaction;

            app.innerHTML = `
                <style>${this.getChangeCalculationCSS()}</style>
                <div class="game-container">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">🚂</span>
                            <span>火車站售票</span>
                        </div>
                        <div class="title-bar-center">第六步：計算找零金額</div>
                        <div class="title-bar-right">
                            <span>第 ${this.state.quiz.currentQuestion + 1} 題 / 共 ${this.state.settings.questionCount || 10} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>

                    <div class="calculation-scene-container">
                        <div class="top-row">
                            <!-- 左側：交易資訊區域 -->
                            <div class="item-info-section">
                                <div class="section-title">🎫 交易資訊</div>
                                <div class="item-info" style="text-align: center;">
                                    <div class="transaction-summary">
                                        <div>票價：${totalCost}元</div>
                                        <div>實付金額：${amountPaid}元</div>
                                    </div>
                                </div>
                            </div>

                            <!-- 右側：計算機區域 -->
                            <div class="calculator-area">
                                <div class="calculator-toggle">
                                    <button id="toggle-calculator-btn" class="calculator-btn">
                                        🧮 開啟計算機
                                    </button>
                                </div>
                                <div id="calculator-container" class="calculator-container" style="display: none;">
                                    ${this.getCalculatorHTML()}
                                </div>
                            </div>
                        </div>

                        <!-- 計算公式區域 -->
                        <div class="calculation-section">
                            <div class="section-title">💰 計算找零金額</div>
                            <div class="calculation-formula">
                                <span class="formula-text">${amountPaid}元 - ${totalCost}元 = </span>
                                <input type="text"
                                       id="change-input"
                                       class="change-input"
                                       placeholder="?"
                                       inputmode="none"
                                       readonly>
                                <span class="formula-unit">元</span>
                            </div>
                        </div>

                        <!-- 確認按鈕 -->
                        <div class="confirm-section">
                            <button id="confirm-calculation-btn" class="confirm-btn" disabled>
                                確認答案
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // 設置事件監聽器
            this.setupChangeCalculationListeners(transaction);
        },

        setupChangeCalculationListeners(transaction) {
            const input = document.getElementById('change-input');
            const confirmBtn = document.getElementById('confirm-calculation-btn');
            const toggleCalcBtn = document.getElementById('toggle-calculator-btn');
            const calculatorContainer = document.getElementById('calculator-container');

            // 錯誤次數追踪
            let errorCount = 0;

            let calculatorOpen = false;
            let calculatorState = {
                displayValue: '0',
                previousValue: null,
                operator: null,
                waitingForOperand: false,
                expression: ''
            };

            // 點擊輸入框顯示數字鍵盤（Phase 3：遷移至 EventManager）
            this.EventManager.on(input, 'click', () => {
                this.showNumberPad(input, confirmBtn, transaction.changeExpected);
            }, {}, 'changeCalc');

            // 切換計算機
            this.EventManager.on(toggleCalcBtn, 'click', () => {
                calculatorOpen = !calculatorOpen;
                calculatorContainer.style.display = calculatorOpen ? 'block' : 'none';
                toggleCalcBtn.textContent = calculatorOpen ? '🧮 關閉計算機' : '🧮 開啟計算機';

                if (calculatorOpen) {
                    calculatorState.displayValue = '0';
                    calculatorState.previousValue = null;
                    calculatorState.operator = null;
                    calculatorState.waitingForOperand = false;
                    calculatorState.expression = '';
                    this.setupCalculatorListeners(calculatorState);
                } else {
                    const buttons = calculatorContainer.querySelectorAll('.calc-btn');
                    buttons.forEach(btn => {
                        const newBtn = btn.cloneNode(true);
                        btn.parentNode.replaceChild(newBtn, btn);
                    });
                }
            }, {}, 'changeCalc');

            // 確認按鈕
            this.EventManager.on(confirmBtn, 'click', () => {
                const userAnswer = parseInt(input.value);
                if (userAnswer === transaction.changeExpected) {
                    // 答對了，進入找零驗證頁面
                    this.playSound('correct');

                    const speechText = `答對了！找零${transaction.changeExpected}元`;
                    this.Speech.speak(speechText, {
                        callback: () => {
                            // 進入找零驗證步驟
                            this.SceneManager.switchScene('checking', this);
                        }
                    });
                } else {
                    // 答錯了
                    errorCount++;
                    this.playSound('error');

                    let feedbackText;
                    if (errorCount >= 3) {
                        feedbackText = `答案是${transaction.changeExpected}元，再想想看`;
                    } else {
                        feedbackText = '答錯了，再試試看';
                    }

                    this.Speech.speak(feedbackText);
                    input.value = '';
                    confirmBtn.disabled = true;
                }
            }, {}, 'changeCalc');
        },

        getCalculatorHTML() {
            return `
                <div class="calculator">
                    <div class="calculator-expression" id="calculator-expression"></div>
                    <div class="calculator-display" id="calculator-display">0</div>
                    <div class="calculator-buttons">
                        <button class="calc-btn number-btn" data-value="7">7</button>
                        <button class="calc-btn number-btn" data-value="8">8</button>
                        <button class="calc-btn number-btn" data-value="9">9</button>
                        <button class="calc-btn operator-btn" data-value="÷">÷</button>

                        <button class="calc-btn number-btn" data-value="4">4</button>
                        <button class="calc-btn number-btn" data-value="5">5</button>
                        <button class="calc-btn number-btn" data-value="6">6</button>
                        <button class="calc-btn operator-btn" data-value="×">×</button>

                        <button class="calc-btn number-btn" data-value="1">1</button>
                        <button class="calc-btn number-btn" data-value="2">2</button>
                        <button class="calc-btn number-btn" data-value="3">3</button>
                        <button class="calc-btn operator-btn" data-value="-">-</button>

                        <button class="calc-btn number-btn" data-value="0">0</button>
                        <button class="calc-btn clear-btn" data-value="C">C</button>
                        <button class="calc-btn equals-btn" data-value="=">=</button>
                        <button class="calc-btn operator-btn" data-value="+">+</button>
                    </div>
                </div>
            `;
        },

        setupCalculatorListeners(state) {
            const display = document.getElementById('calculator-display');
            const expression = document.getElementById('calculator-expression');
            const buttons = document.querySelectorAll('.calc-btn');

            const updateDisplay = () => {
                display.textContent = state.displayValue;
                if (state.expression) {
                    expression.textContent = state.expression;
                } else {
                    expression.textContent = '';
                }
            };

            const clearCalculator = () => {
                state.displayValue = '0';
                state.previousValue = null;
                state.operator = null;
                state.waitingForOperand = false;
                state.expression = '';
                updateDisplay();
            };

            const inputDigit = (digit) => {
                if (state.waitingForOperand) {
                    state.displayValue = String(digit);
                    state.waitingForOperand = false;
                } else {
                    state.displayValue = state.displayValue === '0' ? String(digit) : state.displayValue + digit;
                }
                updateDisplay();
            };

            const performOperation = (nextOperator) => {
                const inputValue = parseFloat(state.displayValue);

                if (state.previousValue === null) {
                    state.previousValue = inputValue;
                } else if (state.operator) {
                    const result = calculate(state.previousValue, inputValue, state.operator);
                    state.displayValue = String(result);
                    state.previousValue = result;
                }

                state.waitingForOperand = true;
                state.operator = nextOperator;

                if (nextOperator) {
                    state.expression = `${state.previousValue} ${nextOperator}`;
                } else {
                    state.expression = '';
                }

                updateDisplay();
            };

            const calculate = (firstOperand, secondOperand, operator) => {
                switch (operator) {
                    case '+': return firstOperand + secondOperand;
                    case '-': return firstOperand - secondOperand;
                    case '×': return firstOperand * secondOperand;
                    case '÷': return firstOperand / secondOperand;
                    default: return secondOperand;
                }
            };

            // Phase 3：遷移至 EventManager
            buttons.forEach(button => {
                this.EventManager.on(button, 'click', () => {
                    const value = button.dataset.value;
                    this.playSound('keypad');

                    if (button.classList.contains('number-btn')) {
                        inputDigit(parseInt(value));
                    } else if (button.classList.contains('operator-btn')) {
                        performOperation(value);
                    } else if (button.classList.contains('equals-btn')) {
                        performOperation(null);
                    } else if (button.classList.contains('clear-btn')) {
                        clearCalculator();
                    }
                }, {}, 'calculator');
            });
        },

        showNumberPad(input, confirmBtn, correctAnswer) {
            const existingPad = document.getElementById('number-pad-overlay');
            if (existingPad) existingPad.remove();

            const numberPad = document.createElement('div');
            numberPad.id = 'number-pad-overlay';
            numberPad.innerHTML = `
                <div class="number-pad">
                    <div class="number-pad-display">${input.value || ''}</div>
                    <div class="number-pad-buttons">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => `
                            <button class="num-btn" data-value="${num}">${num}</button>
                        `).join('')}
                        <button class="num-btn backspace-btn" data-action="backspace">←</button>
                        <button class="num-btn clear-btn" data-action="clear">清除</button>
                    </div>
                    <div class="number-pad-footer">
                        <button class="num-cancel-btn">取消</button>
                        <button class="num-confirm-btn">確認</button>
                    </div>
                </div>
            `;

            document.body.appendChild(numberPad);

            const display = numberPad.querySelector('.number-pad-display');
            const numBtns = numberPad.querySelectorAll('.num-btn[data-value]');
            const backspaceBtn = numberPad.querySelector('[data-action="backspace"]');
            const clearBtn = numberPad.querySelector('[data-action="clear"]');
            const cancelPadBtn = numberPad.querySelector('.num-cancel-btn');
            const confirmPadBtn = numberPad.querySelector('.num-confirm-btn');

            let currentValue = input.value || '';

            // Phase 3：遷移至 EventManager
            numBtns.forEach(btn => {
                this.EventManager.on(btn, 'click', () => {
                    const value = btn.dataset.value;
                    currentValue += value;
                    display.textContent = currentValue;
                }, {}, 'numberPad');
            });

            this.EventManager.on(backspaceBtn, 'click', () => {
                currentValue = currentValue.slice(0, -1);
                display.textContent = currentValue || '0';
            }, {}, 'numberPad');

            this.EventManager.on(clearBtn, 'click', () => {
                currentValue = '';
                display.textContent = '0';
            }, {}, 'numberPad');

            this.EventManager.on(cancelPadBtn, 'click', () => {
                numberPad.remove();
            }, {}, 'numberPad');

            this.EventManager.on(confirmPadBtn, 'click', () => {
                input.value = currentValue;
                confirmBtn.disabled = !currentValue;
                numberPad.remove();
            }, {}, 'numberPad');
        },

        getChangeCalculationCSS() {
            return `
                .calculation-scene-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    padding: 20px;
                    max-width: 1100px;
                    margin: 0 auto;
                    position: relative;
                }

                .top-row {
                    position: relative;
                    display: grid;
                    grid-template-columns: 1fr 500px 1fr;
                    width: 100%;
                    min-height: 220px;
                }

                .item-info-section {
                    grid-column: 2;
                    width: 500px;
                    background: linear-gradient(135deg, #e3f2fd 0%, #90caf9 100%);
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                }

                .item-info {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                    background: white;
                    padding: 20px;
                    border-radius: 15px;
                    margin-top: 10px;
                }

                .transaction-summary {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    font-size: 1.2em;
                    color: #1976d2;
                    text-align: center;
                    font-weight: bold;
                }

                .calculator-area {
                    position: absolute;
                    left: calc(50% + 270px);
                    top: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                    width: 350px;
                }

                .calculator-toggle {
                    text-align: center;
                }

                .calculator-btn {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 12px 30px;
                    font-size: 1.3em;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);
                    width: 100%;
                }

                .calculator-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(245, 158, 11, 0.4);
                }

                .calculator-container {
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                }

                .calculator {
                    background: #2d3748;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                }

                .calculator-expression {
                    background: #1a202c;
                    color: #a0aec0;
                    font-size: 1em;
                    text-align: right;
                    padding: 10px 20px;
                    border-radius: 10px 10px 0 0;
                    min-height: 30px;
                    font-family: 'Courier New', monospace;
                    border-bottom: 1px solid #2d3748;
                }

                .calculator-display {
                    background: #1a202c;
                    color: #48bb78;
                    font-size: 2em;
                    font-weight: bold;
                    text-align: right;
                    padding: 20px;
                    border-radius: 0 0 10px 10px;
                    margin-bottom: 15px;
                    min-height: 60px;
                    font-family: 'Courier New', monospace;
                }

                .calculator-buttons {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                }

                .calc-btn {
                    padding: 20px;
                    font-size: 1.3em;
                    font-weight: bold;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
                }

                .calc-btn:active {
                    transform: scale(0.95);
                }

                .number-btn {
                    background: #4a5568;
                    color: white;
                }

                .number-btn:hover {
                    background: #2d3748;
                }

                .operator-btn {
                    background: #f59e0b;
                    color: white;
                }

                .operator-btn:hover {
                    background: #d97706;
                }

                .equals-btn {
                    background: #10b981;
                    color: white;
                }

                .equals-btn:hover {
                    background: #059669;
                }

                .clear-btn {
                    background: #ef4444;
                    color: white;
                }

                .clear-btn:hover {
                    background: #dc2626;
                }

                .calculation-section {
                    width: 500px;
                    margin: 0 auto;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                }

                .calculation-section .section-title {
                    color: white;
                    margin-bottom: 15px;
                    font-size: 1.5em;
                    font-weight: bold;
                    text-align: center;
                }

                .calculation-formula {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 25px;
                    border-radius: 15px;
                }

                .formula-text {
                    font-size: 1.8em;
                    font-weight: bold;
                    color: white;
                }

                .change-input {
                    width: 100px;
                    height: 60px;
                    font-size: 1.8em;
                    text-align: center;
                    border: 3px solid #ffd700;
                    border-radius: 10px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: bold;
                    color: #2d3748;
                }

                .change-input:focus {
                    outline: none;
                    border-color: #ffaa00;
                    box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
                }

                .formula-unit {
                    font-size: 1.8em;
                    font-weight: bold;
                    color: white;
                }

                .confirm-section {
                    width: 500px;
                    margin: 0 auto;
                    text-align: center;
                }

                .confirm-btn {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border: none;
                    border-radius: 15px;
                    padding: 15px 40px;
                    font-size: 1.5em;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                }

                .confirm-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
                }

                .confirm-btn:disabled {
                    background: #d1d5db;
                    cursor: not-allowed;
                    box-shadow: none;
                }

                #number-pad-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }

                .number-pad {
                    background: white;
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    min-width: 300px;
                }

                .number-pad-display {
                    background: #f5f5f5;
                    padding: 15px;
                    border-radius: 10px;
                    text-align: center;
                    font-size: 2em;
                    font-weight: bold;
                    margin-bottom: 15px;
                    min-height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .number-pad-buttons {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .num-btn {
                    padding: 15px;
                    font-size: 1.5em;
                    font-weight: bold;
                    border: none;
                    border-radius: 10px;
                    background: #4a5568;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .num-btn:hover {
                    background: #2d3748;
                    transform: translateY(-2px);
                }

                .num-btn:active {
                    transform: scale(0.95);
                }

                .number-pad-footer {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                .num-cancel-btn, .num-confirm-btn {
                    padding: 12px 20px;
                    font-size: 1.2em;
                    font-weight: bold;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .num-cancel-btn {
                    background: #ef4444;
                    color: white;
                }

                .num-cancel-btn:hover {
                    background: #dc2626;
                }

                .num-confirm-btn {
                    background: #10b981;
                    color: white;
                }

                .num-confirm-btn:hover {
                    background: #059669;
                }
            `;
        },

        // 渲染找零驗證UI（三選一模式）
        renderChangeVerificationUI() {
            // 🆕 輔助點擊模式：建立找零動作佇列
            if (this.state.settings.clickMode && this.state.gameState.clickModeState.enabled) {
                this.ClickMode.buildActionQueue('change');
            }

            const app = document.getElementById('app');
            const changeExpected = this.state.gameState.currentTransaction.changeExpected;
            const npcText = `找您 ${changeExpected} 元`;
            const difficulty = this.state.settings.difficulty;

            // 困難模式且需要找零：使用 B6 式拖曳介面
            if (difficulty === 'hard' && changeExpected > 0) {
                this._a6ShowHardChangeDrag();
                return;
            }

            // 🔧 生成或使用已儲存的找零選項
            const isRetryAfterError = !!(this.state.gameState.currentChangeOptions);
            let changeOptions = [];

            if (difficulty === 'normal' || difficulty === 'hard') {
                if (isRetryAfterError) {
                    changeOptions = this.state.gameState.currentChangeOptions;
                    Game.Debug.log('payment', '🔄 使用已儲存的找零選項（保持選項固定）');
                } else {
                    changeOptions = this.generateChangeOptions(changeExpected);
                    this.state.gameState.currentChangeOptions = changeOptions;
                    Game.Debug.log('payment', '🆕 生成新的找零選項');
                }
            }

            // 🔧 根據難度決定容器class
            const containerClass = difficulty === 'normal' || difficulty === 'hard' ?
                'store-layout normal-hard-change-mode' : 'store-layout';

            app.innerHTML = `
                <div class="${containerClass}">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">🚂</span>
                        </div>
                        <div class="title-bar-center">
                            <h1>${difficulty === 'hard' ? '第七步：找零驗證' : '第六步：找零驗證'}</h1>
                        </div>
                        <div class="title-bar-right">
                            <span class="quiz-progress-info">第 ${this.state.quiz.currentQuestion + 1} / ${this.state.settings.questionCount} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>

                    <div class="ticket-window-combined">
                        <div class="clerk-section">
                            <div class="npc-character">
                                <img src="../images/a6/train_clerk.png" alt="火車站售票員" style="width: 100%; height: 100%; object-fit: contain;">
                            </div>
                        </div>
                        <div class="right-section">
                            <div class="npc-dialogue-box">
                                <p class="npc-dialogue-text" id="npc-text">${npcText}</p>
                            </div>
                            <div class="ticket-window-content" style="display: flex; flex-direction: column; gap: 20px; align-items: center; width: 100%;">
                                ${difficulty === 'easy' ? (changeExpected > 0 ? `
                                    <!-- 🔧 Bug 4 修復：簡單模式改為拖曳模式 -->
                                    <p style="font-size: 18px; margin: 10px 0; color: var(--text-primary, #333);">
                                        請將找回的零錢拖到下方對應位置
                                    </p>

                                    <!-- 店家找零區域（可拖曳） -->
                                    <div class="easy-change-source" style="margin: 15px auto; padding: 20px; background: #fff3e0;
                                        border-radius: 15px; width: 100%;">
                                        <h4 style="margin: 0 0 10px 0; color: #e65100;">🏪 店家找零</h4>
                                        <div id="easy-change-money" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
                                            ${this.generateEasyChangeDragSourceHTML(changeExpected)}
                                        </div>
                                    </div>

                                    <!-- 找零金額提示 -->
                                    <div style="margin: 10px 0; font-size: 16px; color: #666;">
                                        找回零錢：<span style="font-weight: bold; color: #4caf50;">${changeExpected}元</span>
                                    </div>

                                    <!-- 我的錢包區域（放置目標，淡化顯示） -->
                                    <div class="easy-change-targets" style="margin: 15px auto; padding: 20px; background: #e8f5e9;
                                        border-radius: 15px; width: 100%;">
                                        <h4 style="margin: 0 0 10px 0; color: #2e7d32;"><img src="../images/common/icons_wallet.png" alt="💰" style="width:1.5em;height:1.5em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='💰'"> 我的錢包</h4>
                                        <div id="easy-change-targets" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
                                            ${this.generateEasyChangeDragTargetHTML(changeExpected)}
                                        </div>
                                    </div>

                                    <!-- 確認按鈕（全部放對後才顯示） -->
                                    <button id="confirm-change-btn"
                                        style="margin-top: 10px; padding: 15px 40px; background: linear-gradient(135deg, #4caf50, #388e3c);
                                        color: white; border: none; border-radius: 25px; font-size: 18px;
                                        font-weight: bold; cursor: pointer; transition: all 0.3s ease; display: none;">
                                        確認找零
                                    </button>
                                ` : `
                                    <!-- 簡單模式：不需找零的情況 -->
                                    <p style="font-size: 18px; margin: 10px 0; color: var(--text-primary, #333);">
                                        這次不需要找零
                                    </p>
                                    <div style="margin: 20px auto; padding: 30px; background: #e8f5e9;
                                        border-radius: 15px; max-width: 500px; width: 100%; text-align: center;">
                                        <div style="font-size: 48px; margin-bottom: 10px;">✨</div>
                                        <div style="font-size: 18px; color: #2e7d32; font-weight: bold;">剛剛好！不需找零</div>
                                    </div>
                                    <button id="confirm-change-btn"
                                        style="margin-top: 10px; padding: 15px 40px; background: linear-gradient(135deg, #4caf50, #388e3c);
                                        color: white; border: none; border-radius: 25px; font-size: 18px;
                                        font-weight: bold; cursor: pointer; transition: all 0.3s ease;">
                                        確認
                                    </button>
                                `) : `
                                    <!-- 普通/困難模式：只顯示問題區域 -->
                                    <div class="change-question-area">
                                        <div class="change-title">找零金額</div>
                                        <div class="change-amount-highlight">${changeExpected}元</div>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>

                    ${difficulty === 'normal' || difficulty === 'hard' ? `
                        <!-- 普通/困難模式：找零選項區域（獨立滿版） -->
                        <div class="change-options-area">
                            <div class="change-options">
                                ${changeOptions.map((option, index) => `
                                    <div class="change-option ${option.isCorrect ? 'correct-option' : ''}"
                                         data-option-index="${index}"
                                         data-is-correct="${option.isCorrect}"
                                         data-change-amount="${option.totalValue}"
                                         onclick="Game.selectChangeOption(${index}, ${option.isCorrect}, ${option.totalValue})">
                                        <div class="option-money-display">
                                            ${option.money.length === 0 ?
                                                '<div class="no-change-display">不需找零</div>' :
                                                option.money.map(money => {
                                                    const isBanknote = money.value >= 100;
                                                    const imageStyle = isBanknote ?
                                                        'width: 102px; height: auto; max-height: 61px; object-fit: contain;' :
                                                        'width: 68px; height: 68px; object-fit: contain;';
                                                    // 🔧 Bug 3 修復：使用預存的 imagePath
                                                    const imagePath = money.imagePath || this.getRandomMoneyImage(money);
                                                    return `
                                                        <div class="money-item-option">
                                                            <img src="${imagePath}" alt="${money.name}" style="${imageStyle}">
                                                        </div>
                                                    `;
                                                }).join('')
                                            }
                                        </div>
                                        <div class="option-amount-display" style="${difficulty === 'hard' ? 'opacity: 0; transition: opacity 0.3s ease;' : ''}">
                                            <span class="amount-value">${option.totalValue}元</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;

            // 添加CSS樣式
            if (difficulty === 'normal' || difficulty === 'hard') {
                this.addChangeOptionsStyles();
            }

            // 播放語音（Phase 2：遷移至 TimerManager）
            this.TimerManager.setTimeout(() => {
                if (difficulty === 'normal' || difficulty === 'hard') {
                    this.Speech.speak(`需要找您${changeExpected}元，請選擇正確的答案`);
                } else {
                    this.Speech.speak(this.SpeechConfig.checking.verify(changeExpected));
                }
            }, 500, 'speech');

            // 🔧 Bug 4 修復：綁定簡單模式拖曳事件
            if (difficulty === 'easy') {
                // 只有需要找零時才設置拖曳功能
                if (changeExpected > 0) {
                    this.setupEasyChangeDragAndDrop();
                }

                // 確認按鈕點擊事件（Phase 3：遷移至 EventManager）
                const confirmBtn = document.getElementById('confirm-change-btn');
                if (confirmBtn) {
                    this.EventManager.on(confirmBtn, 'click', () => {
                        Game.Debug.log('flow', '✅ 找零確認，進入車票展示');
                        this.SceneManager.switchScene('ticketResult', this);
                    }, {}, 'changeDrag');

                    // 🎯 不需找零時：按鈕一開始就可見，直接顯示「點這裡」提示動畫
                    if (changeExpected <= 0) {
                        this.TimerManager.setTimeout(() => {
                            this.highlightConfirmButton('confirm-change-btn');
                        }, 300, 'hint');
                    }
                }
            }
        },

        // ── A6 困難模式找零拖曳介面 ──────────────────────────────────

        _a6ShowHardChangeDrag() {
            const gs     = this.state.gameState;
            const change = gs.currentTransaction.changeExpected;
            const app    = document.getElementById('app');
            if (!app) return;

            // 初始化狀態
            gs.a6cGhostMode  = false;
            gs.a6cHintSlots  = [];
            gs.a6cErrorCount = 0;
            gs.a6cPlaced     = [];
            gs.a6cTotal      = change;
            gs.a6cHintShown  = false;

            // 面額托盤
            let trayDenoms;
            if (change <= 100)      { trayDenoms = [50, 10, 5, 1]; }
            else if (change < 1000) { trayDenoms = [500, 100, 50, 10, 5, 1]; }
            else                    { trayDenoms = [1000, 500, 100, 50, 10, 5, 1]; }

            const trayFaces = {};
            trayDenoms.forEach(d => { trayFaces[d] = Math.random() < 0.5 ? 'back' : 'front'; });
            gs.a6cTrayFaces = trayFaces;

            const greedySolution = {};
            let remSol = change;
            for (const d of [1000, 500, 100, 50, 10, 5, 1]) {
                const cnt = Math.floor(remSol / d);
                if (cnt > 0) { greedySolution[d] = cnt; remSol -= cnt * d; }
            }
            gs.a6cGreedySolution = greedySolution;

            const walletRemaining = (gs.walletTotal || 0) - (gs.currentTransaction.amountPaid || 0);
            gs.a6cWalletBase = walletRemaining;

            // 靜態錢包金幣
            const walletCoins = [];
            let _rem = walletRemaining;
            for (const d of [1000, 500, 100, 50, 10, 5, 1]) {
                const cnt = Math.floor(_rem / d);
                for (let i = 0; i < cnt; i++) walletCoins.push(d);
                _rem -= cnt * d;
            }
            const walletStaticHtml = walletCoins.map(d => {
                const isBill = d >= 100;
                const face = Math.random() < 0.5 ? 'back' : 'front';
                const w = isBill ? 80 : 52;
                return `<div class="a6c-wc-static">
                    <img src="../images/money/${d}_yuan_${face}.png" alt="${d}元"
                         style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;" draggable="false" onerror="this.style.display='none'">
                    <span class="a6c-denom-label">${d}元</span>
                </div>`;
            }).join('');

            const trayHtml = trayDenoms.map(d => {
                const isBill = d >= 100;
                return `<div class="a6c-denom-card" draggable="true" data-denom="${d}" data-face="${trayFaces[d]}" title="${d}元">
                    <img src="../images/money/${d}_yuan_${trayFaces[d]}.png" alt="${d}元"
                         class="${isBill ? 'a6c-banknote-img' : 'a6c-coin-img'}" draggable="false" onerror="this.style.display='none'">
                    <span class="a6c-denom-label">${d}元</span>
                </div>`;
            }).join('');

            const diff = this.state.settings.difficulty;
            app.innerHTML = `
            <div class="store-layout">
                <div class="title-bar">
                    <div class="title-bar-left"><span class="store-icon-large">🚂</span></div>
                    <div class="title-bar-center"><h1>第七步：找零驗證</h1></div>
                    <div class="title-bar-right">
                        <span class="quiz-progress-info">第 ${this.state.quiz.currentQuestion + 1} / ${this.state.settings.questionCount} 題</span>
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                    </div>
                </div>

                <div style="flex:1;display:flex;flex-direction:column;padding:12px;gap:10px;overflow-y:auto;box-sizing:border-box;">

                    <!-- 售票員對話框 -->
                    <div style="display:flex;gap:16px;align-items:stretch;width:100%;">
                        <!-- 左側：售票員圖示 -->
                        <div style="flex-shrink:0;width:120px;display:flex;align-items:center;justify-content:center;">
                            <img src="../images/a6/train_clerk.png" alt="火車站售票員"
                                 style="width:120px;height:120px;object-fit:contain;border-radius:50%;border:3px solid #1976d2;background:linear-gradient(135deg,#e3f2fd,#bbdefb);box-shadow:0 4px 15px rgba(0,0,0,0.2);"
                                 onerror="this.style.display='none'">
                        </div>
                        <!-- 右側：對話框（帶左側箭頭泡泡） -->
                        <div style="flex:1;position:relative;background:#fff;border:3px solid #1976d2;border-radius:20px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 6px 20px rgba(0,0,0,0.15);min-width:0;">
                            <!-- 左箭頭 -->
                            <div style="position:absolute;left:-19px;top:50%;transform:translateY(-50%);width:0;height:0;border-top:12px solid transparent;border-bottom:12px solid transparent;border-right:19px solid #1976d2;pointer-events:none;"></div>
                            <div style="flex:1;text-align:center;">
                                <p class="npc-dialogue-text" style="margin:0;">找您 ${change} 元</p>
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                                <img src="../images/common/hint_detective.png" alt="" style="width:48px;height:auto;animation:settingsBounce 2.5s ease-in-out infinite;" onerror="this.style.display='none'">
                                <button class="a6c-hint-btn" id="a6c-hint-btn">💡 提示</button>
                            </div>
                        </div>
                    </div>

                    <!-- 拖曳金錢區 -->
                    <div class="a6c-card">
                        <div class="a6c-card-title">💰 找零面額（可重複拖曳）</div>
                        <div class="a6c-tray-coins" id="a6c-tray-coins">${trayHtml}</div>
                    </div>

                    <!-- 我的錢包 -->
                    <div class="a6c-card">
                        <div class="a6c-card-title" style="display:flex;align-items:center;">
                            <div style="flex:1;"></div>
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span>💼 我的錢包</span>
                                <span class="a6c-wallet-info a6c-hidden" id="a6c-wallet-info"><span id="a6c-wallet-balance">${walletRemaining}</span>元（已找回 <span id="a6c-placed-total">0</span>/${change} 元）</span>
                            </div>
                            <div style="flex:1;display:flex;justify-content:flex-end;">
                                <button class="a6c-wallet-toggle-btn" id="a6c-wallet-toggle">▶ 展開錢包</button>
                            </div>
                        </div>
                        <div class="a6c-wallet-split">
                            <!-- 左：原有錢包（預設折疊） -->
                            <div class="a6c-wallet-left" id="a6c-wallet-left" style="display:none;">
                                ${walletStaticHtml || '<span class="a6c-empty-hint">（餘額為0）</span>'}
                            </div>
                            <!-- 右：找零放置區（永遠展開，折疊時佔滿全寬） -->
                            <div class="a6c-wallet-right a6c-drop-zone" id="a6c-wallet-zone">
                                <div id="a6c-wallet-coins" style="display:flex;flex-wrap:wrap;gap:10px;width:100%;align-items:flex-end;justify-content:center;min-height:60px;">
                                    <span class="a6c-empty-hint">把找零金錢拖曳到這裡</span>
                                </div>
                            </div>
                        </div>
                        <div style="text-align:center;margin-top:12px;">
                            <button class="a6c-confirm-btn" id="a6c-confirm-btn" disabled>✅ 確認找零</button>
                        </div>
                    </div>

                </div>
            </div>`;

            this.TimerManager.setTimeout(() => {
                this.Speech.speak(`找您${change}元，請把找回的金錢拖曳到我的錢包`);
            }, 400, 'speech');
            this.TimerManager.setTimeout(() => this._a6SetupChangeDragInteraction(change), 100, 'uiAnimation');
        },

        _a6SetupChangeDragInteraction(change) {
            const gs = this.state.gameState;
            const trayEl     = document.getElementById('a6c-tray-coins');
            const walletZone = document.getElementById('a6c-wallet-zone');
            const confirmBtn = document.getElementById('a6c-confirm-btn');
            const hintBtn    = document.getElementById('a6c-hint-btn');
            if (!trayEl || !walletZone) return;

            let _dropCooldown = false;
            const handleDrop = (denom) => {
                if (_dropCooldown) return;
                _dropCooldown = true;
                setTimeout(() => { _dropCooldown = false; }, 300);
                const face = gs.a6cTrayFaces?.[denom] || 'front';
                const uid  = 'a6c' + Date.now() + Math.floor(Math.random() * 10000);
                if (gs.a6cGhostMode) {
                    const slotIdx = (gs.a6cHintSlots || []).findIndex(s => s.denom === denom && !s.filled);
                    if (slotIdx === -1) { this.playSound('error'); return; }
                    this.playSound('click');
                    gs.a6cHintSlots[slotIdx].filled = true;
                    gs.a6cHintSlots[slotIdx].uid = uid;
                    gs.a6cPlaced.push({ denom, uid, face });
                } else {
                    this.playSound('click');
                    gs.a6cPlaced.push({ denom, uid, face });
                }
                this._a6UpdateChangeDisplay(change);
                this._a6RenderWalletCoins(change);
                const runningTotal = (gs.a6cPlaced || []).reduce((s, p) => s + p.denom, 0);
                // 設計意圖：只在按過提示後才播拖曳語音，避免干擾；數字直接傳 TTS（唸四十七元），效果與大寫相同
                if (gs.a6cHintShown) this.Speech.speak(`找回${runningTotal}元`, { interrupt: true });
            };

            // Desktop drag from tray
            trayEl.querySelectorAll('.a6c-denom-card').forEach(card => {
                const denom = parseInt(card.dataset.denom);
                this.EventManager.on(card, 'dragstart', e => {
                    e.dataTransfer.setData('text/plain', `a6cdenom:${denom}`);
                    card.classList.add('a6c-dragging');
                }, {}, 'changeDrag');
                this.EventManager.on(card, 'dragend', () => card.classList.remove('a6c-dragging'), {}, 'changeDrag');
            });
            this.EventManager.on(walletZone, 'dragover', e => { e.preventDefault(); walletZone.classList.add('a6c-drop-active'); }, {}, 'changeDrag');
            this.EventManager.on(walletZone, 'dragleave', e => {
                if (!walletZone.contains(e.relatedTarget)) walletZone.classList.remove('a6c-drop-active');
            }, {}, 'changeDrag');
            this.EventManager.on(walletZone, 'drop', e => {
                e.preventDefault(); walletZone.classList.remove('a6c-drop-active');
                const d = e.dataTransfer.getData('text/plain');
                if (d.startsWith('a6cdenom:')) handleDrop(parseInt(d.replace('a6cdenom:', '')));
            }, {}, 'changeDrag');

            // Touch drag from tray
            trayEl.querySelectorAll('.a6c-denom-card').forEach(card => {
                const denom = parseInt(card.dataset.denom);
                let ghostEl = null;
                this.EventManager.on(card, 'touchstart', e => {
                    const t = e.touches[0];
                    ghostEl = card.cloneNode(true);
                    ghostEl.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.8;transform:scale(1.05);left:${t.clientX - 35}px;top:${t.clientY - 50}px;`;
                    document.body.appendChild(ghostEl);
                }, { passive: true }, 'changeDrag');
                this.EventManager.on(card, 'touchmove', e => {
                    e.preventDefault();
                    const t = e.touches[0];
                    if (ghostEl) { ghostEl.style.left = (t.clientX - 35) + 'px'; ghostEl.style.top = (t.clientY - 50) + 'px'; }
                    const r = walletZone.getBoundingClientRect();
                    walletZone.classList.toggle('a6c-drop-active',
                        t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom);
                }, { passive: false }, 'changeDrag');
                this.EventManager.on(card, 'touchend', e => {
                    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
                    walletZone.classList.remove('a6c-drop-active');
                    const t = e.changedTouches[0];
                    const r = walletZone.getBoundingClientRect();
                    if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) handleDrop(denom);
                }, { passive: true }, 'changeDrag');
            });

            // × 移除按鈕
            const walletCoinsEl = document.getElementById('a6c-wallet-coins');
            if (walletCoinsEl) {
                this.EventManager.on(walletCoinsEl, 'click', e => {
                    const btn = e.target.closest('.a6c-wc-remove');
                    if (!btn) return;
                    this.playSound('click');
                    if (gs.a6cGhostMode) {
                        const slotIdx = parseInt(btn.dataset.slotIdx);
                        if (!isNaN(slotIdx) && gs.a6cHintSlots[slotIdx]) {
                            const uid = gs.a6cHintSlots[slotIdx].uid;
                            gs.a6cHintSlots[slotIdx].filled = false;
                            gs.a6cHintSlots[slotIdx].uid = null;
                            gs.a6cPlaced = gs.a6cPlaced.filter(p => p.uid !== uid);
                        }
                    } else {
                        const uid = btn.dataset.uid;
                        gs.a6cPlaced = gs.a6cPlaced.filter(p => p.uid !== uid);
                    }
                    this._a6UpdateChangeDisplay(change);
                    this._a6RenderWalletCoins(change);
                }, {}, 'changeDrag');

                // Desktop 拖回托盤
                let _draggingWalletUid = null;
                this.EventManager.on(walletCoinsEl, 'dragstart', e => {
                    const item = e.target.closest('.a6c-wc-item[data-uid]');
                    if (!item) return;
                    _draggingWalletUid = item.dataset.uid;
                    e.dataTransfer.setData('text/plain', `a6cuid:${_draggingWalletUid}`);
                    e.dataTransfer.effectAllowed = 'move';
                }, {}, 'changeDrag');
                this.EventManager.on(document, 'dragend', e => {
                    if (!_draggingWalletUid) return;
                    const uid = _draggingWalletUid;
                    _draggingWalletUid = null;
                    if (e.dataTransfer.dropEffect === 'none') {
                        if (gs.a6cGhostMode) {
                            const slotIdx = (gs.a6cHintSlots || []).findIndex(s => s.uid === uid);
                            if (slotIdx !== -1) { gs.a6cHintSlots[slotIdx].filled = false; gs.a6cHintSlots[slotIdx].uid = null; }
                        }
                        gs.a6cPlaced = (gs.a6cPlaced || []).filter(p => p.uid !== uid);
                        this._a6UpdateChangeDisplay(change);
                        this._a6RenderWalletCoins(change);
                    }
                }, {}, 'changeDrag');

                // Touch 拖回
                let _touchWalletUid = null;
                let _touchGhostEl   = null;
                this.EventManager.on(walletCoinsEl, 'touchstart', e => {
                    const item = e.target.closest('.a6c-wc-item[data-uid]');
                    if (!item) return;
                    _touchWalletUid = item.dataset.uid;
                    const t = e.touches[0];
                    _touchGhostEl = item.cloneNode(true);
                    _touchGhostEl.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.7;left:${t.clientX - 30}px;top:${t.clientY - 40}px;`;
                    document.body.appendChild(_touchGhostEl);
                }, { passive: true }, 'changeDrag');
                this.EventManager.on(walletCoinsEl, 'touchmove', e => {
                    if (!_touchGhostEl) return;
                    e.preventDefault();
                    const t = e.touches[0];
                    _touchGhostEl.style.left = (t.clientX - 30) + 'px';
                    _touchGhostEl.style.top  = (t.clientY - 40) + 'px';
                }, { passive: false }, 'changeDrag');
                this.EventManager.on(walletCoinsEl, 'touchend', e => {
                    if (_touchGhostEl) { _touchGhostEl.remove(); _touchGhostEl = null; }
                    if (!_touchWalletUid) return;
                    const uid = _touchWalletUid;
                    _touchWalletUid = null;
                    const t   = e.changedTouches[0];
                    const zone = document.getElementById('a6c-wallet-zone');
                    const r    = zone?.getBoundingClientRect();
                    const inside = r && t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;
                    if (!inside) {
                        if (gs.a6cGhostMode) {
                            const slotIdx = (gs.a6cHintSlots || []).findIndex(s => s.uid === uid);
                            if (slotIdx !== -1) { gs.a6cHintSlots[slotIdx].filled = false; gs.a6cHintSlots[slotIdx].uid = null; }
                        }
                        gs.a6cPlaced = (gs.a6cPlaced || []).filter(p => p.uid !== uid);
                        this._a6UpdateChangeDisplay(change);
                        this._a6RenderWalletCoins(change);
                    }
                }, { passive: true }, 'changeDrag');
            }

            if (confirmBtn) {
                this.EventManager.on(confirmBtn, 'click', () => {
                    if (this.state.isProcessing) return;
                    this.state.isProcessing = true;
                    this._a6ConfirmChange(change);
                }, {}, 'changeDrag');
            }

            if (hintBtn) {
                this.EventManager.on(hintBtn, 'click', () => {
                    this.playSound('click');
                    gs.a6cHintShown = true;
                    const walletInfo = document.getElementById('a6c-wallet-info');
                    if (walletInfo) walletInfo.classList.remove('a6c-hidden');
                    this._a6ShowChangeGhostSlots(change);
                    this._a6ShowChangeHintModal(change);
                }, {}, 'changeDrag');
            }

            const walletToggle = document.getElementById('a6c-wallet-toggle');
            if (walletToggle) {
                this.EventManager.on(walletToggle, 'click', () => {
                    const left = document.getElementById('a6c-wallet-left');
                    if (!left) return;
                    const expanded = left.style.display !== 'none';
                    left.style.display = expanded ? 'none' : '';
                    walletToggle.textContent = expanded ? '▶ 展開錢包' : '◀ 收起錢包';
                }, {}, 'changeDrag');
            }
        },

        _a6UpdateChangeDisplay(change) {
            const gs = this.state.gameState;
            const placedTotal = (gs.a6cPlaced || []).reduce((s, p) => s + p.denom, 0);
            const exact = placedTotal === change;
            const totalEl = document.getElementById('a6c-placed-total');
            if (totalEl) totalEl.textContent = placedTotal;
            const balanceEl = document.getElementById('a6c-wallet-balance');
            if (balanceEl) balanceEl.textContent = (gs.a6cWalletBase || 0) + placedTotal;
            const confirmBtn = document.getElementById('a6c-confirm-btn');
            if (confirmBtn) {
                confirmBtn.disabled = false;
            }
        },

        _a6RenderWalletCoins(change) {
            const gs = this.state.gameState;
            const walletCoinsEl = document.getElementById('a6c-wallet-coins');
            if (!walletCoinsEl) return;

            const _makeFilledSlot = (denom, face, uid, slotIdx) => {
                const isBill = denom >= 100;
                const w = isBill ? 80 : 52;
                const div = document.createElement('div');
                div.className = 'a6c-wc-item';
                div.draggable = true;
                div.dataset.uid = uid || '';
                div.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;" draggable="false" onerror="this.style.display='none'">
                    <span class="a6c-denom-label">${denom}元</span>
                    <button class="a6c-wc-remove" data-uid="${uid || ''}"${slotIdx != null ? ` data-slot-idx="${slotIdx}"` : ''} title="移除">×</button>`;
                return div;
            };
            const _makeGhostSlot = (denom, face) => {
                const isBill = denom >= 100;
                const w = isBill ? 80 : 52;
                const div = document.createElement('div');
                div.className = 'a6c-ghost-slot';
                div.dataset.denom = denom;
                div.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;opacity:0.3;" draggable="false" onerror="this.style.display='none'">
                    <span class="a6c-denom-label" style="opacity:0.3;">${denom}元</span>`;
                return div;
            };

            if (gs.a6cGhostMode && gs.a6cHintSlots?.length > 0) {
                if (gs.a6cHintSlots.every(s => s.filled)) {
                    gs.a6cGhostMode = false;
                    walletCoinsEl.innerHTML = '';  // 清除所有 ghost slot，避免殘留
                } else {
                    const kids = Array.from(walletCoinsEl.children);
                    if (kids.length !== gs.a6cHintSlots.length) {
                        walletCoinsEl.innerHTML = '';
                        gs.a6cHintSlots.forEach((slot, idx) => {
                            walletCoinsEl.appendChild(slot.filled ? _makeFilledSlot(slot.denom, slot.face, slot.uid, idx) : _makeGhostSlot(slot.denom, slot.face));
                        });
                    } else {
                        gs.a6cHintSlots.forEach((slot, idx) => {
                            const el = kids[idx];
                            const curFilled = el.classList.contains('a6c-wc-item');
                            if (slot.filled === curFilled) return;
                            walletCoinsEl.replaceChild(slot.filled ? _makeFilledSlot(slot.denom, slot.face, slot.uid, idx) : _makeGhostSlot(slot.denom, slot.face), el);
                        });
                    }
                    return;
                }
            }

            if (!gs.a6cPlaced || gs.a6cPlaced.length === 0) {
                walletCoinsEl.innerHTML = '<span class="a6c-empty-hint">把找零金錢拖曳到這裡</span>';
                return;
            }
            const emptyEl = walletCoinsEl.querySelector('.a6c-empty-hint');
            if (emptyEl) emptyEl.remove();
            const existingMap = {};
            walletCoinsEl.querySelectorAll('.a6c-wc-item').forEach(el => { existingMap[el.dataset.uid] = el; });
            const desiredUids = new Set(gs.a6cPlaced.map(p => p.uid));
            Object.entries(existingMap).forEach(([uid, el]) => { if (!desiredUids.has(uid)) el.remove(); });
            gs.a6cPlaced.forEach(p => {
                if (existingMap[p.uid]) return;
                walletCoinsEl.appendChild(_makeFilledSlot(p.denom, p.face, p.uid, null));
            });
        },

        _a6ConfirmChange(change) {
            const gs = this.state.gameState;
            const placedTotal = (gs.a6cPlaced || []).reduce((s, p) => s + p.denom, 0);

            if (placedTotal !== change) {
                this.state.isProcessing = false;
                gs.a6cErrorCount = (gs.a6cErrorCount || 0) + 1;
                const dir = placedTotal > change ? '太多了' : '太少了';
                const walletZone = document.getElementById('a6c-wallet-zone');
                if (walletZone) {
                    walletZone.style.animation = 'a6cShake 0.4s ease';
                    this.TimerManager.setTimeout(() => { if (walletZone) walletZone.style.animation = ''; }, 500, 'feedback');
                }
                this.playSound('error');
                this.Speech.speak(`不對喔，找零算${dir}，請再試一次`);
                gs.a6cPlaced    = [];
                gs.a6cGhostMode = false;
                gs.a6cHintSlots = [];
                this._a6UpdateChangeDisplay(change);
                this._a6RenderWalletCoins(change);
                if (gs.a6cErrorCount >= 3) {
                    gs.a6cErrorCount = 0;
                    this.TimerManager.setTimeout(() => this._a6ShowChangeGhostSlots(change), 900, 'feedback');
                }
                return;
            }

            // 找零正確
            this.state.isProcessing = false;
            this.playSound('correct');
            this.startFireworksAnimation();
            gs.currentChangeOptions = null;
            gs.changeErrorCount     = 0;
            gs.isProcessingChange   = false;
            this.TimerManager.setTimeout(() => {
                this.Speech.speak(`正確，應該找你${change}元`, () => {
                    this.SceneManager.switchScene('ticketResult', this);
                });
            }, 500, 'speech');
        },

        _a6ShowChangeGhostSlots(change) {
            const gs = this.state.gameState;
            gs.a6cPlaced    = [];
            gs.a6cGhostMode = true;
            const solution = gs.a6cGreedySolution || {};
            const slots = [];
            Object.entries(solution).sort(([a], [b]) => b - a).forEach(([d, cnt]) => {
                const denom = parseInt(d);
                const face  = gs.a6cTrayFaces?.[denom] || 'front';
                for (let i = 0; i < cnt; i++) slots.push({ denom, face, filled: false, uid: null });
            });
            gs.a6cHintSlots = slots;
            // 強制清空，避免 DOM diff 誤判 empty-hint span 為 ghost slot
            const _wc6 = document.getElementById('a6c-wallet-coins');
            if (_wc6) _wc6.innerHTML = '';
            this._a6UpdateChangeDisplay(change);
            this._a6RenderWalletCoins(change);
            const parts = Object.entries(solution).sort(([a], [b]) => b - a).map(([d, cnt]) => `${cnt}個${d}元`);
            this.Speech.speak(`可以用${parts.join('，')}`);
        },

        _a6UpdateChangeTrayHints() {
            const gs = this.state.gameState;
            document.querySelectorAll('.a6c-denom-card').forEach(el => el.classList.remove('b6-product-here-hint'));
            if (!gs.a6cGhostMode) return;
            const needed = {};
            (gs.a6cHintSlots || []).filter(s => !s.filled).forEach(s => { needed[s.denom] = (needed[s.denom] || 0) + 1; });
            document.querySelectorAll('.a6c-denom-card').forEach(el => {
                const d = parseInt(el.dataset.denom);
                if (needed[d]) el.classList.add('b6-product-here-hint');
            });
        },

        _a6ShowChangeHintModal(change) {
            const gs = this.state.gameState;
            const solution = gs.a6cGreedySolution || {};
            const parts = Object.entries(solution).sort(([a], [b]) => b - a).map(([d, cnt]) => `${cnt}個${d}元`);
            const speechText = `找零${change}元，可以用${parts.join('，')}`;

            let hintListHTML = '';
            Object.entries(solution).sort(([a], [b]) => b - a).forEach(([d, cnt]) => {
                const denom  = parseInt(d);
                const face   = gs.a6cTrayFaces?.[denom] || 'front';
                const isBill = denom >= 100;
                const imgStyle = isBill ? 'width:80px;height:auto;max-height:50px;' : 'width:50px;height:50px;';
                hintListHTML += `
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:10px 14px;background:#eff6ff;border-radius:10px;border:1px solid #bfdbfe;">
                    <img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                         style="${imgStyle}object-fit:contain;" onerror="this.style.display='none'" draggable="false">
                    <span style="font-size:18px;font-weight:700;color:#1f2937;">${denom}元</span>
                    <span style="color:#9ca3af;font-size:16px;">×</span>
                    <span style="font-size:18px;font-weight:700;color:#2563eb;">${cnt} 個</span>
                </div>`;
            });

            const existing = document.getElementById('a6c-hint-modal');
            if (existing) existing.remove();
            const overlay = document.createElement('div');
            overlay.id = 'a6c-hint-modal';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10200;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = `
                <div style="background:white;border-radius:16px;padding:24px;max-width:420px;width:92%;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
                    <div style="text-align:center;font-size:20px;font-weight:700;color:#2563eb;margin-bottom:6px;">💡 找零提示</div>
                    <div style="text-align:center;font-size:14px;color:#6b7280;margin-bottom:14px;">建議的找零方式：</div>
                    <div>${hintListHTML}</div>
                    <div style="display:flex;gap:10px;justify-content:center;margin-top:12px;">
                        <button id="a6c-hm-replay" style="background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;padding:10px 20px;border-radius:20px;font-size:15px;font-weight:700;cursor:pointer;">🔊 再播一次</button>
                        <button id="a6c-hm-close" style="background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;padding:10px 20px;border-radius:20px;font-size:15px;font-weight:700;cursor:pointer;">我知道了</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);

            this.Speech.speak(speechText);
            const closeModal = () => overlay.remove();
            document.getElementById('a6c-hm-close')?.addEventListener('click', closeModal);
            document.getElementById('a6c-hm-replay')?.addEventListener('click', () => { this.playSound('click'); this.Speech.speak(speechText); });
            overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
        },

        // 🔧 Bug 4 修復：設置簡單模式找零拖曳功能（Phase 3：遷移至 EventManager）
        setupEasyChangeDragAndDrop() {
            const changeMoneyItems = document.querySelectorAll('.easy-change-money');
            const targetItems = document.querySelectorAll('.easy-change-target');

            // 綁定拖曳開始事件
            changeMoneyItems.forEach(item => {
                this.EventManager.on(item, 'dragstart', (e) => {
                    const moneyElement = e.target.closest('.easy-change-money');
                    const changeIndex = moneyElement.dataset.changeIndex;
                    const moneyValue = moneyElement.dataset.moneyValue;
                    e.dataTransfer.setData('text/plain', `easy-change-${changeIndex}-${moneyValue}`);
                    e.dataTransfer.effectAllowed = 'move';
                    // 拖曳開始時半透明（同付款頁面）
                    moneyElement.style.opacity = '0.5';
                    // 記錄拖曳中的元素索引
                    this._currentEasyChangeIndex = changeIndex;
                }, {}, 'changeDrag');

                this.EventManager.on(item, 'dragend', (e) => {
                    const moneyElement = e.target.closest('.easy-change-money');
                    const changeIndex = moneyElement?.dataset.changeIndex;
                    // 拖曳結束恢復顯示（已放置的會被 display:none 處理）
                    if (changeIndex && !this.state.gameState.easyChangeDropped[changeIndex]) {
                        moneyElement.style.opacity = '1';
                    }
                    this._currentEasyChangeIndex = null;
                }, {}, 'changeDrag');

                // 點擊事件（行動裝置支援）
                this.EventManager.on(item, 'click', (e) => {
                    this.handleEasyChangeMoneyClick(e);
                }, {}, 'changeDrag');
            });

            // 綁定放置目標事件
            targetItems.forEach(target => {
                this.EventManager.on(target, 'dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    target.classList.add('drag-over');
                }, {}, 'changeDrag');

                this.EventManager.on(target, 'dragleave', (e) => {
                    target.classList.remove('drag-over');
                }, {}, 'changeDrag');

                this.EventManager.on(target, 'drop', (e) => {
                    e.preventDefault();
                    target.classList.remove('drag-over');
                    this.handleEasyChangeTargetDrop(e);
                }, {}, 'changeDrag');

                // 點擊事件（行動裝置支援）
                this.EventManager.on(target, 'click', (e) => {
                    this.handleEasyChangeTargetClick(e);
                }, {}, 'changeDrag');
            });

            // 添加拖曳相關樣式
            this.addEasyChangeDragStyles();

            // 🆕 TouchDragUtility 觸控拖曳支援
            if (window.TouchDragUtility) {
                // 🔧 [stale container 修復] 清理前次付款/找零步驟遺留的拖曳處理器
                // 此時付款流程已完成，所有舊的 wallet/payment dragStartHandlers 均可釋放
                window.TouchDragUtility.cleanupAll();

                const sourceContainer = document.getElementById('easy-change-money');
                const targetContainer = document.getElementById('easy-change-targets');

                if (sourceContainer && targetContainer) {
                    window.TouchDragUtility.registerDraggable(
                        sourceContainer,
                        '.easy-change-money',
                        {
                            onDragStart: (element, event) => {
                                const changeIndex = element.dataset.changeIndex;
                                // 檢查是否已被放置
                                if (this.state.gameState.easyChangeDropped[changeIndex]) {
                                    return false;
                                }
                                // 拖曳開始時半透明（同付款頁面）
                                element.style.opacity = '0.5';
                                this._currentEasyChangeIndex = changeIndex;
                                return true;
                            },
                            onDragEnd: (element, event) => {
                                const changeIndex = element.dataset.changeIndex;
                                // 拖曳結束恢復顯示（已放置的會被 display:none 處理）
                                if (changeIndex && !this.state.gameState.easyChangeDropped[changeIndex]) {
                                    element.style.opacity = '1';
                                }
                                this._currentEasyChangeIndex = null;
                            },
                            onDrop: (element, dropZone) => {
                                // 處理觸控放置邏輯
                                this.handleEasyChangeTouchDrop(element, dropZone);
                            }
                        }
                    );

                    // 註冊每個目標位置為放置區
                    const fadedTargets = document.querySelectorAll('.easy-change-target.faded');
                    fadedTargets.forEach(target => {
                        window.TouchDragUtility.registerDropZone(target, () => true);
                    });

                    Game.Debug.log('event', '📱 [A6-簡單找零] TouchDragUtility 已註冊');
                }
            }
        },

        // 🆕 處理簡單模式找零觸控放置
        handleEasyChangeTouchDrop(element, dropZone) {
            // 🔧 輔助點擊模式：不允許使用者直接拖曳找零，須透過點擊模式操作
            if (this.state.settings.clickMode && this.state.gameState.clickModeState?.active) {
                this.playSound('error');
                element.style.opacity = '1';
                return;
            }

            const changeIndex = element.dataset.changeIndex;
            const moneyValue = element.dataset.moneyValue;
            const targetElement = dropZone.closest('.easy-change-target');

            if (!targetElement) {
                Game.Debug.log('payment', '🚫 [A6-簡單找零-觸控] 找不到目標位置');
                return;
            }

            const targetIndex = targetElement.dataset.targetIndex;
            const expectedValue = targetElement.dataset.expectedValue;

            if (targetIndex === undefined || expectedValue === undefined) {
                Game.Debug.log('payment', '🚫 [A6-簡單找零-觸控] 目標位置資料不完整');
                return;
            }

            // 檢查金額是否匹配
            if (moneyValue !== expectedValue) {
                Game.Debug.log('payment', '❌ [A6-簡單找零-觸控] 金額不匹配:', moneyValue, '!==', expectedValue);
                this.playSound('error');
                element.style.opacity = '1';
                return;
            }

            // 檢查目標是否已被放置
            if (this.state.gameState.easyChangeDropped[targetIndex]) {
                Game.Debug.log('payment', '🚫 [A6-簡單找零-觸控] 目標位置已被放置');
                element.style.opacity = '1';
                return;
            }

            // 成功放置
            Game.Debug.log('payment', '✅ [A6-簡單找零-觸控] 放置成功:', changeIndex, '->', targetIndex);
            this.handleEasyChangePlacement(changeIndex, targetIndex);
        },

        // 🔧 Bug 4 修復：處理簡單模式找零拖曳放置
        handleEasyChangeTargetDrop(event) {
            const dragData = event.dataTransfer.getData('text/plain');

            if (!dragData || !dragData.startsWith('easy-change-')) {
                Game.Debug.log('payment', '🚫 [A6-簡單找零] 無效的拖曳資料');
                return;
            }

            const [, , changeIndex, moneyValue] = dragData.split('-');
            const targetIndex = event.target.closest('.easy-change-target')?.dataset.targetIndex;
            const expectedValue = event.target.closest('.easy-change-target')?.dataset.expectedValue;

            // 🆕 取得來源元素（用於失敗時恢復顯示）
            const sourceElement = document.querySelector(`.easy-change-money[data-change-index="${changeIndex}"]`);

            if (targetIndex === undefined || expectedValue === undefined) {
                Game.Debug.log('payment', '🚫 [A6-簡單找零] 找不到目標位置');
                if (sourceElement) sourceElement.style.opacity = '1';
                return;
            }

            // 檢查金額是否匹配
            if (moneyValue !== expectedValue) {
                Game.Debug.log('payment', '❌ [A6-簡單找零] 金額不匹配:', moneyValue, '!==', expectedValue);
                this.playSound('error');
                if (sourceElement) sourceElement.style.opacity = '1';
                return;
            }

            // 檢查目標是否已被放置
            if (this.state.gameState.easyChangeDropped[targetIndex]) {
                Game.Debug.log('payment', '🚫 [A6-簡單找零] 目標位置已被放置');
                if (sourceElement) sourceElement.style.opacity = '1';
                return;
            }

            // 成功放置（handleEasyChangePlacement 會處理隱藏來源元素）
            this.handleEasyChangePlacement(changeIndex, targetIndex);
        },

        // 🔧 Bug 4 修復：處理簡單模式找零錢幣點擊（選中狀態）
        selectedEasyChangeMoney: null,

        handleEasyChangeMoneyClick(event) {
            const moneyElement = event.target.closest('.easy-change-money');
            if (!moneyElement) return;

            // 清除之前的選中狀態
            document.querySelectorAll('.easy-change-money.selected').forEach(el => {
                el.classList.remove('selected');
                el.style.boxShadow = '';
            });

            // 設置選中狀態
            moneyElement.classList.add('selected');
            moneyElement.style.boxShadow = '0 0 15px rgba(255, 152, 0, 0.8)';
            this.selectedEasyChangeMoney = moneyElement;

            Game.Debug.log('payment', '📱 [A6-簡單找零] 選中錢幣:', moneyElement.dataset.moneyName);
        },

        // 🔧 Bug 4 修復：處理簡單模式找零目標點擊（放置）
        handleEasyChangeTargetClick(event) {
            if (!this.selectedEasyChangeMoney) return;

            const targetElement = event.target.closest('.easy-change-target');
            if (!targetElement) return;

            const changeIndex = this.selectedEasyChangeMoney.dataset.changeIndex;
            const moneyValue = this.selectedEasyChangeMoney.dataset.moneyValue;
            const targetIndex = targetElement.dataset.targetIndex;
            const expectedValue = targetElement.dataset.expectedValue;

            // 檢查金額是否匹配
            if (moneyValue !== expectedValue) {
                Game.Debug.log('payment', '❌ [A6-簡單找零] 金額不匹配');
                this.playSound('error');
                return;
            }

            // 檢查目標是否已被放置
            if (this.state.gameState.easyChangeDropped[targetIndex]) {
                Game.Debug.log('payment', '🚫 [A6-簡單找零] 目標位置已被放置');
                return;
            }

            // 成功放置
            this.handleEasyChangePlacement(changeIndex, targetIndex);

            // 清除選中狀態
            this.selectedEasyChangeMoney.classList.remove('selected');
            this.selectedEasyChangeMoney.style.boxShadow = '';
            this.selectedEasyChangeMoney = null;
        },

        // 🔧 Bug 4 修復：處理簡單模式找零放置成功
        handleEasyChangePlacement(changeIndex, targetIndex) {
            Game.Debug.log('payment', '✅ [A6-簡單找零] 放置成功:', changeIndex, '->', targetIndex);

            // 播放放置音效
            this.playSound('coin');

            // 更新狀態
            this.state.gameState.easyChangeDropped[targetIndex] = true;

            // 計算累計找回金額
            const changeList = this.state.gameState.easyChangeList;
            const dropped = this.state.gameState.easyChangeDropped;
            let cumulativeTotal = 0;
            for (let i = 0; i < dropped.length; i++) {
                if (dropped[i]) {
                    cumulativeTotal += changeList[i].value;
                }
            }

            // 隱藏來源錢幣（成功放置後才消失）
            const sourceElement = document.querySelector(`.easy-change-money[data-change-index="${changeIndex}"]`);
            if (sourceElement) {
                sourceElement.style.display = 'none';
            }

            // 點亮目標位置
            const targetElement = document.querySelector(`.easy-change-target[data-target-index="${targetIndex}"]`);
            if (targetElement) {
                targetElement.classList.remove('faded');
                targetElement.style.opacity = '1';
                targetElement.style.borderStyle = 'solid';
                targetElement.style.borderColor = '#4caf50';
                targetElement.style.background = 'white';
                const targetImg = targetElement.querySelector('img');
                if (targetImg) {
                    targetImg.style.opacity = '1';
                }
            }

            // 檢查是否全部放置完成
            const allDropped = this.state.gameState.easyChangeDropped.every(dropped => dropped);
            if (allDropped) {
                Game.Debug.log('flow', '🎉 [A6-簡單找零] 全部放置完成！');
                this.playSound('correct');

                // 顯示確認按鈕
                const confirmBtn = document.getElementById('confirm-change-btn');
                if (confirmBtn) {
                    confirmBtn.style.display = 'block';
                    // 🎯 簡單模式：顯示「點這裡」提示動畫
                    this.TimerManager.setTimeout(() => {
                        this.highlightConfirmButton('confirm-change-btn');
                    }, 300, 'hint');
                }

                // 先完整唸完「已找回XXX元」，callback 後再唸「太棒了！找零金額正確！」
                this.Speech.speak(`已找回${this.convertAmountToSpeech(cumulativeTotal)}`, {
                    callback: () => {
                        this.Speech.speak('太棒了！找零金額正確！');
                    }
                });
            } else {
                // 非最後一枚：只唸累計金額
                this.Speech.speak(`已找回${this.convertAmountToSpeech(cumulativeTotal)}`);
            }
        },

        // 🔧 Bug 4 修復：添加簡單模式找零拖曳樣式
        addEasyChangeDragStyles() {
            if (!document.getElementById('easy-change-drag-styles')) {
                const style = document.createElement('style');
                style.id = 'easy-change-drag-styles';
                style.textContent = `
                    .easy-change-money {
                        transition: all 0.3s ease;
                    }
                    .easy-change-money:hover {
                        transform: scale(1.05);
                        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
                    }
                    .easy-change-money.selected {
                        transform: scale(1.1);
                    }
                    .easy-change-target {
                        transition: all 0.3s ease;
                    }
                    .easy-change-target.drag-over {
                        transform: scale(1.05);
                        border-color: #ff9800 !important;
                        background: rgba(255, 152, 0, 0.2) !important;
                    }
                    .easy-change-target.faded {
                        cursor: pointer;
                    }
                `;
                document.head.appendChild(style);
            }
        },

        // 生成找零金錢HTML
        generateChangeMoneyHTML(changeAmount) {
            const moneyItems = this.storeData.moneyItems.slice().reverse();
            let remaining = changeAmount;
            let html = '<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">';

            for (const item of moneyItems) {
                while (remaining >= item.value) {
                    const isCoin = item.value < 100;
                    html += `
                        <div class="change-money" style="padding: 10px; background: white;
                            border: 2px solid #4caf50; border-radius: 10px; text-align: center;">
                            <img src="${this.getRandomMoneyImage(item)}" alt="${item.name}"
                                style="width: ${isCoin ? '50px' : '80px'}; height: auto;">
                            <div style="margin-top: 5px; font-weight: bold;">${item.name}</div>
                        </div>
                    `;
                    remaining -= item.value;
                }
            }

            html += '</div>';
            return html;
        },

        // 🔧 Bug 4 修復：生成簡單模式找零拖曳來源 HTML
        generateEasyChangeDragSourceHTML(changeAmount) {
            if (changeAmount === 0) {
                return '<div style="color: #666; font-style: italic;">不需找零</div>';
            }

            const moneyItems = this.storeData.moneyItems.slice().reverse();
            let remaining = changeAmount;
            const changeList = [];

            // 計算需要哪些錢幣
            for (const item of moneyItems) {
                while (remaining >= item.value) {
                    const moneyData = {...item};
                    moneyData.imagePath = this.getRandomMoneyImage(moneyData);
                    changeList.push(moneyData);
                    remaining -= item.value;
                }
            }

            // 🔧 儲存找零清單供後續驗證使用
            this.state.gameState.easyChangeList = changeList;
            this.state.gameState.easyChangeDropped = new Array(changeList.length).fill(false);

            let html = '';
            changeList.forEach((money, index) => {
                const isCoin = money.value < 100;
                html += `
                    <div class="easy-change-money draggable"
                         data-change-index="${index}"
                         data-money-value="${money.value}"
                         data-money-name="${money.name}"
                         draggable="true"
                         style="padding: 10px;
                                background: white;
                                border: 2px solid #ddd;
                                border-radius: 10px;
                                text-align: center;
                                cursor: grab;
                                transition: all 0.3s ease;">
                        <img src="${money.imagePath}" alt="${money.name}"
                            style="width: ${isCoin ? '50px' : '80px'}; height: auto; pointer-events: none;">
                        <div style="margin-top: 5px; font-weight: bold; pointer-events: none;">${money.name}</div>
                    </div>
                `;
            });

            return html;
        },

        // 🔧 Bug 4 修復：生成簡單模式找零拖曳目標 HTML
        generateEasyChangeDragTargetHTML(changeAmount) {
            if (changeAmount === 0) {
                return '<div style="color: #666; font-style: italic;">不需找零</div>';
            }

            const moneyItems = this.storeData.moneyItems.slice().reverse();
            let remaining = changeAmount;
            const changeList = [];

            // 計算需要哪些錢幣（與來源相同）
            for (const item of moneyItems) {
                while (remaining >= item.value) {
                    const moneyData = {...item};
                    // 使用已儲存的 imagePath（如果有）
                    if (this.state.gameState.easyChangeList) {
                        const savedItem = this.state.gameState.easyChangeList[changeList.length];
                        if (savedItem) {
                            moneyData.imagePath = savedItem.imagePath;
                        } else {
                            moneyData.imagePath = this.getRandomMoneyImage(moneyData);
                        }
                    } else {
                        moneyData.imagePath = this.getRandomMoneyImage(moneyData);
                    }
                    changeList.push(moneyData);
                    remaining -= item.value;
                }
            }

            let html = '';
            changeList.forEach((money, index) => {
                const isCoin = money.value < 100;
                html += `
                    <div class="easy-change-target faded"
                         data-target-index="${index}"
                         data-expected-value="${money.value}"
                         style="padding: 10px; background: rgba(255, 255, 255, 0.5);
                            border: 2px dashed #4caf50; border-radius: 10px;
                            text-align: center; opacity: 0.5;">
                        <img src="${money.imagePath}" alt="${money.name}"
                            style="width: ${isCoin ? '50px' : '80px'}; height: auto; pointer-events: none; opacity: 0.5;">
                        <div style="margin-top: 5px; font-weight: bold; pointer-events: none; color: #4caf50;">${money.name}</div>
                    </div>
                `;
            });

            return html;
        },

        // 🔧 生成找零選項（三選一）- 確保選項金額唯一性
        generateChangeOptions(expectedChange) {
            const correctOption = {
                isCorrect: true,
                totalValue: expectedChange,
                money: expectedChange === 0 ? [] : this.generateChangeMoneyDisplay(expectedChange)
            };

            const wrongOptions = [];
            const existingValues = new Set([expectedChange]);

            if (expectedChange === 0) {
                // 當不需要找零時，生成兩個唯一的、非零的錯誤選項
                while (wrongOptions.length < 2) {
                    const wrongAmount = Math.floor(Math.random() * 35) + 5; // 5到39元
                    if (!existingValues.has(wrongAmount)) {
                        existingValues.add(wrongAmount);
                        wrongOptions.push({
                            isCorrect: false,
                            totalValue: wrongAmount,
                            money: this.generateChangeMoneyDisplay(wrongAmount)
                        });
                    }
                }
            } else {
                // 當需要找零時，生成兩個唯一的錯誤選項
                while (wrongOptions.length < 2) {
                    let wrongAmount;
                    const randomChoice = Math.random();

                    if (randomChoice < 0.5) {
                        // 策略1：多找的金額
                        wrongAmount = expectedChange + (Math.floor(Math.random() * 16) + 5); // 多找 5~20 元
                    } else {
                        // 策略2：少找的金額 (確保至少為1)
                        const reduction = Math.floor(Math.random() * 10) + 1; // 減少 1~10 元
                        wrongAmount = Math.max(1, expectedChange - reduction);
                    }

                    if (!existingValues.has(wrongAmount)) {
                        existingValues.add(wrongAmount);
                        wrongOptions.push({
                            isCorrect: false,
                            totalValue: wrongAmount,
                            money: this.generateChangeMoneyDisplay(wrongAmount)
                        });
                    }
                }
            }

            const allOptions = [correctOption, ...wrongOptions];
            return this.shuffleArray(allOptions);
        },

        // 生成找零金錢顯示
        generateChangeMoneyDisplay(amount) {
            if (amount === 0) return [];

            const money = [];
            let remaining = amount;

            // 優先使用大面額
            const denominations = [500, 100, 50, 10, 5, 1];

            for (const denom of denominations) {
                while (remaining >= denom) {
                    const moneyItem = this.storeData?.moneyItems?.find(m => m.value === denom);
                    if (moneyItem) {
                        // 🔧 Bug 3 修復：生成找零選項時決定並儲存 imagePath
                        const item = {...moneyItem};
                        item.imagePath = this.getRandomMoneyImage(item);
                        money.push(item);
                        remaining -= denom;
                    } else {
                        break;
                    }
                }
            }

            return money;
        },

        // 隨機排列陣列
        shuffleArray(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        },

        // 🎲 隨機取得金錢圖片（正面或反面）
        getRandomMoneyImage(moneyItem) {
            if (!moneyItem || !moneyItem.images) {
                Game.Debug.warn('coin', '⚠️ [隨機圖片] 無效的金錢物件:', moneyItem);
                return '';
            }
            // 隨機選擇正面或反面
            return Math.random() < 0.5 ? moneyItem.images.front : moneyItem.images.back;
        },

        // 處理找零選項選擇
        selectChangeOption(optionIndex, isCorrect, changeAmount) {
            const difficulty = this.state.settings.difficulty;

            // 防止重複點擊
            if (this.state.gameState.isTransitioning || this.state.gameState.isProcessingChange) {
                Game.Debug.log('payment', '🚫 [A6-找零] 選項處理中，忽略重複點擊');
                return;
            }

            const selectedOption = document.querySelector(`[data-option-index="${optionIndex}"]`);
            if (!selectedOption) {
                Game.Debug.log('payment', '🚫 [A6-找零] 找不到選項元素');
                return;
            }

            // 檢查是否已被點擊過（僅普通模式）
            if (difficulty !== 'hard' && (selectedOption.classList.contains('correct-selected') ||
                selectedOption.classList.contains('incorrect-selected'))) {
                Game.Debug.log('payment', '🚫 [A6-找零] 選項已被點擊過');
                return;
            }

            const amountDisplay = selectedOption.querySelector('.option-amount-display');

            // 困難模式：檢查是否為第一次點擊（金額是否隱藏）
            if (difficulty === 'hard' && amountDisplay && amountDisplay.style.opacity === '0') {
                // 第一次點擊：只顯示金額，同時執行判斷
                amountDisplay.style.opacity = '1';
            }

            // 設置處理標誌
            this.state.gameState.isProcessingChange = true;

            Game.Debug.log('payment', `選擇選項 ${optionIndex + 1}: ${changeAmount}元, 正確: ${isCorrect}`);

            // 移除所有選項的選中狀態
            document.querySelectorAll('.change-option').forEach(option => {
                option.classList.remove('selected', 'correct-selected', 'incorrect-selected', 'clicked');
            });

            // 添加 clicked class
            selectedOption.classList.add('clicked');

            // Phase 2：遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                if (isCorrect) {
                    // 正確答案
                    selectedOption.classList.remove('clicked');
                    selectedOption.classList.add('correct-selected');

                    // 顯示 ✓ 反饋（與 ✗ 結構一致）
                    const correctOverlay = document.createElement('div');
                    correctOverlay.className = 'correct-answer-overlay';
                    correctOverlay.innerHTML = `<div class="correct-mark">✓</div>`;
                    selectedOption.appendChild(correctOverlay);

                    // 播放成功音效和煙火動畫
                    this.playSound('correct');
                    this.startFireworksAnimation();

                    // 播放語音並等待完成後進入下一頁面
                    const changeAmount = this.state.gameState.currentTransaction.changeExpected;
                    this.TimerManager.setTimeout(() => {
                        this.Speech.speak(`正確，應該找你${changeAmount}元`, () => {
                            Game.Debug.log('flow', '✅ 找零正確，進入車票展示');
                            // 清除選項記錄並重置找零錯誤計數
                            this.state.gameState.currentChangeOptions = null;
                            this.state.gameState.changeErrorCount = 0;
                            this.state.gameState.isProcessingChange = false;
                            this.SceneManager.switchScene('ticketResult', this);
                        });
                    }, 500, 'speech');
                } else {
                    // 錯誤答案
                    selectedOption.classList.remove('clicked');
                    selectedOption.classList.add('incorrect-selected');

                    // 播放錯誤音效
                    this.playSound('error');

                    if (difficulty === 'hard') {
                        // 困難模式：立即顯示錯誤反饋，1秒後自動消失
                        const wrongOverlay = document.createElement('div');
                        wrongOverlay.className = 'wrong-answer-overlay';
                        wrongOverlay.innerHTML = `
                            <div class="wrong-mark">✗</div>
                        `;
                        selectedOption.appendChild(wrongOverlay);

                        this.TimerManager.setTimeout(() => {
                            this.Speech.speak('不對，請再試一次');

                            // 1秒後移除錯誤標記和樣式，重置金額隱藏
                            this.TimerManager.setTimeout(() => {
                                wrongOverlay.remove();
                                if (amountDisplay) {
                                    amountDisplay.style.opacity = '0';
                                }
                                selectedOption.classList.remove('incorrect-selected');
                                this.state.gameState.isProcessingChange = false;
                            }, 1000, 'feedback');
                        }, 300, 'speech');
                    } else {
                        // 普通模式：累計找零錯誤次數，3次後高亮正確答案
                        this.state.gameState.changeErrorCount++;
                        Game.Debug.log('hint', `[Train] 找零錯誤次數: ${this.state.gameState.changeErrorCount}`);

                        if (this.state.gameState.changeErrorCount >= 3) {
                            this.showChangeCheckHint();
                        }

                        // 顯示 ✗ 反饋（與困難模式一致）
                        const wrongOverlay = document.createElement('div');
                        wrongOverlay.className = 'wrong-answer-overlay';
                        wrongOverlay.innerHTML = `<div class="wrong-mark">✗</div>`;
                        selectedOption.appendChild(wrongOverlay);

                        this.TimerManager.setTimeout(() => {
                            this.Speech.speak('不對，請再試一次');
                            this.TimerManager.setTimeout(() => {
                                wrongOverlay.remove();
                                // 重新渲染，但保持選項不變
                                this.state.gameState.isProcessingChange = false;
                                this.renderChangeVerificationUI();
                                // 重新渲染後重新套用綠色勾勾
                                if (this.state.gameState.changeErrorCount >= 3) {
                                    this.TimerManager.setTimeout(() => {
                                        this.showChangeCheckHint();
                                    }, 100, 'hint');
                                }
                            }, 1000, 'feedback');
                        }, 300, 'speech');
                    }
                }
            }, 300, 'feedback');
        },

        // 在正確找零選項上方顯示綠色勾勾提示
        showChangeCheckHint() {
            // 添加動畫樣式
            if (!document.getElementById('a6-change-hint-style')) {
                const hintStyle = document.createElement('style');
                hintStyle.id = 'a6-change-hint-style';
                hintStyle.textContent = `
                    @keyframes checkBounce {
                        0% { opacity: 0; transform: translateX(-50%) scale(0); }
                        60% { opacity: 1; transform: translateX(-50%) scale(1.3); }
                        100% { opacity: 1; transform: translateX(-50%) scale(1); }
                    }
                `;
                document.head.appendChild(hintStyle);
            }
            document.querySelectorAll('.change-option').forEach(opt => {
                if (opt.getAttribute('data-is-correct') === 'true') {
                    // 避免重複添加
                    if (opt.querySelector('.change-hint-check')) return;
                    opt.style.position = 'relative';
                    const checkMark = document.createElement('div');
                    checkMark.className = 'change-hint-check';
                    checkMark.innerHTML = '✔';
                    checkMark.style.cssText = `
                        position: absolute;
                        top: -38px;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 36px;
                        color: #4caf50;
                        z-index: 10;
                        animation: checkBounce 0.5s ease forwards;
                        filter: drop-shadow(0 2px 4px rgba(76, 175, 80, 0.5));
                    `;
                    opt.appendChild(checkMark);
                }
            });
            // 語音提示（Phase 2：遷移至 TimerManager）
            this.TimerManager.setTimeout(() => {
                this.Speech.speak('提示，請看綠色勾勾的選項');
            }, 500, 'speech');
        },

        // 添加找零選項CSS樣式
        addChangeOptionsStyles() {
            if (!document.getElementById('a6-change-options-styles')) {
                const style = document.createElement('style');
                style.id = 'a6-change-options-styles';
                style.textContent = `
                    /* 找零題目區域 */
                    .change-question-area {
                        background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
                        border-radius: 20px;
                        padding: 25px;
                        text-align: center;
                        box-shadow: 0 8px 25px rgba(25, 118, 210, 0.4);
                        margin-bottom: 20px;
                        width: 100%;
                        max-width: 600px;
                    }

                    .change-title {
                        color: white;
                        font-size: 20px;
                        font-weight: 600;
                        margin-bottom: 12px;
                    }

                    .change-amount-highlight {
                        background: rgba(255, 255, 255, 0.25);
                        backdrop-filter: blur(10px);
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        border-radius: 15px;
                        padding: 15px 30px;
                        color: white;
                        font-size: 32px;
                        font-weight: bold;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    }

                    /* 找零選項區域 - 獨立滿版水平排列 */
                    .change-options-area {
                        width: 100%;
                        max-width: 1200px;
                        margin: 20px auto;
                        padding: 30px 40px;
                        background: transparent;
                    }

                    .change-options {
                        display: flex;
                        gap: 40px;
                        justify-content: center;
                        flex-wrap: wrap;
                        align-items: stretch;
                    }

                    .change-option {
                        background: var(--background-primary, #fff);
                        border: 4px solid #e0e0e0;
                        border-radius: 20px;
                        padding: 30px 25px;
                        min-width: 280px;
                        flex: 1;
                        max-width: none;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }

                    .change-option:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                        border-color: #667eea;
                    }

                    .option-money-display {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 8px;
                        min-height: 80px;
                        align-items: center;
                    }

                    .money-item-option {
                        display: inline-block;
                    }

                    .no-change-display {
                        font-size: 18px;
                        font-weight: bold;
                        color: #666;
                        padding: 20px;
                    }

                    .option-amount-display {
                        background: linear-gradient(135deg, #1976d2, #1565c0);
                        color: white;
                        border-radius: 15px;
                        padding: 15px 25px;
                        margin-top: 20px;
                        box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3);
                        display: none;
                        opacity: 0;
                        transform: translateY(20px);
                        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        text-align: center;
                        width: 100%;
                        align-self: center;
                    }

                    .amount-value {
                        font-size: 24px;
                        font-weight: bold;
                        display: block;
                    }

                    /* 🔧 普通/困難模式：點擊後才顯示金額 */
                    .normal-hard-change-mode .change-option.clicked .option-amount-display,
                    .normal-hard-change-mode .change-option.correct-selected .option-amount-display,
                    .normal-hard-change-mode .change-option.incorrect-selected .option-amount-display {
                        display: block;
                        opacity: 1;
                        transform: translateY(0);
                    }

                    /* 正確選項 */
                    .change-option.correct-selected {
                        border-color: #4caf50;
                        background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
                        animation: correctPulse 0.5s ease;
                    }

                    /* 錯誤選項 */
                    .change-option.incorrect-selected {
                        border-color: #f44336;
                        background: linear-gradient(135deg, #ffebee, #ffcdd2);
                        animation: incorrectShake 0.5s ease;
                    }

                    @keyframes correctPulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }

                    @keyframes incorrectShake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-10px); }
                        75% { transform: translateX(10px); }
                    }

                    /* 正確答案疊加層 */
                    .correct-answer-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(76, 175, 80, 0.15);
                        border-radius: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10;
                        animation: fadeIn 0.3s ease;
                    }

                    .correct-mark {
                        width: 80px;
                        height: 80px;
                        background: rgba(76, 175, 80, 0.9);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 48px;
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.5);
                        animation: correctMarkAppear 0.4s ease;
                    }

                    @keyframes correctMarkAppear {
                        0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                        60% { transform: scale(1.1) rotate(0deg); opacity: 1; }
                        100% { transform: scale(1) rotate(0deg); opacity: 1; }
                    }

                    /* 錯誤答案疊加層 */
                    .wrong-answer-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(244, 67, 54, 0.15);
                        border-radius: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10;
                        animation: fadeIn 0.3s ease;
                    }

                    .wrong-mark {
                        width: 80px;
                        height: 80px;
                        background: rgba(244, 67, 54, 0.9);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 48px;
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(244, 67, 54, 0.5);
                        animation: wrongMarkAppear 0.4s ease;
                    }

                    @keyframes wrongMarkAppear {
                        0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                        60% { transform: scale(1.1) rotate(0deg); opacity: 1; }
                        100% { transform: scale(1) rotate(0deg); opacity: 1; }
                    }

                    /* 確保選項有relative定位以容納絕對定位的疊加層 */
                    .change-option {
                        position: relative;
                    }
                `;
                document.head.appendChild(style);
            }
        },

        // 渲染車票展示UI
        renderTicketResultUI() {
            const app = document.getElementById('app');
            const process = this.state.gameState.ticketProcess;
            const info = process.trainInfo;
            const startName = this.getStationName(process.startStation);
            const endName = this.getStationName(process.endStation);
            const trainTypeName = this.getTrainTypeName(process.trainType);
            const npcText = `這是您的車票，祝您旅途愉快！`;

            app.innerHTML = `
                <div class="store-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">🚂</span>
                        </div>
                        <div class="title-bar-center">
                            <h1>第七步：拿取車票</h1>
                        </div>
                        <div class="title-bar-right">
                            <span class="quiz-progress-info">第 ${this.state.quiz.currentQuestion + 1} / ${this.state.settings.questionCount} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>

                    <div class="ticket-window-combined">
                        <div class="clerk-section">
                            <div class="npc-character">
                                <img src="../images/a6/train_clerk.png" alt="火車站售票員" style="width: 100%; height: 100%; object-fit: contain;">
                            </div>
                        </div>
                        <div class="right-section">
                            <div class="npc-dialogue-box">
                                <p class="npc-dialogue-text" id="npc-text">${npcText}</p>
                            </div>
                            <div class="ticket-window-content" style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
                                <h2 style="color: var(--primary-color, #1976d2); margin: 10px 0;">購票成功！</h2>

                                ${this.generateTicketHTML()}

                                <div style="margin-top: 20px;">
                                    ${this.state.quiz.currentQuestion + 1 < this.state.settings.questionCount ? `
                                        <button id="next-question-btn"
                                            style="padding: 15px 40px; background: linear-gradient(135deg, #1976d2, #0d47a1);
                                            color: white; border: none; border-radius: 25px; font-size: 18px;
                                            font-weight: bold; cursor: pointer; margin-right: 15px; transition: all 0.3s ease;">
                                            拿取車票
                                        </button>
                                    ` : `
                                        <button id="finish-btn"
                                            style="padding: 15px 40px; background: linear-gradient(135deg, #4caf50, #388e3c);
                                            color: white; border: none; border-radius: 25px; font-size: 18px;
                                            font-weight: bold; cursor: pointer; transition: all 0.3s ease;">
                                            完成
                                        </button>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 播放語音（列出所有座位）（Phase 2：遷移至 TimerManager）
            this.TimerManager.setTimeout(() => {
                const tickets = process.trainInfo;
                if (tickets.length === 1) {
                    // 單張票
                    this.Speech.speak(this.SpeechConfig.ticketResult.success(tickets[0].seatCar, tickets[0].seatNumber));
                } else {
                    // 多張票：列出所有座位
                    const seatList = tickets.map(t => `${t.seatCar}車${t.seatNumber}號`).join('、');
                    this.Speech.speak(`這是您的車票，座位分別在${seatList}，請確認票面資訊，祝您旅途愉快！`);
                }
            }, 500, 'speech');

            // 綁定事件（Phase 3：遷移至 EventManager）
            const nextBtn = document.getElementById('next-question-btn');
            const finishBtn = document.getElementById('finish-btn');

            if (nextBtn) {
                this.EventManager.on(nextBtn, 'click', () => {
                    // 播放答對音效和煙火動畫
                    this.playSound('correct');
                    this.startFireworksAnimation();

                    // 🆕 更新自訂車站使用次數
                    this.checkAndUpdateCustomStationUsage();

                    // 延遲後進入下一題（等待動畫播放）（Phase 2：遷移至 TimerManager）
                    this.TimerManager.setTimeout(() => {
                        this.state.quiz.currentQuestion++;

                        // 如果是預設模式，生成新的預設題目
                        if (this.state.settings.taskType === 'preset') {
                            this.generatePresetQuestion();
                        }

                        this.initializeWallet();

                        // 🆕 輔助點擊模式：初始化（後續題目）
                        if (this.state.settings.clickMode) {
                            this.ClickMode.initForQuestion();
                        }

                        this.SceneManager.switchScene('ticketWindow', this);
                    }, 1000, 'transition');
                }, {}, 'ticketResult');
            }

            if (finishBtn) {
                this.EventManager.on(finishBtn, 'click', () => {
                    // 播放答對音效
                    this.playSound('correct');
                    // 🆕 更新自訂車站使用次數
                    this.checkAndUpdateCustomStationUsage();
                    this.showCompletionScreen();
                }, {}, 'ticketResult');
            }

            // 🎯 簡單模式：顯示「點這裡」提示動畫
            if (this.state.settings.difficulty === 'easy' &&
                this.state.settings.taskType === 'preset') {
                this.TimerManager.setTimeout(() => {
                    const btnId = nextBtn ? 'next-question-btn' : 'finish-btn';
                    this.highlightConfirmButton(btnId);
                }, 600, 'hint');
            }
        },

        // 生成車票HTML（支援多張車票）
        generateTicketHTML() {
            const process = this.state.gameState.ticketProcess;
            const tickets = process.trainInfo; // 現在是數組
            const startName = this.getStationName(process.startStation);
            const endName = this.getStationName(process.endStation);
            const trainTypeName = this.getTrainTypeName(process.trainType);

            // 1. 準備英文站名對照表 (用於顯示在中文下方)
            const stationEnglishMap = {
                '基隆': 'Keelung', '七堵': 'Qidu', '南港': 'Nangang', '松山': 'Songshan',
                '臺北': 'Taipei', '台北': 'Taipei', '萬華': 'Wanhua', '板橋': 'Banqiao',
                '樹林': 'Shulin', '桃園': 'Taoyuan', '中壢': 'Zhongli', '新竹': 'Hsinchu',
                '竹南': 'Zhunan', '苗栗': 'Miaoli', '豐原': 'Fengyuan', '臺中': 'Taichung', '台中': 'Taichung',
                '彰化': 'Changhua', '員林': 'Yuanlin', '斗六': 'Douliu', '嘉義': 'Chiayi',
                '新營': 'Xinying', '臺南': 'Tainan', '台南': 'Tainan', '岡山': 'Gangshan',
                '新左營': 'Xinzuoying', '高雄': 'Kaohsiung', '屏東': 'Pingtung', '潮州': 'Chaozhou',
                '臺東': 'Taitung', '台東': 'Taitung', '玉里': 'Yuli', '花蓮': 'Hualien',
                '蘇澳新': 'Suaoxin', '宜蘭': 'Yilan', '瑞芳': 'Ruifang'
            };

            // 🆕 優先使用自訂車站的英文名，再查內建對照表
            const startCustom = this.state.customStations.find(s => s.id === process.startStation);
            const endCustom = this.state.customStations.find(s => s.id === process.endStation);
            const startEn = (startCustom && startCustom.en) || stationEnglishMap[startName] || '';
            const endEn = (endCustom && endCustom.en) || stationEnglishMap[endName] || '';

            // 車種英文簡寫 (裝飾用)
            const trainTypeEnMap = {
                '區間車': 'LOCAL TRAIN',
                '莒光號': 'CHU-KUANG',
                '自強號': 'TZE-CHIANG',
                '普悠瑪': 'PUYUMA'
            };
            const trainTypeEn = trainTypeEnMap[trainTypeName] || 'TRAIN';

            let html = '';

            // 為每張票生成車票HTML
            tickets.forEach((ticketInfo, index) => {
                // 2. 格式化日期：2025/12/10 (三) -> 2025.12.10
                const simpleDate = ticketInfo.departureDate.split(' ')[0].replace(/\//g, '.');

                // 3. 計算抵達時間 (模擬：發車時間 + 2小時15分)
                let [depH, depM] = ticketInfo.departureTime.split(':').map(Number);
                let arrH = depH + 2;
                let arrM = depM + 15;
                if (arrM >= 60) { arrH += 1; arrM -= 60; }
                if (arrH >= 24) arrH -= 24;
                const arrivalTime = `${arrH.toString().padStart(2, '0')}:${arrM.toString().padStart(2, '0')}`;

                // QR Code 隨機精靈圖邏輯
                const qrIndex = Math.floor(Math.random() * 10);
                const positionLeft = -(qrIndex * 100);

                html += `
                    <div class="train-ticket real-style appear" style="
                        width: 280px;
                        height: 480px;
                        background-color: #fcfcfc;
                        /* 模擬底紋：使用細微的重複漸層 */
                        background-image: repeating-linear-gradient(45deg, #fbfbfb 25%, transparent 25%, transparent 75%, #fbfbfb 75%, #fbfbfb), repeating-linear-gradient(45deg, #fbfbfb 25%, #f7f7f7 25%, #f7f7f7 75%, #fbfbfb 75%, #fbfbfb);
                        background-position: 0 0, 10px 10px;
                        background-size: 20px 20px;
                        border-radius: 5px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                        margin: 20px auto;
                        padding: 15px 20px;
                        position: relative;
                        font-family: 'Microsoft JhengHei', sans-serif;
                        color: #222;
                        display: flex;
                        flex-direction: column;
                    ">
                        <div style="text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333;">
                            臺鐵公司
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
                            <div style="font-size: 22px; font-family: 'Courier New', monospace; font-weight: bold; letter-spacing: -1px;">
                                ${simpleDate}
                            </div>
                            <div style="font-size: 20px; font-weight: bold;">
                                ${ticketInfo.trainNumber}次
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                            <div style="font-size: 18px; font-weight: bold;">全票</div>
                            <div style="text-align: right;">
                                <div style="font-size: 16px; font-weight: bold;">${trainTypeName}</div>
                                <div style="font-size: 10px; transform: scale(0.9); transform-origin: right top; color: #555;">${trainTypeEn}</div>
                            </div>
                        </div>

                        <div style="display: flex; flex: 1; margin-bottom: 10px;">

                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 10px;">
                                <div style="text-align: center;">
                                    <div style="font-size: 36px; font-weight: 900; line-height: 1;">${startName}</div>
                                    <div style="font-size: 14px; font-family: Arial, sans-serif; margin-top: 2px;">${startEn}</div>
                                </div>

                                <div style="font-size: 18px; margin: 5px 0;">▼</div>

                                <div style="text-align: center;">
                                    <div style="font-size: 36px; font-weight: 900; line-height: 1;">${endName}</div>
                                    <div style="font-size: 14px; font-family: Arial, sans-serif; margin-top: 2px;">${endEn}</div>
                                </div>
                            </div>

                            <div style="flex: 1; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-start; padding-top: 15px;">

                                <div style="text-align: right; margin-bottom: 15px;">
                                    <div style="font-size: 24px; font-weight: bold; font-family: 'Courier New', monospace;">${ticketInfo.departureTime}<span style="font-size: 16px; font-family: 'Microsoft JhengHei';">開</span></div>
                                    <div style="font-size: 10px; color: #666; text-transform: uppercase;">DEPARTURE</div>
                                </div>

                                <div style="text-align: right; margin-bottom: 15px;">
                                    <div style="font-size: 24px; font-weight: bold; font-family: 'Courier New', monospace;">${ticketInfo.seatCar}<span style="font-size: 16px; font-family: 'Microsoft JhengHei';">車</span>${ticketInfo.seatNumber}<span style="font-size: 16px; font-family: 'Microsoft JhengHei';">號</span></div>
                                    <div style="font-size: 10px; color: #666; text-transform: uppercase;">CAR.${ticketInfo.seatCar} SEAT.${ticketInfo.seatNumber}</div>
                                </div>

                                <div style="text-align: right;">
                                    <div style="font-size: 24px; font-weight: bold; font-family: 'Courier New', monospace;">${arrivalTime}<span style="font-size: 16px; font-family: 'Microsoft JhengHei';">到</span></div>
                                    <div style="font-size: 10px; color: #666; text-transform: uppercase;">ARRIVAL</div>
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; padding-top: 10px;">
                            <div style="text-align: left;">
                                <div style="
                                    width: 85px;
                                    height: 85px;
                                    overflow: hidden;
                                    position: relative;
                                    background: white;
                                ">
                                    <img src="../images/a6/qr_codes.png"
                                         alt="QR Code"
                                         style="
                                            position: absolute;
                                            top: 0;
                                            left: ${positionLeft}%;
                                            height: 100%;
                                            width: 1000%;
                                            max-width: none;
                                            object-fit: fill;
                                         ">
                                </div>
                            </div>

                            <div style="text-align: right;">
                                <div style="font-size: 32px; font-weight: bold; color: #222;">NT${process.unitPrice}</div>
                                <div style="font-size: 14px; font-weight: bold; margin-top: 5px;">限當日當次車有效</div>
                            </div>
                        </div>

                        <div style="
                            position: absolute;
                            top: 50%; left: 50%;
                            transform: translate(-50%, -50%);
                            width: 200px; height: 200px;
                            border: 10px solid rgba(200, 200, 200, 0.1);
                            border-radius: 50%;
                            pointer-events: none;
                            z-index: 0;
                        "></div>
                        <div style="
                            position: absolute;
                            top: 50%; left: 50%;
                            transform: translate(-50%, -50%) rotate(45deg);
                            width: 140px; height: 140px;
                            border: 10px solid rgba(200, 200, 200, 0.1);
                            pointer-events: none;
                            z-index: 0;
                        "></div>
                    </div>
                `;
            });

            return html;
        },

        // 顯示完成畫面
        showCompletionScreen() {
            if (this._completionScreenShown) return;
            this._completionScreenShown = true;
            if (window.TutorContext) TutorContext.update({ screen: 'result' });
            // 停用輔助點擊模式（完成畫面不需要輔助）
            const gs = this.state.gameState;
            document.getElementById('click-exec-overlay')?.remove();
            if (gs.clickModeState) {
                Game.Debug.log('assist', '[ClickMode] 進入完成畫面，停用輔助點擊模式');
                gs.clickModeState.enabled = false;
                gs.clickModeState.waitingForClick = false;
                gs.clickModeState.waitingForStart = false;
            }

            const app = document.getElementById('app');
            const completedCount = this.state.settings.questionCount;

            // 計算完成時間
            const endTime = Date.now();
            const startTime = this.state.quiz.startTime || endTime;
            const elapsedSeconds = Math.floor((endTime - startTime) / 1000);

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'a6', unitName: 'A6 火車購票', series: 'A',
                score: completedCount, total: completedCount,
                difficulty: this.state.settings?.difficulty, durationSec: elapsedSeconds });
            const minutes = Math.floor(elapsedSeconds / 60);
            const seconds = elapsedSeconds % 60;
            const timeDisplay = minutes > 0 ? `${minutes} 分 ${seconds} 秒` : `${seconds} 秒`;

            app.innerHTML = `
                <div class="results-wrapper">
                    <div class="results-screen">
                        <div class="results-header">
                            <div class="trophy-icon">🏆</div>
                            <div class="results-title-row">
                                <img src="../images/common/hint_detective.png" class="results-mascot-img" alt="金錢小助手">
                                <h1 class="results-title">🎉 完成挑戰 🎉</h1>
                                <span class="results-mascot-spacer"></span>
                            </div>
                        </div>

                        <div class="reward-btn-container">
                            <a href="#" id="endgame-reward-link" class="reward-btn-link">
                                🎁 開啟獎勵系統
                            </a>
                        </div>

                        <div class="results-container">
                            <div class="results-grid">
                                <div class="result-card">
                                    <div class="result-icon">✅</div>
                                    <div class="result-label">完成題數</div>
                                    <div class="result-value">${completedCount} 題</div>
                                </div>
                                <div class="result-card">
                                    <div class="result-icon">⏱️</div>
                                    <div class="result-label">完成時間</div>
                                    <div class="result-value">${timeDisplay}</div>
                                </div>
                            </div>

                            <!-- 表現評價 -->
                            <div class="performance-section">
                                <h3>📊 表現評價</h3>
                                ${this.getPerformanceByCount(completedCount)}
                            </div>

                            <!-- 學習成果描述 -->
                            <div class="learning-achievements">
                                <h3>🏆 學習成果</h3>
                                <div class="achievement-list">
                                    <div class="achievement-item">🎯 完成火車購票流程學習</div>
                                    <div class="achievement-item">🚂 學會選擇路線和票種</div>
                                    <div class="achievement-item">💳 掌握付款和取票流程</div>
                                </div>
                            </div>

                            <div class="result-buttons">
                                <button class="play-again-btn" onclick="Game.startGame()">
                                    <span class="btn-icon">🔄</span>
                                    <span class="btn-text">再玩一次</span>
                                </button>
                                <button class="main-menu-btn" onclick="Game.renderSettingsUI()">
                                    <span class="btn-icon">⚙️</span>
                                    <span class="btn-text">返回設定</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    .results-wrapper {
                        display: flex;
                        justify-content: center;
                        align-items: flex-start;
                        min-height: 100vh;
                        padding: 20px;
                        box-sizing: border-box;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        overflow-y: auto;
                    }

                    @keyframes celebrate {
                        0% { transform: scale(0.8) rotate(-10deg); opacity: 0; }
                        50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
                        100% { transform: scale(1) rotate(0deg); opacity: 1; }
                    }

                    @keyframes bounce {
                        0%, 20%, 60%, 100% { transform: translateY(0); }
                        40% { transform: translateY(-20px); }
                        80% { transform: translateY(-10px); }
                    }

                    .results-screen {
                        position: relative;
                        text-align: center;
                        padding: 40px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 20px;
                        width: 100%;
                        max-width: 700px;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                        animation: celebrate 1s ease-out, fadeIn 1s ease-out;
                        overflow: hidden;
                    }

                    .results-screen::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="stars" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.3)"/></pattern></defs><rect width="100" height="100" fill="url(%23stars)"/></svg>');
                        opacity: 0.3;
                        pointer-events: none;
                    }

                    .results-header {
                        position: relative;
                        z-index: 2;
                        margin-bottom: 30px;
                    }

                    .trophy-icon {
                        font-size: 4em;
                        margin-bottom: 10px;
                        animation: bounce 2s infinite;
                    }

                    .results-title {
                        font-size: 2.5em;
                        color: #fff;
                        margin: 20px 0;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                        font-weight: bold;
                    }

                    .reward-btn-container {
                        position: relative;
                        z-index: 2;
                        text-align: center;
                        margin-top: 15px;
                        margin-bottom: 10px;
                    }

                    .reward-btn-link {
                        display: inline-block;
                        text-decoration: none;
                        padding: 12px 30px;
                        background: linear-gradient(135deg, #ff6b9d, #e91e63);
                        color: white;
                        font-weight: bold;
                        font-size: 1.1em;
                        border-radius: 25px;
                        box-shadow: 0 4px 15px rgba(233, 30, 99, 0.4);
                        transition: all 0.3s ease;
                    }

                    .reward-btn-link:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(233, 30, 99, 0.5);
                    }

                    .results-container {
                        position: relative;
                        z-index: 2;
                        background: rgba(255,255,255,0.95);
                        padding: 30px;
                        border-radius: 15px;
                        margin-top: 20px;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    }

                    .results-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 20px;
                        margin-bottom: 25px;
                    }

                    .result-card {
                        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                        padding: 20px;
                        border-radius: 12px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                        transition: transform 0.3s ease;
                        border: 2px solid transparent;
                    }

                    .result-card:hover {
                        transform: translateY(-5px);
                        border-color: #3498db;
                    }

                    .result-icon { font-size: 2em; margin-bottom: 10px; }
                    .result-label { font-size: 1em; color: #6c757d; margin-bottom: 8px; }
                    .result-value { font-size: 1.6em; font-weight: bold; color: #2c3e50; }

                    .learning-achievements {
                        background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
                        padding: 20px;
                        border-radius: 12px;
                        margin-bottom: 20px;
                        text-align: left;
                    }

                    .learning-achievements h3 {
                        color: #2e7d32;
                        margin: 0 0 15px 0;
                        font-size: 1.2em;
                    }

                    .achievement-list {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .achievement-item {
                        font-size: 1em;
                        color: #1b5e20;
                        padding: 8px 12px;
                        background: rgba(255,255,255,0.7);
                        border-radius: 8px;
                    }

                    .performance-section {
                        background: #ffffff;
                        border: 1px solid #e0e0e0;
                        padding: 20px;
                        border-radius: 12px;
                        margin-bottom: 25px;
                        text-align: center;
                    }

                    .performance-section h3 {
                        color: #333333;
                        margin: 0 0 15px 0;
                        font-size: 1.2em;
                    }

                    .performance-badge {
                        display: inline-block;
                        background: linear-gradient(45deg, #f39c12, #e67e22);
                        color: white;
                        padding: 12px 30px;
                        border-radius: 25px;
                        font-size: 1.3em;
                        font-weight: bold;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                        box-shadow: 0 4px 15px rgba(243,156,18,0.4);
                        margin: 10px 0;
                    }

                    .result-buttons {
                        display: flex;
                        gap: 20px;
                        justify-content: center;
                        flex-wrap: wrap;
                    }

                    .play-again-btn, .main-menu-btn {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 15px 30px;
                        border: none;
                        border-radius: 10px;
                        font-size: 1.1em;
                        font-weight: bold;
                        cursor: pointer;
                        min-width: 160px;
                        justify-content: center;
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                    }

                    .play-again-btn {
                        background: linear-gradient(135deg, #27ae60, #2ecc71);
                        color: white;
                    }

                    .play-again-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
                    }

                    .main-menu-btn {
                        background: linear-gradient(135deg, #8e44ad, #9b59b6);
                        color: white;
                    }

                    .main-menu-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(142, 68, 173, 0.4);
                    }
                </style>
            `;

            // 🎁 獎勵系統連結事件（Phase 3：遷移至 EventManager）
            const endgameRewardLink = document.getElementById('endgame-reward-link');
            if (endgameRewardLink) {
                this.EventManager.on(endgameRewardLink, 'click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                }, {}, 'completion');
            }

            // 播放成功音效和煙火（Phase 2：遷移至 TimerManager）
            this.TimerManager.setTimeout(() => {
                document.getElementById('success-sound')?.play();
                if (typeof confetti === 'function') {
                    const duration = 3 * 1000;
                    const animationEnd = Date.now() + duration;
                    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1001 };
                    const randomInRange = (min, max) => Math.random() * (max - min) + min;

                    const fireConfetti = () => {
                        const timeLeft = animationEnd - Date.now();
                        if (timeLeft <= 0) return;
                        const particleCount = 50 * (timeLeft / duration);
                        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                        this.TimerManager.setTimeout(fireConfetti, 250, 'confetti');
                    };
                    fireConfetti();
                }
            }, 100, 'animation');
        },

        // 根據完成題數取得表現評價
        getPerformanceByCount(count) {
            let icon, msg;
            if (count >= 8)      { icon = '🏆'; msg = `完成了 ${count} 題，做得很棒，表現優異！`; }
            else if (count >= 6) { icon = '👍'; msg = `完成了 ${count} 題，做得不錯，表現良好！`; }
            else if (count >= 3) { icon = '💪'; msg = `完成了 ${count} 題，再努力一點，加油！`; }
            else                 { icon = '📚'; msg = `完成了 ${count} 題，多多練習，你可以的！`; }
            return `<div class="performance-badge">${icon} ${msg}</div>`;
        },

        // =====================================================
        // 錯誤反饋功能
        // =====================================================

        // 🎯 顯示錯誤反饋（紅色X動畫）
        showErrorFeedback(element, message = '') {
            // 添加錯誤動畫class
            element.classList.add('show-error-x');

            // 如果有訊息，在元素下方顯示
            if (message) {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message-popup';
                errorMsg.textContent = message;
                errorMsg.style.cssText = `
                    position: absolute;
                    top: calc(100% + 10px);
                    left: 50%;
                    transform: translateX(-50%);
                    background: #d32f2f;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: bold;
                    white-space: nowrap;
                    z-index: 10000;
                    box-shadow: 0 4px 12px rgba(211, 47, 47, 0.4);
                    animation: errorMessageAppear 0.3s ease-out;
                `;

                // 確保父元素有相對定位
                const parent = element.parentElement;
                const originalPosition = parent.style.position;
                if (!originalPosition || originalPosition === 'static') {
                    parent.style.position = 'relative';
                }

                parent.appendChild(errorMsg);

                // 1.5秒後移除訊息和動畫（Phase 2：遷移至 TimerManager）
                this.TimerManager.setTimeout(() => {
                    element.classList.remove('show-error-x');
                    if (errorMsg.parentElement) {
                        errorMsg.remove();
                    }
                }, 1500, 'feedback');
            } else {
                // 沒有訊息，只顯示動畫（Phase 2：遷移至 TimerManager）
                this.TimerManager.setTimeout(() => {
                    element.classList.remove('show-error-x');
                }, 1500, 'feedback');
            }
        },

        // 播放音效
        playSound(soundName) {
            try {
                Game.Debug.log('audio', '🔊 播放音效:', soundName);

                if (soundName === 'correct') {
                    // 播放正確音效
                    if (this.successSound) {
                        this.successSound.currentTime = 0;
                        this.successSound.play().catch(err => {
                            Game.Debug.warn('sound', '⚠️ 正確音效播放失敗:', err);
                        });
                    } else {
                        // 如果音效對象不存在，創建新的
                        const correctSound = new Audio('../audio/units/correct02.mp3');
                        correctSound.volume = 0.5;
                        correctSound.play().catch(err => {
                            Game.Debug.warn('sound', '⚠️ 正確音效播放失敗:', err);
                        });
                    }
                } else if (soundName === 'error') {
                    // 播放錯誤音效
                    if (this.errorSound) {
                        this.errorSound.currentTime = 0;
                        this.errorSound.play().catch(err => {
                            Game.Debug.warn('sound', '⚠️ 錯誤音效播放失敗:', err);
                        });
                    } else {
                        // 如果音效對象不存在，創建新的
                        const errorSound = new Audio('../audio/units/error.mp3');
                        errorSound.volume = 0.5;
                        errorSound.play().catch(err => {
                            Game.Debug.warn('sound', '⚠️ 錯誤音效播放失敗:', err);
                        });
                    }
                } else if (soundName === 'click') {
                    const clickSound = new Audio('../audio/units/click.mp3');
                    clickSound.volume = 0.5;
                    clickSound.play().catch(err => {
                        Game.Debug.warn('sound', '⚠️ 點擊音效播放失敗:', err);
                    });
                } else if (soundName === 'keypad') {
                    const keypadSound = new Audio('../audio/units/keypad.mp3');
                    keypadSound.volume = 0.7;
                    keypadSound.play().catch(err => {
                        Game.Debug.warn('sound', '⚠️ 按鍵音效播放失敗:', err);
                    });
                }
            } catch (error) {
                Game.Debug.warn('sound', '⚠️ 播放音效時發生錯誤:', error);
            }
        },

        // 播放答對音效（correct02.mp3）
        playCorrectSound() {
            try {
                const correctSound = new Audio('../audio/units/correct02.mp3');
                correctSound.volume = 0.5;
                correctSound.play().catch(err => {
                    Game.Debug.warn('sound', '⚠️ 答對音效播放失敗:', err);
                });
            } catch (error) {
                Game.Debug.warn('sound', '⚠️ 播放答對音效時發生錯誤:', error);
            }
        },

        // 播放錯誤音效（error.mp3）
        playErrorSound() {
            try {
                const errorSound = new Audio('../audio/units/error.mp3');
                errorSound.volume = 0.5;
                errorSound.play().catch(err => {
                    Game.Debug.warn('sound', '⚠️ 錯誤音效播放失敗:', err);
                });
            } catch (error) {
                Game.Debug.warn('sound', '⚠️ 播放錯誤音效時發生錯誤:', error);
            }
        },

        // 播放煙火動畫
        playFireworks() {
            this.startFireworksAnimation();
        },

        // =====================================================
        // 🆕 自訂車站管理方法
        // =====================================================

        // 從 localStorage 載入自訂車站
        loadCustomStations() {
            try {
                const saved = localStorage.getItem('a6_customStations');
                if (saved) {
                    this.state.customStations = JSON.parse(saved);
                    Game.Debug.log('state', '🚉 [自訂車站] 載入成功:', this.state.customStations);
                }
            } catch (error) {
                Game.Debug.error('❌ [自訂車站] 載入失敗:', error);
                this.state.customStations = [];
            }
        },

        // 儲存自訂車站到 localStorage
        saveCustomStations() {
            try {
                localStorage.setItem('a6_customStations', JSON.stringify(this.state.customStations));
                Game.Debug.log('state', '💾 [自訂車站] 儲存成功:', this.state.customStations);
            } catch (error) {
                Game.Debug.error('❌ [自訂車站] 儲存失敗:', error);
            }
        },

        // 新增自訂車站
        addCustomStation(name, region) {
            // 檢查上限
            if (this.state.customStations.length >= this.MAX_CUSTOM_STATIONS) {
                Game.Debug.warn('state', '⚠️ [自訂車站] 已達上限 6 個');
                return false;
            }

            // 檢查名稱是否重複（與現有站或自訂站）
            if (this.isStationNameDuplicate(name)) {
                Game.Debug.warn('state', '⚠️ [自訂車站] 名稱重複:', name);
                return false;
            }

            // 建立新車站
            const newStation = {
                id: `custom_${Date.now()}`,
                name: name,
                displayName: name,
                region: region,
                proxyStationId: this.PROXY_STATIONS[region],
                isCustom: true,
                en: this._selectedStationEn || ''
            };

            this.state.customStations.push(newStation);
            this.saveCustomStations();
            Game.Debug.log('state', '✅ [自訂車站] 新增成功:', newStation);
            return true;
        },

        // 刪除自訂車站
        deleteCustomStation(stationId) {
            const index = this.state.customStations.findIndex(s => s.id === stationId);
            if (index !== -1) {
                const removed = this.state.customStations.splice(index, 1)[0];
                this.saveCustomStations();
                Game.Debug.log('state', '🗑️ [自訂車站] 刪除成功:', removed);
                return true;
            }
            return false;
        },

        // 🆕 檢查自訂車站使用情況（僅記錄，不自動消除）
        checkAndUpdateCustomStationUsage() {
            const process = this.state.gameState.ticketProcess;
            if (!process) return;

            const startStation = process.startStation;
            const endStation = process.endStation;

            const startCustom = this.state.customStations.find(s => s.id === startStation);
            if (startCustom) {
                Game.Debug.log('state', `📊 [自訂車站] 出發站使用自訂: ${startCustom.name}`);
            }

            const endCustom = this.state.customStations.find(s => s.id === endStation);
            if (endCustom && endCustom.id !== startStation) {
                Game.Debug.log('state', `📊 [自訂車站] 到達站使用自訂: ${endCustom.name}`);
            }
        },

        // 🆕 清除所有自訂車站
        clearAllCustomStations() {
            if (this.state.customStations.length === 0) {
                Game.Debug.log('state', 'ℹ️ [自訂車站] 沒有自訂車站需要清除');
                return;
            }

            const count = this.state.customStations.length;
            this.state.customStations = [];
            this.saveCustomStations();
            this.renderSettingsUI();
            Game.Debug.log('state', `🗑️ [自訂車站] 已清除所有自訂車站 (${count} 個)`);
        },

        // 檢查車站名稱是否重複
        isStationNameDuplicate(name) {
            // 檢查現有站
            const regions = this.storeData.StationData.regions;
            for (const regionKey in regions) {
                if (regions[regionKey].some(s => s.name === name || s.displayName === name)) {
                    return true;
                }
            }
            // 檢查自訂站
            if (this.state.customStations.some(s => s.name === name)) {
                return true;
            }
            return false;
        },

        // 🆕 檢查車站名稱是否在內建車站資料中
        isStationInBuiltInData(name) {
            const normalizeForSearch = (text) => text.replace(/臺/g, '台').replace(/台/g, '臺');
            const regions = this.storeData.StationData.regions;
            for (const regionKey in regions) {
                if (regions[regionKey].some(s => s.name === name || s.displayName === name ||
                    normalizeForSearch(s.name) === normalizeForSearch(name))) {
                    return true;
                }
            }
            return false;
        },

        // 解析車站 ID（自訂站返回代理站 ID，用於票價查詢）
        resolveStationId(stationId) {
            const customStation = this.state.customStations.find(s => s.id === stationId);
            if (customStation) {
                Game.Debug.log('state', `🔄 [代理站] ${customStation.name} → ${customStation.proxyStationId}`);
                return customStation.proxyStationId;
            }
            return stationId;
        },

        // 取得代理站的中文名稱
        getProxyStationName(region) {
            const proxyId = this.PROXY_STATIONS[region];
            return this.getStationName(proxyId);
        },

        // =====================================================
        // 初始化方法
        // =====================================================
        async init() {
            Game.Debug.log('init', '🚀 [A6] 初始化遊戲');

            // [Phase 2] 清除殘留計時器和監聯器
            this.TimerManager.clearAll();
            this.EventManager.removeAll();

            // 🎬 注入全局動畫樣式（避免 HTML 內嵌重複定義）
            this.injectGlobalAnimationStyles();

            // 🆕 載入自訂車站
            this.loadCustomStations();

            // 初始化音效
            this.audio.init();

            // 初始化語音
            this.Speech.init();

            // 解鎖音頻（手機端）
            document.addEventListener('click', async () => {
                if (!this.state.audioUnlocked) {
                    await this.unlockAudio();
                }
            }, { once: true });

            // 渲染設定頁面
            this.renderSettingsUI();
        },

        // 返回主畫面
        backToMainMenu() {
            // 返回到單元選擇畫面
            window.location.href = '../index.html#part4';
        },

        async unlockAudio() {
            if (this.state.audioUnlocked) {
                return true;
            }

            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const buffer = audioContext.createBuffer(1, 1, 22050);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);

                const testAudio = new Audio();
                testAudio.volume = 0;
                testAudio.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAACAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

                await testAudio.play();
                testAudio.pause();
                testAudio.currentTime = 0;

                this.state.audioUnlocked = true;
                Game.Debug.log('audio', '🔓 音頻權限解鎖成功');

                return true;
            } catch (error) {
                console.log('⚠️ 音頻解鎖失敗，但繼續執行', error);
                this.state.audioUnlocked = true;
                return false;
            }
        }
    };

    // =====================================================
    // 啟動遊戲
    // =====================================================
    // 將 Game 設為全域變數，以便 HTML 中的 onclick 可以存取
    window.Game = Game;

    Game.init();
});
