// =================================================================
/**
 * @file a3_mcdonalds_order.js
 * @description A3 美式速食自助點餐系統 - 配置驅動版本
 * @unit A3 - 美式速食自助點餐學習
 * @version 1.5.0 - 動畫定義整合至 injectGlobalAnimationStyles()
 * @lastModified 2026.02.22
 */

// 防抖常數
const A3_DEBOUNCE = {
    ITEM_SELECT: 300,      // 餐點選擇
    CONFIRM_PAYMENT: 500,  // 確認付款
    START_GAME: 600        // 開始遊戲
};
// 🚨🚨🚨 【重開機後修改前必讀】🚨🚨🚨
// =====================================================
//
// 📋 修改前強制檢查清單：
// 1. 先閱讀 UNIFIED_DEVELOPMENT_GUIDE.md 統一開發指南
// 2. 遵循配置驅動、HTMLTemplates、跨平台相容性原則
// 3. 禁止任何硬編碼：語音文字、延遲時間、if-else業務邏輯
// 4. 必須使用：ModeConfig、Audio.playSound()、Speech.speak()
// 5. 所有修改必須是100%配置驅動！
//
// =====================================================
// 基於專案標準架構的美式速食點餐系統
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const McDonald = {
        // =====================================================
        // 🐛 Debug 系統 - FLAGS 分類開關
        // =====================================================
        Debug: {
            FLAGS: {
                all: false,         // 全域開關
                init: false,        // 初始化
                state: false,       // 狀態管理
                ui: false,          // UI 渲染
                audio: false,       // 音效
                speech: false,      // 語音
                coin: false,        // 金錢相關
                payment: false,     // 付款驗證
                product: false,     // 餐點選擇
                flow: false,        // 遊戲流程
                assist: false,      // 輔助點擊模式
                hint: false,        // 提示系統
                timer: false,       // 計時器
                event: false,       // 事件處理
                error: true         // 錯誤（預設開啟）
            },

            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[A3-${category}]`, ...args);
                }
            },

            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[A3-${category}]`, ...args);
                }
            },

            error(...args) {
                console.error('[A3-ERROR]', ...args);
            }
        },

        // =====================================================
        // 狀態管理系統（基於專案標準）
        // =====================================================
        state: {
            settings: {
                difficulty: null,            // easy, normal, hard
                questionCount: null,         // 題數設定
                walletAmount: null,          // 錢包金額：custom, 200, 500, 1000
                customWalletAmount: null,    // 自訂金額
                taskType: null,              // assigned(指定餐點), freeChoice(自選)
                language: 'chinese',         // chinese, english
                audioEnabled: true,          // 音效開關
                speechEnabled: true,         // 語音開關
                animationSpeed: 'normal',    // slow, normal, fast
                clickMode: false,            // 輔助點擊模式（單鍵操作）
                productType: 'default',      // default（預設）, magic（魔法商品）
                customItems: { burgers: [], sides: [], drinks: [], desserts: [] },
                // 每項結構：{ id, name, description, price, imageUrl, emoji:'✨', image:null, category, isCustom:true }
            },
            audioUnlocked: false,            // 手機端音頻解鎖狀態
            gameState: {
                currentScene: 'settings',    // settings, welcome, ordering, payment, change, pickup
                currentCategory: 'burgers',  // 當前分類
                currentPage: 0,              // 當前頁碼（從0開始）
                itemsPerPage: 10,            // 每頁顯示10個品項（2列×5行）
                cart: [],                    // 購物車內容
                totalAmount: 0,              // 總金額
                orderNumber: 1,              // 訂單號碼
                isProcessing: false,         // 是否正在處理
                showingModal: false,         // 是否顯示模態視窗
                completedOrders: 0,          // 完成訂單數
                startTime: null,             // 測驗開始時間
                paymentArea: [],             // 付款區的金錢
                paidAmount: 0,               // 已付金額
                walletMoney: [],             // 錢包內的金錢（實際金錢物件）
                assignedItems: [],           // 指定購買的餐點
                purchasedItems: [],          // 已購買的品項
                currentHintIndex: 0,         // 當前提示索引
                welcomePageIndex: 1,         // 歡迎頁面索引（1或2）
                welcomeSpoken: false,        // 是否已播放過歡迎語音
                walletTotal: 0,              // 錢包總金額
                paymentSpeechTimer: null,    // 付款語音防抖動計時器
                changeSpeechTimer: null,     // 找零語音防抖動計時器
                // 普通模式專用狀態
                categoryErrorCounts: {},     // 各類別錯誤次數 { burgers: 0, sides: 0, ... }
                paymentErrorCount: 0,        // 付款錯誤次數
                changeErrorCount: 0,         // 找零錯誤次數
                changeHintShown: false,      // 找零提示是否已顯示
                currentCategoryIndex: 0,     // 當前類別索引（用於彈窗順序）
                showPaymentHints: false,     // 是否顯示付款提示（錯誤3次後）
                changeOptions: [],           // 找零選項（普通模式三選一）
                currentChangeOptions: null,  // 當前找零選項（保持固定）
                // 輔助點擊模式狀態機
                clickModeState: {
                    enabled: false,          // 是否啟用
                    waitingForStart: false,  // 是否正在等待開始
                    waitingForClick: false,  // 是否正在等待點擊
                    currentPhase: null,      // 當前階段：ordering, payment, change, pickup
                    currentStep: 0,          // 當前步驟索引
                    totalSteps: 0,           // 總步驟數
                    actionQueue: [],         // 待執行操作隊列
                    lastClickTime: 0,        // 上次點擊時間（防誤觸）
                    // 🆕 新增（參考 A5）
                    clickReadyTime: 0,           // 點擊準備就緒時間（用於防快速點擊）
                    isExecuting: false,          // 是否正在執行操作（防止競態條件）
                    _visualDelayTimer: null,     // 視覺延遲計時器
                    hasShownStartPrompt: false   // 🔧 修復：是否已顯示過開始提示（每輪只顯示一次）
                },

                // 🆕 防重複機制
                lastWalletAmount: 0,         // 記錄上一輪的錢包金額
                lastAssignedItems: null,     // 記錄上一輪的指定餐點組合 { items: [], selectedNames: [] }

                // 🆕 防止重複拖曳操作
                isReturningMoney: false,     // 防止重複退回金錢
                isUnfillingTarget: false,    // 防止重複重置目標
            },
            quiz: {
                currentQuestion: 0,
                score: 0,
                questions: [],
                startTime: null,
                attempts: 0
            }
        },

        // =====================================================
        // 場景配置系統（基於 A1 架構）
        // =====================================================
        SceneConfig: {
            'settings': {
                onEnter: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 進入 settings 場景');
                    context.showSettings();
                },
                onExit: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 離開 settings 場景');
                }
            },
            'welcome': {
                onEnter: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 進入 welcome 場景');
                    context.state.gameState.welcomePageIndex = 1;
                    context.showWelcomePage1();
                },
                onExit: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 離開 welcome 場景');
                }
            },
            'ordering': {
                onEnter: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 進入 ordering 場景');
                    context.renderOrderingUI();

                },
                onExit: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 離開 ordering 場景');
                    // 🔧 解綁事件監聯器，防止重複綁定
                    context.unbindTouchEvents();
                    // 🔧 [滾動修復] 恢復body樣式，允許其他場景滾動
                    document.body.style.overscroll = '';
                    document.body.style.overscrollBehavior = '';
                }
            },
            'payment': {
                onEnter: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 進入 payment 場景');
                },
                onExit: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 離開 payment 場景');
                }
            },
            'calculation': {
                onEnter: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 進入 calculation 場景');
                    context.renderCalculationSceneUI();
                },
                onExit: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 離開 calculation 場景');
                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }
                }
            },
            'change': {
                onEnter: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 進入 change 場景');
                },
                onExit: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 離開 change 場景');
                }
            },
            'pickup': {
                onEnter: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 進入 pickup 場景');
                },
                onExit: (context) => {
                    McDonald.Debug.log('flow', '🎬 [場景管理] 離開 pickup 場景');
                }
            }
        },

        // =====================================================
        // 場景管理器（統一切換系統）
        // =====================================================
        SceneManager: {
            switchScene(newScene, context) {
                McDonald.Debug.log('flow', `🎬 [場景管理] 切換場景: ${context.state.gameState.currentScene} → ${newScene}`);

                const currentScene = context.state.gameState.currentScene;
                const currentConfig = context.SceneConfig[currentScene];
                const newConfig = context.SceneConfig[newScene];

                // 1. 執行當前場景的 onExit 清理
                if (currentConfig && currentConfig.onExit) {
                    context.Debug.log('flow', `🧹 [場景管理] 清理場景: ${currentScene}`);
                    currentConfig.onExit.call(context, context);
                }

                // 2. 更新場景狀態
                context.state.gameState.currentScene = newScene;

                // 3. 執行新場景的 onEnter 設置
                if (newConfig && newConfig.onEnter) {
                    context.Debug.log('flow', `🚀 [場景管理] 初始化場景: ${newScene}`);
                    newConfig.onEnter.call(context, context);
                }
            }
        },

        // =====================================================
        // 🔧 [Phase 1] 計時器統一管理（記憶體管理）
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
                this.timers.forEach(timer => window.clearTimeout(timer.timerId));
                this.timers.clear();
                McDonald.Debug.log('timer', '🧹 [A3-McDonald] TimerManager.clearAll() 已清除所有計時器');
            },

            clearByCategory(category) {
                this.timers.forEach((timer, id) => {
                    if (timer.category === category) {
                        window.clearTimeout(timer.timerId);
                        this.timers.delete(id);
                    }
                });
                McDonald.Debug.log('timer', `🧹 [A3-McDonald] TimerManager.clearByCategory('${category}') 已清除`);
            }
        },

        // =====================================================
        // 🔧 [Phase 1] 事件監聽器統一管理（記憶體管理）
        // =====================================================
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
                McDonald.Debug.log('event', '🧹 [A3-McDonald] EventManager.removeAll() 已移除所有監聽器');
            },

            removeByCategory(category) {
                this.listeners.forEach((l, i) => {
                    if (l?.category === category && l.element) {
                        try { l.element.removeEventListener(l.type, l.handler, l.options); } catch(e) {}
                        this.listeners[i] = null;
                    }
                });
                McDonald.Debug.log('event', `🧹 [A3-McDonald] EventManager.removeByCategory('${category}') 已清除`);
            }
        },

        // =====================================================
        // 模式配置系統（配置驅動）
        // =====================================================
        ModeConfig: {
            easy: {
                name: '簡單模式',
                description: '基礎點餐流程，適合初學者',
                features: {
                    showPrices: true,
                    allowMultipleItems: true,
                    counterPayment: true,
                    changeVerification: true,
                    helpHints: true
                }
            },
            normal: {
                name: '普通模式',
                description: '標準點餐流程',
                features: {
                    showPrices: true,
                    allowMultipleItems: true,
                    counterPayment: true,
                    changeVerification: false,
                    helpHints: false
                }
            },
            hard: {
                name: '困難模式',
                description: '進階點餐挑戰',
                features: {
                    showPrices: true,
                    allowMultipleItems: true,
                    counterPayment: true,
                    changeVerification: false,
                    helpHints: false,
                    timeLimit: true
                }
            }
        },

        // =====================================================
        // 配置驅動系統 - 菜單配置
        // =====================================================
        menuConfig: {
            categories: [
                { id: 'burgers', name: '🍔 經典漢堡', keyShortcut: '1' },
                { id: 'sides', name: '🍟 美味配餐', keyShortcut: '2' },
                { id: 'drinks', name: '🥤 清涼飲品', keyShortcut: '3' },
                { id: 'desserts', name: '🍦 繽紛甜點', keyShortcut: '4' }
            ],
            items: {
                burgers: [
                    {
                        id: 'big-mac',
                        name: '雙層獨家醬料牛肉堡',
                        description: '雙層純牛肉，搭配秘製大麥克醬、生菜、洋蔥、酸黃瓜、吉事，多層次的美味。',
                        price: 75,
                        emoji: '🍔',
                        image: '../images/a3/icon-a3-double-special-sauce-beef-burger.png',
                        popular: true
                    },
                    {
                        id: 'mc-double',
                        name: '雙層起司牛肉堡',
                        description: '兩片純牛肉，搭配融化的吉事、洋蔥、酸黃瓜、番茄醬和芥末醬。',
                        price: 55,
                        emoji: '🍔',
                        image: '../images/a3/icon-a3-mc-double.png'
                    },
                    {
                        id: 'mc-chicken',
                        name: '經典香雞堡',
                        description: '鮮嫩多汁的雞腿排，搭配爽脆的生菜和獨特的麥香醬。',
                        price: 65,
                        emoji: '🐔',
                        image: '../images/a3/icon-a3-mc-chicken.png'
                    },
                    {
                        id: 'filet-o-fish',
                        name: '黃金鱈魚堡',
                        description: '來自純淨海域的鱈魚，外酥內嫩，搭配濃郁的塔塔醬。',
                        price: 52,
                        emoji: '🐟',
                        image: '../images/a3/icon-a3-filet-o-fish.png'
                    },
                    {
                        id: 'quarter-pounder',
                        name: '厚切牛肉堡',
                        description: '四分之一磅的新鮮牛肉，搭配洋蔥、番茄醬、芥末醬和酸黃瓜。',
                        price: 68,
                        emoji: '🍔',
                        image: '../images/a3/icon-a3-quarter-pounder.png'
                    },
                    {
                        id: 'deluxe-chicken',
                        name: '勁辣雞腿堡',
                        description: '香辣多汁的雞腿排，搭配新鮮生菜和特製辣醬。',
                        price: 70,
                        emoji: '🌶️',
                        image: '../images/a3/icon-a3-deluxe-chicken.png'
                    },
                    {
                        id: 'cheese-burger',
                        name: '起司牛肉堡',
                        description: '經典牛肉漢堡，加上融化的吉士片，簡單美味。',
                        price: 45,
                        emoji: '🍔',
                        image: '../images/a3/icon-a3-cheese-burger.png'
                    },
                    {
                        id: 'bacon-burger',
                        name: '培根牛肉堡',
                        description: '香脆培根搭配多汁牛肉，層次豐富的美味組合。',
                        price: 80,
                        emoji: '🥓',
                        image: '../images/a3/icon-a3-bacon-burger.png'
                    },
                    {
                        id: 'double-deluxe',
                        name: '雙層豪華牛肉堡',
                        description: '雙層厚實牛肉，搭配培根、起司和特製醬料，豪華享受。',
                        price: 95,
                        emoji: '🍔',
                        image: '../images/a3/icon-a3-double-deluxe.png'
                    },
                    {
                        id: 'mushroom-burger',
                        name: '蘑菇牛肉堡',
                        description: '新鮮蘑菇搭配多汁牛肉，健康美味的完美組合。',
                        price: 72,
                        emoji: '🍄',
                        image: '../images/a3/icon-a3-mushroom-burger.png'
                    },
                    {
                        id: 'teriyaki-burger',
                        name: '照燒雞腿堡',
                        description: '香甜照燒醬汁搭配嫩雞腿排，日式風味獨特。',
                        price: 68,
                        emoji: '🍔',
                        image: '../images/a3/icon-a3-teriyaki-burger.png'
                    },
                    {
                        id: 'veggie-burger',
                        name: '素食蔬菜堡',
                        description: '多種新鮮蔬菜搭配特製素肉排，健康素食選擇。',
                        price: 60,
                        emoji: '🥗',
                        image: '../images/a3/icon-a3-veggie-burger.png'
                    },
                    {
                        id: 'bbq-burger',
                        name: 'BBQ烤肉堡',
                        description: '煙燻BBQ醬搭配厚實牛肉排，濃郁烤肉香氣。',
                        price: 78,
                        emoji: '🍖',
                        image: '../images/a3/icon-a3-bbq-burger.png'
                    },
                    {
                        id: 'egg-burger',
                        name: '太陽蛋牛肉堡',
                        description: '煎蛋搭配牛肉排，營養豐富的早午餐選擇。',
                        price: 75,
                        emoji: '🍳',
                        image: '../images/a3/icon-a3-egg-burger.png'
                    },
                    {
                        id: 'chicken-deluxe',
                        name: '豪華脆雞堡',
                        description: '酥脆炸雞搭配生菜、番茄和特製美乃滋醬。',
                        price: 70,
                        emoji: '🐓',
                        image: '../images/a3/icon-a3-chicken-deluxe.png'
                    },
                    {
                        id: 'hawaiian-burger',
                        name: '夏威夷鳳梨堡',
                        description: '烤鳳梨搭配火腿和牛肉，熱帶風情滿滿。',
                        price: 82,
                        emoji: '🍍',
                        image: '../images/a3/icon-a3-hawaiian-burger.png'
                    },
                    {
                        id: 'jalapeno-burger',
                        name: '墨西哥辣椒堡',
                        description: '墨西哥辣椒搭配牛肉和起司，辛辣刺激的美味。',
                        price: 76,
                        emoji: '🌮',
                        image: '../images/a3/icon-a3-jalapeno-burger.png'
                    },
                    {
                        id: 'triple-cheese',
                        name: '三重起司堡',
                        description: '三種不同起司融合，濃郁奶香包裹多汁牛肉。',
                        price: 85,
                        emoji: '🧀',
                        image: '../images/a3/icon-a3-triple-cheese.png'
                    },
                    {
                        id: 'avocado-burger',
                        name: '酪梨牛肉堡',
                        description: '新鮮酪梨搭配牛肉排，健康美味的時尚選擇。',
                        price: 88,
                        emoji: '🥑',
                        image: '../images/a3/icon-a3-avocado-burger.png'
                    },
                    {
                        id: 'crispy-onion-burger',
                        name: '脆洋蔥牛肉堡',
                        description: '酥脆洋蔥圈搭配牛肉，口感豐富層次分明。',
                        price: 74,
                        emoji: '🧅',
                        image: '../images/a3/icon-a3-crispy-onion-burger.png'
                    }
                ],
                sides: [
                    {
                        id: 'french-fries-large',
                        name: '黃金薯條 (大)',
                        description: '金黃酥脆的馬鈴薯條，外酥內軟，是美式速食的經典配餐。',
                        price: 35,
                        emoji: '🍟',
                        image: '../images/a3/icon-a3-french-fries-large.png'
                    },
                    {
                        id: 'french-fries-medium',
                        name: '黃金薯條 (中)',
                        description: '適中分量的薯條，完美搭配主餐。',
                        price: 30,
                        emoji: '🍟',
                        image: '../images/a3/icon-a3-french-fries-medium.png'
                    },
                    {
                        id: 'mcnuggets-6',
                        name: '黃金雞塊 (6塊)',
                        description: '鮮嫩雞胸肉製成，外酥內嫩，搭配多種醬料享用。',
                        price: 45,
                        emoji: '🍗',
                        image: '../images/a3/icon-a3-mcnuggets-6.png'
                    },
                    {
                        id: 'hash-brown',
                        name: '黃金薯餅 (1片)',
                        description: '酥脆的馬鈴薯餅，早餐時光的最佳選擇。',
                        price: 25,
                        emoji: '🥔',
                        image: '../images/a3/icon-a3-hash-brown.png'
                    },
                    {
                        id: 'mcnuggets-10',
                        name: '黃金雞塊 (10塊)',
                        description: '10塊鮮嫩雞塊，超值分量，適合分享。',
                        price: 70,
                        emoji: '🍗',
                        image: '../images/a3/icon-a3-mcnuggets-10.png'
                    },
                    {
                        id: 'onion-rings',
                        name: '洋蔥圈',
                        description: '香脆洋蔥圈，外酥內軟，獨特風味。',
                        price: 40,
                        emoji: '🧅',
                        image: '../images/a3/icon-a3-onion-rings.png'
                    },
                    {
                        id: 'corn-cup',
                        name: '奶油起司玉米杯',
                        description: '香甜玉米粒搭配奶油起司，濃郁美味的配餐選擇。',
                        price: 28,
                        emoji: '🌽',
                        image: '../images/a3/icon-a3-corn-cup.png'
                    },
                    {
                        id: 'cheese-sticks',
                        name: '起司條',
                        description: '酥脆外皮包裹濃郁起司，拉絲美味。',
                        price: 50,
                        emoji: '🧀',
                        image: '../images/a3/icon-a3-cheese-sticks.png'
                    },
                    {
                        id: 'chicken-wings',
                        name: '炸雞翅 (6隻)',
                        description: '香酥多汁的炸雞翅，搭配特製沾醬享用。',
                        price: 60,
                        emoji: '🍗',
                        image: '../images/a3/icon-a3-chicken-wings.png'
                    },
                    {
                        id: 'mozzarella-sticks',
                        name: '義式莫札瑞拉起司條',
                        description: '義式莫札瑞拉起司，外酥內軟，起司香濃。',
                        price: 55,
                        emoji: '🧀',
                        image: '../images/a3/icon-a3-mozzarella-sticks.png'
                    },
                    {
                        id: 'sweet-potato-fries',
                        name: '地瓜薯條',
                        description: '香甜地瓜製成的薯條，健康又美味。',
                        price: 38,
                        emoji: '🍠',
                        image: '../images/a3/icon-a3-sweet-potato-fries.png'
                    },
                    {
                        id: 'popcorn-chicken',
                        name: '爆米花雞球',
                        description: '一口一個的酥脆雞塊，適合分享。',
                        price: 48,
                        emoji: '🍗',
                        image: '../images/a3/icon-a3-popcorn-chicken.png'
                    },
                    {
                        id: 'french-fries-small',
                        name: '黃金薯條 (小)',
                        description: '小份量薯條，輕食好選擇。',
                        price: 25,
                        emoji: '🍟',
                        image: '../images/a3/icon-a3-french-fries-small.png'
                    },
                    {
                        id: 'salad',
                        name: '田園沙拉',
                        description: '新鮮蔬菜沙拉，清爽健康。',
                        price: 42,
                        emoji: '🥗',
                        image: '../images/a3/icon-a3-salad.png'
                    },
                    {
                        id: 'coleslaw',
                        name: '馬鈴薯沙拉',
                        description: '綿密馬鈴薯搭配美乃滋，清爽開胃。',
                        price: 30,
                        emoji: '🥬',
                        image: '../images/a3/icon-a3-coleslaw.png'
                    },
                    {
                        id: 'hash-browns-2',
                        name: '黃金薯餅 (2片)',
                        description: '雙片薯餅組合，超值享受。',
                        price: 45,
                        emoji: '🥔',
                        image: '../images/a3/icon-a3-hash-browns-2.png'
                    },
                    {
                        id: 'curly-fries',
                        name: '捲捲薯條',
                        description: '螺旋造型的酥脆薯條，獨特口感。',
                        price: 42,
                        emoji: '🍟',
                        image: '../images/a3/icon-a3-curly-fries.png'
                    },
                    {
                        id: 'chicken-strips',
                        name: '香酥雞柳條',
                        description: '鮮嫩雞柳裹上酥脆外皮，美味可口。',
                        price: 55,
                        emoji: '🍗',
                        image: '../images/a3/icon-a3-chicken-strips.png'
                    },
                    {
                        id: 'garlic-bread',
                        name: '蒜香麵包',
                        description: '香濃蒜味麵包，外酥內軟。',
                        price: 32,
                        emoji: '🍞',
                        image: '../images/a3/icon-a3-garlic-bread.png'
                    },
                    {
                        id: 'potato-wedges',
                        name: '帶皮楔形薯塊',
                        description: '厚切馬鈴薯塊，外酥內鬆軟。',
                        price: 38,
                        emoji: '🥔',
                        image: '../images/a3/icon-a3-potato-wedges.png'
                    }
                ],
                drinks: [
                    {
                        id: 'coke-large',
                        name: '經典可樂 (大杯)',
                        description: '經典的可口可樂，清爽解膩。',
                        price: 30,
                        emoji: '🥤',
                        image: '../images/a3/icon-a3-coke-large.png'
                    },
                    {
                        id: 'coke-medium',
                        name: '經典可樂 (中杯)',
                        description: '適中分量的可口可樂。',
                        price: 25,
                        emoji: '🥤',
                        image: '../images/a3/icon-a3-coke-medium.png'
                    },
                    {
                        id: 'orange-juice',
                        name: '鮮榨柳橙汁',
                        description: '新鮮柳橙榨取，富含維他命C。',
                        price: 35,
                        emoji: '🍊',
                        image: '../images/a3/icon-a3-orange-juice.png'
                    },
                    {
                        id: 'milk',
                        name: '全脂鮮乳',
                        description: '純淨鮮奶，營養豐富。',
                        price: 20,
                        emoji: '🥛',
                        image: '../images/a3/icon-a3-milk.png'
                    },
                    {
                        id: 'sprite-large',
                        name: '檸檬萊姆汽水 (大杯)',
                        description: '清涼檸檬汽水，清新爽口。',
                        price: 30,
                        emoji: '🥤',
                        image: '../images/a3/icon-a3-sprite-large.png'
                    },
                    {
                        id: 'iced-tea',
                        name: '冰紅茶',
                        description: '香醇紅茶，加冰更清涼。',
                        price: 28,
                        emoji: '🧋',
                        image: '../images/a3/icon-a3-iced-tea.png'
                    },
                    {
                        id: 'apple-juice',
                        name: '100%蘋果汁',
                        description: '香甜蘋果汁，天然果香。',
                        price: 32,
                        emoji: '🍎',
                        image: '../images/a3/icon-a3-apple-juice.png'
                    },
                    {
                        id: 'coffee',
                        name: '熱美式咖啡',
                        description: '香濃美式咖啡，提神醒腦。',
                        price: 38,
                        emoji: '☕',
                        image: '../images/a3/icon-a3-coffee.png'
                    },
                    {
                        id: 'latte',
                        name: '熱拿鐵',
                        description: '濃郁咖啡搭配綿密奶泡，香醇順口。',
                        price: 45,
                        emoji: '☕',
                        image: '../images/a3/icon-a3-latte.png'
                    },
                    {
                        id: 'cappuccino',
                        name: '熱卡布奇諾',
                        description: '經典義式咖啡，奶泡綿密細緻。',
                        price: 48,
                        emoji: '☕',
                        image: '../images/a3/icon-a3-cappuccino.png'
                    },
                    {
                        id: 'hot-chocolate',
                        name: '熱可可',
                        description: '濃郁巧克力飲品，溫暖甜蜜。',
                        price: 40,
                        emoji: '🍫',
                        image: '../images/a3/icon-a3-hot-chocolate.png'
                    },
                    {
                        id: 'lemonade',
                        name: '檸檬氣泡飲',
                        description: '清新檸檬汽水，酸甜解渴。',
                        price: 30,
                        emoji: '🍋',
                        image: '../images/a3/icon-a3-lemonade.png'
                    },
                    {
                        id: 'green-tea',
                        name: '無糖冰綠茶',
                        description: '清香綠茶，健康清爽。',
                        price: 25,
                        emoji: '🍵',
                        image: '../images/a3/icon-a3-green-tea.png'
                    },
                    {
                        id: 'smoothie',
                        name: '綜合水果冰沙',
                        description: '多種新鮮水果打成的冰沙，清涼消暑。',
                        price: 50,
                        emoji: '🥤',
                        image: '../images/a3/icon-a3-smoothie.png'
                    },
                    {
                        id: 'mineral-water',
                        name: '瓶裝礦泉水',
                        description: '純淨礦泉水，健康解渴。',
                        price: 15,
                        emoji: '💧',
                        image: '../images/a3/icon-a3-mineral-water.png'
                    },
                    {
                        id: 'energy-drink',
                        name: '百香果汁',
                        description: '酸甜百香果汁，熱帶風味清爽解渴。',
                        price: 42,
                        emoji: '🥝',
                        image: '../images/a3/icon-a3-energy-drink.png'
                    },
                    {
                        id: 'bubble-tea',
                        name: '珍珠奶茶',
                        description: '香濃奶茶搭配Q彈珍珠，經典台灣味。',
                        price: 55,
                        emoji: '🧋',
                        image: '../images/a3/icon-a3-bubble-tea.png'
                    },
                    {
                        id: 'mango-juice',
                        name: '鮮甜芒果汁',
                        description: '香甜芒果打成的果汁，熱帶風味。',
                        price: 40,
                        emoji: '🥭',
                        image: '../images/a3/icon-a3-mango-juice.png'
                    },
                    {
                        id: 'grape-juice',
                        name: '葡萄汁',
                        description: '濃郁葡萄汁，酸甜可口。',
                        price: 35,
                        emoji: '🍇',
                        image: '../images/a3/icon-a3-grape-juice.png'
                    },
                    {
                        id: 'mocha',
                        name: '熱摩卡咖啡',
                        description: '咖啡與巧克力的完美結合，香醇濃郁。',
                        price: 52,
                        emoji: '☕',
                        image: '../images/a3/icon-a3-mocha.png'
                    }
                ],
                desserts: [
                    {
                        id: 'apple-pie',
                        name: '酥皮蘋果派',
                        description: '酥脆外皮包裹著香甜蘋果餡，溫熱享用最美味。',
                        price: 25,
                        emoji: '🥧',
                        image: '../images/a3/icon-a3-apple-pie.png'
                    },
                    {
                        id: 'ice-cream-cone',
                        name: '原味蛋捲冰淇淋',
                        description: '香草口味的軟式冰淇淋，清爽解膩。',
                        price: 15,
                        emoji: '🍦',
                        image: '../images/a3/icon-a3-ice-cream-cone.png'
                    },
                    {
                        id: 'cookies',
                        name: '巧克力脆餅',
                        description: '香濃巧克力餅乾，甜蜜滋味。',
                        price: 20,
                        emoji: '🍪',
                        image: '../images/a3/icon-a3-cookies.png'
                    },
                    {
                        id: 'shake-chocolate',
                        name: '濃郁巧克力奶昔',
                        description: '濃郁巧克力奶昔，香甜順滑。',
                        price: 40,
                        emoji: '🥤',
                        image: '../images/a3/icon-a3-shake-chocolate.png'
                    },
                    {
                        id: 'shake-strawberry',
                        name: '草莓奶昔',
                        description: '新鮮草莓風味奶昔，香甜滑順。',
                        price: 40,
                        emoji: '🍓',
                        image: '../images/a3/icon-a3-shake-strawberry.png'
                    },
                    {
                        id: 'sundae',
                        name: '巧克力聖代',
                        description: '香草冰淇淋搭配巧克力醬或焦糖醬。',
                        price: 30,
                        emoji: '🍨',
                        image: '../images/a3/icon-a3-sundae.png'
                    },
                    {
                        id: 'muffin',
                        name: '藍莓馬芬',
                        description: '鬆軟馬芬蛋糕，藍莓香甜多汁。',
                        price: 35,
                        emoji: '🧁',
                        image: '../images/a3/icon-a3-muffin.png'
                    },
                    {
                        id: 'donut',
                        name: '經典甜甜圈',
                        description: '經典甜甜圈，香甜鬆軟。',
                        price: 22,
                        emoji: '🍩',
                        image: '../images/a3/icon-a3-donut.png'
                    },
                    {
                        id: 'brownie',
                        name: '濃情布朗尼',
                        description: '濃郁巧克力布朗尼，香濃美味。',
                        price: 38,
                        emoji: '🍫',
                        image: '../images/a3/icon-a3-brownie.png'
                    },
                    {
                        id: 'cheesecake',
                        name: '紐約起司蛋糕',
                        description: '經典起司蛋糕，綿密香濃。',
                        price: 55,
                        emoji: '🍰',
                        image: '../images/a3/icon-a3-cheesecake.png'
                    },
                    {
                        id: 'tiramisu',
                        name: '義式提拉米蘇',
                        description: '義式經典甜點，咖啡香濃郁。',
                        price: 60,
                        emoji: '🍰',
                        image: '../images/a3/icon-a3-tiramisu.png'
                    },
                    {
                        id: 'waffle',
                        name: '比利時鬆餅',
                        description: '香酥鬆餅搭配糖漿和奶油，甜蜜享受。',
                        price: 45,
                        emoji: '🧇',
                        image: '../images/a3/icon-a3-waffle.png'
                    },
                    {
                        id: 'crepe',
                        name: '法式可麗餅',
                        description: '薄脆可麗餅搭配新鮮水果和巧克力醬。',
                        price: 48,
                        emoji: '🥞',
                        image: '../images/a3/icon-a3-crepe.png'
                    },
                    {
                        id: 'panna-cotta',
                        name: '香草奶酪',
                        description: '滑順奶酪搭配莓果醬，清爽甜點。',
                        price: 42,
                        emoji: '🍮',
                        image: '../images/a3/icon-a3-panna-cotta.png'
                    },
                    {
                        id: 'macaron',
                        name: '法式馬卡龍 (3入)',
                        description: '法式馬卡龍，多種口味任選。',
                        price: 50,
                        emoji: '🍬',
                        image: '../images/a3/icon-a3-macaron.png'
                    },
                    {
                        id: 'churros',
                        name: '西班牙吉拿棒',
                        description: '香脆吉拿棒搭配巧克力醬，經典西班牙點心。',
                        price: 35,
                        emoji: '🥖',
                        image: '../images/a3/icon-a3-churros.png'
                    },
                    {
                        id: 'fruit-tart',
                        name: '綜合水果塔',
                        description: '酥脆塔皮搭配新鮮水果和卡士達醬。',
                        price: 58,
                        emoji: '🥧',
                        image: '../images/a3/icon-a3-fruit-tart.png'
                    },
                    {
                        id: 'ice-cream-sundae',
                        name: '香蕉船冰淇淋',
                        description: '香蕉搭配冰淇淋和堅果，經典美式甜點。',
                        price: 65,
                        emoji: '🍌',
                        image: '../images/a3/icon-a3-ice-cream-sundae.png'
                    },
                    {
                        id: 'cinnamon-roll',
                        name: '香甜肉桂捲',
                        description: '香甜肉桂捲搭配糖霜，溫暖甜蜜。',
                        price: 38,
                        emoji: '🥐',
                        image: '../images/a3/icon-a3-cinnamon-roll.png'
                    },
                    {
                        id: 'pudding',
                        name: '焦糖布丁',
                        description: '滑嫩焦糖布丁，香甜順口。',
                        price: 35,
                        emoji: '🍮',
                        image: '../images/a3/icon-a3-pudding.png'
                    }
                ]
            }
        },

        // =====================================================
        // 金錢資料系統
        // =====================================================
        moneyItems: [
            { value: 1, name: '1元', images: { front: '../images/money/1_yuan_front.png', back: '../images/money/1_yuan_back.png' } },
            { value: 5, name: '5元', images: { front: '../images/money/5_yuan_front.png', back: '../images/money/5_yuan_back.png' } },
            { value: 10, name: '10元', images: { front: '../images/money/10_yuan_front.png', back: '../images/money/10_yuan_back.png' } },
            { value: 50, name: '50元', images: { front: '../images/money/50_yuan_front.png', back: '../images/money/50_yuan_back.png' } },
            { value: 100, name: '100元', images: { front: '../images/money/100_yuan_front.png', back: '../images/money/100_yuan_back.png' } },
            { value: 500, name: '500元', images: { front: '../images/money/500_yuan_front.png', back: '../images/money/500_yuan_back.png' } },
            { value: 1000, name: '1000元', images: { front: '../images/money/1000_yuan_front.png', back: '../images/money/1000_yuan_back.png' } }
        ],

        // =====================================================
        // 配置驅動系統 - 語音模板配置
        // =====================================================
        speechTemplates: {
            easy: {
                welcomePage1: '歡迎來到美式速食',
                welcome: '歡迎來到美式速食，請依提示選擇指定的餐點',
                instructions: '請依提示選擇指定的餐點',
                welcomeFreeChoice: '自由選擇你喜歡的餐點',
                overBudget: '錢不夠，請選擇較便宜的餐點或刪除購物車中的餐點',
                walletInfo: '我的錢包總共{total}元',
                categorySelected: '{categoryName}',
                paidAmount: '已付{total}元',
                collectedAmount: '已找回零錢{total}元',
                itemAdded: '已將{itemName}加入購物車，價格{price}元',
                itemRemoved: '已從購物車移除{itemName}',
                cartUpdated: '購物車總金額：{total}元',
                checkout: '準備結帳，總共{total}元',
                orderComplete: '訂單完成！請等待您的取餐號碼顯示後，請至櫃檯領餐',
                cartEmpty: '購物車是空的，請先選擇商品',
                pickupComplete: '您的訂餐內容，{orderItems}，訂單總金額{total}元，感謝您的光臨',
                correct: '答對了，做得好',
                completeChallenge: '恭喜完成{completedCount}題挑戰，共花了{timeDisplay}'
            },
            normal: {
                welcomePage1: '歡迎來到美式速食',
                welcome: '歡迎光臨美式速食自助點餐系統！請選擇您喜愛的餐點',
                instructions: '請選擇您喜愛的餐點',
                overBudget: '錢不夠，請選擇較便宜的餐點或刪除購物車中的餐點',
                walletInfo: '我的錢包總共{total}元',
                categorySelected: '{categoryName}',
                paidAmount: '已付{total}元',
                collectedAmount: '已找回零錢{total}元',
                itemAdded: '成功將{itemName}加入購物車，單價{price}元',
                itemRemoved: '已將{itemName}從購物車中移除',
                cartUpdated: '目前購物車總金額為{total}元',
                checkout: '即將進行結帳，訂單總金額{total}元',
                orderComplete: '感謝您的訂購！請等待您的取餐號碼顯示後，請至櫃檯領餐',
                cartEmpty: '您的購物車目前沒有商品，請先選擇您要的餐點',
                pickupComplete: '您的訂餐內容，{orderItems}，訂單總金額{total}元，感謝您的光臨',
                // 普通模式指定餐點專用語音
                categoryAssignment: '請在{categoryName}類別購買{itemName}，價格{price}元',
                wrongItem: '這不是指定的餐點，請重新選擇',
                paymentInsufficient: '付款金額不足，請再加入金錢，請再試一次',
                paymentOverpaid: '付款金額過多，請拿回多餘的錢，請再試一次',
                selectChangeAmount: '請選擇正確的找零金額',
                correct: '正確',
                completeChallenge: '太棒了，完成{completedCount}題挑戰，共花了{timeDisplay}'
            },
            hard: {
                welcomePage1: '歡迎來到美式速食',
                welcome: '歡迎使用美式速食數位自助點餐服務系統！請仔細選擇您需要的餐點項目',
                instructions: '請仔細選擇您需要的餐點項目',
                overBudget: '錢不夠，請選擇較便宜的餐點或刪除購物車中的餐點',
                walletInfo: '我的錢包總共{total}元',
                categorySelected: '{categoryName}',
                paidAmount: '已付{total}元',
                collectedAmount: '已找回零錢{total}元',
                itemAdded: '商品{itemName}已成功加入您的購物車，商品單價為新台幣{price}元',
                itemRemoved: '系統已將商品{itemName}從您的購物車中移除',
                cartUpdated: '您的購物車已更新，目前訂單總金額為新台幣{total}元',
                checkout: '系統準備執行結帳程序，本次訂單總金額為新台幣{total}元',
                orderComplete: '非常感謝您選擇美式速食！請等待您的取餐號碼顯示後，請至櫃檯領餐，祝您用餐愉快',
                cartEmpty: '系統提示：您的數位購物車目前沒有任何商品，請先從菜單中選擇您需要的餐點項目',
                pickupComplete: '您的訂餐內容，{orderItems}，訂單總金額{total}元，感謝您的光臨',
                paymentInsufficient: '付款金額不足，請再試一次',
                paymentOverpaid: '付款金額過多，請再試一次',
                correct: '正確',
                completeChallenge: '完成{completedCount}題挑戰，共花了{timeDisplay}'
            }
        },

        // =====================================================
        // 配置驅動系統 - 時間配置
        // =====================================================
        timingConfig: {
            easy: {
                speechDelay: 500,
                animationDuration: 1000,
                cartUpdateDelay: 300,
                checkoutDelay: 2000
            },
            normal: {
                speechDelay: 300,
                animationDuration: 800,
                cartUpdateDelay: 200,
                checkoutDelay: 1500
            },
            hard: {
                speechDelay: 200,
                animationDuration: 600,
                cartUpdateDelay: 100,
                checkoutDelay: 1000
            }
        },

        // =====================================================
        // 音效和語音系統（基於專案標準）
        // =====================================================
        audio: {
            beepSound: null,
            successSound: null,
            errorSound: null,
            addToCartSound: null,
            keypadSound: null,
            parent: null, // 引用父對象

            init() {
                // 父對象引用將在調用時動態設置
                try {
                    this.beepSound = new Audio('../audio/units/click.mp3');
                    this.beepSound.preload = 'auto';
                    this.beepSound.volume = 0.6;

                    this.successSound = new Audio('../audio/units/correct02.mp3');
                    this.successSound.preload = 'auto';
                    this.successSound.volume = 0.7;

                    this.errorSound = new Audio('../audio/units/error.mp3');
                    this.errorSound.preload = 'auto';
                    this.errorSound.volume = 0.5;

                    this.addToCartSound = new Audio('../audio/units/correct02.mp3');
                    this.addToCartSound.preload = 'auto';
                    this.addToCartSound.volume = 0.8;

                    this.keypadSound = new Audio('../audio/units/keypad.mp3');
                    this.keypadSound.preload = 'auto';
                    this.keypadSound.volume = 0.7;

                    McDonald.Debug.log('flow', '[A3-McDonald] 音效系統初始化完成');
                } catch (error) {
                    McDonald.Debug.error('[A3-McDonald] 音效初始化錯誤:', error);
                }
            },

            playSound(soundType, callback = null) {
                if (!this.parent || !this.parent.state.settings.audioEnabled || !this.parent.state.audioUnlocked) {
                    if (callback) callback();
                    return;
                }

                try {
                    let sound = null;
                    switch (soundType) {
                        case 'beep': sound = this.beepSound; break;
                        case 'success': sound = this.successSound; break;
                        case 'error': sound = this.errorSound; break;
                        case 'addToCart': sound = this.addToCartSound; break;
                        case 'keypad': sound = this.keypadSound; break;
                        default:
                            McDonald.Debug.warn('audio', '[A3-McDonald] 未知音效類型:', soundType);
                            if (callback) callback();
                            return;
                    }

                    if (sound) {
                        sound.currentTime = 0;
                        const playPromise = sound.play();
                        if (playPromise !== undefined) {
                            playPromise
                                .then(() => {
                                    if (callback) {
                                        this.parent.TimerManager.setTimeout(callback, sound.duration * 1000 || 500, 'audioCallback');
                                    }
                                })
                                .catch(error => {
                                    McDonald.Debug.warn('audio', '[A3-McDonald] 音效播放失敗:', error);
                                    if (callback) callback();
                                });
                        } else if (callback) {
                            this.parent.TimerManager.setTimeout(callback, 500, 'audioCallback');
                        }
                    } else if (callback) {
                        callback();
                    }
                } catch (error) {
                    McDonald.Debug.error('[A3-McDonald] 音效播放錯誤:', error);
                    if (callback) callback();
                }
            }
        },

        // =====================================================
        // 語音系統（基於配置驱动）
        // =====================================================
        speech: {
            synth: null,
            voice: null,
            parent: null, // 引用父對象

            init() {
                // 父對象引用將在調用時動態設置
                if ('speechSynthesis' in window) {
                    this.synth = window.speechSynthesis;
                    this.setupVoice();
                    McDonald.Debug.log('flow', '[A3-McDonald] 語音系統初始化完成');
                } else {
                    McDonald.Debug.warn('audio', '[A3-McDonald] 瀏覽器不支援語音合成');
                }
            },

            setupVoice() {
                const voices = this.synth.getVoices();
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
                    McDonald.Debug.log('flow', '[A3-McDonald] 使用語音:', this.voice.name);
                }
            },

            speak(templateKey, replacements = {}, callback = null) {
                if (!this.parent || !this.parent.state.settings.speechEnabled || !this.synth || !this.voice) {
                    if (callback) callback();
                    return;
                }

                try {
                    const difficulty = this.parent.state.settings.difficulty;
                    const template = this.parent.speechTemplates[difficulty]?.[templateKey];

                    if (!template) {
                        McDonald.Debug.warn('audio', '[A3-McDonald] 找不到語音模板:', templateKey);
                        if (callback) callback();
                        return;
                    }

                    let speechText = template;
                    // 需要轉換為中文數字的金額相關鍵
                    const currencyKeys = ['total', 'price'];
                    Object.keys(replacements).forEach(key => {
                        let value = replacements[key];
                        // 如果是金額相關的鍵且值為數字，轉換為中文數字（不含元）
                        if (currencyKeys.includes(key) && typeof value === 'number') {
                            value = NumberSpeechUtils.convertToChineseNumber(value);
                        }
                        speechText = speechText.replace(new RegExp(`{${key}}`, 'g'), value);
                    });

                    this.synth.cancel();
                    const utterance = new SpeechSynthesisUtterance(speechText);
                    utterance.voice = this.voice;
                    utterance.rate = 1.0;
                    utterance.lang = this.voice.lang;

                    // 🔧 防止 onend 與 onerror 都觸發 callback（Web Speech API 可能兩者都fire）
                    let callbackFired = false;
                    const safeCallback = () => {
                        if (!callbackFired) {
                            callbackFired = true;
                            if (callback) callback();
                        }
                    };

                    utterance.onend = safeCallback;

                    utterance.onerror = (event) => {
                        // 'interrupted' 是正常行為（新語音中斷舊語音），不記錄為錯誤
                        if (event.error !== 'interrupted') {
                            McDonald.Debug.error('[A3-McDonald] 語音播放錯誤:', event);
                        }
                        safeCallback();
                    };

                    this.parent.TimerManager.setTimeout(safeCallback, 10000, 'speech');
                    const delay = this.parent.timingConfig[difficulty]?.speechDelay || 300;
                    this.parent.TimerManager.setTimeout(() => {
                        this.synth.speak(utterance);
                    }, delay, 'speechDelay');

                } catch (error) {
                    McDonald.Debug.error('[A3-McDonald] 語音系統錯誤:', error);
                    safeCallback();
                }
            },

            // 直接播放指定文字（不使用模板）
            speakText(text, callback = null) {
                if (!this.parent || !this.parent.state.settings.speechEnabled || !this.synth || !this.voice) {
                    if (callback) callback();
                    return;
                }

                try {
                    this.synth.cancel();
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.voice = this.voice;
                    utterance.rate = 1.0;
                    utterance.lang = this.voice.lang;

                    // 🔧 防止雙重 callback
                    let callbackFired2 = false;
                    const safeCallback2 = () => {
                        if (!callbackFired2) {
                            callbackFired2 = true;
                            if (callback) callback();
                        }
                    };

                    utterance.onend = safeCallback2;

                    utterance.onerror = (event) => {
                        // 'interrupted' 是正常行為（新語音中斷舊語音），不記錄為錯誤
                        if (event.error !== 'interrupted') {
                            McDonald.Debug.error('[A3-McDonald] 語音播放錯誤:', event);
                        }
                        safeCallback2();
                    };

                    this.parent.TimerManager.setTimeout(safeCallback2, 10000, 'speech');
                    const difficulty = this.parent.state.settings.difficulty;
                    const delay = this.parent.timingConfig[difficulty]?.speechDelay || 300;
                    this.parent.TimerManager.setTimeout(() => {
                        this.synth.speak(utterance);
                    }, delay, 'speechDelay');

                } catch (error) {
                    McDonald.Debug.error('[A3-McDonald] 語音系統錯誤:', error);
                    safeCallback2();
                }
            }
        },

        // =====================================================
        // HTML模板系統
        // =====================================================
        HTMLTemplates: {
            titleBar(stepNumber = 1, stepName = '選擇餐點') {
                const currentQuestion = McDonald.state.gameState.completedQuestions ? McDonald.state.gameState.completedQuestions + 1 : 1;
                const totalQuestions = McDonald.state.settings.questionCount || 5;
                return `
                    <div class="mcdonalds-title-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; background: linear-gradient(135deg, #ffcc02, #ff8f00); border-bottom: 3px solid #c62d42;">
                        <!-- 左側：漢堡圖示 + 系統名稱 -->
                        <div class="title-bar-left" style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.8em;">🍔</span>
                            <span style="font-size: 1.2em; font-weight: 700; color: #c62d42;">美式速食自助點餐系統</span>
                        </div>
                        <!-- 中間：步驟資訊 -->
                        <div style="font-size: 1.5em; font-weight: 700; color: #c62d42;">步驟${stepNumber}，${stepName}</div>
                        <!-- 右側：題數 + 返回設定按鈕 -->
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <span style="font-size: 1.1em; font-weight: 600; color: #333;">第 ${currentQuestion} 題 / 共 ${totalQuestions} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="McDonald.backToSettings()">返回設定</button>
                        </div>
                    </div>
                `;
            },

            mainContent() {
                return `
                    <div class="mcdonalds-body">
                        <div class="mcdonalds-left-panel">
                            ${this.headerSection()}
                            ${this.menuSection()}
                        </div>
                        <div class="mcdonalds-right-panel">
                            ${this.cartSection()}
                        </div>
                    </div>
                `;
            },

            headerSection() {
                return ``; // 已刪除空的main-header元素
            },

            menuSection() {
                return `
                    <main class="main-content">
                        <div class="menu-container">
                            <nav id="category-nav" class="category-nav">
                                ${this.categoryButtons()}
                            </nav>
                            <div id="item-grid" class="item-grid">
                                ${this.menuItems('burgers')}
                            </div>
                            <div id="pagination" class="pagination">
                                ${this.paginationButtons('burgers')}
                            </div>
                        </div>
                    </main>
                `;
            },

            categoryButtons() {
                const isHardOrNormalAssigned = (McDonald.state.settings.difficulty === 'hard' ||
                                                 McDonald.state.settings.difficulty === 'normal') &&
                                                McDonald.state.settings.taskType === 'assigned';
                const categoryBtns = McDonald.menuConfig.categories.map(category => `
                    <button class="category-btn ${category.id === 'burgers' ? 'active' : ''}"
                            data-category="${category.id}">
                        ${category.name}
                    </button>
                `).join('');

                // 困難模式/普通模式+指定餐點：在類別按鈕後方添加提示按鈕
                const hintButton = isHardOrNormalAssigned ? `
                    <div style="margin-left:auto;display:flex;align-items:center;gap:6px;">
                        <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                        <button class="hint-btn" onclick="McDonald.showHardModeHint()" style="
                        background: linear-gradient(135deg, #4caf50, #45a049);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 20px;
                        font-size: 1em;
                        font-weight: 700;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
                    " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(76, 175, 80, 0.4)';"
                       onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(76, 175, 80, 0.3)';">
                        💡 提示
                        </button>
                    </div>
                ` : '';

                // 自選購買模式：在類別按鈕後方添加「我的錢包」按鈕
                const isFreeChoice = McDonald.state.settings.taskType === 'freeChoice';
                const walletButton = isFreeChoice ? `
                    <button class="hint-btn" onclick="McDonald.showWalletPopup()" style="
                        background: linear-gradient(135deg, #ff9800, #f57c00);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 20px;
                        font-size: 1em;
                        font-weight: 700;
                        cursor: pointer;
                        margin-left: auto;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
                    " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(255, 152, 0, 0.4)';"
                       onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(255, 152, 0, 0.3)';">
                        <img src="../images/common/icons_wallet.png" alt="💰" style="width:1.5em;height:1.5em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='💰'"> 我的錢包
                    </button>
                ` : '';

                return categoryBtns + hintButton + walletButton;
            },

            menuItems(categoryId) {
                const items = McDonald.getAllCategoryItems(categoryId);
                const currentPage = McDonald.state.gameState.currentPage;
                const itemsPerPage = McDonald.state.gameState.itemsPerPage;
                const startIndex = currentPage * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const pageItems = items.slice(startIndex, endIndex);

                return pageItems.map(item => `
                    <div class="menu-item fade-in" data-item-id="${item.id}">
                        <div class="item-image">
                            ${(item.imageUrl || item.image) ? `<img src="${item.imageUrl || item.image}" onerror="this.style.display='none'" style="width:100%;height:100%;object-fit:contain;">` : item.emoji}
                        </div>
                        <div class="item-info">
                            <h3>${item.name}</h3>
                            <p class="item-description">${item.description}</p>
                            <div class="item-price">NT$ ${item.price}</div>
                            <button class="add-to-cart-btn">
                                加入購物車
                            </button>
                        </div>
                    </div>
                `).join('');
            },

            paginationButtons(categoryId) {
                const items = McDonald.getAllCategoryItems(categoryId);
                const currentPage = McDonald.state.gameState.currentPage;
                const itemsPerPage = McDonald.state.gameState.itemsPerPage;
                const totalPages = Math.ceil(items.length / itemsPerPage);

                if (totalPages <= 1) return ''; // 只有一頁時不顯示分頁按鈕

                return `
                    <button class="pagination-btn"
                            onclick="McDonald.prevPage()"
                            ${currentPage === 0 ? 'disabled' : ''}>
                        ◀ 上一頁
                    </button>
                    <span class="page-info">第 ${currentPage + 1} 頁 / 共 ${totalPages} 頁</span>
                    <button class="pagination-btn"
                            onclick="McDonald.nextPage()"
                            ${currentPage >= totalPages - 1 ? 'disabled' : ''}>
                        下一頁 ▶
                    </button>
                `;
            },

            cartSection() {
                return `
                    <aside class="sidebar">
                        <div id="cart" class="cart">
                            <h2>🛒 我的訂單</h2>
                            <div id="cart-items" class="cart-items">
                                <p class="empty-cart-message">您的購物車是空的</p>
                            </div>
                            <div class="cart-summary">
                                <div class="total">
                                    <span>總計：</span>
                                    <span id="cart-total">NT$ 0</span>
                                </div>
                                <button id="checkout-btn" class="checkout-btn" disabled>
                                    前往結帳
                                </button>
                            </div>
                        </div>
                    </aside>
                `;
            },

            cartItem(item, quantity, isTeachingMode = false) {
                // 簡單模式+指定餐點：不顯示修改控制項
                if (isTeachingMode) {
                    return `
                        <div class="cart-item" data-item-id="${item.id}">
                            <div class="cart-item-info">
                                <div class="cart-item-name">${(item.imageUrl || item.image) ? `<img src="${item.imageUrl || item.image}" onerror="this.style.display='none'" style="width:1.5em;height:1.5em;object-fit:contain;vertical-align:middle;">` : item.emoji} ${item.name}</div>
                                <div class="cart-item-price">NT$ ${item.price}</div>
                            </div>
                            <div class="cart-item-controls" style="color: #4caf50; font-weight: 600;">
                                <span class="quantity-display">${quantity}</span>
                                <span style="margin-left: 10px;">✓ 已加入</span>
                            </div>
                        </div>
                    `;
                }
                // 一般模式：顯示完整控制項
                return `
                    <div class="cart-item" data-item-id="${item.id}">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${(item.imageUrl || item.image) ? `<img src="${item.imageUrl || item.image}" onerror="this.style.display='none'" style="width:1.5em;height:1.5em;object-fit:contain;vertical-align:middle;">` : item.emoji} ${item.name}</div>
                            <div class="cart-item-price">NT$ ${item.price}</div>
                        </div>
                        <div class="cart-item-controls">
                            <button class="quantity-btn">-</button>
                            <span class="quantity-display">${quantity}</span>
                            <button class="quantity-btn">+</button>
                            <button class="remove-btn" title="移除商品">🗑️</button>
                        </div>
                    </div>
                `;
            }
        },

        // =====================================================
        // 輕量通知系統
        // =====================================================
        showToast(message, type = 'warning') {
            const existing = document.getElementById('a3-toast');
            if (existing) existing.remove();

            const colors = {
                warning: { bg: '#ff9800', text: '#fff' },
                success: { bg: '#4caf50', text: '#fff' },
                error: { bg: '#f44336', text: '#fff' }
            };
            const color = colors[type] || colors.warning;

            const toast = document.createElement('div');
            toast.id = 'a3-toast';
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

            requestAnimationFrame(() => { toast.style.opacity = '1'; });

            this.TimerManager.setTimeout(() => {
                toast.style.opacity = '0';
                this.TimerManager.setTimeout(() => toast.remove(), 300, 'uiAnimation');
            }, 2000, 'uiAnimation');
        },

        // =====================================================
        // 設定頁面系統
        // =====================================================
        showSettings() {
            // 🔧 [Phase 1] 清除所有計時器（返回設定時清除殘留計時器）
            this.TimerManager.clearAll();
            // 🔧 取消任何殘留的語音合成（避免遊戲語音在設定頁面繼續播放）
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            // 🔧 清除遊戲中 appendChild 到 document.body 的殘留彈窗
            ['category-assignment-modal', 'hard-mode-assignment-modal',
             'number-pad-overlay', 'click-mode-prompt', 'click-mode-start-prompt'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
            // 🔧 [Phase 3] 清除遊戲 UI 事件監聽器
            this.EventManager.removeByCategory('gameUI');
            if (window.TutorContext) {
                TutorContext.update({ screen: 'settings' });
                TutorContext.getLiveData = null;
            }

            this.unbindClickModeHandler();

            const app = document.getElementById('app');
            const settings = this.state.settings;

            // 解鎖設定頁面滾動（A4 架構：只操作 #app）
            app.style.setProperty('overflow-y', 'auto', 'important');
            app.style.setProperty('height', '100%', 'important');

            app.innerHTML = `
                <div class="unit-welcome">
                    <div class="welcome-content" style="text-align: center;">
                        <div class="settings-title-row">
                            <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                            <h1>單元A3：美式速食自助點餐</h1>
                        </div>
                        <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">透過自助點餐系統練習選購餐點、計算總價與完成付款</p>

                        <div class="game-settings">
                            <style>
                                .game-settings {
                                    text-align: left;
                                    max-width: 600px;
                                    margin: 0 auto;
                                }
                                .game-settings .setting-group {
                                    text-align: left;
                                    margin-bottom: 20px;
                                }
                                .game-settings .selection-btn {
                                    text-align: center;
                                    color: #000;
                                    font-weight: bold;
                                }
                                .game-settings label {
                                    display: block;
                                    text-align: left;
                                    margin-bottom: 10px;
                                }
                                .button-group {
                                    display: flex;
                                    justify-content: flex-start;
                                    gap: 10px;
                                    flex-wrap: wrap;
                                }
                                /* 保持標題置中 */
                                h1 {
                                    text-align: center;
                                }
                                /* 保持按鈕置中 */
                                .game-buttons {
                                    display: flex;
                                    justify-content: center;
                                    gap: 15px;
                                    margin-top: 30px;
                                }
                            </style>
                            <div class="setting-group">
                                <label>🎯 選擇難度：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.difficulty === 'easy' ? 'active' : ''}"
                                            data-type="difficulty" data-value="easy">
                                        簡單
                                    </button>
                                    <button class="selection-btn ${settings.difficulty === 'normal' ? 'active' : ''}"
                                            data-type="difficulty" data-value="normal">
                                        普通
                                    </button>
                                    <button class="selection-btn ${settings.difficulty === 'hard' ? 'active' : ''}"
                                            data-type="difficulty" data-value="hard">
                                        困難
                                    </button>
                                </div>
                                <div id="difficulty-description" class="setting-description" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 0.95em; color: #666; text-align: left;">
                                    ${this.getDifficultyDescription(settings.difficulty)}
                                </div>
                            </div>


                            <div id="click-mode-setting" class="setting-group" style="background: #fff3cd; padding: 15px; border-radius: 10px; border: 2px solid #ffcc02; display: ${settings.difficulty === 'easy' ? 'block' : 'none'};">
                                <label style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 1.2em;">♿</span>
                                    <span>輔助點擊模式（單鍵操作）：</span>
                                </label>
                                <p style="font-size: 0.9em; color: #666; margin: 8px 0 12px 0; line-height: 1.5;">
                                    啟用後，只要偵測到點擊，系統會自動依序完成點餐、付款、找零等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                    <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式 + 指定餐點」</strong>
                                </p>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.clickMode ? 'active' : ''}"
                                            data-type="clickMode" data-value="true">
                                        ✓ 啟用
                                    </button>
                                    <button class="selection-btn ${!settings.clickMode ? 'active' : ''}"
                                            data-type="clickMode" data-value="false">
                                        ✗ 關閉
                                    </button>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label><img src="../images/common/icons_wallet.png" alt="💰" style="width:1em;height:1em;vertical-align:middle;margin-right:2px;" onerror="this.outerHTML='💰'"> 錢包金額：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.walletAmount === 300 ? 'active' : ''}"
                                            data-type="wallet" data-value="300">
                                        300元以內
                                    </button>
                                    <button class="selection-btn ${settings.walletAmount === 500 ? 'active' : ''}"
                                            data-type="wallet" data-value="500">
                                        500元以內
                                    </button>
                                    <button class="selection-btn ${settings.walletAmount === 1000 ? 'active' : ''}"
                                            data-type="wallet" data-value="1000">
                                        1000元以內
                                    </button>
                                    <button class="selection-btn ${settings.walletAmount === 'custom' ? 'active' : ''}"
                                            data-type="wallet" data-value="custom">
                                        自訂金額
                                    </button>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label>📋 任務類型：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.taskType === 'assigned' ? 'active' : ''}"
                                            data-type="task" data-value="assigned">
                                        購買指定餐點
                                    </button>
                                    <button class="selection-btn ${settings.taskType === 'freeChoice' ? 'active' : ''}"
                                            data-type="task" data-value="freeChoice">
                                        自選購買餐點
                                    </button>
                                </div>
                            </div>

                            <!-- 🍽️ 餐點商品 -->
                            <div class="setting-group">
                                <label>🍽️ 餐點商品：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.productType === 'default' ? 'active' : ''}"
                                            data-type="productType" data-value="default">
                                        預設
                                    </button>
                                    <button class="selection-btn ${settings.productType === 'magic' ? 'active' : ''}"
                                            data-type="productType" data-value="magic">
                                        魔法商品
                                    </button>
                                </div>
                                <div class="setting-description">
                                    <small>${settings.productType === 'default' ? '使用系統預設的餐點商品' : '上傳自訂的餐點商品圖片'}</small>
                                </div>
                            </div>

                            <!-- 魔法商品設定區域 -->
                            <div id="magic-product-container"></div>

                            <div class="setting-group">
                                <label>📊 測驗題數：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.questionCount === 1 ? 'active' : ''}"
                                            data-type="questionCount" data-value="1">
                                        1題
                                    </button>
                                    <button class="selection-btn ${settings.questionCount === 3 ? 'active' : ''}"
                                            data-type="questionCount" data-value="3">
                                        3題
                                    </button>
                                    <button class="selection-btn ${settings.questionCount === 5 ? 'active' : ''}"
                                            data-type="questionCount" data-value="5">
                                        5題
                                    </button>
                                    <button class="selection-btn ${settings.questionCount === 10 ? 'active' : ''}"
                                            data-type="questionCount" data-value="10">
                                        10題
                                    </button>
                                    <button class="selection-btn ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? 'active' : ''}"
                                            data-type="questionCount" data-value="custom">
                                        自訂
                                    </button>
                                </div>
                                <div class="custom-question-display" style="display: ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? 'block' : 'none'}; margin-top: 10px;">
                                    <input type="text" id="custom-question-count-a3"
                                           value="${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? settings.questionCount + '題' : ''}"
                                           placeholder="請輸入題數"
                                           style="padding: 8px; border-radius: 5px; border: 2px solid ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? '#667eea' : '#ddd'}; background: ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? '#667eea' : 'white'}; color: ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                                           readonly onclick="McDonald.handleCustomQuestionClick()">
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
                        </div>

                        <div class="game-buttons">
                            <button class="back-to-main-btn" onclick="McDonald.backToMainMenu()" aria-label="返回主畫面">
                                返回主畫面
                            </button>
                            <button class="start-btn" onclick="McDonald.startGame()" aria-label="開始遊戲" disabled>
                                請完成所有選擇
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // 綁定設定選項事件
            this.bindSettingEvents();
        },

        getDifficultyDescription(difficulty) {
            const descriptions = {
                'easy': '簡單：系統會有視覺、語音提示，引導每個步驟。',
                'normal': '普通：自己完成點餐，錯誤3次會自動提示。',
                'hard': '困難：自己完成點餐，沒有自動提示。'
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

        bindSettingEvents() {
            const buttons = document.querySelectorAll('.selection-btn');
            buttons.forEach(btn => {
                // 🔧 [Phase 3] 使用 EventManager 管理事件
                this.EventManager.on(btn, 'click', () => {
                    const type = btn.dataset.type;
                    const value = btn.dataset.value;

                    // 播放選單音效
                    this.playMenuSelectSound();

                    this.updateSetting(type, value);
                }, {}, 'settingsUI');
            });

            // 🔧 如果已經啟用輔助點擊模式，初始化時停用「自選購買餐點」按鈕
            if (this.state.settings.clickMode) {
                const freeChoiceBtn = document.querySelector('[data-type="task"][data-value="freeChoice"]');
                if (freeChoiceBtn) {
                    freeChoiceBtn.disabled = true;
                    freeChoiceBtn.style.opacity = '0.5';
                    freeChoiceBtn.style.cursor = 'not-allowed';
                }
            }

            // 初始化開始按鈕狀態
            this.updateStartButton();

            // 初始化魔法商品容器
            this.updateMagicProductContainer();

            // 🎁 獎勵系統連結事件
            const settingsRewardLink = document.getElementById('settings-reward-link');
            if (settingsRewardLink) {
                // 🔧 [Phase 3] 使用 EventManager 管理事件
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
                // 🔧 [Phase 3] 使用 EventManager 管理事件
                this.EventManager.on(worksheetLink, 'click', (e) => {
                    e.preventDefault();
                    // 作業單使用自己的預設值與工具列設定，不受遊戲設定影響
                    const params = new URLSearchParams({ unit: 'a3' });
                    window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
                }, {}, 'settingsUI');
            }


        },

        // =====================================================
        // ✨ 自訂餐點（魔法商品）系統
        // =====================================================

        // 壓縮自訂餐點圖片（200px, 70% 品質）
        compressCustomItemImage(base64) {
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
                img.onerror = () => resolve(base64);
                img.src = base64;
            });
        },

        // 回傳指定類別的所有餐點（內建 + 自訂）
        getAllCategoryItems(category) {
            const builtIn = this.menuConfig.items[category] || [];
            const custom = this.state.settings.customItems[category] || [];
            return [...builtIn, ...custom];
        },

        // 更新魔法商品容器（顯示或清空 #magic-product-container）
        updateMagicProductContainer() {
            const container = document.getElementById('magic-product-container');
            if (!container) return;
            if (this.state.settings.productType === 'magic') {
                container.innerHTML = this.getMagicItemSettingsHTML();
                // 渲染預設 tab 的面板
                this.renderCustomItemsPanel(this._customItemActiveTab || 'drinks');
            } else {
                container.innerHTML = '';
            }
        },

        // 產生魔法商品設定 HTML（含 4 個類別 tab）
        getMagicItemSettingsHTML() {
            const tab = this._customItemActiveTab || 'drinks';
            const catDefs = [
                { key: 'burgers',  label: '🍔 漢堡' },
                { key: 'sides',    label: '🍟 配餐' },
                { key: 'drinks',   label: '🥤 飲品' },
                { key: 'desserts', label: '🍦 甜點' }
            ];
            const tabBtns = catDefs.map(c =>
                `<button class="selection-btn ${tab === c.key ? 'active' : ''}"
                         data-custom-tab="${c.key}"
                         onclick="McDonald.switchCustomItemsTab('${c.key}')">${c.label}</button>`
            ).join('');
            return `
                <div class="magic-product-settings" style="margin-top:15px;padding:15px;background:#f9f9f9;border-radius:10px;border:2px dashed #667eea;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <h4 style="margin:0;color:#667eea;">🎪 魔法商品設定</h4>
                        <button onclick="McDonald.closeMagicItemSettings()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#666;line-height:1;">✕</button>
                    </div>
                    <p style="margin:0 0 10px 0;color:#666;font-size:13px;">上傳餐點圖片新增魔法商品（每類別最多 3 種）</p>
                    <div class="button-group" style="margin-bottom:8px;">
                        ${tabBtns}
                    </div>
                    <div id="custom-items-panel" style="padding:10px;background:#fafafa;border:1px solid #eee;border-radius:8px;min-height:60px;"></div>
                </div>
            `;
        },

        // 關閉魔法商品設定（切回預設）
        closeMagicItemSettings() {
            this.state.settings.productType = 'default';
            this.updateMagicProductContainer();
            document.querySelectorAll('[data-type="productType"]').forEach(b => {
                b.classList.toggle('active', b.dataset.value === 'default');
            });
        },

        // 渲染指定 category 的自訂餐點清單面板
        renderCustomItemsPanel(category) {
            const panel = document.getElementById('custom-items-panel');
            if (!panel) return;
            const items = this.state.settings.customItems[category] || [];
            const MAX = 3;
            const catLabels = { burgers: '漢堡', sides: '配餐', drinks: '飲品', desserts: '甜點' };

            let listHTML = '';
            if (items.length > 0) {
                listHTML = `<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px;">` +
                    items.map((item, idx) => `
                        <div style="display:flex;flex-direction:column;align-items:center;padding:10px;background:white;border-radius:8px;border:2px solid #ddd;width:100px;">
                            <img src="${item.imageUrl}" style="width:80px;height:80px;object-fit:contain;border-radius:5px;margin-bottom:5px;" onerror="this.style.display='none'">
                            <div style="font-size:12px;color:#333;font-weight:bold;text-align:center;margin-bottom:3px;word-break:break-all;">${item.name}</div>
                            ${item.price > 0 ? `<div style="font-size:12px;color:#667eea;margin-bottom:5px;">${item.price}元</div>` : '<div style="font-size:12px;color:#888;margin-bottom:5px;">自動設定</div>'}
                            <button onclick="McDonald.removeCustomItem('${category}', ${idx})"
                                    style="background:#ff6b6b;color:white;border:none;padding:3px 8px;border-radius:5px;font-size:11px;cursor:pointer;">移除</button>
                        </div>
                    `).join('') +
                    `</div>`;
            } else {
                listHTML = `<p style="color:#999;font-size:0.9em;margin:0 0 10px 0;">尚未新增自訂${catLabels[category]}</p>`;
            }

            const atLimit = items.length >= MAX;
            const inputId = `custom-item-upload-${category}`;
            panel.innerHTML = `
                ${listHTML}
                <div>
                    <input type="file" id="${inputId}" accept="image/*" style="display:none"
                           onchange="McDonald.handleCustomItemImageUpload(event, '${category}')">
                    <button onclick="document.getElementById('${inputId}').click()"
                            ${atLimit ? 'disabled' : ''}
                            style="background:${atLimit ? '#ccc' : 'linear-gradient(135deg,#667eea,#764ba2)'};color:white;border:none;padding:10px 20px;border-radius:8px;cursor:${atLimit ? 'not-allowed' : 'pointer'};font-size:14px;">
                        ${atLimit ? '❌ 已達上限' : '📸 上傳餐點圖片'}
                    </button>
                    <div style="margin-top:8px;font-size:12px;color:#999;">
                        ${atLimit ? `已達上限${MAX}種，請先移除現有圖片` : `還可上傳 ${MAX - items.length} 種圖片`}
                    </div>
                </div>
            `;
        },

        // 切換自訂餐點 tab
        switchCustomItemsTab(category) {
            this._customItemActiveTab = category;
            const tabBtns = document.querySelectorAll('[data-custom-tab]');
            tabBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.customTab === category);
            });
            this.renderCustomItemsPanel(category);
        },

        // 處理自訂餐點圖片上傳（壓縮後顯示彈窗）
        async handleCustomItemImageUpload(event, category) {
            const file = event.target.files[0];
            if (!file) return;

            const MAX = 3;
            if ((this.state.settings.customItems[category] || []).length >= MAX) {
                this.showToast('每個類別最多上傳 3 種自訂餐點！', 'warning');
                event.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                const compressed = await this.compressCustomItemImage(e.target.result);
                this.showCustomItemInputModal(compressed, category);
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        },

        // 顯示自訂餐點輸入彈窗（同 A1 的 showProductInputModal）
        showCustomItemInputModal(imageUrl, category) {
            const difficulty = this.state.settings.difficulty;
            const taskType = this.state.settings.taskType;
            const walletAmount = this.state.settings.walletAmount === 'custom'
                ? (this.state.settings.customWalletAmount || 1000)
                : (this.state.settings.walletAmount || 1000);
            // 僅「自選購買」讓使用者自訂價格；其他（指定購買 / 未設定 / 簡單模式指定購買）由系統定價
            const isSystemPrice = taskType !== 'freeChoice';
            const catLabels = { burgers: '漢堡', sides: '配餐', drinks: '飲品', desserts: '甜點' };

            const modalHTML = `
                <div id="custom-item-input-modal" onclick="event.stopPropagation()" ontouchstart="event.stopPropagation()" ontouchend="event.stopPropagation()" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;">
                    <div style="background:white;border-radius:15px;padding:25px;width:350px;max-width:90vw;">
                        <h3 style="margin:0 0 15px 0;color:#333;text-align:center;">🎁 新增魔法${catLabels[category]}</h3>
                        <div style="text-align:center;margin-bottom:15px;">
                            <img src="${imageUrl}" style="max-width:200px;max-height:200px;border-radius:10px;border:2px solid #ddd;">
                        </div>
                        <div style="margin-bottom:15px;">
                            <label style="display:block;margin-bottom:5px;color:#666;">餐點名稱：</label>
                            <input type="text" id="custom-item-name-input" placeholder="請輸入名稱" maxlength="15"
                                   style="width:100%;padding:10px;border:2px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;">
                        </div>
                        ${isSystemPrice ? `
                            <div style="margin-bottom:20px;padding:10px;background:#f9f9f9;border-radius:5px;color:#666;font-size:14px;">
                                💡 指定購買模式：價格由系統自動設定
                            </div>
                        ` : `
                            <div style="margin-bottom:20px;">
                                <label style="display:block;margin-bottom:5px;color:#666;">餐點價格：</label>
                                <div style="display:flex;align-items:center;gap:5px;">
                                    <input type="number" id="custom-item-price-input" placeholder="請輸入價格" min="1" max="${walletAmount - 1}"
                                           style="flex:1;padding:10px;border:2px solid #ddd;border-radius:8px;font-size:14px;">
                                    <span style="color:#666;">元</span>
                                </div>
                                <small style="color:#999;font-size:12px;">價格需低於錢包金額（${walletAmount}元）</small>
                            </div>
                        `}
                        <div style="display:flex;gap:10px;justify-content:center;">
                            <button onclick="McDonald.closeCustomItemInputModal()"
                                    style="flex:1;background:#ccc;color:white;border:none;padding:12px;border-radius:8px;cursor:pointer;font-size:14px;">取消</button>
                            <button onclick="McDonald.confirmAddCustomItem('${imageUrl}', '${category}')"
                                    style="flex:1;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;padding:12px;border-radius:8px;cursor:pointer;font-size:14px;">確認新增</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            McDonald.TimerManager.setTimeout(() => {
                const input = document.getElementById('custom-item-name-input');
                if (input) input.focus();
            }, 100, 'ui');
        },

        // 關閉自訂餐點輸入彈窗
        closeCustomItemInputModal() {
            const modal = document.getElementById('custom-item-input-modal');
            if (modal) modal.remove();
        },

        // 確認新增自訂餐點
        confirmAddCustomItem(imageUrl, category) {
            const nameInput = document.getElementById('custom-item-name-input');
            const name = nameInput?.value.trim();
            if (!name) {
                this.showToast('請輸入餐點名稱！', 'warning');
                return;
            }

            const difficulty = this.state.settings.difficulty;
            const taskType = this.state.settings.taskType;
            const walletAmount = this.state.settings.walletAmount === 'custom'
                ? (this.state.settings.customWalletAmount || 1000)
                : (this.state.settings.walletAmount || 1000);

            let price = 0;
            // 僅自選購買模式需讀取使用者輸入的價格
            if (taskType === 'freeChoice') {
                const priceInput = document.getElementById('custom-item-price-input');
                price = parseInt(priceInput?.value);
                if (!price || price <= 0) {
                    this.showToast('請輸入有效的價格！', 'warning');
                    return;
                }
                if (price >= walletAmount) {
                    this.showToast(`價格必須低於錢包金額（${walletAmount}元）！`, 'warning');
                    return;
                }
            }

            const MAX = 3;
            if ((this.state.settings.customItems[category] || []).length >= MAX) {
                this.showToast('每個類別最多上傳 3 種自訂餐點！', 'warning');
                return;
            }

            const newItem = {
                id: `custom-${category}-${Date.now()}`,
                name: name,
                description: '自訂餐點',
                price: price,
                imageUrl: imageUrl,
                emoji: '✨',
                image: null,
                category: category,
                isCustom: true
            };

            if (!this.state.settings.customItems[category]) {
                this.state.settings.customItems[category] = [];
            }
            this.state.settings.customItems[category].push(newItem);
            this.closeCustomItemInputModal();
            this.renderCustomItemsPanel(category);
            this.updateStartButton();
        },

        // 移除自訂餐點
        removeCustomItem(category, index) {
            if (this.state.settings.customItems[category]) {
                this.state.settings.customItems[category].splice(index, 1);
            }
            this.renderCustomItemsPanel(category);
        },

        // 簡單模式動態定價（為 price === 0 的自訂餐點設定價格）
        setEasyModeCustomItemPrices() {
            const ranges = {
                burgers:  { min: 45, max: 80, step: 5 },
                sides:    { min: 25, max: 55, step: 5 },
                drinks:   { min: 20, max: 45, step: 5 },
                desserts: { min: 25, max: 55, step: 5 }
            };
            for (const category of ['burgers', 'sides', 'drinks', 'desserts']) {
                const items = this.state.settings.customItems[category] || [];
                const r = ranges[category];
                const steps = [];
                for (let v = r.min; v <= r.max; v += r.step) steps.push(v);
                items.forEach((item, idx) => {
                    if (item.price === 0) {
                        const spread = Math.max(1, Math.floor(steps.length / 3));
                        const base = spread * (idx % 3);
                        const pick = Math.min(base + Math.floor(Math.random() * spread), steps.length - 1);
                        item.price = steps[pick] || steps[0];
                    }
                });
            }
        },

        updateSetting(type, value) {
            this.Debug.log('flow', `[A3-McDonald] 更新設定: ${type} = ${value}`);

            // 移除同組按鈕的 active 狀態
            const buttons = document.querySelectorAll(`[data-type="${type}"]`);
            buttons.forEach(btn => btn.classList.remove('active'));

            // 添加當前按鈕的 active 狀態
            const currentBtn = document.querySelector(`[data-type="${type}"][data-value="${value}"]`);
            if (currentBtn) {
                currentBtn.classList.add('active');
            }

            // 更新狀態
            switch(type) {
                case 'difficulty':
                    this.state.settings.difficulty = value;
                    // 更新描述文字
                    this.updateDifficultyDescription(value);
                    // 🔧 根據難度顯示/隱藏輔助點擊模式選項
                    const clickModeSetting = document.getElementById('click-mode-setting');
                    if (clickModeSetting) {
                        if (value === 'easy') {
                            clickModeSetting.style.display = 'block';
                        } else {
                            clickModeSetting.style.display = 'none';
                            // 非簡單模式時自動關閉輔助點擊模式
                            this.state.settings.clickMode = false;
                            this.Debug.log('flow', '[A3-McDonald] 輔助點擊模式已自動關閉（僅適用於簡單模式）');
                        }
                    }
                    break;
                case 'questionCount':
                    // 🔧 [新增] 特殊處理自訂題數
                    if (value === 'custom') {
                        this.showQuestionCountNumberInput();
                        return;
                    }
                    this.state.settings.questionCount = parseInt(value);
                    break;
                case 'wallet':
                    if (value === 'custom') {
                        this.state.settings.walletAmount = 'custom';
                        // TODO: 顯示自訂金額輸入框
                        this.showCustomWalletModal();
                    } else {
                        this.state.settings.walletAmount = parseInt(value);
                    }
                    break;
                case 'task':
                    this.state.settings.taskType = value;
                    // 切換至指定購買時，將所有自訂餐點價格重設為 0
                    // 避免先以自選購買設定的高價在指定購買模式造成付款失敗
                    if (value === 'assigned') {
                        for (const cat of ['burgers', 'sides', 'drinks', 'desserts']) {
                            (this.state.settings.customItems[cat] || []).forEach(item => { item.price = 0; });
                        }
                    }
                    break;
                case 'productType':
                    if (value === 'magic') {
                        if (!this.state.settings.difficulty) {
                            this.showToast('請先選擇遊戲難度才能使用魔法商品！', 'warning');
                            // 恢復 default active 狀態
                            document.querySelectorAll('[data-type="productType"]').forEach(b => b.classList.remove('active'));
                            const defBtn = document.querySelector('[data-type="productType"][data-value="default"]');
                            if (defBtn) defBtn.classList.add('active');
                            return;
                        }
                        if (this.state.settings.difficulty !== 'easy' && !this.state.settings.walletAmount) {
                            this.showToast('請先選擇錢包金額，才能設定魔法商品！', 'warning');
                            document.querySelectorAll('[data-type="productType"]').forEach(b => b.classList.remove('active'));
                            const defBtn = document.querySelector('[data-type="productType"][data-value="default"]');
                            if (defBtn) defBtn.classList.add('active');
                            return;
                        }
                    }
                    this.state.settings.productType = value;
                    this.updateMagicProductContainer();
                    break;
                case 'clickMode':
                    this.state.settings.clickMode = value === 'true';
                    this.Debug.log('flow', `[A3-McDonald] 輔助點擊模式: ${this.state.settings.clickMode ? '啟用' : '關閉'}`);

                    // 🔧 如果啟用輔助點擊模式，強制選擇「購買指定餐點」
                    if (this.state.settings.clickMode) {
                        this.state.settings.taskType = 'assigned';
                        // 更新任務類型按鈕的active狀態
                        const taskButtons = document.querySelectorAll('[data-type="task"]');
                        taskButtons.forEach(btn => {
                            btn.classList.remove('active');
                            if (btn.dataset.value === 'assigned') {
                                btn.classList.add('active');
                            }
                            // 停用「自選購買餐點」按鈕
                            if (btn.dataset.value === 'freeChoice') {
                                btn.disabled = true;
                                btn.style.opacity = '0.5';
                                btn.style.cursor = 'not-allowed';
                            }
                        });
                        this.Debug.log('flow', '[A3-McDonald] 輔助點擊模式已啟用，任務類型已強制設為「購買指定餐點」');
                    } else {
                        // 關閉輔助點擊模式時，恢復「自選購買餐點」按鈕
                        const freeChoiceBtn = document.querySelector('[data-type="task"][data-value="freeChoice"]');
                        if (freeChoiceBtn) {
                            freeChoiceBtn.disabled = false;
                            freeChoiceBtn.style.opacity = '1';
                            freeChoiceBtn.style.cursor = 'pointer';
                        }
                    }
                    break;
            }

            // 🔧 [修正] 當選擇預設題數時，隱藏自訂題數顯示框
            if (type === 'questionCount' && value !== 'custom') {
                const customDisplay = document.querySelector('.custom-question-display');
                const customInput = document.getElementById('custom-question-count-a3');
                if (customDisplay && customInput) {
                    customDisplay.style.display = 'none';
                    customInput.value = '';
                    customInput.style.background = 'white';
                    customInput.style.color = '#333';
                    customInput.style.borderColor = '#ddd';
                }
            }

            this.Debug.log('flow', '[A3-McDonald] 當前設定:', this.state.settings);

            // 更新開始按鈕狀態
            this.updateStartButton();
        },

        // 更新開始按鈕狀態
        updateStartButton() {
            const startBtn = document.querySelector('.start-btn');
            if (!startBtn) return;

            // 檢查所有必要設定是否完成
            const settings = this.state.settings;

            // 🔧 如果選擇自訂金額，必須確認已設定 customWalletAmount
            const isWalletValid = settings.walletAmount === 'custom'
                ? (settings.customWalletAmount && settings.customWalletAmount > 0)
                : settings.walletAmount;

            const isValidSettings = settings.difficulty &&
                                    isWalletValid &&
                                    settings.taskType &&
                                    settings.questionCount;

            // 更新按鈕狀態
            if (isValidSettings) {
                startBtn.disabled = false;
                startBtn.textContent = '開始遊戲';
                startBtn.style.opacity = '1';
                startBtn.style.cursor = 'pointer';
                startBtn.onclick = () => this.startGame();
            } else {
                startBtn.disabled = true;
                startBtn.textContent = '請完成所有選擇';
                startBtn.style.opacity = '0.5';
                startBtn.style.cursor = 'not-allowed';
                startBtn.onclick = () => this.showMissingSettings();
            }
        },

        // 顯示缺少的設定項目
        showMissingSettings() {
            const s = this.state.settings;
            const missing = [];

            if (!s.difficulty) missing.push('遊戲難度');

            // 檢查錢包金額（包括自訂金額）
            const isWalletValid = s.walletAmount === 'custom'
                ? (s.customWalletAmount && s.customWalletAmount > 0)
                : s.walletAmount;
            if (!isWalletValid) {
                missing.push(s.walletAmount === 'custom' ? '錢包金額（請輸入自訂金額）' : '錢包金額');
            }

            if (!s.taskType) missing.push('任務類型');
            if (!s.questionCount) missing.push('測驗題數');

            if (missing.length > 0) {
                this.showToast('請先完成以下設定：\n' + missing.map(m => '• ' + m).join('\n'), 'warning');
            }
        },

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

        // 顯示自訂錢包金額輸入框
        showCustomWalletModal() {
            // 初始化數量（如果之前有設定過，則使用之前的設定）
            if (this.state.settings.customWalletDetails) {
                this.customWalletQuantities = { ...this.state.settings.customWalletDetails };
            } else {
                this.customWalletQuantities = { 1: 0, 5: 0, 10: 0, 50: 0, 100: 0, 500: 0, 1000: 0 };
            }

            const denominations = [1000, 500, 100, 50, 10, 5, 1];

            let moneyItemsHTML = denominations.map(value => {
                const randomFace = Math.random() < 0.5 ? 'front' : 'back';
                const imagePath = `../images/money/${value}_yuan_${randomFace}.png`;
                const quantity = this.customWalletQuantities[value] || 0;

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
                            <button onclick="McDonald.adjustCustomWalletQuantity(${value}, -1)"
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
                            <button onclick="McDonald.adjustCustomWalletQuantity(${value}, 1)"
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
                            <span style="font-size: 16px;">總金額：</span>
                            <span id="custom-wallet-total" style="font-size: 28px; font-weight: bold;">NT$ ${totalAmount}</span>
                        </div>

                        <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px;">
                            <button onclick="McDonald.closeCustomWalletModal()"
                                    style="
                                        background: #95a5a6;
                                        color: white;
                                        border: none;
                                        padding: 12px 35px;
                                        border-radius: 25px;
                                        font-size: 18px;
                                        font-weight: bold;
                                        cursor: pointer;
                                    ">✕ 取消</button>
                            <button onclick="McDonald.confirmCustomWallet()"
                                    style="
                                        background: linear-gradient(135deg, #27ae60, #2ecc71);
                                        color: white;
                                        border: none;
                                        padding: 12px 35px;
                                        border-radius: 25px;
                                        font-size: 18px;
                                        font-weight: bold;
                                        cursor: pointer;
                                        box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
                                    ">✓ 確定</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
        },

        // 調整自訂錢包幣值數量
        adjustCustomWalletQuantity(denomination, change) {
            const currentQty = this.customWalletQuantities[denomination] || 0;
            const newQty = Math.max(0, Math.min(20, currentQty + change)); // 限制0-20張

            this.customWalletQuantities[denomination] = newQty;

            // 更新顯示
            const qtyElement = document.getElementById(`custom-wallet-qty-${denomination}`);
            if (qtyElement) {
                qtyElement.textContent = newQty;
            }

            // 更新總金額
            const totalElement = document.getElementById('custom-wallet-total');
            if (totalElement) {
                totalElement.textContent = `NT$ ${this.calculateCustomWalletTotal()}`;
            }

            // 播放音效
            this.playMenuSelectSound();
        },

        // 計算自訂錢包總金額
        calculateCustomWalletTotal() {
            let total = 0;
            for (const [denomination, quantity] of Object.entries(this.customWalletQuantities)) {
                total += parseInt(denomination) * quantity;
            }
            return total;
        },

        // 確認自訂錢包金額
        confirmCustomWallet() {
            const totalAmount = this.calculateCustomWalletTotal();

            if (totalAmount < 50) {
                this.showToast('錢包金額至少需要50元', 'warning');
                return;
            }

            if (totalAmount > 2000) {
                this.showToast('錢包金額不能超過2000元', 'warning');
                return;
            }

            // 儲存詳細的幣值數量
            this.state.settings.customWalletDetails = { ...this.customWalletQuantities };
            this.state.settings.customWalletAmount = totalAmount;
            this.state.settings.walletAmount = 'custom';

            this.Debug.log('flow', '[A3-McDonald] 自訂錢包:', this.customWalletQuantities, '總金額:', totalAmount);
            this.closeCustomWalletModal();

            // 播放音效
            this.playMenuSelectSound();

            // 🔧 更新開始按鈕狀態
            this.updateStartButton();
        },

        // 關閉自訂錢包金額輸入框
        closeCustomWalletModal() {
            const modal = document.getElementById('custom-wallet-modal');
            if (modal) {
                modal.remove();
            }
        },

        // =====================================================
        // 數字輸入器功能（用於自訂題數）
        // =====================================================

        // 顯示題數輸入器
        showQuestionCountNumberInput() {
            this.showNumberInput('questionCount');
        },

        // 🔧 [新增] 點擊自訂題數輸入框時，觸發自訂按鈕
        handleCustomQuestionClick() {
            const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
            if (customBtn) {
                customBtn.click();
            }
        },

        // 顯示數字輸入器
        showNumberInput(type = 'questionCount') {
            const existingPopup = document.getElementById('number-input-popup');
            if (existingPopup) {
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
            let title = type === 'walletAmount' ? '請輸入錢包金額' : '請輸入題數';
            const inputPopupHTML = `<div id="number-input-popup" class="number-input-popup" data-input-type="${type}"><div class="number-input-container"><div class="number-input-header"><h3>${title}</h3><button class="close-btn" onclick="McDonald.closeNumberInput()">×</button></div><div class="number-input-display"><input type="text" id="number-display" readonly value=""></div><div class="number-input-buttons"><button onclick="McDonald.appendNumber('1')">1</button><button onclick="McDonald.appendNumber('2')">2</button><button onclick="McDonald.appendNumber('3')">3</button><button onclick="McDonald.clearNumber()" class="clear-btn">清除</button><button onclick="McDonald.appendNumber('4')">4</button><button onclick="McDonald.appendNumber('5')">5</button><button onclick="McDonald.appendNumber('6')">6</button><button onclick="McDonald.backspaceNumber()" class="backspace-btn">⌫</button><button onclick="McDonald.appendNumber('7')">7</button><button onclick="McDonald.appendNumber('8')">8</button><button onclick="McDonald.appendNumber('9')">9</button><button onclick="McDonald.confirmNumber()" class="confirm-btn">確認</button><button onclick="McDonald.appendNumber('0')" class="zero-btn">0</button></div></div></div>`;
            const inputStyles = `<style id="number-input-styles">.number-input-popup{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;animation:fadeIn 0.3s ease-out}.number-input-container{background:white;border-radius:15px;padding:20px;box-shadow:0 10px 30px rgba(0,0,0,0.3);width:320px;max-width:95vw;animation:bounceIn 0.3s ease-out}.number-input-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid #f0f0f0;padding-bottom:10px}.number-input-header h3{margin:0;color:#333;font-size:18px}.close-btn{background:none;border:none;font-size:24px;cursor:pointer;color:#666;padding:0;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center}.close-btn:hover{background:#f0f0f0}.number-input-display{margin-bottom:20px}#number-display{width:100%;border:2px solid #ddd;padding:15px;font-size:24px;text-align:center;border-radius:8px;background:#f9f9f9;font-family:'Courier New',monospace;box-sizing:border-box}.number-input-buttons{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.number-input-buttons button{padding:15px;font-size:18px;font-weight:bold;border:2px solid #ddd;border-radius:8px;background:white;cursor:pointer;transition:all 0.2s}.number-input-buttons button:hover{background:#f0f0f0;transform:translateY(-1px)}.number-input-buttons button:active{transform:translateY(0);background:#e0e0e0}.number-input-buttons button.clear-btn{background:#ff6b6b!important;color:white!important;border-color:#ff6b6b!important;font-size:14px!important}.number-input-buttons button.backspace-btn{background:#ffa726!important;color:white!important;border-color:#ffa726!important;font-size:16px!important}.number-input-buttons button.confirm-btn{background:#4caf50!important;color:white!important;border-color:#4caf50!important;grid-row:span 2;font-size:14px!important}.number-input-buttons button.zero-btn{grid-column:span 3}/* @keyframes fadeIn 已移至 CSS, bounceIn 已移至 JS injectGlobalAnimationStyles() */</style>`;
            if (!document.getElementById('number-input-styles')) {
                document.head.insertAdjacentHTML('beforeend', inputStyles);
            }
            document.body.insertAdjacentHTML('beforeend', inputPopupHTML);
        },

        closeNumberInput() {
            const popup = document.getElementById('number-input-popup');
            if (popup) popup.remove();
        },

        appendNumber(digit) {
            const now = Date.now();
            if (this._lastAppendTime && now - this._lastAppendTime < 50) return;
            this._lastAppendTime = now;
            const display = document.getElementById('number-display');
            if (!display) return;
            this.audio.playSound('keypad');
            if (display.value === '' || display.value === '0') {
                display.value = digit;
            } else {
                display.value += digit;
            }
        },

        clearNumber() {
            const now = Date.now();
            if (this._lastClearTime && now - this._lastClearTime < 300) return;
            this._lastClearTime = now;
            const display = document.getElementById('number-display');
            if (!display) return;
            this.audio.playSound('keypad');
            display.value = '';
        },

        backspaceNumber() {
            const now = Date.now();
            if (this._lastBackspaceTime && now - this._lastBackspaceTime < 200) return;
            this._lastBackspaceTime = now;
            const display = document.getElementById('number-display');
            if (!display) return;
            this.audio.playSound('keypad');
            if (display.value.length > 1) {
                display.value = display.value.slice(0, -1);
            } else {
                display.value = '';
            }
        },

        confirmNumber() {
            const now = Date.now();
            if (this._lastConfirmTime && now - this._lastConfirmTime < 500) return;
            this._lastConfirmTime = now;
            const display = document.getElementById('number-display');
            const popup = document.getElementById('number-input-popup');
            const inputType = popup ? popup.dataset.inputType : 'questionCount';
            if (!display) return;
            const inputValue = parseInt(display.value);
            if (inputType === 'questionCount') {
                if (inputValue > 0 && inputValue <= 100) {
                    this.state.settings.questionCount = inputValue;
                    this.Debug.log('state', `[Setting] 自訂題數已設定: questionCount = ${inputValue}`);
                    this.audio.playSound('beep');

                    // 🔧 [修正] 直接更新DOM，避免重新渲染整個設定畫面（防止閃爍）
                    const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
                    if (customBtn) {
                        const group = customBtn.closest('.button-group');
                        group.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                        customBtn.classList.add('active');
                    }

                    const customDisplay = document.querySelector('.custom-question-display');
                    const customInput = document.getElementById('custom-question-count-a3');
                    if (customDisplay && customInput) {
                        customDisplay.style.display = 'block';
                        customInput.value = `${inputValue}題`;
                        customInput.style.background = '#667eea';
                        customInput.style.color = 'white';
                        customInput.style.borderColor = '#667eea';
                    }

                    // 🔧 [修正] 更新開始按鈕狀態（避免按鈕卡在"請完成所有設定選項"）
                    this.updateStartButton();

                    this.closeNumberInput();
                } else {
                    this.showToast('請輸入1-100之間的有效題數！', 'warning');
                }
            }
        },

        // 返回主畫面
        backToMainMenu() {
            // 返回到遊戲選單畫面
            window.location.href = '../index.html#part4';
        },

        startGame() {
            // 🆕 防連點檢查
            const now = Date.now();
            if (this._lastStartGameTime && now - this._lastStartGameTime < A3_DEBOUNCE.START_GAME) {
                this.Debug.log('flow', '[A3] startGame 防抖：忽略重複點擊');
                return;
            }
            this._lastStartGameTime = now;

            // 檢查必要設定
            if (!this.state.settings.difficulty) {
                this.showToast('請選擇難度！', 'warning');
                return;
            }
            if (!this.state.settings.questionCount) {
                this.showToast('請選擇測驗題數！', 'warning');
                return;
            }
            if (!this.state.settings.walletAmount) {
                this.showToast('請選擇錢包金額！', 'warning');
                return;
            }
            if (!this.state.settings.taskType) {
                this.showToast('請選擇任務類型！', 'warning');
                return;
            }

            this.Debug.log('flow', '[A3-McDonald] 開始遊戲，難度:', this.state.settings.difficulty);
            this.Debug.log('flow', '[A3-McDonald] 錢包金額:', this.state.settings.walletAmount);
            this.Debug.log('flow', '[A3-McDonald] 任務類型:', this.state.settings.taskType);

            // 🔧 [Phase 1] 清除所有計時器（開始新遊戲時清除殘留計時器）
            this.TimerManager.clearAll();
            // 🔧 [Phase 3] 清除設定 UI 事件監聽器
            this.EventManager.removeByCategory('settingsUI');

            // 🔧 [修正] 記錄測驗開始時間（修正完成時間顯示為0秒的問題）
            this.state.gameState.startTime = Date.now();
            if (window.TutorContext) {
                TutorContext.reset();
                TutorContext.update({ screen: 'game', phase: 'selectItem', difficulty: this.state.settings.difficulty, totalQuestions: this.state.settings.questionCount, questionIndex: 0 });
                const _mc = this;
                TutorContext.getLiveData = () => {
                    const gs = _mc.state.gameState;
                    const items = gs.assignedItems || [];
                    const total = items.reduce((s, i) => s + (i.price || 0), 0);
                    return {
                        orderItems:  items.map(i => i.name).join('、') || null,
                        totalPrice:  total || null,
                        wallet:      _mc.state.settings.walletAmount ?? null,
                    };
                };
            }

            // 初始化遊戲資料
            this.initializeGameData();

            // 如果啟用輔助點擊模式，初始化
            if (this.state.settings.clickMode) {
                this.initClickModeForWelcome();
            }

            // 切換到歡迎場景
            this.SceneManager.switchScene('welcome', this);
        },

        // 初始化遊戲資料（錢包、指定餐點）
        initializeGameData() {
            this.Debug.log('flow', '[A3-McDonald] 初始化遊戲資料');

            // 1. 生成指定餐點（如果是購買指定餐點模式）
            if (this.state.settings.taskType === 'assigned') {
                // 指定購買模式：為 price===0 的自訂餐點動態設定價格（所有難度，確保價格合理）
                this.setEasyModeCustomItemPrices();
                this.generateAssignedItems();
            }

            // 2. 生成錢包金錢
            this.initializeWalletMoney();

            this.Debug.log('flow', '[A3-McDonald] 指定餐點:', this.state.gameState.assignedItems);
            this.Debug.log('flow', '[A3-McDonald] 錢包金錢:', this.state.gameState.walletMoney);
        },

        // 生成指定購買的餐點（確保總價不超過錢包金額）
        generateAssignedItems() {
            const categories = ['burgers', 'sides', 'drinks', 'desserts'];
            const settings = this.state.settings;
            const difficulty = settings.difficulty;

            // 🆕 獲取上一輪的餐點名稱（用於防重複）
            const lastSelectedNames = this.state.gameState.lastAssignedItems?.selectedNames || [];

            // 根據難度決定指定餐點數量
            // 簡單模式：4項（每類別1項）
            // 普通模式：6項（每類別至少1項，再隨機2項）
            // 困難模式：8項（每類別至少1項，再隨機4項）
            const totalItemsCount = {
                'easy': 4,
                'normal': 4,
                'hard': 8
            };
            const targetCount = totalItemsCount[difficulty] || 4;

            // 取得錢包金額上限
            let maxWallet = settings.walletAmount === 'custom'
                ? settings.customWalletAmount
                : settings.walletAmount;

            // 預留一些找零空間（至少要能找零）
            const maxTotalPrice = maxWallet - 10; // 預留10元找零

            let assigned = [];
            let totalPrice = 0;
            let attempts = 0;
            const maxAttempts = 50; // 最多嘗試50次

            // 嘗試生成符合預算的餐點組合
            while (attempts < maxAttempts) {
                assigned = [];
                totalPrice = 0;

                // 步驟1：從每個類別各選擇1項餐點（共4項）
                const selectedNames = []; // 追蹤已選擇的餐點名稱，避免單次內重複
                const isMagicMode = settings.productType === 'magic';
                for (const category of categories) {
                    const remainingBudget = maxTotalPrice - totalPrice;
                    let selectedItem = null;

                    // 魔法商品模式：優先從自訂餐點中選取（確保必定出現）
                    if (isMagicMode) {
                        const customForCat = (settings.customItems[category] || []).filter(
                            item => !selectedNames.includes(item.name)
                        );
                        if (customForCat.length > 0) {
                            const affordable = customForCat.filter(item => item.price <= remainingBudget);
                            const pool = affordable.length > 0 ? affordable : customForCat;
                            selectedItem = pool[Math.floor(Math.random() * pool.length)];
                        }
                    }

                    // 若無自訂餐點（或非魔法模式），從所有餐點中選取
                    if (!selectedItem) {
                        const categoryItems = this.getAllCategoryItems(category);
                        // 🆕 過濾出符合預算且未被選過的餐點（排除單次內重複 + 排除上一輪）
                        const affordableItems = categoryItems.filter(item =>
                            item.price <= remainingBudget &&
                            !selectedNames.includes(item.name) &&
                            !lastSelectedNames.includes(item.name)
                        );
                        if (affordableItems.length > 0) {
                            selectedItem = affordableItems[Math.floor(Math.random() * affordableItems.length)];
                        } else {
                            // 🆕 沒有符合預算的餐點，選擇該類別最便宜且未選過的
                            const availableItems = categoryItems.filter(item =>
                                !selectedNames.includes(item.name) &&
                                !lastSelectedNames.includes(item.name)
                            );
                            if (availableItems.length > 0) {
                                selectedItem = availableItems.reduce((min, item) =>
                                    item.price < min.price ? item : min, availableItems[0]);
                            }
                        }
                    }

                    if (selectedItem) {
                        assigned.push({ ...selectedItem, category, purchased: false });
                        totalPrice += selectedItem.price;
                        selectedNames.push(selectedItem.name);
                    }
                }

                // 步驟2：如果需要更多項目，從所有類別隨機選擇額外項目
                const additionalCount = targetCount - 4;
                for (let i = 0; i < additionalCount; i++) {
                    // 隨機選擇一個類別
                    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
                    const categoryItems = this.getAllCategoryItems(randomCategory);

                    // 計算剩餘預算
                    const remainingBudget = maxTotalPrice - totalPrice;
                    // 🆕 過濾出符合預算且尚未選過的餐點（排除單次內重複 + 排除上一輪）
                    const availableItems = categoryItems.filter(item =>
                        item.price <= remainingBudget &&
                        !selectedNames.includes(item.name) &&
                        !lastSelectedNames.includes(item.name)
                    );

                    if (availableItems.length > 0) {
                        const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                        assigned.push({
                            ...randomItem,
                            category: randomCategory,
                            purchased: false
                        });
                        totalPrice += randomItem.price;
                        selectedNames.push(randomItem.name); // 記錄已選擇的餐點
                    }
                }

                // 檢查總價是否符合預算
                if (totalPrice <= maxTotalPrice) {
                    break;
                }
                attempts++;
            }

            this.state.gameState.assignedItems = assigned;
            this.state.gameState.assignedItemsTotalPrice = totalPrice;

            // 🆕 保存本輪指定餐點供下一輪比較
            const currentSelectedNames = assigned.map(item => item.name);
            this.state.gameState.lastAssignedItems = {
                items: assigned.map(item => item.id),
                selectedNames: currentSelectedNames
            };

            if (lastSelectedNames.length > 0) {
                this.Debug.log('state', `[A3-McDonald-防重複] 排除上一輪餐點: ${lastSelectedNames.join(', ')}`);
                this.Debug.log('state', `[A3-McDonald-防重複] 本次選擇餐點: ${currentSelectedNames.join(', ')}`);
            }

            this.Debug.log('flow', `[A3-McDonald] ${difficulty}模式 指定餐點數量: ${assigned.length}, 總價: ${totalPrice}`);
        },

        // 初始化錢包金錢（生成錢包內容並儲存到 state）
        initializeWalletMoney() {
            const settings = this.state.settings;
            let walletAmount = 0;
            const wallet = [];

            // 確定錢包金額
            if (settings.walletAmount === 'custom') {
                walletAmount = settings.customWalletAmount;

                // 如果有自訂錢包詳細資料，使用指定的幣值數量
                if (settings.customWalletDetails) {
                    const denominations = [1000, 500, 100, 50, 10, 5, 1];
                    for (const denom of denominations) {
                        const quantity = settings.customWalletDetails[denom] || 0;
                        for (let i = 0; i < quantity; i++) {
                            const moneyData = this.moneyItems.find(m => m.value === denom);
                            if (moneyData) {
                                // 隨機顯示正面或背面
                                const showFront = Math.random() < 0.5;
                                wallet.push({
                                    ...moneyData,
                                    face: showFront ? 'front' : 'back',
                                    id: `money-${Date.now()}-${Math.random()}-${i}`
                                });
                            }
                        }
                    }

                    this.state.gameState.walletMoney = wallet;
                    this.state.gameState.walletTotal = walletAmount;

                    this.Debug.log('flow', '[A3-McDonald] 自訂錢包總額:', walletAmount);
                    this.Debug.log('flow', '[A3-McDonald] 自訂錢包組成:', wallet.map(m => m.value));
                    return;
                }
            } else {
                // 非自訂金額：在範圍內隨機生成（200以內、500以內、1000以內）
                const maxAmount = settings.walletAmount; // 200, 500, 或 1000
                const isAssignedTask = settings.taskType === 'assigned';
                const assignedTotal = this.state.gameState.assignedItemsTotalPrice || 0;

                // 計算最小金額
                let minAmount;
                if (isAssignedTask && assignedTotal > 0) {
                    // 指定餐點模式：錢包金額必須大於指定餐點總額
                    minAmount = assignedTotal + 1;
                } else {
                    // 自選餐點模式：最小金額為最大值的 50%
                    minAmount = Math.floor(maxAmount * 0.5);
                }

                // 確保最小金額不超過最大金額
                if (minAmount > maxAmount) {
                    minAmount = maxAmount;
                }

                // 隨機生成錢包金額（避免與上一輪重複）
                let attempts = 0;
                do {
                    walletAmount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
                    attempts++;
                } while (walletAmount === this.state.gameState.lastWalletAmount && attempts < 50);

                // 保存本輪金額供下一輪比較
                if (this.state.gameState.lastWalletAmount !== 0) {
                    this.Debug.log('state', `[A3-McDonald-防重複] 上一輪: ${this.state.gameState.lastWalletAmount}元, 本次: ${walletAmount}元`);
                }
                this.state.gameState.lastWalletAmount = walletAmount;

                this.Debug.log('flow', `[A3-McDonald] 錢包金額範圍: ${minAmount} ~ ${maxAmount}, 生成金額: ${walletAmount}`);
            }

            // 生成金錢組合（使用貪婪算法）
            let remaining = walletAmount;

            // 使用貪婪算法生成金錢組合
            const denominations = [1000, 500, 100, 50, 10, 5, 1];

            for (const denom of denominations) {
                while (remaining >= denom) {
                    const moneyData = this.moneyItems.find(m => m.value === denom);
                    if (moneyData) {
                        // 隨機顯示正面或背面
                        const showFront = Math.random() < 0.5;
                        wallet.push({
                            ...moneyData,
                            face: showFront ? 'front' : 'back',
                            id: `money-${Date.now()}-${Math.random()}`
                        });
                        remaining -= denom;
                    } else {
                        break;
                    }
                }
            }

            this.state.gameState.walletMoney = wallet;
            this.state.gameState.walletTotal = walletAmount;

            this.Debug.log('flow', '[A3-McDonald] 錢包總額:', walletAmount);
            this.Debug.log('flow', '[A3-McDonald] 錢包組成:', wallet.map(m => m.value));
        },

        // =====================================================
        // 歡迎畫面系統（兩頁式）
        // =====================================================
        showWelcomePage1() {
            const app = document.getElementById('app');
            this.Debug.log('flow', '[A3-McDonald] 顯示歡迎畫面第1頁');

            app.innerHTML = `
                <div class="mcdonalds-welcome-page" style="
                    width: 100vw;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background: linear-gradient(135deg, #ffcc02, #ff8f00);
                    padding: 20px;
                    box-sizing: border-box;
                    overflow-y: auto;
                ">
                    <div style="
                        background: white;
                        border-radius: 30px;
                        padding: 60px 40px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        text-align: center;
                        max-width: 600px;
                        width: 90%;
                        animation: slideUp 0.6s ease;
                    ">
                        <div style="
                            font-size: 72px;
                            margin-bottom: 30px;
                        ">🍔</div>

                        <h1 style="
                            color: #da291c;
                            font-size: 48px;
                            font-weight: 900;
                            margin-bottom: 20px;
                            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
                        ">歡迎來到美式速食</h1>

                        <h2 style="
                            color: #ffcc02;
                            font-size: 32px;
                            font-weight: 700;
                            margin-bottom: 40px;
                        ">美式速食自助點餐系統</h2>

                        <p style="
                            font-size: 20px;
                            color: #666;
                            margin-bottom: 50px;
                            line-height: 1.6;
                        ">準備好開始您的美味之旅了嗎？<br>讓我們開始點餐吧！</p>

                        <button onclick="McDonald.showWelcomePage2()" style="
                            background: linear-gradient(135deg, #da291c, #ff6b6b);
                            color: white;
                            border: none;
                            border-radius: 50px;
                            padding: 20px 60px;
                            font-size: 24px;
                            font-weight: 700;
                            cursor: pointer;
                            box-shadow: 0 8px 20px rgba(218, 41, 28, 0.3);
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 30px rgba(218, 41, 28, 0.4)'"
                           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 20px rgba(218, 41, 28, 0.3)'">
                            下一步 →
                        </button>
                    </div>
                </div>

                <!-- @keyframes slideUp 已移至 CSS -->
            `;

            // 播放音效
            if (this.state.settings.audioEnabled) {
                this.audio.playSound('beep');
            }

            // 播放語音 - 歡迎畫面第1頁使用專屬語音
            if (this.state.settings.speechEnabled && this.speech) {
                this.TimerManager.setTimeout(() => {
                    this.speech.speak('welcomePage1');
                }, 500, 'speechDelay');
            }

            // 如果啟用輔助點擊模式，重新初始化（用於第二輪及後續輪次）
            if (this.state.settings.clickMode) {
                // 檢查是否已經綁定過事件處理器（第一輪在 startGame 中已初始化）
                if (this._clickModeHandlerBound) {
                    // 已經綁定過，只需重置狀態
                    const gs = this.state.gameState;
                    gs.clickModeState.enabled = false;
                    gs.clickModeState.currentPhase = 'welcome';
                    gs.clickModeState.currentStep = 0;
                    gs.clickModeState.actionQueue = [];
                    gs.clickModeState.waitingForClick = false;
                    gs.clickModeState.waitingForStart = false;
                    gs.clickModeState.lastClickTime = 0; // 設為0，允許立即點擊
                    gs.clickModeState.hasShownStartPrompt = false; // 🔧 修復：新一輪重置提示顯示狀態
                    gs.clickModeState.isExecuting = false; // 🔧 修復：重置執行狀態

                    this.Debug.log('assist', '[A3-ClickMode] 重新初始化輔助點擊模式（新一輪）');

                    // 延遲啟用
                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.enabled = true;
                        gs.clickModeState.waitingForStart = true;

                        // 顯示提示
                        this.TimerManager.setTimeout(() => {
                            this.showStartPrompt();
                        }, 1000, 'clickMode');
                    }, 500, 'clickMode');
                }
            }
        },

        showWelcomePage2() {
            const app = document.getElementById('app');
            const walletTotal = this.state.gameState.walletTotal;
            const taskType = this.state.settings.taskType;
            const assignedItems = this.state.gameState.assignedItems;
            const walletMoney = this.state.gameState.walletMoney;

            this.Debug.log('flow', '[A3-McDonald] 顯示歡迎畫面第2頁');

            // 計算指定餐點總價
            let assignedTotalPrice = 0;
            if (taskType === 'assigned' && assignedItems.length > 0) {
                assignedTotalPrice = this.state.gameState.assignedItemsTotalPrice || 0;
            }

            // 生成錢包金錢圖片 HTML（紙鈔大於硬幣）
            const walletMoneyHTML = walletMoney.map(money => {
                const isPaperMoney = money.value >= 100; // 100元以上為紙鈔
                const imgWidth = isPaperMoney ? '100px' : '60px';
                return `
                <div style="
                    display: inline-block;
                    margin: 5px;
                    text-align: center;
                    vertical-align: middle;
                ">
                    <img src="${money.images[money.face]}"
                         alt="${money.name}"
                         style="
                            width: ${imgWidth};
                            height: auto;
                            border-radius: 8px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                         ">
                </div>
            `;
            }).join('');

            app.innerHTML = `
                <div class="mcdonalds-welcome-page" style="
                    width: 100vw;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background: linear-gradient(135deg, #ffcc02, #ff8f00);
                    padding: 40px 20px; /* 增加上下間距 */
                    box-sizing: border-box;
                    overflow-y: auto;
                ">
                    <div style="
                        background: white;
                        border-radius: 30px;
                        padding: 50px 40px; /* 略減內部 padding */
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        text-align: center;
                        max-width: 600px;
                        width: 90%;
                        animation: slideUp 0.6s ease;
                    ">
                        <div style="
                            font-size: 72px;
                            margin-bottom: 30px;
                        ">💰</div>

                        <h1 style="
                            color: #da291c;
                            font-size: 42px;
                            font-weight: 900;
                            margin-bottom: 30px;
                        ">我的錢包</h1>

                        <div style="
                            background: white;
                            border: 3px solid #ffcc02;
                            border-radius: 20px;
                            padding: 30px;
                            margin-bottom: 30px;
                            box-shadow: 0 4px 15px rgba(255, 204, 2, 0.3);
                        ">
                            <p style="
                                font-size: 20px;
                                color: #da291c;
                                margin-bottom: 20px;
                                font-weight: 700;
                            "><img src="../images/common/icons_wallet.png" alt="💰" style="width:1.5em;height:1.5em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='💰'"> 我的錢包內容（總共 ${walletTotal} 元）</p>
                            <div style="
                                max-height: 300px;
                                overflow-y: auto;
                                padding: 10px;
                                background: #f9f9f9;
                                border-radius: 10px;
                            ">
                                ${walletMoneyHTML}
                            </div>
                        </div>

                        ${taskType === 'assigned' ? `
                            <div style="
                                background: #f0f9ff;
                                border: 2px solid #3b82f6;
                                border-radius: 15px;
                                padding: 20px;
                                margin-bottom: 30px;
                            ">
                                <p style="
                                    font-size: 18px;
                                    color: #1e40af;
                                    margin-bottom: 10px;
                                    font-weight: 700;
                                ">📋 任務：購買指定餐點</p>
                                <p style="
                                    font-size: 16px;
                                    color: #3b82f6;
                                ">需要購買 ${assignedItems.length} 項餐點<br>
                                預計花費：${assignedTotalPrice} 元</p>
                            </div>
                        ` : `
                            <div style="
                                background: #f0fdf4;
                                border: 2px solid #22c55e;
                                border-radius: 15px;
                                padding: 20px;
                                margin-bottom: 30px;
                            ">
                                <p style="
                                    font-size: 18px;
                                    color: #15803d;
                                    font-weight: 700;
                                ">✨ 任務：自由選購餐點</p>
                            </div>
                        `}

                        <p style="
                            font-size: 18px;
                            color: #666;
                            margin-bottom: 40px;
                        ">準備好開始點餐了嗎？</p>

                        <button onclick="McDonald.startOrdering()" style="
                            background: linear-gradient(135deg, #da291c, #ff6b6b);
                            color: white;
                            border: none;
                            border-radius: 50px;
                            padding: 20px 60px;
                            font-size: 24px;
                            font-weight: 700;
                            cursor: pointer;
                            box-shadow: 0 8px 20px rgba(218, 41, 28, 0.3);
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 30px rgba(218, 41, 28, 0.4)'"
                           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 20px rgba(218, 41, 28, 0.3)'">
                            開始點餐 🍟
                        </button>
                    </div>
                </div>

                <!-- @keyframes slideUp 已移至 CSS -->
            `;

            // 播放音效
            if (this.state.settings.audioEnabled) {
                this.audio.playSound('beep');
            }

            // 播放錢包語音「我的錢包總共×元」
            if (this.state.settings.speechEnabled && this.speech) {
                this.TimerManager.setTimeout(() => {
                    this.speech.speak('walletInfo', { total: walletTotal });
                }, 500, 'speechDelay');
            }
        },

        // 開始點餐（從歡迎畫面第2頁進入點餐頁面）
        startOrdering() {
            this.Debug.log('flow', '[A3-McDonald] 開始點餐');
            this.SceneManager.switchScene('ordering', this);
        },

        // =====================================================
        // 提示系統（指定餐點模式）
        // =====================================================

        // 更新提示顯示
        updateHints() {
            // 只在指定餐點模式下啟用
            if (this.state.settings.taskType !== 'assigned') return;

            const difficulty = this.state.settings.difficulty;

            // 困難模式：不自動顯示提示，只清除現有提示
            if (difficulty === 'hard') {
                // 困難模式下，只有按提示按鈕才會顯示提示
                // 這裡不做任何自動提示
                return;
            }

            // 普通模式：根據錯誤次數決定是否顯示提示
            if (difficulty === 'normal') {
                const nextItem = this.getNextAssignedItem();
                if (nextItem) {
                    const currentCategory = nextItem.category;
                    const errorCount = this.state.gameState.categoryErrorCounts[currentCategory] || 0;

                    // 錯誤3次以上，持續顯示提示動畫
                    if (errorCount >= 3) {
                        // 只清除類別按鈕提示，保留餐點提示
                        document.querySelectorAll('.category-btn-hint').forEach(el => {
                            el.classList.remove('category-btn-hint');
                        });
                        // 確保當前類別正確並顯示提示（只高亮，不導航避免無限遞迴）
                        if (this.state.gameState.currentCategory === currentCategory) {
                            this.highlightMenuItem(nextItem.id);
                        }
                        return;
                    }
                }
                // 錯誤少於3次，清除所有提示
                this.clearAllHints();
                return;
            }

            // 簡單模式：清除所有現有提示
            this.clearAllHints();

            // 找到下一個未購買的指定餐點
            const nextAssignedItem = this.getNextAssignedItem();
            if (!nextAssignedItem) {
                this.Debug.log('flow', '[A3-McDonald] 所有指定餐點已購買完成');
                return;
            }

            // 高亮顯示對應的類別按鈕
            this.highlightCategoryButton(nextAssignedItem.category);

            // 如果當前分類就是該餐點的分類，則高亮顯示該餐點
            if (this.state.gameState.currentCategory === nextAssignedItem.category) {
                requestAnimationFrame(() => {
                    this.highlightMenuItem(nextAssignedItem.id);
                });
            }
        },

        // 取得下一個未購買的指定餐點
        getNextAssignedItem() {
            const assignedItems = this.state.gameState.assignedItems;
            const purchasedItems = this.state.gameState.purchasedItems;

            return assignedItems.find(item =>
                !purchasedItems.some(purchased => purchased.id === item.id)
            );
        },

        // 高亮顯示類別按鈕
        highlightCategoryButton(categoryId) {
            // 移除所有類別按鈕的提示
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('category-btn-hint');
            });

            // 添加提示到目標類別
            const targetBtn = document.querySelector(`[data-category="${categoryId}"]`);
            if (targetBtn) {
                targetBtn.classList.add('category-btn-hint');
            }
        },

        // 高亮顯示菜單項目
        highlightMenuItem(itemId) {
            // 查找對應的菜單項目
            const menuItem = document.querySelector(`[data-item-id="${itemId}"]`);
            if (menuItem) {
                menuItem.classList.add('menu-item-hint');
                this.Debug.log('flow', '[A3-McDonald] 顯示餐點提示:', itemId);
            }
        },

        // 清除所有提示
        clearAllHints() {
            // 清除類別按鈕提示
            document.querySelectorAll('.category-btn-hint').forEach(el => {
                el.classList.remove('category-btn-hint');
            });

            // 清除菜單項目提示
            document.querySelectorAll('.menu-item-hint').forEach(el => {
                el.classList.remove('menu-item-hint');
            });

            // 清除已購買標記
            document.querySelectorAll('.menu-item-purchased').forEach(el => {
                el.classList.remove('menu-item-purchased');
            });
        },

        // 標記已購買的餐點（已停用淡化效果）
        markPurchasedItems() {
            // 已停用：不再對已購買的餐點添加淡化效果
            // 保留函數以維持其他調用的相容性
        },

        // 高亮結帳按鈕（所有指定餐點購買完成後）
        highlightCheckoutButton() {
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) {
                checkoutBtn.classList.add('checkout-btn-hint');
                this.Debug.log('flow', '[A3-McDonald] 結帳按鈕提示已顯示');
            }
        },

        // =====================================================
        // 普通模式：類別指定餐點彈窗系統
        // =====================================================
        categoryOrder: ['burgers', 'sides', 'drinks', 'desserts'],
        categoryNames: {
            'burgers': '🍔 經典漢堡',
            'sides': '🍟 美味配餐',
            'drinks': '🥤 清涼飲品',
            'desserts': '🍦 繽紛甜點'
        },

        // 顯示類別指定餐點彈窗（普通模式）
        showCategoryAssignmentModal(categoryId) {
            const isNormalAssignedMode = this.state.settings.difficulty === 'normal' &&
                                         this.state.settings.taskType === 'assigned';
            if (!isNormalAssignedMode) return;

            // 取得該類別的指定餐點
            const assignedItems = this.state.gameState.assignedItems || [];
            const categoryItem = assignedItems.find(item => item.category === categoryId);

            if (!categoryItem) {
                // 該類別沒有指定餐點，跳到下一個類別
                this.showNextCategoryModal();
                return;
            }

            const categoryName = this.categoryNames[categoryId] || categoryId;

            // 添加喇叭按钮的 CSS 样式（如果尚未添加）
            if (!document.getElementById('speaker-btn-inline-styles')) {
                const speakerBtnStyles = `
                    <style id="speaker-btn-inline-styles">
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
                    </style>
                `;
                document.head.insertAdjacentHTML('beforeend', speakerBtnStyles);
            }

            // 創建彈窗
            const modal = document.createElement('div');
            modal.id = 'category-assignment-modal';
            modal.className = 'category-assignment-modal';
            modal.innerHTML = `
                <div class="category-modal-content">
                    <div class="category-modal-header">
                        <span class="category-modal-icon">${categoryName.split(' ')[0]}</span>
                        <h2>${categoryName.split(' ').slice(1).join(' ')}</h2>
                    </div>
                    <div class="category-modal-body">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 20px;">
                            <button class="speaker-btn-inline" onclick="event.stopPropagation(); event.preventDefault(); McDonald.repeatCategoryTaskVoice('${categoryId}');" title="重新播放任務語音">
                                🔊
                            </button>
                            <p class="category-modal-instruction" style="margin: 0;">請購買以下指定餐點：</p>
                        </div>
                        <div class="category-modal-item">
                            <span class="item-emoji">${(categoryItem.imageUrl || categoryItem.image) ? `<img src="${categoryItem.imageUrl || categoryItem.image}" onerror="this.style.display='none'" style="width:2em;height:2em;object-fit:contain;vertical-align:middle;">` : (categoryItem.emoji || '🍽️')}</span>
                            <span class="item-name">${categoryItem.name}</span>
                            <span class="item-price">NT$ ${categoryItem.price}</span>
                        </div>
                    </div>
                    <button class="category-modal-btn" onclick="McDonald.closeCategoryModal('${categoryId}')">
                        我知道了
                    </button>
                </div>
            `;

            document.body.appendChild(modal);

            // 播放語音
            if (this.state.settings.speechEnabled && this.speech) {
                this.speech.speak('categoryAssignment', {
                    categoryName: categoryName.replace(/[🍔🍟🥤🍦]/g, '').trim(),
                    itemName: categoryItem.name,
                    price: categoryItem.price
                });
            }

            this.Debug.log('flow', '[A3-McDonald] 普通模式：顯示類別指定餐點彈窗', categoryId, categoryItem.name);
        },

        // 關閉類別彈窗
        closeCategoryModal(categoryId) {
            const modal = document.getElementById('category-assignment-modal');
            if (modal) {
                modal.remove();
            }

            // 切換到該類別（普通模式不自動導航和顯示提示，讓使用者自己找）
            this.selectCategory(categoryId, true);

            // 普通模式：只切換類別，不顯示提示動畫
            // 使用者需要自己找到正確餐點，錯誤3次後才會顯示提示
            this.Debug.log('flow', '[A3-McDonald] 普通模式：使用者需自行選擇餐點');
        },

        // 重新播放類別任務語音（喇叭按鈕功能）
        repeatCategoryTaskVoice(categoryId) {
            // 取得該類別的指定餐點
            const assignedItems = this.state.gameState.assignedItems || [];
            const categoryItem = assignedItems.find(item => item.category === categoryId);

            if (!categoryItem) {
                McDonald.Debug.error('❌ [A3-RepeatVoice] 找不到類別指定餐點:', categoryId);
                return;
            }

            // 播放點擊音效
            this.audio.playSound('beep');

            // 播放任務語音
            const categoryName = this.categoryNames[categoryId] || categoryId;
            if (this.state.settings.speechEnabled && this.speech) {
                this.speech.speak('categoryAssignment', {
                    categoryName: categoryName.replace(/[🍔🍟🥤🍦]/g, '').trim(),
                    itemName: categoryItem.name,
                    price: categoryItem.price
                });
            }

            this.Debug.log('speech', '[A3-RepeatVoice] 重新播放類別任務語音:', categoryId, categoryItem.name);
        },

        // 顯示下一個類別的彈窗
        showNextCategoryModal() {
            const assignedItems = this.state.gameState.assignedItems || [];
            const purchasedItems = this.state.gameState.purchasedItems || [];

            // 找到下一個有未購買指定餐點的類別
            for (const categoryId of this.categoryOrder) {
                const categoryItem = assignedItems.find(item =>
                    item.category === categoryId &&
                    !purchasedItems.some(p => p.id === item.id)
                );

                if (categoryItem) {
                    this.showCategoryAssignmentModal(categoryId);
                    return;
                }
            }

            // 所有類別都購買完成
            this.Debug.log('flow', '[A3-McDonald] 普通模式：所有類別購買完成');
            this.highlightCheckoutButton();
        },

        // 初始化普通模式類別彈窗
        initNormalModeAssignment() {
            // 初始化錯誤計數
            this.state.gameState.categoryErrorCounts = {};
            for (const categoryId of this.categoryOrder) {
                this.state.gameState.categoryErrorCounts[categoryId] = 0;
            }

            // 顯示第一個類別的彈窗
            this.TimerManager.setTimeout(() => {
                this.showNextCategoryModal();
            }, 500, 'screenTransition');
        },

        // =====================================================
        // 困難模式：指定餐點系統
        // =====================================================

        // 初始化困難模式（顯示所有指定餐點彈窗）
        initHardModeAssignment() {
            this.Debug.log('flow', '[A3-McDonald] 困難模式：初始化指定餐點系統');

            // 初始化錯誤計數（困難模式不自動顯示提示）
            this.state.gameState.categoryErrorCounts = {};
            for (const categoryId of this.categoryOrder) {
                this.state.gameState.categoryErrorCounts[categoryId] = 0;
            }

            // 顯示所有指定餐點彈窗
            this.TimerManager.setTimeout(() => {
                this.showHardModeAllItemsModal();
            }, 500, 'screenTransition');
        },

        // 困難模式：顯示所有指定餐點彈窗
        showHardModeAllItemsModal() {
            const assignedItems = this.state.gameState.assignedItems || [];

            if (assignedItems.length === 0) {
                this.Debug.log('flow', '[A3-McDonald] 困難模式：沒有指定餐點');
                return;
            }

            // 按類別分組
            const itemsByCategory = {};
            for (const item of assignedItems) {
                if (!itemsByCategory[item.category]) {
                    itemsByCategory[item.category] = [];
                }
                itemsByCategory[item.category].push(item);
            }

            // 創建彈窗
            const modal = document.createElement('div');
            modal.id = 'hard-mode-assignment-modal';
            modal.className = 'hard-mode-assignment-modal';
            modal.innerHTML = `
                <div class="hard-modal-content" style="
                    background: white;
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 700px;
                    width: 90%;
                    max-height: 85vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    position: relative;
                ">
                    <div class="hard-modal-header" style="text-align: center; margin-bottom: 25px;">
                        <span style="font-size: 2.5em;">🍔</span>
                        <h2 style="color: #c62d42; margin: 10px 0 5px 0; font-size: 1.8em;">${this.state.settings.difficulty === 'normal' ? '普通模式' : '困難模式'} - 指定餐點</h2>
                        <p style="color: #666; margin: 0; font-size: 1.1em;">請記住並購買以下所有餐點</p>
                    </div>
                    <div class="hard-modal-body" style="display: flex; flex-direction: column; gap: 20px;">
                        ${this.categoryOrder.map(categoryId => {
                            const items = itemsByCategory[categoryId] || [];
                            if (items.length === 0) return '';
                            const categoryName = this.categoryNames[categoryId];
                            return `
                                <div class="hard-modal-category" style="
                                    background: linear-gradient(135deg, #fff3cd, #ffe69c);
                                    border-radius: 15px;
                                    padding: 15px 20px;
                                    border: 2px solid #ffcc02;
                                    text-align: center;
                                ">
                                    <div style="font-size: 1.3em; font-weight: 700; color: #c62d42; margin-bottom: 12px; text-align: center;">
                                        ${categoryName}
                                    </div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
                                        ${items.map(item => {
                                            const isPurchased = (this.state.gameState.purchasedItems || []).some(p => p.id === item.id);
                                            return `
                                            <div style="
                                                background: ${isPurchased ? '#e0e0e0' : 'white'};
                                                padding: 10px 15px;
                                                border-radius: 10px;
                                                border: 2px solid ${isPurchased ? '#9e9e9e' : '#ffcc02'};
                                                display: flex;
                                                align-items: center;
                                                gap: 10px;
                                                position: relative;
                                                opacity: ${isPurchased ? '0.6' : '1'};
                                            ">
                                                ${isPurchased ? '<span style="position: absolute; top: 5px; right: 5px; font-size: 1.5em; color: #4CAF50;">✓</span>' : ''}
                                                <span style="font-size: 1.5em; ${isPurchased ? 'filter: grayscale(100%);' : ''}">${(item.imageUrl || item.image) ? `<img src="${item.imageUrl || item.image}" onerror="this.style.display='none'" style="width:2em;height:2em;object-fit:contain;vertical-align:middle;">` : (item.emoji || '🍽️')}</span>
                                                <div>
                                                    <div style="font-weight: 600; color: ${isPurchased ? '#666' : '#333'};">${item.name}</div>
                                                    <div style="color: ${isPurchased ? '#999' : '#c62d42'}; font-weight: 700;">NT$ ${item.price}</div>
                                                </div>
                                                <button onclick="McDonald.speakItemName('${item.name}', ${item.price})" style="
                                                    background: ${isPurchased ? '#9e9e9e' : '#4CAF50'};
                                                    border: none;
                                                    border-radius: 50%;
                                                    width: 32px;
                                                    height: 32px;
                                                    cursor: pointer;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    font-size: 1.1em;
                                                    transition: all 0.2s;
                                                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">🔊</button>
                                            </div>
                                        `}).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <button class="hard-modal-btn" onclick="McDonald.closeHardModeModal()" style="
                        display: block;
                        width: 100%;
                        margin-top: 25px;
                        background: linear-gradient(135deg, #c62d42, #a02236);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 25px;
                        font-size: 1.2em;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 6px 20px rgba(198, 45, 66, 0.4)';"
                       onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                        我記住了，開始點餐！
                    </button>
                </div>
            `;

            // 添加彈窗樣式
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                animation: fadeIn 0.3s ease;
            `;

            document.body.appendChild(modal);
            this.Debug.log('flow', '[A3-McDonald] 困難模式：顯示所有指定餐點彈窗');
            // 不自動播放語音，由使用者點擊喇叭按鈕播放
        },

        // 播放單個餐點名稱（使用系統語音設定）
        speakItemName(itemName, price) {
            this.audio.playSound('beep');
            const text = `${itemName}，${price}元`;

            // 使用與系統相同的語音設定
            if (this.speech && this.speech.synth && this.speech.voice) {
                // 取消之前的語音
                this.speech.synth.cancel();

                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'zh-TW';
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;
                utterance.voice = this.speech.voice; // 使用系統選定的語音

                this.speech.synth.speak(utterance);
                this.Debug.log('flow', '[A3-McDonald] 播放餐點語音:', text, '使用語音:', this.speech.voice.name);
            }
        },

        // 播放所有指定餐點
        speakAllAssignedItems() {
            const assignedItems = this.state.gameState.assignedItems || [];
            if (assignedItems.length === 0) return;

            // 組合所有餐點名稱
            const itemNames = assignedItems.map(item => `${item.name}，${item.price}元`).join('、');
            const text = `請購買以下指定餐點：${itemNames}`;

            if (this.speech && this.speech.synth) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'zh-TW';
                utterance.rate = 1.0;
                if (this.speech.selectedVoice) {
                    utterance.voice = this.speech.selectedVoice;
                }
                this.speech.synth.speak(utterance);
            }
        },

        // 關閉困難模式彈窗
        closeHardModeModal() {
            const modal = document.getElementById('hard-mode-assignment-modal');
            if (modal) {
                modal.remove();
            }
            this.audio.playSound('beep');
            this.Debug.log('flow', '[A3-McDonald] 困難模式：使用者開始點餐');
        },


        // 普通/困難模式：提示按鈕點擊處理
        showHardModeHint() {
            this.audio.playSound('beep');
            const difficulty = this.state.settings.difficulty;
            if (difficulty === 'normal') {
                // 普通模式：顯示下一個未購買指定餐點的單一類別彈窗
                const nextItem = this.getNextAssignedItem();
                if (nextItem) {
                    this.showCategoryAssignmentModal(nextItem.category);
                    this.Debug.log('flow', '[A3-McDonald] 普通模式提示：顯示類別彈窗', nextItem.category);
                } else {
                    // 所有餐點已購買，提示前往結帳
                    this.highlightCheckoutButton();
                    this.speech.speakText('所有餐點已加入訂單，請按下前往結帳鈕');
                    this.Debug.log('flow', '[A3-McDonald] 普通模式提示：所有餐點已購買');
                }
            } else {
                // 困難模式：顯示所有指定餐點彈窗（標記已購買的餐點）
                this.showHardModeAllItemsModal();
                this.Debug.log('flow', '[A3-McDonald] 困難模式：顯示所有指定餐點彈窗（提示功能）');
            }
        },

        // 播放「已將所有餐點加入訂單」語音
        speakCompletionMessage() {
            const text = '已將所有餐點加入訂單，請按下前往結帳鈕，前往結帳';
            this.speech.speakText(text);
            this.Debug.log('flow', '[A3-McDonald] 播放完成語音:', text);
        },

        // 移動到下一個指定餐點（語音完成後調用）
        moveToNextAssignedItem() {
            const nextItem = this.getNextAssignedItem();
            const difficulty = this.state.settings.difficulty;

            if (!nextItem) {
                // 所有指定餐點已購買完成
                this.Debug.log('flow', '[A3-McDonald] 所有指定餐點已購買完成');
                this.updateHints();
                this.markPurchasedItems();

                // 播放「已將所有餐點加入訂單」語音
                this.speakCompletionMessage();

                // 在結帳按鈕添加提示動畫
                this.highlightCheckoutButton();
                return;
            }

            const currentCategory = this.state.gameState.currentCategory;

            if (difficulty === 'normal') {
                // 普通模式：如果下一個餐點在不同類別，顯示類別彈窗
                if (nextItem.category !== currentCategory) {
                    this.Debug.log('flow', '[A3-McDonald] 普通模式：下一個類別', nextItem.category);
                    // 重置該類別的錯誤計數
                    this.state.gameState.categoryErrorCounts[nextItem.category] = 0;
                    // 顯示類別彈窗
                    this.showCategoryAssignmentModal(nextItem.category);
                }
                // 同一類別不需要額外處理，用戶自己選擇
            } else if (difficulty === 'hard') {
                // 困難模式：不自動切換類別，不自動顯示提示
                // 清除所有提示，由用戶自行選擇
                this.clearAllHints();
                this.markPurchasedItems();
                this.Debug.log('flow', '[A3-McDonald] 困難模式：等待用戶自行選擇或按提示按鈕');
            } else {
                // 簡單模式：自動導航到下一個餐點
                if (nextItem.category !== currentCategory) {
                    // 需要切換到不同類別（skipHints = true，由 navigateToItemPage 統一處理提示）
                    this.Debug.log('flow', '[A3-McDonald] 語音完成，自動切換到類別:', nextItem.category);
                    this.selectCategory(nextItem.category, true);

                    // 切換類別後，檢查是否需要跳頁
                    this.TimerManager.setTimeout(() => {
                        this.navigateToItemPage(nextItem);
                    }, 300, 'screenTransition');
                } else {
                    // 同一類別，檢查是否需要跳頁
                    this.navigateToItemPage(nextItem);
                }
            }
        },

        // 導航到指定餐點所在的頁面
        navigateToItemPage(targetItem) {
            const categoryId = targetItem.category;
            const items = this.getAllCategoryItems(categoryId);
            const itemsPerPage = this.state.gameState.itemsPerPage;

            // 找到目標餐點在列表中的索引
            const itemIndex = items.findIndex(item => item.id === targetItem.id);

            if (itemIndex === -1) {
                McDonald.Debug.error('[A3-McDonald] 找不到指定餐點:', targetItem.id);
                this.updateHints();
                this.markPurchasedItems();
                return;
            }

            // 計算目標餐點所在的頁碼
            const targetPage = Math.floor(itemIndex / itemsPerPage);
            const currentPage = this.state.gameState.currentPage;

            this.Debug.log('flow', `[A3-McDonald] 餐點 ${targetItem.name} 位於索引 ${itemIndex}，第 ${targetPage + 1} 頁，當前第 ${currentPage + 1} 頁`);

            if (targetPage !== currentPage) {
                // 需要跳頁
                this.Debug.log('flow', `[A3-McDonald] 自動跳頁到第 ${targetPage + 1} 頁`);
                this.audio.playSound('beep');
                this.state.gameState.currentPage = targetPage;

                // 更新商品顯示（使用正確的選擇器 #item-grid）
                const itemGrid = document.getElementById('item-grid');
                if (itemGrid) {
                    itemGrid.innerHTML = this.HTMLTemplates.menuItems(categoryId);
                }

                // 更新分頁按鈕（使用正確的選擇器 #pagination）
                const pagination = document.getElementById('pagination');
                if (pagination) {
                    pagination.innerHTML = this.HTMLTemplates.paginationButtons(categoryId);
                }

                // 更新提示 - 使用 requestAnimationFrame 確保DOM更新後立即應用，避免視覺跳動
                requestAnimationFrame(() => {
                    this.updateHints();
                    this.markPurchasedItems();
                });
            } else {
                // 同一頁，直接更新提示
                this.updateHints();
                this.markPurchasedItems();
            }
        },

        renderOrderingUI() {
            // 設定美式速食主題背景
            document.body.style.background = 'linear-gradient(135deg, #ffcc02, #ff8f00)';

            // 原本的 render() 內容
            this.render();

            // 綁定觸控事件
            this.bindTouchEvents();

            // 🔧 [輔助點擊模式] 初始化單鍵操作模式
            this.initClickMode();

            // 初始化提示系統（指定餐點模式）
            if (this.state.settings.taskType === 'assigned') {
                const difficulty = this.state.settings.difficulty;

                if (difficulty === 'hard') {
                    // 困難模式：顯示所有指定餐點的彈窗
                    this.initHardModeAssignment();
                } else if (difficulty === 'normal') {
                    // 普通模式：使用類別彈窗系統
                    this.initNormalModeAssignment();
                } else if (difficulty === 'easy') {
                    // 🔧 [簡單模式優化] 先播放語音，再顯示餐點提示動畫
                    this.TimerManager.setTimeout(() => {
                        // 每輪都只播放指令語音「請依提示選擇指定的餐點」
                        const speechKey = 'instructions';
                        // 播放語音，並在播放完畢後執行自動導航
                        this.speech.speak(speechKey, {}, () => {
                            this.Debug.log('flow', '[A3-McDonald] 語音播放完畢，開始顯示餐點提示');
                            // 取得第一個指定餐點，檢查是否需要自動導航
                            const firstItem = this.getNextAssignedItem();
                            if (firstItem) {
                                // 檢查是否需要切換類別（skipHints = true，由 navigateToItemPage 統一處理）
                                if (firstItem.category !== this.state.gameState.currentCategory) {
                                    this.selectCategory(firstItem.category, true);
                                    this.TimerManager.setTimeout(() => {
                                        this.navigateToItemPage(firstItem);
                                    }, 300, 'screenTransition');
                                } else {
                                    // 同類別，檢查是否需要跳頁
                                    this.navigateToItemPage(firstItem);
                                }
                            } else {
                                this.updateHints();
                                this.markPurchasedItems();
                            }
                        });
                    }, 500, 'speechDelay');
                }
            } else if (this.state.settings.taskType === 'freeChoice') {
                // 自選購買模式的初始語音歡迎（僅簡單模式）
                if (this.state.settings.difficulty === 'easy') {
                    this.TimerManager.setTimeout(() => {
                        this.speech.speak('welcomeFreeChoice');
                    }, 1000, 'speechDelay');
                }
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════
        // 🎬 全局動畫樣式注入（避免重複定義）
        // ═══════════════════════════════════════════════════════════════════════════
        injectGlobalAnimationStyles() {
            if (document.getElementById('a3-global-animations')) return;

            const style = document.createElement('style');
            style.id = 'a3-global-animations';
            style.innerHTML = `
                /* 數字輸入彈窗彈跳出現 */
                @keyframes bounceIn {
                    from { opacity: 0; transform: scale(0.3) translateY(-50px); }
                    50% { opacity: 1; transform: scale(1.05) translateY(10px); }
                    70% { transform: scale(0.95) translateY(-5px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                /* 輔助點擊模式中心淡入縮放 */
                @keyframes fadeInCenterScale {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                /* 付款目標脈衝 */
                @keyframes payment-target-pulse {
                    0%, 100% { opacity: 0.7; transform: scale(1); }
                    50% { opacity: 0.9; transform: scale(1.05); }
                }
                /* 勾勾彈出 */
                @keyframes checkmarkPop {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }
                /* 正確答案彈入 */
                @keyframes correctPopIn {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
                /* 錯誤答案彈出 */
                @keyframes wrongPopOut {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    30% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                    60% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                }
                /* 按鈕淡出 */
                @keyframes fadeOutBtn {
                    0% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(0.8); }
                }
                /* 找零提示勾勾彈跳 */
                @keyframes checkBounce {
                    0% { opacity: 0; transform: translateX(-50%) scale(0); }
                    60% { opacity: 1; transform: translateX(-50%) scale(1.3); }
                    100% { opacity: 1; transform: translateX(-50%) scale(1); }
                }
                /* 點擊提示脈衝 */
                @keyframes clickPromptPulse {
                    0%, 100% { opacity: 0.9; }
                    50% { opacity: 0.6; }
                }
                /* 向上淡入 */
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                /* 取餐圖示脈衝 */
                @keyframes pickupIconPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                /* 食物出現 */
                @keyframes foodAppear {
                    0% { opacity: 0; transform: translateY(-30px) scale(0.5); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                /* 完成畫面慶祝 */
                @keyframes celebrate {
                    0% { transform: scale(0.8) rotate(-10deg); opacity: 0; }
                    50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                /* 彈跳動畫 */
                @keyframes bounce {
                    0%, 20%, 60%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-20px); }
                    80% { transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
            this.Debug.log('init', '🎬 全局動畫樣式注入完成');
        },

        // =====================================================
        // 初始化系統
        // =====================================================
        init() {
            this.Debug.log('flow', '[A3-McDonald] 美式速食點餐系統啟動');
            McDonald.Debug.log('init', '📦 [A3-McDonald] 版本: v1.5.1 (2026-02-22) - Debug Logger 嵌套物件修復');

            // 🔧 [Phase 1] 清除所有計時器和事件監聯器（初始化時清除殘留）
            this.TimerManager.clearAll();
            this.EventManager.removeAll();

            // 🎬 注入全局動畫樣式
            this.injectGlobalAnimationStyles();

            // 音效解鎖處理
            this.unlockAudio();

            // 初始化各系統
            this.audio.init();
            this.speech.init();

            // 設置父對象引用
            this.audio.parent = this;
            this.speech.parent = this;

            // 設定語音系統事件監聽
            if ('speechSynthesis' in window) {
                speechSynthesis.addEventListener('voiceschanged', () => {
                    this.speech.setupVoice();
                }, { once: true });
            }

            // 切換到設定場景
            this.SceneManager.switchScene('settings', this);

            this.Debug.log('flow', '[A3-McDonald] 系統初始化完成');
        },

        unlockAudio() {
            const unlockAudioContext = () => {
                this.state.audioUnlocked = true;
                this.Debug.log('flow', '[A3-McDonald] 音頻已解鎖');

                document.removeEventListener('touchstart', unlockAudioContext);
                document.removeEventListener('touchend', unlockAudioContext);
                document.removeEventListener('mousedown', unlockAudioContext);
                document.removeEventListener('keydown', unlockAudioContext);
            };

            document.addEventListener('touchstart', unlockAudioContext, { once: true });
            document.addEventListener('touchend', unlockAudioContext, { once: true });
            document.addEventListener('mousedown', unlockAudioContext, { once: true });
            document.addEventListener('keydown', unlockAudioContext, { once: true });
        },

        // 播放選單音效
        playMenuSelectSound() {
            try {
                // 如果已有音效在播放，先停止它
                if (this.menuSelectAudio) {
                    this.menuSelectAudio.pause();
                    this.menuSelectAudio.currentTime = 0;
                }

                // 創建或重用音效物件
                if (!this.menuSelectAudio) {
                    this.menuSelectAudio = new Audio('../audio/units/click.mp3');
                    this.menuSelectAudio.volume = 0.5;
                    this.menuSelectAudio.preload = 'auto';
                }

                this.menuSelectAudio.currentTime = 0;
                this.menuSelectAudio.play().catch(e => {
                    this.Debug.log('flow', '[A3-McDonald] 音效播放失敗:', e);
                });
            } catch (error) {
                this.Debug.log('flow', '[A3-McDonald] 無法載入選單音效:', error);
            }
        },

        // =====================================================
        // 渲染系統
        // =====================================================
        render() {
            const app = document.getElementById('app');
            if (!app) {
                McDonald.Debug.error('[A3-McDonald] 找不到app容器');
                return;
            }

            app.innerHTML = `
                ${this.HTMLTemplates.titleBar()}
                ${this.HTMLTemplates.mainContent()}
            `;

            this.updateCartDisplay();
        },

        // =====================================================
        // 主要功能方法
        // =====================================================
        selectCategory(categoryId, skipHints = false) {
            this.audio.playSound('beep');
            this.state.gameState.currentCategory = categoryId;
            this.state.gameState.currentPage = 0; // 切換分類時重置到第一頁

            // 更新分類按鈕狀態
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            const activeBtn = document.querySelector(`[data-category="${categoryId}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }

            // 更新商品顯示
            const itemGrid = document.getElementById('item-grid');
            if (itemGrid) {
                itemGrid.innerHTML = this.HTMLTemplates.menuItems(categoryId);
            }

            // 更新分頁按鈕
            const pagination = document.getElementById('pagination');
            if (pagination) {
                pagination.innerHTML = this.HTMLTemplates.paginationButtons(categoryId);
            }

            // 更新提示（指定餐點模式）- 如果 skipHints 為 true 則跳過（由 navigateToItemPage 處理）
            if (this.state.settings.taskType === 'assigned' && !skipHints) {
                // 立即更新，避免視覺跳動
                this.updateHints();
                this.markPurchasedItems();
            }

            // 語音提示 - 使用純文字分類名稱（不含emoji）
            const categoryNames = {
                'burgers': '經典漢堡',
                'sides': '美味配餐',
                'drinks': '清涼飲品',
                'desserts': '繽紛甜點'
            };
            const categoryName = categoryNames[categoryId] || categoryId;
            this.speech.speak('categorySelected', { categoryName });

            this.Debug.log('flow', `[A3-McDonald] 切換到分類: ${categoryId}`);
        },

        // 下一頁
        nextPage() {
            const categoryId = this.state.gameState.currentCategory;
            const items = this.getAllCategoryItems(categoryId);
            const itemsPerPage = this.state.gameState.itemsPerPage;
            const totalPages = Math.ceil(items.length / itemsPerPage);

            if (this.state.gameState.currentPage < totalPages - 1) {
                this.audio.playSound('beep');
                this.state.gameState.currentPage++;

                // 更新商品顯示
                const itemGrid = document.getElementById('item-grid');
                if (itemGrid) {
                    itemGrid.innerHTML = this.HTMLTemplates.menuItems(categoryId);
                }

                // 更新分頁按鈕
                const pagination = document.getElementById('pagination');
                if (pagination) {
                    pagination.innerHTML = this.HTMLTemplates.paginationButtons(categoryId);
                }

                // 更新提示（指定餐點模式）
                if (this.state.settings.taskType === 'assigned') {
                    this.TimerManager.setTimeout(() => {
                        this.updateHints();
                        this.markPurchasedItems();
                    }, 100, 'uiAnimation');
                }

                this.Debug.log('flow', `[A3-McDonald] 翻到第 ${this.state.gameState.currentPage + 1} 頁`);
            }
        },

        // 上一頁
        prevPage() {
            if (this.state.gameState.currentPage > 0) {
                this.audio.playSound('beep');
                this.state.gameState.currentPage--;

                const categoryId = this.state.gameState.currentCategory;

                // 更新商品顯示
                const itemGrid = document.getElementById('item-grid');
                if (itemGrid) {
                    itemGrid.innerHTML = this.HTMLTemplates.menuItems(categoryId);
                }

                // 更新分頁按鈕
                const pagination = document.getElementById('pagination');
                if (pagination) {
                    pagination.innerHTML = this.HTMLTemplates.paginationButtons(categoryId);
                }

                // 更新提示（指定餐點模式）
                if (this.state.settings.taskType === 'assigned') {
                    this.TimerManager.setTimeout(() => {
                        this.updateHints();
                        this.markPurchasedItems();
                    }, 100, 'uiAnimation');
                }

                this.Debug.log('flow', `[A3-McDonald] 翻到第 ${this.state.gameState.currentPage + 1} 頁`);
            }
        },

        addToCart(itemId, categoryId) {
            // 僅在點餐場景中執行，避免設定頁面或其他場景意外加入購物車
            if (this.state.gameState?.currentScene !== 'ordering') {
                this.Debug.log('flow', '[A3] addToCart: 非點餐場景，忽略');
                return;
            }
            // 🆕 防連點檢查
            const now = Date.now();
            if (this._lastAddToCartTime && now - this._lastAddToCartTime < A3_DEBOUNCE.ITEM_SELECT) {
                this.Debug.log('flow', '[A3] addToCart 防抖：忽略重複點擊');
                return;
            }
            this._lastAddToCartTime = now;

            const item = this.getAllCategoryItems(categoryId).find(i => i.id === itemId);
            if (!item) {
                McDonald.Debug.error('[A3-McDonald] 找不到商品:', itemId);
                return;
            }

            // 如果是指定餐點模式，檢查是否點擊了正確的餐點
            if (this.state.settings.taskType === 'assigned') {
                const isAssignedItem = this.state.gameState.assignedItems.some(assigned => assigned.id === itemId);
                // 檢查該餐點需要購買的總數量
                const requiredCount = this.state.gameState.assignedItems.filter(assigned => assigned.id === itemId).length;
                // 檢查已購買的數量
                const purchasedCount = this.state.gameState.purchasedItems.filter(p => p.id === itemId).length;
                const isAlreadyPurchased = purchasedCount >= requiredCount;
                const difficulty = this.state.settings.difficulty;

                if (!isAssignedItem) {
                    // 點擊了非指定的餐點，顯示錯誤提示
                    this.audio.playSound('error');

                    // 取得當前應該購買的餐點
                    const nextItem = this.getNextAssignedItem();
                    const categoryNames = {
                        'burgers': '🍔 經典漢堡',
                        'sides': '🍟 美味配餐',
                        'drinks': '🥤 清涼飲品',
                        'desserts': '🍰 繽紛甜點'
                    };

                    if (difficulty === 'hard') {
                        // 困難模式：只播放錯誤音效，不顯示任何提示（需按提示鈕才會顯示）
                        const currentCategory = nextItem?.category || categoryId;
                        this.state.gameState.categoryErrorCounts[currentCategory] =
                            (this.state.gameState.categoryErrorCounts[currentCategory] || 0) + 1;

                        const errorCount = this.state.gameState.categoryErrorCounts[currentCategory];
                        this.Debug.log('flow', `[A3-McDonald] 困難模式：類別 ${currentCategory} 錯誤次數 ${errorCount}（不自動顯示提示）`);

                        // 不播放語音，只有錯誤音效
                    } else if (difficulty === 'normal') {
                        // 普通模式：計算錯誤次數，3次以上顯示提示動畫
                        const currentCategory = nextItem?.category || categoryId;
                        this.state.gameState.categoryErrorCounts[currentCategory] =
                            (this.state.gameState.categoryErrorCounts[currentCategory] || 0) + 1;

                        const errorCount = this.state.gameState.categoryErrorCounts[currentCategory];
                        this.Debug.log('flow', `[A3-McDonald] 普通模式：類別 ${currentCategory} 錯誤次數 ${errorCount}`);

                        // 播放語音提示
                        this.speech.speak('wrongItem');

                        // 錯誤3次以上，自動顯示提示動畫
                        if (errorCount >= 3 && nextItem) {
                            this.Debug.log('flow', '[A3-McDonald] 普通模式：錯誤3次，顯示提示動畫');
                            // 切換到正確類別並顯示提示
                            if (nextItem.category !== this.state.gameState.currentCategory) {
                                this.selectCategory(nextItem.category, true);
                                this.TimerManager.setTimeout(() => {
                                    this.navigateToItemPage(nextItem);
                                    this.highlightMenuItem(nextItem.id);
                                }, 300, 'screenTransition');
                            } else {
                                this.navigateToItemPage(nextItem);
                                this.highlightMenuItem(nextItem.id);
                            }
                        }
                    } else {
                        // 簡單模式：顯示詳細提示
                        if (nextItem) {
                            this.showToast(`這不是指定的餐點！請購買：${nextItem.name}（NT$ ${nextItem.price}）`, 'error');
                        } else {
                            this.showToast('這不是指定的餐點！所有指定餐點已購買完成。', 'error');
                        }
                    }

                    this.Debug.log('flow', '[A3-McDonald] 點擊了非指定餐點:', item.name);
                    return; // 不加入購物車
                }

                if (isAlreadyPurchased) {
                    // 該指定餐點已經購買過了
                    this.audio.playSound('error');
                    this.showToast(`此餐點已經購買過了！${item.name} 已在購物車中。`, 'error');
                    this.Debug.log('flow', '[A3-McDonald] 指定餐點已購買:', item.name);
                    return; // 不重複加入購物車
                }
            }

            // 簡單、普通或困難模式 + 自選購買：即時檢查是否超過錢包金額
            const isEasyNormalOrHard = this.state.settings.difficulty === 'easy' || this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard';
            if (isEasyNormalOrHard && this.state.settings.taskType === 'freeChoice') {
                const currentTotal = this.state.gameState.totalAmount || 0;
                const walletTotal = this.state.gameState.walletTotal || 0;
                const newTotal = currentTotal + item.price;

                if (newTotal > walletTotal) {
                    this.audio.playSound('error');
                    this.showCartOverBudgetHint();
                    // 播放語音提示
                    this.speech.speak('overBudget');
                    this.Debug.log('flow', '[A3-McDonald] 自選購買模式：加入餐點將超過錢包金額', { item: item.name, newTotal, walletTotal });
                    return; // 不加入購物車
                }
            }

            this.audio.playSound('addToCart');
            if (this.state.settings.difficulty === 'easy' && !this.state.settings.clickMode) this.playStepSuccess(true); // addToCart 已播放 correct02.mp3

            // 檢查購物車中是否已有此商品
            const existingItem = this.state.gameState.cart.find(cartItem => cartItem.id === itemId);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                this.state.gameState.cart.push({
                    ...item,
                    quantity: 1
                });
            }

            // 檢查是否為指定餐點，並標記為已購買
            if (this.state.settings.taskType === 'assigned') {
                const isAssignedItem = this.state.gameState.assignedItems.some(assigned => assigned.id === itemId);
                if (isAssignedItem) {
                    const alreadyPurchased = this.state.gameState.purchasedItems.some(p => p.id === itemId);
                    if (!alreadyPurchased) {
                        this.state.gameState.purchasedItems.push({
                            id: itemId,
                            name: item.name,
                            category: categoryId
                        });
                        this.Debug.log('flow', '[A3-McDonald] 指定餐點已購買:', item.name);
                        // 音效已在 addToCart 開頭播放，不重複播放
                    }
                }
            }

            // 更新總金額
            this.updateTotalAmount();

            // 更新購物車顯示
            this.updateCartDisplay();

            // 播放動畫
            const itemElement = document.querySelector(`[data-item-id="${itemId}"] .add-to-cart-btn`);
            if (itemElement) {
                itemElement.classList.add('add-to-cart-animation');
                this.TimerManager.setTimeout(() => {
                    itemElement.classList.remove('add-to-cart-animation');
                }, 600, 'uiAnimation');
            }

            // 更新提示（指定餐點模式）
            if (this.state.settings.taskType === 'assigned') {
                // 立即清除舊提示
                this.clearAllHints();

                // 使用一個標誌來確保回調只執行一次
                let callbackExecuted = false;
                const executeNextItem = () => {
                    if (!callbackExecuted) {
                        callbackExecuted = true;
                        this.moveToNextAssignedItem();
                    }
                };

                // 播放語音，等待語音完成後再切換到下一個提示
                this.speech.speak('itemAdded', {
                    itemName: item.name,
                    price: item.price
                }, executeNextItem);

                // 設定一個保險計時器：如果8秒後語音回調還沒執行，強制執行
                // （語音「成功將XXX加入購物車，單價XX元」可能需要4~6秒）
                this.TimerManager.setTimeout(executeNextItem, 8000, 'speechDelay');
            } else {
                // 非指定餐點模式，直接播放語音
                this.speech.speak('itemAdded', {
                    itemName: item.name,
                    price: item.price
                });
            }

            this.Debug.log('flow', `[A3-McDonald] 商品加入購物車:`, item.name);
        },

        removeFromCart(itemId) {
            // 簡單模式或普通模式+指定餐點：不允許修改購物車（靜默返回，不播放音效）
            const isAssignedMode = this.state.settings.taskType === 'assigned' &&
                                   (this.state.settings.difficulty === 'easy' || this.state.settings.difficulty === 'normal');
            if (isAssignedMode) {
                this.Debug.log('flow', '[A3-McDonald] 指定餐點模式：阻止刪除操作');
                return;
            }

            this.audio.playSound('beep');

            const itemIndex = this.state.gameState.cart.findIndex(item => item.id === itemId);
            if (itemIndex > -1) {
                const removedItem = this.state.gameState.cart[itemIndex];
                this.state.gameState.cart.splice(itemIndex, 1);

                this.updateTotalAmount();
                this.updateCartDisplay();

                this.speech.speak('itemRemoved', { itemName: removedItem.name });
                this.Debug.log('flow', `[A3-McDonald] 商品從購物車移除:`, removedItem.name);
            }
        },

        increaseQuantity(itemId) {
            // 簡單模式或普通模式+指定餐點：不允許修改購物車（靜默返回，不播放音效）
            const isAssignedMode = this.state.settings.taskType === 'assigned' &&
                                   (this.state.settings.difficulty === 'easy' || this.state.settings.difficulty === 'normal');
            if (isAssignedMode) return;

            const item = this.state.gameState.cart.find(cartItem => cartItem.id === itemId);
            if (!item) return;

            // 簡單、普通或困難模式 + 自選購買：即時檢查增加數量是否超過錢包金額
            const isEasyNormalOrHard = this.state.settings.difficulty === 'easy' || this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard';
            if (isEasyNormalOrHard && this.state.settings.taskType === 'freeChoice') {
                const currentTotal = this.state.gameState.totalAmount || 0;
                const walletTotal = this.state.gameState.walletTotal || 0;
                const newTotal = currentTotal + item.price;

                if (newTotal > walletTotal) {
                    this.audio.playSound('error');
                    this.showCartOverBudgetHint();
                    // 播放語音提示
                    this.speech.speak('overBudget');
                    this.Debug.log('flow', '[A3-McDonald] 自選購買模式：增加數量將超過錢包金額', { item: item.name, newTotal, walletTotal });
                    return; // 不增加數量
                }
            }

            this.audio.playSound('beep');

            item.quantity++;
            this.updateTotalAmount();
            this.updateCartDisplay();
            this.speech.speak('cartUpdated', { total: this.state.gameState.totalAmount });
        },

        decreaseQuantity(itemId) {
            // 簡單模式或普通模式+指定餐點：不允許修改購物車（靜默返回，不播放音效）
            const isAssignedMode = this.state.settings.taskType === 'assigned' &&
                                   (this.state.settings.difficulty === 'easy' || this.state.settings.difficulty === 'normal');
            if (isAssignedMode) return;

            this.audio.playSound('beep');

            const item = this.state.gameState.cart.find(cartItem => cartItem.id === itemId);
            if (item) {
                if (item.quantity > 1) {
                    item.quantity--;
                } else {
                    this.removeFromCart(itemId);
                    return;
                }
                this.updateTotalAmount();
                this.updateCartDisplay();
                this.speech.speak('cartUpdated', { total: this.state.gameState.totalAmount });
            }
        },

        updateTotalAmount() {
            this.state.gameState.totalAmount = this.state.gameState.cart.reduce(
                (total, item) => total + (item.price * item.quantity), 0
            );
        },

        updateCartDisplay() {
            const cartItemsContainer = document.getElementById('cart-items');
            const cartTotalSpan = document.getElementById('cart-total');
            const checkoutBtn = document.getElementById('checkout-btn');

            if (!cartItemsContainer || !cartTotalSpan || !checkoutBtn) return;

            // 判斷是否為簡單模式或困難模式+指定餐點（不顯示修改控制項）
            const isTeachingMode = (this.state.settings.difficulty === 'easy' || this.state.settings.difficulty === 'hard') &&
                                   this.state.settings.taskType === 'assigned';

            if (this.state.gameState.cart.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">您的購物車是空的</p>';
                checkoutBtn.disabled = true;
            } else {
                cartItemsContainer.innerHTML = this.state.gameState.cart
                    .map(item => this.HTMLTemplates.cartItem(item, item.quantity, isTeachingMode))
                    .join('');
                checkoutBtn.disabled = false;
            }

            cartTotalSpan.textContent = `NT$ ${this.state.gameState.totalAmount}`;
        },

        checkout() {
            if (this.state.gameState.cart.length === 0) {
                this.audio.playSound('error');
                this.speech.speak('cartEmpty');
                return;
            }

            const isEasyMode = this.state.settings.difficulty === 'easy';
            const isNormalMode = this.state.settings.difficulty === 'normal';
            const isHardMode = this.state.settings.difficulty === 'hard';
            const isAssignedMode = this.state.settings.taskType === 'assigned';
            const isFreeChoiceMode = this.state.settings.taskType === 'freeChoice';

            // 所有模式+指定餐點：檢查是否所有指定餐點都已購買
            if (isAssignedMode) {
                const assignedItems = this.state.gameState.assignedItems || [];
                const purchasedItems = this.state.gameState.purchasedItems || [];

                // 計算每個餐點需要購買的數量
                const requiredCounts = {};
                assignedItems.forEach(item => {
                    requiredCounts[item.id] = (requiredCounts[item.id] || 0) + 1;
                });

                // 計算已購買的數量
                const purchasedCounts = {};
                purchasedItems.forEach(item => {
                    purchasedCounts[item.id] = (purchasedCounts[item.id] || 0) + 1;
                });

                // 檢查是否有未購買完成的指定餐點
                const unpurchasedItems = assignedItems.filter(item => {
                    const required = requiredCounts[item.id] || 0;
                    const purchased = purchasedCounts[item.id] || 0;
                    return purchased < required;
                });

                if (unpurchasedItems.length > 0) {
                    this.audio.playSound('error');
                    // 去重並顯示未完成的餐點
                    const uniqueUnpurchased = [...new Set(unpurchasedItems.map(item => item.name))];
                    const unpurchasedNames = uniqueUnpurchased.join('、');
                    this.showToast(`請先購買所有指定餐點！尚未完成：${unpurchasedNames}`, 'warning');
                    this.Debug.log('flow', '[A3-McDonald] 指定餐點模式：尚有未購買完成的餐點', unpurchasedItems);
                    return;
                }
            }

            // 簡單、普通或困難模式+自選購買：檢查訂單金額是否超過錢包金額
            if ((isEasyMode || isNormalMode || isHardMode) && isFreeChoiceMode) {
                const orderTotal = this.state.gameState.totalAmount;
                const walletTotal = this.state.gameState.walletTotal || 0;

                if (orderTotal > walletTotal) {
                    this.audio.playSound('error');
                    this.showCartOverBudgetHint();
                    const overAmount = orderTotal - walletTotal;
                    this.showToast(`訂單金額超過錢包金額！超出 NT$ ${overAmount}，請刪除部分餐點。`, 'warning');
                    this.Debug.log('flow', '[A3-McDonald] 自選購買模式：訂單金額超過錢包金額', { orderTotal, walletTotal });
                    return;
                }
            }

            this.audio.playSound('success');
            this.speech.speak('checkout', { total: this.state.gameState.totalAmount });

            // 顯示付款方式選擇畫面
            this.showPaymentMethodSelection();
        },

        // 顯示購物車超出預算提示動畫（只包含購物品項區域）
        showCartOverBudgetHint() {
            const cartItemsSection = document.getElementById('cart-items');
            if (cartItemsSection) {
                // 移除之前的提示類別
                cartItemsSection.classList.remove('cart-over-budget-hint');
                // 強制重繪
                void cartItemsSection.offsetWidth;
                // 添加提示類別
                cartItemsSection.classList.add('cart-over-budget-hint');

                // 5秒後移除提示
                this.TimerManager.setTimeout(() => {
                    cartItemsSection.classList.remove('cart-over-budget-hint');
                }, 5000, 'uiAnimation');
            }
        },

        showPaymentMethodSelection() {
            window.speechSynthesis.cancel();
            const app = document.getElementById('app');
            if (!app) return;

            app.innerHTML = `
                <div class="mcdonalds-container" style="min-height: 100vh; display: flex; flex-direction: column;">
                    ${this.HTMLTemplates.titleBar(2, '完成訂單')}
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #ffcc02, #ff8f00); padding: 40px; overflow-y: auto;">
                        <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.2); max-width: 700px; width: 100%;">

                            <!-- 訂單明細區域 -->
                            <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; margin-bottom: 30px; border: 2px solid #ffcc02;">
                                <h2 style="color: #c62d42; font-size: 1.8em; margin: 0 0 20px 0; text-align: center; border-bottom: 3px solid #c62d42; padding-bottom: 15px;">
                                    📋 訂單明細
                                </h2>

                                <!-- 訂單項目 -->
                                <div style="margin: 20px 0;">
                                    ${this.generateOrderSummary(this.state.gameState.cart)}
                                </div>

                                <!-- 總計 -->
                                <div style="border-top: 3px solid #c62d42; padding-top: 20px; margin-top: 20px; text-align: center;">
                                    <div style="font-size: 1.2em; color: #666; margin-bottom: 10px;">訂單總金額</div>
                                    <div style="font-size: 2.5em; color: #c62d42; font-weight: 700;">NT$ ${this.state.gameState.totalAmount}</div>
                                </div>
                            </div>

                            <!-- 付款方式選擇區域 -->
                            <div style="background: #f8f9fa; padding: 30px; border-radius: 15px; border: 2px solid #ffcc02; text-align: center;">
                                <h2 style="color: #333; font-size: 1.5em; margin-bottom: 25px;">請選擇付款方式：</h2>

                                <div style="display: flex; flex-direction: column; gap: 15px;">
                                    <button id="counter-payment-btn" onclick="McDonald.showCounterPayment()" style="background: linear-gradient(135deg, #ffcc02, #ff8f00); color: #333; border: none; padding: 12px 24px; border-radius: 10px; font-size: 1em; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(255, 204, 2, 0.3); width: fit-content; margin: 0 auto;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 6px 20px rgba(255, 204, 2, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255, 204, 2, 0.3)';">
                                        🏪 至櫃檯排隊付款
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 簡單模式（含輔助點擊模式）：對「至櫃臺排隊付款」鈕顯示提示動畫
            if (this.state.settings.difficulty === 'easy') {
                this.TimerManager.setTimeout(() => {
                    const btn = document.getElementById('counter-payment-btn');
                    if (btn) btn.classList.add('counter-payment-btn-hint');
                }, 300, 'ui');
            }
        },

        quickCheckout() {
            this.audio.playSound('success');
            this.state.gameState.orderNumber = this.generateRandomOrderNumber();
            this.state.gameState.completedOrders++;

            // 模擬結帳處理時間
            this.TimerManager.setTimeout(() => {
                this.completeOrder();
            }, this.timingConfig[this.state.settings.difficulty]?.checkoutDelay || 1500, 'screenTransition');
        },

        // 計算最佳付款組合（優先精確付款，其次找零最小）
        calculateOptimalPaymentTargets(targetAmount, availableMoney) {
            this.Debug.log('flow', '[A3-McDonald] 計算最佳付款方案:', { targetAmount, availableMoney: availableMoney.map(m => m.value) });

            if (!availableMoney || availableMoney.length === 0) {
                return [];
            }

            // 為每個金錢項目添加原始索引
            const moneyWithIndex = availableMoney.map((m, idx) => ({ ...m, originalIndex: idx }));

            // 按面額從小到大排序（方便找最小組合）
            const sortedMoney = [...moneyWithIndex].sort((a, b) => a.value - b.value);

            // 策略1：嘗試找精確付款（不找零）
            const exactResult = this.findExactPaymentWithIndex(targetAmount, sortedMoney);
            if (exactResult.length > 0) {
                this.Debug.log('flow', '[A3-McDonald] 找到精確付款方案:', exactResult.map(m => m.value));
                return exactResult;
            }

            // 策略2：找最接近目標金額且大於等於目標的組合（找零最小）
            let bestResult = null;
            let bestSum = Infinity;

            // 使用回溯法找最小超額組合
            const findMinExcess = (index, currentSum, currentSelection) => {
                // 如果當前總額 >= 目標且小於目前最佳，更新最佳結果
                if (currentSum >= targetAmount && currentSum < bestSum) {
                    bestSum = currentSum;
                    bestResult = currentSelection.slice();
                }

                // 剪枝：如果當前總額已經 >= 最佳結果，不需要繼續
                if (currentSum >= bestSum || index >= sortedMoney.length) {
                    return;
                }

                // 嘗試包含當前金錢
                currentSelection.push(sortedMoney[index]);
                findMinExcess(index + 1, currentSum + sortedMoney[index].value, currentSelection);
                currentSelection.pop();

                // 嘗試不包含當前金錢
                findMinExcess(index + 1, currentSum, currentSelection);
            };

            findMinExcess(0, 0, []);

            if (bestResult && bestResult.length > 0) {
                this.Debug.log('flow', '[A3-McDonald] 找零最小付款方案:', bestResult.map(m => m.value), '總額:', bestSum, '找零:', bestSum - targetAmount);
                return bestResult;
            }

            // 如果沒找到（理論上不應該發生，因為錢包應該夠用），返回空陣列
            this.Debug.log('flow', '[A3-McDonald] 無法找到足夠的付款組合');
            return [];
        },

        // 尋找精確付款組合（帶原始索引）
        findExactPaymentWithIndex(targetAmount, sortedMoney) {
            const n = sortedMoney.length;

            // 使用回溯法尋找精確組合
            function backtrack(index, currentSum, currentSelection) {
                if (currentSum === targetAmount) {
                    return currentSelection.slice();
                }
                if (currentSum > targetAmount || index >= n) {
                    return null;
                }

                // 嘗試選取當前金錢
                currentSelection.push(sortedMoney[index]);
                const withCurrent = backtrack(index + 1, currentSum + sortedMoney[index].value, currentSelection);
                if (withCurrent) return withCurrent;
                currentSelection.pop();

                // 嘗試不選取當前金錢
                return backtrack(index + 1, currentSum, currentSelection);
            }

            return backtrack(0, 0, []) || [];
        },

        // 尋找精確付款組合（舊版本，保留相容性）
        findExactPayment(targetAmount, sortedMoney) {
            return this.findExactPaymentWithIndex(targetAmount, sortedMoney);
        },

        showCounterPayment() {
            // 切換頁面時停止前一頁的語音
            window.speechSynthesis.cancel();
            this.audio.playSound('beep');
            // 重置付款狀態（保留 showPaymentHints 狀態，因為可能是錯誤3次後呼叫）
            this.state.gameState.paymentArea = [];
            this.state.gameState.paidAmount = 0;
            this.state.gameState.paidAmountRevealed = false;
            // 重置錯誤計數與勾勾提示
            this.state.gameState.paymentErrorCount = 0;
            this.state.gameState.walletHintMoney = null;
            // 複製錢包金錢以供付款使用（保留原始錢包資料）
            this.state.gameState.availableWalletMoney = JSON.parse(JSON.stringify(this.state.gameState.walletMoney || []));

            const app = document.getElementById('app');
            if (!app) return;

            // 使用實際錢包金錢（來自歡迎畫面設定）
            const walletMoney = this.state.gameState.availableWalletMoney;

            // 計算最佳付款組合（只顯示足額付款所需的金錢）
            const targetAmount = this.state.gameState.totalAmount;
            const optimalPayment = this.calculateOptimalPaymentTargets(targetAmount, walletMoney);
            this.state.gameState.optimalPaymentTargets = optimalPayment;

            // 普通模式或困難模式：初始不顯示淡化金錢提示
            const isNormalMode = this.state.settings.difficulty === 'normal';
            const isHardMode = this.state.settings.difficulty === 'hard';
            const isEasyMode = this.state.settings.difficulty === 'easy';
            // 困難模式永遠不顯示淡化金錢提示，即使錯誤3次後
            const showTargets = (!isNormalMode && !isHardMode) || (isNormalMode && this.state.gameState.showPaymentHints);
            // 困難模式：確認付款按鈕始終啟用（讓學生可以隨時嘗試）
            const confirmBtnDisabled = isHardMode ? '' : 'disabled';

            // 困難模式/普通模式：付款區提示按鈕
            const paymentHintButton = (isHardMode || isNormalMode) ? `
                <div style="display:flex;align-items:center;gap:6px;">
                <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                <button id="payment-hint-btn" onclick="McDonald.showPaymentHint()" style="
                    background: linear-gradient(135deg, #4caf50, #45a049);
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 15px;
                    font-size: 1em;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
                    white-space: nowrap;
                " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(76, 175, 80, 0.4)';"
                   onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(76, 175, 80, 0.3)';">
                    💡 提示
                </button>
                </div>
            ` : '';

            app.innerHTML = `
                <!-- @keyframes payment-target-pulse 已移至 JS injectGlobalAnimationStyles() -->
                <div class="mcdonalds-container" style="min-height: 100vh; display: flex; flex-direction: column;">
                    <!-- 標題列 -->
                    ${this.HTMLTemplates.titleBar(3, '櫃檯付款')}

                    <!-- 主要內容區 - 左右兩欄式佈局 -->
                    <div style="flex: 1; display: flex; gap: 20px; background: linear-gradient(135deg, #ffcc02, #ff8f00); padding: 20px; overflow-y: auto;">

                        <!-- 左側區域 - 付款區(上) + 我的錢包(下) -->
                        <div style="flex: 2.5; display: flex; flex-direction: column; gap: 20px; overflow: hidden;">

                            <!-- 上方 - 付款區 -->
                            <div style="flex: 1; background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: flex; flex-direction: column;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; position: relative;">
                                    <div style="width: 100px;"></div>
                                    <h2 style="text-align: center; color: #c62d42; margin: 0; font-size: 1.6em; flex: 1;">💰 付款區</h2>
                                    <div style="width: 100px; display: flex; justify-content: flex-end;">${paymentHintButton}</div>
                                </div>
                                <div style="text-align: center; font-size: 1.1em; font-weight: 700; margin-bottom: 15px; display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; align-items: center;">
                                    <span style="color: #c62d42;">應付金額：NT$ ${targetAmount}元</span>
                                    <span id="paid-amount-display" style="color: #4caf50;">${isHardMode ? '已付金額：？？？' : '已付金額：NT$ 0元'}</span>
                                </div>
                                <div id="payment-area" style="flex: 1; min-height: 100px; background: linear-gradient(135deg, #fff3cd, #ffe69c); border: 3px dashed #ffcc02; border-radius: 15px; padding: 15px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: center; overflow-y: auto;">
                                    ${this.generatePaymentTargets(optimalPayment, !showTargets)}
                                </div>

                                <!-- 確認付款按鈕 -->
                                <div style="text-align: center; margin-top: 15px;">
                                    <button id="confirm-payment-btn" onclick="McDonald.confirmPayment()" style="background: linear-gradient(135deg, #4caf50, #45a049); color: white; border: none; padding: 15px 45px; border-radius: 25px; font-size: 1.2em; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3); transition: all 0.3s ease; ${isHardMode ? '' : 'opacity: 0.5; cursor: not-allowed;'}" ${confirmBtnDisabled}>
                                        ✅ 確認付款
                                    </button>
                                </div>
                            </div>

                            <!-- 下方 - 我的錢包 -->
                            <div style="flex: 1; background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden;">
                                <div class="wallet-total-header" style="text-align: center; color: #c62d42; margin: 0 0 15px 0; font-size: 1.6em; font-weight: bold;">我的錢包 總計：${walletMoney.reduce((s, m) => s + m.value, 0)}元</div>
                                <div id="wallet-area" style="flex: 1; display: flex; flex-wrap: wrap; gap: 12px; padding: 15px; overflow-y: auto; background: #f8f9fa; border-radius: 15px; border: 2px solid #ffcc02; align-content: flex-start; justify-content: center;">
                                    ${this.generateWalletMoneyForPayment(walletMoney)}
                                </div>
                            </div>
                        </div>

                        <!-- 右側 - 訂單內容 -->
                        <div style="width: 340px; min-width: 340px; background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden;">
                            <h2 style="text-align: center; color: #c62d42; margin: 0 0 15px 0; font-size: 1.6em;">📋 訂單內容</h2>
                            <div style="flex: 1; background: #f8f9fa; padding: 15px; border-radius: 15px; border: 2px solid #ffcc02; overflow-y: auto;">
                                ${this.generateOrderSummary(this.state.gameState.cart)}
                            </div>
                            <div style="border-top: 3px solid #c62d42; padding-top: 15px; margin-top: 15px; text-align: center;">
                                <div style="font-size: 1em; color: #666; margin-bottom: 5px;">應付金額</div>
                                <strong style="font-size: 1.8em; color: #c62d42;">NT$ ${this.state.gameState.totalAmount}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 初始化拖曳功能
            this.TimerManager.setTimeout(() => this.initializeDragAndDrop(), 100, 'uiAnimation');
        },

        generateWalletMoney(moneyDenominations) {
            let html = '';
            moneyDenominations.forEach(money => {
                for (let i = 0; i < money.count; i++) {
                    html += `
                        <div class="money-item" draggable="true" data-value="${money.value}" data-image="${money.image}"
                             style="cursor: grab; text-align: center; padding: 10px; background: white; border: 2px solid #ffcc02; border-radius: 10px; transition: all 0.3s ease;"
                             onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2)';"
                             onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                            <img src="../images/${money.image}" alt="${money.value}元" style="width: 80px; height: auto; display: block; margin: 0 auto 5px auto; pointer-events: none;">
                            <div style="font-weight: 700; color: #c62d42; font-size: 1.1em;">NT$ ${money.value}</div>
                        </div>
                    `;
                }
            });
            return html;
        },

        // 從實際錢包金錢生成付款頁面的錢包顯示（由小至大排列）
        // 顯示我的錢包彈窗（自選購買模式 - 步驟1選餐頁面）
        showWalletPopup() {
            const walletMoney = this.state.gameState.walletMoney || [];
            const total = walletMoney.reduce((s, m) => s + m.value, 0);

            // 播放「我的錢包總共 X 元」語音
            this.speech.speak('walletInfo', { total: total });

            // 產生金錢圖示 HTML（由小至大排列，僅顯示，不可拖曳）
            const sortedMoney = [...walletMoney].sort((a, b) => a.value - b.value);
            const coinsHtml = sortedMoney.length === 0
                ? '<div style="color:#999;text-align:center;padding:20px;">錢包是空的</div>'
                : sortedMoney.map(money => {
                    const face = Math.random() < 0.5 ? 'front' : 'back';
                    const imgSrc = money.images ? money.images[face] : `../images/money/${money.value}_yuan_${face}.png`;
                    const imgWidth = money.value >= 100 ? '90px' : '55px';
                    return `
                        <div style="text-align:center;padding:8px;background:white;border:2px solid #ffcc02;border-radius:10px;">
                            <img src="${imgSrc}" alt="${money.value}元" style="width:${imgWidth};height:auto;display:block;margin:0 auto 4px auto;">
                            <div style="font-weight:700;color:#c62d42;font-size:1em;">NT$ ${money.value}</div>
                        </div>`;
                }).join('');

            const modalHtml = `
                <div id="wallet-popup-overlay" onclick="McDonald.closeWalletPopup()"
                     style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:9000;">
                    <div onclick="event.stopPropagation()"
                         style="background:white;border-radius:20px;padding:25px;width:420px;max-width:92vw;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 8px 30px rgba(0,0,0,0.3);">
                        <!-- 標題 -->
                        <div style="text-align:center;margin-bottom:15px;">
                            <div style="font-size:1.8em;">💰</div>
                            <h2 style="margin:5px 0;color:#c62d42;font-size:1.4em;">我的錢包</h2>
                            <div style="font-size:1.6em;font-weight:700;color:#333;">共 <span style="color:#c62d42;">${total}</span> 元</div>
                        </div>
                        <!-- 金錢圖示區 -->
                        <div style="flex:1;overflow-y:auto;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;padding:12px;background:#f8f9fa;border-radius:12px;border:2px solid #ffcc02;margin-bottom:15px;">
                            ${coinsHtml}
                        </div>
                        <!-- 關閉按鈕 -->
                        <button onclick="McDonald.closeWalletPopup()"
                                style="background:linear-gradient(135deg,#ff9800,#f57c00);color:white;border:none;padding:12px;border-radius:10px;font-size:1em;font-weight:700;cursor:pointer;width:100%;">
                            關閉
                        </button>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        },

        // 關閉我的錢包彈窗
        closeWalletPopup() {
            document.getElementById('wallet-popup-overlay')?.remove();
        },

        generateWalletMoneyForPayment(walletMoney) {
            if (!walletMoney || walletMoney.length === 0) {
                return '<div style="color: #999; text-align: center; padding: 20px;">錢包是空的</div>';
            }

            // 由左至右，由小至大排列
            const sortedMoney = [...walletMoney].sort((a, b) => a.value - b.value);

            let html = '';
            sortedMoney.forEach((money, index) => {
                // 隨機選擇正面或反面
                const randomFace = Math.random() < 0.5 ? 'front' : 'back';
                // 取得金錢圖片路徑
                const imagePath = money.images ? money.images[randomFace] : `../images/money/${money.value}_yuan_${randomFace}.png`;
                const imageFile = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;
                const isPaperMoney = money.value >= 100;
                const imgWidth = isPaperMoney ? '100px' : '60px';

                html += `
                    <div class="money-item" draggable="true" data-index="${index}" data-value="${money.value}" data-image="${imageFile}"
                         style="cursor: grab; text-align: center; padding: 10px; background: white; border: 2px solid #ffcc02; border-radius: 10px; transition: all 0.3s ease;"
                         onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2)';"
                         onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                        <img src="${imagePath}" alt="${money.value}元" style="width: ${imgWidth}; height: auto; display: block; margin: 0 auto 5px auto; pointer-events: none;">
                        <div style="font-weight: 700; color: #c62d42; font-size: 1.1em;">NT$ ${money.value}</div>
                    </div>
                `;
            });
            return html;
        },

        // 生成付款區的淡化金錢目標（紙鈔大於硬幣）
        generatePaymentTargets(walletMoney, hidden = false) {
            if (!walletMoney || walletMoney.length === 0) {
                return '<div style="color: #999; text-align: center; padding: 20px;">沒有金錢可付款</div>';
            }

            // 初始化付款目標追蹤
            this.state.gameState.paymentTargets = walletMoney.map((money, index) => ({
                index,
                value: money.value,
                filled: false
            }));

            // 如果是隱藏模式（普通模式初始），只顯示提示文字但保留放置功能
            if (hidden) {
                return `<div id="payment-drop-zone" style="color: #999; text-align: center; padding: 20px; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">請將金錢拖曳至此</div>`;
            }

            let html = '';
            walletMoney.forEach((money, index) => {
                // 隨機選擇正面或反面
                const randomFace = Math.random() < 0.5 ? 'front' : 'back';
                const imagePath = money.images ? money.images[randomFace] : `../images/money/${money.value}_yuan_${randomFace}.png`;
                const isPaperMoney = money.value >= 100;
                const imgWidth = isPaperMoney ? '90px' : '55px';

                html += `
                    <div class="payment-target faded"
                         data-target-index="${index}"
                         data-expected-value="${money.value}"
                         style="text-align: center; padding: 10px; background: rgba(255, 255, 255, 0.8);
                                border: 3px dashed #ffcc02; border-radius: 10px;
                                opacity: 0.4; filter: grayscale(80%);">
                        <img src="${imagePath}" alt="${money.value}元"
                             style="width: ${imgWidth}; height: auto; display: block; margin: 0 auto 5px auto; pointer-events: none;">
                        <div style="font-weight: 700; color: #c62d42; font-size: 1em;">NT$ ${money.value}</div>
                    </div>
                `;
            });
            return html;
        },

        // 困難模式：顯示付款提示（彈窗 + 在應付金錢上顯示綠色勾）
        showPaymentHint() {
            this.audio.playSound('beep');

            const totalAmount = this.state.gameState.totalAmount;
            const paidAmount = this.state.gameState.paidAmount;
            const difficulty = this.state.settings.difficulty;

            // 普通/困難模式：先退回付款區金錢到錢包，再計算完整最佳付款組合
            // 同時記住退回前的已付金額，供困難模式短暫顯示
            const capturedPaidAmount = paidAmount;
            if (paidAmount > 0) {
                this.returnPaymentToWallet();
            }

            // 計算最佳付款組合（基於全部錢包金錢）
            const availableMoney = this.state.gameState.availableWalletMoney || [];
            const optimalMoney = this.findExactPayment(totalAmount, availableMoney);

            // 困難模式：按提示後永久解鎖已付金額顯示
            const _revealPaidAmount = () => {
                if (difficulty === 'hard') {
                    this.state.gameState.paidAmountRevealed = true;
                    if (capturedPaidAmount > 0) {
                        this._updatePaidAmountDisplay(capturedPaidAmount);
                        this.TimerManager.clearByCategory('paidReveal');
                        this.TimerManager.setTimeout(() => {
                            this._updatePaidAmountDisplay();
                        }, 3000, 'paidReveal');
                    }
                }
            };

            if (!optimalMoney || optimalMoney.length === 0) {
                // 回退到原本的 optimalPaymentTargets（完整 money 物件，含 images）
                const optimalPayment = this.state.gameState.optimalPaymentTargets;
                if (!optimalPayment || optimalPayment.length === 0) {
                    this.Debug.log('flow', '[A3-McDonald] 沒有付款目標');
                    return;
                }
                // 用 fallback 物件顯示相同彈窗
                this.state.gameState.walletHintMoney = optimalPayment;
                this._lastPaymentHintSpeech = this.generateHintSpeech(optimalPayment);
                _revealPaidAmount();

                const valueCounts = {};
                optimalPayment.forEach(m => { valueCounts[m.value] = (valueCounts[m.value] || 0) + 1; });
                const sortedValues = Object.keys(valueCounts).map(Number).sort((a, b) => b - a);
                let hintListHTML = '';
                sortedValues.forEach(val => {
                    const cnt = valueCounts[val];
                    const moneyData = this.moneyItems.find(item => item.value === val);
                    const imgSrc = moneyData?.images?.front || '';
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

                const existingFallback = document.getElementById('a3PaymentHintModal');
                if (existingFallback) existingFallback.remove();
                document.body.insertAdjacentHTML('beforeend', `
                    <div id="a3PaymentHintModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:10050;">
                        <div style="background:linear-gradient(135deg,#fff 0%,#f8f9fa 100%);border-radius:20px;max-width:460px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;border:3px solid #FF9800;">
                            <div style="background:linear-gradient(135deg,#FF9800 0%,#FFb040 100%);padding:20px 30px;display:flex;align-items:center;justify-content:center;gap:12px;color:white;">
                                <span style="font-size:40px;line-height:1;">💡</span>
                                <h2 style="margin:0;font-size:22px;font-weight:bold;text-shadow:0 2px 4px rgba(0,0,0,0.2);">付款提示</h2>
                            </div>
                            <div style="padding:24px 30px;">
                                <p style="font-size:16px;color:#555;margin-bottom:16px;font-weight:500;text-align:center;">建議的付款方式：</p>
                                ${hintListHTML}
                            </div>
                            <div style="padding:0 30px 24px;display:flex;gap:10px;justify-content:center;">
                                <button onclick="McDonald.replayPaymentHintSpeech()"
                                    style="background:linear-gradient(135deg,#4caf50,#45a049);border:none;color:white;padding:8px 18px;border-radius:25px;cursor:pointer;font-size:16px;display:flex;align-items:center;gap:6px;">
                                    🔊 再播一次
                                </button>
                                <button onclick="McDonald.confirmPaymentHint()"
                                    style="background:linear-gradient(135deg,#FF9800,#e65100);border:none;color:white;padding:8px 22px;border-radius:25px;cursor:pointer;font-size:16px;font-weight:bold;">
                                    我知道了
                                </button>
                            </div>
                        </div>
                    </div>
                `);
                this.speech.speakText(this._lastPaymentHintSpeech);
                this.Debug.log('flow', '[A3-McDonald] 顯示付款提示彈窗（fallback）', optimalPayment.map(m => m.value));
                return;
            }

            // 儲存最佳付款方案供確認按鈕使用
            this.state.gameState.walletHintMoney = optimalMoney;
            this._lastPaymentHintSpeech = this.generateHintSpeech(optimalMoney);

            // 解鎖已付金額顯示
            _revealPaidAmount();

            // 建立提示清單 HTML（含金錢圖片）
            const valueCounts = {};
            optimalMoney.forEach(m => { valueCounts[m.value] = (valueCounts[m.value] || 0) + 1; });
            const sortedValues = Object.keys(valueCounts).map(Number).sort((a, b) => b - a);
            let hintListHTML = '';
            sortedValues.forEach(val => {
                const cnt = valueCounts[val];
                const moneyData = this.moneyItems.find(item => item.value === val);
                const imgSrc = moneyData ? `../images/${moneyData.image}` : '';
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

            // 顯示提示彈窗
            const existingModal = document.getElementById('a3PaymentHintModal');
            if (existingModal) existingModal.remove();

            const modalHTML = `
                <div id="a3PaymentHintModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:10050;">
                    <div style="background:linear-gradient(135deg,#fff 0%,#f8f9fa 100%);border-radius:20px;max-width:460px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;border:3px solid #FF9800;">
                        <div style="background:linear-gradient(135deg,#FF9800 0%,#FFb040 100%);padding:20px 30px;display:flex;align-items:center;justify-content:center;gap:12px;color:white;">
                            <span style="font-size:40px;line-height:1;">💡</span>
                            <h2 style="margin:0;font-size:22px;font-weight:bold;text-shadow:0 2px 4px rgba(0,0,0,0.2);">付款提示</h2>
                        </div>
                        <div style="padding:24px 30px;">
                            <p style="font-size:16px;color:#555;margin-bottom:16px;font-weight:500;text-align:center;">建議的付款方式：</p>
                            ${hintListHTML}
                        </div>
                        <div style="padding:0 30px 24px;display:flex;gap:10px;justify-content:center;">
                            <button onclick="McDonald.replayPaymentHintSpeech()"
                                style="background:linear-gradient(135deg,#4caf50,#45a049);border:none;color:white;padding:8px 18px;border-radius:25px;cursor:pointer;font-size:16px;display:flex;align-items:center;gap:6px;">
                                🔊 再播一次
                            </button>
                            <button onclick="McDonald.confirmPaymentHint()"
                                style="background:linear-gradient(135deg,#FF9800,#e65100);border:none;color:white;padding:8px 22px;border-radius:25px;cursor:pointer;font-size:16px;font-weight:bold;">
                                我知道了
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // 播放語音提示
            this.speech.speakText(this._lastPaymentHintSpeech);

            this.Debug.log('flow', '[A3-McDonald] 顯示付款提示彈窗', optimalMoney.map(m => m.value));
        },

        // 重播付款提示語音
        replayPaymentHintSpeech() {
            this.audio.playSound('click');
            if (this._lastPaymentHintSpeech) {
                this.speech.speakText(this._lastPaymentHintSpeech);
            }
        },

        // 確認付款提示彈窗，套用視覺勾勾提示
        confirmPaymentHint() {
            this.audio.playSound('click');
            const modal = document.getElementById('a3PaymentHintModal');
            if (modal) modal.remove();
            if (this.state.gameState.walletHintMoney) {
                this.showWalletHintWithTicks(this.state.gameState.walletHintMoney);
            }
        },

        // 更新已付金額顯示（困難模式初始隱藏，按提示後短暫顯示3秒再隱藏）
        // overrideAmount：若指定，暫時以此金額顯示（用於退回錢包後仍顯示退回前的金額）
        _updatePaidAmountDisplay(overrideAmount = null) {
            const el = document.getElementById('paid-amount-display');
            if (!el) return;
            const isHardMode = this.state.settings.difficulty === 'hard';
            if (isHardMode && !this.state.gameState.paidAmountRevealed) {
                el.textContent = '已付金額：？？？';
            } else {
                const amount = overrideAmount !== null ? overrideAmount : this.state.gameState.paidAmount;
                el.textContent = `已付金額：NT$ ${amount}元`;
            }
        },

        generateHintSpeech(moneyList) {
            const counts = {};
            moneyList.forEach(m => { counts[m.value] = (counts[m.value] || 0) + 1; });
            const parts = Object.keys(counts).map(Number).sort((a, b) => b - a).map(value => {
                return `${counts[value]}個${value}元`;
            });
            let text = '小提示，你可以付';
            if (parts.length > 1) {
                const last = parts.pop();
                text += parts.join('、') + '、和' + last;
            } else {
                text += parts[0];
            }
            return text;
        },

        // 在錢包金錢上顯示綠色勾（原 showPaymentHint 的 DOM 操作邏輯）
        _showCheckmarksOnWallet(optimalPayment) {
            const walletArea = document.getElementById('wallet-area');
            if (!walletArea) return;

            const moneyItems = walletArea.querySelectorAll('.money-item');
            const neededValues = optimalPayment.map(m => m.value);
            const markedCounts = {};

            moneyItems.forEach(item => {
                const value = parseInt(item.dataset.value);
                const neededCount = neededValues.filter(v => v === value).length;
                markedCounts[value] = markedCounts[value] || 0;

                if (markedCounts[value] < neededCount) {
                    if (!item.querySelector('.payment-hint-checkmark')) {
                        const checkmark = document.createElement('div');
                        checkmark.className = 'payment-hint-checkmark';
                        checkmark.innerHTML = '✓';
                        checkmark.style.cssText = `
                            position: absolute;
                            top: 5px;
                            right: 5px;
                            width: 28px;
                            height: 28px;
                            background: #4caf50;
                            color: white;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 18px;
                            font-weight: bold;
                            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.5);
                            animation: checkmarkPop 0.3s ease;
                        `;
                        item.style.position = 'relative';
                        item.appendChild(checkmark);
                    }
                    markedCounts[value]++;
                }
            });

            // @keyframes checkmarkPop 已移至 JS injectGlobalAnimationStyles()

            this.Debug.log('flow', '[A3-McDonald] 顯示付款提示（checkmark方式）', optimalPayment.map(m => m.value));
        },

        initializeDragAndDrop() {
            let moneyItems = document.querySelectorAll('.money-item');
            let paymentArea = document.getElementById('payment-area');
            let paymentTargets = document.querySelectorAll('.payment-target');

            if (!paymentArea) return;

            // 重要：克隆付款區元素以移除所有舊的事件監聽器，防止事件堆疊
            const newPaymentArea = paymentArea.cloneNode(true);
            paymentArea.parentNode.replaceChild(newPaymentArea, paymentArea);
            paymentArea = newPaymentArea;

            // 同樣克隆金錢項目以移除舊的事件監聽器
            moneyItems.forEach(item => {
                const newItem = item.cloneNode(true);
                item.parentNode.replaceChild(newItem, item);
            });
            // 重新獲取克隆後的金錢項目和付款目標
            moneyItems = document.querySelectorAll('.money-item');
            paymentTargets = document.querySelectorAll('.payment-target');

            // 儲存當前拖曳的元素
            let currentDraggedItem = null;

            // 為每個金錢項目添加拖曳事件
            moneyItems.forEach(item => {
                item.addEventListener('dragstart', (e) => {
                    currentDraggedItem = item;
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        index: parseInt(item.dataset.index),
                        value: parseInt(item.dataset.value),
                        image: item.dataset.image
                    }));
                    // 🆕 去背拖曳預覽：直接用 img 元素（在 opacity 前呼叫確保圖像完整）
                    const _dragImg = item.querySelector('img');
                    if (_dragImg && e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                        const imgW = _dragImg.offsetWidth || 60;
                        const imgH = _dragImg.offsetHeight || imgW;
                        e.dataTransfer.setDragImage(_dragImg, imgW / 2, imgH / 2);
                    }
                    item.style.opacity = '0.5';
                });

                item.addEventListener('dragend', (e) => {
                    item.style.opacity = '1';
                    currentDraggedItem = null;
                });
            });

            // 為每個付款目標添加拖放事件
            paymentTargets.forEach(target => {
                target.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!target.classList.contains('filled')) {
                        target.style.borderColor = '#4caf50';
                        target.style.background = 'rgba(76, 175, 80, 0.2)';
                    }
                });

                target.addEventListener('dragleave', (e) => {
                    if (!target.classList.contains('filled')) {
                        target.style.borderColor = '#ffcc02';
                        target.style.background = 'rgba(255, 255, 255, 0.5)';
                    }
                });

                target.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    target.style.borderColor = '#ffcc02';
                    target.style.background = 'rgba(255, 255, 255, 0.5)';

                    try {
                        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                        const expectedValue = parseInt(target.dataset.expectedValue);

                        if (data.value === expectedValue && !target.classList.contains('filled')) {
                            this.fillPaymentTarget(target, data, currentDraggedItem);
                        } else {
                            // 錯誤時只播放音效，不彈窗，金錢自動退回
                            this.audio.playSound('error');
                            // 將金錢退回原位（顯示被拖曳的元素）
                            if (currentDraggedItem) {
                                currentDraggedItem.style.display = '';
                            }
                        }
                    } catch (error) {
                        McDonald.Debug.error('拖曳數據解析錯誤:', error);
                    }
                });
            });

            // 付款區整體也接收拖曳
            // 判斷是否為普通模式或困難模式（接受任何金錢）
            const isNormalMode = this.state.settings.difficulty === 'normal';
            const isHardMode = this.state.settings.difficulty === 'hard';
            const isFreeChoiceMode = this.state.settings.taskType === 'freeChoice';

            // 自選購買模式：允許自由付款（不限制必須符合目標）
            const allowFreePayment = (isNormalMode || isHardMode) && paymentTargets.length === 0;
            // 簡單模式+自選購買：也允許自由付款（可以多付錢）
            const allowExtraPayment = isFreeChoiceMode;

            paymentArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                // 允許自由付款時：付款區整體高亮
                if (allowFreePayment || allowExtraPayment) {
                    paymentArea.style.borderColor = '#4caf50';
                    paymentArea.style.background = 'linear-gradient(135deg, #e8f5e9, #c8e6c9)';
                }
            });

            paymentArea.addEventListener('dragleave', (e) => {
                // 允許自由付款時：恢復原樣
                if (allowFreePayment || allowExtraPayment) {
                    paymentArea.style.borderColor = '#ffcc02';
                    paymentArea.style.background = 'linear-gradient(135deg, #fff3cd, #ffe69c)';
                }
            });

            paymentArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // 允許自由付款時：直接接受任何金錢
                if (allowFreePayment) {
                    paymentArea.style.borderColor = '#ffcc02';
                    paymentArea.style.background = 'linear-gradient(135deg, #fff3cd, #ffe69c)';

                    try {
                        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                        this.addMoneyToPaymentArea(data, currentDraggedItem);
                    } catch (error) {
                        McDonald.Debug.error('拖曳數據解析錯誤:', error);
                    }
                    return;
                }

                // 自選購買模式（簡單模式）：允許額外付款（落在付款區但不在目標上也可以）
                if (allowExtraPayment && (e.target === paymentArea || e.target.id === 'payment-drop-zone' || e.target.classList.contains('placed-money'))) {
                    paymentArea.style.borderColor = '#ffcc02';
                    paymentArea.style.background = 'linear-gradient(135deg, #fff3cd, #ffe69c)';

                    try {
                        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                        this.addMoneyToPaymentArea(data, currentDraggedItem);
                    } catch (error) {
                        McDonald.Debug.error('拖曳數據解析錯誤:', error);
                    }
                    return;
                }

                // 指定餐點模式：需要落在目標上才處理
                // 如果落在付款區但不在具體目標上，播放錯誤音效
                if (e.target === paymentArea || e.target.id === 'payment-drop-zone') {
                    // 錯誤時只播放音效，不彈窗
                    this.audio.playSound('error');
                    // 金錢自動退回原位
                    if (currentDraggedItem) {
                        currentDraggedItem.style.display = '';
                    }
                }
            });

            // ========== 新增：支援從付款區拖曳金錢回錢包 ==========

            // 為已放置的金錢添加拖曳事件
            const setupPlacedMoneyDrag = () => {
                const placedMoneyItems = document.querySelectorAll('.placed-money[draggable="true"]');
                placedMoneyItems.forEach(item => {
                    item.addEventListener('dragstart', (e) => {
                        currentDraggedItem = item;
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', JSON.stringify({
                            value: parseInt(item.dataset.value),
                            image: item.dataset.image,
                            source: 'payment-area'
                        }));
                        // 🆕 去背拖曳預覽：直接用 img 元素（在 opacity 前呼叫確保圖像完整）
                        const _dragImg = item.querySelector('img');
                        if (_dragImg && e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                            const imgW = _dragImg.offsetWidth || 60;
                            const imgH = _dragImg.offsetHeight || imgW;
                            e.dataTransfer.setDragImage(_dragImg, imgW / 2, imgH / 2);
                        }
                        item.style.opacity = '0.5';
                    });

                    item.addEventListener('dragend', (e) => {
                        item.style.opacity = '1';
                        currentDraggedItem = null;
                    });
                });
            };

            // 為已填充的付款目標添加拖曳事件
            const setupFilledTargetDrag = () => {
                const filledTargets = document.querySelectorAll('.payment-target.filled');
                filledTargets.forEach(target => {
                    // 🆕 檢查是否已鎖定，已鎖定的不設置拖曳
                    if (target.dataset.locked === 'true') {
                        target.draggable = false;
                        target.style.cursor = 'default';
                        return;
                    }

                    target.draggable = true;
                    target.style.cursor = 'grab';

                    target.addEventListener('dragstart', (e) => {
                        currentDraggedItem = target;
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', JSON.stringify({
                            value: parseInt(target.dataset.filledValue || target.dataset.expectedValue),
                            image: target.dataset.filledImage,
                            source: 'payment-target'
                        }));
                        // 🆕 去背拖曳預覽：直接用 img 元素（在 opacity 前呼叫確保圖像完整）
                        const _dragImg = target.querySelector('img');
                        if (_dragImg && e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                            const imgW = _dragImg.offsetWidth || 60;
                            const imgH = _dragImg.offsetHeight || imgW;
                            e.dataTransfer.setDragImage(_dragImg, imgW / 2, imgH / 2);
                        }
                        target.style.opacity = '0.5';
                    });

                    target.addEventListener('dragend', (e) => {
                        target.style.opacity = '1';
                        currentDraggedItem = null;
                    });
                });
            };

            // 為錢包區域添加接收金錢的事件
            const walletArea = document.getElementById('wallet-area');
            if (walletArea) {
                walletArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    walletArea.style.borderColor = '#4caf50';
                    walletArea.style.background = '#e8f5e9';
                });

                walletArea.addEventListener('dragleave', (e) => {
                    walletArea.style.borderColor = '#ffcc02';
                    walletArea.style.background = '#f8f9fa';
                });

                walletArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    walletArea.style.borderColor = '#ffcc02';
                    walletArea.style.background = '#f8f9fa';

                    try {
                        const dataString = e.dataTransfer.getData('text/plain');

                        // 如果沒有數據，直接返回（可能是從錢包拖到錢包）
                        if (!dataString) {
                            this.Debug.log('flow', '[A3-McDonald] 無拖曳數據，忽略 drop 事件');
                            return;
                        }

                        const data = JSON.parse(dataString);

                        // 處理來自付款區的自由金錢
                        if (data.source === 'payment-area') {
                            this.returnSingleMoneyToWallet(data.value, data.image, currentDraggedItem);
                        }
                        // 處理來自已填充目標的金錢
                        else if (data.source === 'payment-target') {
                            this.unfillPaymentTarget(currentDraggedItem, data.value, data.image);
                        }
                    } catch (error) {
                        McDonald.Debug.error('拖曳數據解析錯誤:', error);
                    }
                });
            }

            // 初始化已放置金錢和已填充目標的拖曳功能
            setupPlacedMoneyDrag();
            setupFilledTargetDrag();

            // 初始化觸控螢幕支援
            this.initializeTouchDragForPayment();
        },

        // 填充付款目標
        fillPaymentTarget(target, data, draggedElement) {
            // 🔧 輔助點擊模式：不允許使用者直接拖曳付款，須透過點擊模式操作
            // draggedElement 為 null 代表由 autoPayMoney 呼叫（允許），非 null 代表使用者直接拖曳（封鎖）
            if (draggedElement && this.state.settings.clickMode && this.state.gameState.clickModeState?.enabled) {
                this.audio.playSound('error');
                if (draggedElement.style) draggedElement.style.opacity = '1';
                return;
            }

            this.audio.playSound('beep');
            if (this.state.settings.difficulty === 'easy' && !this.state.settings.clickMode) this.playStepSuccess();

            // 標記目標為已填充，並儲存金錢資訊以便退回
            target.classList.remove('faded');
            target.classList.add('filled');
            target.style.opacity = '1';
            target.style.filter = 'none'; // 🆕 移除灰階濾鏡
            target.style.border = '3px solid #4caf50';
            target.style.background = 'rgba(76, 175, 80, 0.1)';
            target.dataset.filledValue = data.value;
            target.dataset.filledImage = data.image;

            // 🆕 簡單模式：禁止拖曳回錢包（正確放置後鎖定）
            if (this.state.settings.difficulty === 'easy') {
                target.dataset.locked = 'true';
                target.draggable = false;
                target.style.cursor = 'default';
            }

            // 從錢包移除金錢
            if (draggedElement) {
                draggedElement.remove();
            }

            // 從可用錢包資料中移除
            const awm = this.state.gameState.availableWalletMoney;
            const awmIdx = awm.findIndex(m => m.value === data.value);
            if (awmIdx > -1) {
                awm.splice(awmIdx, 1);
            }

            // 更新付款金額
            this.state.gameState.paymentArea.push({ value: data.value, image: data.image });
            this.state.gameState.paidAmount += data.value;

            // 更新顯示
            this._updatePaidAmountDisplay();
            this.updateWalletTotalDisplay();

            // 防抖動語音播報（快速拖曳只播最後一個）
            if (this.state.gameState.paymentSpeechTimer) {
                this.TimerManager.clearTimeout(this.state.gameState.paymentSpeechTimer);
            }
            this.state.gameState.paymentSpeechTimer = this.TimerManager.setTimeout(() => {
                const amt = this.state.gameState.paidAmount;
                const diff = this.state.settings.difficulty;
                const shouldSpeak = diff !== 'hard' || this.state.gameState.paidAmountRevealed;
                if (amt > 0 && shouldSpeak && this.speech.synth && this.speech.voice && this.state.settings.speechEnabled) {
                    this.speech.synth.cancel();
                    const u = new SpeechSynthesisUtterance(`已付${NumberSpeechUtils.convertToChineseNumber(amt)}元`);
                    u.voice = this.speech.voice;
                    u.rate = 1.0;
                    u.lang = this.speech.voice.lang;
                    u.onerror = (e) => { if (e.error !== 'interrupted') McDonald.Debug.warn('audio', '[A3-付款語音]', e.error); };
                    this.speech.synth.speak(u);
                }
            }, 500, 'paymentSpeech');

            // 🆕 更新付款按鈕狀態（參考 A4）
            this.updatePaymentButtonState();

            this.Debug.log('flow', `[A3-McDonald] 付款目標填充: ${data.value}元, 總計: ${this.state.gameState.paidAmount}元`);
        },

        // 🆕 重新渲染付款區（基於狀態）
        renderPaymentArea() {
            const paymentArea = document.getElementById('payment-area');
            if (!paymentArea) return;

            // 清空付款區
            paymentArea.innerHTML = '';

            // 如果沒有金錢，顯示提示文字
            if (this.state.gameState.paymentArea.length === 0) {
                paymentArea.innerHTML = `
                    <div id="payment-drop-zone" style="text-align: center; padding: 40px 20px; color: #666; font-size: 1.1em; border: 3px dashed #ccc; border-radius: 15px; background: rgba(255, 255, 255, 0.5);">
                        💵 將錢包中的金錢拖曳到這裡進行付款
                    </div>
                `;
                return;
            }

            // 渲染所有付款區的金錢
            this.state.gameState.paymentArea.forEach(money => {
                const isPaperMoney = money.value >= 100;
                const imgWidth = isPaperMoney ? '90px' : '55px';
                const moneyHtml = `
                    <div class="placed-money" draggable="true" data-value="${money.value}" data-image="${money.image || money.value + '_yuan_front.png'}"
                         style="cursor: grab; text-align: center; padding: 10px; background: white; border: 3px solid #4caf50; border-radius: 10px; transition: all 0.3s ease;"
                         onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 15px rgba(76, 175, 80, 0.3)';"
                         onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                        <img src="../images/money/${money.image || money.value + '_yuan_front.png'}" alt="${money.value}元" style="width: ${imgWidth}; height: auto; display: block; margin: 0 auto 5px auto; pointer-events: none;">
                        <div style="font-weight: 700; color: #4caf50; font-size: 1em;">NT$ ${money.value}</div>
                    </div>
                `;
                paymentArea.insertAdjacentHTML('beforeend', moneyHtml);
            });
        },

        // 🆕 更新付款按鈕狀態（參考 A4 邏輯）
        updatePaymentButtonState() {
            const confirmBtn = document.getElementById('confirm-payment-btn');
            if (!confirmBtn) return;

            const difficulty = this.state.settings.difficulty;
            const paidAmount = this.state.gameState.paidAmount;
            const orderTotal = this.state.gameState.totalAmount;

            if (difficulty === 'hard') {
                // 困難模式：按鈕始終可用
                confirmBtn.disabled = false;
                confirmBtn.style.opacity = '1';
                confirmBtn.style.cursor = 'pointer';
                confirmBtn.textContent = '✅ 確認付款';
            } else if (difficulty === 'normal') {
                // 🆕 普通模式：參考 A4，只有金額足夠時才啟用
                if (paidAmount >= orderTotal) {
                    confirmBtn.disabled = false;
                    confirmBtn.style.opacity = '1';
                    confirmBtn.style.cursor = 'pointer';
                    confirmBtn.textContent = '✅ 確認付款';
                } else {
                    confirmBtn.disabled = true;
                    confirmBtn.style.opacity = '0.5';
                    confirmBtn.style.cursor = 'not-allowed';
                    confirmBtn.textContent = `還需要${orderTotal - paidAmount}元`;
                }
            } else {
                // 簡單模式：金額足夠時可用
                if (paidAmount >= orderTotal) {
                    confirmBtn.disabled = false;
                    confirmBtn.style.opacity = '1';
                    confirmBtn.style.cursor = 'pointer';
                    confirmBtn.textContent = '✅ 確認付款';
                    // 🎯 簡單模式：顯示「點這裡」提示動畫
                    if (!confirmBtn.classList.contains('checkout-btn-hint')) {
                        this.TimerManager.setTimeout(() => {
                            confirmBtn.classList.add('checkout-btn-hint');
                        }, 300, 'hint');
                    }
                } else {
                    confirmBtn.disabled = true;
                    confirmBtn.style.opacity = '0.5';
                    confirmBtn.style.cursor = 'not-allowed';
                    confirmBtn.textContent = `還需要${orderTotal - paidAmount}元`;
                    confirmBtn.classList.remove('checkout-btn-hint');
                }
            }
        },

        // 🆕 在錢包區顯示綠色打勾提示（參考 A4）
        showWalletHintWithTicks(moneyList) {
            this.Debug.log('hint', '✅ [A3-打勾提示] showWalletHintWithTicks 被調用', { moneyList });

            const walletContainer = document.getElementById('wallet-area');
            if (!walletContainer) {
                McDonald.Debug.error('✅ [A3-打勾提示] 錯誤：找不到錢包容器');
                return;
            }

            // 清除之前的提示效果
            walletContainer.querySelectorAll('.money-item.show-correct-tick').forEach(item => {
                item.classList.remove('show-correct-tick');
            });

            // 統計需要提示的錢幣數量
            const moneyCount = {};
            moneyList.forEach(money => {
                const value = money.value;
                moneyCount[value] = (moneyCount[value] || 0) + 1;
            });
            this.Debug.log('hint', '✅ [A3-打勾提示] 需要提示的錢幣統計:', moneyCount);

            // 為每個面額找到足夠數量的、尚未被標記的錢幣元素
            Object.keys(moneyCount).forEach(valueStr => {
                const value = parseInt(valueStr);
                let needed = moneyCount[valueStr];
                const availableItems = walletContainer.querySelectorAll(`.money-item[data-value="${value}"]`);

                for (const item of availableItems) {
                    if (needed > 0 && !item.classList.contains('show-correct-tick')) {
                        item.classList.add('show-correct-tick');
                        needed--;
                        this.Debug.log('hint', `✅ [A3-打勾提示] 已為錢幣 ${value}元 添加打勾`);
                    }
                    if (needed === 0) break;
                }
            });

            // 打勾持續顯示，直到金錢被拖曳到付款區時自然隨 DOM 元素移除而消失
        },

        // 🆕 在付款區顯示紅色×提示（參考 A4）
        highlightPaymentMoney(moneyList) {
            this.Debug.log('hint', '🔥 [A3-錯誤提示] highlightPaymentMoney 被調用', { moneyList });

            // 清除之前的錯誤提示效果
            const existingHighlights = document.querySelectorAll('.placed-money.show-error-x');
            existingHighlights.forEach(item => {
                item.classList.remove('show-error-x');
            });

            // 統計需要提示的錢幣數量
            const moneyCount = {};
            moneyList.forEach(money => {
                const value = money.value;
                moneyCount[value] = (moneyCount[value] || 0) + 1;
            });
            this.Debug.log('hint', '🔥 [A3-錯誤提示] 需要提示的錢幣統計:', moneyCount);

            // 獲取所有付款區的錢幣元素
            const allPaymentItems = document.querySelectorAll('.placed-money');

            // 按面額分組付款區錢幣
            const paymentItemsByValue = {};
            allPaymentItems.forEach(item => {
                const value = parseInt(item.dataset.value);
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
                    this.Debug.log('hint', `🔥 [A3-錯誤提示] 已為錢幣 ${value}元 添加×動畫`);
                });
            });
            this.Debug.log('hint', '🔥 [A3-錯誤提示] 實際添加效果的錢幣數量:', highlightCount);

            // 3秒後移除錯誤提示效果
            this.TimerManager.setTimeout(() => {
                const highlightedItems = document.querySelectorAll('.show-error-x');
                this.Debug.log('hint', `🔥 [A3-錯誤提示] 3秒後移除×動畫，數量: ${highlightedItems.length}`);
                highlightedItems.forEach(item => {
                    item.classList.remove('show-error-x');
                });
            }, 3000, 'uiAnimation');
        },

        // 普通模式：添加金錢到付款區（無需目標匹配）
        addMoneyToPaymentArea(data, draggedElement) {
            // 🔧 輔助點擊模式：不允許使用者直接拖曳付款，須透過點擊模式操作
            if (draggedElement && this.state.settings.clickMode && this.state.gameState.clickModeState?.enabled) {
                this.audio.playSound('error');
                if (draggedElement.style) draggedElement.style.opacity = '1';
                return;
            }

            this.audio.playSound('beep');

            // 從錢包移除金錢
            if (draggedElement) {
                draggedElement.remove();
            }

            // 從可用錢包中移除
            const availableMoney = this.state.gameState.availableWalletMoney;
            const moneyIndex = availableMoney.findIndex(m => m.value === data.value);
            if (moneyIndex > -1) {
                availableMoney.splice(moneyIndex, 1);
            }

            // 更新付款金額
            this.state.gameState.paymentArea.push({ value: data.value, image: data.image });
            this.state.gameState.paidAmount += data.value;

            // 🆕 重新渲染付款區（基於狀態，確保UI與資料一致）
            this.renderPaymentArea();

            // 更新顯示
            this._updatePaidAmountDisplay();
            this.updateWalletTotalDisplay();

            // 防抖動語音播報
            if (this.state.gameState.paymentSpeechTimer) {
                this.TimerManager.clearTimeout(this.state.gameState.paymentSpeechTimer);
            }
            this.state.gameState.paymentSpeechTimer = this.TimerManager.setTimeout(() => {
                const amt = this.state.gameState.paidAmount;
                const diff = this.state.settings.difficulty;
                const shouldSpeak = diff !== 'hard' || this.state.gameState.paidAmountRevealed;
                if (amt > 0 && shouldSpeak && this.speech.synth && this.speech.voice && this.state.settings.speechEnabled) {
                    this.speech.synth.cancel();
                    const u = new SpeechSynthesisUtterance(`已付${NumberSpeechUtils.convertToChineseNumber(amt)}元`);
                    u.voice = this.speech.voice;
                    u.rate = 1.0;
                    u.lang = this.speech.voice.lang;
                    u.onerror = (e) => { if (e.error !== 'interrupted') McDonald.Debug.warn('audio', '[A3-付款語音]', e.error); };
                    this.speech.synth.speak(u);
                }
            }, 500, 'paymentSpeech');

            // 🆕 更新付款按鈕狀態（參考 A4）
            this.updatePaymentButtonState();

            // 重新綁定拖曳事件以支援剛添加的金錢
            this.TimerManager.setTimeout(() => this.initializeDragAndDrop(), 50, 'uiAnimation');

            this.Debug.log('flow', `[A3-McDonald] 普通模式：金錢加入付款區 ${data.value}元, 總計: ${this.state.gameState.paidAmount}元`);
        },

        initializeTouchDragForPayment() {
            if (!window.TouchDragUtility) {
                McDonald.Debug.warn('event', '⚠️ TouchDragUtility 未載入，跳過觸控支援');
                return;
            }

            try {
                this.Debug.log('payment', '🎯 [A3-櫃檯付款] 初始化 TouchDragUtility 觸控支援');

                const app = document.getElementById('app');
                if (!app) {
                    McDonald.Debug.error('❌ 找不到遊戲區域');
                    return;
                }

                // 取消之前的註冊
                window.TouchDragUtility.unregisterDraggable(app);

                // 🔧 [觸控修復] 註冊drop zones - 先註冊具體目標，後註冊容器
                // 這樣可以確保觸控檢測時優先匹配具體目標

                // 先註冊所有付款目標（具體目標）
                document.querySelectorAll('.payment-target').forEach(target => {
                    window.TouchDragUtility.registerDropZone(target);
                });

                // 後註冊付款區域（容器）
                const paymentArea = document.getElementById('payment-area');
                if (paymentArea) {
                    window.TouchDragUtility.registerDropZone(paymentArea);
                }

                // 註冊錢包區域為drop zone（接收退回的金錢）
                const walletArea = document.getElementById('wallet-area');
                if (walletArea) {
                    window.TouchDragUtility.registerDropZone(walletArea);
                }

                // 🔧 [調試] 檢查有多少個 money-item 元素
                const moneyItems = app.querySelectorAll('.money-item[draggable="true"]');
                this.Debug.log('payment', `🔍 [A3-櫃檯付款] 找到 ${moneyItems.length} 個可拖曳金錢元素`);
                moneyItems.forEach((item, index) => {
                    this.Debug.log('payment', `  - 金錢 ${index + 1}:`, {
                        value: item.dataset.value,
                        draggable: item.getAttribute('draggable'),
                        className: item.className
                    });
                });

                // 🔧 [修復] 合併所有可拖曳元素的選擇器，避免後續註冊覆蓋前面的
                window.TouchDragUtility.registerDraggable(
                    app,
                    '.money-item[draggable="true"], .placed-money[draggable="true"], .payment-target.filled',
                    {
                        onDragStart: (element, event) => {
                            const elementType = element.classList.contains('money-item') ? '錢包金錢' :
                                              element.classList.contains('placed-money') ? '已放置金錢' :
                                              element.classList.contains('payment-target') ? '已填充目標' : '未知';
                            McDonald.Debug.log('event', `📱 觸控拖曳開始: ${elementType}`, element.dataset.value || element.dataset.filledValue);

                            // 🆕 簡單模式：檢查已填充目標是否已鎖定
                            if (element.classList.contains('payment-target') && element.dataset.locked === 'true') {
                                McDonald.Debug.log('event', '📱 簡單模式：已鎖定的付款目標無法拖曳');
                                return false;
                            }

                            return true;
                        },
                        onDrop: (draggedElement, dropZone, receivedEvent) => {
                            McDonald.Debug.log('event', '📱 觸控放置:', draggedElement.dataset.value || draggedElement.dataset.filledValue);

                            // 🔧 判斷拖曳元素的類型
                            const isMoneyItem = draggedElement.classList.contains('money-item');
                            const isPlacedMoney = draggedElement.classList.contains('placed-money');
                            const isFilledTarget = draggedElement.classList.contains('payment-target');

                            // === 處理錢包金錢拖曳 ===
                            if (isMoneyItem) {
                                const value = parseInt(draggedElement.dataset.value);
                                const image = draggedElement.dataset.image;
                                const isNormalMode = this.state.settings.difficulty === 'normal';
                                const isHardMode = this.state.settings.difficulty === 'hard';
                                const isFreeChoiceMode = this.state.settings.taskType === 'freeChoice';
                                const paymentArea = document.getElementById('payment-area');
                                const walletArea = document.getElementById('wallet-area');
                                const hasTargets = paymentArea.querySelector('.payment-target');

                                // 允許自由付款的條件
                                const allowFreePayment = (isNormalMode || isHardMode) && !hasTargets;
                                const allowExtraPayment = isFreeChoiceMode;

                                // 自由付款模式：直接接受任何金錢
                                if (allowFreePayment && (dropZone === paymentArea || paymentArea.contains(dropZone))) {
                                    this.addMoneyToPaymentArea({ value, image }, draggedElement);
                                    return;
                                }

                                // 檢查是否放置在具體的付款目標上
                                const paymentTarget = dropZone.closest('.payment-target');
                                if (paymentTarget) {
                                    const expectedValue = parseInt(paymentTarget.dataset.expectedValue);
                                    if (value === expectedValue && !paymentTarget.classList.contains('filled')) {
                                        this.fillPaymentTarget(paymentTarget, { value, image }, draggedElement);
                                    } else {
                                        // 錯誤時只播放音效，不彈窗，金錢自動退回
                                        this.audio.playSound('error');
                                    }
                                } else {
                                    // 檢查是否放置在付款區但不在目標上
                                    if (dropZone === paymentArea || paymentArea.contains(dropZone)) {
                                        // 自選購買模式：允許額外付款
                                        if (allowExtraPayment || !hasTargets) {
                                            this.addMoneyToPaymentArea({ value, image }, draggedElement);
                                        } else {
                                            // 指定餐點模式：有目標但沒放在目標上，播放錯誤音效
                                            this.audio.playSound('error');
                                        }
                                    }
                                }
                            }

                            // === 處理已放置金錢拖曳（拖回錢包）===
                            else if (isPlacedMoney) {
                                const value = parseInt(draggedElement.dataset.value);
                                const image = draggedElement.dataset.image;
                                const walletArea = document.getElementById('wallet-area');

                                // 檢查是否放置在錢包區域
                                if (dropZone === walletArea || walletArea.contains(dropZone)) {
                                    this.returnSingleMoneyToWallet(value, image, draggedElement);
                                } else {
                                    // 不在錢包區域，播放錯誤音效
                                    this.audio.playSound('error');
                                }
                            }

                            // === 處理已填充目標拖曳（拖回錢包重置）===
                            else if (isFilledTarget) {
                                const value = parseInt(draggedElement.dataset.filledValue || draggedElement.dataset.expectedValue);
                                const image = draggedElement.dataset.filledImage;
                                const walletArea = document.getElementById('wallet-area');

                                McDonald.Debug.log('event', '📱 觸控退回已填充目標:', value);

                                // 檢查是否放置在錢包區域
                                if (dropZone === walletArea || walletArea.contains(dropZone)) {
                                    this.unfillPaymentTarget(draggedElement, value, image);
                                } else {
                                    // 不在錢包區域，播放錯誤音效
                                    this.audio.playSound('error');
                                }
                            }
                        }
                    }
                );

                this.Debug.log('payment', '✅ [A3-櫃檯付款] 觸控支援初始化完成');
            } catch (error) {
                McDonald.Debug.error('❌ [A3-櫃檯付款] 觸控支援初始化失敗:', error);
            }
        },

        // 注意：此函數已移除，改用 addMoneyToPaymentArea(data, draggedElement) 統一處理

        confirmPayment() {
            const totalAmount = this.state.gameState.totalAmount;
            const paidAmount = this.state.gameState.paidAmount;
            const difficulty = this.state.settings.difficulty;
            const isEasyMode = difficulty === 'easy';
            const isNormalMode = difficulty === 'normal';
            const isHardMode = difficulty === 'hard';

            // 檢查是否有多付（普通和困難模式）
            const checkOverpayment = () => {
                if (isEasyMode) return { isOverpaid: false, unnecessaryItems: [] };

                const paymentArea = this.state.gameState.paymentArea || [];

                // 🆕 找出最優付款組合（找零最少）
                const findOptimalPaymentIndices = () => {
                    let bestIndices = null;
                    let minChange = Infinity;

                    const n = paymentArea.length;
                    // 遍歷所有可能的組合（使用位元遮罩）
                    for (let mask = 1; mask < (1 << n); mask++) {
                        let sum = 0;
                        const indices = [];

                        for (let i = 0; i < n; i++) {
                            if (mask & (1 << i)) {
                                sum += paymentArea[i].value;
                                indices.push(i);
                            }
                        }

                        // 找出 >= totalAmount 且找零最少的組合
                        if (sum >= totalAmount && sum - totalAmount < minChange) {
                            minChange = sum - totalAmount;
                            bestIndices = indices;
                        }
                    }

                    return bestIndices;
                };

                const optimalIndices = findOptimalPaymentIndices();

                if (!optimalIndices) {
                    return { isOverpaid: false, unnecessaryItems: [] };
                }

                // 找出不在最優組合中的錢幣（這些是多餘的）
                const unnecessaryItems = [];
                paymentArea.forEach((item, index) => {
                    if (!optimalIndices.includes(index)) {
                        unnecessaryItems.push(item);
                    }
                });

                if (unnecessaryItems.length > 0) {
                    const totalExcess = unnecessaryItems.reduce((sum, item) => sum + item.value, 0);
                    this.Debug.log('flow', `[A3-McDonald] 最優付款組合索引: ${optimalIndices}, 多餘錢幣數量: ${unnecessaryItems.length}`);
                    return {
                        isOverpaid: true,
                        unnecessaryItems: unnecessaryItems,
                        excess: totalExcess
                    };
                }

                return { isOverpaid: false, unnecessaryItems: [] };
            };

            if (paidAmount < totalAmount) {
                // 金額不足
                this.audio.playSound('error');

                if (isNormalMode) {
                    // 🆕 普通模式：計算錯誤次數，第3次才顯示綠色✓提示（參考A4視覺效果）
                    this.state.gameState.paymentErrorCount = (this.state.gameState.paymentErrorCount || 0) + 1;
                    const errorCount = this.state.gameState.paymentErrorCount;
                    this.Debug.log('flow', `[A3-McDonald] 普通模式：付款錯誤次數 ${errorCount}（金額不足）`);

                    const neededAmount = totalAmount - paidAmount;

                    // 普通模式：先退回付款區金錢到錢包
                    this.returnPaymentToWallet();

                    if (errorCount >= 3) {
                        // 第3次錯誤：顯示詳細提示 + 綠色✓動畫
                        this.Debug.log('flow', '[A3-McDonald] 普通模式：錯誤3次，顯示綠色✓提示');

                        // 退回後重新計算完整的最佳付款組合（優先精確，其次最小找零）
                        const availableMoney = this.state.gameState.availableWalletMoney || [];
                        const exactMoney = this.findExactPayment(totalAmount, availableMoney);
                        const optimalMoney = exactMoney.length > 0
                            ? exactMoney
                            : (this.state.gameState.optimalPaymentTargets || []);

                        if (optimalMoney && optimalMoney.length > 0) {
                            // 生成語音文字
                            const moneyNames = optimalMoney.map(m => m.value + '元');
                            const moneyCounts = {};
                            moneyNames.forEach(name => {
                                moneyCounts[name] = (moneyCounts[name] || 0) + 1;
                            });
                            const speechParts = Object.keys(moneyCounts).map(name => {
                                const count = moneyCounts[name];
                                return count > 1 ? `${count}個${name}` : `1個${name}`;
                            });
                            const speechText = `需要付${totalAmount}元，請付${speechParts.join('、')}，請再試一次`;

                            // 使用高品質語音系統播放
                            this.speech.speakText(speechText);
                            this.Debug.log('flow', `[A3-McDonald] 播放語音: ${speechText}`);

                            // 儲存提示組合，DOM 已同步重建，立即顯示勾勾（不能用計時器，用戶點擊比計時器快）
                            this.state.gameState.walletHintMoney = optimalMoney;
                            this.showWalletHintWithTicks(optimalMoney);
                        } else {
                            // 付款金額不足的簡單提示
                            this.speech.speakText('付款金額不足，請再試一次');
                        }
                    } else {
                        // 前2次錯誤：只播放簡單語音，不顯示提示
                        this.speech.speak('paymentInsufficient');
                    }

                    return;
                } else if (isHardMode) {
                    // 困難模式：計算錯誤次數
                    this.state.gameState.paymentErrorCount = (this.state.gameState.paymentErrorCount || 0) + 1;
                    const errorCount = this.state.gameState.paymentErrorCount;
                    this.Debug.log('flow', `[A3-McDonald] 困難模式：付款錯誤次數 ${errorCount}（金額不足）`);

                    // 播放語音提示
                    this.speech.speak('paymentInsufficient');

                    // 困難模式不顯示淡化金錢提示，直接退回錢包
                    this.returnPaymentToWallet();
                } else {
                    // 簡單模式：顯示詳細提示
                    this.showToast(`付款金額不足！還差 NT$ ${totalAmount - paidAmount}`, 'error');
                }
            } else {
                // 金額足夠，檢查是否多付（普通和困難模式）
                const overpaymentCheck = checkOverpayment();

                if (overpaymentCheck.isOverpaid) {
                    // 多付了不必要的錢
                    this.audio.playSound('error');

                    if (isNormalMode) {
                        // 🆕 普通模式：計算錯誤次數，第3次才顯示紅色×提示（參考A4視覺效果）
                        this.state.gameState.paymentErrorCount = (this.state.gameState.paymentErrorCount || 0) + 1;
                        const errorCount = this.state.gameState.paymentErrorCount;
                        const excessAmount = overpaymentCheck.excess;
                        const unnecessaryItems = overpaymentCheck.unnecessaryItems;
                        this.Debug.log('flow', `[A3-McDonald] 普通模式：付款錯誤次數 ${errorCount}（多付了 ${excessAmount} 元）`);

                        // 普通模式：先退回付款區金錢到錢包
                        this.returnPaymentToWallet();

                        if (errorCount >= 3) {
                            // 第3次錯誤：退回後顯示正確付款的綠色✓提示
                            this.Debug.log('flow', '[A3-McDonald] 普通模式：錯誤3次（多付），退回後顯示正確付款提示');

                            // 退回後重新計算完整的最佳付款組合（優先精確，其次最小找零）
                            const availableMoney = this.state.gameState.availableWalletMoney || [];
                            const exactMoney = this.findExactPayment(totalAmount, availableMoney);
                            const optimalMoney = exactMoney.length > 0
                                ? exactMoney
                                : (this.state.gameState.optimalPaymentTargets || []);

                            if (optimalMoney && optimalMoney.length > 0) {
                                const moneyNames = optimalMoney.map(m => m.value + '元');
                                const moneyCounts = {};
                                moneyNames.forEach(name => {
                                    moneyCounts[name] = (moneyCounts[name] || 0) + 1;
                                });
                                const speechParts = Object.keys(moneyCounts).map(name => {
                                    const count = moneyCounts[name];
                                    return count > 1 ? `${count}個${name}` : `1個${name}`;
                                });
                                const speechText = `需要付${totalAmount}元，請付${speechParts.join('、')}，請再試一次`;

                                this.speech.speakText(speechText);
                                this.Debug.log('flow', `[A3-McDonald] 播放語音: ${speechText}`);

                                // 儲存提示組合，DOM 已同步重建，立即顯示勾勾（不能用計時器，用戶點擊比計時器快）
                                this.state.gameState.walletHintMoney = optimalMoney;
                                this.showWalletHintWithTicks(optimalMoney);
                            } else {
                                this.speech.speakText('你付了太多的錢，請再試一次');
                            }
                        } else {
                            // 前2次錯誤：只播放簡單語音，不顯示提示
                            this.speech.speak('paymentOverpaid');
                        }

                        return;
                    } else if (isHardMode) {
                        // 困難模式：計算錯誤次數
                        this.state.gameState.paymentErrorCount = (this.state.gameState.paymentErrorCount || 0) + 1;
                        const errorCount = this.state.gameState.paymentErrorCount;
                        this.Debug.log('flow', `[A3-McDonald] 困難模式：付款錯誤次數 ${errorCount}（多付了 ${overpaymentCheck.excess} 元）`);

                        // 播放語音提示
                        this.speech.speak('paymentOverpaid');

                        // 困難模式不顯示淡化金錢提示，直接退回錢包
                        this.returnPaymentToWallet();
                    }
                } else {
                    // 付款正確
                    this.state.gameState.walletHintMoney = null; // 清除提示
                    this.audio.playSound('success');
                    if (this.state.settings.difficulty === 'easy' && !this.state.settings.clickMode) this.playStepSuccess(true); // success 已播放 correct02.mp3
                    const change = paidAmount - totalAmount;

                    // 困難模式：不論有無找零，都先進入計算找零場景
                    if (isHardMode) {
                        this.TimerManager.setTimeout(() => {
                            this.SceneManager.switchScene('calculation', this);
                        }, 500, 'screenTransition');
                    } else {
                        // 簡單/普通模式：直接顯示找零驗證頁面
                        if (change > 0) {
                            // 有找零
                            this.TimerManager.setTimeout(() => {
                                this.showChangeVerification(change);
                            }, 500, 'screenTransition');
                        } else {
                            // 剛好付清（0元找零），仍然顯示找零頁面
                            this.TimerManager.setTimeout(() => {
                                this.SceneManager.switchScene('change', this);
                                this.showChangeVerification(0);
                            }, 500, 'screenTransition');
                        }
                    }
                }
            }
        },

        // 將付款區的金錢退回錢包（普通模式付款錯誤時使用）
        updateWalletTotalDisplay() {
            const header = document.querySelector('.wallet-total-header');
            if (header) {
                const total = (this.state.gameState.availableWalletMoney || []).reduce((s, m) => s + m.value, 0);
                header.textContent = `我的錢包 總計：${total}元`;
            }
        },

        returnPaymentToWallet() {
            const paymentArea = this.state.gameState.paymentArea || [];
            const walletMoney = this.state.gameState.availableWalletMoney || [];

            // 將付款區的金錢加回可用錢包
            paymentArea.forEach(money => {
                walletMoney.push(money);
            });

            // 清空付款區和重置已付金額
            this.state.gameState.paymentArea = [];
            this.state.gameState.paidAmount = 0;

            // 更新UI
            const paymentAreaEl = document.getElementById('payment-area');
            const walletAreaEl = document.getElementById('wallet-area');
            const confirmBtn = document.getElementById('confirm-payment-btn');

            if (paymentAreaEl) {
                const showTargets = this.state.gameState.showPaymentHints;
                const optimalPayment = this.state.gameState.optimalPaymentTargets || [];
                // 使用 generatePaymentTargets 確保 drop-zone ID 存在
                paymentAreaEl.innerHTML = this.generatePaymentTargets(optimalPayment, !showTargets);
            }

            if (walletAreaEl) {
                walletAreaEl.innerHTML = this.generateWalletMoneyForPayment(walletMoney);
            }

            this._updatePaidAmountDisplay();
            this.updateWalletTotalDisplay();

            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = '0.5';
                confirmBtn.style.cursor = 'not-allowed';
            }

            // 重新綁定拖曳事件
            this.TimerManager.setTimeout(() => this.initializeDragAndDrop(), 100, 'uiAnimation');

            this.Debug.log('flow', '[A3-McDonald] 付款區金錢已退回錢包');
        },

        // 將單個金錢從付款區退回錢包（拖曳回錢包時使用）
        returnSingleMoneyToWallet(value, image, draggedElement) {
            // 防止重複調用
            if (this.state.gameState.isReturningMoney) {
                this.Debug.log('flow', '[A3-McDonald] 正在處理退回金錢，忽略重複調用');
                return;
            }
            this.state.gameState.isReturningMoney = true;

            this.audio.playSound('beep');

            // 從付款區移除這個金錢
            const paymentArea = this.state.gameState.paymentArea || [];
            const moneyIndex = paymentArea.findIndex(m => m.value === value);
            if (moneyIndex > -1) {
                paymentArea.splice(moneyIndex, 1);
            } else {
                // 沒找到金錢，可能已經被移除了
                this.Debug.log('flow', `[A3-McDonald] 錢包中找不到 ${value}元，可能已被移除`);
                this.state.gameState.isReturningMoney = false;
                return;
            }

            // 減少已付金額（確保不會變成負數）
            this.state.gameState.paidAmount = Math.max(0, this.state.gameState.paidAmount - value);

            // 加回可用錢包
            this.state.gameState.availableWalletMoney.push({ value, image });

            // 🆕 重新渲染付款區（基於狀態，確保UI與資料一致）
            this.renderPaymentArea();

            // 更新UI
            const walletAreaEl = document.getElementById('wallet-area');
            const confirmBtn = document.getElementById('confirm-payment-btn');

            if (walletAreaEl) {
                walletAreaEl.innerHTML = this.generateWalletMoneyForPayment(this.state.gameState.availableWalletMoney);
            }

            this._updatePaidAmountDisplay();
            this.updateWalletTotalDisplay();

            // 🆕 更新付款按鈕狀態（參考 A4）
            this.updatePaymentButtonState();

            // 重新綁定拖曳事件（使用較長延遲避免重複觸發）
            this.TimerManager.setTimeout(() => {
                this.initializeDragAndDrop();
                // 重置標記
                this.state.gameState.isReturningMoney = false;
            }, 200, 'uiAnimation');

            this.Debug.log('flow', `[A3-McDonald] 金錢 ${value}元 已從付款區退回錢包`);
        },

        // 將已填充的付款目標重置並退回錢包（拖曳回錢包時使用）
        unfillPaymentTarget(target, value, image) {
            // 防止重複調用
            if (this.state.gameState.isUnfillingTarget) {
                this.Debug.log('flow', '[A3-McDonald] 正在處理重置目標，忽略重複調用');
                return;
            }
            this.state.gameState.isUnfillingTarget = true;

            this.audio.playSound('beep');

            // 從付款區移除這個金錢
            const paymentArea = this.state.gameState.paymentArea || [];
            const moneyIndex = paymentArea.findIndex(m => m.value === value);
            if (moneyIndex > -1) {
                paymentArea.splice(moneyIndex, 1);
            } else {
                this.Debug.log('flow', `[A3-McDonald] 付款區中找不到 ${value}元，可能已被移除`);
                this.state.gameState.isUnfillingTarget = false;
                return;
            }

            // 減少已付金額（確保不會變成負數）
            this.state.gameState.paidAmount = Math.max(0, this.state.gameState.paidAmount - value);

            // 加回可用錢包
            this.state.gameState.availableWalletMoney.push({ value, image });

            // 重置目標為未填充狀態
            target.classList.remove('filled');
            target.classList.add('faded');
            target.style.opacity = '0.7';
            target.style.border = '3px dashed #ffcc02';
            target.style.background = 'rgba(255, 255, 255, 0.8)';
            target.draggable = false;
            target.style.cursor = 'default';
            delete target.dataset.filledValue;
            delete target.dataset.filledImage;

            // 更新UI
            const walletAreaEl = document.getElementById('wallet-area');
            const confirmBtn = document.getElementById('confirm-payment-btn');

            if (walletAreaEl) {
                walletAreaEl.innerHTML = this.generateWalletMoneyForPayment(this.state.gameState.availableWalletMoney);
            }

            this._updatePaidAmountDisplay();
            this.updateWalletTotalDisplay();

            // 🆕 更新付款按鈕狀態（參考 A4）
            this.updatePaymentButtonState();

            // 重新綁定拖曳事件（使用較長延遲避免重複觸發）
            this.TimerManager.setTimeout(() => {
                this.initializeDragAndDrop();
                // 重置標記
                this.state.gameState.isUnfillingTarget = false;
            }, 200, 'uiAnimation');

            this.Debug.log('flow', `[A3-McDonald] 付款目標 ${value}元 已重置並退回錢包`);
        },

        // ========== A3 困難模式：計算找零場景 ==========
        renderCalculationSceneUI() {
            this.Debug.log('ui', '🎨 [A3-計算場景UI] 渲染計算找零頁面');

            const app = document.getElementById('app');
            const totalAmount = this.state.gameState.totalAmount;
            const paidAmount = this.state.gameState.paidAmount;
            const changeExpected = paidAmount - totalAmount;

            // 保存找零數據
            this.state.gameState.changeExpected = changeExpected;

            app.innerHTML = `
                <style>${this.getCalculationSceneCSS()}</style>
                <div class="mcdonalds-container" style="min-height: 100vh; display: flex; flex-direction: column;">
                    ${this.HTMLTemplates.titleBar(4, '計算找零金額')}

                    <!-- 主要內容區 -->
                    <div class="calculation-scene-container">
                        <div class="top-row">
                            <!-- 左側：訂單資訊區域 -->
                            <div class="item-info-section">
                                <div class="section-title">🛍️ 訂單資訊</div>
                                <div class="item-info" style="text-align: center;">
                                    <div class="item-emoji">🍔</div>
                                    <div class="transaction-summary">
                                        <div>訂單總價：${totalAmount}元</div>
                                        <div>實付金額：${paidAmount}元</div>
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
                                <span class="formula-text">${paidAmount}元 - ${totalAmount}元 = </span>
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
            this.setupCalculationSceneListeners(changeExpected);
        },

        setupCalculationSceneListeners(changeExpected) {
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

            // 🔧 [Phase 3] 點擊輸入框顯示數字鍵盤
            this.EventManager.on(input, 'click', () => {
                this.showNumberPad(input, confirmBtn, changeExpected);
            }, {}, 'gameUI');

            // 🔧 [Phase 3] 切換計算機
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
            }, {}, 'gameUI');

            // 🔧 [Phase 3] 確認按鈕
            this.EventManager.on(confirmBtn, 'click', () => {
                const userAnswer = parseInt(input.value);
                if (userAnswer === changeExpected) {
                    // 答對了，進入找零驗證頁面
                    this.audio.playSound('success');
                    this.speech.speak('correct', {}, () => {
                        // 進入找零驗證場景
                        this.SceneManager.switchScene('change', this);
                        this.showChangeVerification(changeExpected);
                    });
                } else {
                    // 答錯了
                    errorCount++;
                    this.audio.playSound('error');

                    const speechText = `答錯了！找零應該是 ${changeExpected} 元`;
                    this.speech.speak(speechText);

                    // 清空輸入
                    input.value = '';
                    confirmBtn.disabled = true;

                    this.Debug.log('payment', `[A3-計算] 錯誤次數: ${errorCount}`);
                }
            }, {}, 'gameUI');
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

            numBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const value = btn.dataset.value;
                    currentValue += value;
                    display.textContent = currentValue;
                });
            });

            backspaceBtn.addEventListener('click', () => {
                currentValue = currentValue.slice(0, -1);
                display.textContent = currentValue || '0';
            });

            clearBtn.addEventListener('click', () => {
                currentValue = '';
                display.textContent = '0';
            });

            cancelPadBtn.addEventListener('click', () => {
                numberPad.remove();
            });

            confirmPadBtn.addEventListener('click', () => {
                input.value = currentValue;
                confirmBtn.disabled = !currentValue;
                numberPad.remove();
            });
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
                    if (nextOperator) {
                        state.expression = `${inputValue} ${nextOperator}`;
                    }
                } else if (state.operator) {
                    const currentValue = state.previousValue || 0;
                    const newValue = this.calculate(currentValue, inputValue, state.operator);

                    state.displayValue = String(newValue);
                    state.previousValue = newValue;

                    if (nextOperator) {
                        state.expression = `${newValue} ${nextOperator}`;
                    } else {
                        state.expression = '';
                    }
                }

                state.waitingForOperand = true;
                state.operator = nextOperator;
                updateDisplay();
            };

            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const value = btn.dataset.value;
                    this.audio.playSound('keypad');

                    if (btn.classList.contains('number-btn')) {
                        inputDigit(parseInt(value));
                    } else if (btn.classList.contains('operator-btn')) {
                        performOperation(value);
                    } else if (btn.classList.contains('clear-btn')) {
                        clearCalculator();
                    } else if (btn.classList.contains('equals-btn')) {
                        performOperation(null);
                    }
                });
            });
        },

        calculate(firstOperand, secondOperand, operator) {
            switch (operator) {
                case '+':
                    return firstOperand + secondOperand;
                case '-':
                    return firstOperand - secondOperand;
                case '×':
                    return firstOperand * secondOperand;
                case '÷':
                    return firstOperand / secondOperand;
                default:
                    return secondOperand;
            }
        },

        getCalculationSceneCSS() {
            return `
                /* 計算場景樣式 */
                .calculation-scene-container {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    gap: 15px;
                    padding: 10px 15px;
                    max-width: 1100px;
                    margin: 0 auto;
                    position: relative;
                    flex: 1;
                    overflow: visible;
                }

                /* 商品資訊與計算機區域 */
                .top-row {
                    position: relative;
                    display: grid;
                    grid-template-columns: 1fr 500px 1fr;
                    width: 100%;
                    min-height: 160px;
                }

                /* 商品資訊區域 */
                .item-info-section {
                    grid-column: 2;
                    width: 500px;
                    background: linear-gradient(135deg, #fff3cd, #ffe69c);
                    border-radius: 15px;
                    padding: 12px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                }

                .section-title {
                    font-size: 1.2em;
                    font-weight: 700;
                    color: #c62d42;
                    margin-bottom: 10px;
                    text-align: center;
                }

                .item-info {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }

                .item-emoji {
                    font-size: 3em;
                }

                .transaction-summary {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    font-size: 1.1em;
                    color: #4a5568;
                    text-align: center;
                }

                /* 計算機區域 - 絕對定位在右側 */
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

                .calculator-btn {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 10px 25px;
                    font-size: 1.2em;
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

                /* 計算找零金額區域 */
                .calculation-section {
                    width: 500px;
                    margin: 0 auto;
                    background: linear-gradient(135deg, #ffcc02, #ff8f00);
                    border-radius: 15px;
                    padding: 12px;
                    box-shadow: 0 4px 15px rgba(255, 204, 2, 0.3);
                }

                .calculation-section .section-title {
                    color: #333;
                    margin-bottom: 10px;
                    font-size: 1.3em;
                    font-weight: bold;
                    text-align: center;
                }

                .calculation-formula {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.4);
                    padding: 15px;
                    border-radius: 12px;
                }

                .formula-text {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #333;
                }

                .change-input {
                    width: 90px;
                    height: 50px;
                    font-size: 1.5em;
                    text-align: center;
                    border: 3px solid #c62d42;
                    border-radius: 10px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: bold;
                    color: #2d3748;
                }

                .change-input:focus {
                    outline: none;
                    border-color: #c62d42;
                    box-shadow: 0 0 15px rgba(198, 45, 66, 0.5);
                }

                .formula-unit {
                    font-size: 1.8em;
                    font-weight: bold;
                    color: #333;
                }

                /* 確認按鈕區域 */
                .confirm-section {
                    width: 500px;
                    margin: 0 auto;
                    text-align: center;
                }

                .confirm-btn {
                    background: linear-gradient(135deg, #4caf50, #45a049);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 12px 35px;
                    font-size: 1.3em;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                }

                .confirm-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
                }

                .confirm-btn:disabled {
                    background: #d1d5db;
                    cursor: not-allowed;
                    box-shadow: none;
                }

                /* 計算機樣式 */
                .calculator {
                    width: 100%;
                    max-width: 300px;
                    background: white;
                    border-radius: 15px;
                    padding: 15px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }

                .calculator-expression {
                    min-height: 25px;
                    font-size: 1em;
                    color: #666;
                    text-align: right;
                    padding: 5px 10px;
                }

                .calculator-display {
                    background: #f5f5f5;
                    border-radius: 10px;
                    padding: 15px;
                    text-align: right;
                    font-size: 2em;
                    font-weight: bold;
                    margin-bottom: 15px;
                    min-height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
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
                }

                .calc-btn.number-btn {
                    background: white;
                    border: 2px solid #e0e0e0;
                    color: #333;
                }

                .calc-btn.number-btn:hover {
                    background: #f0f0f0;
                    border-color: #ffcc02;
                }

                .calc-btn.operator-btn {
                    background: linear-gradient(135deg, #ffcc02, #ff8f00);
                    color: #333;
                    font-weight: 700;
                }

                .calc-btn.operator-btn:hover {
                    transform: scale(1.05);
                }

                .calc-btn.clear-btn {
                    background: #f44336;
                    color: white;
                }

                .calc-btn.clear-btn:hover {
                    background: #d32f2f;
                }

                .calc-btn.equals-btn {
                    background: linear-gradient(135deg, #4caf50, #45a049);
                    color: white;
                }

                .calc-btn.equals-btn:hover {
                    background: linear-gradient(135deg, #45a049, #3d8b40);
                }

                .calc-btn:active {
                    transform: scale(0.95);
                }

                /* 數字輸入器樣式 */
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
                    padding: 20px;
                    font-size: 1.5em;
                    font-weight: bold;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .num-btn:hover {
                    background: #f0f0f0;
                    border-color: #ffcc02;
                }

                .num-btn:active {
                    transform: scale(0.95);
                }

                .number-pad-footer {
                    display: flex;
                    gap: 10px;
                }

                .num-cancel-btn,
                .num-confirm-btn {
                    flex: 1;
                    padding: 15px;
                    font-size: 1.2em;
                    font-weight: bold;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .num-cancel-btn {
                    background: #e0e0e0;
                    color: #333;
                }

                .num-cancel-btn:hover {
                    background: #d0d0d0;
                }

                .num-confirm-btn {
                    background: linear-gradient(135deg, #4caf50, #45a049);
                    color: white;
                }

                .num-confirm-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
                }

                /* 響應式設計 */
                @media (max-width: 1000px) {
                    .calculation-scene-container {
                        padding: 15px;
                    }

                    .top-row {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        min-height: auto;
                    }

                    .item-info-section {
                        grid-column: auto;
                        width: 100%;
                        max-width: 100%;
                    }

                    .calculator-area {
                        position: static;
                        width: 100%;
                        max-width: 100%;
                        margin-top: 20px;
                    }

                    .calculation-section {
                        width: 100%;
                    }

                    .confirm-section {
                        width: 100%;
                    }
                }
            `;
        },

        showChangeVerification(changeAmount) {
            // 計算找零的金錢組合
            const changeCoins = this.calculateChange(changeAmount);

            // 保存找零數據
            this.state.gameState.changeExpected = changeAmount;
            this.state.gameState.changeCoins = changeCoins;
            this.state.gameState.changeCollected = [];

            // 🔧 修復：輔助點擊模式 - 在渲染找零頁面時建立 change queue（參考 A6）
            if (this.state.settings.clickMode && this.state.gameState.clickModeState.enabled) {
                this.buildActionQueue('change');
                this.Debug.log('assist', '[A3-ClickMode] 在 showChangeVerification 中建立 change queue');
            }

            const app = document.getElementById('app');
            if (!app) return;

            const isNormalMode = this.state.settings.difficulty === 'normal';
            const isHardMode = this.state.settings.difficulty === 'hard';

            // 困難模式且需要找零：使用拖曳介面
            if (isHardMode && changeAmount > 0) {
                this._a3ShowHardChangeDrag(changeAmount);
                return;
            }

            // 普通模式：顯示三選一找零選項
            if (isNormalMode) {
                // 生成或使用已儲存的找零選項
                if (!this.state.gameState.currentChangeOptions) {
                    this.state.gameState.currentChangeOptions = this.generateChangeOptions(changeAmount);
                }
                const changeOptions = this.state.gameState.currentChangeOptions;

                // 播放語音提示：「找您×元，請選擇正確的答案」（合併為一句，減少間隔）
                if (this.state.settings.speechEnabled && this.speech) {
                    this.TimerManager.setTimeout(() => {
                        const speechText = changeAmount > 0
                            ? `找您${changeAmount}元，請選擇正確的答案`
                            : '付款金額剛好，無需找零，請選擇正確的答案';
                        this.speech.speakText(speechText);
                    }, 500, 'speechDelay');
                }

                app.innerHTML = `
                    <div class="mcdonalds-container" style="min-height: 100vh; display: flex; flex-direction: column;">
                        ${this.HTMLTemplates.titleBar(5, '確認找零')}

                        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #ffcc02, #ff8f00); padding: 30px; overflow-y: auto;">
                            <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); max-width: 800px; width: 100%;">
                                <h2 style="text-align: center; color: #c62d42; margin: 0 0 10px 0; font-size: 1.8em;">${changeAmount > 0 ? '💰 找零金額' : '✅ 付款完成'}</h2>
                                <div style="text-align: center; font-size: 3em; font-weight: 900; color: #4caf50; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">
                                    NT$ ${changeAmount}
                                </div>
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <div style="font-size: 1.2em; color: #666; margin-bottom: 10px;">${changeAmount > 0 ? '請選擇正確的找零金額' : '付款金額剛剛好，無需找零'}</div>
                                    <div style="font-size: 1.1em; color: #333;">
                                        已付金額：NT$ ${this.state.gameState.paidAmount} - 應付金額：NT$ ${this.state.gameState.totalAmount}
                                    </div>
                                </div>

                                <div style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 20px; justify-content: center;">
                                    ${changeOptions.map((option, index) => `
                                        <button class="change-option-btn" data-option-index="${index}" onclick="McDonald.selectChangeOption(${index}, ${option.isCorrect}, ${option.totalValue})"
                                            style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); color: #333; border: 3px solid #ffcc02; padding: 15px 20px; border-radius: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.1); min-width: 140px; flex: 1; max-width: 200px;"
                                            onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 6px 20px rgba(255, 204, 2, 0.4)'; this.style.borderColor='#ff8f00';"
                                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 10px rgba(0,0,0,0.1)'; this.style.borderColor='#ffcc02';">
                                            <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: ${isHardMode ? '0' : '10px'}; min-height: 80px; align-items: center;">
                                                ${option.coins.length > 0 ? option.coins.map(coin => {
                                                    const isPaper = coin.value >= 100;
                                                    const imgWidth = isPaper ? '100px' : '60px';
                                                    return `<img src="../images/${coin.image}" alt="${coin.value}元" style="width: ${imgWidth}; height: auto;">`;
                                                }).join('') : '<div style="text-align: center;"><div style="color: #4caf50; font-size: 2em; font-weight: bold; margin-bottom: 5px;">0元</div><div style="color: #4caf50; font-size: 1.3em; font-weight: bold;">無需找零</div></div>'}
                                            </div>
                                            ${isHardMode ? '' : `<div class="change-amount-display" data-amount="${option.totalValue}" style="font-size: 1.3em; color: #c62d42; opacity: 0; transition: opacity 0.3s ease;">NT$ ${option.totalValue}</div>`}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }

            // 簡單模式：使用拖曳介面
            app.innerHTML = `
                <div class="mcdonalds-container" style="min-height: 100vh; display: flex; flex-direction: column;">
                    <!-- 標題列 -->
                    ${this.HTMLTemplates.titleBar(5, '確認找零')}

                    <div style="flex: 1; display: flex; flex-direction: column; background: linear-gradient(135deg, #ffcc02, #ff8f00); padding: 30px; overflow-y: auto;">
                        <!-- 店家找零區域 -->
                        <div style="background: white; padding: 30px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                            <h2 style="text-align: center; color: #c62d42; margin: 0 0 15px 0; font-size: 1.8em;">💰 店家找零</h2>
                            <div style="text-align: center; margin-bottom: 25px;">
                                ${changeAmount > 0 ? '<div style="font-size: 1.2em; color: #666; margin-bottom: 10px;">👋 請將找回的零錢放到對應位置</div>' : ''}
                                <div style="font-size: 2.5em; color: ${changeAmount > 0 ? '#c62d42' : '#4caf50'}; font-weight: 700;">NT$ ${changeAmount}</div>
                            </div>

                            <div id="store-change-area" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; padding: 20px; background: #f8f9fa; border-radius: 15px; border: 2px solid ${changeAmount > 0 ? '#ffcc02' : '#4caf50'}; min-height: 120px; align-items: center;">
                                ${changeCoins.length > 0
                                    ? changeCoins.map((coin, index) => {
                                        const isPaperMoney = coin.value >= 100;
                                        const imgWidth = isPaperMoney ? '100px' : '60px';
                                        return `
                                        <div class="change-money-item" draggable="true" data-index="${index}" data-value="${coin.value}" data-image="${coin.image}"
                                             style="cursor: grab; text-align: center; padding: 12px; background: white; border: 2px solid #4caf50; border-radius: 12px; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                                             onmouseover="this.style.transform='scale(1.08)'; this.style.boxShadow='0 4px 15px rgba(76, 175, 80, 0.3)';"
                                             onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';">
                                            <img src="../images/${coin.image}" alt="${coin.value}元" style="width: ${imgWidth}; height: auto; display: block; margin: 0 auto 8px auto; pointer-events: none;">
                                            <div style="font-weight: 700; color: #4caf50; font-size: 1em;">NT$ ${coin.value}</div>
                                        </div>
                                    `}).join('')
                                    : `<div style="text-align: center; padding: 40px; width: 100%;">
                                          <div style="font-size: 4em; margin-bottom: 15px;">✅</div>
                                          <div style="font-size: 1.8em; color: #4caf50; font-weight: 700; margin-bottom: 8px;">剛好付清</div>
                                          <div style="font-size: 1.2em; color: #666;">無需找零，請點擊下方按鈕完成交易</div>
                                       </div>`
                                }
                            </div>
                        </div>

                        <!-- 收回零錢區域 -->
                        <div style="background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                            <h2 style="text-align: center; color: #c62d42; margin: 0 0 5px 0; font-size: 1.8em;"><img src="../images/common/icons_wallet.png" alt="💰" style="width:1.5em;height:1.5em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='💰'"> 我的錢包</h2>
                            ${changeAmount > 0 ? '<div id="collected-amount" style="text-align: center; font-size: 1.5em; color: #4caf50; font-weight: 700; margin-bottom: 15px;">已找回零錢：NT$ 0</div>' : ''}
                            <div id="change-collection-area" style="min-height: ${changeAmount > 0 ? '150px' : '80px'}; background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border: 3px ${changeAmount > 0 ? 'dashed' : 'solid'} #4caf50; border-radius: 15px; padding: 30px; display: flex; flex-wrap: wrap; gap: 15px; align-items: center; justify-content: center;">
                                ${this.generateChangeTargets(changeCoins)}
                            </div>

                            <div style="text-align: center; margin-top: 25px;">
                                <button id="complete-change-btn" onclick="McDonald.completeChangeCollection()" style="background: linear-gradient(135deg, #4caf50, #45a049); color: white; border: none; padding: 18px 45px; border-radius: 25px; font-size: 1.3em; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3); transition: all 0.3s ease; ${changeAmount === 0 ? '' : 'opacity: 0.5;'}" ${changeAmount === 0 ? '' : 'disabled'}>
                                    ✅ ${changeAmount > 0 ? '確認找回零錢' : '完成交易'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 初始化找零拖曳功能
            this.TimerManager.setTimeout(() => this.initializeChangeDragAndDrop(), 100, 'uiAnimation');

            // 無需找零時：高亮「完成交易」按鈕；困難模式額外播語音
            if (changeAmount === 0) {
                if (isHardMode && this.state.settings.speechEnabled && this.speech) {
                    this.TimerManager.setTimeout(() => {
                        this.speech.speakText('剛好付款，不需要找零');
                    }, 300, 'speechDelay');
                }
                this.TimerManager.setTimeout(() => {
                    const btn = document.getElementById('complete-change-btn');
                    if (btn && !btn.classList.contains('checkout-btn-hint')) {
                        btn.classList.add('checkout-btn-hint');
                        this.Debug.log('assist', '[A3-Step5] 顯示「完成交易」按鈕提示動畫');
                    }
                }, isHardMode ? 1200 : 400, 'hint');
            }
        },

        // ── A3 困難模式找零拖曳介面 ──────────────────────────────────

        _a3ShowHardChangeDrag(changeAmount) {
            const gs = this.state.gameState;

            // 初始化狀態
            gs.a3cGhostMode  = false;
            gs.a3cHintSlots  = [];
            gs.a3cErrorCount = 0;
            gs.a3cPlaced     = [];
            gs.a3cTotal      = changeAmount;
            gs.a3cHintShown  = false;

            // 面額托盤（依找零金額）
            let trayDenoms;
            if (changeAmount <= 100)      { trayDenoms = [50, 10, 5, 1]; }
            else if (changeAmount < 1000) { trayDenoms = [500, 100, 50, 10, 5, 1]; }
            else                          { trayDenoms = [1000, 500, 100, 50, 10, 5, 1]; }

            const trayFaces = {};
            trayDenoms.forEach(d => { trayFaces[d] = Math.random() < 0.5 ? 'back' : 'front'; });
            gs.a3cTrayFaces = trayFaces;

            // 貪婪最佳解
            const greedySolution = {};
            let remSol = changeAmount;
            for (const d of [1000, 500, 100, 50, 10, 5, 1]) {
                const cnt = Math.floor(remSol / d);
                if (cnt > 0) { greedySolution[d] = cnt; remSol -= cnt * d; }
            }
            gs.a3cGreedySolution = greedySolution;

            // 付款後錢包剩餘
            const walletRemaining = (gs.walletTotal || 0) - (gs.paidAmount || gs.totalAmount || 0);
            gs.a3cWalletBase = walletRemaining;

            // 靜態錢包金幣（貪婪分解）
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
                return `<div class="a3c-wc-static">
                    <img src="../images/money/${d}_yuan_${face}.png" alt="${d}元"
                         style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;" draggable="false" onerror="this.style.display='none'">
                    <span class="a3c-denom-label">${d}元</span>
                </div>`;
            }).join('');

            // 面額托盤 HTML（可重複拖曳）
            const trayHtml = trayDenoms.map(d => {
                const isBill = d >= 100;
                return `<div class="a3c-denom-card" draggable="true" data-denom="${d}" data-face="${trayFaces[d]}" title="${d}元">
                    <img src="../images/money/${d}_yuan_${trayFaces[d]}.png" alt="${d}元"
                         class="${isBill ? 'a3c-banknote-img' : 'a3c-coin-img'}" draggable="false" onerror="this.style.display='none'">
                    <span class="a3c-denom-label">${d}元</span>
                </div>`;
            }).join('');

            const app = document.getElementById('app');
            if (!app) return;

            app.innerHTML = `
            <div class="mcdonalds-container" style="min-height:100vh;display:flex;flex-direction:column;">
                ${this.HTMLTemplates.titleBar(5, '確認找零')}
                <div style="flex:1;display:flex;flex-direction:column;background:linear-gradient(135deg,#ffcc02,#ff8f00);padding:16px;gap:12px;overflow-y:auto;box-sizing:border-box;">

                    <!-- 卡片1：找零金額 + 吉祥物 + 提示鈕 -->
                    <div class="a3c-change-card a3c-info-card">
                        <div class="a3c-info-left">
                            <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
                                <div class="a3c-change-title">💰 找零金額</div>
                                <div class="a3c-change-amount">${changeAmount} 元</div>
                            </div>
                        </div>
                        <div class="a3c-info-right" style="flex-direction:row;min-width:unset;">
                            <img src="../images/common/hint_detective.png" alt="" class="a3c-mascot a3c-mascot-bounce" onerror="this.style.display='none'">
                            <button class="a3c-hint-btn" id="a3c-hint-btn">💡 提示</button>
                        </div>
                    </div>

                    <!-- 卡片2：拖曳金錢區 -->
                    <div class="a3c-change-card">
                        <div class="a3c-card-title">💰 找零面額（可重複拖曳）</div>
                        <div class="a3c-tray-coins" id="a3c-tray-coins">${trayHtml}</div>
                    </div>

                    <!-- 卡片3：我的錢包 -->
                    <div class="a3c-change-card">
                        <div class="a3c-card-title" style="display:flex;align-items:center;">
                            <div style="flex:1;"></div>
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span>💼 我的錢包</span>
                                <span class="a3c-wallet-info a3c-hidden" id="a3c-wallet-info"><span id="a3c-wallet-balance">${walletRemaining}</span>元（已找回 <span id="a3c-placed-total">0</span>/${changeAmount} 元）</span>
                            </div>
                            <div style="flex:1;display:flex;justify-content:flex-end;">
                                <button class="a3c-wallet-toggle-btn" id="a3c-wallet-toggle">▶ 展開錢包</button>
                            </div>
                        </div>
                        <div class="a3c-wallet-split">
                            <!-- 左：原有錢包（預設折疊） -->
                            <div class="a3c-wallet-left" id="a3c-wallet-left" style="display:none;">
                                ${walletStaticHtml || '<span class="a3c-empty-hint">（餘額為0）</span>'}
                            </div>
                            <!-- 右：找零放置區（永遠展開） -->
                            <div class="a3c-wallet-right a3c-drop-zone" id="a3c-wallet-zone">
                                <div id="a3c-wallet-coins" style="display:flex;flex-wrap:wrap;gap:10px;width:100%;align-items:flex-end;justify-content:center;min-height:60px;">
                                    <span class="a3c-empty-hint">把找零金錢拖曳到這裡</span>
                                </div>
                            </div>
                        </div>
                        <div style="text-align:center;margin-top:12px;">
                            <button class="a3c-confirm-btn" id="a3c-confirm-btn" disabled>✅ 確認找零</button>
                        </div>
                    </div>

                </div>
            </div>`;

            if (this.state.settings.speechEnabled && this.speech) {
                this.TimerManager.setTimeout(() => {
                    this.speech.speakText(`找您${changeAmount}元，請把找回的金錢拖曳到我的錢包`);
                }, 400, 'speechDelay');
            }
            this.TimerManager.setTimeout(() => this._a3SetupChangeDragInteraction(changeAmount), 100, 'uiAnimation');
        },

        _a3SetupChangeDragInteraction(change) {
            const gs = this.state.gameState;
            const trayEl     = document.getElementById('a3c-tray-coins');
            const walletZone = document.getElementById('a3c-wallet-zone');
            const confirmBtn = document.getElementById('a3c-confirm-btn');
            const hintBtn    = document.getElementById('a3c-hint-btn');
            if (!trayEl || !walletZone) return;

            let _dropCooldown = false;
            const handleDrop = (denom) => {
                if (_dropCooldown) return;
                _dropCooldown = true;
                setTimeout(() => { _dropCooldown = false; }, 300);
                const face = gs.a3cTrayFaces?.[denom] || 'front';
                const uid  = 'a3c' + Date.now() + Math.floor(Math.random() * 10000);
                if (gs.a3cGhostMode) {
                    const slotIdx = (gs.a3cHintSlots || []).findIndex(s => s.denom === denom && !s.filled);
                    if (slotIdx === -1) { this.audio.playSound('error'); return; }
                    this.audio.playSound('beep');
                    gs.a3cHintSlots[slotIdx].filled = true;
                    gs.a3cHintSlots[slotIdx].uid = uid;
                    gs.a3cPlaced.push({ denom, uid, face });
                } else {
                    this.audio.playSound('beep');
                    gs.a3cPlaced.push({ denom, uid, face });
                }
                this._a3UpdateChangeDisplay(change);
                this._a3RenderWalletCoins(change);
                const runningTotal = (gs.a3cPlaced || []).reduce((s, p) => s + p.denom, 0);
                // 設計意圖：只在按過提示後才播拖曳語音，避免干擾；數字直接傳 TTS（唸四十七元），效果與大寫相同
                if (gs.a3cHintShown && this.state.settings.speechEnabled && this.speech) {
                    this.speech.speakText(`找回${runningTotal}元`);
                }
            };

            // Desktop drag from tray
            trayEl.querySelectorAll('.a3c-denom-card').forEach(card => {
                const denom = parseInt(card.dataset.denom);
                card.addEventListener('dragstart', e => {
                    e.dataTransfer.setData('text/plain', `a3cdenom:${denom}`);
                    card.classList.add('a3c-dragging');
                });
                card.addEventListener('dragend', () => card.classList.remove('a3c-dragging'));
            });
            walletZone.addEventListener('dragover', e => { e.preventDefault(); walletZone.classList.add('a3c-drop-active'); });
            walletZone.addEventListener('dragleave', e => {
                if (!walletZone.contains(e.relatedTarget)) walletZone.classList.remove('a3c-drop-active');
            });
            walletZone.addEventListener('drop', e => {
                e.preventDefault(); walletZone.classList.remove('a3c-drop-active');
                const d = e.dataTransfer.getData('text/plain');
                if (d.startsWith('a3cdenom:')) handleDrop(parseInt(d.replace('a3cdenom:', '')));
            });

            // Touch drag from tray
            trayEl.querySelectorAll('.a3c-denom-card').forEach(card => {
                const denom = parseInt(card.dataset.denom);
                let ghostEl = null;
                card.addEventListener('touchstart', e => {
                    const t = e.touches[0];
                    ghostEl = card.cloneNode(true);
                    ghostEl.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.8;transform:scale(1.05);left:${t.clientX - 35}px;top:${t.clientY - 50}px;`;
                    document.body.appendChild(ghostEl);
                }, { passive: true });
                card.addEventListener('touchmove', e => {
                    e.preventDefault();
                    const t = e.touches[0];
                    if (ghostEl) { ghostEl.style.left = (t.clientX - 35) + 'px'; ghostEl.style.top = (t.clientY - 50) + 'px'; }
                    const r = walletZone.getBoundingClientRect();
                    walletZone.classList.toggle('a3c-drop-active',
                        t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom);
                }, { passive: false });
                card.addEventListener('touchend', e => {
                    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
                    walletZone.classList.remove('a3c-drop-active');
                    const t = e.changedTouches[0];
                    const r = walletZone.getBoundingClientRect();
                    if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) handleDrop(denom);
                }, { passive: true });
            });

            // 移除錢包中的金幣（× 按鈕）
            const walletCoinsEl = document.getElementById('a3c-wallet-coins');
            if (walletCoinsEl) {
                walletCoinsEl.addEventListener('click', e => {
                    const btn = e.target.closest('.a3c-wc-remove');
                    if (!btn) return;
                    this.audio.playSound('beep');
                    if (gs.a3cGhostMode) {
                        const slotIdx = parseInt(btn.dataset.slotIdx);
                        if (!isNaN(slotIdx) && gs.a3cHintSlots[slotIdx]) {
                            const uid = gs.a3cHintSlots[slotIdx].uid;
                            gs.a3cHintSlots[slotIdx].filled = false;
                            gs.a3cHintSlots[slotIdx].uid = null;
                            gs.a3cPlaced = gs.a3cPlaced.filter(p => p.uid !== uid);
                        }
                    } else {
                        const uid = btn.dataset.uid;
                        gs.a3cPlaced = gs.a3cPlaced.filter(p => p.uid !== uid);
                    }
                    this._a3UpdateChangeDisplay(change);
                    this._a3RenderWalletCoins(change);
                });

                // Desktop 拖回托盤（拖出 wallet zone 即移除）
                let _draggingWalletUid = null;
                walletCoinsEl.addEventListener('dragstart', e => {
                    const item = e.target.closest('.a3c-wc-item[data-uid]');
                    if (!item) return;
                    _draggingWalletUid = item.dataset.uid;
                    e.dataTransfer.setData('text/plain', `a3cuid:${_draggingWalletUid}`);
                    e.dataTransfer.effectAllowed = 'move';
                });
                document.addEventListener('dragend', function _a3DragEnd(e) {
                    if (!_draggingWalletUid) return;
                    const uid = _draggingWalletUid;
                    _draggingWalletUid = null;
                    if (e.dataTransfer.dropEffect === 'none') {
                        if (gs.a3cGhostMode) {
                            const slotIdx = (gs.a3cHintSlots || []).findIndex(s => s.uid === uid);
                            if (slotIdx !== -1) { gs.a3cHintSlots[slotIdx].filled = false; gs.a3cHintSlots[slotIdx].uid = null; }
                        }
                        gs.a3cPlaced = (gs.a3cPlaced || []).filter(p => p.uid !== uid);
                    }
                });

                // Touch 拖回
                let _touchWalletUid = null;
                let _touchGhostEl   = null;
                walletCoinsEl.addEventListener('touchstart', e => {
                    const item = e.target.closest('.a3c-wc-item[data-uid]');
                    if (!item) return;
                    _touchWalletUid = item.dataset.uid;
                    const t = e.touches[0];
                    _touchGhostEl = item.cloneNode(true);
                    _touchGhostEl.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.7;left:${t.clientX - 30}px;top:${t.clientY - 40}px;`;
                    document.body.appendChild(_touchGhostEl);
                }, { passive: true });
                walletCoinsEl.addEventListener('touchmove', e => {
                    if (!_touchGhostEl) return;
                    e.preventDefault();
                    const t = e.touches[0];
                    _touchGhostEl.style.left = (t.clientX - 30) + 'px';
                    _touchGhostEl.style.top  = (t.clientY - 40) + 'px';
                }, { passive: false });
                walletCoinsEl.addEventListener('touchend', e => {
                    if (_touchGhostEl) { _touchGhostEl.remove(); _touchGhostEl = null; }
                    if (!_touchWalletUid) return;
                    const uid = _touchWalletUid;
                    _touchWalletUid = null;
                    const t   = e.changedTouches[0];
                    const zone = document.getElementById('a3c-wallet-zone');
                    const r    = zone?.getBoundingClientRect();
                    const inside = r && t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;
                    if (!inside) {
                        if (gs.a3cGhostMode) {
                            const slotIdx = (gs.a3cHintSlots || []).findIndex(s => s.uid === uid);
                            if (slotIdx !== -1) { gs.a3cHintSlots[slotIdx].filled = false; gs.a3cHintSlots[slotIdx].uid = null; }
                        }
                        gs.a3cPlaced = (gs.a3cPlaced || []).filter(p => p.uid !== uid);
                        this._a3UpdateChangeDisplay(change);
                        this._a3RenderWalletCoins(change);
                    }
                }, { passive: true });
            }

            // 確認找零按鈕
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    if (this.state.isProcessing) return;
                    this.state.isProcessing = true;
                    this._a3ConfirmChange(change);
                });
            }

            // 提示按鈕（困難模式：揭露餘額 + 彈窗）
            if (hintBtn) {
                hintBtn.addEventListener('click', () => {
                    this.audio.playSound('beep');
                    gs.a3cHintShown = true;
                    const walletInfo = document.getElementById('a3c-wallet-info');
                    if (walletInfo) walletInfo.classList.remove('a3c-hidden');
                    this._a3ShowChangeGhostSlots(change);
                    this._a3ShowChangeHintModal(change);
                });
            }

            const walletToggle = document.getElementById('a3c-wallet-toggle');
            if (walletToggle) {
                walletToggle.addEventListener('click', () => {
                    const left = document.getElementById('a3c-wallet-left');
                    if (!left) return;
                    const expanded = left.style.display !== 'none';
                    left.style.display = expanded ? 'none' : '';
                    walletToggle.textContent = expanded ? '▶ 展開錢包' : '◀ 收起錢包';
                });
            }
        },

        _a3UpdateChangeDisplay(change) {
            const gs = this.state.gameState;
            const placedTotal = (gs.a3cPlaced || []).reduce((s, p) => s + p.denom, 0);
            const exact = placedTotal === change;
            const totalEl = document.getElementById('a3c-placed-total');
            if (totalEl) totalEl.textContent = placedTotal;
            const balanceEl = document.getElementById('a3c-wallet-balance');
            if (balanceEl) balanceEl.textContent = (gs.a3cWalletBase || 0) + placedTotal;
            const confirmBtn = document.getElementById('a3c-confirm-btn');
            if (confirmBtn) {
                confirmBtn.disabled = false;
            }
        },

        _a3RenderWalletCoins(change) {
            const gs = this.state.gameState;
            const walletCoinsEl = document.getElementById('a3c-wallet-coins');
            if (!walletCoinsEl) return;

            const _makeFilledSlot = (denom, face, uid, slotIdx) => {
                const isBill = denom >= 100;
                const w = isBill ? 80 : 52;
                const div = document.createElement('div');
                div.className = 'a3c-wc-item';
                div.draggable = true;
                div.dataset.uid = uid || '';
                div.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;" draggable="false" onerror="this.style.display='none'">
                    <span class="a3c-denom-label">${denom}元</span>
                    <button class="a3c-wc-remove" data-uid="${uid || ''}"${slotIdx != null ? ` data-slot-idx="${slotIdx}"` : ''} title="移除">×</button>`;
                return div;
            };
            const _makeGhostSlot = (denom, face) => {
                const isBill = denom >= 100;
                const w = isBill ? 80 : 52;
                const div = document.createElement('div');
                div.className = 'a3c-ghost-slot';
                div.dataset.denom = denom;
                div.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;opacity:0.3;" draggable="false" onerror="this.style.display='none'">
                    <span class="a3c-denom-label" style="opacity:0.3;">${denom}元</span>`;
                return div;
            };

            // Ghost slot 模式：DOM diff
            if (gs.a3cGhostMode && gs.a3cHintSlots?.length > 0) {
                if (gs.a3cHintSlots.every(s => s.filled)) {
                    gs.a3cGhostMode = false;
                    walletCoinsEl.innerHTML = '';  // 清除所有 ghost slot，避免殘留
                } else {
                    const kids = Array.from(walletCoinsEl.children);
                    if (kids.length !== gs.a3cHintSlots.length) {
                        walletCoinsEl.innerHTML = '';
                        gs.a3cHintSlots.forEach((slot, idx) => {
                            walletCoinsEl.appendChild(
                                slot.filled
                                    ? _makeFilledSlot(slot.denom, slot.face, slot.uid, idx)
                                    : _makeGhostSlot(slot.denom, slot.face)
                            );
                        });
                    } else {
                        gs.a3cHintSlots.forEach((slot, idx) => {
                            const el = kids[idx];
                            const curFilled = el.classList.contains('a3c-wc-item');
                            if (slot.filled === curFilled) return;
                            walletCoinsEl.replaceChild(
                                slot.filled
                                    ? _makeFilledSlot(slot.denom, slot.face, slot.uid, idx)
                                    : _makeGhostSlot(slot.denom, slot.face),
                                el
                            );
                        });
                    }
                    return;
                }
            }

            // 一般模式：DOM diff
            if (!gs.a3cPlaced || gs.a3cPlaced.length === 0) {
                walletCoinsEl.innerHTML = '<span class="a3c-empty-hint">把找零金錢拖曳到這裡</span>';
                return;
            }
            const emptyEl = walletCoinsEl.querySelector('.a3c-empty-hint');
            if (emptyEl) emptyEl.remove();
            const existingMap = {};
            walletCoinsEl.querySelectorAll('.a3c-wc-item').forEach(el => { existingMap[el.dataset.uid] = el; });
            const desiredUids = new Set(gs.a3cPlaced.map(p => p.uid));
            Object.entries(existingMap).forEach(([uid, el]) => { if (!desiredUids.has(uid)) el.remove(); });
            gs.a3cPlaced.forEach(p => {
                if (existingMap[p.uid]) return;
                walletCoinsEl.appendChild(_makeFilledSlot(p.denom, p.face, p.uid, null));
            });
        },

        _a3ConfirmChange(change) {
            const gs = this.state.gameState;
            const placedTotal = (gs.a3cPlaced || []).reduce((s, p) => s + p.denom, 0);

            if (placedTotal !== change) {
                this.state.isProcessing = false;
                this.audio.playSound('error');
                gs.a3cErrorCount = (gs.a3cErrorCount || 0) + 1;
                const dir = placedTotal > change ? '太多了' : '太少了';
                this.showToast(`找零金額${dir}！應找 ${change} 元，目前 ${placedTotal} 元`, 'error');
                const walletZone = document.getElementById('a3c-wallet-zone');
                if (walletZone) {
                    walletZone.style.animation = 'a3cShake 0.4s ease';
                    this.TimerManager.setTimeout(() => { if (walletZone) walletZone.style.animation = ''; }, 500, 'ui');
                }
                if (this.state.settings.speechEnabled && this.speech) {
                    this.speech.speakText(`不對喔，找零算${dir}，請再試一次`);
                }
                // 清空錢包，重置 ghost 模式（困難模式保留）
                gs.a3cPlaced    = [];
                gs.a3cGhostMode = false;
                gs.a3cHintSlots = [];
                this._a3UpdateChangeDisplay(change);
                this._a3RenderWalletCoins(change);
                // 3次錯誤自動顯示 ghost slots
                if (gs.a3cErrorCount >= 3) {
                    gs.a3cErrorCount = 0;
                    this.TimerManager.setTimeout(() => this._a3ShowChangeGhostSlots(change), 900, 'ui');
                }
                return;
            }

            // 找零正確
            this.state.isProcessing = false;
            this.audio.playSound('success');
            this.playStepSuccess(true); // success 已播放 correct02.mp3，只需煙火
            gs.changeErrorCount = 0;
            gs.changeHintShown  = false;
            if (this.state.settings.speechEnabled && this.speech) {
                this.speech.speakText(`找回${change}元，找零完成！`);
            }
            this.TimerManager.setTimeout(() => {
                gs.orderNumber = this.generateRandomOrderNumber();
                gs.completedOrders++;
                this.completeOrder();
            }, 1200, 'screenTransition');
        },

        _a3ShowChangeGhostSlots(change) {
            const gs = this.state.gameState;
            gs.a3cPlaced    = [];
            gs.a3cGhostMode = true;
            const solution = gs.a3cGreedySolution || {};
            const slots = [];
            Object.entries(solution).sort(([a], [b]) => b - a).forEach(([d, cnt]) => {
                const denom = parseInt(d);
                const face  = gs.a3cTrayFaces?.[denom] || 'front';
                for (let i = 0; i < cnt; i++) slots.push({ denom, face, filled: false, uid: null });
            });
            gs.a3cHintSlots = slots;
            // 強制清空，避免 DOM diff 誤判 empty-hint span 為 ghost slot
            const _wc3 = document.getElementById('a3c-wallet-coins');
            if (_wc3) _wc3.innerHTML = '';
            this._a3UpdateChangeDisplay(change);
            this._a3RenderWalletCoins(change);
            const parts = Object.entries(solution).sort(([a], [b]) => b - a).map(([d, cnt]) => `${cnt}個${d}元`);
            if (this.state.settings.speechEnabled && this.speech) {
                this.speech.speakText(`可以用${parts.join('，')}`);
            }
        },

        _a3UpdateChangeTrayHints() {
            const gs = this.state.gameState;
            document.querySelectorAll('.a3c-denom-card').forEach(el => el.classList.remove('b6-product-here-hint'));
            if (!gs.a3cGhostMode) return;
            const needed = {};
            (gs.a3cHintSlots || []).filter(s => !s.filled).forEach(s => { needed[s.denom] = (needed[s.denom] || 0) + 1; });
            document.querySelectorAll('.a3c-denom-card').forEach(el => {
                const d = parseInt(el.dataset.denom);
                if (needed[d]) el.classList.add('b6-product-here-hint');
            });
        },

        _a3ShowChangeHintModal(change) {
            const gs = this.state.gameState;
            const solution = gs.a3cGreedySolution || {};
            const parts = Object.entries(solution).sort(([a], [b]) => b - a).map(([d, cnt]) => `${cnt}個${d}元`);
            const speechText = `找零${change}元，可以用${parts.join('，')}`;

            let hintListHTML = '';
            Object.entries(solution).sort(([a], [b]) => b - a).forEach(([d, cnt]) => {
                const denom  = parseInt(d);
                const face   = gs.a3cTrayFaces?.[denom] || 'front';
                const isBill = denom >= 100;
                const imgStyle = isBill ? 'width:80px;height:auto;max-height:50px;' : 'width:50px;height:50px;';
                hintListHTML += `
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:10px 14px;background:#fff8e7;border-radius:10px;border:1px solid #ffcc02;">
                    <img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                         style="${imgStyle}object-fit:contain;" onerror="this.style.display='none'" draggable="false">
                    <span style="font-size:18px;font-weight:700;color:#1f2937;">${denom}元</span>
                    <span style="color:#9ca3af;font-size:16px;">×</span>
                    <span style="font-size:18px;font-weight:700;color:#c62d42;">${cnt} 個</span>
                </div>`;
            });

            const existing = document.getElementById('a3c-hint-modal');
            if (existing) existing.remove();
            const overlay = document.createElement('div');
            overlay.id = 'a3c-hint-modal';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10200;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = `
                <div style="background:white;border-radius:16px;padding:24px;max-width:420px;width:92%;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
                    <div style="text-align:center;font-size:20px;font-weight:700;color:#c62d42;margin-bottom:6px;">💡 找零提示</div>
                    <div style="text-align:center;font-size:14px;color:#6b7280;margin-bottom:14px;">建議的找零方式：</div>
                    <div>${hintListHTML}</div>
                    <div style="display:flex;gap:10px;justify-content:center;margin-top:12px;">
                        <button id="a3c-hm-replay" style="background:linear-gradient(135deg,#ffcc02,#ff8f00);color:#333;border:none;padding:10px 20px;border-radius:20px;font-size:15px;font-weight:700;cursor:pointer;">🔊 再播一次</button>
                        <button id="a3c-hm-close" style="background:linear-gradient(135deg,#4caf50,#45a049);color:white;border:none;padding:10px 20px;border-radius:20px;font-size:15px;font-weight:700;cursor:pointer;">我知道了</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);

            if (this.state.settings.speechEnabled && this.speech) {
                this.speech.speakText(speechText);
            }
            const closeModal = () => overlay.remove();
            document.getElementById('a3c-hm-close')?.addEventListener('click', closeModal);
            document.getElementById('a3c-hm-replay')?.addEventListener('click', () => {
                this.audio.playSound('beep');
                if (this.state.settings.speechEnabled && this.speech) this.speech.speakText(speechText);
            });
            overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
        },

        calculateChange(amount) {
            const denominations = [1000, 500, 100, 50, 10, 5, 1];
            const result = [];
            let remaining = amount;

            for (const denom of denominations) {
                while (remaining >= denom) {
                    // 隨機選擇正面或反面
                    const randomFace = Math.random() < 0.5 ? 'front' : 'back';
                    result.push({
                        value: denom,
                        image: `money/${denom}_yuan_${randomFace}.png`
                    });
                    remaining -= denom;
                }
            }

            return result;
        },

        // 生成找零區的淡化金錢目標（紙鈔大於硬幣）
        generateChangeTargets(changeCoins) {
            if (!changeCoins || changeCoins.length === 0) {
                return ''; // 🆕 無需找零時不顯示任何內容
            }

            let html = '';
            changeCoins.forEach((coin, index) => {
                const isPaperMoney = coin.value >= 100;
                const imgWidth = isPaperMoney ? '90px' : '55px';
                html += `
                    <div class="change-target faded"
                         data-target-index="${index}"
                         data-expected-value="${coin.value}"
                         style="text-align: center; padding: 12px; background: rgba(255, 255, 255, 0.5);
                                border: 3px dashed #4caf50; border-radius: 12px;
                                opacity: 0.4; filter: grayscale(80%);">
                        <img src="../images/${coin.image}" alt="${coin.value}元"
                             style="width: ${imgWidth}; height: auto; display: block; margin: 0 auto 8px auto; pointer-events: none;">
                        <div style="font-weight: 700; color: #4caf50; font-size: 1em;">NT$ ${coin.value}</div>
                    </div>
                `;
            });
            return html;
        },

        // 生成找零選項（三選一）- 普通模式
        generateChangeOptions(expectedChange) {
            const correctOption = {
                isCorrect: true,
                totalValue: expectedChange,
                coins: this.calculateChange(expectedChange)
            };

            const wrongOptions = [];
            const existingValues = new Set([expectedChange]);

            if (expectedChange === 0) {
                // 當不需要找零時，生成兩個非零的錯誤選項
                while (wrongOptions.length < 2) {
                    const wrongAmount = Math.floor(Math.random() * 35) + 5; // 5到39元
                    if (!existingValues.has(wrongAmount)) {
                        existingValues.add(wrongAmount);
                        wrongOptions.push({
                            isCorrect: false,
                            totalValue: wrongAmount,
                            coins: this.calculateChange(wrongAmount)
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
                            coins: this.calculateChange(wrongAmount)
                        });
                    }
                }
            }

            const allOptions = [correctOption, ...wrongOptions];
            // 隨機排序
            return this.shuffleArray(allOptions);
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

        // 處理找零選項選擇（普通模式）
        selectChangeOption(optionIndex, isCorrect, changeAmount) {
            const optionBtns = document.querySelectorAll('.change-option-btn');
            const selectedBtn = optionBtns[optionIndex];

            // 檢查金額是否已顯示（避免重複點擊）
            const amountDisplay = selectedBtn.querySelector('.change-amount-display');
            const isFirstClick = amountDisplay && amountDisplay.style.opacity === '0';

            // 第一次點擊：顯示金額
            if (isFirstClick) {
                amountDisplay.style.opacity = '1';
                this.Debug.log('flow', '[A3-McDonald] 顯示找零選項金額:', changeAmount);
            }

            // 禁用所有選項按鈕
            optionBtns.forEach(btn => {
                btn.disabled = true;
                btn.style.cursor = 'not-allowed';
            });

            if (isCorrect) {
                // 正確答案：播放 correct02.mp3（success 音效已使用 correct02.mp3）
                this.audio.playSound('success');

                // 顯示綠色圈動畫
                selectedBtn.style.position = 'relative';
                const correctOverlay = document.createElement('div');
                correctOverlay.innerHTML = '⭕';
                correctOverlay.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(0);
                    font-size: 80px;
                    color: #4caf50;
                    z-index: 10;
                    animation: correctPopIn 0.5s ease forwards;
                    text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
                `;
                selectedBtn.appendChild(correctOverlay);

                // @keyframes correctPopIn, wrongPopOut, fadeOutBtn 已移至 JS injectGlobalAnimationStyles()

                selectedBtn.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
                selectedBtn.style.color = 'white';
                selectedBtn.style.borderColor = '#4caf50';

                // 重置找零錯誤計數
                this.state.gameState.changeErrorCount = 0;
                this.state.gameState.changeHintShown = false;

                // 清除找零選項並完成訂單
                this.state.gameState.currentChangeOptions = null;

                this.TimerManager.setTimeout(() => {
                    this.state.gameState.orderNumber = this.generateRandomOrderNumber();
                    this.state.gameState.completedOrders++;
                    this.completeOrder();
                }, 1200, 'screenTransition');
            } else {
                // 錯誤答案：只播放錯誤音效（不播放語音提示）
                this.audio.playSound('error');

                // 普通模式：累計找零錯誤次數，3次後高亮正確答案
                this.state.gameState.changeErrorCount++;
                this.Debug.log('flow', `[A3-McDonald] 找零錯誤次數: ${this.state.gameState.changeErrorCount}`);
                if (this.state.gameState.changeErrorCount >= 3 && !this.state.gameState.changeHintShown) {
                    this.state.gameState.changeHintShown = true;
                    // 在正確選項上方顯示綠色勾勾
                    optionBtns.forEach((btn) => {
                        const onclickStr = btn.getAttribute('onclick') || '';
                        if (onclickStr.includes('true')) {
                            btn.style.position = 'relative';
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
                            btn.appendChild(checkMark);
                        }
                    });
                    // @keyframes checkBounce 已移至 JS injectGlobalAnimationStyles()
                    // 語音提示
                    this.TimerManager.setTimeout(() => {
                        this.speech.speakText('提示，請看綠色勾勾的選項');
                    }, 500, 'speechDelay');
                }

                // 顯示紅色×動畫
                selectedBtn.style.position = 'relative';
                const wrongOverlay = document.createElement('div');
                wrongOverlay.innerHTML = '❌';
                wrongOverlay.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(0);
                    font-size: 80px;
                    z-index: 10;
                    animation: wrongPopOut 0.8s ease forwards;
                `;
                selectedBtn.appendChild(wrongOverlay);

                // @keyframes wrongPopOut 已移至 JS injectGlobalAnimationStyles()

                // 標記錯誤選項為紅色邊框，但保持可見
                selectedBtn.style.borderColor = '#c62d42';
                selectedBtn.style.background = 'linear-gradient(135deg, #ffebee, #ffcdd2)';

                // 1秒後隱藏金額、移除錯誤標記、恢復按鈕狀態
                this.TimerManager.setTimeout(() => {
                    // 移除錯誤標記
                    wrongOverlay.remove();

                    // 隱藏金額
                    if (amountDisplay) {
                        amountDisplay.style.opacity = '0';
                    }

                    // 恢復邊框和背景顏色
                    selectedBtn.style.borderColor = '#ffcc02';
                    selectedBtn.style.background = 'linear-gradient(135deg, #f8f9fa, #e9ecef)';

                    // 重新啟用所有按鈕（包括這個錯誤的）
                    optionBtns.forEach(btn => {
                        btn.disabled = false;
                        btn.style.cursor = 'pointer';
                    });

                    this.Debug.log('flow', '[A3-McDonald] 錯誤選項已重置');
                }, 1000, 'uiAnimation');
            }
        },

        initializeChangeDragAndDrop() {
            const changeItems = document.querySelectorAll('.change-money-item');
            const collectionArea = document.getElementById('change-collection-area');
            const changeTargets = document.querySelectorAll('.change-target');

            if (!collectionArea) return;

            // 儲存當前拖曳的元素
            let currentDraggedItem = null;

            // 為每個找零金錢添加拖曳事件
            changeItems.forEach(item => {
                item.addEventListener('dragstart', (e) => {
                    currentDraggedItem = item;
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        index: parseInt(item.dataset.index),
                        value: parseInt(item.dataset.value),
                        image: item.dataset.image
                    }));
                    // 🆕 去背拖曳預覽：直接用 img 元素（在 opacity 前呼叫確保圖像完整）
                    const _dragImg = item.querySelector('img');
                    if (_dragImg && e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                        const imgW = _dragImg.offsetWidth || 60;
                        const imgH = _dragImg.offsetHeight || imgW;
                        e.dataTransfer.setDragImage(_dragImg, imgW / 2, imgH / 2);
                    }
                    item.style.opacity = '0.5';
                });

                item.addEventListener('dragend', (e) => {
                    item.style.opacity = '1';
                    currentDraggedItem = null;
                });
            });

            // 為每個找零目標添加拖放事件
            changeTargets.forEach(target => {
                target.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!target.classList.contains('filled')) {
                        target.style.borderColor = '#2e7d32';
                        target.style.background = 'rgba(76, 175, 80, 0.3)';
                    }
                });

                target.addEventListener('dragleave', (e) => {
                    if (!target.classList.contains('filled')) {
                        target.style.borderColor = '#4caf50';
                        target.style.background = 'rgba(255, 255, 255, 0.5)';
                    }
                });

                target.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    target.style.borderColor = '#4caf50';
                    target.style.background = 'rgba(255, 255, 255, 0.5)';

                    try {
                        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                        const expectedValue = parseInt(target.dataset.expectedValue);

                        if (data.value === expectedValue && !target.classList.contains('filled')) {
                            this.fillChangeTarget(target, data, currentDraggedItem);
                        } else {
                            // 錯誤時只播放音效，不彈窗，零錢自動退回
                            this.audio.playSound('error');
                            // 將零錢退回原位（顯示被拖曳的元素）
                            if (currentDraggedItem) {
                                currentDraggedItem.style.display = '';
                            }
                        }
                    } catch (error) {
                        McDonald.Debug.error('拖曳數據解析錯誤:', error);
                    }
                });
            });

            // 收回零錢區整體接收拖曳（向下兼容）
            collectionArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            collectionArea.addEventListener('drop', (e) => {
                // 只有在沒有落在具體目標上時才處理
                if (e.target === collectionArea) {
                    e.preventDefault();
                    // 錯誤時只播放音效，不彈窗
                    this.audio.playSound('error');
                    // 零錢自動退回原位
                    if (currentDraggedItem) {
                        currentDraggedItem.style.display = '';
                    }
                }
            });

            // 初始化觸控螢幕支援
            this.initializeTouchDragForChange();
        },

        // 填充找零目標
        fillChangeTarget(target, data, draggedElement) {
            // 🔧 輔助點擊模式：不允許使用者直接拖曳找零，須透過點擊模式操作
            // draggedElement 為 null 代表由 autoCollectChange 呼叫（允許），非 null 代表使用者直接拖曳（封鎖）
            if (draggedElement && this.state.settings.clickMode && this.state.gameState.clickModeState?.enabled) {
                this.audio.playSound('error');
                if (draggedElement.style) draggedElement.style.opacity = '1';
                return;
            }

            this.audio.playSound('beep');
            if (this.state.settings.difficulty === 'easy' && !this.state.settings.clickMode) this.playStepSuccess();

            // 標記目標為已填充
            target.classList.remove('faded');
            target.classList.add('filled');
            target.style.opacity = '1';
            target.style.filter = 'none'; // 🆕 移除灰階濾鏡
            target.style.border = '3px solid #4caf50';
            target.style.background = 'rgba(76, 175, 80, 0.2)';

            // 從店家找零區移除金錢
            if (draggedElement) {
                draggedElement.remove();
            }

            // 更新收回金額
            this.state.gameState.changeCollected.push({ value: data.value, image: data.image });
            const totalCollected = this.state.gameState.changeCollected.reduce((sum, coin) => sum + coin.value, 0);

            // 更新顯示
            const collectedAmount = document.getElementById('collected-amount');
            if (collectedAmount) {
                collectedAmount.textContent = `已找回零錢：NT$ ${totalCollected}`;
            }

            // 防抖動語音播報（快速拖曳只播最後一個）
            if (this.state.gameState.changeSpeechTimer) {
                this.TimerManager.clearTimeout(this.state.gameState.changeSpeechTimer);
            }
            this.state.gameState.changeSpeechTimer = this.TimerManager.setTimeout(() => {
                this.speech.speak('collectedAmount', { total: totalCollected });
            }, 500, 'speechDelay');

            // 檢查是否所有目標都已填充
            const allFilled = document.querySelectorAll('.change-target.filled').length ===
                              document.querySelectorAll('.change-target').length;

            if (allFilled) {
                const completeBtn = document.getElementById('complete-change-btn');
                if (completeBtn) {
                    completeBtn.disabled = false;
                    completeBtn.style.opacity = '1';
                    // 🎯 簡單模式：顯示「點這裡」提示動畫
                    if (this.state.settings.difficulty === 'easy' &&
                        !completeBtn.classList.contains('checkout-btn-hint')) {
                        this.TimerManager.setTimeout(() => {
                            completeBtn.classList.add('checkout-btn-hint');
                        }, 300, 'hint');
                    }
                }
            }

            this.Debug.log('flow', `[A3-McDonald] 找零目標填充: ${data.value}元, 總計: ${totalCollected}元`);
        },

        initializeTouchDragForChange() {
            if (!window.TouchDragUtility) {
                McDonald.Debug.warn('event', '⚠️ TouchDragUtility 未載入，跳過觸控支援');
                return;
            }

            try {
                this.Debug.log('payment', '🎯 [A3-找零驗證] 初始化 TouchDragUtility 觸控支援');

                const app = document.getElementById('app');
                if (!app) {
                    McDonald.Debug.error('❌ 找不到遊戲區域');
                    return;
                }

                // 取消之前的註冊
                window.TouchDragUtility.unregisterDraggable(app);

                // 🔧 [觸控修復] 註冊drop zones - 先註冊具體目標，後註冊容器
                // 這樣可以確保觸控檢測時優先匹配具體目標

                // 先註冊所有找零目標（具體目標）
                document.querySelectorAll('.change-target').forEach(target => {
                    window.TouchDragUtility.registerDropZone(target);
                });

                // 後註冊找零收集區域（容器）
                const changeCollectionArea = document.getElementById('change-collection-area');
                if (changeCollectionArea) {
                    window.TouchDragUtility.registerDropZone(changeCollectionArea);
                }

                // 註冊可拖曳元素
                window.TouchDragUtility.registerDraggable(
                    app,
                    '.change-money-item[draggable="true"]',
                    {
                        onDragStart: (element, event) => {
                            McDonald.Debug.log('event', '📱 找零觸控拖曳開始:', element.dataset.value);
                            return true;
                        },
                        onDrop: (draggedElement, dropZone, receivedEvent) => {
                            McDonald.Debug.log('event', '📱 找零觸控放置:', draggedElement.dataset.value);

                            const value = parseInt(draggedElement.dataset.value);
                            const image = draggedElement.dataset.image;

                            // 檢查是否放置在具體的找零目標上
                            const changeTarget = dropZone.closest('.change-target');
                            if (changeTarget) {
                                const expectedValue = parseInt(changeTarget.dataset.expectedValue);
                                if (value === expectedValue && !changeTarget.classList.contains('filled')) {
                                    this.fillChangeTarget(changeTarget, { value, image }, draggedElement);
                                } else {
                                    // 錯誤時只播放音效，不彈窗，零錢自動退回
                                    this.audio.playSound('error');
                                }
                            } else {
                                // 檢查是否放置在收回區但不在目標上
                                const collectionArea = document.getElementById('change-collection-area');
                                if (dropZone === collectionArea || collectionArea.contains(dropZone)) {
                                    // 錯誤時只播放音效，不彈窗
                                    this.audio.playSound('error');
                                }
                            }
                        }
                    }
                );

                this.Debug.log('payment', '✅ [A3-找零驗證] 觸控支援初始化完成');
            } catch (error) {
                McDonald.Debug.error('❌ [A3-找零驗證] 觸控支援初始化失敗:', error);
            }
        },

        collectChangeMoney(index, value, image) {
            this.audio.playSound('beep');

            // 添加到已收回陣列
            this.state.gameState.changeCollected.push({ index, value, image });

            // 移除該金錢項目
            const item = document.querySelector(`.change-money-item[data-index="${index}"]`);
            if (item) {
                item.remove();
            }

            // 更新顯示
            const collectionArea = document.getElementById('change-collection-area');
            const changeHint = document.getElementById('change-hint');
            const collectedDisplay = document.getElementById('collected-change-display');
            const collectedMoneyImages = document.getElementById('collected-money-images');
            const collectedAmount = document.getElementById('collected-amount');
            const completeBtn = document.getElementById('complete-change-btn');

            if (changeHint && collectedDisplay && collectedMoneyImages && collectedAmount && completeBtn) {
                changeHint.style.display = 'none';
                collectedDisplay.style.display = 'block';

                const totalCollected = this.state.gameState.changeCollected.reduce((sum, coin) => sum + coin.value, 0);

                // 生成收回零錢的圖片顯示
                const collectedMoneyHTML = this.state.gameState.changeCollected.map((coin, idx) => `
                    <div style="display: inline-block; margin: 5px; text-align: center;">
                        <img src="../images/${coin.image}"
                             alt="${coin.value}元"
                             style="width: 60px; height: auto; border-radius: 8px;
                                    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);">
                    </div>
                `).join('');

                // 更新圖片顯示
                collectedMoneyImages.innerHTML = collectedMoneyHTML;

                // 更新總計金額
                collectedAmount.textContent = `總計：NT$ ${totalCollected}`;

                // 檢查是否收回所有零錢
                if (this.state.gameState.changeCollected.length === this.state.gameState.changeCoins.length) {
                    completeBtn.disabled = false;
                    completeBtn.style.opacity = '1';
                }
            }
        },

        completeChangeCollection() {
            const totalCollected = this.state.gameState.changeCollected.reduce((sum, coin) => sum + coin.value, 0);
            const expected = this.state.gameState.changeExpected;

            if (totalCollected === expected) {
                this.audio.playSound('success');
                if (this.state.settings.difficulty === 'easy' && !this.state.settings.clickMode) this.playStepSuccess(true); // success 已播放 correct02.mp3

                // 完成訂單
                this.state.gameState.orderNumber = this.generateRandomOrderNumber();
                this.state.gameState.completedOrders++;

                this.TimerManager.setTimeout(() => {
                    this.completeOrder();
                }, 1000, 'screenTransition');
            } else {
                this.audio.playSound('error');
                this.showToast(`收回的零錢金額不正確！應收 NT$ ${expected}，實收 NT$ ${totalCollected}`, 'error');
            }
        },

        completeOrder() {
            const orderNumber = this.state.gameState.orderNumber;
            const orderItems = this.state.gameState.cart.slice(); // 複製購物車內容用於收據
            const totalAmount = this.state.gameState.totalAmount;
            const paidAmount = this.state.gameState.paidAmount || totalAmount;
            const changeAmount = paidAmount - totalAmount;

            // 顯示訂單完成訊息
            const app = document.getElementById('app');
            if (app) {
                // 🆕 允許頁面滾動（A4 架構：Body 鎖死，#app 負責滾動）
                app.style.overflowY = 'auto';
                app.style.height = '100%';
                app.innerHTML = `
                    ${this.HTMLTemplates.titleBar(6, '點餐完成')}
                    <div style="display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; background: linear-gradient(135deg, #ffcc02, #ff8f00); padding: 40px 20px; box-sizing: border-box; overflow-y: auto; -webkit-overflow-scrolling: touch;">
                        <div style="background: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 8px 25px rgba(0,0,0,0.2); max-width: 650px; width: 100%; box-sizing: border-box;">
                            <h2 style="color: #c62d42; font-size: 2.5em; margin-bottom: 20px; animation: bounce 1s ease;">🎉 感謝您的取餐！</h2>

                            <!-- 動態取餐號碼 -->
                            <div style="background: linear-gradient(135deg, #ffcc02, #ff8f00); padding: 20px; border-radius: 15px; margin: 20px 0;">
                                <div id="dynamic-order-number" style="font-size: 4em; margin: 10px 0; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">001</div>
                                <div style="font-size: 1.5em; margin-bottom: 10px; color: white; font-weight: 600;">取餐號碼</div>
                            </div>

                            <!-- 取餐按鈕（初始隱藏） -->
                            <div id="pickup-button-container" style="display: none; margin: 20px 0;">
                                <button id="pickup-order-btn" onclick="McDonald.showPickupComplete()" style="background: linear-gradient(135deg, #4caf50, #45a049); color: white; border: none; padding: 20px 50px; border-radius: 25px; font-size: 1.5em; font-weight: 700; cursor: pointer; box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4); transition: all 0.3s ease; animation: pickupIconPulse 2s infinite;" onmouseover="this.style.transform='scale(1.05)';" onmouseout="this.style.transform='scale(1)';">
                                    🍔 取餐
                                </button>
                            </div>

                            <!-- 交易明細 -->
                            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0; text-align: left; border: 2px solid #ffcc02;">
                                <h3 style="color: #c62d42; margin: 0 0 15px 0; text-align: center; font-size: 1.5em;">📋 交易明細</h3>

                                <!-- 本次取餐號碼 -->
                                <div style="background: linear-gradient(135deg, #fff3cd, #ffe69c); padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center; border: 2px solid #ffcc02;">
                                    <div style="font-size: 1.1em; color: #666; margin-bottom: 5px;">本次取餐號碼</div>
                                    <div style="font-size: 2em; color: #c62d42; font-weight: 700;">${String(orderNumber).padStart(3, '0')}</div>
                                </div>

                                <!-- 訂單項目 -->
                                <div style="margin-bottom: 20px;">
                                    ${this.generateOrderSummary(orderItems)}
                                </div>

                                <!-- 付款資訊 -->
                                <div style="border-top: 2px solid #ffcc02; padding-top: 15px; margin-top: 15px;">
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 1.1em;">
                                        <span style="color: #666;">訂單金額：</span>
                                        <span style="font-weight: 600; color: #333;">NT$ ${totalAmount}</span>
                                    </div>
                                    ${paidAmount > 0 ? `
                                        <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 1.1em;">
                                            <span style="color: #666;">實付金額：</span>
                                            <span style="font-weight: 600; color: #333;">NT$ ${paidAmount}</span>
                                        </div>
                                    ` : ''}
                                    ${changeAmount > 0 ? `
                                        <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 1.1em;">
                                            <span style="color: #666;">找零金額：</span>
                                            <span style="font-weight: 600; color: #4caf50;">NT$ ${changeAmount}</span>
                                        </div>
                                    ` : ''}
                                    <div style="border-top: 3px solid #c62d42; padding-top: 15px; margin-top: 15px; text-align: center;">
                                        <strong style="font-size: 1.4em; color: #c62d42;">總計：NT$ ${totalAmount}</strong>
                                    </div>
                                </div>
                            </div>

                            <div style="font-size: 1.2em; margin-bottom: 30px; color: #666;">請持此號碼至櫃檯取餐</div>
                            <div style="font-size: 1em; margin-bottom: 30px; color: #999;">預計準備時間：5-10分鐘</div>

                            <div style="display: none; gap: 20px; justify-content: center; flex-wrap: wrap;">
                                <button onclick="McDonald.printReceipt()" style="background: #4caf50; color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                                    📄 列印收據
                                </button>
                                <button onclick="McDonald.startOver()" style="background: #ffcc02; color: #333; border: none; padding: 15px 30px; border-radius: 25px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                                    🍔 再次點餐
                                </button>
                                <button onclick="McDonald.goBackToMenu()" style="background: #f5f5f5; color: #333; border: 2px solid #ccc; padding: 15px 30px; border-radius: 25px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                                    🏠 返回主選單
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }

            this.speech.speak('orderComplete', { orderNumber });
            this.Debug.log('flow', `[A3-McDonald] 訂單完成，訂單號碼: ${orderNumber}`);

            // 啟動動態號碼計數器
            this.startOrderNumberAnimation(orderNumber);
        },

        // ==================== 輔助點擊模式（單鍵操作） ====================

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
            gs.clickModeState.lastClickTime = Date.now(); // 設定當前時間，避免立即觸發

            this.Debug.log('assist', '[A3-ClickMode] 輔助點擊模式已啟用（歡迎畫面）');

            // 添加body class以禁用動畫
            document.body.classList.add('click-mode-enabled');

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
         * 初始化輔助點擊模式
         * 在進入點餐場景時調用
         */
        initClickMode() {
            if (!this.state.settings.clickMode) return;

            const gs = this.state.gameState;

            // 如果已經在歡迎畫面啟用過，不需要重新初始化，只需更新階段
            if (gs.clickModeState.enabled && gs.clickModeState.currentPhase === 'welcome') {
                this.Debug.log('assist', '[A3-ClickMode] 從歡迎畫面繼續，更新階段為 ordering');
                gs.clickModeState.currentPhase = 'ordering';
                gs.clickModeState.waitingForStart = true;
                return;
            }

            // 全新初始化（用於直接進入點餐場景的情況）
            gs.clickModeState.enabled = true;
            gs.clickModeState.currentPhase = 'ordering';
            gs.clickModeState.currentStep = 0;
            gs.clickModeState.actionQueue = [];
            gs.clickModeState.waitingForClick = false;
            gs.clickModeState.waitingForStart = true;
            gs.clickModeState.lastClickTime = 0;

            this.Debug.log('assist', '[A3-ClickMode] 輔助點擊模式已啟用');

            // 添加body class以禁用動畫
            document.body.classList.add('click-mode-enabled');

            // 綁定全局點擊事件
            this.bindClickModeHandler();

            // 延遲顯示「準備開始」提示（等待歡迎語音和初始動畫完成）
            this.TimerManager.setTimeout(() => {
                this.showStartPrompt();
            }, 2000, 'clickMode');
        },

        /**
         * 建立當前階段的操作序列
         * @param {string} phase - 階段：ordering, payment, change, pickup
         */
        buildActionQueue(phase) {
            const gs = this.state.gameState;
            const queue = [];

            if (phase === 'ordering') {
                // 點餐階段：依序選擇所有指定餐點
                const assignedItems = this.state.settings.difficulty === 'easy'
                    ? this.state.gameState.assignedItems
                    : [];

                assignedItems.forEach(item => {
                    queue.push({
                        type: 'selectItem',
                        data: { itemId: item.id, itemName: item.name }
                    });
                });

                // 倒數第二步：點擊結帳按鈕（進入付款方式選擇頁面）
                queue.push({
                    type: 'checkout',
                    data: {}
                });

                // 最後一步：選擇付款方式（至櫃臺結帳）
                queue.push({
                    type: 'selectPaymentMethod',
                    data: {}
                });

            } else if (phase === 'payment') {
                // 付款階段：依序支付所需金額
                let payment = [];

                // 簡單模式：使用系統計算的最佳付款方案（最少找零）
                if (this.state.settings.difficulty === 'easy' && gs.optimalPaymentTargets) {
                    payment = gs.optimalPaymentTargets.map(target => target.value);
                    this.Debug.log('assist', '[A3-ClickMode] 使用系統最佳付款方案:', payment);
                } else {
                    // 普通/困難模式：計算精確付款
                    const totalAmount = gs.totalAmount;
                    payment = this.calculateOptimalPayment(totalAmount);
                    this.Debug.log('assist', '[A3-ClickMode] 計算精確付款:', payment);
                }

                payment.forEach(coin => {
                    queue.push({
                        type: 'payMoney',
                        data: { value: coin }
                    });
                });

                // 最後一步：確認付款
                queue.push({
                    type: 'confirmPayment',
                    data: {}
                });

            } else if (phase === 'change') {
                // 找零階段：依序領取所有零錢
                const changeCoins = gs.changeCoins || [];

                changeCoins.forEach(coin => {
                    queue.push({
                        type: 'collectChange',
                        data: { value: coin.value }
                    });
                });

                // 最後一步：確認完成
                queue.push({
                    type: 'confirmChange',
                    data: {}
                });

            } else if (phase === 'pickup') {
                // 取餐階段：只需點擊取餐按鈕
                queue.push({
                    type: 'pickupOrder',
                    data: {}
                });

            } else if (phase === 'orderAgain') {
                // 再次點餐階段：點擊「再次點餐」按鈕
                queue.push({
                    type: 'clickOrderAgain',
                    data: {}
                });
            }

            gs.clickModeState.actionQueue = queue;
            gs.clickModeState.totalSteps = queue.length;
            gs.clickModeState.currentStep = 0;
            gs.clickModeState.currentPhase = phase;

            this.Debug.log('assist', `[A3-ClickMode] 建立操作序列 (${phase}):`, queue.length, '步驟');

            // 顯示第一步提示
            if (queue.length > 0) {
                // this.showClickPrompt(); // 已停用，改用開始時的橫幅提示
                gs.clickModeState.waitingForClick = true;

                // 🆕 簡單模式：啟動視覺延遲機制
                if (this.state.settings.difficulty === 'easy') {
                    this.enableClickModeWithVisualDelay(`BuildQueue-${phase}`);
                }
            }
        },

        /**
         * 計算最優付款組合（最少紙鈔硬幣數量）
         */
        calculateOptimalPayment(amount) {
            const denominations = [1000, 500, 100, 50, 10, 5, 1];
            const result = [];
            let remaining = amount;

            for (const value of denominations) {
                while (remaining >= value) {
                    result.push(value);
                    remaining -= value;
                }
            }

            return result;
        },

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

            // 2. 檢測是否已有視覺提示在畫面上（A3 可能使用 .correct-money-hint 或其他類）
            const existingHintElement = document.querySelector('.correct-money-hint, .easy-mode-hint, .hint-highlight');

            if (existingHintElement) {
                // 視覺提示已存在，立即解鎖（因為用戶已經看到了）
                this.Debug.log('assist', `[A3-ClickMode] 🔍 視覺提示已存在 (${source})，立即解鎖`);
                // 🔧 修復：如果正在執行中，跳過等待狀態設定（參考 A1）
                if (clickState.isExecuting) {
                    this.Debug.log('assist', `[A3-ClickMode] 🔍 操作執行中，跳過等待狀態設定`);
                } else {
                    clickState.waitingForClick = true;
                }
                // 🔧 時間回溯：讓系統認為「已經準備好很久了」
                clickState.clickReadyTime = Date.now() - 1000;
                // 🔧 修復：不要在這裡設定 isExecuting = false，讓 moveToNextStep 來控制
            } else {
                // 視覺提示尚未出現，等待 0.5秒 後解鎖
                this.Debug.log('assist', `[A3-ClickMode] 🔒 視覺元素出現 (${source})，啟動 0.5秒 安全鎖定...`);

                clickState._visualDelayTimer = this.TimerManager.setTimeout(() => {
                    if (clickState) {
                        // 🔧 修復：如果正在執行中，跳過
                        if (clickState.isExecuting) {
                            this.Debug.log('assist', `[A3-ClickMode] 🔍 操作執行中，跳過 0.5秒 解鎖`);
                            return;
                        }
                        clickState.waitingForClick = true;
                        // 🔧 時間回溯 1000ms
                        clickState.clickReadyTime = Date.now() - 1000;
                        // 🔧 修復：不要在這裡設定 isExecuting = false
                        this.Debug.log('assist', `[A3-ClickMode] 🟢 0.5秒已過，解除鎖定 (已繞過防誤觸檢查)`);
                    }
                }, 500, 'clickMode');

                // 🛡️ 安全網：1.5秒後強制解鎖（防止系統卡死）
                this.TimerManager.setTimeout(() => {
                    if (clickState && !clickState.waitingForClick) {
                        // 🔧 修復：如果正在執行中，跳過安全網
                        if (clickState.isExecuting) {
                            this.Debug.log('assist', `[A3-ClickMode] 🔍 操作執行中，跳過安全網解鎖`);
                            return;
                        }
                        this.Debug.log('assist', `[A3-ClickMode] ⚠️ 無視覺提示，啟動安全網解鎖 (${source})`);
                        clickState.waitingForClick = true;
                        clickState.clickReadyTime = Date.now() - 1000;
                        // 🔧 修復：不要在這裡設定 isExecuting = false
                    }
                }, 1500, 'clickMode');
            }
        },

        /**
         * 綁定全局點擊事件處理器
         */
        bindClickModeHandler() {
            // 建立輔助點擊遮罩（全程覆蓋，直到 click mode 結束）
            if (!document.getElementById('click-exec-overlay')) {
                const _ov = document.createElement('div');
                _ov.id = 'click-exec-overlay';
                const _tbEl = document.querySelector('.mcdonalds-title-bar');
                const _tbBottom = _tbEl ? Math.round(_tbEl.getBoundingClientRect().bottom) : 60;
                _ov.style.cssText = `position:fixed;top:${_tbBottom}px;left:0;right:0;bottom:0;z-index:10100;pointer-events:all;touch-action:none;background:transparent;`;
                document.body.appendChild(_ov);
            }

            // 移除舊的監聽器（如果存在）
            if (this.clickModeHandler) {
                document.removeEventListener('click', this.clickModeHandler, true);
            }

            // 創建新的監聽器（捕獲階段，確保在 menu item 等元素之前攔截）
            this.clickModeHandler = (e) => {
                this.handleClickModeClick(e);
            };

            document.addEventListener('click', this.clickModeHandler, true);
            this._clickModeHandlerBound = true; // 標記已綁定
        },

        /**
         * 解除全局點擊事件處理器
         */
        unbindClickModeHandler() {
            document.getElementById('click-exec-overlay')?.remove();
            if (this.clickModeHandler) {
                document.removeEventListener('click', this.clickModeHandler, true);
            }
            this._clickModeHandlerBound = false;
            this.Debug.log('assist', '[A3-ClickMode] 全局點擊事件已解除');
        },

        /**
         * 處理輔助點擊模式的點擊事件
         */
        handleClickModeClick(event) {
            const gs = this.state.gameState;

            // 白名單：返回設定按鈕不攔截
            const target = event.target;
            if (target.tagName === 'BUTTON' && target.textContent.trim() === '返回設定') {
                this.Debug.log('assist', '[A3-ClickMode] 點擊返回設定按鈕，放行');
                return;
            }

            // 程式觸發的點擊直接放行（auto* 函數使用 element.click()，isTrusted=false）
            if (!event.isTrusted) return;

            // 特殊：餐盤畫面（easy+clickMode）— 任意點擊立即導頁，不等語音播完
            if (gs.clickModeState?.onTrayScreen && gs.clickModeState?.trayNavCallback) {
                // 600ms 防快速點擊：避免點「取餐」鈕的同一個 tap 立即觸發導頁
                const now = Date.now();
                const readyTime = gs.clickModeState.trayReadyTime || 0;
                if (now - readyTime < 600) return;
                event.preventDefault();
                event.stopPropagation();
                const navFn = gs.clickModeState.trayNavCallback;
                gs.clickModeState.onTrayScreen = false;
                gs.clickModeState.trayNavCallback = null;
                navFn();
                return;
            }

            // 如果有啟用輔助點擊模式設定，先阻止所有原始事件（即使尚未啟用也要阻止）
            if (this.state.settings.clickMode && gs.clickModeState) {
                event.preventDefault();
                event.stopPropagation();
            }

            // 檢查是否啟用輔助點擊模式
            if (!gs.clickModeState || !gs.clickModeState.enabled) {
                return;
            }

            // 🆕 防快速點擊：600ms 安全鎖（從 500ms 提升）
            const now = Date.now();
            const readyTime = gs.clickModeState.clickReadyTime || 0;
            const timeSinceReady = now - readyTime;

            if (timeSinceReady < 600) {
                this.Debug.log('assist', `[A3-ClickMode] ⏳ 點擊過快，忽略 (${timeSinceReady}ms < 600ms)`);
                return;
            }

            gs.clickModeState.lastClickTime = now;

            // 檢查是否在等待開始狀態
            if (gs.clickModeState.waitingForStart) {
                this.Debug.log('assist', '[A3-ClickMode] 開始執行操作序列');
                gs.clickModeState.waitingForStart = false;
                this.hideStartPrompt();

                // 根據當前階段決定動作
                if (gs.clickModeState.currentPhase === 'welcome') {
                    // 歡迎畫面：處理頁面導航
                    this.handleWelcomeNavigation();
                } else {
                    // 點餐階段：建立操作序列
                    this.buildActionQueue('ordering');
                }
                return;
            }

            // 🔧 修復：如果正在執行中，忽略點擊（參考 A1）
            if (gs.clickModeState.isExecuting) {
                this.Debug.log('assist', '[A3-ClickMode] ⚠️ 操作執行中，忽略點擊');
                return;
            }

            // 檢查是否在等待點擊狀態
            if (!gs.clickModeState.waitingForClick) {
                return;
            }

            this.Debug.log('assist', '[A3-ClickMode] 收到點擊，執行下一步');

            // 根據當前階段決定動作
            if (gs.clickModeState.currentPhase === 'welcome') {
                // 歡迎畫面：繼續頁面導航
                this.handleWelcomeNavigation();
            } else {
                // 其他階段：執行下一步操作
                this.executeNextAction();
            }
        },

        /**
         * 處理歡迎畫面的頁面導航（輔助點擊模式）
         */
        handleWelcomeNavigation() {
            const gs = this.state.gameState;
            const currentPage = gs.welcomePageIndex || 1;

            this.Debug.log('assist', `[A3-ClickMode] 歡迎畫面導航：當前第 ${currentPage} 頁`);

            if (currentPage === 1) {
                // 從第1頁進入第2頁
                gs.welcomePageIndex = 2;
                this.showWelcomePage2();

                // 暫時禁用點擊，等待頁面完全載入（避免立即跳過）
                gs.clickModeState.waitingForClick = false;

                // 延遲後才允許繼續點擊
                this.TimerManager.setTimeout(() => {
                    gs.clickModeState.waitingForClick = true;
                }, 1500, 'clickMode'); // 給予1.5秒時間查看錢包內容

            } else if (currentPage === 2) {
                // 從第2頁進入點餐場景
                gs.welcomePageIndex = 1; // 重置頁面索引
                gs.clickModeState.currentPhase = 'ordering';
                gs.clickModeState.waitingForClick = false;

                // 進入點餐場景
                this.startOrdering();
            }
        },

        /**
         * 執行操作序列中的下一步
         */
        executeNextAction() {
            const gs = this.state.gameState;
            const { actionQueue, currentStep } = gs.clickModeState;

            // 🔧 修復：防止並發執行（參考 A1）
            if (gs.clickModeState.isExecuting) {
                this.Debug.log('assist', '[A3-ClickMode] ⚠️ 操作執行中，忽略重複調用');
                return;
            }

            // 檢查是否還有待執行的操作
            if (currentStep >= actionQueue.length) {
                this.Debug.log('assist', '[A3-ClickMode] 當前階段所有操作已完成');
                gs.clickModeState.waitingForClick = false;
                gs.clickModeState.isExecuting = false; // 🔧 修復：確保解鎖
                this.hideClickPrompt();
                return;
            }

            // 取得當前操作
            const action = actionQueue[currentStep];
            this.Debug.log('assist', `[A3-ClickMode] 執行步驟 ${currentStep + 1}/${actionQueue.length}:`, action.type);

            // 🔧 修復：設置執行鎖
            gs.clickModeState.isExecuting = true;

            // 🔧 修復：先遞增 step，防止重複執行同一操作（參考 A1/A6）
            gs.clickModeState.currentStep++;

            // 暫時停止等待點擊（執行期間不接受新點擊）
            gs.clickModeState.waitingForClick = false;
            this.hideClickPrompt();

            // 根據操作類型執行對應邏輯
            switch (action.type) {
                case 'selectItem':
                    this.autoSelectMenuItem(action.data.itemId, action.data.itemName);
                    break;

                case 'checkout':
                    this.autoClickCheckout();
                    break;

                case 'selectPaymentMethod':
                    this.autoSelectPaymentMethod();
                    break;

                case 'payMoney':
                    this.autoPayMoney(action.data.value);
                    break;

                case 'confirmPayment':
                    this.autoConfirmPayment();
                    break;

                case 'collectChange':
                    this.autoCollectChange(action.data.value);
                    break;

                case 'confirmChange':
                    this.autoConfirmChange();
                    break;

                case 'pickupOrder':
                    this.autoPickupOrder();
                    break;

                case 'clickOrderAgain':
                    this.autoClickOrderAgain();
                    break;

                default:
                    McDonald.Debug.warn('assist', '[A3-ClickMode] 未知的操作類型:', action.type);
                    this.moveToNextStep();
            }
        },

        /**
         * 移動到下一步（完成當前操作後調用）
         */
        moveToNextStep() {
            const gs = this.state.gameState;
            // 🔧 修復：currentStep 已在 executeNextAction 中遞增，這裡不再重複
            // gs.clickModeState.currentStep++;

            // 延遲後顯示下一步提示
            this.TimerManager.setTimeout(() => {
                if (gs.clickModeState.currentStep < gs.clickModeState.actionQueue.length) {
                    // 🔧 修復：在設置 waitingForClick 時才解鎖
                    gs.clickModeState.isExecuting = false;
                    // this.showClickPrompt(); // 已停用，改用開始時的橫幅提示
                    gs.clickModeState.waitingForClick = true;

                    // 🆕 簡單模式：啟動視覺延遲機制（安全網）
                    if (this.state.settings.difficulty === 'easy') {
                        const action = gs.clickModeState.actionQueue[gs.clickModeState.currentStep];
                        this.enableClickModeWithVisualDelay(`ActionQueue-${action?.type || 'unknown'}`);
                    }
                } else {
                    this.Debug.log('assist', '[A3-ClickMode] 階段完成');
                    gs.clickModeState.waitingForClick = false;
                    gs.clickModeState.isExecuting = false; // 🔧 修復：階段完成時解鎖
                    this.hideClickPrompt();
                }
            }, 800, 'clickMode'); // 給予用戶反應時間
        },

        /**
         * 自動選擇餐點
         */
        autoSelectMenuItem(itemId, itemName) {
            this.Debug.log('assist', `[A3-ClickMode] 自動選擇餐點: ${itemName}`);

            // 播放點擊音效
            this.audio.playSound('addToCart');
            this.playStepSuccess(true); // addToCart 已播放 correct02.mp3

            // 不播放額外語音，只保留原本系統的語音
            // （已移除 SpeechSynthesisUtterance，避免低品質語音干擾）

            // 執行選擇餐點邏輯 - 從指定餐點中找到對應項目
            const assignedItem = this.state.gameState.assignedItems.find(item => item.id === itemId);

            if (assignedItem) {
                // 調用 addToCart，傳入 itemId 和 categoryId
                this.addToCart(itemId, assignedItem.category);

                // 完成後移動到下一步
                this.TimerManager.setTimeout(() => {
                    this.moveToNextStep();
                }, 1000, 'clickMode');
            } else {
                McDonald.Debug.error('[A3-ClickMode] 找不到指定餐點:', itemId);
                this.moveToNextStep();
            }
        },

        /**
         * 自動點擊結帳按鈕
         */
        autoClickCheckout() {
            this.Debug.log('assist', '[A3-ClickMode] 自動點擊結帳');

            this.audio.playSound('beep');
            this.playStepSuccess();

            // 執行結帳邏輯（顯示付款方式選擇頁面）
            this.checkout();

            // 移至下一步（selectPaymentMethod），等待用戶點擊「至櫃臺結帳」
            this.TimerManager.setTimeout(() => {
                this.moveToNextStep();
            }, 500, 'clickMode');
        },

        /**
         * 自動選擇付款方式（至櫃臺結帳）
         */
        autoSelectPaymentMethod() {
            this.Debug.log('assist', '[A3-ClickMode] 自動選擇付款方式：至櫃臺結帳');

            this.audio.playSound('beep');
            this.playStepSuccess();

            // 執行選擇付款方式（進入付款畫面）
            this.showCounterPayment();

            // 延遲後建立付款操作序列（確保 availableWalletMoney 已初始化）
            this.TimerManager.setTimeout(() => {
                // 🔧 修復：在建立新階段的操作序列前，先解鎖 isExecuting
                // 因為 selectPaymentMethod 是 ordering 階段的最後一步，不會調用 moveToNextStep()
                this.state.gameState.clickModeState.isExecuting = false;
                this.buildActionQueue('payment');
            }, 500, 'clickMode');
        },

        /**
         * 自動支付金錢
         */
        autoPayMoney(value) {
            this.Debug.log('assist', `[A3-ClickMode] 自動支付: $${value}`);

            // 播放音效
            this.audio.playSound('beep');
            this.playStepSuccess();

            // 不播放額外語音，只保留原本系統的語音
            // （已移除 SpeechSynthesisUtterance，避免低品質語音干擾）

            // 從可用錢包中找到對應金額的錢
            const availableMoney = this.state.gameState.availableWalletMoney || [];
            const moneyIndex = availableMoney.findIndex(m => m.value === value);

            if (moneyIndex > -1) {
                const money = availableMoney[moneyIndex];

                // 注意：不在此處 splice availableWalletMoney——
                // fillPaymentTarget / addMoneyToPaymentArea 內部已各自處理移除，
                // 若在此重複移除會導致雙重扣除（兩張 $100 在步驟1 同時消失，步驟2 找不到金額）

                // 從錢包區域移除顯示
                const walletItem = document.querySelector(`#wallet-area .money-item[data-value="${value}"]`);
                if (walletItem) {
                    walletItem.remove();
                }

                // 根據難度模式選擇不同的處理方式
                const difficulty = this.state.settings.difficulty;

                if (difficulty === 'easy') {
                    // 簡單模式：填充到目標位置
                    // 找到第一個未填充的目標
                    const unfilledTarget = document.querySelector('.payment-target:not(.filled)');
                    if (unfilledTarget) {
                        this.fillPaymentTarget(unfilledTarget, { value: money.value, image: money.image }, null);
                    } else {
                        McDonald.Debug.error('[A3-ClickMode] 找不到未填充的付款目標');
                        this.moveToNextStep();
                        return;
                    }
                } else {
                    // 普通/困難模式：直接添加到付款區
                    this.addMoneyToPaymentArea({ value: money.value, image: money.image }, null);
                }

                // 移動到下一步
                this.TimerManager.setTimeout(() => {
                    // 檢查是否所有付款目標都已填充，如果是則顯示確認付款按鈕提示
                    const unfilledTargets = document.querySelectorAll('.payment-target:not(.filled)');
                    if (unfilledTargets.length === 0) {
                        // 所有付款目標已填充，顯示按鈕提示
                        this.TimerManager.setTimeout(() => {
                            this.showButtonHint('confirm-payment-btn');
                        }, 300, 'clickMode');
                    }

                    this.moveToNextStep();
                }, 600, 'clickMode');
            } else {
                McDonald.Debug.error('[A3-ClickMode] 錢包中找不到金額:', value);
                this.moveToNextStep();
            }
        },

        /**
         * 顯示按鈕提示動畫
         */
        showButtonHint(buttonId) {
            const button = document.getElementById(buttonId);
            if (button && !button.classList.contains('checkout-btn-hint')) {
                button.classList.add('checkout-btn-hint');
                this.Debug.log('assist', `[A3-ClickMode] 顯示按鈕提示: ${buttonId}`);
            }
        },

        /**
         * 隱藏按鈕提示動畫
         */
        hideButtonHint(buttonId) {
            const button = document.getElementById(buttonId);
            if (button) {
                button.classList.remove('checkout-btn-hint');
            }
        },

        /**
         * 每步成功煙火動畫（簡單模式 & 輔助點擊模式）
         */
        playStepSuccess(skipSound = false) {
            // 播放 correct02.mp3（若原步驟已播放 correct02，傳入 true 跳過避免重複）
            if (!skipSound) new Audio('../audio/units/correct02.mp3').play().catch(() => {});
            // 煙火動畫
            if (typeof confetti !== 'function') return;
            confetti({
                particleCount: 40,
                angle: 90,
                spread: 60,
                origin: { x: 0.5, y: 0.25 },
                startVelocity: 30,
                ticks: 60,
                colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4CAF50', '#2196F3', '#FF69B4']
            });
        },

        /**
         * 自動確認付款
         */
        autoConfirmPayment() {
            this.Debug.log('assist', '[A3-ClickMode] 自動確認付款');

            this.audio.playSound('success');
            this.playStepSuccess(true); // success 已播放 correct02.mp3

            // 隱藏按鈕提示
            this.hideButtonHint('confirm-payment-btn');

            // 執行確認付款邏輯
            const confirmButton = document.getElementById('confirm-payment-btn');
            if (confirmButton && !confirmButton.disabled) {
                this.confirmPayment();

                // 🔧 修復：不在這裡決定 queue 類型
                // queue 將由 showChangeVerification() 或 showPickupComplete() 在渲染時建立
                // 🔧【修復】只解除 isExecuting 鎖定，不自動執行下一步
                // 找零/取餐 queue 由 showChangeVerification() 建立並設好 waitingForClick=true，
                // 等使用者點擊後才由 handleClickModeClick → executeNextAction 觸發，
                // 避免付款確認後直接跳至步驟3而未等待使用者點擊。
                this.TimerManager.setTimeout(() => {
                    const clickState = this.state.gameState.clickModeState;
                    clickState.isExecuting = false;
                }, 1500, 'clickMode');
            } else {
                McDonald.Debug.error('[A3-ClickMode] 確認付款按鈕不可用');
                this.moveToNextStep();
            }
        },

        /**
         * 自動領取零錢
         */
        autoCollectChange(value) {
            this.Debug.log('assist', `[A3-ClickMode] 自動領取零錢: $${value}`);

            // 播放音效
            this.audio.playSound('beep');
            this.playStepSuccess();

            // 找到對應的零錢元素以獲取 image
            const coinElement = document.querySelector(`.change-money-item[data-value="${value}"]`);
            if (!coinElement) {
                McDonald.Debug.error('[A3-ClickMode] 找不到零錢元素:', value);
                this.moveToNextStep();
                return;
            }

            const image = coinElement.dataset.image;

            // 找到對應的找零目標
            const changeTarget = document.querySelector(`.change-target[data-expected-value="${value}"]:not(.filled)`);
            if (changeTarget) {
                // 先手動移除零錢元素，再以 null 呼叫 fillChangeTarget（避免觸發輔助點擊模式封鎖）
                coinElement.remove();
                this.fillChangeTarget(changeTarget, { value, image }, null);

                // 移動到下一步
                this.TimerManager.setTimeout(() => {
                    // 檢查是否所有找零目標都已填充，如果是則顯示確認找零按鈕提示
                    const unfilledChangeTargets = document.querySelectorAll('.change-target:not(.filled)');
                    if (unfilledChangeTargets.length === 0) {
                        // 所有找零目標已填充，顯示按鈕提示
                        this.TimerManager.setTimeout(() => {
                            this.showButtonHint('complete-change-btn');
                        }, 300, 'clickMode');
                    }

                    this.moveToNextStep();
                }, 600, 'clickMode');
            } else {
                McDonald.Debug.error('[A3-ClickMode] 找不到未填充的找零目標:', value);
                this.moveToNextStep();
            }
        },

        /**
         * 自動確認找零完成
         */
        autoConfirmChange() {
            this.Debug.log('assist', '[A3-ClickMode] 自動確認找零完成');

            this.audio.playSound('success');
            this.playStepSuccess(true); // success 已播放 correct02.mp3

            // 隱藏按鈕提示
            this.hideButtonHint('complete-change-btn');

            // 執行確認找零邏輯（修正按鈕 ID：complete-change-btn）
            const completeButton = document.getElementById('complete-change-btn');
            if (completeButton && !completeButton.disabled) {
                this.completeChangeCollection();

                // 🔧 修復：不在這裡建立 pickup queue
                // pickup queue 將由 showPickupComplete() 在渲染時建立
                this.TimerManager.setTimeout(() => {
                    this.state.gameState.clickModeState.isExecuting = false;
                    // 不再在這裡調用 buildActionQueue('pickup')
                }, 1500, 'clickMode');
            } else {
                McDonald.Debug.error('[A3-ClickMode] 確認找零按鈕不可用或已禁用');
                this.moveToNextStep();
            }
        },

        /**
         * 自動取餐
         */
        autoPickupOrder() {
            this.Debug.log('assist', '[A3-ClickMode] 自動取餐');

            // 隱藏按鈕提示
            this.hideButtonHint('pickup-order-btn');

            // 執行取餐邏輯
            const pickupButton = document.getElementById('pickup-order-btn');
            if (pickupButton) {
                this.playStepSuccess(); // correct02.mp3 由 playStepSuccess 播放
                // showPickupComplete() 會逐一唸完所有餐點後唸總結語音，最後在 callback 內自動
                // 呼叫 startOver() 或 showCompletionSummary()，不需在此另行建立 orderAgain 序列
                this.showPickupComplete();
            } else {
                McDonald.Debug.error('[A3-ClickMode] 找不到取餐按鈕');
                this.moveToNextStep();
            }
        },

        /**
         * 自動點擊「再次點餐」按鈕
         */
        autoClickOrderAgain() {
            this.Debug.log('assist', '[A3-ClickMode] 自動點擊再次點餐');

            this.audio.playSound('success');
            this.playStepSuccess(true); // success 已播放 correct02.mp3

            // 隱藏按鈕提示
            this.hideButtonHint('order-again-btn');

            // 執行再次點餐邏輯
            const orderAgainButton = document.getElementById('order-again-btn');
            if (orderAgainButton) {
                // 重新開始遊戲
                this.startOver();

                this.Debug.log('assist', '[A3-ClickMode] 已重新開始，將重新初始化輔助點擊模式');
            } else {
                McDonald.Debug.error('[A3-ClickMode] 找不到再次點餐按鈕');
                // 仍然嘗試重新開始
                this.startOver();
            }
        },

        /**
         * 顯示點擊提示覆蓋層
         */
        showClickPrompt() {
            const gs = this.state.gameState;
            const { currentStep, totalSteps, actionQueue } = gs.clickModeState;

            // 移除舊的提示層
            this.hideClickPrompt();

            // 創建提示覆蓋層
            const overlay = document.createElement('div');
            overlay.id = 'click-mode-prompt';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.3);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                animation: clickPromptPulse 1.5s ease-in-out infinite;
                cursor: pointer;
            `;

            // 創建提示內容
            const action = actionQueue[currentStep];
            const actionText = this.getActionDescription(action);

            const promptBox = document.createElement('div');
            promptBox.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 60px;
                border-radius: 20px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                font-size: 1.5em;
                max-width: 80%;
            `;

            promptBox.innerHTML = `
                <div style="font-size: 3em; margin-bottom: 20px;">👆</div>
                <div style="font-size: 1.8em; font-weight: bold; margin-bottom: 15px;">
                    點擊螢幕任何位置
                </div>
                <div style="font-size: 1.2em; opacity: 0.9; margin-bottom: 20px;">
                    ${actionText}
                </div>
                <div style="font-size: 1em; opacity: 0.7;">
                    進度: ${currentStep + 1} / ${totalSteps}
                </div>
            `;

            overlay.appendChild(promptBox);
            document.body.appendChild(overlay);

            // @keyframes clickPromptPulse 已移至 JS injectGlobalAnimationStyles()
        },

        /**
         * 隱藏點擊提示覆蓋層
         */
        hideClickPrompt() {
            const overlay = document.getElementById('click-mode-prompt');
            if (overlay) {
                overlay.remove();
            }
        },

        /**
         * 顯示簡單的操作提示（3秒後自動消失）
         */
        showStartPrompt() {
            const gs = this.state.gameState;

            // 🔧 修復：每輪只顯示一次
            if (gs.clickModeState.hasShownStartPrompt) {
                this.Debug.log('assist', '[A3-ClickMode] 開始提示已顯示過，跳過');
                return;
            }

            // 移除舊的提示
            this.hideStartPrompt();

            // 標記已顯示
            gs.clickModeState.hasShownStartPrompt = true;

            // 創建提示框（採用原本「點擊螢幕任何位置」的樣式：螢幕中央、較大尺寸）
            const banner = document.createElement('div');
            banner.id = 'click-mode-start-prompt';
            banner.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                color: white;
                padding: 40px 60px;
                border-radius: 20px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                font-size: 1.5em;
                max-width: 80%;
                z-index: 9999;
                animation: fadeInCenterScale 0.5s ease-in;
                pointer-events: auto;
                cursor: pointer;
            `;

            banner.innerHTML = `
                <div style="font-size: 3em; margin-bottom: 20px;">♿</div>
                <div style="font-size: 1.8em; font-weight: bold; margin-bottom: 15px;">
                    輔助點擊模式
                </div>
                <div style="font-size: 1.2em; opacity: 0.95;">
                    點擊或觸控螢幕任何位置，即可進行操作
                </div>
            `;

            // @keyframes fadeInCenterScale 已移至 JS injectGlobalAnimationStyles()

            document.body.appendChild(banner);

            // 🔧 修復：點擊或觸控時立即消失
            const dismissHandler = (e) => {
                e.stopPropagation();
                this.hideStartPrompt();
            };
            banner.addEventListener('click', dismissHandler, { once: true });
            banner.addEventListener('touchstart', dismissHandler, { once: true });

            // 🔧 修復：全局點擊也消失（點擊提示以外的區域）
            const globalDismissHandler = () => {
                this.hideStartPrompt();
                document.removeEventListener('click', globalDismissHandler);
                document.removeEventListener('touchstart', globalDismissHandler);
            };
            // 延遲綁定，避免立即觸發
            this.TimerManager.setTimeout(() => {
                document.addEventListener('click', globalDismissHandler, { once: true });
                document.addEventListener('touchstart', globalDismissHandler, { once: true });
            }, 100, 'clickMode');

            // 3秒後自動隱藏（作為安全網）
            this.TimerManager.setTimeout(() => {
                this.hideStartPrompt();
            }, 3000, 'clickMode');

            this.Debug.log('assist', '[A3-ClickMode] 顯示操作提示（點擊即消失，或3秒後自動消失）');
        },

        /**
         * 隱藏「準備開始」提示
         */
        hideStartPrompt() {
            const overlay = document.getElementById('click-mode-start-prompt');
            if (overlay) {
                overlay.remove();
            }
        },

        /**
         * 獲取操作描述文字
         */
        getActionDescription(action) {
            switch (action.type) {
                case 'selectItem':
                    return `選擇餐點：${action.data.itemName}`;
                case 'checkout':
                    return '前往結帳';
                case 'payMoney':
                    return `支付 $${action.data.value} 元`;
                case 'confirmPayment':
                    return '確認付款完成';
                case 'collectChange':
                    return `領取零錢 $${action.data.value} 元`;
                case 'confirmChange':
                    return '確認找零完成';
                case 'pickupOrder':
                    return '取餐完成';
                default:
                    return '繼續下一步';
            }
        },

        // ==================== 輔助點擊模式結束 ====================

        // 生成隨機訂單號碼（範圍 10-999）
        generateRandomOrderNumber() {
            return Math.floor(Math.random() * 990) + 10; // 10-999 的隨機數
        },

        startOrderNumberAnimation(targetNumber) {
            const displayElement = document.getElementById('dynamic-order-number');
            const pickupButtonContainer = document.getElementById('pickup-button-container');

            if (!displayElement) return;

            // 清除之前的動畫（如果存在）
            this.TimerManager.clearByCategory('orderAnimation');
            this.orderNumberInterval = null;

            // 從目標號碼往前 10-15 個號碼開始跑馬燈
            const stepsBack = Math.floor(Math.random() * 6) + 10; // 隨機 10-15 步
            let currentNumber = Math.max(1, targetNumber - stepsBack);

            // 設定初始顯示
            displayElement.textContent = String(currentNumber).padStart(3, '0');

            // 每秒遞增一次（遞迴 TimerManager，可由 clearByCategory('orderAnimation') 停止）
            const scheduleNext = () => {
                this.TimerManager.setTimeout(() => {
                    currentNumber++;
                    displayElement.textContent = String(currentNumber).padStart(3, '0');

                    // 播放嗶嗶聲
                    this.audio.playSound('beep');

                    if (currentNumber >= targetNumber) {
                        this.TimerManager.clearByCategory('orderAnimation');
                        this.orderNumberInterval = null;
                        // 動畫完成，顯示取餐按鈕
                        if (pickupButtonContainer) {
                            pickupButtonContainer.style.display = 'block';

                            // 🎯 簡單模式：顯示取餐按鈕「點這裡」提示動畫
                            if (this.state.settings.difficulty === 'easy') {
                                this.TimerManager.setTimeout(() => {
                                    const pickupBtn = document.getElementById('pickup-order-btn');
                                    if (pickupBtn) pickupBtn.classList.add('checkout-btn-hint');
                                }, 500, 'hint');
                            }

                            // 如果是輔助點擊模式，建立 pickup queue，等待使用者點擊取餐鈕
                            if (this.state.settings.clickMode && this.state.gameState.clickModeState.enabled) {
                                this.buildActionQueue('pickup');
                                this.Debug.log('assist', '[A3-ClickMode] 在取餐按鈕顯示時建立 pickup queue，等待使用者點擊');
                            }
                        }
                    } else {
                        scheduleNext();
                    }
                }, 1000, 'orderAnimation');
            };
            scheduleNext();
        },

        // 🎯 第一階段：顯示餐點內容
        showPickupComplete() {
            window.speechSynthesis.cancel();
            if (window.TutorContext) TutorContext.update({ screen: 'result' });
            // 注意：pickup queue 已在 startOrderNumberAnimation 按鈕顯示時建立
            // 此處不需要重複建立

            // 播放取餐音效 - 使用 correct02.mp3
            const correctSound = new Audio('../audio/units/correct02.mp3');
            correctSound.play().catch(e => McDonald.Debug.log('audio', '播放音效失敗:', e));

            const app = document.getElementById('app');
            if (!app) return;

            // 🆕 允許頁面滾動（A4 架構：只操作 #app）
            app.style.overflowY = 'auto';
            app.style.height = '100%';

            // 取得購物車內容
            const cart = this.state.gameState.cart || [];
            const totalAmount = this.state.gameState.totalAmount || 0;
            const orderNumber = this.state.gameState.orderNumber || Math.floor(Math.random() * 900) + 100;

            // 生成餐盤上的食物圖示
            const foodItemsHTML = cart.length > 0
                ? cart.map(item => {
                    let items = '';
                    for (let i = 0; i < Math.min(item.quantity, 3); i++) {
                        items += `<div class="food-item" style="animation-delay: ${i * 0.1}s">${(item.imageUrl || item.image) ? `<img src="${item.imageUrl || item.image}" onerror="this.style.display='none'" style="width:2em;height:2em;object-fit:contain;">` : item.emoji}</div>`;
                    }
                    if (item.quantity > 3) {
                        items += `<div class="food-count">+${item.quantity - 3}</div>`;
                    }
                    return items;
                }).join('')
                : '<div class="food-item">🍽️</div>';

            // 生成簡要明細
            const briefSummary = cart.map(item => `${item.name} x${item.quantity}`).join('、');

            app.innerHTML = `
                <div class="pickup-complete-wrapper">
                    <div class="pickup-complete-screen">
                        <div class="pickup-header">
                            <div class="pickup-icon">🍔</div>
                            <h1 class="pickup-title">您的餐點已備妥！</h1>
                            <div class="order-number-display">
                                <span class="order-label">取餐號碼</span>
                                <span class="order-num">${String(orderNumber).padStart(3, '0')}</span>
                            </div>
                        </div>

                        <div class="order-content-container">
                            <!-- 餐盤視覺展示 -->
                            <div class="food-tray">
                                <div class="tray-surface">
                                    ${foodItemsHTML}
                                </div>
                            </div>

                            <!-- 簡要明細 -->
                            <div class="order-summary-brief">
                                ${briefSummary || '無餐點'}
                            </div>

                            <!-- 總計金額 -->
                            <div class="order-total-row">
                                <span class="total-label">總計</span>
                                <span class="total-amount">NT$ ${totalAmount}</span>
                            </div>
                        </div>

                        <div class="pickup-action-container">
                            ${(() => {
                                const qCount = this.state.settings.questionCount || 5;
                                const completed = (this.state.gameState.completedQuestions || 0) + 1;
                                if (completed >= qCount) {
                                    return `<button id="tray-nav-btn" class="view-summary-btn">
                                        <span class="btn-icon">📊</span>
                                        <span class="btn-text">查看測驗總結</span>
                                    </button>`;
                                } else {
                                    return `<button id="tray-nav-btn" class="view-summary-btn" style="background:linear-gradient(135deg,#4CAF50,#45a049);">
                                        <span class="btn-icon">➡️</span>
                                        <span class="btn-text">進入下一題</span>
                                    </button>`;
                                }
                            })()}
                        </div>
                    </div>
                </div>

                <style>
                    .pickup-complete-wrapper {
                        display: flex;
                        justify-content: center;
                        align-items: flex-start;
                        min-height: 100vh;
                        padding: 20px;
                        box-sizing: border-box;
                        background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
                        overflow-y: auto;
                        -webkit-overflow-scrolling: touch;
                    }

                    /* @keyframes fadeInUp, pickupIconPulse 已移至 JS injectGlobalAnimationStyles() */

                    .pickup-complete-screen {
                        position: relative;
                        text-align: center;
                        padding: 40px;
                        background: white;
                        border-radius: 20px;
                        width: 100%;
                        max-width: 650px;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                        animation: fadeInUp 0.6s ease-out;
                    }

                    .pickup-header {
                        margin-bottom: 25px;
                    }

                    .pickup-icon {
                        font-size: 4em;
                        margin-bottom: 10px;
                        animation: pickupIconPulse 2s infinite;
                    }

                    .pickup-title {
                        font-size: 1.8em;
                        color: #333;
                        margin: 15px 0;
                        font-weight: bold;
                    }

                    .order-number-display {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        margin-top: 15px;
                        padding: 15px;
                        background: linear-gradient(135deg, #ff9800, #ff5722);
                        border-radius: 15px;
                        color: white;
                    }

                    .order-label {
                        font-size: 1em;
                        opacity: 0.9;
                    }

                    .order-num {
                        font-size: 2.5em;
                        font-weight: bold;
                        letter-spacing: 5px;
                    }

                    .order-content-container {
                        background: #f8f9fa;
                        border-radius: 15px;
                        padding: 20px;
                        margin: 20px 0;
                        text-align: center;
                    }

                    /* --- 黃色塑膠餐盤容器 (外邊框) --- */
                    .food-tray {
                        position: relative;
                        background: linear-gradient(135deg, #F3D35B 0%, #E6BF40 100%);
                        border-radius: 25px;
                        padding: 20px 35px;
                        margin: 20px auto;
                        max-width: 500px;
                        box-shadow:
                            0 12px 24px rgba(0,0,0,0.15),
                            inset 0 2px 4px rgba(255,255,255,0.7),
                            inset 0 -3px 4px rgba(180, 140, 30, 0.4);
                        border: 1px solid #E6C250;
                    }

                    /* --- 模擬把手挖孔 (左側) --- */
                    .food-tray::before {
                        content: '';
                        position: absolute;
                        top: 50%;
                        left: 6px;
                        transform: translateY(-50%);
                        width: 14px;
                        height: 70px;
                        background-color: #f8f9fa;
                        border-radius: 8px;
                        box-shadow: inset 1px 2px 3px rgba(0,0,0,0.2);
                    }

                    /* --- 模擬把手挖孔 (右側) --- */
                    .food-tray::after {
                        content: '';
                        position: absolute;
                        top: 50%;
                        right: 6px;
                        transform: translateY(-50%);
                        width: 14px;
                        height: 70px;
                        background-color: #f8f9fa;
                        border-radius: 8px;
                        box-shadow: inset -1px 2px 3px rgba(0,0,0,0.2);
                    }

                    /* --- 餐盤底部表面 --- */
                    .tray-surface {
                        background-color: #F1D668;
                        border-radius: 12px;
                        padding: 25px;
                        box-shadow: inset 0 3px 10px rgba(160, 120, 20, 0.25);
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 15px;
                        min-height: 120px;
                    }

                    .food-item {
                        font-size: 3.5em;
                        animation: foodAppear 0.5s ease-out forwards;
                        filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.2));
                    }

                    /* @keyframes foodAppear 已移至 JS injectGlobalAnimationStyles() */

                    .food-count {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.5em;
                        font-weight: bold;
                        color: #666;
                        background: rgba(255,255,255,0.9);
                        border-radius: 50%;
                        width: 50px;
                        height: 50px;
                    }

                    .order-summary-brief {
                        text-align: center;
                        color: #666;
                        font-size: 1em;
                        margin: 10px 0;
                        padding: 10px;
                        background: #ffffff;
                        border-radius: 10px;
                    }

                    .order-total-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 15px;
                        padding-top: 15px;
                        border-top: 2px solid #333;
                    }

                    .total-label {
                        font-size: 1.2em;
                        font-weight: bold;
                        color: #333;
                    }

                    .total-amount {
                        font-size: 1.5em;
                        font-weight: bold;
                        color: #c62d42;
                    }

                    .pickup-action-container {
                        margin-top: 25px;
                    }

                    .view-summary-btn {
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        padding: 15px 40px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 30px;
                        font-size: 1.2em;
                        font-weight: bold;
                        cursor: pointer;
                        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                        transition: all 0.3s ease;
                    }

                    .view-summary-btn:hover {
                        transform: translateY(-3px);
                        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.5);
                    }

                    .view-summary-btn:active {
                        transform: translateY(0);
                    }
                </style>
            `;

            // ── 語音播放完後的導頁函式（含防重複守衛）──
            this._pickupNavigating = false;
            const navigateAfterSpeech = () => {
                if (this._pickupNavigating) return;
                this._pickupNavigating = true;
                // 清除餐盤畫面旗標（確保不再攔截後續點擊）
                const cms = this.state.gameState.clickModeState;
                if (cms) { cms.onTrayScreen = false; cms.trayNavCallback = null; }
                // 停止任何殘留語音
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                // 啟用按鈕（視覺恢復）
                const navBtn = document.getElementById('tray-nav-btn');
                if (navBtn) { navBtn.style.pointerEvents = ''; navBtn.style.opacity = ''; navBtn.style.cursor = ''; }
                const qCount = this.state.settings.questionCount || 5;
                const completed = (this.state.gameState.completedQuestions || 0) + 1;
                if (completed >= qCount) {
                    this.showCompletionSummary();
                } else {
                    this.startOver();
                }
            };

            // ── 綁定按鈕點擊（普通/困難模式：按鈕啟用後可點擊；簡單模式：任意點擊皆可） ──
            const navBtnEl = document.getElementById('tray-nav-btn');
            if (navBtnEl) {
                navBtnEl.addEventListener('click', navigateAfterSpeech);
            }
            if (this.state.settings.difficulty === 'easy' && this.state.settings.clickMode) {
                // 簡單模式 + 輔助點擊模式：
                // click 事件由 handleClickModeClick 的 onTrayScreen 分支攔截並呼叫 navigateAfterSpeech
                // touchend 事件不受 click 模式 overlay 攔截，在此單獨補強觸控端
                const cms = this.state.gameState.clickModeState;
                if (cms) {
                    cms.onTrayScreen = true;
                    cms.trayNavCallback = navigateAfterSpeech;
                    cms.trayReadyTime = Date.now(); // 防快速點擊基準時間
                }
                // touchend 補強：不用 once:true，自行移除以支援 600ms 防快速點擊
                const touchHandler = (e) => {
                    const gs = this.state.gameState;
                    if (!gs.clickModeState?.onTrayScreen) {
                        // onTrayScreen 已被 click 路徑清除，移除監聽器
                        document.removeEventListener('touchend', touchHandler, true);
                        return;
                    }
                    const now = Date.now();
                    const readyTime = gs.clickModeState.trayReadyTime || 0;
                    if (now - readyTime < 600) return; // 防同一 tap 的 touchend 觸發
                    document.removeEventListener('touchend', touchHandler, true);
                    gs.clickModeState.onTrayScreen = false;
                    gs.clickModeState.trayNavCallback = null;
                    navigateAfterSpeech();
                };
                document.addEventListener('touchend', touchHandler, { capture: true, passive: true });
            }

            // ── 拆分語音解決 Web Speech API 長字串被截斷的 bug ──
            // 將 pickupComplete 拆為：前綴 + 各餐點 + 結尾，依序短句播放
            const totalChinese = typeof NumberSpeechUtils !== 'undefined'
                ? NumberSpeechUtils.convertToChineseNumber(totalAmount)
                : String(totalAmount);
            const speechChunks = [
                '您的訂餐內容',
                ...cart.map(item => `${item.name}${item.quantity}份`),
                `訂單總金額${totalChinese}元，感謝您的光臨`
            ];

            const speakChunk = (index) => {
                if (this._pickupNavigating) return; // 已提前導頁（如使用者點擊），停止語音鏈
                if (index >= speechChunks.length) {
                    navigateAfterSpeech();
                    return;
                }
                this.speech.speakText(speechChunks[index], () => speakChunk(index + 1));
            };
            speakChunk(0);

        },

        // 🎯 第二階段：顯示測驗總結
        showCompletionSummary() {
            // 防止 pickupComplete 語音的 callback 在按鈕已觸發後重複呼叫
            if (this._completionSummaryShown) return;
            this._completionSummaryShown = true;

            // 停用輔助點擊模式（完成畫面不需要輔助）
            const gs = this.state.gameState;
            document.getElementById('click-exec-overlay')?.remove();
            if (gs.clickModeState) {
                this.Debug.log('assist', '[A3-ClickMode] 進入完成畫面，停用輔助點擊模式');
                gs.clickModeState.enabled = false;
                gs.clickModeState.waitingForClick = false;
                gs.clickModeState.waitingForStart = false;
            }
            this.unbindClickModeHandler();

            const completedCount = this.state.gameState.completedOrders;

            // 計算完成時間
            const endTime = Date.now();
            const startTime = this.state.gameState.startTime || endTime;
            const elapsedSeconds = Math.floor((endTime - startTime) / 1000);
            const minutes = Math.floor(elapsedSeconds / 60);
            const seconds = elapsedSeconds % 60;
            const timeDisplay = minutes > 0 ? `${minutes} 分 ${seconds} 秒` : `${seconds} 秒`;

            const app = document.getElementById('app');
            if (!app) return;

            // 動態注入滾動修復 CSS（A4 架構：Body 鎖死，App 負責滾動）
            let scrollFixStyle = document.getElementById('completion-scroll-fix');
            if (!scrollFixStyle) {
                scrollFixStyle = document.createElement('style');
                scrollFixStyle.id = 'completion-scroll-fix';
                scrollFixStyle.textContent = `
                    /* Body 保持鎖死，滾動由 #app 負責 */
                    html, body {
                        overflow: hidden !important;
                        position: fixed !important;
                        height: 100% !important;
                        width: 100% !important;
                    }
                    #app {
                        overflow-y: auto !important;
                        height: 100% !important;
                        -webkit-overflow-scrolling: touch !important;
                    }
                    .results-wrapper {
                        min-height: 100vh !important;
                    }
                    .results-screen {
                        overflow: visible !important;
                    }
                `;
                document.head.appendChild(scrollFixStyle);
            }

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
                                    <div class="achievement-item">🎯 完成速食店自助點餐機操作學習</div>
                                    <div class="achievement-item">🍔 學會餐點選擇和套餐搭配</div>
                                    <div class="achievement-item">💳 掌握付款和取餐流程</div>
                                </div>
                            </div>

                            <div class="result-buttons">
                                <button class="play-again-btn" onclick="McDonald.restartAllQuestions()">
                                    <span class="btn-icon">🔄</span>
                                    <span class="btn-text">再玩一次</span>
                                </button>
                                <button class="main-menu-btn" onclick="McDonald.backToSettings()">
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

                    /* @keyframes fadeIn 已移至 CSS, celebrate/bounce 已移至 JS injectGlobalAnimationStyles() */

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

            // 播放完成語音
            this.speech.speak('completeChallenge', {
                completedCount: completedCount,
                timeDisplay: timeDisplay
            });

            // 🎁 獎勵系統連結事件
            const endgameRewardLink = document.getElementById('endgame-reward-link');
            if (endgameRewardLink) {
                // 🔧 [Phase 3] 使用 EventManager 管理事件
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

        generateOrderSummary(orderItems) {
            return orderItems.map(item => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.2em;">${(item.imageUrl || item.image) ? `<img src="${item.imageUrl || item.image}" onerror="this.style.display='none'" style="width:1.5em;height:1.5em;object-fit:contain;vertical-align:middle;">` : item.emoji}</span>
                        <span style="font-weight: 600;">${item.name}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="color: #666;">x${item.quantity}</span>
                        <span style="font-weight: 600; color: #c62d42;">NT$ ${item.price * item.quantity}</span>
                    </div>
                </div>
            `).join('');
        },

        // 返回主選單（停止語音後返回）
        goBackToMenu() {
            // 停止步驟5的所有語音播放
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }

            // 停止取餐跳號動畫
            McDonald.TimerManager.clearByCategory('orderAnimation');
            this.orderNumberInterval = null;

            this.Debug.log('flow', '[A3-McDonald] 停止語音、動畫並返回主選單');

            // 返回上一頁
            window.history.back();
        },

        printReceipt() {
            this.audio.playSound('beep');

            // 模擬列印收據
            const printWindow = window.open('', '_blank', 'width=400,height=600');
            const orderNumber = this.state.gameState.orderNumber;
            const now = new Date();

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>美式速食收據 - ${orderNumber}</title>
                    <style>
                        body {
                            font-family: 'Courier New', monospace;
                            max-width: 350px;
                            margin: 0 auto;
                            padding: 20px;
                            font-size: 12px;
                            line-height: 1.4;
                        }
                        .header {
                            text-align: center;
                            border-bottom: 2px dashed #333;
                            padding-bottom: 15px;
                            margin-bottom: 15px;
                        }
                        .logo {
                            font-size: 24px;
                            margin-bottom: 5px;
                        }
                        .item {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 8px;
                        }
                        .total {
                            border-top: 2px solid #333;
                            padding-top: 10px;
                            margin-top: 15px;
                            font-weight: bold;
                            font-size: 14px;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 20px;
                            border-top: 1px dashed #333;
                            padding-top: 15px;
                            font-size: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">🍔 美式速食 Fast Food</div>
                        <div>歡迎光臨</div>
                        <div>Self-Service Kiosk</div>
                    </div>

                    <div>訂單編號: ${String(orderNumber).padStart(3, '0')}</div>
                    <div>日期: ${now.toLocaleDateString('zh-TW')}</div>
                    <div>時間: ${now.toLocaleTimeString('zh-TW')}</div>
                    <br>

                    ${this.state.gameState.cart.map(item => `
                        <div class="item">
                            <div>${(item.imageUrl || item.image) ? `<img src="${item.imageUrl || item.image}" onerror="this.style.display='none'" style="width:1.5em;height:1.5em;object-fit:contain;vertical-align:middle;">` : item.emoji} ${item.name} x${item.quantity}</div>
                            <div>$${item.price * item.quantity}</div>
                        </div>
                    `).join('')}

                    <div class="total">
                        <div class="item">
                            <div>總計 Total</div>
                            <div>NT$ ${this.state.gameState.totalAmount}</div>
                        </div>
                    </div>

                    <div class="footer">
                        <div>謝謝您的光臨！</div>
                        <div>Thank you for your visit!</div>
                        <div>請至櫃檯取餐</div>
                        <div>預計準備時間: 5-10分鐘</div>
                        <br>
                        <div>|||| |||| ||||</div>
                        <div>條碼: ${orderNumber}${Date.now().toString().slice(-4)}</div>
                    </div>
                </body>
                </html>
            `);

            printWindow.document.close();

            this.TimerManager.setTimeout(() => {
                printWindow.print();
            }, 500, 'uiAnimation');

            this.speech.speak('orderComplete', { orderNumber: `收據已準備，訂單號碼${orderNumber}` });
            this.Debug.log('flow', `[A3-McDonald] 收據已列印，訂單號碼: ${orderNumber}`);
        },

        startOver() {
            // 重置防重複旗標（新一輪開始）
            this._completionSummaryShown = false;
            this.state.isProcessing = false;
            // 注意：不在此重置 _pickupNavigating。
            // _pickupNavigating 由 showPickupComplete() 在建立新一輪時重置（line ~9505）。
            // 若此處提前重置，speakChunk 備援計時器（category:'speech'，10秒後觸發）
            // 仍能通過 navigateAfterSpeech() 的守衛，導致 startOver() 被再次呼叫。
            // 停止步驟5的所有語音播放
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            // 🔧 清除殘留的語音排程計時器（避免上一輪的 wrongItem 等語音在新輪次播放）
            this.TimerManager.clearByCategory('speechDelay');
            // 🔧 清除 speakText() 的 10 秒備援計時器，防止其在下一輪觸發 navigateAfterSpeech()
            this.TimerManager.clearByCategory('speech');

            // 停止取餐跳號動畫
            McDonald.TimerManager.clearByCategory('orderAnimation');
            this.orderNumberInterval = null;

            this.Debug.log('flow', '[A3-McDonald] 停止步驟5語音播放和動畫');

            this.audio.playSound('beep');

            // 增加已完成題數
            if (!this.state.gameState.completedQuestions) {
                this.state.gameState.completedQuestions = 0;
            }
            this.state.gameState.completedQuestions++;

            const questionCount = this.state.settings.questionCount || 5;
            const completedQuestions = this.state.gameState.completedQuestions;

            this.Debug.log('flow', `[A3-McDonald] 已完成題數: ${completedQuestions} / ${questionCount}`);

            // 檢查是否完成所有題目
            if (completedQuestions >= questionCount) {
                // 所有題目完成，顯示測驗總結（A2 樣式）
                this.showCompletionSummary();
                return;
            }

            // 重置所有遊戲狀態以開始新一輪
            this.state.gameState.cart = [];
            this.state.gameState.totalAmount = 0;
            this.state.gameState.currentCategory = 'burgers';
            this.state.gameState.currentPage = 0;
            this.state.gameState.purchasedItems = [];
            this.state.gameState.assignedItems = [];
            this.state.gameState.walletMoney = [];
            this.state.gameState.paymentArea = [];
            this.state.gameState.paidAmount = 0;
            this.state.gameState.changeCollected = [];
            this.state.gameState.changeCoins = [];
            this.state.gameState.changeExpected = 0;
            this.state.gameState.welcomePageIndex = 1; // 重置歡迎頁面索引
            this.state.gameState.currentHintIndex = 0; // 重置提示索引
            this.state.gameState.categoryErrorCounts = {}; // 重置錯誤計數
            this.state.gameState.paymentErrorCount = 0; // 重置付款錯誤計數
            this.state.gameState.showPaymentHints = false; // 重置付款提示

            // 🔧 [新增] 清除找零選項緩存
            this.state.gameState.currentChangeOptions = null;

            // 🔧 [新增] 重置輔助點擊模式狀態
            if (this.state.gameState.clickModeState) {
                this.state.gameState.clickModeState.enabled = false;
                this.state.gameState.clickModeState.currentPhase = 'welcome';
                this.state.gameState.clickModeState.currentStep = 0;
                this.state.gameState.clickModeState.actionQueue = [];
                this.state.gameState.clickModeState.waitingForClick = false;
                this.state.gameState.clickModeState.waitingForStart = false;
                this.state.gameState.clickModeState.lastClickTime = 0;
                this.state.gameState.clickModeState.hasShownStartPrompt = false;
                this.state.gameState.clickModeState.isExecuting = false;
                this.Debug.log('flow', '[A3-McDonald] 重置輔助點擊模式狀態');
            }

            // 重新初始化遊戲資料（新的指定餐點和錢包）
            this.initializeGameData();

            // 🆕 切換到歡迎畫面（場景管理器的 onEnter 會自動呼叫 showWelcomePage1，不需重複呼叫）
            this.SceneManager.switchScene('welcome', this);

            this.Debug.log('flow', '[A3-McDonald] 系統重新開始 - 新一輪');
        },

        // 重新開始所有題目
        restartAllQuestions() {
            this._completionSummaryShown = false;
            this._pickupNavigating = false;
            this.audio.playSound('beep');

            // 重置完成題數
            this.state.gameState.completedQuestions = 0;
            this.state.gameState.orderNumber = 0;
            this.state.gameState.completedOrders = 0;
            this.state.gameState.startTime = Date.now();

            // 重置所有遊戲狀態
            this.state.gameState.cart = [];
            this.state.gameState.totalAmount = 0;
            this.state.gameState.currentCategory = 'burgers';
            this.state.gameState.currentPage = 0;
            this.state.gameState.purchasedItems = [];
            this.state.gameState.assignedItems = [];
            this.state.gameState.walletMoney = [];
            this.state.gameState.paymentArea = [];
            this.state.gameState.paidAmount = 0;
            this.state.gameState.changeCollected = [];
            this.state.gameState.changeCoins = [];
            this.state.gameState.changeExpected = 0;
            this.state.gameState.currentHintIndex = 0;
            this.state.gameState.categoryErrorCounts = {};
            this.state.gameState.paymentErrorCount = 0;
            this.state.gameState.showPaymentHints = false;

            // 回到設定頁面
            this.SceneManager.switchScene('settings', this);
            this.showSettings();

            this.Debug.log('flow', '[A3-McDonald] 重新開始所有題目');
        },

        // 返回設定頁面（從測驗中途返回）
        backToSettings() {
            this._completionSummaryShown = false;
            this._pickupNavigating = false;
            this.audio.playSound('beep');

            // 重置完成題數
            this.state.gameState.completedQuestions = 0;
            this.state.gameState.orderNumber = 0;
            this.state.gameState.completedOrders = 0;
            this.state.gameState.startTime = Date.now();

            // 重置所有遊戲狀態
            this.state.gameState.cart = [];
            this.state.gameState.totalAmount = 0;
            this.state.gameState.currentCategory = 'burgers';
            this.state.gameState.currentPage = 0;
            this.state.gameState.purchasedItems = [];
            this.state.gameState.assignedItems = [];
            this.state.gameState.walletMoney = [];
            this.state.gameState.paymentArea = [];
            this.state.gameState.paidAmount = 0;
            this.state.gameState.changeCollected = [];
            this.state.gameState.changeCoins = [];
            this.state.gameState.changeExpected = 0;
            this.state.gameState.currentHintIndex = 0;
            this.state.gameState.categoryErrorCounts = {};
            this.state.gameState.paymentErrorCount = 0;
            this.state.gameState.showPaymentHints = false;

            // 回到設定頁面
            this.SceneManager.switchScene('settings', this);
            this.showSettings();

            this.Debug.log('flow', '[A3-McDonald] 返回設定頁面');
        },

        // =====================================================
        // 鍵盤快捷鍵處理
        // =====================================================
        handleQuickAdd(number) {
            const currentItems = this.menuConfig.items[this.state.gameState.currentCategory] || [];
            if (number >= 1 && number <= currentItems.length) {
                const item = currentItems[number - 1];
                this.addToCart(item.id, this.state.gameState.currentCategory);
            }
        },

        handleCheckout() {
            this.checkout();
        },

        handleCancelKey() {
            // 清空購物車或返回上一步
            if (this.state.gameState.cart.length > 0) {
                this.state.gameState.cart = [];
                this.state.gameState.totalAmount = 0;
                this.updateCartDisplay();
                this.audio.playSound('beep');
                this.speech.speak('cartEmpty');
            }
        },

        // =====================================================
        // 觸控事件處理系統
        // =====================================================
        bindTouchEvents() {
            // 🔧 [事件清理] 如果已經綁定過，先解綁避免重複
            if (this.eventListeners) {
                this.unbindTouchEvents();
            }

            // 防止觸控時的雙重觸發
            let touchHandled = false;
            let touchStartTime = 0;
            const self = this; // 保存 this 引用

            // 🔧 [事件清理] 保存事件監聽器引用，以便後續解綁
            this.eventListeners = {
                touchStartHandler: (e) => {
                    // 🔧 [滾動修復] 只在ordering場景中處理，避免干擾其他場景的滾動
                    if (self.state.gameState?.currentScene !== 'ordering') {
                        return;
                    }

                    touchHandled = true;
                    touchStartTime = Date.now();

                    // 為觸控元素添加視覺回饋
                    const menuItem = e.target.closest('.menu-item');
                    if (menuItem ||
                        e.target.classList.contains('add-to-cart-btn') ||
                        e.target.classList.contains('category-btn') ||
                        e.target.classList.contains('quantity-btn') ||
                        e.target.classList.contains('checkout-btn')) {
                        const targetElement = menuItem || e.target;
                        targetElement.style.transform = 'scale(0.95)';
                        targetElement.style.transition = 'transform 0.1s ease';
                    }

                    self.TimerManager.setTimeout(() => touchHandled = false, 300, 'uiAnimation');
                },

                touchEndHandler: (e) => {
                    // 🔧 [滾動修復] 只在ordering場景中處理，避免干擾其他場景的滾動
                    if (self.state.gameState?.currentScene !== 'ordering') {
                        return;
                    }

                    const touchDuration = Date.now() - touchStartTime;

                    // 恢復元素原狀
                    const menuItem = e.target.closest('.menu-item');
                    if (menuItem ||
                        e.target.classList.contains('add-to-cart-btn') ||
                        e.target.classList.contains('category-btn') ||
                        e.target.classList.contains('quantity-btn') ||
                        e.target.classList.contains('checkout-btn')) {
                        const targetElement = menuItem || e.target;
                        self.TimerManager.setTimeout(() => {
                            targetElement.style.transform = '';
                        }, 100, 'uiAnimation');
                    }

                    // 如果是有效的點擊（不是滑動）
                    if (touchDuration < 500) {
                        self.handleTouchTap(e);
                    }
                },

                clickHandler: (e) => {
                    this.Debug.log('flow', '[A3-McDonald] Click事件觸發，場景:', self.state.gameState?.currentScene);

                    const target = e.target;
                    const currentScene = self.state.gameState?.currentScene;

                    // 🔧 [觸控修復] 處理 ordering 場景特有的交互
                    if (currentScene === 'ordering') {
                        // 1. 找到是否點擊了餐點卡片容器
                        const menuItem = target.closest('.menu-item');

                        // 2. 判斷是否為其他互動元素 (特定的功能按鈕)
                        const isInteractiveButton = target.closest('.add-to-cart-btn') ||
                                                  target.closest('.category-btn') ||
                                                  target.closest('.quantity-btn') ||
                                                  target.closest('.checkout-btn') ||
                                                  target.closest('.remove-btn');

                        // 3. 檢查是否為按鈕元素（用於處理有 onclick 的普通按鈕）
                        const isButton = target.tagName === 'BUTTON' || target.closest('button');

                        // Log 用於除錯
                        this.Debug.log('flow', '[A3-McDonald] Click事件:', {
                            target: target.className || target.tagName,
                            menuItem: menuItem ? menuItem.dataset.itemId : null,
                            isInteractiveButton: !!isInteractiveButton,
                            isButton: !!isButton,
                            touchHandled: touchHandled
                        });

                        // 如果是移動端觸發過的事件，阻止重複執行
                        if (touchHandled) {
                            if (menuItem || isInteractiveButton) {
                                this.Debug.log('flow', '[A3-McDonald] 移動端重複點擊，已阻止');
                                e.preventDefault();
                                e.stopPropagation();
                            }
                            return false;
                        }

                        // ⭐️ [核心修正]：處理卡片區域點擊 (非按鈕)
                        // 條件：點擊了卡片(menuItem) 且 沒有點擊到具體的功能按鈕
                        if (menuItem && !isInteractiveButton) {
                            const itemId = menuItem.dataset.itemId;
                            if (itemId) {
                                this.Debug.log('flow', '[A3-McDonald] 👆 點擊卡片區域 (非按鈕)，直接觸發加入購物車:', itemId);

                                // 1. 播放音效
                                if (self.audio && self.audio.playBeep) self.audio.playBeep();

                                // 2. 🔥 直接調用業務邏輯 (不模擬按鈕點擊，避免事件傳遞問題)
                                self.addToCart(itemId, self.state.gameState.currentCategory);

                                // 3. 阻止事件繼續傳遞
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                            }
                        }

                        // 如果點擊的是具體按鈕，則交給原本的 handleTouchTap 處理
                        if (isInteractiveButton) {
                            this.Debug.log('flow', '[A3-McDonald] 執行標準 handleTouchTap (按鈕點擊)');
                            self.handleTouchTap(e);
                        }

                        // 🔧 [觸控修復] 如果是有 onclick 的普通按鈕，允許事件通過
                        // 這樣可以讓付款方式選擇等界面的按鈕在觸控端正常工作
                        if (isButton && !isInteractiveButton) {
                            this.Debug.log('flow', '[A3-McDonald] 普通按鈕點擊，允許 onclick 事件通過');
                            // 不做任何處理，讓瀏覽器的默認行為處理 onclick
                        }
                    } else {
                        // 🔧 [觸控修復] 其他場景：確保按鈕的 onclick 事件能正常觸發
                        // 在觸控設備上，有些 onclick 可能不會自動觸發，這裡確保它們能工作
                        this.Debug.log('flow', '[A3-McDonald] 其他場景的click事件，允許通過');
                        // 不做任何處理，讓瀏覽器的默認行為處理 onclick
                    }
                }
            };

            // 綁定事件監聽器
            document.addEventListener('touchstart', this.eventListeners.touchStartHandler, { passive: false });
            document.addEventListener('touchend', this.eventListeners.touchEndHandler, { passive: false });
            document.addEventListener('click', this.eventListeners.clickHandler, { capture: true });

            // 改善滾動體驗
            self.optimizeScrolling();

            this.Debug.log('flow', '[A3-McDonald] 觸控事件已綁定');
        },

        // 🔧 [事件清理] 解綁事件監聽器
        unbindTouchEvents() {
            if (this.eventListeners) {
                document.removeEventListener('touchstart', this.eventListeners.touchStartHandler);
                document.removeEventListener('touchend', this.eventListeners.touchEndHandler);
                document.removeEventListener('click', this.eventListeners.clickHandler);
                this.eventListeners = null;
                this.Debug.log('flow', '[A3-McDonald] 觸控事件已解綁');
            }
        },

        handleTouchTap(event) {
            const target = event.target;
            const closest = target.closest.bind(target);

            // 處理分類按鈕
            if (target.classList.contains('category-btn')) {
                event.preventDefault();
                const categoryId = target.dataset.category;
                if (categoryId) {
                    this.selectCategory(categoryId);
                }
                return;
            }

            // 處理加入購物車按鈕
            const addToCartBtn = closest('.add-to-cart-btn');
            if (addToCartBtn) {
                event.preventDefault();
                const menuItem = closest('.menu-item');
                if (menuItem) {
                    const itemId = menuItem.dataset.itemId;
                    if (itemId) {
                        this.Debug.log('flow', '[A3-McDonald] 點擊按鈕加入購物車:', itemId);
                        this.addToCart(itemId, this.state.gameState.currentCategory);
                    }
                }
                return;
            }

            // 處理餐點卡片點擊（整個餐點框都可點擊加入購物車）
            const menuItem = closest('.menu-item');
            if (menuItem) {
                event.preventDefault();
                const itemId = menuItem.dataset.itemId;
                if (itemId) {
                    this.Debug.log('flow', '[A3-McDonald] 點擊餐點卡片加入購物車:', itemId);
                    this.addToCart(itemId, this.state.gameState.currentCategory);
                    return;
                }
            }

            // 處理數量調整按鈕
            if (target.classList.contains('quantity-btn')) {
                event.preventDefault();
                const cartItem = closest('.cart-item');
                if (cartItem) {
                    const itemId = cartItem.dataset.itemId;
                    if (target.textContent.includes('+')) {
                        this.increaseQuantity(itemId);
                    } else if (target.textContent.includes('-')) {
                        this.decreaseQuantity(itemId);
                    }
                }
                return;
            }

            // 處理移除按鈕
            if (target.classList.contains('remove-btn')) {
                event.preventDefault();
                const cartItem = closest('.cart-item');
                if (cartItem) {
                    const itemId = cartItem.dataset.itemId;
                    this.removeFromCart(itemId);
                }
                return;
            }

            // 處理結帳按鈕
            if (target.classList.contains('checkout-btn') && !target.disabled) {
                event.preventDefault();
                this.checkout();
                return;
            }

            // 🔧 [觸控修復] 如果不是上述任何一種已知的元素，不阻止默認行為
            // 這樣可以讓其他按鈕（如有 onclick 的普通按鈕）正常觸發 click 事件
        },

        optimizeScrolling() {
            // 為可滾動區域添加動量滾動
            const scrollableElements = document.querySelectorAll('.item-grid, .cart-items');

            scrollableElements.forEach(element => {
                element.style.webkitOverflowScrolling = 'touch';
                element.style.overflowScrolling = 'touch';
            });

            // 禁用選中和長按選單（已註解以允許文字選擇）
            // document.body.style.webkitUserSelect = 'none';
            // document.body.style.userSelect = 'none';
            document.body.style.webkitTouchCallout = 'none';
        }
    };

    // =====================================================
    // 將 McDonald 對象暴露到全域作用域
    // =====================================================
    window.McDonald = McDonald;

    // 立即初始化系統
    McDonald.init();
    McDonald.Debug.log('flow', '[A3-McDonald] 美式速食點餐系統腳本載入完成');
});