/**
 * @file f6_number_composition.js
 * @description F6 數的合成與分解 - 配置驅動版本
 * @unit F6 - 數的合成與分解
 * @version 1.0.0
 * @lastModified 2025-12-09
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

// 🎨 圖片壓縮工具（自訂主題上傳使用）
function compressImage(file, maxWidth = 200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// =================================================================
// 🐛 Debug 系統
// =================================================================

const GameDebug = {
    // FLAGS 分類開關系統
    FLAGS: {
        all: false,         // 全域開關（開啟則顯示所有分類）
        init: false,        // 初始化
        config: false,      // 配置
        game: false,        // 遊戲流程
        ui: false,          // UI 渲染
        audio: false,       // 音效
        speech: false,      // 語音
        drag: false,        // 拖曳
        question: false,    // 題目生成
        state: false,       // 狀態管理
        animation: false,   // 動畫
        error: true         // 錯誤（預設開啟）
    },

    log(category, ...args) {
        if (this.FLAGS.all || this.FLAGS[category]) {
            console.log(`[F6-${category}]`, ...args);
        }
    },

    warn(category, ...args) {
        if (this.FLAGS.all || this.FLAGS[category]) {
            console.warn(`[F6-${category}]`, ...args);
        }
    },

    error(...args) {
        // 錯誤訊息總是顯示
        console.error('[F6-ERROR]', ...args);
    }
};

// =================================================================
// 配置驅動系統 - F6 數的合成與分解遊戲配置中心
// =================================================================

const NumberCompositionConfig = {
    // =====================================================
    // 🎯 遊戲基本配置
    // =====================================================
    game: {
        title: "單元F6：數的合成與分解",
        subtitle: "學習數字的組合與拆分，建立加減法基礎",
        version: "1.0.0"
    },

    // =====================================================
    // 🎨 難度配置
    // =====================================================
    difficulties: {
        easy: {
            id: 'easy',
            label: '簡單',
            showVisuals: true,      // 顯示圖形
            showNumbers: true,       // 顯示數字
            parts: 2,                // 拆分成2個數字
            timeLimit: 0,            // 無時間限制
            colors: {
                primary: '#28a745',
                secondary: '#20c997'
            }
        },
        normal: {
            id: 'normal',
            label: '普通',
            showVisuals: true,
            showNumbers: true,
            parts: 2,
            timeLimit: 0,
            colors: {
                primary: '#fd7e14',
                secondary: '#ffb74d'
            }
        },
        hard: {
            id: 'hard',
            label: '困難',
            showVisuals: false,      // 不顯示圖形
            showNumbers: true,
            parts: 2,
            timeLimit: 30,           // 30秒時間限制
            colors: {
                primary: '#dc3545',
                secondary: '#ff6b6b'
            }
        }
    },

    // =====================================================
    // 🔢 數量範圍配置
    // =====================================================
    numberRanges: {
        'range1-5': {
            id: 'range1-5',
            label: '1-5',
            minNumber: 1,
            maxNumber: 5
        },
        'range1-10': {
            id: 'range1-10',
            label: '1-10',
            minNumber: 1,
            maxNumber: 10
        },
        'range5-15': {
            id: 'range5-15',
            label: '5-15',
            minNumber: 5,
            maxNumber: 15
        },
        'custom': {
            id: 'custom',
            label: '自訂範圍',
            minNumber: 1,
            maxNumber: 30
        }
    },

    // =====================================================
    // 🎮 遊戲模式配置
    // =====================================================
    modes: {
        composition: {
            id: 'composition',
            label: '合成挑戰',
            description: '看兩個數字，選擇正確的總和',
            icon: '➕',
            questionFormat: '{a} + {b} = ?',
            speech: '請問 {a} 加 {b} 等於多少？'
        },
        decomposition: {
            id: 'decomposition',
            label: '分解挑戰',
            description: '看一個數字，選擇正確的拆分',
            icon: '➗',
            questionFormat: '{total} 可以分成 ? 和 ?',
            speech: '請問 {total} 可以分成哪兩個數字？'
        },
        fillBlank: {
            id: 'fillBlank',
            label: '填空挑戰',
            description: '填入缺失的數字',
            icon: '❓',
            questionFormat: '{a} + ? = {total}',
            speech: '請問 {a} 加多少等於 {total}？'
        },
        random: {
            id: 'random',
            label: '隨機挑戰',
            description: '隨機混合合成、分解與填空題目',
            icon: '🎲',
            questionFormat: '🎲',
            speech: '隨機題目'
        }
    },

    // =====================================================
    // 📝 測驗模式配置
    // =====================================================
    testModes: {
        retry: {
            id: 'retry',
            label: '反複練習',
            description: '答錯可以重新選擇，直到答對為止',
            icon: '🔄',
            allowRetry: true
        },
        single: {
            id: 'single',
            label: '單次作答',
            description: '每題只能作答一次，答錯自動進入下一題',
            icon: '➡️',
            allowRetry: false
        }
    },

    // =====================================================
    // 🎨 視覺元素配置
    // =====================================================
    visuals: {
        shapes: ['circle', 'square', 'star', 'heart', 'diamond'],
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'],
        // 🔧 改用 EmojiLibrary 統一管理（如果未載入則使用備用）
        get icons() {
            return typeof EmojiLibrary !== 'undefined'
                ? EmojiLibrary.numbers.shapes
                : ['🔴', '🟢', '🔵', '🟡', '🟣', '🟤', '⭐', '❤️', '💎', '🔷'];
        }
    },

    // =====================================================
    // 🎵 音效和語音配置
    // =====================================================
    audio: {
        correctSound: '../audio/units/correct.mp3',
        errorSound: '../audio/units/error.mp3',
        successSound: '../audio/units/success.mp3',
        clickSound: '../audio/units/click.mp3',
        selectSound: '../audio/units/click.mp3'
    },

    speech: {
        welcome: '歡迎來到數的合成與分解單元！',
        selectMode: '請選擇遊戲模式',
        selectDifficulty: '請選擇難度',
        correct: ['答對了！', '很棒！', '正確！', '太好了！'],
        incorrect: ['再想想看', '不對喔，再試一次', '加油！'],
        incorrectWithAnswer: '不對，正確的答案是 {answer}',
        complete: '恭喜你完成所有題目！'
    }
};

// =================================================================
// 主遊戲物件
// =================================================================

const Game = {
    // =====================================================
    // 狀態管理
    // =====================================================
    state: {
        settings: {
            difficulty: null,    // easy, normal, hard
            mode: null,          // composition, decomposition, fillBlank
            numberRange: null,   // range1-5, range1-10, range5-15, custom
            questionCount: null, // 題目數量（不預設）
            testMode: null,      // retry, single (簡單模式下為 null)
            theme: 'default',    // default, fruits, animals, vehicles, custom
            assistClick: false
        },
        currentQuestion: 0,
        score: 0,
        questions: [],
        startTime: null,
        isAnswering: false,      // 🛡️ 防止答題過程中重複點擊
        customItems: []          // 🎨 自訂主題上傳的圖示
    },

    // =====================================================
    // 音效系統
    // =====================================================
    Audio: {
        sounds: {},

        init() {
            Object.keys(NumberCompositionConfig.audio).forEach(key => {
                const audio = new Audio(NumberCompositionConfig.audio[key]);
                audio.preload = 'auto';
                this.sounds[key] = audio;
            });
            GameDebug.log('init', '音效系統初始化完成');
        },

        play(soundName) {
            const sound = this.sounds[soundName];
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(err => GameDebug.log('audio', '播放音效失敗:', err));
            }
        }
    },

    // =====================================================
    // 語音系統
    // =====================================================
    Speech: {
        speechSynth: null,
        currentVoice: null,

        /**
         * 初始化語音合成系統 - 選擇高品質語音
         */
        init() {
            GameDebug.log('Speech', '🎤 開始設置語音合成系統');

            this.speechSynth = window.speechSynthesis;

            if (!this.speechSynth) {
                GameDebug.log('Speech', '❌ 語音合成不可用');
                return;
            }

            const setVoice = () => {
                const voices = this.speechSynth.getVoices();
                GameDebug.log('Speech', `🔍 檢測到語音：共 ${voices.length} 個`);

                if (voices.length === 0) {
                    GameDebug.log('Speech', '⚠️ 暫無語音可用，等待載入');
                    return;
                }

                this.currentVoice =
                    voices.find(v => v.name.startsWith('Microsoft Yating')) ||   // 微軟 Yating 第一優先
                    voices.find(v => /microsoft/i.test(v.name) && /online/i.test(v.name) && v.lang.startsWith('zh')) || // 微軟 Online 次之
                    voices.find(v => /google/i.test(v.name) && v.lang.startsWith('zh')) ||                               // Google 次之
                    voices.find(v => v.name.startsWith('Microsoft Hanhan')) ||   // 微軟涵涵 優先 2
                    voices.find(v => v.name === 'Google 國語（臺灣）') ||          // Google 線上 優先 3
                    voices.find(v => v.lang === 'zh-TW') ||                      // 任何 zh-TW
                    voices.find(v => v.lang.startsWith('zh')) ||                 // 任何 zh
                    voices[0];
                GameDebug.log('Speech', this.currentVoice ? `✅ 語音就緒: ${this.currentVoice.name}` : '❌ 未找到任何中文語音');
            };

            if (this.speechSynth.onvoiceschanged !== undefined) {
                this.speechSynth.onvoiceschanged = setVoice;
                GameDebug.log('Speech', '📡 設置語音變更監聽器');
            }

            setVoice();
        },

        /**
         * 語音播放 - 支援 Promise，使用高品質語音
         */
        speak(text, options = {}) {
            return new Promise(async (resolve) => {
                GameDebug.log('Speech', '🎤 嘗試語音播放', { text: text.substring(0, 50) });

                if (!this.speechSynth) {
                    GameDebug.log('Speech', '❌ 語音合成不可用');
                    resolve();
                    return;
                }

                if (!this.currentVoice) {
                    GameDebug.log('Speech', '⚠️ 語音未就緒，使用預設語音');
                }

                // 停止當前語音 - 防止重複播放
                if (this.speechSynth.speaking || this.speechSynth.pending) {
                    this.speechSynth.cancel();
                    GameDebug.log('Speech', '🛑 停止當前語音');
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                const utterance = new SpeechSynthesisUtterance(text);

                // 使用選定的高品質語音
                if (this.currentVoice) {
                    utterance.voice = this.currentVoice;
                    utterance.lang = this.currentVoice.lang;
                } else {
                    utterance.lang = 'zh-TW';
                }

                utterance.rate = options.rate || 1.0;

                // 語音播放完成後解析 Promise
                let resolved = false;
                const safeResolve = () => {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                };

                utterance.onend = () => {
                    GameDebug.log('Speech', '✅ 語音播放完成');
                    safeResolve();
                };

                utterance.onerror = (event) => {
                    GameDebug.log('Speech', '❌ 語音播放錯誤', { error: event.error });
                    safeResolve();
                };

                // 延遲播放
                const delay = options.delay || 0;
                Game.TimerManager.setTimeout(() => {
                    GameDebug.log('Speech', '▶️ 開始語音播放', {
                        voice: this.currentVoice ? this.currentVoice.name : '預設',
                        rate: utterance.rate
                    });
                    this.speechSynth.speak(utterance);
                    // 備援超時：防止語音無聲失敗時 Promise 永遠掛起
                    Game.TimerManager.setTimeout(() => {
                        GameDebug.log('Speech', '⏰ 語音備援超時，強制完成');
                        safeResolve();
                    }, 10000, 'speech');
                }, delay, 'speech');
            });
        }
    },

    // =====================================================
    // ⏱️ TimerManager - 統一計時器管理
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
            GameDebug.log('timer', `清理所有計時器: ${this.timers.size} 個`);
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
                GameDebug.log('timer', `清理 ${category} 類別計時器: ${count} 個`);
            }
        }
    },

    // =====================================================
    // 🎧 EventManager - 統一事件監聽器管理
    // =====================================================
    EventManager: {
        listeners: [],

        on(element, type, handler, options = {}, category = 'default') {
            if (!element) return -1;
            element.addEventListener(type, handler, options);
            return this.listeners.push({ element, type, handler, options, category }) - 1;
        },

        removeAll() {
            GameDebug.log('event', `清理所有事件監聽器: ${this.listeners.length} 個`);
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
                GameDebug.log('event', `清理 ${category} 類別事件監聽器: ${count} 個`);
            }
        }
    },

    // =====================================================
    // 🎬 全局動畫樣式注入（避免重複定義）
    // =====================================================
    injectGlobalAnimationStyles() {
        if (document.getElementById('f6-global-animations')) return;

        const css = `
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

        const style = document.createElement('style');
        style.id = 'f6-global-animations';
        style.innerHTML = css;
        document.head.appendChild(style);

        // 🎨 自訂主題相關樣式
        if (!document.getElementById('f6-custom-theme-styles')) {
            const customCss = `
                /* 自訂主題圖片尺寸 */
                .draggable-emoji img, .static-emoji img, .visual-item img {
                    width: 44px; height: 44px; object-fit: cover;
                    border-radius: 5px; pointer-events: none; user-select: none; vertical-align: middle;
                }
                /* 自訂主題設定區 */
                .custom-theme-setup {
                    border: 2px dashed #ddd; border-radius: 10px;
                    padding: 20px; margin: 15px 0; background: #f9f9f9;
                }
                .custom-items-list {
                    display: flex; flex-direction: row; flex-wrap: wrap; gap: 10px;
                    min-height: 60px; border: 1px solid #e0e0e0; border-radius: 5px;
                    padding: 10px; margin: 10px 0; background: white;
                }
                .custom-item-row {
                    display: flex; flex-direction: column; align-items: center; gap: 4px;
                    padding: 8px; border: 1px solid #eee; border-radius: 8px;
                    background: #fafafa; text-align: center; width: fit-content;
                }
                .custom-item-row span { font-size: 12px; font-weight: bold; color: #333; }
                .f6-upload-btn {
                    background: linear-gradient(45deg, #2196F3, #42A5F5);
                    color: white; border: none; padding: 8px 15px;
                    border-radius: 5px; cursor: pointer; font-size: 14px; margin-top: 10px;
                    font-weight: bold; transition: all 0.3s ease;
                }
                .f6-upload-btn:hover, .f6-upload-btn:active {
                    background: linear-gradient(45deg, #FF9800, #FFA726);
                    transform: translateY(-2px);
                }
                .f6-remove-btn {
                    background: transparent; color: inherit; border: none;
                    cursor: pointer; font-size: 12px; padding: 4px 8px;
                    border-radius: 5px; transition: all 0.3s ease;
                }
                .f6-remove-btn:hover { background: transparent; }
                /* 預覽 Modal */
                .f6-image-preview-modal {
                    display: none; position: fixed; top: 0; left: 0;
                    width: 100%; height: 100%; z-index: 9999;
                    align-items: center; justify-content: center;
                }
                .f6-image-preview-modal.show { display: flex; }
                .f6-image-preview-modal .modal-overlay {
                    position: absolute; top: 0; left: 0;
                    width: 100%; height: 100%; background: rgba(0,0,0,0.5);
                }
                .f6-image-preview-modal .modal-content {
                    position: relative; background: white; border-radius: 16px;
                    padding: 25px; width: 90%; max-width: 480px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                .f6-image-preview-modal .modal-header {
                    background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                    color: white; padding: 15px 20px;
                    display: flex; justify-content: space-between; align-items: center;
                    border-radius: 16px 16px 0 0; margin: -25px -25px 20px -25px;
                }
                .f6-image-preview-modal .modal-header h3 { margin: 0; font-size: 1.1em; color: white; }
                .f6-image-preview-modal .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: white; }
                .f6-image-preview-modal .modal-body { text-align: center; }
                .f6-image-preview-modal .modal-footer {
                    display: flex !important; gap: 20px !important;
                    justify-content: center !important; align-items: center !important; margin-top: 20px;
                }
                .f6-image-preview-modal .item-form { margin-top: 15px; text-align: left; }
                .f6-image-preview-modal .form-group label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
                .f6-image-preview-modal .form-group input {
                    width: 100%; padding: 8px; border: 2px solid #ddd;
                    border-radius: 8px; font-size: 14px; box-sizing: border-box;
                }
                .f6-cancel-btn {
                    background: #dc3545 !important; color: white !important; border: none !important;
                    padding: 12px 30px !important; border-radius: 25px !important;
                    font-size: 16px !important; font-weight: bold !important; cursor: pointer !important;
                    min-width: 120px !important; transition: all 0.3s ease !important;
                    box-shadow: 0 4px 6px rgba(220, 53, 69, 0.2) !important;
                }
                .f6-cancel-btn:hover {
                    background: #c82333 !important; transform: translateY(-2px);
                    box-shadow: 0 6px 8px rgba(220, 53, 69, 0.3) !important;
                }
                .f6-confirm-btn {
                    background: #28a745 !important; color: white !important; border: none !important;
                    padding: 12px 30px !important; border-radius: 25px !important;
                    font-size: 16px !important; font-weight: bold !important; cursor: pointer !important;
                    min-width: 120px !important; transition: all 0.3s ease !important;
                    box-shadow: 0 4px 6px rgba(40, 167, 69, 0.2) !important;
                }
                .f6-confirm-btn:hover {
                    background: #218838 !important; transform: translateY(-2px);
                    box-shadow: 0 6px 8px rgba(40, 167, 69, 0.3) !important;
                }
            `;
            const customStyle = document.createElement('style');
            customStyle.id = 'f6-custom-theme-styles';
            customStyle.innerHTML = customCss;
            document.head.appendChild(customStyle);
        }

        GameDebug.log('init', '全局動畫樣式已注入');
    },

    // =====================================================
    // 🔄 resetGameState - 統一遊戲狀態重置
    // =====================================================
    resetGameState() {
        this.state.currentQuestion = 0;
        this.state.score = 0;
        this.state.questions = [];
        this.state.startTime = null;
        this.state.isAnswering = false;
        this.state.isEndingGame = false;
        // 🔧 清除填空模式狀態
        this.easyFillBlankState = null;
        this.normalFillBlankState = null;
        GameDebug.log('state', '🔄 遊戲狀態已重置');
    },

    // =====================================================
    // 🎨 取得當前主題圖示陣列
    // =====================================================
    getActiveIcons() {
        const theme = this.state.settings.theme || 'default';
        if (theme === 'custom' && this.state.customItems.length > 0) {
            return this.state.customItems.map(item => item.imageData);
        }
        if (typeof EmojiLibrary !== 'undefined') {
            if (theme === 'fruits')   return EmojiLibrary.food.fruits;
            if (theme === 'animals')  return EmojiLibrary.animals.mammals;
            if (theme === 'vehicles') return EmojiLibrary.services.transport;
        }
        // 預設：幾何形狀
        return typeof EmojiLibrary !== 'undefined'
            ? EmojiLibrary.numbers.shapes
            : ['🔴', '🟢', '🔵', '🟡', '🟣', '🟤', '⭐', '❤️', '💎', '🔷'];
    },

    // 🎨 渲染圖示（支援 emoji 字串或 base64 自訂圖片）
    renderIcon(icon) {
        if (icon && typeof icon === 'string' && icon.startsWith('data:image/')) {
            return `<img src="${icon}" alt="圖示" style="width:44px;height:44px;object-fit:cover;border-radius:5px;pointer-events:none;user-select:none;vertical-align:middle;">`;
        }
        return icon;
    },

    // =====================================================
    // 初始化
    // =====================================================
    init() {
        GameDebug.log('init', '遊戲初始化開始');

        // 🔧 [Bug修復] 清理所有計時器和事件監聽器
        this.TimerManager.clearAll();
        this.EventManager.removeAll();

        // 🎬 注入全局動畫樣式
        this.injectGlobalAnimationStyles();

        this.Audio.init();
        this.Speech.init();
        this.renderWelcomeScreen();
    },

    // =====================================================
    // 渲染歡迎畫面
    // =====================================================
    renderWelcomeScreen() {
        AssistClick.deactivate();
        // 🔧 [Bug修復] 清理計時器和事件監聽器
        this.TimerManager.clearAll();
        this.EventManager.removeByCategory('gameUI');

        // 🔄 重置遊戲狀態
        this.resetGameState();

        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="unit-welcome">
                <div class="welcome-content">
                    <div class="settings-title-row">
                        <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                        <h1>${NumberCompositionConfig.game.title}</h1>
                    </div>
                    <div class="page-header">
                        <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">${NumberCompositionConfig.game.subtitle}</p>
                    </div>
                    <div class="game-settings">
                        <!-- 🎯 選擇難度 -->
                        <div class="setting-group">
                            <label>🎯 選擇難度：</label>
                            <div class="button-group">
                                ${Object.values(NumberCompositionConfig.difficulties).map(diff => `
                                    <button class="selection-btn ${this.state.settings.difficulty === diff.id ? 'active' : ''}" data-type="difficulty" data-value="${diff.id}">
                                        ${diff.label}
                                    </button>
                                `).join('')}
                            </div>
                            <div id="difficulty-description" class="setting-description" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 0.95em; color: #666; text-align: left;">
                                ${this.getDifficultyDescription(this.state.settings.difficulty)}
                            </div>
                        </div>
                        <!-- 👆 輔助點擊 -->
                        <div class="setting-group" id="assist-click-group" style="background: #fff3cd; padding: 15px; border-radius: 10px; border: 2px solid #ffcc02; ${this.state.settings.difficulty !== 'easy' ? 'display:none;' : ''}">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2em;">♿</span>
                                <span>輔助點擊模式（單鍵操作）：</span>
                            </label>
                            <p style="font-size: 0.9em; color: #666; margin: 8px 0 12px 0; line-height: 1.5;">
                                啟用後，只要偵測到點擊，系統會自動依序完成拖曳數字圖示完成數的組成等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式」</strong>
                            </p>
                            <div class="button-group">
                                <button class="selection-btn ${this.state.settings.assistClick ? 'active' : ''}" id="assist-click-on">✓ 啟用</button>
                                <button class="selection-btn ${!this.state.settings.assistClick ? 'active' : ''}" id="assist-click-off">✗ 停用</button>
                            </div>
                        </div>
                        <!-- 🎮 測驗類型 -->
                        <div class="setting-group">
                            <label>🎮 測驗類型：</label>
                            <div class="button-group">
                                ${Object.values(NumberCompositionConfig.modes).map(mode => `
                                    <button class="selection-btn ${this.state.settings.mode === mode.id ? 'active' : ''}" data-type="mode" data-value="${mode.id}">
                                        ${mode.icon} ${mode.label}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        <!-- 🎨 主題選擇 -->
                        <div class="setting-group">
                            <label>🎨 主題選擇：</label>
                            <div class="button-group">
                                <button class="selection-btn ${this.state.settings.theme === 'default' ? 'active' : ''}" data-type="theme" data-value="default">隨機 🎲</button>
                                <button class="selection-btn ${this.state.settings.theme === 'fruits' ? 'active' : ''}" data-type="theme" data-value="fruits">水果 🍎</button>
                                <button class="selection-btn ${this.state.settings.theme === 'animals' ? 'active' : ''}" data-type="theme" data-value="animals">動物 🐶</button>
                                <button class="selection-btn ${this.state.settings.theme === 'vehicles' ? 'active' : ''}" data-type="theme" data-value="vehicles">交通工具 🚗</button>
                                <button class="selection-btn ${this.state.settings.theme === 'custom' ? 'active' : ''}" data-type="theme" data-value="custom">🎨 自訂主題</button>
                            </div>
                        </div>
                        <!-- 自訂主題容器 -->
                        <div id="custom-theme-container">
                            ${this.renderCustomThemeContainer()}
                        </div>
                        <!-- 🔢 數量範圍 -->
                        <div class="setting-group">
                            <label>🔢 數量範圍：</label>
                            <div class="button-group">
                                ${Object.values(NumberCompositionConfig.numberRanges).map(range => `
                                    <button class="selection-btn ${this.state.settings.numberRange === range.id ? 'active' : ''}" data-type="numberRange" data-value="${range.id}">
                                        ${range.label}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        <!-- 📋 題目數量 -->
                        <div class="setting-group">
                            <label>📋 題目數量：</label>
                            <div class="button-group">
                                ${[1, 3, 5, 10].map(num => `
                                    <button class="selection-btn ${this.state.settings.questionCount === num ? 'active' : ''}" data-type="questionCount" data-value="${num}">${num}題</button>
                                `).join('')}
                                <button class="selection-btn ${this.state.settings.questionCount !== null && ![1,3,5,10].includes(this.state.settings.questionCount) ? 'active' : ''}" data-type="questionCount" data-value="custom">自訂</button>
                            </div>
                            <div class="custom-question-display" style="display: ${this.state.settings.questionCount !== null && ![1,3,5,10].includes(this.state.settings.questionCount) ? 'block' : 'none'}; margin-top: 10px;">
                                <input type="text" id="custom-question-count-f6"
                                       value="${this.state.settings.questionCount !== null && ![1,3,5,10].includes(this.state.settings.questionCount) ? this.state.settings.questionCount + '題' : ''}"
                                       placeholder="請輸入題數"
                                       style="padding: 8px; border-radius: 5px; border: 2px solid ${this.state.settings.questionCount !== null && ![1,3,5,10].includes(this.state.settings.questionCount) ? '#667eea' : '#ddd'}; background: ${this.state.settings.questionCount !== null && ![1,3,5,10].includes(this.state.settings.questionCount) ? '#667eea' : 'white'}; color: ${this.state.settings.questionCount !== null && ![1,3,5,10].includes(this.state.settings.questionCount) ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                                       readonly onclick="Game.handleCustomQuestionClick()">
                            </div>
                        </div>
                        <!-- 📝 測驗模式 -->
                        <div class="setting-group" id="mode-selection-group">
                            <label>📝 測驗模式：</label>
                            <div class="button-group">
                                <button class="selection-btn ${this.state.settings.testMode === 'retry' ? 'active' : ''}"
                                        data-type="testMode"
                                        data-value="retry"
                                        ${this.state.settings.difficulty === 'easy' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                    🔄 反複練習
                                </button>
                                <button class="selection-btn ${this.state.settings.testMode === 'single' ? 'active' : ''}"
                                        data-type="testMode"
                                        data-value="single"
                                        ${this.state.settings.difficulty === 'easy' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                    ➡️ 單次作答
                                </button>
                            </div>
                            ${this.state.settings.difficulty === 'easy' ? '<p style="color: #999; font-size: 0.9em; margin-top: 8px;">簡單模式自動完成，無需選擇測驗模式</p>' : ''}
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
                        <button class="back-btn" onclick="window.location.href='../index.html'">返回主選單</button>
                        <button id="start-game-btn" class="start-btn" ${!this.state.settings.difficulty || !this.state.settings.mode || !this.state.settings.numberRange || !this.state.settings.questionCount ? 'disabled' : ''}>
                            ${!this.state.settings.difficulty || !this.state.settings.mode || !this.state.settings.numberRange || !this.state.settings.questionCount ? '請完成所有選擇' : '開始遊戲'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.bindWelcomeScreenEvents();
    },

    // =====================================================
    // 綁定歡迎畫面事件
    // =====================================================
    bindWelcomeScreenEvents() {
        const gameSettings = document.querySelector('.game-settings');

        // 統一處理所有設定選項的點擊事件
        this.EventManager.on(gameSettings, 'click', (e) => {
            const btn = e.target.closest('.selection-btn');
            if (!btn) return;

            const type = btn.dataset.type;
            const value = btn.dataset.value;

            // 🎨 處理主題選擇
            if (type === 'theme') {
                this.state.settings.theme = value;
                document.querySelectorAll('[data-type="theme"]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateCustomThemeContainer();
                this.updateStartButton();
                return;
            }

            // 🆕 處理自訂範圍
            if (type === 'numberRange' && value === 'custom') {
                const maxLimit = this.state.settings.difficulty === 'hard' ? 1000 : 30;
                this.showRangeInput(`請輸入數量範圍 (1-${maxLimit})`, (minVal, maxVal, feedbackDiv) => {
                    // 驗證範圍
                    if (minVal <= 0) {
                        if (feedbackDiv) {
                            feedbackDiv.textContent = '⚠️ 最小值必須大於0';
                            feedbackDiv.style.color = '#ff6b6b';
                        }
                        return false;
                    }

                    if (maxVal > maxLimit) {
                        if (feedbackDiv) {
                            feedbackDiv.textContent = `⚠️ 最大值不能超過${maxLimit}`;
                            feedbackDiv.style.color = '#ff6b6b';
                        }
                        return false;
                    }

                    if (maxVal <= minVal) {
                        if (feedbackDiv) {
                            feedbackDiv.textContent = '⚠️ 最大值必須大於最小值';
                            feedbackDiv.style.color = '#ff6b6b';
                        }
                        return false;
                    }

                    // 更新自訂範圍配置
                    NumberCompositionConfig.numberRanges.custom.minNumber = minVal;
                    NumberCompositionConfig.numberRanges.custom.maxNumber = maxVal;
                    NumberCompositionConfig.numberRanges.custom.label = `${minVal}-${maxVal}`;

                    // 更新狀態
                    this.state.settings.numberRange = 'custom';

                    // 更新UI
                    document.querySelectorAll(`[data-type="${type}"]`).forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    btn.textContent = `${minVal}-${maxVal}`;

                    // 更新開始按鈕
                    this.updateStartButton();
                    this.Audio.play('selectSound');
                    GameDebug.log('settings', '自訂範圍', `${minVal}-${maxVal}`);

                    return true; // 驗證成功，關閉彈窗
                }, maxLimit);
                return;
            }

            // 🆕 處理自訂題數
            if (type === 'questionCount' && value === 'custom') {
                this.showSettingsNumberInput('請輸入題目數量 (1-50)', (num) => {
                    const count = parseInt(num);
                    if (isNaN(count) || count < 1 || count > 50) {
                        alert('請輸入 1-50 之間的有效數字');
                        return false;
                    }

                    // 更新狀態
                    this.state.settings.questionCount = count;

                    // 更新UI - 移除同類型按鈕的 active 狀態
                    document.querySelectorAll(`[data-type="${type}"]`).forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // 🔧 顯示自訂題數輸入框並套用藍色樣式
                    const customDisplay = document.querySelector('.custom-question-display');
                    const customInput = document.getElementById('custom-question-count-f6');
                    if (customDisplay && customInput) {
                        customDisplay.style.display = 'block';
                        customInput.value = `${count}題`;
                        customInput.style.background = '#667eea';
                        customInput.style.color = 'white';
                        customInput.style.borderColor = '#667eea';
                    }

                    // 更新開始按鈕
                    this.updateStartButton();
                    this.Audio.play('selectSound');
                    GameDebug.log('settings', '自訂題數', count);

                    return true; // 驗證成功，關閉彈窗
                });
                return;
            }

            // 更新狀態
            if (type === 'questionCount') {
                this.state.settings[type] = parseInt(value);
            } else {
                this.state.settings[type] = value;
            }

            // 更新 UI - 移除同類型按鈕的 active 狀態
            document.querySelectorAll(`[data-type="${type}"]`).forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');

            // 🆕 難度變更時更新測驗模式按鈕可用性
            if (type === 'difficulty') {
                this.updateModeButtonsAvailability(value);
                // 🔧 [新增] 更新難度說明
                this.updateDifficultyDescription(value);
                // 👆 輔助點擊：只在簡單模式顯示
                const assistGroup = document.getElementById('assist-click-group');
                if (assistGroup) assistGroup.style.display = value !== 'easy' ? 'none' : '';
                if (value !== 'easy') this.state.settings.assistClick = false;
                // 切換難度時重置自訂範圍
                if (this.state.settings.numberRange === 'custom') {
                    this.state.settings.numberRange = 'range1-10';
                    NumberCompositionConfig.numberRanges.custom.minNumber = 1;
                    NumberCompositionConfig.numberRanges.custom.maxNumber = 30;
                    NumberCompositionConfig.numberRanges.custom.label = '自訂範圍';
                    const customBtn = document.querySelector('[data-type="numberRange"][data-value="custom"]');
                    if (customBtn) {
                        customBtn.textContent = '自訂範圍';
                        customBtn.classList.remove('active');
                    }
                    const defaultBtn = document.querySelector('[data-type="numberRange"][data-value="range1-10"]');
                    if (defaultBtn) defaultBtn.classList.add('active');
                }
            }

            // 更新開始按鈕
            this.updateStartButton();

            this.Audio.play('selectSound');
            GameDebug.log('settings', `選擇${type}`, value);
        }, {}, 'gameUI');

        // 開始按鈕事件
        this.EventManager.on(document.getElementById('start-game-btn'), 'click', () => {
            const { difficulty, mode, numberRange, questionCount } = this.state.settings;
            if (difficulty && mode && numberRange && questionCount) {
                this.Audio.play('clickSound');
                this.startGame();
            }
        }, {}, 'gameUI');

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
            }, {}, 'gameUI');
        }

        // 📝 作業單連結事件
        const worksheetLink = document.getElementById('settings-worksheet-link');
        if (worksheetLink) {
            this.EventManager.on(worksheetLink, 'click', (e) => {
                e.preventDefault();
                // 作業單使用自己的預設值與工具列設定，不受遊戲設定影響
                const params = new URLSearchParams({ unit: 'f6' });
                window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
            }, {}, 'gameUI');
        }

        // 👆 輔助點擊開關事件
        const assistOn = document.getElementById('assist-click-on');
        const assistOff = document.getElementById('assist-click-off');
        if (assistOn) {
            this.EventManager.on(assistOn, 'click', (e) => {
                e.stopPropagation();
                this.state.settings.assistClick = true;
                assistOn.classList.add('active');
                assistOff?.classList.remove('active');
            }, {}, 'gameUI');
        }
        if (assistOff) {
            this.EventManager.on(assistOff, 'click', (e) => {
                e.stopPropagation();
                this.state.settings.assistClick = false;
                assistOff.classList.add('active');
                assistOn?.classList.remove('active');
            }, {}, 'gameUI');
        }
    },

    // =====================================================
    // 🆕 根據難度更新測驗模式按鈕可用性
    // =====================================================
    /**
     * 根據難度更新測驗模式按鈕可用性
     * 簡單模式下自動禁用測驗模式選擇
     */
    updateModeButtonsAvailability(difficulty) {
        const modeGroup = document.getElementById('mode-selection-group');
        if (!modeGroup) return;

        const modeButtons = modeGroup.querySelectorAll('button[data-type="testMode"]');
        const existingHint = modeGroup.querySelector('.mode-hint');

        if (difficulty === 'easy') {
            // 簡單模式：禁用測驗模式按鈕
            modeButtons.forEach(btn => {
                btn.disabled = true;
                btn.classList.remove('active');
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            });

            // 添加提示文字
            if (!existingHint) {
                const hint = document.createElement('p');
                hint.className = 'mode-hint';
                hint.style.color = '#999';
                hint.style.fontSize = '0.9em';
                hint.style.marginTop = '8px';
                hint.textContent = '簡單模式自動完成，無需選擇測驗模式';
                modeGroup.appendChild(hint);
            }

            // 清除測驗模式選擇
            this.state.settings.testMode = null;
            GameDebug.log('settings', '簡單模式：自動禁用測驗模式');
        } else {
            // 普通/困難模式：啟用測驗模式按鈕
            modeButtons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            });

            // 移除提示文字
            if (existingHint) {
                existingHint.remove();
            }

            GameDebug.log('settings', '普通/困難模式：啟用測驗模式');
        }
    },

    // 🔧 [新增] 取得難度說明
    getDifficultyDescription(difficulty) {
        const descriptions = {
            'easy': '簡單：有視覺提示，引導下完成題目。',
            'normal': '普通：有視覺提示，以選擇題的方式，選擇正確的答案。',
            'hard': '困難：單純數字測驗，沒有圖示提示。'
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
    // 🆕 更新開始按鈕狀態
    // =====================================================
    updateStartButton() {
        const startBtn = document.getElementById('start-game-btn');
        const { difficulty, mode, numberRange, questionCount, testMode, theme } = this.state.settings;

        // 🔧 簡單模式不需要選擇測驗模式
        const modeRequired = difficulty !== 'easy';
        const modeValid = modeRequired ? (testMode !== null) : true;

        // 🎨 自訂主題需要至少 1 個圖示
        const isCustomThemeValid = theme !== 'custom' || this.state.customItems.length >= 1;

        const allSelected = difficulty && mode && numberRange && questionCount && modeValid && isCustomThemeValid;

        if (allSelected) {
            startBtn.disabled = false;
            startBtn.textContent = '開始遊戲';
        } else {
            startBtn.disabled = true;
            if (theme === 'custom' && this.state.customItems.length < 1) {
                startBtn.textContent = '自訂主題需要至少1個圖示';
            } else {
                startBtn.textContent = '請完成所有選擇';
            }
        }
    },

    // =====================================================
    // 🆕 顯示自訂範圍輸入界面
    // =====================================================
    showRangeInput(title, callback, maxLimit = 30) {
        if (document.getElementById('range-input-popup')) return;

        const keypadAudio = new Audio('../audio/units/keypad.mp3');
        keypadAudio.volume = 0.7;
        keypadAudio.preload = 'auto';

        const popupHTML = `
            <div id="range-input-popup" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;">
                <div style="background:white; padding:20px; border-radius:15px; width:400px; text-align:center; position:relative;">
                    <button id="close-range-input" style="
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
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px;">
                        <label>最小值:</label>
                        <input type="text" id="min-display" readonly style="width:80px; font-size:1.5em; text-align:center; padding: 5px; border: 2px solid #ddd; border-radius: 5px; cursor: pointer;">
                        <label>最大值:</label>
                        <input type="text" id="max-display" readonly style="width:80px; font-size:1.5em; text-align:center; padding: 5px; border: 2px solid #ddd; border-radius: 5px; cursor: pointer;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="font-weight: bold;">目前輸入:</label>
                        <div id="current-input-type" style="font-size: 1.1em; color: #666; margin-top: 5px;">請輸入最小值</div>
                        <div id="input-feedback" style="font-size: 0.9em; margin-top: 5px; min-height: 20px;"></div>
                    </div>
                    <div id="range-pad" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;"></div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', popupHTML);
        const pad = document.getElementById('range-pad');
        const minDisplay = document.getElementById('min-display');
        const maxDisplay = document.getElementById('max-display');
        const currentInputType = document.getElementById('current-input-type');
        const closeBtn = document.getElementById('close-range-input');

        let isInputingMax = false;

        closeBtn.onclick = () => {
            document.getElementById('range-input-popup').remove();
        };

        // 添加輸入框點擊事件，讓用戶可以切換編輯目標
        minDisplay.onclick = () => {
            isInputingMax = false;
            currentInputType.textContent = '請輸入最小值';
            // 高亮顯示當前編輯的輸入框
            minDisplay.style.borderColor = '#4a90e2';
            maxDisplay.style.borderColor = '#ddd';
        };

        maxDisplay.onclick = () => {
            isInputingMax = true;
            currentInputType.textContent = '請輸入最大值';
            // 高亮顯示當前編輯的輸入框
            maxDisplay.style.borderColor = '#4a90e2';
            minDisplay.style.borderColor = '#ddd';
        };

        // 初始狀態設置最小值為高亮
        minDisplay.style.borderColor = '#4a90e2';
        maxDisplay.style.borderColor = '#ddd';

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
                const currentDisplay = isInputingMax ? maxDisplay : minDisplay;

                if (key === '清除') {
                    keypadAudio.currentTime = 0; keypadAudio.play().catch(() => {});
                    currentDisplay.value = '';
                } else if (key === '確認') {
                    if (!isInputingMax && minDisplay.value) {
                        isInputingMax = true;
                        currentInputType.textContent = '請輸入最大值';
                        // 更新高亮狀態
                        maxDisplay.style.borderColor = '#4a90e2';
                        minDisplay.style.borderColor = '#ddd';
                    } else if (isInputingMax && maxDisplay.value && minDisplay.value) {
                        const minVal = parseInt(minDisplay.value);
                        const maxVal = parseInt(maxDisplay.value);

                        // 將feedback元素傳遞給callback函數
                        const feedbackDiv = document.getElementById('input-feedback');
                        if (callback(minVal, maxVal, feedbackDiv)) {
                            document.getElementById('range-input-popup').remove();
                        }
                    }
                } else {
                    // 數字輸入，依 maxLimit 動態決定最大位數
                    const digitLimit = maxLimit <= 99 ? 2 : 4;
                    if (currentDisplay.value.length < digitLimit) {
                        const newValue = currentDisplay.value + key;
                        const numValue = parseInt(newValue);
                        const feedbackDiv = document.getElementById('input-feedback');

                        // 檢查是否為最小值輸入0
                        if (!isInputingMax && numValue === 0) {
                            if (feedbackDiv) {
                                feedbackDiv.textContent = '⚠️ 最小值必須大於0';
                                feedbackDiv.style.color = '#ff6b6b';
                                this.TimerManager.setTimeout(() => {
                                    feedbackDiv.textContent = '';
                                }, 2000, 'ui');
                            }
                            return;
                        }

                        if (numValue <= maxLimit) {
                            keypadAudio.currentTime = 0; keypadAudio.play().catch(() => {});
                            currentDisplay.value += key;
                            if (feedbackDiv) {
                                feedbackDiv.textContent = '';
                            }
                        } else {
                            if (feedbackDiv) {
                                feedbackDiv.textContent = `⚠️ 數值不能超過${maxLimit}`;
                                feedbackDiv.style.color = '#ff6b6b';
                                this.TimerManager.setTimeout(() => {
                                    feedbackDiv.textContent = '';
                                }, 2000, 'ui');
                            }
                        }
                    }
                }
            };
            pad.appendChild(btn);
        });
    },

    // =====================================================
    // 開始遊戲
    // =====================================================
    startGame() {
        GameDebug.log('game', '遊戲開始', this.state.settings);
        // 🔄 重置遊戲狀態
        this.resetGameState();
        this.state.startTime = Date.now();
        this.generateQuestions();
        this.renderQuestion();
        if (this.state.settings.difficulty === 'easy' && this.state.settings.assistClick) {
            AssistClick.activate();
        }
    },

    // =====================================================
    // 生成題目
    // =====================================================
    generateQuestions() {
        const { mode, difficulty, numberRange, questionCount } = this.state.settings;
        const difficultyConfig = NumberCompositionConfig.difficulties[difficulty];
        const rangeConfig = NumberCompositionConfig.numberRanges[numberRange];

        // 合併配置：難度決定顯示方式，範圍決定數值大小
        const config = {
            ...difficultyConfig,
            minNumber: rangeConfig.minNumber,
            maxNumber: rangeConfig.maxNumber
        };

        this.state.questions = [];

        for (let i = 0; i < questionCount; i++) {
            let question;
            let attempts = 0;
            const maxAttempts = 50; // 最多嘗試 50 次

            // 持續生成題目，直到與前一題不同
            do {
                // 隨機模式：每題從三種類型中隨機挑一種
                const effectiveMode = (mode === 'random')
                    ? ['composition', 'decomposition', 'fillBlank'][Math.floor(Math.random() * 3)]
                    : mode;
                if (effectiveMode === 'composition') {
                    question = this.generateCompositionQuestion(config);
                } else if (effectiveMode === 'decomposition') {
                    question = this.generateDecompositionQuestion(config);
                } else if (effectiveMode === 'fillBlank') {
                    question = this.generateFillBlankQuestion(config);
                }
                attempts++;
            } while (attempts < maxAttempts && i > 0 && this.isDuplicateQuestion(question, this.state.questions[i - 1]));

            this.state.questions.push(question);
        }

        GameDebug.log('generation', '題目生成完成', this.state.questions);
    },

    // =====================================================
    // 檢查題目是否與前一題重複
    // =====================================================
    isDuplicateQuestion(newQuestion, previousQuestion) {
        if (!previousQuestion || newQuestion.type !== previousQuestion.type) {
            return false;
        }

        if (newQuestion.type === 'composition') {
            // 合成題：檢查兩個加數和答案是否相同（不考慮順序）
            return (newQuestion.a === previousQuestion.a && newQuestion.b === previousQuestion.b) ||
                   (newQuestion.a === previousQuestion.b && newQuestion.b === previousQuestion.a);
        } else if (newQuestion.type === 'decomposition') {
            // 分解題：檢查總數是否相同
            return newQuestion.total === previousQuestion.total;
        } else if (newQuestion.type === 'fillBlank') {
            // 填空題：檢查已知數和總數是否都相同
            return newQuestion.a === previousQuestion.a && newQuestion.total === previousQuestion.total;
        }

        return false;
    },

    // =====================================================
    // 生成合成題目
    // =====================================================
    generateCompositionQuestion(config) {
        const minNum = config.minNumber || 1;
        const maxNum = config.maxNumber;

        // 生成兩個加數，確保它們都在範圍內且和不超過最大值
        const a = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
        const maxB = Math.min(maxNum - a, maxNum);
        const b = Math.floor(Math.random() * (maxB - minNum + 1)) + minNum;
        const answer = a + b;

        // 生成錯誤選項
        const options = [answer];
        let attempts = 0;
        const maxAttempts = 100;

        while (options.length < 4 && attempts < maxAttempts) {
            attempts++;
            const wrong = answer + (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 3) + 1);
            if (wrong >= minNum && wrong <= maxNum * 2 && !options.includes(wrong)) {
                options.push(wrong);
            }
        }

        // 如果無法生成 4 個選項，記錄日誌
        if (options.length < 4) {
            GameDebug.warn('question', `⚠️ 合成題目：數字範圍太小，只能生成 ${options.length} 個選項`);
        }

        return {
            type: 'composition',
            a,
            b,
            answer,
            options: this.shuffleArray(options),
            showVisuals: config.showVisuals
        };
    },

    // =====================================================
    // 生成分解題目
    // =====================================================
    generateDecompositionQuestion(config) {
        // 🔧 分解題目的 total 至少要是 2（因為要分給左右兩個框）
        const minTotal = Math.max(config.minNumber, 2);
        const total = Math.floor(Math.random() * (config.maxNumber - minTotal + 1)) + minTotal;
        // 🔧 確保 a 至少是 1，最大是 total-1（這樣 b 也至少是 1，兩邊都有數字）
        const a = Math.floor(Math.random() * (total - 1)) + 1;
        const b = total - a;
        const answer = `${a},${b}`;

        // 🔧 [改進] 生成錯誤選項，優先生成和小於 total 的選項
        const options = [answer];
        let attempts = 0;
        const maxAttempts = 100; // 安全上限

        // 🎯 策略：優先生成和小於 total 的選項（total-2, total-1），如果不夠再生成和大於 total 的選項
        const possibleSums = [];

        // 1. 優先添加小於 total 的和（最多到 total-1）
        for (let sum = Math.max(2, total - 3); sum < total; sum++) {
            possibleSums.push(sum);
        }

        // 2. 如果選項還不夠，添加大於 total 的和
        for (let sum = total + 1; sum <= total + 3; sum++) {
            possibleSums.push(sum);
        }

        // 3. 從這些可能的和中生成選項
        while (options.length < 4 && attempts < maxAttempts) {
            attempts++;

            // 選擇一個和（優先從數組前面選，也就是小於 total 的）
            const sumIndex = Math.min(
                Math.floor(Math.random() * (possibleSums.length + options.length)),
                possibleSums.length - 1
            );
            const targetSum = possibleSums[sumIndex];

            // 生成這個和的分解（確保兩邊都至少是 1）
            const maxA = targetSum - 1;
            if (maxA >= 1) {
                const wrongA = Math.floor(Math.random() * maxA) + 1;
                const wrongB = targetSum - wrongA;
                const wrong = `${wrongA},${wrongB}`;

                if (!options.includes(wrong) && wrongB >= 1) {
                    options.push(wrong);
                }
            }
        }

        // 📝 如果無法生成 4 個選項（數字太小），記錄日誌
        if (options.length < 4) {
            GameDebug.warn('question', `⚠️ 分解題目：數字 ${total} 太小，只能生成 ${options.length} 個選項`);
        }

        return {
            type: 'decomposition',
            total,
            answer,
            options: this.shuffleArray(options),
            showVisuals: config.showVisuals
        };
    },

    // =====================================================
    // 生成填空題目
    // =====================================================
    generateFillBlankQuestion(config) {
        // 🔧 確保 total >= 2，避免產生 0 的題目
        const minTotal = Math.max(2, config.minNumber);
        const total = Math.floor(Math.random() * (config.maxNumber - minTotal + 1)) + minTotal;
        // 🔧 確保 a 和 answer 都不為 0（a 從 1 到 total-1）
        const a = Math.floor(Math.random() * (total - 1)) + 1;
        const answer = total - a;

        // 🔧 [修正] 生成錯誤選項，加入安全計數器防止無限循環
        const options = [answer];
        let attempts = 0;
        const maxAttempts = 100; // 安全上限

        while (options.length < 4 && attempts < maxAttempts) {
            attempts++;
            const wrong = answer + (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 3) + 1);
            if (wrong >= 0 && wrong <= config.maxNumber && !options.includes(wrong)) {
                options.push(wrong);
            }
        }

        // 📝 如果無法生成 4 個選項（範圍太小），記錄日誌
        if (options.length < 4) {
            GameDebug.warn('question', `⚠️ 填空題目：答案 ${answer} 在範圍 [0, ${config.maxNumber}] 內只能生成 ${options.length} 個選項`);
        }

        // 🆕 隨機決定 ? 的位置（0 = 第一個數字位置，1 = 第二個數字位置）
        const questionMarkPosition = Math.random() < 0.5 ? 0 : 1;

        return {
            type: 'fillBlank',
            a,
            total,
            answer,
            questionMarkPosition,  // 🆕 ? 的位置
            options: this.shuffleArray(options),
            showVisuals: config.showVisuals
        };
    },

    // =====================================================
    // 渲染題目
    // =====================================================
    renderQuestion() {
        const question = this.state.questions[this.state.currentQuestion];
        const app = document.getElementById('app');
        const { difficulty, mode } = this.state.settings;
        const difficultyConfig = NumberCompositionConfig.difficulties[difficulty];

        let questionHTML = '';
        let speechText = '';

        // 🆕 簡單模式 + 合成題目：使用特殊的拖曳式版面
        if (question.type === 'composition' && difficulty === 'easy') {
            return this.renderEasyCompositionQuestion(question);
        }

        // 🆕 普通模式 + 合成題目：使用特殊的拖曳式版面
        if (question.type === 'composition' && difficulty === 'normal') {
            return this.renderNormalCompositionQuestion(question);
        }

        // 🆕 困難模式 + 合成題目：使用純數字版面
        if (question.type === 'composition' && difficulty === 'hard') {
            return this.renderHardCompositionQuestion(question);
        }

        // 🆕 簡單模式 + 分解題目：使用特殊的拖曳式版面
        if (question.type === 'decomposition' && difficulty === 'easy') {
            return this.renderEasyDecompositionQuestion(question);
        }

        // 🆕 普通模式 + 分解題目：使用特殊的拖曳式版面（隱藏數字 + 選項）
        if (question.type === 'decomposition' && difficulty === 'normal') {
            return this.renderNormalDecompositionQuestion(question);
        }

        // 🆕 困難模式 + 分解題目：使用純數字版面（隨機一邊是輸入框）
        if (question.type === 'decomposition' && difficulty === 'hard') {
            return this.renderHardDecompositionQuestion(question);
        }

        // 🆕 簡單模式 + 填空題目：使用特殊的拖曳式版面
        if (question.type === 'fillBlank' && difficulty === 'easy') {
            return this.renderEasyFillBlankQuestion(question);
        }

        // 🆕 普通模式 + 填空題目：使用特殊的拖曳式版面（隱藏數字 + 選項）
        if (question.type === 'fillBlank' && difficulty === 'normal') {
            return this.renderNormalFillBlankQuestion(question);
        }

        // 🆕 困難模式 + 填空題目：使用數字輸入框
        if (question.type === 'fillBlank' && difficulty === 'hard') {
            return this.renderHardFillBlankQuestion(question);
        }

        if (question.type === 'composition') {
            questionHTML = `
                <div class="question-content">
                    ${question.showVisuals ? this.renderVisuals(question.a) : ''}
                    <div class="number-display">${question.a}</div>
                    <div class="operator">+</div>
                    ${question.showVisuals ? this.renderVisuals(question.b) : ''}
                    <div class="number-display">${question.b}</div>
                    <div class="operator">=</div>
                    <div class="question-mark">?</div>
                </div>
            `;
            speechText = `請問 ${question.a} 加 ${question.b} 等於多少？`;
        } else if (question.type === 'decomposition') {
            questionHTML = `
                <div class="question-content">
                    ${question.showVisuals ? this.renderVisuals(question.total) : ''}
                    <div class="number-display">${question.total}</div>
                    <div class="question-text">可以分成哪兩個數字？</div>
                </div>
            `;
            speechText = `請問 ${question.total} 可以分成哪兩個數字？`;
        } else if (question.type === 'fillBlank') {
            questionHTML = `
                <div class="question-content">
                    <div class="number-display">${question.a}</div>
                    <div class="operator">+</div>
                    <div class="question-mark">?</div>
                    <div class="operator">=</div>
                    <div class="number-display">${question.total}</div>
                </div>
            `;
            speechText = `請問 ${question.a} 加多少等於 ${question.total}？`;
        }

        app.innerHTML = `
            <div class="game-container">
                <!-- 🆕 標題列 -->
                <div class="title-bar">
                    <div class="title-bar-left">
                        <span class="quiz-progress-info">第 ${this.state.currentQuestion + 1} / ${this.state.questions.length} 題</span>
                    </div>
                    <div class="title-bar-center">
                        <h1>單元F6：數的合成與分解</h1>
                    </div>
                    <div class="title-bar-right">
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                    </div>
                </div>

                <div class="question-section">
                    ${questionHTML}
                </div>

                <div class="options-section">
                    ${question.options.map(option => {
                        if (question.type === 'decomposition') {
                            const [left, right] = option.split(',');
                            const sum = parseInt(left) + parseInt(right);
                            return `
                                <button class="option-btn decomposition-option" data-answer="${option}">
                                    <div class="option-boxes">
                                        <div class="option-box left-option">
                                            <span class="option-label">左</span>
                                            <span class="option-number">${left}</span>
                                        </div>
                                        <div class="option-box right-option">
                                            <span class="option-label">右</span>
                                            <span class="option-number">${right}</span>
                                        </div>
                                    </div>
                                    <div class="option-sum">合: ${sum}</div>
                                </button>
                            `;
                        } else {
                            return `
                                <button class="option-btn" data-answer="${option}">
                                    ${option}
                                </button>
                            `;
                        }
                    }).join('')}
                </div>
            </div>
        `;

        this.Speech.speak(speechText);
        this.bindQuestionEvents();
    },

    // =====================================================
    // 渲染視覺元素
    // =====================================================
    renderVisuals(count) {
        const icons = Game.getActiveIcons();
        const icon = icons[Math.floor(Math.random() * icons.length)];

        return `
            <div class="visual-group">
                ${Array(count).fill(icon).map((i, idx) => `<span class="visual-item">${Game.renderIcon(i)}</span>`).join('')}
            </div>
        `;
    },

    // =====================================================
    // 🆕 渲染簡單模式的合成題目（拖曳式）
    // =====================================================
    renderEasyCompositionQuestion(question) {
        const app = document.getElementById('app');
        const { a, b, answer } = question;

        // 初始化狀態（如果還沒有）
        if (!this.easyCompositionState) {
            // 選擇emoji圖示（只在第一次初始化時選擇）
            const icons = Game.getActiveIcons();
            const selectedIcon = icons[Math.floor(Math.random() * icons.length)];

            this.easyCompositionState = {
                leftCount: a,
                rightCount: b,
                bottomCount: 0,
                totalAnswer: answer,
                icon: selectedIcon,
                hasPlayedVoice: false  // 🆕 標記是否已播放語音
            };
        }

        const state = this.easyCompositionState;

        app.innerHTML = `
            <div class="game-container">
                <!-- 標題列 -->
                <div class="title-bar">
                    <div class="title-bar-left">
                        <span class="quiz-progress-info">第 ${this.state.currentQuestion + 1} / ${this.state.questions.length} 題</span>
                    </div>
                    <div class="title-bar-center">
                        <h1>單元F6：數的合成與分解</h1>
                    </div>
                    <div class="title-bar-right">
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                    </div>
                </div>

                <!-- 簡單模式合成區域 -->
                <div class="easy-composition-container">
                    <!-- 上方左右兩個框 -->
                    <div class="top-boxes">
                        <!-- 左方框 -->
                        <div class="source-box left-box">
                            <div class="box-header">
                                <span class="box-number">${state.leftCount}</span>
                            </div>
                            <div class="box-content" id="left-box-content">
                                ${Array(a).fill(null).map((_, idx) => `
                                    <span class="draggable-emoji ${idx < state.leftCount ? '' : 'hidden'}"
                                          data-source="left"
                                          data-index="${idx}"
                                          draggable="${idx < state.leftCount}">${Game.renderIcon(state.icon)}</span>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 🆕 加號符號 -->
                        <div class="operator-symbol plus-symbol">+</div>

                        <!-- 右方框 -->
                        <div class="source-box right-box">
                            <div class="box-header">
                                <span class="box-number">${state.rightCount}</span>
                            </div>
                            <div class="box-content" id="right-box-content">
                                ${Array(b).fill(null).map((_, idx) => `
                                    <span class="draggable-emoji ${idx < state.rightCount ? '' : 'hidden'}"
                                          data-source="right"
                                          data-index="${idx}"
                                          draggable="${idx < state.rightCount}">${Game.renderIcon(state.icon)}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- 箭頭 -->
                    <div class="arrows-container">
                        <div class="arrow">↓</div>
                        <div class="arrow">↓</div>
                    </div>

                    <!-- 下方區域（等號 + 答案框） -->
                    <div class="bottom-area">
                        <!-- 🆕 等號符號 -->
                        <div class="operator-symbol equals-symbol">=</div>

                        <!-- 下方框 -->
                        <div class="target-box">
                            <div class="box-header">
                                <span class="box-number">${state.bottomCount}</span>
                            </div>
                            <div class="box-content" id="target-box-content">
                                ${Array(answer).fill(null).map((_, idx) => `
                                    <span class="drop-zone-emoji ${idx < state.bottomCount ? 'filled' : ''}"
                                          data-index="${idx}">${Game.renderIcon(state.icon)}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- 🔧 移除檢查答案按鈕，自動檢查 -->
                </div>
            </div>
        `;

        // 綁定拖曳事件
        this.bindEasyCompositionEvents();

        // 🆕 只在第一次進入時播放語音
        if (!state.hasPlayedVoice) {
            this.Speech.speak(`請問 ${a} 加 ${b} 等於多少？`);
            state.hasPlayedVoice = true;
        }
    },

    // =====================================================
    // 🆕 渲染普通模式的合成題目（拖曳式 + 選項）
    // =====================================================
    renderNormalCompositionQuestion(question) {
        const app = document.getElementById('app');
        const { a, b, answer, options } = question;

        // 初始化狀態（如果還沒有）
        if (!this.normalCompositionState) {
            // 選擇emoji圖示（只在第一次初始化時選擇）
            const icons = Game.getActiveIcons();
            const selectedIcon = icons[Math.floor(Math.random() * icons.length)];

            this.normalCompositionState = {
                leftCount: a,
                rightCount: b,
                bottomCount: 0,
                totalAnswer: answer,
                icon: selectedIcon,
                hasPlayedVoice: false,
                showOptions: false  // 是否顯示選項
            };
        }

        const state = this.normalCompositionState;

        app.innerHTML = `
            <div class="game-container">
                <!-- 標題列 -->
                <div class="title-bar">
                    <div class="title-bar-left">
                        <span class="quiz-progress-info">第 ${this.state.currentQuestion + 1} / ${this.state.questions.length} 題</span>
                    </div>
                    <div class="title-bar-center">
                        <h1>單元F6：數的合成與分解</h1>
                    </div>
                    <div class="title-bar-right">
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                    </div>
                </div>

                <!-- 簡單模式合成區域 -->
                <div class="easy-composition-container">
                    <!-- 上方左右兩個框 -->
                    <div class="top-boxes">
                        <!-- 左方框 -->
                        <div class="source-box left-box">
                            <div class="box-header">
                                <span class="box-number">${state.leftCount}</span>
                            </div>
                            <div class="box-content" id="left-box-content">
                                ${Array(a).fill(null).map((_, idx) => `
                                    <span class="draggable-emoji ${idx < state.leftCount ? '' : 'hidden'}"
                                          data-source="left"
                                          data-index="${idx}"
                                          draggable="${idx < state.leftCount}">${Game.renderIcon(state.icon)}</span>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 🆕 加號符號 -->
                        <div class="operator-symbol plus-symbol">+</div>

                        <!-- 右方框 -->
                        <div class="source-box right-box">
                            <div class="box-header">
                                <span class="box-number">${state.rightCount}</span>
                            </div>
                            <div class="box-content" id="right-box-content">
                                ${Array(b).fill(null).map((_, idx) => `
                                    <span class="draggable-emoji ${idx < state.rightCount ? '' : 'hidden'}"
                                          data-source="right"
                                          data-index="${idx}"
                                          draggable="${idx < state.rightCount}">${Game.renderIcon(state.icon)}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- 箭頭 -->
                    <div class="arrows-container">
                        <div class="arrow">↓</div>
                        <div class="arrow">↓</div>
                    </div>

                    <!-- 下方區域（等號 + 答案框） -->
                    <div class="bottom-area">
                        <!-- 🆕 等號符號 -->
                        <div class="operator-symbol equals-symbol">=</div>

                        <!-- 下方框 -->
                        <div class="target-box">
                            <div class="box-header">
                                <span class="box-number">?</span>
                            </div>
                            <div class="box-content" id="target-box-content">
                                ${Array(answer).fill(null).map((_, idx) => `
                                    <span class="drop-zone-emoji ${idx < state.bottomCount ? 'filled' : ''}"
                                          data-index="${idx}">${Game.renderIcon(state.icon)}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- 🆕 選項按鈕區域（拖曳完成後動態添加） -->
                </div>
            </div>
        `;

        // 綁定拖曳事件
        this.bindNormalCompositionEvents();

        // 🆕 只在第一次進入時播放語音
        if (!state.hasPlayedVoice) {
            this.Speech.speak(`請問 ${a} 加 ${b} 等於多少？`);
            state.hasPlayedVoice = true;
        }
    },

    // =====================================================
    // 🆕 渲染困難模式的合成題目（純數字版面）
    // =====================================================
    renderHardCompositionQuestion(question) {
        const app = document.getElementById('app');
        const { a, b, answer } = question;

        // 初始化狀態（如果還沒有）
        if (!this.hardCompositionState) {
            this.hardCompositionState = {
                leftNumber: a,
                rightNumber: b,
                userAnswer: null,
                correctAnswer: answer,
                hasPlayedVoice: false
            };
        }

        const state = this.hardCompositionState;

        app.innerHTML = `
            <div class="game-container">
                <!-- 標題列 -->
                <div class="title-bar">
                    <div class="title-bar-left">
                        <span class="quiz-progress-info">第 ${this.state.currentQuestion + 1} / ${this.state.questions.length} 題</span>
                    </div>
                    <div class="title-bar-center">
                        <h1>單元F6：數的合成與分解</h1>
                    </div>
                    <div class="title-bar-right">
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                    </div>
                </div>
                <!-- 提示按鈕（困難模式） -->
                <div style="display:flex; justify-content:flex-end; align-items:center; padding:4px 20px 0 20px;">
                    <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                    <button id="f6-hint-btn" onclick="Game.showHardHint()" style="position:relative; background:linear-gradient(45deg,#4CAF50,#45a049); color:white; border:none; border-radius:25px; padding:8px 18px; font-size:14px; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 15px rgba(76,175,80,0.3); transition:all 0.3s;">
                        <span style="font-size:16px;">💡</span><span>提示</span>
                    </button>
                </div>

                <!-- 困難模式合成區域 -->
                <div class="hard-composition-container">
                    <!-- 上方左右兩個數字框 -->
                    <div class="top-boxes">
                        <!-- 左方數字框 -->
                        <div class="number-box">
                            <div class="box-number-large">${state.leftNumber}</div>
                        </div>

                        <!-- 加號符號 -->
                        <div class="operator-symbol plus-symbol">+</div>

                        <!-- 右方數字框 -->
                        <div class="number-box">
                            <div class="box-number-large">${state.rightNumber}</div>
                        </div>
                    </div>

                    <!-- 箭頭 -->
                    <div class="arrows-container">
                        <div class="arrow">↓</div>
                    </div>

                    <!-- 下方區域（等號 + 答案框） -->
                    <div class="bottom-area">
                        <!-- 等號符號 -->
                        <div class="operator-symbol equals-symbol">=</div>

                        <!-- 答案輸入框 -->
                        <div class="answer-input-box" id="answer-input-box">
                            <div class="answer-display">
                                ${state.userAnswer !== null ? state.userAnswer : '?'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 綁定點擊事件
        this.bindHardCompositionEvents();

        // 🆕 只在第一次進入時播放語音
        if (!state.hasPlayedVoice) {
            this.Speech.speak(`請問 ${a} 加 ${b} 等於多少？`);
            state.hasPlayedVoice = true;
        }
    },

    // =====================================================
    // 🆕 渲染困難模式的填空題目（數字輸入版面）
    // =====================================================
    renderHardFillBlankQuestion(question) {
        const app = document.getElementById('app');
        const { a, total, answer } = question;

        // 初始化狀態（如果還沒有）
        if (!this.hardFillBlankState) {
            // 隨機 🎲決定輸入框在左邊還是右邊（0=左邊，1=右邊）
            const isLeftInput = Math.random() < 0.5;

            this.hardFillBlankState = {
                isLeftInput: isLeftInput,           // 左邊是否是輸入框
                displayNumber: a,                   // 顯示的數字（已知數）
                total: total,
                userAnswer: null,
                correctAnswer: answer,
                hasPlayedVoice: false
            };
        }

        const state = this.hardFillBlankState;

        app.innerHTML = `
            <div class="game-container">
                <!-- 標題列 -->
                <div class="title-bar">
                    <div class="title-bar-left">
                        <span class="quiz-progress-info">第 ${this.state.currentQuestion + 1} / ${this.state.questions.length} 題</span>
                    </div>
                    <div class="title-bar-center">
                        <h1>單元F6：數的合成與分解</h1>
                    </div>
                    <div class="title-bar-right">
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                    </div>
                </div>
                <!-- 提示按鈕（困難模式） -->
                <div style="display:flex; justify-content:flex-end; align-items:center; padding:4px 20px 0 20px;">
                    <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                    <button id="f6-hint-btn" onclick="Game.showHardHint()" style="position:relative; background:linear-gradient(45deg,#4CAF50,#45a049); color:white; border:none; border-radius:25px; padding:8px 18px; font-size:14px; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 15px rgba(76,175,80,0.3); transition:all 0.3s;">
                        <span style="font-size:16px;">💡</span><span>提示</span>
                    </button>
                </div>

                <!-- 困難模式填空區域 -->
                <div class="hard-composition-container">
                    <!-- 上方三個元素：數字 + 輸入框（隨機左右位置） -->
                    <div class="top-boxes">
                        <!-- 左邊框 -->
                        ${state.isLeftInput ? `
                            <div class="answer-input-box" id="answer-input-box" style="flex: 1; max-width: 300px; cursor: pointer;">
                                <div class="answer-display">
                                    ${state.userAnswer !== null ? state.userAnswer : '?'}
                                </div>
                            </div>
                        ` : `
                            <div class="number-box" style="flex: 1; max-width: 300px;">
                                <div class="box-number-large">${state.displayNumber}</div>
                            </div>
                        `}

                        <!-- 加號符號 -->
                        <div class="operator-symbol plus-symbol">+</div>

                        <!-- 右邊框 -->
                        ${state.isLeftInput ? `
                            <div class="number-box" style="flex: 1; max-width: 300px;">
                                <div class="box-number-large">${state.displayNumber}</div>
                            </div>
                        ` : `
                            <div class="answer-input-box" id="answer-input-box" style="flex: 1; max-width: 300px; cursor: pointer;">
                                <div class="answer-display">
                                    ${state.userAnswer !== null ? state.userAnswer : '?'}
                                </div>
                            </div>
                        `}
                    </div>

                    <!-- 箭頭 -->
                    <div class="arrows-container">
                        <div class="arrow">↓</div>
                    </div>

                    <!-- 下方區域（等號 + 總數） -->
                    <div class="bottom-area">
                        <!-- 等號符號 -->
                        <div class="operator-symbol equals-symbol">=</div>

                        <!-- 總數顯示框 -->
                        <div class="number-box">
                            <div class="box-number-large">${state.total}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 綁定點擊事件
        this.bindHardFillBlankEvents();

        // 🆕 只在第一次進入時播放語音（根據輸入框位置調整語音內容）
        if (!state.hasPlayedVoice) {
            const speechText = state.isLeftInput
                ? `請問多少加${state.displayNumber}等於${total}？`
                : `請問${state.displayNumber}加多少等於${total}？`;
            this.Speech.speak(speechText);
            state.hasPlayedVoice = true;
        }
    },

    // =====================================================
    // 🆕 渲染簡單模式的分解題目（拖曳式）
    // =====================================================
    renderEasyDecompositionQuestion(question) {
        const app = document.getElementById('app');
        const { total, answer } = question;

        // 解析答案，獲取左右兩個數字
        const [leftAnswer, rightAnswer] = answer.split(',').map(n => parseInt(n));

        // 初始化狀態（如果還沒有）
        if (!this.easyDecompositionState) {
            // 選擇emoji圖示（只在第一次初始化時選擇）
            const icons = Game.getActiveIcons();
            const selectedIcon = icons[Math.floor(Math.random() * icons.length)];

            this.easyDecompositionState = {
                topCount: total,        // 上方框的數量
                leftCount: 0,           // 下方左框的數量
                rightCount: 0,          // 下方右框的數量
                leftAnswer: leftAnswer, // 左邊正確答案
                rightAnswer: rightAnswer, // 右邊正確答案
                totalAnswer: total,     // 總數
                icon: selectedIcon,
                hasPlayedVoice: false
            };
        }

        const state = this.easyDecompositionState;

        app.innerHTML = `
            <div class="game-container">
                <!-- 標題列 -->
                <div class="title-bar">
                    <div class="title-bar-left">
                        <span class="quiz-progress-info">第 ${this.state.currentQuestion + 1} / ${this.state.questions.length} 題</span>
                    </div>
                    <div class="title-bar-center">
                        <h1>單元F6：數的合成與分解</h1>
                    </div>
                    <div class="title-bar-right">
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                    </div>
                </div>

                <!-- 簡單模式分解區域 -->
                <div class="easy-decomposition-container">
                    <!-- 上方框 -->
                    <div class="source-box top-box">
                        <div class="box-header">
                            <span class="box-number">${state.topCount}</span>
                        </div>
                        <div class="box-content" id="top-box-content">
                            ${Array(total).fill(null).map((_, idx) => `
                                <span class="draggable-emoji ${idx < state.topCount ? '' : 'hidden'}"
                                      data-source="top"
                                      data-index="${idx}"
                                      draggable="${idx < state.topCount}">${Game.renderIcon(state.icon)}</span>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 箭頭 -->
                    <div class="decomposition-arrows-container">
                        <div class="arrow">↓</div>
                        <div class="arrow">↓</div>
                    </div>

                    <!-- 下方區域（左右兩個框） -->
                    <div class="bottom-targets">
                        <!-- 左邊框 -->
                        <div class="target-box left-target">
                            <div class="box-header">
                                <span class="box-number">${state.leftCount}</span>
                            </div>
                            <div class="box-content" id="left-target-content">
                                ${Array(leftAnswer).fill(null).map((_, idx) => `
                                    <span class="drop-zone-emoji ${idx < state.leftCount ? 'filled' : ''}"
                                          data-target="left"
                                          data-index="${idx}">${Game.renderIcon(state.icon)}</span>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 右邊框 -->
                        <div class="target-box right-target">
                            <div class="box-header">
                                <span class="box-number">${state.rightCount}</span>
                            </div>
                            <div class="box-content" id="right-target-content">
                                ${Array(rightAnswer).fill(null).map((_, idx) => `
                                    <span class="drop-zone-emoji ${idx < state.rightCount ? 'filled' : ''}"
                                          data-target="right"
                                          data-index="${idx}">${Game.renderIcon(state.icon)}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- 🔧 自動檢查，無需按鈕 -->
                </div>
            </div>
        `;

        // 綁定拖曳事件
        this.bindEasyDecompositionEvents();

        // 🆕 只在第一次進入時播放語音
        if (!state.hasPlayedVoice) {
            this.Speech.speak(`請問 ${total} 可以分成多少？`);
            state.hasPlayedVoice = true;
        }
    },

    // =====================================================
    // 🆕 渲染普通模式的分解題目（拖曳式版面，數字隱藏 + 選項按鈕）
    // =====================================================
    renderNormalDecompositionQuestion(question) {
        const app = document.getElementById('app');
        const { total, answer, options } = question;

        // 解析答案，獲取左右兩個數字
        const [leftAnswer, rightAnswer] = answer.split(',').map(n => parseInt(n));

        // 初始化狀態（如果還沒有）
        if (!this.normalDecompositionState) {
            // 選擇emoji圖示（只在第一次初始化時選擇）
            const icons = Game.getActiveIcons();
            const selectedIcon = icons[Math.floor(Math.random() * icons.length)];

            this.normalDecompositionState = {
                topCount: total,        // 上方框的數量
                leftCount: 0,           // 下方左框的數量
                rightCount: 0,          // 下方右框的數量
                leftAnswer: leftAnswer, // 左邊正確答案
                rightAnswer: rightAnswer, // 右邊正確答案
                totalAnswer: total,     // 總數
                icon: selectedIcon,
                hasPlayedVoice: false,
                showOptions: false      // 是否顯示選項
            };
        }

        const state = this.normalDecompositionState;

        app.innerHTML = `
            <div class="game-container">
                <!-- 標題列 -->
                <div class="title-bar">
                    <div class="title-bar-left">
                        <span class="quiz-progress-info">第 ${this.state.currentQuestion + 1} / ${this.state.questions.length} 題</span>
                    </div>
                    <div class="title-bar-center">
                        <h1>單元F6：數的合成與分解</h1>
                    </div>
                    <div class="title-bar-right">
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                    </div>
                </div>

                <!-- 普通模式分解區域 -->
                <div class="easy-decomposition-container">
                    <!-- 上方框 -->
                    <div class="source-box top-box">
                        <div class="box-header">
                            <span class="box-number">${state.topCount}</span>
                        </div>
                        <div class="box-content" id="top-box-content">
                            ${Array(total).fill(null).map((_, idx) => `
                                <span class="draggable-emoji ${idx < state.topCount ? '' : 'hidden'}"
                                      data-source="top"
                                      data-index="${idx}"
                                      draggable="${idx < state.topCount}">${Game.renderIcon(state.icon)}</span>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 箭頭 -->
                    <div class="decomposition-arrows-container">
                        <div class="arrow">↓</div>
                        <div class="arrow">↓</div>
                    </div>

                    <!-- 下方區域（左右兩個框） -->
                    <div class="bottom-targets">
                        <!-- 左邊框 -->
                        <div class="target-box left-target">
                            <div class="box-header" style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <span class="box-number">?</span>
                                <span style="color: #4CAF50; font-size: 1.4em; font-weight: bold;">左</span>
                            </div>
                            <div class="box-content" id="left-target-content">
                                ${Array(leftAnswer).fill(null).map((_, idx) => `
                                    <span class="drop-zone-emoji ${idx < state.leftCount ? 'filled' : ''}"
                                          data-target="left"
                                          data-index="${idx}">${Game.renderIcon(state.icon)}</span>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 右邊框 -->
                        <div class="target-box right-target">
                            <div class="box-header" style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <span class="box-number">?</span>
                                <span style="color: #FF9800; font-size: 1.4em; font-weight: bold;">右</span>
                            </div>
                            <div class="box-content" id="right-target-content">
                                ${Array(rightAnswer).fill(null).map((_, idx) => `
                                    <span class="drop-zone-emoji ${idx < state.rightCount ? 'filled' : ''}"
                                          data-target="right"
                                          data-index="${idx}">${Game.renderIcon(state.icon)}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- 🆕 選項按鈕區域（拖曳完成後動態添加） -->
                </div>
            </div>
        `;

        // 綁定拖曳事件
        this.bindNormalDecompositionEvents();

        // 🆕 只在第一次進入時播放語音
        if (!state.hasPlayedVoice) {
            this.Speech.speak(`請問 ${total} 可以分成多少？`);
            state.hasPlayedVoice = true;
        }
    },

    // =====================================================
    // 🆕 渲染困難模式的分解題目（純數字版面，隨機一邊是輸入框）
    // =====================================================
    renderHardDecompositionQuestion(question) {
        const app = document.getElementById('app');
        const { total, answer } = question;

        // 解析答案，獲取左右兩個數字
        const [leftAnswer, rightAnswer] = answer.split(',').map(n => parseInt(n));

        // 初始化狀態（如果還沒有）
        if (!this.hardDecompositionState) {
            // 隨機 🎲決定哪一邊是輸入框（0=左邊，1=右邊）
            const isLeftInput = Math.random() < 0.5;

            this.hardDecompositionState = {
                total: total,
                leftAnswer: leftAnswer,
                rightAnswer: rightAnswer,
                isLeftInput: isLeftInput,           // 左邊是否是輸入框
                userAnswer: null,                   // 用戶輸入的答案
                correctAnswer: isLeftInput ? leftAnswer : rightAnswer,  // 正確答案
                displayNumber: isLeftInput ? rightAnswer : leftAnswer,  // 顯示的數字
                hasPlayedVoice: false
            };
        }

        const state = this.hardDecompositionState;

        app.innerHTML = `
            <div class="game-container">
                <!-- 標題列 -->
                <div class="title-bar">
                    <div class="title-bar-left">
                        <span class="quiz-progress-info">第 ${this.state.currentQuestion + 1} / ${this.state.questions.length} 題</span>
                    </div>
                    <div class="title-bar-center">
                        <h1>單元F6：數的合成與分解</h1>
                    </div>
                    <div class="title-bar-right">
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                    </div>
                </div>
                <!-- 提示按鈕（困難模式） -->
                <div style="display:flex; justify-content:flex-end; align-items:center; padding:4px 20px 0 20px;">
                    <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                    <button id="f6-hint-btn" onclick="Game.showHardHint()" style="position:relative; background:linear-gradient(45deg,#4CAF50,#45a049); color:white; border:none; border-radius:25px; padding:8px 18px; font-size:14px; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 15px rgba(76,175,80,0.3); transition:all 0.3s;">
                        <span style="font-size:16px;">💡</span><span>提示</span>
                    </button>
                </div>

                <!-- 困難模式分解區域 -->
                <div class="hard-composition-container">
                    <!-- 上方總數框 -->
                    <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                        <div class="number-box">
                            <div class="box-number-large">${state.total}</div>
                        </div>
                    </div>

                    <!-- 箭頭 -->
                    <div class="decomposition-arrows-container">
                        <div class="arrow">↓</div>
                        <div class="arrow">↓</div>
                    </div>

                    <!-- 下方區域（左右兩個框） -->
                    <div class="bottom-targets" style="display: flex; gap: 30px; justify-content: center; align-items: stretch; margin-top: 20px;">
                        <!-- 左邊框 -->
                        ${state.isLeftInput ? `
                            <div class="answer-input-box" id="left-input-box" style="flex: 1; max-width: 300px; cursor: pointer;">
                                <div class="answer-display">
                                    ${state.userAnswer !== null ? state.userAnswer : '?'}
                                </div>
                            </div>
                        ` : `
                            <div class="number-box" style="flex: 1; max-width: 300px;">
                                <div class="box-number-large">${state.displayNumber}</div>
                            </div>
                        `}

                        <!-- 右邊框 -->
                        ${state.isLeftInput ? `
                            <div class="number-box" style="flex: 1; max-width: 300px;">
                                <div class="box-number-large">${state.displayNumber}</div>
                            </div>
                        ` : `
                            <div class="answer-input-box" id="right-input-box" style="flex: 1; max-width: 300px; cursor: pointer;">
                                <div class="answer-display">
                                    ${state.userAnswer !== null ? state.userAnswer : '?'}
                                </div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        // 綁定點擊事件
        this.bindHardDecompositionEvents();

        // 🆕 只在第一次進入時播放語音
        if (!state.hasPlayedVoice) {
            this.Speech.speak(`請問 ${total} 可以分成多少？`);
            state.hasPlayedVoice = true;
        }
    },

    // =====================================================
    // 🆕 渲染簡單模式的填空題目（拖曳式）
    // =====================================================
    renderEasyFillBlankQuestion(question) {
        const app = document.getElementById('app');
        const { a, total, answer } = question;
        const b = parseInt(answer); // 缺少的數字（答案）

        // 初始化狀態（如果還沒有）
        if (!this.easyFillBlankState) {
            const icons = Game.getActiveIcons();
            const selectedIcon = icons[Math.floor(Math.random() * icons.length)];

            this.easyFillBlankState = {
                dragSourceCount: b,      // 上方可拖曳區的數量（等於答案）
                targetFilledCount: 0,    // 目標區（問號）已填入的數量
                knownCount: a,           // 已知數
                correctAnswer: b,        // 正確答案（缺少的數字）
                totalAnswer: total,
                icon: selectedIcon,
                hasPlayedVoice: false
            };
        }

        const state = this.easyFillBlankState;
        // 總數框內：已知數量為正常，答案數量中已填入的為正常、未填入的為淡化
        const totalNormalCount = a + state.targetFilledCount;
        const totalFadedCount = b - state.targetFilledCount;

        app.innerHTML = `
            <div class="game-container">
                <!-- 標題列 -->
                <div class="title-bar">
                    <div class="title-bar-left">
                        <span class="quiz-progress-info">第 ${this.state.currentQuestion + 1} / ${this.state.questions.length} 題</span>
                    </div>
                    <div class="title-bar-center">
                        <h1>單元F6：數的合成與分解</h1>
                    </div>
                    <div class="title-bar-right">
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                    </div>
                </div>

                <!-- 簡單模式填空區域 -->
                <div class="easy-fillblank-container">
                    <!-- 🆕 上方可拖曳區域 -->
                    <div class="fillblank-drag-source">
                        <div class="box-header">
                            <span class="box-number">${state.dragSourceCount}</span>
                        </div>
                        <div class="drag-source-content" id="fillblank-drag-source">
                            ${Array(b).fill(null).map((_, idx) => `
                                <span class="draggable-emoji ${idx < state.dragSourceCount ? '' : 'used'}"
                                      data-index="${idx}"
                                      draggable="${idx < state.dragSourceCount}">${Game.renderIcon(state.icon)}</span>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 題目區域：a + ? = total -->
                    <div class="fillblank-equation">
                        <!-- 已知數 a -->
                        <div class="equation-box known-box">
                            <div class="box-header">
                                <span class="box-number">${a}</span>
                            </div>
                            <div class="box-content">
                                ${Array(a).fill(null).map(() => `
                                    <span class="static-emoji">${Game.renderIcon(state.icon)}</span>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 加號 -->
                        <div class="operator-symbol plus-symbol">+</div>

                        <!-- 問號區域（目標區）：淡化圖示作為佔位符 -->
                        <div class="equation-box fillblank-target">
                            <div class="box-header">
                                <span class="box-number ${state.targetFilledCount > 0 ? '' : 'question-mark'}">${state.targetFilledCount > 0 ? state.targetFilledCount : '?'}</span>
                            </div>
                            <div class="box-content" id="fillblank-target-content">
                                ${Array(b).fill(null).map((_, idx) => `
                                    <span class="drop-zone-emoji ${idx < state.targetFilledCount ? 'filled' : 'faded'}"
                                          data-index="${idx}">${Game.renderIcon(state.icon)}</span>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 等號 -->
                        <div class="operator-symbol equals-symbol">=</div>

                        <!-- 總數區域：已知數為正常，答案部分根據填入進度顯示 -->
                        <div class="equation-box total-box fillblank-total">
                            <div class="box-header">
                                <span class="box-number">${total}</span>
                            </div>
                            <div class="box-content" id="fillblank-total-content">
                                ${Array(total).fill(null).map((_, idx) => {
                                    if (idx < totalNormalCount) {
                                        return `<span class="static-emoji">${Game.renderIcon(state.icon)}</span>`;
                                    } else {
                                        return `<span class="static-emoji faded">${Game.renderIcon(state.icon)}</span>`;
                                    }
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .easy-fillblank-container {
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    justify-content: center;
                    padding: 20px;
                    max-width: 900px;
                    margin: 0 auto;
                    min-height: 60vh;
                    gap: 30px;
                    box-sizing: border-box;
                    width: 100%;
                }
                .fillblank-drag-source {
                    background: linear-gradient(135deg, #f3e5f5, #e1bee7);
                    border: 3px solid #9C27B0;
                    border-radius: 15px;
                    padding: 20px;
                    text-align: center;
                    min-height: 200px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .drag-source-content {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .drag-source-content .draggable-emoji {
                    font-size: 2.5em;
                }
                .fillblank-target .drop-zone-emoji {
                    font-size: 2.5em;
                }
                .fillblank-equation {
                    display: flex;
                    align-items: stretch;
                    justify-content: center;
                    gap: 15px;
                }
                .equation-box {
                    flex: 1;
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    min-width: 0;
                    min-height: 160px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    box-sizing: border-box;
                }
                .equation-box .box-header {
                    margin-bottom: 10px;
                }
                .equation-box .box-content {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 8px;
                    max-width: 200px;
                }
                .known-box {
                    background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
                    border: 3px solid #4CAF50;
                }
                .fillblank-target {
                    background: linear-gradient(135deg, #fff3e0, #ffe0b2);
                    border: 3px dashed #FF9800;
                }
                .fillblank-total {
                    background: linear-gradient(135deg, #e3f2fd, #bbdefb);
                    border: 3px solid #2196F3;
                }
                .fillblank-equation .operator-symbol {
                    align-self: center;
                    flex-shrink: 0;
                }
                .static-emoji {
                    font-size: 2.5em;
                    display: inline-block;
                }
                .static-emoji.faded, .drop-zone-emoji.faded {
                    opacity: 0.3;
                }
                .drop-zone-emoji.filled {
                    opacity: 1;
                }
                .draggable-emoji.used {
                    display: none;
                }
            </style>
        `;

        // 綁定拖曳事件
        this.bindEasyFillBlankEvents();

        // 只在第一次進入時播放語音
        if (!state.hasPlayedVoice) {
            this.Speech.speak(`請問 ${a} 加多少等於 ${total}？`);
            state.hasPlayedVoice = true;
        }
    },

    // =====================================================
    // 🆕 渲染普通模式的填空題目（拖曳式 + 數字選項）
    // =====================================================
    renderNormalFillBlankQuestion(question) {
        const app = document.getElementById('app');
        const { a, total, answer, options, questionMarkPosition } = question;
        const b = parseInt(answer); // 缺少的數字

        // 初始化狀態（如果還沒有）
        if (!this.normalFillBlankState) {
            const icons = Game.getActiveIcons();
            const selectedIcon = icons[Math.floor(Math.random() * icons.length)];

            this.normalFillBlankState = {
                dragSourceCount: b,      // 上方可拖曳區的數量（等於答案）
                targetFilledCount: 0,    // 目標區（問號）已填入的數量
                knownCount: a,           // 已知數
                correctAnswer: b,        // 正確答案（缺少的數字）
                totalAnswer: total,
                icon: selectedIcon,
                hasPlayedVoice: false,
                showOptions: false,
                questionMarkPosition: questionMarkPosition ?? 1  // ? 的位置（0 或 1）
            };
        }

        const state = this.normalFillBlankState;
        // 總數框內：已知數量為正常，答案數量中已填入的為正常、未填入的為淡化
        const totalNormalCount = a + state.targetFilledCount;
        const totalFadedCount = b - state.targetFilledCount;

        // 根據 questionMarkPosition 決定顯示順序
        const isQuestionFirst = state.questionMarkPosition === 0;
        const firstBoxNumber = isQuestionFirst ? '?' : a;
        const secondBoxNumber = isQuestionFirst ? a : '?';
        const firstBoxCount = isQuestionFirst ? b : a;
        const secondBoxCount = isQuestionFirst ? a : b;
        const firstBoxIsTarget = isQuestionFirst;

        // 生成語音文字
        const speechText = isQuestionFirst
            ? `請問多少加${a}等於${total}`
            : `請問${a}加多少等於${total}`;

        app.innerHTML = `
            <div class="game-container">
                <!-- 標題列 -->
                <div class="title-bar">
                    <div class="title-bar-left">
                        <span class="quiz-progress-info">第 ${this.state.currentQuestion + 1} / ${this.state.questions.length} 題</span>
                    </div>
                    <div class="title-bar-center">
                        <h1>單元F6：數的合成與分解</h1>
                    </div>
                    <div class="title-bar-right">
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                    </div>
                </div>

                <!-- 普通模式填空區域 -->
                <div class="easy-fillblank-container">
                    <!-- 🆕 上方可拖曳區域 -->
                    <div class="fillblank-drag-source">
                        <div class="box-header">
                            <span class="box-number">?</span>
                        </div>
                        <div class="drag-source-content" id="fillblank-drag-source">
                            ${Array(b).fill(null).map((_, idx) => `
                                <span class="draggable-emoji ${idx < state.dragSourceCount ? '' : 'used'}"
                                      data-index="${idx}"
                                      draggable="${idx < state.dragSourceCount}">${Game.renderIcon(state.icon)}</span>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 題目區域 -->
                    <div class="fillblank-equation">
                        <!-- 第一個框（可能是已知數或問號） -->
                        <div class="equation-box ${firstBoxIsTarget ? 'fillblank-target' : 'known-box'}">
                            <div class="box-header">
                                <span class="box-number">${firstBoxNumber}</span>
                            </div>
                            <div class="box-content" ${firstBoxIsTarget ? 'id="fillblank-target-content"' : ''}>
                                ${firstBoxIsTarget ?
                                    Array(b).fill(null).map((_, idx) => `
                                        <span class="drop-zone-emoji ${idx < state.targetFilledCount ? 'filled' : 'faded'}"
                                              data-index="${idx}">${Game.renderIcon(state.icon)}</span>
                                    `).join('')
                                    :
                                    Array(a).fill(null).map(() => `
                                        <span class="static-emoji">${Game.renderIcon(state.icon)}</span>
                                    `).join('')
                                }
                            </div>
                        </div>

                        <!-- 加號 -->
                        <div class="operator-symbol plus-symbol">+</div>

                        <!-- 第二個框（可能是問號或已知數） -->
                        <div class="equation-box ${!firstBoxIsTarget ? 'fillblank-target' : 'known-box'}">
                            <div class="box-header">
                                <span class="box-number">${secondBoxNumber}</span>
                            </div>
                            <div class="box-content" ${!firstBoxIsTarget ? 'id="fillblank-target-content"' : ''}>
                                ${!firstBoxIsTarget ?
                                    Array(b).fill(null).map((_, idx) => `
                                        <span class="drop-zone-emoji ${idx < state.targetFilledCount ? 'filled' : 'faded'}"
                                              data-index="${idx}">${Game.renderIcon(state.icon)}</span>
                                    `).join('')
                                    :
                                    Array(a).fill(null).map(() => `
                                        <span class="static-emoji">${Game.renderIcon(state.icon)}</span>
                                    `).join('')
                                }
                            </div>
                        </div>

                        <!-- 等號 -->
                        <div class="operator-symbol equals-symbol">=</div>

                        <!-- 總數區域 -->
                        <div class="equation-box total-box fillblank-total">
                            <div class="box-header">
                                <span class="box-number">${total}</span>
                            </div>
                            <div class="box-content" id="fillblank-total-content">
                                ${Array(total).fill(null).map((_, idx) => {
                                    if (idx < totalNormalCount) {
                                        return `<span class="static-emoji">${Game.renderIcon(state.icon)}</span>`;
                                    } else {
                                        return `<span class="static-emoji faded">${Game.renderIcon(state.icon)}</span>`;
                                    }
                                }).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- 選項按鈕（拖曳完成後顯示） -->
                    ${state.showOptions ? `
                        <div class="options-section" style="margin-top: 30px;">
                            ${options.map(opt => `
                                <button class="option-btn fillblank-option-btn" data-answer="${opt}">
                                    ${opt}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>

            <style>
                .easy-fillblank-container {
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    justify-content: center;
                    padding: 20px;
                    max-width: 900px;
                    margin: 0 auto;
                    min-height: 60vh;
                    gap: 30px;
                    box-sizing: border-box;
                    width: 100%;
                }
                .fillblank-drag-source {
                    background: linear-gradient(135deg, #f3e5f5, #e1bee7);
                    border: 3px solid #9C27B0;
                    border-radius: 15px;
                    padding: 20px;
                    text-align: center;
                    min-height: 200px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .drag-source-content {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .drag-source-content .draggable-emoji {
                    font-size: 2.5em;
                }
                .fillblank-target .drop-zone-emoji {
                    font-size: 2.5em;
                }
                .fillblank-equation {
                    display: flex;
                    align-items: stretch;
                    justify-content: center;
                    gap: 15px;
                }
                .equation-box {
                    flex: 1;
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    min-width: 0;
                    min-height: 160px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    box-sizing: border-box;
                }
                .equation-box .box-header {
                    margin-bottom: 10px;
                }
                .equation-box .box-content {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 8px;
                    max-width: 200px;
                }
                .known-box {
                    background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
                    border: 3px solid #4CAF50;
                }
                .fillblank-target {
                    background: linear-gradient(135deg, #fff3e0, #ffe0b2);
                    border: 3px dashed #FF9800;
                }
                .fillblank-total {
                    background: linear-gradient(135deg, #e3f2fd, #bbdefb);
                    border: 3px solid #2196F3;
                }
                .fillblank-equation .operator-symbol {
                    align-self: center;
                    flex-shrink: 0;
                }
                .static-emoji {
                    font-size: 2.5em;
                    display: inline-block;
                }
                .static-emoji.faded, .drop-zone-emoji.faded {
                    opacity: 0.3;
                }
                .drop-zone-emoji.filled {
                    opacity: 1;
                }
                .draggable-emoji.used {
                    display: none;
                }
            </style>
        `;

        // 綁定拖曳事件
        this.bindNormalFillBlankEvents();

        // 只在第一次進入時播放語音
        if (!state.hasPlayedVoice) {
            this.Speech.speak(speechText);
            state.hasPlayedVoice = true;
        }
    },

    // =====================================================
    // 🆕 綁定簡單模式填空題目的拖曳事件
    // =====================================================
    bindEasyFillBlankEvents() {
        const draggableEmojis = document.querySelectorAll('.draggable-emoji:not(.used)');
        const targetBox = document.querySelector('.fillblank-target');
        const state = this.easyFillBlankState;

        // 為每個可拖曳的emoji綁定事件
        draggableEmojis.forEach(emoji => {
            emoji.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    index: emoji.dataset.index
                }));
                emoji.classList.add('dragging');
                // 🆕 建立去背拖曳預覽（桌面端）
                const _dragImg = emoji.querySelector('img');
                const _ghost = _dragImg ? _dragImg.cloneNode(true) : document.createElement('span');
                if (!_dragImg) {
                    _ghost.textContent = emoji.textContent.trim();
                    _ghost.style.fontSize = window.getComputedStyle(emoji).fontSize;
                    _ghost.style.lineHeight = '1';
                    _ghost.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
                }
                _ghost.style.position = 'absolute';
                _ghost.style.top = '-9999px';
                _ghost.style.left = '-9999px';
                _ghost.style.background = 'transparent';
                _ghost.style.border = 'none';
                _ghost.style.boxShadow = 'none';
                _ghost.style.padding = '4px';
                document.body.appendChild(_ghost);
                if (e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                    e.dataTransfer.setDragImage(_ghost, (_ghost.offsetWidth || 30) / 2, (_ghost.offsetHeight || 30) / 2);
                }
                this.TimerManager.setTimeout(() => _ghost.remove(), 0, 'dragSystem');
            });

            emoji.addEventListener('dragend', () => {
                emoji.classList.remove('dragging');
            });
        });

        // 目標區域的拖曳事件
        if (targetBox) {
            targetBox.addEventListener('dragover', (e) => {
                e.preventDefault();
                targetBox.classList.add('drag-over');
            });

            targetBox.addEventListener('dragleave', () => {
                targetBox.classList.remove('drag-over');
            });

            targetBox.addEventListener('drop', (e) => {
                e.preventDefault();
                targetBox.classList.remove('drag-over');

                // 防止答題過程中重複操作
                if (this.state.isAnswering) return;

                // 如果已經全部填滿，不再接受
                if (state.targetFilledCount >= state.correctAnswer) return;

                // 更新狀態
                state.dragSourceCount--;
                state.targetFilledCount++;

                // 播放音效
                this.Audio.play('selectSound');

                // 🆕 播放數字語音（目前已填入的數量）
                const currentCount = state.targetFilledCount;
                const speechText = (typeof NumberSpeechUtils !== 'undefined')
                    ? NumberSpeechUtils.convertToPureNumberSpeech(currentCount)
                    : String(currentCount);
                this.Speech.speak(speechText);

                // 重新渲染
                this.renderEasyFillBlankQuestion(this.state.questions[this.state.currentQuestion]);

                // 自動檢查答案
                this.checkEasyFillBlankAnswer();
            });
        }

        // 🆕 觸控拖曳支援
        if (window.TouchDragUtility) {
            const dragSourceEl = document.getElementById('fillblank-drag-source');
            const targetBoxEl = document.querySelector('.fillblank-target');

            if (dragSourceEl) {
                window.TouchDragUtility.registerDraggable(
                    dragSourceEl,
                    '.draggable-emoji:not(.used)',
                    {
                        onDragStart: (element) => {
                            element.classList.add('dragging');
                            return true;
                        },
                        onDrop: (element, dropZone) => {
                            if (this.state.isAnswering) return;
                            if (state.targetFilledCount >= state.correctAnswer) return;
                            state.dragSourceCount--;
                            state.targetFilledCount++;
                            this.Audio.play('selectSound');
                            const cnt = state.targetFilledCount;
                            const cntText = (typeof NumberSpeechUtils !== 'undefined')
                                ? NumberSpeechUtils.convertToPureNumberSpeech(cnt)
                                : String(cnt);
                            this.Speech.speak(cntText);
                            this.renderEasyFillBlankQuestion(this.state.questions[this.state.currentQuestion]);
                            this.checkEasyFillBlankAnswer();
                        },
                        onDragEnd: (element) => {
                            element.classList.remove('dragging');
                        }
                    }
                );
            }

            if (targetBoxEl) {
                window.TouchDragUtility.registerDropZone(targetBoxEl, () => true);
            }
        }
    },

    // =====================================================
    // 🆕 綁定普通模式填空題目的拖曳事件
    // =====================================================
    bindNormalFillBlankEvents() {
        const draggableEmojis = document.querySelectorAll('.draggable-emoji:not(.used)');
        const targetBox = document.querySelector('.fillblank-target');
        const state = this.normalFillBlankState;

        // 為每個可拖曳的emoji綁定事件
        draggableEmojis.forEach(emoji => {
            emoji.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    index: emoji.dataset.index
                }));
                emoji.classList.add('dragging');
                // 🆕 建立去背拖曳預覽（桌面端）
                const _dragImg = emoji.querySelector('img');
                const _ghost = _dragImg ? _dragImg.cloneNode(true) : document.createElement('span');
                if (!_dragImg) {
                    _ghost.textContent = emoji.textContent.trim();
                    _ghost.style.fontSize = window.getComputedStyle(emoji).fontSize;
                    _ghost.style.lineHeight = '1';
                    _ghost.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
                }
                _ghost.style.position = 'absolute';
                _ghost.style.top = '-9999px';
                _ghost.style.left = '-9999px';
                _ghost.style.background = 'transparent';
                _ghost.style.border = 'none';
                _ghost.style.boxShadow = 'none';
                _ghost.style.padding = '4px';
                document.body.appendChild(_ghost);
                if (e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                    e.dataTransfer.setDragImage(_ghost, (_ghost.offsetWidth || 30) / 2, (_ghost.offsetHeight || 30) / 2);
                }
                this.TimerManager.setTimeout(() => _ghost.remove(), 0, 'dragSystem');
            });

            emoji.addEventListener('dragend', () => {
                emoji.classList.remove('dragging');
            });
        });

        // 目標區域的拖曳事件
        if (targetBox) {
            targetBox.addEventListener('dragover', (e) => {
                e.preventDefault();
                targetBox.classList.add('drag-over');
            });

            targetBox.addEventListener('dragleave', () => {
                targetBox.classList.remove('drag-over');
            });

            targetBox.addEventListener('drop', (e) => {
                e.preventDefault();
                targetBox.classList.remove('drag-over');

                // 防止答題過程中重複操作
                if (this.state.isAnswering) return;

                // 如果已經全部填滿，不再接受
                if (state.targetFilledCount >= state.correctAnswer) return;

                // 更新狀態
                state.dragSourceCount--;
                state.targetFilledCount++;

                // 播放音效
                this.Audio.play('selectSound');

                // 🆕 播放數字語音（目前已填入的數量）
                const currentCount = state.targetFilledCount;
                const speechText = (typeof NumberSpeechUtils !== 'undefined')
                    ? NumberSpeechUtils.convertToPureNumberSpeech(currentCount)
                    : String(currentCount);
                this.Speech.speak(speechText);

                // 重新渲染
                this.renderNormalFillBlankQuestion(this.state.questions[this.state.currentQuestion]);

                // 檢查是否需要顯示選項（當所有圖示都拖完時）
                if (state.targetFilledCount === state.correctAnswer) {
                    state.showOptions = true;
                    this.renderNormalFillBlankQuestion(this.state.questions[this.state.currentQuestion]);
                    this.bindNormalFillBlankOptionEvents();
                    this.TimerManager.setTimeout(() => {
                        this.Speech.speak('請選擇正確的答案');
                    }, 800, 'speech');
                }
            });
        }

        // 綁定選項按鈕事件（如果已顯示）
        if (state.showOptions) {
            this.bindNormalFillBlankOptionEvents();
        }

        // 🆕 觸控拖曳支援
        if (window.TouchDragUtility) {
            const dragSourceEl = document.getElementById('fillblank-drag-source');
            const targetBoxEl = document.querySelector('.fillblank-target');

            if (dragSourceEl) {
                window.TouchDragUtility.registerDraggable(
                    dragSourceEl,
                    '.draggable-emoji:not(.used)',
                    {
                        onDragStart: (element) => {
                            element.classList.add('dragging');
                            return true;
                        },
                        onDrop: (element, dropZone) => {
                            if (this.state.isAnswering) return;
                            if (state.targetFilledCount >= state.correctAnswer) return;
                            state.dragSourceCount--;
                            state.targetFilledCount++;
                            this.Audio.play('selectSound');
                            const cnt = state.targetFilledCount;
                            const cntText = (typeof NumberSpeechUtils !== 'undefined')
                                ? NumberSpeechUtils.convertToPureNumberSpeech(cnt)
                                : String(cnt);
                            this.Speech.speak(cntText);
                            this.renderNormalFillBlankQuestion(this.state.questions[this.state.currentQuestion]);
                            if (state.targetFilledCount === state.correctAnswer) {
                                state.showOptions = true;
                                this.renderNormalFillBlankQuestion(this.state.questions[this.state.currentQuestion]);
                                this.bindNormalFillBlankOptionEvents();
                                this.TimerManager.setTimeout(() => {
                                    this.Speech.speak('請選擇正確的答案');
                                }, 800, 'speech');
                            }
                        },
                        onDragEnd: (element) => {
                            element.classList.remove('dragging');
                        }
                    }
                );
            }

            if (targetBoxEl) {
                window.TouchDragUtility.registerDropZone(targetBoxEl, () => true);
            }
        }
    },

    // =====================================================
    // 🆕 綁定普通模式填空選項按鈕事件
    // =====================================================
    bindNormalFillBlankOptionEvents() {
        const answerBtns = document.querySelectorAll('.fillblank-option-btn');
        const state = this.normalFillBlankState;

        answerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.state.isAnswering) return;
                this.state.isAnswering = true;

                const userAnswer = parseInt(btn.dataset.answer);
                const isCorrect = userAnswer === state.correctAnswer;

                if (isCorrect) {
                    btn.classList.add('correct');
                    this.Audio.play('correctSound');
                    this.state.score++;

                    // 🆕 播放情境語音：「恭喜你答對了，A 加 B 等於 C，進入下一題」
                    const isLastQuestion = this.state.currentQuestion + 1 >= this.state.questions.length;
                    const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';
                    const speechText = `恭喜你答對了，${state.knownCount} 加 ${state.correctAnswer} 等於 ${state.totalAnswer}${endingText}`;
                    this.Speech.speak(speechText).then(() => {
                        this.normalFillBlankState = null;
                        this.state.isAnswering = false;
                        this.nextQuestion();
                    });
                } else {
                    btn.classList.add('incorrect');
                    this.Audio.play('errorSound');
                    this.Speech.speak(NumberCompositionConfig.speech.incorrect[Math.floor(Math.random() * NumberCompositionConfig.speech.incorrect.length)]);

                    this.TimerManager.setTimeout(() => {
                        btn.classList.remove('incorrect');
                        this.state.isAnswering = false;
                    }, 1000, 'turnTransition');
                }
            });
        });
    },

    // =====================================================
    // 🆕 檢查簡單模式填空答案
    // =====================================================
    checkEasyFillBlankAnswer() {
        const state = this.easyFillBlankState;

        // 當所有圖示都拖放完成時，自動判定正確
        if (state.targetFilledCount === state.correctAnswer) {
            this.state.isAnswering = true;
            this.Audio.play('correctSound');

            // 顯示正確反饋動畫
            const targetBox = document.querySelector('.fillblank-target');
            if (targetBox) {
                targetBox.style.animation = 'pulse-correct 0.5s ease-in-out';
                targetBox.style.borderColor = '#4CAF50';
                targetBox.style.borderStyle = 'solid';
            }

            this.state.score++;

            // 🆕 播放情境語音：「恭喜你答對了，A 加 B 等於 C，進入下一題」
            const isLastQuestion = this.state.currentQuestion + 1 >= this.state.questions.length;
            const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';
            const speechText = `恭喜你答對了，${state.knownCount} 加 ${state.correctAnswer} 等於 ${state.totalAnswer}${endingText}`;
            this.Speech.speak(speechText).then(() => {
                this.easyFillBlankState = null;
                this.state.isAnswering = false;
                this.nextQuestion();
            });
        }
    },

    // =====================================================
    // 🆕 綁定簡單模式合成題目的拖曳事件
    // =====================================================
    bindEasyCompositionEvents() {
        const draggableEmojis = document.querySelectorAll('.draggable-emoji:not(.hidden)');
        const bottomArea = document.querySelector('.bottom-area'); // 🔧 選擇整個bottom-area
        const targetBox = document.querySelector('.target-box'); // 🔧 選擇整個target-box
        const targetBoxContent = document.getElementById('target-box-content');
        const allDropZones = document.querySelectorAll('.drop-zone-emoji'); // 🔧 選擇所有drop-zone，不論是否已填充

        // 拖曳開始
        draggableEmojis.forEach(emoji => {
            emoji.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    source: emoji.dataset.source,
                    index: emoji.dataset.index
                }));
                emoji.classList.add('dragging');
                // 🆕 建立去背拖曳預覽（桌面端）
                const _dragImg = emoji.querySelector('img');
                const _ghost = _dragImg ? _dragImg.cloneNode(true) : document.createElement('span');
                if (!_dragImg) {
                    _ghost.textContent = emoji.textContent.trim();
                    _ghost.style.fontSize = window.getComputedStyle(emoji).fontSize;
                    _ghost.style.lineHeight = '1';
                    _ghost.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
                }
                _ghost.style.position = 'absolute';
                _ghost.style.top = '-9999px';
                _ghost.style.left = '-9999px';
                _ghost.style.background = 'transparent';
                _ghost.style.border = 'none';
                _ghost.style.boxShadow = 'none';
                _ghost.style.padding = '4px';
                document.body.appendChild(_ghost);
                if (e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                    e.dataTransfer.setDragImage(_ghost, (_ghost.offsetWidth || 30) / 2, (_ghost.offsetHeight || 30) / 2);
                }
                this.TimerManager.setTimeout(() => _ghost.remove(), 0, 'dragSystem');
            });

            emoji.addEventListener('dragend', (e) => {
                emoji.classList.remove('dragging');
            });
        });

        // 🔧 設置放置區 - 整個bottom-area都可以接收拖曳（包括等號和target-box）
        if (bottomArea) {
            bottomArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            bottomArea.addEventListener('drop', (e) => {
                e.preventDefault();
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                this.handleEmojiDrop(data.source, data.index);
            });
        }

        // 🔧 已移除檢查答案按鈕，改為自動檢查

        // 🆕 觸控拖曳支援
        if (window.TouchDragUtility) {
            const leftBox = document.querySelector('#left-box-content');
            const rightBox = document.querySelector('#right-box-content');

            // 定義檢查是否為有效放置區的函數
            const isValidDropZone = (dropZone) => {
                // 🔧 接受整個bottom-area、target-box或其中的任何元素
                return dropZone.classList.contains('bottom-area') ||
                       dropZone.classList.contains('target-box') ||
                       dropZone.closest('.bottom-area') !== null ||
                       dropZone.closest('.target-box') !== null;
            };

            if (leftBox) {
                window.TouchDragUtility.registerDraggable(
                    leftBox,
                    '.draggable-emoji:not(.hidden)',
                    {
                        onDragStart: (element) => {
                            element.classList.add('dragging');
                            return true;
                        },
                        onDrop: (element, dropZone) => {
                            if (isValidDropZone(dropZone)) {
                                const source = element.dataset.source;
                                const index = element.dataset.index;
                                this.handleEmojiDrop(source, index);
                            }
                        },
                        onDragEnd: (element) => {
                            element.classList.remove('dragging');
                        }
                    }
                );
            }

            if (rightBox) {
                window.TouchDragUtility.registerDraggable(
                    rightBox,
                    '.draggable-emoji:not(.hidden)',
                    {
                        onDragStart: (element) => {
                            element.classList.add('dragging');
                            return true;
                        },
                        onDrop: (element, dropZone) => {
                            if (isValidDropZone(dropZone)) {
                                const source = element.dataset.source;
                                const index = element.dataset.index;
                                this.handleEmojiDrop(source, index);
                            }
                        },
                        onDragEnd: (element) => {
                            element.classList.remove('dragging');
                        }
                    }
                );
            }

            // 🔧 註冊整個bottom-area為放置區（包括等號和target-box）
            if (bottomArea) {
                window.TouchDragUtility.registerDropZone(bottomArea, () => true);
            }

            // 🔧 註冊整個target-box為放置區（包括標題和內容區）
            if (targetBox) {
                window.TouchDragUtility.registerDropZone(targetBox, () => true);
            }

            // 🔧 也註冊target-box內的所有子元素為放置區
            if (targetBoxContent) {
                window.TouchDragUtility.registerDropZone(targetBoxContent, () => true);
            }

            const boxHeader = targetBox ? targetBox.querySelector('.box-header') : null;
            if (boxHeader) {
                window.TouchDragUtility.registerDropZone(boxHeader, () => true);
            }

            // 🔧 註冊等號符號為放置區
            const equalsSymbol = document.querySelector('.equals-symbol');
            if (equalsSymbol) {
                window.TouchDragUtility.registerDropZone(equalsSymbol, () => true);
            }

            allDropZones.forEach(zone => {
                window.TouchDragUtility.registerDropZone(zone, () => true);
            });
        }
    },

    // =====================================================
    // 🆕 綁定簡單模式分解題目的拖曳事件
    // =====================================================
    bindEasyDecompositionEvents() {
        const draggableEmojis = document.querySelectorAll('.draggable-emoji:not(.hidden)');
        const leftTarget = document.querySelector('.left-target');
        const rightTarget = document.querySelector('.right-target');
        const leftTargetContent = document.getElementById('left-target-content');
        const rightTargetContent = document.getElementById('right-target-content');
        const allDropZones = document.querySelectorAll('.drop-zone-emoji');

        // 拖曳開始
        draggableEmojis.forEach(emoji => {
            emoji.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    source: emoji.dataset.source,
                    index: emoji.dataset.index
                }));
                emoji.classList.add('dragging');
                // 🆕 建立去背拖曳預覽（桌面端）
                const _dragImg = emoji.querySelector('img');
                const _ghost = _dragImg ? _dragImg.cloneNode(true) : document.createElement('span');
                if (!_dragImg) {
                    _ghost.textContent = emoji.textContent.trim();
                    _ghost.style.fontSize = window.getComputedStyle(emoji).fontSize;
                    _ghost.style.lineHeight = '1';
                    _ghost.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
                }
                _ghost.style.position = 'absolute';
                _ghost.style.top = '-9999px';
                _ghost.style.left = '-9999px';
                _ghost.style.background = 'transparent';
                _ghost.style.border = 'none';
                _ghost.style.boxShadow = 'none';
                _ghost.style.padding = '4px';
                document.body.appendChild(_ghost);
                if (e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                    e.dataTransfer.setDragImage(_ghost, (_ghost.offsetWidth || 30) / 2, (_ghost.offsetHeight || 30) / 2);
                }
                this.TimerManager.setTimeout(() => _ghost.remove(), 0, 'dragSystem');
            });

            emoji.addEventListener('dragend', (e) => {
                emoji.classList.remove('dragging');
            });
        });

        // 🔧 設置放置區 - 左邊target
        if (leftTarget) {
            leftTarget.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            leftTarget.addEventListener('drop', (e) => {
                e.preventDefault();
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                this.handleDecompositionDrop(data.source, data.index, 'left');
            });
        }

        // 🔧 設置放置區 - 右邊target
        if (rightTarget) {
            rightTarget.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            rightTarget.addEventListener('drop', (e) => {
                e.preventDefault();
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                this.handleDecompositionDrop(data.source, data.index, 'right');
            });
        }

        // 🆕 觸控拖曳支援
        if (window.TouchDragUtility) {
            const topBox = document.querySelector('#top-box-content');

            // 定義檢查是否為有效放置區的函數
            const isValidDropZone = (dropZone) => {
                return dropZone.classList.contains('left-target') ||
                       dropZone.classList.contains('right-target') ||
                       dropZone.closest('.left-target') !== null ||
                       dropZone.closest('.right-target') !== null;
            };

            if (topBox) {
                window.TouchDragUtility.registerDraggable(
                    topBox,
                    '.draggable-emoji:not(.hidden)',
                    {
                        onDragStart: (element) => {
                            element.classList.add('dragging');
                            return true;
                        },
                        onDrop: (element, dropZone) => {
                            const source = element.dataset.source;
                            const index = element.dataset.index;

                            // 判斷拖到左邊還是右邊
                            if (dropZone.classList.contains('left-target') ||
                                dropZone.closest('.left-target') !== null) {
                                this.handleDecompositionDrop(source, index, 'left');
                            } else if (dropZone.classList.contains('right-target') ||
                                       dropZone.closest('.right-target') !== null) {
                                this.handleDecompositionDrop(source, index, 'right');
                            }
                        },
                        onDragEnd: (element) => {
                            element.classList.remove('dragging');
                        }
                    }
                );
            }

            // 🔧 註冊左右target為放置區
            if (leftTarget) {
                window.TouchDragUtility.registerDropZone(leftTarget, () => true);
            }
            if (rightTarget) {
                window.TouchDragUtility.registerDropZone(rightTarget, () => true);
            }

            if (leftTargetContent) {
                window.TouchDragUtility.registerDropZone(leftTargetContent, () => true);
            }
            if (rightTargetContent) {
                window.TouchDragUtility.registerDropZone(rightTargetContent, () => true);
            }

            allDropZones.forEach(zone => {
                window.TouchDragUtility.registerDropZone(zone, () => true);
            });
        }
    },

    // =====================================================
    // 🆕 綁定普通模式分解題目的拖曳事件
    // =====================================================
    bindNormalDecompositionEvents() {
        const draggableEmojis = document.querySelectorAll('.draggable-emoji:not(.hidden)');
        const leftTarget = document.querySelector('.left-target');
        const rightTarget = document.querySelector('.right-target');
        const leftTargetContent = document.getElementById('left-target-content');
        const rightTargetContent = document.getElementById('right-target-content');
        const allDropZones = document.querySelectorAll('.drop-zone-emoji');

        // 拖曳開始
        draggableEmojis.forEach(emoji => {
            emoji.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    source: emoji.dataset.source,
                    index: emoji.dataset.index
                }));
                emoji.classList.add('dragging');
                // 🆕 建立去背拖曳預覽（桌面端）
                const _dragImg = emoji.querySelector('img');
                const _ghost = _dragImg ? _dragImg.cloneNode(true) : document.createElement('span');
                if (!_dragImg) {
                    _ghost.textContent = emoji.textContent.trim();
                    _ghost.style.fontSize = window.getComputedStyle(emoji).fontSize;
                    _ghost.style.lineHeight = '1';
                    _ghost.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
                }
                _ghost.style.position = 'absolute';
                _ghost.style.top = '-9999px';
                _ghost.style.left = '-9999px';
                _ghost.style.background = 'transparent';
                _ghost.style.border = 'none';
                _ghost.style.boxShadow = 'none';
                _ghost.style.padding = '4px';
                document.body.appendChild(_ghost);
                if (e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                    e.dataTransfer.setDragImage(_ghost, (_ghost.offsetWidth || 30) / 2, (_ghost.offsetHeight || 30) / 2);
                }
                this.TimerManager.setTimeout(() => _ghost.remove(), 0, 'dragSystem');
            });

            emoji.addEventListener('dragend', (e) => {
                emoji.classList.remove('dragging');
            });
        });

        // 🔧 設置放置區 - 左邊target
        if (leftTarget) {
            leftTarget.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            leftTarget.addEventListener('drop', (e) => {
                e.preventDefault();
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                this.handleNormalDecompositionDrop(data.source, data.index, 'left');
            });
        }

        // 🔧 設置放置區 - 右邊target
        if (rightTarget) {
            rightTarget.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            rightTarget.addEventListener('drop', (e) => {
                e.preventDefault();
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                this.handleNormalDecompositionDrop(data.source, data.index, 'right');
            });
        }

        // 🆕 觸控拖曳支援
        if (window.TouchDragUtility) {
            const topBox = document.querySelector('#top-box-content');

            // 定義檢查是否為有效放置區的函數
            const isValidDropZone = (dropZone) => {
                return dropZone.classList.contains('left-target') ||
                       dropZone.classList.contains('right-target') ||
                       dropZone.closest('.left-target') !== null ||
                       dropZone.closest('.right-target') !== null;
            };

            if (topBox) {
                window.TouchDragUtility.registerDraggable(
                    topBox,
                    '.draggable-emoji:not(.hidden)',
                    {
                        onDragStart: (element) => {
                            element.classList.add('dragging');
                            return true;
                        },
                        onDrop: (element, dropZone) => {
                            const source = element.dataset.source;
                            const index = element.dataset.index;

                            // 判斷拖到左邊還是右邊
                            if (dropZone.classList.contains('left-target') ||
                                dropZone.closest('.left-target') !== null) {
                                this.handleNormalDecompositionDrop(source, index, 'left');
                            } else if (dropZone.classList.contains('right-target') ||
                                       dropZone.closest('.right-target') !== null) {
                                this.handleNormalDecompositionDrop(source, index, 'right');
                            }
                        },
                        onDragEnd: (element) => {
                            element.classList.remove('dragging');
                        }
                    }
                );
            }

            // 🔧 註冊左右target為放置區
            if (leftTarget) {
                window.TouchDragUtility.registerDropZone(leftTarget, () => true);
            }
            if (rightTarget) {
                window.TouchDragUtility.registerDropZone(rightTarget, () => true);
            }

            if (leftTargetContent) {
                window.TouchDragUtility.registerDropZone(leftTargetContent, () => true);
            }
            if (rightTargetContent) {
                window.TouchDragUtility.registerDropZone(rightTargetContent, () => true);
            }

            allDropZones.forEach(zone => {
                window.TouchDragUtility.registerDropZone(zone, () => true);
            });
        }
    },

    // =====================================================
    // 🆕 處理分解題目的拖曳放置
    // =====================================================
    handleDecompositionDrop(source, index, targetSide) {
        const state = this.easyDecompositionState;

        // 更新上方框數量
        state.topCount--;

        // 更新目標框數量
        if (targetSide === 'left') {
            state.leftCount++;
        } else if (targetSide === 'right') {
            state.rightCount++;
        }

        // 播放音效
        this.Audio.play('selectSound');

        // 🔧 優化：只更新必要的DOM元素
        // 1. 更新上方框的數字
        const topBox = document.querySelector('.top-box');
        if (topBox) {
            const numberDisplay = topBox.querySelector('.box-number');
            if (numberDisplay) {
                numberDisplay.textContent = state.topCount;
            }
        }

        // 2. 隱藏被拖曳的emoji
        const draggedEmoji = document.querySelector(`.draggable-emoji[data-source="${source}"][data-index="${index}"]`);
        if (draggedEmoji) {
            draggedEmoji.classList.add('hidden');
            draggedEmoji.draggable = false;
        }

        // 3. 更新目標框的數字
        const targetBoxSelector = targetSide === 'left' ? '.left-target' : '.right-target';
        const targetBox = document.querySelector(targetBoxSelector);
        if (targetBox) {
            const numberDisplay = targetBox.querySelector('.box-number');
            if (numberDisplay) {
                numberDisplay.textContent = targetSide === 'left' ? state.leftCount : state.rightCount;
            }
        }

        // 4. 填充下一個空的drop-zone
        const targetContentId = targetSide === 'left' ? 'left-target-content' : 'right-target-content';
        const emptyDropZone = document.querySelector(`#${targetContentId} .drop-zone-emoji:not(.filled)`);
        if (emptyDropZone) {
            emptyDropZone.classList.add('filled');
        }

        // 🆕 5. 播放當前目標框數量的語音
        const currentCount = targetSide === 'left' ? state.leftCount : state.rightCount;
        this.Speech.speak(`${currentCount}`);

        // 🆕 6. 如果全部放置完成，自動檢查答案
        if (state.topCount === 0 &&
            state.leftCount === state.leftAnswer &&
            state.rightCount === state.rightAnswer) {
            // 延遲一下，讓語音播放完
            this.TimerManager.setTimeout(() => {
                this.checkEasyDecompositionAnswer();
            }, 800);
        }
    },

    // =====================================================
    // 🆕 處理普通模式分解題目的拖曳放置（隱藏數字 + 完成後顯示選項）
    // =====================================================
    handleNormalDecompositionDrop(source, index, targetSide) {
        const state = this.normalDecompositionState;

        // 更新上方框數量
        state.topCount--;

        // 更新目標框數量
        if (targetSide === 'left') {
            state.leftCount++;
        } else if (targetSide === 'right') {
            state.rightCount++;
        }

        // 播放音效
        this.Audio.play('selectSound');

        // 🔧 優化：只更新必要的DOM元素
        // 1. 更新上方框的數字
        const topBox = document.querySelector('.top-box');
        if (topBox) {
            const numberDisplay = topBox.querySelector('.box-number');
            if (numberDisplay) {
                numberDisplay.textContent = state.topCount;
            }
        }

        // 2. 隱藏被拖曳的emoji
        const draggedEmoji = document.querySelector(`.draggable-emoji[data-source="${source}"][data-index="${index}"]`);
        if (draggedEmoji) {
            draggedEmoji.classList.add('hidden');
            draggedEmoji.draggable = false;
        }

        // 3. 填充下一個空的drop-zone（不更新數字顯示）
        const targetContentId = targetSide === 'left' ? 'left-target-content' : 'right-target-content';
        const emptyDropZone = document.querySelector(`#${targetContentId} .drop-zone-emoji:not(.filled)`);
        if (emptyDropZone) {
            emptyDropZone.classList.add('filled');
        }

        // 🆕 4. 播放當前目標框數量的語音
        const currentCount = targetSide === 'left' ? state.leftCount : state.rightCount;
        this.Speech.speak(`${currentCount}`);

        // 🆕 5. 如果全部放置完成，顯示選項按鈕
        if (state.topCount === 0 &&
            state.leftCount === state.leftAnswer &&
            state.rightCount === state.rightAnswer) {
            state.showOptions = true;
            // 延遲一下，讓數字語音播放完
            this.TimerManager.setTimeout(() => {
                const question = this.state.questions[this.state.currentQuestion];

                // 🔧 動態添加選項按鈕，而不是重新渲染整個頁面
                const container = document.querySelector('.easy-decomposition-container');
                if (container && !document.querySelector('.options-section')) {
                    const optionsHTML = `
                        <div class="options-section" style="margin-top: 30px;">
                            ${question.options.map(option => {
                                const [left, right] = option.split(',');
                                return `
                                    <button class="option-btn decomposition-option" data-answer="${option}">
                                        <div class="option-boxes">
                                            <div class="option-box left-option">
                                                <span class="option-label">左</span>
                                                <span class="option-number">${left}</span>
                                            </div>
                                            <div class="option-box right-option">
                                                <span class="option-label">右</span>
                                                <span class="option-number">${right}</span>
                                            </div>
                                        </div>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', optionsHTML);

                    // 綁定選項按鈕事件
                    this.bindNormalDecompositionOptionEvents();
                }

                // 🆕 播放選項提示語音
                this.TimerManager.setTimeout(() => {
                    this.Speech.speak(`請問 ${question.total} 可以分成多少？請選擇正確的答案`);
                }, 100);
            }, 800);
        }
    },

    // =====================================================
    // 🆕 檢查簡單模式分解答案
    // =====================================================
    checkEasyDecompositionAnswer() {
        const state = this.easyDecompositionState;
        const question = this.state.questions[this.state.currentQuestion];

        if (state.topCount === 0 &&
            state.leftCount === state.leftAnswer &&
            state.rightCount === state.rightAnswer) {
            // 答對了！
            this.Audio.play('correctSound');

            // 🎉 播放煙火動畫
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

            // 判斷是否為最後一題
            const isLastQuestion = this.state.currentQuestion + 1 >= this.state.questions.length;
            const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';

            // 🆕 播放完整語音：「答對了，10可以分成6和4，進入下一題」
            const speechText = `恭喜你答對了，${state.totalAnswer} 可以分成 ${state.leftAnswer} 和 ${state.rightAnswer}${endingText}`;

            this.state.score++;

            // 重置狀態
            this.easyDecompositionState = null;

            // 等語音播完才進入下一題（避免語音被下一題截斷）
            this.Speech.speak(speechText).then(() => {
                this.nextQuestion();
            });
        } else {
            // 答錯
            this.Audio.play('errorSound');
        }
    },

    // =====================================================
    // 🆕 綁定普通模式合成題目的拖曳事件
    // =====================================================
    bindNormalCompositionEvents() {
        const draggableEmojis = document.querySelectorAll('.draggable-emoji:not(.hidden)');
        const bottomArea = document.querySelector('.bottom-area');
        const targetBox = document.querySelector('.target-box');
        const targetBoxContent = document.getElementById('target-box-content');
        const allDropZones = document.querySelectorAll('.drop-zone-emoji');

        // 拖曳開始
        draggableEmojis.forEach(emoji => {
            emoji.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    source: emoji.dataset.source,
                    index: emoji.dataset.index
                }));
                emoji.classList.add('dragging');
                // 🆕 建立去背拖曳預覽（桌面端）
                const _dragImg = emoji.querySelector('img');
                const _ghost = _dragImg ? _dragImg.cloneNode(true) : document.createElement('span');
                if (!_dragImg) {
                    _ghost.textContent = emoji.textContent.trim();
                    _ghost.style.fontSize = window.getComputedStyle(emoji).fontSize;
                    _ghost.style.lineHeight = '1';
                    _ghost.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
                }
                _ghost.style.position = 'absolute';
                _ghost.style.top = '-9999px';
                _ghost.style.left = '-9999px';
                _ghost.style.background = 'transparent';
                _ghost.style.border = 'none';
                _ghost.style.boxShadow = 'none';
                _ghost.style.padding = '4px';
                document.body.appendChild(_ghost);
                if (e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                    e.dataTransfer.setDragImage(_ghost, (_ghost.offsetWidth || 30) / 2, (_ghost.offsetHeight || 30) / 2);
                }
                this.TimerManager.setTimeout(() => _ghost.remove(), 0, 'dragSystem');
            });

            emoji.addEventListener('dragend', (e) => {
                emoji.classList.remove('dragging');
            });
        });

        // 🔧 設置放置區 - 整個bottom-area都可以接收拖曳
        if (bottomArea) {
            bottomArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            bottomArea.addEventListener('drop', (e) => {
                e.preventDefault();
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                this.handleNormalCompositionDrop(data.source, data.index);
            });
        }

        // 🆕 觸控拖曳支援
        if (window.TouchDragUtility) {
            const leftBox = document.querySelector('#left-box-content');
            const rightBox = document.querySelector('#right-box-content');

            const isValidDropZone = (dropZone) => {
                return dropZone.classList.contains('bottom-area') ||
                       dropZone.classList.contains('target-box') ||
                       dropZone.closest('.bottom-area') !== null ||
                       dropZone.closest('.target-box') !== null;
            };

            if (leftBox) {
                window.TouchDragUtility.registerDraggable(
                    leftBox,
                    '.draggable-emoji:not(.hidden)',
                    {
                        onDragStart: (element) => {
                            element.classList.add('dragging');
                            return true;
                        },
                        onDrop: (element, dropZone) => {
                            if (isValidDropZone(dropZone)) {
                                const source = element.dataset.source;
                                const index = element.dataset.index;
                                this.handleNormalCompositionDrop(source, index);
                            }
                        },
                        onDragEnd: (element) => {
                            element.classList.remove('dragging');
                        }
                    }
                );
            }

            if (rightBox) {
                window.TouchDragUtility.registerDraggable(
                    rightBox,
                    '.draggable-emoji:not(.hidden)',
                    {
                        onDragStart: (element) => {
                            element.classList.add('dragging');
                            return true;
                        },
                        onDrop: (element, dropZone) => {
                            if (isValidDropZone(dropZone)) {
                                const source = element.dataset.source;
                                const index = element.dataset.index;
                                this.handleNormalCompositionDrop(source, index);
                            }
                        },
                        onDragEnd: (element) => {
                            element.classList.remove('dragging');
                        }
                    }
                );
            }

            if (bottomArea) {
                window.TouchDragUtility.registerDropZone(bottomArea, () => true);
            }

            if (targetBox) {
                window.TouchDragUtility.registerDropZone(targetBox, () => true);
            }

            if (targetBoxContent) {
                window.TouchDragUtility.registerDropZone(targetBoxContent, () => true);
            }

            const boxHeader = targetBox ? targetBox.querySelector('.box-header') : null;
            if (boxHeader) {
                window.TouchDragUtility.registerDropZone(boxHeader, () => true);
            }

            const equalsSymbol = document.querySelector('.equals-symbol');
            if (equalsSymbol) {
                window.TouchDragUtility.registerDropZone(equalsSymbol, () => true);
            }

            allDropZones.forEach(zone => {
                window.TouchDragUtility.registerDropZone(zone, () => true);
            });
        }
    },

    // =====================================================
    // 🆕 處理普通模式合成題目的拖曳放置
    // =====================================================
    handleNormalCompositionDrop(source, index) {
        const state = this.normalCompositionState;

        // 更新數量
        if (source === 'left') {
            state.leftCount--;
        } else if (source === 'right') {
            state.rightCount--;
        }
        state.bottomCount++;

        // 播放音效
        this.Audio.play('selectSound');

        // 🔧 優化：只更新必要的DOM元素
        // 1. 更新來源框的數字
        const sourceBoxSelector = source === 'left' ? '.left-box' : '.right-box';
        const sourceBox = document.querySelector(sourceBoxSelector);
        if (sourceBox) {
            const numberDisplay = sourceBox.querySelector('.box-number');
            if (numberDisplay) {
                numberDisplay.textContent = source === 'left' ? state.leftCount : state.rightCount;
            }
        }

        // 2. 隱藏被拖曳的emoji
        const draggedEmoji = document.querySelector(`.draggable-emoji[data-source="${source}"][data-index="${index}"]`);
        if (draggedEmoji) {
            draggedEmoji.classList.add('hidden');
            draggedEmoji.draggable = false;
        }

        // 3. 填充下一個空的drop-zone
        const emptyDropZone = document.querySelector('.drop-zone-emoji:not(.filled)');
        if (emptyDropZone) {
            emptyDropZone.classList.add('filled');
        }

        // 🆕 4. 播放當前數量的語音
        this.Speech.speak(`${state.bottomCount}`);

        // 🆕 5. 如果全部放置完成，顯示選項按鈕
        if (state.bottomCount === state.totalAnswer && state.leftCount === 0 && state.rightCount === 0) {
            state.showOptions = true;
            // 延遲一下，讓數字語音播放完
            this.TimerManager.setTimeout(() => {
                const question = this.state.questions[this.state.currentQuestion];

                // 🔧 動態添加選項按鈕，而不是重新渲染整個頁面
                const container = document.querySelector('.easy-composition-container');
                if (container && !document.querySelector('.options-section')) {
                    const optionsHTML = `
                        <div class="options-section" style="margin-top: 30px;">
                            ${question.options.map(option => `
                                <button class="option-btn" data-answer="${option}">
                                    ${option}
                                </button>
                            `).join('')}
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', optionsHTML);

                    // 綁定選項按鈕事件
                    this.bindNormalCompositionOptionEvents();
                }

                // 🆕 播放選項提示語音
                this.TimerManager.setTimeout(() => {
                    this.Speech.speak('請選擇正確的答案');
                }, 100);
            }, 800);
        }
    },

    // =====================================================
    // 🆕 綁定普通模式合成題目的選項事件
    // =====================================================
    bindNormalCompositionOptionEvents() {
        const question = this.state.questions[this.state.currentQuestion];
        const correctAnswer = question.answer.toString();
        const { testMode } = this.state.settings;

        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // 🛡️ 點擊守衛：防止答題過程中重複點擊
                if (this.state.isAnswering) {
                    GameDebug.log('interaction', '⏸️ 遊戲正在回答中，忽略點擊');
                    return;
                }

                const userAnswer = btn.dataset.answer;

                // 設置答題狀態
                this.state.isAnswering = true;

                if (userAnswer === correctAnswer) {
                    // 答對了！
                    btn.classList.add('correct');
                    this.Audio.play('correctSound');

                    // 🎉 播放煙火動畫
                    if (typeof confetti !== 'undefined') {
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 }
                        });
                    }

                    // 判斷是否為最後一題
                    const isLastQuestion = this.state.currentQuestion + 1 >= this.state.questions.length;
                    const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';

                    // 🆕 播放完整語音：「答對了，2+3=5，進入下一題」
                    const state = this.normalCompositionState;
                    const speechText = `恭喜你答對了，${question.a} 加 ${question.b} 等於 ${question.answer}${endingText}`;

                    this.state.score++;

                    // 重置狀態
                    this.normalCompositionState = null;

                    // 🔧 等語音完整播完後再進入下一題（避免被下一題語音截斷）
                    this.Speech.speak(speechText).then(() => {
                        this.TimerManager.setTimeout(() => {
                            this.nextQuestion();  // nextQuestion 會重置 isAnswering
                        }, 500, 'turnTransition');
                    });
                } else {
                    // 答錯了
                    btn.classList.add('incorrect');
                    this.Audio.play('errorSound');

                    if (testMode === 'retry') {
                        // 🔄 反複練習模式：允許重新選擇
                        const feedback = NumberCompositionConfig.speech.incorrect;
                        this.Speech.speak(feedback[Math.floor(Math.random() * feedback.length)]);

                        this.TimerManager.setTimeout(() => {
                            btn.classList.remove('incorrect');
                            this.state.isAnswering = false;  // 🔓 允許重新選擇
                        }, 1000);
                    } else if (testMode === 'single') {
                        // ➡️ 單次作答模式：顯示正確答案，自動進入下一題
                        const template = NumberCompositionConfig.speech.incorrectWithAnswer;
                        // 使用共用模組轉換數字為中文讀法
                        const convertedAnswer = (typeof NumberSpeechUtils !== 'undefined' && !isNaN(correctAnswer))
                            ? NumberSpeechUtils.convertToPureNumberSpeech(parseInt(correctAnswer))
                            : correctAnswer;
                        // 判斷是否為最後一題
                        const isLastQuestion = this.state.currentQuestion + 1 >= this.state.questions.length;
                        const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';
                        const speechText = template.replace('{answer}', convertedAnswer) + endingText;

                        GameDebug.log('answer', '單次作答錯誤', { correctAnswer, speechText });

                        // 🟢 立即標示正確答案為綠色
                        this.TimerManager.setTimeout(() => {
                            document.querySelectorAll('.option-btn').forEach(b => {
                                if (b.dataset.answer === correctAnswer) {
                                    b.classList.add('correct');
                                }
                            });
                        }, 500);

                        // 播放語音並等待完成後再進入下一題
                        this.Speech.speak(speechText).then(() => {
                            // 語音播放完成，短暫延遲後進入下一題
                            this.TimerManager.setTimeout(() => {
                                btn.classList.remove('incorrect');
                                this.normalCompositionState = null;  // 重置狀態
                                this.nextQuestion();  // nextQuestion 會重置 isAnswering
                            }, 500);
                        });
                    } else {
                        // 簡單模式（testMode === null）：保持原有行為
                        const feedback = NumberCompositionConfig.speech.incorrect;
                        this.Speech.speak(feedback[Math.floor(Math.random() * feedback.length)]);

                        this.TimerManager.setTimeout(() => {
                            btn.classList.remove('incorrect');
                            this.state.isAnswering = false;  // 🔓 允許重新選擇
                        }, 1000);
                    }
                }
            });
        });
    },

    // =====================================================
    // 🆕 綁定普通模式分解題目的選項事件
    // =====================================================
    bindNormalDecompositionOptionEvents() {
        const question = this.state.questions[this.state.currentQuestion];
        const correctAnswer = question.answer; // 格式：'2,3'
        const state = this.normalDecompositionState;
        const { testMode } = this.state.settings;

        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // 🛡️ 點擊守衛：防止答題過程中重複點擊
                if (this.state.isAnswering) {
                    GameDebug.log('interaction', '⏸️ 遊戲正在回答中，忽略點擊');
                    return;
                }

                const userAnswer = btn.dataset.answer;

                // 設置答題狀態
                this.state.isAnswering = true;

                if (userAnswer === correctAnswer) {
                    // 答對了！
                    btn.classList.add('correct');
                    this.Audio.play('correctSound');

                    // 🎉 播放煙火動畫
                    if (typeof confetti !== 'undefined') {
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 }
                        });
                    }

                    // 🆕 播放完整語音：「答對了，5可分成2跟3」
                    const speechText = `答對了，${state.totalAnswer} 可分成 ${state.leftAnswer} 跟 ${state.rightAnswer}`;
                    this.Speech.speak(speechText);

                    this.state.score++;

                    // 重置狀態
                    this.normalDecompositionState = null;

                    // 🔧 等待語音播放完成後再進入下一題
                    this.TimerManager.setTimeout(() => {
                        this.nextQuestion();  // nextQuestion 會重置 isAnswering
                    }, 3500);
                } else {
                    // 答錯了
                    btn.classList.add('incorrect');
                    this.Audio.play('errorSound');

                    if (testMode === 'retry') {
                        // 🔄 反複練習模式：允許重新選擇
                        const feedback = NumberCompositionConfig.speech.incorrect;
                        this.Speech.speak(feedback[Math.floor(Math.random() * feedback.length)]);

                        this.TimerManager.setTimeout(() => {
                            btn.classList.remove('incorrect');
                            this.state.isAnswering = false;  // 🔓 允許重新選擇
                        }, 1000);
                    } else if (testMode === 'single') {
                        // ➡️ 單次作答模式：顯示正確答案，自動進入下一題
                        // 格式化正確答案顯示
                        const [a, b] = correctAnswer.split(',');
                        // 使用共用模組轉換數字為中文讀法
                        const convertedA = (typeof NumberSpeechUtils !== 'undefined' && !isNaN(a))
                            ? NumberSpeechUtils.convertToPureNumberSpeech(parseInt(a))
                            : a;
                        const convertedB = (typeof NumberSpeechUtils !== 'undefined' && !isNaN(b))
                            ? NumberSpeechUtils.convertToPureNumberSpeech(parseInt(b))
                            : b;
                        const answerDisplay = `${convertedA} 跟 ${convertedB}`;

                        const template = NumberCompositionConfig.speech.incorrectWithAnswer;
                        const speechText = template.replace('{answer}', answerDisplay);

                        GameDebug.log('answer', '單次作答錯誤', { correctAnswer, speechText });

                        // 🟢 立即標示正確答案為綠色
                        this.TimerManager.setTimeout(() => {
                            document.querySelectorAll('.option-btn').forEach(b => {
                                if (b.dataset.answer === correctAnswer) {
                                    b.classList.add('correct');
                                }
                            });
                        }, 500);

                        // 播放語音並等待完成後再進入下一題
                        this.Speech.speak(speechText).then(() => {
                            // 語音播放完成，短暫延遲後進入下一題
                            this.TimerManager.setTimeout(() => {
                                btn.classList.remove('incorrect');
                                this.normalDecompositionState = null;  // 重置狀態
                                this.nextQuestion();  // nextQuestion 會重置 isAnswering
                            }, 500);
                        });
                    } else {
                        // 簡單模式（testMode === null）：保持原有行為
                        const feedback = NumberCompositionConfig.speech.incorrect;
                        this.Speech.speak(feedback[Math.floor(Math.random() * feedback.length)]);

                        this.TimerManager.setTimeout(() => {
                            btn.classList.remove('incorrect');
                            this.state.isAnswering = false;  // 🔓 允許重新選擇
                        }, 1000);
                    }
                }
            });
        });
    },

    // =====================================================
    // 🆕 綁定困難模式合成題目的事件
    // =====================================================
    bindHardCompositionEvents() {
        const answerBox = document.getElementById('answer-input-box');

        if (answerBox) {
            answerBox.addEventListener('click', () => {
                this.showNumberInput('請輸入答案', (inputValue) => {
                    const state = this.hardCompositionState;

                    // 更新用戶答案
                    state.userAnswer = inputValue;

                    const question = this.state.questions[this.state.currentQuestion];
                    const { testMode } = this.state.settings;

                    // 🆕 添加詳細日誌來調試答案比較
                    GameDebug.log('answer', '答案驗證', {
                        userInput: inputValue,
                        userInputType: typeof inputValue,
                        correctAnswer: state.correctAnswer,
                        correctAnswerType: typeof state.correctAnswer,
                        isEqual: inputValue === state.correctAnswer,
                        looseEqual: inputValue == state.correctAnswer
                    });

                    // 驗證答案（使用寬鬆比較以防類型不匹配）
                    if (inputValue == state.correctAnswer) {
                        // 🔧 先重新渲染顯示正確答案
                        this.renderHardCompositionQuestion(question);

                        // 延遲一下，讓用戶看到答案
                        this.TimerManager.setTimeout(() => {
                            // 答對了！
                            this.Audio.play('correctSound');

                            // 🎉 播放煙火動畫
                            if (typeof confetti !== 'undefined') {
                                confetti({
                                    particleCount: 100,
                                    spread: 70,
                                    origin: { y: 0.6 }
                                });
                            }

                            // 🆕 播放完整語音：「答對了，2+3=5」
                            const speechText = `答對了，${question.a} 加 ${question.b} 等於 ${question.answer}`;
                            this.Speech.speak(speechText);

                            this.state.score++;

                            // 重置狀態
                            this.hardCompositionState = null;

                            // 🔧 等待語音播放完成後再進入下一題
                            this.TimerManager.setTimeout(() => {
                                this.nextQuestion();
                            }, 3500);
                        }, 300);
                    } else {
                        // 答錯了
                        this.Audio.play('errorSound');

                        if (testMode === 'single') {
                            // 🆕 單次作答模式：顯示答案並自動進入下一題

                            // 1. 先渲染顯示用戶輸入的錯誤答案
                            this.renderHardCompositionQuestion(question);

                            // 2. 延遲後改變答案框樣式和內容
                            this.TimerManager.setTimeout(() => {
                                const answerBox = document.getElementById('answer-input-box');
                                const answerDisplay = answerBox ? answerBox.querySelector('.answer-display') : null;

                                if (answerBox && answerDisplay) {
                                    // 先顯示紅色錯誤樣式
                                    answerBox.style.backgroundColor = '#ff4444';
                                    answerBox.style.color = 'white';
                                    answerBox.style.border = '3px solid #cc0000';
                                    answerBox.style.pointerEvents = 'none';  // 阻止再次點擊
                                    answerBox.style.transition = 'all 0.5s ease';

                                    // 0.8秒後變成綠色，並顯示正確答案
                                    this.TimerManager.setTimeout(() => {
                                        answerBox.style.backgroundColor = '#28a745';
                                        answerBox.style.border = '3px solid #1e7e34';
                                        answerDisplay.textContent = state.correctAnswer;
                                    }, 800);
                                }
                            }, 100);

                            // 3. 播放語音「不對，正確的答案是×，進入下一題」
                            const template = NumberCompositionConfig.speech.incorrectWithAnswer;
                            // 使用共用模組轉換數字為中文讀法
                            const convertedAnswer = (typeof NumberSpeechUtils !== 'undefined' && !isNaN(state.correctAnswer))
                                ? NumberSpeechUtils.convertToPureNumberSpeech(parseInt(state.correctAnswer))
                                : state.correctAnswer;
                            const speechText = template.replace('{answer}', convertedAnswer);

                            GameDebug.log('answer', '單次作答錯誤', {
                                correctAnswer: state.correctAnswer,
                                userAnswer: state.userAnswer,
                                speechText
                            });

                            // 4. 等待語音完成後進入下一題
                            this.Speech.speak(speechText).then(() => {
                                this.TimerManager.setTimeout(() => {
                                    this.hardCompositionState = null;
                                    this.nextQuestion();
                                }, 500);
                            });
                        } else {
                            // retry 或 easy 模式：讓用戶重新嘗試
                            this.Speech.speak('不對喔，請再試一次');
                            this.renderHardCompositionQuestion(question);
                        }
                    }
                });
            });
        }
    },

    // =====================================================
    // 🆕 綁定困難模式填空題目的事件
    // =====================================================
    bindHardFillBlankEvents() {
        const answerBox = document.getElementById('answer-input-box');

        if (answerBox) {
            answerBox.addEventListener('click', () => {
                this.showNumberInput('請輸入答案', (inputValue) => {
                    const state = this.hardFillBlankState;

                    // 更新用戶答案
                    state.userAnswer = inputValue;

                    const question = this.state.questions[this.state.currentQuestion];
                    const { testMode } = this.state.settings;

                    // 🆕 添加詳細日誌來調試答案比較
                    GameDebug.log('answer', '填空答案驗證', {
                        userInput: inputValue,
                        userInputType: typeof inputValue,
                        correctAnswer: state.correctAnswer,
                        correctAnswerType: typeof state.correctAnswer,
                        isEqual: inputValue === state.correctAnswer,
                        looseEqual: inputValue == state.correctAnswer
                    });

                    // 驗證答案（使用寬鬆比較以防類型不匹配）
                    if (inputValue == state.correctAnswer) {
                        // 🔧 先重新渲染顯示正確答案
                        this.renderHardFillBlankQuestion(question);

                        // 延遲一下，讓用戶看到答案
                        this.TimerManager.setTimeout(() => {
                            // 答對了！
                            this.Audio.play('correctSound');

                            // 🎉 播放煙火動畫
                            if (typeof confetti !== 'undefined') {
                                confetti({
                                    particleCount: 100,
                                    spread: 70,
                                    origin: { y: 0.6 }
                                });
                            }

                            // 🆕 播放完整語音：依題目顯示順序（?在左 → answer+a，?在右 → a+answer）
                            const isLeftInput = this.hardFillBlankState && this.hardFillBlankState.isLeftInput;
                            const speechText = isLeftInput
                                ? `答對了，${question.answer} 加 ${question.a} 等於 ${question.total}`
                                : `答對了，${question.a} 加 ${question.answer} 等於 ${question.total}`;
                            this.Speech.speak(speechText);

                            this.state.score++;

                            // 重置狀態
                            this.hardFillBlankState = null;

                            // 🔧 等待語音播放完成後再進入下一題
                            this.TimerManager.setTimeout(() => {
                                this.nextQuestion();
                            }, 3500);
                        }, 300);
                    } else {
                        // 答錯了
                        this.Audio.play('errorSound');

                        if (testMode === 'single') {
                            // 🆕 單次作答模式：顯示答案並自動進入下一題

                            // 1. 先渲染顯示用戶輸入的錯誤答案
                            this.renderHardFillBlankQuestion(question);

                            // 2. 延遲後改變答案框樣式和內容
                            this.TimerManager.setTimeout(() => {
                                const answerBox = document.getElementById('answer-input-box');
                                const answerDisplay = answerBox ? answerBox.querySelector('.answer-display') : null;

                                if (answerBox && answerDisplay) {
                                    // 先顯示紅色錯誤樣式
                                    answerBox.style.backgroundColor = '#ff4444';
                                    answerBox.style.color = 'white';
                                    answerBox.style.border = '3px solid #cc0000';
                                    answerBox.style.pointerEvents = 'none';  // 阻止再次點擊
                                    answerBox.style.transition = 'all 0.5s ease';

                                    // 0.8秒後變成綠色，並顯示正確答案
                                    this.TimerManager.setTimeout(() => {
                                        answerBox.style.backgroundColor = '#28a745';
                                        answerBox.style.border = '3px solid #1e7e34';
                                        answerDisplay.textContent = state.correctAnswer;
                                    }, 800);
                                }
                            }, 100);

                            // 3. 播放語音「不對，正確的答案是×，進入下一題/測驗結束」
                            const template = NumberCompositionConfig.speech.incorrectWithAnswer;
                            // 使用共用模組轉換數字為中文讀法
                            const convertedAnswer = (typeof NumberSpeechUtils !== 'undefined' && !isNaN(state.correctAnswer))
                                ? NumberSpeechUtils.convertToPureNumberSpeech(parseInt(state.correctAnswer))
                                : state.correctAnswer;
                            // 判斷是否為最後一題
                            const isLastQuestion = this.state.currentQuestion + 1 >= this.state.questions.length;
                            const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';
                            const speechText = template.replace('{answer}', convertedAnswer) + endingText;

                            GameDebug.log('answer', '填空單次作答錯誤', {
                                correctAnswer: state.correctAnswer,
                                userAnswer: state.userAnswer,
                                isLastQuestion,
                                speechText
                            });

                            // 4. 等待語音完成後進入下一題
                            this.Speech.speak(speechText).then(() => {
                                this.TimerManager.setTimeout(() => {
                                    this.hardFillBlankState = null;
                                    this.nextQuestion();
                                }, 500);
                            });
                        } else {
                            // retry 或 easy 模式：讓用戶重新嘗試
                            this.Speech.speak('不對喔，請再試一次');
                            this.renderHardFillBlankQuestion(question);
                        }
                    }
                });
            });
        }
    },

    // =====================================================
    // 🆕 綁定困難模式分解題目的事件
    // =====================================================
    bindHardDecompositionEvents() {
        const leftInputBox = document.getElementById('left-input-box');
        const rightInputBox = document.getElementById('right-input-box');
        const inputBox = leftInputBox || rightInputBox;

        if (inputBox) {
            inputBox.addEventListener('click', () => {
                this.showNumberInput('請輸入答案', (inputValue) => {
                    const state = this.hardDecompositionState;
                    const question = this.state.questions[this.state.currentQuestion];

                    // 更新用戶答案
                    state.userAnswer = inputValue;

                    const { testMode } = this.state.settings;

                    // 🆕 添加詳細日誌來調試答案比較
                    GameDebug.log('answer', '答案驗證', {
                        userInput: inputValue,
                        userInputType: typeof inputValue,
                        correctAnswer: state.correctAnswer,
                        correctAnswerType: typeof state.correctAnswer,
                        isEqual: inputValue === state.correctAnswer,
                        looseEqual: inputValue == state.correctAnswer
                    });

                    // 驗證答案（使用寬鬆比較以防類型不匹配）
                    if (inputValue == state.correctAnswer) {
                        // 🔧 先重新渲染顯示正確答案
                        this.renderHardDecompositionQuestion(question);

                        // 延遲一下，讓用戶看到答案
                        this.TimerManager.setTimeout(() => {
                            // 答對了！
                            this.Audio.play('correctSound');

                            // 🎉 播放煙火動畫
                            if (typeof confetti !== 'undefined') {
                                confetti({
                                    particleCount: 100,
                                    spread: 70,
                                    origin: { y: 0.6 }
                                });
                            }

                            // 🆕 播放完整語音：「答對了，6可以分成4跟2」
                            const speechText = `答對了，${state.total} 可以分成 ${state.leftAnswer} 跟 ${state.rightAnswer}`;
                            this.Speech.speak(speechText);

                            this.state.score++;

                            // 重置狀態
                            this.hardDecompositionState = null;

                            // 🔧 等待語音播放完成後再進入下一題
                            this.TimerManager.setTimeout(() => {
                                this.nextQuestion();
                            }, 3500);
                        }, 300);
                    } else {
                        // 答錯了
                        this.Audio.play('errorSound');

                        if (testMode === 'single') {
                            // 🆕 單次作答模式：顯示答案並自動進入下一題

                            // 1. 先渲染顯示用戶輸入的錯誤答案
                            this.renderHardDecompositionQuestion(question);

                            // 2. 延遲後改變輸入框樣式和內容
                            this.TimerManager.setTimeout(() => {
                                // 找到輸入框（左或右）
                                const inputBox = document.getElementById('left-input-box') ||
                                                 document.getElementById('right-input-box');
                                const answerDisplay = inputBox ? inputBox.querySelector('.answer-display') : null;

                                if (inputBox && answerDisplay) {
                                    // 先顯示紅色錯誤樣式
                                    inputBox.style.backgroundColor = '#ff4444';
                                    inputBox.style.color = 'white';
                                    inputBox.style.border = '3px solid #cc0000';
                                    inputBox.style.pointerEvents = 'none';  // 阻止再次點擊
                                    inputBox.style.transition = 'all 0.5s ease';

                                    // 0.8秒後變成綠色，並顯示正確答案
                                    this.TimerManager.setTimeout(() => {
                                        inputBox.style.backgroundColor = '#28a745';
                                        inputBox.style.border = '3px solid #1e7e34';
                                        answerDisplay.textContent = state.correctAnswer;
                                    }, 800);
                                }
                            }, 100);

                            // 3. 播放語音「不對，正確的答案是×，進入下一題」
                            // 使用共用模組轉換數字為中文讀法
                            const convertedLeft = (typeof NumberSpeechUtils !== 'undefined' && !isNaN(state.leftAnswer))
                                ? NumberSpeechUtils.convertToPureNumberSpeech(parseInt(state.leftAnswer))
                                : state.leftAnswer;
                            const convertedRight = (typeof NumberSpeechUtils !== 'undefined' && !isNaN(state.rightAnswer))
                                ? NumberSpeechUtils.convertToPureNumberSpeech(parseInt(state.rightAnswer))
                                : state.rightAnswer;
                            const answerDisplay = `${convertedLeft} 跟 ${convertedRight}`;
                            const template = NumberCompositionConfig.speech.incorrectWithAnswer;
                            const speechText = template.replace('{answer}', answerDisplay);

                            GameDebug.log('answer', '單次作答錯誤', {
                                correctAnswer: state.correctAnswer,
                                userAnswer: state.userAnswer,
                                answerDisplay,
                                speechText
                            });

                            // 4. 等待語音完成後進入下一題
                            this.Speech.speak(speechText).then(() => {
                                this.TimerManager.setTimeout(() => {
                                    this.hardDecompositionState = null;
                                    this.nextQuestion();
                                }, 500);
                            });
                        } else {
                            // retry 或 easy 模式：讓用戶重新嘗試
                            this.Speech.speak('不對喔，請再試一次');
                            this.renderHardDecompositionQuestion(question);
                        }
                    }
                });
            });
        }
    },

    // =====================================================
    // 🆕 顯示數字輸入器
    // =====================================================
    showNumberInput(title, callback) {
        if (document.getElementById('number-input-popup')) return;

        const keypadAudio = new Audio('../audio/units/keypad.mp3');
        keypadAudio.volume = 0.7;
        keypadAudio.preload = 'auto';

        const popupHTML = `
            <div id="number-input-popup" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;">
                <div style="background:white; padding:20px; border-radius:15px; width:400px; text-align:center; position:relative;">
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
                    <div style="margin-bottom: 15px;">
                        <input type="text" id="number-display" readonly style="width:200px; font-size:2em; text-align:center; padding: 10px; border: 2px solid #ddd; border-radius: 5px; cursor: pointer; margin: 15px 0;">
                    </div>
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
        };

        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '清除', '0', '確認'].forEach(key => {
            const btn = document.createElement('button');
            btn.textContent = key;
            let btnStyle = 'padding: 15px; font-size: 1.2em; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;';
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
                    if (display.value) {
                        const inputValue = parseInt(display.value);
                        // 🆕 先移除輸入器，再執行 callback
                        const popup = document.getElementById('number-input-popup');
                        if (popup) {
                            popup.remove();
                        }
                        // 延遲一下再執行 callback，確保 DOM 更新完成
                        this.TimerManager.setTimeout(() => {
                            callback(inputValue);
                        }, 50);
                    }
                } else {
                    keypadAudio.currentTime = 0; keypadAudio.play().catch(() => {});
                    // 限制數字輸入長度
                    if (display.value.length < 3) {
                        display.value += key;
                    }
                }
            };
            pad.appendChild(btn);
        });
    },

    // =====================================================
    // 🆕 處理emoji拖曳放置
    // =====================================================
    handleEmojiDrop(source, index) {
        const state = this.easyCompositionState;

        // 更新數量
        if (source === 'left') {
            state.leftCount--;
        } else if (source === 'right') {
            state.rightCount--;
        }
        state.bottomCount++;

        // 播放音效
        this.Audio.play('selectSound');

        // 🔧 優化：不重新渲染整個頁面，只更新必要的DOM元素
        // 1. 更新來源框的數字
        const sourceBoxSelector = source === 'left' ? '.left-box' : '.right-box';
        const sourceBox = document.querySelector(sourceBoxSelector);
        if (sourceBox) {
            const numberDisplay = sourceBox.querySelector('.box-number');
            if (numberDisplay) {
                numberDisplay.textContent = source === 'left' ? state.leftCount : state.rightCount;
            }
        }

        // 2. 隱藏被拖曳的emoji
        const draggedEmoji = document.querySelector(`.draggable-emoji[data-source="${source}"][data-index="${index}"]`);
        if (draggedEmoji) {
            draggedEmoji.classList.add('hidden');
            draggedEmoji.draggable = false;
        }

        // 3. 更新目標框的數字
        const targetBox = document.querySelector('.target-box');
        if (targetBox) {
            const numberDisplay = targetBox.querySelector('.box-number');
            if (numberDisplay) {
                numberDisplay.textContent = state.bottomCount;
            }
        }

        // 4. 填充下一個空的drop-zone（只為新添加的emoji添加動畫）
        const emptyDropZone = document.querySelector('.drop-zone-emoji:not(.filled)');
        if (emptyDropZone) {
            emptyDropZone.classList.add('filled');
        }

        // 🆕 5. 播放當前數量的語音
        this.Speech.speak(`${state.bottomCount}`);

        // 🆕 6. 如果全部放置完成，自動檢查答案
        if (state.bottomCount === state.totalAnswer && state.leftCount === 0 && state.rightCount === 0) {
            // 延遲一下，讓語音播放完
            this.TimerManager.setTimeout(() => {
                this.checkEasyCompositionAnswer();
            }, 800);
        }
    },

    // =====================================================
    // 🆕 檢查簡單模式合成答案
    // =====================================================
    checkEasyCompositionAnswer() {
        const state = this.easyCompositionState;
        const question = this.state.questions[this.state.currentQuestion];

        if (state.bottomCount === state.totalAnswer && state.leftCount === 0 && state.rightCount === 0) {
            // 答對了！
            this.Audio.play('correctSound');

            // 🎉 播放煙火動畫
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

            // 🆕 播放完整語音：「答對了，2+3=5，進入下一題」
            const isLastQuestion = this.state.currentQuestion + 1 >= this.state.questions.length;
            const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';
            const speechText = `恭喜你答對了，${question.a} 加 ${question.b} 等於 ${state.totalAnswer}${endingText}`;

            this.state.score++;

            // 重置狀態
            this.easyCompositionState = null;

            // 等語音播完才進入下一題（避免語音被下一題截斷）
            this.Speech.speak(speechText).then(() => {
                this.nextQuestion();
            });
        } else {
            // 不應該發生，因為按鈕只在完成時啟用
            this.Audio.play('errorSound');
        }
    },

    // =====================================================
    // 綁定題目事件
    // =====================================================
    bindQuestionEvents() {
        const question = this.state.questions[this.state.currentQuestion];

        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // 🛡️ 點擊守衛：防止答題過程中重複點擊
                if (this.state.isAnswering) {
                    GameDebug.log('interaction', '⏸️ 遊戲正在回答中，忽略點擊');
                    return;
                }

                const userAnswer = btn.dataset.answer;
                const correctAnswer = question.answer.toString();

                // 設置答題狀態
                this.state.isAnswering = true;

                if (userAnswer === correctAnswer) {
                    this.handleCorrectAnswer(btn);
                } else {
                    this.handleIncorrectAnswer(btn, correctAnswer);
                }
            });
        });
    },

    // =====================================================
    // 處理正確答案
    // =====================================================
    handleCorrectAnswer(btn) {
        btn.classList.add('correct');
        this.Audio.play('correctSound');

        const feedback = NumberCompositionConfig.speech.correct;
        this.Speech.speak(feedback[Math.floor(Math.random() * feedback.length)]);

        this.state.score++;

        this.TimerManager.setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    },

    // =====================================================
    // 處理錯誤答案
    // =====================================================
    handleIncorrectAnswer(btn, correctAnswer) {
        btn.classList.add('incorrect');
        this.Audio.play('errorSound');

        const { testMode } = this.state.settings;

        if (testMode === 'retry') {
            // 🔄 反複練習模式：移除視覺效果，允許重新選擇
            const feedback = NumberCompositionConfig.speech.incorrect;
            this.Speech.speak(feedback[Math.floor(Math.random() * feedback.length)]);

            this.TimerManager.setTimeout(() => {
                btn.classList.remove('incorrect');
                this.state.isAnswering = false;  // 🔓 允許重新選擇
            }, 1000);
        } else if (testMode === 'single') {
            // ➡️ 單次作答模式：播報正確答案，自動進入下一題
            const template = NumberCompositionConfig.speech.incorrectWithAnswer;
            // 使用共用模組轉換數字為中文讀法
            const convertedAnswer = (typeof NumberSpeechUtils !== 'undefined' && !isNaN(correctAnswer))
                ? NumberSpeechUtils.convertToPureNumberSpeech(parseInt(correctAnswer))
                : correctAnswer;
            const speechText = template.replace('{answer}', convertedAnswer);
            this.Speech.speak(speechText);

            GameDebug.log('answer', '單次作答錯誤', { correctAnswer, speechText });

            this.TimerManager.setTimeout(() => {
                btn.classList.remove('incorrect');
                this.nextQuestion();  // nextQuestion 會重置 isAnswering
            }, 3000);  // 延長到 3 秒，讓語音播放完整
        } else {
            // 簡單模式（testMode === null）：保持原有行為
            const feedback = NumberCompositionConfig.speech.incorrect;
            this.Speech.speak(feedback[Math.floor(Math.random() * feedback.length)]);

            this.TimerManager.setTimeout(() => {
                btn.classList.remove('incorrect');
                this.state.isAnswering = false;  // 🔓 允許重新選擇
            }, 1000);
        }
    },

    // =====================================================
    // =====================================================
    // 困難模式提示按鈕：在「？」框暫時顯示答案並播放語音
    // =====================================================
    showHardHint() {
        // 取得當前難度模式的正確答案
        let correctAnswer = null;
        if (this.hardCompositionState) {
            correctAnswer = this.hardCompositionState.correctAnswer;
        } else if (this.hardFillBlankState) {
            correctAnswer = this.hardFillBlankState.correctAnswer;
        } else if (this.hardDecompositionState) {
            correctAnswer = this.hardDecompositionState.correctAnswer;
        }
        if (correctAnswer === null) return;

        // 找到「？」框的顯示元素（answer-display 在 answer-input-box 內）
        const displayEl = document.querySelector('#answer-input-box .answer-display, #left-input-box .answer-display, #right-input-box .answer-display');
        if (!displayEl) return;

        // 暫時顯示正確答案（綠色）
        const originalText = displayEl.textContent;
        displayEl.textContent = correctAnswer;
        displayEl.style.color = '#4CAF50';
        displayEl.style.fontWeight = 'bold';

        // 停用提示按鈕防止重複觸發
        const hintBtn = document.getElementById('f6-hint-btn');
        if (hintBtn) hintBtn.disabled = true;

        // 播放語音：「答案是X」
        const speechText = `答案是${correctAnswer}`;
        this.Speech.speak(speechText).then(() => {
            // 語音播放完成後還原「？」
            displayEl.textContent = originalText;
            displayEl.style.color = '';
            displayEl.style.fontWeight = '';
            if (hintBtn) hintBtn.disabled = false;
        });
    },

    // 下一題
    // =====================================================
    nextQuestion() {
        // 🔓 重置答題狀態，允許下一題的點擊
        this.state.isAnswering = false;

        this.state.currentQuestion++;

        if (this.state.currentQuestion >= this.state.questions.length) {
            this.showResults();
        } else {
            this.renderQuestion();
        }
    },

    // =====================================================
    // 顯示結果
    // =====================================================
    showResults() {
        if (this.state.isEndingGame) { GameDebug.log('state', '⚠️ [F6] showResults 已執行過，忽略重複呼叫'); return; }
        this.state.isEndingGame = true;
        AssistClick.deactivate();

        // 🔧 [Bug修復] 清理回合轉換相關計時器
        this.TimerManager.clearByCategory('turnTransition');

        const app = document.getElementById('app');
        const totalQuestions = this.state.questions.length;
        const correctAnswers = this.state.score;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);

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

        this.Audio.play('successSound');
        this.Speech.speak(NumberCompositionConfig.speech.complete);

        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        app.innerHTML = `
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
                    <a href="#" id="results-reward-link" class="reward-btn-link">
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
                            <div class="achievement-item">🎯 理解數的分與合概念</div>
                            <div class="achievement-item">🔢 練習數字拆解與組合</div>
                            <div class="achievement-item">📝 掌握基礎加減法前置技能</div>
                        </div>
                    </div>

                    <div class="result-buttons">
                        <button class="play-again-btn" onclick="Game.startGame()">
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
                /* 🔧 [Bug修復] @keyframes 已移至全局動畫樣式（injectGlobalAnimationStyles） */
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

        // 🎁 綁定獎勵系統連結事件
        const resultsRewardLink = document.getElementById('results-reward-link');
        if (resultsRewardLink) {
            resultsRewardLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof RewardLauncher !== 'undefined') {
                    RewardLauncher.open();
                } else {
                    window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                }
            });
        }
    },

    // =====================================================
    // 工具方法：洗牌陣列
    // =====================================================
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    // =====================================================
    // 自訂題數功能：顯示數字選擇器（設定用，已重新命名避免與遊戲用函數衝突）
    // =====================================================
    showSettingsNumberInput(title, callback, cancelCallback) {
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
    // 自訂題數功能：處理點擊自訂題數輸入框
    // =====================================================
    handleCustomQuestionClick() {
        const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
        if (customBtn) {
            customBtn.click();
        }
    },

    // =====================================================
    // 🎨 自訂主題 — 容器渲染與更新
    // =====================================================
    renderCustomThemeContainer() {
        if (this.state.settings.theme !== 'custom') return '';
        return `
            <div class="setting-group custom-theme-setup">
                <h4>🎨 自訂主題設定</h4>
                <p>上傳你的圖示並設定名稱：</p>
                <div class="custom-items-list" style="display:flex;flex-direction:row;flex-wrap:wrap;gap:10px;min-height:60px;border:1px solid #e0e0e0;border-radius:5px;padding:10px;margin:10px 0;background:white;">
                    ${this.state.customItems.map((item, index) => `
                        <div class="custom-item-row" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;border:1px solid #eee;border-radius:8px;background:#fafafa;text-align:center;width:fit-content;">
                            <img src="${item.imageData}" alt="${item.name}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;">
                            <span style="font-size:12px;font-weight:bold;color:#333;">${item.name}</span>
                            <button type="button" onclick="Game.removeCustomItem(${index})" class="f6-remove-btn" style="padding:3px 8px;font-size:12px;">❌</button>
                        </div>
                    `).join('')}
                </div>
                <div>
                    <input type="file" id="f6-custom-image" accept="image/*" style="display:none;" onchange="Game.handleImageUpload(event)">
                    <button type="button" onclick="Game.triggerImageUpload()" class="f6-upload-btn">📸 上傳圖片</button>
                </div>
                <!-- 圖片預覽 Modal -->
                <div id="f6-image-preview-modal" class="f6-image-preview-modal">
                    <div class="modal-overlay" onclick="Game.closeImagePreview()"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>🎁 新增自訂圖示</h3>
                            <button onclick="Game.closeImagePreview()" class="close-btn">✕</button>
                        </div>
                        <div class="modal-body">
                            <img id="f6-preview-image" src="" alt="圖示預覽" style="max-width:320px;max-height:260px;object-fit:contain;border-radius:10px;border:2px solid #ddd;">
                            <div class="item-form">
                                <div class="form-group">
                                    <label>圖示名稱：</label>
                                    <input type="text" id="f6-modal-custom-name" placeholder="請輸入圖示名稱" maxlength="10">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button onclick="Game.closeImagePreview()" class="f6-cancel-btn">取消</button>
                            <button onclick="Game.confirmAddCustomItem()" class="f6-confirm-btn">確認新增</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    updateCustomThemeContainer() {
        const container = document.getElementById('custom-theme-container');
        if (!container) return;
        container.innerHTML = this.renderCustomThemeContainer();
    },

    // =====================================================
    // 🎨 自訂主題 — 圖片上傳流程
    // =====================================================
    triggerImageUpload() {
        if (this.state.customItems.length >= 8) {
            alert('最多只能上傳8個圖示！');
            return;
        }
        const fileInput = document.getElementById('f6-custom-image');
        if (fileInput) {
            fileInput.value = '';
            fileInput.click();
        }
    },

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('請選擇圖片檔案！');
            return;
        }
        try {
            const compressedImage = await compressImage(file, 200, 0.7);
            this.showImagePreview(compressedImage);
        } catch (err) {
            GameDebug.log('error', '圖片壓縮失敗:', err);
            alert('圖片處理失敗，請重試！');
        }
    },

    showImagePreview(imageDataUrl) {
        this.tempImageData = imageDataUrl;
        const modal = document.getElementById('f6-image-preview-modal');
        const previewImg = document.getElementById('f6-preview-image');
        if (!modal || !previewImg) return;
        previewImg.src = imageDataUrl;
        modal.classList.add('show');
        const nameInput = document.getElementById('f6-modal-custom-name');
        if (nameInput) {
            nameInput.value = '';
            this.TimerManager.setTimeout(() => nameInput.focus(), 100, 'ui');
        }
    },

    closeImagePreview() {
        const modal = document.getElementById('f6-image-preview-modal');
        if (modal) modal.classList.remove('show');
        const fileInput = document.getElementById('f6-custom-image');
        if (fileInput) fileInput.value = '';
        this.tempImageData = null;
    },

    confirmAddCustomItem() {
        const name = (document.getElementById('f6-modal-custom-name')?.value || '').trim();
        if (!name) { alert('請輸入圖示名稱！'); return; }
        if (!this.tempImageData) { alert('圖片資料遺失，請重新上傳！'); return; }
        if (this.state.customItems.some(item => item.name === name)) {
            alert('圖示名稱已存在，請使用不同的名稱！');
            return;
        }
        this.state.customItems.push({
            imageData: this.tempImageData,
            name: name,
            id: Date.now()
        });
        // 播放語音回饋
        this.Speech.speak(`已新增自訂圖示：${name}`);
        this.closeImagePreview();
        this.updateCustomThemeContainer();
        this.updateStartButton();
        GameDebug.log('settings', '新增自訂圖示', name);
    },

    removeCustomItem(index) {
        const removed = this.state.customItems.splice(index, 1);
        GameDebug.log('settings', '移除自訂圖示', removed[0]?.name);
        this.updateCustomThemeContainer();
        this.updateStartButton();
    }
};

// =================================================================
// 👆 輔助點擊模式（AssistClick）— 獨立區塊，不影響其他模式
// =================================================================
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

        // === Easy Fill Blank (填空) ===
        const fillBlankState = Game.easyFillBlankState;
        if (fillBlankState && fillBlankState.targetFilledCount < fillBlankState.correctAnswer) {
            const emoji = document.querySelector('.draggable-emoji:not(.used):not(.hidden)');
            if (emoji) {
                this._queue = [{
                    target: emoji,
                    action: () => {
                        if (Game.state.isAnswering) return;
                        if (fillBlankState.targetFilledCount >= fillBlankState.correctAnswer) return;
                        fillBlankState.dragSourceCount--;
                        fillBlankState.targetFilledCount++;
                        Game.Audio.play('selectSound');
                        const cnt = fillBlankState.targetFilledCount;
                        const cntText = (typeof NumberSpeechUtils !== 'undefined')
                            ? NumberSpeechUtils.convertToPureNumberSpeech(cnt)
                            : String(cnt);
                        Game.Speech.speak(cntText);
                        Game.renderEasyFillBlankQuestion(Game.state.questions[Game.state.currentQuestion]);
                        Game.checkEasyFillBlankAnswer();
                    }
                }];
                this._step = 0;
                this._highlight(emoji);
            }
            return;
        }

        // === Easy Composition (合成) ===
        const compState = Game.easyCompositionState;
        if (compState && (compState.leftCount > 0 || compState.rightCount > 0)) {
            const emoji = document.querySelector('.draggable-emoji:not(.hidden)');
            if (emoji) {
                const source = emoji.dataset.source;
                const index = emoji.dataset.index;
                this._queue = [{
                    target: emoji,
                    action: () => Game.handleEmojiDrop(source, index)
                }];
                this._step = 0;
                this._highlight(emoji);
            }
            return;
        }

        // === Easy Decomposition (分解) ===
        const decompState = Game.easyDecompositionState;
        if (decompState && decompState.topCount > 0) {
            const emoji = document.querySelector('.draggable-emoji:not(.hidden)');
            if (emoji) {
                const source = emoji.dataset.source;
                const index = emoji.dataset.index;
                const targetSide = decompState.leftCount < decompState.leftAnswer ? 'left' : 'right';
                this._queue = [{
                    target: emoji,
                    action: () => Game.handleDecompositionDrop(source, index, targetSide)
                }];
                this._step = 0;
                this._highlight(emoji);
            }
            return;
        }
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
                if (this._enabled) this.buildQueue();
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

// =================================================================
// 頁面載入時初始化
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
