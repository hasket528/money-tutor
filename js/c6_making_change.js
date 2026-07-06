// =================================================================
// FILE: js/c6_making_change.js - 單元C6：找零與計算
//// 🚨🚨🚨 【重開機後修改前必讀】🚨🚨🚨
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
// =================================================================

// 將Game定義為全局變量以支持onclick事件
let Game;

document.addEventListener('DOMContentLoaded', () => {
    Game = {
        // =====================================================
        // 🐛 Debug System - 統一日誌系統（分類開關）
        // =====================================================
        // 使用方式：
        //   Game.Debug.log('speech', '訊息內容', data);
        //   Game.Debug.log('ui', '渲染完成');
        //   Game.Debug.warn('payment', '警告訊息');
        //   Game.Debug.error('錯誤訊息');  // 錯誤永遠顯示
        //
        // 開關控制：
        //   Game.Debug.FLAGS.all = true;     // 全開
        //   Game.Debug.FLAGS.speech = true;  // 只開語音
        // =====================================================
        Debug: {
            // 分類開關（預設全關，需要時在 Console 手動開啟）
            FLAGS: {
                all: false,       // 全開/全關主開關
                init: false,      // 初始化流程
                speech: false,    // 語音系統
                audio: false,     // 音效系統
                ui: false,        // UI 渲染
                payment: false,   // 付款驗證
                change: false,    // 找零計算
                drag: false,      // 拖放操作
                touch: false,     // 觸控事件
                question: false,  // 題目生成
                state: false,     // 狀態轉換
                wallet: false,    // 錢包操作
                hint: false,      // 提示系統
                event: false,     // 事件監聽
                error: true       // 錯誤永遠顯示
            },

            // 統一日誌方法
            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[C6-${category}]`, ...args);
                }
            },

            // 警告日誌
            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[C6-${category}]`, ...args);
                }
            },

            // 錯誤日誌（永遠顯示）
            error(...args) {
                console.error('[C6-ERROR]', ...args);
            },

            // 手機端拖曳除錯專用方法
            logMobileDrag(phase, element, event, data = null) {
                if (!this.FLAGS.all && !this.FLAGS.touch) return;
                const elementInfo = {
                    tagName: element?.tagName,
                    className: element?.className,
                    id: element?.id,
                    value: element?.dataset?.value,
                    denomination: element?.dataset?.denomination,
                    parentClass: element?.parentElement?.className
                };
                const touchInfo = event?.touches?.[0] ? {
                    clientX: event.touches[0].clientX,
                    clientY: event.touches[0].clientY,
                    touchCount: event.touches.length
                } : null;

                console.log(`[C6-touch] 📱手機拖曳 ${phase}`, {
                    element: elementInfo,
                    touch: touchInfo,
                    extra: data
                });
            },

            // 觸控事件詳細除錯
            logTouchEvent(eventType, element, event) {
                if (!this.FLAGS.all && !this.FLAGS.touch) return;
                const eventInfo = {
                    type: eventType,
                    target: element?.className || 'unknown',
                    touches: event?.touches?.length || 0,
                    changedTouches: event?.changedTouches?.length || 0,
                    preventDefault: event?.defaultPrevented,
                    propagationStopped: event?.cancelBubble
                };

                console.log(`[C6-touch] 👆觸控事件 ${eventType}`, eventInfo);
            },

            // C6專用放置框檢測方法
            logPlacementDrop(action, zoneType, itemInfo = null) {
                if (!this.FLAGS.all && !this.FLAGS.drag) return;
                console.log(`[C6-drag] 📦放置框檢測 ${action} - 區域類型: ${zoneType}`, itemInfo || '');
            }
        },

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

            clearAll() {
                Game.Debug.log('timer', `TimerManager.clearAll(): ${this.timers.size} 個計時器`);
                this.timers.forEach(timer => window.clearTimeout(timer.timerId));
                this.timers.clear();
            },

            clearByCategory(category) {
                this.timers.forEach((timer, id) => {
                    if (timer.category === category) {
                        window.clearTimeout(timer.timerId);
                        this.timers.delete(id);
                    }
                });
            },

            clearTimeout(id) {
                const timer = this.timers.get(id);
                if (timer) {
                    window.clearTimeout(timer.timerId);
                    this.timers.delete(id);
                }
            }
        },

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



        // ═══════════════════════════════════════════════════════════════════════════
        // 🎬 全局動畫樣式注入（避免重複定義）
        // ═══════════════════════════════════════════════════════════════════════════
        injectGlobalAnimationStyles() {
            if (document.getElementById('c6-global-animations')) return;

            const style = document.createElement('style');
            style.id = 'c6-global-animations';
            style.innerHTML = `
                /* ===== 訊息動畫 ===== */
                @keyframes messageSlideIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes messageSlideOut {
                    from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }

                /* ===== 完成畫面動畫 ===== */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
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
                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(52, 152, 219, 0.4); }
                    50% { box-shadow: 0 0 30px rgba(52, 152, 219, 0.8); }
                }

                /* ===== 錯誤/正確標記動畫 ===== */
                @keyframes error-pulse {
                    from { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
                    to { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                @keyframes correct-tick-appear {
                    from { transform: scale(0) rotate(-180deg); opacity: 0; }
                    to { transform: scale(1) rotate(0deg); opacity: 1; }
                }

                /* ===== 金額顯示動畫 ===== */
                @keyframes totalAmountGlow {
                    0% { box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 10px rgba(255,255,255,0.5); }
                    100% { box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.8); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes questionPulse {
                    from { opacity: 0.7; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1.02); }
                }

                /* ===== 找零選項動畫 ===== */
                @keyframes checkmarkPop {
                    0% { transform: translateX(-50%) translateY(-30px) scale(0) rotate(-180deg); opacity: 0; }
                    50% { transform: translateX(-50%) translateY(5px) scale(1.1) rotate(0deg); opacity: 1; }
                    100% { transform: translateX(-50%) translateY(0) scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes correctPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }
                @keyframes crossPop {
                    0% { transform: translateX(-50%) translateY(-30px) scale(0) rotate(180deg); opacity: 0; }
                    50% { transform: translateX(-50%) translateY(5px) scale(1.1) rotate(0deg); opacity: 1; }
                    100% { transform: translateX(-50%) translateY(0) scale(1) rotate(0deg); opacity: 1; }
                }

                /* ===== 模態框動畫 ===== */
                @keyframes slideDown {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            this.Debug.log('init', '🎬 全局動畫樣式注入完成（16 個動畫）');
        },

        // =====================================================
        // 狀態管理系統（參考unit4架構）
        // =====================================================
        state: {
            settings: {
                walletAmount: null,      // 💰 我的錢包金額（10, 50, 100, 500, 1000 或 'custom'）
                customWalletAmount: 0,   // 🆕 自訂錢包金額，預設0元（當walletAmount='custom'時使用）
                difficulty: null,        // 難度：easy, normal, hard
                mode: null,              // 模式：repeated, single
                itemTypes: [],           // 物品類型：toys, food, stationery
                questionCount: null,     // 題目數量：5, 10, 15, 20, or custom number
                assistClick: false
            },
            gameState: {},
            quiz: {
                currentQuestion: 0,
                totalQuestions: 10,
                score: 0,
                questions: [],
                startTime: null,
                attempts: 0
            },
            loadingQuestion: false,
            // 🚀 新增：相容性檢查緩存系統，減少重複計算
            compatibilityCache: {}
        },

        // 計時器管理
        totalAmountSpeechTimer: null,

        // 🔧 [新增] 點擊放置功能狀態管理
        clickState: {
            selectedItem: null,        // 當前選中的物品
            lastClickTime: 0,          // 最後點擊時間
            lastClickedElement: null,  // 最後點擊的元素
            doubleClickDelay: 500      // 雙擊檢測時間間隔(ms)
        },

        // =====================================================
        // C6 物品資料庫
        // =====================================================
        items: {
            toys: [
                { name: '玩具車', emoji: '🚗', img: 'icon-c6-toy-car' },
                { name: '玩具熊', emoji: '🧸', img: 'icon-c6-teddy-bear' },
                { name: '積木', emoji: '🧱', img: 'icon-c6-blocks' },
                { name: '球', emoji: '⚽', img: 'icon-c6-ball' },
                { name: '機器人', emoji: '🤖', img: 'icon-c6-robot' }
            ],
            food: [
                { name: '漢堡', emoji: '🍔', img: 'icon-c6-hamburger' },
                { name: '披薩', emoji: '🍕', img: 'icon-c6-pizza' },
                { name: '蛋糕', emoji: '🍰', img: 'icon-c6-cake' },
                { name: '飲料', emoji: '🥤', img: 'icon-c6-drink' },
                { name: '薯條', emoji: '🍟', img: 'icon-c6-fries' }
            ],
            stationery: [
                { name: '鉛筆', emoji: '✏️', img: 'icon-c6-pencil' },
                { name: '筆記本', emoji: '📓', img: 'icon-c6-notebook' },
                { name: '橡皮擦', emoji: '🧹', img: 'icon-c6-eraser' },
                { name: '尺', emoji: '📏', img: 'icon-c6-ruler' },
                { name: '剪刀', emoji: '✂️', img: 'icon-c6-scissors' }
            ],
            // 10元層級（配合錢包10元，物品實際價格3-9元）
            cheap: [
                { name: '棒棒糖',   emoji: '🍭', img: 'icon-c6-lollipop' },
                { name: '動物貼紙', emoji: '🐱', img: 'icon-c6-animal-sticker' },
                { name: '星星貼紙', emoji: '⭐', img: 'icon-c6-star-sticker' },
                { name: '愛心貼紙', emoji: '💖', img: 'icon-c6-heart-sticker' },
                { name: '橡皮擦',   emoji: '🧹', img: 'icon-c6-eraser' }
            ],
            // 50元層級（配合錢包50元，物品實際價格15-45元）
            budget: [
                { name: '餅乾',     emoji: '🍪', img: 'icon-c6-cookie' },
                { name: '洋芋片',   emoji: '🥔', img: 'icon-c6-chips' },
                { name: '原子筆',   emoji: '✏️', img: 'icon-c6-ballpoint-pen' },
                { name: '口香糖',   emoji: '🍬', img: 'icon-c6-gum' },
                { name: '蘇打餅',   emoji: '🫓', img: 'icon-c6-crackers' }
            ],
            // 100元層級（配合錢包100元，物品實際價格30-90元）
            medium: [
                { name: '漢堡',   emoji: '🍔', img: 'icon-c6-hamburger' },
                { name: '彩色筆', emoji: '🎨', img: 'icon-c6-colored-pen' },
                { name: '筆記本', emoji: '📔', img: 'icon-c6-notebook' },
                { name: '巧克力', emoji: '🍫', img: 'icon-c6-chocolate' },
                { name: '蘋果',   emoji: '🍎', img: 'icon-c6-apple' }
            ],
            // 500元層級（配合錢包500元，物品實際價格150-450元）
            pricey: [
                { name: '故事書', emoji: '📚', img: 'icon-c6-story-book' },
                { name: '漫畫書', emoji: '📖', img: 'icon-c6-comic-book' },
                { name: '玩具車', emoji: '🚗', img: 'icon-c6-toy-car' },
                { name: '便當',   emoji: '🍱', img: 'icon-c6-bento' },
                { name: '計算機', emoji: '🔢', img: 'icon-c6-calculator' }
            ],
            // 1000元層級（配合錢包1000元，物品實際價格300-900元）
            premium: [
                { name: '機器人',   emoji: '🤖', img: 'icon-c6-robot' },
                { name: '耳機',     emoji: '🎧', img: 'icon-c6-headphones' },
                { name: '智慧手錶', emoji: '⌚', img: 'icon-c6-smartwatch' },
                { name: '外套',     emoji: '🧥', img: 'icon-c6-jacket' },
                { name: '牛肉麵',   emoji: '🍜', img: 'icon-c6-beef-noodle' }
            ]
        },

        // =====================================================
        // 音效和語音系統（繼承unit4）
        // =====================================================
        audio: {
            dropSound: null,
            errorSound: null,
            correctSound: null,
            successSound: null,
            clickSound: null,
            selectSound: null,
            keypadSound: null,
            init() {
                try {
                    this.dropSound = new Audio('../audio/units/drop-sound.mp3');
                    this.dropSound.preload = 'auto';
                    this.dropSound.volume = 0.5;

                    this.errorSound = new Audio('../audio/units/error.mp3');
                    this.errorSound.preload = 'auto';

                    this.error02Sound = new Audio('../audio/units/error.mp3');
                    this.error02Sound.preload = 'auto';

                    this.correctSound = new Audio('../audio/units/correct02.mp3');
                    this.correctSound.preload = 'auto';

                    this.successSound = new Audio('../audio/units/success.mp3');
                    this.successSound.preload = 'auto';

                    this.clickSound = new Audio('../audio/units/click.mp3');
                    this.clickSound.preload = 'auto';

                    this.selectSound = new Audio('../audio/units/click.mp3');
                    this.selectSound.preload = 'auto';

                    this.keypadSound = new Audio('../audio/units/keypad.mp3');
                    this.keypadSound.preload = 'auto';
                    this.keypadSound.volume = 0.7;
                } catch (error) {
                    Game.Debug.log('audio', '音效檔案載入失敗:', error);
                }
            },
            playDropSound() {
                if (this.dropSound) {
                    this.dropSound.currentTime = 0;
                    this.dropSound.play().catch(error => Game.Debug.log('audio', '播放音效失敗:', error));
                }
            },
            playErrorSound() {
                if (this.errorSound) {
                    this.errorSound.currentTime = 0;
                    this.errorSound.play().catch(error => Game.Debug.log('audio', '播放音效失敗:', error));
                }
            },
            playError02Sound() {
                if (this.error02Sound) {
                    this.error02Sound.currentTime = 0;
                    this.error02Sound.play().catch(error => Game.Debug.log('audio', '播放音效失敗:', error));
                }
            },
            playCorrectSound() {
                if (this.correctSound) {
                    this.correctSound.currentTime = 0;
                    this.correctSound.play().catch(error => Game.Debug.log('audio', '播放音效失敗:', error));
                }
            },
            playSuccessSound() {
                if (this.successSound) {
                    this.successSound.currentTime = 0;
                    this.successSound.play().catch(error => Game.Debug.log('audio', '播放音效失敗:', error));
                }
            },
            playClickSound() {
                if (this.clickSound) {
                    this.clickSound.currentTime = 0;
                    this.clickSound.play().catch(error => Game.Debug.log('audio', '播放音效失敗:', error));
                }
            },
            playSelectSound() {
                if (this.selectSound) {
                    this.selectSound.currentTime = 0;
                    this.selectSound.play().catch(error => Game.Debug.log('audio', '播放音效失敗:', error));
                }
            },
            playKeypadSound() {
                if (this.keypadSound) {
                    this.keypadSound.currentTime = 0;
                    this.keypadSound.play().catch(error => Game.Debug.log('audio', '播放音效失敗:', error));
                }
            }
        },
        speech: {
            synth: window.speechSynthesis,
            voice: null,
            isReady: false,
            init() {
                Game.Debug.log('speech', '開始初始化語音系統...');
                const setVoice = () => {
                    const voices = this.synth.getVoices();
                    Game.Debug.log('speech', `找到 ${voices.length} 個語音`);
                    if (voices.length === 0) {
                        Game.Debug.log('speech', '沒有找到語音，稍後重試');
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
                        Game.Debug.log('speech', `語音已就緒: ${this.voice.name} (${this.voice.lang})`);
                        this.synth.onvoiceschanged = null;
                    }
                };
                this.synth.onvoiceschanged = setVoice;
                setVoice();
                
                // 如果立即沒有語音，設定超時重試
                Game.TimerManager.setTimeout(() => {
                    if (!this.isReady) {
                        Game.Debug.log('speech', '語音初始化超時，嘗試再次設定');
                        setVoice();
                    }
                }, 1000, 'speech');
            },
            speak(text, options = {}) {
                const { interrupt = true, callback = null } = options;

                Game.Debug.log('speech', `speech.speak 被調用，文本: "${text}", interrupt: ${interrupt}`);
                Game.Debug.log('speech', `語音狀態檢查: isReady=${this.isReady}, voice=${this.voice ? this.voice.name : 'null'}, isSpeaking=${this.synth.speaking}`);

                // 如果不應該中斷，且有語音正在播放，則直接返回，不打斷重要語音
                if (!interrupt && this.synth.speaking) {
                    Game.Debug.log('speech', `語音 "${text}" 被忽略，因為已有語音正在播報且不應中斷。`);
                    return;
                }

                if (!this.isReady || !this.voice) {
                    Game.Debug.log('speech', `語音系統未就緒，嘗試重新初始化並延遲播報`);
                    // 嘗試重新初始化
                    this.init();
                    // 延遲100ms後重試
                    Game.TimerManager.setTimeout(() => {
                        if (this.isReady && this.voice) {
                            Game.Debug.log('speech', `重新初始化後播報: "${text}"`);
                            this.synth.cancel(); // 重新初始化後總是中斷
                            const utterance = new SpeechSynthesisUtterance(text);
                            utterance.voice = this.voice;
                            utterance.rate = 1.0; // 標準語速（與F1統一）
                            utterance.pitch = 1;
                            if (callback) {
                                let callbackExecuted = false;
                                const safeCallback = () => {
                                    if (!callbackExecuted) { callbackExecuted = true; callback(); }
                                };
                                utterance.onend = safeCallback;
                                utterance.onerror = (e) => {
                                    Game.Debug.log('speech', '語音播放錯誤（重試路徑）', e?.error);
                                    safeCallback();
                                };
                                Game.TimerManager.setTimeout(safeCallback, 10000, 'speech');
                            }
                            this.synth.speak(utterance);
                        } else {
                            Game.Debug.log('speech', `重新初始化後仍無法播報語音: "${text}"`);
                            if (callback) callback(); // 失敗時也要執行回呼，避免流程卡住
                        }
                    }, 100, 'speech');
                    return;
                }

                if (interrupt) {
                    this.synth.cancel(); // 根據 interrupt 標誌決定是否停止之前的語音
                }
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.voice = this.voice;
                utterance.rate = 1.0; // 標準語速（與F1統一）
                utterance.pitch = 1;
                if (callback) {
                    let callbackExecuted = false;
                    const safeCallback = () => {
                        if (!callbackExecuted) { callbackExecuted = true; callback(); }
                    };
                    utterance.onend = safeCallback;
                    utterance.onerror = (e) => {
                        Game.Debug.log('speech', '語音播放錯誤', e?.error);
                        safeCallback();
                    };
                    Game.TimerManager.setTimeout(safeCallback, 10000, 'speech');
                }
                this.synth.speak(utterance);
                Game.Debug.log('speech', `語音播報已提交到系統`);
            },

            // =====================================================
            // 🔧 傳統中文貨幣轉換 - 使用共用模組
            // =====================================================
            convertToTraditionalCurrency(amount) {
                // 使用共用模組的金額轉換函數
                return NumberSpeechUtils.convertToTraditionalCurrency(amount);
            }
        },

        // =====================================================
        // 配置驅動系統 - ModeConfig 價格浮動配置
        // =====================================================
        ModeConfig: {
            easy: {
                // 價格浮動配置
                priceVariation: {
                    enabled: true,
                    strategy: 'favor_center',         // 偏好中心價格策略
                    expansionFactor: 0.05,            // 範圍擴展 5%
                    centerBias: 0.7,                  // 70% 機率選擇中心區域
                    roundingRule: 'nearest1',         // 四捨五入到1的倍數
                    seedStrategy: 'perSession'        // 每個session固定價格
                },
                // 語音模板配置
                speechTemplates: {
                    itemPrice: "這個{itemName}要{price}元",
                    priceChanged: "今天{itemName}特價{price}元",
                    welcomeShop: "歡迎來購物，今天的價格很優惠喔！"
                },
                // 時間配置
                timing: {
                    priceDisplayDelay: 500,
                    speechDelay: 800
                }
            },
            normal: {
                // 價格浮動配置
                priceVariation: {
                    enabled: true,
                    strategy: 'balanced_range',       // 平衡範圍策略
                    expansionFactor: 0.1,             // 範圍擴展 10%
                    centerBias: 0.5,                  // 50% 機率選擇中心區域
                    roundingRule: 'nearest1',
                    seedStrategy: 'perSession',
                    edgeChance: 0.2                   // 20% 機率選擇邊緣價格
                },
                // 語音模板配置
                speechTemplates: {
                    itemPrice: "{itemName}的價格是{price}元",
                    priceChanged: "{itemName}現在{price}元",
                    welcomeShop: "歡迎光臨！請注意商品的價格標示。"
                },
                // 時間配置
                timing: {
                    priceDisplayDelay: 300,
                    speechDelay: 600
                }
            },
            hard: {
                // 價格浮動配置
                priceVariation: {
                    enabled: true,
                    strategy: 'expand_range',         // 擴展範圍策略
                    expansionFactor: 0.15,            // 範圍擴展 15%
                    centerBias: 0.3,                  // 30% 機率選擇中心區域
                    roundingRule: 'irregular',        // 不規則價格
                    seedStrategy: 'perSession',
                    edgeChance: 0.4,                  // 40% 機率選擇邊緣價格
                    extremeChance: 0.1                // 10% 機率選擇極端價格
                },
                // 語音模板配置
                speechTemplates: {
                    itemPrice: "{itemName}{price}元",
                    priceChanged: "價格{price}元",
                    welcomeShop: "歡迎光臨！"
                },
                // 時間配置
                timing: {
                    priceDisplayDelay: 200,
                    speechDelay: 400
                }
            }
        },

        // =====================================================
        // 增強型價格生成策略模式（基於 priceRange）
        // =====================================================
        PriceStrategy: {
            // 價格生成種子（確保同一session內價格一致）
            sessionSeed: null,

            // 初始化種子
            initSeed() {
                if (!this.sessionSeed) {
                    this.sessionSeed = Date.now() % 10000;
                }
            },

            // 確定性隨機數生成器
            seededRandom(seed) {
                const x = Math.sin(seed) * 10000;
                return x - Math.floor(x);
            },

            // 生成商品專用種子
            generateItemSeed(priceRange, itemId, difficulty) {
                this.initSeed();
                const rangeSum = priceRange[0] + priceRange[1];
                return (this.sessionSeed + rangeSum + itemId.charCodeAt(0) + difficulty.charCodeAt(0)) % 9999;
            },

            // 獲取模式配置
            getModeConfig(difficulty) {
                return Game.ModeConfig[difficulty] || Game.ModeConfig.normal;
            },

            // 主要價格生成方法（增強版）
            generateEnhancedPrice(item, difficulty) {
                const config = this.getModeConfig(difficulty);
                const originalRange = item.priceRange;

                if (!config.priceVariation.enabled) {
                    return this.getRandomPriceFromRange(originalRange);
                }

                const enhancedRange = this.calculateEnhancedRange(originalRange, config);
                const targetPrice = this.selectPriceByStrategy(enhancedRange, config, item.id, difficulty);

                return this.applyRounding(targetPrice, config.priceVariation.roundingRule);
            },

            // 計算增強範圍
            calculateEnhancedRange(originalRange, config) {
                const [minPrice, maxPrice] = originalRange;
                const rangeSize = maxPrice - minPrice;
                const expansion = Math.round(rangeSize * config.priceVariation.expansionFactor);

                return [
                    Math.max(1, minPrice - expansion),
                    maxPrice + expansion
                ];
            },

            // 根據策略選擇價格
            selectPriceByStrategy(enhancedRange, config, itemId, difficulty) {
                const [minPrice, maxPrice] = enhancedRange;
                const centerPrice = Math.round((minPrice + maxPrice) / 2);
                const seed = this.generateItemSeed(enhancedRange, itemId, difficulty);
                const randomFactor = this.seededRandom(seed);

                switch (config.priceVariation.strategy) {
                    case 'favor_center':
                        return this.favorCenterStrategy(minPrice, maxPrice, centerPrice, config, randomFactor);

                    case 'balanced_range':
                        return this.balancedRangeStrategy(minPrice, maxPrice, centerPrice, config, randomFactor);

                    case 'expand_range':
                        return this.expandRangeStrategy(minPrice, maxPrice, config, randomFactor);

                    default:
                        return this.getRandomPriceFromRange([minPrice, maxPrice]);
                }
            },

            // 偏好中心價格策略（簡單模式）
            favorCenterStrategy(minPrice, maxPrice, centerPrice, config, randomFactor) {
                if (randomFactor < config.priceVariation.centerBias) {
                    // 選擇中心區域 (中心價格 ± 25%)
                    const centerRange = Math.round((maxPrice - minPrice) * 0.25);
                    const centerMin = Math.max(minPrice, centerPrice - centerRange);
                    const centerMax = Math.min(maxPrice, centerPrice + centerRange);
                    return Math.round(centerMin + (centerMax - centerMin) * randomFactor);
                } else {
                    // 選擇全範圍
                    return Math.round(minPrice + (maxPrice - minPrice) * randomFactor);
                }
            },

            // 平衡範圍策略（普通模式）
            balancedRangeStrategy(minPrice, maxPrice, centerPrice, config, randomFactor) {
                const edgeChance = config.priceVariation.edgeChance || 0.2;

                if (randomFactor < edgeChance) {
                    // 選擇邊緣價格（最低或最高 20% 區域）
                    const edgeRange = Math.round((maxPrice - minPrice) * 0.2);
                    if (randomFactor < edgeChance / 2) {
                        return Math.round(minPrice + edgeRange * randomFactor * 5);
                    } else {
                        return Math.round(maxPrice - edgeRange * (1 - randomFactor) * 5);
                    }
                } else {
                    // 選擇中間區域
                    return Math.round(minPrice + (maxPrice - minPrice) * randomFactor);
                }
            },

            // 擴展範圍策略（困難模式）
            expandRangeStrategy(minPrice, maxPrice, config, randomFactor) {
                const edgeChance = config.priceVariation.edgeChance || 0.4;
                const extremeChance = config.priceVariation.extremeChance || 0.1;

                if (randomFactor < extremeChance) {
                    // 選擇極端價格（最邊緣）
                    return randomFactor < extremeChance / 2 ? minPrice : maxPrice;
                } else if (randomFactor < edgeChance) {
                    // 選擇邊緣價格
                    const edgeRange = Math.round((maxPrice - minPrice) * 0.3);
                    if (randomFactor < edgeChance / 2) {
                        return Math.round(minPrice + edgeRange * randomFactor * 3);
                    } else {
                        return Math.round(maxPrice - edgeRange * (1 - randomFactor) * 3);
                    }
                } else {
                    // 全範圍隨機
                    return Math.round(minPrice + (maxPrice - minPrice) * randomFactor);
                }
            },

            // 從範圍內隨機選擇（原始方法）
            getRandomPriceFromRange(priceRange) {
                const [minPrice, maxPrice] = priceRange;
                return Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
            },

            // 應用四捨五入規則
            applyRounding(price, roundingRule) {
                switch (roundingRule) {
                    case 'nearest1':
                        return Math.round(price);
                    case 'nearest5':
                        return Math.round(price / 5) * 5;
                    case 'irregular':
                        // 困難模式：產生不規則價格
                        const rounded = Math.round(price);
                        if (rounded % 5 === 0 && rounded > 5) {
                            return rounded + (this.seededRandom(price) > 0.5 ? 2 : 3);
                        }
                        return rounded;
                    default:
                        return Math.round(price);
                }
            },

            // 重設session（開始新遊戲時調用）
            resetSession() {
                this.sessionSeed = null;
                Game.Debug.log('state', '🎯 [C6-找零] Session重設，價格將重新生成');
            }
        },

        // =====================================================
        // 遊戲資料庫（初始化於 initGameData()）
        // =====================================================
        gameData: {},

        // =====================================================
        // 初始化系統
        // =====================================================
        init() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeAll();
            Game.Debug.log('init', '🚀 Game.init() 開始初始化遊戲系統');

            // 🎬 注入全局動畫樣式
            this.injectGlobalAnimationStyles();

            Game.Debug.log('init', '📱 瀏覽器環境檢查:', {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            });
            
            try {
                Game.Debug.log('audio', '🔊 初始化音效系統...');
                this.audio.init();
                Game.Debug.log('state', '✅ 音效系統初始化完成');
                
                Game.Debug.log('speech', '🗣️ 初始化語音系統...');
                this.speech.init();
                Game.Debug.log('state', '✅ 語音系統初始化完成');
                
                Game.Debug.log('state', '📊 初始化遊戲數據...');
                this.initGameData();
                Game.Debug.log('state', '✅ 遊戲數據初始化完成');
                
                Game.Debug.log('init', '⚙️ 顯示設定頁面...');
                this.showSettings();
                Game.Debug.log('state', '✅ 設定頁面顯示完成');
                
                Game.Debug.log('state', '🎉 遊戲系統初始化成功');
                
                // 監控系統狀態（清除舊的 monitoring 計時器避免累積）
                Game.TimerManager.clearByCategory('monitoring');
                this.startSystemMonitoring();
                
            } catch (error) {
                Game.Debug.error('❌ 遊戲系統初始化失敗:', error);
                Game.Debug.error('堆疊追蹤:', error.stack);
                
                // 嘗試恢復
                Game.TimerManager.setTimeout(() => {
                    Game.Debug.log('state', '🔄 嘗試重新初始化...');
                    this.init();
                }, 2000);
            }
        },

        // 初始化遊戲數據
        initGameData() {
            Game.Debug.log('state', '📊 initGameData() 初始化遊戲數據');
            
            this.gameData = {
                // 物品數據庫
                purchaseItems: {
                    // 1位數 (1-9元) 物品
                    candy: [
                        { id: 'candy_lollipop', name: '棒棒糖', img: 'icon-c6-lollipop', emoji: '🍭', priceRange: [2, 8] },
                        { id: 'candy_gum', name: '口香糖', img: 'icon-c6-gum', emoji: '🍬', priceRange: [3, 9] },
                        { id: 'candy_chocolate', name: '巧克力', img: 'icon-c6-chocolate', emoji: '🍫', priceRange: [4, 9] }
                    ],
                    sticker: [
                        { id: 'sticker_star', name: '星星貼紙', img: 'icon-c6-star-sticker', emoji: '⭐', priceRange: [1, 6] },
                        { id: 'sticker_heart', name: '愛心貼紙', img: 'icon-c6-heart-sticker', emoji: '💖', priceRange: [2, 8] },
                        { id: 'sticker_animal', name: '動物貼紙', img: 'icon-c6-animal-sticker', emoji: '🐱', priceRange: [3, 9] }
                    ],
                    eraser: [
                        { id: 'eraser_elephant', name: '大象造形橡皮擦', img: 'icon-c6-elephant-eraser', emoji: '🐘', priceRange: [2, 7] },
                        { id: 'eraser_car', name: '汽車造形橡皮擦', img: 'icon-c6-car-eraser', emoji: '🚗', priceRange: [4, 9] },
                        { id: 'eraser_rainbow', name: '彩虹造形橡皮擦', img: 'icon-c6-rainbow-eraser', emoji: '🌈', priceRange: [3, 9] }
                    ],
                    
                    // 2位數 (10-99元) 物品
                    snack: [
                        { id: 'snack_cookie', name: '餅乾', img: 'icon-c6-cookie', emoji: '🍪', priceRange: [15, 85] },
                        { id: 'snack_chips', name: '洋芋片', img: 'icon-c6-chips', emoji: '🥔', priceRange: [20, 90] },
                        { id: 'snack_crackers', name: '蘇打餅', img: 'icon-c6-crackers', emoji: '🫓', priceRange: [12, 75] }
                    ],
                    pen: [
                        { id: 'pen_ballpoint', name: '原子筆', img: 'icon-c6-ballpoint-pen', emoji: '✏️', priceRange: [10, 60] },
                        { id: 'pen_whiteboard', name: '白板筆', img: 'icon-c6-whiteboard-marker', emoji: '🖊️', priceRange: [25, 95] },
                        { id: 'pen_colored', name: '彩色筆', img: 'icon-c6-colored-pen', emoji: '🎨', priceRange: [30, 85] }
                    ],
                    notebook: [
                        { id: 'drink_cup', name: '杯子', img: 'icon-c6-cup', emoji: '🥤', priceRange: [30, 150] },
                        { id: 'notebook_spiral', name: '線圈筆記本', img: 'icon-c6-spiral-notebook', emoji: '🗒️', priceRange: [20, 85] },
                        { id: 'notebook_diary', name: '日記本', img: 'icon-c6-diary', emoji: '📔', priceRange: [25, 95] }
                    ],
                    fruit: [
                        { id: 'fruit_apple', name: '蘋果', img: 'icon-c6-apple', emoji: '🍎', priceRange: [12, 45] },
                        { id: 'fruit_banana', name: '香蕉', img: 'icon-c6-banana', emoji: '🍌', priceRange: [10, 35] },
                        { id: 'fruit_orange', name: '橘子', img: 'icon-c6-orange', emoji: '🍊', priceRange: [15, 50] }
                    ],
                    
                    // 3位數 (100-999元) 物品
                    toy: [
                        { id: 'toy_car', name: '玩具車', img: 'icon-c6-toy-car', emoji: '🚗', priceRange: [120, 850] },
                        { id: 'toy_doll', name: '娃娃', img: 'icon-c6-doll', emoji: '🪆', priceRange: [150, 600] },
                        { id: 'toy_robot', name: '機器人', img: 'icon-c6-robot', emoji: '🤖', priceRange: [200, 900] }
                    ],
                    book: [
                        { id: 'book_story', name: '故事書', img: 'icon-c6-story-book', emoji: '📚', priceRange: [100, 400] },
                        { id: 'book_comic', name: '漫畫書', img: 'icon-c6-comic-book', emoji: '📖', priceRange: [150, 500] },
                        { id: 'food_pizza', name: '比薩', img: 'icon-c6-pizza', emoji: '🍕', priceRange: [150, 500] }
                    ],
                    lunch: [
                        { id: 'lunch_bento', name: '便當', img: 'icon-c6-bento', emoji: '🍱', priceRange: [80, 300] },
                        { id: 'lunch_club_sandwich', name: '總匯三明治', img: 'icon-c6-club-sandwich', emoji: '🥪', priceRange: [80, 250] },
                        { id: 'lunch_beef_noodle', name: '牛肉麵', img: 'icon-c6-beef-noodle', emoji: '🍜', priceRange: [120, 400] }
                    ],
                    stationery_set: [
                        { id: 'stationery_pencil_case', name: '筆盒', img: 'icon-c6-pencil-case', emoji: '📝', priceRange: [120, 500] },
                        { id: 'food_nuts', name: '堅果', img: 'icon-c6-nuts', emoji: '🥜', priceRange: [80, 350] },
                        { id: 'stationery_calculator', name: '計算機', img: 'icon-c6-calculator', emoji: '🔢', priceRange: [150, 600] }
                    ],
                    
                    // 4位數 (1000-9999元) 物品
                    electronics: [
                        { id: 'electronics_phone', name: '手機', img: 'icon-c6-phone', emoji: '📱', priceRange: [3000, 9000] },
                        { id: 'electronics_tablet', name: '平板', img: 'icon-c6-tablet', emoji: '📲', priceRange: [2500, 8000] },
                        { id: 'electronics_headphones', name: '耳機', img: 'icon-c6-headphones', emoji: '🎧', priceRange: [1000, 5000] }
                    ],
                    clothing: [
                        { id: 'clothing_shirt', name: '上衣', img: 'icon-c6-shirt', emoji: '👕', priceRange: [1000, 3000] },
                        { id: 'clothing_pants', name: '褲子', img: 'icon-c6-pants', emoji: '👖', priceRange: [1000, 4000] },
                        { id: 'clothing_jacket', name: '外套', img: 'icon-c6-jacket', emoji: '🧥', priceRange: [1500, 6000] }
                    ],
                    sports: [
                        { id: 'sports_skateboard', name: '滑板', img: 'icon-c6-skateboard', emoji: '🛹', priceRange: [2000, 8000] },
                        { id: 'sports_racket', name: '球拍', img: 'icon-c6-racket', emoji: '🏸', priceRange: [1000, 5000] },
                        { id: 'sports_basketball_shoes', name: '籃球鞋', img: 'icon-c6-basketball-shoes', emoji: '👟', priceRange: [2000, 8000] }
                    ],
                    game: [
                        { id: 'sports_bicycle', name: '腳踏車', img: 'icon-c6-bicycle', emoji: '🚲', priceRange: [3000, 12000] },
                        { id: 'game_board', name: '桌遊', img: 'icon-c6-board-game', emoji: '🎲', priceRange: [1000, 3000] },
                        { id: 'tech_smartwatch', name: '智慧手錶', img: 'icon-c6-smartwatch', emoji: '⌚', priceRange: [3000, 12000] }
                    ],

                    // 自訂金額物品
                    custom_item: [
                        { id: 'custom_gift', name: '神秘禮物', img: 'icon-c6-mystery-gift', emoji: '🎁', priceRange: [1, 9999] },
                        { id: 'custom_treasure', name: '寶物', img: 'icon-c6-treasure', emoji: '💎', priceRange: [1, 9999] },
                        { id: 'custom_magic', name: '魔法物品', img: 'icon-c6-magic-item', emoji: '✨', priceRange: [1, 9999] }
                    ]
                },
                // 錢幣數據
                allItems: [
                    { value: 1, images: { front: '../images/money/1_yuan_front.png', back: '../images/money/1_yuan_back.png' }},
                    { value: 5, images: { front: '../images/money/5_yuan_front.png', back: '../images/money/5_yuan_back.png' }},
                    { value: 10, images: { front: '../images/money/10_yuan_front.png', back: '../images/money/10_yuan_back.png' }},
                    { value: 50, images: { front: '../images/money/50_yuan_front.png', back: '../images/money/50_yuan_back.png' }},
                    { value: 100, images: { front: '../images/money/100_yuan_front.png', back: '../images/money/100_yuan_back.png' }},
                    { value: 500, images: { front: '../images/money/500_yuan_front.png', back: '../images/money/500_yuan_back.png' }},
                    { value: 1000, images: { front: '../images/money/1000_yuan_front.png', back: '../images/money/1000_yuan_back.png' }}
                ]
            };
            
            Game.Debug.log('state', '✅ 遊戲數據初始化完成');
            Game.Debug.log('state', '🔍 可用物品類型:', Object.keys(this.gameData.purchaseItems));
        },
        
        // 系統監控
        startSystemMonitoring() {
            Game.Debug.log('state', '📊 啟動系統監控');
            
            // 監控內存使用
            if (performance && performance.memory) {
                const logMemoryUsage = () => {
                    const memory = performance.memory;
                    Game.Debug.log('state', '💾 內存使用情況:', {
                        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
                        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
                        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
                    });
                };
                
                // 每30秒記錄一次內存使用（遞迴 TimerManager，可由 clearByCategory('monitoring') 停止）
                const scheduleNext = () => {
                    Game.TimerManager.setTimeout(() => {
                        logMemoryUsage();
                        scheduleNext();
                    }, 30000, 'monitoring');
                };
                scheduleNext();
                logMemoryUsage(); // 立即記錄一次
            }
            
            // 監控錯誤
            Game.EventManager.on(window, 'error', (event) => {
                Game.Debug.error('🚨 全域錯誤捕獲:', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error
                });
            }, {}, 'monitoring');
            
            // 監控未處理的 Promise 拒絕
            Game.EventManager.on(window, 'unhandledrejection', (event) => {
                Game.Debug.error('🚨 未處理的 Promise 拒絕:', event.reason);
            }, {}, 'monitoring');
            
            Game.Debug.log('state', '✅ 系統監控已啟用');
        },

        // =====================================================
        // =====================================================
        // 狀態重置
        // =====================================================

        /**
         * 統一重置遊戲狀態
         * 集中管理所有遊戲相關狀態的重置，避免重置邏輯分散
         */
        resetGameState() {
            this.state.quiz = {
                currentQuestion: 0,
                totalQuestions: 10,
                score: 0,
                questions: [],
                startTime: null,
                attempts: 0
            };
            this.state.loadingQuestion = false;
            this.state.compatibilityCache = {};
            this.state.gameCompleted = false;
            this.clickState = {
                selectedItem: null,
                lastClickTime: 0,
                lastClickedElement: null,
                doubleClickDelay: 500
            };
            Game.Debug.log('state', '🔄 [C6] 遊戲狀態已重置');
        },

        // 設定畫面（參考unit6樣式和版面）
        // =====================================================
        showSettings() {
            AssistClick.deactivate();
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            Game.Debug.log('state', '🎯 showSettings() 顯示設定頁面');

            // 🔧 [重構] 返回設定時重置遊戲狀態
            this.resetGameState();

            const app = document.getElementById('app');
            const settings = this.state.settings;

            // 定義錢幣與紙鈔
            const coins = [
                { value: 1, name: '1元' },
                { value: 5, name: '5元' },
                { value: 10, name: '10元' },
                { value: 50, name: '50元' }
            ];
            const bills = [
                { value: 100, name: '100元' },
                { value: 500, name: '500元' },
                { value: 1000, name: '1000元' }
            ];

            app.innerHTML = `
                <div class="unit-welcome">
                    <div class="welcome-content" style="text-align: center;">
                        <div class="settings-title-row">
                            <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                            <h1>單元C6：找零與計算</h1>
                        </div>
                        <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">學習計算找零金額，理解付款與找零的關係，培養實際交易中的找零能力</p>

                        <div class="game-settings">
                            <style>
                                /* 使用與 unit6 完全相同的樣式 */
                                .game-settings {
                                    text-align: center;
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
                                .game-settings a.selection-btn {
                                    color: #000 !important;
                                    font-weight: bold;
                                    text-decoration: none;
                                }
                                
                                /* 不相容物品樣式 */
                                .selection-btn.incompatible {
                                    background-color: #ffe6e6 !important;
                                    border-color: #ff4444 !important;
                                    color: #cc0000 !important;
                                    opacity: 0.8;
                                    cursor: help;
                                }
                                
                                .selection-btn.incompatible:hover {
                                    background-color: #ffcccc !important;
                                    transform: none !important;
                                    box-shadow: 0 2px 8px rgba(255, 68, 68, 0.3) !important;
                                }
                                
                                .selection-btn.incompatible.active {
                                    background-color: #ff9999 !important;
                                    border-color: #ff0000 !important;
                                }
                                
                                /* 相容性提示樣式 */
                                .compatibility-hint {
                                    margin-top: 10px;
                                    padding: 8px 12px;
                                    background-color: #fff3cd;
                                    border: 1px solid #ffeaa7;
                                    border-radius: 4px;
                                    color: #856404;
                                    font-size: 0.9em;
                                    line-height: 1.4;
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
                                
                                /* 物品類型分組樣式 */
                                .item-type-group {
                                    margin-bottom: 15px;
                                }
                                
                                .item-type-group-title {
                                    font-size: 14px;
                                    font-weight: bold;
                                    color: #666;
                                    margin-bottom: 8px;
                                    padding-bottom: 4px;
                                    border-bottom: 1px solid #ddd;
                                }
                                
                                .item-type-buttons {
                                    display: flex;
                                    justify-content: flex-start;
                                    gap: 10px;
                                    flex-wrap: wrap;
                                }
                                .denomination-selection {
                                    display: flex;
                                    justify-content: space-around;
                                    gap: 20px;
                                    flex-wrap: wrap;
                                }
                                .denomination-group {
                                    flex: 1;
                                    min-width: 250px;
                                }
                                .denomination-group h3, .denomination-group h4 {
                                    margin-top: 0;
                                    text-align: left;
                                    color: #495057;
                                }
                                .denomination-items {
                                    display: flex;
                                    flex-wrap: wrap;
                                    justify-content: center;
                                    gap: 10px;
                                    margin-top: 15px;
                                }
                                .setting-description {
                                    margin-top: 8px;
                                    text-align: left;
                                }
                            </style>
                        
                            <!-- 所有設定選項放在同一個框內 -->
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

                            <div class="setting-group" id="assist-click-group" style="background: #fff3cd; padding: 15px; border-radius: 10px; border: 2px solid #ffcc02; display: ${settings.difficulty === 'easy' ? 'block' : 'none'};">
                                <label style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 1.2em;">♿</span>
                                    <span>輔助點擊模式（單鍵操作）：</span>
                                </label>
                                <p style="font-size: 0.9em; color: #666; margin: 8px 0 12px 0; line-height: 1.5;">
                                    啟用後，只要偵測到點擊，系統會自動依序完成拖曳找零錢幣至對應格等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                    <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式」</strong>
                                </p>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.assistClick ? 'active' : ''}" id="assist-click-on">✓ 啟用</button>
                                    <button class="selection-btn ${!settings.assistClick ? 'active' : ''}" id="assist-click-off">✗ 停用</button>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label><img src="../images/common/icons_wallet.png" alt="💰" style="width:1.2em;height:1.2em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='💰'"> 我的錢包（付款的金錢）：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.walletAmount === 10 ? 'active' : ''}"
                                            data-type="walletAmount" data-value="10">
                                        10元
                                    </button>
                                    <button class="selection-btn ${settings.walletAmount === 50 ? 'active' : ''}"
                                            data-type="walletAmount" data-value="50">
                                        50元
                                    </button>
                                    <button class="selection-btn ${settings.walletAmount === 100 ? 'active' : ''}"
                                            data-type="walletAmount" data-value="100">
                                        100元
                                    </button>
                                    <button class="selection-btn ${settings.walletAmount === 500 ? 'active' : ''}"
                                            data-type="walletAmount" data-value="500">
                                        500元
                                    </button>
                                    <button class="selection-btn ${settings.walletAmount === 1000 ? 'active' : ''}"
                                            data-type="walletAmount" data-value="1000">
                                        1000元
                                    </button>
                                    <button class="selection-btn ${settings.walletAmount === 'random' ? 'active' : ''}"
                                            data-type="walletAmount" data-value="random">
                                        隨機 🎲
                                    </button>
                                    <button class="selection-btn ${settings.walletAmount === 'custom' ? 'active' : ''}"
                                            data-type="walletAmount" data-value="custom">
                                        自訂
                                    </button>
                                </div>
                                <div id="custom-wallet-input" style="display: ${settings.walletAmount === 'custom' ? 'block' : 'none'}; margin-top: 15px;">
                                    <button id="set-custom-wallet-btn"
                                            style="padding: 8px 15px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                        設定自訂錢包金額
                                    </button>
                                    <span id="custom-wallet-display" style="margin-left: 10px; font-weight: bold; color: #667eea;">
                                        目前：${settings.customWalletAmount || 0} 元
                                    </span>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label>🎲 題目設定：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.questionCount === 1 ? 'active' : ''}"
                                            data-type="questions" data-value="1">
                                        1題
                                    </button>
                                    <button class="selection-btn ${settings.questionCount === 3 ? 'active' : ''}"
                                            data-type="questions" data-value="3">
                                        3題
                                    </button>
                                    <button class="selection-btn ${settings.questionCount === 5 ? 'active' : ''}"
                                            data-type="questions" data-value="5">
                                        5題
                                    </button>
                                    <button class="selection-btn ${settings.questionCount === 10 ? 'active' : ''}"
                                            data-type="questions" data-value="10">
                                        10題
                                    </button>
                                    <button class="selection-btn ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? 'active' : ''}"
                                            data-type="questions" data-value="custom">
                                        自訂
                                    </button>
                                </div>
                                <div class="custom-question-display" style="display: ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? 'block' : 'none'}; margin-top: 10px;">
                                    <input type="text" id="custom-question-count-c6"
                                           value="${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? settings.questionCount + '題' : ''}"
                                           placeholder="請輸入題數"
                                           style="padding: 8px; border-radius: 5px; border: 2px solid ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? '#667eea' : '#ddd'}; background: ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? '#667eea' : 'white'}; color: ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                                           readonly onclick="Game.handleCustomQuestionClick()">
                                </div>
                            </div>

                            <div class="setting-group" id="mode-selection-group">
                                <label>🎮 模式選擇：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.mode === 'repeated' ? 'active' : ''}"
                                            data-type="mode" data-value="repeated"
                                            ${settings.difficulty === 'easy' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                        反複作答
                                    </button>
                                    <button class="selection-btn ${settings.mode === 'single' ? 'active' : ''}"
                                            data-type="mode" data-value="single"
                                            ${settings.difficulty === 'easy' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                        單次作答
                                    </button>
                                </div>
                                ${settings.difficulty === 'easy' ? '<p class="mode-hint" style="color: #999; font-size: 0.9em; margin-top: 8px;">簡單模式自動完成，無需選擇測驗模式</p>' : ''}
                            </div>
                        </div>

                        <!-- 🎁 獎勵系統 -->
                        <div class="setting-group">
                            <label style="text-align: left; display: block;">🎁 獎勵系統：</label>
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
                            <button class="back-btn" onclick="window.location.href='../index.html#part2'">
                                返回設定
                            </button>
                            <button id="start-quiz-btn" class="start-btn" disabled>
                                請完成所有選擇
                            </button>
                        </div>
                    </div>
                </div>
            `;

            Game.Debug.log('state', '✅ 設定頁面HTML已生成');

            // 綁定事件監聯器
            this.bindSettingEvents();

            // 自動設定所有可用物品類型
            this.autoSetItemTypes();

            // 🔧 [修正] 只綁定點擊事件，狀態由 checkStartState() 統一管理
            const startBtn = app.querySelector('#start-quiz-btn');
            if (startBtn) {
                Game.EventManager.on(startBtn, 'click', this.startQuiz.bind(this), {}, 'settings');
            }
            
            // 綁定自訂錢包金額按鈕事件
            const setCustomWalletBtn = app.querySelector('#set-custom-wallet-btn');
            if (setCustomWalletBtn) {
                Game.EventManager.on(setCustomWalletBtn, 'click', () => {
                    this.showNumberInput('請輸入錢包金額', (value) => {
                        const amount = parseInt(value);
                        // 🔧 [修正] 錢包金額最小值改為 10 元，確保能購買物品且有找零
                        if (isNaN(amount) || amount < 10 || amount > 9999) {
                            this.showMessage('請輸入 10-9999 之間的有效金額（需大於等於商品價格）', 'warning');
                            return false;
                        }

                        this.state.settings.customWalletAmount = amount;
                        // 自訂金額確認後，使用全部5類（不知道對應哪個層級）
                        this.state.settings.itemTypes = ['cheap', 'budget', 'medium', 'pricey', 'premium'];

                        // 更新顯示
                        const displaySpan = app.querySelector('#custom-wallet-display');
                        if (displaySpan) {
                            displaySpan.textContent = `目前：${amount} 元`;
                        }

                        // 檢查是否可以開始遊戲
                        this.checkStartState();

                        this.showMessage(`已設定錢包金額為 ${amount} 元`, 'success');

                        return true;
                    });
                }, {}, 'settings');
            }
            
            Game.Debug.log('init', '📱 事件監聽器已綁定');
        },
        
        // 綁定設定事件
        bindSettingEvents() {
            Game.Debug.log('event', '🔗 bindSettingEvents() 綁定設定事件');
            
            // 使用事件委派來處理所有設定選項點擊
            const gameSettings = document.querySelector('.game-settings');
            if (gameSettings) {
                Game.EventManager.on(gameSettings, 'click', this.handleSelection.bind(this), {}, 'settings');
                Game.Debug.log('state', '✅ 事件委派已設定');
            } else {
                Game.Debug.error('❌ 找不到 .game-settings 元素');
            }
            
            // 更新開始按鈕狀態
            this.checkStartState();

            // 👆 輔助點擊開關
            const assistOn = document.getElementById('assist-click-on');
            const assistOff = document.getElementById('assist-click-off');
            if (assistOn) {
                Game.EventManager.on(assistOn, 'click', (e) => {
                    e.stopPropagation();
                    this.state.settings.assistClick = true;
                    assistOn.classList.add('active');
                    assistOff?.classList.remove('active');
                }, {}, 'settings');
            }
            if (assistOff) {
                Game.EventManager.on(assistOff, 'click', (e) => {
                    e.stopPropagation();
                    this.state.settings.assistClick = false;
                    assistOff.classList.add('active');
                    assistOn?.classList.remove('active');
                }, {}, 'settings');
            }

            // 🎁 獎勵系統連結事件
            const settingsRewardLink = document.getElementById('settings-reward-link');
            if (settingsRewardLink) {
                Game.EventManager.on(settingsRewardLink, 'click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                }, {}, 'settings');
            }

            // 📝 作業單連結事件
            const worksheetLink = document.getElementById('settings-worksheet-link');
            if (worksheetLink) {
                Game.EventManager.on(worksheetLink, 'click', (e) => {
                    e.preventDefault();
                    // 作業單使用自己的預設值與工具列設定，不受遊戲設定影響
                    const params = new URLSearchParams({ unit: 'c6' });
                    window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
                }, {}, 'settings');
            }
        },

        // 播放選單選擇音效（參考unit6）
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
                    Game.Debug.log('audio', '音效播放失敗:', e);
                });
            } catch (error) {
                Game.Debug.log('audio', '無法載入選單音效:', error);
            }
        },

        // =====================================================
        // 通用系統功能
        // =====================================================
        
        // 檢查設定是否完整
        isSettingsComplete() {
            const { digits, customAmount, denominations, itemTypes, difficulty, mode, questionCount } = this.state.settings;
            
            // 基本檢查
            const basicComplete = digits && denominations.length > 0 && difficulty && mode && questionCount;
            
            if (!basicComplete) return false;
            
            // 🆕 自訂金額模式額外檢查
            if (digits === 'custom') {
                // 檢查自訂金額是否有效
                if (!customAmount || customAmount <= 0) {
                    return false;
                }
                
                // 檢查自訂金額與幣值組合相容性
                if (!this.checkCustomAmountCompatibility(customAmount, denominations)) {
                    return false;
                }
            }
            
            return true;
        },

        // 選擇處理（擴展unit4）
        handleSelection(event) {
            Game.Debug.log('state', '🎯 handleSelection() 被調用', { event: event.type, target: event.target });
            
            // 🔓 解鎖手機音頻播放權限
            if (window.AudioUnlocker && !window.AudioUnlocker.isUnlocked) {
                window.AudioUnlocker.unlock();
            }
            
            const btn = event.target.closest('.selection-btn');
            if (!btn) {
                Game.Debug.log('state', '❌ 未找到選擇按鈕，忽略點擊');
                return;
            }

            const { type, value } = btn.dataset;
            const settings = this.state.settings;
            
            // 播放選單選擇音效
            this.playMenuSelectSound();
            
            Game.Debug.log('ui', '📝 處理選擇', { 
                type, 
                value, 
                buttonText: btn.textContent.trim(),
                currentSettings: {...settings}
            });

            if (type === 'denomination') {
                // 多選處理
                const targetValue = parseInt(value, 10);
                const index = settings.denominations.indexOf(targetValue);

                if (index > -1) {
                    btn.classList.remove('active');
                    settings.denominations.splice(index, 1);
                    Game.Debug.log('state', `➖ 移除面額: ${targetValue}，目前: [${settings.denominations.join(', ')}]`);
                } else {
                    // 添加前檢查衝突
                    const testDenominations = [...settings.denominations, targetValue];
                    if (!this.isValidCombination(settings.digits, testDenominations)) {
                        this.showInvalidCombinationWarning(settings.digits, targetValue);
                        return; // 拒絕添加
                    }
                    // 自訂金額模式：檢查是否已設定自訂金額
                    if (settings.digits === 'custom') {
                        const { customAmount } = settings;
                        if (!customAmount || customAmount <= 0) {
                            this.showInvalidCombinationWarning('custom');
                            return; // 拒絕添加
                        }
                    }
                    btn.classList.add('active');
                    settings.denominations.push(targetValue);
                    Game.Debug.log('state', `➕ 添加面額: ${targetValue}，目前: [${settings.denominations.join(', ')}]`);
                }
            } else if (type === 'questions') {
                // 題目數量處理
                if (value === 'custom') {
                    // 自訂題目數量
                    this.showNumberInput('請輸入題目數量', (inputValue) => {
                        const questionCount = parseInt(inputValue);
                        if (isNaN(questionCount) || questionCount < 1 || questionCount > 100) {
                            this.showMessage('請輸入 1-100 之間的有效數字', 'warning');
                            return false;
                        }

                        settings.questionCount = questionCount;
                        Game.Debug.log('question', `🎲 自訂題目數量: ${questionCount}`);

                        // 更新active狀態
                        const customBtn = document.querySelector('[data-type="questions"][data-value="custom"]');
                        if (customBtn) {
                            const buttonGroup = customBtn.closest('.button-group');
                            buttonGroup.querySelectorAll('.selection-btn')
                                .forEach(b => b.classList.remove('active'));
                            customBtn.classList.add('active');
                        }

                        // 🔧 [修正] 顯示自訂題數輸入框並套用藍色樣式（避免閃爍）
                        const customDisplay = document.querySelector('.custom-question-display');
                        const customInput = document.getElementById('custom-question-count-c6');
                        if (customDisplay && customInput) {
                            customDisplay.style.display = 'block';
                            customInput.value = `${questionCount}題`;
                            customInput.style.background = '#667eea';
                            customInput.style.color = 'white';
                            customInput.style.borderColor = '#667eea';
                        }

                        this.checkStartState();
                        return true;
                    });
                } else {
                    // 預設題目數量
                    const questionCount = parseInt(value, 10);
                    settings.questionCount = questionCount;
                    btn.parentElement.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    Game.Debug.log('question', `🎲 選擇題目數量: ${questionCount}`);

                    // 🔧 [新增] 選擇預設題數時，隱藏自訂輸入框
                    const customDisplay = document.querySelector('.custom-question-display');
                    const customInput = document.getElementById('custom-question-count-c6');
                    if (customDisplay && customInput) {
                        customDisplay.style.display = 'none';
                        customInput.value = '';
                        customInput.style.background = 'white';
                        customInput.style.color = '#333';
                        customInput.style.borderColor = '#ddd';
                    }
                }
            } else {
                // 其他單選處理
                const oldValue = settings[type];
                if (type === 'walletAmount') {
                    settings[type] = (value === 'custom' || value === 'random') ? value : parseInt(value, 10);
                } else {
                    settings[type] = value;

                    // 更新難度說明文字
                    if (type === 'difficulty') {
                        this.updateDifficultyDescription(value);
                        this.updateModeButtonsAvailability(value);
                        // 顯示/隱藏輔助點擊開關
                        const assistGroup = document.getElementById('assist-click-group');
                        if (assistGroup) {
                            assistGroup.style.display = value === 'easy' ? 'block' : 'none';
                            if (value !== 'easy') this.state.settings.assistClick = false;
                        }
                    }
                }
                btn.parentElement.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                Game.Debug.log('state', `🔄 單選更新 ${type}: ${oldValue} → ${settings[type]}`);

                if (type === 'walletAmount') {
                    // 處理自訂錢包金額顯示/隱藏
                    const customWalletDiv = document.getElementById('custom-wallet-input');
                    if (customWalletDiv) {
                        customWalletDiv.style.display = (value === 'custom') ? 'block' : 'none';
                    }
                    // 非自訂時自動更新物品類型
                    if (value !== 'custom') {
                        this.autoSetItemTypes();
                    }
                    // 隨機模式提示
                    let randomHint = document.getElementById('c6-random-wallet-hint');
                    if (value === 'random') {
                        if (!randomHint) {
                            randomHint = document.createElement('p');
                            randomHint.id = 'c6-random-wallet-hint';
                            randomHint.style.cssText = 'margin-top:8px;font-size:0.9em;color:#667eea;';
                            randomHint.textContent = '每題將隨機從 10、50、100、500、1000 元中選擇不同錢包金額。';
                            const customWalletDiv2 = document.getElementById('custom-wallet-input');
                            if (customWalletDiv2) customWalletDiv2.parentNode.insertBefore(randomHint, customWalletDiv2.nextSibling);
                        }
                    } else if (randomHint) {
                        randomHint.remove();
                    }
                }
            }
            
            Game.Debug.log('state', '📊 更新後的完整設定:', {...settings});
            this.checkStartState();
        },

        // 🔧 [新增] 處理點擊自訂題數輸入框
        handleCustomQuestionClick() {
            const customBtn = document.querySelector('[data-type="questions"][data-value="custom"]');
            if (customBtn) {
                customBtn.click();
            }
        },

        // 取得難度說明文字
        getDifficultyDescription(difficulty) {
            const descriptions = {
                easy: '簡單：有視覺、語音提示，引導下完成找零錢的測驗。',
                normal: '普通：以選擇題的方式，選擇正確的零錢答案。',
                hard: '困難：自行計算找零金額。'
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

        // 更新測驗模式按鈕可用性（簡單模式禁用）
        updateModeButtonsAvailability(difficulty) {
            const modeButtons = document.querySelectorAll('[data-type="mode"]');
            const modeGroup = document.getElementById('mode-selection-group');
            if (!modeGroup) return;

            if (difficulty === 'easy') {
                modeButtons.forEach(btn => {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.classList.remove('active');
                });

                if (!modeGroup.querySelector('.mode-hint')) {
                    const hint = document.createElement('p');
                    hint.className = 'mode-hint';
                    hint.style.cssText = 'color: #999; font-size: 0.9em; margin-top: 8px;';
                    hint.textContent = '簡單模式自動完成，無需選擇測驗模式';
                    modeGroup.appendChild(hint);
                }

                this.state.settings.mode = null;
            } else {
                modeButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                });

                const hint = modeGroup.querySelector('.mode-hint');
                if (hint) hint.remove();
            }
        },

        // 檢查開始狀態
        checkStartState() {
            Game.Debug.log('state', '🔍 checkStartState() 檢查遊戲開始條件');

            const { walletAmount, customWalletAmount, itemTypes, difficulty, mode, questionCount } = this.state.settings;
            const startBtn = document.getElementById('start-quiz-btn');

            // 簡單模式不需要選擇測驗模式
            const modeRequired = difficulty !== 'easy';
            const modeValid = modeRequired ? !!mode : true;

            const conditions = {
                walletAmount: !!walletAmount,
                customWalletValid: (walletAmount === 'custom') ? (customWalletAmount >= 10) : true,
                difficulty: !!difficulty,
                mode: modeValid,
                questionCount: !!questionCount
            };

            const isReady = Object.values(conditions).every(condition => condition);

            Game.Debug.log('state', '✅ 條件檢查結果:', {
                conditions,
                isReady,
                currentSettings: { walletAmount, customWalletAmount, itemTypes, difficulty, mode, questionCount }
            });

            if (startBtn) {
                startBtn.disabled = !isReady;
                // 🔧 改善訊息：當 custom 錢包未設定時提示
                let buttonText = '開始測驗！';
                if (!isReady) {
                    if (walletAmount === 'custom' && customWalletAmount < 10) {
                        buttonText = '請設定自訂錢包金額（需≥10元）';
                    } else {
                        buttonText = '請完成所有選擇';
                    }
                }
                startBtn.textContent = buttonText;
                Game.Debug.log('state', `🎮 開始按鈕狀態: ${isReady ? '啟用' : '停用'} - "${startBtn.textContent}"`);
            } else {
                Game.Debug.error('❌ 找不到開始按鈕元素');
            }
        },

        // 更新面額UI（限制規則）
        updateDenominationUI() {
            const { digits } = this.state.settings;
            
            if (digits === 'custom') {
                // 自訂金額模式：無面額限制，但檢查是否有衝突
                return;
            }
            
            const maxDenomination = Math.pow(10, digits);
            
            const denominationButtons = document.querySelectorAll('.selection-btn[data-type="denomination"]');
            denominationButtons.forEach(btn => {
                const value = parseInt(btn.dataset.value, 10);
                btn.disabled = value >= maxDenomination;
                if (btn.disabled) {
                    btn.classList.remove('active');
                    const index = this.state.settings.denominations.indexOf(value);
                    if (index > -1) {
                        this.state.settings.denominations.splice(index, 1);
                    }
                }
            });
        },

        // 新增：檢查位數和幣值組合是否有效（簡化版，適用unit5）
        isValidCombination(digits, denominations) {
            if (!denominations.length) return true;
            
            if (digits === 'custom') {
                // 自訂金額模式：只需要檢查是否有自訂金額設定
                const { customAmount } = this.state.settings;
                return customAmount && customAmount > 0;
            }
            
            // 位數模式：檢查基本的面額限制
            const maxDenomination = Math.pow(10, digits);
            const invalidDenominations = denominations.filter(d => d >= maxDenomination);
            
            return invalidDenominations.length === 0;
        },

        // 新增：顯示無效組合警告（簡化版，適用unit5）
        showInvalidCombinationWarning(digits, invalidItems, customData = null) {
            let message;
            
            if (digits === 'custom') {
                // 自訂金額模式的警告
                message = '請先設定自訂金額才能選擇幣值';
            } else {
                // 位數模式警告
                const digitNames = { 1: '1位數', 2: '2位數', 3: '3位數', 4: '4位數' };
                const digitName = digitNames[digits] || '未選擇的位數模式';

                if (Array.isArray(invalidItems)) {
                    const itemNames = invalidItems.map(v => `${v}元`).join('、');
                    message = `選擇${digitName}後，${itemNames}將無法使用，已自動移除`;
                } else {
                    message = `請先選擇目標金額位數，再選擇幣值`;
                }
            }
            
            // 創建警告彈窗
            const modalOverlay = document.createElement('div');
            modalOverlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0, 0, 0, 0.75);
                display: flex; align-items: center; justify-content: center;
                z-index: 2000; opacity: 0; transition: opacity 0.3s;
            `;

            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                padding: 30px 40px; border-radius: 15px; text-align: center;
                color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                transform: scale(0.8); transition: transform 0.3s;
                border: 2px solid #f39c12; max-width: 450px;
            `;

            modalContent.innerHTML = `
                <h2 style="font-size: 1.8em; margin: 0 0 15px 0; color: #f1c40f;">⚠️ 設定衝突</h2>
                <p style="font-size: 1.1em; margin: 0; line-height: 1.4;">${message}</p>
            `;

            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);

            // 語音提示
            this.speech.speak(message);

            // 點擊關閉
            const closeModal = () => {
                modalOverlay.style.opacity = '0';
                modalContent.style.transform = 'scale(0.8)';
                Game.TimerManager.setTimeout(() => {
                    if (document.body.contains(modalOverlay)) {
                        document.body.removeChild(modalOverlay);
                    }
                }, 300);
            };

            Game.EventManager.on(modalOverlay, 'click', closeModal, {}, 'gameUI');

            // 動畫效果
            Game.TimerManager.setTimeout(() => {
                modalOverlay.style.opacity = '1';
                modalContent.style.transform = 'scale(1)';
            }, 10);

            // 4秒後自動關閉
            Game.TimerManager.setTimeout(closeModal, 4000, 'ui');
        },

        // 根據目標金額位數嚴格對應物品類型（移除向下相容）
        getAvailableItemTypes(digits) {
            // 定義每個位數層級對應的物品（嚴格對應）
            const itemsByDigits = {
                1: [  // 1位數 (1-9元)
                    { type: 'candy', name: '糖果', emoji: '🍬' },
                    { type: 'sticker', name: '貼紙', emoji: '✨' },
                    { type: 'eraser', name: '橡皮擦', emoji: '🧽' }
                ],
                2: [  // 2位數 (10-99元)
                    { type: 'snack', name: '零食', emoji: '🍪' },
                    { type: 'pen', name: '筆', emoji: '✏️' },
                    { type: 'notebook', name: '筆記本', emoji: '📓' },
                    { type: 'fruit', name: '水果', emoji: '🍎' }
                ],
                3: [  // 3位數 (100-999元)
                    { type: 'toy', name: '玩具', emoji: '🧸' },
                    { type: 'book', name: '書籍', emoji: '📚' },
                    { type: 'lunch', name: '便當', emoji: '🍱' },
                    { type: 'stationery_set', name: '文具組', emoji: '📝' }
                ],
                4: [  // 4位數 (1000-9999元)
                    { type: 'electronics', name: '電子產品', emoji: '📱' },
                    { type: 'clothing', name: '衣物', emoji: '👕' },
                    { type: 'sports', name: '運動用品', emoji: '⚽' },
                    { type: 'game', name: '遊戲', emoji: '🎮' }
                ]
            };
            
            // 嚴格對應：只返回當前位數的物品
            if (digits === 'custom') {
                // 🆕 自訂金額模式：根據金額大小判定位數範圍
                return this.getAvailableItemTypesForCustomAmount(this.state.settings.customAmount);
            } else {
                // 嚴格位數對應
                return itemsByDigits[digits] || [];
            }
        },

        // 🆕 根據自訂金額判定可用的物品類型
        getAvailableItemTypesForCustomAmount(amount) {
            Game.Debug.log('state', `🎯 自訂金額 ${amount}元，判定可用物品類型`);
            
            if (!amount || amount <= 0) {
                Game.Debug.warn('state', '⚠️ 自訂金額無效，返回空陣列');
                return [];
            }

            // 根據金額大小判定位數範圍，然後返回對應的物品類型
            if (amount >= 1 && amount <= 9) {
                Game.Debug.log('state', '📋 1位數物品 (1-9元)');
                return [
                    { type: 'candy', name: '糖果', emoji: '🍬' },
                    { type: 'sticker', name: '貼紙', emoji: '✨' },
                    { type: 'eraser', name: '橡皮擦', emoji: '🧽' }
                ];
            } else if (amount >= 10 && amount <= 99) {
                Game.Debug.log('state', '📋 2位數物品 (10-99元)');
                return [
                    { type: 'snack', name: '零食', emoji: '🍪' },
                    { type: 'pen', name: '筆', emoji: '✏️' },
                    { type: 'notebook', name: '筆記本', emoji: '📓' },
                    { type: 'fruit', name: '水果', emoji: '🍎' }
                ];
            } else if (amount >= 100 && amount <= 999) {
                Game.Debug.log('state', '📋 3位數物品 (100-999元)');
                return [
                    { type: 'toy', name: '玩具', emoji: '🧸' },
                    { type: 'book', name: '書籍', emoji: '📚' },
                    { type: 'lunch', name: '便當', emoji: '🍱' },
                    { type: 'stationery_set', name: '文具組', emoji: '📝' }
                ];
            } else if (amount >= 1000 && amount <= 9999) {
                Game.Debug.log('state', '📋 4位數物品 (1000-9999元)');
                return [
                    { type: 'electronics', name: '電子產品', emoji: '📱' },
                    { type: 'clothing', name: '衣物', emoji: '👕' },
                    { type: 'sports', name: '運動用品', emoji: '⚽' },
                    { type: 'game', name: '遊戲', emoji: '🎮' }
                ];
            } else {
                Game.Debug.warn('state', '⚠️ 金額超出範圍 (1-9999元)');
                return [];
            }
        },

        // 🆕 檢查自訂金額與幣值組合的相容性
        checkCustomAmountCompatibility(amount, denominations) {
            Game.Debug.log('state', `🔍 檢查自訂金額 ${amount}元 與面額 [${denominations.join(', ')}] 的相容性`);
            
            if (!amount || amount <= 0) {
                Game.Debug.log('state', '❌ 自訂金額無效');
                return false;
            }
            
            if (!denominations || denominations.length === 0) {
                Game.Debug.log('state', '❌ 沒有選擇面額');
                return false;
            }
            
            // 使用動態規劃檢查是否能組合出目標金額
            const dp = new Array(amount + 1).fill(false);
            dp[0] = true; // 金額0可以用0個硬幣組成
            
            for (let coin of denominations) {
                for (let i = coin; i <= amount; i++) {
                    if (dp[i - coin]) {
                        dp[i] = true;
                    }
                }
            }
            
            const canMake = dp[amount];
            Game.Debug.log('state', `${canMake ? '✅' : '❌'} 自訂金額 ${amount}元 ${canMake ? '可以' : '無法'} 用面額 [${denominations.join(', ')}] 組合`);
            
            return canMake;
        },

        // 根據面額和位數計算所有可能的金額組合
        generatePossibleAmounts(denominations, digits) {
            Game.Debug.log('change', `🧮 計算面額 [${denominations.join(', ')}] 在 ${digits} 位數下的可能金額`);
            
            if (!denominations || denominations.length === 0) {
                Game.Debug.error('❌ 面額陣列為空');
                return [];
            }
            
            // 計算位數的最大金額
            const maxAmount = digits === 'custom' ? 9999 : Math.pow(10, digits) - 1;

            // 🔧 計算 30 個硬幣能達到的最大購買力
            const maxDenomination = Math.max(...denominations);
            const maxPurchasePower = 30 * maxDenomination;
            Game.Debug.log('wallet', `🪙 30 硬幣最大購買力: ${maxPurchasePower}元 (最大面額 ${maxDenomination}元 × 30)`);

            // 實際最大金額為位數限制和購買力限制的較小值
            const effectiveMaxAmount = Math.min(maxAmount, maxPurchasePower);
            Game.Debug.log('state', `📊 最大金額限制: ${maxAmount}元，有效最大金額: ${effectiveMaxAmount}元`);

            const possibleAmounts = new Set(); // 使用 Set 避免重複

            // 對每個面額計算倍數組合（使用 effectiveMaxAmount 限制）
            denominations.forEach(denomination => {
                Game.Debug.log('wallet', `💰 計算面額 ${denomination}元 的倍數`);

                // 計算這個面額可以組成的金額（受 30 硬幣限制）
                for (let count = 1; count * denomination <= effectiveMaxAmount; count++) {
                    const amount = count * denomination;
                    possibleAmounts.add(amount);

                    if (count <= 5) { // 只記錄前5個倍數用於日誌
                        Game.Debug.log('state', `  ${count}張 × ${denomination}元 = ${amount}元`);
                    }
                }
            });

            // 2D DP 一次性計算所有可組合金額（30 硬幣上限）
            if (denominations.length > 1) {
                Game.Debug.log('state', '🔄 2D DP 計算多面額組合...');
                const dp = new Uint16Array(effectiveMaxAmount + 1).fill(65535);
                dp[0] = 0;
                for (const d of denominations) {
                    for (let i = d; i <= effectiveMaxAmount; i++) {
                        if (dp[i - d] + 1 < dp[i]) {
                            dp[i] = dp[i - d] + 1;
                        }
                    }
                }
                for (let i = 1; i <= effectiveMaxAmount; i++) {
                    if (dp[i] <= 30) possibleAmounts.add(i);
                }
            }

            // 🔧 最終過濾：確保所有金額都在 30 硬幣購買力範圍內
            const sortedAmounts = Array.from(possibleAmounts)
                .filter(amount => amount <= effectiveMaxAmount)
                .sort((a, b) => a - b);
            Game.Debug.log('state', `✅ 共計算出 ${sortedAmounts.length} 個可能金額: [${sortedAmounts.slice(0, 10).join(', ')}${sortedAmounts.length > 10 ? '...' : ''}]`);
            
            return sortedAmounts;
        },

        // 檢查是否能用給定面額組成指定金額（限制硬幣數量）
        canMakeAmount(targetAmount, denominations, maxCoins) {
            const dp = Array(targetAmount + 1).fill(Infinity);
            dp[0] = 0;
            
            for (let amount = 1; amount <= targetAmount; amount++) {
                for (const denomination of denominations) {
                    if (denomination <= amount && dp[amount - denomination] < maxCoins) {
                        dp[amount] = Math.min(dp[amount], dp[amount - denomination] + 1);
                    }
                }
            }
            
            return dp[targetAmount] <= maxCoins;
        },

        // =====================================================
        // 價格策略系統 - 新增面額優先的物品價格生成
        // =====================================================
        generateItemPrice(possibleAmounts, strategy, digits, availableItemTypes) {
            Game.Debug.log('state', `🎯 使用策略 "${strategy}" 生成物品價格，可用金額數量: ${possibleAmounts.length}`);
            
            if (!possibleAmounts || possibleAmounts.length === 0) {
                Game.Debug.error('❌ 沒有可用的金額來生成價格');
                return null;
            }
            
            const maxPrice = digits === 'custom' ? 9999 : Math.pow(10, digits) - 1;
            
            // 🔧 關鍵修復：篩選可用金額，只保留在物品價格範圍內的金額
            const validAmounts = this.filterAmountsByItemPriceRanges(possibleAmounts, availableItemTypes, digits);
            if (!validAmounts || validAmounts.length === 0) {
                Game.Debug.error('❌ 沒有金額落在任何物品的價格範圍內');
                return null;
            }
            
            Game.Debug.log('state', `📋 篩選後有效金額數量: ${validAmounts.length} (從${possibleAmounts.length}個中篩選)`);
            
            switch (strategy) {
                case 'insufficient':
                    // 價格高於所有可能金額，確保錢不夠
                    return this.generateInsufficientPrice(validAmounts, maxPrice, availableItemTypes, digits);
                    
                case 'sufficient':
                    // 價格等於某個可能金額，確保錢剛好夠
                    return this.generateSufficientPrice(validAmounts);
                    
                case 'exact':
                    // 價格等於某個可能金額（與sufficient相同）
                    return this.generateSufficientPrice(validAmounts);
                    
                default:
                    Game.Debug.error(`❌ 未知的價格策略: ${strategy}`);
                    return null;
            }
        },

        generateInsufficientPrice(possibleAmounts, maxPrice, availableItemTypes, digits) {
            const maxPossibleAmount = Math.max(...possibleAmounts);
            Game.Debug.log('state', `📈 最大可能金額: ${maxPossibleAmount}元`);
            
            // 🔧 獲取所有物品的最大價格範圍，確保不足價格在合理範圍內
            let maxItemPrice = 0;
            availableItemTypes.forEach(typeKey => {
                const items = this.gameData.purchaseItems[typeKey];
                if (items && items.length > 0) {
                    items.forEach(item => {
                        const itemMaxPrice = Math.min(maxPrice, item.priceRange[1]);
                        maxItemPrice = Math.max(maxItemPrice, itemMaxPrice);
                    });
                }
            });
            
            Game.Debug.log('question', `🏷️ 物品最大價格: ${maxItemPrice}元`);
            
            // 🔧 智能生成insufficient價格：必須在物品價格範圍內且不可購買
            let insufficientPrice = null;
            
            // 🔍 獲取所有物品的最低價格
            let minItemPrice = Number.MAX_SAFE_INTEGER;
            availableItemTypes.forEach(typeKey => {
                const items = this.gameData.purchaseItems[typeKey];
                if (items && items.length > 0) {
                    items.forEach(item => {
                        const itemMinPrice = Math.max(1, item.priceRange[0]);
                        minItemPrice = Math.min(minItemPrice, itemMinPrice);
                    });
                }
            });
            
            Game.Debug.log('question', `🏷️ 物品最低價格: ${minItemPrice}元`);
            
            // 策略1: 在物品價格範圍內尋找不在可能金額中的價格 (從高到低)
            for (let price = maxItemPrice; price >= minItemPrice; price--) {
                if (!possibleAmounts.includes(price)) {
                    insufficientPrice = price;
                    Game.Debug.log('hint', `💡 找到範圍內的不足價格: ${price}元 (範圍: ${minItemPrice}-${maxItemPrice}元)`);
                    break;
                }
            }
            
            // 策略2: 如果找不到，尋找比最大可能金額稍高但在物品範圍內的價格
            if (!insufficientPrice && maxPossibleAmount < maxItemPrice && maxPossibleAmount + 1 >= minItemPrice) {
                insufficientPrice = maxPossibleAmount + 1;
                Game.Debug.log('hint', `💡 使用稍高價格: ${insufficientPrice}元`);
            }
            
            // 策略3: 如果還找不到，回退到sufficient策略
            if (!insufficientPrice || insufficientPrice > maxItemPrice || insufficientPrice < minItemPrice) {
                Game.Debug.warn('state', `⚠️ 無法生成合適的不足價格 (金額範圍: ${maxPossibleAmount}, 物品範圍: ${minItemPrice}-${maxItemPrice}元)，改用sufficient策略`);
                return this.generateSufficientPrice(possibleAmounts);
            }
            
            Game.Debug.log('change', `💸 生成不足價格: ${insufficientPrice}元`);
            return insufficientPrice;
        },

        generateSufficientPrice(possibleAmounts) {
            // 隨機選擇一個可能的金額作為價格
            const randomIndex = Math.floor(Math.random() * possibleAmounts.length);
            const sufficientPrice = possibleAmounts[randomIndex];
            Game.Debug.log('wallet', `💰 生成足夠價格: ${sufficientPrice}元`);
            return sufficientPrice;
        },

        // 🔧 新增：篩選金額，只保留在物品價格範圍內的金額
        filterAmountsByItemPriceRanges(possibleAmounts, itemTypes, digits) {
            Game.Debug.log('state', `🔍 篩選金額：檢查 ${possibleAmounts.length} 個金額是否落在物品價格範圍內`);
            
            const maxPrice = digits === 'custom' ? 9999 : Math.pow(10, digits) - 1;
            const validAmounts = [];
            
            // 收集所有選定物品類型的價格範圍
            const allPriceRanges = [];
            itemTypes.forEach(typeKey => {
                const items = this.gameData.purchaseItems[typeKey];
                if (items && items.length > 0) {
                    items.forEach(item => {
                        const itemMinPrice = Math.max(1, item.priceRange[0]);
                        const itemMaxPrice = Math.min(maxPrice, item.priceRange[1]);
                        allPriceRanges.push([itemMinPrice, itemMaxPrice]);
                    });
                }
            });
            
            Game.Debug.log('state', `📊 找到 ${allPriceRanges.length} 個物品價格範圍`);
            
            // 檢查每個金額是否落在任何物品的價格範圍內
            possibleAmounts.forEach(amount => {
                for (const [minPrice, maxPrice] of allPriceRanges) {
                    if (amount >= minPrice && amount <= maxPrice) {
                        if (!validAmounts.includes(amount)) {
                            validAmounts.push(amount);
                        }
                        break; // 找到一個符合的範圍就足夠了
                    }
                }
            });
            
            Game.Debug.log('state', `✅ 篩選完成：${validAmounts.length} 個有效金額 (從 ${possibleAmounts.length} 個中篩選)`);
            if (validAmounts.length > 0) {
                Game.Debug.log('state', `📋 有效金額範圍: ${Math.min(...validAmounts)}-${Math.max(...validAmounts)}元`);
            }
            
            return validAmounts;
        },

        // =====================================================
        // 緩存管理系統 - 優化重複計算
        // =====================================================
        clearCompatibilityCache() {
            this.state.compatibilityCache = {};
            Game.Debug.log('drag', '🗑️ 相容性緩存已清理');
        },
        
        generateCacheKey(itemType, denominations, digits) {
            return `${itemType}_${JSON.stringify(denominations)}_${digits}`;
        },

        // =====================================================
        // 簡化的相容性檢查 - 配合新版面額優先邏輯 + 金錢數量合理性檢查 + 緩存優化
        // =====================================================
        checkItemCompatibility(itemType, denominations, digits) {
            // 🚀 檢查緩存
            const cacheKey = this.generateCacheKey(itemType, denominations, digits);
            if (this.state.compatibilityCache.hasOwnProperty(cacheKey)) {
                Game.Debug.log('state', `💾 使用緩存結果: ${itemType} = ${this.state.compatibilityCache[cacheKey]}`);
                return this.state.compatibilityCache[cacheKey];
            }
            Game.Debug.log('state', `🔍 檢查物品類型 "${itemType}" 與面額 [${denominations?.join(', ')}] 的相容性`);
            
            if (!denominations || denominations.length === 0) {
                Game.Debug.warn('state', '⚠️ 沒有面額，默認相容');
                return true;
            }
            if (!itemType) {
                Game.Debug.warn('state', '⚠️ 沒有物品類型，默認相容');
                return true;
            }

            // 1. 檢查物品類型是否存在且符合位數要求
            const availableItemTypes = this.getAvailableItemTypes(digits);
            const availableTypeNames = availableItemTypes.map(item => item.type);
            if (!availableTypeNames.includes(itemType)) {
                Game.Debug.log('state', `❌ 物品類型 "${itemType}" 不符合位數 ${digits} 要求`);
                Game.Debug.log('state', `📋 可用的物品類型: [${availableTypeNames.join(', ')}]`);
                return false;
            }

            // 2. 檢查是否有該類型的物品
            const items = this.gameData.purchaseItems[itemType];
            if (!items || items.length === 0) {
                Game.Debug.log('state', `❌ 物品類型 "${itemType}" 沒有可用物品`);
                return false;
            }

            // 3. 計算面額可生成的金額範圍
            const possibleAmounts = this.generatePossibleAmounts(denominations, digits);
            if (possibleAmounts.length === 0) {
                Game.Debug.log('state', `❌ 面額 [${denominations.join(', ')}] 無法生成任何有效金額`);
                return false;
            }

            const minPossibleAmount = Math.min(...possibleAmounts);
            const maxPossibleAmount = Math.max(...possibleAmounts);
            Game.Debug.log('wallet', `💰 面額可生成金額範圍: ${minPossibleAmount}-${maxPossibleAmount}元`);

            // 4. 檢查硬幣數量合理性 - 檢查在30張硬幣限制下能否購買該位數物品
            if (digits !== 'custom') {
                const maxDenomination = Math.max(...denominations);
                const maxPurchasePower = 30 * maxDenomination; // 30張硬幣的最大購買力
                
                // 獲取該位數的最小價格（物品起始價格）
                let digitRangeMin;
                if (digits === 1) {
                    digitRangeMin = 1;   // 1位數物品: 1-9元
                } else if (digits === 2) {
                    digitRangeMin = 10;  // 2位數物品: 10-99元
                } else if (digits === 3) {
                    digitRangeMin = 100; // 3位數物品: 100-999元
                } else if (digits === 4) {
                    digitRangeMin = 1000; // 4位數物品: 1000-9999元
                }
                
                Game.Debug.log('state', `🔍 硬幣購買力檢查: 30張${maxDenomination}元 = ${maxPurchasePower}元購買力 vs ${digits}位數起始價格${digitRangeMin}元`);
                
                if (maxPurchasePower < digitRangeMin) {
                    Game.Debug.log('hint', `💡 會產生超過30錢幣，請選擇合理的位數與幣值組合`);
                    Game.Debug.log('state', `   詳細說明：30張${maxDenomination}元硬幣最多只能買${maxPurchasePower}元，無法購買${digits}位數物品(${digitRangeMin}元起)`);
                    return false;
                } else {
                    Game.Debug.log('state', `✅ 硬幣數量合理：30張${maxDenomination}元足夠購買${digits}位數物品`);
                }
            }

            // 5. 檢查是否有物品的價格範圍與可能金額重疊
            // 定義該位數的最大價格
            let maxPrice;
            if (digits === 1) {
                maxPrice = 9;    // 1位數物品: 1-9元
            } else if (digits === 2) {
                maxPrice = 99;   // 2位數物品: 10-99元
            } else if (digits === 3) {
                maxPrice = 999;  // 3位數物品: 100-999元
            } else if (digits === 4) {
                maxPrice = 9999; // 4位數物品: 1000-9999元
            } else if (digits === 'custom') {
                maxPrice = Number.MAX_SAFE_INTEGER; // 自訂金額無上限
            }
            
            const hasValidItem = items.some(item => {
                const itemMinPrice = Math.max(1, item.priceRange[0]);
                const itemMaxPrice = Math.min(maxPrice, item.priceRange[1]);
                
                // 檢查價格範圍是否與可能金額有重疊
                const hasOverlap = itemMinPrice <= maxPossibleAmount && itemMaxPrice >= minPossibleAmount;
                
                if (hasOverlap) {
                    Game.Debug.log('state', `✅ 物品 "${item.name}" 價格範圍 ${itemMinPrice}-${itemMaxPrice}元 與面額金額有重疊`);
                } else {
                    Game.Debug.warn('state', `⚠️ 物品 "${item.name}" 價格範圍 ${itemMinPrice}-${itemMaxPrice}元 與面額金額 ${minPossibleAmount}-${maxPossibleAmount}元 無重疊`);
                }
                
                return hasOverlap;
            });

            Game.Debug.log('state', `${hasValidItem ? '✅' : '❌'} 物品類型 "${itemType}" 相容性檢查結果: ${hasValidItem}`);
            
            // 🚀 存入緩存
            this.state.compatibilityCache[cacheKey] = hasValidItem;
            
            return hasValidItem;
        },

        // 檢測是否能用給定面額組成目標金額
        canGenerateMoneyAmount(targetAmount, denominations) {
            if (targetAmount <= 0) return true;
            
            // 使用動態規劃檢查是否可能組成目標金額
            const dp = new Array(targetAmount + 1).fill(false);
            dp[0] = true;
            
            for (let denomination of denominations) {
                for (let amount = denomination; amount <= targetAmount; amount++) {
                    if (dp[amount - denomination]) {
                        dp[amount] = true;
                    }
                }
            }
            
            return dp[targetAmount];
        },

        // 根據錢包金額返回對應的物品類別陣列
        getItemTypesByWalletAmount(walletAmount) {
            const map = {
                10:   ['cheap'],
                50:   ['budget'],
                100:  ['medium'],
                500:  ['pricey'],
                1000: ['premium']
            };
            return map[walletAmount] || ['cheap', 'budget', 'medium', 'pricey', 'premium'];
        },

        // 自動設定物品類型（根據錢包金額自動切換對應層級）
        autoSetItemTypes() {
            const { walletAmount } = this.state.settings;
            const types = (walletAmount && walletAmount !== 'custom' && walletAmount !== 'random')
                ? this.getItemTypesByWalletAmount(walletAmount)
                : ['cheap', 'budget', 'medium', 'pricey', 'premium'];
            this.state.settings.itemTypes = types;
            Game.Debug.log('state', `🔄 自動設定物品類型(錢包${walletAmount}元): [${types.join(', ')}]`);
        },

        // 更新物品類型按鈕（保留供相容性，實際不再使用）
        updateItemTypeUI() {
            Game.Debug.log('ui', '🔧 updateItemTypeUI() 更新物品類型UI');
            
            const { digits } = this.state.settings;
            
            // 找到物品類型按鈕容器
            const itemTypeButtonGroup = document.getElementById('item-type-buttons');
            if (!itemTypeButtonGroup) {
                Game.Debug.error('❌ 找不到物品類型按鈕容器');
                return;
            }
            
            const availableItemTypes = this.getAvailableItemTypes(digits);
            const settings = this.state.settings;
            
            // 記錄清理前的狀態
            const beforeCleanup = [...settings.itemTypes];
            Game.Debug.log('state', '🔍 清理前的物品類型選擇:', beforeCleanup);
            Game.Debug.log('state', '🔍 當前位數模式可用的物品類型:', availableItemTypes.map(t => t.type));
            
            // 清理已選擇但不再可用的物品類型
            settings.itemTypes = settings.itemTypes.filter(selectedType => 
                availableItemTypes.some(availableType => availableType.type === selectedType)
            );
            
            // 記錄清理後的狀態
            const afterCleanup = [...settings.itemTypes];
            const removedTypes = beforeCleanup.filter(type => !afterCleanup.includes(type));
            if (removedTypes.length > 0) {
                Game.Debug.log('state', '🧹 已清理不相容的物品類型:', removedTypes);
                Game.Debug.log('state', '✅ 清理後的物品類型選擇:', afterCleanup);
            } else {
                Game.Debug.log('state', 'ℹ️ 無需清理，物品類型選擇未變更');
            }
            
            // 生成按位數分組的按鈕HTML
            const createGroupedItemTypeButtonsHTML = (digits) => {
                // 定義位數分組
                const itemsByDigits = {
                    1: { title: '1位數 (1-9元)', items: [] },
                    2: { title: '2位數 (10-99元)', items: [] },
                    3: { title: '3位數 (100-999元)', items: [] },
                    4: { title: '4位數 (1000-9999元)', items: [] }
                };
                
                // 原始物品分組定義 (與getAvailableItemTypes保持一致)
                const originalItemGroups = {
                    'candy': 1, 'sticker': 1, 'eraser': 1,
                    'snack': 2, 'pen': 2, 'notebook': 2, 'fruit': 2,
                    'toy': 3, 'book': 3, 'lunch': 3, 'stationery_set': 3,
                    'electronics': 4, 'clothing': 4, 'sports': 4, 'game': 4
                };
                
                // 將可用物品分組
                availableItemTypes.forEach(item => {
                    const digitGroup = originalItemGroups[item.type] || 1;
                    if (itemsByDigits[digitGroup]) {
                        itemsByDigits[digitGroup].items.push(item);
                    }
                });
                
                // 生成分組HTML
                let groupedHTML = '';
                for (let d = 1; d <= digits; d++) {
                    if (itemsByDigits[d] && itemsByDigits[d].items.length > 0) {
                        groupedHTML += `
                            <div class="item-type-group">
                                <div class="item-type-group-title">${itemsByDigits[d].title}</div>
                                <div class="item-type-buttons">
                                    ${itemsByDigits[d].items.map(type => {
                                        const isCompatible = this.checkItemCompatibility(type.type, settings.denominations, digits);
                                        const compatibilityClass = isCompatible ? '' : 'incompatible';
                                        const compatibilityIcon = isCompatible ? '' : '❌ ';
                                        const tooltip = isCompatible ? '' : '此物品與當前面額設定不相容，建議添加更小面額';
                                        
                                        return `
                                            <button class="selection-btn ${settings.itemTypes.includes(type.type) ? 'active' : ''} ${compatibilityClass}" 
                                                    data-type="itemType" data-value="${type.type}"
                                                    title="${tooltip}">
                                                ${compatibilityIcon}${type.emoji} ${type.name}
                                            </button>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }
                }
                
                return groupedHTML;
            };
            
            // 更新按鈕容器內容為分組顯示
            if (digits === 'custom') {
                // 自訂模式使用原來的顯示方式
                const createItemTypeButtonsHTML = (types) => types.map(type => {
                    const isCompatible = this.checkItemCompatibility(type.type, settings.denominations, digits);
                    const compatibilityClass = isCompatible ? '' : 'incompatible';
                    const compatibilityIcon = isCompatible ? '' : '❌ ';
                    const tooltip = isCompatible ? '' : '此物品與當前面額設定不相容，建議添加更小面額';
                    
                    return `
                        <button class="selection-btn ${settings.itemTypes.includes(type.type) ? 'active' : ''} ${compatibilityClass}" 
                                data-type="itemType" data-value="${type.type}"
                                title="${tooltip}">
                            ${compatibilityIcon}${type.emoji} ${type.name}
                        </button>
                    `;
                }).join('');
                itemTypeButtonGroup.innerHTML = createItemTypeButtonsHTML(availableItemTypes);
            } else {
                // 一般模式使用分組顯示
                itemTypeButtonGroup.innerHTML = createGroupedItemTypeButtonsHTML(digits);
            }
            
            // 如果有物品類型被清理，需要重新檢查遊戲開始條件
            if (removedTypes.length > 0) {
                Game.Debug.log('state', '🔄 因物品類型清理，重新檢查遊戲開始條件');
                this.checkStartState();
            }
            
            // 檢查是否有不相容的物品並顯示提示
            this.updateCompatibilityHint();
            
            Game.Debug.log('state', `✅ 物品類型UI已更新，可用物品: ${availableItemTypes.length} 種`);
        },

        // 更新相容性提示
        updateCompatibilityHint() {
            const { digits, denominations } = this.state.settings;
            const hintElement = document.getElementById('compatibility-hint');
            
            if (!hintElement || !denominations || denominations.length === 0) {
                if (hintElement) hintElement.style.display = 'none';
                return;
            }

            // 檢查所有物品類型的相容性
            const allItemTypes = ['candy', 'sticker', 'eraser', 'snack', 'pen', 'notebook', 'fruit', 
                                  'toy', 'book', 'lunch', 'stationery_set', 'electronics', 'clothing', 'sports', 'game'];
            
            const incompatibleItems = allItemTypes.filter(itemType => {
                return !this.checkItemCompatibility(itemType, denominations, digits);
            });

            if (incompatibleItems.length > 0) {
                // 顯示提示
                hintElement.style.display = 'block';
                
                // 🔧 區分位數模式和自訂金額模式的提示邏輯
                if (digits === 'custom') {
                    // 自訂金額模式：檢查金額與幣值組合相容性
                    const { customAmount } = this.state.settings;
                    if (!this.checkCustomAmountCompatibility(customAmount, denominations)) {
                        hintElement.textContent = `💡 設定的金額與幣值組合無法產生`;
                    } else {
                        hintElement.style.display = 'none';
                    }
                } else {
                    // 位數模式：檢查硬幣購買力
                    const maxDenomination = Math.max(...denominations);
                    const maxPurchasePower = 30 * maxDenomination;
                    
                    let digitRangeMin;
                    if (digits === 1) {
                        digitRangeMin = 1;
                    } else if (digits === 2) {
                        digitRangeMin = 10;
                    } else if (digits === 3) {
                        digitRangeMin = 100;
                    } else if (digits === 4) {
                        digitRangeMin = 1000;
                    }
                    
                    if (maxPurchasePower < digitRangeMin) {
                        hintElement.textContent = `💡 會產生超過30錢幣，請選擇合理的位數與幣值組合`;
                    } else {
                        hintElement.style.display = 'none';
                    }
                }
            } else {
                // 隱藏提示
                hintElement.style.display = 'none';
            }
        },

        // 開始測驗
        // 題目生成系統
        // =====================================================
        // 重構的面額優先題目生成系統
        // =====================================================
        generateQuestion() {
            Game.Debug.log('question', '🎲 [C6-找零計算] generateQuestion() 開始');

            try {
                const { walletAmount, itemTypes, difficulty, customWalletAmount } = this.state.settings;
                
                // 參數驗證
                Game.Debug.log('state', '🔍 驗證生成參數:', { walletAmount, itemTypes, difficulty, customWalletAmount });

                if (!itemTypes || itemTypes.length === 0) {
                    Game.Debug.error('❌ 物品類型陣列為空或未定義');
                    return null;
                }

                // 確定錢包金額
                let actualWalletAmount;
                if (walletAmount === 'custom') {
                    actualWalletAmount = customWalletAmount;
                } else if (walletAmount === 'random') {
                    const randomWallets = [10, 50, 100, 500, 1000];
                    actualWalletAmount = randomWallets[Math.floor(Math.random() * randomWallets.length)];
                    Game.Debug.log('wallet', `隨機 🎲錢包金額: ${actualWalletAmount}元`);
                } else {
                    actualWalletAmount = walletAmount;
                }
                if (!actualWalletAmount || actualWalletAmount <= 0) {
                    Game.Debug.error('❌ 錢包金額無效');
                    return null;
                }
                Game.Debug.log('wallet', `💰 錢包金額: ${actualWalletAmount}元`);

                // 1. 生成商品價格（必須小於錢包金額，確保可以購買）
                const minPrice = Math.max(1, Math.floor(actualWalletAmount * 0.3)); // 最少30%
                const maxPrice = Math.floor(actualWalletAmount * 0.9); // 最多90%
                const itemPrice = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
                Game.Debug.log('wallet', `💵 生成商品價格: ${itemPrice}元 (範圍: ${minPrice}-${maxPrice}元)`);

                // 2. 選擇物品（隨機模式時依實際錢包金額決定物品類型）
                const effectiveItemTypes = (walletAmount === 'random')
                    ? this.getItemTypesByWalletAmount(actualWalletAmount)
                    : itemTypes;
                const randomType = effectiveItemTypes[Math.floor(Math.random() * effectiveItemTypes.length)];
                const typeItems = this.items[randomType];
                if (!typeItems || typeItems.length === 0) {
                    Game.Debug.error(`❌ 物品類型 ${randomType} 無可用物品`);
                    return null;
                }
                const selectedItem = typeItems[Math.floor(Math.random() * typeItems.length)];
                Game.Debug.log('question', `🛍️ 選擇物品: ${selectedItem.name} (${selectedItem.emoji}) - ${itemPrice}元`);

                // 3. 生成錢包金錢（硬幣和紙鈔組合）
                const walletCoins = this.generateWalletMoney(actualWalletAmount);
                if (!walletCoins || walletCoins.length === 0) {
                    Game.Debug.error('❌ 無法生成錢包金錢');
                    return null;
                }
                Game.Debug.log('wallet', `💳 錢包內容: ${walletCoins.length}個金錢，總額${actualWalletAmount}元`);

                // 4. 計算找零金額
                const changeAmount = actualWalletAmount - itemPrice;
                Game.Debug.log('wallet', `💰 找零金額: ${changeAmount}元`);

                // 5. 生成付款提示（簡單模式用）- 使用最佳付款方案（A4 風格）
                const optimalPaymentValues = this.calculateOptimalPayment(itemPrice, walletCoins);
                Game.Debug.log('hint', `💡 [簡單模式] 最佳付款方案:`, optimalPaymentValues);

                // 根據最佳付款方案找到對應的錢幣物件
                const paymentHint = [];
                const usedIndices = new Set();
                if (optimalPaymentValues && optimalPaymentValues.length > 0) {
                    optimalPaymentValues.forEach(value => {
                        const index = walletCoins.findIndex((coin, idx) =>
                            coin.value === value && !usedIndices.has(idx)
                        );
                        if (index !== -1) {
                            usedIndices.add(index);
                            paymentHint.push(walletCoins[index]);
                        }
                    });
                }
                Game.Debug.log('hint', `💡 付款提示: ${paymentHint.length}個金錢 (最佳付款方案)`);

                // 6. 生成找零提示（簡單模式用）
                const changeHint = this.generateChangeHint(changeAmount);
                Game.Debug.log('hint', `💡 找零提示: ${changeHint.length}個金錢`);

                // 7. 生成找回的零錢（第2步用）
                const changeCoins = this.generateChangeMoney(changeAmount);
                Game.Debug.log('wallet', `💵 找回的零錢: ${changeCoins.length}個金錢`);

                // 8. 返回題目物件
                const question = {
                    item: selectedItem,
                    itemPrice,
                    walletAmount: actualWalletAmount,
                    walletCoins,          // 我的錢包裡的金錢
                    changeAmount,         // 應找零金額
                    changeCoins,          // 店員找回的零錢
                    paymentHint,          // 付款區的淡化提示（與錢包相同）
                    changeHint,           // 找零區的淡化提示
                    step: 1               // 當前步驟（1=付款確認，2=找零驗證）
                };

                Game.Debug.log('state', '✅ [C6-找零計算] 題目生成成功');
                return question;

            } catch (error) {
                Game.Debug.error('❌ [C6-找零計算] 題目生成錯誤:', error);
                Game.Debug.error('堆疊追蹤:', error.stack);
                return null;
            }
        },

        // =====================================================
        // C6 專用輔助函數
        // =====================================================

        // 生成錢包金錢（將金額分解為硬幣和紙鈔的組合）
        generateWalletMoney(amount) {
            const denominations = [1000, 500, 100, 50, 10, 5, 1];
            const result = [];
            let remaining = amount;

            for (const denom of denominations) {
                while (remaining >= denom) {
                    const isBanknote = denom >= 100;
                    // 🔧 [新增] 隨機選擇正反面
                    const face = Math.random() < 0.5 ? 'front' : 'back';
                    result.push({
                        value: denom,
                        image: `../images/money/${denom}_yuan_${face}.png`,
                        face: face,
                        type: isBanknote ? 'banknote' : 'coin'
                    });
                    remaining -= denom;
                }
            }

            Game.Debug.log('wallet', `💳 生成錢包: ${amount}元 = ${result.map(m => m.value).join('+')} (${result.length}個)`);
            return result;
        },

        // 生成付款提示（給定金額，生成最少硬幣數的組合）
        generatePaymentHint(amount) {
            return this.generateWalletMoney(amount);
        },

        // 生成找零提示（給定找零金額，生成最少硬幣數的組合）
        generateChangeHint(amount) {
            return this.generateWalletMoney(amount);
        },

        // 生成找回的零錢（店員給的零錢）
        generateChangeMoney(amount) {
            return this.generateWalletMoney(amount);
        },

        // =====================================================
        // 🆕 自訂金額模式專用函數
        // =====================================================
        generateCustomAmountQuestion(customAmount, denominations, itemTypes, difficulty) {
            Game.Debug.log('state', `🎯 自訂金額模式題目生成: ${customAmount}元`);
            
            try {
                // 1. 物品選擇：根據自訂金額選擇可用物品類型
                Game.Debug.log('question', `📐 步驟1: 根據金額 ${customAmount}元 選擇物品類型`);
                const availableItems = this.getAvailableItemTypesForCustomAmount(customAmount);
                const availableItemTypeNames = availableItems.map(item => item.type);
                Game.Debug.log('state', `✅ 可用物品類型: [${availableItemTypeNames.join(', ')}]`);
                
                // 過濾出用戶選擇的物品類型
                const selectedItemTypes = availableItemTypeNames.filter(itemType => itemTypes.includes(itemType));
                if (selectedItemTypes.length === 0) {
                    Game.Debug.error(`❌ 沒有符合自訂金額 ${customAmount}元 且被選中的物品類型`);
                    return null;
                }
                Game.Debug.log('state', `🎯 最終選中的物品類型: [${selectedItemTypes.join(', ')}]`);

                // 2. 金錢固定：我的金錢固定為自訂金額，只變化幣值組合
                Game.Debug.log('wallet', `💳 步驟2: 生成固定金額 ${customAmount}元 的幣值組合`);
                const myMoney = this.generateMoneyForCustomAmount(customAmount, denominations);
                if (!myMoney || myMoney.length === 0) {
                    Game.Debug.error('❌ 無法為自訂金額生成幣值組合');
                    return null;
                }
                Game.Debug.log('state', `✅ 生成 ${myMoney.length} 個硬幣，總額 ${customAmount}元`);

                // 3. 物品價格：獨立生成，可以高於、等於或低於自訂金額
                Game.Debug.log('state', `🎮 步驟3: 生成獨立的物品價格（可高於、等於或低於 ${customAmount}元）`);
                const strategy = this.getQuestionStrategy(difficulty);
                const itemPrice = this.generateItemPriceForCustomAmount(customAmount, strategy, selectedItemTypes);
                if (!itemPrice) {
                    Game.Debug.error('❌ 無法生成物品價格');
                    return null;
                }
                Game.Debug.log('wallet', `💰 生成物品價格: ${itemPrice}元 (策略: ${strategy})`);

                // 4. 物品選擇：選擇符合價格的物品
                Game.Debug.log('question', `🛍️ 步驟4: 選擇符合價格的物品`);
                const selectedItem = this.selectRandomItem(selectedItemTypes, itemPrice, 'custom');
                if (!selectedItem) {
                    Game.Debug.error('❌ 無法選擇符合價格的物品');
                    return null;
                }
                Game.Debug.log('state', `✅ 選擇物品: ${selectedItem.name} (${selectedItem.emoji})`);

                // 5. 結果計算
                const totalMoney = customAmount; // 固定為自訂金額
                const isAffordable = totalMoney >= itemPrice;
                
                Game.Debug.log('state', '📊 自訂金額題目生成完成:', {
                    strategy,
                    customAmount,
                    itemPrice,
                    totalMoney,
                    isAffordable,
                    moneyPieces: myMoney.length,
                    denominations: denominations.join(',')
                });

                // 6. 返回題目物件
                const question = {
                    item: selectedItem,
                    itemPrice,
                    myMoney,
                    totalMoney,
                    isAffordable
                };
                
                Game.Debug.log('state', '✅ 自訂金額題目生成成功');
                return question;
                
            } catch (error) {
                Game.Debug.error('❌ 自訂金額題目生成錯誤:', error);
                Game.Debug.error('堆疊追蹤:', error.stack);
                return null;
            }
        },

        // =====================================================
        // 新版面額優先邏輯的輔助函數
        // =====================================================
        
        // 根據難度決定題目策略
        getQuestionStrategy(difficulty) {
            switch (difficulty) {
                case 'easy':
                    // 簡單模式：50% 足夠，50% 不足
                    return Math.random() < 0.5 ? 'sufficient' : 'insufficient';
                case 'normal':
                    // 普通模式：50% 足夠，50% 不足
                    return Math.random() < 0.5 ? 'sufficient' : 'insufficient';
                case 'hard':
                    // 困難模式：70% 足夠，30% 不足（更多挑戰）
                    return Math.random() < 0.7 ? 'sufficient' : 'insufficient';
                default:
                    return 'sufficient';
            }
        },

        // 隨機選擇符合價格的物品
        selectRandomItem(itemTypes, targetPrice, digits) {
            Game.Debug.log('state', `🎯 從物品類型 [${itemTypes.join(', ')}] 中選擇符合價格 ${targetPrice}元 的物品`);
            
            const maxPrice = digits === 'custom' ? 9999 : Math.pow(10, digits) - 1;
            const allValidItems = [];
            
            // 收集所有符合條件的物品
            itemTypes.forEach(typeKey => {
                const items = this.gameData.purchaseItems[typeKey];
                if (items && items.length > 0) {
                    items.forEach(item => {
                        // 檢查物品的價格範圍是否包含目標價格
                        const itemMinPrice = Math.max(1, item.priceRange[0]);
                        const itemMaxPrice = Math.min(maxPrice, item.priceRange[1]);
                        
                        if (targetPrice >= itemMinPrice && targetPrice <= itemMaxPrice) {
                            Game.Debug.log('state', `✅ 找到符合物品: ${item.name} (範圍: ${itemMinPrice}-${itemMaxPrice}元)`);
                            allValidItems.push(item);
                        }
                    });
                }
            });
            
            if (allValidItems.length === 0) {
                Game.Debug.error(`❌ 沒有物品的價格範圍包含 ${targetPrice}元`);
                return null;
            }
            
            // 隨機選擇一個符合的物品
            const randomIndex = Math.floor(Math.random() * allValidItems.length);
            const selectedItem = allValidItems[randomIndex];
            Game.Debug.log('question', `🛍️ 最終選擇: ${selectedItem.name} (${selectedItem.emoji})`);
            
            return selectedItem;
        },

        // 根據策略生成對應的金錢
        generateMoneyForStrategy(itemPrice, denominations, strategy) {
            Game.Debug.log('wallet', `💳 為策略 "${strategy}" 和價格 ${itemPrice}元 生成金錢`);
            
            switch (strategy) {
                case 'sufficient':
                case 'exact':
                    // 生成剛好足夠的金錢
                    return this.generateMoneyByAmount(itemPrice, denominations);
                    
                case 'insufficient':
                    // 生成不足的金錢（價格-1到價格的85%之間）
                    const maxInsufficient = Math.max(1, itemPrice - 1);
                    const minInsufficient = Math.max(0, Math.floor(itemPrice * 0.85));
                    const insufficientAmount = Math.floor(Math.random() * (maxInsufficient - minInsufficient + 1)) + minInsufficient;
                    Game.Debug.log('change', `💸 生成不足金額: ${insufficientAmount}元 (價格: ${itemPrice}元)`);
                    
                    if (insufficientAmount <= 0) {
                        // 如果金額為0，返回空陣列表示沒錢
                        return [];
                    }
                    
                    return this.generateMoneyByAmount(insufficientAmount, denominations);
                    
                default:
                    Game.Debug.error(`❌ 未知策略: ${strategy}`);
                    return null;
            }
        },

        // 新的面額優先金錢生成系統：根據確定金額生成對應面額組合
        // 🔧 修復：使用適合的面額組合，不強制要求所有面額都出現
        generateMoneyByAmount(targetAmount, denominations) {
            Game.Debug.log('wallet', `💰 生成金額: ${targetAmount}元，使用面額: [${denominations.join(', ')}]`);
            Game.Debug.log('state', `🎯 原則：使用適合的面額組合，盡可能多樣化`);
            
            if (targetAmount <= 0) {
                Game.Debug.error('❌ 目標金額必須大於0');
                return [];
            }
            
            const result = [];
            let remainingAmount = targetAmount;
            
            // 🔧 步驟1：篩選適用的面額 - 只使用不超過目標金額的面額
            const usableDenominations = denominations.filter(denom => denom <= targetAmount).sort((a, b) => a - b);
            Game.Debug.log('state', `🔍 適用面額: [${usableDenominations.join(', ')}] (排除超過${targetAmount}元的面額)`);
            
            if (usableDenominations.length === 0) {
                Game.Debug.warn('state', `⚠️ 沒有適用的面額 (最小面額 ${Math.min(...denominations)} 超過目標金額 ${targetAmount})`);
                return [];
            }
            
            // 🔧 步驟2：優先分配 - 盡可能使用不同面額，但不強制全部使用
            Game.Debug.log('event', `🔗 步驟1: 嘗試使用多樣化面額`);
            for (const denomination of usableDenominations) {
                if (remainingAmount >= denomination) {
                    const itemData = this.getItemData(denomination);
                    if (itemData) {
                        result.push({
                            id: `money-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            value: denomination,
                            image: this.getRandomImage(itemData)
                        });
                        remainingAmount -= denomination;
                        Game.Debug.log('state', `✅ 多樣化分配 ${denomination}元，剩餘: ${remainingAmount}元`);
                    } else {
                        Game.Debug.error(`❌ 找不到面額 ${denomination} 的資料`);
                        return [];
                    }
                } else {
                    Game.Debug.log('state', `⏭️ 跳過面額 ${denomination}元 (剩餘金額不足: ${remainingAmount}元)`);
                }
            }
            
            // 🔧 步驟3：貪婪分配剩餘金額（優先使用大面額）
            if (remainingAmount > 0) {
                Game.Debug.log('wallet', `💰 步驟2: 貪婪分配剩餘 ${remainingAmount}元`);
                const reversedUsableDenominations = [...usableDenominations].sort((a, b) => b - a); // 從大到小
                
                for (const denomination of reversedUsableDenominations) {
                    while (remainingAmount >= denomination) {
                        const itemData = this.getItemData(denomination);
                        if (itemData) {
                            result.push({
                                id: `money-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                value: denomination,
                                image: this.getRandomImage(itemData)
                            });
                            remainingAmount -= denomination;
                            Game.Debug.log('state', `➕ 貪婪添加 ${denomination}元，剩餘: ${remainingAmount}元`);
                        } else {
                            Game.Debug.error(`❌ 找不到面額 ${denomination} 的資料`);
                            break;
                        }
                    }
                }
            }
            
            if (remainingAmount > 0) {
                Game.Debug.warn('wallet', `⚠️ 無法完全組成目標金額，剩餘 ${remainingAmount}元 (這是正常情況)`);
            }
            
            const actualTotal = result.reduce((sum, money) => sum + money.value, 0);
            
            // 🔧 驗證使用的面額（不要求全部面額都被使用）
            const usedDenominations = [...new Set(result.map(money => money.value))].sort((a, b) => a - b);
            const expectedDenominations = [...usableDenominations].sort((a, b) => a - b);
            const originalDenominations = [...denominations].sort((a, b) => a - b);
            
            Game.Debug.log('state', `✅ 金錢生成完成:`);
            Game.Debug.log('wallet', `   目標: ${targetAmount}元，實際: ${actualTotal}元，共 ${result.length} 個硬幣`);
            Game.Debug.log('wallet', `   原始面額: [${originalDenominations.join(', ')}]`);
            Game.Debug.log('wallet', `   適用面額: [${expectedDenominations.join(', ')}]`);
            Game.Debug.log('wallet', `   實際面額: [${usedDenominations.join(', ')}]`);
            Game.Debug.log('wallet', `   面額多樣性: ${usedDenominations.length}/${usableDenominations.length}`);
            
            return result;
        },

        // =====================================================
        // 🆕 自訂金額模式專用金錢生成函數
        // =====================================================
        generateMoneyForCustomAmount(customAmount, denominations) {
            Game.Debug.log('wallet', `💳 為自訂金額 ${customAmount}元 生成隨機幣值組合`);
            Game.Debug.log('wallet', `🪙 可用面額: [${denominations.join(', ')}]`);
            
            // 使用動態規劃找出所有可能的組合方式
            const combinations = this.findAllCombinations(customAmount, denominations);
            
            if (combinations.length === 0) {
                Game.Debug.error(`❌ 無法用面額 [${denominations.join(', ')}] 組成 ${customAmount}元`);
                return null;
            }
            
            // 隨機選擇一種組合方式
            const selectedCombination = combinations[Math.floor(Math.random() * combinations.length)];
            Game.Debug.log('question', `🎲 選擇組合方式: ${JSON.stringify(selectedCombination)}`);
            
            // 根據選擇的組合生成實際的金錢物件
            const result = [];
            for (const [denomination, count] of Object.entries(selectedCombination)) {
                const denominationValue = parseInt(denomination);
                const itemData = this.getItemData(denominationValue);
                
                if (itemData) {
                    for (let i = 0; i < count; i++) {
                        result.push({
                            id: `money-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            value: denominationValue,
                            image: this.getRandomImage(itemData)
                        });
                    }
                    Game.Debug.log('state', `➕ 添加 ${count} 個 ${denominationValue}元`);
                } else {
                    Game.Debug.error(`❌ 找不到面額 ${denominationValue} 的資料`);
                }
            }
            
            const actualTotal = result.reduce((sum, money) => sum + money.value, 0);
            Game.Debug.log('state', `✅ 自訂金額幣值組合生成完成: 目標 ${customAmount}元，實際 ${actualTotal}元，共 ${result.length} 個硬幣`);
            
            return result;
        },

        // 找出所有可能的硬幣組合方式（動態規劃）
        // 🔧 修復：使用適合的面額組合，不強制要求所有面額都出現
        findAllCombinations(amount, denominations) {
            Game.Debug.log('change', `🧮 計算 ${amount}元 的所有可能組合方式`);
            Game.Debug.log('state', `🎯 原則：使用適合的面額組合，盡可能多樣化`);
            
            // 🔧 篩選適用的面額
            const usableDenominations = denominations.filter(denom => denom <= amount);
            Game.Debug.log('state', `🔍 適用面額: [${usableDenominations.join(', ')}] (排除超過${amount}元的面額)`);
            
            if (usableDenominations.length === 0) {
                Game.Debug.warn('state', `⚠️ 沒有適用的面額 (最小面額超過目標金額 ${amount})`);
                return [];
            }
            
            const allCombinations = [];
            const MAX_COMBINATIONS = 100;

            // 🔧 修改的回溯算法：使用適合的面額組合
            const backtrack = (remaining, currentCombination, startIndex) => {
                if (allCombinations.length >= MAX_COMBINATIONS) return;
                if (remaining === 0) {
                    // 檢查硬幣總數不超過30
                    const totalCoins = Object.values(currentCombination).reduce((sum, count) => sum + count, 0);
                    if (totalCoins <= 30) {
                        allCombinations.push({ ...currentCombination });
                        Game.Debug.log('state', `✅ 找到有效組合: ${JSON.stringify(currentCombination)} (${totalCoins}個硬幣)`);
                    } else {
                        Game.Debug.warn('state', `⚠️ 組合超過30硬幣限制: ${totalCoins}個`);
                    }
                    return;
                }
                
                if (remaining < 0) {
                    return;
                }
                
                for (let i = startIndex; i < usableDenominations.length; i++) {
                    const denomination = usableDenominations[i];
                    if (remaining >= denomination) {
                        // 選擇使用這個面額
                        currentCombination[denomination] = (currentCombination[denomination] || 0) + 1;
                        
                        // 繼續搜索
                        backtrack(remaining - denomination, currentCombination, i);
                        
                        // 回溯
                        currentCombination[denomination]--;
                        if (currentCombination[denomination] === 0) {
                            delete currentCombination[denomination];
                        }
                    }
                }
            };
            
            // 🔧 開始回溯搜索組合（不強制初始化）
            Game.Debug.log('state', `🔍 開始搜索所有可能的組合`);
            backtrack(amount, {}, 0);
            
            Game.Debug.log('state', `✅ 找到 ${allCombinations.length} 種硬幣組合方式${allCombinations.length >= MAX_COMBINATIONS ? '（已達上限）' : ''}`);
            
            if (allCombinations.length <= 5) {
                Game.Debug.log('wallet', '所有組合詳細:', allCombinations);
            } else {
                Game.Debug.log('wallet', '組合範例:', allCombinations.slice(0, 3));
                Game.Debug.log('wallet', `... 還有 ${allCombinations.length - 3} 種組合`);
            }
            
            // 🆕 驗證：確保每個組合都包含所有面額
            const invalidCombinations = allCombinations.filter(combo => {
                const usedDenoms = Object.keys(combo).map(d => parseInt(d));
                return !denominations.every(denom => usedDenoms.includes(denom));
            });
            
            if (invalidCombinations.length > 0) {
                Game.Debug.error(`❌ 發現 ${invalidCombinations.length} 個無效組合（未包含所有面額）`);
            }
            
            return allCombinations;
        },

        // =====================================================
        // 🆕 自訂金額模式專用價格生成函數
        // =====================================================
        generateItemPriceForCustomAmount(customAmount, strategy, selectedItemTypes) {
            Game.Debug.log('wallet', `💰 為自訂金額 ${customAmount}元 生成物品價格 (策略: ${strategy})`);
            
            // 獲取選定物品類型的價格範圍
            const allValidPrices = [];
            
            selectedItemTypes.forEach(typeKey => {
                const items = this.gameData.purchaseItems[typeKey];
                if (items && items.length > 0) {
                    items.forEach(item => {
                        const minPrice = Math.max(1, item.priceRange[0]);
                        const maxPrice = Math.min(9999, item.priceRange[1]);
                        
                        // 🎯 [配置驅動] 使用增強型價格生成策略
                        const difficulty = this.state.settings.difficulty;
                        if (difficulty && this.PriceStrategy) {
                            // 使用新的增強型價格生成
                            const enhancedPrice = this.PriceStrategy.generateEnhancedPrice(item, difficulty);
                            allValidPrices.push(enhancedPrice);
                            Game.Debug.log('state', `🎯 [增強價格] ${item.name}: 原範圍[${item.priceRange[0]}-${item.priceRange[1]}] → 生成價格${enhancedPrice}元`);
                        } else {
                            // 後備方案：使用原始價格範圍
                            for (let price = minPrice; price <= maxPrice; price++) {
                                allValidPrices.push(price);
                            }
                        }
                    });
                }
            });
            
            if (allValidPrices.length === 0) {
                Game.Debug.error('❌ 沒有可用的物品價格');
                return null;
            }
            
            // 移除重複價格並排序
            const uniquePrices = [...new Set(allValidPrices)].sort((a, b) => a - b);
            Game.Debug.log('state', `📊 可用價格範圍: ${uniquePrices[0]}-${uniquePrices[uniquePrices.length - 1]}元 (共${uniquePrices.length}個價格)`);
            
            let candidatePrices = [];
            
            switch (strategy) {
                case 'sufficient':
                    // 足夠策略：價格等於或小於自訂金額
                    candidatePrices = uniquePrices.filter(price => price <= customAmount);
                    Game.Debug.log('wallet', `💰 足夠策略：選擇 ≤${customAmount}元 的價格`);
                    break;
                    
                case 'insufficient':
                    // 不足策略：價格大於自訂金額
                    candidatePrices = uniquePrices.filter(price => price > customAmount);
                    Game.Debug.log('change', `💸 不足策略：選擇 >${customAmount}元 的價格`);
                    break;
                    
                case 'exact':
                    // 精確策略：價格等於自訂金額（如果可能）
                    candidatePrices = uniquePrices.filter(price => price === customAmount);
                    if (candidatePrices.length === 0) {
                        // 沒有精確價格，退而選擇接近的價格
                        candidatePrices = uniquePrices.filter(price => Math.abs(price - customAmount) <= 2);
                        Game.Debug.log('wallet', `💰 精確策略：無精確價格，選擇接近 ${customAmount}元 的價格`);
                    } else {
                        Game.Debug.log('wallet', `💰 精確策略：選擇等於 ${customAmount}元 的價格`);
                    }
                    break;
                    
                default:
                    candidatePrices = uniquePrices;
                    Game.Debug.log('wallet', `💰 預設策略：選擇所有可用價格`);
                    break;
            }
            
            if (candidatePrices.length === 0) {
                Game.Debug.warn('question', `⚠️ 策略 ${strategy} 沒有合適的價格，使用隨機價格`);
                candidatePrices = uniquePrices;
            }
            
            const selectedPrice = candidatePrices[Math.floor(Math.random() * candidatePrices.length)];
            Game.Debug.log('state', `✅ 生成物品價格: ${selectedPrice}元 (從 ${candidatePrices.length} 個候選價格中選擇)`);
            
            return selectedPrice;
        },

        // 廢棄的舊函數（保留以防止錯誤，但不再使用）
        generateSufficientMoney(targetPrice, denominations, minMultiplier = 1.0, maxMultiplier = 2.0) {
            Game.Debug.warn('state', '⚠️ generateSufficientMoney 已廢棄，請使用新的面額優先邏輯');
            // 臨時兼容，實際應該在新邏輯中處理
            const actualTotal = Math.floor(targetPrice * (minMultiplier + Math.random() * (maxMultiplier - minMultiplier)));
            return this.generateMoneyByAmount(actualTotal, denominations);
        },

        generateInsufficientMoney(targetPrice, denominations) {
            Game.Debug.warn('state', '⚠️ generateInsufficientMoney 已廢棄，請使用新的面額優先邏輯');
            // 臨時兼容，實際應該在新邏輯中處理  
            const insufficientTotal = Math.floor(targetPrice * (0.3 + Math.random() * 0.6));
            return this.generateMoneyByAmount(insufficientTotal, denominations);
        },

        // 生成指定金額的錢幣組合
        generateMoneyToAmount(totalAmount, denominations) {
            Game.Debug.log('wallet', `💰 generateMoneyToAmount 目標金額: ${totalAmount}, 可用面額: [${denominations.join(', ')}]`);
            
            const availableDenominations = [...denominations].sort((a, b) => b - a);
            let remainingAmount = totalAmount;
            let result = [];
            let attempts = 0;
            const maxAttempts = 100;

            // greedy algorithm to generate money combination
            while (remainingAmount > 0 && availableDenominations.length > 0 && attempts < maxAttempts) {
                attempts++;
                
                // 找到所有可用的面額
                const usableDenominations = availableDenominations.filter(d => d <= remainingAmount);
                
                if (usableDenominations.length === 0) {
                    Game.Debug.warn('state', `⚠️ 無法完全匹配目標金額 ${totalAmount}，剩餘 ${remainingAmount}`);
                    
                    // 如果是生成不足金額的情況，且結果為空，返回空陣列是合理的（代表沒給錢）
                    if (result.length === 0 && totalAmount < Math.min(...denominations)) {
                        Game.Debug.log('change', `💸 目標金額 ${totalAmount} 小於最小面額，返回空陣列（沒給錢）`);
                        return []; // 這是合法的不足場景
                    }
                    
                    // 其他情況返回部分結果
                    Game.Debug.log('state', `📝 返回部分結果`);
                    break;
                }
                
                const denomination = usableDenominations[Math.floor(Math.random() * usableDenominations.length)];
                const itemData = this.getItemData(denomination);
                
                if (itemData) {
                    result.push({
                        id: `money-${Date.now()}-${Math.random()}-${attempts}`,
                        value: denomination,
                        image: this.getRandomImage(itemData)
                    });
                    remainingAmount -= denomination;
                    Game.Debug.log('state', `➕ 添加面額 ${denomination}，剩餘金額: ${remainingAmount}`);
                } else {
                    Game.Debug.error(`❌ 找不到面額 ${denomination} 的資料`);
                }
                
                // 防止無限循環
                if (result.length > 20) {
                    Game.Debug.warn('state', '⚠️ 達到最大錢幣數量限制，停止生成');
                    break;
                }
            }

            const actualTotal = result.reduce((sum, money) => sum + money.value, 0);
            Game.Debug.log('state', `✅ 生成完成: 目標 ${totalAmount}，實際 ${actualTotal}，錢幣數量 ${result.length}`);
            
            return result;
        },

        startQuiz() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            Game.Debug.log('state', '🎮 startQuiz() 開始測驗');
            Game.Debug.log('state', '📋 當前遊戲設定:', JSON.stringify(this.state.settings, null, 2));

            // 🔧 [重構] 使用統一重置函數
            this.resetGameState();

            // 🎯 [配置驅動] 重設動態價格系統
            if (this.PriceStrategy) {
                this.PriceStrategy.resetSession();
                Game.Debug.log('state', '🎯 [C6-找零] 已為', this.state.settings.difficulty, '難度重設價格');
            }

            // 驗證設定完整性
            const { walletAmount, itemTypes, difficulty, mode } = this.state.settings;
            const validationChecks = {
                walletAmount: {
                    value: walletAmount,
                    valid: !!walletAmount && (
                        [10, 50, 100, 500, 1000].includes(walletAmount) ||
                        walletAmount === 'random' ||
                        (walletAmount === 'custom' && this.state.settings.customWalletAmount > 0)
                    )
                },
                difficulty: { value: difficulty, valid: ['easy', 'normal', 'hard'].includes(difficulty) },
                mode: { value: mode, valid: difficulty === 'easy' || ['repeated', 'single'].includes(mode) }
            };

            Game.Debug.log('state', '🔍 設定驗證檢查:', validationChecks);

            const validationFailed = Object.entries(validationChecks).find(([key, check]) => !check.valid);
            if (validationFailed) {
                Game.Debug.error(`❌ 設定驗證失敗: ${validationFailed[0]}`, validationFailed[1]);
                this.showGenerationErrorMessage();
                this.showSettings();
                return;
            }

            // 設置測驗開始狀態
            this.state.quiz.currentQuestion = 1;
            this.state.quiz.totalQuestions = this.state.settings.questionCount;
            this.state.quiz.startTime = Date.now();
            window.LearningTracker?.resetWrong?.();   // 學習紀錄：錯誤/逐題計數歸零

            Game.Debug.log('state', '🎯 測驗狀態初始化:', this.state.quiz);

            Game.Debug.log('ui', '📝 開始生成題目...');
            const generationStart = performance.now();
            
            // 生成所有題目
            for (let i = 0; i < this.state.quiz.totalQuestions; i++) {
                Game.Debug.log('state', `🔄 正在生成第 ${i+1} 題...`);
                const questionStart = performance.now();

                let question = null;
                let attempts = 0;
                const maxAttempts = 50; // 最多嘗試50次避免無限循環

                // 🔧 [修正] 重複生成直到獲得不重複的題目
                while (!question && attempts < maxAttempts) {
                    attempts++;
                    const candidateQuestion = this.generateQuestion();

                    if (candidateQuestion) {
                        // 檢查是否與前一題重複
                        const isDuplicate = this.isDuplicateQuestion(candidateQuestion, this.state.quiz.questions);

                        if (!isDuplicate) {
                            question = candidateQuestion;
                        } else {
                            Game.Debug.log('state', `🔄 第 ${i+1} 題與前題重複，重新生成 (嘗試 ${attempts}/${maxAttempts})`);
                        }
                    }
                }

                const questionTime = performance.now() - questionStart;

                if (question) {
                    this.state.quiz.questions.push(question);
                    Game.Debug.log('state', `✅ 第 ${i+1} 題生成成功 (耗時: ${questionTime.toFixed(2)}ms, 嘗試次數: ${attempts}):`, {
                        item: question.item.name,
                        itemPrice: question.itemPrice,
                        walletAmount: question.walletAmount,
                        changeAmount: question.changeAmount,
                        walletCoinsCount: question.walletCoins.length,
                        changeCoinsCount: question.changeCoins.length
                    });
                } else {
                    Game.Debug.error(`❌ 第 ${i+1} 題生成失敗 (已嘗試 ${maxAttempts} 次)`);
                    this.showGenerationErrorMessage();
                    this.showSettings();
                    return;
                }
            }
            
            const totalGenerationTime = performance.now() - generationStart;
            Game.Debug.log('state', `📊 題目生成完成統計:`, {
                totalQuestions: this.state.quiz.questions.length,
                totalTime: `${totalGenerationTime.toFixed(2)}ms`,
                averageTime: `${(totalGenerationTime / this.state.quiz.totalQuestions).toFixed(2)}ms`,
                difficulty: difficulty,
                settings: { walletAmount, itemTypes: itemTypes.length }
            });

            Game.Debug.log('init', '🚀 準備載入第一題...');
            this.loadQuestion(0);
            if (this.state.settings.difficulty === 'easy' && this.state.settings.assistClick) {
                AssistClick.activate();
            }
        },

        // 載入題目
        loadQuestion(questionIndex) {
            Game.Debug.log('question', `📖 loadQuestion(${questionIndex}) 開始載入題目`);
            Game.Debug.log('state', `📊 載入進度: ${questionIndex + 1}/${this.state.quiz.questions.length}`);
            
            if (questionIndex >= this.state.quiz.questions.length) {
                Game.Debug.log('state', '🏁 所有題目已完成，準備顯示結果');
                Game.Debug.log('state', `📈 最終統計: 總題數 ${this.state.quiz.questions.length}, 當前分數 ${this.state.quiz.score}`);
                this.showResults();
                return;
            }

            this.state.loadingQuestion = true;
            this.state.quiz.currentQuestion = questionIndex + 1;

            const question = this.state.quiz.questions[questionIndex];
            const { difficulty } = this.state.settings;
            
            Game.Debug.log('state', `🎯 載入第 ${questionIndex + 1} 題, 難度: ${difficulty}`);
            Game.Debug.log('question', `📝 題目詳情:`, {
                questionIndex: questionIndex + 1,
                item: question.item.name,
                emoji: question.item.emoji,
                itemPrice: question.itemPrice,
                walletAmount: question.walletAmount,
                walletCoins: question.walletCoins.length,
                changeAmount: question.changeAmount,
                changeCoins: question.changeCoins.length,
                step: question.step,
                difficulty: difficulty
            });

            // 先根據難度渲染對應模式
            const renderStart = performance.now();
            try {
                switch (difficulty) {
                    case 'easy':
                        Game.Debug.log('ui', '🟢 開始渲染簡單模式');
                        this.renderEasyMode(question);
                        break;
                    case 'normal':
                        Game.Debug.log('ui', '🟡 開始渲染普通模式');
                        this.renderNormalMode(question);
                        break;
                    case 'hard':
                        Game.Debug.log('ui', '🔴 開始渲染困難模式');
                        this.renderHardMode(question);
                        break;
                    default:
                        Game.Debug.error(`❌ 未知的難度模式: ${difficulty}`);
                        return;
                }
                
                const renderTime = performance.now() - renderStart;
                Game.Debug.log('state', `✅ 渲染完成 (耗時: ${renderTime.toFixed(2)}ms)`);
                
                // 驗證DOM元素是否正確創建
                const verification = this.verifyDOMElements();
                Game.Debug.log('state', '🔍 DOM元素驗證結果:', verification);
                
            } catch (error) {
                Game.Debug.error('❌ 渲染失敗:', error);
                Game.Debug.error('堆疊追蹤:', error.stack);
                return;
            }
            
            this.state.loadingQuestion = false;
            Game.Debug.log('init', '📱 載入狀態已更新為 false');

            // 然後顯示題目指令彈窗
            Game.TimerManager.setTimeout(() => {
                Game.Debug.log('ui', '💬 準備顯示指令彈窗');
                this.showInstructionModal(question);
            }, 100);
        },

        // =====================================================
        // 遊戲模式渲染系統（分離架構）
        // =====================================================
        
        // 簡單模式：錢一定夠，引導學生拿出正確金額
        renderEasyMode(question) {
            Game.Debug.log('ui', '🎨 [C6-簡單模式] 開始渲染付款確認頁面');
            const gameContainer = document.getElementById('app');
            const { item, itemPrice, walletCoins, paymentHint, step } = question;

            Game.Debug.log('question', `📝 題目資訊: ${item.name} ${item.emoji} - ${itemPrice}元`);
            Game.Debug.log('wallet', `💰 錢包金錢數量: ${walletCoins.length}個`);
            Game.Debug.log('hint', `💡 付款提示數量: ${paymentHint.length}個`);

            // 獲取難度設定
            const difficulty = this.state.settings.difficulty;

            // 生成錢包金錢 HTML
            const walletHTML = walletCoins.map((money, index) => {
                const isBanknote = money.value >= 100;
                const itemClass = isBanknote ? 'money-item banknote wallet-money' : 'money-item coin wallet-money';
                return `
                    <div class="${itemClass}" draggable="true"
                         data-value="${money.value}"
                         data-index="${index}"
                         id="wallet-money-${index}">
                        <img src="${money.image}" alt="${money.value}元" draggable="false" />
                        <div class="money-value">${money.value}元</div>
                    </div>
                `;
            }).join('');

            // 生成付款提示 HTML (淡化顯示) - A4 風格
            const paymentHintHTML = paymentHint.map((money, index) => {
                const isBanknote = money.value >= 100;
                const itemClass = isBanknote ? 'money-item banknote hint-money faded' : 'money-item coin hint-money faded';
                return `
                    <div class="${itemClass}"
                         data-value="${money.value}"
                         id="hint-money-${index}">
                        <img src="${money.image}" alt="${money.value}元" draggable="false" />
                        <div class="money-value">${money.value}元</div>
                    </div>
                `;
            }).join('');

            this.state.gameState = {
                question: question,
                currentStep: step,  // 1=付款確認, 2=找零驗證
                paymentTotal: 0,    // 付款區已放金額
                placedMoney: [],    // 付款區已放的金錢
                questionAnswered: false
            };

            gameContainer.innerHTML = `
                <style>${this.getCommonCSS()}${this.getC6EasyModeCSS()}</style>
                <div class="c6-easy-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">第 ${this.state.quiz.currentQuestion} / ${this.state.quiz.totalQuestions} 題</div>
                        <div class="title-bar-center">
                            <h2 style="margin: 0; color: inherit;">單元C6：找零與計算</h2>
                        </div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button id="back-to-menu-btn" class="back-to-menu-btn">返回設定</button>
                        </div>
                    </div>

                    <div class="c6-step1-container">
                        <!-- 商品資訊 + 付款區（整合卡片） -->
                        <div class="item-payment-section">
                            <div class="ip-title-row">
                                <h2 class="section-title" style="margin:0;">🛍️ 商品付款</h2>
                                ${difficulty === 'hard' ? '<div style="display:flex;align-items:center;gap:6px;"><img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;"><button class="hint-btn" id="c6-payment-hint-btn" style="font-size:14px;padding:8px 16px;">💡 提示</button></div>' : ''}
                            </div>
                            <div class="item-info-compact">
                                <span class="iic-img">${this.getItemImg(item, '180px')}</span>
                                <span class="iic-name">${item.name}</span>
                                <span class="iic-price">${itemPrice} 元</span><button class="quiz-speak-btn" onclick="event.stopPropagation();Game.speakQuestion()" title="朗讀題目">🔊</button>
                                <span class="iic-paid">已付: <span id="payment-total">0</span> 元</span>
                            </div>
                            <div id="payment-drop-zone" class="drop-zone">
                                <div id="payment-money-container" class="payment-overlay">${paymentHintHTML}</div>
                            </div>
                            <button class="c6-confirm-btn" id="c6-confirm-payment" ${difficulty === 'hard' ? '' : 'disabled'}>確認付款</button>
                        </div>

                        <!-- 我的錢包 -->
                        <div class="wallet-section">
                            <h2 class="section-title">💰 我的錢包</h2>
                            <div id="wallet-container" class="wallet-container">
                                ${walletHTML}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            Game.Debug.log('state', '✅ [C6-簡單模式] HTML 渲染完成');
            this.setupC6Step1EventListeners(question);
        },

        // 普通模式：步驟1同簡單模式（付款確認），步驟2改為選擇題
        renderNormalMode(question) {
            Game.Debug.log('ui', '🎨 [C6-普通模式] 開始渲染付款確認頁面');
            const gameContainer = document.getElementById('app');
            const { item, itemPrice, walletCoins, paymentHint, step } = question;

            Game.Debug.log('question', `📝 題目資訊: ${item.name} ${item.emoji} - ${itemPrice}元`);
            Game.Debug.log('wallet', `💰 錢包金錢數量: ${walletCoins.length}個`);
            Game.Debug.log('hint', `💡 付款提示數量: ${paymentHint.length}個`);

            // 獲取難度設定
            const difficulty = this.state.settings.difficulty;

            // 生成錢包金錢 HTML
            const walletHTML = walletCoins.map((money, index) => {
                const isBanknote = money.value >= 100;
                const itemClass = isBanknote ? 'money-item banknote wallet-money' : 'money-item coin wallet-money';
                return `
                    <div class="${itemClass}" draggable="true"
                         data-value="${money.value}"
                         data-index="${index}"
                         id="wallet-money-${index}">
                        <img src="${money.image}" alt="${money.value}元" draggable="false" />
                        <div class="money-value">${money.value}元</div>
                    </div>
                `;
            }).join('');

            // 🔧 [修正] 普通/困難模式：不顯示淡化金錢圖示（與 A4 一致）
            // 只計算最佳付款方案供提示按鈕使用，不在付款區顯示淡化圖示
            const optimalPayment = this.calculateOptimalPayment(itemPrice, walletCoins);
            Game.Debug.log('hint', '💡 [普通/困難模式] 最佳付款方案（供提示用）:', optimalPayment);

            // 🔧 [修正] 普通/困難模式：付款區不顯示淡化提示，只顯示「拖曳金錢到這裡」提示文字
            // A4 風格：直接拖放金錢到付款區，不需對準淡化圖示

            this.state.gameState = {
                question: question,
                currentStep: step,  // 1=付款確認, 2=找零驗證
                paymentTotal: 0,    // 付款區已放金額
                placedMoney: [],    // 付款區已放的金錢
                questionAnswered: false,
                optimalPayment: optimalPayment,  // 🔧 [新增] 最佳付款方案（供提示按鈕使用）
                lastDroppedMoney: null  // 🔧 [新增] 追蹤最後放置的金錢（供語音使用）
            };

            gameContainer.innerHTML = `
                <style>${this.getCommonCSS()}${this.getC6EasyModeCSS()}</style>
                <div class="c6-easy-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">第 ${this.state.quiz.currentQuestion} / ${this.state.quiz.totalQuestions} 題</div>
                        <div class="title-bar-center">
                            <h2 style="margin: 0; color: inherit;">單元C6：找零與計算</h2>
                        </div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button id="back-to-menu-btn" class="back-to-menu-btn">返回設定</button>
                        </div>
                    </div>

                    <div class="c6-step1-container">
                        <!-- 商品資訊 + 付款區（整合卡片） -->
                        <div class="item-payment-section">
                            <div class="ip-title-row">
                                <h2 class="section-title" style="margin:0;">🛍️ 商品付款</h2>
                                <div style="display:flex;align-items:center;gap:6px;"><img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;"><button class="hint-btn" id="c6-payment-hint-btn" style="font-size:14px;padding:8px 16px;">💡 提示</button></div>
                            </div>
                            <div class="item-info-compact">
                                <span class="iic-img">${this.getItemImg(item, '180px')}</span>
                                <span class="iic-name">${item.name}</span>
                                <span class="iic-price">${itemPrice} 元</span><button class="quiz-speak-btn" onclick="event.stopPropagation();Game.speakQuestion()" title="朗讀題目">🔊</button>
                                <div id="payment-info-display" style="display:none; width:100%; justify-content:center; align-items:center;"><span class="iic-paid">已付: <span id="payment-total">${difficulty === 'hard' ? '???' : '0'}</span> 元</span></div>
                            </div>
                            <div id="payment-drop-zone" class="drop-zone">
                                <div id="payment-money-container" class="payment-overlay">
                                    <div id="payment-hint" class="payment-placeholder" style="color: #999; font-size: 1.1em; padding: 20px;">
                                        將錢幣拖曳到這裡付款
                                    </div>
                                </div>
                            </div>
                            <button class="c6-confirm-btn" id="c6-confirm-payment" ${difficulty === 'hard' ? '' : 'disabled'}>確認付款</button>
                        </div>

                        <!-- 我的錢包 -->
                        <div class="wallet-section">
                            <h2 class="section-title">💰 我的錢包</h2>
                            <div id="wallet-container" class="wallet-container">
                                ${walletHTML}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            Game.Debug.log('state', '✅ [C6-普通模式] HTML 渲染完成');
            this.setupC6Step1EventListeners(question);
        },

        // 🔧 [C6困難模式] 步驟1與普通模式相同，步驟2增加計算彈窗
        renderHardMode(question) {
            Game.Debug.log('ui', '🎨 [C6-困難模式] 開始渲染付款確認頁面');
            // C6困難模式的步驟1與普通模式完全相同
            // 只是在進入步驟2時會先顯示計算彈窗
            this.renderNormalMode(question);
        },

        // 指令彈窗
        // 朗讀題目（🔊 按鈕用）
        speakQuestion() {
            const question = this.state.gameState && this.state.gameState.question;
            if (!question) return;
            const { item, itemPrice } = question;
            this.speech.speak(`購買物品，${item.name}共${itemPrice}元，請付錢`, { interrupt: true });
        },

        showInstructionModal(question) {
            const { item, itemPrice } = question;
            const { difficulty } = this.state.settings;

            // 🔊 C6 統一語音：「購買物品，×共×元，請付錢」
            const instructionText = `購買物品，${item.name}共${itemPrice}元，請付錢`;

            // 創建彈窗（參考unit4）
            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'c6-instruction-overlay';
            modalOverlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0, 0, 0, 0.75);
                display: flex; align-items: center; justify-content: center;
                z-index: 2000; opacity: 0; transition: opacity 0.3s;
            `;

            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: linear-gradient(135deg, #34495e, #2c3e50);
                padding: 40px 50px; border-radius: 15px; text-align: center;
                color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                transform: scale(0.8); transition: transform 0.3s;
            `;

            modalContent.innerHTML = `
                <h2 style="font-size: 2.2em; margin: 0 0 20px 0; color: #f1c40f;">購買的物品</h2>
                <div style="font-size: 1.5em; margin: 20px 0; display: flex; flex-direction: column; align-items: center;">
                    ${this.getSmallItemDisplay(item)}
                    <div style="font-weight: bold;">${item.name} - ${itemPrice}元</div>
                </div>
            `;

            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);

            // 語音播報並關閉彈窗
            this.speech.speak(instructionText, {
                callback: () => {
                    // 🔧 語音播放完畢後立即關閉彈窗（不延遲）
                    modalOverlay.style.opacity = '0';
                    Game.TimerManager.setTimeout(() => {
                        if (document.body.contains(modalOverlay)) {
                            document.body.removeChild(modalOverlay);
                        }
                    }, 300); // 只保留淡出動畫時間
                }
            });

            // 淡入動畫
            Game.TimerManager.setTimeout(() => {
                modalOverlay.style.opacity = '1';
                modalContent.style.transform = 'scale(1)';
            }, 10);
        },

        // 下一題
        nextQuestion() {
            Game.Debug.log('state', '➡️ nextQuestion() 準備載入下一題');

            // 🔧 [修正] 清除任何殘留的訊息視窗
            this.clearAllMessages();

            if (this.state.loadingQuestion) {
                Game.Debug.log('state', '⏳ 題目載入中，忽略下一題請求');
                return;
            }
            
            const currentIndex = this.state.quiz.currentQuestion - 1;
            const nextIndex = this.state.quiz.currentQuestion;
            
            Game.Debug.log('state', '📋 下一題準備:', {
                currentQuestionNumber: this.state.quiz.currentQuestion,
                currentIndex,
                nextIndex,
                totalQuestions: this.state.quiz.totalQuestions,
                score: this.state.quiz.score,
                attempts: this.state.quiz.attempts
            });
            
            // 檢查是否還有更多題目
            if (nextIndex >= this.state.quiz.questions.length) {
                Game.Debug.log('state', '🏁 已到達最後一題，準備顯示結果');
                this.showResults();
                return;
            }
            
            Game.Debug.log('state', `🔄 載入第 ${nextIndex + 1} 題...`);
            this.loadQuestion(nextIndex);
        },

        // 🔧 [修正] 檢查題目是否與之前的題目重複
        isDuplicateQuestion(newQuestion, existingQuestions) {
            if (!existingQuestions || existingQuestions.length === 0) {
                return false; // 如果沒有現有題目，不算重複
            }

            // 🔧 [修正] 檢查所有已出現的題目（不只最近1題）
            return existingQuestions.some(existing => {
                // 物品名稱相同 = 重複
                const sameItem = existing.item.name === newQuestion.item.name;
                // 價格相同 = 重複
                const samePrice = existing.itemPrice === newQuestion.itemPrice;

                // 🔧 [修正] 物品或價格相同即算重複
                const isDuplicate = sameItem || samePrice;

                if (isDuplicate) {
                    Game.Debug.log('state', '🔍 [C6] 發現重複:', {
                        reason: sameItem ? '物品相同' : '價格相同',
                        existing: { item: existing.item.name, price: existing.itemPrice },
                        new: { item: newQuestion.item.name, price: newQuestion.itemPrice }
                    });
                }

                return isDuplicate;
            });
        },

        // 🔧 [修正] 清除所有現有的訊息視窗
        clearAllMessages() {
            const existingMessages = document.querySelectorAll('.game-message');
            existingMessages.forEach(msg => {
                if (msg.parentNode) {
                    msg.parentNode.removeChild(msg);
                }
            });
        },

        // 顯示訊息
        showMessage(text, type, callback = null) {
            // 🔧 [修正] 清除所有現有的訊息視窗，防止重疊
            this.clearAllMessages();

            const message = document.createElement('div');
            message.classList.add('game-message'); // 添加識別類名
            
            // 添加emoji圖標
            const emoji = type === 'success' ? '✅' : '❌';
            const messageContent = document.createElement('div');
            messageContent.innerHTML = `
                <div style="font-size: 2em; margin-bottom: 10px;">${emoji}</div>
                <div>${text}</div>
            `;
            
            message.appendChild(messageContent);
            message.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: ${type === 'success' ? 
                    'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' : 
                    'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'};
                color: white; 
                padding: 30px; 
                border-radius: 20px;
                font-size: 1.3em; 
                z-index: 1000; 
                box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                text-align: center;
                font-weight: bold;
                min-width: 300px;
                border: 3px solid ${type === 'success' ? '#27ae60' : '#c0392b'};
                animation: messageSlideIn 0.3s ease-out;
            `;
            
            // @keyframes messageSlideIn, messageSlideOut - moved to injectGlobalAnimationStyles()

            document.body.appendChild(message);
            
            // 如果有callback，使用callback來控制消失時機，否則使用默認2秒
            if (callback) {
                callback(() => {
                    message.style.animation = 'messageSlideOut 0.3s ease-in';
                    Game.TimerManager.setTimeout(() => {
                        if (message.parentNode) {
                            document.body.removeChild(message);
                        }
                    }, 300);
                });
            } else {
                Game.TimerManager.setTimeout(() => {
                    message.style.animation = 'messageSlideOut 0.3s ease-in';
                    Game.TimerManager.setTimeout(() => {
                        if (message.parentNode) {
                            document.body.removeChild(message);
                        }
                    }, 300);
                }, 2000);
            }
        },

        // 顯示結果（參考unit4）
        showResults() {
            if (this.state.gameCompleted) {
                Game.Debug.log('state', '⚠️ showResults 已執行過，忽略重複呼叫');
                return;
            }
            this.state.gameCompleted = true;
            AssistClick.deactivate();
            const { score, totalQuestions } = this.state.quiz;
            const percentage = Math.round((score / 10 / totalQuestions) * 100);

            // 直接顯示結果視窗 + 語音播報（取消全屏烟火）
            this.displayResultsWindow();
            Game.TimerManager.setTimeout(() => {
                this.speakResults(score, totalQuestions, percentage);
            }, 1000);
        },

        // 全屏煙火動畫（繼承unit4）
        startFullscreenFireworks(callback) {
            Game.Debug.log('ui', '開始全屏煙火動畫');
            
            const gameContainer = document.getElementById('app');
            gameContainer.innerHTML = '';
            
            const canvas = document.createElement('canvas');
            canvas.id = 'fullscreen-fireworks-canvas';
            canvas.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                z-index: 9999; background: linear-gradient(135deg, #1e3c72, #2a5298, #1a1a2e);
                pointer-events: none;
            `;
            document.body.appendChild(canvas);
            
            this.audio.playSuccessSound();
            
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const fireworks = [];
            let animationId;
            
            class Firework {
                constructor(x, y) {
                    this.x = x;
                    this.y = y;
                    this.particles = [];
                    this.hue = Math.random() * 360;
                    this.createParticles();
                }
                
                createParticles() {
                    for (let i = 0; i < 50; i++) {
                        this.particles.push(new Particle(this.x, this.y, this.hue));
                    }
                }
                
                update() {
                    this.particles.forEach((particle, index) => {
                        particle.update();
                        if (particle.alpha <= 0) {
                            this.particles.splice(index, 1);
                        }
                    });
                }
                
                draw(ctx) {
                    this.particles.forEach(particle => particle.draw(ctx));
                }
            }
            
            class Particle {
                constructor(x, y, hue) {
                    this.x = x;
                    this.y = y;
                    this.vx = (Math.random() - 0.5) * 8;
                    this.vy = (Math.random() - 0.5) * 8;
                    this.alpha = 1;
                    this.decay = Math.random() * 0.03 + 0.01;
                    this.hue = hue + (Math.random() - 0.5) * 30;
                    this.size = Math.random() * 3 + 1;
                }
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vy += 0.1;
                    this.alpha -= this.decay;
                }
                
                draw(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.alpha;
                    ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
            
            function animate() {
                ctx.fillStyle = 'rgba(30, 60, 114, 0.1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                if (Math.random() < 0.3) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height * 0.6;
                    fireworks.push(new Firework(x, y));
                }
                
                fireworks.forEach((firework, index) => {
                    firework.update();
                    firework.draw(ctx);
                    
                    if (firework.particles.length === 0) {
                        fireworks.splice(index, 1);
                    }
                });
                
                animationId = requestAnimationFrame(animate);
            }
            
            animate();
            
            Game.TimerManager.setTimeout(() => {
                canvas.style.transition = 'opacity 1s';
                canvas.style.opacity = '0';
                
                Game.TimerManager.setTimeout(() => {
                    cancelAnimationFrame(animationId);
                    document.body.removeChild(canvas);
                    if (callback) callback();
                }, 1000);
            }, 3000);
        },

        // 顯示結果視窗
        displayResultsWindow() {
            const gameContainer = document.getElementById('app');
            const { score, totalQuestions, startTime } = this.state.quiz;

            const correctAnswers = score / 10;
            const percentage = Math.round((correctAnswers / totalQuestions) * 100);

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'c6', unitName: 'C6 找零與計算', series: 'C',
                score: correctAnswers, total: totalQuestions, difficulty: this.state.settings?.difficulty,
                durationSec: startTime ? Math.floor((Date.now() - startTime) / 1000) : 0 });

            // 計算完成時間
            const endTime = Date.now();
            const elapsedMs = startTime ? (endTime - startTime) : 0;
            const elapsedMinutes = Math.floor(elapsedMs / 60000);
            const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
            const timeDisplay = elapsedMinutes > 0
                ? `${elapsedMinutes} 分 ${elapsedSeconds} 秒`
                : `${elapsedSeconds} 秒`;

            let performanceMessage = '';
            let performanceIcon = '';
            if (percentage >= 90) {
                performanceMessage = '表現優異！';
                performanceIcon = '🏆';
            } else if (percentage >= 70) {
                performanceMessage = '表現良好！';
                performanceIcon = '👍';
            } else if (percentage >= 50) {
                performanceMessage = '還需努力！';
                performanceIcon = '💪';
            } else {
                performanceMessage = '多加練習！';
                performanceIcon = '📚';
            }

            gameContainer.innerHTML = `
                <div class="results-wrapper">
                <div class="results-screen">
                    <div class="results-header">
                        <div class="trophy-icon">🏆</div>
                        <div class="results-title-row">
                            <img src="../images/common/hint_detective.png" class="results-mascot-img" alt="金錢小助手">
                            <h1 class="results-title">🎉 測驗結束 🎉</h1>
                            <span class="results-mascot-spacer"></span>
                        </div>
                    </div>

                    <!-- 🎁 獎勵系統按鈕 -->
                    <div class="reward-btn-container">
                        <a href="#" id="completion-reward-link" class="reward-btn-link">
                            🎁 開啟獎勵系統
                        </a>
                    </div>

                    <div class="results-container">
                        <div class="results-grid">
                            <div class="result-card">
                                <div class="result-icon">✅</div>
                                <div class="result-label">答對題數</div>
                                <div class="result-value">${correctAnswers} / ${totalQuestions}</div>
                            </div>
                            <div class="result-card">
                                <div class="result-icon">📊</div>
                                <div class="result-label">正確率</div>
                                <div class="result-value">${percentage}%</div>
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
                            <div class="performance-badge">${performanceMessage}</div>
                        </div>

                        <!-- 學習成果描述 -->
                        <div class="learning-achievements">
                            <h3>🏆 學習成果</h3>
                            <div class="achievement-list">
                                <div class="achievement-item">🎯 理解找零計算原理</div>
                                <div class="achievement-item">💰 學會確認找零金額是否正確</div>
                                <div class="achievement-item">📝 掌握付款與找零的完整流程</div>
                            </div>
                        </div>

                        <div class="result-buttons">
                            <button class="play-again-btn" onclick="Game.startQuiz()">
                                <span class="btn-icon">🔄</span>
                                <span class="btn-text">再玩一次</span>
                            </button>
                            <button class="main-menu-btn" onclick="Game.init()">
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
                        align-items: center;
                        min-height: 100vh;
                        padding: 20px;
                        box-sizing: border-box;
                    }

                    /* @keyframes fadeIn, celebrate, bounce, glow - moved to injectGlobalAnimationStyles() */

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

                    .performance-badge {
                        display: inline-block;
                        background: linear-gradient(45deg, #f39c12, #e67e22);
                        color: white;
                        padding: 12px 30px;
                        border-radius: 25px;
                        font-size: 1.3em;
                        font-weight: bold;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                        animation: glow 2s ease-in-out infinite;
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
                        grid-template-columns: repeat(3, 1fr);
                        gap: 20px;
                        margin-bottom: 30px;
                    }

                    .result-card {
                        padding: 20px;
                        border-radius: 12px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                        border: 2px solid transparent;
                    }

                    .results-grid .result-card:nth-child(1) { background: linear-gradient(135deg, #27ae60, #2ecc71); }
                    .results-grid .result-card:nth-child(2) { background: linear-gradient(135deg, #2980b9, #3498db); }
                    .results-grid .result-card:nth-child(3) { background: linear-gradient(135deg, #e67e22, #f39c12); }

                    .result-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                        border-color: rgba(255,255,255,0.5);
                    }

                    .result-icon {
                        font-size: 2em;
                        margin-bottom: 10px;
                    }

                    .result-label {
                        font-size: 1em;
                        color: rgba(255,255,255,0.85);
                        margin-bottom: 8px;
                        font-weight: 500;
                    }

                    .result-value {
                        font-size: 1.6em;
                        font-weight: bold;
                        color: white;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
                    }

                    .performance-section {
                        background: #ffffff;
                        border: 1px solid #e0e0e0;
                        padding: 20px;
                        border-radius: 12px;
                        margin-bottom: 20px;
                        text-align: center;
                    }

                    .performance-section h3 {
                        color: #333333;
                        margin: 0 0 15px 0;
                        font-size: 1.2em;
                    }

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
                        transition: all 0.3s ease;
                        text-decoration: none;
                        min-width: 160px;
                        justify-content: center;
                    }

                    .play-again-btn {
                        background: linear-gradient(135deg, #27ae60, #2ecc71);
                        color: white;
                    }

                    .play-again-btn:hover {
                        background: linear-gradient(135deg, #2ecc71, #27ae60);
                        transform: translateY(-3px);
                        box-shadow: 0 8px 25px rgba(39, 174, 96, 0.3);
                    }

                    .main-menu-btn {
                        background: linear-gradient(135deg, #8e44ad, #9b59b6);
                        color: white;
                    }

                    .main-menu-btn:hover {
                        background: linear-gradient(135deg, #9b59b6, #8e44ad);
                        transform: translateY(-3px);
                        box-shadow: 0 8px 25px rgba(142, 68, 173, 0.3);
                    }

                    .btn-icon {
                        font-size: 1.2em;
                        animation: none !important;
                    }

                    .btn-text {
                        font-family: inherit;
                        animation: none !important;
                    }

                    @media (max-width: 600px) {
                        .results-wrapper {
                            padding: 10px;
                        }

                        .results-screen {
                            padding: 20px;
                        }

                        .results-title {
                            font-size: 2em;
                        }

                        .results-grid {
                            grid-template-columns: 1fr;
                            gap: 15px;
                        }

                        .result-buttons {
                            flex-direction: column;
                            align-items: center;
                        }

                        .play-again-btn, .main-menu-btn {
                            width: 100%;
                            max-width: 250px;
                        }
                    }
                </style>
            `;

            // 🎁 獎勵系統連結事件
            const completionRewardLink = document.getElementById('completion-reward-link');
            if (completionRewardLink) {
                Game.EventManager.on(completionRewardLink, 'click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                }, {}, 'gameUI');
            }

            // 播放成功音效和煙火
            Game.TimerManager.setTimeout(() => {
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
                        Game.TimerManager.setTimeout(fireConfetti, 250, 'confetti');
                    };
                    fireConfetti();
                }
            }, 100);
        },

        // 語音播報結果
        speakResults(score, totalQuestions, percentage) {
            const correctAnswers = score / 10;
            let performanceText = '';
            
            if (percentage >= 90) {
                performanceText = '你的表現優異';
            } else if (percentage >= 70) {
                performanceText = '你的表現良好';
            } else if (percentage >= 50) {
                performanceText = '你還需努力';
            } else {
                performanceText = '請你多加練習';
            }
            
            const speechText = `恭喜你完成全部測驗，答對${correctAnswers}題，${performanceText}`;
            this.speech.speak(speechText, { interrupt: true });
        },

        // =====================================================
        // 錯誤處理和工具函數
        // =====================================================
        
        showGenerationErrorMessage() {
            const modalOverlay = document.createElement('div');
            modalOverlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0, 0, 0, 0.75);
                display: flex; align-items: center; justify-content: center;
                z-index: 2000; opacity: 0; transition: opacity 0.3s;
            `;

            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                padding: 40px 50px; border-radius: 15px; text-align: center;
                color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                transform: scale(0.8); transition: transform 0.3s;
                border: 2px solid #ff6b6b; max-width: 500px;
            `;

            modalContent.innerHTML = `
                <h2 style="font-size: 2.2em; margin: 0 0 20px 0; color: #fff;">⚠️ 設定有問題</h2>
                <p style="font-size: 1.3em; margin: 0 0 20px 0; line-height: 1.5;">無法生成足夠的題目！<br>請嘗試以下調整：</p>
                <ul style="text-align: left; font-size: 1.1em; line-height: 1.6; margin: 0 0 20px 0;">
                    <li>選擇更多的錢幣面額</li>
                    <li>選擇更多的物品類型</li>
                    <li>調整價格位數設定</li>
                </ul>
                <p style="font-size: 1.1em; margin: 0; opacity: 0.9;">點擊任何地方重新設定</p>
            `;

            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);

            this.speech.speak('設定有問題，無法生成足夠的題目，請重新調整設定');

            const closeModal = () => {
                modalOverlay.style.opacity = '0';
                Game.TimerManager.setTimeout(() => {
                    if (document.body.contains(modalOverlay)) {
                        document.body.removeChild(modalOverlay);
                    }
                }, 300);
            };

            Game.EventManager.on(modalOverlay, 'click', closeModal, {}, 'gameUI');
            Game.TimerManager.setTimeout(() => {
                modalOverlay.style.opacity = '1';
                modalContent.style.transform = 'scale(1)';
            }, 10);

            Game.TimerManager.setTimeout(closeModal, 5000, 'ui');
        },


        // 工具函數（繼承unit4）
        getRandomImage(itemData) {
            return Math.random() < 0.5 ? itemData.images.front : itemData.images.back;
        },

        getItemData(value) {
            return this.gameData.allItems.find(item => item.value === value);
        },

        // 獲取物品圖片HTML（圖片優先，emoji fallback）
        getItemImg(item, size = '3em') {
            if (!item.img) return item.emoji;
            return `<img src="../images/c6/${item.img}.png"
                    style="width:${size};height:${size};object-fit:contain;vertical-align:middle;"
                    onerror="this.outerHTML='${item.emoji}'"
                    alt="${item.name}">`;
        },

        // 獲取物品圖片或emoji替代方案
        getItemDisplay(item) {
            const imgContent = this.getItemImg(item, '80px');
            return `
                <div class="item-display"
                     style="width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;
                            background: rgba(255,255,255,0.1); border-radius: 8px; font-size: 3em;">
                    <div class="item-emoji" title="${item.name}">${imgContent}</div>
                </div>
            `;
        },

        // 獲取小尺寸物品圖片或emoji替代方案（用於指令彈窗）
        getSmallItemDisplay(item) {
            const imgContent = this.getItemImg(item, '180px');
            return `
                <div class="small-item-display"
                     style="width: 180px; height: 180px; display: flex; align-items: center; justify-content: center;
                            background: rgba(255,255,255,0.1); border-radius: 8px; font-size: 2.5em; margin-bottom: 15px;">
                    <div class="small-item-emoji" title="${item.name}">${imgContent}</div>
                </div>
            `;
        },




        // 事件監聽器設定
        // =====================================================
        // C6 找零與計算 - 事件監聽
        // =====================================================
        setupC6Step1EventListeners(question) {
            Game.Debug.log('state', '🎯 [C6-步驟1] 設置事件監聽器');

            // 返回主選單按鈕
            const backBtn = document.getElementById('back-to-menu-btn');
            if (backBtn) {
                Game.EventManager.on(backBtn, 'click', () => {
                    Game.Debug.log('drag', '🔙 返回主選單');
                    this.showSettings();
                }, {}, 'gameUI');
            }

            // 確認付款按鈕
            const confirmBtn = document.getElementById('c6-confirm-payment');
            if (confirmBtn) {
                Game.EventManager.on(confirmBtn, 'click', () => {
                    Game.Debug.log('state', '🎯 [C6-步驟1] 點擊確認付款按鈕');
                    this.confirmC6Payment(question);
                }, {}, 'gameUI');
            }

            // 🔧 [修正] 普通/困難模式提示按鈕
            const hintBtn = document.getElementById('c6-payment-hint-btn');
            if (hintBtn) {
                Game.EventManager.on(hintBtn, 'click', () => {
                    Game.Debug.log('hint', '💡 [C6-步驟1] 點擊提示按鈕');
                    this.showC6PaymentHint(question);
                }, {}, 'gameUI');
            }

            // 設置拖放功能
            this.setupC6DragAndDrop(question);

            Game.Debug.log('state', '✅ [C6-步驟1] 事件監聽器設置完成');
        },

        setupC6DragAndDrop(question) {
            Game.Debug.log('state', '🎯 [C6-拖放] 初始化拖放系統');

            const walletContainer = document.getElementById('wallet-container');
            const paymentDropZone = document.getElementById('payment-drop-zone');
            const paymentMoneyContainer = document.getElementById('payment-money-container');

            if (!walletContainer || !paymentDropZone || !paymentMoneyContainer) {
                Game.Debug.error('❌ [C6-拖放] 找不到必要的容器元素');
                return;
            }

            // 錢包金錢拖放事件（桌面端）
            const walletMoney = walletContainer.querySelectorAll('.wallet-money');
            walletMoney.forEach(moneyEl => {
                Game.EventManager.on(moneyEl, 'dragstart', (e) => {
                    Game.Debug.log('drag', '🖱️ [拖放] 開始拖動:', moneyEl.dataset.value + '元');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', moneyEl.dataset.index);
                    moneyEl.classList.add('dragging');
                    this.audio.playSelectSound();

                    // 🆕 使用去背圖片作為拖曳預覽
                    const img = moneyEl.querySelector('img');
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
                        Game.TimerManager.setTimeout(() => dragImg.remove(), 0, 'ui');
                    }
                }, {}, 'dragSystem');

                Game.EventManager.on(moneyEl, 'dragend', (e) => {
                    moneyEl.classList.remove('dragging');
                }, {}, 'dragSystem');
            });

            // 🔧 [修改] 付款區拖放接收 - 實際移動金錢（與A4一致）
            Game.EventManager.on(paymentDropZone, 'dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                paymentDropZone.classList.add('drag-over');
            }, {}, 'dragSystem');

            Game.EventManager.on(paymentDropZone, 'dragleave', (e) => {
                if (e.target === paymentDropZone) {
                    paymentDropZone.classList.remove('drag-over');
                }
            }, {}, 'dragSystem');

            Game.EventManager.on(paymentDropZone, 'drop', (e) => {
                e.preventDefault();
                paymentDropZone.classList.remove('drag-over');

                const moneyIndex = e.dataTransfer.getData('text/plain');
                const moneyEl = document.getElementById(`wallet-money-${moneyIndex}`);

                if (moneyEl) {
                    const moneyValue = parseInt(moneyEl.dataset.value);
                    Game.Debug.log('wallet', '💳 [拖放] 放置金錢到付款區:', moneyValue + '元');

                    // 🔧 [修正] 移除綠色勾勾效果（如果有）
                    if (moneyEl.classList.contains('show-correct-tick')) {
                        moneyEl.classList.remove('show-correct-tick');
                        Game.Debug.log('state', '✅ [拖放] 已移除綠色勾勾效果');
                    }

                    const difficulty = this.state.settings.difficulty;

                    // 🔧 [修正] 簡單模式：點亮提示金錢（A4風格），普通/困難模式：移動金錢
                    if (difficulty === 'easy') {
                        // 簡單模式：找到對應的淡化提示金錢並點亮
                        const hintMoney = Array.from(paymentMoneyContainer.querySelectorAll('.hint-money.faded'))
                            .find(hint => parseInt(hint.dataset.value) === moneyValue && !hint.dataset.walletId);

                        if (hintMoney) {
                            Game.Debug.log('hint', '💡 [拖放] 找到對應提示金錢，點亮:', moneyValue + '元');
                            // 點亮提示金錢
                            hintMoney.classList.remove('faded');
                            hintMoney.classList.add('lit-up');
                            hintMoney.dataset.walletId = moneyEl.id;

                            // 隱藏錢包中的金錢
                            moneyEl.classList.add('hidden');

                            // 添加點擊移除功能
                            Game.EventManager.on(hintMoney, 'click', () => {
                                Game.Debug.log('drag', '🗑️ [付款] 移除金錢:', moneyValue + '元');
                                hintMoney.classList.remove('lit-up');
                                hintMoney.classList.add('faded');
                                delete hintMoney.dataset.walletId;
                                moneyEl.classList.remove('hidden');
                                this.updateC6Payment(question);
                            }, { once: true }, 'gameUI');

                            // 🔧 [新增] 記錄最後放置的金錢並更新
                            this.state.gameState.lastDroppedMoney = moneyValue;

                            this.audio.playDropSound();
                            this.updateC6Payment(question);

                            // 🔧 [新增] 簡單模式語音回饋（A4 風格）
                            const droppedSpeech = this.speech.convertToTraditionalCurrency(moneyValue);
                            this.speech.speak(`放入${droppedSpeech}`, { interrupt: true });
                        } else {
                            // 🔧 [修正] 沒有對應提示時播放錯誤音效和語音
                            Game.Debug.warn('state', '⚠️ [拖放] 沒有找到對應的提示金錢');
                            window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                            this.audio.playErrorSound();
                            this.speech.speak('請放置正確的金錢', { interrupt: true });
                        }
                    } else {
                        // 普通/困難模式：實際移動金錢到付款區（A4 風格）
                        moneyEl.classList.remove('wallet-money');
                        moneyEl.classList.add('payment-money');
                        moneyEl.setAttribute('draggable', 'true'); // 允許拖曳回去
                        paymentMoneyContainer.appendChild(moneyEl);

                        // 🔧 [修正] 隱藏提示文字
                        const placeholder = paymentMoneyContainer.querySelector('.payment-placeholder');
                        if (placeholder) {
                            placeholder.style.display = 'none';
                        }

                        // 🔧 [新增] 記錄最後放置的金錢（供語音使用）
                        this.state.gameState.lastDroppedMoney = moneyValue;

                        this.audio.playDropSound();
                        this.updateC6Payment(question);
                    }
                }
            }, {}, 'dragSystem');

            // 🔧 [新增] 錢包區拖放接收 - 允許從付款區拖回
            Game.EventManager.on(walletContainer, 'dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            }, {}, 'dragSystem');

            Game.EventManager.on(walletContainer, 'drop', (e) => {
                e.preventDefault();

                const moneyIndex = e.dataTransfer.getData('text/plain');
                const moneyEl = document.getElementById(`wallet-money-${moneyIndex}`);

                if (moneyEl && moneyEl.classList.contains('payment-money')) {
                    Game.Debug.log('drag', '🔙 [拖放] 金錢拖回錢包:', moneyEl.dataset.value + '元');

                    // 🔧 [新增] 移除錯誤提示效果（如果有的話）
                    if (moneyEl.classList.contains('show-error-x')) {
                        moneyEl.classList.remove('show-error-x');
                        Game.Debug.log('drag', '🔙 [拖放] 已清除錯誤提示標記');
                    }

                    // 移回錢包
                    moneyEl.classList.remove('payment-money');
                    moneyEl.classList.add('wallet-money');
                    walletContainer.appendChild(moneyEl);

                    // 更新付款總額
                    this.updateC6Payment(question);
                }
            }, {}, 'dragSystem');

            // 🔧 [新增] 設置觸控拖曳支援（手機/平板端）
            this.setupC6TouchDragSupport(walletContainer, paymentDropZone, paymentMoneyContainer, question);

            Game.Debug.log('state', '✅ [C6-拖放] 拖放系統初始化完成');
        },

        // 🔧 [新增] C6專用觸控拖曳支援
        setupC6TouchDragSupport(walletContainer, paymentDropZone, paymentMoneyContainer, question) {
            Game.Debug.log('state', '🎯 [C6-觸控] 初始化觸控拖曳支援');

            if (!window.TouchDragUtility) {
                Game.Debug.error('❌ [C6-觸控] TouchDragUtility 未載入，觸控拖曳功能無法使用');
                return;
            }

            // 檢查金錢元素是否存在
            const walletMoney = walletContainer.querySelectorAll('.wallet-money');
            if (walletMoney.length === 0) {
                Game.Debug.warn('state', '⚠️ [C6-觸控] 錢包金錢元素尚未渲染，跳過觸控註冊');
                return;
            }

            Game.Debug.log('state', '✅ [C6-觸控] TouchDragUtility 已載入，開始註冊觸控拖曳');

            // 註冊錢包容器的可拖曳元素
            window.TouchDragUtility.registerDraggable(
                walletContainer,
                '.wallet-money',
                {
                    onDragStart: (element, event) => {
                        const moneyEl = element.closest('.wallet-money');
                        if (!moneyEl) return false;

                        Game.Debug.log('init', '📱 [C6-觸控] 開始拖動:', moneyEl.dataset.value + '元');
                        moneyEl.classList.add('dragging');
                        this.audio.playSelectSound();
                        return true;
                    },
                    onDrop: (draggedElement, dropZone, event) => {
                        const moneyEl = draggedElement.closest('.wallet-money, .payment-money');
                        if (!moneyEl) return;

                        // 檢查放置到付款區
                        if (dropZone === paymentDropZone || dropZone === paymentMoneyContainer || dropZone.closest('#payment-drop-zone')) {
                            if (moneyEl.classList.contains('wallet-money')) {
                                const moneyValue = parseInt(moneyEl.dataset.value);
                                Game.Debug.log('init', '📱💳 [C6-觸控] 放置金錢到付款區:', moneyValue + '元');

                                // 移除綠色勾勾效果（如果有）
                                if (moneyEl.classList.contains('show-correct-tick')) {
                                    moneyEl.classList.remove('show-correct-tick');
                                }

                                const difficulty = this.state.settings.difficulty;

                                // 🔧 [修正] 簡單模式：點亮提示金錢（A4風格），普通/困難模式：移動金錢
                                if (difficulty === 'easy') {
                                    // 簡單模式：找到對應的淡化提示金錢並點亮
                                    const hintMoney = Array.from(paymentMoneyContainer.querySelectorAll('.hint-money.faded'))
                                        .find(hint => parseInt(hint.dataset.value) === moneyValue && !hint.dataset.walletId);

                                    if (hintMoney) {
                                        Game.Debug.log('hint', '💡 [觸控] 找到對應提示金錢，點亮:', moneyValue + '元');
                                        // 點亮提示金錢
                                        hintMoney.classList.remove('faded');
                                        hintMoney.classList.add('lit-up');
                                        hintMoney.dataset.walletId = moneyEl.id;

                                        // 隱藏錢包中的金錢
                                        moneyEl.classList.add('hidden');

                                        // 添加點擊移除功能
                                        Game.EventManager.on(hintMoney, 'click', () => {
                                            Game.Debug.log('drag', '🗑️ [付款] 移除金錢:', moneyValue + '元');
                                            hintMoney.classList.remove('lit-up');
                                            hintMoney.classList.add('faded');
                                            delete hintMoney.dataset.walletId;
                                            moneyEl.classList.remove('hidden');
                                            this.updateC6Payment(question);
                                        }, { once: true }, 'gameUI');

                                        // 🔧 [新增] 記錄最後放置的金錢並更新
                                        this.state.gameState.lastDroppedMoney = moneyValue;

                                        this.audio.playDropSound();
                                        this.updateC6Payment(question);

                                        // 🔧 [新增] 簡單模式語音回饋（A4 風格）
                                        const droppedSpeech = this.speech.convertToTraditionalCurrency(moneyValue);
                                        this.speech.speak(`放入${droppedSpeech}`, { interrupt: true });
                                    } else {
                                        // 🔧 [修正] 沒有對應提示時播放錯誤音效和語音
                                        Game.Debug.warn('state', '⚠️ [觸控] 沒有找到對應的提示金錢');
                                        window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                                        this.audio.playErrorSound();
                                        this.speech.speak('請放置正確的金錢', { interrupt: true });
                                    }
                                } else {
                                    // 普通/困難模式：移動金錢到付款區（A4 風格）
                                    moneyEl.classList.remove('wallet-money');
                                    moneyEl.classList.add('payment-money');
                                    moneyEl.setAttribute('draggable', 'true');
                                    paymentMoneyContainer.appendChild(moneyEl);

                                    // 🔧 [修正] 隱藏提示文字
                                    const placeholder = paymentMoneyContainer.querySelector('.payment-placeholder');
                                    if (placeholder) {
                                        placeholder.style.display = 'none';
                                    }

                                    // 🔧 [新增] 記錄最後放置的金錢（供語音使用）
                                    this.state.gameState.lastDroppedMoney = moneyValue;

                                    this.audio.playDropSound();
                                    this.updateC6Payment(question);
                                }
                            }
                        }
                        // 檢查放置回錢包區
                        else if (dropZone === walletContainer || dropZone.closest('#wallet-container')) {
                            if (moneyEl.classList.contains('payment-money')) {
                                Game.Debug.log('init', '📱🔙 [C6-觸控] 金錢拖回錢包:', moneyEl.dataset.value + '元');

                                // 移除錯誤提示效果（如果有）
                                if (moneyEl.classList.contains('show-error-x')) {
                                    moneyEl.classList.remove('show-error-x');
                                }

                                // 移回錢包
                                moneyEl.classList.remove('payment-money');
                                moneyEl.classList.add('wallet-money');
                                walletContainer.appendChild(moneyEl);

                                this.updateC6Payment(question);
                            }
                        }
                    },
                    onDragEnd: (element, event) => {
                        const moneyEl = element.closest('.wallet-money, .payment-money');
                        if (moneyEl) {
                            moneyEl.classList.remove('dragging');
                        }
                    }
                }
            );

            // 註冊付款區容器的可拖曳元素（用於拖回錢包）
            window.TouchDragUtility.registerDraggable(
                paymentMoneyContainer,
                '.payment-money',
                {
                    onDragStart: (element, event) => {
                        const moneyEl = element.closest('.payment-money');
                        if (!moneyEl) return false;

                        Game.Debug.log('init', '📱 [C6-觸控] 開始拖動付款區金錢:', moneyEl.dataset.value + '元');
                        moneyEl.classList.add('dragging');
                        return true;
                    },
                    onDrop: (draggedElement, dropZone, event) => {
                        const moneyEl = draggedElement.closest('.payment-money');
                        if (!moneyEl) return;

                        // 檢查放置回錢包區
                        if (dropZone === walletContainer || dropZone.closest('#wallet-container')) {
                            Game.Debug.log('init', '📱🔙 [C6-觸控] 金錢從付款區拖回錢包:', moneyEl.dataset.value + '元');

                            // 移除錯誤提示效果（如果有）
                            if (moneyEl.classList.contains('show-error-x')) {
                                moneyEl.classList.remove('show-error-x');
                            }

                            // 移回錢包
                            moneyEl.classList.remove('payment-money');
                            moneyEl.classList.add('wallet-money');
                            walletContainer.appendChild(moneyEl);

                            this.updateC6Payment(question);
                        }
                    },
                    onDragEnd: (element, event) => {
                        const moneyEl = element.closest('.payment-money');
                        if (moneyEl) {
                            moneyEl.classList.remove('dragging');
                        }
                    }
                }
            );

            // 註冊付款區為放置區
            window.TouchDragUtility.registerDropZone(paymentDropZone, () => true);
            window.TouchDragUtility.registerDropZone(paymentMoneyContainer, () => true);

            // 註冊錢包區為放置區（允許拖回）
            window.TouchDragUtility.registerDropZone(walletContainer, () => true);

            Game.Debug.log('state', '✅ [C6-觸控] 觸控拖曳支援設置完成');
        },

        updateC6Payment(question) {
            const paymentMoneyContainer = document.getElementById('payment-money-container');
            const paymentTotalEl = document.getElementById('payment-total');

            if (!paymentMoneyContainer || !paymentTotalEl) return;

            const difficulty = this.state.settings.difficulty;
            let placedMoney, total;

            // 🔧 [修正] 根據難度計算付款總額
            if (difficulty === 'easy') {
                // 簡單模式：統計點亮的提示金錢
                placedMoney = Array.from(paymentMoneyContainer.querySelectorAll('.hint-money.lit-up'));
                total = placedMoney.reduce((sum, el) => sum + parseInt(el.dataset.value), 0);
            } else {
                // 普通/困難模式：統計實際放置的金錢
                placedMoney = Array.from(paymentMoneyContainer.querySelectorAll('.payment-money'));
                total = placedMoney.reduce((sum, el) => sum + parseInt(el.dataset.value), 0);
            }

            Game.Debug.log('wallet', `💰 [付款] 當前付款總額: ${total}元`);

            // 🔧 [修正] 困難模式顯示 ???，其他模式顯示實際金額
            if (difficulty === 'hard') {
                paymentTotalEl.textContent = '???';
            } else {
                paymentTotalEl.textContent = total;
            }

            // 🔧 [修正] 普通模式：播放 A4 風格語音「已放入X元，目前付款總額X元」
            if (difficulty === 'normal' && total > 0) {
                const lastDropped = this.state.gameState.lastDroppedMoney;
                if (lastDropped) {
                    const droppedSpeech = this.speech.convertToTraditionalCurrency(lastDropped);
                    const totalSpeech = this.speech.convertToTraditionalCurrency(total);
                    this.speech.speak(`已放入${droppedSpeech}，目前付款總額${totalSpeech}`, { interrupt: true });
                    // 清除記錄，避免重複播放
                    this.state.gameState.lastDroppedMoney = null;
                }
            }

            // 更新遊戲狀態
            this.state.gameState.paymentTotal = total;
            this.state.gameState.placedMoney = placedMoney.map(el => ({
                value: parseInt(el.dataset.value),
                index: el.dataset.index
            }));

            // 更新確認付款按鈕狀態
            this.updateC6PaymentDisplay(question);
        },

        // 🔧 更新C6付款顯示和按鈕狀態（參照A4）
        updateC6PaymentDisplay(question) {
            const confirmBtn = document.getElementById('c6-confirm-payment');
            if (!confirmBtn) return;

            const difficulty = this.state.settings.difficulty;
            const paidAmount = this.state.gameState.paymentTotal;
            const itemPrice = question.itemPrice;

            if (difficulty === 'hard') {
                // 困難模式：按鈕始終可用
                confirmBtn.disabled = false;
                confirmBtn.textContent = '確認付款';
            } else if (difficulty === 'normal') {
                // 普通模式：金額足夠時啟用按鈕
                if (paidAmount >= itemPrice) {
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = '確認付款';
                } else {
                    confirmBtn.disabled = true;
                    confirmBtn.textContent = `還需要${itemPrice - paidAmount}元`;
                }
            } else {
                // 簡單模式：金額足夠時啟用按鈕
                if (paidAmount >= itemPrice) {
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = '確認付款';
                } else {
                    confirmBtn.disabled = true;
                    confirmBtn.textContent = `還需要${itemPrice - paidAmount}元`;
                }
            }
        },

        // =====================================================
        // 🔧 [新增] 困難模式：退回所有付款金錢到錢包
        // =====================================================
        returnAllPaymentMoneyToWallet() {
            const paymentMoneyContainer = document.getElementById('payment-money-container');
            const walletContainer = document.getElementById('wallet-container');

            if (!paymentMoneyContainer || !walletContainer) {
                Game.Debug.error('❌ [退款] 找不到付款區或錢包容器');
                return;
            }

            // 取得所有在付款區的金錢
            const paymentMoneyItems = Array.from(paymentMoneyContainer.querySelectorAll('.payment-money'));

            if (paymentMoneyItems.length === 0) {
                Game.Debug.log('change', '💸 [退款] 付款區沒有金錢需要退回');
                return;
            }

            Game.Debug.log('change', `💸 [退款] 正在退回 ${paymentMoneyItems.length} 個金錢項目到錢包`);

            // 將所有金錢移回錢包
            paymentMoneyItems.forEach(moneyEl => {
                // 移除錯誤標記（如果有）
                if (moneyEl.classList.contains('show-error-x')) {
                    moneyEl.classList.remove('show-error-x');
                }

                // 改變CSS類別
                moneyEl.classList.remove('payment-money');
                moneyEl.classList.add('wallet-money');

                // 移動DOM元素
                walletContainer.appendChild(moneyEl);
            });

            // 更新付款總額顯示
            const paymentTotalEl = document.getElementById('payment-total');
            if (paymentTotalEl) {
                paymentTotalEl.textContent = '0';
            }

            // 清空遊戲狀態
            this.state.gameState.paymentTotal = 0;
            this.state.gameState.placedMoney = [];

            Game.Debug.log('state', `✅ [退款] ${paymentMoneyItems.length}個金錢已全部退回錢包`);
        },

        // =====================================================
        // 🔧 [新增] A4智能付款判斷相關輔助函數
        // =====================================================

        // 生成所有金錢組合的輔助函數（用於智能退款判斷）
        generateMoneyCombinations(moneyArray) {
            const combinations = [];
            const n = moneyArray.length;

            // 生成所有可能的子集合（2^n - 1種，排除空集合）
            for (let i = 1; i < (1 << n); i++) {
                const combination = [];
                for (let j = 0; j < n; j++) {
                    if (i & (1 << j)) {
                        combination.push(moneyArray[j]);
                    }
                }
                combinations.push(combination);
            }

            return combinations;
        },

        // 🔧 [新增] 智能檢測：找出最佳退款組合（從A4移植）
        findOptimalReturnMoney(paidMoney, itemPrice) {
            const paidAmount = paidMoney.reduce((sum, money) => sum + money.value, 0);
            Game.Debug.log('state', `🔍 [C6-新智能檢測 v2] 開始尋找最佳退款組合`, {
                itemPrice,
                paidAmount,
                paidMoney: paidMoney.map(m => m.value)
            });

            // 步驟 1: 生成所有可能的「退款」子集合
            const allReturnSubsets = this.generateMoneyCombinations(paidMoney);

            // 步驟 2: 篩選出所有有效的退款組合
            // 一個退款組合是有效的，前提是退款後，剩下的錢仍然足夠支付商品價格
            const validReturnCombinations = allReturnSubsets.filter(subset => {
                const subsetSum = subset.reduce((sum, money) => sum + money.value, 0);
                return paidAmount - subsetSum >= itemPrice;
            });

            // 步驟 3: 判斷當前付款是否已經是最佳狀態
            // 如果沒有任何有效的退款組合，代表拿走任何一個錢幣都會導致金額不足。
            // 這意味著當前的付款方式，雖然多付了，但已經是「找零最少」的最佳方式。
            if (validReturnCombinations.length === 0) {
                Game.Debug.log('hint', '💡 [C6-新智能檢測 v2] 當前付款已是最佳組合，無需退款。');
                return []; // 返回空陣列，表示成功且無需退款
            }

            // 步驟 4: 從所有有效的退款組合中，找出能退回「最多金額」的那個
            // 這樣可以確保用戶拿回最多錢，同時剩下的錢最接近商品價格
            const maxReturnValue = Math.max(...validReturnCombinations.map(subset =>
                subset.reduce((sum, money) => sum + money.value, 0)
            ));

            // 步驟 5: 取得所有能退回最大金額的組合
            const bestReturnCombinations = validReturnCombinations.filter(subset =>
                subset.reduce((sum, money) => sum + money.value, 0) === maxReturnValue
            );

            // 步驟 6: 如果多個組合都能退回同樣多的錢，優先選擇「錢幣數量最少」的組合
            // 這樣對用戶來說操作最簡單（例如，退一張50元，而不是5張10元）
            let finalChoice = bestReturnCombinations[0];
            if (bestReturnCombinations.length > 1) {
                finalChoice = bestReturnCombinations.reduce((best, current) =>
                    current.length < best.length ? current : best
                );
            }

            Game.Debug.log('hint', `💡 [C6-新智能檢測 v2] 建議的最佳退款組合:`, finalChoice.map(m => m.value));

            return finalChoice;
        },

        // 🔧 [新增] 生成智能退回提示語音（從A4移植）
        generateReturnMoneyMessage(moneyToReturn) {
            if (!moneyToReturn || moneyToReturn.length === 0) return '';

            Game.Debug.log('state', '🔍 [C6-退款訊息] 原始退款金錢列表:', moneyToReturn);

            // 按面額大小排序（從大到小）
            const sortedMoney = [...moneyToReturn].sort((a, b) => b.value - a.value);
            Game.Debug.log('state', '🔍 [C6-退款訊息] 排序後金錢列表:', sortedMoney);

            // 統計每種面額的數量
            const countByValue = {};
            sortedMoney.forEach(money => {
                countByValue[money.value] = (countByValue[money.value] || 0) + 1;
            });
            Game.Debug.log('state', '🔍 [C6-退款訊息] 面額統計:', countByValue);

            // 生成語音文字
            const moneyParts = Object.entries(countByValue)
                .sort(([a], [b]) => parseInt(b) - parseInt(a)) // 按面額從大到小
                .map(([value, count]) => {
                    const part = `${count}個${value}元`;
                    Game.Debug.log('state', `🔍 [C6-退款訊息] 面額${value}元 → ${part}`);
                    return part;
                });

            Game.Debug.log('state', '🔍 [C6-退款訊息] 語音部分列表:', moneyParts);

            let finalMessage = '';
            if (moneyParts.length === 1) {
                finalMessage = `請拿回${moneyParts[0]}`;
            } else {
                const lastPart = moneyParts.pop();
                finalMessage = `請拿回${moneyParts.join('、')}、${lastPart}`;
            }

            Game.Debug.log('speech', '🗣️ [C6-退款訊息] 最終語音訊息:', finalMessage);
            return finalMessage;
        },

        // 🔧 [新增] 在付款區顯示錯誤提示（紅色×動畫）（從A4移植，適配C6普通模式）
        highlightPaymentMoney(moneyList) {
            Game.Debug.log('hint', '🔥 [C6-錯誤提示] highlightPaymentMoney 被調用', { moneyList });

            // 清除之前的錯誤提示效果
            const existingHighlights = document.querySelectorAll('.payment-money.show-error-x');
            existingHighlights.forEach(item => {
                item.classList.remove('show-error-x');
            });

            // 統計需要提示的錢幣數量（按面額）
            const countByValue = {};
            moneyList.forEach(money => {
                countByValue[money.value] = (countByValue[money.value] || 0) + 1;
            });
            Game.Debug.log('hint', '🔥 [C6-錯誤提示] 需要提示的錢幣統計:', countByValue);

            // 找到付款區域（C6普通模式使用 payment-money-container）
            const paymentMoneyContainer = document.getElementById('payment-money-container');
            if (!paymentMoneyContainer) {
                Game.Debug.warn('state', '⚠️ [C6-錯誤提示] 找不到付款區域');
                return;
            }

            // 為每種面額的錢幣添加錯誤提示效果
            let highlightedCount = 0;
            Object.entries(countByValue).forEach(([value, count]) => {
                const valueNum = parseInt(value);
                // 🔧 [修改] 選擇實際放置的金錢（.payment-money）
                const moneyElements = Array.from(paymentMoneyContainer.querySelectorAll('.payment-money'))
                    .filter(el => parseInt(el.dataset.value) === valueNum);

                // 為前 count 個該面額的錢幣添加效果
                for (let i = 0; i < Math.min(count, moneyElements.length); i++) {
                    moneyElements[i].classList.add('show-error-x');
                    highlightedCount++;
                    Game.Debug.log('hint', `🔥 [C6-錯誤提示] 已為錢幣 ${moneyElements[i].id} 添加×動畫`);
                }
            });

            Game.Debug.log('hint', `🔥 [C6-錯誤提示] 實際添加效果的錢幣數量: ${highlightedCount}`);

            // 3秒後自動移除效果
            Game.TimerManager.setTimeout(() => {
                const highlights = document.querySelectorAll('.payment-money.show-error-x');
                highlights.forEach(item => {
                    item.classList.remove('show-error-x');
                });
                Game.Debug.log('hint', `🔥 [C6-錯誤提示] 3秒後移除×動畫，數量: ${highlights.length}`);
            }, 3000);
        },

        // =====================================================
        // 🔧 [新增] 困難模式：在錢包區顯示綠色打勾提示 - 從A4移植
        // =====================================================
        showWalletHintWithTicks(moneyList) {
            Game.Debug.log('state', '✅ [打勾提示] showWalletHintWithTicks 被調用', { moneyList });

            const walletContainer = document.getElementById('wallet-container');
            if (!walletContainer) {
                Game.Debug.error('✅ [打勾提示] 錯誤：找不到錢包容器');
                return;
            }

            // 清除之前的提示效果
            walletContainer.querySelectorAll('.wallet-money.show-correct-tick').forEach(item => {
                item.classList.remove('show-correct-tick');
            });

            // 統計需要提示的錢幣數量
            const moneyCount = {};
            moneyList.forEach(money => {
                const value = money.value;
                moneyCount[value] = (moneyCount[value] || 0) + 1;
            });
            Game.Debug.log('state', '✅ [打勾提示] 需要提示的錢幣統計:', moneyCount);

            // 為每個面額找到足夠數量的、尚未被標記的錢幣元素
            Object.keys(moneyCount).forEach(valueStr => {
                const value = parseInt(valueStr);
                let needed = moneyCount[valueStr];
                const availableItems = walletContainer.querySelectorAll(`.wallet-money[data-value="${value}"]`);

                for (const item of availableItems) {
                    if (needed > 0 && !item.classList.contains('show-correct-tick')) {
                        item.classList.add('show-correct-tick');
                        needed--;
                        Game.Debug.log('state', `✅ [打勾提示] 已為錢幣 ${item.id} 添加打勾`);
                    }
                    if (needed === 0) break; // 該面額已找足
                }
            });

            // 4秒後自動移除提示效果
            Game.TimerManager.setTimeout(() => {
                const tickedItems = walletContainer.querySelectorAll('.show-correct-tick');
                if (tickedItems.length > 0) {
                    Game.Debug.log('state', `✅ [打勾提示] 4秒後自動移除 ${tickedItems.length} 個打勾效果`);
                    tickedItems.forEach(item => {
                        item.classList.remove('show-correct-tick');
                    });
                }
            }, 4000);
        },

        // =====================================================
        // 🔧 [新增] 困難模式：計算最佳付款方案 - 從A4移植
        // =====================================================
        calculateOptimalPayment(targetAmount, availableMoney) {
            Game.Debug.log('payment', '計算最佳付款方案:', { targetAmount, availableMoney });

            // 計算每種面額的數量
            const coinCounts = {};
            availableMoney.forEach(money => {
                coinCounts[money.value] = (coinCounts[money.value] || 0) + 1;
            });

            Game.Debug.log('payment', '可用錢幣統計:', coinCounts);

            const allCoins = Object.keys(coinCounts).map(Number).sort((a, b) => a - b);

            // 策略1: 尋找精確付款方案（不找零）
            function findExactPayment(target, coinsList, counts) {
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

            let exactSolution = findExactPayment(targetAmount, allCoins, coinCounts);

            if (exactSolution) {
                Game.Debug.log('payment', '找到精確付款方案:', exactSolution);
                return exactSolution;
            }

            // 策略2: 找零最小值方案
            Game.Debug.log('payment', '找不到精確付款，尋找找零最小的方案');

            // 對於大數量的錢幣，使用簡化的貪心方法
            const totalCoins = Object.values(coinCounts).reduce((a, b) => a + b, 0);

            let bestSolution = null;
            let minChange = Infinity;

            if (totalCoins > 20) {
                // 使用貪心算法
                const coinsLargeToSmall = allCoins.slice().sort((a, b) => b - a);
                for (const coin of coinsLargeToSmall) {
                    if (coinCounts[coin] > 0 && coin >= targetAmount) {
                        const change = coin - targetAmount;
                        if (change < minChange) {
                            minChange = change;
                            bestSolution = [coin];
                        }
                    }
                }

                if (!bestSolution) {
                    const backupCounts = { ...coinCounts };
                    bestSolution = [];
                    let remaining = targetAmount;

                    for (const coin of coinsLargeToSmall) {
                        while (remaining > 0 && backupCounts[coin] > 0) {
                            bestSolution.push(coin);
                            remaining -= coin;
                            backupCounts[coin]--;
                        }
                        if (remaining <= 0) break;
                    }
                }
            }

            if (bestSolution) {
                Game.Debug.log('payment', `找到找零最小方案: ${bestSolution}, 找零: ${minChange}元`);
                return bestSolution;
            }

            // 最終備用方案
            Game.Debug.log('payment', '使用最終備用方案');
            const finalSolution = [];
            let remaining = targetAmount;
            const coinsLargeToSmall = allCoins.slice().sort((a, b) => b - a);

            for (const coin of coinsLargeToSmall) {
                while (remaining > 0 && coinCounts[coin] > 0) {
                    finalSolution.push(coin);
                    remaining -= coin;
                    coinCounts[coin]--;
                }
                if (remaining <= 0) break;
            }

            Game.Debug.log('payment', '最終解決方案:', finalSolution);
            return finalSolution || [];
        },

        // =====================================================
        // 🔧 [新增] 困難模式：生成最佳付款語音 - 從A4移植
        // =====================================================
        generateOptimalPaymentSpeech(optimalPayment) {
            if (!optimalPayment || optimalPayment.length === 0) {
                return '你的錢包金額不足以支付此商品。';
            }

            // 統計各面額數量
            const counts = {};
            optimalPayment.forEach(value => {
                counts[value] = (counts[value] || 0) + 1;
            });

            // 依面額從大到小排序並生成文字
            const parts = Object.keys(counts).map(Number).sort((a, b) => b - a).map(value => {
                const count = counts[value];
                const moneyName = `${value}元`;
                return `${count}個${moneyName}`;
            });

            // 組合句子
            let speechText = '小提示，你可以付';
            if (parts.length > 1) {
                const lastPart = parts.pop();
                speechText += parts.join('、') + '、和' + lastPart;
            } else {
                speechText += parts[0];
            }

            return speechText;
        },

        // =====================================================
        // 🔧 [新增] 困難模式：提示按鈕點擊處理
        // =====================================================
        showC6PaymentHint(question) {
            Game.Debug.log('hint', '💡 [困難模式提示] 提示按鈕被點擊');

            // 🔧 [新增] 顯示已付金額資訊
            const paymentInfo = document.getElementById('payment-info-display');
            if (paymentInfo) {
                paymentInfo.style.display = 'inline-flex';
            }

            // 先退回所有金錢到錢包
            this.returnAllPaymentMoneyToWallet();

            // 使用 setTimeout 確保 DOM 更新完成
            Game.TimerManager.setTimeout(() => {
                const itemPrice = question.itemPrice;
                // 🔧 [修正] walletCoins 已經是 {value, image, type} 格式的物件陣列
                const allAvailableMoney = question.walletCoins; // 直接使用，不需要再映射
                Game.Debug.log('hint', '💡 [提示] 可用錢幣:', allAvailableMoney);

                const optimalPayment = this.calculateOptimalPayment(itemPrice, allAvailableMoney);
                const speechText = this.generateOptimalPaymentSpeech(optimalPayment);

                // 播放語音，並在語音播放完畢後顯示視覺提示
                this.speech.speak(speechText, {
                    interrupt: true,
                    callback: () => {
                        if (optimalPayment && optimalPayment.length > 0) {
                            const moneyObjectsToHighlight = optimalPayment.map(val => ({ value: val }));
                            this.showWalletHintWithTicks(moneyObjectsToHighlight);
                        }
                    }
                });
            }, 100);
        },

        // 🔧 確認付款（參照A4 confirmPayment）
        confirmC6Payment(question) {
            Game.Debug.log('state', '🎯 [C6-確認付款] 開始驗證付款');

            const confirmBtn = document.getElementById('c6-confirm-payment');
            if (confirmBtn && confirmBtn.disabled) {
                Game.Debug.warn('state', '⚠️ [C6-確認付款] 按鈕已禁用，無法確認');
                return;
            }

            const difficulty = this.state.settings.difficulty;
            const paidAmount = this.state.gameState.paymentTotal;
            const itemPrice = question.itemPrice;
            const walletAmount = question.walletAmount;

            Game.Debug.log('state', `📊 [C6-確認付款] 付款: ${paidAmount}元, 商品: ${itemPrice}元, 錢包: ${walletAmount}元`);

            // --- 步驟 1: 付款金額不足檢查 ---
            if (paidAmount < itemPrice) {
                Game.Debug.log('state', '❌ [C6-確認付款] 付款金額不足');
                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                this.audio.playErrorSound();
                const neededAmount = itemPrice - paidAmount;
                const mode = this.state.settings.mode;

                if (mode === 'single') {
                    // 單次作答：告知錯誤，然後進入下一題
                    const isLastQuestion = this.state.quiz.currentQuestion >= this.state.quiz.totalQuestions;
                    const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                    const speechText = `對不起你答錯了，你付的錢不夠，還需要${neededAmount}元，${endingText}`;
                    this.returnAllPaymentMoneyToWallet();

                    this.speech.speak(speechText, {
                        interrupt: true,
                        callback: () => {
                            Game.TimerManager.setTimeout(() => {
                                Game.Debug.log('state', '➡️ 單次作答模式，自動前往下一題');
                                this.loadNextQuestion();
                            }, 1500);
                        }
                    });
                } else {
                    // 反復作答：允許繼續付款
                    if (difficulty === 'normal') {
                        this.speech.speak(`還需要${neededAmount}元，請繼續付款`, { interrupt: true });
                    } else if (difficulty === 'hard') {
                        // 🔧 [修正] 困難模式：先退回所有金錢到錢包，再播放語音
                        Game.Debug.log('change', '💸 [困難模式] 付款不足，正在退回所有金錢到錢包');
                        this.returnAllPaymentMoneyToWallet();
                        this.speech.speak('你付的錢不夠，請再試一次', { interrupt: true });
                    } else {
                        this.speech.speak(`還需要${neededAmount}元，請繼續付款`, { interrupt: true });
                    }
                }
                return;
            }

            // --- 步驟 2: 檢查是否付款正確 ---
            // 🔧 [新增] 普通模式和困難模式：使用 A4 智能付款判斷
            if (difficulty === 'normal' || difficulty === 'hard') {
                // 檢查是否有多餘的付款（但可能是最佳方案）
                if (paidAmount > itemPrice) {
                    const paidMoney = this.state.gameState.placedMoney; // 取得已付款的金錢列表
                    const moneyToReturn = this.findOptimalReturnMoney(paidMoney, itemPrice);

                    // 情況 A: moneyToReturn.length > 0，代表有更好的付款方式
                    if (moneyToReturn && moneyToReturn.length > 0) {
                        Game.Debug.log('state', '❌ [C6-確認付款] 存在更優的付款方式，提示用戶退回多餘錢幣');
                        this.audio.playError02Sound();
                        const mode = this.state.settings.mode;

                        if (mode === 'single') {
                            // 單次作答：告知存在更優方案，然後進入下一題
                            const isLastQuestion = this.state.quiz.currentQuestion >= this.state.quiz.totalQuestions;
                            const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                            const speechText = `對不起你答錯了，存在更優的付款方式，${endingText}`;
                            this.speech.speak(speechText, {
                                interrupt: true,
                                callback: () => {
                                    Game.TimerManager.setTimeout(() => {
                                        Game.Debug.log('state', '➡️ 單次作答模式，自動前往下一題');
                                        this.loadNextQuestion();
                                    }, 1500);
                                }
                            });
                        } else {
                            // 反復作答：提示退回多餘錢幣（保持原有邏輯）
                            // 生成退款提示語音
                            const returnMessage = this.generateReturnMoneyMessage(moneyToReturn);

                            if (difficulty === 'normal') {
                                // 普通模式：顯示紅色×動畫並播放詳細語音
                                this.highlightPaymentMoney(moneyToReturn);
                                this.speech.speak(returnMessage, { interrupt: true });
                            } else if (difficulty === 'hard') {
                                // 🔧 [修正] 困難模式：先退回所有金錢到錢包，再播放語音
                                Game.Debug.log('change', '💸 [困難模式] 正在退回所有金錢到錢包');
                                this.returnAllPaymentMoneyToWallet();
                                this.speech.speak('你付的錢太多了，請再試一次', { interrupt: true });
                            }
                        }
                        return;
                    }

                    // 情況 B: moneyToReturn 是 [] (空陣列)，代表這已是最佳付款方式
                    // 直接繼續往下執行到付款成功的部分
                    Game.Debug.log('state', '✅ [C6-確認付款] 雖然多付，但已是最佳組合，允許付款');
                }
            }

            // 簡單模式：檢查是否付款等於錢包金額
            if (difficulty === 'easy') {
                if (paidAmount !== walletAmount) {
                    Game.Debug.log('state', '❌ [C6-確認付款] 付款金額不正確，應付全部錢包金額');
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this.audio.playErrorSound();
                    this.speech.speak(`請付出全部的錢，你的錢包總共有${walletAmount}元`, { interrupt: true });
                    return;
                }
            }

            // --- 步驟 3: 付款成功流程 ---
            Game.Debug.log('state', '✅ [C6-確認付款] 付款金額正確！');
            this.audio.playCorrectSound();

            // 禁用按鈕
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.textContent = '處理中...';
            }

            // 🎆 播放煙火動畫
            this.startFireworksAnimation();

            // 🔊 煙火動畫後播放語音「你付了×元」，然後進入步驟2
            Game.TimerManager.setTimeout(() => {
                const paymentSpeech = `你付了${paidAmount}元`;
                Game.Debug.log('speech', `🗣️ 播放付款語音: "${paymentSpeech}"`);

                this.speech.speak(paymentSpeech, {
                    callback: () => {
                        Game.Debug.log('state', '✅ 付款語音播放完畢，進入步驟2');
                        this.proceedToStep2(question);
                    }
                });
            }, 1000); // 煙火動畫播放1秒後開始語音
        },

        proceedToStep2(question) {
            Game.Debug.log('state', '🎯 [C6] 進入步驟2：找零驗證');

            // 更新question的step
            question.step = 2;

            // 根據難度選擇不同的渲染方式
            const difficulty = this.state.settings.difficulty;
            if (difficulty === 'easy') {
                // 簡單模式：拖放找零
                this.renderC6Step2(question);
            } else if (difficulty === 'normal') {
                // 普通模式：選擇題找零
                this.renderC6NormalStep2(question);
            } else if (difficulty === 'hard') {
                // 困難模式：顯示找零計算頁面，計算正確後才進入選擇題
                this.renderC6HardModeStep2(question);
            } else {
                // 默認使用簡單模式
                this.renderC6Step2(question);
            }
        },

        renderC6Step2(question) {
            Game.Debug.log('ui', '🎨 [C6-步驟2] 開始渲染找零驗證頁面');
            const gameContainer = document.getElementById('app');
            const { item, itemPrice, walletAmount, changeAmount, changeCoins } = question;

            Game.Debug.log('ui', `📝 步驟2資訊: 商品${itemPrice}元, 付款${walletAmount}元, 找零${changeAmount}元`);
            Game.Debug.log('wallet', `💰 找零金錢數量: ${changeCoins.length}個`);

            // 初始化找零拖放狀態
            this.state.gameState.changeDropTargets = changeCoins.map((money, index) => ({
                expectedMoney: money,
                isDropped: false,
                position: index
            }));

            // 初始化語音佇列狀態
            this.state.gameState.changeSpeechQueue = [];
            this.state.gameState.isPlayingChangeSpeech = false;

            // 🆕 初始化累計找回金額
            this.state.gameState.totalChangeCollected = 0;
            this.state.gameState.nextQuestionScheduled = false; // 防止重複呼叫 loadNextQuestion

            // 1️⃣ 生成購買物品區 HTML（包含算式）- 與步驟1相同格式
            const itemInfoHTML = `
                <div class="c6-purchase-info">
                    <div class="section-title">🛍️ 購買物品</div>
                    <div class="item-info-compact">
                        <span class="iic-img">${this.getItemImg(item, '180px')}</span>
                        <span class="iic-name">${item.name}</span>
                        <span class="iic-price">${itemPrice} 元</span><button class="quiz-speak-btn" onclick="event.stopPropagation();Game.speakQuestion()" title="朗讀題目">🔊</button>
                    </div>
                    <div class="calculation-display">
                        <span class="calc-text">${walletAmount}元 - ${itemPrice}元 = ${changeAmount}元</span>
                    </div>
                </div>
            `;

            // 2️⃣ 生成店家找零區 HTML
            const changeAreaHTML = `
                <div class="c6-change-area">
                    <div class="section-title">💵 店家找零</div>
                    <div class="store-change">
                        ${changeCoins.map((money, index) => `
                            <div class="money-item change-money draggable"
                                 data-change-id="${index}"
                                 data-index="${index}"
                                 data-money-value="${money.value}"
                                 draggable="true"
                                 id="change-money-${index}">
                                <img src="${money.image}" alt="${money.value}元" draggable="false" />
                                <div class="money-value">${money.value}元</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            // 3️⃣ 生成我的錢包區 HTML（淡化金錢圖示）
            const myWalletHTML = `
                <div class="c6-my-wallet-area">
                    <div class="wallet-header-container">
                        <div class="wallet-center-group">
                            <div class="section-title">👛 我的錢包</div>
                            <div class="change-total-display">找回 <span class="amount" id="change-amount">0</span> 元</div>
                        </div>
                    </div>
                    <div class="my-wallet-container">
                        ${changeCoins.map((money, index) => {
                            const isBanknote = money.value >= 100;
                            const itemClass = isBanknote ? 'money-item banknote wallet-target faded' : 'money-item coin wallet-target faded';
                            return `
                                <div class="${itemClass}"
                                     data-target-index="${index}"
                                     data-expected-value="${money.value}"
                                     id="wallet-target-${index}">
                                    <img src="${money.image}" alt="${money.value}元" />
                                    <div class="money-value">${money.value}元</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            // 組合完整 HTML（包含 CSS）
            gameContainer.innerHTML = `
                <style>${this.getCommonCSS()}${this.getC6EasyModeCSS()}</style>
                <div class="game-container">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span>第 ${this.state.quiz.currentQuestion} 題 / 共 ${this.state.quiz.totalQuestions} 題</span>
                        </div>
                        <div class="title-bar-center"><h2 style="margin: 0; color: inherit;">單元C6：找零與計算</h2></div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                        </div>
                    </div>

                    <div class="c6-step2-container">
                        ${itemInfoHTML}
                        ${changeAreaHTML}
                        ${myWalletHTML}
                    </div>
                </div>
            `;

            // 綁定事件監聽器
            this.setupC6Step2EventListeners(question);

            // 🔊 播放語音提示
            Game.TimerManager.setTimeout(() => {
                const speechText = `你購買${item.name}共${itemPrice}元，你付了${walletAmount}元，需要找你${changeAmount}元`;
                Game.Debug.log('speech', `🗣️ 播放找零提示語音: "${speechText}"`);
                this.speech.speak(speechText);
            }, 500);

            Game.Debug.log('state', '✅ [C6-步驟2] 頁面渲染完成');
        },

        setupC6Step2EventListeners(question) {
            Game.Debug.log('event', '🔗 [C6-步驟2] 設置事件監聽器');

            // 返回按鈕
            const backBtn = document.getElementById('back-to-menu-btn');
            if (backBtn) {
                Game.EventManager.on(backBtn, 'click', () => this.showSettings(), {}, 'gameUI');
            }

            // 設置找零拖放功能
            this.setupC6ChangeDetection(question);
        },

        setupC6ChangeDetection(question) {
            Game.Debug.log('state', '🎯 [C6-找零] 初始化找零拖放系統');

            const changeMoneyElements = document.querySelectorAll('.change-money');
            const walletTargets = document.querySelectorAll('.wallet-target');
            const changeArea = document.querySelector('.store-change');
            const walletArea = document.querySelector('.c6-my-wallet-area');

            // 設置店家找零金錢的拖放事件
            changeMoneyElements.forEach((moneyEl) => {
                Game.EventManager.on(moneyEl, 'dragstart', (e) => {
                    const changeId = moneyEl.dataset.changeId;
                    e.dataTransfer.setData('text/plain', changeId);
                    moneyEl.classList.add('dragging');
                    Game.Debug.log('state', '🎯 [找零] 開始拖曳:', moneyEl.dataset.moneyValue + '元');

                    // 🆕 使用去背圖片作為拖曳預覽
                    const img = moneyEl.querySelector('img');
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
                        Game.TimerManager.setTimeout(() => dragImg.remove(), 0, 'ui');
                    }
                }, {}, 'dragSystem');

                Game.EventManager.on(moneyEl, 'dragend', (e) => {
                    moneyEl.classList.remove('dragging');
                }, {}, 'dragSystem');
            });

            // 🆕 設置TouchDragUtility支援（觸控端）
            if (window.TouchDragUtility && changeArea && walletArea) {
                Game.Debug.log('state', '✅ [C6-找零-觸控] TouchDragUtility 已載入，開始註冊');

                // 註冊找零金錢為可拖曳元素
                window.TouchDragUtility.registerDraggable(
                    changeArea,
                    '.change-money',
                    {
                        onDragStart: (element, event) => {
                            const moneyEl = element.closest('.change-money');
                            if (!moneyEl || moneyEl.classList.contains('hidden')) return false;

                            Game.Debug.log('init', '📱 [C6-找零-觸控] 開始拖動:', moneyEl.dataset.moneyValue + '元');
                            moneyEl.classList.add('dragging');
                            this.audio.playSelectSound();  // 🆕 新增拖動開始音效
                            return true;
                        },
                        onDrop: (draggedElement, dropZone, event) => {
                            const moneyEl = draggedElement.closest('.change-money');
                            if (!moneyEl) return;

                            // 檢查放置目標
                            const target = dropZone.closest('.wallet-target');
                            if (!target || !target.classList.contains('faded')) {
                                Game.Debug.log('state', '❌ [C6-找零-觸控] 無效的放置目標');
                                this.audio.playErrorSound();  // 🆕 新增錯誤音效
                                return;
                            }

                            const changeId = moneyEl.dataset.changeId;
                            const moneyValue = parseInt(moneyEl.dataset.moneyValue);

                            Game.Debug.log('touch', `📱 [C6-找零-觸控] 放置金錢到錢包: ${moneyValue}元`);

                            // 點亮目標位置
                            target.classList.remove('faded');
                            target.classList.add('lit-up');
                            target.dataset.changeId = changeId;

                            // 隱藏店家找零區的金錢
                            moneyEl.classList.add('hidden');

                            // 添加點擊移除功能
                            Game.EventManager.on(target, 'click', () => {
                                const removedValue = parseInt(target.dataset.expectedValue);
                                Game.Debug.log('drag', '🗑️ [找零] 移除金錢:', removedValue + '元');

                                // 🆕 減少累計總額（只更新數字部分）
                                this.state.gameState.totalChangeCollected -= removedValue;
                                const amountElement = document.getElementById('change-amount');
                                if (amountElement) {
                                    amountElement.textContent = this.state.gameState.totalChangeCollected;
                                }

                                target.classList.remove('lit-up');
                                target.classList.add('faded');
                                target.removeAttribute('data-change-id');
                                moneyEl.classList.remove('hidden');
                            }, { once: true }, 'gameUI');

                            // 🆕 播放放置音效
                            this.audio.playDropSound();

                            // 播放語音（🆕 加上 interrupt: true）
                            const speechText = `你收了${moneyValue}元`;
                            this.speech.speak(speechText, { interrupt: true });

                            // 檢查是否完成
                            this.checkC6AllChangeCollected(question);
                        },
                        onDragEnd: (element, event) => {
                            const moneyEl = element.closest('.change-money');
                            if (moneyEl) {
                                moneyEl.classList.remove('dragging');
                            }
                        }
                    }
                );

                // 註冊錢包區為放置區
                walletTargets.forEach(target => {
                    window.TouchDragUtility.registerDropZone(target, () => true);
                });

                Game.Debug.log('state', '✅ [C6-找零-觸控] 觸控拖曳支援設置完成');
            }

            // 設置我的錢包區的拖放事件
            walletTargets.forEach((target) => {
                Game.EventManager.on(target, 'dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (target.classList.contains('faded')) {
                        target.classList.add('drag-over');
                    }
                }, {}, 'dragSystem');

                Game.EventManager.on(target, 'dragleave', (e) => {
                    target.classList.remove('drag-over');
                }, {}, 'dragSystem');

                Game.EventManager.on(target, 'drop', (e) => {
                    e.preventDefault();
                    target.classList.remove('drag-over');

                    // 只有淡化狀態才能接受拖放
                    if (!target.classList.contains('faded')) {
                        Game.Debug.log('state', '❌ [找零] 該位置已有金錢');
                        return;
                    }

                    const changeId = e.dataTransfer.getData('text/plain');
                    const moneyEl = document.getElementById(`change-money-${changeId}`);

                    if (moneyEl && !moneyEl.classList.contains('hidden')) {
                        const moneyValue = parseInt(moneyEl.dataset.moneyValue);

                        Game.Debug.log('state', `🎯 [找零] 放置金錢到錢包: ${moneyValue}元`);

                        // A4 風格：將淡化提示點亮
                        target.classList.remove('faded');
                        target.classList.add('lit-up');
                        target.dataset.changeId = changeId;

                        // 隱藏店家找零區的金錢
                        moneyEl.classList.add('hidden');

                        // 添加點擊移除功能
                        Game.EventManager.on(target, 'click', () => {
                            const removedValue = parseInt(target.dataset.expectedValue);
                            Game.Debug.log('drag', '🗑️ [找零] 移除金錢:', removedValue + '元');

                            // 🆕 減少累計總額（只更新數字部分）
                            this.state.gameState.totalChangeCollected -= removedValue;
                            const amountElement = document.getElementById('change-amount');
                            if (amountElement) {
                                amountElement.textContent = this.state.gameState.totalChangeCollected;
                            }

                            target.classList.remove('lit-up');
                            target.classList.add('faded');
                            target.removeAttribute('data-change-id');
                            moneyEl.classList.remove('hidden');
                            this.checkC6ChangeComplete(question);
                        }, { once: true }, 'gameUI');

                        this.audio.playDropSound();

                        // 🔊 播放語音「找回×元」（使用智能佇列系統）
                        this.playChangeSpeech(moneyValue, question);

                        // 檢查是否全部完成（延遲至 DOM 更新後）
                        requestAnimationFrame(() => {
                            this.checkC6ChangeComplete(question);
                        });
                    }
                }, {}, 'dragSystem');
            });

            Game.Debug.log('state', '✅ [C6-找零] 拖放系統初始化完成');
        },

        // 🔊 智能語音播放系統：播放累計找回的總額
        playChangeSpeech(moneyValue, question) {
            // 🆕 更新累計總額
            this.state.gameState.totalChangeCollected += moneyValue;
            const totalAmount = this.state.gameState.totalChangeCollected;

            // 🆕 更新畫面顯示（只更新數字部分）
            const amountElement = document.getElementById('change-amount');
            if (amountElement) {
                amountElement.textContent = totalAmount;
            }

            const speechText = `找回${totalAmount}元`;

            // 使用 interrupt: true 讓 speech.speak 自動處理打斷
            Game.Debug.log('speech', `🗣️ [找零語音] 播放: "${speechText}"`);
            this.state.gameState.isPlayingChangeSpeech = true;

            this.speech.speak(speechText, {
                interrupt: true, // 允許打斷前一個語音
                callback: () => {
                    Game.Debug.log('state', `✅ [找零語音] 播放完畢: "${speechText}"`);
                    this.state.gameState.isPlayingChangeSpeech = false;

                    // 檢查是否為最後一個找零金錢，且全部完成
                    const walletTargets = document.querySelectorAll('.wallet-target');
                    const allLitUp = Array.from(walletTargets).every(target => target.classList.contains('lit-up'));

                    if (allLitUp) {
                        // 🔧 防止多枚找零幣快速觸發時重複呼叫
                        if (this.state.gameState.nextQuestionScheduled) return;
                        this.state.gameState.nextQuestionScheduled = true;
                        Game.Debug.log('state', '🎉 [找零] 最後一個語音播放完畢，且全部完成，準備進入下一輪');
                        // 播放過渡語音後再進入下一題
                        Game.TimerManager.setTimeout(() => {
                            this.state.quiz.score += 10; // 答對加分
                            const nextIndex = this.state.quiz.currentQuestion;
                            const isLast = nextIndex >= this.state.quiz.questions.length;
                            const transitionText = isLast ? '測驗結束' : `進入第${nextIndex + 1}題`;
                            this.speech.speak(transitionText, {
                                interrupt: true,
                                callback: () => { this.loadNextQuestion(); }
                            });
                        }, 1000);
                    }
                }
            });
        },

        checkC6ChangeComplete(question) {
            const walletTargets = document.querySelectorAll('.wallet-target');
            const allLitUp = Array.from(walletTargets).every(target => target.classList.contains('lit-up'));

            if (allLitUp) {
                Game.Debug.log('state', '✅ [找零] 所有找零金錢已正確放置到錢包！');

                // 播放 correct 音效和煙火動畫
                this.audio.playCorrectSound();
                this.startFireworksAnimation();

                // 注意：進入下一題的邏輯已移到 playChangeSpeech 的 callback 中
                // 確保最後一個語音播放完畢後才進入下一題
            }
        },

        // ========== C6 普通模式：步驟2 選擇題找零 ==========

        renderC6NormalStep2(question) {
            Game.Debug.log('ui', '🎨 [C6-普通模式-步驟2] 開始渲染找零選擇題頁面');
            const gameContainer = document.getElementById('app');
            const { item, itemPrice, walletAmount, changeAmount } = question;

            Game.Debug.log('ui', `📝 步驟2資訊: 商品${itemPrice}元, 付款${walletAmount}元, 找零${changeAmount}元`);

            // 生成找零選項（如果尚未生成）
            if (!question.changeOptions) {
                question.changeOptions = this.generateC6ChangeOptions(changeAmount);
                Game.Debug.log('question', '🆕 生成新的找零選項');
            } else {
                Game.Debug.log('state', '🔄 使用已儲存的找零選項（保持選項固定）');
            }

            const changeOptions = question.changeOptions;

            // 1️⃣ 生成購買物品區 HTML（與簡單模式相同格式）
            const itemInfoHTML = `
                <div class="c6-purchase-info">
                    <div class="ip-title-row">
                        <h2 class="section-title" style="margin:0;">🛍️ 購買物品</h2>
                        <div style="display:flex;align-items:center;gap:6px;"><img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;"><button id="c6-amount-hint-btn" class="c6-hint-btn" style="background: linear-gradient(135deg, #f39c12, #e67e22); color: white; border: none; padding: 8px 15px; border-radius: 20px; font-size: 0.9em; font-weight: bold; cursor: pointer;">💡 提示</button></div>
                    </div>
                    <div class="item-info-compact">
                        <span class="iic-img">${this.getItemImg(item, '180px')}</span>
                        <span class="iic-name">${item.name}</span>
                        <span class="iic-price">${itemPrice} 元</span><button class="quiz-speak-btn" onclick="event.stopPropagation();Game.speakQuestion()" title="朗讀題目">🔊</button>
                    </div>
                    <div class="calculation-display">
                        <span class="calc-text">${walletAmount}元 - ${itemPrice}元 = ${changeAmount}元</span>
                    </div>
                </div>
            `;

            // 2️⃣ 生成找零選擇題 HTML（參考 A4 普通模式）
            const changeQuestionHTML = `
                <div class="change-question-area">
                    <div class="change-title">找零金額</div>
                    <div class="change-amount-highlight">${changeAmount}元</div>
                </div>

                <div class="change-options-area">
                    <div class="change-options">
                        ${changeOptions.map((option, index) => `
                            <div class="change-option ${option.isCorrect ? 'correct-option' : ''}"
                                 data-option-index="${index}"
                                 data-is-correct="${option.isCorrect}"
                                 data-change-amount="${option.totalValue}"
                                 onclick="Game.selectC6ChangeOption(${index}, ${option.isCorrect}, ${option.totalValue})">
                                <div class="option-money-display">
                                    ${option.money.length === 0 ?
                                        '<div class="no-change-display">不需找零</div>' :
                                        option.money.map(money => {
                                            const isBanknote = money.value >= 100;
                                            const sizeStyle = isBanknote ? 'width: 110px; height: auto;' : 'width: 60px; height: auto;';
                                            return `
                                                <div class="option-money-item" data-value="${money.value}">
                                                    <img src="${money.image}"
                                                         alt="${money.value}元"
                                                         class="option-money-img"
                                                         style="${sizeStyle}"
                                                         draggable="false" />
                                                    <div class="money-label" style="display: none; font-size: 0.8em; color: #333; font-weight: bold; text-align: center;">${money.value}元</div>
                                                </div>
                                            `;
                                        }).join('')
                                    }
                                </div>
                                <div class="option-amount-display">${option.totalValue}元</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            gameContainer.innerHTML = `
                <style>${this.getCommonCSS()}${this.getC6EasyModeCSS()}${this.getC6NormalStep2CSS()}</style>
                <div class="game-container">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span>第 ${this.state.quiz.currentQuestion} 題 / 共 ${this.state.quiz.totalQuestions} 題</span>
                        </div>
                        <div class="title-bar-center"><h2 style="margin: 0; color: inherit;">單元C6：找零與計算</h2></div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                        </div>
                    </div>

                    <div class="c6-step2-container">
                        ${itemInfoHTML}
                        ${changeQuestionHTML}
                    </div>
                </div>
            `;

            // 綁定返回按鈕
            const backBtn = document.getElementById('back-to-menu-btn');
            if (backBtn) {
                Game.EventManager.on(backBtn, 'click', () => this.showSettings(), {}, 'gameUI');
            }

            // 🆕 綁定提示按鈕事件
            const hintBtn = document.getElementById('c6-amount-hint-btn');
            if (hintBtn) {
                Game.EventManager.on(hintBtn, 'click', () => this.showC6AmountHint(), {}, 'gameUI');
            }

            // 🔊 播放語音提示
            Game.TimerManager.setTimeout(() => {
                const speechText = `你購買${item.name}共${itemPrice}元，你付了${walletAmount}元，需要找你${changeAmount}元`;
                Game.Debug.log('speech', `🗣️ 播放找零提示語音: "${speechText}"`);
                this.speech.speak(speechText);
            }, 500);

            Game.Debug.log('state', '✅ [C6-普通模式-步驟2] 頁面渲染完成');
        },

        generateC6ChangeOptions(correctChangeAmount) {
            Game.Debug.log('question', `🎲 [C6-選項生成] 生成找零選項，正確答案: ${correctChangeAmount}元`);

            const options = [];

            // 1. 正確答案
            const correctMoney = this.generateWalletMoney(correctChangeAmount);
            options.push({
                money: correctMoney,
                totalValue: correctChangeAmount,
                isCorrect: true
            });

            // 2. 錯誤選項1：隨機增加1-3元
            const wrongAmount1 = correctChangeAmount + (Math.floor(Math.random() * 3) + 1);
            const wrongMoney1 = this.generateWalletMoney(wrongAmount1);
            options.push({
                money: wrongMoney1,
                totalValue: wrongAmount1,
                isCorrect: false
            });

            // 3. 錯誤選項2：隨機減少1-2元（最少0元）
            // 🔧 修正：確保錯誤選項不會與正確答案重複
            let wrongAmount2;
            if (correctChangeAmount === 0) {
                // 如果正確答案是0元，錯誤選項應該是正數（隨機增加4-6元）
                wrongAmount2 = Math.floor(Math.random() * 3) + 4;
            } else {
                // 一般情況：隨機減少1-2元（最少0元），但確保不等於正確答案
                wrongAmount2 = Math.max(0, correctChangeAmount - (Math.floor(Math.random() * 2) + 1));
                // 如果結果與正確答案相同，則改為增加1元
                if (wrongAmount2 === correctChangeAmount) {
                    wrongAmount2 = correctChangeAmount + 1;
                }
            }
            const wrongMoney2 = wrongAmount2 === 0 ? [] : this.generateWalletMoney(wrongAmount2);
            options.push({
                money: wrongMoney2,
                totalValue: wrongAmount2,
                isCorrect: false
            });

            // 隨機排序選項
            const shuffled = options.sort(() => Math.random() - 0.5);

            Game.Debug.log('state', `✅ [C6-選項生成] 選項生成完成:`, shuffled.map(o => `${o.totalValue}元${o.isCorrect ? '(正確)' : ''}`));
            return shuffled;
        },

        // 🆕 顯示C6金額提示
        showC6AmountHint() {
            // 🔧 [修正] 如果已經回答過，不執行任何操作（避免打斷進入下一題的語音）
            if (this.state.gameState.questionAnswered) {
                Game.Debug.log('state', '🚫 [C6-提示] 已經回答過，忽略提示按鈕點擊');
                return;
            }

            Game.Debug.log('hint', '💡 [C6-普通模式] 顯示金額提示');

            // 🔧 [修正] 顯示每個選項下方的總計金額（不是個別金錢圖示面額）
            const amountDisplays = document.querySelectorAll('.option-amount-display');
            amountDisplays.forEach(display => {
                if (display.style.display === 'none' || display.style.display === '') {
                    display.style.display = 'block';
                    display.style.opacity = '1';
                    Game.Debug.log('hint', `💡 顯示選項總金額: ${display.textContent}`);
                } else {
                    display.style.display = 'none';
                    display.style.opacity = '0';
                    Game.Debug.log('ui', `🔒 隱藏選項總金額: ${display.textContent}`);
                }
            });

            // 播放語音提示
            if (this.speech && typeof this.speech.speak === 'function') {
                this.speech.speak('顯示金額提示', { interrupt: true });
            }
        },

        selectC6ChangeOption(optionIndex, isCorrect, changeAmount) {
            Game.Debug.log('state', `🎯 [C6-選項選擇] 選擇選項 ${optionIndex}, 正確性: ${isCorrect}, 金額: ${changeAmount}元`);

            // 防止重複點擊
            if (this.state.gameState.questionAnswered) {
                Game.Debug.log('state', '🚫 [C6-選項選擇] 已經回答過，忽略重複點擊');
                return;
            }

            const question = this.state.gameState.question;
            const correctAmount = question.changeAmount;

            // 標記為已回答
            this.state.gameState.questionAnswered = true;

            // 學習紀錄：逐題明細（題目＝找零金額）
            window.LearningTracker?.logStep?.(
                `第${this.state.quiz.currentQuestion}題：找零 ${correctAmount} 元`, isCorrect);

            // 取得選擇的選項元素
            const selectedOption = document.querySelector(`.change-option[data-option-index="${optionIndex}"]`);

            // 🔧 添加 clicked class 以顯示金額
            selectedOption.classList.add('clicked');

            if (isCorrect) {
                // ✅ 答對
                Game.Debug.log('state', '✅ [C6-選項選擇] 答對了！');

                selectedOption.classList.add('correct-selected');
                this.audio.playCorrectSound();
                this.startFireworksAnimation();

                // 播放成功語音
                const isLastQuestion = this.state.quiz.currentQuestion >= this.state.quiz.totalQuestions;
                const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                const speechText = `恭喜你答對了，找回${changeAmount}元，${endingText}`;
                this.speech.speak(speechText, {
                    callback: () => {
                        // 答對加分並進入下一題
                        this.state.quiz.score += 10;
                        Game.TimerManager.setTimeout(() => {
                            this.loadNextQuestion();
                        }, 2000);
                    }
                });
            } else {
                // ❌ 答錯
                Game.Debug.log('state', '❌ [C6-選項選擇] 答錯了！');

                // 🎯 步驟1：播放錯誤音效
                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                this.audio.playErrorSound();

                // 🎯 步驟2：立即顯示紅色×
                selectedOption.classList.add('incorrect-selected');
                Game.Debug.log('state', '❌ [C6-選項選擇] 顯示紅色×');

                const correctOption = document.querySelector('.change-option[data-is-correct="true"]');
                const mode = this.state.settings.mode;

                if (mode === 'single') {
                    // 單次作答：播放兩段語音並自動進入下一題
                    const firstSpeechText = changeAmount === 0 ?
                        '不對，你選的是不需找零' :
                        `不對，你選的是${changeAmount}元`;

                    this.speech.speak(firstSpeechText, {
                        callback: () => {
                            if (correctOption) {
                                correctOption.classList.add('correct-selected');
                            }
                            const isLastQuestion = this.state.quiz.currentQuestion >= this.state.quiz.totalQuestions;
                            const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                            const secondSpeechText = correctAmount === 0 ?
                                `正確答案是不需找零，${endingText}` :
                                `正確的找零應該是${correctAmount}元，${endingText}`;

                            this.speech.speak(secondSpeechText, {
                                callback: () => {
                                    Game.TimerManager.setTimeout(() => {
                                        Game.Debug.log('state', '➡️ 單次作答模式，自動前往下一題');
                                        this.loadNextQuestion();
                                    }, 1500);
                                }
                            });
                        }
                    });
                } else {
                    // 反復作答：精簡語音，允許重新選擇
                    this.speech.speak('不對喔，請再試一次', {
                        callback: () => {
                            selectedOption.classList.remove('incorrect-selected', 'clicked');
                            this.state.gameState.questionAnswered = false;
                            Game.Debug.log('state', '✅ [C6-選項選擇] 錯誤提示完成，可以重新選擇');
                        }
                    });
                }
            }
        },

        // ========== C6 困難模式：步驟2找零計算頁面 ==========

        renderC6HardModeStep2(question) {
            Game.Debug.log('ui', '🎨 [C6-困難模式-步驟2] 開始渲染找零計算頁面');
            const gameContainer = document.getElementById('app');
            const { item, itemPrice, walletAmount, changeAmount } = question;

            Game.Debug.log('ui', `📝 步驟2資訊: 商品${itemPrice}元, 付款${walletAmount}元, 找零${changeAmount}元`);

            // 初始化錯誤計數器
            if (!question.errorCount) {
                question.errorCount = 0;
            }

            // 組合完整 HTML（包含 CSS）
            gameContainer.innerHTML = `
                <style>${this.getCommonCSS()}${this.getC6HardModeStep2CSS()}</style>
                <div class="game-container">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span>第 ${this.state.quiz.currentQuestion} 題 / 共 ${this.state.quiz.totalQuestions} 題</span>
                        </div>
                        <div class="title-bar-center"><h2 style="margin: 0; color: inherit;">單元C6：找零與計算</h2></div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                        </div>
                    </div>

                    <div class="c6-hard-step2-container">
                        <!-- 商品資訊與計算機區域 -->
                        <div class="item-and-calc-row">
                            <!-- 商品資訊區域 -->
                            <div class="item-info-section">
                                <div class="section-title">🛍️ 購買物品</div>
                                <div class="item-info-compact" style="justify-content:center;">
                                    <span class="iic-img">${this.getItemImg(item, '180px')}</span>
                                    <span class="iic-name">${item.name}</span>
                                    <span class="iic-price">${itemPrice} 元</span><button class="quiz-speak-btn" onclick="event.stopPropagation();Game.speakQuestion()" title="朗讀題目">🔊</button>
                                </div>
                            </div>

                            <!-- 計算機區域 -->
                            <div class="calculator-area">
                                <!-- 計算機切換按鈕 -->
                                <div class="calculator-toggle">
                                    <button id="toggle-calculator-btn" class="calculator-btn">
                                        🧮 開啟計算機
                                    </button>
                                </div>

                                <!-- 計算機容器 -->
                                <div id="calculator-container" class="calculator-container" style="display: none;">
                                    ${this.getCalculatorHTML()}
                                </div>
                            </div>
                        </div>

                        <!-- 計算公式區域 -->
                        <div class="calculation-section">
                            <div class="section-title">💰 計算找零金額</div>
                            <div class="calculation-formula">
                                <span class="formula-text">${walletAmount}元 - ${itemPrice}元 = </span>
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
                            <button id="confirm-calculation-btn" class="c6-hard-confirm-btn" disabled>
                                確認答案
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // 綁定事件監聽器
            this.setupC6HardModeStep2Listeners(question);

            Game.Debug.log('state', '✅ [C6-困難模式-步驟2] 頁面渲染完成');
        },

        setupC6HardModeStep2Listeners(question) {
            Game.Debug.log('state', '🎯 [C6-困難模式-步驟2] 設置事件監聽器');

            const input = document.getElementById('change-input');
            const confirmBtn = document.getElementById('confirm-calculation-btn');
            const toggleCalcBtn = document.getElementById('toggle-calculator-btn');
            const calculatorContainer = document.getElementById('calculator-container');
            const backBtn = document.getElementById('back-to-menu-btn');

            let calculatorOpen = false;
            let calculatorState = {
                displayValue: '0',
                previousValue: null,
                operator: null,
                waitingForOperand: false,
                expression: ''
            };

            // 返回設定按鈕
            if (backBtn) {
                Game.EventManager.on(backBtn, 'click', (e) => {
                    e.preventDefault();
                    if (confirm('確定要返回設定頁面嗎？目前進度將會遺失。')) {
                        this.showSettings();
                    }
                }, {}, 'gameUI');
            }

            // 點擊輸入框顯示數字鍵盤
            Game.EventManager.on(input, 'click', () => {
                this.showNumberPad(input, confirmBtn, question.changeAmount);
            }, {}, 'gameUI');

            // 切換計算機
            Game.EventManager.on(toggleCalcBtn, 'click', () => {
                calculatorOpen = !calculatorOpen;
                calculatorContainer.style.display = calculatorOpen ? 'block' : 'none';
                toggleCalcBtn.textContent = calculatorOpen ? '🧮 關閉計算機' : '🧮 開啟計算機';

                if (calculatorOpen) {
                    // 每次打開時重置計算機狀態並重新綁定事件
                    calculatorState.displayValue = '0';
                    calculatorState.previousValue = null;
                    calculatorState.operator = null;
                    calculatorState.waitingForOperand = false;
                    calculatorState.expression = '';
                    this.setupCalculatorListeners(calculatorState);
                } else {
                    // 關閉時清空事件監聽器，避免重複綁定
                    const buttons = calculatorContainer.querySelectorAll('.calc-btn');
                    buttons.forEach(btn => {
                        const newBtn = btn.cloneNode(true);
                        btn.parentNode.replaceChild(newBtn, btn);
                    });
                }
            }, {}, 'gameUI');

            // 確認按鈕 - 只有答對才能進入下一步
            Game.EventManager.on(confirmBtn, 'click', () => {
                if (confirmBtn.disabled) return;
                confirmBtn.disabled = true;
                const userAnswer = parseInt(input.value);
                if (userAnswer === question.changeAmount) {
                    // 答對了，進入選擇題頁面
                    Game.Debug.log('state', '✅ [C6-困難模式-步驟2] 計算正確！');
                    this.audio.playCorrectSound();

                    // 播放成功語音
                    const speechText = `答對了！找零${question.changeAmount}元`;
                    this.speech.speak(speechText, {
                        callback: () => {
                            // 語音播放完畢後進入選擇題頁面
                            this.renderC6NormalStep2(question);
                        }
                    });
                } else {
                    // 答錯了，累加錯誤次數
                    question.errorCount++;
                    Game.Debug.log('state', `❌ [C6-困難模式-步驟2] 計算錯誤，錯誤次數: ${question.errorCount}`);
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this.audio.playErrorSound();

                    const correctAnswer = question.changeAmount;
                    const mode = this.state.settings.mode;
                    let speechText;

                    if (mode === 'single') {
                        // 單次作答：告知正確答案，然後進入下一題
                        const isLastQuestion = this.state.quiz.currentQuestion >= this.state.quiz.totalQuestions;
                        const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                        speechText = `對不起你答錯了，正確答案是${correctAnswer}元，${endingText}`;

                        this.speech.speak(speechText, {
                            callback: () => {
                                Game.TimerManager.setTimeout(() => {
                                    Game.Debug.log('state', '➡️ 單次作答模式，自動前往下一題');
                                    this.loadNextQuestion();
                                }, 1500);
                            }
                        });
                    } else {
                        // 反復作答：根據錯誤次數給予不同提示
                        if (question.errorCount < 3) {
                            // 前2次：只說"不對，請再試一次"
                            speechText = '不對，請再試一次';
                        } else {
                            // 第3次及以後：告知正確答案
                            speechText = `不對，正確答案是${correctAnswer}元，請再試一次`;
                        }

                        this.speech.speak(speechText, {
                            callback: () => {
                                // 清空輸入框，讓用戶重新輸入
                                input.value = '';
                                confirmBtn.disabled = true;
                            }
                        });
                    }
                }
            }, {}, 'gameUI');

            Game.Debug.log('state', '✅ [C6-困難模式-步驟2] 事件監聽器設置完成');
        },

        getC6HardModeStep2CSS() {
            return `
                /* ========== C6 困難模式步驟2：找零計算頁面樣式 ========== */

                .c6-hard-step2-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                    padding: 20px;
                    max-width: 1100px;
                    margin: 0 auto;
                    position: relative;
                }

                /* 商品資訊與計算機區域 */
                .item-and-calc-row {
                    position: relative;
                    display: grid;
                    grid-template-columns: 1fr 500px 1fr;
                    width: 100%;
                    min-height: 220px;
                }

                /* 商品資訊區域 */
                .item-info-section {
                    grid-column: 2;
                    width: 500px;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .item-info-section .section-title {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin: 0 0 15px 0;
                    color: #333;
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

                .item-info {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    background: white;
                    padding: 20px;
                    border-radius: 15px;
                    margin-top: 10px;
                }

                .item-emoji {
                    font-size: 4em;
                }

                .item-details {
                    flex: 1;
                }

                .item-name {
                    font-size: 1.8em;
                    font-weight: bold;
                    color: #2d3748;
                    margin-bottom: 5px;
                }

                .item-price {
                    font-size: 1.3em;
                    color: #718096;
                }

                /* 計算公式區域 */
                .calculation-section {
                    width: 500px;
                    max-width: 500px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                }

                .calculation-section .section-title {
                    color: white;
                    margin-bottom: 15px;
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

                /* 計算機切換按鈕 */
                .calculator-toggle {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .calculator-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 15px 25px;
                    border-radius: 25px;
                    font-size: 1.1em;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                    white-space: nowrap;
                }

                .calculator-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                }

                .calculator-btn:active {
                    transform: translateY(0);
                }

                /* 計算機容器 */
                .calculator-container {
                    width: 100%;
                }

                .calculator {
                    background: #2d3748;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                    max-width: 350px;
                    width: 100%;
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
                    background: #718096;
                }

                .operator-btn {
                    background: #f6ad55;
                    color: white;
                }

                .operator-btn:hover {
                    background: #ed8936;
                }

                .clear-btn {
                    background: #fc8181;
                    color: white;
                }

                .clear-btn:hover {
                    background: #f56565;
                }

                .equals-btn {
                    background: #48bb78;
                    color: white;
                }

                .equals-btn:hover {
                    background: #38a169;
                }

                /* 確認按鈕區域 */
                .confirm-section {
                    width: 500px;
                    max-width: 500px;
                    display: flex;
                    justify-content: center;
                    padding: 10px 0;
                }

                .c6-hard-confirm-btn {
                    padding: 18px 60px;
                    font-size: 1.3em;
                    font-weight: bold;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                    color: white;
                    box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
                }

                .c6-hard-confirm-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
                }

                .c6-hard-confirm-btn:active:not(:disabled) {
                    transform: translateY(0);
                }

                .c6-hard-confirm-btn:disabled {
                    background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
                    cursor: not-allowed;
                    box-shadow: none;
                }

                /* 響應式設計 */
                @media (max-width: 1000px) {
                    .c6-hard-step2-container {
                        padding: 15px;
                    }

                    .item-and-calc-row {
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
                        max-width: 100%;
                    }

                    .confirm-section {
                        width: 100%;
                        max-width: 100%;
                    }

                    .item-emoji {
                        font-size: 3em;
                    }

                    .item-name {
                        font-size: 1.5em;
                    }

                    .item-price {
                        font-size: 1.1em;
                    }

                    .formula-text {
                        font-size: 1.3em;
                    }

                    .change-input {
                        width: 80px;
                        height: 50px;
                        font-size: 1.5em;
                    }

                    .formula-unit {
                        font-size: 1.5em;
                    }

                    .calculator-btn {
                        padding: 12px 30px;
                        font-size: 1.1em;
                    }

                    .c6-hard-confirm-btn {
                        padding: 15px 40px;
                        font-size: 1.2em;
                    }
                }

                /* ========== 數字輸入器樣式 ========== */
                #number-pad-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10001;
                }

                .number-pad {
                    background: white;
                    border-radius: 20px;
                    padding: 25px;
                    max-width: 350px;
                    width: 90%;
                    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
                }

                .number-pad-display {
                    background: #f7fafc;
                    padding: 20px;
                    border-radius: 10px;
                    font-size: 2em;
                    font-weight: bold;
                    text-align: center;
                    min-height: 60px;
                    margin-bottom: 20px;
                    color: #2d3748;
                    border: 2px solid #cbd5e0;
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
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    background: #667eea;
                    color: white;
                    transition: all 0.2s ease;
                    box-shadow: 0 3px 8px rgba(102, 126, 234, 0.3);
                }

                .num-btn:hover {
                    background: #5a67d8;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 12px rgba(102, 126, 234, 0.4);
                }

                .num-btn:active {
                    transform: scale(0.95);
                }

                .num-btn.backspace-btn,
                .num-btn.clear-btn {
                    background: #fc8181;
                    grid-column: span 1;
                }

                .num-btn.backspace-btn:hover,
                .num-btn.clear-btn:hover {
                    background: #f56565;
                }

                .number-pad-footer {
                    margin-top: 15px;
                    display: flex;
                    gap: 10px;
                }

                .num-cancel-btn,
                .num-confirm-btn {
                    flex: 1;
                    padding: 15px;
                    font-size: 1.3em;
                    font-weight: bold;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .num-cancel-btn {
                    background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
                    color: white;
                    box-shadow: 0 4px 15px rgba(113, 128, 150, 0.3);
                }

                .num-cancel-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(113, 128, 150, 0.4);
                }

                .num-confirm-btn {
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                    color: white;
                    box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
                }

                .num-confirm-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
                }
            `;
        },

        // ========== C6 困難模式：計算彈窗（保留作為備用）==========

        showC6HardModeCalculationModal(question) {
            Game.Debug.log('ui', '🎨 [C6-困難模式] 顯示計算彈窗');
            const { item, itemPrice, walletAmount, changeAmount } = question;

            // 創建彈窗overlay
            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'calculation-modal-overlay';
            modalOverlay.innerHTML = `
                <div class="calculation-modal">
                    <div class="modal-header">
                        <h3>💰 計算找零金額</h3>
                    </div>
                    <div class="modal-body">
                        <div class="item-info">
                            <div class="item-emoji">${this.getItemImg(item, '2.5em')}</div>
                            <div class="item-details">
                                <div class="item-name">${item.name}</div>
                                <div class="item-price">價格: ${itemPrice} 元</div>
                            </div>
                        </div>
                        <div class="calculation-formula">
                            <span class="formula-text">${walletAmount}元 - ${itemPrice}元 = </span>
                            <input type="text"
                                   id="change-input"
                                   class="change-input"
                                   placeholder="?"
                                   inputmode="none"
                                   readonly>
                            <span class="formula-unit">元</span>
                        </div>
                        <div class="calculator-toggle">
                            <button id="toggle-calculator-btn" class="calculator-btn">
                                🧮 開啟計算機
                            </button>
                        </div>
                        <div id="calculator-container" class="calculator-container" style="display: none;">
                            ${this.getCalculatorHTML()}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="confirm-calculation-btn" class="confirm-btn" disabled>
                            確認答案
                        </button>
                    </div>
                </div>
            `;

            // 添加樣式
            const style = document.createElement('style');
            style.textContent = this.getCalculationModalCSS();
            document.head.appendChild(style);

            // 添加到頁面
            document.body.appendChild(modalOverlay);

            // 設置事件監聽器
            this.setupCalculationModalListeners(question);
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

        setupCalculationModalListeners(question) {
            const input = document.getElementById('change-input');
            const confirmBtn = document.getElementById('confirm-calculation-btn');
            const toggleCalcBtn = document.getElementById('toggle-calculator-btn');
            const calculatorContainer = document.getElementById('calculator-container');

            // 🆕 錯誤次數追踪
            let errorCount = 0;

            let calculatorOpen = false;
            let calculatorState = {
                displayValue: '0',
                previousValue: null,
                operator: null,
                waitingForOperand: false,
                expression: ''  // 🆕 添加完整表達式追踪
            };

            // 點擊輸入框顯示數字鍵盤
            Game.EventManager.on(input, 'click', () => {
                this.showNumberPad(input, confirmBtn, question.changeAmount);
            }, {}, 'gameUI');

            // 切換計算機
            Game.EventManager.on(toggleCalcBtn, 'click', () => {
                calculatorOpen = !calculatorOpen;
                calculatorContainer.style.display = calculatorOpen ? 'block' : 'none';
                toggleCalcBtn.textContent = calculatorOpen ? '🧮 關閉計算機' : '🧮 開啟計算機';

                if (calculatorOpen) {
                    // 🔧 每次打開時重置計算機狀態並重新綁定事件
                    calculatorState.displayValue = '0';
                    calculatorState.previousValue = null;
                    calculatorState.operator = null;
                    calculatorState.waitingForOperand = false;
                    calculatorState.expression = '';
                    this.setupCalculatorListeners(calculatorState);
                } else {
                    // 🔧 關閉時清空事件監聽器，避免重複綁定
                    const buttons = calculatorContainer.querySelectorAll('.calc-btn');
                    buttons.forEach(btn => {
                        const newBtn = btn.cloneNode(true);
                        btn.parentNode.replaceChild(newBtn, btn);
                    });
                }
            }, {}, 'gameUI');

            // 確認按鈕 - 只有答對才能關閉彈窗
            Game.EventManager.on(confirmBtn, 'click', () => {
                if (confirmBtn.disabled) return;
                confirmBtn.disabled = true;
                const userAnswer = parseInt(input.value);
                if (userAnswer === question.changeAmount) {
                    // 答對了，關閉彈窗，進入選擇題頁面
                    this.audio.playCorrectSound();

                    // 播放成功語音
                    const speechText = `答對了！找零${question.changeAmount}元`;
                    this.speech.speak(speechText, {
                        callback: () => {
                            // 語音播放完畢後關閉彈窗並進入步驟2
                            document.getElementById('calculation-modal-overlay').remove();
                            this.renderC6NormalStep2(question);
                        }
                    });
                } else {
                    // 答錯了，累加錯誤次數
                    errorCount++;
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this.audio.playErrorSound();

                    const correctAnswer = question.changeAmount;
                    let speechText;

                    // 根據錯誤次數給予不同提示
                    if (errorCount < 3) {
                        // 前2次：只說"不對，請再試一次"
                        speechText = '不對，請再試一次';
                    } else {
                        // 第3次及以後：告知正確答案
                        speechText = `不對，正確答案是${correctAnswer}元，請再試一次`;
                    }

                    this.speech.speak(speechText, {
                        callback: () => {
                            // 清空輸入框，讓用戶重新輸入
                            input.value = '';
                            confirmBtn.disabled = true;
                        }
                    });
                }
            }, {}, 'gameUI');
        },

        showNumberPad(input, confirmBtn, correctAnswer) {
            // 創建數字輸入器
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

            // 數字按鈕
            numBtns.forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    const value = btn.dataset.value;
                    currentValue += value;
                    display.textContent = currentValue;
                }, {}, 'gameUI');
            });

            // 退格按鈕
            Game.EventManager.on(backspaceBtn, 'click', () => {
                currentValue = currentValue.slice(0, -1);
                display.textContent = currentValue || '0';
            }, {}, 'gameUI');

            // 清除按鈕
            Game.EventManager.on(clearBtn, 'click', () => {
                currentValue = '';
                display.textContent = '0';
            }, {}, 'gameUI');

            // 取消按鈕
            Game.EventManager.on(cancelPadBtn, 'click', () => {
                numberPad.remove();
            }, {}, 'gameUI');

            // 確認按鈕
            Game.EventManager.on(confirmPadBtn, 'click', () => {
                input.value = currentValue;
                confirmBtn.disabled = !currentValue;
                numberPad.remove();
            }, {}, 'gameUI');
        },

        setupCalculatorListeners(state) {
            const display = document.getElementById('calculator-display');
            const expression = document.getElementById('calculator-expression');
            const buttons = document.querySelectorAll('.calc-btn');

            const updateDisplay = () => {
                display.textContent = state.displayValue;
                // 🆕 更新表達式顯示
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
                    // 🆕 開始新的表達式
                    if (nextOperator) {
                        state.expression = `${inputValue} ${nextOperator}`;
                    }
                } else if (state.operator) {
                    const currentValue = state.previousValue || 0;
                    const newValue = this.calculate(currentValue, inputValue, state.operator);

                    state.displayValue = String(newValue);
                    state.previousValue = newValue;

                    // 🆕 更新表達式
                    if (nextOperator) {
                        state.expression = `${newValue} ${nextOperator}`;
                    } else {
                        // 按了等號，清空表達式
                        state.expression = '';
                    }
                }

                state.waitingForOperand = true;
                state.operator = nextOperator;
                updateDisplay();
            };

            buttons.forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    const value = btn.dataset.value;
                    this.audio.playKeypadSound();

                    if (btn.classList.contains('number-btn')) {
                        inputDigit(parseInt(value));
                    } else if (btn.classList.contains('operator-btn')) {
                        performOperation(value);
                    } else if (btn.classList.contains('clear-btn')) {
                        clearCalculator();
                    } else if (btn.classList.contains('equals-btn')) {
                        performOperation(null);
                    }
                }, {}, 'gameUI');
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

        loadNextQuestion() {
            Game.Debug.log('state', '➡️ loadNextQuestion() 準備載入下一題');

            const currentIndex = this.state.quiz.currentQuestion - 1;
            const nextIndex = currentIndex + 1;

            Game.Debug.log('state', '📋 下一題準備:', {
                currentQuestionNumber: this.state.quiz.currentQuestion,
                currentIndex,
                nextIndex,
                totalQuestions: this.state.quiz.totalQuestions
            });

            // 檢查是否還有更多題目
            if (nextIndex >= this.state.quiz.questions.length) {
                Game.Debug.log('state', '🏁 已到達最後一題，準備顯示結果');
                this.showResults();
                return;
            }

            Game.Debug.log('state', `🔄 載入第 ${nextIndex + 1} 題...`);
            this.loadQuestion(nextIndex);
        },


        // 設置拖放功能
        setupDragAndDrop() {
            // 使用 setTimeout 確保 DOM 元素已完全渲染
            Game.TimerManager.setTimeout(() => {
                Game.Debug.log('ui', '🔧 開始設置拖放功能...');
                
                // 🔧 [新增] 設置點擊事件處理
                this.setupClickEventListeners();
                
                // 設置金錢拖曳事件
                const moneyItems = document.querySelectorAll('.money-item[draggable="true"]');
                Game.Debug.log('wallet', `💰 找到 ${moneyItems.length} 個可拖曳的金錢項目`);
                
                // 🔧 [性能修正] 只有在金錢元素存在時才設置TouchDragUtility
                if (moneyItems.length > 0) {
                    // 設置觸控拖拽支援
                    this.setupTouchDragSupport();
                } else {
                    Game.Debug.warn('state', '⚠️ 金錢元素尚未載入，將延遲設置TouchDragUtility');
                    // 如果金錢元素還沒載入，稍後再試
                    Game.TimerManager.setTimeout(() => {
                        Game.Debug.log('state', '🔄 延遲設置TouchDragUtility...');
                        this.setupTouchDragSupport();
                    }, 200);
                }
                
                moneyItems.forEach((item, index) => {
                    Game.Debug.log('state', `🎯 設置第 ${index + 1} 個金錢項目拖曳事件:`, item.dataset.value);
                    
                    Game.EventManager.on(item, 'dragstart', (e) => {
                        // 🔧 [修正] 開始拖曳時清除任何顯示中的錯誤訊息
                        this.clearAllMessages();

                        // 確保獲取到正確的金錢項目元素
                        const moneyItem = e.target.closest('.money-item');
                        if (moneyItem) {
                            Game.Debug.log('state', '🎯 開始拖曳金錢:', moneyItem.dataset.value);
                            e.dataTransfer.setData('text/plain', moneyItem.id);
                            e.dataTransfer.effectAllowed = 'move';
                            moneyItem.style.opacity = '0.5';

                            // 🆕 使用去背圖片作為拖曳預覽
                            const img = moneyItem.querySelector('img');
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
                                Game.TimerManager.setTimeout(() => dragImg.remove(), 0);
                            }
                        } else {
                            Game.Debug.error('❌ 找不到金錢項目元素');
                            e.preventDefault();
                        }
                    }, {}, 'dragSystem');

                    Game.EventManager.on(item, 'dragend', (e) => {
                        const moneyItem = e.target.closest('.money-item');
                        if (moneyItem) {
                            moneyItem.style.opacity = '1';
                        }
                    }, {}, 'dragSystem');
                });

                // 設置兌換區放置事件
                const dropZone = document.getElementById('payment-zone-area');
                Game.Debug.log('drag', '🛒 兌換區元素:', dropZone ? '找到' : '未找到');
                
                if (dropZone) {
                    Game.Debug.log('ui', '🔧 設置兌換區拖放事件...');
                    
                    Game.EventManager.on(dropZone, 'dragover', (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        dropZone.style.backgroundColor = '#e8f5e8';
                        dropZone.style.borderColor = '#4CAF50';
                        Game.Debug.log('state', '🎯 金錢正在兌換區上方');
                    }, {}, 'dragSystem');
                    
                    Game.EventManager.on(dropZone, 'dragleave', (e) => {
                        if (!dropZone.contains(e.relatedTarget)) {
                            dropZone.style.backgroundColor = '';
                            dropZone.style.borderColor = '';
                            Game.Debug.log('state', '🎯 金錢離開兌換區');
                        }
                    }, {}, 'dragSystem');
                    
                    Game.EventManager.on(dropZone, 'drop', (e) => {
                        e.preventDefault();
                        const moneyId = e.dataTransfer.getData('text/plain');
                        const moneyElement = document.getElementById(moneyId);
                        
                        Game.Debug.log('state', '🎯 嘗試放置金錢:', moneyId);
                        
                        if (moneyElement) {
                            const value = parseInt(moneyElement.dataset.value);
                            Game.Debug.log('wallet', '💰 成功放置金錢到兌換區:', value);
                            
                            // 移動金錢到兌換區
                            dropZone.appendChild(moneyElement);
                            
                            // 更新總金額
                            this.updatePaymentTotal();
                            
                            // 播放音效
                            this.audio.playDropSound();
                            
                            // 重置視覺效果
                            dropZone.style.backgroundColor = '';
                            dropZone.style.borderColor = '';
                        } else {
                            Game.Debug.error('❌ 找不到被拖曳的金錢元素:', moneyId);
                        }
                    }, {}, 'dragSystem');
                } else {
                    Game.Debug.error('❌ 找不到兌換區元素');
                }
                
                Game.Debug.log('state', '✅ 拖放功能設置完成');
            }, 100); // 100ms 延遲確保 DOM 準備就緒
        },

        // 🆕 計算當前總額（用於提示按鈕）
        calculateCurrentTotal() {
            const paymentZone = document.getElementById('payment-zone-area');
            if (paymentZone) {
                const moneyInZone = paymentZone.querySelectorAll('.money-item');
                let total = 0;
                moneyInZone.forEach(money => {
                    total += parseInt(money.dataset.value);
                });
                return total;
            }
            return 0;
        },

        // 更新付款總額
        updatePaymentTotal() {
            const paymentZone = document.getElementById('payment-zone-area');
            const currentPaymentElement = document.getElementById('current-payment');
            const currentTotalDisplayElement = document.getElementById('current-total-display');
            const paymentHint = document.getElementById('payment-hint');

            if (paymentZone && (currentPaymentElement || currentTotalDisplayElement)) {
                const moneyInZone = paymentZone.querySelectorAll('.money-item');
                let total = 0;

                moneyInZone.forEach(money => {
                    total += parseInt(money.dataset.value);
                });

                // 更新總額顯示（根據不同模式更新不同元素）
                if (currentPaymentElement) {
                    currentPaymentElement.textContent = total;
                }
                if (currentTotalDisplayElement && this.state.difficulty === 'hard') {
                    // 困難模式：只有在沒有顯示提示狀態時才更新總額
                    const hintButton = document.getElementById('hint-button');
                    if (hintButton && !hintButton.textContent.includes('隱藏')) {
                        currentTotalDisplayElement.textContent = total > 0 ? total : '？？？';
                    }
                }
                Game.Debug.log('wallet', '💰 更新付款總額:', total);
                
                // 控制提示文字顯示/隱藏
                if (paymentHint) {
                    if (moneyInZone.length > 0) {
                        // 有金錢時隱藏提示
                        paymentHint.style.display = 'none';
                        Game.Debug.log('hint', '💡 隱藏兌換區提示文字');
                    } else {
                        // 沒有金錢時顯示提示
                        paymentHint.style.display = 'block';
                        Game.Debug.log('hint', '💡 顯示兌換區提示文字');
                    }
                }
                
                // 更新遊戲狀態
                if (this.state.gameState) {
                    this.state.gameState.currentTotal = total;
                }
                
                // 🆕 音效/語音播放邏輯
                const { difficulty } = this.state.settings;
                if (difficulty === 'easy') {
                    // 簡單模式：取消之前的語音計時器，設置新的計時器
                    if (this.totalAmountSpeechTimer) {
                        Game.TimerManager.clearTimeout(this.totalAmountSpeechTimer);
                    }
                    
                    this.totalAmountSpeechTimer = Game.TimerManager.setTimeout(() => {
                        const voiceText = `目前總額${total}元`;
                        this.speech.speak(voiceText, { interrupt: false });
                        Game.Debug.log('speech', '🗣️ 播放總額語音:', voiceText);
                        
                        // 檢查是否是最後一個金錢（在語音播放時檢查，而不是提前檢查）
                        const moneySourceArea = document.getElementById('money-source-area');
                        const remainingMoney = moneySourceArea ? moneySourceArea.querySelectorAll('.money-item') : [];
                        const isLastMoney = remainingMoney.length === 0;
                        
                        // 如果是最後一個金錢，設置自動判斷
                        if (isLastMoney) {
                            Game.Debug.log('speech', '🗣️ 檢測到最後一個金錢，將在語音後執行自動判斷');
                            Game.TimerManager.setTimeout(() => {
                                this.checkEasyModeAutoJudgment();
                            }, 2000); // 給語音足夠時間播放完畢
                        }
                    }, 300); // 300ms延遲，如果快速拖拽會被取消並重新設置
                    
                } else if (difficulty === 'normal') {
                    // 普通模式：播放總額語音
                    const voiceText = `目前總額${total}元`;
                    this.speech.speak(voiceText, { interrupt: true });
                    Game.Debug.log('speech', '🗣️ 普通模式播放總額語音:', voiceText);
                    
                    // 普通模式直接執行自動判斷檢查
                    this.checkEasyModeAutoJudgment();
                    
                } else if (difficulty === 'hard') {
                    // 🆕 困難模式：播放選擇音效而不是語音，讓使用者自行計算
                    this.audio.playSelectSound();
                    Game.Debug.log('audio', '🔊 困難模式播放選擇音效 (不提供語音提示)');
                    
                    // 困難模式不執行自動判斷，用戶需要手動計算
                }
            }
        },

        // 簡單模式自動判斷功能
        checkEasyModeAutoJudgment() {
            const { difficulty } = this.state.settings;
            
            // 只在簡單模式執行自動判斷
            if (difficulty !== 'easy') return;
            
            const moneySourceArea = document.getElementById('money-source-area');
            const paymentZone = document.getElementById('payment-zone-area');
            
            if (!moneySourceArea || !paymentZone) return;
            
            // 檢查是否所有金錢都已放置到兌換區
            const remainingMoney = moneySourceArea.querySelectorAll('.money-item');
            if (remainingMoney.length > 0) return; // 還有錢未放置，不執行自動判斷
            
            const { question } = this.state.gameState;
            if (!question) return;
            
            const { itemPrice, item } = question;
            const currentTotal = this.state.gameState.currentTotal || 0;
            
            const isAffordable = currentTotal >= itemPrice;
            const itemName = item.name;
            
            Game.Debug.log('state', '🤖 簡單模式自動判斷:', {
                currentTotal,
                itemPrice,
                isAffordable,
                itemName
            });
            
            // 直接執行自動判斷（不需要額外延遲，因為已經通過語音回調控制時機）
            if (isAffordable) {
                // 足夠時：播放正確音效
                Game.Debug.log('state', '✅ 錢足夠，播放成功音效');
                if (!this.state.gameState.audioPlayed) {
                    this.audio.playCorrectSound();
                    this.state.gameState.audioPlayed = true; // 🔧 [修正] 標記音效已播放
                }

                // 🎆 啟動煙火動畫
                this.startFireworksAnimation();

                Game.TimerManager.setTimeout(() => {
                    this.handleJudgment(isAffordable, question, {
                        currentTotal,
                        itemPrice,
                        itemName
                    });
                }, 500); // 等待音效播放

            } else {
                // 不足時：播放錯誤音效
                Game.Debug.log('state', '❌ 錢不足，播放錯誤音效');
                if (!this.state.gameState.audioPlayed) {
                    this.audio.playError02Sound();
                    this.state.gameState.audioPlayed = true; // 🔧 [修正] 標記音效已播放
                }

                Game.TimerManager.setTimeout(() => {
                    this.handleJudgment(isAffordable, question, {
                        currentTotal,
                        itemPrice,
                        itemName
                    });
                }, 500); // 等待音效播放
            }
        },

        // DOM元素驗證函數
        verifyDOMElements() {
            const elements = {
                app: document.getElementById('app'),
                titleBar: document.querySelector('.title-bar'),
                backBtn: document.getElementById('back-to-menu-btn'),
                moneySourceArea: document.getElementById('money-source-area'),
                paymentZoneArea: document.getElementById('payment-zone-area'),
                currentPayment: document.getElementById('current-payment'),
                enoughBtn: document.getElementById('enough-btn'),
                notEnoughBtn: document.getElementById('not-enough-btn')
            };
            
            const verification = {};
            Object.entries(elements).forEach(([key, element]) => {
                verification[key] = {
                    exists: !!element,
                    visible: element ? element.offsetWidth > 0 && element.offsetHeight > 0 : false,
                    classList: element ? Array.from(element.classList) : []
                };
            });
            
            return verification;
        },

        // 判斷處理
        handleJudgment(userSaysEnough, question, autoJudgmentData = null) {
            Game.Debug.log('state', '🎯 handleJudgment() 被調用');
            Game.Debug.log('ui', '📝 判斷參數:', {
                userSaysEnough,
                questionAnswered: this.state.gameState.questionAnswered,
                currentQuestion: this.state.quiz.currentQuestion
            });
            
            // 🆕 在普通模式和困難模式下，檢查是否所有金錢都已放置到兌換區
            const difficulty = this.state.settings.difficulty;
            if (difficulty === 'normal' || difficulty === 'hard') {
                const moneySourceArea = document.getElementById('money-source-area');
                const paymentZone = document.getElementById('payment-zone-area');
                const remainingMoney = moneySourceArea ? moneySourceArea.querySelectorAll('.money-item') : [];
                const moneyInZone = paymentZone ? paymentZone.querySelectorAll('.money-item') : [];
                
                Game.Debug.log('state', `🔍 ${difficulty === 'normal' ? '普通' : '困難'}模式金錢檢查:`, {
                    remainingInSource: remainingMoney.length,
                    inExchangeZone: moneyInZone.length
                });
                
                // 檢查我的金錢區是否還有剩餘金錢
                if (remainingMoney.length > 0) {
                    Game.Debug.warn('state', `⚠️ ${difficulty === 'normal' ? '普通' : '困難'}模式：我的金錢區還有 ${remainingMoney.length} 個金錢未放置`);
                    const warningMessage = '請將我的金錢區的金錢全部放到兌換區，再按下按鈕';
                    
                    this.showMessage(warningMessage, 'warning', (hideMessage) => {
                        this.speech.speak(warningMessage, {
                            callback: () => {
                                hideMessage();
                            }
                        });
                    });
                    return; // 阻止繼續執行判斷邏輯
                }
                
                // 檢查兌換區是否有金錢（雙重保險）
                if (moneyInZone.length === 0) {
                    Game.Debug.warn('state', `⚠️ ${difficulty === 'normal' ? '普通' : '困難'}模式：兌換區沒有金錢`);
                    const warningMessage = '請先將你的金錢放到兌換區，再按下按鈕';
                    
                    this.showMessage(warningMessage, 'warning', (hideMessage) => {
                        this.speech.speak(warningMessage, {
                            callback: () => {
                                hideMessage();
                            }
                        });
                    });
                    return; // 阻止繼續執行判斷邏輯
                }
                
                Game.Debug.log('state', `✅ ${difficulty === 'normal' ? '普通' : '困難'}模式：所有金錢都已正確放置到兌換區`);
            }
            
            if (this.state.gameState.questionAnswered) {
                Game.Debug.log('state', '❌ 題目已回答，忽略重複點擊');
                return;
            }
            
            const { itemPrice, isAffordable, totalMoney } = question;
            const isCorrect = userSaysEnough === isAffordable;
            
            Game.Debug.log('state', '🔍 判斷邏輯分析:', {
                itemPrice,
                totalMoney,
                isAffordable,
                userSaysEnough,
                isCorrect,
                difference: totalMoney - itemPrice
            });

            if (isCorrect) {
                // 判斷正確
                Game.Debug.log('state', '✅ 判斷正確！');
                this.state.gameState.questionAnswered = true;
                
                // 如果不是自動判斷且音效未播放，播放正確音效
                if (!autoJudgmentData && !this.state.gameState.audioPlayed) {
                    this.audio.playCorrectSound();
                    this.state.gameState.audioPlayed = true; // 🔧 [修正] 標記音效已播放
                }
                
                const oldScore = this.state.quiz.score;
                this.state.quiz.score += 10;
                Game.Debug.log('state', `📈 分數更新: ${oldScore} → ${this.state.quiz.score}`);

                let message;
                if (autoJudgmentData) {
                    // 自動判斷使用新格式訊息
                    const { currentTotal, itemPrice, itemName } = autoJudgmentData;
                    if (userSaysEnough) {
                        // 錢夠的情況
                        // 🔧 [修正] 使用阿拉伯數字格式
                        message = `恭喜你！你的錢總共${currentTotal}元，可以買${itemPrice}元的${itemName}！`;
                    } else {
                        // 錢不夠的情況
                        // 🔧 [修正] 使用阿拉伯數字格式
                        message = `不好意思，你的錢總共${currentTotal}元，不能購買${itemPrice}元的${itemName}`;
                    }
                } else {
                    // 手動判斷使用原始格式訊息
                    message = userSaysEnough ? 
                        `正確！你的錢夠買${itemPrice}元的物品！` : 
                        `正確！你的錢不夠買${itemPrice}元的物品！`;
                }
                    
                const messageType = autoJudgmentData ? 
                    (userSaysEnough ? 'success' : 'error') : 'success';
                
                Game.Debug.log('ui', `💬 顯示${messageType === 'success' ? '成功' : '失敗'}訊息:`, message);
                
                // 使用回調系統同步消息視窗和語音
                this.showMessage(message, messageType, (hideMessage) => {
                    this.speech.speak(message, {
                        callback: () => {
                            // 語音播放完成後隱藏消息並前往下一題
                            hideMessage();
                            Game.TimerManager.setTimeout(() => {
                                Game.Debug.log('state', '➡️ 準備前往下一題');
                                this.nextQuestion();
                            }, 1000);
                        }
                    });
                });

            } else {
                // 判斷錯誤
                Game.Debug.log('state', '❌ 判斷錯誤！');
                
                // 如果不是自動判斷且音效未播放，播放錯誤音效
                if (!autoJudgmentData && !this.state.gameState.audioPlayed) {
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this.audio.playErrorSound();
                    this.state.gameState.audioPlayed = true; // 🔧 [修正] 標記音效已播放
                }
                
                const oldAttempts = this.state.quiz.attempts;
                this.state.quiz.attempts += 1;
                Game.Debug.log('state', `📉 錯誤次數更新: ${oldAttempts} → ${this.state.quiz.attempts}`);

                let message;
                if (autoJudgmentData) {
                    // 自動判斷使用新格式訊息
                    const { currentTotal, itemPrice, itemName } = autoJudgmentData;
                    // 🔧 [修正] 使用阿拉伯數字格式
                    message = userSaysEnough ? 
                        `不好意思，你的錢總共${currentTotal}元，不能購買${itemPrice}元的${itemName}！請再試一次` :
                        `恭喜你！你的錢總共${currentTotal}元，可以買${itemPrice}元的${itemName}！請再試一次`;
                } else {
                    // 手動判斷使用原始格式訊息
                    // 🔧 [修正] 使用阿拉伯數字格式
                    message = userSaysEnough ?
                        `錯誤！你的錢不夠買${itemPrice}元的物品！請再試一次` :
                        `錯誤！你的錢夠買${itemPrice}元的物品！請再試一次`;
                }
                    
                Game.Debug.log('ui', '💬 顯示錯誤訊息:', message);
                
                // 使用回調系統同步消息視窗和語音（錯誤情況不自動前往下一題）
                this.showMessage(message, 'error', (hideMessage) => {
                    this.speech.speak(message, {
                        callback: () => {
                            // 語音播放完成後隱藏消息
                            hideMessage();
                        }
                    });
                });
                
                Game.Debug.log('state', '⏳ 等待用戶重新選擇...');
            }
            
            Game.Debug.log('state', '📊 當前測驗狀態:', {
                currentQuestion: this.state.quiz.currentQuestion,
                totalQuestions: this.state.quiz.totalQuestions,
                score: this.state.quiz.score,
                attempts: this.state.quiz.attempts,
                questionAnswered: this.state.gameState.questionAnswered
            });
        },

        // 🔧 [新增] 點擊自訂題數輸入框時，觸發自訂按鈕
        handleCustomQuestionClick() {
            const customBtn = document.querySelector('[data-type="questions"][data-value="custom"]');
            if (customBtn) {
                customBtn.click();
            }
        },

        // 數字選擇器系統（採用unit2樣式）
        // 🎯 [F6標準] 顯示數字輸入器（3x4網格，內聯樣式）
        showNumberInput(title, callback, cancelCallback) {
            if (document.getElementById('number-input-popup')) return;

            const popupHTML = `
                <div id="number-input-popup" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;">
                    <div style="background:white; padding:20px; border-radius:15px; width:320px; text-align:center; position:relative;">
                        <button id="close-number-input" style="
                            position: absolute;
                            top: 10px;
                            right: 15px;
                            background: #ff4757;
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 30px;
                            height: 30px;
                            font-size: 1.2em;
                            font-weight: bold;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 2px 8px rgba(255, 71, 87, 0.3);
                            transition: all 0.2s ease;
                        " onmouseover="this.style.background='#ff3742'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='#ff4757'; this.style.transform='scale(1)'">×</button>
                        <h3 style="margin-top: 10px; color: #333;">${title}</h3>
                        <input type="text" id="number-display" readonly style="width:90%; font-size:2em; text-align:center; margin-bottom:15px; padding: 8px; border: 2px solid #ddd; border-radius: 8px;">
                        <div id="number-pad" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;"></div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', popupHTML);
            const pad = document.getElementById('number-pad');
            const display = document.getElementById('number-display');
            const closeBtn = document.getElementById('close-number-input');

            closeBtn.onclick = () => {
                document.getElementById('number-input-popup').remove();
                if (cancelCallback) cancelCallback();
            };

            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '清除', '0', '確認'].forEach(key => {
                const btn = document.createElement('button');
                btn.textContent = key;
                let btnStyle = 'padding: 15px; font-size: 1.2em; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;';
                if (key === '確認') {
                    btnStyle += 'background: #28a745; color: white; font-weight: bold;';
                } else if (key === '清除') {
                    btnStyle += 'background: #ffc107; color: #333; font-weight: bold;';
                } else {
                    btnStyle += 'background: #f8f9fa; color: #333;';
                }
                btn.style.cssText = btnStyle;
                btn.onclick = () => {
                    if (key === '清除') {
                        display.value = '';
                    } else if (key === '確認') {
                        if (display.value && callback(display.value)) {
                            document.getElementById('number-input-popup').remove();
                        }
                    } else {
                        if (display.value.length < 3) display.value += key;
                    }
                };
                pad.appendChild(btn);
            });
        },

        // =====================================================
        // CSS樣式函數（參照unit6）
        // =====================================================
        getCommonCSS() {
            return `
                /* 基礎樣式 - 參照unit6 */
                body {
                    background: linear-gradient(135deg, #87CEEB 0%, #B0E0E6 100%) !important;
                    margin: 0;
                    padding: 0;
                    font-family: 'Microsoft JhengHei', sans-serif;
                }
                /* 題目朗讀按鈕 */
                .quiz-speak-btn {
                    width: 36px; height: 36px; border-radius: 50%;
                    border: 2px solid #7c3aed; background: white; color: #7c3aed;
                    font-size: 1.1rem; cursor: pointer;
                    display: inline-flex; align-items: center; justify-content: center;
                    box-shadow: 0 2px 8px rgba(124,58,237,0.2);
                    transition: background 0.2s, color 0.2s; padding: 0;
                    flex-shrink: 0; vertical-align: middle; margin-left: 8px;
                }
                .quiz-speak-btn:hover { background: #7c3aed; color: white; }
                .quiz-speak-btn:active { transform: scale(0.92); }
                
                /* 標題列樣式 - 參照unit6 */
                .title-bar {
                    background: linear-gradient(135deg, #00aeff 0%, #3CB371 100%);
                    color: white;
                    padding: 15px 25px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: bold;
                    box-shadow: 0 2px 8px rgba(135, 206, 235, 0.2);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    transition: 0.3s ease;
                }
                
                .title-bar::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, #4CAF50, #8BC34A, #4CAF50);
                }
                
                /* 區域樣式 */
                .my-money-section, .exchange-section {
                    background: #FFFFFF;
                    margin: 10px;
                    padding: 20px;
                    border-radius: 10px;
                    border: 2px solid #4CAF50;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                
                /* 兌換區內部樣式 */
                .drop-zone-container {
                    background: linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%) !important;
                    border: 3px dashed #4CAF50 !important;
                    border-radius: 15px !important;
                    padding: 20px !important;
                    text-align: center !important;
                    min-height: 120px !important;
                    display: flex !important;
                    flex-wrap: wrap !important;
                    align-items: flex-start !important;
                    justify-content: center !important;
                    gap: 10px !important;
                    align-content: flex-start !important;
                }
                
                
                .section-title {
                    color: #333;
                    font-size: 1.4em;
                    margin-bottom: 15px;
                    text-align: center;
                }
                
                /* 金錢樣式 - 參照unit6 */
                .money-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 10px;
                    border: 2px solid #4CAF50;
                    border-radius: 12px;
                    background: white;
                    cursor: grab;
                    transition: all 0.3s ease;
                    margin: 5px;
                }
                
                .money-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                }
                
                .money-item img {
                    object-fit: contain;
                    margin-bottom: 8px;
                }
                
                /* 硬幣樣式 */
                .money-item.coin {
                    min-height: 120px;
                    min-width: 80px;
                }
                
                .money-item.coin img {
                    width: 50px !important;
                    height: 50px !important;
                    border-radius: 50% !important;
                }
                
                /* 紙鈔樣式 */
                .money-item.banknote {
                    min-height: 140px;
                    min-width: 120px;
                }
                
                .money-item.banknote img {
                    width: 100px !important;
                    height: auto !important;
                    max-height: 60px !important;
                    object-fit: contain !important;
                }
                
                /* 金額顯示 */
                .money-value {
                    font-weight: bold;
                    color: #2E7D32;
                    font-size: 12px;
                    text-align: center;
                }
                
                /* 錢幣容器 */
                .money-source-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    justify-content: center;
                    padding: 20px;
                    background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%);
                    border-radius: 10px;
                    min-height: 150px;
                }
                
                /* 返回主選單按鈕 - 同 C2 (unit6.css) */
                .back-to-menu-btn {
                    background: rgba(255,255,255,0.2);
                    color: var(--text-inverse, white);
                    border: 2px solid var(--text-inverse, white);
                    padding: 8px 16px;
                    border-radius: var(--radius-large, 8px);
                    cursor: pointer;
                    font-size: 0.9em;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }

                .back-to-menu-btn:hover {
                    background: var(--text-inverse, white);
                    color: var(--primary-color, #667eea);
                }
                
                /* 判斷按鈕樣式 - 供普通模式和困難模式使用 */
                .judgment-buttons {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    margin-top: 20px;
                }
                
                .judgment-btn {
                    padding: 15px 30px;
                    font-size: 1.2em;
                    font-weight: bold;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .enough-btn {
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    color: white;
                }
                
                .enough-btn:hover {
                    background: linear-gradient(135deg, #45a049, #4CAF50);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
                }
                
                .not-enough-btn {
                    background: linear-gradient(135deg, #f44336, #da190b);
                    color: white;
                }
                
                .not-enough-btn:hover {
                    background: linear-gradient(135deg, #da190b, #f44336);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);
                }

                /* 🔧 [新增] 錯誤提示動畫樣式（紅色×）- 從A4移植 */
                .money-item.show-error-x::before,
                .payment-money.show-error-x::before {
                    content: '✕';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 48px;
                    color: #ff0000;
                    font-weight: bold;
                    z-index: 1000;
                    text-shadow:
                        0 0 10px rgba(255, 0, 0, 0.8),
                        0 0 20px rgba(255, 0, 0, 0.6),
                        0 0 30px rgba(255, 0, 0, 0.4);
                    animation: error-pulse 0.5s ease-in-out infinite alternate;
                    pointer-events: none;
                }

                /* @keyframes error-pulse - moved to injectGlobalAnimationStyles() */

                .money-item.show-error-x,
                .payment-money.show-error-x {
                    position: relative;
                    border-color: #ff0000 !important;
                    box-shadow: 0 0 15px rgba(255, 0, 0, 0.5) !important;
                    animation: shake 0.3s ease-in-out;
                }

                /* @keyframes shake - moved to injectGlobalAnimationStyles() */

                /* 🔧 [新增] 正確提示：綠色打勾動畫 - 從A4移植 */
                .money-item.show-correct-tick {
                    position: relative !important;
                    z-index: 9998 !important;
                }

                .money-item.show-correct-tick::after,
                .wallet-money.show-correct-tick::after {
                    content: '✓';
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    width: 24px;
                    height: 24px;
                    background-color: #28a745;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: bold;
                    line-height: 1;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    z-index: 9999;
                    animation: correct-tick-appear 0.4s ease-out forwards;
                    pointer-events: none;
                }

                /* @keyframes correct-tick-appear - moved to injectGlobalAnimationStyles() */

                /* 🔧 [新增] 困難模式提示按鈕樣式 - 從A4移植 */
                .hint-btn {
                    background: linear-gradient(135deg, #FFA726, #FF9800);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    margin: 0;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
                }

                .hint-btn:hover {
                    background: linear-gradient(135deg, #FF9800, #F57C00);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
                }

                .hint-btn:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 10px rgba(255, 152, 0, 0.3);
                }

                /* 深色模式下的提示按鈕樣式 */
                [data-theme="dark"] .hint-btn {
                    background: linear-gradient(135deg, #FF8A65, #FF7043);
                    box-shadow: 0 4px 15px rgba(255, 112, 67, 0.3);
                }

                [data-theme="dark"] .hint-btn:hover {
                    background: linear-gradient(135deg, #FF7043, #FF5722);
                    box-shadow: 0 6px 20px rgba(255, 112, 67, 0.4);
                }
            `;
        },

        getEasyModeCSS() {
            return `
                /* 簡單模式特有樣式 */
                .unit5-easy-layout {
                    background: linear-gradient(135deg, #87CEEB 0%, #B0E0E6 100%);
                    min-height: 100vh;
                    padding: 10px;
                }
                
                .drop-zone-container {
                    background: linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%);
                    border: 3px dashed #4CAF50;
                    border-radius: 15px;
                    padding: 30px;
                    text-align: center;
                    min-height: 100px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .payment-hint {
                    font-size: 1.2em;
                    color: #666;
                    font-weight: bold;
                    width: 100%;
                    order: -1;
                }
                
                .current-total-display {
                    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
                    padding: 10px 20px !important;
                    border-radius: 10px !important;
                    margin: 15px auto 20px auto !important;
                    text-align: center !important;
                    font-size: 1.5em !important;
                    font-weight: 900 !important;
                    color: #333 !important;
                    border: 4px solid #FF8C00 !important;
                    box-shadow: 0 4px 15px rgba(255, 140, 0, 0.5) !important;
                    width: fit-content !important;
                    max-width: 400px !important;
                    letter-spacing: 1px !important;
                    display: block !important;
                }

                .current-total-display #current-payment,
                .current-total-display #current-total-display {
                    color: #FF0000 !important;
                    font-weight: 900 !important;
                    font-size: 1em !important;
                    text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.3) !important;
                }


            `;
        },

        // =====================================================
        // C6 找零與計算 - CSS 樣式
        // =====================================================
        getC6EasyModeCSS() {
            return `
                /* C6 簡單模式整體布局 - 參考 C5 */
                .c6-easy-layout {
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                }

                /* C6 步驟1容器 - 垂直布局（自然高度，參考 C5） */
                .c6-step1-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px;
                    width: 100%;
                    box-sizing: border-box;
                }

                /* 付款卡片 - 自然高度，不撐滿剩餘空間 */
                .item-payment-section {
                    display: flex;
                    flex-direction: column;
                }

                /* drop-zone 固定最小高度（參考 C5 drop-zone-container） */
                #payment-drop-zone {
                    min-height: 140px;
                }

                /* 整合卡片（商品資訊 + 付款區）與錢包卡片 - 參考 C5 樣式 */
                .item-payment-section,
                .wallet-section {
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    border: 2px solid #4CAF50;
                    width: 100%;
                    box-sizing: border-box;
                }

                .section-title {
                    font-size: 1.4em;
                    font-weight: bold;
                    margin: 0 0 10px 0;
                    color: #333;
                    text-align: center;
                }

                /* 整合卡片標題列（標題 + 提示按鈕） */
                .ip-title-row {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    margin-bottom: 8px;
                }
                .ip-title-row .section-title {
                    flex: 1;
                    text-align: center;
                }
                .ip-title-row > div:last-child {
                    position: absolute;
                    right: 0;
                }

                /* 緊湊橫排商品資訊 */
                .item-info-compact {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    background: #f0f7ff;
                    border-radius: 10px;
                    padding: 7px 12px;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                }
                .iic-img { display: inline-flex; align-items: center; }
                .iic-name { font-size: 1.25em; font-weight: bold; color: #2196F3; }
                .iic-price {
                    font-size: 1.25em; font-weight: bold; color: #FF5722;
                    background: #fff3e0; padding: 3px 12px;
                    border-radius: 8px; white-space: nowrap;
                }
                .iic-divider { color: #bbb; font-size: 1.2em; }
                .iic-paid {
                    font-size: 1.15em; font-weight: bold; color: #333;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    padding: 3px 12px; border-radius: 8px; white-space: nowrap;
                    border: 2px solid #FF8C00;
                }

                .payment-info {
                    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                    padding: 10px 20px;
                    border-radius: 10px;
                    text-align: center;
                    font-size: 1.4em;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 10px;
                    border: 3px solid #FF8C00;
                    width: fit-content;
                    margin-left: auto;
                    margin-right: auto;
                }

                .drop-zone {
                    position: relative;
                    background: linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%);
                    border: 3px dashed #4CAF50;
                    border-radius: 15px;
                    padding: 14px;
                    min-height: 130px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .drop-zone.drag-over {
                    background: linear-gradient(135deg, #c8e6c9 0%, #81c784 100%);
                    border-color: #2E7D32;
                    transform: scale(1.02);
                }

                /* 付款區疊加層：淡化提示 + 拖放的金錢 */
                .payment-overlay {
                    position: relative;
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    justify-content: center;
                    align-items: center;
                    min-height: 100px;
                }

                /* 淡化的提示金錢 - A4 風格 */
                .hint-money.faded {
                    opacity: 0.4;
                    filter: grayscale(80%);
                    pointer-events: none;
                    position: relative;
                    transition: all 0.3s ease;
                }

                /* 點亮的提示金錢 - A4 風格 */
                .hint-money.lit-up {
                    opacity: 1;
                    filter: grayscale(0%);
                    cursor: pointer;
                    pointer-events: auto;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .hint-money.lit-up:hover {
                    transform: scale(1.05);
                }

                .drop-hint {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 1.3em;
                    color: #666;
                    font-weight: bold;
                    pointer-events: none;
                    z-index: 0;
                }

                .drop-zone:has(.hint-money.lit-up) .drop-hint {
                    display: none;
                }

                /* 錢包區樣式 */
                .wallet-section {
                    min-height: 120px;
                }

                .wallet-container {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    justify-content: center;
                    align-items: center;
                    padding: 12px;
                    min-height: 100px;
                    background: #f5f5f5;
                    border-radius: 10px;
                }

                /* 金錢物件樣式 - 使用 C5 樣式 */
                .money-item {
                    width: 100px;
                    height: 100px;
                    cursor: grab;
                    transition: all 0.3s ease;
                    position: relative;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                    padding: 5px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .money-item:hover {
                    transform: translateY(-5px) scale(1.05);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
                }

                .money-item:active {
                    cursor: grabbing;
                    transform: scale(0.95);
                }

                .money-item img {
                    width: 85%;
                    height: 85%;
                    object-fit: contain;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
                }

                .money-value {
                    position: absolute;
                    bottom: 5px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 0.85em;
                    font-weight: bold;
                    color: #333;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    padding: 3px 10px;
                    border-radius: 8px;
                    white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .money-item.dragging {
                    opacity: 0.5;
                    transform: scale(0.9) rotate(5deg);
                }

                .wallet-money.hidden {
                    opacity: 0.3;
                    pointer-events: none;
                }

                /* C6 確認付款按鈕 */
                .c6-confirm-btn {
                    margin-top: 15px;
                    padding: 12px 30px;
                    font-size: 1.3em;
                    font-weight: bold;
                    color: white;
                    background: linear-gradient(135deg, #9E9E9E, #757575);
                    border: none;
                    border-radius: 12px;
                    cursor: not-allowed;
                    transition: all 0.3s ease;
                    width: fit-content;
                    min-width: 200px;
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                .c6-confirm-btn:not([disabled]) {
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    cursor: pointer;
                }

                .c6-confirm-btn:not([disabled]):hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
                }

                .c6-confirm-btn:not([disabled]):active {
                    transform: translateY(0);
                }

                /* ========== C6 步驟2：找零驗證頁面樣式 ========== */
                .game-container {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    box-sizing: border-box;
                }

                .c6-step2-container {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    gap: 10px;
                    padding: 8px 12px 12px;
                    width: 100%;
                    box-sizing: border-box;
                }

                .c6-purchase-info {
                    width: 100%;
                    box-sizing: border-box;
                }

                /* 共用區塊標題樣式 */
                .section-title {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin: 0 0 15px 0;
                    color: #333;
                    text-align: center;
                }

                /* 1️⃣ 購買物品區樣式 */
                .c6-purchase-info {
                    background: white;
                    border-radius: 15px;
                    padding: 14px 18px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }

                .calculation-display {
                    text-align: center;
                    padding: 10px;
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    border-radius: 10px;
                    margin-top: 8px;
                }

                .calc-text {
                    font-size: 1.8em;
                    font-weight: bold;
                    color: #1976D2;
                }

                /* 2️⃣ 店家找零區樣式 */
                .c6-change-area {
                    background: white;
                    border-radius: 15px;
                    padding: 14px 18px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    box-sizing: border-box;
                }

                .store-change {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    justify-content: center;
                    padding: 12px;
                    background: #f5f5f5;
                    border-radius: 10px;
                    min-height: 120px;
                }

                .change-money {
                    cursor: grab;
                }

                .change-money:active {
                    cursor: grabbing;
                }

                .change-money.dragging {
                    opacity: 0.5;
                    transform: scale(0.9) rotate(5deg);
                }

                .change-money.hidden {
                    opacity: 0.3;
                    pointer-events: none;
                }

                /* 3️⃣ 我的錢包區樣式 */
                .c6-my-wallet-area {
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }

                /* 🆕 錢包標題容器 */
                .wallet-header-container {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 15px;
                    min-height: 50px;
                    align-items: center;
                }

                /* 🆕 置中群組（讓「我的錢包」真正置中） */
                .wallet-center-group {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    transform: translateX(-75px); /* 向左偏移約「找回0元」寬度的一半，讓「我的錢包」置中 */
                }

                /* 🆕 「我的錢包」標題樣式 */
                .wallet-header-container .section-title {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #333;
                    white-space: nowrap;
                }

                /* 🆕 累計找回金額顯示（緊貼在「我的錢包」右側） */
                .change-total-display {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #333;
                    background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
                    padding: 8px 15px;
                    border-radius: 12px;
                    border: 3px solid #4CAF50;
                    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
                    white-space: nowrap;
                }

                /* 🆕 數字部分特別突出顯示 */
                .change-total-display .amount {
                    color: #e74c3c;
                    font-size: 1.2em;
                    font-weight: bold;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
                }

                .my-wallet-container {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    justify-content: center;
                    padding: 20px;
                    background: linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%);
                    border: 3px dashed #4CAF50;
                    border-radius: 15px;
                    min-height: 180px;
                }

                .wallet-target {
                    transition: all 0.3s ease;
                }

                .wallet-target.faded {
                    opacity: 0.4;
                    filter: grayscale(80%);
                    /* 🔧 移除 pointer-events: none，以允許拖放事件 */
                }

                .wallet-target.lit-up {
                    opacity: 1;
                    filter: grayscale(0%);
                    cursor: pointer;
                    pointer-events: auto;
                }

                .wallet-target.lit-up:hover {
                    transform: scale(1.05);
                }

                .wallet-target.drag-over {
                    transform: scale(1.1);
                    box-shadow: 0 8px 16px rgba(76, 175, 80, 0.4);
                }

                /* 隱藏元素（用於簡單/普通模式的錢包金錢） */
                .hidden {
                    display: none !important;
                }
            `;
        },

        getNormalModeCSS() {
            return `
                /* 普通模式特有樣式 */
                .unit5-normal-layout {
                    background: linear-gradient(135deg, #87CEEB 0%, #B0E0E6 100%);
                    min-height: 100vh;
                    padding: 10px;
                }
                
                /* 🆕 普通模式內聯總額顯示 */
                .unit5-normal-total-display-inline {
                    background: linear-gradient(45deg, #ff6b6b, #ffa500);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 25px;
                    font-size: 1.1em;
                    font-weight: bold;
                    margin-left: 15px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                    border: 3px solid #fff;
                    display: inline-block;
                    animation: totalAmountGlow 2s ease-in-out infinite alternate;
                }
                
                /* 總額數字特殊樣式 */
                .unit5-normal-total-display-inline #current-payment {
                    font-size: 1.3em;
                    font-weight: 900;
                    color: #ffff00;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
                }

                /* @keyframes totalAmountGlow - moved to injectGlobalAnimationStyles() */

                /* 響應式設計：小螢幕時縮小 */
                @media (max-width: 768px) {
                    .unit5-normal-total-display-inline {
                        font-size: 0.9em;
                        padding: 6px 12px;
                        margin-left: 10px;
                    }
                    
                    .unit5-normal-total-display-inline #current-payment {
                        font-size: 1.1em;
                    }
                }
                
                .unit5-normal-hint {
                    text-align: center;
                    color: #ff9800;
                    font-size: 1.2em;
                    margin-top: 15px;
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                }

                .current-total-display {
                    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
                    padding: 10px 20px !important;
                    border-radius: 10px !important;
                    margin: 15px auto 20px auto !important;
                    text-align: center !important;
                    font-size: 1.5em !important;
                    font-weight: 900 !important;
                    color: #333 !important;
                    border: 4px solid #FF8C00 !important;
                    box-shadow: 0 4px 15px rgba(255, 140, 0, 0.5) !important;
                    width: fit-content !important;
                    max-width: 400px !important;
                    letter-spacing: 1px !important;
                    display: block !important;
                }

                .current-total-display #current-payment,
                .current-total-display #current-total-display {
                    color: #FF0000 !important;
                    font-weight: 900 !important;
                    font-size: 1em !important;
                    text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.3) !important;
                }
            `;
        },

        getC6NormalStep2CSS() {
            return `
                /* ========== C6 普通模式步驟2：找零選擇題樣式（參考 A4）========== */

                /* 找零題目區域 */
                .change-question-area {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 8px 12px 6px 12px;
                    padding: 12px 20px;
                    border-radius: 16px;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                    text-align: center;
                }

                .change-title {
                    font-size: 1.4em;
                    font-weight: bold;
                    color: white;
                    margin-bottom: 6px;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
                }

                .change-amount-highlight {
                    font-size: 2.6em;
                    font-weight: 900;
                    color: #ffd700;
                    text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
                    margin: 4px 0;
                    padding: 8px 20px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    animation: pulse 2s ease-in-out infinite;
                }

                /* @keyframes pulse - moved to injectGlobalAnimationStyles() */

                /* 找零選項區域 */
                .change-options-area {
                    background: white;
                    margin: 6px 12px 10px 12px;
                    padding: 12px 16px;
                    border-radius: 16px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                }

                .change-options {
                    display: flex;
                    gap: 16px;
                    width: 100%;
                    margin-top: 0;
                }

                /* 每個選項卡片 */
                .change-option {
                    flex: 1;
                    min-width: 0;
                    background: linear-gradient(135deg, #f5f7fa 0%, #e3e8ef 100%);
                    border: 4px solid #cbd5e0;
                    border-radius: 16px;
                    padding: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    position: relative;
                    overflow: visible; /* 改為 visible 讓標記可以顯示在選項外 */
                    z-index: 1; /* 基礎層級 */
                }

                /* 只有未被選中的選項才有 hover 效果 */
                .change-option:hover:not(.correct-selected):not(.incorrect-selected) {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 12px 30px rgba(102, 126, 234, 0.3);
                    border-color: #667eea;
                }

                /* 被選中的選項：提高層級，禁用互動，確保標記位置穩定 */
                .change-option.correct-selected,
                .change-option.incorrect-selected {
                    z-index: 100;
                    pointer-events: none; /* 禁用點擊和hover */
                    transform: none !important; /* 禁用所有transform，確保標記位置不變 */
                }

                .change-option::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 6px;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .change-option:hover::before {
                    opacity: 1;
                }

                /* 選項內的金錢顯示 */
                .option-money-display {
                    min-height: 120px;
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    align-items: center;
                    flex-wrap: wrap;
                    padding: 15px;
                    background: white;
                    border-radius: 12px;
                    margin-bottom: 15px;
                    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                .option-money-display img {
                    transition: transform 0.2s ease;
                }

                .option-money-display img:hover {
                    transform: scale(1.1);
                }

                /* 🆕 金錢項目容器（包含圖片和標籤） */
                .option-money-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 5px;
                }

                /* 🆕 金額標籤樣式 */
                .option-money-item .money-label {
                    background: linear-gradient(135deg, #f39c12, #e67e22);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 10px;
                    font-size: 0.9em;
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
                    box-shadow: 0 2px 6px rgba(243, 156, 18, 0.3);
                }

                /* 🆕 提示按鈕樣式 */
                .c6-hint-btn {
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(243, 156, 18, 0.3);
                }

                .c6-hint-btn:hover {
                    background: linear-gradient(135deg, #e67e22, #d35400) !important;
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(243, 156, 18, 0.4);
                }

                .c6-hint-btn:active {
                    transform: scale(0.95);
                }

                /* 不需找零的顯示 */
                .no-change-display {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #718096;
                    padding: 20px;
                }

                /* 金額顯示 - 預設隱藏 */
                .option-amount-display {
                    font-size: 1.8em;
                    font-weight: bold;
                    color: #2d3748;
                    text-align: center;
                    padding: 10px;
                    background: linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%);
                    border-radius: 10px;
                    border: 2px solid #fc8181;
                    display: none; /* 預設隱藏 */
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                /* 點擊後顯示金額 */
                .change-option.clicked .option-amount-display,
                .change-option.correct-selected .option-amount-display,
                .change-option.incorrect-selected .option-amount-display {
                    display: block;
                    opacity: 1;
                }

                /* 正確選擇時的樣式 */
                .change-option.correct-selected {
                    background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
                    border-color: #48bb78;
                    /* 移除 correctPulse 動畫，避免影響標記位置 */
                    position: relative;
                }

                /* 正確選項：顯示綠色勾勾（選項上方） */
                .change-option.correct-selected::after {
                    content: '✓';
                    position: absolute;
                    top: -40px; /* 稍微提高位置 */
                    left: 50%;
                    transform: translateX(-50%); /* 固定最終位置 */
                    width: 60px;
                    height: 60px;
                    background-color: #28a745;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    font-weight: bold;
                    box-shadow: 0 8px 20px rgba(40, 167, 69, 0.6);
                    z-index: 1000; /* 提高層級確保在最上層 */
                    animation: checkmarkPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                }

                /* @keyframes checkmarkPop, correctPulse - moved to injectGlobalAnimationStyles() */

                .change-option.correct-selected .option-amount-display {
                    background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
                    border-color: #48bb78;
                    color: #22543d;
                }

                /* 錯誤選擇時的樣式 */
                .change-option.incorrect-selected {
                    background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
                    border-color: #fc8181;
                    /* 移除 shake 動畫，避免影響標記位置 */
                    position: relative;
                }

                /* 錯誤選項：顯示紅色叉叉（選項上方） */
                .change-option.incorrect-selected::after {
                    content: '✗';
                    position: absolute;
                    top: -40px; /* 稍微提高位置 */
                    left: 50%;
                    transform: translateX(-50%); /* 固定最終位置 */
                    width: 60px;
                    height: 60px;
                    background-color: #dc3545;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    font-weight: bold;
                    box-shadow: 0 8px 20px rgba(220, 53, 69, 0.6);
                    z-index: 1000; /* 提高層級確保在最上層 */
                    animation: crossPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                }

                /* @keyframes crossPop, shake - moved to injectGlobalAnimationStyles() */

                .change-option.incorrect-selected .option-amount-display {
                    background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
                    border-color: #fc8181;
                    color: #742a2a;
                }

                /* 響應式設計 */
                @media (max-width: 768px) {
                    .change-options {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .change-option {
                        min-width: auto;
                        max-width: none;
                    }

                    .change-amount-highlight {
                        font-size: 2.5em;
                    }

                    .change-title {
                        font-size: 1.5em;
                    }
                }
            `;
        },

        getCalculationModalCSS() {
            return `
                /* 計算彈窗樣式 */
                #calculation-modal-overlay {
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
                    animation: fadeIn 0.3s ease;
                }

                /* @keyframes fadeIn - moved to injectGlobalAnimationStyles() */

                .calculation-modal {
                    background: white;
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
                    animation: slideDown 0.3s ease;
                }

                /* @keyframes slideDown - moved to injectGlobalAnimationStyles() */

                .modal-header h3 {
                    text-align: center;
                    color: #667eea;
                    margin: 0 0 20px 0;
                    font-size: 1.8em;
                }

                .modal-body {
                    margin: 20px 0;
                }

                .item-info {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    background: #f7fafc;
                    padding: 20px;
                    border-radius: 15px;
                    margin-bottom: 20px;
                }

                .item-emoji {
                    font-size: 4em;
                }

                .item-details {
                    flex: 1;
                }

                .item-name {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #2d3748;
                    margin-bottom: 5px;
                }

                .item-price {
                    font-size: 1.2em;
                    color: #718096;
                }

                .calculation-formula {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 25px;
                    border-radius: 15px;
                    margin-bottom: 20px;
                }

                .formula-text {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: white;
                }

                .change-input {
                    width: 80px;
                    height: 50px;
                    font-size: 1.5em;
                    text-align: center;
                    border: 3px solid #ffd700;
                    border-radius: 10px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .change-input:focus {
                    outline: none;
                    border-color: #ffaa00;
                    box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
                }

                .formula-unit {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: white;
                }

                .calculator-toggle {
                    text-align: center;
                    margin: 20px 0;
                }

                .calculator-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-size: 1.1em;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                }

                .calculator-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                }

                .calculator-container {
                    margin: 20px 0;
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
                    background: #718096;
                }

                .operator-btn {
                    background: #f6ad55;
                    color: white;
                }

                .operator-btn:hover {
                    background: #ed8936;
                }

                .clear-btn {
                    background: #fc8181;
                    color: white;
                }

                .clear-btn:hover {
                    background: #f56565;
                }

                .equals-btn {
                    background: #48bb78;
                    color: white;
                }

                .equals-btn:hover {
                    background: #38a169;
                }

                .modal-footer {
                    display: flex;
                    justify-content: center;
                    margin-top: 25px;
                }

                .confirm-btn {
                    padding: 15px 50px;
                    font-size: 1.2em;
                    font-weight: bold;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                    color: white;
                    box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
                }

                .confirm-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
                }

                .confirm-btn:disabled {
                    background: #cbd5e0;
                    cursor: not-allowed;
                    box-shadow: none;
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
                    justify-content: center;
                    align-items: center;
                    z-index: 10001;
                }

                .number-pad {
                    background: white;
                    border-radius: 20px;
                    padding: 25px;
                    max-width: 350px;
                    width: 90%;
                    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
                }

                .number-pad-display {
                    background: #f7fafc;
                    padding: 20px;
                    border-radius: 10px;
                    font-size: 2em;
                    font-weight: bold;
                    text-align: center;
                    min-height: 60px;
                    margin-bottom: 20px;
                    color: #2d3748;
                    border: 2px solid #cbd5e0;
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
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    background: #667eea;
                    color: white;
                    transition: all 0.2s ease;
                    box-shadow: 0 3px 8px rgba(102, 126, 234, 0.3);
                }

                .num-btn:hover {
                    background: #5a67d8;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 12px rgba(102, 126, 234, 0.4);
                }

                .num-btn:active {
                    transform: scale(0.95);
                }

                .num-btn.backspace-btn,
                .num-btn.clear-btn {
                    background: #fc8181;
                    grid-column: span 1;
                }

                .num-btn.backspace-btn:hover,
                .num-btn.clear-btn:hover {
                    background: #f56565;
                }

                .number-pad-footer {
                    margin-top: 15px;
                    display: flex;
                    gap: 10px;
                }

                .num-cancel-btn,
                .num-confirm-btn {
                    flex: 1;
                    padding: 15px;
                    font-size: 1.3em;
                    font-weight: bold;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .num-cancel-btn {
                    background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
                    color: white;
                    box-shadow: 0 4px 15px rgba(113, 128, 150, 0.3);
                }

                .num-cancel-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(113, 128, 150, 0.4);
                }

                .num-confirm-btn {
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                    color: white;
                    box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
                }

                .num-confirm-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
                }

                /* 響應式設計 */
                @media (max-width: 768px) {
                    .calculation-modal {
                        padding: 20px;
                    }

                    .item-emoji {
                        font-size: 3em;
                    }

                    .formula-text {
                        font-size: 1.2em;
                    }

                    .calculator-buttons {
                        gap: 8px;
                    }

                    .calc-btn {
                        padding: 15px;
                        font-size: 1.1em;
                    }
                }
            `;
        },

        getHardModeCSS() {
            return `
                /* 困難模式特有樣式 */
                .unit5-hard-layout {
                    background: linear-gradient(135deg, #87CEEB 0%, #B0E0E6 100%);
                    min-height: 100vh;
                    padding: 10px;
                }
                
                /* 🆕 困難模式內聯總額顯示 - 與普通模式一致的樣式 */
                .unit5-hard-total-display-inline {
                    background: linear-gradient(45deg, #ff6b6b, #ffa500);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 25px;
                    font-size: 1.1em;
                    font-weight: bold;
                    margin-left: 15px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                    border: 3px solid #fff;
                    display: inline-block;
                    animation: totalAmountGlow 2s ease-in-out infinite alternate;
                }
                
                /* 困難模式提示按鈕互動效果 */
                .unit5-hard-total-display-inline:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 12px rgba(0,0,0,0.4);
                }

                /* 🆕 困難模式標題flex布局，讓提示按鈕靠右，總額置中 */
                .unit5-hard-section-title {
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                /* 🆕 困難模式主要內容置中對齊 */
                .unit5-hard-section-title > *:not(.hint-button-wrapper) {
                    text-align: center;
                }

                /* 🆕 提示按鈕絕對定位到右側 */
                .unit5-hard-section-title .hint-button-wrapper {
                    position: absolute;
                    right: 0;
                }


                .hint-toggle-btn {
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }

                .hint-toggle-btn:hover {
                    background: linear-gradient(135deg, #45a049 0%, #4CAF50 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                }

                .hint-toggle-btn:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }

                /* 🆕 當前總額顯示的特殊樣式 */
                #current-total-display {
                    font-size: 1.2em;
                    font-weight: 900;
                    color: #ffff00;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
                    transition: all 0.3s ease;
                }

                /* 問號樣式 */
                #current-total-display:contains("？？？") {
                    color: #ffaa00;
                    animation: questionPulse 2s ease-in-out infinite alternate;
                }

                /* @keyframes questionPulse - moved to injectGlobalAnimationStyles() */

                /* 總額數字特殊樣式 */
                .unit5-hard-total-display-inline #current-payment {
                    font-size: 1.3em;
                    font-weight: 900;
                    color: #ffff00;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
                }
                
                /* 提示文字樣式 */
                .unit5-hard-total-display-inline #hint-text {
                    font-size: 1.0em;
                    font-weight: bold;
                    color: #ffffff;
                }

                /* @keyframes totalAmountGlow - moved to injectGlobalAnimationStyles() */

                /* 響應式設計：小螢幕時縮小 */
                @media (max-width: 768px) {
                    .unit5-hard-total-display-inline {
                        font-size: 0.9em;
                        padding: 6px 12px;
                        margin-left: 10px;
                    }
                    
                    .unit5-hard-total-display-inline #current-payment {
                        font-size: 1.1em;
                    }
                }
                
                .unit5-hard-challenge-hint {
                    text-align: center;
                    color: #ff9800;
                    font-size: 1.2em;
                    margin-top: 15px;
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                }
                
                /* 困難模式下的金錢可拖拽 */
                .unit5-hard-source-item {
                    cursor: grab;
                }
                
                .unit5-hard-source-item:active {
                    cursor: grabbing;
                }
                
                .unit5-hard-source-item:hover {
                    transform: none;
                    box-shadow: none;
                }

                .current-total-display {
                    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
                    padding: 10px 20px !important;
                    border-radius: 10px !important;
                    margin: 15px auto 20px auto !important;
                    text-align: center !important;
                    font-size: 1.5em !important;
                    font-weight: 900 !important;
                    color: #333 !important;
                    border: 4px solid #FF8C00 !important;
                    box-shadow: 0 4px 15px rgba(255, 140, 0, 0.5) !important;
                    width: fit-content !important;
                    max-width: 400px !important;
                    letter-spacing: 1px !important;
                    display: block !important;
                }

                .current-total-display #current-payment,
                .current-total-display #current-total-display {
                    color: #FF0000 !important;
                    font-weight: 900 !important;
                    font-size: 1em !important;
                    text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.3) !important;
                }
            `;
        },

        // 設置觸控拖拽支援
        setupTouchDragSupport() {
            Game.Debug.log('state', '🎯 [C6-找零] 檢查 TouchDragUtility 狀態', {
                touchUtilityExists: !!window.TouchDragUtility,
                touchUtilityType: typeof window.TouchDragUtility
            });
            
            if (!window.TouchDragUtility) {
                Game.Debug.error('❌ [C6-找零] TouchDragUtility 未載入，觸控拖曳功能無法使用');
                return;
            }
            
            const gameArea = document.getElementById('app');
            if (!gameArea) return;
            
            // 🔧 [性能修正] 檢查金錢元素是否存在，避免無意義的註冊
            const moneyItems = document.querySelectorAll('.money-item[draggable="true"]');
            Game.Debug.log('state', '🎯 [C6-找零] 檢查金錢元素狀態:', {
                moneyItemsFound: moneyItems.length,
                gameAreaExists: !!gameArea
            });
            
            if (moneyItems.length === 0) {
                Game.Debug.warn('state', '⚠️ [C6-找零] 金錢元素尚未渲染，跳過TouchDragUtility註冊');
                return;
            }
            
            Game.Debug.log('state', '✅ [C6-找零] TouchDragUtility 已載入，開始註冊觸控拖曳');

            // 註冊可拖拽元素
            window.TouchDragUtility.registerDraggable(
                gameArea,
                '.money-item[draggable="true"]',
                {
                    onDragStart: (element, event) => {
                        const moneyItem = element.closest('.money-item');
                        if (!moneyItem) return false;

                        // 🔧 [修正] 開始拖曳時清除任何顯示中的錯誤訊息
                        this.clearAllMessages();

                        Game.Debug.log('state', '🎯 開始觸控拖曳金錢:', moneyItem.dataset.value);

                        // 設置視覺反饋
                        moneyItem.style.opacity = '0.5';

                        return true;
                    },
                    onDrop: (draggedElement, dropZone, event) => {
                        // 新增：C6專用放置框檢測
                        const itemInfo = {
                            coinValue: draggedElement.dataset.value,
                            denomination: draggedElement.dataset.denomination,
                            itemClass: draggedElement.className,
                            dropZoneClass: dropZone.className,
                            dropZoneId: dropZone.id
                        };
                        
                        if (dropZone.closest('#payment-zone-area')) {
                            Game.Debug.logPlacementDrop('手機端：錢幣放入付款區域', 'payment-zone-area', itemInfo);
                        } else if (dropZone.classList.contains('money-source') || dropZone.classList.contains('source-area')) {
                            Game.Debug.logPlacementDrop('手機端：錢幣返回來源區', 'money-source', itemInfo);
                        } else {
                            Game.Debug.logPlacementDrop('手機端：錢幣放入未知區域', 'unknown', itemInfo);
                        }
                        
                        Game.Debug.logMobileDrag('觸控放置', draggedElement, event, itemInfo);
                        
                        // 創建合成的放置事件
                        const syntheticDropEvent = {
                            target: dropZone,
                            preventDefault: () => {},
                            stopPropagation: () => {},
                            dataTransfer: {
                                getData: () => draggedElement.id
                            }
                        };
                        
                        // 處理放置到兌換區
                        if (dropZone.closest('#payment-zone-area')) {
                            Game.Debug.log('state', '🎯 觸控放置到兌換區');
                            this.handleMoneyDrop(syntheticDropEvent, draggedElement);
                        }
                    },
                    onDragEnd: (element, event) => {
                        const moneyItem = element.closest('.money-item');
                        if (moneyItem) {
                            moneyItem.style.opacity = '1';
                        }
                    }
                }
            );

            // 註冊放置區域
            const dropZone = document.getElementById('payment-zone-area');
            if (dropZone) {
                window.TouchDragUtility.registerDropZone(dropZone, () => true);
            }
        },

        // 處理金錢放置
        handleMoneyDrop(event, draggedElement) {
            const moneyId = event.dataTransfer.getData('text/plain') || draggedElement.id;
            const moneyElement = document.getElementById(moneyId);
            
            if (!moneyElement) {
                Game.Debug.error('找不到被拖曳的金錢元素:', moneyId);
                return;
            }

            const value = parseInt(moneyElement.dataset.value);
            if (isNaN(value)) {
                Game.Debug.error('金錢值無效:', moneyElement.dataset.value);
                return;
            }

            Game.Debug.log('wallet', '💰 處理金錢放置:', value, '元');

            // 移動金錢到付款區域
            const paymentZone = document.getElementById('payment-zone-area');
            if (paymentZone && moneyElement) {
                paymentZone.appendChild(moneyElement);
                Game.Debug.log('wallet', '💰 成功放置金錢到兌換區:', value);
            }
            
            // 更新總額並檢查是否完成
            this.updatePaymentTotal();
            this.checkPaymentCompletion();
        },

        // 添加金錢到付款區域的方法
        addMoneyToPaymentZone(moneyElement, value) {
            const paymentZone = document.getElementById('payment-zone-area');
            if (paymentZone && moneyElement) {
                paymentZone.appendChild(moneyElement);
                Game.Debug.log('wallet', '💰 成功放置金錢到兌換區:', value);
                
                // 更新總額並檢查是否完成
                this.updatePaymentTotal();
                this.checkPaymentCompletion();
            }
        },

        // 檢查付款完成狀態
        checkPaymentCompletion() {
            Game.Debug.log('state', '🔍 [C6點擊除錯] 檢查付款完成狀態');
            const { difficulty } = this.state.settings;
            
            // 簡單模式：自動判斷
            if (difficulty === 'easy') {
                this.checkEasyModeAutoJudgment();
                return;
            }
            
            // 普通和困難模式：只更新狀態，不自動判斷
            const moneySourceArea = document.getElementById('money-source-area');
            const paymentZone = document.getElementById('payment-zone-area');
            
            if (!moneySourceArea || !paymentZone) return;
            
            const remainingMoney = moneySourceArea.querySelectorAll('.money-item');
            const placedMoney = paymentZone.querySelectorAll('.money-item');
            
            Game.Debug.log('state', `🔍 [${difficulty}模式] 金錢狀態:`, {
                剩餘: remainingMoney.length,
                已放置: placedMoney.length
            });
            
            // 普通和困難模式不執行自動判斷，等待用戶手動選擇
        },

        // 🔧 [新增] 點擊事件處理系統
        // =====================================================
        
        // 設置點擊事件監聽器
        setupClickEventListeners() {
            Game.Debug.log('state', '🎯 [C6點擊除錯] 設置點擊事件監聽器');
            
            const gameContainer = document.getElementById('app');
            if (!gameContainer) {
                Game.Debug.error('❌ 找不到遊戲容器 #app');
                return;
            }

            // 創建點擊事件處理器
            this._clickEventHandler = (event) => {
                Game.Debug.log('drag', '🖱️ [C6點擊除錯] 容器點擊事件觸發', {
                    target: event.target.id || event.target.className,
                });

                // 查找金錢物品元素
                const moneyItem = event.target.closest('.money-item');
                if (moneyItem) {
                    Game.Debug.log('state', '✅ [C6點擊除錯] 發現金錢物品點擊，處理點擊邏輯');
                    event.stopPropagation();
                    event.preventDefault();
                    this.handleMoneyClick(moneyItem, event);
                }
            };

            // 綁定點擊事件
            Game.EventManager.on(gameContainer, 'click', this._clickEventHandler, { capture: true }, {}, 'gameUI');
            Game.Debug.log('state', '✅ [C6點擊除錯] 點擊事件已成功綁定到 #app');
        },

        // 處理金錢物品點擊
        handleMoneyClick(moneyItem, event) {
            Game.Debug.log('state', '🎯 [C6點擊除錯] handleMoneyClick 被呼叫', {
                moneyItem: moneyItem,
                value: moneyItem.dataset.value
            });

            // 檢查是否在源區域（可以點擊移動）
            const isInSourceArea = moneyItem.closest('#my-money-area, .my-money-area, [id*="money-source"]');
            const isInPaymentArea = moneyItem.closest('#payment-zone-area');

            Game.Debug.log('state', '🔍 [C6點擊除錯] 物品位置檢查', {
                isInSourceArea: !!isInSourceArea,
                isInPaymentArea: !!isInPaymentArea
            });

            if (isInSourceArea) {
                // 在源區域：處理點擊放置
                this.handleClickToPlace(moneyItem);
            } else if (isInPaymentArea) {
                // 在付款區域：處理點擊取回
                this.handleClickToReturn(moneyItem);
            } else {
                Game.Debug.log('state', 'ℹ️ [C6點擊除錯] 物品不在可操作區域');
            }
        },

        // 處理點擊放置到付款區域
        handleClickToPlace(sourceItem) {
            const currentTime = Date.now();
            const { lastClickTime, lastClickedElement, doubleClickDelay } = this.clickState;

            const isSameElement = lastClickedElement === sourceItem;
            const isWithinDoubleClickTime = (currentTime - lastClickTime) < doubleClickDelay;

            Game.Debug.log('state', '🔍 [C6點擊除錯] 雙擊檢測狀態', {
                currentTime,
                lastClickTime,
                timeDiff: currentTime - lastClickTime,
                doubleClickDelay,
                isSameElement,
                isWithinDoubleClickTime
            });

            if (isSameElement && isWithinDoubleClickTime) {
                // 雙擊：執行放置
                Game.Debug.log('state', '✅ [C6點擊除錯] 偵測到雙擊，執行放置');
                this.executeClickPlacement(sourceItem);
                
                // 重置點擊狀態
                this.resetClickState();
            } else {
                // 單擊：選擇物品
                Game.Debug.log('drag', '🔵 [C6點擊除錯] 第一次點擊，選擇物品');
                this.selectItem(sourceItem);
                
                // 更新點擊狀態
                this.clickState.lastClickTime = currentTime;
                this.clickState.lastClickedElement = sourceItem;
                
                // 播放選擇音效
                this.audio.playSelectSound();
            }
        },

        // 處理點擊取回
        handleClickToReturn(placedItem) {
            Game.Debug.log('drag', '🔙 [C6點擊除錯] 處理點擊取回', { placedItem });
            
            // 找到原始的源區域
            const sourceArea = document.querySelector('#my-money-area, .my-money-area, [id*="money-source"]');
            if (sourceArea && placedItem) {
                // 🔧 修正：保持原始位置順序，使用insertBefore來維持位置
                this.insertMoneyInOriginalPosition(sourceArea, placedItem);
                Game.Debug.log('state', '✅ [C6點擊除錯] 金錢已取回到源區域並維持位置');
                
                // 更新總額
                this.updatePaymentTotal();
                
                // 播放音效
                this.audio.playSelectSound();
            } else {
                Game.Debug.error('❌ 找不到源區域或物品元素');
            }
        },

        // 🔧 新增：將金錢插入到原始位置，維持順序
        insertMoneyInOriginalPosition(container, moneyItem) {
            const itemValue = parseInt(moneyItem.dataset.value);
            const existingItems = Array.from(container.querySelectorAll('.money-item'));
            
            Game.Debug.log('state', '🔍 [C6位置修復] 嘗試維持金錢位置', {
                返回金錢面額: itemValue,
                容器內現有金錢數: existingItems.length
            });
            
            // 找到合適的插入位置（按面額排序：1, 5, 10, 50, 100...）
            let insertBeforeElement = null;
            for (let i = 0; i < existingItems.length; i++) {
                const existingValue = parseInt(existingItems[i].dataset.value);
                if (existingValue > itemValue) {
                    insertBeforeElement = existingItems[i];
                    Game.Debug.log('drag', `📍 [C6位置修復] 插入${itemValue}元到${existingValue}元之前`);
                    break;
                }
            }
            
            if (insertBeforeElement) {
                // 插入到指定位置之前
                container.insertBefore(moneyItem, insertBeforeElement);
            } else {
                // 插入到最後位置
                container.appendChild(moneyItem);
                Game.Debug.log('drag', `📍 [C6位置修復] ${itemValue}元插入到最後位置`);
            }
        },

        // 執行點擊放置
        executeClickPlacement(sourceItem) {
            Game.Debug.log('state', '🎯 [C6點擊除錯] 執行點擊放置', { 
                sourceItem: sourceItem,
                value: sourceItem.dataset.value 
            });

            // 創建一個模擬的拖放事件
            const mockEvent = {
                dataTransfer: {
                    getData: () => sourceItem.id
                }
            };

            // 調用現有的金錢放置處理邏輯
            this.handleMoneyDrop(mockEvent, sourceItem);
            
            Game.Debug.log('state', '✅ [C6點擊除錯] 點擊放置執行完成');
        },

        // 選擇物品（視覺反饋）
        selectItem(item) {
            // 清除之前的選擇
            this.clearSelection();
            
            // 選擇當前物品
            item.classList.add('selected-item');
            this.clickState.selectedItem = item;
            
            Game.Debug.log('state', '✅ [C6點擊除錯] 物品已選擇');
        },

        // 清除選擇狀態
        clearSelection() {
            if (this.clickState.selectedItem) {
                this.clickState.selectedItem.classList.remove('selected-item');
                this.clickState.selectedItem = null;
                Game.Debug.log('state', '🧹 [C6點擊除錯] 選擇狀態已清除');
            }
        },

        // 重置點擊狀態
        resetClickState() {
            this.clickState.lastClickTime = 0;
            this.clickState.lastClickedElement = null;
            this.clearSelection();
        },
        
        // =====================================================
        // 🎆 煙火動畫系統（與F4統一）
        // =====================================================
        startFireworksAnimation() {
            Game.Debug.log('ui', '🎆 開始煙火動畫');
            
            // 🎆 使用canvas-confetti效果（兩波）
            if (window.confetti) {
                Game.Debug.log('ui', '🎆 觸發canvas-confetti慶祝效果');
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                
                // 延遲觸發第二波煙火
                Game.TimerManager.setTimeout(() => {
                    confetti({
                        particleCount: 100,
                        spread: 60,
                        origin: { y: 0.7 }
                    });
                }, 200);
            } else {
                Game.Debug.log('ui', '🎆 canvas-confetti不可用');
            }
        }
    };

    // 將 Game 物件暴露到全域，以便 HTML 內聯事件可以訪問
    window.Game = Game;

    // 👆 輔助點擊模式（AssistClick）— 獨立區塊，不影響其他模式
    // ============================================================
    const AssistClick = {
        _overlay: null, _handler: null, _touchHandler: null,
        _queue: [], _step: 0, _enabled: false,
        _observer: null, _bodyObserver: null, _lastHighlighted: null,

        activate() {
            if (this._overlay) return;
            const tbEl = document.querySelector('.title-bar');
            const tbBottom = tbEl ? Math.round(tbEl.getBoundingClientRect().bottom) : 60;
            this._overlay = document.createElement('div');
            this._overlay.id = 'assist-click-overlay';
            this._overlay.style.cssText = `position:fixed;top:${tbBottom}px;left:0;right:0;bottom:0;z-index:10100;pointer-events:all;touch-action:none;background:transparent;cursor:pointer;`;
            document.body.appendChild(this._overlay);
            this._handler = (e) => { e.stopPropagation(); this._executeStep(); };
            this._touchHandler = (e) => { e.preventDefault(); e.stopPropagation(); this._executeStep(); };
            this._overlay.addEventListener('click', this._handler);
            this._overlay.addEventListener('touchend', this._touchHandler, { passive: false });
            this._enabled = true;
            this._startObserver();
            window.setTimeout(() => { if (this._enabled) this.buildQueue(); }, 300);
        },

        deactivate() {
            if (this._overlay) {
                this._overlay.removeEventListener('click', this._handler);
                this._overlay.removeEventListener('touchend', this._touchHandler);
                this._overlay.remove();
                this._overlay = null;
            }
            if (this._observer) { this._observer.disconnect(); this._observer = null; }
            if (this._bodyObserver) { this._bodyObserver.disconnect(); this._bodyObserver = null; }
            this._clearHighlight();
            this._queue = []; this._step = 0; this._enabled = false;
            this._handler = null; this._touchHandler = null;
        },

        buildQueue() {
            if (!this._enabled) return;

            // === 優先：關閉任務彈窗 ===
            const instructionOverlay = document.getElementById('c6-instruction-overlay');
            if (instructionOverlay) {
                this._queue = [{ target: null, action: () => {
                    instructionOverlay.style.opacity = '0';
                    Game.TimerManager.setTimeout(() => {
                        if (document.body.contains(instructionOverlay)) document.body.removeChild(instructionOverlay);
                        // 彈窗移除後重建佇列（body 外不在 MutationObserver 範圍內）
                        window.setTimeout(() => { if (this._enabled) this.buildQueue(); }, 100);
                    }, 300, 'ui');
                }}];
                this._step = 0;
                // 彈窗本身已覆蓋遮罩，無需高亮
                return;
            }

            // === 步驟2：找零收集 ===
            const changeMoney = document.querySelector('.change-money:not(.hidden)');
            const walletTarget = document.querySelector('.wallet-target.faded');
            if (changeMoney && walletTarget) {
                const q = Game.state && Game.state.gameState && Game.state.gameState.question;
                this._queue = [{ target: changeMoney, action: () => {
                    const changeId = changeMoney.dataset.changeId;
                    const moneyValue = parseInt(changeMoney.dataset.moneyValue);
                    walletTarget.classList.remove('faded');
                    walletTarget.classList.add('lit-up');
                    walletTarget.dataset.changeId = changeId;
                    changeMoney.classList.add('hidden');
                    Game.audio.playDropSound();
                    Game.playChangeSpeech(moneyValue, q);
                }}];
                this._step = 0;
                this._highlight(changeMoney);
                return;
            }

            // === 步驟1：付款 ===
            const q = Game.state && Game.state.gameState && Game.state.gameState.question;
            if (!q) return;
            const { paymentHint } = q;
            if (!paymentHint || paymentHint.length === 0) return;
            const paymentMoneyContainer = document.getElementById('payment-money-container');
            const confirmBtn = document.getElementById('c6-confirm-payment');
            if (!paymentMoneyContainer) return;
            // 找下一枚尚未放入的硬幣（單步模式）
            const nextHint = paymentHint.find(hint => {
                const hintMoney = Array.from(paymentMoneyContainer.querySelectorAll('.hint-money.faded'))
                    .find(h => parseInt(h.dataset.value) === hint.value && !h.dataset.walletId);
                return !!hintMoney;
            });
            if (nextHint) {
                const walletEl = Array.from(document.querySelectorAll('.wallet-money:not(.hidden)'))
                    .find(el => parseInt(el.dataset.value) === nextHint.value);
                if (walletEl) {
                    this._queue = [{ target: walletEl, action: () => this._placeC6Coin(walletEl, nextHint.value, q) }];
                    this._step = 0;
                    this._highlight(walletEl);
                    return;
                }
            }
            // 所有硬幣已放入，顯示確認按鈕
            if (confirmBtn && !confirmBtn.disabled) {
                this._queue = [{ target: confirmBtn, action: () => confirmBtn.click() }];
                this._step = 0;
                this._highlight(confirmBtn);
            }
        },

        _placeC6Coin(moneyEl, value, question) {
            const paymentMoneyContainer = document.getElementById('payment-money-container');
            if (!paymentMoneyContainer) return;
            const hintMoney = Array.from(paymentMoneyContainer.querySelectorAll('.hint-money.faded'))
                .find(h => parseInt(h.dataset.value) === value && !h.dataset.walletId);
            if (hintMoney) {
                hintMoney.classList.remove('faded');
                hintMoney.classList.add('lit-up');
                hintMoney.dataset.walletId = moneyEl.id;
                moneyEl.classList.add('hidden');
                if (typeof Game.updateC6Payment === 'function') Game.updateC6Payment(question);
            }
        },

        _executeStep() {
            if (!this._enabled || this._step >= this._queue.length) return;
            const step = this._queue[this._step];
            this._clearHighlight();
            this._step++;
            if (step && step.action) step.action();
            if (this._step < this._queue.length) {
                window.setTimeout(() => {
                    if (this._enabled && this._step < this._queue.length) {
                        this._highlight(this._queue[this._step].target);
                    }
                }, 600);
            } else {
                this._queue = []; this._step = 0;
            }
        },

        _startObserver() {
            const app = document.getElementById('app');
            if (!app) return;
            let t = null;
            const cb = () => {
                if (!this._enabled || this._queue.length > 0) return;
                if (t) window.clearTimeout(t);
                t = window.setTimeout(() => {
                    if (this._enabled) this.buildQueue();
                }, 400);
            };
            this._observer = new MutationObserver(cb);
            this._observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
            // 也監聽 body 直接子節點，以偵測任務彈窗的出現/消失
            this._bodyObserver = new MutationObserver(cb);
            this._bodyObserver.observe(document.body, { childList: true });
        },

        _highlight(el) {
            this._clearHighlight();
            if (!el) return;
            el.classList.add('assist-click-hint');
            this._lastHighlighted = el;
        },

        _clearHighlight() {
            if (this._lastHighlighted) { this._lastHighlighted.classList.remove('assist-click-hint'); this._lastHighlighted = null; }
            document.querySelectorAll('.assist-click-hint').forEach(e => e.classList.remove('assist-click-hint'));
        }
    };

    // 啟動遊戲
    Game.init();
});
