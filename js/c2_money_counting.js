/**
 * @file c2_money_counting.js
 * @description C2 金錢的點數與加總 - 配置驅動版本
 * @unit C2 - 金錢的點數與加總
 * @version 2.2.0 - 配置驅動 + 詳細Debug系統
 * @lastModified 2025.08.30 下午9:18
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

const DEBUG = false;

document.addEventListener('DOMContentLoaded', () => {
    Game = {
        // =====================================================
        // 🐛 Debug System - FLAGS 分類開關系統
        // =====================================================
        // 使用方式：
        //   Game.Debug.FLAGS.all = true;      // 開啟全部
        //   Game.Debug.FLAGS.speech = true;   // 只開啟語音相關
        //   Game.Debug.FLAGS.counting = true; // 只開啟點數相關
        // =====================================================
        Debug: {
            FLAGS: {
                all: false,        // 全域開關（開啟後顯示所有分類）
                init: false,       // 初始化相關
                speech: false,     // 語音系統
                audio: false,      // 音效系統
                ui: false,         // UI 渲染
                counting: false,   // 點數操作
                question: false,   // 題目生成
                state: false,      // 狀態變更
                answer: false,     // 答案檢查
                option: false,     // 選項處理
                error: true        // 錯誤訊息（預設開啟）
            },

            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[C2-${category}]`, ...args);
                }
            },

            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    Game.Debug.warn('state', `[C2-${category}]`, ...args);
                }
            },

            error(...args) {
                // 錯誤訊息永遠顯示
                Game.Debug.error('[C2-ERROR]', ...args);
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

        // =====================================================
        // 資料
        // =====================================================
        gameData: {
            title: "單元C2：金錢的點數與加總",
            subtitle: "學習計算金錢的總金額，練習將不同面額的金錢加總計算",
            items: {
                coins: [
                    { 
                        value: 1, 
                        name: '1元', 
                        images: { 
                            front: '../images/money/1_yuan_front.png', 
                            back: '../images/money/1_yuan_back.png' 
                        } 
                    },
                    { 
                        value: 5, 
                        name: '5元', 
                        images: { 
                            front: '../images/money/5_yuan_front.png', 
                            back: '../images/money/5_yuan_back.png' 
                        } 
                    },
                    { 
                        value: 10, 
                        name: '10元', 
                        images: { 
                            front: '../images/money/10_yuan_front.png', 
                            back: '../images/money/10_yuan_back.png' 
                        } 
                    },
                    { 
                        value: 50, 
                        name: '50元', 
                        images: { 
                            front: '../images/money/50_yuan_front.png', 
                            back: '../images/money/50_yuan_back.png' 
                        } 
                    }
                ],
                notes: [
                    { 
                        value: 100, 
                        name: '100元', 
                        images: { 
                            front: '../images/money/100_yuan_front.png', 
                            back: '../images/money/100_yuan_back.png' 
                        } 
                    },
                    { 
                        value: 500, 
                        name: '500元', 
                        images: { 
                            front: '../images/money/500_yuan_front.png', 
                            back: '../images/money/500_yuan_back.png' 
                        } 
                    },
                    { 
                        value: 1000, 
                        name: '1000元', 
                        images: { 
                            front: '../images/money/1000_yuan_front.png', 
                            back: '../images/money/1000_yuan_back.png' 
                        } 
                    }
                ]
            }
        },

        // =====================================================
        // 狀態
        // =====================================================
        state: {
            score: 0,
            totalQuestions: 10,
            currentQuestionIndex: 0,
            quizQuestions: [],
            isAnswering: false,
            audioUnlocked: false,  // 🔧 [新增] 手機端音頻解鎖狀態
            startTime: null,  // 🔧 [新增] 測驗開始時間
            settings: {
                category: null,
                difficulty: null,
                mode: null,
                selectedItems: [],
                questionCount: null,
                moneyQuantity: 'default',  // 新增金錢數量設定
                assistClick: false
            },
            runningTotal: 0,
            itemsToCount: 0,
            countedItems: 0,
            correctTotal: 0
        },

        // =====================================================
        // DOM 元素
        // =====================================================
        elements: {},

        // =====================================================
        // 語音 - 採用F1/C1先進語音系統
        // =====================================================
        speech: {
            synth: window.speechSynthesis,
            voice: null,
            isReady: false,

            init() {
                Game.Debug.log('speech', '🎙️ [C2-語音] 初始化語音系統');
                
                let voiceInitAttempts = 0;
                const maxAttempts = 5;
                
                const setVoice = () => {
                    const voices = this.synth.getVoices();
                    voiceInitAttempts++;
                    
                    Game.Debug.log('speech', '🎙️ [C2-語音] 取得語音列表', {
                        voiceCount: voices.length,
                        attempt: voiceInitAttempts,
                        allVoices: voices.map(v => ({ name: v.name, lang: v.lang }))
                    });
                    
                    if (voices.length === 0) {
                        if (voiceInitAttempts < maxAttempts) {
                            Game.Debug.log('speech', '🎙️ [C2-語音] 語音列表為空，將重試');
                            Game.TimerManager.setTimeout(setVoice, 500, 'speech');
                        } else {
                            Game.Debug.log('speech', '🎙️ [C2-語音] 手機端無語音，啟用靜音模式');
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
                        Game.Debug.log('speech', '🎙️ [C2-語音] 語音準備就緒', {
                            voiceName: this.voice.name,
                            lang: this.voice.lang,
                            attempt: voiceInitAttempts
                        });
                    }
                };
                
                // 先嘗試立即載入
                setVoice();
                
                // 同時設置事件監聽器以防語音列表延遲載入
                if (this.synth.onvoiceschanged !== undefined) {
                    this.synth.onvoiceschanged = setVoice;
                }
                
                // 額外的延遲重試機制，適用於某些移動瀏覽器
                Game.TimerManager.setTimeout(() => {
                    if (!this.isReady && voiceInitAttempts < maxAttempts) {
                        Game.Debug.log('speech', '🎙️ [C2-語音] 延遲重試語音初始化');
                        setVoice();
                    }
                }, 1000, 'speech');
            },

            speak(text, callback) {
                Game.Debug.log('speech', '🎙️ [C2-語音] 嘗試播放語音', {
                    text,
                    isReady: this.isReady,
                    audioUnlocked: Game.state.audioUnlocked,
                    voiceName: this.voice?.name
                });

                // 🔧 [新增] 手機端音頻解鎖檢查
                if (!Game.state.audioUnlocked) {
                    Game.Debug.log('speech', '🎙️ [C2-語音] ⚠️ 音頻權限未解鎖，跳過語音播放');
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'ui');
                    return;
                }

                // 停止所有正在播放的語音，防止重疊和多重回調
                if (this.synth.speaking) {
                    Game.Debug.log('speech', '🎙️ [C2-語音] 停止之前的語音播放');
                    this.synth.cancel();
                }

                if (!this.isReady || !text) {
                    Game.Debug.log('speech', '🎙️ [C2-語音] 語音系統未就緒或文字為空', { isReady: this.isReady, hasText: !!text });
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'ui');
                    return;
                }

                // 🔧 [手機端修復] 檢查語音是否可用
                if (!this.voice) {
                    Game.Debug.log('speech', '🎙️ [C2-語音] 手機端無語音，跳過語音播放');
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'ui');
                    return;
                }

                Game.Debug.log('speech', '🎙️ [C2-語音] 開始播放語音', {
                    text,
                    voiceName: this.voice?.name
                });

                try {
                    this.synth.cancel();
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
                                Game.Debug.log('speech', '🎙️ [C2-語音] 語音播放完成，執行回調');
                                callback();
                            }
                        };

                        // 監聽語音播放結束事件
                        utterance.onend = safeCallback;
                        utterance.onerror = (e) => {
                            Game.Debug.log('speech', '🎙️ [C2-語音] 語音播放錯誤', e);
                            safeCallback();
                        };

                        // 安全措施：最多等待10秒
                        Game.TimerManager.setTimeout(safeCallback, 10000, 'ui');
                    }

                    this.synth.speak(utterance);
                    Game.Debug.log('speech', '🎙️ [C2-語音] 語音已提交播放');
                } catch (error) {
                    Game.Debug.error('🎙️ [C2-語音] 語音播放異常', error);
                    safeCallback();
                }
            }
        },

        // =====================================================
        // 音頻解鎖系統 - 採用F1/C1系統
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
                Game.Debug.log('audio', '🔓 [C2-音頻] 音頻權限解鎖成功');
                
                return true;
            } catch (error) {
                Game.Debug.log('audio', '⚠️ [C2-音頻] 音頻解鎖失敗，但繼續執行', error);
                this.state.audioUnlocked = true; // 設為true以避免重複嘗試
                return false;
            }
        },

        // =====================================================
        // 🔧 傳統中文貨幣轉換 - 使用共用模組
        // =====================================================
        convertToTraditionalCurrency(amount) {
            // 使用共用模組的金額轉換函數
            return NumberSpeechUtils.convertToTraditionalCurrency(amount);
        },

        // =====================================================
        // 初始化
        // =====================================================
        init() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeAll();
            this.speech.init();
            this.initAudio();
            this.injectGlobalAnimationStyles();
            this.showSettings();
        },

        injectGlobalAnimationStyles() {
            if (document.getElementById('c2-global-animations')) return;

            const style = document.createElement('style');
            style.id = 'c2-global-animations';
            style.innerHTML = `
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
        },

        // =====================================================
        // 設定畫面 (加入深色主題)
        // =====================================================
        // =====================================================
        // 設定畫面 (採用unit6樣式結構)
        // =====================================================
        showSettings() {
            AssistClick.deactivate();
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            // 停止語音播放，避免從遊戲返回時 pending callback 觸發 loadNextQuestion
            if (this.speech.synth) {
                this.speech.synth.cancel();
            }

            // 🔧 [重構] 返回設定時重置遊戲狀態
            this.resetGameState();

            const app = document.getElementById('app');
            const settings = this.state.settings;

            app.innerHTML = `
                <div class="unit-welcome">
                    <div class="welcome-content">
                        <div class="settings-title-row">
                            <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                            <h1>${this.gameData.title}</h1>
                        </div>
                        <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">${this.gameData.subtitle}</p>

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
                                    啟用後，只要偵測到點擊，系統會自動依序完成點選金幣依序數錢等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                    <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式」</strong>
                                </p>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.assistClick ? 'active' : ''}" id="assist-click-on">✓ 啟用</button>
                                    <button class="selection-btn ${!settings.assistClick ? 'active' : ''}" id="assist-click-off">✗ 停用</button>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label>💰 面額選擇：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.category === 'coins' ? 'active' : ''}"
                                            data-type="category" data-value="coins">
                                        硬幣
                                    </button>
                                    <button class="selection-btn ${settings.category === 'notes' ? 'active' : ''}" 
                                            data-type="category" data-value="notes">
                                        紙鈔
                                    </button>
                                    <button class="selection-btn ${settings.category === 'mixed' ? 'active' : ''}"
                                            data-type="category" data-value="mixed">
                                        混合
                                    </button>
                                    <button class="selection-btn ${settings.category === 'random' ? 'active' : ''}"
                                            data-type="category" data-value="random">
                                        隨機
                                    </button>
                                </div>
                            </div>
                            
                            <div id="item-selection-group" class="setting-group" style="display: none;">
                                <label>🔢 選擇要數的錢 (可多選)：</label>
                                <div id="item-selection" class="button-group">
                                </div>
                            </div>
                            
                            <div class="setting-group">
                                <label>💵 金錢數量：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.moneyQuantity === 'default' ? 'active' : ''}"
                                            data-type="moneyQuantity" data-value="default">
                                        預設(5-20)
                                    </button>
                                    <button class="selection-btn ${settings.moneyQuantity === '1-10' ? 'active' : ''}" 
                                            data-type="moneyQuantity" data-value="1-10">
                                        1-10個
                                    </button>
                                    <button class="selection-btn ${settings.moneyQuantity === '10-15' ? 'active' : ''}" 
                                            data-type="moneyQuantity" data-value="10-15">
                                        10-15個
                                    </button>
                                    <button class="selection-btn ${settings.moneyQuantity === '15-20' ? 'active' : ''}" 
                                            data-type="moneyQuantity" data-value="15-20">
                                        15-20個
                                    </button>
                                    <button class="selection-btn ${settings.moneyQuantity === '20-25' ? 'active' : ''}" 
                                            data-type="moneyQuantity" data-value="20-25">
                                        20-25個
                                    </button>
                                    <button class="selection-btn ${settings.moneyQuantity === '25-30' ? 'active' : ''}" 
                                            data-type="moneyQuantity" data-value="25-30">
                                        25-30個
                                    </button>
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
                                    <input type="text" id="custom-question-count-c2"
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
                                ${settings.difficulty === 'easy' ? '<p style="color: #999; font-size: 0.9em; margin-top: 8px;">簡單模式自動完成，無需選擇測驗模式</p>' : ''}
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
                                返回主選單
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
                    const params = new URLSearchParams({ unit: 'c2' });
                    window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
                }, {}, 'settings');
            }

            const startBtn = app.querySelector('#start-quiz-btn');
            Game.EventManager.on(startBtn, 'click', this.start.bind(this), {}, 'settings');

            // 更新開始按鈕狀態
            this.updateStartButton();
        },

        // 初始化音效
        initAudio() {
            try {
                this.menuSelectAudio = new Audio('../audio/units/click.mp3');
                this.menuSelectAudio.volume = 0.5;
                this.menuSelectAudio.preload = 'auto';
            } catch (error) {
                Game.Debug.log('audio', '無法載入選單音效:', error);
            }
        },

        // 播放選單選擇音效
        playMenuSelectSound() {
            try {
                if (this.menuSelectAudio) {
                    this.menuSelectAudio.currentTime = 0;
                    this.menuSelectAudio.play().catch(e => {
                        Game.Debug.log('speech', '音效播放失敗:', e);
                    });
                }
            } catch (error) {
                Game.Debug.log('speech', '無法播放選單音效:', error);
            }
        },

        handleSelection(event) {
            // 🔓 解鎖手機音頻播放權限 - 改用內建系統
            this.unlockAudio();
            
            const btn = event.target.closest('.selection-btn');
            if (!btn) return;

            const { type, value } = btn.dataset;
            
            // 播放選單選擇音效
            this.playMenuSelectSound();
            
            const settings = this.state.settings;
            
            // 處理題目設定選項
            if (type === 'questions') {
                if (value === 'custom') {
                    this.showCustomQuestionInput();
                    return;
                } else {
                    settings.questionCount = parseInt(value);
                    this.state.totalQuestions = parseInt(value);
                    this.hideCustomQuestionInput();

                    // 🔧 [新增] 選擇預設題數時，隱藏自訂輸入框
                    const customDisplay = document.querySelector('.custom-question-display');
                    const customInput = document.getElementById('custom-question-count-c2');
                    if (customDisplay && customInput) {
                        customDisplay.style.display = 'none';
                        customInput.value = '';
                        customInput.style.background = 'white';
                        customInput.style.color = '#333';
                        customInput.style.borderColor = '#ddd';
                    }
                }
            } else if (type === 'category' || type === 'difficulty' || type === 'mode' || type === 'moneyQuantity') {
                settings[type] = value;

                // 如果選擇幣值，顯示錢幣選擇
                if (type === 'category' && value) {
                    this.showItemSelection();
                }

                // 🔧 如果修改難度，更新測驗模式按鈕的可用性
                if (type === 'difficulty') {
                    this.updateModeButtonsAvailability(value);
                    this.updateDifficultyDescription(value);
                    // 顯示/隱藏輔助點擊開關
                    const assistGroup = document.getElementById('assist-click-group');
                    if (assistGroup) {
                        assistGroup.style.display = value === 'easy' ? 'block' : 'none';
                        if (value !== 'easy') this.state.settings.assistClick = false;
                    }
                }
            } else if (type === 'selectedItem') {
                const numValue = parseInt(value, 10);
                const index = settings.selectedItems.indexOf(numValue);
                
                if (index > -1) {
                    settings.selectedItems.splice(index, 1);
                    btn.classList.remove('active');
                } else {
                    settings.selectedItems.push(numValue);
                    btn.classList.add('active');
                }
                this.updateStartButton();
                return;
            }

            // 更新同組按鈕的active狀態
            const buttonGroup = btn.closest('.button-group');
            buttonGroup.querySelectorAll('.selection-btn')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 檢查是否所有必要設定都已完成
            this.updateStartButton();
        },

        // 🔧 更新測驗模式按鈕的可用性（簡單模式時禁用）
        updateModeButtonsAvailability(difficulty) {
            const modeButtons = document.querySelectorAll('[data-type="mode"]');
            const modeGroup = document.getElementById('mode-selection-group');

            if (difficulty === 'easy') {
                // 簡單模式：禁用測驗模式按鈕
                modeButtons.forEach(btn => {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.classList.remove('active');
                });

                // 添加提示文字（如果不存在）
                let hint = modeGroup.querySelector('.mode-hint');
                if (!hint) {
                    hint = document.createElement('p');
                    hint.className = 'mode-hint';
                    hint.style.cssText = 'color: #999; font-size: 0.9em; margin-top: 8px;';
                    hint.textContent = '簡單模式自動完成，無需選擇測驗模式';
                    modeGroup.appendChild(hint);
                }

                // 清除模式選擇（重置為null）
                this.state.settings.mode = null;
            } else {
                // 普通/困難模式：啟用測驗模式按鈕
                modeButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                });

                // 移除提示文字
                const hint = modeGroup.querySelector('.mode-hint');
                if (hint) {
                    hint.remove();
                }
            }

            // 更新開始按鈕狀態
            this.updateStartButton();
        },

        // 取得難度說明文字
        getDifficultyDescription(difficulty) {
            const descriptions = {
                easy: '簡單：系統幫你數，引導下完成題目。',
                normal: '普通：系統幫你數，以選擇題的方式，選擇正確的答案。',
                hard: '困難：自己數，輸入正確金額數字'
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

        showItemSelection() {
            const category = this.state.settings.category;
            if (!category) return;

            const itemSelectionGroup = document.getElementById('item-selection-group');
            const itemContainer = document.getElementById('item-selection');

            // 隨機模式：自動隨機選取 2~4 種面額，隱藏手動選擇區
            if (category === 'random') {
                const allItems = [...this.gameData.items.coins, ...this.gameData.items.notes];
                const count = 2 + Math.floor(Math.random() * 3); // 2、3 或 4 種
                const shuffled = allItems.slice().sort(() => Math.random() - 0.5);
                this.state.settings.selectedItems = shuffled.slice(0, count).map(i => i.value);
                itemContainer.innerHTML = '';
                itemSelectionGroup.style.display = 'none';
                this.updateStartButton();
                return;
            }

            // 清空之前的選項
            itemContainer.innerHTML = '';
            this.state.settings.selectedItems = [];

            const items = (category === 'mixed')
                ? [...this.gameData.items.coins, ...this.gameData.items.notes]
                : this.gameData.items[category];

            items.forEach(item => {
                const button = document.createElement('button');
                button.className = 'selection-btn';
                button.dataset.type = 'selectedItem';
                button.dataset.value = item.value;
                button.textContent = item.name;
                itemContainer.appendChild(button);
            });

            itemSelectionGroup.style.display = 'block';
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
                this.state.totalQuestions = questionCount;
                
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
                const customInput = document.getElementById('custom-question-count-c2');
                if (customDisplay && customInput) {
                    customDisplay.style.display = 'block';
                    customInput.value = `${questionCount}題`;
                    customInput.style.background = '#667eea';
                    customInput.style.color = 'white';
                    customInput.style.borderColor = '#667eea';
                }

                // 檢查是否可以開始遊戲
                this.updateStartButton();

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

        // 更新開始按鈕狀態
        updateStartButton() {
            const { category, difficulty, selectedItems, mode, questionCount } = this.state.settings;
            const startBtn = document.getElementById('start-quiz-btn');

            // 🔧 簡單模式不需要選擇測驗模式
            const modeRequired = difficulty !== 'easy';
            const modeValid = modeRequired ? mode : true;

            if (category && difficulty && selectedItems.length > 0 && modeValid && questionCount) {
                startBtn.disabled = false;
                startBtn.textContent = '開始測驗！';
                startBtn.classList.remove('disabled');
            } else {
                startBtn.disabled = true;
                startBtn.textContent = '請完成所有選擇';
                startBtn.classList.add('disabled');
            }
        },

        // 顯示視窗正中央的回饋圖示（正方形）
        showCenterFeedback(icon, color, text) {
            // 移除舊的回饋元素
            this.hideCenterFeedback();
            
            // 創建新的回饋元素
            const feedbackDiv = document.createElement('div');
            feedbackDiv.id = 'center-feedback';
            feedbackDiv.innerHTML = `
                <div class="center-feedback-content">
                    <div class="feedback-icon">${icon}</div>
                    <div class="feedback-text">${text}</div>
                </div>
            `;
            
            document.body.appendChild(feedbackDiv);
        },

        // 隱藏視窗正中央的回饋圖示
        hideCenterFeedback() {
            const existingFeedback = document.getElementById('center-feedback');
            if (existingFeedback) {
                existingFeedback.remove();
            }
        },

        // =====================================================
        // 狀態重置
        // =====================================================

        /**
         * 統一重置遊戲狀態
         * 集中管理所有遊戲相關狀態的重置，避免重置邏輯分散
         */
        resetGameState() {
            this.state.score = 0;
            this.state.currentQuestionIndex = 0;
            this.state.quizQuestions = [];
            this.state.isAnswering = false;
            this.state.startTime = null;
            this.state.runningTotal = 0;
            this.state.itemsToCount = 0;
            this.state.countedItems = 0;
            this.state.correctTotal = 0;
            this.state.isEndingGame = false;
            this.state.isPlayingFinalAmount = false;
            Game.Debug.log('state', '🔄 [C2] 遊戲狀態已重置');
        },

        // =====================================================
        // 遊戲流程
        // =====================================================
        start() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            Game.Debug.log('speech', '🎯 [C2-遊戲] 開始測驗，解鎖音頻並播放歡迎語音');

            // 🔧 [修復] 確保音頻已解鎖
            this.unlockAudio();

            // 🔧 [重構] 使用統一重置函數
            this.resetGameState();
            this.state.startTime = Date.now();  // 記錄測驗開始時間
            this.generateQuestions();
            this.setupQuizUI();
            if (this.state.settings.difficulty === 'easy' && this.state.settings.assistClick) {
                AssistClick.activate();
            }

            // 🔧 [新增] 播放測驗開始語音，類似C1的initialInstruction
            const { difficulty, category } = this.state.settings;
            let welcomeText = '';
            
            if (difficulty === 'easy') {
                welcomeText = '數數看有幾元，點擊金錢圖示來計算總金額';
            } else if (difficulty === 'normal') {
                welcomeText = '數數看有幾元，點擊金錢圖示計算後選擇正確答案';
            } else if (difficulty === 'hard') {
                welcomeText = '數數看有幾元，點擊金錢圖示計算後輸入總金額';
            }
            
            Game.Debug.log('speech', '🎙️ [C2-遊戲] 播放測驗開始語音:', welcomeText);
            
            // 延遲播放，讓UI完全載入
            Game.TimerManager.setTimeout(() => {
                this.speak(welcomeText, () => {
                    Game.Debug.log('speech', '🎙️ [C2-遊戲] 歡迎語音完成，開始載入第一題');
                    this.loadNextQuestion();
                });
            }, 500);
        },

        setupQuizUI() {
            const app = document.getElementById('app');
            app.innerHTML = `
                <div class="store-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <div class="progress-info">第 1 / ${this.state.totalQuestions} 題</div>
                        </div>
                        <div class="title-bar-center">
                            <div class="target-amount">${this.gameData.title}</div>
                        </div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button id="back-to-menu-btn" class="back-to-menu-btn">返回設定</button>
                        </div>
                    </div>
                    
                    <div class="unified-task-frame">
                        <div id="question-area" class="task-description"></div>
                        <div id="feedback-area" class="answer-feedback-area" style="display: none; text-align: center; padding: 20px;"></div>
                    </div>
                </div>
            `;
            
            this.elements.questionArea = document.getElementById('question-area');
            this.elements.feedbackArea = document.getElementById('feedback-area');
            
            // 綁定返回主選單按鈕事件
            const backBtn = document.querySelector('#back-to-menu-btn');
            if (backBtn) {
                Game.EventManager.on(backBtn, 'click', () => {
                    Game.showSettings();
                }, {}, 'gameUI');
            }
        },

        loadNextQuestion() {
            this.state.isAnswering = false;
            
            if (this.state.currentQuestionIndex >= this.state.totalQuestions) {
                this.endGame();
                return;
            }

            const question = this.state.quizQuestions[this.state.currentQuestionIndex];
            this.state.currentQuestionIndex++;
            
            this.updateProgress();
            this.elements.feedbackArea.innerHTML = '';
            // 移除任何現有的提示數字框
            const existingHintBox = document.getElementById('total-hint-box');
            if (existingHintBox) {
                existingHintBox.remove();
            }

            this.startQuestion(question);
        },

        // 比較兩個題目是否相同
        areQuestionsEqual(question1, question2) {
            // 先比較總金額
            if (question1.correctTotal !== question2.correctTotal) {
                return false;
            }
            
            // 比較物品組合
            if (question1.items.length !== question2.items.length) {
                return false;
            }
            
            // 建立每個題目的物品數量映射
            const getItemsMap = (items) => {
                const map = new Map();
                items.forEach(({ item, quantity }) => {
                    map.set(item.value, quantity);
                });
                return map;
            };
            
            const map1 = getItemsMap(question1.items);
            const map2 = getItemsMap(question2.items);
            
            // 比較映射是否相同
            if (map1.size !== map2.size) {
                return false;
            }
            
            for (let [value, quantity] of map1) {
                if (map2.get(value) !== quantity) {
                    return false;
                }
            }
            
            return true;
        },

        generateQuestions() {
            this.state.quizQuestions = [];
            const { selectedItems, category } = this.state.settings;
            let itemPool = [];

            if (selectedItems.length > 0) {
                const allItems = [...this.gameData.items.coins, ...this.gameData.items.notes];
                itemPool = allItems.filter(item => selectedItems.includes(item.value));
            } else {
                const source = (category === 'mixed')
                    ? [...this.gameData.items.coins, ...this.gameData.items.notes]
                    : this.gameData.items[category];
                if (source) itemPool = source;
            }

            if (!itemPool || itemPool.length === 0) { 
                return; 
            }

            for (let i = 0; i < this.state.totalQuestions; i++) {
                let questionItems = [];
                let questionTotal = 0;
                let attempts = 0;
                const maxAttempts = 50; // 最大嘗試次數，避免無限迴圈

                do {
                    questionItems = [];
                    questionTotal = 0;
                    attempts++;

                    // 根據金錢數量設定決定目標數量
                    const { moneyQuantity } = this.state.settings;
                    let targetTotalCount;
                    
                    switch(moneyQuantity) {
                        case '1-10':
                            targetTotalCount = Math.floor(Math.random() * 10) + 1; // 1-10個
                            break;
                        case '10-15':
                            targetTotalCount = Math.floor(Math.random() * 6) + 10; // 10-15個
                            break;
                        case '15-20':
                            targetTotalCount = Math.floor(Math.random() * 6) + 15; // 15-20個
                            break;
                        case '20-25':
                            targetTotalCount = Math.floor(Math.random() * 6) + 20; // 20-25個
                            break;
                        case '25-30':
                            targetTotalCount = Math.floor(Math.random() * 6) + 25; // 25-30個
                            break;
                        default: // 'default'
                            targetTotalCount = Math.floor(Math.random() * 16) + 5; // 5-20個（原本的邏輯）
                            break;
                    }

                    let currentTotalCount = 0;
                    const itemsCountMap = new Map();

                    // 幣值必現邏輯：先確保所有選中的幣值都出現至少一次
                    if (this.state.settings.selectedItems.length > 0) {
                        this.state.settings.selectedItems.forEach(value => {
                            itemsCountMap.set(value, 1);
                            currentTotalCount++;
                        });
                    }

                    // 填充剩餘數量到目標數量
                    while(currentTotalCount < targetTotalCount) {
                        const randomItem = itemPool[Math.floor(Math.random() * itemPool.length)];
                        itemsCountMap.set(randomItem.value, (itemsCountMap.get(randomItem.value) || 0) + 1);
                        currentTotalCount++;
                    }

                    itemsCountMap.forEach((quantity, value) => {
                        const itemData = itemPool.find(item => item.value === value);
                        if (itemData) {
                            questionItems.push({ item: itemData, quantity: quantity });
                            questionTotal += itemData.value * quantity;
                        }
                    });

                    // 檢查是否與前一題重複（如果不是第一題的話）
                } while (i > 0 && attempts < maxAttempts && this.areQuestionsEqual(
                    { items: questionItems, correctTotal: questionTotal },
                    this.state.quizQuestions[i - 1]
                ));
                
                this.state.quizQuestions.push({ 
                    items: questionItems, 
                    correctTotal: questionTotal 
                });
            }
        },

        startQuestion(question) {
            this.state.runningTotal = 0;
            this.state.countedItems = 0;
            this.state.correctTotal = question.correctTotal;

            const difficulty = this.state.settings.difficulty;
            let hintBoxHtml = '';
            
            if (difficulty === 'easy') {
                // 簡單模式：只顯示總計，無提示按鈕
                hintBoxHtml = `
                    <div id="total-hint-box">
                        <div class="total-hint-container simple-mode">
                            <div class="total-display simple-display">
                                <span>總計：</span>
                                <span id="hint-total-amount">0</span>元
                            </div>
                        </div>
                    </div>
                `;
            } else if (difficulty === 'normal') {
                // 普通模式：顯示總計，有提示按鈕（提示按鈕獨立於 total-hint-box）
                hintBoxHtml = `
                    <div style="position:absolute;right:10px;top:10px;display:flex;align-items:center;gap:6px;z-index:100;">
                        <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                        <button class="hint-button" onclick="Game.showTotalHint()" title="顯示總計金額">
                            💡 <span class="hint-text">提示</span>
                        </button>
                    </div>
                    <div id="total-hint-box">
                        <div class="total-hint-container">
                            <div class="total-display blurred-total">
                                <span>總計：</span>
                                <span id="hint-total-amount">？？？</span>元
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // 困難模式：顯示總計，有提示按鈕（提示按鈕獨立於 total-hint-box）
                hintBoxHtml = `
                    <div style="position:absolute;right:10px;top:10px;display:flex;align-items:center;gap:6px;z-index:100;">
                        <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                        <button class="hint-button" onclick="Game.showTotalHint()" title="顯示總計金額">
                            💡 <span class="hint-text">提示</span>
                        </button>
                    </div>
                    <div id="total-hint-box">
                        <div class="total-hint-container">
                            <div class="total-display" onclick="Game.showNumberInput()">
                                <span>總計：</span>
                                <span id="hint-total-amount">？？？</span>元
                            </div>
                        </div>
                    </div>
                `;
            }
            
            this.elements.questionArea.innerHTML = `
                ${hintBoxHtml}
                <div id="coin-display-area"></div>
            `;
            
            // 渲染所有硬幣圖示
            const coinDisplayArea = document.getElementById('coin-display-area');
            coinDisplayArea.innerHTML = '';
            let totalItems = 0;
            const allDivs = [];
            question.items.forEach(round => {
                totalItems += round.quantity;
                for (let i = 0; i < round.quantity; i++) {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'countable-item';
                    itemDiv.dataset.value = round.item.value;
                    itemDiv.dataset.name = round.item.name;
                    itemDiv.innerHTML = `<img src="${this.getRandomImage(round.item)}" alt="${round.item.name}">`;
                    Game.EventManager.on(itemDiv, 'click', (e) => this.handleItemClick(e), {}, 'gameUI');
                    Game.EventManager.on(itemDiv, 'touchend', (e) => {
                        e.preventDefault();
                        this.handleItemClick(e);
                    }, { passive: false }, 'gameUI');
                    allDivs.push(itemDiv);
                }
            });
            this.state.itemsToCount = totalItems;
            this.shuffleArray(allDivs).forEach(div => coinDisplayArea.appendChild(div));

            // 🔧 [修正] 延遲語音播放，確保語音系統準備就緒
            Game.TimerManager.setTimeout(() => {
                Game.Debug.log('speech', '🎙️ [C2-語音] 準備播放開場語音');
                this.speak("數數看有幾元");
            }, 500);
        },


        handleItemClick(event) {
            Game.Debug.log('counting', '🎯 [C2-點數] 項目點擊事件觸發', {
                eventType: event.type,
                currentTarget: event.currentTarget.className,
                value: event.currentTarget.dataset.value,
                name: event.currentTarget.dataset.name
            });
            
            // 如果正在播放最終金額語音，忽略點擊事件
            if (this.state.isPlayingFinalAmount) {
                Game.Debug.log('speech', '⚠️ [C2-點數] 正在播放最終金額，忽略點擊');
                return;
            }
            
            const item = event.currentTarget;
            if (item.classList.contains('counted')) {
                Game.Debug.log('counting', '⚠️ [C2-點數] 項目已被點數，忽略重複點擊');
                return;
            }
            
            // 添加視覺和音效反饋
            item.classList.add('counted');
            const value = parseInt(item.dataset.value, 10);
            this.state.runningTotal += value;
            
            Game.Debug.log('counting', '✅ [C2-點數] 項目點數成功', {
                itemValue: value,
                newTotal: this.state.runningTotal,
                countedItems: this.state.countedItems + 1
            });
            
            // 播放點擊音效
            const clickSound = document.getElementById('click-sound');
            if (clickSound) {
                clickSound.currentTime = 0;
                clickSound.play().catch(e => Game.Debug.log('speech', '音效播放失敗:', e));
            }

            const difficulty = this.state.settings.difficulty;

            // 在簡單、普通和困難模式下添加數數字顯示
            if (difficulty === 'easy') {
                this.state.countedItems++;
                
                // 創建並顯示數數字
                const countNumber = document.createElement('div');
                countNumber.className = 'count-number';
                countNumber.textContent = this.state.countedItems;
                item.appendChild(countNumber);
                
                // 簡單模式：即時更新提示數字框，先播放語音
                const hintAmount = document.getElementById('hint-total-amount');
                if (hintAmount) {
                    hintAmount.textContent = this.state.runningTotal;
                }
                
                // 🔧 [修正] 使用傳統中文貨幣格式進行語音播放
                const traditionalAmount = this.convertToTraditionalCurrency(this.state.runningTotal);
                
                // 檢查是否為最後一個金錢圖示
                if (this.state.countedItems === this.state.itemsToCount) {
                    this.state.isPlayingFinalAmount = true;
                    Game.Debug.log('speech', '🎙️ [C2-語音] 簡單模式播放最終金額語音:', traditionalAmount);
                    this.speak(traditionalAmount, () => {
                        Game.Debug.log('speech', '🎙️ [C2-語音] 最後一枚完成，進入答題階段');
                        this.state.isPlayingFinalAmount = false;
                        this.proceedToAnswerPhase();
                    });
                } else {
                    // 非最後一個：簡短播放當前金額
                    this.speak(traditionalAmount);
                }
            } else if (difficulty === 'normal') {
                this.state.countedItems++;

                // 創建並顯示綠色打勾
                const countMark = document.createElement('div');
                countMark.className = 'count-checkmark';
                countMark.textContent = '✓';
                item.appendChild(countMark);

                // 🔧 [修正] 普通模式：不即時更新總計顯示，保持顯示「？？？」
                // 總計金額只在按下提示鈕時才顯示

                // 🔧 [修正] 使用傳統中文貨幣格式進行語音播放
                const traditionalAmount = this.convertToTraditionalCurrency(this.state.runningTotal);
                
                // 檢查是否為最後一個金錢圖示
                if (this.state.countedItems === this.state.itemsToCount) {
                    this.state.isPlayingFinalAmount = true;
                    Game.Debug.log('speech', '🎙️ [C2-語音] 播放最終金額語音:', traditionalAmount);
                    this.speak(traditionalAmount, () => {
                        Game.Debug.log('speech', '🎙️ [C2-語音] 最後一枚完成，進入答題階段');
                        this.state.isPlayingFinalAmount = false;
                        this.proceedToAnswerPhase();
                    });
                } else {
                    // 非最後一個：簡短播放當前金額
                    this.speak(traditionalAmount);
                }
            } else if (difficulty === 'hard') {
                this.state.countedItems++;
                
                // 困難模式下檢查是否全部完成
                if (this.state.countedItems === this.state.itemsToCount) {
                    Game.Debug.log('speech', '🎙️ [C2-語音] 困難模式全部完成，進入答題階段');
                    this.proceedToAnswerPhase();
                }
            }
        },

        proceedToAnswerPhase() {
            const difficulty = this.state.settings.difficulty;
            if (difficulty === 'easy') {
                // 簡單模式：自動判斷，播放煙火動畫和音效後，播放「太棒了，你數完了，總共是×元」
                Game.TimerManager.setTimeout(() => {
                    // 自動判斷正確，增加分數
                    this.state.score++;
                    this.updateProgress();
                    
                    // 顯示中央回饋和煙火動畫
                    this.showCenterFeedback('🎉', '#4CAF50', '答對了！');
                    document.getElementById('correct-sound')?.play();
                    this.startFireworksAnimation();
                    
                    // 等待煙火動畫播放一些時間後，播放成功語音
                    Game.TimerManager.setTimeout(() => {
                        // 🔧 [修正] 使用傳統中文貨幣格式進行語音播放
                        const traditionalTotal = this.convertToTraditionalCurrency(this.state.correctTotal);
                        // 🔧 [新增] 防重複題目機制：記錄當前題目的總額
                        this.state.lastTotal = this.state.correctTotal;
                        Game.Debug.log('speech', '🎙️ [C2-語音] 簡單模式播放成功語音');
                        this.speak(`太棒了，你數完了，總共是 ${traditionalTotal}`, () => {
                            // 語音播放完畢後直接進入下題
                            Game.TimerManager.setTimeout(() => {
                                this.hideCenterFeedback();
                                this.loadNextQuestion();
                            }, 1000, 'question');
                        });
                    }, 1000, 'speech'); // 等待煙火動畫播放1秒
                }, 500);
            } else if (difficulty === 'normal') {
                // 普通模式：選擇題方式，隱藏金額後顯示3個選項
                Game.TimerManager.setTimeout(() => {
                    const hintAmount = document.getElementById('hint-total-amount');
                    if (hintAmount) {
                        hintAmount.textContent = '？？？';
                    }
                    // 播放語音提示後顯示選項
                    this.speak('請選擇正確的金額', () => {
                        this.showOptions();
                    });
                }, 500);
            } else {
                // 困難模式：數字輸入方式
                Game.TimerManager.setTimeout(() => {
                    const hintAmount = document.getElementById('hint-total-amount');
                    if (hintAmount) {
                        hintAmount.textContent = '？？？';
                    }
                    // 播放語音提示後顯示數字選擇器
                    this.speak('請輸入數錢的金額', () => {
                        this.showNumberInput();
                    });
                }, 500);
            }
        },


        // 顯示總計提示
        showTotalHint() {
            const hintAmount = document.getElementById('hint-total-amount');
            const totalDisplay = document.querySelector('.total-display');

            if (hintAmount && totalDisplay) {
                // 顯示實際金額
                hintAmount.textContent = this.state.correctTotal;
                // 添加提示樣式
                totalDisplay.classList.add('hint-shown');

                // 播放語音
                const traditionalTotal = this.convertToTraditionalCurrency(this.state.correctTotal);
                this.speak(`總計金額是 ${traditionalTotal}`, () => {
                    // 播放完語音後恢復為 ？？？
                    Game.TimerManager.setTimeout(() => {
                        if (totalDisplay && hintAmount) {
                            totalDisplay.classList.remove('hint-shown');
                            hintAmount.textContent = '？？？';
                        }
                    }, 1000);
                });
            }
        },

        showOptions() {
            // 🔧 [修正] 防止重複選項：先檢查並移除現有的選項容器
            const existingOptions = this.elements.questionArea.querySelector('.options-container');
            if (existingOptions) {
                existingOptions.remove();
                Game.Debug.log('option', '🧹 [C2-選項] 移除重複的選項容器');
            }

            const correct = this.state.correctTotal;
            let wrong1, wrong2;

            do {
                const offset1 = (Math.floor(Math.random() * 4) + 1) * 5;
                wrong1 = Math.random() > 0.5 ? correct + offset1 : correct - offset1;
            } while (wrong1 === correct || wrong1 < 0);

            do {
                const offset2 = (Math.floor(Math.random() * 4) + 1) * 10;
                wrong2 = Math.random() > 0.5 ? correct + offset2 : correct - offset2;
            } while (wrong2 === correct || wrong2 < 0 || wrong2 === wrong1);

            const options = this.shuffleArray([correct, wrong1, wrong2]);
            
            Game.Debug.log('option', '🎯 [C2-選項] 生成選項:', { correct, wrong1, wrong2, shuffled: options });
            
            // 創建選項區域
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'options-container';
            optionsContainer.innerHTML = '<h3>請選擇正確答案</h3>';
            
            const buttonsWrapper = document.createElement('div');
            buttonsWrapper.className = 'options-buttons';
            
            options.forEach(optionValue => {
                const button = document.createElement('button');
                button.className = 'option-btn';
                button.textContent = `${optionValue} 元`;
                button.dataset.value = optionValue;
                Game.EventManager.on(button, 'click', (e) => this.checkAnswer(e), {}, 'gameUI');
                // 添加觸控事件支持
                Game.EventManager.on(button, 'touchend', (e) => {
                    e.preventDefault();
                    Game.Debug.log('answer', '🎯 [C2-選項] 觸控選擇答案:', optionValue);
                    this.checkAnswer(e);
                }, { passive: false }, 'gameUI');

                const speakOptionText = () => {
                    if (this.state.isAnswering) return;
                    this.speak(button.textContent);
                };

                Game.EventManager.on(button, 'mouseenter', speakOptionText, {}, 'gameUI');
                Game.EventManager.on(button, 'touchstart', (e) => {
                    e.preventDefault();
                    speakOptionText();
                }, { passive: false }, 'gameUI');

                buttonsWrapper.appendChild(button);
            });
            
            optionsContainer.appendChild(buttonsWrapper);
            this.elements.questionArea.appendChild(optionsContainer);
            
            Game.Debug.log('counting', '✅ [C2-選項] 選項容器已添加到問題區域');
        },

        showNumpad() {
            this.showNumberInput();
        },

        // 🎯 [F6標準] 顯示數字輸入器（3x4網格，內聯樣式）
        showNumberInput(title = '請輸入總金額', callback = null, cancelCallback = null) {
            if (document.getElementById('number-input-popup')) return;

            // Use checkNumpadAnswer as default callback if none provided
            if (!callback) {
                callback = (value) => this.checkNumpadAnswer(value);
            }

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

        checkNumpadAnswer(inputValue) {
            // 🔧 [防連點] 檢查是否正在處理答題
            if (this.state.isAnswering) {
                Game.Debug.log('counting', '[C2] 防抖：checkNumpadAnswer 忽略重複點擊');
                return false;
            }
            this.state.isAnswering = true;

            const userAnswer = parseInt(inputValue, 10) || 0;
            const isCorrect = userAnswer === this.state.correctTotal;
            const { mode } = this.state.settings;

            // 顯示回饋訊息
            this.elements.feedbackArea.style.display = 'block';

            if (isCorrect) {
                this.state.score++;
                this.showCenterFeedback('🎉', '#4CAF50', '答對了！');
                document.getElementById('correct-sound')?.play();
                this.startFireworksAnimation();

                // 🔧 [修正] 使用傳統中文貨幣格式進行語音播放
                const traditionalTotal = this.convertToTraditionalCurrency(this.state.correctTotal);
                // 🔧 [新增] 防重複題目機制：記錄當前題目的總額
                this.state.lastTotal = this.state.correctTotal;

                // 判斷是否為最後一題
                const isLastQuestion = this.state.currentQuestionIndex >= this.state.totalQuestions;
                const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                this.speak(`恭喜你答對了，總共是 ${traditionalTotal}，${endingText}`, () => {
                    Game.TimerManager.setTimeout(() => {
                        this.hideCenterFeedback();
                        this.loadNextQuestion();
                    }, 1200);
                });
            } else {
                document.getElementById('error-sound')?.play();

                if (mode === 'retry') {
                    this.showCenterFeedback('❌', '#f44336', '答錯了，再試一次！');

                    this.speak('答錯了，再試一次', () => {
                        Game.TimerManager.setTimeout(() => {
                            this.hideCenterFeedback();
                            this.elements.feedbackArea.style.display = 'none';
                            this.state.isAnswering = false;
                            this.resetCounting();
                        }, 1500);
                    });
                } else {
                    // 判斷是否為最後一題
                    const isLastQuestion = this.state.currentQuestionIndex >= this.state.totalQuestions;
                    const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                    const feedbackText = `對不起你答錯了，正確答案是 ${this.state.correctTotal}元，${endingText}`;
                    this.showCenterFeedback('❌', '#f44336', `答錯了，正確答案是 ${this.state.correctTotal}元`);
                    // 🔧 [新增] 防重複題目機制：記錄當前題目的總額
                    this.state.lastTotal = this.state.correctTotal;

                    this.speak(feedbackText, () => {
                        Game.TimerManager.setTimeout(() => {
                            this.hideCenterFeedback();
                            this.loadNextQuestion();
                        }, 2000);
                    });
                }
            }

            // Return true to close the number input popup
            return true;
        },

        checkAnswer(event) {
            // 🔧 [防連點] 檢查是否正在處理答題
            if (this.state.isAnswering) {
                Game.Debug.log('counting', '[C2] 防抖：checkAnswer 忽略重複點擊');
                return;
            }
            this.state.isAnswering = true;

            // 🔧 立即停止選項名稱的語音播放，避免與反饋語音衝突
            if (this.speech.synth && this.speech.synth.speaking) {
                Game.Debug.log('speech', '🎙️ [C2-答案檢查] 停止選項語音播放');
                this.speech.synth.cancel();
            }
            const selectedBtn = event.currentTarget;
            const selectedValue = parseInt(selectedBtn.dataset.value, 10);
            const isCorrect = selectedValue === this.state.correctTotal;
            const { mode } = this.state.settings;

            document.querySelectorAll('.option-btn')
                .forEach(btn => btn.disabled = true);

            if (isCorrect) {
                this.state.score++;
                selectedBtn.classList.add('correct-option');

                // 顯示中央回饋
                this.showCenterFeedback('🎉', '#4CAF50', '答對了！');
                document.getElementById('correct-sound')?.play();
                this.startFireworksAnimation();

                // 🔧 [修正] 使用傳統中文貨幣格式進行語音播放
                const traditionalTotal = this.convertToTraditionalCurrency(this.state.correctTotal);
                // 🔧 [新增] 防重複題目機制：記錄當前題目的總額
                this.state.lastTotal = this.state.correctTotal;

                // 判斷是否為最後一題
                const isLastQuestion = this.state.currentQuestionIndex >= this.state.totalQuestions;
                const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                this.speak(`恭喜你答對了，總共是 ${traditionalTotal}，${endingText}`, () => {
                    Game.TimerManager.setTimeout(() => {
                        this.hideCenterFeedback();
                        this.loadNextQuestion();
                    }, 1200);
                });
            } else {
                // 🔧 答错时不添加红色高亮类，改用红色×标记
                document.getElementById('error-sound')?.play();

                if (mode === 'retry') {
                    selectedBtn.classList.add('incorrect-option');
                    this.showCenterFeedback('❌', '#f44336', '答錯了，再試一次！');

                    this.speak('答錯了，再試一次', () => {
                        Game.TimerManager.setTimeout(() => {
                            selectedBtn.classList.remove('incorrect-option');
                            document.querySelectorAll('.option-btn')
                                .forEach(btn => btn.disabled = false);
                            this.hideCenterFeedback();
                            this.state.isAnswering = false;
                            this.resetCounting();
                        }, 1500);
                    });
                } else {
                    // 🔧 單次作答模式：分兩段顯示錯誤和正確答案

                    // 🔧 禁用錯誤選項的藍色高亮效果
                    selectedBtn.classList.add('no-highlight');

                    // 🔧 第一段：在錯誤選項上顯示紅色×
                    const wrongMark = document.createElement('div');
                    wrongMark.className = 'wrong-cross-mark';
                    wrongMark.innerHTML = '×';
                    selectedBtn.appendChild(wrongMark);

                    // 🔧 第一段語音：告知選擇錯誤
                    const firstSpeech = `對不起你答錯了，你選擇的是${selectedValue}元`;

                    this.speak(firstSpeech, () => {
                        // 第一段語音完成後，進入第二段

                        // 🔧 第二段：在正確答案上顯示綠色✓
                        const correctBtn = document
                            .querySelector(`[data-value="${this.state.correctTotal}"]`);

                        if (correctBtn) {
                            // 🔧 不添加 correct-option 類，避免影響其他選項的顯示

                            const checkMark = document.createElement('div');
                            checkMark.className = 'correct-check-mark';
                            checkMark.innerHTML = '✓';
                            correctBtn.appendChild(checkMark);
                        }

                        // 🔧 第二段語音：告知正確答案
                        const isLastQuestion = this.state.currentQuestionIndex >= this.state.totalQuestions;
                        const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                        const secondSpeech = `${this.state.correctTotal}元才是正確答案，${endingText}`;

                        // 🔧 [新增] 防重複題目機制：記錄當前題目的總額
                        this.state.lastTotal = this.state.correctTotal;

                        this.speak(secondSpeech, () => {
                            Game.TimerManager.setTimeout(() => {
                                this.loadNextQuestion();
                            }, 1500);
                        });
                    });
                }
            }
        },
        
        resetCounting() {
            this.state.runningTotal = 0;
            this.state.countedItems = 0;
            document.querySelectorAll('.countable-item').forEach(item => {
                item.classList.remove('counted');
                // 移除數數字
                const countNumber = item.querySelector('.count-number');
                if (countNumber) {
                    countNumber.remove();
                }
            });
            // 重置提示數字框顯示
            const hintAmount = document.getElementById('hint-total-amount');
            if (hintAmount) {
                hintAmount.textContent = '0';
            }
        },

        // =====================================================
        // 通用工具函式
        // =====================================================
        updateProgress() {
            const progressInfo = document.querySelector('.progress-info');
            if (progressInfo) {
                progressInfo.textContent = `第 ${this.state.currentQuestionIndex} / ${this.state.totalQuestions} 題`;
            }
        },

        endGame() {
            if (this.state.isEndingGame) { Game.Debug.log('state', '⚠️ [C2] endGame 已執行過，忽略重複呼叫'); return; }
            this.state.isEndingGame = true;
            AssistClick.deactivate();

            const gameContainer = document.getElementById('app');
            const correctCount = this.state.score;
            const totalQuestions = this.state.totalQuestions;
            const percentage = Math.round((correctCount / totalQuestions) * 100);

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'c2', unitName: 'C2 金錢的點數與加總', series: 'C',
                score: correctCount, total: totalQuestions, difficulty: this.state.settings?.difficulty,
                durationSec: this.state.startTime ? Math.floor((Date.now() - this.state.startTime) / 1000) : 0 });

            // 計算完成時間
            const endTime = Date.now();
            const elapsedMs = this.state.startTime ? (endTime - this.state.startTime) : 0;
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
                                <div class="result-value">${correctCount} / ${totalQuestions}</div>
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
                                <div class="achievement-item">🎯 學會逐一點數錢幣金額</div>
                                <div class="achievement-item">💰 掌握累計加總技巧</div>
                                <div class="achievement-item">📝 練習不同組合的金額計算</div>
                            </div>
                        </div>

                        <div class="result-buttons">
                            <button class="play-again-btn" onclick="Game.start()">
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
                this.triggerConfetti();

                let finalText = '';
                if (percentage === 100) {
                    finalText = `太厲害了，全部答對了！`;
                } else if (percentage >= 80) {
                    finalText = `很棒喔，答對了${correctCount}題！`;
                } else if (percentage >= 60) {
                    finalText = `不錯喔，答對了${correctCount}題！`;
                } else {
                    finalText = `要再加油喔，答對了${correctCount}題。`;
                }
                this.speak(finalText);
            }, 100);
        },

        // =====================================================
        // 🎆 煙火動畫系統（與F4統一）
        // =====================================================
        startFireworksAnimation() {
            Game.Debug.log('state', '🎆 開始煙火動畫');
            
            // 🎆 使用canvas-confetti效果（兩波）
            if (window.confetti) {
                Game.Debug.log('state', '🎆 觸發canvas-confetti慶祝效果');
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
                Game.Debug.log('state', '🎆 canvas-confetti不可用');
            }
        },

        triggerConfetti() {
            if (typeof confetti !== 'function') return;
            
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { 
                startVelocity: 30, 
                spread: 360, 
                ticks: 60, 
                zIndex: 1001 
            };
            const randomInRange = (min, max) => Math.random() * (max - min) + min;
            
            const fireConfetti = () => {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return;
                const particleCount = 50 * (timeLeft / duration);
                confetti({
                    ...defaults,
                    particleCount,
                    origin: {
                        x: randomInRange(0.1, 0.3),
                        y: Math.random() - 0.2
                    }
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: {
                        x: randomInRange(0.7, 0.9),
                        y: Math.random() - 0.2
                    }
                });
                Game.TimerManager.setTimeout(fireConfetti, 250, 'confetti');
            };
            fireConfetti();
        },

        speak(text, callback) {
            this.speech.speak(text, callback);
        },

        getRandomImage(item) {
            if (!item.images || !item.images.front || !item.images.back) {
                return item.img || '';
            }
            return Math.random() < 0.5 ? item.images.front : item.images.back;
        },

        shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
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
            // C2 easy: click all uncounted coin items one by one
            const items = Array.from(document.querySelectorAll('.countable-item:not(.counted)'));
            if (items.length === 0) return;
            this._queue = items.map(item => ({ target: item, action: () => item.click() }));
            this._step = 0;
            this._highlight(this._queue[0].target);
        },

        _executeStep() {
            if (!this._enabled || this._step >= this._queue.length) return;
            const step = this._queue[this._step];
            this._clearHighlight();
            this._step++;
            if (step && step.action) step.action();
            // Highlight next item if there are more
            if (this._step < this._queue.length) {
                window.setTimeout(() => {
                    if (this._enabled && this._step < this._queue.length) {
                        this._highlight(this._queue[this._step].target);
                    }
                }, 150);
            } else {
                this._queue = []; this._step = 0;
            }
        },

        _startObserver() {
            const app = document.getElementById('app');
            if (!app) return;
            let t = null;
            this._observer = new MutationObserver(() => {
                if (!this._enabled || this._queue.length > 0) return;
                if (t) window.clearTimeout(t);
                t = window.setTimeout(() => {
                    if (this._enabled && document.querySelectorAll('.countable-item').length > 0) {
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

    Game.init();
});
