// =================================================================
// FILE: js/c5_sufficient_payment.js - 單元C5：足額付款
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
        // 🐛 Debug System - 統一日誌系統（FLAGS 分類開關）
        // =====================================================
        Debug: {
            // 分類開關（預設全關，error 永遠顯示）
            FLAGS: {
                all: false,       // 全開/全關主開關
                init: false,      // 初始化流程
                speech: false,    // 語音系統
                audio: false,     // 音效系統
                ui: false,        // UI 渲染
                payment: false,   // 付款驗證
                drag: false,      // 拖放操作
                touch: false,     // 觸控事件
                question: false,  // 題目生成
                state: false,     // 狀態轉換
                wallet: false,    // 錢包操作
                hint: false,      // 提示系統
                event: false,     // 事件監聽
                judge: false,     // 判斷邏輯（夠/不夠）
                error: true       // 錯誤永遠顯示
            },

            // 統一日誌方法
            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[C5-${category}]`, ...args);
                }
            },

            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[C5-${category}]`, ...args);
                }
            },

            error(...args) {
                console.error('[C5-ERROR]', ...args);
            },

            // 手機端拖曳除錯專用方法
            logMobileDrag(phase, element, event, data = null) {
                if (!this.FLAGS.all && !this.FLAGS.drag) return;
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

                console.log(`[C5-drag]`, phase, {
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

                console.log(`[C5-touch]`, eventType, eventInfo);
            },

            // C5專用放置框檢測方法
            logPlacementDrop(action, zoneType, itemInfo = null) {
                if (!this.FLAGS.all && !this.FLAGS.drag) return;
                console.log(`[C5-drag]`, `放置框: ${action} - 區域: ${zoneType}`, itemInfo || '');
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
            if (document.getElementById('c5-global-animations')) return;

            const style = document.createElement('style');
            style.id = 'c5-global-animations';
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

                /* ===== 金額顯示動畫 ===== */
                @keyframes totalAmountGlow {
                    0% { box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 10px rgba(255,255,255,0.5); }
                    100% { box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.8); }
                }
                @keyframes questionPulse {
                    from { opacity: 0.7; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1.02); }
                }
            `;
            document.head.appendChild(style);
            Game.Debug.log('init', '🎬 全局動畫樣式注入完成（8 個動畫）');
        },

        // =====================================================
        // 狀態管理系統（參考unit4架構）
        // =====================================================
        state: {
            settings: {
                digits: null,           // 物品價格位數（1-4位 或 'custom'）
                customAmount: 0,     // 🆕 自訂金額，預設0元（當digits='custom'時使用）
                denominations: [],   // 可用的錢幣面額
                difficulty: null,  // 難度：easy, normal, hard
                mode: null,    // 模式：repeated, single
                itemTypes: [],       // 物品類型：toys, food, stationery
                questionCount: null,    // 題目數量：5, 10, 15, 20, or custom number
                assistClick: false,
                usingPreset: false
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
            isProcessing: false,       // 🔧 [防連點] 處理中旗標
            isProcessingDrop: false,   // 🔧 [防連點] 拖放處理中旗標
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
        // 音效和語音系統（繼承unit4）
        // =====================================================
        audio: {
            dropSound: null,
            errorSound: null,
            correctSound: null,
            successSound: null,
            clickSound: null,
            selectSound: null,
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
                Game.Debug.log('state', '🎯 [C5-價格策略] Session重設，價格將重新生成');
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
                Game.Debug.log('audio', '✅ 音效系統初始化完成');

                Game.Debug.log('speech', '🗣️ 初始化語音系統...');
                this.speech.init();
                Game.Debug.log('speech', '✅ 語音系統初始化完成');

                Game.Debug.log('init', '📊 初始化遊戲數據...');
                this.initGameData();
                Game.Debug.log('init', '✅ 遊戲數據初始化完成');

                Game.Debug.log('init', '⚙️ 顯示設定頁面...');
                this.showSettings();
                Game.Debug.log('init', '✅ 設定頁面顯示完成');

                Game.Debug.log('init', '🎉 遊戲系統初始化成功');

                // 監控系統狀態（清除舊的 monitoring 計時器避免累積）
                Game.TimerManager.clearByCategory('monitoring');
                this.startSystemMonitoring();

            } catch (error) {
                Game.Debug.error('❌ 遊戲系統初始化失敗:', error);
                Game.Debug.error('堆疊追蹤:', error.stack);

                // 嘗試恢復
                Game.TimerManager.setTimeout(() => {
                    Game.Debug.log('init', '🔄 嘗試重新初始化...');
                    this.init();
                }, 2000);
            }
        },

        // 初始化遊戲數據
        initGameData() {
            Game.Debug.log('init', '📊 initGameData() 初始化遊戲數據');
            
            this.gameData = {
                // 物品數據庫
                purchaseItems: {
                    // 1位數 (1-9元) 物品
                    candy: [
                        { id: 'candy_lollipop', name: '棒棒糖', img: 'icon-c5-lollipop', emoji: '🍭', priceRange: [2, 8] },
                        { id: 'candy_gum', name: '口香糖', img: 'icon-c5-gum', emoji: '🍬', priceRange: [3, 9] },
                        { id: 'candy_chocolate', name: '巧克力', img: 'icon-c5-chocolate', emoji: '🍫', priceRange: [4, 9] }
                    ],
                    sticker: [
                        { id: 'sticker_star', name: '星星貼紙', img: 'icon-c5-star-sticker', emoji: '⭐', priceRange: [1, 6] },
                        { id: 'sticker_heart', name: '愛心貼紙', img: 'icon-c5-heart-sticker', emoji: '💖', priceRange: [2, 8] },
                        { id: 'sticker_animal', name: '動物貼紙', img: 'icon-c5-animal-sticker', emoji: '🐱', priceRange: [3, 9] }
                    ],
                    eraser: [
                        { id: 'eraser_elephant', name: '大象造形橡皮擦', img: 'icon-c5-elephant-eraser', emoji: '🐘', priceRange: [2, 7] },
                        { id: 'eraser_car', name: '汽車造形橡皮擦', img: 'icon-c5-car-eraser', emoji: '🚗', priceRange: [4, 9] },
                        { id: 'eraser_rainbow', name: '彩虹造形橡皮擦', img: 'icon-c5-rainbow-eraser', emoji: '🌈', priceRange: [3, 9] }
                    ],
                    
                    // 2位數 (10-99元) 物品
                    snack: [
                        { id: 'snack_cookie', name: '餅乾', img: 'icon-c5-cookie', emoji: '🍪', priceRange: [15, 85] },
                        { id: 'snack_chips', name: '洋芋片', img: 'icon-c5-chips', emoji: '🥔', priceRange: [20, 90] },
                        { id: 'snack_crackers', name: '蘇打餅', img: 'icon-c5-crackers', emoji: '🫓', priceRange: [12, 75] }
                    ],
                    pen: [
                        { id: 'pen_ballpoint', name: '原子筆', img: 'icon-c5-ballpoint-pen', emoji: '✏️', priceRange: [10, 60] },
                        { id: 'pen_whiteboard', name: '白板筆', img: 'icon-c5-whiteboard-marker', emoji: '🖊️', priceRange: [25, 95] },
                        { id: 'pen_colored', name: '彩色筆', img: 'icon-c5-colored-pen', emoji: '🎨', priceRange: [30, 85] }
                    ],
                    notebook: [
                        { id: 'drink_cup', name: '杯子', img: 'icon-c5-cup', emoji: '🥤', priceRange: [30, 150] },
                        { id: 'notebook_spiral', name: '線圈筆記本', img: 'icon-c5-spiral-notebook', emoji: '🗒️', priceRange: [20, 85] },
                        { id: 'notebook_diary', name: '日記本', img: 'icon-c5-diary', emoji: '📔', priceRange: [25, 95] }
                    ],
                    fruit: [
                        { id: 'fruit_apple', name: '蘋果', img: 'icon-c5-apple', emoji: '🍎', priceRange: [12, 45] },
                        { id: 'fruit_banana', name: '香蕉', img: 'icon-c5-banana', emoji: '🍌', priceRange: [10, 35] },
                        { id: 'fruit_orange', name: '橘子', img: 'icon-c5-orange', emoji: '🍊', priceRange: [15, 50] }
                    ],
                    
                    // 3位數 (100-999元) 物品
                    toy: [
                        { id: 'toy_car', name: '玩具車', img: 'icon-c5-toy-car', emoji: '🚗', priceRange: [120, 850] },
                        { id: 'toy_doll', name: '娃娃', img: 'icon-c5-doll', emoji: '🪆', priceRange: [150, 600] },
                        { id: 'toy_robot', name: '機器人', img: 'icon-c5-robot', emoji: '🤖', priceRange: [200, 900] }
                    ],
                    book: [
                        { id: 'book_story', name: '故事書', img: 'icon-c5-story-book', emoji: '📚', priceRange: [100, 400] },
                        { id: 'book_comic', name: '漫畫書', img: 'icon-c5-comic-book', emoji: '📖', priceRange: [150, 500] },
                        { id: 'food_pizza', name: '比薩', img: 'icon-c5-pizza', emoji: '🍕', priceRange: [150, 500] }
                    ],
                    lunch: [
                        { id: 'lunch_bento', name: '便當', img: 'icon-c5-bento', emoji: '🍱', priceRange: [80, 300] },
                        { id: 'lunch_club_sandwich', name: '總匯三明治', img: 'icon-c5-club-sandwich', emoji: '🥪', priceRange: [80, 250] },
                        { id: 'lunch_beef_noodle', name: '牛肉麵', img: 'icon-c5-beef-noodle', emoji: '🍜', priceRange: [120, 400] }
                    ],
                    stationery_set: [
                        { id: 'stationery_pencil_case', name: '筆盒', img: 'icon-c5-pencil-case', emoji: '📝', priceRange: [120, 500] },
                        { id: 'food_nuts', name: '堅果', img: 'icon-c5-nuts', emoji: '🥜', priceRange: [80, 350] },
                        { id: 'stationery_calculator', name: '計算機', img: 'icon-c5-calculator', emoji: '🔢', priceRange: [150, 600] }
                    ],
                    
                    // 4位數 (1000-9999元) 物品
                    electronics: [
                        { id: 'electronics_phone', name: '手機', img: 'icon-c5-phone', emoji: '📱', priceRange: [3000, 9000] },
                        { id: 'electronics_tablet', name: '平板', img: 'icon-c5-tablet', emoji: '📲', priceRange: [2500, 8000] },
                        { id: 'electronics_headphones', name: '耳機', img: 'icon-c5-headphones', emoji: '🎧', priceRange: [1000, 5000] }
                    ],
                    clothing: [
                        { id: 'clothing_shirt', name: '上衣', img: 'icon-c5-shirt', emoji: '👕', priceRange: [1000, 3000] },
                        { id: 'clothing_pants', name: '褲子', img: 'icon-c5-pants', emoji: '👖', priceRange: [1000, 4000] },
                        { id: 'clothing_jacket', name: '外套', img: 'icon-c5-jacket', emoji: '🧥', priceRange: [1500, 6000] }
                    ],
                    sports: [
                        { id: 'sports_skateboard', name: '滑板', img: 'icon-c5-skateboard', emoji: '🛹', priceRange: [2000, 8000] },
                        { id: 'sports_speaker', name: '藍芽喇叭', img: 'icon-c5-bluetooth-speaker', emoji: '🔊', priceRange: [1000, 5000] },
                        { id: 'sports_basketball_shoes', name: '籃球鞋', img: 'icon-c5-basketball-shoes', emoji: '👟', priceRange: [2000, 8000] }
                    ],
                    game: [
                        { id: 'sports_bicycle', name: '腳踏車', img: 'icon-c5-bicycle', emoji: '🚲', priceRange: [3000, 12000] },
                        { id: 'game_rc_car', name: '搖控汽車', img: 'icon-c5-rc-car', emoji: '🚗', priceRange: [1000, 3000] },
                        { id: 'tech_smartwatch', name: '智慧手錶', img: 'icon-c5-smartwatch', emoji: '⌚', priceRange: [3000, 12000] }
                    ],

                    // 自訂金額物品
                    custom_item: [
                        { id: 'custom_gift', name: '神秘禮物', img: 'icon-c5-mystery-gift', emoji: '🎁', priceRange: [1, 9999] },
                        { id: 'custom_treasure', name: '寶物', img: 'icon-c5-treasure', emoji: '💎', priceRange: [1, 9999] },
                        { id: 'custom_magic', name: '魔法物品', img: 'icon-c5-magic-item', emoji: '✨', priceRange: [1, 9999] }
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
            
            Game.Debug.log('init', '✅ 遊戲數據初始化完成');
            Game.Debug.log('init', '🔍 可用物品類型:', Object.keys(this.gameData.purchaseItems));
        },

        // 系統監控
        startSystemMonitoring() {
            Game.Debug.log('init', '📊 啟動系統監控');

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
            }, {}, 'global');

            // 監控未處理的 Promise 拒絕
            Game.EventManager.on(window, 'unhandledrejection', (event) => {
                Game.Debug.error('🚨 未處理的 Promise 拒絕:', event.reason);
            }, {}, 'global');
            
            Game.Debug.log('init', '✅ 系統監控已啟用');
        },

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
            this.state.isProcessing = false;
            this.state.isProcessingDrop = false;
            this.state.compatibilityCache = {};
            this.state.gameCompleted = false;
            this._questionPools = null;
            this.clickState = {
                selectedItem: null,
                lastClickTime: 0,
                lastClickedElement: null,
                doubleClickDelay: 500
            };
            Game.Debug.log('state', '🔄 [C5] 遊戲狀態已重置');
        },

        // =====================================================
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

            const createDenominationButtonsHTML = (items) => items.map(item => `
                <button class="selection-btn ${settings.denominations.includes(item.value) ? 'active' : ''}" 
                        data-type="denomination" data-value="${item.value}">
                    ${item.name}
                </button>`).join('');

            app.innerHTML = `
                <div class="unit-welcome">
                    <div class="welcome-content" style="text-align: center;">
                        <div class="settings-title-row">
                            <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                            <h1>單元C5：足額付款</h1>
                        </div>
                        <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">理解足額付款的概念，了解付出的金錢大於或等於商品價格</p>

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
                                
                                /* 不可選面額（超出位數上限）樣式 */
                                .selection-btn:disabled {
                                    background-color: #f8d7da !important;
                                    border-color: #f5c6cb !important;
                                    color: #721c24 !important;
                                    opacity: 0.7;
                                    cursor: not-allowed !important;
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
                                    啟用後，只要偵測到點擊，系統會自動依序完成拖曳錢幣至付款區等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                    <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式」</strong>
                                </p>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.assistClick ? 'active' : ''}" id="assist-click-on">✓ 啟用</button>
                                    <button class="selection-btn ${!settings.assistClick ? 'active' : ''}" id="assist-click-off">✗ 停用</button>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label><img src="../images/common/icons_wallet.png" alt="🔢" style="width:1.2em;height:1.2em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='🔢'"> 我的錢包的金額位數：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.digits === 1 ? 'active' : ''}" 
                                            data-type="digits" data-value="1">
                                        1位數
                                    </button>
                                    <button class="selection-btn ${settings.digits === 2 ? 'active' : ''}" 
                                            data-type="digits" data-value="2">
                                        2位數
                                    </button>
                                    <button class="selection-btn ${settings.digits === 3 ? 'active' : ''}" 
                                            data-type="digits" data-value="3">
                                        3位數
                                    </button>
                                    <button class="selection-btn ${settings.digits === 4 ? 'active' : ''}" 
                                            data-type="digits" data-value="4">
                                        4位數
                                    </button>
                                    <button class="selection-btn ${settings.digits === 'custom' ? 'active' : ''}" 
                                            data-type="digits" data-value="custom">
                                        自訂金額
                                    </button>
                                </div>
                                <div id="custom-amount-input" style="display: ${settings.digits === 'custom' ? 'block' : 'none'}; margin-top: 15px;">
                                    <button id="set-custom-amount-btn" 
                                            style="padding: 8px 15px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                        設定自訂金額
                                    </button>
                                    <span id="custom-amount-display" style="margin-left: 10px; font-weight: bold; color: #667eea;">
                                        目前：${settings.customAmount || 0} 元
                                    </span>
                                </div>
                            </div>
                            
                            <div class="setting-group" id="denomination-section"
                                 style="display: ${settings.digits === 'custom' ? 'none' : 'block'};">
                                <label>💰 面額選擇 (可多選)：</label>
                                <div class="button-group" style="margin-bottom: 12px;">
                                    <button class="selection-btn ${settings.usingPreset ? 'active' : ''}" id="c5-preset-denom-btn" onclick="Game.applyDefaultDenominations()">
                                        ⭐ 預設（依位數自動選擇）
                                    </button>
                                </div>
                                <div class="denomination-selection">
                                    <div class="denomination-group">
                                        <h4 style="margin: 0 0 10px 0; color: #000;">錢幣</h4>
                                        <div class="button-group">${createDenominationButtonsHTML(coins)}</div>
                                    </div>
                                    <div class="denomination-group" style="margin-top: 15px;">
                                        <h4 style="margin: 0 0 10px 0; color: #000;">紙鈔</h4>
                                        <div class="button-group">${createDenominationButtonsHTML(bills)}</div>
                                    </div>
                                </div>
                                <div id="compatibility-hint" class="compatibility-hint" style="display: none;">
                                    💡 會產生超過30錢幣，請選擇合理的位數與幣值組合
                                </div>
                                <div id="min-denomination-hint" class="compatibility-hint" style="display: none; margin-top: 8px;">
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
                                    <input type="text" id="custom-question-count-c5"
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

            Game.Debug.log('ui', '✅ 設定頁面HTML已生成');

            // 綁定事件監聯器
            this.bindSettingEvents();

            // 依目前位數自動設定物品類型
            this.autoSetItemTypes();
            this.updateMinDenominationHint();
            
            const startBtn = app.querySelector('#start-quiz-btn');
            if (startBtn) {
                Game.EventManager.on(startBtn, 'click', this.startQuiz.bind(this), {}, 'settings');
            }
            
            // 綁定自訂金額按鈕事件
            const setCustomAmountBtn = app.querySelector('#set-custom-amount-btn');
            if (setCustomAmountBtn) {
                Game.EventManager.on(setCustomAmountBtn, 'click', () => {
                    this.showNumberInput('請輸入目標金額', (value) => {
                        const amount = parseInt(value);
                        if (isNaN(amount) || amount < 1 || amount > 9999) {
                            alert('請輸入 1-9999 之間的有效金額');
                            return false;
                        }
                        
                        // Unit5不需要檢查與幣值的衝突，因為不需要「包含所有幣值」
                        this.state.settings.customAmount = amount;

                        // 自動根據金額決定面額
                        const allDenoms = [1, 5, 10, 50, 100, 500, 1000];
                        const autoDenoms = allDenoms.filter(d => d <= amount);
                        this.state.settings.denominations = autoDenoms;
                        Game.Debug.log('wallet', `💰 自訂金額 ${amount}元，自動設定面額: [${autoDenoms.join(', ')}]`);
                        
                        // 更新顯示
                        const displaySpan = app.querySelector('#custom-amount-display');
                        if (displaySpan) {
                            displaySpan.textContent = `目前：${amount} 元`;
                        }
                        
                        // 依新金額自動更新物品類型
                        this.autoSetItemTypes();
                        
                        // 檢查是否可以開始遊戲
                        this.checkStartState();
                        
                        alert(`已設定目標金額為 ${amount} 元`);
                        
                        return true;
                    });
                }, {}, 'settings');
            }
            
            Game.Debug.log('event', '📱 事件監聯器已綁定');
        },

        // 綁定設定事件
        bindSettingEvents() {
            Game.Debug.log('event', '🔗 bindSettingEvents() 綁定設定事件');

            // 使用事件委派來處理所有設定選項點擊
            const gameSettings = document.querySelector('.game-settings');
            if (gameSettings) {
                Game.EventManager.on(gameSettings, 'click', this.handleSelection.bind(this), {}, 'settings');
                Game.Debug.log('event', '✅ 事件委派已設定');
            } else {
                Game.Debug.error('❌ 找不到 .game-settings 元素');
            }

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

            // 更新開始按鈕狀態
            this.checkStartState();

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
                    const params = new URLSearchParams({ unit: 'c5' });
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

            // 簡單模式不需要選擇測驗模式
            const modeRequired = difficulty !== 'easy';
            const modeValid = modeRequired ? mode : true;

            // 基本檢查
            const basicComplete = digits && denominations.length > 0 && difficulty && modeValid && questionCount;

            if (!basicComplete) return false;

            // 最小面額要求（3位數需含50或100；4位數需含500或1000）
            if (!this.meetsMinDenominationRequirement(digits, denominations)) return false;

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

            Game.Debug.log('state', '📝 處理選擇', {
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
                    // 移除前檢查：不得移除最後一個符合最小面額要求的幣值
                    const minRequired = this.getMinRequiredDenominations(settings.digits);
                    if (minRequired.includes(targetValue)) {
                        const remaining = settings.denominations.filter(d => d !== targetValue);
                        if (!remaining.some(d => minRequired.includes(d))) {
                            const reqStr = minRequired.map(v => `${v}元`).join('或');
                            this.showInvalidCombinationWarning(settings.digits, null, { message: `選${settings.digits}位數時，面額至少要包含${reqStr}，無法移除` });
                            return; // 拒絕移除
                        }
                    }
                    btn.classList.remove('active');
                    settings.denominations.splice(index, 1);
                    Game.Debug.log('state', `➖ 移除面額: ${targetValue}，目前: [${settings.denominations.join(', ')}]`);
                    this.updateMinDenominationHint();
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
                    this.updateMinDenominationHint();
                }
                // 手動改變面額時取消預設模式
                settings.usingPreset = false;
                const presetBtn = document.getElementById('c5-preset-denom-btn');
                if (presetBtn) presetBtn.classList.remove('active');
            } else if (type === 'questions') {
                // 題目數量處理
                if (value === 'custom') {
                    // 自訂題目數量
                    this.showNumberInput('請輸入題目數量', (inputValue) => {
                        const questionCount = parseInt(inputValue);
                        if (isNaN(questionCount) || questionCount < 1 || questionCount > 100) {
                            alert('請輸入 1-100 之間的有效數字');
                            return false;
                        }

                        settings.questionCount = questionCount;
                        Game.Debug.log('state', `🎲 自訂題目數量: ${questionCount}`);

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
                        const customInput = document.getElementById('custom-question-count-c5');
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
                    Game.Debug.log('state', `🎲 選擇題目數量: ${questionCount}`);

                    // 🔧 [新增] 選擇預設題數時，隱藏自訂輸入框
                    const customDisplay = document.querySelector('.custom-question-display');
                    const customInput = document.getElementById('custom-question-count-c5');
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
                if (type === 'digits') {
                    settings[type] = (value === 'custom') ? 'custom' : parseInt(value, 10);
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

                if (type === 'digits') {
                    // 檢查位數變更是否會造成幣值衝突
                    const newDigits = value === 'custom' ? 'custom' : parseInt(value, 10);
                    if (newDigits !== 'custom') {
                        const maxAllowed = this.getMaxAllowedDenomination(newDigits);
                        const invalidDenominations = settings.denominations.filter(d => d > maxAllowed);
                        if (invalidDenominations.length > 0) {
                            // 靜默移除超出範圍的幣值
                            settings.denominations = settings.denominations.filter(d => d <= maxAllowed);
                        }
                        // 自動補上最小必要面額
                        const minRequired = this.getMinRequiredDenominations(newDigits);
                        if (minRequired.length > 0 && !settings.denominations.some(d => minRequired.includes(d))) {
                            settings.denominations.push(minRequired[0]);
                            Game.Debug.log('state', `✅ 自動新增最小必要面額 ${minRequired[0]}元`);
                        }
                    }

                    Game.Debug.log('ui', '🔧 觸發面額UI更新');
                    this.updateDenominationUI();
                    // 預設模式開啟時，切換位數自動套用新位數的預設面額
                    if (settings.usingPreset && value !== 'custom') {
                        this.applyDefaultDenominations();
                    }

                    // 依新位數自動更新物品類型
                    this.autoSetItemTypes();
                    
                    // 處理自訂金額顯示/隱藏
                    const customInputDiv = document.getElementById('custom-amount-input');
                    if (customInputDiv) {
                        customInputDiv.style.display = (value === 'custom') ? 'block' : 'none';
                    }

                    // 隱藏/顯示面額選擇區塊
                    const denominationSection = document.getElementById('denomination-section');
                    if (denominationSection) {
                        denominationSection.style.display = (value === 'custom') ? 'none' : 'block';
                    }

                    // 自訂金額模式：自動彈出數字輸入框（參照 A6 作法）
                    if (value === 'custom') {
                        const setBtn = document.getElementById('set-custom-amount-btn');
                        if (setBtn) setBtn.click();
                    }
                }
            }
            
            Game.Debug.log('state', '📊 更新後的完整設定:', {...settings});
            this.checkStartState();
        },

        // 取得難度說明文字
        getDifficultyDescription(difficulty) {
            const descriptions = {
                easy: '簡單：有視覺、語音數錢提示，引導下完成題目。',
                normal: '普通：沒有視覺提示，有語音數錢提示。',
                hard: '困難：沒有視覺、語音提示，自行判斷金錢夠不夠。'
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

            const { digits, denominations, itemTypes, difficulty, mode, questionCount } = this.state.settings;
            const startBtn = document.getElementById('start-quiz-btn');

            // 🔧 修復：簡單模式不需要選擇測驗模式
            const modeRequired = difficulty !== 'easy';

            const conditions = {
                digits: !!digits,
                denominations: denominations.length > 0,
                itemTypes: itemTypes.length > 0,
                difficulty: !!difficulty,
                mode: modeRequired ? !!mode : true,  // 簡單模式自動通過
                questionCount: !!questionCount
            };

            const isReady = Object.values(conditions).every(condition => condition);

            Game.Debug.log('state', '✅ 條件檢查結果:', {
                conditions,
                isReady,
                currentSettings: { digits, denominations, itemTypes, difficulty, mode, questionCount }
            });

            if (startBtn) {
                startBtn.disabled = !isReady;
                startBtn.textContent = isReady ? '開始測驗！' : '請完成所有選擇';
                Game.Debug.log('state', `🎮 開始按鈕狀態: ${isReady ? '啟用' : '停用'} - "${startBtn.textContent}"`);
            } else {
                Game.Debug.error('❌ 找不到開始按鈕元素');
            }
        },

        // 取得位數允許的最大面額
        getMaxAllowedDenomination(digits) {
            if (digits === 1) return 5;    // 1位數：只允許 1, 5
            if (digits === 2) return 10;   // 2位數：只允許 1, 5, 10
            if (digits === 3) return 100;  // 3位數：只允許 1, 5, 10, 50, 100
            return 1000;                   // 4位數：全開
        },

        // 取得位數的最小必要面額（至少選一個）
        getMinRequiredDenominations(digits) {
            if (digits === 3) return [50, 100];
            if (digits === 4) return [500, 1000];
            return [];
        },

        // 檢查是否滿足最小面額要求
        meetsMinDenominationRequirement(digits, denominations) {
            const required = this.getMinRequiredDenominations(digits);
            if (required.length === 0) return true;
            return denominations.some(d => required.includes(d));
        },

        // 更新面額UI（限制規則）
        updateDenominationUI() {
            const { digits } = this.state.settings;

            if (digits === 'custom') {
                // 自訂金額模式：無面額限制，但檢查是否有衝突
                return;
            }

            const maxAllowed = this.getMaxAllowedDenomination(digits);

            const denominationButtons = document.querySelectorAll('.selection-btn[data-type="denomination"]');
            denominationButtons.forEach(btn => {
                const value = parseInt(btn.dataset.value, 10);
                btn.disabled = value > maxAllowed;
                if (btn.disabled) {
                    btn.classList.remove('active');
                    const index = this.state.settings.denominations.indexOf(value);
                    if (index > -1) {
                        this.state.settings.denominations.splice(index, 1);
                    }
                } else {
                    // 同步 active 狀態（處理自動新增的面額）
                    btn.classList.toggle('active', this.state.settings.denominations.includes(value));
                }
            });

            // 更新最小面額提示
            this.updateMinDenominationHint();
        },

        // 更新最小面額提示文字
        updateMinDenominationHint() {
            const hint = document.getElementById('min-denomination-hint');
            if (!hint) return;
            const { digits, denominations } = this.state.settings;
            const required = this.getMinRequiredDenominations(digits);
            if (required.length === 0) {
                hint.style.display = 'none';
                return;
            }
            const reqStr = required.map(v => `${v}元`).join('或');
            const met = denominations.some(d => required.includes(d));
            hint.style.display = 'block';
            hint.style.background = met ? '#d4edda' : '#fff3cd';
            hint.style.borderColor = met ? '#c3e6cb' : '#ffc107';
            hint.style.color = met ? '#155724' : '#856404';
            hint.textContent = met
                ? `✅ 已包含 ${required.filter(r => denominations.includes(r)).map(v => `${v}元`).join('、')}，符合${digits}位數要求`
                : `⚠️ 選${digits}位數時，面額至少要包含${reqStr}`;
        },

        // 新增：檢查位數和幣值組合是否有效（簡化版，適用unit5）
        // 依目前位數自動套用合理面額預設（不重繪頁面，直接更新按鈕狀態）
        applyDefaultDenominations() {
            const digits = this.state.settings.digits;
            const presets = {
                1: [1, 5],
                2: [1, 10, 50],
                3: [10, 100, 500],
                4: [100, 500, 1000]
            };
            const defaults = presets[digits];
            if (!defaults) return; // 自訂金額模式不適用
            this.state.settings.denominations = [...defaults];
            this.state.settings.usingPreset = true;
            // 直接更新 DOM，不重新渲染整個設定頁
            document.querySelectorAll('[data-type="denomination"]').forEach(btn => {
                const val = parseInt(btn.dataset.value, 10);
                btn.classList.toggle('active', defaults.includes(val));
            });
            const presetBtn = document.getElementById('c5-preset-denom-btn');
            if (presetBtn) presetBtn.classList.add('active');
        },

        isValidCombination(digits, denominations) {
            if (!denominations.length) return true;

            if (digits === 'custom') {
                // 自訂金額模式：只需要檢查是否有自訂金額設定
                const { customAmount } = this.state.settings;
                return customAmount && customAmount > 0;
            }

            // 位數模式：檢查面額上限
            const maxAllowed = this.getMaxAllowedDenomination(digits);
            return denominations.every(d => d <= maxAllowed);
        },

        // 新增：顯示無效組合警告（簡化版，適用unit5）
        showInvalidCombinationWarning(digits, invalidItems, customData = null) {
            let message;

            if (customData && customData.message) {
                message = customData.message;
            } else if (digits === 'custom') {
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
            Game.Debug.log('wallet', `🧮 計算面額 [${denominations.join(', ')}] 在 ${digits} 位數下的可能金額`);

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
            Game.Debug.log('wallet', `📊 最大金額限制: ${maxAmount}元，有效最大金額: ${effectiveMaxAmount}元`);

            const possibleAmounts = new Set(); // 使用 Set 避免重複

            // 對每個面額計算倍數組合（使用 effectiveMaxAmount 限制）
            denominations.forEach(denomination => {
                Game.Debug.log('wallet', `💰 計算面額 ${denomination}元 的倍數`);

                // 計算這個面額可以組成的金額（受 30 硬幣限制）
                for (let count = 1; count * denomination <= effectiveMaxAmount; count++) {
                    const amount = count * denomination;
                    possibleAmounts.add(amount);

                    if (count <= 5) { // 只記錄前5個倍數用於日誌
                        Game.Debug.log('wallet', `  ${count}張 × ${denomination}元 = ${amount}元`);
                    }
                }
            });

            // 2D DP 一次性計算所有可組合金額（30 硬幣上限）
            if (denominations.length > 1) {
                Game.Debug.log('wallet', '🔄 2D DP 計算多面額組合...');
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
            Game.Debug.log('wallet', `✅ 共計算出 ${sortedAmounts.length} 個可能金額: [${sortedAmounts.slice(0, 10).join(', ')}${sortedAmounts.length > 10 ? '...' : ''}]`);

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
            Game.Debug.log('question', `🎯 使用策略 "${strategy}" 生成物品價格，可用金額數量: ${possibleAmounts.length}`);

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

            Game.Debug.log('question', `📋 篩選後有效金額數量: ${validAmounts.length} (從${possibleAmounts.length}個中篩選)`);
            
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
            Game.Debug.log('question', `📈 最大可能金額: ${maxPossibleAmount}元`);

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
                    Game.Debug.log('question', `💡 找到範圍內的不足價格: ${price}元 (範圍: ${minItemPrice}-${maxItemPrice}元)`);
                    break;
                }
            }

            // 策略2: 如果找不到，尋找比最大可能金額稍高但在物品範圍內的價格
            if (!insufficientPrice && maxPossibleAmount < maxItemPrice && maxPossibleAmount + 1 >= minItemPrice) {
                insufficientPrice = maxPossibleAmount + 1;
                Game.Debug.log('question', `💡 使用稍高價格: ${insufficientPrice}元`);
            }

            // 策略3: 如果還找不到，回退到sufficient策略
            if (!insufficientPrice || insufficientPrice > maxItemPrice || insufficientPrice < minItemPrice) {
                Game.Debug.log('question', `⚠️ 無法生成合適的不足價格 (金額範圍: ${maxPossibleAmount}, 物品範圍: ${minItemPrice}-${maxItemPrice}元)，改用sufficient策略`);
                return this.generateSufficientPrice(possibleAmounts);
            }

            Game.Debug.log('question', `💸 生成不足價格: ${insufficientPrice}元`);
            return insufficientPrice;
        },

        generateSufficientPrice(possibleAmounts) {
            // 隨機選擇一個可能的金額作為價格
            const randomIndex = Math.floor(Math.random() * possibleAmounts.length);
            const sufficientPrice = possibleAmounts[randomIndex];
            Game.Debug.log('question', `💰 生成足夠價格: ${sufficientPrice}元`);
            return sufficientPrice;
        },

        // 在指定價格範圍內找一個不在 possibleAmounts 中的價格（用於 insufficient 策略）
        generateInsufficientPriceInRange(possibleAmounts, minPrice, maxPrice) {
            const candidates = [];
            for (let p = minPrice; p <= maxPrice; p++) {
                if (!possibleAmounts.includes(p)) candidates.push(p);
            }
            if (candidates.length === 0) return null;
            return candidates[Math.floor(Math.random() * candidates.length)];
        },

        // 🔧 新增：篩選金額，只保留在物品價格範圍內的金額
        filterAmountsByItemPriceRanges(possibleAmounts, itemTypes, digits) {
            Game.Debug.log('question', `🔍 篩選金額：檢查 ${possibleAmounts.length} 個金額是否落在物品價格範圍內`);

            const maxPrice = digits === 'custom' ? 9999 : Math.pow(10, digits) - 1;
            const validAmountsSet = new Set();

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

            Game.Debug.log('question', `📊 找到 ${allPriceRanges.length} 個物品價格範圍`);

            // 檢查每個金額是否落在任何物品的價格範圍內
            possibleAmounts.forEach(amount => {
                for (const [minPrice, maxPrice] of allPriceRanges) {
                    if (amount >= minPrice && amount <= maxPrice) {
                        validAmountsSet.add(amount);
                        break; // 找到一個符合的範圍就足夠了
                    }
                }
            });

            const validAmounts = Array.from(validAmountsSet);
            Game.Debug.log('question', `✅ 篩選完成：${validAmounts.length} 個有效金額 (從 ${possibleAmounts.length} 個中篩選)`);
            if (validAmounts.length > 0) {
                Game.Debug.log('question', `📋 有效金額範圍: ${Math.min(...validAmounts)}-${Math.max(...validAmounts)}元`);
            }

            return validAmounts;
        },

        // =====================================================
        // 緩存管理系統 - 優化重複計算
        // =====================================================
        clearCompatibilityCache() {
            this.state.compatibilityCache = {};
            Game.Debug.log('state', '🗑️ 相容性緩存已清理');
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
                Game.Debug.log('state', '⚠️ 沒有面額，默認相容');
                return true;
            }
            if (!itemType) {
                Game.Debug.log('state', '⚠️ 沒有物品類型，默認相容');
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
            Game.Debug.log('state', `💰 面額可生成金額範圍: ${minPossibleAmount}-${maxPossibleAmount}元`);

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
                    Game.Debug.log('hint', `   詳細說明：30張${maxDenomination}元硬幣最多只能買${maxPurchasePower}元，無法購買${digits}位數物品(${digitRangeMin}元起)`);
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
                    Game.Debug.log('state', `⚠️ 物品 "${item.name}" 價格範圍 ${itemMinPrice}-${itemMaxPrice}元 與面額金額 ${minPossibleAmount}-${maxPossibleAmount}元 無重疊`);
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

        // 依目前位數自動設定 itemTypes（使用該位數的所有可用物品類型）
        autoSetItemTypes() {
            const availableTypes = this.getAvailableItemTypes(this.state.settings.digits);
            this.state.settings.itemTypes = availableTypes.map(t => t.type);
            Game.Debug.log('state', `🔄 自動設定物品類型: [${this.state.settings.itemTypes.join(', ')}]`);
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
            Game.Debug.log('ui', '🔍 清理前的物品類型選擇:', beforeCleanup);
            Game.Debug.log('ui', '🔍 當前位數模式可用的物品類型:', availableItemTypes.map(t => t.type));

            // 清理已選擇但不再可用的物品類型
            settings.itemTypes = settings.itemTypes.filter(selectedType =>
                availableItemTypes.some(availableType => availableType.type === selectedType)
            );

            // 記錄清理後的狀態
            const afterCleanup = [...settings.itemTypes];
            const removedTypes = beforeCleanup.filter(type => !afterCleanup.includes(type));
            if (removedTypes.length > 0) {
                Game.Debug.log('ui', '🧹 已清理不相容的物品類型:', removedTypes);
                Game.Debug.log('ui', '✅ 清理後的物品類型選擇:', afterCleanup);
            } else {
                Game.Debug.log('ui', 'ℹ️ 無需清理，物品類型選擇未變更');
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
                Game.Debug.log('ui', '🔄 因物品類型清理，重新檢查遊戲開始條件');
                this.checkStartState();
            }

            // 檢查是否有不相容的物品並顯示提示
            this.updateCompatibilityHint();

            Game.Debug.log('ui', `✅ 物品類型UI已更新，可用物品: ${availableItemTypes.length} 種`);
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

        // 預建題目組合池（在 startQuiz 呼叫一次，快取供所有題目共用）
        buildQuestionPools() {
            const { digits, denominations, itemTypes } = this.state.settings;

            // 步驟1：篩選物品
            const availableItemTypeNames = this.getAvailableItemTypes(digits).map(i => i.type);
            const selectedItemTypes = availableItemTypeNames.filter(t => itemTypes.includes(t));
            if (!selectedItemTypes.length) return null;

            const allCandidateItems = [];
            selectedItemTypes.forEach(typeKey => {
                const items = this.gameData.purchaseItems[typeKey];
                if (items) items.forEach(item => allCandidateItems.push(item));
            });

            // 步驟2：計算可能金額
            const possibleAmounts = this.generatePossibleAmounts(denominations, digits);
            if (!possibleAmounts.length) return null;

            const maxPrice = digits === 'custom' ? 9999 : Math.pow(10, digits) - 1;
            const insufficientCeiling = Math.ceil(Math.max(...possibleAmounts) * 1.5);

            // 步驟3：建立兩個策略池
            const buildPool = (strat) => {
                const pool = [];
                for (const ci of allCandidateItems) {
                    const iMin = Math.max(1, ci.priceRange[0]);
                    const iMax = Math.min(maxPrice, ci.priceRange[1]);
                    for (const amt of possibleAmounts) {
                        const pMin = strat === 'insufficient' ? Math.max(iMin, amt + 1) : iMin;
                        const pMax = strat === 'insufficient' ? Math.min(iMax, insufficientCeiling) : Math.min(iMax, amt);
                        if (pMin <= pMax) pool.push({ ci, pMin, pMax, amt });
                    }
                }
                return pool;
            };

            const pools = {
                sufficient: buildPool('sufficient'),
                insufficient: buildPool('insufficient')
            };
            Game.Debug.log('question', `📦 [buildQuestionPools] 建立完成 sufficient:${pools.sufficient.length} insufficient:${pools.insufficient.length}`);
            return pools;
        },

        generateQuestion() {
            Game.Debug.log('question', '🎲 generateQuestion() - 新版面額優先邏輯開始');

            try {
                const { digits, denominations, itemTypes, difficulty, customAmount } = this.state.settings;

                // 參數驗證
                Game.Debug.log('question', '🔍 驗證生成參數:', { digits, denominations, itemTypes, difficulty, customAmount });

                if (!denominations || denominations.length === 0) {
                    Game.Debug.error('❌ 面額陣列為空或未定義');
                    return null;
                }

                if (!itemTypes || itemTypes.length === 0) {
                    Game.Debug.error('❌ 物品類型陣列為空或未定義');
                    return null;
                }

                // 🆕 特殊處理：自訂金額模式
                if (digits === 'custom' && customAmount > 0) {
                    Game.Debug.log('question', `🎯 自訂金額模式: 固定金錢 ${customAmount}元，變化幣值組合`);
                    return this.generateCustomAmountQuestion(customAmount, denominations, itemTypes, difficulty);
                }

                // 新邏輯流程：位數篩選物品 → 面額生成金額 → 策略決定價格
                Game.Debug.log('question', '🔄 執行新版面額優先邏輯...');

                // 1. 位數篩選：獲取嚴格對應的物品
                Game.Debug.log('question', `📐 步驟1: 位數 ${digits} 篩選物品`);
                const availableItems = this.getAvailableItemTypes(digits);
                const availableItemTypeNames = availableItems.map(item => item.type);
                Game.Debug.log('question', `✅ 可用物品類型: [${availableItemTypeNames.join(', ')}]`);

                // 過濾出用戶選擇的物品類型
                const selectedItemTypes = availableItemTypeNames.filter(itemType => itemTypes.includes(itemType));
                if (selectedItemTypes.length === 0) {
                    Game.Debug.error(`❌ 沒有符合位數 ${digits} 且被選中的物品類型`);
                    return null;
                }
                Game.Debug.log('question', `🎯 最終選中的物品類型: [${selectedItemTypes.join(', ')}]`);

                // 2. 面額生成：計算所有可能的金額
                Game.Debug.log('question', `💰 步驟2: 面額 [${denominations.join(', ')}] 生成可能金額`);
                const possibleAmounts = this.generatePossibleAmounts(denominations, digits);
                if (possibleAmounts.length === 0) {
                    Game.Debug.error('❌ 無法從選定面額生成任何有效金額');
                    return null;
                }
                Game.Debug.log('question', `✅ 共生成 ${possibleAmounts.length} 個可能金額`);

                // 3. 策略決定：根據難度決定價格策略
                Game.Debug.log('question', `🎮 步驟3: 難度 ${difficulty} 決定價格策略`);
                const strategy = this.getQuestionStrategy(difficulty);
                Game.Debug.log('question', `📋 使用策略: ${strategy}`);

                // 4. 從快取池取得題目組合
                Game.Debug.log('question', `🛍️ 步驟4: 從快取池取得題目組合`);

                let selectedItem = null;
                let itemPrice = null;
                let overrideMoneyAmount = null;

                // 使用 startQuiz 預建的快取池
                let effectiveStrategy = strategy;
                let pool = this._questionPools ? this._questionPools[strategy] : null;
                if (!pool || pool.length === 0) {
                    const altStrategy = strategy === 'sufficient' ? 'insufficient' : 'sufficient';
                    pool = this._questionPools ? this._questionPools[altStrategy] : null;
                    effectiveStrategy = altStrategy;
                    if (pool && pool.length > 0) {
                        Game.Debug.log('question', `⚠️ 策略 ${strategy} 無有效組合，改用備用策略 ${altStrategy}`);
                    }
                }

                if (!pool || pool.length === 0) {
                    Game.Debug.error('❌ 選定的幣值無法與物品價格配合，請選擇面額較大的錢幣');
                    return null;
                }

                // 從有效組合池隨機選取
                const pick = pool[Math.floor(Math.random() * pool.length)];
                const candidatePrice = pick.pMin + Math.floor(Math.random() * (pick.pMax - pick.pMin + 1));
                selectedItem = { ...pick.ci, price: candidatePrice };
                itemPrice = candidatePrice;
                overrideMoneyAmount = pick.amt;
                Game.Debug.log('question', `✅ 選擇物品: ${selectedItem.name} (${selectedItem.emoji}), 價格: ${itemPrice}元, 我的錢: ${overrideMoneyAmount}元`);

                // 6. 金錢生成：根據價格生成對應的金錢
                Game.Debug.log('question', `💳 步驟5: 生成我的金錢`);
                const myMoney = overrideMoneyAmount
                    ? this.generateMoneyByAmount(overrideMoneyAmount, denominations)
                    : this.generateMoneyForStrategy(itemPrice, denominations, effectiveStrategy);
                if (!myMoney) {
                    Game.Debug.error('❌ 無法生成我的金錢');
                    return null;
                }

                // 7. 結果計算
                const totalMoney = myMoney.reduce((sum, money) => sum + money.value, 0);
                const isAffordable = totalMoney >= itemPrice;

                Game.Debug.log('question', '📊 題目生成完成:', {
                    strategy: effectiveStrategy,
                    itemPrice,
                    totalMoney,
                    isAffordable,
                    moneyPieces: myMoney.length,
                    denominations: denominations.join(',')
                });

                // 8. 返回題目物件
                const question = {
                    item: selectedItem,
                    itemPrice,
                    myMoney,
                    totalMoney,
                    isAffordable
                };

                Game.Debug.log('question', '✅ 面額優先題目生成成功');
                return question;
                
            } catch (error) {
                Game.Debug.error('❌ 面額優先題目生成錯誤:', error);
                Game.Debug.error('堆疊追蹤:', error.stack);
                return null;
            }
        },

        // =====================================================
        // 🆕 自訂金額模式專用函數
        // =====================================================
        generateCustomAmountQuestion(customAmount, denominations, itemTypes, difficulty) {
            Game.Debug.log('question', `🎯 自訂金額模式題目生成: ${customAmount}元`);

            try {
                // 1. 物品選擇：根據自訂金額選擇可用物品類型
                Game.Debug.log('question', `📐 步驟1: 根據金額 ${customAmount}元 選擇物品類型`);
                const availableItems = this.getAvailableItemTypesForCustomAmount(customAmount);
                const availableItemTypeNames = availableItems.map(item => item.type);
                Game.Debug.log('question', `✅ 可用物品類型: [${availableItemTypeNames.join(', ')}]`);

                // 過濾出用戶選擇的物品類型
                const selectedItemTypes = availableItemTypeNames.filter(itemType => itemTypes.includes(itemType));
                if (selectedItemTypes.length === 0) {
                    Game.Debug.error(`❌ 沒有符合自訂金額 ${customAmount}元 且被選中的物品類型`);
                    return null;
                }
                Game.Debug.log('question', `🎯 最終選中的物品類型: [${selectedItemTypes.join(', ')}]`);

                // 2. 金錢固定：我的金錢固定為自訂金額，只變化幣值組合
                Game.Debug.log('question', `💳 步驟2: 生成固定金額 ${customAmount}元 的幣值組合`);
                const myMoney = this.generateMoneyForCustomAmount(customAmount, denominations);
                if (!myMoney || myMoney.length === 0) {
                    Game.Debug.error('❌ 無法為自訂金額生成幣值組合');
                    return null;
                }
                Game.Debug.log('question', `✅ 生成 ${myMoney.length} 個硬幣，總額 ${customAmount}元`);

                // 3. 物品價格：獨立生成，可以高於、等於或低於自訂金額
                Game.Debug.log('question', `🎮 步驟3: 生成獨立的物品價格（可高於、等於或低於 ${customAmount}元）`);
                const strategy = this.getQuestionStrategy(difficulty);
                const itemPrice = this.generateItemPriceForCustomAmount(customAmount, strategy, selectedItemTypes);
                if (!itemPrice) {
                    Game.Debug.error('❌ 無法生成物品價格');
                    return null;
                }
                Game.Debug.log('question', `💰 生成物品價格: ${itemPrice}元 (策略: ${strategy})`);

                // 4. 物品選擇：選擇符合價格的物品
                Game.Debug.log('question', `🛍️ 步驟4: 選擇符合價格的物品`);
                const selectedItem = this.selectRandomItem(selectedItemTypes, itemPrice, 'custom');
                if (!selectedItem) {
                    Game.Debug.error('❌ 無法選擇符合價格的物品');
                    return null;
                }
                Game.Debug.log('question', `✅ 選擇物品: ${selectedItem.name} (${selectedItem.emoji})`);

                // 5. 結果計算
                const totalMoney = customAmount; // 固定為自訂金額
                const isAffordable = totalMoney >= itemPrice;

                Game.Debug.log('question', '📊 自訂金額題目生成完成:', {
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

                Game.Debug.log('question', '✅ 自訂金額題目生成成功');
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
            Game.Debug.log('question', `🎯 從物品類型 [${itemTypes.join(', ')}] 中選擇符合價格 ${targetPrice}元 的物品`);

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
                            Game.Debug.log('question', `✅ 找到符合物品: ${item.name} (範圍: ${itemMinPrice}-${itemMaxPrice}元)`);
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
                    Game.Debug.log('wallet', `💸 生成不足金額: ${insufficientAmount}元 (價格: ${itemPrice}元)`);

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
            Game.Debug.log('wallet', `🎯 原則：使用適合的面額組合，盡可能多樣化`);

            if (targetAmount <= 0) {
                Game.Debug.error('❌ 目標金額必須大於0');
                return [];
            }

            const result = [];
            let remainingAmount = targetAmount;

            // 🔧 步驟1：篩選適用的面額 - 只使用不超過目標金額的面額
            const usableDenominations = denominations.filter(denom => denom <= targetAmount).sort((a, b) => a - b);
            Game.Debug.log('wallet', `🔍 適用面額: [${usableDenominations.join(', ')}] (排除超過${targetAmount}元的面額)`);

            if (usableDenominations.length === 0) {
                Game.Debug.log('wallet', `⚠️ 沒有適用的面額 (最小面額 ${Math.min(...denominations)} 超過目標金額 ${targetAmount})`);
                return [];
            }

            // 🔧 步驟2：優先分配 - 盡可能使用不同面額，但不強制全部使用
            Game.Debug.log('wallet', `🔗 步驟1: 嘗試使用多樣化面額`);
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
                        Game.Debug.log('wallet', `✅ 多樣化分配 ${denomination}元，剩餘: ${remainingAmount}元`);
                    } else {
                        Game.Debug.error(`❌ 找不到面額 ${denomination} 的資料`);
                        return [];
                    }
                } else {
                    Game.Debug.log('wallet', `⏭️ 跳過面額 ${denomination}元 (剩餘金額不足: ${remainingAmount}元)`);
                }
            }

            // 🔧 步驟3：貪婪分配剩餘金額（優先使用大面額）
            if (remainingAmount > 0) {
                Game.Debug.log('wallet', `💰 步驟2: 貪婪分配剩餘 ${remainingAmount}元`);
                const reversedUsableDenominations = [...usableDenominations].sort((a, b) => b - a); // 從大到小

                for (const denomination of reversedUsableDenominations) {
                    // 🔧 修復：加入 30 硬幣上限檢查
                    while (remainingAmount >= denomination && result.length < 30) {
                        const itemData = this.getItemData(denomination);
                        if (itemData) {
                            result.push({
                                id: `money-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                value: denomination,
                                image: this.getRandomImage(itemData)
                            });
                            remainingAmount -= denomination;
                            Game.Debug.log('wallet', `➕ 貪婪添加 ${denomination}元，剩餘: ${remainingAmount}元`);
                        } else {
                            Game.Debug.error(`❌ 找不到面額 ${denomination} 的資料`);
                            break;
                        }
                    }
                    // 🔧 修復：如果達到 30 硬幣上限，提前退出循環
                    if (result.length >= 30) {
                        Game.Debug.log('wallet', `⚠️ 已達到 30 硬幣上限，停止生成`);
                        break;
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

            Game.Debug.log('wallet', `✅ 金錢生成完成:`);
            Game.Debug.log('wallet', `   目標: ${targetAmount}元，實際: ${actualTotal}元，共 ${result.length} 個硬幣`);
            Game.Debug.log('wallet', `   原始面額: [${originalDenominations.join(', ')}]`);
            Game.Debug.log('wallet', `   適用面額: [${expectedDenominations.join(', ')}]`);
            Game.Debug.log('wallet', `   實際面額: [${usedDenominations.join(', ')}]`);
            Game.Debug.log('wallet', `   面額多樣性: ${usedDenominations.length}/${usableDenominations.length}`);

            // 🔧 驗證硬幣數量是否超過 30 個上限
            if (result.length > 30) {
                Game.Debug.warn('wallet', `⚠️ 警告：生成了 ${result.length} 個硬幣，超過 30 個上限！`);
            }

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
            Game.Debug.log('wallet', `🎲 選擇組合方式: ${JSON.stringify(selectedCombination)}`);

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
                    Game.Debug.log('wallet', `➕ 添加 ${count} 個 ${denominationValue}元`);
                } else {
                    Game.Debug.error(`❌ 找不到面額 ${denominationValue} 的資料`);
                }
            }

            const actualTotal = result.reduce((sum, money) => sum + money.value, 0);
            Game.Debug.log('wallet', `✅ 自訂金額幣值組合生成完成: 目標 ${customAmount}元，實際 ${actualTotal}元，共 ${result.length} 個硬幣`);

            return result;
        },

        // 找出所有可能的硬幣組合方式（動態規劃）
        // 🔧 修復：使用適合的面額組合，不強制要求所有面額都出現
        findAllCombinations(amount, denominations) {
            Game.Debug.log('wallet', `🧮 計算 ${amount}元 的所有可能組合方式`);
            Game.Debug.log('wallet', `🎯 原則：使用適合的面額組合，盡可能多樣化`);

            // 🔧 篩選適用的面額
            const usableDenominations = denominations.filter(denom => denom <= amount);
            Game.Debug.log('wallet', `🔍 適用面額: [${usableDenominations.join(', ')}] (排除超過${amount}元的面額)`);

            if (usableDenominations.length === 0) {
                Game.Debug.log('wallet', `⚠️ 沒有適用的面額 (最小面額超過目標金額 ${amount})`);
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
                        Game.Debug.log('wallet', `✅ 找到有效組合: ${JSON.stringify(currentCombination)} (${totalCoins}個硬幣)`);
                    } else {
                        Game.Debug.log('wallet', `⚠️ 組合超過30硬幣限制: ${totalCoins}個`);
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
            Game.Debug.log('wallet', `🔍 開始搜索所有可能的組合`);
            backtrack(amount, {}, 0);

            Game.Debug.log('wallet', `✅ 找到 ${allCombinations.length} 種硬幣組合方式${allCombinations.length >= MAX_COMBINATIONS ? ' (已達上限)' : ''}`);

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
            Game.Debug.log('question', `💰 為自訂金額 ${customAmount}元 生成物品價格 (策略: ${strategy})`);

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
                            Game.Debug.log('question', `🎯 [增強價格] ${item.name}: 原範圍[${item.priceRange[0]}-${item.priceRange[1]}] → 生成價格${enhancedPrice}元`);
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
            Game.Debug.log('question', `📊 可用價格範圍: ${uniquePrices[0]}-${uniquePrices[uniquePrices.length - 1]}元 (共${uniquePrices.length}個價格)`);

            let candidatePrices = [];

            switch (strategy) {
                case 'sufficient':
                    // 足夠策略：價格等於或小於自訂金額
                    candidatePrices = uniquePrices.filter(price => price <= customAmount);
                    Game.Debug.log('question', `💰 足夠策略：選擇 ≤${customAmount}元 的價格`);
                    break;

                case 'insufficient':
                    // 不足策略：價格大於自訂金額
                    candidatePrices = uniquePrices.filter(price => price > customAmount);
                    Game.Debug.log('question', `💸 不足策略：選擇 >${customAmount}元 的價格`);
                    break;

                case 'exact':
                    // 精確策略：價格等於自訂金額（如果可能）
                    candidatePrices = uniquePrices.filter(price => price === customAmount);
                    if (candidatePrices.length === 0) {
                        // 沒有精確價格，退而選擇接近的價格
                        candidatePrices = uniquePrices.filter(price => Math.abs(price - customAmount) <= 2);
                        Game.Debug.log('question', `💰 精確策略：無精確價格，選擇接近 ${customAmount}元 的價格`);
                    } else {
                        Game.Debug.log('question', `💰 精確策略：選擇等於 ${customAmount}元 的價格`);
                    }
                    break;

                default:
                    candidatePrices = uniquePrices;
                    Game.Debug.log('question', `💰 預設策略：選擇所有可用價格`);
                    break;
            }

            if (candidatePrices.length === 0) {
                Game.Debug.warn('question', `⚠️ 策略 ${strategy} 沒有合適的價格，使用隨機價格`);
                candidatePrices = uniquePrices;
            }

            const selectedPrice = candidatePrices[Math.floor(Math.random() * candidatePrices.length)];
            Game.Debug.log('question', `✅ 生成物品價格: ${selectedPrice}元 (從 ${candidatePrices.length} 個候選價格中選擇)`);

            return selectedPrice;
        },

        // 廢棄的舊函數（保留以防止錯誤，但不再使用）
        generateSufficientMoney(targetPrice, denominations, minMultiplier = 1.0, maxMultiplier = 2.0) {
            Game.Debug.warn('question', '⚠️ generateSufficientMoney 已廢棄，請使用新的面額優先邏輯');
            // 臨時兼容，實際應該在新邏輯中處理
            const actualTotal = Math.floor(targetPrice * (minMultiplier + Math.random() * (maxMultiplier - minMultiplier)));
            return this.generateMoneyByAmount(actualTotal, denominations);
        },

        generateInsufficientMoney(targetPrice, denominations) {
            Game.Debug.warn('question', '⚠️ generateInsufficientMoney 已廢棄，請使用新的面額優先邏輯');
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
                    Game.Debug.log('wallet', `⚠️ 無法完全匹配目標金額 ${totalAmount}，剩餘 ${remainingAmount}`);

                    // 如果是生成不足金額的情況，且結果為空，返回空陣列是合理的（代表沒給錢）
                    if (result.length === 0 && totalAmount < Math.min(...denominations)) {
                        Game.Debug.log('wallet', `💸 目標金額 ${totalAmount} 小於最小面額，返回空陣列（沒給錢）`);
                        return []; // 這是合法的不足場景
                    }

                    // 其他情況返回部分結果
                    Game.Debug.log('wallet', `📝 返回部分結果`);
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
                    Game.Debug.log('wallet', `➕ 添加面額 ${denomination}，剩餘金額: ${remainingAmount}`);
                } else {
                    Game.Debug.error(`❌ 找不到面額 ${denomination} 的資料`);
                }

                // 防止無限循環
                if (result.length > 20) {
                    Game.Debug.log('wallet', '⚠️ 達到最大錢幣數量限制，停止生成');
                    break;
                }
            }

            const actualTotal = result.reduce((sum, money) => sum + money.value, 0);
            Game.Debug.log('wallet', `✅ 生成完成: 目標 ${totalAmount}，實際 ${actualTotal}，錢幣數量 ${result.length}`);

            return result;
        },

        startQuiz() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            Game.Debug.log('state', '🎮 startQuiz() 開始測驗');
            Game.Debug.log('state', '📋 當前遊戲設定:', JSON.stringify(this.state.settings, null, 2));

            // 🔧 [重構] 使用統一重置函數
            this.resetGameState();

            // 重新初始化語音系統（確保「再玩一次」時語音正常）
            this.speech.init();

            // 🎯 [配置驅動] 重設動態價格系統
            if (this.PriceStrategy) {
                this.PriceStrategy.resetSession();
                Game.Debug.log('state', '🎯 [C5-價格系統] 已為', this.state.settings.difficulty, '難度重設價格');
            }

            // 驗證設定完整性
            const { digits, denominations, itemTypes, difficulty, mode } = this.state.settings;
            // 🔧 修復：簡單模式不需要選擇測驗模式
            const modeRequired = difficulty !== 'easy';
            const validationChecks = {
                digits: {
                    value: digits,
                    valid: !!digits && (
                        (digits >= 1 && digits <= 4) ||
                        (digits === 'custom' && this.state.settings.customAmount > 0)
                    )
                },
                denominations: { value: denominations, valid: Array.isArray(denominations) && denominations.length > 0 },
                itemTypes: { value: itemTypes, valid: Array.isArray(itemTypes) && itemTypes.length > 0 },
                difficulty: { value: difficulty, valid: ['easy', 'normal', 'hard'].includes(difficulty) },
                mode: { value: mode, valid: modeRequired ? ['repeated', 'single'].includes(mode) : true }
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
            this.state.quiz.questions = [];
            this.state.quiz.score = 0;
            this.state.quiz.attempts = 0;

            Game.Debug.log('state', '🎯 測驗狀態初始化:', this.state.quiz);

            // 預建題目組合池（自訂金額模式跳過，由 generateCustomAmountQuestion 自行處理）
            if (this.state.settings.digits !== 'custom') {
                this._questionPools = this.buildQuestionPools();
                if (!this._questionPools ||
                    (this._questionPools.sufficient.length + this._questionPools.insufficient.length === 0)) {
                    Game.Debug.error('❌ 無法建立題目組合池，設定無法產生有效題目');
                    this.showGenerationErrorMessage();
                    this.showSettings();
                    return;
                }
            } else {
                this._questionPools = null;
            }

            Game.Debug.log('question', '📝 開始生成題目...');
            const generationStart = performance.now();

            // 生成所有題目
            for (let i = 0; i < this.state.quiz.totalQuestions; i++) {
                Game.Debug.log('question', `🔄 正在生成第 ${i+1} 題...`);
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
                            Game.Debug.log('question', `🔄 第 ${i+1} 題與前題重複，重新生成 (嘗試 ${attempts}/${maxAttempts})`);
                        }
                    }
                }

                const questionTime = performance.now() - questionStart;

                if (question) {
                    this.state.quiz.questions.push(question);
                    Game.Debug.log('question', `✅ 第 ${i+1} 題生成成功 (耗時: ${questionTime.toFixed(2)}ms, 嘗試次數: ${attempts}):`, {
                        item: question.item.name,
                        price: question.itemPrice,
                        totalMoney: question.totalMoney,
                        affordable: question.isAffordable,
                        moneyCount: question.myMoney.length
                    });
                } else {
                    Game.Debug.error(`❌ 第 ${i+1} 題生成失敗 (已嘗試 ${maxAttempts} 次)`);
                    this.showGenerationErrorMessage();
                    this.showSettings();
                    return;
                }
            }

            const totalGenerationTime = performance.now() - generationStart;
            Game.Debug.log('question', `📊 題目生成完成統計:`, {
                totalQuestions: this.state.quiz.questions.length,
                totalTime: `${totalGenerationTime.toFixed(2)}ms`,
                averageTime: `${(totalGenerationTime / this.state.quiz.totalQuestions).toFixed(2)}ms`,
                difficulty: difficulty,
                settings: { digits, denominations: denominations.length, itemTypes: itemTypes.length }
            });

            Game.Debug.log('state', '🚀 準備載入第一題...');
            this.loadQuestion(0);
            if (this.state.settings.difficulty === 'easy' && this.state.settings.assistClick) {
                AssistClick.activate();
            }
        },

        // 載入題目
        loadQuestion(questionIndex) {
            Game.Debug.log('state', `📖 loadQuestion(${questionIndex}) 開始載入題目`);
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
            Game.Debug.log('state', `📝 題目詳情:`, {
                questionIndex: questionIndex + 1,
                item: question.item.name,
                emoji: question.item.emoji,
                price: question.itemPrice,
                myTotalMoney: question.totalMoney,
                moneyPieces: question.myMoney.length,
                isAffordable: question.isAffordable,
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
                Game.Debug.log('ui', `✅ 渲染完成 (耗時: ${renderTime.toFixed(2)}ms)`);

                // 驗證DOM元素是否正確創建
                const verification = this.verifyDOMElements();
                Game.Debug.log('ui', '🔍 DOM元素驗證結果:', verification);

            } catch (error) {
                Game.Debug.error('❌ 渲染失敗:', error);
                Game.Debug.error('堆疊追蹤:', error.stack);
                return;
            }

            this.state.loadingQuestion = false;
            Game.Debug.log('state', '📱 載入狀態已更新為 false');

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
            const gameContainer = document.getElementById('app');
            const { item, itemPrice, myMoney, totalMoney } = question;

            // 生成我的錢區域HTML
            const myMoneyHTML = myMoney.map(money => {
                const isBanknote = money.value >= 100;
                const itemClass = isBanknote ? 'money-item banknote source-money unit5-easy-source-item' : 'money-item coin source-money unit5-easy-source-item';
                return `
                    <div class="${itemClass}" draggable="true" 
                         data-value="${money.value}" id="${money.id}">
                        <img src="${money.image}" alt="${money.value}元" draggable="false" />
                        <div class="money-value">${money.value}元</div>
                    </div>
                `;
            }).join('');

            this.state.gameState = {
                question: question,
                currentTotal: 0,
                questionAnswered: false,
                selectedMoney: []
            };

            gameContainer.innerHTML = `
                <style>${this.getCommonCSS()}${this.getEasyModeCSS()}</style>
                <div class="unit5-easy-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">第 ${this.state.quiz.currentQuestion} / ${this.state.quiz.totalQuestions} 題</div>
                        <div class="title-bar-center"><h2 style="margin: 0; color: inherit;">單元C5：足額付款</h2></div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button id="back-to-menu-btn" class="back-to-menu-btn">返回設定</button>
                        </div>
                    </div>

                    <div class="exchange-section unit5-easy-exchange-section">
                        <h2 class="section-title unit5-easy-section-title">🛒 購物區</h2>
                        <!-- 物品信息 -->
                        <div class="item-total-container" style="text-align: center; width: 100%; margin: 15px 0;">
                            <span class="item-info-display" style="font-size: 1.8em; color: #e74c3c; font-weight: bold;">
                                <span style="font-size: 2.5em; display: inline-flex; align-items: center; vertical-align: middle;">${this.getItemImg(item, '2.5em')}</span> ${item.name} ${itemPrice}元<button class="quiz-speak-btn" onclick="Game.speakQuestion()" title="朗讀題目">🔊</button>
                            </span>
                        </div>
                        <div class="current-total-display unit5-easy-total-display" style="text-align: center; margin: 10px auto;">
                            目前總額: <span id="current-payment">0</span> 元
                        </div>
                        <div id="payment-zone-area" class="drop-zone-container unit5-easy-drop-zone">
                            <div class="payment-hint">請把金錢拖曳放置到購物區</div>
                        </div>
                    </div>

                    <div class="my-money-section unit5-easy-money-section">
                        <h2 class="section-title unit5-easy-section-title">我的錢包</h2>
                        <div id="money-source-area" class="money-source-container unit5-easy-money-source">
                            ${myMoneyHTML}
                        </div>
                    </div>
                </div>
            `;

            this.setupEasyModeEventListeners(question);
        },

        // 普通模式：需要判斷錢夠不夠，然後執行對應動作
        renderNormalMode(question) {
            const gameContainer = document.getElementById('app');
            const { item, itemPrice, myMoney, totalMoney, isAffordable } = question;

            const myMoneyHTML = myMoney.map(money => {
                const isBanknote = money.value >= 100;
                const itemClass = isBanknote ? 'money-item banknote source-money unit5-normal-source-item' : 'money-item coin source-money unit5-normal-source-item';
                return `
                    <div class="${itemClass}" draggable="true" 
                         data-value="${money.value}" id="${money.id}">
                        <img src="${money.image}" alt="${money.value}元" draggable="false" />
                        <div class="money-value">${money.value}元</div>
                    </div>
                `;
            }).join('');

            this.state.gameState = {
                question: question,
                currentTotal: 0,
                questionAnswered: false,
                correctAnswer: isAffordable,
                audioPlayed: false  // 🔧 [修正] 追蹤音效是否已播放
            };

            gameContainer.innerHTML = `
                <style>${this.getCommonCSS()}${this.getNormalModeCSS()}</style>
                <div class="unit5-normal-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">第 ${this.state.quiz.currentQuestion} / ${this.state.quiz.totalQuestions} 題</div>
                        <div class="title-bar-center"><h2 style="margin: 0; color: inherit;">單元C5：足額付款</h2></div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button id="back-to-menu-btn" class="back-to-menu-btn">返回設定</button>
                        </div>
                    </div>

                    <div class="exchange-section unit5-normal-exchange-section">
                        <h2 class="section-title unit5-normal-section-title">
                            🛒 購物區
                            <span class="hint-button-wrapper" style="margin-left: auto; display:inline-flex; align-items:center; gap:6px;">
                                <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                                <button id="hint-button" class="hint-toggle-btn">💡 提示</button>
                            </span>
                        </h2>
                        <!-- 物品信息與總額的容器 -->
                        <div class="item-total-container" style="text-align: center; width: 100%; margin: 15px 0;">
                            <span class="item-info-display" style="font-size: 1.8em; color: #e74c3c; font-weight: bold;">
                                <span style="font-size: 2.5em; display: inline-flex; align-items: center; vertical-align: middle;">${this.getItemImg(item, '2.5em')}</span> ${item.name} ${itemPrice}元<button class="quiz-speak-btn" onclick="Game.speakQuestion()" title="朗讀題目">🔊</button>
                            </span>
                        </div>
                        <div class="current-total-display unit5-normal-total-display" style="display: none; text-align: center; font-size: 1.8em; color: #3498db; margin: 10px 0;">
                            目前總額: <span id="current-payment">???</span> 元
                        </div>
                        <div id="payment-zone-area" class="drop-zone-container unit5-normal-drop-zone">
                            <div class="payment-hint">請把金錢拖曳放置到購物區</div>
                        </div>
                        <div class="judgment-buttons" style="display: none;">
                            <button id="not-enough-btn" class="judgment-btn not-enough-btn">❌錢不夠，不能買</button>
                            <button id="enough-btn" class="judgment-btn enough-btn">💰 錢夠，可以買</button>
                        </div>
                    </div>

                    <div class="my-money-section unit5-normal-money-section">
                        <h2 class="section-title unit5-normal-section-title">我的錢包</h2>
                        <div id="money-source-area" class="money-source-container unit5-normal-money-source">
                            ${myMoneyHTML}
                        </div>
                    </div>
                </div>
            `;

            this.setupNormalModeEventListeners(question);
        },

        // 困難模式：判斷錢夠不夠，無拖拽提示
        renderHardMode(question) {
            const gameContainer = document.getElementById('app');
            const { item, itemPrice, myMoney, totalMoney, isAffordable } = question;

            const myMoneyHTML = myMoney.map(money => {
                const isBanknote = money.value >= 100;
                const itemClass = isBanknote ? 'money-item banknote source-money unit5-hard-source-item' : 'money-item coin source-money unit5-hard-source-item';
                return `
                    <div class="${itemClass}" draggable="true"
                         data-value="${money.value}" id="${money.id}">
                        <img src="${money.image}" alt="${money.value}元" />
                        <div class="money-value">${money.value}元</div>
                    </div>
                `;
            }).join('');

            this.state.gameState = {
                question: question,
                currentTotal: totalMoney,
                questionAnswered: false,
                correctAnswer: isAffordable,
                audioPlayed: false  // 🔧 [修正] 追蹤音效是否已播放
            };

            gameContainer.innerHTML = `
                <style>${this.getCommonCSS()}${this.getHardModeCSS()}</style>
                <div class="unit5-hard-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">第 ${this.state.quiz.currentQuestion} / ${this.state.quiz.totalQuestions} 題</div>
                        <div class="title-bar-center"><h2 style="margin: 0; color: inherit;">單元C5：足額付款</h2></div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button id="back-to-menu-btn" class="back-to-menu-btn">返回設定</button>
                        </div>
                    </div>

                    <div class="exchange-section unit5-hard-exchange-section">
                        <h2 class="section-title unit5-hard-section-title">
                            🛒 購物區
                            <span class="hint-button-wrapper" style="margin-left: auto; display:inline-flex; align-items:center; gap:6px;">
                                <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                                <button id="hint-button" class="hint-toggle-btn">💡 提示</button>
                            </span>
                        </h2>
                        <!-- 物品信息與總額的容器 -->
                        <div class="item-total-container" style="text-align: center; width: 100%; margin: 15px 0;">
                            <span class="item-info-display" style="font-size: 1.8em; color: #e74c3c; font-weight: bold;">
                                <span style="font-size: 2.5em; display: inline-flex; align-items: center; vertical-align: middle;">${this.getItemImg(item, '2.5em')}</span> ${item.name} ${itemPrice}元<button class="quiz-speak-btn" onclick="Game.speakQuestion()" title="朗讀題目">🔊</button>
                            </span>
                        </div>
                        <div class="current-total-display unit5-hard-total-display" style="display: none; text-align: center; font-size: 1.8em; color: #3498db; margin: 10px 0;">
                            目前總額: <span id="current-total-display" class="question-mark-state">？？？</span> 元
                        </div>
                        <div id="payment-zone-area" class="drop-zone-container unit5-hard-drop-zone">
                            <div class="payment-hint">請把金錢拖曳放置到購物區</div>
                        </div>
                        <div class="judgment-buttons" style="display: none;">
                            <button id="not-enough-btn" class="judgment-btn not-enough-btn">❌ 錢不夠，不能買</button>
                            <button id="enough-btn" class="judgment-btn enough-btn">💰 錢夠，可以買</button>
                        </div>
                    </div>

                    <div class="my-money-section unit5-hard-money-section">
                        <h2 class="section-title unit5-hard-section-title">我的錢包</h2>
                        <div id="money-source-area" class="money-source-container unit5-hard-money-source">
                            ${myMoneyHTML}
                        </div>
                    </div>
                </div>
            `;

            this.setupHardModeEventListeners(question);
        },

        // 朗讀題目（🔊 按鈕用）
        speakQuestion() {
            const question = this.state.gameState && this.state.gameState.question;
            if (!question) return;
            const { item, itemPrice } = question;
            const text = this.state.settings.difficulty === 'easy'
                ? `算一算，你的錢夠不夠買${item.name}`
                : `想一想，你的錢夠不夠買${item.name}，它要${itemPrice}元`;
            this.speech.speak(text, { interrupt: true });
        },

        // 指令彈窗
        showInstructionModal(question) {
            const { item, itemPrice } = question;
            const { difficulty } = this.state.settings;

            let instructionText = '';
            switch (difficulty) {
                case 'easy':
                    instructionText = `算一算，你的錢夠不夠買${item.name}`;
                    break;
                case 'normal':
                case 'hard':
                    instructionText = `想一想，你的錢夠不夠買${item.name}，它要${itemPrice}元`;
                    break;
            }

            // 創建彈窗（參考unit4）
            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'c5-instruction-modal';
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

            // 🔧 [防連點] 重置處理標誌
            this.state.isProcessing = false;
            this.state.isProcessingDrop = false;

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

            // 檢查最近的題目（避免連續重複）
            const recentQuestions = existingQuestions.slice(-2); // 檢查最近2題

            return recentQuestions.some(existing => {
                // 1. 檢查物品名稱是否相同
                const sameItem = existing.item.name === newQuestion.item.name;

                // 2. 檢查價格是否相同
                const samePrice = existing.itemPrice === newQuestion.itemPrice;

                // 3. 檢查總金額是否相同
                const sameTotalMoney = existing.totalMoney === newQuestion.totalMoney;

                // 4. 檢查錢夠/不夠的狀態是否相同
                const sameAffordability = existing.isAffordable === newQuestion.isAffordable;

                // 如果物品和價格都相同，或者總金額和可負擔狀態都相同，視為重複
                const isDuplicate = (sameItem && samePrice) || (sameTotalMoney && sameAffordability);

                if (isDuplicate) {
                    Game.Debug.log('question', '🔍 發現重複題目:', {
                        existing: {
                            item: existing.item.name,
                            price: existing.itemPrice,
                            totalMoney: existing.totalMoney,
                            affordable: existing.isAffordable
                        },
                        new: {
                            item: newQuestion.item.name,
                            price: newQuestion.itemPrice,
                            totalMoney: newQuestion.totalMoney,
                            affordable: newQuestion.isAffordable
                        },
                        reasons: {
                            sameItem,
                            samePrice,
                            sameTotalMoney,
                            sameAffordability
                        }
                    });
                }

                return isDuplicate;
            });
        },

        // 🔧 [修正] 清除所有現有的訊息視窗
        // 將差額金額分解為真實金錢圖示 HTML
        buildShortfallHTML(shortfall) {
            if (!shortfall || shortfall <= 0) return '';
            const denoms = [1000, 500, 100, 50, 10, 5, 1];
            let remaining = shortfall;
            const coins = [];
            for (const d of denoms) {
                while (remaining >= d && coins.length < 12) {
                    coins.push(d);
                    remaining -= d;
                }
                if (coins.length >= 12) break;
            }
            const imgsHTML = coins.map(d => {
                const isBanknote = d >= 100;
                const w = isBanknote ? '72px' : '44px';
                return `<img src="../images/money/${d}_yuan_front.png" alt="${d}元"
                    style="width:${w};height:auto;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));">`;
            }).join('');
            return `<div style="margin-top:14px;border-top:2px dashed rgba(255,255,255,0.55);padding-top:12px;text-align:center;">
                <div style="font-size:0.8em;font-weight:bold;margin-bottom:8px;letter-spacing:0.5px;">
                    還差 <span style="font-size:1.4em;color:#FFD700;">${shortfall}</span> 元
                </div>
                <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;align-items:center;">
                    ${imgsHTML}
                </div>
            </div>`;
        },

        clearAllMessages() {
            const existingMessages = document.querySelectorAll('.game-message');
            existingMessages.forEach(msg => {
                if (msg.parentNode) {
                    msg.parentNode.removeChild(msg);
                }
            });
        },

        // 顯示訊息（extraHTML 為選填，不會被語音朗讀）
        showMessage(text, type, callback = null, extraHTML = '') {
            // 🔧 [修正] 清除所有現有的訊息視窗，防止重疊
            this.clearAllMessages();

            const message = document.createElement('div');
            message.classList.add('game-message'); // 添加識別類名

            // 添加emoji圖標
            const emoji = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
            const messageContent = document.createElement('div');
            messageContent.innerHTML = `
                <div style="font-size: 2em; margin-bottom: 10px;">${emoji}</div>
                <div>${text}</div>
                ${extraHTML}
            `;

            const bgColors = {
                success: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                warning: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                error: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
            };
            const borderColors = { success: '#27ae60', warning: '#e67e22', error: '#c0392b' };
            const bg = bgColors[type] || bgColors.error;
            const borderColor = borderColors[type] || borderColors.error;

            message.appendChild(messageContent);
            message.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: ${bg};
                color: white;
                padding: 30px;
                border-radius: 20px;
                font-size: 1.3em;
                z-index: 1000;
                box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                text-align: center;
                font-weight: bold;
                min-width: 300px;
                border: 3px solid ${borderColor};
                animation: messageSlideIn 0.3s ease-out;
            `;
            
            // 🎬 messageSlideIn, messageSlideOut - moved to injectGlobalAnimationStyles()

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
                    }, 300, 'ui');
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

            // 🔧 [修正] 移除先出現的全屏煙火動畫，直接顯示測驗總結畫面（含煙火）
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
                }, 1000, 'ui');
            }, 3000);
        },

        // 顯示結果視窗
        displayResultsWindow() {
            const gameContainer = document.getElementById('app');
            const { score, totalQuestions, startTime } = this.state.quiz;

            const correctAnswers = score / 10;
            const percentage = Math.round((correctAnswers / totalQuestions) * 100);

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'c5', unitName: 'C5 足額付款', series: 'C',
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
                                <div class="achievement-item">🎯 學會比較金額與價格大小</div>
                                <div class="achievement-item">💰 判斷錢包是否足夠購買商品</div>
                                <div class="achievement-item">📝 培養實際購物前的評估能力</div>
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

                    /* 🎬 fadeIn, celebrate, bounce, glow - moved to injectGlobalAnimationStyles() */

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
                    <li>選擇<strong>面額較大</strong>的錢幣（例如：選3位數時需包含50元或100元）</li>
                    <li>選擇更多的錢幣面額種類</li>
                    <li>調整為較低的價格位數（例如：改用2位數）</li>
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

        // 獲取物品圖片 HTML（圖片優先，emoji 備用）
        getItemImg(item, size = '3em') {
            if (!item.img) return item.emoji;
            return `<img src="../images/c5/${item.img}.png"
                    style="width:${size};height:${size};object-fit:contain;vertical-align:middle;"
                    onerror="this.outerHTML='${item.emoji}'"
                    alt="${item.name}">`;
        },

        // 獲取物品圖片或emoji替代方案
        getItemDisplay(item) {
            return `
                <div class="item-display"
                     style="width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;
                            background: rgba(255,255,255,0.1); border-radius: 8px; font-size: 3em;">
                    <div class="item-emoji" title="${item.name}">${this.getItemImg(item, '80px')}</div>
                </div>
            `;
        },

        // 獲取小尺寸物品圖片或emoji替代方案（用於指令彈窗）
        getSmallItemDisplay(item) {
            return `
                <div class="small-item-display"
                     style="width: 128px; height: 128px; display: flex; align-items: center; justify-content: center;
                            background: rgba(255,255,255,0.1); border-radius: 8px; font-size: 2.5em; margin-bottom: 15px;">
                    <div class="small-item-emoji" title="${item.name}">${this.getItemImg(item, '128px')}</div>
                </div>
            `;
        },




        // 事件監聽器設定
        setupEasyModeEventListeners(question) {
            // 簡單模式事件監聽器
            const backBtn = document.getElementById('back-to-menu-btn');
            if (backBtn) {
                Game.EventManager.on(backBtn, 'click', () => this.showSettings(), {}, 'gameUI');
            }
            
            // 設置拖放功能
            this.setupDragAndDrop();
        },

        setupNormalModeEventListeners(question) {
            // 普通模式事件監聽器
            const backBtn = document.getElementById('back-to-menu-btn');
            if (backBtn) {
                Game.EventManager.on(backBtn, 'click', () => this.showSettings(), {}, 'gameUI');
            }

            const enoughBtn = document.getElementById('enough-btn');
            const notEnoughBtn = document.getElementById('not-enough-btn');

            if (enoughBtn) {
                Game.EventManager.on(enoughBtn, 'click', () => this.handleJudgment(true, question), {}, 'gameUI');
            }
            if (notEnoughBtn) {
                Game.EventManager.on(notEnoughBtn, 'click', () => this.handleJudgment(false, question), {}, 'gameUI');
            }

            // 🆕 普通模式總額提示按鈕事件
            const hintButton = document.getElementById('hint-button');
            if (hintButton) {
                let hideTimer = null;

                Game.EventManager.on(hintButton, 'click', () => {
                    const currentPaymentElement = document.getElementById('current-payment');
                    const totalDisplay = document.querySelector('.unit5-normal-total-display');

                    if (currentPaymentElement && totalDisplay) {
                        // 如果已有計時器，清除它
                        if (hideTimer) {
                            Game.TimerManager.clearTimeout(hideTimer);
                            hideTimer = null;
                        }

                        // 顯示目前總額
                        const currentTotal = this.calculateCurrentTotal();
                        currentPaymentElement.textContent = currentTotal;
                        totalDisplay.classList.add('hint-shown');
                        Game.Debug.log('hint', '👁️ 普通模式：顯示總額，3秒後隱藏');

                        // 播放語音
                        if (this.speech && typeof this.speech.speak === 'function') {
                            let traditionalTotal = currentTotal === 0 ? '零元' : this.speech.convertToTraditionalCurrency(currentTotal);
                            this.speech.speak(`目前總額是${traditionalTotal}`, { interrupt: true });
                        }

                        // 3秒後隱藏總額
                        hideTimer = Game.TimerManager.setTimeout(() => {
                            totalDisplay.classList.remove('hint-shown');
                            currentPaymentElement.textContent = '???';
                            hideTimer = null;
                            Game.Debug.log('hint', '⏰ 普通模式：3秒時間到，隱藏總額');
                        }, 3000, 'ui');
                    }
                }, {}, 'gameUI');
            }

            // 設置拖放功能
            this.setupDragAndDrop();
        },

        setupHardModeEventListeners(question) {
            // 困難模式事件監聽器
            const backBtn = document.getElementById('back-to-menu-btn');
            if (backBtn) {
                Game.EventManager.on(backBtn, 'click', () => this.showSettings(), {}, 'gameUI');
            }

            const enoughBtn = document.getElementById('enough-btn');
            const notEnoughBtn = document.getElementById('not-enough-btn');

            if (enoughBtn) {
                Game.EventManager.on(enoughBtn, 'click', () => this.handleJudgment(true, question), {}, 'gameUI');
            }
            if (notEnoughBtn) {
                Game.EventManager.on(notEnoughBtn, 'click', () => this.handleJudgment(false, question), {}, 'gameUI');
            }
            
            // 🆕 困難模式總額提示按鈕事件
            const hintButton = document.getElementById('hint-button');
            if (hintButton) {
                let isShowingTotal = false;
                let hideTimer = null; // 用於存儲隱藏計時器

                Game.EventManager.on(hintButton, 'click', () => {
                    const currentTotalDisplay = document.getElementById('current-total-display');
                    const totalDisplayDiv = document.querySelector('.unit5-hard-total-display');

                    if (currentTotalDisplay && totalDisplayDiv) {
                        if (isShowingTotal) {
                            // 手動點擊隱藏
                            totalDisplayDiv.classList.remove('hint-shown');
                            currentTotalDisplay.textContent = '？？？';
                            currentTotalDisplay.classList.add('question-mark-state');
                            isShowingTotal = false;
                            Game.Debug.log('hint', '🔒 困難模式：手動隱藏總額');

                            // 清除自動隱藏計時器
                            if (hideTimer) {
                                Game.TimerManager.clearTimeout(hideTimer);
                                hideTimer = null;
                            }
                        } else {
                            // 顯示總額
                            const currentTotal = this.calculateCurrentTotal();
                            currentTotalDisplay.textContent = currentTotal;
                            currentTotalDisplay.classList.remove('question-mark-state');
                            totalDisplayDiv.classList.add('hint-shown');
                            isShowingTotal = true;
                            Game.Debug.log('hint', '👁️ 困難模式：顯示總額，3秒後自動隱藏');

                            // 播放語音（同普通模式）
                            if (this.speech && typeof this.speech.speak === 'function') {
                                const traditionalTotal = currentTotal === 0 ? '零元' : this.speech.convertToTraditionalCurrency(currentTotal);
                                this.speech.speak(`目前總額是${traditionalTotal}`, { interrupt: true });
                            }

                            // 🆕 設置3秒自動隱藏計時器
                            hideTimer = Game.TimerManager.setTimeout(() => {
                                totalDisplayDiv.classList.remove('hint-shown');
                                currentTotalDisplay.textContent = '？？？';
                                currentTotalDisplay.classList.add('question-mark-state');
                                isShowingTotal = false;
                                hideTimer = null;
                                Game.Debug.log('hint', '⏰ 困難模式：3秒時間到，自動隱藏總額');
                            }, 3000, 'ui');
                        }

                        // 播放點擊音效
                        this.audio.playClickSound();
                    }
                }, {}, 'gameUI');

                Game.Debug.log('event', '✅ 困難模式總額提示按鈕事件已設置');
            }
            
            // 困難模式也支援拖放功能
            this.setupDragAndDrop();
        },


        // 設置拖放功能
        setupDragAndDrop() {
            // 使用 setTimeout 確保 DOM 元素已完全渲染
            Game.TimerManager.setTimeout(() => {
                Game.Debug.log('drag', '🔧 開始設置拖放功能...');
                
                // 🔧 [新增] 設置點擊事件處理
                this.setupClickEventListeners();
                
                // 設置金錢拖曳事件
                const moneyItems = document.querySelectorAll('.money-item[draggable="true"]');
                Game.Debug.log('drag', `💰 找到 ${moneyItems.length} 個可拖曳的金錢項目`);

                // 🔧 [性能修正] 只有在金錢元素存在時才設置TouchDragUtility
                if (moneyItems.length > 0) {
                    // 設置觸控拖拽支援
                    this.setupTouchDragSupport();
                } else {
                    Game.Debug.log('drag', '⚠️ 金錢元素尚未載入，將延遲設置TouchDragUtility');
                    // 如果金錢元素還沒載入，稍後再試
                    Game.TimerManager.setTimeout(() => {
                        Game.Debug.log('drag', '🔄 延遲設置TouchDragUtility...');
                        this.setupTouchDragSupport();
                    }, 200, 'drag');
                }

                moneyItems.forEach((item, index) => {
                    Game.Debug.log('drag', `🎯 設置第 ${index + 1} 個金錢項目拖曳事件:`, item.dataset.value);

                    Game.EventManager.on(item, 'dragstart', (e) => {
                        // 🔧 [修正] 開始拖曳時清除任何顯示中的錯誤訊息
                        this.clearAllMessages();

                        // 確保獲取到正確的金錢項目元素
                        const moneyItem = e.target.closest('.money-item');
                        if (moneyItem) {
                            Game.Debug.log('drag', '🎯 開始拖曳金錢:', moneyItem.dataset.value);
                            e.dataTransfer.setData('text/plain', moneyItem.id);
                            e.dataTransfer.effectAllowed = 'move';
                            moneyItem.style.opacity = '0.5';

                            // 🆕 使用去背圖片作為拖曳預覽
                            const img = moneyItem.querySelector('img');
                            if (img) {
                                // 創建一個只有圖片的拖曳預覽
                                const dragImg = img.cloneNode(true);
                                dragImg.style.width = img.offsetWidth * 1.2 + 'px';
                                dragImg.style.height = img.offsetHeight * 1.2 + 'px';
                                dragImg.style.position = 'absolute';
                                dragImg.style.top = '-9999px';
                                dragImg.style.left = '-9999px';
                                document.body.appendChild(dragImg);

                                // 設置拖曳圖片，偏移量讓圖片置中於游標
                                if (e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                                    e.dataTransfer.setDragImage(dragImg, dragImg.offsetWidth / 2, dragImg.offsetHeight / 2);
                                }

                                // 延遲移除臨時元素
                                Game.TimerManager.setTimeout(() => dragImg.remove(), 0, 'ui');
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
                Game.Debug.log('drag', '🛒 購物區元素:', dropZone ? '找到' : '未找到');

                if (dropZone) {
                    Game.Debug.log('drag', '🔧 設置兌換區拖放事件...');

                    Game.EventManager.on(dropZone, 'dragover', (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        dropZone.style.backgroundColor = '#e8f5e8';
                        dropZone.style.borderColor = '#4CAF50';
                        Game.Debug.log('drag', '🎯 金錢正在兌換區上方');
                    }, {}, 'dragSystem');

                    Game.EventManager.on(dropZone, 'dragleave', (e) => {
                        if (!dropZone.contains(e.relatedTarget)) {
                            dropZone.style.backgroundColor = '';
                            dropZone.style.borderColor = '';
                            Game.Debug.log('drag', '🎯 金錢離開兌換區');
                        }
                    }, {}, 'dragSystem');

                    Game.EventManager.on(dropZone, 'drop', (e) => {
                        e.preventDefault();
                        const moneyId = e.dataTransfer.getData('text/plain');
                        const moneyElement = document.getElementById(moneyId);

                        Game.Debug.log('drag', '🎯 嘗試放置金錢:', moneyId);

                        if (moneyElement) {
                            const value = parseInt(moneyElement.dataset.value);
                            Game.Debug.log('drag', '💰 成功放置金錢到兌換區:', value);
                            
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

                Game.Debug.log('drag', '✅ 拖放功能設置完成');
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
            const paymentHint = document.querySelector('.payment-hint');

            if (paymentZone && (currentPaymentElement || currentTotalDisplayElement)) {
                const moneyInZone = paymentZone.querySelectorAll('.money-item');
                let total = 0;

                moneyInZone.forEach(money => {
                    total += parseInt(money.dataset.value);
                });

                // 更新總額顯示（根據不同模式更新不同元素）
                const { difficulty } = this.state.settings;
                if (currentPaymentElement) {
                    // 🔧 [修正] 普通模式：不即時更新總額顯示，保持顯示 ???
                    // 總計金額只在按下提示鈕時才顯示
                    if (difficulty === 'easy') {
                        currentPaymentElement.textContent = total;
                    }
                    // normal 模式保持 ??? 顯示，由提示按鈕控制
                }
                if (currentTotalDisplayElement && difficulty === 'hard') {
                    // 困難模式：只有在沒有顯示提示狀態時才更新總額
                    const hintButton = document.getElementById('hint-button');
                    if (hintButton && !hintButton.textContent.includes('隱藏')) {
                        if (total > 0) {
                            currentTotalDisplayElement.textContent = total;
                            currentTotalDisplayElement.classList.remove('question-mark-state');
                        } else {
                            currentTotalDisplayElement.textContent = '？？？';
                            currentTotalDisplayElement.classList.add('question-mark-state');
                        }
                    }
                }
                Game.Debug.log('payment', '💰 更新付款總額:', total);

                // 控制提示文字顯示/隱藏
                if (paymentHint) {
                    if (moneyInZone.length > 0) {
                        // 有金錢時隱藏提示
                        paymentHint.style.display = 'none';
                        Game.Debug.log('ui', '💡 隱藏兌換區提示文字');
                    } else {
                        // 沒有金錢時顯示提示
                        paymentHint.style.display = 'block';
                        Game.Debug.log('ui', '💡 顯示兌換區提示文字');
                    }
                }
                
                // 更新遊戲狀態
                if (this.state.gameState) {
                    this.state.gameState.currentTotal = total;
                }

                // 🆕 普通/困難模式：所有金錢放置完畢後顯示判斷按鈕
                if (difficulty === 'normal' || difficulty === 'hard') {
                    const moneySourceArea = document.getElementById('money-source-area');
                    const remainingMoney = moneySourceArea ? moneySourceArea.querySelectorAll('.money-item') : [];
                    const judgmentButtons = document.querySelector('.judgment-buttons');
                    if (judgmentButtons) {
                        if (remainingMoney.length === 0) {
                            judgmentButtons.style.display = 'flex';
                        } else {
                            judgmentButtons.style.display = 'none';
                        }
                    }
                }
                
                // 🆕 音效/語音播放邏輯
                // difficulty 已在上方宣告
                if (difficulty === 'easy') {
                    // 簡單模式：取消之前的語音計時器，設置新的計時器
                    if (this.totalAmountSpeechTimer) {
                        Game.TimerManager.clearTimeout(this.totalAmountSpeechTimer);
                    }
                    
                    this.totalAmountSpeechTimer = Game.TimerManager.setTimeout(() => {
                        const voiceText = `${total}元`;
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
                            }, 2000, 'question'); // 給語音足夠時間播放完畢
                        }
                    }, 300); // 300ms延遲，如果快速拖拽會被取消並重新設置
                    
                } else if (difficulty === 'normal') {
                    // 普通模式：播放總額語音（300ms debounce 避免快速連續拖入時中斷語音）
                    // total=0 時（答錯退回金錢）不播語音
                    if (this.normalModeSpeechTimer) {
                        Game.TimerManager.clearTimeout(this.normalModeSpeechTimer);
                    }
                    if (total > 0) {
                        const voiceText = `${total}元`;
                        this.normalModeSpeechTimer = Game.TimerManager.setTimeout(() => {
                            this.speech.speak(voiceText, { interrupt: true });
                            Game.Debug.log('speech', '🗣️ 普通模式播放總額語音:', voiceText);
                            this.checkEasyModeAutoJudgment();
                        }, 300);
                    }

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
            
            Game.Debug.log('judge', '🤖 簡單模式自動判斷:', {
                currentTotal,
                itemPrice,
                isAffordable,
                itemName
            });

            // 直接執行自動判斷（不需要額外延遲，因為已經通過語音回調控制時機）
            if (isAffordable) {
                // 足夠時：播放正確音效
                Game.Debug.log('judge', '✅ 錢足夠，播放成功音效');
                if (!this.state.gameState.audioPlayed) {
                    this.audio.playCorrectSound();
                    this.state.gameState.audioPlayed = true; // 🔧 [修正] 標記音效已播放
                }

                // 🔧 [修正] 移除此處煙火動畫，只保留測驗總結畫面的煙火
                // this.startFireworksAnimation();

                Game.TimerManager.setTimeout(() => {
                    this.handleJudgment(isAffordable, question, {
                        currentTotal,
                        itemPrice,
                        itemName
                    });
                }, 500); // 等待音效播放

            } else {
                // 不足時：播放正確音效（簡單模式數完即完成，不播錯誤音）
                Game.Debug.log('judge', '✅ 錢不足（簡單模式數完），播放正確音效');
                if (!this.state.gameState.audioPlayed) {
                    this.audio.playCorrectSound();
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
            // 🔧 [防連點] 檢查是否正在處理判斷
            if (this.state.isProcessing) {
                Game.Debug.log('judge', '[C5] 防抖：handleJudgment 忽略重複點擊');
                return;
            }
            this.state.isProcessing = true;

            Game.Debug.log('judge', '🎯 handleJudgment() 被調用');
            Game.Debug.log('judge', '📝 判斷參數:', {
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
                
                Game.Debug.log('judge', `🔍 ${difficulty === 'normal' ? '普通' : '困難'}模式金錢檢查:`, {
                    remainingInSource: remainingMoney.length,
                    inExchangeZone: moneyInZone.length
                });

                // 檢查我的金錢區是否還有剩餘金錢
                if (remainingMoney.length > 0) {
                    Game.Debug.log('judge', `⚠️ ${difficulty === 'normal' ? '普通' : '困難'}模式：我的金錢區還有 ${remainingMoney.length} 個金錢未放置`);
                    const warningMessage = '請將我的金錢區的金錢全部放到購物區，再按下按鈕';
                    
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
                    Game.Debug.log('judge', `⚠️ ${difficulty === 'normal' ? '普通' : '困難'}模式：兌換區沒有金錢`);
                    const warningMessage = '請先將你的金錢放到購物區，再按下按鈕';
                    
                    this.showMessage(warningMessage, 'warning', (hideMessage) => {
                        this.speech.speak(warningMessage, {
                            callback: () => {
                                hideMessage();
                            }
                        });
                    });
                    // 🔧 [防連點] 重置處理標誌
                    this.state.isProcessing = false;
                    return; // 阻止繼續執行判斷邏輯
                }

                Game.Debug.log('judge', `✅ ${difficulty === 'normal' ? '普通' : '困難'}模式：所有金錢都已正確放置到兌換區`);
            }

            if (this.state.gameState.questionAnswered) {
                Game.Debug.log('judge', '❌ 題目已回答，忽略重複點擊');
                // 🔧 [防連點] 重置處理標誌
                this.state.isProcessing = false;
                return;
            }
            
            const { itemPrice, isAffordable, totalMoney, item } = question;
            const itemName = item?.name || '物品';
            const isCorrect = userSaysEnough === isAffordable;

            Game.Debug.log('judge', '🔍 判斷邏輯分析:', {
                itemPrice,
                totalMoney,
                isAffordable,
                userSaysEnough,
                isCorrect,
                difference: totalMoney - itemPrice
            });

            if (isCorrect) {
                // 判斷正確
                Game.Debug.log('judge', '✅ 判斷正確！');
                this.state.gameState.questionAnswered = true;
                
                // 如果不是自動判斷且音效未播放，播放正確音效
                if (!autoJudgmentData && !this.state.gameState.audioPlayed) {
                    this.audio.playCorrectSound();
                    this.state.gameState.audioPlayed = true; // 🔧 [修正] 標記音效已播放
                }
                
                const oldScore = this.state.quiz.score;
                this.state.quiz.score += 10;
                Game.Debug.log('state', `📈 分數更新: ${oldScore} → ${this.state.quiz.score}`);

                // 判斷是否為最後一題
                const isLastQuestion = this.state.quiz.currentQuestion >= this.state.quiz.totalQuestions;
                const endingText = isLastQuestion ? '測驗結束' : '進入下一題';

                let message;
                let shortfallHTML = '';
                if (autoJudgmentData) {
                    // 自動判斷使用新格式訊息
                    const { currentTotal, itemPrice: autoItemPrice, itemName } = autoJudgmentData;
                    if (userSaysEnough) {
                        // 錢夠的情況
                        message = `恭喜你數完了！你的錢總共${currentTotal}元，可以買${autoItemPrice}元的${itemName}！${endingText}`;
                    } else {
                        // 錢不夠的情況：額外顯示差額金錢圖示
                        message = `恭喜你數完了！你的錢總共${currentTotal}元，不能購買${autoItemPrice}元的${itemName}，${endingText}`;
                        shortfallHTML = this.buildShortfallHTML(autoItemPrice - currentTotal);
                    }
                } else {
                    // 手動判斷使用原始格式訊息
                    if (!userSaysEnough) {
                        // 錢不夠的情況：額外顯示差額金錢圖示
                        shortfallHTML = this.buildShortfallHTML(itemPrice - totalMoney);
                    }
                    message = userSaysEnough ?
                        `恭喜你答對了！你的錢夠買${itemPrice}元的${itemName}！${endingText}` :
                        `恭喜你答對了！你的錢不夠買${itemPrice}元的${itemName}！${endingText}`;
                }

                const messageType = 'success';

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
                }, shortfallHTML);

            } else {
                // 判斷錯誤
                Game.Debug.log('judge', '❌ 判斷錯誤！');
                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試

                // 如果不是自動判斷且音效未播放，播放錯誤音效
                if (!autoJudgmentData && !this.state.gameState.audioPlayed) {
                    this.audio.playErrorSound();
                    this.state.gameState.audioPlayed = true; // 🔧 [修正] 標記音效已播放
                }

                const oldAttempts = this.state.quiz.attempts;
                this.state.quiz.attempts += 1;
                Game.Debug.log('state', `📉 錯誤次數更新: ${oldAttempts} → ${this.state.quiz.attempts}`);

                const mode = this.state.settings.mode;
                let message;

                if (mode === 'single') {
                    // 單次作答：包含正確答案提示與結尾文字
                    const isLastQuestion = this.state.quiz.currentQuestion >= this.state.quiz.totalQuestions;
                    const endingText = isLastQuestion ? '測驗結束' : '進入下一題';

                    if (autoJudgmentData) {
                        const { currentTotal, itemPrice, itemName } = autoJudgmentData;
                        const correctAnswerHint = userSaysEnough ?
                            '你的錢不夠，無法購買這個物品' :
                            '你的錢已經足夠購買這個物品';
                        message = userSaysEnough ?
                            `不好意思，你的錢總共${currentTotal}元，不能購買${itemPrice}元的${itemName}！正確答案：${correctAnswerHint}，${endingText}` :
                            `恭喜你！你的錢總共${currentTotal}元，可以買${itemPrice}元的${itemName}！正確答案：${correctAnswerHint}，${endingText}`;
                    } else {
                        const correctAnswerHint = userSaysEnough ?
                            '你的錢不夠，無法購買這個物品' :
                            '你的錢已經足夠購買這個物品';
                        message = userSaysEnough ?
                            `錯誤！你的錢不夠買${itemPrice}元的${itemName}！正確答案：${correctAnswerHint}，${endingText}` :
                            `錯誤！你的錢夠買${itemPrice}元的${itemName}！正確答案：${correctAnswerHint}，${endingText}`;
                    }
                } else {
                    // 反復作答：精簡語音
                    message = '不對喔，請再試一次';
                }

                Game.Debug.log('ui', '💬 顯示錯誤訊息:', message);

                // 根據模式決定錯誤後的行為
                if (mode === 'single') {
                    // 單次作答：顯示錯誤消息後自動進入下一題
                    this.showMessage(message, 'error', (hideMessage) => {
                        this.speech.speak(message, {
                            callback: () => {
                                hideMessage();
                                Game.TimerManager.setTimeout(() => {
                                    Game.Debug.log('state', '➡️ 單次作答模式，自動前往下一題');
                                    this.nextQuestion();
                                }, 1500);
                            }
                        });
                    });
                } else {
                    // 反復作答：允許重新選擇
                    this.showMessage(message, 'error', (hideMessage) => {
                        this.speech.speak(message, {
                            callback: () => {
                                // 語音播放完成後隱藏消息
                                hideMessage();
                                // 退回金錢到錢包，讓使用者重新放置
                                const paymentZone = document.getElementById('payment-zone-area');
                                const sourceArea = document.getElementById('money-source-area');
                                if (paymentZone && sourceArea) {
                                    paymentZone.querySelectorAll('.money-item').forEach(item => sourceArea.appendChild(item));
                                    this.updatePaymentTotal(); // 自動更新總額=0、顯示提示、隱藏判斷按鈕
                                }
                                // 重置防抖旗標，讓使用者可以再次點擊判斷按鈕
                                this.state.isProcessing = false;
                                // 重置音效旗標，讓下次答錯時仍能播放錯誤音效
                                this.state.gameState.audioPlayed = false;
                            }
                        });
                    });

                    Game.Debug.log('state', '⏳ 等待用戶重新選擇...');
                }
            }

            Game.Debug.log('state', '📊 當前測驗狀態:', {
                currentQuestion: this.state.quiz.currentQuestion,
                totalQuestions: this.state.quiz.totalQuestions,
                score: this.state.quiz.score,
                attempts: this.state.quiz.attempts,
                questionAnswered: this.state.gameState.questionAnswered
            });
        },

        // =====================================================
        // 自訂題目數量功能（參考其他單元）
        // =====================================================
        showCustomQuestionInput() {
            this.showNumberInput('請輸入題目數量', (value) => {
                const questionCount = parseInt(value);
                if (isNaN(questionCount) || questionCount < 1 || questionCount > 100) {
                    alert('請輸入 1-100 之間的有效數字');
                    return false;
                }
                
                this.state.settings.questionCount = questionCount;
                
                // 更新active狀態
                const customBtn = document.querySelector('[data-value="custom"]');
                if (customBtn) {
                    const buttonGroup = customBtn.closest('.button-group');
                    buttonGroup.querySelectorAll('.selection-btn')
                        .forEach(b => b.classList.remove('active'));
                    customBtn.classList.add('active');
                }

                // 🔧 [新增] 顯示自訂題數輸入框並套用藍色樣式（避免閃爍）
                const customDisplay = document.querySelector('.custom-question-display');
                const customInput = document.getElementById('custom-question-count-c5');
                if (customDisplay && customInput) {
                    customDisplay.style.display = 'block';
                    customInput.value = `${questionCount}題`;
                    customInput.style.background = '#667eea';
                    customInput.style.color = 'white';
                    customInput.style.borderColor = '#667eea';
                }

                // 檢查是否可以開始遊戲
                this.checkStartState();

                return true;
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

            const keypadAudio = new Audio('../audio/units/keypad.mp3');
            keypadAudio.volume = 0.7;
            keypadAudio.preload = 'auto';

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
                        keypadAudio.currentTime = 0; keypadAudio.play().catch(() => {});
                        display.value = '';
                    } else if (key === '確認') {
                        if (display.value && callback(display.value)) {
                            document.getElementById('number-input-popup').remove();
                        }
                    } else {
                        keypadAudio.currentTime = 0; keypadAudio.play().catch(() => {});
                        if (display.value.length < 5) display.value += key;
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
                    margin: 0 0 0 20px !important;
                    text-align: center !important;
                    font-size: 1.5em !important;
                    font-weight: 900 !important;
                    color: #333 !important;
                    border: 4px solid #FF8C00 !important;
                    box-shadow: 0 4px 15px rgba(255, 140, 0, 0.5) !important;
                    width: fit-content !important;
                    max-width: 400px !important;
                    letter-spacing: 1px !important;
                    display: inline-block !important;
                }

                .current-total-display #current-payment,
                .current-total-display #current-total-display {
                    color: #FF0000 !important;
                    font-weight: 900 !important;
                    font-size: 1em !important;
                    text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.3) !important;
                }

                /* 簡單模式總額置中顯示 */
                .unit5-easy-total-display {
                    display: block !important;
                    margin: 10px auto !important;
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
                
                /* 🎬 totalAmountGlow - moved to injectGlobalAnimationStyles() */

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
                    margin: 0 0 0 20px !important;
                    text-align: center !important;
                    font-size: 1.5em !important;
                    font-weight: 900 !important;
                    color: #333 !important;
                    border: 4px solid #FF8C00 !important;
                    box-shadow: 0 4px 15px rgba(255, 140, 0, 0.5) !important;
                    width: fit-content !important;
                    max-width: 400px !important;
                    letter-spacing: 1px !important;
                    display: inline-block !important;
                }

                .current-total-display #current-payment,
                .current-total-display #current-total-display {
                    color: #FF0000 !important;
                    font-weight: 900 !important;
                    font-size: 1em !important;
                    text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.3) !important;
                }

                /* 🆕 普通模式標題flex布局，讓提示按鈕靠右 */
                .unit5-normal-section-title {
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                /* 🆕 提示按鈕包裝器 */
                .hint-button-wrapper {
                    position: absolute;
                    right: 10px;
                }

                /* 🆕 提示按鈕樣式 */
                .hint-toggle-btn {
                    background: linear-gradient(135deg, #f39c12, #e67e22);
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 20px;
                    font-size: 0.9em;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(243, 156, 18, 0.3);
                }

                .hint-toggle-btn:hover {
                    background: linear-gradient(135deg, #e67e22, #d35400);
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(243, 156, 18, 0.4);
                }

                .hint-toggle-btn:active {
                    transform: scale(0.95);
                }

                /* C5 普通模式總額顯示（按提示時顯示數值） */
                .unit5-normal-total-display {
                    display: none !important;
                    margin: 10px auto !important;
                    transition: color 0.3s ease;
                }

                .unit5-normal-total-display.hint-shown {
                    display: block !important;
                    color: #2ecc71;
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
                #current-total-display.question-mark-state {
                    color: #ffaa00;
                    animation: questionPulse 2s ease-in-out infinite alternate;
                }

                /* 🎬 questionPulse - moved to injectGlobalAnimationStyles() */

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
                
                /* 🎬 totalAmountGlow - moved to injectGlobalAnimationStyles() */

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
                    margin: 0 0 0 20px !important;
                    text-align: center !important;
                    font-size: 1.5em !important;
                    font-weight: 900 !important;
                    color: #333 !important;
                    border: 4px solid #FF8C00 !important;
                    box-shadow: 0 4px 15px rgba(255, 140, 0, 0.5) !important;
                    width: fit-content !important;
                    max-width: 400px !important;
                    letter-spacing: 1px !important;
                    display: inline-block !important;
                }

                .current-total-display #current-payment,
                .current-total-display #current-total-display {
                    color: #FF0000 !important;
                    font-weight: 900 !important;
                    font-size: 1em !important;
                    text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.3) !important;
                }

                /* C5 困難模式總額顯示（按提示時顯示數值） */
                .unit5-hard-total-display {
                    display: none !important;
                    margin: 10px auto !important;
                }

                .unit5-hard-total-display.hint-shown {
                    display: block !important;
                }
            `;
        },

        // 設置觸控拖拽支援
        setupTouchDragSupport() {
            Game.Debug.log('touch', '🎯 [C5-足夠支付] 檢查 TouchDragUtility 狀態', {
                touchUtilityExists: !!window.TouchDragUtility,
                touchUtilityType: typeof window.TouchDragUtility
            });

            if (!window.TouchDragUtility) {
                Game.Debug.error('❌ TouchDragUtility 未載入，觸控拖曳功能無法使用');
                return;
            }

            const gameArea = document.getElementById('app');
            if (!gameArea) return;

            // 🔧 [性能修正] 檢查金錢元素是否存在，避免無意義的註冊
            const moneyItems = document.querySelectorAll('.money-item[draggable="true"]');
            Game.Debug.log('touch', '🎯 [C5-足夠支付] 檢查金錢元素狀態:', {
                moneyItemsFound: moneyItems.length,
                gameAreaExists: !!gameArea
            });

            if (moneyItems.length === 0) {
                Game.Debug.log('touch', '⚠️ [C5-足夠支付] 金錢元素尚未渲染，跳過TouchDragUtility註冊');
                return;
            }

            Game.Debug.log('touch', '✅ [C5-足夠支付] TouchDragUtility 已載入，開始註冊觸控拖曳');

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

                        Game.Debug.log('touch', '🎯 開始觸控拖曳金錢:', moneyItem.dataset.value);

                        // 設置視覺反饋
                        moneyItem.style.opacity = '0.5';

                        return true;
                    },
                    onDrop: (draggedElement, dropZone, event) => {
                        // 新增：C5專用放置框檢測
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
                            Game.Debug.log('touch', '🎯 觸控放置到兌換區');
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
            // 🔧 [防連點] 檢查是否正在處理拖放
            if (this.state.isProcessingDrop) {
                Game.Debug.log('drag', '[C5] 防抖：handleMoneyDrop 忽略重複拖放');
                return;
            }
            this.state.isProcessingDrop = true;

            // 🔧 [防連點] 確保在 100ms 後重置處理標誌
            Game.TimerManager.setTimeout(() => {
                this.state.isProcessingDrop = false;
            }, 100);

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

            Game.Debug.log('drag', '💰 處理金錢放置:', value, '元');

            // 移動金錢到付款區域
            const paymentZone = document.getElementById('payment-zone-area');
            if (paymentZone && moneyElement) {
                paymentZone.appendChild(moneyElement);
                Game.Debug.log('drag', '💰 成功放置金錢到兌換區:', value);
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
                Game.Debug.log('drag', '💰 成功放置金錢到兌換區:', value);
                
                // 更新總額並檢查是否完成
                this.updatePaymentTotal();
                this.checkPaymentCompletion();
            }
        },

        // 檢查付款完成狀態
        checkPaymentCompletion() {
            Game.Debug.log('payment', '🔍 [C5點擊除錯] 檢查付款完成狀態');
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

            Game.Debug.log('payment', `🔍 [${difficulty}模式] 金錢狀態:`, {
                剩餘: remainingMoney.length,
                已放置: placedMoney.length
            });
            
            // 普通和困難模式不執行自動判斷，等待用戶手動選擇
        },

        // 🔧 [新增] 點擊事件處理系統
        // =====================================================
        
        // 設置點擊事件監聽器
        setupClickEventListeners() {
            Game.Debug.log('event', '🎯 [C5點擊除錯] 設置點擊事件監聽器');

            const gameContainer = document.getElementById('app');
            if (!gameContainer) {
                Game.Debug.error('❌ 找不到遊戲容器 #app');
                return;
            }

            // 創建點擊事件處理器
            this._clickEventHandler = (event) => {
                Game.Debug.log('event', '🖱️ [C5點擊除錯] 容器點擊事件觸發', {
                    target: event.target.id || event.target.className,
                });

                // 查找金錢物品元素
                const moneyItem = event.target.closest('.money-item');
                if (moneyItem) {
                    Game.Debug.log('event', '✅ [C5點擊除錯] 發現金錢物品點擊，處理點擊邏輯');
                    event.stopPropagation();
                    event.preventDefault();
                    this.handleMoneyClick(moneyItem, event);
                }
            };

            // 綁定點擊事件
            Game.EventManager.on(gameContainer, 'click', this._clickEventHandler, { capture: true }, {}, 'gameUI');
            Game.Debug.log('event', '✅ [C5點擊除錯] 點擊事件已成功綁定到 #app');
        },

        // 處理金錢物品點擊
        handleMoneyClick(moneyItem, event) {
            Game.Debug.log('event', '🎯 [C5點擊除錯] handleMoneyClick 被呼叫', {
                moneyItem: moneyItem,
                value: moneyItem.dataset.value
            });

            // 檢查是否在源區域（可以點擊移動）
            const isInSourceArea = moneyItem.closest('#my-money-area, .my-money-area, [id*="money-source"]');
            const isInPaymentArea = moneyItem.closest('#payment-zone-area');

            Game.Debug.log('event', '🔍 [C5點擊除錯] 物品位置檢查', {
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
                Game.Debug.log('event', 'ℹ️ [C5點擊除錯] 物品不在可操作區域');
            }
        },

        // 處理點擊放置到付款區域
        handleClickToPlace(sourceItem) {
            const currentTime = Date.now();
            const { lastClickTime, lastClickedElement, doubleClickDelay } = this.clickState;

            const isSameElement = lastClickedElement === sourceItem;
            const isWithinDoubleClickTime = (currentTime - lastClickTime) < doubleClickDelay;

            Game.Debug.log('event', '🔍 [C5點擊除錯] 雙擊檢測狀態', {
                currentTime,
                lastClickTime,
                timeDiff: currentTime - lastClickTime,
                doubleClickDelay,
                isSameElement,
                isWithinDoubleClickTime
            });

            if (isSameElement && isWithinDoubleClickTime) {
                // 雙擊：執行放置
                Game.Debug.log('event', '✅ [C5點擊除錯] 偵測到雙擊，執行放置');
                this.executeClickPlacement(sourceItem);

                // 重置點擊狀態
                this.resetClickState();
            } else {
                // 單擊：選擇物品
                Game.Debug.log('event', '🔵 [C5點擊除錯] 第一次點擊，選擇物品');
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
            Game.Debug.log('event', '🔙 [C5點擊除錯] 處理點擊取回', { placedItem });

            // 找到原始的源區域
            const sourceArea = document.querySelector('#my-money-area, .my-money-area, [id*="money-source"]');
            if (sourceArea && placedItem) {
                // 🔧 修正：保持原始位置順序，使用insertBefore來維持位置
                this.insertMoneyInOriginalPosition(sourceArea, placedItem);
                Game.Debug.log('event', '✅ [C5點擊除錯] 金錢已取回到源區域並維持位置');
                
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

            Game.Debug.log('ui', '🔍 [C5位置修復] 嘗試維持金錢位置', {
                返回金錢面額: itemValue,
                容器內現有金錢數: existingItems.length
            });

            // 找到合適的插入位置（按面額排序：1, 5, 10, 50, 100...）
            let insertBeforeElement = null;
            for (let i = 0; i < existingItems.length; i++) {
                const existingValue = parseInt(existingItems[i].dataset.value);
                if (existingValue > itemValue) {
                    insertBeforeElement = existingItems[i];
                    Game.Debug.log('ui', `📍 [C5位置修復] 插入${itemValue}元到${existingValue}元之前`);
                    break;
                }
            }

            if (insertBeforeElement) {
                // 插入到指定位置之前
                container.insertBefore(moneyItem, insertBeforeElement);
            } else {
                // 插入到最後位置
                container.appendChild(moneyItem);
                Game.Debug.log('ui', `📍 [C5位置修復] ${itemValue}元插入到最後位置`);
            }
        },

        // 執行點擊放置
        executeClickPlacement(sourceItem) {
            Game.Debug.log('event', '🎯 [C5點擊除錯] 執行點擊放置', {
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

            Game.Debug.log('event', '✅ [C5點擊除錯] 點擊放置執行完成');
        },

        // 選擇物品（視覺反饋）
        selectItem(item) {
            // 清除之前的選擇
            this.clearSelection();

            // 選擇當前物品
            item.classList.add('selected-item');
            this.clickState.selectedItem = item;

            Game.Debug.log('event', '✅ [C5點擊除錯] 物品已選擇');
        },

        // 清除選擇狀態
        clearSelection() {
            if (this.clickState.selectedItem) {
                this.clickState.selectedItem.classList.remove('selected-item');
                this.clickState.selectedItem = null;
                Game.Debug.log('event', '🧹 [C5點擊除錯] 選擇狀態已清除');
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

    // ============================================================
    // 👆 輔助點擊模式（AssistClick）— 獨立區塊，不影響其他模式
    // ============================================================
    const AssistClick = {
        _overlay: null, _handler: null, _touchHandler: null,
        _queue: [], _step: 0, _enabled: false,
        _observer: null, _lastHighlighted: null,

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
            this._clearHighlight();
            this._queue = []; this._step = 0; this._enabled = false;
            this._handler = null; this._touchHandler = null;
        },

        buildQueue() {
            if (!this._enabled) return;

            // 優先處理題目指令彈窗：如存在則排入關閉動作，等待點擊
            const modal = document.getElementById('c5-instruction-modal');
            if (modal) {
                this._queue = [{ target: null, action: () => this._closeInstructionModal() }];
                this._step = 0;
                return;
            }

            const sourceArea = document.getElementById('money-source-area');
            if (!sourceArea) return;
            const moneyItems = Array.from(sourceArea.querySelectorAll('.money-item'));
            if (!moneyItems.length) return;
            const item = moneyItems[0];
            this._queue = [{ target: item, action: () => {
                const mockEvent = { dataTransfer: { getData: () => item.id } };
                Game.handleMoneyDrop(mockEvent, item);
            }}];
            this._step = 0;
            this._highlight(item);
        },

        _closeInstructionModal() {
            const modal = document.getElementById('c5-instruction-modal');
            if (!modal) {
                window.setTimeout(() => { if (this._enabled) this.buildQueue(); }, 200);
                return;
            }
            // 停止語音（避免等待 TTS 結束）
            if (Game.speech && Game.speech.synth) Game.speech.synth.cancel();
            // 淡出動畫
            const modalContent = modal.querySelector('div');
            modal.style.opacity = '0';
            if (modalContent) modalContent.style.transform = 'scale(0.8)';
            window.setTimeout(() => {
                if (modal.parentNode) modal.parentNode.removeChild(modal);
                // 重建 queue 以指向金錢圖示
                if (this._enabled) this.buildQueue();
            }, 300);
        },

        _executeStep() {
            if (!this._enabled || this._step >= this._queue.length) return;
            const step = this._queue[this._step];
            this._clearHighlight();
            this._queue = []; this._step = 0;
            if (step && step.action) step.action();
        },

        _startObserver() {
            const app = document.getElementById('app');
            if (!app) return;
            let t = null;
            this._observer = new MutationObserver(() => {
                if (!this._enabled || this._queue.length > 0) return;
                if (t) window.clearTimeout(t);
                t = window.setTimeout(() => {
                    const sa = document.getElementById('money-source-area');
                    if (this._enabled && sa && sa.querySelector('.money-item')) {
                        this.buildQueue();
                    }
                }, 400);
            });
            this._observer.observe(app, { childList: true, subtree: true });
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
