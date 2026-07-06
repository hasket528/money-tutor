// =================================================================
// FILE: js/c1_money_types.js - 單元C1：金錢的種類與面額
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
        // 🐛 Debug System - FLAGS 分類開關系統
        // =====================================================
        // 使用方式：
        //   Game.Debug.FLAGS.all = true;      // 開啟全部
        //   Game.Debug.FLAGS.speech = true;   // 只開啟語音相關
        //   Game.Debug.FLAGS.question = true; // 只開啟題目相關
        // =====================================================
        Debug: {
            FLAGS: {
                all: false,        // 全域開關（開啟後顯示所有分類）
                init: false,       // 初始化相關
                speech: false,     // 語音系統
                audio: false,      // 音效系統
                ui: false,         // UI 渲染
                question: false,   // 題目生成
                state: false,      // 狀態變更
                answer: false,     // 答案檢查
                error: true        // 錯誤訊息（預設開啟）
            },

            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[C1-${category}]`, ...args);
                }
            },

            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[C1-${category}]`, ...args);
                }
            },

            error(...args) {
                // 錯誤訊息永遠顯示
                console.error('[C1-ERROR]', ...args);
            }
        },

        // =====================================================
        // TimerManager: 統一管理所有 setTimeout
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
                Game.Debug.log('timer', 'TimerManager.clearAll() called');
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
                if (count > 0) Game.Debug.log('timer', 'cleared ' + count + ' in: ' + category);
            }
        },

        // =====================================================
        // EventManager: 統一管理所有 addEventListener
        // =====================================================
        EventManager: {
            listeners: [],

            on(element, type, handler, options = {}, category = 'default') {
                if (!element) return -1;
                element.addEventListener(type, handler, options);
                return this.listeners.push({ element, type, handler, options, category }) - 1;
            },

            removeAll() {
                Game.Debug.log('event', 'EventManager.removeAll() count: ' + this.listeners.length);
                this.listeners.forEach(l => {
                    if (l && l.element) { try { l.element.removeEventListener(l.type, l.handler, l.options); } catch(e) {} }
                });
                this.listeners = [];
            },

            removeByCategory(category) {
                let count = 0;
                this.listeners.forEach((l, i) => {
                    if (l && l.category === category && l.element) {
                        try { l.element.removeEventListener(l.type, l.handler, l.options); } catch(e) {}
                        this.listeners[i] = null;
                        count++;
                    }
                });
                if (count > 0) Game.Debug.log('event', 'cleared ' + count + ' in: ' + category);
            }
        },
        // =====================================================
        // 資料
        // =====================================================
        gameData: {
            title: "單元C1：金錢的種類與面額",
            subtitle: "認識常用的硬幣與紙鈔，了解各種面額的價值",
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
                        value: 200, 
                        name: '200元', 
                        images: { 
                            front: '../images/money/200_yuan_front.png', 
                            back: '../images/money/200_yuan_back.png' 
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
                    },
                    { 
                        value: 2000, 
                        name: '2000元', 
                        images: { 
                            front: '../images/money/2000_yuan_front.png', 
                            back: '../images/money/2000_yuan_back.png' 
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
            startTime: null,  // 🔧 [新增] 遊戲開始時間
            settings: {
                category: null,
                difficulty: null,
                mode: null,
                questionCount: null,
                assistClick: false
            }
        },

        // =====================================================
        // DOM 元素
        // =====================================================
        elements: {},

        // =====================================================
        // 語音 - 採用F1先進語音系統
        // =====================================================
        speech: {
            synth: window.speechSynthesis,
            voice: null,
            isReady: false,

            init() {
            // [Phase 1] 清理所有計時器與事件監聽器
            Game.TimerManager.clearAll();
            Game.EventManager.removeAll();

                Game.Debug.log('speech', '🎙️ [C1-語音] 初始化語音系統');
                
                let voiceInitAttempts = 0;
                const maxAttempts = 5;
                
                const setVoice = () => {
                    const voices = this.synth.getVoices();
                    voiceInitAttempts++;
                    
                    Game.Debug.log('speech', '🎙️ [C1-語音] 取得語音列表', {
                        voiceCount: voices.length,
                        attempt: voiceInitAttempts,
                        allVoices: voices.map(v => ({ name: v.name, lang: v.lang }))
                    });
                    
                    if (voices.length === 0) {
                        if (voiceInitAttempts < maxAttempts) {
                            Game.Debug.log('speech', '🎙️ [C1-語音] 語音列表為空，將重試');
                            Game.TimerManager.setTimeout(setVoice, 500, 'speech')
                        } else {
                            Game.Debug.log('speech', '🎙️ [C1-語音] 手機端無語音，啟用靜音模式');
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
                        Game.Debug.log('speech', '🎙️ [C1-語音] 語音準備就緒', {
                            voiceName: this.voice.name,
                            lang: this.voice.lang,
                            attempt: voiceInitAttempts
                        });
                    } else {
                        Game.Debug.log('speech', '🎙️ [C1-語音] 未找到中文語音', {
                            availableLanguages: [...new Set(voices.map(v => v.lang))],
                            totalVoices: voices.length
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
                        Game.Debug.log('speech', '🎙️ [C1-語音] 延遲重試語音初始化');
                        setVoice();
                    }
                }, 1000, 'speech')
            },

            speak(text, callback) {
                Game.Debug.log('speech', '🎙️ [C1-語音] 嘗試播放語音', {
                    text,
                    isReady: this.isReady,
                    audioUnlocked: Game.state.audioUnlocked,
                    voiceName: this.voice?.name
                });
                
                // 🔧 [新增] 手機端音頻解鎖檢查
                if (!Game.state.audioUnlocked) {
                    Game.Debug.log('speech', '🎙️ [C1-語音] ⚠️ 音頻權限未解鎖，跳過語音播放');
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'ui')
                    return;
                }
                
                // 停止所有正在播放的語音，防止重疊和多重回調
                if (this.synth.speaking) {
                    Game.Debug.log('speech', '🎙️ [C1-語音] 停止之前的語音播放');
                    this.synth.cancel();
                }
                
                if (!this.isReady || !text) {
                    Game.Debug.log('speech', '🎙️ [C1-語音] 語音系統未就緒或文字為空', { isReady: this.isReady, hasText: !!text });
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'ui')
                    return;
                }

                // 🔧 [手機端修復] 檢查語音是否可用
                if (!this.voice) {
                    Game.Debug.log('speech', '🎙️ [C1-語音] 手機端無語音，跳過語音播放');
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'ui')
                    return;
                }

                Game.Debug.log('speech', '🎙️ [C1-語音] 開始播放語音', {
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
                                Game.Debug.log('speech', '🎙️ [C1-語音] 語音播放完成，執行回調');
                                callback();
                            }
                        };
                        
                        // 監聽語音播放結束事件
                        utterance.onend = safeCallback;
                        utterance.onerror = (e) => {
                            Game.Debug.log('speech', '🎙️ [C1-語音] 語音播放錯誤', e);
                            safeCallback();
                        };
                        
                        // 安全措施：最多等待10秒
                        Game.TimerManager.setTimeout(safeCallback, 10000, 'ui')
                    }
                    
                    this.synth.speak(utterance);
                    Game.Debug.log('speech', '🎙️ [C1-語音] 語音已提交播放');
                } catch (error) {
                    Game.Debug.error('🎙️ [C1-語音] 語音播放異常', error);
                    safeCallback();
                }
            }
        },

        // =====================================================
        // 音頻解鎖系統 - 採用F1系統
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
                Game.Debug.log('audio', '🔓 [C1-音頻] 音頻權限解鎖成功');
                
                return true;
            } catch (error) {
                Game.Debug.log('audio', '⚠️ [C1-音頻] 音頻解鎖失敗，但繼續執行', error);
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
            this.speech.init();
            this.initAudio();
            this.injectGlobalAnimationStyles();
            this.showSettings();
        },

        injectGlobalAnimationStyles() {
            if (document.getElementById('c1-global-animations')) return;

            const style = document.createElement('style');
            style.id = 'c1-global-animations';
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
        // 設定畫面 (採用unit6樣式結構)
        // =====================================================
        showSettings() {
            AssistClick.deactivate();
            // [Phase 1] 清理遊戲計時器與事件監聽器
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');

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
                                    啟用後，只要偵測到點擊，系統會自動依序完成辨認並點選正確錢幣等所有操作。適合手部控制能力較弱的學習者使用。<br>
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
                                    <button class="selection-btn ${settings.questionCount !== null && ![1, 3, 5, 10].includes(settings.questionCount) ? 'active' : ''}"
                                            data-type="questions" data-value="custom">
                                        自訂
                                    </button>
                                </div>
                                <div class="custom-question-display" style="display: ${settings.questionCount !== null && ![1, 3, 5, 10].includes(settings.questionCount) ? 'block' : 'none'}; margin-top: 10px;">
                                    <input type="text" id="custom-question-count-c1"
                                           value="${settings.questionCount !== null && ![1, 3, 5, 10].includes(settings.questionCount) ? settings.questionCount + '題' : ''}"
                                           placeholder="請輸入題數"
                                           style="padding: 8px; border-radius: 5px; border: 2px solid ${settings.questionCount !== null && ![1, 3, 5, 10].includes(settings.questionCount) ? '#667eea' : '#ddd'}; background: ${settings.questionCount !== null && ![1, 3, 5, 10].includes(settings.questionCount) ? '#667eea' : 'white'}; color: ${settings.questionCount !== null && ![1, 3, 5, 10].includes(settings.questionCount) ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                                           readonly onclick="Game.handleCustomQuestionClick()">
                                </div>
                            </div>
                            
                            <div class="setting-group" id="mode-setting-group">
                                <label>📋 測驗模式：</label>
                                <div class="button-group" id="mode-buttons-group" style="${settings.assistClick ? 'opacity:0.4;pointer-events:none;' : ''}">
                                    <button class="selection-btn ${settings.mode === 'retry' ? 'active' : ''}"
                                            data-type="mode" data-value="retry">
                                        反複作答
                                    </button>
                                    <button class="selection-btn ${settings.mode === 'proceed' ? 'active' : ''}"
                                            data-type="mode" data-value="proceed">
                                        單次作答
                                    </button>
                                </div>
                                ${settings.assistClick ? '<p style="color:#999;font-size:0.9em;margin-top:8px;">輔助點擊模式為單次作答，且皆為答對</p>' : ''}
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
            Game.EventManager.on(gameSettings, 'click', this.handleSelection.bind(this), {}, 'settings')

            // 👆 輔助點擊開關
            const assistOn = document.getElementById('assist-click-on');
            const assistOff = document.getElementById('assist-click-off');
            const modeGroup = document.getElementById('mode-setting-group');
            const modeButtonsGroup = document.getElementById('mode-buttons-group');
            const updateModeGroupState = (assistEnabled) => {
                if (modeButtonsGroup) {
                    modeButtonsGroup.style.opacity = assistEnabled ? '0.4' : '';
                    modeButtonsGroup.style.pointerEvents = assistEnabled ? 'none' : '';
                }
                // 更新提示文字
                let hint = modeGroup ? modeGroup.querySelector('.assist-mode-hint') : null;
                if (assistEnabled) {
                    if (!hint && modeGroup) {
                        hint = document.createElement('p');
                        hint.className = 'assist-mode-hint';
                        hint.style.cssText = 'color:#999;font-size:0.9em;margin-top:8px;';
                        hint.textContent = '輔助點擊模式為單次作答，且皆為答對';
                        modeGroup.appendChild(hint);
                    }
                } else {
                    if (hint) hint.remove();
                }
                this.updateStartButton();
            };
            if (assistOn) {
                Game.EventManager.on(assistOn, 'click', (e) => {
                    e.stopPropagation();
                    this.state.settings.assistClick = true;
                    assistOn.classList.add('active');
                    assistOff?.classList.remove('active');
                    updateModeGroupState(true);
                }, {}, 'settings');
            }
            if (assistOff) {
                Game.EventManager.on(assistOff, 'click', (e) => {
                    e.stopPropagation();
                    this.state.settings.assistClick = false;
                    assistOff.classList.add('active');
                    assistOn?.classList.remove('active');
                    updateModeGroupState(false);
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
                }, {}, 'settings')
            }

            // 📝 作業單連結事件
            const worksheetLink = document.getElementById('settings-worksheet-link');
            if (worksheetLink) {
                Game.EventManager.on(worksheetLink, 'click', (e) => {
                    e.preventDefault();
                    // 作業單使用自己的預設值與工具列設定，不受遊戲設定影響
                    const params = new URLSearchParams({ unit: 'c1' });
                    window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
                }, {}, 'settings')
            }

            const startBtn = app.querySelector('#start-quiz-btn');
            Game.EventManager.on(startBtn, 'click', this.start.bind(this), {}, 'settings')
            
            // 更新開始按鈕狀態
            this.updateStartButton();
        },

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
                    this.state.totalQuestions = parseInt(value);
                    this.hideCustomQuestionInput();

                    // 🔧 [新增] 選擇預設題數時，隱藏自訂輸入框
                    const customDisplay = document.querySelector('.custom-question-display');
                    const customInput = document.getElementById('custom-question-count-c1');
                    if (customDisplay && customInput) {
                        customDisplay.style.display = 'none';
                        customInput.value = '';
                        customInput.style.background = 'white';
                        customInput.style.color = '#333';
                        customInput.style.borderColor = '#ddd';
                    }
                }
            } else {
                this.state.settings[type] = value;

                // 更新難度說明文字
                if (type === 'difficulty') {
                    this.updateDifficultyDescription(value);
                    // 顯示/隱藏輔助點擊開關
                    const assistGroup = document.getElementById('assist-click-group');
                    if (assistGroup) {
                        assistGroup.style.display = value === 'easy' ? 'block' : 'none';
                        if (value !== 'easy') this.state.settings.assistClick = false;
                    }
                }
            }

            // 更新同組按鈕的active狀態
            const buttonGroup = btn.closest('.button-group');
            buttonGroup.querySelectorAll('.selection-btn')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 檢查是否所有必要設定都已完成
            this.updateStartButton();
        },

        // 取得難度說明文字
        getDifficultyDescription(difficulty) {
            const descriptions = {
                easy: '簡單：看圖片選擇正確錢幣種類。',
                normal: '普通：看文字選擇正確錢幣種類。',
                hard: '困難：聽聲音選擇正確錢幣種類。'
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
                const customInput = document.getElementById('custom-question-count-c1');
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
            const { category, difficulty, mode, questionCount, assistClick } = this.state.settings;
            const startBtn = document.getElementById('start-quiz-btn');
            // 輔助點擊模式：mode 不是必要條件（固定為單次作答且皆答對）
            const modeOk = assistClick ? true : !!mode;
            if (category && difficulty && modeOk && questionCount) {
                startBtn.disabled = false;
                startBtn.textContent = '開始測驗！';
                startBtn.classList.remove('disabled');
            } else {
                startBtn.disabled = true;
                startBtn.textContent = '請完成所有選擇';
                startBtn.classList.add('disabled');
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
            this.state.isEndingGame = false;
            Game.Debug.log('state', '🔄 [C1] 遊戲狀態已重置');
        },

        // =====================================================
        // 遊戲流程
        // =====================================================
        start() {
            // [Phase 1] 清理上一場遊戲殘留計時器
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');

            Game.Debug.log('speech', '🎯 [C1-遊戲] 開始測驗，解鎖音頻並播放歡迎語音');

            // 🔧 [修復] 確保音頻已解鎖
            this.unlockAudio();

            // 🔧 [重構] 使用統一重置函數
            this.resetGameState();
            this.state.startTime = Date.now();  // 記錄遊戲開始時間
            window.LearningTracker?.resetWrong?.();   // 學習紀錄：錯誤/逐題計數歸零
            this.generateQuestions();
            this.setupQuizUI();
            if (this.state.settings.difficulty === 'easy' && this.state.settings.assistClick) {
                AssistClick.activate();
            }

            // 🔧 [新增] 播放測驗開始語音，類似F1的initialInstruction
            const { difficulty, category } = this.state.settings;
            let welcomeText = '';
            
            if (difficulty === 'easy') {
                welcomeText = '請看圖片，選出一樣的錢幣或紙鈔';
            } else if (difficulty === 'normal') {
                welcomeText = '請看文字，選出對應的錢幣或紙鈔';
            } else if (difficulty === 'hard') {
                welcomeText = '請聽聲音，選出對應的錢幣或紙鈔';
            }
            
            Game.Debug.log('speech', '🎙️ [C1-遊戲] 播放測驗開始語音:', welcomeText);
            
            // 延遲播放，讓UI完全載入
            Game.TimerManager.setTimeout(() => {
                this.speech.speak(welcomeText, () => {
                    Game.Debug.log('speech', '🎙️ [C1-遊戲] 歡迎語音完成，開始載入第一題');
                    this.loadNextQuestion();
                });
            }, 500, 'question')
        },

        setupQuizUI() {
            const gameContainer = document.getElementById('app');
            gameContainer.innerHTML = `
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
                        <h3 id="options-title" class="section-title" style="display: none;">請選擇正確答案</h3>
                        <div id="options-area" class="product-selection-area"></div>
                    </div>
                </div>
            `;
            
            this.elements.questionArea = document.getElementById('question-area');
            this.elements.optionsArea = document.getElementById('options-area');
            this.elements.feedbackArea = document.getElementById('feedback-area');
            
            // 綁定返回設定按鈕事件
            const backBtn = document.querySelector('#back-to-menu-btn');
            if (backBtn) {
                Game.EventManager.on(backBtn, 'click', () => {
                    Game.showSettings();
                }, {}, 'gameUI')
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
            this.elements.optionsArea.innerHTML = '';
            this.elements.feedbackArea.innerHTML = '';
            this.elements.feedbackArea.style.display = 'none';
            
            // 隱藏選項標題
            const optionsTitle = document.getElementById('options-title');
            if (optionsTitle) {
                optionsTitle.style.display = 'none';
            }
            
            // 確保清除之前的中央回饋
            this.hideCenterFeedback();

            const { difficulty } = this.state.settings;
            // 🔧 [修正] 使用傳統中文貨幣格式進行語音播放
            const traditionalCurrencyName = this.convertToTraditionalCurrency(question.answer.value);
            const questionText = `請找出 ${traditionalCurrencyName}`;
            const questionImage = this.getRandomImage(question.answer);

            // 🔧 [調試] 記錄題目渲染信息
            Game.Debug.log('question', '🎯 [C1-題目渲染]', {
                difficulty,
                questionText,
                answerName: question.answer.name,
                optionsCount: question.options.length
            });
            
            switch (difficulty) {
                case 'easy':
                    this.elements.questionArea.innerHTML = `
                        <h2 class="section-title">請找出相同的錢幣/紙鈔</h2>
                        <div class="target-item-display">
                            <img src="${questionImage}" alt="題目" class="target-money-img">
                        </div>
                    `;
                    break;
                case 'normal':
                    this.elements.questionArea.innerHTML = `
                        <h2 class="section-title">請找出以下錢幣/紙鈔</h2>
                        <div class="target-item-display">
                            <div class="item-details">
                                <div style="display:inline-flex; align-items:center; gap:12px;">
                                    <div class="item-name">${question.answer.name}</div>
                                    <svg id="replay-audio-btn-normal" class="replay-icon" style="width:36px;height:36px;margin-bottom:0;flex-shrink:0;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    `;
                    Game.EventManager.on(document.getElementById('replay-audio-btn-normal'), 'click', () => {
                        this.speak(questionText);
                    }, {}, 'gameUI')
                    break;
                case 'hard':
                    this.elements.questionArea.innerHTML = `
                        <h2 class="section-title">請聽音找出錢幣/紙鈔</h2>
                        <div class="target-item-display">
                            <svg id="replay-audio-btn" class="replay-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
                            </svg>
                            <p class="target-hint">點擊播放按鈕聽題目</p>
                        </div>
                    `;
                    Game.EventManager.on(document.getElementById('replay-audio-btn'), 'click', () => {
                        this.speak(questionText);
                    }, {}, 'gameUI')
                    break;
            }
            
            this.speak(questionText, () => {
                this.renderOptions(question.options, questionImage, question.answer);
            });
        },

        generateQuestions() {
            const { category } = this.state.settings;
            let sourceData;
            
            if (category === 'mixed') {
                sourceData = [...this.gameData.items.coins, ...this.gameData.items.notes];
            } else {
                sourceData = this.gameData.items[category];
            }
            
            this.state.quizQuestions = [];

            // 🔧 [Bug#2修正] 動態計算選項數量，硬幣模式只有4種面額時顯示4個選項
            const minOptionsNeeded = Math.min(sourceData.length, 5);
            
            for (let i = 0; i < this.state.totalQuestions; i++) {
                const allItems = [...sourceData];
                const correctItem = allItems.splice(
                    Math.floor(Math.random() * allItems.length), 1
                )[0];
                
                let options = [correctItem];
                
                // 🔧 [修復] 改進選項生成邏輯，確保不重複
                const remainingItems = allItems.filter(item => item.value !== correctItem.value);
                
                while (options.length < minOptionsNeeded && remainingItems.length > 0) {
                    const randomIndex = Math.floor(Math.random() * remainingItems.length);
                    const wrongOption = remainingItems.splice(randomIndex, 1)[0];
                    
                    // 雙重檢查確保不重複
                    if (!options.some(opt => opt.value === wrongOption.value && opt.name === wrongOption.name)) {
                        options.push(wrongOption);
                    }
                }
                
                // 🔧 [調試] 記錄生成的選項
                Game.Debug.log('question', `🎯 [C1-題目生成] 第${i+1}題選項:`, options.map(opt => opt.name));
                
                this.state.quizQuestions.push({
                    answer: correctItem,
                    options: this.shuffleArray(options)
                });
            }
        },

        renderOptions(options, questionImage, correctAnswer) {
            // 🔧 [調試] 記錄選項渲染信息
            Game.Debug.log('question', '🎯 [C1-選項渲染]', {
                optionsCount: options.length,
                options: options.map(opt => ({ name: opt.name, value: opt.value })),
                correctAnswer: { name: correctAnswer.name, value: correctAnswer.value }
            });
            
            // 顯示選項標題
            const optionsTitle = document.getElementById('options-title');
            if (optionsTitle) {
                optionsTitle.style.display = 'block';
            }
            
            this.elements.optionsArea.innerHTML = `
                <div class="products-grid horizontal-layout"></div>
            `;
            const productsGrid = this.elements.optionsArea.querySelector('.products-grid');
            
            options.forEach(option => {
                const button = document.createElement('div');
                button.className = 'product-item';
                button.dataset.value = option.value;
                button.setAttribute('tabindex', '0');
                button.setAttribute('role', 'button');
                
                let optionImageSrc;
                if (this.state.settings.difficulty === 'easy' && 
                    option.value === correctAnswer.value) {
                    optionImageSrc = questionImage;
                } else {
                    optionImageSrc = this.getRandomImage(option);
                }
                
                button.innerHTML = `
                    <img src="${optionImageSrc}" alt="${option.name}">
                    <div class="product-info">
                        <div class="product-name">${option.name}</div>
                    </div>
                `;
                
                Game.EventManager.on(button, 'click', (e) => this.checkAnswer(e, correctAnswer), {}, 'gameUI')
                // 添加觸控事件支持
                Game.EventManager.on(button, 'touchend', (e) => {
                    e.preventDefault();
                    Game.Debug.log('question', '🎯 [C1-選項] 觸控選擇答案:', option.name, '正確答案:', correctAnswer.name);
                    this.checkAnswer(e, correctAnswer);
                }, { passive: false }, {}, 'gameUI')
                Game.EventManager.on(button, 'keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.checkAnswer(e, correctAnswer);
                    }
                }, {}, 'gameUI')

                const speakOptionName = () => {
                    if (this.state.isAnswering) return;
                    // 🔧 [修正] 使用傳統中文貨幣格式進行選項語音播放
                    const traditionalOptionName = this.convertToTraditionalCurrency(option.value);
                    this.speak(traditionalOptionName);
                };

                Game.EventManager.on(button, 'mouseenter', speakOptionName, {}, 'gameUI')
                Game.EventManager.on(button, 'touchstart', (e) => {
                    e.preventDefault();
                    speakOptionName();
                }, { passive: false }, {}, 'gameUI')

                productsGrid.appendChild(button);
            });
        },

        checkAnswer(event, correctAnswer) {
            // 🔧 [防連點] 檢查是否正在處理答題
            if (this.state.isAnswering) {
                Game.Debug.log('answer', '[C1] 防抖：checkAnswer 忽略重複點擊');
                return;
            }
            this.state.isAnswering = true;

            Game.Debug.log('answer', '🎯 [C1-答案檢查] 開始檢查答案', {
                eventType: event.type,
                selectedValue: event.currentTarget.dataset.value,
                correctValue: correctAnswer.value,
                correctName: correctAnswer.name
            });

            // 🔧 立即停止選項名稱的語音播放，避免與反饋語音衝突
            if (this.speech.synth.speaking) {
                Game.Debug.log('speech', '🎙️ [C1-答案檢查] 停止選項語音播放');
                this.speech.synth.cancel();
            }
            const selectedBtn = event.currentTarget;
            const selectedValue = parseInt(selectedBtn.dataset.value, 10);
            const isCorrect = selectedValue === correctAnswer.value;
            const { mode } = this.state.settings;
            
            Game.Debug.log('answer', '✅ [C1-答案檢查] 答案比較結果', {
                selectedValue,
                correctValue: correctAnswer.value,
                isCorrect,
                mode
            });

            this.elements.optionsArea.querySelectorAll('.product-item')
                .forEach(btn => btn.style.pointerEvents = 'none');

            // 學習紀錄：逐題明細（題目＝辨識目標面額）
            window.LearningTracker?.logStep?.(
                `第${this.state.currentQuestionIndex}題：辨識 ${correctAnswer.name || correctAnswer.value + ' 元'}`, isCorrect);

            if (isCorrect) {
                this.state.score++;
                selectedBtn.classList.add('selected');

                // 顯示答對圖示（正方形，視窗正中央）
                this.showCenterFeedback('🎉', '#4CAF50', '答對了！');
                document.getElementById('correct-sound')?.play();
                this.startFireworksAnimation();

                // 判斷是否為最後一題
                const isLastQuestion = this.state.currentQuestionIndex >= this.state.totalQuestions;
                const speechText = isLastQuestion ? '恭喜你答對了，測驗結束' : '恭喜你答對了，進入下一題';

                this.speak(speechText, () =>
                    Game.TimerManager.setTimeout(() => {
                        this.hideCenterFeedback();
                        this.loadNextQuestion();
                    }, 1200)
                );
            } else {
                // 播放錯誤音效
                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                document.getElementById('error-sound')?.play();

                Game.TimerManager.setTimeout(() => {
                    if (mode === 'retry') {
                        selectedBtn.classList.add('incorrect-selection');
                        this.showCenterFeedback('❌', '#f44336', '答錯了，再試一次！');

                        this.speak('答錯了，再試一次', () => {
                            Game.TimerManager.setTimeout(() => {
                                selectedBtn.classList.remove('incorrect-selection');
                                this.hideCenterFeedback();
                                this.elements.optionsArea.querySelectorAll('.product-item')
                                    .forEach(btn => btn.style.pointerEvents = 'auto');
                                this.state.isAnswering = false;
                            }, 500);  // 🔧 [修正] 縮短停頓時間，讓使用者更快可以再試
                        });
                    } else {
                        // 單次作答模式：分兩段顯示錯誤和正確答案

                        // 🔧 第一段：在錯誤選項上顯示紅色×
                        const wrongMark = document.createElement('div');
                        wrongMark.className = 'wrong-cross-mark';
                        wrongMark.innerHTML = '×';
                        selectedBtn.appendChild(wrongMark);

                        // 🔧 第一段語音：告知選擇錯誤
                        const traditionalSelectedAnswer = this.convertToTraditionalCurrency(selectedValue);
                        const firstSpeech = `對不起你答錯了，你選擇的是${traditionalSelectedAnswer}`;

                        this.speak(firstSpeech, () => {
                            // 第一段語音完成後，進入第二段

                            // 🔧 第二段：在正確答案上顯示綠色✓
                            const correctBtn = this.elements.optionsArea
                                .querySelector(`[data-value="${correctAnswer.value}"]`);

                            if (correctBtn) {
                                correctBtn.classList.add('selected');

                                // 在正確答案按鈕上添加綠色打勾圖示
                                const checkMark = document.createElement('div');
                                checkMark.className = 'correct-check-mark';
                                checkMark.innerHTML = '✓';
                                correctBtn.appendChild(checkMark);
                            }

                            // 🔧 第二段語音：告知正確答案和進入下一題/測驗結束
                            const traditionalCorrectAnswer = this.convertToTraditionalCurrency(correctAnswer.value);
                            const isLastQuestion = this.state.currentQuestionIndex >= this.state.totalQuestions;
                            const endingText = isLastQuestion ? '測驗結束' : '進入下一題';
                            const secondSpeech = `這才是${traditionalCorrectAnswer}，${endingText}`;

                            this.speak(secondSpeech, () =>
                                Game.TimerManager.setTimeout(() => {
                                    this.loadNextQuestion();
                                }, 1500)
                            );
                        });
                    }
                }, 200, 'question')
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
        // 通用工具函式
        // =====================================================
        updateProgress() {
            const progressInfo = document.querySelector('.progress-info');
            if (progressInfo) {
                progressInfo.textContent = `第 ${this.state.currentQuestionIndex} / ${this.state.totalQuestions} 題`;
            }
        },

        endGame() {
            if (this.state.isEndingGame) { Game.Debug.log('state', '⚠️ [C1] endGame 已執行過，忽略重複呼叫'); return; }
            this.state.isEndingGame = true;
            AssistClick.deactivate();

            const gameContainer = document.getElementById('app');
            const correctAnswers = this.state.score;
            const totalQuestions = this.state.totalQuestions;
            const percentage = Math.round((correctAnswers / totalQuestions) * 100);

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'c1', unitName: 'C1 金錢的種類與面額', series: 'C',
                score: correctAnswers, total: totalQuestions, difficulty: this.state.settings?.difficulty,
                durationSec: this.state.startTime ? Math.floor((Date.now() - this.state.startTime) / 1000) : 0 });

            // 計算完成時間
            const elapsedTime = this.state.startTime ? (Date.now() - this.state.startTime) : 0;
            const minutes = Math.floor(elapsedTime / 60000);
            const seconds = Math.floor((elapsedTime % 60000) / 1000);
            const timeDisplay = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;

            // 根據正確率決定表現評語和圖示
            let performanceMessage = '';
            let performanceIcon = '';
            if (percentage >= 90) {
                performanceMessage = '表現優異';
                performanceIcon = '🏆';
            } else if (percentage >= 70) {
                performanceMessage = '表現良好';
                performanceIcon = '👍';
            } else if (percentage >= 50) {
                performanceMessage = '還需努力';
                performanceIcon = '💪';
            } else {
                performanceMessage = '多加練習';
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
                        <a href="#" id="endgame-reward-link" class="reward-btn-link">
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
                                <div class="achievement-item">🎯 認識各面額錢幣外觀</div>
                                <div class="achievement-item">💰 分辨硬幣與紙鈔差異</div>
                                <div class="achievement-item">📝 掌握錢幣符號與數值</div>
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
            const endgameRewardLink = document.getElementById('endgame-reward-link');
            if (endgameRewardLink) {
                Game.EventManager.on(endgameRewardLink, 'click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                }, {}, 'settings')
            }

            // 播放成功音效和語音
            Game.TimerManager.setTimeout(() => {
                document.getElementById('success-sound')?.play();
                this.triggerConfetti();

                let finalText = '';
                if (percentage === 100) {
                    finalText = `太厲害了，全部答對了！`;
                } else if (percentage >= 80) {
                    finalText = `很棒喔，答對了${correctAnswers}題！`;
                } else if (percentage >= 60) {
                    finalText = `不錯喔，答對了${correctAnswers}題！`;
                } else {
                    finalText = `要再加油喔，答對了${correctAnswers}題。`;
                }
                this.speak(finalText);
            }, 100, 'speech')
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
        },

        // 數字選擇器系統（採用unit2樣式）
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
                        if (display.value.length < 3) display.value += key;
                    }
                };
                pad.appendChild(btn);
            });
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
                }, 200, 'ui')
            } else {
                Game.Debug.log('state', '🎆 canvas-confetti不可用');
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
            if (!Game.state || Game.state.isEndingGame || !this._enabled) return;
            const qIdx = Game.state.currentQuestionIndex - 1;
            const question = Game.state.quizQuestions && Game.state.quizQuestions[qIdx];
            if (!question) return;
            const correctValue = question.answer.value;
            const correctBtn = document.querySelector(`.product-item[data-value="${correctValue}"]`);
            if (!correctBtn) return;
            this._queue = [{ target: correctBtn, action: () => correctBtn.click() }];
            this._step = 0;
            this._highlight(correctBtn);
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
                t = window.setTimeout(() => { if (this._enabled) this.buildQueue(); }, 400);
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
