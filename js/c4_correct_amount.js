/**
 * @file c4_correct_amount.js
 * @description C4 正確的金額 - 配置驅動版本
 * @unit C4 - 正確的金額
 * @version 2.2.0 - 配置驅動 + 詳細Debug系統
 * @lastModified 2025.08.30 下午1:58
 */
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
// =================================================================

// 將Game定義為全局變量以支持onclick事件
let Game;

document.addEventListener('DOMContentLoaded', () => {
    Game = {
        // =====================================================
        // 🐛 Debug System - FLAGS 分類日誌系統（參考 C5/C6 標準）
        // =====================================================
        Debug: {
            // FLAGS 分類開關：設為 true 開啟該類別日誌
            FLAGS: {
                all: false,       // 開啟全部日誌
                init: false,      // 初始化
                speech: false,    // 語音系統
                audio: false,     // 音效系統
                ui: false,        // UI 渲染
                payment: false,   // 付款邏輯
                drag: false,      // 拖曳操作
                touch: false,     // 觸控操作
                question: false,  // 題目生成
                state: false,     // 狀態管理
                wallet: false,    // 金錢生成
                hint: false,      // 提示功能
                event: false,     // 事件處理
                judge: false,     // 判斷邏輯
                error: true       // 錯誤（預設開啟）
            },

            // 分類日誌輸出
            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[C4-${category}]`, ...args);
                }
            },

            // 分類警告輸出
            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[C4-${category}]`, ...args);
                }
            },

            // 錯誤輸出（總是顯示）
            error(...args) {
                console.error('[C4-ERROR]', ...args);
            },

            // 手機端拖曳除錯專用方法
            logMobileDrag(phase, element, event, data = null) {
                if (!this.FLAGS.all && !this.FLAGS.drag && !this.FLAGS.touch) return;
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

                console.log(`[C4-drag]`, phase, {
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

                console.log(`[C4-touch]`, eventType, eventInfo);
            },

            // C4專用放置框檢測方法
            logPlacementDrop(action, zoneType, itemInfo = null) {
                if (!this.FLAGS.all && !this.FLAGS.drag) return;
                console.log(`[C4-drag]`, `放置框: ${action} - 區域: ${zoneType}`, itemInfo || '');
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
            if (document.getElementById('c4-global-animations')) return;

            const style = document.createElement('style');
            style.id = 'c4-global-animations';
            style.innerHTML = `
                /* ===== 拖曳動畫 ===== */
                @keyframes dropIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                /* ===== 警告動畫 ===== */
                @keyframes warning-pulse {
                    from { opacity: 0.8; }
                    to { opacity: 1; }
                }

                /* ===== 提示高亮動畫 ===== */
                @keyframes hintPulse {
                    0%, 100% { box-shadow: 0 0 15px rgba(76, 175, 80, 0.6); }
                    50% { box-shadow: 0 0 25px rgba(76, 175, 80, 1); }
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
            `;
            document.head.appendChild(style);
            Game.Debug.log('init', '🎬 全局動畫樣式注入完成（7 個動畫）');
        },

        // 新增：狀態管理物件，用來儲存使用者的設定
        state: {
            // 完整的設定狀態
            settings: {
                digits: null,
                denominations: [],
                difficulty: null,
                mode: null,
                questionCount: null,
                customAmount: 50,
                assistClick: false,
                usingPreset: false
            },
            gameState: {},
            // 新增：進度追蹤
            quiz: {
                currentQuestion: 0,
                totalQuestions: 10,
                score: 0,
                questions: [],
                startTime: null,
                attempts: 0
            },
            // 防止重複載入題目
            loadingQuestion: false,
            // 點擊功能狀態管理
            clickState: {
                clickCount: 0,
                lastClickTime: 0,
                lastClickedElement: null,
                selectedClickItem: null
            },
            audioUnlocked: false,  // 🔧 [新增] 手機端音頻解鎖狀態
            lastTargetAmount: null  // 🔧 [新增] 防重複題目機制：記錄上一題的目標金額
        },

        // 點擊功能配置 - 參考 c3_money_exchange 的成功實現
        clickToMoveConfig: {
            easy: {
                enabled: true,
                allowClickToPlace: true,
                allowClickToReturn: true,  // 簡單模式允許取回
                audioFeedback: true,
                speechFeedback: true,      // 簡單模式有語音回饋
                visualSelection: true,
                selectionTimeout: 0,
                doubleClickDelay: 500
            },
            normal: {
                enabled: true,
                allowClickToPlace: true,
                allowClickToReturn: true,
                audioFeedback: true,
                speechFeedback: true,      // 普通模式有語音回饋
                visualSelection: true,
                selectionTimeout: 0,
                doubleClickDelay: 500
            },
            hard: {
                enabled: true,
                allowClickToPlace: true,
                allowClickToReturn: true,
                audioFeedback: true,
                speechFeedback: false,     // 困難模式無語音回饋
                visualSelection: true,
                selectionTimeout: 0,
                doubleClickDelay: 500
            }
        },
        
        // 防重複處理標誌
        isProcessingDrop: false,

        // =====================================================
        // 音效系統（參考unit3.js）
        // =====================================================
        audio: {
            dropSound: null,
            errorSound: null,
            successSound: null,
            init() {
                try {
                    this.dropSound = new Audio('../audio/units/drop-sound.mp3');
                    this.dropSound.preload = 'auto';
                    this.dropSound.volume = 0.5;

                    this.errorSound = new Audio('../audio/units/error.mp3');
                    this.errorSound.preload = 'auto';

                    this.successSound = new Audio('../audio/units/correct02.mp3');
                    this.successSound.preload = 'auto';
                } catch (error) {
                    Game.Debug.error('音效檔案載入失敗:', error);
                }
            },
            playDropSound() {
                if (this.dropSound) {
                    this.dropSound.currentTime = 0;
                    this.dropSound.play().catch(error => Game.Debug.warn('audio', '播放音效失敗:', error));
                }
            },
            playErrorSound() {
                if (this.errorSound) {
                    this.errorSound.currentTime = 0;
                    this.errorSound.play().catch(error => Game.Debug.warn('audio', '播放音效失敗:', error));
                }
            },
            playSuccessSound() {
                if (this.successSound) {
                    this.successSound.currentTime = 0;
                    this.successSound.play().catch(error => Game.Debug.warn('audio', '播放音效失敗:', error));
                }
            }
        },

        // =====================================================
        // 音頻解鎖系統 - 採用F1/C1/C2/C3系統
        // =====================================================
        async unlockAudio() {
            if (this.state.audioUnlocked) {
                return true; // 已經解鎖
            }

            try {
                // 創建一個極短的無聲音頻來觸發音頻解鎖
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const buffer = audioContext.createBuffer(1, 1, 22050);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);
                
                // 同時嘗試播放HTML音頻元素
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
                Game.Debug.warn('audio', '⚠️ 音頻解鎖失敗，但繼續執行', error);
                this.state.audioUnlocked = true; // 設為true以避免重複嘗試
                return false;
            }
        },

        // =====================================================
        // 語音系統 - 採用F1/C1/C2/C3先進語音系統
        // =====================================================
        speech: {
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
                        attempt: voiceInitAttempts,
                        allVoices: voices.map(v => ({ name: v.name, lang: v.lang }))
                    });

                    if (voices.length === 0) {
                        if (voiceInitAttempts < maxAttempts) {
                            Game.Debug.log('speech', '🎙️ 語音列表為空，將重試');
                            Game.TimerManager.setTimeout(setVoice, 500, 'speech');
                        } else {
                            Game.Debug.log('speech', '🎙️ 手機端無語音，啟用靜音模式');
                            this.voice = null;
                            this.isReady = true; // 標記為已準備，避免持續重試
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
                        Game.Debug.log('speech', '🎙️ 語音準備就緒', {
                            voiceName: this.voice.name,
                            lang: this.voice.lang,
                            attempt: voiceInitAttempts
                        });
                    }
                };

                // 先嘗試立即載入
                setVoice();

                // 同時設置事件監聯器以防語音列表延遲載入
                if (this.synth.onvoiceschanged !== undefined) {
                    this.synth.onvoiceschanged = setVoice;
                }

                // 額外的延遲重試機制，適用於某些移動瀏覽器
                Game.TimerManager.setTimeout(() => {
                    if (!this.isReady && voiceInitAttempts < maxAttempts) {
                        Game.Debug.log('speech', '🎙️ 延遲重試語音初始化');
                        setVoice();
                    }
                }, 1000, 'speech');
            },

            speak(text, options = {}) { // 保持原有 options 接口兼容性
                const { interrupt = true, callback = null } = options;

                Game.Debug.log('speech', '🎙️ 嘗試播放語音', {
                    text,
                    interrupt,
                    isReady: this.isReady,
                    audioUnlocked: Game.state.audioUnlocked,
                    voiceName: this.voice?.name
                });

                // 🔧 [新增] 手機端音頻解鎖檢查
                if (!Game.state.audioUnlocked) {
                    Game.Debug.log('speech', '🎙️ ⚠️ 音頻權限未解鎖，跳過語音播放');
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'speech');
                    return;
                }

                // 停止所有正在播放的語音，防止重疊和多重回調
                if (this.synth.speaking && interrupt) {
                    Game.Debug.log('speech', '🎙️ 停止之前的語音播放');
                    this.synth.cancel();
                }

                if (!this.isReady || !text) {
                    Game.Debug.log('speech', '🎙️ 語音系統未就緒或文字為空', { isReady: this.isReady, hasText: !!text });
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'speech');
                    return;
                }

                // 🔧 [手機端修復] 檢查語音是否可用
                if (!this.voice) {
                    Game.Debug.log('speech', '🎙️ 手機端無語音，跳過語音播放');
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'speech');
                    return;
                }

                Game.Debug.log('speech', '🎙️ 開始播放語音', {
                    text,
                    voiceName: this.voice?.name
                });

                try {
                    if (interrupt) {
                        this.synth.cancel();
                    }
                    
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.voice = this.voice;
                    utterance.lang = this.voice.lang;
                    utterance.rate = 1.0;
                    
                    if (callback) {
                        // 安全措施：如果語音播放時間過長，強制執行callback
                        let callbackExecuted = false;
                        const safeCallback = () => {
                            if (!callbackExecuted) {
                                callbackExecuted = true;
                                Game.Debug.log('speech', '🎙️ 語音播放完成，執行回調');
                                callback();
                            }
                        };

                        // 監聽語音播放結束事件
                        utterance.onend = safeCallback;
                        utterance.onerror = (e) => {
                            Game.Debug.warn('speech', '🎙️ 語音播放錯誤', e);
                            safeCallback();
                        };

                        // 安全措施：最多等待10秒
                        Game.TimerManager.setTimeout(safeCallback, 10000, 'speech');
                    }

                    this.synth.speak(utterance);
                    Game.Debug.log('speech', '🎙️ 語音已提交播放');
                } catch (error) {
                    Game.Debug.error('🎙️ 語音播放異常', error);
                    if (callback) callback();
                }
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
        // 金錢資料（參考unit3.js）
        // =====================================================
        gameData: {
            allItems: [
                { value: 1, name: '1元', images: { front: '../images/money/1_yuan_front.png', back: '../images/money/1_yuan_back.png' } },
                { value: 5, name: '5元', images: { front: '../images/money/5_yuan_front.png', back: '../images/money/5_yuan_back.png' } },
                { value: 10, name: '10元', images: { front: '../images/money/10_yuan_front.png', back: '../images/money/10_yuan_back.png' } },
                { value: 50, name: '50元', images: { front: '../images/money/50_yuan_front.png', back: '../images/money/50_yuan_back.png' } },
                { value: 100, name: '100元', images: { front: '../images/money/100_yuan_front.png', back: '../images/money/100_yuan_back.png' } },
                { value: 500, name: '500元', images: { front: '../images/money/500_yuan_front.png', back: '../images/money/500_yuan_back.png' } },
                { value: 1000, name: '1000元', images: { front: '../images/money/1000_yuan_front.png', back: '../images/money/1000_yuan_back.png' } }
            ]
        },

        // 取得隨機圖片（參考unit3.js）
        getRandomImage(itemData) {
            return Math.random() < 0.5 ? itemData.images.front : itemData.images.back;
        },

        // 根據幣值取得物品資料
        getItemData(value) {
            return this.gameData.allItems.find(item => item.value === value);
        },

        // =====================================================
        // 初始化
        // =====================================================
        init() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeAll();
            // 🎬 注入全局動畫樣式
            this.injectGlobalAnimationStyles();

            // 初始化音效和語音系統
            this.audio.init();
            this.speech.init();
            this.initAudio();
            
            // 開發者快捷鍵：快速測試測驗結束視窗
            Game.EventManager.on(document, 'keydown', (event) => {
                if (event.ctrlKey) {
                    let score = 0;
                    let description = '';
                    
                    switch(event.key.toLowerCase()) {
                        case 't': // Ctrl+T: 80分 (良好)
                            score = 80;
                            description = '80分 - 表現良好';
                            break;
                        case 'y': // Ctrl+Y: 100分 (優異)
                            score = 100;
                            description = '100分 - 表現優異';
                            break;
                        case 'u': // Ctrl+U: 60分 (需努力)
                            score = 60;
                            description = '60分 - 還需努力';
                            break;
                        case 'i': // Ctrl+I: 30分 (多練習)
                            score = 30;
                            description = '30分 - 多加練習';
                            break;
                        default:
                            return;
                    }
                    
                    event.preventDefault();
                    Game.Debug.log('init', `🎯 開發者快捷鍵觸發：${description}`);
                    
                    // 模擬測驗數據
                    this.state.quiz = {
                        currentQuestion: 10,
                        totalQuestions: 10,
                        score: score,
                        startTime: Date.now() - 120000 // 2分鐘前開始
                    };
                    
                    // 立即觸發測驗結束
                    this.showResults();
                }
            }, {}, 'global');
            
            // 為了方便測試，暫時重設設定
            this.showSettings();
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
            this.state.clickState = {
                clickCount: 0,
                lastClickTime: 0,
                lastClickedElement: null,
                selectedClickItem: null
            };
            this.state.lastTargetAmount = null;
            this.state.gameCompleted = false;
            Game.Debug.log('state', '🔄 遊戲狀態已重置');
        },

        // =====================================================
        // 設定畫面 (套用深色護眼模式)
        // =====================================================
        showSettings() {
            AssistClick.deactivate();
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            // 🔧 [重構] 返回設定時重置遊戲狀態
            this.resetGameState();

            const app = document.getElementById('app');
            const settings = this.state.settings;
            
            // 定義可用的錢幣與紙鈔
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

            // 參考 unit3.js，建立動態產生按鈕的函式
            const createDenominationButtonsHTML = (items) => items.map(item => `
                <button class="selection-btn ${settings.denominations.includes(item.value) ? 'active' : ''}" data-type="denomination" data-value="${item.value}">
                    ${item.name}
                </button>`).join('');
            
            app.innerHTML = `
                <div class="unit-welcome">
                    <div class="welcome-content">
                        <div class="settings-title-row">
                            <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                            <h1>單元C4：正確的金額</h1>
                        </div>
                        <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">學習拿出正確的金錢組合，達到指定金額，培養付款能力</p>

                        <div class="game-settings">
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
                                    啟用後，只要偵測到點擊，系統會自動依序完成拖曳錢幣完成正確金額付款等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                    <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式」</strong>
                                </p>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.assistClick ? 'active' : ''}" id="assist-click-on">✓ 啟用</button>
                                    <button class="selection-btn ${!settings.assistClick ? 'active' : ''}" id="assist-click-off">✗ 停用</button>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label>🔢 目標金額位數：</label>
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
                                        目前：${settings.customAmount || 50} 元
                                    </span>
                                </div>
                            </div>
                            
                            <div class="setting-group" id="denomination-setting-group" style="display: ${settings.digits === 'custom' ? 'none' : 'block'};">
                                <label>💰 面額選擇 (可多選)：</label>
                                <div class="button-group" style="margin-bottom: 12px;">
                                    <button class="selection-btn ${settings.usingPreset ? 'active' : ''}" id="c4-preset-denom-btn" onclick="Game.applyDefaultDenominations()">
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
                                <div id="compatibility-hint" style="display: none; margin-top: 10px; padding: 8px 12px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404; font-size: 0.9em; text-align: center;">
                                    💡 會產生超過30錢幣，請選擇合理的位數與幣值組合
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
                                    <input type="text" id="custom-question-count-c4"
                                           value="${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? settings.questionCount + '題' : ''}"
                                           placeholder="請輸入題數"
                                           style="padding: 8px; border-radius: 5px; border: 2px solid ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? '#667eea' : '#ddd'}; background: ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? '#667eea' : 'white'}; color: ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                                           readonly onclick="Game.handleCustomQuestionClick()">
                                </div>
                            </div>

                            <div class="setting-group" id="mode-selection-group">
                                <label>📋 測驗模式：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.mode === 'retry' ? 'active' : ''}"
                                            data-type="mode" data-value="retry"
                                            ${settings.difficulty === 'easy' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                        反複作答
                                    </button>
                                    <button class="selection-btn ${settings.mode === 'proceed' ? 'active' : ''}"
                                            data-type="mode" data-value="proceed"
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

            // 使用事件委派方式處理所有設定按鈕
            const gameSettings = app.querySelector('.game-settings');
            Game.EventManager.on(gameSettings, 'click', this.handleSelection.bind(this), {}, 'settings');

            const startBtn = app.querySelector('#start-quiz-btn');
            Game.EventManager.on(startBtn, 'click', this.startQuiz.bind(this), {}, 'settings');

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
                    const params = new URLSearchParams({ unit: 'c4' });
                    window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
                }, {}, 'settings');
            }

            // 添加自訂金額設定按鈕事件監聽器
            const setCustomAmountBtn = app.querySelector('#set-custom-amount-btn');
            if (setCustomAmountBtn) {
                Game.EventManager.on(setCustomAmountBtn, 'click', () => {
                    this.showNumberInput('請輸入目標金額', (value) => {
                        const amount = parseInt(value);
                        if (isNaN(amount) || amount < 1 || amount > 9999) {
                            alert('請輸入 1-9999 之間的有效金額');
                            return false;
                        }
                        
                        this.state.settings.customAmount = amount;
                        
                        // 更新顯示
                        const displaySpan = app.querySelector('#custom-amount-display');
                        if (displaySpan) {
                            displaySpan.textContent = `目前：${amount} 元`;
                        }
                        
                        alert(`已設定目標金額為 ${amount} 元`);
                        
                        // 更新開始按鈕狀態
                        this.checkStartState();
                        return true;
                    });
                }, {}, 'settings');
            }
            
            this.updateDenominationUI(); // 根據預設值，先執行一次連動規則
            this.checkStartState();
        },

        // 新增：統一的選擇處理函式
        handleSelection(event) {
            // 🔓 解鎖手機音頻播放權限 - 改用內建系統
            this.unlockAudio();
            
            const btn = event.target.closest('.selection-btn');
            if (!btn) return;

            const { type, value } = btn.dataset;
            
            // 播放選單選擇音效
            this.playMenuSelectSound();
            
            // 處理題目設定選項
            if (type === 'questions') {
                if (value === 'custom') {
                    this.showCustomQuestionInput();
                    return;
                } else {
                    this.state.settings.questionCount = parseInt(value);
                    this.state.quiz.totalQuestions = parseInt(value);
                    this.hideCustomQuestionInput();

                    // 🔧 [新增] 選擇預設題數時，隱藏自訂輸入框
                    const customDisplay = document.querySelector('.custom-question-display');
                    const customInput = document.getElementById('custom-question-count-c4');
                    if (customDisplay && customInput) {
                        customDisplay.style.display = 'none';
                        customInput.value = '';
                        customInput.style.background = 'white';
                        customInput.style.color = '#333';
                        customInput.style.borderColor = '#ddd';
                    }
                }
            } else if (type === 'denomination') {
                const numValue = parseInt(value, 10);
                const index = this.state.settings.denominations.indexOf(numValue);
                
                if (index > -1) {
                    // 移除幣值
                    btn.classList.remove('active');
                    this.state.settings.denominations.splice(index, 1);
                } else {
                    // 準備添加幣值 - 先檢查衝突
                    const testDenominations = [...this.state.settings.denominations, numValue];
                    
                    // 自訂金額模式：檢查添加此幣值是否會造成衝突
                    if (this.state.settings.digits === 'custom') {
                        const { customAmount } = this.state.settings;
                        const totalRequired = testDenominations.reduce((sum, coin) => sum + coin, 0);
                        Game.Debug.log('ui', `添加幣值前檢查: 金額=${customAmount}元, 將添加=${numValue}元, 測試幣值=[${testDenominations.join(',')}], 需要=${totalRequired}元`);
                        
                        if (customAmount < totalRequired) {
                            // 傳遞正確的資料給警告系統（不包含即將添加的幣值）
                            this.showInvalidCombinationWarning('custom', null, {
                                customAmount: customAmount,
                                denominations: testDenominations,
                                attemptedCoin: numValue  // 添加嘗試加入的幣值資訊
                            });
                            return; // 拒絕添加
                        }
                    }
                    
                    // 其他模式的智能邏輯檢查
                    if (!this.isValidCombination(this.state.settings.digits, testDenominations)) {
                        this.showInvalidCombinationWarning(this.state.settings.digits, numValue);
                        return;
                    }
                    
                    // 檢查通過，添加幣值
                    btn.classList.add('active');
                    this.state.settings.denominations.push(numValue);
                }

                // 手動改變面額時取消預設模式
                this.state.settings.usingPreset = false;
                const presetBtn = document.getElementById('c4-preset-denom-btn');
                if (presetBtn) presetBtn.classList.remove('active');

                this.updateSmartUI(); // 更新智能UI狀態
                this.updateCompatibilityHint(); // 🔧 更新相容性提示
                this.checkStartState();
                return; // 不需要更新其他按鈕狀態
            } else {
                if (type === 'digits') {
                    const newDigits = value === 'custom' ? 'custom' : parseInt(value, 10);
                    
                    // 檢查智能邏輯：如果選擇此位數會導致現有幣值無效，則警告
                    if (newDigits !== 'custom') {
                        const invalidDenominations = this.getInvalidDenominations(newDigits, this.state.settings.denominations);
                        if (invalidDenominations.length > 0) {
                            this.showInvalidCombinationWarning(newDigits, invalidDenominations);
                            // 移除無效的幣值
                            this.state.settings.denominations = this.state.settings.denominations.filter(d => !invalidDenominations.includes(d));
                        }
                    }
                    
                    if (value === 'custom') {
                        this.state.settings[type] = 'custom';
                        this.showCustomAmountInput();
                    } else {
                        this.state.settings[type] = parseInt(value, 10);
                        this.hideCustomAmountInput();
                    }
                    // 自訂金額模式時隱藏面額選擇區塊
                    const denomGroup = document.getElementById('denomination-setting-group');
                    if (denomGroup) {
                        denomGroup.style.display = value === 'custom' ? 'none' : 'block';
                    }
                    this.updateDenominationUI(); // 位數改變時更新幣值選項
                    // 預設模式開啟時，切換位數自動套用新位數的預設面額
                    if (this.state.settings.usingPreset && value !== 'custom') {
                        this.applyDefaultDenominations();
                    }
                    this.updateSmartUI(); // 更新智能UI狀態
                    this.updateCompatibilityHint(); // 🔧 更新相容性提示
                } else {
                    this.state.settings[type] = value;

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
            }

            // 更新同組按鈕的active狀態
            const buttonGroup = btn.closest('.button-group');
            buttonGroup.querySelectorAll('.selection-btn')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 檢查是否所有必要設定都已完成
            this.checkStartState();
        },

        // 取得難度說明文字
        getDifficultyDescription(difficulty) {
            const descriptions = {
                easy: '簡單：有視覺、語音數錢提示，引導下完成題目。',
                normal: '普通：沒有視覺提示，有語音數錢提示。',
                hard: '困難：沒有視覺、語音提示，自行拿取正確的金額。'
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

        // 初始化音效
        initAudio() {
            try {
                this.menuSelectAudio = new Audio('../audio/units/click.mp3');
                this.menuSelectAudio.volume = 0.5;
                this.menuSelectAudio.preload = 'auto';
            } catch (error) {
                Game.Debug.warn('audio', '無法載入選單音效:', error);
            }
        },

        // 播放選單選擇音效
        playMenuSelectSound() {
            try {
                if (this.menuSelectAudio) {
                    this.menuSelectAudio.currentTime = 0;
                    this.menuSelectAudio.play().catch(e => {
                        Game.Debug.warn('audio', '音效播放失敗:', e);
                    });
                }
            } catch (error) {
                Game.Debug.warn('audio', '無法播放選單音效:', error);
            }
        },

        // 顯示自訂題目數量輸入框
        showCustomQuestionInput() {
            this.showNumberInput('請輸入題目數量', (value) => {
                const questionCount = parseInt(value);
                if (isNaN(questionCount) || questionCount < 1 || questionCount > 100) {
                    alert('請輸入 1-100 之間的有效數字');
                    return false;
                }
                
                this.state.settings.questionCount = questionCount;
                this.state.quiz.totalQuestions = questionCount;
                
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
                const customInput = document.getElementById('custom-question-count-c4');
                if (customDisplay && customInput) {
                    customDisplay.style.display = 'block';
                    customInput.value = `${questionCount}題`;
                    customInput.style.background = '#667eea';
                    customInput.style.color = 'white';
                    customInput.style.borderColor = '#667eea';
                }

                // 檢查是否可以開始遊戲
                this.checkStartState();

                // alert(`已設定測驗題數為 ${questionCount} 題`); // 已取消弹窗提示
                return true;
            });
        },

        // 隱藏自訂題目數量輸入框
        hideCustomQuestionInput() {
            // 不再需要隱藏，因為使用彈出式數字選擇器
        },

        // 🔧 [新增] 處理點擊自訂題數輸入框
        handleCustomQuestionClick() {
            const customBtn = document.querySelector('[data-type="questions"][data-value="custom"]');
            if (customBtn) {
                customBtn.click();
            }
        },

        // 顯示自訂金額輸入框
        showCustomAmountInput() {
            const customInputDiv = document.getElementById('custom-amount-input');
            if (customInputDiv) {
                customInputDiv.style.display = 'block';
            }
        },

        // 隱藏自訂金額輸入框
        hideCustomAmountInput() {
            const customInputDiv = document.getElementById('custom-amount-input');
            if (customInputDiv) {
                customInputDiv.style.display = 'none';
            }
        },


        // 新增：根據位數更新幣值選項的可用性
        updateDenominationUI() {
            const { digits, denominations } = this.state.settings;
            // 規則：可用的最大幣值不能等於或超過目標金額的最小單位
            // 1位數 (1-9元): 可用 < 10元 的幣值
            // 2位數 (10-99元): 可用 < 100元 的幣值
            // 3位數 (100-999元): 可用 < 1000元 的幣值
            // 4位數 (1000-9999元): 全部可用
            const maxDenomination = Math.pow(10, digits);

            const denominationButtons = document.querySelectorAll('.selection-btn[data-type="denomination"]');
            denominationButtons.forEach(btn => {
                const value = parseInt(btn.dataset.value, 10);
                if (value >= maxDenomination) {
                    btn.disabled = true;
                    btn.classList.remove('active');
                    // 從 state 中移除被禁用的已選幣值
                    const index = denominations.indexOf(value);
                    if (index > -1) {
                        denominations.splice(index, 1);
                    }
                } else {
                    btn.disabled = false;
                }
            });
        },

        // 新增：檢查位數和幣值組合是否有效
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
            const presetBtn = document.getElementById('c4-preset-denom-btn');
            if (presetBtn) presetBtn.classList.add('active');
        },

        isValidCombination(digits, denominations) {
            if (!denominations.length) return true;
            
            if (digits === 'custom') {
                // 自訂金額模式：檢查是否能用所有選擇的幣值組成自訂金額
                const { customAmount } = this.state.settings;
                const minRequired = denominations.reduce((sum, coin) => sum + coin, 0);
                return customAmount >= minRequired;
            }
            
            // 位數模式：檢查是否能在範圍內包含所有幣值
            const minAmount = (digits === 1) ? 1 : Math.pow(10, digits - 1);
            const maxAmount = Math.pow(10, digits) - 1;
            const baseAmount = denominations.reduce((sum, coin) => sum + coin, 0);
            
            // 基礎檢查：最少需求是否超出範圍
            if (baseAmount > maxAmount) {
                return false;
            }
            
            // 進階檢查：計算有效組合數量
            const validCount = this.countValidCombinations(digits, denominations, minAmount, maxAmount, baseAmount);
            
            // 如果組合數量少於4種，顯示警告但仍允許（返回true）
            if (validCount > 0 && validCount < 4) {
                this.showLowCombinationWarning(digits, validCount, minAmount, maxAmount);
            }
            
            return validCount > 0;
        },

        // 新增：計算有效組合數量
        countValidCombinations(digits, denominations, minAmount, maxAmount, baseAmount) {
            let count = 0;
            for (let target = Math.max(minAmount, baseAmount); target <= maxAmount; target++) {
                const combinations = this.findAllMinimumCombinationsWithAllCoins(target, denominations);
                if (combinations.length > 0) {
                    count++;
                }
                // 為了效能，最多計算到10種就足夠判斷
                if (count >= 10) break;
            }
            return count;
        },

        // 新增：顯示低組合數量警告
        showLowCombinationWarning(digits, count, minAmount, maxAmount) {
            const digitNames = { 1: '1位數', 2: '2位數', 3: '3位數', 4: '4位數' };
            const digitName = digitNames[digits] || `${digits}位數`;
            
            const message = `⚠️ 注意：${digitName}範圍(${minAmount}-${maxAmount}元)配合目前選擇的幣值，只能產生${count}種不同的題目。建議選擇更多幣值以增加題目變化性。`;
            
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
                background: linear-gradient(135deg, #f39c12, #e67e22);
                padding: 30px 40px; border-radius: 15px; text-align: center;
                color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                transform: scale(0.8); transition: transform 0.3s;
                border: 2px solid #e74c3c; max-width: 450px;
            `;

            modalContent.innerHTML = `
                <h2 style="font-size: 1.8em; margin: 0 0 15px 0; color: #fff;">📊 題目數量提醒</h2>
                <p style="font-size: 1.1em; margin: 0; line-height: 1.4;">${message}</p>
                <div style="margin-top: 20px;">
                    <button onclick="this.closest('.modal-overlay') && document.body.removeChild(this.closest('.modal-overlay'))" 
                            style="padding: 8px 20px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1em;">
                        我知道了
                    </button>
                </div>
            `;
            
            modalOverlay.className = 'modal-overlay';
            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);

            // 語音提示
            this.speech.speak(`${digitName}配合目前幣值只能產生${count}種題目，建議選擇更多幣值`);

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

            Game.EventManager.on(modalOverlay, 'click', (e) => {
                if (e.target === modalOverlay) closeModal();
            }, {}, 'gameUI');

            // 動畫效果
            Game.TimerManager.setTimeout(() => {
                modalOverlay.style.opacity = '1';
                modalContent.style.transform = 'scale(1)';
            }, 10);

            // 5秒後自動關閉
            Game.TimerManager.setTimeout(closeModal, 5000, 'ui');
        },

        // ⚠️ DEPRECATED: 這個函數已被新的「構建」方法取代，但保留以備向後兼容
        // 新增：找出所有包含所有幣值的最少硬幣組合 (高效版本)
        findAllMinimumCombinationsWithAllCoins(amount, denominations) {
            const startTime = Date.now();
            const timeout = 1000; // 1秒超時，更嚴格的限制
            
            // 計算使用所有幣值各1個的基礎金額
            const baseAmount = denominations.reduce((sum, coin) => sum + coin, 0);
            
            if (amount < baseAmount) {
                Game.Debug.log('wallet', `⚠️ 組合搜索: ${amount}元不足包含所有幣值(需${baseAmount}元)`);
                return []; // 金額不足，無法包含所有幣值
            }

            const remaining = amount - baseAmount;

            if (remaining === 0) {
                // 恰好等於所有幣值之和，只有一種組合
                Game.Debug.log('wallet', `🎯 組合搜索: ${amount}元恰好等於所有幣值之和`);
                return [denominations.slice().sort((a, b) => b - a)];
            }

            // 超時檢查
            if (Date.now() - startTime > timeout) {
                Game.Debug.warn('wallet', `🚨 組合搜索: ${amount}元搜索超時`);
                return [];
            }

            Game.Debug.log('wallet', `🔍 組合搜索: 搜索${amount}元的組合(剩餘${remaining}元)`);
            
            // 使用更高效的方法找出所有最少硬幣組合
            const allSolutions = this.findAllSolutionsForAmount(remaining, denominations);
            
            // 超時檢查
            if (Date.now() - startTime > timeout) {
                Game.Debug.warn('wallet', `🚨 組合搜索: ${amount}元搜索超時(在解法整理階段)`);
                return allSolutions.length > 0 ? [[...denominations, ...allSolutions[0]].sort((a, b) => b - a)] : [];
            }
            
            // 每個組合都要加上基礎的每種幣值各1個
            const result = [];
            const uniqueCombinations = new Set();
            const maxResults = 10; // 限制結果數量
            
            for (const solution of allSolutions.slice(0, maxResults)) { // 只處理前10個解法
                const combination = [...denominations]; // 每種幣值各1個
                solution.forEach(coin => combination.push(coin));
                combination.sort((a, b) => b - a); // 降序排列
                
                // 使用字符串去重
                const combinationKey = combination.join(',');
                if (!uniqueCombinations.has(combinationKey)) {
                    uniqueCombinations.add(combinationKey);
                    result.push(combination);
                }
                
                // 超時檢查
                if (Date.now() - startTime > timeout) {
                    Game.Debug.warn('wallet', `🚨 組合搜索: ${amount}元搜索超時(在結果處理階段)，返回${result.length}個組合`);
                    break;
                }
            }

            const searchTime = Date.now() - startTime;
            Game.Debug.log('wallet', `✅ 組合搜索: ${amount}元搜索完成，找到${result.length}個組合，耗時${searchTime}ms`);
            
            return result;
        },

        // 新增：找出指定金額的所有最少硬幣組合 (添加超時保護)
        findAllSolutionsForAmount(amount, denominations) {
            if (amount === 0) return [[]];
            
            const minCoins = this.getMinCoinsForAmount(amount, denominations);
            if (minCoins === Infinity) return [];
            
            const solutions = [];
            const startTime = Date.now();
            const timeout = 2000; // 2秒超時
            
            this.findSolutionsWithExactCoins(amount, denominations, minCoins, [], solutions, startTime, timeout);
            
            return solutions;
        },

        // 新增：找出使用確切硬幣數量的所有組合 (添加超時和限制保護)
        findSolutionsWithExactCoins(amount, denominations, targetCount, current, solutions, startTime, timeout) {
            // 超時檢查
            if (Date.now() - startTime > timeout) {
                Game.Debug.warn('wallet', '🚨 性能: 題目生成超時，使用已找到的解法');
                return;
            }

            // 解法數量限制 (避免過多組合)
            if (solutions.length >= 20) {
                Game.Debug.log('wallet', '🎯 性能: 已找到足夠的解法組合，停止搜索');
                return;
            }
            
            if (current.length === targetCount) {
                if (amount === 0) {
                    solutions.push([...current]);
                }
                return;
            }
            
            if (amount <= 0 || current.length > targetCount) return;
            
            // 按降序嘗試每個面額，避免重複
            const sortedDenoms = denominations.slice().sort((a, b) => b - a);
            
            for (const coin of sortedDenoms) {
                // 避免重複：只選擇不大於前一個硬幣的值
                if (current.length === 0 || coin <= current[current.length - 1]) {
                    if (amount >= coin) {
                        current.push(coin);
                        this.findSolutionsWithExactCoins(amount - coin, denominations, targetCount, current, solutions, startTime, timeout);
                        current.pop();
                    }
                }
            }
        },


        // 新增：計算指定金額的最少硬幣數量
        getMinCoinsForAmount(amount, denominations) {
            if (amount === 0) return 0;
            
            const dp = new Array(amount + 1).fill(Infinity);
            dp[0] = 0;
            
            for (let i = 1; i <= amount; i++) {
                for (const coin of denominations) {
                    if (i >= coin && dp[i - coin] !== Infinity) {
                        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
                    }
                }
            }
            
            return dp[amount] === Infinity ? Infinity : dp[amount];
        },

        // 新增：獲取在指定位數下無效的幣值
        getInvalidDenominations(digits, denominations) {
            if (digits === 'custom') return [];
            
            const maxDenomination = Math.pow(10, digits);
            return denominations.filter(d => d >= maxDenomination);
        },

        // 新增：顯示無效組合警告
        showInvalidCombinationWarning(digits, invalidItems, customData = null) {
            let message;
            
            if (digits === 'custom') {
                // 自訂金額模式的警告
                let customAmount, denominations, attemptedCoin;
                
                if (customData) {
                    // 使用傳遞的自訂資料
                    customAmount = customData.customAmount;
                    denominations = customData.denominations;
                    attemptedCoin = customData.attemptedCoin;
                } else {
                    // 使用當前設定
                    const settings = this.state.settings;
                    customAmount = settings.customAmount;
                    denominations = settings.denominations;
                }
                
                // 防護：確保denominations不為空
                if (!denominations || denominations.length === 0) {
                    Game.Debug.error('showInvalidCombinationWarning: denominations為空，無法計算需求金額');
                    return;
                }

                const minRequired = denominations.reduce((sum, coin) => sum + coin, 0);
                const coinNames = denominations.map(v => `${v}元`).join('、');

                Game.Debug.log('ui', `自訂金額衝突檢測: 目標=${customAmount}元, 測試幣值=[${denominations.join(',')}], 最少需要=${minRequired}元`);
                
                // 統一使用相同的警告格式
                message = `自訂金額${customAmount}元無法使用所有選擇的幣值(${coinNames})，最少需要${minRequired}元才能包含所有幣值`;
            } else {
                // 原有的位數模式警告
                const digitNames = { 1: '1位數', 2: '2位數', 3: '3位數', 4: '4位數' };
                const digitName = digitNames[digits] || digits;
                
                if (Array.isArray(invalidItems)) {
                    const itemNames = invalidItems.map(v => `${v}元`).join('、');
                    message = `選擇${digitName}後，${itemNames}將無法使用，已自動移除`;
                } else {
                    message = `${invalidItems}元無法與${digitName}組合使用，請選擇其他幣值`;
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
                    document.body.removeChild(modalOverlay);
                }, 300);
            };

            Game.EventManager.on(modalOverlay, 'click', closeModal, {}, 'gameUI');

            // 動畫效果
            Game.TimerManager.setTimeout(() => {
                modalOverlay.style.opacity = '1';
                modalContent.style.transform = 'scale(1)';
            }, 10);

            // 4秒後自動關閉（自訂金額訊息較長）
            Game.TimerManager.setTimeout(closeModal, 4000, 'ui');
        },

        // 新增：更新智能UI狀態
        updateSmartUI() {
            const { digits, denominations } = this.state.settings;
            
            // 更新幣值按鈕的active狀態
            const denominationButtons = document.querySelectorAll('.selection-btn[data-type="denomination"]');
            denominationButtons.forEach(btn => {
                const value = parseInt(btn.dataset.value);
                const isActive = denominations.includes(value);
                btn.classList.toggle('active', isActive);
            });
        },

        // 新增：檢查是否可開始測驗
        checkStartState() {
            const { digits, denominations, difficulty, mode, questionCount } = this.state.settings;
            const startBtn = document.getElementById('start-quiz-btn');

            // 簡單模式不需要選擇測驗模式
            const modeRequired = difficulty !== 'easy';
            const modeValid = modeRequired ? mode : true;

            const denomValid = digits === 'custom' || denominations.length > 0;
            const isReady = digits && denomValid && difficulty && modeValid && questionCount;
            startBtn.disabled = !isReady;
            startBtn.textContent = isReady ? '開始測驗！' : '請完成所有選擇';
            startBtn.classList.toggle('disabled', !isReady);
        },

        // 🔧 更新相容性提示（30錢幣上限檢查）
        updateCompatibilityHint() {
            const { digits, denominations } = this.state.settings;
            const hintElement = document.getElementById('compatibility-hint');

            if (!hintElement || !denominations || denominations.length === 0) {
                if (hintElement) hintElement.style.display = 'none';
                return;
            }

            // 自訂金額模式：面額自動決定，無需相容性提示
            if (digits === 'custom') {
                hintElement.style.display = 'none';
                return;
            }

            // 計算30個最大面額硬幣的購買力
            const maxDenomination = Math.max(...denominations);
            const maxPurchasePower = 30 * maxDenomination;

            // 計算該位數的最小金額
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

            Game.Debug.log('ui', `🔍 相容性: 硬幣購買力檢查: 30張${maxDenomination}元 = ${maxPurchasePower}元購買力 vs ${digits}位數起始價格${digitRangeMin}元`);

            if (maxPurchasePower < digitRangeMin) {
                // 顯示提示
                hintElement.style.display = 'block';
                hintElement.textContent = `💡 會產生超過30錢幣，請選擇合理的位數與幣值組合`;
                Game.Debug.log('ui', `💡 相容性: 會產生超過30錢幣，30張${maxDenomination}元硬幣最多只能組成${maxPurchasePower}元，無法達到${digits}位數金額(${digitRangeMin}元起)`);
            } else {
                // 隱藏提示
                hintElement.style.display = 'none';
                Game.Debug.log('ui', `✅ 相容性: 硬幣數量合理：30張${maxDenomination}元足夠組成${digits}位數金額`);
            }
        },

        // =====================================================
        // 遊戲流程與題目生成
        // =====================================================
        async startQuiz() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            // 🔧 [重構] 使用統一重置函數
            this.resetGameState();

            // 重新初始化語音系統（確保「再玩一次」時語音正常）
            this.speech.init();
            Game.Debug.log('init', "測驗開始，設定為:", this.state.settings);

            // 設置測驗開始狀態
            this.state.quiz.currentQuestion = 1;
            this.state.quiz.totalQuestions = this.state.settings.questionCount;
            this.state.quiz.startTime = Date.now();

            try {
                // 生成所有題目
                const questionsGenerated = await this.generateAllQuestions();
                
                if (!questionsGenerated) {
                    // 題目生成失敗，顯示錯誤訊息並返回設定畫面
                    this.showGenerationErrorMessage();
                    this.showSettings();
                    return;
                }
                
                // 開始第一題
                this.loadQuestion(0);
                if (this.state.settings.difficulty === 'easy' && this.state.settings.assistClick) {
                    AssistClick.activate();
                }
            } catch (error) {
                Game.Debug.error('🚨 測驗開始: 題目生成過程發生異常:', error);
                this.showGenerationErrorMessage();
                this.showSettings();
            }
        },

        showGenerationErrorMessage() {
            // 創建友善的錯誤提示彈窗
            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'error-modal-overlay';
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
                border: 2px solid #ff6b6b;
                max-width: 500px;
            `;

            modalContent.innerHTML = `
                <h2 style="font-size: 2.2em; margin: 0 0 20px 0; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                    ⚠️ 設定有問題
                </h2>
                <p style="font-size: 1.3em; margin: 0 0 20px 0; line-height: 1.5;">
                    無法生成足夠的題目！<br>
                    請嘗試以下調整：
                </p>
                <ul style="text-align: left; font-size: 1.1em; line-height: 1.6; margin: 0 0 20px 0;">
                    <li>增加可用的錢幣面額種類</li>
                    <li>調整目標金額位數設定</li>
                    <li>選擇較簡單的難度模式</li>
                </ul>
                <p style="font-size: 1.1em; margin: 0; opacity: 0.9;">
                    點擊任何地方重新設定
                </p>
            `;

            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);

            // 語音提示
            this.speech.speak('設定有問題，無法生成足夠的題目，請重新調整設定');

            // 點擊任何地方關閉彈窗
            const closeModal = () => {
                modalOverlay.style.opacity = '0';
                modalContent.style.transform = 'scale(0.8)';
                Game.TimerManager.setTimeout(() => {
                    document.body.removeChild(modalOverlay);
                }, 300);
            };

            Game.EventManager.on(modalOverlay, 'click', closeModal, {}, 'gameUI');

            // 動畫效果：淡入
            Game.TimerManager.setTimeout(() => {
                modalOverlay.style.opacity = '1';
                modalContent.style.transform = 'scale(1)';
            }, 10);

            // 5秒後自動關閉
            Game.TimerManager.setTimeout(closeModal, 5000, 'ui');
        },

        showInstructionModal(targetAmount, callback) {
            // 檢查是否已經有指令彈窗存在，如果有則先移除
            const existingModal = document.getElementById('instruction-modal-overlay');
            if (existingModal) {
                Game.Debug.log('ui', '移除現有的指令彈窗');
                document.body.removeChild(existingModal);
            }
            
            // 創建彈窗元素
            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'instruction-modal-overlay';
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
                border: 2px solid #4a90e2;
            `;

            modalContent.innerHTML = `
                <h2 style="font-size: 2.5em; margin: 0 0 20px 0; color: #f1c40f; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">目標金額</h2>
                <p style="font-size: 4em; margin: 0; font-weight: bold;">${targetAmount} 元</p>
            `;

            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);

            // 語音提示，並在唸完後關閉彈窗
            // 🔧 [修正] 使用傳統中文貨幣格式
            const traditionalAmount = this.speech.convertToTraditionalCurrency(targetAmount);
            this.speech.speak(`請拿出${traditionalAmount}`, {
                callback: () => {
                    Game.TimerManager.setTimeout(() => {
                        modalOverlay.style.opacity = '0';
                        modalContent.style.transform = 'scale(0.8)';
                        Game.TimerManager.setTimeout(() => {
                            document.body.removeChild(modalOverlay);
                            if (callback) callback(); // 執行後續的遊戲渲染
                        }, 300, 'ui');
                    }, 1500); // 語音結束後停留1.5秒
                }
            });

            // 動畫效果：淡入
            Game.TimerManager.setTimeout(() => {
                modalOverlay.style.opacity = '1';
                modalContent.style.transform = 'scale(1)';
            }, 10);
        },

        async generateAllQuestions() {
            Game.Debug.log('question', '🎯 批量生成: 開始生成所有題目');
            const startTime = Date.now();

            this.state.quiz.questions = [];
            for (let i = 0; i < this.state.quiz.totalQuestions; i++) {
                // 暫時設定當前題數，用於題目生成
                this.state.quiz.currentQuestion = i;

                Game.Debug.log('question', `📝 批量生成: 正在生成第 ${i + 1}/${this.state.quiz.totalQuestions} 題`);

                const question = this.generateQuestion();
                if (question) {
                    this.state.quiz.questions.push(question);
                    Game.Debug.log('question', `✅ 批量生成: 第 ${i + 1} 題生成成功: ${question.targetAmount}元`);
                } else {
                    Game.Debug.error(`🚨 批量生成: 第 ${i + 1} 題生成失敗，中止批量生成`);
                    // 回傳false表示題目生成失敗
                    return false;
                }

                // 避免阻塞UI - 每生成一題就讓出執行權
                if (i < this.state.quiz.totalQuestions - 1) {
                    // 使用短暫的delay讓瀏覽器有機會更新UI
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            }

            // 重置為初始值
            this.state.quiz.currentQuestion = 0;

            const generationTime = Date.now() - startTime;
            Game.Debug.log('question', `🎉 批量生成: 所有題目生成完成! 耗時: ${generationTime}ms`);
            Game.Debug.log('question', '📊 批量生成: 題目總覽:', this.state.quiz.questions.map((q, i) => `第${i+1}題: ${q.targetAmount}元`));

            // 回傳true表示所有題目生成成功
            return true;
        },

        loadQuestion(questionIndex) {
            if (questionIndex >= this.state.quiz.questions.length) {
                this.showResults();
                return;
            }

            // 設置載入標記
            this.state.loadingQuestion = true;
            Game.Debug.log('question', `載入第 ${questionIndex + 1} 題`);

            const question = this.state.quiz.questions[questionIndex];
            this.state.quiz.currentQuestion = questionIndex + 1;
            
            // 初始化當前題目的遊戲狀態
            this.state.gameState = {
                targetAmount: question.targetAmount,
                currentTotal: 0,
                droppedItems: [],
                questionIndex: questionIndex,
                startTime: Date.now(),
                questionAnswered: false // 防止重複計分
            };

            // 修正：先渲染遊戲主畫面
            this.renderGameBoard(question);
            
            // 然後在遊戲畫面上方顯示指令彈窗
            this.showInstructionModal(question.targetAmount, () => {
                // 彈窗關閉後清除載入標記
                this.state.loadingQuestion = false;
                Game.Debug.log('question', `第 ${questionIndex + 1} 題載入完成`);
            });
        },

        // =====================================================
        // 遊戲主畫面渲染（模式分離）
        // =====================================================
        renderGameBoard(question) {
            const { difficulty } = this.state.settings;
            
            // 完全重置遊戲狀態，避免模式間互相干擾
            this.state.gameState = {
                targetAmount: question.targetAmount,
                currentTotal: 0,
                droppedItems: [],
                questionIndex: this.state.gameState.questionIndex,
                startTime: Date.now()
            };
            
            // 根據難度模式分離渲染
            switch (difficulty) {
                case 'easy':
                    this.renderEasyMode(question);
                    break;
                case 'normal':
                    this.renderNormalMode(question);
                    break;
                case 'hard':
                    this.renderHardMode(question);
                    break;
                default:
                    Game.Debug.error('未知的難度模式:', difficulty);
            }
        },

        // =====================================================
        // 簡單模式渲染（完全獨立）
        // =====================================================
        renderEasyMode(question) {
            const gameContainer = document.getElementById('app');
            const { denominations } = this.state.settings;
            const { targetAmount } = question;

            // 簡單模式專用：確保droppedItems陣列正確初始化（只在第一次或長度不匹配時初始化）
            const solution = this.findSolution(targetAmount, denominations);
            if (solution) {
                // 確保 droppedItems 和 hintImages 陣列正確初始化
                if (!this.state.gameState.droppedItems || this.state.gameState.droppedItems.length !== solution.length) {
                    this.state.gameState.droppedItems = new Array(solution.length).fill(null);
                    Game.Debug.log('state', '簡單模式初始化droppedItems:', this.state.gameState.droppedItems);

                    // 同時為提示圖示預先生成固定的圖片，避免每次重繪時閃爍
                    this.state.gameState.hintImages = solution.map(value => {
                        const itemData = this.getItemData(value);
                        return itemData ? this.getRandomImage(itemData) : '';
                    });
                    Game.Debug.log('state', '簡單模式初始化hintImages:', this.state.gameState.hintImages);
                }

                // 🔧 [修正] sourceCoins 單獨初始化，確保只在第一次時生成
                if (!this.state.gameState.sourceCoins) {
                    this.state.gameState.sourceCoins = this.generateSourceCoinsData(targetAmount, denominations);
                    Game.Debug.log('state', '簡單模式初始化sourceCoins:', this.state.gameState.sourceCoins);
                }
            }

            // 🆕 動態產生金錢區的錢幣圖示（根據狀態過濾已放置的硬幣）
            const moneySourceHTML = this.renderSourceCoinsHTML('unit4-easy-source-item');

            // 簡單模式：產生視覺提示（參考unit3.js的做法）
            const visualHintsHTML = this.generateVisualHintsWithState(targetAmount, denominations);

            gameContainer.innerHTML = `
                <style>
                    ${this.getCommonCSS()}
                    ${this.getEasyModeCSS()}
                </style>
                <div class="store-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <div class="progress-info">第 ${this.state.quiz.currentQuestion} / ${this.state.quiz.totalQuestions} 題</div>
                        </div>
                        <div class="title-bar-center">
                            <div class="target-amount">單元C4：正確的金額</div>
                        </div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button id="back-to-menu-btn" class="back-to-menu-btn">返回設定</button>
                        </div>
                    </div>
                    
                    <!-- 兌換區 -->
                    <div class="exchange-section unit4-easy-exchange-section">
                        <h2 class="section-title unit4-easy-section-title">兌換區</h2>
                        <div class="target-amount-display" style="font-size: 1.5em; color: #e74c3c; font-weight: bold; margin: 10px 0; text-align: center;">請拿出 ${targetAmount} 元</div>
                        <div id="drop-zone-area" class="drop-zone-container unit4-easy-drop-zone">
                            ${visualHintsHTML}
                        </div>
                        <div class="current-total-display unit4-easy-total-display${(this.state.gameState.currentTotal || 0) > targetAmount ? ' over-amount' : ''}">目前總額: ${this.state.gameState.currentTotal || 0} 元</div>
                    </div>

                    <!-- 我的金錢區 -->
                    <div class="my-money-section unit4-easy-money-section">
                        <h2 class="section-title unit4-easy-section-title">我的金錢區</h2>
                        <div id="money-source-area" class="money-source-container unit4-easy-money-source">
                            ${moneySourceHTML}
                        </div>
                    </div>
                </div>
            `;

            // 綁定簡單模式專用事件
            this.setupEasyModeEventListeners(question);
        },

        // =====================================================
        // 普通模式渲染（完全獨立）
        // =====================================================
        renderNormalMode(question) {
            const gameContainer = document.getElementById('app');
            const { denominations } = this.state.settings;
            const { targetAmount } = question;

            // 普通模式專用：初始化狀態（無視覺提示）
            // 🔧 [修正] 使用 sourceCoins 來判斷是否需要初始化，因為 droppedItems: [] 是 truthy
            if (!this.state.gameState.sourceCoins) {
                this.state.gameState.droppedItems = this.state.gameState.droppedItems || [];
                this.state.gameState.currentTotal = this.state.gameState.currentTotal || 0;
                // 🆕 初始化時生成並儲存來源硬幣
                this.state.gameState.sourceCoins = this.generateSourceCoinsData(targetAmount, denominations);
                Game.Debug.log('state', '普通模式初始化:', {
                    droppedItems: this.state.gameState.droppedItems,
                    sourceCoins: this.state.gameState.sourceCoins
                });
            }

            // 🆕 動態產生金錢區的錢幣圖示（根據狀態過濾已放置的硬幣）
            const moneySourceHTML = this.renderSourceCoinsHTML('unit4-normal-source-item');

            // 從狀態重建已放置的金錢（狀態驅動渲染）
            let droppedItemsHTML = '';
            if (this.state.gameState.droppedItems && this.state.gameState.droppedItems.length > 0) {
                this.state.gameState.droppedItems.forEach(item => {
                    const itemData = this.getItemData(item.value);
                    if (itemData) {
                        // 🔧 [修正] 使用已儲存的圖片路徑，避免重新渲染時圖片變化
                        const imageSrc = item.imageSrc || this.getRandomImage(itemData);
                        droppedItemsHTML += `<div class="money-item unit4-normal-dropped-item"
                            draggable="true" data-value="${item.value}" id="${item.id}">
                            <img src="${imageSrc}" alt="${itemData.name}" draggable="false" />
                            <div class="money-value">${itemData.name}</div>
                        </div>`;
                    }
                });
            }

            gameContainer.innerHTML = `
                <style>
                    ${this.getCommonCSS()}
                    ${this.getNormalModeCSS()}
                </style>
                <div class="store-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <div class="progress-info">第 ${this.state.quiz.currentQuestion} / ${this.state.quiz.totalQuestions} 題</div>
                        </div>
                        <div class="title-bar-center">
                            <div class="target-amount">單元C4：正確的金額</div>
                        </div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button id="back-to-menu-btn" class="back-to-menu-btn">返回設定</button>
                        </div>
                    </div>
                    
                    <!-- 兌換區 -->
                    <div class="exchange-section unit4-normal-exchange-section">
                        <div class="section-header-with-hint">
                            <h2 class="section-title unit4-normal-section-title">兌換區</h2>
                            <div style="position:absolute;right:10px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:6px;">
                                <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                                <button id="hint-total-btn" class="hint-total-btn" style="position:static;transform:none;">💡 提示</button>
                            </div>
                        </div>
                        <div class="target-amount-display" style="font-size: 1.5em; color: #e74c3c; font-weight: bold; margin: 10px 0; text-align: center;">請拿出 ${targetAmount} 元</div>
                        <div id="drop-zone-area" class="drop-zone-container unit4-normal-drop-zone">
                            ${droppedItemsHTML}
                        </div>
                        <div id="current-total-display" class="current-total-display unit4-normal-total-display" style="display: none;">目前總額: 0 元</div>
                        <button id="confirm-btn" class="unit-btn unit4-normal-confirm-btn">完成</button>
                    </div>

                    <!-- 我的金錢區 -->
                    <div class="my-money-section unit4-normal-money-section">
                        <h2 class="section-title unit4-normal-section-title">我的金錢區</h2>
                        <div id="money-source-area" class="money-source-container unit4-normal-money-source">
                            ${moneySourceHTML}
                        </div>
                    </div>
                </div>
            `;

            // 綁定普通模式專用事件
            this.setupNormalModeEventListeners(question);
            // 重新套用提示標記（若使用者已按過提示鈕）
            this.applyHintMarkings('normal');
        },

        // =====================================================
        // 困難模式渲染（完全獨立）
        // =====================================================
        renderHardMode(question) {
            const gameContainer = document.getElementById('app');
            const { denominations } = this.state.settings;
            const { targetAmount } = question;
            const { currentTotal } = this.state.gameState;

            // 🆕 困難模式：初始化 sourceCoins（如果尚未初始化）
            if (!this.state.gameState.sourceCoins) {
                this.state.gameState.sourceCoins = this.generateSourceCoinsData(targetAmount, denominations);
                Game.Debug.log('state', '困難模式初始化 sourceCoins:', this.state.gameState.sourceCoins);
            }

            // 🆕 動態產生金錢區的錢幣圖示（根據狀態過濾已放置的硬幣）
            const moneySourceHTML = this.renderSourceCoinsHTML('unit4-hard-source-item');

            // 狀態驅動：動態產生兌換區已放置的金錢圖示
            let droppedItemsHTML = '';
            if (this.state.gameState.droppedItems && this.state.gameState.droppedItems.length > 0) {
                this.state.gameState.droppedItems.forEach(item => {
                    const itemData = this.getItemData(item.value);
                    if (itemData) {
                        // 🔧 [修正] 使用已儲存的圖片路徑，避免重新渲染時圖片變化
                        const imageSrc = item.imageSrc || this.getRandomImage(itemData);
                        droppedItemsHTML += `<div class="money-item unit4-hard-dropped-item"
                            draggable="true" data-value="${item.value}" id="${item.id}">
                            <img src="${imageSrc}" alt="${itemData.name}" draggable="false" />
                            <div class="money-value">${itemData.name}</div>
                        </div>`;
                    }
                });
            }

            gameContainer.innerHTML = `
                <style>
                    ${this.getCommonCSS()}
                    ${this.getHardModeCSS()}
                </style>
                <div class="store-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <div class="progress-info">第 ${this.state.quiz.currentQuestion} / ${this.state.quiz.totalQuestions} 題</div>
                        </div>
                        <div class="title-bar-center">
                            <div class="target-amount">單元C4：正確的金額</div>
                        </div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button id="back-to-menu-btn" class="back-to-menu-btn">返回設定</button>
                        </div>
                    </div>
                    
                    <!-- 兌換區 -->
                    <div class="exchange-section unit4-hard-exchange-section">
                        <div class="section-header-with-hint">
                            <h2 class="section-title unit4-hard-section-title">兌換區</h2>
                            <div style="position:absolute;right:10px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:6px;">
                                <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                                <button id="hint-total-btn" class="hint-total-btn" style="position:static;transform:none;">💡 提示</button>
                            </div>
                        </div>
                        <div class="target-amount-display" style="font-size: 1.5em; color: #e74c3c; font-weight: bold; margin: 10px 0; text-align: center;">請拿出 ${targetAmount} 元</div>
                        <div id="drop-zone-area" class="drop-zone-container unit4-hard-drop-zone">
                            ${droppedItemsHTML}
                        </div>
                        <div id="current-total-display" class="current-total-display unit4-hard-total-display" style="display: none;">目前總額: 0 元</div>
                        <button id="confirm-btn" class="unit-btn unit4-hard-confirm-btn">完成</button>
                    </div>

                    <!-- 我的金錢區 -->
                    <div class="my-money-section unit4-hard-money-section">
                        <h2 class="section-title unit4-hard-section-title">我的金錢區</h2>
                        <div id="money-source-area" class="money-source-container unit4-hard-money-source">
                            ${moneySourceHTML}
                        </div>
                    </div>
                </div>
            `;

            // 綁定困難模式專用事件
            this.setupHardModeEventListeners(question);
            // 重新套用提示標記（若使用者已按過提示鈕）
            this.applyHintMarkings('hard');
        },

        // =====================================================
        // CSS樣式分離系統（參考unit3.js架構）
        // =====================================================
        getCommonCSS() {
            return `
                /* 深色主題基礎樣式 */
                body { 
                    background-color: #1a1a1a !important;
                    color: #ffffff !important;
                    margin: 0; 
                    padding: 0;
                    font-family: 'Microsoft JhengHei', '微軟正黑體', sans-serif;
                    display: block !important;
                    height: auto !important;
                    align-items: initial !important;
                    justify-content: initial !important;
                }
                #game-container { 
                    background-color: #1a1a1a !important; 
                    color: #ffffff !important; 
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                /* 遊戲主畫面樣式 */
                .game-board { 
                    background: var(--background-primary);
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                
                /* 標題列 */
                .title-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                    color: var(--text-inverse);
                    padding: 15px 25px;
                    box-shadow: var(--shadow-light);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    transition: var(--transition-normal);
                }
                .progress-info { font-size: 1.2em; font-weight: bold; }
                .target-amount { font-size: 1.8em; font-weight: bold; color: #f1c40f; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
                .score-info { font-size: 1.1em; }
                .back-to-menu-btn {
                    background: rgba(255,255,255,0.2);
                    color: var(--text-inverse);
                    border: 2px solid var(--text-inverse);
                    padding: 8px 16px;
                    border-radius: var(--radius-large);
                    cursor: pointer;
                    font-size: 0.9em;
                    transition: var(--transition-normal);
                }
                .back-to-menu-btn:hover {
                    background: var(--text-inverse);
                    color: var(--primary-color);
                }
                
                /* 區塊樣式 */
                .my-money-section, .exchange-section {
                    background: var(--background-card);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                    border: 2px solid var(--border-color);
                    box-shadow: var(--shadow-medium);
                }
                .section-title {
                    color: #3498db;
                    text-align: center;
                    margin: 0 0 15px 0;
                    font-size: 1.3em;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                }
                
                /* 金錢區域基礎樣式 */
                .money-source-container {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 15px;
                    min-height: 120px;
                    padding: 15px;
                    background: rgba(0,0,0,0.2);
                    border-radius: 8px;
                    border: 2px dashed #7f8c8d;
                }
                .drop-zone-container {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 10px;
                    min-height: 150px;
                    padding: 20px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 8px;
                    border: 3px dashed #95a5a6;
                    transition: all 0.3s ease;
                    align-content: flex-start;
                }
                .drop-zone-container.drag-over {
                    background: rgba(52, 152, 219, 0.2) !important;
                    border-color: #3498db !important;
                    border-style: solid !important;
                }
                .money-source-container.drag-over {
                    background: rgba(52, 152, 219, 0.1) !important;
                    border-color: #3498db !important;
                    border-style: solid !important;
                }
                
                /* 金錢物件基礎樣式 - 參考C5設計 */
                .money-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: grab;
                    text-align: center;
                    user-select: none;
                    padding: 10px;
                    border-radius: 12px;
                    transition: all 0.3s ease;
                    background: white;
                    border: 2px solid #4CAF50;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin: 5px;
                }

                /* 源金錢特定樣式覆蓋 */
                .source-money {
                    background: white;
                    border: 2px solid #4CAF50;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    padding: 10px;
                }
                .money-item img {
                    max-width: 70px;
                    max-height: 50px;
                    object-fit: contain;
                    margin-bottom: 8px;
                }
                .money-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                }

                /* 金額顯示樣式 */
                .money-value {
                    font-weight: bold;
                    color: #2E7D32;
                    font-size: 14px;
                    text-align: center;
                    margin-top: 5px;
                }
                .dropped-item {
                    background: white;
                    border: 2px solid #4CAF50;
                    animation: dropIn 0.3s ease-out;
                }
                
                /* 總額顯示基礎樣式 */
                .current-total-display { 
                    font-size: 1.5em; 
                    color: #2ecc71; 
                    text-align: center; 
                    margin: 15px 0; 
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                    transition: color 0.3s, transform 0.2s; 
                }
                
                /* 拖曳相關樣式 */
                .money-item.dragging { 
                    opacity: 0.5; 
                    transform: scale(1.1); 
                }
                
                /* 🎬 dropIn - moved to injectGlobalAnimationStyles() */

                /* 按鈕基礎樣式 */
                .unit-btn {
                    background: linear-gradient(135deg, #27ae60, #2ecc71);
                    color: #ffffff !important;
                    border: none;
                    padding: 18px 35px;
                    border-radius: 10px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: block;
                    margin: 25px auto;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
                    text-decoration: none;
                    text-align: center;
                }
                
                .unit-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #2ecc71, #1abc9c);
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.5);
                }
            `;
        },

        getEasyModeCSS() {
            return `
                /* 簡單模式專用樣式 (unit4-easy-* 前綴) - 清潔版本 */
                
                .unit4-easy-section-title {
                    color: var(--text-primary) !important;
                }
                
                .unit4-easy-money-source {
                    border-color: #2ecc71;
                    background: rgba(46, 204, 113, 0.1);
                    min-height: 140px;
                }
                
                .unit4-easy-drop-zone {
                    border-color: #2ecc71;
                    background: rgba(46, 204, 113, 0.05);
                    min-height: 160px;
                    position: relative;
                    padding: 0;
                }
                
                .unit4-easy-source-item {
                    border: none;
                    background: transparent;
                    padding: 0;
                }
                
                .unit4-easy-source-item:hover {
                    box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
                    transform: scale(1.05);
                }
                
                /* 禁用圖片的預設拖曳行為，確保無邊框背景 */
                .unit4-easy-source-item img {
                    pointer-events: none;
                    user-select: none;
                    -webkit-user-drag: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    background: transparent !important;
                    border: none !important;
                    outline: none !important;
                }
                
                /* 簡單模式各面額金錢圖示大小調整 */
                .unit4-easy-source-item[data-value="1000"] img {
                    max-width: 154px !important; /* 220% of 70px */
                    max-height: 110px !important; /* 220% of 50px */
                }
                
                .unit4-easy-source-item[data-value="500"] img {
                    max-width: 133px !important; /* 190% of 70px */
                    max-height: 95px !important; /* 190% of 50px */
                }
                
                .unit4-easy-source-item[data-value="100"] img {
                    max-width: 126px !important; /* 180% of 70px */
                    max-height: 90px !important; /* 180% of 50px */
                }
                
                .unit4-easy-source-item[data-value="50"] img {
                    max-width: 140px !important; /* 200% of 70px */
                    max-height: 100px !important; /* 200% of 50px */
                }
                
                .unit4-easy-source-item[data-value="10"] img {
                    max-width: 133px !important; /* 190% of 70px */
                    max-height: 95px !important; /* 190% of 50px */
                }
                
                .unit4-easy-source-item[data-value="5"] img {
                    max-width: 126px !important; /* 180% of 70px */
                    max-height: 90px !important; /* 180% of 50px */
                }
                
                .unit4-easy-source-item[data-value="1"] img {
                    max-width: 119px !important; /* 170% of 70px */
                    max-height: 85px !important; /* 170% of 50px */
                }
                
                /* 確保金錢項目本身無邊框背景（輔助點擊高亮狀態除外）*/
                .unit4-easy-source-item:not(.assist-click-hint) {
                    border: none !important;
                    background: transparent !important;
                    outline: none !important;
                    box-shadow: none !important;
                }

                .unit4-easy-source-item:focus:not(.assist-click-hint) {
                    outline: none !important;
                    border: none !important;
                    background: transparent !important;
                }
                
                .unit4-easy-total-display {
                    color: #2ecc71;
                    font-size: 1.8em;
                    transition: color 0.3s ease;
                }
                
                .unit4-easy-total-display.over-amount {
                    color: #e74c3c !important;
                    font-weight: bold;
                    text-shadow: 0 0 5px rgba(231, 76, 60, 0.5);
                    animation: warning-pulse 1s ease-in-out infinite alternate;
                }
                
                .unit4-easy-auto-hint {
                    text-align: center;
                    color: #f1c40f;
                    background: rgba(241, 196, 15, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    margin: 10px 0;
                    border: 1px solid rgba(241, 196, 15, 0.3);
                    font-size: 1.1em;
                }
                
                /* 簡潔的視覺提示系統 */
                .visual-hints {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    justify-content: flex-start;
                    align-items: center;
                    padding: 20px;
                    background: transparent;
                    border-radius: 8px;
                    min-height: 120px;
                }
                
                .hint-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    border-radius: 12px;
                    transition: all 0.3s ease;
                    flex-shrink: 0;
                    background: transparent;
                    border: none;
                    box-shadow: none;
                    margin: 5px;
                }

                .hint-item img {
                    max-width: 154px;
                    max-height: 110px;
                    object-fit: contain;
                    margin-bottom: 8px;
                }

                /* 依面額對應我的金錢區圖示大小 */
                .hint-item[data-value="1000"] img {
                    max-width: 154px !important;
                    max-height: 110px !important;
                }
                .hint-item[data-value="500"] img {
                    max-width: 133px !important;
                    max-height: 95px !important;
                }
                .hint-item[data-value="100"] img {
                    max-width: 126px !important;
                    max-height: 90px !important;
                }
                .hint-item[data-value="50"] img {
                    max-width: 140px !important;
                    max-height: 100px !important;
                }
                .hint-item[data-value="10"] img {
                    max-width: 133px !important;
                    max-height: 95px !important;
                }
                .hint-item[data-value="5"] img {
                    max-width: 126px !important;
                    max-height: 90px !important;
                }
                .hint-item[data-value="1"] img {
                    max-width: 119px !important;
                    max-height: 85px !important;
                }

                /* 淡化狀態 */
                .hint-item.faded {
                    opacity: 0.4;
                    filter: grayscale(80%);
                }

                /* 點亮狀態 */
                .hint-item.lit-up {
                    opacity: 1;
                    filter: none;
                    box-shadow: 0 0 10px rgba(46, 204, 113, 0.5);
                }
            `;
        },

        getNormalModeCSS() {
            return `
                /* 普通模式專用樣式 (unit4-normal-* 前綴) */
                
                .unit4-normal-section-title {
                    color: var(--text-primary) !important;
                }
                
                .unit4-normal-money-source {
                    border-color: #3498db;
                    background: rgba(52, 152, 219, 0.1);
                }
                
                .unit4-normal-drop-zone {
                    border-color: #3498db;
                    background: rgba(52, 152, 219, 0.05);
                }
                
                .unit4-normal-source-item {
                    border: none;
                    background: transparent;
                    padding: 0;
                }
                
                .unit4-normal-source-item:hover {
                    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
                    transform: scale(1.05);
                }
                
                /* 普通模式拖曳金錢樣式 */
                .unit4-normal-dropped-item {
                    border: none;
                    background: transparent;
                    padding: 0;
                    margin: 5px;
                    cursor: grab;
                    user-select: none;
                }
                
                .unit4-normal-dropped-item:hover {
                    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
                    transform: scale(1.05);
                }
                
                .unit4-normal-dropped-item.dragging {
                    opacity: 0.5;
                    cursor: grabbing;
                }
                
                .unit4-normal-source-item img,
                .unit4-normal-dropped-item img {
                    pointer-events: none;
                    user-select: none;
                    -webkit-user-drag: none;
                    background: transparent !important;
                    border: none !important;
                    outline: none !important;
                }
                
                /* 普通模式各面額金錢圖示大小調整 */
                .unit4-normal-source-item[data-value="1000"] img,
                .unit4-normal-dropped-item[data-value="1000"] img {
                    max-width: 154px !important; /* 220% of 70px */
                    max-height: 110px !important; /* 220% of 50px */
                }
                
                .unit4-normal-source-item[data-value="500"] img,
                .unit4-normal-dropped-item[data-value="500"] img {
                    max-width: 133px !important; /* 190% of 70px */
                    max-height: 95px !important; /* 190% of 50px */
                }
                
                .unit4-normal-source-item[data-value="100"] img,
                .unit4-normal-dropped-item[data-value="100"] img {
                    max-width: 126px !important; /* 180% of 70px */
                    max-height: 90px !important; /* 180% of 50px */
                }
                
                .unit4-normal-source-item[data-value="50"] img,
                .unit4-normal-dropped-item[data-value="50"] img {
                    max-width: 140px !important; /* 200% of 70px */
                    max-height: 100px !important; /* 200% of 50px */
                }
                
                .unit4-normal-source-item[data-value="10"] img,
                .unit4-normal-dropped-item[data-value="10"] img {
                    max-width: 133px !important; /* 190% of 70px */
                    max-height: 95px !important; /* 190% of 50px */
                }
                
                .unit4-normal-source-item[data-value="5"] img,
                .unit4-normal-dropped-item[data-value="5"] img {
                    max-width: 126px !important; /* 180% of 70px */
                    max-height: 90px !important; /* 180% of 50px */
                }
                
                .unit4-normal-source-item[data-value="1"] img,
                .unit4-normal-dropped-item[data-value="1"] img {
                    max-width: 119px !important; /* 170% of 70px */
                    max-height: 85px !important; /* 170% of 50px */
                }
                
                .unit4-normal-total-display {
                    color: #3498db;
                    font-size: 1.8em;
                    transition: color 0.3s ease;
                }
                
                .unit4-normal-total-display.over-amount {
                    color: #e74c3c !important;
                    font-weight: bold;
                    text-shadow: 0 0 5px rgba(231, 76, 60, 0.5);
                    animation: warning-pulse 1s ease-in-out infinite alternate;
                }
                
                /* 🎬 warning-pulse - moved to injectGlobalAnimationStyles() */

                .unit4-normal-hint {
                    text-align: center;
                    color: #f39c12;
                    background: rgba(243, 156, 18, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    margin: 10px 0;
                    border: 1px solid rgba(243, 156, 18, 0.3);
                    font-size: 1.1em;
                }
                
                .unit4-normal-confirm-btn {
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-size: 1.2em;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: block;
                    margin: 15px auto;
                    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
                }
                
                .unit4-normal-confirm-btn:hover {
                    background: linear-gradient(135deg, #2980b9, #1abc9c);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
                }

                /* 🆕 普通模式標題與提示按鈕同行布局 */
                .section-header-with-hint {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-bottom: 15px;
                    position: relative;
                }

                .hint-total-btn {
                    background: linear-gradient(135deg, #f39c12, #e67e22);
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 20px;
                    font-size: 0.9em;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: absolute;
                    right: 10px;
                    box-shadow: 0 2px 8px rgba(243, 156, 18, 0.3);
                }

                .hint-total-btn:hover {
                    background: linear-gradient(135deg, #e67e22, #d35400);
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(243, 156, 18, 0.4);
                }

                .hint-total-btn:active {
                    transform: scale(0.95);
                }

                /* 普通模式總額顯示（按提示時顯示數值） */
                .unit4-normal-total-display {
                    transition: color 0.3s ease;
                }

                .unit4-normal-total-display.hint-shown {
                    color: #2ecc71;
                }

                /* 普通模式提示高亮樣式 */
                .unit4-normal-source-item.hint-highlighted {
                    animation: hintPulse 1s ease-in-out infinite;
                    box-shadow: 0 0 20px rgba(76, 175, 80, 0.8) !important;
                    border: 3px solid #4CAF50 !important;
                    border-radius: 8px;
                }

                /* 🎬 hintPulse - moved to injectGlobalAnimationStyles() */
            `;
        },

        getHardModeCSS() {
            return `
                /* 困難模式專用樣式 (unit4-hard-* 前綴) */

                /* 標題與提示按鈕同行布局 */
                .section-header-with-hint {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-bottom: 15px;
                    position: relative;
                }

                .hint-total-btn {
                    background: linear-gradient(135deg, #f39c12, #e67e22);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 1em;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 3px 10px rgba(243, 156, 18, 0.3);
                    position: absolute;
                    right: 0;
                }

                .hint-total-btn:hover {
                    background: linear-gradient(135deg, #e67e22, #d35400);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(243, 156, 18, 0.4);
                }

                .hint-total-btn:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 5px rgba(243, 156, 18, 0.3);
                }

                .unit4-hard-section-title {
                    color: var(--text-primary) !important;
                    margin: 0;
                }
                
                .unit4-hard-money-source {
                    border-color: #3498db;
                    background: rgba(52, 152, 219, 0.1);
                }
                
                .unit4-hard-drop-zone {
                    border-color: #3498db;
                    background: rgba(52, 152, 219, 0.1);
                }
                
                .unit4-hard-source-item {
                    border: 2px solid #e74c3c;
                    background: rgba(231, 76, 60, 0.1);
                }
                
                .unit4-hard-source-item:hover {
                    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
                    border-color: #c0392b;
                }
                
                .unit4-hard-source-item img,
                .unit4-hard-dropped-item img {
                    pointer-events: none;
                    user-select: none;
                    -webkit-user-drag: none;
                    background: transparent !important;
                    border: none !important;
                    outline: none !important;
                }
                
                /* 困難模式各面額金錢圖示大小調整 */
                .unit4-hard-source-item[data-value="1000"] img,
                .unit4-hard-dropped-item[data-value="1000"] img {
                    max-width: 154px !important; /* 220% of 70px */
                    max-height: 110px !important; /* 220% of 50px */
                }
                
                .unit4-hard-source-item[data-value="500"] img,
                .unit4-hard-dropped-item[data-value="500"] img {
                    max-width: 133px !important; /* 190% of 70px */
                    max-height: 95px !important; /* 190% of 50px */
                }
                
                .unit4-hard-source-item[data-value="100"] img,
                .unit4-hard-dropped-item[data-value="100"] img {
                    max-width: 126px !important; /* 180% of 70px */
                    max-height: 90px !important; /* 180% of 50px */
                }
                
                .unit4-hard-source-item[data-value="50"] img,
                .unit4-hard-dropped-item[data-value="50"] img {
                    max-width: 140px !important; /* 200% of 70px */
                    max-height: 100px !important; /* 200% of 50px */
                }
                
                .unit4-hard-source-item[data-value="10"] img,
                .unit4-hard-dropped-item[data-value="10"] img {
                    max-width: 133px !important; /* 190% of 70px */
                    max-height: 95px !important; /* 190% of 50px */
                }
                
                .unit4-hard-source-item[data-value="5"] img,
                .unit4-hard-dropped-item[data-value="5"] img {
                    max-width: 126px !important; /* 180% of 70px */
                    max-height: 90px !important; /* 180% of 50px */
                }
                
                .unit4-hard-source-item[data-value="1"] img,
                .unit4-hard-dropped-item[data-value="1"] img {
                    max-width: 119px !important; /* 170% of 70px */
                    max-height: 85px !important; /* 170% of 50px */
                }
                
                .unit4-hard-total-display {
                    color: #3498db;
                    font-size: 1.8em;
                    transition: color 0.3s ease;
                }

                /* 顯示提示後，變色顯示 */
                .unit4-hard-total-display.hint-shown {
                    color: #2ecc71;
                }
                
                .unit4-hard-confirm-btn {
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-size: 1.2em;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: block;
                    margin: 15px auto;
                    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
                }
                
                .unit4-hard-confirm-btn:hover {
                    background: linear-gradient(135deg, #2980b9, #1abc9c);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
                }
                
                .unit4-hard-challenge-hint {
                    text-align: center;
                    color: #f39c12;
                    background: rgba(243, 156, 18, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    margin: 10px 0;
                    border: 1px solid rgba(231, 76, 60, 0.3);
                    font-size: 1.1em;
                    font-weight: bold;
                }

                /* 困難模式提示高亮樣式 */
                .unit4-hard-source-item.hint-highlighted {
                    animation: hintPulse 1s ease-in-out infinite;
                    box-shadow: 0 0 20px rgba(76, 175, 80, 0.8) !important;
                    border: 3px solid #4CAF50 !important;
                    border-radius: 8px;
                }

                /* 🎬 hintPulse - moved to injectGlobalAnimationStyles() */
            `;
        },

        /**
         * 根據金額自動決定可用面額
         */
        getAutoDenominations(amount) {
            const allDenoms = [1000, 500, 100, 50, 10, 5, 1];
            return allDenoms.filter(d => d <= amount);
        },

        /**
         * 產生一個有解的題目
         * @returns {{targetAmount: number}|null} - 包含目標金額的題目物件，或 null (如果生成失敗)
         */
        generateQuestion() {
            Game.Debug.log('question', `🎯 題目生成: 開始生成第 ${(this.state.quiz.currentQuestion || 0) + 1} 題`);

            const { digits, customAmount } = this.state.settings;
            let { denominations } = this.state.settings;

            // 自訂金額模式：自動決定面額
            if (digits === 'custom') {
                denominations = this.getAutoDenominations(customAmount);
                this.state.settings.denominations = denominations;
            }

            if (denominations.length === 0) {
                Game.Debug.error('🚨 題目生成: 沒有選擇任何幣值');
                return null;
            }

            let question = null;
            let attempts = 0;
            const maxAttempts = 10; // 降低重試次數避免無限循環
            const startTime = Date.now();
            const timeout = 5000; // 5秒總超時時間
            
            // 防重複機制：如果與上一題目標金額相同則重新生成
            do {
                attempts++;
                
                // 總體超時檢查
                if (Date.now() - startTime > timeout) {
                    Game.Debug.error('🚨 題目生成: 題目生成總體超時，放棄生成');
                    return null;
                }

                try {
                    if (digits === 'custom') {
                        // 自訂金額模式：使用自動面額
                        const autoDenoms = this.getAutoDenominations(customAmount);
                        Game.Debug.log('question', `🎯 題目生成: 嘗試自訂金額模式 (第${attempts}次嘗試), 自動面額: [${autoDenoms.join(',')}]`);
                        question = this.generateCustomAmountQuestion(customAmount, autoDenoms);
                    } else {
                        // 原有的位數範圍模式
                        Game.Debug.log('question', `🎯 題目生成: 嘗試位數範圍模式 (第${attempts}次嘗試)`);
                        question = this.generateDigitRangeQuestion(digits, denominations);
                    }
                } catch (error) {
                    Game.Debug.error(`🚨 題目生成: 第${attempts}次嘗試發生錯誤:`, error);
                    question = null;
                }

                // 檢查是否與上一題重複或已達最大重試次數
                if (!question || question.targetAmount !== this.state.lastTargetAmount || attempts >= maxAttempts) {
                    if (question) {
                        Game.Debug.log('question', `🎯 題目生成: 第${(this.state.quiz.currentQuestion || 0) + 1}題生成成功`, {
                            targetAmount: question.targetAmount,
                            lastAmount: this.state.lastTargetAmount,
                            attempts,
                            isDuplicate: question.targetAmount === this.state.lastTargetAmount,
                            generationTime: Date.now() - startTime + 'ms'
                        });

                        // 更新上一題目標金額
                        this.state.lastTargetAmount = question.targetAmount;
                    } else {
                        Game.Debug.error(`🚨 題目生成: 第${(this.state.quiz.currentQuestion || 0) + 1}題生成失敗`, {
                            attempts,
                            generationTime: Date.now() - startTime + 'ms'
                        });
                    }
                    break; // 不重複或達到最大重試次數，跳出do-while循環
                }

                Game.Debug.log('question', `⚠️ 題目生成: 目標金額重複，重新生成 (第${attempts}次)`);
            } while (attempts < maxAttempts);

            return question;
        },

        // 新增：自訂金額模式的題目生成（超高效「構建」版本）
        generateCustomAmountQuestion(customAmount, denominations) {
            Game.Debug.log('question', `🚀 自訂模式: 使用「構建」方法處理自訂金額: ${customAmount}元`);

            // 檢查是否能包含所有幣值
            const baseAmount = denominations.reduce((sum, coin) => sum + coin, 0);
            if (customAmount < baseAmount) {
                Game.Debug.error(`自訂金額${customAmount}元不足以包含所有幣值，最少需要${baseAmount}元`);
                return null;
            }

            Game.Debug.log('question', `💡 自訂模式: 基礎金額: ${baseAmount}元，目標: ${customAmount}元，需添加: ${customAmount - baseAmount}元`);

            // 🚀 超高效「構建」方法：直接構建多種有效組合
            const allCombinations = [];
            const denomsSorted = [...denominations].sort((a, b) => b - a);
            const remaining = customAmount - baseAmount;
            
            // 生成多個組合變化（最多20種）
            for (let combIndex = 0; combIndex < 20; combIndex++) {
                const solution = [...denominations]; // 每種幣值各1個
                let currentRemaining = remaining;
                
                // 使用貪心算法的變化版本來分配剩餘金額
                const useDenoms = [...denomsSorted];
                
                // 為了產生變化，有時優先使用小面額
                if (combIndex % 3 === 1 && useDenoms.length > 2) {
                    // 每3個組合中有1個優先使用小面額
                    useDenoms.reverse();
                } else if (combIndex % 3 === 2 && useDenoms.length > 3) {
                    // 每3個組合中有1個使用隨機順序
                    for (let i = useDenoms.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [useDenoms[i], useDenoms[j]] = [useDenoms[j], useDenoms[i]];
                    }
                }
                
                // 分配剩餘金額
                let safetyCounter = 0;
                while (currentRemaining > 0 && safetyCounter < 1000) {
                    safetyCounter++;
                    let progressMade = false;
                    
                    for (const denom of useDenoms) {
                        if (currentRemaining >= denom) {
                            solution.push(denom);
                            currentRemaining -= denom;
                            progressMade = true;
                            
                            // 為了產生組合變化，有時跳出循環
                            if (combIndex % 5 === 0 && Math.random() < 0.3) {
                                break;
                            }
                        }
                    }
                    
                    // 如果沒有進展，跳出循環避免死循環
                    if (!progressMade) break;
                }
                
                // 檢查是否成功構建了正確的金額
                if (currentRemaining === 0) {
                    solution.sort((a, b) => b - a); // 降序排列
                    
                    // 檢查是否包含所有面額
                    const solutionDenoms = new Set(solution);
                    const allDenomsIncluded = denominations.every(d => solutionDenoms.has(d));
                    
                    if (allDenomsIncluded) {
                        // 避免重複組合
                        const solutionKey = solution.join(',');
                        if (!allCombinations.some(combo => combo.join(',') === solutionKey)) {
                            allCombinations.push([...solution]);
                            Game.Debug.log('question', `✅ 自訂構建: 組合 ${allCombinations.length}: 總額=${customAmount}元，硬幣數=${solution.length}`);
                        }
                    } else {
                        Game.Debug.warn('question', `⚠️ 自訂構建: 組合 ${combIndex + 1} 未包含所有面額`);
                    }
                } else {
                    Game.Debug.warn('question', `⚠️ 自訂構建: 組合 ${combIndex + 1} 金額不匹配: 剩餘${currentRemaining}元`);
                }
                
                // 確保有足夠的組合變化
                if (allCombinations.length >= 10) break;
            }

            if (allCombinations.length === 0) {
                Game.Debug.error("無法構建包含所有幣值的有效組合");
                return null;
            }

            // 根據題數選擇不同的組合
            const currentQ = this.state.quiz.currentQuestion || 0;
            const selectedCombination = allCombinations[currentQ % allCombinations.length];

            Game.Debug.log('question', `🎯 自訂構建成功: 第${currentQ + 1}題生成:`);
            Game.Debug.log('question', `   目標金額: ${customAmount}元`);
            Game.Debug.log('question', `   選中組合:`, selectedCombination);
            Game.Debug.log('question', `   硬幣總數: ${selectedCombination.length}`);
            Game.Debug.log('question', `   可用組合總數: ${allCombinations.length}`);

            return { 
                targetAmount: customAmount,
                solution: selectedCombination,
                allPossibleSolutions: allCombinations
            };
        },

        // 新增：位數範圍模式的題目生成（超高效「構建」版本）
        generateDigitRangeQuestion(digits, denominations) {
            Game.Debug.log('question', `🚀 位數模式: 開始使用「構建」方法處理${digits}位數範圍`);

            const minAmount = (digits === 1) ? 1 : Math.pow(10, digits - 1);
            const maxAmount = Math.pow(10, digits) - 1;

            // 計算使用所有幣值各1個的基礎金額
            const baseAmount = denominations.reduce((sum, coin) => sum + coin, 0);

            // 檢查基礎金額是否超出範圍
            if (baseAmount > maxAmount) {
                Game.Debug.error(`${digits}位數範圍(${minAmount}-${maxAmount}元)無法包含所有選擇的幣值，最少需要${baseAmount}元`);
                return null;
            }

            Game.Debug.log('question', `💡 位數模式: 基礎金額: ${baseAmount}元，目標範圍: ${minAmount}-${maxAmount}元`);

            // 🚀 超高效「構建」方法：直接構建有效金額，而非搜索
            const validTargets = [];
            const denomsSorted = [...denominations].sort((a, b) => b - a); // 降序排列便於構建
            const currentQ = this.state.quiz.currentQuestion || 0;
            
            // 生成多個有效目標（10-20個）以供輪換使用
            for (let targetIndex = 0; targetIndex < 20; targetIndex++) {
                let currentAmount = baseAmount; // 從包含所有幣值的基礎開始
                const solution = [...denominations]; // 每種幣值各1個

                // 計算可以添加的金額空間
                const availableSpace = maxAmount - baseAmount;

                // 如果基礎金額已經在範圍內，添加隨機硬幣來創造變化
                if (currentAmount >= minAmount && currentAmount <= maxAmount) {
                    // 根據 targetIndex 創造不同的金額變化
                    const remainingSlots = 30 - solution.length;
                    const maxAddable = Math.min(availableSpace, remainingSlots * denomsSorted[0]);
                    let remainingToAdd = Math.floor(Math.random() * (maxAddable + 1));

                    Game.Debug.log('question', `🎲 構建: 目標${targetIndex + 1}: 基礎${baseAmount}元 + 目標增加${remainingToAdd}元`);

                    // 隨機添加硬幣直到達到目標金額
                    let addAttempts = 0;
                    while (remainingToAdd > 0 && addAttempts < 50 && solution.length < 30) {
                        addAttempts++;

                        // 選擇合適的面額
                        let candidateDenoms = denomsSorted.filter(d => d <= remainingToAdd);
                        if (candidateDenoms.length === 0) break; // 沒有合適的面額

                        // 偏好使用較大面額來加快構建
                        const selectedDenom = candidateDenoms[Math.floor(Math.random() * Math.min(3, candidateDenoms.length))];

                        if (currentAmount + selectedDenom <= maxAmount) {
                            currentAmount += selectedDenom;
                            solution.push(selectedDenom);
                            remainingToAdd -= selectedDenom;
                        } else {
                            break; // 無法再添加
                        }
                    }
                } else if (currentAmount < minAmount) {
                    // 如果基礎金額太小，需要添加更多硬幣
                    let attempts = 0;
                    const maxBuildAttempts = 100;

                    while (currentAmount < minAmount && attempts < maxBuildAttempts && solution.length < 30) {
                        attempts++;

                        // 添加較大面額
                        const largeDenoms = denomsSorted.filter(d => d >= 100);
                        const selectedDenom = largeDenoms.length > 0
                            ? largeDenoms[Math.floor(Math.random() * largeDenoms.length)]
                            : denomsSorted[Math.floor(Math.random() * denomsSorted.length)];

                        if (currentAmount + selectedDenom <= maxAmount) {
                            currentAmount += selectedDenom;
                            solution.push(selectedDenom);
                        }
                    }
                }
                
                // 檢查構建的金額是否在有效範圍內
                if (currentAmount >= minAmount && currentAmount <= maxAmount) {
                    // 🔧 檢查硬幣數量是否超過 30 個限制
                    if (solution.length > 30) {
                        Game.Debug.warn('question', `⚠️ 構建: 目標 ${targetIndex + 1} 硬幣數超過30個限制: ${solution.length}個，跳過`);
                        continue; // 跳過這個目標
                    }

                    solution.sort((a, b) => b - a); // 降序排列
                    validTargets.push({
                        targetAmount: currentAmount,
                        combinations: [solution]
                    });

                    Game.Debug.log('question', `✅ 構建: 成功構建目標 ${targetIndex + 1}: ${currentAmount}元，硬幣數: ${solution.length}`);
                } else {
                    Game.Debug.warn('question', `⚠️ 構建: 目標 ${targetIndex + 1} 構建失敗: ${currentAmount}元 超出範圍`);
                }
                
                // 確保有足夠的有效目標
                if (validTargets.length >= 10) break;
            }

            if (validTargets.length === 0) {
                Game.Debug.error(`🚨 構建: ${digits}位數範圍內無法構建包含所有幣值的有效組合`);
                return null;
            }

            // 隨機打亂 validTargets，避免每次都從最小金額開始
            for (let i = validTargets.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [validTargets[i], validTargets[j]] = [validTargets[j], validTargets[i]];
            }
            const selectedTarget = validTargets[currentQ % validTargets.length];
            const selectedCombination = selectedTarget.combinations[0];

            Game.Debug.log('question', `🎯 構建成功: 第${currentQ + 1}題生成:`);
            Game.Debug.log('question', `   位數範圍: ${digits}位數(${minAmount}-${maxAmount}元)`);
            Game.Debug.log('question', `   目標金額: ${selectedTarget.targetAmount}元`);
            Game.Debug.log('question', `   選中組合:`, selectedCombination);
            Game.Debug.log('question', `   硬幣總數: ${selectedCombination.length}`);
            Game.Debug.log('question', `   有效目標總數: ${validTargets.length}`);

            return {
                targetAmount: selectedTarget.targetAmount,
                solution: selectedCombination,
                allValidTargets: validTargets
            };
        },

        // =====================================================
        // 視覺提示系統（簡單模式）
        // =====================================================
        generateVisualHints(targetAmount, availableDenominations) {
            // 產生一個可能的解法作為視覺提示
            const solution = this.findSolution(targetAmount, availableDenominations);
            if (!solution) return '';

            let hintsHTML = '<div class="visual-hints">';
            solution.forEach((value, index) => {
                const itemData = this.getItemData(value);
                if (itemData) {
                    const imageSrc = this.getRandomImage(itemData);
                    hintsHTML += `<div class="hint-item" data-value="${value}">
                        <img src="${imageSrc}" alt="${itemData.name}" />
                    </div>`;
                }
            });
            hintsHTML += '</div>';
            
            return hintsHTML;
        },
        
        generateVisualHintsWithState(targetAmount, availableDenominations) {
            // 簡化版本：產生視覺提示
            const solution = this.findSolution(targetAmount, availableDenominations);
            Game.Debug.log('hint', '解法結果:', solution, '目標金額:', targetAmount);

            if (!solution) {
                Game.Debug.error('無法找到解法為', targetAmount, '元');
                return '<div class="visual-hints"></div>';
            }

            // 確保droppedItems已初始化（如果renderEasyMode沒有初始化的話）
            if (!this.state.gameState.droppedItems || this.state.gameState.droppedItems.length !== solution.length) {
                this.state.gameState.droppedItems = new Array(solution.length).fill(null);
                Game.Debug.log('hint', 'generateVisualHintsWithState初始化droppedItems陣列:', this.state.gameState.droppedItems);
            }

            let hintsHTML = '<div class="visual-hints">';
            
            solution.forEach((value, index) => {
                const itemData = this.getItemData(value);
                
                if (itemData) {
                    const droppedItem = this.state.gameState.droppedItems[index];
                    const isLitUp = droppedItem !== null;
                    
                    // 決定要使用的圖片來源
                    // 如果已點亮，使用拖曳過來的圖片；否則，使用預設的提示圖片
                    const imageSrc = isLitUp ? droppedItem.imageSrc : this.state.gameState.hintImages[index];
                    
                    const hintClass = isLitUp ? 'hint-item lit-up' : 'hint-item faded';

                    Game.Debug.log('hint', `位置 ${index}: ${value}元, 狀態: ${isLitUp ? '點亮' : '淡化'}`);
                    
                    hintsHTML += `<div class="${hintClass}" data-value="${value}" data-position="${index}">
                        <img src="${imageSrc}" alt="${itemData.name}" />
                        <div class="money-value">${itemData.name}</div>
                    </div>`;
                }
            });
            hintsHTML += '</div>';

            Game.Debug.log('hint', '生成HTML完成，droppedItems狀態:', this.state.gameState.droppedItems);
            return hintsHTML;
        },

        findSolution(targetAmount, denominations) {
            // 簡單的貪心算法找出一個解法
            Game.Debug.log('wallet', '開始計算解法:', '目標金額:', targetAmount, '可用金錢:', denominations);

            const sortedDenoms = [...denominations].sort((a, b) => b - a); // 從大到小排序
            Game.Debug.log('wallet', '排序後的金錢:', sortedDenoms);

            const solution = [];
            let remaining = targetAmount;

            const MAX_COINS = 30; // 🔧 硬幣數量上限
            for (const denom of sortedDenoms) {
                Game.Debug.log('wallet', `檢查 ${denom}元, 剩餘 ${remaining}元`);
                while (remaining >= denom && solution.length < MAX_COINS) {
                    solution.push(denom);
                    remaining -= denom;
                    Game.Debug.log('wallet', `添加 ${denom}元, 剩餘 ${remaining}元, 目前solution:`, solution);
                }
                if (remaining === 0) break;
                // 🔧 檢查是否已達硬幣上限
                if (solution.length >= MAX_COINS) {
                    Game.Debug.log('wallet', `⚠️ 解法: 已達到 ${MAX_COINS} 硬幣上限，停止生成`);
                    break;
                }
            }

            Game.Debug.log('wallet', '最終解法:', solution, '剩餘:', remaining);
            return remaining === 0 ? solution : null;
        },

        // 🆕 生成足夠的金錢（確保可以組合出目標金額）
        generateSufficientMoneyHTML(targetAmount, denominations, modeClass) {
            // 計算解法
            const solution = this.findSolution(targetAmount, denominations);
            if (!solution) {
                Game.Debug.error('🚨 金錢生成: 無法生成解法，目標金額:', targetAmount);
                // 如果無法生成解法，至少返回每種面額一個
                let fallbackHTML = '';
                denominations.forEach((value, index) => {
                    const itemData = this.getItemData(value);
                    if (itemData) {
                        const imageSrc = this.getRandomImage(itemData);
                        fallbackHTML += `<div class="money-item source-money ${modeClass}" draggable="true" data-value="${value}" id="money-${value}-${index}">
                            <img src="${imageSrc}" alt="${itemData.name}" draggable="false" />
                            <div class="money-value">${itemData.name}</div>
                        </div>`;
                    }
                });
                return fallbackHTML;
            }

            // 計算每種面額需要的數量
            const coinCounts = {};
            solution.forEach(coin => {
                coinCounts[coin] = (coinCounts[coin] || 0) + 1;
            });
            Game.Debug.log('wallet', '📊 金錢生成: 解法所需硬幣:', coinCounts);

            // 為每種面額添加額外的硬幣（增加干擾選項）
            denominations.forEach(denom => {
                if (!coinCounts[denom]) {
                    // 如果這個面額不在解法中，添加1-2個作為干擾
                    coinCounts[denom] = Math.floor(Math.random() * 2) + 1;
                } else {
                    // 如果在解法中，隨機添加0-2個額外的
                    coinCounts[denom] += Math.floor(Math.random() * 2);
                }
            });
            Game.Debug.log('wallet', '📊 金錢生成: 最終硬幣數量:', coinCounts);

            // 生成金錢HTML
            let moneySourceHTML = '';
            let globalIndex = 0;
            denominations.forEach(value => {
                const count = coinCounts[value] || 1;
                const itemData = this.getItemData(value);
                if (itemData) {
                    for (let i = 0; i < count; i++) {
                        const imageSrc = this.getRandomImage(itemData);
                        moneySourceHTML += `<div class="money-item source-money ${modeClass}" draggable="true" data-value="${value}" id="money-${value}-${globalIndex}">
                            <img src="${imageSrc}" alt="${itemData.name}" draggable="false" />
                            <div class="money-value">${itemData.name}</div>
                        </div>`;
                        globalIndex++;
                    }
                }
            });

            const totalMoney = Object.entries(coinCounts).reduce((sum, [denom, count]) => sum + parseInt(denom) * count, 0);
            Game.Debug.log('wallet', '💰 金錢生成: 生成完成，總金額:', totalMoney, '元，目標金額:', targetAmount, '元');

            return moneySourceHTML;
        },

        // 🆕 生成來源硬幣資料（只生成資料，不生成 HTML）
        generateSourceCoinsData(targetAmount, denominations) {
            const solution = this.findSolution(targetAmount, denominations);
            if (!solution) {
                // 無法生成解法，返回每種面額一個（包含圖片路徑）
                return denominations.map((value, index) => {
                    const itemData = this.getItemData(value);
                    const imageSrc = itemData ? this.getRandomImage(itemData) : '';
                    return {
                        id: `money-${value}-${index}`,
                        value: value,
                        imageSrc: imageSrc
                    };
                });
            }

            // 計算每種面額需要的數量
            const coinCounts = {};
            solution.forEach(coin => {
                coinCounts[coin] = (coinCounts[coin] || 0) + 1;
            });

            // 為每種面額添加額外的硬幣
            const MAX_COINS = 30; // 🔧 硬幣數量上限
            const extraCounts = {};
            denominations.forEach(denom => {
                if (!coinCounts[denom]) {
                    extraCounts[denom] = Math.floor(Math.random() * 2) + 1;
                } else {
                    extraCounts[denom] = Math.floor(Math.random() * 2);
                }
            });

            // 🔧 確保解法硬幣全部保留，額外硬幣只在有空間時添加
            let totalCoins = solution.length;
            denominations.forEach(denom => {
                const extra = extraCounts[denom] || 0;
                if (totalCoins + extra <= MAX_COINS) {
                    coinCounts[denom] = (coinCounts[denom] || 0) + extra;
                    totalCoins += extra;
                } else {
                    const allowed = Math.max(0, MAX_COINS - totalCoins);
                    coinCounts[denom] = (coinCounts[denom] || 0) + allowed;
                    totalCoins += allowed;
                }
            });

            // 生成硬幣資料陣列（包含固定的圖片路徑，避免重新渲染時圖片變化）
            const coins = [];
            let globalIndex = 0;

            // 🔧 按面額由大到小排序，確保大面額硬幣優先加入不被截斷
            const sortedDenominations = [...denominations].sort((a, b) => b - a);

            sortedDenominations.forEach(value => {
                if (coins.length >= MAX_COINS) return; // 🔧 已達上限，跳過

                const count = coinCounts[value] || 1;
                const itemData = this.getItemData(value);
                for (let i = 0; i < count && coins.length < MAX_COINS; i++) { // 🔧 加入上限檢查
                    // 每個硬幣在生成時就決定使用正面或反面圖片
                    const imageSrc = itemData ? this.getRandomImage(itemData) : '';
                    coins.push({
                        id: `money-${value}-${globalIndex}`,
                        value: value,
                        imageSrc: imageSrc
                    });
                    globalIndex++;
                }
            });

            if (coins.length >= MAX_COINS) {
                Game.Debug.log('wallet', `⚠️ sourceCoins: 已達到 ${MAX_COINS} 硬幣上限，停止生成`);
            }

            Game.Debug.log('wallet', '📊 sourceCoins: 生成來源硬幣資料:', coins);
            return coins;
        },

        // 🆕 根據狀態渲染來源硬幣 HTML（過濾已放置的硬幣）
        renderSourceCoinsHTML(modeClass) {
            const sourceCoins = this.state.gameState.sourceCoins || [];
            const droppedItems = this.state.gameState.droppedItems || [];
            const droppedIds = droppedItems.map(item => item ? item.id : null).filter(id => id !== null);

            let html = '';
            sourceCoins.forEach(coin => {
                // 過濾掉已放置在兌換區的硬幣
                if (!droppedIds.includes(coin.id)) {
                    const itemData = this.getItemData(coin.value);
                    if (itemData) {
                        // 🔧 [修正] 使用已儲存的圖片路徑，避免重新渲染時圖片變化
                        const imageSrc = coin.imageSrc || this.getRandomImage(itemData);
                        html += `<div class="money-item source-money ${modeClass}" draggable="true" data-value="${coin.value}" id="${coin.id}">
                            <img src="${imageSrc}" alt="${itemData.name}" draggable="false" />
                            <div class="money-value">${itemData.name}</div>
                        </div>`;
                    }
                }
            });

            Game.Debug.log('ui', '🎨 renderSourceCoins: 渲染來源硬幣，過濾已放置:', droppedIds.length, '個');
            return html;
        },

        // =====================================================
        // 事件監聯器分離系統（參考unit3.js架構）
        // =====================================================
        setupEasyModeEventListeners(question) {
            // 簡單模式專用的事件監聽器（防止重複綁定）
            const moneyItems = document.querySelectorAll('.unit4-easy-source-item');
            const droppedItems = document.querySelectorAll('.unit4-easy-dropped-item');
            const dropZone = document.querySelector('.unit4-easy-drop-zone');
            const moneySource = document.querySelector('.unit4-easy-money-source');

            // 🔧 [新增] 設置點擊事件處理 - 支援點擊放置功能
            this.setupClickEventListeners('easy');

            // 設置觸控拖拽支援
            this.setupTouchDragForEasyMode(question);

            // 直接為現有元素綁定事件（簡化方式）
            moneyItems.forEach(item => {
                // 為元素綁定事件監聯器
                const boundDragStart = this.handleDragStart.bind(this);
                const boundDragEnd = this.handleDragEnd.bind(this);

                Game.EventManager.on(item, 'dragstart', boundDragStart, {}, 'dragSystem');
                Game.EventManager.on(item, 'dragend', boundDragEnd, {}, 'dragSystem');

                Game.Debug.log('drag', '為金錢物件綁定拖曳事件:', item.dataset.value);
                Game.Debug.log('drag', '拖曳屬性:', item.draggable);
                Game.Debug.log('drag', '元素類別:', item.className);
                Game.Debug.log('drag', '元素HTML:', item.outerHTML);

                // 測試事件是否正確綁定
                Game.EventManager.on(item, 'mousedown', () => {
                    Game.Debug.log('event', 'mousedown 事件觸發 - 元素可互動');
                }, {}, 'gameUI');

                // 強制確認draggable屬性
                item.setAttribute('draggable', 'true');
            });
            
            // 不要為點亮的提示添加拖曳事件，只有源金錢才能拖曳
            // 點亮的圖示只是視覺顯示，不參與拖曳

            // 為放置區域添加拖放事件（簡化方式）
            if (dropZone) {
                // 創建綁定的函數引用
                const boundHandleDragOver = this.handleDragOver.bind(this);
                const boundHandleEasyModeDrop = (event) => this.handleEasyModeDrop(event, question);
                const boundHandleDragEnter = this.handleDragEnter.bind(this);
                const boundHandleDragLeave = this.handleDragLeave.bind(this);
                
                // 直接為元素綁定事件
                Game.EventManager.on(dropZone, 'dragover', boundHandleDragOver, {}, 'dragSystem');
                Game.EventManager.on(dropZone, 'drop', boundHandleEasyModeDrop, {}, 'dragSystem');
                Game.EventManager.on(dropZone, 'dragenter', boundHandleDragEnter, {}, 'dragSystem');
                Game.EventManager.on(dropZone, 'dragleave', boundHandleDragLeave, {}, 'dragSystem');

                Game.Debug.log('event', '為放置區域綁定拖放事件');
            }

            // 為金錢區域添加拖放事件（支援拖回）
            if (moneySource) {
                // 創建綁定的函數引用
                const boundHandleDragOver = this.handleDragOver.bind(this);
                const boundHandleDropBack = this.handleDropBack.bind(this);
                const boundHandleDragEnter = this.handleDragEnter.bind(this);
                const boundHandleDragLeave = this.handleDragLeave.bind(this);

                // 直接為元素綁定事件
                Game.EventManager.on(moneySource, 'dragover', boundHandleDragOver, {}, 'dragSystem');
                Game.EventManager.on(moneySource, 'drop', boundHandleDropBack, {}, 'dragSystem');
                Game.EventManager.on(moneySource, 'dragenter', boundHandleDragEnter, {}, 'dragSystem');
                Game.EventManager.on(moneySource, 'dragleave', boundHandleDragLeave, {}, 'dragSystem');

                Game.Debug.log('event', '為金錢源區域綁定拖回事件');
            }

            // 綁定按鈕事件
            const backToMenuBtn = document.querySelector('#back-to-menu-btn');
            if (backToMenuBtn) {
                Game.EventManager.on(backToMenuBtn, 'click', () => {
                    Game.showSettings();
                }, {}, 'gameUI');
            }
        },

        setupNormalModeEventListeners(question) {
            // 普通模式專用的事件監聽器
            const moneyItems = document.querySelectorAll('.unit4-normal-source-item');
            const droppedItems = document.querySelectorAll('.unit4-normal-dropped-item');
            const dropZone = document.querySelector('.unit4-normal-drop-zone');
            const moneySource = document.querySelector('.unit4-normal-money-source');
            const confirmBtn = document.getElementById('confirm-btn');

            // 🔧 [新增] 設置點擊事件處理 - 支援點擊放置功能
            this.setupClickEventListeners('normal');

            // 設置觸控拖拽支援
            this.setupTouchDragForNormalMode(question);

            // 為源金錢物件添加拖曳事件
            moneyItems.forEach(item => {
                Game.EventManager.on(item, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(item, 'dragend', this.handleDragEnd.bind(this), {}, 'dragSystem');
            });

            // 為拖曳到兌換區的金錢添加事件
            Game.Debug.log('event', `找到 ${droppedItems.length} 個兌換區金錢項目`);
            droppedItems.forEach((item, index) => {
                Game.Debug.log('event', `綁定兌換區金錢事件 ${index + 1}:`, item.id, item.dataset.value + '元');
                Game.EventManager.on(item, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(item, 'dragend', this.handleDragEnd.bind(this), {}, 'dragSystem');
            });

            // 為放置區域添加拖放事件
            if (dropZone) {
                Game.EventManager.on(dropZone, 'dragover', this.handleDragOver.bind(this), {}, 'dragSystem');
                Game.EventManager.on(dropZone, 'drop', (event) => this.handleNormalModeDrop(event, question), {}, 'dragSystem');
                Game.EventManager.on(dropZone, 'dragenter', this.handleDragEnter.bind(this), {}, 'dragSystem');
                Game.EventManager.on(dropZone, 'dragleave', this.handleDragLeave.bind(this), {}, 'dragSystem');
            }

            // 為金錢區域添加拖放事件（支援拖回）
            if (moneySource) {
                Game.EventManager.on(moneySource, 'dragover', this.handleDragOver.bind(this), {}, 'dragSystem');
                Game.EventManager.on(moneySource, 'drop', this.handleDropBack.bind(this), {}, 'dragSystem');
                Game.EventManager.on(moneySource, 'dragenter', this.handleDragEnter.bind(this), {}, 'dragSystem');
                Game.EventManager.on(moneySource, 'dragleave', this.handleDragLeave.bind(this), {}, 'dragSystem');
            }

            // 綁定確認按鈕事件
            if (confirmBtn) {
                Game.EventManager.on(confirmBtn, 'click', () => this.handleNormalModeConfirm(question), {}, 'gameUI');
            }

            // 🆕 [新增] 設置提示按鈕事件監聽器 (普通模式)
            const hintBtn = document.getElementById('hint-total-btn');
            if (hintBtn) {
                Game.EventManager.on(hintBtn, 'click', () => this.showNormalModeHint(), {}, 'gameUI');
            }

            // 綁定返回主選單按鈕事件
            const backToMenuBtn = document.querySelector('#back-to-menu-btn');
            if (backToMenuBtn) {
                Game.EventManager.on(backToMenuBtn, 'click', () => {
                    Game.showSettings();
                }, {}, 'gameUI');
            }
        },

        setupHardModeEventListeners(question) {
            // 困難模式專用的事件監聽器
            const moneyItems = document.querySelectorAll('.unit4-hard-source-item');
            const dropZone = document.querySelector('.unit4-hard-drop-zone');
            const moneySource = document.querySelector('.unit4-hard-money-source');

            // 🔧 [新增] 設置點擊事件處理 - 支援點擊放置功能
            this.setupClickEventListeners('hard');

            // 🆕 [新增] 設置提示按鈕事件監聽器
            const hintBtn = document.getElementById('hint-total-btn');
            if (hintBtn) {
                Game.EventManager.on(hintBtn, 'click', () => this.showHardModeHint(), {}, 'gameUI');
            }

            // 設置觸控拖拽支援
            this.setupTouchDragForHardMode(question);

            // 為每個金錢物件添加拖曳事件
            moneyItems.forEach(item => {
                Game.EventManager.on(item, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(item, 'dragend', this.handleDragEnd.bind(this), {}, 'dragSystem');
            });

            // 為兌換區中已存在的金錢添加拖曳事件（支援拖回）
            const droppedItems = document.querySelectorAll('.unit4-hard-dropped-item');
            Game.Debug.log('event', `找到 ${droppedItems.length} 個兌換區金錢項目`);
            droppedItems.forEach((item, index) => {
                Game.EventManager.on(item, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(item, 'dragend', this.handleDragEnd.bind(this), {}, 'dragSystem');
                Game.Debug.log('event', `綁定兌換區金錢事件 ${index + 1}: ${item.id} ${item.dataset.value}元`);
            });

            // 為放置區域添加拖放事件
            if (dropZone) {
                Game.EventManager.on(dropZone, 'dragover', this.handleDragOver.bind(this), {}, 'dragSystem');
                Game.EventManager.on(dropZone, 'drop', (event) => this.handleHardModeDrop(event, question), {}, 'dragSystem');
                Game.EventManager.on(dropZone, 'dragenter', this.handleDragEnter.bind(this), {}, 'dragSystem');
                Game.EventManager.on(dropZone, 'dragleave', this.handleDragLeave.bind(this), {}, 'dragSystem');
            }

            // 為金錢區域添加拖放事件（支援拖回）
            if (moneySource) {
                Game.EventManager.on(moneySource, 'dragover', this.handleDragOver.bind(this), {}, 'dragSystem');
                Game.EventManager.on(moneySource, 'drop', this.handleDropBack.bind(this), {}, 'dragSystem');
                Game.EventManager.on(moneySource, 'dragenter', this.handleDragEnter.bind(this), {}, 'dragSystem');
                Game.EventManager.on(moneySource, 'dragleave', this.handleDragLeave.bind(this), {}, 'dragSystem');
            }

            // 綁定按鈕事件
            const backToMenuBtn = document.querySelector('#back-to-menu-btn');
            if (backToMenuBtn) {
                Game.EventManager.on(backToMenuBtn, 'click', () => {
                    Game.showSettings();
                }, {}, 'gameUI');
            }

            const confirmBtn = document.querySelector('#confirm-btn');
            if (confirmBtn) {
                Game.EventManager.on(confirmBtn, 'click', () => this.handleHardModeConfirm(question), {}, 'gameUI');
            }
        },

        updateVisualHints() {
            const hintItems = document.querySelectorAll('.hint-item');
            const droppedItems = this.state.gameState.droppedItems;
            
            // 計算每種幣值的數量
            const droppedCounts = {};
            droppedItems.forEach(item => {
                droppedCounts[item.value] = (droppedCounts[item.value] || 0) + 1;
            });

            // 更新提示項目的顯示狀態
            const hintCounts = {};
            hintItems.forEach(hint => {
                const value = parseInt(hint.dataset.value);
                hintCounts[value] = (hintCounts[value] || 0) + 1;
                
                const filledCount = droppedCounts[value] || 0;
                const hintIndex = hintCounts[value] - 1;
                
                if (hintIndex < filledCount) {
                    hint.classList.add('filled');
                } else {
                    hint.classList.remove('filled');
                }
            });
        },

        // =====================================================
        // 拖曳處理分離系統（參考unit3.js架構）
        // =====================================================

        handleDragStart(event) {
            Game.Debug.log('drag', 'handleDragStart 被調用');
            Game.Debug.log('drag', 'event.target:', event.target);
            Game.Debug.log('drag', 'event.target.tagName:', event.target.tagName);

            const item = event.target.closest('.money-item');
            Game.Debug.log('drag', '拖曳項目:', item);
            Game.Debug.log('drag', '項目dataset:', item ? item.dataset : 'null');

            if (!item || !item.dataset.value) {
                Game.Debug.error('Invalid drag item or missing data-value');
                Game.Debug.error('請確認拖曳的是正確的元素');
                return;
            }

            const value = parseInt(item.dataset.value);
            if (isNaN(value)) {
                Game.Debug.error('Invalid value in dataset:', item.dataset.value);
                return;
            }
            
            const imageElement = item.querySelector('img'); // Get the image element
            const imageSrc = imageElement ? imageElement.src : ''; // Get its src

            // 更準確的來源判斷
            let fromZone = 'source'; // 默認為源區域
            if (item.closest('#drop-zone-area')) {
                fromZone = 'drop'; // 來自兌換區
            } else if (item.closest('#money-source-area')) {
                fromZone = 'source'; // 來自金錢區
            }

            const dragData = {
                value: value,
                id: item.id || `money-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                fromZone: fromZone,
                imageSrc: imageSrc // Add the image source
            };
            
            const jsonData = JSON.stringify(dragData);
            Game.Debug.log('drag', '設置拖曳數據:', jsonData);

            event.dataTransfer.setData('text/plain', jsonData);

            Game.Debug.log('drag', '開始拖曳:', value, '元');

            // 🆕 使用去背圖片作為拖曳預覽（僅顯示錢幣圖示，不含邊框與金額文字）
            if (imageElement) {
                const dragImg = imageElement.cloneNode(true);
                dragImg.style.width = imageElement.offsetWidth * 1.2 + 'px';
                dragImg.style.height = imageElement.offsetHeight * 1.2 + 'px';
                dragImg.style.position = 'absolute';
                dragImg.style.top = '-9999px';
                dragImg.style.left = '-9999px';
                document.body.appendChild(dragImg);
                if (event.dataTransfer && typeof event.dataTransfer.setDragImage === 'function') {
                    event.dataTransfer.setDragImage(dragImg, dragImg.offsetWidth / 2, dragImg.offsetHeight / 2);
                }
                Game.TimerManager.setTimeout(() => dragImg.remove(), 0, 'ui');
            }

            // 視覺效果
            item.style.opacity = '0.5';
            item.classList.add('dragging');
        },

        handleDragEnd(event) {
            const item = event.target;
            item.style.opacity = '1';
            item.classList.remove('dragging');
        },

        handleDragOver(event) {
            event.preventDefault(); // 允許放置
        },

        handleDragEnter(event) {
            event.preventDefault();
            if (event.target.classList.contains('drop-zone-container') || event.target.classList.contains('money-source-container')) {
                event.target.classList.add('drag-over');
            }
        },

        handleDragLeave(event) {
            if (event.target.classList.contains('drop-zone-container') || event.target.classList.contains('money-source-container')) {
                event.target.classList.remove('drag-over');
            }
        },

        // =====================================================
        // 簡單模式拖曳處理（完全獨立）
        // =====================================================
        handleEasyModeDrop(event, question) {
            event.preventDefault();
            const dropZone = event.currentTarget;
            dropZone.classList.remove('drag-over');

            // 防重複觸發機制
            if (this.isProcessingDrop) {
                Game.Debug.log('drag', '拖曳正在處理中，忽略重複事件');
                return;
            }
            this.isProcessingDrop = true;

            try {
                const rawData = event.dataTransfer.getData('text/plain');
                Game.Debug.log('drag', '原始拖曳數據:', rawData);

                if (!rawData || rawData.trim() === '') {
                    Game.Debug.error('拖曳數據為空');
                    return;
                }

                const data = JSON.parse(rawData);
                const { value, id, fromZone, imageSrc } = data;

                Game.Debug.log('drag', `=== 開始處理拖曳 ===`);
                Game.Debug.log('drag', `拖曳資料: value=${value}, id=${id}, fromZone=${fromZone}`);

                // 重新設計：找到與拖曳金錢匹配的淡化圖示位置
                const solution = this.findSolution(question.targetAmount, this.state.settings.denominations);
                if (!solution) {
                    this.audio.playErrorSound();
                    this.showMessage('無法找到解法！', 'error');
                    return;
                }
                
                // 確保droppedItems陣列存在且長度正確（避免重複初始化）
                if (!this.state.gameState.droppedItems || this.state.gameState.droppedItems.length !== solution.length) {
                    this.state.gameState.droppedItems = new Array(solution.length).fill(null);
                    Game.Debug.log('drag', 'handleEasyModeDrop重新初始化droppedItems:', this.state.gameState.droppedItems);
                }

                // 找到第一個匹配的淡化位置（還沒被點亮的）
                let targetPosition = -1;
                for (let i = 0; i < solution.length; i++) {
                    if (solution[i] === value && this.state.gameState.droppedItems[i] === null) {
                        targetPosition = i;
                        break;
                    }
                }

                Game.Debug.log('drag', `尋找 ${value}元的位置, 找到位置: ${targetPosition}`);
                Game.Debug.log('drag', `solution:`, solution);
                Game.Debug.log('drag', `目前droppedItems狀態:`, this.state.gameState.droppedItems);

                if (targetPosition === -1) {
                    this.audio.playErrorSound();
                    this.showMessage('沒有匹配的位置或已被佔據！', 'error');
                    Game.Debug.log('drag', `=== 拖曳失敗：沒有找到匹配位置 ===`);
                    return;
                }

                // 防止超過目標金額
                const { targetAmount } = question;
                const newTotal = this.state.gameState.currentTotal + value;
                
                if (newTotal > targetAmount) {
                    this.audio.playErrorSound();
                    this.showMessage('超過目標金額了！', 'error');
                    return;
                }

                // 播放拖曳音效
                this.audio.playDropSound();

                // 更新遊戲狀態：在指定位置記錄金錢
                this.state.gameState.currentTotal = newTotal;
                Game.Debug.log('drag', `拖曳前狀態:`, this.state.gameState.droppedItems);
                this.state.gameState.droppedItems[targetPosition] = { id, value, imageSrc };

                Game.Debug.log('drag', `點亮效果：位置 ${targetPosition} 點亮 (${value}元)，總額: ${newTotal}元`);
                Game.Debug.log('drag', '更新後狀態:', this.state.gameState.droppedItems);

                // 重新渲染整個遊戲畫面（從狀態重建，包含更新的總額）
                this.renderEasyMode(question);

                // 簡單模式專用：語音反饋（總額播報），完成後檢查答案
                Game.Debug.log('speech', `準備播報語音: 總共${newTotal}元`);
                Game.Debug.log('speech', `語音系統狀態: isReady=${this.speech.isReady}, voice=${this.speech.voice ? this.speech.voice.name : 'null'}`);
                // 🔧 [修正] 使用傳統中文貨幣格式
                const traditionalTotal = this.speech.convertToTraditionalCurrency(newTotal);
                this.speech.speak(`總共${traditionalTotal}`, {
                    callback: () => {
                        // 語音播放完畢後才檢查答案
                        this.checkEasyModeAutoAnswer(question);
                    }
                });
                Game.Debug.log('speech', `語音播報已調用`);

            } catch (error) {
                Game.Debug.error('簡單模式拖放處理錯誤:', error);
                if (error instanceof SyntaxError) {
                    Game.Debug.error('JSON解析失敗，拖曳數據可能未正確設置');
                    Game.Debug.error('請檢查handleDragStart是否正確執行');
                }
                // 播放錯誤音效
                this.audio.playErrorSound();
            } finally {
                // 重置處理標誌
                Game.TimerManager.setTimeout(() => {
                    this.isProcessingDrop = false;
                }, 100);
            }
        },

        // =====================================================
        // 普通模式拖曳處理（完全獨立）
        // =====================================================
        handleNormalModeDrop(event, question) {
            event.preventDefault();
            const dropZone = event.currentTarget;
            dropZone.classList.remove('drag-over');

            try {
                const data = JSON.parse(event.dataTransfer.getData('text/plain'));
                const { value, id, fromZone, imageSrc } = data;

                // 計算新的總額（允許超過目標金額）
                const { targetAmount } = question;
                const newTotal = this.state.gameState.currentTotal + value;

                // 播放拖曳音效
                this.audio.playDropSound();

                // 檢查是否已存在相同ID的項目（防止重複）
                const existingItem = this.state.gameState.droppedItems.find(item => item.id === id);
                if (existingItem) {
                    Game.Debug.log('drag', `物件 ${id} 已存在，跳過重複添加`);
                    return;
                }

                // 更新遊戲狀態（狀態驅動渲染）- 包含 imageSrc 以保持圖片一致性
                this.state.gameState.currentTotal = newTotal;
                this.state.gameState.droppedItems.push({ id, value, imageSrc });

                Game.Debug.log('drag', `普通模式拖曳：${value}元，總額: ${newTotal}元`);
                Game.Debug.log('drag', '更新後狀態:', this.state.gameState.droppedItems);

                // 重新渲染整個遊戲畫面（從狀態重建）
                this.renderNormalMode(question);

                // 普通模式專用：語音反饋（總額播報）
                // 🔧 [修正] 使用傳統中文貨幣格式，特別處理零元
                const traditionalTotal = newTotal === 0 ? '零元' : this.speech.convertToTraditionalCurrency(newTotal);
                this.speech.speak(`現在總共是${traditionalTotal}`);

            } catch (error) {
                Game.Debug.error('普通模式拖放處理錯誤:', error);
            }
        },

        // =====================================================
        // 困難模式拖曳處理（完全獨立）
        // =====================================================
        handleHardModeDrop(event, question) {
            event.preventDefault();
            const dropZone = event.currentTarget;
            dropZone.classList.remove('drag-over');

            try {
                const data = JSON.parse(event.dataTransfer.getData('text/plain'));
                const { value, id, fromZone, imageSrc } = data;

                // 檢查重複添加
                const existingItem = this.state.gameState.droppedItems.find(item => item.id === id);
                if (existingItem) {
                    Game.Debug.log('drag', `物件 ${id} 已存在，跳過重複添加`);
                    return;
                }

                // 計算新的總額（允許超過目標金額，但會有視覺提醒）
                const newTotal = this.state.gameState.currentTotal + value;

                // 播放拖曳音效
                this.audio.playDropSound();

                // 更新遊戲狀態 - 包含 imageSrc 以保持圖片一致性
                this.state.gameState.currentTotal = newTotal;
                this.state.gameState.droppedItems.push({ id, value, imageSrc });

                Game.Debug.log('drag', `困難模式拖曳：${value}元，總額: ${newTotal}元`);
                Game.Debug.log('drag', '更新後狀態:', this.state.gameState.droppedItems);

                // 重新渲染整個遊戲畫面（從狀態重建）
                this.renderHardMode(question);

                // 困難模式專用：無語音提示，無自動檢查

            } catch (error) {
                Game.Debug.error('困難模式拖放處理錯誤:', error);
            }
        },

        handleDropBack(event) {
            event.preventDefault();
            event.stopPropagation(); // 防止事件冒泡造成重複處理
            const sourceZone = event.currentTarget;
            sourceZone.classList.remove('drag-over');

            try {
                const data = JSON.parse(event.dataTransfer.getData('text/plain'));
                const { value, id, fromZone } = data;

                Game.Debug.log('drag', '拖回處理 - 接收到的資料:', data);
                Game.Debug.log('drag', 'fromZone:', fromZone, 'value:', value, 'id:', id);

                // 只處理從兌換區拖回的物件
                if (fromZone === 'drop') {
                    const difficulty = this.state.settings.difficulty;
                    let itemFound = false;

                    if (difficulty === 'easy') {
                        // 簡單模式：使用位置陣列
                        if (this.state.gameState.droppedItems) {
                            for (let i = 0; i < this.state.gameState.droppedItems.length; i++) {
                                const item = this.state.gameState.droppedItems[i];
                                if (item && item.value === value) {
                                    this.state.gameState.droppedItems[i] = null;
                                    itemFound = true;
                                    Game.Debug.log('drag', `簡單模式拖回成功：位置 ${i} 清空 (${value}元)`);
                                    break;
                                }
                            }
                        }
                    } else if (difficulty === 'normal' || difficulty === 'hard') {
                        // 普通/困難模式：使用對象陣列，根據ID移除
                        if (this.state.gameState.droppedItems) {
                            const originalLength = this.state.gameState.droppedItems.length;
                            this.state.gameState.droppedItems = this.state.gameState.droppedItems.filter(item => item.id !== id);
                            itemFound = this.state.gameState.droppedItems.length < originalLength;
                            if (itemFound) {
                                Game.Debug.log('drag', `${difficulty}模式拖回成功：移除ID ${id} (${value}元)`);
                            }
                        }
                    }

                    // 只有在實際找到並移除物件時才更新總額
                    if (itemFound) {
                        this.state.gameState.currentTotal -= value;
                        Game.Debug.log('drag', `總額更新：${this.state.gameState.currentTotal + value} -> ${this.state.gameState.currentTotal}元`);
                        
                        // 驗證總額是否與實際兌換區物件一致
                        this.validateCurrentTotal();
                        
                        // 播放拖回後的總額語音
                        const currentTotal = this.state.gameState.currentTotal;
                        if (this.speech && typeof this.speech.speak === 'function') {
                            // 🔧 [修正] 使用傳統中文貨幣格式，特別處理零元
                            const traditionalTotal = currentTotal === 0 ? '零元' : this.speech.convertToTraditionalCurrency(currentTotal);
                            this.speech.speak(`現在總共是${traditionalTotal}`, { interrupt: true });
                        }
                    } else {
                        Game.Debug.warn('drag', `拖回警告：物件 ${id} (${value}元) 在兌換區中未找到，總額不變`);
                    }
                    
                    // 總額顯示會在重新渲染時自動更新
                    
                    // 根據模式重新渲染
                    const currentQuestion = this.state.quiz.questions[this.state.quiz.currentQuestion - 1];
                    
                    if (difficulty === 'easy' && currentQuestion) {
                        this.renderEasyMode(currentQuestion);
                    } else if (difficulty === 'normal' && currentQuestion) {
                        this.renderNormalMode(currentQuestion);
                    } else if (difficulty === 'hard' && currentQuestion) {
                        this.renderHardMode(currentQuestion);
                    }
                }

            } catch (error) {
                Game.Debug.error('拖回處理錯誤:', error);
            }
        },

        // =====================================================
        // 煙火動畫系統
        // =====================================================
        startFullscreenFireworks(callback) {
            Game.Debug.log('ui', '開始全屏煙火動畫');
            
            // 立即清空遊戲容器，避免背景畫面閃現
            const gameContainer = document.getElementById('app');
            gameContainer.innerHTML = '';
            
            // 創建全屏煙火畫布
            const canvas = document.createElement('canvas');
            canvas.id = 'fullscreen-fireworks-canvas';
            canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 9999;
                background: linear-gradient(135deg, #1e3c72, #2a5298, #1a1a2e);
                pointer-events: none;
            `;
            document.body.appendChild(canvas);
            
            // 播放成功音效
            this.audio.playSuccessSound();
            
            // 🎆 啟動煙火動畫
            if (window.confetti) {
                Game.Debug.log('ui', '🎆 觸發canvas-confetti慶祝效果');
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                
                Game.TimerManager.setTimeout(() => {
                    confetti({
                        particleCount: 100,
                        spread: 60,
                        origin: { y: 0.7 }
                    });
                }, 300);
                
                Game.TimerManager.setTimeout(() => {
                    confetti({
                        particleCount: 80,
                        spread: 50,
                        origin: { y: 0.8 }
                    });
                }, 600);
            }
            
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const fireworks = [];
            let animationId;
            
            // 煙火和粒子類別（與原函數相同的實現）
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
                    this.particles.forEach(particle => {
                        particle.draw(ctx);
                    });
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
                    this.vy += 0.1; // 重力
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
                
                // 創建新煙火
                if (Math.random() < 0.3) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height * 0.6;
                    fireworks.push(new Firework(x, y));
                }
                
                // 更新和繪製煙火
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
            
            // 3秒後開始淡出並執行回調
            Game.TimerManager.setTimeout(() => {
                Game.Debug.log('ui', '煙火動畫開始淡出，準備顯示結果視窗');
                canvas.style.transition = 'opacity 1s';
                canvas.style.opacity = '0';

                // 1秒淡出後移除畫布並執行回調
                Game.TimerManager.setTimeout(() => {
                    cancelAnimationFrame(animationId);
                    document.body.removeChild(canvas);
                    Game.Debug.log('ui', '煙火動畫結束，執行回調');
                    if (callback) callback();
                }, 1000, 'ui');
            }, 3000);
        },

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
        },

        updateCurrentTotal() {
            const totalDisplay = document.querySelector('.current-total-display');
            const { currentTotal, targetAmount } = this.state.gameState;
            
            if (totalDisplay) {
                totalDisplay.textContent = `目前總額: ${currentTotal} 元`;
                
                // 視覺反饋
                if (currentTotal === targetAmount) {
                    totalDisplay.style.color = '#2ecc71'; // 綠色：正確
                    totalDisplay.style.fontWeight = 'bold';
                    totalDisplay.style.textShadow = '0 0 10px rgba(46, 204, 113, 0.5)';
                } else if (currentTotal > targetAmount * 0.8) {
                    totalDisplay.style.color = '#f1c40f'; // 黃色：接近
                    totalDisplay.style.fontWeight = 'normal';
                    totalDisplay.style.textShadow = 'none';
                } else {
                    totalDisplay.style.color = '#ffffff'; // 白色：正常
                    totalDisplay.style.fontWeight = 'normal';
                    totalDisplay.style.textShadow = 'none';
                }
                
                Game.Debug.log('payment', `總額更新: ${currentTotal}/${targetAmount} 元`);
            }
        },

        // 驗證總額是否與實際兌換區物件一致
        validateCurrentTotal() {
            if (!this.state.gameState.droppedItems) {
                return;
            }

            let actualTotal = 0;
            this.state.gameState.droppedItems.forEach(item => {
                if (item && item.value) {
                    actualTotal += item.value;
                }
            });

            // 如果總額不一致，修正它
            if (this.state.gameState.currentTotal !== actualTotal) {
                Game.Debug.log('payment', `總額不一致修正：${this.state.gameState.currentTotal} -> ${actualTotal}元`);
                this.state.gameState.currentTotal = actualTotal;
            }
        },

        // 語音反饋系統已經被分離到各模式的拖曳處理函數中

        checkEasyModeAutoAnswer(question) {
            const { currentTotal, targetAmount } = this.state.gameState;
            if (currentTotal === targetAmount) {
                this.handleEasyModeCorrectAnswer(question);
            }
        },

        // =====================================================
        // 簡單模式答對處理（完全獨立）
        // =====================================================
        handleEasyModeCorrectAnswer(question) {
            // 防止重複計分
            if (this.state.gameState.questionAnswered) {
                Game.Debug.log('judge', '簡單模式：題目已答對，防止重複計分');
                return;
            }
            this.state.gameState.questionAnswered = true;

            const { targetAmount } = this.state.gameState;

            // 播放成功音效
            this.audio.playSuccessSound();

            // 更新分數
            this.state.quiz.score += 10;

            // 顯示成功訊息
            this.showMessage('恭喜答對了！', 'success');

            Game.Debug.log('judge', `簡單模式答對：目前總分 ${this.state.quiz.score} 分`);

            // 播放語音，並在語音結束後進入下一題
            // 🔧 [修正] 使用傳統中文貨幣格式
            const traditionalAmount = this.speech.convertToTraditionalCurrency(targetAmount);
            // 判斷是否為最後一題
            const isLastQuestion = this.state.gameState.questionIndex + 1 >= this.state.quiz.totalQuestions;
            const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
            this.speech.speak(`恭喜你答對了，總共是${traditionalAmount}，${endingText}`, {
                callback: () => Game.TimerManager.setTimeout(() => this.nextQuestion(), 500, 'question')
            });
        },

        // =====================================================
        // 普通模式確認處理（完全獨立）
        // =====================================================
        handleNormalModeConfirm(question) {
            // 🔧 [防連點] 檢查按鈕是否已禁用
            const confirmBtn = document.getElementById('confirm-btn');
            if (confirmBtn?.disabled) {
                Game.Debug.log('event', '防抖：handleNormalModeConfirm 忽略重複點擊（按鈕已禁用）');
                return;
            }
            if (confirmBtn) confirmBtn.disabled = true;

            const { currentTotal } = this.state.gameState;
            const { targetAmount } = question;

            // 🆕 點擊完成按鈕時，顯示目前總額
            const totalDisplay = document.getElementById('current-total-display');
            if (totalDisplay) {
                totalDisplay.style.display = 'block';
                totalDisplay.textContent = `目前總額: ${currentTotal} 元`;
            }

            if (currentTotal === targetAmount) {
                // 防止重複計分
                if (this.state.gameState.questionAnswered) {
                    Game.Debug.log('judge', '普通模式：題目已答對，防止重複計分');
                    return;
                }
                this.state.gameState.questionAnswered = true;

                // 答對處理：先播放音效，再播放語音
                this.audio.playSuccessSound();
                this.state.quiz.score += 10;
                this.showMessage('恭喜答對了！', 'success');

                Game.Debug.log('judge', `普通模式答對：目前總分 ${this.state.quiz.score} 分`);

                // 語音播報答對結果，並在語音結束後進入下一題
                // 🔧 [修正] 使用傳統中文貨幣格式
                const traditionalAmount = this.speech.convertToTraditionalCurrency(targetAmount);
                // 判斷是否為最後一題
                const isLastQuestion = this.state.gameState.questionIndex + 1 >= this.state.quiz.totalQuestions;
                const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                this.speech.speak(`恭喜你答對了，總共是${traditionalAmount}，${endingText}`, {
                    callback: () => Game.TimerManager.setTimeout(() => this.nextQuestion(), 500, 'question')
                });
            } else {
                // 答錯處理
                this.handleNormalModeIncorrectAnswer(question);
            }
        },

        // =====================================================
        // 困難模式確認處理（完全獨立）
        // =====================================================
        handleHardModeConfirm(question) {
            // 🔧 [防連點] 檢查按鈕是否已禁用
            const confirmBtn = document.getElementById('confirm-btn');
            if (confirmBtn?.disabled) {
                Game.Debug.log('event', '防抖：handleHardModeConfirm 忽略重複點擊（按鈕已禁用）');
                return;
            }
            if (confirmBtn) confirmBtn.disabled = true;

            const { currentTotal, targetAmount } = this.state.gameState;

            // 🆕 點擊完成按鈕時，顯示目前總額
            const totalDisplay = document.getElementById('current-total-display');
            if (totalDisplay) {
                totalDisplay.style.display = 'block';
                totalDisplay.textContent = `目前總額: ${currentTotal} 元`;
            }

            if (currentTotal === targetAmount) {
                // 防止重複計分
                if (this.state.gameState.questionAnswered) {
                    Game.Debug.log('judge', '困難模式：題目已答對，防止重複計分');
                    return;
                }
                this.state.gameState.questionAnswered = true;

                // 答對處理：先播放音效，再語音播報
                this.audio.playSuccessSound();
                this.state.quiz.score += 10;
                this.showMessage('恭喜答對了！', 'success');

                Game.Debug.log('judge', `困難模式答對：目前總分 ${this.state.quiz.score} 分`);

                // 語音播報答對結果，並在語音結束後進入下一題
                // 🔧 [修正] 使用傳統中文貨幣格式
                const traditionalAmount = this.speech.convertToTraditionalCurrency(targetAmount);
                // 判斷是否為最後一題
                const isLastQuestion = this.state.gameState.questionIndex + 1 >= this.state.quiz.totalQuestions;
                const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                this.speech.speak(`恭喜你答對了，總共是${traditionalAmount}，${endingText}`, {
                    callback: () => Game.TimerManager.setTimeout(() => this.nextQuestion(), 500, 'question')
                });
            } else {
                // 答錯處理
                this.handleHardModeIncorrectAnswer(question);
            }
        },

        nextQuestion() {
            // 🔧 [新增] 防重複題目機制：記錄當前完成題目的目標金額
            const currentQuestion = this.state.quiz.questions[this.state.gameState.questionIndex];
            if (currentQuestion) {
                this.state.lastTargetAmount = currentQuestion.targetAmount;
                Game.Debug.log('question', '🎯 防重複: 記錄已完成題目目標金額:', this.state.lastTargetAmount);
            }

            // 防止重複調用
            if (this.state.loadingQuestion) {
                Game.Debug.log('question', '正在載入題目中，忽略重複調用');
                return;
            }
            
            const nextIndex = this.state.gameState.questionIndex + 1;
            this.loadQuestion(nextIndex);
        },

        // 舊的函數已經被分離為handleNormalModeConfirm和handleHardModeConfirm

        // =====================================================
        // 普通模式答錯處理（完全獨立）
        // =====================================================
        handleNormalModeIncorrectAnswer(question) {
            this.audio.playErrorSound();

            const { mode } = this.state.settings;

            if (mode === 'proceed') {
                // 單次測驗：答錯也進入下一題（0分）
                this.showMessage('答案不正確！0分', 'error');
                // 判斷是否為最後一題
                const isLastQuestion = this.state.gameState.questionIndex + 1 >= this.state.quiz.totalQuestions;
                const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                this.speech.speak(`對不起你答錯了，${endingText}`, {
                    callback: () => Game.TimerManager.setTimeout(() => this.nextQuestion(), 500, 'question')
                });
            } else {
                this.speech.speak('對不起，你答錯了，請再試一次');
                // 重複測驗：答錯重試
                this.showMessage('答案不正確，請再試一次！', 'error');
                // 普通模式：答錯時清空兌換區
                this.clearNormalModeDropZone();
            }
        },

        // =====================================================
        // 困難模式答錯處理（完全獨立）
        // =====================================================
        handleHardModeIncorrectAnswer(question) {
            this.audio.playErrorSound();

            const { mode } = this.state.settings;

            if (mode === 'proceed') {
                // 單次測驗：答錯也進入下一題（0分）
                this.showMessage('答案不正確！0分', 'error');
                // 判斷是否為最後一題
                const isLastQuestion = this.state.gameState.questionIndex + 1 >= this.state.quiz.totalQuestions;
                const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                this.speech.speak(`對不起你答錯了，${endingText}`, {
                    callback: () => Game.TimerManager.setTimeout(() => this.nextQuestion(), 500, 'question')
                });
            } else {
                // 🔧 [修正] 困難模式答錯時播放簡單語音提示（同普通模式）
                this.speech.speak('對不起，你答錯了，請再試一次');
                // 重複測驗：答錯重試
                this.showMessage('答案不正確，請再試一次！', 'error');
                // 困難模式：答錯時清空兌換區
                this.clearHardModeDropZone();
            }
        },

        // =====================================================
        // 清空處理分離系統（參考unit3.js架構）
        // =====================================================
        clearEasyModeDropZone() {
            // 重置遊戲狀態（狀態驅動渲染）
            this.state.gameState.currentTotal = 0;
            this.state.gameState.droppedItems = [];

            Game.Debug.log('state', '清空簡單模式狀態，重新渲染');

            // 重新渲染整個遊戲畫面
            const currentQuestion = this.state.quiz.questions[this.state.quiz.currentQuestion - 1];
            if (currentQuestion) {
                this.renderEasyMode(currentQuestion);
            }
        },

        clearNormalModeDropZone() {
            // 普通模式專用：清空兌換區（狀態驅動渲染）
            // 重置遊戲狀態
            this.state.gameState.currentTotal = 0;
            this.state.gameState.droppedItems = [];

            Game.Debug.log('state', '普通模式清空兌換區，重置狀態');

            // 重新渲染整個畫面
            const currentQuestion = this.state.quiz.questions[this.state.quiz.currentQuestion - 1];
            if (currentQuestion) {
                this.renderNormalMode(currentQuestion);
            }
        },

        clearHardModeDropZone() {
            // 困難模式專用：清空兌換區（狀態驅動）
            Game.Debug.log('state', '清空困難模式狀態，重新渲染');

            // 重置遊戲狀態
            this.state.gameState.currentTotal = 0;
            this.state.gameState.droppedItems = [];

            // 重新渲染整個遊戲畫面
            const currentQuestion = this.state.quiz.questions[this.state.quiz.currentQuestion - 1];
            if (currentQuestion) {
                this.renderHardMode(currentQuestion);
            }
        },

        // 🆕 顯示困難模式提示（顯示綠色打勾提示正確答案，提示持續至題目完成）
        showHardModeHint() {
            Game.Debug.log('hint', '💡 困難模式: 顯示提示');

            const currentQuestion = this.state.quiz.questions[this.state.quiz.currentQuestion - 1];
            if (!currentQuestion) {
                Game.Debug.error('💡 困難模式: 無法取得當前題目');
                return;
            }

            const targetAmount = currentQuestion.targetAmount;

            // 退回兌換區所有金錢，從頭計算完整解法
            this.state.gameState.droppedItems = [];
            this.state.gameState.currentTotal = 0;

            const sourceCoins = this.state.gameState.sourceCoins || [];
            const solution = this.findSolutionFromAvailableCoins(targetAmount, sourceCoins);

            Game.Debug.log('hint', `💡 困難模式: 目標 ${targetAmount}元, sourceCoins: ${sourceCoins.length}個, 解法:`, solution ? solution.map(c => c.value + '元') : '找不到');

            if (solution && solution.length > 0) {
                // 儲存提示幣 ID（跨重繪持久）
                this.state.gameState.hintedCoinIds = solution.map(c => c.id);

                // 重新渲染（renderHardMode 末尾自動呼叫 applyHintMarkings）
                this.renderHardMode(currentQuestion);

                // 播放語音提示
                if (this.speech && typeof this.speech.speak === 'function') {
                    this.speech.speak('請依提示拿出正確的金額', { interrupt: true });
                    Game.Debug.log('speech', '🗣️ 困難模式: 播放語音: "請依提示拿出正確的金額"');
                }
            } else {
                if (this.speech && typeof this.speech.speak === 'function') {
                    this.speech.speak('請拿出正確的金額', { interrupt: true });
                }
            }
        },

        // 🆕 從可用的金錢中找出達到目標金額的解法
        findSolutionFromAvailableCoins(targetAmount, availableCoins) {
            if (targetAmount <= 0) return [];

            // 按面額從大到小排序
            const sortedCoins = [...availableCoins].sort((a, b) => b.value - a.value);

            const solution = [];
            let remaining = targetAmount;
            const usedIds = new Set();

            for (const coin of sortedCoins) {
                if (remaining <= 0) break;
                if (usedIds.has(coin.id)) continue;

                if (coin.value <= remaining) {
                    solution.push(coin);
                    usedIds.add(coin.id);
                    remaining -= coin.value;
                    Game.Debug.log('hint', `💡 解法: 選取 ${coin.id} (${coin.value}元), 剩餘 ${remaining}元`);
                }
            }

            if (remaining === 0) {
                return solution;
            } else {
                Game.Debug.log('hint', `💡 解法: 無法找到完美解法，剩餘 ${remaining}元`);
                return null;
            }
        },

        // 將提示標記套用至 DOM（跨重繪持久化）
        applyHintMarkings(mode) {
            const hintedCoinIds = this.state.gameState && this.state.gameState.hintedCoinIds;
            if (!hintedCoinIds || hintedCoinIds.length === 0) return;

            hintedCoinIds.forEach(coinId => {
                const coinElement = document.getElementById(coinId);
                if (!coinElement) return;

                coinElement.classList.add('hint-highlighted');
                coinElement.style.position = 'relative';

                // 避免重複插入 checkmark
                if (!coinElement.querySelector('.hint-checkmark')) {
                    const checkmark = document.createElement('div');
                    checkmark.className = 'hint-checkmark';
                    checkmark.innerHTML = '✓';
                    checkmark.style.cssText = `
                        position: absolute;
                        top: 5px;
                        right: 5px;
                        width: 24px;
                        height: 24px;
                        background-color: #4CAF50;
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        font-weight: bold;
                        z-index: 10;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    `;
                    coinElement.appendChild(checkmark);
                }
                Game.Debug.log('hint', `✅ applyHintMarkings(${mode}): 標記 ${coinId}`);
            });
        },

        // 🆕 顯示普通模式提示（顯示綠色打勾提示正確答案，提示持續至題目完成）
        showNormalModeHint() {
            Game.Debug.log('hint', '💡 普通模式: 顯示提示');

            const currentQuestion = this.state.quiz.questions[this.state.quiz.currentQuestion - 1];
            if (!currentQuestion) {
                Game.Debug.error('💡 普通模式: 無法取得當前題目');
                return;
            }

            const targetAmount = currentQuestion.targetAmount;

            // 退回兌換區所有金錢，從頭計算完整解法
            this.state.gameState.droppedItems = [];
            this.state.gameState.currentTotal = 0;

            const sourceCoins = this.state.gameState.sourceCoins || [];
            const solution = this.findSolutionFromAvailableCoins(targetAmount, sourceCoins);

            Game.Debug.log('hint', `💡 普通模式: 目標 ${targetAmount}元, sourceCoins: ${sourceCoins.length}個, 解法:`, solution ? solution.map(c => c.value + '元') : '找不到');

            if (solution && solution.length > 0) {
                // 儲存提示幣 ID（跨重繪持久）
                this.state.gameState.hintedCoinIds = solution.map(c => c.id);

                // 重新渲染（renderNormalMode 末尾自動呼叫 applyHintMarkings）
                this.renderNormalMode(currentQuestion);

                // 播放語音提示
                if (this.speech && typeof this.speech.speak === 'function') {
                    this.speech.speak('請依提示拿出正確的金額', { interrupt: true });
                    Game.Debug.log('speech', '🗣️ [普通模式] 播放語音: "請依提示拿出正確的金額"');
                }
            } else {
                if (this.speech && typeof this.speech.speak === 'function') {
                    this.speech.speak('請拿出正確的金額', { interrupt: true });
                }
            }
        },

        showMessage(text, type) {
            // 移除先前的訊息，避免堆疊
            document.querySelectorAll('.game-message').forEach(el => el.remove());

            const message = document.createElement('div');
            message.className = `game-message message ${type}`;
            message.textContent = text;
            message.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
                color: white;
                padding: 20px;
                border-radius: 10px;
                font-size: 1.2em;
                z-index: 1000;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            `;
            
            document.body.appendChild(message);
            
            Game.TimerManager.setTimeout(() => {
                document.body.removeChild(message);
            }, 2000);
        },

        // =====================================================
        // 語音播報測驗結果
        // =====================================================
        speakResults(score, totalQuestions, percentage) {
            const correctAnswers = score / 10;
            let performanceText = '';
            
            // 根據百分比確定表現評價
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
            Game.Debug.log('speech', '語音播報:', speechText);

            // 使用已有的語音系統播報
            this.speech.speak(speechText, { interrupt: true });
        },

        showResults() {
            // 防止重複呼叫（事件監聽器累積時可能觸發多次）
            if (this.state.gameCompleted) {
                Game.Debug.log('state', '⚠️ showResults 已執行過，忽略重複呼叫');
                return;
            }
            this.state.gameCompleted = true;
            AssistClick.deactivate();

            const { score, totalQuestions } = this.state.quiz;
            const percentage = Math.round((score / 10 / totalQuestions) * 100);

            // 直接顯示結果視窗（測驗總結畫面自帶煙火動畫）
            this.displayResultsWindow();

            // 1秒後開始語音播報
            Game.TimerManager.setTimeout(() => {
                this.speakResults(score, totalQuestions, percentage);
            }, 1000);
        },

        displayResultsWindow() {
            const gameContainer = document.getElementById('app');
            const { score, totalQuestions, startTime } = this.state.quiz;

            const correctAnswers = score / 10;
            const percentage = Math.round((correctAnswers / totalQuestions) * 100);

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
                                <div class="achievement-item">🎯 學會選擇正確金額付款</div>
                                <div class="achievement-item">💰 掌握剛好付款技巧</div>
                                <div class="achievement-item">📝 練習湊整付款方式</div>
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
        // 觸控拖拽支援函數
        // =====================================================
        setupTouchDragForEasyMode(question) {
            Game.Debug.log('touch', '🎯 檢查 TouchDragUtility 狀態 (簡單模式)', {
                touchUtilityExists: !!window.TouchDragUtility,
                touchUtilityType: typeof window.TouchDragUtility
            });

            if (!window.TouchDragUtility) {
                Game.Debug.error('TouchDragUtility 未載入，觸控拖曳功能無法使用');
                return;
            }

            const gameArea = document.getElementById('app');
            if (!gameArea) return;

            Game.Debug.log('touch', '✅ TouchDragUtility 已載入，開始註冊觸控拖曳 (簡單模式)');

            // 🔧 [手機端修復] 延遲註冊以確保HTML元素已生成 - 簡單模式
            const registerTouchDrag = () => {
                // 檢查元素是否已存在
                const sourceItems = gameArea.querySelectorAll('.unit4-easy-source-item');
                if (sourceItems.length === 0) {
                    Game.Debug.log('touch', '⏰ [簡單模式] 等待元素生成，延遲重試TouchDragUtility註冊...');
                    Game.TimerManager.setTimeout(registerTouchDrag, 100, 'drag');
                    return;
                }

                Game.Debug.log('touch', `✅ [簡單模式] 找到 ${sourceItems.length} 個可拖拽元素，開始註冊TouchDragUtility`);
                
                // 註冊可拖拽元素（簡單模式）
                window.TouchDragUtility.registerDraggable(
                    gameArea,
                    '.money-item, .unit4-easy-source-item, [draggable="true"]',
                {
                    onDragStart: (element, event) => {
                        const syntheticEvent = {
                            target: element,
                            preventDefault: () => {},
                            dataTransfer: { setData: () => {}, getData: () => '', effectAllowed: 'move' }
                        };
                        this.handleDragStart(syntheticEvent);
                        return true;
                    },
                    onDrop: (draggedElement, dropZone, event) => {
                        // 新增：C4簡單模式專用放置框檢測
                        const itemInfo = {
                            coinValue: draggedElement.dataset.value,
                            denomination: draggedElement.dataset.denomination,
                            itemClass: draggedElement.className,
                            dropZoneClass: dropZone.className,
                            difficulty: 'easy'
                        };
                        
                        if (dropZone.classList.contains('drop-zone-container')) {
                            Game.Debug.logPlacementDrop('手機端：錢幣放入放置區', 'drop-zone-container', itemInfo);
                        } else if (dropZone.classList.contains('money-source-container') || dropZone.classList.contains('source-area')) {
                            Game.Debug.logPlacementDrop('手機端：錢幣返回來源區', 'money-source-container', itemInfo);
                        } else {
                            Game.Debug.logPlacementDrop('手機端：錢幣放入未知區域', 'unknown', itemInfo);
                        }
                        
                        Game.Debug.logMobileDrag('簡單模式觸控放置', draggedElement, event, itemInfo);
                        
                        // 🔧 [修復破圖問題] 從被拖拽元素中獲取圖片信息
                        const imgElement = draggedElement.querySelector('img');
                        const imageSrc = imgElement ? imgElement.src : '';
                        
                        const syntheticDropEvent = {
                            target: dropZone,
                            currentTarget: dropZone,
                            preventDefault: () => {},
                            stopPropagation: () => {},
                            dataTransfer: { 
                                getData: () => JSON.stringify({
                                    value: parseInt(draggedElement.dataset.value),
                                    id: draggedElement.id,
                                    fromZone: 'source',
                                    imageSrc: imageSrc  // ✅ 添加圖片信息
                                })
                            }
                        };
                        this.handleEasyModeDrop(syntheticDropEvent, question);
                    },
                    onDragEnd: (element, event) => {
                        const syntheticEvent = { target: element, preventDefault: () => {} };
                        this.handleDragEnd(syntheticEvent);
                    }
                }
                );

                // 註冊放置區域
                const dropZone = gameArea.querySelector('.unit4-easy-drop-zone');
                const moneySource = gameArea.querySelector('.unit4-easy-money-source');
                
                if (dropZone) {
                    window.TouchDragUtility.registerDropZone(dropZone, () => true);
                    Game.Debug.log('touch', '✅ [簡單模式] 放置區域已註冊');
                }
                if (moneySource) {
                    window.TouchDragUtility.registerDropZone(moneySource, () => true);
                    Game.Debug.log('touch', '✅ [簡單模式] 金錢來源區域已註冊');
                }
            };
            
            // 🚀 [手機端修復] 啟動延遲註冊 - 簡單模式
            registerTouchDrag();
        },

        setupTouchDragForNormalMode(question) {
            if (!window.TouchDragUtility) return;
            
            const gameArea = document.getElementById('app');
            if (!gameArea) return;

            // 🔧 [手機端修復] 延遲註冊以確保HTML元素已生成
            const registerTouchDrag = () => {
                // 檢查元素是否已存在
                const sourceItems = gameArea.querySelectorAll('.unit4-normal-source-item');
                if (sourceItems.length === 0) {
                    Game.Debug.log('touch', '⏰ 等待元素生成，延遲重試TouchDragUtility註冊...');
                    Game.TimerManager.setTimeout(registerTouchDrag, 100, 'drag');
                    return;
                }

                Game.Debug.log('touch', `✅ 找到 ${sourceItems.length} 個可拖拽元素，開始註冊TouchDragUtility`);
                
                // 註冊可拖拽元素（普通模式）
                window.TouchDragUtility.registerDraggable(
                    gameArea,
                    '.money-item, .unit4-normal-source-item, .unit4-normal-dropped-item, [draggable="true"]',
                {
                    onDragStart: (element, event) => {
                        const syntheticEvent = {
                            target: element,
                            preventDefault: () => {},
                            dataTransfer: { setData: () => {}, getData: () => '', effectAllowed: 'move' }
                        };
                        this.handleDragStart(syntheticEvent);
                        return true;
                    },
                    onDrop: (draggedElement, dropZone, event) => {
                        // 新增：C4普通模式專用放置框檢測
                        const itemInfo = {
                            coinValue: draggedElement.dataset.value,
                            denomination: draggedElement.dataset.denomination,
                            itemClass: draggedElement.className,
                            dropZoneClass: dropZone.className,
                            difficulty: 'normal'
                        };
                        
                        if (dropZone.classList.contains('drop-zone-container')) {
                            Game.Debug.logPlacementDrop('手機端：錢幣放入放置區', 'drop-zone-container', itemInfo);
                        } else if (dropZone.classList.contains('money-source-container') || dropZone.classList.contains('source-area')) {
                            Game.Debug.logPlacementDrop('手機端：錢幣返回來源區', 'money-source-container', itemInfo);
                        } else {
                            Game.Debug.logPlacementDrop('手機端：錢幣放入未知區域', 'unknown', itemInfo);
                        }
                        
                        Game.Debug.logMobileDrag('普通模式觸控放置', draggedElement, event, itemInfo);

                        Game.Debug.log('touch', '🎯 普通模式放置事件', {
                            draggedElement: draggedElement.className,
                            draggedElementId: draggedElement.id,
                            dropZone: dropZone.className,
                            value: draggedElement.dataset.value
                        });
                        
                        // 🔧 [修復破圖問題] 從被拖拽元素中獲取圖片信息
                        const imgElement = draggedElement.querySelector('img');
                        const imageSrc = imgElement ? imgElement.src : '';
                        
                        const syntheticDropEvent = {
                            target: dropZone,
                            currentTarget: dropZone,
                            preventDefault: () => {},
                            stopPropagation: () => {},
                            dataTransfer: { 
                                getData: () => {
                                    const dropData = JSON.stringify({
                                        value: parseInt(draggedElement.dataset.value),
                                        id: draggedElement.id || `touch-drop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                        fromZone: draggedElement.classList.contains('unit4-normal-dropped-item') ? 'drop' : 'source',
                                        imageSrc: imageSrc  // ✅ 添加圖片信息
                                    });
                                    Game.Debug.log('touch', '🎯 生成拖拽資料:', dropData);
                                    return dropData;
                                }
                            },
                            syntheticTouchDrop: true
                        };
                        
                        if (dropZone.closest('.unit4-normal-drop-zone')) {
                            this.handleNormalModeDrop(syntheticDropEvent, question);
                        } else if (dropZone.closest('.unit4-normal-money-source')) {
                            this.handleDropBack(syntheticDropEvent);
                        }
                    },
                    onDragEnd: (element, event) => {
                        const syntheticEvent = { target: element, preventDefault: () => {} };
                        this.handleDragEnd(syntheticEvent);
                    }
                }
                );

                // 註冊放置區域
                const dropZone = gameArea.querySelector('.unit4-normal-drop-zone');
                const moneySource = gameArea.querySelector('.unit4-normal-money-source');
                
                if (dropZone) {
                    window.TouchDragUtility.registerDropZone(dropZone, () => true);
                    Game.Debug.log('touch', '✅ [普通模式] 放置區域已註冊');
                }
                if (moneySource) {
                    window.TouchDragUtility.registerDropZone(moneySource, () => true);
                    Game.Debug.log('touch', '✅ [普通模式] 金錢來源區域已註冊');
                }
            };

            // 🚀 [手機端修復] 啟動延遲註冊
            registerTouchDrag();
        },

        setupTouchDragForHardMode(question) {
            if (!window.TouchDragUtility) return;

            const gameArea = document.getElementById('app');
            if (!gameArea) return;

            // 🔧 [手機端修復] 延遲註冊以確保HTML元素已生成 - 困難模式
            const registerTouchDrag = () => {
                // 檢查元素是否已存在
                const sourceItems = gameArea.querySelectorAll('.unit4-hard-source-item');
                if (sourceItems.length === 0) {
                    Game.Debug.log('touch', '⏰ [困難模式] 等待元素生成，延遲重試TouchDragUtility註冊...');
                    Game.TimerManager.setTimeout(registerTouchDrag, 100, 'drag');
                    return;
                }

                Game.Debug.log('touch', `✅ [困難模式] 找到 ${sourceItems.length} 個可拖拽元素，開始註冊TouchDragUtility`);
                
                // 註冊可拖拽元素（困難模式）
                window.TouchDragUtility.registerDraggable(
                    gameArea,
                    '.money-item, .unit4-hard-source-item, .unit4-hard-dropped-item, [draggable="true"]',
                {
                    onDragStart: (element, event) => {
                        const syntheticEvent = {
                            target: element,
                            preventDefault: () => {},
                            dataTransfer: { setData: () => {}, getData: () => '', effectAllowed: 'move' }
                        };
                        this.handleDragStart(syntheticEvent);
                        return true;
                    },
                    onDrop: (draggedElement, dropZone, event) => {
                        // 新增：C4困難模式專用放置框檢測
                        const itemInfo = {
                            coinValue: draggedElement.dataset.value,
                            denomination: draggedElement.dataset.denomination,
                            itemClass: draggedElement.className,
                            dropZoneClass: dropZone.className,
                            difficulty: 'hard'
                        };
                        
                        if (dropZone.classList.contains('drop-zone-container')) {
                            Game.Debug.logPlacementDrop('手機端：錢幣放入放置區', 'drop-zone-container', itemInfo);
                        } else if (dropZone.classList.contains('money-source-container') || dropZone.classList.contains('source-area')) {
                            Game.Debug.logPlacementDrop('手機端：錢幣返回來源區', 'money-source-container', itemInfo);
                        } else {
                            Game.Debug.logPlacementDrop('手機端：錢幣放入未知區域', 'unknown', itemInfo);
                        }
                        
                        Game.Debug.logMobileDrag('困難模式觸控放置', draggedElement, event, itemInfo);
                        
                        // 🔧 [修復破圖問題] 從被拖拽元素中獲取圖片信息
                        const imgElement = draggedElement.querySelector('img');
                        const imageSrc = imgElement ? imgElement.src : '';
                        
                        const syntheticDropEvent = {
                            target: dropZone,
                            currentTarget: dropZone,
                            preventDefault: () => {},
                            stopPropagation: () => {},
                            dataTransfer: { 
                                getData: () => JSON.stringify({
                                    value: parseInt(draggedElement.dataset.value),
                                    id: draggedElement.id || `touch-hard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,  // 🔧 [修復困难模式ID重复] 确保唯一ID
                                    fromZone: draggedElement.classList.contains('unit4-hard-dropped-item') ? 'drop' : 'source',
                                    imageSrc: imageSrc  // ✅ 添加圖片信息
                                })
                            }
                        };
                        
                        if (dropZone.closest('.unit4-hard-drop-zone')) {
                            this.handleHardModeDrop(syntheticDropEvent, question);
                        } else if (dropZone.closest('.unit4-hard-money-source')) {
                            this.handleDropBack(syntheticDropEvent);
                        }
                    },
                    onDragEnd: (element, event) => {
                        const syntheticEvent = { target: element, preventDefault: () => {} };
                        this.handleDragEnd(syntheticEvent);
                    }
                }
                );

                // 註冊放置區域
                const dropZone = gameArea.querySelector('.unit4-hard-drop-zone');
                const moneySource = gameArea.querySelector('.unit4-hard-money-source');
                
                if (dropZone) {
                    window.TouchDragUtility.registerDropZone(dropZone, () => true);
                    Game.Debug.log('touch', '✅ [困難模式] 放置區域已註冊');
                }
                if (moneySource) {
                    window.TouchDragUtility.registerDropZone(moneySource, () => true);
                    Game.Debug.log('touch', '✅ [困難模式] 金錢來源區域已註冊');
                }
            };
            
            // 🚀 [手機端修復] 啟動延遲註冊 - 困難模式
            registerTouchDrag();
        },

        // =====================================================
        // 點擊功能實現 - 參考 c3_money_exchange 成功實現
        // =====================================================

        // 統一點擊事件監聽器設置 - 參考 c3 的成功做法
        setupClickEventListeners(difficulty) {
            const config = this.clickToMoveConfig[difficulty];
            if (!config?.enabled) {
                Game.Debug.log('event', `🎯 ${difficulty}模式未啟用點擊功能`);
                return;
            }

            Game.Debug.log('event', `🎯 設置${difficulty}模式點擊事件處理`);
            
            // 【核心修正】將事件監聽器綁定到更高層級的容器，
            // 這樣才能同時捕捉到「金錢源區」和「放置區」的點擊事件。
            const eventContainer = document.getElementById('app') || document.body;
            
            // 移除舊的點擊事件監聽器（如果存在）
            if (this._clickEventHandler) {
                eventContainer.removeEventListener('click', this._clickEventHandler, { capture: true });
            }
            
            // 創建新的點擊事件處理器
            this._clickEventHandler = (event) => {
                Game.Debug.log('event', '🖱️ 容器點擊事件觸發', {
                    target: event.target.id || event.target.className,
                });

                // 使用更廣泛的選擇器來確保能捕捉到所有模式下的金錢
                const moneyItem = event.target.closest('.unit4-easy-source-item, .unit4-easy-dropped-item, .unit4-normal-source-item, .unit4-normal-dropped-item, .unit4-hard-source-item, .unit4-hard-dropped-item');
                if (moneyItem) {
                    Game.Debug.log('event', '✅ 發現金錢物品點擊，路由到 handleActionClick');
                    event.stopPropagation(); // 阻止事件冒泡，避免干擾
                    event.preventDefault(); // 阻止默認行為
                    this.handleActionClick(event, difficulty);
                }
            };
            
            // 綁定新的點擊事件
            Game.EventManager.on(eventContainer, 'click', this._clickEventHandler, {
                capture: true, // 使用捕獲階段確保優先處理
            }, {}, 'gameUI');

            Game.Debug.log('event', `✅ ${difficulty}模式點擊事件已成功綁定到 #app`);
        },

        // 主要點擊動作處理器
        handleActionClick(event, difficulty) {
            const config = this.clickToMoveConfig[difficulty];
            if (!config?.enabled) return;

            const target = event.target;
            Game.Debug.log('event', '🎯 handleActionClick 被呼叫', {
                target: target,
                targetClass: target.className,
                difficulty: difficulty,
                useClickToMove: config.enabled
            });

            // 尋找金錢物品元素 (可能點擊到內部圖片)
            let moneyItem = target.closest('.unit4-easy-source-item, .unit4-easy-dropped-item, .unit4-normal-source-item, .unit4-normal-dropped-item, .unit4-hard-source-item, .unit4-hard-dropped-item');
            
            if (!moneyItem) {
                Game.Debug.log('event', 'ℹ️ 找不到金錢物品元素');
                return;
            }

            Game.Debug.log('event', '✅ 找到金錢物品，路由到點擊移動邏輯');
            this.handleItemClick(event, moneyItem, difficulty);
        },

        // 物品點擊處理
        handleItemClick(event, moneyItem, difficulty) {
            const config = this.clickToMoveConfig[difficulty];

            Game.Debug.log('event', '🎯 handleItemClick 被呼叫', {
                difficulty: difficulty,
                itemClass: moneyItem.className,
                itemValue: moneyItem.dataset.value
            });

            // 判斷是源物品還是已放置物品
            const isSourceItem = moneyItem.classList.contains(`unit4-${difficulty}-source-item`);
            const isDroppedItem = moneyItem.classList.contains(`unit4-${difficulty}-dropped-item`);

            if (isSourceItem) {
                // 來源物品：處理點擊放置
                Game.Debug.log('event', '📍 來源物品：處理點擊放置');
                this.handleClickToPlace(moneyItem, difficulty);
            } else if (isDroppedItem && config.allowClickToReturn) {
                // 已放置物品：處理點擊取回
                Game.Debug.log('event', '🔙 已放置物品：處理點擊取回');
                this.handleClickToReturn(moneyItem, difficulty);
            } else {
                Game.Debug.log('event', 'ℹ️ 此物品類型不支援點擊操作');
            }
        },

        // 處理點擊放置
        handleClickToPlace(sourceItem, difficulty) {
            const config = this.clickToMoveConfig[difficulty];
            const currentTime = Date.now();
            const lastClickTime = this.state.clickState.lastClickTime;
            const lastClickedElement = this.state.clickState.lastClickedElement;
            const timeDiff = currentTime - lastClickTime;
            const isSameElement = lastClickedElement === sourceItem;

            Game.Debug.log('event', '🎯 handleClickToPlace 被呼叫', {
                sourceItem: sourceItem,
                difficulty: difficulty
            });

            Game.Debug.log('event', '🔍 雙擊檢測狀態', {
                currentTime,
                lastClickTime,
                timeDiff,
                doubleClickDelay: config.doubleClickDelay,
                isSameElement,
                clickCount: this.state.clickState.clickCount
            });

            // 雙擊檢測邏輯
            if (this.state.clickState.clickCount === 1 &&
                timeDiff <= config.doubleClickDelay &&
                isSameElement) {

                // 這是雙擊 - 執行放置
                Game.Debug.log('event', '✅ 偵測到雙擊，準備執行放置');

                // 重置點擊狀態
                this.state.clickState.clickCount = 0;
                this.state.clickState.lastClickTime = 0;
                this.state.clickState.lastClickedElement = null;

                // 清除選擇狀態
                this.clearItemSelection();

                Game.Debug.log('event', '🔄 執行物品放置邏輯');

                // 執行放置邏輯 - 直接調用核心函數
                this.simulateCoinPlacement(sourceItem, difficulty);

                Game.Debug.log('event', '✅ 雙擊放置執行完成');
            } else {
                // 這是第一次點擊，僅選擇物品
                Game.Debug.log('event', '🔵 第一次點擊，選擇物品');

                this.state.clickState.clickCount = 1;
                this.state.clickState.lastClickTime = currentTime;
                this.state.clickState.lastClickedElement = sourceItem;

                // 清除之前的選擇並設置新選擇
                this.clearItemSelection();
                this.state.clickState.selectedClickItem = {
                    element: sourceItem,
                    value: sourceItem.dataset.value,
                    type: 'source-item'
                };

                // 視覺反饋
                if (config.visualSelection) {
                    sourceItem.classList.add('selected-item');
                }

                // 音效反饋
                if (config.audioFeedback) {
                    Game.Debug.log('audio', '🎵 播放選擇音效');
                    // c4 沒有 playSound 函數，暫時跳過音效或使用其他音效
                    // this.audio.playDropSound();
                }

                Game.Debug.log('event', '🎙️ 第一次點擊：不播放語音提示');
            }
        },

        // 處理點擊取回
        handleClickToReturn(placedItem, difficulty) {
            const config = this.clickToMoveConfig[difficulty];

            if (!config?.allowClickToReturn) {
                Game.Debug.log('event', 'ℹ️ 此模式不允許點擊取回');
                return;
            }

            Game.Debug.log('event', '🔙 處理點擊取回', { placedItem });

            // 直接執行取回邏輯
            this.simulateCoinReturn(placedItem, difficulty);
        },

        // 清除物品選擇狀態
        clearItemSelection() {
            const selectedItem = this.state.clickState.selectedClickItem;

            Game.Debug.log('event', '🧹 清除物品選擇狀態', {
                hasSelectedItem: !!selectedItem
            });

            if (selectedItem && selectedItem.element) {
                selectedItem.element.classList.remove('selected-item');
                this.state.clickState.selectedClickItem = null;
                Game.Debug.log('event', '✅ 選擇狀態已清除');
            }
        },

        // 直接呼叫金錢放置邏輯 - 不再模擬事件
        simulateCoinPlacement(sourceItem, difficulty) {
            Game.Debug.log('event', '🎯 直接呼叫放置邏輯', {
                difficulty,
                sourceItemValue: sourceItem.dataset.value
            });

            try {
                const value = parseInt(sourceItem.dataset.value);
                const dropData = {
                    value: value,
                    id: sourceItem.id || `item-${Date.now()}`,
                    fromZone: 'source',
                    imageSrc: sourceItem.querySelector('img')?.src || ''
                };

                Game.Debug.log('event', `📍 ${difficulty}模式：直接處理放置`);
                
                if (difficulty === 'easy') {
                    // 簡單模式：使用與 handleEasyModeDrop 相同的位置查找邏輯
                    const currentQuestion = this.state.quiz.questions[this.state.quiz.currentQuestion - 1];
                    const solution = this.findSolution(currentQuestion.targetAmount, this.state.settings.denominations);
                    
                    if (!solution) {
                        Game.Debug.error('無法找到解法');
                        return;
                    }
                    
                    // 確保 droppedItems 陣列正確初始化
                    if (!this.state.gameState.droppedItems || this.state.gameState.droppedItems.length !== solution.length) {
                        this.state.gameState.droppedItems = new Array(solution.length).fill(null);
                    }
                    
                    // 找到第一個匹配的淡化位置（還沒被點亮的）
                    let targetPosition = -1;
                    for (let i = 0; i < solution.length; i++) {
                        if (solution[i] === value && this.state.gameState.droppedItems[i] === null) {
                            targetPosition = i;
                            break;
                        }
                    }
                    
                    Game.Debug.log('event', `🎯 簡單模式尋找 ${value}元的位置, 找到位置: ${targetPosition}`);
                    Game.Debug.log('event', '🎯 solution:', solution);
                    Game.Debug.log('event', '🎯 目前droppedItems狀態:', this.state.gameState.droppedItems);

                    if (targetPosition === -1) {
                        Game.Debug.error('沒有匹配的位置或已被佔據！');
                        return;
                    }

                    // 防止超過目標金額
                    const newTotal = this.state.gameState.currentTotal + value;
                    if (newTotal > currentQuestion.targetAmount) {
                        Game.Debug.error('超過目標金額了！');
                        return;
                    }

                    // 放置在正確位置
                    this.state.gameState.droppedItems[targetPosition] = dropData;
                    this.state.gameState.currentTotal = newTotal;

                    Game.Debug.log('event', `✅ 簡單模式成功放置：位置 ${targetPosition} 放入 ${value}元`);
                    Game.Debug.log('payment', `💰 點擊放置後總金額: ${newTotal}元`);
                    
                } else {
                    // 普通/困難模式：使用原本的 push 邏輯
                    if (this.state.gameState.droppedItems) {
                        this.state.gameState.droppedItems.push(dropData);
                    } else {
                        this.state.gameState.droppedItems = [dropData];
                    }
                    
                    // 計算新的總金額
                    const validItems = this.state.gameState.droppedItems.filter(item => item && item.value !== undefined);
                    const newTotal = validItems.reduce((sum, item) => sum + item.value, 0);
                    this.state.gameState.currentTotal = newTotal;

                    Game.Debug.log('payment', `💰 點擊放置後總金額: ${newTotal}元 (有效項目: ${validItems.length}/${this.state.gameState.droppedItems.length})`);
                }
                
                // 移除源物品
                sourceItem.remove();
                
                // 重新渲染當前問題以反映更新
                const currentQuestion = this.state.quiz.questions[this.state.quiz.currentQuestion - 1];
                if (currentQuestion) {
                    if (difficulty === 'easy') {
                        this.renderEasyMode(currentQuestion);
                        // 簡單模式播放總額語音，完成後檢查答案
                        const currentTotal = this.state.gameState.currentTotal || 0;
                        // 🔧 [修正] 使用傳統中文貨幣格式
                        const traditionalTotal = this.speech.convertToTraditionalCurrency(currentTotal);
                        this.speech.speak(`總共${traditionalTotal}`, {
                            callback: () => {
                                // 語音播放完畢後才檢查答案
                                this.checkEasyModeAutoAnswer(currentQuestion);
                            }
                        });
                    } else if (difficulty === 'normal') {
                        this.renderNormalMode(currentQuestion);
                        // 普通模式播放總額語音 - 與拖放一致
                        const currentTotal = this.state.gameState.currentTotal || 0;
                        // 🔧 [修正] 使用傳統中文貨幣格式，特別處理零元
                        const traditionalTotal = currentTotal === 0 ? '零元' : this.speech.convertToTraditionalCurrency(currentTotal);
                        this.speech.speak(`現在總共是${traditionalTotal}`);
                    } else if (difficulty === 'hard') {
                        this.renderHardMode(currentQuestion);
                        // 困難模式不播放語音提示
                    }
                }
                
                // 播放音效
                this.audio.playDropSound();
                
            } catch (error) {
                Game.Debug.error(`${difficulty}模式放置處理錯誤:`, error);
            }
        },

        // 直接呼叫金錢取回邏輯 - 不再模擬事件
        simulateCoinReturn(placedItem, difficulty) {
            Game.Debug.log('event', '🔙 直接呼叫取回邏輯', {
                difficulty,
                placedItemId: placedItem.id,
                placedItemValue: placedItem.dataset?.value
            });

            try {
                const value = parseInt(placedItem.dataset.value);
                const returnData = {
                    value: value,
                    id: placedItem.id,
                    fromZone: 'drop'
                };

                Game.Debug.log('event', `📍 ${difficulty}模式：直接處理取回`);
                
                let itemFound = false;
                
                if (difficulty === 'easy') {
                    // 簡單模式：使用與 handleDropBack 相同的位置清空邏輯
                    if (this.state.gameState.droppedItems) {
                        for (let i = 0; i < this.state.gameState.droppedItems.length; i++) {
                            const item = this.state.gameState.droppedItems[i];
                            if (item && item.value === value) {
                                this.state.gameState.droppedItems[i] = null;
                                itemFound = true;
                                Game.Debug.log('event', `🔙 簡單模式取回成功：位置 ${i} 清空 (${value}元)`);
                                break;
                            }
                        }
                    }
                } else {
                    // 普通/困難模式：使用 filter 移除項目
                    if (this.state.gameState.droppedItems) {
                        const originalLength = this.state.gameState.droppedItems.length;
                        this.state.gameState.droppedItems = this.state.gameState.droppedItems.filter(item => 
                            !(item.id === returnData.id || (item.value === returnData.value && !item.id))
                        );
                        itemFound = this.state.gameState.droppedItems.length < originalLength;
                        if (itemFound) {
                            Game.Debug.log('event', `🔙 ${difficulty}模式取回成功：移除 ${value}元`);
                        }
                    }
                }

                if (itemFound) {
                    // 更新總金額
                    this.state.gameState.currentTotal = (this.state.gameState.currentTotal || 0) - value;

                    Game.Debug.log('payment', `💰 點擊取回後總金額: ${this.state.gameState.currentTotal}元`);
                    
                    // 重新渲染
                    const currentQuestion = this.state.quiz.questions[this.state.quiz.currentQuestion - 1];
                    if (currentQuestion) {
                        if (difficulty === 'easy') {
                            this.renderEasyMode(currentQuestion);
                            // 簡單模式播放總額語音（取回時不需要檢查答案）
                            const currentTotal = this.state.gameState.currentTotal || 0;
                            // 🔧 [修正] 使用傳統中文貨幣格式
                            const traditionalTotal = this.speech.convertToTraditionalCurrency(currentTotal);
                            this.speech.speak(`總共${traditionalTotal}`);
                        } else if (difficulty === 'normal') {
                            this.renderNormalMode(currentQuestion);
                            // 普通模式播放總額語音 - 與拖放一致
                            const currentTotal = this.state.gameState.currentTotal || 0;
                            // 🔧 [修正] 使用傳統中文貨幣格式，特別處理零元
                            const traditionalTotal = currentTotal === 0 ? '零元' : this.speech.convertToTraditionalCurrency(currentTotal);
                            this.speech.speak(`現在總共是${traditionalTotal}`, { interrupt: true });
                        } else if (difficulty === 'hard') {
                            this.renderHardMode(currentQuestion);
                            // 困難模式不播放語音提示
                        }
                    }
                    
                    // 播放音效
                    this.audio.playDropSound();

                    Game.Debug.log('event', '✅ 取回邏輯執行完成');
                } else {
                    Game.Debug.log('event', '⚠️ 未找到要取回的項目');
                }

            } catch (error) {
                Game.Debug.error(`${difficulty}模式取回處理錯誤:`, error);
            }
        }
    };

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

            // 優先處理目標金額彈窗：如存在則排入關閉動作，等待點擊
            const modal = document.getElementById('instruction-modal-overlay');
            if (modal) {
                this._queue = [{ target: null, action: () => this._closeInstructionModal() }];
                this._step = 0;
                return;
            }

            const currentQuestion = Game.state.quiz && Game.state.quiz.questions && Game.state.quiz.questions[Game.state.quiz.currentQuestion - 1];
            if (!currentQuestion) return;
            const solution = Game.findSolution(currentQuestion.targetAmount, Game.state.settings.denominations);
            if (!solution || !solution.length) return;
            const droppedItems = Game.state.gameState.droppedItems || [];
            const placedCounts = {};
            droppedItems.forEach(item => { if (item) placedCounts[item.value] = (placedCounts[item.value] || 0) + 1; });
            const solutionCounts = {};
            solution.forEach(v => { solutionCounts[v] = (solutionCounts[v] || 0) + 1; });
            let nextValue = null;
            for (const val of Object.keys(solutionCounts)) {
                const v = parseInt(val);
                if ((placedCounts[v] || 0) < solutionCounts[val]) { nextValue = v; break; }
            }
            if (nextValue === null) return;
            const sourceItems = Array.from(document.querySelectorAll('.unit4-easy-source-item'));
            const item = sourceItems.find(el => parseInt(el.dataset.value) === nextValue);
            if (!item) return;
            this._queue = [{ target: item, action: () => Game.simulateCoinPlacement(item, 'easy') }];
            this._step = 0;
            this._highlight(item);
        },

        _closeInstructionModal() {
            const modal = document.getElementById('instruction-modal-overlay');
            if (!modal) {
                // 彈窗已消失，直接重建 queue
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
                // 清除載入旗標（同 showInstructionModal callback 效果）
                Game.state.loadingQuestion = false;
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
                    if (this._enabled && document.querySelectorAll('.unit4-easy-source-item').length > 0) {
                        this.buildQueue();
                    }
                }, 500);
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

    Game.init();
});
