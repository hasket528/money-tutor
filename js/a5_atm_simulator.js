// =================================================================
/**
 * @file a5_atm_simulator.js
 * @description A5 提款機模擬學習單元 - 配置驅動版本
 * @unit A5 - 提款機模擬學習
 * @version 1.4.0 - 動畫定義整合（5 個 JS 內嵌 @keyframes 遷移至 injectGlobalAnimationStyles）
 * @lastModified 2026.02.22
 */
// 基於A1架構的ATM模擬器開發
// =================================================================

// =================================================================
// 難度模式統一配置（重構：統一三種難度的代碼路徑）
// =================================================================
const DIFFICULTY_CONFIG = {
    easy: {
        name: '簡單模式',
        autoShowHint: true,       // 自動顯示提示
        hintDelay: 0,             // 立即顯示
        showHintButton: false,    // 不顯示提示按鈕
        strictValidation: true,   // 嚴格流程驗證
        allowCancel: false,       // 不允許取消/清除
        trackSteps: true,         // 追蹤步驟
        pinInputValidation: true  // 密碼輸入實時驗證
    },
    normal: {
        name: '普通模式',
        autoShowHint: false,      // 不自動顯示提示（手動提示鈕）
        hintDelay: 10000,         // 保留（不再使用）
        showHintButton: true,     // 顯示提示按鈕
        strictValidation: false,  // 基本驗證
        allowCancel: true,        // 允許取消/清除
        trackSteps: false,        // 不追蹤步驟
        pinInputValidation: false // 不驗證密碼
    },
    hard: {
        name: '困難模式',
        autoShowHint: false,      // 永不自動顯示
        hintDelay: 0,             // 立即顯示（手動觸發時）
        showHintButton: true,     // 顯示提示按鈕
        strictValidation: true,   // 嚴格流程驗證
        allowCancel: false,       // 不允許取消/清除（指定任務）
        trackSteps: true,         // 追蹤步驟
        pinInputValidation: false // 不驗證密碼
    }
};

// =================================================================
// ATM 步驟驗證系統配置（參考 A5 架構）
// =================================================================

const ATM_FLOW = {
    steps: {
        // ========== 步驟 1：插入金融卡 ==========
        INSERT_CARD: {
            id: 'INSERT_CARD',
            name: '插入金融卡',
            allowedActions: ['insertCard', 'handleCardClick'],
            warningMessages: {
                handleKeyPress: '請先插入金融卡',
                selectMenuOption: '請先插入金融卡',
                handleAmountSelect: '請先插入金融卡'
            }
        },

        // ========== 步驟 2：輸入密碼 ==========
        ENTER_PIN: {
            id: 'ENTER_PIN',
            name: '輸入密碼',
            allowedActions: ['handleNumberInput', 'handleClearKey', 'handleEnterKey', 'handleCancelKey'],
            warningMessages: {
                insertCard: '請輸入密碼',
                selectMenuOption: '請先輸入密碼',
                handleAmountSelect: '請先輸入密碼'
            }
        },

        // ========== 步驟 3：選擇功能 ==========
        SELECT_SERVICE: {
            id: 'SELECT_SERVICE',
            name: '選擇功能',
            allowedActions: ['selectMenuOption'],
            warningMessages: {
                insertCard: '請選擇提款、存款或查詢',
                handleAmountSelect: '請先選擇功能',
                handleEnterKey: '請先選擇功能'
            }
        },

        // ========== 步驟 4：輸入金額 ==========
        ENTER_AMOUNT: {
            id: 'ENTER_AMOUNT',
            name: '輸入金額',
            allowedActions: ['handleNumberInput', 'handleAmountSelect', 'handleEnterKey', 'handleClearKey', 'handleCancelKey'],
            warningMessages: {
                insertCard: '請輸入金額',
                selectMenuOption: '已經選好功能了，請輸入金額',
                takeCash: '請先輸入金額'
            }
        },

        // ========== 步驟 4b：存入現鈔（僅存款流程使用） ==========
        DEPOSIT_CASH: {
            id: 'DEPOSIT_CASH',
            name: '存入現鈔',
            allowedActions: [],  // 存款流程中不允許其他操作
            warningMessages: {
                insertCard: '請存入現鈔',
                selectMenuOption: '請先完成存款',
                handleKeyPress: '請存入現鈔'
            }
        },

        // ========== 步驟 5：交易處理中 ==========
        PROCESSING: {
            id: 'PROCESSING',
            name: '交易處理中',
            allowedActions: [],  // 處理中不允許任何操作
            warningMessages: {
                insertCard: '交易處理中，請稍候',
                selectMenuOption: '交易處理中，請稍候',
                handleKeyPress: '交易處理中，請稍候'
            }
        },

        // ========== 步驟 6：取走現金 ==========
        TAKE_CASH: {
            id: 'TAKE_CASH',
            name: '取走現金',
            allowedActions: ['takeCash'],
            warningMessages: {
                insertCard: '請先取走現金',
                selectMenuOption: '請先取走現金',
                handleReceiptOption: '請先取走現金'
            }
        },

        // ========== 步驟 7：選擇明細表 ==========
        RECEIPT_OPTIONS: {
            id: 'RECEIPT_OPTIONS',
            name: '選擇明細表',
            allowedActions: ['handleNoPrintReceipt', 'handlePrintReceipt'],
            warningMessages: {
                insertCard: '請選擇明細表顯示方式',
                selectMenuOption: '請先選擇明細表顯示方式',
                takeCash: '已取走現金，請選擇明細表'
            }
        },

        // ========== 步驟 8a：螢幕顯示明細 ==========
        SCREEN_RECEIPT: {
            id: 'SCREEN_RECEIPT',
            name: '螢幕顯示明細',
            allowedActions: [],
            warningMessages: {
                insertCard: '明細表顯示中，5秒後自動完成',
                selectMenuOption: '明細表顯示中，請稍候'
            }
        },

        // ========== 步驟 8b：列印明細表 ==========
        PRINT_RECEIPT: {
            id: 'PRINT_RECEIPT',
            name: '列印明細表',
            allowedActions: [],
            warningMessages: {
                insertCard: '明細表列印中，請稍候',
                selectMenuOption: '明細表列印中，請稍候'
            }
        },

        // ========== 步驟 9：取走明細表 ==========
        TAKE_RECEIPT: {
            id: 'TAKE_RECEIPT',
            name: '取走明細表',
            allowedActions: ['takeReceipt'],
            warningMessages: {
                insertCard: '請取走明細表',
                selectMenuOption: '請取走明細表'
            }
        },

        // ========== 步驟 10：取回卡片 ==========
        TAKE_CARD: {
            id: 'TAKE_CARD',
            name: '取回卡片',
            allowedActions: ['takeCard', 'handleCardClick'],
            warningMessages: {
                insertCard: '請取回卡片',
                selectMenuOption: '請先取回卡片',
                handleNumberInput: '請先取回卡片'
            }
        },

        // ========== 轉帳流程專用步驟 ==========
        // 步驟 T1：輸入銀行代碼
        ENTER_BANK_CODE: {
            id: 'ENTER_BANK_CODE',
            name: '輸入銀行代碼',
            allowedActions: ['handleNumberInput', 'handleClearKey', 'handleEnterKey', 'handleCancelKey'],
            warningMessages: {
                insertCard: '請輸入銀行代碼',
                selectMenuOption: '請先完成銀行代碼輸入',
                takeCash: '請先完成轉帳流程'
            }
        },

        // 步驟 T2：輸入轉入帳號
        ENTER_ACCOUNT: {
            id: 'ENTER_ACCOUNT',
            name: '輸入轉入帳號',
            allowedActions: ['handleNumberInput', 'handleClearKey', 'handleEnterKey', 'handleCancelKey'],
            warningMessages: {
                insertCard: '請輸入轉入帳號',
                selectMenuOption: '請先完成帳號輸入',
                takeCash: '請先完成轉帳流程'
            }
        },

        // 步驟 T3：輸入轉帳金額
        TRANSFER_AMOUNT_ENTRY: {
            id: 'TRANSFER_AMOUNT_ENTRY',
            name: '輸入轉帳金額',
            allowedActions: ['handleNumberInput', 'handleClearKey', 'handleEnterKey', 'handleCancelKey'],
            warningMessages: {
                insertCard: '請輸入轉帳金額',
                selectMenuOption: '請先完成金額輸入',
                takeCash: '請先完成轉帳流程'
            }
        },

        // 步驟 T4：確認轉帳資訊
        TRANSFER_VERIFICATION: {
            id: 'TRANSFER_VERIFICATION',
            name: '確認轉帳資訊',
            allowedActions: ['handleTransferVerifyConfirm', 'handleTransferVerifyCancel'],
            warningMessages: {
                insertCard: '請確認轉帳資訊',
                selectMenuOption: '請先確認轉帳資訊',
                handleNumberInput: '請點擊確認或取消按鈕',
                takeCash: '請先完成轉帳流程'
            }
        },

        // 步驟 T5：最終確認轉帳
        TRANSFER_CONFIRMATION: {
            id: 'TRANSFER_CONFIRMATION',
            name: '最終確認轉帳',
            allowedActions: ['handleTransferFinalConfirm', 'handleTransferFinalCancel'],
            warningMessages: {
                insertCard: '請確認是否轉出款項',
                selectMenuOption: '請先確認是否轉帳',
                handleNumberInput: '請點擊確定轉帳或取消按鈕',
                takeCash: '請先完成轉帳流程'
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const ATM = {
        // =====================================================
        // 🔧 [Phase 1] TimerManager - 統一管理所有 setTimeout
        // =====================================================
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
                ATM.Debug.log('timer', `清理所有計時器: ${this.timers.size} 個`);
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
                    ATM.Debug.log('timer', `清理 ${category} 類別計時器: ${count} 個`);
                }
            }
        },

        // =====================================================
        // 🔧 [Phase 1] EventManager - 統一管理所有 addEventListener
        // =====================================================
        EventManager: {
            listeners: [],

            on(element, type, handler, options = {}, category = 'default') {
                if (!element) return -1;
                element.addEventListener(type, handler, options);
                return this.listeners.push({ element, type, handler, options, category }) - 1;
            },

            removeAll() {
                ATM.Debug.log('event', `清理所有事件監聯器: ${this.listeners.length} 個`);
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
                        try {
                            l.element.removeEventListener(l.type, l.handler, l.options);
                            count++;
                        } catch(e) {}
                        this.listeners[i] = null;
                    }
                });
                if (count > 0) {
                    ATM.Debug.log('event', `清理 ${category} 類別事件監聽器: ${count} 個`);
                }
            }
        },

        // =====================================================
        // 🔧 Debug Logger - FLAGS 分類開關系統
        // =====================================================
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
                event: false,    // 事件監聽
                error: true,     // 錯誤（預設開啟）
                layout: false    // 版面高度偵測
            },
            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[A5-${category}]`, ...args);
                }
            },
            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[A5-${category}]`, ...args);
                }
            },
            error(...args) {
                console.error('[A5-ERROR]', ...args);
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════
        // 🎬 全局動畫樣式注入（避免重複定義）
        // ═══════════════════════════════════════════════════════════════════════════
        injectGlobalAnimationStyles() {
            if (document.getElementById('a5-global-animations')) return;

            const style = document.createElement('style');
            style.id = 'a5-global-animations';
            style.innerHTML = `
                /* 數字輸入按鈕彈入動畫 */
                @keyframes bounceIn {
                    from { opacity: 0; transform: scale(0.3) translateY(-50px); }
                    50% { opacity: 1; transform: scale(1.05) translateY(10px); }
                    70% { transform: scale(0.95) translateY(-5px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                /* 金錢圖示提示彈跳 */
                @keyframes hintBounce {
                    from { transform: translateX(-50%) translateY(0); }
                    to { transform: translateX(-50%) translateY(-8px); }
                }
                /* 彈窗滑入動畫 */
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                /* 完成畫面慶祝動畫 */
                @keyframes celebrate {
                    0% { transform: scale(0.8) rotate(-10deg); opacity: 0; }
                    50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                /* 點擊提示脈衝動畫（與 CSS pulse 區分） */
                @keyframes clickPromptPulse {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                        box-shadow: 0 8px 30px rgba(76, 175, 80, 0.4);
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.05);
                        box-shadow: 0 12px 40px rgba(76, 175, 80, 0.6);
                    }
                }
                /* 完成畫面淡入 */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            ATM.Debug.log('init', '🎬 全局動畫樣式注入完成');
        },

        // =====================================================
        // 狀態管理系統（基於A1架構）
        // =====================================================
        state: {
            settings: {
                difficulty: null,           // null（未選擇）, easy, normal, hard
                clickMode: false,           // false（停用）, true（啟用） - 輔助點擊模式
                accountSetup: 'default',    // default（預設選中）, custom
                sessionType: null,          // null（未選擇）, withdraw(提款), deposit(存款), inquiry(查詢), transfer(轉帳), free(自選), random(隨機)
                questionCount: null,        // null（未選擇）, 3, 5, 10
                language: null,             // chinese, english
                customPassword: '1234',     // 自訂密碼
                customBalance: 100000,      // 自訂帳戶金額
                customAccountNumber: '12345678',  // 自訂帳號（8位數字）
            },
            audioUnlocked: false,            // 手機端音頻解鎖狀態
            gameState: {
                currentScene: 'settings',    // settings, card-insert, pin-entry, menu, processing, complete
                currentStep: 0,              // 當前操作步驟
                totalSteps: 0,               // 總步驟數
                currentFlowStep: null,       // ✅ 步驟驗證系統：當前流程步驟 (INSERT_CARD, ENTER_PIN, SELECT_SERVICE, etc.)
                isSubFlowActive: false,      // ✅ 子流程鎖定狀態，防止主選單事件觸發
                easyModeHints: {             // ✅ 簡單模式提示動畫系統
                    enabled: false,
                    currentStep: null,
                    highlightedElement: null,
                    assignedAmount: null,    // ✅ 簡單模式指定的金額（隨機選擇）
                    pinInputProgress: 0,     // ✅ 密碼輸入進度（已輸入的位數）
                    assignedReceiptOption: null,  // ✅ 簡單模式指定的明細表選項（'print' 或 'no-print'）
                    delayedHintTimer: null,  // 🔧 [新增] 普通模式延遲提示計時器
                    delayedHintData: null    // 🔧 [新增] 延遲提示的資料 {step, elementSelector}
                },
                normalModeErrors: {          // 🔧 [新增] 普通模式錯誤計數器
                    pinErrorCount: 0,        // 密碼輸入錯誤次數
                    pinCancelErrorCount: 0,  // 🔧 [新增] 密碼輸入時按取消鈕錯誤次數
                    bankCodeErrorCount: 0,   // 銀行代碼輸入錯誤次數
                    accountNumberErrorCount: 0,  // 轉帳帳號輸入錯誤次數
                    transferAmountErrorCount: 0,  // 轉帳金額輸入錯誤次數
                    mainMenuErrorCount: 0,   // 主選單服務選擇錯誤次數
                    withdrawAmountErrorCount: 0,  // 提款金額選擇錯誤次數
                    depositCancelErrorCount: 0,  // 存款取消按鈕錯誤次數
                    depositConfirmErrorCount: 0,  // 存款確認按鈕錯誤次數（未存入鈔票時）
                    transferVerifyErrorCount: 0,  // 🔧 [新增] 轉帳確認頁按取消鈕錯誤次數
                    transferConfirmErrorCount: 0  // 🔧 [新增] 轉帳最終確認頁按取消鈕錯誤次數
                },
                normalModeHintsShown: {      // 🔧 [新增] 普通模式提示已顯示標記
                    pinHintShown: false,
                    pinCancelHintShown: false,
                    bankCodeHintShown: false,
                    accountNumberHintShown: false,
                    transferAmountHintShown: false,
                    mainMenuHintShown: false,
                    withdrawAmountHintShown: false,
                    depositCancelHintShown: false,
                    depositConfirmHintShown: false
                },
                accountBalance: 100000,       // 帳戶餘額
                accountNumber: '12345678',   // 帳號（8位數字）
                cardInserted: false,         // 卡片是否插入
                pinAttempts: 0,             // PIN嘗試次數
                currentPin: '',             // 當前輸入的PIN
                correctPin: '1234',         // 正確的PIN（將從設定中同步）
                transactionAmount: 0,       // 交易金額
                isProcessing: false,        // 是否正在處理
                showingModal: false,        // 是否顯示模態視窗
                currentTransaction: {
                    type: 'withdraw',        // 交易類型
                    amount: 0,               // 金額
                    account: 'savings',      // 帳戶類型
                    completed: false         // 是否完成
                },
                // 遊戲化元素
                experience: 0,               // 經驗值
                level: 1,                   // 等級
                badges: [],                 // 獲得的徽章
                achievements: [],           // 成就
                // 輔助點擊模式狀態
                clickModeState: {
                    enabled: false,              // 是否啟用輔助點擊模式
                    currentPhase: null,          // 當前階段
                    currentOperation: null,      // 當前操作類型 ('withdraw', 'deposit', 'inquiry', 'transfer')
                    currentStep: 0,              // 當前步驟索引
                    actionQueue: [],             // 待執行的操作隊列
                    waitingForClick: false,      // 是否等待用戶點擊繼續
                    waitingForStart: false,      // 是否等待用戶點擊開始
                    lastClickTime: 0,            // 最後點擊時間（500ms 防抖）
                    initialPromptShown: false    // 是否已顯示初始提示
                },

                // 🆕 防重複機制
                lastWithdrawalAmount: null,      // 記錄上一輪的提款金額
                lastAssignedTask: null           // 記錄上一輪的指定任務類型和參數
            },
            quiz: {
                currentQuestion: 0,
                score: 0,
                questions: [],
                startTime: null,
                attempts: 0,
                completedTransactions: [],
                randomBag: [],          // 隨機模式：當前循環剩餘類型
                currentRandomType: null // 隨機模式：本輪實際任務類型
            }
        },

        // =====================================================
        // 音效和語音系統（基於A1）
        // =====================================================
        audio: {
            beepSound: null,
            errorSound: null,
            successSound: null,
            cashSound: null,
            countMoneySound: null,
            menuSelectSound: null,
            keypadSound: null,

            init() {
                try {
                    this.beepSound = new Audio('../audio/units/click.mp3');
                    this.beepSound.preload = 'auto';
                    this.beepSound.volume = 0.6;

                    this.errorSound = new Audio('../audio/units/error.mp3');
                    this.errorSound.preload = 'auto';
                    this.errorSound.volume = 0.5;

                    this.successSound = new Audio('../audio/units/correct02.mp3');
                    this.successSound.preload = 'auto';

                    this.cashSound = new Audio('../audio/units/correct02.mp3');
                    this.cashSound.preload = 'auto';
                    this.cashSound.volume = 0.7;

                    this.countMoneySound = new Audio('../audio/units/countmoney.mp3');
                    this.countMoneySound.preload = 'auto';
                    this.countMoneySound.volume = 0.8;

                    this.menuSelectSound = new Audio('../audio/units/click.mp3');
                    this.menuSelectSound.preload = 'auto';
                    this.menuSelectSound.volume = 0.5;

                    this.keypadSound = new Audio('../audio/units/keypad.mp3');
                    this.keypadSound.preload = 'auto';
                    this.keypadSound.volume = 0.7;
                } catch (error) {
                    ATM.Debug.warn('audio', 'ATM音效檔案載入失敗:', error);
                }
            },

            playBeep() {
                if (this.beepSound) {
                    this.beepSound.currentTime = 0;
                    this.beepSound.play().catch(error => console.log('播放按鍵音失敗:', error));
                }
            },

            playKeypad() {
                if (this.keypadSound) {
                    this.keypadSound.currentTime = 0;
                    this.keypadSound.play().catch(error => console.log('播放按鍵音失敗:', error));
                }
            },

            playError() {
                if (this.errorSound) {
                    this.errorSound.currentTime = 0;
                    this.errorSound.play().catch(error => console.log('播放錯誤音失敗:', error));
                }
            },

            playSuccess() {
                if (this.successSound) {
                    this.successSound.currentTime = 0;
                    this.successSound.play().catch(error => console.log('播放成功音失敗:', error));
                }
            },

            playCash() {
                if (this.cashSound) {
                    this.cashSound.currentTime = 0;
                    this.cashSound.play().catch(error => console.log('播放出鈔音失敗:', error));
                }
            },

            playCountMoney() {
                return new Promise((resolve) => {
                    if (this.countMoneySound) {
                        this.countMoneySound.currentTime = 0;
                        
                        // 設定音效播放完成後的回調
                        const onEnded = () => {
                            this.countMoneySound.removeEventListener('ended', onEnded);
                            resolve();
                        };
                        
                        this.countMoneySound.addEventListener('ended', onEnded);
                        this.countMoneySound.play().catch(error => {
                            console.log('播放點鈔音失敗:', error);
                            this.countMoneySound.removeEventListener('ended', onEnded);
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            },

            playMenuSelect() {
                if (this.menuSelectSound) {
                    this.menuSelectSound.currentTime = 0;
                    this.menuSelectSound.play().catch(error => console.log('播放選單選擇音失敗:', error));
                }
            }
        },

        // =====================================================
        // 語音系統（基於A1的高品質語音配置）
        // =====================================================
        speech: {
            synth: null,
            voice: null,
            isReady: false,

            init() {
                this.synth = window.speechSynthesis;
                this.initializeVoice();
            },

            initializeVoice() {
                const maxAttempts = 3;
                let voiceInitAttempts = 0;

                const setVoice = () => {
                    voiceInitAttempts++;
                    const voices = this.synth.getVoices();
                    
                    ATM.Debug.log('speech', '🎙️ 取得語音列表', {
                        voiceCount: voices.length,
                        attempt: voiceInitAttempts,
                        allVoices: voices.map(v => ({name: v.name, lang: v.lang}))
                    });

                    if (voices.length === 0) {
                        if (voiceInitAttempts < maxAttempts) {
                            ATM.Debug.log('speech', '🎙️ 語音列表為空，將重試');
                            // 🔧 [Phase 3] 遷移至 TimerManager（注意：這裡用 ATM.TimerManager 因為 this 指向 speech）
                            ATM.TimerManager.setTimeout(setVoice, 500, 'speechInit');
                        } else {
                            ATM.Debug.log('speech', '🎙️ 手機端無語音，啟用靜音模式');
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
                        ATM.Debug.log('speech', '🎙️ 語音準備就緒', {
                            voiceName: this.voice.name,
                            lang: this.voice.lang,
                            attempt: voiceInitAttempts 
                        });
                    } else {
                        ATM.Debug.log('speech', '🎙️ 未找到任何中文語音，進入靜音模式');
                        this.voice = null;
                        this.isReady = true;
                    }
                };
                
                setVoice();
                
                if (this.synth.onvoiceschanged !== undefined) {
                    this.synth.onvoiceschanged = setVoice;
                }
                
                // 🔧 [Phase 3] 遷移至 TimerManager
                ATM.TimerManager.setTimeout(() => {
                    if (!this.isReady && voiceInitAttempts < maxAttempts) {
                        ATM.Debug.log('speech', '🎙️ 延遲重試語音初始化');
                        setVoice();
                    }
                }, 1000, 'speechDelay');
            },

            speak(text, options = {}) {
                const { interrupt = true, callback = null } = options;

                ATM.Debug.log('speech', '🎙️ 嘗試播放語音', {
                    text,
                    interrupt,
                    isReady: this.isReady,
                    audioUnlocked: ATM.state.audioUnlocked,
                    voiceName: this.voice?.name
                });
                
                if (!ATM.state.audioUnlocked) {
                    ATM.Debug.log('speech', '🎙️ ⚠️ 音頻權限未解鎖，跳過語音播放');
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    if (callback) ATM.TimerManager.setTimeout(callback, 100, 'speechDelay');
                    return;
                }
                
                // 改善語音中斷處理，添加延遲避免頻繁取消
                if (this.synth.speaking && interrupt) {
                    ATM.Debug.log('speech', '🎙️ 停止之前的語音播放');
                    this.synth.cancel();
                    // 等待語音完全停止後再繼續
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    ATM.TimerManager.setTimeout(() => this.performSpeech(text, callback), 200, 'speechDelay');
                    return;
                }
                
                if (!this.isReady || !text) {
                    ATM.Debug.log('speech', '🎙️ 語音系統未就緒或文字為空', { isReady: this.isReady, hasText: !!text });
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    if (callback) ATM.TimerManager.setTimeout(callback, 300, 'speechDelay');
                    return;
                }

                if (!this.voice) {
                    ATM.Debug.log('speech', '🎙️ 靜音模式，跳過語音播放');
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    if (callback) ATM.TimerManager.setTimeout(callback, 100, 'speechDelay');
                    return;
                }

                this.performSpeech(text, callback);
            },

            performSpeech(text, callback) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.voice = this.voice;
                utterance.rate = 1.0;
                utterance.lang = this.voice.lang;

                ATM.Debug.log('speech', '🎙️ 開始播放語音', {
                    text: text,
                    voiceName: this.voice.name
                });

                // 改善的安全回調機制
                if (callback) {
                    let callbackExecuted = false;
                    const safeCallback = () => {
                        if (!callbackExecuted) {
                            callbackExecuted = true;
                            callback();
                        }
                    };
                    
                    utterance.onend = () => {
                        ATM.Debug.log('speech', '🎙️ 語音播放完成');
                        safeCallback();
                    };
                    
                    utterance.onerror = (event) => {
                        ATM.Debug.log('speech', '🎙️ 語音播放錯誤', event.error);
                        // 即使出錯也要執行回調以免卡住流程
                        safeCallback();
                    };
                    
                    // 縮短超時時間，避免長時間等待
                    // 🔧 [Phase 3] 遷移至 TimerManager（注意：這裡用 ATM.TimerManager 因為 this 指向 speech）
                    ATM.TimerManager.setTimeout(safeCallback, 5000, 'speechDelay'); // 5秒超時保護
                }

                try {
                    ATM.Debug.log('speech', '🎙️ 語音已提交播放');
                    this.synth.speak(utterance);
                } catch (error) {
                    ATM.Debug.log('speech', '🎙️ 語音播放異常', error);
                    if (callback) callback();
                }
            }
        },

        // =====================================================
        // 音頻解鎖系統（基於A1）
        // =====================================================
        unlockAudio() {
            if (this.state.audioUnlocked) return;

            ATM.Debug.log('audio', '🔓 嘗試解鎖音頻播放權限...');

            try {
                // 嘗試創建和播放空的音頻來解鎖
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                gainNode.gain.value = 0;
                oscillator.frequency.value = 440;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);

                this.state.audioUnlocked = true;
                ATM.Debug.log('audio', '✅ 音頻解鎖成功');

                // 初始化音效系統
                this.audio.init();
            } catch (error) {
                ATM.Debug.warn('audio', '⚠️ 音頻解鎖失敗，但繼續執行', error);
                this.state.audioUnlocked = true; // 仍然設為true以允許程序繼續
            }
        },

        // =====================================================
        // ATM界面生成系統
        // =====================================================
        generateATMInterface() {
            return `
                <!-- 🔧 [新增] ATM 標題列 - 參考 a1 設計 -->
                <div class="atm-title-bar">
                    <div class="atm-title-bar-left">
                        <span class="atm-icon-large">🏧</span>
                        <span>ATM提款機模擬</span>
                    </div>
                    <div class="atm-title-bar-center" id="atm-step-title">準備開始...</div>
                    <div class="atm-title-bar-right">
                        <span id="atm-progress-info">步驟 1 / 5</span>
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                    </div>
                </div>

                <div class="atm-container">
                    <!-- ATM機器外殼 - 新的三欄佈局 -->
                    <div class="atm-body">
                        <!-- 🔧 [修正] ATM統一功能面板 - 包含所有主要功能區域 -->
                        <div class="atm-main-frame">
                            <div class="atm-functions-container">
                                <!-- 上排：卡片插入區和螢幕區域 -->
                                <div class="atm-upper-section">
                                    <!-- 左側：卡片插入區 -->
                                    <div class="card-section">
                                        <div class="card-slot-area">
                                            <div class="card-slot" id="card-slot">
                                                <div class="card-slot-light" id="card-light"></div>
                                                <div class="card-slot-opening">請插入卡片</div>
                                                <div class="card-insertion-slit" id="card-slit">
                                                    <div class="slit-interior"></div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- 金融卡展示區 -->
                                        <div class="atm-card-area">
                                            <img src="../images/a5/icon-a5-card.png" alt="金融卡" class="atm-card" id="atm-card">
                                        </div>
                                    </div>
                                    
                                    <!-- 中央：螢幕區域 -->
                                    <div class="screen-section">
                                        <div class="atm-screen-area">
                                            <div class="atm-screen" id="atm-screen">
                                                <div class="screen-content" id="screen-content">
                                                    <!-- 動態內容將在這裡生成 -->
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- 右側：收據區域（包含出口和交易收據） -->
                                    <div class="receipt-section">
                                        <!-- 明細表出口 -->
                                        <div class="receipt-printer">
                                            <div class="receipt-slot" id="receipt-slot">
                                                <div class="receipt-slot-light" id="receipt-light"></div>
                                                <div class="receipt-opening">明細表出口</div>
                                                <div class="receipt-insertion-slit">
                                                    <div class="slit-interior"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 下排：現金出口 -->
                                <div class="atm-lower-section">
                                    <div class="cash-dispenser-area">
                                        <div class="cash-dispenser" id="cash-dispenser">
                                            <div class="cash-slot">
                                                <div class="cash-slot-cover">
                                                    <div class="cash-slot-label">現金出口</div>
                                                </div>
                                                <div class="cash-display-area-container">
                                                    <div class="cash-display-background" id="cash-display-background">
                                                    </div>
                                                    <div class="cash-display-cover" id="cash-display-cover">
                                                        <div class="cash-placeholder">請提領現金</div>
                                                    </div>
                                                    <!-- 現金滾動拉桿 -->
                                                    <div class="amount-slider-container" id="amount-slider-container">
                                                        <div class="slider-track" id="slider-track"></div>
                                                        <div class="slider-handle" id="slider-handle">
                                                            <div class="handle-grip">⋮</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 🔧 [新增] 提示按鈕（普通/困難模式）- 位於 atm-lower-section 右側 -->
                                    <div id="hint-btn-wrapper" style="display:none; grid-column:3; justify-self:end; align-self:center; align-items:center; gap:6px;">
                                        <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                                        <button class="hint-request-btn" id="hint-request-btn" style="grid-column:unset; justify-self:unset;">
                                            <span class="hint-icon">💡</span>
                                            <span class="hint-text">提示</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // =====================================================
        // 設定畫面生成（基於A1模式）
        // =====================================================
        showSettings() {
            // 🔧 [Phase 5] 清除所有計時器（返回設定時清除上一輪殘留計時器）
            this.TimerManager.clearAll();
            this.EventManager.removeByCategory('settings');
            if (window.TutorContext) {
                TutorContext.update({ screen: 'settings' });
                TutorContext.getLiveData = null;
            }

            // 🔧 [新增] 重置普通模式狀態（返回設定時清除上一輪狀態）
            this.resetNormalModeState();

            const { difficulty, accountSetup, sessionType, questionCount } = this.state.settings;
            const app = document.getElementById('app');

            // 解鎖設定頁面滾動（A4 架構：只操作 #app）
            app.style.overflowY = 'auto';
            app.style.height = '100%';

            app.innerHTML = `
                <div class="atm-settings-container">
                    <div class="settings-content">
                        <div class="settings-header">
                        <div class="settings-title-row">
                            <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                            <h1>單元A5：ATM提款機</h1>
                        </div>
                            <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">學習ATM操作流程，包含插卡、輸入密碼、選擇功能與提領現金</p>
                        </div>

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


                        <div class="setting-group" style="background: #fff3cd; padding: 15px; border-radius: 10px; border: 2px solid #ffcc02; ${difficulty === 'easy' ? '' : 'display: none;'}">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2em;">♿</span>
                                <span>輔助點擊模式（單鍵操作）：</span>
                            </label>
                            <p style="font-size: 0.9em; color: #666; margin: 8px 0 12px 0; line-height: 1.5;">
                                啟用後，只要偵測到點擊，系統會自動依序完成插卡、輸入密碼、選擇金額、取鈔、取卡等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式 + 指定任務」</strong>
                            </p>
                            <div class="button-group">
                                <button class="selection-btn ${this.state.settings.clickMode === true ? 'active' : ''}"
                                        data-type="clickMode" data-value="true">
                                    ✓ 啟用
                                </button>
                                <button class="selection-btn ${this.state.settings.clickMode === false || this.state.settings.clickMode === undefined ? 'active' : ''}"
                                        data-type="clickMode" data-value="false">
                                    ✗ 停用
                                </button>
                            </div>
                        </div>

                        <div class="setting-group">
                            <label>👤 帳戶設定：</label>
                            <div class="button-group">
                                <button class="selection-btn ${accountSetup === 'default' ? 'active' : ''}"
                                        data-type="accountSetup" data-value="default">
                                    預設
                                </button>
                                <button class="selection-btn ${accountSetup === 'custom' ? 'active' : ''}"
                                        data-type="accountSetup" data-value="custom">
                                    自訂密碼
                                </button>
                                <button class="selection-btn ${accountSetup === 'customBalance' ? 'active' : ''}"
                                        data-type="accountSetup" data-value="customBalance"
                                        style="${difficulty === 'hard' ? '' : 'display: none;'}">
                                    自訂帳戶金額
                                </button>
                            </div>
                        </div>

                        <div class="setting-group">
                            <label>📋 任務類型：</label>
                            <div class="button-group">
                                <button class="selection-btn ${sessionType === 'random' ? 'active' : ''}"
                                        data-type="sessionType" data-value="random">
                                    隨機 🎲
                                </button>
                                <button class="selection-btn ${sessionType === 'withdraw' ? 'active' : ''}"
                                        data-type="sessionType" data-value="withdraw">
                                    提款
                                </button>
                                <button class="selection-btn ${sessionType === 'deposit' ? 'active' : ''}"
                                        data-type="sessionType" data-value="deposit">
                                    存款
                                </button>
                                <button class="selection-btn ${sessionType === 'inquiry' ? 'active' : ''}"
                                        data-type="sessionType" data-value="inquiry">
                                    餘額查詢
                                </button>
                                <button class="selection-btn ${sessionType === 'transfer' ? 'active' : ''}"
                                        data-type="sessionType" data-value="transfer">
                                    轉帳
                                </button>
                                <button class="selection-btn ${sessionType === 'free' ? 'active' : ''}"
                                        data-type="sessionType" data-value="free"
                                        style="${difficulty === 'hard' ? '' : 'display: none;'}">
                                    自選服務
                                </button>
                            </div>
                        </div>
                        
                        <div class="setting-group">
                            <label>📊 測驗題數：</label>
                            <div class="button-group">
                                ${[1, 3, 5, 10].map(num => `
                                    <button class="selection-btn ${questionCount === num ? 'active' : ''}"
                                            data-type="questionCount" data-value="${num}">${num} 題</button>
                                `).join('')}
                                <button class="selection-btn ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? 'active' : ''}"
                                        data-type="questionCount" data-value="custom">
                                    自訂
                                </button>
                            </div>
                            <div class="custom-question-display" style="display: ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? 'block' : 'none'}; margin-top: 10px;">
                                <input type="text" id="custom-question-count-a5"
                                       value="${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? questionCount + '題' : ''}"
                                       placeholder="請輸入題數"
                                       style="padding: 8px; border-radius: 5px; border: 2px solid ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? '#667eea' : '#ddd'}; background: ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? '#667eea' : 'white'}; color: ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                                       readonly onclick="ATM.showQuestionCountInput()">
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
                            <button class="back-to-main-btn" onclick="ATM.backToMainMenu()">
                                返回主畫面
                            </button>
                            ${this.isSettingsComplete()
                                ? `<button class="start-btn" onclick="ATM.startLearning()">開始測驗</button>`
                                : `<button class="start-btn disabled" disabled>請完成所有設定選項</button>`
                            }
                        </div>
                    </div>
                </div>
            `;
            
            // 綁定設定選擇事件
            this.bindSettingEvents();
        },

        // =====================================================
        // 設定驗證
        // =====================================================
        isSettingsComplete() {
            const s = this.state.settings;
            return s.difficulty && s.accountSetup && s.sessionType && s.questionCount;
        },

        updateStartButton() {
            const footer = document.querySelector('.game-buttons');
            if (!footer) return;

            const backBtn = footer.querySelector('.back-to-main-btn');

            if (this.isSettingsComplete()) {
                footer.innerHTML = `
                    ${backBtn ? backBtn.outerHTML : '<button class="back-to-main-btn" onclick="ATM.backToMainMenu()">返回主畫面</button>'}
                    <button class="start-btn" onclick="ATM.startLearning()">開始測驗</button>
                `;
            } else {
                footer.innerHTML = `
                    ${backBtn ? backBtn.outerHTML : '<button class="back-to-main-btn" onclick="ATM.backToMainMenu()">返回主畫面</button>'}
                    <button class="start-btn disabled" onclick="ATM.showMissingSettings()">請完成所有設定選項</button>
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

            if (missing.length > 0) {
                alert('請先完成以下設定：\n\n' + missing.map(m => '• ' + m).join('\n'));
            }
        },

        // =====================================================
        // 事件綁定系統
        // =====================================================
        bindSettingEvents() {
            const gameSettings = document.querySelector('.settings-content');
            if (gameSettings) {
                gameSettings.addEventListener('click', this.handleSettingSelection.bind(this));
            }

            // 🎁 獎勵系統連結事件
            const settingsRewardLink = document.getElementById('settings-reward-link');
            this.EventManager.on(settingsRewardLink, 'click', (e) => {
                e.preventDefault();
                if (typeof RewardLauncher !== 'undefined') {
                    RewardLauncher.open();
                } else {
                    window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                }
            }, {}, 'settings');

            // 📝 作業單連結事件
            const worksheetLink = document.getElementById('settings-worksheet-link');
            this.EventManager.on(worksheetLink, 'click', (e) => {
                e.preventDefault();
                // 作業單使用自己的預設值與工具列設定，不受遊戲設定影響
                const params = new URLSearchParams({ unit: 'a5' });
                window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
            }, {}, 'settings');


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

        // =====================================================
        // 帳戶設定方法
        // =====================================================
        showAccountNumberInput() {
            this.showNumericInput('accountNumber', '設定帳號', '請輸入8位數帳號', this.state.settings.customAccountNumber, 8);
        },

        showPasswordInput() {
            this.showNumericInput('password', '設定密碼', '請輸入4-12位數密碼', this.state.settings.customPassword, 12);
        },

        showBalanceInput() {
            this.showNumericInput('balance', '設定帳戶金額', '請輸入帳戶金額', this.state.settings.customBalance.toString(), 8);
        },

        showNumericInput(type, title, instruction, currentValue, maxLength) {
            const app = document.getElementById('app');
            const modalHtml = `
                <div class="numeric-input-modal" id="numeric-modal">
                    <div class="modal-overlay" onclick="ATM.closeNumericInput()"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>${title}</h3>
                            <button class="close-btn" onclick="ATM.closeNumericInput()">✕</button>
                        </div>
                        <div class="modal-body">
                            <p class="instruction">${instruction}</p>
                            <div class="display-area">
                                <input type="text" class="numeric-display" id="numeric-input" 
                                       value="${currentValue}" maxlength="${maxLength}" readonly>
                            </div>
                            <div class="numeric-keypad">
                                ${this.generateNumericKeypad()}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="cancel-btn" onclick="ATM.closeNumericInput()">取消</button>
                            <button class="confirm-btn" onclick="ATM.confirmNumericInput('${type}')">確認</button>
                        </div>
                    </div>
                </div>
            `;
            
            // 添加模態視窗到現有內容之上
            const modalDiv = document.createElement('div');
            modalDiv.innerHTML = modalHtml;
            document.body.appendChild(modalDiv.firstElementChild);
            
            // 綁定數字鍵盤事件
            this.bindNumericKeypadEvents();
            
            // 調整初始字體大小
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                const input = document.getElementById('numeric-input');
                if (input) {
                    this.adjustDisplayFontSize(input);
                }
            }, 100, 'uiAnimation');
        },

        generateNumericKeypad() {
            const keys = [
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['清除', '0', '刪除']
            ];
            
            return keys.map(row => 
                `<div class="keypad-row">
                    ${row.map(key => 
                        `<button class="keypad-btn" data-key="${key}">${key}</button>`
                    ).join('')}
                </div>`
            ).join('');
        },

        bindNumericKeypadEvents() {
            const keypad = document.querySelector('.numeric-keypad');
            if (keypad) {
                keypad.addEventListener('click', (e) => {
                    if (e.target.classList.contains('keypad-btn')) {
                        const key = e.target.dataset.key;
                        this.handleNumericInput(key);
                    }
                });
            }
        },

        handleNumericInput(key) {
            const input = document.getElementById('numeric-input');
            if (!input) return;

            let currentValue = input.value;

            switch(key) {
                case '清除':
                    input.value = '';
                    break;
                case '刪除':
                    input.value = currentValue.slice(0, -1);
                    break;
                default:
                    if (currentValue.length < parseInt(input.maxLength)) {
                        input.value = currentValue + key;
                    }
                    break;
            }
            
            // 動態調整字體大小以適應長密碼
            this.adjustDisplayFontSize(input);
            
            // 播放按鍵音效
            if (this.audio) {
                this.audio.playKeypad();
            }
        },

        adjustDisplayFontSize(input) {
            const length = input.value.length;
            if (length <= 6) {
                input.style.fontSize = '24px';
                input.style.letterSpacing = '2px';
            } else if (length <= 9) {
                input.style.fontSize = '20px';
                input.style.letterSpacing = '1.5px';
            } else {
                input.style.fontSize = '18px';
                input.style.letterSpacing = '1px';
            }
        },

        confirmNumericInput(type) {
            const input = document.getElementById('numeric-input');
            const value = input.value.trim();

            if (type === 'accountNumber') {
                if (value.length !== 8 || !/^\d{8}$/.test(value)) {
                    alert('帳號必須是8位數字！');
                    return;
                }
                this.state.settings.customAccountNumber = value;
                this.state.gameState.accountNumber = value;
            } else if (type === 'password') {
                if (value.length < 4 || value.length > 12 || !/^\d{4,12}$/.test(value)) {
                    alert('密碼必須是4-12位數字！');
                    return;
                }
                this.state.settings.customPassword = value;
                this.state.gameState.correctPin = value;
            } else if (type === 'balance') {
                const numValue = parseInt(value);
                if (isNaN(numValue) || numValue < 0 || numValue > 99999999) {
                    alert('請輸入有效的金額（0-99,999,999）！');
                    return;
                }
                this.state.settings.customBalance = numValue;
                this.state.gameState.accountBalance = numValue;
            }

            this.closeNumericInput();
            // 🔧 [優化] 只更新顯示值，避免整頁重新渲染造成閃爍
            this.updateAccountDisplayValues(type, value);

            // 🔧 [新增] 更新開始按鈕狀態
            this.updateStartButton();

            // 播放確認音效
            if (this.audio) {
                this.audio.playSuccess();
            }
        },

        closeNumericInput() {
            const modal = document.getElementById('numeric-modal');
            if (modal) {
                modal.remove();
            }
        },

        // =====================================================
        // 題數輸入視窗
        // =====================================================
        showQuestionCountInput() {
            const existingPopup = document.getElementById('question-count-popup');
            if (existingPopup) {
                existingPopup.remove();
            }

            const inputPopupHTML = `
                <div id="question-count-popup" class="number-input-popup">
                    <div class="number-input-container">
                        <div class="number-input-header">
                            <h3>請輸入題數</h3>
                            <button class="close-btn" onclick="ATM.closeQuestionCountInput()">×</button>
                        </div>
                        <div class="number-input-display">
                            <input type="text" id="question-count-display" readonly value="">
                        </div>
                        <div class="number-input-buttons">
                            <button onclick="ATM.appendQuestionDigit('1')">1</button>
                            <button onclick="ATM.appendQuestionDigit('2')">2</button>
                            <button onclick="ATM.appendQuestionDigit('3')">3</button>
                            <button onclick="ATM.clearQuestionCount()" class="clear-btn">清除</button>
                            <button onclick="ATM.appendQuestionDigit('4')">4</button>
                            <button onclick="ATM.appendQuestionDigit('5')">5</button>
                            <button onclick="ATM.appendQuestionDigit('6')">6</button>
                            <button onclick="ATM.backspaceQuestionCount()" class="backspace-btn">⌫</button>
                            <button onclick="ATM.appendQuestionDigit('7')">7</button>
                            <button onclick="ATM.appendQuestionDigit('8')">8</button>
                            <button onclick="ATM.appendQuestionDigit('9')">9</button>
                            <button onclick="ATM.confirmQuestionCount()" class="confirm-btn">確認</button>
                            <button onclick="ATM.appendQuestionDigit('0')" class="zero-btn">0</button>
                        </div>
                    </div>
                </div>
            `;

            const inputStyles = `
                <style id="question-count-styles">
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
                #question-count-display {
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
                    font-size: 14px !important;
                }
                .number-input-buttons button.backspace-btn {
                    background: #ffa726 !important;
                    color: white !important;
                    border-color: #ffa726 !important;
                    font-size: 16px !important;
                }
                .number-input-buttons button.confirm-btn {
                    background: #4caf50 !important;
                    color: white !important;
                    border-color: #4caf50 !important;
                    grid-row: span 2;
                    font-size: 14px !important;
                }
                .number-input-buttons button.zero-btn {
                    grid-column: span 3;
                }
                /* @keyframes bounceIn 已移至 injectGlobalAnimationStyles() */
                </style>
            `;

            if (!document.getElementById('question-count-styles')) {
                document.head.insertAdjacentHTML('beforeend', inputStyles);
            }
            document.body.insertAdjacentHTML('beforeend', inputPopupHTML);
        },

        closeQuestionCountInput() {
            const popup = document.getElementById('question-count-popup');
            if (popup) popup.remove();
        },

        appendQuestionDigit(digit) {
            const display = document.getElementById('question-count-display');
            if (!display) return;
            this.audio.playKeypad();
            if (display.value === '' || display.value === '0') {
                display.value = digit;
            } else {
                display.value += digit;
            }
        },

        clearQuestionCount() {
            const display = document.getElementById('question-count-display');
            if (!display) return;
            this.audio.playKeypad();
            display.value = '';
        },

        backspaceQuestionCount() {
            const display = document.getElementById('question-count-display');
            if (!display) return;
            this.audio.playKeypad();
            if (display.value.length > 1) {
                display.value = display.value.slice(0, -1);
            } else {
                display.value = '';
            }
        },

        confirmQuestionCount() {
            const display = document.getElementById('question-count-display');
            if (!display) return;
            const inputValue = parseInt(display.value);
            if (inputValue > 0 && inputValue <= 100) {
                this.state.settings.questionCount = inputValue;
                this.audio.playBeep();

                // 🔧 [修正] 直接更新 DOM，避免重新渲染整個設定畫面（防止閃爍）
                // 更新自訂按鈕為 active
                const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
                if (customBtn) {
                    const group = customBtn.closest('.button-group');
                    group.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                    customBtn.classList.add('active');
                }

                // 更新或創建題數顯示區域（藍色框樣式，同 A1）
                const settingGroup = customBtn?.closest('.setting-group');
                if (settingGroup) {
                    let customDisplay = settingGroup.querySelector('.custom-question-display');
                    let customInput = document.getElementById('custom-question-count-a5');
                    if (!customDisplay) {
                        customDisplay = document.createElement('div');
                        customDisplay.className = 'custom-question-display';
                        customDisplay.style.marginTop = '10px';
                        const inputEl = document.createElement('input');
                        inputEl.type = 'text';
                        inputEl.id = 'custom-question-count-a5';
                        inputEl.readOnly = true;
                        inputEl.placeholder = '請輸入題數';
                        inputEl.style.cssText = 'padding: 8px; border-radius: 5px; border: 2px solid #667eea; background: #667eea; color: white; text-align: center; cursor: pointer; width: 120px;';
                        inputEl.onclick = () => ATM.showQuestionCountInput();
                        customDisplay.appendChild(inputEl);
                        settingGroup.appendChild(customDisplay);
                        customInput = inputEl;
                    }
                    customDisplay.style.display = 'block';
                    if (customInput) {
                        customInput.value = `${inputValue}題`;
                        customInput.style.background = '#667eea';
                        customInput.style.color = 'white';
                        customInput.style.borderColor = '#667eea';
                    }
                }

                // 更新開始按鈕狀態
                this.updateStartButton();

                this.closeQuestionCountInput();
            } else {
                alert('請輸入1-100之間的有效題數！');
            }
        },

        handleSettingSelection(event) {
            const btn = event.target.closest('.selection-btn');
            if (!btn) return;

            const type = btn.dataset.type;
            const value = btn.dataset.value;
            const buttonText = btn.textContent.trim();

            // 播放按鈕文字語音
            this.speech.speak(buttonText);


            // 更新設定狀態
            if (type && this.state.settings.hasOwnProperty(type)) {
                this.state.settings[type] = isNaN(value) ? value : parseInt(value);
            }

            // 🔧 [新增] 如果選擇自訂密碼，彈出密碼設定視窗
            if (type === 'accountSetup' && value === 'custom') {
                this.showPasswordInput();
                return; // 不更新按鈕狀態，等密碼設定完成後再更新
            }

            // 🔧 [新增] 如果選擇自訂帳戶金額，彈出金額設定視窗
            if (type === 'accountSetup' && value === 'customBalance') {
                this.showBalanceInput();
                return; // 不更新按鈕狀態，等金額設定完成後再更新
            }

            // 🔧 [新增] 如果選擇自訂題數，彈出題數輸入視窗
            if (type === 'questionCount' && value === 'custom') {
                this.showQuestionCountInput();
                return; // 不更新按鈕狀態，等題數設定完成後再更新
            }

            // 🔧 [修正] 如果改變難度，動態更新顯示/隱藏而不重新渲染整個頁面
            if (type === 'difficulty') {
                // 🔧 [修正] 簡單模式或普通模式下，如果當前選擇了自選服務，自動切換為提款
                if ((value === 'easy' || value === 'normal') && this.state.settings.sessionType === 'free') {
                    this.state.settings.sessionType = 'withdraw';
                    // 更新任務類型按鈕的 active 狀態
                    const withdrawBtn = document.querySelector('[data-type="sessionType"][data-value="withdraw"]');
                    if (withdrawBtn) {
                        document.querySelectorAll('[data-type="sessionType"]').forEach(b => b.classList.remove('active'));
                        withdrawBtn.classList.add('active');
                    }
                }

                // 動態顯示/隱藏選項
                const freeChoiceBtn = document.querySelector('[data-type="sessionType"][data-value="free"]');
                const customBalanceBtn = document.querySelector('[data-type="accountSetup"][data-value="customBalance"]');

                // 尋找輔助點擊模式的設定組
                const clickModeBtn = document.querySelector('[data-type="clickMode"]');
                const clickModeGroup = clickModeBtn ? clickModeBtn.closest('.setting-group') : null;

                ATM.Debug.log('ui', '[Settings] 難度變更為:', value);
                ATM.Debug.log('ui', '[Settings] 找到輔助點擊模式按鈕:', clickModeBtn);
                ATM.Debug.log('ui', '[Settings] 找到輔助點擊模式群組:', clickModeGroup);

                if (value === 'easy') {
                    // 簡單模式：隱藏自選服務、自訂帳戶金額，顯示輔助點擊模式
                    if (freeChoiceBtn) freeChoiceBtn.style.display = 'none';
                    if (customBalanceBtn) customBalanceBtn.style.display = 'none';
                    if (clickModeGroup) {
                        clickModeGroup.style.display = '';
                        ATM.Debug.log('ui', '[Settings] 已顯示輔助點擊模式選項');
                    } else {
                        ATM.Debug.warn('ui', '[Settings] 找不到輔助點擊模式群組！');
                    }
                } else if (value === 'normal') {
                    // 🔧 [修正] 普通模式：隱藏自選服務和自訂帳戶金額，隱藏輔助點擊模式
                    if (freeChoiceBtn) freeChoiceBtn.style.display = 'none';
                    if (customBalanceBtn) customBalanceBtn.style.display = 'none';
                    if (clickModeGroup) clickModeGroup.style.display = 'none';
                } else if (value === 'hard') {
                    // 困難模式：顯示所有選項，隱藏輔助點擊模式
                    if (freeChoiceBtn) freeChoiceBtn.style.display = '';
                    if (customBalanceBtn) customBalanceBtn.style.display = '';
                    if (clickModeGroup) clickModeGroup.style.display = 'none';
                }

                // 🔧 [新增] 更新難度說明
                this.updateDifficultyDescription(value);
            }

            // 🔧 [優化] 只更新按鈕狀態，避免整頁重新渲染造成閃爍
            this.updateActiveStates(type, btn);

            // 🔧 [新增] 更新開始按鈕狀態
            this.updateStartButton();

            // 播放選擇音效
            this.playMenuSelectSound();
        },

        // 🔧 [新增] 局部更新按鈕活動狀態（避免整頁重新渲染）
        updateActiveStates(type, selectedBtn) {
            // 移除同組所有按鈕的active狀態
            const group = selectedBtn.closest('.setting-group');
            const buttons = group.querySelectorAll('.selection-btn');
            buttons.forEach(btn => btn.classList.remove('active'));

            // 為選中的按鈕添加active狀態
            selectedBtn.classList.add('active');
        },

        // 🔧 [新增] 局部更新帳戶顯示值（避免整頁重新渲染）
        updateAccountDisplayValues(type, value) {
            if (type === 'accountNumber') {
                const accountBtn = document.querySelector('[onclick="ATM.showAccountNumberInput()"]');
                if (accountBtn) {
                    const small = accountBtn.querySelector('small');
                    if (small) {
                        small.textContent = `目前帳號：${value}`;
                    }
                }
            } else if (type === 'password') {
                const passwordBtn = document.querySelector('[onclick="ATM.showPasswordInput()"]');
                if (passwordBtn) {
                    const small = passwordBtn.querySelector('small');
                    if (small) {
                        small.textContent = `目前密碼：${value}`;
                    }
                }
            } else if (type === 'balance') {
                const balanceBtn = document.querySelector('[onclick="ATM.showBalanceInput()"]');
                if (balanceBtn) {
                    const small = balanceBtn.querySelector('small');
                    if (small) {
                        small.textContent = `目前金額：$${parseInt(value).toLocaleString()}`;
                    }
                }
            }
        },

        playMenuSelectSound() {
            this.audio.playMenuSelect();
        },

        // =====================================================
        // 學習流程控制
        // =====================================================

        /**
         * 🎯 歡迎畫面 - 顯示「歡迎來到 ATM 提款機」
         * 參考 A5 架構，在開始學習時顯示歡迎畫面
         */
        showWelcomeScreen() {
            ATM.Debug.log('flow', '[Welcome] 開始顯示歡迎畫面');
            const app = document.getElementById('app');

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
                        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
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

                    .welcome-title .atm-image {
                        width: 200px;
                        height: 200px;
                        margin: 0 auto 1rem;
                        animation: bounceWelcome 1.5s ease-in-out infinite;
                    }

                    .welcome-title .atm-image img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
                    }

                    .welcome-title h2 {
                        font-size: 2rem;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                        margin: 0;
                    }

                    /* 響應式調整 */
                    @media (max-width: 768px) {
                        .welcome-title .atm-image {
                            width: 150px;
                            height: 150px;
                        }
                        .welcome-title h2 {
                            font-size: 1.5rem;
                        }
                    }
                </style>

                <div class="welcome-screen">
                    <div class="welcome-content">
                        <div class="welcome-title">
                            <div class="atm-image">
                                <img src="../images/a5/icon-a5-atm.png" alt="ATM"
                                     onerror="this.outerHTML='<div style=\\'font-size: 10rem;\\'>🏧</div>'">
                            </div>
                            <h2 style="color: white;">歡迎來到 ATM 提款機</h2>
                        </div>
                    </div>
                </div>
            `;

            // 播放語音，並以 window.setTimeout 確保一定會前進（不依賴 TimerManager）
            let _welcomed = false;
            const _goNext = () => {
                if (_welcomed) return;
                _welcomed = true;
                window.setTimeout(() => this.showMissionScreen(), 300);
            };
            this.speech.speak('歡迎來到 ATM 提款機', { callback: _goNext });
            window.setTimeout(_goNext, 2500);   // 最長等 2.5 秒，之後強制前進
            document.querySelector('.welcome-screen')?.addEventListener('click', _goNext, { once: true });
        },

        /**
         * 📋 任務說明畫面 - 顯示任務內容和目標金額
         * 參考 A5 架構，在提款模式下說明要提領的金額
         */
        showMissionScreen() {
            ATM.Debug.log('flow', '[Mission] 開始顯示任務畫面');
            const app = document.getElementById('app');
            const { difficulty } = this.state.settings;
            const sessionType = this.getActualSessionType();

            // 🔧 [新增] 困難模式+自選服務：顯示通用提示
            if (difficulty === 'hard' && sessionType === 'free') {
                const missionText = '請依你的需求，進行提款機的操作';
                const speechText = '請依你的需求，進行提款機的操作';

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

                        /* 任務畫面佔滿整個視窗 */
                        .mission-screen {
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

                        .mission-content {
                            max-width: 700px;
                            padding: 3rem;
                            background: rgba(255, 255, 255, 0.15);
                            border-radius: 20px;
                            backdrop-filter: blur(10px);
                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                            animation: fadeInScale 1s ease-out;
                        }

                        .mission-title {
                            font-size: 3rem;
                            margin-bottom: 2rem;
                            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                        }

                        .mission-task {
                            font-size: 1.8rem;
                            margin-bottom: 2rem;
                            line-height: 1.6;
                            color: white;
                        }

                        /* 響應式調整 */
                        @media (max-width: 768px) {
                            .mission-title {
                                font-size: 2rem;
                            }
                            .mission-task {
                                font-size: 1.2rem;
                            }
                        }
                    </style>

                    <div class="mission-screen">
                        <div class="mission-content">
                            <h1 class="mission-title">🎯 自由操作</h1>
                            <div class="mission-task">
                                ${missionText}
                            </div>
                        </div>
                    </div>
                `;

            {
                // 播放語音，window.setTimeout 確保一定前進
                let _gone = false;
                const _next = () => { if (_gone) return; _gone = true; window.setTimeout(() => this.startATMSession(), 300); };
                this.speech.speak(speechText, { callback: _next });
                window.setTimeout(_next, 3500);
                document.querySelector('.mission-screen')?.addEventListener('click', _next, { once: true });
            }
                return;
            }

            // 任務類型文字
            const taskNames = {
                withdraw: '提款',
                deposit: '存款',
                inquiry: '查詢餘額',
                transfer: '轉帳'
            };
            const taskName = taskNames[sessionType] || 'ATM操作';

            // 如果是提款模式，準備指定金額
            let assignedAmount = null;
            let assignedBankCode = null;
            let assignedBankName = null;
            let missionText = '';
            let speechText = '';

            if (sessionType === 'withdraw') {
                // 冒險模式：直接使用傳入的目標金額，不跑原有隨機邏輯
                if (this._advTargetAmount) {
                    assignedAmount = this._advTargetAmount;
                } else {
                    // 🔧 [修正] 簡單模式下，確保提款金額低於帳戶餘額
                    const amounts = [1000, 3000, 5000, 10000, 20000];
                    const currentBalance = this.state.gameState.accountBalance;

                    // 篩選出低於帳戶餘額的金額選項
                    const validAmounts = amounts.filter(amt => amt < currentBalance);

                    // 🆕 避免與上一輪重複
                    const lastAmount = this.state.gameState.lastWithdrawalAmount;

                    if (validAmounts.length > 0) {
                        // 如果有上一輪金額且選項數量 > 1，排除上一輪的金額
                        if (lastAmount && validAmounts.length > 1) {
                            const availableAmounts = validAmounts.filter(amt => amt !== lastAmount);
                            if (availableAmounts.length > 0) {
                                assignedAmount = availableAmounts[Math.floor(Math.random() * availableAmounts.length)];
                                ATM.Debug.log('flow', `🎯 [防重複-提款] 排除上一輪: ${lastAmount}元, 選擇新值: ${assignedAmount}元`);
                            } else {
                                assignedAmount = validAmounts[Math.floor(Math.random() * validAmounts.length)];
                            }
                        } else {
                            assignedAmount = validAmounts[Math.floor(Math.random() * validAmounts.length)];
                        }
                    } else {
                        // 如果所有預設金額都超過帳戶餘額，則選擇帳戶餘額的一半（以1000為單位）
                        assignedAmount = Math.floor(currentBalance / 2000) * 1000;
                        if (assignedAmount < 1000) assignedAmount = 1000;
                    }
                }

                // 🆕 保存本輪提款金額供下一輪比較
                this.state.gameState.lastWithdrawalAmount = assignedAmount;

                ATM.Debug.log('flow', `🎯 [簡單模式-提款] 帳戶餘額: ${this.state.gameState.accountBalance}, 指定提款: ${assignedAmount}`);

                // 儲存到狀態中（供後續驗證使用）
                this.state.gameState.easyModeHints.assignedAmount = assignedAmount;

                const amountText = assignedAmount.toLocaleString();
                missionText = `請提領 <strong style="color: #FFFFFF; font-size: 2.5rem;">${amountText} 元</strong>`;
                speechText = `您的任務是提領 ${this.convertAmountToSpeech(assignedAmount)}`;
            } else if (sessionType === 'deposit') {
                // 🔧 [新增] 指定存款：隨機選擇一個金額（1000-10000，都是1000的倍數）
                const depositAmounts = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];

                // 🆕 避免與上一輪重複
                const lastTask = this.state.gameState.lastAssignedTask;
                if (lastTask && lastTask.type === 'deposit' && depositAmounts.length > 1) {
                    const availableAmounts = depositAmounts.filter(amt => amt !== lastTask.amount);
                    if (availableAmounts.length > 0) {
                        assignedAmount = availableAmounts[Math.floor(Math.random() * availableAmounts.length)];
                        ATM.Debug.log('flow', `🎯 [防重複-存款] 排除上一輪: ${lastTask.amount}元, 選擇新值: ${assignedAmount}元`);
                    } else {
                        assignedAmount = depositAmounts[Math.floor(Math.random() * depositAmounts.length)];
                    }
                } else {
                    assignedAmount = depositAmounts[Math.floor(Math.random() * depositAmounts.length)];
                }

                // 儲存到狀態中（供後續驗證使用）
                this.state.gameState.easyModeHints.assignedAmount = assignedAmount;

                const amountText = assignedAmount.toLocaleString();
                missionText = `請存入 <strong style="color: white; font-size: 2.5rem;">${amountText} 元</strong>`;
                speechText = `您的任務是存入 ${this.convertAmountToSpeech(assignedAmount)}`;
            } else if (sessionType === 'inquiry') {
                missionText = `請完成 <strong style="color: #FFFFFF; font-size: 2.5rem;">餘額查詢</strong> 操作`;
                speechText = `您的任務是查詢帳戶餘額`;
            } else if (sessionType === 'transfer') {
                // 🔧 [新增] 指定轉帳：隨機選擇銀行和金額
                // 常用銀行代碼列表
                const bankCodes = [
                    '004', '005', '006', '007', '008', '009',  // 公股銀行
                    '011', '012', '013', '017', '050', '053',  // 其他公股/老牌銀行
                    '700',                                      // 郵局
                    '803', '805', '806', '807', '808', '809',  // 民營銀行
                    '810', '812', '822'                        // 其他民營銀行
                ];

                // 🆕 避免與上一輪重複（銀行代碼）
                const lastTask = this.state.gameState.lastAssignedTask;
                if (lastTask && lastTask.type === 'transfer' && bankCodes.length > 1) {
                    const availableBankCodes = bankCodes.filter(code => code !== lastTask.bankCode);
                    if (availableBankCodes.length > 0) {
                        assignedBankCode = availableBankCodes[Math.floor(Math.random() * availableBankCodes.length)];
                        ATM.Debug.log('flow', `🎯 [防重複-轉帳銀行] 排除上一輪: ${lastTask.bankCode}, 選擇新值: ${assignedBankCode}`);
                    } else {
                        assignedBankCode = bankCodes[Math.floor(Math.random() * bankCodes.length)];
                    }
                } else {
                    assignedBankCode = bankCodes[Math.floor(Math.random() * bankCodes.length)];
                }
                assignedBankName = this.getBankNameByCode(assignedBankCode);

                // 隨機金額（1000-10000，都是1000的倍數）
                const transferAmounts = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
                // 確保轉帳金額低於帳戶餘額
                const currentBalance = this.state.gameState.accountBalance;
                const validAmounts = transferAmounts.filter(amt => amt < currentBalance);

                // 🆕 避免與上一輪重複（轉帳金額）
                if (validAmounts.length > 0) {
                    if (lastTask && lastTask.type === 'transfer' && validAmounts.length > 1) {
                        const availableAmounts = validAmounts.filter(amt => amt !== lastTask.amount);
                        if (availableAmounts.length > 0) {
                            assignedAmount = availableAmounts[Math.floor(Math.random() * availableAmounts.length)];
                            ATM.Debug.log('flow', `🎯 [防重複-轉帳金額] 排除上一輪: ${lastTask.amount}元, 選擇新值: ${assignedAmount}元`);
                        } else {
                            assignedAmount = validAmounts[Math.floor(Math.random() * validAmounts.length)];
                        }
                    } else {
                        assignedAmount = validAmounts[Math.floor(Math.random() * validAmounts.length)];
                    }
                } else {
                    assignedAmount = 1000;  // 最低金額
                }

                // 儲存到狀態中（供後續驗證使用）
                this.state.gameState.easyModeHints.assignedBankCode = assignedBankCode;
                this.state.gameState.easyModeHints.assignedBankName = assignedBankName;
                this.state.gameState.easyModeHints.assignedAmount = assignedAmount;

                const amountText = assignedAmount.toLocaleString();
                missionText = `請轉帳至 <strong style="color: #fbbf24; font-size: 2rem;">${assignedBankName} (${assignedBankCode})</strong><br>
                              轉帳金額 <strong style="color: white; font-size: 2.5rem;">${amountText} 元</strong>`;
                speechText = `您的任務是轉帳 ${this.convertAmountToSpeech(assignedAmount)} 至 ${assignedBankName}`;
            }

            // 🆕 保存本輪任務供下一輪比較
            this.state.gameState.lastAssignedTask = {
                type: sessionType,
                amount: assignedAmount,
                bankCode: assignedBankCode  // transfer 專用
            };

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

                    /* 任務畫面佔滿整個視窗 */
                    .mission-screen {
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

                    .mission-content {
                        max-width: 700px;
                        padding: 3rem;
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                        animation: fadeInScale 1s ease-out;
                    }

                    .mission-title {
                        font-size: 3rem;
                        margin-bottom: 2rem;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                    }

                    .mission-task {
                        font-size: 1.5rem;
                        margin-bottom: 2rem;
                        line-height: 1.6;
                    }

                    .mission-hint {
                        font-size: 1.2rem;
                        color: rgba(255, 255, 255, 0.9);
                        margin-top: 1rem;
                    }

                    /* 響應式調整 */
                    @media (max-width: 768px) {
                        .mission-title {
                            font-size: 2rem;
                        }
                        .mission-task {
                            font-size: 1.2rem;
                        }
                        .mission-hint {
                            font-size: 1rem;
                        }
                    }
                </style>

                <div class="mission-screen">
                    <div class="mission-content">
                        <h1 class="mission-title">🎯 您的任務</h1>
                        <div class="mission-task">
                            ${missionText}
                        </div>
                        ${sessionType === 'withdraw' ? `
                            <div class="mission-hint">
                                💡 提示：待會選擇金額時，請輸入 ${assignedAmount.toLocaleString()} 元
                            </div>
                        ` : ''}
                        ${sessionType === 'deposit' ? `
                            <div class="mission-hint">
                                💡 提示：待會點擊現金出口時，請存入 ${assignedAmount.toLocaleString()} 元
                            </div>
                        ` : ''}
                        ${sessionType === 'transfer' ? `
                            <div class="mission-hint">
                                💡 提示：請轉帳至 ${assignedBankName}，銀行代碼 ${assignedBankCode}<br>
                                轉帳金額 ${assignedAmount.toLocaleString()} 元
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            // 播放語音，window.setTimeout 確保一定前進
            {
                let _gone = false;
                const _next = () => { if (_gone) return; _gone = true; window.setTimeout(() => this.startATMSession(), 300); };
                this.speech.speak(speechText, { callback: _next });
                window.setTimeout(_next, 4000);
                document.querySelector('.mission-screen')?.addEventListener('click', _next, { once: true });
            }
        },

        /**
         * 🎮 開始 ATM 操作階段
         * 從任務畫面進入實際的 ATM 界面
         */
        startATMSession() {
            ATM.Debug.log('flow', '🎮 開始 ATM 操作階段');

            // 進入ATM界面
            this.state.gameState.currentScene = 'atm-interface';
            this.showATMInterface();

            // 播放操作提示語音
            const { difficulty } = this.state.settings;
            const sessionType = this.getActualSessionType();

            const sessionNames = {
                withdraw: '提款',
                deposit: '存款',
                inquiry: '查詢',
                transfer: '轉帳'
            };

            const sessionName = sessionNames[sessionType] || 'ATM';
            let guideText = '';

            if (sessionType === 'free') {
                guideText = '現在開始ATM操作';
            } else if (difficulty === 'easy') {
                guideText = `現在開始${sessionName}操作，系統會提供詳細的操作指導`;
            } else if (difficulty === 'normal') {
                guideText = `現在開始${sessionName}操作，請根據提示完成任務`;
            } else if (difficulty === 'hard') {
                guideText = `現在開始${sessionName}操作，請完成指定任務`;
            }

            ATM.Debug.log('speech', '🎙️ 播放操作指導語音:', guideText);

            this.speech.speak(guideText, {
                interrupt: true,
                callback: () => {
                    ATM.Debug.log('speech', '🎙️ 操作指導語音完成，開始第一個場景');
                    this.startFirstScenario();
                }
            });
        },

        startLearning() {
            ATM.Debug.log('flow', '🎯 開始ATM學習，解鎖音頻並初始化遊戲狀態');

            // 🔧 [Phase 5] 清除所有計時器（開始新遊戲時清除殘留計時器）
            this.TimerManager.clearAll();

            // 解鎖音頻
            this.unlockAudio();

            // 🔧 [修正] 重置關鍵遊戲狀態，避免上一輪狀態殘留
            this.state.gameState.cardInserted = false;
            this.state.gameState.pinAttempts = 0;
            this.state.gameState.currentPin = '';
            this.state.gameState.transactionAmount = 0;
            this.state.gameState.isProcessing = false;
            this.state.gameState.showingModal = false;
            this.state.gameState.currentScene = null;
            if (window.TutorContext) {
                TutorContext.reset();
                TutorContext.update({ screen: 'game', phase: 'selectItem', difficulty: this.state.settings.difficulty, totalQuestions: this.state.settings.questionCount, questionIndex: 0 });
                const _atm = this;
                TutorContext.getLiveData = () => {
                    const gs = _atm.state.gameState;
                    return {
                        sessionType:   _atm.getActualSessionType?.() || _atm.state.settings.sessionType,
                        targetAmount:  gs.targetAmount  ?? null,
                        inputAmount:   gs.transactionAmount ?? 0,
                    };
                };
            }
            this.state.gameState.currentStep = 0;
            this.state.gameState.currentFlowStep = null;
            this.state.gameState.isSubFlowActive = false;
            this.state.gameState.transfer = {
                bankCode: '',
                bankName: '',
                accountNumber: '',
                amount: 0
            };
            this.state.gameState.easyModeHints = {
                enabled: false,
                currentStep: null,
                highlightedElement: null,
                assignedAmount: null,
                assignedBankCode: null,
                assignedBankName: null,
                assignedAccountNumber: null,
                pinInputProgress: 0,
                assignedReceiptOption: null,
                delayedHintTimer: null,
                delayedHintData: null
            };

            // 🔧 [重構] 使用統一重置函數（普通/困難模式）
            if (this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard') {
                this.resetNormalModeState();
            }

            // 產生隨機8位數帳號
            const randomAccountNumber = Math.floor(10000000 + Math.random() * 90000000).toString();

            // 🔧 [新增] 簡單模式下，設定帳戶餘額為1000-60000之間的隨機值
            if (this.state.settings.difficulty === 'easy') {
                // 隨機產生1000-60000之間的金額（以1000為單位）
                const minBalance = 1000;
                const maxBalance = 60000;
                const randomBalance = Math.floor(Math.random() * ((maxBalance - minBalance) / 1000 + 1)) * 1000 + minBalance;
                this.state.gameState.accountBalance = randomBalance;
                ATM.Debug.log('flow', `🎯 [簡單模式] 自動設定帳戶餘額為: ${randomBalance}`);
            } else {
                // 其他模式使用自訂金額
                this.state.gameState.accountBalance = this.state.settings.customBalance;
            }

            // 同步自訂設定到遊戲狀態
            this.state.gameState.correctPin = this.state.settings.customPassword;
            this.state.gameState.accountNumber = randomAccountNumber;  // 使用隨機帳號

            // 初始化測驗狀態
            this.state.quiz.currentQuestion = 0;
            this.state.quiz.score = 0;
            this.state.quiz.startTime = Date.now();
            this.state.quiz.completedTransactions = [];

            // 隨機模式：重設 bag 並抽第一輪類型
            if (this.state.settings.sessionType === 'random') {
                this.state.quiz.randomBag = [];
                this.state.quiz.currentRandomType = null;
                this.pickNextRandomType();
            }

            // 如果是簡單模式且啟用輔助點擊模式
            if (this.state.settings.difficulty === 'easy' &&
                this.state.settings.clickMode) {
                ATM.Debug.log('assist', '[ClickMode] 偵測到輔助點擊模式，準備初始化');
                // 初始化輔助點擊模式（延遲至顯示插卡畫面時執行）
                // initClickModeForATM() 將在 showCardInsertScreen() 中調用
            }

            // ✅ 顯示歡迎畫面（參考 A5 架構）
            this.showWelcomeScreen();
        },

        // =====================================================
        // ATM界面顯示
        // =====================================================
        showATMInterface() {
            const app = document.getElementById('app');
            app.innerHTML = this.generateATMInterface();

            // 綁定ATM界面事件
            this.bindATMEvents();

            // 💡 [新增] 普通/困難模式顯示提示按鈕
            this.showHintButton();

            // 初始化螢幕內容
            this.updateScreen('welcome');
        },

        bindATMEvents() {
            // 數字鍵盤已移至螢幕內，事件綁定在各畫面生成時處理
            
            // 綁定卡片插槽事件
            document.getElementById('card-slot').addEventListener('click', this.handleCardSlotClick.bind(this));
            
            // 綁定金融卡點擊事件
            document.getElementById('atm-card').addEventListener('click', this.handleCardClick.bind(this));
        },

        // =====================================================
        // 🔧 [新增] 標題列更新功能
        // =====================================================
        updateTitleBar(step, stepTitle) {
            const stepTitleElement = document.getElementById('atm-step-title');
            const progressInfoElement = document.getElementById('atm-progress-info');

            if (stepTitleElement) {
                stepTitleElement.textContent = stepTitle;
            }

            if (progressInfoElement) {
                const totalSteps = this.getActualSessionType() === 'transfer' ? 8 : 5;
                progressInfoElement.textContent = `步驟 ${step} / ${totalSteps}`;
            }
        },

        // =====================================================
        // 🔍 [除錯工具] 版面高度偵測功能
        // =====================================================
        debugLayoutHeights(screenType) {
            if (!ATM.Debug.FLAGS.all && !ATM.Debug.FLAGS.ui) return;
            // 取得所有關鍵區域的元素
            const elements = {
                upperSection: document.querySelector('.atm-upper-section'),
                cardSection: document.querySelector('.card-section'),
                screenSection: document.querySelector('.screen-section'),
                receiptSection: document.querySelector('.receipt-section'),
                screenContent: document.getElementById('screen-content'),
                menuGrid: document.querySelector('.menu-options-grid'),
                amountGrid: document.querySelector('.amount-options-grid')
            };

            // 準備輸出資料
            const heightData = {};
            let hasAnyElement = false;

            for (const [key, element] of Object.entries(elements)) {
                if (element) {
                    hasAnyElement = true;
                    const styles = window.getComputedStyle(element);
                    heightData[key] = {
                        offsetHeight: element.offsetHeight,
                        clientHeight: element.clientHeight,
                        scrollHeight: element.scrollHeight,
                        minHeight: styles.minHeight,
                        height: styles.height,
                        maxHeight: styles.maxHeight
                    };
                }
            }

            // 只有在至少有一個元素存在時才輸出
            if (!hasAnyElement) {
                console.log('%c🔍 [版面偵測] DOM 元素尚未完全載入', 'color: #999; font-weight: bold;');
                return;
            }

            // 根據場景類型使用不同的顏色標記
            const sceneColors = {
                'menu': '#ff6b6b',           // 紅色 - 選單畫面（問題場景）
                'amount-entry': '#51cf66',   // 綠色 - 金額輸入
                'complete': '#4dabf7',       // 藍色 - 完成畫面
                'default': '#ffd43b'         // 黃色 - 其他畫面
            };
            const color = sceneColors[screenType] || sceneColors['default'];

            console.log(`%c╔═══════════════════════════════════════════════════════════════╗`, `color: ${color}; font-weight: bold;`);
            console.log(`%c║ 🔍 版面高度偵測 - 場景: ${screenType.padEnd(38)} ║`, `color: ${color}; font-weight: bold;`);
            console.log(`%c╠═══════════════════════════════════════════════════════════════╣`, `color: ${color}; font-weight: bold;`);

            // 輸出各區域高度 - 直接顯示數值避免被 mobile-debug-panel 攔截
            for (const [key, data] of Object.entries(heightData)) {
                const summary = `offsetH:${data.offsetHeight}px clientH:${data.clientHeight}px minH:${data.minHeight} H:${data.height}`;
                console.log(`%c║ ${key.padEnd(20)}: ${summary}`, `color: ${color};`);
            }

            console.log(`%c╚═══════════════════════════════════════════════════════════════╝`, `color: ${color}; font-weight: bold;`);

            // 🚨 特別檢查：如果是選單畫面，檢查是否有高度異常
            if (screenType === 'menu') {
                const cardHeight = heightData.cardSection?.offsetHeight || 0;
                const screenHeight = heightData.screenSection?.offsetHeight || 0;
                const receiptHeight = heightData.receiptSection?.offsetHeight || 0;

                if (cardHeight !== screenHeight || screenHeight !== receiptHeight) {
                    console.warn(`%c⚠️ [版面警告] 三個區域高度不一致！`, 'color: #ff6b6b; font-weight: bold; font-size: 14px;');
                    console.warn(`   卡片區: ${cardHeight}px | 螢幕區: ${screenHeight}px | 收據區: ${receiptHeight}px`);
                }

                if (heightData.menuGrid) {
                    const menuGridHeight = heightData.menuGrid.offsetHeight;
                    console.log(`%c📊 選單網格高度: ${menuGridHeight}px (height: ${heightData.menuGrid.height})`, 'color: #ff6b6b; font-weight: bold;');
                }
            }
        },

        // =====================================================
        // ATM螢幕內容更新
        // =====================================================
        updateScreen(screenType, data = {}) {
            const screenContent = document.getElementById('screen-content');
            
            // 檢查DOM元素是否存在
            if (!screenContent) {
                ATM.Debug.error('[A5-ATM錯誤] screen-content元素不存在，可能DOM未完全載入');
                // 嘗試延遲執行
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => this.updateScreen(screenType, data), 100, 'screenTransition');
                return;
            }
            
            switch (screenType) {
                case 'welcome':
                    screenContent.innerHTML = this.generateWelcomeScreen();
                    this.updateTitleBar(1, '歡迎使用');
                    // 🔧 [移除] 不再需要語言選擇
                    // this.bindLanguageSelectionEvents();
                    break;
                case 'insert-card':
                    screenContent.innerHTML = this.generateInsertCardScreen();
                    this.updateTitleBar(1, '插入金融卡');
                    // 🔧 [新增] 在卡片下方添加「插入卡片」按鈕
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.addInsertCardButton();
                    }, 100, 'screenTransition');
                    break;
                case 'card-reading':
                    screenContent.innerHTML = this.generateCardReadingScreen();
                    this.updateTitleBar(1, '讀取卡片資料');
                    break;
                case 'pin-entry':
                    screenContent.innerHTML = this.generatePinEntryScreen(data);
                    this.updateTitleBar(2, '輸入密碼');
                    this.bindScreenKeypadEvents();
                    break;
                case 'menu':
                    screenContent.innerHTML = this.generateMenuScreen();
                    this.updateTitleBar(3, '選擇功能');
                    this.bindSideLabelEvents();

                    // 🔧 [修正] 立即設置提示數據（在語音播放前），避免用戶點擊提示鈕時顯示舊數據
                    const sessionType = this.getActualSessionType();
                    let selector = '';

                    if (sessionType === 'withdraw') {
                        selector = '.side-label[data-action="right-1"]'; // 提款
                    } else if (sessionType === 'deposit') {
                        selector = '.side-label[data-action="right-2"]'; // 存款
                    } else if (sessionType === 'inquiry') {
                        selector = '.side-label[data-action="right-3"]'; // 查詢
                    } else if (sessionType === 'transfer') {
                        selector = '.side-label[data-action="right-4"]'; // 轉帳
                    }

                    if (selector) {
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            // 確認仍在選單畫面且沒有子流程進行中
                            if (this.state.gameState.currentScene === 'menu' &&
                                !this.state.gameState.isSubFlowActive) {
                                this.showATMEasyHint('select_service', selector);
                                ATM.Debug.log('hint', `💛 設置${this.getSessionTypeName(sessionType)}選項提示數據`);
                            }
                        }, 300, 'screenTransition');
                    }

                    // 🔧 [修正] 只有在沒有子流程進行中時才播放語音
                    if (!this.state.gameState.isSubFlowActive) {
                        this.speech.speak('請選擇服務項目');
                    }
                    break;
                case 'amount-entry':
                    screenContent.innerHTML = this.generateAmountEntryScreen(data);
                    this.updateTitleBar(4, '輸入金額');
                    if (data.showKeypad) {
                        this.bindScreenKeypadEvents();
                    } else {
                        this.bindAmountOptionEvents();
                    }
                    break;
                case 'processing':
                    screenContent.innerHTML = this.generateProcessingScreen();
                    this.updateTitleBar(5, '處理交易');
                    break;
                case 'cash-dispensing':
                    screenContent.innerHTML = this.generateCashDispensingScreen();
                    this.updateTitleBar(5, '發鈔中');
                    break;
                case 'complete':
                    screenContent.innerHTML = this.generateCompleteScreen(data);
                    this.updateTitleBar(5, '交易完成');
                    break;
                case 'continue-transaction':
                    screenContent.innerHTML = this.generateContinueTransactionScreen();
                    this.updateTitleBar(5, '繼續交易？');
                    this.bindContinueTransactionEvents();
                    break;
                case 'continue-transaction-question':
                    screenContent.innerHTML = this.generateContinueTransactionQuestionScreen();
                    this.updateTitleBar(5, '列印明細表');
                    this.bindContinueTransactionQuestionEvents();
                    break;
                case 'card-eject':
                    screenContent.innerHTML = this.generateCardEjectScreen();
                    this.updateTitleBar(5, '取回卡片');
                    break;
                case 'card-eject-end':
                    screenContent.innerHTML = this.generateCardEjectEndScreen();
                    this.updateTitleBar(5, '交易結束');
                    // 播放交易結束語音
                    this.speech.speak('交易結束，請取回金融卡');
                    break;
                case 'take-cash':
                    screenContent.innerHTML = this.generateTakeCashScreen();
                    this.updateTitleBar(5, '收取現金');
                    break;
                case 'take-cash-with-message':
                    screenContent.innerHTML = this.generateTakeCashScreenWithMessage();
                    this.updateTitleBar(5, '收取現金');
                    break;
                case 'printing':
                    screenContent.innerHTML = this.generatePrintingScreen();
                    this.updateTitleBar(5, '列印中');
                    break;
                case 'final-complete':
                    if (window.TutorContext) TutorContext.update({ screen: 'result' });
                    screenContent.innerHTML = this.generateFinalCompleteScreen();
                    this.updateTitleBar(5, '交易完成');
                    break;
                case 'thank-you':
                    screenContent.innerHTML = this.generateThankYouScreen();
                    this.updateTitleBar(5, '謝謝惠顧');
                    break;
                case 'receipt-options':
                    screenContent.innerHTML = this.generateReceiptOptionsScreen();
                    this.updateTitleBar(5, '列印明細表');
                    // 播放列印明細表選項語音
                    this.speech.speak('請選擇是否需要列印交易明細表', {
                        callback: () => {
                            // ✅ 簡單模式：顯示收據選項提示（隨機選擇印或不印）
                            if (this.state.settings.difficulty === 'easy') {
                                // 如果尚未指定收據選項，隨機選擇一個
                                if (!this.state.gameState.easyModeHints.assignedReceiptOption) {
                                    this.state.gameState.easyModeHints.assignedReceiptOption = Math.random() < 0.5 ? 'print' : 'no-print';
                                }

                                const option = this.state.gameState.easyModeHints.assignedReceiptOption;
                                const selector = option === 'print' ? '.print-btn' : '.no-print-btn';

                                // 🔧 [Phase 3] 遷移至 TimerManager
                                this.TimerManager.setTimeout(() => {
                                    this.showATMEasyHint('receipt_option', selector);
                                    ATM.Debug.log('hint', `💛 顯示收據選項提示: ${option === 'print' ? '列印' : '不列印'}`);
                                }, 500, 'hintAnimation');
                            }
                        }
                    });
                    this.bindReceiptOptionEvents();
                    break;
                case 'receipt-important-notice':
                    screenContent.innerHTML = this.generateReceiptImportantNotice();
                    this.updateTitleBar(5, '重要憑證提醒');
                    break;
                case 'screen-receipt-display':
                    screenContent.innerHTML = this.generateScreenReceiptDisplay();
                    this.updateTitleBar(5, '交易明細表');
                    break;
                case 'transaction-success':
                    screenContent.innerHTML = this.generateTransactionSuccessScreen();
                    this.updateTitleBar(5, '交易成功');
                    this.bindTransactionSuccessEvents();
                    break;
                case 'take-card':
                    screenContent.innerHTML = this.generateTakeCardScreen();
                    this.updateTitleBar(5, '取回卡片');
                    break;
                case 'collect-cash':
                    screenContent.innerHTML = this.generateCollectCashScreen();
                    this.updateTitleBar(5, '收取現金');
                    break;
                case 'take-receipt':
                    screenContent.innerHTML = this.generateTakeReceiptScreen();
                    this.updateTitleBar(5, '收取明細表');
                    break;
                case 'final-transaction-complete':
                    screenContent.innerHTML = this.generateFinalTransactionCompleteScreen();
                    this.updateTitleBar(5, '交易完成');
                    break;
                case 'deposit-cash':
                    screenContent.innerHTML = this.generateDepositCashScreen();
                    this.updateTitleBar(4, '存入現鈔');
                    this.bindDepositCashEvents();
                    break;
                case 'deposit-counting':
                    screenContent.innerHTML = this.generateDepositCountingScreen();
                    this.updateTitleBar(5, '數鈔辨識中');
                    break;
                case 'deposit-confirm':
                    screenContent.innerHTML = this.generateDepositConfirmScreen();
                    this.updateTitleBar(5, '確認存入現鈔');
                    this.bindDepositConfirmEvents();
                    break;
                case 'error':
                    screenContent.innerHTML = this.generateErrorScreen(data);
                    this.updateTitleBar(0, '操作錯誤');
                    break;
            }

            // 🔍 [除錯] 延遲偵測高度，確保 DOM 更新完成（已停用）
            // setTimeout(() => {
            //     this.debugLayoutHeights(screenType);
            // }, 100);
        },
        
        
        // 綁定螢幕內側邊標籤事件
        bindSideLabelEvents() {
            // 🔧 [修正] 使用元素級別的標記，防止重複綁定，但允許新元素綁定
            document.querySelectorAll('.side-label').forEach(label => {
                // 如果已經綁定過，跳過
                if (label._eventBound) {
                    return;
                }
                label._eventBound = true;

                label.addEventListener('click', (event) => {
                    const action = event.target.dataset.action;

                    // ✅ [修改] 檢查子流程鎖定，若鎖定則直接返回
                    if (this.state.gameState.isSubFlowActive) {
                        ATM.Debug.warn('event', '⚠️ 子流程進行中，已鎖定並忽略主選單點擊');
                        this.speech.speak('請先完成目前的存款操作');
                        return;
                    }

                    // 🔧 [修正] 使用全局鎖定防止選單重複點擊
                    if (this._menuClickLock) {
                        ATM.Debug.warn('event', `⚠️ 選單已鎖定，忽略重複點擊: ${action}`);
                        return;
                    }

                    // 鎖定選單點擊，防止快速重複點擊
                    this._menuClickLock = true;
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this._menuClickLock = false;
                    }, 2000, 'uiLock');

                    this.audio.playBeep();

                    // 播放項目語音
                    switch (action) {
                        case 'right-1':
                            this.speech.speak('提款');
                            this.selectMenuOption('withdraw');
                            break;
                        case 'right-2':
                            this.speech.speak('存款');
                            this.selectMenuOption('deposit');
                            break;
                        case 'right-3':
                            this.speech.speak('查詢');
                            this.selectMenuOption('inquiry');
                            break;
                        case 'right-4':
                            this.speech.speak('轉帳');
                            this.selectMenuOption('transfer');
                            break;
                        case 'right-5':
                            this.speech.speak('結束');
                            this.selectMenuOption('exit');
                            break;
                    }
                });
            });
        },
        
        // 綁定螢幕內數字鍵盤事件
        bindScreenKeypadEvents() {
            // 🔧 [修正] 只綁定未綁定過事件的按鈕，避免重複綁定
            document.querySelectorAll('.screen-key-btn:not([data-bound])').forEach(btn => {
                // 標記按鈕已綁定事件
                btn.setAttribute('data-bound', 'true');

                btn.addEventListener('click', (event) => {
                    const key = event.target.dataset.key;

                    // 播放按鍵語音 - 只會播放一次
                    if (key >= '0' && key <= '9') {
                        // ✅ 簡單/普通/困難模式下,密碼輸入時不播放數字語音，只播放按鍵音效
                        if (!(this.state.gameState.currentScene === 'pin-entry')) {
                            this.speech.speak(key);
                        }
                    } else if (key === 'clear') {
                        this.speech.speak('清除');
                    } else if (key === 'enter') {
                        // ✅ 修改：密碼輸入畫面按確認時不播放語音，其他畫面才播放
                        if (this.state.gameState.currentScene !== 'pin-entry') {
                            this.speech.speak('確認');
                        }
                    } else if (key === 'cancel') {
                        this.speech.speak('取消');
                    }

                    this.handleKeyPress({ target: { dataset: { key } } });
                });
            });
        },
        
        // 綁定金額選項按鈕事件
        bindAmountOptionEvents() {
            document.querySelectorAll('.amount-option-btn').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    this.audio.playBeep();

                    const action = event.target.dataset.action;
                    const amount = event.target.dataset.amount;

                    // 🔧 [統一] 所有難度模式 + 指定提款（含隨機模式實際為提款）：驗證是否選擇了正確的金額
                    if (this.getActualSessionType() === 'withdraw' &&
                        this.state.gameState.easyModeHints.assignedAmount !== null) {

                        const assignedAmount = this.state.gameState.easyModeHints.assignedAmount;

                        // 判斷 assignedAmount 是否在預設金額列表中（冒險模式目標為 100~900，不在預設列表）
                        const _PRESET = [1000, 3000, 5000, 10000, 20000, 40000, 60000];
                        const needsCustomInput = !_PRESET.includes(assignedAmount);

                        // 判斷是否點擊了正確的選項
                        const isCorrect = needsCustomInput
                            ? action === 'custom'
                            : (amount && parseInt(amount) === assignedAmount);

                        if (!isCorrect) {
                            // 點擊了錯誤的選項
                            const clickedText = action === 'custom' ? '其他金額' : `NT$ ${parseInt(amount).toLocaleString()}`;
                            const correctText = needsCustomInput ? '其他金額' : `NT$ ${assignedAmount.toLocaleString()}`;
                            ATM.Debug.log('hint', `❌ [Amount] 選擇錯誤：點擊了 ${clickedText}，應該點擊 ${correctText}`);

                            // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後顯示提示
                            if (this.state.settings.difficulty === 'normal') {
                                this.state.gameState.normalModeErrors.withdrawAmountErrorCount++;
                                const errorCount = this.state.gameState.normalModeErrors.withdrawAmountErrorCount;
                                ATM.Debug.log('hint', `🔢 [Normal-Mode] 提款金額選擇錯誤次數: ${errorCount}`);
                            }

                            // 播放錯誤音效
                            const errorAudio = new Audio('../audio/units/error.mp3');
                            errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                            // 延遲後設置提示數據並播放語音（困難模式不播放語音）
                            // 🔧 [Phase 3] 遷移至 TimerManager
                            const hintSelector = needsCustomInput
                                ? '.amount-option-btn[data-action="custom"]'
                                : `.amount-option-btn[data-amount="${assignedAmount}"]`;
                            this.TimerManager.setTimeout(() => {
                                // 🔧 [修改] 普通模式：錯誤3次後立即顯示提示
                                if (this.state.settings.difficulty === 'normal' &&
                                    this.state.gameState.normalModeErrors.withdrawAmountErrorCount >= 3) {
                                    ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，立即顯示提示動畫在正確選項上`);
                                    this.showATMEasyHint('select_amount', hintSelector, true);
                                } else {
                                    // 設置提示數據（不強制立即顯示）
                                    this.showATMEasyHint('select_amount', hintSelector);
                                }

                                // 困難模式不播放語音提示
                                if (this.shouldShowHint()) {
                                    // 🔧 [Phase 3] 遷移至 TimerManager
                                    this.TimerManager.setTimeout(() => {
                                        const speechText = needsCustomInput ? '其他金額，自行輸入' : this.convertAmountToSpeech(assignedAmount);
                                        this.speech.speak(`請選擇 ${speechText}`);
                                    }, 300, 'speechDelay');
                                }
                            }, 300, 'hintAnimation');

                            return; // 阻止繼續執行
                        }

                        // 🔧 [新增] 普通模式：選擇正確後重置錯誤計數
                        if (this.state.settings.difficulty === 'normal') {
                            this.state.gameState.normalModeErrors.withdrawAmountErrorCount = 0;
                        }

                        // 選擇了正確的金額，清除提示
                        ATM.Debug.log('hint', `✅ [Amount] 選擇正確：${amount}`);
                        this.clearATMEasyHint();
                    }

                    // 移除所有按鈕的選中狀態
                    document.querySelectorAll('.amount-option-btn').forEach(b => {
                        b.style.background = '';
                        b.style.borderColor = '';
                        b.style.color = '';
                    });

                    // 為點擊的按鈕添加黃色選中狀態（持續保持）
                    const clickedBtn = event.target;
                    clickedBtn.style.background = 'rgba(255, 193, 7, 0.4)';
                    clickedBtn.style.borderColor = 'rgba(255, 193, 7, 0.7)';
                    clickedBtn.style.color = '#fff9c4';

                    if (action === 'custom') {
                        this.speech.speak('其他金額');
                        // 選擇其他金額，顯示數字鍵盤
                        this.state.gameState.transactionAmount = 0;
                        this.updateScreen('amount-entry', {
                            showKeypad: true,
                            currentAmount: 0
                        });
                    } else if (amount) {
                        // 播放金額語音，完成後再進入處理流程
                        const amountValue = parseInt(amount);
                        const amountText = this.convertAmountToSpeech(amountValue);
                        this.state.gameState.transactionAmount = amountValue;

                        this.speech.speak(amountText, {
                            callback: () => {
                                // 金額語音播放完畢後，進入處理流程，標記已播放過金額語音
                                this.processTransaction(true); // 傳入參數表示已播放過金額語音
                            }
                        });
                    }
                });
            });
        },

        // 綁定繼續交易選項事件
        bindContinueTransactionEvents() {
            document.querySelectorAll('.option-btn').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    this.audio.playBeep();
                    
                    const action = event.target.dataset.action;
                    const buttonText = event.target.textContent.trim();
                    
                    // 播放按鈕文字語音
                    if (buttonText.includes('繼續')) {
                        this.speech.speak('繼續');
                    } else if (buttonText.includes('結束')) {
                        this.speech.speak('結束交易');
                    }
                    
                    switch (action) {
                        case 'continue':
                            this.handleContinueTransaction();
                            break;
                        case 'finish':
                            this.handleFinishTransaction();
                            break;
                    }
                });
            });
        },

        // 綁定列印明細表選項事件
        bindReceiptOptionEvents() {
            document.querySelectorAll('.option-btn').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    const action = event.target.dataset.action;
                    const buttonText = event.target.textContent.trim();

                    // 🔧 [修正] 簡單/普通模式：驗證是否選擇了正確的選項
                    // 簡單模式：立即檢查，立即顯示提示
                    // 普通模式：立即檢查，但提示延遲10秒顯示
                    if (this.shouldShowHint() &&
                        this.state.gameState.easyModeHints.assignedReceiptOption) {
                        const expectedOption = this.state.gameState.easyModeHints.assignedReceiptOption;

                        if (action !== expectedOption) {
                            // 選擇了錯誤的選項
                            ATM.Debug.log('hint', `❌ 收據選項錯誤：選擇了 ${action}，應該選擇 ${expectedOption}`);

                            // 播放錯誤音效
                            const errorAudio = new Audio('../audio/units/error.mp3');
                            errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                            // 播放語音提示
                            // 🔧 [Phase 3] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                const optionText = expectedOption === 'print' ? '列印明細表' : '不列印';
                                this.speech.speak(`請選擇 ${optionText}`);
                            }, 300, 'speechDelay');

                            return; // 阻止繼續執行
                        }

                        // 選擇了正確的選項，清除提示
                        ATM.Debug.log('hint', `✅ 收據選項正確：${action}`);
                        this.clearATMEasyHint();
                    }

                    this.audio.playBeep();

                    // 播放按鈕文字語音
                    if (buttonText.includes('列印') || buttonText.includes('印明細表')) {
                        this.speech.speak('列印明細表');
                    } else if (buttonText.includes('不印') || buttonText.includes('不要')) {
                        this.speech.speak('不列印');
                    } else if (buttonText.includes('螢幕顯示')) {
                        this.speech.speak('螢幕顯示');
                    }

                    switch (action) {
                        case 'print':
                            // 🔧 [修正] 存款/查詢/轉帳：使用新流程（先取卡後列印）
                            if (this.state.settings.sessionType === 'deposit' ||
                                this.state.settings.sessionType === 'inquiry' ||
                                this.state.settings.sessionType === 'transfer') {
                                this.handlePrintReceiptNewFlow();
                            } else {
                                // 提款：使用舊流程
                                this.handlePrintReceipt();
                            }
                            break;
                        case 'no-print':
                            // 🔧 [修正] 存款/查詢/轉帳：使用新流程（先取卡後顯示明細）
                            if (this.state.settings.sessionType === 'deposit' ||
                                this.state.settings.sessionType === 'inquiry' ||
                                this.state.settings.sessionType === 'transfer') {
                                this.handleNoPrintReceiptNewFlow();
                            } else {
                                // 提款：使用舊流程
                                this.handleNoPrintReceipt();
                            }
                            break;
                        case 'screen-display':
                            this.handleScreenDisplay();
                            break;
                    }
                });
            });
        },

        // 處理螢幕顯示完整資訊
        handleScreenDisplay() {
            const accountNumber = this.state.gameState.accountNumber;
            const balance = this.state.gameState.accountBalance;
            const amount = this.state.gameState.transactionAmount;
            const transfer = this.state.gameState.transfer || {};
            const transferAccount = transfer.accountNumber || '';

            ATM.Debug.log('ui', `🔍 [螢幕顯示] 開始更新 - 帳號: ${accountNumber}, 餘額: ${balance}, 金額: ${amount}, 轉入帳號: ${transferAccount}`);

            // 🔧 [修正] 更新所有帳號、餘額、金額和轉入帳號元素
            const displayAccounts = document.querySelectorAll('[id="display-account"]');
            const displayBalances = document.querySelectorAll('[id="display-balance"]');
            const displayAmounts = document.querySelectorAll('[id="display-amount"]');
            const displayTransferAccounts = document.querySelectorAll('[id="display-transfer-account"]');

            ATM.Debug.log('ui', `🔍 [螢幕顯示] 找到 ${displayAccounts.length} 個帳號元素`);
            ATM.Debug.log('ui', `🔍 [螢幕顯示] 找到 ${displayBalances.length} 個餘額元素`);
            ATM.Debug.log('ui', `🔍 [螢幕顯示] 找到 ${displayAmounts.length} 個金額元素`);
            ATM.Debug.log('ui', `🔍 [螢幕顯示] 找到 ${displayTransferAccounts.length} 個轉入帳號元素`);

            // 更新所有帳號顯示元素
            displayAccounts.forEach((element, index) => {
                if (element) {
                    const oldText = element.textContent;
                    element.textContent = accountNumber;
                    element.style.color = '#4ade80'; // 改變顏色表示已顯示

                    // 🎯 [新增] 將對應的標籤文字也變成綠色
                    const parent = element.closest('div[style*="flex-direction: column"]');
                    if (parent) {
                        const label = parent.querySelector('span:first-child');
                        if (label && (label.textContent.includes('交易帳號') || label.textContent.includes('轉出帳號'))) {
                            label.style.color = '#4ade80';
                            ATM.Debug.log('ui', `✅ [螢幕顯示] 標籤也變綠色: "${label.textContent}"`);
                        }
                    }

                    ATM.Debug.log('ui', `✅ [螢幕顯示] 更新帳號元素 #${index + 1}: "${oldText}" → "${accountNumber}"`);
                }
            });

            // 更新所有餘額顯示元素
            displayBalances.forEach((element, index) => {
                if (element) {
                    const oldText = element.textContent;
                    element.textContent = 'NT$ ' + balance.toLocaleString();
                    element.style.color = '#4ade80'; // 改變顏色表示已顯示

                    // 🎯 [新增] 將對應的標籤文字也變成綠色
                    const parent = element.closest('div[style*="flex-direction: column"]');
                    if (parent) {
                        const label = parent.querySelector('span:first-child');
                        if (label && label.textContent.includes('帳戶餘額')) {
                            label.style.color = '#4ade80';
                            ATM.Debug.log('ui', `✅ [螢幕顯示] 標籤也變綠色: "${label.textContent}"`);
                        }
                    }

                    ATM.Debug.log('ui', `✅ [螢幕顯示] 更新餘額元素 #${index + 1}: "${oldText}" → "NT$ ${balance.toLocaleString()}"`);
                }
            });

            // 🔧 [新增] 更新所有交易金額顯示元素（僅餘額查詢時需要）
            displayAmounts.forEach((element, index) => {
                if (element) {
                    const oldText = element.textContent;
                    element.textContent = 'NT$ ' + amount.toLocaleString();
                    element.style.color = '#4ade80'; // 改變顏色表示已顯示

                    // 🎯 [新增] 將對應的標籤文字也變成綠色
                    const parent = element.closest('div[style*="flex-direction: column"]');
                    if (parent) {
                        const label = parent.querySelector('span:first-child');
                        if (label && label.textContent.includes('交易金額')) {
                            label.style.color = '#4ade80';
                            ATM.Debug.log('ui', `✅ [螢幕顯示] 標籤也變綠色: "${label.textContent}"`);
                        }
                    }

                    ATM.Debug.log('ui', `✅ [螢幕顯示] 更新金額元素 #${index + 1}: "${oldText}" → "NT$ ${amount.toLocaleString()}"`);
                }
            });

            // 🔧 [新增] 更新所有轉入帳號顯示元素（僅轉帳時需要）
            displayTransferAccounts.forEach((element, index) => {
                if (element && transferAccount) {
                    const oldText = element.textContent;
                    element.textContent = transferAccount;
                    element.style.color = '#4ade80'; // 改變顏色表示已顯示

                    // 🎯 [新增] 將對應的標籤文字也變成綠色
                    const parent = element.closest('div[style*="flex-direction: column"]');
                    if (parent) {
                        const label = parent.querySelector('span:first-child');
                        if (label && label.textContent.includes('轉入帳號')) {
                            label.style.color = '#4ade80';
                            ATM.Debug.log('ui', `✅ [螢幕顯示] 標籤也變綠色: "${label.textContent}"`);
                        }
                    }

                    ATM.Debug.log('ui', `✅ [螢幕顯示] 更新轉入帳號元素 #${index + 1}: "${oldText}" → "${transferAccount}"`);
                }
            });

            // 播放語音提示
            this.speech.speak('已在螢幕顯示完整資訊', {
                callback: () => {
                    ATM.Debug.log('flow', ' 完整資訊已顯示');
                }
            });
        },

        // 綁定語言選擇事件
        bindLanguageSelectionEvents() {
            document.querySelectorAll('.language-btn').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    this.audio.playBeep();
                    
                    const lang = event.target.dataset.lang;
                    const buttonText = event.target.textContent.trim();
                    
                    // 先播放按鈕文字語音
                    this.speech.speak(buttonText);
                    
                    this.state.settings.language = lang;
                    
                    // 更新按鈕狀態
                    document.querySelectorAll('.language-btn').forEach(b => b.classList.remove('active'));
                    event.target.classList.add('active');
                    
                    // 再播放選擇確認語音
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        const message = lang === 'chinese' ? '已選擇中文' : 'Chinese language selected';
                        this.speech.speak(message);
                    }, 1000, 'speechDelay');
                });
            });
        },

        generateWelcomeScreen() {
            return `
                <div class="screen-welcome">
                    <div class="atm-logo">🏦</div>
                    <h2 style="color: white;">歡迎使用ATM</h2>
                    <p class="welcome-message" style="margin-top: 30px;">請插入您的金融卡</p>
                    <div class="blinking-arrow">💳</div>
                    <div class="service-hours">
                        <small>24小時服務</small>
                    </div>
                </div>
            `;
        },

        generateInsertCardScreen() {
            return `
                <div class="screen-insert-card">
                    <div class="instruction-icon" style="font-size: 2.5em; margin-bottom: 20px;">💳</div>
                    <h2 style="color: white;">請插入金融卡</h2>
                    <div class="card-animation">
                        <div class="card-graphic"></div>
                    </div>
                    <p class="instruction-text" style="color: #ffd700;">請將金融卡插入上方卡槽</p>
                </div>
            `;
        },

        // 🔧 [新增] 卡片資料讀取畫面
        generateCardReadingScreen() {
            return `
                <div class="screen-card-reading">
                    <div class="reading-icon" style="font-size: 2.5em; margin-bottom: 20px;">📖</div>
                    <h2 style="color: white;">卡片資料讀取中，請稍候</h2>
                    <div class="reading-animation">
                        <div class="reading-spinner"></div>
                        <div class="reading-progress">
                            <div class="reading-bar"></div>
                        </div>
                    </div>
                    <div class="reading-dots">
                        <span class="dot">●</span>
                        <span class="dot">●</span>
                        <span class="dot">●</span>
                    </div>
                </div>
            `;
        },

        generatePinEntryScreen(data = {}) {
            const currentPinLength = data.currentPin ? data.currentPin.length : 0;
            const maxPinLength = 12;

            return `
                <div class="screen-pin-entry">
                    <div class="pin-header">
                        <h2 style="color: white;">🔐 請輸入密碼</h2>
                        <div class="pin-input-area">
                            <div class="pin-display" style="display: flex; justify-content: center; align-items: center; gap: 8px; min-height: 50px;">
                                ${currentPinLength > 0 ? Array.from({length: currentPinLength}, () => `
                                    <div class="pin-dot filled" style="font-size: 1.5rem; color: #4ade80;">●</div>
                                `).join('') : '<div style="color: rgba(255, 255, 255, 0.5); font-size: 0.9rem;">尚未輸入密碼</div>'}
                            </div>
                            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8rem; margin-top: 8px;">
                                已輸入 ${currentPinLength} 位數字（最多 ${maxPinLength} 位）
                            </div>
                        </div>
                        ${data.error ? `<p class="error-message">❌ ${data.error}</p>` : ''}
                        <div class="attempts-remaining">
                            ${data.attemptsLeft ? `剩餘嘗試次數: ${data.attemptsLeft}` : ''}
                        </div>
                    </div>
                    
                    <div class="screen-keypad">
                        <div class="screen-keypad-grid">
                            <button class="screen-key-btn number-key" data-key="1">1</button>
                            <button class="screen-key-btn number-key" data-key="2">2</button>
                            <button class="screen-key-btn number-key" data-key="3">3</button>
                            
                            <button class="screen-key-btn number-key" data-key="4">4</button>
                            <button class="screen-key-btn number-key" data-key="5">5</button>
                            <button class="screen-key-btn number-key" data-key="6">6</button>
                            
                            <button class="screen-key-btn number-key" data-key="7">7</button>
                            <button class="screen-key-btn number-key" data-key="8">8</button>
                            <button class="screen-key-btn number-key" data-key="9">9</button>
                            
                            <button class="screen-key-btn action-key cancel-key" data-key="cancel">取消</button>
                            <button class="screen-key-btn number-key" data-key="0">0</button>
                            <button class="screen-key-btn action-key" data-key="clear">清除</button>
                            
                            <button class="screen-key-btn action-key enter-key" data-key="enter">確認</button>
                        </div>
                    </div>
                </div>
            `;
        },

        generateMenuScreen() {
            const { sessionType, difficulty } = this.state.settings;
            const balance = this.state.gameState.accountBalance.toLocaleString();

            return `
                <div class="screen-menu">
                    <div class="menu-header">
                        <h2 style="color: white;">主選單</h2>
                        <div class="account-info">請選擇服務項目</div>
                    </div>
                    <div class="menu-layout-grid">
                        <div class="menu-options-grid">
                            <div class="side-label" data-action="right-1">💰 提款 ►</div>
                            <div class="side-label" data-action="right-2">💳 存款 ►</div>
                            <div class="side-label" data-action="right-3">📊 查詢 ►</div>
                            <div class="side-label" data-action="right-4">💸 轉帳 ►</div>
                            <div class="side-label" data-action="right-5">🚪 結束 ►</div>
                        </div>
                    </div>
                </div>
            `;
        },

        generateAmountEntryScreen(data = {}) {
            const sessionType = this.getActualSessionType();
            const showKeypad = data.showKeypad || false;
            const currentAmount = data.currentAmount || '';
            
            const actionText = {
                withdraw: '提款',
                deposit: '存入'
            }[sessionType] || '';
            
            // 如果顯示數字鍵盤（選擇了其他金額）
            if (showKeypad) {
                return `
                    <div class="screen-amount-entry">
                        <div class="amount-header">
                            <div class="amount-icon">${sessionType === 'withdraw' ? '💰' : '💳'}</div>
                            <h2 style="color: white;">請輸入${actionText}金額</h2>
                            <div class="amount-input-area">
                                <div class="currency-symbol">NT$</div>
                                <div class="amount-display">${currentAmount.toLocaleString()}</div>
                            </div>
                            ${data.error ? `<p class="error-message">❌ ${data.error}</p>` : ''}
                        </div>
                        
                        <div class="screen-keypad">
                            <div class="screen-keypad-grid">
                                <button class="screen-key-btn number-key" data-key="1">1</button>
                                <button class="screen-key-btn number-key" data-key="2">2</button>
                                <button class="screen-key-btn number-key" data-key="3">3</button>
                                
                                <button class="screen-key-btn number-key" data-key="4">4</button>
                                <button class="screen-key-btn number-key" data-key="5">5</button>
                                <button class="screen-key-btn number-key" data-key="6">6</button>
                                
                                <button class="screen-key-btn number-key" data-key="7">7</button>
                                <button class="screen-key-btn number-key" data-key="8">8</button>
                                <button class="screen-key-btn number-key" data-key="9">9</button>
                                
                                <button class="screen-key-btn action-key cancel-key" data-key="cancel">取消</button>
                                <button class="screen-key-btn number-key" data-key="0">0</button>
                                <button class="screen-key-btn action-key" data-key="clear">清除</button>
                                
                                <button class="screen-key-btn action-key enter-key" data-key="enter">確認</button>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // 預設顯示快速金額選擇
            return `
                <div class="screen-amount-selection">
                    <div class="amount-header">
                        <div class="amount-icon">${sessionType === 'withdraw' ? '💰' : '💳'}</div>
                        <h2 style="color: white;">請選擇${actionText}金額</h2>
                        ${data.error ? `<p class="error-message">❌ ${data.error}</p>` : ''}
                    </div>
                    
                    <div class="amount-options-grid">
                        <div class="amount-option-btn" data-action="custom">1.<br>其他金額</div>
                        <div class="amount-option-btn" data-amount="1000">2.<br>NT$1,000</div>
                        <div class="amount-option-btn" data-amount="3000">3.<br>NT$3,000</div>
                        <div class="amount-option-btn" data-amount="5000">4.<br>NT$5,000</div>
                        <div class="amount-option-btn" data-amount="10000">5.<br>NT$10,000</div>
                        <div class="amount-option-btn" data-amount="20000">6.<br>NT$20,000</div>
                        <div class="amount-option-btn" data-amount="40000">7.<br>NT$40,000</div>
                        <div class="amount-option-btn" data-amount="60000">8.<br>NT$60,000</div>
                    </div>
                    <p class="instruction-text" style="color: #ffd700;">請選擇金額或點選其他金額自行輸入</p>
                </div>
            `;
        },

        generateProcessingScreen() {
            return `
                <div class="screen-processing">
                    <div class="processing-animation">
                        <div class="spinner"></div>
                    </div>
                    <h2 style="color: white;">交易處理中，請稍候</h2>
                    <p class="processing-text" style="color: #ffd700;">系統正在處理您的交易請求</p>
                    <div class="processing-dots">
                        <span class="dot">●</span>
                        <span class="dot">●</span>
                        <span class="dot">●</span>
                    </div>
                </div>
            `;
        },

        generateCashDispensingScreen() {
            return `
                <div class="screen-cash-dispensing">
                    <div class="dispensing-animation">
                        <div class="cash-icon">💰</div>
                        <div class="spinner"></div>
                    </div>
                    <h2 style="color: white;">發鈔中，請稍候</h2>
                    <p class="dispensing-text" style="color: #ffd700;">系統正在為您準備現金</p>
                    <div class="processing-dots">
                        <span class="dot">●</span>
                        <span class="dot">●</span>
                        <span class="dot">●</span>
                    </div>
                </div>
            `;
        },

        // 步驟 4：存入現鈔畫面
        generateDepositCashScreen() {
            return `
                <div class="screen-deposit-cash">
                    <div class="deposit-header">
                        <h2 style="color: white;">請存入現鈔</h2>
                        <div class="deposit-instructions">
                            <p>請點擊下方現金出口放入鈔票</p>
                        </div>
                    </div>

                    <div class="deposit-limits">
                        <div class="limit-item">
                            <span class="limit-label">每次存入鈔票張數最多</span>
                            <span class="limit-value">100張</span>
                        </div>
                        <div class="limit-item">
                            <span class="limit-label">每次存入金額最高</span>
                            <span class="limit-value">6萬元</span>
                        </div>
                    </div>

                    <div class="deposit-guidelines">
                        <h3>存款注意事項：</h3>
                        <ul>
                            <li>請於存款前確認存款金額，並將鈔票排列整齊</li>
                            <li>依圖示放入現金。請勿將貼紙、橡皮筋或迴紋針等異物一同放入，以免造成機器故障</li>
                        </ul>
                    </div>

                    <div class="deposit-actions">
                        <div class="side-label-left cancel-action" data-action="cancel">◄ 取消</div>
                        <div class="side-label-right confirm-action" data-action="confirm">確認 ►</div>
                    </div>

                    <p class="cancel-instruction">取消請按"取消鍵"</p>
                </div>
            `;
        },

        // 步驟 7：機器數鈔辨識中畫面
        generateDepositCountingScreen() {
            return `
                <div class="screen-deposit-counting">
                    <div class="counting-animation">
                        <div class="money-icon">💴</div>
                        <div class="spinner"></div>
                    </div>
                    <h2 style="color: white;">機器數鈔辨識中，請稍候</h2>
                    <p class="counting-text" style="color: #ffd700;">系統正在辨識您的鈔票</p>

                    <div class="rejection-notice">
                        <h3>如有不接受之鈔票</h3>
                        <ol>
                            <li>請先取回不接受之鈔票</li>
                            <li>接受之鈔票存入請按"確認"鍵，取消請按"取消"鍵</li>
                        </ol>
                    </div>

                    <div class="processing-dots">
                        <span class="dot">●</span>
                        <span class="dot">●</span>
                        <span class="dot">●</span>
                    </div>
                </div>
            `;
        },

        // 步驟 8：確認存入現鈔畫面
        generateDepositConfirmScreen() {
            const bills = this.state.gameState.depositBills;
            const totalAmount = this.getTotalDepositAmount();
            const totalCount = this.getTotalBillCount();

            return `
                <div class="screen-deposit-confirm">
                    <div class="confirm-header">
                        <h2 style="color: white;">請確認存入現鈔</h2>
                    </div>

                    <div class="deposit-summary-table">
                        <div class="summary-row amount-row">
                            <span class="label">實際存款金額</span>
                            <span class="value">${totalAmount.toLocaleString()}元</span>
                        </div>
                        ${bills[2000] > 0 ? `
                            <div class="summary-row">
                                <span class="label">NT$ 2000</span>
                                <span class="value">${bills[2000]}張</span>
                            </div>` : ''}
                        ${bills[1000] > 0 ? `
                            <div class="summary-row">
                                <span class="label">NT$ 1000</span>
                                <span class="value">${bills[1000]}張</span>
                            </div>` : ''}
                        ${bills[500] > 0 ? `
                            <div class="summary-row">
                                <span class="label">NT$ 500</span>
                                <span class="value">${bills[500]}張</span>
                            </div>` : ''}
                        ${bills[100] > 0 ? `
                            <div class="summary-row">
                                <span class="label">NT$ 100</span>
                                <span class="value">${bills[100]}張</span>
                            </div>` : ''}
                        <div class="summary-row total-row">
                            <span class="label">合計</span>
                            <span class="value">${totalCount}張</span>
                        </div>
                    </div>

                    <div class="confirm-actions">
                        <div class="side-label-left cancel-action" data-action="cancel">◄ 取消</div>
                        <div class="side-label-right confirm-action" data-action="confirm">確認 ►</div>
                    </div>

                    <p class="confirm-instruction">依實際金額存入請按"確認"鍵；取消請按"取消"鍵</p>
                </div>
            `;
        },

        generateContinueTransactionQuestionScreen() {
            const accountNumber = this.state.gameState.accountNumber;
            const balance = this.state.gameState.accountBalance;
            const amount = this.state.gameState.transactionAmount;
            const transaction = this.state.gameState.currentTransaction;
            const now = new Date();

            // 🔧 [修正] 所有交易類型初始都顯示遮蔽資訊（餘額查詢也一樣，需按「螢幕顯示」才顯示）
            const isInquiry = transaction.type === 'inquiry';
            const isTransfer = transaction.type === 'transfer';
            const displayAccount = '****' + accountNumber.slice(4);
            const displayBalance = 'NT$ ***,***';
            const displayAmount = isInquiry ? 'NT$ ***' : `NT$ ${amount.toLocaleString()}`;

            // 🔧 [新增] 轉帳專用：轉入帳號遮蔽
            const transfer = this.state.gameState.transfer || {};
            const transferAccount = transfer.accountNumber || '';
            const maskedTransferAccount = transferAccount ? '****' + transferAccount.slice(4) : '';

            // 格式化時間
            const dateStr = now.toLocaleDateString('zh-TW');
            const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false });

            return `
                <div class="screen-continue-transaction-question" style="width: 100%; height: 100%; overflow-y: auto; padding: 10px 15px; box-sizing: border-box;">
                    <div class="question-header" style="margin-bottom: 12px;">
                        <h2 style="color: white; margin: 0; font-size: 1.4rem; text-align: center;">交易成功</h2>
                    </div>

                    <!-- 交易資訊顯示區 - 改為2x2網格佈局 -->
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 12px; backdrop-filter: blur(10px); box-sizing: border-box;">
                        <!-- 交易明細抬頭 -->
                        <div style="text-align: center; padding-bottom: 8px; margin-bottom: 10px; border-bottom: 2px solid rgba(255, 255, 255, 0.3);">
                            <h3 style="color: white; margin: 0; font-size: 0.95rem; font-weight: 600;">交易明細</h3>
                        </div>

                        <!-- 第一列：交易日期 + 交易時間 + 交易類別（三欄）-->
                        <div style="display: grid !important; grid-template-columns: 1fr 1fr 1fr !important; gap: 10px !important; margin-bottom: 8px !important; padding-bottom: 8px !important; border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;">
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px !important; min-width: 0 !important;">
                                <span style="color: rgba(255, 255, 255, 0.8) !important; font-size: 0.75rem !important;">交易日期</span>
                                <span style="color: white !important; font-family: 'Courier New', monospace !important; font-size: 0.8rem !important;">${dateStr}</span>
                            </div>
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px !important; min-width: 0 !important;">
                                <span style="color: rgba(255, 255, 255, 0.8) !important; font-size: 0.75rem !important;">交易時間</span>
                                <span style="color: white !important; font-family: 'Courier New', monospace !important; font-size: 0.8rem !important;">${timeStr}</span>
                            </div>
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px !important; min-width: 0 !important;">
                                <span style="color: rgba(255, 255, 255, 0.8) !important; font-size: 0.75rem !important;">交易類別</span>
                                <span style="color: #4ade80 !important; font-size: 0.95rem !important; font-weight: 700 !important; font-family: 'Microsoft JhengHei', sans-serif !important;">${
                                    isInquiry ? '餘額查詢' :
                                    (isTransfer ? '帳戶轉帳' :
                                    (transaction.type === 'deposit' ? '現金存款' : '現金提款'))
                                }</span>
                            </div>
                        </div>

                        <!-- 轉帳專用：轉出銀行 + 轉出帳號 (僅轉帳交易顯示) -->
                        ${isTransfer ? `
                        <div style="display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 15px !important; margin-bottom: 6px !important;">
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px !important; min-width: 0 !important;">
                                <span style="color: rgba(255, 255, 255, 0.8) !important; font-size: 0.75rem !important;">轉出銀行</span>
                                <span style="color: white !important; font-size: 0.85rem !important; font-weight: 600 !important;">${this.state.gameState.transfer.myBankName || '本行'}</span>
                            </div>
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px !important; min-width: 0 !important;">
                                <span style="color: rgba(255, 255, 255, 0.8) !important; font-size: 0.75rem !important;">交易帳號</span>
                                <span id="display-account" style="color: white !important; font-family: 'Courier New', monospace !important; font-size: 0.85rem !important; font-weight: 600 !important; letter-spacing: 1px !important;">${displayAccount}</span>
                            </div>
                        </div>
                        ` : ''}

                        <!-- 轉帳專用：轉入銀行 + 轉入帳號 (僅轉帳交易顯示) -->
                        ${isTransfer ? `
                        <div style="display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 15px !important; margin-bottom: 6px !important;">
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px !important; min-width: 0 !important;">
                                <span style="color: rgba(255, 255, 255, 0.8) !important; font-size: 0.75rem !important;">轉入銀行</span>
                                <span style="color: #fbbf24 !important; font-size: 0.85rem !important; font-weight: 600 !important;">${this.state.gameState.transfer.bankName}</span>
                            </div>
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px !important; min-width: 0 !important;">
                                <span style="color: rgba(255, 255, 255, 0.8) !important; font-size: 0.75rem !important;">轉入帳號</span>
                                <span id="display-transfer-account" style="color: white !important; font-family: 'Courier New', monospace !important; font-size: 0.85rem !important; font-weight: 600 !important; letter-spacing: 1px !important;">${maskedTransferAccount}</span>
                            </div>
                        </div>
                        <!-- 轉帳專用：交易金額 + 帳戶餘額 (第三列) -->
                        <div style="display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 15px !important; margin-bottom: 8px !important; padding-bottom: 8px !important; border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;">
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px !important; min-width: 0 !important;">
                                <span style="color: rgba(255, 255, 255, 0.8) !important; font-size: 0.75rem !important;">交易金額</span>
                                <span id="display-amount" style="color: white !important; font-family: 'Courier New', monospace !important; font-size: 0.85rem !important; font-weight: 600 !important;">NT$ ***,***</span>
                            </div>
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px !important; min-width: 0 !important;">
                                <span style="color: rgba(255, 255, 255, 0.8) !important; font-size: 0.75rem !important;">帳戶餘額</span>
                                <span id="display-balance" style="color: white !important; font-family: 'Courier New', monospace !important; font-size: 0.85rem !important; font-weight: 600 !important;">${displayBalance}</span>
                            </div>
                        </div>
                        ` : `
                        <!-- 非轉帳：交易帳號 + 交易金額 + 帳戶餘額（三欄同列）-->
                        <div style="display: grid !important; grid-template-columns: 1fr 1fr 1fr !important; gap: 10px;">
                            <!-- 交易帳號 -->
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px; min-width: 0;">
                                <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.75rem;">交易帳號</span>
                                <span id="display-account" style="color: white; font-family: 'Courier New', monospace; font-size: 0.75rem; letter-spacing: 0.5px; font-weight: 600;">${displayAccount}</span>
                            </div>
                            <!-- 交易金額 -->
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px; min-width: 0;">
                                <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.75rem;">交易金額</span>
                                <span id="display-amount" style="color: ${isInquiry ? 'white' : '#4ade80'}; font-size: 0.95rem; font-weight: 700; font-family: 'Arial', sans-serif;">${displayAmount}</span>
                            </div>
                            <!-- 帳戶餘額 -->
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px; min-width: 0;">
                                <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.75rem;">帳戶餘額</span>
                                <span id="display-balance" style="color: white; font-family: 'Courier New', monospace; font-size: 0.75rem; font-weight: 600;">${displayBalance}</span>
                            </div>
                        </div>
                        `}
                    </div>

                    <!-- 按鈕區域 - 垂直排列 -->
                    <div class="receipt-choice-section" style="padding: 0;">
                        <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: rgba(255, 255, 255, 0.8); text-align: center;">請選擇您要進行的操作</p>

                        <!-- 🔧 [修正] 螢幕顯示按鈕移到最上方（單獨一列）-->
                        <div style="display: flex; justify-content: center; margin-bottom: 6px;">
                            <button class="screen-display-btn" data-action="screen-display" style="
                                background: linear-gradient(135deg, #64748b, #475569) !important;
                                color: white !important;
                                border: none !important;
                                padding: 8px 16px !important;
                                border-radius: 5px !important;
                                font-size: 0.8rem !important;
                                font-weight: 600 !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
                                font-family: 'Microsoft JhengHei', sans-serif !important;
                                white-space: nowrap !important;
                                width: 150px !important;
                            ">
                                📺 螢幕顯示
                            </button>
                        </div>

                        <!-- 🔧 [修正] 不印/印明細表按鈕移到下方（並排一列）-->
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button class="no-print-btn" data-action="no-print" style="
                                background: linear-gradient(135deg, #6b7280, #4b5563) !important;
                                color: white !important;
                                border: none !important;
                                padding: 8px 14px !important;
                                border-radius: 5px !important;
                                font-size: 0.75rem !important;
                                font-weight: 600 !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
                                font-family: 'Microsoft JhengHei', sans-serif !important;
                                white-space: nowrap !important;
                                flex: 1 !important;
                                max-width: 130px !important;
                            ">
                                ❌ 不印明細表
                            </button>
                            <button class="print-btn" data-action="print" style="
                                background: linear-gradient(135deg, #059669, #047857) !important;
                                color: white !important;
                                border: none !important;
                                padding: 8px 14px !important;
                                border-radius: 5px !important;
                                font-size: 0.75rem !important;
                                font-weight: 600 !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
                                font-family: 'Microsoft JhengHei', sans-serif !important;
                                white-space: nowrap !important;
                                flex: 1 !important;
                                max-width: 130px !important;
                            ">
                                🖨️ 印明細表
                            </button>
                        </div>
                    </div>
                </div>

                <style>
                    .option-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3) !important;
                    }

                    .option-btn:active {
                        transform: translateY(0);
                    }
                </style>
            `;
        },

        generateCardEjectScreen() {
            return `
                <div class="screen-card-eject">
                    <div class="eject-header">
                        <div class="card-icon">💳</div>
                        <h2>晶片金融卡已退出，請取回</h2>
                        <p class="eject-message">請點擊金融卡取回您的卡片</p>
                    </div>
                    
                    <div class="eject-animation">
                        <div class="card-slot-visual">
                            <div class="slot-opening"></div>
                            <div class="arrow-indicator">👆</div>
                        </div>
                    </div>
                </div>
            `;
        },

        generateCardEjectEndScreen() {
            return `
                <div class="screen-card-eject-end">
                    <div class="eject-header">
                        <div class="card-icon">💳</div>
                        <h2 style="color: white;">交易結束，請取回金融卡</h2>
                    </div>
                </div>
            `;
        },

        generateTakeCashScreen() {
            return `
                <div class="screen-take-cash">
                    <div class="cash-header">
                        <div class="cash-icon">💰</div>
                        <h2 style="color: white;">請收取現金</h2>
                        <p class="cash-message">您的現金已準備完畢，請從現金出口收取</p>
                    </div>
                    
                    <div class="cash-animation">
                        <div class="cash-slot-visual">
                            <div class="money-bills">💵💵💵</div>
                            <div class="arrow-indicator">👇</div>
                        </div>
                    </div>
                </div>
            `;
        },
        
        generateTakeCashScreenWithMessage() {
            return `
                <div class="screen-take-cash">
                    <div class="cash-header">
                        <div class="cash-icon">💰</div>
                        <h2 style="color: white;">請收取現金，並妥善保存</h2>
                        <p class="cash-message">您的現金已準備完畢，請從現金出口收取並妥善保存</p>
                    </div>
                    
                    <div class="cash-animation">
                        <div class="cash-slot-visual">
                            <div class="money-bills">💵💵💵</div>
                            <div class="arrow-indicator">👇</div>
                        </div>
                    </div>
                </div>
            `;
        },
        
        // 階段1：重要憑證提醒畫面
        generateReceiptImportantNotice() {
            return `
                <div class="screen-receipt-notice">
                    <div class="receipt-notice-header">
                        <div class="receipt-notice-icon">📄</div>
                        <h2 style="color: white;">交易明細表為重要入帳憑證</h2>
                        <h3 style="color: white;">請務必妥善收存</h3>
                    </div>

                    <div class="printing-animation">
                        <div class="printer-icon">🖨️</div>
                        <div class="printing-dots">
                            <span class="dot">●</span>
                            <span class="dot">●</span>
                            <span class="dot">●</span>
                        </div>
                    </div>

                    <div class="notice-message">
                        <p class="main-message">系統正在準備您的交易明細表</p>
                        <p class="sub-message">請稍候，即將完成</p>
                    </div>
                </div>
            `;
        },

        generateThankYouScreen() {
            return `
                <div class="screen-thank-you">
                    <div class="thank-you-header">
                        <div class="thank-you-icon">🙏</div>
                        <h2 style="color: white;">謝謝您的惠顧</h2>
                        <h3 style="color: white;">歡迎再次光臨</h3>
                        <h4 style="color: white;">請稍候插卡</h4>
                    </div>

                    <div class="thank-you-message">
                        <p class="main-message">感謝您使用本ATM服務</p>
                        <p class="sub-message">期待您的再次光臨</p>
                    </div>

                    <div class="waiting-animation">
                        <div class="card-icon">💳</div>
                        <div class="waiting-dots">
                            <span class="dot">●</span>
                            <span class="dot">●</span>
                            <span class="dot">●</span>
                        </div>
                    </div>
                </div>
            `;
        },

        generatePrintingScreen() {
            return `
                <div class="screen-printing">
                    <div class="printing-animation">
                        <div class="printer-icon">🖨️</div>
                        <div class="spinner"></div>
                    </div>
                    <h2 style="color: white;">交易明細表列印中，請稍候</h2>
                    <p class="printing-text">系統正在為您列印交易明細表</p>
                    <div class="processing-dots">
                        <span class="dot">●</span>
                        <span class="dot">●</span>
                        <span class="dot">●</span>
                    </div>
                </div>
            `;
        },

        generateFinalCompleteScreen() {
            return `
                <div class="screen-final-complete">
                    <div class="complete-header">
                        <div class="complete-icon">✅</div>
                        <div class="results-title-row">
                            <img src="../images/common/hint_detective.png" class="results-mascot-img" alt="金錢小助手">
                            <h2 style="color: white;">交易完成</h2>
                            <span class="results-mascot-spacer"></span>
                        </div>
                        <p class="complete-message" style="color: #ffd700;">請取回交易明細表，謝謝您的惠顧</p>
                    </div>
                    
                    <div class="receipt-animation">
                        <div class="receipt-slot-visual">
                            <div class="receipt-paper">🧾</div>
                            <div class="arrow-indicator">👆</div>
                        </div>
                    </div>
                    
                </div>
            `;
        },

        generateCompleteScreen(data = {}) {
            const { sessionType } = this.state.settings;
            const amount = data.amount || 0;
            const newBalance = this.state.gameState.accountBalance;
            
            const actionText = {
                withdraw: '提款',
                deposit: '存款',
                inquiry: '查詢'
            }[sessionType] || '交易';
            
            return `
                <div class="screen-complete">
                    <h2>${actionText}完成</h2>
                    <div class="transaction-details">
                        ${amount > 0 ? `
                            <div class="detail-row">
                                <span>${actionText}金額:</span>
                                <span>NT$ ${amount.toLocaleString()}</span>
                            </div>
                        ` : ''}
                        <div class="detail-row">
                            <span>帳戶餘額:</span>
                            <span>NT$ ${newBalance.toLocaleString()}</span>
                        </div>
                        <div class="detail-row">
                            <span>交易時間:</span>
                            <span>${new Date().toLocaleString()}</span>
                        </div>
                    </div>
                    <p class="instruction-text">請取走您的卡片和現金</p>
                    <div class="completion-message">
                        <p>🎉 恭喜完成ATM操作！</p>
                        <p>經驗值 +${data.experience || 100}</p>
                    </div>
                </div>
            `;
        },

        // 新增：交易成功畫面（包含明細表選項）
        generateTransactionSuccessScreen() {
            const accountNumber = this.state.gameState.accountNumber;
            const balance = this.state.gameState.accountBalance;
            const amount = this.state.gameState.transactionAmount;
            const transaction = this.state.gameState.currentTransaction;
            const now = new Date();

            // 遮蔽帳號前4碼
            const maskedAccount = '****' + accountNumber.slice(4);
            // 遮蔽餘額
            const maskedBalance = '***,***';

            // 檢查交易類型
            const transactionType = typeof transaction === 'object' ? transaction.type : transaction;
            const isTransfer = transactionType === 'transfer';
            const isInquiry = transactionType === 'inquiry';
            const transfer = this.state.gameState.transfer || {};
            const transferBankName = transfer.bankName || '';
            const transferAccount = transfer.accountNumber || '';
            const maskedTransferAccount = transferAccount ? '****' + transferAccount.slice(4) : '';

            return `
                <div class="screen-transaction-success" style="width: 100%; height: 100%; overflow-y: auto;">
                    <div class="success-header" style="padding: 10px;">
                        <h2 style="color: white; margin: 0 0 12px 0; font-size: 1.4rem; text-align: center;">交易成功</h2>
                    </div>

                    <!-- 交易資訊顯示區 -->
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 10px; margin: 0 15px 12px; backdrop-filter: blur(10px); box-sizing: border-box;">
                        <!-- 交易明細抬頭 -->
                        <div style="text-align: center; padding-bottom: 8px; margin-bottom: 10px; border-bottom: 2px solid rgba(255, 255, 255, 0.3);">
                            <h3 style="color: white; margin: 0; font-size: 0.95rem; font-weight: 600;">交易明細</h3>
                        </div>

                        <!-- 第一列：交易日期 + 交易時間 + 交易類別（三欄）-->
                        <div style="display: grid !important; grid-template-columns: 1fr 1fr 1fr !important; gap: 10px !important; margin-bottom: 8px !important; padding-bottom: 8px !important; border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;">
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px !important; min-width: 0 !important;">
                                <span style="color: rgba(255, 255, 255, 0.8) !important; font-size: 0.75rem !important;">交易日期</span>
                                <span style="color: white !important; font-family: 'Courier New', monospace !important; font-size: 0.8rem !important;">${now.toLocaleDateString('zh-TW').replace(/\//g, '/')}</span>
                            </div>
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px !important; min-width: 0 !important;">
                                <span style="color: rgba(255, 255, 255, 0.8) !important; font-size: 0.75rem !important;">交易時間</span>
                                <span style="color: white !important; font-family: 'Courier New', monospace !important; font-size: 0.8rem !important;">${now.toLocaleTimeString('zh-TW', { hour12: false })}</span>
                            </div>
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px !important; min-width: 0 !important;">
                                <span style="color: rgba(255, 255, 255, 0.8) !important; font-size: 0.75rem !important;">交易類別</span>
                                <span style="color: #4ade80 !important; font-size: 0.95rem !important; font-weight: 700 !important; font-family: 'Microsoft JhengHei', sans-serif !important;">${isTransfer ? '帳戶轉帳' : (isInquiry ? '餘額查詢' : (transactionType === 'withdrawal' ? '提款' : '存款'))}</span>
                            </div>
                        </div>

                        ${isTransfer ? `
                        <!-- 轉帳專用：轉出/轉入資訊（三列）-->
                        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
                            <!-- 第一列：轉出銀行 + 交易帳號 -->
                            <div style="display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 15px; margin-bottom: 6px;">
                                <div style="display: flex !important; flex-direction: column !important; gap: 3px; min-width: 0;">
                                    <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.75rem;">轉出銀行</span>
                                    <span style="color: white; font-size: 0.8rem; font-weight: 600;">本行</span>
                                </div>
                                <div style="display: flex !important; flex-direction: column !important; gap: 3px; min-width: 0;">
                                    <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.75rem;">交易帳號</span>
                                    <span id="display-account" style="color: white; font-family: 'Courier New', monospace; font-size: 0.8rem; letter-spacing: 1px; font-weight: 600;">${maskedAccount}</span>
                                </div>
                            </div>
                            <!-- 第二列：轉入銀行 + 轉入帳號 -->
                            <div style="display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 15px; margin-bottom: 6px;">
                                <div style="display: flex !important; flex-direction: column !important; gap: 3px; min-width: 0;">
                                    <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.75rem;">轉入銀行</span>
                                    <span style="color: #fbbf24; font-size: 0.8rem; font-weight: 600;">${transferBankName}</span>
                                </div>
                                <div style="display: flex !important; flex-direction: column !important; gap: 3px; min-width: 0;">
                                    <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.75rem;">轉入帳號</span>
                                    <span id="display-transfer-account" style="color: white; font-family: 'Courier New', monospace; font-size: 0.8rem; letter-spacing: 1px; font-weight: 600;">${maskedTransferAccount}</span>
                                </div>
                            </div>
                            <!-- 第三列：交易金額 + 帳戶餘額 -->
                            <div style="display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 15px;">
                                <div style="display: flex !important; flex-direction: column !important; gap: 3px; min-width: 0;">
                                    <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.75rem;">交易金額</span>
                                    <span id="display-amount" style="color: white; font-family: 'Courier New', monospace; font-size: 0.8rem; font-weight: 600;">NT$ ***,***</span>
                                </div>
                                <div style="display: flex !important; flex-direction: column !important; gap: 3px; min-width: 0;">
                                    <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.75rem;">帳戶餘額</span>
                                    <span id="display-balance" style="color: white; font-family: 'Courier New', monospace; font-size: 0.8rem; font-weight: 600;">NT$ ${maskedBalance}</span>
                                </div>
                            </div>
                        </div>
                        ` : `
                        <!-- 非轉帳：交易帳號 + 交易金額 + 帳戶餘額（三欄同列）-->
                        <div style="display: grid !important; grid-template-columns: 1fr 1fr 1fr !important; gap: 10px;">
                            <!-- 交易帳號 -->
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px; min-width: 0;">
                                <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.75rem;">交易帳號</span>
                                <span id="display-account" style="color: white; font-family: 'Courier New', monospace; font-size: 0.75rem; letter-spacing: 0.5px; font-weight: 600;">${maskedAccount}</span>
                            </div>
                            <!-- 交易金額 -->
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px; min-width: 0;">
                                <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.75rem;">交易金額</span>
                                <span style="color: #4ade80; font-size: 0.95rem; font-weight: 700; font-family: 'Arial', sans-serif;">NT$ ${amount.toLocaleString()}</span>
                            </div>
                            <!-- 帳戶餘額 -->
                            <div style="display: flex !important; flex-direction: column !important; gap: 3px; min-width: 0;">
                                <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.75rem;">帳戶餘額</span>
                                <span id="display-balance" style="color: white; font-family: 'Courier New', monospace; font-size: 0.75rem; font-weight: 600;">NT$ ${maskedBalance}</span>
                            </div>
                        </div>
                        `}
                    </div>

                    <!-- 按鈕區域 - 垂直排列 -->
                    <div class="receipt-choice-section" style="padding: 0 15px;">
                        <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: rgba(255, 255, 255, 0.8); text-align: center;">請選擇您要進行的操作</p>

                        <!-- 🔧 [修正] 螢幕顯示按鈕移到最上方（單獨一列）-->
                        <div style="display: flex; justify-content: center; margin-bottom: 6px;">
                            <button class="screen-display-btn" data-action="screen-display" style="
                                background: linear-gradient(135deg, #64748b, #475569) !important;
                                color: white !important;
                                border: none !important;
                                padding: 8px 16px !important;
                                border-radius: 5px !important;
                                font-size: 0.8rem !important;
                                font-weight: 600 !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
                                font-family: 'Microsoft JhengHei', sans-serif !important;
                                white-space: nowrap !important;
                                width: 150px !important;
                            ">
                                📺 螢幕顯示
                            </button>
                        </div>

                        <!-- 🔧 [修正] 不印/印明細表按鈕移到下方（並排一列）-->
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button class="no-print-btn" data-action="no-print" style="
                                background: linear-gradient(135deg, #6b7280, #4b5563) !important;
                                color: white !important;
                                border: none !important;
                                padding: 8px 14px !important;
                                border-radius: 5px !important;
                                font-size: 0.75rem !important;
                                font-weight: 600 !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
                                font-family: 'Microsoft JhengHei', sans-serif !important;
                                white-space: nowrap !important;
                                flex: 1 !important;
                                max-width: 130px !important;
                            ">
                                ❌ 不印明細表
                            </button>
                            <button class="print-btn" data-action="print" style="
                                background: linear-gradient(135deg, #059669, #047857) !important;
                                color: white !important;
                                border: none !important;
                                padding: 8px 14px !important;
                                border-radius: 5px !important;
                                font-size: 0.75rem !important;
                                font-weight: 600 !important;
                                cursor: pointer !important;
                                transition: all 0.3s ease !important;
                                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
                                font-family: 'Microsoft JhengHei', sans-serif !important;
                                white-space: nowrap !important;
                                flex: 1 !important;
                                max-width: 130px !important;
                            ">
                                🖨️ 印明細表
                            </button>
                        </div>
                    </div>
                </div>

                <style>
                    .option-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3) !important;
                    }

                    .option-btn:active {
                        transform: translateY(0);
                    }
                </style>
            `;
        },

        // 新增：取回卡片畫面
        generateTakeCardScreen() {
            return `
                <div class="screen-take-card">
                    <h2 style="color: white; font-size: 2rem; margin: 20px 0;">請取回您的卡片</h2>
                    <div class="card-animation-hint">
                        <p style="color: #ffd700;">請點擊卡片下方按鈕取回卡片</p>
                    </div>
                </div>
            `;
        },

        // 新增：收取現金畫面
        generateCollectCashScreen() {
            return `
                <div class="screen-collect-cash">
                    <div class="cash-icon-large" style="font-size: 2.5em; margin-bottom: 20px;">💰</div>
                    <h2 style="color: white; font-size: 2rem; margin: 20px 0;">請收取現金</h2>
                    <div class="cash-amount-display">
                        <p style="color: #4ade80; font-size: 1.5rem;">提款金額：NT$ ${this.state.gameState.transactionAmount.toLocaleString()}</p>
                    </div>
                    <div class="cash-dispenser-indicator">
                        <p style="color: #ffd700;">請從出鈔口取走現金</p>
                    </div>
                </div>
            `;
        },

        // 新增：收取明細表畫面
        generateTakeReceiptScreen() {
            return `
                <div class="screen-take-receipt">
                    <div class="receipt-icon-large" style="font-size: 4rem; margin: 20px 0;">🧾</div>
                    <h2 style="color: white; font-size: 2rem; margin: 20px 0;">請收取明細表</h2>
                    <div class="receipt-hint">
                        <p style="color: #ffd700; font-size: 1.2rem;">請從票據出口取出明細表</p>
                    </div>
                </div>
            `;
        },

        // 新增：最終交易完成畫面
        generateFinalTransactionCompleteScreen() {
            return `
                <div class="screen-final-transaction-complete">
                    <div class="complete-icon-large">✅</div>
                    <h2 style="color: white; font-size: 2.5rem; margin: 20px 0;">謝謝惠顧</h2>
                    <h3 style="color: #4ade80; font-size: 1.8rem; margin: 20px 0;">歡迎下次使用</h3>
                    <div class="thank-you-message">
                        <p style="color: #ffd700; font-size: 1.2rem;">感謝您的使用</p>
                        <p style="color: #94a3b8; font-size: 1rem; margin-top: 10px;">Thank you for using our service</p>
                    </div>
                </div>
            `;
        },

        generateContinueTransactionScreen() {
            return `
                <div class="screen-continue-transaction">
                    <div class="options-header">
                        <h2 style="color: white;">交易完成</h2>
                        <p class="completion-message">您的提款已完成，請取走現金</p>
                    </div>

                    <div class="continue-question">
                        <h3>是否需列印明細表？</h3>
                        <div class="option-buttons">
                            <button class="option-btn no-print-btn" data-action="no-print">
                                📺 不印明細表，螢幕顯示
                            </button>
                            <button class="option-btn print-btn" data-action="print">
                                🖨️ 列印明細表
                            </button>
                        </div>
                    </div>

                    <p class="instruction-text">請選擇您要進行的操作</p>
                </div>
            `;
        },

        generateReceiptOptionsScreen() {
            const accountNumber = this.state.gameState.accountNumber;
            const balance = this.state.gameState.accountBalance;
            const amount = this.state.gameState.transactionAmount;
            const transaction = this.state.gameState.currentTransaction;
            const now = new Date();

            // 遮蔽帳號前4碼
            const maskedAccount = '****' + accountNumber.slice(4);
            // 遮蔽餘額
            const maskedBalance = '***,***';

            return `
                <div class="screen-receipt-options">
                    <div class="options-header">
                        <h2 style="color: white; margin-bottom: 10px;">交易成功</h2>
                    </div>

                    <!-- 交易資訊顯示區 -->
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 12px; margin: 20px 30px; backdrop-filter: blur(10px);">
                        <!-- 交易帳號（遮蔽） -->
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
                            <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.95rem;">交易帳號</span>
                            <span id="display-account" style="color: white; font-family: 'Courier New', monospace; font-size: 1.1rem; letter-spacing: 3px; font-weight: 600;">${maskedAccount}</span>
                        </div>

                        <!-- 交易金額 -->
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
                            <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.95rem;">交易金額</span>
                            <span style="color: #4ade80; font-size: 1.5rem; font-weight: 700; font-family: 'Arial', sans-serif;">NT$ ${amount.toLocaleString()}</span>
                        </div>

                        <!-- 交易日期 -->
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
                            <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.95rem;">交易日期</span>
                            <span style="color: white; font-family: 'Courier New', monospace; font-size: 1rem;">${now.toLocaleDateString('zh-TW')}</span>
                        </div>

                        <!-- 帳戶餘額（遮蔽） -->
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                            <span style="color: rgba(255, 255, 255, 0.8); font-size: 0.95rem;">帳戶餘額</span>
                            <span id="display-balance" style="color: white; font-family: 'Courier New', monospace; font-size: 1.1rem; font-weight: 600;">NT$ ${maskedBalance}</span>
                        </div>
                    </div>

                    <div class="receipt-question">
                        <h3 style="color: white; margin-bottom: 20px; font-size: 1.3rem;">明細表選項</h3>
                        <div class="option-buttons" style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; padding: 0 20px;">
                            <button class="option-btn screen-display-btn" data-action="screen-display" style="
                                background: linear-gradient(135deg, #64748b, #475569);
                                color: white;
                                border: none;
                                padding: 15px 24px;
                                border-radius: 8px;
                                font-size: 1rem;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                flex: 0 1 140px;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                                font-family: 'Microsoft JhengHei', sans-serif;
                            ">
                                📺 螢幕顯示
                            </button>
                            <button class="option-btn no-print-btn" data-action="no-print" style="
                                background: linear-gradient(135deg, #6b7280, #4b5563);
                                color: white;
                                border: none;
                                padding: 15px 24px;
                                border-radius: 8px;
                                font-size: 1rem;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                flex: 0 1 140px;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                                font-family: 'Microsoft JhengHei', sans-serif;
                            ">
                                ❌ 不印明細表
                            </button>
                            <button class="option-btn print-btn" data-action="print" style="
                                background: linear-gradient(135deg, #059669, #047857);
                                color: white;
                                border: none;
                                padding: 15px 24px;
                                border-radius: 8px;
                                font-size: 1rem;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                flex: 0 1 140px;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                                font-family: 'Microsoft JhengHei', sans-serif;
                            ">
                                🖨️ 印明細表
                            </button>
                        </div>
                    </div>

                    <p class="instruction-text" style="margin-top: 25px; font-size: 0.95rem;">請選擇您要進行的操作</p>
                </div>

                <style>
                    .option-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3) !important;
                    }

                    .option-btn:active {
                        transform: translateY(0);
                    }
                </style>
            `;
        },

        generateErrorScreen(data = {}) {
            return `
                <div class="screen-error">
                    <div class="error-icon">⚠️</div>
                    <h2>操作錯誤</h2>
                    <p class="error-message">${data.message || '請重新操作'}</p>
                    <div class="error-suggestions">
                        ${data.suggestions ? data.suggestions.map(suggestion => 
                            `<p class="suggestion">• ${suggestion}</p>`
                        ).join('') : ''}
                    </div>
                    <p class="instruction-text">請按取消鍵重新開始</p>
                </div>
            `;
        },

        // =====================================================
        // 按鍵處理系統
        // =====================================================
        handleKeyPress(event) {
            const key = event.target.dataset.key;
            if (!key) return;

            // ✅ [修正] 簡單模式密碼輸入：先驗證數字是否正確，再播放音效
            // 🔧 [修正] 簡單/普通模式：密碼輸入錯誤檢查
            // 簡單模式：立即檢查，立即顯示提示
            // 普通模式：立即檢查，但提示延遲10秒顯示
            if (key >= '0' && key <= '9' &&
                this.state.gameState.currentScene === 'pin-entry') {

                const isEasyMode = this.state.settings.difficulty === 'easy';
                const isNormalMode = this.state.settings.difficulty === 'normal';

                // 🔧 [修正] 簡單模式和普通模式都立即檢查錯誤
                if (this.shouldShowHint()) {
                    const correctPin = this.state.gameState.correctPin;
                    const progress = isEasyMode
                        ? this.state.gameState.easyModeHints.pinInputProgress
                        : this.state.gameState.currentPin.length;

                    // 🔧 [修正] 防止重複輸入：如果已經輸入完成，不再接受輸入
                    if (isEasyMode && progress >= correctPin.length) {
                        ATM.Debug.log('hint', `❌ 密碼已輸入完成（${progress}位），不接受額外輸入`);
                        const errorAudio = new Audio('../audio/units/error.mp3');
                        errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                        return;
                    }

                    // 🔧 [新增] 普通模式：密碼已輸入完成但又按了數字鍵，提示按確認鍵
                    if (isNormalMode && progress >= correctPin.length) {
                        ATM.Debug.log('hint', `❌ [Normal-Mode] 密碼已輸入完成，應按確認鍵`);
                        this.state.gameState.normalModeErrors.pinCancelErrorCount++;
                        const errorCount = this.state.gameState.normalModeErrors.pinCancelErrorCount;
                        ATM.Debug.log('hint', `🔢 [Normal-Mode] 密碼完成後按錯誤次數: ${errorCount}`);
                        const errorAudio = new Audio('../audio/units/error.mp3');
                        errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                        this.TimerManager.setTimeout(() => {
                            this.speech.speak('密碼已輸入完成，請按確認鍵');
                        }, 300, 'speechDelay');
                        if (errorCount >= 3) {
                            ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在確認鍵上`);
                            this.TimerManager.setTimeout(() => {
                                this.showATMEasyHint('pin_confirm', '.screen-key-btn[data-key="enter"]', true);
                            }, 500, 'hintAnimation');
                        }
                        return;
                    }

                    const expectedDigit = correctPin.charAt(progress);

                    if (key !== expectedDigit) {
                        // 輸入錯誤的數字，不播放 beep，直接播放錯誤音效
                        ATM.Debug.log('hint', `❌ 密碼輸入錯誤：輸入了 ${key}，應該輸入 ${expectedDigit}`);

                        // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後顯示提示
                        if (isNormalMode) {
                            this.state.gameState.normalModeErrors.pinErrorCount++;
                            const errorCount = this.state.gameState.normalModeErrors.pinErrorCount;
                            ATM.Debug.log('hint', `🔢 [Normal-Mode] 密碼輸入錯誤次數: ${errorCount}`);

                            if (errorCount >= 3) {
                                // 達到3次，立即顯示提示動畫
                                ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在正確按鍵上`);
                                this.showATMEasyHint('pin_input', `.screen-key-btn[data-key="${expectedDigit}"]`, true);
                            }
                        }

                        // 🔧 [修正] 錯誤時不清除提示，保持提示動畫持續顯示
                        // this.clearATMEasyHint(); // 註解掉，讓錯誤時提示動畫繼續存在

                        const errorAudio = new Audio('../audio/units/error.mp3');
                        errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                        // 播放語音提示（提示動畫保持不變）
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            this.speech.speak(`請輸入 ${expectedDigit}`);
                        }, 300, 'speechDelay');

                        return; // 直接返回，不執行後續邏輯
                    } else if (isNormalMode) {
                        // 🔧 [新增] 普通模式：正確輸入後重置錯誤計數
                        this.state.gameState.normalModeErrors.pinErrorCount = 0;
                    }
                }
            }

            this.audio.playBeep();

            // 🔧 [修正] 移除重複的語音播放，語音已在bindScreenKeypadEvents中處理
            switch (key) {
                case '0': case '1': case '2': case '3': case '4':
                case '5': case '6': case '7': case '8': case '9':
                    // 語音已在按鈕點擊事件中播放，這裡不重複播放
                    this.handleNumberInput(key);
                    break;
                case 'enter':
                    // 語音已在按鈕點擊事件中播放，這裡不重複播放
                    this.handleEnterKey();
                    break;
                case 'clear':
                    // 語音已在按鈕點擊事件中播放，這裡不重複播放
                    this.handleClearKey();
                    break;
                case 'cancel':
                    // 語音已在按鈕點擊事件中播放，這裡不重複播放
                    this.handleCancelKey();
                    break;
                case 'correction':
                    this.speech.speak('更正');
                    this.handleCorrectionKey();
                    break;
                case 'receipt':
                    this.speech.speak('明細');
                    this.handleReceiptKey();
                    break;
            }
            
            ATM.Debug.log('flow', '🔢 按鍵按下:', key);
        },

        handleNumberInput(digit) {
            const currentScene = this.state.gameState.currentScene;

            // 🔧 [v1.2.38] 轉帳相關場景：委託給 handleTransferNumberInput
            if (currentScene === 'bank-code-entry' ||
                currentScene === 'account-entry' ||
                currentScene === 'transfer-amount-entry') {
                this.handleTransferNumberInput(digit, currentScene);
                return;
            }

            if (currentScene === 'pin-entry') {
                // ✅ 簡單/普通模式：密碼驗證已在 handleKeyPress 中處理，這裡只處理正確輸入的情況
                if (this.state.settings.difficulty === 'easy') {
                    // 輸入正確，更新進度
                    this.state.gameState.easyModeHints.pinInputProgress++;

                    const progress = this.state.gameState.easyModeHints.pinInputProgress - 1;
                    ATM.Debug.log('hint', `✅ 密碼輸入正確：第${progress + 1}位 = ${digit}`);
                }

                if (this.state.gameState.currentPin.length < 12) {
                    this.state.gameState.currentPin += digit;
                    this.updateScreen('pin-entry', {
                        currentPin: this.state.gameState.currentPin,
                        attemptsLeft: 3 - this.state.gameState.pinAttempts
                    });

                    // 🔧 [修正] 簡單/普通模式：顯示下一位數字的提示或確認鍵提示
                    if (this.shouldShowHint()) {
                        const correctPin = this.state.gameState.correctPin;
                        const progress = this.state.settings.difficulty === 'easy'
                            ? this.state.gameState.easyModeHints.pinInputProgress
                            : this.state.gameState.currentPin.length;

                        // 🔧 [修正] 清除當前提示（立即清除）
                        this.clearATMEasyHint();

                        if (progress < correctPin.length) {
                            // 還有更多位數要輸入，立即顯示下一位數字的提示
                            const nextDigit = correctPin.charAt(progress);
                            this.showATMEasyHint('pin_input', `.screen-key-btn[data-key="${nextDigit}"]`);
                            ATM.Debug.log('hint', `💛 提示輸入密碼第${progress + 1}位: ${nextDigit}`);
                        } else {
                            // ✅ 密碼輸入完成，立即顯示確認鍵提示
                            this.showATMEasyHint('pin_confirm', '.screen-key-btn[data-key="enter"]');
                            ATM.Debug.log('hint', `💛 密碼輸入完成，提示按確認鍵`);
                        }
                    }
                }
            } else if (currentScene === 'amount-entry') {
                // 🔧 [修正] 簡單模式下，檢查是否已達到指定金額
                if (this.state.settings.difficulty === 'easy' &&
                    this.state.gameState.easyModeHints.assignedAmount) {
                    const assignedAmount = this.state.gameState.easyModeHints.assignedAmount;
                    const currentAmount = this.state.gameState.transactionAmount || 0;

                    // 如果當前金額已經等於指定金額，不再接受輸入
                    if (currentAmount === assignedAmount) {
                        ATM.Debug.log('hint', `❌ 金額已輸入完成（${currentAmount}元），不接受額外輸入`);
                        const errorAudio = new Audio('../audio/units/error.mp3');
                        errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                        return; // 直接返回，不執行後續邏輯
                    }
                }

                // 冒險模式：逐位輸入（2→0→0 = 200），上限 900；一般模式每鍵 × 1000
                const _advMode = !!this._advTargetAmount;
                const _maxAmt  = _advMode ? 900 : 60000;
                const currentAmount = this.state.gameState.transactionAmount || 0;
                const newAmount = _advMode
                    ? currentAmount * 10 + parseInt(digit)
                    : currentAmount * 10 + parseInt(digit) * 1000;

                if (newAmount <= _maxAmt) {
                    this.state.gameState.transactionAmount = newAmount;
                    this.updateScreen('amount-entry', {
                        showKeypad: true,
                        currentAmount: newAmount
                    });
                }
            }
        },

        handleEnterKey() {
            // 🔧 [新增] 防止重複按鍵
            if (this._enterKeyLock) {
                ATM.Debug.warn('event', '⚠️ Enter鍵已鎖定，忽略重複按鍵');
                return;
            }

            const currentScene = this.state.gameState.currentScene;

            // 🔧 [v1.2.38] 轉帳相關場景：委託給 handleTransferEnter
            if (currentScene === 'bank-code-entry' ||
                currentScene === 'account-entry' ||
                currentScene === 'transfer-amount-entry') {
                this.handleTransferEnter(currentScene);
                return;
            }

            if (currentScene === 'pin-entry') {
                // ✅ 簡單模式：檢查密碼是否完整輸入
                if (this.state.settings.difficulty === 'easy') {
                    const correctPin = this.state.gameState.correctPin;
                    const progress = this.state.gameState.easyModeHints.pinInputProgress;

                    if (progress < correctPin.length) {
                        // 密碼尚未輸入完整
                        const expectedDigit = correctPin.charAt(progress);
                        ATM.Debug.log('hint', `❌ 密碼未輸入完整：只輸入了 ${progress} 位，還需要輸入第 ${progress + 1} 位: ${expectedDigit}`);

                        // 播放錯誤音效
                        const errorAudio = new Audio('../audio/units/error.mp3');
                        errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                        // 播放語音提示
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            this.speech.speak(`請輸入 ${expectedDigit}`);
                        }, 300, 'speechDelay');

                        return; // 阻止驗證
                    }
                }

                // 🔧 [新增] 鎖定Enter鍵，防止重複觸發
                this._enterKeyLock = true;
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this._enterKeyLock = false;
                }, 2000, 'uiLock');

                this.validatePin();
            } else if (currentScene === 'amount-entry') {
                // 冒險模式：確認時驗證金額必須等於指定目標
                if (this._advTargetAmount) {
                    const entered = this.state.gameState.transactionAmount || 0;
                    if (entered !== this._advTargetAmount) {
                        const errorAudio = new Audio('../audio/units/error.mp3');
                        errorAudio.play().catch(() => {});
                        this.state.gameState.transactionAmount = 0;
                        this.updateScreen('amount-entry', {
                            showKeypad: true,
                            currentAmount: 0
                        });
                        this.speech.speak(`金額不對，請重新輸入 ${this.convertAmountToSpeech(this._advTargetAmount)}`);
                        return;
                    }
                }
                this.processTransaction();
            }
        },

        handleClearKey() {
            // ✅ 步驟驗證：檢查是否允許使用清除鍵
            if (!this.validateAction('handleClearKey', '.screen-keypad')) {
                return;
            }

            const currentScene = this.state.gameState.currentScene;

            if (currentScene === 'pin-entry') {
                // 自由模式/普通模式：允許清除
                this.state.gameState.currentPin = '';
                this.updateScreen('pin-entry', {
                    currentPin: '',
                    attemptsLeft: 3 - this.state.gameState.pinAttempts
                });
            } else if (currentScene === 'amount-entry') {
                this.state.gameState.transactionAmount = 0;
                this.updateScreen('amount-entry', {
                    showKeypad: true,
                    currentAmount: 0
                });
            }
        },

        handleCancelKey() {
            // ✅ 步驟驗證：檢查是否允許使用取消鍵
            if (!this.validateAction('handleCancelKey', '.screen-keypad')) {
                return;
            }

            const currentScene = this.state.gameState.currentScene;

            if (currentScene === 'amount-entry') {
                // 檢查是否在數字鍵盤模式，如果是，返回金額選擇頁面
                const currentScreenContent = document.getElementById('screen-content').innerHTML;
                if (currentScreenContent.includes('screen-keypad')) {
                    this.audio.playBeep();
                    this.state.gameState.transactionAmount = 0;
                    this.updateScreen('amount-entry', { showKeypad: false });
                    return;
                }
            }

            // 🔧 [新增] 密碼輸入畫面：普通模式下視為錯誤操作
            if (currentScene === 'pin-entry') {
                // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後顯示提示
                if (this.state.settings.difficulty === 'normal') {
                    this.state.gameState.normalModeErrors.pinCancelErrorCount++;
                    const errorCount = this.state.gameState.normalModeErrors.pinCancelErrorCount;
                    ATM.Debug.log('hint', `🔢 [Normal-Mode] 密碼輸入時按取消鈕錯誤次數: ${errorCount}`);

                    // 播放錯誤音效
                    const errorAudio = new Audio('../audio/units/error.mp3');
                    errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                    // 語音提示
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.speech.speak('請繼續輸入密碼');
                    }, 300, 'speechDelay');

                    // 🔧 [新增] 錯誤3次後立即顯示提示
                    if (errorCount >= 3) {
                        ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，立即顯示提示動畫在正確按鍵上`);

                        // 找到下一個應該輸入的數字
                        const correctPin = this.state.gameState.correctPin;
                        const currentPinLength = this.state.gameState.currentPin.length;

                        if (currentPinLength < correctPin.length) {
                            const expectedDigit = correctPin.charAt(currentPinLength);
                            // 🔧 [Phase 2d] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                this.showATMEasyHint('pin_input', `.screen-key-btn[data-key="${expectedDigit}"]`, true);
                            }, 500, 'hintAnimation');
                        } else {
                            // 密碼已輸入完成，提示按確認鍵
                            // 🔧 [Phase 2d] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                this.showATMEasyHint('pin_confirm', '.screen-key-btn[data-key="enter"]', true);
                            }, 500, 'hintAnimation');
                        }
                    }

                    return; // 不執行取消操作
                }

                // 其他難度模式：播放「交易已取消」語音，然後顯示退卡畫面和動畫
                this.speech.speak('交易已取消', {
                    callback: () => {
                        this.showCardEjectScreenForEndTransaction();
                    }
                });
                return;
            }

            // 其他情況：取消當前操作，返回主選單
            this.speech.speak('交易已取消', {
                callback: () => {
                    this.resetTransaction();
                    this.updateScreen('menu');
                    this.state.gameState.currentScene = 'menu';

                    // 🔧 [新增] 重置流程步驟到選擇服務，允許重新選擇其他服務
                    this.updateFlowStep('SELECT_SERVICE', this.state.gameState.currentFlowStep || 'CANCELLED');
                }
            });
        },

        handleCorrectionKey() {
            const currentScene = this.state.gameState.currentScene;

            if (currentScene === 'pin-entry' && this.state.gameState.currentPin.length > 0) {
                // 🔧 [修正] 簡單模式：禁止使用修改鍵
                if (this.state.settings.difficulty === 'easy') {
                    ATM.Debug.log('hint', '❌ 簡單模式下不允許使用修改鍵');

                    // 播放錯誤音效
                    const errorAudio = new Audio('../audio/units/error.mp3');
                    errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                    // 提示用戶應該按的正確數字
                    const correctPin = this.state.gameState.correctPin;
                    const progress = this.state.gameState.easyModeHints.pinInputProgress;
                    const expectedDigit = correctPin.charAt(progress);

                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.speech.speak(`請輸入 ${expectedDigit}`);
                    }, 300, 'speechDelay');

                    return; // 不執行修改操作
                }

                // 一般模式：允許修改
                this.state.gameState.currentPin = this.state.gameState.currentPin.slice(0, -1);
                this.updateScreen('pin-entry', {
                    currentPin: this.state.gameState.currentPin,
                    attemptsLeft: 3 - this.state.gameState.pinAttempts
                });
            } else if (currentScene === 'amount-entry' && this.state.gameState.transactionAmount > 0) {
                this.state.gameState.transactionAmount = Math.floor(this.state.gameState.transactionAmount / 10);
                this.updateScreen('amount-entry', {
                    currentAmount: this.state.gameState.transactionAmount
                });
            }
        },

        handleReceiptKey() {
            this.printReceipt();
        },


        // =====================================================
        // 業務邏輯處理
        // =====================================================
        handleCardSlotClick() {
            // ✅ 修正：卡槽點擊不應直接插卡，應該只是提示
            // 只有點擊卡片本身或「插入卡片」按鈕才會觸發插卡動作
            if (!this.state.gameState.cardInserted && this.state.gameState.currentScene === 'insert-card') {
                this.speech.speak('請點擊下方的金融卡或按鈕');
            }
        },

        // 處理金融卡點擊事件
        handleCardClick() {
            if (!this.state.gameState.cardInserted && this.state.gameState.currentScene === 'insert-card') {
                // ✅ 步驟驗證（插卡場景）
                if (!this.validateAction('handleCardClick', '#atm-card')) {
                    return;
                }

                // ✅ 所有難度模式：點擊卡片立即清除提示動畫
                this.clearATMEasyHint();

                this.performCardInsertAnimation();
            } else if (this.state.gameState.currentScene === 'take-card' ||
                       this.state.gameState.currentScene === 'card-eject' ||
                       this.state.gameState.currentScene === 'card-eject-end') {
                // ✅ 步驟驗證（取卡場景）
                if (!this.validateAction('handleCardClick', '#atm-card')) {
                    return;
                }

                // ✅ 所有難度模式：點擊卡片立即清除提示動畫
                this.clearATMEasyHint();

                // 取回卡片的邏輯已在其他地方處理
            }
        },

        // 🔧 [新增] 在「請插入金融卡」畫面的卡片下方添加「插入卡片」按鈕
        addInsertCardButton() {
            const cardArea = document.querySelector('.atm-card-area');
            if (!cardArea) {
                ATM.Debug.error('🏧 找不到卡片展示區域');
                return;
            }

            // 檢查是否已經存在按鈕，避免重複添加
            const existingBtn = document.getElementById('insert-card-btn-container');
            if (existingBtn) {
                ATM.Debug.log('flow', '🏧 插入卡片按鈕已存在，不重複添加');
                return;
            }

            // 創建按鈕容器，使用絕對定位放在卡片正下方
            const btnContainer = document.createElement('div');
            btnContainer.id = 'insert-card-btn-container';
            btnContainer.style.cssText = `
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translate(-50%, -60px);
                z-index: 10001;
                text-align: center;
                width: 100%;
            `;

            // 創建按鈕
            const insertCardBtn = document.createElement('button');
            insertCardBtn.id = 'insert-card-btn';
            insertCardBtn.innerHTML = '💳 插入卡片';
            insertCardBtn.style.cssText = `
                background: linear-gradient(135deg, #2196f3, #1976d2);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 25px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4);
                transition: all 0.3s ease;
                font-family: 'Microsoft JhengHei', sans-serif;
            `;

            // 點擊事件處理器
            const clickHandler = () => {
                ATM.Debug.log('flow', '🏧 用戶點擊了「插入卡片」按鈕');

                // ✅ 所有難度模式：點擊按鈕立即清除提示動畫
                this.clearATMEasyHint();

                // 移除按鈕
                btnContainer.remove();

                // 執行卡片插入動畫（卡片本身已經有 handleCardClick 處理點擊事件）
                this.performCardInsertAnimation();
            };

            // 按鈕點擊事件
            insertCardBtn.addEventListener('click', clickHandler);
            btnContainer.appendChild(insertCardBtn);
            cardArea.appendChild(btnContainer);

            ATM.Debug.log('flow', '🏧 已在卡片下方添加「插入卡片」按鈕，卡片本身也可點擊');
        },

        // 執行卡片插入動畫效果
        performCardInsertAnimation() {
            // 🔧 [新增] 移除「插入卡片」按鈕（無論是點擊按鈕還是直接點擊卡片）
            const insertCardBtnContainer = document.getElementById('insert-card-btn-container');
            if (insertCardBtnContainer) {
                insertCardBtnContainer.remove();
                ATM.Debug.log('flow', '🏧 已移除「插入卡片」按鈕');
            }

            const cardElement = document.getElementById('atm-card');
            const cardSlot = document.getElementById('card-slot');
            const cardLight = document.getElementById('card-light');
            const cardSlit = document.getElementById('card-slit');

            if (cardElement && cardSlot) {
                // 播放音效
                this.audio.playBeep();

                // 添加插入動畫類
                cardElement.classList.add('card-inserting');
                
                // 動畫進行中時點亮插槽燈光和細縫
                // 🔧 [Phase 2a] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    if (cardLight) {
                        cardLight.classList.add('active');
                    }
                    if (cardSlit) {
                        cardSlit.classList.add('active');
                    }
                }, 1000, 'cardAnimation'); // 在動畫中後段點亮燈光

                // 動畫完成後觸發讀取流程
                // 🔧 [Phase 2a] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    cardElement.classList.remove('card-inserting');
                    cardElement.classList.add('card-inserted');

                    // 🔧 [強化] 確保卡片完全隱藏
                    cardElement.style.display = 'none';

                    // 🔧 [新增] 動畫完成後顯示讀取畫面並播放語音
                    this.updateScreen('card-reading');
                    this.state.gameState.currentScene = 'card-reading';

                    // 🔧 [新增] 在動畫完成後播放語音提示
                    this.speech.speak('卡片資料讀取中，請稍候', {
                        callback: () => {
                            // 讀取完成後進入密碼輸入
                            // 🔧 [Phase 2a] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                // 🔧 [修正] 先切換到密碼輸入畫面，然後播放語音
                                this.insertCard();

                                // 稍微延遲，確保畫面切換完成後播放語音
                                // 🔧 [Phase 2a] 遷移至 TimerManager
                                this.TimerManager.setTimeout(() => {
                                    this.speech.speak('請輸入晶片金融卡密碼，輸入完成後，請按確認鍵', {
                                        callback: () => {
                                            // 語音播放完成，設置密碼畫面就緒標記
                                            this.state.gameState.pinScreenReady = true;
                                            ATM.Debug.log('flow', ' 密碼輸入語音播放完成，設置就緒標記');
                                        }
                                    });
                                }, 200, 'cardAnimation');
                            }, 1500, 'cardAnimation'); // 模擬讀取時間
                        }
                    });
                }, 1800, 'cardAnimation'); // 確保動畫完整播放
            }
        },

        insertCard() {
            // 🔧 [新增] 防止重複插卡
            if (this.state.gameState.cardInserted) {
                ATM.Debug.warn('audio', '⚠️ 卡片已插入，忽略重複插卡操作');
                return;
            }

            // ✅ 步驟驗證
            if (!this.validateAction('insertCard', '.atm-card-area')) {
                return;
            }

            // ✅ 簡單模式：清除插卡提示
            if (this.shouldShowHint()) {
                this.clearATMEasyHint();
            }

            this.state.gameState.cardInserted = true;

            // 🔧 [新增] 移除「插入卡片」按鈕
            const insertCardBtn = document.getElementById('insert-card-btn-container');
            if (insertCardBtn) {
                insertCardBtn.remove();
                ATM.Debug.log('flow', '🏧 已移除「插入卡片」按鈕');
            }

            // 燈光效果已經在動畫中處理，這裡直接進入下一步
            this.updateScreen('pin-entry', {
                currentPin: '',
                attemptsLeft: 3 - this.state.gameState.pinAttempts
            });
            this.state.gameState.currentScene = 'pin-entry';

            // ✅ 步驟切換：插卡成功 → 輸入密碼
            this.updateFlowStep('ENTER_PIN', 'INSERT_CARD');

            // ✅ 簡單模式：初始化密碼輸入進度
            if (this.state.settings.difficulty === 'easy') {
                this.state.gameState.easyModeHints.pinInputProgress = 0;
            }

            // 🔧 [修正] 簡單/普通模式：顯示第一位數字的提示
            if (this.shouldShowHint()) {
                const correctPin = this.state.gameState.correctPin;
                const firstDigit = correctPin.charAt(0);

                // 🔧 [Phase 2d] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.showATMEasyHint('pin_input', `.screen-key-btn[data-key="${firstDigit}"]`);
                    ATM.Debug.log('hint', `💛 提示輸入密碼第1位: ${firstDigit}`);
                }, 500, 'hintAnimation');
            }
        },

        validatePin() {
            const enteredPin = this.state.gameState.currentPin;
            const correctPin = this.state.gameState.correctPin;

            // ✅ 修改1：只要有輸入數字就可以按確認進行驗證
            if (enteredPin.length === 0) {
                // 播放錯誤音效
                const errorAudio = new Audio('../audio/units/error.mp3');
                errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                // 語音提示
                this.speech.speak('請先輸入密碼');

                this.updateScreen('pin-entry', {
                    currentPin: '',
                    error: '請輸入密碼',
                    attemptsLeft: 3 - this.state.gameState.pinAttempts
                });
                return;
            }

            if (enteredPin === correctPin) {
                // ✅ 步驟切換：密碼正確 → 選擇功能
                this.updateFlowStep('SELECT_SERVICE', 'ENTER_PIN');
                if (!this.state.settings.clickMode) this.playStepSuccess();

                // 🔧 [新增] 普通模式：密碼正確後重置取消錯誤計數
                if (this.state.settings.difficulty === 'normal') {
                    this.state.gameState.normalModeErrors.pinCancelErrorCount = 0;
                    ATM.Debug.log('hint', '🔄 [Normal-Mode] 密碼正確，重置取消錯誤計數');
                }

                this.speech.speak('密碼正確', {
                    callback: () => {
                        // 🔧 [新增] 在顯示菜單前，先顯示任務提示彈窗
                        this.showTaskReminderModal(() => {
                            this.updateScreen('menu');
                            this.state.gameState.currentScene = 'menu';

                            // ✅ 提示邏輯已移至 updateScreen 的 menu case 中，避免重複
                        });
                    }
                });
            } else {
                // ✅ 修改2：錯誤時增加嘗試次數
                this.state.gameState.pinAttempts++;

                // ✅ 修改3：播放 error.mp3 音效
                const errorAudio = new Audio('../audio/units/error.mp3');
                errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                if (this.state.gameState.pinAttempts >= 3) {
                    // ✅ 修改4：錯誤3次後顯示卡片鎖定彈窗
                    this.state.gameState.currentPin = '';
                    this.updateScreen('pin-entry', {
                        currentPin: '',
                        error: '密碼錯誤次數過多',
                        attemptsLeft: 0
                    });

                    // 音效播放完後，延遲顯示彈窗
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.showCardLockedModal();
                    }, 1000, 'modalAnimation');
                } else {
                    // ✅ 修改5：顯示剩餘嘗試次數
                    this.state.gameState.currentPin = '';
                    this.updateScreen('pin-entry', {
                        currentPin: '',
                        error: '密碼錯誤，請重新輸入',
                        attemptsLeft: 3 - this.state.gameState.pinAttempts
                    });

                    // ✅ 新增：音效播放完後，播放語音「密碼錯誤，請重新輸入」
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.speech.speak('密碼錯誤，請重新輸入');
                    }, 500, 'speechDelay');
                }
            }
        },

        // ✅ 新增：顯示卡片鎖定彈窗
        showCardLockedModal() {
            ATM.Debug.log('flow', ' 顯示卡片鎖定彈窗');

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            modal.innerHTML = `
                <div class="modal-content" style="
                    background: white;
                    border-radius: 12px;
                    padding: 40px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    text-align: center;
                ">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🔒</div>
                    <h2 style="color: #dc2626; margin-bottom: 20px; font-size: 1.8rem;">金融卡已鎖住</h2>
                    <div style="color: #333; line-height: 1.8; margin-bottom: 30px; font-size: 1.1rem;">
                        <p style="margin-bottom: 15px;">密碼輸入錯誤達3次</p>
                        <p style="margin-bottom: 15px;">您的金融卡已被鎖住，無法再繼續使用</p>
                        <p style="font-weight: 600; color: #dc2626;">請攜帶相關證件親自前往銀行辦理「解鎖」</p>
                    </div>
                    <button id="card-locked-confirm-btn" style="
                        background: #dc2626;
                        color: white;
                        border: none;
                        padding: 15px 40px;
                        border-radius: 8px;
                        font-size: 1.1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-family: 'Microsoft JhengHei', sans-serif;
                    " onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'">
                        確認
                    </button>
                </div>
            `;

            document.body.appendChild(modal);

            // ✅ 新增：彈窗出現後播放語音
            // 🔧 [Phase 2c] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                this.speech.speak('您的金融卡已被鎖住，無法再繼續使用，請攜帶相關證件親自前往銀行辦理解鎖');
            }, 300, 'modalAnimation');

            // 綁定確認按鈕事件
            const confirmBtn = document.getElementById('card-locked-confirm-btn');
            confirmBtn.onclick = () => {
                modal.remove();
                // 結束測驗
                this.endTransaction('密碼錯誤次數過多，卡片已鎖定');
            };
        },

        // 🔧 新增：顯示任務提示彈窗（在選擇服務項目前）
        showTaskReminderModal(callback) {
            ATM.Debug.log('flow', ' 顯示任務提示彈窗');

            const sessionType = this.getActualSessionType();

            // 如果是自由選擇模式，不顯示任務提示
            if (sessionType === 'free') {
                if (callback) callback();
                return;
            }

            const taskNames = {
                'withdraw': '提款',
                'deposit': '存款',
                'inquiry': '餘額查詢',
                'transfer': '轉帳'
            };

            const taskEmojis = {
                'withdraw': '💰',
                'deposit': '💳',
                'inquiry': '📊',
                'transfer': '🔄'
            };

            const taskName = taskNames[sessionType] || '提款';
            const taskEmoji = taskEmojis[sessionType] || '💰';

            const modal = document.createElement('div');
            modal.className = 'modal-overlay task-reminder-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: ${this.state.settings.clickMode ? 10050 : 10200};
            `;

            modal.innerHTML = `
                <div class="modal-content" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 40px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    text-align: center;
                ">
                    <div style="font-size: 4rem; margin-bottom: 20px;">${taskEmoji}</div>
                    <h2 style="color: #ffffff; margin-bottom: 20px; font-size: 1.8rem;">任務提醒</h2>
                    <div style="color: #ffffff; line-height: 1.8; margin-bottom: 30px; font-size: 1.3rem;">
                        <p style="margin-bottom: 15px; font-weight: 600;">請選擇服務項目：</p>
                        <p style="font-size: 2rem; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${taskName}</p>
                    </div>
                    <button id="task-reminder-confirm-btn" style="
                        background: #ffffff;
                        color: #667eea;
                        border: none;
                        padding: 15px 40px;
                        border-radius: 8px;
                        font-size: 1.1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-family: 'Microsoft JhengHei', sans-serif;
                    " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='#ffffff'">
                        我知道了
                    </button>
                </div>
            `;

            document.body.appendChild(modal);

            // 🔧 [新增] 彈窗出現，啟動 0.5 秒安全鎖
            this.enableClickModeWithVisualDelay('TaskModal');

            // 彈窗出現後播放語音
            // 🔧 [Phase 2c] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                this.speech.speak(`請選擇${taskName}`, {
                    callback: () => {
                        // 語音播放完成，設置選擇操作畫面就緒標記
                        this.state.gameState.selectOperationReady = true;
                        ATM.Debug.log('flow', ' 選擇操作語音播放完成，設置就緒標記');
                    }
                });
            }, 300, 'modalAnimation');

            // 綁定確認按鈕事件
            const confirmBtn = document.getElementById('task-reminder-confirm-btn');
            confirmBtn.onclick = () => {
                modal.remove();
                if (callback) callback();
            };
        },

        // 🔧 新增：顯示金額提示彈窗（在選擇提款金額前）
        showAmountReminderModal(amount, callback) {
            ATM.Debug.log('flow', ` 顯示金額提示彈窗: ${amount}`);

            const modal = document.createElement('div');
            modal.className = 'modal-overlay amount-reminder-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: ${this.state.settings.clickMode ? 10050 : 10200};
            `;

            modal.innerHTML = `
                <div class="modal-content" style="
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    border-radius: 12px;
                    padding: 40px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    text-align: center;
                ">
                    <div style="font-size: 4rem; margin-bottom: 20px;">💵</div>
                    <h2 style="color: #ffffff; margin-bottom: 20px; font-size: 1.8rem;">金額提醒</h2>
                    <div style="color: #ffffff; line-height: 1.8; margin-bottom: 30px; font-size: 1.3rem;">
                        <p style="margin-bottom: 15px; font-weight: 600;">請提領金額：</p>
                        <p style="font-size: 2.5rem; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">NT$ ${amount.toLocaleString()}</p>
                    </div>
                    <button id="amount-reminder-confirm-btn" style="
                        background: #ffffff;
                        color: #f5576c;
                        border: none;
                        padding: 15px 40px;
                        border-radius: 8px;
                        font-size: 1.1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-family: 'Microsoft JhengHei', sans-serif;
                    " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='#ffffff'">
                        我知道了
                    </button>
                </div>
            `;

            document.body.appendChild(modal);

            // 🔧 [新增] 彈窗出現，啟動 0.5 秒安全鎖
            this.enableClickModeWithVisualDelay('AmountModal');

            // 彈窗出現後播放語音
            // 🔧 [Phase 2c] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                this.speech.speak(`請提領 ${this.convertAmountToSpeech(amount)}`);
            }, 300, 'modalAnimation');

            // 綁定確認按鈕事件
            const confirmBtn = document.getElementById('amount-reminder-confirm-btn');
            confirmBtn.onclick = () => {
                modal.remove();
                if (callback) callback();
            };
        },

        // 🔧 [v1.2.38] 顯示轉帳金額提醒彈窗
        showTransferAmountReminderModal(amount, bankName, callback) {
            ATM.Debug.log('flow', ` 顯示轉帳金額提示彈窗: ${amount} to ${bankName}`);

            const modal = document.createElement('div');
            modal.className = 'modal-overlay transfer-amount-reminder-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: ${this.state.settings.clickMode ? 10050 : 10200};
            `;

            modal.innerHTML = `
                <div class="modal-content" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 40px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    text-align: center;
                ">
                    <div style="font-size: 4rem; margin-bottom: 20px;">💸</div>
                    <h2 style="color: #ffffff; margin-bottom: 20px; font-size: 1.8rem;">金額提醒</h2>
                    <div style="color: #ffffff; line-height: 1.8; margin-bottom: 30px; font-size: 1.3rem;">
                        <p style="margin-bottom: 15px; font-weight: 600;">請轉帳金額：</p>
                        <p style="font-size: 2.5rem; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); margin-bottom: 15px;">NT$ ${amount.toLocaleString()}</p>
                        <p style="margin-bottom: 10px; font-weight: 600;">至</p>
                        <p style="font-size: 1.5rem; font-weight: 600;">${bankName}</p>
                    </div>
                    <button id="transfer-amount-reminder-confirm-btn" style="
                        background: #ffffff;
                        color: #764ba2;
                        border: none;
                        padding: 15px 40px;
                        border-radius: 8px;
                        font-size: 1.1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-family: 'Microsoft JhengHei', sans-serif;
                    " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='#ffffff'">
                        我知道了
                    </button>
                </div>
            `;

            document.body.appendChild(modal);

            // 🔧 [新增] 彈窗出現，啟動 0.5 秒安全鎖
            this.enableClickModeWithVisualDelay('TransferAmountModal');

            // 彈窗出現後播放語音
            // 🔧 [Phase 2c] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                this.speech.speak(`請轉帳 ${this.convertAmountToSpeech(amount)} 至 ${bankName}`);
            }, 300, 'modalAnimation');

            // 綁定確認按鈕事件
            const confirmBtn = document.getElementById('transfer-amount-reminder-confirm-btn');
            confirmBtn.onclick = () => {
                modal.remove();
                if (callback) callback();
            };
        },

        selectMenuOption(option) {
            // ✅ 步驟驗證
            if (!this.validateAction('selectMenuOption', `.side-label[data-action="right-${option}"]`)) {
                return;
            }

            // 🔧 [修正] 所有難度模式：驗證是否選擇了正確的功能（指定任務模式下）
            const taskType = this.getActualSessionType();
            const taskMapping = {
                'withdraw': 'withdraw',
                'deposit': 'deposit',
                'inquiry': 'inquiry',
                'transfer': 'transfer'
            };

            // 如果任務類型是指定的（不是自由選擇），驗證是否選擇了正確的功能
            if (taskType !== 'free' && taskMapping[taskType] !== option) {
                const taskNames = {
                    'withdraw': '提款',
                    'deposit': '存款',
                    'inquiry': '查詢',
                    'transfer': '轉帳'
                };

                // 顯示錯誤提示
                ATM.Debug.log('hint', `❌ 選擇錯誤功能：點擊了 ${option}，應該點擊 ${taskType}`);

                // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後顯示提示
                if (this.state.settings.difficulty === 'normal') {
                    this.state.gameState.normalModeErrors.mainMenuErrorCount++;
                    const errorCount = this.state.gameState.normalModeErrors.mainMenuErrorCount;
                    ATM.Debug.log('hint', `🔢 [Normal-Mode] 主選單選擇錯誤次數: ${errorCount}`);
                }

                // 播放錯誤音效
                const errorAudio = new Audio('../audio/units/error.mp3');
                errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                // 設置正確的提示數據（延遲以便先播放音效）
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    const correctAction = {
                        'withdraw': 'right-1',
                        'deposit': 'right-2',
                        'inquiry': 'right-3',
                        'transfer': 'right-4'
                    }[taskType];

                    // 🔧 [修改] 普通模式：錯誤3次後立即顯示提示
                    if (this.state.settings.difficulty === 'normal' &&
                        this.state.gameState.normalModeErrors.mainMenuErrorCount >= 3) {
                        ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，立即顯示提示動畫在正確選項上`);
                        this.showATMEasyHint('select_service', `.side-label[data-action="${correctAction}"]`, true);
                    } else {
                        // 🔧 設置提示數據：
                        // - 簡單模式：立即自動顯示
                        // - 普通模式（<3次）：10秒後自動顯示
                        // - 困難模式：只設置數據，不自動顯示（需手動按提示按鈕）
                        this.showATMEasyHint('select_service', `.side-label[data-action="${correctAction}"]`);
                    }

                    // 🔧 [修正] 困難模式不播放語音提示，只有簡單/普通模式才播放
                    if (this.shouldShowHint()) {
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            this.speech.speak(`請選擇${taskNames[taskType]}`);
                        }, 300, 'speechDelay');
                    }
                }, 300, 'hintAnimation');

                // 🔧 [修正] 錯誤選擇後立即釋放鎖定，允許用戶重新選擇
                this._menuClickLock = false;
                return; // 阻止繼續執行
            }

            // 🔧 [新增] 普通模式：選擇正確後重置錯誤計數
            if (this.state.settings.difficulty === 'normal') {
                this.state.gameState.normalModeErrors.mainMenuErrorCount = 0;
            }

            // 選擇正確，清除提示
            if (this.shouldShowHint()) {
                this.clearATMEasyHint();
            }
            if (!this.state.settings.clickMode) this.playStepSuccess();

            switch (option) {
                case 'withdraw':
                    this.startWithdrawProcess();
                    break;
                case 'deposit':
                    this.startDepositProcess();
                    break;
                case 'inquiry':
                    this.startInquiryProcess();
                    break;
                case 'transfer':
                    this.startTransferProcess();
                    break;
                case 'exit':
                    // 🔧 [修正] 困難模式+自選服務：只顯示退卡動畫，不顯示現金
                    if (this.state.settings.difficulty === 'hard' && this.state.settings.sessionType === 'free') {
                        this.speech.speak('結束交易，請取出您的金融卡', {
                            callback: () => {
                                this.showCardEjectScreenForEndTransaction();
                            }
                        });
                    } else {
                        this.startEndTransactionWithCash();
                    }
                    break;
            }
        },

        getSessionTypeName(sessionType) {
            const names = {
                withdraw: '提款',
                deposit: '存款',
                inquiry: '餘額查詢',
                transfer: '轉帳',
                random: '隨機'
            };
            return names[sessionType] || '提款';
        },

        // 取得本輪實際任務類型（隨機模式回傳 currentRandomType，其他回傳 settings.sessionType）
        getActualSessionType() {
            if (this.state.settings.sessionType === 'random') {
                return this.state.quiz.currentRandomType || 'withdraw';
            }
            return this.state.settings.sessionType;
        },

        // 隨機模式：從 bag 取下一種類型（bag 空時重新洗牌補滿）
        pickNextRandomType() {
            if (this.state.quiz.randomBag.length === 0) {
                const types = ['withdraw', 'deposit', 'inquiry', 'transfer'];
                for (let i = types.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [types[i], types[j]] = [types[j], types[i]];
                }
                this.state.quiz.randomBag = types;
                ATM.Debug.log('flow', `[Random] Bag 補滿並洗牌：[${this.state.quiz.randomBag.join(', ')}]`);
            }
            this.state.quiz.currentRandomType = this.state.quiz.randomBag.shift();
            ATM.Debug.log('flow', `[Random] 本輪類型：${this.state.quiz.currentRandomType}，剩餘：[${this.state.quiz.randomBag.join(', ')}]`);
        },

        // 取得詳細交易類別名稱（用於明細表）
        getDetailedTransactionType(sessionType) {
            const names = {
                withdraw: '現金提款',
                deposit: '現金存款',
                inquiry: '餘額查詢',
                transfer: '帳戶轉帳'
            };
            return names[sessionType] || '現金提款';
        },

        startWithdrawProcess() {
            this.state.gameState.currentTransaction.type = 'withdraw';

            // ✅ 所有難度模式：清除選單提示
            this.clearATMEasyHint();

            // ✅ 步驟切換：選擇功能 → 輸入金額
            this.updateFlowStep('ENTER_AMOUNT', 'SELECT_SERVICE');

            // 🔧 [修正] 所有難度模式 + 指定提款（含隨機模式實際為提款）：使用任務畫面已指定的金額
            if (this.getActualSessionType() === 'withdraw') {
                // 直接使用 showMissionScreen() 已設定的指定金額，勿重新隨機以免與任務畫面不一致
                const assignedAmount = this.state.gameState.easyModeHints.assignedAmount;

                ATM.Debug.log('hint', `💛 任務指定金額: NT$ ${assignedAmount?.toLocaleString()} (餘額: ${this.state.gameState.accountBalance.toLocaleString()})`);

                // 在顯示金額選擇畫面前，先顯示金額提示彈窗
                this.showAmountReminderModal(assignedAmount, () => {
                    // 切換到金額輸入畫面
                    this.updateScreen('amount-entry', { currentAmount: 0 });
                    this.state.gameState.currentScene = 'amount-entry';

                    // 延遲顯示提示，確保 DOM 已渲染（困難模式只設置數據，簡單/普通模式會顯示）
                    // 🔧 [Phase 2d] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.showATMEasyHint('select_amount', `.amount-option-btn[data-amount="${assignedAmount}"]`);
                    }, 300, 'hintAnimation');

                    // 稍微延遲確保畫面切換完成後播放語音
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.speech.speak('請輸入提領金額');
                    }, 200, 'speechDelay');
                });
            } else {
                // 自由選擇模式：直接顯示金額選擇畫面
                this.updateScreen('amount-entry', { currentAmount: 0 });
                this.state.gameState.currentScene = 'amount-entry';

                // 稍微延遲確保畫面切換完成後播放語音
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.speech.speak('請輸入提領金額');
                }, 200, 'speechDelay');
            }
        },

        startDepositProcess() {
            this.state.gameState.currentTransaction.type = 'deposit';
            this.state.gameState.isSubFlowActive = true; // ✅ [修改] 啟用子流程鎖定

            // ✅ 簡單模式：清除選單提示
            if (this.shouldShowHint()) {
                this.clearATMEasyHint();
            }

            // ✅ 步驟切換：選擇功能 → 存入現鈔（跳過金額輸入）
            this.updateFlowStep('DEPOSIT_CASH', 'SELECT_SERVICE');

            // 步驟 3：顯示「處理中請稍候」
            this.updateScreen('processing', { message: '處理中，請稍候...' });
            this.state.gameState.currentScene = 'deposit-processing';

            // 2秒後進入步驟 4：存入現鈔畫面
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                this.showDepositCashScreen();
            }, 2000, 'screenTransition');
        },

        // 步驟 4：顯示存入現鈔畫面
        showDepositCashScreen() {
            this.updateScreen('deposit-cash');
            this.state.gameState.currentScene = 'deposit-cash';

            // 🔧 [修正] 先播放語音，播放完成後再執行打開動畫
            this.speech.speak('請存入現鈔', {
                callback: () => {
                    ATM.Debug.log('speech', '🎙️ 「請存入現鈔」語音播放完成，開始打開現金出口動畫');
                    // 打開現金出口動畫
                    this.openCashSlotForDeposit();
                }
            });
        },

        // 打開現金出口（存款用）
        openCashSlotForDeposit() {
            ATM.Debug.log('flow', '🏧 嘗試打開現金出口...');

            // 隱藏金額拉桿（清理舊狀態）
            this.hideAmountSlider();

            // 清空現金出口中的舊金錢顯示
            const cashDisplay = document.querySelector('.cash-display-background');
            if (cashDisplay) {
                cashDisplay.innerHTML = '';
                cashDisplay.style.display = 'none';
                ATM.Debug.log('flow', '🏧 清空現金出口舊內容');
            }

            const cashCover = document.getElementById('cash-display-cover');
            if (cashCover) {
                ATM.Debug.log('flow', '🏧 找到現金出口蓋板，執行開啟動畫');
                cashCover.classList.add('opening');

                // 🔧 [修正] 所有難度模式：設置現金出口提示數據（困難模式只設置數據，不顯示）
                // 🔧 [Phase 2d] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.showATMEasyHint('deposit_cash', '.cash-dispenser-area');
                    ATM.Debug.log('hint', '💛 設置現金出口提示數據');
                }, 500, 'hintAnimation');

                // 在現金出口添加點擊事件
                const cashSlotArea = document.querySelector('.cash-display-area-container');
                if (cashSlotArea) {
                    ATM.Debug.log('flow', '🏧 現金出口點擊事件已綁定');
                    cashSlotArea.style.cursor = 'pointer';
                    cashSlotArea.onclick = () => {
                        ATM.Debug.log('flow', '🏧 現金出口被點擊，打開鈔票選擇窗');

                        // 清除提示
                        if (this.shouldShowHint()) {
                            this.clearATMEasyHint();
                        }

                        this.showBillSelectionModal();
                    };
                } else {
                    ATM.Debug.error('🏧 找不到現金出口區域');
                }
            } else {
                ATM.Debug.error('🏧 找不到現金出口蓋板');
            }
        },

        // 步驟 5：顯示鈔票選擇彈跳窗
        showBillSelectionModal() {
            // 🔧 [修正] 清除所有待觸發的提示，防止延遲提示干擾
            this.clearATMEasyHint();

            // 🔧 [新增] 簡單模式且指定存款（含隨機模式實際為存款）：使用特殊的實際張數彈窗
            if (this.state.settings.difficulty === 'easy' &&
                this.getActualSessionType() === 'deposit' &&
                this.state.gameState.easyModeHints.assignedAmount) {
                this.showEasyModeDepositModal();
                return;
            }

            // 🔧 [統一] 普通模式、困難模式且指定存款（含隨機模式實際為存款）：使用有挑戰性的金錢選擇彈窗
            if ((this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard') &&
                this.getActualSessionType() === 'deposit' &&
                this.state.gameState.easyModeHints.assignedAmount) {
                this.showNormalModeDepositModal();
                return;
            }

            // ==================== [保留] 原始存款彈窗樣式 ====================
            // 用於：一般模式、困難模式、或自由模式的存款
            // =================================================================
            const modal = document.createElement('div');
            modal.id = 'bill-selection-modal';
            modal.className = 'bill-selection-modal';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>💰 選擇存入鈔票</h3>
                        <button class="close-btn" onclick="ATM.closeBillSelectionModal(true)">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="bill-options">
                            <div class="bill-option" data-value="2000">
                                <img src="${this.getRandomMoneyImage(2000)}" alt="2000元鈔票">
                                <span>2000元</span>
                                <div class="count">0 張</div>
                            </div>
                            <div class="bill-option" data-value="1000">
                                <img src="${this.getRandomMoneyImage(1000)}" alt="1000元鈔票">
                                <span>1000元</span>
                                <div class="count">0 張</div>
                            </div>
                            <div class="bill-option" data-value="500">
                                <img src="${this.getRandomMoneyImage(500)}" alt="500元鈔票">
                                <span>500元</span>
                                <div class="count">0 張</div>
                            </div>
                            <div class="bill-option" data-value="100">
                                <img src="${this.getRandomMoneyImage(100)}" alt="100元鈔票">
                                <span>100元</span>
                                <div class="count">0 張</div>
                            </div>
                        </div>
                        <div class="deposit-summary">
                            <p>總金額：<span id="total-amount">0</span> 元</p>
                            <p>總張數：<span id="total-count">0</span> 張</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="cancel-btn" onclick="ATM.closeBillSelectionModal(true)">取消</button>
                        <button class="confirm-btn" onclick="ATM.confirmBillSelection()">確認放入</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.bindBillSelectionEvents();
            this.initializeDepositState();
        },

        // 🔧 [新增] 簡單模式專用：顯示實際張數的金錢圖示彈窗
        showEasyModeDepositModal() {
            const assignedAmount = this.state.gameState.easyModeHints.assignedAmount;
            const billCount = assignedAmount / 1000; // 1000~10000都是1000的倍數，直接除以1000

            const modal = document.createElement('div');
            modal.id = 'bill-selection-modal';
            modal.className = 'bill-selection-modal easy-mode-deposit';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 style="text-align: center; color: white;">💰 存入現鈔 ${assignedAmount.toLocaleString()} 元</h3>
                    </div>
                    <div class="modal-body easy-deposit-body">
                        <div class="money-display-grid" style="
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                            gap: 15px;
                            padding: 20px;
                            justify-items: center;
                        ">
                            ${this.generateMoneyIcons(billCount)}
                        </div>
                        <div class="deposit-summary" style="margin-top: 20px;">
                            <p style="font-size: 1.3rem;"><strong>已存入金額：<span id="deposited-amount">0</span> 元（<span id="deposited-count">0</span>張1000元）</strong></p>
                        </div>
                    </div>
                </div>
                <style>
                    .money-icon-item {
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                        width: 100px;
                    }

                    .money-icon-item:hover {
                        transform: scale(1.05);
                        filter: brightness(1.1);
                    }

                    .money-icon-item img {
                        width: 100%;
                        height: auto;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    }

                    .money-icon-item .money-label {
                        display: block;
                        margin-top: 5px;
                        font-size: 0.9rem;
                        color: #666;
                        font-weight: bold;
                    }

                    .money-icon-item.deposited {
                        animation: depositAnimation 0.5s ease-out forwards;
                    }
                </style>
            `;

            document.body.appendChild(modal);

            // 自動設定存款金額為指定金額（全部使用1000元鈔票）
            this.initializeDepositState();
            this.state.gameState.depositBills[1000] = billCount;

            // 🔧 [新增] 綁定金錢圖示點擊事件
            this.bindMoneyIconClickEvents();
        },

        // 🔧 [新增] 生成金錢圖示HTML（1000元鈔票）
        generateMoneyIcons(count) {
            let html = '';
            for (let i = 0; i < count; i++) {
                html += `
                    <div class="money-icon-item" data-bill-index="${i}">
                        <img src="${this.getRandomMoneyImage(1000)}" alt="1000元鈔票">
                        <span class="money-label">1000元</span>
                    </div>
                `;
            }
            return html;
        },

        // 🔧 [新增] 綁定金錢圖示點擊事件
        bindMoneyIconClickEvents() {
            const moneyIcons = document.querySelectorAll('.money-icon-item');
            const totalCount = moneyIcons.length;
            const assignedAmount = this.state.gameState.easyModeHints.assignedAmount;
            let depositedCount = 0;
            let speechTimeout = null; // 用於延遲語音播放

            moneyIcons.forEach((icon) => {
                icon.addEventListener('click', () => {
                    // 如果已經被點擊過，不重複處理
                    if (icon.classList.contains('deposited')) {
                        return;
                    }

                    // 添加消失動畫
                    icon.classList.add('deposited');

                    // 更新已存入數量
                    depositedCount++;
                    const depositedCountEl = document.getElementById('deposited-count');
                    const depositedAmountEl = document.getElementById('deposited-amount');

                    if (depositedCountEl && depositedAmountEl) {
                        depositedCountEl.textContent = depositedCount;
                        depositedAmountEl.textContent = (depositedCount * 1000).toLocaleString();
                    }

                    // 清除之前的語音播放計時器
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    if (speechTimeout) {
                        this.TimerManager.clearTimeout(speechTimeout);
                    }

                    // 延遲播放語音（快速點擊時只播放最後的金額）
                    const currentAmount = depositedCount * 1000;
                    const isLastBill = (depositedCount === totalCount);

                    // 🔧 [Phase 3] 遷移至 TimerManager
                    speechTimeout = this.TimerManager.setTimeout(() => {
                        this.speech.speak(`存入${this.convertAmountToSpeech(currentAmount)}`, {
                            callback: () => {
                                // ✅ 如果是最後一張鈔票，語音播放完成後才關閉彈窗
                                if (isLastBill) {
                                    this.closeBillSelectionModal();
                                    // 在現金出口顯示存入的金錢圖示
                                    this.displayDepositedMoney();
                                    // 播放語音並設置確認鍵提示數據
                                    this.speech.speak('鈔票放妥後，請按確認鍵', {
                                        callback: () => {
                                            // ✅ 語音播放完成後，設置確認鍵提示數據（困難模式只設置數據，不顯示）
                                            // 🔧 [Phase 2d] 遷移至 TimerManager
                                            this.TimerManager.setTimeout(() => {
                                                this.showATMEasyHint('deposit_confirm_btn', '.confirm-action[data-action="confirm"]');
                                            }, 300, 'hintAnimation');
                                        }
                                    });
                                }
                            }
                        });
                    }, 300, 'speechDelay');

                    // 動畫完成後移除元素
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        icon.remove();
                    }, 500, 'uiAnimation');
                });
            });
        },

        // 🔧 [新增] 簡單模式確認存入
        confirmEasyModeDeposit() {
            // 關閉彈跳窗
            this.closeBillSelectionModal();

            // 在現金出口顯示存入的金錢圖示
            this.displayDepositedMoney();

            // 播放語音並等待用戶按確認
            this.speech.speak('鈔票放妥後，請按確認鍵', {
                callback: () => {
                    // 語音播放完畢後不做任何動作，等待用戶按確認鍵
                }
            });
        },

        // 🔧 [新增] 普通模式存款彈窗：顯示比指定金額多的鈔票，需要用戶選擇正確金額
        showNormalModeDepositModal() {
            const assignedAmount = this.state.gameState.easyModeHints.assignedAmount;
            const correctBillCount = assignedAmount / 1000; // 正確的張數
            const extraBills = Math.floor(Math.random() * 3) + 1; // 隨機多 1-3 張
            const totalBills = correctBillCount + extraBills; // 總張數

            // 🔧 [修正] 每次開啟存款彈窗時，都重新初始化狀態（修復第二題correctAmount未更新的bug）
            this.state.gameState.normalModeDeposit = {
                correctAmount: assignedAmount,
                correctBillCount: correctBillCount,
                totalBills: totalBills,
                extraBills: extraBills,
                selectedBills: new Set(), // 用戶選擇的鈔票索引
                errorCount: 0, // 錯誤次數
                showHint: false, // 是否顯示提示
                autoConfirming: false // 🔧 [新增] 防止重複自動確認
            };
            ATM.Debug.log('coin', `🔧 [普通模式存款] 初始化狀態: correctAmount=${assignedAmount}, correctBillCount=${correctBillCount}`);

            const modal = document.createElement('div');
            modal.id = 'bill-selection-modal';
            modal.className = 'bill-selection-modal normal-mode-deposit';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 style="text-align: center; color: white;">💰 請選擇要存入的現鈔</h3>
                        <p style="text-align: center; color: #ffd700; font-size: 1.1rem; margin-top: 10px;">
                            目標金額：<strong>${assignedAmount.toLocaleString()} 元</strong>
                        </p>
                    </div>
                    <div class="modal-body normal-deposit-body">
                        <div class="money-display-grid" style="
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                            gap: 15px;
                            padding: 20px;
                            justify-items: center;
                        ">
                            ${this.generateNormalModeMoneyIcons(totalBills)}
                        </div>
                        <div class="deposit-summary" style="margin-top: 20px;">
                            <p style="font-size: 1.3rem;"><strong>已存入：<span id="selected-amount">0</span> 元（<span id="selected-count">0</span> 張）</strong></p>
                            <p id="error-message" style="color: #f44336; font-size: 1.1rem; min-height: 24px; margin-top: 10px;"></p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="confirm-btn" onclick="ATM.confirmNormalModeDeposit()">確認存入</button>
                    </div>
                </div>
                <style>
                    .money-icon-item {
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                        width: 100px;
                        position: relative;
                    }

                    .money-icon-item:hover:not(.locked) {
                        transform: scale(1.05);
                        filter: brightness(1.1);
                    }

                    .money-icon-item img {
                        width: 100%;
                        height: auto;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    }

                    .money-icon-item .money-label {
                        display: block;
                        margin-top: 5px;
                        font-size: 0.9rem;
                        color: #666;
                        font-weight: bold;
                    }

                    .money-icon-item.deposited {
                        animation: depositAnimation 0.5s ease-out forwards;
                    }

                    .money-icon-item.atm-easy-hint::after {
                        content: '👇 點這裡';
                        position: absolute;
                        top: -35px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: rgba(255, 152, 0, 0.95);
                        color: white;
                        padding: 5px 12px;
                        border-radius: 20px;
                        font-size: 14px;
                        font-weight: bold;
                        white-space: nowrap;
                        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
                        animation: hintBounce 0.6s ease-in-out infinite alternate;
                    }

                    .money-icon-item.locked {
                        opacity: 0.3;
                        cursor: not-allowed;
                        pointer-events: none;
                    }

                    /* @keyframes hintBounce 已移至 injectGlobalAnimationStyles() */
                </style>
            `;

            document.body.appendChild(modal);

            // 綁定金錢圖示點擊事件
            this.bindNormalModeMoneyIconClickEvents();

            // 🔧 [新增] 播放語音提示存款金額
            const amountText = this.convertAmountToSpeech(assignedAmount);
            this.speech.speak(`請存入 ${amountText}`);
        },

        // 🔧 [新增] 生成普通模式金錢圖示HTML
        generateNormalModeMoneyIcons(count) {
            let html = '';
            for (let i = 0; i < count; i++) {
                html += `
                    <div class="money-icon-item" data-bill-index="${i}">
                        <img src="${this.getRandomMoneyImage(1000)}" alt="1000元鈔票">
                        <span class="money-label">1000元</span>
                    </div>
                `;
            }
            return html;
        },

        // 🔧 [新增] 綁定普通模式金錢圖示點擊事件
        bindNormalModeMoneyIconClickEvents() {
            const moneyIcons = document.querySelectorAll('.money-icon-item');
            const depositState = this.state.gameState.normalModeDeposit;
            let speechTimeout = null; // 用於延遲語音播放

            moneyIcons.forEach((icon) => {
                icon.addEventListener('click', () => {
                    const billIndex = parseInt(icon.dataset.billIndex);

                    // 🔧 [新增] 如果被鎖定（錯誤3次後的非提示圖示），不處理點擊
                    if (icon.classList.contains('locked')) {
                        ATM.Debug.log('coin', `🔒 [存款] 圖示 ${billIndex} 已被鎖定`);
                        return;
                    }

                    // 如果已經被點擊過（正在消失），不重複處理
                    if (icon.classList.contains('deposited')) {
                        ATM.Debug.warn('coin', `⚠️ [存款] 圖示 ${billIndex} 已有deposited class，跳過`);
                        return;
                    }

                    ATM.Debug.log('coin', `✅ [存款] 點擊圖示 ${billIndex}`);

                    // 標記為已存入
                    depositState.selectedBills.add(billIndex);

                    // 🔧 [新增] 移除提示動畫（如果有）
                    icon.classList.remove('atm-easy-hint');

                    // 🔧 [修正] 確保動畫能正確觸發：先移除class，強制重排，再添加
                    icon.classList.remove('deposited');
                    icon.style.animation = 'none';
                    void icon.offsetHeight;  // 強制瀏覽器重排

                    // 添加消失動畫
                    icon.classList.add('deposited');
                    icon.style.animation = '';  // 恢復CSS定義的動畫
                    ATM.Debug.log('coin', `🎬 [存款] 圖示 ${billIndex} 添加deposited class`);

                    // 更新顯示
                    this.updateNormalModeDepositDisplay();

                    // 播放音效
                    this.audio.playBeep();

                    // 清除之前的語音播放計時器
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    if (speechTimeout) {
                        this.TimerManager.clearTimeout(speechTimeout);
                    }

                    // 延遲播放語音（快速點擊時只播放最後的金額）
                    const currentCount = depositState.selectedBills.size;
                    const currentAmount = currentCount * 1000;

                    // 🔧 [新增] 錯誤3次後，選完所有正確的鈔票自動確認
                    if (depositState.showHint && currentCount === depositState.correctBillCount) {
                        // 🔧 [修正] 防止重複執行自動確認
                        if (depositState.autoConfirming) {
                            return;
                        }
                        depositState.autoConfirming = true;

                        // 立即禁用所有金錢圖示的點擊
                        const allIcons = document.querySelectorAll('.money-icon-item');
                        allIcons.forEach(ic => {
                            ic.classList.add('locked');
                            ic.style.pointerEvents = 'none';
                        });

                        // 🔧 [修正] 先播放"存入XXX元"，再播放"正確！"，最後關閉彈窗
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        speechTimeout = this.TimerManager.setTimeout(() => {
                            this.speech.speak(`存入${this.convertAmountToSpeech(currentAmount)}`, {
                                callback: () => {
                                    // "存入XXX元"播放完成後，播放"正確！"
                                    this.speech.speak('正確！', {
                                        callback: () => {
                                            // ✅ "正確！"語音播放完成後，才執行關閉彈窗等操作
                                            // 設定存款金額狀態（與正常確認流程一致）
                                            this.initializeDepositState();
                                            this.state.gameState.depositBills[1000] = depositState.correctBillCount;

                                            this.closeBillSelectionModal();
                                            this.displayDepositedMoney();
                                            this.speech.speak('鈔票放妥後，請按確認鍵', {
                                                callback: () => {
                                                    // 🔧 [Phase 2d] 遷移至 TimerManager
                                                    this.TimerManager.setTimeout(() => {
                                                        this.showATMEasyHint('deposit_confirm_btn', '.confirm-action[data-action="confirm"]');
                                                    }, 300, 'hintAnimation');
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }, 300, 'speechDelay');
                    } else {
                        // 🔧 [修正] 非自動確認時，正常播放語音
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        speechTimeout = this.TimerManager.setTimeout(() => {
                            this.speech.speak(`存入${this.convertAmountToSpeech(currentAmount)}`);
                        }, 300, 'speechDelay');
                    }

                    // 🔧 [修正] 不移除元素，保留在DOM中以便錯誤時恢復
                });
            });
        },

        // 🔧 [新增] 更新普通模式存款顯示
        updateNormalModeDepositDisplay() {
            const depositState = this.state.gameState.normalModeDeposit;
            const selectedCount = depositState.selectedBills.size;
            const selectedAmount = selectedCount * 1000;

            const selectedCountEl = document.getElementById('selected-count');
            const selectedAmountEl = document.getElementById('selected-amount');

            if (selectedCountEl && selectedAmountEl) {
                selectedCountEl.textContent = selectedCount;
                selectedAmountEl.textContent = selectedAmount.toLocaleString();
            }
        },

        // 🔧 [新增] 確認普通模式存款
        confirmNormalModeDeposit() {
            const depositState = this.state.gameState.normalModeDeposit;
            const selectedCount = depositState.selectedBills.size;
            const selectedAmount = selectedCount * 1000;
            const correctAmount = depositState.correctAmount;

            const errorMessageEl = document.getElementById('error-message');

            // 檢查是否選擇了正確的金額
            if (selectedAmount === correctAmount) {
                // 正確！關閉彈窗並繼續流程
                this.speech.speak(`正確！存入${this.convertAmountToSpeech(correctAmount)}`);

                // 設定存款金額
                this.initializeDepositState();
                this.state.gameState.depositBills[1000] = depositState.correctBillCount;

                // 關閉彈窗
                // 🔧 [Phase 2d] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.closeBillSelectionModal();
                    // 在現金出口顯示存入的金錢圖示
                    this.displayDepositedMoney();
                    // 播放語音並設置確認鍵提示數據
                    this.speech.speak('鈔票放妥後，請按確認鍵', {
                        callback: () => {
                            // ✅ 語音播放完成後，設置確認鍵提示數據（困難模式只設置數據，不顯示）
                            // 🔧 [Phase 2d] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                this.showATMEasyHint('deposit_confirm_btn', '.confirm-action[data-action="confirm"]');
                            }, 300, 'hintAnimation');
                        }
                    });
                }, 1000, 'hintAnimation');
            } else {
                // 錯誤！增加錯誤次數
                depositState.errorCount++;
                ATM.Debug.log('coin', `❌ [普通模式存款] 錯誤次數: ${depositState.errorCount}/3`);

                // 🔧 [新增] 先播放錯誤音效
                const errorAudio = new Audio('../audio/units/error.mp3');
                errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                if (depositState.errorCount >= 3) {
                    // 🔧 [修正] 錯誤 3 次，延遲後播放語音，再顯示提示
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.speech.speak('已錯誤三次，請點擊有提示的鈔票', {
                            callback: () => {
                                // 語音播放完成後，顯示提示動畫
                                this.showNormalModeDepositHint();
                            }
                        });
                    }, 300, 'speechDelay');
                    if (errorMessageEl) {
                        errorMessageEl.textContent = '❌ 已錯誤三次！請點擊有提示的鈔票';
                    }
                } else {
                    // 顯示錯誤提示
                    const diff = selectedAmount - correctAmount;
                    let message = '';
                    let speechText = '';
                    if (diff > 0) {
                        message = `❌ 金額太多了！多了 ${diff} 元`;
                        speechText = `存入金額太多了，請再試一次`;
                    } else {
                        message = `❌ 金額太少了！少 ${Math.abs(diff)} 元`;
                        speechText = `存入金額太少了，請再試一次`;
                    }

                    // 🔧 [修正] 延遲播放語音，先讓錯誤音效播放
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.speech.speak(speechText);
                    }, 300, 'speechDelay');

                    // 🔧 [修正] 錯誤時只復原金錢圖示，不重新創建整個彈窗
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.resetNormalModeDepositIcons(message);
                    }, 1000, 'uiAnimation');
                }
            }
        },

        // 🔧 [新增] 復原普通模式存款金錢圖示（不重新創建彈窗）
        resetNormalModeDepositIcons(errorMessage) {
            const depositState = this.state.gameState.normalModeDeposit;

            // 清空已選擇的鈔票
            depositState.selectedBills.clear();

            // 更新錯誤消息
            const errorMessageEl = document.getElementById('error-message');
            if (errorMessageEl) {
                errorMessageEl.textContent = errorMessage;

                // 🔧 [新增] 2秒後自動清除錯誤訊息
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    if (errorMessageEl) {
                        errorMessageEl.textContent = '';
                    }
                }, 2000, 'uiAnimation');
            }

            // 更新顯示（重置為0）
            const selectedCountEl = document.getElementById('selected-count');
            const selectedAmountEl = document.getElementById('selected-amount');
            if (selectedCountEl) selectedCountEl.textContent = '0';
            if (selectedAmountEl) selectedAmountEl.textContent = '0';

            // 恢復所有已存入的金錢圖示
            const depositedIcons = document.querySelectorAll('.money-icon-item.deposited');
            depositedIcons.forEach(icon => {
                // 🔧 [修正] 先停止動畫，再移除class，再重置樣式
                icon.style.animation = 'none';  // 1. 先停止動畫

                // 強制瀏覽器重繪（確保動畫停止）
                void icon.offsetHeight;

                icon.classList.remove('deposited');  // 2. 移除class

                // 3. 重置所有樣式
                icon.style.opacity = '1';
                icon.style.transform = 'scale(1) translateY(0)';
                icon.style.pointerEvents = '';

                // 再次強制瀏覽器重繪（確保樣式應用）
                void icon.offsetHeight;
            });

            ATM.Debug.log('coin', `🔄 [普通模式存款] 金錢圖示已復原，錯誤次數: ${depositState.errorCount}/3`);
        },

        // 🔧 [新增] 重新創建普通模式存款彈窗（保留錯誤計數）
        recreateNormalModeDepositModal(errorMessage) {
            const depositState = this.state.gameState.normalModeDeposit;
            const assignedAmount = depositState.correctAmount;
            const totalBills = depositState.totalBills;

            // 清空已選擇的鈔票
            depositState.selectedBills.clear();

            // 移除當前彈窗
            const currentModal = document.getElementById('bill-selection-modal');
            if (currentModal) {
                currentModal.remove();
            }

            // 重新創建彈窗
            const modal = document.createElement('div');
            modal.id = 'bill-selection-modal';
            modal.className = 'bill-selection-modal normal-mode-deposit';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 style="text-align: center; color: white;">💰 請選擇要存入的現鈔</h3>
                        <p style="text-align: center; color: #ffd700; font-size: 1.1rem; margin-top: 10px;">
                            目標金額：<strong>${assignedAmount.toLocaleString()} 元</strong>
                        </p>
                    </div>
                    <div class="modal-body normal-deposit-body">
                        <div class="money-display-grid" style="
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                            gap: 15px;
                            padding: 20px;
                            justify-items: center;
                        ">
                            ${this.generateNormalModeMoneyIcons(totalBills)}
                        </div>
                        <div class="deposit-summary" style="margin-top: 20px;">
                            <p style="font-size: 1.3rem;"><strong>已存入：<span id="selected-amount">0</span> 元（<span id="selected-count">0</span> 張）</strong></p>
                            <p id="error-message" style="color: #f44336; font-size: 1.1rem; min-height: 24px; margin-top: 10px;">${errorMessage}</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="confirm-btn" onclick="ATM.confirmNormalModeDeposit()">確認存入</button>
                    </div>
                </div>
                <style>
                    .money-icon-item {
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                        width: 100px;
                        position: relative;
                    }

                    .money-icon-item:hover {
                        transform: scale(1.05);
                        filter: brightness(1.1);
                    }

                    .money-icon-item img {
                        width: 100%;
                        height: auto;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    }

                    .money-icon-item .money-label {
                        display: block;
                        margin-top: 5px;
                        font-size: 0.9rem;
                        color: #666;
                        font-weight: bold;
                    }

                    .money-icon-item.deposited {
                        animation: depositAnimation 0.5s ease-out forwards;
                    }
                </style>
            `;

            document.body.appendChild(modal);

            // 綁定點擊事件
            this.bindNormalModeMoneyIconClickEvents();

            // 🔧 [新增] 2秒後自動清除錯誤訊息
            if (errorMessage) {
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    const errorMessageEl = document.getElementById('error-message');
                    if (errorMessageEl) {
                        errorMessageEl.textContent = '';
                    }
                }, 2000, 'uiAnimation');
            }

            ATM.Debug.log('coin', `🔄 [普通模式存款] 彈窗已重新創建，錯誤次數: ${depositState.errorCount}/3`);
        },

        // 🔧 [新增] 顯示普通模式存款提示（錯誤3次後）
        showNormalModeDepositHint() {
            const depositState = this.state.gameState.normalModeDeposit;
            const correctBillCount = depositState.correctBillCount;
            const assignedAmount = depositState.correctAmount;

            // 標記為顯示提示狀態
            depositState.showHint = true;
            depositState.selectedBills.clear();
            depositState.autoConfirming = false; // 🔧 [新增] 重置自動確認標誌

            // 🔧 [修改] 不關閉彈窗，在原彈窗中復原並顯示提示
            const moneyIcons = document.querySelectorAll('.money-icon-item');

            if (moneyIcons.length === 0) {
                ATM.Debug.warn('hint', '⚠️ [存款提示] 找不到金錢圖示元素');
                return;
            }

            // 1. 復原所有金錢圖示到未選中狀態
            moneyIcons.forEach(icon => {
                // 🔧 [修正] 先停止動畫，再移除class，再重置樣式
                icon.style.animation = 'none';  // 1. 先停止動畫

                // 強制瀏覽器重繪（確保動畫停止）
                void icon.offsetHeight;

                icon.classList.remove('deposited');  // 2. 移除class

                // 3. 重置所有樣式
                icon.style.opacity = '1';
                icon.style.transform = 'scale(1) translateY(0)';
                icon.style.pointerEvents = '';

                // 再次強制瀏覽器重繪（確保樣式應用）
                void icon.offsetHeight;
            });

            // 2. 更新顯示的已選金額為 0
            const selectedAmountEl = document.getElementById('selected-amount');
            const selectedCountEl = document.getElementById('selected-count');
            if (selectedAmountEl) selectedAmountEl.textContent = '0';
            if (selectedCountEl) selectedCountEl.textContent = '0';

            // 3. 更新錯誤訊息提示
            const errorMessageEl = document.getElementById('error-message');
            if (errorMessageEl) {
                errorMessageEl.textContent = '💡 請點擊有提示的正確鈔票';
                errorMessageEl.style.color = '#ff9800';
            }

            // 4. 在正確數量的金錢圖示上添加提示動畫，鎖定其他圖示
            ATM.Debug.log('hint', `💡 [存款提示] 在前 ${correctBillCount} 張鈔票上顯示提示動畫`);

            moneyIcons.forEach((icon, index) => {
                if (index < correctBillCount) {
                    // 有提示的圖示
                    icon.classList.add('atm-easy-hint');
                    icon.classList.remove('locked');
                } else {
                    // 沒有提示的圖示：鎖定，不能點擊
                    icon.classList.add('locked');
                    icon.style.opacity = '0.3';
                    icon.style.cursor = 'not-allowed';
                }
            });
        },

        // 🔧 [新增] 生成帶提示的金錢圖示（錯誤3次後）
        generateNormalModeMoneyIconsWithHint(count) {
            let html = '';
            for (let i = 0; i < count; i++) {
                html += `
                    <div class="money-icon-item atm-easy-hint" data-bill-index="${i}">
                        <img src="${this.getRandomMoneyImage(1000)}" alt="1000元鈔票">
                        <span class="money-label">1000元</span>
                    </div>
                `;
            }
            return html;
        },

        // 🔧 [新增] 綁定提示模式的金錢圖示點擊事件（點擊完自動確認）
        bindNormalModeMoneyIconClickEventsWithAutoConfirm() {
            const moneyIcons = document.querySelectorAll('.money-icon-item');
            const depositState = this.state.gameState.normalModeDeposit;
            const totalCount = moneyIcons.length;
            let speechTimeout = null;

            moneyIcons.forEach((icon) => {
                icon.addEventListener('click', () => {
                    // 如果已經被點擊過，不重複處理
                    if (icon.classList.contains('deposited')) {
                        return;
                    }

                    const billIndex = parseInt(icon.dataset.billIndex);

                    // 標記為已存入
                    depositState.selectedBills.add(billIndex);

                    // 添加消失動畫
                    icon.classList.add('deposited');

                    // 更新顯示
                    this.updateNormalModeDepositDisplay();

                    // 播放音效
                    this.audio.playBeep();

                    // 清除之前的語音播放計時器
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    if (speechTimeout) {
                        this.TimerManager.clearTimeout(speechTimeout);
                    }

                    // 延遲播放語音（快速點擊時只播放最後的金額）
                    const currentCount = depositState.selectedBills.size;
                    const currentAmount = currentCount * 1000;
                    const isLastBill = (currentCount === totalCount);

                    // 🔧 [Phase 3] 遷移至 TimerManager
                    speechTimeout = this.TimerManager.setTimeout(() => {
                        this.speech.speak(`存入${this.convertAmountToSpeech(currentAmount)}`, {
                            callback: () => {
                                // 如果是最後一張，自動確認並關閉彈窗
                                if (isLastBill) {
                                    // 🔧 [修正] 等待"正確！"語音播放完成後再關閉彈窗
                                    this.speech.speak('正確！', {
                                        callback: () => {
                                            // ✅ 語音播放完成後，才執行關閉彈窗等操作
                                            // 🔧 [修正] 設定存款金額狀態（與正常確認流程一致）
                                            this.initializeDepositState();
                                            this.state.gameState.depositBills[1000] = depositState.correctBillCount;

                                            this.closeBillSelectionModal();
                                            // 在現金出口顯示存入的金錢圖示
                                            this.displayDepositedMoney();
                                            // 播放語音並設置確認鍵提示數據
                                            this.speech.speak('鈔票放妥後，請按確認鍵', {
                                                callback: () => {
                                                    // ✅ 語音播放完成後，設置確認鍵提示數據（困難模式只設置數據，不顯示）
                                                    // 🔧 [Phase 2d] 遷移至 TimerManager
                                                    this.TimerManager.setTimeout(() => {
                                                        this.showATMEasyHint('deposit_confirm_btn', '.confirm-action[data-action="confirm"]');
                                                    }, 300, 'hintAnimation');
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }, 300, 'speechDelay');

                    // 動畫完成後移除元素
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        icon.remove();
                    }, 500, 'uiAnimation');
                });
            });
        },

        // 🔧 [新增] 關閉普通模式存款彈窗
        closeNormalModeDepositModal() {
            this.closeBillSelectionModal();
            // 清除狀態
            if (this.state.gameState.normalModeDeposit) {
                this.state.gameState.normalModeDeposit = null;
            }
        },

        // 初始化存款狀態
        initializeDepositState() {
            if (!this.state.gameState.depositBills) {
                this.state.gameState.depositBills = {
                    2000: 0,
                    1000: 0,
                    500: 0,
                    100: 0
                };
            }
        },

        // 綁定鈔票選擇事件
        bindBillSelectionEvents() {
            const billOptions = document.querySelectorAll('.bill-option');
            billOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const value = parseInt(option.dataset.value);
                    this.addBill(value);
                });
            });
        },

        // 增加鈔票
        addBill(value) {
            const maxCount = 100;
            const maxAmount = 60000;

            const currentCount = this.state.gameState.depositBills[value];
            const totalCount = this.getTotalBillCount();
            const totalAmount = this.getTotalDepositAmount();

            // 檢查限制
            if (totalCount >= maxCount) {
                this.speech.speak('超過最大張數限制100張');
                return;
            }

            if (totalAmount + value > maxAmount) {
                this.speech.speak('超過最大金額限制6萬元');
                return;
            }

            // 增加鈔票
            this.state.gameState.depositBills[value]++;
            this.updateBillDisplay();
            this.audio.playBeep();

            // 播放語音：鈔票面額和張數（使用防抖動）
            this.speakBillCount(value);
        },

        // 防抖動語音播放
        speakBillCount(value) {
            // 清除之前的計時器
            // 🔧 [Phase 3] 遷移至 TimerManager
            if (this.billSpeechTimeout) {
                this.TimerManager.clearTimeout(this.billSpeechTimeout);
            }

            // 設置新的計時器，300ms後播放語音
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.billSpeechTimeout = this.TimerManager.setTimeout(() => {
                const count = this.state.gameState.depositBills[value];
                const billName = this.getBillName(value);
                this.speech.speak(`${billName}，${count}張`);
            }, 300, 'speechDelay');
        },

        // 獲取鈔票中文名稱
        getBillName(value) {
            const billNames = {
                2000: '兩千元',
                1000: '一千元',
                500: '五百元',
                100: '一百元'
            };
            return billNames[value] || `${value}元`;
        },

        // 更新鈔票顯示
        updateBillDisplay() {
            const billOptions = document.querySelectorAll('.bill-option');
            billOptions.forEach(option => {
                const value = parseInt(option.dataset.value);
                const count = this.state.gameState.depositBills[value];
                option.querySelector('.count').textContent = `${count} 張`;
            });

            // 更新總計
            document.getElementById('total-amount').textContent = this.getTotalDepositAmount().toLocaleString();
            document.getElementById('total-count').textContent = this.getTotalBillCount();
        },

        // 計算總金額
        getTotalDepositAmount() {
            // 🔧 [修正] 檢查 depositBills 是否存在，避免在主選單時出錯
            if (!this.state.gameState.depositBills) {
                return 0;
            }
            let total = 0;
            for (const [value, count] of Object.entries(this.state.gameState.depositBills)) {
                total += parseInt(value) * count;
            }
            return total;
        },

        // 計算總張數
        getTotalBillCount() {
            // 🔧 [修正] 檢查 depositBills 是否存在，避免在主選單時出錯
            if (!this.state.gameState.depositBills) {
                return 0;
            }
            let total = 0;
            for (const count of Object.values(this.state.gameState.depositBills)) {
                total += count;
            }
            return total;
        },

        // 關閉鈔票選擇彈跳窗
        closeBillSelectionModal(returnToMenu = false) {
            const modal = document.getElementById('bill-selection-modal');
            if (modal) {
                modal.remove();
            }

            // 🔧 [新增] 困難模式+自選服務：點擊取消按鈕時返回主選單
            if (returnToMenu &&
                this.state.settings.difficulty === 'hard' &&
                this.state.settings.sessionType === 'free') {

                // 重置存款狀態
                this.state.gameState.depositBills = { 2000: 0, 1000: 0, 500: 0, 100: 0 };

                // 返回主選單
                this.speech.speak('已取消存款', {
                    callback: () => {
                        this.resetTransaction();
                        this.updateScreen('menu');
                        this.state.gameState.currentScene = 'menu';

                        // 重置流程步驟到選擇服務
                        this.updateFlowStep('SELECT_SERVICE', 'DEPOSIT_CASH');
                    }
                });
            }
        },

        // 確認鈔票選擇
        confirmBillSelection() {
            const totalCount = this.getTotalBillCount();
            if (totalCount === 0) {
                this.speech.speak('請先選擇要存入的鈔票');
                return;
            }

            // 關閉彈跳窗
            this.closeBillSelectionModal();

            // 在現金出口顯示存入的金錢圖示
            this.displayDepositedMoney();

            // 播放語音並等待用戶按確認
            this.speech.speak('鈔票放妥後，請按確認鍵', {
                callback: () => {
                    // 語音播放完畢後不做任何動作，等待用戶按確認鍵
                }
            });
        },

        // 在現金出口顯示存入的金錢圖示
        displayDepositedMoney() {
            ATM.Debug.log('flow', '🏧 嘗試在現金出口顯示金錢...');
            ATM.Debug.log('flow', '🏧 目前鈔票狀態:', this.state.gameState.depositBills);

            // 🔧 [新增] 標記已經顯示金錢
            this.state.gameState.moneyDisplayed = true;

            // 🔧 [新增] 移除現金出口點擊事件，防止重複點擊
            const cashSlotArea = document.querySelector('.cash-display-area-container');
            if (cashSlotArea) {
                cashSlotArea.style.cursor = 'default';
                cashSlotArea.onclick = null;
                ATM.Debug.log('flow', '🏧 移除現金出口點擊事件，防止重複存入');
            }

            // ✅ 清除提示效果
            if (this.shouldShowHint()) {
                this.clearATMEasyHint();
            }

            // 🔧 [修正] 所有難度模式都設置確認按鈕提示數據
            // 簡單模式：立即顯示
            // 普通模式：10秒後顯示
            // 困難模式：只設置數據，不自動顯示
            this.showATMEasyHint('deposit_confirm_btn', '.confirm-action[data-action="confirm"]');

            const cashDisplay = document.querySelector('.cash-display-background');
            if (!cashDisplay) {
                ATM.Debug.error('🏧 找不到現金顯示區域 .cash-display-background');
                return;
            }

            ATM.Debug.log('flow', '🏧 找到現金顯示區域，開始顯示金錢');

            // 顯示現金背景區域
            cashDisplay.style.display = 'flex';

            // 清空現有內容
            cashDisplay.innerHTML = '';

            // 創建金錢顯示容器
            const moneyContainer = document.createElement('div');
            moneyContainer.className = 'deposited-money-container';

            let hasAnyBills = false;
            let totalBillsToShow = 0;

            // 🔧 [修正] 檢查 depositBills 是否存在，避免錯誤
            if (!this.state.gameState.depositBills) {
                ATM.Debug.warn('flow', '🏧 depositBills 未初始化，無法顯示金錢');
                return;
            }

            // 顯示各種鈔票
            Object.entries(this.state.gameState.depositBills).forEach(([value, count]) => {
                if (count > 0) {
                    hasAnyBills = true;
                    totalBillsToShow += count;
                    ATM.Debug.log('flow', `🏧 顯示 ${value}元鈔票 ${count}張`);

                    // 🔧 [修改] 顯示所有鈔票圖示，不限制數量，不顯示「+×張」
                    for (let i = 0; i < count; i++) {
                        const billElement = document.createElement('div');
                        billElement.className = 'deposited-bill';
                        billElement.innerHTML = `
                            <img src="${this.getRandomMoneyImage(value)}" alt="${value}元鈔票">
                        `;
                        moneyContainer.appendChild(billElement);
                    }
                }
            });

            if (hasAnyBills) {
                cashDisplay.appendChild(moneyContainer);
                ATM.Debug.log('flow', `🏧 成功顯示 ${totalBillsToShow}張鈔票在現金出口`);

                // 延遲檢查滾動拉桿需求（等待渲染完成）
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.showAmountSlider();
                }, 300, 'uiAnimation');
            } else {
                ATM.Debug.warn('flow', '🏧 沒有鈔票需要顯示');
            }
        },

        // 檢查並顯示滾動拉桿
        showAmountSlider() {
            const cashBackground = document.getElementById('cash-display-background');
            const cashContainer = cashBackground?.querySelector('.cash-bills-container');
            const sliderContainer = document.getElementById('amount-slider-container');

            if (!cashBackground || !cashContainer || !sliderContainer) {
                ATM.Debug.error('🏧 找不到現金容器或拉桿元素');
                return;
            }

            // 檢查內容是否超出容器高度
            const containerHeight = cashBackground.clientHeight;
            const contentHeight = cashContainer.scrollHeight;

            ATM.Debug.log('flow', '🏧 容器高度:', containerHeight, '內容高度:', contentHeight);

            if (contentHeight > containerHeight) {
                // 內容超出，顯示滾動拉桿
                sliderContainer.classList.add('visible');

                // 等待拉桿容器完全顯示後再初始化
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.initScrollSlider(containerHeight, contentHeight);
                    ATM.Debug.log('flow', '🏧 內容超出範圍，顯示滾動拉桿');
                }, 50, 'uiAnimation');
            } else {
                // 內容未超出，隱藏拉桿
                sliderContainer.classList.remove('visible');
                ATM.Debug.log('flow', '🏧 內容未超出，隱藏拉桿');
            }
        },

        // 隱藏滾動拉桿
        hideAmountSlider() {
            const sliderContainer = document.getElementById('amount-slider-container');
            if (sliderContainer) {
                sliderContainer.classList.remove('visible');
                ATM.Debug.log('flow', '🏧 隱藏滾動拉桿');
            }
        },

        // 初始化滾動拉桿
        initScrollSlider(containerHeight, contentHeight) {
            const sliderHandle = document.getElementById('slider-handle');
            const sliderContainer = document.getElementById('amount-slider-container');
            const cashContainer = document.querySelector('.cash-bills-container');

            if (!sliderHandle || !sliderContainer || !cashContainer) return;

            // 計算滾動參數
            const sliderTrackHeight = sliderContainer.clientHeight;
            const handleHeight = 40; // 拉桿把手高度
            const padding = 10; // 上下各5px的邊距
            const extraBuffer = 30; // 額外緩衝空間，確保底部完全可見
            const maxScroll = contentHeight - containerHeight + extraBuffer;
            const maxHandleTop = sliderTrackHeight - handleHeight - 5;

            this.scrollData = {
                containerHeight: containerHeight,
                contentHeight: contentHeight,
                maxScroll: maxScroll,
                trackHeight: sliderTrackHeight,
                handleHeight: handleHeight,
                maxHandleTop: maxHandleTop,
                currentScroll: 0
            };

            ATM.Debug.log('flow', '🏧 滾動參數:', {
                containerHeight: containerHeight,
                contentHeight: contentHeight,
                trackHeight: sliderTrackHeight,
                handleHeight: handleHeight,
                maxHandleTop: maxHandleTop,
                maxScroll: maxScroll,
                extraBuffer: extraBuffer
            });

            // 設置拉桿初始位置
            sliderHandle.style.top = '5px';

            // 綁定滾動事件
            this.bindScrollSliderEvents(sliderHandle, cashContainer);
        },

        // 綁定滾動拉桿事件
        bindScrollSliderEvents(sliderHandle, cashContainer) {
            let isDragging = false;
            let startY = 0;
            let startTop = 0;

            const handleMouseDown = (e) => {
                e.preventDefault();
                isDragging = true;
                startY = e.clientY;
                startTop = parseInt(sliderHandle.style.top || '5px');
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            };

            const handleTouchStart = (e) => {
                e.preventDefault();
                isDragging = true;
                startY = e.touches[0].clientY;
                startTop = parseInt(sliderHandle.style.top || '5px');
                document.addEventListener('touchmove', handleTouchMove);
                document.addEventListener('touchend', handleTouchEnd);
            };

            const handleMouseMove = (e) => {
                if (!isDragging) return;
                this.updateScrollPosition(e.clientY - startY, startTop, sliderHandle, cashContainer);
            };

            const handleTouchMove = (e) => {
                if (!isDragging) return;
                this.updateScrollPosition(e.touches[0].clientY - startY, startTop, sliderHandle, cashContainer);
            };

            const handleMouseUp = () => {
                isDragging = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            const handleTouchEnd = () => {
                isDragging = false;
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            };

            // 清除舊的事件監聽器
            sliderHandle.removeEventListener('mousedown', handleMouseDown);
            sliderHandle.removeEventListener('touchstart', handleTouchStart);

            // 添加新的事件監聽器
            sliderHandle.addEventListener('mousedown', handleMouseDown);
            sliderHandle.addEventListener('touchstart', handleTouchStart);
        },

        // 更新滾動位置
        updateScrollPosition(deltaY, startTop, sliderHandle, cashContainer) {
            if (!this.scrollData) return;

            // 計算新的拉桿位置，限制在有效範圍內
            const minTop = 5; // 最小位置（頂部邊距）
            const maxTop = this.scrollData.maxHandleTop; // 最大位置
            const newTop = Math.max(minTop, Math.min(maxTop, startTop + deltaY));

            sliderHandle.style.top = newTop + 'px';

            // 計算滾動比例 (0到1)
            const scrollRatio = (newTop - minTop) / (maxTop - minTop);
            const scrollOffset = scrollRatio * this.scrollData.maxScroll;

            // 應用滾動
            cashContainer.style.transform = `translateY(-${scrollOffset}px)`;
            this.scrollData.currentScroll = scrollOffset;

            ATM.Debug.log('flow', '🏧 拉桿位置:', newTop + 'px, 滾動位置:', scrollOffset.toFixed(1) + 'px, 比例:', scrollRatio.toFixed(2));
        },

        // 關閉現金出口（存款完成後）
        closeCashSlotAfterDeposit() {
            ATM.Debug.log('flow', '🏧 嘗試關閉現金出口...');
            const cashCover = document.getElementById('cash-display-cover');
            if (cashCover) {
                ATM.Debug.log('flow', '🏧 找到現金出口蓋板，執行關閉動畫');
                // 移除開啟狀態，添加關閉狀態
                cashCover.classList.remove('opening');
                cashCover.classList.add('closing');

                // 隱藏金額拉桿
                this.hideAmountSlider();

                // 清空現金顯示內容
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    const cashDisplay = document.querySelector('.cash-display-background');
                    if (cashDisplay) {
                        cashDisplay.innerHTML = '';
                        cashDisplay.style.display = 'none'; // 隱藏現金背景區域
                    }
                    // 移除關閉狀態類，回到初始狀態
                    cashCover.classList.remove('closing');
                    ATM.Debug.log('flow', '🏧 現金出口關閉動畫完成');
                }, 800, 'uiAnimation'); // 等待關閉動畫完成

                // 移除點擊事件和游標樣式
                const cashSlotArea = document.querySelector('.cash-display-area-container');
                if (cashSlotArea) {
                    cashSlotArea.style.cursor = 'default';
                    cashSlotArea.onclick = null;
                    ATM.Debug.log('flow', '🏧 現金出口點擊事件已移除');
                }

                // ✅ 清除提示效果
                if (this.shouldShowHint()) {
                    this.clearATMEasyHint();
                    ATM.Debug.log('flow', '🏧 清除現金出口提示效果');
                }
            } else {
                ATM.Debug.error('🏧 找不到現金出口蓋板');
            }
        },

        // 綁定存入現鈔畫面事件
        bindDepositCashEvents() {
            // 綁定取消和確認按鈕
            document.querySelectorAll('.cancel-action, .confirm-action').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    const action = event.target.dataset.action;
                    this.audio.playBeep();

                    if (action === 'cancel') {
                        // 🔧 [修正] 自選服務：如果已經顯示金錢，進入取走現金流程（所有難度）
                        if (this.state.gameState.moneyDisplayed &&
                            this.state.settings.sessionType === 'free') {

                            ATM.Debug.log('flow', '🔄 自選服務：取消存款，進入取走現金流程');
                            this.showRemoveCashScreen();
                            return;
                        }

                        // 🔧 [新增] 自選服務：未顯示金錢時按取消，直接跳到交易結束
                        if (this.state.settings.sessionType === 'free' && !this.state.gameState.moneyDisplayed) {
                            ATM.Debug.log('flow', '🔄 自選服務：取消存款（未存入鈔票），跳到交易結束');
                            // 重置存款狀態
                            this.state.gameState.depositBills = null;
                            this.state.gameState.isSubFlowActive = false;
                            // 關閉現金出口
                            const cashDispenser = document.querySelector('.cash-dispenser-area');
                            if (cashDispenser) cashDispenser.classList.remove('open');
                            this.speech.speak('交易已取消', {
                                callback: () => {
                                    this.showCardEjectScreenForEndTransaction();
                                }
                            });
                            return;
                        }

                        // 🔧 [修正] 其他模式：如果已經顯示金錢，提示用戶應該點擊確認按鈕
                        if (this.state.gameState.moneyDisplayed) {
                            ATM.Debug.warn('audio', '⚠️ 取消按鈕：已存入鈔票，提示點擊確認');

                            // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後顯示提示
                            if (this.state.settings.difficulty === 'normal') {
                                this.state.gameState.normalModeErrors.depositCancelErrorCount++;
                                const errorCount = this.state.gameState.normalModeErrors.depositCancelErrorCount;
                                ATM.Debug.log('hint', `🔢 [Normal-Mode] 存款取消按鈕錯誤次數: ${errorCount}`);
                            }

                            // 播放錯誤音效
                            const errorAudio = new Audio('../audio/units/error.mp3');
                            errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                            this.speech.speak('鈔票已放妥，請按確認鍵');

                            // 🔧 [修改] 普通模式：錯誤3次後立即顯示提示
                            if (this.shouldShowHint()) {
                                // 🔧 [Phase 3] 遷移至 TimerManager
                                this.TimerManager.setTimeout(() => {
                                    if (this.state.settings.difficulty === 'normal' &&
                                        this.state.gameState.normalModeErrors.depositCancelErrorCount >= 3) {
                                        ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，立即顯示提示動畫在確認按鈕上`);
                                        this.showATMEasyHint('deposit_confirm_cancel_hint', '.confirm-action[data-action="confirm"]', true);
                                    } else {
                                        this.showATMEasyHint('deposit_confirm_cancel_hint', '.confirm-action[data-action="confirm"]');
                                    }
                                }, 300, 'hintAnimation');
                            }
                            return;
                        }

                        // 如果還沒存入鈔票，顯示錯誤提示
                        if (!this.state.gameState.depositBills || this.getTotalBillCount() === 0) {
                            ATM.Debug.warn('audio', '⚠️ 取消按鈕：尚未存入鈔票，顯示錯誤提示');

                            // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後顯示提示
                            if (this.state.settings.difficulty === 'normal') {
                                this.state.gameState.normalModeErrors.depositCancelErrorCount++;
                                const errorCount = this.state.gameState.normalModeErrors.depositCancelErrorCount;
                                ATM.Debug.log('hint', `🔢 [Normal-Mode] 存款取消按鈕錯誤次數（未存入鈔票）: ${errorCount}`);

                                if (errorCount >= 3) {
                                    // 達到3次，立即顯示提示動畫在現金出口上
                                    ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，立即顯示提示動畫在現金出口上`);
                                    // 🔧 [Phase 2d] 遷移至 TimerManager
                                    this.TimerManager.setTimeout(() => {
                                        this.showATMEasyHint('deposit_cash_dispenser_cancel', '.cash-dispenser-area', true);
                                    }, 300, 'hintAnimation');
                                }
                            }

                            // 播放錯誤音效
                            const errorAudio = new Audio('../audio/units/error.mp3');
                            errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                            // 🔧 [修正] 簡單模式：錯誤後重新顯示現金出口提示，確保提示不因錯誤按鈕而消失
                            this.speech.speak('請先點擊下方現金出口放入鈔票', {
                                callback: () => {
                                    if (this.state.settings.difficulty === 'easy') {
                                        this.TimerManager.setTimeout(() => {
                                            // 僅在彈窗尚未開啟時才恢復提示（避免使用者已點擊現金出口後提示重新出現）
                                            if (!document.getElementById('bill-selection-modal')) {
                                                this.showATMEasyHint('deposit_cash', '.cash-dispenser-area');
                                            }
                                        }, 300, 'hintAnimation');
                                    }
                                }
                            });
                            return;
                        }

                        // 🔧 [修正] 簡單/普通模式：禁止取消，提示必須完成任務
                        if (this.shouldShowHint()) {
                            // 播放錯誤音效
                            const errorAudio = new Audio('../audio/units/error.mp3');
                            errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                            this.speech.speak('請依序完成任務，不可取消');
                            ATM.Debug.log('flow', '❌ 取消按鈕：簡單/普通模式下不允許取消');
                            return;
                        }

                        // 困難模式：允許取消交易
                        this.speech.speak('交易已取消', {
                            callback: () => {
                                this.cancelDeposit();
                            }
                        });
                    } else if (action === 'confirm') {
                        // 🔧 [新增] 清除延遲提示計時器
                        if (this._depositConfirmHintTimer) {
                            clearTimeout(this._depositConfirmHintTimer);
                            this._depositConfirmHintTimer = null;
                        }

                        // 檢查是否已選擇鈔票
                        if (!this.state.gameState.depositBills || this.getTotalBillCount() === 0) {
                            ATM.Debug.warn('audio', '⚠️ 確認按鈕：尚未存入鈔票，顯示錯誤提示');

                            // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後顯示提示
                            if (this.state.settings.difficulty === 'normal') {
                                this.state.gameState.normalModeErrors.depositConfirmErrorCount++;
                                const errorCount = this.state.gameState.normalModeErrors.depositConfirmErrorCount;
                                ATM.Debug.log('hint', `🔢 [Normal-Mode] 存款確認按鈕錯誤次數（未存入鈔票）: ${errorCount}`);

                                if (errorCount >= 3) {
                                    // 達到3次，立即顯示提示動畫在現金出口上
                                    ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，立即顯示提示動畫在現金出口上`);
                                    // 🔧 [Phase 2d] 遷移至 TimerManager
                                    this.TimerManager.setTimeout(() => {
                                        this.showATMEasyHint('deposit_cash_dispenser', '.cash-dispenser-area', true);
                                    }, 300, 'hintAnimation');
                                }
                            }

                            // 播放錯誤音效
                            const errorAudio = new Audio('../audio/units/error.mp3');
                            errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                            // 🔧 [修正] 簡單模式：錯誤後重新顯示現金出口提示，確保提示不因錯誤按鈕而消失
                            this.speech.speak('請先點擊現金出口放入鈔票', {
                                callback: () => {
                                    if (this.state.settings.difficulty === 'easy') {
                                        this.TimerManager.setTimeout(() => {
                                            // 僅在彈窗尚未開啟時才恢復提示（避免使用者已點擊現金出口後提示重新出現）
                                            if (!document.getElementById('bill-selection-modal')) {
                                                this.showATMEasyHint('deposit_cash', '.cash-dispenser-area');
                                            }
                                        }, 300, 'hintAnimation');
                                    }
                                }
                            });
                            return;
                        }

                        // 🔧 [修正] 移至此處：有鈔票時才清除提示動畫（原本在 bill check 前清除，導致錯誤時提示消失）
                        if (this.shouldShowHint()) {
                            this.clearATMEasyHint();
                        }

                        // 🔧 [新增] 普通模式：正確操作後重置錯誤計數
                        if (this.state.settings.difficulty === 'normal') {
                            this.state.gameState.normalModeErrors.depositCancelErrorCount = 0;
                            this.state.gameState.normalModeErrors.depositConfirmErrorCount = 0;
                        }

                        // 關閉現金出口
                        this.closeCashSlotAfterDeposit();

                        // 等待關閉動畫完成後進入下一步驟
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            this.startDepositCounting();
                        }, 900, 'screenTransition'); // 稍微多等一點確保動畫完成
                    }
                });
            });
        },

        // 綁定確認存入現鈔畫面事件
        bindDepositConfirmEvents() {
            document.querySelectorAll('.cancel-action, .confirm-action').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    const action = event.target.dataset.action;
                    this.audio.playBeep();

                    if (action === 'cancel') {
                        // 🔧 [修正] 簡單模式：取消鍵顯示錯誤訊息
                        if (this.state.settings.difficulty === 'easy') {
                            this.speech.speak('存款流程已進行到確認階段，請按確認鍵完成交易');
                            return;
                        }

                        // 🔧 [新增] 自選服務：取消確認存款，重新打開現金出口讓使用者取走現金
                        if (this.state.settings.sessionType === 'free') {
                            ATM.Debug.log('flow', '🔄 自選服務：取消確認存款，重新打開現金出口');
                            // 重新打開現金出口蓋子
                            const cashCover = document.getElementById('cash-display-cover');
                            if (cashCover) {
                                cashCover.classList.add('opening');
                            }
                            this.showRemoveCashScreen();
                            return;
                        }

                        this.speech.speak('交易已取消', {
                            callback: () => {
                                this.cancelDeposit();
                            }
                        });
                    } else if (action === 'confirm') {
                        // 步驟 9：確認存款，進入交易處理
                        this.confirmDeposit();
                    }
                });
            });
        },

        // 步驟 6：開始數鈔辨識
        startDepositCounting() {
            this.updateScreen('deposit-counting');
            this.state.gameState.currentScene = 'deposit-counting';

            // 關閉現金出口
            this.closeCashSlotAfterDeposit();

            // 播放數鈔音效
            ATM.Debug.log('flow', '🏧 機器數鈔辨識中，播放數錢音效...');
            this.audio.playCountMoney().then(() => {
                ATM.Debug.log('flow', '🏧 數錢音效播放完成');
            }).catch(error => {
                ATM.Debug.error('🏧 數錢音效播放失敗:', error);
            });

            // 模擬數鈔過程 3 秒後進入確認畫面
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                this.showDepositConfirmScreen();
            }, 3000, 'screenTransition');
        },

        // 關閉現金出口（存款後）
        closeCashSlotAfterDeposit() {
            const cashCover = document.getElementById('cash-display-cover');
            if (cashCover) {
                cashCover.classList.remove('opening');
            }

            // 移除點擊事件
            const cashSlotArea = document.querySelector('.cash-display-area-container');
            if (cashSlotArea) {
                cashSlotArea.style.cursor = 'default';
                cashSlotArea.onclick = null;
            }
        },

        // 步驟 8：顯示確認存入現鈔畫面
        showDepositConfirmScreen() {
            this.updateScreen('deposit-confirm');
            this.state.gameState.currentScene = 'deposit-confirm';

            // 計算總金額
            const totalAmount = this.getTotalDepositAmount();

            // 播放語音：請確認存入現鈔 + 實際存款金額
            this.speech.speak(`請確認存入現鈔，實際存款金額${this.convertAmountToSpeech(totalAmount)}`, {
                callback: () => {
                    // ✅ 語音播放完成後，設置確認鍵提示數據（困難模式只設置數據，不顯示）
                    // 🔧 [Phase 2d] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.showATMEasyHint('deposit_final_confirm_btn', '.confirm-action[data-action="confirm"]');
                    }, 300, 'hintAnimation');
                }
            });
        },

        // 步驟 9：確認存款
        confirmDeposit() {
            const amount = this.getTotalDepositAmount();
            this.state.gameState.transactionAmount = amount;

            // 🔧 [新增] 簡單模式：清除存款確認的提示
            if (this.shouldShowHint()) {
                this.clearATMEasyHint();
            }

            // 🔧 步驟切換 DEPOSIT_CASH → PROCESSING
            this.updateFlowStep('PROCESSING', 'DEPOSIT_CASH');

            // 步驟 9：顯示交易處理中
            this.updateScreen('processing', { message: '交易處理中，請稍候' });
            this.state.gameState.currentScene = 'deposit-processing-final';

            this.speech.speak('交易處理中，請稍候', {
                callback: () => {
                    // 播放數錢音效
                    ATM.Debug.log('flow', '🏧 播放數錢音效...');
                    this.audio.playCountMoney().then(() => {
                        ATM.Debug.log('flow', '🏧 數錢音效播放完成，進入交易完成');

                        // 更新帳戶餘額
                        this.state.gameState.accountBalance += amount;
                        this.state.gameState.isSubFlowActive = false; // ✅ [修改] 在此處解除鎖定

                        // 🔧 步驟切換 PROCESSING → RECEIPT_OPTIONS
                        this.updateFlowStep('RECEIPT_OPTIONS', 'PROCESSING');

                        // 步驟 10：顯示是否繼續交易（明細表選項）
                        this.showContinueTransactionQuestion();
                    }).catch(error => {
                        ATM.Debug.error('🏧 數錢音效播放失敗:', error);

                        // 即使音效播放失敗也要繼續流程
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            this.state.gameState.accountBalance += amount;
                            this.state.gameState.isSubFlowActive = false; // ✅ [修改] 錯誤情況也要解除鎖定

                            // 🔧 步驟切換 PROCESSING → RECEIPT_OPTIONS
                            this.updateFlowStep('RECEIPT_OPTIONS', 'PROCESSING');

                            this.showContinueTransactionQuestion();
                        }, 1000, 'screenTransition');
                    });
                }
            });
        },

        // 取消存款
        cancelDeposit() {
            // 重置存款狀態
            this.state.gameState.depositBills = {
                2000: 0,
                1000: 0,
                500: 0,
                100: 0
            };

            this.state.gameState.isSubFlowActive = false; // ✅ [修改] 在取消時解除鎖定

            // 關閉現金出口
            this.closeCashSlotAfterDeposit();

            // 返回主選單
            this.resetTransaction();
            this.updateScreen('menu');
            this.state.gameState.currentScene = 'menu';
        },

        // 🔧 [新增] 顯示取走現金提示畫面（困難模式+自選服務專用）
        showRemoveCashScreen() {
            const screenContent = document.querySelector('.screen-content');
            if (!screenContent) return;

            // 顯示取走現金提示畫面
            screenContent.innerHTML = `
                <div class="screen-remove-cash">
                    <div class="remove-cash-header">
                        <h2 style="color: white;">交易已取消</h2>
                        <div class="remove-cash-instructions">
                            <p style="font-size: 18px; margin-top: 20px;">請先取走現金出口的現金</p>
                            <p style="font-size: 16px; color: #ffeb3b; margin-top: 15px;">↓ 點擊下方現金出口取回現金 ↓</p>
                        </div>
                    </div>
                </div>
            `;

            this.speech.speak('交易已取消，請先取走現金出口的現金');

            // 綁定現金出口點擊事件
            const cashDispenser = document.querySelector('.cash-dispenser-area');
            if (cashDispenser) {
                // 移除舊的事件監聽器（如果有）
                const newCashDispenser = cashDispenser.cloneNode(true);
                cashDispenser.parentNode.replaceChild(newCashDispenser, cashDispenser);

                // 🔧 [新增] 設置鈔票圖示為可點擊樣式
                const depositedBills = newCashDispenser.querySelectorAll('.deposited-bill');
                depositedBills.forEach(bill => {
                    bill.style.cursor = 'pointer';
                    ATM.Debug.log('hint', '💡 已設置鈔票圖示為可點擊樣式');
                });

                // 添加新的事件監聽器
                newCashDispenser.addEventListener('click', () => {
                    this.audio.playBeep();
                    ATM.Debug.log('coin', '💰 用戶點擊現金出口，取走現金');

                    // 🔧 [修正1] 先讓金錢圖示消失（淡出動畫）
                    const moneyIcons = document.querySelectorAll('.deposited-bill');
                    ATM.Debug.log('coin', `💰 找到 ${moneyIcons.length} 個金錢圖示，開始淡出動畫`);
                    moneyIcons.forEach(icon => {
                        icon.style.transition = 'all 0.5s ease-out';
                        icon.style.opacity = '0';
                        icon.style.transform = 'scale(0.5)';
                    });

                    // 等待金錢消失動畫完成後再清除顯示
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        // 清除現金顯示
                        this.clearCashDisplay();

                        // 重置存款狀態
                        this.state.gameState.depositBills = {
                            2000: 0,
                            1000: 0,
                            500: 0,
                            100: 0
                        };
                        this.state.gameState.moneyDisplayed = false;
                        this.state.gameState.isSubFlowActive = false;

                        // 🔧 [修正2] 顯示交易結束畫面，並使用正確的退出卡片函數
                        const screenContent = document.querySelector('.screen-content');
                        if (screenContent) {
                            screenContent.innerHTML = `
                                <div class="screen-transaction-end">
                                    <h2 style="color: white; font-size: 28px; margin-bottom: 30px;">交易結束</h2>
                                    <p style="color: #ffeb3b; font-size: 20px; margin-bottom: 20px;">感謝使用</p>
                                    <p style="color: white; font-size: 16px;">正在退出金融卡...</p>
                                </div>
                            `;
                        }

                        this.speech.speak('交易結束，感謝使用', {
                            callback: () => {
                                // 🔧 [Phase 3] 遷移至 TimerManager (nested)
                                this.TimerManager.setTimeout(() => {
                                    // 使用正確的退出卡片函數
                                    this.showCardEjectScreenForEndTransaction();
                                }, 1000, 'screenTransition');
                            }
                        });
                    }, 600, 'uiAnimation'); // 等待金錢消失動畫完成
                });

                newCashDispenser.style.cursor = 'pointer';
            }
        },

        startInquiryProcess() {
            this.state.gameState.currentTransaction.type = 'inquiry';
            this.state.gameState.transactionAmount = 0; // 餘額查詢無交易金額

            // ✅ 簡單模式：清除選單提示
            if (this.shouldShowHint()) {
                this.clearATMEasyHint();
            }

            // ✅ 步驟切換：選擇功能 → 交易處理中
            this.updateFlowStep('PROCESSING', 'SELECT_SERVICE');

            // ✅ 顯示「處理中,請稍候」畫面
            this.updateScreen('processing');
            this.speech.speak('處理中，請稍候', {
                callback: () => {
                    // ✅ 步驟切換：交易處理中 → 明細表選項
                    this.updateFlowStep('RECEIPT_OPTIONS', 'PROCESSING');

                    // 顯示明細表選項畫面（與存款流程相同）
                    this.showContinueTransactionQuestion();
                }
            });
        },

        // =====================================================
        // 💸 轉帳流程處理
        // =====================================================
        startTransferProcess() {
            ATM.Debug.log('flow', '💸 [轉帳] 開始轉帳流程');
            this.state.gameState.currentTransaction.type = 'transfer';

            // 初始化轉帳資料
            // 🔧 [新增] 隨機生成轉出銀行資訊
            const myBankCodes = ['004', '005', '006', '007', '008', '009', '011', '012', '013'];
            const myBankCode = myBankCodes[Math.floor(Math.random() * myBankCodes.length)];
            const myBankName = this.getBankNameByCode(myBankCode);

            this.state.gameState.transfer = {
                bankCode: '',           // 轉入銀行代碼（3位數）
                accountNumber: '',      // 轉入帳號（10-14位數）
                amount: 0,              // 轉帳金額
                bankName: '',           // 轉入銀行名稱
                myBankCode: myBankCode, // 🔧 [新增] 轉出銀行代碼
                myBankName: myBankName  // 🔧 [新增] 轉出銀行名稱
            };

            // ✅ 簡單模式：清除選單提示
            if (this.shouldShowHint()) {
                this.clearATMEasyHint();
            }

            // 🔧 [v1.2.38] 簡單模式+指定轉帳（含隨機任務實際為轉帳）：顯示金額提醒彈窗
            if (this.state.settings.difficulty === 'easy' && this.getActualSessionType() === 'transfer') {
                const assignedAmount = this.state.gameState.easyModeHints.assignedAmount;
                const assignedBankName = this.state.gameState.easyModeHints.assignedBankName;

                // ✅ 步驟切換：選擇功能 → (暫時保持在此，等彈窗關閉後再切換)
                this.updateFlowStep('ENTER_BANK_CODE', 'SELECT_SERVICE');

                this.showTransferAmountReminderModal(assignedAmount, assignedBankName, () => {
                    // 切換到銀行代碼輸入畫面
                    this.showBankCodeInputScreen();
                });
            } else {
                // 其他模式：直接顯示銀行代碼輸入畫面
                // ✅ 步驟切換：選擇功能 → 輸入銀行代碼
                this.updateFlowStep('ENTER_BANK_CODE', 'SELECT_SERVICE');

                // 顯示銀行代碼輸入畫面
                this.showBankCodeInputScreen();
            }
        },

        // 顯示銀行代碼輸入畫面
        showBankCodeInputScreen() {
            // 🔧 [新增] 重置銀行代碼提示按鈕計數器
            this._bankCodeHintCount = 0;
            ATM.Debug.log('hint', '🔄 進入銀行代碼畫面，重置提示計數器');

            const screenContent = document.getElementById('screen-content');
            if (!screenContent) return;

            const bankCode = this.state.gameState.transfer.bankCode || '';

            screenContent.innerHTML = `
                <div class="screen-bank-code-entry">
                    <div class="bank-code-header">
                        <h2 style="color: white;">請輸入轉入銀行代碼</h2>
                        <div class="bank-code-info" style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem; margin: 10px 0;">
                            請輸入3位數銀行代碼
                        </div>
                        <div class="bank-code-input-area">
                            <div class="bank-code-display" style="font-size: 2rem; color: #4ade80; font-weight: bold; min-height: 60px; display: flex; align-items: center; justify-content: center;">
                                ${bankCode || '___'}
                            </div>
                        </div>
                        <div class="bank-name-display" style="color: #fbbf24; font-size: 1.1rem; min-height: 30px; margin-top: 10px;">
                            ${this.getBankNameByCode(bankCode)}
                        </div>
                    </div>

                    <div class="screen-keypad">
                        <div class="screen-keypad-grid">
                            <button class="screen-key-btn number-key" data-key="1">1</button>
                            <button class="screen-key-btn number-key" data-key="2">2</button>
                            <button class="screen-key-btn number-key" data-key="3">3</button>

                            <button class="screen-key-btn number-key" data-key="4">4</button>
                            <button class="screen-key-btn number-key" data-key="5">5</button>
                            <button class="screen-key-btn number-key" data-key="6">6</button>

                            <button class="screen-key-btn number-key" data-key="7">7</button>
                            <button class="screen-key-btn number-key" data-key="8">8</button>
                            <button class="screen-key-btn number-key" data-key="9">9</button>

                            <button class="screen-key-btn action-key cancel-key" data-key="cancel">取消</button>
                            <button class="screen-key-btn number-key" data-key="0">0</button>
                            <button class="screen-key-btn action-key" data-key="clear">清除</button>

                            <button class="screen-key-btn action-key enter-key" data-key="enter">確認</button>
                        </div>
                    </div>
                </div>
            `;

            this.state.gameState.currentScene = 'bank-code-entry';
            this.updateTitleBar(4, '輸入銀行代碼');
            this.bindTransferKeypadEvents();

            // 🔧 [修正] 所有模式（簡單/普通/困難）：500ms 後自動顯示銀行代碼提示彈窗
            if (this.state.gameState.easyModeHints.assignedBankCode) {
                this.TimerManager.setTimeout(() => {
                    if (this.state.gameState.currentScene === 'bank-code-entry') {
                        this.showBankCodeHintModal();
                    }
                }, 500, 'hintAnimation');
                // 🔧 [修正] 簡單模式：另加視覺提示（彈窗消失後仍有按鈕高亮引導）
                if (this.state.settings.difficulty === 'easy') {
                    const assignedCode = this.state.gameState.easyModeHints.assignedBankCode;
                    const firstDigit = assignedCode[0];
                    this.TimerManager.setTimeout(() => {
                        if (this.state.gameState.currentScene === 'bank-code-entry') {
                            this.showATMEasyHint('bank_code_input', `.screen-key-btn[data-key="${firstDigit}"]`);
                            ATM.Debug.log('hint', `💛 提示輸入銀行代碼第1位: ${firstDigit}`);
                        }
                    }, 1500, 'hintAnimation');
                }
            } else {
                this.speech.speak('請輸入轉入銀行代碼');
            }
        },

        // 綁定轉帳鍵盤事件
        bindTransferKeypadEvents() {
            document.querySelectorAll('.screen-key-btn:not([data-bound])').forEach(btn => {
                btn.setAttribute('data-bound', 'true');

                btn.addEventListener('click', (event) => {
                    const key = event.target.dataset.key;
                    const currentScene = this.state.gameState.currentScene;

                    // 🔧 [修正] 簡單/普通模式：數字輸入前驗證
                    // 簡單模式：立即檢查，立即顯示提示
                    // 普通模式：立即檢查，但提示延遲10秒顯示
                    if (key >= '0' && key <= '9' && this.shouldShowHint()) {
                        let expectedDigit = '';
                        let currentProgress = 0;

                        // 根據當前場景決定預期數字
                        if (currentScene === 'bank-code-entry' && this.state.gameState.easyModeHints.assignedBankCode) {
                            currentProgress = this.state.gameState.transfer.bankCode.length;
                            expectedDigit = this.state.gameState.easyModeHints.assignedBankCode[currentProgress];
                        } else if (currentScene === 'account-entry' && this.state.gameState.easyModeHints.assignedAccountNumber) {
                            currentProgress = this.state.gameState.transfer.accountNumber.length;
                            expectedDigit = this.state.gameState.easyModeHints.assignedAccountNumber[currentProgress];
                        } else if (currentScene === 'transfer-amount-entry' && this.state.gameState.easyModeHints.assignedAmount) {
                            const amountStr = this.state.gameState.easyModeHints.assignedAmount.toString();
                            currentProgress = this.state.gameState.transfer.amount > 0 ?
                                this.state.gameState.transfer.amount.toString().length : 0;
                            expectedDigit = amountStr[currentProgress];
                        }

                        // 如果有預期數字且輸入錯誤
                        if (expectedDigit && key !== expectedDigit) {
                            ATM.Debug.log('hint', `❌ [轉帳] 輸入錯誤：輸入了 ${key}，應該輸入 ${expectedDigit}`);

                            // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後顯示提示
                            if (this.state.settings.difficulty === 'normal') {
                                let errorCount = 0;
                                if (currentScene === 'bank-code-entry') {
                                    this.state.gameState.normalModeErrors.bankCodeErrorCount++;
                                    errorCount = this.state.gameState.normalModeErrors.bankCodeErrorCount;
                                    ATM.Debug.log('hint', `🔢 [Normal-Mode] 銀行代碼輸入錯誤次數: ${errorCount}`);
                                } else if (currentScene === 'account-entry') {
                                    this.state.gameState.normalModeErrors.accountNumberErrorCount++;
                                    errorCount = this.state.gameState.normalModeErrors.accountNumberErrorCount;
                                    ATM.Debug.log('hint', `🔢 [Normal-Mode] 轉帳帳號輸入錯誤次數: ${errorCount}`);
                                } else if (currentScene === 'transfer-amount-entry') {
                                    this.state.gameState.normalModeErrors.transferAmountErrorCount++;
                                    errorCount = this.state.gameState.normalModeErrors.transferAmountErrorCount;
                                    ATM.Debug.log('hint', `🔢 [Normal-Mode] 轉帳金額輸入錯誤次數: ${errorCount}`);
                                }
                                if (errorCount >= 3) {
                                    ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在正確按鍵: ${expectedDigit}`);
                                    this.showATMEasyHint('transfer_input_' + currentScene, `.screen-key-btn[data-key="${expectedDigit}"]`, true);
                                }
                            }

                            // 🔧 [修正] 錯誤時不清除提示，保持提示動畫持續顯示
                            // this.clearATMEasyHint(); // 註解掉，讓錯誤時提示動畫繼續存在

                            // 播放錯誤音效
                            const errorAudio = new Audio('../audio/units/error.mp3');
                            errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                            // 播放語音提示（提示動畫保持不變）
                            // 🔧 [Phase 3] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                this.speech.speak(`請輸入 ${expectedDigit}`);
                            }, 300, 'speechDelay');

                            return; // 直接返回，不執行後續邏輯
                        }
                    }

                    // 正確輸入或非簡單模式
                    if (key >= '0' && key <= '9') {
                        this.speech.speak(key);
                        this.handleTransferNumberInput(key, currentScene);
                        this.audio.playBeep();
                    } else if (key === 'clear') {
                        // 🔧 [修正] 簡單/普通模式下,清除鍵顯示錯誤且無作用
                        if (this.shouldShowHint()) {
                            ATM.Debug.log('hint', '❌ [轉帳] 簡單/普通模式下不允許使用清除鍵');
                            // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後顯示提示
                            if (this.state.settings.difficulty === 'normal') {
                                let errorCount = 0;
                                let hintDigit = '';
                                let hintSelector = '';
                                if (currentScene === 'bank-code-entry' && this.state.gameState.easyModeHints.assignedBankCode) {
                                    this.state.gameState.normalModeErrors.bankCodeErrorCount++;
                                    errorCount = this.state.gameState.normalModeErrors.bankCodeErrorCount;
                                    const p = this.state.gameState.transfer.bankCode.length;
                                    hintDigit = this.state.gameState.easyModeHints.assignedBankCode[p] || '';
                                    hintSelector = hintDigit ? `.screen-key-btn[data-key="${hintDigit}"]` : '.screen-key-btn[data-key="enter"]';
                                    ATM.Debug.log('hint', `🔢 [Normal-Mode] 銀行代碼清除鍵錯誤次數: ${errorCount}`);
                                } else if (currentScene === 'account-entry' && this.state.gameState.easyModeHints.assignedAccountNumber) {
                                    this.state.gameState.normalModeErrors.accountNumberErrorCount++;
                                    errorCount = this.state.gameState.normalModeErrors.accountNumberErrorCount;
                                    const p = this.state.gameState.transfer.accountNumber.length;
                                    hintDigit = this.state.gameState.easyModeHints.assignedAccountNumber[p] || '';
                                    hintSelector = hintDigit ? `.screen-key-btn[data-key="${hintDigit}"]` : '.screen-key-btn[data-key="enter"]';
                                    ATM.Debug.log('hint', `🔢 [Normal-Mode] 帳號清除鍵錯誤次數: ${errorCount}`);
                                } else if (currentScene === 'transfer-amount-entry' && this.state.gameState.easyModeHints.assignedAmount) {
                                    this.state.gameState.normalModeErrors.transferAmountErrorCount++;
                                    errorCount = this.state.gameState.normalModeErrors.transferAmountErrorCount;
                                    const amtStr = this.state.gameState.easyModeHints.assignedAmount.toString();
                                    const p = this.state.gameState.transfer.amount > 0 ? this.state.gameState.transfer.amount.toString().length : 0;
                                    hintDigit = amtStr[p] || '';
                                    hintSelector = hintDigit ? `.screen-key-btn[data-key="${hintDigit}"]` : '.screen-key-btn[data-key="enter"]';
                                    ATM.Debug.log('hint', `🔢 [Normal-Mode] 轉帳金額清除鍵錯誤次數: ${errorCount}`);
                                }
                                if (errorCount >= 3 && hintSelector) {
                                    ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫: ${hintSelector}`);
                                    this.showATMEasyHint('transfer_clear_hint', hintSelector, true);
                                }
                            }
                            const errorAudio = new Audio('../audio/units/error.mp3');
                            errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                            this.speech.speak('請依序輸入正確數字');
                            return;
                        }
                        this.speech.speak('清除');
                        this.handleTransferClear(currentScene);
                        this.audio.playBeep();
                    } else if (key === 'enter') {
                        // 🔧 [修正] 移除此處的「確認」語音，因為 handleTransferEnter 會調用場景切換函數
                        // 每個場景切換函數 (showAccountInputScreen, showTransferAmountInputScreen 等)
                        // 都已經提供了適當的語音回饋（如「請輸入轉入帳號」、「請輸入轉帳金額」等）
                        // 避免重複播放語音
                        this.handleTransferEnter(currentScene);
                        this.audio.playBeep();
                    } else if (key === 'cancel') {
                        // 🔧 [修正] 簡單/普通模式下,取消鍵顯示錯誤且無作用
                        if (this.shouldShowHint()) {
                            ATM.Debug.log('hint', '❌ [轉帳] 簡單/普通模式下不允許使用取消鍵');
                            // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後顯示提示
                            if (this.state.settings.difficulty === 'normal') {
                                let errorCount = 0;
                                let hintDigit = '';
                                let hintSelector = '';
                                if (currentScene === 'bank-code-entry' && this.state.gameState.easyModeHints.assignedBankCode) {
                                    this.state.gameState.normalModeErrors.bankCodeErrorCount++;
                                    errorCount = this.state.gameState.normalModeErrors.bankCodeErrorCount;
                                    const p = this.state.gameState.transfer.bankCode.length;
                                    hintDigit = this.state.gameState.easyModeHints.assignedBankCode[p] || '';
                                    hintSelector = hintDigit ? `.screen-key-btn[data-key="${hintDigit}"]` : '.screen-key-btn[data-key="enter"]';
                                    ATM.Debug.log('hint', `🔢 [Normal-Mode] 銀行代碼取消鍵錯誤次數: ${errorCount}`);
                                } else if (currentScene === 'account-entry' && this.state.gameState.easyModeHints.assignedAccountNumber) {
                                    this.state.gameState.normalModeErrors.accountNumberErrorCount++;
                                    errorCount = this.state.gameState.normalModeErrors.accountNumberErrorCount;
                                    const p = this.state.gameState.transfer.accountNumber.length;
                                    hintDigit = this.state.gameState.easyModeHints.assignedAccountNumber[p] || '';
                                    hintSelector = hintDigit ? `.screen-key-btn[data-key="${hintDigit}"]` : '.screen-key-btn[data-key="enter"]';
                                    ATM.Debug.log('hint', `🔢 [Normal-Mode] 帳號取消鍵錯誤次數: ${errorCount}`);
                                } else if (currentScene === 'transfer-amount-entry' && this.state.gameState.easyModeHints.assignedAmount) {
                                    this.state.gameState.normalModeErrors.transferAmountErrorCount++;
                                    errorCount = this.state.gameState.normalModeErrors.transferAmountErrorCount;
                                    const amtStr = this.state.gameState.easyModeHints.assignedAmount.toString();
                                    const p = this.state.gameState.transfer.amount > 0 ? this.state.gameState.transfer.amount.toString().length : 0;
                                    hintDigit = amtStr[p] || '';
                                    hintSelector = hintDigit ? `.screen-key-btn[data-key="${hintDigit}"]` : '.screen-key-btn[data-key="enter"]';
                                    ATM.Debug.log('hint', `🔢 [Normal-Mode] 轉帳金額取消鍵錯誤次數: ${errorCount}`);
                                }
                                if (errorCount >= 3 && hintSelector) {
                                    ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫: ${hintSelector}`);
                                    this.showATMEasyHint('transfer_cancel_hint', hintSelector, true);
                                }
                            }
                            const errorAudio = new Audio('../audio/units/error.mp3');
                            errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                            this.speech.speak('請依序輸入正確數字');
                            return;
                        }
                        // 🔧 [新增] 困難模式+指定任務：禁止取消，防止斷流
                        if (this.state.settings.difficulty === 'hard' && this.state.settings.sessionType !== 'free') {
                            ATM.Debug.log('flow', '❌ 取消按鈕：困難模式+指定任務不允許取消（轉帳輸入畫面）');
                            const errorAudio = new Audio('../audio/units/error.mp3');
                            errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                            this.speech.speak('指定任務進行中，不可取消');
                            return;
                        }
                        this.speech.speak('取消');
                        this.handleTransferCancel();
                        this.audio.playBeep();
                    }
                });
            });
        },

        // 處理轉帳數字輸入
        handleTransferNumberInput(key, scene) {
            if (scene === 'bank-code-entry') {
                // 🔧 [修正] 所有難度模式下，如果有指定銀行代碼，都需要驗證
                if (this.state.gameState.easyModeHints.assignedBankCode) {
                    const assignedCode = this.state.gameState.easyModeHints.assignedBankCode;
                    const currentLength = this.state.gameState.transfer.bankCode.length;

                    // 如果已經達到指定長度，不再接受輸入
                    if (currentLength >= assignedCode.length) {
                        ATM.Debug.log('hint', `❌ [轉帳] 銀行代碼已輸入完成（${currentLength}位），應按確認鍵`);
                        // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後在確認鍵顯示提示
                        if (this.state.settings.difficulty === 'normal') {
                            this.state.gameState.normalModeErrors.bankCodeErrorCount++;
                            const errorCount = this.state.gameState.normalModeErrors.bankCodeErrorCount;
                            ATM.Debug.log('hint', `🔢 [Normal-Mode] 銀行代碼完成後按錯誤次數: ${errorCount}`);
                            if (errorCount >= 3) {
                                ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在確認鍵上`);
                                this.TimerManager.setTimeout(() => {
                                    this.showATMEasyHint('bank_code_confirm', '.screen-key-btn[data-key="enter"]', true);
                                }, 300, 'hintAnimation');
                            }
                        }
                        const errorAudio = new Audio('../audio/units/error.mp3');
                        errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                        return;
                    }

                    // 🔧 [新增] 檢查輸入的數字是否正確
                    const expectedDigit = assignedCode[currentLength];
                    if (key !== expectedDigit) {
                        ATM.Debug.log('hint', `❌ [轉帳] 輸入錯誤：輸入了 ${key}，應該輸入 ${expectedDigit}`);

                        // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後顯示提示
                        if (this.state.settings.difficulty === 'normal') {
                            this.state.gameState.normalModeErrors.bankCodeErrorCount++;
                            const errorCount = this.state.gameState.normalModeErrors.bankCodeErrorCount;
                            ATM.Debug.log('hint', `🔢 [Normal-Mode] 銀行代碼輸入錯誤次數: ${errorCount}`);

                            if (errorCount >= 3) {
                                // 達到3次，立即顯示提示動畫
                                ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在正確按鍵上`);
                                this.showATMEasyHint('bank_code_input', `.screen-key-btn[data-key="${expectedDigit}"]`, true);
                            }
                        }

                        const errorAudio = new Audio('../audio/units/error.mp3');
                        errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                        // 🔧 [修正] 只在簡單/普通模式播放語音提示
                        if (this.shouldShowHint()) {
                            // 🔧 [Phase 3] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                this.speech.speak(`請輸入 ${expectedDigit}`);
                            }, 300, 'speechDelay');
                        }
                        return; // 不記錄錯誤輸入
                    } else if (this.state.settings.difficulty === 'normal') {
                        // 🔧 [新增] 普通模式：正確輸入後重置錯誤計數
                        this.state.gameState.normalModeErrors.bankCodeErrorCount = 0;
                    }
                }

                // 銀行代碼最多3位數
                if (this.state.gameState.transfer.bankCode.length < 3) {
                    this.state.gameState.transfer.bankCode += key;

                    // 輸入正確，記錄日誌
                    if (this.state.settings.difficulty === 'easy') {
                        const progress = this.state.gameState.transfer.bankCode.length - 1;
                        ATM.Debug.log('hint', `✅ [轉帳] 銀行代碼輸入正確：第${progress + 1}位 = ${key}`);
                    }

                    // 🔧 [修正] 只更新顯示，不重新渲染整個畫面（避免重複播放語音和提示）
                    const bankCodeDisplay = document.querySelector('.bank-code-display');
                    const bankNameDisplay = document.querySelector('.bank-name-display');
                    if (bankCodeDisplay) {
                        const bankCode = this.state.gameState.transfer.bankCode;
                        bankCodeDisplay.textContent = bankCode || '___';
                        if (bankNameDisplay) {
                            bankNameDisplay.textContent = this.getBankNameByCode(bankCode);
                        }
                    }

                    // 🔧 [修正] 簡單/普通模式：逐位提示銀行代碼輸入
                    if (this.shouldShowHint() &&
                        this.state.gameState.easyModeHints.assignedBankCode) {
                        const currentLength = this.state.gameState.transfer.bankCode.length;
                        const assignedCode = this.state.gameState.easyModeHints.assignedBankCode;

                        // 🔧 [修正] 清除當前提示（立即清除）
                        this.clearATMEasyHint();

                        if (currentLength < 3) {
                            // 還未完成，立即顯示下一位數字提示
                            const nextDigit = assignedCode[currentLength];
                            this.showATMEasyHint('bank_code_input', `.screen-key-btn[data-key="${nextDigit}"]`);
                            ATM.Debug.log('hint', `💛 提示輸入銀行代碼第${currentLength + 1}位: ${nextDigit}`);
                        } else {
                            // 3位數都輸入完成，立即提示按確認鍵
                            this.showATMEasyHint('bank_code_confirm', '.screen-key-btn[data-key="enter"]');
                            ATM.Debug.log('hint', '💛 銀行代碼輸入完成，提示按確認鍵');
                        }
                    }
                }
            } else if (scene === 'account-entry') {
                // 🔧 [修改] 困難模式+自選服務：允許自由輸入帳號，不驗證指定帳號
                const isHardFreeMode = (this.state.settings.difficulty === 'hard' &&
                                       this.state.settings.sessionType === 'free');

                // 只在非困難+自選模式下驗證指定帳號
                if (!isHardFreeMode && this.state.gameState.easyModeHints.assignedAccountNumber) {
                    const assignedAccount = this.state.gameState.easyModeHints.assignedAccountNumber;
                    const currentLength = this.state.gameState.transfer.accountNumber.length;

                    // 如果已經達到指定長度，不再接受輸入
                    if (currentLength >= assignedAccount.length) {
                        ATM.Debug.log('hint', `❌ [轉帳] 帳號已輸入完成（${currentLength}位），應按確認鍵`);
                        // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後在確認鍵顯示提示
                        if (this.state.settings.difficulty === 'normal') {
                            this.state.gameState.normalModeErrors.accountNumberErrorCount++;
                            const errorCount = this.state.gameState.normalModeErrors.accountNumberErrorCount;
                            ATM.Debug.log('hint', `🔢 [Normal-Mode] 帳號完成後按錯誤次數: ${errorCount}`);
                            if (errorCount >= 3) {
                                ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在確認鍵上`);
                                this.TimerManager.setTimeout(() => {
                                    this.showATMEasyHint('account_confirm', '.screen-key-btn[data-key="enter"]', true);
                                }, 300, 'hintAnimation');
                            }
                        }
                        const errorAudio = new Audio('../audio/units/error.mp3');
                        errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                        return;
                    }

                    // 🔧 [新增] 檢查輸入的數字是否正確
                    const expectedDigit = assignedAccount[currentLength];
                    if (key !== expectedDigit) {
                        ATM.Debug.log('hint', `❌ [轉帳] 輸入錯誤：輸入了 ${key}，應該輸入 ${expectedDigit}`);

                        // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後顯示提示
                        if (this.state.settings.difficulty === 'normal') {
                            this.state.gameState.normalModeErrors.accountNumberErrorCount++;
                            const errorCount = this.state.gameState.normalModeErrors.accountNumberErrorCount;
                            ATM.Debug.log('hint', `🔢 [Normal-Mode] 轉帳帳號輸入錯誤次數: ${errorCount}`);

                            if (errorCount >= 3) {
                                // 達到3次，立即顯示提示動畫
                                ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在正確按鍵上`);
                                this.showATMEasyHint('account_input', `.screen-key-btn[data-key="${expectedDigit}"]`, true);
                            }
                        }

                        const errorAudio = new Audio('../audio/units/error.mp3');
                        errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                        // 🔧 [修正] 只在簡單/普通模式播放語音提示
                        if (this.shouldShowHint()) {
                            // 🔧 [Phase 3] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                this.speech.speak(`請輸入 ${expectedDigit}`);
                            }, 300, 'speechDelay');
                        }
                        return; // 不記錄錯誤輸入
                    } else if (this.state.settings.difficulty === 'normal') {
                        // 🔧 [新增] 普通模式：正確輸入後重置錯誤計數
                        this.state.gameState.normalModeErrors.accountNumberErrorCount = 0;
                    }
                }

                // 帳號最多14位數
                if (this.state.gameState.transfer.accountNumber.length < 14) {
                    this.state.gameState.transfer.accountNumber += key;

                    // 輸入正確，記錄日誌
                    if (this.state.settings.difficulty === 'easy') {
                        const progress = this.state.gameState.transfer.accountNumber.length - 1;
                        ATM.Debug.log('hint', `✅ [轉帳] 帳號輸入正確：第${progress + 1}位 = ${key}`);
                    }

                    // 🔧 [修正] 只更新顯示，不重新渲染整個畫面（避免重複播放語音和提示）
                    const accountDisplay = document.querySelector('.account-display');
                    if (accountDisplay) {
                        const accountNumber = this.state.gameState.transfer.accountNumber;
                        accountDisplay.textContent = accountNumber || '__________';
                    }

                    // 🔧 [修正] 簡單/普通模式：逐位提示帳號輸入（困難+自選模式跳過）
                    if (!isHardFreeMode &&
                        this.shouldShowHint() &&
                        this.state.gameState.easyModeHints.assignedAccountNumber) {
                        const currentLength = this.state.gameState.transfer.accountNumber.length;
                        const assignedAccount = this.state.gameState.easyModeHints.assignedAccountNumber;

                        // 🔧 [修正] 清除當前提示（立即清除）
                        this.clearATMEasyHint();

                        if (currentLength < assignedAccount.length) {
                            // 還未完成，立即顯示下一位數字提示
                            const nextDigit = assignedAccount[currentLength];
                            this.showATMEasyHint('account_input', `.screen-key-btn[data-key="${nextDigit}"]`);
                            ATM.Debug.log('hint', `💛 提示輸入帳號第${currentLength + 1}位: ${nextDigit}`);
                        } else {
                            // 帳號都輸入完成，立即提示按確認鍵
                            this.showATMEasyHint('account_confirm', '.screen-key-btn[data-key="enter"]');
                            ATM.Debug.log('hint', '💛 帳號輸入完成，提示按確認鍵');
                        }
                    }
                }
            } else if (scene === 'transfer-amount-entry') {
                // 金額輸入
                // 🔧 [修正] 所有難度模式下，如果有指定金額，都需要驗證
                if (this.state.gameState.easyModeHints.assignedAmount) {
                    const assignedAmount = this.state.gameState.easyModeHints.assignedAmount;
                    const currentAmount = this.state.gameState.transfer.amount;

                    // 如果當前金額已經等於指定金額，不再接受輸入
                    if (currentAmount === assignedAmount) {
                        ATM.Debug.log('hint', `❌ [轉帳] 金額已輸入完成，應按確認鍵`);
                        // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後在確認鍵顯示提示
                        if (this.state.settings.difficulty === 'normal') {
                            this.state.gameState.normalModeErrors.transferAmountErrorCount++;
                            const errorCount = this.state.gameState.normalModeErrors.transferAmountErrorCount;
                            ATM.Debug.log('hint', `🔢 [Normal-Mode] 轉帳金額完成後按錯誤次數: ${errorCount}`);
                            if (errorCount >= 3) {
                                ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在確認鍵上`);
                                this.TimerManager.setTimeout(() => {
                                    this.showATMEasyHint('transfer_amount_confirm', '.screen-key-btn[data-key="enter"]', true);
                                }, 300, 'hintAnimation');
                            }
                        }
                        const errorAudio = new Audio('../audio/units/error.mp3');
                        errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                        return; // 直接返回，不執行後續邏輯
                    }

                    // 🔧 [新增] 檢查輸入的數字是否正確
                    const assignedAmountStr = assignedAmount.toString();
                    const currentLength = currentAmount === 0 ? 0 : currentAmount.toString().length;
                    const expectedDigit = assignedAmountStr[currentLength];

                    if (key !== expectedDigit) {
                        ATM.Debug.log('hint', `❌ [轉帳] 輸入錯誤：輸入了 ${key}，應該輸入 ${expectedDigit}`);

                        // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後顯示提示
                        if (this.state.settings.difficulty === 'normal') {
                            this.state.gameState.normalModeErrors.transferAmountErrorCount++;
                            const errorCount = this.state.gameState.normalModeErrors.transferAmountErrorCount;
                            ATM.Debug.log('hint', `🔢 [Normal-Mode] 轉帳金額輸入錯誤次數: ${errorCount}`);

                            if (errorCount >= 3) {
                                // 達到3次，立即顯示提示動畫
                                ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在正確按鍵上`);
                                this.showATMEasyHint('amount_input', `.screen-key-btn[data-key="${expectedDigit}"]`, true);
                            }
                        }

                        const errorAudio = new Audio('../audio/units/error.mp3');
                        errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                        // 🔧 [修正] 只在簡單/普通模式播放語音提示
                        if (this.shouldShowHint()) {
                            // 🔧 [Phase 3] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                this.speech.speak(`請輸入 ${expectedDigit}`);
                            }, 300, 'speechDelay');
                        }
                        return; // 不記錄錯誤輸入
                    } else if (this.state.settings.difficulty === 'normal') {
                        // 🔧 [新增] 普通模式：正確輸入後重置錯誤計數
                        this.state.gameState.normalModeErrors.transferAmountErrorCount = 0;
                    }
                }

                const currentAmount = this.state.gameState.transfer.amount;
                const newAmount = currentAmount * 10 + parseInt(key);
                if (newAmount <= 100000) {  // 最大轉帳金額10萬
                    this.state.gameState.transfer.amount = newAmount;

                    // 輸入正確，記錄日誌
                    if (this.state.settings.difficulty === 'easy') {
                        const progress = newAmount.toString().length - 1;
                        ATM.Debug.log('hint', `✅ [轉帳] 金額輸入正確：第${progress + 1}位 = ${key}`);
                    }

                    // 🔧 [修正] 只更新顯示，不重新渲染整個畫面（避免重複播放語音和提示）
                    const amountDisplay = document.querySelector('.amount-display');
                    if (amountDisplay) {
                        amountDisplay.textContent = newAmount.toLocaleString();
                    }

                    // 🔧 [修正] 簡單/普通模式：逐位提示金額輸入
                    if (this.shouldShowHint() &&
                        this.state.gameState.easyModeHints.assignedAmount) {
                        const assignedAmount = this.state.gameState.easyModeHints.assignedAmount;

                        // 🔧 [修正] 清除當前提示
                        this.clearATMEasyHint();

                        // 🔧 [修正] 優先檢查是否已完成輸入
                        if (newAmount === assignedAmount) {
                            // 金額輸入完成且正確，立即提示按確認鈕
                            this.showATMEasyHint('transfer_amount_confirm', '.screen-key-btn[data-key="enter"]');
                            ATM.Debug.log('hint', '💛 轉帳金額輸入完成，提示按確認鈕');
                        } else {
                            // 還未完成，立即顯示下一位數字提示
                            const currentLength = this.state.gameState.transfer.amount.toString().length;
                            const assignedAmountStr = assignedAmount.toString();

                            if (currentLength < assignedAmountStr.length) {
                                const nextDigit = assignedAmountStr[currentLength];
                                this.showATMEasyHint('transfer_amount_input', `.screen-key-btn[data-key="${nextDigit}"]`);
                                ATM.Debug.log('hint', `💛 提示輸入轉帳金額第${currentLength + 1}位: ${nextDigit}`);
                            }
                        }
                    }
                }
            }
        },

        // 處理轉帳清除
        handleTransferClear(scene) {
            // 🔧 [修正] 清除提示動畫
            this.clearATMEasyHint();

            if (scene === 'bank-code-entry') {
                this.state.gameState.transfer.bankCode = '';
                this.showBankCodeInputScreen();

                // 重新顯示第一位提示
                if (this.state.settings.difficulty === 'easy' &&
                    this.state.gameState.easyModeHints.assignedBankCode) {
                    const firstDigit = this.state.gameState.easyModeHints.assignedBankCode[0];
                    // 🔧 [Phase 2d] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        if (this.state.gameState.currentScene === 'bank-code-entry' &&
                            !this.state.gameState.easyModeHints.enabled) {
                            this.showATMEasyHint('bank_code_input', `.screen-key-btn[data-key="${firstDigit}"]`);
                            ATM.Debug.log('hint', `💛 清除後提示輸入銀行代碼第1位: ${firstDigit}`);
                        }
                    }, 300, 'hintAnimation');
                }
            } else if (scene === 'account-entry') {
                this.state.gameState.transfer.accountNumber = '';
                this.showAccountInputScreen();

                // 重新顯示第一位提示
                if (this.state.settings.difficulty === 'easy' &&
                    this.state.gameState.easyModeHints.assignedAccountNumber) {
                    const firstDigit = this.state.gameState.easyModeHints.assignedAccountNumber[0];
                    // 🔧 [Phase 2d] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        if (this.state.gameState.currentScene === 'account-entry' &&
                            !this.state.gameState.easyModeHints.enabled) {
                            this.showATMEasyHint('account_input', `.screen-key-btn[data-key="${firstDigit}"]`);
                            ATM.Debug.log('hint', `💛 清除後提示輸入帳號第1位: ${firstDigit}`);
                        }
                    }, 300, 'hintAnimation');
                }
            } else if (scene === 'transfer-amount-entry') {
                this.state.gameState.transfer.amount = 0;
                this.showTransferAmountInputScreen();

                // 重新顯示第一位提示
                if (this.state.settings.difficulty === 'easy' &&
                    this.state.gameState.easyModeHints.assignedAmount) {
                    const firstDigit = this.state.gameState.easyModeHints.assignedAmount.toString()[0];
                    // 🔧 [Phase 2d] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        if (this.state.gameState.currentScene === 'transfer-amount-entry' &&
                            !this.state.gameState.easyModeHints.enabled) {
                            this.showATMEasyHint('transfer_amount_input', `.screen-key-btn[data-key="${firstDigit}"]`);
                            ATM.Debug.log('hint', `💛 清除後提示輸入轉帳金額第1位: ${firstDigit}`);
                        }
                    }, 300, 'hintAnimation');
                }
            }
        },

        // 處理轉帳確認
        handleTransferEnter(scene) {
            if (scene === 'bank-code-entry') {
                // 驗證銀行代碼
                const bankCode = this.state.gameState.transfer.bankCode;
                if (bankCode.length !== 3) {
                    // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後在下一位數字顯示提示
                    if (this.state.settings.difficulty === 'normal') {
                        this.state.gameState.normalModeErrors.bankCodeErrorCount++;
                        const errorCount = this.state.gameState.normalModeErrors.bankCodeErrorCount;
                        ATM.Debug.log('hint', `🔢 [Normal-Mode] 銀行代碼未完成按確認鍵錯誤次數: ${errorCount}`);
                        if (errorCount >= 3 && this.state.gameState.easyModeHints.assignedBankCode) {
                            const p = this.state.gameState.transfer.bankCode.length;
                            const nextDigit = this.state.gameState.easyModeHints.assignedBankCode[p] || '';
                            if (nextDigit) {
                                ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在下一位數: ${nextDigit}`);
                                this.TimerManager.setTimeout(() => {
                                    this.showATMEasyHint('bank_code_input', `.screen-key-btn[data-key="${nextDigit}"]`, true);
                                }, 300, 'hintAnimation');
                            }
                        }
                    }
                    this.speech.speak('請輸入3位數銀行代碼');
                    return;
                }

                const bankName = this.getBankNameByCode(bankCode);
                if (bankName === '') {
                    this.speech.speak('銀行代碼不存在，請重新輸入', {
                        callback: () => {
                            this.state.gameState.transfer.bankCode = '';
                            this.showBankCodeInputScreen();
                        }
                    });
                    return;
                }

                this.state.gameState.transfer.bankName = bankName;
                this.showAccountInputScreen();
            } else if (scene === 'account-entry') {
                // 驗證帳號
                const accountNumber = this.state.gameState.transfer.accountNumber;
                if (accountNumber.length < 10) {
                    // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後在下一位數字顯示提示
                    if (this.state.settings.difficulty === 'normal') {
                        this.state.gameState.normalModeErrors.accountNumberErrorCount++;
                        const errorCount = this.state.gameState.normalModeErrors.accountNumberErrorCount;
                        ATM.Debug.log('hint', `🔢 [Normal-Mode] 帳號未完成按確認鍵錯誤次數: ${errorCount}`);
                        if (errorCount >= 3 && this.state.gameState.easyModeHints.assignedAccountNumber) {
                            const p = this.state.gameState.transfer.accountNumber.length;
                            const nextDigit = this.state.gameState.easyModeHints.assignedAccountNumber[p] || '';
                            if (nextDigit) {
                                ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在下一位數: ${nextDigit}`);
                                this.TimerManager.setTimeout(() => {
                                    this.showATMEasyHint('account_input', `.screen-key-btn[data-key="${nextDigit}"]`, true);
                                }, 300, 'hintAnimation');
                            }
                        }
                    }
                    this.speech.speak('帳號至少需要10位數，請重新輸入', {
                        callback: () => {
                            this.state.gameState.normalModeErrors.accountNumberErrorCount = 0;
                            this.state.gameState.transfer.accountNumber = '';
                            this.showAccountInputScreen();
                        }
                    });
                    return;
                }

                this.showTransferAmountInputScreen();
            } else if (scene === 'transfer-amount-entry') {
                // 驗證金額
                const amount = this.state.gameState.transfer.amount;
                if (amount <= 0) {
                    // 🔧 [新增] 普通模式：追蹤錯誤次數，3次後在第一位數字顯示提示
                    if (this.state.settings.difficulty === 'normal') {
                        this.state.gameState.normalModeErrors.transferAmountErrorCount++;
                        const errorCount = this.state.gameState.normalModeErrors.transferAmountErrorCount;
                        ATM.Debug.log('hint', `🔢 [Normal-Mode] 轉帳金額未輸入按確認鍵錯誤次數: ${errorCount}`);
                        if (errorCount >= 3 && this.state.gameState.easyModeHints.assignedAmount) {
                            const firstDigit = this.state.gameState.easyModeHints.assignedAmount.toString()[0];
                            ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在第一位數: ${firstDigit}`);
                            this.TimerManager.setTimeout(() => {
                                this.showATMEasyHint('transfer_amount_input', `.screen-key-btn[data-key="${firstDigit}"]`, true);
                            }, 300, 'hintAnimation');
                        }
                    }
                    this.speech.speak('請輸入有效金額');
                    return;
                }

                if (amount > this.state.gameState.accountBalance) {
                    this.speech.speak('餘額不足，請重新輸入金額');
                    return;
                }

                // 🔧 [修正] 困難模式 & 普通模式：檢查金額是否與指定金額相符
                const assignedAmount = this.state.gameState.easyModeHints.assignedAmount;
                if (assignedAmount && amount !== assignedAmount) {
                    ATM.Debug.log('hint', `❌ [轉帳金額錯誤] 輸入了 ${amount}，應該輸入 ${assignedAmount}`);
                    const errorAudio = new Audio('../audio/units/error.mp3');
                    errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                    // 清空已輸入的金額
                    this.state.gameState.transfer.amount = 0;

                    if (this.state.settings.difficulty === 'normal') {
                        // 🔧 [修正] 普通模式：顯示轉帳金額提示彈窗（同按下提示鈕）
                        // 傳入 skipAutoHint=true 避免重複顯示彈窗，傳入 isError=true 播放「不對，轉帳的金額是××元」
                        ATM.Debug.log('hint', '💡 [普通模式-轉帳] 金額錯誤，顯示提示彈窗');
                        // 先重新顯示轉帳金額輸入畫面（跳過自動提示）
                        this.showTransferAmountInputScreen(true);
                        // 延遲後顯示提示彈窗（標記為錯誤）
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            this.showTransferAmountHintModal(true);
                        }, 300, 'hintAnimation');
                    } else if (this.state.settings.difficulty === 'hard') {
                        // 困難模式：播放語音提示
                        this.speech.speak(`金額錯誤，請輸入${this.convertAmountToSpeech(assignedAmount)}`);
                        // 重新顯示轉帳金額輸入畫面
                        this.showTransferAmountInputScreen();
                    }
                    return;
                }

                this.showTransferVerificationScreen();
            }
        },

        // 處理轉帳取消
        handleTransferCancel() {
            if (this.state.settings.sessionType === 'free') {
                this.speech.speak('取消轉帳', {
                    callback: () => {
                        this.showCardEjectScreenForEndTransaction();
                    }
                });
                return;
            }
            this.speech.speak('取消轉帳');
            this.resetTransaction();
            this.updateScreen('menu');
            this.state.gameState.currentScene = 'menu';

            // 🔧 [新增] 重置流程步驟到選擇服務，允許重新選擇其他服務
            this.updateFlowStep('SELECT_SERVICE', this.state.gameState.currentFlowStep || 'TRANSFER');
        },

        // 顯示帳號輸入畫面
        showAccountInputScreen() {
            // 🔧 [新增] 更新流程步驟
            this.updateFlowStep('ENTER_ACCOUNT', 'ENTER_BANK_CODE');

            const screenContent = document.getElementById('screen-content');
            if (!screenContent) return;

            const accountNumber = this.state.gameState.transfer.accountNumber || '';
            const bankName = this.state.gameState.transfer.bankName || '';

            screenContent.innerHTML = `
                <div class="screen-account-entry" style="width: 100%; max-width: 500px; margin: 0 auto;">
                    <div class="account-header">
                        <h2 style="color: white;">請輸入轉入帳號</h2>
                        <div class="bank-name-info" style="color: #fbbf24; font-size: 1rem; margin: 10px 0;">
                            轉入銀行：${bankName}
                        </div>
                        <div class="account-input-area">
                            <div class="account-display" style="font-size: 1.8rem; color: #4ade80; font-weight: bold; min-height: 60px; display: flex; align-items: center; justify-content: center; width: 100%; max-width: 350px; margin: 0 auto;">
                                ${accountNumber || '請輸入10-14位數帳號'}
                            </div>
                        </div>
                        <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.8rem; margin-top: 8px;">
                            已輸入 ${accountNumber.length} 位數字（10-14位）
                        </div>
                    </div>

                    <div class="screen-keypad" style="width: 100%; max-width: 250px !important; margin: 0 auto; padding: 10px 0;">
                        <div class="screen-keypad-grid" style="gap: 8px !important; display: grid !important; grid-template-columns: repeat(3, 60px) !important; justify-content: center !important;">
                            <button class="screen-key-btn number-key" data-key="1" style="width: 60px !important; height: 40px !important;">1</button>
                            <button class="screen-key-btn number-key" data-key="2" style="width: 60px !important; height: 40px !important;">2</button>
                            <button class="screen-key-btn number-key" data-key="3" style="width: 60px !important; height: 40px !important;">3</button>

                            <button class="screen-key-btn number-key" data-key="4" style="width: 60px !important; height: 40px !important;">4</button>
                            <button class="screen-key-btn number-key" data-key="5" style="width: 60px !important; height: 40px !important;">5</button>
                            <button class="screen-key-btn number-key" data-key="6" style="width: 60px !important; height: 40px !important;">6</button>

                            <button class="screen-key-btn number-key" data-key="7" style="width: 60px !important; height: 40px !important;">7</button>
                            <button class="screen-key-btn number-key" data-key="8" style="width: 60px !important; height: 40px !important;">8</button>
                            <button class="screen-key-btn number-key" data-key="9" style="width: 60px !important; height: 40px !important;">9</button>

                            <button class="screen-key-btn action-key cancel-key" data-key="cancel" style="width: 60px !important; height: 40px !important;">取消</button>
                            <button class="screen-key-btn number-key" data-key="0" style="width: 60px !important; height: 40px !important;">0</button>
                            <button class="screen-key-btn action-key" data-key="clear" style="width: 60px !important; height: 40px !important;">清除</button>

                            <button class="screen-key-btn action-key enter-key" data-key="enter" style="width: 100% !important; height: 40px !important; grid-column: 1 / 4 !important;">確認</button>
                        </div>
                    </div>
                </div>
            `;

            this.state.gameState.currentScene = 'account-entry';
            this.updateTitleBar(5, '輸入轉入帳號');
            this.bindTransferKeypadEvents();

            // 🔧 [修正] 所有難度模式都需要生成帳號（點擊提示按鈕時需要）
            if (!this.state.gameState.easyModeHints.assignedAccountNumber) {
                const randomAccount = Math.floor(1000000000 + Math.random() * 9000000000).toString();
                this.state.gameState.easyModeHints.assignedAccountNumber = randomAccount;
                ATM.Debug.log('hint', `💛 生成隨機帳號: ${randomAccount}`);
            }

            // 🔧 [修正] 所有模式（簡單/普通/困難）：500ms 後自動顯示帳號提示彈窗
            if (this.state.gameState.easyModeHints.assignedAccountNumber) {
                this.TimerManager.setTimeout(() => {
                    if (this.state.gameState.currentScene === 'account-entry') {
                        this.showAccountHintModal();
                    }
                }, 500, 'hintAnimation');
                // 🔧 [修正] 簡單模式：另加視覺提示（彈窗消失後仍有按鈕高亮引導）
                if (this.state.settings.difficulty === 'easy') {
                    const assignedAccount = this.state.gameState.easyModeHints.assignedAccountNumber;
                    const firstDigit = assignedAccount[0];
                    this.TimerManager.setTimeout(() => {
                        if (this.state.gameState.currentScene === 'account-entry') {
                            this.showATMEasyHint('account_input', `.screen-key-btn[data-key="${firstDigit}"]`);
                            ATM.Debug.log('hint', `💛 提示輸入帳號第1位: ${firstDigit}`);
                        }
                    }, 1500, 'hintAnimation');
                }
            } else {
                this.speech.speak('請輸入轉入帳號');
            }
        },

        // 顯示轉帳金額輸入畫面
        // 🔧 [修正] 新增 skipAutoHint 參數，避免錯誤處理時重複顯示提示彈窗
        showTransferAmountInputScreen(skipAutoHint = false) {
            // 🔧 [新增] 更新流程步驟
            this.updateFlowStep('TRANSFER_AMOUNT_ENTRY', 'ENTER_ACCOUNT');

            // 🔧 [修正] 隱藏金額滑桿（轉帳金額輸入畫面不需要滑桿）
            this.hideAmountSlider();

            const screenContent = document.getElementById('screen-content');
            if (!screenContent) return;

            const amount = this.state.gameState.transfer.amount || 0;

            screenContent.innerHTML = `
                <div class="screen-transfer-amount-entry">
                    <div class="amount-header">
                        <h2 style="color: white;">請輸入轉帳金額</h2>
                        <div class="amount-input-area">
                            <div class="currency-symbol">NT$</div>
                            <div class="amount-display">${amount.toLocaleString()}</div>
                        </div>
                        <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; margin-top: 10px;">
                            帳戶餘額：NT$ ${this.state.gameState.accountBalance.toLocaleString()}
                        </div>
                    </div>

                    <div class="screen-keypad">
                        <div class="screen-keypad-grid">
                            <button class="screen-key-btn number-key" data-key="1">1</button>
                            <button class="screen-key-btn number-key" data-key="2">2</button>
                            <button class="screen-key-btn number-key" data-key="3">3</button>

                            <button class="screen-key-btn number-key" data-key="4">4</button>
                            <button class="screen-key-btn number-key" data-key="5">5</button>
                            <button class="screen-key-btn number-key" data-key="6">6</button>

                            <button class="screen-key-btn number-key" data-key="7">7</button>
                            <button class="screen-key-btn number-key" data-key="8">8</button>
                            <button class="screen-key-btn number-key" data-key="9">9</button>

                            <button class="screen-key-btn action-key cancel-key" data-key="cancel">取消</button>
                            <button class="screen-key-btn number-key" data-key="0">0</button>
                            <button class="screen-key-btn action-key" data-key="clear">清除</button>

                            <button class="screen-key-btn action-key enter-key" data-key="enter">確認</button>
                        </div>
                    </div>
                </div>
            `;

            this.state.gameState.currentScene = 'transfer-amount-entry';
            this.updateTitleBar(6, '輸入轉帳金額');
            this.bindTransferKeypadEvents();

            // 🔧 [修正] 所有模式（簡單/普通/困難）：500ms 後自動顯示轉帳金額提示彈窗（除非 skipAutoHint 為 true）
            if (!skipAutoHint && this.state.gameState.easyModeHints.assignedAmount) {
                this.TimerManager.setTimeout(() => {
                    if (this.state.gameState.currentScene === 'transfer-amount-entry') {
                        this.showTransferAmountHintModal();
                    }
                }, 500, 'hintAnimation');
                // 🔧 [修正] 簡單模式：另加視覺提示（彈窗消失後仍有按鈕高亮引導）
                if (this.state.settings.difficulty === 'easy') {
                    const assignedAmount = this.state.gameState.easyModeHints.assignedAmount;
                    const firstDigit = assignedAmount.toString()[0];
                    this.TimerManager.setTimeout(() => {
                        if (this.state.gameState.currentScene === 'transfer-amount-entry') {
                            this.showATMEasyHint('transfer_amount_input', `.screen-key-btn[data-key="${firstDigit}"]`);
                            ATM.Debug.log('hint', `💛 提示輸入轉帳金額第1位: ${firstDigit}`);
                        }
                    }, 1500, 'hintAnimation');
                }
            } else if (!skipAutoHint) {
                this.speech.speak('請輸入轉帳金額');
            }
        },

        // 顯示轉帳驗證畫面
        showTransferVerificationScreen() {
            // 🔧 [新增] 更新流程步驟
            this.updateFlowStep('TRANSFER_VERIFICATION', 'TRANSFER_AMOUNT_ENTRY');

            const screenContent = document.getElementById('screen-content');
            if (!screenContent) return;

            const transfer = this.state.gameState.transfer;
            const myAccountNumber = this.state.gameState.accountNumber;

            screenContent.innerHTML = `
                <div class="screen-transfer-verification">
                    <div class="verification-header">
                        <h2 style="color: white;">請確認轉帳資訊</h2>
                    </div>

                    <div class="verification-details" style="color: white; text-align: left; padding: 20px; font-size: 1rem; line-height: 2;">
                        <div><strong>轉出銀行：</strong>${transfer.myBankName} (${transfer.myBankCode})</div>
                        <div><strong>轉出帳號：</strong>${myAccountNumber}</div>
                        <div style="height: 20px;"></div>
                        <div><strong>轉入銀行：</strong>${transfer.bankName} (${transfer.bankCode})</div>
                        <div><strong>轉入帳號：</strong>${transfer.accountNumber}</div>
                        <div style="height: 20px;"></div>
                        <div style="color: #fbbf24; font-size: 1.2rem;"><strong>轉帳金額：</strong>NT$ ${transfer.amount.toLocaleString()}</div>
                    </div>

                    <div class="verification-buttons" style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                        <button class="verification-btn cancel-btn" style="background: #dc2626; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 1.1rem; cursor: pointer;">
                            ✖ 取消
                        </button>
                        <button class="verification-btn confirm-btn" style="background: #16a34a; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 1.1rem; cursor: pointer;">
                            ✓ 確認
                        </button>
                    </div>
                </div>
            `;

            this.state.gameState.currentScene = 'transfer-verification';
            this.updateTitleBar(7, '確認轉帳資訊');

            // 綁定按鈕事件
            document.querySelector('.cancel-btn').addEventListener('click', () => {
                // 🔧 [新增] 簡單/普通模式+指定任務：禁止取消，提示必須完成任務
                if (this.shouldShowHint() && this.state.settings.sessionType !== 'free') {
                    ATM.Debug.log('flow', '❌ 取消按鈕：簡單/普通指定任務模式下不允許取消（轉帳確認頁）');
                    this.state.gameState.normalModeErrors.transferVerifyErrorCount++;
                    const errorCount = this.state.gameState.normalModeErrors.transferVerifyErrorCount;
                    ATM.Debug.log('hint', `🔢 [Normal-Mode] 轉帳確認頁取消鍵錯誤次數: ${errorCount}`);
                    const errorAudio = new Audio('../audio/units/error.mp3');
                    errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                    this.TimerManager.setTimeout(() => {
                        this.speech.speak('請依序完成任務，不可取消');
                    }, 300, 'speechDelay');
                    if (errorCount >= 3) {
                        ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在確認鍵上`);
                        this.TimerManager.setTimeout(() => {
                            if (this.state.gameState.currentScene === 'transfer-verification') {
                                this.showATMEasyHint('transfer_verify_confirm', '.confirm-btn', true);
                            }
                        }, 500, 'hintAnimation');
                    }
                    return;
                }
                // 🔧 [修正] 根據難度模式和會話類型決定是否允許取消
                if (!this.validateAction('handleTransferVerifyCancel', '.cancel-btn')) {
                    return;
                }
                this.speech.speak('取消');
                this.handleTransferCancel();
            });

            document.querySelector('.confirm-btn').addEventListener('click', () => {
                // 🔧 [新增] 簡單模式下清除提示
                if (this.shouldShowHint()) {
                    this.clearATMEasyHint();
                }
                // 🔧 [修正] 移除「確認」語音,直接進入最終確認畫面
                this.showTransferConfirmationScreen();
            });

            // 播放語音
            this.speech.speak('請確認轉帳資訊', {
                callback: () => {
                    // 🔧 [新增] 簡單模式下顯示確認鍵提示
                    if (this.shouldShowHint()) {
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            if (this.state.gameState.currentScene === 'transfer-verification') {
                                this.clearATMEasyHint();
                                this.showATMEasyHint('transfer_verify_confirm', '.confirm-btn');
                                ATM.Debug.log('hint', '💛 提示按確認鍵');
                            }
                        }, 300, 'hintAnimation');
                    }
                }
            });
        },

        // 顯示最終確認畫面
        showTransferConfirmationScreen() {
            // 🔧 [新增] 更新流程步驟
            this.updateFlowStep('TRANSFER_CONFIRMATION', 'TRANSFER_VERIFICATION');

            const screenContent = document.getElementById('screen-content');
            if (!screenContent) return;

            const transfer = this.state.gameState.transfer;

            screenContent.innerHTML = `
                <div class="screen-transfer-confirmation">
                    <div class="confirmation-header">
                        <div style="font-size: 3rem;">⚠️</div>
                        <h2 style="color: #fbbf24; margin: 20px 0;">即將轉出您的款項</h2>
                    </div>

                    <div class="confirmation-message" style="color: white; font-size: 1.1rem; line-height: 1.8; padding: 20px;">
                        <p>您即將轉出 <strong style="color: #fbbf24;">NT$ ${transfer.amount.toLocaleString()}</strong></p>
                        <p>至 <strong style="color: #fbbf24;">${transfer.bankName}</strong></p>
                        <p>帳號 <strong style="color: #fbbf24;">${transfer.accountNumber}</strong></p>
                        <p style="margin-top: 20px; color: #f87171;">請再次確認，轉帳完成後無法取消</p>
                    </div>

                    <div class="confirmation-buttons" style="display: flex; gap: 20px; justify-content: center; margin-top: 30px;">
                        <button class="confirmation-btn cancel-btn" style="background: #dc2626; color: white; padding: 15px 40px; border: none; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">
                            取消
                        </button>
                        <button class="confirmation-btn confirm-btn" style="background: #16a34a; color: white; padding: 15px 40px; border: none; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">
                            確定轉帳
                        </button>
                    </div>
                </div>
            `;

            this.state.gameState.currentScene = 'transfer-confirmation';
            this.updateTitleBar(8, '最終確認');

            // 綁定按鈕事件
            document.querySelector('.cancel-btn').addEventListener('click', () => {
                // 🔧 [新增] 簡單/普通模式+指定任務：禁止取消，提示必須完成任務
                if (this.shouldShowHint() && this.state.settings.sessionType !== 'free') {
                    ATM.Debug.log('flow', '❌ 取消按鈕：簡單/普通指定任務模式下不允許取消（最終確認頁）');
                    this.state.gameState.normalModeErrors.transferConfirmErrorCount++;
                    const errorCount = this.state.gameState.normalModeErrors.transferConfirmErrorCount;
                    ATM.Debug.log('hint', `🔢 [Normal-Mode] 最終確認頁取消鍵錯誤次數: ${errorCount}`);
                    const errorAudio = new Audio('../audio/units/error.mp3');
                    errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));
                    this.TimerManager.setTimeout(() => {
                        this.speech.speak('請依序完成任務，不可取消');
                    }, 300, 'speechDelay');
                    if (errorCount >= 3) {
                        ATM.Debug.log('hint', `💡 [Normal-Mode] 錯誤達3次，顯示提示動畫在確定轉帳鍵上`);
                        this.TimerManager.setTimeout(() => {
                            if (this.state.gameState.currentScene === 'transfer-confirmation') {
                                this.showATMEasyHint('transfer_final_confirm', '.confirm-btn', true);
                            }
                        }, 500, 'hintAnimation');
                    }
                    return;
                }
                // 🔧 [修正] 根據難度模式和會話類型決定是否允許取消
                if (!this.validateAction('handleTransferFinalCancel', '.cancel-btn')) {
                    return;
                }
                this.speech.speak('取消');
                this.handleTransferCancel();
            });

            document.querySelector('.confirm-btn').addEventListener('click', () => {
                // 🔧 [新增] 簡單模式下清除提示
                if (this.shouldShowHint()) {
                    this.clearATMEasyHint();
                }
                this.speech.speak('確定轉帳');
                this.processTransfer();
            });

            // 播放語音
            this.speech.speak('即將轉出您的款項，請再次確認', {
                callback: () => {
                    // 🔧 [新增] 簡單模式下顯示確定轉帳鍵提示
                    if (this.shouldShowHint()) {
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            if (this.state.gameState.currentScene === 'transfer-confirmation') {
                                this.clearATMEasyHint();
                                this.showATMEasyHint('transfer_final_confirm', '.confirm-btn');
                                ATM.Debug.log('hint', '💛 提示按確定轉帳鍵');
                            }
                        }, 300, 'hintAnimation');
                    }
                }
            });
        },

        // 處理轉帳交易
        processTransfer() {
            const transfer = this.state.gameState.transfer;

            // 扣除餘額
            this.state.gameState.accountBalance -= transfer.amount;
            this.state.gameState.transactionAmount = transfer.amount;

            // 顯示處理中畫面
            this.updateScreen('processing');
            this.state.gameState.currentScene = 'processing';

            this.speech.speak('交易處理中，請稍候', {
                callback: () => {
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        // ✅ 步驟切換：交易處理中 → 明細表選項
                        this.updateFlowStep('RECEIPT_OPTIONS', 'PROCESSING');

                        this.showContinueTransactionQuestion();
                    }, 2000, 'screenTransition');
                }
            });
        },

        // 根據銀行代碼取得銀行名稱
        getBankNameByCode(code) {
            const banks = {
                '004': '臺灣銀行',
                '005': '臺灣土地銀行',
                '006': '合作金庫商業銀行',
                '007': '第一商業銀行',
                '008': '華南商業銀行',
                '009': '彰化商業銀行',
                '011': '上海商業儲蓄銀行',
                '012': '台北富邦商業銀行',
                '013': '國泰世華商業銀行',
                '016': '高雄銀行',
                '017': '兆豐國際商業銀行',
                '018': '全國農業金庫',
                '021': '花旗(台灣)商業銀行',
                '022': '美國銀行',
                '025': '首都銀行',
                '039': '澳盛(台灣)銀行',
                '040': '中華開發工業銀行',
                '048': '王道銀行',
                '050': '臺灣中小企業銀行',
                '052': '渣打國際商業銀行',
                '053': '台中商業銀行',
                '054': '京城商業銀行',
                '072': '德意志銀行',
                '075': '東亞銀行',
                '081': '滙豐(台灣)商業銀行',
                '101': '瑞興商業銀行',
                '102': '華泰商業銀行',
                '103': '臺灣新光商業銀行',
                '108': '陽信商業銀行',
                '118': '板信商業銀行',
                '147': '三信商業銀行',
                '700': '中華郵政（郵局）',
                '803': '聯邦銀行',
                '805': '遠東國際商業銀行',
                '806': '元大商業銀行',
                '807': '永豐商業銀行',
                '808': '玉山商業銀行',
                '809': '凱基商業銀行',
                '810': '星展(台灣)商業銀行',
                '812': '台新國際商業銀行',
                '814': '大眾銀行',
                '815': '日盛國際商業銀行',
                '816': '安泰商業銀行',
                '822': '中國信託商業銀行'
            };
            return banks[code] || '';
        },

        processTransaction(amountAlreadySpoken = false) {
            const amount = this.state.gameState.transactionAmount;
            const transactionType = this.state.gameState.currentTransaction.type;

            if (amount <= 0) {
                this.updateScreen('amount-entry', {
                    currentAmount: amount,
                    error: '請輸入有效金額'
                });
                return;
            }

            if (transactionType === 'withdraw' && amount > this.state.gameState.accountBalance) {
                this.speech.speak('餘額不足，請重新輸入金額', {
                    callback: () => {
                        this.updateScreen('amount-entry', {
                            currentAmount: amount,
                            error: '餘額不足，請重新輸入金額'
                        });
                    }
                });
                return;
            }

            // 決定是否播放確認金額的語音
            const proceedToProcessing = () => {
                // ✅ 步驟切換：確認金額 → 交易處理中
                this.updateFlowStep('PROCESSING', 'ENTER_AMOUNT');

                // 步驟1: 顯示「交易處理中，請稍候」並播放語音
                this.updateScreen('processing');
                this.state.gameState.currentScene = 'processing';

                this.speech.speak('交易處理中，請稍候', {
                    callback: () => {
                        // 等待語音播放完成後，等待2秒再進入下一步
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            this.showCashDispensingScreen(amount, transactionType);
                        }, 2000, 'screenTransition');
                    }
                });
            };

            if (amountAlreadySpoken) {
                // 如果金額語音已播放過，直接進入處理流程
                proceedToProcessing();
            } else {
                // 先播放確認金額的語音（僅適用於其他金額輸入）
                const amountText = this.convertAmountToSpeech(amount);
                this.speech.speak(amountText, {
                    callback: proceedToProcessing
                });
            }
        },

        // 步驟2: 顯示「數鈔中，請稍候」螢幕
        showCashDispensingScreen(amount, transactionType) {
            this.updateScreen('cash-dispensing');
            this.state.gameState.currentScene = 'cash-dispensing';

            this.speech.speak('發鈔中，請稍候', {
                callback: () => {
                    // 播放點鈔音效，等待播放完成後再進入下一步
                    this.audio.playCountMoney().then(() => {
                        this.completeTransactionProcess(amount, transactionType);
                    });
                }
            });
        },

        completeTransactionProcess(amount, transactionType) {
            // 更新帳戶餘額
            if (transactionType === 'withdraw') {
                this.state.gameState.accountBalance -= amount;
                this.audio.playCash(); // 播放出鈔音效

                // ✅ 步驟切換：處理完成 → 取走現金
                this.updateFlowStep('TAKE_CASH', 'PROCESSING');

                // 步驟3: 顯示新的「交易成功」畫面（包含明細表選項）
                this.showTransactionSuccessScreen();
            } else if (transactionType === 'deposit') {
                this.state.gameState.accountBalance += amount;
                this.speech.speak(`存款${this.convertAmountToSpeech(amount)}完成`, {
                    callback: () => {
                        this.showContinueTransactionQuestion();
                    }
                });
            }
        },

        /**
         * ✅ 共用函數：設定明細表選項的簡單模式提示
         *
         * 用途：
         * - 在簡單模式下，自動指定明細表選項為「列印」
         * - 顯示黃色提示動畫在「列印明細表」按鈕上
         * - 供 showTransactionSuccessScreen() 和 showContinueTransactionQuestion() 共用
         *
         * 未來擴展：
         * - 普通模式：可以隨機選擇「列印」或「不列印」
         * - 困難模式：不顯示提示，完全由用戶自行選擇
         *
         * @since 2025-10-19
         */
        setupReceiptOptionHint() {
            if (this.state.settings.difficulty === 'easy') {
                // ✅ 簡單模式：固定選擇列印明細表
                const assignedOption = 'print';
                this.state.gameState.easyModeHints.assignedReceiptOption = assignedOption;

                ATM.Debug.log('hint', `💛 指定明細表選項: 列印`);

                // 延遲300ms顯示提示，確保DOM已準備好
                // 🔧 [Phase 2d] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.showATMEasyHint('receipt_print', '.print-btn');

                    // 🔧 [v1.2.52] 移除重複的輔助點擊模式設置
                    // showATMEasyHint() 會調用 enableClickModeWithVisualDelay()，已經處理了輔助點擊的解鎖
                    // 不需要在這裡重複設置，否則會覆蓋 enableClickModeWithVisualDelay() 的時間回溯設定
                }, 300, 'hintAnimation');
            }

            // 普通模式和困難模式：不設定提示，由用戶自由選擇
            // 未來可在此添加普通模式的隨機選擇邏輯
        },

        // 步驟3: 顯示「交易成功」畫面（包含明細表選項）
        showTransactionSuccessScreen() {
            this.updateScreen('transaction-success');
            this.state.gameState.currentScene = 'transaction-success';

            // 🔧 [v1.2.51] 修改：先設定提示，再播放語音，讓視覺與聽覺同步
            // 這樣輔助點擊模式也能提早解鎖，用戶在聽語音時就可以點擊
            this.setupReceiptOptionHint();

            this.speech.speak('請選擇是否列印明細表', {
                callback: () => {
                    // 語音播放完成
                }
            });
        },

        // 綁定交易成功畫面的事件
        bindTransactionSuccessEvents() {
            document.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    this.audio.playBeep();
                    const action = event.currentTarget.getAttribute('data-action');

                    // ✅ 簡單模式：驗證是否選擇了正確的明細表選項
                    if (this.state.settings.difficulty === 'easy' &&
                        this.state.gameState.easyModeHints.assignedReceiptOption !== null &&
                        (action === 'print' || action === 'no-print')) {

                        const assignedOption = this.state.gameState.easyModeHints.assignedReceiptOption;

                        if (action !== assignedOption) {
                            // 選擇了錯誤的選項
                            ATM.Debug.log('hint', `❌ 明細表選項錯誤：點擊了 ${action}，應該點擊 ${assignedOption}`);

                            // 播放錯誤音效
                            const errorAudio = new Audio('../audio/units/error.mp3');
                            errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                            // 播放語音提示
                            // 🔧 [Phase 3] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                const optionText = assignedOption === 'print' ? '列印明細表' : '不印明細表';
                                this.speech.speak(`請選擇${optionText}`);
                            }, 300, 'speechDelay');

                            return; // 阻止繼續執行
                        }

                        // 選擇正確，清除提示
                        ATM.Debug.log('hint', `✅ 明細表選項正確：${action}`);
                        this.clearATMEasyHint();
                        if (!this.state.settings.clickMode) this.playStepSuccess();
                    }

                    if (action === 'screen-display') {
                        // 螢幕顯示完整資訊
                        this.handleScreenDisplay();
                    } else if (action === 'no-print') {
                        // 不印明細表的新流程
                        this.handleNoPrintReceiptNewFlow();
                    } else if (action === 'print') {
                        // 列印明細表的新流程
                        this.handlePrintReceiptNewFlow();
                    }
                });
            });
        },

        // 步驟3: 顯示「是否需列印明細表」（用於存款和舊流程）
        showContinueTransactionQuestion() {
            this.updateScreen('continue-transaction-question');
            this.state.gameState.currentScene = 'continue-transaction-question';

            // 🔧 [v1.2.51] 修改：先設定提示，再播放語音，讓視覺與聽覺同步
            // 這樣輔助點擊模式也能提早解鎖，用戶在聽語音時就可以點擊
            this.setupReceiptOptionHint();

            this.speech.speak('是否需列印明細表', {
                callback: () => {
                    // 語音播放完成
                }
            });
        },

        // 綁定明細表列印選項事件（原繼續交易事件改為明細表列印）
        bindContinueTransactionQuestionEvents() {
            document.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    this.audio.playBeep();
                    const action = event.currentTarget.getAttribute('data-action');

                    // ✅ 簡單模式：驗證是否選擇了正確的明細表選項
                    if (this.state.settings.difficulty === 'easy' &&
                        this.state.gameState.easyModeHints.assignedReceiptOption !== null &&
                        (action === 'print' || action === 'no-print')) {

                        const assignedOption = this.state.gameState.easyModeHints.assignedReceiptOption;

                        if (action !== assignedOption) {
                            // 選擇了錯誤的選項
                            ATM.Debug.log('hint', `❌ 明細表選項錯誤：點擊了 ${action}，應該點擊 ${assignedOption}`);

                            // 播放錯誤音效
                            const errorAudio = new Audio('../audio/units/error.mp3');
                            errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

                            // 重新顯示提示
                            // 🔧 [Phase 2d] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                const selector = assignedOption === 'print' ? '.print-btn' : '.no-print-btn';
                                this.showATMEasyHint(`receipt_${assignedOption}`, selector);

                                // 播放語音提示
                                // 🔧 [Phase 2d] 遷移至 TimerManager
                                this.TimerManager.setTimeout(() => {
                                    const optionText = assignedOption === 'print' ? '列印明細表' : '不印明細表';
                                    this.speech.speak(`請選擇${optionText}`);
                                }, 300, 'hintAnimation');
                            }, 300, 'hintAnimation');

                            return; // 阻止繼續執行
                        }

                        // 選擇正確，清除提示
                        ATM.Debug.log('hint', `✅ 明細表選項正確：${action}`);
                        this.clearATMEasyHint();
                        if (!this.state.settings.clickMode) this.playStepSuccess();
                    }

                    if (action === 'screen-display') {
                        // 螢幕顯示完整資訊
                        this.handleScreenDisplay();
                    } else if (action === 'no-print') {
                        // 🔧 [修正] 存款/查詢/轉帳：使用新流程（先取卡後顯示明細）- 所有難度模式
                        if (this.state.settings.sessionType === 'deposit' ||
                            this.state.settings.sessionType === 'inquiry' ||
                            this.state.settings.sessionType === 'transfer') {
                            this.handleNoPrintReceiptNewFlow();
                        } else {
                            // 提款：使用舊流程
                            this.handleNoPrintReceipt();
                        }
                    } else if (action === 'print') {
                        // 🔧 [修正] 存款/查詢/轉帳：使用新流程（先取卡後列印）- 所有難度模式
                        if (this.state.settings.sessionType === 'deposit' ||
                            this.state.settings.sessionType === 'inquiry' ||
                            this.state.settings.sessionType === 'transfer') {
                            this.handlePrintReceiptNewFlow();
                        } else {
                            // 提款：使用舊流程
                            this.handlePrintReceipt();
                        }
                    }
                });
            });
        },

        // 步驟4: 顯示「晶片金融卡已退出」螢幕和卡片退出動畫
        showCardEjectScreen() {
            // 🔧 [新增] 更新流程步驟到取回卡片
            this.updateFlowStep('TAKE_CARD', this.state.gameState.currentFlowStep || 'UNKNOWN');

            this.updateScreen('card-eject');
            this.state.gameState.currentScene = 'card-eject';

            // 顯示卡片退出動畫
            this.showCardEjectAnimation();
        },

        // 結束交易專用的卡片退出螢幕
        showCardEjectScreenForEndTransaction() {
            // 🔧 [新增] 更新流程步驟到取回卡片
            this.updateFlowStep('TAKE_CARD', this.state.gameState.currentFlowStep || 'UNKNOWN');

            this.updateScreen('card-eject-end');
            this.state.gameState.currentScene = 'card-eject-end';

            // 顯示卡片退出動畫
            this.showCardEjectAnimation();
        },

        // 結束交易並顯示現金的流程
        startEndTransactionWithCash() {
            this.updateScreen('card-eject-end');
            this.state.gameState.currentScene = 'card-eject-end-with-cash';
            
            this.speech.speak('結束交易，請取出您的金融卡', {
                callback: () => {
                    // 顯示卡片退出動畫
                    this.showCardEjectAnimation();
                }
            });
        },

        showCardEjectAnimation() {
            // 使用原本的卡片元素播放倒轉動畫
            const originalCard = document.getElementById('atm-card');
            if (originalCard) {
                // 確保卡片可見並重置狀態
                originalCard.style.display = 'block';
                originalCard.classList.remove('card-inserted', 'card-inserting');

                // 播放退出動畫（插入動畫的倒轉版本）
                originalCard.classList.add('card-returning');

                // 動畫完成後添加點擊事件和提示
                // 🔧 [Phase 2a] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    originalCard.addEventListener('click', () => {
                        this.handleCardTaken();
                    }, { once: true }); // 只監聯一次

                    // 新增「取回卡片」按鈕
                    this.addTakeCardButton();

                    // ✅ 所有難度模式都設置提示數據（困難模式只設置數據，不顯示）
                    this.showATMEasyHint('take_card', '.atm-card-area');
                    ATM.Debug.log('hint', '💛 設置取回卡片提示數據');
                }, 1800, 'cardAnimation'); // 等動畫完成
            }
        },

        // 在卡片退出畫面的卡片下方添加「取回卡片」按鈕
        addTakeCardButton() {
            const cardArea = document.querySelector('.atm-card-area');
            if (!cardArea) {
                ATM.Debug.error('🏧 找不到卡片展示區域');
                return;
            }

            // 檢查是否已經存在按鈕，避免重複添加
            const existingBtn = document.getElementById('take-card-btn-container');
            if (existingBtn) {
                ATM.Debug.log('flow', '🏧 取回卡片按鈕已存在，不重複添加');
                return;
            }

            // 創建按鈕容器
            const btnContainer = document.createElement('div');
            btnContainer.id = 'take-card-btn-container';
            btnContainer.style.cssText = `
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translate(-50%, -60px);
                z-index: 10001;
                text-align: center;
                width: 100%;
            `;

            // 創建按鈕
            const takeCardBtn = document.createElement('button');
            takeCardBtn.id = 'take-card-btn';
            takeCardBtn.innerHTML = '💳 取回卡片';
            takeCardBtn.style.cssText = `
                background: linear-gradient(135deg, #2196f3, #1976d2);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 25px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4);
                transition: all 0.3s ease;
                font-family: 'Microsoft JhengHei', sans-serif;
            `;

            // 點擊事件
            const clickHandler = () => {
                ATM.Debug.log('flow', '🏧 用戶點擊了「取回卡片」按鈕');
                this.clearATMEasyHint();
                btnContainer.remove();
                this.handleCardTaken();
            };

            takeCardBtn.addEventListener('click', clickHandler);
            btnContainer.appendChild(takeCardBtn);
            cardArea.appendChild(btnContainer);

            ATM.Debug.log('flow', '🏧 已在卡片下方添加「取回卡片」按鈕');
        },

        // 步驟5: 點擊金融卡後處理
        handleCardTaken() {
            // 播放「已取走金融卡」語音
            this.speech.speak('已取走金融卡', {
                callback: () => {
                    // 語音播放完成後再執行後續動作
                    this.processCardTakenActions();
                }
            });

            // 隱藏卡片（因為用戶已取走）
            const originalCard = document.getElementById('atm-card');
            if (originalCard) {
                originalCard.style.display = 'none';
            }
        },

        // 處理取走金融卡後的動作
        processCardTakenActions() {
            // 根據當前場景決定下一步動作
            if (this.state.gameState.currentScene === 'card-eject') {
                // 如果是正常提款流程，顯示「請收取現金」
                this.showTakeCashScreen();
            } else if (this.state.gameState.currentScene === 'card-eject-end') {
                // 檢查是否有提款金額且交易未完成，如果有則顯示現金
                if (this.state.gameState.transactionAmount > 0 &&
                    this.state.gameState.currentTransaction.type === 'withdraw' &&
                    !this.state.gameState.currentTransaction.completed) {
                    this.showTakeCashScreenWithMessage();
                } else {
                    // 顯示「謝謝惠顧歡迎下次使用」畫面後進入下一題
                    this.showThankYouThenProceed();
                }
            } else if (this.state.gameState.currentScene === 'card-eject-end-with-cash') {
                // 如果是結束交易但要顯示現金的流程
                this.showEndTransactionCash();
            }
        },

        // 恢復金融卡到原本位置和大小
        restoreCardToOriginalPosition() {
            const cardElement = document.getElementById('atm-card');
            if (cardElement) {
                // 移除所有卡片狀態的 CSS 類
                cardElement.classList.remove('card-inserting', 'card-inserted', 'card-returning');
                
                // 重設卡片狀態
                this.state.gameState.cardInserted = false;
                
                // 確保卡片顯示（移除 display: none）
                cardElement.style.display = 'block';
            }
            
            // 關閉卡片插槽的燈光效果
            const cardLight = document.getElementById('card-light');
            const cardSlit = document.getElementById('card-slit');
            if (cardLight) cardLight.classList.remove('active');
            if (cardSlit) cardSlit.classList.remove('active');
        },

        showTakeCashScreen() {
            ATM.Debug.log('flow', '🏧 showTakeCashScreen 調用，當前交易金額:', this.state.gameState.transactionAmount);
            this.updateScreen('take-cash');
            this.state.gameState.currentScene = 'take-cash';

            // 在取卡時才顯示現金
            this.showCashDispense();

            this.speech.speak('請收取現金', {
                callback: () => {
                    // 語音播放完成，等待用戶點擊「取走現金」按鈕
                }
            });
        },
        
        showTakeCashScreenWithMessage() {
            this.updateScreen('take-cash-with-message');
            this.state.gameState.currentScene = 'take-cash-with-message';
            
            // 在取卡時才顯示現金
            this.showCashDispense();
            
            this.speech.speak('請收取現金，並妥善保存', {
                callback: () => {
                    // 語音播放完成，等待用戶點擊「取走現金」按鈕
                }
            });
        },

        // 結束交易時顯示現金
        showEndTransactionCash() {
            // 設置一個模擬的交易金額（用於顯示現金）
            this.state.gameState.transactionAmount = 1000; // 模擬金額
            
            this.updateScreen('take-cash');
            this.state.gameState.currentScene = 'take-cash-end';
            
            // 顯示現金
            this.showCashDispense();
            
            this.speech.speak('請收取現金', {
                callback: () => {
                    // 語音播放完成，等待用戶點擊「取走現金」按鈕
                }
            });
        },

        showCashDispense() {
            // 1. 獲取封面和背景的元素
            const cashCover = document.getElementById('cash-display-cover');
            const cashBackground = document.getElementById('cash-display-background');
            const amount = this.state.gameState.transactionAmount;

            ATM.Debug.log('flow', '🏧 showCashDispense 檢查:', { amount, currentScene: this.state.gameState.currentScene });

            if (amount > 0 && cashCover && cashBackground) {
                // 2. 先播放封面 "沉沒" 動畫來打開出口
                cashCover.classList.add('opening');

                // 3. 準備現金內容並放入固定的背景中
                cashBackground.innerHTML = ''; // 清空舊內容
                cashBackground.style.display = 'flex'; // 確保背景可見

                const cashContainer = document.createElement('div');
                cashContainer.className = 'cash-bills-container';

                const bills = this.calculateBillCombination(amount);
                bills.forEach((bill, index) => {
                    const billImg = document.createElement('img');
                    billImg.className = 'cash-bill-img';
                    billImg.src = this.getRandomMoneyImage(bill.value);
                    billImg.alt = `${bill.value}元鈔票`;
                    billImg.style.animationDelay = `${index * 0.2}s`;
                    cashContainer.appendChild(billImg);
                });

                const takeCashBtn = document.createElement('button');
                takeCashBtn.className = 'take-cash-btn';
                takeCashBtn.innerHTML = '💰 取走現金';

                // 先設定樣式（確保按鈕在最上層）
                takeCashBtn.style.position = 'absolute';
                takeCashBtn.style.top = '50%';
                takeCashBtn.style.left = '50%';
                takeCashBtn.style.transform = 'translate(-50%, -50%)';
                takeCashBtn.style.zIndex = '10000'; // 提高 z-index
                takeCashBtn.style.pointerEvents = 'auto'; // 確保可以接收點擊

                // 加入 mouseenter 和 mouseleave 來檢測滑鼠是否在按鈕上
                takeCashBtn.onmouseenter = () => {
                    ATM.Debug.log('flow', ' 🖱️ 滑鼠進入「取走現金」按鈕');
                };
                takeCashBtn.onmouseleave = () => {
                    ATM.Debug.log('flow', ' 🖱️ 滑鼠離開「取走現金」按鈕');
                };

                // 🔧 改用 mousedown 事件，確保第一次按下就觸發
                takeCashBtn.addEventListener('mousedown', (event) => {
                    ATM.Debug.log('flow', ' 💰 取走現金按鈕被按下 (mousedown)');
                    event.stopPropagation(); // 防止事件冒泡
                    event.preventDefault(); // 防止預設行為

                    // 防止重複點擊
                    if (takeCashBtn.disabled) {
                        ATM.Debug.log('flow', ' ⚠️ 按鈕已禁用，忽略點擊');
                        return;
                    }
                    takeCashBtn.disabled = true;
                    takeCashBtn.style.opacity = '0.5';
                    takeCashBtn.style.cursor = 'not-allowed';
                    ATM.Debug.log('flow', ' 按鈕已禁用，準備顯示彈窗');

                    this.showCashModal();
                });

                cashBackground.appendChild(cashContainer);
                cashBackground.appendChild(takeCashBtn);

                ATM.Debug.log('flow', ' ✅ 取走現金按鈕已加入 DOM，z-index:', takeCashBtn.style.zIndex);

                const cashDispenser = document.getElementById('cash-dispenser');
                if (cashDispenser) {
                    cashDispenser.classList.add('dispensing');
                    // 🔧 [Phase 2b] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        cashDispenser.classList.remove('dispensing');
                    }, 2000, 'cashAnimation');
                }

                // 延遲檢查滾動拉桿需求（提款）
                // 🔧 [Phase 2b] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.showAmountSlider();
                    ATM.Debug.log('flow', '🏧 提款現金顯示完成，檢查拉桿需求');
                    ATM.Debug.log('flow', ' 🎯 現金按鈕應該已經可以點擊了');

                    // ✅ 設置取走現金的提示數據（所有難度模式都需要，供提示按鈕使用）
                    if (this.state.gameState.currentFlowStep === 'TAKE_CASH') {
                        // 🔧 [新增] 困難模式：只設置 delayedHintData，供手動提示按鈕使用
                        this.state.gameState.easyModeHints.delayedHintData = {
                            step: 'take_cash',
                            elementSelector: '.take-cash-btn'
                        };

                        // ✅ 簡單/普通模式：自動顯示提示（普通模式會延遲10秒）
                        if (this.shouldShowHint()) {
                            // 🔧 [Phase 2b] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                this.showATMEasyHint('take_cash', '.take-cash-btn');
                            }, 500, 'cashAnimation');
                        }
                    }
                }, 300, 'cashAnimation');
            }
        },

        // 顯示現金彈跳視窗
        showCashModal() {
            ATM.Debug.log('flow', ' 🎬 開始顯示現金彈窗流程');

            // ✅ 所有難度模式：清除取走現金的提示
            this.clearATMEasyHint();

            // 防止重複觸發
            const now = Date.now();
            if (this._lastCashModalTime && now - this._lastCashModalTime < 1000) {
                ATM.Debug.log('flow', ' ⏱️ 防抖：忽略重複點擊現金彈窗 (距離上次 ' + (now - this._lastCashModalTime) + 'ms)');
                return;
            }
            this._lastCashModalTime = now;
            ATM.Debug.log('flow', ' ✅ 通過防抖檢查');

            // 檢查是否已有彈窗存在
            const existingModal = document.querySelector('.modal-overlay');
            if (existingModal) {
                ATM.Debug.log('flow', ' ⚠️ 彈窗已存在，忽略重複請求');
                return;
            }
            ATM.Debug.log('flow', ' ✅ 沒有現有彈窗，繼續建立');

            const amount = this.state.gameState.transactionAmount;
            ATM.Debug.log('flow', ' 💵 交易金額:', amount);

            // 將現金出口區域設為模糊
            const cashDispenser = document.getElementById('cash-dispenser');
            if (cashDispenser) {
                cashDispenser.style.filter = 'blur(5px)';
                ATM.Debug.log('flow', ' 💫 現金出口區域已設為模糊');
            } else {
                ATM.Debug.log('flow', ' ⚠️ 找不到現金出口區域元素');
            }

            // 使用與現金出口相同的鈔票組合邏輯（1000元 + 100元）
            const bills = this.calculateBillCombination(amount).map(b => b.value);

            // 建立紙鈔顯示HTML
            const billsHTML = bills.map(bill => {
                const billImage = this.getRandomMoneyImage(bill);
                return `
                    <div class="modal-bill-item">
                        <img src="${billImage}" alt="${bill}元" class="modal-bill-image">
                        <div class="modal-bill-label">NT$ ${bill}</div>
                    </div>
                `;
            }).join('');

            ATM.Debug.log('flow', ' 🎨 準備建立彈窗 HTML，紙鈔數量:', bills.length);

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.style.zIndex = '1000';
            ATM.Debug.log('flow', ' 📦 建立 modal-overlay 元素');

            modal.innerHTML = `
                <div class="modal-content cash-modal-content">
                    <div class="modal-header" style="padding: 16px 24px 8px 24px;">
                        <h3 style="text-align: center; width: 100%; margin: 0;">💰 您的現金</h3>
                    </div>
                    <div class="modal-body" style="padding: 20px 40px 40px 40px; max-height: 70vh; overflow-y: auto;">
                        <div class="cash-detail-card">
                            <div class="cash-detail-header">
                                <div class="atm-icon-large">🏧</div>
                                <div class="bank-name-large">ATM提款機</div>
                            </div>
                            <div class="cash-detail-divider"></div>
                            <div class="cash-detail-body">
                                <div class="cash-info-row">
                                    <span class="cash-label">提款金額：</span>
                                    <span class="cash-value cash-amount-large">NT$ ${amount}</span>
                                </div>
                                <div class="cash-info-row">
                                    <span class="cash-label">紙鈔明細：</span>
                                    <span class="cash-value">${bills.length} 張</span>
                                </div>
                            </div>
                            <div class="cash-detail-divider"></div>
                            <div class="modal-bills-display">
                                ${billsHTML}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            ATM.Debug.log('flow', ' 🚀 準備將彈窗加入 DOM');
            document.body.appendChild(modal);
            ATM.Debug.log('flow', ' ✅ 彈窗已加入 DOM');

            // 🔧 [新增] 彈窗出現，啟動 0.5 秒安全鎖
            this.enableClickModeWithVisualDelay('CashModal');

            // 🔧 在 ATM 容器下方創建「取走現金」按鈕
            const atmContainer = document.querySelector('.atm-container');
            if (atmContainer) {
                const btnContainer = document.createElement('div');
                btnContainer.id = 'take-cash-modal-btn-container';
                btnContainer.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 1001;
                    text-align: center;
                `;

                const takeCashBtn = document.createElement('button');
                takeCashBtn.id = 'complete-cash-btn';
                takeCashBtn.className = 'complete-btn';
                takeCashBtn.innerHTML = '✓ 取走現金';
                takeCashBtn.style.cssText = `
                    background: linear-gradient(135deg, #4caf50, #45a049);
                    color: white;
                    border: none;
                    padding: 16px 40px;
                    border-radius: 30px;
                    font-size: 1.2rem;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5);
                    transition: all 0.3s ease;
                    font-family: 'Microsoft JhengHei', sans-serif;
                `;

                btnContainer.appendChild(takeCashBtn);
                document.body.appendChild(btnContainer);
                ATM.Debug.log('flow', ' ✅ 已在 ATM 下方創建「取走現金」按鈕');
            }

            // 驗證彈窗是否真的存在
            const verifyModal = document.querySelector('.modal-overlay');
            if (verifyModal) {
                ATM.Debug.log('flow', ' ✅ 驗證成功：彈窗確實存在於 DOM 中');
            } else {
                ATM.Debug.error(' ❌ 錯誤：彈窗未能成功加入 DOM');
            }

            // 延遲綁定按鈕事件，避免立即捕獲滑鼠點擊
            // 🔧 [Phase 2b] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                // 綁定完成按鈕
                const completeCashBtn = document.getElementById('complete-cash-btn');
                if (completeCashBtn) {
                    ATM.Debug.log('flow', ' 🔘 找到完成按鈕，準備綁定事件');
                    completeCashBtn.onclick = () => {
                        ATM.Debug.log('flow', ' 👆 用戶點擊了「取走現金」按鈕');
                        this.completeCashModal();
                    };
                    ATM.Debug.log('flow', ' ✅ 完成按鈕事件已綁定');
                } else {
                    ATM.Debug.error(' ❌ 找不到完成按鈕元素');
                }

                // ✅ 簡單模式：顯示取走現金按鈕的提示動畫
                if (this.shouldShowHint()) {
                    // 🔧 [Phase 2b] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.showATMEasyHint('complete_cash', '#complete-cash-btn');
                        ATM.Debug.log('hint', '💛 顯示現金彈窗確定鈕提示');
                    }, 300, 'cashAnimation');
                }
            }, 300, 'cashAnimation'); // 延遲 300ms，避免捕獲剛才的點擊

            // 播放語音
            ATM.Debug.log('flow', ' 🎙️ 開始播放現金語音');
            this.speech.speak(`取走現金${this.convertAmountToSpeech(amount)}`, {
                callback: () => {
                    ATM.Debug.log('flow', ' 🎙️ 現金語音播放完成');
                }
            });

            // 🔧 [v1.2.14] 輔助點擊模式：設定等待點擊現金彈窗按鈕
            if (this.state.settings.clickMode && this.state.gameState.clickModeState.enabled) {
                ATM.Debug.log('assist', '[ClickMode] 現金彈窗已顯示，設定等待點擊狀態');
                const gs = this.state.gameState;

                // 注入新的操作隊列：點擊「取走現金」按鈕
                gs.clickModeState.actionQueue = [{ type: 'completeCash' }];
                gs.clickModeState.currentStep = 0;
                gs.clickModeState.currentPhase = 'cashModal';
                gs.clickModeState.waitingForClick = true; // 允許點擊
                gs.clickModeState.clickReadyTime = Date.now();

                ATM.Debug.log('assist', '[ClickMode] 已設定現金彈窗點擊狀態，等待用戶點擊');
            }

            ATM.Debug.log('flow', ' ✨ 現金彈窗顯示流程完成');
        },

        // 完成現金彈窗並繼續流程
        completeCashModal() {
            ATM.Debug.log('flow', ' 🔚 關閉現金彈窗 - 呼叫者:', new Error().stack);

            // ✅ 簡單模式：清除提示動畫
            if (this.shouldShowHint()) {
                this.clearATMEasyHint();
            }

            // 移除彈窗
            const modal = document.querySelector('.modal-overlay');
            if (modal) {
                modal.remove();
            }

            // 🔧 移除 ATM 下方的「取走現金」按鈕
            const btnContainer = document.getElementById('take-cash-modal-btn-container');
            if (btnContainer) {
                btnContainer.remove();
                ATM.Debug.log('flow', ' ✅ 已移除 ATM 下方的「取走現金」按鈕');
            }

            // 播放現金出口關閉動畫（使用已建置的封面關閉動畫）
            const cashCover = document.getElementById('cash-display-cover');
            const cashDispenser = document.getElementById('cash-dispenser');

            if (cashCover && cashDispenser) {
                ATM.Debug.log('flow', ' 🔒 播放現金出口關閉動畫（封面上升）');

                // 恢復現金出口區域的模糊效果
                cashDispenser.style.filter = '';

                // 移除 opening class 並添加 closing class
                cashCover.classList.remove('opening');

                // 強制重繪以確保動畫重新觸發
                void cashCover.offsetWidth;

                // 播放關閉動畫（封面回到原位，蓋住現金）
                cashCover.classList.add('closing');
                ATM.Debug.log('flow', ' ✅ 已添加 closing class 到 cash-display-cover，封面應該開始上升');

                // 動畫完成後移除 class 並繼續流程（0.8s 動畫 + 0.2s 緩衝）
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    cashCover.classList.remove('closing');
                    ATM.Debug.log('flow', ' ✅ 關閉動畫完成，繼續流程');
                    this.proceedAfterCashCollection();
                }, 1000, 'uiAnimation');
            } else {
                // 如果找不到現金出口元素，直接繼續流程
                ATM.Debug.log('flow', ' ⚠️ 找不到現金出口封面元素，直接繼續流程');
                this.proceedAfterCashCollection();
            }
        },

        // 收取現金後繼續流程
        proceedAfterCashCollection() {
            ATM.Debug.log('flow', ' 💰 現金已收取，繼續下一步流程');

            // 🔧 [修正] 清除現金顯示和隱藏滑桿
            this.clearCashDisplay();
            this.hideAmountSlider();
            ATM.Debug.log('flow', ' ✅ 已清除現金顯示並隱藏滑桿');

            // 🔧 [v1.2.34] 檢查是否為輔助點擊模式的列印流程
            const gs = this.state.gameState;
            const isClickMode = this.state.settings.clickMode && gs.clickModeState.enabled;
            const isPrintFlow = gs.currentScene === 'collect-cash-print';

            if (isClickMode && isPrintFlow) {
                // 🔧 [v1.2.37] 輔助點擊模式：直接觸發明細表列印流程
                ATM.Debug.log('flow', ' 輔助點擊模式列印流程，開始列印明細表');
                // 清除 printingReceipt 標記
                gs.printingReceipt = false;
                // 直接執行列印動畫
                this.handlePrintReceipt();
                return;
            }

            // 根據當前場景決定下一步動作
            if (this.state.gameState.printingReceipt) {
                // ✅ 修正點: 如果是列印流程，直接呼叫 handlePrintReceipt() 來觸發列印中動畫
                ATM.Debug.log('flow', ' 偵測到列印流程，開始執行列印動畫...');
                // 清除 printingReceipt 標記，避免重複觸發
                this.state.gameState.printingReceipt = false;
                this.handlePrintReceipt();

            } else if (this.state.gameState.currentScene === 'collect-cash') {
                // 新流程：不印明細表 → 取回卡片 → 收取現金 → 顯示最終完成畫面
                this.showFinalTransactionCompleteScreenAfterCash();
            } else {
                // 舊流程：繼續執行原本的取走現金流程
                this.takeCash();
            }
        },

        // 🔧 [步驟6] 取走現金方法 - 顯示「是否列印明細表」
        takeCash() {
            // ✅ 步驟驗證
            if (!this.validateAction('takeCash', '.cash-dispenser-area')) {
                return;
            }

            // 播放音效
            this.audio.playSuccess();
            if (!this.state.settings.clickMode) this.playStepSuccess(true); // playSuccess 已播放 correct02.mp3

            // ✅ 步驟切換：取走現金 → 選擇明細表
            this.updateFlowStep('RECEIPT_OPTIONS', 'TAKE_CASH');

            // 保存當前交易金額，避免在繼續交易時丟失
            const currentAmount = this.state.gameState.transactionAmount;

            // 隱藏金額拉桿
            this.hideAmountSlider();

            // 先讓現金消失
            const cashBackground = document.getElementById('cash-display-background');
            if (cashBackground) {
                // 隱藏現金內容但保持框體顯示
                const cashContainer = cashBackground.querySelector('.cash-bills-container');
                const takeCashBtn = cashBackground.querySelector('.take-cash-btn');

                if (cashContainer) cashContainer.style.opacity = '0';
                if (takeCashBtn) takeCashBtn.style.opacity = '0';

                // 延遲一點後播放關閉動畫
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.clearCashDisplay();
                }, 300, 'uiAnimation');
            }

            // 延遲後繼續下一步動作
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                // 根據場景決定下一步動作
                if (this.state.gameState.currentScene === 'take-cash-end') {
                    // 如果是結束交易的現金，直接完成交易
                    this.speech.speak('現金已取出，感謝使用', {
                        callback: () => {
                            this.endTransaction('結束交易完成');
                        }
                    });
                } else if (this.state.gameState.currentScene === 'take-cash-with-message') {
                    // 如果是帶有特殊訊息的取現金場景，也先顯示處理中再到明細表
                    this.showProcessingBeforeReceipt();
                } else {
                    // 如果是正常提款流程，現金取走後顯示繼續交易選項
                    ATM.Debug.log('flow', '🏧 現金已取走，準備顯示繼續交易選項，當前金額:', currentAmount);
                    this.showContinueTransactionQuestion();
                }
            }, 1100, 'screenTransition'); // 等現金消失和關閉動畫完成
        },
        
        // 取現金後的處理中畫面
        showProcessingBeforeReceipt() {
            this.updateScreen('processing');
            this.speech.speak('處理中，請稍候', {
                callback: () => {
                    // 處理完畢後，顯示明細表選項
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.showReceiptOptionsScreen();
                    }, 1000, 'screenTransition'); // 短暫延遲後進入明細表選項
                }
            });
        },

        // 步驟6: 顯示「是否列印明細表」螢幕
        showReceiptOptionsScreen() {
            this.updateScreen('receipt-options');
            this.state.gameState.currentScene = 'receipt-options';
            
            this.speech.speak('是否列印明細表', {
                callback: () => {
                    // 語音播放完成，等待用戶選擇
                }
            });
        },
        
        // 清除現金顯示（供下一題使用）
        clearCashDisplay() {
            const cashCover = document.getElementById('cash-display-cover');
            const cashBackground = document.getElementById('cash-display-background');

            // 隱藏金額拉桿
            this.hideAmountSlider();

            if (cashCover && cashBackground) {
                // 播放封面 "升起" 動畫來關閉出口
                cashCover.classList.remove('opening');

                // 在動畫播放的同時，就可以準備清空背景內容
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    cashBackground.innerHTML = '';
                    cashBackground.style.display = 'none';
                }, 800, 'uiAnimation'); // 等待動畫時間 (0.8s)
            }
        },

        // 計算鈔票組合（只使用1000元和100元）
        calculateBillCombination(amount) {
            const bills = [];
            let remaining = amount;
            
            // 先用1000元鈔票
            const thousandCount = Math.floor(remaining / 1000);
            for (let i = 0; i < thousandCount; i++) {
                bills.push({ value: 1000 });
                remaining -= 1000;
            }
            
            // 再用100元鈔票補足
            const hundredCount = Math.floor(remaining / 100);
            for (let i = 0; i < hundredCount; i++) {
                bills.push({ value: 100 });
                remaining -= 100;
            }
            
            // 如果有無法整除的餘額，用100元補足（模擬ATM只能出整百金額）
            if (remaining > 0) {
                bills.push({ value: 100 });
            }
            
            return bills;
        },

        // 🆕 輔助方法：隨機選擇金錢圖片（正面或反面）
        getRandomMoneyImage(value) {
            const side = Math.random() < 0.5 ? 'front' : 'back';
            return `../images/money/${value}_yuan_${side}.png`;
        },

        // 按照正確ATM流程：現金取走後詢問是否繼續交易
        showCashTakenAndCardReturn() {
            // 延遲一下模擬用戶取走現金的時間
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                this.speech.speak('現金已取出', {
                    callback: () => {
                        // 先顯示是否繼續交易畫面
                        this.showContinueTransactionScreen();
                    }
                });
            }, 2000, 'screenTransition');
        },

        // 金融卡歸還動畫
        performCardReturnAnimation() {
            const cardElement = document.getElementById('atm-card');
            const cardLight = document.getElementById('card-light');
            const cardSlit = document.getElementById('card-slit');
            
            if (cardElement) {
                cardElement.classList.remove('card-inserted');
                cardElement.classList.add('card-returning');
                
                // 關閉燈光和細縫
                if (cardLight) cardLight.classList.remove('active');
                if (cardSlit) cardSlit.classList.remove('active');
                
                // 動畫完成後重置
                // 🔧 [Phase 2a] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    cardElement.classList.remove('card-returning');
                    this.state.gameState.cardInserted = false;
                }, 1500, 'cardAnimation');
            }
        },

        // 顯示繼續交易選項畫面
        showContinueTransactionScreen() {
            this.updateScreen('continue-transaction');
            this.state.gameState.currentScene = 'continue-transaction';
        },

        // 顯示列印明細表選項畫面
        showReceiptOptionsScreen() {
            this.updateScreen('receipt-options');
            this.state.gameState.currentScene = 'receipt-options';
        },

        // 處理繼續交易選擇 - 直接跳回到金額選擇
        handleContinueTransaction() {
            this.speech.speak('繼續進行新的交易', {
                callback: () => {
                    // 清除現金顯示但保持交易金額記錄用於後續操作
                    this.clearCashDisplay();

                    // 重置交易金額，但保持已插卡和已驗證PIN的狀態
                    this.state.gameState.transactionAmount = 0;

                    // 直接跳回到金額選擇畫面（步驟3）
                    this.updateScreen('amount-entry', { currentAmount: 0 });
                    this.state.gameState.currentScene = 'amount-entry';
                    this.speech.speak('請選擇提款金額');
                }
            });
        },

        // 處理結束交易選擇 - 先歸還金融卡，再詢問列印明細表
        handleFinishTransaction() {
            this.speech.speak('結束交易，請取出您的金融卡', {
                callback: () => {
                    // 執行金融卡歸還動畫
                    this.performCardReturnAnimation();

                    // 延遲一點時間讓用戶"取出"金融卡，然後顯示列印明細表選項
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.showReceiptOptionsScreen();
                    }, 2000, 'screenTransition');
                }
            });
        },

        // 處理列印明細表選擇
        // 步驟7: 處理列印明細表流程
        handlePrintReceipt() {
            // ✅ 步驟切換：選擇明細表 → 列印收據
            this.updateFlowStep('PRINT_RECEIPT', 'RECEIPT_OPTIONS');

            // 7a. 顯示「交易明細表列印中，請稍候」
            this.showPrintingScreen();
        },

        showPrintingScreen() {
            ATM.Debug.log('flow', ' 🖨️ showPrintingScreen() - 顯示列印中畫面');
            this.updateScreen('printing');
            this.state.gameState.currentScene = 'printing';

            this.speech.speak('交易明細表列印中，請稍候', {
                callback: () => {
                    ATM.Debug.log('flow', ' 🎙️ 「列印中」語音播放完成');
                    // 7b. 語音播放完成後，開始收據動畫
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        // 🔧 [新流程] 先更新螢幕為「請取出交易明細表」
                        ATM.Debug.log('flow', ' 📺 更新螢幕為「請取出交易明細表」');
                        this.updateScreen('take-receipt');
                        this.state.gameState.currentScene = 'take-receipt';

                        // 開始收據列印動畫
                        this.showReceiptAnimation();
                    }, 1000, 'screenTransition');
                }
            });
        },

        showReceiptAnimation() {
            ATM.Debug.log('flow', ' 🎬 showReceiptAnimation() 被調用');
            // 7c. 收據從出口出現動畫
            this.printReceipt();

            // 🔧 [v1.2.17] printReceipt() 已經自動創建按鈕，無需再次調用 addTakeReceiptButton()
            // 步驟切換在 printReceipt() 的 takeReceipt() 回調中處理
        },

        showFinalCompleteScreen() {
            this.updateScreen('final-complete');
            this.state.gameState.currentScene = 'final-complete';

            this.speech.speak('請取回交易明細表，謝謝您的惠顧', {
                callback: () => {
                    // 完成整個交易流程，可進入下一題
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.completeTransaction(150);
                    }, 2000, 'screenTransition');
                }
            });
        },

        // 處理不列印明細表選擇
        handleNoPrintReceipt() {
            // ✅ 簡單模式：清除明細表選項提示
            if (this.shouldShowHint()) {
                this.clearATMEasyHint();
            }

            // ✅ 步驟切換：選擇明細表 → 螢幕顯示收據
            this.updateFlowStep('SCREEN_RECEIPT', 'RECEIPT_OPTIONS');

            // 顯示螢幕上的明細表
            this.showReceiptOnScreen();
        },

        // 在螢幕上顯示明細表
        showReceiptOnScreen() {
            ATM.Debug.log('flow', '🏧 在螢幕上顯示明細表');

            // 直接顯示螢幕明細表
            this.updateScreen('screen-receipt-display');
            this.state.gameState.currentScene = 'screen-receipt-display';

            // 播放語音並設置自動返回
            this.speech.speak('明細表顯示完成，將於5秒後自動返回', {
                callback: () => {
                    // 5秒後自動完成交易
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.completeTransaction();
                    }, 5000, 'screenTransition');
                }
            });
        },

        // 新流程：不印明細表時的處理流程
        handleNoPrintReceiptNewFlow() {
            ATM.Debug.log('flow', '🏧 開始不印明細表的新流程');

            // 步驟1: 顯示「請取回卡片」畫面
            this.showTakeCardScreen();
        },

        // 新流程：列印明細表時的處理流程
        handlePrintReceiptNewFlow() {
            ATM.Debug.log('flow', '🏧 開始列印明細表的新流程');

            // 標記為列印明細表流程
            this.state.gameState.printingReceipt = true;

            // 步驟1: 顯示「請取回卡片」畫面
            this.showTakeCardScreenForPrint();
        },

        // 列印流程專用：顯示「請取回卡片」畫面
        showTakeCardScreenForPrint() {
            this.updateScreen('take-card');
            this.state.gameState.currentScene = 'take-card-print';

            this.speech.speak('請取回您的卡片', {
                callback: () => {
                    // 顯示卡片退出動畫
                    this.showCardEjectAnimationForPrintFlow();
                }
            });
        },

        // 列印流程專用：卡片退出動畫
        showCardEjectAnimationForPrintFlow() {
            const originalCard = document.getElementById('atm-card');
            if (originalCard) {
                ATM.Debug.log('flow', '🏧 開始播放卡片退出動畫（列印流程）');

                originalCard.classList.remove('card-inserted', 'card-inserting');
                originalCard.style.display = 'block';
                originalCard.style.opacity = '1';
                originalCard.classList.add('card-returning');

                // 🔧 [Phase 2a] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.addCardClickListenerForPrint();

                    // ✅ 所有難度模式都設置提示數據（困難模式只設置數據，不顯示）
                    // 🔧 [修正] 儲存 timeout ID，以便在用戶點擊前可以取消
                    // 🔧 [Phase 2a] 遷移至 TimerManager
                    this._hintTimeout = this.TimerManager.setTimeout(() => {
                        this.showATMEasyHint('take_card', '.atm-card-area');
                        ATM.Debug.log('hint', '💛 設置取回卡片提示數據');
                    }, 300, 'cardAnimation');
                }, 1800, 'cardAnimation');
            } else {
                ATM.Debug.log('flow', '🏧 找不到卡片元素，直接進入下一步');
                this.showCollectCashScreenForPrint();
            }
        },

        // 列印流程專用：添加卡片點擊監聽
        addCardClickListenerForPrint() {
            // 🔧 在卡片退出後的正下方創建按鈕（跟著卡片）
            const cardArea = document.querySelector('.atm-card-area');
            if (cardArea) {
                const btnContainer = document.createElement('div');
                btnContainer.id = 'take-card-btn-container';
                btnContainer.style.cssText = `
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translate(-50%, -60px);
                    z-index: 10001;
                    text-align: center;
                    width: 100%;
                `;

                const takeCardBtn = document.createElement('button');
                takeCardBtn.id = 'take-card-btn';
                takeCardBtn.innerHTML = '💳 取回卡片';
                takeCardBtn.style.cssText = `
                    background: linear-gradient(135deg, #4caf50, #45a049);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
                    transition: all 0.3s ease;
                    font-family: 'Microsoft JhengHei', sans-serif;
                `;

                const clickHandler = () => {
                    ATM.Debug.log('flow', '🏧 用戶點擊了「取回卡片」（列印流程）');
                    this.audio.playBeep();

                    // 🔧 [修正] 所有難度模式：清除取回卡片的提示及延遲計時器
                    // 🔧 [Phase 2a] 改用 TimerManager.clearTimeout
                    if (this._hintTimeout) {
                        this.TimerManager.clearTimeout(this._hintTimeout);
                        this._hintTimeout = null;
                        ATM.Debug.log('hint', '🧹 已取消尚未觸發的提示');
                    }
                    this.clearATMEasyHint();  // 此函數會清除普通模式的延遲計時器

                    btnContainer.remove();

                    const originalCard = document.getElementById('atm-card');
                    if (originalCard) {
                        originalCard.style.display = 'none';
                        originalCard.style.cursor = 'default';
                        originalCard.removeEventListener('click', clickHandler);
                    }

                    // 🔧 [修正] 檢查交易類型：存款、餘額查詢和轉帳不需要收取現金，直接列印明細表
                    const transactionType = this.state.gameState.currentTransaction.type;
                    if (transactionType === 'deposit' || transactionType === 'inquiry' || transactionType === 'transfer') {
                        // 存款、餘額查詢或轉帳：直接進入列印明細表流程
                        ATM.Debug.log('flow', `🏧 ${transactionType === 'deposit' ? '存款' : transactionType === 'inquiry' ? '餘額查詢' : '轉帳'}流程，直接進入列印明細表`);
                        this.handlePrintReceipt();
                    } else {
                        // 提款：需要收取現金
                        ATM.Debug.log('flow', '🏧 提款流程，先收取現金');
                        this.showCollectCashScreenForPrint();
                    }
                };

                takeCardBtn.addEventListener('click', clickHandler);
                btnContainer.appendChild(takeCardBtn);
                cardArea.appendChild(btnContainer);

                // 🔧 [新增] 讓卡片本身也可以點擊（列印流程）
                const originalCard = document.getElementById('atm-card');
                if (originalCard) {
                    originalCard.style.cursor = 'pointer';
                    originalCard.addEventListener('click', clickHandler);
                    ATM.Debug.log('flow', '🏧 卡片已設定為可點擊（列印流程）');
                }

                ATM.Debug.log('flow', '🏧 已在卡片正下方添加「取回卡片」按鈕（列印流程）');
            } else {
                ATM.Debug.error('🏧 找不到卡片展示區域（列印流程）');
            }
        },

        // 列印流程專用：顯示收取現金畫面
        // 修復：在列印流程中注入隊列 (解決死結)
        showCollectCashScreenForPrint() {
            this.updateScreen('collect-cash');
            this.state.gameState.currentScene = 'collect-cash-print';

            // 🔧 [v1.2.22] 設定列印明細表標記，確保現金收取完成後能進入列印流程
            this.state.gameState.printingReceipt = true;
            ATM.Debug.log('flow', ' 🖨️ 已設定 printingReceipt = true（列印流程）');

            // 🔧 [v1.2.24] 修正：注入完整的列印流程取鈔隊列（包含現金彈窗確認）
            if (this.state.settings.clickMode && this.state.gameState.clickModeState.enabled) {
                ATM.Debug.log('assist', '[ClickMode] 注入列印流程取鈔隊列（含現金彈窗確認）');
                const gs = this.state.gameState;
                // 注入完整取鈔任務：點擊按鈕 + 確認彈窗
                gs.clickModeState.actionQueue = [
                    { type: 'takeCash' },       // 點擊「取走現金」按鈕
                    { type: 'completeCash' }     // 點擊現金彈窗的「確認」按鈕
                ];
                gs.clickModeState.currentStep = 0;
                gs.clickModeState.currentPhase = 'printFlow_collectCash';
                gs.clickModeState.waitingForClick = true; // 允許點擊
                gs.clickModeState.clickReadyTime = Date.now();
            }

            this.clearATMEasyHint();
            this.speech.speak('請收取現金', {
                callback: () => { this.showCashDispense(); }
            });
        },

        // 顯示「請收取明細表」畫面
        showTakeReceiptScreen() {
            ATM.Debug.log('flow', ' 🎬 進入 showTakeReceiptScreen()');

            // 先清除現金顯示
            this.clearCashDisplay();
            this.hideAmountSlider();

            this.updateScreen('take-receipt');
            this.state.gameState.currentScene = 'take-receipt';

            // 🔧 立即播放收據列印動畫（不等語音結束）
            ATM.Debug.log('flow', ' 🔧 準備調用 showReceiptPrintingAnimation()');
            this.showReceiptPrintingAnimation();

            this.speech.speak('請收取明細表', {
                callback: () => {
                    // 語音播放完成
                }
            });
        },

        // 顯示收據列印動畫
        showReceiptPrintingAnimation() {
            ATM.Debug.log('flow', ' 🎬 開始收據列印動畫流程');
            // 使用已建置的printReceipt()函數顯示收據
            this.printReceipt();

            // 等待動畫完成後添加「取出明細表」按鈕
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                ATM.Debug.log('flow', ' ⏱️ 2秒延遲完成，準備添加「取出明細表」按鈕');
                this.addTakeReceiptButton();
            }, 2000, 'uiAnimation');
        },

        // 添加「取出明細表」按鈕
        addTakeReceiptButton() {
            ATM.Debug.log('flow', ' 🔍 開始添加「取出明細表」按鈕');
            const receiptDisplayArea = document.querySelector('.receipt-display-area');
            ATM.Debug.log('flow', ' 🔍 receipt-display-area 元素:', receiptDisplayArea);

            if (receiptDisplayArea) {
                // 先清除舊按鈕（如果存在）
                const oldBtn = document.getElementById('take-receipt-btn');
                if (oldBtn) {
                    ATM.Debug.log('flow', ' 🗑️ 移除舊的「取出明細表」按鈕');
                    oldBtn.remove();
                }

                // 創建按鈕
                const takeReceiptBtn = document.createElement('button');
                takeReceiptBtn.id = 'take-receipt-btn';
                takeReceiptBtn.className = 'take-receipt-btn'; // 🔧 [v1.2.28] 確保有 class 供白名單識別
                takeReceiptBtn.innerHTML = '🧾 取出明細表';
                takeReceiptBtn.style.cssText = `
                    background: linear-gradient(135deg, #4caf50, #45a049);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
                    transition: all 0.3s ease;
                    font-family: 'Microsoft JhengHei', sans-serif;
                    margin-top: 15px;
                    display: block;
                    width: fit-content;
                    margin-left: auto;
                    margin-right: auto;
                `;

                const clickHandler = () => {
                    ATM.Debug.log('flow', '🏧 用戶點擊了「取出明細表」按鈕');

                    // ✅ 簡單模式：清除提示
                    if (this.shouldShowHint()) {
                        this.clearATMEasyHint();
                    }

                    this.audio.playBeep();

                    // 移除按鈕
                    takeReceiptBtn.remove();

                    // 顯示收據彈窗
                    ATM.Debug.log('flow', ' 📱 準備調用 showReceiptModal()');
                    this.showReceiptModal();
                };

                takeReceiptBtn.addEventListener('click', clickHandler);
                receiptDisplayArea.appendChild(takeReceiptBtn);

                ATM.Debug.log('flow', '🏧 ✅ 已添加「取出明細表」按鈕，按鈕元素:', takeReceiptBtn);
                ATM.Debug.log('flow', ' 📍 按鈕位置:', takeReceiptBtn.getBoundingClientRect());

                // 🔧 [v1.2.28 核心新增] 告訴輔助點擊系統：現在可以執行「取明細表」了
                if (this.state.settings.clickMode && this.state.gameState.clickModeState.enabled) {
                    ATM.Debug.log('assist', '[ClickMode] 設定取明細表狀態');
                    const gs = this.state.gameState;
                    gs.clickModeState.actionQueue = [{ type: 'takeReceipt' }];
                    gs.clickModeState.currentStep = 0;
                    gs.clickModeState.currentPhase = 'takeReceipt'; // 設定專屬階段
                    gs.clickModeState.waitingForClick = true;       // 允許點擊
                    gs.clickModeState.clickReadyTime = Date.now();
                }

                // ✅ 簡單模式：顯示取出明細表的提示
                if (this.shouldShowHint()) {
                    // 🔧 [Phase 2d] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.showATMEasyHint('take_receipt', '#take-receipt-btn');
                        ATM.Debug.log('hint', '💛 提示取出明細表');
                    }, 500, 'hintAnimation');
                }
            } else {
                ATM.Debug.error('🏧 ❌ 找不到收據顯示區域 .receipt-display-area');
            }
        },

        // 顯示收據彈窗
        showReceiptModal() {
            ATM.Debug.log('flow', ' 🎬 showReceiptModal() 被調用');
            ATM.Debug.log('flow', ' 💰 交易金額:', this.state.gameState.transactionAmount);

            const transaction = this.state.gameState.currentTransaction;
            const amount = this.state.gameState.transactionAmount;
            const balance = this.state.gameState.accountBalance;
            const accountNumber = this.state.gameState.accountNumber;
            const now = new Date();

            ATM.Debug.log('flow', ' 📅 當前時間:', now);

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            modal.innerHTML = `
                <div class="modal-content" style="
                    background: white;
                    border-radius: 8px;
                    padding: 0;
                    max-width: 380px;
                    width: 90%;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                    animation: modalSlideIn 0.3s ease-out;
                ">
                    <!-- 模擬紙張頂部撕邊 -->
                    <div style="
                        height: 8px;
                        background: linear-gradient(90deg, transparent 0%, transparent 45%, #e0e0e0 45%, #e0e0e0 55%, transparent 55%, transparent 100%);
                        background-size: 16px 8px;
                    "></div>

                    <div class="modal-body" style="padding: 30px 25px 25px 25px; background: white;">
                        <!-- 銀行標題 -->
                        <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #000;">
                            <div style="font-size: 1.4rem; font-weight: 700; color: #000; margin-bottom: 5px; letter-spacing: 1px;">
                                金融機構
                            </div>
                            <div style="font-size: 0.85rem; color: #333; letter-spacing: 0.5px;">
                                自動櫃員機交易明細表
                            </div>
                        </div>

                        <!-- 明細內容 -->
                        <div style="font-family: 'Courier New', monospace; font-size: 0.9rem; line-height: 1.8; color: #000;">
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc;">
                                <span style="font-weight: 600;">交易日期</span>
                                <span>${now.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')}</span>
                            </div>

                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc;">
                                <span style="font-weight: 600;">交易時間</span>
                                <span>${now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
                            </div>

                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc;">
                                <span style="font-weight: 600;">交易帳號</span>
                                <span style="letter-spacing: 2px;">${accountNumber}</span>
                            </div>

                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc;">
                                <span style="font-weight: 600;">交易類別</span>
                                <span style="font-weight: 700;">${this.getDetailedTransactionType(transaction.type)}</span>
                            </div>

                            ${transaction.type === 'transfer' ? `
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc;">
                                    <span style="font-weight: 600;">轉出銀行</span>
                                    <span>${this.state.gameState.transfer.myBankName} (${this.state.gameState.transfer.myBankCode})</span>
                                </div>

                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc;">
                                    <span style="font-weight: 600;">轉出帳號</span>
                                    <span style="letter-spacing: 2px;">${accountNumber}</span>
                                </div>

                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc;">
                                    <span style="font-weight: 600;">轉入銀行</span>
                                    <span>${this.state.gameState.transfer.bankName || ''} (${this.state.gameState.transfer.bankCode || ''})</span>
                                </div>

                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc;">
                                    <span style="font-weight: 600;">轉入帳號</span>
                                    <span style="letter-spacing: 2px;">${this.state.gameState.transfer.accountNumber || ''}</span>
                                </div>
                            ` : ''}

                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 2px solid #000; margin-bottom: 12px;">
                                <span style="font-weight: 600;">交易金額</span>
                                <span style="font-weight: 700; font-size: 1.1rem;">NT$ ${amount.toLocaleString()}</span>
                            </div>

                            <div style="display: flex; justify-content: space-between; padding: 8px 0; background: #f5f5f5; margin: 0 -10px; padding-left: 10px; padding-right: 10px;">
                                <span style="font-weight: 700;">帳戶餘額</span>
                                <span style="font-weight: 700; font-size: 1.1rem;">NT$ ${balance.toLocaleString()}</span>
                            </div>
                        </div>

                        <!-- 底部提示 -->
                        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ccc; text-align: center;">
                            <div style="font-size: 0.8rem; color: #666; line-height: 1.6;">
                                <div style="margin-bottom: 5px;">※ 此為交易憑證，請妥善保存 ※</div>
                                <div style="font-size: 0.75rem; color: #999;">
                                    如有疑問請洽客服專線 0800-000-000
                                </div>
                            </div>
                        </div>

                        <!-- 序號 -->
                        <div style="margin-top: 15px; text-align: center; font-family: 'Courier New', monospace; font-size: 0.75rem; color: #999;">
                            交易序號: ${now.getTime().toString().slice(-8)}
                        </div>
                    </div>

                    <!-- 模擬紙張底部撕邊 -->
                    <div style="
                        height: 8px;
                        background: linear-gradient(90deg, transparent 0%, transparent 45%, #e0e0e0 45%, #e0e0e0 55%, transparent 55%, transparent 100%);
                        background-size: 16px 8px;
                    "></div>

                    <div class="modal-footer" style="padding: 20px 25px; background: #f9f9f9; border-top: 1px solid #e0e0e0;">
                        <button id="complete-receipt-btn" style="
                            background: #333;
                            color: white;
                            border: none;
                            padding: 14px 40px;
                            border-radius: 4px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            width: 100%;
                            font-family: 'Microsoft JhengHei', sans-serif;
                        " onmouseover="this.style.background='#555'" onmouseout="this.style.background='#333'">
                            ✓ 已取出明細表
                        </button>
                    </div>
                </div>

                <style>
                    /* @keyframes modalSlideIn 已移至 injectGlobalAnimationStyles() */
                </style>
            `;

            ATM.Debug.log('flow', ' ✅ Modal HTML 已創建');
            document.body.appendChild(modal);
            ATM.Debug.log('flow', ' ✅ Modal 已添加到 document.body');
            ATM.Debug.log('flow', ' 📍 Modal 元素:', modal);

            // 🔧 [新增] 彈窗出現，啟動 0.5 秒安全鎖
            this.enableClickModeWithVisualDelay('ReceiptModal');

            // 綁定按鈕事件
            // 🔧 [Phase 2c] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                const completeBtn = document.getElementById('complete-receipt-btn');
                ATM.Debug.log('flow', ' 🔍 尋找「已取出明細表」按鈕:', completeBtn);
                if (completeBtn) {
                    // ✅ 簡單模式：顯示提示
                    if (this.shouldShowHint()) {
                        // 🔧 [Phase 2c] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            this.showATMEasyHint('complete_receipt', '#complete-receipt-btn');
                            ATM.Debug.log('hint', '💛 提示確認取出明細表');
                        }, 500, 'modalAnimation');
                    }

                    completeBtn.onclick = () => {
                        ATM.Debug.log('flow', ' 👆 用戶確認已取出明細表');

                        // ✅ 簡單模式：清除提示
                        if (this.shouldShowHint()) {
                            this.clearATMEasyHint();
                        }

                        this.completeReceiptModal();
                    };
                    ATM.Debug.log('flow', ' ✅ 已綁定「已取出明細表」按鈕事件');
                } else {
                    ATM.Debug.error(' ❌ 找不到「已取出明細表」按鈕');
                }

                // ✅ 簡單模式：顯示明細表彈窗確定鈕的提示動畫
                if (this.shouldShowHint()) {
                    // 🔧 [Phase 2c] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.showATMEasyHint('complete_receipt', '#complete-receipt-btn');
                        ATM.Debug.log('hint', '💛 顯示明細表彈窗確定鈕提示');
                    }, 300, 'modalAnimation');
                }
            }, 300, 'modalAnimation');

            // 播放語音
            this.speech.speak('請取出明細表', {
                callback: () => {
                    ATM.Debug.log('flow', ' 🎙️ 明細表語音播放完成');
                }
            });
            ATM.Debug.log('flow', ' 🎤 開始播放語音：請取出明細表');
        },

        // 完成收據彈窗
        completeReceiptModal() {
            ATM.Debug.log('flow', ' 🔚 關閉明細表彈窗');

            // ✅ 簡單模式：清除提示動畫
            if (this.shouldShowHint()) {
                this.clearATMEasyHint();
            }

            // 移除彈窗
            const modal = document.querySelector('.modal-overlay');
            if (modal) {
                modal.remove();
            }

            // 清除收據顯示
            const receiptDisplayArea = document.querySelector('.receipt-display-area');
            if (receiptDisplayArea) {
                const receiptContent = receiptDisplayArea.querySelector('.receipt-display-content');
                if (receiptContent) {
                    receiptContent.innerHTML = '<p class="no-receipt-message">明細表已取出</p>';
                }
            }

            // 顯示最終交易完成畫面
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                this.showFinalTransactionCompleteScreenAfterReceipt();
            }, 500, 'screenTransition');
        },

        // 收據取出後進入下一題（謝謝惠顧已在列印後顯示過）
        showFinalTransactionCompleteScreenAfterReceipt() {
            // 🆕 謝謝惠顧畫面已在列印明細表後顯示過，這裡直接完成交易
            ATM.Debug.log('flow', '🏧 明細表已取出，準備進入下一題');

            // 延遲後完成交易，進入下一題或顯示結果
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                this.completeTransaction(150);
            }, 1000, 'screenTransition');
        },

        // 步驟1: 顯示「請取回卡片」畫面
        showTakeCardScreen() {
            this.updateScreen('take-card');
            this.state.gameState.currentScene = 'take-card';

            this.speech.speak('請取回您的卡片', {
                callback: () => {
                    // 顯示卡片退出動畫
                    this.showCardEjectAnimationForNewFlow();
                }
            });
        },

        // 卡片退出動畫（新流程專用）
        showCardEjectAnimationForNewFlow() {
            // 使用原本的卡片元素播放退出動畫
            const originalCard = document.getElementById('atm-card');
            if (originalCard) {
                ATM.Debug.log('flow', '🏧 開始播放卡片退出動畫');

                // 移除舊的動畫類別
                originalCard.classList.remove('card-inserted', 'card-inserting');

                // 強制顯示卡片並設置初始位置
                originalCard.style.display = 'block';
                originalCard.style.opacity = '1';

                // 播放退出動畫
                originalCard.classList.add('card-returning');

                ATM.Debug.log('flow', '🏧 卡片類別:', originalCard.className);
                ATM.Debug.log('flow', '🏧 卡片樣式 display:', originalCard.style.display);

                // 動畫完成後添加點擊事件
                // 🔧 [Phase 2a] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.addCardClickListener();

                    // 🔧 [修正] 所有難度模式：設置取回卡片的提示數據
                    // - 簡單模式：立即自動顯示
                    // - 普通模式：10秒後自動顯示
                    // - 困難模式：只設置數據，不自動顯示（需手動按提示按鈕）
                    // 🔧 [Phase 2a] 遷移至 TimerManager
                    this._hintTimeout = this.TimerManager.setTimeout(() => {
                        this.showATMEasyHint('take_card', '.atm-card-area');
                        ATM.Debug.log('hint', '💛 設置取回卡片提示數據');
                    }, 300, 'cardAnimation');
                }, 1800, 'cardAnimation');
            } else {
                ATM.Debug.log('flow', '🏧 找不到卡片元素，直接進入下一步');
                // 🔧 [修正] 根據交易類型決定下一步
                const transactionType = this.state.gameState.currentTransaction.type;
                if (transactionType === 'deposit' || transactionType === 'inquiry') {
                    // 存款或餘額查詢：直接完成交易
                    this.endTransaction('交易完成');
                } else {
                    // 提款：顯示收取現金畫面
                    this.showCollectCashScreen();
                }
            }
        },

        // 添加「取回卡片」按鈕點擊事件監聽
        addCardClickListener() {
            // 🔧 在卡片退出後的正下方創建按鈕（跟著卡片）
            const cardArea = document.querySelector('.atm-card-area');
            if (cardArea) {
                // 創建按鈕容器，使用絕對定位放在卡片正下方
                const btnContainer = document.createElement('div');
                btnContainer.id = 'take-card-btn-container';
                btnContainer.style.cssText = `
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translate(-50%, -60px);
                    z-index: 10001;
                    text-align: center;
                    width: 100%;
                `;

                // 創建按鈕
                const takeCardBtn = document.createElement('button');
                takeCardBtn.id = 'take-card-btn';
                takeCardBtn.innerHTML = '💳 取回卡片';
                takeCardBtn.style.cssText = `
                    background: linear-gradient(135deg, #4caf50, #45a049);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
                    transition: all 0.3s ease;
                    font-family: 'Microsoft JhengHei', sans-serif;
                `;

                const clickHandler = () => {
                    ATM.Debug.log('flow', '🏧 用戶點擊了「取回卡片」');
                    this.audio.playBeep();

                    // ✅ 簡單模式：清除取回卡片的提示及未來的提示timeout
                    if (this.state.settings.difficulty === 'easy') {
                        // 🔧 [修正] 清除尚未觸發的提示timeout
                        // 🔧 [Phase 2a] 改用 TimerManager.clearTimeout
                        if (this._hintTimeout) {
                            this.TimerManager.clearTimeout(this._hintTimeout);
                            this._hintTimeout = null;
                            ATM.Debug.log('hint', '🧹 已取消尚未觸發的提示');
                        }
                        this.clearATMEasyHint();
                    }

                    // 移除按鈕
                    btnContainer.remove();

                    // 移除卡片點擊事件
                    const originalCard = document.getElementById('atm-card');
                    if (originalCard) {
                        originalCard.style.display = 'none';
                        originalCard.style.cursor = 'default';
                        originalCard.removeEventListener('click', clickHandler);
                    }

                    // 🔧 [修正] 根據交易類型決定下一步
                    const transactionType = this.state.gameState.currentTransaction.type;
                    if (transactionType === 'deposit' || transactionType === 'inquiry' || transactionType === 'transfer') {
                        // 存款、餘額查詢或轉帳：顯示謝謝惠顧畫面後完成交易
                        this.showThankYouThenProceed();
                    } else {
                        // 提款：進入步驟2收取現金
                        this.showCollectCashScreen();
                    }
                };

                // 按鈕點擊事件
                takeCardBtn.addEventListener('click', clickHandler);
                btnContainer.appendChild(takeCardBtn);
                cardArea.appendChild(btnContainer);

                // 🔧 [新增] 讓卡片本身也可以點擊
                const originalCard = document.getElementById('atm-card');
                if (originalCard) {
                    originalCard.style.cursor = 'pointer';
                    originalCard.addEventListener('click', clickHandler);
                    ATM.Debug.log('flow', '🏧 卡片已設定為可點擊');
                }

                ATM.Debug.log('flow', '🏧 已在卡片正下方添加「取回卡片」按鈕');
            } else {
                ATM.Debug.error('🏧 找不到卡片展示區域');
            }
        },

        // 步驟2: 顯示「請收取現金」畫面
        showCollectCashScreen() {
            this.updateScreen('collect-cash');
            this.state.gameState.currentScene = 'collect-cash';

            this.speech.speak('請收取現金', {
                callback: () => {
                    // 使用已建置的showCashDispense()顯示現金和「取走現金」按鈕
                    this.showCashDispense();
                }
            });
        },

        // 顯示現金口打開動畫並添加點擊事件
        showCashDispenserOpenAnimation() {
            const cashDispenser = document.getElementById('cash-dispenser');
            if (cashDispenser) {
                // 移除模糊效果（如果有的話）
                cashDispenser.style.filter = '';

                // 播放現金口打開動畫
                cashDispenser.style.animation = 'cash-dispenser-open 1s ease-out forwards';

                // 等待動畫完成後，添加點擊事件
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.addCashDispenserClickListener();
                }, 1000, 'uiAnimation');
            } else {
                // 如果找不到現金口，直接進入最終完成畫面
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.showFinalTransactionCompleteScreen();
                }, 2000, 'screenTransition');
            }
        },

        // 添加現金口點擊事件監聽
        addCashDispenserClickListener() {
            const cashDispenser = document.getElementById('cash-dispenser');
            if (cashDispenser) {
                const clickHandler = () => {
                    ATM.Debug.log('flow', '🏧 用戶點擊了現金口');
                    this.audio.playBeep();

                    // 移除點擊事件
                    cashDispenser.removeEventListener('click', clickHandler);

                    // 進入步驟3: 最終完成畫面
                    this.showFinalTransactionCompleteScreen();
                };

                cashDispenser.addEventListener('click', clickHandler);
                ATM.Debug.log('flow', '🏧 已添加現金口點擊監聽');
            }
        },

        // 步驟3: 顯示「交易完成，歡迎再次使用」畫面
        showFinalTransactionCompleteScreen() {
            this.updateScreen('final-transaction-complete');
            this.state.gameState.currentScene = 'final-transaction-complete';

            this.speech.speak('交易完成，歡迎再次使用', {
                callback: () => {
                    // 完成整個交易流程，進入下一題
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.completeTransaction(150);
                    }, 2000, 'screenTransition');
                }
            });
        },

        // 🆕 不印明細表流程專用：顯示謝謝惠顧畫面後進入下一題
        showThankYouThenProceed() {
            ATM.Debug.log('flow', '🏧 顯示謝謝惠顧畫面');

            // 顯示謝謝惠顧畫面
            this.updateScreen('final-transaction-complete');
            this.state.gameState.currentScene = 'final-transaction-complete';

            this.speech.speak('謝謝惠顧，歡迎下次使用', {
                callback: () => {
                    // 延遲後進入下一題或顯示結果
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.completeTransaction(150);
                    }, 2000, 'screenTransition');
                }
            });
        },

        // 新流程專用：取走現金後顯示謝謝惠顧畫面
        showFinalTransactionCompleteScreenAfterCash() {
            // 先清除現金顯示
            this.clearCashDisplay();

            // 隱藏金額拉桿（如果有的話）
            this.hideAmountSlider();

            // 延遲一下讓用戶看到現金消失的效果
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                this.updateScreen('final-transaction-complete');
                this.state.gameState.currentScene = 'final-transaction-complete';

                this.speech.speak('謝謝惠顧，歡迎下次使用', {
                    callback: () => {
                        // 完成整個交易流程，進入下一題
                        // 🔧 [Phase 3] 遷移至 TimerManager (nested)
                        this.TimerManager.setTimeout(() => {
                            this.completeTransaction(150);
                        }, 2000, 'screenTransition');
                    }
                });
            }, 500, 'uiAnimation');
        },

        // 三階段交易明細表流程
        startReceiptStageFlow() {
            // 階段1：交易明細表為重要入帳憑證，請務必妥善收存
            this.showReceiptImportantNotice();
        },

        // 階段1：顯示重要憑證提醒
        showReceiptImportantNotice() {
            ATM.Debug.log('flow', '🏧 階段1：顯示重要憑證提醒');

            // 更新螢幕顯示
            this.updateScreen('receipt-important-notice');
            this.state.gameState.currentScene = 'receipt-important-notice';

            // 播放語音
            this.speech.speak('交易明細表列印中，請稍候，交易明細表為重要入帳憑證，請務必妥善收存', {
                callback: () => {
                    // 3秒後進入階段2
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.showTakeReceiptScreen();
                    }, 3000, 'screenTransition');
                }
            });
        },

        // 階段2：請取回交易明細表
        showTakeReceiptScreen() {
            ATM.Debug.log('flow', '🏧 階段2：請取回交易明細表');

            // 更新螢幕顯示明細表
            this.updateScreen('screen-receipt-display');
            this.state.gameState.currentScene = 'take-receipt';

            // 播放語音
            this.speech.speak('請取回交易明細表', {
                callback: () => {
                    // 3秒後進入階段3
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.showThankYouScreen();
                    }, 3000, 'screenTransition');
                }
            });
        },

        // 階段3：謝謝惠顧
        showThankYouScreen() {
            ATM.Debug.log('flow', '🏧 階段3：謝謝惠顧');

            // 更新螢幕顯示
            this.updateScreen('thank-you');
            this.state.gameState.currentScene = 'thank-you';

            // 播放語音
            this.speech.speak('謝謝您的惠顧，歡迎再次光臨，請稍候插卡', {
                callback: () => {
                    // 5秒後回到初始畫面
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        ATM.Debug.log('flow', '🏧 5秒後回到初始畫面');
                        this.resetToWelcome();
                    }, 5000, 'screenTransition');
                }
            });
        },

        // 回到初始歡迎畫面
        resetToWelcome() {
            // 重置ATM狀態
            this.resetATMState();
            
            // 顯示插入金融卡畫面（這是金融卡可以點擊的畫面）
            this.updateScreen('insert-card');
            
            ATM.Debug.log('flow', '🏧 已回到插入金融卡畫面，金融卡可以點擊');
        },

        // =====================================================
        // 交易完成和重置
        // =====================================================
        completeTransaction(experienceGained = 100) {
            // 更新遊戲狀態
            this.state.gameState.experience += experienceGained;
            
            // 播放成功音效
            this.audio.playSuccess();
            
            
            // 檢查升級
            this.checkLevelUp();
            
            // 記錄完成的交易
            this.state.quiz.completedTransactions.push({
                type: this.state.gameState.currentTransaction.type,
                amount: this.state.gameState.transactionAmount,
                timestamp: Date.now()
            });
            
            // 延遲後進行下一題或結束
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                this.proceedToNext();
            }, 3000, 'screenTransition');
        },

        proceedToNext() {
            this.state.quiz.currentQuestion++;

            if (this.state.quiz.currentQuestion < this.state.settings.questionCount) {
                // ✅ 繼續下一題：回到歡迎畫面重新開始
                this.resetTransaction();
                this.startNextRound();
            } else {
                // 完成所有題目
                this.showFinalResults();
            }
        },

        /**
         * 🔄 開始下一回合 - 回到歡迎畫面
         * 參考 A5 架構，每完成一題後重新顯示歡迎畫面和任務畫面
         */
        startNextRound() {
            ATM.Debug.log('flow', `🔄 開始第 ${this.state.quiz.currentQuestion + 1} 題，回到歡迎畫面`);

            // 隨機模式：抽下一輪的任務類型
            if (this.state.settings.sessionType === 'random') {
                this.pickNextRandomType();
            }

            // 重新生成隨機帳號
            const randomAccountNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
            this.state.gameState.accountNumber = randomAccountNumber;

            // 🔧 [修正] 重新設定帳戶餘額，避免顯示餘額不足
            if (this.state.settings.difficulty === 'easy') {
                // 隨機產生1000-60000之間的金額（以1000為單位）
                const minBalance = 1000;
                const maxBalance = 60000;
                const randomBalance = Math.floor(Math.random() * ((maxBalance - minBalance) / 1000 + 1)) * 1000 + minBalance;
                this.state.gameState.accountBalance = randomBalance;
                ATM.Debug.log('flow', `🎯 [簡單模式-下一題] 重新設定帳戶餘額為: ${randomBalance}`);
            } else {
                // 其他模式使用自訂金額
                this.state.gameState.accountBalance = this.state.settings.customBalance;
                ATM.Debug.log('flow', `🎯 [一般模式-下一題] 重新設定帳戶餘額為: ${this.state.settings.customBalance}`);
            }

            // 顯示歡迎畫面
            this.showWelcomeScreen();
        },

        startNextScenario() {
            this.speech.speak('準備進行下一個練習', {
                callback: () => {
                    this.updateScreen('welcome');
                    this.state.gameState.currentScene = 'welcome';
                    this.resetTransactionState();
                }
            });
        },

        startFirstScenario() {
            // ✅ 初始化步驟驗證系統
            this.updateFlowStep('INSERT_CARD');

            // 第一個場景：插入卡片
            this.updateScreen('insert-card');
            this.state.gameState.currentScene = 'insert-card';

            this.speech.speak('請點擊卡片插入您的金融卡');

            // ✅ 所有難度模式都設置提示數據（困難模式只設置數據，簡單/普通模式會顯示）
            this.showATMEasyHint('insert_card', '.atm-card-area');

            // 🔧 [新增] 輔助點擊模式初始化
            if (this.state.settings.difficulty === 'easy' &&
                this.state.settings.clickMode &&
                !this._clickModeHandlerBound) {
                // 第一輪：初始化輔助點擊模式
                ATM.Debug.log('assist', '[ClickMode] 第一輪：初始化輔助點擊模式');
                this.initClickModeForATM();
            } else if (this.state.settings.clickMode && this._clickModeHandlerBound) {
                // 第二輪及之後：重新初始化狀態
                ATM.Debug.log('assist', '[ClickMode] 第二輪：重新初始化點擊模式狀態');
                const gs = this.state.gameState;
                gs.clickModeState.enabled = false;
                gs.clickModeState.currentPhase = 'insertCard';
                gs.clickModeState.currentOperation = this.getActualSessionType();
                gs.clickModeState.currentStep = 0;
                gs.clickModeState.actionQueue = [];
                gs.clickModeState.waitingForClick = false;
                gs.clickModeState.waitingForStart = false;
                gs.clickModeState.lastClickTime = 0;
                // 🔧 [v1.2.37] 清除明細表取走標記
                gs.clickModeState.receiptTaken = false;

                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    gs.clickModeState.enabled = true;
                    gs.clickModeState.waitingForStart = true;
                    ATM.Debug.log('assist', '[ClickMode] 模式已重新啟用');

                    // 🔧 [Phase 3] 遷移至 TimerManager (nested)
                    this.TimerManager.setTimeout(() => {
                        // 不再顯示提示（已在開始時顯示過一次）
                    }, 1000, 'clickMode');
                }, 500, 'clickMode');
            }
        },

        resetTransaction() {
            this.resetTransactionState();
        },

        // 🔧 將金額數字轉換為語音文字 - 使用共用模組
        convertAmountToSpeech(amount) {
            // 使用共用模組的金額轉換函數
            return NumberSpeechUtils.convertToTraditionalCurrency(amount);
        },

        resetTransactionState() {
            this.state.gameState.cardInserted = false;
            this.state.gameState.currentPin = '';
            this.state.gameState.pinAttempts = 0;
            this.state.gameState.transactionAmount = 0;
            this.state.gameState.isProcessing = false;
            this.state.gameState.currentTransaction = {
                type: this.getActualSessionType(),
                amount: 0,
                account: 'savings',
                completed: false
            };

            // 🔧 [新增] 重置簡單模式的密碼輸入進度
            if (this.state.settings.difficulty === 'easy') {
                this.state.gameState.easyModeHints.pinInputProgress = 0;
            }

            // 🔧 [重構] 使用統一重置函數（普通/困難模式）
            if (this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard') {
                this.resetNormalModeState();
            }

            // 🔧 [新增] 重置銀行代碼提示按鈕計數器
            if (this._bankCodeHintCount) {
                this._bankCodeHintCount = 0;
                ATM.Debug.log('hint', '🔄 已重置銀行代碼提示計數器');
            }

            // 重置存款狀態
            this.state.gameState.depositBills = {
                2000: 0,
                1000: 0,
                500: 0,
                100: 0
            };

            // 🔧 [新增] 重置金錢顯示狀態
            this.state.gameState.moneyDisplayed = false;

            // 🔧 [新增] 清除延遲提示計時器
            if (this._depositConfirmHintTimer) {
                clearTimeout(this._depositConfirmHintTimer);
                this._depositConfirmHintTimer = null;
            }

            // 重置視覺狀態
            const cardLight = document.getElementById('card-light');
            if (cardLight) {
                cardLight.classList.remove('active');
            }

            // 重置細縫狀態
            const cardSlit = document.getElementById('card-slit');
            if (cardSlit) {
                cardSlit.classList.remove('active');
            }

            // 重置卡片狀態
            const cardElement = document.getElementById('atm-card');
            if (cardElement) {
                cardElement.classList.remove('card-inserting', 'card-inserted');
            }

            // 清除現金顯示
            this.clearCashDisplay();

            // 🔧 [新增] 重置輔助點擊模式狀態
            if (this.state.gameState.clickModeState) {
                this.state.gameState.clickModeState.enabled = false;
                this.state.gameState.clickModeState.active = false;
                this.state.gameState.clickModeState.currentPhase = null;
                this.state.gameState.clickModeState.currentStep = 0;
                this.state.gameState.clickModeState.actionQueue = [];
                this.state.gameState.clickModeState.waitingForClick = false;
                ATM.Debug.log('flow', ' 重置輔助點擊模式狀態');
            }
        },

        // 🔧 [新增] 統一重置普通模式狀態（參考 A4/A6 最佳實踐）
        resetNormalModeState() {
            // 重置錯誤計數器
            this.state.gameState.normalModeErrors = {
                pinErrorCount: 0,
                pinCancelErrorCount: 0,
                bankCodeErrorCount: 0,
                accountNumberErrorCount: 0,
                transferAmountErrorCount: 0,
                mainMenuErrorCount: 0,
                withdrawAmountErrorCount: 0,
                depositCancelErrorCount: 0,
                depositConfirmErrorCount: 0,
                transferVerifyErrorCount: 0,
                transferConfirmErrorCount: 0
            };

            // 重置提示已顯示標記
            this.state.gameState.normalModeHintsShown = {
                pinHintShown: false,
                pinCancelHintShown: false,
                bankCodeHintShown: false,
                accountNumberHintShown: false,
                transferAmountHintShown: false,
                mainMenuHintShown: false,
                withdrawAmountHintShown: false,
                depositCancelHintShown: false,
                depositConfirmHintShown: false
            };

            ATM.Debug.log('flow', '🔄 普通模式錯誤計數已重置');
        },

        endTransaction(reason = '') {
            ATM.Debug.log('flow', '🔚 交易結束:', reason);
            this.resetTransaction();
            this.showSettings();
        },

        // =====================================================
        // 步驟驗證系統（參考 A5 架構）
        // =====================================================

        /**
         * 🔧 [重構] 驗證操作是否允許（統一三種難度的代碼路徑）
         * @param {string} actionName - 操作名稱
         * @param {string|HTMLElement} targetElement - 目標元素
         * @returns {boolean} - true 表示允許，false 表示不允許
         */
        validateAction(actionName, targetElement = null) {
            // 🔧 [新增] 輔助點擊模式：跳過驗證
            if (this.state.settings.clickMode &&
                this.state.gameState.clickModeState?.enabled) {
                ATM.Debug.log('assist', '[ClickMode] 跳過驗證:', actionName);
                return true;
            }

            const config = this.getDifficultyConfig();

            // ========== 嚴格流程驗證 ==========
            if (config.strictValidation) {
                const currentStep = this.state.gameState.currentFlowStep;
                if (!currentStep) return true;

                const stepConfig = ATM_FLOW.steps[currentStep];
                if (!stepConfig) return true;

                let allowedActions = stepConfig.allowedActions;

                // 根據配置過濾不允許的操作
                if (!this.canCancelOrClear()) {
                    allowedActions = allowedActions.filter(action => {
                        // 🔧 [修正] 密碼輸入時允許清除鍵（清除錯誤輸入）
                        if (currentStep === 'ENTER_PIN' && action === 'handleClearKey') {
                            return true;
                        }
                        // 🔧 [修正] 轉帳流程中，也允許輸入時使用清除鍵
                        if ((currentStep === 'ENTER_BANK_CODE' || currentStep === 'ENTER_ACCOUNT' ||
                             currentStep === 'TRANSFER_AMOUNT_ENTRY') && action === 'handleClearKey') {
                            return true;
                        }
                        // 其他情況下過濾掉所有取消操作（包含 Cancel 字樣的操作名稱）和清除鍵
                        return !action.includes('Cancel') && action !== 'handleClearKey';
                    });
                    ATM.Debug.log('hint', `🔒 [${config.name}] 嚴格模式下允許的操作:`, allowedActions);
                }

                // 檢查操作是否允許
                if (allowedActions.includes(actionName)) {
                    ATM.Debug.log('hint', `✅ [${config.name}] 操作允許: ${actionName} (步驟: ${currentStep})`);
                    return true;
                }

                // 操作不允許，顯示警告
                const warningMessage = stepConfig.warningMessages[actionName] || '請依照正確流程操作';
                ATM.Debug.log('hint', `❌ [${config.name}] 操作不允許: ${actionName} (步驟: ${currentStep})`);
                this.showFlowWarning(targetElement, warningMessage, actionName);
                return false;
            }

            // ========== 基本驗證（普通模式） ==========
            // 未插卡時不能執行其他操作
            if (actionName !== 'insertCard' && actionName !== 'handleCardClick' &&
                !this.state.gameState.cardInserted) {
                const cardSlot = document.querySelector('.atm-card-area');
                this.showFlowWarning(cardSlot, '請先插入金融卡', actionName);
                return false;
            }

            // 未選擇功能時不能輸入金額
            if (actionName === 'handleAmountSelect' &&
                this.state.gameState.currentScene === 'pin-entry') {
                const menu = document.querySelector('.menu-options-grid');
                this.showFlowWarning(menu, '請先選擇功能', actionName);
                return false;
            }

            return true;
        },

        /**
         * 顯示流程警告訊息
         * @param {string|HTMLElement} targetElement - 目標元素
         * @param {string} message - 警告訊息
         * @param {string} actionName - 操作名稱
         */
        showFlowWarning(targetElement, message, actionName) {
            ATM.Debug.warn('flow', `⚠️ 顯示警告: ${message} (操作: ${actionName})`);

            // ========== 播放錯誤音效 ==========
            const errorAudio = new Audio('../audio/units/error.mp3');
            errorAudio.play().catch(err => console.error('播放錯誤音效失敗:', err));

            // ========== 語音播報 ==========
            this.speech.speak(message);

            // ========== 視覺提示：綠色邊框動畫 ==========
            let element = null;

            // 解析目標元素
            if (typeof targetElement === 'string') {
                element = document.querySelector(targetElement);
            } else if (targetElement instanceof HTMLElement) {
                element = targetElement;
            }

            // 如果沒有指定元素，嘗試根據當前步驟找到正確元素
            if (!element && this.state.settings.difficulty === 'easy') {
                const currentStep = this.state.gameState.currentFlowStep;

                // 根據步驟決定要提示的元素
                switch (currentStep) {
                    case 'INSERT_CARD':
                        // 提示卡片插槽
                        element = document.querySelector('.atm-card-area') ||
                                 document.querySelector('#atm-card');
                        break;

                    case 'ENTER_PIN':
                        // 提示數字鍵盤
                        element = document.querySelector('.screen-keypad') ||
                                 document.querySelector('.pin-input-area');
                        break;

                    case 'SELECT_SERVICE':
                        // 提示主選單
                        element = document.querySelector('.menu-options-grid');
                        break;

                    case 'ENTER_AMOUNT':
                        // 提示金額選項或鍵盤
                        element = document.querySelector('.amount-options-grid') ||
                                 document.querySelector('.screen-keypad');
                        break;

                    case 'TAKE_CASH':
                        // 提示現金出口
                        element = document.querySelector('.cash-dispenser-area') ||
                                 document.querySelector('.cash-display-frame');
                        break;

                    case 'RECEIPT_OPTIONS':
                        // 提示明細表選項按鈕
                        element = document.querySelector('.receipt-options-buttons');
                        break;

                    case 'TAKE_RECEIPT':
                        // 提示收據區域
                        element = document.querySelector('.receipt-section') ||
                                 document.querySelector('#receipt-paper-animation');
                        break;

                    case 'TAKE_CARD':
                        // 提示卡片區域
                        element = document.querySelector('.atm-card-area') ||
                                 document.querySelector('#atm-card');
                        break;
                }
            }

            // 如果找到元素，添加綠色提示邊框
            if (element) {
                ATM.Debug.log('flow', `🎯 提示元素:`, element);

                // 移除舊的提示效果
                document.querySelectorAll('.flow-hint-target').forEach(el => {
                    el.classList.remove('flow-hint-target');
                });

                // 添加新的提示效果
                element.classList.add('flow-hint-target');

                // 3秒後自動移除
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    element.classList.remove('flow-hint-target');
                }, 3000, 'hintAnimation');
            }
        },

        // =====================================================
        // 簡單模式提示動畫系統（參考 A5 架構）
        // =====================================================

        /**
         * 🔧 [重構] 顯示 ATM 提示（統一三種難度的代碼路徑，由配置驅動）
         * @param {string} step - 步驟名稱
         * @param {string} elementSelector - 元素選擇器
         * @param {boolean} immediate - 是否立即顯示（預設false,使用難度設定）
         */
        showATMEasyHint(step, elementSelector, immediate = false) {
            const config = this.getDifficultyConfig();

            // 統一處理：延遲顯示（autoShowHint + hintDelay > 0，目前僅簡單模式使用）
            const effectiveHintDelay = config.hintDelay;
            if (!immediate && config.autoShowHint && effectiveHintDelay > 0) {
                this.clearDelayedHint();
                this.state.gameState.easyModeHints.delayedHintData = { step, elementSelector };

                // 🔧 [Bug修復] 使用 TimerManager 管理延遲提示計時器（原 raw setTimeout）
                // clearDelayedHint 改用 this.TimerManager.clearTimeout 以保持一致性
                this.state.gameState.easyModeHints.delayedHintTimer = this.TimerManager.setTimeout(() => {
                    ATM.Debug.log('hint', `⏰ [${config.name}] ${effectiveHintDelay/1000}秒已過，顯示延遲提示: ${elementSelector}`);
                    this.showATMEasyHint(step, elementSelector, true);
                }, effectiveHintDelay, 'hintAnimation');

                ATM.Debug.log('hint', `⏰ [${config.name}] 啟動延遲提示計時器 (${effectiveHintDelay/1000}秒): ${elementSelector}`);
                return;
            }

            // 統一處理：只保存數據，不自動顯示（困難模式）
            if (!immediate && !config.autoShowHint) {
                this.clearDelayedHint();
                this.state.gameState.easyModeHints.delayedHintData = { step, elementSelector };
                ATM.Debug.log('hint', `🔒 [${config.name}] 設置提示數據: ${elementSelector}，不自動顯示`);
                return;
            }

            // 統一處理：顯示提示（簡單模式或手動觸發）
            const targetElement = document.querySelector(elementSelector);
            const currentElement = this.state.gameState.easyModeHints.highlightedElement;

            // 如果目標元素與當前提示元素相同，則不需要清除和重新添加
            if (targetElement && currentElement && targetElement === currentElement) {
                ATM.Debug.log('hint', `💛 [${config.name}] 提示持續顯示: ${elementSelector} (步驟: ${step})`);
                this.state.gameState.easyModeHints.currentStep = step;
                return;
            }

            // 清除舊提示
            this.clearATMEasyHint();

            // 更新狀態
            this.state.gameState.easyModeHints.enabled = true;
            this.state.gameState.easyModeHints.currentStep = step;

            // 🔧 [Bug修復] 使用 TimerManager 管理（原 raw setTimeout，與 clearATMEasyHint 的 TimerManager.clearTimeout 匹配）
            this._hintTimeout = this.TimerManager.setTimeout(() => {
                const element = document.querySelector(elementSelector);
                if (element) {
                    element.classList.add('atm-easy-hint');
                    this.state.gameState.easyModeHints.highlightedElement = element;
                    ATM.Debug.log('hint', `💛 [${config.name}] 提示元素: ${elementSelector} (步驟: ${step})`);

                    // 🔧 [關鍵修改] 提示出現了！啟動 0.5 秒計時器
                    this.enableClickModeWithVisualDelay(`EasyHint: ${step}`);
                } else {
                    ATM.Debug.warn('hint', `⚠️ [${config.name}] 找不到元素: ${elementSelector}`);
                }
                this._hintTimeout = null;
            }, 100, 'hintAnimation');
        },

        /**
         * 🔧 [重構] 獲取當前難度的配置
         * @returns {Object} 難度配置對象
         */
        getDifficultyConfig() {
            const difficulty = this.state.settings.difficulty || 'easy';
            return DIFFICULTY_CONFIG[difficulty];
        },

        /**
         * 🔧 [重構] 檢查是否應該自動顯示提示
         * @returns {boolean} 是否應該自動顯示提示
         */
        shouldShowHint() {
            return this.getDifficultyConfig().autoShowHint;
        },

        /**
         * 🔧 [新增] 檢查當前難度是否應該追蹤步驟
         * @returns {boolean} 是否追蹤步驟
         */
        shouldTrackSteps() {
            return this.getDifficultyConfig().trackSteps;
        },

        /**
         * 🔧 [新增] 檢查當前難度是否允許取消/清除操作
         * @returns {boolean} 是否允許
         */
        canCancelOrClear() {
            const config = this.getDifficultyConfig();
            // 自由模式下總是允許
            if (this.state.settings.sessionType === 'free') {
                return true;
            }
            return config.allowCancel;
        },

        /**
         * 🔧 [新增] 更新當前流程步驟（僅在需要追蹤的難度下）
         * @param {string} newStep - 新步驟名稱
         * @param {string} previousStep - 前一步驟名稱（用於日誌）
         */
        updateFlowStep(newStep, previousStep = null) {
            if (this.shouldTrackSteps()) {
                this.state.gameState.currentFlowStep = newStep;
                const logMsg = previousStep
                    ? `🔄 步驟切換: ${previousStep} → ${newStep}`
                    : `🔄 設置步驟: ${newStep}`;
                ATM.Debug.log('flow', logMsg);
            }
        },

        /**
         * 🔧 [新增] 清除延遲提示計時器（普通模式專用）
         */
        clearDelayedHint() {
            if (this.state.gameState.easyModeHints.delayedHintTimer) {
                // 🔧 [Bug修復] 改用 TimerManager.clearTimeout 以配合 TimerManager.setTimeout（原 native clearTimeout）
                this.TimerManager.clearTimeout(this.state.gameState.easyModeHints.delayedHintTimer);
                this.state.gameState.easyModeHints.delayedHintTimer = null;
                this.state.gameState.easyModeHints.delayedHintData = null;
                ATM.Debug.log('hint', '🧹 [Normal-Hint] 已清除延遲提示計時器');
            }
        },

        /**
         * 清除 ATM 提示（簡單模式和普通模式通用）
         */
        clearATMEasyHint() {
            // 🔧 [新增] 清除普通模式的延遲計時器
            this.clearDelayedHint();

            // 🔧 [新增] 清除尚未觸發的提示timeout
            // 🔧 [Phase 2a] 改用 TimerManager.clearTimeout
            if (this._hintTimeout) {
                this.TimerManager.clearTimeout(this._hintTimeout);
                this._hintTimeout = null;
                ATM.Debug.log('hint', '🧹 已取消尚未觸發的提示timeout');
            }

            document.querySelectorAll('.atm-easy-hint').forEach(el => {
                el.classList.remove('atm-easy-hint');
            });

            this.state.gameState.easyModeHints.currentStep = null;
            this.state.gameState.easyModeHints.highlightedElement = null;
            // 🔧 [修正] 重置enabled標記，允許顯示新提示
            this.state.gameState.easyModeHints.enabled = false;
            ATM.Debug.log('hint', '🧹 已清除提示');
        },

        // =====================================================
        // 進度和遊戲化系統
        // =====================================================

        checkLevelUp() {
            const currentExp = this.state.gameState.experience;
            const currentLevel = this.state.gameState.level;
            
            // 簡單的升級公式：每1000經驗值升一級
            const newLevel = Math.floor(currentExp / 1000) + 1;
            
            if (newLevel > currentLevel) {
                this.state.gameState.level = newLevel;
                this.showLevelUpNotification(newLevel);
            }
        },

        showLevelUpNotification(level) {
            // 創建升級通知
            const notification = document.createElement('div');
            notification.className = 'level-up-notification';
            notification.innerHTML = `
                <div class="level-up-content">
                    <h3>🎉 升級了！</h3>
                    <p>您現在是等級 ${level}</p>
                </div>
            `;
            
            document.body.appendChild(notification);

            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                notification.classList.add('show');
            }, 100, 'uiAnimation');

            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                notification.classList.remove('show');
                // 🔧 [Phase 3] 遷移至 TimerManager (nested)
                this.TimerManager.setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300, 'uiAnimation');
            }, 3000, 'uiAnimation');

            this.speech.speak(`恭喜升級到等級 ${level}`);
        },

        // =====================================================
        // 收據打印
        // =====================================================
        printReceipt() {
            ATM.Debug.log('flow', ' 📄 開始列印收據動畫 (分離按鈕結構)');

            const receiptContainer = document.querySelector('.receipt-section');
            if (!receiptContainer) {
                ATM.Debug.error(' ❌ 找不到收據容器 .receipt-section');
                return;
            }

            // Remove any old receipt and button to prevent duplicates
            const oldReceipt = document.getElementById('receipt-paper-animation');
            if(oldReceipt) oldReceipt.remove();
            const oldBtn = document.getElementById('take-receipt-btn-container');
            if(oldBtn) oldBtn.remove();
            const oldWrapper = document.getElementById('receipt-wrapper');
            if(oldWrapper) oldWrapper.remove();

            // ✅ 創建包裝容器（用於提示框）
            const receiptWrapper = document.createElement('div');
            receiptWrapper.id = 'receipt-wrapper';
            receiptWrapper.style.cssText = `
                position: relative;
                width: 100%;
                height: 100%;
            `;
            receiptContainer.appendChild(receiptWrapper);

            // 創建收據紙張（不包含按鈕）
            const receiptPaper = document.createElement('div');
            receiptPaper.className = 'receipt-paper-animation';
            receiptPaper.id = 'receipt-paper-animation';
            receiptPaper.innerHTML = `<div class="receipt-paper-content">${this.generateReceiptContent()}</div>`;
            receiptWrapper.appendChild(receiptPaper);

            // 🔧 [修正] 設定收據動畫初始狀態 - 調整位置避免超出右邊面板
            receiptPaper.style.position = 'absolute';
            receiptPaper.style.left = '50%';
            receiptPaper.style.top = '10px'; // 🔧 [修正] 起始位置
            receiptPaper.style.opacity = '0';
            receiptPaper.style.transform = 'translate(-50%, 0) scale(0.9)'; // 🔧 [修正] 縮小一點
            receiptPaper.style.transition = 'top 1.5s ease-out, opacity 1s ease-out, transform 1.5s ease-out';
            // maxWidth已在CSS中設定為240px，這裡不需要再設定

            // 觸發收據滑出動畫
            // 🔧 [Phase 2b] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                receiptPaper.style.opacity = '1';
                receiptPaper.style.top = '30px'; // 🔧 [修正] 最終位置
                receiptPaper.style.transform = 'translate(-50%, 0) scale(1)';
            }, 50, 'receiptAnimation');

            // 🆕 動畫完成後，先顯示謝謝惠顧畫面，再顯示取走明細表按鈕
            // 🔧 [Phase 2b] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                // 🆕 顯示謝謝惠顧畫面在 ATM 螢幕上
                this.updateScreen('final-transaction-complete');
                this.state.gameState.currentScene = 'thank-you-print';
                // 🔧 [v1.2.60] 使用 callback 等待「謝謝惠顧」語音播放完畢，再顯示取走明細表提示
                this.speech.speak('謝謝惠顧，歡迎下次使用', {
                    callback: () => {
                        // 🆕 語音播放完成後顯示取走明細表提示
                        this.showTakeReceiptButtonAfterThankYou(receiptWrapper, receiptPaper);
                    }
                });
            }, 1600, 'receiptAnimation');

            ATM.Debug.log('flow', ' ✅ 收據滑出動畫已啟動');
        },

        // 🔧 [v1.2.60] 分離出取走明細表按鈕顯示邏輯，供 callback 調用
        showTakeReceiptButtonAfterThankYou(receiptWrapper, receiptPaper) {
            // 確保收據容器仍存在
            if (!receiptWrapper || !receiptPaper) {
                ATM.Debug.log('flow', ' ⚠️ 收據容器已移除，跳過按鈕創建');
                return;
            }

            // 🔧 [v1.2.60] 語音播放完成後，短暫延遲再顯示按鈕（原本是 2000ms 延遲，現在改為 500ms）
            // 🔧 [Phase 2b] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                const btnContainer = document.createElement('div');
                btnContainer.id = 'take-receipt-btn-container';
                // 🔧 [修正] 改用 margin-top 而非 padding-top，避免產生可見區域
                // 按鈕容器只包含按鈕，不需要額外的 padding 空間
                const btnTopPosition = 30 + receiptPaper.offsetHeight + 15; // 收據底部 + 15px 間距
                btnContainer.style.cssText = `
                    position: absolute;
                    top: ${btnTopPosition}px; /* 🔧 [修正] 直接定位到收據下方 */
                    left: 50%;
                    transform: translate(-50%, 0);
                    z-index: 10001;
                    text-align: center;
                    background: none; /* 🔧 [修正] 確保無背景 */
                    border: none; /* 🔧 [修正] 確保無邊框 */
                    pointer-events: none; /* 🔧 [修正] 容器本身不攔截點擊，只有按鈕可點擊 */
                `;

                const takeReceiptBtn = document.createElement('button');
                takeReceiptBtn.className = 'take-receipt-btn';
                takeReceiptBtn.style.pointerEvents = 'auto'; // 🔧 [修正] 確保按鈕可點擊（覆蓋父容器的 pointer-events: none）
                takeReceiptBtn.innerHTML = '📄 取走明細表';
                // 🔧 [v1.2.31] 改用 mousedown 並加上 stopPropagation，確保事件不被攔截
                takeReceiptBtn.addEventListener('mousedown', (event) => {
                    ATM.Debug.log('flow', ' 📄 取走明細表按鈕被按下 (mousedown)');
                    event.stopPropagation(); // 防止事件冒泡到全局攔截器
                    event.preventDefault();  // 防止預設行為
                    this.takeReceipt();
                });

                btnContainer.appendChild(takeReceiptBtn);
                receiptWrapper.appendChild(btnContainer); // ✅ 添加到包裝容器而非收據容器

                // ✅ 讓收據紙張也可以被點擊
                receiptPaper.addEventListener('click', () => this.takeReceipt());
                receiptPaper.style.cursor = 'pointer';

                ATM.Debug.log('flow', ' ✅ 已在收據下方添加「取走明細表」按鈕，收據本身也可點擊');

                // 🔧 [v1.2.33] 切換到 TAKE_RECEIPT 步驟（所有模式都需要）
                this.updateFlowStep('TAKE_RECEIPT', 'PRINT_RECEIPT');

                // 🔧 [v1.2.29] 告訴輔助點擊系統：現在可以執行「取明細表」了
                if (this.state.settings.clickMode && this.state.gameState.clickModeState.enabled) {
                    ATM.Debug.log('assist', '[ClickMode] 設定取明細表狀態（printReceipt）');
                    const gs = this.state.gameState;
                    gs.clickModeState.isExecuting = false;          // 🔓 解鎖（修復：列印流程完成後允許點擊）
                    gs.clickModeState.actionQueue = [{ type: 'takeReceipt' }];
                    gs.clickModeState.currentStep = 0;
                    gs.clickModeState.currentPhase = 'takeReceipt'; // 設定專屬階段
                    gs.clickModeState.waitingForClick = true;       // 允許點擊
                    gs.clickModeState.clickReadyTime = Date.now();
                }

                // ✅ 所有難度模式：設置取走明細表的提示（框住紙張及按鈕）
                // 🔧 [修正] 儲存 timeout ID，以便在用戶點擊前可以取消
                // 🔧 [Phase 2b] 遷移至 TimerManager
                this._hintTimeout = this.TimerManager.setTimeout(() => {
                    this.showATMEasyHint('take_receipt', '#receipt-wrapper');
                    ATM.Debug.log('hint', '💛 提示取走明細表（框住紙張及按鈕）');
                }, 300, 'receiptAnimation');

                // 播放語音提示
                this.speech.speak('請取走明細表');
            }, 500, 'receiptAnimation'); // 🔧 [v1.2.60] 縮短延遲，因為已經等語音完成了
        },

        // 取走明細表功能 - 使用 transform/opacity 動畫
        takeReceipt() {
            ATM.Debug.log('flow', ' 📄 開始收據收回動畫');

            // ✅ 所有難度模式：清除取走明細表的提示
            this.clearATMEasyHint();

            // ✅ 步驟驗證
            if (!this.validateAction('takeReceipt', '.receipt-section')) {
                return;
            }

            // ✅ 步驟切換：取走明細表 → 取走卡片（或重置）
            this.updateFlowStep('TAKE_CARD', 'TAKE_RECEIPT');

            // 移除按鈕容器
            const btnContainer = document.getElementById('take-receipt-btn-container');
            if (btnContainer) {
                btnContainer.remove();
            }

            // 🔧 [修正] 收據立即消失（同卡片動畫一樣，立即移除）
            const receiptPaper = document.getElementById('receipt-paper-animation');
            if (receiptPaper) {
                receiptPaper.remove();
                ATM.Debug.log('flow', ' ✅ 收據已立即被取走（無動畫）');
            }

            if (this.audio) {
                this.audio.playSuccess();
                if (!this.state.settings.clickMode) this.playStepSuccess(true); // playSuccess 已播放 correct02.mp3
            }

            // 🔧 [修正] 立即顯示收據內容彈窗（不等待動畫）
            this.showReceiptModal();
        },
        
        // 顯示感謝畫面
        showThankYouScreen() {
            ATM.Debug.log('flow', ' 📺 顯示感謝畫面');
            this.updateScreen('thank-you');
            this.speech.speak('交易完成，感謝您的使用，歡迎再次光臨', {
                callback: () => {
                    ATM.Debug.log('flow', ' 🎙️ 感謝語音播放完畢');
                    // 語音播放完畢後，再停留3秒，然後返回插入卡片畫面
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        ATM.Debug.log('flow', ' 🔄 準備返回插入卡片畫面');
                        this.returnToCardInsertScreen();
                    }, 3000, 'screenTransition'); // 3秒後自動返回
                }
            });
        },
        
        // 返回插入卡片畫面
        returnToCardInsertScreen() {
            // 重置遊戲狀態
            this.resetATMState();
            // 顯示插入卡片畫面
            this.updateScreen('insert-card');
            this.state.gameState.currentScene = 'insert-card';
        },
        
        // 重置ATM狀態
        resetATMState() {
            this.state.gameState = {
                ...this.state.gameState,
                cardInserted: false,
                currentPin: '',
                transactionAmount: 0,
                currentScene: 'insert-card',  // 重要：設置為插卡場景，讓金融卡可以點擊
                currentFlowStep: this.state.settings.difficulty === 'easy' ? 'INSERT_CARD' : null,  // ✅ 重置步驟驗證
                currentTransaction: {
                    type: null,
                    amount: 0,
                    completed: false
                },
                // 重置存款狀態
                depositBills: {
                    2000: 0,
                    1000: 0,
                    500: 0,
                    100: 0
                }
            };
            
            // 恢復卡片顯示
            const originalCard = document.getElementById('atm-card');
            if (originalCard) {
                // 🔧 [強化] 清除所有inline樣式和動畫類名
                originalCard.style.display = '';
                originalCard.style.opacity = '';
                originalCard.style.transform = '';
                originalCard.classList.remove('card-inserting', 'card-inserted', 'card-returning');
                ATM.Debug.log('flow', '🏧 金融卡狀態已重置，可重新點擊');
            }
        },

        generateReceiptContent() {
            const transaction = this.state.gameState.currentTransaction;
            const amount = this.state.gameState.transactionAmount;
            const balance = this.state.gameState.accountBalance;
            const accountNumber = this.state.gameState.accountNumber;
            const now = new Date();

            // 🔧 [新增] 轉帳資訊
            const transferRows = transaction.type === 'transfer' ? `
                <tr class="receipt-row">
                    <td class="receipt-label">轉出銀行:</td>
                    <td class="receipt-value">${this.state.gameState.transfer.myBankName} (${this.state.gameState.transfer.myBankCode})</td>
                </tr>
                <tr class="receipt-row">
                    <td class="receipt-label">轉出帳號:</td>
                    <td class="receipt-value">${accountNumber}</td>
                </tr>
                <tr class="receipt-row">
                    <td class="receipt-label">轉入銀行:</td>
                    <td class="receipt-value">${this.state.gameState.transfer.bankName || ''} (${this.state.gameState.transfer.bankCode || ''})</td>
                </tr>
                <tr class="receipt-row">
                    <td class="receipt-label">轉入帳號:</td>
                    <td class="receipt-value">${this.state.gameState.transfer.accountNumber || ''}</td>
                </tr>
            ` : '';

            return `
                <div class="receipt-content">
                    <table class="receipt-table">
                        <tr class="receipt-row">
                            <td class="receipt-label">交易帳號:</td>
                            <td class="receipt-value">${accountNumber}</td>
                        </tr>
                        <tr class="receipt-row">
                            <td class="receipt-label">交易類別:</td>
                            <td class="receipt-value">${this.getDetailedTransactionType(transaction.type)}</td>
                        </tr>
                        ${transferRows}
                        <tr class="receipt-row">
                            <td class="receipt-label">交易金額:</td>
                            <td class="receipt-value">NT$ ${amount.toLocaleString()}</td>
                        </tr>
                        <tr class="receipt-row">
                            <td class="receipt-label">帳戶餘額:</td>
                            <td class="receipt-value">NT$ ${balance.toLocaleString()}</td>
                        </tr>
                        <tr class="receipt-row">
                            <td class="receipt-label">交易日期:</td>
                            <td class="receipt-value">${now.toLocaleDateString('zh-TW')}</td>
                        </tr>
                        <tr class="receipt-row">
                            <td class="receipt-label">交易時間:</td>
                            <td class="receipt-value">${now.toLocaleTimeString('zh-TW')}</td>
                        </tr>
                    </table>
                </div>
            `;
        },

        // 生成螢幕明細表顯示
        generateScreenReceiptDisplay() {
            const transaction = this.state.gameState.currentTransaction;
            const amount = this.state.gameState.transactionAmount;
            const balance = this.state.gameState.accountBalance;

            // 🔧 [新增] 轉帳資訊
            const transferRows = transaction.type === 'transfer' ? `
                <tr class="screen-receipt-row">
                    <td class="screen-receipt-label">轉入銀行:</td>
                    <td class="screen-receipt-value">${this.state.gameState.transfer.bankName || ''}</td>
                </tr>
                <tr class="screen-receipt-row">
                    <td class="screen-receipt-label">轉入帳號:</td>
                    <td class="screen-receipt-value">${this.state.gameState.transfer.accountNumber || ''}</td>
                </tr>
            ` : '';

            return `
                <div class="screen-receipt-display">
                    <div class="receipt-header">
                        <div class="receipt-icon">🧾</div>
                        <h2 style="color: white;">交易明細表</h2>
                        <p class="display-message">明細表顯示完成，將於5秒後自動返回</p>
                    </div>

                    <div class="screen-receipt-content">
                        <table class="screen-receipt-table">
                            <tr class="screen-receipt-row">
                                <td class="screen-receipt-label">交易類型:</td>
                                <td class="screen-receipt-value">${this.getSessionTypeName(transaction.type)}</td>
                            </tr>
                            ${transferRows}
                            <tr class="screen-receipt-row">
                                <td class="screen-receipt-label">金額:</td>
                                <td class="screen-receipt-value">NT$ ${amount.toLocaleString()}</td>
                            </tr>
                            <tr class="screen-receipt-row">
                                <td class="screen-receipt-label">餘額:</td>
                                <td class="screen-receipt-value">NT$ ${balance.toLocaleString()}</td>
                            </tr>
                            <tr class="screen-receipt-row">
                                <td class="screen-receipt-label">時間:</td>
                                <td class="screen-receipt-value">${new Date().toLocaleString()}</td>
                            </tr>
                        </table>
                    </div>

                    <div class="auto-return-notice">
                        <p class="countdown-text">5秒後自動返回主畫面...</p>
                    </div>
                </div>
            `;
        },

        // =====================================================
        // 最終結果顯示
        // =====================================================
        showFinalResults() {
            // 冒險模式：直接跳回冒險，不顯示總結頁
            if (this._advReturnLevel) {
                location.href = `../adventure/index.html?resume=${this._advReturnLevel}`;
                return;
            }

            // 停用輔助點擊模式（完成畫面不需要輔助）
            const gs = this.state.gameState;
            document.getElementById('click-exec-overlay')?.remove();
            this.unbindClickModeHandler();
            if (gs.clickModeState) {
                ATM.Debug.log('assist', '[ClickMode] 進入完成畫面，停用輔助點擊模式');
                gs.clickModeState.enabled = false;
                gs.clickModeState.waitingForClick = false;
                gs.clickModeState.waitingForStart = false;
            }

            const { completedTransactions } = this.state.quiz;
            const completionTime = this.state.quiz.startTime ? (Date.now() - this.state.quiz.startTime) : 0;
            const completedCount = completedTransactions.length;
            const sessionType = this.state.settings.sessionType;

            // 計算完成時間顯示格式
            const elapsedSeconds = Math.floor(completionTime / 1000);
            const minutes = Math.floor(elapsedSeconds / 60);
            const seconds = elapsedSeconds % 60;
            const timeDisplay = minutes > 0 ? `${minutes} 分 ${seconds} 秒` : `${seconds} 秒`;

            // 取得動態學習成果
            const learningOutcomes = this.getLearningOutcomesByType(sessionType);
            const learningOutcomesHtml = learningOutcomes.map(item =>
                `<div class="achievement-item">${item}</div>`
            ).join('');

            const app = document.getElementById('app');
            // 允許完成畫面滾動（A4 架構：只操作 #app）
            app.style.overflowY = 'auto';
            app.style.height = '100%';
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
                                ${this.generatePerformanceFeedback(completedCount)}
                            </div>

                            <!-- 學習成果描述 -->
                            <div class="learning-achievements">
                                <h3>🏆 學習成果</h3>
                                <div class="achievement-list">
                                    ${learningOutcomesHtml}
                                </div>
                            </div>

                            <div class="result-buttons">
                                ${this._advReturnLevel ? `
                                <a href="../adventure/index.html?resume=${this._advReturnLevel}" class="play-again-btn" style="display:flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;">
                                    <span class="btn-icon">🗺️</span>
                                    <span class="btn-text">繼續冒險</span>
                                </a>` : `
                                <button class="play-again-btn" onclick="ATM.restartLearning()">
                                    <span class="btn-icon">🔄</span>
                                    <span class="btn-text">再玩一次</span>
                                </button>`}
                                <button class="main-menu-btn" onclick="ATM.showSettings()">
                                    <span class="btn-icon">⚙️</span>
                                    <span class="btn-text">返回設定</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    .results-wrapper {
                        position: relative;
                        width: 100%;
                        min-height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: flex-start;
                        padding: 20px 20px 80px 20px;
                        box-sizing: border-box;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        overflow-y: auto;
                        -webkit-overflow-scrolling: touch;
                        z-index: 10000;
                    }

                    /* @keyframes celebrate 已移至 injectGlobalAnimationStyles() */

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
                        overflow: visible;
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
                        animation: bounceCompletion 2s infinite;
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
                endgameRewardLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                });
            }

            // 播放成功音效和煙火
            // 🔧 [Phase 3] 遷移至 TimerManager
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

        generatePerformanceFeedback(completedCount) {
            let icon, msg;
            if (completedCount >= 8)      { icon = '🏆'; msg = `完成了 ${completedCount} 題，做得很棒，表現優異！`; }
            else if (completedCount >= 6) { icon = '👍'; msg = `完成了 ${completedCount} 題，做得不錯，表現良好！`; }
            else if (completedCount >= 3) { icon = '💪'; msg = `完成了 ${completedCount} 題，再努力一點，加油！`; }
            else                          { icon = '📚'; msg = `完成了 ${completedCount} 題，多多練習，你可以的！`; }
            return `<div class="performance-badge">${icon} ${msg}</div>`;
        },

        getLearningOutcomesByType(sessionType) {
            const outcomes = {
                withdraw: [
                    '🎯 完成ATM提款操作流程學習',
                    '🔐 掌握密碼輸入安全操作',
                    '💰 學會提款金額選擇和確認'
                ],
                deposit: [
                    '🎯 完成ATM存款操作流程學習',
                    '🔐 掌握密碼輸入安全操作',
                    '💵 學會存款金額放入和確認'
                ],
                inquiry: [
                    '🎯 完成ATM餘額查詢流程學習',
                    '🔐 掌握密碼輸入安全操作',
                    '📊 學會查看帳戶餘額資訊'
                ],
                transfer: [
                    '🎯 完成ATM轉帳操作流程學習',
                    '🔐 掌握密碼輸入安全操作',
                    '🏦 學會輸入銀行代碼和帳號',
                    '💸 學會轉帳金額設定和確認'
                ],
                free: [
                    '🎯 完成ATM操作流程學習',
                    '🔐 掌握密碼輸入安全操作',
                    '💰 學會金額輸入和確認'
                ],
                random: [
                    '🎲 完成多種 ATM 交易類型練習',
                    '🔐 掌握密碼輸入安全操作',
                    '💰 熟悉提款、存款、餘額查詢與轉帳流程',
                    '🏦 提升 ATM 不同情境的操作應變能力'
                ]
            };
            return outcomes[sessionType] || outcomes.free;
        },

        // =====================================================
        // 重新開始和導航
        // =====================================================
        restartLearning() {
            // 重置所有狀態
            this.state.quiz.currentQuestion = 0;
            this.state.quiz.score = 0;
            this.state.quiz.completedTransactions = [];
            this.state.gameState.experience = 0;
            this.state.gameState.level = 1;
            this.resetTransaction();
            
            // 重新開始學習
            this.startLearning();
        },

        backToMainMenu() {
            // 返回到單元選擇畫面或主選單
            window.location.href = '../index.html#part4';
        },

        // =====================================================
        // 提示按鈕功能（普通/困難模式）
        // =====================================================

        // 顯示提示按鈕
        showHintButton() {
            const difficulty = this.state.settings.difficulty;
            const hintBtn = document.getElementById('hint-request-btn');
            const wrapper = document.getElementById('hint-btn-wrapper');

            if (hintBtn && (difficulty === 'normal' || difficulty === 'hard')) {
                if (wrapper) wrapper.style.display = 'flex';
                else hintBtn.style.display = 'flex';
                ATM.Debug.log('hint', '💡 [Hint-Button] 顯示提示按鈕');

                // 綁定點擊事件
                hintBtn.onclick = () => this.handleHintButtonClick();
            }
        },

        // 隱藏提示按鈕
        hideHintButton() {
            const hintBtn = document.getElementById('hint-request-btn');
            const wrapper = document.getElementById('hint-btn-wrapper');
            if (wrapper) {
                wrapper.style.display = 'none';
            } else if (hintBtn) {
                hintBtn.style.display = 'none';
            }
            ATM.Debug.log('hint', '💡 [Hint-Button] 隱藏提示按鈕');
        },

        // 處理提示按鈕點擊
        handleHintButtonClick() {
            const scene = this.state.gameState.currentScene;
            const difficulty = this.state.settings.difficulty;
            const sessionType = this.state.settings.sessionType;
            ATM.Debug.log('hint', '💡 [Hint-Button] 提示按鈕被點擊，當前場景:', scene);

            // 播放按鈕音效
            this.audio.playBeep();

            // 🔧 [新增] 困難模式+自選服務：對於需要指定任務數據的場景，改為顯示通用視覺提示
            const isHardFreeMode = (difficulty === 'hard' && sessionType === 'free');
            const assignedTaskScenes = ['bank-code-entry', 'account-entry', 'transfer-amount-entry'];

            if (isHardFreeMode && assignedTaskScenes.includes(scene)) {
                // 🔧 [新增] 銀行代碼場景：追蹤提示按鈕點擊次數
                if (scene === 'bank-code-entry') {
                    // 初始化計數器
                    if (!this._bankCodeHintCount) {
                        this._bankCodeHintCount = 0;
                    }
                    this._bankCodeHintCount++;

                    ATM.Debug.log('hint', `💡 [Hint-Button] 銀行代碼場景，第 ${this._bankCodeHintCount} 次點擊提示按鈕`);

                    if (this._bankCodeHintCount === 1) {
                        // 第1次：顯示鍵盤視覺提示
                        ATM.Debug.log('hint', '💡 [Hint-Button] 第1次點擊，顯示鍵盤視覺提示');
                        this.showVisualHint();
                        return;
                    } else if (this._bankCodeHintCount >= 2) {
                        // 第2次及以後：顯示銀行代碼資訊彈窗
                        ATM.Debug.log('hint', '💡 [Hint-Button] 第2次點擊，顯示銀行代碼資訊彈窗');
                        this.showBankCodeInfoModal();
                        return;
                    }
                } else {
                    // 其他場景：使用通用提示
                    ATM.Debug.log('hint', `💡 [Hint-Button] 困難模式+自選服務，場景 ${scene} 使用通用提示`);
                    this.showVisualHint();
                    return;
                }
            }

            // 根據場景顯示不同的提示
            switch (scene) {
                case 'pin-entry':
                    this.showPinHintModal();
                    break;
                case 'bank-code-entry':
                    this.showBankCodeHintModal();
                    break;
                case 'account-entry':
                    this.showAccountHintModal();
                    break;
                case 'transfer-amount-entry':
                    this.showTransferAmountHintModal();
                    break;
                default:
                    // 其他場景顯示視覺提示
                    this.showVisualHint();
                    break;
            }
        },

        // 顯示視覺提示（非數字輸入場景）
        showVisualHint() {
            const difficulty = this.state.settings.difficulty;
            const currentScene = this.state.gameState.currentScene;
            const sessionType = this.state.settings.sessionType;

            // 🔧 [修正] 已完成任務的場景不應顯示提示
            const completedScenes = [
                'final-transaction-complete',  // 最終交易完成畫面
                'thank-you',                    // 感謝畫面
                'welcome',                      // 歡迎畫面（下一輪開始前）
                'mission',                      // 任務說明畫面（下一輪開始前）
                'processing',                   // 交易處理中（過渡畫面）
                'printing',                     // 明細表列印中（過渡畫面）
                'card-reading',                 // 卡片讀取中（過渡畫面）
                'cash-dispensing',              // 現金出鈔動畫中（過渡畫面）
                'deposit-processing',           // 存款處理中（過渡畫面）
                'deposit-counting',             // 存款點鈔中（過渡畫面）
                'deposit-processing-final'      // 存款最終處理中（過渡畫面）
            ];

            if (completedScenes.includes(currentScene)) {
                ATM.Debug.log('hint', '💡 [Hint-Button] 當前場景已完成任務，不顯示提示:', currentScene);
                return;
            }

            // 🔧 [新增] 明細表選項場景：適用所有模式（普通、困難）
            if (currentScene === 'continue-transaction-question' || currentScene === 'transaction-success') {
                ATM.Debug.log('hint', `💡 [Hint-Button] 明細表選項場景，高亮所有選項按鈕`);
                this.showATMEasyHint('receipt_options_all', '.receipt-choice-section', true);
                this.speech.speak('請選擇螢幕顯示、不印或印明細表');
                return;
            }

            // 🔧 [新增] 通用場景映射（所有模式都適用）
            const universalSceneHintMap = {
                'transfer-verification': {
                    selector: '.verification-buttons',
                    speech: '請按取消或確認',
                    step: 'transfer_verify_buttons'
                },
                'transfer-confirmation': {
                    selector: '.confirmation-buttons',
                    speech: '請按取消或確定轉帳',
                    step: 'transfer_confirm_buttons'
                },
                'take-receipt': {
                    selector: '#take-receipt-btn-container, #receipt-wrapper, .take-receipt-btn',
                    speech: '請取出明細表',
                    step: 'take_receipt'
                },
                'card-eject': {
                    selector: '.atm-card-area',
                    speech: '請取回卡片',
                    step: 'take_card'
                },
                'card-eject-end': {
                    selector: '.atm-card-area',
                    speech: '請取回卡片',
                    step: 'take_card'
                },
                'take-cash': {
                    selector: '.take-cash-btn',
                    speech: '請取走現金',
                    step: 'take_cash'
                },
                'collect-cash': {
                    selector: '.take-cash-btn',
                    speech: '請取走現金',
                    step: 'take_cash'
                },
                'take-card': {
                    selector: '.atm-card-area',
                    speech: '請取回卡片',
                    step: 'take_card'
                },
                'thank-you-print': {
                    selector: '#take-receipt-btn-container, #receipt-wrapper, .take-receipt-btn, .atm-card-area',
                    speech: '請取出明細表',
                    step: 'take_receipt'
                },
                'take-cash-with-message': {
                    selector: '.take-cash-btn, .cash-dispenser-area',
                    speech: '請取走現金',
                    step: 'take_cash'
                },
                'take-cash-end': {
                    selector: '.take-cash-btn, .cash-dispenser-area',
                    speech: '請取走現金',
                    step: 'take_cash'
                },
                'collect-cash-print': {
                    selector: '.take-cash-btn, .cash-dispenser-area',
                    speech: '請取走現金',
                    step: 'take_cash'
                },
                'take-card-print': {
                    selector: '.atm-card-area',
                    speech: '請取回卡片',
                    step: 'take_card'
                },
                'screen-receipt-display': {
                    selector: '.atm-card-area',
                    speech: '請取回卡片',
                    step: 'take_card'
                },
                'receipt-important-notice': {
                    selector: '.atm-card-area',
                    speech: '請取回卡片',
                    step: 'take_card'
                },
            };
            if (universalSceneHintMap[currentScene]) {
                const hint = universalSceneHintMap[currentScene];
                let targetSelector = hint.selector;
                if (hint.selector.includes(',')) {
                    const selectors = hint.selector.split(',').map(s => s.trim());
                    for (const sel of selectors) {
                        if (document.querySelector(sel)) {
                            targetSelector = sel;
                            break;
                        }
                    }
                }
                ATM.Debug.log('hint', `💡 [Hint-Button] 通用場景 ${currentScene} 提示: ${targetSelector}`);
                this.showATMEasyHint(hint.step, targetSelector, true);
                this.speech.speak(hint.speech);
                return;
            }

            // 🔧 [新增] 困難模式+自選服務：根據場景顯示相應的操作區域
            if (difficulty === 'hard' && sessionType === 'free') {
                // 場景到提示元素和語音的映射表
                const sceneHintMap = {
                    'menu': {
                        selector: '.menu-options-grid',
                        speech: '請選擇您要進行的服務項目',
                        step: 'menu_all_options'
                    },
                    'amount-entry': {
                        selector: '.amount-options-grid',
                        speech: '請選擇提款金額或自訂金額',
                        step: 'amount_selection'
                    },
                    'deposit-cash': {
                        // 🔧 [修正] 檢查是否已放入現金，決定提示位置
                        selector: this.getTotalDepositAmount() > 0 ? '.deposit-actions' : '.cash-dispenser-area',
                        speech: this.getTotalDepositAmount() > 0 ? '請確認存款或選擇取消' : '請將現金放入現金出口',
                        step: this.getTotalDepositAmount() > 0 ? 'deposit_cash_confirm' : 'deposit_cash_dispenser'
                    },
                    'deposit-confirm': {
                        selector: '.confirm-actions',
                        speech: '請確認存款金額，或選擇取消',
                        step: 'deposit_confirm_actions'
                    },
                    'bank-code-entry': {
                        selector: '.screen-keypad',
                        speech: '請使用數字鍵盤輸入銀行代碼',
                        step: 'bank_code_keypad'
                    },
                    'account-entry': {
                        selector: '.screen-keypad',
                        speech: '請使用數字鍵盤輸入帳號',
                        step: 'account_keypad'
                    },
                    'transfer-amount-entry': {
                        selector: '.screen-keypad',
                        speech: '請使用數字鍵盤輸入轉帳金額',
                        step: 'transfer_amount_keypad'
                    }
                };

                // 檢查當前場景是否有對應的提示配置
                if (sceneHintMap[currentScene]) {
                    const hint = sceneHintMap[currentScene];
                    ATM.Debug.log('hint', `💡 [Hint-Button] 困難模式+自選服務，場景 ${currentScene} 提示: ${hint.selector}`);
                    this.showATMEasyHint(hint.step, hint.selector, true);
                    this.speech.speak(hint.speech);
                    return;
                }
            }

            // 立即觸發視覺提示動畫
            const step = this.state.gameState.easyModeHints.currentStep;
            const delayedData = this.state.gameState.easyModeHints.delayedHintData;

            if (delayedData && delayedData.elementSelector) {
                const targetEl = document.querySelector(delayedData.elementSelector);
                if (targetEl) {
                    ATM.Debug.log('hint', '💡 [Hint-Button] 顯示視覺提示:', delayedData.elementSelector);
                    this.showATMEasyHint(delayedData.step, delayedData.elementSelector, true);
                    this.speech.speak('請按照螢幕上的提示操作');
                } else {
                    ATM.Debug.log('hint', '💡 [Hint-Button] delayedHintData 目標元素不存在，跳過:', delayedData.elementSelector);
                }
            }
        },

        // 顯示密碼提示彈窗
        showPinHintModal() {
            const correctPin = this.state.gameState.correctPin;
            const currentProgress = this.state.gameState.currentPin.length;
            const nextDigit = correctPin[currentProgress];

            // 🔧 [修正] 判斷是否已輸入完整密碼
            const isComplete = currentProgress >= correctPin.length;
            const nextStepHint = isComplete
                ? '<p><strong>✅ 密碼已輸入完成！</strong>請按 <span style="font-size: 20px; font-weight: bold; color: #4caf50;">確認鍵</span></p>'
                : `<p><strong>🎯 下一個數字：</strong>請輸入 <span style="font-size: 24px; font-weight: bold; color: #d32f2f;">${nextDigit}</span></p>`;

            const modalHTML = `
                <div class="hint-modal-overlay" id="hint-modal-overlay">
                    <div class="hint-modal">
                        <div class="hint-modal-header">
                            <h2><span class="icon">🔐</span> 密碼提示</h2>
                        </div>
                        <div class="hint-modal-content">
                            <p>您需要輸入的完整密碼是：</p>
                            <div class="hint-info-block">
                                <div class="hint-info-label">密碼</div>
                                <div class="hint-info-value">${correctPin}</div>
                            </div>
                            <div class="hint-description">
                                <p><strong>💡 目前進度：</strong>已輸入 ${currentProgress} 位數字</p>
                                ${nextStepHint}
                            </div>
                        </div>
                        <div class="hint-modal-footer">
                            <button class="hint-modal-close-btn" onclick="ATM.closeHintModal()">
                                我知道了
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.speech.speak(`密碼是 ${correctPin.split('').join(' ')}`);
            ATM.Debug.log('hint', '💡 [Hint-Modal] 顯示密碼提示彈窗');
        },

        // 顯示銀行代碼提示彈窗
        showBankCodeHintModal() {
            const bankCode = this.state.gameState.easyModeHints.assignedBankCode;
            const currentProgress = this.state.gameState.transfer.bankCode.length;
            const nextDigit = bankCode[currentProgress];

            // 🔧 [修正] 判斷是否已輸入完整銀行代碼
            const isComplete = currentProgress >= bankCode.length;
            const nextStepHint = isComplete
                ? '<p><strong>✅ 銀行代碼已輸入完成！</strong>請按 <span style="font-size: 20px; font-weight: bold; color: #4caf50;">確認鍵</span></p>'
                : `<p><strong>🎯 下一個數字：</strong>請輸入 <span style="font-size: 24px; font-weight: bold; color: #d32f2f;">${nextDigit}</span></p>`;

            const modalHTML = `
                <div class="hint-modal-overlay" id="hint-modal-overlay">
                    <div class="hint-modal">
                        <div class="hint-modal-header">
                            <h2><span class="icon">🏦</span> 銀行代碼提示</h2>
                        </div>
                        <div class="hint-modal-content">
                            <p>您需要輸入的銀行代碼是：</p>
                            <div class="hint-info-block">
                                <div class="hint-info-label">銀行代碼</div>
                                <div class="hint-info-value">${bankCode}</div>
                            </div>
                            <div class="hint-description">
                                <p><strong>💡 目前進度：</strong>已輸入 ${currentProgress} 位數字</p>
                                ${nextStepHint}
                            </div>
                        </div>
                        <div class="hint-modal-footer">
                            <button id="bank-code-hint-close-btn" class="hint-modal-close-btn" onclick="ATM.closeHintModal()">
                                我知道了
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.speech.speak(`銀行代碼是 ${bankCode.split('').join(' ')}`);
            ATM.Debug.log('hint', '💡 [Hint-Modal] 顯示銀行代碼提示彈窗');
        },

        // 🔧 [新增] 顯示銀行代碼資訊彈窗（困難模式+自選服務專用）
        showBankCodeInfoModal() {
            const modalHTML = `
                <div class="hint-modal-overlay" id="hint-modal-overlay">
                    <div class="hint-modal">
                        <div class="hint-modal-header">
                            <h2><span class="icon">🏦</span> 常用銀行代碼參考</h2>
                        </div>
                        <div class="hint-modal-content" style="max-height: 400px; overflow-y: auto;">
                            <p style="margin-bottom: 15px; color: #666;">以下是台灣常用銀行的銀行代碼：</p>
                            <div style="display: grid; gap: 10px;">
                                <div class="bank-code-item">
                                    <div class="bank-code-name">🏦 台灣銀行</div>
                                    <div class="bank-code-number">004</div>
                                </div>
                                <div class="bank-code-item">
                                    <div class="bank-code-name">🏦 土地銀行</div>
                                    <div class="bank-code-number">005</div>
                                </div>
                                <div class="bank-code-item">
                                    <div class="bank-code-name">🏦 合作金庫</div>
                                    <div class="bank-code-number">006</div>
                                </div>
                                <div class="bank-code-item">
                                    <div class="bank-code-name">🏦 第一銀行</div>
                                    <div class="bank-code-number">007</div>
                                </div>
                                <div class="bank-code-item">
                                    <div class="bank-code-name">🏦 華南銀行</div>
                                    <div class="bank-code-number">008</div>
                                </div>
                                <div class="bank-code-item">
                                    <div class="bank-code-name">🏦 彰化銀行</div>
                                    <div class="bank-code-number">009</div>
                                </div>
                                <div class="bank-code-item">
                                    <div class="bank-code-name">🏦 兆豐銀行</div>
                                    <div class="bank-code-number">017</div>
                                </div>
                                <div class="bank-code-item">
                                    <div class="bank-code-name">🏦 中國信託</div>
                                    <div class="bank-code-number">822</div>
                                </div>
                                <div class="bank-code-item">
                                    <div class="bank-code-name">🏦 國泰世華</div>
                                    <div class="bank-code-number">013</div>
                                </div>
                                <div class="bank-code-item">
                                    <div class="bank-code-name">🏦 台北富邦</div>
                                    <div class="bank-code-number">012</div>
                                </div>
                            </div>
                        </div>
                        <div class="hint-modal-footer">
                            <button class="hint-modal-close-btn" onclick="ATM.closeHintModal()">
                                我知道了
                            </button>
                        </div>
                    </div>
                </div>
                <style>
                    .bank-code-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 15px;
                        background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
                        border-radius: 8px;
                        border-left: 4px solid #1976d2;
                    }
                    .bank-code-name {
                        font-size: 16px;
                        font-weight: 500;
                        color: #333;
                    }
                    .bank-code-number {
                        font-size: 20px;
                        font-weight: bold;
                        color: #1976d2;
                        font-family: 'Courier New', monospace;
                    }
                </style>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.speech.speak('以下是常用銀行代碼參考資訊');
            ATM.Debug.log('hint', '💡 [Hint-Modal] 顯示銀行代碼資訊彈窗');
        },

        // 顯示帳號提示彈窗
        showAccountHintModal() {
            const accountNumber = this.state.gameState.easyModeHints.assignedAccountNumber;
            const currentProgress = this.state.gameState.transfer.accountNumber.length;
            const nextDigit = accountNumber[currentProgress];

            // 🔧 [修正] 判斷是否已輸入完整帳號
            const isComplete = currentProgress >= accountNumber.length;
            const nextStepHint = isComplete
                ? '<p><strong>✅ 帳號已輸入完成！</strong>請按 <span style="font-size: 20px; font-weight: bold; color: #4caf50;">確認鍵</span></p>'
                : `<p><strong>🎯 下一個數字：</strong>請輸入 <span style="font-size: 24px; font-weight: bold; color: #d32f2f;">${nextDigit}</span></p>`;

            const modalHTML = `
                <div class="hint-modal-overlay" id="hint-modal-overlay">
                    <div class="hint-modal">
                        <div class="hint-modal-header">
                            <h2><span class="icon">💳</span> 帳號提示</h2>
                        </div>
                        <div class="hint-modal-content">
                            <p>您需要輸入的帳號是：</p>
                            <div class="hint-info-block">
                                <div class="hint-info-label">帳號</div>
                                <div class="hint-info-value multiline">${accountNumber}</div>
                            </div>
                            <div class="hint-description">
                                <p><strong>💡 目前進度：</strong>已輸入 ${currentProgress} 位數字</p>
                                ${nextStepHint}
                            </div>
                        </div>
                        <div class="hint-modal-footer">
                            <button id="account-hint-close-btn" class="hint-modal-close-btn" onclick="ATM.closeHintModal()">
                                我知道了
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.speech.speak(`帳號是 ${accountNumber.split('').join(' ')}`);
            ATM.Debug.log('hint', '💡 [Hint-Modal] 顯示帳號提示彈窗');
        },

        // 顯示轉帳金額提示彈窗
        // 🔧 [修正] 新增 isError 參數，錯誤時語音說「不對，轉帳的金額是××元」
        showTransferAmountHintModal(isError = false) {
            const amount = this.state.gameState.easyModeHints.assignedAmount;
            const amountText = this.convertAmountToSpeech(amount);

            const modalHTML = `
                <div class="hint-modal-overlay" id="hint-modal-overlay">
                    <div class="hint-modal">
                        <div class="hint-modal-header">
                            <h2><span class="icon">💰</span> 轉帳金額提示</h2>
                        </div>
                        <div class="hint-modal-content">
                            <p>您需要輸入的轉帳金額是：</p>
                            <div class="hint-info-block">
                                <div class="hint-info-label">金額</div>
                                <div class="hint-info-value">NT$ ${amount.toLocaleString()}</div>
                            </div>
                            <div class="hint-description">
                                <p><strong>💡 提示：</strong>請依序輸入數字 ${amount}</p>
                                <p><strong>📝 中文：</strong>${amountText}</p>
                            </div>
                        </div>
                        <div class="hint-modal-footer">
                            <button id="transfer-amount-hint-close-btn" class="hint-modal-close-btn" onclick="ATM.closeHintModal()">
                                我知道了
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            // 🔧 [修正] 錯誤時說「不對，轉帳的金額是××元」，一般提示時說「轉帳金額是 ××元」
            const speechText = isError ? `不對，轉帳的金額是${amountText}` : `轉帳金額是 ${amountText}`;
            this.speech.speak(speechText);
            ATM.Debug.log('hint', '💡 [Hint-Modal] 顯示轉帳金額提示彈窗');
        },

        // 關閉提示彈窗
        closeHintModal() {
            const modal = document.getElementById('hint-modal-overlay');
            if (modal) {
                modal.remove();
                ATM.Debug.log('hint', '💡 [Hint-Modal] 關閉提示彈窗');
            }
        },

        // =====================================================
        // 輔助點擊模式系統（基於 A1/A2/A3 經驗）
        // =====================================================

        // 初始化輔助點擊模式
        initClickModeForATM() {
            ATM.Debug.log('assist', '[ClickMode] 初始化輔助點擊模式');

            const gs = this.state.gameState;

            // 初始化 clickModeState（如果尚未初始化）
            if (!gs.clickModeState) {
                gs.clickModeState = {
                    enabled: false,
                    currentPhase: null,
                    currentOperation: null,
                    currentStep: 0,
                    actionQueue: [],
                    waitingForClick: false,
                    waitingForStart: false,
                    lastClickTime: 0,
                    initialPromptShown: false,
                    isExecuting: false,  // 🔒 執行鎖定標記，防止快速點擊造成的競態條件
                    isTransitioning: false  // 🔒 [v1.2.62] 防止階段轉換競態條件
                };
            }
            // 每輪重置明細表取走標記（防止上一輪的 true 污染下一輪）
            gs.clickModeState.receiptTaken = false;

            // 設置當前操作類型
            gs.clickModeState.currentOperation = this.getActualSessionType();
            gs.clickModeState.currentPhase = 'insertCard';

            // 綁定全局點擊事件處理器
            this.bindClickModeHandler();

            // 先顯示提示，再啟用模式
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                // 立即顯示綠色提示
                this.showStartPrompt();

                // 稍微延遲後啟用點擊模式
                // 🔧 [Phase 3] 遷移至 TimerManager (nested)
                this.TimerManager.setTimeout(() => {
                    gs.clickModeState.enabled = true;
                    gs.clickModeState.waitingForStart = true;
                    ATM.Debug.log('assist', '[ClickMode] 模式已啟用，等待用戶點擊開始');
                }, 300, 'clickMode');
            }, 500, 'clickMode');
        },

        // 🔧 [新增] 視覺同步解鎖：依據視覺提示出現的時間，延遲 0.5 秒才允許點擊
        enableClickModeWithVisualDelay(source = 'unknown') {
            if (!this.state.settings.clickMode || !this.state.gameState.clickModeState) return;

            const gs = this.state.gameState;

            // 1. 立即鎖定，防止畫面剛出來瞬間的誤觸
            gs.clickModeState.waitingForClick = false;

            // 清除舊的計時器（如果有的話）
            // 🔧 [Phase 2d] 改用 TimerManager.clearTimeout
            if (gs.clickModeState._visualDelayTimer) {
                this.TimerManager.clearTimeout(gs.clickModeState._visualDelayTimer);
            }

            // 2. 設定 500ms 延遲
            ATM.Debug.log('assist', `[ClickMode] 🔒 視覺元素出現 (${source})，啟動 0.5秒 安全鎖定...`);

            // 🔧 [Phase 2d] 遷移至 TimerManager
            gs.clickModeState._visualDelayTimer = this.TimerManager.setTimeout(() => {
                if (gs.clickModeState) {
                    gs.clickModeState.waitingForClick = true;

                    // 🔧 [關鍵修正] 時間回溯 1000ms
                    // 讓系統認為「已經準備好很久了」，這樣您的下一次點擊就會立即生效
                    // 解決「點擊過快」和「需要多點一次」的問題
                    gs.clickModeState.clickReadyTime = Date.now() - 1000;

                    gs.clickModeState.isExecuting = false; // 確保執行鎖也被解除
                    ATM.Debug.log('assist', `[ClickMode] 🟢 0.5秒已過，解除鎖定 (已繞過防誤觸檢查)`);
                }
            }, 500, 'visualDelay'); // 這裡就是您要求的 0.5 秒
        },

        // 綁定全局點擊事件處理器
        bindClickModeHandler() {
            // 防止重複綁定
            if (this._clickModeHandlerBound) {
                ATM.Debug.log('assist', '[ClickMode] 事件處理器已綁定，跳過重複綁定');
                return;
            }

            ATM.Debug.log('assist', '[ClickMode] 綁定全局點擊事件處理器');

            // 建立輔助點擊遮罩（全程覆蓋，直到 click mode 結束）
            if (!document.getElementById('click-exec-overlay')) {
                const _ov = document.createElement('div');
                _ov.id = 'click-exec-overlay';
                const _tbEl = document.querySelector('.atm-title-bar');
                const _tbBottom = _tbEl ? Math.round(_tbEl.getBoundingClientRect().bottom) : 60;
                _ov.style.cssText = `position:fixed;top:${_tbBottom}px;left:0;right:0;bottom:0;z-index:10100;pointer-events:all;touch-action:none;background:transparent;`;
                document.body.appendChild(_ov);
            }

            // 綁定到文檔級別（capture phase），儲存具名參考以便之後解除
            this._clickModeHandler = (e) => this.handleClickModeClick(e);
            document.addEventListener('click', this._clickModeHandler, true);

            this._clickModeHandlerBound = true;
        },

        // 解除全局點擊事件處理器
        unbindClickModeHandler() {
            if (this._clickModeHandlerBound && this._clickModeHandler) {
                document.removeEventListener('click', this._clickModeHandler, true);
                this._clickModeHandler = null;
                this._clickModeHandlerBound = false;
                ATM.Debug.log('assist', '[ClickMode] 已解除全局點擊事件處理器');
            }
        },

        // 處理輔助點擊模式的點擊事件
        handleClickModeClick(event) {
            const gs = this.state.gameState;

            // 1. 如果不是程式觸發的點擊 (isTrusted=false)，直接放行
            if (!event.isTrusted) {
                ATM.Debug.log('assist', '[ClickMode] 🟢 偵測到程式觸發的點擊，放行 (不攔截)');
                return;
            }

            // 檢查是否啟用
            if (!this.state.settings.clickMode || !gs.clickModeState || !gs.clickModeState.enabled) {
                return;
            }

            // 🔒 執行鎖定檢查：如果正在執行動作，忽略所有背景點擊（白名單除外）
            if (gs.clickModeState.isExecuting) {
                const target = event.target;
                const isWhiteListed =
                    target.closest('.back-to-menu-btn') ||
                    target.closest('.modal-content') ||
                    target.closest('.take-cash-btn') ||
                    target.closest('#complete-cash-btn') ||
                    target.closest('.take-card-btn') ||
                    target.closest('#take-card-btn-container') ||
                    target.closest('#atm-card') ||
                    target.closest('.take-receipt-btn') ||
                    target.closest('#take-receipt-btn-container') ||
                    target.closest('#receipt-wrapper') ||
                    target.closest('#complete-receipt-btn') ||
                    target.closest('.print-btn') ||
                    target.closest('.no-print-btn');

                if (!isWhiteListed) {
                    event.preventDefault();
                    event.stopPropagation();
                    ATM.Debug.log('assist', '[ClickMode] 🔒 動作執行中，忽略點擊');
                    return;
                }
            }

            // 2. [v1.2.28] 白名單放行機制：如果是點擊這些按鈕/區域，直接讓原生事件通過！
            // 這解決了「要點兩次」的問題，因為第一次點擊就會直接觸發按鈕功能
            const target = event.target;
            const isWhiteListed =
                target.closest('.back-to-menu-btn') ||     // 返回設定按鈕
                target.closest('.modal-content') ||        // 🔧 [v1.2.28] 放寬白名單：整個彈窗內容都放行，避免點擊間隙被攔截
                target.closest('.take-cash-btn') ||        // 取鈔按鈕
                target.closest('#complete-cash-btn') ||    // 現金彈窗確認按鈕
                target.closest('.take-card-btn') ||        // 取回卡片按鈕
                target.closest('#take-card-btn-container') || // 🔧 [v1.2.28] 增加按鈕容器
                target.closest('#atm-card') ||             // 卡片本身 (也可點擊)
                target.closest('.take-receipt-btn') ||     // 取走明細表按鈕
                target.closest('#take-receipt-btn-container') || // 🔧 [v1.2.28] 增加按鈕容器
                target.closest('#receipt-wrapper') ||      // 收據紙張 (也可點擊)
                target.closest('#complete-receipt-btn') || // 明細表彈窗確認按鈕
                target.closest('.print-btn') ||            // 印明細表
                target.closest('.no-print-btn');           // 不印明細表

            if (isWhiteListed) {
                ATM.Debug.log('assist', '[ClickMode] 🟢 用戶點擊了白名單按鈕/區域，直接放行 (原生優先)');

                // 🔧 [v1.2.59] 統一處理：除了「返回設定」按鈕和物理按鈕外，所有點擊都視為「用戶點擊繼續」

                // 檢查是否點擊了「返回設定」按鈕
                if (target.closest('.back-to-menu-btn')) {
                    ATM.Debug.log('assist', '[ClickMode] 點擊返回設定按鈕，放行原生事件');
                    return; // 返回設定按鈕直接返回，不觸發 executeNextAction
                }

                // 🔧 [v1.2.47] 特殊處理：點擊明細表區域時，主動觸發按鈕點擊
                if (target.closest('#receipt-wrapper') || target.closest('#take-receipt-btn-container')) {
                    // 如果點擊的不是按鈕本身，而是周圍區域，主動點擊按鈕
                    if (!target.closest('.take-receipt-btn')) {
                        const receiptBtn = document.querySelector('.take-receipt-btn');
                        if (receiptBtn) {
                            ATM.Debug.log('assist', '[ClickMode] 點擊明細表區域，主動觸發按鈕點擊');
                            event.preventDefault();
                            event.stopPropagation();
                            // 🔧 [v1.2.47] 使用 click() 確保事件處理器被正確觸發
                            receiptBtn.click();
                            return;
                        }
                    }
                    // 如果點擊的是按鈕本身，放行
                    return;
                }

                // 🔧 [v1.2.59] 統一彈窗處理：點擊彈窗空白區域視為「用戶點擊繼續」
                if (target.closest('.modal-content')) {
                    // 🔧 [v1.2.57] 特殊處理：金錢選擇彈窗（存款流程）
                    const billSelectionModal = document.getElementById('bill-selection-modal');
                    if (billSelectionModal) {
                        // 如果點擊的是金錢圖標，讓原生事件通過
                        if (target.closest('.money-icon-item')) {
                            ATM.Debug.log('assist', '[ClickMode] 點擊金錢圖標，放行原生事件');
                            return; // 放行，讓 bindMoneyIconClickEvents 處理
                        } else {
                            // 🔧 [v1.2.58] 點擊的是彈窗空白處，觸發「用戶點擊繼續」邏輯
                            ATM.Debug.log('assist', '[ClickMode] 點擊金錢選擇彈窗空白區域，視為用戶點擊繼續');
                            // 不要 return，讓程式繼續執行到「用戶點擊繼續」的邏輯
                        }
                    }

                    // 檢查是否是任務提示彈窗、金額提示彈窗、轉帳金額提醒彈窗、現金彈窗、明細表彈窗
                    const taskReminderModal = document.querySelector('.task-reminder-modal');
                    const amountReminderModal = document.querySelector('.amount-reminder-modal');
                    const transferAmountReminderModal = document.querySelector('.transfer-amount-reminder-modal');
                    const cashModal = document.getElementById('complete-cash-btn'); // 現金彈窗通過按鈕判斷
                    const receiptModal = document.getElementById('complete-receipt-btn'); // 明細表彈窗通過按鈕判斷

                    // 🔧 [v1.2.59] 新邏輯：所有彈窗都視為「用戶點擊繼續」
                    if (taskReminderModal || amountReminderModal || transferAmountReminderModal || cashModal || receiptModal) {
                        // 檢查是否點擊了彈窗中的按鈕本身
                        const clickedButton = target.closest('button');
                        if (clickedButton && clickedButton.closest('.modal-content')) {
                            // 點擊的是按鈕本身，放行原生事件
                            ATM.Debug.log('assist', '[ClickMode] 點擊彈窗按鈕，放行原生事件');

                            // 特殊處理：如果是彈窗按鈕，我們需要手動推進輔助系統的狀態
                            // 🔧 [Phase 3] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                if (gs.clickModeState.waitingForClick === false) {
                                    ATM.Debug.log('assist', '[ClickMode] 彈窗手動關閉，推進輔助狀態');
                                    gs.clickModeState.currentStep++;
                                    gs.clickModeState.waitingForClick = true;
                                }
                            }, 300, 'clickMode');
                            return;
                        } else {
                            // 點擊的是彈窗空白區域，視為「用戶點擊繼續」
                            ATM.Debug.log('assist', '[ClickMode] 點擊彈窗空白區域，視為用戶點擊繼續');
                            // 不要 return，讓程式繼續執行到「用戶點擊繼續」邏輯
                        }
                    }

                    // 其他 .modal-content 元素（如果沒有被上述邏輯捕獲）
                    // 也視為「用戶點擊繼續」，不 return
                    ATM.Debug.log('assist', '[ClickMode] 點擊其他彈窗區域，視為用戶點擊繼續');
                    // 不要 return，讓程式繼續執行
                }

                // 檢查是否是物理按鈕/區域（取鈔、取卡、收據等）
                if (target.closest('.take-cash-btn') ||
                    target.closest('.take-card-btn') ||
                    target.closest('#atm-card') ||
                    target.closest('.print-btn') ||
                    target.closest('.no-print-btn')) {
                    ATM.Debug.log('assist', '[ClickMode] 點擊物理按鈕/區域，放行原生事件');
                    return; // 放行，讓原生事件處理
                }

                // 其他白名單元素，視為「用戶點擊繼續」
                ATM.Debug.log('assist', '[ClickMode] 點擊白名單區域，視為用戶點擊繼續');
                // 不 return，繼續執行到「用戶點擊繼續」邏輯
            }

            // 3. 攔截其他點擊 (背景、空白處)
            event.preventDefault();
            event.stopPropagation();

            ATM.Debug.log('assist', '[ClickMode] 🔴 攔截背景點擊');

            // 冷卻檢查
            const now = Date.now();
            if (now - gs.clickModeState.lastClickTime < 500) {
                return;
            }
            gs.clickModeState.lastClickTime = now;

            this.hideStartPrompt();

            if (gs.clickModeState.waitingForStart) {
                ATM.Debug.log('assist', '[ClickMode] 用戶點擊開始');
                gs.clickModeState.waitingForStart = false;
                gs.clickModeState.currentStep = 0;
                this.buildActionQueue(gs.clickModeState.currentPhase);
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => { this.executeNextAction(); }, 300, 'clickMode');

            } else if (gs.clickModeState.waitingForClick) {
                // 🛡️ 防快速點擊安全鎖：確保畫面切換後有足夠時間讓用戶看到
                const readyTime = gs.clickModeState.clickReadyTime || 0;
                const timeSinceReady = now - readyTime;

                // 如果距離「準備就緒」的時間小於 600ms，視為連點穿透，予以忽略
                if (timeSinceReady < 600) {
                    ATM.Debug.log('assist', `[ClickMode] ⏳ 點擊過快，忽略 (防誤觸保護: ${timeSinceReady}ms < 600ms)`);
                    return;
                }

                ATM.Debug.log('assist', '[ClickMode] 用戶點擊繼續');
                gs.clickModeState.waitingForClick = false;
                this.executeNextAction();
            }
        },

        // 顯示「點擊任何一處繼續」提示
        showStartPrompt() {
            const gs = this.state.gameState;

            // 只在第一次顯示提示（插入卡片階段）
            if (gs.clickModeState.initialPromptShown) {
                ATM.Debug.log('assist', '[ClickMode] 提示已顯示過，跳過');
                return;
            }

            // 防止重複顯示
            if (document.getElementById('click-mode-prompt')) {
                return;
            }

            ATM.Debug.log('assist', '[ClickMode] 顯示點擊提示（僅第一次）');
            gs.clickModeState.initialPromptShown = true;

            const promptHTML = `
                <div id="click-mode-prompt" style="
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    color: white;
                    padding: 25px 50px;
                    border-radius: 15px;
                    font-size: 28px;
                    font-weight: bold;
                    z-index: 10000;
                    box-shadow: 0 8px 30px rgba(76, 175, 80, 0.4);
                    animation: clickPromptPulse 1.5s ease-in-out infinite;
                    cursor: pointer;
                    text-align: center;
                    border: 3px solid #fff;
                ">
                    👆 點擊任何一處繼續
                </div>
                <style>
                    /* @keyframes clickPromptPulse 已移至 injectGlobalAnimationStyles()（原名 pulse，避免與 CSS 衝突） */
                </style>
            `;

            document.body.insertAdjacentHTML('beforeend', promptHTML);
        },

        // 隱藏點擊提示
        hideStartPrompt() {
            const prompt = document.getElementById('click-mode-prompt');
            if (prompt) {
                prompt.remove();
                ATM.Debug.log('assist', '[ClickMode] 隱藏點擊提示');
            }
        },

        // 建立操作隊列
        buildActionQueue(phase) {
            const gs = this.state.gameState;
            const operation = gs.clickModeState.currentOperation;
            let actionQueue = [];

            // 🔧 [v1.2.60] 清理之前的 interval（如果存在），避免競態條件
            if (gs.clickModeState.activeInterval) {
                clearInterval(gs.clickModeState.activeInterval);
                gs.clickModeState.activeInterval = null;
                ATM.Debug.log('assist', '[ClickMode] 已清理前一階段的 interval');
            }

            ATM.Debug.log('assist', '[ClickMode] 建立操作隊列，階段:', phase, '操作:', operation);

            switch (phase) {
                case 'insertCard':
                    // 插入金融卡
                    actionQueue = [
                        { type: 'clickCard' }
                    ];
                    break;

                case 'enterPIN':
                    // 輸入 PIN 密碼
                    const pin = gs.correctPin; // '1234'
                    actionQueue = pin.split('').map(digit => ({
                        type: 'pressKey',
                        key: digit
                    }));
                    // 最後加上確認鍵
                    actionQueue.push({ type: 'pressKey', key: 'enter' });
                    break;

                case 'selectOperation':
                    // 選擇操作類型（分成兩個步驟：關閉彈窗 + 選擇操作）
                    actionQueue = [
                        {
                            type: 'closeModal',
                            modalId: 'task-reminder-confirm-btn'  // 步驟4：關閉任務提示彈窗
                        },
                        {
                            type: 'selectOperation',
                            operation: operation  // 步驟5：點擊提款按鈕
                        }
                    ];
                    break;

                case 'withdrawAmount':
                    // 選擇提款金額（分成兩個步驟：關閉彈窗 + 選擇金額）
                    const withdrawAmount = gs.easyModeHints.assignedAmount;
                    actionQueue = [
                        {
                            type: 'closeModal',
                            modalId: 'amount-reminder-confirm-btn'  // 步驟6：關閉金額提醒彈窗
                        },
                        {
                            type: 'selectAmount',
                            amount: withdrawAmount  // 步驟7：點擊指定金額按鈕
                        }
                    ];
                    break;

                case 'withdrawProcessing':
                    // 等待處理完成
                    actionQueue = [{ type: 'waitProcessing' }];
                    break;

                case 'takeCash':
                    // 取走現金
                    actionQueue = [{ type: 'takeCash' }];
                    break;

                case 'withdrawReceipt':
                    // 選擇明細表選項
                    const receiptOption = gs.easyModeHints.assignedReceiptOption;
                    actionQueue = [{
                        type: 'selectReceiptOption',
                        option: receiptOption
                    }];
                    break;

                case 'printFlow_takeCard':
                    // 🔧 [v1.2.34] 列印流程：取回卡片
                    actionQueue = [{ type: 'takeCard' }];
                    break;

                case 'printFlow_collectCash':
                    // 🔧 [v1.2.56] 列印流程：點擊取回卡片按鈕
                    // 卡片退出動畫完成後，會顯示「取回卡片」按鈕（id: take-card-btn）
                    // 點擊後，會觸發收取現金的流程
                    actionQueue = [
                        { type: 'clickTakeCardButton' }  // 點擊取回卡片按鈕
                    ];
                    break;

                case 'noReceiptFlow_takeCard':
                    // 🔧 [v1.2.55] 不列印流程：取回卡片
                    actionQueue = [{ type: 'takeCard' }];
                    break;

                case 'noReceiptFlow_collectCash':
                    // 🔧 [v1.2.55] 不列印流程：收取現金（使用注入隊列）
                    actionQueue = [];
                    break;

                case 'takeReceipt':
                    // 🔧 [v1.2.32] 取走明細表
                    actionQueue = [{ type: 'takeReceipt' }];
                    break;

                case 'depositAmount':
                    // 🔧 存款金額選擇（步驟6：點擊現金出口，步驟7：點擊多次金錢圖示）
                    const depositAmount = gs.easyModeHints.assignedAmount;
                    const billCount = Math.ceil(depositAmount / 1000); // 計算需要多少張 1000 元鈔票

                    actionQueue = [
                        { type: 'clickCashDispenser' }  // 步驟6：點擊現金出口
                    ];

                    // 步驟7：為每張鈔票添加一個點擊動作
                    for (let i = 0; i < billCount; i++) {
                        actionQueue.push({
                            type: 'clickMoneyIcon',
                            index: i,
                            total: billCount
                        });
                    }
                    break;

                case 'depositBills':
                    // 🔧 存款確認流程（步驟8和步驟9：兩次點擊確認按鈕）
                    actionQueue = [
                        { type: 'confirmDeposit' },  // 步驟8：確認存入金額
                        { type: 'confirmDeposit' }   // 步驟9：確認存入現鈔
                    ];
                    break;

                case 'depositConfirm':
                    // 已在 depositBills 階段處理
                    actionQueue = [];
                    break;

                case 'depositProcessing':
                    // 等待處理
                    actionQueue = [{ type: 'waitProcessing' }];
                    break;

                case 'depositReceipt':
                    // 明細表選項
                    const depositReceiptOption = gs.easyModeHints.assignedReceiptOption;
                    actionQueue = [{
                        type: 'selectReceiptOption',
                        option: depositReceiptOption
                    }];
                    break;

                case 'inquiryProcessing':
                    // 餘額查詢處理
                    actionQueue = [{ type: 'waitProcessing' }];
                    break;

                case 'inquiryReceipt':
                    // 查詢明細表選項
                    const inquiryReceiptOption = gs.easyModeHints.assignedReceiptOption;
                    actionQueue = [{
                        type: 'selectReceiptOption',
                        option: inquiryReceiptOption
                    }];
                    break;

                case 'transferAmountReminder':
                    // 🔧 [v1.2.38] 轉帳金額提醒彈窗（步驟6：關閉金額提醒彈窗）
                    actionQueue = [
                        {
                            type: 'closeModal',
                            modalId: 'transfer-amount-reminder-confirm-btn'  // 步驟6：關閉金額提醒彈窗
                        }
                    ];
                    break;

                case 'transferBank':
                    // 輸入銀行代碼（先關閉銀行代碼提示彈窗）
                    const bankCode = gs.easyModeHints.assignedBankCode || '004';
                    actionQueue = [{ type: 'closeModal', modalId: 'bank-code-hint-close-btn' }];
                    actionQueue = actionQueue.concat(bankCode.split('').map(digit => ({
                        type: 'pressKey',
                        key: digit
                    })));
                    actionQueue.push({ type: 'pressKey', key: 'enter' });
                    break;

                case 'transferAccount':
                    // 輸入帳號（先關閉帳號提示彈窗）
                    const account = gs.easyModeHints.assignedAccountNumber || '12345678';
                    actionQueue = [{ type: 'closeModal', modalId: 'account-hint-close-btn' }];
                    actionQueue = actionQueue.concat(account.split('').map(digit => ({
                        type: 'pressKey',
                        key: digit
                    })));
                    actionQueue.push({ type: 'pressKey', key: 'enter' });
                    break;

                case 'transferAmount':
                    // 輸入轉帳金額（先關閉金額提示彈窗）
                    const transferAmount = gs.easyModeHints.assignedAmount;
                    const amountStr = transferAmount.toString();
                    actionQueue = [{ type: 'closeModal', modalId: 'transfer-amount-hint-close-btn' }];
                    actionQueue = actionQueue.concat(amountStr.split('').map(digit => ({
                        type: 'pressKey',
                        key: digit
                    })));
                    actionQueue.push({ type: 'pressKey', key: 'enter' });
                    break;

                case 'transferVerify':
                    // 確認轉帳資訊
                    actionQueue = [{ type: 'confirmTransferVerify' }];
                    break;

                case 'transferConfirm':
                    // 最終確認轉帳
                    actionQueue = [{ type: 'confirmTransferFinal' }];
                    break;

                case 'transferProcessing':
                    // 等待處理
                    actionQueue = [{ type: 'waitProcessing' }];
                    break;

                case 'transferReceipt':
                    // 轉帳明細表選項
                    const transferReceiptOption = gs.easyModeHints.assignedReceiptOption;
                    actionQueue = [{
                        type: 'selectReceiptOption',
                        option: transferReceiptOption
                    }];
                    break;

                case 'complete':
                    // 取回卡片
                    actionQueue = [{ type: 'takeCard' }];
                    break;

                default:
                    ATM.Debug.warn('assist', '[ClickMode] 未知階段:', phase);
                    break;
            }

            gs.clickModeState.actionQueue = actionQueue;
            gs.clickModeState.currentStep = 0;

            ATM.Debug.log('assist', '[ClickMode] 操作隊列已建立:', actionQueue);
        },

        // =================================================================
        // v1.2.23 (2025-12-01) - 點擊響應極速優化版 ⭐ 體驗修復
        // =================================================================
        // [核心修改] 階段完成時自動轉換，無需用戶額外點擊
        // - 問題：用戶點擊插卡後，需要再點擊一次才能進入密碼輸入
        // - 原因：executeNextAction 在階段完成時等待點擊來觸發 transitionPhase
        // - 修正：階段完成時自動調用 transitionPhase，無縫銜接下一階段
        // =================================================================

        // 🔧 [v1.2.50] 執行下一個操作 (參考 A1 設計，修正時序問題)
        executeNextAction() {
            const gs = this.state.gameState;
            const actionQueue = gs.clickModeState.actionQueue;
            const currentStep = gs.clickModeState.currentStep;

            ATM.Debug.log('assist', '[ClickMode] executeNextAction 調用 - 步驟:', currentStep, '/', actionQueue.length, '階段:', gs.clickModeState.currentPhase);

            // 🔒 加鎖：防止快速點擊導致的競態條件
            gs.clickModeState.isExecuting = true;

            // 檢查隊列是否完成
            if (currentStep >= actionQueue.length) {
                ATM.Debug.log('assist', '[ClickMode] ✓ 偵測到階段完成！當前階段:', gs.clickModeState.currentPhase);
                ATM.Debug.log('assist', '[ClickMode] → 準備轉換到下一階段...');
                // 階段轉換
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                    this.transitionPhase();
                }, 300, 'clickMode');
                return;
            }

            // 取得當前操作
            const action = actionQueue[currentStep];
            ATM.Debug.log('assist', '[ClickMode] 執行操作:', action, (currentStep + 1), '/', actionQueue.length);

            // 🔧 [v1.2.50] 立即禁止點擊，防止操作執行期間的誤觸
            gs.clickModeState.waitingForClick = false;

            // 🔧 [v1.2.50] 延遲執行操作（參考 A1 設計）
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                // 根據操作類型執行對應函數
                switch (action.type) {
                    case 'clickCard':
                        this.autoClickCard();
                        break;
                    case 'pressKey':
                        this.autoPressKey(action.key);
                        break;
                    case 'selectOperation':
                        this.autoSelectOperation(action.operation);
                        break;
                    case 'clickCashDispenser':
                        this.autoClickCashDispenser();
                        break;
                    case 'clickMoneyIcon':
                        this.autoClickMoneyIcon(action.index, action.total);
                        break;
                    case 'selectAmount':
                        this.autoSelectAmount(action.amount);
                        break;
                    case 'insertBill':
                        this.autoInsertBill(action.value);
                        break;
                    case 'confirmDeposit':
                        this.autoConfirmDeposit();
                        break;
                    case 'confirmTransferVerify':
                        this.autoConfirmTransferVerify();
                        break;
                    case 'confirmTransferFinal':
                        this.autoConfirmTransferFinal();
                        break;
                    case 'waitProcessing':
                        this.autoWaitProcessing();
                        return; // 異步操作，跳過後續處理
                    case 'takeCash':
                        this.autoTakeCash();
                        return; // 異步操作，跳過後續處理
                    case 'completeCash':
                        this.autoCompleteCash();
                        return; // 異步操作，跳過後續處理
                    case 'takeReceipt':
                        ATM.Debug.log('assist', '[ClickMode] 執行自動取走明細表');
                        if (gs.clickModeState.receiptTaken) {
                            ATM.Debug.log('assist', '[ClickMode] 明細表已經取走過，跳過重複執行');
                            gs.clickModeState.currentStep++;
                            gs.clickModeState.isExecuting = false;  // 🔧 釋放鎖，防止永久凍結
                            return;
                        }
                        this.autoTakeReceipt();
                        return; // 異步操作，跳過後續處理
                    case 'completeReceipt':
                        ATM.Debug.log('assist', '[ClickMode] 執行自動點擊明細表確認');
                        // 添加重試機制，解決明細表列印動畫導致按鈕尚未出現的問題
                        let receiptAttempts = 0;
                        const maxReceiptAttempts = 60; // 等待 6 秒 (60 * 100ms)

                        const pollReceipt = () => {
                            const confirmBtn = document.getElementById('complete-receipt-btn');

                            if (confirmBtn) {
                                this.audio.playBeep();
                                confirmBtn.click();
                                gs.clickModeState.currentStep++;
                                ATM.Debug.log('assist', `[ClickMode] ✅ 已點擊明細表彈窗確認按鈕 (嘗試 ${receiptAttempts + 1} 次)`);

                                // 🔧 [Phase 3] 遷移至 TimerManager
                                this.TimerManager.setTimeout(() => {
                                    gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                                    ATM.Debug.log('assist', '[ClickMode] 明細表彈窗已關閉，轉換到 complete 階段');
                                    this.transitionPhase();
                                }, 500, 'clickMode');
                                return;
                            } else if (receiptAttempts >= maxReceiptAttempts) {
                                ATM.Debug.error('[ClickMode] ⚠️ 等待明細表彈窗按鈕超時');
                                gs.clickModeState.isExecuting = false;  // 🔓 超時也要解鎖，避免卡死
                                return;
                            } else {
                                if (receiptAttempts % 10 === 0 && receiptAttempts > 0) {
                                    ATM.Debug.log('assist', `[ClickMode] 等待明細表彈窗按鈕... (${receiptAttempts}/${maxReceiptAttempts})`);
                                }
                                receiptAttempts++;
                            }
                            ATM.TimerManager.setTimeout(pollReceipt, 100, 'autoAction');
                        };
                        ATM.TimerManager.setTimeout(pollReceipt, 100, 'autoAction');
                        return; // 重要：直接返回，等待輪詢處理
                    case 'selectReceiptOption':
                        this.autoSelectReceiptOption(action.option);
                        return; // 異步操作，跳過後續處理
                    case 'takeCard':
                        this.autoTakeCard();
                        return; // 異步操作，跳過後續處理
                    case 'clickTakeCardButton':
                        this.autoClickTakeCardButton();
                        return; // 異步操作，跳過後續處理
                    case 'closeModal':
                        this.autoCloseModal(action.modalId);
                        return; // 由 autoCloseModal 內部處理步驟計數
                    case 'delay':
                        ATM.Debug.log('assist', `[ClickMode] 延遲 ${action.duration}ms: ${action.description || ''}`);
                        gs.clickModeState.currentStep++;
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                            ATM.Debug.log('assist', '[ClickMode] 延遲完成，等待用戶點擊繼續');
                            gs.clickModeState.waitingForClick = true;
                        }, action.duration, 'clickMode');
                        return; // 跳過後續處理
                    case 'waitForScreen':
                        ATM.Debug.log('assist', `[ClickMode] 等待畫面渲染: ${action.screenType} - ${action.description || ''}`);
                        gs.clickModeState.currentStep++;
                        let checkCount = 0;
                        const pollScreen = () => {
                            checkCount++;
                            const menuButtons = document.querySelectorAll('.side-label[data-action^="right-"]');
                            const screenContent = document.getElementById('screen-content');
                            ATM.Debug.log('assist', `[ClickMode] 檢查主選單 (${checkCount}/40): 找到 ${menuButtons.length} 個按鈕`);
                            if (menuButtons.length > 0) {
                                gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                                ATM.Debug.log('assist', `[ClickMode] ✅ 主選單已渲染完成！（檢查 ${checkCount} 次），等待用戶點擊`);
                                gs.clickModeState.waitingForClick = true;
                                return;
                            } else if (checkCount >= 40) {
                                gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                                ATM.Debug.warn('assist', '[ClickMode] ⚠️ 主選單渲染超時（2秒），強制繼續');
                                ATM.Debug.warn('assist', '[ClickMode] screenContent:', screenContent ? screenContent.innerHTML.substring(0, 200) : 'null');
                                gs.clickModeState.waitingForClick = true;
                                return;
                            }
                            ATM.TimerManager.setTimeout(pollScreen, 50, 'autoAction');
                        };
                        ATM.TimerManager.setTimeout(pollScreen, 50, 'autoAction');
                        return; // 跳過後續處理
                    default:
                        ATM.Debug.warn('assist', '[ClickMode] 未知操作類型:', action.type);
                        gs.clickModeState.currentStep++;
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                            gs.clickModeState.waitingForClick = true;
                        }, 500, 'clickMode');
                        return; // 跳過後續處理
                }

                // 🔧 [v1.2.50] 操作完成後才增加步驟索引
                gs.clickModeState.currentStep++;

                ATM.Debug.log('assist', '[ClickMode] 步驟已完成，當前:', gs.clickModeState.currentStep, '/', gs.clickModeState.actionQueue.length);

                // 🔧 [v1.2.50] 根據操作類型決定額外延遲時間
                let extraDelay = 300;  // 預設延遲

                // 特殊操作需要更長的等待時間
                if (action.type === 'selectAmount') {
                    extraDelay = 800;  // 金額處理需要更多時間
                } else if (action.type === 'pressKey') {
                    extraDelay = 200;  // 按鍵操作較快
                }

                // 延遲後才啟用點擊，確保操作完全執行完畢
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    gs.clickModeState.isExecuting = false;  // 🔓 解鎖（同步操作完成）
                    if (gs.clickModeState.currentStep < gs.clickModeState.actionQueue.length) {
                        // 還有更多操作，啟用點擊繼續執行
                        gs.clickModeState.waitingForClick = true;
                        gs.clickModeState.clickReadyTime = Date.now(); // 🕒 更新時間戳記（防連續步驟間的快速點擊）
                        ATM.Debug.log('assist', '[ClickMode] 操作完成，等待下一次點擊（步驟進行中）');
                    } else {
                        // 階段完成，自動轉換到下一階段
                        ATM.Debug.log('assist', '[ClickMode] 階段操作完成，自動轉換階段');
                        this.transitionPhase();
                    }
                }, extraDelay, 'clickMode');
            }, 300);  // 執行操作前的初始延遲
        },

        // 🔧 [v1.2.50] 移除 isScreenReady 和 waitForScreenReady 方法，不再需要輪詢檢查

        // 🔧 [v1.2.50] 階段轉換 (簡化版，參考 A1 設計)
        transitionPhase() {
            const gs = this.state.gameState;

            // 🔧 [v1.2.62] 防止競態條件：如果正在轉換中，直接返回
            if (gs.clickModeState.isTransitioning) {
                ATM.Debug.log('assist', '[ClickMode] transitionPhase 已在執行中，忽略重複呼叫');
                return;
            }

            // 🔧 [v1.2.63] 核心修復：檢查當前階段是否有待執行的動作
            // 如果 currentStep < actionQueue.length，表示還有動作需要執行，不應轉換階段
            const currentStep = gs.clickModeState.currentStep;
            const actionQueueLength = gs.clickModeState.actionQueue.length;
            if (currentStep < actionQueueLength) {
                ATM.Debug.log('assist', '[ClickMode] 當前階段尚有待執行動作 (' + currentStep + '/' + actionQueueLength + ')，跳過轉換');
                return;
            }

            gs.clickModeState.isTransitioning = true;

            const currentPhase = gs.clickModeState.currentPhase;
            const operation = gs.clickModeState.currentOperation;

            ATM.Debug.log('assist', '[ClickMode] 階段轉換，當前階段:', currentPhase, '操作:', operation);

            let nextPhase = null;

            // 通用流程
            if (currentPhase === 'insertCard') {
                nextPhase = 'enterPIN';
            } else if (currentPhase === 'enterPIN') {
                nextPhase = 'selectOperation';
            } else if (currentPhase === 'selectOperation') {
                // 根據操作類型分支
                if (operation === 'withdraw') {
                    nextPhase = 'withdrawAmount';
                } else if (operation === 'deposit') {
                    nextPhase = 'depositAmount';
                } else if (operation === 'inquiry') {
                    nextPhase = 'inquiryProcessing';
                } else if (operation === 'transfer') {
                    // 🔧 [v1.2.38] 簡單模式+指定轉帳：先顯示金額提醒彈窗
                    if (this.state.settings.difficulty === 'easy' && this.state.settings.sessionType === 'transfer') {
                        nextPhase = 'transferAmountReminder';
                    } else {
                        nextPhase = 'transferBank';
                    }
                }
            }
            // 提款流程
            else if (currentPhase === 'withdrawAmount') {
                nextPhase = 'withdrawProcessing';
            } else if (currentPhase === 'withdrawProcessing') {
                // 處理完成後選擇明細表（步驟8）
                nextPhase = 'withdrawReceipt';
            } else if (currentPhase === 'withdrawReceipt') {
                // 判斷是否選擇列印明細表
                // 🔧 [v1.2.56] 修復快速點擊時 assignedReceiptOption 尚未設置的競態條件
                const receiptOption = gs.easyModeHints.assignedReceiptOption || 'print';
                ATM.Debug.log('assist', '[ClickMode] transitionPhase - receiptOption:', receiptOption);
                if (receiptOption === 'print') {
                    // 列印流程：先取卡片（步驟9）
                    nextPhase = 'printFlow_takeCard';
                } else {
                    // 不列印：先取卡片，再取現金
                    nextPhase = 'noReceiptFlow_takeCard';
                }
            } else if (currentPhase === 'printFlow_takeCard') {
                // 取卡後收取現金（步驟10-11）
                const transactionType = gs.currentTransaction?.type;
                if (transactionType === 'withdraw') {
                    nextPhase = 'printFlow_collectCash';
                } else {
                    // 存款或餘額查詢不需要取現金，直接取明細表
                    nextPhase = 'takeReceipt';
                }
            } else if (currentPhase === 'noReceiptFlow_takeCard') {
                // 🔧 [v1.2.55] 不列印流程：取卡後收取現金
                const transactionType = gs.currentTransaction?.type;
                if (transactionType === 'withdraw') {
                    nextPhase = 'noReceiptFlow_collectCash';
                } else {
                    // 存款或餘額查詢沒有現金，直接完成
                    nextPhase = 'complete';
                }
            } else if (currentPhase === 'noReceiptFlow_collectCash') {
                // 🔧 [v1.2.55] 不列印流程：收取現金後完成
                nextPhase = 'complete';
            } else if (currentPhase === 'takeReceipt') {
                // 取走明細表後，注入completeReceipt隊列（由takeReceipt處理，不在這裡轉換）
                return;
            } else if (currentPhase === 'completeReceipt') {
                // 明細表彈窗確認完成，進入完成階段
                nextPhase = 'complete';
            }
            // 存款流程
            else if (currentPhase === 'depositAmount') {
                nextPhase = 'depositBills';
            } else if (currentPhase === 'depositBills') {
                // 🔧 跳過空的 depositConfirm 和 depositProcessing 階段
                // ATM 流程在確認存款後已自動處理完成，直接進入明細表選項
                nextPhase = 'depositReceipt';
            // depositConfirm 和 depositProcessing 階段已被跳過（空隊列）
            // } else if (currentPhase === 'depositConfirm') {
            //     nextPhase = 'depositProcessing';
            // } else if (currentPhase === 'depositProcessing') {
            //     nextPhase = 'depositReceipt';
            } else if (currentPhase === 'depositReceipt') {
                // 🔧 [v1.2.61] 存款流程也需要檢查明細表選項，和提款流程一樣
                const receiptOption = gs.easyModeHints.assignedReceiptOption || 'print';
                ATM.Debug.log('assist', '[ClickMode] transitionPhase - depositReceipt receiptOption:', receiptOption);
                if (receiptOption === 'print') {
                    nextPhase = 'printFlow_takeCard';  // 列印流程
                } else {
                    nextPhase = 'complete';  // 不列印直接完成（存款不需要取現金）
                }
            }
            // 餘額查詢流程
            else if (currentPhase === 'inquiryProcessing') {
                nextPhase = 'inquiryReceipt';
            } else if (currentPhase === 'inquiryReceipt') {
                // 🔧 [v1.2.62] 餘額查詢也需要檢查明細表選項
                const receiptOption = gs.easyModeHints.assignedReceiptOption || 'print';
                ATM.Debug.log('assist', '[ClickMode] transitionPhase - inquiryReceipt receiptOption:', receiptOption);
                if (receiptOption === 'print') {
                    nextPhase = 'printFlow_takeCard';  // 列印流程
                } else {
                    nextPhase = 'complete';  // 不列印直接完成
                }
            }
            // 轉帳流程
            else if (currentPhase === 'transferAmountReminder') {
                // 🔧 [v1.2.38] 金額提醒彈窗後轉到銀行代碼輸入
                nextPhase = 'transferBank';
            } else if (currentPhase === 'transferBank') {
                nextPhase = 'transferAccount';
            } else if (currentPhase === 'transferAccount') {
                nextPhase = 'transferAmount';
            } else if (currentPhase === 'transferAmount') {
                nextPhase = 'transferVerify';
            } else if (currentPhase === 'transferVerify') {
                nextPhase = 'transferConfirm';
            } else if (currentPhase === 'transferConfirm') {
                nextPhase = 'transferProcessing';
            } else if (currentPhase === 'transferProcessing') {
                nextPhase = 'transferReceipt';
            } else if (currentPhase === 'transferReceipt') {
                // 🔧 [v1.2.62] 轉帳也需要檢查明細表選項
                const receiptOption = gs.easyModeHints.assignedReceiptOption || 'print';
                ATM.Debug.log('assist', '[ClickMode] transitionPhase - transferReceipt receiptOption:', receiptOption);
                if (receiptOption === 'print') {
                    nextPhase = 'printFlow_takeCard';  // 列印流程
                } else {
                    nextPhase = 'complete';  // 不列印直接完成
                }
            }
            // 完成流程
            else if (currentPhase === 'complete') {
                ATM.Debug.log('assist', '[ClickMode] 交易完成');
                // 檢查是否還有更多題目
                // 這將在 completeTransaction() 整合時處理
                // 🔧 [v1.2.62] 重置轉換標記
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => { gs.clickModeState.isTransitioning = false; }, 100, 'clickMode');
                return;
            }
            // 🔧 [v1.2.34] 列印流程（修正版）
            else if (currentPhase === 'printFlow_collectCash') {
                // 🔧 [v1.2.34] 取鈔完成後進入取明細表階段
                nextPhase = 'takeReceipt';
            }
            // 🔧 [v1.2.14] 現金彈窗流程
            else if (currentPhase === 'cashModal') {
                // 🔧 [v1.2.42] 現金彈窗完成後，自動觸發明細表列印並執行取明細表
                ATM.Debug.log('assist', '[ClickMode] 現金彈窗完成，自動觸發明細表列印動畫');

                // 觸發明細表列印流程（顯示列印動畫）
                this.handlePrintReceipt();

                // 🔧 [v1.2.42] 自動執行取明細表，不需要用戶點擊
                // 設定階段為取明細表（列印動畫會在1.6秒後完成）
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    gs.clickModeState.currentPhase = 'takeReceipt';
                    gs.clickModeState.actionQueue = [{ type: 'takeReceipt' }];
                    gs.clickModeState.currentStep = 0;
                    ATM.Debug.log('assist', '[ClickMode] 明細表列印完成，自動執行取走明細表');
                    // 直接執行 takeReceipt，不等待用戶點擊
                    this.executeNextAction();
                }, 2000, 'clickMode'); // 等待列印動畫完成(1.6秒) + 按鈕準備(0.4秒)
                // 🔧 [v1.2.62] 重置轉換標記
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => { gs.clickModeState.isTransitioning = false; }, 100, 'clickMode');
                return; // 不執行標準的階段轉換流程
            }

            if (nextPhase) {
                ATM.Debug.log('assist', '[ClickMode] 轉換到階段:', nextPhase);
                gs.clickModeState.currentPhase = nextPhase;

                // 建立操作隊列
                this.buildActionQueue(nextPhase);

                // 🔧 *Processing 階段是純程式等待（waitProcessing），不需要用戶點擊才能啟動
                // 直接自動執行，讓後續的 *Receipt 階段成為唯一需要用戶點擊的步驟
                // 涵蓋：withdrawProcessing / depositProcessing / inquiryProcessing / transferProcessing
                if (nextPhase.endsWith('Processing')) {
                    ATM.Debug.log('assist', `[ClickMode] ${nextPhase} 自動執行 waitProcessing（無需用戶點擊）`);
                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.isExecuting = false;
                        this.executeNextAction();
                    }, 300, 'clickMode');
                    this.TimerManager.setTimeout(() => { gs.clickModeState.isTransitioning = false; }, 100, 'clickMode');
                    return;
                }

                // 🔧 [v1.2.54] 檢查是否已有視覺提示在畫面上（修復 withdrawReceipt 階段卡死問題）
                const existingHintElement = document.querySelector('.easy-hint-pulse');

                if (existingHintElement) {
                    // 視覺提示已經存在，直接觸發解鎖機制
                    ATM.Debug.log('assist', '[ClickMode] 🔍 偵測到視覺提示已存在，直接解鎖');
                    this.enableClickModeWithVisualDelay('ExistingHint');
                } else {
                    // 🔧 [修改] 移除自動解鎖，改為「鎖定並等待視覺觸發」
                    gs.clickModeState.waitingForClick = false; // 強制鎖定
                    ATM.Debug.log('assist', '[ClickMode] 階段轉換完成，等待視覺提示 (Hint/Modal) 出現以解鎖點擊...');

                    // ⚠️ 安全網：如果 1.5 秒後還沒有任何 Hint/Modal 出現（例如 processing 畫面），才強制解鎖
                    // 這防止有些步驟沒有提示導致卡死
                    if (nextPhase.includes('Processing') || nextPhase.includes('takeCash') || nextPhase.includes('Receipt')) {
                        // 🔧 捕捉當前階段，防止舊階段安全網在新階段觸發（快速點擊競態）
                        const safetyPhase = nextPhase;
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            // 🔧 [Phase-aware] 只在仍處於同一階段時才解鎖，防止跨階段誤觸發
                            if (!gs.clickModeState.waitingForClick &&
                                gs.clickModeState.currentPhase === safetyPhase) {
                                ATM.Debug.log('assist', '[ClickMode] ⚠️ 無視覺提示，啟動安全網解鎖（階段:', safetyPhase, '）');
                                gs.clickModeState.waitingForClick = true;
                                // 🔧 [v1.2.60] 設定 clickReadyTime 為過去時間，允許立即點擊（避免安全網解鎖後還要等 600ms）
                                gs.clickModeState.clickReadyTime = Date.now() - 600;
                                gs.clickModeState.isExecuting = false;
                            }
                        }, 1500, 'clickMode');
                    }
                }
            } else {
                ATM.Debug.warn('assist', '[ClickMode] 無法確定下一個階段');
            }

            // 🔧 [v1.2.62] 重置轉換標記，允許下一次轉換
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => { gs.clickModeState.isTransitioning = false; }, 100, 'clickMode');
        },

        // =====================================================
        // 自動化操作函數
        // =====================================================

        // 每步成功煙火動畫（簡單模式 & 輔助點擊模式）
        playStepSuccess(skipSound = false) {
            // 播放 correct02.mp3（若原步驟已播放 correct02，傳入 true 跳過避免重複）
            if (!skipSound) new Audio('../audio/units/correct02.mp3').play().catch(() => {});
            // 煙火動畫（zIndex:10200 高於輔助點擊遮罩 10100，確保不被遮擋）
            if (typeof confetti !== 'function') return;
            confetti({
                particleCount: 40,
                angle: 90,
                spread: 60,
                origin: { x: 0.5, y: 0.25 },
                startVelocity: 30,
                ticks: 60,
                zIndex: 10200,
                colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4CAF50', '#2196F3', '#FF69B4']
            });
        },

        // 🔧 [v1.2.50] 自動點擊金融卡（移除內部延遲）
        autoClickCard() {
            ATM.Debug.log('assist', '[ClickMode] 自動點擊金融卡');
            this.audio.playBeep();
            this.playStepSuccess();
            // 🔧 [v1.2.50] 直接調用，不再延遲（外層已有延遲）
            this.handleCardClick();
        },

        // 🔧 [v1.2.50] 自動按鍵（移除內部延遲，避免雙重延遲）
        autoPressKey(key, retryCount = 0) {
            ATM.Debug.log('assist', '[ClickMode] 自動按鍵:', key);

            try {
                this.audio.playBeep();

                // 如果是確認鍵，先清除提示動畫
                if (key === 'enter') {
                    this.clearATMEasyHint();
                    this.playStepSuccess();
                    ATM.Debug.log('assist', '[ClickMode] 確認鍵按下前已清除提示動畫');
                }

                // 🔧 [v1.2.50] 直接調用，不再延遲（外層已有延遲）
                this.handleKeyPress({ target: { dataset: { key: key.toString() } } });
                ATM.Debug.log('assist', '[ClickMode] 按鍵已通過 handleKeyPress 處理:', key);
            } catch (error) {
                ATM.Debug.error('[ClickMode] handleKeyPress 調用失敗:', error);
            }
        },

        // 自動選擇操作類型（直接調用selectMenuOption，避免點擊事件被攔截）
        autoSelectOperation(operation, retryCount = 0) {
            ATM.Debug.log('assist', '[ClickMode] 自動選擇操作:', operation);

            try {
                // 直接選擇操作（彈窗已在前一步驟關閉）
                this.audio.playBeep();
                this.playStepSuccess();
                ATM.Debug.log('assist', '[ClickMode] 選擇服務項目:', operation);
                // 直接調用 selectMenuOption，避免 click 事件被全局處理器攔截
                this.selectMenuOption(operation);
                ATM.Debug.log('assist', '[ClickMode] 操作已通過 selectMenuOption 處理:', operation);
            } catch (error) {
                ATM.Debug.error('[ClickMode] selectMenuOption 調用失敗:', error);
            }
        },

        // 🔧 自動點擊現金出口（打開金額選擇彈窗）
        autoClickCashDispenser() {
            ATM.Debug.log('assist', '[ClickMode] 自動點擊現金出口');

            try {
                this.audio.playBeep();

                // 🔧 查找真正綁定點擊事件的元素（cash-display-area-container）
                const cashDispenser = document.querySelector('.cash-display-area-container') ||
                                     document.querySelector('.cash-dispenser-area') ||
                                     document.querySelector('.cash-slot-area');

                if (cashDispenser) {
                    ATM.Debug.log('assist', '[ClickMode] 找到現金出口元素，觸發點擊事件');
                    // 🔧 直接調用 showBillSelectionModal，因為點擊事件可能被攔截
                    this.showBillSelectionModal();
                    ATM.Debug.log('assist', '[ClickMode] 已調用 showBillSelectionModal，金額彈窗應已打開');
                } else {
                    ATM.Debug.error('[ClickMode] 找不到現金出口元素');
                }
            } catch (error) {
                ATM.Debug.error('[ClickMode] 點擊現金出口失敗:', error);
            }
        },

        // 🔧 自動點擊金錢圖示（每次點擊一個）
        autoClickMoneyIcon(index, total) {
            ATM.Debug.log('assist', `[ClickMode] 自動點擊金錢圖示 ${index + 1}/${total}`);

            try {
                this.audio.playBeep();

                // 查找所有金錢圖示
                const moneyIcons = document.querySelectorAll('.money-icon-item');

                if (moneyIcons.length === 0) {
                    ATM.Debug.error('[ClickMode] 找不到金錢圖示');
                    return;
                }

                // 點擊第一個未被點擊的金錢圖示
                for (let i = 0; i < moneyIcons.length; i++) {
                    const icon = moneyIcons[i];
                    // 檢查是否已被點擊（通常已點擊的會有特定 class 或樣式）
                    if (!icon.classList.contains('deposited') && !icon.classList.contains('clicked')) {
                        icon.click();
                        ATM.Debug.log('assist', `[ClickMode] ✅ 已點擊第 ${index + 1}/${total} 個金錢圖示`);

                        // 如果是最後一個，等待一下後自動點擊確認按鈕
                        if (index + 1 === total) {
                            // 🔧 [Phase 3] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                const confirmBtn = document.querySelector('.deposit-modal .confirm-btn') ||
                                                  document.querySelector('.bill-selection-modal .confirm-btn') ||
                                                  document.querySelector('.confirm-action[data-action="confirm"]');

                                if (confirmBtn) {
                                    ATM.Debug.log('assist', '[ClickMode] 所有金錢圖示已點擊，自動點擊確認按鈕');
                                    this.audio.playBeep();
                                    confirmBtn.click();
                                } else {
                                    ATM.Debug.error('[ClickMode] 找不到確認按鈕');
                                }
                            }, 800, 'clickMode');
                        }
                        return;
                    }
                }

                ATM.Debug.error('[ClickMode] 所有金錢圖示都已被點擊');
            } catch (error) {
                ATM.Debug.error('[ClickMode] 點擊金錢圖示失敗:', error);
            }
        },

        // 🔧 自動選擇金額（存款模式：點擊所有金錢圖示）
        autoSelectAmount(amount, retryCount = 0) {
            ATM.Debug.log('assist', '[ClickMode] 自動選擇金額:', amount);

            try {
                const gs = this.state.gameState;

                // 🔧 Debug: 檢查當前操作類型
                ATM.Debug.log('assist', '[ClickMode] 當前操作類型:', gs.currentOperation);
                ATM.Debug.log('assist', '[ClickMode] 當前場景:', gs.currentScene);

                // 🔧 檢查是否為存款模式（使用 currentScene 判斷，因為 currentOperation 可能是 undefined）
                const isDeposit = gs.currentOperation === 'deposit' || gs.currentScene === 'deposit-cash';

                if (isDeposit) {
                    // 🔧 存款模式：自動點擊所有金錢圖示（不需要等待用戶點擊）
                    ATM.Debug.log('assist', '[ClickMode] 存款模式偵測成功，準備自動點擊所有金錢圖示');

                    // 🔧 等待彈窗渲染完成（500ms延遲）
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        // 存款模式：點擊所有金錢圖示
                        const moneyIcons = document.querySelectorAll('.money-icon-item');

                        if (moneyIcons.length === 0) {
                            ATM.Debug.error('[ClickMode] 找不到金錢圖示，可能彈窗尚未渲染完成');
                            // 重試一次（最多重試3次）
                            if (retryCount < 3) {
                                ATM.Debug.log('assist', `[ClickMode] 重試查找金錢圖示 (${retryCount + 1}/3)`);
                                // 🔧 [Phase 3] 遷移至 TimerManager
                                this.TimerManager.setTimeout(() => {
                                    this.autoSelectAmount(amount, retryCount + 1);
                                }, 500, 'clickMode');
                            }
                            return;
                        }

                        ATM.Debug.log('assist', `[ClickMode] 找到 ${moneyIcons.length} 個金錢圖示，開始自動點擊全部`);

                        // 🔧 依序點擊每個金錢圖示（間隔300ms）
                        moneyIcons.forEach((icon, index) => {
                            // 🔧 [Phase 3] 遷移至 TimerManager
                            this.TimerManager.setTimeout(() => {
                                this.audio.playBeep();
                                icon.click();
                                ATM.Debug.log('assist', `[ClickMode] 已自動點擊第 ${index + 1}/${moneyIcons.length} 個金錢圖示`);

                                // 🔧 最後一個圖示點擊完成後，等待確認按鈕出現並自動點擊
                                if (index === moneyIcons.length - 1) {
                                    ATM.Debug.log('assist', '[ClickMode] ✅ 所有金錢圖示已自動點擊完成');

                                    // 等待確認按鈕渲染（1秒後自動點擊確認按鈕）
                                    // 🔧 [Phase 3] 遷移至 TimerManager
                                    this.TimerManager.setTimeout(() => {
                                        const confirmBtn = document.querySelector('.deposit-modal .confirm-btn') ||
                                                          document.querySelector('.bill-selection-modal .confirm-btn') ||
                                                          document.querySelector('.confirm-action[data-action="confirm"]');

                                        if (confirmBtn) {
                                            ATM.Debug.log('assist', '[ClickMode] 找到確認按鈕，自動點擊');
                                            this.audio.playBeep();
                                            confirmBtn.click();
                                        } else {
                                            ATM.Debug.error('[ClickMode] 找不到確認按鈕');
                                        }
                                    }, 1000, 'clickMode');
                                }
                            }, index * 300, 'clickMode');
                        });
                    }, 500, 'clickMode');  // 等待彈窗渲染
                } else {
                    // 提款/轉帳模式：直接設定金額
                    this.audio.playBeep();
                    this.playStepSuccess();
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        this.state.gameState.transactionAmount = amount;
                        ATM.Debug.log('assist', '[ClickMode] 金額已設定:', amount);

                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            this.processTransaction(true);
                            ATM.Debug.log('assist', '[ClickMode] 金額處理完成，開始交易處理');
                        }, 800, 'clickMode');
                    }, 300, 'clickMode');
                }
            } catch (error) {
                ATM.Debug.error('[ClickMode] 金額處理失敗:', error);
            }
        },

        // 自動關閉彈窗
        // 優化：自動關閉彈窗 (Option B: 關閉後等待點擊)
        autoCloseModal(buttonId) {
            const gs = this.state.gameState;
            ATM.Debug.log('assist', '[ClickMode] 自動關閉彈窗:', buttonId);
            this.audio.playBeep();
            gs.clickModeState.currentStep++; // 標記此步驟完成

            const modalButton = document.getElementById(buttonId);
            if (modalButton) modalButton.click(); // 觸發視覺點擊

            // 針對任務彈窗
            if (buttonId === 'task-reminder-confirm-btn') {
                // 🔧 [v1.2.39] 檢查彈窗是否已經被關閉（避免重複執行）
                const modal = document.querySelector('.task-reminder-modal');
                if (!modal) {
                    // 彈窗已經被按鈕的 onclick 處理器關閉了，直接設置等待狀態
                    ATM.Debug.log('assist', '[ClickMode] 彈窗已關閉，跳過重複操作');
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                        gs.clickModeState.clickReadyTime = Date.now() - 1000;
                        gs.clickModeState.waitingForClick = true;
                    }, 300, 'clickMode');
                    return;
                }

                // 彈窗還存在，執行正常的關閉流程
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    this.clearATMEasyHint();
                    modal.remove();

                    // 🔧 [修復] 不需要重新渲染選單畫面，避免重複播放語音
                    // 選單畫面已經在彈窗下方，只需確保場景狀態正確
                    this.state.gameState.currentScene = 'menu';

                    // [Option B] 彈窗關閉後，設定等待點擊 (不自動執行)
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                        ATM.Debug.log('assist', '[ClickMode] 彈窗關閉，等待用戶選擇服務');

                        // 🔧 [關鍵修正] 時間回溯 1000ms
                        // 讓系統認為「已經準備好很久了」，這樣您的下一次點擊就會立即生效
                        // 解決「點擊過快」和「需要多點一次」的問題
                        gs.clickModeState.clickReadyTime = Date.now() - 1000;

                        gs.clickModeState.waitingForClick = true;
                    }, 500, 'clickMode');
                }, 200, 'clickMode');
                return;
            }

            // 針對金額彈窗
            if (buttonId === 'amount-reminder-confirm-btn') {
                // 🔧 [v1.2.39] 檢查彈窗是否已經被關閉（避免重複執行）
                const modal = document.querySelector('.amount-reminder-modal');
                if (!modal) {
                    // 彈窗已經被按鈕的 onclick 處理器關閉了，直接設置等待狀態
                    ATM.Debug.log('assist', '[ClickMode] 彈窗已關閉，跳過重複操作');
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                        gs.clickModeState.clickReadyTime = Date.now() - 1000;
                        gs.clickModeState.waitingForClick = true;
                    }, 300, 'clickMode');
                    return;
                }

                // 彈窗還存在，執行正常的關閉流程
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    modal.remove();
                    this.updateScreen('amount-entry', { currentAmount: 0 });
                    this.state.gameState.currentScene = 'amount-entry';

                    const randomAmount = gs.easyModeHints.assignedAmount;
                    // 🔧 [Phase 2d] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => this.showATMEasyHint('select_amount', `.amount-option-btn[data-amount="${randomAmount}"]`), 300, 'hintAnimation');

                    // [Option B] 彈窗關閉後，設定等待點擊 (不自動執行)
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                        ATM.Debug.log('assist', '[ClickMode] 彈窗關閉，等待用戶選擇金額');

                        // 🔧 [關鍵修正] 時間回溯 1000ms
                        // 讓系統認為「已經準備好很久了」，這樣您的下一次點擊就會立即生效
                        // 解決「點擊過快」和「需要多點一次」的問題
                        gs.clickModeState.clickReadyTime = Date.now() - 1000;

                        gs.clickModeState.waitingForClick = true;
                    }, 500, 'clickMode');
                }, 300, 'clickMode');
                return;
            }

            // 針對轉帳流程的 hint-modal（銀行代碼/帳號/金額提示彈窗）
            if (buttonId === 'bank-code-hint-close-btn' ||
                buttonId === 'account-hint-close-btn' ||
                buttonId === 'transfer-amount-hint-close-btn') {
                const modal = document.getElementById('hint-modal-overlay');
                if (!modal) {
                    ATM.Debug.log('assist', '[ClickMode] 彈窗已關閉，跳過重複操作');
                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.isExecuting = false;
                        this.executeNextAction();
                    }, 300, 'clickMode');
                    return;
                }
                modal.remove();
                ATM.Debug.log('assist', `[ClickMode] 已關閉 ${buttonId} 提示彈窗`);
                this.TimerManager.setTimeout(() => {
                    gs.clickModeState.isExecuting = false;
                    this.executeNextAction();
                }, 600, 'clickMode');
                return;
            }

            // 針對轉帳金額彈窗
            if (buttonId === 'transfer-amount-reminder-confirm-btn') {
                // 🔧 [v1.2.39] 檢查彈窗是否已經被關閉（避免重複執行）
                const modal = document.querySelector('.transfer-amount-reminder-modal');
                if (!modal) {
                    // 彈窗已經被按鈕的 onclick 處理器關閉了，直接設置等待狀態
                    ATM.Debug.log('assist', '[ClickMode] 彈窗已關閉，跳過重複操作');
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                        this.executeNextAction();
                    }, 300, 'clickMode');
                    return;
                }

                // 彈窗還存在，執行正常的關閉流程
                modal.remove();
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                    this.executeNextAction();
                }, 600, 'clickMode');
                return;
            }

            // 其他普通彈窗 (如確認提示) 自動下一步
            // 🔧 [Phase 3] 遷移至 TimerManager
            this.TimerManager.setTimeout(() => {
                gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                this.executeNextAction();
            }, 600, 'clickMode');
        },

        // 自動等待處理完成
        autoWaitProcessing() {
            const gs = this.state.gameState;
            ATM.Debug.log('assist', '[ClickMode] 等待交易處理完成');

            // 🔧 [v1.2.5] 增加步驟索引
            gs.clickModeState.currentStep++;
            ATM.Debug.log('assist', '[ClickMode] 步驟已完成，當前:', gs.clickModeState.currentStep, '/', gs.clickModeState.actionQueue.length);

            // 輪詢檢查處理是否完成
            let attempts = 0;
            const maxAttempts = 20;

            const pollProcessing = () => {
                attempts++;

                // 檢查處理是否完成（根據 currentScene 或特定元素）
                const isProcessingComplete = !gs.isProcessing ||
                                            gs.currentScene !== 'processing' ||
                                            document.querySelector('.take-cash-btn') ||
                                            document.querySelector('.receipt-option-btn') ||
                                            document.querySelector('.print-btn');

                if (isProcessingComplete) {
                    ATM.Debug.log('assist', '[ClickMode] 處理完成');

                    // 🔧 [v1.2.6] 1000ms 後自動執行下一步
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                        ATM.Debug.log('assist', '[ClickMode] 處理完成，自動執行下一步');
                        this.executeNextAction();
                    }, 1000, 'clickMode');
                    return;
                } else if (attempts >= maxAttempts) {
                    ATM.Debug.error('[ClickMode] 等待處理超時，強制繼續');

                    // 🔧 [v1.2.6] 超時後也自動執行下一步
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                        this.executeNextAction();
                    }, 1000, 'clickMode');
                    return;
                }
                ATM.TimerManager.setTimeout(pollProcessing, 500, 'autoAction');
            };
            ATM.TimerManager.setTimeout(pollProcessing, 500, 'autoAction');
        },

        // 自動取走現金（v1.2.24 修正版）
        // 優化：自動取走現金（含輪詢）
        autoTakeCash() {
            const gs = this.state.gameState;
            ATM.Debug.log('assist', '[ClickMode] 自動取走現金');

            const isPrintFlow = gs.currentScene === 'collect-cash-print';

            if (isPrintFlow) {
                // 🔧 [v1.2.39] 列印流程：在輔助點擊模式下也自動點擊取鈔按鈕
                ATM.Debug.log('assist', '[ClickMode] 列印流程 - 自動點擊取鈔按鈕（步驟10）');

                // 使用輪詢等待按鈕出現（遞迴 TimerManager）
                let attempts = 0;
                const maxAttempts = 20; // 10秒 (20 * 500ms)

                const poll = () => {
                    attempts++;
                    const cashButton = document.querySelector('.take-cash-btn');

                    if (cashButton && !cashButton.disabled) {
                        ATM.Debug.log('assist', '[ClickMode] 找到取鈔按鈕，執行自動點擊');

                        this.audio.playBeep();
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            // 使用 mousedown 事件（因為按鈕監聯的是 mousedown 而不是 click）
                            const mousedownEvent = new MouseEvent('mousedown', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            cashButton.dispatchEvent(mousedownEvent);
                            ATM.Debug.log('assist', '[ClickMode] 已觸發取鈔按鈕的 mousedown 事件');

                            // 現金彈窗會自動出現，不需要遞增步驟
                            // 因為 printFlow_collectCash 隊列的下一步是 completeCash
                        }, 300, 'clickMode');
                    } else if (attempts >= maxAttempts) {
                        ATM.Debug.error('[ClickMode] 等待取鈔按鈕超時');
                        gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                        // 超時後仍然嘗試繼續
                        gs.clickModeState.waitingForClick = true;
                        gs.clickModeState.clickReadyTime = Date.now();
                    } else {
                        this.TimerManager.setTimeout(poll, 500, 'clickMode');
                    }
                };
                this.TimerManager.setTimeout(poll, 500, 'clickMode');
            } else {
                // 一般流程自動過渡
                gs.clickModeState.currentStep++;
                this.audio.playBeep();
                this.playStepSuccess();
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                    this.executeNextAction();
                }, 500, 'clickMode');
            }
        },

        // 🔧 [v1.2.25] 自動點擊現金彈窗的「取走現金」按鈕（修正版 - 真正自動點擊）
        autoCompleteCash() {
            const gs = this.state.gameState;
            ATM.Debug.log('assist', '[ClickMode] 自動點擊現金彈窗的「取走現金」按鈕');

            // 增加步驟計數
            gs.clickModeState.currentStep++;
            ATM.Debug.log('assist', '[ClickMode] 步驟:', gs.clickModeState.currentStep, '/', gs.clickModeState.actionQueue.length);

            // 使用輪詢等待按鈕出現（因為按鈕在彈窗渲染後才創建，遞迴 TimerManager）
            let attempts = 0;
            const maxAttempts = 20; // 10秒 (20 * 500ms)

            const poll = () => {
                attempts++;
                const cashButton = document.getElementById('complete-cash-btn');

                if (cashButton) {
                    ATM.Debug.log('assist', '[ClickMode] 找到現金彈窗按鈕，執行自動點擊');

                    this.audio.playBeep();
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        cashButton.click();
                        ATM.Debug.log('assist', '[ClickMode] 已點擊現金彈窗按鈕');

                        // 🔧 [v1.2.25] 點擊後等待彈窗關閉動畫和後續流程
                        // completeCashModal() 會在 1000ms 後調用 proceedAfterCashCollection()
                        // proceedAfterCashCollection() 會檢查 printingReceipt 標記並調用 handlePrintReceipt()
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                            // 由於這是列印流程，系統會自動進入明細表列印
                            // 無需調用 transitionPhase()
                            ATM.Debug.log('assist', '[ClickMode] 現金彈窗已關閉，等待系統自動進入列印流程');
                        }, 1500, 'clickMode');
                    }, 300, 'clickMode');
                } else if (attempts >= maxAttempts) {
                    gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                    ATM.Debug.error('[ClickMode] 等待現金彈窗按鈕超時');
                } else {
                    this.TimerManager.setTimeout(poll, 500, 'clickMode');
                }
            };
            this.TimerManager.setTimeout(poll, 500, 'clickMode');
        },

        // 🔧 [v1.2.41] 自動取走明細表（輪詢版本，等待用戶點擊）
        autoTakeReceipt() {
            const gs = this.state.gameState;
            ATM.Debug.log('assist', '[ClickMode] 執行自動取走明細表');

            // 使用輪詢等待按鈕出現（因為按鈕在列印動畫後才創建，遞迴 TimerManager）
            let attempts = 0;
            const maxAttempts = 40; // 20秒 (40 * 500ms)，因為列印動畫需要時間

            const poll = () => {
                // 🔧 防止並行實例重複操作（快速點擊可能啟動兩個 poll 循環）
                if (gs.clickModeState.receiptTaken) {
                    ATM.Debug.log('assist', '[ClickMode] autoTakeReceipt: 偵測到已取走，停止輪詢');
                    return;
                }
                attempts++;
                const receiptButton = document.querySelector('.take-receipt-btn');

                if (receiptButton && receiptButton.offsetParent !== null) {
                    ATM.Debug.log('assist', '[ClickMode] 找到明細表按鈕，執行自動點擊');

                    // 🔧 增加步驟計數（移到這裡，確保只有找到按鈕後才計數）
                    gs.clickModeState.currentStep++;
                    ATM.Debug.log('assist', '[ClickMode] 步驟已完成，當前:', gs.clickModeState.currentStep, '/', gs.clickModeState.actionQueue.length);

                    // 🔧 提前標記，縮短競態視窗（防止 enableClickModeWithVisualDelay 提前解鎖後再次進入）
                    gs.clickModeState.receiptTaken = true;

                    this.audio.playBeep();
                    this.playStepSuccess();
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        // 🔧 [v1.2.48] 使用 mousedown 事件，因為按鈕監聽的是 mousedown 而非 click
                        const mousedownEvent = new MouseEvent('mousedown', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        receiptButton.dispatchEvent(mousedownEvent);
                        ATM.Debug.log('assist', '[ClickMode] 已觸發明細表按鈕 mousedown 事件');

                        // 🔧 [v1.2.45] 點擊後彈窗會同步創建，等待事件綁定完成後注入隊列
                        // 按鈕在 showReceiptModal() 中同步創建，事件在 300ms 後綁定
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                            ATM.Debug.log('assist', '[ClickMode] 明細表彈窗已完成初始化，注入 completeReceipt 隊列');
                            // 注入新的隊列來處理彈窗
                            gs.clickModeState.actionQueue = [{ type: 'completeReceipt' }];
                            gs.clickModeState.currentStep = 0;
                            gs.clickModeState.currentPhase = 'completeReceipt';
                            gs.clickModeState.waitingForClick = true;
                            gs.clickModeState.clickReadyTime = Date.now();
                            ATM.Debug.log('assist', '[ClickMode] 等待用戶點擊執行步驟13（點擊明細表彈窗按鈕）');
                        }, 500, 'clickMode'); // 等待彈窗完全初始化（包含事件綁定的300ms）
                    }, 300, 'clickMode');
                } else if (attempts >= maxAttempts) {
                    gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                    ATM.Debug.error('[ClickMode] 等待明細表按鈕超時');
                    // 超時後仍然設置等待點擊狀態
                    gs.clickModeState.waitingForClick = true;
                    gs.clickModeState.clickReadyTime = Date.now();
                } else {
                    this.TimerManager.setTimeout(poll, 500, 'clickMode');
                }
            };
            this.TimerManager.setTimeout(poll, 500, 'clickMode');
        },

        // 優化：自動選擇明細表（含輪詢）
        autoSelectReceiptOption(option) {
            const gs = this.state.gameState;

            // 🔧 [v1.2.61] 防止重複執行：如果已經有 interval 在運行，直接返回
            if (gs.clickModeState.activeInterval) {
                ATM.Debug.log('assist', '[ClickMode] autoSelectReceiptOption 已在執行中，忽略重複呼叫');
                return;
            }

            // 🔧 [v1.2.20] 如果 option 為 null，從 easyModeHints 中讀取
            if (!option && gs.easyModeHints) {
                option = gs.easyModeHints.assignedReceiptOption || 'print';
                ATM.Debug.log('assist', '[ClickMode] option 為 null，從 easyModeHints 讀取:', option);
            }

            ATM.Debug.log('assist', '[ClickMode] 自動選擇明細表:', option);
            // 🔧 [v1.2.60] 移除過早的 currentStep++，改在成功點擊後執行

            let attempts = 0;
            const maxAttempts = 40; // 🔧 延長超時時間到 8 秒（40 * 200ms）

            // 🔧 標記正在執行（遞迴 TimerManager）
            gs.clickModeState.activeInterval = true;
            const poll = () => {
                attempts++;
                const selector = option === 'print' ? '.print-btn' : '.no-print-btn';
                // 嘗試多種可能
                const btn = document.querySelector(selector) || document.querySelector(`[data-action="${option}"]`);

                if (btn) {
                    gs.clickModeState.activeInterval = null;  // 🔧 [v1.2.60] 清除引用
                    ATM.Debug.log('assist', `[ClickMode] ✅ 找到明細表按鈕（嘗試 ${attempts} 次），執行點擊`);
                    this.audio.playBeep();
                    this.playStepSuccess();
                    btn.click();
                    gs.clickModeState.currentStep++;  // 🔧 [v1.2.60] 移到這裡：成功點擊後才推進步驟
                    ATM.Debug.log('assist', '[ClickMode] 步驟已推進，當前:', gs.clickModeState.currentStep, '/', gs.clickModeState.actionQueue.length);
                    // 點擊後自動執行下一步
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                        this.executeNextAction();
                    }, 1000, 'clickMode');
                } else if (attempts >= maxAttempts) {
                    gs.clickModeState.activeInterval = null;  // 🔧 [v1.2.60] 清除引用
                    ATM.Debug.error(`[ClickMode] ⚠️ 等待明細表按鈕超時（嘗試 ${attempts} 次），強制繼續`);
                    gs.clickModeState.currentStep++;  // 🔧 [v1.2.60] 超時也要推進步驟，避免死鎖
                    gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                    this.executeNextAction();
                } else {
                    if (attempts % 5 === 0) {
                        // 每 5 次嘗試輸出一次進度日誌
                        ATM.Debug.log('assist', `[ClickMode] 等待明細表按鈕... (${attempts}/${maxAttempts})`);
                    }
                    this.TimerManager.setTimeout(poll, 200, 'clickMode');
                }
            };
            this.TimerManager.setTimeout(poll, 200, 'clickMode');
        },

        // 自動取回卡片
        autoTakeCard() {
            const gs = this.state.gameState;
            ATM.Debug.log('assist', '[ClickMode] 自動取回卡片');

            // 🔧 [v1.2.5] 增加步驟索引
            gs.clickModeState.currentStep++;
            ATM.Debug.log('assist', '[ClickMode] 步驟已完成，當前:', gs.clickModeState.currentStep, '/', gs.clickModeState.actionQueue.length);

            // 優先查找「取回卡片」按鈕（非列印流程按鈕已存在），否則找卡片圖片
            const takeCardBtn = document.getElementById('take-card-btn') ||
                               document.querySelector('.take-card-btn') ||
                               document.querySelector('[data-action="take-card"]');
            const cardImage = document.querySelector('#atm-card') ||
                             document.querySelector('.atm-card');

            if (takeCardBtn) {
                // 「取回卡片」按鈕已存在（非列印流程）：直接點擊
                this.audio.playBeep();
                this.playStepSuccess();
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    takeCardBtn.click();
                    ATM.Debug.log('assist', '[ClickMode] 卡片已取回（按鈕點擊）');
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        ATM.Debug.log('assist', '[ClickMode] 取卡完成，自動執行下一步');
                        gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                        this.executeNextAction();
                    }, 2000, 'clickMode');
                }, 300, 'clickMode');
            } else if (cardImage) {
                // 🔧 列印流程：先點擊卡片圖片觸發退出動畫，再輪詢等待「取回卡片」按鈕出現後點擊
                // 按鈕在動畫完成後（約 1800ms）才由 addCardClickListenerForPrint 建立
                ATM.Debug.log('assist', '[ClickMode] 列印流程：點擊卡片圖片觸發動畫，等待「取回卡片」按鈕');
                this.TimerManager.setTimeout(() => {
                    cardImage.click();
                    ATM.Debug.log('assist', '[ClickMode] 卡片圖片已點擊，開始輪詢「取回卡片」按鈕');

                    let btnAttempts = 0;
                    const maxBtnAttempts = 25; // 最多等待 5 秒（25 × 200ms）
                    const pollForTakeCardBtn = () => {
                        btnAttempts++;
                        const btn = document.getElementById('take-card-btn') ||
                                    document.querySelector('.take-card-btn');
                        if (btn && btn.offsetParent !== null) {
                            ATM.Debug.log('assist', `[ClickMode] ✅ 找到「取回卡片」按鈕（嘗試 ${btnAttempts} 次），執行點擊`);
                            this.audio.playBeep();
                            this.playStepSuccess();  // 🔧 煙火移到此處，按鈕出現後才播
                            this.TimerManager.setTimeout(() => {
                                btn.click();
                                ATM.Debug.log('assist', '[ClickMode] 卡片已取回（按鈕點擊）');
                                this.TimerManager.setTimeout(() => {
                                    ATM.Debug.log('assist', '[ClickMode] 取卡完成，自動執行下一步');
                                    gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                                    this.executeNextAction();
                                }, 500, 'clickMode');
                            }, 300, 'clickMode');
                        } else if (btnAttempts >= maxBtnAttempts) {
                            ATM.Debug.log('assist', '[ClickMode] 等待「取回卡片」按鈕超時，直接繼續');
                            this.audio.playBeep();
                            this.playStepSuccess();
                            gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                            this.executeNextAction();
                        } else {
                            this.TimerManager.setTimeout(pollForTakeCardBtn, 200, 'clickMode');
                        }
                    };
                    this.TimerManager.setTimeout(pollForTakeCardBtn, 200, 'clickMode');
                }, 300, 'clickMode');
            } else {
                ATM.Debug.log('assist', '[ClickMode] 找不到卡片元素，可能已自動彈出');
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    ATM.Debug.log('assist', '[ClickMode] 卡片自動彈出完成，自動執行下一步');
                    gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                    this.executeNextAction();
                }, 2000, 'clickMode');
            }
        },

        // 🔧 [v1.2.56] 自動點擊「取回卡片」按鈕（列印流程專用）
        autoClickTakeCardButton() {
            const gs = this.state.gameState;
            ATM.Debug.log('assist', '[ClickMode] 自動點擊取回卡片按鈕');

            // 增加步驟索引
            gs.clickModeState.currentStep++;
            ATM.Debug.log('assist', '[ClickMode] 步驟已完成，當前:', gs.clickModeState.currentStep, '/', gs.clickModeState.actionQueue.length);

            // 輪詢等待按鈕出現（遞迴 TimerManager）
            let attempts = 0;
            const maxAttempts = 40; // 最多等待 8 秒（40 * 200ms）
            const poll = () => {
                attempts++;
                // 查找「取回卡片」按鈕（id: take-card-btn）
                const takeCardBtn = document.getElementById('take-card-btn') ||
                                   document.querySelector('.take-card-btn') ||
                                   document.querySelector('[data-action="take-card"]');

                if (takeCardBtn) {
                    ATM.Debug.log('assist', `[ClickMode] ✅ 找到取回卡片按鈕（嘗試 ${attempts} 次），執行點擊`);
                    this.audio.playBeep();
                    this.playStepSuccess();
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        takeCardBtn.click();
                        ATM.Debug.log('assist', '[ClickMode] 取回卡片按鈕已點擊');

                        // 點擊後，等待後續流程（現金按鈕、彈窗等）
                        // 然後執行下一步或轉換階段
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            ATM.Debug.log('assist', '[ClickMode] 取回卡片按鈕處理完成，自動執行下一步');
                            gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                            this.executeNextAction();
                        }, 1000, 'clickMode');
                    }, 300, 'clickMode');
                } else if (attempts >= maxAttempts) {
                    ATM.Debug.error(`[ClickMode] ⚠️ 等待取回卡片按鈕超時（嘗試 ${attempts} 次）`);
                    // 超時也要繼續，避免卡死
                    gs.clickModeState.isExecuting = false;  // 🔓 解鎖
                    this.executeNextAction();
                } else {
                    if (attempts % 5 === 0) {
                        ATM.Debug.log('assist', `[ClickMode] 等待取回卡片按鈕... (${attempts}/${maxAttempts})`);
                    }
                    this.TimerManager.setTimeout(poll, 200, 'clickMode');
                }
            };
            this.TimerManager.setTimeout(poll, 200, 'clickMode');
        },

        // 自動放入鈔票
        autoInsertBill(billData) {
            // 🔧 提取數值（billData 可能是物件 {value: 1000} 或數字 1000）
            const value = typeof billData === 'object' ? billData.value : billData;
            ATM.Debug.log('assist', '[ClickMode] 自動放入鈔票:', value);

            // 查找鈔票元素（簡單模式視覺選擇）
            const billElement = document.querySelector(`.money-icon-item[data-value="${value}"]`) ||
                               document.querySelector(`.bill-${value}`) ||
                               document.querySelector(`[data-bill="${value}"]`);

            if (billElement) {
                this.audio.playBeep();
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    billElement.click();
                    ATM.Debug.log('assist', '[ClickMode] 鈔票已放入:', value);

                    // 等待鈔票動畫（500ms）
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        const gs = this.state.gameState;
                        gs.clickModeState.waitingForClick = true;
                        // 不再顯示提示（已在開始時顯示過一次）
                    }, 500, 'clickMode');
                }, 300, 'clickMode');
            } else {
                ATM.Debug.error('[ClickMode] 找不到鈔票元素:', value);
                // 重試或跳過
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    const gs = this.state.gameState;
                    gs.clickModeState.waitingForClick = true;
                    // 不再顯示提示（已在開始時顯示過一次）
                }, 500, 'clickMode');
            }
        },

        // 自動確認存款
        autoConfirmDeposit() {
            ATM.Debug.log('assist', '[ClickMode] 自動確認存款');

            const gs = this.state.gameState;
            let attempts = 0;
            const maxAttempts = 120;  // 最多等待 12 秒 (120 * 100ms)，確保涵蓋完整數鈔動畫

            // 🔧 標記正在執行（遞迴 TimerManager）
            gs.clickModeState.activeInterval = true;
            const poll = () => {
                const confirmButton = document.querySelector('.confirm-action[data-action="confirm"]') ||
                                     document.querySelector('.confirm-btn') ||
                                     document.querySelector('[data-action="confirm"]');

                if (confirmButton) {
                    gs.clickModeState.activeInterval = null;  // 🔧 [v1.2.60] 清除引用
                    ATM.Debug.log('assist', `[ClickMode] ✅ 找到確認按鈕（嘗試 ${attempts + 1} 次），執行點擊`);
                    this.audio.playBeep();

                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        confirmButton.click();
                        ATM.Debug.log('assist', '[ClickMode] 存款已確認');
                        gs.clickModeState.currentStep++;  // 🔧 [v1.2.60] 成功點擊後推進步驟
                        ATM.Debug.log('assist', '[ClickMode] 步驟已推進，當前:', gs.clickModeState.currentStep, '/', gs.clickModeState.actionQueue.length);

                        // 等待畫面轉換（1500ms）
                        // 🔧 [Phase 3] 遷移至 TimerManager
                        this.TimerManager.setTimeout(() => {
                            gs.clickModeState.waitingForClick = true;
                            // 不再顯示提示（已在開始時顯示過一次）
                        }, 1500, 'clickMode');
                    }, 300, 'clickMode');
                } else if (attempts >= maxAttempts) {
                    gs.clickModeState.activeInterval = null;  // 🔧 [v1.2.60] 清除引用
                    ATM.Debug.error(`[ClickMode] ⚠️ 等待確認按鈕超時（嘗試 ${maxAttempts} 次），強制繼續`);
                    gs.clickModeState.currentStep++;  // 🔧 [v1.2.60] 超時也要推進步驟，避免死鎖
                    gs.clickModeState.waitingForClick = true;
                } else {
                    if (attempts % 5 === 0 && attempts > 0) {
                        ATM.Debug.log('assist', `[ClickMode] 等待確認按鈕... (${attempts}/${maxAttempts})`);
                    }
                    attempts++;
                    this.TimerManager.setTimeout(poll, 100, 'clickMode');
                }
            };
            this.TimerManager.setTimeout(poll, 100, 'clickMode');
        },

        // 自動確認轉帳資訊（驗證頁面）
        autoConfirmTransferVerify() {
            ATM.Debug.log('assist', '[ClickMode] 自動確認轉帳資訊');

            // 查找確認按鈕
            const confirmButton = document.querySelector('.verification-btn.confirm-btn') ||
                                 document.querySelector('.verify-confirm-btn') ||
                                 document.querySelector('[data-action="verify-confirm"]');

            if (confirmButton) {
                this.audio.playBeep();
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    confirmButton.click();
                    ATM.Debug.log('assist', '[ClickMode] 轉帳資訊已確認');

                    // 等待畫面轉換（1500ms）
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        const gs = this.state.gameState;
                        gs.clickModeState.waitingForClick = true;
                        // 不再顯示提示（已在開始時顯示過一次）
                    }, 1500, 'clickMode');
                }, 300, 'clickMode');
            } else {
                ATM.Debug.error('[ClickMode] 找不到轉帳驗證確認按鈕');
                // 重試或跳過
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    const gs = this.state.gameState;
                    gs.clickModeState.waitingForClick = true;
                    // 不再顯示提示（已在開始時顯示過一次）
                }, 1000, 'clickMode');
            }
        },

        // 自動最終確認轉帳
        autoConfirmTransferFinal() {
            ATM.Debug.log('assist', '[ClickMode] 自動最終確認轉帳');

            // 查找最終確認按鈕
            const confirmButton = document.querySelector('.confirmation-btn.confirm-btn') ||
                                 document.querySelector('.final-confirm-btn') ||
                                 document.querySelector('[data-action="final-confirm"]');

            if (confirmButton) {
                this.audio.playBeep();
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    confirmButton.click();
                    ATM.Debug.log('assist', '[ClickMode] 轉帳已最終確認');

                    // 等待畫面轉換（1500ms）
                    // 🔧 [Phase 3] 遷移至 TimerManager
                    this.TimerManager.setTimeout(() => {
                        const gs = this.state.gameState;
                        gs.clickModeState.waitingForClick = true;
                        // 不再顯示提示（已在開始時顯示過一次）
                    }, 1500, 'clickMode');
                }, 300, 'clickMode');
            } else {
                ATM.Debug.error('[ClickMode] 找不到最終確認按鈕');
                // 重試或跳過
                // 🔧 [Phase 3] 遷移至 TimerManager
                this.TimerManager.setTimeout(() => {
                    const gs = this.state.gameState;
                    gs.clickModeState.waitingForClick = true;
                    // 不再顯示提示（已在開始時顯示過一次）
                }, 1000, 'clickMode');
            }
        },

        // =====================================================
        // 初始化
        // =====================================================
        init() {
            // 🔧 [Phase 5] 清除所有計時器（初始化時清除可能存在的殘留計時器）
            this.TimerManager.clearAll();

            // 🎬 注入全局動畫樣式（避免 JS 內嵌重複定義）
            this.injectGlobalAnimationStyles();

            this.speech.init();
            this.audio.init();

            // 冒險模式：從 URL 參數自動啟動（跳過設定頁）
            const _p = new URLSearchParams(location.search);
            if (_p.get('adv') === '1') {
                this.state.settings.difficulty    = _p.get('diff') || 'hard';
                this.state.settings.sessionType   = 'withdraw';
                this.state.settings.questionCount = 1;
                this.state.settings.accountSetup  = 'customBalance';
                // 冒險模式：帳戶餘額固定 2000 元，確保 100~900 元目標皆可提領
                this.state.settings.customBalance = 2000;
                this._advReturnLevel = parseInt(_p.get('resume') || '3');
                // 在畫面右下角顯示本次提款目標（不影響 A5 原有遊戲邏輯）
                const _advTarget = parseInt(_p.get('target') || '0');
                if (_advTarget > 0) {
                    this._advTargetAmount = _advTarget;
                    this.TimerManager.setTimeout(() => {
                        if (!document.getElementById('adv-task-badge')) {
                            const _badge = document.createElement('div');
                            _badge.id = 'adv-task-badge';
                            _badge.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:9999;background:#d97706;color:#fff;border-radius:14px;padding:10px 18px;font-size:0.95rem;font-weight:800;box-shadow:0 4px 16px rgba(0,0,0,0.25);pointer-events:none;';
                            _badge.textContent = `🗺️ 任務：提領 ${_advTarget} 元`;
                            document.body.appendChild(_badge);
                        }
                    }, 700, 'advTaskBadge');
                }
                this.startLearning();
            } else {
                this.showSettings();
            }

            // 🔧 [v1.2.15] 顯示版本號
            ATM.Debug.log('init', '═══════════════════════════════════════════════════════');
            ATM.Debug.log('init', '🏧 ATM學習系統初始化完成');
            ATM.Debug.log('init', '📦 版本: v1.4.0 (2026-02-22) - 動畫定義整合');
            ATM.Debug.log('init', '═══════════════════════════════════════════════════════');
        }
    };

    // 全域變數設定，讓HTML可以呼叫
    window.ATM = ATM;
    
    // 初始化系統
    ATM.init();
});