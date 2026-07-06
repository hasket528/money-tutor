// =================================================================
// FILE: js/f3_number_recognition.js
// DESC: F3 認識數字與數量 - 配置驅動版本
// 最後修正：2025.08.31 下午9:00 - 修正手機端拖拽灘敏度：關閉點擊放置功能
// =================================================================
//
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

// Define Game as a global variable to support onclick events in dynamic HTML
let Game;

/**
 * 圖片壓縮函式
 * @param {File} file - 原始圖片檔案
 * @param {number} maxWidth - 最大寬度 (預設 200px，適合遊戲圖示)
 * @param {number} quality - 圖片品質 0~1 (預設 0.7)
 * @returns {Promise<string>} - 回傳壓縮後的 Base64 字串
 */
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

                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    Game = {
        // =====================================================
        // 🐛 Debug System - FLAGS 分類開關系統
        // =====================================================
        // 使用方式：在瀏覽器 Console 中輸入
        // Game.Debug.FLAGS.all = true;      // 開啟全部
        // Game.Debug.FLAGS.drag = true;     // 只開啟拖曳相關
        // Game.Debug.FLAGS.click = true;    // 只開啟點擊相關
        // =====================================================
        Debug: {
            FLAGS: {
                all: false,        // 全域開關（開啟後顯示所有分類）
                init: false,       // 初始化相關
                speech: false,     // 語音系統
                audio: false,      // 音效系統
                ui: false,         // UI 渲染
                drag: false,       // 拖曳操作
                touch: false,      // 觸控事件
                click: false,      // 點擊操作
                question: false,   // 題目生成
                state: false,      // 狀態變更
                game: false,       // 遊戲流程
                user: false,       // 使用者行為
                error: true        // 錯誤訊息（預設開啟）
            },

            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[F3-${category}]`, ...args);
                }
            },

            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[F3-${category}]`, ...args);
                }
            },

            error(...args) {
                if (this.FLAGS.error) {
                    console.error('[F3-ERROR]', ...args);
                }
            },

            // =====================================================
            // 向後相容包裝方法（舊版 API 支援）
            // =====================================================
            logGameFlow(action, data = null) {
                this.log('game', action, data || '');
            },

            logSpeech(action, text) {
                this.log('speech', action, { text });
            },

            logUserAction(action, data = null) {
                this.log('user', action, data || '');
            },

            logUI(action, context = '', data = null) {
                this.log('ui', `${action}${context ? ' - ' + context : ''}`, data || '');
            },

            logMobileDrag(phase, element, event, data = null) {
                if (!this.FLAGS.all && !this.FLAGS.drag && !this.FLAGS.touch) return;
                const elementInfo = {
                    tagName: element?.tagName,
                    className: element?.className,
                    id: element?.id,
                    dataId: element?.dataset?.id
                };
                const touchInfo = event?.touches?.[0] ? {
                    clientX: event.touches[0].clientX,
                    clientY: event.touches[0].clientY,
                    touchCount: event.touches.length
                } : null;
                this.log('drag', `📱${phase}`, { element: elementInfo, touch: touchInfo, extra: data });
            },

            logTouchEvent(eventType, element, event) {
                if (!this.FLAGS.all && !this.FLAGS.touch) return;
                // 🔍 記錄觸控事件時間
                if (eventType === 'touchstart' || eventType === 'touchend') {
                    window.lastTouchTime = Date.now();
                }
                const eventInfo = {
                    type: eventType,
                    target: element?.className || 'unknown',
                    touches: event?.touches?.length || 0,
                    changedTouches: event?.changedTouches?.length || 0
                };
                this.log('touch', `👆${eventType}`, eventInfo);
            },

            logDragState(action, state) {
                this.log('drag', `🎯${action}`, state);
            },

            logPlacementDrop(action, zoneType, itemInfo = null) {
                this.log('drag', `📦${action} - 區域: ${zoneType}`, itemInfo || '');
            }
        },

        // =====================================================
        // ⏱️ TimerManager - 計時器統一管理
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

        // =====================================================
        // 🎧 EventManager - 事件監聽器統一管理
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
        // 🎬 全局動畫樣式注入
        // =====================================================
        injectGlobalAnimationStyles() {
            if (document.getElementById('f3-global-animations')) return;

            const css = `
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                @keyframes bounce {
                    0%, 20%, 60%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-20px); }
                    80% { transform: translateY(-10px); }
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes celebrate {
                    0% { transform: scale(0.8) rotate(-10deg); opacity: 0; }
                    50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(52, 152, 219, 0.4); }
                    50% { box-shadow: 0 0 30px rgba(52, 152, 219, 0.8); }
                }
                @keyframes hintMarkerAppear {
                    0% { opacity: 0; transform: translate(-50%, -10px) scale(0.5); }
                    60% { transform: translate(-50%, 0) scale(1.2); }
                    100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
                }
            `;

            const style = document.createElement('style');
            style.id = 'f3-global-animations';
            style.innerHTML = css;
            document.head.appendChild(style);
        },

        // =====================================================
        // 🔄 resetGameState - 統一遊戲狀態重置
        // =====================================================
        resetGameState() {
            // 核心遊戲狀態
            this.state.score = 0;
            this.state.currentTurn = 0;
            this.state.totalTurns = this.state.settings.questionCount || 10;
            this.state.correctAnswer = 0;
            this.state.lastAnswer = null;
            this.state.currentTurnType = null;
            this.state.selectedItems = [];
            this.state.isAnswering = false;
            this.state.startTime = null;
            this.state.isEndingGame = false;

            // 點擊/拖曳相關狀態
            this.state.selectedClickItem = null;
            this.state.draggedElement = null;
            this.state.lastClickTime = 0;
            this.state.lastClickedElement = null;
            this.state.clickCount = 0;

            Game.Debug.log('state', '🔄 遊戲狀態已重置');
        },

        // =====================================================
        // 🎯 配置驅動核心：ModeConfig
        // =====================================================
        ModeConfig: {
            easy: {
                modeLabel: '簡單',
                turnTypes: ['numeral-to-object-drop'],
                speechTemplates: {
                    initialInstruction: "請把和數字 {answer} 一樣多的{itemName} 放到下面的框框裡。",
                    correct: "答對了！你真棒！",
                    incorrect: "不對喔，你放了{userAnswer}個，正確答案是{answer}，請再試一次",
                    gameComplete: "恭喜你完成了所有題目！",
                    itemSelected: "已選擇 {itemName}，再點擊一次物品來放置",
                    itemPlacedByClick: "雙擊放置成功！",
                    clickToPlace: "雙擊物品來放置",
                    addCustomItem: "已新增自訂圖示：{itemName}",
                    removeCustomItem: "已移除圖示：{itemName}"
                },
                timing: { nextQuestionDelay: 2000 },
                uiElements: { showCompletionButton: false },
                // 🔧 [修正] 點擊操作配置 - 關閉以避免與拖拽衝突
                clickToMoveConfig: {
                    enabled: false,                   // 關閉點擊移動功能，避免與拖拽衝突
                    allowClickToPlace: false,         // 關閉點擊放置
                    allowClickToReturn: false,        // 關閉點擊取回
                    audioFeedback: false,             // 關閉點擊音效
                    speechFeedback: false,            // 關閉點擊語音回饋
                    visualSelection: false,           // 關閉選擇視覺效果
                    selectionTimeout: 0               // 選擇狀態持續時間
                },
                audioFeedback: true, 
                speechFeedback: true,
                countingVoice: true, // 簡單模式：播放數量語音（自動判斷時）
                
                // 觸控拖曳配置
                touchDragConfig: {
                    enabled: true,                 // 啟用觸控拖曳
                    sensitivity: 'high',           // 觸控靈敏度：high, medium, low
                    createCloneDelay: 50,          // 建立拖曳複製的延遲時間(ms)
                    visualFeedback: {
                        dragOpacity: 0.5,          // 拖曳時原物件透明度
                        cloneScale: 1.1,           // 拖曳複製縮放比例
                        hoverEffect: true          // 放置區懸停效果
                    },
                    selectors: {
                        draggable: '.source-item:not([style*="display: none"]), .placed-item',
                        dropZone: '.placement-slot, .placement-area, .source-area'
                    }
                }
            },
            normal: {
                modeLabel: '普通',
                turnTypes: ['numeral-to-object-drop'], // 使用新的拖放題型
                speechTemplates: {
                    initialInstruction: "請把和數字 {answer} 一樣多的{itemName} 放到下面的框框裡。",
                    correct: "答對了！正確答案是 {answer}。",
                    incorrect: "不對喔，你放了{userAnswer}個，正確答案是{answer}，請再試一次",
                    incorrectWithAnswer: "答錯了，正確答案是 {answer}",
                    gameComplete: "太棒了！你完成了所有題目！",
                    itemSelected: "已選擇 {itemName}，再點擊一次物品來放置",
                    itemPlacedByClick: "雙擊放置成功！",
                    itemReturnedByClick: "物品已移回",
                    clickToPlace: "雙擊物品來放置",
                    clickToReturn: "點擊已放置的物品可以移回",
                    addCustomItem: "已新增自訂圖示：{itemName}",
                    removeCustomItem: "已移除圖示：{itemName}",
                    hintUsed: "目前總共{currentCount}個，{hintMessage}",
                    incorrectWithHint: "你答錯了，目前總共{currentCount}個，{hintMessage}"
                },
                timing: { nextQuestionDelay: 2000 },
                uiElements: {
                    showCompletionButton: true,       // 需要完成按鈕
                    showHintButton: true              // 顯示提示按鈕
                },
                // 🔧 [修正] 點擊操作配置 - 關閉以避免與拖拽衝突
                clickToMoveConfig: {
                    enabled: false,                   // 關閉點擊移動功能，避免與拖拽衝突
                    allowClickToPlace: false,         // 關閉點擊放置
                    allowClickToReturn: false,        // 關閉點擊取回
                    audioFeedback: false,             // 關閉點擊音效
                    speechFeedback: false,            // 關閉點擊語音回饋
                    visualSelection: false,           // 關閉選擇視覺效果
                    selectionTimeout: 0               // 選擇狀態持續時間
                },
                audioFeedback: true, 
                speechFeedback: true,
                countingVoice: true, // 普通模式：播放數量語音
                
                // 觸控拖曳配置
                touchDragConfig: {
                    enabled: true,                 // 啟用觸控拖曳
                    sensitivity: 'high',           // 觸控靈敏度：high, medium, low
                    createCloneDelay: 50,          // 建立拖曳複製的延遲時間(ms)
                    visualFeedback: {
                        dragOpacity: 0.5,          // 拖曳時原物件透明度
                        cloneScale: 1.1,           // 拖曳複製縮放比例
                        hoverEffect: true          // 放置區懸停效果
                    },
                    selectors: {
                        draggable: '.source-item:not([style*="display: none"]), .placed-item',
                        dropZone: '.placement-slot, .placement-area, .source-area'
                    }
                }
            },
            hard: {
                modeLabel: '困難',
                turnTypes: ['numeral-to-object-drop'], // 改為使用拖放題型，與普通模式相同
                speechTemplates: {
                    initialInstruction: "請把和數字 {answer} 一樣多的{itemName} 放到下面的框框裡。",
                    correct: "答對了！正確答案是 {answer}。",
                    incorrect: "不對喔，你放了{userAnswer}個，正確答案是{answer}，請再試一次",
                    incorrectWithAnswer: "答錯了，正確答案是 {answer}。",
                    gameComplete: "恭喜你完成挑戰！",
                    itemSelected: "已選擇 {itemName}，再點擊一次物品來放置",
                    itemPlacedByClick: "雙擊放置成功！",
                    itemReturnedByClick: "物品已移回",
                    clickToPlace: "雙擊物品來放置",
                    clickToReturn: "點擊已放置的物品可以移回",
                    addCustomItem: "已新增自訂圖示：{itemName}",
                    removeCustomItem: "已移除圖示：{itemName}",
                    hintUsed: "目前總共{currentCount}個，{hintMessage}",
                    incorrectWithHint: "你答錯了，目前總共{currentCount}個，{hintMessage}"
                },
                timing: { nextQuestionDelay: 1500 },
                uiElements: { 
                    showCompletionButton: true,       // 需要完成按鈕
                    showHintButton: true              // 顯示提示按鈕
                },
                // 🔧 [修正] 點擊操作配置 - 關閉以避免與拖拽衝突
                clickToMoveConfig: {
                    enabled: false,                   // 關閉點擊移動功能，避免與拖拽衝突
                    allowClickToPlace: false,         // 關閉點擊放置
                    allowClickToReturn: false,        // 關閉點擊取回
                    audioFeedback: false,             // 關閉點擊音效
                    speechFeedback: false,            // 關閉點擊語音回饋
                    visualSelection: false,           // 關閉選擇視覺效果
                    selectionTimeout: 0               // 選擇狀態持續時間
                },
                audioFeedback: true, 
                speechFeedback: true,
                countingVoice: false, // 困難模式：不播放數量語音
                
                // 觸控拖曳配置
                touchDragConfig: {
                    enabled: true,                 // 啟用觸控拖曳
                    sensitivity: 'high',           // 觸控靈敏度：high, medium, low
                    createCloneDelay: 50,          // 建立拖曳複製的延遲時間(ms)
                    visualFeedback: {
                        dragOpacity: 0.5,          // 拖曳時原物件透明度
                        cloneScale: 1.1,           // 拖曳複製縮放比例
                        hoverEffect: true          // 放置區懸停效果
                    },
                    selectors: {
                        draggable: '.source-item:not([style*="display: none"]), .placed-item',
                        dropZone: '.placement-slot, .placement-area, .source-area'
                    }
                }
            }
        },

        // =====================================================
        // 🎮 遊戲資料配置
        // =====================================================
        gameData: {
            title: "單元F3：認識數字與數量",
            subtitle: "將抽象的數字符號與具體數量進行連結，理解數字與數量的意義",
            themes: {
                default: ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍍', '🍉', '🍑', '🍒', '🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '🚚', '🚲', '🚀', '✈️'],
                fruits: ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍍', '🍉', '🍑', '🍒'],
                animals: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁'],
                vehicles: ['🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '🚚', '🚲', '🚀', '✈️'],
                custom: [] // 自訂主題（動態載入自訂圖示）
            },
            difficultySettings: {
                easy: { minItems: 1, maxItems: 5, label: '簡單' },
                normal: { minItems: 1, maxItems: 10, label: '普通' },
                hard: { minItems: 5, maxItems: 15, label: '困難' }
            },
            countingRanges: {
                'range1-5': { minItems: 1, maxItems: 5, label: '1-5' },
                'range1-10': { minItems: 1, maxItems: 10, label: '1-10' },
                'range5-15': { minItems: 5, maxItems: 15, label: '5-15' },
                'range10-20': { minItems: 10, maxItems: 20, label: '10-20' }
            },
            itemNames: { 
                '🍎': '蘋果', '🍌': '香蕉', '🍇': '葡萄', '🍓': '草莓', '🍊': '橘子', 
                '🥝': '奇異果', '🍍': '鳳梨', '🍉': '西瓜', '🍑': '水蜜桃', '🍒': '櫻桃', 
                '🐶': '小狗', '🐱': '小貓', '🐭': '老鼠', '🐰': '兔子', '🦊': '狐狸', 
                '🐻': '熊', '🐼': '熊貓', '🐨': '無尾熊', '🐯': '老虎', '🦁': '獅子', 
                '🚗': '汽車', '🚕': '計程車', '🚌': '公車', '🚓': '警車', '🚑': '救護車', 
                '🚒': '消防車', '🚚': '卡車', '🚲': '腳踏車', '🚀': '火箭', '✈️': '飛機' 
            }
        },
        
        // =====================================================
        // 🎵 音效系統 - 配置驅動
        // =====================================================
        Audio: {
            soundMap: {
                correct: 'correct02-sound',
                error: 'error-sound', 
                success: 'success-sound',
                select: 'menu-select-sound',
                click: 'click-sound'
            },
            
            playSound(soundType, difficulty, config, callback = null) {
                if (!config || !config.audioFeedback) {
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'audio');
                    return;
                }

                const audioId = this.soundMap[soundType];
                if (!audioId) {
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'audio');
                    return;
                }

                const audioElement = document.getElementById(audioId);
                if (audioElement) {
                    audioElement.currentTime = 0;
                    audioElement.play().catch(e => Game.Debug.log('錯誤', '音效播放失敗', e));
                    if (callback) Game.TimerManager.setTimeout(callback, 300, 'audio');
                } else {
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'audio');
                }
            }
        },

        // =====================================================
        // 🎤 語音系統 - 配置驅動
        // =====================================================
        Speech: {
            synth: window.speechSynthesis,
            voice: null,
            isReady: false,
            
            init() {
                const setVoice = () => {
                    const voices = this.synth.getVoices();
                    if (voices.length === 0) return;
                    
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
                    }
                };
                
                if (this.synth.onvoiceschanged !== undefined) {
                    this.synth.onvoiceschanged = setVoice;
                }
                setVoice();
            },
            
            speak(templateKey, difficulty, config, replacements = {}, callback = null) {
                if (!config || !config.speechFeedback || !this.isReady) {
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'speech');
                    return;
                }

                const template = config.speechTemplates[templateKey];
                if (!template) {
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'speech');
                    return;
                }

                let speechText = template;
                // 需要轉換為中文數字的欄位
                const numberFields = ['count', 'total', 'answer', 'current', 'number'];
                Object.keys(replacements).forEach(key => {
                    if (key === '_suffix') return; // 特殊處理：_suffix 不是模板變數
                    let value = replacements[key];
                    // 如果是數字欄位且有共用模組，使用純數字模式轉換
                    if (numberFields.includes(key) && typeof value === 'number' && typeof NumberSpeechUtils !== 'undefined') {
                        value = NumberSpeechUtils.convertToPureNumberSpeech(value);
                    }
                    speechText = speechText.replace(`{${key}}`, value);
                });

                // 處理 _suffix：追加結尾文字
                if (replacements._suffix) {
                    speechText += replacements._suffix;
                }

                this.synth.cancel();
                const utterance = new SpeechSynthesisUtterance(speechText);
                utterance.voice = this.voice;
                utterance.rate = 1.0;
                utterance.lang = this.voice?.lang || 'zh-TW';

                if (callback) {
                    let callbackExecuted = false;
                    const safeCallback = () => {
                        if (!callbackExecuted) {
                            callbackExecuted = true;
                            callback();
                        }
                    };
                    utterance.onend = safeCallback;
                    utterance.onerror = (event) => {
                        Game.Debug.log('speech', '🎙️ 語音播放錯誤:', event?.error);
                        safeCallback();
                    };
                    Game.TimerManager.setTimeout(safeCallback, 10000, 'speech');
                } else {
                    utterance.onerror = (event) => {
                        Game.Debug.log('speech', '🎙️ 語音播放錯誤:', event?.error);
                    };
                }

                this.synth.speak(utterance);
            }
        },

        // =====================================================
        // 🎨 HTML Templates - 配置驅動模板系統
        // =====================================================
        HTMLTemplates: {
            settingsScreen(difficulty, theme, questionCount, testMode, countingRange) {
                const assistClick = Game.state.settings.assistClick;
                return `
                <div class="unit-welcome">
                    <div class="welcome-content">
                        <div class="settings-title-row">
                            <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                            <h1>${Game.gameData.title}</h1>
                        </div>
                        <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">將抽象的數字符號與具體數量進行連結，理解數字與數量的意義</p>

                        <div class="game-settings">
                            <div class="setting-group">
                                <label>🎯 選擇難度：</label>
                                <div class="button-group">
                                    ${Object.entries(Game.gameData.difficultySettings).map(([key, value]) => `
                                        <button class="selection-btn ${difficulty === key ? 'active' : ''}"
                                                data-type="difficulty" data-value="${key}">
                                            ${value.label}
                                        </button>
                                    `).join('')}
                                </div>
                                <div id="difficulty-description" class="setting-description" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 0.95em; color: #666; text-align: left;">
                                    ${Game.getDifficultyDescription(difficulty)}
                                </div>
                            </div>
                            <div class="setting-group" id="assist-click-group" style="background: #fff3cd; padding: 15px; border-radius: 10px; border: 2px solid #ffcc02; ${difficulty !== 'easy' ? 'display:none;' : ''}">
                                <label style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 1.2em;">♿</span>
                                    <span>輔助點擊模式（單鍵操作）：</span>
                                </label>
                                <p style="font-size: 0.9em; color: #666; margin: 8px 0 12px 0; line-height: 1.5;">
                                    啟用後，只要偵測到點擊，系統會自動依序完成拖曳配對正確的數字等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                    <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式」</strong>
                                </p>
                                <div class="button-group">
                                    <button class="selection-btn ${assistClick ? 'active' : ''}" id="assist-click-on">✓ 啟用</button>
                                    <button class="selection-btn ${!assistClick ? 'active' : ''}" id="assist-click-off">✗ 停用</button>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label>🔢 數字範圍：</label>
                                <div class="button-group">
                                    ${Object.entries(Game.gameData.countingRanges).map(([key, value]) => `
                                        <button class="selection-btn ${countingRange === key ? 'active' : ''}" 
                                                data-type="countingRange" data-value="${key}">
                                            ${value.label}
                                        </button>
                                    `).join('')}
                                    <button class="selection-btn ${countingRange && !Game.gameData.countingRanges[countingRange] ? 'active' : ''}"
                                            data-type="countingRange" data-value="custom">
                                        自訂範圍
                                    </button>
                                </div>
                                
                            </div>
                            
                            <div class="setting-group">
                                <label>🎨 主題選擇：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${theme === 'default' ? 'active' : ''}"
                                            data-type="theme" data-value="default">
                                        隨機 🎲
                                    </button>
                                    ${Object.entries(Game.gameData.themes).filter(([key]) => key !== 'custom' && key !== 'default').map(([key, icons]) => {
                                        const themeNames = { fruits: '水果', animals: '動物', vehicles: '交通工具' };
                                        return `
                                            <button class="selection-btn ${theme === key ? 'active' : ''}"
                                                    data-type="theme" data-value="${key}">
                                                ${themeNames[key]} ${icons[0]}
                                            </button>
                                        `;
                                    }).join('')}
                                    <button class="selection-btn ${theme === 'custom' ? 'active' : ''}"
                                            data-type="theme" data-value="custom">
                                        🎨 自訂主題
                                    </button>
                                </div>
                                <!-- 🔧 [新增] 自訂主題設定容器 -->
                                <div id="custom-theme-container">
                                    ${theme === 'custom' ? `
                                        <div class="setting-group custom-theme-setup">
                                        <h4>🎨 自訂主題設定</h4>
                                        <p>上傳你的圖示並設定名稱：</p>
                                        <div class="custom-items-list" style="display:flex;flex-direction:row;flex-wrap:wrap;gap:10px;min-height:60px;border:1px solid #e0e0e0;border-radius:5px;padding:10px;margin:10px 0;background:white;">
                                            ${Game.state.customItems.map((item, index) => `
                                                <div class="custom-item-row" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;border:1px solid #eee;border-radius:8px;background:#fafafa;text-align:center;width:fit-content;">
                                                    <img src="${item.icon}" alt="${item.name}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;">
                                                    <span style="font-size:12px;font-weight:bold;color:#333;">${item.name}</span>
                                                    <button type="button" onclick="Game.removeCustomItem(${index})" class="remove-btn" style="padding:3px 8px;font-size:12px;">❌</button>
                                                </div>
                                            `).join('')}
                                        </div>
                                        <div class="upload-section">
                                            <input type="file" id="custom-image" accept="image/*" style="display: none;" onchange="Game.handleImageUpload(event)">
                                            <button type="button" onclick="Game.triggerImageUpload()" class="upload-btn"
                                                style="background:linear-gradient(45deg,#2196F3,#42A5F5);color:white;font-weight:bold;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;font-size:14px;transition:background 0.3s ease,transform 0.3s ease;"
                                                onmouseenter="this.style.background='linear-gradient(45deg,#FF9800,#FFA726)';this.style.transform='translateY(-2px)'"
                                                onmouseleave="this.style.background='linear-gradient(45deg,#2196F3,#42A5F5)';this.style.transform=''"
                                                ontouchstart="this.style.background='linear-gradient(45deg,#FF9800,#FFA726)'"
                                                ontouchend="this.style.background='linear-gradient(45deg,#2196F3,#42A5F5)'">📸 上傳圖片</button>
                                        </div>
                                        
                                        <!-- 圖片預覽模態視窗 -->
                                        <div id="image-preview-modal" class="image-preview-modal">
                                            <div class="modal-overlay" onclick="Game.closeImagePreview()"></div>
                                            <div class="modal-content">
                                                <div class="modal-header">
                                                    <h3>🎁 新增自訂圖示</h3>
                                                    <button type="button" class="close-btn" onclick="Game.closeImagePreview()">✕</button>
                                                </div>
                                                <div class="modal-body">
                                                    <div class="image-preview-container">
                                                        <img id="preview-image" src="" alt="圖示預覽" style="max-width: 350px; max-height: 300px; object-fit: contain; border-radius: 10px; border: 2px solid #ddd;">
                                                    </div>
                                                    <div class="item-form">
                                                        <div class="form-group">
                                                            <label>圖示名稱：</label>
                                                            <input type="text" id="modal-custom-name" placeholder="請輸入圖示名稱" maxlength="10">
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="modal-footer">
                                                    <button type="button" class="cancel-btn" onclick="Game.closeImagePreview()">取消</button>
                                                    <button type="button" class="confirm-btn" onclick="Game.confirmAddCustomItem()">確認新增</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                                </div>
                            </div>
                            
                            <div class="setting-group">
                                <label>📊 題目數量：</label>
                                <div class="button-group">
                                    ${[1, 3, 5, 10].map(count => `
                                        <button class="selection-btn ${questionCount === count ? 'active' : ''}"
                                                data-type="questionCount" data-value="${count}">
                                            ${count} 題
                                        </button>
                                    `).join('')}
                                    <button class="selection-btn ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? 'active' : ''}"
                                            data-type="questionCount" data-value="custom">
                                        自訂
                                    </button>
                                </div>
                                <div class="custom-question-display" style="display: ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? 'block' : 'none'}; margin-top: 10px;">
                                    <input type="text" id="custom-question-count-f3"
                                           value="${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? questionCount + '題' : ''}"
                                           placeholder="請輸入題數"
                                           style="padding: 8px; border-radius: 5px; border: 2px solid ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? '#667eea' : '#ddd'}; background: ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? '#667eea' : 'white'}; color: ${questionCount !== null && ![1, 3, 5, 10].includes(questionCount) ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                                           readonly onclick="Game.handleCustomQuestionClick()">
                                </div>
                            </div>

                            <div class="setting-group" id="mode-selection-group">
                                <label>📝 測驗模式：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${testMode === 'retry' ? 'active' : ''}"
                                            data-type="testMode" data-value="retry"
                                            ${difficulty === 'easy' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                        反複練習
                                    </button>
                                    <button class="selection-btn ${testMode === 'single' ? 'active' : ''}"
                                            data-type="testMode" data-value="single"
                                            ${difficulty === 'easy' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                        單次作答
                                    </button>
                                </div>
                                ${difficulty === 'easy' ? '<p style="color: #999; font-size: 0.9em; margin-top: 8px;">簡單模式自動完成，無需選擇測驗模式</p>' : ''}
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
                            <button id="start-game-btn" class="start-btn" disabled>請完成所有選擇</button>
                        </div>
                    </div>
                </div>`;
            },

            gameLayout(currentTurn, totalTurns, difficulty) {
                const config = Game.ModeConfig[difficulty];
                let layoutHTML = '';

                // 簡單和普通模式使用三框佈局
                if (config.turnTypes.includes('numeral-to-object-drop')) {
                    // 🔧 [修正] 根據難度添加對應的類別到 placement-area
                    const placementClass = difficulty === 'normal' ? 'placement-area normal-placement' :
                                         difficulty === 'hard' ? 'placement-area hard-placement' :
                                         'placement-area';
                    
                    layoutHTML = `
                        <div id="item-source-area" class="item-source-area"></div>
                        ${config.uiElements.showHintButton ? `
                            <div class="hint-container" style="display:flex;align-items:center;gap:6px;">
                                <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                                <button class="modern-hint-btn" onclick="Game.handleHintClick()">
                                    <span class="hint-icon">💡</span>
                                    <span class="hint-text">提示</span>
                                    <span class="hint-effect"></span>
                                </button>
                            </div>
                        ` : ''}
                        ${difficulty === 'easy' ? '<div class="placement-wrapper"><div id="count-display" class="count-display">0</div>' : ''}
                        <div id="placement-area" class="${placementClass}"></div>
                        ${difficulty === 'easy' ? '</div>' : ''}
                        <div id="prompt-area" class="prompt-area"></div>
                        <div id="completion-area" class="completion-area"></div>
                    `;
                } else { // 困難模式使用傳統選擇題佈局
                    layoutHTML = `
                        <div id="prompt-area" class="prompt-area"></div>
                        <div id="selection-area" class="selection-area"></div>
                        <div id="completion-area" class="completion-area"></div>
                    `;
                }
                
                return `
                <div class="game-container">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <div id="progress-info">第 ${currentTurn} / ${totalTurns} 題</div>
                        </div>
                        <div class="title-bar-center">
                            <div>${Game.gameData.title}</div>
                        </div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                        </div>
                    </div>
                    <div class="game-content">${layoutHTML}</div>
                </div>`;
            },

            sourceItem: (icon, index) => `<div class="source-item" data-type="source-item" data-index="${index}" data-icon="${icon}" draggable="true">${Game.renderIcon(icon)}</div>`,
            placedItem: (icon, sourceIndex) => `<div class="placed-item" data-type="placed-item" data-source-index="${sourceIndex}" data-icon="${icon}" draggable="true">${Game.renderIcon(icon)}</div>`,
            placementSlot: (index) => `<div class="placement-slot" data-type="placement-slot" data-index="${index}"></div>`,
            promptNumeral: (number) => `<div class="prompt-numeral">${number}</div>`,
            promptObjects: (icon, count) => {
                let html = '<div class="prompt-objects">';
                for (let i = 0; i < count; i++) {
                    html += `<div class="prompt-object" style="animation-delay: ${i * 0.1}s">${Game.renderIcon(icon)}</div>`;
                }
                html += '</div>';
                return html;
            },
            selectionObject: (icon, index) => `<div class="selection-object" data-type="object" data-index="${index}" data-icon="${icon}">${Game.renderIcon(icon)}</div>`,
            selectionNumeral: (number) => `<button class="selection-numeral" data-type="numeral" data-value="${number}">${number}</button>`,
            completeButton: () => `<button id="complete-btn" class="complete-button">完成</button>`,
        },

        // =====================================================
        // 🎮 遊戲狀態管理
        // =====================================================
        state: {
            score: 0,
            currentTurn: 0,
            totalTurns: 10,
            correctAnswer: 0,
            lastAnswer: null, // 記錄上一題的答案，避免連續重複
            currentTurnType: null,
            selectedItems: [],
            isAnswering: false,
            customItems: [], // 自訂主題圖示和名稱
            selectedClickItem: null, // 點擊選中的物品
            draggedElement: null, // 🔧 [新增] 正在拖拽的元素
            // 雙擊檢測變數
            lastClickTime: 0,
            lastClickedElement: null,
            clickCount: 0,
            doubleClickDelay: 500, // 雙擊檢測時間間隔(ms)
            
            startTime: null, // 遊戲開始時間
            settings: {
                difficulty: null,  // 改回預設為easy，避免直接從hard開始
                theme: 'default',
                questionCount: null,
                testMode: null,
                countingRange: null,
                assistClick: false
            }
        },

        // =====================================================
        // 🎮 遊戲流程控制
        // =====================================================
        init() {
            Game.Debug.logGameFlow('遊戲初始化');
            // 🔧 [Bug修復] 清理所有計時器和事件監聽器
            this.TimerManager.clearAll();
            this.EventManager.removeAll();
            // 🎬 注入全局動畫樣式
            this.injectGlobalAnimationStyles();
            // [關鍵修改] 確保每次返回設定頁都清理拖曳系統，防止記憶體洩漏
            this.HTML5DragSystem.cleanup();
            this.Speech.init();
            this.showSettings();
        },
        
        showSettings() {
            AssistClick.deactivate();
            Game.Debug.logGameFlow('顯示設定畫面');
            // 🔧 [Bug修復] 清理遊戲UI相關計時器和事件監聽器
            this.TimerManager.clearAll();
            this.EventManager.removeByCategory('gameUI');

            // 🔄 重置遊戲狀態
            this.resetGameState();

            const app = document.getElementById('app');
            const { difficulty, theme, questionCount, testMode, countingRange } = this.state.settings;

            app.innerHTML = this.HTMLTemplates.settingsScreen(difficulty, theme, questionCount, testMode, countingRange);

            // 綁定事件（使用 EventManager）
            const settingsContainer = app.querySelector('.game-settings');
            this.EventManager.on(settingsContainer, 'click', this.handleSettingSelection.bind(this), {}, 'gameUI');

            const startBtn = app.querySelector('#start-game-btn');
            this.EventManager.on(startBtn, 'click', this.startGame.bind(this), {}, 'gameUI');

            // 獎勵系統連結事件監聽器
            const rewardLink = app.querySelector('#settings-reward-link');
            if (rewardLink) {
                this.EventManager.on(rewardLink, 'click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                }, {}, 'gameUI');
            }

            // 📝 作業單連結事件
            const worksheetLink = app.querySelector('#settings-worksheet-link');
            if (worksheetLink) {
                this.EventManager.on(worksheetLink, 'click', (e) => {
                    e.preventDefault();
                    // 作業單使用自己的預設值與工具列設定，不受遊戲設定影響
                    const params = new URLSearchParams({ unit: 'f3' });
                    window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
                }, {}, 'gameUI');
            }

            // 👆 輔助點擊開關事件
            const assistOn = app.querySelector('#assist-click-on');
            const assistOff = app.querySelector('#assist-click-off');
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

            this.updateStartButton();

        },

        // =====================================================
        // 🔢 自訂數字輸入器 - 配置驅動 (仿f1_object_correspondence)
        // =====================================================
        showCustomQuestionCountInput() {
            this.showNumberInput('請輸入題目數量 (1-30)', (num) => {
                const count = parseInt(num);
                if (count >= 1 && count <= 30) {
                    this.state.settings.questionCount = count;
                    this.state.totalTurns = count;

                    // 更新按鈕狀態
                    const btn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
                    if (btn) {
                        btn.closest('.button-group').querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    }

                    // 🔧 [新增] 顯示自訂題數輸入框並套用藍色樣式（避免閃爍）
                    const customDisplay = document.querySelector('.custom-question-display');
                    const customInput = document.getElementById('custom-question-count-f3');
                    if (customDisplay && customInput) {
                        customDisplay.style.display = 'block';
                        customInput.value = `${count}題`;
                        customInput.style.background = '#667eea';
                        customInput.style.color = 'white';
                        customInput.style.borderColor = '#667eea';
                    }

                    // 更新開始按鈕狀態
                    this.updateStartButton();

                    Game.Debug.logUserAction('自訂題目數量', { count });
                    return true;
                } else {
                    alert('請輸入1-30之間的數字');
                    return false;
                }
            });
        },

        showCustomRangeInput() {
            this.showRangeInput('請輸入數字範圍', (min, max) => {
                const minNum = parseInt(min);
                const maxNum = parseInt(max);
                
                if (minNum >= 1 && maxNum <= 30 && minNum < maxNum) {
                    const customKey = `custom-${minNum}-${maxNum}`;
                    this.gameData.countingRanges[customKey] = {
                        minItems: minNum,
                        maxItems: maxNum,
                        label: `${minNum}-${maxNum}`
                    };

                    this.state.settings.countingRange = customKey;

                    // 更新開始按鈕狀態
                    this.updateStartButton();
                    
                    Game.Debug.logUserAction('自訂數字範圍', { min: minNum, max: maxNum });
                    return true;
                } else {
                    alert('請確認：最小值≥1，最大值≤30，且最小值<最大值');
                    return false;
                }
            });
        },

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
                        " onmouseover="this.style.background='#ff3742'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='#ff4757'; this.style.transform='scale(1)'">❌</button>
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

        showRangeInput(title, callback) {
            if (document.getElementById('range-input-popup')) return;
            
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
                        " onmouseover="this.style.background='#ff3742'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='#ff4757'; this.style.transform='scale(1)'">❌</button>
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
                            Game.Debug.log('ui', 'F3 Range Input:', { minVal, maxVal, minValid: minVal > 0, maxValid: maxVal > minVal && maxVal <= 50 });
                            
                            // 將feedback元素傳遞給callback函數
                            const feedbackDiv = document.getElementById('input-feedback');
                            if (callback(minVal, maxVal, feedbackDiv)) {
                                document.getElementById('range-input-popup').remove();
                            }
                        }
                    } else {
                        // 限制數字輸入長度，避免輸入超過50的數字
                        if (currentDisplay.value.length < 2) {
                            const newValue = currentDisplay.value + key;
                            const numValue = parseInt(newValue);
                            const feedbackDiv = document.getElementById('input-feedback');
                            
                            // 檢查是否為最小值輸入0
                            if (!isInputingMax && numValue === 0) {
                                // 最小值不能為0
                                if (feedbackDiv) {
                                    feedbackDiv.textContent = '⚠️ 最小值必須大於0';
                                    feedbackDiv.style.color = '#ff6b6b';
                                    Game.TimerManager.setTimeout(() => {
                                        feedbackDiv.textContent = '';
                                    }, 2000, 'ui');
                                }
                                return; // 不允許輸入0作為最小值
                            }
                            
                            if (numValue <= 30) {
                                currentDisplay.value += key;
                                // 清除之前的錯誤訊息
                                if (feedbackDiv) {
                                    feedbackDiv.textContent = '';
                                }
                            } else {
                                // 顯示即時提示
                                if (feedbackDiv) {
                                    feedbackDiv.textContent = '⚠️ 最大值不能超過50';
                                    feedbackDiv.style.color = '#ff6b6b';
                                    Game.TimerManager.setTimeout(() => {
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

        handleSettingSelection(event) {
            // 🔓 解鎖手機音頻播放權限
            if (window.AudioUnlocker && !window.AudioUnlocker.isUnlocked) {
                window.AudioUnlocker.unlock();
            }
            
            const btn = event.target.closest('.selection-btn');
            if (!btn) return;

            const { type, value } = btn.dataset;
            Game.Debug.logUserAction('設定選擇', { type, value });

            // 處理自訂選項
            if (value === 'custom') {
                if (type === 'questionCount') {
                    this.showCustomQuestionCountInput();
                    return;
                } else if (type === 'countingRange') {
                    // 參照F1方式：使用彈出式範圍輸入器
                    this.showRangeInput('請輸入數字範圍 (1-30)', (minVal, maxVal, feedbackDiv) => {
                        Game.Debug.log('ui', 'F3 Callback received:', { minVal, maxVal, type: typeof minVal, type2: typeof maxVal });
                        const isValid = minVal > 0 && maxVal > minVal && maxVal <= 30;
                        Game.Debug.log('ui', 'F3 Validation result:', { isValid, condition1: minVal > 0, condition2: maxVal > minVal, condition3: maxVal <= 30 });
                        
                        if (isValid) {
                            // 建立自訂範圍配置
                            this.gameData.countingRanges.custom = {
                                minItems: minVal,
                                maxItems: maxVal,
                                label: `${minVal}-${maxVal}`
                            };
                            this.state.settings.countingRange = 'custom';
                            btn.closest('.button-group').querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            btn.textContent = `${minVal}-${maxVal}`; // 更新按鈕文字
                            this.updateStartButton();
                            Game.Debug.log('ui', 'F3 Range set successfully');
                            return true;
                        }
                        
                        // 在輸入器上顯示具體的錯誤訊息
                        let errorMsg = '⚠️ 輸入無效：';
                        if (minVal <= 0) errorMsg += '最小值必須大於0；';
                        if (maxVal <= minVal) errorMsg += '最大值必須大於最小值；';
                        if (maxVal > 30) errorMsg += '最大值不能超過30；';
                        
                        if (feedbackDiv) {
                            feedbackDiv.textContent = errorMsg;
                            feedbackDiv.style.color = '#ff6b6b';
                            Game.TimerManager.setTimeout(() => {
                                feedbackDiv.textContent = '';
                            }, 3000, 'ui'); // 3秒後清除錯誤訊息
                        }
                        
                        Game.Debug.log('ui', 'F3 Range validation failed:', errorMsg);
                        return false;
                    });
                    return;
                } else if (type === 'theme') {
                    // 選擇自訂主題時，確保自訂主題資料同步
                    this.gameData.themes.custom = this.state.customItems.map(item => item.icon);
                }
            }

            // 更新狀態
            if (type === 'questionCount') {
                this.state.settings[type] = parseInt(value);
                this.state.totalTurns = parseInt(value);
            } else {
                this.state.settings[type] = value;
            }

            // 🔧 [新增] 選擇預設題數時，隱藏自訂輸入框
            if (type === 'questionCount' && value !== 'custom') {
                const customDisplay = document.querySelector('.custom-question-display');
                const customInput = document.getElementById('custom-question-count-f3');
                if (customDisplay && customInput) {
                    customDisplay.style.display = 'none';
                    customInput.value = '';
                    customInput.style.background = 'white';
                    customInput.style.color = '#333';
                    customInput.style.borderColor = '#ddd';
                }
            }

            // 更新UI
            btn.parentElement.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 播放選擇音效
            this.Audio.playSound('select', null, { audioFeedback: true });
            
            // 🔧 [優化] 如果選擇了主題，只更新自訂主題設定區域，避免閃爍
            if (type === 'theme') {
                this.updateCustomThemeSettings();
                return;
            }

            // 🔧 如果修改難度，更新測驗模式按鈕的可用性
            if (type === 'difficulty') {
                this.updateModeButtonsAvailability(value);
                // 🔧 [新增] 更新難度說明
                this.updateDifficultyDescription(value);
                // 👆 輔助點擊：只在簡單模式顯示
                const assistGroup = document.getElementById('assist-click-group');
                if (assistGroup) assistGroup.style.display = value !== 'easy' ? 'none' : '';
                if (value !== 'easy') this.state.settings.assistClick = false;
            }

            this.updateStartButton();
        },

        // 🔧 更新測驗模式按鈕的可用性（簡單模式時禁用）
        updateModeButtonsAvailability(difficulty) {
            const modeButtons = document.querySelectorAll('[data-type="testMode"]');
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
                if (!modeGroup.querySelector('.mode-hint')) {
                    const hint = document.createElement('p');
                    hint.className = 'mode-hint';
                    hint.style.cssText = 'color: #999; font-size: 0.9em; margin-top: 8px;';
                    hint.textContent = '簡單模式自動完成，無需選擇測驗模式';
                    modeGroup.appendChild(hint);
                }

                // 清除模式選擇（重置為null）
                this.state.settings.testMode = null;
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
        },

        // 🔧 [新增] 取得難度說明
        getDifficultyDescription(difficulty) {
            const descriptions = {
                'easy': '簡單：系統自動數數，有放置框提示，引導下完成題目。',
                'normal': '普通：系統自動數數，沒有放置框提示，要放置正確的數量。',
                'hard': '困難：自己數數，並放置正確的數量。'
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

        // 🔧 [新增] 更新自訂主題設定區域（避免整頁重新渲染）
        updateCustomThemeSettings() {
            const customThemeContainer = document.getElementById('custom-theme-container');
            if (!customThemeContainer) return;

            const { theme } = this.state.settings;

            if (theme === 'custom') {
                // 顯示自訂主題設定
                customThemeContainer.innerHTML = `
                    <div class="setting-group custom-theme-setup">
                        <h4>🎨 自訂主題設定</h4>
                        <p>上傳你的圖示並設定名稱：</p>
                        <div class="custom-items-list">
                            ${this.state.customItems.map((item, index) => `
                                <div class="custom-item-row">
                                    <img src="${item.icon}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                                    <span>${item.name}</span>
                                    <button type="button" onclick="Game.removeCustomItem(${index})" class="remove-btn">❌</button>
                                </div>
                            `).join('')}
                        </div>
                        <div class="upload-section">
                            <input type="file" id="custom-image" accept="image/*" style="display: none;" onchange="Game.handleImageUpload(event)">
                            <button type="button" onclick="Game.triggerImageUpload()" class="upload-btn">📸 上傳圖片</button>
                        </div>

                        <!-- 圖片預覽模態視窗 -->
                        <div id="image-preview-modal" class="image-preview-modal">
                            <div class="modal-overlay" onclick="Game.closeImagePreview()"></div>
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h3>🎁 新增自訂圖示</h3>
                                    <button type="button" class="close-btn" onclick="Game.closeImagePreview()">✕</button>
                                </div>
                                <div class="modal-body">
                                    <div class="image-preview-container">
                                        <img id="preview-image" src="" alt="預覽圖片" style="max-width: 350px; max-height: 300px; object-fit: contain; border-radius: 10px; border: 2px solid #ddd;">
                                    </div>
                                    <div class="item-form">
                                        <div class="form-group">
                                            <label for="modal-custom-name">圖示名稱：</label>
                                            <input type="text" id="modal-custom-name" placeholder="請輸入圖示名稱" maxlength="10">
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="cancel-btn" onclick="Game.closeImagePreview()">取消</button>
                                    <button type="button" class="confirm-btn" onclick="Game.confirmAddCustomItem()">確認新增</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // 隱藏自訂主題設定
                customThemeContainer.innerHTML = '';
            }
        },

        // 🔧 [新增] 處理點擊自訂題數輸入框
        handleCustomQuestionClick() {
            const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
            if (customBtn) {
                customBtn.click();
            }
        },

        updateStartButton() {
            const { difficulty, theme, testMode, countingRange, questionCount } = this.state.settings;
            const startBtn = document.getElementById('start-game-btn');

            // 檢查自訂主題是否有足夠的圖示
            const isCustomThemeValid = theme !== 'custom' || this.state.customItems.length >= 1;

            // 🔧 簡單模式不需要選擇測驗模式
            const modeRequired = difficulty !== 'easy';
            const modeValid = modeRequired ? testMode : true;

            if (difficulty && theme && modeValid && countingRange && questionCount && isCustomThemeValid) {
                startBtn.disabled = false;
                startBtn.textContent = '開始遊戲！';
                startBtn.classList.add('ready');
            } else {
                startBtn.disabled = true;
                if (theme === 'custom' && this.state.customItems.length < 1) {
                    startBtn.textContent = '自訂主題需要至少1個圖示';
                } else {
                    startBtn.textContent = '請完成所有選擇';
                }
                startBtn.classList.remove('ready');
            }
        },
        
        startGame() {
            Game.Debug.logGameFlow('遊戲開始', this.state.settings);
            // 🔄 重置遊戲狀態
            this.resetGameState();
            this.state.startTime = Date.now(); // 記錄開始時間
            this.setupGameUI();
            if (this.state.settings.difficulty === 'easy' && this.state.settings.assistClick) {
                AssistClick.activate();
            }
            this.startNewTurn();
        },
        
        setupGameUI() {
            const app = document.getElementById('app');
            app.innerHTML = this.HTMLTemplates.gameLayout(this.state.currentTurn + 1, this.state.totalTurns, this.state.settings.difficulty);

            this.elements = ['itemSourceArea', 'placementArea', 'promptArea', 'completionArea', 'countDisplay'].reduce((acc, id) => {
                const element = document.getElementById(id.replace(/([A-Z])/g, '-$1').toLowerCase());
                if (element) acc[id] = element;
                return acc;
            }, {});

            // [關鍵修改] 統一在UI設置時初始化拖曳系統，並只做一次
            this.TimerManager.setTimeout(() => {
                this.HTML5DragSystem.initialize(this.state.settings.difficulty);
            }, 100, 'animation');

            // 綁定完成按鈕的事件監聽（使用 EventManager）
            const gameContent = document.querySelector('.game-content');
            if (gameContent) {
                this.EventManager.on(gameContent, 'click', this.handleCompletionButtonOnly.bind(this), {}, 'gameUI');
            }
        },
        
        startNewTurn() {
            if (this.state.currentTurn >= this.state.totalTurns) { 
                this.endGame(); 
                return; 
            }
            this.state.currentTurn++; 
            this.state.selectedItems = [];
            this.state.isAnswering = false;
            
            Game.Debug.logGameFlow('開始新回合', { 
                turn: this.state.currentTurn, 
                total: this.state.totalTurns 
            });
            
            this.updateUI(); 
            this.generateQuestion();
        },
        
        generateQuestion() {
            const { difficulty, countingRange } = this.state.settings;
            const config = this.ModeConfig[difficulty];
            const range = this.gameData.countingRanges[countingRange];
            // 生成與上一題不同的題目數量
            this.state.correctAnswer = this.getRandomIntExcluding(
                range.minItems, 
                range.maxItems, 
                this.state.lastAnswer
            );
            
            const turnType = config.turnTypes.includes('random')
                ? (Math.random() < 0.5 ? 'numeral-to-object' : 'object-to-numeral')
                : config.turnTypes[0];
            
            this.state.currentTurnType = turnType;
            
            Game.Debug.logGameFlow('生成題目', { 
                turnType, 
                answer: this.state.correctAnswer 
            });
            
            if (turnType === 'numeral-to-object-drop') {
                this.renderDropTurn();
            } else if (turnType === 'numeral-to-object') {
                this.renderNumeralToObjectTurn();
            } else {
                this.renderObjectToNumeralTurn();
            }
            
            // 🔧 [修復] 題目渲染完成後，重新註冊拖曳元素
            this.TimerManager.setTimeout(() => {
                this.HTML5DragSystem.refresh(this.state.settings.difficulty);
                Game.Debug.logGameFlow('觸控拖曳註冊完成');
            }, 100, 'animation');
        },

        // ==========================================
        //  <<< 渲染邏輯 (Rendering Logic) >>>
        // ==========================================
        renderDropTurn() {
            const { difficulty, theme } = this.state.settings;
            const config = this.ModeConfig[difficulty];
            const correctAnswer = this.state.correctAnswer;

            // 清空所有區域
            Object.values(this.elements).forEach(el => el && (el.innerHTML = ''));
            
            // 簡單模式：重置數字顯示
            if (difficulty === 'easy') {
                this.updateCountDisplay(0);
            }

            const itemIcon = this.getRandomItem(theme);
            const itemName = this.getItemName(itemIcon);
            
            // 渲染數字提示 (下方)
            this.elements.promptArea.innerHTML = this.HTMLTemplates.promptNumeral(correctAnswer);

            // 渲染物品來源 (上方)
            let sourceItemCount;
            if (difficulty === 'hard') {
                // 困難模式：提供更多干擾項（增加挑戰性）
                sourceItemCount = correctAnswer + this.getRandomInt(7, 10);
            } else {
                // 簡單和普通模式
                sourceItemCount = correctAnswer + this.getRandomInt(3, 5);
            }
            
            this.elements.itemSourceArea.innerHTML = Array.from({ length: sourceItemCount }, (_, i) => 
                this.HTMLTemplates.sourceItem(itemIcon, i)
            ).join('');

            // 依難度渲染放置區 (中間)
            if (difficulty === 'easy') {
                this.elements.placementArea.innerHTML = Array.from({ length: correctAnswer }, (_, i) =>
                    this.HTMLTemplates.placementSlot(i)
                ).join('');
            } else if (difficulty === 'normal' || difficulty === 'hard') {
                // 🔧 [修正] 普通和困難模式不使用槽位，直接在放置區中排列圖示
                this.elements.placementArea.innerHTML = '';
            }

            // 渲染完成按鈕 (如果需要)
            if (config.uiElements.showCompletionButton) {
                this.elements.completionArea.innerHTML = this.HTMLTemplates.completeButton();
            }
            
            // [關鍵修改] 每次渲染新回合後，刷新拖曳系統的狀態，以綁定新元素
            this.TimerManager.setTimeout(() => this.HTML5DragSystem.refresh(difficulty), 100, 'animation');
            
            // 播放語音提示
            this.TimerManager.setTimeout(() => {
                this.Speech.speak('initialInstruction', difficulty, config, {
                    answer: correctAnswer,
                    itemName
                });
            }, 500, 'turnTransition');
        },

        renderNumeralToObjectTurn() {
            const { theme, difficulty } = this.state.settings;
            const config = this.ModeConfig[difficulty];
            const correctAnswer = this.state.correctAnswer;
            
            // 清空區域
            this.elements.promptArea.innerHTML = '';
            this.elements.selectionArea.innerHTML = '';
            this.elements.completionArea.innerHTML = '';
            
            const availableIcons = [...this.gameData.themes[theme]];
            const correctIcon = availableIcons[this.getRandomInt(0, availableIcons.length - 1)];
            
            // 渲染提示數字
            this.elements.promptArea.innerHTML = this.HTMLTemplates.promptNumeral(correctAnswer);
            
            // 生成選項物品
            const items = [];
            for (let i = 0; i < correctAnswer; i++) {
                items.push({ icon: correctIcon, isCorrect: true });
            }
            
            // 添加干擾項
            const distractorCount = this.getRandomInt(3, 8);
            const otherIcons = availableIcons.filter(icon => icon !== correctIcon);
            for (let i = 0; i < distractorCount; i++) {
                const distractorIcon = otherIcons[this.getRandomInt(0, otherIcons.length - 1)];
                items.push({ icon: distractorIcon, isCorrect: false });
            }
            
            this.shuffleArray(items);
            
            this.elements.selectionArea.innerHTML = items.map((item, index) => 
                this.HTMLTemplates.selectionObject(item.icon, index)
            ).join('');
            
            this.elements.completionArea.innerHTML = this.HTMLTemplates.completeButton();

            this.TimerManager.setTimeout(() => {
                this.Speech.speak('initialInstruction_numeral', difficulty, config, {
                    answer: correctAnswer
                });
            }, 500, 'turnTransition');
        },

        renderObjectToNumeralTurn() {
            const { theme, difficulty } = this.state.settings;
            const config = this.ModeConfig[difficulty];
            const correctAnswer = this.state.correctAnswer;
            
            // 清空區域
            this.elements.promptArea.innerHTML = '';
            this.elements.selectionArea.innerHTML = '';
            this.elements.completionArea.innerHTML = '';
            
            const availableIcons = [...this.gameData.themes[theme]];
            const correctIcon = availableIcons[this.getRandomInt(0, availableIcons.length - 1)];
            const itemName = this.getItemName(correctIcon);
            
            this.elements.promptArea.innerHTML = this.HTMLTemplates.promptObjects(correctIcon, correctAnswer);
            
            const rangeConfig = this.gameData.countingRanges[this.state.settings.countingRange];
            const options = [correctAnswer];
            
            while (options.length < config.optionsCount) {
                const wrongOption = this.getRandomInt(rangeConfig.minItems, rangeConfig.maxItems);
                if (!options.includes(wrongOption)) {
                    options.push(wrongOption);
                }
            }
            
            this.shuffleArray(options);
            
            this.elements.selectionArea.innerHTML = options.map(num =>
                this.HTMLTemplates.selectionNumeral(num)
            ).join('');

            this.TimerManager.setTimeout(() => {
                this.Speech.speak('initialInstruction_object', difficulty, config, {
                    itemName
                });
            }, 500, 'turnTransition');
        },

        // ============================================
        //  <<< 互動邏輯 (Interaction Logic) >>>
        // ============================================
        handleActionClick(event) {
            Game.Debug.log('click', '🚨 handleActionClick 被呼叫', { target: event.target, type: event.target.dataset?.type });
            
            if (this.state.isAnswering) {
                Game.Debug.log('click', '⏸️ 遊戲正在回答中，忽略點擊');
                return;
            }
            
            const target = event.target;
            const type = target.dataset.type;

            // 檢查是否啟用點擊移動功能，如果是則優先使用新的點擊邏輯
            const difficulty = this.state.settings?.difficulty;
            const config = this.ModeConfig[difficulty];
            const useClickToMove = config?.clickToMoveConfig?.enabled;
            
            Game.Debug.log('click', '🔧 handleActionClick 路由檢查', {
                difficulty: difficulty,
                hasConfig: !!config,
                clickToMoveConfig: config?.clickToMoveConfig,
                useClickToMove: useClickToMove,
                targetType: type
            });

            if (target.id === 'complete-btn') {
                const count = this.elements.placementArea ? this.elements.placementArea.children.length : this.state.selectedItems.length;
                this.checkAnswer(count);
            } else if (type === 'source-item') {
                Game.Debug.log('click', '🎯 處理 source-item 點擊', { useClickToMove: useClickToMove });
                if (useClickToMove) {
                    Game.Debug.log('click', '➡️ 路由到新的點擊移動邏輯 (handleItemClick)');
                    // 使用新的點擊移動邏輯：點擊選擇而非直接放置
                    this.handleItemClick(event);
                } else {
                    Game.Debug.log('click', '➡️ 路由到傳統邏輯 (handleItemPlacement)');
                    // 傳統邏輯：直接放置
                    this.handleItemPlacement(target, null, 'MOUSE'); // 明確標示為滑鼠操作
                }
            } else if (type === 'placed-item') {
                if (useClickToMove) {
                    // 使用新的點擊移動邏輯：點擊取回
                    this.handleItemClick(event);
                } else {
                    // 傳統邏輯：直接取回
                    this.handleItemReturn(target);
                }
            } else if (type === 'placement-slot') {
                if (useClickToMove) {
                    // 使用新的點擊移動邏輯：點擊放置選中物品
                    this.handleItemClick(event);
                } else if (target.classList.contains('filled')) {
                    // 傳統邏輯：只有填充的槽才能取回
                    this.handleItemReturn(target);
                }
            } else if (type === 'object') {
                target.classList.toggle('selected');
                this.Audio.playSound('select', this.state.settings.difficulty, this.ModeConfig[this.state.settings.difficulty]);
                this.state.selectedItems = Array.from(
                    this.elements.selectionArea.querySelectorAll('.selection-object.selected')
                ).map(el => el.dataset.icon);
            } else if (type === 'numeral') {
                const selectedValue = parseInt(target.dataset.value);
                this.checkAnswer(selectedValue);
            } else {
                // 🔧 [修復] 處理點擊到子元素的情況，向上查找父元素
                Game.Debug.log('click', '🔍 目標元素沒有直接的 data-type，嘗試查找父元素');
                const parentSourceItem = target.closest('.source-item');
                const parentPlacedItem = target.closest('.placed-item');
                const parentPlacementSlot = target.closest('.placement-slot');
                
                Game.Debug.log('click', '🔍 父元素查找結果', {
                    parentSourceItem: !!parentSourceItem,
                    parentPlacedItem: !!parentPlacedItem,
                    parentPlacementSlot: !!parentPlacementSlot
                });
                
                if (parentSourceItem && useClickToMove) {
                    Game.Debug.log('click', '✅ 找到父層 source-item，路由到點擊移動邏輯');
                    // 創建一個模擬事件，目標設為父元素
                    const mockEvent = { ...event, target: parentSourceItem };
                    this.handleItemClick(mockEvent);
                } else if (parentSourceItem) {
                    Game.Debug.log('click', '✅ 找到父層 source-item，路由到傳統邏輯');
                    this.handleItemPlacement(parentSourceItem, null, 'MOUSE'); // 明確標示為滑鼠操作
                } else if (parentPlacedItem && useClickToMove) {
                    Game.Debug.log('click', '✅ 找到父層 placed-item，路由到點擊移動邏輯');
                    const mockEvent = { ...event, target: parentPlacedItem };
                    this.handleItemClick(mockEvent);
                } else if (parentPlacedItem) {
                    Game.Debug.log('click', '✅ 找到父層 placed-item，路由到傳統邏輯');
                    this.handleItemReturn(parentPlacedItem);
                } else if (parentPlacementSlot && useClickToMove) {
                    Game.Debug.log('click', '✅ 找到父層 placement-slot，路由到點擊移動邏輯');
                    const mockEvent = { ...event, target: parentPlacementSlot };
                    this.handleItemClick(mockEvent);
                } else {
                    Game.Debug.log('click', '❌ 未找到任何有效的父元素');
                }
            }
        },

        // 🔧 [修正] 只處理完成按鈕點擊的簡化版事件處理器
        handleCompletionButtonOnly(event) {
            Game.Debug.log('click', '🎯 [完成按鈕] handleCompletionButtonOnly 被呼叫', { target: event.target });
            
            if (this.state.isAnswering) {
                Game.Debug.log('click', '⏸️ [完成按鈕] 遊戲正在回答中，忽略點擊');
                return;
            }

            const target = event.target;
            
            // 只處理完成按鈕點擊
            if (target.id === 'complete-btn') {
                Game.Debug.log('click', '✅ [完成按鈕] 偵測到完成按鈕點擊');

                // 💡 [FIX] 修正計數邏輯：
                // 簡單模式：計算 .placement-slot.filled
                // 普通/困難模式：計算 .placed-item
                const difficulty = this.state.settings.difficulty;
                let count;
                if (difficulty === 'easy') {
                    count = this.elements.placementArea
                        ? this.elements.placementArea.querySelectorAll('.placement-slot.filled').length
                        : 0;
                } else {
                    count = this.elements.placementArea
                        ? this.elements.placementArea.querySelectorAll('.placed-item').length
                        : 0;
                }

                this.checkAnswer(count);
            } else {
                Game.Debug.log('click', '🔍 [完成按鈕] 非完成按鈕點擊，忽略', { targetId: target.id });
            }
        },

        handleItemPlacement(sourceItem, targetSlot = null, operationType = null) {
            // 🔍 自動檢測操作類型（如果未提供）
            if (!operationType) {
                // 檢查最近的觸控事件來判斷操作類型
                const lastTouchTime = window.lastTouchTime || 0;
                const currentTime = Date.now();
                const isRecentTouch = (currentTime - lastTouchTime) < 500; // 500ms內的觸控事件
                operationType = isRecentTouch ? 'TOUCH' : 'MOUSE';
            }
            
            Game.Debug.log('drag', '🚀 [精確放置] handleItemPlacement 開始執行', {
                sourceItem: sourceItem,
                targetSlot: targetSlot,
                display: sourceItem.style.display,
                difficulty: this.state.settings.difficulty,
                operationType: `【${operationType}】操作`,
                placementMode: targetSlot ? '精確放置' : '依序放置'
            });
            
            if (sourceItem.style.display === 'none') {
                Game.Debug.log('drag', '❌ [精確放置] 來源物品已隱藏，跳過放置');
                return;
            }
            
            const { difficulty } = this.state.settings;
            const config = this.ModeConfig[difficulty];
            
            Game.Debug.log('drag', '🔊 [精確放置] 播放放置音效', { difficulty, config: !!config });
            this.Audio.playSound('select', difficulty, config);

            if (difficulty === 'easy') {
                Game.Debug.log('drag', '🟢 [精確放置] 簡單模式放置邏輯');
                
                // 🎯 精確放置邏輯：如果指定了目標槽，使用指定的；否則找第一個空槽
                let emptySlot;
                if (targetSlot && targetSlot.classList.contains('placement-slot') && !targetSlot.classList.contains('filled')) {
                    emptySlot = targetSlot;
                    Game.Debug.log('drag', '✅ [精確放置] 使用指定的目標槽位');
                } else {
                    emptySlot = this.elements.placementArea.querySelector('.placement-slot:not(.filled)');
                    Game.Debug.log('drag', '🔍 [精確放置] 目標槽無效，查找第一個空槽位', { emptySlot: !!emptySlot });
                }
                
                if (emptySlot) {
                    Game.Debug.log('drag', '✅ [精確放置] 找到有效槽位，開始放置物品');
                    // 簡單模式：讓物品從來源區完全消失
                    sourceItem.style.display = 'none';
                    Game.Debug.log('drag', '👻 [精確放置] 隱藏來源物品');
                    
                    emptySlot.classList.add('filled');
                    emptySlot.innerHTML = this.renderIcon(sourceItem.dataset.icon);
                    emptySlot.dataset.sourceIndex = sourceItem.dataset.index;
                    emptySlot.setAttribute('draggable', 'true'); // 讓填充的槽位可拖拽
                    Game.Debug.log('drag', `🎯 [精確放置] 槽位填充完成【${operationType}】`, {
                        icon: sourceItem.dataset.icon,
                        sourceIndex: sourceItem.dataset.index,
                        operationType: operationType,
                        slotIndex: Array.from(this.elements.placementArea.children).indexOf(emptySlot)
                    });
                    const count = this.elements.placementArea.querySelectorAll('.filled').length;
                    
                    // 更新數字顯示
                    this.updateCountDisplay(count);
                    
                    this.playCountingVoice(count, config, () => {
                        if (count === this.state.correctAnswer) this.checkAnswer(count);
                    });
                }
            } else if (difficulty === 'normal' || difficulty === 'hard') {
                Game.Debug.log('drag', '🟡 [精確放置] 普通/困難模式放置邏輯');

                // 🔧 [修正] 不使用槽位，直接創建並添加圖示到放置區
                sourceItem.style.display = 'none';
                Game.Debug.log('drag', '👻 [精確放置] 隱藏來源物品');

                // 創建已放置的圖示元素
                const placedItem = document.createElement('div');
                placedItem.className = 'placed-item';
                placedItem.dataset.type = 'placed-item';
                placedItem.dataset.sourceIndex = sourceItem.dataset.index;
                placedItem.dataset.icon = sourceItem.dataset.icon;
                placedItem.setAttribute('draggable', 'true');
                placedItem.innerHTML = this.renderIcon(sourceItem.dataset.icon);

                // 直接添加到放置區
                this.elements.placementArea.appendChild(placedItem);

                Game.Debug.log('drag', `🎯 [精確放置] 圖示添加完成【${operationType}】`, {
                    icon: sourceItem.dataset.icon,
                    sourceIndex: sourceItem.dataset.index,
                    operationType: operationType,
                    placedItemCount: this.elements.placementArea.children.length
                });

                const count = this.elements.placementArea.children.length;

                // 根據配置決定是否播放數量語音
                Game.Debug.log('speech', '🔊 [放置語音] 語音配置檢查', {
                    countingVoice: config.countingVoice,
                    speechFeedback: config.speechFeedback,
                    count: count,
                    difficulty: difficulty
                });

                if (config.countingVoice) {
                    Game.Debug.log('speech', '✅ [放置語音] 即將播放計數語音');
                    this.playCountingVoice(count, config); // 普通模式播放語音
                } else {
                    Game.Debug.log('speech', '❌ [放置語音] 不播放語音，countingVoice=false');
                }
                // 困難模式 (countingVoice: false) 不播放語音
            }
        },

        // [最終修正] 物品返回的核心邏輯
        handleItemReturn(placedElement) { // 參數名稱改為 placedElement 更通用
            const { difficulty } = this.state.settings;
            const config = this.ModeConfig[difficulty];

            // 處理簡單模式的 .placement-slot.filled 或 普通/困難模式的 .placed-item
            const sourceIndex = placedElement.dataset.sourceIndex;
            const sourceItem = this.elements.itemSourceArea.querySelector(`.source-item[data-index="${sourceIndex}"]`);

            if (sourceItem) {
                this.Audio.playSound('click', difficulty, config);

                // 讓來源區的物品重新顯示
                sourceItem.style.display = '';

                if (difficulty === 'easy') {
                    // 簡單模式：清空 slot 的內容並恢復其狀態
                    placedElement.classList.remove('filled');
                    placedElement.innerHTML = '';
                    placedElement.removeAttribute('draggable');
                    delete placedElement.dataset.sourceIndex;

                    const remainingCount = this.elements.placementArea.querySelectorAll('.filled').length;
                    this.updateCountDisplay(remainingCount);
                } else {
                    // 普通/困難模式：直接移除 placed-item 元素
                    placedElement.remove();

                    const remainingCount = this.elements.placementArea.children.length;

                    // 普通模式：從大框拖曳回去時播放數字語音
                    Game.Debug.log('speech', `🔊 [拖曳回去] 語音檢查: countingVoice=${config.countingVoice}, remainingCount=${remainingCount}, difficulty=${difficulty}`);
                    if (config.countingVoice && remainingCount > 0) {
                        Game.Debug.log('speech', `🎵 [拖曳回去] 即將播放語音: ${remainingCount}`);
                        this.playCountingVoice(remainingCount, config);
                    } else {
                        Game.Debug.log('speech', `❌ [拖曳回去] 不播放語音，原因: countingVoice=${config.countingVoice}, remainingCount=${remainingCount}`);
                    }
                }
            }
        },
        
        // 帶語音的物品返回處理
        handleItemReturnWithVoice(placedItem) {
            const sourceIndex = placedItem.dataset.sourceIndex;
            const sourceItem = this.elements.itemSourceArea.querySelector(`.source-item[data-index="${sourceIndex}"]`);
            if (sourceItem) {
                const { difficulty } = this.state.settings;
                const config = this.ModeConfig[difficulty];
                
                this.Audio.playSound('click', difficulty, config);
                
                if (difficulty === 'easy') {
                    // 簡單模式：讓物品重新顯示在來源區
                    sourceItem.style.display = '';
                    placedItem.classList.remove('filled');
                    placedItem.innerHTML = '';
                    delete placedItem.dataset.sourceIndex;
                    
                    // 計算剩餘數量並更新顯示
                    const remainingCount = this.elements.placementArea.querySelectorAll('.filled').length;
                    this.updateCountDisplay(remainingCount);
                    
                    if (remainingCount > 0) {
                        this.playCountingVoice(remainingCount, config);
                    }
                } else if (difficulty === 'normal' || difficulty === 'hard') {
                    // 普通模式和困難模式：讓物品重新顯示在來源區
                    sourceItem.style.display = '';
                    placedItem.remove(); // 從放置區移除
                    
                    // 計算剩餘數量，根據配置決定是否播放語音
                    const remainingCount = this.elements.placementArea.children.length;
                    if (remainingCount > 0 && config.countingVoice) {
                        this.playCountingVoice(remainingCount, config); // 只有普通模式播放語音
                    }
                }
            }
        },

        // =====================================================
        // 點擊操作處理方法
        // =====================================================
        
        handleItemClick(event) {
            Game.Debug.log('click', '🎯 handleItemClick 被呼叫', { event: event.type, target: event.target });
            
            const difficulty = this.state.settings?.difficulty;
            if (!difficulty) {
                Game.Debug.log('click', '❌ 無法獲取難度設定');
                Game.Debug.logUserAction('無法獲取難度設定，跳過點擊處理');
                return;
            }
            
            Game.Debug.log('click', '🔧 取得難度配置', { difficulty });
            const config = this.ModeConfig[difficulty];
            if (!config) {
                Game.Debug.log('click', '❌ 無法獲取模式配置', { difficulty });
                Game.Debug.logUserAction('無法獲取模式配置，跳過點擊處理', { difficulty });
                return;
            }
            
            // 檢查是否啟用點擊移動功能
            Game.Debug.log('click', '🔍 檢查點擊移動功能狀態', { 
                enabled: config.clickToMoveConfig?.enabled,
                config: config.clickToMoveConfig 
            });
            if (!config.clickToMoveConfig?.enabled) {
                Game.Debug.log('click', '⚠️ 點擊移動功能未啟用');
                Game.Debug.logUserAction('點擊移動功能未啟用', { difficulty });
                return;
            }
            
            Game.Debug.logUserAction('處理物品點擊事件', { target: event.target });
            
            // 找到實際的可操作元素
            Game.Debug.log('click', '🔍 尋找可操作元素', { originalTarget: event.target });
            let clickedElement = event.target.closest('.source-item, .placed-item, .placement-slot');
            
            if (!clickedElement) {
                Game.Debug.log('click', '❌ 未找到有效的操作元素');
                Game.Debug.logUserAction('點擊位置不是有效的操作元素');
                return;
            }
            
            Game.Debug.log('click', '✅ 找到可點擊元素', { 
                element: clickedElement, 
                classes: clickedElement.className,
                dataIndex: clickedElement.dataset.index,
                dataIcon: clickedElement.dataset.icon
            });
            Game.Debug.logUserAction('找到可點擊元素', { 
                element: clickedElement, 
                classes: clickedElement.className 
            });
            
            // 判斷點擊的是什麼類型的元素
            if (clickedElement.classList.contains('placed-item')) {
                Game.Debug.log('click', '🔙 處理已放置物品點擊');
                // 點擊已放置的物品 - 嘗試取回
                this.handleClickToReturn(clickedElement, event);
            } else if (clickedElement.classList.contains('source-item')) {
                Game.Debug.log('click', '🎯 處理源區域物品點擊 - 路由到 handleClickToPlace');
                // 點擊源區域的物品 - 嘗試選擇
                this.handleClickToPlace(clickedElement, event);
            } else if (clickedElement.classList.contains('placement-slot')) {
                Game.Debug.log('click', '📍 處理放置槽點擊');
                // 點擊放置槽 - 嘗試放置選中的物品
                this.handleSlotClick(clickedElement, event);
            }
        },

        handleClickToPlace(sourceItem, event) {
            const difficulty = this.state.settings?.difficulty;
            const config = this.ModeConfig[difficulty];
            
            Game.Debug.log('click', '🎯 handleClickToPlace 被呼叫', {
                sourceItem: sourceItem,
                difficulty: difficulty,
                config: config?.clickToMoveConfig
            });
            
            if (!config) {
                Game.Debug.logUserAction('無法獲取配置，跳過點擊放置');
                Game.Debug.error('❌ 無法獲取配置', { difficulty });
                return;
            }
            
            if (!config.clickToMoveConfig?.allowClickToPlace) {
                Game.Debug.logUserAction('此模式不允許點擊放置');
                Game.Debug.error('❌ 此模式不允許點擊放置', { config: config.clickToMoveConfig });
                return;
            }
            
            // 雙擊檢測邏輯
            const currentTime = Date.now();
            const isSameElement = this.state.lastClickedElement === sourceItem;
            const isWithinDoubleClickTime = (currentTime - this.state.lastClickTime) < this.state.doubleClickDelay;
            const timeDiff = currentTime - this.state.lastClickTime;
            
            Game.Debug.log('click', '🔍 雙擊檢測狀態', {
                currentTime: currentTime,
                lastClickTime: this.state.lastClickTime,
                timeDiff: timeDiff,
                doubleClickDelay: this.state.doubleClickDelay,
                isSameElement: isSameElement,
                isWithinDoubleClickTime: isWithinDoubleClickTime,
                lastClickedElement: this.state.lastClickedElement,
                currentElement: sourceItem
            });
            
            if (isSameElement && isWithinDoubleClickTime) {
                // 這是第二次點擊（雙擊），執行放置
                Game.Debug.log('click', '✅ 偵測到雙擊，準備執行放置');
                
                this.state.clickCount = 0;
                this.state.lastClickTime = 0;
                this.state.lastClickedElement = null;
                
                Game.Debug.logUserAction('偵測到雙擊，執行放置', {
                    element: sourceItem,
                    index: sourceItem.dataset.index,
                    icon: sourceItem.dataset.icon
                });
                
                // 清除選擇狀態（如果有的話）
                this.clearItemSelection();
                
                Game.Debug.log('click', '🔄 呼叫 handleItemPlacement', { sourceItem });
                
                // 執行放置邏輯
                this.handleItemPlacement(sourceItem, null, 'MOUSE'); // 明確標示為滑鼠操作
                
                Game.Debug.log('click', '✅ handleItemPlacement 已執行完成');
                
                // 🔧 [修改] 雙擊放置後播放數量語音（與拖曳放置相同）
                // 不需要額外的語音回饋，因為 handleItemPlacement 內部已經處理了數量語音
            } else {
                // 這是第一次點擊，僅選擇物品
                Game.Debug.log('click', '🔵 第一次點擊，選擇物品');
                
                this.state.clickCount = 1;
                this.state.lastClickTime = currentTime;
                this.state.lastClickedElement = sourceItem;
                
                Game.Debug.log('click', '🔄 更新狀態', {
                    clickCount: this.state.clickCount,
                    lastClickTime: this.state.lastClickTime,
                    lastClickedElement: this.state.lastClickedElement
                });
                
                // 清除之前的選擇
                Game.Debug.log('click', '🧹 清除之前的選擇');
                this.clearItemSelection();
                
                // 標記為選中
                Game.Debug.log('click', '🎯 標記物品為選中', { 
                    element: sourceItem,
                    icon: sourceItem.dataset.icon,
                    index: sourceItem.dataset.index 
                });
                sourceItem.classList.add('selected-item');
                this.state.selectedClickItem = {
                    element: sourceItem,
                    index: sourceItem.dataset.index,
                    icon: sourceItem.dataset.icon,
                    type: 'source-item'
                };
                
                Game.Debug.logUserAction('第一次點擊，物品已選擇', {
                    element: sourceItem,
                    index: sourceItem.dataset.index,
                    icon: sourceItem.dataset.icon
                });
                
                // 音效和語音回饋
                Game.Debug.log('click', '🔊 檢查音效回饋', { audioFeedback: config.clickToMoveConfig.audioFeedback });
                if (config.clickToMoveConfig.audioFeedback) {
                    Game.Debug.log('click', '🎵 播放選擇音效');
                    this.Audio.playSound('select', difficulty, config);
                }
                
                // 🔧 [修改] 移除第一次點擊的語音提示，只保留音效
                Game.Debug.log('click', '🎙️ 第一次點擊：不播放語音提示');
                // 移除語音回饋，使用者體驗更流暢
            }
        },

        handleClickToReturn(placedItem, event) {
            const difficulty = this.state.settings?.difficulty;
            const config = this.ModeConfig[difficulty];
            
            if (!config) {
                Game.Debug.logUserAction('無法獲取配置，跳過點擊取回');
                return;
            }
            
            if (!config.clickToMoveConfig?.allowClickToReturn) {
                Game.Debug.logUserAction('此模式不允許點擊取回');
                return;
            }
            
            Game.Debug.logUserAction('嘗試點擊取回物品', { element: placedItem });
            
            // 🔧 [修改] 呼叫取回邏輯，會自動播放數量語音（與拖曳取回相同）
            this.handleItemReturnWithVoice(placedItem);
            
            // 移除額外的語音回饋，因為 handleItemReturnWithVoice 已經處理了數量語音
        },

        handleSlotClick(slot, event) {
            const difficulty = this.state.settings?.difficulty;
            const config = this.ModeConfig[difficulty];
            
            if (!config) {
                Game.Debug.logUserAction('無法獲取配置，跳過槽點擊');
                return;
            }
            
            Game.Debug.log('drag', '📍 [精確放置] 處理槽位點擊', {
                slot: slot,
                filled: slot.classList.contains('filled'),
                hasSelectedItem: !!this.state.selectedClickItem
            });
            
            // 檢查槽位是否已填滿
            if (slot.classList.contains('filled')) {
                Game.Debug.logUserAction('槽位已填滿，無法放置');
                Game.Debug.log('drag', '❌ [精確放置] 槽位已填滿');
                return;
            }
            
            // 🎯 精確放置功能：如果有選中的物品，放置到指定槽位
            if (this.state.selectedClickItem) {
                const sourceItem = this.state.selectedClickItem.element;
                Game.Debug.log('drag', '✅ [精確放置] 執行點擊精確放置', {
                    sourceItem: sourceItem,
                    targetSlot: slot,
                    slotIndex: Array.from(this.elements.placementArea.children).indexOf(slot)
                });
                
                // 清除選中狀態
                this.clearItemSelection();
                
                // 執行精確放置到指定槽位
                this.handleItemPlacement(sourceItem, slot, 'CLICK'); // 傳遞目標槽位
            } else {
                Game.Debug.logUserAction('點擊空槽，但需要先選擇物品', { slot });
                Game.Debug.log('drag', '⚠️ [精確放置] 沒有選中的物品，提供提示');
                
                // 點擊空槽時，提供提示需要先選擇物品
                if (config.clickToMoveConfig.speechFeedback) {
                    this.Speech.speak('clickToPlace', difficulty, config);
                }
            }
        },

        clearItemSelection() {
            Game.Debug.log('click', '🧹 clearItemSelection 被呼叫', {
                hasSelectedItem: !!this.state.selectedClickItem,
                selectedItem: this.state.selectedClickItem
            });
            
            if (this.state.selectedClickItem) {
                Game.Debug.log('click', '🔄 移除選中樣式', {
                    element: this.state.selectedClickItem.element,
                    hasSelectedClass: this.state.selectedClickItem.element.classList.contains('selected-item')
                });
                this.state.selectedClickItem.element.classList.remove('selected-item');
                this.state.selectedClickItem = null;
                Game.Debug.log('click', '✅ 選擇狀態已清除');
                Game.Debug.logUserAction('清除物品選擇狀態');
            } else {
                Game.Debug.log('click', 'ℹ️ 沒有選中的物品需要清除');
            }
        },

        getItemName(icon) {
            // 簡化版本的物品名稱對應
            const itemNames = {
                '🍎': '蘋果', '🍌': '香蕉', '🍇': '葡萄', '🍓': '草莓', '🍊': '橘子',
                '🐶': '小狗', '🐱': '小貓', '🐭': '老鼠', '🐰': '兔子', '🦊': '狐狸',
                '🚗': '汽車', '🚕': '計程車', '🚌': '公車', '🚓': '警車', '🚑': '救護車'
            };
            return itemNames[icon] || '物品';
        },
        
        checkAnswer(userAnswer) {
            this.state.isAnswering = true;
            const isCorrect = userAnswer === this.state.correctAnswer;
            
            Game.Debug.logUserAction('檢查答案', { 
                userAnswer, 
                correctAnswer: this.state.correctAnswer, 
                isCorrect 
            });

            const { difficulty, testMode } = this.state.settings;
            const config = this.ModeConfig[difficulty];

            if (isCorrect) {
                this.state.score += 10;
                this.updateUI();
                
                // 先播放答對音效和動畫
                this.Audio.playSound('correct', difficulty, config);
                this.startFireworksAnimation();
                
                // 記錄當前答案作為下一題的參考（避免重複）
                this.state.lastAnswer = this.state.correctAnswer;
                Game.Debug.logGameFlow('記錄上一題答案', { 
                    lastAnswer: this.state.lastAnswer,
                    nextQuestionWillAvoid: this.state.lastAnswer
                });
                
                // 稍等一下讓音效和動畫播放，然後播放語音
                // 判斷是否為最後一題
                const isLastQuestion = this.state.currentTurn >= this.state.totalTurns;
                const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';

                this.TimerManager.setTimeout(() => {
                    this.Speech.speak('correct', difficulty, config, {
                        answer: this.state.correctAnswer,
                        _suffix: endingText
                    }, () => {
                        // 語音播放完畢後進入下一題
                        this.TimerManager.setTimeout(() => this.startNewTurn(), config.timing.nextQuestionDelay, 'turnTransition');
                    });
                }, 500, 'turnTransition');
                
            } else {
                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                this.Audio.playSound('error', difficulty, config);

                if (testMode === 'retry') {
                    this.Speech.speak('incorrect', difficulty, config, {
                        userAnswer: userAnswer,
                        answer: this.state.correctAnswer
                    }, () => {
                        this.TimerManager.setTimeout(() => this.clearDropBoard(), 500, 'turnTransition');
                    });
                } else {
                    // 單次作答模式：答錯時顯示視覺提示並播放提示語音
                    // 記錄當前答案作為下一題的參考（避免重複）
                    this.state.lastAnswer = this.state.correctAnswer;
                    Game.Debug.logGameFlow('記錄上一題答案（答錯情況）', {
                        lastAnswer: this.state.lastAnswer,
                        nextQuestionWillAvoid: this.state.lastAnswer
                    });

                    // 🔧 [修正] 顯示視覺提示（紅色×和綠色勾）
                    this.showVisualHint(this.state.correctAnswer);

                    // 🔧 [修正] 計算當前數量並生成提示訊息
                    const targetCount = this.state.correctAnswer;
                    let hintMessage;
                    if (userAnswer < targetCount) {
                        const needed = targetCount - userAnswer;
                        hintMessage = `還差${needed}個`;
                    } else {
                        const excess = userAnswer - targetCount;
                        hintMessage = `多${excess}個`;
                    }

                    // 判斷是否為最後一題
                    const isLastQuestion = this.state.currentTurn >= this.state.totalTurns;
                    const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';

                    // 🔧 [修正] 播放提示語音（包含"你答錯了"）
                    this.Speech.speak('incorrectWithHint', difficulty, config, {
                        currentCount: userAnswer,
                        hintMessage: hintMessage,
                        _suffix: endingText
                    }, () => {
                        this.TimerManager.setTimeout(() => this.startNewTurn(), config.timing.nextQuestionDelay, 'turnTransition');
                    });
                }
            }
        },

        clearDropBoard() {
            if (this.elements.itemSourceArea) {
                // 所有模式：讓所有隱藏的物品重新顯示並清除所有狀態
                this.elements.itemSourceArea.querySelectorAll('.source-item').forEach(el => {
                    el.style.display = '';
                    el.classList.remove('used'); // 移除舊的used類別（如果有的話）
                    // 🔧 [修正] 清除點數模式的選中狀態
                    el.classList.remove('selected-item');
                });
            }
            
            // 🔧 [修正] 清除點擊選中的物品狀態
            if (this.state.selectedClickItem) {
                this.state.selectedClickItem.element.classList.remove('selected-item');
                this.state.selectedClickItem = null;
                Game.Debug.log('state', '✅ [錯誤重置] 清除選中的點擊物品狀態');
            }
            
            if (this.elements.placementArea) {
                this.elements.placementArea.innerHTML = '';
                const difficulty = this.state.settings.difficulty;
                if (difficulty === 'easy') {
                    this.elements.placementArea.innerHTML = Array.from({ length: this.state.correctAnswer }, (_, i) =>
                        this.HTMLTemplates.placementSlot(i)
                    ).join('');
                } else if (difficulty === 'normal' || difficulty === 'hard') {
                    // 🔧 [修正] 普通和困難模式不使用槽位，直接清空放置區
                    this.elements.placementArea.innerHTML = '';
                }
                
                // [關鍵修改] 清除錯誤狀態後刷新拖曳系統
                this.TimerManager.setTimeout(() => this.HTML5DragSystem.refresh(this.state.settings.difficulty), 100, 'animation');
                
                // 重置數字顯示
                this.updateCountDisplay(0);
            }
            
            // 🔧 [修正] 清除所有選擇區域的選中狀態（困難模式可能用到）
            if (this.elements.selectionArea) {
                this.elements.selectionArea.querySelectorAll('.selection-object').forEach(el => {
                    el.classList.remove('selected');
                });
            }
            
            // 重置選中項目數組
            this.state.selectedItems = [];
            
            this.state.isAnswering = false;
            Game.Debug.log('state', '✅ [錯誤重置] 清除所有點數和選擇狀態完成');
        },

        // [已廢棄] 舊的拖曳系統已移至HTML5DragSystem

        // [已廢棄] 所有舊的拖曳處理器已移至HTML5DragSystem
        
        // =====================================================
        // 🔧 提示按鈕處理
        // =====================================================
        handleHintClick() {
            const { difficulty } = this.state.settings;
            const config = this.ModeConfig[difficulty];

            Game.Debug.logUserAction('點擊提示按鈕', {
                difficulty,
                currentAnswer: this.state.correctAnswer
            });

            // 播放提示音效
            this.Audio.playSound('select', difficulty, config);

            // 🔧 [修正] 根據難度計算當前已放置的數量
            let currentCount;
            if (difficulty === 'easy') {
                // 簡單模式：計算 .placement-slot.filled
                currentCount = this.elements.placementArea ?
                    this.elements.placementArea.querySelectorAll('.filled').length : 0;
            } else {
                // 普通/困難模式：計算 .placed-item
                currentCount = this.elements.placementArea ?
                    this.elements.placementArea.querySelectorAll('.placed-item').length : 0;
            }
            const targetCount = this.state.correctAnswer;

            // 計算差異並生成提示訊息
            let hintMessage;
            if (currentCount === targetCount) {
                hintMessage = "數量正確";
            } else if (currentCount < targetCount) {
                const needed = targetCount - currentCount;
                hintMessage = `還差${needed}個`;
            } else {
                const excess = currentCount - targetCount;
                hintMessage = `多${excess}個`;
            }

            Game.Debug.logGameFlow('生成提示訊息', {
                currentCount,
                targetCount,
                hintMessage
            });

            // 🔧 [新增] 顯示視覺提示標記（綠色勾勾和紅色×）
            this.showVisualHint(targetCount);

            // 播放語音提示
            this.Speech.speak('hintUsed', difficulty, config, {
                currentCount: currentCount,
                hintMessage: hintMessage
            });
        },

        // 🔧 [新增] 顯示視覺提示標記（綠色勾勾和紅色×）
        showVisualHint(correctAnswer) {
            Game.Debug.logUI('顯示視覺提示標記', 'visual-hint', { correctAnswer });

            // 移除現有的提示標記
            document.querySelectorAll('.hint-marker').forEach(marker => marker.remove());

            // 🔧 [修正] 根據難度獲取正確的元素
            const difficulty = this.state.settings.difficulty;
            let placedElements, filledCount;

            if (difficulty === 'easy') {
                // 簡單模式：使用 placement-slot
                const placementSlots = Array.from(
                    this.elements.placementArea.querySelectorAll('.placement-slot')
                );
                placedElements = placementSlots.filter(slot => slot.classList.contains('filled'));
                filledCount = placedElements.length;
            } else {
                // 普通/困難模式：使用 placed-item
                placedElements = Array.from(
                    this.elements.placementArea.querySelectorAll('.placed-item')
                );
                filledCount = placedElements.length;
            }

            // 獲取來源區的物品（用於不足時的提示）
            const sourceItems = Array.from(
                this.elements.itemSourceArea.querySelectorAll('.source-item:not([style*="display: none"])')
            );

            Game.Debug.logUI('元素狀態統計', 'visual-hint', {
                placedCount: filledCount,
                sourceItems: sourceItems.length,
                correctAnswer: correctAnswer
            });

            if (filledCount < correctAnswer) {
                // 情況1：放置的圖示數量不足
                // 🔧 [修正] 只在來源區的圖示上顯示綠色勾勾，告訴用戶還需要拖曳哪些
                const needMore = correctAnswer - filledCount;
                sourceItems.slice(0, needMore).forEach(item => {
                    this.addHintMarker(item, 'correct');
                });

                Game.Debug.logUI('提示：需要再放置更多圖示', 'visual-hint', {
                    alreadyPlaced: filledCount,
                    needMore: needMore
                });

            } else if (filledCount > correctAnswer) {
                // 情況2：放置的圖示數量過多
                // 🔧 [修正] 在多餘的已放置元素上顯示紅色×（最右邊的多餘元素）
                const tooMany = filledCount - correctAnswer;
                placedElements.slice(-tooMany).forEach(element => {
                    this.addHintMarker(element, 'incorrect');
                });

                Game.Debug.logUI('提示：放置了過多圖示', 'visual-hint', {
                    placed: filledCount,
                    correct: correctAnswer,
                    tooMany: tooMany
                });

            } else {
                // 情況3：放置的圖示數量正確
                // 🔧 [修正] 在所有已放置的元素上顯示綠色勾勾
                placedElements.forEach(element => {
                    this.addHintMarker(element, 'correct');
                });

                Game.Debug.logUI('提示：放置數量正確', 'visual-hint', {
                    placed: filledCount,
                    correct: correctAnswer
                });
            }
        },

        // 🔧 [新增] 添加提示標記到元素上
        addHintMarker(element, type) {
            // 創建標記元素
            const marker = document.createElement('div');
            marker.className = `hint-marker hint-marker-${type}`;

            if (type === 'correct') {
                marker.textContent = '✓';
                marker.style.color = '#28a745';
            } else if (type === 'incorrect') {
                marker.textContent = '✗';
                marker.style.color = '#dc3545';
            }

            // 設置標記樣式
            marker.style.position = 'absolute';
            marker.style.top = '-15px';
            marker.style.left = '50%';
            marker.style.transform = 'translateX(-50%)';
            marker.style.fontSize = '36px';
            marker.style.fontWeight = '900';
            marker.style.webkitTextStroke = '2px currentColor';
            marker.style.textShadow = '0 0 8px white, 0 0 15px white, 0 0 20px white, 2px 2px 4px rgba(0,0,0,0.3)';
            marker.style.zIndex = '1000';
            marker.style.pointerEvents = 'none';
            marker.style.animation = 'hintMarkerAppear 0.3s ease-out';

            // 確保父元素有相對定位
            const currentPosition = window.getComputedStyle(element).position;
            if (currentPosition !== 'relative' && currentPosition !== 'absolute') {
                element.style.position = 'relative';
            }

            // 添加標記到元素
            element.appendChild(marker);

            Game.Debug.logUI('添加提示標記', 'hint-marker', {
                type: type,
                elementClass: element.className
            });
        },
        
        // =====================================================
        // 🔧 工具函數 & 遊戲結束
        // =====================================================
        playCountingVoice(count, config, callback) {
            Game.Debug.logSpeech('播放計數語音', count);
            if (!config.speechFeedback) { 
                if (callback) callback(); 
                return; 
            }
            
            this.Speech.synth.cancel();
            const utterance = new SpeechSynthesisUtterance(count.toString());
            utterance.voice = this.Speech.voice;
            utterance.rate = 1.0;
            utterance.lang = this.Speech.voice?.lang || 'zh-TW';
            
            if (callback) utterance.onend = callback;
            this.Speech.synth.speak(utterance);
        },
        
        // 更新數字顯示
        updateCountDisplay(count) {
            if (this.elements.countDisplay) {
                this.elements.countDisplay.textContent = count;

                // 添加更新動畫
                this.elements.countDisplay.classList.add('updated');
                this.TimerManager.setTimeout(() => {
                    this.elements.countDisplay.classList.remove('updated');
                }, 300, 'animation');
            }
        },
        
        // =====================================================
        // 🎆 煙火動畫系統（與F4統一）
        // =====================================================
        startFireworksAnimation() {
            Game.Debug.log('game', '🎆 開始煙火動畫');
            
            // 🎆 使用canvas-confetti效果（兩波）
            if (window.confetti) {
                Game.Debug.log('game', '🎆 觸發canvas-confetti慶祝效果');
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                
                // 延遲觸發第二波煙火
                this.TimerManager.setTimeout(() => {
                    confetti({
                        particleCount: 100,
                        spread: 60,
                        origin: { y: 0.7 }
                    });
                }, 200, 'animation');
            } else {
                Game.Debug.warn('game', '🎆 canvas-confetti不可用');
            }
        },

        triggerConfetti() {
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7']
                });
            }
        },
        
        endGame() {
            if (this.state.isEndingGame) return;
            this.state.isEndingGame = true;
            AssistClick.deactivate();
            // 🔧 [Bug修復] 清理回合轉換相關計時器
            this.TimerManager.clearByCategory('turnTransition');
            Game.Debug.logGameFlow('遊戲結束', { score: this.state.score });

            const { difficulty } = this.state.settings;
            const config = this.ModeConfig[difficulty];

            // 🎵 播放成功音效
            this.Audio.playSound('success', difficulty, config);

            this.triggerConfetti();

            this.Speech.speak('gameComplete', difficulty, config, {
                score: this.state.score
            });

            const totalQuestions = this.state.totalTurns;
            const correctAnswers = Math.floor(this.state.score / 10);
            const percentage = Math.round((correctAnswers / totalQuestions) * 100);

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'f3', unitName: 'F3 認識數字與數量', series: 'F',
                score: correctAnswers, total: totalQuestions, difficulty,
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

            const app = document.getElementById('app');
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
                                <div class="achievement-item">🎯 認識數字的書寫形式</div>
                                <div class="achievement-item">🔢 學會正確讀出數字</div>
                                <div class="achievement-item">📝 建立數字與名稱的對應</div>
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
            `;

            // 🎁 綁定獎勵系統連結事件（使用 EventManager）
            const rewardLink = app.querySelector('#endgame-reward-link');
            if (rewardLink) {
                this.EventManager.on(rewardLink, 'click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                }, {}, 'gameUI');
            }
        },
        
        updateUI() {
            const progressInfo = document.getElementById('progress-info');

            if (progressInfo) {
                progressInfo.textContent = `第 ${this.state.currentTurn}/${this.state.totalTurns} 題`;
            }
        },
        
        getRandomInt(min, max) { 
            return Math.floor(Math.random() * (max - min + 1)) + min; 
        },

        // 生成與上一題不同的隨機數
        getRandomIntExcluding(min, max, excludeValue) {
            // 如果範圍只有一個數字，直接返回該數字（無法避免重複）
            if (min === max) {
                return min;
            }
            
            // 如果excludeValue不在範圍內，按正常邏輯生成
            if (excludeValue === null || excludeValue < min || excludeValue > max) {
                return this.getRandomInt(min, max);
            }
            
            // 生成不等於excludeValue的隨機數
            let randomNum;
            do {
                randomNum = this.getRandomInt(min, max);
            } while (randomNum === excludeValue && max > min); // 確保有其他選擇時才循環
            
            return randomNum;
        },
        
        getRandomItem(theme) { 
            const items = this.gameData.themes[theme];
            return items[this.getRandomInt(0, items.length - 1)];
        },
        
        // 檢測是否為自訂圖片（base64格式）
        isCustomImage(icon) {
            return typeof icon === 'string' && icon.startsWith('data:image/');
        },
        
        // 渲染圖示（支援自訂圖片）
        renderIcon(icon, className = '', style = '') {
            const isCustom = this.isCustomImage(icon);
            if (isCustom) {
                // 🔧 [修正] 使用響應式大小，讓自訂圖片跟隨容器字體大小
                return `<img src="${icon}" class="custom-icon ${className}" style="width: 1em; height: 1em; object-fit: cover; border-radius: 5px; pointer-events: none; user-select: none; ${style}" alt="自訂圖示">`;
            } else {
                return `<span class="emoji-icon ${className}" style="${style}">${icon}</span>`;
            }
        },
        
        // 獲取物品名稱（支援自訂主題）
        getItemName(icon) {
            // 先檢查是否為自訂圖片
            if (this.isCustomImage(icon)) {
                const customItem = this.state.customItems.find(item => item.icon === icon);
                return customItem ? customItem.name : '自訂物品';
            }
            // 使用預設物品名稱
            return this.gameData.itemNames[icon] || '物品';
        },
        
        shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        },

        // =====================================================
        // 🎨 自訂主題圖片上傳功能 - 配置驅動 (仿f1_object_correspondence)
        // =====================================================
        triggerImageUpload() {
            Game.Debug.logUserAction('觸發圖片上傳');

            // 檢查上傳數量限制（最多8個）
            if (this.state.customItems.length >= 8) {
                alert('最多只能上傳8個圖示！');
                return;
            }

            const modal = document.getElementById('image-preview-modal');
            if (modal) {
                modal.classList.remove('show');
            }

            const fileInput = document.getElementById('custom-image');
            if (fileInput) {
                fileInput.click();
            }
        },

        async handleImageUpload(event) {
            Game.Debug.logUserAction('處理圖片上傳');
            const file = event.target.files[0];

            if (!file) {
                Game.Debug.logUserAction('沒有選擇檔案');
                return;
            }

            // 檢查檔案類型
            if (!file.type.startsWith('image/')) {
                alert('請選擇圖片檔案！');
                event.target.value = '';
                return;
            }

            // 使用壓縮功能處理圖片（不再需要檢查大小，壓縮後會很小）
            try {
                Game.Debug.logUserAction('壓縮圖片中...');
                const compressedImage = await compressImage(file, 200, 0.7);
                this.tempImageData = compressedImage;
                this.showImagePreview(compressedImage, file);
            } catch (err) {
                Game.Debug.error('圖片壓縮失敗:', err);
                alert('圖片處理失敗，請重試！');
            }

            // 清空input以允許重複選擇同一檔案
            event.target.value = '';
        },

        showImagePreview(imageData, file = null) {
            Game.Debug.logUserAction('顯示圖片預覽', { imageSize: imageData.length });
            
            const modal = document.getElementById('image-preview-modal');
            const previewImage = document.getElementById('preview-image');
            const nameInput = document.getElementById('modal-custom-name');
            
            if (modal && previewImage && nameInput) {
                previewImage.src = imageData;
                nameInput.value = '';
                
                
                modal.classList.add('show');
                // 延遲 focus 避免行動裝置鍵盤立即彈出遮住確認按鈕
                this.TimerManager.setTimeout(() => { if (nameInput) nameInput.focus(); }, 300, 'ui');

                // 綁定Enter鍵確認
                nameInput.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        this.confirmAddCustomItem();
                    } else if (e.key === 'Escape') {
                        this.closeImagePreview();
                    }
                };
            }
        },

        confirmAddCustomItem() {
            const nameInput = document.getElementById('modal-custom-name');
            const name = nameInput?.value.trim();
            
            if (!name) {
                alert('請輸入圖示名稱！');
                nameInput?.focus();
                return;
            }
            
            if (name.length > 10) {
                alert('圖示名稱不能超過10個字元！');
                return;
            }
            
            // 檢查名稱是否重複
            const isDuplicate = this.state.customItems.some(item => item.name === name);
            if (isDuplicate) {
                alert('圖示名稱已存在，請使用不同的名稱！');
                return;
            }
            
            Game.Debug.logUserAction('確認新增自訂圖示', { name, imageSize: this.tempImageData?.length });
            
            // 新增到狀態
            const customItem = {
                name: name,
                icon: this.tempImageData,
                id: Date.now()
            };
            
            this.state.customItems.push(customItem);
            
            // 更新自訂主題的圖示陣列
            this.gameData.themes.custom.push(this.tempImageData);
            
            // 不再使用itemNames，改用getItemName方法
            
            // 播放語音回饋（同 F2：使用 speechTemplates.addCustomItem 模板）
            const { difficulty } = this.state.settings;
            const config = this.ModeConfig[difficulty] || this.ModeConfig.normal;
            this.Speech.speak('addCustomItem', difficulty, config, { itemName: name });

            // 關閉模態視窗
            this.closeImagePreview();

            // 🔧 [優化] 只更新自訂主題設定區域，避免閃爍（同 F2）
            this.updateCustomThemeSettings();
        },

        removeCustomItem(index) {
            const item = this.state.customItems[index];
            if (!item) return;
            
            if (confirm(`確定要刪除圖示「${item.name}」嗎？`)) {
                Game.Debug.logUserAction('刪除自訂圖示', { name: item.name, index });
                
                // 從狀態中移除
                this.state.customItems.splice(index, 1);
                
                // 從主題陣列中移除對應的圖片資料
                const imageIndex = this.gameData.themes.custom.indexOf(item.icon);
                if (imageIndex > -1) {
                    this.gameData.themes.custom.splice(imageIndex, 1);
                }
                
                // 播放語音回饋
                const { difficulty } = this.state.settings;
                const config = this.ModeConfig[difficulty] || this.ModeConfig.easy;
                this.Speech.speak('removeCustomItem', difficulty, config, { itemName: item.name });
                
                // 重新載入設定畫面
                this.showSettings();
            }
        },

        closeImagePreview() {
            Game.Debug.logUserAction('關閉圖片預覽');
            
            const modal = document.getElementById('image-preview-modal');
            if (modal) {
                modal.classList.remove('show');
            }
            
            // 清空臨時圖片資料
            this.tempImageData = null;
        },


        // [已廢棄] 舊的TouchDragUtility方法已移至HTML5DragSystem

        // 處理已放置項目拖回
        handlePlacedItemReturn(placedItem) {
            const sourceIndex = placedItem.dataset.sourceIndex;
            if (sourceIndex !== undefined) {
                // 模擬標準拖拽事件
                const syntheticEvent = {
                    target: this.elements.itemSourceArea,
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    dataTransfer: {
                        getData: (type) => {
                            if (type === 'text/plain') return sourceIndex;
                            if (type === 'source') return 'placement-area';
                            return '';
                        }
                    }
                };
                this.handleItemSourceAreaDrop(syntheticEvent);
            }
        },

        // 檢查放置區域完成度
        checkPlacementCompletion() {
            const placedItems = this.elements.placementArea.querySelectorAll('.placed-item');
            const targetCount = this.state.correctAnswer;
            
            Game.Debug.log('game', `🎯 檢查完成度: 已放置=${placedItems.length}, 目標=${targetCount}`);
            
            if (placedItems.length === targetCount) {
                // 自動提交答案
                this.checkAnswer(placedItems.length);
            }
        },

        // 處理放置到特定槽位
        handlePlacementSlotDrop(event, targetSlot) {
            const sourceIndex = parseInt(event.dataTransfer.getData('text/plain'));
            const source = event.dataTransfer.getData('source');
            
            if (source === 'item-source' && !targetSlot.classList.contains('filled')) {
                Game.Debug.log('drag', `🎯 放置項目到特定槽位: index=${sourceIndex}`);
                // 直接放置到指定槽位
                this.moveItemToSpecificSlot(sourceIndex, targetSlot);
            }
            
            // 清除樣式
            targetSlot.classList.remove('drag-over');
            this.elements.placementArea.classList.remove('drag-over');
        },

        // 處理放置到放置區域
        handlePlacementAreaDrop(event) {
            const sourceIndex = parseInt(event.dataTransfer.getData('text/plain'));
            const source = event.dataTransfer.getData('source');
            
            if (source === 'item-source') {
                // 從來源區域拖拽到放置區域
                this.moveItemFromSourceToPlacement(sourceIndex);
            }
            
            // 清除樣式
            this.elements.placementArea.classList.remove('drag-over');
        },

        // 處理放置到來源區域
        handleItemSourceAreaDrop(event) {
            const sourceIndex = parseInt(event.dataTransfer.getData('text/plain'));
            const source = event.dataTransfer.getData('source');
            
            if (source === 'placement-area') {
                // 從放置區域拖拽回來源區域
                this.moveItemFromPlacementToSource(sourceIndex);
            }
            
            // 清除樣式
            this.elements.itemSourceArea.classList.remove('drag-over');
        },

        // 將項目從來源區域移動到放置區域
        moveItemFromSourceToPlacement(sourceIndex) {
            const sourceItems = this.elements.itemSourceArea.querySelectorAll('.source-item');
            const targetItem = Array.from(sourceItems).find(item => 
                parseInt(item.dataset.index) === sourceIndex && item.style.display !== 'none'
            );
            
            if (!targetItem) {
                Game.Debug.error('找不到要移動的來源項目:', sourceIndex);
                return;
            }

            // 隱藏來源項目
            targetItem.style.display = 'none';

            // 在放置區域創建項目
            this.createPlacedItem(sourceIndex, targetItem.innerHTML);
            
            // 播放放置音效
            this.Audio.playSound('select', this.state.settings.difficulty, this.ModeConfig[this.state.settings.difficulty]);

            // 檢查是否完成
            this.checkPlacementCompletion();
        },

        // 將項目移動到特定槽位（精確放置）
        moveItemToSpecificSlot(sourceIndex, targetSlot) {
            const targetItem = this.elements.itemSourceArea.children[sourceIndex];
            if (!targetItem || targetSlot.classList.contains('filled')) return;

            Game.Debug.log('drag', `🎯 精確放置: 項目${sourceIndex} -> 指定槽位`);

            // 標記槽位為已填充
            targetSlot.classList.add('filled');
            
            // 創建放置項目並添加到指定槽位
            const placedItem = document.createElement('div');
            placedItem.className = 'placed-item';
            placedItem.innerHTML = targetItem.innerHTML;
            placedItem.setAttribute('data-source-index', sourceIndex);
            
            // 清空槽位並添加新項目
            targetSlot.innerHTML = '';
            targetSlot.appendChild(placedItem);

            // 隱藏來源項目
            targetItem.style.visibility = 'hidden';
            
            // 播放放置音效
            this.Audio.playSound('select', this.state.settings.difficulty, this.ModeConfig[this.state.settings.difficulty]);

            // 檢查是否完成
            this.checkPlacementCompletion();
        },

        // 將項目從放置區域移動回來源區域
        moveItemFromPlacementToSource(sourceIndex) {
            // 移除放置區域的項目
            const placedItems = this.elements.placementArea.querySelectorAll('.placed-item');
            const targetPlacedItem = Array.from(placedItems).find(item => 
                parseInt(item.dataset.sourceIndex) === sourceIndex
            );
            
            if (targetPlacedItem) {
                targetPlacedItem.remove();
            }

            // 顯示來源區域的項目
            const sourceItems = this.elements.itemSourceArea.querySelectorAll('.source-item');
            const targetSourceItem = Array.from(sourceItems).find(item => 
                parseInt(item.dataset.index) === sourceIndex
            );
            
            if (targetSourceItem) {
                targetSourceItem.style.display = '';
            }
        },

        // 創建已放置的項目
        createPlacedItem(sourceIndex, innerHTML) {
            const placedItem = document.createElement('div');
            placedItem.className = 'placed-item';
            placedItem.dataset.sourceIndex = sourceIndex;
            placedItem.draggable = true;
            placedItem.innerHTML = innerHTML;
            
            this.elements.placementArea.appendChild(placedItem);
        },

        // =====================================================================
        // HTML5 拖曳系統 - 整合版本 (參考F1架構)
        // =====================================================================
        HTML5DragSystem: {
            isInitialized: false,
            dragState: {},

            initialize(difficulty) {
                if (this.isInitialized) this.cleanup();
                Game.Debug.logGameFlow('初始化拖曳系統', { difficulty });

                const app = document.getElementById('app');
                if (!app) return;

                // 綁定桌面拖曳事件 (使用事件委派 + EventManager)
                Game.EventManager.on(app, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(app, 'dragend', this.handleDragEnd.bind(this), {}, 'dragSystem');
                Game.EventManager.on(app, 'dragover', this.handleDragOver.bind(this), {}, 'dragSystem');
                Game.EventManager.on(app, 'dragenter', this.handleDragEnter.bind(this), {}, 'dragSystem');
                Game.EventManager.on(app, 'dragleave', this.handleDragLeave.bind(this), {}, 'dragSystem');
                Game.EventManager.on(app, 'drop', this.handleDrop.bind(this), {}, 'dragSystem');

                this.setupTouchDragSupport(difficulty);
                this.isInitialized = true;
            },

            /**
             * 設置來源區域拖曳
             */
            setupSourceArea() {
                const sourceArea = document.querySelector('.item-source-area');
                if (!sourceArea) {
                    Game.Debug.warn('init', '⚠️ 找不到來源區域容器');
                    return;
                }

                // 使用事件委派 + EventManager
                Game.EventManager.on(sourceArea, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(sourceArea, 'dragend', this.handleDragEnd.bind(this), {}, 'dragSystem');

                // 設置所有可拖曳項目
                this.updateDraggableItems(sourceArea);

                Game.Debug.log('init', '✅ 來源區域拖曳設置完成');
            },

            /**
             * 設置放置區域
             */
            setupDropAreas(difficulty) {
                let dropSelectors = [];
                
                // [修正] 根據F3實際布局設定
                switch (difficulty) {
                    case 'easy':
                        // 簡單模式：使用小框
                        dropSelectors = ['.placement-slot'];
                        break;
                    case 'normal':
                    case 'hard':
                        // 普通/困難模式：使用大框
                        dropSelectors = ['.placement-area'];
                        break;
                }

                dropSelectors.forEach(selector => {
                    const dropZones = document.querySelectorAll(selector);
                    dropZones.forEach(zone => {
                        this.setupSingleDropZone(zone);
                    });
                });

                Game.Debug.log('init', '✅ 放置區域設置完成', { difficulty, zones: dropSelectors });
            },

            /**
             * 設置單個放置區域
             */
            setupSingleDropZone(zone) {
                Game.EventManager.on(zone, 'dragover', this.handleDragOver.bind(this), {}, 'dragSystem');
                Game.EventManager.on(zone, 'drop', this.handleDrop.bind(this), {}, 'dragSystem');
                Game.EventManager.on(zone, 'dragenter', this.handleDragEnter.bind(this), {}, 'dragSystem');
                Game.EventManager.on(zone, 'dragleave', this.handleDragLeave.bind(this), {}, 'dragSystem');
            },

            /**
             * 更新項目的可拖曳狀態
             */
            updateDraggableItems(container) {
                const items = container.querySelectorAll('.source-item:not([style*="display: none"])');
                items.forEach(item => {
                    item.draggable = true;
                    item.setAttribute('data-draggable', 'true');
                });
            },

            /**
             * 設置 TouchDragUtility 手機支援
             */
            setupTouchDragSupport(difficulty) {
                Game.Debug.logMobileDrag('系統初始化開始', null, null, { difficulty });
                
                if (!window.TouchDragUtility) {
                    Game.Debug.logMobileDrag('錯誤：TouchDragUtility未載入', null, null);
                    return;
                }
                
                window.TouchDragUtility.cleanupAll();
                Game.Debug.logMobileDrag('清理舊的拖曳註冊', null, null);

                const app = document.getElementById('app');
                if (!app) {
                    Game.Debug.logMobileDrag('錯誤：找不到app容器', null, null);
                    return;
                }

                // 🔧 [關鍵修正] 確保選擇器包含所有可見的來源物品和已放置的圖示
                const draggableSelector = '.source-item:not([style*="display: none"]), .placement-slot.filled, .placed-item';
                Game.Debug.logMobileDrag('註冊可拖曳元素', app, null, {
                    difficulty,
                    selector: draggableSelector
                });
                
                // 🔍 詳細檢查可拖曳元素狀況
                const draggableElements = app.querySelectorAll(draggableSelector);
                const allSourceItems = app.querySelectorAll('.source-item');
                const visibleSourceItems = app.querySelectorAll('.source-item:not([style*="display: none"])');
                const filledSlots = app.querySelectorAll('.placement-slot.filled');
                
                Game.Debug.logMobileDrag('找到可拖曳元素', null, null, { 
                    difficulty,
                    totalDraggable: draggableElements.length,
                    allSourceItems: allSourceItems.length,
                    visibleSourceItems: visibleSourceItems.length,
                    filledSlots: filledSlots.length,
                    elements: Array.from(draggableElements).map(el => ({
                        className: el.className,
                        isVisible: el.style.display !== 'none',
                        parentClass: el.parentElement?.className
                    }))
                });
                
                // 🚨 如果沒有找到可見的來源物品，發出警告
                if (visibleSourceItems.length === 0 && allSourceItems.length > 0) {
                    Game.Debug.logMobileDrag('⚠️ 警告：所有來源物品都被隱藏', null, null, {
                        difficulty,
                        totalItems: allSourceItems.length,
                        itemStates: Array.from(allSourceItems).map(el => ({
                            className: el.className,
                            display: el.style.display,
                            innerHTML: el.innerHTML.substring(0, 50)
                        }))
                    });
                }
                
                window.TouchDragUtility.registerDraggable(app, draggableSelector, {
                    onDragStart: (element) => {
                        Game.Debug.logMobileDrag('拖曳開始', element, null, { 
                            difficulty,
                            originalParent: element.parentElement?.className,
                            elementClass: element.className,
                            elementId: element.dataset?.index || element.dataset?.id
                        });
                        this.dragState.dragElement = element;
                        this.dragState.difficulty = difficulty; // 記錄難度模式
                        return true;
                    },
                    onDrop: (dragElement, dropZone, event) => {
                        Game.Debug.logMobileDrag('拖曳放置', dragElement, event, { 
                            difficulty,
                            dropZone: dropZone?.className,
                            dragElementClass: dragElement?.className
                        });
                        
                        // 🎯 根據難度模式使用不同的放置目標選擇器
                        let dropZoneSelectors;
                        if (difficulty === 'easy') {
                            // 簡單模式：優先使用小放置槽
                            dropZoneSelectors = ['.placement-slot:not(.filled)', '.placement-area', '.item-source-area'];
                        } else if (difficulty === 'normal') {
                            // 普通模式：使用大放置區域（精確匹配組合類別）
                            dropZoneSelectors = ['.placement-area.normal-placement', '.placement-slot:not(.filled)', '.placement-area', '.item-source-area'];
                        } else if (difficulty === 'hard') {
                            // 困難模式：使用大放置區域（精確匹配組合類別）
                            dropZoneSelectors = ['.placement-area.hard-placement', '.placement-slot:not(.filled)', '.placement-area', '.item-source-area'];
                        } else {
                            // 默認情況
                            dropZoneSelectors = ['.placement-area', '.item-source-area'];
                        }
                        
                        // 🔧 [調試] 添加詳細的選擇器檢查日誌
                        Game.Debug.logMobileDrag('調用 getPreciseDropZone', dragElement, event, {
                            difficulty,
                            dropZoneSelectors,
                            currentDropZoneClass: dropZone?.className
                        });
                        
                        let finalDropZone = this.getPreciseDropZone(event, dropZoneSelectors);
                        
                        // 💡 [FIX] Fallback logic: If the precise check fails,
                        // trust the dropZone detected during the drag-over event.
                        if (!finalDropZone && dropZone && this.validateDrop(dragElement, dropZone)) {
                            Game.Debug.logMobileDrag('精確檢測失敗，使用備用放置目標', dropZone, event);
                            finalDropZone = dropZone;
                        }
                        
                        if (finalDropZone) {
                            Game.Debug.logMobileDrag('精確放置目標確認', finalDropZone, event, {
                                difficulty,
                                finalDropZoneClass: finalDropZone.className
                            });
                            this.executeDrop(dragElement, finalDropZone);
                        } else {
                            Game.Debug.logMobileDrag('⚠️ 找不到有效放置目標', dragElement, event, {
                                difficulty,
                                availableSelectors: dropZoneSelectors,
                                attemptedDropZone: dropZone?.className
                            });
                        }
                    },
                    onDragEnd: () => { 
                        Game.Debug.logMobileDrag('拖曳結束', null, null, { difficulty });
                        this.dragState = {}; 
                    }
                });

                // [關鍵修正] 傳入實際的 DOM 元素，而不是選擇器字串
                const placementArea = document.querySelector('.placement-area');
                const sourceArea = document.querySelector('.item-source-area');
                
                Game.Debug.logMobileDrag('檢查放置區域', null, null, { 
                    difficulty,
                    placementArea: !!placementArea, 
                    sourceArea: !!sourceArea,
                    placementClass: placementArea?.className,
                    sourceClass: sourceArea?.className
                });
                
                // 根據難度決定註冊哪些放置區域
                if (difficulty === 'easy') {
                    // 簡單模式：只註冊小槽位，不註冊大框
                    const placementSlots = document.querySelectorAll('.placement-slot');
                    placementSlots.forEach(slot => {
                        window.TouchDragUtility.registerDropZone(slot, (el, zone) => {
                            const result = this.validateDrop(el, zone);
                            Game.Debug.logMobileDrag('placementSlot驗證結果', el, null, { valid: result, zone: zone?.className });
                            return result;
                        });
                    });
                    Game.Debug.logMobileDrag('簡單模式：註冊小槽位', null, null, { 
                        difficulty,
                        slots: placementSlots.length,
                        slotsRegistered: true
                    });
                } else {
                    // 普通/困難模式：註冊整個大框
                    if (placementArea) {
                        window.TouchDragUtility.registerDropZone(placementArea, (el, zone) => {
                            const result = this.validateDrop(el, zone);
                            Game.Debug.logMobileDrag('placementArea驗證結果', el, null, { valid: result, zone: zone?.className });
                            return result;
                        });
                    }
                    Game.Debug.logMobileDrag('普通/困難模式：註冊大框', null, null, {
                        difficulty,
                        placementAreaRegistered: !!placementArea
                    });
                }
                if (sourceArea) {
                    window.TouchDragUtility.registerDropZone(sourceArea, (el, zone) => {
                        const result = this.validateDrop(el, zone);
                        Game.Debug.logMobileDrag('sourceArea驗證結果', el, null, { valid: result, zone: zone?.className });
                        return result;
                    });
                }
                Game.Debug.logGameFlow('觸控拖曳註冊完成');
            },

            // =================================================================
            // 拖曳事件處理
            // =================================================================

            /**
             * 手機拖曳開始
             */
            handleTouchDragStart(element, event) {
                this.dragState.dragElement = element;
                this.dragState.originalParent = element.parentElement;
                Game.Debug.log('touch', '📱 開始拖拽:', element.dataset.index || element.className);
                return true;
            },

            /**
             * 手機放置操作
             */
            handleTouchDrop(draggedElement, dropZone, event) {
                // [關鍵修正] 精確定位觸控放開時的放置目標
                let finalDropZone = dropZone;
                
                if (event && event.changedTouches && event.changedTouches.length > 0) {
                    const touch = event.changedTouches[0];
                    const x = touch.clientX;
                    const y = touch.clientY;

                    // 暫時隱藏拖曳的複製元素
                    const clone = document.querySelector('.touch-drag-clone');
                    if (clone) clone.style.display = 'none';

                    // 使用 elementsFromPoint 取得觸控點下的所有元素
                    const elementsUnderTouch = document.elementsFromPoint(x, y);
                    
                    // 恢復顯示複製元素
                    if (clone) clone.style.display = '';
                    
                    // [修正] 根據F3實際布局設定優先級
                    // 簡單模式：小框優先；普通/困難模式：大框優先
                    let preferredTargets;
                    const currentDifficulty = Game.state?.settings?.difficulty;
                    if (currentDifficulty === 'easy') {
                        preferredTargets = ['.placement-slot:not(.filled)', '.placement-area', '.item-source-area'];
                    } else if (currentDifficulty === 'normal') {
                        preferredTargets = ['.placement-area.normal-placement', '.placement-slot:not(.filled)', '.placement-area', '.item-source-area'];
                    } else if (currentDifficulty === 'hard') {
                        preferredTargets = ['.placement-area.hard-placement', '.placement-slot:not(.filled)', '.placement-area', '.item-source-area'];
                    } else {
                        preferredTargets = ['.placement-area', '.item-source-area'];
                    }
                    
                    for (const selector of preferredTargets) {
                        const preciseTarget = elementsUnderTouch.find(el => el.matches(selector));
                        if (preciseTarget) {
                            finalDropZone = preciseTarget;
                            Game.Debug.log('touch', `📱 精確定位到放置目標: ${finalDropZone.className.split(' ')[0]}`);
                            break;
                        }
                    }
                }

                if (this.validateDrop(draggedElement, finalDropZone)) {
                    this.executeDrop(draggedElement, finalDropZone);
                }
            },

            /**
             * 驗證放置是否有效
             */
            validateDrop(dragElement, dropZone) {
                if (!dragElement || !dropZone) {
                    Game.Debug.logPlacementDrop('驗證失敗：缺少拖曳元素或放置目標', 'validation-error', {
                        hasDragElement: !!dragElement,
                        hasDropZone: !!dropZone
                    });
                    return false;
                }

                const isFromSource = dragElement.classList.contains('source-item');
                const isFromPlacement = dragElement.classList.contains('placement-slot') && dragElement.classList.contains('filled');
                const isFromPlacedItem = dragElement.classList.contains('placed-item'); // 🔧 [新增] 支援普通/困難模式的已放置圖示
                const isToPlacement = dropZone.classList.contains('placement-area') || dropZone.classList.contains('placement-slot');
                const isToSource = dropZone.classList.contains('item-source-area');

                const itemInfo = {
                    dragClass: dragElement.className,
                    dropClass: dropZone.className,
                    isFromSource,
                    isFromPlacement,
                    isFromPlacedItem,
                    isToPlacement,
                    isToSource
                };

                if (isFromSource && isToPlacement) {
                    Game.Debug.logPlacementDrop('驗證成功：來源物品→放置區域', 'validation-success', itemInfo);
                    return true;
                }
                if (isFromPlacement && isToSource) {
                    Game.Debug.logPlacementDrop('驗證成功：放置物品→來源區域（簡單模式）', 'validation-success', itemInfo);
                    return true;
                }
                if (isFromPlacedItem && isToSource) {
                    Game.Debug.logPlacementDrop('驗證成功：已放置圖示→來源區域（普通/困難模式）', 'validation-success', itemInfo);
                    return true;
                }

                Game.Debug.logPlacementDrop('驗證失敗：不符合拖放規則', 'validation-failed', itemInfo);
                return false;
            },

            /**
             * 執行放置操作
             */
            executeDrop(dragElement, dropZone) {
                if (!this.validateDrop(dragElement, dropZone)) return;

                // 新增：檢測並記錄放置框類型
                const itemInfo = {
                    itemClass: dragElement.className,
                    itemIndex: dragElement.dataset.index || dragElement.dataset.sourceIndex,
                    dropZoneClass: dropZone.className
                };

                if (dropZone.classList.contains('placement-slot')) {
                    Game.Debug.logPlacementDrop('手機端：物品放入小放置槽', 'placement-slot', itemInfo);
                } else if (dropZone.classList.contains('placement-area')) {
                    Game.Debug.logPlacementDrop('手機端：物品放入主放置區', 'placement-area', itemInfo);
                } else if (dropZone.classList.contains('item-source-area')) {
                    Game.Debug.logPlacementDrop('手機端：物品返回來源區', 'item-source-area', itemInfo);
                } else {
                    Game.Debug.logPlacementDrop('手機端：物品放入未知區域', 'unknown', itemInfo);
                }


                if (dragElement.classList.contains('source-item')) {
                    // 🎯 精確放置功能：如果拖到特定的placement-slot，傳遞目標槽位
                    let targetSlot = null;
                    if (dropZone.classList.contains('placement-slot') && !dropZone.classList.contains('filled')) {
                        targetSlot = dropZone;
                        Game.Debug.logPlacementDrop('手機端：精確放置到指定槽位', 'placement-slot', {
                            targetSlotIndex: Array.from(Game.elements.placementArea.children).indexOf(targetSlot)
                        });
                    }
                    Game.handleItemPlacement(dragElement, targetSlot, 'TOUCH'); // 傳遞目標槽位和操作類型
                } else if (dragElement.classList.contains('placement-slot')) {
                    // 如果是從放置區拖回（簡單模式），直接呼叫返回邏輯
                    Game.handleItemReturn(dragElement);
                } else if (dragElement.classList.contains('placed-item')) {
                    // 🔧 [新增] 如果是已放置的圖示拖回（普通/困難模式），直接呼叫返回邏輯
                    Game.Debug.logPlacementDrop('手機端：已放置圖示返回來源區', 'placed-item-return', itemInfo);
                    Game.handleItemReturn(dragElement);
                }
            },

            // 獲取精準的觸控放置目標
            getPreciseDropZone(event, validSelectors) {
                if (!event?.changedTouches?.length) return null;
                const touch = event.changedTouches[0];
                const clone = document.querySelector('.touch-drag-clone');
                
                if (clone) clone.style.display = 'none';
                const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
                if (clone) clone.style.display = '';

                // 依序檢查每個選擇器，找到第一個匹配的元素
                for (const selector of validSelectors) {
                    const matchedElement = elements.find(el => {
                        try {
                            return el.matches && el.matches(selector);
                        } catch (e) {
                            Game.Debug.logMobileDrag('選擇器匹配錯誤', null, null, { selector, error: e.message });
                            return false;
                        }
                    });
                    if (matchedElement) {
                        Game.Debug.logMobileDrag('找到匹配的放置目標', matchedElement, null, { 
                            selector,
                            elementClass: matchedElement.className,
                            isFilled: matchedElement.classList.contains('filled')
                        });
                        return matchedElement;
                    }
                }
                
                // 🔧 [詳細調試] 檢查每個選擇器的匹配情況
                const detailedDebug = [];
                for (const selector of validSelectors) {
                    const matchingElements = elements.filter(el => {
                        try {
                            return el.matches && el.matches(selector);
                        } catch (e) {
                            return false;
                        }
                    });
                    detailedDebug.push({
                        selector,
                        matchCount: matchingElements.length,
                        matchingClasses: matchingElements.map(el => el.className)
                    });
                }
                
                Game.Debug.logMobileDrag('未找到匹配的放置目標', null, null, { 
                    validSelectors,
                    elementsFound: elements.map(el => el.className).filter(Boolean),
                    detailedDebug
                });
                return null;
            },

            /**
             * 標準拖曳事件處理器（保留原有功能）
             */
            handleDragStart(event) {
                // [關鍵修正] 將 .placement-slot.filled 和 .placed-item 加入可拖曳物件列表
                if (!event.target || !event.target.closest) return;
                const element = event.target.closest('.source-item, .placement-slot.filled, .placed-item');
                if (!element) return;
                this.dragState.dragElement = element;
                event.dataTransfer.setData('text/plain', element.dataset.index || element.dataset.sourceIndex);
                Game.TimerManager.setTimeout(() => element.style.opacity = '0.5', 0, 'dragSystem');

                // 🆕 建立去背拖曳預覽（桌面端）
                const _dragImg = element.querySelector('img');
                const _ghost = _dragImg ? _dragImg.cloneNode(true) : document.createElement('span');
                if (!_dragImg) {
                    const _emojiEl = element.querySelector('.emoji-icon') || element;
                    _ghost.textContent = _emojiEl.textContent.trim();
                    _ghost.style.fontSize = window.getComputedStyle(element).fontSize;
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
                if (event.dataTransfer && typeof event.dataTransfer.setDragImage === 'function') {
                    event.dataTransfer.setDragImage(_ghost, (_ghost.offsetWidth || 30) / 2, (_ghost.offsetHeight || 30) / 2);
                }
                Game.TimerManager.setTimeout(() => _ghost.remove(), 0, 'dragSystem');
            },

            handleDragEnd() {
                if (this.dragState.dragElement) {
                    this.dragState.dragElement.style.opacity = '1';
                }
                document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
                this.dragState = {};
            },

            handleDragOver(event) { event.preventDefault(); },

            handleDrop(event) {
                event.preventDefault();
                
                // [關鍵修正] 根據難度模式確定允許的放置目標
                const currentDifficulty = Game.state?.settings?.difficulty;
                let dropZoneSelector;
                
                if (currentDifficulty === 'easy') {
                    // 簡單模式：只允許放置到小槽位，不允許大框
                    dropZoneSelector = '.placement-slot:not(.filled), .item-source-area';
                } else {
                    // 普通/困難模式：優先大放置區域
                    dropZoneSelector = '.placement-area, .item-source-area, .placement-slot:not(.filled)';
                }
                
                const dropZone = event.target.closest(dropZoneSelector);
                if (dropZone) {
                    dropZone.classList.remove('drag-over');
                    if (this.validateDrop(this.dragState.dragElement, dropZone)) {
                        // 🎯 HTML5精確放置功能：如果拖到特定的placement-slot，傳遞目標槽位
                        if (this.dragState.dragElement.classList.contains('source-item')) {
                            let targetSlot = null;
                            if (dropZone.classList.contains('placement-slot') && !dropZone.classList.contains('filled')) {
                                targetSlot = dropZone;
                                Game.Debug.logPlacementDrop('HTML5：精確放置到指定槽位', 'placement-slot', {
                                    targetSlotIndex: Array.from(Game.elements.placementArea.children).indexOf(targetSlot)
                                });
                            }
                            Game.handleItemPlacement(this.dragState.dragElement, targetSlot, 'MOUSE'); // 傳遞目標槽位和操作類型
                        } else {
                            this.executeDrop(this.dragState.dragElement, dropZone);
                        }
                    }
                }
            },

            handleDragEnter(event) {
                const currentDifficulty = Game.state?.settings?.difficulty;
                let selector;
                
                if (currentDifficulty === 'easy') {
                    // 簡單模式：只允許小槽位和來源區域
                    selector = '.placement-slot, .item-source-area';
                } else {
                    // 普通/困難模式：允許大框和來源區域
                    selector = '.placement-area, .item-source-area';
                }
                
                const dropZone = event.target.closest(selector);
                if (dropZone && this.validateDrop(this.dragState.dragElement, dropZone)) {
                    dropZone.classList.add('drag-over');
                }
            },

            handleDragLeave(event) {
                const currentDifficulty = Game.state?.settings?.difficulty;
                let selector;
                
                if (currentDifficulty === 'easy') {
                    // 簡單模式：只處理小槽位和來源區域
                    selector = '.placement-slot, .item-source-area';
                } else {
                    // 普通/困難模式：處理大框和來源區域
                    selector = '.placement-area, .item-source-area';
                }
                
                event.target.closest(selector)?.classList.remove('drag-over');
            },

            refresh(difficulty) {
                Game.Debug.logMobileDrag('拖曳系統刷新', null, null, { 
                    difficulty,
                    isInitialized: this.isInitialized
                });
                
                if (!this.isInitialized) {
                    Game.Debug.logMobileDrag('首次初始化拖曳系統', null, null, { difficulty });
                    this.initialize(difficulty);
                } else {
                    Game.Debug.logMobileDrag('重新設置觸控拖曳支援', null, null, { difficulty });
                    this.setupTouchDragSupport(difficulty);
                }
                
                // 🔍 刷新後立即檢查元素狀態
                Game.TimerManager.setTimeout(() => {
                    const allSourceItems = document.querySelectorAll('.source-item');
                    const visibleSourceItems = document.querySelectorAll('.source-item:not([style*="display: none"])');

                    Game.Debug.logMobileDrag('刷新後元素狀態檢查', null, null, {
                        difficulty,
                        totalSourceItems: allSourceItems.length,
                        visibleSourceItems: visibleSourceItems.length,
                        itemDetails: Array.from(allSourceItems).map(item => ({
                            className: item.className,
                            display: item.style.display,
                            draggable: item.draggable,
                            hasClickableClass: item.classList.contains('clickable-item'),
                            innerHTML: item.innerHTML.substring(0, 30)
                        }))
                    });
                }, 50, 'animation');
            },

            cleanup() {
                if (!this.isInitialized) return;
                Game.Debug.logGameFlow('清理拖曳系統');
                // 🔧 [Bug修復] 清理拖曳相關事件監聽器和計時器
                Game.EventManager.removeByCategory('dragSystem');
                Game.TimerManager.clearByCategory('animation');
                if (window.TouchDragUtility?.cleanupAll) {
                    window.TouchDragUtility.cleanupAll();
                }
                this.isInitialized = false;
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
            const sourceItems = Array.from(document.querySelectorAll('.source-item:not([style*="display: none"])'));
            const emptySlots = Array.from(document.querySelectorAll('.placement-slot:not(.filled):not(.occupied)'));
            if (!sourceItems.length || !emptySlots.length) return;
            const item = sourceItems[0];
            const slot = emptySlots[0];
            this._queue = [{ target: item, action: () => Game.handleItemPlacement(item, slot, 'MOUSE') }];
            this._step = 0;
            this._highlight(item);
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
                    if (this._enabled && document.querySelector('.source-item')) {
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