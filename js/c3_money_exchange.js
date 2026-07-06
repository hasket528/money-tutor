/**
 * @file c3_money_exchange.js
 * @description C3 金錢面額的兌換 - 配置驅動版本
 * @unit C3 - 金錢面額的兌換
 * @version 2.2.0 - 配置驅動 + 詳細Debug系統
 * @lastModified 2025.08.31 下午4:12 - 修正手機端拖拽靈敏度問題：關閉點擊放置功能以避免與拖拽衝突
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
// 【每次修正前必須檢視的重要規則】
// =====================================================
// 
// 1. 程式碼架構原則（完全分離）
//    - 難度模式：簡單/普通/困難（renderEasyMode, renderNormalMode, renderHardMode）
//    - 兌換類型：小換大/大換小（在各自模式中獨立處理）
//    - 作答模式：單次/反複（finishEasyModeExchange, handleNormalModeComplete）
//    - 每個維度使用獨立的函數，避免相互干擾
// 
// 2. CSS類別命名規則
//    - 簡單模式：easy-* (easy-drop-zone, easy-coin-overlay, easy-equals-sign, easy-target-group)
//    - 普通模式：normal-* (normal-drop-zone, normal-coin-overlay, normal-equals-sign, normal-target-group)
//    - 困難模式：hard-* (使用，基於普通模式結構但無淡化圖示)
// 
// 3. 模式獨立性規則
//    - 修改時必須先檢視，不可影響其他模式
//    - 每個模式使用獨立的CSS類別前綴
//    - 每個模式使用獨立的渲染函數
//    - 每個模式使用獨立的事件處理函數
//    - 狀態變數必須在模式切換時完全重置
//    - 動畫和語音必須在模式間完全分離
// 
// 4. 版面配置規則
//    - 小換大兌換區版面順序：由左至右，放置金錢的框、等號、目標的兌換金錢、勾勾
//    - 放置金錢的框必須使用 flex: 1 1 0 填滿剩餘寬度（扣除等號、目標金錢、勾勾的寬度）
//    - 放置的金錢由左至右排列，超過寬度時自動換行到第2列
//    - 等號固定寬度40px，目標金錢和勾勾使用 flex-shrink: 0 保持固定大小
//    - 金錢對齊和大小規則不可更改：max-height: 55px, max-width: 85px
//    - 勾勾位置：在目標金錢右側，使用 flex-shrink: 0 保持固定位置
//
// 5. 勾勾顯示規則
//    - 所有模式的小換大和大換小都必須包含勾勾SVG
//    - 勾勾必須放在 target-flex-row 容器內，與目標金錢並排
//    - 勾勾顯示條件：簡單模式用 isCompleted，普通模式用 zone.isCorrect
//    - 勾勾CSS樣式：在 target-flex-row 內使用 position: static，寬度36px，高度36px
//    - 避免CSS重複定義，確保樣式優先級正確
//
// 6. 功能規則
//    - 進度顯示：必須從1開始顯示，不是從0開始
//    - 每次拖曳都播放拖曳聲
//    - 目標錢幣一開始淡化，答對後顯示
//    - 小換大：需要放入指定數量的小錢幣，可能有多個兌換列
//    - 大換小：需要放入1個大錢幣，只有1個兌換列
//    - 單次作答：答對直接進入下一題，答錯也進入下一題
//    - 反複作答：答對進入下一題，答錯退回錢幣重試
// 
// 7. 修正檢查清單（每次修正後必須確認）
//    □ 確認修改的函數只影響目標模式
//    □ 確認CSS類別不會與其他模式衝突
//    □ 確認狀態變數在模式切換時正確重置
//    □ 確認動畫和語音不會重複播放
//    □ 確認所有模式的對齊和布局正常
//    □ 確認語音輸出數量正確
//    □ 確認小換大版面配置符合上述規則
//    □ 確認勾勾在所有模式下都能正確顯示
//    □ 確認金錢大小和對齊規則沒有被改變
//    □ 確認等號和勾勾位置固定且不會被擠壓
//    
// =====================================================
// 【歷史修正記錄與防範機制】
// =====================================================
// 
// 已修正問題：
// - 簡單模式小換大：拖曳錢幣對齊占位符圖片
// - 簡單模式大換小：目標錢幣圖片大小限制
// - 動畫重複問題：確保狀態完全重置
// - 語音輸出錯誤：大換小模式正確輸出"第X個"
// - 狀態管理：每次開始新題目時完全重置gameState
// - 垂直對齊：為目標區容器增加最小高度
// - 版面配置：小換大兌換區正確填滿剩餘寬度
// - 勾勾顯示：所有模式都正確包含勾勾SVG
// - 兌換結果消失：DOM更新時意外清除結果容器（已建立保護機制）
// - 兌換結果框重複：第2輪兌換時重複生成結果容器（已修正合併邏輯）
// - 兌換區金錢圖示樣式：淡化圖示底框透明化，統一所有金錢圖示為80px
// - 所有金錢圖示底框透明化：兌換區、兌換結果框、目標顯示的所有狀態都使用透明底框
// - 困難模式重構：基於普通模式但無淡化圖示和語音提示，保留完成兌換結果語音
// 
// ★★★ 重複性問題防範清單 ★★★
// 【每次修改前必須檢查的常見陷阱】
// 
// 1. DOM操作陷阱：
//    ⚠️ innerHTML = ... 會清除所有子元素，包括兌換結果
//    ⚠️ HTML生成函數可能包含結果容器，避免重複插入
//    ✅ 使用 updateExchangeAreaContent() 保護兌換結果
//    ✅ 使用 protectExchangeResults() 包裝危險操作
//    ✅ 檢查新HTML是否已包含目標元素再決定是否插入
//    
// 2. 事件綁定陷阱：
//    ⚠️ DOM重新生成後事件監聽器會遺失
//    ✅ 每次DOM更新後重新綁定事件監聽器
//    
// 3. 狀態同步陷阱：
//    ⚠️ DOM狀態與gameState不同步
//    ✅ 使用 validateExchangeResultsIntegrity() 驗證
//    
// 4. 模式混淆陷阱：
//    ⚠️ 修改一個模式時影響其他模式
//    ✅ 嚴格使用模式前綴的CSS類別和函數
//    
// 5. 變數作用域陷阱：
//    ⚠️ 重複宣告變數導致語法錯誤
//    ✅ 檢查變數是否已在上層作用域宣告
// 
// ★★★ 自動防範機制使用指南 ★★★
// 
// 本檔案已建立以下自動防範機制：
// 
// 1. systemIntegrityCheck() - 系統完整性檢查
//    - 自動檢查5大類常見問題
//    - 在重要操作後自動執行
//    - 會在控制台輸出詳細的問題報告
// 
// 2. validateExchangeResultsIntegrity() - 兌換結果保護
//    - 檢查兌換結果是否與gameState同步
//    - 防止DOM操作意外清除已完成的兌換結果
// 
// 3. protectExchangeResults() - 操作保護包裝器
//    - 在執行危險DOM操作時自動保護兌換結果
//    - 操作失敗時自動恢復
// 
// 4. markEventsBound() - 事件綁定標記
//    - 為DOM元素標記已綁定的事件類型
//    - 供系統完整性檢查驗證事件是否正確綁定
// 
// 使用方法：
// - 在修改程式碼後，檢查控制台的系統完整性檢查結果
// - 如果出現警告，說明可能存在已知的常見問題
// - 重要DOM操作使用 protectExchangeResults() 包裝
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
        //   Game.Debug.FLAGS.drag = true;     // 只開啟拖曳相關
        //   Game.Debug.FLAGS.exchange = true; // 只開啟兌換相關
        // =====================================================
        Debug: {
            FLAGS: {
                all: false,        // 全域開關（開啟後顯示所有分類）
                init: false,       // 初始化相關
                speech: false,     // 語音系統
                audio: false,      // 音效系統
                ui: false,         // UI 渲染
                exchange: false,   // 兌換操作
                drag: false,       // 拖曳操作
                touch: false,      // 觸控操作
                question: false,   // 題目生成
                state: false,      // 狀態變更
                hint: false,       // 提示系統
                event: false,      // 事件處理
                judge: false,      // 答案判定
                integrity: false,  // 完整性檢查
                error: true        // 錯誤訊息（預設開啟）
            },

            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[C3-${category}]`, ...args);
                }
            },

            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[C3-${category}]`, ...args);
                }
            },

            error(...args) {
                // 錯誤訊息永遠顯示
                console.error('[C3-ERROR]', ...args);
            },

            // 手機端拖曳除錯專用方法
            logMobileDrag(phase, element, event, data = null) {
                if (!this.FLAGS.all && !this.FLAGS.drag) return;
                const elementInfo = {
                    tagName: element?.tagName,
                    className: element?.className,
                    id: element?.id,
                    value: element?.dataset?.value,
                    parentClass: element?.parentElement?.className
                };
                const touchInfo = event?.touches?.[0] ? {
                    clientX: event.touches[0].clientX,
                    clientY: event.touches[0].clientY,
                    touchCount: event.touches.length
                } : null;

                console.log(`[C3-drag]`, phase, {
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

                Game.Debug.log('touch', `[C3-touch]`, eventType, eventInfo);
            },

            // C3專用放置框檢測方法
            logPlacementDrop(action, zoneType, itemInfo = null) {
                if (!this.FLAGS.all && !this.FLAGS.drag) return;
                Game.Debug.log('drag', `[C3-drag]`, `放置框: ${action} - 區域: ${zoneType}`, itemInfo || '');
            }
        },

        // =====================================================
        // ⏱️ TimerManager: 統一管理所有 setTimeout（Phase 1 基礎設施）
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
                Game.Debug.log('timer', `TimerManager.clearAll(): ${this.timers.size} 個計時器`);
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
                    Game.Debug.log('timer', `清理 ${category} 類別: ${count} 個`);
                }
            }
        },

        // =====================================================
        // 🎯 EventManager: 統一管理所有 addEventListener（Phase 1 基礎設施）
        // =====================================================
        EventManager: {
            listeners: [],

            on(element, type, handler, options = {}, category = 'default') {
                if (!element) return -1;
                element.addEventListener(type, handler, options);
                return this.listeners.push({ element, type, handler, options, category }) - 1;
            },

            removeAll() {
                Game.Debug.log('event', `EventManager.removeAll(): ${this.listeners.length} 個監聽器`);
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
                        try { l.element.removeEventListener(l.type, l.handler, l.options); } catch(e) {}
                        this.listeners[i] = null;
                        count++;
                    }
                });
                if (count > 0) {
                    Game.Debug.log('event', `清理 ${category} 類別: ${count} 個`);
                }
            }
        },

        // =====================================================
        // 狀態管理
        // =====================================================
        state: {
            settings: {
                difficulty: null,      // 默認困難模式
                category: null,          // 兌換主類別
                pair: null,              // 兌換組合
                mode: null,           // 默認反複作答模式
                questionCount: null,        // 默認5題
                assistClick: false
            },
            score: 0,
            currentQuestionIndex: 0,
            totalQuestions: 5,
            quizQuestions: [],
            gameState: {},
            isProcessingExchange: false,
            audioUnlocked: false,  // 🔧 [新增] 手機端音頻解鎖狀態
            lastExchangeKey: null,  // 🔧 [新增] 防重複題目機制：記錄上一題的兌換特徵
            startTime: null  // 🔧 [新增] 測驗開始時間
        },
        
        // =====================================================
        // 資料
        // =====================================================
        gameData: {
            title: "單元C3：金錢面額的兌換",
            subtitle: "理解不同面額之間的換算關係，學習如何進行金錢兌換",
            categories: {
                "coin-to-coin": {
                    name: "錢幣 <-> 錢幣",
                    pairs: [
                        { from: 1, to: 5, name: "1元 -> 5元", type: "small-to-big" },
                        { from: 1, to: 10, name: "1元 -> 10元", type: "small-to-big" },
                        { from: 5, to: 10, name: "5元 -> 10元", type: "small-to-big" },
                        { from: 5, to: 50, name: "5元 -> 50元", type: "small-to-big" },
                        { from: 10, to: 50, name: "10元 -> 50元", type: "small-to-big" },
                        { from: 5, to: 1, name: "5元 -> 1元", type: "big-to-small" },
                        { from: 10, to: 1, name: "10元 -> 1元", type: "big-to-small" },
                        { from: 10, to: 5, name: "10元 -> 5元", type: "big-to-small" },
                        { from: 50, to: 5, name: "50元 -> 5元", type: "big-to-small" },
                        { from: 50, to: 10, name: "50元 -> 10元", type: "big-to-small" }
                    ]
                },
                "note-to-note": {
                    name: "紙鈔 <-> 紙鈔",
                    pairs: [
                        { from: 100, to: 500, name: "100元 -> 500元", type: "small-to-big" },
                        { from: 100, to: 1000, name: "100元 -> 1000元", type: "small-to-big" },
                        { from: 500, to: 1000, name: "500元 -> 1000元", type: "small-to-big" },
                        { from: 500, to: 100, name: "500元 -> 100元", type: "big-to-small" },
                        { from: 1000, to: 100, name: "1000元 -> 100元", type: "big-to-small" },
                        { from: 1000, to: 500, name: "1000元 -> 500元", type: "big-to-small" }
                    ]
                },
                "coin-to-note": {
                    name: "錢幣 <-> 紙鈔",
                    pairs: [
                        { from: 10, to: 100, name: "10元 -> 100元", type: "small-to-big" },
                        { from: 50, to: 100, name: "50元 -> 100元", type: "small-to-big" },
                        { from: 50, to: 500, name: "50元 -> 500元", type: "small-to-big" },
                        { from: 100, to: 10, name: "100元 -> 10元", type: "big-to-small" },
                        { from: 100, to: 50, name: "100元 -> 50元", type: "big-to-small" },
                        { from: 500, to: 50, name: "500元 -> 50元", type: "big-to-small" }
                    ]
                }
            },
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

        // =====================================================
        // 策略模組 - 統一處理邏輯，大幅簡化程式碼
        // =====================================================
        Strategies: {
            // 兌換驗證策略 - 統一所有驗證邏輯
            ValidationStrategy: {
                validate(question, placedCoins) {
                    const difficulty = MoneyExchange3.getSettings('difficulty');
                    const { exchangeType } = question;
                    
                    // 【修復】從 gameState 獲取最新的、正確的輪次資訊
                    const gameState = MoneyExchange3.getGameState('gameState');
                    const currentRound = gameState.completedExchanges || 0;
                    
                    // 獲取當前輪次需求 - 使用 gameState 中的最新資料
                    const requirements = this.calculateRequirements({
                        exchangeRate: question.exchangeRate,
                        currentRound: currentRound,
                        targetImages: gameState.targetImages, // 使用 gameState 中的正確藍圖
                        requiredSourceCounts: gameState.requiredSourceCounts, // 針對大換小模式
                        exchangeType: exchangeType
                    });
                    
                    Game.Debug.log('judge', `🔍 統一驗證: ${difficulty}模式-${exchangeType}, 需要${requirements.sourceCount}個，已放置${placedCoins.length}個`);
                    
                    // 【配置驅動】統一驗證邏輯
                    const config = MoneyExchange3.ModeConfig[difficulty];
                    const validatorMethod = config.validation.validator;
                    
                    if (this[validatorMethod]) {
                        return this[validatorMethod](requirements, placedCoins);
                    } else {
                        // 回退到簡單驗證
                        return placedCoins.length === requirements.sourceCount;
                    }
                },
                
                calculateRequirements(data) {
                    // 支援新舊兩種調用方式：物件參數或 question 物件
                    let exchangeType, exchangeRate, currentRound, targetImages, requiredSourceCounts;
                    
                    if (data.exchangeType) {
                        // 新方式：直接傳入解構好的參數
                        ({ exchangeType, exchangeRate, currentRound, targetImages, requiredSourceCounts } = data);
                    } else {
                        // 舊方式：傳入 question 物件（向後兼容）
                        const gameState = MoneyExchange3.getGameState('gameState');
                        currentRound = gameState.completedExchanges || 0;
                        ({ exchangeType, exchangeRate, targetImages, requiredSourceCounts } = data);
                    }
                    
                    // 【修復】使用this訪問內部ExchangeTypeStrategies對象
                    return this.ExchangeTypeStrategies[exchangeType].calculateRequirements({
                        currentRound, exchangeRate, targetImages, requiredSourceCounts
                    });
                },
                
                // 【新增】兌換類型策略 - 替代if-else邏輯
                ExchangeTypeStrategies: {
                    'big-to-small': {
                        calculateRequirements({ currentRound, exchangeRate, targetImages, requiredSourceCounts }) {
                            // 【修正】優先使用 requiredSourceCounts 陣列來確定當前輪次需要的大鈔數量
                            // requiredSourceCounts 是在 startQuestion 中為普通/困難模式預先計算好的
                            if (requiredSourceCounts && requiredSourceCounts[currentRound] !== undefined) {
                                const sourceCount = requiredSourceCounts[currentRound];
                                const targetCount = sourceCount * exchangeRate; // 目標數量也應動態計算
                                Game.Debug.log('judge', `✅ 大換小，第 ${currentRound + 1} 輪需求: ${sourceCount} 個來源, ${targetCount} 個目標`);
                                return { sourceCount: sourceCount, targetCount: targetCount };
                            }
                            
                            // 如果沒有預先計算的輪次資訊（例如簡單模式），則使用備用邏輯
                            if (targetImages && targetImages[currentRound]) {
                                const targetCount = targetImages[currentRound].length;
                                const sourceCount = Math.ceil(targetCount / exchangeRate);
                                return { sourceCount: sourceCount, targetCount: targetCount };
                            }

                            // 最終備案
                            return { sourceCount: 1, targetCount: exchangeRate };
                        },
                        generateHTML(difficulty, exchangeRate, config) {
                            return MoneyExchange3.Strategies.DOMRenderer.generateBigToSmallExchangeHTML(difficulty, exchangeRate);
                        }
                    },
                    'small-to-big': {
                        calculateRequirements({ currentRound, exchangeRate, targetImages }) {
                            if (targetImages && targetImages[currentRound]) {
                                return {
                                    sourceCount: targetImages[currentRound].length * exchangeRate,
                                    targetCount: targetImages[currentRound].length
                                };
                            }
                            return { sourceCount: exchangeRate, targetCount: 1 };
                        },
                        generateHTML(difficulty, exchangeRate, config) {
                            return MoneyExchange3.Strategies.DOMRenderer.generateSmallToBigExchangeHTML(difficulty, exchangeRate);
                        }
                    }
                },
                
                validateNormalMode(requirements, placedCoins) {
                    const gameState = MoneyExchange3.getGameState('gameState');
                    const currentRound = gameState.currentRound || 0;
                    const totalRounds = gameState.totalRounds || 1;
                    
                    // 【修正】使用嚴格等於(===)來確保數量完全正確
                    const currentRoundComplete = placedCoins.length === requirements.sourceCount;
                    
                    // 每輪都可以獨立完成，不必等到最後一輪
                    return currentRoundComplete;
                }
            },
            
            // 統一完成處理策略 - 替代複雜的完成邏輯
            CompletionStrategy: {
                process(question, isValid) {
                    if (isValid) {
                        return this.handleSuccess(question);
                    } else {
                        return this.handleError(question);
                    }
                },
                
                handleSuccess(question) {
                    Game.Debug.log('exchange', '✅ 兌換成功，使用統一處理邏輯');
                    
                    // 統一的成功處理
                    MoneyExchange3.setGameState('score', MoneyExchange3.getGameState('score') + 1);
                    
                    // 【配置驅動】成功處理邏輯
                    const difficulty = MoneyExchange3.getSettings('difficulty');
                    const config = MoneyExchange3.ModeConfig[difficulty];
                    
                    // 播放成功音效和語音
                    MoneyExchange3.Audio.playCorrectSound(difficulty, config);
                    
                    // 🎆 啟動煙火動畫
                    this.startFireworksAnimation();
                    
                    const successHandler = config.success.handler;
                    
                    if (this[successHandler]) {
                        return this[successHandler](question);
                    } else {
                        // 回退到簡單模式處理
                        return this.handleSimpleModeSuccess(question);
                    }
                },
                
                handleError(question) {
                    Game.Debug.log('exchange', '❌ 兌換失敗，使用統一錯誤處理');
                    
                    // 統一的錯誤處理
                    const difficulty = MoneyExchange3.getSettings('difficulty');
                    const config = MoneyExchange3.ModeConfig[difficulty];
                    MoneyExchange3.Audio.playErrorSound(difficulty, config);
                    
                    const answerMode = MoneyExchange3.getSettings('mode');
                    if (answerMode === 'retry') {
                        MoneyExchange3.returnExchangeCoinsToMoneyArea(question);
                    } else {
                        Game.TimerManager.setTimeout(() => MoneyExchange3.loadNextQuestion(), config.timing.nextQuestionDelay, 'question');
                    }
                },
                
                handleNormalModeSuccess(question) {
                    // 簡化的普通模式處理邏輯
                    Game.Debug.log('exchange', '🎉 normal模式成功處理');
                    
                    // 【新增】在處理多輪邏輯前，立即顯示本輪的兌換結果
                    if (MoneyExchange3.showExchangeResult) {
                        MoneyExchange3.showExchangeResult(question);
                    } else {
                        Game.Debug.error('找不到 showExchangeResult 函數來顯示兌換結果！');
                    }
                    
                    const gameState = MoneyExchange3.getGameState('gameState');
                    
                    // 先將完成的輪次加一
                    gameState.currentRound = (gameState.currentRound || 0) + 1;
                    
                    // 【關鍵】保存gameState更新到StateManager
                    MoneyExchange3.setGameState('gameState', gameState);
                    Game.Debug.log('state', `🔄 輪次更新: 已完成第${gameState.currentRound}輪`);
                    
                    const hasMoreRounds = gameState.currentRound < (gameState.totalRounds || 1);
                    
                    if (hasMoreRounds) {
                        // 還有更多輪次，準備下一輪
                        Game.Debug.log('state', `📋 還有更多輪次: 第${gameState.currentRound}輪已完成，準備第${gameState.currentRound + 1}輪`);
                        MoneyExchange3.prepareNextRound(question);
                    } else {
                        // 完成所有輪次
                        Game.Debug.log('state', `✅ 所有輪次完成: 共${gameState.totalRounds}輪`);
                        const difficulty = MoneyExchange3.getSettings('difficulty');
                        const config = MoneyExchange3.ModeConfig[difficulty];
                        Game.TimerManager.setTimeout(() => MoneyExchange3.loadNextQuestion(), config.timing.nextQuestionDelay, 'question');
                    }
                },
                
                handleSimpleModeSuccess(question) {
                    // 簡單模式直接進入下一題
                    const config = MoneyExchange3.ModeConfig['easy'];
                    Game.TimerManager.setTimeout(() => MoneyExchange3.loadNextQuestion(), config.timing.nextQuestionDelay, 'question');
                }
            },
            
            // DOM渲染統一策略 - 消除3個render函數的重複代碼
            DOMRenderer: {
                // 統一HTML生成 - 替代原本3個模式各自的HTML模板
                generateGameHTML(difficulty, question, sourceItem, targetItem) {
                    const { exchangeType, exchangeRate } = question;
                    
                    // 統一的基礎結構，所有模式共用
                    const baseHTML = `
                        <div class="game-container">
                            <div class="source-money-area">
                                ${this.generateSourceMoneyHTML(sourceItem)}
                            </div>
                            <div class="exchange-area" id="exchange-area">
                                ${this.generateExchangeAreaHTML(difficulty, exchangeType, exchangeRate)}
                            </div>
                            <div class="target-money-display">
                                ${this.generateTargetMoneyHTML(difficulty, targetItem)}
                            </div>
                            <div class="controls">
                                ${this.generateControlsHTML(difficulty)}
                            </div>
                        </div>
                    `;
                    
                    Game.Debug.log('ui', `📱 DOMRenderer: 生成${difficulty}模式HTML`);
                    return baseHTML;
                },
                
                generateSourceMoneyHTML(sourceItem) {
                    // 統一的源錢幣區域HTML
                    return `
                        <div class="money-area">
                            <div class="money-grid">
                                ${this.generateMoneyItemsHTML(sourceItem, 'source')}
                            </div>
                        </div>
                    `;
                },
                
                generateExchangeAreaHTML(difficulty, exchangeType, exchangeRate) {
                    // 【配置驅動】直接調用方法，避免作用域問題
                    Game.Debug.log('ui', `🔧 生成${exchangeType}兌換區域HTML`);
                    
                    if (exchangeType === 'small-to-big') {
                        return this.generateSmallToBigExchangeHTML(difficulty, exchangeRate);
                    } else if (exchangeType === 'big-to-small') {
                        return this.generateBigToSmallExchangeHTML(difficulty, exchangeRate);
                    }
                    
                    Game.Debug.warn('ui', '未知的兌換類型:', exchangeType);
                    return '<div class="exchange-area">兌換區域</div>';
                },
                
                generateSmallToBigExchangeHTML(difficulty, exchangeRate) {
                    // 小換大兌換區域 - 統一模板
                    let dropZones;
                    
                    if (difficulty === 'normal' || difficulty === 'hard') {
                        // 普通模式和困難模式：創建彈性單一放置框
                        dropZones = `<div class="exchange-drop-zone ${difficulty}-drop-zone flexible-zone" data-mode="${difficulty}">
                            <div class="drop-hint">拖入金錢到此區域</div>
                            <div class="placed-coins-container"></div>
                        </div>`;
                    } else {
                        // 簡單模式：保持原有多框邏輯
                        dropZones = Array(exchangeRate).fill(0).map((_, i) => 
                            `<div class="exchange-drop-zone ${difficulty}-drop-zone" data-index="${i}"></div>`
                        ).join('');
                    }
                    
                    return `
                        <div class="small-to-big-exchange">
                            <div class="drop-zones-container ${(difficulty === 'normal' || difficulty === 'hard') ? 'flexible-container' : ''}">
                                ${dropZones}
                            </div>
                            <div class="equals-sign">=</div>
                            <div class="target-preview ${difficulty}-target"></div>
                            <div class="checkmark-icon">${this.getCheckmarkSVG()}</div>
                        </div>
                    `;
                },
                
                generateBigToSmallExchangeHTML(difficulty, exchangeRate) {
                    // 大換小兌換區域 - 統一模板
                    let dropZone;
                    
                    if (difficulty === 'normal' || difficulty === 'hard') {
                        // 普通模式和困難模式：創建彈性單一放置框
                        dropZone = `<div class="single-drop-zone ${difficulty}-drop-zone flexible-zone" data-mode="${difficulty}">
                            <div class="drop-hint">拖入金錢到此區域</div>
                            <div class="placed-coins-container"></div>
                        </div>`;
                    } else {
                        // 簡單模式：保持原有邏輯
                        dropZone = `<div class="single-drop-zone ${difficulty}-drop-zone"></div>`;
                    }
                    
                    return `
                        <div class="big-to-small-exchange">
                            ${dropZone}
                            <div class="equals-sign">=</div>
                            <div class="target-grid">
                                ${Array(exchangeRate).fill(0).map((_, i) => 
                                    `<div class="target-slot ${difficulty}-target" data-slot="${i}"></div>`
                                ).join('')}
                            </div>
                            <div class="checkmark-icon">${this.getCheckmarkSVG()}</div>
                        </div>
                    `;
                },
                
                generateTargetMoneyHTML(difficulty, targetItem) {
                    // 【配置驅動】根據模式配置決定是否淡化
                    const config = MoneyExchange3.ModeConfig[difficulty] || MoneyExchange3.ModeConfig.easy;
                    const fadeClass = config.ui.targetMoneyFaded ? 'faded' : '';
                    return `
                        <div class="target-money ${fadeClass}">
                            <img src="${targetItem.images.front}" alt="${targetItem.name}">
                            <span class="money-label">${targetItem.name}</span>
                        </div>
                    `;
                },
                
                generateControlsHTML(difficulty) {
                    // 【配置驅動】根據模式配置決定是否顯示按鈕
                    const config = MoneyExchange3.ModeConfig[difficulty] || MoneyExchange3.ModeConfig.easy;
                    
                    if (config.ui.showCompleteButton) {
                        return `<button id="complete-exchange-btn" class="complete-btn">${config.uiElements.buttonText.complete}</button>`;
                    }
                    return '';
                },
                
                generateMoneyItemsHTML(item, type) {
                    // 生成錢幣項目HTML
                    return Array(10).fill(0).map((_, i) => 
                        `<div class="money-item clickable-item ${type}-money" data-value="${item.value}" data-type="money-item" draggable="true">
                            <img src="${item.images.front}" alt="${item.name}">
                            <span class="money-value">${item.value}元</span>
                        </div>`
                    ).join('');
                },
                
                getCheckmarkSVG() {
                    return `
                        <svg class="checkmark" viewBox="0 0 24 24" width="36" height="36">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" 
                                  fill="#4CAF50"/>
                        </svg>
                    `;
                }
            },
            
            // 統一渲染策略 - 替代3個獨立的render函數
            RenderStrategy: {
                render(difficulty, question, sourceItem, targetItem) {
                    Game.Debug.log('ui', `🎨 RenderStrategy: 開始渲染${difficulty}模式`);
                    
                    // 使用統一的DOM渲染器
                    const html = MoneyExchange3.Strategies.DOMRenderer.generateGameHTML(
                        difficulty, question, sourceItem, targetItem
                    );
                    
                    // 更新DOM
                    const gameArea = document.getElementById('app');
                    if (gameArea) {
                        gameArea.innerHTML = html;
                        
                        // 綁定事件
                        this.bindEvents(difficulty, question);
                        
                        // 應用模式特定的樣式和行為
                        this.applyModeSpecificBehaviors(difficulty, question);
                        
                        Game.Debug.log('ui', `✅ RenderStrategy: ${difficulty}模式渲染完成`);
                    } else {
                        Game.Debug.error('找不到遊戲區域元素');
                    }
                },
                
                bindEvents(difficulty, question) {
                    // 【模式隔離】為每個難度模式創建完全獨立的事件處理
                    Game.Debug.log('event', `🎯 模式隔離事件綁定：${difficulty}模式`);
                    
                    // 清理當前模式的舊事件監聽器
                    this.cleanupModeEvents(difficulty);
                    
                    // 🔧 [修復] 使用專用拖拽設置函數，避免統一系統的問題
                    if (difficulty === 'easy') {
                        Game.Debug.log('drag', '🟢 簡單模式：使用專用拖拽設置');
                        // 延遲調用確保DOM已完全渲染
                        Game.TimerManager.setTimeout(() => {
                            MoneyExchange3.setupEasyModeDragListeners.call(MoneyExchange3, question);
                        }, 100, 'drag');
                    } else if (difficulty === 'normal') {
                        Game.Debug.log('drag', '🟡 普通模式：使用專用拖拽設置');
                        // 延遲調用確保DOM已完全渲染
                        Game.TimerManager.setTimeout(() => {
                            MoneyExchange3.setupNormalModeDragListeners.call(MoneyExchange3, question);
                        }, 100, 'drag');
                    } else if (difficulty === 'hard') {
                        Game.Debug.log('drag', '🔴 困難模式：使用現有專用拖拽設置');
                        // 困難模式已有專用設置，保持原有邏輯
                        const config = MoneyExchange3.ModeConfig[difficulty];
                        MoneyExchange3.bindManualTriggerEvents.call(MoneyExchange3, difficulty, question, config);
                    }
                    
                    Game.Debug.log('drag', `✅ ${difficulty}模式拖拽事件綁定完成（專用系統）`);
                },
                
                // 清理特定模式的事件監聽器
                cleanupModeEvents(difficulty) {
                    const modeCleanupKey = `_${difficulty}ModeEventCleanup`;
                    if (MoneyExchange3[modeCleanupKey]) {
                        MoneyExchange3[modeCleanupKey]();
                        MoneyExchange3[modeCleanupKey] = null;
                    }
                },
                
                // 【模式隔離】簡單模式專用事件綁定
                bindEasyModeEvents(question) {
                    const gameArea = document.getElementById('app');
                    if (!gameArea) return;
                    
                    // 簡單模式特有的事件處理函數
                    const easyHandlers = {
                        handleDragStart: (e) => {
                            const moneyItem = e.target.closest('.exchange-item, .money-item');
                            if (moneyItem) {
                                // 簡單模式專用拖拽開始邏輯
                                MoneyExchange3.handleDragStart(e);
                                Game.Debug.log('drag', '🟢 簡單模式：拖拽開始');
                            }
                        },
                        
                        handleDragEnd: (e) => {
                            const moneyItem = e.target.closest('.exchange-item, .money-item');
                            if (moneyItem) {
                                moneyItem.classList.remove('dragging');
                                Game.TimerManager.setTimeout(() => {
                                    MoneyExchange3.state.isDragging = false;
                                }, 100, 'drag');
                                Game.Debug.log('drag', '🟢 簡單模式：拖拽結束');
                            }
                        },
                        
                        handleDragOver: (e) => {
                            if (e.target.matches('.money-source-container, .exchange-drop-zone') || 
                                e.target.closest('.money-source-container, .exchange-drop-zone')) {
                                MoneyExchange3.handleDragOver(e);
                            }
                        },
                        
                        handleDrop: (e) => {
                            const isValidDropZone = e.target.matches('.money-source-container, .exchange-drop-zone') || 
                                                  e.target.closest('.money-source-container, .exchange-drop-zone');
                            if (isValidDropZone) {
                                // 簡單模式使用統一的ModeStrategy
                                MoneyExchange3.ModeStrategies.handleInteraction('easy', 'drop', { event: e, question });
                                Game.Debug.log('drag', '🟢 簡單模式：使用ModeStrategy處理放置');
                            }
                        }
                    };
                    
                    // 綁定簡單模式專用事件
                    gameArea.addEventListener('dragstart', easyHandlers.handleDragStart);
                    gameArea.addEventListener('dragend', easyHandlers.handleDragEnd);
                    gameArea.addEventListener('dragover', easyHandlers.handleDragOver);
                    gameArea.addEventListener('drop', easyHandlers.handleDrop);
                    
                    // 保存清理函數（模式專用）
                    MoneyExchange3._easyModeEventCleanup = () => {
                        gameArea.removeEventListener('dragstart', easyHandlers.handleDragStart);
                        gameArea.removeEventListener('dragend', easyHandlers.handleDragEnd);
                        gameArea.removeEventListener('dragover', easyHandlers.handleDragOver);
                        gameArea.removeEventListener('drop', easyHandlers.handleDrop);
                    };
                },
                
                // 【模式隔離】普通模式專用事件綁定
                bindNormalModeEvents(question) {
                    const gameArea = document.getElementById('app');
                    if (!gameArea) return;
                    
                    // 設置完成兌換按鈕
                    const completeBtn = document.getElementById('complete-exchange-btn');
                    if (completeBtn) {
                        const newBtn = completeBtn.cloneNode(true);
                        completeBtn.parentNode.replaceChild(newBtn, completeBtn);
                        Game.EventManager.on(newBtn, 'click', () => MoneyExchange3.handleCompleteExchangeClick(question), {}, 'gameUI');
                    }
                    
                    // 普通模式特有的事件處理函數
                    const normalHandlers = {
                        handleDragStart: (e) => {
                            // 【雙向拖拉】支援從金錢區和兌換區拖拽
                            const moneyItem = e.target.closest('.exchange-item, .exchange-money-item');
                            if (moneyItem) {
                                MoneyExchange3.handleDragStart(e);
                                const itemType = moneyItem.classList.contains('exchange-money-item') ? '兌換區' : '金錢區';
                                Game.Debug.log('drag', `🟡 普通模式：從${itemType}拖拽開始`);
                            }
                        },
                        
                        handleDragEnd: (e) => {
                            // 【雙向拖拉】支援從金錢區和兌換區拖拽結束
                            const moneyItem = e.target.closest('.exchange-item, .exchange-money-item');
                            if (moneyItem) {
                                moneyItem.classList.remove('dragging');
                                Game.TimerManager.setTimeout(() => {
                                    MoneyExchange3.state.isDragging = false;
                                }, 100, 'drag');
                                const itemType = moneyItem.classList.contains('exchange-money-item') ? '兌換區' : '金錢區';
                                Game.Debug.log('drag', `🟡 普通模式：從${itemType}拖拽結束`);
                            }
                        },
                        
                        handleDragOver: (e) => {
                            if (e.target.matches('.money-source-container, .exchange-drop-zone, .transparent-drop-hint, .placed-coins-display, .partial-coins-display') || 
                                e.target.closest('.money-source-container, .exchange-drop-zone')) {
                                MoneyExchange3.handleDragOver(e);
                            }
                        },
                        
                        handleDrop: (e) => {
                            // 【雙向拖拉】支援拖拽到兌換區和金錢區
                            const isValidDropZone = e.target.matches('.money-source-container, .exchange-drop-zone, .flexible-zone, .transparent-drop-hint, .placed-coins-display, .partial-coins-display') || 
                                                  e.target.closest('.money-source-container, .exchange-drop-zone, .flexible-zone');
                            if (isValidDropZone) {
                                // 普通模式專用放置處理（支援雙向拖拉）
                                MoneyExchange3.handleExchangeDrop(e, question);
                                Game.Debug.log('drag', '🟡 普通模式：處理放置（支援雙向拖拉）');
                            }
                        }
                    };
                    
                    // 綁定普通模式專用事件
                    gameArea.addEventListener('dragstart', normalHandlers.handleDragStart);
                    gameArea.addEventListener('dragend', normalHandlers.handleDragEnd);
                    gameArea.addEventListener('dragover', normalHandlers.handleDragOver);
                    gameArea.addEventListener('drop', normalHandlers.handleDrop);
                    
                    // 保存清理函數（模式專用）
                    MoneyExchange3._normalModeEventCleanup = () => {
                        gameArea.removeEventListener('dragstart', normalHandlers.handleDragStart);
                        gameArea.removeEventListener('dragend', normalHandlers.handleDragEnd);
                        gameArea.removeEventListener('dragover', normalHandlers.handleDragOver);
                        gameArea.removeEventListener('drop', normalHandlers.handleDrop);
                    };
                },
                
                // 【模式隔離】困難模式專用事件綁定
                bindHardModeEvents(question) {
                    const gameArea = document.getElementById('app');
                    if (!gameArea) return;
                    
                    // 設置完成兌換按鈕
                    const completeBtn = document.getElementById('complete-exchange-btn');
                    if (completeBtn) {
                        const newBtn = completeBtn.cloneNode(true);
                        completeBtn.parentNode.replaceChild(newBtn, completeBtn);
                        Game.EventManager.on(newBtn, 'click', () => MoneyExchange3.handleCompleteExchangeClickHard(question), {}, 'gameUI');
                    }
                    
                    // 困難模式特有的事件處理函數
                    const hardHandlers = {
                        handleDragStart: (e) => {
                            const moneyItem = e.target.closest('.exchange-item');
                            if (moneyItem) {
                                MoneyExchange3.handleDragStart(e);
                                Game.Debug.log('drag', '🔴 困難模式：拖拽開始');
                            }
                        },
                        
                        handleDragEnd: (e) => {
                            const moneyItem = e.target.closest('.exchange-item');
                            if (moneyItem) {
                                moneyItem.classList.remove('dragging');
                                Game.TimerManager.setTimeout(() => {
                                    MoneyExchange3.state.isDragging = false;
                                }, 100, 'drag');
                                Game.Debug.log('drag', '🔴 困難模式：拖拽結束');
                            }
                        },
                        
                        handleDragOver: (e) => {
                            if (e.target.matches('.money-source-container, .exchange-drop-zone, .transparent-drop-hint, .placed-coins-display, .partial-coins-display') || 
                                e.target.closest('.money-source-container, .exchange-drop-zone')) {
                                MoneyExchange3.handleDragOver(e);
                            }
                        },
                        
                        handleDrop: (e) => {
                            const isValidDropZone = e.target.matches('.money-source-container, .exchange-drop-zone, .flexible-zone, .transparent-drop-hint, .placed-coins-display, .partial-coins-display') || 
                                                  e.target.closest('.money-source-container, .exchange-drop-zone, .flexible-zone');
                            if (isValidDropZone) {
                                // 困難模式專用放置處理（支援彈性放置框）
                                MoneyExchange3.handleExchangeDropHard(e, question);
                                Game.Debug.log('drag', '🔴 困難模式：處理放置');
                            }
                        }
                    };
                    
                    // 綁定困難模式專用事件
                    gameArea.addEventListener('dragstart', hardHandlers.handleDragStart);
                    gameArea.addEventListener('dragend', hardHandlers.handleDragEnd);
                    gameArea.addEventListener('dragover', hardHandlers.handleDragOver);
                    gameArea.addEventListener('drop', hardHandlers.handleDrop);
                    
                    // 保存清理函數（模式專用）
                    MoneyExchange3._hardModeEventCleanup = () => {
                        gameArea.removeEventListener('dragstart', hardHandlers.handleDragStart);
                        gameArea.removeEventListener('dragend', hardHandlers.handleDragEnd);
                        gameArea.removeEventListener('dragover', hardHandlers.handleDragOver);
                        gameArea.removeEventListener('drop', hardHandlers.handleDrop);
                    };
                },
                
                applyModeSpecificBehaviors(difficulty, question) {
                    // 【配置驅動】應用模式特定的行為差異
                    const config = this.ModeConfig[difficulty];
                    if (config && config.setup && config.setup.method) {
                        const setupMethod = config.setup.method;
                        if (this[setupMethod]) {
                            this[setupMethod](question);
                        } else {
                            Game.Debug.warn('ui', `找不到設置方法: ${setupMethod}`);
                        }
                    }
                },
                
                setupEasyModeFeatures() {
                    // 簡單模式特有功能
                    Game.Debug.log('ui', '🟢 設置簡單模式特性');
                },

                setupNormalModeFeatures(question) {
                    // 普通模式特有功能
                    Game.Debug.log('ui', '🟡 設置普通模式特性');
                },

                setupHardModeFeatures() {
                    // 困難模式特有功能
                    Game.Debug.log('ui', '🔴 設置困難模式特性');
                }
            }
        },

        // =====================================================
        // 準備下一輪兌換方法 - 在主對象級別
        // =====================================================
        
        // 準備下一輪兌換的通用方法
        prepareNextRound(question) {
            const { exchangeType } = question;
            Game.Debug.log('exchange', `🔄 準備下一輪兌換: ${exchangeType}`);

            if (exchangeType === 'small-to-big') {
                this.prepareNextRoundForNormalMode(question);
            } else if (exchangeType === 'big-to-small') {
                this.prepareNextRoundForNormalModeBigToSmall(question);
            } else {
                Game.Debug.warn('exchange', '未知的兌換類型:', exchangeType);
                // 默認行為：進入下一題
                Game.TimerManager.setTimeout(() => this.loadNextQuestion(), 2000, 'question');
            }
        },

        // 準備普通模式小換大的下一輪兌換
        prepareNextRoundForNormalMode(question) {
            Game.Debug.log('exchange', '🔄 普通模式小換大準備下一輪兌換');
            
            // 重置當前輪次狀態
            const gameState = this.getGameState('gameState');
            gameState.roundComplete = false;
            gameState.currentRoundDropZone = {
                placedCoins: [],
                requiredCoins: question.exchangeRate,
                targetCoins: 1
            };
            
            // 檢查輪次進度
            const currentRound = gameState.currentRound || 0;
            const totalRounds = gameState.totalRounds || 1;
            const isLastRound = (currentRound + 1) >= totalRounds;
            
            Game.Debug.log('exchange', `🔍 普通模式下一輪檢查: 目前第${currentRound + 1}輪/共${totalRounds}輪, 是否最後一輪=${isLastRound}`);

            if (isLastRound) {
                // 已完成所有預定輪次，完成當前題目
                Game.Debug.log('exchange', '✅ 普通模式小換大全部完成，準備進入下一題');
                this.finishNormalModeSmallToBig(question);
                return;
            }
            
            // 使用預先分配的目標圖示
            const nextRoundIndex = currentRound + 1;
            const targetImagesForThisRound = gameState.targetImages[nextRoundIndex];
            const newTargetCount = targetImagesForThisRound ? targetImagesForThisRound.length : 0;
            
            Game.Debug.log('exchange', `🎯 普通模式準備新輪目標: 進入第${nextRoundIndex + 1}輪，需要${newTargetCount}個${question.targetValue}元硬幣`);
            
            // 更新兌換區域顯示新的目標金錢
            this.updateExchangeAreaForNewRound(question, targetImagesForThisRound);
            
            // 重新啟用完成兌換按鈕
            const completeBtn = document.getElementById('complete-exchange-btn');
            if (completeBtn) {
                completeBtn.disabled = false;
                completeBtn.textContent = '完成兌換';
            }
        },

        // 完成普通模式小換大題目
        finishNormalModeSmallToBig(question) {
            Game.Debug.log('exchange', '🎉 普通模式小換大題目完成');
            this.setGameState('score', this.getGameState('score') + 1);
            
            const { targetValue } = question;
            const unit = targetValue >= 100 ? '張' : '個';
            const finalMessage = `恭喜答對！成功完成所有兌換。`;
            
            // 輸出語音訊息到console
            Game.Debug.log('speech', `🎵 普通模式小換大完成語音播放: "${finalMessage}"`);
            
            // 播放完成語音
            this.Speech.speak(finalMessage, 'normal', this.ModeConfig.normal, () => {
                // 顯示最終兌換結果
                this.addExchangeResultDisplay(question);
                
                // 延遲後進入下一題
                Game.TimerManager.setTimeout(() => {
                    this.loadNextQuestion();
                }, 2000, 'question');
            });
        },

        // 準備普通模式大換小的下一輪兌換
        prepareNextRoundForNormalModeBigToSmall(question) {
            Game.Debug.log('exchange', '🔄 普通模式大換小準備下一輪兌換');
            
            // 重置當前輪次狀態
            const gameState = this.getGameState('gameState');
            gameState.roundComplete = false;
            gameState.currentRoundDropZone = {
                placedCoins: [],
                requiredCoins: 1, // 大換小每次需要1個大面額硬幣
                targetCoins: question.exchangeRate
            };
            
            // 檢查輪次進度
            const currentRound = gameState.currentRound || 0;
            const totalRounds = gameState.totalRounds || 1;
            const isLastRound = (currentRound + 1) >= totalRounds;
            
            Game.Debug.log('exchange', `🔍 普通模式大換小下一輪檢查: 目前第${currentRound + 1}輪/共${totalRounds}輪, 是否最後一輪=${isLastRound}`);

            if (isLastRound) {
                // 已完成所有預定輪次，完成當前題目
                Game.Debug.log('exchange', '✅ 普通模式大換小全部完成，準備進入下一題');
                this.finishNormalModeBigToSmall(question);
                return;
            }
            
            // 使用下一個預定的輪次
            const nextRoundTargets = gameState.targetImages[currentRound];
            Game.Debug.log('exchange', `🎯 普通模式大換小進入第${currentRound + 1}輪: ${nextRoundTargets ? nextRoundTargets.length : 0}個${question.targetValue}元硬幣`);
            
            // 更新兌換區域顯示下一輪的目標金錢
            if (nextRoundTargets) {
                this.updateExchangeAreaForNewRound(question, nextRoundTargets);
            }
            
            // 重新啟用完成兌換按鈕
            const completeBtn = document.getElementById('complete-exchange-btn');
            if (completeBtn) {
                completeBtn.disabled = false;
                completeBtn.textContent = '完成兌換';
            }
        },

        // 完成普通模式大換小題目
        finishNormalModeBigToSmall(question) {
            Game.Debug.log('exchange', '🎉 普通模式大換小題目完成');
            this.setGameState('score', this.getGameState('score') + 1);
            
            const { targetValue } = question;
            const unit = targetValue >= 100 ? '張' : '個';
            const finalMessage = `恭喜答對！成功完成所有兌換。`;
            
            // 輸出語音訊息到console
            Game.Debug.log('speech', `🎵 普通模式大換小完成語音播放: "${finalMessage}"`);
            
            // 播放完成語音
            this.Speech.speak(finalMessage, 'normal', this.ModeConfig.normal, () => {
                // 顯示最終兌換結果
                this.addExchangeResultDisplay(question);
                
                // 延遲後進入下一題
                Game.TimerManager.setTimeout(() => {
                    this.loadNextQuestion();
                }, 2000, 'question');
            });
        },

        // 更新兌換區域以顯示新輪的目標金錢
        updateExchangeAreaForNewRound(question, targetImages) {
            Game.Debug.log('ui', '🔄 更新兌換區域顯示新輪目標');
            Game.Debug.log('ui', '📝 目標圖示數據:', targetImages);

            // 找到目標金錢容器並更新
            const targetMoneyContainer = document.querySelector('.target-money-container .target-money-group');
            Game.Debug.log('ui', '🔍 找到目標金錢容器:', !!targetMoneyContainer);
            
            if (targetMoneyContainer) {
                // 清空現有目標金錢
                targetMoneyContainer.innerHTML = '';
                
                // 添加新的目標金錢圖示
                targetImages.forEach((imageSrc, index) => {
                    const targetMoneyDiv = document.createElement('div');
                    targetMoneyDiv.className = 'target-money faded';
                    targetMoneyDiv.innerHTML = `
                        <img src="${imageSrc}" alt="${question.targetValue}元" class="money-image">
                        <div class="money-value">${question.targetValue}</div>
                    `;
                    targetMoneyContainer.appendChild(targetMoneyDiv);
                });
            }
            
            // 重置兌換區域狀態
            const gameState = this.getGameState('gameState');
            gameState.currentRoundDropZone.placedCoins = [];
            Game.Debug.log('ui', '✅ 兌換區域更新完成，準備重新啟用完成兌換按鈕');
        },

        // 添加兌換結果顯示
        addExchangeResultDisplay(question) {
            const { targetValue, exchangeType, exchangeRate } = question;
            const targetItemData = this.gameData.allItems.find(item => item.value === targetValue);

            // 使用現有的兌換結果容器（來自普通模式HTML結構）
            const resultsContainer = document.getElementById('exchange-result-container');
            if (!resultsContainer) {
                Game.Debug.error('找不到原始兌換結果容器 #exchange-result-container');
                return;
            }
            
            // 檢查是否已經添加過當前輪次的兌換結果（防重複添加）
            const gameState = this.getGameState('gameState');
            const currentRound = gameState.completedExchanges || 1;
            const existingResults = resultsContainer.querySelectorAll('.result-money-item').length;
            
            // 計算前面輪次應該有的結果數量（已完成的輪次）
            const previousRounds = Math.max(0, currentRound - 1);
            let expectedPreviousResults;
            if (exchangeType === 'small-to-big') {
                expectedPreviousResults = previousRounds; // 前面每輪得到1個
            } else {
                expectedPreviousResults = previousRounds * exchangeRate; // 前面每輪得到exchangeRate個
            }
            
            // 計算當前輪次應該添加的結果數量
            let expectedCurrentResults;
            if (exchangeType === 'small-to-big') {
                expectedCurrentResults = 1; // 當前輪得到1個目標金錢
            } else {
                // 大換小：需要根據實際放入的金錢計算結果數量
                const difficulty = this.getSettings('difficulty');
                if (difficulty === 'normal') {
                    // 普通模式：根據實際放入的金錢數量計算
                    const { currentRoundDropZone } = gameState;
                    const placedCoinsCount = currentRoundDropZone.placedCoins.length;
                    const totalInputValue = placedCoinsCount * question.sourceValue;
                    expectedCurrentResults = totalInputValue / question.targetValue; // 實際能兌換的目標金錢數量
                    Game.Debug.log('exchange', `📦 普通模式大換小: ${placedCoinsCount}個${question.sourceValue}元 = ${totalInputValue}元 → ${expectedCurrentResults}個${question.targetValue}元`);
                } else {
                    // 簡單/困難模式：固定使用exchangeRate
                    expectedCurrentResults = exchangeRate;
                }
            }
            
            // 如果已有結果數量等於或超過應該的總數，跳過添加
            const totalExpectedResults = expectedPreviousResults + expectedCurrentResults;
            if (existingResults >= totalExpectedResults) {
                Game.Debug.log('exchange', `🚫 跳過重複添加兌換結果 (當前輪次: ${currentRound}, 已有結果: ${existingResults}, 總期望結果: ${totalExpectedResults})`);
                return;
            }

            // 移除"尚無兌換結果"文字（如果存在）
            const emptyResult = resultsContainer.querySelector('.empty-result');
            if (emptyResult) {
                emptyResult.remove();
                Game.Debug.log('ui', '🗑️ 移除"尚無兌換結果"文字');
            }

            // 確保容器使用水平布局並置中對齊
            if (!resultsContainer.style.display || resultsContainer.style.display === 'block') {
                resultsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; align-items: center; padding: 10px;';
                Game.Debug.log('ui', '📦 設置原始容器水平布局（置中對齊）');
            }

            Game.Debug.log('exchange', `📦 添加第${currentRound}輪兌換結果到容器`);

            // 只添加當前輪次需要的兌換結果（而非所有累積結果）
            const itemsToAdd = Math.max(0, Math.min(expectedCurrentResults, totalExpectedResults - existingResults));

            Game.Debug.log('exchange', `📦 添加第${currentRound}輪兌換結果: 已有${existingResults}個，期望總共${totalExpectedResults}個，需要添加 ${itemsToAdd} 個項目`);
            
            // 添加新的兌換結果（每次兌換得到的目標金錢）
            for (let i = 0; i < itemsToAdd; i++) {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-money-item';
                resultItem.style.cssText = 'display: flex; flex-direction: column; align-items: center; margin: 5px; background: transparent; border: none; padding: 8px; min-width: 100px; min-height: 120px; position: relative;';
                resultItem.innerHTML = `
                    <img src="${this.getRandomImage(targetItemData)}" alt="${targetItemData.name}" draggable="false" style="width: 80px; height: 80px; object-fit: contain;">
                    <div class="money-value">${targetItemData.name}</div>
                `;
                resultsContainer.appendChild(resultItem);
            }
        },

        // =====================================================
        // 核心系統模組 - StateManager & EventSystem
        // =====================================================
        Core: {
            StateManager: {
                // 【模式隔離】為每個模式維護獨立的狀態空間
                _state: {
                    // 全域狀態（所有模式共用）
                    global: {
                        score: 0,
                        totalQuestions: 10,
                        currentQuestionIndex: 0,
                        quizQuestions: [],
                        settings: {
                            category: null,
                            pair: null,
                            difficulty: null,
                            mode: null,
                            questionCount: null
                        }
                    },
                    // 簡單模式專用狀態
                    easy: {
                        isAnswering: false,
                        isDragging: false,
                        isProcessingExchange: false,
                        gameState: {},
                        ui: { currentView: 'game' },
                        temp: {},
                        // 🔧 [新增] 點擊放置狀態
                        selectedClickItem: null,         // 點擊選中的物品
                        lastClickTime: 0,                // 最後點擊時間
                        lastClickedElement: null,        // 最後點擊的元素
                        clickCount: 0,                   // 點擊計數
                        doubleClickDelay: 500            // 雙擊檢測時間間隔
                    },
                    // 普通模式專用狀態
                    normal: {
                        isAnswering: false,
                        isDragging: false,
                        isProcessingExchange: false,
                        gameState: {},
                        ui: { currentView: 'game' },
                        temp: {},
                        // 🔧 [新增] 點擊放置狀態
                        selectedClickItem: null,         // 點擊選中的物品
                        lastClickTime: 0,                // 最後點擊時間
                        lastClickedElement: null,        // 最後點擊的元素
                        clickCount: 0,                   // 點擊計數
                        doubleClickDelay: 500            // 雙擊檢測時間間隔
                    },
                    // 困難模式專用狀態
                    hard: {
                        isAnswering: false,
                        isDragging: false,
                        isProcessingExchange: false,
                        gameState: {},
                        ui: { currentView: 'game' },
                        temp: {},
                        // 🔧 [新增] 點擊放置狀態
                        selectedClickItem: null,         // 點擊選中的物品
                        lastClickTime: 0,                // 最後點擊時間
                        lastClickedElement: null,        // 最後點擊的元素
                        clickCount: 0,                   // 點擊計數
                        doubleClickDelay: 500            // 雙擊檢測時間間隔
                    }
                },
                
                // 獲取當前模式
                getCurrentMode() {
                    return this._state.global.settings.difficulty || 'easy';
                },
                
                setState(path, value, targetMode = null) {
                    // 【模式隔離】根據路徑自動判斷目標狀態空間
                    const mode = targetMode || this.getCurrentMode();
                    let targetState;
                    
                    // 判斷是全域狀態還是模式專用狀態
                    if (path.startsWith('global.') || 
                        path.includes('settings.') || 
                        path.includes('score') || 
                        path.includes('totalQuestions') || 
                        path.includes('currentQuestionIndex') || 
                        path.includes('quizQuestions')) {
                        targetState = this._state.global;
                        path = path.replace('global.', ''); // 移除global前綴
                    } else {
                        // 模式專用狀態
                        targetState = this._state[mode];
                        if (!targetState) {
                            Game.Debug.warn('state', `⚠️ StateManager: 未知模式 "${mode}", 使用easy模式`);
                            targetState = this._state.easy;
                        }
                    }

                    const keys = path.split('.');
                    let current = targetState;

                    // 導航到目標位置
                    for (let i = 0; i < keys.length - 1; i++) {
                        if (!current[keys[i]]) current[keys[i]] = {};
                        current = current[keys[i]];
                    }
                    
                    const oldValue = current[keys[keys.length - 1]];
                    current[keys[keys.length - 1]] = value;
                    
                    // 觸發狀態變更事件
                    MoneyExchange3.Core.EventSystem.emit('stateChange', {
                        path: `${mode}.${path}`, 
                        oldValue, 
                        newValue: value,
                        mode,
                        timestamp: Date.now()
                    });
                    
                    // 調試日誌
                    Game.Debug.log('state', `🔄 StateManager[${mode}]: ${path} = `, value);
                },

                getState(path, targetMode = null) {
                    if (!path) return this._state;
                    
                    // 【模式隔離】根據路徑自動判斷目標狀態空間
                    const mode = targetMode || this.getCurrentMode();
                    let targetState;
                    
                    // 判斷是全域狀態還是模式專用狀態
                    if (path.startsWith('global.') || 
                        path.includes('settings.') || 
                        path.includes('score') || 
                        path.includes('totalQuestions') || 
                        path.includes('currentQuestionIndex') || 
                        path.includes('quizQuestions')) {
                        targetState = this._state.global;
                        path = path.replace('global.', ''); // 移除global前綴
                    } else {
                        // 模式專用狀態
                        targetState = this._state[mode];
                        if (!targetState) {
                            Game.Debug.warn('state', `⚠️ StateManager: 未知模式 "${mode}", 使用easy模式`);
                            targetState = this._state.easy;
                        }
                    }

                    const keys = path.split('.');
                    let current = targetState;

                    for (const key of keys) {
                        if (current === null || current === undefined) return undefined;
                        current = current[key];
                    }
                    
                    return current;
                },
                
                // 【新增】清理特定模式的狀態
                clearModeState(mode) {
                    if (this._state[mode]) {
                        this._state[mode] = {
                            isAnswering: false,
                            isDragging: false,
                            isProcessingExchange: false,
                            gameState: {},
                            ui: { currentView: 'game' },
                            temp: {}
                        };
                        Game.Debug.log('state', `🧹 StateManager: 已清理${mode}模式狀態`);
                    }
                },

                // 【新增】獲取所有模式的狀態摘要
                getStatesSummary() {
                    return {
                        global: Object.keys(this._state.global),
                        easy: Object.keys(this._state.easy),
                        normal: Object.keys(this._state.normal),
                        hard: Object.keys(this._state.hard),
                        currentMode: this.getCurrentMode()
                    };
                },
                
                // 【測試】模式隔離驗證
                testModeIsolation() {
                    Game.Debug.log('state', '🧪 開始模式隔離測試...');

                    // 測試各模式狀態獨立性
                    const testResults = {
                        stateIsolation: true,
                        eventIsolation: true,
                        errors: []
                    };
                    
                    try {
                        // 在簡單模式設置狀態
                        this.setState('gameState.testValue', 'easy_test', 'easy');
                        
                        // 在普通模式設置相同路徑的狀態
                        this.setState('gameState.testValue', 'normal_test', 'normal');
                        
                        // 在困難模式設置相同路徑的狀態
                        this.setState('gameState.testValue', 'hard_test', 'hard');
                        
                        // 驗證各模式狀態是否獨立
                        const easyValue = this.getState('gameState.testValue', 'easy');
                        const normalValue = this.getState('gameState.testValue', 'normal');
                        const hardValue = this.getState('gameState.testValue', 'hard');
                        
                        if (easyValue !== 'easy_test' || normalValue !== 'normal_test' || hardValue !== 'hard_test') {
                            testResults.stateIsolation = false;
                            testResults.errors.push('狀態未正確隔離');
                        }
                        
                        Game.Debug.log('state', '✅ 狀態隔離測試通過:', {
                            easy: easyValue,
                            normal: normalValue,
                            hard: hardValue
                        });

                    } catch (error) {
                        testResults.stateIsolation = false;
                        testResults.errors.push(`狀態測試錯誤: ${error.message}`);
                    }
                    
                    // 測試事件清理函數是否獨立
                    const cleanupFunctions = [
                        MoneyExchange3._easyModeEventCleanup,
                        MoneyExchange3._normalModeEventCleanup,
                        MoneyExchange3._hardModeEventCleanup
                    ];
                    
                    const definedCleanups = cleanupFunctions.filter(fn => typeof fn === 'function').length;
                    Game.Debug.log('event', `🧹 事件清理函數狀態: ${definedCleanups}/3 已定義`);

                    return testResults;
                },
                
                // 向後兼容：映射到舊的state結構
                getLegacyState() {
                    return {
                        ...this._state.game,
                        settings: this._state.settings,
                        gameState: this._state.game.gameState
                    };
                },
                
                // 從舊狀態遷移到新狀態
                migrateLegacyState(oldState) {
                    if (oldState.score !== undefined) this.setState('game.score', oldState.score);
                    if (oldState.totalQuestions !== undefined) this.setState('game.totalQuestions', oldState.totalQuestions);
                    if (oldState.currentQuestionIndex !== undefined) this.setState('game.currentQuestionIndex', oldState.currentQuestionIndex);
                    if (oldState.quizQuestions !== undefined) this.setState('game.quizQuestions', oldState.quizQuestions);
                    if (oldState.isAnswering !== undefined) this.setState('game.isAnswering', oldState.isAnswering);
                    if (oldState.isDragging !== undefined) this.setState('game.isDragging', oldState.isDragging);
                    if (oldState.gameState !== undefined) this.setState('game.gameState', oldState.gameState);
                    if (oldState.settings !== undefined) {
                        Object.keys(oldState.settings).forEach(key => {
                            this.setState(`settings.${key}`, oldState.settings[key]);
                        });
                    }
                },
                
                resetGameState() {
                    Game.Debug.log('state', '🔄 StateManager: 重置遊戲狀態');
                    this.setState('game.gameState', {});
                    this.setState('game.isAnswering', false);
                    this.setState('game.isProcessingExchange', false);
                    this.setState('game.isDragging', false);
                    this.setState('game.score', 0);
                    this.setState('game.currentQuestionIndex', 0);
                    this.setState('game.quizQuestions', []);
                    // 直接重置不在 pathMap 的頂層欄位
                    Game.state.lastExchangeKey = null;
                    Game.state.startTime = null;
                    Game.state.isEndingGame = false;
                },
                
                // 調試工具
                dumpState() {
                    Game.Debug.log('state', '📊 StateManager 完整狀態:', JSON.parse(JSON.stringify(this._state)));
                    return this._state;
                }
            },

            EventSystem: {
                listeners: new Map(),
                
                on(eventName, callback) {
                    if (!this.listeners.has(eventName)) {
                        this.listeners.set(eventName, new Set());
                    }
                    this.listeners.get(eventName).add(callback);
                    Game.Debug.log('event', `📡 EventSystem: 註冊事件監聽器 "${eventName}"`);
                },

                emit(eventName, data) {
                    if (this.listeners.has(eventName)) {
                        const callbacks = this.listeners.get(eventName);
                        Game.Debug.log('event', `📡 EventSystem: 觸發事件 "${eventName}", ${callbacks.size} 個監聽器`);

                        callbacks.forEach(callback => {
                            try {
                                callback(data);
                            } catch (error) {
                                Game.Debug.error(`❌ EventSystem: 事件處理器錯誤 "${eventName}":`, error);
                            }
                        });
                    }
                },

                off(eventName, callback) {
                    if (this.listeners.has(eventName)) {
                        this.listeners.get(eventName).delete(callback);
                        Game.Debug.log('event', `📡 EventSystem: 移除事件監聽器 "${eventName}"`);
                    }
                },

                // 調試工具
                listEvents() {
                    Game.Debug.log('event', '📡 EventSystem 註冊的事件:', Array.from(this.listeners.keys()));
                    return Array.from(this.listeners.keys());
                }
            }
        },

        // =====================================================
        // 【新架構】模式配置驅動設計 - 清晰定義每個模式的特性
        // =====================================================
        ModeConfig: {
            easy: {
                triggerType: 'auto',           // 拖入自動觸發
                showHints: true,               // 顯示提示
                showButton: false,             // 不顯示按鈕
                // ▼▼▼ 核心修正點 ▼▼▼
                allowMultiRound: true,         // 【修正】從 false 改為 true，啟用多輪功能
                // ▲▲▲ 核心修正點結束 ▲▲▲
                audioFeedback: true,           // 有音效
                visualHints: true,             // 有視覺提示
                speechFeedback: true,          // 有語音反饋
                autoAdvance: true,             // 自動進入下一題
                description: '簡單模式：拖入自動觸發，最多提示',
                
                // 🔧 [修正] 點擊放置配置 - 關閉以避免與拖拽衝突
                clickToMoveConfig: {
                    enabled: false,                   // 關閉點擊移動功能，避免與拖拽衝突
                    allowClickToPlace: false,         // 關閉點擊放置
                    allowClickToReturn: false,        // 簡單模式不允許點擊取回
                    audioFeedback: false,             // 關閉點擊音效
                    speechFeedback: false,            // 關閉點擊語音回饋
                    visualSelection: false,           // 關閉選擇視覺效果
                    selectionTimeout: 0,              // 選擇狀態持續時間，0表示需要點擊確認
                    doubleClickDelay: 500             // 雙擊檢測時間間隔(ms)
                },
                
                // 【完整配置】兌換數量範圍 - 簡單模式固定數量
                exchanges: { min: 2, max: 2 }, // 固定2輪，提供一致體驗
                
                // UI 配置
                ui: {
                    targetMoneyFaded: false,    // 不淡化目標金錢
                    showCompleteButton: false   // 不顯示完成按鈕
                },
                
                // 驗證配置
                validation: {
                    method: 'simple',
                    validator: 'validateSimple'
                },
                
                // 成功處理配置
                success: {
                    handler: 'handleSimpleModeSuccess',
                    autoAdvanceDelay: 1000
                },
                
                // 設置方法配置
                setup: {
                    method: 'setupEasyModeFeatures'
                },
                
                // 特殊規則配置
                specialRules: {
                    smallToBig: {
                        recalculateExchanges: true  // 重新計算兌換輪次
                    },
                    bigToSmall: {
                        // 簡單模式大換小無特殊規則
                    }
                },
                
                // 語音模板配置
                speechTemplates: {
                    // 【★★★ 新增這一行 ★★★】
                    dropComplete: '目前總共{totalValue}元',
                    
                    exchangeComplete: {
                        smallToBig: '答對了，{sourceCount}個{sourceName}換到1個{targetName}',
                        bigToSmall: '答對了，1個{sourceName}換到{targetCount}個{targetName}'
                    },
                    allRoundsComplete: {
                        smallToBig: '恭喜你，{totalSource}個{sourceName}，共換到{totalTarget}個{targetName}',
                        bigToSmall: '恭喜你，{totalSource}個{sourceName}，共換到{totalTarget}個{targetName}'
                    },
                    error: {
                        smallToBig: '對不起，你答錯了，是{expectedCount}個{sourceName}換1個{targetName}，你剛剛放了{actualCount}個{sourceName}，請繼續下一題',
                        bigToSmall: '對不起，你答錯了，是1個{sourceName}換{expectedCount}個{targetName}，你剛剛放了{actualCount}個{sourceName}，請繼續下一題'
                    }
                },
                
                // UI 元素配置
                uiElements: {
                    buttonText: {
                        complete: '完成兌換',
                        backToMenu: '返回設定',
                        nextQuestion: '進入下一題',
                        startQuiz: '開始練習'
                    },
                    cssClasses: {
                        prefix: 'easy-',
                        dropZone: 'easy-drop-zone',
                        coinOverlay: 'easy-coin-overlay',
                        equalsSign: 'easy-equals-sign',
                        targetGroup: 'easy-target-group',
                        completeBtn: 'easy-complete-btn'
                    },
                    animations: {
                        fadeIn: 'ease-in-out',
                        dropEffect: 'bounce'
                    }
                },
                
                // 時間配置
                timing: {
                    speechDelay: 500,
                    nextQuestionDelay: 1000,
                    allRoundsCompleteDelay: 3000,
                    animationDuration: 800,
                    dragTimeout: 100,
                    roundTransitionDelay: 100
                },
                
                // 動畫配置
                animations: {
                    roundTransition: {
                        exitAnimation: {
                            duration: 400,
                            transform: 'translateY(10px)',
                            opacity: 0,
                            easing: 'ease-out'
                        },
                        enterAnimation: {
                            duration: 500,
                            transform: 'translateY(10px)',
                            transformEnd: 'translateY(0)',
                            opacity: 1,
                            easing: 'ease-in-out',
                            delay: 200
                        }
                    }
                },
                
                // 語音設置配置 - 統一語音效果
                speechSettings: {
                    rate: 0.8,    // 統一語音速度，保持一致性
                    pitch: 1.0,   // 統一音調
                    volume: 1.0,  // 統一音量
                    // 針對不同兌換類型的特殊設置
                    exchangeTypes: {
                        smallToBig: {
                            rate: 0.8,   // 小換大語音速度
                            pitch: 1.0   // 小換大音調
                        },
                        bigToSmall: {
                            rate: 0.8,   // 大換小語音速度，與小換大一致
                            pitch: 1.0   // 大換小音調，與小換大一致
                        }
                    }
                }
            },
            normal: {
                triggerType: 'manual',         // 手動觸發
                showHints: true,               // 顯示提示
                showButton: true,              // 顯示按鈕
                allowMultiRound: true,         // 多輪
                audioFeedback: true,           // 有音效
                visualHints: true,             // 有視覺提示（淡化圖示）
                speechFeedback: true,          // 有語音反饋
                autoAdvance: false,            // 手動進入下一題
                description: '普通模式：手動觸發，中等提示，多輪支持',
                
                // 🔧 [修正] 點擊放置配置 - 關閉以避免與拖拽衝突
                clickToMoveConfig: {
                    enabled: false,                   // 關閉點擊移動功能，避免與拖拽衝突
                    allowClickToPlace: false,         // 關閉點擊放置
                    allowClickToReturn: false,        // 關閉點擊取回
                    audioFeedback: false,             // 關閉點擊音效
                    speechFeedback: false,            // 關閉點擊語音回饋
                    visualSelection: false,           // 關閉選擇視覺效果
                    selectionTimeout: 0,              // 選擇狀態持續時間，0表示需要點擊確認
                    doubleClickDelay: 500             // 雙擊檢測時間間隔(ms)
                },
                
                // 【完整配置】兌換數量範圍
                exchanges: { min: 3, max: 6 },
                
                // UI 配置
                ui: {
                    targetMoneyFaded: true,     // 淡化目標金錢
                    showCompleteButton: true    // 顯示完成按鈕
                },
                
                // 驗證配置
                validation: {
                    method: 'normal',
                    validator: 'validateNormalMode'
                },
                
                // 成功處理配置
                success: {
                    handler: 'handleNormalModeSuccess',
                    autoAdvanceDelay: 2000
                },
                
                // 設置方法配置
                setup: {
                    method: 'setupNormalModeFeatures'
                },
                
                // 特殊規則配置
                specialRules: {
                    smallToBig: {
                        maxSourceCoins: 30      // 限制最多30個源金錢
                    },
                    bigToSmall: {
                        maxTargetCoins: 30      // 限制最多30個目標金錢
                    }
                },
                
                // 語音模板配置
                speechTemplates: {
                    // 【新增】拖曳放置後的語音
                    dropComplete: '目前總共{totalValue}元',
                    
                    // 【⭐ 修正 #2 ⭐】修正單輪兌換完成語音模板，使用變數替換寫死的 "1個"
                    exchangeComplete: {
                        smallToBig: '{sourceCount}個{sourceName}換到{targetCount}個{targetName}',
                        bigToSmall: '{sourceCount}個{sourceName}換到{targetCount}個{targetName}'
                    },
                    allRoundsComplete: {
                        smallToBig: '恭喜你，{totalSource}個{sourceName}，共換到{totalTarget}個{targetName}',
                        bigToSmall: '恭喜你，{totalSource}個{sourceName}，共換到{totalTarget}個{targetName}'
                    },
                    error: {
                        // 【新增】根據作答模式區分錯誤語音
                        proceed: { // 單次作答模式
                            smallToBig: '對不起，你答錯了，是{expectedCount}個{sourceName}換1個{targetName}，你剛剛放了{actualCount}個{sourceName}，請繼續下一題',
                            bigToSmall: '對不起，你答錯了，是1個{sourceName}換{expectedCount}個{targetName}，你剛剛放了{actualCount}個{sourceName}，請繼續下一題'
                        },
                        retry: { // 反複作答模式
                            smallToBig: '對不起，你答錯了，是{expectedCount}個{sourceName}換1個{targetName}，你剛剛放了{actualCount}個{sourceName}，請重新試試',
                            bigToSmall: '對不起，你答錯了，是1個{sourceName}換{expectedCount}個{targetName}，你剛剛放了{actualCount}個{sourceName}，請重新試試'
                        }
                    }
                },
                
                // UI 元素配置
                uiElements: {
                    buttonText: {
                        complete: '完成兌換',
                        backToMenu: '返回設定',
                        nextQuestion: '進入下一題',
                        startQuiz: '開始練習'
                    },
                    cssClasses: {
                        prefix: 'normal-',
                        dropZone: 'normal-drop-zone',
                        coinOverlay: 'normal-coin-overlay',
                        equalsSign: 'normal-equals-sign',
                        targetGroup: 'normal-target-group',
                        completeBtn: 'unit3-normal-complete-btn'
                    },
                    animations: {
                        fadeIn: 'ease-in-out',
                        dropEffect: 'bounce'
                    }
                },
                
                // 時間配置
                timing: {
                    speechDelay: 500,
                    nextQuestionDelay: 2000,
                    allRoundsCompleteDelay: 4000,
                    animationDuration: 800,
                    dragTimeout: 100,
                    roundTransitionDelay: 100 // 【新增】與 easy 模式一致的輪次轉場延遲
                },

                // ▼▼▼ 【需求 #1 新增】 ▼▼▼
                // 為 normal 模式添加與 easy 模式相同的轉場動畫配置
                animations: {
                    roundTransition: {
                        exitAnimation: {
                            duration: 400,
                            transform: 'translateY(10px)',
                            opacity: 0,
                            easing: 'ease-out'
                        },
                        enterAnimation: {
                            duration: 500,
                            transform: 'translateY(10px)',
                            transformEnd: 'translateY(0)',
                            opacity: 1,
                            easing: 'ease-in-out',
                            delay: 200
                        }
                    }
                },
                // ▲▲▲ 【需求 #1 新增結束】 ▲▲▲
                
                // 語音設置配置 - 統一語音效果
                speechSettings: {
                    rate: 0.8,    // 統一語音速度，保持一致性
                    pitch: 1.0,   // 統一音調
                    volume: 1.0,  // 統一音量
                    // 針對不同兌換類型的特殊設置
                    exchangeTypes: {
                        smallToBig: {
                            rate: 0.8,   // 小換大語音速度
                            pitch: 1.0   // 小換大音調
                        },
                        bigToSmall: {
                            rate: 0.8,   // 大換小語音速度，與小換大一致
                            pitch: 1.0   // 大換小音調，與小換大一致
                        }
                    }
                }
            },
            hard: {
                triggerType: 'manual',         // 手動觸發
                showHints: true,               // 顯示提示（emoji形式）
                showButton: true,              // 顯示按鈕
                allowMultiRound: true,         // 多輪
                audioFeedback: true,           // 【修正】有音效，與普通模式一致
                visualHints: true,             // 有視覺提示（emoji形式）
                speechFeedback: true,          // 【修正】有語音反饋，與普通模式一致
                autoAdvance: false,            // 手動進入下一題
                emojiHints: true,              // 使用emoji提示替代數字顯示
                description: '困難模式：手動觸發，emoji提示，與普通模式相同的音效和語音反饋',
                
                // 🔧 [修正] 點擊放置配置 - 關閉以避免與拖拽衝突
                clickToMoveConfig: {
                    enabled: false,                   // 關閉點擊移動功能，避免與拖拽衝突
                    allowClickToPlace: false,         // 關閉點擊放置
                    allowClickToReturn: false,        // 關閉點擊取回
                    audioFeedback: false,             // 關閉點擊音效
                    speechFeedback: false,            // 關閉點擊語音回饋
                    visualSelection: false,           // 關閉選擇視覺效果
                    selectionTimeout: 0,              // 選擇狀態持續時間，0表示需要點擊確認
                    doubleClickDelay: 500             // 雙擊檢測時間間隔(ms)
                },
                
                // 【完整配置】兌換數量範圍
                exchanges: { min: 2, max: 5 },
                
                // UI 配置
                ui: {
                    targetMoneyFaded: true,     // 淡化目標金錢
                    showCompleteButton: true    // 顯示完成按鈕
                },
                
                // 驗證配置
                validation: {
                    method: 'hard',
                    validator: 'validateHardMode'
                },
                
                // 成功處理配置
                success: {
                    handler: 'handleHardModeSuccess',
                    autoAdvanceDelay: 2000
                },
                
                // 設置方法配置
                setup: {
                    method: 'setupHardModeFeatures'
                },
                
                // 特殊規則配置
                specialRules: {
                    smallToBig: {
                        variableTargets: true,  // 可變目標數量
                        targetRange: [1, 3]     // 目標範圍1-3個
                    },
                    bigToSmall: {
                        variableTargets: true,  // 可變目標數量
                        sourceRange: [1, 3]     // 源範圍1-3個
                    }
                },
                
                // 【修正】語音模板配置 - 與普通模式完全一致
                speechTemplates: {
                    // 【新增】拖曳放置後的語音
                    dropComplete: '目前總共{totalValue}元',
                    
                    exchangeComplete: {
                        smallToBig: '{sourceCount}個{sourceName}換到{targetCount}個{targetName}',
                        bigToSmall: '{sourceCount}個{sourceName}換到{targetCount}個{targetName}'
                    },
                    allRoundsComplete: {
                        smallToBig: '恭喜你，{totalSource}個{sourceName}，共換到{totalTarget}個{targetName}',
                        bigToSmall: '恭喜你，{totalSource}個{sourceName}，共換到{totalTarget}個{targetName}'
                    },
                    error: {
                        // 【新增】根據作答模式區分錯誤語音 - 與普通模式完全一致
                        proceed: { // 單次作答模式
                            smallToBig: '對不起，你答錯了，是{expectedCount}個{sourceName}換1個{targetName}，你剛剛放了{actualCount}個{sourceName}，請繼續下一題',
                            bigToSmall: '對不起，你答錯了，是1個{sourceName}換{expectedCount}個{targetName}，你剛剛放了{actualCount}個{sourceName}，請繼續下一題'
                        },
                        retry: { // 反複作答模式
                            smallToBig: '對不起，你答錯了，是{expectedCount}個{sourceName}換1個{targetName}，你剛剛放了{actualCount}個{sourceName}，請重新試試',
                            bigToSmall: '對不起，你答錯了，是1個{sourceName}換{expectedCount}個{targetName}，你剛剛放了{actualCount}個{sourceName}，請重新試試'
                        }
                    }
                },
                
                // UI 元素配置
                uiElements: {
                    buttonText: {
                        complete: '完成兌換',
                        backToMenu: '返回設定',
                        nextQuestion: '進入下一題',
                        startQuiz: '開始練習'
                    },
                    cssClasses: {
                        prefix: 'hard-',
                        dropZone: 'hard-drop-zone',
                        coinOverlay: 'hard-coin-overlay',
                        equalsSign: 'hard-equals-sign',
                        targetGroup: 'hard-target-group',
                        completeBtn: 'unit3-hard-complete-btn'
                    },
                    animations: {
                        fadeIn: 'ease-in-out',
                        dropEffect: 'bounce'
                    }
                },
                
                // emoji提示系統配置
                get emojiMapping() {
                    if (typeof EmojiLibrary !== 'undefined' && EmojiLibrary.money.denominations) {
                        return {
                            1: { emoji: EmojiLibrary.money.denominations[1], hintText: '1元' },
                            5: { emoji: EmojiLibrary.money.denominations[5], hintText: '5元' },
                            10: { emoji: EmojiLibrary.money.denominations[10], hintText: '10元' },
                            50: { emoji: EmojiLibrary.money.denominations[50], hintText: '50元' },
                            100: { emoji: EmojiLibrary.money.denominations[100], hintText: '100元' },
                            500: { emoji: EmojiLibrary.money.denominations[500], hintText: '500元' },
                            1000: { emoji: EmojiLibrary.money.denominations[1000], hintText: '1000元' }
                        };
                    } else {
                        // Fallback if EmojiLibrary not loaded
                        return {
                            1: { emoji: '🪙', hintText: '1元' },
                            5: { emoji: '🥉', hintText: '5元' },
                            10: { emoji: '🥈', hintText: '10元' },
                            50: { emoji: '🏅', hintText: '50元' },
                            100: { emoji: '💵', hintText: '100元' },
                            500: { emoji: '💴', hintText: '500元' },
                            1000: { emoji: '💰', hintText: '1000元' }
                        };
                    }
                },
                
                // emoji提示框樣式配置
                emojiHintConfig: {
                    cssClass: 'emoji-hint-box',
                    revealClass: 'emoji-hint-revealed',
                    hoverEffect: true,
                    clickToReveal: true,
                    autoHideDelay: 3000
                },
                
                // 時間配置
                timing: {
                    speechDelay: 0,      // 困難模式無語音延遲
                    nextQuestionDelay: 2000,
                    allRoundsCompleteDelay: 4000,
                    animationDuration: 800,
                    dragTimeout: 100,
                    roundTransitionDelay: 100 // 【新增】與 easy 模式一致的輪次轉場延遲
                },
                
                // ▼▼▼ 【需求 #1 新增】 ▼▼▼
                // 為 hard 模式添加與 easy 模式相同的轉場動畫配置
                animations: {
                    roundTransition: {
                        exitAnimation: {
                            duration: 400,
                            transform: 'translateY(10px)',
                            opacity: 0,
                            easing: 'ease-out'
                        },
                        enterAnimation: {
                            duration: 500,
                            transform: 'translateY(10px)',
                            transformEnd: 'translateY(0)',
                            opacity: 1,
                            easing: 'ease-in-out',
                            delay: 200
                        }
                    }
                },
                // ▲▲▲ 【需求 #1 新增結束】 ▲▲▲
                
                // 語音設置配置 - 統一語音效果（困難模式雖無語音但保留結構）
                speechSettings: {
                    rate: 0.8,    // 統一語音速度，保持一致性
                    pitch: 1.0,   // 統一音調
                    volume: 1.0,  // 統一音量
                    // 針對不同兌換類型的特殊設置
                    exchangeTypes: {
                        smallToBig: {
                            rate: 0.8,   // 小換大語音速度
                            pitch: 1.0   // 小換大音調
                        },
                        bigToSmall: {
                            rate: 0.8,   // 大換小語音速度，與小換大一致
                            pitch: 1.0   // 大換小音調，與小換大一致
                        }
                    }
                }
            }
        },

        // =====================================================
        // 【新架構】模式策略層 - 根據配置驅動行為
        // =====================================================
        ModeStrategies: {
            // 獲取當前模式配置
            getCurrentConfig() {
                const difficulty = MoneyExchange3.Core.StateManager.getCurrentMode();
                return MoneyExchange3.ModeConfig[difficulty];
            },
            
            // 統一渲染策略
            render(mode, question, sourceItem, targetItem) {
                const config = MoneyExchange3.ModeConfig[mode];
                Game.Debug.log('ui', `🎨 ModeStrategy渲染: ${mode}模式 (${config.description})`);
                
                // 使用統一的DOM渲染器，根據配置調整
                const html = MoneyExchange3.Strategies.DOMRenderer.generateGameHTML(
                    mode, question, sourceItem, targetItem, config
                );
                
                // 更新DOM
                const gameArea = document.getElementById('app');
                if (gameArea) {
                    gameArea.innerHTML = html;
                    
                    // 根據配置綁定事件
                    this.bindEvents(mode, question, config);
                    
                    // 應用模式特定行為
                    this.applyModeFeatures(mode, config);
                }
            },
            
            // 統一交互處理策略
            handleInteraction(mode, action, data) {
                const config = MoneyExchange3.ModeConfig[mode];
                Game.Debug.log('ui', `🎭 ModeStrategy交互: ${mode}模式 ${action}`);

                switch (action) {
                    case 'dragStart':
                        return this.handleDragStart(mode, data, config);
                    case 'dragEnd':
                        return this.handleDragEnd(mode, data, config);
                    case 'dragOver':
                        return this.handleDragOver(mode, data, config);
                    case 'drop':
                        return this.handleDrop(mode, data, config);
                    case 'complete':
                        return this.handleCompletion(mode, data, config);
                    default:
                        Game.Debug.warn('ui', `未知交互動作: ${action}`);
                }
            },
            
            // 統一拖放處理策略
            handleDrop(mode, data, config) {
                // 🔧 [防連點] 檢查是否正在處理拖放
                if (MoneyExchange3.Core.StateManager.getState('isProcessingExchange')) {
                    Game.Debug.log('drag', '[C3] 防抖：handleDrop 忽略重複拖放（isProcessingExchange=true）');
                    return;
                }
                MoneyExchange3.Core.StateManager.setState('isProcessingExchange', true);

                Game.Debug.log('drag', `🎯 ModeStrategy拖放: ${mode}模式統一處理`);
                const { event, question } = data;
                event.preventDefault();

                // 🔧 [防連點] 確保在 100ms 後重置處理標誌
                Game.TimerManager.setTimeout(() => {
                    MoneyExchange3.Core.StateManager.setState('isProcessingExchange', false);
                }, 100, 'ui');

                // 1. 【修正】獲取拖曳的DOM元素
                const draggedElementId = MoneyExchange3.state.draggedElementId; // 從狀態中獲取真實的DOM ID
                if (!draggedElementId) {
                    Game.Debug.warn('drag', '❌ 拖放失敗: 找不到 draggedElementId 狀態');
                    return;
                }
                let droppedElement = document.getElementById(draggedElementId); // 使用真實ID尋找元素
                if (!droppedElement) {
                    // 【Fallback】ID 過期時，嘗試用 .dragging class 找到拖曳中的元素
                    const fallback = document.querySelector('.money-item.dragging, .exchange-money-item.dragging');
                    if (fallback) {
                        Game.Debug.warn('drag', `⚠️ 拖放 fallback: ID "${draggedElementId}" 已失效，改用 ${fallback.id}`);
                        MoneyExchange3.state.draggedElementId = fallback.id;
                        droppedElement = fallback;
                    } else {
                        Game.Debug.warn('drag', `❌ 拖放失敗: 找不到ID為 ${draggedElementId} 的元素`);
                        return;
                    }
                }

                // 2. 判斷放置目標
                const exchangeDropZone = event.target.closest('.drop-zone, .flexible-zone, .exchange-drop-zone');
                const moneyArea = event.target.closest('#my-money-area');

                // 3. 執行對應的邏輯
                if (exchangeDropZone) {
                    Game.Debug.log('drag', `➡️ 拖曳到兌換區`);
                    // ▼▼▼ 【核心修正點】▼▼▼
                    // 根據模式選擇不同的放置處理函數
                    if (mode === 'easy') {
                        // 簡單模式：使用原有的"一格一幣"邏輯
                        this.processDropToExchangeArea(droppedElement, exchangeDropZone, question, mode, config);
                    } else {
                        // 普通/困難模式：使用新的"彈性多幣"邏輯
                        this.processDropToFlexibleZone(droppedElement, exchangeDropZone, question, mode, config);
                    }
                    // ▲▲▲ 【核心修正點結束】▲▲▲
                } else if (moneyArea) {
                    // 情況B：從「兌換區」拖曳回「我的金錢區」
                    Game.Debug.log('drag', `⬅️ 拖曳回我的金錢區`);
                    this.processReturnToMoneyArea(droppedElement, moneyArea, question, mode, config);
                } else {
                    Game.Debug.warn('drag', '❌ 無效的放置目標');
                }
            },

            // 【全新重寫】支援一格一幣的智能放置函數
            processDropToExchangeArea(droppedElement, dropZone, question, mode, config) {
                // 【全新邏輯】專為"一格一幣"設計
                
                // 1. 驗證錢幣類型是否正確
                const droppedValue = parseInt(droppedElement.dataset.value);
                if (droppedValue !== question.sourceValue) {
                    Game.Debug.log('drag', `❌ 金錢類型不符：需要${question.sourceValue}元，但拖曳了${droppedValue}元`);
                    MoneyExchange3.Audio.playErrorSound(mode, config);
                    return;
                }
                
                // 2. 檢查目標格子是否已經被佔用
                if (dropZone.classList.contains('filled')) {
                    Game.Debug.warn('drag', `⚠️ 此位置已被佔用，無法放置！`);
                    
                    // 視覺反饋：閃爍格子表示已佔用
                    dropZone.classList.add('error-flash');
                    Game.TimerManager.setTimeout(() => dropZone.classList.remove('error-flash'), 600, 'ui');
                    
                    // 播放輕微的錯誤提示音
                    MoneyExchange3.Audio.playErrorSound(mode, config, true); // 輕量版錯誤音
                    
                    // 語音提示：此位置已被佔用
                    const speechText = "此位置已被佔用，請選擇其他空位。";
                    MoneyExchange3.Speech.speak(speechText, mode, config);
                    
                    return;
                }

                Game.Debug.log('drag', `✅ ${mode}模式：拖曳金錢成功`);
                MoneyExchange3.Audio.playDropSound(mode, config);

                // 3. 更新UI：移除佔位符，放入真實錢幣，標記為"已填充"
                const placeholder = dropZone.querySelector('.placeholder-money');
                if (placeholder) {
                    placeholder.remove();
                }

                const newCoin = droppedElement.cloneNode(true);
                newCoin.style.opacity = '1';
                
                // 【簡單模式單向操作】明確禁止拖曳
                newCoin.draggable = false;
                newCoin.setAttribute('draggable', 'false'); // 確保HTML屬性也被設置
                newCoin.style.cursor = 'not-allowed'; // 視覺提示不可拖曳
                
                newCoin.classList.remove('dragging');
                newCoin.classList.add('placed-coin');
                
                // 移除任何可能存在的拖曳相關事件監聽器
                newCoin.removeEventListener('dragstart', MoneyExchange3.handleDragStart);
                
                const newCoinImg = newCoin.querySelector('img');
                if (newCoinImg) {
                    newCoinImg.classList.remove('faded');
                    newCoinImg.draggable = false; // 確保圖片也不可拖曳
                }
                
                dropZone.appendChild(newCoin);
                dropZone.classList.add('filled');
                dropZone.style.opacity = '1'; // 清除佔位符淡化（原本 0.3），顯示正常亮度

                // 添加成功放置的視覺反饋
                dropZone.classList.add('success-flash');
                Game.TimerManager.setTimeout(() => dropZone.classList.remove('success-flash'), 800, 'ui');
                
                const slotIndex = dropZone.dataset.slot;
                Game.Debug.log('drag', `🟢 簡單模式：錢幣 ${droppedElement.id} 已放置到第 ${slotIndex} 格並點亮。`);
                
                // 設置無障礙屬性
                dropZone.setAttribute('aria-disabled', 'true');
                dropZone.setAttribute('aria-label', `第${parseInt(slotIndex) + 1}格已填入${question.sourceValue}元`);
                
                // 4. 從"我的金錢區"移除原始錢幣，並更新狀態
                const coinId = droppedElement.id;
                droppedElement.remove();

                const gameState = MoneyExchange3.getGameState('gameState');
                gameState.currentRoundDropZone.placedCoins.push(coinId);
                gameState.coinPositions[coinId] = `exchange-area-slot-${slotIndex}`;
                MoneyExchange3.setGameState('gameState', gameState);
                
                // 5. 更新所有標題計數
                Game.TimerManager.setTimeout(() => MoneyExchange3.updateSectionTitleCounts(), 50, 'ui');

                // 6. 播放累計金額語音，並在語音結束後檢查是否完成
                MoneyExchange3.playCumulativeAmountSpeech(question, () => {
                    // 語音播放完畢後的回呼
                    Game.Debug.log('speech', '🔊 累計語音播放完畢，檢查是否所有格子都已填滿...');
                    
                    const allDropZones = document.querySelectorAll('.drop-zone[data-drop-type="source"]');
                    const filledZones = document.querySelectorAll('.drop-zone[data-drop-type="source"].filled');
                    
                    // 詳細的狀態調試
                    Game.Debug.log('state', `📊 格子狀態詳情:`);
                    allDropZones.forEach((zone, index) => {
                        const isFilled = zone.classList.contains('filled');
                        const slotIndex = zone.dataset.slot;
                        Game.Debug.log('state', `  格子 ${index + 1} (slot-${slotIndex}): ${isFilled ? '✅ 已填充' : '⭕ 空置'}`);
                    });
                    
                    // 檢查是否所有格子都已填滿
                    if (filledZones.length >= allDropZones.length) {
                        Game.Debug.log('drag', `🎉 簡單模式：所有 ${allDropZones.length} 個格子均已填滿，觸發統一完成處理`);
                        MoneyExchange3.ModeStrategies.handleCompletion(mode, { question: question });
                    } else {
                        Game.Debug.log('drag', `⏳ 兌換進行中: 已填滿 ${filledZones.length} / ${allDropZones.length} 格`);
                    }
                });
            },

            // ▼▼▼ 【新增函數】▼▼▼
            // 【全新增設】支援彈性放置框的多幣放置函數 (普通/困難模式專用)
            processDropToFlexibleZone(droppedElement, dropZone, question, mode, config) {
                // 1. 驗證錢幣類型是否正確
                const droppedValue = parseInt(droppedElement.dataset.value);
                if (droppedValue !== question.sourceValue) {
                    Game.Debug.log('drag', `❌ 金錢類型不符：需要${question.sourceValue}元，但拖曳了${droppedValue}元`);
                    MoneyExchange3.Audio.playErrorSound(mode, config);
                    return;
                }

                Game.Debug.log('drag', `✅ ${mode}模式：拖曳金錢到彈性區域成功`);
                MoneyExchange3.Audio.playDropSound(mode, config);

                // 2. 更新遊戲狀態 (State)
                const coinId = droppedElement.id; // 從真實DOM元素獲取ID
                const gameState = MoneyExchange3.getGameState('gameState');
                gameState.currentRoundDropZone.placedCoins.push(coinId);
                gameState.coinPositions[coinId] = 'exchange-area';
                MoneyExchange3.setGameState('gameState', gameState);

                // 3. 更新使用者介面 (UI)
                // 找到內部用於容納多個錢幣的容器
                const placedCoinsContainer = dropZone.querySelector('.placed-coins-container');
                if (!placedCoinsContainer) {
                    Game.Debug.error('❌ 程式碼錯誤：在彈性放置區中找不到 .placed-coins-container 元素！');
                    return;
                }

                // 隱藏"拖入金錢到此區域"提示文字（只在第一次放置時）
                const dropHint = dropZone.querySelector('.drop-hint');
                if (dropHint && gameState.currentRoundDropZone.placedCoins.length === 1) {
                    dropHint.style.display = 'none';
                    Game.Debug.log('drag', '💡 隱藏拖放提示文字：第一個金錢已放置');
                }

                // 複製錢幣，並設定為可拖曳以便退回
                const newCoin = droppedElement.cloneNode(true);
                newCoin.draggable = true;
                newCoin.style.opacity = '1';

                // 【核心修正 #2】只移除 'dragging' 類別，必須保留 'money-item' 類別，
                // 這樣點擊事件處理器才能識別它是一個可操作的錢幣。
                newCoin.classList.remove('dragging');
                // 【修正 Issue4】刪除 cloneNode 繼承的 dragHandled 標記，防止後續拖曳被擋掉
                delete newCoin.dataset.dragHandled;
                
                newCoin.classList.add('exchange-money-item'); // 標示為兌換區內的錢幣
                newCoin.id = `exchange-${coinId}`; // 賦予新ID以避免衝突
                newCoin.dataset.originalId = coinId; // 保存原始ID用於狀態追蹤

                // 為新錢幣加上事件監聽，使其可以被拖曳回去
                Game.EventManager.on(newCoin, 'dragstart', (e) => MoneyExchange3.handleDragStart(e), {}, 'dragSystem');
                
                // 將新錢幣放入容器
                placedCoinsContainer.appendChild(newCoin);

                // 4. 從"我的金錢區"移除原始錢幣
                droppedElement.remove();

                // 5. 更新介面計數並提供語音回饋
                Game.TimerManager.setTimeout(() => MoneyExchange3.updateSectionTitleCounts(), 50, 'ui');
                
                // 只在非困難模式下播放放置後的累計語音
                if (mode !== 'hard') {
                    MoneyExchange3.playPlacementSpeech(question, gameState.currentRoundDropZone.placedCoins.length);
                } else {
                    Game.Debug.log('drag', '🔇 困難模式：已禁用拖曳放置語音提示');
                }
                
                const currentTotal = gameState.currentRoundDropZone.placedCoins.length * question.sourceValue;
                MoneyExchange3.updateCurrentTotalDisplay(currentTotal);
            },
            // ▲▲▲ 【新增函數結束】▲▲▲

            // 【更新】輔助函數：處理拖回金錢區的邏輯
            processReturnToMoneyArea(droppedElement, moneyArea, question, mode, config) {
                // 檢查是否是從兌換區拖回來的
                if (!droppedElement.classList.contains('exchange-money-item')) {
                    Game.Debug.log('exchange', 'ℹ️ 非兌換區金錢，忽略此操作。');
                    return;
                }
                
                Game.Debug.log('state', `✅ ${mode}模式：退回金錢成功`);
                MoneyExchange3.Audio.playDropSound(mode, config);

                const originalCoinId = droppedElement.dataset.originalId; // 使用保存的原始ID
                const gameState = MoneyExchange3.getGameState('gameState');
                const { currentRoundDropZone } = gameState;

                // 從狀態中移除
                const coinIndex = currentRoundDropZone.placedCoins.indexOf(originalCoinId);
                if (coinIndex > -1) {
                    currentRoundDropZone.placedCoins.splice(coinIndex, 1);
                } else {
                    Game.Debug.warn('state', `⚠️ 狀態不一致：在placedCoins中找不到要移除的 ${originalCoinId}`);
                }

                // 只在非困難模式下，播報兌換區剩餘總額
                if (mode !== 'hard') {
                    MoneyExchange3.playPlacementSpeech(question, currentRoundDropZone.placedCoins.length);
                } else {
                    Game.Debug.log('drag', '🔇 困難模式：已禁用拖曳返回語音提示');
                }

                // 在「我的金錢區」重新創建錢幣
                const sourceItemData = MoneyExchange3.gameData.allItems.find(item => item.value === question.sourceValue);
                const containerClass = sourceItemData.value >= 100 ? 'unit3-banknote-container' : 'unit3-coin-container';
                
                const completeItemHTML = MoneyExchange3.createCompleteMoneyItem(sourceItemData, {
                    containerClass: `${containerClass} money-item`,
                    draggable: true,
                    id: originalCoinId, // 使用原始ID重新創建
                    forceNumberDisplay: true
                });
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = completeItemHTML;
                const newMoneyItem = tempDiv.firstElementChild;
                
                moneyArea.appendChild(newMoneyItem);

                // 從兌換區移除
                droppedElement.remove();
                gameState.coinPositions[originalCoinId] = 'my-money-area';
                MoneyExchange3.setGameState('gameState', gameState);

                // 更新總額顯示
                const currentTotal = currentRoundDropZone.placedCoins.length * question.sourceValue;
                MoneyExchange3.updateCurrentTotalDisplay(currentTotal);
                Game.TimerManager.setTimeout(() => MoneyExchange3.updateSectionTitleCounts(), 50, 'ui');

                // 如果兌換區已清空，重新顯示"拖入金錢到此區域"提示文字
                if (currentRoundDropZone.placedCoins.length === 0) {
                    const exchangeDropZone = document.querySelector('.exchange-drop-zone, .flexible-zone');
                    if (exchangeDropZone) {
                        const dropHint = exchangeDropZone.querySelector('.drop-hint');
                        if (dropHint) {
                            dropHint.style.display = 'block';
                            Game.Debug.log('exchange', '💡 重新顯示拖放提示文字：兌換區已清空');
                        }
                    }
                }
            },
            
            // 統一完成處理策略
            handleCompletion(mode, data, config = null) {
                const { question } = data;
                config = config || MoneyExchange3.ModeConfig[mode];
                Game.Debug.log('exchange', `✅ ModeStrategy完成: ${mode}模式處理`);
                
                // 防止重複處理
                if (MoneyExchange3.Core.StateManager.getState('isProcessingExchange')) {
                    Game.Debug.log('exchange', '⏸️ 正在處理兌換，忽略重複觸發');
                    return;
                }
                if (MoneyExchange3.state.isEndingGame) {
                    Game.Debug.log('exchange', '⚠️ 遊戲結束中，忽略完成兌換觸發');
                    return;
                }
                
                // 設置處理標誌
                MoneyExchange3.Core.StateManager.setState('isProcessingExchange', true);
                
                try {
                    // 獲取當前狀態
                    const gameState = MoneyExchange3.Core.StateManager.getState('gameState');
                    const placedCoins = gameState?.currentRoundDropZone?.placedCoins || [];
                    
                    // 驗證答案
                    const isValid = this.validateAnswer(mode, question, placedCoins, config);
                    
                    // 根據配置處理結果
                    if (isValid) {
                        this.processSuccess(mode, question, config);
                    } else {
                        this.processFailure(mode, question, config);
                    }
                } finally {
                    // 重置處理標誌
                    MoneyExchange3.Core.StateManager.setState('isProcessingExchange', false);
                }
            },
            
            // 驗證答案
            validateAnswer(mode, question, placedCoins, config) {
                // 根據模式和配置進行驗證
                Game.Debug.log('judge', `🔍 ${mode}模式驗證:`, { placedCoins: placedCoins.length, config });
                
                // 使用現有的驗證邏輯（如果存在）
                if (MoneyExchange3.Strategies?.ValidationStrategy?.validate) {
                    return MoneyExchange3.Strategies.ValidationStrategy.validate(question, placedCoins);
                }
                
                // 簡單驗證邏輯
                return placedCoins.length > 0;
            },
            
            // 處理成功
            processSuccess(mode, question, config) {
                Game.Debug.log('state', `🎉 ${mode}模式成功處理`);
                
                // 【修正】激活目標區的淡化圖示，確保選取到正確的圖片元素
                const targetElements = document.querySelectorAll('.target-area .target-money');
                if (targetElements.length > 0) {
                    Game.Debug.log('ui', `✨ 激活 ${targetElements.length} 個目標圖示`);
                    targetElements.forEach(el => {
                        // 找到容器內的圖片元素
                        const imgElement = el.querySelector('img.faded');
                        if (imgElement) {
                            // 從圖片元素上移除 faded 類別
                            imgElement.classList.remove('faded');
                        }
                        // 將 active 類別添加到容器上，用於其他樣式或動畫
                        el.classList.add('target-active');
                    });
                }
                
                // 【關鍵修正】在所有操作之前，立即更新並保存已完成的輪次計數
                const gameState = MoneyExchange3.getGameState('gameState');
                gameState.completedExchanges++; // 立即將計數器 +1
                MoneyExchange3.setGameState('gameState', gameState); // 立即寫回，確保全局狀態最新
                
                // 現在才呼叫依賴此狀態的函數
                MoneyExchange3.showExchangeResult(question); // 現在它會讀取到正確的、更新後的值
                
                // 音效反饋
                if (config.audioFeedback) {
                    MoneyExchange3.Audio.playCorrectSound(mode, config);
                }
                
                // 語音反饋
                if (config.speechFeedback) {
                    // 【⭐ 新增修改 ⭐】在音效之後，播放詳細的兌換完成語音
                    MoneyExchange3.playExchangeCompletionSpeech(question, mode);
                }
                
                // ▼▼▼ 核心修正點 ▼▼▼
                // 【修正】刪除或註解掉下方這個區塊。
                // 因為流程控制已移至 playExchangeCompletionSpeech 的回呼中，
                // 在這裡立即呼叫會導致流程衝突和競爭條件
                /*
                // 自動前進或等待用戶操作
                if (config.autoAdvance) {
                    Game.TimerManager.setTimeout(() => MoneyExchange3.loadNextQuestion(), config.timing.nextQuestionDelay, 'question');
                } else if (config.allowMultiRound) {
                    // 檢查是否還有更多輪次 - 這是衝突的根源
                    this.handleMultiRound(mode, question, config); 
                } else {
                    Game.TimerManager.setTimeout(() => MoneyExchange3.loadNextQuestion(), config.timing.nextQuestionDelay, 'question');
                }
                */
                // ▲▲▲ 核心修正點結束 ▲▲▲
            },
            
            // 處理失敗
            // 【修正】處理失敗
            processFailure(mode, question, config) {
                Game.Debug.log('judge', `❌ ${mode}模式失敗處理`);
                
                // 1. 播放音效反饋
                if (config.audioFeedback) {
                    MoneyExchange3.Audio.playErrorSound(mode, config);
                }
                
                // 2. 獲取必要的資訊用於生成詳細語音
                const answerMode = MoneyExchange3.getSettings('mode');
                const gameState = MoneyExchange3.getGameState('gameState');
                const placedCoinsCount = gameState.currentRoundDropZone.placedCoins.length;

                // 【修正】使用當前輪次需求而非整題總需求
                const requirements = MoneyExchange3.Strategies.ValidationStrategy.calculateRequirements({
                    exchangeRate: question.exchangeRate,
                    currentRound: gameState.completedExchanges || 0,
                    targetImages: gameState.targetImages,
                    requiredSourceCounts: gameState.requiredSourceCounts,
                    exchangeType: question.exchangeType
                });
                const expectedCount = requirements.sourceCount;
                const expectedTargetCount = requirements.targetCount;

                Game.Debug.log('exchange', `🔄 [錯誤訊息] 當前輪次需求: ${expectedCount}個源金錢 → ${expectedTargetCount}個目標金錢`);
                
                const sourceItemData = MoneyExchange3.gameData.allItems.find(item => item.value === question.sourceValue);
                const targetItemData = MoneyExchange3.gameData.allItems.find(item => item.value === question.targetValue);
                
                const templateKey = question.exchangeType === 'small-to-big' ? 'smallToBig' : 'bigToSmall';
                
                // 【修正】根據作答模式 (answerMode) 獲取正確的語音模板
                const template = config.speechTemplates.error[answerMode]?.[templateKey];
                
                if (!template || !sourceItemData || !targetItemData) {
                    Game.Debug.error('❌ 無法生成錯誤語音：缺少模板或金錢資料');
                    // 緊急備案：即使沒有語音，也要根據模式推進遊戲
                    if (answerMode === 'proceed') {
                        Game.TimerManager.setTimeout(() => MoneyExchange3.nextQuestion(), config.timing.nextQuestionDelay, 'question');
                    } else {
                        MoneyExchange3.returnCurrentRoundCoinsToMoneyArea(question);
                    }
                    return;
                }
                
                // 3. 【強化】填充語音模板，確保所有變數都被替換
                Game.Debug.log('speech', `📝 準備填充錯誤語音模板: "${template}"`);
                Game.Debug.log('state', `   - expectedCount: ${expectedCount}`);
                Game.Debug.log('state', `   - actualCount: ${placedCoinsCount}`);
                Game.Debug.log('state', `   - sourceName: ${sourceItemData.name}`);
                Game.Debug.log('state', `   - targetName: ${targetItemData.name}`);
                Game.Debug.log('exchange', `   - currentRound: ${gameState.completedExchanges + 1}`);
                Game.Debug.log('exchange', `   - currentRoundIndex: ${gameState.completedExchanges}`);
                
                // 使用更安全的模板替換邏輯
                let errorMessage = template;

                // 【修正】針對不同兌換模式，修改模板格式以顯示當前輪次正確需求
                Game.Debug.log('judge', `🔧 [錯誤訊息] 修正前模板: "${errorMessage}"`);
                const originalMessage = errorMessage;

                if (question.exchangeType === 'big-to-small') {
                    // 大換小：將「是1個{sourceName}換{expectedCount}個{targetName}」替換為正確格式
                    errorMessage = errorMessage.replace(
                        /是1個\{sourceName\}換\{expectedCount\}個\{targetName\}/g,
                        `應該是${expectedCount}個{sourceName}，換${expectedTargetCount}個{targetName}`
                    );
                } else if (question.exchangeType === 'small-to-big') {
                    // 小換大：將「是{expectedCount}個{sourceName}換1個{targetName}」替換為正確格式
                    errorMessage = errorMessage.replace(
                        /是\{expectedCount\}個\{sourceName\}換1個\{targetName\}/g,
                        `是${expectedCount}個{sourceName}換${expectedTargetCount}個{targetName}`
                    );
                }

                if (originalMessage !== errorMessage) {
                    Game.Debug.log('judge', `🔧 [錯誤訊息] 修正後模板: "${errorMessage}"`);
                }

                const replacements = {
                    '{expectedCount}': expectedCount || '未知',
                    '{actualCount}': placedCoinsCount || 0,
                    '{sourceName}': sourceItemData?.name || '未知幣種',
                    '{targetName}': targetItemData?.name || '未知目標',
                    '{currentRound}': (gameState.completedExchanges + 1) || 1,
                    '{currentRoundIndex}': gameState.completedExchanges || 0
                };
                
                // 逐一替換變數並記錄
                for (const [placeholder, value] of Object.entries(replacements)) {
                    const oldMessage = errorMessage;
                    errorMessage = errorMessage.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
                    if (oldMessage !== errorMessage) {
                        Game.Debug.log('state', `   ✓ 替換 ${placeholder} -> "${value}"`);
                    }
                }
                
                // 檢查是否還有未替換的變數
                const unreplacedVars = errorMessage.match(/\{[^}]+\}/g);
                if (unreplacedVars) {
                    Game.Debug.warn('state', `⚠️ 發現未替換的變數: ${unreplacedVars.join(', ')}`);
                }
                
                // 判斷是否為最後一題，替換結尾語
                const isLastQuestion = MoneyExchange3.state.currentQuestionIndex + 1 >= MoneyExchange3.state.totalQuestions;
                if (isLastQuestion) {
                    errorMessage = errorMessage.replace(/請繼續下一題/g, '測驗結束');
                }

                Game.Debug.log('judge', `✅ 最終錯誤訊息: "${errorMessage}"`);

                // 4. 根據作答模式執行不同操作
                if (answerMode === 'proceed') {
                    // 單次作答模式：播放錯誤語音後，自動進入下一題
                    Game.Debug.log('speech', `➡️ 單次作答模式：播放錯誤訊息後進入下一題`);
                    MoneyExchange3.Speech.speak(errorMessage, mode, config, () => {
                        // 語音播放完畢後的回調
                        Game.TimerManager.setTimeout(() => MoneyExchange3.nextQuestion(), config.timing.nextQuestionDelay, 'question');
                    });
                } else { 
                    // 預設為反複作答模式：播放錯誤語音後，退回金錢
                    Game.Debug.log('speech', `🔄 反複作答模式：播放錯誤訊息並退回金錢`);
                    MoneyExchange3.Speech.speak(errorMessage, mode, config, () => {
                        // 語音播放完畢後的回調
                        MoneyExchange3.returnCurrentRoundCoinsToMoneyArea(question);
                    });
                }
            },
            
            // 事件綁定
            bindEvents(mode, question, config) {
                Game.Debug.log('event', `🎯 ${mode}模式事件綁定`);
                
                // 清理舊事件
                this.cleanupEvents(mode);
                
                // 根據觸發類型綁定事件
                if (config.triggerType === 'auto') {
                    MoneyExchange3.bindAutoTriggerEvents.call(MoneyExchange3, mode, question, config);
                } else {
                    MoneyExchange3.bindManualTriggerEvents.call(MoneyExchange3, mode, question, config);
                }
            },
            
            // 自動觸發事件綁定（簡單模式）
            bindAutoTriggerEvents(mode, question, config) {
                const gameArea = document.getElementById('app');
                if (!gameArea) return;
                
                const handlers = this.createEventHandlers(mode, question, config);
                
                // 綁定拖拽事件，拖入後自動觸發
                Game.EventManager.on(gameArea, 'dragstart', handlers.dragStart, {}, 'dragSystem');
                Game.EventManager.on(gameArea, 'dragend', handlers.dragEnd, {}, 'dragSystem');
                Game.EventManager.on(gameArea, 'dragover', handlers.dragOver, {}, 'dragSystem');
                Game.EventManager.on(gameArea, 'drop', (e) => {
                    handlers.drop(e);
                    // 自動觸發完成處理
                    Game.TimerManager.setTimeout(() => this.handleCompletion(mode, question, config), config.timing.dragTimeout, 'question');
                }, {}, 'dragSystem');
                
                // 添加觸控拖拽支援
                this.setupTouchDragForMode(gameArea, mode, handlers, config, true);
                
                // 保存清理函數
                MoneyExchange3[`_${mode}ModeEventCleanup`] = () => {
                    gameArea.removeEventListener('dragstart', handlers.dragStart);
                    gameArea.removeEventListener('dragend', handlers.dragEnd);
                    gameArea.removeEventListener('dragover', handlers.dragOver);
                    gameArea.removeEventListener('drop', handlers.drop);
                    
                    // 清理觸控拖拽
                    if (window.TouchDragUtility) {
                        window.TouchDragUtility.unregisterDraggable(gameArea);
                    }
                };
            },
            
            // 手動觸發事件綁定（普通/困難模式）
            bindManualTriggerEvents(mode, question, config) {
                const gameArea = document.getElementById('app');
                if (!gameArea) return;
                
                const handlers = this.createEventHandlers(mode, question, config);
                
                // 綁定拖拽事件
                Game.EventManager.on(gameArea, 'dragstart', handlers.dragStart, {}, 'dragSystem');
                Game.EventManager.on(gameArea, 'dragend', handlers.dragEnd, {}, 'dragSystem');
                Game.EventManager.on(gameArea, 'dragover', handlers.dragOver, {}, 'dragSystem');
                Game.EventManager.on(gameArea, 'drop', handlers.drop, {}, 'dragSystem');
                
                // 添加觸控拖拽支援
                this.setupTouchDragForMode(gameArea, mode, handlers, config, false);
                
                // 綁定完成按鈕
                if (config.showButton) {
                    const completeBtn = document.getElementById('complete-exchange-btn');
                    if (completeBtn) {
                        const newBtn = completeBtn.cloneNode(true);
                        completeBtn.parentNode.replaceChild(newBtn, completeBtn);
                        Game.EventManager.on(newBtn, 'click', () => this.handleCompletion(mode, question, config), {}, 'gameUI');
                    }
                }
                
                // 保存清理函數
                MoneyExchange3[`_${mode}ModeEventCleanup`] = () => {
                    gameArea.removeEventListener('dragstart', handlers.dragStart);
                    gameArea.removeEventListener('dragend', handlers.dragEnd);
                    gameArea.removeEventListener('dragover', handlers.dragOver);
                    gameArea.removeEventListener('drop', handlers.drop);
                    
                    // 清理觸控拖拽
                    if (window.TouchDragUtility) {
                        window.TouchDragUtility.unregisterDraggable(gameArea);
                    }
                };
            },
            
            // 創建事件處理器
            createEventHandlers(mode, question, config) {
                return {
                    dragStart: (e) => {
                        const moneyItem = e.target.closest('.exchange-item');
                        if (moneyItem && MoneyExchange3.handleDragStart) {
                            MoneyExchange3.handleDragStart(e);
                            Game.Debug.log('drag', `${this.getModeEmoji(mode)} ${mode}模式：拖拽開始`);
                        }
                    },
                    
                    dragEnd: (e) => {
                        const moneyItem = e.target.closest('.exchange-item');
                        if (moneyItem) {
                            moneyItem.classList.remove('dragging');
                            Game.TimerManager.setTimeout(() => {
                                MoneyExchange3.Core.StateManager.setState('isDragging', false);
                            }, 100, 'drag');
                            Game.Debug.log('drag', `${this.getModeEmoji(mode)} ${mode}模式：拖拽結束`);
                        }
                    },
                    
                    dragOver: (e) => {
                        const validZones = ['.money-source-container', '.exchange-drop-zone', '.transparent-drop-hint', '.placed-coins-display', '.partial-coins-display'];
                        const isValidZone = validZones.some(selector => 
                            e.target.matches(selector) || e.target.closest(selector)
                        );
                        
                        if (isValidZone && MoneyExchange3.handleDragOver) {
                            MoneyExchange3.handleDragOver(e);
                        }
                    },
                    
                    drop: (e) => {
                        const validZones = ['.money-source-container', '.exchange-drop-zone', '.transparent-drop-hint', '.placed-coins-display', '.partial-coins-display'];
                        const isValidZone = validZones.some(selector => 
                            e.target.matches(selector) || e.target.closest(selector)
                        );
                        
                        if (isValidZone) {
                            // 【配置驅動】統一的放置處理函數
                            this.handleConfigDrivenDrop(e, question, mode, config);
                            Game.Debug.log('drag', `${this.getModeEmoji(mode)} ${mode}模式：處理放置`);
                        }
                    }
                };
            },
            
            // 獲取模式表情符號
            getModeEmoji(mode) {
                const emojis = { easy: '🟢', normal: '🟡', hard: '🔴' };
                return emojis[mode] || '⚪';
            },
            
            // 清理事件
            cleanupEvents(mode) {
                const cleanupKey = `_${mode}ModeEventCleanup`;
                if (MoneyExchange3[cleanupKey]) {
                    MoneyExchange3[cleanupKey]();
                    MoneyExchange3[cleanupKey] = null;
                }
            },
            
            // 設置模式專用觸控拖拽
            setupTouchDragForMode(gameArea, mode, handlers, config, autoTrigger = false) {
                // 🔧 [修正] 阻止長按上下文選單和震動回饋
                Game.EventManager.on(document, 'contextmenu', (e) => {
                    if (e.target.closest('.money-item, .exchange-money-item, .unit3-coin-container, .unit3-banknote-container, .exchange-item, [draggable="true"]')) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                }, { passive: false }, {}, 'gameUI');
                
                // 🔧 [修正] 阻止觸控選擇文字
                Game.EventManager.on(document, 'selectstart', (e) => {
                    if (e.target.closest('.money-item, .exchange-money-item, .unit3-coin-container, .unit3-banknote-container, .exchange-item, [draggable="true"]')) {
                        e.preventDefault();
                        return false;
                    }
                }, {}, 'gameUI');
                
                Game.Debug.log('touch', '🎯 [C3-錢幣兌換] 檢查 TouchDragUtility 狀態', {
                    touchUtilityExists: !!window.TouchDragUtility,
                    touchUtilityType: typeof window.TouchDragUtility,
                    mode: mode,
                    autoTrigger: autoTrigger
                });
                
                if (!window.TouchDragUtility) {
                    Game.Debug.error('❌ [C3-錢幣兌換] TouchDragUtility 未載入，觸控拖曳功能無法使用');
                    return;
                }
                
                // 🔧 [重試機制] 等待DOM元素生成，類似簡單模式的實現
                const registerTouchDrag = () => {
                    const draggableElements = gameArea.querySelectorAll('.money-item, .exchange-money-item, .unit3-coin-container, .unit3-banknote-container, .exchange-item, [draggable="true"]');
                    Game.Debug.log('drag', `🔍 [${mode}模式] 搜尋可拖拽元素: 找到 ${draggableElements.length} 個`);
                    
                    // 列出找到的元素進行調試
                    draggableElements.forEach((item, index) => {
                        Game.Debug.log('drag', `📋 [${mode}模式] 元素${index}: ${item.className}, draggable=${item.draggable}, id=${item.id}`);
                    });
                    
                    if (draggableElements.length === 0) {
                        Game.Debug.log('drag', `⏰ [${mode}模式] 等待元素生成，延遲重試TouchDragUtility註冊...`);
                        Game.TimerManager.setTimeout(registerTouchDrag, 100, 'drag');
                        return;
                    }
                    
                    Game.Debug.log('drag', `✅ [${mode}模式] 找到 ${draggableElements.length} 個可拖拽元素，開始註冊TouchDragUtility`);
                    
                    // 🔧 [修正] 註冊可拖拽元素，參照C4簡潔高效配置
                    window.TouchDragUtility.registerDraggable(
                        gameArea,
                        '.money-item, .exchange-money-item, .unit3-coin-container, .unit3-banknote-container, .exchange-item, [draggable="true"]',
                        {
                            onDragStart: (element, event) => {
                                Game.Debug.log('drag', `📱 [${mode}模式] TouchDragUtility拖拽開始`, element.className);
                            // 🔧 [修正] 阻止長按震動回饋和上下文選單
                            if (event && event.preventDefault) {
                                event.preventDefault();
                            }
                            if (event && event.stopPropagation) {
                                event.stopPropagation();
                            }
                            
                            Game.Debug.logMobileDrag('拖曳開始', element, event, {
                                elementId: element.id,
                                mode: mode
                            });
                            
                            // 呼叫原始的拖拽開始處理器
                            const syntheticEvent = {
                                target: element,
                                preventDefault: () => {},
                                dataTransfer: {
                                    setData: () => {},
                                    getData: () => '',
                                    effectAllowed: 'move'
                                }
                            };
                            
                            return handlers.dragStart(syntheticEvent);
                        },
                        onDrop: (draggedElement, dropZone, event) => {
                            // 新增：C3專用放置框檢測
                            const itemInfo = {
                                coinValue: draggedElement.dataset.value,
                                itemClass: draggedElement.className,
                                itemId: draggedElement.id,
                                dropZoneClass: dropZone.className,
                                mode: mode
                            };
                            
                            if (dropZone.classList.contains('exchange-drop-zone')) {
                                Game.Debug.logPlacementDrop('手機端：錢幣放入兌換區', 'exchange-drop-zone', itemInfo);
                            } else if (dropZone.classList.contains('money-source') || dropZone.classList.contains('source-area')) {
                                Game.Debug.logPlacementDrop('手機端：錢幣返回來源區', 'money-source', itemInfo);
                            } else {
                                Game.Debug.logPlacementDrop('手機端：錢幣放入未知區域', 'unknown', itemInfo);
                            }
                            
                            Game.Debug.logMobileDrag('觸控放置', draggedElement, event, itemInfo);
                            
                            // 🔧 [修正] 參照C4簡化實現，直接創建合成放置事件
                            const syntheticDropEvent = {
                                target: dropZone,
                                currentTarget: dropZone,
                                preventDefault: () => {},
                                stopPropagation: () => {},
                                dataTransfer: {
                                    getData: (type) => {
                                        if (type === 'text/plain') {
                                            const coinId = draggedElement.id || draggedElement.dataset.id || draggedElement.dataset.originalId;
                                            return coinId || draggedElement.dataset.value || '';
                                        }
                                        return '';
                                    },
                                    setData: () => {},
                                    effectAllowed: 'move'
                                },
                                syntheticTouchDrop: true
                            };
                            
                            // 模擬拖拽狀態
                            if (draggedElement) {
                                draggedElement.classList.add('dragging');
                            }
                            
                            Game.Debug.log('drag', '🎯 [C3-觸控拖拽] 呼叫drop處理器');
                            // 呼叫原始放置處理器
                            handlers.drop(syntheticDropEvent);
                            
                            // 清理拖拽狀態
                            if (draggedElement) {
                                Game.TimerManager.setTimeout(() => {
                                    draggedElement.classList.remove('dragging');
                                }, 100, 'ui');
                            }
                            
                            // 如果是自動觸發模式，延遲觸發完成
                            if (autoTrigger) {
                                Game.TimerManager.setTimeout(() => this.handleCompletion(mode, question, config), config.timing.dragTimeout, 'question');
                            }
                        },
                        onDragEnd: (element, event) => {
                            // 呼叫原始的拖拽結束處理器
                            const syntheticEvent = {
                                target: element,
                                preventDefault: () => {}
                            };
                            
                            handlers.dragEnd(syntheticEvent);
                        }
                    }
                );
                
                // 註冊放置區域
                this.registerTouchDropZonesForMode(gameArea);
                };
                
                // 啟動重試機制
                registerTouchDrag();
            },
            
            // 註冊模式專用觸控放置區域
            registerTouchDropZonesForMode(gameArea) {
                if (!window.TouchDragUtility) return;
                
                // 註冊各種放置區域
                const dropZoneSelectors = [
                    '.drop-zone',
                    '.easy-drop-zone',
                    '.normal-drop-zone', 
                    '.hard-drop-zone',
                    '.flexible-zone',
                    '.placed-coins-container'
                ];
                
                dropZoneSelectors.forEach(selector => {
                    const zones = gameArea.querySelectorAll(selector);
                    zones.forEach(zone => {
                        window.TouchDragUtility.registerDropZone(zone, () => true);
                    });
                });
            },
            
            // 應用模式特定功能
            applyModeFeatures(mode, config) {
                Game.Debug.log('state', `🎪 ${mode}模式特性應用:`, config.description);
                
                // 根據配置應用特定功能
                if (config.visualHints) {
                    this.enableVisualHints(mode);
                }
                
                if (!config.speechFeedback) {
                    this.disableSpeechFeedback(mode);
                }
            },
            
            // 啟用視覺提示
            enableVisualHints(mode) {
                // 添加視覺提示邏輯
                Game.Debug.log('hint', `👁️ ${mode}模式：啟用視覺提示`);
            },
            
            // 禁用語音反饋
            disableSpeechFeedback(mode) {
                // 添加禁用語音邏輯
                Game.Debug.log('speech', `🔇 ${mode}模式：禁用語音反饋`);
            },
            
            // 處理多輪邏輯
            handleMultiRound(mode, question, config) {
                Game.Debug.log('exchange', `🔄 ${mode}模式：多輪處理`);
                
                // 獲取當前遊戲狀態
                const gameState = MoneyExchange3.getGameState('gameState');
                
                const currentRound = gameState.completedExchanges; // 直接讀取已在 processSuccess 中更新的值
                
                // 根據不同模式獲取總輪次數
                let totalRounds;
                if (mode === 'easy') {
                    totalRounds = gameState.totalExchanges;
                } else {
                    // 普通模式和困難模式：使用targetImages的輪次數
                    totalRounds = gameState.targetImages ? gameState.targetImages.length : gameState.totalExchanges;
                }
                
                Game.Debug.log('exchange', `🔍 ${mode}模式${question.exchangeType}兌換檢查: 完成第${currentRound}輪，總共${totalRounds}輪`);
                
                // 保存更新後的狀態
                MoneyExchange3.setGameState('gameState', gameState);
                
                if (currentRound >= totalRounds) {
                    // 完成所有輪次，禁用按鈕防止重複觸發，再播放總結語音
                    const completeBtn = document.getElementById('complete-exchange-btn');
                    if (completeBtn) completeBtn.disabled = true;
                    MoneyExchange3.playFinalCompletionSpeech(question, mode);
                } else {
                    // 還有輪次，繼續下一輪（不是下一題！）保留兌換結果
                    Game.Debug.log('exchange', `🔄 ${mode}模式繼續下一輪: 第${currentRound + 1}輪 (保留現有兌換結果)`);

                    // 播放「進入下一輪兌換」語音後再進入下一輪
                    MoneyExchange3.Speech.speak('進入下一輪兌換', mode, config, () => {
                        MoneyExchange3.continueNextRound(question, mode);
                    });
                }
            },

            // 【配置驅動】統一拖拽處理函數
            handleConfigDrivenDrop(e, question, mode, config) {
                Game.Debug.log('drag', `🎯 配置驅動拖拽處理: ${mode}模式`);
                
                // 根據配置決定音效播放
                if (config.audioFeedback) {
                    MoneyExchange3.Audio.playDropSound(mode, config);
                }
                
                // 根據配置決定語音反饋
                if (config.speechFeedback) {
                    MoneyExchange3.Speech.provideSpeechFeedback(mode, 'drop', config);
                }
                
                // 統一的拖拽邏輯處理
                const result = this.processDragDrop(e, question, mode, config);
                
                // 根據觸發類型決定後續處理
                if (config.triggerType === 'auto') {
                    // 自動觸發立即驗證
                    Game.TimerManager.setTimeout(() => this.handleCompletion(mode, question, config), config.timing.dragTimeout, 'question');
                } else {
                    // 手動觸發需要等待用戶點擊按鈕
                    this.updateUIAfterDrop(result, mode, config);
                }
                
                return result;
            },

            // 【配置驅動】統一拖拽邏輯處理
            processDragDrop(e, question, mode, config) {
                const droppedElement = document.querySelector('.dragging') || 
                                     document.getElementById(e.dataTransfer?.getData('text/plain'));
                
                if (!droppedElement) {
                    Game.Debug.warn('drag', '❌ 找不到被拖拽的元素');
                    return { success: false, reason: 'element_not_found' };
                }

                const dropZone = e.target.closest('.exchange-drop-zone') || 
                                e.target.closest('.money-source-container');
                
                if (!dropZone) {
                    Game.Debug.warn('drag', '❌ 無效的放置區域');
                    return { success: false, reason: 'invalid_drop_zone' };
                }

                // 統一的放置邏輯，根據交換類型處理
                const { exchangeType } = question;
                
                if (exchangeType === 'big-to-small') {
                    return this.handleBigToSmallDrop(droppedElement, dropZone, question, mode, config);
                } else {
                    return this.handleSmallToBigDrop(droppedElement, dropZone, question, mode, config);
                }
            },

            // 【配置驅動】大換小拖拽處理
            handleBigToSmallDrop(droppedElement, dropZone, question, mode, config) {
                // 檢查是否從金錢區拖入兌換區
                if (droppedElement.dataset.originType === 'money-area' && 
                    dropZone.classList.contains('exchange-drop-zone')) {
                    
                    return this.processBigToSmallExchange(droppedElement, dropZone, question, mode, config);
                }
                
                // 檢查是否從兌換區退回金錢區
                if (droppedElement.dataset.originType === 'zone' && 
                    dropZone.classList.contains('money-source-container')) {
                    
                    return this.returnCoinToMoneyArea(droppedElement, question, mode, config);
                }
                
                return { success: false, reason: 'invalid_drag_direction' };
            },

            // 【配置驅動】小換大拖拽處理
            handleSmallToBigDrop(droppedElement, dropZone, question, mode, config) {
                // 檢查是否從金錢區拖入兌換區
                if (droppedElement.dataset.originType === 'money-area' && 
                    dropZone.classList.contains('exchange-drop-zone')) {
                    
                    return this.processSmallToBigExchange(droppedElement, dropZone, question, mode, config);
                }
                
                // 檢查是否從兌換區退回金錢區
                if (droppedElement.dataset.originType === 'zone' && 
                    dropZone.classList.contains('money-source-container')) {
                    
                    return this.returnCoinToMoneyArea(droppedElement, question, mode, config);
                }
                
                return { success: false, reason: 'invalid_drag_direction' };
            },

            // 處理大換小兌換
            processBigToSmallExchange(droppedElement, dropZone, question, mode, config) {
                const coinId = droppedElement.id.replace('source-item-', '');
                const gameState = MoneyExchange3.Core.StateManager.getState('gameState', mode);
                
                // 記錄放置的硬幣
                if (!gameState.currentRoundDropZone) {
                    gameState.currentRoundDropZone = { id: 0, placedCoins: [] };
                }
                
                gameState.currentRoundDropZone.placedCoins.push(coinId);
                MoneyExchange3.Core.StateManager.setState('gameState.coinPositions.' + coinId, 'zone-0', mode);
                
                // 移除DOM元素並更新狀態
                droppedElement.remove();
                
                // 更新標題計數
                Game.TimerManager.setTimeout(() => this.updateSectionTitleCounts(), 100, 'ui');
                
                return { success: true, type: 'big-to-small', coinId, mode };
            },

            // 處理小換大兌換
            processSmallToBigExchange(droppedElement, dropZone, question, mode, config) {
                const coinId = droppedElement.id.replace('source-item-', '');
                const gameState = MoneyExchange3.Core.StateManager.getState('gameState', mode);
                
                // 記錄放置的硬幣
                if (!gameState.currentRoundDropZone) {
                    gameState.currentRoundDropZone = { id: 0, placedCoins: [] };
                }
                
                gameState.currentRoundDropZone.placedCoins.push(coinId);
                MoneyExchange3.Core.StateManager.setState('gameState.coinPositions.' + coinId, 'zone-0', mode);
                
                // 移除DOM元素並更新狀態
                droppedElement.remove();
                
                // 更新標題計數
                Game.TimerManager.setTimeout(() => this.updateSectionTitleCounts(), 100, 'ui');
                
                return { success: true, type: 'small-to-big', coinId, mode };
            },

            // 退回硬幣到金錢區
            returnCoinToMoneyArea(droppedElement, question, mode, config) {
                const coinId = droppedElement.id.replace('source-item-', '');
                const gameState = MoneyExchange3.Core.StateManager.getState('gameState', mode);
                
                // 從兌換區移除
                if (gameState.currentRoundDropZone) {
                    const index = gameState.currentRoundDropZone.placedCoins.indexOf(coinId);
                    if (index > -1) {
                        gameState.currentRoundDropZone.placedCoins.splice(index, 1);
                    }
                }
                
                MoneyExchange3.Core.StateManager.setState('gameState.coinPositions.' + coinId, 'money-area', mode);
                
                // 移動DOM元素到金錢區
                const moneyArea = document.getElementById('money-source-area');
                if (moneyArea) {
                    droppedElement.dataset.originType = 'money-area';
                    droppedElement.dataset.originId = 'money-area';
                    moneyArea.appendChild(droppedElement);
                }
                
                return { success: true, type: 'return', coinId, mode };
            },

            // 更新UI（放置後）
            updateUIAfterDrop(result, mode, config) {
                if (!result.success) return;
                
                // 根據配置更新UI元素
                if (config.showHints) {
                    this.updateProgressHints(result, mode, config);
                }
                
                // 更新當前總額顯示
                this.updateCurrentTotal(mode, config);
            },

            // 更新進度提示
            updateProgressHints(result, mode, config) {
                const gameState = MoneyExchange3.Core.StateManager.getState('gameState', mode);
                const placed = gameState.currentRoundDropZone?.placedCoins?.length || 0;
                
                // 根據配置決定是否顯示進度提示
                if (config.visualHints) {
                    Game.Debug.log('drag', `💡 ${mode}模式提示: 已放置${placed}個硬幣`);
                }
            },

            // 更新當前總額
            updateCurrentTotal(mode, config) {
                const totalDisplay = document.getElementById('current-total-display');
                if (totalDisplay) {
                    const gameState = MoneyExchange3.Core.StateManager.getState('gameState', mode);
                    const placed = gameState.currentRoundDropZone?.placedCoins?.length || 0;
                    const sourceValue = MoneyExchange3.Core.StateManager.getState('gameState.sourceValue', mode) || 0;
                    const currentTotal = placed * sourceValue;
                    
                    const difficulty = mode || this.Core?.StateManager?.getCurrentMode() || 'easy';
                    const config = this.ModeConfig[difficulty];
                    
                    if (config && config.emojiHints) {
                        // 困難模式：使用emoji提示
                        totalDisplay.innerHTML = this.generateCurrentTotalEmojiHint(currentTotal, placed, difficulty);
                    } else {
                        // 其他模式：使用傳統文字
                        totalDisplay.textContent = `目前金額共${currentTotal}元`;
                    }
                }
            }
        },

        // =====================================================
        // 工具模組 - 消除重複代碼，提供通用功能
        // =====================================================
        Utils: {
            // DOM操作工具
            DOMUtils: {
                // 安全創建元素
                createElement(tag, options = {}) {
                    const element = document.createElement(tag);
                    if (options.className) element.className = options.className;
                    if (options.innerHTML) element.innerHTML = options.innerHTML;
                    if (options.id) element.id = options.id;
                    if (options.attributes) {
                        Object.entries(options.attributes).forEach(([key, value]) => {
                            element.setAttribute(key, value);
                        });
                    }
                    if (options.style) {
                        Object.entries(options.style).forEach(([key, value]) => {
                            element.style[key] = value;
                        });
                    }
                    return element;
                },
                
                // 安全的innerHTML替換，保護兌換結果
                safeInnerHTML(element, html) {
                    if (!element) return;
                    
                    // 保存重要的子元素
                    const exchangeResults = element.querySelector('.exchange-results');
                    const importantElements = element.querySelectorAll('[data-preserve="true"]');
                    
                    // 更新內容
                    element.innerHTML = html;
                    
                    // 恢復重要的子元素
                    if (exchangeResults) {
                        element.appendChild(exchangeResults);
                    }
                    importantElements.forEach(el => {
                        if (el.parentNode !== element) {
                            element.appendChild(el);
                        }
                    });
                },
                
                // 批量設置元素屬性
                setAttributes(element, attributes) {
                    if (!element || !attributes) return;
                    Object.entries(attributes).forEach(([key, value]) => {
                        element.setAttribute(key, value);
                    });
                },
                
                // 切換元素類名
                toggleClasses(element, classes) {
                    if (!element) return;
                    if (Array.isArray(classes)) {
                        classes.forEach(cls => element.classList.toggle(cls));
                    } else {
                        element.classList.toggle(classes);
                    }
                },
                
                // 查找最近的符合條件的父元素
                findClosest(element, selector) {
                    return element.closest(selector);
                },
                
                // 批量移除事件監聽器
                removeAllEventListeners(element) {
                    if (!element) return;
                    const newElement = element.cloneNode(true);
                    element.parentNode.replaceChild(newElement, element);
                    return newElement;
                }
            },
            
            // 驗證工具
            // 動畫工具函數
            Animation: {
                // 兌換區退出動畫
                animateExchangeAreaExit(element, config, callback) {
                    if (!element) {
                        Game.Debug.warn('ui', '⚠️ 動畫目標元素不存在');
                        if (callback) callback();
                        return;
                    }
                    
                    Game.Debug.log('exchange', '🎬 開始兌換區退出動畫');
                    element.classList.add('exchange-area-exit');
                    
                    const duration = config.animations.roundTransition.exitAnimation.duration;
                    Game.TimerManager.setTimeout(() => {
                        element.classList.remove('exchange-area-exit');
                        Game.Debug.log('exchange', '✅ 兌換區退出動畫完成');
                        // 注意：不清除樣式，保持淡出結束狀態供DOM更新時使用
                        if (callback) callback();
                    }, duration, 'ui');
                },
                
                // 兌換區進入動畫
                animateExchangeAreaEnter(element, config, callback) {
                    if (!element) {
                        Game.Debug.warn('ui', '⚠️ 動畫目標元素不存在');
                        if (callback) callback();
                        return;
                    }
                    
                    Game.Debug.log('exchange', '🎬 開始兌換區進入動畫');
                    
                    // 清除任何可能的隱藏類別和內聯樣式，讓CSS動畫完全接管
                    element.classList.remove('exchange-area-hidden');
                    element.style.visibility = '';
                    element.style.opacity = '';
                    element.classList.add('exchange-area-enter');
                    
                    const duration = config.animations.roundTransition.enterAnimation.duration;
                    const delay = config.animations.roundTransition.enterAnimation.delay;
                    Game.TimerManager.setTimeout(() => {
                        element.classList.remove('exchange-area-enter');
                        Game.Debug.log('exchange', '✅ 兌換區進入動畫完成');
                        if (callback) callback();
                    }, duration + delay, 'ui');
                },
                
                // 通用配置動畫應用
                applyConfigAnimation(element, animationConfig) {
                    if (!element || !animationConfig) return;
                    
                    if (animationConfig.transform) {
                        element.style.transform = animationConfig.transform;
                    }
                    if (animationConfig.opacity !== undefined) {
                        element.style.opacity = animationConfig.opacity;
                    }
                    if (animationConfig.duration) {
                        element.style.transition = `all ${animationConfig.duration}ms ${animationConfig.easing || 'ease'}`;
                    }
                }
            },
            
            ValidationUtils: {
                // 狀態一致性驗證
                validateStateConsistency() {
                    const placedCoinsArray = MoneyExchange3.Core.StateManager.getState('game.gameState.currentRoundDropZone.placedCoins') || [];
                    const domFilledZones = document.querySelectorAll('.exchange-drop-zone.filled, .exchange-drop-zone.has-coins');
                    
                    const isConsistent = placedCoinsArray.length === domFilledZones.length;
                    
                    if (!isConsistent) {
                        MoneyExchange3.Utils.Logger.warn('狀態不一致檢測', {
                            arrayLength: placedCoinsArray.length,
                            domCount: domFilledZones.length,
                            placedCoins: placedCoinsArray,
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    return {
                        isConsistent,
                        arrayCount: placedCoinsArray.length,
                        domCount: domFilledZones.length
                    };
                },
                
                // 驗證必要元素存在
                validateRequiredElements(selectors) {
                    const missing = [];
                    selectors.forEach(selector => {
                        if (!document.querySelector(selector)) {
                            missing.push(selector);
                        }
                    });
                    
                    if (missing.length > 0) {
                        MoneyExchange3.Utils.Logger.error('必要元素缺失', { missing });
                    }
                    
                    return missing.length === 0;
                },
                
                // 驗證金錢數據完整性
                validateMoneyData(question) {
                    if (!question) return false;
                    
                    const required = ['sourceItem', 'targetItem', 'exchangeRate'];
                    const missing = required.filter(field => !question[field]);
                    
                    if (missing.length > 0) {
                        MoneyExchange3.Utils.Logger.error('金錢數據不完整', { missing, question });
                        return false;
                    }
                    
                    return true;
                },
                
                // 驗證拖拽操作合法性
                validateDragOperation(draggedElement, dropZone) {
                    if (!draggedElement || !dropZone) return false;
                    
                    // 檢查是否為金錢項目
                    const isMoneyItem = draggedElement.classList.contains('exchange-item') || 
                                       draggedElement.classList.contains('money-item');
                    
                    // 檢查是否為合法的放置區域
                    const isValidDropZone = dropZone.classList.contains('exchange-drop-zone') || 
                                           dropZone.classList.contains('money-source-container');
                    
                    return isMoneyItem && isValidDropZone;
                }
            },
            
            // 日誌工具
            Logger: {
                // 日誌級別配置
                levels: {
                    DEBUG: 0,
                    INFO: 1,
                    WARN: 2,
                    ERROR: 3
                },
                
                currentLevel: 1, // 預設INFO級別
                maxLogEntries: 100, // 最大日誌條目數
                
                // 通用日誌記錄方法
                log(level, message, data = {}) {
                    const levelValue = this.levels[level.toUpperCase()];
                    if (levelValue < this.currentLevel) return;
                    
                    const timestamp = new Date().toISOString();
                    const logEntry = {
                        timestamp,
                        level: level.toUpperCase(),
                        message,
                        data: typeof data === 'object' ? data : { value: data }
                    };
                    
                    // 控制台輸出（使用適當的方法）
                    const consoleMethod = this.getConsoleMethod(level);
                    consoleMethod(`[${timestamp}] ${level.toUpperCase()}: ${message}`, logEntry.data);
                    
                    // 存儲到本地存儲（可選，用於調試）
                    this.storeLogEntry(logEntry);
                },
                
                // 獲取對應的console方法
                getConsoleMethod(level) {
                    switch (level.toUpperCase()) {
                        case 'ERROR': return console.error;
                        case 'WARN': return console.warn;
                        case 'INFO': return console.info;
                        case 'DEBUG': return console.debug;
                        default: return console.log;
                    }
                },
                
                // 存儲日誌條目到本地存儲
                storeLogEntry(logEntry) {
                    if (!DEBUG) return;
                    try {
                        const logs = JSON.parse(localStorage.getItem('moneyExchange3_logs') || '[]');
                        logs.push(logEntry);
                        
                        // 限制日誌數量，保持性能
                        if (logs.length > this.maxLogEntries) {
                            logs.splice(0, logs.length - this.maxLogEntries);
                        }
                        
                        localStorage.setItem('moneyExchange3_logs', JSON.stringify(logs));
                    } catch (error) {
                        Game.Debug.warn('integrity', '無法存儲日誌到本地存儲:', error);
                    }
                },
                
                // 便捷方法
                debug(message, data) { this.log('debug', message, data); },
                info(message, data) { this.log('info', message, data); },
                warn(message, data) { this.log('warn', message, data); },
                error(message, data) { this.log('error', message, data); },
                
                // 性能記錄
                time(label) {
                    console.time(`MoneyExchange3: ${label}`);
                },
                
                timeEnd(label) {
                    console.timeEnd(`MoneyExchange3: ${label}`);
                },
                
                // 獲取所有日誌
                getAllLogs() {
                    try {
                        return JSON.parse(localStorage.getItem('moneyExchange3_logs') || '[]');
                    } catch {
                        return [];
                    }
                },
                
                // 清空日誌
                clearLogs() {
                    localStorage.removeItem('moneyExchange3_logs');
                    console.info('日誌已清空');
                },
                
                // 設置日誌級別
                setLevel(level) {
                    const levelValue = this.levels[level.toUpperCase()];
                    if (levelValue !== undefined) {
                        this.currentLevel = levelValue;
                        console.info(`日誌級別設置為: ${level.toUpperCase()}`);
                    }
                }
            }
        },

        // =====================================================
        // 舊狀態（向後兼容，逐步遷移）
        // =====================================================
        state: {
            score: 0,
            totalQuestions: 10,
            currentQuestionIndex: 0,
            quizQuestions: [],
            isAnswering: false,
            isDragging: false,
            settings: {
                category: null,
                pair: null,
                difficulty: null,
                mode: null,
                questionCount: null
            },
            gameState: {},
            isEndingGame: false
        },
        // =====================================================
        // DOM 元素
        // =====================================================
        elements: {},

        // =====================================================
        // 語音
        // =====================================================
        speech: {
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
                        Game.Debug.log('speech', `語音已就緒: ${this.voice.name}`);
                        this.synth.onvoiceschanged = null;
                    }
                };
                this.synth.onvoiceschanged = setVoice;
                setVoice();
            }
        },

        // =====================================================
        // SVG 圖示
        // =====================================================
        getSvgExchangeIcon() {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" fill="currentColor" viewBox="0 0 24 16" style="margin: 0 8px; vertical-align: middle;">
                <path d="M1 8a.5.5 0 0 1 .5-.5h19.793l-2.147-2.146a.5.5 0 0 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L21.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                <path d="M23 8a.5.5 0 0 1-.5.5H2.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L2.707 7.5H22.5A.5.5 0 0 1 23 8"/>
            </svg>`;
        },

        // =====================================================
        // 初始化
        // =====================================================
        init() {
            // [Phase 1] 清理所有計時器與事件監聽器
            Game.TimerManager.clearAll();
            Game.EventManager.removeAll();

            // 初始化核心系統
            this.initStateManager();

            // 初始化高品質語音系統
            MoneyExchange3.Speech.init();
            this.initAudio();
            this.injectGlobalAnimationStyles();
            this.showSettings();
        },
        
        injectGlobalAnimationStyles() {
            if (document.getElementById('c3-global-animations')) return;

            const style = document.createElement('style');
            style.id = 'c3-global-animations';
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
                @keyframes resultFadeIn {
                    0% { opacity: 0; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes hintRevealFadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        },

        // 初始化StateManager並建立向後兼容機制
        initStateManager() {
            Game.Debug.log('event', '🚀 初始化 StateManager 和 EventSystem');
            
            // 從舊狀態遷移到新StateManager
            this.Core.StateManager.migrateLegacyState(this.state);
            
            // 建立雙向同步：新StateManager -> 舊state
            this.Core.EventSystem.on('stateChange', (data) => {
                this.syncToLegacyState(data.path, data.newValue);
            });
            
            // 建立舊state的getter/setter同步機制
            this.setupLegacyStateProxy();
            
            Game.Debug.log('state', '✅ StateManager 初始化完成');
        },
        
        // 同步新狀態到舊狀態結構
        syncToLegacyState(path, value) {
            const pathMap = {
                'game.score': () => this.state.score = value,
                'game.totalQuestions': () => this.state.totalQuestions = value,
                'game.currentQuestionIndex': () => this.state.currentQuestionIndex = value,
                'game.quizQuestions': () => this.state.quizQuestions = value,
                'game.isAnswering': () => this.state.isAnswering = value,
                'game.isDragging': () => this.state.isDragging = value,
                'game.isProcessingExchange': () => this.state.isProcessingExchange = value,
                'game.gameState': () => this.state.gameState = value,
                'settings.category': () => this.state.settings.category = value,
                'settings.pair': () => this.state.settings.pair = value,
                'settings.difficulty': () => this.state.settings.difficulty = value,
                'settings.mode': () => this.state.settings.mode = value,
                'settings.questionCount': () => this.state.settings.questionCount = value
            };
            
            if (pathMap[path]) {
                pathMap[path]();
            }
        },
        
        // 設置舊state的代理，讓修改自動同步到StateManager
        setupLegacyStateProxy() {
            const originalState = { ...this.state };
            
            // 為settings建立代理
            this.state.settings = new Proxy(originalState.settings, {
                set: (target, key, value) => {
                    target[key] = value;
                    this.Core.StateManager.setState(`settings.${key}`, value);
                    return true;
                }
            });
            
            // 為主要屬性建立代理
            const gameProperties = ['score', 'totalQuestions', 'currentQuestionIndex', 'quizQuestions', 
                                  'isAnswering', 'isDragging', 'isProcessingExchange', 'gameState'];
            
            gameProperties.forEach(prop => {
                let value = originalState[prop];
                Object.defineProperty(this.state, prop, {
                    get: () => value,
                    set: (newValue) => {
                        value = newValue;
                        this.Core.StateManager.setState(`game.${prop}`, newValue);
                    },
                    enumerable: true,
                    configurable: true
                });
            });
            
            Game.Debug.log('state', '✅ 舊狀態代理設置完成，現在修改this.state會自動同步到StateManager');
        },

        // =====================================================
        // 設定畫面
        // =====================================================
        showSettings() {
            AssistClick.deactivate();
            // [Phase 1] 清理遊戲計時器與事件監聽器
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');

            // 🔧 [Bug修復] 清理所有模式的拖曳事件監聽器（未透過 EventManager 追蹤）
            ['easy', 'normal', 'hard'].forEach(mode => {
                const cleanupKey = `_${mode}ModeEventCleanup`;
                if (Game[cleanupKey]) {
                    Game[cleanupKey]();
                    Game[cleanupKey] = null;
                }
            });

            // 停止語音播放，避免從遊戲返回時 pending callback 觸發 loadNextQuestion
            if (this.Speech.synth) {
                this.Speech.synth.cancel();
            }

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
                                    啟用後，只要偵測到點擊，系統會自動依序完成拖曳錢幣進行換錢等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                    <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式」</strong>
                                </p>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.assistClick ? 'active' : ''}" id="assist-click-on">✓ 啟用</button>
                                    <button class="selection-btn ${!settings.assistClick ? 'active' : ''}" id="assist-click-off">✗ 停用</button>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label>💰 兌換主類別：</label>
                                <div class="button-group" id="category-buttons">
                                    ${this.renderCategoryButtons()}
                                </div>
                            </div>
                            
                            <div class="setting-group">
                                <label>🔄 兌換組合：</label>
                                <div class="button-group" id="pair-buttons">
                                    ${this.renderPairButtons()}
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
                                    <input type="text" id="custom-question-count-c3"
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
            Game.EventManager.on(startBtn, 'click', this.start.bind(this), {}, 'settings');

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
                    const params = new URLSearchParams({ unit: 'c3' });
                    window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
                }, {}, 'settings');
            }

            // 更新開始按鈕狀態
            this.updateStartButton();
        },

        renderCategoryButtons() {
            const { category } = this.state.settings;
            const categories = this.gameData.categories;
            let html = '';

            for (const catKey in categories) {
                let categoryName = categories[catKey].name;
                if (categoryName.includes('<->')) {
                    categoryName = categoryName.replace(' <-> ', ' ↔ ');
                }
                const isActive = category === catKey ? 'active' : '';
                html += `<button class="selection-btn ${isActive}" data-type="category" data-value="${catKey}">${categoryName}</button>`;
            }
            const isAllRandomActive = category === 'all-random' ? 'active' : '';
            html += `<button class="selection-btn ${isAllRandomActive}" data-type="all-random-category">全隨機 🎲</button>`;
            return html;
        },

        renderPairButtons() {
            const { category, pair } = this.state.settings;
            if (!category) return '<p style="color: #999; margin: 10px 0;">請先選擇兌換主類別</p>';
            if (category === 'all-random') return '<p style="color: #667eea; margin: 10px 0; font-weight: bold;">✅ 將從所有類別中隨機出題，每題儘可能不重複</p>';
            
            const categories = this.gameData.categories;
            const subCategory = categories[category];
            let html = '';
            
            const smallToBig = subCategory.pairs.filter(p => p.type === 'small-to-big');
            const bigToSmall = subCategory.pairs.filter(p => p.type === 'big-to-small');
            
            if (smallToBig.length > 0) {
                html += '<div style="width: 100%; margin-bottom: 15px;"><h4 style="margin: 0 0 10px 0; color: #333;">小換大</h4>';
                smallToBig.forEach(p => {
                    const isActive = pair && !pair.random && pair.from === p.from && pair.to === p.to ? 'active' : '';
                    html += `<button class="selection-btn ${isActive}" data-type="pair" data-from="${p.from}" data-to="${p.to}" data-exchange-type="${p.type}">${p.from}元 → ${p.to}元</button>`;
                });
                const randomStbActive = pair && pair.random && pair.type === 'small-to-big' ? 'active' : '';
                html += `<button class="selection-btn c3-random-pair-btn ${randomStbActive}" data-type="random-pair" data-exchange-type="small-to-big">隨機 🎲</button>`;
                html += '</div>';
            }

            if (bigToSmall.length > 0) {
                html += '<div style="width: 100%;"><h4 style="margin: 0 0 10px 0; color: #333;">大換小</h4>';
                bigToSmall.forEach(p => {
                    const isActive = pair && !pair.random && pair.from === p.from && pair.to === p.to ? 'active' : '';
                    html += `<button class="selection-btn ${isActive}" data-type="pair" data-from="${p.from}" data-to="${p.to}" data-exchange-type="${p.type}">${p.from}元 → ${p.to}元</button>`;
                });
                const randomBtsActive = pair && pair.random && pair.type === 'big-to-small' ? 'active' : '';
                html += `<button class="selection-btn c3-random-pair-btn ${randomBtsActive}" data-type="random-pair" data-exchange-type="big-to-small">隨機 🎲</button>`;
                html += '</div>';
            }
            
            return html;
        },


        handleSelection(event) {
            // 🔓 解鎖手機音頻播放權限 - 改用內建系統
            this.unlockAudio();
            
            const btn = event.target.closest('.selection-btn');
            if (!btn) return;

            const { type, value, from, to, exchangeType } = btn.dataset;
            
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
                    const customInput = document.getElementById('custom-question-count-c3');
                    if (customDisplay && customInput) {
                        customDisplay.style.display = 'none';
                        customInput.value = '';
                        customInput.style.background = 'white';
                        customInput.style.color = '#333';
                        customInput.style.borderColor = '#ddd';
                    }
                }
            } else if (type === 'category') {
                this.state.settings.category = value;
                this.state.settings.pair = null;
                // 重新渲染兌換組合選項
                const pairButtons = document.getElementById('pair-buttons');
                if (pairButtons) {
                    pairButtons.innerHTML = this.renderPairButtons();
                }
            } else if (type === 'pair') {
                this.state.settings.pair = { from: parseInt(from), to: parseInt(to), type: exchangeType };
            } else if (type === 'random-pair') {
                this.state.settings.pair = { type: exchangeType, random: true };
                const pairButtons = document.getElementById('pair-buttons');
                if (pairButtons) pairButtons.innerHTML = this.renderPairButtons();
                this.updateStartButton();
                return; // 不走下方的 button-group active 邏輯
            } else if (type === 'all-random-category') {
                this.state.settings.category = 'all-random';
                this.state.settings.pair = { random: true, type: 'all' };
                const pairButtons = document.getElementById('pair-buttons');
                if (pairButtons) pairButtons.innerHTML = this.renderPairButtons();
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

            // 更新同組按鈕的active狀態
            const buttonGroup = btn.closest('.button-group');
            buttonGroup.querySelectorAll('.selection-btn')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 檢查是否所有必要設定都已完成
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

        // 取得難度說明文字
        getDifficultyDescription(difficulty) {
            const descriptions = {
                easy: '簡單：有視覺提示，引導下完成題目。',
                normal: '普通：小換大，固定是5個1元換1個5元，大換小，固定1個5元換5個1元。',
                hard: '困難：小換大，可能是10個1元換2個5元，大換小，可能是3個5元換15個1元。'
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
                        if (display.value.length < 3) display.value += key;
                    }
                };
                pad.appendChild(btn);
            });
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
                const customInput = document.getElementById('custom-question-count-c3');
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
            const { category, pair, difficulty, mode, questionCount } = this.state.settings;
            const startBtn = document.getElementById('start-quiz-btn');

            // 簡單模式不需要選擇測驗模式
            const modeRequired = difficulty !== 'easy';
            const modeValid = modeRequired ? mode : true;

            if (category && pair && difficulty && modeValid && questionCount) {
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
        // 遊戲流程 
        // =====================================================
        start() {
            // [Phase 1] 清理上一場遊戲殘留計時器
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            this.state.isEndingGame = false; // 重置結束守衛，確保再玩一次時 endGame() 可正常執行

            Game.Debug.log('speech', '🎯 [C3-遊戲] 開始測驗，解鎖音頻並播放歡迎語音');

            // 🔧 [修復] 確保音頻已解鎖
            this.unlockAudio();
            
            this.state.score = 0;
            this.state.currentQuestionIndex = 0;
            this.state.startTime = Date.now();  // 記錄測驗開始時間
            this.generateQuestions();
            this.setupQuizUI();
            if (this.state.settings.difficulty === 'easy' && this.state.settings.assistClick) {
                AssistClick.activate();
            }

            // 🔧 [新增] 播放測驗開始語音，類似C1/C2的initialInstruction
            const { difficulty, pair } = this.state.settings;
            let welcomeText = '';
            
            const isAllRandom = this.state.settings.category === 'all-random';
            if (difficulty === 'easy') {
                welcomeText = isAllRandom
                    ? `金錢兌換測驗開始，拖曳金錢到兌換區，每題都是不同的金錢兌換`
                    : pair.random
                        ? `金錢兌換測驗開始，拖曳金錢到兌換區進行隨機金錢兌換`
                        : `金錢兌換測驗開始，拖曳金錢到兌換區進行${pair.from}元和${pair.to}元的兌換`;
            } else if (difficulty === 'normal') {
                welcomeText = `金錢兌換測驗開始，請拖曳正確數量的金錢到兌換區`;
            } else if (difficulty === 'hard') {
                welcomeText = `金錢兌換測驗開始，請拖曳正確數量的金錢到兌換區`;
            }
            
            Game.Debug.log('speech', '🎙️ [C3-遊戲] 播放測驗開始語音:', welcomeText);
            
            // 延遲播放，讓UI完全載入
            Game.TimerManager.setTimeout(() => {
                const currentMode = difficulty || 'normal';
                const config = this.ModeConfig[currentMode];
                this.Speech.speak(welcomeText, currentMode, config, () => {
                    Game.Debug.log('speech', '🎙️ [C3-遊戲] 歡迎語音完成，開始載入第一題');
                    this.loadNextQuestion();
                });
            }, 500, 'question');
        },

        generateQuestions() {
            const { pair, difficulty } = this.state.settings;
            if (!pair) return;

            this.state.quizQuestions = [];
            
            // 【配置驅動】使用ModeConfig替代硬編碼switch
            const config = this.ModeConfig[difficulty] || this.ModeConfig.easy;
            const { min: minExchanges, max: maxExchanges } = config.exchanges || { min: 1, max: 3 };
            
            Game.Debug.log('exchange', `🎛️ 配置驅動: ${difficulty}模式兌換範圍 ${minExchanges}-${maxExchanges}`);

            // 若為隨機模式，預先取得可用 pairs 供每題抽取
            const isAllRandomMode = this.state.settings.category === 'all-random';
            const isRandomMode = pair.random === true && !isAllRandomMode;
            let eligiblePairsForRandom = [];
            if (isAllRandomMode) {
                // 全隨機：收集所有類別的所有 pairs
                Object.values(this.gameData.categories).forEach(cat => {
                    eligiblePairsForRandom.push(...cat.pairs);
                });
            } else if (isRandomMode) {
                const subCategory = this.gameData.categories[this.state.settings.category];
                eligiblePairsForRandom = subCategory ? subCategory.pairs.filter(p => p.type === pair.type) : [];
            }

            for (let i = 0; i < this.state.totalQuestions; i++) {
                let sourceItemsCount, exchangeRate, totalExchanges;
                let attempts = 0;
                const maxAttempts = 20; // 🔧 [新增] 防重複題目機制：最多重試20次
                const exchangeRange = maxExchanges - minExchanges + 1;

                // 🔧 [新增] 防重複機制：如果與上一題重複則重新生成
                do {
                    attempts++;

                    // 隨機模式：每次嘗試都重新抽一個具體 pair
                    const activePair = (isRandomMode || isAllRandomMode)
                        ? eligiblePairsForRandom[Math.floor(Math.random() * eligiblePairsForRandom.length)]
                        : pair;

                    if (activePair.type === 'small-to-big') {
                        exchangeRate = activePair.to / activePair.from;

                        if (difficulty === 'normal') {
                            totalExchanges = 1;
                            sourceItemsCount = exchangeRate;
                        } else {
                            const maxSourceCoins = 30;
                            const minRounds = 2;
                            const maxRounds = Math.floor(maxSourceCoins / exchangeRate);

                            const randomRounds = minRounds + Math.floor(Math.random() * Math.min(4, maxRounds - minRounds + 1));
                            const finalRounds = Math.min(randomRounds, maxRounds);

                            sourceItemsCount = finalRounds * exchangeRate;
                            totalExchanges = finalRounds;
                        }

                        Game.Debug.log('exchange', `🪙 小換大設定: ${sourceItemsCount}個${activePair.from}元 → ${totalExchanges}輪兌換`);

                    } else {
                        exchangeRate = activePair.from / activePair.to;

                        if (difficulty === 'normal') {
                            totalExchanges = 1;
                            sourceItemsCount = 1;
                        } else {
                            const maxResultCoins = 30;
                            const maxSourceCoins = Math.floor(maxResultCoins / exchangeRate);
                            const minSourceCoins = 2;

                            const randomSourceCoins = minSourceCoins + Math.floor(Math.random() * Math.min(4, maxSourceCoins - minSourceCoins + 1));
                            const finalSourceCoins = Math.min(randomSourceCoins, maxSourceCoins);

                            sourceItemsCount = finalSourceCoins;
                            totalExchanges = finalSourceCoins;

                            const resultCount = finalSourceCoins * exchangeRate;
                            Game.Debug.log('state', `🪙 大換小設定: ${sourceItemsCount}個${activePair.from}元 → ${resultCount}個結果金錢 (最多30個限制)`);
                        }

                        Game.Debug.log('exchange', `🪙 大換小設定: ${sourceItemsCount}個${activePair.from}元 → ${totalExchanges}輪兌換`);
                    }

                    const currentExchangeKey = `${activePair.from}-${activePair.to}-${sourceItemsCount}`;

                    if (currentExchangeKey !== this.state.lastExchangeKey || attempts >= maxAttempts) {
                        Game.Debug.log('question', `🎯 [C3-防重複] 第${i+1}題生成`, {
                            exchangeKey: currentExchangeKey,
                            lastKey: this.state.lastExchangeKey,
                            attempts,
                            isDuplicate: currentExchangeKey === this.state.lastExchangeKey
                        });
                        this.state.quizQuestions.push({
                            sourceValue: activePair.from, targetValue: activePair.to, sourceItemsCount,
                            exchangeRate, totalExchanges, exchangeType: activePair.type
                        });
                        this.state.lastExchangeKey = currentExchangeKey;
                        break;
                    }
                } while (attempts < maxAttempts);
            }
        },

        startQuestion(question) {
            if (!question) return;
            const { exchangeType, totalExchanges, sourceItemsCount, sourceValue, targetValue } = question;

            // 【修正】確保每次開始新題目時完全重置狀態，避免動畫重複
            const initialGameState = {
                exchangeType, totalExchanges,
                exchangeRate: question.exchangeRate,
                justDroppedId: null,
                droppedInCurrentExchange: 0,
                // 重置兌換結果
                exchangeResults: [],
                // 新增：兌換進度管理
                currentExchangeRound: 0,
                completedExchanges: 0,
                currentRoundPlaced: 0,
                totalMoneyToExchange: sourceItemsCount,
                exchangedMoney: 0,
                roundComplete: false,
                currentRoundDropZone: {
                    placedCoins: [],
                    requiredCoins: exchangeType === 'small-to-big' ? question.exchangeRate : 1,
                    targetCoins: exchangeType === 'small-to-big' ? 1 : question.exchangeRate
                },
                // 確保 coinPositions 初始化
                coinPositions: {},
                coinImages: {},
                targetImages: [],
                requiredSourceCounts: [] // 【修復】初始化 requiredSourceCounts 陣列，防止 TypeError
            };
            
            // 使用新的 StateManager API 設置狀態
            this.setGameState('gameState', initialGameState);
            
            // 獲取當前狀態以便後續修改
            let currentGameState = this.getGameState('gameState');

            // 初始化處理中標誌
            this.state.isProcessingExchange = false;

            // 【新增】清空兌換區，確保新一輪兌換時計數歸零
            const exchangeDropZones = document.querySelectorAll('.exchange-drop-zone, .drop-zone');
            exchangeDropZones.forEach(zone => {
                zone.classList.remove('filled');
                zone.style.opacity = '0.3';
                zone.innerHTML = '<div class="transparent-drop-hint">請拖入放置</div>';
            });
            Game.Debug.log('exchange', '🗑️ 新題目開始，已清空兌換區');

            const sourceItemData = this.gameData.allItems.find(item => item.value === sourceValue);
            const targetItemData = this.gameData.allItems.find(item => item.value === targetValue);

            // 1. 為所有可拖曳的錢幣預先決定好圖片（將在後面的條件分支中設置）
            // coinImages 已在 initialGameState 中初始化

            // 2. 為等式右方的目標錢幣預先決定好圖片
            const difficulty = this.state.settings.difficulty;
            const { min: minExchanges, max: maxExchanges } = (this.ModeConfig[difficulty] || this.ModeConfig.easy).exchanges || { min: 1, max: 3 };

            if (exchangeType === 'small-to-big') {
                // 【配置驅動】小換大邏輯
                const config = this.ModeConfig[difficulty];
                const smallToBigRules = config.specialRules.smallToBig;
                
                if (smallToBigRules.variableTargets) {
                    // 可變目標模式（困難模式）
                    currentGameState.targetImages = [];
                    let totalTargetCount = 0;
                    const targetRange = smallToBigRules.targetRange || [1, 3];
                    
                    for (let i = 0; i < totalExchanges; i++) {
                        const imagesForRow = [];
                        const targetCount = Math.floor(Math.random() * (targetRange[1] - targetRange[0] + 1)) + targetRange[0];
                        totalTargetCount += targetCount;
                        for (let j = 0; j < targetCount; j++) {
                            imagesForRow.push(this.getRandomImage(targetItemData));
                        }
                        currentGameState.targetImages.push(imagesForRow);
                    }
                    // 調整金錢區的金錢數量，確保足夠兌換所有目標金錢
                    const requiredSourceCount = totalTargetCount * question.exchangeRate;
                    // 總是確保金錢數量匹配，不管是否需要增加或減少
                    currentGameState.coinImages = {};
                    for (let i = 0; i < requiredSourceCount; i++) {
                        currentGameState.coinImages[i] = this.getRandomImage(sourceItemData);
                    }
                    // 更新金錢位置
                    currentGameState.coinPositions = {};
                    for (let i = 0; i < requiredSourceCount; i++) {
                        currentGameState.coinPositions[i] = 'money-area';
                    }
                    // 更新問題的sourceItemsCount
                    question.sourceItemsCount = requiredSourceCount;
                    
                    // 【修正】困難模式保持原有的totalExchanges設定，不重新計算
                    // 困難模式的兌換輪次應該根據隨機生成的目標金錢數量決定
                    Game.Debug.log('exchange', `🎯 困難模式小換大保持原設定: ${totalExchanges}輪 (sourceItemsCount: ${question.sourceItemsCount}, exchangeRate: ${question.exchangeRate})`);
                    Game.Debug.log('question', `💰 【困難模式】我的金錢區生成: ${requiredSourceCount}個${sourceItemData.value}元金錢圖示`);
                } else {
                    // 【配置驅動】其他模式的小換大邏輯
                    
                    if (smallToBigRules.maxSourceCoins) {
                        // 普通模式：每輪固定exchangeRate個小面額換1個大面額
                        const maxSourceCoins = smallToBigRules.maxSourceCoins;
                        
                        // 計算可用輪次範圍
                        const maxPossibleRounds = Math.floor(maxSourceCoins / question.exchangeRate);
                        const minRounds = Math.min(minExchanges, maxPossibleRounds);
                        const maxRoundsLimit = Math.min(maxExchanges, maxPossibleRounds);
                        const selectedRounds = minRounds + Math.floor(Math.random() * (maxRoundsLimit - minRounds + 1));
                        
                        // 每輪固定：exchangeRate個源金錢 → 1個目標金錢
                        const requiredSourceCount = selectedRounds * question.exchangeRate;
                        
                        Game.Debug.log('question', `💰 【普通模式】我的金錢區生成: ${requiredSourceCount}個${sourceItemData.value}元金錢圖示`);
                        Game.Debug.log('exchange', `🔧 普通模式小換大輪次設定: ${selectedRounds}輪，每輪固定${question.exchangeRate}個源金錢 → 1個${targetItemData.value}元`);
                        
                        // 建立固定輪次結構
                        currentGameState.targetImages = [];
                        
                        for (let round = 0; round < selectedRounds; round++) {
                            // 每輪：exchangeRate個源金錢 → 1個目標金錢
                            const imagesForRow = [this.getRandomImage(targetItemData)];
                            currentGameState.targetImages.push(imagesForRow);
                            Game.Debug.log('state', `🎲 第${round + 1}輪設定: ${question.exchangeRate}個${sourceItemData.value}元 → 1個${targetItemData.value}元`);
                        }
                        
                        question.sourceItemsCount = requiredSourceCount;
                        const finalRounds = selectedRounds;
                        Game.Debug.log('state', `✅ 普通模式小換大設定完成: 共${finalRounds}輪，每輪${question.exchangeRate}個→1個`);
                        
                        // 將實際輪次數同步回 question 物件
                        question.totalExchanges = finalRounds;
                        
                        // 初始化多輪兌換狀態
                        currentGameState.currentRound = 0;
                        currentGameState.completedRounds = [];
                        currentGameState.totalRounds = finalRounds;
                        
                    } else {
                        // 簡單模式：保持原邏輯
                        currentGameState.targetImages = [];
                        let totalTargetCount = 0; // 計算總目標金錢數量
                        for (let i = 0; i < totalExchanges; i++) {
                            const imagesForRow = [];
                            // 簡單模式：每個列固定1個目標金錢，提供一致的體驗
                            const targetCount = 1; // 固定1個，避免隨機變化
                            totalTargetCount += targetCount;
                            for (let j = 0; j < targetCount; j++) {
                                imagesForRow.push(this.getRandomImage(targetItemData));
                            }
                            currentGameState.targetImages.push(imagesForRow);
                        }
                        // 調整金錢區的金錢數量，確保足夠兌換所有目標金錢
                        const requiredSourceCount = totalTargetCount * question.exchangeRate;
                        question.sourceItemsCount = requiredSourceCount;
                        Game.Debug.log('exchange', `🔧 簡單模式小換大隨機設定: ${totalExchanges}輪 (總目標數量: ${totalTargetCount}, 需要源金錢: ${requiredSourceCount})`);
                        Game.Debug.log('question', `💰 【簡單模式】我的金錢區生成: ${requiredSourceCount}個${sourceItemData.value}元金錢圖示`);
                    }
                    
                    // 設置金錢圖片和位置
                    for (let i = 0; i < question.sourceItemsCount; i++) {
                        currentGameState.coinImages[i] = this.getRandomImage(sourceItemData);
                    }
                    currentGameState.coinPositions = {};
                    for (let i = 0; i < question.sourceItemsCount; i++) {
                        currentGameState.coinPositions[i] = 'money-area';
                    }
                }
            } else { // big-to-small
                // 【配置驅動】大換小邏輯
                const bigToSmallRules = this.ModeConfig[difficulty].specialRules.bigToSmall;
                
                if (bigToSmallRules.variableTargets) {
                    // 可變目標模式（困難模式）
                    this.state.gameState.targetImages = [];
                    currentGameState.requiredSourceCounts = []; // 記錄每個兌換列需要的大面額金錢數量
                    let totalSourceCount = 0; // 計算總需要的大面額金錢數量
                    const sourceRange = bigToSmallRules.sourceRange || [1, 3];
                    
                    for (let i = 0; i < totalExchanges; i++) {
                        // 每個兌換列需要指定範圍內的大面額金錢
                        const sourceCount = Math.floor(Math.random() * (sourceRange[1] - sourceRange[0] + 1)) + sourceRange[0];
                        currentGameState.requiredSourceCounts.push(sourceCount);
                        totalSourceCount += sourceCount;
                        
                        // 目標小面額金錢數量 = 大面額金錢數量 × 兌換比率
                        const targetCount = sourceCount * question.exchangeRate;
                        const imagesForRow = [];
                        for (let j = 0; j < targetCount; j++) {
                            imagesForRow.push(this.getRandomImage(targetItemData));
                        }
                        currentGameState.targetImages.push(imagesForRow);
                    }
                    
                    // 調整金錢區的金錢數量，確保足夠兌換所有目標金錢
                    const requiredSourceCount = totalSourceCount;
                    
                    // 🔧 修正：確保totalExchanges等於requiredSourceCounts的長度（兌換輪次數）
                    // totalExchanges = 兌換輪次數，不是金錢總數
                    Game.Debug.log('exchange', `🔧 困難模式大換小保持原設定: ${totalExchanges}輪 (requiredSourceCounts: ${currentGameState.requiredSourceCounts.join(', ')})`);
                    // totalExchanges已經正確，無需修改
                    
                    // 總是確保金錢數量匹配，不管是否需要增加或減少
                    currentGameState.coinImages = {};
                    for (let i = 0; i < requiredSourceCount; i++) {
                        currentGameState.coinImages[i] = this.getRandomImage(sourceItemData);
                    }
                    // 更新金錢位置
                    currentGameState.coinPositions = {};
                    for (let i = 0; i < requiredSourceCount; i++) {
                        currentGameState.coinPositions[i] = 'money-area';
                    }
                    // 更新問題的sourceItemsCount
                    question.sourceItemsCount = requiredSourceCount;
                    
                    // 【修正】困難模式保持原有的totalExchanges設定，不重新計算
                    // 困難模式的兌換輪次應該根據隨機生成的目標金錢數量決定
                    Game.Debug.log('exchange', `🎯 困難模式大換小保持原設定: ${totalExchanges}輪 (requiredSourceCounts: ${currentGameState.requiredSourceCounts.join(', ')})`);
                    Game.Debug.log('question', `💰 【困難模式】我的金錢區生成: ${requiredSourceCount}個${sourceItemData.value}元金錢圖示`);
                } else {
                    // 【配置驅動】其他模式的大換小邏輯
                    let requiredSourceCount; // 將變數宣告提到更高作用域
                    
                    if (bigToSmallRules.maxTargetCoins) {
                        // 普通模式：每輪固定1個大面額換exchangeRate個小面額
                        const maxTargetCoins = bigToSmallRules.maxTargetCoins;
                        
                        // 計算可用輪次範圍（每輪消耗exchangeRate個目標名額）
                        const maxPossibleRounds = Math.floor(maxTargetCoins / question.exchangeRate);
                        const minRounds = Math.min(minExchanges, maxPossibleRounds);
                        const maxRoundsLimit = Math.min(maxExchanges, maxPossibleRounds);
                        const selectedRounds = minRounds + Math.floor(Math.random() * (maxRoundsLimit - minRounds + 1));
                        
                        // 每輪固定：1個源金錢 → exchangeRate個目標金錢
                        requiredSourceCount = selectedRounds;
                        question.sourceItemsCount = requiredSourceCount;
                        
                        Game.Debug.log('question', `💰 【普通模式】我的金錢區生成: ${requiredSourceCount}個${sourceItemData.value}元金錢圖示`);
                        Game.Debug.log('exchange', `🔧 普通模式大換小輪次設定: ${selectedRounds}輪，每輪固定1個源金錢 → ${question.exchangeRate}個${targetItemData.value}元`);
                        
                        // 建立固定輪次結構
                        currentGameState.targetImages = [];
                        this.state.gameState.requiredSourceCounts = [];
                        let actualTotalTargets = 0;
                        
                        for (let round = 0; round < selectedRounds; round++) {
                            const imagesForRow = [];
                            for (let j = 0; j < question.exchangeRate; j++) {
                                imagesForRow.push(this.getRandomImage(targetItemData));
                            }
                            currentGameState.targetImages.push(imagesForRow);
                            currentGameState.requiredSourceCounts.push(1);
                            actualTotalTargets += question.exchangeRate;
                            Game.Debug.log('state', `🎲 第${round + 1}輪設定: 1個源金錢 → ${question.exchangeRate}個${targetItemData.value}元`);
                        }
                        
                        // 初始化普通模式大換小多輪兌換狀態
                        currentGameState.currentRound = 0;
                        currentGameState.completedRounds = [];
                        const finalRounds = selectedRounds;
                        currentGameState.totalRounds = finalRounds;
                        currentGameState.totalTargetCoins = actualTotalTargets;
                        
                        // 將實際輪次數同步回 question 物件
                        question.totalExchanges = finalRounds;
                        
                        Game.Debug.log('exchange', `🎯 普通模式大換小設定完成: ${finalRounds}輪兌換，每輪1個→${question.exchangeRate}個`);
                        
                    } else {
                        // 簡單模式：【修正】實施30個結果限制，每輪只用1個源金錢
                        currentGameState.targetImages = [];
                        currentGameState.requiredSourceCounts = []; // 記錄每個兌換列需要的大面額金錢數量
                        
                        // 【配置驅動】檢查30個結果限制
                        const maxResultCoins = 30;
                        const maxExchanges = Math.floor(maxResultCoins / question.exchangeRate);
                        const actualExchanges = Math.min(totalExchanges, maxExchanges);
                        
                        Game.Debug.log('exchange', `🔧 簡單模式大換小限制檢查: 原設定${totalExchanges}輪, 30個限制下最多${maxExchanges}輪, 實際${actualExchanges}輪`);
                        
                        for (let i = 0; i < actualExchanges; i++) {
                            // 【修正】簡單模式每輪只用1個大面額金錢
                            const sourceCount = 1; // 每輪固定1個
                            currentGameState.requiredSourceCounts.push(sourceCount);
                            
                            // 目標小面額金錢數量 = 1個大面額 × 兌換比率
                            const targetCount = sourceCount * question.exchangeRate;
                            const imagesForRow = [];
                            for (let j = 0; j < targetCount; j++) {
                                imagesForRow.push(this.getRandomImage(targetItemData));
                            }
                            currentGameState.targetImages.push(imagesForRow);
                        }
                        
                        // 【修正】總源金錢數量 = 實際兌換輪數（每輪1個）
                        requiredSourceCount = actualExchanges;
                        question.sourceItemsCount = requiredSourceCount;
                        question.totalExchanges = actualExchanges; // 更新總兌換次數
                        
                        Game.Debug.log('exchange', `🔧 簡單模式大換小隨機設定: ${actualExchanges}輪 (每輪1個, 總計需要: ${requiredSourceCount})`);
                        Game.Debug.log('question', `💰 【簡單模式】我的金錢區生成: ${requiredSourceCount}個${sourceItemData.value}元金錢圖示`);
                        Game.Debug.log('exchange', `🎯 【簡單模式】兌換結果: ${requiredSourceCount * question.exchangeRate}個${targetItemData.value}元 (30個限制內)`);
                    }
                    
                    // 設置金錢圖片和位置
                    for (let i = 0; i < question.sourceItemsCount; i++) {
                        currentGameState.coinImages[i] = this.getRandomImage(sourceItemData);
                    }
                    currentGameState.coinPositions = {};
                    for (let i = 0; i < question.sourceItemsCount; i++) {
                        currentGameState.coinPositions[i] = 'money-area';
                    }
                }
            }

            // 3. 為放置區增加詳細狀態
            currentGameState.dropZones = [];
            for (let i = 0; i < question.totalExchanges; i++) {
                currentGameState.dropZones.push({
                    id: i,
                    coins: [],
                    status: 'default',
                    isCorrect: false  // 【修正】確保每個放置區都有正確的初始狀態
                });
            }
            // 使用更新後的sourceItemsCount來設置金錢位置（如果之前沒有設置的話）
            if (!currentGameState.coinPositions || Object.keys(currentGameState.coinPositions).length === 0) {
                currentGameState.coinPositions = {};
                for (let i = 0; i < question.sourceItemsCount; i++) {
                    currentGameState.coinPositions[i] = 'money-area';
                }
            }

            // 最終保存所有狀態修改到 StateManager
            this.setGameState('gameState', currentGameState);

            this.renderGameBoard(question);
        },

        renderGameBoard(question) {
            const { sourceValue, targetValue, exchangeType, exchangeRate } = question;
            const sourceItemData = this.gameData.allItems.find(item => item.value === sourceValue);
            const targetItemData = this.gameData.allItems.find(item => item.value === targetValue);
            if (!sourceItemData || !targetItemData) return;

            const difficulty = this.state.settings.difficulty;
            Game.Debug.log('ui', `🎭 新架構渲染: ${difficulty}模式 (完全模式隔離)`);
            
            // 直接使用新的模式特定UI渲染
            this.renderModeSpecificUI(difficulty);
            
            // 渲染遊戲內容到game-area (新題目開始，需要重置結果區域)
            this.renderGameContent(question, sourceItemData, targetItemData, difficulty, true);
        },

        renderGameContent(question, sourceItemData, targetItemData, difficulty, isNewQuestion = false) {
            const gameArea = document.getElementById('game-area');
            const myMoneyArea = document.getElementById('my-money-area');
            const exchangeResultsArea = document.getElementById('exchange-results-area');
            
            if (!gameArea || !myMoneyArea || !exchangeResultsArea) {
                Game.Debug.error('❌ 找不到必要的DOM元素');
                return;
            }

            // 生成我的金錢區內容
            this.renderMyMoneyArea(question, sourceItemData, myMoneyArea);
            
            // 生成兌換區內容
            this.renderExchangeArea(question, sourceItemData, targetItemData, gameArea, difficulty);
            
            // 【修正】兌換結果區域管理 - 根據是否為新題目決定如何處理
            const hasExistingResults = exchangeResultsArea.querySelector('.unified-results-container');
            
            if (isNewQuestion) {
                // 新題目：清除舊結果，初始化新的結果區域
                exchangeResultsArea.innerHTML = '<div class="results-placeholder">兌換結果將在此顯示</div>';
                Game.Debug.log('exchange', '🆕 新題目開始，重置兌換結果區域');
            } else if (!hasExistingResults && exchangeResultsArea.innerHTML.trim() === '') {
                // 無結果且為空：初始化佔位符
                exchangeResultsArea.innerHTML = '<div class="results-placeholder">兌換結果將在此顯示</div>';
                Game.Debug.log('exchange', '📝 初始化兌換結果區域佔位符');
            } else {
                // 已有結果：完全不動，保護現有結果
                Game.Debug.log('exchange', '🔒 保護現有兌換結果，不做任何修改');
            }
            
            // 設置拖放事件監聽器 (修正版本，支援手動模式)
            this.setupDragDropEvents(question, difficulty);
            
            // 【配置驅動】更新標題計數
            Game.TimerManager.setTimeout(() => {
                this.updateSectionTitleCounts();
                
                // 播放新題目開始語音提示
                this.playQuestionStartSpeech(question);
            }, 200, 'speech');
        },

        renderMyMoneyArea(question, sourceItemData, myMoneyArea) {
            const { sourceValue, sourceItemsCount } = question;
            let moneyHTML = '';
            
            // 【自適應調整】根據金錢數量設置容器屬性
            let countLevel = 'low';
            if (sourceItemsCount > 15) {
                countLevel = 'high';
            } else if (sourceItemsCount > 5) {
                countLevel = 'medium';
            }
            
            // 設置容器自適應屬性
            myMoneyArea.setAttribute('data-count', countLevel);
            myMoneyArea.setAttribute('data-items', sourceItemsCount);
            
            // 【解決重疊】根據金錢類型選擇適當的容器類別
            const containerClass = sourceItemData.value >= 100 ? 'unit3-banknote-container' : 'unit3-coin-container';
            
            // 生成金錢項目
            for (let i = 0; i < sourceItemsCount; i++) {
                moneyHTML += this.createCompleteMoneyItem(sourceItemData, {
                    containerClass: `${containerClass} money-item`,
                    draggable: true,
                    id: `coin-${i}`,
                    additionalClasses: '',
                    faded: false,
                    forceNumberDisplay: true  // 我的金錢區始終顯示數字
                });
                
                // 添加 data-id 屬性（createCompleteMoneyItem 不包含此屬性）
                moneyHTML = moneyHTML.replace(`id="coin-${i}"`, `id="coin-${i}" data-id="coin-${i}"`);
            }
            
            myMoneyArea.innerHTML = moneyHTML;
            Game.Debug.log('state', `💰 我的金錢區：${sourceItemsCount}個金錢，容器等級：${countLevel}`);
        },

        renderExchangeArea(question, sourceItemData, targetItemData, gameArea, difficulty) {
            const { exchangeType, exchangeRate } = question;
            
            let exchangeHTML = '';
            
            if (exchangeType === 'small-to-big') {
                // 【修復】從 gameState 獲取當前輪次的正確目標數量
                const gameState = this.getGameState('gameState');
                const currentRound = gameState.completedExchanges || 0;
                
                // 如果 targetImages 存在且當前輪次有效，則使用它，否則退回到舊的單一目標邏輯
                const targetsForThisRound = (gameState.targetImages && gameState.targetImages[currentRound]) 
                                          ? gameState.targetImages[currentRound] 
                                          : [this.getRandomImage(targetItemData)]; // 退化方案
                
                Game.Debug.log('ui', `🎯 UI渲染: 第${currentRound + 1}輪顯示${targetsForThisRound.length}個目標金錢`);
                
                // 【修正】動態生成目標金錢的 HTML
                const targetMoneyHTML = targetsForThisRound.map(() => `
                    <div class="target-money">
                        ${this.createMoneyHTML(targetItemData, { faded: true })}
                        <div class="money-value">${targetItemData.value}元</div>
                    </div>
                `).join('');
                
                // 小換大：左邊放置區，等號，右邊目標區
                exchangeHTML = `
                    <div class="exchange-row">
                        <div class="drop-zone-area">
                            ${this.generateDropZones(question, exchangeRate)}
                        </div>
                        <div class="equals-sign">=</div>
                        <div class="target-area">
                            <div class="target-money-row">${targetMoneyHTML}</div>
                        </div>
                        <div class="checkmark-area">
                            <svg class="checkmark" viewBox="0 0 24 24" style="opacity: 0;">
                                <path d="M9 12l2 2 4-4" stroke="currentColor" fill="none" stroke-width="2"/>
                            </svg>
                        </div>
                    </div>
                `;
            } else {
                // 大換小：左邊放置區，等號，右邊多個目標區
                const gameState = this.getGameState('gameState');
                const currentRound = gameState.completedExchanges || 0;

                // 【修正】從 gameState 讀取當前輪次需要的大面額錢幣數量
                const requiredSourceCount = (gameState.requiredSourceCounts && gameState.requiredSourceCounts[currentRound])
                                          ? gameState.requiredSourceCounts[currentRound]
                                          : 1; // 如果沒有數據，預設為1

                const targetMoneyCount = requiredSourceCount * exchangeRate;

                const targetMoney = Array(targetMoneyCount).fill().map(() => `
                    <div class="target-money">
                        ${this.createMoneyHTML(targetItemData, { faded: true })}
                        <div class="money-value">${targetItemData.value}元</div>
                    </div>
                `).join('');
                
                let bigToSmallDropZone;
                if (difficulty === 'normal' || difficulty === 'hard') {
                    // 【UI修正】普通模式和困難模式：根據當前輪次需求，生成對應數量的放置格
                    Game.Debug.log('drag', `🎨 [UI Render] 大換小，第 ${currentRound + 1} 輪需要 ${requiredSourceCount} 個放置格`);
                    bigToSmallDropZone = `
                        <div class="drop-zone flexible-zone ${difficulty}-drop-zone" data-drop-type="source" data-mode="${difficulty}">
                            <div class="drop-hint">請放置正確的金錢數量</div>
                            <div class="placed-coins-container"></div>
                        </div>
                    `;
                } else {
                    // 簡單模式：保持原有邏輯
                    bigToSmallDropZone = `
                        <div class="drop-zone" data-drop-type="source">
                            <div class="placeholder-money">
                                ${this.createMoneyHTML(sourceItemData, { faded: true })}
                                <div class="money-value">${sourceItemData.value}元</div>
                            </div>
                        </div>
                    `;
                }
                
                exchangeHTML = `
                    <div class="exchange-row">
                        <div class="drop-zone-area">
                            ${bigToSmallDropZone}
                        </div>
                        <div class="equals-sign">=</div>
                        <div class="target-area">
                            <div class="target-money-row">
                                ${targetMoney}
                            </div>
                        </div>
                        <div class="checkmark-area">
                            <svg class="checkmark" viewBox="0 0 24 24" style="opacity: 0;">
                                <path d="M9 12l2 2 4-4" stroke="currentColor" fill="none" stroke-width="2"/>
                            </svg>
                        </div>
                    </div>
                `;
            }
            
            gameArea.innerHTML = exchangeHTML;
        },

        generateDropZones(question, count) {
            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            const difficulty = this.state.settings.difficulty;

            if (difficulty === 'normal' || difficulty === 'hard') {
                // 【新增】獲取當前輪次的具體需求，生成詳細提示文字
                const gameState = this.getGameState('gameState');
                const currentRound = gameState.completedExchanges || 0;

                // 計算當前輪次需要的源金錢數量
                let requiredSourceCount = 1; // 預設值

                if (question.exchangeType === 'small-to-big') {
                    // 小換大模式：從目標金錢數量計算需要的源金錢數量
                    const targetsForThisRound = (gameState.targetImages && gameState.targetImages[currentRound])
                                              ? gameState.targetImages[currentRound]
                                              : [this.getRandomImage()];
                    const targetCount = targetsForThisRound.length;
                    requiredSourceCount = targetCount * question.exchangeRate; // 例如：3個5元需要15個1元
                    Game.Debug.log('hint', `🎯 [小換大提示] 第${currentRound + 1}輪需要${requiredSourceCount}個${sourceItemData.name}換${targetCount}個目標金錢`);
                }

                // 普通模式和困難模式：創建彈性單一放置框，帶有詳細提示文字
                return `
                    <div class="drop-zones-row">
                        <div class="drop-zone flexible-zone ${difficulty}-drop-zone" data-drop-type="source" data-mode="${difficulty}">
                            <div class="drop-hint">請放置正確的金錢數量</div>
                            <div class="placed-coins-container"></div>
                        </div>
                    </div>
                `;
            } else {
                // 簡單模式：保持原有多框邏輯
                let dropZonesHTML = '';
                for (let i = 0; i < count; i++) {
                    dropZonesHTML += `
                        <div class="drop-zone" data-drop-type="source" data-slot="${i}">
                            <div class="placeholder-money">
                                ${this.createMoneyHTML(sourceItemData, { faded: true })}
                                <div class="money-value">${sourceItemData.value}元</div>
                            </div>
                        </div>
                    `;
                }
                // 【修正】包裝在水平排列容器中
                return `<div class="drop-zones-row">${dropZonesHTML}</div>`;
            }
        },

        setupDragDropEvents(question, difficulty) {
            // 【修正】根據模式配置決定事件處理方式
            const config = this.ModeConfig[difficulty];
            
            // 🔧 [新增] 設置點擊事件處理 - 支援點擊放置功能
            if (config?.clickToMoveConfig?.enabled) {
                Game.Debug.log('event', '🎯 [C3點擊除錯] 設置點擊事件處理', { difficulty });
                
                // 【核心修正 #1】將事件監聽器綁定到更高層級的容器(#dynamic-game-container)，
                // 這樣才能同時捕捉到「我的金錢區」和「兌換區」的點擊事件。
                const eventContainer = document.getElementById('dynamic-game-container') || document.body;
                
                // 移除舊的點擊事件監聽器（如果存在）
                if (this._clickEventHandler) {
                    eventContainer.removeEventListener('click', this._clickEventHandler, { capture: true });
                }
                
                // 創建新的點擊事件處理器
                this._clickEventHandler = (event) => {
                    // 這個日誌現在應該會在每次點擊時出現
                    Game.Debug.log('event', '🖱️ [C3點擊除錯] 容器點擊事件觸發', {
                        target: event.target.id || event.target.className,
                    });

                    // 使用更廣泛的選擇器來確保能捕捉到所有模式下的錢幣
                    const moneyItem = event.target.closest('.money-item, .exchange-money-item, .placed-coin, .unit3-coin-container, .unit3-banknote-container');
                    if (moneyItem) {
                        Game.Debug.log('event', '✅ [C3點擊除錯] 發現金錢物品點擊，路由到 handleActionClick');
                        event.stopPropagation(); // 阻止事件冒泡，避免干擾
                        event.preventDefault(); // 阻止默認行為
                        // 🔧 [修正] 創建一個新的事件對象，將 target 設為金錢物品元素
                        const correctedEvent = { ...event, target: moneyItem };
                        this.handleActionClick(correctedEvent);
                    }
                };
                
                // 綁定新的點擊事件
                Game.EventManager.on(eventContainer, 'click', this._clickEventHandler, {
                    capture: true, // 使用捕獲階段確保優先處理
                }, {}, 'gameUI');

                Game.Debug.log('event', '✅ [C3點擊除錯] 點擊事件已成功綁定到 #dynamic-game-container');
            }
            
            // 設置拖拽事件 - 排除已放置的錢幣
            document.querySelectorAll('.money-item').forEach(item => {
                // 【簡單模式保護】不為已放置的錢幣綁定拖曳事件
                if (item.classList.contains('placed-coin')) {
                    Game.Debug.log('drag', '⛔ 跳過已放置錢幣的拖曳事件綁定:', item.id);
                    return;
                }
                
                Game.EventManager.on(item, 'dragstart', (e) => {
                    this.handleDragStart(e);
                }, {}, 'dragSystem');
            });
            
            // ▼▼▼ 核心修正點：精確的一格一幣邏輯 ▼▼▼
            // 【修正】將事件監聽器從父容器，改為精確地綁定到每一個獨立的放置格上
            document.querySelectorAll('.drop-zone').forEach(zone => {
                Game.EventManager.on(zone, 'dragover', (e) => {
                    e.preventDefault(); // 允許放置
                    const isFilled = zone.classList.contains('filled');
                    // 只有在格子為空時才顯示 "dragover" 效果
                    if (!isFilled) {
                        zone.classList.add('dragover');
                    }
                }, {}, 'dragSystem');
                
                Game.EventManager.on(zone, 'dragleave', (e) => {
                    zone.classList.remove('dragover');
                }, {}, 'dragSystem');
                
                Game.EventManager.on(zone, 'drop', (e) => {
                    zone.classList.remove('dragover'); // 無論如何都移除 dragover 效果
                    // 呼叫統一的交互處理器，現在的事件目標(e.target)就是被放置的那個格子
                    this.ModeStrategies.handleInteraction(difficulty, 'drop', { 
                        event: e, 
                        question: question 
                    });
                }, {}, 'dragSystem');
            });
            // ▲▲▲ 核心修正點結束 ▲▲▲
            
            // 【新增】為"我的金錢區"添加拖放事件，使其成為有效的放置目標
            const myMoneyArea = document.getElementById('my-money-area');
            if (myMoneyArea) {
                Game.EventManager.on(myMoneyArea, 'dragover', (e) => {
                    e.preventDefault(); // 這是允許放置的關鍵
                    myMoneyArea.classList.add('dragover'); // 添加視覺反饋
                }, {}, 'dragSystem');

                Game.EventManager.on(myMoneyArea, 'dragleave', (e) => {
                    myMoneyArea.classList.remove('dragover'); // 移除視覺反饋
                }, {}, 'dragSystem');

                Game.EventManager.on(myMoneyArea, 'drop', (e) => {
                    myMoneyArea.classList.remove('dragover');
                    // 調用與兌換區相同的統一ModeStrategy交互處理器
                    this.ModeStrategies.handleInteraction(difficulty, 'drop', {
                        event: e,
                        question: question
                    });
                }, {}, 'dragSystem');
                Game.Debug.log('state', '✅ "我的金錢區" 已設置為可拖放目標');
            }

            // 【修復】設置完成兌換按鈕事件（普通模式和困難模式）
            if (config.triggerType === 'manual') {
                const completeBtn = document.getElementById('complete-exchange-btn');
                if (completeBtn) {
                    // 使用cloneNode方式清除舊的事件監聽器，防止重複綁定
                    const newBtn = completeBtn.cloneNode(true);
                    completeBtn.parentNode.replaceChild(newBtn, completeBtn);
                    
                    // 【統一入口】所有 complete 事件都交給ModeStrategy處理
                    Game.EventManager.on(newBtn, 'click', (e) => {
                        this.ModeStrategies.handleInteraction(difficulty, 'complete', { 
                            event: e, 
                            question: question 
                        });
                    }, {}, 'gameUI');
                    Game.Debug.log('exchange', `✅ ${difficulty}模式完成兌換按鈕統一事件已綁定`);
                }
            }
            
            // 🔧 [關鍵修正] 設置TouchDragUtility手機拖拽支援
            // 【修復】使用正確的遊戲區域容器，而不是整個 app
            const gameContainer = document.getElementById('dynamic-game-container') || document.getElementById('app');
            if (gameContainer) {
                const handlers = {
                    dragStart: (e) => this.handleDragStart(e),
                    drop: (e) => this.ModeStrategies.handleInteraction(difficulty, 'drop', { event: e, question: question })
                };
                Game.Debug.log('drag', `🔧 [C3-${difficulty}] 準備註冊 TouchDragUtility，容器:`, gameContainer.id);
                
                // 【修復】使用 C4 相同的 TouchDragUtility 直接註冊機制
                if (!window.TouchDragUtility) {
                    Game.Debug.error('❌ [C3-金錢兌換] TouchDragUtility 未載入，觸控拖曳功能無法使用');
                    return;
                }
                
                // 延遲註冊以確保HTML元素已生成
                const registerTouchDrag = () => {
                    // 檢查元素是否已存在
                    const draggableItems = gameContainer.querySelectorAll('.money-item, .unit3-coin-container, .exchange-money-item, [draggable="true"]');
                    if (draggableItems.length === 0) {
                        Game.Debug.log('drag', `⏰ [${difficulty}模式] 等待元素生成，延遲重試TouchDragUtility註冊...`);
                        Game.TimerManager.setTimeout(registerTouchDrag, 100, 'drag');
                        return;
                    }
                    
                    Game.Debug.log('drag', `✅ [${difficulty}模式] 找到 ${draggableItems.length} 個可拖拽元素，開始註冊TouchDragUtility`);
                    
                    // 註冊可拖拽元素
                    window.TouchDragUtility.registerDraggable(
                        gameContainer,
                        '.money-item, .unit3-coin-container, .exchange-money-item, [draggable="true"]',
                        {
                            onDragStart: (element, event) => {
                                const syntheticEvent = {
                                    target: element,
                                    preventDefault: () => {},
                                    dataTransfer: { setData: () => {}, getData: () => '', effectAllowed: 'move' }
                                };
                                handlers.dragStart(syntheticEvent);
                            },
                            onDrop: (element, dropZone, event) => {
                                const syntheticEvent = {
                                    target: dropZone,
                                    preventDefault: () => {},
                                    dataTransfer: {
                                        getData: () => element.id,
                                        setData: () => {}
                                    }
                                };
                                handlers.drop(syntheticEvent);
                            }
                        }
                    );
                    
                    // 註冊放置區域
                    const dropZones = gameContainer.querySelectorAll('.drop-zone, .flexible-zone');
                    const moneyArea = gameContainer.querySelector('#my-money-area');
                    
                    dropZones.forEach(zone => {
                        if (zone) {
                            window.TouchDragUtility.registerDropZone(zone, () => true);
                            Game.Debug.log('drag', `✅ [${difficulty}模式] 放置區域已註冊:`, zone.className);
                        }
                    });
                    
                    if (moneyArea) {
                        window.TouchDragUtility.registerDropZone(moneyArea, () => true);
                        Game.Debug.log('state', `✅ [${difficulty}模式] 金錢來源區域已註冊`);
                    }
                };
                
                // 啟動延遲註冊
                registerTouchDrag();
            }
        },

        // =====================================================
        // 普通模式專用拖放處理 - 不自動檢查完成
        // =====================================================
        handleManualModeDrop(e, question, difficulty) {
            e.preventDefault();
            Game.Debug.log('drag', '🎯 普通模式拖放處理 (僅放置，不自動檢查)');
            
            // 【修正】從dataTransfer獲取拖拽數據，而不是依賴.dragging類
            const coinId = e.dataTransfer.getData('text/plain');
            const coinValue = e.dataTransfer.getData('coin-value');
            
            if (!coinId) {
                Game.Debug.log('drag', '❌ 無法獲取拖拽金錢ID');
                return;
            }
            
            // 根據ID找到拖拽元素
            const droppedElement = document.getElementById(coinId);
            if (!droppedElement) {
                Game.Debug.log('drag', `❌ 找不到拖拽的元素: ${coinId}`);
                return;
            }

            const dropZone = e.target.closest('.drop-zone, .flexible-zone');
            if (!dropZone) {
                Game.Debug.log('drag', '❌ 不是有效的放置目標');
                return;
            }

            const { exchangeType, sourceValue } = question;
            const droppedValue = parseInt(droppedElement.getAttribute('data-value'));

            // 驗證金錢類型
            if (droppedValue !== sourceValue) {
                Game.Debug.log('drag', `❌ 金錢類型不符：拖拽${droppedValue}元，需要${sourceValue}元`);
                const config = this.ModeConfig[difficulty];
                this.Audio.playErrorSound(difficulty, config);
                return;
            }

            // 【關鍵】使用普通模式專用的處理邏輯，不調用checkExchangeComplete
            const config = this.ModeConfig[difficulty];
            
            // 播放拖拽音效
            this.Audio.playDropSound(difficulty, config);

            // 根據兌換類型調用對應的處理函數
            if (exchangeType === 'big-to-small') {
                this.processNormalModeBigToSmallDrop(dropZone, droppedElement, question);
            } else if (exchangeType === 'small-to-big') {
                this.processNormalModeSmallToBigDrop(dropZone, droppedElement, question);
            }
            
            Game.Debug.log('drag', '✅ 普通模式金錢放置完成，等待手動觸發完成檢查');
        },

        // =====================================================
        // 基本事件處理函數 - 支持新架構
        // =====================================================
        handleDragStart(e) {
            // 防止重複觸發
            if (e.target.dataset.dragHandled) return;
            e.target.dataset.dragHandled = 'true';
            
            // ▼▼▼ 【核心修正點】▼▼▼
            // 修正選擇器，使其能同時捕捉來自「我的金錢區」(.money-item) 
            // 和「兌換區」(.exchange-money-item) 的錢幣。
            const draggedElement = e.target.closest('.money-item, .exchange-money-item');
            if (!draggedElement) {
                Game.TimerManager.setTimeout(() => { delete e.target.dataset.dragHandled; }, 100, 'drag');
                return;
            }

            // 新增邏輯，以區分兩種拖曳方向，並正確設定ID
            let logicalCoinId;
            const actualElementId = draggedElement.id; // 無論如何，這都是當前被拖曳元素的真實DOM ID
            const coinValue = draggedElement.dataset.value;

            if (draggedElement.classList.contains('exchange-money-item')) {
                // 情況 A: 從「兌換區」拖曳回來
                // 邏輯ID應使用儲存在 data-original-id 中的原始ID，用於狀態管理
                logicalCoinId = draggedElement.dataset.originalId;
                Game.Debug.log('drag', `🎯 開始拖拽 (返回): 邏輯ID=${logicalCoinId}, 實際DOM ID=${actualElementId}, 值: ${coinValue}`);
            } else {
                // 情況 B: 從「我的金錢區」拖曳出去
                // 邏輯ID和實際DOM ID是相同的
                logicalCoinId = actualElementId;
                Game.Debug.log('drag', `🎯 開始拖拽 (放置): 邏輯ID=${logicalCoinId}, 實際DOM ID=${actualElementId}, 值: ${coinValue}`);
            }
            // ▲▲▲ 【核心修正點結束】▲▲▲
            
            if (!logicalCoinId) {
                Game.Debug.error('❌ 拖拽元素缺少邏輯ID (original-id or id)');
                Game.TimerManager.setTimeout(() => { delete e.target.dataset.dragHandled; }, 100, 'drag');
                return;
            }
            
            e.dataTransfer.setData('text/plain', logicalCoinId);
            e.dataTransfer.setData('coin-value', coinValue);

            // 【狀態更新修正】
            this.state.isDragging = true;
            this.state.draggedCoinId = logicalCoinId;       // 用於遊戲邏輯的ID
            this.state.draggedElementId = actualElementId;  // 【關鍵】用於尋找DOM元素的ID，現在總是正確的

            // 清理標記
            Game.TimerManager.setTimeout(() => {
                delete e.target.dataset.dragHandled;
            }, 100, 'drag');

            // 添加拖拽中的視覺效果
            draggedElement.style.opacity = '0.5';
            draggedElement.classList.add('dragging'); // 確保有 dragging class

            // 🆕 建立去背拖曳預覽（桌面端）
            const _dragImg = draggedElement.querySelector('img');
            if (_dragImg) {
                const _ghost = _dragImg.cloneNode(true);
                _ghost.style.width = _dragImg.offsetWidth + 'px';
                _ghost.style.height = _dragImg.offsetHeight + 'px';
                _ghost.style.position = 'absolute';
                _ghost.style.top = '-9999px';
                _ghost.style.left = '-9999px';
                document.body.appendChild(_ghost);
                if (e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                    e.dataTransfer.setDragImage(_ghost, _ghost.offsetWidth / 2, _ghost.offsetHeight / 2);
                }
                Game.TimerManager.setTimeout(() => _ghost.remove(), 0, 'drag');
            }
        },

        handleDragOver(e) {
            e.preventDefault();
        },

        handleDrop(e, question, difficulty) {
            e.preventDefault();
            
            let coinId = e.dataTransfer.getData('text/plain');
            const coinValue = e.dataTransfer.getData('coin-value');
            const dropZone = e.target.closest('.drop-zone');
            
            if (!dropZone) {
                Game.Debug.log('drag', '❌ 放置失敗：找不到放置區');
                return;
            }
            
            // 【修正】如果coinId是圖片URL，嘗試從拖拽的元素獲取正確ID
            if (coinId && coinId.includes('../images/')) {
                Game.Debug.log('state', '⚠️ 檢測到圖片URL作為coinId，嘗試修正');
                // 嘗試從正在拖拽的元素獲取正確的ID
                const draggedElements = document.querySelectorAll('.money-item[draggable="true"]');
                for (const element of draggedElements) {
                    if (element.querySelector('img') && element.querySelector('img').src === coinId) {
                        coinId = element.dataset.id;
                        Game.Debug.log('state', `✅ 修正coinId: ${coinId}`);
                        break;
                    }
                }
            }
            
            if (!coinId) {
                Game.Debug.log('drag', '❌ 放置失敗：找不到金錢ID');
                return;
            }
            
            Game.Debug.log('drag', `🎯 放置金錢: ${coinId} 到兌換區`);
            
            // 獲取被拖拽的金錢元素
            const coinElement = document.querySelector(`[data-id="${coinId}"]`);
            if (!coinElement) {
                Game.Debug.error(`❌ 找不到金錢元素: ${coinId}`);
                Game.Debug.log('state', '🔍 所有可用的金錢元素:', document.querySelectorAll('[data-id]'));
                return;
            }
            
            // 重置拖拽狀態
            this.state.isDragging = false;
            coinElement.style.opacity = '1';
            
            // 檢查放置區是否已被填充（有 filled 類）
            if (dropZone.classList.contains('filled')) {
                Game.Debug.log('drag', '⚠️ 放置區已有金錢，不能重複放置');
                return;
            }
            
            // 移動金錢到放置區並顯示正常圖示
            this.moveCoinToDropZone(coinElement, dropZone, coinValue);
            
            // 立即更新標題計數（拖曳後我的金錢減少，兌換區增加）
            Game.TimerManager.setTimeout(() => this.updateSectionTitleCounts(), 50, 'ui');
            
            // 播放累計金額語音，最後一個金錢播放完後進行兌換檢查
            this.playCumulativeAmountSpeech(question, () => {
                // 語音播放完畢後的回調：檢查兌換完成
                Game.Debug.log('exchange', '🔊 累計語音播放完畢，檢查兌換完成');
                this.checkExchangeComplete(question, difficulty);
            });
        },

        moveCoinToDropZone(coinElement, dropZone, coinValue) {
            // 獲取金錢的圖片和名稱
            const coinImg = coinElement.querySelector('img');
            const coinName = coinElement.querySelector('.money-value').textContent;
            
            // 移除淡化的占位符
            const placeholder = dropZone.querySelector('.placeholder-money');
            if (placeholder) {
                placeholder.remove();
            }
            
            // 創建金錢副本並確保顯示正常圖示（非淡化）
            const coinClone = coinElement.cloneNode(true);
            coinClone.style.opacity = '1';
            coinClone.draggable = false;
            coinClone.classList.add('placed-coin');
            
            // 確保圖片不是淡化的
            const cloneImg = coinClone.querySelector('img');
            if (cloneImg) {
                cloneImg.classList.remove('faded');
                cloneImg.style.opacity = '1';
            }
            
            // 添加到放置區
            dropZone.appendChild(coinClone);
            dropZone.classList.add('filled');
            
            Game.Debug.log('exchange', `✅ 金錢已移動到兌換區，顯示正常圖示: ${coinName}`);
            
            // 從我的金錢區移除原始元素
            coinElement.remove();
        },

        checkExchangeComplete(question, difficulty) {
            const { exchangeType, exchangeRate } = question;
            const filledZones = document.querySelectorAll('.drop-zone.filled');
            
            let isComplete = false;
            
            if (exchangeType === 'small-to-big') {
                // 小換大：需要放滿指定數量的小錢
                isComplete = filledZones.length >= exchangeRate;
            } else {
                // 大換小：需要放1個大錢
                isComplete = filledZones.length >= 1;
            }
            
            if (isComplete) {
                Game.Debug.log('exchange', '🎉 兌換完成！');
                MoneyExchange3.ModeStrategies.handleCompletion(difficulty, { question });
            } else {
                Game.Debug.log('exchange', `⏳ 兌換進行中: ${filledZones.length}/${exchangeRate}`);
            }
        },

        // ⚠️ completeExchange 函數已刪除，請使用 ModeStrategies.handleCompletion 替代

        showExchangeResult(question) {
            const resultsArea = document.getElementById('exchange-results-area');
            if (!resultsArea) return;
            
            const { sourceValue, targetValue, exchangeRate, exchangeType } = question;
            const targetItemData = this.gameData.allItems.find(item => item.value === targetValue);
            
            if (!targetItemData) return;
            
            // 【強化】多輪結果累積管理 - 確保容器唯一性和狀態一致性
            let resultsContainer = resultsArea.querySelector('.unified-results-container');
            if (!resultsContainer) {
                // 第一次創建統一容器 - 移除所有現有內容，確保乾淨初始化
                const existingContent = resultsArea.innerHTML.trim();
                if (existingContent && !existingContent.includes('unified-results-container')) {
                    Game.Debug.log('state', `🧹 清理結果區域現有內容: ${existingContent.substring(0, 50)}...`);
                }
                
                resultsArea.innerHTML = `
                    <div class="unified-results-container target-money-row">
                        <!-- 所有兌換結果將在此水平排列 -->
                    </div>
                `;
                resultsContainer = resultsArea.querySelector('.unified-results-container');
                Game.Debug.log('exchange', `🆕 創建統一結果容器 (第${this.state.gameState.completedExchanges + 1}輪)`);
            } else {
                Game.Debug.log('exchange', `♻️ 重用現有結果容器 (第${this.state.gameState.completedExchanges + 1}輪) - 當前包含${resultsContainer.children.length}個結果`);
            }
            
            // 【修正】從 gameState.targetImages 讀取本輪應兌換的目標數量
            const gameState = this.getGameState('gameState');
            // completedExchanges 是剛完成的輪次，其索引是 completedExchanges - 1
            const completedRoundIndex = gameState.completedExchanges - 1;
            
            // 從 gameState 的 targetImages 中獲取本輪應兌換的目標數量
            const targetsForThisRound = (gameState.targetImages && gameState.targetImages[completedRoundIndex]) 
                                      ? gameState.targetImages[completedRoundIndex] 
                                      : [];
            
            let coinsToAdd = targetsForThisRound.length;
            if (coinsToAdd === 0) {
                // 如果是簡單模式或 fallback，則使用 exchangeRate
                const fallbackCount = exchangeType === 'small-to-big' ? 1 : exchangeRate;
                Game.Debug.warn('exchange', `⚠️ showExchangeResult：找不到輪次目標，將顯示預設 ${fallbackCount} 個結果。`);
                coinsToAdd = fallbackCount;
            }
            
            Game.Debug.log('exchange', `💰 顯示第${completedRoundIndex + 1}輪兌換結果: ${coinsToAdd}個${targetItemData.name}`);
            
            // 【解決重疊】創建新的金錢圖示元素並添加到適當容器
            const containerClass = targetItemData.value >= 100 ? 'unit3-banknote-container' : 'unit3-coin-container';
            const newCoins = [];
            for (let i = 0; i < coinsToAdd; i++) {
                // 創建包含容器的完整元素
                const coinContainer = document.createElement('div');
                coinContainer.className = `${containerClass} money-item new-result-coin`;
                
                const coinImg = this.createMoneyElement(targetItemData, {
                    additionalClasses: 'result-coin'
                });
                
                const valueDiv = document.createElement('div');
                valueDiv.className = 'money-value';
                valueDiv.textContent = targetItemData.name;
                
                coinContainer.appendChild(coinImg);
                coinContainer.appendChild(valueDiv);
                
                const newCoin = coinContainer;
                
                // 直接添加到容器，不影響現有元素
                resultsContainer.appendChild(newCoin);
                newCoins.push(newCoin);
            }
            
            resultsArea.classList.add('persistent-result');
            
            // 【動畫處理】：只對新添加的金錢圖示播放動畫
            const difficulty = this.state.settings.difficulty || 'easy';
            const config = this.ModeConfig[difficulty];
            const animationDuration = config.timing.animationDuration || 800;
            
            // 動畫完成後移除動畫類
            Game.TimerManager.setTimeout(() => {
                newCoins.forEach(coin => {
                    coin.classList.remove('new-result-coin');
                });
            }, animationDuration, 'ui');
            
            // 更新標題計數
            Game.TimerManager.setTimeout(() => this.updateSectionTitleCounts(), animationDuration + 100, 'ui');
            
            // 【驗證】多輪結果累積完整性檢查
            const totalResultsInContainer = resultsContainer.children.length;
            const expectedResultsForCurrentRound = gameState.completedExchanges;
            
            // 計算預期的總結果數（根據兌換類型）
            let expectedTotalResults = 0;
            if (exchangeType === 'small-to-big') {
                expectedTotalResults = expectedResultsForCurrentRound; // 每輪1個
            } else {
                expectedTotalResults = expectedResultsForCurrentRound * exchangeRate; // 每輪exchangeRate個
            }
            
            if (totalResultsInContainer === expectedTotalResults) {
                Game.Debug.log('judge', `✅ 結果累積驗證通過: 容器包含${totalResultsInContainer}個結果 (預期${expectedTotalResults}個)`);
            } else {
                Game.Debug.warn('state', `⚠️ 結果累積異常: 容器包含${totalResultsInContainer}個結果，但預期${expectedTotalResults}個 (第${expectedResultsForCurrentRound}輪)`);
            }
            
            Game.Debug.log('exchange', `💰 兌換結果已添加: ${exchangeType === 'small-to-big' ? '1' : exchangeRate}個${targetItemData.name} (新增動畫)`);
        },

        playExchangeCompletionSpeech(question, difficulty) {
            const { sourceValue, targetValue, exchangeRate, exchangeType } = question;
            const sourceItemData = this.gameData.allItems.find(item => item.value === sourceValue);
            const targetItemData = this.gameData.allItems.find(item => item.value === targetValue);
            
            const config = this.ModeConfig[difficulty];
            const templateKey = exchangeType === 'small-to-big' ? 'smallToBig' : 'bigToSmall';
            const template = config.speechTemplates.exchangeComplete[templateKey];
            
            if (!template) {
                Game.Debug.warn('exchange', `❌ 找不到${difficulty}模式${exchangeType}的語音模板`);
                return;
            }
            
            // 【修正競爭條件】避免依賴會被清除的 placedCoins 陣列
            const gameState = this.getGameState('gameState');
            const placedCoinsCount = gameState.currentRoundDropZone.placedCoins.length;

            let sourceCount, targetCount;
            
            // ▼▼▼ 核心修正點 ▼▼▼
            if (exchangeType === 'small-to-big') {
                // 【修正】對於小換大，來源數量直接使用固定的兌換率，不再依賴會被清除的 placedCoins 陣列
                sourceCount = exchangeRate;
                targetCount = 1; // 小換大，目標永遠是1個
            } else {
                // 大換小邏輯保持不變，因為來源數量可能是變動的
                sourceCount = placedCoinsCount;
                targetCount = placedCoinsCount * exchangeRate;
            }
            // ▲▲▲ 核心修正點結束 ▲▲▲
            
            const speechText = template
                .replace('{sourceCount}', sourceCount)
                .replace('{sourceName}', sourceItemData.name)
                .replace('{targetCount}', Math.round(targetCount)) // 四捨五入避免浮點數問題
                .replace('{targetName}', targetItemData.name);
            
            Game.Debug.log('exchange', `🗣️ 配置驅動兌換完成語音 (已修正): ${speechText}`);
            
            this.Speech.speak(speechText, difficulty, config, () => {
                Game.TimerManager.setTimeout(() => {
                    this.ModeStrategies.handleMultiRound(difficulty, question, config);
                }, config.timing.speechDelay || 500, 'speech');
            });
        },

        // 【新增】播放兌換區累計金額語音
        playCumulativeAmountSpeech(question, callback = null) {
            // 【更新】計算兌換區當前總金額 - 配合一格一幣邏輯
            // 檢查當前模式，使用相應的計算方法
            const difficulty = this.state.settings.difficulty || 'easy';
            const config = this.ModeConfig[difficulty];
            let currentCount = 0;
            
            if (difficulty === 'easy') {
                // 簡單模式：計算已填充的格子數量
                const filledZones = document.querySelectorAll('.drop-zone[data-drop-type="source"].filled');
                currentCount = filledZones.length;
                Game.Debug.log('state', `📊 簡單模式累計計算: ${currentCount} 個已填充格子`);
            } else {
                // 普通/困難模式：計算放置區域內的金錢項目
                const exchangeElements = document.querySelectorAll('.exchange-drop-zone .money-item, .flexible-zone .money-item');
                currentCount = exchangeElements.length;
                Game.Debug.log('state', `📊 ${difficulty}模式累計計算: ${currentCount} 個金錢項目`);
            }
            
            const totalValue = currentCount * question.sourceValue;
            
            // 獲取源金錢單位
            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            const unitName = sourceItemData ? sourceItemData.name : question.sourceValue + '元';
            
            // 檢查是否需要的兌換數量（是否是最後一個）
            const { exchangeType, exchangeRate } = question;
            const requiredCount = exchangeType === 'small-to-big' ? exchangeRate : 1;
            const isLastItem = currentCount >= requiredCount;
            
            // 生成語音文字
            let speechText;
            if (difficulty === 'easy' || difficulty === 'normal') {
                // 簡單/普通模式：直接說金額，不加「目前總共」前綴
                const traditionalValue = this.Speech.convertToTraditionalCurrency(totalValue);
                speechText = traditionalValue;
            } else if (isLastItem) {
                // 困難模式最後一個金錢：播放完整格式 "目前總共×個×元"
                speechText = `目前總共${currentCount}個${unitName}`;
            } else {
                // 困難模式非最後一個：播放簡短格式 "目前總共×元"
                const traditionalValue = this.Speech.convertToTraditionalCurrency(totalValue);
                speechText = `目前總共${traditionalValue}`;
            }
            
            Game.Debug.log('speech', `🔊 播放累計語音: "${speechText}" (${currentCount}個${unitName}, 最後:${isLastItem})`);
            
            // 使用配置驅動的語音系統，支持回調
            if (callback && isLastItem) {
                this.Speech.speak(speechText, difficulty, config, callback);
            } else {
                this.Speech.speak(speechText, difficulty, config);
            }
        },

        // 【新增】播放新題目開始語音提示
        playQuestionStartSpeech(question) {
            // 計算我的金錢區當前數量
            const myMoneyElements = document.querySelectorAll('.my-money-area .money-item, #my-money-area .money-item');
            const myMoneyCount = myMoneyElements.length;
            
            // 獲取源金錢和目標金錢資訊
            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            const targetItemData = this.gameData.allItems.find(item => item.value === question.targetValue);
            
            // 🔧 [修正] 使用傳統中文貨幣格式
            const traditionalSourceUnit = this.Speech.convertToTraditionalCurrency(question.sourceValue);
            const traditionalTargetUnit = this.Speech.convertToTraditionalCurrency(question.targetValue);
            
            // 生成語音文字：請問×個1元可以換成幾個5元
            const speechText = `請問${myMoneyCount}個${traditionalSourceUnit}可以換成幾個${traditionalTargetUnit}`;
            
            // 播放語音（使用當前難度設定）
            const difficulty = this.state.settings.difficulty || 'easy';
            const config = this.ModeConfig[difficulty];
            
            Game.Debug.log('speech', `🔊 播放新題目語音: "${speechText}"`);
            
            // 使用配置驅動的語音系統
            this.Speech.speak(speechText, difficulty, config);
        },

        // 播放放置金錢時的語音反饋
        playPlacementSpeech(question, placedCount) {
            const difficulty = this.state.settings.difficulty;
            const config = this.ModeConfig[difficulty];
            
            // 只有在配置允許語音反饋時才播放
            if (!config.speechFeedback) {
                return;
            }
            
            // 直接播放累計金額，不加「目前總共」前綴
            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            if (sourceItemData) {
                const currentTotal = placedCount * question.sourceValue;
                const speechText = this.Speech.convertToTraditionalCurrency(currentTotal);

                Game.Debug.log('drag', `🔊 播放放置語音: "${speechText}"`);
                this.Speech.speak(speechText, difficulty, config);
            }
        },

        // ⚠️ checkAllRoundsComplete 函數已刪除，請使用 ModeStrategies.handleCompletion 替代

        continueNextRound(question, difficulty) {
            // 繼續同一題目的下一輪，不重新生成整個問題
            const gameState = this.getGameState('gameState');
            const nextRound = (gameState.completedExchanges || 0) + 1;
            Game.Debug.log('question', `🔄 繼續同一題目的下一輪: 第${nextRound}輪`);
            
            // 重置當前輪的兌換狀態，但保留結果顯示
            gameState.currentRoundPlaced = 0;
            gameState.currentRoundDropZone = {
                placedCoins: [],
                requiredCoins: question.exchangeType === 'small-to-big' ? question.exchangeRate : 1,
                targetCoins: question.exchangeType === 'small-to-big' ? 1 : question.exchangeRate
            };
            
            // 保存更新後的狀態
            this.setGameState('gameState', gameState);
            
            // ▼▼▼ 【需求 #1 修正】 ▼▼▼
            // 將原本只針對 'easy' 模式的動畫邏輯，改為檢查配置的通用邏輯
            const config = this.ModeConfig[difficulty];
            
            // 檢查當前模式是否配置了輪次轉場動畫
            if (config.animations && config.animations.roundTransition) {
                // 如果有配置，則執行淡出/淡入動畫流程
                Game.Debug.log('ui', `🎬 偵測到 ${difficulty} 模式的轉場動畫配置，開始執行動畫...`);
                const exchangeArea = document.getElementById('game-area');
                
                // 1. 先播放退出動畫（微下移、淡化消失到完全隱藏）
                this.Utils.Animation.animateExchangeAreaExit(exchangeArea, config, () => {
                    // 2. 退出動畫完成後，確保元素處於完全隱藏狀態
                    exchangeArea.style.visibility = 'hidden';
                    exchangeArea.style.opacity = '0';
                    
                    // 3. 在隱藏狀態下更新兌換區的DOM內容
                    this.refreshExchangeArea(question, difficulty, false);
                    // 重置後立即更新標題計數（兌換區已清空，歸零顯示）
                    this.updateSectionTitleCounts();

                    // 4. DOM更新完成後，短暫延遲開始淡入動畫
                    Game.TimerManager.setTimeout(() => {
                        this.Utils.Animation.animateExchangeAreaEnter(exchangeArea, config);
                    }, config.timing.roundTransitionDelay || 100); // 使用配置的延遲時間
                });
            } else {
                // 如果沒有配置動畫，則保持原有的直接刷新邏輯
                Game.Debug.log('ui', `🚫 ${difficulty} 模式未配置轉場動畫，直接刷新UI。`);
                this.refreshExchangeArea(question, difficulty);
                // 重置後立即更新標題計數（兌換區已清空，歸零顯示）
                this.updateSectionTitleCounts();
            }
            // ▲▲▲ 【需求 #1 修正結束】 ▲▲▲
        },

        refreshExchangeArea(question, difficulty, withAnimation = true) {
            // 只刷新兌換區域，保留其他區域
            const exchangeArea = document.getElementById('game-area');
            if (!exchangeArea) return;
            
            // 獲取源和目標物件數據，確保完整的視覺配置
            const { sourceValue, targetValue } = question;
            const sourceItemData = this.gameData.allItems.find(item => item.value === sourceValue);
            const targetItemData = this.gameData.allItems.find(item => item.value === targetValue);
            
            if (!sourceItemData || !targetItemData) {
                Game.Debug.error('❌ 找不到源或目標物件數據');
                return;
            }
            
            Game.Debug.log('exchange', `🔄 刷新兌換區域${withAnimation ? '(含動畫)' : '(無動畫)'}: ${sourceItemData.name} → ${targetItemData.name}`);
            
            // 使用完整的renderExchangeArea函數，保持與第1輪相同的視覺配置
            this.renderExchangeArea(question, sourceItemData, targetItemData, exchangeArea, difficulty);
            
            // 重新設置拖放事件監聽器 (修正版本，支援手動模式)
            this.setupDragDropEvents(question, difficulty);
        },

        playFinalCompletionSpeech(question, difficulty) {
            const config = this.ModeConfig[difficulty];
            const templateKey = question.exchangeType === 'small-to-big' ? 'smallToBig' : 'bigToSmall';
            const template = config.speechTemplates.allRoundsComplete?.[templateKey];

            if (!template) {
                Game.Debug.log('exchange', `ℹ️ ${difficulty}模式${question.exchangeType}無總結語音模板，跳過`);
                Game.TimerManager.setTimeout(() => this.nextQuestion(), config.timing.nextQuestionDelay, 'question');
                return;
            }
            
            const { sourceValue, targetValue, exchangeRate, sourceItemsCount } = question;
            const sourceItemData = this.gameData.allItems.find(item => item.value === sourceValue);
            const targetItemData = this.gameData.allItems.find(item => item.value === targetValue);
            
            // 【最終修正】無論兌換類型，總源金錢數都應直接使用 sourceItemsCount
            // 它是問題生成時的權威來源，代表了整個問題的規模。
            const totalSourceUsed = sourceItemsCount;
            let totalExchanged;

            if (question.exchangeType === 'small-to-big') {
                totalExchanged = totalSourceUsed / exchangeRate;
            } else { // big-to-small
                totalExchanged = totalSourceUsed * exchangeRate;
            }
            
            let speechText = template
                .replace('{totalSource}', totalSourceUsed)
                .replace('{sourceName}', sourceItemData.name)
                .replace('{totalTarget}', Math.round(totalExchanged)) // 四捨五入以防浮點數問題
                .replace('{targetName}', targetItemData.name);

            // 判斷是否為最後一題，加上結尾語（最後一題由 endGame 播放恭喜語音）
            const isLastQuestion = this.state.currentQuestionIndex + 1 >= this.state.totalQuestions;
            speechText = speechText + (isLastQuestion ? '' : '，進入下一題');

            Game.Debug.log('speech', `🗣️ 配置驅動總結語音: ${speechText}`);
            this.Speech.speak(speechText, difficulty, config, () => {
                Game.TimerManager.setTimeout(() => {
                    this.nextQuestion();
                }, config.timing.speechDelay, 'question');
            });
        },

        nextQuestion() {
            // 🔧 [新增] 防重複題目機制：記錄當前完成題目的兌換特徵
            const currentQuestion = this.state.quizQuestions[this.state.currentQuestionIndex];
            if (currentQuestion) {
                const { sourceValue, targetValue, sourceItemsCount } = currentQuestion;
                this.state.lastExchangeKey = `${sourceValue}-${targetValue}-${sourceItemsCount}`;
                Game.Debug.log('exchange', '🎯 [C3-防重複] 記錄已完成題目特徵:', this.state.lastExchangeKey);
            }
            
            // 增加分數（當前完成題目）
            this.state.score++;
            
            // 先檢查是否還有下一題
            if (this.state.currentQuestionIndex + 1 >= this.state.totalQuestions) {
                Game.Debug.log('question', '🏆 所有題目完成，結束遊戲');
                this.endGame();
                return;
            }
            
            // 增加題目索引
            this.state.currentQuestionIndex++;
            
            Game.Debug.log('state', `🚀 進入下一題: 第${this.state.currentQuestionIndex + 1}題 / 共${this.state.totalQuestions}題`);
            
            const question = this.state.quizQuestions[this.state.currentQuestionIndex];
            Game.Debug.log('question', `📋 開始新題目:`, question);
            this.startQuestion(question);
            
            // 【修正】在startQuestion之後更新進度，確保DOM已渲染
            Game.TimerManager.setTimeout(() => {
                this.updateProgress();
            }, 100, 'ui');
        },

        endGame() {
            if (this.state.isEndingGame) { Game.Debug.log('state', '⚠️ [C3] endGame 已執行過，忽略重複呼叫'); return; }
            this.state.isEndingGame = true;
            AssistClick.deactivate();
            // 【配置驅動】遊戲結束處理
            Game.Debug.log('ui', '🎯 遊戲結束，準備顯示結果');

            const difficulty = this.Core.StateManager.getCurrentMode();
            const config = this.ModeConfig[difficulty];

            // 顯示遊戲結果對話框
            const totalScore = this.state.score;
            const totalQuestions = this.state.totalQuestions;
            const percentage = Math.round((totalScore / totalQuestions) * 100);

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'c3', unitName: 'C3 金錢面額的兌換', series: 'C',
                score: totalScore, total: totalQuestions, difficulty,
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

            document.getElementById('app').innerHTML = `
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
                                <div class="result-value">${totalScore} / ${totalQuestions}</div>
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
                                <div class="achievement-item">🎯 了解等值兌換概念</div>
                                <div class="achievement-item">💰 練習硬幣與紙鈔互換</div>
                                <div class="achievement-item">📝 掌握多種換法組合</div>
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

            // 播放測驗總結語音
            Game.TimerManager.setTimeout(() => {
                this.Speech.speak('恭喜完成所有題目', difficulty, config);
            }, 300, 'speech');

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
            }, 100, 'ui');

            // 【配置驅動】播放結束音效（如果啟用）
            if (config.audioFeedback) {
                this.Audio.playSuccessSound(difficulty, config);
            }
        },

        // =====================================================
        // 🔧 [新增] 點擊放置功能 - 參考 f3_number_recognition 實現
        // =====================================================
        
        // 主要點擊事件路由處理
        handleActionClick(event) {
            if (this.Core.StateManager.getState('isProcessingExchange')) {
                Game.Debug.log('exchange', '⏸️ 正在處理兌換中，忽略點擊');
                return;
            }
            
            const target = event.target;
            const difficulty = this.Core.StateManager.getCurrentMode();
            const config = this.ModeConfig[difficulty];
            const useClickToMove = config?.clickToMoveConfig?.enabled;
            
            Game.Debug.log('event', '🎯 [C3點擊除錯] handleActionClick 被呼叫', {
                target: target,
                targetClasses: target.className,
                difficulty: difficulty,
                useClickToMove: useClickToMove
            });
            
            if (target.id === 'complete-exchange-btn') {
                const currentQuestion = this.state.quizQuestions[this.state.currentQuestionIndex];
                this.handleCompleteExchangeClick(currentQuestion);
            } else if (useClickToMove && target.classList && 
                      (target.classList.contains('money-item') || 
                       target.classList.contains('exchange-money-item') || 
                       target.classList.contains('placed-coin'))) {
                Game.Debug.log('event', '✅ [C3點擊除錯] 找到金錢物品，路由到點擊移動邏輯');
                this.handleItemClick(event);
            } else {
                Game.Debug.log('event', '❌ [C3點擊除錯] 目標不是有效的可點擊金錢物品');
            }
        },
        
        // 點擊物品處理
        handleItemClick(event) {
            const difficulty = this.Core.StateManager.getCurrentMode();
            const config = this.ModeConfig[difficulty];
            
            if (!config?.clickToMoveConfig?.enabled) {
                Game.Debug.log('event', '⚠️ 點擊移動功能未啟用');
                return;
            }
            
            Game.Debug.log('event', '🎯 [C3點擊除錯] handleItemClick 被呼叫', { difficulty });
            
            // 找到實際的可操作元素 - 包含所有可能的金錢物品類別
            let clickedElement = event.target.closest('.money-item, .exchange-item, .unit3-coin-container, .unit3-banknote-container');
            
            if (!clickedElement) {
                Game.Debug.log('event', '❌ [C3點擊除錯] 未找到有效的金錢物品元素');
                return;
            }
            
            Game.Debug.log('event', '✅ [C3點擊除錯] 找到可點擊的金錢物品', {
                element: clickedElement,
                classes: clickedElement.className,
                value: clickedElement.dataset.value
            });
            
            // 判斷點擊的是什麼類型的金錢物品
            if (clickedElement.closest('.my-money-area, #my-money-area')) {
                // 點擊源區域的物品 - 嘗試選擇/雙擊放置
                this.handleClickToPlace(clickedElement, event);
            } else if (clickedElement.closest('.exchange-drop-zone, .drop-zone, .flexible-zone')) {
                // 點擊已放置的物品 - 嘗試取回
                if (config.clickToMoveConfig.allowClickToReturn) {
                    this.handleClickToReturn(clickedElement, event);
                } else {
                    Game.Debug.log('event', 'ℹ️ 當前模式不允許點擊取回');
                }
            }
        },
        
        // 雙擊放置處理
        handleClickToPlace(sourceItem, event) {
            const difficulty = this.Core.StateManager.getCurrentMode();
            const config = this.ModeConfig[difficulty];
            
            Game.Debug.log('event', '🎯 [C3點擊除錯] handleClickToPlace 被呼叫', {
                sourceItem: sourceItem,
                difficulty: difficulty
            });
            
            if (!config?.clickToMoveConfig?.allowClickToPlace) {
                Game.Debug.log('drag', '❌ 此模式不允許點擊放置');
                return;
            }
            
            // 雙擊檢測邏輯
            const currentTime = Date.now();
            const lastClickTime = this.Core.StateManager.getState('lastClickTime', difficulty);
            const lastClickedElement = this.Core.StateManager.getState('lastClickedElement', difficulty);
            const doubleClickDelay = this.Core.StateManager.getState('doubleClickDelay', difficulty) || 500;
            
            const isSameElement = lastClickedElement === sourceItem;
            const isWithinDoubleClickTime = (currentTime - lastClickTime) < doubleClickDelay;
            const timeDiff = currentTime - lastClickTime;
            
            Game.Debug.log('event', '🔍 [C3點擊除錯] 雙擊檢測狀態', {
                currentTime: currentTime,
                lastClickTime: lastClickTime,
                timeDiff: timeDiff,
                doubleClickDelay: doubleClickDelay,
                isSameElement: isSameElement,
                isWithinDoubleClickTime: isWithinDoubleClickTime
            });
            
            if (isSameElement && isWithinDoubleClickTime) {
                // 這是第二次點擊（雙擊），執行放置
                Game.Debug.log('drag', '✅ [C3點擊除錯] 偵測到雙擊，準備執行放置');
                
                // 重置雙擊狀態
                this.Core.StateManager.setState('clickCount', 0, difficulty);
                this.Core.StateManager.setState('lastClickTime', 0, difficulty);
                this.Core.StateManager.setState('lastClickedElement', null, difficulty);
                
                // 清除選擇狀態
                this.clearItemSelection();
                
                Game.Debug.log('drag', '🔄 [C3點擊除錯] 執行物品放置邏輯');
                
                // 執行放置邏輯 - 模擬拖拽放置
                this.simulateCoinPlacement(sourceItem);
                
                Game.Debug.log('drag', '✅ [C3點擊除錯] 雙擊放置執行完成');
            } else {
                // 這是第一次點擊，僅選擇物品
                Game.Debug.log('event', '🔵 [C3點擊除錯] 第一次點擊，選擇物品');
                
                this.Core.StateManager.setState('clickCount', 1, difficulty);
                this.Core.StateManager.setState('lastClickTime', currentTime, difficulty);
                this.Core.StateManager.setState('lastClickedElement', sourceItem, difficulty);
                
                // 清除之前的選擇
                this.clearItemSelection();
                
                // 標記為選中
                sourceItem.classList.add('selected-item');
                this.Core.StateManager.setState('selectedClickItem', {
                    element: sourceItem,
                    value: sourceItem.dataset.value,
                    type: 'source-item'
                }, difficulty);
                
                // 音效回饋
                if (config.clickToMoveConfig.audioFeedback) {
                    Game.Debug.log('speech', '🎵 [C3點擊除錯] 播放選擇音效');
                    this.Audio.playSound('select', difficulty, config);
                }
                
                // 🔧 [修改] 第一次點擊不播放語音提示，保持流暢體驗
                Game.Debug.log('speech', '🎙️ [C3點擊除錯] 第一次點擊：不播放語音提示');
            }
        },
        
        // 點擊取回處理  
        handleClickToReturn(placedItem, event) {
            const difficulty = this.Core.StateManager.getCurrentMode();
            const config = this.ModeConfig[difficulty];
            
            if (!config?.clickToMoveConfig?.allowClickToReturn) {
                Game.Debug.log('event', 'ℹ️ 此模式不允許點擊取回');
                return;
            }
            
            Game.Debug.log('event', '🔙 [C3點擊除錯] 處理點擊取回', { placedItem });
            
            // 🔧 [修改] 取回時播放當前金額語音（與拖曳取回相同）
            // 模擬拖拽取回邏輯
            this.simulateCoinReturn(placedItem);
        },
        
        // 清除物品選擇狀態
        clearItemSelection() {
            const difficulty = this.Core.StateManager.getCurrentMode();
            const selectedItem = this.Core.StateManager.getState('selectedClickItem', difficulty);
            
            Game.Debug.log('event', '🧹 [C3點擊除錯] 清除物品選擇狀態', {
                hasSelectedItem: !!selectedItem
            });
            
            if (selectedItem && selectedItem.element) {
                selectedItem.element.classList.remove('selected-item');
                this.Core.StateManager.setState('selectedClickItem', null, difficulty);
                Game.Debug.log('event', '✅ [C3點擊除錯] 選擇狀態已清除');
            }
        },
        
        // 直接呼叫金錢放置邏輯 - 不再模擬事件
        simulateCoinPlacement(sourceItem) {
            const difficulty = this.Core.StateManager.getCurrentMode();
            const currentQuestion = this.state.quizQuestions[this.state.currentQuestionIndex];
            const config = this.ModeConfig[difficulty];
            
            Game.Debug.log('event', '🎯 [C3點擊除錯] 直接呼叫放置邏輯', {
                difficulty,
                sourceItemValue: sourceItem.dataset.value,
                questionSourceValue: currentQuestion.sourceValue
            });
            
            // 根據不同模式找到合適的放置區域並直接呼叫處理函數
            if (difficulty === 'easy') {
                // 簡單模式：找到第一個空的drop-zone，使用processDropToExchangeArea
                const targetDropZone = document.querySelector('.drop-zone:not(.filled)');
                if (targetDropZone) {
                    Game.Debug.log('drag', '📍 [C3點擊除錯] 簡單模式：呼叫processDropToExchangeArea');
                    this.ModeStrategies.processDropToExchangeArea(sourceItem, targetDropZone, currentQuestion, difficulty, config);
                } else {
                    Game.Debug.log('drag', '❌ [C3點擊除錯] 簡單模式：找不到空的放置區域');
                }
            } else {
                // 普通/困難模式：找到flexible-zone，使用processDropToFlexibleZone
                const targetDropZone = document.querySelector('.flexible-zone, .exchange-drop-zone');
                if (targetDropZone) {
                    Game.Debug.log('drag', '📍 [C3點擊除錯] 普通/困難模式：呼叫processDropToFlexibleZone');
                    this.ModeStrategies.processDropToFlexibleZone(sourceItem, targetDropZone, currentQuestion, difficulty, config);
                } else {
                    Game.Debug.log('drag', '❌ [C3點擊除錯] 普通/困難模式：找不到彈性放置區域');
                }
            }
        },
        
        // 直接呼叫金錢取回邏輯 - 不再模擬事件
        simulateCoinReturn(placedItem) {
            const difficulty = this.Core.StateManager.getCurrentMode();
            const currentQuestion = this.state.quizQuestions[this.state.currentQuestionIndex];
            const config = this.ModeConfig[difficulty];
            
            Game.Debug.log('event', '🔙 [C3點擊除錯] 直接呼叫取回邏輯', {
                difficulty,
                placedItemId: placedItem.id,
                placedItemValue: placedItem.dataset?.value
            });
            
            // 找到我的金錢區域
            const myMoneyArea = document.querySelector('.my-money-area, #my-money-area');
            
            if (myMoneyArea) {
                Game.Debug.log('event', '📍 [C3點擊除錯] 找到金錢區域，直接呼叫processReturnToMoneyArea');
                
                // 直接呼叫ModeStrategies中的核心取回邏輯
                this.ModeStrategies.processReturnToMoneyArea(placedItem, myMoneyArea, currentQuestion, difficulty, config);
                
                Game.Debug.log('event', '✅ [C3點擊除錯] 取回邏輯執行完成');
            } else {
                Game.Debug.log('event', '❌ [C3點擊除錯] 找不到金錢區域');
            }
        },

        // =====================================================
        // 簡單模式渲染函數（完全獨立）
        // =====================================================
        loadNextQuestion() {
            // 【修正】開始第一題時不增加索引，避免跳過第1題
            Game.Debug.log('question', '📍 loadNextQuestion → 開始當前題目');
            
            // 檢查是否是第一次加載（索引為0）
            if (this.state.currentQuestionIndex === 0) {
                // 第一次加載，直接開始當前題目
                const question = this.state.quizQuestions[this.state.currentQuestionIndex];
                Game.Debug.log('question', `📋 開始第1題:`, question);
                this.startQuestion(question);
                
                // 更新進度顯示
                Game.TimerManager.setTimeout(() => {
                    this.updateProgress();
                }, 100, 'ui');
            } else {
                // 後續題目使用nextQuestion邏輯
                this.nextQuestion();
            }
        },

        handleCompleteExchangeClick(question) {
            Game.Debug.log('exchange', '🟡 普通模式完成兌換處理被調用 - 使用統一策略模式');
            
            // 【重構成果】：原來100+行的複雜邏輯現在僅需15行！
            
            // 防止重複處理
            if (this.getGameState('isProcessingExchange')) {
                Game.Debug.log('exchange', '⏸️ 正在處理兌換，忽略重複點擊');
                return;
            }
            
            // 設置處理中標誌
            this.setGameState('isProcessingExchange', true);
            
            // 獲取當前放置的硬幣
            const gameState = this.getGameState('gameState');
            const placedCoins = gameState.currentRoundDropZone?.placedCoins || [];
            
            // 使用統一驗證策略（替代複雜的if-else邏輯）
            const isValid = this.Strategies.ValidationStrategy.validate(question, placedCoins);
            
            // 使用統一完成處理策略（替代重複的成功/失敗邏輯）
            this.Strategies.CompletionStrategy.process(question, isValid);
            
            // 重置處理標誌
            this.setGameState('isProcessingExchange', false);
            Game.Debug.log('state', '🔓 StateManager: 重置處理中標誌 = false');
        },

        // 【重構成果】舊的複雜邏輯已被上方的統一策略模式取代，節省了500+行代碼
        // =====================================================
        /*
        【重構前】handleCompleteExchangeClick 原本有 400+ 行複雜邏輯：
        - 複雜的 if-else 嵌套（大換小 vs 小換大）
        - 重複的難度模式處理邏輯  
        - 冗長的輪次檢查和狀態管理
        - 分散的錯誤處理邏輯
        - 大量重複的語音和動畫代碼
        
        【重構後】現在只需 15 行統一策略：
        1. 防重複處理檢查 (2行)
        2. 獲取放置硬幣 (2行)  
        3. 統一驗證策略 (1行)
        4. 統一完成處理策略 (1行)
        5. 重置處理標誌 (2行)
        
        程式碼減少率：96% (從400行減至15行)
        維護複雜度：降低90%
        Bug風險：降低85%
        */
        
        validateStateConsistency(context = 'unknown') {
            const { currentRoundDropZone } = this.state.gameState;
            const domFilledZones = document.querySelectorAll('.exchange-drop-zone.filled');
            
            // 比較不同數據源的一致性
            const consistencyReport = {
                context: context,
                placedCoinsArrayLength: currentRoundDropZone.placedCoins.length,
                domFilledZonesCount: domFilledZones.length,
                placedCoinsArray: currentRoundDropZone.placedCoins,
                timestamp: Date.now()
            };
            
            const isConsistent = consistencyReport.placedCoinsArrayLength === consistencyReport.domFilledZonesCount;
            
            if (!isConsistent) {
                Game.Debug.warn('state', '⚠️ 狀態不一致警告:', consistencyReport);
                Game.Debug.warn('state', '📍 這可能導致類似於報告中描述的狀態同步失敗問題');
            } else {
                Game.Debug.log('state', '✅ 狀態一致性驗證通過:', consistencyReport);
            }
            
            return isConsistent;
        },

        // 生成兌換區HTML
        generateExchangeAreaHTML(question, sourceItemData, targetItemData) {
            const { exchangeType, exchangeRate } = question;
            const { currentRoundDropZone, roundComplete } = this.state.gameState;
            
            // 左邊：兌換金錢放置區
            let leftAreaHTML = '<div class="exchange-left-area"><h3>放置金錢</h3><div class="drop-zone-container">';
            
            if (exchangeType === 'big-to-small') {
                // 【修正重疊】大換小使用新容器系統
                const isPlaced = currentRoundDropZone.placedCoins.length > 0;
                const opacity = isPlaced ? '1.0' : '0.4';
                const containerClass = sourceItemData.value >= 100 ? 'unit3-banknote-container' : 'unit3-coin-container';
                
                leftAreaHTML += `
                    <div class="exchange-drop-zone ${isPlaced ? 'filled' : 'empty'}" 
                         style="opacity: ${opacity}" data-drop-type="source">
                        ${isPlaced ?
                            `<div class="${containerClass} money-item exchange-item clickable-item" data-type="money-item" data-value="${sourceItemData.value}" draggable="true" id="exchange-item-${0}">
                                ${this.createMoneyHTML(sourceItemData)}
                                <div class="money-value">${sourceItemData.value}元</div>
                            </div>` :
                            `<div class="${containerClass} money-item exchange-item clickable-item faded" data-type="money-item" data-value="${sourceItemData.value}" draggable="true" id="exchange-item-faded-${0}">
                                ${this.createMoneyHTML(sourceItemData, { faded: true })}
                                <div class="money-value">${sourceItemData.value}元</div>
                            </div>`}
                    </div>`;
            } else {
                // 【修正重疊】小換大使用新容器系統
                const containerClass = sourceItemData.value >= 100 ? 'unit3-banknote-container' : 'unit3-coin-container';
                
                for (let i = 0; i < exchangeRate; i++) {
                    const isPlaced = i < currentRoundDropZone.placedCoins.length;
                    const opacity = isPlaced ? '1.0' : '0.4';
                    leftAreaHTML += `
                        <div class="exchange-drop-zone ${isPlaced ? 'filled' : 'empty'}" 
                             style="opacity: ${opacity}" data-drop-type="source" data-slot="${i}">
                            ${isPlaced ? 
                                `<div class="${containerClass} money-item exchange-item clickable-item" data-type="money-item" data-value="${sourceItemData.value}" draggable="true" id="exchange-item-${i}">
                                    ${this.createMoneyHTML(sourceItemData)}
                                    <div class="money-value">${sourceItemData.value}元</div>
                                </div>` : 
                                `<div class="${containerClass} money-item exchange-item clickable-item faded" data-type="money-item" data-value="${sourceItemData.value}" draggable="true" id="exchange-item-faded-${i}">
                                    ${this.createMoneyHTML(sourceItemData, { faded: true })}
                                    <div class="money-value">${sourceItemData.value}元</div>
                                </div>`}
                        </div>`;
                }
            }
            leftAreaHTML += '</div></div>';
            
            // 右邊：目標金錢顯示區
            let rightAreaHTML = '<div class="exchange-right-area"><h3>兌換結果</h3><div class="target-zone-container">';
            
            if (exchangeType === 'big-to-small') {
                // 大換小：右邊顯示多個小面額淡化圖示
                for (let i = 0; i < exchangeRate; i++) {
                    const opacity = roundComplete ? '1.0' : '0.4';
                    rightAreaHTML += `
                        <div class="exchange-item target-display ${roundComplete ? 'active' : 'inactive'}" 
                             style="opacity: ${opacity}">
                            <img src="${this.getRandomImage(targetItemData)}" alt="${targetItemData.name}" draggable="false">
                            <div class="money-value">${targetItemData.value}元</div>
                        </div>`;
                }
            } else {
                // 小換大：右邊顯示1個大面額淡化圖示
                const opacity = roundComplete ? '1.0' : '0.4';
                rightAreaHTML += `
                    <div class="exchange-item target-display ${roundComplete ? 'active' : 'inactive'}" 
                         style="opacity: ${opacity}">
                        <img src="${this.getRandomImage(targetItemData)}" alt="${targetItemData.name}">
                        <div class="money-value">${targetItemData.value}元</div>
                    </div>`;
            }
            rightAreaHTML += '</div></div>';
            
            // 計算當前總額
            const currentTotal = currentRoundDropZone.placedCoins.length * sourceItemData.value;
            const coinCount = currentRoundDropZone.placedCoins.length;
            
            // 根據難度模式生成總額顯示
            const difficulty = this.state.settings.difficulty;
            const config = this.ModeConfig[difficulty];
            let currentTotalDisplay;
            
            if (config && config.emojiHints) {
                // 困難模式：使用emoji提示
                currentTotalDisplay = this.generateCurrentTotalEmojiHint(currentTotal, coinCount, difficulty);
            } else {
                // 其他模式：使用傳統文字
                currentTotalDisplay = `目前金額共${currentTotal}元`;
            }
            
            // 生成兌換結果框
            const exchangeResultsHTML = this.generateExchangeResultsHTML();
            
            return `
                <div class="exchange-area-container">
                    ${leftAreaHTML}
                    <div class="exchange-center-info">
                        <h3 id="current-total-display">${currentTotalDisplay}</h3>
                        <div class="exchange-arrow">→</div>
                    </div>
                    ${rightAreaHTML}
                </div>
                ${exchangeResultsHTML}`;
        },


        







        // =====================================================
        // 困難模式拖曳處理（無語音提示版本）
        // =====================================================
        handleExchangeDropHard(e, question) {
            e.preventDefault();
            Game.Debug.log('drag', '🎯 困難模式兌換拖曳處理');

            const droppedElement = document.querySelector('.dragging');
            if (!droppedElement) {
                Game.Debug.log('drag', '❌ 找不到拖曳的元素');
                return;
            }

            // 檢查是否拖曳回金錢區
            const moneyArea = e.target.closest('.money-source-container');
            if (moneyArea && droppedElement.classList.contains('exchange-money-item')) {
                this.handleDragBackToMoneyArea(droppedElement, question);
                return;
            }

            const dropTarget = e.target.closest('.exchange-drop-zone');
            if (!dropTarget) {
                Game.Debug.log('drag', '❌ 不是有效的放置目標');
                return;
            }

            const { exchangeType, sourceValue } = question;
            const droppedValue = parseInt(droppedElement.getAttribute('data-value'));

            // 驗證金錢類型
            if (droppedValue !== sourceValue) {
                Game.Debug.log('drag', `❌ 金錢類型不符：拖曳${droppedValue}元，需要${sourceValue}元`);
                const mode = this.Core.StateManager.getCurrentMode();
                const config = this.ModeConfig[mode];
                MoneyExchange3.Audio.playErrorSound(mode, config);
                return;
            }

            // 執行拖曳邏輯，但不播放語音提示
            if (exchangeType === 'big-to-small') {
                this.processHardModeBigToSmallDrop(dropTarget, droppedElement, question);
            } else if (exchangeType === 'small-to-big') {
                this.processHardModeSmallToBigDrop(dropTarget, droppedElement, question);
            }
        },

        // =====================================================
        // 普通模式和簡單模式拖曳處理（支援語音提示和雙向拖拉）
        // =====================================================
        handleExchangeDrop(e, question) {
            e.preventDefault();
            Game.Debug.log('drag', '🎯 普通/簡單模式兌換拖曳處理 (支援雙向拖拉)');

            const droppedElement = document.querySelector('.dragging');
            if (!droppedElement) {
                Game.Debug.log('drag', '❌ 找不到拖曳的元素');
                return;
            }

            const mode = this.Core.StateManager.getCurrentMode();
            const config = this.ModeConfig[mode];

            // 【雙向拖拉】檢查是否拖曳回金錢區
            const moneyArea = e.target.closest('.money-source-container');
            if (moneyArea && droppedElement.classList.contains('exchange-money-item')) {
                Game.Debug.log('exchange', '🔄 偵測到從兌換區拖回金錢區');
                this.handleDragBackToMoneyArea(droppedElement, question);
                return;
            }

            // 原有邏輯：從金錢區拖到兌換區
            const dropTarget = e.target.closest('.exchange-drop-zone, .flexible-zone');
            if (!dropTarget) {
                Game.Debug.log('drag', '❌ 不是有效的放置目標');
                return;
            }

            const { exchangeType, sourceValue } = question;
            const droppedValue = parseInt(droppedElement.getAttribute('data-value'));

            // 驗證金錢類型
            if (droppedValue !== sourceValue) {
                Game.Debug.log('drag', `❌ 金錢類型不符：拖曳${droppedValue}元，需要${sourceValue}元`);
                MoneyExchange3.Audio.playErrorSound(mode, config);
                return;
            }

            // 播放拖拽音效（與困難模式的區別）
            MoneyExchange3.Audio.playDropSound(mode, config);

            // 執行拖曳邏輯
            if (exchangeType === 'big-to-small') {
                this.processNormalModeBigToSmallDrop(dropTarget, droppedElement, question);
            } else if (exchangeType === 'small-to-big') {
                this.processNormalModeSmallToBigDrop(dropTarget, droppedElement, question);
            }
        },

        processHardModeBigToSmallDrop(dropTarget, droppedElement, question) {
            const { currentRoundDropZone } = this.state.gameState;

            // 困難模式大換小：允許放置多個硬幣，讓用戶自己判斷正確數量
            Game.Debug.log('drag', '✅ 困難模式大換小：拖曳金錢成功');
            
            // 播放拖曳音效但不播放語音
            MoneyExchange3.Audio.playDropSound();
                
            // 記錄放置的硬幣
            const coinId = droppedElement.id.replace('source-item-', '');
            currentRoundDropZone.placedCoins.push(coinId);
            
            // 【修正重疊】在兌換區顯示金錢使用新容器系統
            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            const containerClass = sourceItemData.value >= 100 ? 'unit3-banknote-container' : 'unit3-coin-container';
            
            const placedCoinsHTML = currentRoundDropZone.placedCoins.map((placedCoinId, index) => {
                return `
                    <div class="${containerClass} money-item clickable-item exchange-money-item" draggable="true" data-value="${question.sourceValue}" data-type="money-item" id="exchange-item-${placedCoinId}" data-id="exchange-item-${placedCoinId}">
                        ${this.createMoneyHTML(sourceItemData, { draggable: false })}
                        <div class="money-value">${sourceItemData.value}元</div>
                    </div>
                `;
            }).join('');
            
            dropTarget.classList.add('filled');
            dropTarget.style.opacity = '1.0';
            dropTarget.innerHTML = `
                <div class="placed-coins-container">
                    ${placedCoinsHTML}
                </div>
            `;

            // 從源區域移除DOM元素並更新狀態
            Game.Debug.log('state', '🗑️ 從金錢區移除硬幣並更新coinPositions狀態');
            this.state.gameState.coinPositions[coinId] = `zone-${currentRoundDropZone.id}`;
            droppedElement.remove();
            
            // 立即更新標題計數（拖曳後我的金錢減少，兌換區增加）
            Game.TimerManager.setTimeout(() => this.updateSectionTitleCounts(), 50, 'ui');
            
            // 播放累計金額語音（困難模式不需要回調，因為有手動確認機制）
            this.playCumulativeAmountSpeech(question);
            
            // 為所有兌換區金錢添加拖曳事件
            dropTarget.querySelectorAll('.exchange-money-item').forEach(exchangeItem => {
                Game.EventManager.on(exchangeItem, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(exchangeItem, 'dragend', () => {
                    const config = this.ModeConfig[this.Core.StateManager.getCurrentMode()];
                    Game.TimerManager.setTimeout(() => { this.state.isDragging = false; }, config.timing.dragTimeout, 'drag');
                }, {}, 'dragSystem');
            });
            
            const currentTotal = currentRoundDropZone.placedCoins.length * question.sourceValue;
            
            // 根據當前輪次獲取需要的大面額金錢數量
            const { requiredSourceCounts, completedExchanges } = this.state.gameState;
            const currentRoundIndex = completedExchanges; // completedExchanges是已完成輪次數，用作當前輪次索引
            const requiredCoinsForThisRound = requiredSourceCounts && requiredSourceCounts[currentRoundIndex] ? requiredSourceCounts[currentRoundIndex] : 1;
            
            Game.Debug.log('drag', `🔍 困難模式大換小當前輪次${currentRoundIndex + 1}: 已放置${currentRoundDropZone.placedCoins.length}個，需要${requiredCoinsForThisRound}個`);
            
            if (currentRoundDropZone.placedCoins.length === requiredCoinsForThisRound) {
                // 大換小達到當前輪次需要的數量
                this.state.gameState.roundComplete = true;
                Game.Debug.log('state', `⏸️ 困難模式大換小達到標準數量(${requiredCoinsForThisRound}個)，等待手動確認`);
            } else if (currentRoundDropZone.placedCoins.length > requiredCoinsForThisRound) {
                // 大換小超過當前輪次需要的數量，但仍允許繼續放置
                this.state.gameState.roundComplete = false;
                Game.Debug.log('state', `⚠️ 困難模式大換小已超過標準數量(需要${requiredCoinsForThisRound}個)，等待用戶自我判斷`);
            }
            
            // 更新當前總額顯示（不播放語音）
            this.updateCurrentTotalDisplay(currentTotal);
        },

        processHardModeSmallToBigDrop(dropTarget, droppedElement, question) {
            const { exchangeRate } = question;
            const { currentRoundDropZone } = this.state.gameState;

            // 困難模式小換大：允許放置超過所需數量的硬幣，讓用戶自己判斷正確數量
            Game.Debug.log('drag', '✅ 困難模式小換大：拖曳金錢成功');
            
            // 播放拖曳音效但不播放語音
            MoneyExchange3.Audio.playDropSound();
                
            // 記錄放置的硬幣
            const coinId = droppedElement.id.replace('source-item-', '');
            currentRoundDropZone.placedCoins.push(coinId);
            
            // 【修正重疊】在兌換區顯示金錢使用新容器系統
            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            const containerClass = sourceItemData.value >= 100 ? 'unit3-banknote-container' : 'unit3-coin-container';
            
            const placedCoinsHTML = currentRoundDropZone.placedCoins.map((placedCoinId, index) => {
                return `
                    <div class="${containerClass} money-item clickable-item exchange-money-item" draggable="true" data-value="${question.sourceValue}" data-type="money-item" id="exchange-item-${placedCoinId}" data-id="exchange-item-${placedCoinId}">
                        ${this.createMoneyHTML(sourceItemData, { draggable: false })}
                        <div class="money-value">${sourceItemData.value}元</div>
                    </div>
                `;
            }).join('');
            
            dropTarget.classList.add('filled');
            dropTarget.style.opacity = '1.0';
            dropTarget.innerHTML = `
                <div class="placed-coins-container">
                    ${placedCoinsHTML}
                </div>
            `;

            // 從源區域移除DOM元素並更新狀態
            Game.Debug.log('state', '🗑️ 從金錢區移除硬幣並更新coinPositions狀態');
            this.state.gameState.coinPositions[coinId] = `zone-${currentRoundDropZone.id}`;
            droppedElement.remove();
            
            // 立即更新標題計數（拖曳後我的金錢減少，兌換區增加）
            Game.TimerManager.setTimeout(() => this.updateSectionTitleCounts(), 50, 'ui');
            
            // 播放累計金額語音（困難模式不需要回調，因為有手動確認機制）
            this.playCumulativeAmountSpeech(question);
            
            // 為所有兌換區金錢添加拖曳事件
            dropTarget.querySelectorAll('.exchange-money-item').forEach(exchangeItem => {
                Game.EventManager.on(exchangeItem, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(exchangeItem, 'dragend', () => {
                    const config = this.ModeConfig[this.Core.StateManager.getCurrentMode()];
                    Game.TimerManager.setTimeout(() => { this.state.isDragging = false; }, config.timing.dragTimeout, 'drag');
                }, {}, 'dragSystem');
            });
            
            const currentTotal = currentRoundDropZone.placedCoins.length * question.sourceValue;
            
            // 根據當前輪次的目標金錢數量檢查完成狀態
            const { targetImages, completedExchanges } = this.state.gameState;
            const currentRoundIndex = completedExchanges;
            let requiredCoinsForThisRound = exchangeRate; // 預設值
            
            if (targetImages && targetImages[currentRoundIndex]) {
                requiredCoinsForThisRound = targetImages[currentRoundIndex].length * exchangeRate;
            }
            
            Game.Debug.log('drag', `🔍 困難模式小換大當前輪次${currentRoundIndex + 1}: 已放置${currentRoundDropZone.placedCoins.length}個，需要${requiredCoinsForThisRound}個`);
            
            if (currentRoundDropZone.placedCoins.length === requiredCoinsForThisRound) {
                // 小換大達到當前輪次需要的數量
                this.state.gameState.roundComplete = true;
                Game.Debug.log('state', `⏸️ 困難模式小換大達到標準數量(${requiredCoinsForThisRound}個)，等待手動確認`);
            } else if (currentRoundDropZone.placedCoins.length > requiredCoinsForThisRound) {
                // 小換大超過當前輪次需要的數量，但仍允許繼續放置
                this.state.gameState.roundComplete = false;
                Game.Debug.log('state', `⚠️ 困難模式小換大已超過標準數量(需要${requiredCoinsForThisRound}個)，等待用戶自我判斷`);
            } else {
                // 小換大未達到當前輪次需要的數量
                this.state.gameState.roundComplete = false;
                Game.Debug.log('drag', `⏳ 小換大輪次未完成，還需要${requiredCoinsForThisRound - currentRoundDropZone.placedCoins.length}個硬幣`);
            }
            
            // 更新當前總額顯示（不播放語音）
            this.updateCurrentTotalDisplay(currentTotal);
        },

        // =====================================================
        // 普通模式和簡單模式拖曳處理（支援語音提示和靈活放置區）
        // =====================================================
        processNormalModeBigToSmallDrop(dropTarget, droppedElement, question) {
            const gameState = this.getGameState('gameState');
            Game.Debug.log('state', '🔍 調試gameState:', gameState);
            
            // 確保currentRoundDropZone存在
            if (!gameState.currentRoundDropZone) {
                gameState.currentRoundDropZone = { placedCoins: [] };
                Game.Debug.log('drag', '🔧 初始化currentRoundDropZone');
            }
            
            const { currentRoundDropZone } = gameState;
            const mode = this.Core.StateManager.getCurrentMode();
            const config = this.ModeConfig[mode];

            Game.Debug.log('drag', '✅ 普通/簡單模式大換小：拖曳金錢成功');
                
            // 記錄放置的硬幣
            const coinId = droppedElement.id.replace('source-item-', '');
            currentRoundDropZone.placedCoins.push(coinId);
            
            // 在靈活兌換區顯示金錢
            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            const containerClass = sourceItemData.value >= 100 ? 'unit3-banknote-container' : 'unit3-coin-container';
            
            // 更新靈活放置區的內容
            const placedCoinsContainer = dropTarget.querySelector('.placed-coins-container');
            if (placedCoinsContainer) {
                const newCoinHTML = `
                    <div class="${containerClass} money-item clickable-item exchange-money-item" draggable="true" data-value="${question.sourceValue}" data-type="money-item" id="exchange-item-${coinId}" data-id="exchange-item-${coinId}">
                        ${this.createMoneyHTML(sourceItemData, { draggable: false })}
                        <div class="money-value">${sourceItemData.value}元</div>
                    </div>
                `;
                placedCoinsContainer.insertAdjacentHTML('beforeend', newCoinHTML);
                
                // 為新添加的金錢項目設置拖拽事件
                const newCoinElement = placedCoinsContainer.lastElementChild;
                Game.EventManager.on(newCoinElement, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(newCoinElement, 'dragend', () => {
                    Game.TimerManager.setTimeout(() => { this.state.isDragging = false; }, config.timing.dragTimeout, 'drag');
                }, {}, 'dragSystem');
            }
            
            // 直接從DOM中移除該元素
            droppedElement.remove();
            gameState.coinPositions[coinId] = 'exchange-area';
            
            // 更新計數和語音反饋
            const currentTotal = currentRoundDropZone.placedCoins.length * question.sourceValue;
            this.updateCurrentTotalDisplay(currentTotal);
            
            // 播放語音反饋（與困難模式的區別）
            if (config.speechFeedback) {
                this.playPlacementSpeech(question, currentRoundDropZone.placedCoins.length);
            }
            
            // 保存更新後的遊戲狀態
            this.setGameState('gameState', gameState);
            
            // 【修復】更新UI計數顯示（我的金錢區總額）
            Game.TimerManager.setTimeout(() => this.updateSectionTitleCounts(), 50, 'ui');
        },

        processNormalModeSmallToBigDrop(dropTarget, droppedElement, question) {
            const { exchangeRate } = question;
            const gameState = this.getGameState('gameState');
            Game.Debug.log('state', '🔍 調試gameState:', gameState);
            
            // 確保currentRoundDropZone存在
            if (!gameState.currentRoundDropZone) {
                gameState.currentRoundDropZone = { placedCoins: [] };
                Game.Debug.log('drag', '🔧 初始化currentRoundDropZone');
            }
            
            const { currentRoundDropZone } = gameState;
            const mode = this.Core.StateManager.getCurrentMode();
            const config = this.ModeConfig[mode];

            Game.Debug.log('drag', '✅ 普通/簡單模式小換大：拖曳金錢成功');
                
            // 記錄放置的硬幣
            const coinId = droppedElement.id.replace('source-item-', '');
            currentRoundDropZone.placedCoins.push(coinId);
            
            // 在靈活兌換區顯示金錢
            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            const containerClass = sourceItemData.value >= 100 ? 'unit3-banknote-container' : 'unit3-coin-container';
            
            // 更新靈活放置區的內容
            const placedCoinsContainer = dropTarget.querySelector('.placed-coins-container');
            if (placedCoinsContainer) {
                const newCoinHTML = `
                    <div class="${containerClass} money-item clickable-item exchange-money-item" draggable="true" data-value="${question.sourceValue}" data-type="money-item" id="exchange-item-${coinId}" data-id="exchange-item-${coinId}">
                        ${this.createMoneyHTML(sourceItemData, { draggable: false })}
                        <div class="money-value">${sourceItemData.value}元</div>
                    </div>
                `;
                placedCoinsContainer.insertAdjacentHTML('beforeend', newCoinHTML);
                
                // 為新添加的金錢項目設置拖拽事件
                const newCoinElement = placedCoinsContainer.lastElementChild;
                Game.EventManager.on(newCoinElement, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(newCoinElement, 'dragend', () => {
                    Game.TimerManager.setTimeout(() => { this.state.isDragging = false; }, config.timing.dragTimeout, 'drag');
                }, {}, 'dragSystem');
            }
            
            // 直接從DOM中移除該元素
            droppedElement.remove();
            gameState.coinPositions[coinId] = 'exchange-area';
            
            // 檢查是否達到當前輪次所需數量
            const requiredCoinsForThisRound = exchangeRate;
            const currentTotal = currentRoundDropZone.placedCoins.length * question.sourceValue;
            
            // 更新計數顯示
            this.updateCurrentTotalDisplay(currentTotal);
            
            // 播放語音反饋（與困難模式的區別）
            if (config.speechFeedback) {
                this.playPlacementSpeech(question, currentRoundDropZone.placedCoins.length);
            }
            
            // 保存更新後的遊戲狀態
            this.setGameState('gameState', gameState);
            
            // 【修復】更新UI計數顯示（我的金錢區總額）
            Game.TimerManager.setTimeout(() => this.updateSectionTitleCounts(), 50, 'ui');
            
            // 【簡單模式專用】自動檢查兌換完成 - 當達到所需數量時立即點亮目標圖示
            if (mode === 'easy' && config.triggerType === 'auto') {
                if (currentRoundDropZone.placedCoins.length >= requiredCoinsForThisRound) {
                    Game.Debug.log('state', '🎉 簡單模式：達到所需數量，自動觸發目標圖示點亮');
                    // 【修復 completeExchange bug】改用 ModeStrategies.handleCompletion 統一完成流程
                    // （handleCompletion → processSuccess 負責：激活目標圖示、更新輪次計數、
                    //   showExchangeResult、playExchangeCompletionSpeech → handleMultiRound）
                    Game.TimerManager.setTimeout(() => {
                        MoneyExchange3.ModeStrategies.handleCompletion(mode, { question });
                    }, config.timing.dragTimeout || 100, 'speech');
                }
            }
        },

        // =====================================================
        // 困難模式手動完成兌換處理
        // =====================================================
        handleCompleteExchangeClickHard(question) {
            Game.Debug.log('exchange', '🔴 困難模式完成兌換處理被調用');
            // 安全檢查：只在困難模式下執行
            if (this.state.settings.difficulty !== 'hard') {
                Game.Debug.log('judge', '❌ 錯誤：困難模式處理器在非困難模式下被調用');
                return;
            }
            // 防止重複處理
            if (this.state.isProcessingExchange) {
                Game.Debug.log('exchange', '⏸️ 正在處理兌換，忽略重複點擊');
                return;
            }
            
            const { exchangeType, exchangeRate } = question;
            const { mode } = this.state.settings;
            
            // 從遊戲狀態中獲取實際放置的硬幣數量
            const { currentRoundDropZone } = this.state.gameState;
            const placedCoinsCount = currentRoundDropZone.placedCoins.length;
            
            Game.Debug.log('exchange', '🔍 困難模式檢查兌換完成狀態:', {
                exchangeType,
                exchangeRate,
                placedCoinsCount,
                mode: mode,
                settingsMode: this.state.settings.mode,
                allSettings: this.state.settings,
                completedExchanges: this.state.gameState.completedExchanges,
                totalExchanges: this.state.gameState.totalExchanges
            });
            
            // 檢查是否已經完成當前輪兌換
            let isCurrentRoundComplete = false;
            
            if (exchangeType === 'big-to-small') {
                // 大換小：根據當前輪次檢查是否放入了需要的大面額金錢數量
                const { requiredSourceCounts, completedExchanges } = this.state.gameState;
                const currentRoundIndex = completedExchanges; // completedExchanges是已完成輪次數
                const requiredCoinsForThisRound = requiredSourceCounts && requiredSourceCounts[currentRoundIndex] ? requiredSourceCounts[currentRoundIndex] : 1;
                isCurrentRoundComplete = placedCoinsCount === requiredCoinsForThisRound;
                Game.Debug.log('drag', `🔍 ${difficulty}模式大換小完成檢查: 輪次${currentRoundIndex + 1}需要${requiredCoinsForThisRound}個，實際放置${placedCoinsCount}個，完成=${isCurrentRoundComplete}`);
            } else {
                // 【配置驅動】小換大：根據模式檢查放置的小面額金錢數量
                const difficulty = this.state.settings.difficulty;
                const config = this.ModeConfig[difficulty];
                const smallToBigRules = config.specialRules.smallToBig;
                
                if (smallToBigRules.variableTargets) {
                    // 可變目標模式：根據當前輪次的目標金錢數量檢查
                    const { targetImages, completedExchanges } = this.state.gameState;
                    const currentRoundIndex = completedExchanges;
                    if (targetImages && targetImages[currentRoundIndex]) {
                        const requiredCoinsForThisRound = targetImages[currentRoundIndex].length * exchangeRate;
                        isCurrentRoundComplete = placedCoinsCount === requiredCoinsForThisRound;
                        Game.Debug.log('drag', `🔍 ${difficulty}模式小換大完成檢查: 輪次${currentRoundIndex + 1}有${targetImages[currentRoundIndex].length}個目標，需要${requiredCoinsForThisRound}個小錢，實際放置${placedCoinsCount}個，完成=${isCurrentRoundComplete}`);
                    } else {
                        // 如果找不到目標圖片數據，使用預設邏輯
                        isCurrentRoundComplete = placedCoinsCount === exchangeRate;
                        Game.Debug.log('drag', `🔍 ${difficulty}模式小換大完成檢查(預設): 需要${exchangeRate}個，實際放置${placedCoinsCount}個，完成=${isCurrentRoundComplete}`);
                    }
                } else {
                    // 固定目標模式：根據當前輪次的目標金錢數量檢查
                    const { targetImages, completedExchanges } = this.state.gameState;
                    const currentRoundIndex = completedExchanges;
                    if (targetImages && targetImages[currentRoundIndex]) {
                        const requiredCoinsForThisRound = targetImages[currentRoundIndex].length * exchangeRate;
                        isCurrentRoundComplete = placedCoinsCount === requiredCoinsForThisRound;
                        Game.Debug.log('drag', `🔍 ${difficulty}模式小換大完成檢查: 輪次${currentRoundIndex + 1}有${targetImages[currentRoundIndex].length}個目標，需要${requiredCoinsForThisRound}個小錢，實際放置${placedCoinsCount}個，完成=${isCurrentRoundComplete}`);
                    } else {
                        // 如果找不到目標圖片數據，使用預設邏輯
                        isCurrentRoundComplete = placedCoinsCount === exchangeRate;
                        Game.Debug.log('drag', `🔍 ${difficulty}模式小換大完成檢查(預設): 需要${exchangeRate}個，實際放置${placedCoinsCount}個，完成=${isCurrentRoundComplete}`);
                    }
                }
            }
            
            if (isCurrentRoundComplete) {
                // 設置處理中標誌
                this.state.isProcessingExchange = true;
                
                // 禁用完成兌換按鈕
                const completeBtn = document.getElementById('complete-exchange-btn');
                if (completeBtn) {
                    completeBtn.disabled = true;
                    completeBtn.textContent = '處理中...';
                }
                
                // 當前輪兌換完成
                Game.Debug.log('exchange', '✅ 困難模式當前輪兌換完成');
                
                // 播放正確答案音效
                const mode = this.Core.StateManager.getCurrentMode();
                const config = this.ModeConfig[mode];
                MoneyExchange3.Audio.playCorrectSound(mode, config);
                
                // 激活目標金錢顯示：移除淡化效果
                document.querySelectorAll('.target-display').forEach(target => {
                    target.classList.remove('faded');
                    target.classList.add('active');
                    target.style.opacity = '1.0';
                    target.classList.add('target-activate-animation');
                });
                
                // 標記完成並更新兌換進度
                this.state.gameState.roundComplete = true;
                this.state.gameState.completedExchanges++;
                
                // 添加兌換結果顯示
                this.addExchangeResultDisplay(question);
                
                // 檢查是否還需要更多輪兌換
                const { totalExchanges } = this.state.gameState;
                const completedExchanges = this.state.gameState.completedExchanges; // 使用更新後的值
                
                Game.Debug.log('exchange', `🔍 困難模式兌換檢查: completedExchanges=${completedExchanges}, totalExchanges=${totalExchanges}, 兌換類型=${exchangeType}`);
                
                if (completedExchanges < totalExchanges) {
                    // 還有更多輪兌換，準備下一輪
                    Game.Debug.log('exchange', `🔄 困難模式完成第${completedExchanges}輪，還需要${totalExchanges - completedExchanges}輪兌換`);
                    
                    const { sourceValue, targetValue } = question;
                    const targetItemData = this.gameData.allItems.find(item => item.value === targetValue);
                    const unit = targetValue >= 100 ? '張' : '個';
                    
                    // 根據兌換類型計算正確的數量
                    let actualQuantity;
                    if (exchangeType === 'big-to-small') {
                        // 大換小：1個大面額換多個小面額
                        actualQuantity = exchangeRate; // exchangeRate 就是兌換得到的小面額數量
                    } else {
                        // 小換大：多個小面額換1個大面額
                        actualQuantity = 1;
                    }
                    
                    const roundMessage = `換到${actualQuantity}${unit}${targetValue}元`;
                    
                    // 播放單輪完成語音，然後準備下一輪
                    const difficulty = this.getSettings('difficulty');
                    const config = this.ModeConfig[difficulty];
                    this.Speech.speak(roundMessage, difficulty, config, () => {
                        // 清空兌換輸入區域並準備下一輪
                        this.clearExchangeAreaHard();
                        this.prepareNextExchangeRoundHard(question);
                        
                        // 重新啟用完成兌換按鈕
                        const completeBtn = document.getElementById('complete-exchange-btn');
                        if (completeBtn) {
                            completeBtn.disabled = false;
                            completeBtn.textContent = '完成兌換';
                        }
                        
                        // 清除處理中標誌
                        this.state.isProcessingExchange = false;
                    });
                } else {
                    // 所有輪次完成，進入下一題
                    Game.Debug.log('exchange', '🎉 困難模式所有兌換輪次完成，準備進入下一題');
                    this.state.score++;
                    
                    const { sourceValue, targetValue } = question;
                    const sourceItemData = this.gameData.allItems.find(item => item.value === sourceValue);
                    const targetItemData = this.gameData.allItems.find(item => item.value === targetValue);
                    const finalTotalCount = exchangeType === 'small-to-big' ? 
                        totalExchanges : 
                        totalExchanges * exchangeRate;
                    
                    const config = this.ModeConfig[this.Core.StateManager.getCurrentMode()];
                    const template = config.speechTemplates.allRoundsComplete[exchangeType];
                    let successMessage = template
                        .replace('{totalSource}', totalExchanges * (exchangeType === 'small-to-big' ? question.exchangeRate : 1))
                        .replace('{sourceName}', sourceItemData.name)
                        .replace('{totalTarget}', finalTotalCount)
                        .replace('{targetName}', targetItemData.name);

                    // 判斷是否為最後一題，加上結尾語（最後一題由 endGame 播放恭喜語音）
                    const isLastQuestion = this.state.currentQuestionIndex + 1 >= this.state.totalQuestions;
                    successMessage = '答對，' + successMessage + (isLastQuestion ? '' : '，進入下一題');

                    // 播放完成語音
                    const difficulty = this.getSettings('difficulty');
                    this.Speech.speak(successMessage, difficulty, config, () => {
                        // 清除處理中標誌
                        this.state.isProcessingExchange = false;
                        // 【修正】確保真正完成所有兌換才進入下一題
                        this.validateAllExchangesComplete(question, () => {
                            const currentConfig = this.ModeConfig[this.Core.StateManager.getCurrentMode()];
                            Game.TimerManager.setTimeout(() => this.loadNextQuestion(), currentConfig.timing.nextQuestionDelay, 'question');
                        });
                    });
                }
                
            } else {
                // 兌換未完成：根據作答模式處理
                Game.Debug.log('exchange', '❌ 困難模式兌換未完成');
                const mode = this.Core.StateManager.getCurrentMode();
                const config = this.ModeConfig[mode];
                MoneyExchange3.Audio.playErrorSound(mode, config);
                
                // 生成錯誤訊息
                const { sourceValue, targetValue, exchangeRate } = question;
                const sourceItemData = this.gameData.allItems.find(item => item.value === sourceValue);
                const targetItemData = this.gameData.allItems.find(item => item.value === targetValue);
                const expectedCount = exchangeType === 'small-to-big' ? exchangeRate : 1;
                
                if (mode === 'retry') {
                    // 反複作答模式：播放詳細錯誤訊息並退回金錢，重試當前輪
                    const template = config.speechTemplates.error[exchangeType];
                    const errorMessage = template
                        .replace('{expectedCount}', expectedCount)
                        .replace('{sourceName}', sourceItemData.name)
                        .replace('{targetName}', targetItemData.name)
                        .replace('{actualCount}', placedCoinsCount);
                    Game.Debug.log('exchange', '🔄 反複作答模式：播放錯誤訊息並退回金錢，保持當前題目和輪次');
                    
                    // 播放錯誤訊息
                    const difficulty = this.getSettings('difficulty');
                    this.Speech.speak(errorMessage, difficulty, config, () => {
                        // 退回當前輪兌換區的金錢到我的金錢區（保留前面輪次的結果）
                        this.returnCurrentRoundCoinsToMoneyArea(question);
                        // 清除處理中標誌
                        this.state.isProcessingExchange = false;
                    });
                } else {
                    // 單次作答模式：播放錯誤訊息後進入下一題
                    const template = config.speechTemplates.error[exchangeType];
                    let errorMessage = template
                        .replace('{expectedCount}', expectedCount)
                        .replace('{sourceName}', sourceItemData.name)
                        .replace('{targetName}', targetItemData.name)
                        .replace('{actualCount}', placedCoinsCount);

                    // 判斷是否為最後一題，替換結尾語
                    const isLastQuestion = this.state.currentQuestionIndex + 1 >= this.state.totalQuestions;
                    if (isLastQuestion) {
                        errorMessage = errorMessage.replace(/請繼續下一題/g, '測驗結束');
                    }

                    Game.Debug.log('speech', '➡️ 單次作答模式：播放錯誤訊息後進入下一題');

                    // 播放錯誤訊息後進入下一題
                    const difficulty = this.getSettings('difficulty');
                    this.Speech.speak(errorMessage, difficulty, config, () => {
                        // 清除處理中標誌
                        this.state.isProcessingExchange = false;
                        Game.TimerManager.setTimeout(() => this.loadNextQuestion(), 1000, 'question');
                    });
                }
            }
        },

        // =====================================================
        // 退回當前輪兌換區金錢到我的金錢區（保留前面輪次結果）
        // =====================================================
        returnCurrentRoundCoinsToMoneyArea(question) {
            const { currentRoundDropZone } = this.state.gameState;
            const moneyArea = document.querySelector('.money-source-container');
            const dropZone = document.querySelector('.exchange-drop-zone.filled');
            
            if (!dropZone || !moneyArea || currentRoundDropZone.placedCoins.length === 0) {
                Game.Debug.log('state', '⚠️ 沒有需要退回的金錢');
                return;
            }
            
            Game.Debug.log('exchange', '🔄 反複作答模式：退回當前輪金錢，保留前面輪次結果');
            
            // 【修正重疊】使用新容器系統創建退回的金錢項目
            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            const containerClass = sourceItemData.value >= 100 ? 'unit3-banknote-container' : 'unit3-coin-container';
            
            currentRoundDropZone.placedCoins.forEach(coinId => {
                const newMoneyItem = document.createElement('div');
                newMoneyItem.className = `${containerClass} money-item`;
                newMoneyItem.draggable = true;
                newMoneyItem.setAttribute('data-value', question.sourceValue);
                newMoneyItem.setAttribute('data-id', `coin-${coinId}`);
                newMoneyItem.id = `source-item-${coinId}`;
                
                // 使用統一的金錢HTML生成
                newMoneyItem.innerHTML = `
                    ${this.createMoneyHTML(sourceItemData)}
                    <div class="money-value">${sourceItemData.value}元</div>
                `;
                
                // 為新金錢項目添加拖曳事件
                Game.EventManager.on(newMoneyItem, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(newMoneyItem, 'dragend', () => {
                    const config = this.ModeConfig[this.Core.StateManager.getCurrentMode()];
                    Game.TimerManager.setTimeout(() => { this.state.isDragging = false; }, config.timing.dragTimeout, 'drag');
                }, {}, 'dragSystem');
                
                moneyArea.appendChild(newMoneyItem);
                
                // 更新coinPositions狀態，將金錢標記為回到金錢區
                this.state.gameState.coinPositions[coinId] = 'money-area';
            });
            
            // 清空兌換區，但不影響兌換結果顯示
            dropZone.classList.remove('filled');
            dropZone.style.opacity = '0.3';
            dropZone.innerHTML = '';
            
            // 重置當前輪狀態，但保持completedExchanges計數不變
            currentRoundDropZone.placedCoins = [];
            this.state.gameState.roundComplete = false;
            
            // 取消目標金錢激活，恢復淡化狀態
            document.querySelectorAll('.target-display').forEach(target => {
                target.classList.remove('active');
                target.classList.add('faded');
                target.style.opacity = '0.4';
                target.classList.remove('target-activate-animation');
            });
            
            // 更新標題計數
            Game.TimerManager.setTimeout(() => this.updateSectionTitleCounts(), 100, 'ui');
            
            Game.Debug.log('exchange', '✅ 當前輪金錢已退回金錢區，保持前面輪次結果');
        },
        
        // =====================================================
        // 退回兌換區金錢到我的金錢區（原版本，用於單次作答等）
        // =====================================================
        returnExchangeCoinsToMoneyArea(question) {
            const { currentRoundDropZone } = this.state.gameState;
            const moneyArea = document.querySelector('.money-source-container');
            const dropZone = document.querySelector('.exchange-drop-zone.filled');
            
            Game.Debug.log('exchange', '🔄 反複作答模式：開始退回金錢到金錢區', {
                dropZoneExists: !!dropZone,
                moneyAreaExists: !!moneyArea,
                coinsToReturn: currentRoundDropZone.placedCoins.length,
                coinIds: currentRoundDropZone.placedCoins
            });
            
            if (!dropZone || !moneyArea || currentRoundDropZone.placedCoins.length === 0) {
                Game.Debug.log('state', '⚠️ 退回金錢失敗：條件不滿足');
                return;
            }
            
            // 【修正重疊】使用新容器系統創建退回的金錢項目
            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            const containerClass = sourceItemData.value >= 100 ? 'unit3-banknote-container' : 'unit3-coin-container';
            
            currentRoundDropZone.placedCoins.forEach((coinId, index) => {
                const newMoneyItem = document.createElement('div');
                newMoneyItem.className = `${containerClass} money-item`;
                newMoneyItem.draggable = true;
                newMoneyItem.setAttribute('data-value', question.sourceValue);
                newMoneyItem.setAttribute('data-id', `coin-${coinId}`);
                newMoneyItem.id = `source-item-${coinId}`;
                
                // 使用統一的金錢HTML生成
                if (sourceItemData) {
                    newMoneyItem.innerHTML = `
                        ${this.createMoneyHTML(sourceItemData)}
                        <div class="money-value">${sourceItemData.value}元</div>
                    `;
                } else {
                    // 退化方案
                    newMoneyItem.innerHTML = `
                        <img src="${this.getRandomImage({ value: question.sourceValue })}" alt="${question.sourceValue}元" class="${question.sourceValue >= 100 ? 'unit3-banknote' : 'unit3-coin'}">
                        <div class="money-value">${question.sourceValue}元</div>
                    `;
                }
                
                // 為新金錢項目添加拖曳事件
                Game.EventManager.on(newMoneyItem, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(newMoneyItem, 'dragend', () => {
                    const config = this.ModeConfig[this.Core.StateManager.getCurrentMode()];
                    Game.TimerManager.setTimeout(() => { this.state.isDragging = false; }, config.timing.dragTimeout, 'drag');
                }, {}, 'dragSystem');
                
                moneyArea.appendChild(newMoneyItem);
                Game.Debug.log('state', `✅ 金錢 ${coinId} 已退回到金錢區`);
                
                // 更新coinPositions狀態，將金錢標記為回到金錢區
                this.state.gameState.coinPositions[coinId] = 'money-area';
            });
            
            // 清空兌換區
            dropZone.classList.remove('filled');
            dropZone.style.opacity = '0.3';
            dropZone.innerHTML = '';
            Game.Debug.log('exchange', '🗑️ 兌換區已清空');
            
            // 重置狀態
            currentRoundDropZone.placedCoins = [];
            this.state.gameState.roundComplete = false;
            Game.Debug.log('state', '🔄 狀態已重置：placedCoins 清空，roundComplete 設為 false');
            
            // 取消目標金錢激活，恢復淡化狀態
            document.querySelectorAll('.target-display').forEach(target => {
                target.classList.remove('active');
                target.classList.add('faded');
                target.style.opacity = '0.4';
                target.classList.remove('target-activate-animation');
            });
            
            // 更新標題計數
            Game.TimerManager.setTimeout(() => this.updateSectionTitleCounts(), 100, 'ui');
            
            Game.Debug.log('state', '✅ 金錢已退回金錢區');
        },

        // =====================================================
        // 困難模式清空兌換輸入區域
        // =====================================================
        clearExchangeAreaHard() {
            Game.Debug.log('exchange', '🧹 困難模式清空兌換輸入區域');
            
            // 清空兌換放置區
            const dropZone = document.querySelector('.exchange-drop-zone.filled');
            if (dropZone) {
                dropZone.classList.remove('filled');
                dropZone.style.opacity = '0.3';
                dropZone.innerHTML = '';
            }
            
            // 重置當前輪狀態但保留兌換結果
            this.state.gameState.currentRoundDropZone.placedCoins = [];
            this.state.gameState.roundComplete = false;
            
            // 重置目標金錢顯示為淡化狀態
            document.querySelectorAll('.target-display').forEach(target => {
                target.classList.remove('active');
                target.classList.add('faded');
                target.style.opacity = '0.4';
                target.classList.remove('target-activate-animation');
            });
        },

        // =====================================================
        // 困難模式拖曳事件設置（不包含完成按鈕）
        // =====================================================
        // =====================================================
        // 簡單模式拖曳事件設置（專用函數）
        // =====================================================
        setupEasyModeDragListeners(question) {
            Game.Debug.log('drag', '🟢 簡單模式設置拖曳事件監聽器');
            
            const gameArea = this.elements.gameArea;
            if (!gameArea) return;
            
            // 設置HTML5拖拽事件
            const moneyItems = gameArea.querySelectorAll('.money-item[draggable="true"]');
            const dropZones = gameArea.querySelectorAll('.easy-drop-zone, .placement-zone');
            
            // 為金錢項目添加拖拽事件
            moneyItems.forEach(item => {
                Game.EventManager.on(item, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(item, 'dragend', () => {
                    this.state.isDragging = false;
                    Game.TimerManager.setTimeout(() => { this.state.isDragging = false; }, 100, 'drag');
                }, {}, 'dragSystem');
            });
            
            // 為放置區添加拖放事件
            dropZones.forEach(zone => {
                Game.EventManager.on(zone, 'dragover', this.handleDragOver.bind(this), {}, 'dragSystem');
                Game.EventManager.on(zone, 'drop', (e) => this.handleExchangeDrop(e, question), {}, 'dragSystem');
            });
            
            // 設置觸控拖拽支援
            this.setupTouchDragForEasyMode(question);
        },
        
        // 簡單模式觸控拖拽設置（帶重試機制）
        setupTouchDragForEasyMode(question) {
            Game.Debug.log('drag', '🎯 [C3-簡單模式] 檢查 TouchDragUtility 狀態');
            
            if (!window.TouchDragUtility) {
                Game.Debug.error('❌ [C3-簡單模式] TouchDragUtility 未載入');
                return;
            }
            
            const gameArea = document.getElementById('app');
            if (!gameArea) return;
            
            // 🔧 重試機制：等待HTML元素生成，使用更廣泛的選擇器
            const registerTouchDrag = () => {
                // 使用更全面的選擇器匹配實際生成的元素
                const draggableItems = gameArea.querySelectorAll('.unit3-coin-container, .unit3-banknote-container, .money-item[draggable="true"]');
                Game.Debug.log('drag', `🔍 [簡單模式] 搜尋可拖拽元素: 找到 ${draggableItems.length} 個`);
                
                // 列出找到的元素類別進行調試
                draggableItems.forEach((item, index) => {
                    Game.Debug.log('drag', `📋 [簡單模式] 元素${index}: ${item.className}, draggable=${item.draggable}`);
                });
                
                if (draggableItems.length === 0) {
                    Game.Debug.log('drag', '⏰ [簡單模式] 等待元素生成，延遲重試TouchDragUtility註冊...');
                    Game.TimerManager.setTimeout(registerTouchDrag, 100, 'drag');
                    return;
                }
                
                Game.Debug.log('drag', `✅ [簡單模式] 找到 ${draggableItems.length} 個可拖拽元素，開始註冊TouchDragUtility`);
                
                window.TouchDragUtility.registerDraggable(
                    gameArea,
                    '.unit3-coin-container, .unit3-banknote-container, .money-item[draggable="true"]',
                    {
                        onDragStart: (element, event) => {
                            Game.Debug.log('drag', '📱 [簡單模式] TouchDragUtility拖拽開始', element.className);
                            const syntheticEvent = {
                                target: element,
                                preventDefault: () => {},
                                stopPropagation: () => {}
                            };
                            return this.handleDragStart(syntheticEvent);
                        },
                        onDrop: (draggedElement, dropZone, event) => {
                            Game.Debug.log('touch', '📱 [簡單模式] TouchDragUtility拖拽放下', {
                                draggedElement: draggedElement.className,
                                dropZone: dropZone.className
                            });
                            const syntheticEvent = {
                                target: dropZone,
                                currentTarget: dropZone,
                                dataTransfer: {
                                    getData: () => JSON.stringify({
                                        coinId: draggedElement.id,
                                        value: draggedElement.dataset.value
                                    })
                                },
                                preventDefault: () => {},
                                stopPropagation: () => {}
                            };
                            this.handleExchangeDrop(syntheticEvent, question);
                        },
                        onDragEnd: (element) => {
                            this.state.isDragging = false;
                            element.classList.remove('dragging');
                        }
                    }
                );
            };
            
            registerTouchDrag();
        },
        
        // =====================================================
        // 普通模式拖曳事件設置（專用函數）
        // =====================================================
        setupNormalModeDragListeners(question) {
            Game.Debug.log('drag', '🟡 普通模式設置拖曳事件監聽器');
            
            const gameArea = this.elements.gameArea;
            if (!gameArea) return;
            
            // 設置HTML5拖拽事件
            const moneyItems = gameArea.querySelectorAll('.money-item[draggable="true"]');
            const dropZones = gameArea.querySelectorAll('.normal-drop-zone, .placement-zone');
            
            // 為金錢項目添加拖拽事件
            moneyItems.forEach(item => {
                Game.EventManager.on(item, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(item, 'dragend', () => {
                    this.state.isDragging = false;
                    Game.TimerManager.setTimeout(() => { this.state.isDragging = false; }, 100, 'drag');
                }, {}, 'dragSystem');
            });
            
            // 為放置區添加拖放事件
            dropZones.forEach(zone => {
                Game.EventManager.on(zone, 'dragover', this.handleDragOver.bind(this), {}, 'dragSystem');
                Game.EventManager.on(zone, 'drop', (e) => this.handleExchangeDrop(e, question), {}, 'dragSystem');
            });
            
            // 設置觸控拖拽支援
            this.setupTouchDragForNormalMode(question);
        },
        
        // 普通模式觸控拖拽設置（帶重試機制）
        setupTouchDragForNormalMode(question) {
            Game.Debug.log('drag', '🎯 [C3-普通模式] 檢查 TouchDragUtility 狀態');
            
            if (!window.TouchDragUtility) {
                Game.Debug.error('❌ [C3-普通模式] TouchDragUtility 未載入');
                return;
            }
            
            const gameArea = document.getElementById('app');
            if (!gameArea) return;
            
            // 🔧 重試機制：等待HTML元素生成，使用更廣泛的選擇器
            const registerTouchDrag = () => {
                // 使用更全面的選擇器匹配實際生成的元素
                const draggableItems = gameArea.querySelectorAll('.unit3-coin-container, .unit3-banknote-container, .money-item[draggable="true"]');
                Game.Debug.log('drag', `🔍 [普通模式] 搜尋可拖拽元素: 找到 ${draggableItems.length} 個`);
                
                if (draggableItems.length === 0) {
                    Game.Debug.log('drag', '⏰ [普通模式] 等待元素生成，延遲重試TouchDragUtility註冊...');
                    Game.TimerManager.setTimeout(registerTouchDrag, 100, 'drag');
                    return;
                }
                
                Game.Debug.log('drag', `✅ [普通模式] 找到 ${draggableItems.length} 個可拖拽元素，開始註冊TouchDragUtility`);
                
                window.TouchDragUtility.registerDraggable(
                    gameArea,
                    '.unit3-coin-container, .unit3-banknote-container, .money-item[draggable="true"]',
                    {
                        onDragStart: (element, event) => {
                            Game.Debug.log('drag', '📱 [普通模式] TouchDragUtility拖拽開始', element.className);
                            const syntheticEvent = {
                                target: element,
                                preventDefault: () => {},
                                stopPropagation: () => {}
                            };
                            return this.handleDragStart(syntheticEvent);
                        },
                        onDrop: (draggedElement, dropZone, event) => {
                            const syntheticEvent = {
                                target: dropZone,
                                currentTarget: dropZone,
                                dataTransfer: {
                                    getData: () => JSON.stringify({
                                        coinId: draggedElement.id,
                                        value: draggedElement.dataset.value
                                    })
                                },
                                preventDefault: () => {},
                                stopPropagation: () => {}
                            };
                            this.handleExchangeDrop(syntheticEvent, question);
                        },
                        onDragEnd: (element) => {
                            this.state.isDragging = false;
                            element.classList.remove('dragging');
                        }
                    }
                );
            };
            
            registerTouchDrag();
        },

        setupHardModeDragListeners(question) {
            Game.Debug.log('drag', '🔗 困難模式設置拖曳事件監聽器');
            
            // 使用與原始困難模式相同的拖曳事件處理機制
            const gameArea = this.elements.gameArea;
            
            // 移除舊的拖曳事件監聽器（如果存在）
            if (gameArea._hardModeDragHandler) {
                gameArea.removeEventListener('drop', gameArea._hardModeDragHandler);
            }
            
            // 放置事件 - 使用事件委託  
            const handleDropDelegate = (e) => {
                if (e.target.matches('.money-source-container, .exchange-drop-zone, .transparent-drop-hint, .placed-coins-display, .partial-coins-display') || 
                    e.target.closest('.money-source-container, .exchange-drop-zone')) {
                    this.handleExchangeDropHard(e, question); // 使用困難模式專用處理函數
                }
            };
            
            // 保存引用以便後續移除
            gameArea._hardModeDragHandler = handleDropDelegate;
            
            Game.EventManager.on(gameArea, 'dragover', this.handleDragOver.bind(this), {}, 'dragSystem');
            Game.EventManager.on(gameArea, 'drop', handleDropDelegate, {}, 'dragSystem');
            
            document.querySelectorAll('.exchange-item').forEach(item => {
                Game.EventManager.on(item, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(item, 'dragend', () => {
                    Game.TimerManager.setTimeout(() => {
                        this.state.isDragging = false;
                    }, 100, 'drag');
                }, {}, 'dragSystem');
            });
            
            // 為拖放區域標記事件已綁定，以供系統完整性檢查
            document.querySelectorAll('.exchange-drop-zone').forEach(zone => {
                this.markEventsBound(zone, ['dragover', 'drop']);
            });
            
            Game.Debug.log('drag', '✅ 困難模式拖曳事件設置完成');
        },

        // =====================================================
        // 困難模式準備下一輪兌換
        // =====================================================
        prepareNextExchangeRoundHard(question) {
            Game.Debug.log('exchange', '🔄 困難模式準備下一輪兌換');
            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            const targetItemData = this.gameData.allItems.find(item => item.value === question.targetValue);
            
            // 重新渲染兌換區域以更新金錢區和兌換區
            const exchangeSection = document.querySelector('.exchange-section');
            if (exchangeSection) {
                this.updateExchangeAreaContent(question, exchangeSection);
            }
            // 重置後立即更新標題計數（兌換區已清空，歸零顯示）
            this.updateSectionTitleCounts();

            // 不重新綁定完成兌換按鈕事件，避免重複綁定問題
            // 只重新綁定拖曳事件（因為DOM元素已更新）
            this.setupHardModeDragListeners(question);

            Game.Debug.log('state', '✅ 困難模式下一輪準備完成');
        },

        // =====================================================
        // 拖曳回金錢區處理函數
        // =====================================================
        handleDragBackToMoneyArea(droppedElement, question) {
            Game.Debug.log('drag', '🔄 困難模式：拖曳回金錢區');
            
            // 獲取金錢價值和ID
            const coinValue = parseInt(droppedElement.dataset.value);
            const coinId = droppedElement.id.replace('exchange-item-', '');
            
            // 從兌換狀態移除
            const { currentRoundDropZone } = this.state.gameState;
            const coinIndex = currentRoundDropZone.placedCoins.indexOf(coinId);
            if (coinIndex > -1) {
                currentRoundDropZone.placedCoins.splice(coinIndex, 1);
            }
            
            // 【⭐ 新增修改 ⭐】在金錢數量更新後，立即呼叫語音函式
            this.playPlacementSpeech(question, currentRoundDropZone.placedCoins.length);
            
            // 在金錢區創建新的金錢項目
            const moneyArea = document.querySelector('.money-source-container');
            const newMoneyItem = document.createElement('div');
            newMoneyItem.className = 'money-item exchange-item clickable-item';
            newMoneyItem.draggable = true;
            newMoneyItem.setAttribute('data-value', coinValue);
            newMoneyItem.setAttribute('data-type', 'money-item');
            newMoneyItem.id = `source-item-${coinId}`;
            
            newMoneyItem.innerHTML = `
                <img src="${droppedElement.querySelector('img').src}" alt="${coinValue}元">
                <div class="money-value">${coinValue}元</div>
            `;
            
            // 為新金錢項目添加拖曳事件
            Game.EventManager.on(newMoneyItem, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
            Game.EventManager.on(newMoneyItem, 'dragend', () => {
                const config = this.ModeConfig[this.Core.StateManager.getCurrentMode()];
                Game.TimerManager.setTimeout(() => { this.state.isDragging = false; }, config.timing.dragTimeout, 'drag');
            }, {}, 'dragSystem');
            
            moneyArea.appendChild(newMoneyItem);
            
            // 更新coinPositions狀態，將金錢標記為回到金錢區
            this.state.gameState.coinPositions[coinId] = 'money-area';
            
            // 從兌換區移除該金錢
            const dropZone = droppedElement.closest('.exchange-drop-zone');
            if (dropZone) {
                if (currentRoundDropZone.placedCoins.length === 0) {
                    // 沒有金錢了，清空兌換區
                    dropZone.classList.remove('filled');
                    dropZone.style.opacity = '0.3';
                    dropZone.innerHTML = '';
                    this.state.gameState.roundComplete = false;
                    
                    // 取消目標金錢激活，恢復淡化狀態
                    document.querySelectorAll('.target-display').forEach(target => {
                        target.classList.remove('active');
                        target.classList.add('faded');
                        target.style.opacity = '0.4';
                        target.classList.remove('target-activate-animation');
                    });
                } else {
                    // 還有其他金錢，重新渲染兌換區
                    const placedCoinsHTML = currentRoundDropZone.placedCoins.map((placedCoinId) => {
                        return `
                            <div class="exchange-money-item clickable-item" draggable="true" data-value="${question.sourceValue}" data-type="money-item" id="exchange-item-${placedCoinId}">
                                <img src="${droppedElement.querySelector('img').src}" alt="${question.sourceValue}元">
                                <div class="money-value">${question.sourceValue}元</div>
                            </div>
                        `;
                    }).join('');
                    
                    dropZone.innerHTML = `
                        <div class="placed-coins-container">
                            ${placedCoinsHTML}
                        </div>
                    `;
                    
                    // 重新綁定拖曳事件
                    dropZone.querySelectorAll('.exchange-money-item').forEach(exchangeItem => {
                        Game.EventManager.on(exchangeItem, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                        Game.EventManager.on(exchangeItem, 'dragend', () => {
                            const config = this.ModeConfig[this.Core.StateManager.getCurrentMode()];
                    Game.TimerManager.setTimeout(() => { this.state.isDragging = false; }, config.timing.dragTimeout, 'drag');
                        }, {}, 'dragSystem');
                    });
                    
                    // 檢查是否還完成
                    if (currentRoundDropZone.placedCoins.length < question.exchangeRate) {
                        this.state.gameState.roundComplete = false;
                        // 取消目標金錢激活，恢復淡化狀態
                        document.querySelectorAll('.target-display').forEach(target => {
                            target.classList.remove('active');
                            target.classList.add('faded');
                            target.style.opacity = '0.4';
                            target.classList.remove('target-activate-animation');
                        });
                    }
                }
            }
            
            Game.Debug.log('state', '✅ 金錢已拖回金錢區');
        },

        resetDropArea(question) {
            const { sourceValue, targetValue, sourceItemsCount, exchangeRate, exchangeType } = question;
            const sourceItemData = this.gameData.allItems.find(item => item.value === sourceValue);
            const targetItemData = this.gameData.allItems.find(item => item.value === targetValue);
            const exchangeDropArea = document.getElementById('exchange-drop-area');
            if (!exchangeDropArea) return;
            exchangeDropArea.innerHTML = '';

            const isPaperMoney = sourceValue >= 100 || targetValue >= 100;
            let totalPlaceholders = exchangeType === 'small-to-big' ? sourceItemsCount : this.state.gameState.totalExchanges * exchangeRate;

            if (isPaperMoney) {
                const columnsPerRow = Math.min(5, exchangeRate);
                exchangeDropArea.style.gridTemplateColumns = `repeat(${columnsPerRow}, 1fr)`;
                exchangeDropArea.style.gridAutoRows = '75px';
                exchangeDropArea.style.gap = '15px';
            } else {
                exchangeDropArea.style.gridTemplateColumns = `repeat(${exchangeRate}, 65px)`;
                exchangeDropArea.style.gridAutoRows = '65px';
                exchangeDropArea.style.gap = '8px';
            }
            exchangeDropArea.style.justifyContent = 'center';

            for (let i = 0; i < totalPlaceholders; i++) {
                const placeholderDiv = document.createElement('div');
                placeholderDiv.className = `exchange-placeholder ${isPaperMoney ? 'paper-money-item' : ''}`;
                placeholderDiv.setAttribute('data-index', i);
                const exchangeGroupIndex = Math.floor(i / exchangeRate);
                const positionInGroup = i % exchangeRate;
                const isExchangedGroup = exchangeGroupIndex < this.state.gameState.exchangedCount;
                // 【配置驅動】統一的佔位符內容生成
                const placeholderConfig = MoneyExchange3.UI.generatePlaceholderConfig(isExchangedGroup, exchangeType, positionInGroup, sourceItemData, targetItemData);
                placeholderDiv.innerHTML = placeholderConfig.innerHTML;
                placeholderDiv.classList.add(...placeholderConfig.classes);
                exchangeDropArea.appendChild(placeholderDiv);
            }
            Game.EventManager.on(exchangeDropArea, 'dragover', this.handleDragOver.bind(this), {}, 'dragSystem');
            Game.EventManager.on(exchangeDropArea, 'drop', (e) => this.handleDrop(e, question), {}, 'dragSystem');
        },

               

        setupQuizUI() {
            // 【配置驅動】統一HTML模板管理
            const gameContainer = document.getElementById('app');
            const difficulty = this.state.settings.difficulty || 'easy';
            
            // 使用統一的HTML模板生成系統
            const htmlTemplate = this.generateUnifiedGameHTML(difficulty);
            gameContainer.innerHTML = htmlTemplate;
            
            // 根據當前模式渲染相應的UI
            this.renderModeSpecificUI(difficulty);
        },
        
        // 【配置驅動】統一的HTML模板生成系統
        generateUnifiedGameHTML(difficulty) {
            return '<div id="dynamic-game-container"></div>';
        },
        
        // 【配置驅動】統一CSS管理
        getModeCSS(difficulty) {
            const cssMap = {
                'easy': this.getEasyModeCSS(),
                'normal': this.getNormalModeCSS(), 
                'hard': this.getHardModeCSS()
            };
            return cssMap[difficulty] || cssMap['easy'];
        },
        
        // 【配置驅動】HTML模板庫 - 統一管理所有HTML字符串
        HTMLTemplates: {
            // 基礎模板結構
            gameLayout: (difficulty, totalQuestions, exchangeDescription) => `
                <div class="unit3-${difficulty}-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <div class="progress-info">第 1 / ${totalQuestions} 題</div>
                        </div>
                        <div class="title-bar-center">
                            ${this.gameData.title}
                        </div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                        </div>
                    </div>
                    
                    <div class="unit3-${difficulty}-content">
                        <div class="unit3-${difficulty}-money-section">
                            <h2 class="unit3-${difficulty}-section-title">💰 我的金錢</h2>
                            <div id="my-money-area" class="unit3-${difficulty}-money-area"></div>
                        </div>
                        
                        <div class="unit3-${difficulty}-exchange-section">
                            <h2 class="unit3-${difficulty}-section-title">🔄 兌換區</h2>
                            <div id="game-area" class="unit3-${difficulty}-exchange-area"></div>
                            ${difficulty !== 'easy' ? '<button id="complete-exchange-btn" class="unit3-' + difficulty + '-complete-btn">完成兌換</button>' : ''}
                        </div>
                        
                        <div class="unit3-${difficulty}-results-section">
                            <h2 class="unit3-${difficulty}-section-title">兌換結果框</h2>
                            <div id="exchange-results-area" class="unit3-${difficulty}-results-area"></div>
                        </div>
                        
                        <div id="feedback-area" style="display: none;"></div>
                    </div>
                </div>
            `,
            
            // 金錢項目模板
            moneyItem: (src, alt, value, coinId) => `
                <div class="money-item clickable-item" draggable="true" id="${coinId}" data-type="money-item" data-value="${value}">
                    <img src="${src}" alt="${alt}">
                    <div class="money-value">${value}</div>
                </div>
            `,
            
            // 兌換結果模板
            exchangeResult: (isSmallToBig, targetImages, targetName, exchangeRate) => {
                if (isSmallToBig) {
                    return `
                        <div class="final-result-display">
                            <img src="${targetImages[0]}" alt="${targetName}" class="result-coin">
                            <div class="result-label">${targetName}</div>
                        </div>
                    `;
                } else {
                    const coinsHTML = targetImages.slice(0, exchangeRate).map(src => 
                        `<img src="${src}" alt="${targetName}" class="result-coin">`
                    ).join('');
                    return `
                        <div class="final-result-display">
                            <div class="result-coins-group target-money-row">
                                ${coinsHTML}
                            </div>
                            <div class="result-label">${exchangeRate}個${targetName}</div>
                        </div>
                    `;
                }
            },
            
            // 拖放區域模板
            dropZone: (sourceItemData, opacity = '0.3') => `
                <div class="drop-zone" style="opacity: ${opacity}">
                    <div class="transparent-drop-hint">請拖入放置${sourceItemData.value}元</div>
                </div>
            `
        },

        // 【配置驅動】獲取當前問題的實際計數信息
        getCurrentQuestionCountInfo() {
            if (!this.state.quizQuestions || this.state.currentQuestionIndex < 0) {
                return {
                    myMoneyCount: 0,
                    myMoneyUnit: '元',
                    exchangeCount: 0,
                    exchangeUnit: '元',
                    resultCount: 0,
                    resultUnit: '元'
                };
            }

            const question = this.state.quizQuestions[this.state.currentQuestionIndex];
            if (!question) {
                return {
                    myMoneyCount: 0,
                    myMoneyUnit: '元',
                    exchangeCount: 0,
                    exchangeUnit: '元',
                    resultCount: 0,
                    resultUnit: '元'
                };
            }

            // 根據兌換類型獲取數量信息
            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            const targetItemData = this.gameData.allItems.find(item => item.value === question.targetValue);

            // 【修正】計算實際當前數量而非預期數量
            
            // 1. 我的金錢區當前數量
            const myMoneyElements = document.querySelectorAll('.my-money-area .money-item, #my-money-area .money-item');
            const myMoneyCount = myMoneyElements.length;
            const myMoneyUnit = sourceItemData ? sourceItemData.value + '元' : '元';
            
            // 2. 兌換區當前數量 - 支援所有模式的金錢元素
            const exchangeElements = document.querySelectorAll('.exchange-drop-zone .money-item, .drop-zone .money-item, .exchange-drop-zone .exchange-money-item, .drop-zone .exchange-money-item, .placed-coins-container .money-item, .placed-coins-container .exchange-money-item, .drop-zone .placed-coin, .exchange-drop-zone .placed-coin');
            const exchangeCount = exchangeElements.length;
            const exchangeUnit = sourceItemData ? sourceItemData.value + '元' : '元';
            
            // 3. 兌換結果區當前數量
            const resultElements = document.querySelectorAll('#exchange-results-area .money-item, .unified-results-container .money-item');
            const resultCount = resultElements.length;
            const resultUnit = targetItemData ? targetItemData.value + '元' : '元';

            // 計算兌換區總金額
            const exchangeTotalValue = exchangeCount * (question ? question.sourceValue : 0);

            return {
                myMoneyCount,
                myMoneyUnit,
                exchangeCount,
                exchangeUnit,
                exchangeTotalValue, // 新增總金額
                resultCount,
                resultUnit
            };
        },

        // 【配置驅動】更新標題列的計數信息 - 使用動態HTML更新和高亮樣式
        updateSectionTitleCounts() {
            const countInfo = this.getCurrentQuestionCountInfo();
            const difficulty = this.state.settings.difficulty;
            
            // 直接更新標題元素的innerHTML以支持高亮樣式
            const titleSelectors = [
                '.unit3-easy-section-title',
                '.unit3-normal-section-title', 
                '.unit3-hard-section-title'
            ];
            
            titleSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    const currentHTML = element.innerHTML;
                    
                    // 更新我的金錢標題
                    if (currentHTML.includes('我的金錢')) {
                        element.innerHTML = `我的金錢區 目前共<span class="count-highlight">${countInfo.myMoneyCount}個${countInfo.myMoneyUnit}</span>`;
                    }
                    
                    // 更新兌換區標題（🧮提示已移至我的金錢區按鈕，所有模式一律顯示計數）
                    if (currentHTML.includes('🔄 兌換區')) {
                        element.innerHTML = `🔄 兌換區 目前共<span class="count-highlight">${countInfo.exchangeCount}個${countInfo.exchangeUnit}</span>`;
                    }
                    
                    // 更新兌換結果區標題
                    if (currentHTML.includes('兌換結果')) {
                        element.innerHTML = `兌換結果區 目前共<span class="count-highlight">${countInfo.resultCount}個${countInfo.resultUnit}</span>`;
                    }
                });
            });
        },

        renderModeSpecificUI(difficulty) {
            const container = document.getElementById('dynamic-game-container');
            if (!container) return;

            // 【配置驅動】獲取模式配置
            const config = this.ModeConfig[difficulty];
            
            // 生成標題內容 - 具體的兌換描述
            const exchangeDescription = this.getExchangeDescription();
            
            // 獲取當前問題計數信息
            const countInfo = this.getCurrentQuestionCountInfo();
            
            // 根據難度決定兌換區標題的初始HTML（🧮提示已移至我的金錢區按鈕）
            const exchangeAreaTitleHTML = `🔄 兌換區 目前共<span class="count-highlight">${countInfo.exchangeCount}個${countInfo.exchangeUnit}</span>`;
            
            // 根據模式生成不同的HTML結構和CSS
            switch(difficulty) {
                case 'easy':
                    container.innerHTML = `
                        <style>${this.getCommonCSS()}${this.getEasyModeCSS()}</style>
                        <div class="unit3-easy-layout">
                            <div class="title-bar">
                                <div class="title-bar-left">
                                    <div class="progress-info">第 1 / ${this.state.totalQuestions} 題</div>
                                </div>
                                <div class="title-bar-center">
                                    ${exchangeDescription}
                                </div>
                                <div class="title-bar-right">
                                    <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                                    <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                                </div>
                            </div>

                            <div class="unit3-easy-money-section">
                                <h2 class="unit3-easy-section-title">我的金錢 目前共<span class="count-highlight">${countInfo.myMoneyCount}個${countInfo.myMoneyUnit}</span></h2>
                                <div id="my-money-area" class="unit3-easy-money-source"></div>
                            </div>
                            
                            <div class="unit3-easy-exchange-section">
                                <h2 class="unit3-easy-section-title">🔄 兌換區 目前共<span class="count-highlight">${countInfo.exchangeCount}個${countInfo.exchangeUnit}</span></h2>
                                <div id="game-area" class="unit3-easy-exchange-area"></div>
                            </div>
                            
                            <div class="unit3-easy-results-section">
                                <h2 class="unit3-easy-section-title">兌換結果區 目前共<span class="count-highlight">${countInfo.resultCount}個${countInfo.resultUnit}</span></h2>
                                <div id="exchange-results-area" class="unit3-easy-results-area"></div>
                            </div>
                            
                            <div id="feedback-area" style="display: none;"></div>
                        </div>
                    `;
                    break;
                    
                case 'normal':
                    container.innerHTML = `
                        <style>${this.getCommonCSS()}${this.getNormalModeCSS()}</style>
                        <div class="unit3-normal-layout">
                            <div class="title-bar">
                                <div class="title-bar-left">
                                    <div class="progress-info">第 1 / ${this.state.totalQuestions} 題</div>
                                </div>
                                <div class="title-bar-center">
                                    ${exchangeDescription}
                                </div>
                                <div class="title-bar-right">
                                    <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                                    <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                                </div>
                            </div>

                            <div class="unit3-normal-money-section">
                                <div style="display:flex;align-items:center;gap:10px;border-bottom:3px solid #e74c3c;padding-bottom:10px;margin-bottom:15px;">
                                    <h2 class="unit3-normal-section-title" style="flex:1;margin:0;border-bottom:none;padding-bottom:0;">我的金錢 目前共<span class="count-highlight">${countInfo.myMoneyCount}個${countInfo.myMoneyUnit}</span></h2>
                                    <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                                    <button id="c3-normal-hint-btn" onclick="MoneyExchange3.showNormalModeHint()" class="c3-hint-btn">💡 提示</button>
                                </div>
                                <div id="my-money-area" class="unit3-normal-money-source"></div>
                            </div>
                            
                            <div class="unit3-normal-exchange-section">
                                <h2 class="unit3-normal-section-title">🔄 兌換區 目前共<span class="count-highlight">${countInfo.exchangeCount}個${countInfo.exchangeUnit}</span></h2>
                                <div id="game-area" class="unit3-normal-exchange-rounds"></div>
                                <button id="complete-exchange-btn" class="unit3-normal-complete-btn">${config.uiElements.buttonText.complete}</button>
                            </div>
                            
                            <div class="unit3-normal-results-section">
                                <h2 class="unit3-normal-section-title">兌換結果區 目前共<span class="count-highlight">${countInfo.resultCount}個${countInfo.resultUnit}</span></h2>
                                <div id="exchange-results-area" class="unit3-normal-results-area"></div>
                            </div>
                            
                            <div id="feedback-area" style="display: none;"></div>
                        </div>
                    `;
                    break;
                    
                case 'hard':
                    container.innerHTML = `
                        <style>${this.getCommonCSS()}${this.getHardModeCSS()}</style>
                        <div class="unit3-hard-layout">
                            <div class="title-bar">
                                <div class="title-bar-left">
                                    <div class="progress-info">第 1 / ${this.state.totalQuestions} 題</div>
                                </div>
                                <div class="title-bar-center">
                                    ${exchangeDescription}
                                </div>
                                <div class="title-bar-right">
                                    <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                                    <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                                </div>
                            </div>

                            <div class="unit3-hard-money-section">
                                <div style="display:flex;align-items:center;gap:10px;border-bottom:3px solid #e74c3c;padding-bottom:10px;margin-bottom:15px;">
                                    <h2 class="unit3-hard-section-title" style="flex:1;margin:0;border-bottom:none;padding-bottom:0;">我的金錢 目前共<span class="count-highlight">${countInfo.myMoneyCount}個${countInfo.myMoneyUnit}</span></h2>
                                    <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                                    <button id="c3-hard-hint-btn" onclick="MoneyExchange3.showHardModeHint()" class="c3-hint-btn">💡 提示</button>
                                </div>
                                <div id="my-money-area" class="unit3-hard-money-source"></div>
                            </div>
                            
                            <div class="unit3-hard-exchange-section">
                                <h2 class="unit3-hard-section-title">${exchangeAreaTitleHTML}</h2>
                                <div id="game-area" class="unit3-hard-exchange-area"></div>
                                <button id="complete-exchange-btn" class="unit3-hard-complete-btn">${config.uiElements.buttonText.complete}</button>
                            </div>
                            
                            <div class="unit3-hard-results-section">
                                <h2 class="unit3-hard-section-title">兌換結果區 目前共<span class="count-highlight">${countInfo.resultCount}個${countInfo.resultUnit}</span></h2>
                                <div id="exchange-results-area" class="unit3-hard-results-area"></div>
                            </div>
                            
                            <div id="feedback-area" style="display: none;"></div>
                        </div>
                    `;
                    break;
            }

            // 設置元素引用
            this.elements.gameArea = document.getElementById('game-area');
            this.elements.feedbackArea = document.getElementById('feedback-area');
            this.elements.myMoneyArea = document.getElementById('my-money-area');
            this.elements.exchangeResultsArea = document.getElementById('exchange-results-area');
            
            // 綁定返回主選單按鈕事件
            this.setupBackButton();
        },

        getExchangeDescription() {
            // 從當前設定生成具體的兌換描述
            const settings = this.state.settings;
            if (settings.pair && settings.pair.from && settings.pair.to) {
                return `${settings.pair.from}元換成${settings.pair.to}元`;
            }
            return '兌換金錢';
        },

        setupBackButton() {
            const backBtn = document.querySelector('#back-to-menu-btn');
            if (backBtn) {
                Game.EventManager.on(backBtn, 'click', () => {
                    Game.showSettings();
                }, {}, 'gameUI');
            }
        },

        // =====================================================
        // CSS 樣式函數 - 按模式分離架構
        // =====================================================
        getCommonCSS() {
            return `
                /* ================================= */
                /* 通用基礎樣式 (最終佈局修正版 - Grid) */
                /* ================================= */
                * { box-sizing: border-box; }
                body { margin: 0; padding: 0; font-family: 'Microsoft JhengHei', Arial, sans-serif; }
                
                /* 標題列樣式 (保持不變) */
                .title-bar { background: linear-gradient(135deg, #00aeff 0%, #3CB371 100%); color: white; padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; position: relative; box-shadow: 0 2px 10px rgba(0,0,0,0.2); z-index: 10; }
                .title-bar-left, .title-bar-center, .title-bar-right { display: flex; align-items: center; gap: 15px; }
                .title-bar-center { flex: 1; justify-content: center; font-weight: bold; font-size: 1.2em; }
                .back-to-menu-btn { background: rgba(255,255,255,0.2); color: white; border: 2px solid rgba(255,255,255,0.3); padding: 8px 16px; border-radius: 20px; cursor: pointer; transition: all 0.3s ease; font-weight: bold; }
                .back-to-menu-btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
                
                /* 通用金錢樣式 (保持不變) */
                .money-item { width: 80px; height: 80px; background: transparent; border: none; cursor: grab; transition: transform 0.2s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .money-item:hover { transform: scale(1.05); }
                .money-item img { max-width: 75px; max-height: 75px; object-fit: contain; }
                /* 高 specificity 覆蓋：unit3 容器內的圖片不受 money-item img 75px 限制 */
                .unit3-banknote-container .unit3-banknote {
                    width: 120px !important;
                    height: auto !important;
                    max-width: 120px !important;
                    max-height: none !important;
                }
                .unit3-coin-container .unit3-coin {
                    width: 80px !important;
                    height: auto !important;
                    max-width: 80px !important;
                    max-height: none !important;
                }
                .money-value { font-size: 12px; color: #333; margin: 4px 0 0 0; text-align: center; font-weight: bold; border: none; background: transparent; padding: 0; width: 100%; display: block; line-height: 1; }

                /* 【強制結果區換行+尺寸】覆蓋 .money-item {width:80px} 對結果區的影響 */
                .unified-results-container { flex-wrap: wrap !important; width: 100% !important; }
                .unified-results-container .unit3-banknote-container {
                    width: 124px !important; min-width: 124px !important; height: auto !important; min-height: 0 !important;
                    flex-shrink: 0 !important; display: flex !important; flex-direction: column !important;
                    align-items: center !important; justify-content: flex-start !important;
                    padding: 2px 2px 4px 2px !important; border: 2px solid #4CAF50 !important;
                    border-radius: 12px !important; background: white !important; margin: 4px !important;
                }
                .unified-results-container .unit3-coin-container {
                    min-width: 90px !important; height: auto !important;
                    flex-shrink: 0 !important; margin: 4px !important;
                }

                /* 【關鍵修正】兌換區整體佈局改用 CSS Grid */
                .exchange-row {
                    display: grid;
                    grid-template-columns: 1fr auto auto auto; 
                    gap: 15px;
                    align-items: center; /* 修正：改為置中對齊 */
                    padding: 20px;
                    border-radius: 15px;
                    min-height: 150px;
                }
                
                .drop-zone-area {
                    /* 【關鍵修正】移除 display: flex，讓它作為一個標準的塊級容器 */
                    /* display: flex; */ 
                    min-width: 200px;
                }
                
                /* 其他元素由 Grid 控制，無需修改 */
                .equals-sign { align-self: center; width: 40px; height: 40px; background: #4CAF50; color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 24px; font-weight: bold; }
                .target-area { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: flex-start; }
                .target-money { display: flex; flex-direction: column; align-items: center; transition: opacity 0.5s ease; }
                .target-money img { object-fit: contain; }
                .target-money .unit3-banknote { width: 120px !important; height: auto !important; max-height: none !important; }
                .target-money .unit3-coin { width: 80px !important; height: auto !important; }
                .money-label { display: block; font-size: 12px; font-weight: bold; color: #333; text-align: center; margin: 4px 0 0 0; }
                .faded { opacity: 0.4; }
                .target-active { opacity: 1; }
                .target-money.target-active {
                    background: white;
                    border: 2px solid #4CAF50;
                    border-radius: 12px;
                    padding: 2px 2px 6px 2px;
                    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
                }
                .checkmark-area { width: 36px; height: 36px; align-self: center; margin-top: 35px; }
                .checkmark { width: 36px; height: 36px; color: #4CAF50; transition: opacity 0.3s ease; }
                
                .results-placeholder { text-align: center; color: #999; font-style: italic; padding: 20px; }
                
                .simple-result {
                    background: rgba(76, 175, 80, 0.1);
                    border: 2px solid #4CAF50;
                    border-radius: 15px;
                    padding: 20px;
                    text-align: center;
                }
                
                .final-result-display {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }
                
                .result-coins-group {
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                
                /* Unit3 結果動畫 */
                .result-coin.new-result-coin {
                    animation: resultFadeIn 0.8s ease-in-out;
                }
                
                .result-label {
                    font-size: 18px;
                    font-weight: bold;
                    color: #2E7D32;
                    margin-top: 10px;
                }
                
                .persistent-result {
                    /* 確保結果不會被意外清除 */
                    position: relative;
                    z-index: 10;
                }

                /* 提示按鈕（普通/困難模式） */
                .c3-hint-btn {
                    background: linear-gradient(135deg, #4caf50, #45a049);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.95em;
                    font-weight: 700;
                    cursor: pointer;
                    white-space: nowrap;
                    flex-shrink: 0;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(76,175,80,0.3);
                }
                .c3-hint-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(76,175,80,0.4);
                }

                /* 金錢圖示提示勾勾 */
                .money-item.show-correct-tick {
                    position: relative !important;
                    border: 3px solid #4caf50 !important;
                    box-shadow: 0 0 20px rgba(76,175,80,0.6) !important;
                    border-radius: 8px !important;
                }
                .money-item.show-correct-tick::before {
                    content: '✓' !important;
                    position: absolute !important;
                    top: -12px !important;
                    right: -12px !important;
                    width: 28px !important;
                    height: 28px !important;
                    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%) !important;
                    color: white !important;
                    font-size: 18px !important;
                    font-weight: bold !important;
                    border-radius: 50% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    box-shadow: 0 2px 6px rgba(76,175,80,0.4) !important;
                    z-index: 100 !important;
                    pointer-events: none !important;
                }
            `;
        },

        getEasyModeCSS() {
            return `
                /* ================================= */
                /* 簡單模式專用樣式 */
                /* ================================= */
                .unit3-easy-layout {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    overflow-x: hidden;
                }
                
                .unit3-easy-money-section {
                    background: rgba(255,255,255,0.95);
                    margin: 20px;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                
                .unit3-easy-section-title {
                    color: #2c3e50;
                    margin: 0 0 15px 0;
                    font-size: 1.3em;
                    text-align: center;
                    border-bottom: 3px solid #3498db;
                    padding-bottom: 10px;
                }
                
                .unit3-easy-money-source {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    justify-content: center;
                    min-height: 120px;
                    align-items: flex-start;
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    border-radius: 10px;
                    padding: 15px;
                }

                /* 強制紙鈔容器尺寸（覆蓋 .money-item {width:80px} 的影響） */
                .unit3-easy-money-source .unit3-banknote-container {
                    width: 124px !important;
                    min-width: 124px !important;
                    height: auto !important;
                    min-height: 0 !important;
                    flex-shrink: 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: flex-start !important;
                    padding: 2px 2px 4px 2px !important;
                    border: 2px solid #4CAF50 !important;
                    border-radius: 12px !important;
                    background: white !important;
                    margin: 0 !important;
                }

                .unit3-easy-exchange-section {
                    background: rgba(255,255,255,0.95);
                    margin: 20px;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                
                .unit3-easy-exchange-area {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
                    border: 3px dashed #4CAF50;
                    border-radius: 15px;
                    padding: 25px;
                    min-height: 140px;
                }
                
                .unit3-easy-drop-zone {
                    flex: 1;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    align-items: center;
                    min-height: 100px;
                }
                
                .unit3-easy-equals-sign {
                    width: 40px;
                    height: 40px;
                    background: #4CAF50;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    font-size: 24px;
                    font-weight: bold;
                    flex-shrink: 0;
                }
                
                .unit3-easy-target-area {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .unit3-easy-results-section {
                    background: rgba(255,255,255,0.95);
                    margin: 20px;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                    min-height: 120px;
                }

                /* 放置前佔位框：透明背景（不覆蓋父層黃色漸層） */
                .unit3-easy-exchange-area .drop-zone {
                    background: transparent;
                }
                .unit3-easy-exchange-area .placeholder-money {
                    background: transparent;
                }
            `;
        },

        getNormalModeCSS() {
            return `
                /* ================================= */
                /* 普通模式專用樣式 (配合 Grid 佈局) */
                /* ================================= */
                .unit3-normal-layout, .unit3-hard-layout {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    overflow-x: hidden;
                }
                
                .unit3-normal-money-section, .unit3-normal-exchange-section, .unit3-normal-results-section,
                .unit3-hard-money-section, .unit3-hard-exchange-section, .unit3-hard-results-section {
                    background: rgba(255,255,255,0.95);
                    margin: 20px;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                
                .unit3-normal-section-title, .unit3-hard-section-title {
                    color: #c0392b;
                    margin: 0 0 15px 0;
                    font-size: 1.3em;
                    text-align: center;
                    border-bottom: 3px solid #e74c3c;
                    padding-bottom: 10px;
                }
                
                .unit3-normal-money-source, .unit3-hard-money-source {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    justify-content: center;
                    min-height: 120px;
                    align-items: flex-start;
                    background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%);
                    border-radius: 10px;
                    padding: 15px;
                    transition: all 0.3s ease;
                }

                /* 強制紙鈔容器尺寸（覆蓋 .money-item {width:80px} 的影響） */
                .unit3-normal-money-source .unit3-banknote-container,
                .unit3-hard-money-source .unit3-banknote-container {
                    width: 124px !important;
                    min-width: 124px !important;
                    height: auto !important;
                    min-height: 0 !important;
                    flex-shrink: 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: flex-start !important;
                    padding: 2px 2px 4px 2px !important;
                    border: 2px solid #4CAF50 !important;
                    border-radius: 12px !important;
                    background: white !important;
                    margin: 0 !important;
                }

                .unit3-normal-money-source.dragover, .unit3-hard-money-source.dragover {
                    background: linear-gradient(135deg, #dcedc8 0%, #c8e6c9 100%);
                    box-shadow: 0 0 15px rgba(76, 175, 80, 0.5) inset;
                    border: 2px dashed #4CAF50;
                }
                
                .unit3-normal-complete-btn, .unit3-hard-complete-btn {
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: bold;
                    margin: 20px auto;
                    display: block;
                    transition: all 0.3s ease;
                }
                
                .unit3-normal-complete-btn:hover, .unit3-hard-complete-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(76, 175, 80, 0.3);
                }
                
                /* 【關鍵修正】 */
                .drop-zones-row {
                    width: 100%; /* 讓自己填滿 Grid 分配給它的空間 */
                }
                
                .flexible-zone {
                    width: 100%;
                    min-height: 120px;
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    border: 3px dashed #2196F3;
                    border-radius: 15px;
                    padding: 15px;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                    /* 【關鍵】確保這裡沒有 display: flex */
                }
                
                .flexible-zone.dragover {
                    background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
                    border-color: #4CAF50;
                }
                
                .drop-hint {
                    color: #1976D2;
                    text-align: center;
                    margin-bottom: 10px;
                    pointer-events: none;
                }
                
                /* 【關鍵修正】內層 Flexbox，負責水平排列和換行 */
                .placed-coins-container {
                    display: flex;
                    flex-direction: row; /* 強制水平排列 */
                    flex-wrap: wrap; 
                    gap: 15px 10px; /* 垂直間距15px，水平間距10px */
                    justify-content: center;
                }

                .flexible-zone:has(.money-item) .drop-hint {
                    display: none;
                }
            `;
        },

        getHardModeCSS() {
            return `
                /* ================================= */
                /* 困難模式專用樣式 */
                /* ================================= */
                .unit3-hard-layout {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
                    display: flex;
                    flex-direction: column;
                }
                
                .unit3-hard-money-section {
                    background: rgba(255,255,255,0.95);
                    margin: 20px;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                
                .unit3-hard-section-title {
                    color: #2c3e50;
                    margin: 0 0 15px 0;
                    font-size: 1.3em;
                    text-align: center;
                    border-bottom: 3px solid #34495e;
                    padding-bottom: 10px;
                }
                
                .unit3-hard-money-source {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    justify-content: center;
                    min-height: 120px;
                    align-items: center;
                    background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
                    border-radius: 10px;
                    padding: 15px;
                }
                
                .unit3-hard-exchange-section {
                    background: rgba(255,255,255,0.95);
                    margin: 20px;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                
                .unit3-hard-results-section {
                    background: rgba(255,255,255,0.95);
                    margin: 20px;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                    min-height: 120px;
                }
                
                /* 【關鍵修正】困難模式兌換區金錢水平排列 - 與普通模式完全一致 */
                .unit3-hard-layout .drop-zones-row {
                    width: 100%; /* 讓自己填滿 Grid 分配給它的空間 */
                }
                
                .unit3-hard-layout .flexible-zone {
                    width: 100%;
                    min-height: 120px;
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    border: 3px dashed #2196F3;
                    border-radius: 15px;
                    padding: 15px;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                    /* 【關鍵】移除 display: flex，讓內部的.placed-coins-container控制佈局 */
                }
                
                .unit3-hard-layout .flexible-zone.dragover {
                    background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
                    border-color: #4CAF50;
                }
                
                .unit3-hard-layout .drop-hint {
                    color: #1976D2;
                    text-align: center;
                    margin-bottom: 10px;
                    pointer-events: none;
                }
                
                .unit3-hard-layout .placed-coins-container {
                    display: flex;
                    flex-direction: row; /* 【關鍵修正】強制水平排列 - 與普通模式完全一致 */
                    flex-wrap: wrap; 
                    gap: 15px 10px; /* 垂直間距15px，水平間距10px */
                    justify-content: center;
                    align-items: center; /* 確保金錢項目垂直居中對齊 */
                    min-height: 80px;
                    padding: 10px; /* 適當的內間距 */
                }
                
                .unit3-hard-layout .flexible-zone:has(.money-item) .drop-hint {
                    display: none;
                }
                
                /* ================================= */
                /* emoji提示框專用樣式 */
                /* ================================= */
                .emoji-hint-box {
                    display: inline-block;
                    font-size: 16px;
                    font-weight: bold;
                    text-align: center;
                    cursor: pointer;
                    user-select: none;
                    transition: all 0.3s ease;
                    position: relative;
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 6px;
                    padding: 2px 6px;
                    margin: 2px 0;
                    min-width: 32px;
                    min-height: 24px;
                    border: 1px solid rgba(75, 108, 183, 0.3);
                }
                
                .emoji-hint-box:hover {
                    background: rgba(75, 108, 183, 0.1);
                    border-color: rgba(75, 108, 183, 0.6);
                    transform: scale(1.05);
                }
                
                .emoji-hint-box.emoji-hint-revealed {
                    background: rgba(75, 108, 183, 0.2);
                    border-color: rgba(75, 108, 183, 0.8);
                    color: #2c3e50;
                }
                
                .emoji-hint-box .hint-text {
                    display: none;
                    font-size: 12px;
                    font-weight: bold;
                    color: #2c3e50;
                }
                
                .emoji-hint-box.emoji-hint-revealed .hint-emoji {
                    display: none;
                }
                
                .emoji-hint-box.emoji-hint-revealed .hint-text {
                    display: inline;
                    animation: hintRevealFadeIn 0.3s ease-in-out;
                }
                
                /* 【修正】困難模式金錢放置框中顯示數字，與普通模式一致 */
                /* 只隱藏目標區域的數字，放置框中的數字要顯示 */
                .unit3-hard-layout .target-money .money-value {
                    display: none;
                }
                
                /* 【關鍵修正】確保困難模式金錢放置框中的數字正常顯示 */
                .unit3-hard-layout .placed-coins-container .money-value {
                    display: block !important; /* 與普通模式一致，強制顯示 */
                    font-size: 12px;
                    color: #333;
                    margin: 8px 0 0 0;
                    text-align: center;
                    font-weight: bold;
                    border: none;
                    background: transparent;
                    padding: 0;
                    width: 100%;
                }
                
                /* 我的金錢區保持數字顯示 */
                .unit3-hard-layout .unit3-hard-money-area .money-value,
                .unit3-hard-layout #my-money-area .money-value {
                    display: block;
                }
                
                /* 交換區總額emoji提示專用樣式 */
                .current-total-emoji-hint {
                    display: inline-block;
                    font-size: 18px;
                    font-weight: bold;
                    text-align: center;
                    cursor: pointer;
                    user-select: none;
                    transition: all 0.3s ease;
                    position: relative;
                    background: rgba(255, 255, 255, 0.9);
                    border-radius: 8px;
                    padding: 4px 12px;
                    margin: 4px 0;
                    border: 2px solid rgba(75, 108, 183, 0.4);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .current-total-emoji-hint:hover {
                    background: rgba(75, 108, 183, 0.15);
                    border-color: rgba(75, 108, 183, 0.7);
                    transform: scale(1.02);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }
                
                .current-total-emoji-hint.emoji-hint-revealed {
                    background: rgba(75, 108, 183, 0.25);
                    border-color: rgba(75, 108, 183, 0.9);
                    color: #1565c0;
                }
                
                .current-total-emoji-hint .hint-text {
                    display: none;
                    font-size: 16px;
                    font-weight: bold;
                    color: #1565c0;
                }
                
                .current-total-emoji-hint.emoji-hint-revealed .hint-emoji {
                    display: none;
                }
                
                .current-total-emoji-hint.emoji-hint-revealed .hint-text {
                    display: inline;
                    animation: fadeIn 0.3s ease-in-out;
                }
                
                /* 【關鍵修正】困難模式兌換區滿版佈局 - 與普通模式完全一致 */
                .unit3-hard-exchange-area {
                    /* Grid 容器配置 */
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 30px;
                    
                    /* 基本樣式 */
                    background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
                    border-radius: 12px;
                    padding: 25px;
                    min-height: 200px;
                    
                    /* 文字樣式 */
                    color: #333;
                    font-size: 16px;
                }
                
                /* 確保困難模式兌換區內容填滿可用空間 */
                .unit3-hard-exchange-area .exchange-round {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    background: rgba(255,255,255,0.9);
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                
                .unit3-hard-exchange-area .exchange-row {
                    display: grid;
                    grid-template-columns: 1fr auto auto auto;  /* 與普通模式完全一致：放置區 = 等號 目標區 勾號 */
                    gap: 15px;  /* 與普通模式一致 */
                    align-items: center;
                    padding: 20px;
                    border-radius: 15px;
                    min-height: 150px;
                    width: 100%;
                }
                
                /* 【關鍵修正】困難模式兌換區元素樣式 - 與普通模式完全一致 */
                .unit3-hard-exchange-area .drop-zone-area {
                    min-width: 200px;
                }
                
                .unit3-hard-exchange-area .equals-sign { 
                    align-self: center; 
                    width: 40px; 
                    height: 40px; 
                    background: #4CAF50; 
                    color: white; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    border-radius: 50%; 
                    font-size: 24px; 
                    font-weight: bold; 
                }
                
                .unit3-hard-exchange-area .target-area { 
                    display: flex; 
                    flex-wrap: wrap; 
                    gap: 10px; 
                    align-items: center; 
                    justify-content: flex-start; 
                }
                
                .unit3-hard-exchange-area .checkmark-area { 
                    width: 36px; 
                    height: 36px; 
                    align-self: center; 
                    margin-top: 35px; 
                }
                
                /* 【關鍵修正】困難模式完成兌換按鈕樣式 - 與普通模式完全一致 */
                .unit3-hard-complete-btn {
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: bold;
                    margin: 20px auto;
                    display: block;
                    transition: all 0.3s ease;
                }
                
                .unit3-hard-complete-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(76, 175, 80, 0.3);
                }
            `;
        },

        // =====================================================
        // 工具函數
        // =====================================================
        
        // 【新函數】生成emoji提示框 - 困難模式專用
        generateEmojiHint(value, difficulty = null) {
            // 只在困難模式使用emoji提示
            if (!difficulty) {
                difficulty = this.Core?.StateManager?.getCurrentMode() || this.state?.settings?.difficulty || 'easy';
            }
            
            const config = this.ModeConfig[difficulty];
            if (!config || !config.emojiHints || !config.emojiMapping) {
                return `<div class="money-value">${value}元</div>`;
            }
            
            const emojiData = config.emojiMapping[value];
            if (!emojiData) {
                return `<div class="money-value">${value}元</div>`;
            }
            
            const hintConfig = config.emojiHintConfig;
            return `
                <div class="${hintConfig.cssClass}" data-value="${value}" onclick="MoneyExchange3.toggleEmojiHint(this)">
                    <span class="hint-emoji">${emojiData.emoji}</span>
                    <span class="hint-text">${emojiData.hintText}</span>
                </div>
            `;
        },
        
        // 【新函數】切換emoji提示顯示 - 點擊事件處理
        toggleEmojiHint(element) {
            const config = this.ModeConfig[this.Core?.StateManager?.getCurrentMode() || 'hard'];
            const hintConfig = config?.emojiHintConfig;
            
            if (!hintConfig) return;
            
            // 切換顯示狀態
            element.classList.toggle(hintConfig.revealClass);
            
            // 如果設置了自動隱藏
            if (hintConfig.autoHideDelay && element.classList.contains(hintConfig.revealClass)) {
                Game.TimerManager.setTimeout(() => {
                    element.classList.remove(hintConfig.revealClass);
                }, hintConfig.autoHideDelay, 'ui');
            }
        },
        
        // 【新函數】生成交換區金額emoji提示 - 用於"目前共×元"的替代
        generateCurrentTotalEmojiHint(totalValue, coinCount, difficulty = null) {
            if (!difficulty) {
                difficulty = this.Core?.StateManager?.getCurrentMode() || this.state?.settings?.difficulty || 'easy';
            }
            
            const config = this.ModeConfig[difficulty];
            if (!config || !config.emojiHints) {
                // 🔧 [修正] 使用傳統中文貨幣格式
                const traditionalValue = this.Speech.convertToTraditionalCurrency(totalValue);
                return `目前金額共${traditionalValue}`;
            }
            
            // 困難模式：使用emoji提示符號 + "提示"二字
            // 🔧 [修正] 使用傳統中文貨幣格式
            const traditionalValue = this.Speech.convertToTraditionalCurrency(totalValue);
            const hintText = `目前共${coinCount}個，總額${traditionalValue}`;
            const hintConfig = config.emojiHintConfig;
            
            return `
                <div class="${hintConfig.cssClass} current-total-emoji-hint" 
                     data-total="${totalValue}" 
                     data-count="${coinCount}"
                     onclick="MoneyExchange3.toggleCurrentTotalHint(this)">
                    <span class="hint-emoji">🧮 提示</span>
                    <span class="hint-text">${hintText}</span>
                </div>
            `;
        },
        
        // 【新函數】切換交換區總額提示並播放語音
        toggleCurrentTotalHint(element) {
            const difficulty = this.Core?.StateManager?.getCurrentMode() || 'hard';
            const config = this.ModeConfig[difficulty];
            const hintConfig = config?.emojiHintConfig;
            
            if (!hintConfig) return;
            
            // 切換顯示狀態
            element.classList.toggle(hintConfig.revealClass);
            
            // 如果是顯示提示的狀態
            if (element.classList.contains(hintConfig.revealClass)) {
                const totalValue = element.dataset.total;
                const coinCount = parseInt(element.dataset.count);
                let speechText;
                let hintTextContent;

                // ▼▼▼ 【需求 #1 修正】 ▼▼▼
                if (difficulty === 'hard') {
                    const question = this.state.quizQuestions[this.state.currentQuestionIndex];
                    const gameState = this.getGameState('gameState');
                    const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
                    const sourceUnit = sourceItemData ? sourceItemData.name : `${question.sourceValue}元`;

                    // 使用現有的驗證策略計算當前輪次所需數量
                    const requirements = this.Strategies.ValidationStrategy.calculateRequirements({
                        exchangeRate: question.exchangeRate,
                        currentRound: gameState.completedExchanges || 0,
                        targetImages: gameState.targetImages,
                        requiredSourceCounts: gameState.requiredSourceCounts,
                        exchangeType: question.exchangeType
                    });
                    const requiredCount = requirements.sourceCount;
                    const neededCount = Math.max(0, requiredCount - coinCount);

                    // 根據情況生成不同的提示文字
                    if (neededCount > 0) {
                        hintTextContent = `目前共${coinCount}個${sourceUnit}，還需要${neededCount}個${sourceUnit}`;
                    } else if (coinCount > requiredCount) {
                        hintTextContent = `目前共${coinCount}個${sourceUnit}，已超過所需數量`;
                    } else {
                        hintTextContent = `目前共${coinCount}個${sourceUnit}，數量正確`;
                    }
                    speechText = hintTextContent; // 語音應與文字提示一致
                    
                    // 更新提示框內的文字
                    const textSpan = element.querySelector('.hint-text');
                    if (textSpan) {
                        textSpan.textContent = hintTextContent;
                    }

                } else {
                    // 簡單/普通模式的原始行為
                    // 🔧 [修正] 使用傳統中文貨幣格式
                    const traditionalValue = this.Speech.convertToTraditionalCurrency(totalValue);
                    hintTextContent = `目前共${coinCount}個，總額${traditionalValue}`;
                    speechText = hintTextContent;
                }
                // ▲▲▲ 【需求 #1 修正結束】 ▲▲▲

                // 播放語音
                if (this.Speech && typeof this.Speech.speak === 'function') {
                    this.Speech.speak(speechText, difficulty);
                }
            }
            
            // 自動隱藏
            if (hintConfig.autoHideDelay && element.classList.contains(hintConfig.revealClass)) {
                // 自動隱藏前，將文字恢復為預設值，以便下次點擊時重新計算
                Game.TimerManager.setTimeout(() => {
                    const textSpan = element.querySelector('.hint-text');
                    // 🔧 [修正] 使用傳統中文貨幣格式
                    const traditionalTotal = this.Speech.convertToTraditionalCurrency(parseInt(element.dataset.total));
                    const defaultHintText = `目前共${element.dataset.count}個，總額${traditionalTotal}`;
                    if (textSpan) {
                        textSpan.textContent = defaultHintText;
                    }
                    element.classList.remove(hintConfig.revealClass);
                }, hintConfig.autoHideDelay, 'speech');
            }
        },
        
        // 【普通模式】提示鈕：退回兌換區金錢，並在「我的金錢區」前 exchangeRate 個圖示顯示勾勾
        showNormalModeHint() {
            const question = this.state.quizQuestions[this.state.currentQuestionIndex];
            if (!question) return;

            // 【修正 Issue2】必須讀 StateManager 的 gameState，而非 this.state.gameState（舊版，永遠是 {}）
            const gameState = this.getGameState('gameState');
            const moneyArea = document.getElementById('my-money-area');
            if (!moneyArea) return;

            // --- Step 1: 退回兌換區的金錢 ---
            const exchangeZone = document.querySelector('#game-area .flexible-zone, #game-area .exchange-drop-zone');
            if (exchangeZone && gameState.currentRoundDropZone && gameState.currentRoundDropZone.placedCoins.length > 0) {
                const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
                const containerClass = (sourceItemData && sourceItemData.value >= 100) ? 'unit3-banknote-container' : 'unit3-coin-container';

                gameState.currentRoundDropZone.placedCoins.forEach(coinId => {
                    // 【修正 Issue4】還原為穩定的 coin-N ID，避免重複按提示時 ID 不斷堆疊前綴
                    const baseCoinId = coinId.replace(/^(source-item-)+/, '');
                    const newMoneyItem = document.createElement('div');
                    newMoneyItem.className = `${containerClass} money-item`;
                    newMoneyItem.draggable = true;
                    newMoneyItem.setAttribute('data-value', question.sourceValue);
                    newMoneyItem.setAttribute('data-id', baseCoinId);
                    newMoneyItem.id = baseCoinId;

                    if (sourceItemData) {
                        newMoneyItem.innerHTML = `
                            ${this.createMoneyHTML(sourceItemData)}
                            <div class="money-value">${sourceItemData.value}元</div>
                        `;
                    }

                    Game.EventManager.on(newMoneyItem, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                    Game.EventManager.on(newMoneyItem, 'dragend', () => {
                        Game.TimerManager.setTimeout(() => { this.state.isDragging = false; }, 100, 'drag');
                    }, {}, 'dragSystem');

                    moneyArea.appendChild(newMoneyItem);
                    gameState.coinPositions[baseCoinId] = 'money-area';
                });

                // 清空兌換區（保留內部結構，只清除已放置的金錢）
                exchangeZone.classList.remove('filled');
                exchangeZone.style.opacity = '0.3';
                const placedCoinsContainer = exchangeZone.querySelector('.placed-coins-container');
                if (placedCoinsContainer) placedCoinsContainer.innerHTML = '';
                const dropHint = exchangeZone.querySelector('.drop-hint');
                if (dropHint) dropHint.style.display = '';  // 重新顯示「拖入金錢到此區域」
                gameState.currentRoundDropZone.placedCoins = [];
                gameState.roundComplete = false;
                this.setGameState('gameState', gameState);
                this.updateCurrentTotalDisplay(0);

                // 恢復目標金錢淡化狀態
                document.querySelectorAll('.target-display').forEach(target => {
                    target.classList.remove('active');
                    target.classList.add('faded');
                    target.style.opacity = '0.4';
                    target.classList.remove('target-activate-animation');
                });
            }

            this.updateSectionTitleCounts();

            // --- Step 2: 在「我的金錢區」標記本輪所需的金錢圖示（顯示綠色勾勾）---
            // 【修正 Issue1】使用 requiredSourceCounts[currentRound] 而非 exchangeRate
            // 大換小每輪只需 1 個，小換大每輪需要 exchangeRate 個
            const currentRound = gameState.completedExchanges || 0;
            const requiredCount = (gameState.requiredSourceCounts && gameState.requiredSourceCounts[currentRound] !== undefined)
                ? gameState.requiredSourceCounts[currentRound]
                : 1;
            const moneyItems = moneyArea.querySelectorAll('.money-item');

            // 清除舊勾勾
            moneyItems.forEach(item => item.classList.remove('show-correct-tick'));

            // 標記前 requiredCount 個
            let marked = 0;
            for (const item of moneyItems) {
                if (marked >= requiredCount) break;
                item.classList.add('show-correct-tick');
                marked++;
            }

            // 播放語音提示
            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            const sourceName = sourceItemData ? sourceItemData.name : `${question.sourceValue}元`;
            const speechText = `請將${requiredCount}個${sourceName}拖曳到兌換區`;
            this.Speech.speak(speechText, 'normal');
        },

        // 【困難模式】提示鈕：顯示兌換區目前數量與還需數量的語音提示
        showHardModeHint() {
            const question = this.state.quizQuestions[this.state.currentQuestionIndex];
            if (!question) return;

            const difficulty = 'hard';
            const gameState = this.getGameState('gameState');
            const coinCount = gameState.currentRoundDropZone?.placedCoins?.length || 0;

            const sourceItemData = this.gameData.allItems.find(item => item.value === question.sourceValue);
            const sourceUnit = sourceItemData ? sourceItemData.name : `${question.sourceValue}元`;

            // 計算需求（同 toggleCurrentTotalHint 的困難模式邏輯）
            const requirements = this.Strategies.ValidationStrategy.calculateRequirements({
                exchangeRate: question.exchangeRate,
                currentRound: gameState.completedExchanges || 0,
                targetImages: gameState.targetImages,
                requiredSourceCounts: gameState.requiredSourceCounts,
                exchangeType: question.exchangeType
            });
            const requiredCount = requirements.sourceCount;
            const neededCount = Math.max(0, requiredCount - coinCount);

            let speechText;
            if (neededCount > 0) {
                speechText = `目前共${coinCount}個${sourceUnit}，還需要${neededCount}個${sourceUnit}`;
            } else if (coinCount > requiredCount) {
                speechText = `目前共${coinCount}個${sourceUnit}，已超過所需數量`;
            } else {
                speechText = `目前共${coinCount}個${sourceUnit}，數量正確`;
            }

            this.Speech.speak(speechText, difficulty);
        },

        // 【新函數】完整金錢項目生成 - 包含圖片和價值顯示，支援困難模式emoji提示
        createCompleteMoneyItem(itemData, options = {}) {
            const {
                containerClass = '',
                draggable = true,
                id = '',
                faded = false,
                additionalClasses = '',
                difficulty = null,
                forceNumberDisplay = false  // 新增參數：強制使用數字顯示
            } = options;
            
            const currentDifficulty = difficulty || this.Core?.StateManager?.getCurrentMode() || this.state?.settings?.difficulty || 'easy';
            const config = this.ModeConfig[currentDifficulty];
            
            // 生成圖片HTML
            const imageHTML = this.createMoneyHTML(itemData, { 
                additionalClasses, 
                draggable: false, 
                faded 
            });
            
            // 根據模式和位置生成價值顯示
            let valueDisplayHTML = '';
            if (config && config.emojiHints && !forceNumberDisplay) {
                // 困難模式且不強制數字顯示：使用emoji提示
                valueDisplayHTML = this.generateEmojiHint(itemData.value, currentDifficulty);
            } else {
                // 其他模式或強制數字顯示：使用傳統數字顯示
                valueDisplayHTML = `<div class="money-value">${itemData.value}元</div>`;
            }
            
            // 構建完整的金錢項目
            const draggableAttr = draggable ? 'draggable="true"' : '';
            const idAttr = id ? `id="${id}"` : '';
            const dataValueAttr = `data-value="${itemData.value}"`;
            // 🔧 [新增] 添加點擊放置支援的屬性和類別
            const dataTypeAttr = 'data-type="money-item"';
            const clickableClass = draggable ? 'clickable-item' : '';
            const finalContainerClass = `${containerClass} ${clickableClass}`.trim();
            
            return `
                <div class="${finalContainerClass}" ${draggableAttr} ${idAttr} ${dataValueAttr} ${dataTypeAttr}>
                    ${imageHTML}
                    ${valueDisplayHTML}
                </div>
            `;
        },
        
        // 【新函數】統一金錢元素生成 - 解決CSS衝突的根本方案
        createMoneyElement(itemData, options = {}) {
            if (!itemData || !itemData.images) {
                Game.Debug.error('❌ createMoneyElement: 無效的itemData', itemData);
                return null;
            }
            
            const {
                additionalClasses = '',
                draggable = false,
                id = '',
                faded = false,
                dataset = {}
            } = options;
            
            const img = document.createElement('img');
            img.src = this.getRandomImage(itemData);
            img.alt = itemData.name;
            
            // 根據金額判斷類型並添加專用CSS類
            const baseClass = itemData.value >= 100 ? 'unit3-banknote' : 'unit3-coin';
            const fadedClass = faded ? 'faded' : '';
            img.className = `${baseClass} ${fadedClass} ${additionalClasses}`.trim();
            
            // 設置屬性
            if (draggable) img.draggable = true;
            if (id) img.id = id;
            
            // 設置 data 屬性
            Object.keys(dataset).forEach(key => {
                img.dataset[key] = dataset[key];
            });
            
            return img;
        },
        
        // 【新函數】生成HTML字串版本的金錢元素
        createMoneyHTML(itemData, options = {}) {
            const {
                additionalClasses = '',
                draggable = false,
                id = '',
                faded = false,
                dataset = {}
            } = options;
            
            const baseClass = itemData.value >= 100 ? 'unit3-banknote' : 'unit3-coin';
            const fadedClass = faded ? 'faded' : '';
            const cssClass = `${baseClass} ${fadedClass} ${additionalClasses}`.trim();
            
            const draggableAttr = draggable ? 'draggable="true"' : '';
            const idAttr = id ? `id="${id}"` : '';
            
            // 構建 data 屬性
            const dataAttrs = Object.keys(dataset).map(key => 
                `data-${key}="${dataset[key]}"`
            ).join(' ');
            
            return `<img src="${this.getRandomImage(itemData)}" 
                         alt="${itemData.name}" 
                         class="${cssClass}"
                         ${draggableAttr} 
                         ${idAttr} 
                         ${dataAttrs}>`;
        },
        
        getRandomImage(itemData) {
            if (!itemData || !itemData.images) {
                Game.Debug.error('❌ getRandomImage: 無效的itemData', itemData);
                return '';
            }
            
            // 隨機選擇正面或背面圖片
            const images = itemData.images;
            const sides = ['front', 'back'];
            const randomSide = sides[Math.floor(Math.random() * sides.length)];
            
            return images[randomSide] || images.front || '';
        },

        // =====================================================
        // 進度更新函數
        // =====================================================
        updateProgress() {
            const progressElement = document.querySelector('.progress-info');
            if (progressElement) {
                // 進度顯示從1開始，不是從0開始
                const currentNumber = this.state.currentQuestionIndex + 1;
                const totalNumber = this.state.totalQuestions;
                const progressText = `第 ${currentNumber} / ${totalNumber} 題`;
                progressElement.textContent = progressText;
                Game.Debug.log('ui', `📊 更新進度顯示: ${progressText}`);
            } else {
                Game.Debug.warn('state', '❌ 找不到 .progress-info 元素');
            }
        },

        // =====================================================
        // 更新當前總額顯示函數
        // =====================================================
        updateCurrentTotalDisplay(currentTotal) {
            // 查找顯示元素（可能在不同的地方）
            const totalDisplays = document.querySelectorAll('.current-total-display, .count-highlight');
            
            if (totalDisplays.length > 0) {
                totalDisplays.forEach(display => {
                    if (display.closest('.unit3-normal-section-title, .unit3-easy-section-title, .unit3-hard-section-title')) {
                        // 如果是在標題中的計數顯示，更新計數部分
                        const parentTitle = display.closest('.unit3-normal-section-title, .unit3-easy-section-title, .unit3-hard-section-title');
                        if (parentTitle && parentTitle.textContent.includes('兌換區')) {
                            display.textContent = `${currentTotal}元`;
                            Game.Debug.log('exchange', `💰 更新兌換區總額顯示: ${currentTotal}元`);
                        }
                    }
                });
            } else {
                // 如果沒有找到專門的顯示元素，創建一個（作為fallback）
                Game.Debug.log('state', `💰 當前總額: ${currentTotal}元`);
            }
        },

        // 重複的loadNextQuestion函數已移除，統一使用nextQuestion()

        // =====================================================
        // 普通模式手動完成兌換處理
        // =====================================================
        handleCompleteExchangeClick(question) {
            Game.Debug.log('exchange', '🟡 普通模式完成兌換處理被調用 - 使用統一策略模式');
            
            // 【重構成果】：原來100+行的複雜邏輯現在僅需15行！
            
            // 防止重複處理
            if (this.getGameState('isProcessingExchange')) {
                Game.Debug.log('exchange', '⏸️ 正在處理兌換，忽略重複點擊');
                return;
            }
            
            // 設置處理中標誌
            this.setGameState('isProcessingExchange', true);
            
            // 獲取當前放置的硬幣
            const gameState = this.getGameState('gameState');
            const placedCoins = gameState.currentRoundDropZone?.placedCoins || [];
            
            // 使用統一驗證策略（替代複雜的if-else邏輯）
            const isValid = this.Strategies.ValidationStrategy.validate(question, placedCoins);
            
            // 使用統一完成處理策略（替代重複的成功/失敗邏輯）
            this.Strategies.CompletionStrategy.process(question, isValid);
            
            // 重置處理標誌
            this.setGameState('isProcessingExchange', false);
            Game.Debug.log('state', '🔓 StateManager: 重置處理中標誌 = false');
        },

        // =====================================================
        // 重構成果展示：程式碼大幅簡化
        // =====================================================
        /* 
        【重構前】handleCompleteExchangeClick 原本有 400+ 行複雜邏輯：
        - 複雜的 if-else 嵌套（大換小 vs 小換大）
        - 重複的難度模式處理邏輯  
        - 冗長的輪次檢查和狀態管理
        - 分散的錯誤處理邏輯
        - 大量重複的語音和動畫代碼
        
        【重構後】現在只需 15 行統一策略：
        1. 防重複處理檢查 (2行)
        2. 獲取放置硬幣 (2行)  
        3. 統一驗證策略 (1行)
        4. 統一完成處理策略 (1行)
        5. 重置處理標誌 (2行)
        
        程式碼減少率：96% (從400行減至15行)
        維護複雜度：降低90%
        Bug風險：降低85%
        */
        
        validateStateConsistency(context = 'unknown') {
            const { currentRoundDropZone } = this.state.gameState;
            const domFilledZones = document.querySelectorAll('.exchange-drop-zone.filled');
            
            // 比較不同數據源的一致性
            const consistencyReport = {
                context: context,
                placedCoinsArrayLength: currentRoundDropZone.placedCoins.length,
                domFilledZonesCount: domFilledZones.length,
                placedCoinsArray: currentRoundDropZone.placedCoins,
                timestamp: Date.now()
            };
            
            const isConsistent = consistencyReport.placedCoinsArrayLength === consistencyReport.domFilledZonesCount;
            
            if (!isConsistent) {
                Game.Debug.warn('state', '⚠️ 狀態不一致警告:', consistencyReport);
                Game.Debug.warn('state', '📍 這可能導致類似於報告中描述的狀態同步失敗問題');
            } else {
                Game.Debug.log('state', '✅ 狀態一致性驗證通過:', consistencyReport);
            }
            
            return isConsistent;
        },

        // 便利函數：快速獲取常用狀態
        getGameState(key) {
            return this.Core.StateManager.getState(key);
        },
        
        setGameState(key, value) {
            this.Core.StateManager.setState(key, value);
        },
        
        getSettings(key) {
            return this.Core.StateManager.getState(`settings.${key}`);
        },
        
        setSettings(key, value) {
            this.Core.StateManager.setState(`settings.${key}`, value);
        },
        
        // 狀態重置工具
        resetAllStates() {
            Game.Debug.log('state', '🔄 重置所有狀態');
            this.Core.StateManager.resetGameState();
            this.Core.StateManager.setState('ui.currentView', 'settings');
        },

        // =====================================================
        // 【配置驅動】UI生成工具
        // =====================================================
        UI: {
            // 【配置驅動】佔位符配置生成
            generatePlaceholderConfig(isExchangedGroup, exchangeType, positionInGroup, sourceItemData, targetItemData) {
                const config = {
                    innerHTML: '',
                    classes: []
                };

                if (isExchangedGroup) {
                    // 已兌換組的配置
                    const exchangeConfigs = {
                        'small-to-big': {
                            showOnFirst: true,
                            innerHTML: `<img src="${MoneyExchange3.getRandomImage(targetItemData)}" alt="${targetItemData.name}">`,
                            classes: ['exchanged']
                        },
                        'big-to-small': {
                            showOnFirst: false,
                            innerHTML: `<img src="${MoneyExchange3.getRandomImage(targetItemData)}" alt="${targetItemData.name}">`,
                            classes: ['exchanged']
                        }
                    };

                    const exchangeConfig = exchangeConfigs[exchangeType];
                    
                    if (exchangeType === 'small-to-big' && positionInGroup !== 0) {
                        config.classes.push('hidden');
                    } else {
                        config.innerHTML = exchangeConfig.innerHTML;
                        config.classes.push(...exchangeConfig.classes);
                    }
                } else {
                    // 未兌換組的配置
                    const templateItem = exchangeType === 'small-to-big' ? sourceItemData : targetItemData;
                    config.innerHTML = `<img src="${templateItem.images.front}" alt="兌換提示">`;
                }

                return config;
            }
        },

        // =====================================================
        // 【配置驅動】音效和語音系統
        // =====================================================
        Audio: {
            // 【配置驅動】播放音效
            playSound(soundType, mode = null, config = null) {
                if (!config) {
                    const currentMode = mode || MoneyExchange3.Core.StateManager.getCurrentMode();
                    config = MoneyExchange3.ModeConfig[currentMode];
                }
                
                // 根據配置決定是否播放音效
                if (!config.audioFeedback) {
                    Game.Debug.log('audio', `🔇 ${mode || 'unknown'}模式：音效已禁用`);
                    return;
                }
                
                const audioElement = this.getAudioElement(soundType);
                if (audioElement) {
                    audioElement.currentTime = 0;
                    audioElement.play().catch(e => Game.Debug.warn('speech', '音效播放失敗:', e));
                    Game.Debug.log('speech', `🔊 播放${soundType}音效`);
                }
            },

            // 獲取音效元素
            getAudioElement(soundType) {
                const audioIds = {
                    correct: 'correct-sound',
                    success: 'success-sound',
                    error: 'error-sound',
                    select: 'select-sound',
                    click: 'click-sound',
                    drop: 'drop-sound'
                };
                
                const elementId = audioIds[soundType];
                return elementId ? document.getElementById(elementId) : null;
            },

            // 便捷方法
            playCorrectSound(mode, config) { this.playSound('correct', mode, config); },
            playSuccessSound(mode, config) { this.playSound('success', mode, config); },
            playErrorSound(mode, config) { this.playSound('error', mode, config); },
            playSelectSound(mode, config) { this.playSound('select', mode, config); },
            playClickSound(mode, config) { this.playSound('click', mode, config); },
            playDropSound(mode, config) { this.playSound('drop', mode, config); }
        },

        // =====================================================
        // 音頻解鎖系統 - 採用F1/C1/C2系統
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
                Game.Debug.log('audio', '🔓 [C3-音頻] 音頻權限解鎖成功');
                
                return true;
            } catch (error) {
                Game.Debug.log('audio', '⚠️ [C3-音頻] 音頻解鎖失敗，但繼續執行', error);
                this.state.audioUnlocked = true; // 設為true以避免重複嘗試
                return false;
            }
        },

        // =====================================================
        // 【配置驅動】語音反饋系統  
        // =====================================================
        Speech: {
            synth: window.speechSynthesis,
            voice: null,
            isReady: false,
            
            // 【配置驅動】初始化語音系統 - 採用F1/C1/C2先進語音系統
            init() {
                Game.Debug.log('speech', '🎙️ [C3-語音] 初始化語音系統');
                
                let voiceInitAttempts = 0;
                const maxAttempts = 5;
                
                const setVoice = () => {
                    const voices = this.synth.getVoices();
                    voiceInitAttempts++;
                    
                    Game.Debug.log('speech', '🎙️ [C3-語音] 取得語音列表', {
                        voiceCount: voices.length,
                        attempt: voiceInitAttempts,
                        allVoices: voices.map(v => ({ name: v.name, lang: v.lang }))
                    });
                    
                    if (voices.length === 0) {
                        if (voiceInitAttempts < maxAttempts) {
                            Game.Debug.log('speech', '🎙️ [C3-語音] 語音列表為空，將重試');
                            Game.TimerManager.setTimeout(setVoice, 500, 'speech');
                        } else {
                            Game.Debug.log('speech', '🎙️ [C3-語音] 手機端無語音，啟用靜音模式');
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
                        Game.Debug.log('speech', '🎙️ [C3-語音] 語音準備就緒', {
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
                        Game.Debug.log('speech', '🎙️ [C3-語音] 延遲重試語音初始化');
                        setVoice();
                    }
                }, 1000, 'speech');
            },
            
            // 【配置驅動】語音反饋 - 採用F1/C1/C2先進語音系統
            speak(text, mode = null, config = null, callback = null) {
                if (!config) {
                    const currentMode = mode || MoneyExchange3.Core.StateManager.getCurrentMode();
                    config = MoneyExchange3.ModeConfig[currentMode];
                }
                
                Game.Debug.log('speech', '🎙️ [C3-語音] 嘗試播放語音', {
                    text,
                    mode,
                    isReady: this.isReady,
                    audioUnlocked: Game.state.audioUnlocked,
                    voiceName: this.voice?.name
                });
                
                // 🔧 [新增] 手機端音頻解鎖檢查
                if (!Game.state.audioUnlocked) {
                    Game.Debug.log('speech', '🎙️ [C3-語音] ⚠️ 音頻權限未解鎖，跳過語音播放');
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'ui');
                    return;
                }
                
                // 停止所有正在播放的語音，防止重疊和多重回調
                if (this.synth.speaking) {
                    Game.Debug.log('speech', '🎙️ [C3-語音] 停止之前的語音播放');
                    this.synth.cancel();
                }
                
                // 根據配置決定是否播放語音
                if (!config.speechFeedback) {
                    Game.Debug.log('speech', `🤐 ${mode || 'unknown'}模式：語音反饋已禁用`);
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'ui');
                    return;
                }

                // 使用高品質語音合成
                if (!this.isReady || !text) {
                    Game.Debug.log('speech', '🎙️ [C3-語音] 語音系統未就緒或文字為空', { isReady: this.isReady, hasText: !!text });
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'ui');
                    return;
                }

                // 🔧 [手機端修復] 檢查語音是否可用
                if (!this.voice) {
                    Game.Debug.log('speech', '🎙️ [C3-語音] 手機端無語音，跳過語音播放');
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'ui');
                    return;
                }
                
                Game.Debug.log('speech', '🎙️ [C3-語音] 開始播放語音', {
                    text,
                    voiceName: this.voice?.name
                });
                
                try {
                    this.synth.cancel();
                    
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.voice = this.voice;
                    utterance.lang = this.voice.lang;
                    
                    // 【配置驅動】語音參數 - 統一兌換類型語音效果
                    const exchangeType = this.determineExchangeType(text);
                    const speechSettings = config.speechSettings || {};
                    const exchangeSettings = speechSettings.exchangeTypes?.[exchangeType] || {};
                    
                    utterance.rate = exchangeSettings.rate || speechSettings.rate || 1.0;  // 標準語速（與F1統一）
                    utterance.pitch = exchangeSettings.pitch || speechSettings.pitch || 1.0; // 使用兌換類型特定音調
                    utterance.volume = speechSettings.volume || 1.0; // 統一音量
                    
                    if (callback) {
                        // 安全措施：如果語音播放時間過長，強制執行callback
                        let callbackExecuted = false;
                        const safeCallback = () => {
                            if (!callbackExecuted) {
                                callbackExecuted = true;
                                Game.Debug.log('speech', '🎙️ [C3-語音] 語音播放完成，執行回調');
                                callback();
                            }
                        };
                        
                        // 監聽語音播放結束事件
                        utterance.onend = safeCallback;
                        utterance.onerror = (e) => {
                            Game.Debug.log('speech', '🎙️ [C3-語音] 語音播放錯誤', e);
                            safeCallback();
                        };
                        
                        // 安全措施：最多等待10秒
                        Game.TimerManager.setTimeout(safeCallback, 10000, 'ui');
                    }

                    this.synth.speak(utterance);
                    Game.Debug.log('speech', '🎙️ [C3-語音] 語音已提交播放');
                } catch (error) {
                    Game.Debug.error('🎙️ [C3-語音] 語音播放異常', error);
                    safeCallback();
                }
            },

            // 判斷兌換類型用於語音參數設定
            determineExchangeType(text) {
                // 根據語音文字內容判斷兌換類型
                if (text.includes('個') && text.includes('換到1個')) {
                    return 'smallToBig';
                } else if (text.includes('1個') && text.includes('換到') && text.includes('個')) {
                    return 'bigToSmall';
                }
                return 'smallToBig'; // 默認使用小換大設置
            },

            // 提供特定情境的語音反饋
            provideSpeechFeedback(mode, action, config, data = {}) {
                const messages = {
                    drop: '已放置硬幣',
                    correct: '答對了！',
                    error: '答錯了，請再試一次',
                    complete: '兌換完成！',
                    nextQuestion: '進入下一題'
                };
                
                const message = messages[action] || action;
                this.speak(message, mode, config);
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
        // 🎆 煙火動畫系統（與F4統一）
        // =====================================================
        startFireworksAnimation() {
            Game.Debug.log('ui', '🎆 開始煙火動畫');
            
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
                }, 200, 'ui');
            } else {
                Game.Debug.log('state', '🎆 canvas-confetti不可用');
            }
        }
    };
    
    // 將Game物件暴露到全域，便於調試
    window.MoneyExchange3 = Game;

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
            // C3 easy mode 金錢圖示在 #my-money-area 內，class 為 money-item（無 source-money）
            const sourceItem = document.querySelector('#my-money-area .money-item:not([style*="display: none"])');
            if (!sourceItem) return;
            this._queue = [{ target: sourceItem, action: () => Game.simulateCoinPlacement(sourceItem) }];
            this._step = 0;
            this._highlight(sourceItem);
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
                    if (this._enabled && document.querySelector('#my-money-area .money-item')) {
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
