/**
 * @file f2_rote_and_rational_counting.js
 * @description F2 數量與點數 - 配置驅動版本
 * @unit F2 - 數量與點數
 * @version 2.2.0 - 配置驅動 + 詳細Debug系統
 * @lastModified 2025.08.30 下午1:58
 */

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
        // Game.Debug.FLAGS.ui = true;       // 只開啟 UI 相關
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
                question: false,   // 題目生成
                state: false,      // 狀態變更
                animation: false,  // 動畫效果
                upload: false,     // 圖片上傳
                game: false,       // 遊戲流程
                user: false,       // 使用者行為
                error: true        // 錯誤訊息（預設開啟）
            },

            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[F2-${category}]`, ...args);
                }
            },

            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[F2-${category}]`, ...args);
                }
            },

            error(...args) {
                // 錯誤訊息始終顯示（除非明確關閉 error FLAG）
                if (this.FLAGS.error) {
                    console.error('[F2-ERROR]', ...args);
                }
            },

            // =====================================================
            // 向後相容包裝方法（舊版 API 支援）
            // =====================================================
            logError(error, context = '') {
                this.error(context, error);
            },

            logGameFlow(action, data = null) {
                this.log('game', action, data || '');
            },

            logAudio(action, soundType, config) {
                this.log('audio', `${action} - 音效類型: ${soundType}`, {
                    audioFeedback: config?.audioFeedback,
                    difficulty: config?.difficulty || 'unknown'
                });
            },

            logSpeech(action, templateKey, difficulty, data = null) {
                this.log('speech', `${action} - 模板: ${templateKey} - 難度: ${difficulty}`, data || '');
            },

            logConfig(difficulty, configData) {
                this.log('init', `載入${difficulty}模式配置`, configData);
            },

            logUserAction(action, data = null) {
                this.log('user', action, data || '');
            },

            logMobileDrag(phase, element, event, data = null) {
                if (!this.FLAGS.all && !this.FLAGS.drag && !this.FLAGS.touch) return;
                const elementInfo = {
                    tagName: element?.tagName,
                    className: element?.className,
                    id: element?.id,
                    dataIndex: element?.dataset?.index
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
                const eventInfo = {
                    type: eventType,
                    target: element?.className || 'unknown',
                    touches: event?.touches?.length || 0,
                    changedTouches: event?.changedTouches?.length || 0
                };
                this.log('touch', `👆${eventType}`, eventInfo);
            },

            logPlacementDrop(action, zoneType, itemInfo = null) {
                this.log('drag', `📦${action} - 區域: ${zoneType}`, itemInfo || '');
            },

            logPerformance(action, startTime = null) {
                // 效能監控暫時停用（可透過 FLAGS.init 開啟）
            },

            logUI(action, element, data = null) {
                this.log('ui', `${action} - 元素: ${element}`, data || '');
            },

            logState(action, stateBefore = null, stateAfter = null) {
                this.log('state', action, { before: stateBefore, after: stateAfter });
            },

            logTemplate(templateName, params = null) {
                this.log('ui', `渲染模板: ${templateName}`, params || '');
            },

            group(groupName, callback) {
                // group 方法停用，直接執行回調
                callback && callback();
            }
        },
        // =====================================================
        // 🎯 配置驅動核心：ModeConfig
        // =====================================================
        ModeConfig: {
            easy: {
                triggerType: 'manual',         // 手動點擊觸發
                audioFeedback: true,           // 有音效
                speechFeedback: true,          // 有語音反饋
                showNumbers: true,             // 顯示數字覆蓋層
                autoShowTotal: true,           // 自動顯示總數
                requireAnswer: false,          // 不需要回答選擇題
                allowRetry: false,             // 簡單模式不適用重試
                label: '簡單',
                description: '點擊圖示播放語音和數字，完成後顯示總數',
                
                // 語音模板配置
                speechTemplates: {
                    initialInstruction: "請數一數，總共有幾個",
                    instruction: "請鼠鼠看有幾個",
                    itemCount: "{count}",
                    totalComplete: "數完了，總共有 {total} 個",
                    encouragement: "你真棒！",
                    addCustomItem: "已新增自訂圖示：{itemName}",
                    removeCustomItem: "已移除圖示：{itemName}"
                },
                
                // 文字模板配置
                textTemplates: {
                    progressText: "第 {current} / {total} 題",
                    correctFeedback: "數完了，總共有 {answer} 個",
                    incorrectFeedback: "答錯了，再試一次！",
                    incorrectWithAnswer: "答錯了，正確答案是 {answer}",
                    gameComplete: "🎉 測驗結束 🎉",
                    excellentPerformance: "表現優異！",
                    goodPerformance: "表現良好！",
                    needImprovement: "要多加練習喔！"
                },
                
                // CSS 類名配置
                cssClasses: {
                    item: "item counting-item-easy",
                    itemChecked: "checked",
                    itemOverlay: "item-number-overlay",
                    feedbackCorrect: "feedback-bubble correct",
                    feedbackIncorrect: "feedback-bubble incorrect",
                    optionsGrid: "products-grid horizontal-layout",
                    optionButton: "payment-btn easy-mode-btn"
                },
                
                // 時間配置
                timing: {
                    speechDelay: 300,
                    nextQuestionDelay: 2000,
                    numberDisplayDelay: 100
                },
                
                // UI配置
                uiElements: {
                    showOptionsArea: false,
                    itemNumberOverlay: true,
                    totalDialog: true
                },
                
                // 動畫配置
                animations: {
                    fadeInDuration: 300,
                    numberPopDuration: 200
                },
                
                // 🔧 [新增] 跨平台拖曳配置
                touchDragConfig: {
                    enabled: true,
                    enableClickToDrag: true,
                    enableSorting: true,
                    touchSensitivity: 10,
                    crossPlatformSupport: true
                }
            },
            
            normal: {
                triggerType: 'manual',         // 手動點擊觸發
                audioFeedback: true,           // 有音效
                speechFeedback: true,          // 有語音反饋
                showNumbers: true,             // 顯示數字覆蓋層
                autoShowTotal: false,          // 不自動顯示總數
                requireAnswer: true,           // 需要回答選擇題
                allowRetry: true,              // 允許重試(根據testMode設定)
                optionsCount: 3,               // 3個選項
                label: '普通',
                description: '同簡單模式，但最後需要選擇正確答案',
                
                // 語音模板配置
                speechTemplates: {
                    initialInstruction: "請數一數，總共有幾個",
                    instruction: "請點擊圖案開始數數",
                    itemCount: "{count}",
                    chooseAnswer: "請選擇正確的答案",
                    correct: "答對了！正確答案是 {answer}",
                    incorrect: "答錯了，再試一次！",
                    incorrectWithAnswer: "答錯了，正確答案是 {answer}",
                    addCustomItem: "已新增自訂圖示：{itemName}",
                    removeCustomItem: "已移除圖示：{itemName}"
                },
                
                // 文字模板配置
                textTemplates: {
                    progressText: "第 {current} / {total} 題",
                    correctFeedback: "答對了！正確答案是 {answer}",
                    incorrectFeedback: "答錯了，再試一次！",
                    incorrectWithAnswer: "答錯了，正確答案是 {answer}",
                    gameComplete: "🎉 測驗結束 🎉",
                    excellentPerformance: "表現優異！",
                    goodPerformance: "表現良好！",
                    needImprovement: "要多加練習喔！"
                },
                
                // CSS 類名配置
                cssClasses: {
                    item: "item counting-item-normal",
                    itemChecked: "checked",
                    itemOverlay: "item-number-overlay",
                    feedbackCorrect: "feedback-bubble correct",
                    feedbackIncorrect: "feedback-bubble incorrect",
                    optionsGrid: "products-grid horizontal-layout",
                    optionButton: "payment-btn normal-mode-btn"
                },
                
                // 時間配置
                timing: {
                    speechDelay: 300,
                    nextQuestionDelay: 2000,
                    retryDelay: 1500,
                    numberDisplayDelay: 100
                },
                
                // UI配置
                uiElements: {
                    showOptionsArea: true,
                    itemNumberOverlay: true,
                    totalDialog: false
                },
                
                // 動畫配置
                animations: {
                    fadeInDuration: 300,
                    numberPopDuration: 200,
                    incorrectShake: 300
                },
                
                // 🔧 [新增] 跨平台拖曳配置
                touchDragConfig: {
                    enabled: true,
                    enableClickToDrag: true,
                    enableSorting: true,
                    touchSensitivity: 10,
                    crossPlatformSupport: true
                }
            },
            
            hard: {
                triggerType: 'manual',         // 手動點擊觸發
                audioFeedback: true,           // 有音效反饋
                speechFeedback: false,         // 無數數語音反饋，但保留結果語音
                showNumbers: false,            // 不顯示數字覆蓋層
                autoShowTotal: false,          // 不自動顯示總數
                requireAnswer: true,           // 需要手動輸入答案
                allowRetry: true,              // 允許重試(根據testMode設定)
                useNumberInput: true,          // 使用數字輸入
                label: '困難',
                description: '無語音及數字提示，需要自行輸入數字',
                
                // 語音模板配置
                speechTemplates: {
                    initialInstruction: "請數一數，總共有幾個",
                    instruction: "請點擊圖案開始數數",
                    inputPrompt: "請輸入正確的數量",
                    inputConfirm: "{answer}",
                    correct: "答對了！正確答案是 {answer}",
                    incorrect: "答錯了，再試一次！",
                    incorrectWithAnswer: "答錯了，正確答案是 {answer}",
                    addCustomItem: "已新增自訂圖示：{itemName}",
                    removeCustomItem: "已移除圖示：{itemName}"
                },
                
                // 文字模板配置
                textTemplates: {
                    progressText: "第 {current} / {total} 題",
                    correctFeedback: "答對了！正確答案是 {answer}",
                    incorrectFeedback: "答錯了，再試一次！",
                    incorrectWithAnswer: "答錯了，正確答案是 {answer}",
                    gameComplete: "🎉 測驗結束 🎉",
                    excellentPerformance: "表現優異！",
                    goodPerformance: "表現良好！",
                    needImprovement: "要多加練習喔！",
                    inputPrompt: "請輸入正確的數量"
                },
                
                // CSS 類名配置
                cssClasses: {
                    item: "item counting-item-hard fade-enabled",
                    itemChecked: "checked",
                    itemFaded: "faded",
                    feedbackCorrect: "feedback-bubble correct",
                    feedbackIncorrect: "feedback-bubble incorrect",
                    numberInput: "number-input-popup",
                    numberDisplay: "number-display-hard"
                },
                
                // 時間配置
                timing: {
                    speechDelay: 300,
                    nextQuestionDelay: 2000,
                    retryDelay: 1500,
                    fadeDelay: 200
                },
                
                // UI配置
                uiElements: {
                    showOptionsArea: false,
                    itemNumberOverlay: false,
                    fadeSelectedItems: true,
                    showCheckmark: true
                },
                
                // 動畫配置
                animations: {
                    fadeInDuration: 300,
                    itemFadeDuration: 400,
                    checkmarkScale: 1.2
                },
                
                // 🔧 [新增] 跨平台拖曳配置
                touchDragConfig: {
                    enabled: true,
                    enableClickToDrag: true,
                    enableSorting: true,
                    touchSensitivity: 10,
                    crossPlatformSupport: true
                }
            }
        },

        // =====================================================
        // 🎨 StyleConfig - CSS配置驅動系統
        // =====================================================
        StyleConfig: {
            // 基礎樣式配置
            base: {
                itemArea: {
                    background: '#f8f9fa',
                    border: '3px dashed #dee2e6',
                    borderRadius: '15px',
                    padding: '30px',
                    minHeight: '250px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '20px',
                    cursor: 'pointer'
                },
                item: {
                    fontSize: '3.5rem',
                    padding: '10px',
                    borderRadius: '10px',
                    transition: 'all 0.3s ease',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                },
                itemNumberOverlay: {
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    background: '#ffc107',
                    color: 'black',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    border: '2px solid white',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                },
                itemCheckmarkOverlay: {
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    background: '#28a745',
                    color: 'white',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    border: '2px solid white',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                },
                feedbackBubble: {
                    padding: '15px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    margin: '10px 0'
                }
            },
            
            // 模式特定樣式
            easy: {
                item: {
                    border: '2px solid #28a745',
                    backgroundColor: '#ffffff'
                },
                itemHover: {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                }
            },
            
            normal: {
                item: {
                    border: '2px solid #007bff',
                    backgroundColor: '#ffffff'
                },
                itemHover: {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)'
                },
                optionButton: {
                    fontSize: '1.8rem',
                    padding: '15px 25px',
                    minWidth: '80px',
                    height: '70px',
                    border: '3px solid #007bff',
                    borderRadius: '15px',
                    background: '#ffffff',
                    color: '#007bff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0, 123, 255, 0.2)'
                }
            },
            
            hard: {
                item: {
                    border: '2px solid #dc3545',
                    backgroundColor: '#ffffff'
                },
                itemFaded: {
                    opacity: '0.5'
                },
                itemChecked: {
                    '::after': {
                        content: '"✔"',
                        color: '#28a745',
                        fontSize: '40px',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textShadow: '0 0 5px white'
                    }
                }
            },
            
            // 回饋樣式
            feedback: {
                correct: {
                    background: '#d4edda',
                    color: '#155724',
                    border: '1px solid #c3e6cb'
                },
                incorrect: {
                    background: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb'
                }
            }
        },

        // =====================================================
        // Game Data and Configuration
        // =====================================================
        gameData: {
            title: "單元F2：數量與點數",
            subtitle: "透過唱數與計數練習，學習正確的數數方法，建立數序概念",
            themes: {
                default: ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍍', '🍉', '🍑', '🍒', '🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '🚚', '🚲', '🚀', '✈️'],
                fruits:  ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍍', '🍉', '🍑', '🍒'],
                animals: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁'],
                vehicles:['🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '🚚', '🚲', '🚀', '✈️'],
                custom: [] // 自訂主題（動態載入自訂圖示）
            },
            difficultySettings: {
                easy:   { minItems: 1,  maxItems: 5,  label: '簡單' },
                normal: { minItems: 1,  maxItems: 10, label: '普通' },
                hard:   { minItems: 5,  maxItems: 15, label: '困難' }
            },
            countingRanges: {
                'range1-5':   { minItems: 1,  maxItems: 5,  label: '1-5' },
                'range1-10':  { minItems: 1,  maxItems: 10, label: '1-10' },
                'range15-20': { minItems: 15, maxItems: 20, label: '15-20' },
                'range20-30': { minItems: 20, maxItems: 30, label: '20-30' },
                'custom':     { minItems: 1,  maxItems: 30, label: '自訂範圍' }
            }
        },

        // =====================================================
        // Game State
        // =====================================================
        state: {
            score: 0,
            currentTurn: 0,
            totalTurns: 10,
            correctAnswer: 0,
            lastAnswer: null, // 記錄上一題的答案，避免連續重複
            userCountProgress: 0,
            isAnswering: false,
            isEndingGame: false, // 防止 endGame 重複調用
            customItems: [], // 自訂主題圖示和名稱
            startTime: null, // 遊戲開始時間
            settings: {
                difficulty: null,
                theme: 'default',
                questionCount: null,
                testMode: null, // 'retry' or 'single'
                countingRange: null, // 數數範圍設定
                assistClick: false
            }
        },

        // =====================================================
        // DOM Elements
        // =====================================================
        elements: {},

        // =====================================================
        // 🔧 [Bug修復] closeFeedbackPopup 初始化
        // =====================================================
        closeFeedbackPopup: null,

        // =====================================================
        // 🔧 [Bug修復] TimerManager - 統一計時器管理
        // =====================================================
        TimerManager: {
            timers: {},
            nextId: 1,

            setTimeout(callback, delay, category = 'default') {
                const id = this.nextId++;
                const timerId = setTimeout(() => {
                    delete this.timers[id];
                    callback();
                }, delay);
                this.timers[id] = { timerId, category };
                return id;
            },

            clearTimeout(id) {
                if (this.timers[id]) {
                    clearTimeout(this.timers[id].timerId);
                    delete this.timers[id];
                }
            },

            clearByCategory(category) {
                Object.keys(this.timers).forEach(id => {
                    if (this.timers[id].category === category) {
                        clearTimeout(this.timers[id].timerId);
                        delete this.timers[id];
                    }
                });
            },

            clearAll() {
                Object.keys(this.timers).forEach(id => {
                    clearTimeout(this.timers[id].timerId);
                });
                this.timers = {};
            }
        },

        // =====================================================
        // 🔧 [Bug修復] EventManager - 統一事件監聽器管理
        // =====================================================
        EventManager: {
            listeners: [],

            on(element, event, handler, options = {}, category = 'default') {
                if (!element) return;
                element.addEventListener(event, handler, options);
                this.listeners.push({ element, event, handler, options, category });
            },

            removeByCategory(category) {
                this.listeners = this.listeners.filter(l => {
                    if (l.category === category) {
                        l.element.removeEventListener(l.event, l.handler, l.options);
                        return false;
                    }
                    return true;
                });
            },

            removeAll() {
                this.listeners.forEach(l => {
                    l.element.removeEventListener(l.event, l.handler, l.options);
                });
                this.listeners = [];
            }
        },

        // =====================================================
        // 🎬 全局動畫樣式注入
        // =====================================================
        injectGlobalAnimationStyles() {
            if (document.getElementById('f2-global-animations')) return;

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
                @keyframes hintPulse {
                    0%, 100% {
                        box-shadow: 0 6px 20px rgba(225, 112, 85, 0.3);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 8px 25px rgba(225, 112, 85, 0.5);
                        transform: scale(1.02);
                    }
                }
                @keyframes revealBounceIn {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0;
                    }
                    60% {
                        transform: translate(-50%, -50%) scale(1.1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }
                @keyframes numberGlow {
                    0% { text-shadow: 3px 3px 6px rgba(0,0,0,0.4); }
                    100% { text-shadow: 3px 3px 6px rgba(0,0,0,0.4), 0 0 20px #ffeaa7; }
                }
                @keyframes revealBounceOut {
                    0% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(0.3);
                        opacity: 0;
                    }
                }
                @keyframes pulseGlow {
                    0%, 100% {
                        box-shadow: 0 8px 25px rgba(255, 71, 87, 0.3);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 12px 35px rgba(255, 71, 87, 0.5);
                        transform: scale(1.02);
                    }
                }
                @keyframes bounceIn {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }
                @keyframes popIn {
                    0% { transform: scale(0.5); opacity: 0; }
                    80% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes sparkle {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `;

            const style = document.createElement('style');
            style.id = 'f2-global-animations';
            style.innerHTML = css;
            document.head.appendChild(style);
        },

        // =====================================================
        // 🎨 CSS Generator - 配置驅動CSS生成器
        // =====================================================
        CSSGenerator: {
            generateCSS(difficulty) {
                Game.Debug.logConfig(`生成${difficulty}模式CSS`, Game.StyleConfig);
                
                const baseStyles = Game.StyleConfig.base;
                const modeStyles = Game.StyleConfig[difficulty] || {};
                const feedbackStyles = Game.StyleConfig.feedback;
                
                return `
                    <style>
                        ${this.generateBaseCSS(baseStyles)}
                        ${this.generateModeSpecificCSS(difficulty, modeStyles)}
                        ${this.generateFeedbackCSS(feedbackStyles)}
                    </style>
                `;
            },
            
            generateBaseCSS(baseStyles) {
                return `
                    #item-area {
                        ${this.objectToCSS(baseStyles.itemArea)}
                    }
                    .item {
                        ${this.objectToCSS(baseStyles.item)}
                    }
                    .item-number-overlay {
                        ${this.objectToCSS(baseStyles.itemNumberOverlay)}
                    }
                    .item-checkmark-overlay {
                        ${this.objectToCSS(baseStyles.itemCheckmarkOverlay)}
                    }
                    .feedback-bubble {
                        ${this.objectToCSS(baseStyles.feedbackBubble)}
                    }
                    
                    /* 自訂主題上傳介面樣式 */
                    .custom-theme-setup {
                        border: 2px dashed #ddd;
                        border-radius: 10px;
                        padding: 20px;
                        margin-top: 20px;
                        background-color: #f9f9f9;
                    }
                    .custom-theme-setup h4 {
                        margin-top: 0;
                        color: #333;
                        font-size: 18px;
                    }
                    .custom-items-list {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        min-height: 60px;
                        border: 1px solid #e0e0e0;
                        border-radius: 5px;
                        padding: 10px;
                        margin: 10px 0;
                        background: white;
                    }
                    .custom-item-row {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 4px;
                        padding: 8px;
                        border: 1px solid #eee;
                        border-radius: 8px;
                        background: #fafafa;
                        text-align: center;
                    }
                    .custom-item-row span {
                        font-size: 12px;
                        font-weight: bold;
                        color: #333;
                    }
                    .upload-btn, .remove-btn {
                        padding: 8px 15px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s ease;
                    }
                    .upload-btn {
                        background: linear-gradient(45deg, #2196F3, #42A5F5);
                        color: white;
                        font-weight: bold;
                    }
                    .upload-btn:hover, .upload-btn:active {
                        background: linear-gradient(45deg, #FF9800, #FFA726);
                        transform: translateY(-2px);
                    }
                    .remove-btn {
                        background: transparent;
                        color: inherit;
                        font-size: 12px;
                        padding: 4px 8px;
                        border: none;
                    }
                    .remove-btn:hover {
                        background: transparent;
                    }
                    
                    /* 圖片預覽模態視窗樣式 */
                    .image-preview-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.5);
                        display: none;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                    }
                    .image-preview-modal.show {
                        display: flex;
                    }
                    .modal-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                    }
                    .modal-content {
                        background: white;
                        border-radius: 15px;
                        padding: 0;
                        width: 90%;
                        max-width: 500px;
                        max-height: 90vh;
                        overflow-y: auto;
                        position: relative;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    }
                    .modal-header {
                        background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                        color: white;
                        padding: 15px 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .modal-header h3 {
                        margin: 0;
                        font-size: 18px;
                    }
                    .close-btn {
                        background: none;
                        border: none;
                        color: white;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 0;
                        width: 25px;
                        height: 25px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .close-btn:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }
                    .modal-body {
                        padding: 20px;
                    }
                    .image-preview-container {
                        text-align: center;
                        margin-bottom: 15px;
                        width: 100%;
                    }
                    .image-preview-container img {
                        max-width: 350px;
                        max-height: 300px;
                        width: auto;
                        height: auto;
                        object-fit: contain;
                        border-radius: 10px;
                        border: 2px solid #ddd;
                        display: block;
                        margin: 0 auto 10px auto;
                    }
                    .item-form .form-group {
                        margin-bottom: 15px;
                    }
                    .item-form label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: bold;
                        color: #333;
                    }
                    .modal-body input {
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ddd;
                        border-radius: 8px;
                        font-size: 16px;
                        text-align: center;
                        box-sizing: border-box;
                    }
                    .modal-body input:focus {
                        outline: none;
                        border-color: #4ECDC4;
                    }
                    .modal-footer {
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                        flex-direction: row !important;
                        gap: 20px !important;
                        padding: 20px 30px !important;
                        background: #f8f9fa;
                    }
                    .cancel-btn, .confirm-btn {
                        padding: 12px 24px !important;
                        border-radius: 8px !important;
                        cursor: pointer;
                        font-size: 16px !important;
                        font-weight: bold !important;
                        min-width: 120px !important;
                        height: 48px !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        transition: all 0.3s ease;
                    }
                    .cancel-btn {
                        background: white !important;
                        color: #dc3545 !important;
                        border: 2px solid #dc3545 !important;
                    }
                    .cancel-btn:hover {
                        background: #fff5f5 !important;
                    }
                    .confirm-btn {
                        background: #28a745 !important;
                        color: white !important;
                        border: 2px solid #28a745 !important;
                    }
                    .confirm-btn:hover {
                        background: #218838 !important;
                    }
                `;
            },
            
            generateModeSpecificCSS(difficulty, modeStyles) {
                let css = '';
                
                if (modeStyles.item) {
                    css += `.item.counting-item-${difficulty} { ${this.objectToCSS(modeStyles.item)} }`;
                }
                
                if (modeStyles.itemHover) {
                    css += `.item.counting-item-${difficulty}:hover { ${this.objectToCSS(modeStyles.itemHover)} }`;
                }
                
                if (modeStyles.optionButton) {
                    css += `#options-area .payment-btn { ${this.objectToCSS(modeStyles.optionButton)} }`;
                    css += `#options-area .payment-btn:hover { 
                        background: #007bff !important;
                        color: white !important;
                        transform: translateY(-3px) !important;
                        box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4) !important;
                    }`;
                }
                
                if (difficulty === 'hard') {
                    css += `.item.fade-enabled.checked.faded { ${this.objectToCSS(modeStyles.itemFaded)} }`;
                    css += `.item.fade-enabled.checked.faded::after { 
                        content: '✔'; color: #28a745; font-size: 40px; 
                        position: absolute; top: 50%; left: 50%; 
                        transform: translate(-50%, -50%); 
                        text-shadow: 0 0 5px white; 
                    }`;
                }
                
                return css;
            },
            
            generateFeedbackCSS(feedbackStyles) {
                return `
                    .feedback-bubble.correct {
                        ${this.objectToCSS(feedbackStyles.correct)}
                    }
                    .feedback-bubble.incorrect {
                        ${this.objectToCSS(feedbackStyles.incorrect)}
                    }
                    #options-area .products-grid {
                        display: flex !important;
                        gap: 20px !important;
                        justify-content: center !important;
                        margin-top: 10px !important;
                    }
                `;
            },
            
            objectToCSS(obj) {
                return Object.entries(obj).map(([key, value]) => {
                    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                    return `${cssKey}: ${value};`;
                }).join(' ');
            }
        },

        // =====================================================
        // Audio System - 配置驅動
        // =====================================================
        Audio: {
            audioUnlocked: false, // 手機音頻解鎖狀態

            // 🔧 [新增] 手機端音頻解鎖機制 (解決iOS/Android語音限制)
            unlockAudio() {
                if (this.audioUnlocked) return;
                
                Game.Debug.logAudio('嘗試解鎖手機音頻', 'unlock', { 
                    audioUnlocked: this.audioUnlocked 
                });
                
                try {
                    // 創建AudioContext並播放無聲音頻來解鎖
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    gainNode.gain.value = 0; // 無聲
                    oscillator.frequency.value = 440;
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.01);
                    
                    this.audioUnlocked = true;
                    Game.Debug.logAudio('手機音頻解鎖成功', 'unlock', { 
                        audioUnlocked: this.audioUnlocked 
                    });
                } catch (error) {
                    Game.Debug.logError(error, '手機音頻解鎖失敗');
                }
            },

            playSound(soundType, difficulty, config, callback) {
                Game.Debug.logAudio('嘗試播放音效', soundType, { 
                    difficulty, 
                    audioFeedback: config?.audioFeedback 
                });
                
                const soundMap = {
                    select: 'menu-select-sound',
                    correct: 'correct-sound', 
                    error: 'error-sound',
                    success: 'success-sound'
                };
                
                const audioId = soundMap[soundType];
                if (!audioId) {
                    Game.Debug.logAudio('找不到音效映射', soundType);
                    if (callback) callback();
                    return;
                }
                
                const audio = document.getElementById(audioId);
                if (!audio) {
                    Game.Debug.logError('找不到音效元素', `audio ID: ${audioId}`);
                    if (callback) callback();
                    return;
                }
                
                if (config && config.audioFeedback) {
                    try {
                        audio.currentTime = 0;
                        audio.play()
                            .then(() => {
                                Game.Debug.logAudio('音效播放成功', soundType);
                            })
                            .catch(e => {
                                Game.Debug.logError(e, '音效播放失敗');
                            });
                    } catch (error) {
                        Game.Debug.logError(error, '音效播放異常');
                    }
                } else {
                    Game.Debug.logAudio('音效被配置關閉', soundType, { audioFeedback: config?.audioFeedback });
                }
                
                if (callback) {
                    const delay = config?.timing?.speechDelay || 300;
                    Game.Debug.logAudio('設定音效回調', soundType, { delay });
                    Game.TimerManager.setTimeout(callback, delay, 'audio');
                }
            }
        },

        // =====================================================
        // Speech System - 配置驅動
        // =====================================================
        Speech: {
            synth: window.speechSynthesis,
            voice: null,
            isReady: false,

            init() {
                Game.Debug.logSpeech('初始化語音系統', 'init', 'system');
                
                let voiceInitAttempts = 0;
                const maxAttempts = 5;
                
                const setVoice = () => {
                    const voices = this.synth.getVoices();
                    voiceInitAttempts++;
                    
                    Game.Debug.logSpeech('取得語音列表', 'voices', 'system', { 
                        voiceCount: voices.length,
                        attempt: voiceInitAttempts,
                        allVoices: voices.map(v => ({ name: v.name, lang: v.lang }))
                    });
                    
                    if (voices.length === 0) {
                        if (voiceInitAttempts < maxAttempts) {
                            Game.Debug.logSpeech('語音列表為空，將重試', 'retry', 'system');
                            Game.TimerManager.setTimeout(setVoice, 500, 'speech');
                        } else {
                            Game.Debug.logError('多次嘗試後仍無法載入語音', '語音初始化');
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
                        Game.Debug.logSpeech('語音準備就緒', 'ready', 'system', { 
                            voiceName: this.voice.name,
                            lang: this.voice.lang,
                            attempt: voiceInitAttempts 
                        });
                    } else {
                        Game.Debug.logError('未找到中文語音', '語音初始化', {
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
                        Game.Debug.logSpeech('延遲重試語音初始化', 'delayed-retry', 'system');
                        setVoice();
                    }
                }, 1000, 'speech');
            },

            speak(templateKey, difficulty, config, replacements = {}, callback) {
                Game.Debug.logSpeech('嘗試播放語音', templateKey, difficulty, {
                    speechFeedback: config?.speechFeedback,
                    isReady: this.isReady,
                    audioUnlocked: Game.Audio.audioUnlocked,
                    replacements
                });
                
                // 停止所有正在播放的語音，防止重疊和多重回調
                if (this.synth.speaking) {
                    Game.Debug.logSpeech('停止之前的語音播放', templateKey, difficulty);
                    this.synth.cancel();
                }
                
                // 🔧 [新增] 檢查手機音頻是否已解鎖
                if (!Game.Audio.audioUnlocked) {
                    Game.Debug.logSpeech('語音被跳過', templateKey, difficulty, { reason: 'audio not unlocked' });
                    if (callback) Game.TimerManager.setTimeout(callback, config?.timing?.speechDelay || 300, 'ui');
                    return;
                }

                // 困難模式下，只允許結果反饋語音、輸入提示語音和初始指導語音
                const hardModeAllowedTemplates = ['correct', 'incorrect', 'incorrectWithAnswer', 'inputPrompt', 'initialInstruction', 'inputConfirm'];
                const shouldSpeak = config &&
                    (config.speechFeedback ||
                     (difficulty === 'hard' && hardModeAllowedTemplates.includes(templateKey))) &&
                    this.isReady;

                if (!shouldSpeak) {
                    Game.Debug.logSpeech('語音被跳過', templateKey, difficulty, {
                        reason: !config ? 'no config' :
                               !this.isReady ? 'not ready' :
                               difficulty === 'hard' && !hardModeAllowedTemplates.includes(templateKey) ? 'hard mode restricted' :
                               'speechFeedback disabled'
                    });
                    if (callback) Game.TimerManager.setTimeout(callback, config?.timing?.speechDelay || 300, 'ui');
                    return;
                }

                const template = config.speechTemplates[templateKey];
                if (!template) {
                    Game.Debug.logError(`找不到語音模板: ${templateKey}`, '語音系統');
                    if (callback) Game.TimerManager.setTimeout(callback, config?.timing?.speechDelay || 300, 'ui');
                    return;
                }

                let speechText = template;
                // 需要轉換為中文數字的欄位
                const numberFields = ['count', 'total', 'answer', 'current'];
                Object.keys(replacements).forEach(key => {
                    if (key === '_suffix') return; // 特殊處理：_suffix 不是模板變數
                    let value = replacements[key];
                    // 如果是數字欄位且有共用模組，進行數字轉換
                    if (numberFields.includes(key) && typeof value === 'number' && typeof NumberSpeechUtils !== 'undefined') {
                        // 檢查模板是否包含量詞 "個"，若是則使用量詞轉換
                        if (speechText.includes(`{${key}} 個`) || speechText.includes(`{${key}}個`)) {
                            value = NumberSpeechUtils.convertToQuantitySpeech(value, '個');
                            // 替換整個 "{key} 個" 或 "{key}個" 模式（避免重複"個"）
                            speechText = speechText.replace(`{${key}} 個`, value);
                            speechText = speechText.replace(`{${key}}個`, value);
                        } else {
                            value = NumberSpeechUtils.convertToPureNumberSpeech(value);
                            speechText = speechText.replace(`{${key}}`, value);
                        }
                    } else {
                        speechText = speechText.replace(`{${key}}`, value);
                    }
                });

                // 處理 _suffix：追加結尾文字
                if (replacements._suffix) {
                    speechText += replacements._suffix;
                }

                Game.Debug.logSpeech('開始播放語音', templateKey, difficulty, { 
                    text: speechText,
                    voiceName: this.voice?.name 
                });

                try {
                    this.synth.cancel();
                    const utterance = new SpeechSynthesisUtterance(speechText);
                    utterance.voice = this.voice;
                    utterance.lang = this.voice.lang;
                    utterance.rate = 1.0;
                    
                    // 安全措施：移至 if 外確保 catch 也能存取 safeCallback
                    let callbackExecuted = false;
                    const safeCallback = () => {
                        if (!callbackExecuted && callback) {
                            callbackExecuted = true;
                            callback();
                        }
                    };

                    if (callback) {
                        utterance.onend = () => {
                            Game.Debug.logSpeech('語音播放完成', templateKey, difficulty);
                            safeCallback();
                        };

                        utterance.onerror = (error) => {
                            Game.Debug.logError(error, '語音播放錯誤');
                            safeCallback();
                        };

                        Game.TimerManager.setTimeout(() => {
                            Game.Debug.logSpeech('語音播放超時，強制執行回調', templateKey, difficulty);
                            safeCallback();
                        }, 5000, 'speech');
                    }

                    this.synth.speak(utterance);
                } catch (error) {
                    Game.Debug.logError(error, '語音播放異常');
                    safeCallback();
                }
            }
        },

        // =====================================================
        // 🎯 跨平台拖曳管理器 - 使用SortableJS（支援桌面和移動端）
        // =====================================================
        CrossPlatformDragManager: {
            isInitialized: false,
            currentConfig: null,
            // HTML5拖曳系統已整合，無需額外實例管理
            retryCount: 0, // 重試計數器

            /**
             * 🔧 [新版] 初始化跨平台拖曳功能 - 使用SortableJS
             * @param {string} difficulty - 難度等級  
             * @param {Object} config - ModeConfig配置
             */
            init(difficulty, config) {
                Game.Debug.logUI('🚀 初始化跨平台拖曳管理器 (優化版)', difficulty);

                if (!config.touchDragConfig?.enabled) {
                    Game.Debug.logUI('拖曳功能在配置中被禁用', difficulty);
                    return;
                }

                // 🔧 [優化] 直接使用HTML5DragSystem，不再依賴SortableJS
                if (Game.HTML5DragSystem && typeof Game.HTML5DragSystem.initialize === 'function') {
                    Game.Debug.logUI('✅ 使用HTML5DragSystem進行拖曳初始化', difficulty);
                    try {
                        Game.HTML5DragSystem.initialize(difficulty);
                        this.isInitialized = true;
                        Game.Debug.logUI('✅ HTML5DragSystem初始化完成', difficulty);
                        return;
                    } catch (error) {
                        Game.Debug.logError('HTML5DragSystem初始化失敗，嘗試備案方案', error);
                    }
                }

                // 備案：使用TouchDragUtility
                const container = document.getElementById('item-area');
                if (container && window.TouchDragUtility) {
                    Game.Debug.logUI('⚠️ 使用TouchDragUtility備案方案', difficulty);
                    this.initTouchDragFallback(container);
                    return;
                }

                // 如果所有系統都不可用，標記為初始化以避免重複嘗試
                Game.Debug.logError('無可用的拖曳系統', 'CrossPlatformDragManager.init');
                this.isInitialized = true;

                // 重置重試計數器
                this.retryCount = 0;

                this.currentConfig = config.touchDragConfig;
                
                try {
                    this.setupHTML5DragSystem(difficulty, config);
                    this.isInitialized = true;
                    Game.Debug.logUI('✅ HTML5拖曳功能初始化完成', difficulty);
                } catch (error) {
                    Game.Debug.logError(error, '跨平台拖曳初始化失敗');
                    this.isInitialized = false;
                }
            },

            setupHTML5DragSystem(difficulty, config) {
                Game.Debug.logUI('⚙️ 設置HTML5拖曳系統', difficulty);
                
                // 使用整合版 HTML5 拖曳系統替代 SortableJS
                try {
                    Game.HTML5DragSystem.initialize(difficulty);
                    Game.Debug.logUI('✅ HTML5拖曳系統初始化完成', { difficulty });
                } catch (error) {
                    Game.Debug.logError(error, 'HTML5拖曳系統初始化失敗');
                    // Fallback 機制（預留給未來需要時使用）
                    Game.Debug.warn('init', '⚠️ HTML5拖曳系統初始化失敗，遊戲仍可正常運行（主要為點擊模式）');
                }
            },

            cleanup() {
                Game.Debug.logUI('🧹 清理拖曳系統實例');
                
                // 清理 HTML5 拖曳系統
                try {
                    Game.HTML5DragSystem.cleanup();
                } catch (error) {
                    Game.Debug.logError(error, 'HTML5拖曳系統清理失敗');
                }
                
                this.isInitialized = false;
                this.retryCount = 0;
                
                Game.Debug.logUI('✅ 拖曳系統清理完成');
            }
        },

        // =====================================================
        // HTML Templates - 統一管理
        // =====================================================
        HTMLTemplates: {
            settingsScreen(difficulty, theme, questionCount, testMode, countingRange, assistClick) {
                Game.Debug.log('ui', '🎨 渲染設定畫面，主題:', theme, '自訂主題條件:', theme === 'custom' && difficulty !== 'hard');

                return `
                    <div class="unit-welcome">
                        <div class="welcome-content">
                            <div class="settings-title-row">
                                <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                                <h1>${Game.gameData.title}</h1>
                            </div>
                            <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">透過唱數與計數練習，學習正確的數數方法，建立數序概念</p>
                            <div class="game-settings">
                                <div class="setting-group">
                                    <label>🎯 選擇難度：</label>
                                    <div class="button-group">
                                        ${Object.entries(Game.gameData.difficultySettings).map(([key, value]) => `
                                            <button class="selection-btn ${difficulty === key ? 'active' : ''}" data-type="difficulty" data-value="${key}">${value.label}</button>
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
                                        啟用後，只要偵測到點擊，系統會自動依序完成點選物件依序唱數等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                        <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式」</strong>
                                    </p>
                                    <div class="button-group">
                                        <button class="selection-btn ${assistClick ? 'active' : ''}" id="assist-click-on">✓ 啟用</button>
                                        <button class="selection-btn ${!assistClick ? 'active' : ''}" id="assist-click-off">✗ 停用</button>
                                    </div>
                                </div>
                                <div class="setting-group">
                                    <label>🔢 數數範圍：</label>
                                    <div class="button-group">
                                        ${Object.entries(Game.gameData.countingRanges).map(([key, value]) => `
                                            <button class="selection-btn ${countingRange === key ? 'active' : ''}" data-type="countingRange" data-value="${key}">${value.label}</button>
                                        `).join('')}
                                    </div>
                                </div>
                                <div class="setting-group">
                                    <label>🎨 主題選擇：</label>
                                    <div class="button-group">
                                        <button class="selection-btn ${theme === 'default' ? 'active' : ''}"
                                                data-type="theme" data-value="default">
                                            隨機 🎲
                                        </button>
                                        ${Object.keys(Game.gameData.themes).filter(key => key !== 'custom' && key !== 'default').map(key => `
                                            <button class="selection-btn ${theme === key ? 'active' : ''}"
                                                    data-type="theme" data-value="${key}">
                                                ${key === 'fruits' ? '水果' : key === 'animals' ? '動物' : '交通工具'} ${Game.gameData.themes[key][0]}
                                            </button>
                                        `).join('')}
                                        <button class="selection-btn ${theme === 'custom' ? 'active' : ''}"
                                                data-type="theme" data-value="custom">
                                            🎨 自訂主題
                                        </button>
                                    </div>
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
                                                    <img src="${item.imageData}" alt="${item.name}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;">
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
                                <div class="setting-group">
                                    <label>📋 題目數量：</label>
                                    <div class="button-group">
                                        ${[1, 3, 5, 10].map(num => `
                                            <button class="selection-btn ${questionCount === num ? 'active' : ''}" data-type="questionCount" data-value="${num}">${num}題</button>
                                        `).join('')}
                                        <button class="selection-btn ${questionCount !== null && ![1,3,5,10].includes(questionCount) ? 'active' : ''}" data-type="questionCount" data-value="custom">自訂</button>
                                    </div>
                                    <div class="custom-question-display" style="display: ${questionCount !== null && ![1,3,5,10].includes(questionCount) ? 'block' : 'none'}; margin-top: 10px;">
                                        <input type="text" id="custom-question-count-f2"
                                               value="${questionCount !== null && ![1,3,5,10].includes(questionCount) ? questionCount + '題' : ''}"
                                               placeholder="請輸入題數"
                                               style="padding: 8px; border-radius: 5px; border: 2px solid ${questionCount !== null && ![1,3,5,10].includes(questionCount) ? '#667eea' : '#ddd'}; background: ${questionCount !== null && ![1,3,5,10].includes(questionCount) ? '#667eea' : 'white'}; color: ${questionCount !== null && ![1,3,5,10].includes(questionCount) ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                                               readonly onclick="Game.handleCustomQuestionClick()">
                                    </div>
                                </div>
                                <div class="setting-group" id="mode-selection-group">
                                    <label>📝 測驗模式：</label>
                                    <div class="button-group">
                                        <button class="selection-btn ${testMode === 'retry' ? 'active' : ''}"
                                                data-type="testMode" data-value="retry"
                                                ${difficulty === 'easy' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                            反複作答
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
                    </div>
                `;
            },

            gameLayout(currentTurn, totalTurns, difficulty) {
                const config = Game.ModeConfig[difficulty];
                return `
                    <div class="store-layout">
                        <div class="title-bar">
                            <div class="title-bar-left">
                                <div id="progress-info" class="progress-info">第 ${currentTurn} / ${totalTurns} 題</div>
                            </div>
                            <div class="title-bar-center">
                                <div id="game-title" class="target-amount">${Game.gameData.title}</div>
                            </div>
                            <div class="title-bar-right">
                                <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                                <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                            </div>
                        </div>
                        <div class="unified-task-frame" style="padding-top: 20px; position: relative;">
                            <div id="item-area"></div>
                            ${config.requireAnswer ? '<div id="options-area" class="product-selection-area" style="justify-content: center; margin-top: 20px;"></div>' : ''}
                            ${difficulty === 'hard' ? '<div id="hint-area" style="position: absolute; right: 20px; pointer-events: none; z-index: 1000;"></div>' : ''}
                        </div>
                    </div>
                `;
            },
            
            // *** REFACTORED *** 配置驅動遊戲樣式生成器
            gameStyles() {
                const difficulty = Game.state.settings.difficulty || 'normal';
                Game.Debug.logTemplate('配置驅動樣式生成', { difficulty });
                return Game.CSSGenerator.generateCSS(difficulty);
            },

            

            countingItem(icon, index, difficulty) {
                const config = Game.ModeConfig[difficulty];
                const cssConfig = config.cssClasses || {};
                const itemClass = cssConfig.item || `item counting-item-${difficulty}`;
                const additionalClasses = config.uiElements.fadeSelectedItems ? ' fade-enabled' : '';
                
                // 檢測是否為自訂圖片（base64格式）
                const isCustomImage = icon.startsWith('data:image/');
                const iconDisplay = isCustomImage ? 
                    `<img src="${icon}" alt="自訂圖示" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; pointer-events: none; user-select: none;">` : 
                    icon;
                
                Game.Debug.logTemplate('countingItem', { 
                    icon: isCustomImage ? '[自訂圖片]' : icon, 
                    index, 
                    difficulty, 
                    itemClass: itemClass + additionalClasses,
                    isCustomImage
                });
                
                return `<div class="${itemClass}${additionalClasses}" data-index="${index}">${iconDisplay}</div>`;
            },

            optionsButtons(options) {
                return `
                    <div class="products-grid horizontal-layout">
                        ${options.map(option => 
                            `<button class="payment-btn" data-value="${option}">${option}</button>`
                        ).join('')}
                    </div>
                `;
            },
            
            // 困難模式提示框（答案提示）
            hintBox() {
                return `
                    <div id="hint-box" style="
                        background: linear-gradient(135deg, #ffeaa7, #fab1a0);
                        border: 3px solid #e17055;
                        border-radius: 20px;
                        padding: 12px 15px;
                        margin: 0;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: space-between;
                        box-shadow: 0 6px 20px rgba(225, 112, 85, 0.3);
                        cursor: pointer;
                        transition: all 0.3s ease;
                        animation: hintPulse 3s infinite;
                        text-align: center;
                        line-height: 1.2;
                        height: 100%;
                    ">
                        <div style="
                            font-size: 1.1em;
                            color: #2d3436;
                            font-weight: bold;
                            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                            flex: 0 0 auto;
                        ">需要提示</div>
                        <div style="
                            font-size: 0.85em;
                            color: #636e72;
                            flex: 0 0 auto;
                        ">點我看答案</div>
                        <div style="
                            font-size: 1.5em;
                            flex: 0 0 auto;
                        ">💡</div>
                    </div>
                `;
            },

            // 答案顯示彈窗
            answerRevealPopup(correctAnswer) {
                return `
                    <div id="answer-reveal-popup" style="
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) scale(0);
                        background: linear-gradient(135deg, #74b9ff, #0984e3);
                        border: 3px solid #0984e3;
                        border-radius: 25px;
                        padding: 30px;
                        text-align: center;
                        z-index: 2500;
                        box-shadow: 0 15px 40px rgba(9, 132, 227, 0.4);
                        min-width: 300px;
                        animation: revealBounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                    ">
                        <div style="font-size: 3em; margin-bottom: 15px;">🎯</div>
                        <div style="
                            font-size: 1.8em;
                            color: white;
                            font-weight: bold;
                            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                            margin-bottom: 10px;
                        ">正確的數量是</div>
                        <div style="
                            font-size: 4em;
                            color: #ffeaa7;
                            font-weight: bold;
                            text-shadow: 3px 3px 6px rgba(0,0,0,0.4);
                            margin: 15px 0;
                            animation: numberGlow 1.5s ease infinite alternate;
                        ">${correctAnswer}</div>
                    </div>
                    <div id="answer-reveal-backdrop" style="
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.6);
                        z-index: 2499;
                        animation: fadeIn 0.3s ease-out forwards;
                    "></div>
                    <!-- 動畫已移至 injectGlobalAnimationStyles() 集中管理 -->
                `;
            },

            // 困難模式數數確認框（置中顯示）
            inputPromptBox(promptText) {
                return `
                    <div class="input-prompt-container" style="
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        margin: 20px auto;
                        max-width: 1000px;
                        padding: 0 20px;
                    ">
                        <div id="input-prompt-box" style="
                            background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
                            border: 3px solid #ff4757;
                            border-radius: 20px;
                            padding: 20px;
                            text-align: center;
                            width: 100%;
                            max-width: 350px;
                            box-shadow: 0 8px 25px rgba(255, 71, 87, 0.3);
                            cursor: pointer;
                            transition: all 0.3s ease;
                            animation: pulseGlow 2s infinite;
                        ">
                            <div style="
                                font-size: 1.8em;
                                color: white;
                                font-weight: bold;
                                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                                margin-bottom: 10px;
                            ">${promptText}</div>
                            <div style="
                                font-size: 1.2em;
                                color: #ffe6e6;
                                opacity: 0.9;
                            ">點擊此處輸入答案</div>
                            <div style="
                                margin-top: 10px;
                                font-size: 2em;
                            ">👆</div>
                        </div>
                    </div>
                `;
            },

            // 困難模式獨立提示框容器（右下角對齊）
            hintBoxContainer() {
                return `
                    <div class="standalone-hint-container" style="display:flex;flex-direction:row;align-items:center;gap:6px;">
                        <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;pointer-events:none;">
                        ${this.hintBox()}
                    </div>
                `;
            },

            // 可愛的反饋彈跳視窗
            feedbackPopup(isCorrect, message, emoji = '') {
                const popupClass = isCorrect ? 'feedback-popup correct' : 'feedback-popup incorrect';
                const bgColor = isCorrect ? '#e8f5e8' : '#ffe8e8';
                const textColor = isCorrect ? '#2d5a2d' : '#7a2d2d';
                const borderColor = isCorrect ? '#4caf50' : '#f44336';
                
                return `
                    <div id="feedback-popup" class="${popupClass}" style="
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) scale(0);
                        background: ${bgColor};
                        border: 3px solid ${borderColor};
                        border-radius: 20px;
                        padding: 30px;
                        text-align: center;
                        z-index: 2000;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        min-width: 300px;
                        animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                    ">
                        <div style="font-size: 4em; margin-bottom: 15px;">${emoji}</div>
                        <div style="
                            font-size: 1.8em;
                            color: ${textColor};
                            font-weight: bold;
                            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                        ">${message}</div>
                        <div style="
                            margin-top: 20px;
                            font-size: 1em;
                            color: ${textColor};
                            opacity: 0.8;
                        ">點擊任意處繼續</div>
                    </div>
                    <div id="feedback-backdrop" style="
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.5);
                        z-index: 1999;
                        animation: fadeIn 0.3s ease-out forwards;
                    "></div>
                `;
            }
        },

        // =====================================================
        // Initialization
        // =====================================================
        init() {
            Game.Debug.logGameFlow('遊戲初始化開始');

            try {
                // 🔧 [Bug修復] 清理所有計時器和事件監聽器
                this.TimerManager.clearAll();
                this.EventManager.removeAll();
                this.injectGlobalAnimationStyles();
                this.closeFeedbackPopup = null;

                // 🔧 [新增] 清理跨平台拖曳管理器（返回設定時）
                this.CrossPlatformDragManager.cleanup();

                this.Speech.init();
                Game.Debug.logGameFlow('語音系統初始化完成');

                this.showSettings();
                Game.Debug.logGameFlow('設定畫面載入完成');
            } catch (error) {
                Game.Debug.logError(error, '遊戲初始化失敗');
            }
        },

        // =====================================================
        // Settings Screen
        // =====================================================
        showSettings() {
            AssistClick.deactivate();
            Game.Debug.log('ui', '🔧 showSettings 執行，主題:', this.state.settings.theme, '難度:', this.state.settings.difficulty);

            // 🔧 [重構] 統一重置遊戲狀態
            this.resetGameState();

            // 🔧 [Bug修復] 清理遊戲相關的計時器和事件
            this.TimerManager.clearAll();
            this.EventManager.removeByCategory('gameUI');
            this.EventManager.removeByCategory('feedbackPopup');
            this.EventManager.removeByCategory('answerReveal');

            Game.Debug.logGameFlow('載入設定畫面');
            Game.Debug.logTemplate('settingsScreen', this.state.settings);

            const app = document.getElementById('app');
            const { settings } = this.state;
            
            
            app.innerHTML = this.HTMLTemplates.settingsScreen(
                settings.difficulty,
                settings.theme,
                settings.questionCount,
                settings.testMode,
                settings.countingRange,
                settings.assistClick
            );

            Game.Debug.logUI('綁定設定選擇事件', 'game-settings');
            Game.EventManager.on(app.querySelector('.game-settings'), 'click', this.handleSelection.bind(this), {}, 'gameUI');

            Game.Debug.logUI('綁定開始遊戲事件', 'start-game-btn');
            Game.EventManager.on(app.querySelector('#start-game-btn'), 'click', this.start.bind(this), {}, 'gameUI');

            // 🎁 獎勵系統連結事件監聽器
            const rewardLink = app.querySelector('#settings-reward-link');
            if (rewardLink) {
                Game.EventManager.on(rewardLink, 'click', (e) => {
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
                Game.EventManager.on(worksheetLink, 'click', (e) => {
                    e.preventDefault();
                    // 作業單使用自己的預設值與工具列設定，不受遊戲設定影響
                    const params = new URLSearchParams({ unit: 'f2' });
                    window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
                }, {}, 'gameUI');
            }

            // 👆 輔助點擊開關事件
            const assistOn = app.querySelector('#assist-click-on');
            const assistOff = app.querySelector('#assist-click-off');
            if (assistOn) {
                Game.EventManager.on(assistOn, 'click', (e) => {
                    e.stopPropagation();
                    this.state.settings.assistClick = true;
                    assistOn.classList.add('active');
                    assistOff?.classList.remove('active');
                }, {}, 'gameUI');
            }
            if (assistOff) {
                Game.EventManager.on(assistOff, 'click', (e) => {
                    e.stopPropagation();
                    this.state.settings.assistClick = false;
                    assistOff.classList.add('active');
                    assistOn?.classList.remove('active');
                }, {}, 'gameUI');
            }

            // 不再需要動態 DOM 操作，模板已經直接渲染所有內容
            Game.Debug.log('ui', '✅ 設定畫面模板渲染完成');

            // 更新開始按鈕狀態
            this.updateStartButton();
            
            Game.Debug.logGameFlow('設定畫面載入完成', settings);
        },

        handleSelection(event) {
            // 🔧 [新增] 解鎖手機音頻（用戶首次互動時）
            this.Audio.unlockAudio();
            
            Game.Debug.log('ui', '🔧 handleSelection 觸發');
            const btn = event.target.closest('.selection-btn');
            if (!btn) {
                Game.Debug.log('ui', '❌ 找不到 selection-btn 元素');
                return;
            }

            const { type, value } = btn.dataset;
            Game.Debug.log('ui', '🔧 選擇事件:', { type, value, btn: btn.textContent });
            Game.Debug.logUserAction('設定選擇', { type, value });
            
            this.Audio.playSound('select', null, { audioFeedback: true });

            // 處理自訂題目數量
            if (type === 'questionCount' && value === 'custom') {
                this.showNumberInput('請輸入題目數量 (1-50)', (num) => {
                    const count = parseInt(num);
                    if (count > 0 && count <= 50) {
                        this.state.settings.questionCount = count;
                        this.state.totalTurns = count;

                        // 更新按鈕狀態
                        btn.closest('.button-group').querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');

                        // 🔧 [新增] 顯示自訂題數輸入框並套用藍色樣式（避免閃爍）
                        const customDisplay = document.querySelector('.custom-question-display');
                        const customInput = document.getElementById('custom-question-count-f2');
                        if (customDisplay && customInput) {
                            customDisplay.style.display = 'block';
                            customInput.value = `${count}題`;
                            customInput.style.background = '#667eea';
                            customInput.style.color = 'white';
                            customInput.style.borderColor = '#667eea';
                        }

                        this.updateStartButton();
                        return true;
                    }
                    return false;
                });
                return;
            }

            // 處理自訂數數範圍
            if (type === 'countingRange' && value === 'custom') {
                this.showRangeInput('請輸入數數範圍 (1-30)', (minVal, maxVal) => {
                    if (minVal > 0 && maxVal > minVal && maxVal <= 30) {
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
                        return true;
                    }
                    return false;
                });
                return;
            }
            
            // 如果選擇的是主題，需要特殊處理以顯示/隱藏自訂主題設定區域
            if (type === 'theme') {
                Game.Debug.log('ui', '🎨 主題選擇特殊處理:', {
                    oldTheme: this.state.settings.theme,
                    newTheme: value
                });

                Game.Debug.logUserAction('主題變更，重新載入設定畫面', { theme: value });

                // 先更新狀態
                this.state.settings[type] = value;
                Game.Debug.log('state', '🎨 狀態已更新:', this.state.settings);

                // 🔧 [修復] 先更新按鈕狀態，再更新自訂主題設定區域
                const buttonGroup = btn.closest('.button-group');
                buttonGroup.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 🔧 [優化] 只更新自訂主題設定區域，避免閃爍
                Game.Debug.log('ui', '🎨 準備更新自訂主題設定區域');
                this.updateCustomThemeSettings();
                this.updateStartButton();
                return;
            }

            this.state.settings[type] = (type === 'questionCount') ? parseInt(value) : value;
            if (type === 'questionCount') this.state.totalTurns = parseInt(value);

            const buttonGroup = btn.closest('.button-group');
            buttonGroup.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 🔧 [新增] 選擇預設題數時，隱藏自訂輸入框
            if (type === 'questionCount' && value !== 'custom') {
                const customDisplay = document.querySelector('.custom-question-display');
                const customInput = document.getElementById('custom-question-count-f2');
                if (customDisplay && customInput) {
                    customDisplay.style.display = 'none';
                    customInput.value = '';
                    customInput.style.background = 'white';
                    customInput.style.color = '#333';
                    customInput.style.borderColor = '#ddd';
                }
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

                // 🔧 [Bug修復] 如果 testMode 為 null，設置預設值為 'retry'
                if (this.state.settings.testMode === null) {
                    this.state.settings.testMode = 'retry';
                    // 更新按鈕狀態
                    const retryBtn = document.querySelector('[data-type="testMode"][data-value="retry"]');
                    if (retryBtn) {
                        retryBtn.classList.add('active');
                    }
                    Game.Debug.logState('testMode 自動設為預設值', null, 'retry');
                }
            }
        },

        // 🔧 [新增] 取得難度說明
        getDifficultyDescription(difficulty) {
            const descriptions = {
                'easy': '簡單：系統自動數數，引導下完成題目。',
                'normal': '普通：系統自動數數，以選擇題的方式，選擇正確的答案。',
                'hard': '困難：自己數數，並輸入正確的答案。'
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

        // 🔧 [新增] 處理點擊自訂題數輸入框
        handleCustomQuestionClick() {
            const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
            if (customBtn) {
                customBtn.click();
            }
        },

        updateStartButton() {
            Game.Debug.log('ui', '🎮 updateStartButton 開始檢查');
            const { difficulty, theme, questionCount, testMode, countingRange } = this.state.settings;
            const startBtn = document.getElementById('start-game-btn');

            // 檢查自訂主題是否有足夠的圖示
            const isCustomThemeValid = theme !== 'custom' || this.state.customItems.length >= 1;

            // 🔧 簡單模式不需要選擇測驗模式
            const modeRequired = difficulty !== 'easy';
            const modeValid = modeRequired ? testMode : true;

            Game.Debug.log('ui', '🎮 按鈕狀態檢查:', {
                difficulty, theme, questionCount, testMode, countingRange,
                isCustomThemeValid,
                customItemsCount: this.state.customItems.length,
                modeRequired,
                modeValid
            });

            if (difficulty && theme && questionCount && modeValid && countingRange && isCustomThemeValid) {
                startBtn.disabled = false;
                startBtn.textContent = '開始遊戲！';
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
        // Game Flow
        // =====================================================

        // 🔧 [重構] 統一的遊戲狀態重置函數
        resetGameState() {
            // 遊戲進度
            this.state.score = 0;
            this.state.currentTurn = 0;
            this.state.totalTurns = this.state.settings.questionCount || 10;
            this.state.lastAnswer = null;
            this.state.userCountProgress = 0;

            // 控制旗標（全部重置為 false）
            this.state.isAnswering = false;
            this.state.isEndingGame = false;
            this.state.isStartingNewTurn = false;

            // 時間
            this.state.startTime = null;

            Game.Debug.log('state', '🔄 遊戲狀態已重置');
        },

        start() {
            Game.Debug.group('遊戲開始', () => {
                const perfStart = Game.Debug.logPerformance('遊戲開始');

                Game.Debug.logState('重置遊戲狀態',
                    { score: this.state.score, currentTurn: this.state.currentTurn },
                    { score: 0, currentTurn: 0 }
                );

                // 🔧 [重構] 使用統一的狀態重置函數
                this.resetGameState();
                this.state.startTime = Date.now(); // 記錄開始時間

                Game.Debug.logConfig(this.state.settings.difficulty, this.ModeConfig[this.state.settings.difficulty]);

                this.setupGameUI();
                if (this.state.settings.difficulty === 'easy' && this.state.settings.assistClick) {
                    AssistClick.activate();
                }
                this.startNewTurn();

                Game.Debug.logPerformance('遊戲開始', perfStart);
            });
        },

        setupGameUI() {
            Game.Debug.logGameFlow('設置遊戲UI');
            const app = document.getElementById('app');
            const { difficulty } = this.state.settings;
            
            Game.Debug.logTemplate('gameLayout', { 
                currentTurn: this.state.currentTurn + 1, 
                totalTurns: this.state.totalTurns, 
                difficulty 
            });
            
            // 渲染遊戲主要佈局
            app.innerHTML = this.HTMLTemplates.gameLayout(
                this.state.currentTurn + 1, 
                this.state.totalTurns, 
                difficulty
            );
            
            Game.Debug.logTemplate('gameStyles');
            // *** MODIFIED ***: 注入遊戲畫面專用樣式
            app.insertAdjacentHTML('beforeend', this.HTMLTemplates.gameStyles());

            Game.Debug.logUI('取得DOM元素');
            Object.assign(this.elements, {
                itemArea: document.getElementById('item-area'),
                optionsArea: document.getElementById('options-area'),
                progressInfo: document.getElementById('progress-info'),
                scoreInfo: document.getElementById('score-info'),
                gameTitle: document.getElementById('game-title')
            });
            
            // 檢查重要元素是否存在
            if (!this.elements.itemArea) {
                Game.Debug.logError('找不到item-area元素', 'UI設置');
            }
            
            Game.Debug.logUI('綁定遊戲事件', 'item-area click');
            // 儲存綁定的函數引用以便後續使用
            this.boundHandleItemClick = this.handleItemClick.bind(this);
            this.boundHandleAnswerClick = this.handleAnswerClick.bind(this);

            // 🔧 [Bug修復] 儲存委派監聽器引用，以便 EventManager 統一清理（避免多次遊戲後事件堆疊）
            this.boundHandleAppDelegatedClick = (event) => {
                // 檢查是否點擊的是選項按鈕
                const selectedBtn = event.target.closest('.payment-btn');
                if (selectedBtn && selectedBtn.closest('#options-area')) {
                    // 🔧 [防連點] 在事件委託層級檢查 isAnswering 狀態
                    if (this.state.isAnswering) {
                        Game.Debug.logUserAction('[F2] 防抖：事件委託忽略重複點擊（isAnswering=true）');
                        return;
                    }
                    Game.Debug.logUserAction('事件委託捕獲選項點擊', {
                        buttonText: selectedBtn.textContent,
                        buttonValue: selectedBtn.dataset.value,
                        targetElement: event.target.tagName,
                        targetClass: event.target.className
                    });
                    this.boundHandleAnswerClick(event);
                }
            };

            // 使用 EventManager 管理，確保返回設定時（removeByCategory('gameUI')）自動清理，防止監聽器堆疊
            Game.Debug.logUI('使用事件委託綁定選項事件', 'app delegated click');
            Game.EventManager.on(this.elements.itemArea, 'click', this.boundHandleItemClick, {}, 'gameUI');
            Game.EventManager.on(app, 'click', this.boundHandleAppDelegatedClick, {}, 'gameUI');
            
            // 記錄options-area的狀態但不依賴它進行事件綁定
            if (this.elements.optionsArea) {
                Game.Debug.logUI('options-area已存在', 'options-area', {
                    innerHTML: this.elements.optionsArea.innerHTML
                });
            } else {
                Game.Debug.logUI('options-area不存在，將使用事件委託處理', 'UI設置');
            }
            
            // 🔧 [新增] 初始化跨平台拖曳功能
            const config = this.ModeConfig[difficulty];
            if (config.touchDragConfig?.enabled) {
                // 清理舊的拖曳註冊（如果有的話）
                this.CrossPlatformDragManager.cleanup();
                // 初始化新的拖曳功能
                this.CrossPlatformDragManager.init(difficulty, config);
            }
            
            Game.Debug.logGameFlow('遊戲UI設置完成');
        },

        startNewTurn() {
            // 防止重複調用的保護機制
            if (this.state.isStartingNewTurn) {
                Game.Debug.logGameFlow('阻止重複開始新回合', { 
                    currentTurn: this.state.currentTurn,
                    isStartingNewTurn: this.state.isStartingNewTurn 
                });
                return;
            }
            this.state.isStartingNewTurn = true;
            
            Game.Debug.group('開始新回合', () => {
                if (this.state.currentTurn >= this.state.totalTurns) {
                    Game.Debug.logGameFlow('遊戲結束', { 
                        currentTurn: this.state.currentTurn, 
                        totalTurns: this.state.totalTurns 
                    });
                    this.state.isStartingNewTurn = false;
                    this.endGame();
                    return;
                }
                
                const oldTurn = this.state.currentTurn;
                this.state.currentTurn++;
                this.state.isAnswering = false;
                this.state.userCountProgress = 0;
                
                Game.Debug.logState('新回合狀態', 
                    { currentTurn: oldTurn, isAnswering: true, userCountProgress: this.state.userCountProgress },
                    { currentTurn: this.state.currentTurn, isAnswering: false, userCountProgress: 0 }
                );
                
                this.updateProgress();

                // 清空區域
                Game.Debug.logUI('清空遊戲區域');
                if (this.elements.itemArea) this.elements.itemArea.innerHTML = '';
                if (this.elements.optionsArea) this.elements.optionsArea.innerHTML = '';
                
                // 清空困難模式提示區域
                const hardModePromptArea = document.getElementById('hard-mode-prompt-area');
                if (hardModePromptArea) {
                    hardModePromptArea.remove();
                }
                
                // 清空困難模式獨立提示框區域
                const hintArea = document.getElementById('hint-area');
                if (hintArea) {
                    hintArea.innerHTML = '';
                }
                
                // 生成題目
                const { difficulty, theme, countingRange } = this.state.settings;
                const config = this.ModeConfig[difficulty];
                const rangeConfig = this.gameData.countingRanges[countingRange];
                
                // 生成與上一題不同的題目數量
                this.state.correctAnswer = this.getRandomIntExcluding(
                    rangeConfig.minItems, 
                    rangeConfig.maxItems, 
                    this.state.lastAnswer
                );
                const randomIcon = this.gameData.themes[theme].slice().sort(() => 0.5 - Math.random())[0];

                Game.Debug.logGameFlow('生成新題目', {
                    turn: this.state.currentTurn,
                    difficulty,
                    theme,
                    countingRange,
                    correctAnswer: this.state.correctAnswer,
                    icon: randomIcon,
                    range: `${rangeConfig.minItems}-${rangeConfig.maxItems}`
                });

                // 渲染圖示
                Game.Debug.logTemplate('countingItem', { 
                    count: this.state.correctAnswer, 
                    icon: randomIcon, 
                    difficulty 
                });
                
                for (let i = 0; i < this.state.correctAnswer; i++) {
                    this.elements.itemArea.insertAdjacentHTML('beforeend', 
                        this.HTMLTemplates.countingItem(randomIcon, i, difficulty)
                    );
                }

                // 播放初始指導語音
                this.Speech.speak('initialInstruction', difficulty, config);
                
                Game.Debug.logGameFlow('新回合準備完成', {
                    turn: this.state.currentTurn,
                    correctAnswer: this.state.correctAnswer
                });
                
                // 重設保護標記，允許下次調用
                this.state.isStartingNewTurn = false;
            });
        },

        handleItemClick(event) {
            // 🔧 [新增] 解鎖手機音頻（用戶首次互動時）
            this.Audio.unlockAudio();
            
            if (this.state.isAnswering) {
                Game.Debug.logUserAction('點擊被忽略（正在回答中）');
                return;
            }
            
            const clickedItem = event.target.closest('.item:not(.checked)');
            if (!clickedItem) {
                Game.Debug.logUserAction('點擊無效項目或已選項目');
                return;
            }

            const { difficulty } = this.state.settings;
            const config = this.ModeConfig[difficulty];
            
            this.state.userCountProgress++;
            const count = this.state.userCountProgress;
            clickedItem.classList.add('checked');

            // 🔧 [優化] 只在需要時更新拖曳狀態，避免不必要的DOM重繪
            if (Game.HTML5DragSystem && Game.HTML5DragSystem.isInitialized) {
                Game.HTML5DragSystem.refresh();
            }

            Game.Debug.logUserAction('點擊數數項目', {
                count,
                progress: `${count}/${this.state.correctAnswer}`,
                difficulty,
                itemIndex: clickedItem.dataset.index
            });

            // 播放音效
            this.Audio.playSound('select', difficulty, config);

            // 根據模式處理
            if (config.showNumbers) {
                Game.Debug.logGameFlow('顯示綠色打勾模式', { count, difficulty });

                const checkmarkOverlay = document.createElement('div');
                checkmarkOverlay.className = 'item-checkmark-overlay';
                checkmarkOverlay.textContent = '✓';
                clickedItem.appendChild(checkmarkOverlay);
                
                // 檢查是否完成計數
                if (count === this.state.correctAnswer) {
                    Game.Debug.logGameFlow('計數完成，最後一個數字', {
                        userCount: count,
                        correctAnswer: this.state.correctAnswer,
                        difficulty
                    });
                    
                    this.state.isAnswering = true;
                    
                    // 簡單和普通模式：先播放最後數字的語音，完成後立即進入答題階段
                    this.Speech.speak('itemCount', difficulty, config, { count: count }, () => {
                        Game.Debug.logGameFlow('最後數字語音播放完成，立即進入答題階段');
                        this.finishCountingPhase();
                    });
                } else {
                    // 不是最後一個數字，正常播放數數語音
                    this.Speech.speak('itemCount', difficulty, config, { count: count });
                }
            } else {
                Game.Debug.logGameFlow('困難模式淡化效果', { count });
                // 困難模式：淡化並顯示勾勾
                clickedItem.classList.add('faded');
                
                // 檢查是否完成計數
                if (count === this.state.correctAnswer) {
                    Game.Debug.logGameFlow('計數完成，準備進入答題階段', {
                        userCount: count,
                        correctAnswer: this.state.correctAnswer
                    });
                    
                    this.state.isAnswering = true;
                    const delay = (config.timing.numberDisplayDelay || 100) + 500;
                    
                    Game.Debug.logGameFlow('設定計數完成延遲', { delay });
                    Game.TimerManager.setTimeout(() => this.finishCountingPhase(), delay, 'turnTransition');
                }
            }
        },

        finishCountingPhase() {
            const { difficulty } = this.state.settings;
            const config = this.ModeConfig[difficulty];
            
            if (config.autoShowTotal) {
                // 簡單模式：先播放音效，然後彈跳視窗和語音
                Game.Debug.logGameFlow('簡單模式：播放音效並顯示反饋彈跳視窗', {
                    correctAnswer: this.state.correctAnswer
                });

                // 🔧 [Bug修復] 簡單模式每題完成計為正確，更新分數
                this.state.score += 10;

                // 播放音效
                this.Audio.playSound('correct', difficulty, config);
                this.startFireworksAnimation();
                
                // 顯示反饋彈跳視窗
                this.showFeedbackPopup(true);
                
                // 播放「數完了，總共有X個，進入下一題」語音，播放完成後自動進入下一題
                const isLastQuestion = this.state.currentTurn >= this.state.totalTurns;
                const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';
                this.Speech.speak('totalComplete', difficulty, config,
                    { total: this.state.correctAnswer, _suffix: endingText }, () => {
                        Game.Debug.logGameFlow('簡單模式語音播放完成，自動進入下一題', { delay: config.timing.nextQuestionDelay });
                        
                        // 關閉反饋彈跳視窗
                        if (this.closeFeedbackPopup) {
                            this.closeFeedbackPopup();
                            this.closeFeedbackPopup = null;
                        }
                        
                        // 自動進入下一題
                        Game.TimerManager.setTimeout(() => this.startNewTurn(), config.timing.nextQuestionDelay, 'turnTransition');
                    }
                );
            } else if (config.requireAnswer && config.useNumberInput) {
                // 困難模式：先顯示輸入提示框，第一次出現時播放語音
                this.showInputPromptBox(difficulty, config, true);
            } else if (config.requireAnswer) {
                // 普通模式：選擇題
                this.Speech.speak('chooseAnswer', difficulty, config, {}, () => {
                    this.renderOptions();
                });
            }
        },

        renderOptions() {
            const { difficulty, countingRange } = this.state.settings;
            const config = this.ModeConfig[difficulty];
            const rangeConfig = this.gameData.countingRanges[countingRange];
            const options = [this.state.correctAnswer];
            
            // 重設 isAnswering 狀態，允許用戶點擊選項
            Game.Debug.logState('重設答題狀態', 
                { isAnswering: this.state.isAnswering }, 
                { isAnswering: false }
            );
            this.state.isAnswering = false;
            
            // 🔧 [Bug修復] 檢查範圍是否足夠產生所需選項數量，防止無限迴圈
            const rangeSize = rangeConfig.maxItems - rangeConfig.minItems + 1;
            const actualOptionsCount = Math.min(config.optionsCount, rangeSize);

            Game.Debug.logGameFlow('生成選項', {
                correctAnswer: this.state.correctAnswer,
                optionsCount: config.optionsCount,
                actualOptionsCount: actualOptionsCount,
                rangeSize: rangeSize,
                range: `${rangeConfig.minItems}-${rangeConfig.maxItems}`
            });

            // 🔧 [Bug修復] 加入嘗試次數上限，防止無限迴圈
            let attempts = 0;
            const maxAttempts = actualOptionsCount * 20;

            while (options.length < actualOptionsCount && attempts < maxAttempts) {
                const wrongOption = this.getRandomInt(rangeConfig.minItems, rangeConfig.maxItems);
                if (!options.includes(wrongOption)) options.push(wrongOption);
                attempts++;
            }
            this.shuffleArray(options);

            Game.Debug.logGameFlow('選項生成完成', { options });

            // 將選項顯示在 options-area
            if (this.elements.optionsArea) {
                Game.Debug.logTemplate('optionsButtons', { options });
                const optionsHTML = this.HTMLTemplates.optionsButtons(options);
                Game.Debug.logUI('生成的選項HTML', 'options-area', { 
                    html: optionsHTML,
                    options 
                });
                
                this.elements.optionsArea.innerHTML = optionsHTML;
                
                // 驗證HTML是否正確插入
                const insertedButtons = this.elements.optionsArea.querySelectorAll('.payment-btn');
                Game.Debug.logUI('選項按鈕已插入', 'options-area', { 
                    buttonCount: insertedButtons.length,
                    buttons: Array.from(insertedButtons).map(btn => ({
                        text: btn.textContent,
                        value: btn.dataset.value,
                        className: btn.className
                    }))
                });
                
                // 測試事件綁定
                if (insertedButtons.length > 0) {
                    Game.Debug.logUI('選項按鈕存在，事件應該可以觸發');
                } else {
                    Game.Debug.logError('選項按鈕未找到', 'renderOptions');
                }
                
            } else {
                Game.Debug.logError('找不到options-area元素', 'renderOptions');
            }
        },

        handleAnswerClick(event) {
            Game.Debug.logUserAction('選項點擊事件觸發', {
                target: event.target.tagName,
                targetClass: event.target.className,
                isAnswering: this.state.isAnswering
            });
            
            const selectedBtn = event.target.closest('.payment-btn');
            if (!selectedBtn) {
                Game.Debug.logUserAction('未找到payment-btn元素', {
                    target: event.target,
                    closest: event.target.closest('.payment-btn')
                });
                return;
            }
            
            if (this.state.isAnswering) {
                Game.Debug.logUserAction('目前正在答題中，忽略點擊');
                return;
            }
            
            const selectedValue = parseInt(selectedBtn.dataset.value);
            Game.Debug.logUserAction('選項已選擇', {
                selectedValue,
                buttonText: selectedBtn.textContent,
                correctAnswer: this.state.correctAnswer
            });
            
            this.checkAnswer(selectedValue);
        },

        checkAnswer(selectedValue) {
            const { difficulty, testMode } = this.state.settings;
            const config = this.ModeConfig[difficulty];
            const isCorrect = selectedValue === this.state.correctAnswer;

            Game.Debug.group('檢查答案', () => {
                Game.Debug.logUserAction('提交答案', {
                    selectedValue,
                    correctAnswer: this.state.correctAnswer,
                    isCorrect,
                    difficulty,
                    testMode
                });

                this.state.isAnswering = true;

                if (isCorrect) {
                    Game.Debug.logGameFlow('答案正確', { selectedValue, correctAnswer: this.state.correctAnswer });
                    
                    // 答對處理
                    const oldScore = this.state.score;
                    this.state.score += 10;
                    Game.Debug.logState('分數更新', { score: oldScore }, { score: this.state.score });
                    if (difficulty !== 'easy') {
                        this.updateProgress();
                    }
                    
                    // 記錄當前答案作為下一題的參考（避免重複）
                    this.state.lastAnswer = this.state.correctAnswer;
                    Game.Debug.logGameFlow('記錄上一題答案', { 
                        lastAnswer: this.state.lastAnswer,
                        nextQuestionWillAvoid: this.state.lastAnswer
                    });
                    
                    this.Audio.playSound('correct', difficulty, config);
                    this.startFireworksAnimation();
                    
                    // 顯示可愛的正確反饋彈跳視窗
                    this.showFeedbackPopup(true);
                    
                    // 判斷是否為最後一題（currentTurn 已在 startNewTurn 遞增，直接比對即可）
                    const isLastQuestion = this.state.currentTurn >= this.state.totalTurns;
                    const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';

                    // 播放語音，語音結束後直接進入下一題
                    this.Speech.speak('correct', difficulty, config, { answer: this.state.correctAnswer, _suffix: endingText }, () => {
                        Game.Debug.logGameFlow('語音播放完成，關閉彈跳視窗並準備進入下一題', { delay: config.timing.nextQuestionDelay });
                        
                        // 關閉反饋彈跳視窗
                        if (this.closeFeedbackPopup) {
                            this.closeFeedbackPopup();
                            this.closeFeedbackPopup = null;
                        }
                        
                        // 直接進入下一題，不回到數數畫面
                        Game.TimerManager.setTimeout(() => this.startNewTurn(), config.timing.nextQuestionDelay, 'turnTransition');
                    });
                } else {
                    Game.Debug.logGameFlow('答案錯誤', { 
                        selectedValue, 
                        correctAnswer: this.state.correctAnswer,
                        testMode,
                        allowRetry: config.allowRetry
                    });
                    
                    // 答錯處理
                    const shouldRetry = testMode === 'retry' && config.allowRetry;
                
                    if (shouldRetry) {
                        Game.Debug.logGameFlow('允許重試', { testMode, allowRetry: config.allowRetry });
                        
                        this.Audio.playSound('error', difficulty, config);
                        
                        // 顯示可愛的錯誤反饋彈跳視窗（可重試），同時播放語音
                        this.showFeedbackPopup(false, () => {
                            Game.Debug.logState('允許重新回答', { isAnswering: true }, { isAnswering: false });
                            this.state.isAnswering = false; // 允許重新回答
                            
                            // 🔧 [修正] 重試時恢復圖示的交互狀態
                            this.resetItemsForRetry();
                            
                            if (config.useNumberInput) {
                                Game.Debug.logUI('重新顯示輸入提示框', 'input-prompt-box');
                                // 困難模式重新顯示輸入提示框（重試時不播放語音）
                                this.showInputPromptBox(difficulty, config, false);
                            }
                        });
                        
                        // 同時播放語音（不等待彈跳視窗callback）
                        this.Speech.speak('incorrect', difficulty, config, {});
                    } else {
                        Game.Debug.logGameFlow('不允許重試，顯示正確答案', { 
                            testMode, 
                            allowRetry: config.allowRetry,
                            correctAnswer: this.state.correctAnswer 
                        });
                        
                        this.Audio.playSound('error', difficulty, config);
                        
                        // 記錄當前答案作為下一題的參考（避免重複）
                        this.state.lastAnswer = this.state.correctAnswer;
                        Game.Debug.logGameFlow('記錄上一題答案（答錯情況）', {
                            lastAnswer: this.state.lastAnswer,
                            nextQuestionWillAvoid: this.state.lastAnswer
                        });

                        // 判斷是否為最後一題（currentTurn 已在 startNewTurn 遞增，直接比對即可）
                        const isLastQuestion = this.state.currentTurn >= this.state.totalTurns;
                        const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';

                        // 顯示可愛的錯誤反饋彈跳視窗（含正確答案），同時播放語音
                        this.showFeedbackPopup(false, () => {
                            const delay = config.timing.nextQuestionDelay + 500;
                            Game.Debug.logGameFlow('準備進入下一題（答錯）', { delay });
                            Game.TimerManager.setTimeout(() => this.startNewTurn(), delay, 'turnTransition');
                        });

                        // 同時播放語音（不等待彈跳視窗callback）
                        this.Speech.speak('incorrectWithAnswer', difficulty, config,
                            { answer: this.state.correctAnswer, _suffix: endingText });
                    }
                }
            });
        },

        endGame() {
            // 🔧 [Bug修復] 防止重複調用的保護機制
            if (this.state.isEndingGame) {
                Game.Debug.logGameFlow('阻止重複遊戲結束', { isEndingGame: true });
                return;
            }
            this.state.isEndingGame = true;
            AssistClick.deactivate();

            // 🔧 [Bug修復] 清理遊戲相關的計時器
            this.TimerManager.clearByCategory('turnTransition');
            this.TimerManager.clearByCategory('feedbackPopup');

            Game.Debug.group('遊戲結束', () => {
                const { difficulty } = this.state.settings;
                const totalQuestions = this.state.totalTurns;
                const score = this.state.score;
                const correctAnswers = Math.floor(score / 10);
                const percentage = Math.round((correctAnswers / totalQuestions) * 100);

                // 學習紀錄
                window.LearningTracker?.save({ unit: 'f2', unitName: 'F2 數量與點數', series: 'F',
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
                                    <div class="achievement-item">🎯 學會順序唱數技巧</div>
                                    <div class="achievement-item">🔢 掌握數字的連續性概念</div>
                                    <div class="achievement-item">📝 建立數字順序感</div>
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
                `;

                // 🎁 綁定獎勵系統連結事件
                const rewardLink = app.querySelector('#endgame-reward-link');
                if (rewardLink) {
                    Game.EventManager.on(rewardLink, 'click', (e) => {
                        e.preventDefault();
                        if (typeof RewardLauncher !== 'undefined') {
                            RewardLauncher.open();
                        } else {
                            window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                        }
                    }, {}, 'gameUI');
                }

                this.Audio.playSound('success', null, { audioFeedback: true });
                this.triggerConfetti();
                this.Speech.speak('encouragement', difficulty, this.ModeConfig[difficulty] || {}, {});

                Game.Debug.logGameFlow('遊戲結束處理完成');
            });
        },

        // =====================================================
        // Utility Functions
        // =====================================================
        showInputPromptBox(difficulty, config, playInitialSpeech = false) {
            Game.Debug.logGameFlow('顯示困難模式輸入提示框', { difficulty, playInitialSpeech });
            
            // 重設 isAnswering 狀態，允許用戶點擊提示框
            this.state.isAnswering = false;
            
            // 先顯示獨立的提示框（靠右對齊）
            this.showHintBox();
            
            // 檢查是否已經存在數數確認框
            let existingPromptBox = document.getElementById('input-prompt-box');
            if (existingPromptBox) {
                // 如果已存在，需要重新顯示其父容器
                const container = existingPromptBox.closest('.input-prompt-container');
                if (container) {
                    container.style.display = 'flex';
                    Game.Debug.logUI('重新顯示輸入提示框容器', '.input-prompt-container');
                } else {
                    existingPromptBox.style.display = 'block';
                    Game.Debug.logUI('重新顯示現有輸入提示框', 'input-prompt-box');
                }
                // 重新對齊提示框
                Game.TimerManager.setTimeout(() => this.alignHintBoxWithPromptBox(), 50, 'ui');
                return;
            }
            
            // 在options-area或者新建一個區域顯示數數確認框
            let targetArea = this.elements.optionsArea;
            if (!targetArea) {
                // 如果沒有options-area，在item-area下方創建一個
                targetArea = document.createElement('div');
                targetArea.id = 'hard-mode-prompt-area';
                targetArea.style.cssText = 'margin-top: 20px; padding: 0 20px;';
                this.elements.itemArea.parentNode.insertBefore(targetArea, this.elements.itemArea.nextSibling);
            }
            
            // 顯示數數確認框（置中顯示）
            const promptHTML = this.HTMLTemplates.inputPromptBox(config.textTemplates.inputPrompt);
            targetArea.innerHTML = promptHTML;
            
            // 第一次出現時播放語音
            if (playInitialSpeech) {
                this.Speech.speak('inputPrompt', difficulty, config, {});
            }
            
            // 綁定數數確認框點擊事件
            const promptBox = document.getElementById('input-prompt-box');
            if (promptBox) {
                Game.EventManager.on(promptBox, 'click', () => {
                    Game.Debug.logUserAction('點擊數數確認框', { difficulty });

                    // 隱藏整個容器（但不刪除）
                    const container = promptBox.closest('.input-prompt-container');
                    if (container) {
                        container.style.display = 'none';
                    }

                    // 顯示數字輸入器，添加取消回調
                    this.showNumberInput(config.textTemplates.inputPrompt, (num) => {
                        const parsedNum = parseInt(num);
                        this.Speech.speak('inputConfirm', difficulty, config, { answer: parsedNum }, () => {
                            this.checkAnswer(parsedNum);
                        });
                        return true;
                    }, () => {
                        // 取消回調：重新顯示數數確認框容器
                        Game.Debug.logUserAction('取消數字輸入，重新顯示數數確認框');
                        if (container) {
                            container.style.display = 'flex';
                        }
                    });
                }, {}, 'gameUI');
            }
        },

        showHintBox() {
            Game.Debug.logGameFlow('顯示困難模式獨立提示框');
            
            // 檢查是否已經存在提示框
            let existingHintBox = document.getElementById('hint-box');
            if (existingHintBox) {
                Game.Debug.logUI('提示框已存在', 'hint-box');
                this.alignHintBoxWithPromptBox(); // 重新對齊
                return;
            }
            
            // 找到獨立的提示框容器區域
            const hintArea = document.getElementById('hint-area');
            if (hintArea) {
                // 顯示獨立提示框容器
                const hintHTML = this.HTMLTemplates.hintBoxContainer();
                hintArea.innerHTML = hintHTML;
                
                // 綁定提示框點擊事件
                const hintBox = document.getElementById('hint-box');
                if (hintBox) {
                    Game.EventManager.on(hintBox, 'click', () => {
                        Game.Debug.logUserAction('點擊獨立提示框', {
                            correctAnswer: this.state.correctAnswer
                        });

                        // 顯示正確答案彈窗
                        this.showAnswerReveal(this.state.correctAnswer);
                    }, {}, 'gameUI');
                }
                
                // 延遲一下讓DOM渲染完成，然後對齊
                Game.TimerManager.setTimeout(() => {
                    this.alignHintBoxWithPromptBox();
                }, 50, 'ui');
            } else {
                Game.Debug.logError('找不到hint-area元素', 'showHintBox');
            }
        },
        
        alignHintBoxWithPromptBox() {
            const promptBox = document.getElementById('input-prompt-box');
            const hintArea = document.getElementById('hint-area');
            const hintBox = document.getElementById('hint-box');
            
            if (promptBox && hintArea && hintBox) {
                // 獲取確認框的位置和尺寸
                const promptRect = promptBox.getBoundingClientRect();
                const promptContainer = promptBox.closest('.input-prompt-container');
                
                if (promptContainer) {
                    const containerRect = promptContainer.getBoundingClientRect();
                    const frameRect = hintArea.parentElement.getBoundingClientRect();
                    
                    // 計算提示框相對於unified-task-frame的位置
                    const topOffset = containerRect.top - frameRect.top;
                    const height = promptRect.height;
                    
                    // 設置提示框位置和高度
                    hintArea.style.top = topOffset + 'px';
                    hintArea.style.height = (containerRect.height) + 'px';
                    hintBox.style.height = height + 'px';
                    hintBox.style.display = 'flex';
                    hintBox.style.alignItems = 'center';
                    
                    Game.Debug.logUI('提示框已對齊', 'hint-box-alignment', {
                        topOffset: topOffset,
                        height: height,
                        containerHeight: containerRect.height
                    });
                }
            }
        },

        // 🔧 [新增] 重試時恢復圖示的交互狀態
        resetItemsForRetry() {
            Game.Debug.logUI('重試時恢復圖示交互狀態', 'resetItemsForRetry');
            
            // 重設計數進度
            this.state.userCountProgress = 0;
            
            // 移除所有圖示的選中和淡化狀態，讓它們可以重新點擊
            const items = document.querySelectorAll('.item');
            items.forEach(item => {
                item.classList.remove('checked', 'faded');
            });
            
            // 重新啟用HTML5拖曳系統
            if (Game.HTML5DragSystem && typeof Game.HTML5DragSystem.refresh === 'function') {
                Game.HTML5DragSystem.refresh();
            }
            
            // 重新啟用觸控拖曳功能
            this.setupTouchDragForItems();
            
            Game.Debug.logState('圖示狀態已重設', { 
                userCountProgress: this.state.userCountProgress,
                itemsCount: items.length
            });
        },

        setupTouchDragForItems() {
            // 確保TouchDragUtility可用並重新設定觸控拖曳
            if (window.TouchDragUtility) {
                const itemArea = document.getElementById('item-area');
                const items = document.querySelectorAll('.item:not(.checked)');
                
                if (itemArea && items.length > 0) {
                    Game.Debug.logUI('重新設定觸控拖曳功能', 'setupTouchDragForItems', {
                        itemsCount: items.length
                    });
                    
                    // 🔧 [修正] 重新設置所有圖示為可拖曳
                    items.forEach(item => {
                        item.setAttribute('data-draggable', 'true');
                    });
                    
                    // 🔧 [修正] 重新註冊TouchDragUtility（如果有HTML5DragSystem）
                    if (Game.HTML5DragSystem && typeof Game.HTML5DragSystem.setupTouchDragSupport === 'function') {
                        Game.HTML5DragSystem.setupTouchDragSupport(itemArea);
                        Game.Debug.logUI('TouchDragUtility 重新註冊完成', 'setupTouchDragForItems');
                    }
                } else {
                    Game.Debug.logUI('無法重新設定觸控拖曳：找不到itemArea或無可用圖示', 'setupTouchDragForItems', {
                        hasItemArea: !!itemArea,
                        itemsCount: items.length
                    });
                }
            } else {
                Game.Debug.logUI('TouchDragUtility 未載入，跳過觸控拖曳設定', 'setupTouchDragForItems');
            }
        },

        showAnswerReveal(correctAnswer) {
            Game.Debug.logUI('顯示答案提示彈窗', 'answer-reveal', { correctAnswer });

            // 移除現有的答案彈窗
            const existingPopup = document.getElementById('answer-reveal-popup');
            const existingBackdrop = document.getElementById('answer-reveal-backdrop');
            if (existingPopup) existingPopup.remove();
            if (existingBackdrop) existingBackdrop.remove();

            // 創建新的答案彈窗
            const popupHTML = this.HTMLTemplates.answerRevealPopup(correctAnswer);
            document.body.insertAdjacentHTML('beforeend', popupHTML);

            // 直接播放語音「正確的數量是X」
            const speechText = `正確的數量是${correctAnswer}`;
            const utterance = new SpeechSynthesisUtterance(speechText);
            if (this.Speech.voice) {
                utterance.voice = this.Speech.voice;
            }
            utterance.lang = 'zh-TW';
            utterance.rate = 1.0; // 標準語速（與F1統一）

            Game.Debug.logSpeech('播放答案提示語音', 'answerReveal', 'hard', {
                text: speechText,
                voiceName: this.Speech.voice?.name
            });

            if (this.Speech.synth && this.Speech.isReady) {
                this.Speech.synth.speak(utterance);
            }

            // 🔧 [Bug修復] 使用 TimerManager 管理自動隱藏計時器（原 raw setTimeout）
            Game.TimerManager.setTimeout(() => {
                const popup = document.getElementById('answer-reveal-popup');
                const backdrop = document.getElementById('answer-reveal-backdrop');
                if (popup) {
                    popup.style.animation = 'revealBounceOut 0.3s ease-in forwards';
                    Game.TimerManager.setTimeout(() => {
                        if (popup) popup.remove();
                        if (backdrop) backdrop.remove();
                    }, 300, 'animation');
                } else {
                    if (backdrop) backdrop.remove();
                }

                Game.Debug.logUI('答案提示彈窗自動隱藏', 'answer-reveal');
            }, 3000, 'turnTransition');

            // 🔧 [Bug修復] 使用 EventManager 管理事件監聽器
            const popup = document.getElementById('answer-reveal-popup');
            const backdrop = document.getElementById('answer-reveal-backdrop');

            const closeReveal = () => {
                Game.EventManager.removeByCategory('answerReveal');
                if (popup) popup.remove();
                if (backdrop) backdrop.remove();
            };

            if (popup) {
                Game.EventManager.on(popup, 'click', closeReveal, {}, 'answerReveal');
            }

            if (backdrop) {
                Game.EventManager.on(backdrop, 'click', closeReveal, {}, 'answerReveal');
            }
        },

        updateProgress() {
            const { currentTurn, totalTurns, score, settings } = this.state;
            const config = this.ModeConfig[settings.difficulty];
            
            Game.Debug.logState('更新進度顯示', {
                currentTurn,
                totalTurns,
                score,
                difficulty: settings.difficulty
            });
            
            if (this.elements.progressInfo && config?.textTemplates?.progressText) {
                const progressText = config.textTemplates.progressText
                    .replace('{current}', currentTurn)
                    .replace('{total}', totalTurns);
                this.elements.progressInfo.textContent = progressText;
            }
            
            if (this.elements.scoreInfo && settings.difficulty !== 'easy' && config?.textTemplates?.scoreText) {
                const scoreText = config.textTemplates.scoreText.replace('{score}', score);
                this.elements.scoreInfo.textContent = scoreText;
            }
            
            if (this.elements.gameTitle) {
                this.elements.gameTitle.textContent = this.gameData.title;
            }
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

        showEasyModeResult(totalCount) {
            if (document.getElementById('easy-result-popup')) return;
            
            const popupHTML = `
                <div id="easy-result-popup" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000; animation: fadeIn 0.3s ease;">
                    <div id="result-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 25px; text-align: center; color: white; box-shadow: 0 20px 40px rgba(0,0,0,0.3); animation: popIn 0.5s ease; max-width: 400px; position: relative;">
                        <!-- 裝飾性星星 -->
                        <div style="position: absolute; top: -10px; left: 20px; font-size: 2em; animation: sparkle 2s infinite;">⭐</div>
                        <div style="position: absolute; top: 10px; right: 30px; font-size: 1.5em; animation: sparkle 2s infinite 0.5s;">✨</div>
                        <div style="position: absolute; bottom: 20px; left: 30px; font-size: 1.8em; animation: sparkle 2s infinite 1s;">🌟</div>
                        
                        <!-- 主要內容 -->
                        <div style="font-size: 4em; margin-bottom: 20px; animation: bounce 1s ease infinite alternate;">🎉</div>
                        <h2 style="margin: 0 0 20px 0; font-size: 2.2em; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">太棒了！</h2>
                        <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 15px; margin: 20px 0;">
                            <p style="font-size: 1.8em; margin: 0; font-weight: bold;">總共有</p>
                            <div style="font-size: 3.5em; margin: 10px 0; color: #ffd700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); animation: pulse 1.5s ease infinite;">${totalCount}</div>
                            <p style="font-size: 1.8em; margin: 0; font-weight: bold;">個</p>
                        </div>
                        <!-- 語音播放完成後自動進入下一題，無需按鈕 -->
                    </div>
                </div>
                <!-- 動畫已移至 injectGlobalAnimationStyles() 集中管理 -->
            `;

            document.body.insertAdjacentHTML('beforeend', popupHTML);

            // 移除了按鈕點擊事件，改為語音播放完成後自動進入下一題
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
                        // 限制數字輸入長度，避免輸入超過30的數字
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
                                    feedbackDiv.textContent = '⚠️ 最大值不能超過30';
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

        getRandomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

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
        
        shuffleArray(array) { 
            for (let i = array.length - 1; i > 0; i--) { 
                const j = Math.floor(Math.random() * (i + 1)); 
                [array[i], array[j]] = [array[j], array[i]]; 
            } 
        },

        showFeedbackPopup(isCorrect, callback = null) {
            const { difficulty } = this.state.settings;
            const config = this.ModeConfig[difficulty];
            
            // 配置驅動的反饋訊息和表情符號
            let message, emoji;
            if (isCorrect) {
                // 答對時：所有模式都顯示正確答案
                message = config.textTemplates.correctFeedback.replace('{answer}', this.state.correctAnswer);
                emoji = '🎉';
            } else {
                // 根據是否允許重試來選擇訊息
                const { testMode } = this.state.settings;
                const shouldRetry = testMode === 'retry' && config.allowRetry;
                if (shouldRetry) {
                    // 反複作答：只顯示「答錯了，再試一次！」，不顯示正確答案
                    message = config.textTemplates.incorrectFeedback;
                    emoji = '😅';
                } else {
                    // 單次作答：顯示正確答案和「進入下一題」
                    message = config.textTemplates.incorrectWithAnswer.replace('{answer}', this.state.correctAnswer);
                    emoji = '🤔';
                }
            }
            
            Game.Debug.logUI('顯示可愛反饋彈跳視窗', 'feedback-popup', { 
                isCorrect, 
                message, 
                emoji 
            });
            
            // 移除舊的反饋視窗
            const existingPopup = document.getElementById('feedback-popup');
            const existingBackdrop = document.getElementById('feedback-backdrop');
            if (existingPopup) existingPopup.remove();
            if (existingBackdrop) existingBackdrop.remove();
            
            // 創建新的可愛彈跳視窗
            const popupHTML = this.HTMLTemplates.feedbackPopup(isCorrect, message, emoji);
            document.body.insertAdjacentHTML('beforeend', popupHTML);
            
            // 🔧 [Bug修復] 使用 EventManager 管理事件監聽器
            const popup = document.getElementById('feedback-popup');
            const backdrop = document.getElementById('feedback-backdrop');

            let callbackExecuted = false;  // 防止 callback 重複執行
            const closePopup = () => {
                Game.Debug.logUI('關閉反饋彈跳視窗', 'feedback-popup');
                Game.EventManager.removeByCategory('feedbackPopup');
                Game.TimerManager.clearByCategory('feedbackPopup');  // 清理計時器
                if (popup) popup.remove();
                if (backdrop) backdrop.remove();
                if (callback && !callbackExecuted) {  // 檢查執行狀態
                    callbackExecuted = true;
                    callback();
                }
            };

            // 點擊任意處關閉（使用 EventManager）
            if (popup) Game.EventManager.on(popup, 'click', closePopup, {}, 'feedbackPopup');
            if (backdrop) Game.EventManager.on(backdrop, 'click', closePopup, {}, 'feedbackPopup');

            // 自動關閉邏輯：答對時不自動關閉（由語音回調控制），答錯時3秒後自動關閉
            if (!isCorrect) {
                Game.TimerManager.setTimeout(closePopup, 3000, 'feedbackPopup');
            } else {
                // 答對時，設置一個全局方法供語音回調調用
                this.closeFeedbackPopup = closePopup;
            }
        },

        // =====================================================
        // 🎆 煙火動畫系統（與F4統一）
        // =====================================================
        startFireworksAnimation() {
            Game.Debug.log('animation', '🎆 開始煙火動畫');

            // 🎆 使用canvas-confetti效果（兩波）
            if (window.confetti) {
                Game.Debug.log('animation', '🎆 觸發canvas-confetti慶祝效果');
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
                }, 200, 'animation');
            } else {
                Game.Debug.warn('animation', '🎆 canvas-confetti不可用');
            }
        },

        triggerConfetti() {
            if (typeof confetti !== 'function') return;
            const duration = 2 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1001 };
            const randomInRange = (min, max) => Math.random() * (max - min) + min;
            
            const fireConfetti = () => {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return;
                const particleCount = 50 * (timeLeft / duration);
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.2, 0.8), y: Math.random() - 0.2 }
                });
                Game.TimerManager.setTimeout(fireConfetti, 250, 'confetti');
            };
            fireConfetti();
        },

        // =====================================================
        // 🎨 自訂主題圖片上傳功能 - 配置驅動 (仿a1_simulated_shopping)
        // =====================================================
        triggerImageUpload() {
            Game.Debug.log('upload', '📸 triggerImageUpload 被調用');
            Game.Debug.logUserAction('觸發圖片上傳');

            // 檢查上傳數量限制（最多8個）
            if (this.state.customItems.length >= 8) {
                alert('最多只能上傳8個圖示！');
                return;
            }

            const modal = document.getElementById('image-preview-modal');
            Game.Debug.log('upload', '📸 modal 元素:', modal);
            if (modal) {
                modal.classList.remove('show');
            }

            const fileInput = document.getElementById('custom-image');
            Game.Debug.log('upload', '📸 fileInput 元素:', fileInput);
            if (fileInput) {
                Game.Debug.log('upload', '✅ 準備觸發檔案選擇對話框');
                fileInput.click();
            } else {
                Game.Debug.error('❌ 找不到檔案輸入元素');
            }
        },

        async handleImageUpload(event) {
            Game.Debug.logUserAction('處理圖片上傳');

            const file = event.target.files[0];
            if (!file) {
                Game.Debug.logError('沒有選擇檔案');
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
                
                
                // 使用 show 類別替代 style.display
                modal.classList.add('show');
                nameInput.focus();
                
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
                imageData: this.tempImageData,
                id: Date.now() // 使用時間戳作為唯一ID
            };
            
            this.state.customItems.push(customItem);
            
            // 更新自訂主題的圖示陣列
            this.gameData.themes.custom.push(this.tempImageData);
            
            Game.Debug.logState('新增自訂圖示', null, { 
                customItems: this.state.customItems.length,
                customTheme: this.gameData.themes.custom.length 
            });
            
            // 播放語音回饋
            const { difficulty } = this.state.settings;
            const config = this.ModeConfig[difficulty] || this.ModeConfig.normal;
            const speechTemplate = config.speechTemplates?.addCustomItem || "已新增自訂圖示：{itemName}";
            const speechText = speechTemplate.replace('{itemName}', name);
            this.Speech.speak('addCustomItem', difficulty, config, { itemName: name });
            
            // 關閉模態視窗
            this.closeImagePreview();
            
            // 🔧 [優化] 只更新自訂主題設定區域，避免閃爍
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
                const imageIndex = this.gameData.themes.custom.indexOf(item.imageData);
                if (imageIndex > -1) {
                    this.gameData.themes.custom.splice(imageIndex, 1);
                }
                
                Game.Debug.logState('刪除自訂圖示', null, { 
                    customItems: this.state.customItems.length,
                    customTheme: this.gameData.themes.custom.length 
                });
                
                // 播放語音回饋
                const { difficulty } = this.state.settings;
                const config = this.ModeConfig[difficulty] || this.ModeConfig.normal;
                const speechTemplate = config.speechTemplates?.removeCustomItem || "已移除圖示：{itemName}";
                const speechText = speechTemplate.replace('{itemName}', item.name);
                this.Speech.speak('removeCustomItem', difficulty, config, { itemName: item.name });
                
                // 🔧 [優化] 只更新自訂主題設定區域，避免閃爍
                this.updateCustomThemeSettings();
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
                        <div class="custom-items-list" style="display:flex;flex-direction:row;flex-wrap:wrap;gap:10px;min-height:60px;border:1px solid #e0e0e0;border-radius:5px;padding:10px;margin:10px 0;background:white;">
                            ${this.state.customItems.map((item, index) => `
                                <div class="custom-item-row" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;border:1px solid #eee;border-radius:8px;background:#fafafa;text-align:center;width:fit-content;">
                                    <img src="${item.imageData}" alt="${item.name}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;">
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
                                    <div class="preview-section">
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

        closeImagePreview() {
            Game.Debug.logUserAction('關閉圖片預覽');
            
            const modal = document.getElementById('image-preview-modal');
            if (modal) {
                modal.classList.remove('show');
            }
            
            // 清空臨時圖片資料
            this.tempImageData = null;
            this.tempFileSize = null;
        },

        // =====================================================================
        // HTML5 拖曳系統 - 整合版本
        // =====================================================================
        HTML5DragSystem: {
            isInitialized: false,
            dragState: {
                dragElement: null,
                startIndex: null,
                startContainer: null,
                placeholder: null
            },
            boundHandlers: {},

            /**
             * 初始化 HTML5 拖曳系統
             * @param {string} difficulty - 難度等級
             */
            initialize(difficulty) {
                if (this.isInitialized) {
                    Game.Debug.warn('init', '🔄 F2 HTML5 拖曳系統已初始化，跳過重複初始化');
                    return;
                }

                const itemArea = document.getElementById('item-area');
                if (!itemArea) {
                    Game.Debug.error('❌ 找不到 item-area 元素，跳過拖曳設置');
                    return;
                }

                Game.Debug.log('init', '🎯 初始化 F2 HTML5 拖曳系統', { difficulty });

                // 設置容器為可拖放區域
                this.setupDropZone(itemArea);

                // 設置所有可拖曳項目
                this.setupDraggableItems(itemArea);

                // 註冊 TouchDragUtility 支援
                this.setupTouchDragSupport(itemArea);

                this.isInitialized = true;
                Game.Debug.log('init', '✅ F2 HTML5 拖曳系統初始化完成');
            },

            /**
             * 設置放置區域
             */
            setupDropZone(container) {
                container.addEventListener('dragover', this.handleDragOver.bind(this));
                container.addEventListener('drop', this.handleDrop.bind(this));
            },

            /**
             * 設置可拖曳項目
             */
            setupDraggableItems(container) {
                // 使用事件委派處理動態添加的項目
                container.addEventListener('dragstart', this.handleDragStart.bind(this));
                container.addEventListener('dragend', this.handleDragEnd.bind(this));
                
                // 為現有項目添加 draggable 屬性
                this.updateDraggableItems(container);
            },

            /**
             * 更新項目的可拖曳狀態
             */
            updateDraggableItems(container) {
                const items = container.querySelectorAll('.item, .counting-item, [data-clickable]');
                items.forEach(item => {
                    // 只有未選中的項目可拖曳（符合原 SortableJS filter 邏輯）
                    const isDraggable = !item.classList.contains('checked');
                    const currentDraggable = item.draggable;
                    const hasDataDraggable = item.hasAttribute('data-draggable');

                    // 🔧 [優化] 只在狀態改變時更新DOM，避免不必要的重繪
                    if (currentDraggable !== isDraggable) {
                        item.draggable = isDraggable;
                    }

                    if (isDraggable && !hasDataDraggable) {
                        item.setAttribute('data-draggable', 'true');
                    } else if (!isDraggable && hasDataDraggable) {
                        item.removeAttribute('data-draggable');
                    }
                });
            },

            /**
             * 設置 TouchDragUtility 手機支援
             */
            setupTouchDragSupport(container) {
                if (!window.TouchDragUtility) {
                    Game.Debug.warn('init', '⚠️ TouchDragUtility 未載入，跳過手機拖曳支援');
                    return;
                }

                try {
                    // 註冊可拖曳項目
                    // 🔧 [調試] 檢查註冊前的狀態
                    const draggableCount = container.querySelectorAll('[data-draggable="true"]').length;
                    Game.Debug.log('drag', '🔧 TouchDragUtility 註冊前檢查:', {
                        container: container.id,
                        draggableCount: draggableCount,
                        hasUtility: !!window.TouchDragUtility
                    });

                    window.TouchDragUtility.registerDraggable(
                        container,
                        '[data-draggable="true"]',
                        {
                            onDragStart: (element, event) => {
                                Game.Debug.log('drag', '📱 TouchDrag 開始:', element);
                                // 觸發 HTML5 拖曳開始邏輯
                                this.simulateDragStart(element);
                                return true; // 允許拖曳
                            },
                            onDrop: (element, dropZone, event) => {
                                Game.Debug.log('drag', '📱 TouchDrag 放下:', element, dropZone);
                                
                                // 新增：F2專用放置框檢測
                                const itemInfo = {
                                    itemClass: element.className,
                                    itemIndex: element.dataset.index,
                                    dropZoneId: dropZone.id,
                                    dropZoneClass: dropZone.className
                                };
                                
                                if (dropZone.id === 'item-area') {
                                    Game.Debug.logPlacementDrop('手機端：物品放入計數區域', 'item-area', itemInfo);
                                } else if (element.classList.contains('counting-item') || element.classList.contains('item')) {
                                    Game.Debug.logPlacementDrop('手機端：計數物品拖曳', 'counting-item-drag', itemInfo);
                                } else {
                                    Game.Debug.logPlacementDrop('手機端：物品放入未知區域', 'unknown', itemInfo);
                                }
                                
                                // 觸發 HTML5 放下邏輯
                                this.simulateDrop(element, dropZone, event);
                            },
                            onDragEnd: (element, event) => {
                                Game.Debug.log('drag', '📱 TouchDrag 結束:', element);
                                // 觸發 HTML5 拖曳結束邏輯
                                this.simulateDragEnd(element);
                            }
                        }
                    );

                    // 註冊放置區域
                    window.TouchDragUtility.registerDropZone(
                        container,
                        (dragElement, dropZone) => {
                            // 驗證是否為有效的放置目標
                            return dropZone.id === 'item-area';
                        }
                    );

                    // 🔧 [調試] 確認註冊成功
                    Game.Debug.log('init', '✅ TouchDragUtility 註冊完成', {
                        container: container.id,
                        registeredHandlers: window.TouchDragUtility.dragStartHandlers.size,
                        targetSelector: '[data-draggable="true"]'
                    });
                } catch (error) {
                    Game.Debug.error('❌ TouchDragUtility 註冊失敗:', error);
                }
            },

            /**
             * 處理拖曳開始事件
             */
            handleDragStart(event) {
                const item = event.target;
                
                // 檢查是否為可拖曳項目
                if (!item.hasAttribute('data-draggable')) {
                    event.preventDefault();
                    return;
                }

                Game.Debug.log('drag', '🎯 HTML5 拖曳開始', {
                    element: item.className,
                    id: item.dataset.id || 'no-id'
                });

                // 保存拖曳狀態
                this.dragState.dragElement = item;
                this.dragState.startIndex = this.getElementIndex(item);
                this.dragState.startContainer = item.parentElement;

                // 設置拖曳資料
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/html', item.outerHTML);

                // 🆕 建立去背拖曳預覽（桌面端）
                const _dragImg = item.querySelector('img');
                const _ghost = _dragImg ? _dragImg.cloneNode(true) : document.createElement('span');
                if (!_dragImg) {
                    const _emojiEl = item.querySelector('.emoji-icon') || item;
                    _ghost.textContent = _emojiEl.textContent.trim();
                    _ghost.style.fontSize = window.getComputedStyle(item).fontSize;
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

                // 添加拖曳樣式
                item.classList.add('dragging');
                
                // 創建佔位符
                this.createPlaceholder(item);

                // 解鎖音頻（對應原 SortableJS 功能）
                if (Game.Audio) {
                    Game.Audio.unlockAudio();
                }
            },

            /**
             * 處理拖曳懸停事件
             */
            handleDragOver(event) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';

                const afterElement = this.getDragAfterElement(event.currentTarget, event.clientY);
                const dragElement = this.dragState.dragElement;
                
                if (afterElement == null) {
                    event.currentTarget.appendChild(this.dragState.placeholder);
                } else {
                    event.currentTarget.insertBefore(this.dragState.placeholder, afterElement);
                }
            },

            /**
             * 處理放下事件
             */
            handleDrop(event) {
                event.preventDefault();

                const dragElement = this.dragState.dragElement;
                if (!dragElement) return;

                Game.Debug.log('drag', '🎯 HTML5 拖曳放下', {
                    from: this.dragState.startContainer.id,
                    to: event.currentTarget.id,
                    oldIndex: this.dragState.startIndex,
                    newIndex: this.getPlaceholderIndex()
                });

                // 將拖曳元素插入到佔位符位置
                if (this.dragState.placeholder && this.dragState.placeholder.parentElement) {
                    this.dragState.placeholder.parentElement.insertBefore(dragElement, this.dragState.placeholder);
                }

                // 觸發點擊邏輯（對應原 SortableJS onEnd 功能）
                this.triggerClickLogicIfNeeded(dragElement);

                // 清理
                this.cleanupDrag();
            },

            /**
             * 處理拖曳結束事件
             */
            handleDragEnd(event) {
                Game.Debug.log('drag', '🎯 HTML5 拖曳結束');
                this.cleanupDrag();
            },

            /**
             * 創建佔位符元素
             */
            createPlaceholder(element) {
                const placeholder = element.cloneNode(false);
                placeholder.classList.add('drag-placeholder');
                placeholder.style.opacity = '0.5';
                placeholder.style.border = '2px dashed #007bff';
                placeholder.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
                placeholder.innerHTML = '';
                
                this.dragState.placeholder = placeholder;
            },

            /**
             * 獲取元素在父容器中的索引
             */
            getElementIndex(element) {
                return Array.from(element.parentElement.children).indexOf(element);
            },

            /**
             * 獲取佔位符的索引位置
             */
            getPlaceholderIndex() {
                if (!this.dragState.placeholder || !this.dragState.placeholder.parentElement) {
                    return -1;
                }
                return Array.from(this.dragState.placeholder.parentElement.children).indexOf(this.dragState.placeholder);
            },

            /**
             * 獲取拖曳後應插入的元素位置
             */
            getDragAfterElement(container, y) {
                const draggableElements = [...container.querySelectorAll('[data-draggable="true"]:not(.dragging)')];
                
                return draggableElements.reduce((closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = y - box.top - box.height / 2;
                    
                    if (offset < 0 && offset > closest.offset) {
                        return { offset: offset, element: child };
                    } else {
                        return closest;
                    }
                }, { offset: Number.NEGATIVE_INFINITY }).element;
            },

            /**
             * 觸發點擊邏輯（對應原 SortableJS 功能）
             */
            triggerClickLogicIfNeeded(draggedItem) {
                if (!draggedItem || draggedItem.classList.contains('checked')) {
                    return;
                }

                // 模擬點擊事件來觸發計數邏輯（與原 SortableJS 邏輯相同）
                const mockEvent = {
                    target: draggedItem,
                    type: 'drag-click',
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };

                if (Game && typeof Game.handleItemClick === 'function') {
                    Game.Debug.log('drag', '🎯 觸發拖曳點擊邏輯');
                    Game.handleItemClick(mockEvent);
                }
            },

            /**
             * TouchDragUtility 模擬方法
             */
            simulateDragStart(element) {
                const syntheticEvent = new Event('dragstart', { bubbles: true, cancelable: true });
                Object.defineProperty(syntheticEvent, 'target', { value: element });
                element.dispatchEvent(syntheticEvent);
            },

            simulateDrop(element, dropZone, originalEvent) {
                const syntheticEvent = new Event('drop', { bubbles: true, cancelable: true });
                Object.defineProperty(syntheticEvent, 'target', { value: dropZone });
                Object.defineProperty(syntheticEvent, 'dataTransfer', {
                    value: {
                        effectAllowed: 'move',
                        dropEffect: 'move',
                        getData: () => element.outerHTML,
                        setData: () => {}
                    }
                });
                dropZone.dispatchEvent(syntheticEvent);
            },

            simulateDragEnd(element) {
                const syntheticEvent = new Event('dragend', { bubbles: true, cancelable: true });
                Object.defineProperty(syntheticEvent, 'target', { value: element });
                element.dispatchEvent(syntheticEvent);
            },

            /**
             * 清理拖曳狀態
             */
            cleanupDrag() {
                // 移除拖曳樣式
                if (this.dragState.dragElement) {
                    this.dragState.dragElement.classList.remove('dragging');
                }

                // 移除佔位符
                if (this.dragState.placeholder && this.dragState.placeholder.parentElement) {
                    this.dragState.placeholder.remove();
                }

                // 重置狀態
                this.dragState = {
                    dragElement: null,
                    startIndex: null,
                    startContainer: null,
                    placeholder: null
                };
            },

            /**
             * 更新可拖曳項目狀態（在遊戲狀態變更時調用）
             */
            refresh() {
                const itemArea = document.getElementById('item-area');
                if (itemArea) {
                    this.updateDraggableItems(itemArea);
                }
            },

            /**
             * 🔧 [新增] SortableJS載入失敗時的TouchDragUtility備案方案
             */
            initTouchDragFallback(container) {
                Game.Debug.logUI('初始化TouchDragUtility備案方案', 'initTouchDragFallback');

                if (!window.TouchDragUtility) {
                    Game.Debug.logError('TouchDragUtility 也未載入，無法提供拖曳支援', 'initTouchDragFallback');
                    return;
                }

                // 確保所有圖示都設定為可拖曳
                const items = container.querySelectorAll('.item');
                items.forEach(item => {
                    item.setAttribute('data-draggable', 'true');
                });

                // 使用HTML5DragSystem的TouchDragUtility支援
                if (Game.HTML5DragSystem && typeof Game.HTML5DragSystem.setupTouchDragSupport === 'function') {
                    Game.Debug.logUI('正在註冊TouchDragUtility', 'initTouchDragFallback', {
                        container: container.id,
                        itemsWithDataDraggable: container.querySelectorAll('[data-draggable="true"]').length,
                        hasTouchDragUtility: !!window.TouchDragUtility
                    });
                    Game.HTML5DragSystem.setupTouchDragSupport(container);
                    Game.Debug.logUI('TouchDragUtility註冊完成', 'initTouchDragFallback');
                } else {
                    Game.Debug.logError('HTML5DragSystem.setupTouchDragSupport 方法不可用', 'initTouchDragFallback');
                }

                // 標記為已初始化（即使SortableJS失敗）
                this.isInitialized = true;

                Game.Debug.logUI('TouchDragUtility備案方案初始化完成', 'initTouchDragFallback', {
                    itemsCount: items.length,
                    hasTouchUtility: !!window.TouchDragUtility
                });
            },

            /**
             * 清理系統
             */
            cleanup() {
                Game.Debug.log('init', '🧹 清理 F2 HTML5 拖曳系統');

                this.cleanupDrag();

                // 移除事件監聯器
                const itemArea = document.getElementById('item-area');
                if (itemArea) {
                    itemArea.removeEventListener('dragstart', this.handleDragStart);
                    itemArea.removeEventListener('dragend', this.handleDragEnd);
                    itemArea.removeEventListener('dragover', this.handleDragOver);
                    itemArea.removeEventListener('drop', this.handleDrop);
                }

                // 🔧 [性能優化] 清理 TouchDragUtility 所有註冊的處理器
                if (window.TouchDragUtility) {
                    try {
                        window.TouchDragUtility.cleanupAll();
                        Game.Debug.log('init', '🧹 TouchDragUtility 完全清理完成');
                    } catch (error) {
                        Game.Debug.warn('init', '⚠️ TouchDragUtility 清理警告:', error);
                    }
                }

                this.isInitialized = false;
                Game.Debug.log('init', '✅ F2 HTML5 拖曳系統清理完成');
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
            // F2 easy: find all unchecked/uncounted items
            const items = Array.from(document.querySelectorAll('.item:not(.checked):not(.counted), .counting-item-easy:not(.checked)'));
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
            if (this._step < this._queue.length) {
                window.setTimeout(() => {
                    if (this._enabled && this._step < this._queue.length) {
                        this._highlight(this._queue[this._step].target);
                    }
                }, 200);
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
                    if (this._enabled && document.querySelector('.item, .counting-item-easy')) {
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

    // 自動初始化遊戲
    Game.init();
});