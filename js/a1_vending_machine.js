// A1 - 自動販賣機測驗程式
// 完整重構版本 - 參考 A1 架構
//
// ========================================
// 配置驅動架構說明
// ========================================
// 本程式採用配置驅動設計，主要配置區域：
//
// 1. BEVERAGE_DATABASE            (第27行)   - 飲料資料庫（19種飲料）
// 2. DIFFICULTY_PAYMENT_RULES     (第66行)   - 難度付款規則配置
// 3. EASY_MODE_FLOW               (第89行)   - 簡單模式流程配置
// 4. UI_TEXT                      (第152行)  - UI文字與語音模板
// 5. VendingMachine.audio         (第223行)  - 音效檔案集中定義
// 6. VendingMachine.state         (第198行)  - 狀態管理（設定+遊戲狀態）
//
// 【難度模式說明】
// - 簡單模式：自動提示每個步驟、錢包金額=商品價格、不允許找零
// - 普通模式：錯誤3次後提示、允許多付找零、任何子集合夠付時不能再加其他硬幣
// - 困難模式：需手動點提示、允許多付但不能有不必要的多付（子集合剛好等於價格）
//
// 【付款規則配置說明】
// 修改 DIFFICULTY_PAYMENT_RULES 即可調整各難度的付款驗證邏輯
// - allowOverpayment: 是否允許付款金額 > 商品價格
// - checkUnnecessaryOverpayment: 是否檢查不必要的多付
// - overpaymentCheckMode:
//   * 'single' - 單個硬幣檢查：任何單個硬幣 >= 價格
//   * 'subset-enough' - 子集合足夠檢查（普通模式）：任何子集合 >= 價格
//   * 'subset' - 子集合剛好檢查（困難模式）：任何子集合 = 價格
// - allowChange: 是否允許找零
// - maxErrorsBeforeHint: 錯誤幾次後顯示提示 (Infinity = 永不自動提示)
//
// 普通/困難模式流程說明見第2251行
// ========================================

(function() {
    'use strict';

    // ========================================
    // 配置區域 1：飲料資料庫
    // ========================================
    // 新增飲料：在此處添加飲料物件即可
    // 格式：id, name, basePrice, image
    const BEVERAGE_DATABASE = {
        'premium_roasted_coffee': { id: 'premium_roasted_coffee', name: '極品炭焙咖啡', basePrice: 35, image: '../images/a1/icon-a01-premium-roasted-coffee.png' },
        'kyoho_grape_juice': { id: 'kyoho_grape_juice', name: '巨峰葡萄汁', basePrice: 35, image: '../images/a1/icon-a02-kyoho-grape-juice.png' },
        'oolong_tea': { id: 'oolong_tea', name: '烏龍茶', basePrice: 30, image: '../images/a1/icon-a03-oolong-tea.png' },
        'sugar_free_green_tea': { id: 'sugar_free_green_tea', name: '油切無糖綠茶', basePrice: 30, image: '../images/a1/icon-a04-sugar-free-green-tea.png' },
        'rich_cocoa': { id: 'rich_cocoa', name: '特濃可可', basePrice: 30, image: '../images/a1/icon-a05-rich-cocoa.png' },
        'orange_pulp_juice': { id: 'orange_pulp_juice', name: '陽光果粒柳橙汁', basePrice: 35, image: '../images/a1/icon-a06-orange-pulp-juice.png' },
        'classic_coke': { id: 'classic_coke', name: '經典可樂', basePrice: 30, image: '../images/a1/icon-a07-classic-coke.png' },
        'sarsaparilla_drink': { id: 'sarsaparilla_drink', name: '沁涼沙士', basePrice: 25, image: '../images/a1/icon-a08-sarsaparilla-drink.png' },
        'sparkling_apple_drink': { id: 'sparkling_apple_drink', name: '氣泡蘋果飲', basePrice: 25, image: '../images/a1/icon-a09-sparkling-apple-drink.png' },
        'refreshing_cola': { id: 'refreshing_cola', name: '勁爽沁涼可樂', basePrice: 30, image: '../images/a1/icon-a10-refreshing-cola.png' },
        'assam_milk_tea': { id: 'assam_milk_tea', name: '阿薩姆奶茶', basePrice: 28, image: '../images/a1/icon-a11-assam-milk-tea.png' },
        'iced_lemon_tea': { id: 'iced_lemon_tea', name: '鮮萃凍檸紅茶', basePrice: 25, image: '../images/a1/icon-a12-iced-lemon-tea.png' },
        'peach_black_tea': { id: 'peach_black_tea', name: '蜜桃紅茶', basePrice: 28, image: '../images/a1/icon-a13-peach-black-tea.png' },
        'royal_milk_tea': { id: 'royal_milk_tea', name: '皇家英倫奶茶', basePrice: 28, image: '../images/a1/icon-a14-royal-milk-tea.png' },
        'sports_drink': { id: 'sports_drink', name: '運動補給飲', basePrice: 25, image: '../images/a1/icon-a15-sports-drink.png' },
        'traditional_soy_milk': { id: 'traditional_soy_milk', name: '古早味豆漿', basePrice: 25, image: '../images/a1/icon-a16-traditional-soy-milk.png' },
        'mountain_spring_water': { id: 'mountain_spring_water', name: '雪山礦泉水', basePrice: 20, image: '../images/a1/icon-a17-mountain-spring-water.png' },
        'strawberry_au_lait': { id: 'strawberry_au_lait', name: '草莓歐蕾', basePrice: 30, image: '../images/a1/icon-a18-strawberry-au-lait.png' },
        'aloe_drink': { id: 'aloe_drink', name: '蘆薈果粒飲', basePrice: 30, image: '../images/a1/icon-a19-aloe-drink.png' }
    };

    // ========================================
    // 配置區域 2：防抖時間常數
    // ========================================
    const A1_DEBOUNCE = {
        PRODUCT_SELECT: 300,    // 商品選擇防抖
        COIN_INSERT: 300,       // 投幣防抖
        PAYMENT_CONFIRM: 500,   // 確認購買防抖
        PICKUP: 500,            // 取物防抖
        REFUND: 500,            // 退幣防抖
        HINT: 500,              // 提示按鈕防抖
        CLICK_MODE: 600         // 輔助點擊模式安全鎖
    };

    // ========================================
    // 配置區域 3：難度付款規則配置
    // ========================================
    // 定義各難度模式的付款驗證規則
    const DIFFICULTY_PAYMENT_RULES = {
        easy: {
            allowOverpayment: false,        // 不允許多付（錢包金額=商品價格）
            checkUnnecessaryOverpayment: false,  // 不檢查不必要的多付
            overpaymentCheckMode: null,     // 不檢查
            allowChange: false,             // 不允許找零
            maxErrorsBeforeHint: 0          // 不提供提示（自動提示）
        },
        normal: {
            allowOverpayment: true,         // 允許多付
            checkUnnecessaryOverpayment: true,   // 檢查不必要的多付
            overpaymentCheckMode: 'subset-enough',  // 子集合足夠模式：任何子集合夠付就不能再加其他硬幣
            allowChange: true,              // 允許找零
            maxErrorsBeforeHint: 3          // 錯誤3次後顯示提示
        },
        hard: {
            allowOverpayment: true,         // 允許多付
            checkUnnecessaryOverpayment: true,   // 檢查不必要的多付
            overpaymentCheckMode: 'subset-enough',  // 子集合足夠模式：同普通模式（任何子集合夠付就不能再加其他硬幣）
            allowChange: true,              // 允許找零（但要避免不必要多付）
            maxErrorsBeforeHint: Infinity   // 永不自動提示，需手動點擊
        }
    };

    // ========================================
    // 配置區域 4：簡單模式流程配置
    // ========================================
    // 定義簡單模式的步驟、允許動作、錯誤訊息
    // 修改流程：調整 steps 中的配置即可
    const EASY_MODE_FLOW = {
        steps: {
            SELECT_PRODUCT: {
                id: 'SELECT_PRODUCT',
                name: '選擇產品',
                allowedActions: ['selectProduct'],
                warningMessages: {
                    showCoinModal: '請先選擇飲料',
                    processPayment: '請先選擇飲料',
                    cancel: '請先選擇飲料'
                }
            },
            INSERT_COIN: {
                id: 'INSERT_COIN',
                name: '投幣',
                allowedActions: ['showCoinModal', 'cancel'],
                warningMessages: {
                    selectProduct: '已經選好飲料了，請投幣',
                    clickConfirmBtn: '請先投幣'
                }
            },
            INSERTING_COINS: {
                id: 'INSERTING_COINS',
                name: '正在投幣',
                allowedActions: ['clickCoin', 'cancelCoinInsertion'],
                warningMessages: {
                    selectProduct: '請先完成投幣',
                    clickConfirmBtn: '請先完成投幣'
                }
            },
            CONFIRM_PURCHASE: {
                id: 'CONFIRM_PURCHASE',
                name: '確認購買',
                allowedActions: ['processPayment', 'cancel'],
                warningMessages: {
                    selectProduct: '請點擊確認購買',
                    clickCoinSlot: '已完成投幣，請點擊確認購買'
                }
            },
            PICKUP_PRODUCT: {
                id: 'PICKUP_PRODUCT',
                name: '取貨',
                allowedActions: ['pickUpProduct'],
                warningMessages: {
                    selectProduct: '請到取物口拿飲料',
                    clickCoinSlot: '請到取物口拿飲料',
                    clickConfirmBtn: '請到取物口拿飲料'
                }
            }
        },

        // 音效配置
        audio: {
            warning: 'error03'
        }
    };

    // ========================================
    // 配置區域 4：UI 文字與語音模板
    // ========================================
    // 集中管理介面文字和語音內容
    // 使用 {變數名} 作為佔位符，執行時會被替換
    // 修改文字：直接修改此處的字串即可
    const UI_TEXT = {
        welcome: {
            title: '歡迎來到自動飲料販賣機',
            speech: '歡迎來到自動飲料販賣機'
        },
        wallet: {
            title: '💰 您的錢包',
            speechTemplate: '你的錢包總共有{amount}元'
        },
        task: {
            assigned: {
                titleTemplate: '🎯 請購買：{productName}',
                messageTemplate: '價格：{price} 元',
                speechTemplate: '請購買{productName}，價格是{price}元'
            },
            freeChoice: {
                title: '🛒 自由選購',
                message: '請在錢包金額內選擇您想要的飲料',
                speech: '你可以在錢包金額內自由選擇飲料'
            }
        },
        errors: {
            noProductSelected: {
                title: '請選擇商品',
                message: '請先選擇您想要的飲料',
                speech: '請先選擇飲料'
            },
            insufficientFunds: {
                title: '金額不足',
                messageTemplate: '還需要 {diff} 元',
                speechTemplate: '金額不足，還需要 {diff} 元'
            }
        }
    };

    // ========================================
    // 主應用程式
    // ========================================
    const VendingMachine = {

        // ========================================
        // 🐛 Debug 系統 - FLAGS 分類開關
        // ========================================
        Debug: {
            FLAGS: {
                all: false,         // 全域開關（開啟則顯示所有分類）
                init: false,        // 初始化
                state: false,       // 狀態管理
                ui: false,          // UI 渲染
                audio: false,       // 音效
                speech: false,      // 語音
                coin: false,        // 投幣相關
                payment: false,     // 付款驗證
                product: false,     // 商品選擇
                flow: false,        // 遊戲流程
                assist: false,      // 輔助點擊模式
                hint: false,        // 提示系統
                timer: false,       // 計時器
                event: false,       // 事件處理
                error: true         // 錯誤（預設開啟）
            },

            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[A1-${category}]`, ...args);
                }
            },

            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[A1-${category}]`, ...args);
                }
            },

            error(...args) {
                console.error('[A1-ERROR]', ...args);
            }
        },

        // ========================================
        // 🔧 金額轉換輔助函數 - 使用共用模組
        // ========================================
        convertAmountToSpeech(amount) {
            // 使用共用模組的金額轉換函數
            return NumberSpeechUtils.convertToTraditionalCurrency(amount);
        },

        // ========================================
        // 🔧 [Phase 1] TimerManager - 計時器統一管理
        // ========================================
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
                this.timers.forEach(timer => window.clearTimeout(timer.timerId));
                this.timers.clear();
                VendingMachine.Debug.log('timer', '🧹 TimerManager.clearAll() 已清除所有計時器');
            },

            clearByCategory(category) {
                this.timers.forEach((timer, id) => {
                    if (timer.category === category) {
                        window.clearTimeout(timer.timerId);
                        this.timers.delete(id);
                    }
                });
            }
        },

        // ========================================
        // 🔧 [Phase 1] EventManager - 事件監聽器統一管理
        // ========================================
        EventManager: {
            listeners: [],

            on(element, type, handler, options = {}, category = 'default') {
                if (!element) return -1;
                element.addEventListener(type, handler, options);
                return this.listeners.push({ element, type, handler, options, category }) - 1;
            },

            removeAll() {
                this.listeners.forEach(l => {
                    if (l?.element) {
                        try { l.element.removeEventListener(l.type, l.handler, l.options); } catch(e) {}
                    }
                });
                this.listeners = [];
                VendingMachine.Debug.log('event', '🧹 EventManager.removeAll() 已移除所有事件監聯器');
            },

            removeByCategory(category) {
                this.listeners.forEach((l, i) => {
                    if (l?.category === category && l.element) {
                        try { l.element.removeEventListener(l.type, l.handler, l.options); } catch(e) {}
                        this.listeners[i] = null;
                    }
                });
            }
        },

        // ========================================
        // 🎬 全局動畫樣式注入（避免重複定義）
        // ========================================
        injectGlobalAnimationStyles() {
            if (document.getElementById('a1-global-animations')) return;

            const style = document.createElement('style');
            style.id = 'a1-global-animations';
            style.innerHTML = `
                /* ===== 基礎動畫 ===== */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes slideUp {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes celebrate {
                    0% { transform: scale(0.8) rotate(-10deg); opacity: 0; }
                    50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes bounceWelcome {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes bounceResults {
                    0%, 20%, 60%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-20px); }
                    80% { transform: translateY(-10px); }
                }
                @keyframes bounceIn {
                    from { opacity: 0; transform: scale(0.3) translateY(-50px); }
                    50% { opacity: 1; transform: scale(1.05) translateY(10px); }
                    70% { transform: scale(0.95) translateY(-5px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes clickModePulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
                    50% { transform: translate(-50%, -50%) scale(1.05); box-shadow: 0 12px 32px rgba(0,0,0,0.5); }
                }
                @keyframes scale {
                    0%, 100% { transform: none; }
                    50% { transform: scale3d(1.1, 1.1, 1); }
                }

                /* ===== 模態框動畫 ===== */
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                /* ===== 錢幣動畫 ===== */
                @keyframes coinFloat {
                    0% { transform: translateY(0px); }
                    100% { transform: translateY(-8px); }
                }
                @keyframes coinAppear {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes coinInsertAnimation {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2) rotate(180deg); opacity: 0.5; }
                    100% { transform: scale(0) rotate(360deg); opacity: 0; }
                }
                @keyframes coinReturn {
                    0% { transform: scale(1) translateY(0); opacity: 1; }
                    50% { transform: scale(1.3) translateY(-20px) rotate(180deg); opacity: 0.7; }
                    100% { transform: scale(0.5) translateY(-100px) rotate(360deg); opacity: 0; }
                }
                @keyframes coinPop {
                    from { transform: scale(0); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes coinDrop {
                    from { transform: translateY(-100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                /* ===== 提示動畫 ===== */
                @keyframes pulseHint {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.8), 0 0 25px rgba(255, 193, 7, 0.4); }
                    50% { box-shadow: 0 0 0 25px rgba(255, 193, 7, 0), 0 0 40px rgba(255, 193, 7, 0.6); }
                }
                @keyframes borderPulse {
                    0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 20px rgba(255, 193, 7, 0.8), 0 0 40px rgba(255, 193, 7, 0.5), inset 0 0 20px rgba(255, 193, 7, 0.3); }
                    50% { opacity: 0.7; transform: scale(1.05); box-shadow: 0 0 30px rgba(255, 193, 7, 1), 0 0 60px rgba(255, 193, 7, 0.7), inset 0 0 30px rgba(255, 193, 7, 0.5); }
                }
                @keyframes bounceHint {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(-5px); }
                }
                @keyframes gridPulseHint {
                    0%, 100% { border-color: #FFC107; box-shadow: inset 0 0 15px rgba(255, 193, 7, 0.3); }
                    50% { border-color: #FFA000; box-shadow: inset 0 0 25px rgba(255, 193, 7, 0.5); }
                }

                /* ===== 標記動畫 ===== */
                @keyframes wrongMarkAppear {
                    0% { transform: translate(-50%, -50%) scale(0) rotate(-180deg); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.2) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes wrongMarkDisappear {
                    to { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                }
                @keyframes warningMarkAppear {
                    0% { transform: translate(-50%, -50%) scale(0) rotate(-180deg); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.3) rotate(10deg); }
                    70% { transform: translate(-50%, -50%) scale(0.9) rotate(-5deg); }
                    100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes warningMarkShake {
                    0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
                    25% { transform: translate(-50%, -50%) rotate(-5deg); }
                    75% { transform: translate(-50%, -50%) rotate(5deg); }
                }
                @keyframes warningMarkDisappear {
                    to { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                }

                /* ===== 成功打勾動畫 ===== */
                @keyframes circleStroke {
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes checkStroke {
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes fillBackground {
                    0% { background: #4caf50; transform: scale(0); }
                    100% { background: #4caf50; transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
            this.Debug.log('init', '🎬 全局動畫樣式注入完成');
        },

        // ========================================
        // 配置區域 5：狀態管理
        // ========================================
        // 集中管理所有應用程式狀態
        // - settings: 遊戲設定（難度、錢包金額等）
        // - gameState: 遊戲狀態（商品、金額、步驟等）
        state: {
            currentScene: 'settings',  // settings, welcome, wallet-intro, shopping, quiz
            settings: {
                difficulty: null,           // null（未選擇）, easy（其他待開放）
                walletAmount: null,         // null（未選擇）, 50, 100, or custom number
                customWalletDetails: null, // 自訂錢包幣值明細 { 1: qty, 5: qty, 10: qty, 50: qty }
                taskType: null,             // null（未選擇）, assigned, freeChoice, coinFirstAssigned, coinFirstFree
                productType: 'default',     // default（預設）, magic（魔法商品）
                questionCount: null,        // null（未選擇）, 5, 10, 15, 20, custom
                clickMode: false,           // 輔助點擊模式（單鍵操作）
                coinTypes: [1, 5, 10, 50], // 錢包可用的幣值
            },
            gameState: {
                currentProducts: [],        // 當前回合的 14 種飲料
                selectedProduct: null,       // 選中的商品
                targetProduct: null,         // 指定購買的商品（assigned mode）
                insertedAmount: 0,          // 已投入金額
                walletCoins: {},            // 錢包硬幣組成
                completedQuestions: 0,      // 已完成題數
                correctAnswers: 0,          // 答對題數
                startTime: null,            // 測驗開始時間
                customProducts: [],         // 自訂飲料商品（魔法商品）
                customProductsUsageCount: {},  // 記錄每個魔法商品的使用次數 { productId: count }
                isStarting: false,          // 防止重複點擊開始遊戲
                easyModeHints: {
                    enabled: false,         // 是否啟用簡單模式提示
                    currentStep: null,      // 當前步驟：'select_product', 'insert_coin', 'click_coin'
                    highlightedElement: null  // 當前高亮的元素
                },
                speechTimer: null,          // 語音播放計時器（用於防抖動）
                lastCoinValue: 0,           // 最後點擊的硬幣金額
                currentFlowStep: null,      // 當前流程步驟（簡單模式專用）
                changeAmount: 0,            // 找零金額
                productPickedUp: false,     // 是否已拿取飲料
                productVended: false,       // 是否已出貨
                insertedCoinsDetail: [],    // 本次投入的硬幣詳細列表（用於檢查多付）
                lastWalletAmount: 0,        // 上一輪的錢包金額（確保每輪不同）
                maxWalletAmountLimit: 0,    // 原始錢包金額上限設定（50或100）
                lastTargetProductId: null,  // 上一輪的指定飲料ID（確保每輪不同）
                // 普通/困難模式：當前步驟與錯誤計數（統一使用）
                normalMode: {
                    currentStep: 'step1',   // 當前步驟：step1(選飲料), step2(投幣), step3(確認購買), step4(取物取零錢)
                    errorCount: 0,          // 當前步驟的累計錯誤次數
                    hintShown: false,       // 是否已顯示提示（普通模式：錯誤3次自動顯示；困難模式：不自動顯示）
                    coinInsertionErrors: 0, // 投幣時的錯誤次數（用於3次後提示最小硬幣組合）
                    hintTimer: null         // 普通模式自動提示計時器 ID
                },
                // 簡單模式：當前步驟（統一使用step1-4）
                easyMode: {
                    currentStep: 'step1'    // 當前步驟：step1(選飲料), step2(投幣), step3(確認購買), step4(取物取零錢)
                },
                // 輔助點擊模式狀態
                clickModeState: {
                    enabled: false,
                    currentPhase: null,     // 'welcome', 'wallet', 'selectProduct', 'insertCoin', 'confirmPurchase', 'pickup'
                    currentStep: 0,
                    actionQueue: [],
                    waitingForClick: false,
                    waitingForStart: false,
                    waitingForModal: false,
                    lastClickTime: 0,
                    // 🆕 新增（參考 A5）
                    clickReadyTime: 0,           // 點擊準備就緒時間（用於防快速點擊）
                    isExecuting: false,          // 是否正在執行操作（防止競態條件）
                    _visualDelayTimer: null      // 視覺延遲計時器
                }
            }
        },

        // ========== 音效系統 ==========
        audio: {
            sounds: {},

            // 音效初始化
            init() {
                VendingMachine.Debug.log('audio', ' 音效系統初始化');

                // ===== 音效檔案集中定義 =====
                // 使用方法：this.audio.play('音效名稱')
                // 新增音效：在此處添加新的音效檔案即可
                this.sounds = {
                    // 【介面互動音效】
                    click: new Audio('../audio/units/click.mp3'),           // 按鈕點擊（使用12次）

                    // 【投幣相關音效】
                    coinInsert: new Audio('../audio/units/coin01.mp3'),      // 投幣孔音效
                    coin01: new Audio('../audio/units/coin01.mp3'),          // 硬幣投入音效（使用1次）

                    // 【成功提示音效】
                    vendSuccess: new Audio('../audio/units/correct02.mp3'),  // 出貨成功（使用1次）
                    correct: new Audio('../audio/units/correct02.mp3'),      // 答對/正確操作（使用3次）

                    // 【錯誤提示音效】
                    error: new Audio('../audio/units/error.mp3'),            // 一般錯誤（使用4次）
                    error02: new Audio('../audio/units/error.mp3'),        // 錯誤提示02（使用1次）
                    error03: new Audio('../audio/units/error.mp3'),        // 錯誤提示03 - 最常用（使用7次）
                    keypad: new Audio('../audio/units/keypad.mp3')           // 數字輸入器按鍵
                };
                // =============================
                Object.values(this.sounds).forEach(sound => {
                    if (sound) {
                        sound.volume = 0.5;
                        // 預載音效
                        sound.load();
                    }
                });

            },
            play(soundName) {
                const sound = this.sounds[soundName];
                if (sound) {
                    sound.currentTime = 0;
                    const playPromise = sound.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                VendingMachine.Debug.log('audio', `播放成功: ${soundName}`);
                            })
                            .catch(err => {
                                VendingMachine.Debug.warn('audio', `播放失敗: ${soundName}`, err.message);
                            });
                    }
                } else {
                    VendingMachine.Debug.warn('audio', `找不到音效: ${soundName}`);
                }
            }
        },

        // 語音系統（參考 A2 實現）
        speech: {
            synth: null,
            voice: null,
            isReady: false,

            init() {
                VendingMachine.Debug.log('speech', '🎙️ 語音系統初始化');

                if (!('speechSynthesis' in window)) {
                    VendingMachine.Debug.warn('speech', '🎙️ 瀏覽器不支援語音合成');
                    return;
                }

                this.synth = window.speechSynthesis;
                let voiceInitAttempts = 0;
                const maxAttempts = 5;

                const setVoice = () => {
                    voiceInitAttempts++;
                    const voices = this.synth.getVoices();

                    if (voices.length === 0) {
                        if (voiceInitAttempts < maxAttempts) {
                            // 🔧 [Phase 2] 遷移至 TimerManager
                            VendingMachine.TimerManager.setTimeout(setVoice, 500, 'speechInit');
                        } else {
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

                    if (this.voice) {
                        this.isReady = true;
                        VendingMachine.Debug.log('speech', '🎙️ 語音準備就緒', { voiceName: this.voice.name });
                    } else {
                        this.voice = null;
                        this.isReady = true;
                    }
                };

                setVoice();
                if (this.synth.onvoiceschanged !== undefined) {
                    this.synth.onvoiceschanged = setVoice;
                }
                // 🔧 [Phase 2] 遷移至 TimerManager
                VendingMachine.TimerManager.setTimeout(() => {
                    if (!this.isReady && voiceInitAttempts < maxAttempts) setVoice();
                }, 1000, 'speechInit');
            },

            speak(text, options = {}) {
                const { interrupt = true, callback = null } = options;

                VendingMachine.Debug.log('speech', '🎙️ speak 被調用:', text.substring(0, 30) + '...', 'hasCallback:', !!callback);

                if (this.synth && this.synth.speaking && interrupt) {
                    VendingMachine.Debug.log('speech', '🎙️ 取消當前語音');
                    this.synth.cancel();
                    // 🔧 [Phase 2] 遷移至 TimerManager
                    VendingMachine.TimerManager.setTimeout(() => this.performSpeech(text, callback), 200, 'speechDelay');
                    return;
                }

                if (!this.isReady || !text || !this.voice) {
                    VendingMachine.Debug.warn('speech', '🎙️ 語音系統未就緒或無語音引擎');
                    if (callback) {
                        VendingMachine.Debug.log('speech', '🎙️ 直接執行回調');
                        // 🔧 [Phase 2] 遷移至 TimerManager
                        VendingMachine.TimerManager.setTimeout(callback, 100, 'speechDelay');
                    }
                    return;
                }

                this.performSpeech(text, callback);
            },

            performSpeech(text, callback) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.voice = this.voice;
                utterance.rate = 1.0;
                utterance.lang = this.voice.lang;

                if (callback) {
                    let callbackExecuted = false;
                    const safeCallback = () => {
                        if (!callbackExecuted) {
                            callbackExecuted = true;
                            VendingMachine.Debug.log('speech', '🎙️ 語音播放結束，執行回調');
                            callback();
                        }
                    };
                    utterance.onend = () => {
                        VendingMachine.Debug.log('speech', '🎙️ 語音 onend 事件觸發');
                        safeCallback();
                    };
                    utterance.onerror = (event) => {
                        VendingMachine.Debug.warn('speech', '🎙️ 語音播放錯誤:', event);
                        safeCallback();
                    };
                    // 根據文本長度計算超時時間（每個字約 0.5 秒）
                    const estimatedDuration = Math.max(text.length * 0.5 * 1000, 5000);
                    VendingMachine.Debug.log('speech', `🎙️ 設定超時: ${estimatedDuration}ms`);
                    // 🔧 [Phase 2] 遷移至 TimerManager
                    VendingMachine.TimerManager.setTimeout(safeCallback, estimatedDuration, 'speechDelay');
                }

                try {
                    this.synth.speak(utterance);
                } catch (error) {
                    if (callback) callback();
                }
            }
        },

        // 初始化
        init() {
            // 🔧 [Phase 1] 清除可能存在的殘留計時器
            this.TimerManager.clearAll();

            // 🎬 注入全局動畫樣式（避免 JS 內嵌重複定義）
            this.injectGlobalAnimationStyles();

            this.audio.init();
            this.speech.init();
            this.showSettings();

            // 版本資訊
            this.Debug.log('init', '═══════════════════════════════════════════════════════');
            this.Debug.log('init', '🥤 自動販賣機測驗程式啟動');
            this.Debug.log('init', '📦 版本: v2.1.0 (2026-02-22) - 動畫定義整合');
            this.Debug.log('init', '🔧 Phase 1: TimerManager/EventManager 基礎設施就緒');
            this.Debug.log('init', '═══════════════════════════════════════════════════════');
        },

        // ===== 輕量通知系統 =====

        showToast(message, type = 'warning') {
            // 移除現有 toast
            const existing = document.getElementById('a1-toast');
            if (existing) existing.remove();

            const colors = {
                warning: { bg: '#ff9800', text: '#fff' },
                success: { bg: '#4caf50', text: '#fff' },
                error: { bg: '#f44336', text: '#fff' }
            };
            const color = colors[type] || colors.warning;

            const toast = document.createElement('div');
            toast.id = 'a1-toast';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                background: ${color.bg}; color: ${color.text};
                padding: 12px 24px; border-radius: 10px; font-size: 15px; font-weight: bold;
                z-index: 99999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                opacity: 0; transition: opacity 0.3s ease; max-width: 90vw; text-align: center;
                white-space: pre-line;
            `;
            document.body.appendChild(toast);

            // 淡入
            requestAnimationFrame(() => { toast.style.opacity = '1'; });

            // 2 秒後淡出並移除
            // 🔧 [Phase 2] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                toast.style.opacity = '0';
                // 🔧 [Phase 2] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => toast.remove(), 300, 'uiAnimation');
            }, 2000, 'uiAnimation');
        },

        // ===== 場景渲染 =====

        // 設定頁面（參考 A1 樣式）
        showSettings() {
            // 🔧 [Phase 1] 清除所有計時器（返回設定時清除殘留計時器）
            this.TimerManager.clearAll();
            // 🔧 [Phase 3] 清除遊戲 UI 事件監聽器
            this.EventManager.removeByCategory('gameUI');
            if (window.TutorContext) {
                TutorContext.update({ screen: 'settings' });
                TutorContext.getLiveData = null;
            }

            // 🔧 [Phase 1] 重置普通/困難模式狀態
            this.state.gameState.normalMode = {
                currentStep: 'step1',
                errorCount: 0,
                hintShown: false,
                coinInsertionErrors: 0,
                hintTimer: null
            };

            this.unbindClickModeHandler();
            const app = document.getElementById('app');
            const s = this.state.settings;

            app.innerHTML = `
                <div class="unit-welcome">
                    <div class="welcome-content">
                        <div class="settings-title-row">
                            <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                            <h1>單元A1：自動飲料販賣機</h1>
                        </div>
                        <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">模擬自動販賣機購物流程，練習投幣、選購商品與收取找零</p>

                    <div class="game-settings">

                            <!-- 🎯 選擇難度 -->
                            <div class="setting-group">
                                <label>🎯 選擇難度：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${s.difficulty === 'easy' ? 'active' : ''}"
                                            data-type="difficulty" data-value="easy">
                                        簡單
                                    </button>
                                    <button class="selection-btn ${s.difficulty === 'normal' ? 'active' : ''}"
                                            data-type="difficulty" data-value="normal">
                                        普通
                                    </button>
                                    <button class="selection-btn ${s.difficulty === 'hard' ? 'active' : ''}"
                                            data-type="difficulty" data-value="hard">
                                        困難
                                    </button>
                                </div>
                                <div id="difficulty-description" class="setting-description" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 0.95em; color: #666; text-align: left;">
                                    ${this.getDifficultyDescription(s.difficulty)}
                                </div>
                            </div>


                            <!-- 輔助點擊模式（僅簡單模式可用） -->
                            <div class="setting-group" id="clickModeSetting" style="background: #fff3cd; padding: 15px; border-radius: 10px; border: 2px solid #ffcc02; ${s.difficulty !== 'easy' ? 'display: none;' : ''}">
                                <label style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 1.2em;">♿</span>
                                    <span>輔助點擊模式（單鍵操作）：</span>
                                </label>
                                <p style="font-size: 0.9em; color: #666; margin: 8px 0 12px 0; line-height: 1.5;">
                                    啟用後，只要偵測到點擊，系統會自動依序完成選擇飲料、投幣、取物取零等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                    <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式 + 購買指定飲料」（含先投幣指定模式）</strong>
                                </p>
                                <div class="button-group">
                                    <button class="selection-btn ${s.clickMode === true ? 'active' : ''}"
                                            data-type="clickMode" data-value="true">
                                        ✓ 啟用
                                    </button>
                                    <button class="selection-btn ${s.clickMode === false ? 'active' : ''}"
                                            data-type="clickMode" data-value="false">
                                        ✗ 停用
                                    </button>
                                </div>
                            </div>

                            <!-- 錢包金額（僅適用普通、困難模式） -->
                            <div class="setting-group" id="walletAmountSetting" style="${s.difficulty !== 'normal' && s.difficulty !== 'hard' ? 'display: none;' : ''}">
                                <label><img src="../images/common/icons_wallet.png" alt="💰" style="width:1em;height:1em;vertical-align:middle;margin-right:2px;" onerror="this.outerHTML='💰'"> 錢包金額：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${s.walletAmount === 50 ? 'active' : ''}"
                                            data-type="walletAmount" data-value="50">
                                        50 元以內
                                    </button>
                                    <button class="selection-btn ${s.walletAmount === 100 ? 'active' : ''}"
                                            data-type="walletAmount" data-value="100">
                                        100 元以內
                                    </button>
                                    <button class="selection-btn ${s.customWalletDetails ? 'active' : ''}"
                                            data-type="walletAmount" data-value="custom">
                                        ${s.customWalletDetails ? s.walletAmount + '元（自訂）' : '自訂金額'}
                                    </button>
                                </div>
                                <div class="setting-description">
                                    <small style="color: #999;">此設定僅適用於普通、困難模式</small>
                                </div>
                            </div>

                            <!-- 任務類型 -->
                            <div class="setting-group">
                                <label>📋 任務類型：</label>
                                <!-- 🪙 先投幣再選飲料 -->
                                <div style="font-size:0.8em;color:#888;font-weight:600;padding:2px 4px;margin-top:2px;${s.difficulty==='easy'?'display:none;':''}">🪙 先投幣再選飲料</div>
                                <div class="button-group" style="margin-bottom:4px;">
                                    <button class="selection-btn ${s.taskType === 'coinFirstAssigned' ? 'active' : ''}"
                                            data-type="taskType" data-value="coinFirstAssigned">
                                        指定任務
                                    </button>
                                    <button class="selection-btn ${s.taskType === 'coinFirstFree' ? 'active' : ''}"
                                            data-type="taskType" data-value="coinFirstFree"
                                            style="${s.difficulty === 'easy' ? 'display:none;' : ''}">
                                        自選飲料
                                    </button>
                                </div>
                                <!-- 🥤 先選飲料再投幣 -->
                                <div style="font-size:0.8em;color:#888;font-weight:600;padding:2px 4px;margin-top:4px;${s.difficulty==='easy'?'display:none;':''}">🥤 先選飲料再投幣</div>
                                <div class="button-group">
                                    <button class="selection-btn ${s.taskType === 'assigned' ? 'active' : ''}"
                                            data-type="taskType" data-value="assigned">
                                        指定任務
                                    </button>
                                    <button class="selection-btn ${s.taskType === 'freeChoice' ? 'active' : ''}"
                                            data-type="taskType" data-value="freeChoice"
                                            style="${s.difficulty === 'easy' ? 'display:none;' : ''}">
                                        自選飲料
                                    </button>
                                </div>
                                <div class="setting-description">
                                    <small>
                                        ${ s.taskType === 'coinFirstAssigned' ? '先投幣，投入指定飲料金額後燈號亮起，再選指定飲料'
                                         : s.taskType === 'coinFirstFree'     ? '先投幣，投入足夠金額後飲料燈號亮起，可在錢包金額內自由選擇'
                                         : s.taskType === 'assigned'          ? '系統會隨機指定要購買的飲料'
                                         : s.taskType === 'freeChoice'        ? '你可以在錢包金額內自由選擇飲料'
                                         : '請選擇任務類型' }
                                    </small>
                                </div>
                            </div>

                            <!-- 飲料商品類型 -->
                            <div class="setting-group">
                                <label>🥤 飲料商品：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${s.productType === 'default' ? 'active' : ''}"
                                            data-type="productType" data-value="default">
                                        預設
                                    </button>
                                    <button class="selection-btn ${s.productType === 'magic' ? 'active' : ''}"
                                            data-type="productType" data-value="magic">
                                        魔法商品
                                    </button>
                                </div>
                                <div class="setting-description">
                                    <small>
                                        ${s.productType === 'default' ? '使用系統預設的飲料商品' : '上傳自訂的飲料商品圖片'}
                                    </small>
                                </div>
                            </div>

                            <!-- 魔法商品設定區域 -->
                            <div id="magic-product-container"></div>

                            <!-- 測驗題數 -->
                            <div class="setting-group">
                                <label>📊 測驗題數：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${s.questionCount === 1 ? 'active' : ''}"
                                            data-type="questionCount" data-value="1">
                                        1 題
                                    </button>
                                    <button class="selection-btn ${s.questionCount === 3 ? 'active' : ''}"
                                            data-type="questionCount" data-value="3">
                                        3 題
                                    </button>
                                    <button class="selection-btn ${s.questionCount === 5 ? 'active' : ''}"
                                            data-type="questionCount" data-value="5">
                                        5 題
                                    </button>
                                    <button class="selection-btn ${s.questionCount === 10 ? 'active' : ''}"
                                            data-type="questionCount" data-value="10">
                                        10 題
                                    </button>
                                    <button class="selection-btn ${s.questionCount !== null && ![1,3,5,10].includes(s.questionCount) ? 'active' : ''}"
                                            data-type="questionCount" data-value="custom">
                                        自訂
                                    </button>
                                </div>
                                <div class="custom-question-display" style="display: ${s.questionCount !== null && ![1,3,5,10].includes(s.questionCount) ? 'block' : 'none'}; margin-top: 10px;">
                                    <input type="text" id="custom-question-count-a1"
                                           value="${s.questionCount !== null && ![1,3,5,10].includes(s.questionCount) ? s.questionCount + '題' : ''}"
                                           placeholder="請輸入題數"
                                           style="padding: 8px; border-radius: 5px; border: 2px solid ${s.questionCount !== null && ![1,3,5,10].includes(s.questionCount) ? '#667eea' : '#ddd'}; background: ${s.questionCount !== null && ![1,3,5,10].includes(s.questionCount) ? '#667eea' : 'white'}; color: ${s.questionCount !== null && ![1,3,5,10].includes(s.questionCount) ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                                           readonly onclick="VendingMachine.handleCustomQuestionClick()">
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

                        <!-- 按鈕區 -->
                        <div class="game-buttons">
                            <button class="back-to-main-btn" onclick="location.href='../index.html#part4'">
                                返回主畫面
                            </button>
                            ${this.isSettingsComplete()
                                ? `<button class="start-btn" onclick="VendingMachine.startGame()">開始遊戲</button>`
                                : `<button class="start-btn disabled" disabled>請完成所有設定選項</button>`
                            }
                        </div>
                    </div>
                </div>
            </div>
            `;

            // 綁定設定按鈕事件
            this.bindSettingEvents();
        },

        // 綁定設定按鈕事件
        bindSettingEvents() {
            document.querySelectorAll('.selection-btn').forEach(btn => {
                this.EventManager.on(btn, 'click', (e) => {
                    const btnEl = e.target.closest('.selection-btn');
                    const type = btnEl?.dataset.type;
                    const value = btnEl?.dataset.value;

                    if (type && value) {
                        this.audio.play('click');

                        // 特殊處理
                        if (type === 'walletAmount' && value === 'custom') {
                            this.customWalletAmount();
                            return;
                        }
                        if (type === 'questionCount' && value === 'custom') {
                            this.showQuestionCountNumberInput();
                            return;
                        }
                        if (type === 'productType' && value === 'magic') {
                            this.showMagicProductSettings();
                            return;
                        }
                        // 更新設定
                        let actualValue = value;
                        if (type === 'walletAmount' || type === 'questionCount') {
                            actualValue = parseInt(value);
                        }
                        this.updateSetting(type, actualValue);

                        // 更新按鈕狀態
                        // taskType 跨兩個 button-group，需全域清除
                        if (type === 'taskType') {
                            document.querySelectorAll('[data-type="taskType"]').forEach(b => b.classList.remove('active'));
                        } else {
                            const group = btnEl.closest('.button-group');
                            group.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                        }
                        btnEl.classList.add('active');

                        // 🔧 [新增] 選擇預設題數時，隱藏自訂輸入框
                        if (type === 'questionCount' && value !== 'custom') {
                            const customDisplay = document.querySelector('.custom-question-display');
                            const customInput = document.getElementById('custom-question-count-a1');
                            if (customDisplay && customInput) {
                                customDisplay.style.display = 'none';
                                customInput.value = '';
                                customInput.style.background = 'white';
                                customInput.style.color = '#333';
                                customInput.style.borderColor = '#ddd';
                            }
                        }

                    }
                }, {}, 'settingsUI');
            });

            // 🎁 獎勵系統連結事件
            const settingsRewardLink = document.getElementById('settings-reward-link');
            if (settingsRewardLink) {
                this.EventManager.on(settingsRewardLink, 'click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                }, {}, 'settingsUI');
            }

            // 📝 作業單連結事件
            const worksheetLink = document.getElementById('settings-worksheet-link');
            if (worksheetLink) {
                this.EventManager.on(worksheetLink, 'click', (e) => {
                    e.preventDefault();
                    // 作業單使用自己的預設值與工具列設定，不受遊戲設定影響
                    const params = new URLSearchParams({ unit: 'a1' });
                    window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
                }, {}, 'settingsUI');
            }


        },

        // 更新設定
        updateSetting(key, value) {
            // 特殊處理：clickMode 要轉換成 boolean
            if (key === 'clickMode') {
                value = (value === 'true' || value === true);

                // 🔧 輔助點擊模式自動預設為指定飲料（coinFirstAssigned 亦相容，不強制切換）
                if (value === true && this.state.settings.taskType !== 'assigned' && !this.isCoinFirstMode()) {
                    this.state.settings.taskType = 'assigned';
                    // 更新 UI 按鈕狀態
                    document.querySelectorAll('[data-type="taskType"]').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.value === 'assigned');
                    });
                    VendingMachine.Debug.log('assist', ' 輔助點擊模式：自動切換為指定飲料');
                }
            }

            this.state.settings[key] = value;

            // 切換回預設商品時，關閉魔法商品設定面板
            if (key === 'productType' && value === 'default') {
                this.updateMagicProductContainer();
            }

            // 錢包金額變更時，即時更新魔法商品設定的顯示
            if (key === 'walletAmount' && this.state.settings.productType === 'magic') {
                this.updateMagicProductContainer();
            }

            // 切換至預設選項（50/100）時，清除自訂錢包詳細，確保按鈕文字復原
            if (key === 'walletAmount' && (value === 50 || value === 100)) {
                this.state.settings.customWalletDetails = null;
                const customBtn = document.querySelector('[data-type="walletAmount"][data-value="custom"]');
                if (customBtn) customBtn.textContent = '自訂金額';
            }

            // 如果選擇簡單模式，自動將任務類型設為"購買指定飲料"（coinFirstAssigned 亦支援簡單模式，coinFirstFree 不支援）
            if (key === 'difficulty' && value === 'easy') {
                if (this.state.settings.taskType === 'freeChoice') {
                    this.state.settings.taskType = 'assigned';
                    VendingMachine.Debug.log('state', ' 簡單模式不支援自選任務，已自動切換為指定任務');
                } else if (this.state.settings.taskType === 'coinFirstFree') {
                    this.state.settings.taskType = 'coinFirstAssigned';
                    VendingMachine.Debug.log('state', ' 簡單模式不支援先投幣自選，已自動切換為先投幣指定任務');
                }

                // 隱藏"自選購買飲料"和"先投幣自選"按鈕
                const taskButtons = document.querySelectorAll('[data-type="taskType"]');
                taskButtons.forEach(btn => {
                    if (btn.dataset.value === 'freeChoice' || btn.dataset.value === 'coinFirstFree') {
                        btn.style.display = 'none';
                    }
                });
            } else if (key === 'difficulty' && (value === 'normal' || value === 'hard')) {
                // 顯示"自選購買飲料"和"先投幣自選"按鈕
                const taskButtons = document.querySelectorAll('[data-type="taskType"]');
                taskButtons.forEach(btn => {
                    if (btn.dataset.value === 'freeChoice' || btn.dataset.value === 'coinFirstFree') {
                        btn.style.display = '';
                    }
                });
            }

            // 顯示/隱藏錢包金額設定
            if (key === 'difficulty') {
                const walletSetting = document.getElementById('walletAmountSetting');
                if (walletSetting) {
                    walletSetting.style.display = (value === 'normal' || value === 'hard') ? '' : 'none';
                }

                // 顯示/隱藏輔助點擊模式設定（僅簡單模式可用）
                const clickModeSetting = document.getElementById('clickModeSetting');
                if (clickModeSetting) {
                    clickModeSetting.style.display = (value === 'easy') ? '' : 'none';
                }


                // 更新難度說明文字
                this.updateDifficultyDescription(value);
            }

            // 更新任務類型說明文字
            if (key === 'taskType') {
                const taskDescEl = document.querySelector('[data-type="taskType"]')?.closest('.setting-group')?.querySelector('.setting-description small');
                if (taskDescEl) {
                    const descs = {
                        assigned: '系統會隨機指定要購買的飲料',
                        freeChoice: '你可以在錢包金額內自由選擇飲料',
                        coinFirstAssigned: '先投幣，投入指定飲料金額後燈號亮起，再選指定飲料',
                        coinFirstFree: '先投幣，投入足夠金額後飲料燈號亮起，可在錢包金額內自由選擇'
                    };
                    taskDescEl.textContent = descs[value] || '';
                }
            }

            // 更新開始按鈕狀態
            this.updateStartButton();

            VendingMachine.Debug.log('state', ' 設定已更新:', key, '=', value);
        },

        // 取得難度說明文字
        getDifficultyDescription(difficulty) {
            const descriptions = {
                easy: '簡單：系統會有視覺、語音提示，引導每個步驟。',
                normal: '普通：自己完成購買，錯誤3次會自動提示。',
                hard: '困難：自己完成購買，沒有自動提示。'
            };
            return descriptions[difficulty] || '';
        },

        // 更新難度說明文字
        updateDifficultyDescription(difficulty) {
            const descDiv = document.getElementById('difficulty-description');
            if (descDiv) {
                descDiv.textContent = this.getDifficultyDescription(difficulty);
            }
        },

        // 更新開始按鈕狀態
        updateStartButton() {
            const startBtnContainer = document.querySelector('.game-buttons');
            if (!startBtnContainer) return;

            const backBtn = startBtnContainer.querySelector('.back-to-main-btn');
            if (this.isSettingsComplete()) {
                startBtnContainer.innerHTML = `
                    ${backBtn ? backBtn.outerHTML : '<button class="back-to-main-btn" onclick="location.href=\'../index.html#part4\'">返回主畫面</button>'}
                    <button class="start-btn" onclick="VendingMachine.startGame()">開始遊戲</button>
                `;
            } else {
                startBtnContainer.innerHTML = `
                    ${backBtn ? backBtn.outerHTML : '<button class="back-to-main-btn" onclick="location.href=\'../index.html#part4\'">返回主畫面</button>'}
                    <button class="start-btn disabled" onclick="VendingMachine.showMissingSettings()">請完成所有設定選項</button>
                `;
            }
        },

        // 顯示缺少的設定項目
        showMissingSettings() {
            const s = this.state.settings;
            const missing = [];

            if (!s.difficulty) missing.push('遊戲難度');
            if (!s.taskType) missing.push('任務類型');
            if (!s.questionCount) missing.push('測驗題數');
            if ((s.difficulty === 'normal' || s.difficulty === 'hard') && !s.walletAmount) {
                missing.push('錢包金額');
            }
            if (s.productType === 'magic' && this.state.gameState.customProducts.length === 0) {
                missing.push('魔法商品（至少上傳一個）');
            }

            if (missing.length > 0) {
                this.showToast('請先完成以下設定：\n' + missing.map(m => '• ' + m).join('\n'), 'warning');
            }
        },

        // ===== 輔助函數：判斷是否為進階模式（普通或困難） =====
        isAdvancedMode() {
            return this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard';
        },

        // ===== 輔助函數：判斷是否為先投幣模式（coinFirstAssigned 或 coinFirstFree） =====
        isCoinFirstMode() {
            const t = this.state.settings.taskType;
            return t === 'coinFirstAssigned' || t === 'coinFirstFree';
        },

        // 檢查設定是否完整
        isSettingsComplete() {
            const s = this.state.settings;

            // 檢查必要設定
            if (!s.difficulty) return false;
            if (!s.taskType) return false;
            if (!s.questionCount) return false;

            // 普通/困難模式需要選擇錢包金額
            if ((s.difficulty === 'normal' || s.difficulty === 'hard') && !s.walletAmount) {
                return false;
            }

            // 魔法商品模式需要至少上傳一個商品
            if (s.productType === 'magic' && this.state.gameState.customProducts.length === 0) {
                return false;
            }

            return true;
        },

        // 自訂錢包金額
        customWalletAmount() {
            this.showCustomWalletModal();
        },

        showCustomWalletModal() {
            this.a1CustomWalletQty = this.state.settings.customWalletDetails
                ? { ...this.state.settings.customWalletDetails }
                : { 50: 0, 10: 0, 5: 0, 1: 0 };

            const denominations = [50, 10, 5, 1];
            const minAmount = Math.min(...Object.values(BEVERAGE_DATABASE).map(b => b.basePrice));

            const itemsHTML = denominations.map(value => {
                const randomFace = Math.random() < 0.5 ? 'front' : 'back';
                const imagePath = `../images/money/${value}_yuan_${randomFace}.png`;
                const qty = this.a1CustomWalletQty[value] || 0;
                return `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 15px;background:#f8f9fa;border-radius:10px;margin:8px 0;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <img src="${imagePath}" alt="${value}元" style="width:50px;height:auto;object-fit:contain;">
                            <span style="font-size:18px;font-weight:bold;color:#333;">${value}元</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <button onclick="VendingMachine.a1AdjustWalletQty(${value},-1)" style="width:36px;height:36px;border:none;background:#e74c3c;color:white;font-size:20px;font-weight:bold;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
                            <span id="a1-wallet-qty-${value}" style="font-size:20px;font-weight:bold;min-width:40px;text-align:center;color:#2c3e50;">${qty}</span>
                            <button onclick="VendingMachine.a1AdjustWalletQty(${value},1)" style="width:36px;height:36px;border:none;background:#27ae60;color:white;font-size:20px;font-weight:bold;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>
                        </div>
                    </div>`;
            }).join('');

            const total = this._a1CalcWalletTotal();
            const modalHTML = `
                <div id="a1-custom-wallet-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:2000;">
                    <div style="background:white;padding:25px;border-radius:20px;box-shadow:0 15px 40px rgba(0,0,0,0.3);max-width:450px;width:90%;max-height:85vh;overflow-y:auto;">
                        <h3 style="text-align:center;color:#2c3e50;margin-bottom:20px;font-size:24px;"><img src="../images/common/icons_wallet.png" alt="💰" style="width:1em;height:1em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='💰'"> 自訂錢包內容</h3>
                        <div style="margin-bottom:15px;">${itemsHTML}</div>
                        <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:15px;border-radius:12px;text-align:center;margin:15px 0;">
                            <span style="font-size:16px;">總金額：</span>
                            <span id="a1-wallet-total" style="font-size:28px;font-weight:bold;">NT$ ${total}</span>
                        </div>
                        <div id="a1-wallet-warning" style="text-align:center;font-size:14px;color:#e74c3c;min-height:20px;margin-top:-8px;margin-bottom:4px;">${total < minAmount ? '⚠️ 最少需要 ' + minAmount + ' 元' : ''}</div>
                        <div style="display:flex;justify-content:center;gap:15px;margin-top:20px;">
                            <button onclick="VendingMachine.a1ConfirmWallet()" style="background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;border:none;padding:12px 35px;border-radius:25px;font-size:18px;font-weight:bold;cursor:pointer;box-shadow:0 4px 15px rgba(39,174,96,0.4);">✓ 確定</button>
                            <button onclick="VendingMachine.a1CloseWalletModal()" style="background:#95a5a6;color:white;border:none;padding:12px 35px;border-radius:25px;font-size:18px;font-weight:bold;cursor:pointer;">✕ 取消</button>
                        </div>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        },

        a1AdjustWalletQty(denomination, change) {
            this.a1CustomWalletQty[denomination] = Math.max(0, Math.min(10, (this.a1CustomWalletQty[denomination] || 0) + change));
            const qtyEl = document.getElementById(`a1-wallet-qty-${denomination}`);
            if (qtyEl) qtyEl.textContent = this.a1CustomWalletQty[denomination];
            const newTotal = this._a1CalcWalletTotal();
            const totalEl = document.getElementById('a1-wallet-total');
            if (totalEl) totalEl.textContent = `NT$ ${newTotal}`;
            const minAmount = Math.min(...Object.values(BEVERAGE_DATABASE).map(b => b.basePrice));
            const warnEl = document.getElementById('a1-wallet-warning');
            if (warnEl) warnEl.textContent = newTotal < minAmount ? '⚠️ 最少需要 ' + minAmount + ' 元' : '';
            this.audio.play('click');
        },

        _a1CalcWalletTotal() {
            let total = 0;
            for (const [denom, qty] of Object.entries(this.a1CustomWalletQty || {})) {
                total += parseInt(denom) * qty;
            }
            return total;
        },

        a1ConfirmWallet() {
            const total = this._a1CalcWalletTotal();
            const minAmount = Math.min(...Object.values(BEVERAGE_DATABASE).map(b => b.basePrice));
            if (total < minAmount) {
                this.showToast(`錢包金額至少需要 ${minAmount} 元（最低飲料價格）`, 'warning');
                return;
            }
            if (total > 100) {
                this.showToast('錢包金額不能超過 100 元', 'warning');
                return;
            }
            if (!Object.values(this.a1CustomWalletQty).some(qty => qty > 0)) {
                this.showToast('請至少選擇一種幣值！', 'warning');
                return;
            }
            this.state.settings.customWalletDetails = { ...this.a1CustomWalletQty };
            this.state.settings.walletAmount = total;
            this.a1CloseWalletModal();
            // 直接更新按鈕文字，避免設定頁重新渲染
            const customBtn = document.querySelector('[data-type="walletAmount"][data-value="custom"]');
            if (customBtn) {
                customBtn.textContent = total + '元（自訂）';
                document.querySelectorAll('[data-type="walletAmount"]').forEach(b => b.classList.remove('active'));
                customBtn.classList.add('active');
            }
            this.updateStartButton();
            VendingMachine.Debug.log('state', `[A1] 自訂錢包已設定: ${total}元`, this.a1CustomWalletQty);
        },

        a1CloseWalletModal() {
            document.getElementById('a1-custom-wallet-modal')?.remove();
        },

        // 自訂題數（已廢棄，改用數字輸入器）
        customQuestionCount() {
            this.showQuestionCountNumberInput();
        },

        // 顯示題數數字輸入器
        showQuestionCountNumberInput() {
            this.showNumberInput('questionCount');
        },

        // 🔧 [新增] 處理點擊自訂題數輸入框
        handleCustomQuestionClick() {
            const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
            if (customBtn) {
                customBtn.click();
            }
        },

        // 顯示魔法商品設定
        showMagicProductSettings() {
            // 必須先選擇難度
            if (!this.state.settings.difficulty) {
                this.showToast('請先選擇遊戲難度才能使用魔法商品！', 'warning');
                this.audio.play('error');
                return;
            }

            // 普通/困難模式：必須先選擇錢包金額
            if (this.state.settings.difficulty !== 'easy') {
                const walletAmount = this.state.settings.walletAmount;
                if (!walletAmount || (walletAmount !== 50 && walletAmount !== 100 && typeof walletAmount !== 'number')) {
                    this.showToast('請先選擇錢包金額（50元以內、100元以內或自訂金額）才能使用魔法商品！', 'warning');
                    this.audio.play('error');
                    return;
                }
            }

            this.state.settings.productType = 'magic';
            this.audio.play('click');
            this.updateMagicProductContainer();

            // 更新魔法商品按鈕的 active 狀態
            const group = document.querySelector('[data-type="productType"]')?.closest('.button-group');
            if (group) {
                group.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                const magicBtn = group.querySelector('[data-value="magic"]');
                if (magicBtn) magicBtn.classList.add('active');
            }
        },

        // 更新魔法商品容器
        updateMagicProductContainer() {
            const container = document.getElementById('magic-product-container');
            if (!container) return;

            if (this.state.settings.productType === 'magic') {
                container.innerHTML = this.getMagicProductSettingsHTML();
            } else {
                container.innerHTML = '';
            }
        },

        // 獲取魔法商品設定 HTML
        getMagicProductSettingsHTML() {
            const customProducts = this.state.gameState.customProducts;
            const maxProducts = 5;
            const difficulty = this.state.settings.difficulty;
            const walletAmount = this.state.settings.walletAmount;

            // 根據難度決定提示文字
            let priceHint;
            if (difficulty === 'easy') {
                priceHint = '簡單模式：價格由系統自動設定';
            } else {
                priceHint = `價格需低於錢包金額（${walletAmount}元）`;
            }

            return `
                <div class="magic-product-settings" style="margin-top: 15px; padding: 15px; background: #f9f9f9; border-radius: 10px; border: 2px dashed #667eea;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #667eea;">🎪 魔法商品設定</h4>
                        <button onclick="VendingMachine.closeMagicProductSettings()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">✕</button>
                    </div>
                    <p style="margin: 10px 0; color: #666; font-size: 14px;">上傳你的飲料圖片並設定價格（最多${maxProducts}種，${priceHint}）</p>

                    <div class="custom-products-list" style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
                        ${customProducts.map((product, index) => `
                            <div class="custom-product-item" style="display: flex; flex-direction: column; align-items: center; padding: 10px; background: white; border-radius: 8px; border: 2px solid #ddd; width: 100px;">
                                <img src="${product.imageUrl}" alt="${product.name}" style="width: 128px; height: 128px; object-fit: contain; border-radius: 5px; margin-bottom: 5px;">
                                <div style="font-size: 12px; color: #333; font-weight: bold; text-align: center; margin-bottom: 3px;">${product.name}</div>
                                <div style="font-size: 12px; color: #667eea; margin-bottom: 5px;">${product.price}元</div>
                                <button onclick="VendingMachine.removeCustomProduct(${index})" style="background: #ff6b6b; color: white; border: none; padding: 3px 8px; border-radius: 5px; font-size: 11px; cursor: pointer;">移除</button>
                            </div>
                        `).join('')}
                    </div>

                    <div>
                        <input type="file" id="custom-product-image" accept="image/*" style="display: none;" onchange="VendingMachine.handleProductImageUpload(event)">
                        <button onclick="VendingMachine.triggerProductImageUpload()"
                                ${customProducts.length >= maxProducts ? 'disabled' : ''}
                                style="background: ${customProducts.length >= maxProducts ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
                                       color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: ${customProducts.length >= maxProducts ? 'not-allowed' : 'pointer'}; font-size: 14px;">
                            ${customProducts.length >= maxProducts ? '❌ 已達上限' : '📸 上傳飲料圖片'}
                        </button>
                        <div style="margin-top: 8px; font-size: 12px; color: #999;">
                            ${customProducts.length >= maxProducts ? `已達上限${maxProducts}張圖片，請先刪除現有圖片` : `還可上傳 ${maxProducts - customProducts.length} 張圖片`}
                        </div>
                    </div>
                </div>
            `;
        },

        // 關閉魔法商品設定
        closeMagicProductSettings() {
            this.state.settings.productType = 'default';
            this.audio.play('click');
            this.updateMagicProductContainer();
        },

        // 觸發圖片上傳
        triggerProductImageUpload() {
            const input = document.getElementById('custom-product-image');
            if (input) input.click();
        },

        // 處理圖片上傳
        async handleProductImageUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            // 檢查數量限制
            if (this.state.gameState.customProducts.length >= 5) {
                this.showToast('最多只能上傳5種飲料商品！', 'warning');
                return;
            }

            // 讀取圖片並壓縮
            const reader = new FileReader();
            reader.onload = async (e) => {
                const compressed = await this.compressProductImage(e.target.result);
                this.showProductInputModal(compressed);
            };
            reader.readAsDataURL(file);

            // 清空 input，允許重複上傳同一檔案
            event.target.value = '';
        },

        // 壓縮商品圖片（200px, 70% 品質）
        compressProductImage(base64) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxSize = 200;
                    let w = img.width, h = img.height;
                    if (w > maxSize || h > maxSize) {
                        if (w > h) { h = h * maxSize / w; w = maxSize; }
                        else { w = w * maxSize / h; h = maxSize; }
                    }
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = () => {
                    // 壓縮失敗時使用原圖
                    resolve(base64);
                };
                img.src = base64;
            });
        },

        // 顯示商品輸入模態窗
        showProductInputModal(imageUrl) {
            const difficulty = this.state.settings.difficulty;
            const walletAmount = this.state.settings.walletAmount;
            const isEasyMode = difficulty === 'easy';

            // 根據難度決定價格上限和提示
            let maxPrice, priceHint;
            if (isEasyMode) {
                priceHint = '簡單模式：商品價格由系統自動設定';
            } else {
                maxPrice = walletAmount;
                priceHint = `價格需低於錢包金額（${walletAmount}元）`;
            }

            const modalHTML = `
                <div id="product-input-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 10000;">
                    <div style="background: white; border-radius: 15px; padding: 25px; width: 350px; max-width: 90vw;">
                        <h3 style="margin: 0 0 15px 0; color: #333; text-align: center;">🎁 新增魔法飲料</h3>
                        <div style="text-align: center; margin-bottom: 15px;">
                            <img src="${imageUrl}" style="max-width: 200px; max-height: 200px; border-radius: 10px; border: 2px solid #ddd;">
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #666;">飲料名稱：</label>
                            <input type="text" id="product-name-input" placeholder="請輸入飲料名稱" maxlength="10" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
                        </div>
                        ${isEasyMode ? `
                            <div style="margin-bottom: 20px; padding: 10px; background: #f9f9f9; border-radius: 5px; color: #666; font-size: 14px;">
                                💡 ${priceHint}
                            </div>
                        ` : `
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; color: #666;">飲料價格：</label>
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <input type="number" id="product-price-input" placeholder="請輸入價格" min="1" max="${maxPrice}" style="flex: 1; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                                    <span style="color: #666;">元</span>
                                </div>
                                <small style="color: #999; font-size: 12px;">${priceHint}</small>
                            </div>
                        `}
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button onclick="VendingMachine.closeProductInputModal()" style="flex: 1; background: #ccc; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px;">取消</button>
                            <button onclick="VendingMachine.confirmAddProduct('${imageUrl}')" style="flex: 1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px;">確認新增</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
        },

        // 關閉商品輸入模態窗
        closeProductInputModal() {
            const modal = document.getElementById('product-input-modal');
            if (modal) modal.remove();
        },

        // 確認新增商品
        confirmAddProduct(imageUrl) {
            const nameInput = document.getElementById('product-name-input');
            const priceInput = document.getElementById('product-price-input');

            const name = nameInput.value.trim();
            const difficulty = this.state.settings.difficulty;
            const walletAmount = this.state.settings.walletAmount;
            let price;

            // 驗證名稱
            if (!name) {
                this.showToast('請輸入飲料名稱！', 'warning');
                return;
            }

            // 簡單模式：價格由系統自動設定（先設為 0，後續動態生成）
            if (difficulty === 'easy') {
                price = 0; // 簡單模式價格稍後設定
            } else {
                // 普通/困難模式：需要輸入價格
                price = parseInt(priceInput.value);

                if (!price || price <= 0) {
                    this.showToast('請輸入有效的價格！', 'warning');
                    return;
                }

                // 價格必須低於錢包金額
                if (price >= walletAmount) {
                    this.showToast(`價格必須低於錢包金額（${walletAmount}元）！`, 'warning');
                    return;
                }
            }

            // 新增商品
            this.state.gameState.customProducts.push({
                name: name,
                price: price,
                imageUrl: imageUrl,
                id: `custom_${Date.now()}`
            });

            this.audio.play('success');
            this.closeProductInputModal();
            this.updateMagicProductContainer();
        },

        // 移除自訂商品
        removeCustomProduct(index) {
            if (confirm('確定要移除這個飲料商品嗎？')) {
                this.state.gameState.customProducts.splice(index, 1);
                this.audio.play('click');
                this.updateMagicProductContainer();
            }
        },

        // 為簡單模式的魔法商品設定動態價格
        setEasyModeMagicProductPrices() {
            const customProducts = this.state.gameState.customProducts;
            VendingMachine.Debug.log('product', ' 簡單模式：開始設定魔法商品價格');

            // 為每個魔法商品設定價格（10-50元範圍，保證多樣性）
            customProducts.forEach((product, index) => {
                // 使用不同的價格範圍確保多樣性
                let priceRange;
                if (customProducts.length === 1) {
                    // 只有1個商品：使用全範圍
                    priceRange = { min: 10, max: 50 };
                } else if (customProducts.length === 2) {
                    // 2個商品：一個低價、一個中高價
                    priceRange = index === 0 ? { min: 10, max: 25 } : { min: 26, max: 50 };
                } else {
                    // 3個以上商品：分散價格範圍
                    const ranges = [
                        { min: 10, max: 20 },   // 低價
                        { min: 21, max: 35 },   // 中價
                        { min: 36, max: 50 },   // 高價
                        { min: 15, max: 30 },   // 中低價
                        { min: 31, max: 45 }    // 中高價
                    ];
                    priceRange = ranges[index % ranges.length];
                }

                const price = Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;
                product.price = price;

                VendingMachine.Debug.log('product', ` ${product.name} 價格設定為 ${price}元`);
            });

            VendingMachine.Debug.log('product', ' 所有魔法商品價格:', customProducts.map(p => `${p.name}:${p.price}元`).join(', '));
        },

        // 開始遊戲
        // 📱 行動裝置（≤600px 直向堆疊時）：把指定區塊帶進視野——選完飲料捲到操作面板、
        // 出貨後捲到取物口。matchMedia 守門：桌面與平板橫式不執行，行為零變化。
        _mobileScrollTo(selector) {
            if (!(window.matchMedia && window.matchMedia('(max-width: 600px)').matches)) return;
            const el = document.querySelector(selector);
            if (!el) return;
            const top = el.getBoundingClientRect().top + window.scrollY - 90; // 預留 sticky 標題列
            window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
        },

        // 📱 行動裝置（≤900px）：換題重新渲染時捲回頂部（桌面不執行）
        _mobileScrollReset() {
            if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
                window.scrollTo(0, 0);
            }
        },

        startGame() {
            // 檢查必要設定是否完成
            if (!this.state.settings.difficulty) {
                this.showToast('請先選擇遊戲難度！', 'warning');
                return;
            }
            if (!this.state.settings.taskType) {
                this.showToast('請先選擇任務類型！', 'warning');
                return;
            }
            if (!this.state.settings.questionCount) {
                this.showToast('請先選擇測驗題數！', 'warning');
                return;
            }

            // 普通/困難模式需要選擇錢包金額
            if ((this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard')
                && !this.state.settings.walletAmount) {
                this.showToast('請先選擇錢包金額！', 'warning');
                return;
            }

            // 檢查魔法商品是否有上傳商品
            if (this.state.settings.productType === 'magic' && this.state.gameState.customProducts.length === 0) {
                this.showToast('魔法商品模式需要至少上傳一個飲料商品才能開始遊戲！', 'warning');
                return;
            }

            // 防止重複點擊
            if (this.state.gameState.isStarting) {
                VendingMachine.Debug.log('flow', ' 遊戲正在啟動中，忽略重複點擊');
                return;
            }
            this.state.gameState.isStarting = true;

            VendingMachine.Debug.log('flow', ' 開始遊戲', this.state.settings);
            this.audio.play('click');

            // 🔧 [Phase 1] 清除所有計時器（開始新遊戲時清除殘留計時器）
            this.TimerManager.clearAll();
            // 🔧 [Phase 3] 清除設定 UI 事件監聽器
            this.EventManager.removeByCategory('settingsUI');

            // 初始化遊戲狀態
            this.state.gameState.completedQuestions = 0;
            this.state.gameState.correctAnswers = 0;
            this.state.gameState.startTime = Date.now();
            window.LearningTracker?.resetWrong?.();   // 學習紀錄：錯誤/逐題計數歸零

            // 🔧 [關鍵修正] 重置所有交易相關狀態，防止上一輪殘留
            this.state.gameState.selectedProduct = null;
            this.state.gameState.targetProduct = null;
            this.state.gameState.insertedAmount = 0;
            this.state.gameState.changeAmount = 0;
            this.state.gameState.productPickedUp = false;
            this.state.gameState.productVended = false;
            this.state.gameState.insertedCoinsDetail = [];
            this.state.gameState.lastTargetProductId = null;

            // 🔧 [關鍵修正] 重置普通/困難模式步驟狀態
            this.state.gameState.normalMode = {
                currentStep: 'step1',
                errorCount: 0,
                hintShown: false,
                coinInsertionErrors: 0,
                hintTimer: null
            };

            // 重置魔法商品使用次數統計
            this.state.gameState.customProductsUsageCount = {};
            if (window.TutorContext) {
                TutorContext.reset();
                TutorContext.update({ screen: 'game', phase: 'selectItem', difficulty: this.state.settings.difficulty, totalQuestions: this.state.settings.questionCount, questionIndex: 0 });
                const _vm = this;
                TutorContext.getLiveData = () => {
                    const gs = _vm.state.gameState;
                    const target = gs.targetProduct || gs.selectedProduct;
                    return {
                        itemName: target?.name    || null,
                        price:    target?.price   ?? null,
                        inserted: gs.insertedAmount  ?? 0,
                        change:   gs.changeAmount    ?? 0,
                        wallet:   _vm.state.settings.walletAmount ?? null,
                    };
                };
            }

            // 簡單模式魔法商品：設定動態價格
            if (this.state.settings.difficulty === 'easy' &&
                this.state.settings.productType === 'magic' &&
                this.state.gameState.customProducts.length > 0) {
                this.setEasyModeMagicProductPrices();
            }

            // 保存原始錢包金額上限設定（50或100）
            if (!this.state.gameState.maxWalletAmountLimit) {
                this.state.gameState.maxWalletAmountLimit = this.state.settings.walletAmount;
            }

            // 簡單模式：先準備飲料和指定商品，再根據價格生成錢包（assigned 和 coinFirstAssigned 均使用此路徑）
            if (this.state.settings.difficulty === 'easy' && (this.state.settings.taskType === 'assigned' || this.state.settings.taskType === 'coinFirstAssigned')) {
                this.prepareShoppingSessionForEasyMode();
            } else {
                // 普通/困難模式或自選模式：先生成錢包再進入歡迎畫面
                this.generateWalletCoins();
                this.showWelcomeScreen();
            }

            // 重置啟動標記（在畫面切換後）
            // 🔧 [Phase 2] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                this.state.gameState.isStarting = false;
            }, 500, 'screenTransition');
        },

        // 簡單模式專用：先準備飲料再生成對應錢包
        prepareShoppingSessionForEasyMode() {
            // 1. 選擇飲料（優先使用魔法商品）
            let selected;
            if (this.state.settings.productType === 'magic' && this.state.gameState.customProducts.length > 0) {
                // 魔法商品模式：使用自訂商品 + 隨機補足到14種
                const customProducts = this.state.gameState.customProducts;
                const remainingCount = 18 - customProducts.length;

                if (remainingCount > 0) {
                    // 從預設飲料中隨機選擇剩餘數量
                    const allBeverages = Object.values(BEVERAGE_DATABASE);
                    const shuffled = allBeverages.sort(() => Math.random() - 0.5);
                    const defaultProducts = shuffled.slice(0, remainingCount);
                    selected = [...customProducts, ...defaultProducts];
                } else {
                    // 自訂商品已達14種或更多，只使用前14種
                    selected = customProducts.slice(0, 18);
                }
            } else {
                // 預設模式：隨機選擇 14 種飲料
                const allBeverages = Object.values(BEVERAGE_DATABASE);
                const shuffled = allBeverages.sort(() => Math.random() - 0.5);
                selected = shuffled.slice(0, 18);
            }

            // 2. 為每種飲料生成價格（自訂商品使用設定的價格，預設飲料浮動±10%）
            this.state.gameState.currentProducts = selected.map(beverage => {
                // 檢查是否為自訂商品（有 imageUrl 屬性）
                if (beverage.imageUrl) {
                    // 自訂商品：使用設定的價格
                    return beverage;
                } else {
                    // 預設飲料：生成浮動價格
                    const variation = (Math.random() * 0.2 - 0.1);
                    const newPrice = Math.round(beverage.basePrice * (1 + variation));
                    return {
                        ...beverage,
                        price: Math.max(10, newPrice)
                    };
                }
            });

            // 3. 選擇指定商品（魔法商品模式：優先選擇使用次數較少的魔法商品）
            let newTarget;
            let attempts = 0;
            const lastTargetId = this.state.gameState.lastTargetProductId;

            if (this.state.settings.productType === 'magic' && this.state.gameState.customProducts.length > 0) {
                // 魔法商品模式：優先選擇未使用過的魔法商品
                const customProducts = this.state.gameState.customProducts;
                const usageCount = this.state.gameState.customProductsUsageCount;

                // 找出未使用過的魔法商品（使用次數為0）
                const unusedMagicProducts = customProducts.filter(p => (usageCount[p.id] || 0) === 0);

                if (unusedMagicProducts.length > 0) {
                    // 還有未使用過的魔法商品，從中隨機選一個
                    newTarget = unusedMagicProducts[Math.floor(Math.random() * unusedMagicProducts.length)];

                    // 更新使用次數
                    usageCount[newTarget.id] = 1;

                    VendingMachine.Debug.log('product', ` 選擇未使用的魔法商品: ${newTarget.name}, 剩餘未使用: ${unusedMagicProducts.length - 1}`);
                    VendingMachine.Debug.log('product', ' 所有魔法商品使用統計:', usageCount);
                } else {
                    // 所有魔法商品都已使用過，改為從所有商品中隨機選擇（確保與上一輪不同）
                    VendingMachine.Debug.log('product', ' 所有魔法商品已使用完畢，改為隨機選擇其他商品');
                    do {
                        const randomIndex = Math.floor(Math.random() * this.state.gameState.currentProducts.length);
                        newTarget = this.state.gameState.currentProducts[randomIndex];
                        attempts++;
                    } while (newTarget.id === lastTargetId && this.state.gameState.currentProducts.length > 1 && attempts < 50);
                }
            } else {
                // 非魔法商品模式：隨機選擇（確保與上一輪不同）
                do {
                    const randomIndex = Math.floor(Math.random() * this.state.gameState.currentProducts.length);
                    newTarget = this.state.gameState.currentProducts[randomIndex];
                    attempts++;
                } while (newTarget.id === lastTargetId && this.state.gameState.currentProducts.length > 1 && attempts < 50);
            }

            this.state.gameState.targetProduct = newTarget;
            this.state.gameState.lastTargetProductId = newTarget.id;

            VendingMachine.Debug.log('product', `指定飲料: ${newTarget.name}, 上一輪: ${lastTargetId || '無'}`);

            // 4. 根據設定的錢包金額範圍和指定商品價格，隨機生成錢包金額
            const productPrice = this.state.gameState.targetProduct.price;
            const maxWalletAmount = this.state.gameState.maxWalletAmountLimit; // 使用原始上限（50或100）

            // 生成隨機錢包金額
            let newWalletAmount;

            // 簡單模式：錢包金額 = 商品價格（剛好付款，不需找零）
            newWalletAmount = productPrice;
            VendingMachine.Debug.log('flow', ' 簡單模式：錢包金額設定為商品價格', newWalletAmount);

            this.state.gameState.lastWalletAmount = newWalletAmount;
            this.state.settings.walletAmount = newWalletAmount;

            VendingMachine.Debug.log('coin', ` 商品價格: ${productPrice}元, 錢包金額上限: ${maxWalletAmount}元, 本次生成: ${newWalletAmount}元, 上一輪: ${this.state.gameState.lastWalletAmount || '無'}元`);

            // 5. 生成錢包硬幣組成
            VendingMachine.Debug.log('flow', ' 準備生成錢包硬幣組成');
            this.generateWalletCoins();

            // 6. 進入歡迎畫面
            VendingMachine.Debug.log('flow', ' 準備進入歡迎畫面');
            this.showWelcomeScreen();
            VendingMachine.Debug.log('flow', ' 歡迎畫面顯示完成');
        },

        // 生成錢包硬幣組成（隨機組合，總數不超過10個，確保多樣性）
        generateWalletCoins() {
            const total = this.state.settings.walletAmount;

            // 自訂錢包：直接使用用戶選擇的精確幣值組合
            if (this.state.settings.customWalletDetails && typeof total === 'number') {
                const coins = {};
                for (const [denom, qty] of Object.entries(this.state.settings.customWalletDetails)) {
                    if (qty > 0) coins[parseInt(denom)] = qty;
                }
                this.state.gameState.walletCoins = coins;
                VendingMachine.Debug.log('coin', '[A1] 自訂錢包已應用:', coins, '總金額:', total);
                return;
            }

            // 根據金額決定可用的硬幣類型
            let coinTypes;
            if (total <= 50) {
                // 50元以內：只使用 1元、5元、10元
                coinTypes = [10, 5, 1];
            } else {
                // 100元以內：使用 1元、5元、10元、50元
                coinTypes = [50, 10, 5, 1];
            }

            // 隨機生成符合金額且不超過10個硬幣的組合
            let attempts = 0;
            let result = {};

            while (attempts < 200) {
                result = {};
                let remaining = total;
                let totalCoins = 0;

                // 從大到小隨機分配硬幣，但限制大面額硬幣數量以增加多樣性
                for (let i = 0; i < coinTypes.length; i++) {
                    const coinValue = coinTypes[i];

                    if (remaining >= coinValue && totalCoins < 10) {
                        // 計算可以用這種硬幣的最大數量
                        let maxPossible = Math.min(
                            Math.floor(remaining / coinValue),
                            10 - totalCoins
                        );

                        // 對於大面額硬幣（50元、10元），限制最大數量以增加多樣性
                        if (coinValue === 50) {
                            maxPossible = Math.min(maxPossible, 1); // 50元最多1個
                        } else if (coinValue === 10) {
                            maxPossible = Math.min(maxPossible, 5); // 10元最多5個
                        }

                        if (maxPossible > 0) {
                            // 隨機選擇使用 0 到 maxPossible 個這種硬幣
                            // 增加使用硬幣的機率（70%機率使用）
                            if (Math.random() < 0.7) {
                                const count = Math.floor(Math.random() * maxPossible) + 1;

                                if (count > 0) {
                                    result[coinValue] = count;
                                    remaining -= coinValue * count;
                                    totalCoins += count;
                                }
                            }
                        }
                    }
                }

                // 如果剛好湊齊金額且不超過10個，成功
                if (remaining === 0 && totalCoins <= 10 && totalCoins > 0) {
                    // 確保至少使用2種硬幣類型以增加多樣性
                    const coinTypeCount = Object.keys(result).length;
                    if (coinTypeCount >= 2 || attempts > 100) {
                        break;
                    }
                }

                attempts++;
            }

            // 如果隨機生成失敗，使用改進的貪心算法
            if (attempts >= 200 || Object.keys(result).length === 0) {
                result = {};
                let remaining = total;
                let totalCoins = 0;

                // 改進的貪心算法：避免只用大面額硬幣
                for (let i = 0; i < coinTypes.length; i++) {
                    const coinValue = coinTypes[i];

                    if (remaining >= coinValue && totalCoins < 10) {
                        let maxCount = Math.min(
                            Math.floor(remaining / coinValue),
                            10 - totalCoins
                        );

                        // 限制大面額硬幣數量
                        if (coinValue === 50) {
                            maxCount = Math.min(maxCount, 1);
                        } else if (coinValue === 10) {
                            maxCount = Math.min(maxCount, 5);
                        }

                        if (maxCount > 0) {
                            result[coinValue] = maxCount;
                            remaining -= coinValue * maxCount;
                            totalCoins += maxCount;
                        }
                    }
                }
            }

            this.state.gameState.walletCoins = result;
            const totalCoinCount = Object.values(result).reduce((sum, count) => sum + count, 0);
            VendingMachine.Debug.log('coin', ' 錢包組成:', result, '總硬幣數:', totalCoinCount);
        },

        // 歡迎畫面
        showWelcomeScreen() {
            VendingMachine.Debug.log('ui', ' 開始顯示歡迎畫面');
            const app = document.getElementById('app');
            VendingMachine.Debug.log('ui', ' app 元素:', app);

            // 更新場景狀態
            this.state.currentScene = 'welcome';

            app.innerHTML = `
                <style>
                    /* 重置 body 樣式 */
                    body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100vh;
                        overflow: hidden;
                    }

                    /* 歡迎畫面佔滿整個視窗 */
                    .welcome-screen {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        text-align: center;
                    }

                    .welcome-content {
                        max-width: 600px;
                        padding: 2rem;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                        animation: fadeInScale 1s ease-out;
                    }

                    .welcome-title h1 {
                        font-size: 6rem;
                        margin-bottom: 1rem;
                        animation: bounceWelcome 1.5s ease-in-out infinite;
                    }

                    .welcome-title h2 {
                        font-size: 2rem;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                        margin: 0;
                    }

                    /* @keyframes fadeInScale, bounce 已移至 injectGlobalAnimationStyles() */

                    /* 響應式調整 */
                    @media (max-width: 768px) {
                        .welcome-title h1 {
                            font-size: 5rem;
                        }
                        .welcome-title h2 {
                            font-size: 2rem;
                        }
                    }
                </style>

                <div class="welcome-screen">
                    <div class="welcome-content">
                        <div class="welcome-title">
                            <h1>🥤</h1>
                            <h2>歡迎來到自動飲料販賣機</h2>
                        </div>
                    </div>
                </div>
            `;

            // 如果啟用輔助點擊模式，初始化
            if (this.state.settings.clickMode) {
                this.initClickModeForWelcome();
            }

            // 播放語音並延遲進入下一個畫面
            this.speech.speak(UI_TEXT.welcome.speech, {
                callback: () => {
                    // 如果是點擊模式，不自動進入下一畫面，等待用戶點擊
                    if (!this.state.settings.clickMode) {
                        // 🔧 [Phase 2] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            this.showWalletIntroScreen();
                        }, 500, 'screenTransition');
                    }
                }
            });
        },

        // 錢包介紹畫面
        showWalletIntroScreen() {
            const app = document.getElementById('app');
            const walletTotal = this.state.settings.walletAmount;
            const coins = this.state.gameState.walletCoins;

            app.innerHTML = `
                <style>
                    /* 重置 body 樣式 */
                    body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100vh;
                        overflow: hidden;
                    }

                    /* 錢包介紹畫面佔滿整個視窗 */
                    .wallet-intro-screen {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                        color: white;
                        text-align: center;
                    }

                    .wallet-intro-content {
                        width: auto;
                        max-width: 90%;
                        padding: 3rem;
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    }

                    .wallet-title {
                        font-size: 4rem;
                        margin-bottom: 2rem;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                    }

                    /* 響應式調整 */
                    @media (max-width: 768px) {
                        .wallet-title {
                            font-size: 2.5rem;
                        }
                        .wallet-intro-content {
                            padding: 2rem;
                        }
                    }
                    .wallet-amount h2 {
                        font-size: 2.5rem;
                        margin-bottom: 2rem;
                        background: rgba(255, 255, 255, 0.2);
                        padding: 1rem;
                        border-radius: 15px;
                    }
                    .wallet-coins {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 20px;
                        margin-top: 2rem;
                    }
                    .coin-group {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        background: rgba(255, 255, 255, 0.9);
                        border-radius: 15px;
                        padding: 15px;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                        animation: coinFloat 2s ease-in-out infinite alternate;
                        min-width: 100px;
                    }
                    .coin-group img {
                        width: 70px;
                        height: 70px;
                        object-fit: contain;
                        margin-bottom: 10px;
                    }
                    .coin-info {
                        text-align: center;
                        color: #333;
                    }
                    .coin-name {
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .coin-count {
                        font-size: 16px;
                        font-weight: bold;
                        color: #e74c3c;
                        background: rgba(231, 76, 60, 0.1);
                        padding: 3px 8px;
                        border-radius: 12px;
                    }
                    /* @keyframes coinFloat 已移至 injectGlobalAnimationStyles() */
                </style>

                <div class="wallet-intro-screen">
                    <div class="wallet-intro-content">
                        <h1 class="wallet-title"><img src="../images/common/icons_wallet.png" alt="💰" style="width:1.5em;height:1.5em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='💰'"> 您的錢包</h1>
                        <div class="wallet-amount">
                            <h2>總金額：${walletTotal} 元</h2>
                        </div>
                        <div class="wallet-coins">
                            ${this.renderWalletCoins(coins)}
                        </div>
                    </div>
                </div>
            `;

            // 更新場景狀態
            this.state.currentScene = 'wallet-intro';

            // 播放語音
            const speechText = UI_TEXT.wallet.speechTemplate.replace('{amount}', walletTotal);
            this.speech.speak(speechText, {
                callback: () => {
                    // 如果是點擊模式，不自動進入下一畫面，等待用戶點擊
                    if (!this.state.settings.clickMode) {
                        // 🔧 [Phase 2] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            this.prepareShoppingSession();
                        }, 500, 'screenTransition');
                    }
                }
            });
        },

        // 渲染錢包硬幣
        renderWalletCoins(coins) {
            return Object.entries(coins)
                .sort(([a], [b]) => b - a)
                .map(([value, count]) => {
                    const side = Math.random() > 0.5 ? 'front' : 'back'; // 🆕 隨機正反面
                    return `
                    <div class="coin-group">
                        <img src="../images/money/${value}_yuan_${side}.png" alt="${value}元"
                             onerror="this.outerHTML='<div style=\\'width:70px;height:70px;background:#ddd;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;\\'>${value}元</div>'">
                        <div class="coin-info">
                            <div class="coin-name">${value} 元</div>
                            <div class="coin-count">× ${count}</div>
                        </div>
                    </div>
                `;
                }).join('');
        },

        // 準備購物場景（選擇飲料、生成價格、顯示任務）
        prepareShoppingSession() {
            // 簡單模式且已經準備好飲料，直接進入購物場景（assigned 和 coinFirstAssigned 均適用）
            if (this.state.settings.difficulty === 'easy' &&
                (this.state.settings.taskType === 'assigned' || this.state.settings.taskType === 'coinFirstAssigned') &&
                this.state.gameState.currentProducts.length > 0 &&
                this.state.gameState.targetProduct) {
                this.showShoppingScreen();
                return;
            }

            // 1. 選擇飲料（優先使用魔法商品）
            let selected;
            if (this.state.settings.productType === 'magic' && this.state.gameState.customProducts.length > 0) {
                // 魔法商品模式：使用自訂商品 + 隨機補足到14種
                const customProducts = this.state.gameState.customProducts;
                const remainingCount = 18 - customProducts.length;

                if (remainingCount > 0) {
                    // 從預設飲料中隨機選擇剩餘數量
                    const allBeverages = Object.values(BEVERAGE_DATABASE);
                    const shuffled = allBeverages.sort(() => Math.random() - 0.5);
                    const defaultProducts = shuffled.slice(0, remainingCount);
                    selected = [...customProducts, ...defaultProducts];
                } else {
                    // 自訂商品已達14種或更多，只使用前14種
                    selected = customProducts.slice(0, 18);
                }
            } else {
                // 預設模式：隨機選擇 14 種飲料
                const allBeverages = Object.values(BEVERAGE_DATABASE);
                const shuffled = allBeverages.sort(() => Math.random() - 0.5);
                selected = shuffled.slice(0, 18);
            }

            // 2. 為每種飲料生成價格（自訂商品使用設定的價格，預設飲料浮動±10%）
            this.state.gameState.currentProducts = selected.map(beverage => {
                // 檢查是否為自訂商品（有 imageUrl 屬性）
                if (beverage.imageUrl) {
                    // 自訂商品：使用設定的價格
                    return beverage;
                } else {
                    // 預設飲料：生成浮動價格
                    const variation = (Math.random() * 0.2 - 0.1); // -10% 到 +10%
                    const newPrice = Math.round(beverage.basePrice * (1 + variation));
                    return {
                        ...beverage,
                        price: Math.max(10, newPrice) // 最低 10 元
                    };
                }
            });

            VendingMachine.Debug.log('product', ' 本回合飲料:', this.state.gameState.currentProducts);

            // 3. 如果是指定任務（assigned 或 coinFirstAssigned），隨機選一個在錢包金額內的飲料（確保不重複）
            if (this.state.settings.taskType === 'assigned' || this.state.settings.taskType === 'coinFirstAssigned') {
                const affordable = this.state.gameState.currentProducts.filter(
                    p => p.price <= this.state.settings.walletAmount
                );
                if (affordable.length > 0) {
                    let newTarget;
                    let attempts = 0;
                    const lastTargetId = this.state.gameState.lastTargetProductId;

                    // 魔法商品模式：優先選擇未使用過的魔法商品
                    if (this.state.settings.productType === 'magic' && this.state.gameState.customProducts.length > 0) {
                        const usageCount = this.state.gameState.customProductsUsageCount;
                        const customIds = new Set(this.state.gameState.customProducts.map(p => p.id));

                        // 找出未使用過且在錢包金額內的魔法商品
                        const unusedAffordableMagic = affordable.filter(
                            p => customIds.has(p.id) && (usageCount[p.id] || 0) === 0
                        );

                        if (unusedAffordableMagic.length > 0) {
                            // 還有未使用過的魔法商品，從中隨機選一個（避免與上一輪相同）
                            const candidates = unusedAffordableMagic.length > 1
                                ? unusedAffordableMagic.filter(p => p.id !== lastTargetId)
                                : unusedAffordableMagic;
                            newTarget = candidates[Math.floor(Math.random() * candidates.length)];

                            // 更新使用次數
                            usageCount[newTarget.id] = 1;

                            VendingMachine.Debug.log('product', `[魔法優先] 選擇未使用的魔法商品: ${newTarget.name}, 剩餘未使用: ${unusedAffordableMagic.length - 1}`);
                            VendingMachine.Debug.log('product', ' 所有魔法商品使用統計:', usageCount);
                        } else {
                            // 所有魔法商品都已使用過，改為從所有可負擔商品中隨機選擇（確保與上一輪不同）
                            VendingMachine.Debug.log('product', '[魔法優先] 所有魔法商品已使用完畢，改為隨機選擇');
                            do {
                                newTarget = affordable[Math.floor(Math.random() * affordable.length)];
                                attempts++;
                            } while (newTarget.id === lastTargetId && affordable.length > 1 && attempts < 50);
                        }
                    } else {
                        // 非魔法商品模式：隨機選擇（確保與上一輪不同）
                        do {
                            newTarget = affordable[Math.floor(Math.random() * affordable.length)];
                            attempts++;
                        } while (newTarget.id === lastTargetId && affordable.length > 1 && attempts < 50);
                    }

                    this.state.gameState.targetProduct = newTarget;
                    this.state.gameState.lastTargetProductId = newTarget.id;

                    VendingMachine.Debug.log('product', `指定飲料: ${newTarget.name}, 上一輪: ${lastTargetId || '無'}`);

                    // 直接進入購物場景，稍後以彈跳視窗顯示任務
                    this.showShoppingScreen();
                } else {
                    this.showToast('錢包金額不足以購買任何飲料，請重新設定', 'error');
                    this.showSettings();
                }
            } else {
                // 自選模式（freeChoice / coinFirstFree）：直接進入購物
                this.showShoppingScreen();
            }
        },

        // 🔧 [新增] 彈跳視窗顯示指定商品（參考 a1）
        showTargetItemModal() {
            const targetProduct = this.state.gameState.targetProduct;

            if (!targetProduct) {
                VendingMachine.Debug.error('❌ 找不到已生成的指定商品');
                return;
            }

            // 創建模態視窗
            const modal = document.createElement('div');
            modal.id = 'target-item-modal';
            modal.className = 'target-item-modal';

            modal.innerHTML = `
                <div class="modal-content" onclick="event.stopPropagation();">
                    <div class="modal-header">
                        <h2>🎯 購買任務</h2>
                        <button class="close-modal-btn" onclick="event.stopPropagation(); event.preventDefault(); VendingMachine.closeTargetItemModal();">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="target-item-display">
                            <div class="item-image">
                                <img src="${targetProduct.imageUrl || targetProduct.image}" alt="${targetProduct.name}"
                                     style="width: 128px; height: 128px; object-fit: contain; border-radius: 12px; background: white;"
                                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22180%22%3E%3Crect width=%22120%22 height=%22180%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2214%22 text-anchor=%22middle%22 fill=%22%23999%22%3E${targetProduct.name}%3C/text%3E%3C/svg%3E'">
                            </div>
                            <div class="item-info">
                                <h3 class="item-name">${targetProduct.name}</h3>
                                <p class="item-price">${targetProduct.price} 元</p>
                            </div>
                        </div>
                        <div class="task-instruction">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <button class="speaker-btn-inline" onclick="event.stopPropagation(); event.preventDefault(); VendingMachine.repeatTaskVoice();" title="重新播放任務語音">
                                    🔊
                                </button>
                                <p style="margin: 0;">請購買 <strong>${targetProduct.name}</strong></p>
                            </div>
                            <p>價格：<strong>${targetProduct.price} 元</strong></p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="start-shopping-btn" onclick="event.stopPropagation(); event.preventDefault(); VendingMachine.closeTargetItemModal();">
                            ${this.state.settings.taskType === 'coinFirstAssigned' ? '開始投幣' : '開始購物'}
                        </button>
                    </div>
                </div>

                <style>
                    .target-item-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(5px);
                        z-index: 10000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        animation: modalFadeIn 0.3s ease-out;
                    }

                    .modal-content {
                        position: relative;
                        background: white;
                        border-radius: 20px;
                        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
                        max-width: 480px;
                        width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                        animation: modalSlideIn 0.3s ease-out;
                        border: 4px solid var(--vm-primary);
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 25px 15px;
                        border-bottom: 2px solid #f0f0f0;
                    }

                    .modal-header h2 {
                        margin: 0;
                        color: #333;
                        font-size: 1.5rem;
                        text-align: center;
                        flex: 1;
                    }

                    .speaker-btn-inline {
                        background: linear-gradient(135deg, #4caf50, #45a049);
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: white;
                        padding: 8px;
                        border-radius: 50%;
                        width: 45px;
                        height: 45px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
                        flex-shrink: 0;
                    }

                    .speaker-btn-inline:hover {
                        transform: scale(1.1);
                        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.5);
                    }

                    .speaker-btn-inline:active {
                        transform: scale(0.95);
                    }

                    .close-modal-btn {
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                        padding: 5px;
                        border-radius: 50%;
                        width: 35px;
                        height: 35px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .close-modal-btn:hover {
                        background: #f0f0f0;
                        color: #333;
                    }

                    .modal-body {
                        padding: 25px;
                        text-align: center;
                    }

                    .target-item-display {
                        background: #f8f9fa;
                        border-radius: 15px;
                        padding: 20px;
                        margin-bottom: 20px;
                    }

                    .item-image {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 15px;
                    }

                    .item-info {
                        margin-top: 15px;
                    }

                    .item-name {
                        font-size: 1.5rem;
                        color: #333;
                        margin: 0 0 10px 0;
                        font-weight: bold;
                    }

                    .item-price {
                        font-size: 1.8rem;
                        color: var(--vm-accent);
                        font-weight: bold;
                        margin: 0;
                    }

                    .task-instruction {
                        background: #fff9e6;
                        border: 1px solid #ffc700;
                        padding: 15px;
                        border-radius: 8px;
                        text-align: center;
                    }

                    .task-instruction p {
                        margin: 8px 0;
                        color: #333;
                        font-size: 1rem;
                    }

                    .task-instruction strong {
                        color: var(--vm-primary);
                    }

                    .modal-footer {
                        padding: 15px 25px 20px;
                        border-top: 2px solid #f0f0f0;
                    }

                    .start-shopping-btn {
                        width: 100%;
                        padding: 15px;
                        background: linear-gradient(135deg, var(--vm-primary), var(--vm-primary-dark));
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 1.1rem;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }

                    .start-shopping-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(0, 136, 77, 0.3);
                    }

                    /* @keyframes modalFadeIn, modalSlideIn 已移至 injectGlobalAnimationStyles() */
                </style>
            `;

            // 點擊外層遮罩關閉彈窗
            this.EventManager.on(modal, 'click', (e) => {
                if (e.target === modal) {
                    this.closeTargetItemModal();
                }
            }, {}, 'gameUI');

            document.body.appendChild(modal);

            // 播放語音
            const speechText = UI_TEXT.task.assigned.speechTemplate
                .replace('{productName}', targetProduct.name)
                .replace('{price}', targetProduct.price);

            this.speech.speak(speechText);
        },

        // 重新播放任務語音（喇叭按鈕功能）
        repeatTaskVoice() {
            const targetProduct = this.state.gameState.targetProduct;

            if (!targetProduct) {
                VendingMachine.Debug.error('❌ 找不到指定商品');
                return;
            }

            // 播放點擊音效
            this.audio.play('click');

            // 播放任務語音
            const speechText = UI_TEXT.task.assigned.speechTemplate
                .replace('{productName}', targetProduct.name)
                .replace('{price}', targetProduct.price);

            this.speech.speak(speechText);
            VendingMachine.Debug.log('speech', ' 重新播放任務語音:', speechText);
        },

        // 關閉任務彈跳視窗
        closeTargetItemModal() {
            const modal = document.getElementById('target-item-modal');
            if (modal) {
                modal.remove();
            }

            if (this.state.settings.taskType === 'coinFirstAssigned') {
                // coinFirstAssigned: 彈窗關閉後才初始化先投幣畫面提示
                this._initCoinFirstScreen();
            } else if (this.state.settings.difficulty === 'easy' && this.state.gameState.targetProduct) {
                // 其他指定任務簡單模式：設置初始流程步驟並提示選擇目標產品
                this.setFlowStep('SELECT_PRODUCT');
                const targetProductId = this.state.gameState.targetProduct.id;
                this.showEasyModeHint('select_product', `[data-product-id="${targetProductId}"]`);
            }
        },

        // 購物畫面（販賣機主畫面）
        showShoppingScreen() {
            const app = document.getElementById('app');
            const products = this.state.gameState.currentProducts;

            app.innerHTML = `
                <style>
                    /* 確保測驗頁面不被限縮 */
                    body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        overflow-x: hidden;
                    }

                    #app {
                        width: 100%;
                        height: 100%;
                    }

                    .main-container {
                        width: 100vw;
                        min-height: 100vh;
                        max-width: none !important;
                        display: flex;
                        flex-direction: column;
                    }

                    /* 標題列樣式 - 使用 a5 綠色主題 */
                    .title-bar {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: linear-gradient(135deg, var(--vm-primary) 0%, var(--vm-primary-dark) 100%);
                        color: white;
                        padding: 15px 25px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                        position: sticky;
                        top: 0;
                        z-index: 10200;
                    }

                    .title-bar-left {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        flex: 0 0 auto;
                    }

                    .title-bar-center {
                        flex: 1;
                        text-align: center;
                        font-size: 18px;
                        font-weight: bold;
                    }

                    .title-bar-right {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        flex: 0 0 auto;
                    }

                    .back-to-menu-btn {
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        padding: 8px 16px;
                        border-radius: 20px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s ease;
                    }

                    .back-to-menu-btn:hover {
                        background: rgba(255, 255, 255, 0.3);
                        transform: translateY(-1px);
                    }

                    .main-content-wrapper {
                        flex: 1;
                        display: flex;
                        gap: 20px;
                    }

                    @media (max-width: 768px) {
                        .title-bar {
                            flex-direction: column;
                            gap: 10px;
                            text-align: center;
                        }
                    }

                    /* 簡單模式視覺提示樣式 */
                    .easy-mode-hint {
                        position: relative;
                        animation: pulseHint 1.5s ease-in-out infinite;
                        box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.8) !important;
                        z-index: 10 !important;
                    }

                    .easy-mode-hint::before {
                        content: '';
                        position: absolute;
                        top: -8px;
                        left: -8px;
                        right: -8px;
                        bottom: -8px;
                        border: 5px solid #FFC107;
                        border-radius: inherit;
                        box-shadow: 0 0 20px rgba(255, 193, 7, 0.8), 0 0 40px rgba(255, 193, 7, 0.5), inset 0 0 20px rgba(255, 193, 7, 0.3);
                        animation: borderPulse 1.5s ease-in-out infinite;
                        pointer-events: none;
                        z-index: 1;
                    }

                    .easy-mode-hint::after {
                        content: '↓ 點這裡';
                        position: absolute;
                        top: -45px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: linear-gradient(135deg, #FFC107 0%, #FFA000 100%);
                        color: #333;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 14px;
                        font-weight: bold;
                        white-space: nowrap;
                        box-shadow: 0 4px 12px rgba(255, 193, 7, 0.5), 0 0 15px rgba(255, 193, 7, 0.3);
                        animation: bounceHint 1s ease-in-out infinite;
                        pointer-events: none;
                        z-index: 1000;
                    }

                    /* @keyframes pulseHint, borderPulse, bounceHint 已移至 injectGlobalAnimationStyles() */

                    /* 針對產品項目的提示 */
                    .product-item.easy-mode-hint::after {
                        top: -45px;
                    }

                    /* 針對投幣槽的提示 */
                    .coin-slot.easy-mode-hint::after {
                        top: -45px;
                    }

                    /* 針對個別硬幣的提示 */
                    .individual-coin.easy-mode-hint::after {
                        content: '點擊投入';
                        top: -40px;
                        font-size: 13px;
                        padding: 6px 12px;
                    }

                    .individual-coin.easy-mode-hint::before {
                        border-radius: 10px;
                    }

                    /* 針對取物口飲料的提示 */
                    .vended-product.easy-mode-hint::after {
                        content: '↓ 點擊取貨';
                        top: -50px;
                        font-size: 15px;
                        padding: 10px 18px;
                    }

                    .vended-product.easy-mode-hint::before {
                        border-radius: 12px;
                        top: -10px;
                        left: -10px;
                        right: -10px;
                        bottom: -10px;
                    }

                    /* 針對確認購買按鈕的提示 */
                    #confirmBtn.easy-mode-hint::after {
                        top: -50px;
                    }

                    /* 針對產品網格整體的提示（自選飲料模式） */
                    .product-grid.easy-mode-hint {
                        border: 4px solid #FFC107 !important;
                        animation: gridPulseHint 1.5s ease-in-out infinite;
                        overflow-y: auto;
                    }

                    .product-grid.easy-mode-hint::before {
                        display: none;
                    }

                    .product-grid.easy-mode-hint::after {
                        content: '↓ 請選擇飲料';
                        top: 4px;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 100;
                    }

                    /* @keyframes gridPulseHint 已移至 injectGlobalAnimationStyles() */

                    /* 半透明遮罩層（讓非提示區域變暗）*/
                    .hint-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.3);
                        z-index: 5;
                        pointer-events: none;
                    }
                </style>

                <!-- 標題列 -->
                <div class="title-bar">
                    <div class="title-bar-left">
                        <span style="font-size: 1.5rem;">🥤</span>
                        <span>自動販賣機測驗</span>
                    </div>
                    <div class="title-bar-center">
                        ${this.state.settings.taskType === 'assigned' ? '購買指定飲料' : this.isCoinFirstMode() ? '先投幣後選飲料' : '自由選擇購買'}
                    </div>
                    <div class="title-bar-right">
                        <span>第 ${this.state.gameState.completedQuestions + 1} 題 / 共 ${this.state.settings.questionCount} 題</span>
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                    </div>
                </div>

                <div class="main-content-wrapper">
                    <!-- 左側：販賣機主體 -->
                    <div class="machine-front">
                        <!-- 標題區 -->
                        <div class="machine-header">
                            <h1>自動販賣機</h1>
                            ${(this.state.settings.difficulty === 'hard' || this.state.settings.difficulty === 'normal') ? `
                                <div style="position:absolute;right:20px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:6px;">
                                    <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                                    <button class="hint-button" style="position:static;transform:none;" onclick="VendingMachine.showHint()" title="顯示提示">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                                        </svg>
                                        <span>提示</span>
                                    </button>
                                </div>
                            ` : ''}
                        </div>

                        <!-- 商品展示區 -->
                        <div class="product-grid" id="productGrid">
                            ${products.map(product => `
                                <div class="product-item ${this.isCoinFirstMode() ? 'coin-first-locked' : ''}" data-product-id="${product.id}" data-price="${product.price}"
                                     onclick="VendingMachine.selectProduct('${product.id}')">
                                    <img src="${product.imageUrl || product.image}" alt="${product.name}"
                                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22150%22%3E%3Crect width=%22100%22 height=%22150%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2214%22 text-anchor=%22middle%22 fill=%22%23999%22%3E${product.name}%3C/text%3E%3C/svg%3E'">
                                    <div class="product-name">${product.name}</div>
                                    <div class="product-price">${product.price} 元</div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- 取物口 -->
                        <div class="retrieval-bin" id="retrievalBin">
                            <div class="bin-label">取物口（點擊取貨）</div>
                            <div class="bin-content" id="binContent"></div>
                        </div>
                    </div>

                    <!-- 右側：操作面板 -->
                    <div class="control-panel">
                        <!-- 顯示螢幕 -->
                        <div class="display-screen" id="displayScreen">
                            <div class="screen-content">
                                ${this.state.settings.taskType === 'assigned' && this.state.gameState.targetProduct ? `
                                    <h2 id="screenTitle">請購買1瓶${this.state.gameState.targetProduct.name}</h2>
                                    <div style="display: flex; justify-content: center; margin: 10px 0;">
                                        <img src="${this.state.gameState.targetProduct.imageUrl || this.state.gameState.targetProduct.image}"
                                             alt="${this.state.gameState.targetProduct.name}"
                                             style="width: 128px; height: 128px; object-fit: contain;"
                                             onerror="this.style.display='none'">
                                    </div>
                                    <p id="screenMessage">價格：${this.state.gameState.targetProduct.price} 元</p>
                                ` : this.isCoinFirstMode() ? `
                                    <h2 id="screenTitle">請先投幣</h2>
                                    <div id="screenProductImage">
                                        <img id="screenProductImg" src="" alt=""
                                             style="width: 128px; height: 128px; object-fit: contain; display: none;">
                                    </div>
                                    <p id="screenMessage">投入足夠金額後，飲料燈號將會亮起</p>
                                ` : `
                                    <h2 id="screenTitle">請選擇飲料</h2>
                                    <div id="screenProductImage">
                                        <img id="screenProductImg" src="" alt=""
                                             style="width: 128px; height: 128px; object-fit: contain; display: none;">
                                    </div>
                                    <p id="screenMessage">請點選您想要購買的飲料</p>
                                `}
                            </div>
                        </div>

                        <!-- 金額顯示器 -->
                        <div class="amount-display">
                            <div class="amount-row">
                                <span class="amount-label">投入金額：</span>
                                <span class="amount-value" id="insertedAmount">0</span>
                                <span class="currency">元</span>
                            </div>
                            <div class="amount-row">
                                <span class="amount-label">商品金額：</span>
                                <span class="amount-value" id="productAmount">0</span>
                                <span class="currency">元</span>
                            </div>
                        </div>

                        <!-- 投幣區 -->
                        <div class="payment-area">
                            <h3>請投幣</h3>
                            <div class="coin-slot" id="coinSlot" onclick="VendingMachine.showCoinModal()">
                                <div class="coin-slot-icon" style="display: flex; justify-content: center; align-items: center;">
                                    <div style="width: 60px; height: 8px; background: #000; border-radius: 2px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);"></div>
                                </div>
                                <div class="coin-slot-text">💰 請投入硬幣<br>點擊硬幣進行投入</div>
                            </div>
                            <button class="refund-btn" onclick="VendingMachine.refundMoney()">退幣</button>
                            <div class="refund-slot" id="refundSlot">
                                <div class="refund-slot-label">退幣口</div>
                                <div class="refund-slot-output" id="refundSlotOutput"></div>
                            </div>
                        </div>

                        <!-- 操作按鈕 -->
                        <div class="action-buttons">
                            <button class="action-btn cancel-btn" onclick="VendingMachine.cancel()">取消</button>
                            <button class="action-btn confirm-btn" id="confirmBtn" onclick="VendingMachine.processPayment()">確認購買</button>
                        </div>
                    </div>
                </div><!-- 結束 main-content-wrapper -->

                <!-- 投幣選擇彈跳視窗 -->
                <div class="coin-modal hidden" id="coinModal">
                    <div class="coin-modal-overlay" onclick="VendingMachine.hideCoinModal()"></div>
                    <div class="coin-modal-content">
                        <h3>請選擇要投入的金額</h3>
                        <div class="coin-selection-grid">
                            ${this.state.settings.coinTypes.map(value => {
                                const side = Math.random() > 0.5 ? 'front' : 'back'; // 🆕 隨機正反面
                                return `
                                <div class="coin-option" onclick="VendingMachine.insertMoney(${value})">
                                    <img src="../images/money/${value}_yuan_${side}.png" alt="${value}元" class="coin-img"
                                         onerror="this.outerHTML='<div style=\\'width:80px;height:80px;background:#ddd;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;\\'>${value}元</div>'">
                                    <div class="coin-label">${value} 元</div>
                                </div>
                            `;
                            }).join('')}
                        </div>
                        <button class="modal-close-btn" onclick="VendingMachine.hideCoinModal()">關閉</button>
                    </div>
                </div>
            `;

            // 📱 行動裝置：換題重新渲染後捲回頂部（桌面不執行）
            this._mobileScrollReset();

            // coinFirst 模式：初始化飲料鎖定狀態與提示
            if (this.isCoinFirstMode()) {
                if (this.state.settings.taskType === 'coinFirstAssigned') {
                    // 先顯示任務彈窗，彈窗關閉後再由 closeTargetItemModal() 呼叫 _initCoinFirstScreen()
                    this.TimerManager.setTimeout(() => this.showTargetItemModal(), 500, 'screenTransition');
                } else {
                    // coinFirstFree: 直接初始化投幣提示
                    this._initCoinFirstScreen();
                }
                return;
            }

            // 如果有指定商品，延遲顯示任務彈跳視窗
            if (this.state.gameState.targetProduct) {
                // 只有簡單模式才一開始就高亮顯示指定飲料
                if (this.state.settings.difficulty === 'easy') {
                    this.highlightProduct(this.state.gameState.targetProduct.id);
                }

                // 延遲 500ms 顯示任務彈跳視窗，讓畫面先渲染完成
                this.TimerManager.setTimeout(() => {
                    this.showTargetItemModal();
                }, 500, 'screenTransition');
            }
        },

        // 先投幣模式初始化（showShoppingScreen 或 closeTargetItemModal 後呼叫）
        _initCoinFirstScreen() {
            const difficulty = this.state.settings.difficulty;
            const target = this.state.gameState.targetProduct;
            const isAssigned = this.state.settings.taskType === 'coinFirstAssigned';

            if (difficulty === 'easy' && target && isAssigned) {
                // 簡單模式（coinFirstAssigned）：設定流程步驟為投幣，提示投幣口
                this.setFlowStep('INSERT_COIN');
                this.showEasyModeHint('insert_coin', '#coinSlot');
                this.speech.speak(
                    `請先投幣，投入 ${this.convertAmountToSpeech(target.price)} 後，${target.name}的燈號就會亮起`
                );
            } else if (difficulty !== 'easy') {
                // 普通/困難模式：語音提示（若已投入足夠金額則不重複提示投幣）
                if (isAssigned && target) {
                    if (this.state.gameState.insertedAmount < target.price) {
                        this.speech.speak(`請投幣，投入 ${this.convertAmountToSpeech(target.price)} 後按確定，${target.name}的燈號將會亮起，再選擇飲料`);
                    }
                } else {
                    // coinFirstFree
                    this.speech.speak('請投幣，投入足夠金額後，飲料燈號將會亮起，再選擇您要的飲料');
                }
            }
        },

        // 選擇商品
        selectProduct(productId) {
            VendingMachine.Debug.log('product', ' 選擇商品:', productId);

            // 防止手機端重複觸發（touch + click）
            const now = Date.now();
            if (this._lastSelectTime && now - this._lastSelectTime < A1_DEBOUNCE.PRODUCT_SELECT) {
                VendingMachine.Debug.log('product', ' 防抖：忽略重複點擊');
                return;
            }
            this._lastSelectTime = now;

            const product = this.state.gameState.currentProducts.find(p => p.id === productId);
            if (!product) return;

            // 普通/困難模式：分開處理
            if (this.isAdvancedMode()) {
                // 如果已經選擇了飲料
                if (this.state.gameState.selectedProduct) {
                    VendingMachine.Debug.log('product', ' 已選擇過飲料:', this.state.gameState.selectedProduct.id);

                    // 普通模式 + 自選任務 或 困難模式 + 自選任務：允許未投幣時重新選擇
                    const isFreeChoiceMode = this.state.settings.taskType === 'freeChoice';
                    const isNormalOrHard = this.state.settings.difficulty === 'normal' ||
                                           this.state.settings.difficulty === 'hard';

                    if (this.state.settings.taskType === 'coinFirstFree' && isNormalOrHard) {
                        // coinFirstFree 模式：允許重新選擇已亮起的飲料（錢已在機器中，無退幣限制）
                        VendingMachine.Debug.log('product', ' coinFirstFree：允許重新選擇飲料');
                        const allProductsCFF = document.querySelectorAll('.product-item');
                        allProductsCFF.forEach(p => p.classList.remove('selected'));
                        this.state.gameState.selectedProduct = null;
                        this.updateAmounts();
                        // 繼續往下執行，讓使用者重新選擇
                    } else if (isFreeChoiceMode && isNormalOrHard) {
                        // 如果已經投幣了，播放錯誤音效並提示要先取消
                        if (this.state.gameState.insertedAmount > 0) {
                            VendingMachine.Debug.log('product', ' 自選模式：已投幣，需要先取消或退幣');
                            this.audio.play('error02');
                            this.speech.speak('請先按取消或退幣按鈕，才能重新選擇飲料');
                            this.showWarningMark(productId);
                            return;
                        } else {
                            // 如果還沒投幣，直接允許重新選擇
                            VendingMachine.Debug.log('product', ' 自選模式：未投幣，允許重新選擇商品');
                            // 清除之前的高亮
                            const allProducts = document.querySelectorAll('.product-item');
                            allProducts.forEach(p => p.classList.remove('selected'));
                            // 重置選擇狀態，允許重新選擇
                            this.state.gameState.selectedProduct = null;
                            this.updateAmounts();
                        }
                    } else {
                        // 指定任務模式：不允許重新選擇
                        this.handleNormalModeAction('selectProduct_afterSelected');
                        return;
                    }
                }

                // coinFirst 進階模式：檢查飲料是否已亮起（投入金額是否足夠）
                if (this.isCoinFirstMode()) {
                    if (this.state.gameState.insertedAmount < product.price) {
                        window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                        this.audio.play('error');
                        this.showWarningMark(productId);
                        this.speech.speak('這個飲料還沒有亮起來，請再投入更多硬幣');
                        this.handleNormalModeAction('selectLockedProduct');
                        return;
                    }
                    // coinFirstAssigned：只允許選目標飲料
                    if (this.state.settings.taskType === 'coinFirstAssigned') {
                        const cfTarget = this.state.gameState.targetProduct;
                        if (cfTarget && product.id !== cfTarget.id) {
                            window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                            window.LearningTracker?.logStep?.(`任務：投幣後選擇 ${cfTarget.name}`, false);
                            this.audio.play('error');
                            this.showWrongProductMark(productId);
                            this.speech.speak(`請選擇指定的飲料：${cfTarget.name}`);
                            this.handleNormalModeAction('selectWrongProduct');
                            return;
                        }
                        if (cfTarget) {
                            window.LearningTracker?.logStep?.(`任務：投幣後選擇 ${cfTarget.name}`, true);
                        }
                    }
                    // 飲料已亮起，可以選
                    this.audio.play('correct');
                }

                // 如果是指定任務且選錯飲料
                if (this.state.settings.taskType === 'assigned' && product.id !== this.state.gameState.targetProduct.id) {
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    window.LearningTracker?.logStep?.(`任務：選擇 ${this.state.gameState.targetProduct.name}`, false);
                    this.audio.play('error');
                    this.showWrongProductMark(productId);
                    this.speech.speak(`選錯了，請購買指定的飲料：${this.state.gameState.targetProduct.name}`);
                    this.handleNormalModeAction('selectWrongProduct');
                    return;
                }

                // 選對了！這是正確操作
                if (this.state.settings.taskType === 'assigned') {
                    window.LearningTracker?.logStep?.(`任務：選擇 ${this.state.gameState.targetProduct.name}`, true);
                    this.audio.play('correct');
                    this.startFireworksAnimation();
                }
            }

            // 簡單模式：流程驗證
            if (!this.validateAction('selectProduct', `[data-product-id="${productId}"]`)) {
                return;
            }

            // 如果已經選擇了飲料，顯示警告（非進階模式）
            if (this.state.gameState.selectedProduct && !this.isAdvancedMode()) {
                VendingMachine.Debug.log('product', ' 已選擇飲料，無法重新選擇');
                this.audio.play('error03');
                this.showWarningMark(productId);
                this.speech.speak('已經選好飲料了，請先投幣或取消');
                return;
            }

            // 如果是指定任務，檢查是否選對（非進階模式）
            if (this.state.settings.taskType === 'assigned' && !this.isAdvancedMode()) {
                if (product.id !== this.state.gameState.targetProduct.id) {
                    // 選錯飲料
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    window.LearningTracker?.logStep?.(`任務：選擇 ${this.state.gameState.targetProduct.name}`, false);
                    this.audio.play('error');
                    this.showWrongProductMark(productId);
                    this.speech.speak(`選錯了，請購買指定的飲料：${this.state.gameState.targetProduct.name}`);
                    return;
                } else {
                    // 選對飲料：播放正確音效和煙火動畫
                    window.LearningTracker?.logStep?.(`任務：選擇 ${this.state.gameState.targetProduct.name}`, true);
                    this.audio.play('correct');
                    this.startFireworksAnimation();
                }
            } else if (this.state.settings.taskType === 'coinFirstAssigned' && !this.isAdvancedMode()) {
                // coinFirstAssigned 簡單模式：檢查是否為目標飲料
                const target = this.state.gameState.targetProduct;
                if (target && product.id !== target.id) {
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    window.LearningTracker?.logStep?.(`任務：投幣後選擇 ${target.name}`, false);
                    this.audio.play('error');
                    this.showWrongProductMark(productId);
                    this.speech.speak(`選錯了，請選擇 ${target.name}`);
                    return;
                } else {
                    if (target) window.LearningTracker?.logStep?.(`任務：投幣後選擇 ${target.name}`, true);
                    this.audio.play('correct');
                    this.startFireworksAnimation();
                }
            } else if (!this.isAdvancedMode()) {
                // 自選模式：只播放點擊音效
                this.audio.play('click');
            }

            this.state.gameState.selectedProduct = product;
            this.highlightProduct(productId);
            this.updateAmounts();
            if (window.TutorContext) TutorContext.update({ phase: 'payment' });
            this._mobileScrollTo('.control-panel'); // 📱 手機：下一步（投幣）在下方面板

            // 調試日志：記錄最終選擇的商品信息
            VendingMachine.Debug.log('product', ' 最終選擇的商品:', product.name, '價格:', product.price);
            VendingMachine.Debug.log('product', ' 當前步驟:', this.state.gameState.normalMode?.currentStep);

            // coinFirst 模式：已投入足夠金額，直接進入確認購買
            if (this.isCoinFirstMode()) {
                document.getElementById('screenTitle').textContent = `您選擇了 ${product.name}`;
                // 更新 display-screen 飲料圖片（coinFirst 普通/困難模式）
                const cfImgContainer = document.getElementById('screenProductImage');
                const cfImg = document.getElementById('screenProductImg');
                if (cfImgContainer && cfImg) {
                    cfImg.src = product.imageUrl || product.image;
                    cfImg.alt = product.name;
                    cfImg.style.display = 'block';
                }
                document.getElementById('screenMessage').textContent = `請按確認購買`;
                this.speech.speak(`您選的是 ${product.name}，請按確認購買`);

                if (this.state.settings.difficulty === 'easy') {
                    this.setFlowStep('CONFIRM_PURCHASE');
                    this.clearEasyModeHint();
                    this.showEasyModeHint('confirm_purchase', '#confirmBtn');
                }
                if (this.isAdvancedMode()) {
                    this.advanceToNextStep('step3');
                }
                return;
            }

            document.getElementById('screenTitle').textContent = `您選擇了 ${product.name}`;
            // 更新 display-screen 飲料圖片（自選模式）
            const screenImgContainer = document.getElementById('screenProductImage');
            const screenImg = document.getElementById('screenProductImg');
            if (screenImgContainer && screenImg) {
                screenImg.src = product.imageUrl || product.image;
                screenImg.alt = product.name;
                screenImg.style.display = 'block';
            }
            document.getElementById('screenMessage').textContent = `價格：${product.price} 元\n請投幣購買`;
            this.speech.speak(`您選的是 ${product.name}，價格是 ${this.convertAmountToSpeech(product.price)}，請投幣`);

            // 簡單模式：選對產品後，更新流程步驟並提示點擊投幣槽
            if (this.state.settings.difficulty === 'easy') {
                this.setFlowStep('INSERT_COIN');
                this.clearEasyModeHint();
                this.showEasyModeHint('insert_coin', '#coinSlot');
            }

            // 普通/困難模式：選對產品後，進入步驟2（投幣）
            if (this.isAdvancedMode()) {
                this.advanceToNextStep('step2');
            }
        },

        // 顯示錯誤商品標記（紅色 ×）
        showWrongProductMark(productId) {
            const productElement = document.querySelector(`[data-product-id="${productId}"]`);
            if (!productElement) return;

            // 移除已存在的錯誤標記
            const existingMark = productElement.querySelector('.wrong-mark');
            if (existingMark) {
                existingMark.remove();
            }

            // 創建紅色 × 標記
            const wrongMark = document.createElement('div');
            wrongMark.className = 'wrong-mark';
            wrongMark.innerHTML = `
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="#e74c3c" opacity="0.9"/>
                    <line x1="30" y1="30" x2="70" y2="70" stroke="white" stroke-width="8" stroke-linecap="round"/>
                    <line x1="70" y1="30" x2="30" y2="70" stroke="white" stroke-width="8" stroke-linecap="round"/>
                </svg>
            `;

            // 添加樣式
            const style = document.createElement('style');
            style.textContent = `
                .wrong-mark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100px;
                    height: 100px;
                    z-index: 10;
                    pointer-events: none;
                    animation: wrongMarkAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                /* @keyframes wrongMarkAppear 已移至 injectGlobalAnimationStyles() */

                .wrong-mark svg {
                    width: 100%;
                    height: 100%;
                    filter: drop-shadow(0 4px 8px rgba(231, 76, 60, 0.5));
                }
            `;

            if (!document.querySelector('#wrong-mark-style')) {
                style.id = 'wrong-mark-style';
                document.head.appendChild(style);
            }

            productElement.appendChild(wrongMark);

            // 1.5 秒後移除標記
            this.TimerManager.setTimeout(() => {
                wrongMark.style.animation = 'wrongMarkDisappear 0.3s ease-out forwards';
                this.TimerManager.setTimeout(() => {
                    wrongMark.remove();
                }, 300, 'uiAnimation');
            }, 1500, 'uiAnimation');

            // @keyframes wrongMarkDisappear 已移至 injectGlobalAnimationStyles()
        },

        // 顯示警告標記（⚠️ emoji）- 使用產品 ID
        showWarningMark(productId) {
            const productElement = document.querySelector(`[data-product-id="${productId}"]`);
            if (!productElement) return;
            this.showWarningMarkOnElement(productElement);
        },

        // 在指定元素上顯示警告標記（⚠️ emoji）
        showWarningMarkOnElement(element) {
            if (!element) return;

            // 確保父元素有 position: relative，使警告標記正確定位
            const currentPosition = window.getComputedStyle(element).position;
            if (currentPosition === 'static') {
                element.style.position = 'relative';
            }

            // 移除已存在的警告標記
            const existingMark = element.querySelector('.warning-mark');
            if (existingMark) {
                existingMark.remove();
            }

            // 創建警告標記（⚠️ emoji）
            const warningMark = document.createElement('div');
            warningMark.className = 'warning-mark';
            warningMark.textContent = '⚠️';

            // 添加樣式
            const style = document.createElement('style');
            style.textContent = `
                .warning-mark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 80px;
                    z-index: 10;
                    pointer-events: none;
                    animation: warningMarkAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                    filter: drop-shadow(0 4px 12px rgba(255, 193, 7, 0.8));
                }

                /* @keyframes warningMarkAppear, warningMarkShake, warningMarkDisappear 已移至 injectGlobalAnimationStyles() */
            `;

            if (!document.querySelector('#warning-mark-style')) {
                style.id = 'warning-mark-style';
                document.head.appendChild(style);
            }

            element.appendChild(warningMark);

            // 添加搖晃動畫
            this.TimerManager.setTimeout(() => {
                warningMark.style.animation = 'warningMarkShake 0.3s ease-in-out 3';
            }, 600, 'uiAnimation');

            // 2 秒後移除標記
            this.TimerManager.setTimeout(() => {
                warningMark.style.animation = 'warningMarkDisappear 0.3s ease-out forwards';
                this.TimerManager.setTimeout(() => {
                    warningMark.remove();
                }, 300, 'uiAnimation');
            }, 2000, 'uiAnimation');
        },

        // 高亮商品
        highlightProduct(productId) {
            document.querySelectorAll('.product-item').forEach(item => {
                item.classList.remove('selected');
            });
            const productElement = document.querySelector(`[data-product-id="${productId}"]`);
            if (productElement) {
                productElement.classList.add('selected');
            }
        },

        // 更新金額顯示
        updateAmounts() {
            document.getElementById('insertedAmount').textContent = this.state.gameState.insertedAmount;
            const productPrice = this.state.gameState.selectedProduct ? this.state.gameState.selectedProduct.price : 0;
            document.getElementById('productAmount').textContent = productPrice;
        },

        // 簡單模式視覺提示管理
        /**
         * 🔧 啟用視覺同步延遲機制（參考 A5 ATM）
         * 核心創新：等待視覺提示出現後 0.5秒 才允許點擊
         * @param {string} source - 觸發來源（用於調試）
         */
        enableClickModeWithVisualDelay(source = 'unknown') {
            const clickState = this.state.gameState.clickModeState;

            // 1. 立即鎖定，防止畫面剛出來瞬間的誤觸
            clickState.waitingForClick = false;

            // 清除舊的計時器（如果有的話）
            if (clickState._visualDelayTimer) {
                this.TimerManager.clearTimeout(clickState._visualDelayTimer);
            }

            // 🔧 修復：檢查是否有活動的操作序列
            const hasActiveQueue = clickState.actionQueue &&
                                   clickState.actionQueue.length > 0 &&
                                   clickState.currentStep < clickState.actionQueue.length;

            // 2. 檢測是否已有視覺提示在畫面上
            const existingHintElement = document.querySelector('.easy-mode-hint');

            if (existingHintElement) {
                // 視覺提示已存在，立即解鎖（因為用戶已經看到了）
                VendingMachine.Debug.log('assist', ` 🔍 視覺提示已存在 (${source})，立即解鎖`);

                // 🔧 修復：只有在有活動操作序列時才設定 waitingForClick
                // 否則設定 waitingForStart 等待建立新序列
                // 🔧 修復2：如果正在執行中（isExecuting=true），不要設定任何等待狀態
                // 讓 executeNextAction 來處理階段轉換
                if (clickState.isExecuting) {
                    VendingMachine.Debug.log('assist', ` 🔍 操作執行中，跳過等待狀態設定`);
                } else if (hasActiveQueue) {
                    clickState.waitingForClick = true;
                } else {
                    clickState.waitingForStart = true;
                    VendingMachine.Debug.log('assist', ` 🔍 無活動序列，設定 waitingForStart`);
                }
                // 🔧 時間回溯：讓系統認為「已經準備好很久了」
                clickState.clickReadyTime = Date.now() - 1000;
                // 🔧 修復：不要在這裡設定 isExecuting = false
                // 讓 executeNextAction 來控制這個標誌
            } else {
                // 視覺提示尚未出現，等待 0.5秒 後解鎖
                VendingMachine.Debug.log('assist', ` 🔒 視覺元素出現 (${source})，啟動 0.5秒 安全鎖定...`);

                clickState._visualDelayTimer = this.TimerManager.setTimeout(() => {
                    if (clickState) {
                        // 🔧 修復：如果正在執行中，跳過
                        if (clickState.isExecuting) {
                            VendingMachine.Debug.log('assist', ` 🔍 操作執行中，跳過 0.5秒 解鎖`);
                            return;
                        }
                        // 🔧 修復：在 timeout 執行時重新檢查是否有活動序列
                        const hasActiveQueueNow = clickState.actionQueue &&
                                                   clickState.actionQueue.length > 0 &&
                                                   clickState.currentStep < clickState.actionQueue.length;
                        if (hasActiveQueueNow) {
                            clickState.waitingForClick = true;
                        } else {
                            clickState.waitingForStart = true;
                        }
                        // 🔧 時間回溯 1000ms
                        clickState.clickReadyTime = Date.now() - 1000;
                        // 🔧 修復：不要在這裡設定 isExecuting = false
                        VendingMachine.Debug.log('assist', ` 🟢 0.5秒已過，解除鎖定 (已繞過防誤觸檢查)`);
                    }
                }, 500, 'clickMode');

                // 🛡️ 安全網：1.5秒後強制解鎖（防止系統卡死）
                this.TimerManager.setTimeout(() => {
                    if (clickState && !clickState.waitingForClick && !clickState.waitingForStart) {
                        // 🔧 修復：如果正在執行中，跳過安全網
                        if (clickState.isExecuting) {
                            VendingMachine.Debug.log('assist', ` 🔍 操作執行中，跳過安全網解鎖`);
                            return;
                        }
                        VendingMachine.Debug.log('assist', ` ⚠️ 無視覺提示，啟動安全網解鎖 (${source})`);
                        // 🔧 修復：安全網也要檢查活動序列
                        const hasActiveQueueNow = clickState.actionQueue &&
                                                   clickState.actionQueue.length > 0 &&
                                                   clickState.currentStep < clickState.actionQueue.length;
                        if (hasActiveQueueNow) {
                            clickState.waitingForClick = true;
                        } else {
                            clickState.waitingForStart = true;
                        }
                        clickState.clickReadyTime = Date.now() - 1000;
                        // 🔧 修復：不要在這裡設定 isExecuting = false
                    }
                }, 1500, 'clickMode');
            }
        },

        showEasyModeHint(step, elementSelector) {
            // 只在簡單模式下啟用
            if (this.state.settings.difficulty !== 'easy') return;

            // 移除之前的提示
            this.clearEasyModeHint();

            // 更新狀態
            this.state.gameState.easyModeHints.enabled = true;
            this.state.gameState.easyModeHints.currentStep = step;

            // 添加提示樣式
            this.TimerManager.setTimeout(() => {
                const element = document.querySelector(elementSelector);
                if (element) {
                    element.classList.add('easy-mode-hint');
                    this.state.gameState.easyModeHints.highlightedElement = element;
                }

                // 🆕 簡單模式：啟動視覺延遲機制
                if (this.state.gameState.clickModeState.enabled) {
                    this.enableClickModeWithVisualDelay(`EasyHint-${step}`);
                }
            }, 300, 'uiAnimation');
        },

        clearEasyModeHint() {
            // 移除所有提示樣式
            document.querySelectorAll('.easy-mode-hint').forEach(el => {
                el.classList.remove('easy-mode-hint');
            });

            // 重置狀態
            this.state.gameState.easyModeHints.currentStep = null;
            this.state.gameState.easyModeHints.highlightedElement = null;
        },

        // ===== 簡單模式流程驗證系統 =====

        // 設置當前流程步驟
        setFlowStep(stepId) {
            if (this.state.settings.difficulty !== 'easy') return;
            this.state.gameState.currentFlowStep = stepId;
            VendingMachine.Debug.log('flow', ` 當前步驟: ${stepId}`);
        },

        // ========== 普通模式：統一的步驟管理系統 ==========
        //
        // 【流程定義】
        // step1: 選擇飲料 - 必須選擇指定的飲料
        // step2: 投幣     - 必須投入足夠金額（錯誤3次後顯示最小硬幣組合提示）
        // step3: 確認購買 - 點擊「確認購買」按鈕
        // step4: 取貨     - 拿取飲料和零錢（智能提示：已拿取飲料則提示零錢，反之亦然）
        //
        // 【錯誤處理機制】
        // - 每個步驟累計錯誤次數
        // - 錯誤達3次後顯示綠色提示動畫
        // - 完成正確操作後，提示消失並進入下一步驟
        // =====================================================

        // 檢查當前操作是否為錯誤操作（普通/困難模式專用）
        // 返回 true 表示這是錯誤操作，已處理；返回 false 表示這是正確操作
        handleNormalModeAction(actionType) {
            if (!this.isAdvancedMode()) return false;

            // coinFirst 模式：步驟順序與一般模式不同（先投幣再選飲料），跳過步驟追蹤
            if (this.isCoinFirstMode()) return false;

            const currentStep = this.state.gameState.normalMode.currentStep;
            let isWrongAction = false;

            // 根據當前步驟判斷該操作是否為錯誤
            switch (currentStep) {
                case 'step1': // 步驟1：應該選擇正確的飲料
                    if (actionType !== 'selectCorrectProduct') {
                        isWrongAction = true;
                    }
                    break;

                case 'step2': // 步驟2：應該投幣
                    if (actionType !== 'insertCoin') {
                        isWrongAction = true;
                    }
                    break;

                case 'step3': // 步驟3：應該確認購買
                    // 困難模式自選任務：允許退幣/取消以重新選擇飲料
                    if (this.state.settings.difficulty === 'hard' &&
                        this.state.settings.taskType === 'freeChoice' &&
                        (actionType === 'refund' || actionType === 'cancel')) {
                        isWrongAction = false; // 允許這些操作
                    } else if (actionType !== 'confirmPurchase') {
                        isWrongAction = true;
                    }
                    break;

                case 'step4': // 步驟4：應該拿取飲料或零錢
                    if (actionType !== 'pickupProduct' && actionType !== 'pickupChange') {
                        isWrongAction = true;
                    }
                    break;
            }

            if (isWrongAction) {
                // 累計錯誤次數
                this.state.gameState.normalMode.errorCount++;
                if (window.TutorContext) TutorContext.update({ errorCount: this.state.gameState.normalMode.errorCount });
                VendingMachine.Debug.log('flow', ` ${currentStep} 錯誤操作: ${actionType}, 累計錯誤: ${this.state.gameState.normalMode.errorCount}`);

                // 播放錯誤音效
                this.audio.play('error03');

                // 達到3次錯誤，顯示提示（僅普通模式自動顯示，困難模式需手動點擊提示按鈕）
                if (this.state.settings.difficulty === 'normal' &&
                    this.state.gameState.normalMode.errorCount >= 3 &&
                    !this.state.gameState.normalMode.hintShown) {
                    this.showNormalModeHint(currentStep);
                    this.state.gameState.normalMode.hintShown = true;
                }

                return true; // 是錯誤操作
            }

            return false; // 是正確操作
        },

        // 顯示普通模式的提示（根據當前步驟）
        showNormalModeHint(step) {
            VendingMachine.Debug.log('flow', ` 顯示步驟 ${step} 的提示`);

            switch (step) {
                case 'step1': // 提示正確的飲料 / 先投幣模式：提示投幣口或已亮飲料
                    if (this.isCoinFirstMode()) {
                        // 先投幣後買飲料模式：step1 = 投幣/選飲料階段
                        const availableItems = document.querySelectorAll('.product-item.coin-first-available');
                        if (availableItems.length > 0) {
                            // 已有飲料亮起
                            if (this.state.settings.taskType === 'coinFirstAssigned') {
                                // 指定購買：顯示指定飲料彈窗（而非直接高亮）
                                if (!document.getElementById('target-item-modal')) {
                                    this.showTargetItemModal();
                                }
                            } else {
                                // coinFirstFree 自選購買：高亮所有亮起的飲料
                                availableItems.forEach(el => el.classList.add('easy-mode-hint'));
                                this.speech.speak('飲料燈號已亮起，請點選您要購買的飲料');
                            }
                        } else {
                            // 尚未投幣或金額不足：提示投幣口
                            const coinSlotCF = document.querySelector('#coinSlot, .coin-slot');
                            if (coinSlotCF) coinSlotCF.classList.add('easy-mode-hint');
                            this.speech.speak('請點擊投幣口，先投入硬幣，投入足夠金額後飲料燈號會亮起');
                        }
                        break;
                    }
                    const targetProductId = this.state.gameState.targetProduct?.id;
                    if (targetProductId) {
                        // 指定任務模式：顯示指定飲料彈窗（而非直接高亮）
                        if (!document.getElementById('target-item-modal')) {
                            this.showTargetItemModal();
                        }
                    } else {
                        // 自由購買模式：高亮整個產品網格區域
                        const productGrid = document.getElementById('productGrid');
                        if (productGrid) {
                            productGrid.classList.add('easy-mode-hint');
                            this.speech.speak('請選擇你要的飲料');
                        }
                    }
                    break;

                case 'step2': // 提示投幣鈕（投幣彈窗未開啟時）
                    {
                        // 投幣彈窗已開啟時不重複提示（彈窗內有專屬的投幣提示）
                        if (document.getElementById('wallet-coins-modal')) break;
                        // 投幣彈窗未開啟：提示投幣槽按鈕
                        const coinSlot = document.querySelector('.coin-slot');
                        if (coinSlot) {
                            coinSlot.classList.add('easy-mode-hint');
                            this.speech.speak('請投入足夠的金額');
                        }
                    }
                    break;

                case 'step3': // 提示確認購買鈕
                    const confirmBtn = document.querySelector('#confirmBtn');
                    if (confirmBtn) {
                        confirmBtn.classList.add('easy-mode-hint');
                        this.speech.speak('請點擊確認購買');
                    }
                    break;

                case 'step4': // 提示取物口和退幣口（只提示未拿取的）
                    let hintItems = [];

                    // 如果還沒拿飲料，在飲料上顯示提示
                    if (!this.state.gameState.productPickedUp) {
                        const vendedProduct = document.querySelector('.vended-product');
                        if (vendedProduct) {
                            vendedProduct.classList.add('easy-mode-hint');
                            hintItems.push('飲料');
                        }
                    }

                    // 如果還有零錢沒拿，在退幣口顯示提示
                    if (this.state.gameState.changeAmount > 0) {
                        const refundSlot = document.getElementById('refundSlot');
                        if (refundSlot) {
                            refundSlot.classList.add('easy-mode-hint');
                            hintItems.push('零錢');
                        }
                    }

                    // 根據未拿取的項目播放語音
                    if (hintItems.length === 2) {
                        this.speech.speak('請拿取飲料和零錢');
                    } else if (hintItems.includes('飲料')) {
                        this.speech.speak('請拿取飲料');
                    } else if (hintItems.includes('零錢')) {
                        this.speech.speak('請拿取零錢');
                    } else {
                        // 沒有任何項目需要拿取（可能已經完成），給予提示
                        VendingMachine.Debug.log('hint', ' 沒有待拿取項目，可能流程已完成');
                        this.speech.speak('本輪交易已完成，請等待進入下一輪');
                    }
                    break;
            }
        },

        // 移除當前步驟的提示動畫
        removeNormalModeHint(step) {
            VendingMachine.Debug.log('flow', ` 移除步驟 ${step} 的提示`);

            switch (step) {
                case 'step1': // 移除飲料高亮 / 先投幣模式：移除投幣口或已亮飲料高亮
                    if (this.isCoinFirstMode()) {
                        const coinSlotCFR = document.querySelector('#coinSlot, .coin-slot');
                        if (coinSlotCFR) coinSlotCFR.classList.remove('easy-mode-hint');
                        document.querySelectorAll('.product-item.coin-first-available')
                            .forEach(el => el.classList.remove('easy-mode-hint'));
                        break;
                    }
                    const targetProductId = this.state.gameState.targetProduct?.id;
                    if (targetProductId) {
                        // 指定任務模式：移除特定飲料的高亮
                        const targetElement = document.querySelector(`[data-product-id="${targetProductId}"]`);
                        if (targetElement) {
                            targetElement.classList.remove('easy-mode-hint');
                        }
                    } else {
                        // 自由購買模式：移除產品網格的高亮
                        const productGrid = document.getElementById('productGrid');
                        if (productGrid) {
                            productGrid.classList.remove('easy-mode-hint');
                        }
                    }
                    break;

                case 'step2': // 移除投幣鈕高亮
                    const coinSlot = document.querySelector('.coin-slot');
                    if (coinSlot) {
                        coinSlot.classList.remove('easy-mode-hint');
                    }
                    break;

                case 'step3': // 移除確認購買鈕高亮
                    const confirmBtn = document.querySelector('#confirmBtn');
                    if (confirmBtn) {
                        confirmBtn.classList.remove('easy-mode-hint');
                    }
                    break;

                case 'step4': // 移除取物口和退幣口高亮
                    const vendedProduct = document.querySelector('.vended-product');
                    if (vendedProduct) {
                        vendedProduct.classList.remove('easy-mode-hint');
                    }
                    const refundSlot = document.getElementById('refundSlot');
                    if (refundSlot) {
                        refundSlot.classList.remove('easy-mode-hint');
                    }
                    break;
            }
        },

        // ===== 困難模式/普通模式：手動提示按鈕 =====
        // 點擊提示按鈕時，根據當前步驟顯示對應的提示動畫
        showHint() {
            if (this.state.settings.difficulty === 'easy') return;

            // 防止手機端重複觸發（touchstart + click）
            const now = Date.now();
            if (this._lastHintTime && now - this._lastHintTime < A1_DEBOUNCE.HINT) {
                VendingMachine.Debug.log('hint', ' 防抖：忽略重複點擊提示按鈕');
                return;
            }
            this._lastHintTime = now;

            // 普通模式：點擊提示後設置標記，防止自動提示重複
            if (this.state.settings.difficulty === 'normal') {
                this.state.gameState.normalMode.hintShown = true;
            }

            const currentStep = this.state.gameState.normalMode.currentStep;
            VendingMachine.Debug.log('hint', ` 手動觸發提示，當前步驟: ${currentStep}`);

            // 播放提示音效
            this.audio.play('click');

            // 🔧 [新增] 困難模式 + 指定任務 + step1：顯示指定飲料彈窗
            const isHardAssigned = this.state.settings.difficulty === 'hard' &&
                                   this.state.settings.taskType === 'assigned';

            if (isHardAssigned && currentStep === 'step1') {
                // 顯示指定飲料彈窗（而不是提示動畫）
                this.showTargetItemModal();
                VendingMachine.Debug.log('hint', ' 困難模式+指定任務：顯示指定飲料彈窗');
            } else {
                // 其他情況：顯示提示動畫
                // 語音提示會在 showNormalModeHint 中根據步驟播放具體內容
                this.showNormalModeHint(currentStep);
            }

            // 標記提示已顯示（持續顯示，不會自動消失）
            this.state.gameState.normalMode.hintShown = true;
        },

        // 進入下一步驟（移除當前提示，重置錯誤計數）
        advanceToNextStep(nextStep) {
            if (this.state.settings.difficulty !== 'normal' && this.state.settings.difficulty !== 'hard') return;

            const currentStep = this.state.gameState.normalMode.currentStep;
            VendingMachine.Debug.log('flow', ` 從 ${currentStep} 進入 ${nextStep}`);

            // 移除當前步驟的提示
            this.removeNormalModeHint(currentStep);

            // 更新步驟並重置錯誤計數
            this.state.gameState.normalMode.currentStep = nextStep;
            this.state.gameState.normalMode.errorCount = 0;
            this.state.gameState.normalMode.hintShown = false;
        },

        // 自動提示觸發（計時器到期後呼叫）
        _fireAutoHint() {
            const step = this.state.gameState.normalMode.currentStep;
            if (step && !this.state.gameState.normalMode.hintShown) {
                this.showNormalModeHint(step);
                this.state.gameState.normalMode.hintShown = true;
            }
        },

        // ========== 簡單模式：統一的步驟管理系統 ==========

        // 檢查當前操作是否為錯誤操作（簡單模式專用）
        // 返回 true 表示這是錯誤操作，已處理；返回 false 表示這是正確操作
        handleEasyModeAction(actionType, targetElement = null) {
            if (this.state.settings.difficulty !== 'easy') return false;
            // coinFirst 模式使用 currentFlowStep 系統，easyMode.currentStep 不追蹤 coinFirst 流程
            // 若不跳過，easyMode.currentStep 永遠停在 step1，導致 refundMoney()/cancel() 被誤判為錯誤操作
            if (this.isCoinFirstMode()) return false;

            const currentStep = this.state.gameState.easyMode.currentStep;
            let isWrongAction = false;

            // 根據當前步驟判斷該操作是否為錯誤
            switch (currentStep) {
                case 'step1': // 步驟1：應該選擇正確的飲料
                    if (actionType !== 'selectCorrectProduct') {
                        isWrongAction = true;
                    }
                    break;

                case 'step2': // 步驟2：應該投幣或取消
                    if (actionType !== 'insertCoin' && actionType !== 'cancel') {
                        isWrongAction = true;
                    }
                    break;

                case 'step3': // 步驟3：應該確認購買
                    if (actionType !== 'confirmPurchase') {
                        isWrongAction = true;
                    }
                    break;

                case 'step4': // 步驟4：應該拿取飲料或零錢
                    if (actionType !== 'pickupProduct' && actionType !== 'pickupChange') {
                        isWrongAction = true;
                    }
                    break;
            }

            if (isWrongAction) {
                VendingMachine.Debug.log('flow', ` ${currentStep} 錯誤操作: ${actionType}`);

                // 播放錯誤音效
                this.audio.play('error03');

                // 在錯誤的元素上顯示⚠️警告標記
                if (targetElement) {
                    let element = null;
                    if (typeof targetElement === 'string') {
                        element = document.querySelector(targetElement);
                    } else if (targetElement && targetElement.nodeType) {
                        element = targetElement;
                    }

                    if (element) {
                        this.showWarningMarkOnElement(element);
                    }
                }

                // 播放錯誤語音提示
                this.showEasyModeErrorMessage(currentStep, actionType);

                return true; // 是錯誤操作
            }

            return false; // 是正確操作
        },

        // 顯示簡單模式的錯誤訊息
        showEasyModeErrorMessage(step, actionType) {
            let message = '';

            switch (step) {
                case 'step1':
                    if (actionType === 'insertCoin') {
                        message = '請先選擇飲料';
                    } else if (actionType === 'confirmPurchase') {
                        message = '請先選擇飲料';
                    } else if (actionType === 'cancel' || actionType === 'refund') {
                        message = '請先選擇飲料';
                    } else if (actionType === 'selectWrongProduct') {
                        message = `選錯了，請購買指定的飲料：${this.state.gameState.targetProduct?.name}`;
                    }
                    break;

                case 'step2':
                    if (actionType === 'selectProduct_afterSelected') {
                        message = '已經選好飲料了，請先投幣或取消';
                    } else if (actionType === 'confirmPurchase') {
                        const product = this.state.gameState.selectedProduct;
                        const diff = product ? product.price - this.state.gameState.insertedAmount : 0;
                        message = diff > 0 ? `金額不足，還需要 ${diff} 元` : '請先投幣';
                    } else if (actionType === 'refund' || actionType === 'cancel') {
                        // 取消是允許的，不應該到這裡
                    }
                    break;

                case 'step3':
                    if (actionType === 'selectProduct_afterSelected') {
                        message = '已經投幣完成，請點擊確認購買';
                    } else if (actionType === 'insertCoin') {
                        message = '已經投幣完成，請點擊確認購買';
                    } else if (actionType === 'refund' || actionType === 'cancel') {
                        message = '請點擊確認購買';
                    }
                    break;

                case 'step4':
                    let items = [];
                    if (!this.state.gameState.productPickedUp) items.push('飲料');
                    if (this.state.gameState.changeAmount > 0) items.push('零錢');

                    if (items.length === 2) {
                        message = '請先拿取飲料和零錢';
                    } else if (items.includes('飲料')) {
                        message = '請先拿取飲料';
                    } else if (items.includes('零錢')) {
                        message = '請先拿取零錢';
                    }
                    break;
            }

            if (message) {
                this.speech.speak(message);
            }
        },

        // 進入下一步驟並顯示對應提示（簡單模式）
        advanceToNextStepEasy(nextStep) {
            if (this.state.settings.difficulty !== 'easy') return;

            const currentStep = this.state.gameState.easyMode.currentStep;
            VendingMachine.Debug.log('flow', ` 從 ${currentStep} 進入 ${nextStep}`);

            // 更新步驟
            this.state.gameState.easyMode.currentStep = nextStep;

            // 顯示新步驟的提示
            this.showEasyModeStepHint(nextStep);
        },

        // 顯示簡單模式步驟提示（綠色高亮）
        showEasyModeStepHint(step) {
            // 先清除所有提示
            this.clearEasyModeHint();

            switch (step) {
                case 'step1': // 提示正確的飲料
                    const targetProductId = this.state.gameState.targetProduct?.id;
                    if (targetProductId) {
                        const targetElement = document.querySelector(`[data-product-id="${targetProductId}"]`);
                        if (targetElement) {
                            targetElement.classList.add('easy-mode-hint');
                        }
                    }
                    break;

                case 'step2': // 提示投幣鈕
                    const coinSlot = document.querySelector('.coin-slot');
                    if (coinSlot) {
                        coinSlot.classList.add('easy-mode-hint');
                    }
                    break;

                case 'step3': // 提示確認購買鈕
                    const confirmBtn = document.querySelector('#confirmBtn');
                    if (confirmBtn) {
                        confirmBtn.classList.add('easy-mode-hint');
                    }
                    break;

                case 'step4': // 提示取物口和退幣口
                    const vendedProduct = document.querySelector('.vended-product');
                    if (vendedProduct) {
                        vendedProduct.classList.add('easy-mode-hint');
                    }

                    if (this.state.gameState.changeAmount > 0) {
                        const refundSlot = document.getElementById('refundSlot');
                        if (refundSlot) {
                            refundSlot.classList.add('easy-mode-hint');
                        }
                    }
                    break;
            }
        },

        // 驗證操作是否允許
        validateAction(actionName, targetElement = null) {
            // 非簡單/普通模式不需要驗證
            if (this.state.settings.difficulty !== 'easy' && this.state.settings.difficulty !== 'normal') {
                return true;
            }

            // 簡單模式才檢查流程步驟
            if (this.state.settings.difficulty === 'easy') {
                const currentStep = this.state.gameState.currentFlowStep;
                if (!currentStep) return true;

                const stepConfig = EASY_MODE_FLOW.steps[currentStep];
                if (!stepConfig) return true;

                // 檢查操作是否允許
                if (stepConfig.allowedActions.includes(actionName)) {
                    return true;
                }

                // 操作不允許，顯示警告
                const warningMessage = stepConfig.warningMessages[actionName] || '請依照正確流程操作';
                this.showFlowWarning(targetElement, warningMessage, actionName);
                return false;
            }

            // 普通/困難模式：基本驗證（例如：未選產品不能投幣）
            if (this.isAdvancedMode()) {
                // 未選產品時不能投幣（coinFirst 模式例外：先投幣再選飲料）
                if (actionName === 'showCoinModal' && !this.state.gameState.selectedProduct && !this.isCoinFirstMode()) {
                    // 提示應該選擇的飲料（指定飲料）
                    const targetProductId = this.state.gameState.targetProduct?.id;
                    const correctElement = targetProductId ? document.querySelector(`[data-product-id="${targetProductId}"]`) : null;
                    this.showFlowWarning(correctElement, '請先選擇飲料', actionName);
                    return false;
                }

                // 未投入足夠金額時不能確認購買
                if (actionName === 'processPayment') {
                    const product = this.state.gameState.selectedProduct;
                    if (!product) {
                        // 提示應該選擇的飲料（指定飲料）
                        const targetProductId = this.state.gameState.targetProduct?.id;
                        const correctElement = targetProductId ? document.querySelector(`[data-product-id="${targetProductId}"]`) : null;
                        this.showFlowWarning(correctElement, '請先選擇飲料', actionName);
                        return false;
                    }
                    const diff = product.price - this.state.gameState.insertedAmount;
                    if (diff > 0) {
                        // 提示應該投幣的元素（投幣鈕）
                        const coinSlotElement = document.querySelector('.coin-slot');
                        this.showFlowWarning(coinSlotElement, `金額不足，還需要 ${diff} 元`, actionName);
                        return false;
                    }
                }
            }

            return true;
        },

        // 顯示流程警告
        showFlowWarning(targetElement, message, actionName = null) {
            // 播放警告音效
            this.audio.play(EASY_MODE_FLOW.audio.warning);

            // 普通/困難模式：錯誤計數與延遲提示
            if (this.isAdvancedMode() && actionName) {
                // 增加錯誤計數
                if (this.state.gameState.normalModeErrors.hasOwnProperty(actionName)) {
                    this.state.gameState.normalModeErrors[actionName]++;
                    VendingMachine.Debug.log('flow', ` ${actionName} 錯誤次數: ${this.state.gameState.normalModeErrors[actionName]}`);
                }

                // 連續錯誤3次才顯示動畫提示和語音
                const errorCount = this.state.gameState.normalModeErrors[actionName] || 0;
                if (errorCount >= 3) {
                    // 在目標元素上顯示動畫提示
                    if (targetElement) {
                        let element = null;

                        // 獲取元素
                        if (typeof targetElement === 'string') {
                            element = document.querySelector(targetElement);
                        } else if (targetElement.nodeType) {
                            element = targetElement;
                        }

                        if (element) {
                            element.classList.add('easy-mode-hint');
                        }
                    }

                    // 語音提示
                    this.speech.speak(message);
                    VendingMachine.Debug.log('flow', ` 警告（第${errorCount}次）: ${message}`);
                }
            } else {
                // 簡單模式：立即顯示警告標記和語音
                if (targetElement) {
                    let element = null;

                    // 獲取元素
                    if (typeof targetElement === 'string') {
                        element = document.querySelector(targetElement);
                    } else if (targetElement.nodeType) {
                        element = targetElement;
                    }

                    if (element) {
                        this.showWarningMarkOnElement(element);
                    }
                }

                // 語音提示
                this.speech.speak(message);
                VendingMachine.Debug.log('flow', ` 警告: ${message}`);
            }
        },

        // 顯示投幣彈窗（根據難度模式顯示不同內容）
        showCoinModal() {
            // coinFirst 模式：不需要先選飲料，直接開啟投幣視窗（提前處理，跳過一般模式的步驟驗證）
            if (this.isCoinFirstMode()) {
                // 簡單模式：流程驗證（確認處於 INSERT_COIN 步驟）
                if (!this.validateAction('showCoinModal', '#coinSlot')) {
                    return;
                }
                this.audio.play('click');
                if (this.state.settings.difficulty === 'easy') {
                    this.setFlowStep('INSERTING_COINS');
                }
                this.showWalletCoinsModal();
                return;
            }

            // 普通/困難模式：統一的錯誤檢查
            if (this.isAdvancedMode()) {
                if (this.handleNormalModeAction('insertCoin')) {
                    return; // 這是錯誤操作
                }
            }

            // 簡單模式：流程驗證
            if (!this.validateAction('showCoinModal', '#coinSlot')) {
                return;
            }

            this.audio.play('click');

            if (!this.state.gameState.selectedProduct) {
                return;
            }

            const difficulty = this.state.settings.difficulty;
            const product = this.state.gameState.selectedProduct;

            // 簡單模式：檢查是否已完成投幣
            if (difficulty === 'easy') {
                // 如果已投幣完成，播放錯誤音效並提示
                if (this.state.gameState.insertedAmount >= product.price) {
                    this.audio.play('error02');
                    this.speech.speak('你已完成投幣，請點擊確認購買');
                    return;
                }
                this.setFlowStep('INSERTING_COINS');
                this.showWalletCoinsModal();
                return;
            }

            // 普通、困難模式：顯示錢包硬幣選擇彈窗
            this.showWalletCoinsModal();
        },

        // 顯示錢包硬幣彈跳視窗（所有模式）
        showWalletCoinsModal() {
            // 重置投入硬幣記錄（每次打開視窗時清空）
            this.state.gameState.insertedCoinsDetail = [];

            const walletCoins = this.state.gameState.walletCoins;

            // 創建彈跳視窗
            const modal = document.createElement('div');
            modal.id = 'wallet-coins-modal';
            modal.className = 'coin-modal';

            // 將硬幣展開成單個硬幣陣列
            const coinArray = [];
            Object.entries(walletCoins)
                .sort(([a], [b]) => b - a)
                .forEach(([value, count]) => {
                    for (let i = 0; i < count; i++) {
                        coinArray.push({
                            value: parseInt(value),
                            id: `coin-${value}-${i}`
                        });
                    }
                });

            // 生成每個硬幣的 HTML（每個硬幣都可以單獨點擊）
            const coinsHTML = coinArray.map(coin => {
                const side = Math.random() > 0.5 ? 'front' : 'back'; // 🆕 隨機正反面
                return `
                <div class="individual-coin" id="${coin.id}" data-value="${coin.value}" onclick="VendingMachine.clickCoin('${coin.id}', ${coin.value})">
                    <img src="../images/money/${coin.value}_yuan_${side}.png" alt="${coin.value}元" class="coin-img"
                         onerror="this.outerHTML='<div style=\\'width:70px;height:70px;background:#ddd;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;\\'>${coin.value}元</div>'">
                    <div class="coin-label">${coin.value} 元</div>
                </div>
                `;
            }).join('');

            // 檢查是否需要顯示提示按鈕（困難模式/普通模式 + 錯誤3次後）
            const errorCount = this.state.gameState.normalMode.coinInsertionErrors || 0;
            const difficulty = this.state.settings.difficulty;
            let showHintButton;
            if (this.state.settings.taskType === 'coinFirstAssigned') {
                // coinFirstAssigned：普通模式自動提示（在 showCoinsReturnAnimation 後執行），困難模式才顯示提示鈕
                showHintButton = difficulty === 'hard' && errorCount >= 3;
            } else {
                showHintButton = (difficulty === 'hard' || difficulty === 'normal') && errorCount >= 3;
            }

            // 先投幣模式：遮罩透明，讓學生看到背景飲料燈號亮起
            const isCoinFirstModal = this.isCoinFirstMode();

            modal.innerHTML = `
                <div class="coin-modal-overlay${isCoinFirstModal ? ' coin-first-transparent-overlay' : ''}"></div>
                <div class="coin-modal-content${isCoinFirstModal ? ' coin-first-content' : ''}">
                    ${isCoinFirstModal ? '<div class="cf-header-card">' : ''}
                    <div id="coinModalTitle" style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
                        ${showHintButton ? `
                            <button class="hint-btn" onclick="VendingMachine.showCoinHint()"
                                    style="padding: 8px 16px; background: #FF9800; color: white; border: none;
                                           border-radius: 8px; font-size: 14px; cursor: pointer;
                                           transition: all 0.3s; box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);"
                                    onmouseover="this.style.background='#F57C00'"
                                    onmouseout="this.style.background='#FF9800'">
                                💡 提示
                            </button>
                        ` : ''}
                        <h3 style="margin: 0;">💰 請投入硬幣</h3>
                    </div>
                    <p style="text-align: center;${isCoinFirstModal ? '' : ' color: #666;'} margin: ${isCoinFirstModal ? '4px' : '10px'} 0; font-size: 14px;">
                        點擊硬幣進行投入
                    </p>
                    ${isCoinFirstModal ? '</div>' : ''}
                    <div class="wallet-coins-display" id="coinsContainer">
                        ${coinsHTML}
                    </div>
                    <div class="coin-progress">
                        <p>已投入：<span id="insertedAmountDisplay">${this.state.gameState.insertedAmount}</span> 元${this.state.gameState.selectedProduct ? ` / 需要：${this.state.gameState.selectedProduct.price} 元` : this.state.gameState.targetProduct ? ` / 目標：${this.state.gameState.targetProduct.price} 元` : ''}</p>
                    </div>
                    <div class="modal-buttons" style="display: flex; gap: 10px; margin-top: 15px; justify-content: center;">
                        ${this.isAdvancedMode() ?
                            `<button class="modal-confirm-btn" onclick="VendingMachine.confirmCoinInsertion()" style="padding: 12px 30px; background: #4CAF50; color: white; border: none; border-radius: 8px; font-size: clamp(14px, 4vw, 18px); cursor: pointer; transition: all 0.3s; white-space: nowrap;">
                                確定
                            </button>` : ''}
                    </div>
                </div>

                <style>
                    .coin-modal-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(5px);
                    }

                    /* 先投幣模式：遮罩完全透明，讓學生看到飲料燈號亮起 */
                    .coin-first-transparent-overlay {
                        background: transparent !important;
                        backdrop-filter: none !important;
                    }

                    /* 先投幣模式：外框完全透明（無邊框、無陰影） */
                    .coin-first-content {
                        background: transparent !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    /* 標題卡片容器：透明 */
                    .cf-header-card {
                        background: transparent;
                        border-radius: 12px;
                        padding: 6px 16px 8px;
                        margin-bottom: 8px;
                        text-align: center;
                    }
                    /* 「💰 請投入硬幣」白色膠囊標籤 */
                    .coin-first-content #coinModalTitle h3 {
                        display: inline-block;
                        background: rgba(255, 255, 255, 0.93);
                        color: #333 !important;
                        border-radius: 24px;
                        padding: 5px 20px;
                        margin: 0;
                        font-size: 1.05rem;
                    }
                    /* 「點擊硬幣進行投入」白色膠囊標籤 */
                    .cf-header-card > p {
                        display: inline-block !important;
                        background: rgba(255, 255, 255, 0.93) !important;
                        color: #555 !important;
                        border-radius: 20px !important;
                        padding: 3px 14px !important;
                        font-size: 13px !important;
                        margin: 6px 0 0 !important;
                    }
                    /* 硬幣格子：容器透明 */
                    .coin-first-content .wallet-coins-display {
                        background: transparent !important;
                    }
                    /* 已投入金額欄：容器透明 */
                    .coin-first-content .coin-progress {
                        background: transparent !important;
                        border-radius: 0 !important;
                        text-align: center;
                        padding: 6px 0 !important;
                    }
                    /* 「已投入：X 元」白色膠囊標籤 */
                    .coin-first-content .coin-progress p {
                        display: inline-block !important;
                        background: rgba(255, 255, 255, 0.93) !important;
                        color: #333 !important;
                        border-radius: 24px !important;
                        padding: 6px 22px !important;
                        font-weight: bold !important;
                        margin: 0 !important;
                    }
                    .coin-first-content #insertedAmountDisplay {
                        color: #c45000 !important;
                    }
                    .coin-first-content .modal-confirm-btn {
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
                    }

                    .wallet-coins-display {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 15px;
                        margin: 20px 0;
                        padding: 20px;
                        background: #f8f9fa;
                        border-radius: 10px;
                        min-height: 150px;
                    }

                    .individual-coin {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        background: white;
                        border: 3px solid var(--vm-primary);
                        border-radius: 10px;
                        padding: 10px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        animation: coinAppear 0.3s ease-out;
                    }

                    .individual-coin:hover {
                        transform: translateY(-5px) scale(1.05);
                        box-shadow: 0 5px 15px rgba(0, 136, 77, 0.3);
                        border-color: var(--vm-accent);
                    }

                    .individual-coin.inserted {
                        animation: coinInsertAnimation 0.5s ease-out forwards;
                    }

                    /* @keyframes coinAppear, coinInsertAnimation 已移至 injectGlobalAnimationStyles() */

                    .coin-img {
                        width: 70px;
                        height: 70px;
                        object-fit: contain;
                        margin-bottom: 5px;
                    }

                    .coin-label {
                        font-size: 14px;
                        font-weight: bold;
                        color: var(--vm-text-dark);
                    }

                    .coin-progress {
                        text-align: center;
                        font-size: 1.1rem;
                        font-weight: bold;
                        color: var(--vm-primary);
                        padding: 15px;
                        background: #f0f8f0;
                        border-radius: 10px;
                        margin-top: 10px;
                    }

                    #insertedAmountDisplay {
                        color: var(--vm-accent);
                        font-size: 1.3rem;
                    }
                </style>
            `;

            document.body.appendChild(modal);

            // 初始化投幣追蹤
            this.state.gameState.coinsInserted = 0;
            this.state.gameState.totalCoinsToInsert = coinArray.length;

            // 簡單模式：清除之前的提示（不在投幣視窗內顯示提示）
            if (this.state.settings.difficulty === 'easy') {
                this.clearEasyModeHint();
            }


        },

        // 先投幣模式：根據已投金額更新飲料燈號狀態
        updateDrinkAvailabilityByCoinAmount() {
            if (!this.isCoinFirstMode()) return;
            const inserted = this.state.gameState.insertedAmount;
            const grid = document.getElementById('productGrid');
            if (!grid) return;

            let newlyUnlocked = false;
            grid.querySelectorAll('.product-item.coin-first-locked').forEach(el => {
                const price = parseInt(el.dataset.price);
                if (price <= inserted) {
                    el.classList.remove('coin-first-locked');
                    el.classList.add('coin-first-unlocking');
                    // 動畫結束後換成 available
                    this.TimerManager.setTimeout(() => {
                        el.classList.remove('coin-first-unlocking');
                        el.classList.add('coin-first-available');
                    }, 650, 'drinkUnlock');
                    newlyUnlocked = true;
                }
            });

            if (newlyUnlocked) {
                this.audio.play('correct');

                const difficulty = this.state.settings.difficulty;
                const target = this.state.gameState.targetProduct;

                if (difficulty === 'easy' && target && inserted >= target.price) {
                    // 簡單模式：目標飲料亮起，更新螢幕文字，引導點選
                    document.getElementById('screenTitle').textContent = `${target.name} 燈號亮起了！`;
                    document.getElementById('screenMessage').textContent = `請點選 ${target.name}`;

                    // 切換流程步驟到選飲料，高亮目標飲料
                    this.setFlowStep('SELECT_PRODUCT');
                    this.clearEasyModeHint();
                    this.showEasyModeHint('select_product', `[data-product-id="${target.id}"]`);
                    // 注意：簡單模式此時正值最後一枚硬幣投入，語音由 isLastCoin 路徑處理（總額語音），此處不額外播放
                } else if (difficulty !== 'easy') {
                    // 普通/困難模式：投幣視窗關閉後才通知（避免與投幣音效/語音衝突）
                    // confirmCoinInsertion() 關窗後已有適當語音，此處僅在視窗未開啟時補說
                    if (!document.getElementById('wallet-coins-modal')) {
                        // 計算已亮起的飲料（含正在解鎖動畫中的）
                        const availableCount = grid.querySelectorAll('.product-item.coin-first-available, .product-item.coin-first-unlocking').length;
                        this.speech.speak(`已有 ${availableCount} 種飲料可以選了`);
                    }
                }
            }
        },

        // coinFirstAssigned：解鎖目標飲料（驗證通過後呼叫）
        _unlockTargetDrink() {
            const target = this.state.gameState.targetProduct;
            if (!target) return;
            const el = document.querySelector(`[data-product-id="${target.id}"]`);
            if (!el) return;
            el.classList.remove('coin-first-locked');
            el.classList.add('coin-first-unlocking');
            this.TimerManager.setTimeout(() => {
                el.classList.remove('coin-first-unlocking');
                el.classList.add('coin-first-available');
                this.audio.play('correct');
                this.speech.speak(`${target.name}的燈號亮起來了，請點選這個飲料`);
                if (!this.isAdvancedMode()) {
                    this.setFlowStep('SELECT_PRODUCT');
                    this.clearEasyModeHint();
                    this.showEasyModeHint('select_product', `[data-product-id="${target.id}"]`);
                }
            }, 650, 'drinkUnlock');
        },

        // coinFirstAssigned：記錄投幣錯誤並在條件滿足時顯示提示
        _recordCoinFirstAssignedError() {
            if (!this.isAdvancedMode()) return;
            const errors = (this.state.gameState.normalMode.coinInsertionErrors || 0) + 1;
            this.state.gameState.normalMode.coinInsertionErrors = errors;
            // 普通模式：錯3次後自動在動畫結束後顯示綠色勾勾提示
            if (this.state.settings.difficulty === 'normal' && errors >= 3) {
                this.TimerManager.setTimeout(() => this.showCoinHint(), 900, 'coinHint');
            }
            // 困難模式：下次開啟投幣 modal 時由 showWalletCoinsModal() 顯示提示鈕
        },

        // 點擊硬幣進行投入
        clickCoin(coinId, coinValue) {
            VendingMachine.Debug.log('coin', ` 點擊硬幣: ${coinId}, 金額: ${coinValue}`);

            // 🔧 輔助點擊模式：不允許使用者直接點擊投入硬幣，須透過點擊模式操作
            // autoInsertCoin 在呼叫前已預先標記 'used' class，可作為自動/手動判斷依據
            if (this.state.settings.clickMode && this.state.gameState.clickModeState?.enabled) {
                const coinElement = document.getElementById(coinId);
                if (coinElement && !coinElement.classList.contains('used')) {
                    this.audio.play('error03');
                    return;
                }
            }

            // 防止手機端重複觸發
            const now = Date.now();
            if (this._lastCoinClickTime && now - this._lastCoinClickTime < A1_DEBOUNCE.COIN_INSERT) {
                VendingMachine.Debug.log('coin', ' 防抖：忽略重複點擊');
                return;
            }
            this._lastCoinClickTime = now;

            // 獲取硬幣元素
            const coinElement = document.getElementById(coinId);
            if (!coinElement) return;

            // 檢查硬幣是否被禁用（提示模式下的非提示硬幣）
            const isDisabled = coinElement.getAttribute('data-disabled') === 'true';
            if (isDisabled) {
                // 點擊了被禁用的硬幣，播放錯誤音效
                this.audio.play('error03');
                VendingMachine.Debug.log('coin', ' 點擊了被禁用的硬幣（非提示硬幣），拒絕投入');
                return;
            }

            // 播放投幣音效
            this.audio.play('coin01');

            // 添加消失動畫
            coinElement.classList.add('inserted');

            // 從錢包中扣除這個硬幣
            if (this.state.gameState.walletCoins[coinValue] > 0) {
                this.state.gameState.walletCoins[coinValue]--;
            }

            // 等待動畫完成後移除元素
            this.TimerManager.setTimeout(() => {
                if (coinElement.parentNode) {
                    coinElement.remove();
                }

                // 更新已投入金額
                this.state.gameState.insertedAmount += coinValue;
                this.state.gameState.coinsInserted++;

                // 記錄本次投入的硬幣（用於多付檢查）
                this.state.gameState.insertedCoinsDetail.push(coinValue);

                // 更新顯示
                const insertedDisplay = document.getElementById('insertedAmountDisplay');
                if (insertedDisplay) {
                    insertedDisplay.textContent = this.state.gameState.insertedAmount;
                }

                // 更新主畫面金額顯示
                this.updateAmounts();

                // 先投幣模式：更新飲料可選狀態
                if (this.isCoinFirstMode()) {
                    this.updateDrinkAvailabilityByCoinAmount();
                }

                // 儲存當前點擊的硬幣金額
                this.state.gameState.lastCoinValue = coinValue;

                // 清除之前的語音計時器
                if (this.state.gameState.speechTimer) {
                    this.TimerManager.clearTimeout(this.state.gameState.speechTimer);
                    this.state.gameState.speechTimer = null;
                }

                const totalAmount = this.state.gameState.insertedAmount;
                const isLastCoin = this.state.gameState.coinsInserted >= this.state.gameState.totalCoinsToInsert;

                if (isLastCoin) {
                    // 最後一個硬幣
                    VendingMachine.Debug.log('coin', ' 所有硬幣已投入，等待語音播放完畢');

                    if (this.state.settings.difficulty === 'easy') {
                        if (this.isCoinFirstMode()) {
                            // 先投幣模式：播放總額，然後關閉視窗
                            // 提示與流程已由 updateDrinkAvailabilityByCoinAmount() 處理，不清除提示也不重複煙火
                            this.speech.speak(this.convertAmountToSpeech(totalAmount), {
                                interrupt: true,
                                callback: () => {
                                    this.TimerManager.setTimeout(() => {
                                        this.hideWalletCoinsModal();
                                    }, 500, 'uiAnimation');
                                }
                            });
                            VendingMachine.Debug.log('speech', '🗣️ coinFirst 播放總額語音 (最後一個):', this.convertAmountToSpeech(totalAmount));
                        } else {
                            this.clearEasyModeHint(); // 清除提示（非 coinFirst）
                            // 簡單模式：只播放總額，自動關閉視窗
                            this.speech.speak(this.convertAmountToSpeech(totalAmount), {
                                interrupt: true,
                                callback: () => {
                                    VendingMachine.Debug.log('speech', '🗣️ 總額語音播放完畢，播放煙火後關閉視窗');
                                    // 🎆 簡單模式：投幣完成後播放煙火動畫和音效
                                    this.startFireworksAnimation();
                                    this.audio.play('correct');
                                    // 延遲關閉視窗，讓煙火動畫顯示
                                    this.TimerManager.setTimeout(() => {
                                        this.hideWalletCoinsModal();
                                        this.checkPaymentComplete();
                                    }, 1000, 'uiAnimation');
                                }
                            });
                            VendingMachine.Debug.log('speech', '🗣️ 播放總額語音 (最後一個):', this.convertAmountToSpeech(totalAmount));
                        }
                    } else {
                        this.clearEasyModeHint(); // 清除提示
                        // 普通模式：只播放總額，保持視窗開啟（困難模式不播放，增加難度）
                        if (this.state.settings.difficulty !== 'hard') {
                            this.speech.speak(this.convertAmountToSpeech(totalAmount), {
                                interrupt: true
                            });
                            VendingMachine.Debug.log('speech', '🗣️ 播放總額語音 (最後一個)，保持視窗開啟:', this.convertAmountToSpeech(totalAmount));
                        }
                    }
                } else {
                    // 非最後一個硬幣
                    if (this.state.settings.difficulty === 'easy') {
                        // 簡單模式：只播放總額（立即播放，不延遲）
                        this.speech.speak(this.convertAmountToSpeech(totalAmount), { interrupt: true });
                        VendingMachine.Debug.log('speech', '🗣️ 播放總額語音:', this.convertAmountToSpeech(totalAmount));
                    } else if (this.state.settings.difficulty !== 'hard') {
                        // 普通模式：延遲播放語音（防抖動）（困難模式不播放）
                        this.state.gameState.speechTimer = this.TimerManager.setTimeout(() => {
                            const latestTotalAmount = this.state.gameState.insertedAmount;
                            this.speech.speak(this.convertAmountToSpeech(latestTotalAmount), { interrupt: true });
                            VendingMachine.Debug.log('speech', '🗣️ 播放總額語音:', this.convertAmountToSpeech(latestTotalAmount));
                        }, 800, 'speechDelay');
                    }
                }
            }, 500, 'uiAnimation');
        },

        // 檢查付款是否完成
        checkPaymentComplete() {
            const product = this.state.gameState.selectedProduct;
            // coinFirst 模式：飲料尚未選擇時不需要檢查（提示已由 updateDrinkAvailabilityByCoinAmount 處理）
            if (!product) return;
            const diff = product.price - this.state.gameState.insertedAmount;

            if (diff <= 0) {
                document.getElementById('screenTitle').textContent = '金額足夠';
                document.getElementById('screenMessage').textContent = '請按確認購買';
                this.speech.speak('投幣完成！請按確認購買');

                // 簡單模式：更新流程步驟並提示點擊確認購買按鈕
                if (this.state.settings.difficulty === 'easy') {
                    this.setFlowStep('CONFIRM_PURCHASE');
                    this.clearEasyModeHint();
                    this.showEasyModeHint('confirm_purchase', '#confirmBtn');
                }

                // 普通/困難模式：進入步驟3（確認購買）
                if (this.isAdvancedMode()) {
                    this.advanceToNextStep('step3');
                }
            } else {
                document.getElementById('screenTitle').textContent = `投入金額：${this.state.gameState.insertedAmount} 元`;
                document.getElementById('screenMessage').textContent = `還需要：${diff} 元`;
                this.speech.speak(`已投入 ${this.convertAmountToSpeech(this.state.gameState.insertedAmount)}，還需要 ${this.convertAmountToSpeech(diff)}`);
            }
        },

        // 顯示硬幣提示（困難模式專用，手動點擊按鈕觸發）
        showCoinHint() {
            this.audio.play('click');

            const product = this.state.gameState.selectedProduct || this.state.gameState.targetProduct;
            const walletCoins = this.state.gameState.walletCoins;

            if (!product) {
                VendingMachine.Debug.log('hint', ' 沒有選擇商品，無法顯示提示');
                return;
            }

            // 找到最小硬幣組合
            const hintCoinIds = this.findMinimumCoinCombination(walletCoins, product.price);
            VendingMachine.Debug.log('hint', ' 困難模式手動提示，顯示提示硬幣:', hintCoinIds);

            // 重新生成錢包硬幣列表
            const coinArray = [];
            Object.entries(walletCoins)
                .sort(([a], [b]) => b - a)
                .forEach(([value, count]) => {
                    for (let i = 0; i < count; i++) {
                        coinArray.push({
                            value: parseInt(value),
                            id: `coin-${value}-${i}`
                        });
                    }
                });

            // 生成帶提示的硬幣HTML
            const coinsHTML = coinArray.map(coin => {
                const hasHint = hintCoinIds.includes(coin.id);
                const showingHint = hintCoinIds.length > 0;
                const isDisabled = showingHint && !hasHint;
                const side = Math.random() > 0.5 ? 'front' : 'back'; // 🆕 隨機正反面

                return `
                    <div class="individual-coin ${hasHint ? 'coin-hint' : ''} ${isDisabled ? 'coin-disabled' : ''}"
                         id="${coin.id}"
                         data-value="${coin.value}"
                         data-has-hint="${hasHint}"
                         data-disabled="${isDisabled}"
                         onclick="VendingMachine.clickCoin('${coin.id}', ${coin.value})">
                        <img src="../images/money/${coin.value}_yuan_${side}.png" alt="${coin.value}元" class="coin-img"
                             onerror="this.outerHTML='<div style=\\'width:70px;height:70px;background:#ddd;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;\\'>${coin.value}元</div>'">
                        <div class="coin-label">${coin.value} 元</div>
                        ${hasHint ? '<div class="coin-checkmark">✓</div>' : ''}
                    </div>
                `;
            }).join('');

            // 更新硬幣容器
            const container = document.getElementById('coinsContainer');
            if (container) {
                container.innerHTML = coinsHTML;
            }

            // 確保提示樣式已注入（供 coin-hint / coin-disabled / coin-checkmark 使用）
            if (!document.querySelector('#coin-hint-style')) {
                const style = document.createElement('style');
                style.id = 'coin-hint-style';
                style.textContent = `
                    .coin-hint {
                        position: relative;
                        box-shadow: 0 0 20px rgba(76, 175, 80, 0.8) !important;
                        border: 3px solid #4CAF50 !important;
                    }
                    .coin-disabled {
                        opacity: 0.3 !important;
                        cursor: not-allowed !important;
                        pointer-events: none !important;
                        filter: grayscale(100%) !important;
                    }
                    .coin-checkmark {
                        position: absolute;
                        top: -5px;
                        right: -5px;
                        background: #4CAF50;
                        color: white;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 16px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    }
                `;
                document.head.appendChild(style);
            }
        },

        // 確定投幣（普通/困難模式 + 所有 coinFirst 模式）
        confirmCoinInsertion() {
            this.audio.play('click');

            // 清除語音計時器
            if (this.state.gameState.speechTimer) {
                this.TimerManager.clearTimeout(this.state.gameState.speechTimer);
                this.state.gameState.speechTimer = null;
            }

            // coinFirstFree 模式：確認投幣（飲料尚未選擇），關閉彈窗讓用戶選擇已亮起的飲料
            if (this.state.settings.taskType === 'coinFirstFree' && !this.state.gameState.selectedProduct) {
                const inserted = this.state.gameState.insertedAmount;
                if (inserted === 0) {
                    this.audio.play('error03');
                    this.speech.speak('請先投入硬幣');
                    return;
                }
                this.hideWalletCoinsModal();
                this.state.gameState.coinsInserted = 0;
                this.state.gameState.totalCoinsToInsert = 0;
                // 此時 updateDrinkAvailabilityByCoinAmount 已在投幣時更新飲料狀態
                const availableCount = document.querySelectorAll('.product-item.coin-first-available').length;
                if (availableCount > 0) {
                    this.speech.speak(`已投入 ${this.convertAmountToSpeech(inserted)}，請選擇已亮起的飲料`);
                } else {
                    this.speech.speak(`已投入 ${this.convertAmountToSpeech(inserted)}，金額不足以購買任何飲料，可繼續投幣`);
                    // 重新打開投幣視窗讓用戶繼續投幣
                    this.TimerManager.setTimeout(() => this.showWalletCoinsModal(), 1500, 'uiAnimation');
                }
                return;
            }

            // coinFirstAssigned 模式：確認投幣，驗證金額是否正確，通過後解鎖目標飲料
            if (this.state.settings.taskType === 'coinFirstAssigned' && !this.state.gameState.selectedProduct) {
                const product = this.state.gameState.targetProduct;
                const insertedCoins = this.state.gameState.insertedCoinsDetail;
                const insertedAmount = this.state.gameState.insertedAmount;
                const productPrice = product ? product.price : 0;
                const difficulty = this.state.settings.difficulty;

                if (insertedAmount === 0) {
                    this.audio.play('error03');
                    this.speech.speak('請先投入硬幣');
                    return;
                }
                if (insertedAmount < productPrice) {
                    this.audio.play('error03');
                    this.speech.speak('你付的錢不夠，請再試一次');
                    this._recordCoinFirstAssignedError();
                    this.showCoinsReturnAnimation(insertedCoins);
                    return;
                }
                const paymentRules = DIFFICULTY_PAYMENT_RULES[difficulty];
                if (paymentRules?.checkUnnecessaryOverpayment && insertedAmount > productPrice) {
                    const hasError = this.hasUnnecessaryOverpayment(insertedCoins, productPrice, paymentRules.overpaymentCheckMode);
                    if (hasError) {
                        this.audio.play('error03');
                        this.speech.speak('你付了太多的錢，請再試一次');
                        this._recordCoinFirstAssignedError();
                        this.showCoinsReturnAnimation(insertedCoins);
                        return;
                    }
                }
                // 驗證通過：關閉彈窗，目標飲料已在投幣時即時亮起，引導選擇
                this.hideWalletCoinsModal();
                this.state.gameState.coinsInserted = 0;
                this.state.gameState.totalCoinsToInsert = 0;
                if (this.isAdvancedMode()) {
                    this.state.gameState.normalMode.coinInsertionErrors = 0;
                }
                const confirmedTarget = this.state.gameState.targetProduct;
                if (confirmedTarget) {
                    this.speech.speak(`${confirmedTarget.name}的燈號亮起來了，請點選這個飲料`);
                }
                return;
            }

            const product = this.state.gameState.selectedProduct;
            const insertedCoins = this.state.gameState.insertedCoinsDetail;
            const insertedAmount = this.state.gameState.insertedAmount;
            const productPrice = product ? product.price : 0;

            // 檢查付款金額是否不足
            if (product && insertedAmount < productPrice) {
                // 付錢不夠，播放錯誤音效和語音
                this.audio.play('error03');
                this.speech.speak('你付的錢不夠，請再試一次');

                // 顯示金錢返回動畫，然後重置
                this.showCoinsReturnAnimation(insertedCoins);

                // 記錄錯誤次數（用於step2提示）
                if (this.isAdvancedMode()) {
                    this.state.gameState.normalMode.coinInsertionErrors =
                        (this.state.gameState.normalMode.coinInsertionErrors || 0) + 1;
                    VendingMachine.Debug.log('payment', ` 付款不足錯誤次數: ${this.state.gameState.normalMode.coinInsertionErrors}, 難度: ${this.state.settings.difficulty}`);
                }

                return;
            }

            // 根據難度配置檢查是否多付了不必要的錢幣
            const difficulty = this.state.settings.difficulty;
            const paymentRules = DIFFICULTY_PAYMENT_RULES[difficulty];

            if (paymentRules && paymentRules.checkUnnecessaryOverpayment && product && insertedAmount > productPrice) {
                // 檢查是否有不必要的多付（根據配置的檢查模式）
                const hasError = this.hasUnnecessaryOverpayment(insertedCoins, productPrice, paymentRules.overpaymentCheckMode);

                if (hasError) {
                    // 多付了不必要的錢幣，播放錯誤音效和語音
                    this.audio.play('error03');
                    this.speech.speak('你付了太多的錢，請再試一次');

                    // 顯示金錢返回動畫，然後重置
                    this.showCoinsReturnAnimation(insertedCoins);

                    // 記錄錯誤次數
                    if (this.isAdvancedMode()) {
                        this.state.gameState.normalMode.coinInsertionErrors =
                            (this.state.gameState.normalMode.coinInsertionErrors || 0) + 1;
                        VendingMachine.Debug.log('payment', ` 超額付款錯誤次數: ${this.state.gameState.normalMode.coinInsertionErrors}, 難度: ${this.state.settings.difficulty}`);
                    }

                    return;
                }
            }

            // 付款正確，關閉彈窗
            this.hideWalletCoinsModal();

            // 重置投幣追蹤
            this.state.gameState.coinsInserted = 0;
            this.state.gameState.totalCoinsToInsert = 0;

            // 重置投幣錯誤計數
            if (this.isAdvancedMode()) {
                this.state.gameState.normalMode.coinInsertionErrors = 0;
            }

            // 檢查付款狀態
            this.checkPaymentComplete();
        },

        // 計算最小超過目標金額的硬幣組合（金額最接近目標）
        findMinimumCoinCombination(walletCoins, targetPrice) {
            // 將錢包硬幣轉換為陣列
            const coinArray = [];
            Object.entries(walletCoins).forEach(([value, count]) => {
                for (let i = 0; i < count; i++) {
                    coinArray.push({
                        value: parseInt(value),
                        id: `coin-${value}-${i}`
                    });
                }
            });

            if (coinArray.length === 0) return [];

            // 安全防護：硬幣數超過 20 時改用貪婪法避免凍結（2^20 = 1,048,576）
            const n = coinArray.length;
            if (n > 20) {
                VendingMachine.Debug.warn('hint', ` 硬幣數量過多(${n})，改用貪婪演算法`);
                return this.findMinimumCoinGreedy(coinArray, targetPrice);
            }

            // 找出「金額最接近且大於等於目標金額」的組合
            let minCombination = null;
            let minSum = Infinity; // 最小的總金額
            let minCount = Infinity; // 在相同總金額下，硬幣數量最少

            // 遍歷所有可能的子集
            for (let mask = 1; mask < (1 << n); mask++) {
                let sum = 0;
                let count = 0;
                let combination = [];

                for (let i = 0; i < n; i++) {
                    if (mask & (1 << i)) {
                        sum += coinArray[i].value;
                        count++;
                        combination.push(coinArray[i].id);
                    }
                }

                // 如果這個組合剛好超過或等於目標金額
                if (sum >= targetPrice) {
                    // 選擇總金額最小的組合，如果金額相同則選擇硬幣數量最少的
                    if (sum < minSum || (sum === minSum && count < minCount)) {
                        minSum = sum;
                        minCount = count;
                        minCombination = combination;
                    }
                }
            }

            VendingMachine.Debug.log('hint', ` 目標金額: ${targetPrice}元, 找到的最小組合: 總額${minSum}元, ${minCount}個硬幣`, minCombination);
            return minCombination || [];
        },

        // 貪婪演算法 fallback（硬幣數量過多時使用）
        findMinimumCoinGreedy(coinArray, targetPrice) {
            // 按面額從大到小排序
            const sorted = [...coinArray].sort((a, b) => b.value - a.value);
            const combination = [];
            let remaining = targetPrice;

            for (const coin of sorted) {
                if (remaining <= 0) break;
                combination.push(coin.id);
                remaining -= coin.value;
            }

            // 如果所有硬幣加起來都不夠，回傳全部
            if (remaining > 0) {
                return sorted.map(c => c.id);
            }

            VendingMachine.Debug.log('hint', `貪婪演算法 - 目標金額: ${targetPrice}元, 組合: ${combination.length}個硬幣`);
            return combination;
        },

        // 顯示金錢返回動畫
        showCoinsReturnAnimation(coins) {
            const container = document.getElementById('coinsContainer');
            if (!container) return;

            // 先投幣模式：付款錯誤時立即重新鎖定所有飲料燈號
            if (this.isCoinFirstMode()) {
                document.querySelectorAll('.product-item').forEach(el => {
                    el.classList.remove('coin-first-available', 'coin-first-unlocking');
                    el.classList.add('coin-first-locked');
                });
            }

            // 清空容器
            container.innerHTML = '';

            // 為每個硬幣創建返回動畫
            coins.forEach((coinValue, index) => {
                // 退回硬幣到錢包
                if (!this.state.gameState.walletCoins[coinValue]) {
                    this.state.gameState.walletCoins[coinValue] = 0;
                }
                this.state.gameState.walletCoins[coinValue]++;

                // 創建硬幣元素
                const side = Math.random() > 0.5 ? 'front' : 'back'; // 🆕 隨機正反面
                const coinElement = document.createElement('div');
                coinElement.className = 'individual-coin coin-returning';
                coinElement.style.animationDelay = `${index * 0.1}s`;
                coinElement.innerHTML = `
                    <img src="../images/money/${coinValue}_yuan_${side}.png" alt="${coinValue}元" class="coin-img"
                         onerror="this.outerHTML='<div style=\\'width:70px;height:70px;background:#ddd;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;\\'>${coinValue}元</div>'">
                    <div class="coin-label">${coinValue} 元</div>
                `;

                container.appendChild(coinElement);
            });

            // 添加返回動畫的CSS（@keyframes coinReturn 已移至 injectGlobalAnimationStyles()）
            if (!document.querySelector('#coin-return-animation-style')) {
                const style = document.createElement('style');
                style.id = 'coin-return-animation-style';
                style.textContent = `
                    .coin-returning {
                        animation: coinReturn 0.8s ease-out forwards !important;
                    }
                `;
                document.head.appendChild(style);
            }

            // 等待動畫完成後重置並重新顯示可用硬幣
            this.TimerManager.setTimeout(() => {
                // 重置投入金額和硬幣記錄
                this.state.gameState.insertedAmount = 0;
                this.state.gameState.insertedCoinsDetail = [];

                // 更新顯示
                const insertedDisplay = document.getElementById('insertedAmountDisplay');
                if (insertedDisplay) {
                    insertedDisplay.textContent = '0';
                }

                // 更新主畫面金額顯示
                this.updateAmounts();

                // 重新生成錢包硬幣列表
                const walletCoins = this.state.gameState.walletCoins;
                const coinArray = [];
                Object.entries(walletCoins)
                    .sort(([a], [b]) => b - a)
                    .forEach(([value, count]) => {
                        for (let i = 0; i < count; i++) {
                            coinArray.push({
                                value: parseInt(value),
                                id: `coin-${value}-${i}`
                            });
                        }
                    });

                // 檢查是否需要顯示提示（錯誤3次後，僅普通模式自動顯示）
                const errorCount = this.state.gameState.normalMode.coinInsertionErrors || 0;
                let hintCoinIds = [];
                if (errorCount >= 3 && this.state.settings.difficulty === 'normal') {
                    const product = this.state.gameState.selectedProduct || this.state.gameState.targetProduct;
                    if (product) {
                        hintCoinIds = this.findMinimumCoinCombination(walletCoins, product.price);
                        VendingMachine.Debug.log('hint', ` 投幣錯誤達${errorCount}次，顯示提示硬幣:`, hintCoinIds);
                    }
                }

                const coinsHTML = coinArray.map(coin => {
                    const hasHint = hintCoinIds.includes(coin.id);
                    const showingHint = hintCoinIds.length > 0;  // 是否正在顯示提示
                    const isDisabled = showingHint && !hasHint;  // 非提示硬幣時禁用
                    const side = Math.random() > 0.5 ? 'front' : 'back'; // 🆕 隨機正反面

                    return `
                        <div class="individual-coin ${hasHint ? 'coin-hint' : ''} ${isDisabled ? 'coin-disabled' : ''}"
                             id="${coin.id}"
                             data-value="${coin.value}"
                             data-has-hint="${hasHint}"
                             data-disabled="${isDisabled}"
                             onclick="VendingMachine.clickCoin('${coin.id}', ${coin.value})">
                            <img src="../images/money/${coin.value}_yuan_${side}.png" alt="${coin.value}元" class="coin-img"
                                 onerror="this.outerHTML='<div style=\\'width:70px;height:70px;background:#ddd;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;\\'>${coin.value}元</div>'">
                            <div class="coin-label">${coin.value} 元</div>
                            ${hasHint ? '<div class="coin-checkmark">✓</div>' : ''}
                        </div>
                    `;
                }).join('');

                container.innerHTML = coinsHTML;

                // 困難模式：錯誤3次後顯示提示按鈕
                if (errorCount >= 3 && this.state.settings.difficulty === 'hard') {
                    const titleArea = document.getElementById('coinModalTitle');
                    VendingMachine.Debug.log('hint', ` 檢查提示按鈕顯示條件 - 錯誤次數: ${errorCount}, titleArea:`, titleArea);
                    if (titleArea && !titleArea.querySelector('.hint-btn')) {
                        titleArea.innerHTML = `
                            <button class="hint-btn" onclick="VendingMachine.showCoinHint()"
                                    style="padding: 8px 16px; background: #FF9800; color: white; border: none;
                                           border-radius: 8px; font-size: 14px; cursor: pointer;
                                           transition: all 0.3s; box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);"
                                    onmouseover="this.style.background='#F57C00'"
                                    onmouseout="this.style.background='#FF9800'">
                                💡 提示
                            </button>
                            <h3 style="margin: 0;">💰 請投入硬幣</h3>
                        `;
                        VendingMachine.Debug.log('hint', ` 困難模式錯誤達${errorCount}次，顯示提示按鈕`);
                    }
                }

                // 添加提示樣式
                if (!document.querySelector('#coin-hint-style')) {
                    const style = document.createElement('style');
                    style.id = 'coin-hint-style';
                    style.textContent = `
                        .coin-hint {
                            position: relative;
                            box-shadow: 0 0 20px rgba(76, 175, 80, 0.8) !important;
                            border: 3px solid #4CAF50 !important;
                        }
                        .coin-disabled {
                            opacity: 0.3 !important;
                            cursor: not-allowed !important;
                            pointer-events: none !important;
                            filter: grayscale(100%) !important;
                        }
                        .coin-checkmark {
                            position: absolute;
                            top: -5px;
                            right: -5px;
                            background: #4CAF50;
                            color: white;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                            font-size: 16px;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                        }
                    `;
                    document.head.appendChild(style);
                }
            }, coins.length * 100 + 800, 'uiAnimation');
        },

        // 檢查是否有不必要的多付（根據檢查模式）
        // mode: 'single' - 任何單個硬幣夠付即錯誤
        // mode: 'subset-enough' - 任何子集合夠付即錯誤（普通模式）
        // mode: 'subset' - 任何子集合剛好等於價格即錯誤（困難模式）
        hasUnnecessaryOverpayment(coins, targetPrice, mode = 'subset') {
            // 如果沒有超過價格，不算多付
            const totalAmount = coins.reduce((sum, coin) => sum + coin, 0);
            if (totalAmount <= targetPrice) return false;

            // 模式1：單個硬幣檢查
            if (mode === 'single') {
                // 檢查是否有任何單個硬幣已經足夠支付
                for (let i = 0; i < coins.length; i++) {
                    if (coins[i] >= targetPrice) {
                        VendingMachine.Debug.log('payment', ` 發現不必要的多付：單個硬幣 ${coins[i]} 元已足夠支付 ${targetPrice} 元，其他硬幣是多餘的`);
                        return true;
                    }
                }
                return false;
            }

            // 模式2：子集合足夠檢查（普通模式）
            if (mode === 'subset-enough') {
                const n = coins.length;

                // 遍歷所有可能的子集（除了空集和全集）
                for (let mask = 1; mask < (1 << n) - 1; mask++) {
                    let subsetSum = 0;
                    let subsetSize = 0;

                    for (let i = 0; i < n; i++) {
                        if (mask & (1 << i)) {
                            subsetSum += coins[i];
                            subsetSize++;
                        }
                    }

                    // 任何子集合金額 >= 價格時，就算不必要的多付
                    if (subsetSum >= targetPrice && subsetSize < n) {
                        VendingMachine.Debug.log('payment', ` 發現不必要的多付：子集金額 ${subsetSum} 元已足夠支付 ${targetPrice} 元，有多餘硬幣`);
                        return true;
                    }
                }
                return false;
            }

            // 模式3：子集合剛好檢查（困難模式）
            if (mode === 'subset') {
                const n = coins.length;

                // 遍歷所有可能的子集（除了空集和全集）
                for (let mask = 1; mask < (1 << n) - 1; mask++) {
                    let subsetSum = 0;
                    let subsetSize = 0;

                    for (let i = 0; i < n; i++) {
                        if (mask & (1 << i)) {
                            subsetSum += coins[i];
                            subsetSize++;
                        }
                    }

                    // 只有當子集金額「剛好等於」價格時，才算不必要的多付
                    if (subsetSum === targetPrice && subsetSize < n) {
                        VendingMachine.Debug.log('payment', ` 發現不必要的多付：子集金額 ${subsetSum} 剛好等於需求 ${targetPrice}，有多餘硬幣`);
                        return true;
                    }
                }
            }

            return false;
        },

        // 取消投幣（關閉彈窗，但保留已投入的金額）
        cancelCoinInsertion() {
            // 清除語音計時器
            if (this.state.gameState.speechTimer) {
                this.TimerManager.clearTimeout(this.state.gameState.speechTimer);
                this.state.gameState.speechTimer = null;
            }

            // 關閉彈窗
            this.hideWalletCoinsModal();

            // 重置投幣追蹤
            this.state.gameState.coinsInserted = 0;
            this.state.gameState.totalCoinsToInsert = 0;

            // coinFirst 模式：取消後回到投幣提示（尚未選飲料時）
            if (this.isCoinFirstMode() && !this.state.gameState.selectedProduct) {
                if (this.state.settings.difficulty === 'easy') {
                    // 簡單模式：重設流程步驟並顯示投幣口提示
                    this.setFlowStep('INSERT_COIN');
                    this.clearEasyModeHint();
                    this.showEasyModeHint('insert_coin', '#coinSlot');
                    this.speech.speak('已關閉投幣視窗，請再點擊投幣口繼續投幣');
                } else {
                    // 普通/困難模式：重新播放引導語音，提示繼續投幣
                    this.speech.speak('已關閉投幣視窗，請繼續投幣');
                }
                return;
            }

            // 簡單模式：檢查是否需要繼續投幣
            if (this.state.settings.difficulty === 'easy' && this.state.gameState.selectedProduct) {
                const product = this.state.gameState.selectedProduct;
                const diff = product.price - this.state.gameState.insertedAmount;

                if (diff > 0) {
                    // 投幣未完成，保持提示動畫
                    this.setFlowStep('INSERT_COIN');
                    this.clearEasyModeHint();
                    this.showEasyModeHint('coin_slot', '#coinSlot');
                } else {
                    // 投幣已完成，提示確認購買
                    this.setFlowStep('CONFIRM_PURCHASE');
                    this.clearEasyModeHint();
                    this.showEasyModeHint('confirm_purchase', '#confirmBtn');
                }
            }

            this.speech.speak('已關閉投幣視窗');
        },

        // 隱藏錢包硬幣彈跳視窗
        hideWalletCoinsModal() {
            const modal = document.getElementById('wallet-coins-modal');
            if (modal) {
                modal.remove();
            }
        },

        // 隱藏投幣彈窗
        hideCoinModal() {
            this.audio.play('click');
            document.getElementById('coinModal').classList.add('hidden');
        },

        // 投幣
        insertMoney(amount) {
            VendingMachine.Debug.log('payment', ` 投入 ${amount} 元`);

            // 防止手機端重複觸發
            const now = Date.now();
            if (this._lastInsertTime && now - this._lastInsertTime < 300) {
                VendingMachine.Debug.log('payment', ' 防抖：忽略重複投幣');
                return;
            }
            this._lastInsertTime = now;

            this.audio.play('coinInsert');
            this.hideCoinModal();

            if (!this.state.gameState.selectedProduct) {
                return;
            }

            this.state.gameState.insertedAmount += amount;
            this.updateAmounts();

            const product = this.state.gameState.selectedProduct;
            const diff = product.price - this.state.gameState.insertedAmount;

            if (diff > 0) {
                document.getElementById('screenTitle').textContent = `投入金額：${this.state.gameState.insertedAmount} 元`;
                document.getElementById('screenMessage').textContent = `還需要：${diff} 元`;
                this.speech.speak(`已投入 ${this.convertAmountToSpeech(this.state.gameState.insertedAmount)}，還需要 ${this.convertAmountToSpeech(diff)}`);
            } else {
                document.getElementById('screenTitle').textContent = '金額足夠';
                document.getElementById('screenMessage').textContent = '請按確認購買';
                this.speech.speak('金額足夠！請按確認購買');
            }
        },

        // 處理付款（取消測驗題目，直接出貨）
        processPayment() {
            VendingMachine.Debug.log('payment', ' 處理付款');

            // 防止手機端重複觸發
            const now = Date.now();
            if (this._lastPaymentTime && now - this._lastPaymentTime < A1_DEBOUNCE.PAYMENT_CONFIRM) {
                VendingMachine.Debug.log('payment', ' 防抖：忽略重複點擊');
                return;
            }
            this._lastPaymentTime = now;

            // 防止飲料已出貨後重複確認購買（coinFirst 模式不受 handleNormalModeAction 步驟保護）
            if (this.state.gameState.productVended) {
                VendingMachine.Debug.log('payment', ' 飲料已出貨，忽略重複確認購買');
                this.audio.play('error03');
                const changeAmt = this.state.gameState.changeAmount;
                if (changeAmt > 0) {
                    this.speech.speak(`已完成購買，請到取物口拿取飲料，並記得拿退幣口的零錢`);
                } else {
                    this.speech.speak('已完成購買，請到取物口拿取飲料');
                }
                return;
            }

            // 普通/困難模式：統一的錯誤檢查
            if (this.isAdvancedMode()) {
                if (this.handleNormalModeAction('confirmPurchase')) {
                    return; // 這是錯誤操作
                }
            }

            // 簡單模式：流程驗證
            if (!this.validateAction('processPayment', '#confirmBtn')) {
                return;
            }

            if (!this.state.gameState.selectedProduct) {
                return;
            }

            const product = this.state.gameState.selectedProduct;
            const diff = product.price - this.state.gameState.insertedAmount;

            if (diff > 0) {
                window.LearningTracker?.logStep?.(`任務：投入足夠金額購買 ${product.name}(${product.price}元)`, false);
                // 簡單模式：使用警告系統
                if (this.state.settings.difficulty === 'easy') {
                    this.audio.play('error03');
                    this.speech.speak(`金額不足，還需要 ${this.convertAmountToSpeech(diff)}`);
                } else {
                    this.showToast(`金額不足，還需要 ${diff} 元`, 'error');
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this.audio.play('error');
                }
                return;
            }
            window.LearningTracker?.logStep?.(`任務：投入足夠金額購買 ${product.name}(${product.price}元)`, true);

            // 簡單模式：清除所有提示
            if (this.state.settings.difficulty === 'easy') {
                this.clearEasyModeHint();
            }

            // 移除飲料的選中效果（簡單和進階模式）
            if (this.state.settings.difficulty === 'easy' || this.isAdvancedMode()) {
                document.querySelectorAll('.product-item').forEach(item => {
                    item.classList.remove('selected');
                });
            }

            // 取消測驗題目，直接出貨
            this.vendProduct();
        },

        // 出貨
        vendProduct() {
            VendingMachine.Debug.log('flow', ' 出貨');
            this.audio.play('vendSuccess');

            const product = this.state.gameState.selectedProduct;
            const insertedAmount = this.state.gameState.insertedAmount;
            const change = insertedAmount - product.price;
            if (window.TutorContext) TutorContext.update({ phase: change > 0 ? 'change' : 'pickup' });

            // 標記已出貨
            this.state.gameState.productVended = true;

            // 普通/困難模式：進入步驟4（取物取零錢）
            if (this.isAdvancedMode()) {
                this.advanceToNextStep('step4');
            }

            // 計算並顯示找零
            if (change > 0) {
                document.getElementById('screenTitle').textContent = '購買成功';
                document.getElementById('screenMessage').textContent = `請到取物口拿飲料\n找零：${change} 元`;
                this.speech.speak(`購買成功，請到取物口拿飲料，找零 ${this.convertAmountToSpeech(change)}`);

                // 在退幣口顯示找零
                this.showChangeInRefundSlot(change);
            } else {
                document.getElementById('screenTitle').textContent = '購買成功';
                document.getElementById('screenMessage').textContent = '請到取物口拿飲料';
                this.speech.speak('購買成功，請到取物口拿飲料');
            }

            const binContent = document.getElementById('binContent');
            const binImgSrc = product.imageUrl || product.image;
            binContent.innerHTML = `
                <div class="vended-product" onclick="VendingMachine.pickUpProduct()">
                    <img src="${binImgSrc}" alt="${product.name}"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22150%22%3E%3Crect width=%22100%22 height=%22150%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2214%22 text-anchor=%22middle%22 fill=%22%23999%22%3E${product.name}%3C/text%3E%3C/svg%3E'">
                </div>
            `;

            this._mobileScrollTo('.retrieval-bin'); // 📱 手機：取物口在上方飲料窗底部

            // 簡單模式：更新流程步驟並添加黃色發光提示動畫到取物口的飲料
            if (this.state.settings.difficulty === 'easy') {
                this.setFlowStep('PICKUP_PRODUCT');
                this.TimerManager.setTimeout(() => {
                    const vendedProduct = document.querySelector('.vended-product');
                    if (vendedProduct) {
                        vendedProduct.classList.add('easy-mode-hint');
                    }
                }, 600, 'uiAnimation'); // 等待掉落動畫完成後再顯示提示
            }
        },

        // 在退幣口顯示找零
        showChangeInRefundSlot(change) {
            const refundSlotOutput = document.getElementById('refundSlotOutput');
            if (!refundSlotOutput) return;

            // 將找零拆分成硬幣
            const coins = this.breakDownChange(change);

            refundSlotOutput.innerHTML = '';
            coins.forEach((coin, index) => {
                const coinElement = document.createElement('div');
                coinElement.className = 'refund-coin';

                // 🆕 隨機正反面
                const side = Math.random() > 0.5 ? 'front' : 'back';
                const coinImage = `../images/money/${coin}_yuan_${side}.png`;

                coinElement.innerHTML = `
                    <img src="${coinImage}" alt="${coin}元" style="width: 45px; height: 45px; object-fit: contain;">
                `;
                coinElement.style.animationDelay = `${index * 0.1}s`;
                coinElement.onclick = () => this.pickUpChange();
                refundSlotOutput.appendChild(coinElement);
            });

            // 儲存找零金額
            this.state.gameState.changeAmount = change;
        },

        // 將金額拆分成硬幣
        breakDownChange(amount) {
            const coins = [];
            const coinTypes = [50, 10, 5, 1];

            let remaining = amount;
            for (const coin of coinTypes) {
                while (remaining >= coin) {
                    coins.push(coin);
                    remaining -= coin;
                }
            }

            return coins;
        },

        // 點擊退幣口的找零
        pickUpChange() {
            const change = this.state.gameState.changeAmount;
            if (!change || change <= 0) return;

            // 普通模式：這是正確操作，不需要錯誤檢查
            // （拿取飲料或零錢都是正確的）

            this.audio.play('click');

            // 普通/困難模式：移除步驟4的提示（因為這是正確操作）
            if (this.isAdvancedMode()) {
                this.removeNormalModeHint('step4');
            }

            // 顯示找零彈窗
            this.showChangeModal(change);
        },

        // 顯示找零彈窗
        showChangeModal(change) {
            const coins = this.breakDownChange(change);
            const coinsHTML = coins.map(coin => {
                // 🆕 隨機正反面
                const side = Math.random() > 0.5 ? 'front' : 'back';
                const coinImage = `../images/money/${coin}_yuan_${side}.png`;
                return `<div class="change-coin-item">
                    <img src="${coinImage}" alt="${coin}元" class="change-coin-img">
                    <div class="change-coin-value">${coin} 元</div>
                </div>`;
            }).join('');

            const modal = document.createElement('div');
            modal.id = 'change-modal';
            modal.innerHTML = `
                <div class="change-overlay"></div>
                <div class="change-card">
                    <div class="change-header">
                        <div class="change-icon">💰</div>
                        <h2>找零</h2>
                    </div>
                    <div class="change-amount-display">
                        <span class="change-label">找零金額</span>
                        <span class="change-total">${change} 元</span>
                    </div>
                    <div class="change-coins-container">
                        <div class="change-coins-label">硬幣明細</div>
                        <div class="change-coins-list">
                            ${coinsHTML}
                        </div>
                    </div>
                    <div class="change-message">
                        <p>✅ 請收好您的零錢</p>
                    </div>
                    <button class="change-confirm-btn" onclick="VendingMachine.closeChangeModal()">
                        <span>確認收取</span>
                    </button>
                </div>
                <style>
                    #change-modal{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:10000;display:flex;align-items:center;justify-content:center;animation:fadeIn .3s}
                    .change-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);backdrop-filter:blur(10px)}
                    .change-card{position:relative;z-index:10001;background:linear-gradient(135deg,#fff 0%,#f8f9fa 100%);border-radius:25px;padding:35px 30px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.3);animation:slideUp .4s cubic-bezier(.34,1.56,.64,1)}
                    .change-header{text-align:center;margin-bottom:25px}
                    .change-icon{font-size:4rem;margin-bottom:10px;animation:bounce 1s infinite}
                    .change-header h2{font-size:2rem;font-weight:bold;color:#2c3e50;margin:0}
                    .change-amount-display{background:linear-gradient(135deg,#ffd700 0%,#ffed4e 100%);border-radius:15px;padding:20px;text-align:center;margin-bottom:25px;box-shadow:0 5px 15px rgba(255,215,0,.3)}
                    .change-label{display:block;font-size:.9rem;color:#856404;margin-bottom:5px;font-weight:500}
                    .change-total{display:block;font-size:2.5rem;font-weight:bold;color:#856404;text-shadow:2px 2px 4px rgba(0,0,0,.1)}
                    .change-coins-container{background:#fff;border-radius:15px;padding:20px;margin-bottom:20px;box-shadow:0 3px 10px rgba(0,0,0,.08)}
                    .change-coins-label{font-size:.9rem;color:#7f8c8d;margin-bottom:15px;font-weight:500;text-align:center}
                    .change-coins-list{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
                    .change-coin-item{background:linear-gradient(135deg,#e3f2fd 0%,#bbdefb 100%);border-radius:12px;padding:12px 16px;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);animation:coinPop .3s cubic-bezier(.34,1.56,.64,1)}
                    .change-coin-img{width:50px;height:50px;object-fit:contain}
                    .change-coin-value{font-size:0.9rem;font-weight:600;color:#1976d2}
                    .change-message{background:linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%);border:1px solid #4caf50;border-radius:12px;padding:15px;margin-bottom:20px;text-align:center}
                    .change-message p{margin:0;color:#2e7d32;font-size:1rem;font-weight:500}
                    .change-confirm-btn{width:100%;background:linear-gradient(135deg,#4caf50 0%,#45a049 100%);color:#fff;border:none;padding:15px;border-radius:50px;font-size:1.1rem;font-weight:bold;cursor:pointer;box-shadow:0 8px 20px rgba(76,175,80,.3);transition:all .3s cubic-bezier(.34,1.56,.64,1)}
                    .change-confirm-btn:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(76,175,80,.4)}
                    .change-confirm-btn:active{transform:translateY(0)}
                    .refund-coin{display:inline-block;background:linear-gradient(135deg,#ffd700,#ffed4e);border-radius:50%;width:40px;height:40px;line-height:40px;text-align:center;font-weight:bold;font-size:12px;color:#856404;margin:5px;cursor:pointer;animation:coinDrop .5s ease-out forwards;box-shadow:0 3px 10px rgba(255,215,0,.4);transition:transform .2s}
                    .refund-coin:hover{transform:scale(1.1)}
                    @media(max-width:600px){.change-card{padding:25px 20px}.change-header h2{font-size:1.5rem}.change-total{font-size:2rem}}
                </style>
            `;
            document.body.appendChild(modal);
            this.speech.speak(`找零 ${this.convertAmountToSpeech(change)}，請收好您的零錢`);
        },

        // 關閉找零彈窗
        closeChangeModal() {
            VendingMachine.Debug.log('coin', ' 關閉找零視窗');

            const modal = document.getElementById('change-modal');
            if (modal) {
                modal.remove();
            }

            // 清空退幣口
            const refundSlotOutput = document.getElementById('refundSlotOutput');
            if (refundSlotOutput) {
                refundSlotOutput.innerHTML = '';
            }

            // 移除退幣口的提示動畫（如果有的話）
            const refundSlot = document.getElementById('refundSlot');
            if (refundSlot) {
                refundSlot.classList.remove('easy-mode-hint');
            }

            // 重置找零金額
            this.state.gameState.changeAmount = 0;

            // 普通/困難模式：拿取零錢後，如果還沒拿飲料，播放語音並重置錯誤計數
            if (this.isAdvancedMode() && !this.state.gameState.productPickedUp) {
                this.speech.speak('請拿取取物口的飲料');

                this.state.gameState.normalMode.errorCount = 0;
                this.state.gameState.normalMode.hintShown = false;
            } else if (this.state.settings.difficulty === 'easy' && !this.state.gameState.productPickedUp) {
                // 簡單模式：立即在飲料上顯示提示
                const vendedProduct = document.querySelector('.vended-product');
                if (vendedProduct) {
                    vendedProduct.classList.add('easy-mode-hint');
                }
            }

            // 如果已經拿取飲料，則完成交易進入交易摘要
            if (this.state.gameState.productPickedUp) {
                this.completeTransaction();
            }
        },

        // 從取物口拿取飲料（顯示彈跳視窗）- 現代設計
        pickUpProduct() {
            // 防止手機端重複觸發
            const now = Date.now();
            if (this._lastPickupTime && now - this._lastPickupTime < A1_DEBOUNCE.PICKUP) {
                VendingMachine.Debug.log('flow', ' 防抖：忽略重複點擊');
                return;
            }
            this._lastPickupTime = now;

            const product = this.state.gameState.selectedProduct;
            if (!product) return;

            // 普通模式：這是正確操作，不需要錯誤檢查
            // （拿取飲料或零錢都是正確的）

            // 簡單模式：流程驗證
            if (!this.validateAction('pickUpProduct', '.vended-product')) {
                return;
            }

            this.audio.play('click');

            // 簡單模式：清除取物口的提示
            if (this.state.settings.difficulty === 'easy') {
                this.clearEasyModeHint();
            }

            // 普通/困難模式：移除步驟4的提示（因為這是正確操作）
            if (this.isAdvancedMode()) {
                this.removeNormalModeHint('step4');
            }

            const modal = document.createElement('div');
            modal.id = 'pickup-product-modal';
            modal.innerHTML = `
                <div class="pickup-overlay"></div>
                <div class="pickup-card">
                    <div class="success-icon">
                        <svg class="checkmark" viewBox="0 0 52 52">
                            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                            <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                        </svg>
                    </div>
                    <h2 class="pickup-title">🎉 購買成功！</h2>
                    <div class="product-showcase">
                        <div class="product-glow"></div>
                        <img src="${product.imageUrl || product.image}" alt="${product.name}" class="product-img"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22200%22%3E%3Crect width=%22150%22 height=%22200%22 fill=%22%23e0e0e0%22 rx=%2210%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 text-anchor=%22middle%22 fill=%22%23999%22%3E${product.name}%3C/text%3E%3C/svg%3E'">
                    </div>
                    <div class="info-card">
                        <h3>${product.name}</h3>
                        <div class="price-tag"><span>價格</span><strong>${product.price} 元</strong></div>
                    </div>
                    <div class="success-msg"><p>感謝購買！請取走您的飲料</p></div>
                    <button class="confirm-btn" onclick="VendingMachine.closePickupModal()">
                        <span>確認</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 10L9 12L13 8M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                </div>
                <style>
                    #pickup-product-modal{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:10000;display:flex;align-items:center;justify-content:center;animation:fadeIn .3s}
                    .pickup-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.75);backdrop-filter:blur(8px)}
                    .pickup-card{position:relative;z-index:10001;background:linear-gradient(135deg,#fff 0%,#f8f9fa 100%);border-radius:30px;padding:40px 30px;max-width:450px;width:90%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,.3);animation:slideUp .4s cubic-bezier(.34,1.56,.64,1);text-align:center}
                    .success-icon{width:80px;height:80px;margin:0 auto 20px}
                    .checkmark{width:80px;height:80px;border-radius:50%;display:block;stroke-width:3;stroke:#fff;stroke-miterlimit:10;background:#4caf50;animation:fillBackground .4s ease-in-out forwards,scale .3s ease-in-out .5s both}
                    .checkmark-circle{stroke-dasharray:166;stroke-dashoffset:166;stroke-width:3;stroke:#4caf50;fill:#4caf50;animation:circleStroke .6s cubic-bezier(.65,0,.45,1) forwards}
                    .checkmark-check{stroke-dasharray:48;stroke-dashoffset:48;stroke:#fff;stroke-width:3;animation:checkStroke .3s cubic-bezier(.65,0,.45,1) .4s forwards}
                    .pickup-title{font-size:2rem;font-weight:bold;color:#2c3e50;margin-bottom:30px;text-shadow:2px 2px 4px rgba(0,0,0,.05)}
                    .product-showcase{margin-bottom:25px;position:relative;display:inline-block}
                    .product-glow{position:absolute;inset:-20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:20px;filter:blur(20px);opacity:.5;z-index:-1}
                    .product-showcase{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:20px;padding:30px;box-shadow:0 10px 30px rgba(102,126,234,.3);animation:float 3s ease-in-out infinite}
                    .product-img{width:150px;height:200px;object-fit:contain;filter:drop-shadow(0 5px 15px rgba(0,0,0,.2))}
                    .info-card{background:#fff;border-radius:15px;padding:20px;margin-bottom:20px;box-shadow:0 5px 15px rgba(0,0,0,.08)}
                    .info-card h3{font-size:1.5rem;font-weight:bold;color:#2c3e50;margin-bottom:15px}
                    .price-tag{display:flex;align-items:center;justify-content:center;gap:10px}
                    .price-tag span{font-size:.9rem;color:#7f8c8d}
                    .price-tag strong{font-size:1.8rem;font-weight:bold;color:#e74c3c}
                    .success-msg{background:linear-gradient(135deg,#e8f5e9 0%,#c8e6c9 100%);border:1px solid #4caf50;border-radius:10px;padding:15px;margin-bottom:25px;text-align:center}
                    .success-msg p{margin:0;color:#2e7d32;font-size:1rem;font-weight:500}
                    .confirm-btn{background:linear-gradient(135deg,#4caf50 0%,#45a049 100%);color:#fff;border:none;padding:15px 40px;border-radius:50px;font-size:1.1rem;font-weight:bold;cursor:pointer;display:inline-flex;align-items:center;gap:10px;box-shadow:0 8px 20px rgba(76,175,80,.3);transition:all .3s cubic-bezier(.34,1.56,.64,1)}
                    .confirm-btn:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(76,175,80,.4)}
                    .confirm-btn:active{transform:translateY(-1px)}
                    @media(max-width:600px){.pickup-card{padding:30px 20px}.pickup-title{font-size:1.5rem}.product-img{width:120px;height:160px}.info-card h3{font-size:1.2rem}.price-tag strong{font-size:1.5rem}}
                </style>
            `;
            document.body.appendChild(modal);

            // 🎆 簡單模式：彈窗出現後立即播放煙火動畫和音效
            if (this.state.settings.difficulty === 'easy') {
                VendingMachine.Debug.log('ui', '🎆 [簡單模式] 取物彈窗顯示，立即播放煙火動畫');
                this.startFireworksAnimation();
                this.audio.play('correct');
            }

            // 播放語音：「你購買了1瓶×，共×元」
            this.speech.speak(`你購買了1瓶${product.name}，共${this.convertAmountToSpeech(product.price)}`);
        },

        // 關閉取貨彈跳視窗
        closePickupModal() {
            VendingMachine.Debug.log('flow', ' 關閉取貨視窗');

            const modal = document.getElementById('pickup-product-modal');
            if (modal) {
                modal.remove();
            }

            // 移除取物口的飲料圖示
            const binContent = document.getElementById('binContent');
            if (binContent) {
                binContent.innerHTML = '';
            }

            // 檢查是否有找零需要拿取（簡單和進階模式）
            if ((this.state.settings.difficulty === 'easy' || this.isAdvancedMode()) &&
                this.state.gameState.changeAmount > 0) {
                VendingMachine.Debug.log('flow', ' 有找零需要拿取，提示使用者');

                // 普通/困難模式：播放「請拿取退幣口的零錢，共×元」，不添加提示動畫
                if (this.isAdvancedMode()) {
                    this.speech.speak(`請拿取退幣口的零錢，共${this.convertAmountToSpeech(this.state.gameState.changeAmount)}`);

                    // 拿取飲料後，如果還有零錢沒拿，重置錯誤計數
                    this.state.gameState.normalMode.errorCount = 0;
                    this.state.gameState.normalMode.hintShown = false;
                } else {
                    // 簡單模式：保持原有邏輯
                    this.speech.speak('請拿取退幣口的零錢');

                    // 在退幣口添加提示動畫
                    const refundSlot = document.getElementById('refundSlot');
                    if (refundSlot) {
                        refundSlot.classList.add('easy-mode-hint');
                    }
                }

                // 標記已拿取飲料
                this.state.gameState.productPickedUp = true;
                return;
            }

            // 沒有找零，直接進入交易摘要
            this.completeTransaction();
        },

        // 完成交易，進入交易摘要
        completeTransaction() {
            VendingMachine.Debug.log('flow', ' 完成交易，進入交易摘要');

            // 更新完成題數
            this.state.gameState.completedQuestions++;
            this.state.gameState.correctAnswers++;

            VendingMachine.Debug.log('flow', ' 已完成題數:', this.state.gameState.completedQuestions);

            // 進入交易摘要
            this.showTransactionSummary();
        },

        // 交易摘要畫面（參考 a1）
        showTransactionSummary() {
            VendingMachine.Debug.log('flow', ' 顯示交易摘要畫面');

            const app = document.getElementById('app');
            const product = this.state.gameState.selectedProduct;
            const insertedAmount = this.state.gameState.insertedAmount;
            const change = insertedAmount - product.price;
            const currentQuestion = this.state.gameState.completedQuestions;

            VendingMachine.Debug.log('flow', ' 商品:', product.name, '價格:', product.price, '已付:', insertedAmount, '找零:', change);

            const mkMoneyIcons = (amount) => {
                if (!amount || amount <= 0) return '';
                const denoms = [1000, 500, 100, 50, 10, 5, 1];
                const imgs = [];
                let rem = amount;
                for (const d of denoms) {
                    const cnt = Math.floor(rem / d);
                    for (let i = 0; i < cnt; i++) {
                        const face = Math.random() < 0.5 ? 'back' : 'front';
                        imgs.push({ d, face });
                    }
                    rem -= cnt * d;
                }
                return imgs.map(({ d, face }) => {
                    const isBill = d >= 100;
                    const w = isBill ? 68 : 44;
                    return `<img src="../images/money/${d}_yuan_${face}.png" alt="${d}元"
                        style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};${isBill ? 'border-radius:4px' : 'border-radius:50%'};margin:3px;" draggable="false" onerror="this.style.display='none'">`;
                }).join('');
            };

            app.innerHTML = `
                <div class="transaction-summary-screen">
                    <div class="summary-content">
                        <div class="summary-header">
                            <h1>📋 交易完成</h1>
                            <p>第 ${currentQuestion} 題已完成</p>
                        </div>

                        <div class="transaction-details">
                            <div class="summary-card">
                                <h2>交易摘要</h2>
                                ${(product.imageUrl || product.image) ? `
                                    <div style="text-align:center; margin: 0.8rem 0 1.5rem;">
                                        <img src="${product.imageUrl || product.image}" alt="${product.name}"
                                             style="width:180px;height:180px;object-fit:contain;border-radius:16px;
                                                    box-shadow:0 6px 20px rgba(0,0,0,0.18);
                                                    animation:productReveal 0.5s ease-out;"
                                             onerror="this.style.display='none'">
                                    </div>
                                ` : `<div style="text-align:center;font-size:5rem;margin:0.8rem 0 1.2rem;">${product.emoji || '🥤'}</div>`}
                                <div class="summary-item">
                                    <span>購買商品：</span>
                                    <span>${product.name}</span>
                                </div>
                                <div class="summary-item">
                                    <span>商品價格：</span>
                                    <span>${product.price} 元</span>
                                </div>
                                <div class="a1-money-icons-row">${mkMoneyIcons(product.price)}</div>
                                <div class="summary-item">
                                    <span>已付金額：</span>
                                    <span>${insertedAmount} 元</span>
                                </div>
                                <div class="a1-money-icons-row">${mkMoneyIcons(insertedAmount)}</div>
                                <div class="summary-item">
                                    <span>找零金額：</span>
                                    <span>${change} 元</span>
                                </div>
                                ${change > 0 ? `<div class="a1-money-icons-row">${mkMoneyIcons(change)}</div>` : ''}
                            </div>
                        </div>

                        <div class="next-round-notice">
                            <p>${this.state.gameState.completedQuestions >= this.state.settings.questionCount ? '已完成購物任務' : '準備進入下一輪購物...'}</p>
                        </div>
                    </div>
                </div>

                <style>
                    .transaction-summary-screen {
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, var(--vm-primary) 0%, var(--vm-primary-dark) 100%);
                        color: white;
                        text-align: center;
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        overflow-y: auto;
                    }

                    .summary-content {
                        max-width: 760px;
                        width: 92%;
                        padding: 2rem;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                        box-sizing: border-box;
                        margin: auto;
                    }

                    .summary-header h1 {
                        font-size: 2.5rem;
                        margin-bottom: 0.5rem;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                    }

                    .summary-header p {
                        font-size: 1.2rem;
                        opacity: 0.9;
                        margin-bottom: 2rem;
                    }

                    .summary-card {
                        background: rgba(255, 255, 255, 0.9);
                        color: #333;
                        border-radius: 20px;
                        padding: 2.5rem;
                        margin: 1.5rem 0;
                        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
                    }

                    .summary-card h2 {
                        color: var(--vm-primary);
                        margin-bottom: 1.5rem;
                        font-size: 1.8rem;
                        text-align: center;
                    }

                    .summary-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 1rem 0 0.4rem;
                        border-bottom: none;
                        font-size: 1.3rem;
                    }

                    .a1-money-icons-row {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        gap: 2px;
                        padding: 0.4rem 0 0.8rem;
                        border-bottom: 1px solid #f0f0f0;
                        min-height: 20px;
                    }

                    .summary-item:last-of-type {
                        font-weight: bold;
                        color: var(--vm-primary);
                    }

                    .next-round-notice {
                        margin-top: 2rem;
                        font-size: 1.2rem;
                        opacity: 0.9;
                    }

                    @keyframes productReveal {
                        0%   { opacity: 0; transform: scale(0.7) translateY(10px); }
                        60%  { transform: scale(1.06) translateY(-2px); }
                        100% { opacity: 1; transform: scale(1) translateY(0); }
                    }

                    /* 手機端：縮小外框與卡片內距，讓內容善用螢幕寬度 */
                    @media (max-width: 600px) {
                        .summary-content { padding: 1.2rem; border-radius: 16px; }
                        .summary-card { padding: 1.5rem 1.2rem; }
                        .summary-header h1 { font-size: 2rem; }
                        .summary-item { font-size: 1.15rem; }
                    }
                </style>
            `;

            // 播放語音並等待完成
            const speechText = `購買商品：${product.name}，商品價格：${product.price}元，已付金額：${insertedAmount}元，找零金額：${change}元`;

            VendingMachine.Debug.log('flow', ' 播放交易摘要語音:', speechText);

            this.speech.speak(speechText, {
                callback: () => {
                    VendingMachine.Debug.log('flow', ' 語音播放完成，等待 2 秒後進入下一輪');
                    // 語音播放完成後，等待 2 秒再進入下一輪
                    this.TimerManager.setTimeout(() => {
                        this.checkTestCompletion();
                    }, 2000, 'screenTransition');
                }
            });
        },

        // 檢查測驗是否完成
        checkTestCompletion() {
            const completed = this.state.gameState.completedQuestions;
            const total = this.state.settings.questionCount;

            if (completed >= total) {
                // 測驗完成
                this.showResults();
            } else {
                // 繼續下一題，重新開始流程
                this.startNewRound();
            }
        },

        // 開始新一輪
        startNewRound() {
            VendingMachine.Debug.log('flow', ' 開始新一輪');

            // 重置遊戲狀態
            this.state.gameState.selectedProduct = null;
            this.state.gameState.targetProduct = null;
            this.state.gameState.insertedAmount = 0;
            this.state.gameState.currentProducts = [];
            this.state.gameState.changeAmount = 0;
            this.state.gameState.productPickedUp = false;
            this.state.gameState.productVended = false;

            // 普通/困難模式：重置步驟和錯誤計數
            if (this.isAdvancedMode()) {
                this.state.gameState.normalMode = {
                    currentStep: 'step1',
                    errorCount: 0,
                    hintShown: false,
                    coinInsertionErrors: 0,
                    hintTimer: null
                };
            }

            // 簡單模式：重新準備飲料和錢包（assigned 和 coinFirstAssigned 均適用）
            if (this.state.settings.difficulty === 'easy' && (this.state.settings.taskType === 'assigned' || this.state.settings.taskType === 'coinFirstAssigned')) {
                this.prepareShoppingSessionForEasyMode();
            } else {
                // 普通/困難模式：重新生成錢包並進入歡迎畫面
                this.generateWalletCoins();
                this.showWelcomeScreen();
            }
        },

        // 顯示結果
        showResults() {
            // 停用輔助點擊模式（完成畫面不需要輔助）
            const gs = this.state.gameState;
            if (gs.clickModeState) {
                VendingMachine.Debug.log('assist', ' 進入完成畫面，停用輔助點擊模式');
                gs.clickModeState.enabled = false;
                gs.clickModeState.waitingForClick = false;
                gs.clickModeState.waitingForStart = false;
            }
            document.getElementById('click-exec-overlay')?.remove();
            this.unbindClickModeHandler();
            if (window.TutorContext) TutorContext.update({ screen: 'result' });

            const app = document.getElementById('app');
            const completedCount = this.state.gameState.completedQuestions;

            // 計算完成時間
            const endTime = Date.now();
            const startTime = this.state.gameState.startTime || endTime;
            const elapsedSeconds = Math.floor((endTime - startTime) / 1000);

            // 學習紀錄
            if (window.LearningTracker) {
                LearningTracker.save({
                    unit: 'a1', unitName: 'A1 販賣機', series: 'A',
                    score: completedCount,
                    total: this.state.settings?.questionCount || completedCount,
                    difficulty: this.state.settings?.difficulty || 'normal',
                    durationSec: elapsedSeconds,
                });
            }
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
                                    <div class="achievement-item">🎯 完成自動販賣機操作流程學習</div>
                                    <div class="achievement-item">💰 學會投幣和找零計算</div>
                                    <div class="achievement-item">🛒 掌握商品選擇和購買確認</div>
                                </div>
                            </div>

                            <div class="result-buttons">
                                <button class="play-again-btn" onclick="VendingMachine.startGame()">
                                    <span class="btn-icon">🔄</span>
                                    <span class="btn-text">再玩一次</span>
                                </button>
                                <button class="main-menu-btn" onclick="VendingMachine.showSettings()">
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

                    /* @keyframes fadeIn, celebrate, bounce 已移至 injectGlobalAnimationStyles() */

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
                        animation: bounceResults 2s infinite;
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

            const countSpeech = NumberSpeechUtils.convertToQuantitySpeech(completedCount, '題');
            this.speech.speak(`完成挑戰！共完成 ${countSpeech}，用時 ${timeDisplay}`);

            // 🎁 獎勵系統連結事件
            const endgameRewardLink = document.getElementById('endgame-reward-link');
            if (endgameRewardLink) {
                this.EventManager.on(endgameRewardLink, 'click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                }, {}, 'gameUI');
            }

            // 播放成功音效和煙火
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
            }, 100, 'uiAnimation');
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

        // 退幣
        refundMoney() {
            VendingMachine.Debug.log('coin', ' 退幣');

            // 防止手機端重複觸發
            const now = Date.now();
            if (this._lastRefundTime && now - this._lastRefundTime < A1_DEBOUNCE.REFUND) {
                VendingMachine.Debug.log('coin', ' 防抖：忽略重複點擊');
                return;
            }
            this._lastRefundTime = now;

            const _taskType = this.state.settings.taskType;

            // 🆕 指定任務模式（assigned / coinFirstAssigned）：退幣鈕無效，提示完成步驟
            if (_taskType === 'assigned' || _taskType === 'coinFirstAssigned') {
                this.audio.play('error03');
                this.speech.speak('請完成接下來的步驟');
                return;
            }

            // 🆕 自選模式（freeChoice / coinFirstFree）：有投入金額且尚未出貨時，顯示退幣彈窗
            if ((_taskType === 'freeChoice' || _taskType === 'coinFirstFree') &&
                this.state.gameState.insertedAmount > 0 &&
                !this.state.gameState.productVended) {
                this._showRefundModal(this.state.gameState.insertedAmount);
                return;
            }

            // 簡單模式：統一的錯誤檢查
            if (this.state.settings.difficulty === 'easy') {
                const refundBtn = document.querySelector('.refund-btn');
                if (this.handleEasyModeAction('refund', refundBtn)) {
                    return; // 這是錯誤操作
                }
            }

            // 普通/困難模式：統一的錯誤檢查
            if (this.isAdvancedMode()) {
                if (this.handleNormalModeAction('refund')) {
                    return; // 這是錯誤操作
                }
            }

            this.audio.play('click');

            const amount = this.state.gameState.insertedAmount;
            const insertedCoins = this.state.gameState.insertedCoinsDetail;

            if (amount > 0) {
                document.getElementById('screenTitle').textContent = '已退幣';
                document.getElementById('screenMessage').textContent = `已退回 ${amount} 元`;
                this.speech.speak(`已退回 ${this.convertAmountToSpeech(amount)}`);

                // 將投入的硬幣退回錢包
                VendingMachine.Debug.log('coin', ' 退回硬幣到錢包:', insertedCoins);
                insertedCoins.forEach(coinValue => {
                    if (!this.state.gameState.walletCoins[coinValue]) {
                        this.state.gameState.walletCoins[coinValue] = 0;
                    }
                    this.state.gameState.walletCoins[coinValue]++;
                });

                // 顯示退幣動畫
                this.showRefundCoins(amount);

                this.state.gameState.insertedAmount = 0;
                this.state.gameState.insertedCoinsDetail = [];
                this.updateAmounts();

                this.TimerManager.setTimeout(() => {
                    document.getElementById('refundSlotOutput').innerHTML = '';
                    this.reset();
                }, 3000, 'uiAnimation');
            } else {
                this.reset();
            }
        },

        // 🆕 自選模式退幣彈窗（freeChoice / coinFirstFree）
        _showRefundModal(amount) {
            const amountText = this.convertAmountToSpeech(amount);
            this.speech.speak(`退回${amountText}`);
            const overlay = document.createElement('div');
            overlay.id = 'a1-refund-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10200;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = `
                <div style="background:white;border-radius:16px;padding:32px 24px;max-width:300px;width:88%;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,0.35);">
                    <div style="font-size:52px;margin-bottom:8px;">💰</div>
                    <h2 style="margin:0 0 8px;color:#333;font-size:20px;">退幣</h2>
                    <p style="font-size:28px;font-weight:bold;color:#e74c3c;margin:6px 0;">退回 ${amount} 元</p>
                    <p style="color:#888;font-size:14px;margin-bottom:20px;">金錢將返回您的錢包</p>
                    <button onclick="VendingMachine._executeRefund()" style="background:linear-gradient(135deg,#4CAF50,#388e3c);color:white;border:none;padding:12px 36px;border-radius:10px;font-size:16px;cursor:pointer;font-weight:bold;box-shadow:0 4px 12px rgba(76,175,80,0.4);">確認退幣</button>
                </div>`;
            document.body.appendChild(overlay);
        },

        // 🆕 執行自選模式退幣（彈窗確認後呼叫）
        _executeRefund() {
            const modal = document.getElementById('a1-refund-modal');
            if (modal) modal.remove();

            const amount = this.state.gameState.insertedAmount;
            const insertedCoins = this.state.gameState.insertedCoinsDetail.slice();

            if (amount <= 0) { this.reset(); return; }

            // 歸還硬幣到錢包
            insertedCoins.forEach(coinValue => {
                if (!this.state.gameState.walletCoins[coinValue]) {
                    this.state.gameState.walletCoins[coinValue] = 0;
                }
                this.state.gameState.walletCoins[coinValue]++;
            });

            this.state.gameState.insertedAmount = 0;
            this.state.gameState.insertedCoinsDetail = [];
            this.updateAmounts();

            this.TimerManager.setTimeout(() => {
                this.reset();
            }, 600, 'uiAnimation');
        },

        // 顯示退幣
        showRefundCoins(amount) {
            const output = document.getElementById('refundSlotOutput');
            output.innerHTML = '';

            const coins = this.breakdownAmount(amount);

            coins.forEach((coinValue, index) => {
                this.TimerManager.setTimeout(() => {
                    const coinDiv = document.createElement('div');
                    coinDiv.className = 'refund-coin';
                    const side = Math.random() > 0.5 ? 'front' : 'back';
                    coinDiv.innerHTML = `<img src="../images/money/${coinValue}_yuan_${side}.png" alt="${coinValue}元"
                                             onerror="this.outerHTML='<div style=\\'color:white;font-weight:bold\\'>${coinValue}元</div>'">`;
                    output.appendChild(coinDiv);
                }, index * 200, 'uiAnimation');
            });
        },

        // 分解金額為硬幣
        breakdownAmount(amount) {
            const coins = [];
            const denominations = [50, 10, 5, 1];
            let remaining = amount;

            for (const denom of denominations) {
                while (remaining >= denom) {
                    coins.push(denom);
                    remaining -= denom;
                }
            }

            return coins;
        },

        // 取消
        cancel() {
            // 簡單模式：流程驗證
            if (!this.validateAction('cancel', '.cancel-btn')) {
                return;
            }

            // 普通/困難模式：統一的錯誤檢查
            if (this.isAdvancedMode()) {
                if (this.handleNormalModeAction('cancel')) {
                    return; // 這是錯誤操作
                }
            }

            if (confirm('確定要取消購買嗎？')) {
                this.refundMoney();
            }
        },

        // 重置
        reset() {
            this.state.gameState.selectedProduct = null;
            this.state.gameState.insertedAmount = 0;

            document.querySelectorAll('.product-item').forEach(item => {
                item.classList.remove('selected');
            });

            // coinFirst 模式：退幣後重新鎖定所有飲料
            if (this.isCoinFirstMode()) {
                document.querySelectorAll('.product-item').forEach(item => {
                    item.classList.remove('coin-first-available', 'coin-first-unlocking');
                    item.classList.add('coin-first-locked');
                });
                this.updateAmounts();
                document.getElementById('binContent').innerHTML = '';
                document.getElementById('screenTitle').textContent = '請先投幣';
                document.getElementById('screenMessage').textContent = '投入足夠金額後，飲料燈號將會亮起';
                // 退幣後隱藏飲料圖片
                const screenProductImgReset = document.getElementById('screenProductImg');
                if (screenProductImgReset) { screenProductImgReset.style.display = 'none'; screenProductImgReset.src = ''; }
                // 簡單模式：恢復投幣口提示
                if (this.state.settings.difficulty === 'easy') {
                    this.setFlowStep('INSERT_COIN');
                    this.clearEasyModeHint();
                    this.showEasyModeHint('insert_coin', '#coinSlot');
                }
                return;
            }

            this.updateAmounts();
            document.getElementById('binContent').innerHTML = '';
            document.getElementById('screenTitle').textContent = '請選擇飲料';
            document.getElementById('screenMessage').textContent = '請點選您想要購買的飲料';
        },

        // 🎆 煙火動畫系統（參考 A1）
        startFireworksAnimation() {
            VendingMachine.Debug.log('ui', '🎆 開始煙火動畫');

            // 🎆 使用 canvas-confetti 效果（兩波）
            if (window.confetti) {
                VendingMachine.Debug.log('ui', '🎆 觸發 canvas-confetti 慶祝效果');
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    zIndex: 10100  // 設定 z-index 高於所有彈窗（彈窗為 10000-10001）
                });

                // 延遲觸發第二波煙火
                this.TimerManager.setTimeout(() => {
                    confetti({
                        particleCount: 100,
                        spread: 60,
                        origin: { y: 0.7 },
                        zIndex: 10100  // 設定 z-index 高於所有彈窗
                    });
                }, 200, 'uiAnimation');
            } else {
                VendingMachine.Debug.log('ui', '🎆 canvas-confetti 不可用');
            }
        },

        // ========================================
        // 數字輸入器系統（用於自訂題數）
        // ========================================

        // 顯示數字輸入器（通用版本）
        showNumberInput(type = 'questionCount') {
            // 檢查是否已存在數字輸入器
            const existingPopup = document.getElementById('number-input-popup');
            if (existingPopup) {
                VendingMachine.Debug.log('ui', '🔄 發現已存在的數字輸入器，先清除再重新創建');
                this.closeNumberInput();
                this.TimerManager.setTimeout(() => {
                    this.createNumberInput(type);
                }, 10, 'uiAnimation');
                return;
            }

            this.createNumberInput(type);
        },

        // 創建數字輸入器
        createNumberInput(type = 'questionCount') {
            const isQuestionCountMode = type === 'questionCount';
            const isWalletAmountMode = type === 'walletAmount';
            let title = isWalletAmountMode ? '請輸入錢包金額' : '請輸入題數';

            const inputPopupHTML = `
                <div id="number-input-popup" class="number-input-popup" data-input-type="${type}">
                    <div class="number-input-container">
                        <div class="number-input-header">
                            <h3>${title}</h3>
                            <button class="close-btn" onclick="VendingMachine.closeNumberInput()">×</button>
                        </div>
                        <div class="number-input-display">
                            <input type="text" id="number-display" readonly value="">
                        </div>
                        <div class="number-input-buttons">
                            <button onclick="VendingMachine.appendNumber('1')">1</button>
                            <button onclick="VendingMachine.appendNumber('2')">2</button>
                            <button onclick="VendingMachine.appendNumber('3')">3</button>
                            <button onclick="VendingMachine.clearNumber()" class="clear-btn">清除</button>

                            <button onclick="VendingMachine.appendNumber('4')">4</button>
                            <button onclick="VendingMachine.appendNumber('5')">5</button>
                            <button onclick="VendingMachine.appendNumber('6')">6</button>
                            <button onclick="VendingMachine.backspaceNumber()" class="backspace-btn">⌫</button>

                            <button onclick="VendingMachine.appendNumber('7')">7</button>
                            <button onclick="VendingMachine.appendNumber('8')">8</button>
                            <button onclick="VendingMachine.appendNumber('9')">9</button>
                            <button onclick="VendingMachine.confirmNumber()" class="confirm-btn">確認</button>

                            <button onclick="VendingMachine.appendNumber('0')" class="zero-btn">0</button>
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
                        border: 2px solid #ddd;
                        padding: 15px;
                        font-size: 24px;
                        text-align: center;
                        border-radius: 8px;
                        background: #f9f9f9;
                        font-family: 'Courier New', monospace;
                        box-sizing: border-box;
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

                    /* @keyframes fadeIn, bounceIn 已移至 injectGlobalAnimationStyles() */
                </style>
            `;

            // 添加到頁面
            if (!document.getElementById('number-input-styles')) {
                document.head.insertAdjacentHTML('beforeend', inputStyles);
            }
            document.body.insertAdjacentHTML('beforeend', inputPopupHTML);
        },

        // 關閉數字輸入器
        closeNumberInput() {
            const popup = document.getElementById('number-input-popup');
            if (popup) popup.remove();
        },

        // 添加數字到輸入框
        appendNumber(digit) {
            const display = document.getElementById('number-display');
            if (!display) return;
            this.audio.play('keypad');
            if (display.value === '' || display.value === '0') {
                display.value = digit;
            } else {
                display.value += digit;
            }
        },

        // 清除輸入
        clearNumber() {
            const display = document.getElementById('number-display');
            if (!display) return;
            this.audio.play('keypad');
            display.value = '';
        },

        // 退格
        backspaceNumber() {
            const display = document.getElementById('number-display');
            if (!display) return;
            this.audio.play('keypad');
            if (display.value.length > 1) {
                display.value = display.value.slice(0, -1);
            } else {
                display.value = '';
            }
        },

        // 確認輸入的數字
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
                    VendingMachine.Debug.log('state', ` 自訂題數已設定: questionCount = ${inputValue}`);
                    this.audio.play('click');

                    // 🔧 [修正] 直接更新DOM，避免重新渲染整個設定畫面（防止閃爍）
                    // 更新自訂按鈕為 active
                    const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
                    if (customBtn) {
                        const group = customBtn.closest('.button-group');
                        group.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                        customBtn.classList.add('active');
                    }

                    // 顯示自訂題數輸入框並套用藍色樣式（避免閃爍）
                    const customDisplay = document.querySelector('.custom-question-display');
                    const customInput = document.getElementById('custom-question-count-a1');
                    if (customDisplay && customInput) {
                        customDisplay.style.display = 'block';
                        customInput.value = `${inputValue}題`;
                        customInput.style.background = '#667eea';
                        customInput.style.color = 'white';
                        customInput.style.borderColor = '#667eea';
                    }

                    // 🔧 [修正] 更新開始按鈕狀態（避免按鈕卡在"請完成所有設定選項"）
                    this.updateStartButton();

                    // 關閉數字輸入器
                    this.closeNumberInput();
                } else {
                    this.showToast('請輸入1-100之間的有效題數！', 'warning');
                }
            } else if (inputType === 'walletAmount') {
                // 錢包金額輸入
                if (inputValue > 0 && inputValue <= 100) {
                    // 更新設定
                    this.state.settings.walletAmount = inputValue;
                    this.audio.play('click');

                    // 重新渲染設定頁面以更新顯示
                    this.showSettings();

                    // 關閉數字輸入器
                    this.closeNumberInput();
                } else {
                    this.showToast('請輸入1-100之間的有效金額！', 'warning');
                }
            }
        },

        // ========================================
        // 輔助點擊模式（Click Mode）核心方法
        // ========================================

        /**
         * 初始化輔助點擊模式（用於歡迎畫面）
         * 在開始遊戲時調用
         */
        initClickModeForWelcome() {
            const gs = this.state.gameState;
            gs.clickModeState.enabled = false; // 先禁用，避免立即觸發
            gs.clickModeState.currentPhase = 'welcome';
            gs.clickModeState.currentStep = 0;
            gs.clickModeState.actionQueue = [];
            gs.clickModeState.waitingForClick = false;
            gs.clickModeState.waitingForStart = false; // 先設為 false
            gs.clickModeState.waitingForModal = false;
            gs.clickModeState.lastClickTime = Date.now(); // 設定當前時間，避免立即觸發

            VendingMachine.Debug.log('assist', ' 輔助點擊模式已啟用（歡迎畫面）');

            // 建立輔助點擊遮罩（全程覆蓋，直到 click mode 結束）
            if (!document.getElementById('click-exec-overlay')) {
                const _ov = document.createElement('div');
                _ov.id = 'click-exec-overlay';
                const _tbEl = document.querySelector('.machine-header');
                const _tbBottom = _tbEl ? Math.round(_tbEl.getBoundingClientRect().bottom) : 60;
                _ov.style.cssText = `position:fixed;top:${_tbBottom}px;left:0;right:0;bottom:0;z-index:10100;pointer-events:all;touch-action:none;background:transparent;`;
                document.body.appendChild(_ov);
            }

            // 綁定全局點擊事件
            this.bindClickModeHandler();

            // 延遲啟用，確保頁面完全載入且避免殘留點擊事件
            this.TimerManager.setTimeout(() => {
                gs.clickModeState.enabled = true;
                gs.clickModeState.waitingForStart = true;

                // 在進入歡迎畫面後顯示提示
                this.TimerManager.setTimeout(() => {
                    this.showStartPrompt();
                }, 1000, 'clickMode');
            }, 500, 'clickMode');
        },

        /**
         * 綁定全局點擊事件處理器
         */
        bindClickModeHandler() {
            if (this._clickModeHandlerBound) return;

            this._clickModeHandler = (e) => {
                this.handleClickModeClick(e);
            };

            document.addEventListener('click', this._clickModeHandler, true);
            this._clickModeHandlerBound = true;

            VendingMachine.Debug.log('assist', ' 全局點擊事件已綁定');
        },

        /**
         * 解除全局點擊事件處理器
         */
        unbindClickModeHandler() {
            document.getElementById('click-exec-overlay')?.remove();
            if (this._clickModeHandler) {
                document.removeEventListener('click', this._clickModeHandler, true);
                this._clickModeHandlerBound = false;
                VendingMachine.Debug.log('assist', ' 全局點擊事件已解除');
            }
        },

        /**
         * 處理點擊模式的點擊事件
         */
        handleClickModeClick(e) {
            const gs = this.state.gameState;

            // 檢查是否啟用點擊模式
            if (!gs.clickModeState.enabled) return;

            // 🆕 【修復】程式觸發的點擊直接放行（參考 A2 正確實施）
            if (!e.isTrusted) {
                VendingMachine.Debug.log('assist', ' 🟢 程式觸發的點擊，放行');
                return;
            }

            // 白名單：返回設定按鈕不攔截
            const target = e.target;
            if (target.closest('.back-to-menu-btn')) {
                VendingMachine.Debug.log('assist', ' 點擊返回設定按鈕，放行');
                return;
            }

            // 🆕 防快速點擊：安全鎖（A1_DEBOUNCE.CLICK_MODE）
            const now = Date.now();
            const readyTime = gs.clickModeState.clickReadyTime || 0;
            const timeSinceReady = now - readyTime;

            if (timeSinceReady < A1_DEBOUNCE.CLICK_MODE) {
                VendingMachine.Debug.log('assist', ` ⏳ 點擊過快，忽略 (${timeSinceReady}ms < ${A1_DEBOUNCE.CLICK_MODE}ms)`);
                e.stopPropagation();
                e.preventDefault();
                return;
            }

            // 如果正在等待開始
            if (gs.clickModeState.waitingForStart) {
                e.preventDefault();
                e.stopPropagation();

                gs.clickModeState.lastClickTime = now;
                gs.clickModeState.waitingForStart = false;

                VendingMachine.Debug.log('assist', ' 用戶點擊開始');

                // 隱藏提示
                this.hideStartPrompt();

                // 如果正在等待關閉任務彈窗
                if (gs.clickModeState.waitingForModal) {
                    gs.clickModeState.waitingForModal = false;

                    // 自動點擊「開始購物」/「開始投幣」按鈕
                    const startBtn = document.querySelector('.start-shopping-btn');
                    if (startBtn) {
                        VendingMachine.Debug.log('assist', ' 自動點擊「開始購物/開始投幣」按鈕');
                        startBtn.click();

                        // 🔧 修復：coinFirstAssigned 關閉彈窗後應進入投幣階段，其他任務進入選飲料階段
                        const nextPhase = this.state.settings.taskType === 'coinFirstAssigned'
                            ? 'coinFirstInsert'
                            : 'selectProduct';
                        gs.clickModeState.currentPhase = nextPhase;

                        // 🔧 修復：更新點擊準備時間，防止快速點擊
                        gs.clickModeState.clickReadyTime = Date.now();

                        // 等待彈窗關閉後，要求用戶再次點擊才進入下一步
                        this.TimerManager.setTimeout(() => {
                            gs.clickModeState.waitingForStart = true;
                            gs.clickModeState.currentPhase = nextPhase;
                            gs.clickModeState.clickReadyTime = Date.now();
                        }, 500, 'clickMode');
                    } else {
                        VendingMachine.Debug.error(' 找不到「開始購物」按鈕');
                        gs.clickModeState.waitingForStart = true;
                    }
                } else if (gs.clickModeState.currentPhase === 'welcome' || gs.clickModeState.currentPhase === 'wallet') {
                    // 歡迎/錢包畫面：處理頁面導航
                    this.handleWelcomeNavigation();
                } else if (gs.clickModeState.currentPhase === 'confirmPurchase') {
                    // 確認購買階段：檢查所有必要條件後直接點擊確認按鈕
                    const product = gs.selectedProduct;
                    const insertedAmount = gs.insertedAmount || 0;
                    const currentFlowStep = gs.currentFlowStep;

                    // 檢查條件：
                    // 1. 有選擇產品
                    // 2. 投入金額足夠
                    // 3. (簡單模式) 流程步驟正確
                    const hasProduct = product !== null && product !== undefined;
                    const hasEnoughMoney = hasProduct && insertedAmount >= product.price;
                    const flowStepReady = this.state.settings.difficulty !== 'easy' || currentFlowStep === 'CONFIRM_PURCHASE';

                    VendingMachine.Debug.log('assist', ' 確認購買條件檢查:', {
                        hasProduct,
                        hasEnoughMoney,
                        flowStepReady,
                        insertedAmount,
                        price: product?.price,
                        currentFlowStep,
                        difficulty: this.state.settings.difficulty
                    });

                    if (hasProduct && hasEnoughMoney && flowStepReady) {
                        // 所有條件都滿足，可以點擊
                        VendingMachine.Debug.log('assist', ' 條件滿足，直接點擊確認購買按鈕');
                        const confirmBtn = document.getElementById('confirmBtn');
                        if (confirmBtn) {
                            confirmBtn.click();

                            // 點擊後等待出貨，然後進入取物階段
                            this.TimerManager.setTimeout(() => {
                                gs.clickModeState.currentPhase = 'pickup';
                                gs.clickModeState.waitingForStart = true;
                            }, 2000, 'clickMode'); // 等待出貨完成
                        } else {
                            VendingMachine.Debug.error(' 找不到確認購買按鈕');
                            gs.clickModeState.waitingForStart = true;
                        }
                    } else {
                        // 條件還未就緒，稍後再試
                        VendingMachine.Debug.log('assist', ' 條件尚未滿足，等待後重試');
                        this.TimerManager.setTimeout(() => {
                            gs.clickModeState.waitingForStart = true;
                        }, 300, 'clickMode'); // 稍後允許再次點擊
                    }
                } else {
                    // 其他階段：建立操作序列
                    this.buildActionQueue(gs.clickModeState.currentPhase);
                }

                return;
            }

            // 如果正在等待下一次點擊
            if (gs.clickModeState.waitingForClick) {
                // 🔧 修復：如果正在執行中，忽略點擊
                if (gs.clickModeState.isExecuting) {
                    VendingMachine.Debug.log('assist', ' ⚠️ 操作執行中，忽略點擊');
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }

                // 🆕 檢查是否真的已解除鎖定（視覺延遲機制）
                if (timeSinceReady < A1_DEBOUNCE.CLICK_MODE) {
                    VendingMachine.Debug.log('assist', ` ⏳ 視覺延遲未完成，忽略點擊 (${timeSinceReady}ms < ${A1_DEBOUNCE.CLICK_MODE}ms)`);
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                gs.clickModeState.lastClickTime = now;
                gs.clickModeState.waitingForClick = false;

                VendingMachine.Debug.log('assist', ' 用戶點擊繼續');

                // 執行下一個操作
                this.executeNextAction();
            }
        },

        /**
         * 處理歡迎畫面導航
         */
        handleWelcomeNavigation() {
            const gs = this.state.gameState;
            const currentScene = this.state.currentScene;
            const currentPhase = gs.clickModeState.currentPhase;

            VendingMachine.Debug.log('assist', ' 歡迎畫面導航，當前場景:', currentScene, '當前階段:', currentPhase);

            if (currentPhase === 'welcome' && currentScene === 'welcome') {
                // 從歡迎畫面進入錢包介紹畫面
                gs.clickModeState.currentPhase = 'wallet';
                gs.clickModeState.waitingForClick = false;

                // 進入錢包介紹畫面
                this.showWalletIntroScreen();

                // 不再顯示提示，等待語音結束後自動進入下一步
                this.TimerManager.setTimeout(() => {
                    gs.clickModeState.waitingForStart = true;
                }, 1500, 'clickMode');

            } else if (currentPhase === 'wallet' && currentScene === 'wallet-intro') {
                // 從錢包介紹畫面進入購物畫面
                const isCoinFirst = this.isCoinFirstMode();
                gs.clickModeState.currentPhase = isCoinFirst ? 'coinFirstInsert' : 'selectProduct';
                gs.clickModeState.waitingForClick = false;

                // 進入購物場景
                this.prepareShoppingSession();

                // 等購物場景載入後，檢查是否有任務彈窗
                this.TimerManager.setTimeout(() => {
                    const taskModal = document.getElementById('target-item-modal');
                    if (taskModal) {
                        // 有任務彈窗，等待用戶點擊來關閉彈窗
                        gs.clickModeState.waitingForStart = true;
                        gs.clickModeState.waitingForModal = true;
                    } else {
                        // 沒有彈窗，直接開始建立操作序列
                        gs.clickModeState.waitingForStart = true;
                    }
                }, 1500, 'clickMode');
            }
        },

        /**
         * 建立操作序列
         */
        buildActionQueue(phase) {
            const gs = this.state.gameState;
            gs.clickModeState.actionQueue = [];
            gs.clickModeState.currentStep = 0;

            VendingMachine.Debug.log('assist', ' 建立操作序列:', phase);

            if (phase === 'selectProduct') {
                // 選擇飲料階段
                const targetProduct = gs.targetProduct;
                if (targetProduct) {
                    gs.clickModeState.actionQueue.push({
                        type: 'selectProduct',
                        productId: targetProduct.id
                    });
                }

            } else if (phase === 'insertCoin') {
                // 投幣階段：先打開投幣視窗，然後選擇硬幣
                gs.clickModeState.actionQueue.push({ type: 'clickCoinSlot' });

                // 計算需要投入的硬幣
                const targetAmount = gs.targetProduct.price;
                const coins = gs.walletCoins;
                const coinValues = [50, 10, 5, 1];

                let remaining = targetAmount;
                for (const value of coinValues) {
                    const count = coins[value] || 0;
                    const useCount = Math.min(count, Math.floor(remaining / value));
                    for (let i = 0; i < useCount; i++) {
                        gs.clickModeState.actionQueue.push({
                            type: 'insertCoin',
                            value: value
                        });
                        remaining -= value;
                    }
                    if (remaining === 0) break;
                }

                // 不需要手動關閉投幣視窗，最後一個硬幣投入後會自動關閉

            } else if (phase === 'coinFirstInsert') {
                // 先投幣模式 - 投幣階段
                gs.clickModeState.actionQueue.push({ type: 'clickCoinSlot' });

                const coins = gs.walletCoins;
                const coinValues = [50, 10, 5, 1];

                if (gs.targetProduct) {
                    // 簡單模式：只投入目標飲料所需金額
                    let remaining = gs.targetProduct.price;
                    for (const value of coinValues) {
                        const count = coins[value] || 0;
                        const useCount = Math.min(count, Math.floor(remaining / value));
                        for (let i = 0; i < useCount; i++) {
                            gs.clickModeState.actionQueue.push({ type: 'insertCoin', value: value });
                            remaining -= value;
                        }
                        if (remaining === 0) break;
                    }
                } else {
                    // 普通/困難模式：投入全部錢包硬幣
                    for (const value of coinValues) {
                        const count = coins[value] || 0;
                        for (let i = 0; i < count; i++) {
                            gs.clickModeState.actionQueue.push({ type: 'insertCoin', value: value });
                        }
                    }
                }

            } else if (phase === 'coinFirstSelect') {
                // 先投幣模式 - 選飲料階段
                let targetProduct = gs.targetProduct;
                if (!targetProduct) {
                    // 普通/困難模式：選最便宜的可負擔飲料
                    const inserted = gs.insertedAmount;
                    const affordable = (gs.currentProducts || []).filter(p => p.price <= inserted);
                    if (affordable.length > 0) {
                        affordable.sort((a, b) => a.price - b.price);
                        targetProduct = affordable[0];
                    }
                }
                if (targetProduct) {
                    gs.clickModeState.actionQueue.push({
                        type: 'selectProduct',
                        productId: targetProduct.id
                    });
                }

            } else if (phase === 'confirmPurchase') {
                // 確認購買階段
                gs.clickModeState.actionQueue.push({ type: 'confirmPurchase' });

            } else if (phase === 'pickup') {
                // 取物階段
                gs.clickModeState.actionQueue.push({ type: 'pickupProduct' });

                // 如果有找零，也要拿取零錢
                if (gs.changeAmount > 0) {
                    gs.clickModeState.actionQueue.push({ type: 'pickupChange' });
                }

                // 最後關閉購買成功彈窗
                gs.clickModeState.actionQueue.push({ type: 'closePickupModal' });
            }

            VendingMachine.Debug.log('assist', ' 操作序列建立完成:', gs.clickModeState.actionQueue);

            // 🆕 【修復】簡單模式：啟動視覺延遲機制（參考 A3 正確實施）
            if (this.state.settings.difficulty === 'easy') {
                this.enableClickModeWithVisualDelay(`BuildQueue-${phase}`);
            }

            // 開始執行第一個操作
            this.executeNextAction();
        },

        /**
         * 執行下一個操作
         */
        executeNextAction() {
            const gs = this.state.gameState;
            const queue = gs.clickModeState.actionQueue;
            const step = gs.clickModeState.currentStep;

            // 🔧 修復：防止並發執行
            if (gs.clickModeState.isExecuting) {
                VendingMachine.Debug.log('assist', ' ⚠️ 操作執行中，忽略重複調用');
                return;
            }

            if (step >= queue.length) {
                VendingMachine.Debug.log('assist', ' 所有操作已完成');
                gs.clickModeState.waitingForClick = false;

                // 根據當前階段決定下一個階段
                if (gs.clickModeState.currentPhase === 'selectProduct') {
                    gs.clickModeState.currentPhase = 'insertCoin';
                    gs.clickModeState.waitingForStart = true;
                    gs.clickModeState.isExecuting = false;  // 🔧 修復：階段轉換完成後才解鎖
                } else if (gs.clickModeState.currentPhase === 'insertCoin') {
                    // 投幣完成後需要額外等待視窗關閉和流程狀態更新
                    gs.clickModeState.currentPhase = 'confirmPurchase';
                    // 等待 1200ms 確保投幣視窗完全關閉且流程狀態已設為 CONFIRM_PURCHASE
                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.waitingForStart = true;
                        gs.clickModeState.isExecuting = false;  // 🔧 修復：階段轉換完成後才解鎖
                    }, 1200, 'clickMode');
                } else if (gs.clickModeState.currentPhase === 'coinFirstInsert') {
                    // 先投幣模式：投幣完成後等待飲料亮起，再進入選飲料階段
                    gs.clickModeState.currentPhase = 'coinFirstSelect';
                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.waitingForStart = true;
                        gs.clickModeState.isExecuting = false;
                    }, 1200, 'clickMode');
                } else if (gs.clickModeState.currentPhase === 'coinFirstSelect') {
                    // 先投幣模式：選飲料完成，進入確認購買
                    gs.clickModeState.currentPhase = 'confirmPurchase';
                    gs.clickModeState.waitingForStart = true;
                    gs.clickModeState.isExecuting = false;
                } else if (gs.clickModeState.currentPhase === 'confirmPurchase') {
                    gs.clickModeState.currentPhase = 'pickup';
                    gs.clickModeState.waitingForStart = true;
                    gs.clickModeState.isExecuting = false;  // 🔧 修復：階段轉換完成後才解鎖
                } else if (gs.clickModeState.currentPhase === 'pickup') {
                    // 完成所有步驟，停用輔助點擊模式
                    VendingMachine.Debug.log('assist', ' 完成本輪測驗，停用輔助點擊模式');
                    gs.clickModeState.enabled = false;
                    gs.clickModeState.waitingForStart = false;
                    gs.clickModeState.currentPhase = null;
                    gs.clickModeState.isExecuting = false;  // 🔧 修復：階段轉換完成後才解鎖
                }

                return;
            }

            const action = queue[step];
            VendingMachine.Debug.log('assist', ' 執行操作:', action.type, step + 1, '/', queue.length);

            // 🔧 修復：設置執行鎖
            gs.clickModeState.isExecuting = true;

            // 🔧 修復：先遞增 step，防止重複執行同一操作（參考 A6）
            gs.clickModeState.currentStep++;

            // 執行對應的操作
            this.TimerManager.setTimeout(() => {
                switch (action.type) {
                    case 'selectProduct':
                        this.autoSelectProduct(action.productId);
                        break;
                    case 'clickCoinSlot':
                        this.autoClickCoinSlot();
                        break;
                    case 'insertCoin':
                        this.autoInsertCoin(action.value);
                        break;
                    case 'closeCoinModal':
                        this.autoCloseCoinModal();
                        break;
                    case 'confirmPurchase':
                        this.autoClickConfirmButton();
                        break;
                    case 'pickupProduct':
                        this.autoPickupProduct();
                        break;
                    case 'pickupChange':
                        this.autoPickupChange();
                        break;
                    case 'closePickupModal':
                        this.autoClosePickupModal();
                        break;
                }

                // 🔧 修復：不要在這裡解除執行鎖，移到 extraDelay setTimeout 內部
                // 這樣可以防止在階段轉換完成前用戶點擊觸發 buildActionQueue

                // 特殊處理：某些操作需要額外等待時間
                let extraDelay = 0;
                if (action.type === 'confirmPurchase') {
                    extraDelay = 1500;  // 等待出貨
                } else if (action.type === 'pickupProduct') {
                    extraDelay = 1000;  // 等待購買成功彈窗出現
                } else if (action.type === 'clickCoinSlot') {
                    extraDelay = 800;   // 🆕【修復】等待投幣模態視窗完全打開
                } else if (action.type === 'insertCoin') {
                    extraDelay = 350;   // 🔧【修復】避開硬幣 300ms 防抖機制
                }

                this.TimerManager.setTimeout(() => {
                    // 繼續執行或等待點擊
                    if (gs.clickModeState.currentStep < queue.length) {
                        // 🔧 修復：在設置 waitingForClick 時才解鎖
                        gs.clickModeState.isExecuting = false;
                        // 等待用戶點擊再繼續
                        gs.clickModeState.waitingForClick = true;
                                                // 🆕 簡單模式：啟動視覺延遲機制（安全網）
                        if (this.state.settings.difficulty === 'easy') {
                            this.enableClickModeWithVisualDelay(`ActionQueue-${action.type}`);
                        }
                    } else {
                        // 🔧 修復：先解鎖再調用 executeNextAction 進行階段轉換
                        gs.clickModeState.isExecuting = false;
                        this.executeNextAction();
                    }
                }, extraDelay, 'clickMode');
            }, 300, 'clickMode');
        },

        /**
         * 顯示開始提示
         */
        showStartPrompt() {
            // 移除舊的提示
            this.hideStartPrompt();

            const prompt = document.createElement('div');
            prompt.id = 'click-mode-prompt';
            prompt.innerHTML = `
                <div style="position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background: rgba(76, 175, 80, 0.95);
                            color: white;
                            padding: 30px 60px;
                            border-radius: 20px;
                            font-size: 32px;
                            font-weight: bold;
                            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
                            z-index: 10000;
                            text-align: center;
                            max-width: 90%;
                            animation: clickModePulse 2s ease-in-out infinite;">
                    ♿ 輔助點擊模式（單鍵操作）<br>
                    <span style="font-size: 24px; margin-top: 10px; display: block;">點擊螢幕任意處繼續</span>
                </div>
                <!-- @keyframes clickModePulse 已移至 injectGlobalAnimationStyles() -->
            `;
            document.body.appendChild(prompt);
        },

        /**
         * 隱藏開始提示
         */
        hideStartPrompt() {
            const prompt = document.getElementById('click-mode-prompt');
            if (prompt) {
                prompt.remove();
            }
        },

        /**
         * 自動選擇飲料
         */
        autoSelectProduct(productId) {
            VendingMachine.Debug.log('assist', ' 自動選擇飲料:', productId);
            this.audio.play('correct');

            // 🔧 修復：重置商品選擇防抖時間戳，避免程式化點擊被防抖機制攔截
            this._lastSelectTime = 0;

            const productElement = document.querySelector(`[data-product-id="${productId}"]`);
            if (productElement) {
                productElement.click();
            } else {
                VendingMachine.Debug.error(' 找不到飲料元素:', productId);
            }
        },

        /**
         * 自動點擊投幣槽
         */
        autoClickCoinSlot() {
            VendingMachine.Debug.log('assist', ' 自動點擊投幣槽');
            this.audio.play('click');

            const coinSlot = document.getElementById('coinSlot');
            if (coinSlot) {
                coinSlot.click();
            } else {
                VendingMachine.Debug.error(' 找不到投幣槽');
            }
        },

        /**
         * 自動投入硬幣
         */
        autoInsertCoin(coinValue) {
            VendingMachine.Debug.log('assist', ' 自動投入硬幣:', coinValue);

            // 🔧 修復：重置硬幣防抖時間戳，避免程式化點擊被防抖機制攔截
            this._lastCoinClickTime = 0;

            // 找到對應的硬幣元素並點擊
            const coinElements = document.querySelectorAll('.individual-coin');
            for (const coinEl of coinElements) {
                const value = parseInt(coinEl.dataset.value);
                if (value === coinValue && !coinEl.classList.contains('used')) {
                    // 🔧 修復：立即標記為已使用，防止重複選擇同一硬幣
                    coinEl.classList.add('used');
                    coinEl.click();
                    break;
                }
            }
        },

        /**
         * 自動關閉投幣視窗
         */
        autoCloseCoinModal() {
            VendingMachine.Debug.log('assist', ' 自動關閉投幣視窗');
            this.audio.play('click');

            const modal = document.getElementById('coin-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        },

        /**
         * 自動點擊確認購買按鈕
         */
        autoClickConfirmButton() {
            VendingMachine.Debug.log('assist', ' 自動點擊確認購買');
            this.audio.play('click');

            const confirmBtn = document.getElementById('confirmBtn');
            if (confirmBtn) {
                // 先顯示按鈕提示
                this.showButtonHint('confirmBtn');

                this.TimerManager.setTimeout(() => {
                    this.hideButtonHint('confirmBtn');
                    confirmBtn.click();
                }, 300, 'clickMode');
            } else {
                VendingMachine.Debug.error(' 找不到確認購買按鈕');
            }
        },

        /**
         * 自動拿取飲料
         */
        autoPickupProduct() {
            VendingMachine.Debug.log('assist', ' 自動拿取飲料');
            this.audio.play('correct');

            const vendedProduct = document.querySelector('.vended-product');
            if (vendedProduct) {
                // 顯示提示
                vendedProduct.classList.add('easy-mode-hint');

                this.TimerManager.setTimeout(() => {
                    vendedProduct.classList.remove('easy-mode-hint');
                    vendedProduct.click();
                }, 800, 'clickMode');
            } else {
                VendingMachine.Debug.error(' 找不到出貨口飲料');
            }
        },

        /**
         * 自動拿取零錢
         */
        autoPickupChange() {
            VendingMachine.Debug.log('assist', ' 自動拿取零錢');
            this.audio.play('correct');

            const refundSlot = document.getElementById('refundSlot');
            if (refundSlot) {
                refundSlot.classList.add('easy-mode-hint');

                this.TimerManager.setTimeout(() => {
                    refundSlot.classList.remove('easy-mode-hint');
                    refundSlot.click();
                }, 800, 'clickMode');
            }
        },

        /**
         * 自動關閉購買成功彈窗
         */
        autoClosePickupModal() {
            VendingMachine.Debug.log('assist', ' 自動關閉購買成功彈窗');
            this.audio.play('click');

            const confirmBtn = document.querySelector('#pickup-product-modal .confirm-btn');
            if (confirmBtn) {
                this.TimerManager.setTimeout(() => {
                    confirmBtn.click();
                }, 500, 'clickMode');
            } else {
                VendingMachine.Debug.error(' 找不到購買成功彈窗的確認按鈕');
            }
        },

        /**
         * 顯示按鈕提示動畫
         */
        showButtonHint(buttonId) {
            const button = document.getElementById(buttonId);
            if (button && !button.classList.contains('easy-mode-hint')) {
                button.classList.add('easy-mode-hint');
                VendingMachine.Debug.log('assist', ` 顯示按鈕提示: ${buttonId}`);
            }
        },

        /**
         * 隱藏按鈕提示動畫
         */
        hideButtonHint(buttonId) {
            const button = document.getElementById(buttonId);
            if (button) {
                button.classList.remove('easy-mode-hint');
            }
        }
    };

    // ========================================
    // 程式啟動
    // ========================================
    // DOM 載入後啟動
    document.addEventListener('DOMContentLoaded', () => {
        VendingMachine.init();
    });

    // 暴露到全域作用域
    window.VendingMachine = VendingMachine;

})();

// ========================================
// 快速導覽索引
// ========================================
// 【配置區域 - 修改這些地方來自定義程式】
// - 飲料資料庫：第27行 BEVERAGE_DATABASE
// - （已移除 QUIZ_TEMPLATES 死碼）
// - 簡單模式流程：第126行 EASY_MODE_FLOW
// - UI文字：第189行 UI_TEXT
// - 音效定義：第260行 audio.sounds
// - 狀態管理：第235行 state
//
// 【核心系統】
// - 音效系統：第278行 audio
// - 語音系統：第353行 speech
// - 遊戲初始化：第462行 init()
// - 設定頁面：第477行 showSettings()
// - 輔助函數：第751行 isAdvancedMode()（判斷是否為普通/困難模式）
// - 開始遊戲：第766行 startGame()
//
// 【模式管理】
// - 簡單模式：第2598行 validateAction()
// - 普通模式：第2224行（含完整流程說明）
// - 困難模式：第2406行 showHint()（手動提示按鈕）
//   * 差異：困難模式不會自動顯示提示，必須點擊提示按鈕
//   * 普通模式：錯誤3次後自動顯示綠色提示動畫
//   * 困難模式：只累計錯誤，不自動顯示，需手動點擊「提示」按鈕
//
// 【投幣系統】
// - 錢包生成：第836行 generateWalletCoins()
// - 投幣彈窗：第2751行 showCoinModal()
// - 投幣處理：第2962行 clickCoin()
// - 多付檢查：第3093行 findMinimumCoinCombination()
//
// 【交易流程】
// - 選擇商品：第1898行 selectProduct()
// - 確認購買：第3470行 processPayment()
// - 取貨取零：第3697行 pickUpChange() / 第3850行 pickUpProduct()
//
// 【提示系統】
// - 普通模式提示：第2297行 showNormalModeHint()（錯誤3次自動觸發）
// - 困難模式提示：第2406行 showHint()（手動觸發）
// - 移除提示：第2365行 removeNormalModeHint()
// ========================================
