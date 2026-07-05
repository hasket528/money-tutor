// =================================================================
// FILE: js/f1_object_correspondence.js
// DESC: F1 物件對應 - 配置驅動版本
// 最後修正：2025.08.31 下午8:50 - 修正普通/困難模式物品放置位置和雙向拖拽功能
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
        // 使用方式：
        //   Game.Debug.FLAGS.all = true;      // 開啟全部
        //   Game.Debug.FLAGS.drag = true;     // 只開啟拖曳相關
        //   Game.Debug.FLAGS.speech = true;   // 只開啟語音相關
        // =====================================================
        Debug: {
            FLAGS: {
                all: false,        // 全域開關（開啟後顯示所有分類）
                init: false,       // 初始化相關
                speech: false,     // 語音系統
                audio: false,      // 音效系統
                ui: false,         // UI 渲染
                drag: false,       // 拖曳操作
                question: false,   // 題目生成
                state: false,      // 狀態變更
                timer: false,      // 計時器管理
                event: false,      // 事件管理
                game: false,       // 遊戲流程
                user: false,       // 用戶行為
                error: true        // 錯誤訊息（預設開啟）
            },

            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[F1-${category}]`, ...args);
                }
            },

            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[F1-${category}]`, ...args);
                }
            },

            error(...args) {
                // 錯誤訊息永遠顯示
                console.error('[F1-ERROR]', ...args);
            },

            // 向後兼容的舊方法（映射到新系統）
            logError(error, context = '') {
                this.error(context, error);
            },
            logGameFlow(action, data = null) {
                this.log('game', action, data || '');
            },
            logPlacementDrop(action, zoneType, itemInfo = null) {
                this.log('drag', `${action} - 區域: ${zoneType}`, itemInfo || '');
            },
            logUserAction(action, data = null) {
                this.log('user', action, data || '');
            },
            logAudio() { /* 已禁用 */ },
            logSpeech() { /* 已禁用 */ },
            logConfig() { /* 已禁用 */ },
            logPerformance() { /* 已禁用 */ },
            logUI() { /* 已禁用 */ },
            logState() { /* 已禁用 */ },
            logTemplate() { /* 已禁用 */ },
            group() { /* 已禁用 */ },
            groupStart(groupName) { /* 已禁用 */ },
            groupEnd() { /* 已禁用 */ }
        },
        // =====================================================
        // 🎯 配置驅動核心：ModeConfig
        // =====================================================
        ModeConfig: {
            easy: {
                modeType: 'one-to-one-correspondence', // 模式類型：一對一對應
                sourceHasDistractors: false,      // 來源區沒有干擾項
                targetGuides: true,               // 目標區有明確的放置提示框
                audioFeedback: true,
                speechFeedback: true,
                label: '簡單',
                description: '觀察上方的範例，將下方的物件拖曳到對應的位置，一個一個排好',
                
                // 語音模板配置
                speechTemplates: {
                    demonstration: "現在我來示範怎麼做。我們需要 {itemCount} 個 {itemName}，看我怎麼把它們一個一個放到對應的位置。",
                    initialInstruction: "請拖曳放置一樣的物品數量",
                    correctPlacement: "排對了！",
                    turnComplete: "全部都排好了，你真棒！",
                    encouragement: "做得很好！",
                    itemSelected: "已選擇 {itemName}，點擊空格來放置",
                    itemPlacedByClick: "點擊放置成功！",
                    itemReturnedByDrag: "{itemName} 已拖回物品區",
                    clickToPlace: "點擊物品來選擇，再點擊空格來放置",
                    addCustomItem: "已新增自訂圖示：{itemName}",
                    removeCustomItem: "已移除圖示：{itemName}"
                },
                
                // 文字模板配置
                textTemplates: {
                    progressText: "第 {current} / {total} 題",
                    correctFeedback: "放對了！",
                    gameComplete: "🎉 測驗結束 🎉",
                    excellentPerformance: "表現優異！",
                    goodPerformance: "表現良好！",
                    needImprovement: "要多加練習喔！"
                },
                
                // CSS 類名配置
                cssClasses: {
                    targetArea: "target-area easy-target",
                    sourceArea: "source-area easy-source",
                    draggableItem: "draggable-item easy-draggable",
                    dropZone: "drop-zone easy-drop-zone",
                    draggedOver: "drag-over",
                    dragging: "dragging",
                    touchDragging: "touch-dragging",
                    placed: "placed",
                    filled: "filled",
                    selectedItem: "selected-item",
                    clickableItem: "clickable-item",
                    clickableZone: "clickable-zone",
                    staticItem: "static-item"
                },
                
                // 時間配置
                timing: {
                    speechDelay: 300,
                    nextQuestionDelay: 2000,
                    placementFeedbackDelay: 500
                },
                
                // UI配置
                uiElements: {
                    showTargetGuides: true,
                    showSourceContainer: true,
                    allowReposition: true
                },
                
                // 點擊操作配置
                clickToMoveConfig: {
                    enabled: true,                    // ✅ [重新啟用] 拖曳功能修復完成，重新啟用點擊功能
                    allowClickToPlace: false,         // 🔧 [修正] 禁用點擊選擇放置（僅保留拖曳，避免選擇效果/語音/位移）
                    allowClickToReturn: false,        // 簡單模式不允許點擊取回
                    audioFeedback: true,              // 點擊時播放音效
                    speechFeedback: true,             // 點擊時語音回饋
                    visualSelection: true,            // 顯示選擇的視覺效果
                    selectionTimeout: 0               // 選擇狀態持續時間，0表示需要點擊確認
                },
                
                // 動畫配置
                animations: {
                    fadeInDuration: 300,
                    placementSnapDuration: 200,
                    successCelebration: true
                },
                
                // 觸控拖曳配置
                touchDragConfig: {
                    enabled: true,                 // 啟用觸控拖曳
                    sensitivity: 'high',           // 觸控靈敏度：high, medium, low
                    createCloneDelay: 0,           // 🔧 [修復] 立即建立拖曳複製，避免透明殘影
                    visualFeedback: {
                        dragOpacity: 1.0,          // 🔧 [修復] 不透明化拖曳物件，避免透明殘影
                        cloneScale: 1.0,           // 🔧 [修復] 不縮放拖曳複製，避免視覺干擾
                        hoverEffect: true,         // 保留放置區懸停效果
                        cleanupOnDrop: true        // 🔧 [修復] 確保放置後清理拖曳複製
                    },
                    selectors: {
                        draggable: '.draggable-item:not(.static-item), .placed-item',
                        dropZone: '.drop-zone, .placement-zone, .placement-guide, .source-container'
                    }
                },
                
                // 事件類型配置
                eventTypes: {
                    dragStart: 'dragstart',
                    dragEnd: 'dragend',
                    dragOver: 'dragover',
                    dragEnter: 'dragenter',
                    dragLeave: 'dragleave',
                    drop: 'drop',
                    click: 'click',
                    touchStart: 'touchstart',
                    touchMove: 'touchmove',
                    touchEnd: 'touchend'
                }
            },
            
            normal: {
                modeType: 'quantity-to-numeral',    // 模式類型：具體物件對應抽象數字
                sourceHasDistractors: true,         // 來源區有干擾項 (例如需要4個，但提供6個)
                targetGuides: false,                // 目標區沒有提示框 (例如一個大容器)
                audioFeedback: true,
                speechFeedback: true,
                optionsCount: 3,                    // 用於顯示數字選項
                label: '普通',
                description: '將正確數量的物件拖曳到指定的區域中',
                
                // 語音模板配置
                speechTemplates: {
                    initialInstruction: "請將 {targetCount} 個物品拖曳到對應框的放置區，完成後按下完成按鈕",
                    correctPlacement: "已放置",            // 每放一個的回饋
                    turnComplete: "答對了！正確答案是 {targetCount} 個",
                    chooseAnswer: "請檢查您的放置是否正確，然後按下完成按鈕",
                    correct: "答對了！正確答案是 {targetCount} 個",
                    incorrect: "數量不正確，您放置了 {targetCount} 個，正確答案是 {correctAnswer} 個",
                    itemSelected: "已選擇 {itemName}，點擊放置區來放置",
                    itemPlacedByClick: "點擊放置成功！",
                    itemReturnedByClick: "物品已移回物品區",
                    itemReturnedByDrag: "{itemName} 已拖回物品區",
                    clickToPlace: "點擊物品來選擇，再點擊放置區來放置",
                    clickToReturn: "點擊已放置的物品可以移回物品區",
                    addCustomItem: "已新增自訂圖示：{itemName}",
                    removeCustomItem: "已移除圖示：{itemName}"
                },
                
                // 文字模板配置
                textTemplates: {
                    progressText: "第 {current} / {total} 題",
                    correctFeedback: "答對了！正確答案是 {answer}",
                    incorrectFeedback: "答錯了，再試一次！",
                    gameComplete: "🎉 測驗結束 🎉",
                    excellentPerformance: "表現優異！",
                    goodPerformance: "表現良好！",
                    needImprovement: "要多加練習喔！"
                },
                
                // CSS 類名配置
                cssClasses: {
                    targetArea: "target-area normal-target",
                    sourceArea: "source-area normal-source",
                    draggableItem: "draggable-item normal-draggable",
                    dropZone: "drop-zone normal-drop-zone",
                    container: "quantity-container",
                    optionsGrid: "products-grid horizontal-layout",
                    optionButton: "payment-btn normal-mode-btn",
                    draggedOver: "drag-over",
                    dragging: "dragging",
                    touchDragging: "touch-dragging",
                    placed: "placed",
                    filled: "filled",
                    selectedItem: "selected-item",
                    clickableItem: "clickable-item",
                    clickableZone: "clickable-zone",
                    staticItem: "static-item"
                },
                
                // 時間配置
                timing: {
                    speechDelay: 300,
                    nextQuestionDelay: 2000,
                    retryDelay: 1500,
                    placementFeedbackDelay: 300
                },
                
                // UI配置
                uiElements: {
                    showTargetGuides: false,
                    showQuantityContainer: true,
                    showOptionsArea: true,
                    allowReposition: true  // 🔧 [修正] 啟用普通模式的拖回功能
                },
                
                // 點擊操作配置
                clickToMoveConfig: {
                    enabled: true,                    // ✅ [重新啟用] 拖曳功能修復完成，重新啟用點擊功能
                    allowClickToPlace: false,         // 🔧 [修正] 禁用點擊選擇放置（僅保留拖曳，避免選擇效果/語音/位移）
                    allowClickToReturn: true,         // 普通模式允許點擊取回
                    audioFeedback: true,              // 點擊時播放音效
                    speechFeedback: true,             // 點擊時語音回饋
                    visualSelection: true,            // 顯示選擇的視覺效果
                    selectionTimeout: 0               // 選擇狀態持續時間，0表示需要點擊確認
                },
                
                // 動畫配置
                animations: {
                    fadeInDuration: 300,
                    placementSnapDuration: 200,
                    incorrectShake: 300
                },
                
                // 觸控拖曳配置
                touchDragConfig: {
                    enabled: true,                 // 啟用觸控拖曳
                    sensitivity: 'high',           // 觸控靈敏度：high, medium, low
                    createCloneDelay: 0,           // 🔧 [修復] 立即建立拖曳複製，避免透明殘影
                    visualFeedback: {
                        dragOpacity: 1.0,          // 🔧 [修復] 不透明化拖曳物件，避免透明殘影
                        cloneScale: 1.0,           // 🔧 [修復] 不縮放拖曳複製，避免視覺干擾
                        hoverEffect: true,         // 保留放置區懸停效果
                        cleanupOnDrop: true        // 🔧 [修復] 確保放置後清理拖曳複製
                    },
                    selectors: {
                        draggable: '.draggable-item:not(.static-item), .placed-item',
                        dropZone: '.drop-zone, .placement-zone, .placement-guide, .source-container, .quantity-container'
                    }
                },
                
                // 事件類型配置
                eventTypes: {
                    dragStart: 'dragstart',
                    dragEnd: 'dragend',
                    dragOver: 'dragover',
                    dragEnter: 'dragenter',
                    dragLeave: 'dragleave',
                    drop: 'drop',
                    click: 'click',
                    touchStart: 'touchstart',
                    touchMove: 'touchmove',
                    touchEnd: 'touchend'
                }
            },
            
            hard: {
                modeType: 'multi-item-correspondence', // 模式類型：多物件對應
                sourceHasDistractors: true,        // 來源區有干擾項
                targetGuides: false,               // 目標區為統一放置區
                audioFeedback: true,               
                speechFeedback: true,              
                useHintButton: true,               // 使用提示按鈕
                label: '困難',
                description: '請將物品區的圖示，拖曳到對應框中指定的數量',
                
                // 語音模板配置
                speechTemplates: {
                    initialInstruction: "請觀察對應框中的目標，將物品拖曳到放置區",
                    correctPlacement: "已放置",            // 每放一個的回饋
                    correct: "答對了，太棒了！",
                    incorrect: "不對喔，請檢查目標和您放置的物品，再試一次！",
                    turnComplete: "全部都對了，真厲害！",
                    hintUsed: "提示來了！看看哪些東西是我們需要的吧！",
                    invalidDrop: "這個不是我們需要的東西喔。",
                    itemSelected: "已選擇 {itemName}，點擊放置區來放置",
                    itemPlacedByClick: "點擊放置成功！",
                    itemReturnedByClick: "物品已移回物品區",
                    itemReturnedByDrag: "{itemName} 已拖回物品區",
                    clickToPlace: "點擊物品來選擇，再點擊放置區來放置",
                    clickToReturn: "點擊已放置的物品可以移回物品區",
                    addCustomItem: "已新增自訂圖示：{itemName}",
                    removeCustomItem: "已移除圖示：{itemName}"
                },
                
                // 文字模板配置
                textTemplates: {
                    progressText: "第 {current} / {total} 題",
                    correctFeedback: "答對了！",
                    incorrectFeedback: "答錯了，再試一次！",
                    gameComplete: "🎉 測驗結束 🎉",
                    excellentPerformance: "表現優異！",
                    goodPerformance: "表現良好！",
                    needImprovement: "要多加練習喔！"
                },
                
                // CSS 類名配置
                cssClasses: {
                    targetArea: "target-area hard-target",
                    sourceArea: "source-area hard-source",
                    draggableItem: "draggable-item hard-draggable",
                    placementZone: "placement-zone hard-placement-zone",
                    draggedOver: "drag-over",
                    dragging: "dragging",
                    touchDragging: "touch-dragging",
                    placed: "placed",
                    filled: "filled",
                    selectedItem: "selected-item",
                    clickableItem: "clickable-item",
                    clickableZone: "clickable-zone",
                    staticItem: "static-item"
                },
                
                // 時間配置
                timing: {
                    speechDelay: 300,
                    nextQuestionDelay: 2500,
                    hintAnimationDuration: 1500,
                    invalidDropReturnDuration: 300
                },
                
                // UI配置
                uiElements: {
                    showPlacementZone: true,
                    showReferenceItems: true,
                    showCompletionButton: true,
                    showHintButton: true,
                    allowReposition: true  // 🔧 [修正] 啟用困難模式的拖回功能
                },
                
                // 點擊操作配置
                clickToMoveConfig: {
                    enabled: true,                    // ✅ [重新啟用] 拖曳功能修復完成，重新啟用點擊功能
                    allowClickToPlace: false,         // 🔧 [修正] 困難模式禁用點擊選擇放置（僅保留拖曳，避免選擇效果/語音/位移）
                    allowClickToReturn: true,         // 困難模式允許點擊取回
                    audioFeedback: true,              // 點擊時播放音效
                    speechFeedback: true,             // 點擊時語音回饋
                    visualSelection: true,            // 顯示選擇的視覺效果
                    selectionTimeout: 0               // 選擇狀態持續時間，0表示需要點擊確認
                },
                
                // 動畫配置
                animations: {
                    fadeInDuration: 300,
                    successBounce: true,
                    errorShake: true,
                    hintGlow: true
                },
                
                // 觸控拖曳配置
                touchDragConfig: {
                    enabled: true,                 // 啟用觸控拖曳
                    sensitivity: 'high',           // 觸控靈敏度：high, medium, low
                    createCloneDelay: 0,           // 🔧 [修復] 立即建立拖曳複製，避免透明殘影
                    visualFeedback: {
                        dragOpacity: 1.0,          // 🔧 [修復] 不透明化拖曳物件，避免透明殘影
                        cloneScale: 1.0,           // 🔧 [修復] 不縮放拖曳複製，避免視覺干擾
                        hoverEffect: true,         // 保留放置區懸停效果
                        cleanupOnDrop: true        // 🔧 [修復] 確保放置後清理拖曳複製
                    },
                    selectors: {
                        draggable: '.draggable-item:not(.static-item), .placed-item',
                        dropZone: '.target-grid-item, .placement-zone, .placement-guide, .source-container'
                    }
                },
                
                // 事件類型配置
                eventTypes: {
                    dragStart: 'dragstart',
                    dragEnd: 'dragend',
                    dragOver: 'dragover',
                    dragEnter: 'dragenter',
                    dragLeave: 'dragleave',
                    drop: 'drop',
                    click: 'click',
                    touchStart: 'touchstart',
                    touchMove: 'touchmove',
                    touchEnd: 'touchend'
                }
            }
        },

        // =====================================================
        // 🎨 StyleConfig - CSS配置驅動系統
        // =====================================================
        StyleConfig: {
            // 基礎樣式配置 - F1 拖拽介面
            base: {
                correspondenceLayout: {
                    width: '100%',
                    minHeight: '600px',
                    background: '#f8f9fa',
                    borderRadius: '15px',
                    padding: '20px'
                },
                targetArea: {
                    background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                    border: '3px solid #2196f3',
                    borderRadius: '15px',
                    padding: '20px',
                    marginBottom: '20px',
                    minHeight: '200px'
                },
                sourceArea: {
                    background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
                    border: '3px solid #ff9800',
                    borderRadius: '15px',
                    padding: '20px',
                    minHeight: '150px'
                },
                draggableItem: {
                    fontSize: '3rem',
                    padding: '10px', // 稍微減少內邊距以適應固定大小
                    borderRadius: '12px',
                    border: '2px solid #4caf50',
                    background: '#e8f5e8',
                    cursor: 'grab',
                    transition: 'all 0.3s ease',
                    userSelect: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    // --- 【關鍵修正】 ---
                    // 將彈性的 min-width/height 改為與 drop-zone 相同的固定 width/height
                    width: '80px',
                    height: '80px',
                    // 添加 box-sizing 確保 padding 和 border 不會撐大方框
                    boxSizing: 'border-box'
                },
                dropZone: {
                    width: '80px',
                    height: '80px',
                    border: '3px dashed #9e9e9e',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    background: 'rgba(255,255,255,0.8)'
                },
                quantityContainer: {
                    minHeight: '120px',
                    border: '3px dashed #9c27b0',
                    borderRadius: '15px',
                    background: 'linear-gradient(135deg, #fce4ec, #f8bbd9)',
                    padding: '20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    gap: '10px',
                    transition: 'all 0.3s ease'
                },
                // 點擊操作樣式
                clickableItem: {
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                },
                selectedItem: {
                    border: '3px solid #2196f3 !important',
                    background: 'linear-gradient(135deg, #e3f2fd, #bbdefb) !important',
                    transform: 'scale(1.05)',
                    boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
                    zIndex: '10'
                },
                clickableZone: {
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                }
            },
            
            // F1 模式特定樣式
            easy: {
                draggableItem: {
                    border: '2px solid #4caf50',
                    background: 'linear-gradient(135deg, #e8f5e8, #c8e6c9)',
                    boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)'
                },
                dropZone: {
                    border: '3px dashed #4caf50',
                    background: 'rgba(232, 245, 232, 0.5)'
                },
                dropZoneHover: {
                    borderColor: '#2e7d32',
                    background: 'rgba(232, 245, 232, 0.8)',
                    transform: 'scale(1.05)'
                },
                guideText: {
                    fontSize: '0.8rem',
                    color: '#2e7d32',
                    fontWeight: 'bold'
                }
            },
            
            normal: {
                draggableItem: {
                    border: '2px solid #ff9800',
                    background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
                    boxShadow: '0 4px 8px rgba(255, 152, 0, 0.3)'
                },
                quantityContainer: {
                    border: '3px dashed #9c27b0',
                    background: 'linear-gradient(135deg, #fce4ec, #f8bbd9)'
                },
                quantityContainerHover: {
                    borderColor: '#7b1fa2',
                    background: 'linear-gradient(135deg, #f8bbd9, #f48fb1)',
                    transform: 'scale(1.02)'
                },
                optionButton: {
                    fontSize: '1.8rem',
                    padding: '15px 25px',
                    minWidth: '80px',
                    height: '70px',
                    border: '3px solid #9c27b0',
                    borderRadius: '15px',
                    background: '#ffffff',
                    color: '#9c27b0',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(156, 39, 176, 0.2)'
                }
            },
            
            hard: {
                connectionCard: {
                    padding: '15px',
                    border: '2px solid #f44336',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ffebee, #ffcdd2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    margin: '5px 0',
                    fontSize: '2rem',
                    textAlign: 'center',
                    minHeight: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                },
                connectionNumber: {
                    padding: '15px 25px',
                    border: '2px solid #3f51b5',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #e8eaf6, #c5cae9)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    margin: '5px 0',
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    minWidth: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                },
                selectedCard: {
                    borderColor: '#d32f2f',
                    background: 'linear-gradient(135deg, #ffcdd2, #ef9a9a)',
                    transform: 'scale(1.05)',
                    boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)'
                },
                connectedCard: {
                    borderColor: '#4caf50',
                    background: 'linear-gradient(135deg, #e8f5e8, #c8e6c9)',
                    opacity: '0.8'
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
            title: "單元F1：數與物的對應",
            subtitle: "將抽象的數字與具體物品進行一對一配對，建立數量概念的基礎認知",
            // 🔧 改用 EmojiLibrary 統一管理（如果未載入則使用備用）
            // 使用快取避免每次存取都建立新物件（修正自訂主題圖示無法保留的問題）
            _themesCache: null,
            get themes() {
                if (!this._themesCache) {
                    if (typeof EmojiLibrary !== 'undefined') {
                        this._themesCache = {
                            default: [...EmojiLibrary.food.fruits, ...EmojiLibrary.animals.mammals, ...EmojiLibrary.services.transport],
                            fruits:  EmojiLibrary.food.fruits,
                            animals: EmojiLibrary.animals.mammals,
                            vehicles: EmojiLibrary.services.transport,
                            custom: [] // 自訂主題（動態載入自訂圖示）
                        };
                    } else {
                        // 備用定義（如果 EmojiLibrary 未載入）
                        this._themesCache = {
                            default: ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍍', '🍉', '🍑', '🍒', '🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '🚚', '🚲', '🚀', '✈️'],
                            fruits:  ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍍', '🍉', '🍑', '🍒'],
                            animals: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁'],
                            vehicles:['🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '🚚', '🚲', '🚀', '✈️'],
                            custom: []
                        };
                    }
                }
                return this._themesCache;
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
            startTime: null, // 遊戲開始時間
            userCountProgress: 0,
            isAnswering: false,
            customItems: [], // 自訂主題圖示和名稱
            selectedClickItem: null, // 點擊選中的物品
            audioUnlocked: false, // 🔧 [新增] 手機音頻解鎖狀態
            settings: {
                difficulty: null,
                theme: 'default',
                questionCount: null,
                testMode: 'single', // 固定為單次作答，不適合反複作答
                countingRange: null, // 數數範圍設定
                assistClick: false
            }
        },

        // =====================================================
        // DOM Elements
        // =====================================================
        elements: {},

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
                Game.Debug.log('timer', `⏱️ 清理所有計時器: ${this.timers.size} 個`);
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
                    Game.Debug.log('timer', `⏱️ 清理 ${category} 類別計時器: ${count} 個`);
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
                Game.Debug.log('event', `🎧 清理所有事件監聽器: ${this.listeners.length} 個`);
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
                    Game.Debug.log('event', `🎧 清理 ${category} 類別事件監聽器: ${count} 個`);
                }
            }
        },

        // =====================================================
        // 🎬 全局動畫樣式注入（避免重複定義）
        // =====================================================
        injectGlobalAnimationStyles() {
            if (document.getElementById('f1-global-animations')) return;

            const css = `
                @keyframes bounce {
                    0%, 20%, 60%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-20px); }
                    80% { transform: translateY(-10px); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes sparkle {
                    0%, 100% { transform: rotate(0deg) scale(1); opacity: 1; }
                    50% { transform: rotate(180deg) scale(1.2); opacity: 0.8; }
                }
                @keyframes pulse {
                    0%, 100% { box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4); }
                    50% { box-shadow: 0 8px 32px rgba(102, 126, 234, 0.6); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
                @keyframes celebrate {
                    0% { transform: scale(0.8) rotate(-10deg); opacity: 0; }
                    50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(52, 152, 219, 0.4); }
                    50% { box-shadow: 0 0 30px rgba(52, 152, 219, 0.8); }
                }
                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 4px 15px rgba(255, 152, 0, 0.4); }
                    50% { box-shadow: 0 8px 25px rgba(255, 152, 0, 0.7); }
                }
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes pair-success-anim {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); filter: drop-shadow(0 0 8px #4caf50); }
                }
                @keyframes error-shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                @keyframes hintPulse {
                    0%, 100% { box-shadow: 0 6px 20px rgba(225, 112, 85, 0.3); transform: scale(1); }
                    50% { box-shadow: 0 8px 25px rgba(225, 112, 85, 0.5); transform: scale(1.02); }
                }
                @keyframes revealBounceIn {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    60% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
                @keyframes numberGlow {
                    0% { text-shadow: 3px 3px 6px rgba(0,0,0,0.4); }
                    100% { text-shadow: 3px 3px 6px rgba(0,0,0,0.4), 0 0 20px #ffeaa7; }
                }
                @keyframes revealBounceOut {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
                }
                @keyframes inputPromptPulseGlow {
                    0%, 100% { box-shadow: 0 8px 25px rgba(255, 71, 87, 0.3); transform: scale(1); }
                    50% { box-shadow: 0 12px 35px rgba(255, 71, 87, 0.5); transform: scale(1.02); }
                }
                @keyframes popupBounceIn {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
                @keyframes hint-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                @keyframes hint-glow {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(255, 193, 7, 0.6); border-color: #ffc107; }
                    50% { transform: scale(1.08); box-shadow: 0 0 25px rgba(255, 193, 7, 1); border-color: #ff9800; }
                }
                .pair-success { animation: pair-success-anim 0.5s ease-in-out; }
                .error-shake { animation: error-shake 0.6s ease-in-out; border-color: #f44336 !important; }
                .hint-glow { animation: hint-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; border: 3px solid #ffc107 !important; z-index: 10; position: relative; transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1); }

                @keyframes f1AssistBoxPulse {
                    0%, 100% { border-color: #FFC107; box-shadow: 0 0 8px rgba(255,193,7,0.6); outline-color: #FFC107; outline-offset: 4px; }
                    50% { border-color: #FFE082; box-shadow: 0 0 20px rgba(255,193,7,1); outline-color: #FFE082; outline-offset: 8px; }
                }
                @keyframes f1AssistBounce {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(-5px); }
                }
                .assist-click-hint {
                    position: relative !important;
                    z-index: 100 !important;
                    overflow: visible !important;
                    outline: 4px solid #FFC107 !important;
                    outline-offset: 4px;
                    box-shadow: 0 0 25px rgba(255,193,7,0.8) !important;
                    animation: f1AssistBoxPulse 1.5s ease-in-out infinite !important;
                }
                .assist-click-hint::before {
                    content: '' !important;
                    position: absolute !important;
                    top: -10px !important;
                    left: -10px !important;
                    right: -10px !important;
                    bottom: -10px !important;
                    border: 3px solid #FFC107 !important;
                    border-radius: 10px !important;
                    animation: f1AssistBoxPulse 1.5s ease-in-out infinite !important;
                    pointer-events: none !important;
                    z-index: 99 !important;
                }
                .assist-click-hint::after {
                    content: '👇 點這裡' !important;
                    position: absolute !important;
                    top: -48px !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    background: linear-gradient(135deg, #FFC107 0%, #FFD54F 100%) !important;
                    padding: 8px 16px !important;
                    border-radius: 20px !important;
                    color: white !important;
                    font-weight: bold !important;
                    font-size: 14px !important;
                    white-space: nowrap !important;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
                    animation: f1AssistBounce 1s ease-in-out infinite !important;
                    pointer-events: none !important;
                    z-index: 1000 !important;
                }
            `;

            const style = document.createElement('style');
            style.id = 'f1-global-animations';
            style.innerHTML = css;
            document.head.appendChild(style);
            Game.Debug.log('init', '🎬 全局動畫樣式已注入');
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
            this.state.startTime = null;
            this.state.userCountProgress = 0;
            this.state.isAnswering = false;
            this.state.isStartingNewTurn = false;
            this.state.isEndingGame = false;
            this.state.selectedClickItem = null;

            // 模式相關狀態
            this.state.easyMode = null;
            this.state.normalMode = null;
            this.state.hardMode = null;

            // 拖曳/放置相關狀態
            this.state.correctPlacements = 0;
            this.state.draggedItems = [];
            this.state.selectedCard = null;
            this.state.placedCount = 0;
            this.state.placedItems = [];

            Game.Debug.log('state', '🔄 遊戲狀態已重置');
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
                    .correspondence-layout {
                        ${this.objectToCSS(baseStyles.correspondenceLayout || {})}
                    }
                    .target-area {
                        ${this.objectToCSS(baseStyles.targetArea || {})}
                    }
                    .source-area {
                        ${this.objectToCSS(baseStyles.sourceArea || {})}
                    }
                    .draggable-item {
                        ${this.objectToCSS(baseStyles.draggableItem || {})}
                    }
                    .drop-zone {
                        ${this.objectToCSS(baseStyles.dropZone || {})}
                    }
                    .quantity-container {
                        ${this.objectToCSS(baseStyles.quantityContainer || {})}
                    }
                    .draggable-item:hover {
                        cursor: grab;
                    }
                    .dragging {
                        opacity: 0.5;
                        transform: none;
                    }
                    .drag-over {
                        border-color: #4caf50 !important;
                        background-color: #e8f5e8 !important;
                        box-shadow: 0 0 10px rgba(76, 175, 80, 0.5) !important;
                        transform: scale(1.05) !important;
                        transition: all 0.2s ease !important;
                    }
                    .clickable-item {
                        ${this.objectToCSS(baseStyles.clickableItem || {})}
                    }
                    .clickable-item:hover {
                        background-color: rgba(33, 150, 243, 0.1) !important;
                        border-color: #2196f3 !important;
                        transform: scale(1.02);
                    }
                    .selected-item {
                        ${this.objectToCSS(baseStyles.selectedItem || {})}
                    }
                    .clickable-zone {
                        ${this.objectToCSS(baseStyles.clickableZone || {})}
                    }
                    .clickable-zone:hover {
                        background-color: rgba(33, 150, 243, 0.05) !important;
                        border-color: #2196f3 !important;
                    }
                    .connection-area {
                        display: flex;
                        gap: 40px;
                        padding: 20px;
                        justify-content: center;
                    }
                    .connection-panels {
                        display: flex;
                        gap: 40px;
                        width: 100%;
                        max-width: 800px;
                    }
                    .connection-left-panel, .connection-right-panel {
                        flex: 1;
                        padding: 20px;
                        border: 2px solid #ddd;
                        border-radius: 12px;
                        background: #f8f9fa;
                    }
                    .target-container, .source-container, .cards-container, .numbers-container {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        justify-content: center;
                        align-items: flex-start;
                        padding: 10px;
                    }
                    
                    /* AI助手介面樣式 */
                    .page-header {
                        text-align: center;
                        margin-bottom: 40px;
                    }
                    
                    .ai-assistant-intro {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 15px;
                        margin-top: 20px;
                        max-width: 600px;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    
                    .ai-avatar {
                        font-size: 3em;
                        animation: bounce 2s infinite;
                    }

                    /* 🔧 [Bug修復] @keyframes bounce 已移至全局動畫樣式 */

                    .ai-speech-bubble {
                        background: var(--card-bg, #ffffff);
                        padding: 15px 20px;
                        border-radius: 20px 20px 20px 5px;
                        box-shadow: var(--card-shadow, 0 4px 15px rgba(0, 0, 0, 0.08));
                        position: relative;
                        max-width: 400px;
                    }
                    
                    .ai-speech-bubble::before {
                        content: '';
                        position: absolute;
                        left: -10px;
                        bottom: 10px;
                        width: 0;
                        height: 0;
                        border: 10px solid transparent;
                        border-right-color: var(--card-bg, #ffffff);
                    }
                    
                    .ai-speech-bubble p {
                        margin: 0;
                        color: var(--text-primary, #334e68);
                        font-size: 0.95em;
                        line-height: 1.4;
                    }
                    
                    /* 主題選擇器樣式 */
                    .theme-selector {
                        display: flex;
                        gap: 15px;
                        flex-wrap: wrap;
                        justify-content: center;
                        margin: 15px 0;
                    }
                    
                    .theme-option {
                        cursor: pointer;
                        transition: all 0.3s ease;
                        border-radius: 12px;
                        overflow: hidden;
                        border: 3px solid transparent;
                    }
                    
                    .theme-option.active {
                        border-color: var(--primary-color, #007bff);
                        box-shadow: 0 0 15px rgba(0, 123, 255, 0.3);
                    }
                    
                    .theme-preview {
                        padding: 15px;
                        text-align: center;
                        min-width: 120px;
                        background: #f8f9fa;
                        transition: all 0.3s ease;
                    }
                    
                    .ai-robot-preview {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }
                    
                    .dark-preview {
                        background: #1a1a2e;
                        color: #e2e8f0;
                    }
                    
                    .custom-preview {
                        background: var(--custom-bg, #f8f9fa);
                        color: var(--custom-text, #333);
                    }
                    
                    .preview-header {
                        font-weight: 600;
                        margin-bottom: 10px;
                        font-size: 0.9em;
                    }
                    
                    .preview-colors {
                        display: flex;
                        justify-content: center;
                        gap: 5px;
                    }
                    
                    .color-dot {
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        display: inline-block;
                    }
                    
                    .custom-color-1 { background: var(--custom-primary, #007bff); }
                    .custom-color-2 { background: var(--custom-secondary, #28a745); }
                    .custom-color-3 { background: var(--custom-bg, #f8f9fa); }
                    
                    /* 自訂主題控制項 */
                    .custom-theme-controls {
                        display: flex;
                        gap: 15px;
                        flex-wrap: wrap;
                        justify-content: center;
                        margin-top: 15px;
                        padding: 15px;
                        background: #f9f9f9;
                        border-radius: 10px;
                    }
                    
                    .color-control-group {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 5px;
                    }
                    
                    .color-control-group label {
                        font-size: 0.8em;
                        color: #666;
                        font-weight: 500;
                    }
                    
                    .color-control-group input[type="color"] {
                        width: 40px;
                        height: 40px;
                        border: none;
                        border-radius: 50%;
                        cursor: pointer;
                        background: none;
                    }
                    
                    /* 自訂主題上傳介面樣式 */
                    .custom-theme-setup {
                        border: 2px dashed #ddd;
                        border-radius: 10px;
                        padding: 20px;
                        margin: 15px 0;
                        background: #f9f9f9;
                    }
                    .custom-items-list {
                        min-height: 60px;
                        border: 1px solid #e0e0e0;
                        border-radius: 5px;
                        padding: 10px;
                        margin: 10px 0;
                        background: white;
                    }
                    .custom-item-row {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 5px 0;
                        border-bottom: 1px solid #f0f0f0;
                    }
                    .custom-item-row:last-child {
                        border-bottom: none;
                    }
                    .custom-item-row span {
                        flex: 1;
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
                        background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                        color: white;
                        font-weight: bold;
                    }
                    .upload-btn:hover {
                        background: linear-gradient(45deg, #FF5252, #26C6DA);
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
                        background: rgba(0, 0, 0, 0.7);
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
                        position: relative;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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
                    }
                    .modal-body {
                        padding: 20px;
                    }
                    .modal-footer {
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                        flex-direction: row !important;
                        gap: 20px !important;
                        padding: 20px 30px !important;
                        border-top: 1px solid #eee;
                    }
                    .close-btn {
                        background: #f44336;
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        cursor: pointer;
                        font-size: 18px;
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
                    .form-group {
                        margin: 15px 0;
                    }
                    .form-group label {
                        display: block;
                        margin-bottom: 5px;
                        font-weight: bold;
                    }
                    .form-group input {
                        width: 100%;
                        padding: 10px;
                        border: 2px solid #ddd;
                        border-radius: 5px;
                        font-size: 16px;
                        box-sizing: border-box;
                    }
                `;
            },
            
            generateModeSpecificCSS(difficulty, modeStyles) {
                let css = '';
                
                // F1 拖拽物件樣式
                if (modeStyles.draggableItem) {
                    css += `.draggable-item.${difficulty}-draggable { ${this.objectToCSS(modeStyles.draggableItem)} }`;
                }
                
                // F1 放置區域樣式
                if (modeStyles.dropZone) {
                    css += `.drop-zone.${difficulty}-drop-zone { ${this.objectToCSS(modeStyles.dropZone)} }`;
                }
                
                if (modeStyles.dropZoneHover) {
                    css += `.drop-zone.${difficulty}-drop-zone.drag-over { ${this.objectToCSS(modeStyles.dropZoneHover)} }`;
                }
                
                // [F3精確感應] 添加小框拖曳視覺回饋效果
                css += `.drop-zone.drag-over {
                    border-color: #4caf50 !important;
                    background-color: #e8f5e8 !important;
                    box-shadow: 0 0 10px rgba(76, 175, 80, 0.5) !important;
                    transform: scale(1.05) !important;
                    transition: all 0.2s ease !important;
                }`;
                
                css += `.target-grid-item.drag-over {
                    border-color: #4caf50 !important;
                    background-color: #e8f5e8 !important;
                    box-shadow: 0 0 10px rgba(76, 175, 80, 0.5) !important;
                    transform: scale(1.05) !important;
                    transition: all 0.2s ease !important;
                }`;
                
                // F1 數量容器樣式
                if (modeStyles.quantityContainer) {
                    css += `.quantity-container { ${this.objectToCSS(modeStyles.quantityContainer)} }`;
                }
                
                if (modeStyles.quantityContainerHover) {
                    css += `.quantity-container.drag-over { ${this.objectToCSS(modeStyles.quantityContainerHover)} }`;
                }
                
                // F1 選項按鈕樣式
                if (modeStyles.optionButton) {
                    css += `#options-area .payment-btn { ${this.objectToCSS(modeStyles.optionButton)} }`;
                    css += `#options-area .payment-btn:hover { 
                        background: #9c27b0 !important;
                        color: white !important;
                        transform: translateY(-3px) !important;
                        box-shadow: 0 6px 20px rgba(156, 39, 176, 0.4) !important;
                    }`;
                }
                
                // F1 困難模式連線樣式
                if (difficulty === 'hard') {
                    if (modeStyles.connectionCard) {
                        css += `.connection-card { ${this.objectToCSS(modeStyles.connectionCard)} }`;
                    }
                    
                    if (modeStyles.connectionNumber) {
                        css += `.connection-number { ${this.objectToCSS(modeStyles.connectionNumber)} }`;
                    }
                    
                    if (modeStyles.selectedCard) {
                        css += `.selected-card { ${this.objectToCSS(modeStyles.selectedCard)} }`;
                    }
                    
                    if (modeStyles.connectedCard) {
                        css += `.connected-card { ${this.objectToCSS(modeStyles.connectedCard)} }`;
                        css += `.connected-number { ${this.objectToCSS(modeStyles.connectedCard)} }`;
                    }
                }
                
                // 指引文字樣式
                if (modeStyles.guideText) {
                    css += `.guide-text { ${this.objectToCSS(modeStyles.guideText)} }`;
                }
                
                // 🔧 [修復] 當放置區域已填滿時，隱藏指引文字
                css += `.drop-zone.filled .guide-text { display: none !important; }`;
                css += `.target-grid-item.filled .position-hint { display: none !important; }`;
                
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
            /**
             * 🔧 [新增] 解鎖手機音頻播放權限
             * 在用戶首次互動時調用，解決iOS/Android音頻限制
             */
            async unlockAudio() {
                if (Game.state.audioUnlocked) {
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
                    
                    Game.state.audioUnlocked = true;
                    Game.Debug.logAudio('🔓 音頻權限解鎖成功', 'mobile-unlock');
                    
                    return true;
                } catch (error) {
                    Game.Debug.logAudio('⚠️ 音頻解鎖失敗，但繼續執行', 'mobile-unlock', error);
                    Game.state.audioUnlocked = true; // 設為true以避免重複嘗試
                    return false;
                }
            },

            playSound(soundType, difficulty, config, callback) {
                Game.Debug.logAudio('嘗試播放音效', soundType, { 
                    difficulty, 
                    audioFeedback: config?.audioFeedback,
                    audioUnlocked: Game.state.audioUnlocked
                });
                
                const soundMap = {
                    select: 'menu-select-sound',
                    correct: 'correct-sound',
                    correct02: 'correct02-sound',
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
                        
                        // 設置回調事件監聽器
                        if (callback) {
                            let callbackExecuted = false;
                            const safeCallback = () => {
                                if (!callbackExecuted) {
                                    callbackExecuted = true;
                                    Game.Debug.logAudio('音效播放完成回調', soundType);
                                    callback();
                                }
                            };
                            
                            // 監聽音效播放結束事件
                            audio.addEventListener('ended', safeCallback, { once: true });
                            audio.addEventListener('error', safeCallback, { once: true });
                            
                            // 安全措施：最多等待10秒
                            Game.TimerManager.setTimeout(safeCallback, 10000, 'audio');
                        }

                        audio.play()
                            .then(() => {
                                Game.Debug.logAudio('音效播放成功', soundType);
                            })
                            .catch(e => {
                                Game.Debug.logError(e, '音效播放失敗');
                                if (callback) callback();
                            });
                    } catch (error) {
                        Game.Debug.logError(error, '音效播放異常');
                        if (callback) callback();
                    }
                } else {
                    Game.Debug.logAudio('音效被配置關閉', soundType, { audioFeedback: config?.audioFeedback });
                    if (callback) callback();
                }
            }
        },

        // =====================================================
        // 🎆 煙火動畫系統（從F4移植）
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
                }, 200, 'ui');
            } else {
                Game.Debug.log('ui', '🎆 canvas-confetti不可用，使用純CSS煙火效果');
                this.showPureCSSFireworks();
            }
        },

        // 🎆 純CSS煙火效果（備選方案）
        showPureCSSFireworks() {
            const container = document.getElementById('fireworks-container');
            if (!container) return;
            
            // 創建多個煙火粒子
            for (let i = 0; i < 12; i++) {
                const particle = document.createElement('div');
                particle.className = 'firework-particle';
                particle.style.cssText = `
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: hsl(${Math.random() * 360}, 70%, 60%);
                    border-radius: 50%;
                    left: ${20 + Math.random() * 60}%;
                    top: ${20 + Math.random() * 60}%;
                    animation: fireworkExplode 1s ease-out forwards;
                    transform-origin: center;
                `;
                container.appendChild(particle);
                
                // 清理粒子
                Game.TimerManager.setTimeout(() => particle.remove(), 1000, 'animation');
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
                            // 🔧 [手機端修復] 優雅降級 - 在沒有語音的情況下繼續運行
                            Game.Debug.logSpeech('手機端無語音，啟用靜音模式', 'fallback', 'system');
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
                    audioUnlocked: Game.state.audioUnlocked,
                    replacements
                });
                
                // 🔧 [新增] 手機端音頻解鎖檢查
                if (!Game.state.audioUnlocked) {
                    Game.Debug.logSpeech('⚠️ 音頻權限未解鎖，跳過語音播放', templateKey, difficulty);
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'ui');
                    return;
                }
                
                // 停止所有正在播放的語音，防止重疊和多重回調
                if (this.synth.speaking) {
                    Game.Debug.logSpeech('停止之前的語音播放', templateKey, difficulty);
                    this.synth.cancel();
                }
                
                // 困難模式下，只允許結果反饋語音、輸入提示語音和初始指導語音
                const hardModeAllowedTemplates = ['correct', 'incorrect', 'incorrectWithAnswer', 'inputPrompt', 'initialInstruction'];
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

                // 🔧 [手機端修復] 檢查語音是否可用
                if (!this.voice) {
                    Game.Debug.logSpeech('手機端無語音，跳過語音播放', templateKey, difficulty);
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
        // HTML Templates - 統一管理
        // =====================================================
        HTMLTemplates: {
            settingsScreen(difficulty, theme, questionCount, countingRange, assistClick) {
                return `
                    <style>
                        /* 🔧 [FIX] 強制修正設定頁面 Modal 樣式 - V2 (修復置中問題) */
                        .image-preview-modal .modal-footer {
                            display: flex !important;
                            flex-direction: row !important;
                            justify-content: center !important;
                            align-items: center !important;
                            gap: 20px !important;
                            padding: 20px !important;
                            width: 100% !important;
                            box-sizing: border-box !important;
                        }

                        /* 防止按鈕外邊距干擾 */
                        .image-preview-modal .cancel-btn,
                        .image-preview-modal .confirm-btn {
                            margin: 0 !important;
                            flex: 0 0 auto !important;
                        }

                        /* 取消按鈕 - 紅色填滿，白字 */
                        .image-preview-modal .cancel-btn {
                            background: #dc3545 !important;
                            color: white !important;
                            border: none !important;
                            padding: 12px 30px !important;
                            border-radius: 25px !important;
                            font-size: 16px !important;
                            font-weight: bold !important;
                            cursor: pointer !important;
                            min-width: 120px !important;
                            transition: all 0.3s ease !important;
                            box-shadow: 0 4px 6px rgba(220, 53, 69, 0.2) !important;
                        }
                        .image-preview-modal .cancel-btn:hover {
                            background: #c82333 !important;
                            transform: translateY(-2px);
                            box-shadow: 0 6px 8px rgba(220, 53, 69, 0.3) !important;
                        }

                        /* 確認按鈕 - 綠色填滿，白字 */
                        .image-preview-modal .confirm-btn {
                            background: #28a745 !important;
                            color: white !important;
                            border: none !important;
                            padding: 12px 30px !important;
                            border-radius: 25px !important;
                            font-size: 16px !important;
                            font-weight: bold !important;
                            cursor: pointer !important;
                            min-width: 120px !important;
                            transition: all 0.3s ease !important;
                            box-shadow: 0 4px 6px rgba(40, 167, 69, 0.2) !important;
                        }
                        .image-preview-modal .confirm-btn:hover {
                            background: #218838 !important;
                            transform: translateY(-2px);
                            box-shadow: 0 6px 8px rgba(40, 167, 69, 0.3) !important;
                        }
                        /* 自訂主題清單樣式 */
                        .custom-items-list {
                            display: flex;
                            flex-direction: row;
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
                            width: fit-content;
                        }
                        .custom-item-row span { font-size: 12px; font-weight: bold; color: #333; }
                        /* Modal 標頭漸層 */
                        .modal-header {
                            background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                            color: white;
                            padding: 15px 20px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        .modal-header h3 { margin: 0; font-size: 18px; }
                        .close-btn { background: none; border: none; color: white; font-size: 20px; cursor: pointer; }
                        /* 自訂主題上傳按鈕樣式 */
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
                    </style>
                    <div class="unit-welcome">
                        <div class="welcome-content">
                            <div class="settings-title-row">
                                <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                                <h1>單元F1：數量與物品的對應</h1>
                            </div>
                            <div class="page-header">
                                <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">將抽象的數量與具體物品進行一對一配對，建立數量概念的基礎認知</p>
                            </div>
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
                                        啟用後，只要偵測到點擊，系統會自動依序完成拖曳物件進行一對一配對等所有操作。適合手部控制能力較弱的學習者使用。<br>
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
                                        <button class="selection-btn ${theme === 'default' ? 'active' : ''} ${difficulty === 'hard' ? 'disabled' : ''}"
                                                data-type="theme" data-value="default"
                                                ${difficulty === 'hard' ? 'disabled' : ''}>
                                            ${difficulty === 'hard' ? '❌ ' : ''}隨機 🎲
                                        </button>
                                        ${Object.keys(Game.gameData.themes).filter(key => key !== 'custom' && key !== 'default').map(key => `
                                            <button class="selection-btn ${theme === key ? 'active' : ''} ${difficulty === 'hard' ? 'disabled' : ''}"
                                                    data-type="theme" data-value="${key}"
                                                    ${difficulty === 'hard' ? 'disabled' : ''}>
                                                ${difficulty === 'hard' ? '❌ ' : ''}${key === 'fruits' ? '水果' : key === 'animals' ? '動物' : '交通工具'} ${Game.gameData.themes[key][0]}
                                            </button>
                                        `).join('')}
                                        ${difficulty !== 'hard' ? `
                                            <button class="selection-btn ${theme === 'custom' ? 'active' : ''}" 
                                                    data-type="theme" data-value="custom">
                                                🎨 自訂主題
                                            </button>
                                        ` : ''}
                                    </div>
                                    ${difficulty === 'hard' ? `
                                        <p style="color: #666; font-style: italic; text-align: center; padding: 10px; margin-top: 10px;">
                                            困難模式使用多種圖示主題，無需選擇單一主題
                                        </p>
                                    ` : ''}
                                </div>
                                
                                <!-- 🔧 [新增] 自訂主題設定容器 -->
                                <div id="custom-theme-container">
                                    ${theme === 'custom' && difficulty !== 'hard' ? `
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
                                                <button type="button" onclick="Game.triggerImageUpload()" class="upload-btn">📸 上傳圖片</button>
                                            </div>
                                        
                                        <!-- 圖片預覽模態視窗 -->
                                        <div id="image-preview-modal" class="image-preview-modal">
                                            <div class="modal-overlay" onclick="Game.closeImagePreview()"></div>
                                            <div class="modal-content">
                                                <div class="modal-header">
                                                    <h3>🎁 新增自訂圖示</h3>
                                                    <button onclick="Game.closeImagePreview()" class="close-btn">✕</button>
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
                                                    <button onclick="Game.closeImagePreview()" class="cancel-btn">取消</button>
                                                    <button onclick="Game.confirmAddCustomItem()" class="confirm-btn">確認新增</button>
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
                                        <input type="text" id="custom-question-count-f1"
                                               value="${questionCount !== null && ![1,3,5,10].includes(questionCount) ? questionCount + '題' : ''}"
                                               placeholder="請輸入題數"
                                               style="padding: 8px; border-radius: 5px; border: 2px solid ${questionCount !== null && ![1,3,5,10].includes(questionCount) ? '#667eea' : '#ddd'}; background: ${questionCount !== null && ![1,3,5,10].includes(questionCount) ? '#667eea' : 'white'}; color: ${questionCount !== null && ![1,3,5,10].includes(questionCount) ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                                               readonly onclick="Game.handleCustomQuestionClick()">
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
                    <div class="correspondence-layout">
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
                        <div class="correspondence-frame" style="padding: 20px;">
                            <div id="source-area" class="source-area"></div>
                            <div id="target-area" class="target-area"></div>
                            ${config.uiElements.showOptionsArea ? '<div id="options-area" class="product-selection-area" style="justify-content: center; margin-top: 20px;"></div>' : ''}
                        </div>
                        
                        <div class="fireworks-container" id="fireworks-container"></div>
                    </div>
                `;
            },
            
            // *** REFACTORED *** 配置驅動遊戲樣式生成器
            gameStyles() {
                const difficulty = Game.state.settings.difficulty || 'normal';
                Game.Debug.logTemplate('配置驅動樣式生成', { difficulty });
                return Game.CSSGenerator.generateCSS(difficulty);
            },

            

            // F1 拖曳物件項目
            draggableItem(icon, index, difficulty) {
                const config = Game.ModeConfig[difficulty];
                const cssConfig = config.cssClasses || {};
                const itemClass = cssConfig.draggableItem || `draggable-item ${difficulty}-draggable`;
                
                Game.Debug.logTemplate('draggableItem', { 
                    icon, 
                    index, 
                    difficulty, 
                    itemClass 
                });
                
                // 檢查是否為base64圖片資料（自訂主題）
                const isCustomImage = icon.startsWith('data:image/');
                const iconDisplay = isCustomImage ? 
                    `<img src="${icon}" alt="自訂圖示" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; pointer-events: none; user-select: none;">` : 
                    icon;
                
                return `<div class="${itemClass}" 
                    data-id="${index}"
                    data-icon="${icon}"
                    draggable="true"
                    onclick="event.stopPropagation(); Game.handleItemClick(event)"
                    >${iconDisplay}</div>`;
            },

            // F1 靜態範例物件 (老師的物件)
            staticItem(icon, difficulty) {
                const config = Game.ModeConfig[difficulty];
                const cssConfig = config.cssClasses || {};
                const itemClass = cssConfig.draggableItem || `draggable-item ${difficulty}-draggable`;
                
                Game.Debug.logTemplate('staticItem', { 
                    icon,
                    difficulty, 
                    itemClass: `${itemClass} static-item`
                });
                
                // 檢查是否為base64圖片資料（自訂主題）
                const isCustomImage = icon.startsWith('data:image/');
                const iconDisplay = isCustomImage ? 
                    `<img src="${icon}" alt="自訂圖示" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; pointer-events: none; user-select: none;">` : 
                    icon;
                
                // 移除了 draggable 和 ondragstart 等事件屬性
                return `<div class="${itemClass} static-item">${iconDisplay}</div>`;
            },

            // F1 目標放置區域
            dropZone(index, difficulty, hasGuide = true) {
                const config = Game.ModeConfig[difficulty];
                const cssConfig = config.cssClasses || {};
                const zoneClass = cssConfig.dropZone || `drop-zone ${difficulty}-drop-zone`;
                const guideClass = hasGuide ? 'with-guide' : 'no-guide';
                
                Game.Debug.logTemplate('dropZone', { 
                    index, 
                    difficulty, 
                    hasGuide,
                    zoneClass: `${zoneClass} ${guideClass}`
                });
                
                return `<div class="${zoneClass} ${guideClass}" 
                    data-drop-index="${index}"
                    >${hasGuide ? '<span class="guide-text">放這裡</span>' : ''}</div>`;
            },

            // F1 連線卡片（困難模式）
            connectionCard(icon, count, index, difficulty) {
                const config = Game.ModeConfig[difficulty];
                const cssConfig = config.cssClasses || {};
                const cardClass = cssConfig.cardItem || 'connection-card';
                
                Game.Debug.logTemplate('connectionCard', { 
                    icon, 
                    count,
                    index, 
                    difficulty, 
                    cardClass 
                });
                
                return `<div class="${cardClass}" 
                    data-card-index="${index}"
                    data-count="${count}"
                    onclick="Game.handleCardClick(event)"
                    >${icon.repeat(count)}</div>`;
            },

            // F1 數字選項（困難模式）
            numberOption(number, index, difficulty) {
                const config = Game.ModeConfig[difficulty];
                const cssConfig = config.cssClasses || {};
                const numberClass = cssConfig.numberOption || 'connection-number';
                
                Game.Debug.logTemplate('numberOption', { 
                    number, 
                    index, 
                    difficulty, 
                    numberClass 
                });
                
                return `<div class="${numberClass}" 
                    data-number-index="${index}"
                    data-number="${number}"
                    onclick="Game.handleNumberClick(event)"
                    >${number}</div>`;
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
                        padding: 15px;
                        margin: 0;
                        text-align: center;
                        max-width: 160px;
                        width: 160px;
                        box-shadow: 0 6px 20px rgba(225, 112, 85, 0.3);
                        cursor: pointer;
                        transition: all 0.3s ease;
                        animation: hintPulse 3s infinite;
                    ">
                        <div style="
                            font-size: 2em;
                            margin-bottom: 8px;
                        ">💡</div>
                        <div style="
                            font-size: 1.2em;
                            color: #2d3436;
                            font-weight: bold;
                            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                        ">需要提示？</div>
                        <div style="
                            font-size: 0.9em;
                            color: #636e72;
                            margin-top: 5px;
                        ">點我看答案</div>
                    </div>
                    <style>
                        #hint-box:hover {
                            transform: scale(1.05) !important;
                            box-shadow: 0 10px 30px rgba(225, 112, 85, 0.6) !important;
                            background: linear-gradient(135deg, #fdcb6e, #e84393) !important;
                        }
                    </style>
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
                `;
            },

            // 困難模式輸入提示框和提示框的容器
            inputPromptContainer(promptText) {
                return `
                    <div class="input-prompt-container" style="
                        display: grid;
                        grid-template-columns: 1fr 350px 1fr;
                        grid-template-areas: 'left center right';
                        align-items: start;
                        margin: 20px auto;
                        max-width: 1000px;
                        padding: 0 20px;
                        gap: 20px;
                    ">
                        <!-- 左側空白區域 -->
                        <div style="grid-area: left;"></div>
                        
                        <!-- 置中的輸入提示框 -->
                        <div style="
                            grid-area: center;
                            display: flex;
                            justify-content: center;
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
                                animation: inputPromptPulseGlow 2s infinite;
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
                        
                        <!-- 靠右對齊的提示框 -->
                        <div style="
                            grid-area: right;
                            display: flex;
                            justify-content: flex-start;
                        ">
                            ${this.hintBox()}
                        </div>
                    </div>
                    <style>
                        #input-prompt-box:hover {
                            transform: scale(1.05) !important;
                            box-shadow: 0 15px 40px rgba(255, 71, 87, 0.6) !important;
                            background: linear-gradient(135deg, #ff5252, #ff7979) !important;
                        }
                        
                        @media (max-width: 800px) {
                            .input-prompt-container {
                                grid-template-columns: 1fr !important;
                                grid-template-areas: 
                                    'center'
                                    'right' !important;
                                gap: 15px !important;
                                text-align: center !important;
                            }
                            
                            .input-prompt-container > div:first-child {
                                display: none !important;
                            }
                            
                            .input-prompt-container > div:last-child {
                                justify-content: center !important;
                            }
                            
                            #input-prompt-box {
                                max-width: 300px !important;
                                font-size: 0.9em;
                            }
                        }
                    </style>
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
                        animation: popupBounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
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
                    <style>
                        .feedback-popup {
                            cursor: pointer;
                            user-select: none;
                        }
                        
                        .feedback-popup:hover {
                            transform: translate(-50%, -50%) scale(1.05) !important;
                            transition: transform 0.2s ease;
                        }
                    </style>
                `;
            }
        },

        // =====================================================
        // 🎯 已移除 CrossPlatformDragManager - 改用整合的 HTML5DragSystem
        // =====================================================

        // =====================================================
        // Settings Screen
        // =====================================================


        // 🔧 [新增] 更新自訂主題設定區域（避免整頁重新渲染）
        updateCustomThemeSettings() {
            const customThemeContainer = document.getElementById('custom-theme-container');
            if (!customThemeContainer) return;

            const { theme, difficulty } = this.state.settings;

            if (theme === 'custom' && difficulty !== 'hard') {
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
                            <button type="button" onclick="Game.triggerImageUpload()" class="upload-btn">📸 上傳圖片</button>
                        </div>

                        <!-- 圖片預覽模態視窗 -->
                        <div id="image-preview-modal" class="image-preview-modal">
                            <div class="modal-overlay" onclick="Game.closeImagePreview()"></div>
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h3>🎁 新增自訂圖示</h3>
                                    <button onclick="Game.closeImagePreview()" class="close-btn">✕</button>
                                </div>
                                <div class="modal-body">
                                    <div class="preview-section">
                                        <img id="preview-image" src="" alt="預覽圖片" style="max-width: 350px; max-height: 300px; object-fit: contain; border-radius: 10px; border: 2px solid #ddd;">
                                    </div>
                                    <div class="item-form">
                                        <div class="form-group">
                                            <label>圖示名稱：</label>
                                            <input type="text" id="modal-custom-name" placeholder="請輸入圖示名稱" maxlength="10">
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button onclick="Game.closeImagePreview()" class="cancel-btn">取消</button>
                                    <button onclick="Game.confirmAddCustomItem()" class="confirm-btn">確認新增</button>
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

        // 🔧 [新增] 更新主題按鈕狀態（難度變更時）
        updateThemeButtonsState() {
            const themeButtons = document.querySelectorAll('[data-type="theme"]');
            const { difficulty } = this.state.settings;

            themeButtons.forEach(btn => {
                if (difficulty === 'hard') {
                    btn.disabled = true;
                    btn.classList.add('disabled');
                    if (!btn.textContent.includes('❌')) {
                        btn.textContent = '❌ ' + btn.textContent;
                    }
                } else {
                    btn.disabled = false;
                    btn.classList.remove('disabled');
                    btn.textContent = btn.textContent.replace('❌ ', '');
                }
            });
        },

        // 🔧 [新增] 取得難度說明
        getDifficultyDescription(difficulty) {
            const descriptions = {
                'easy': '簡單：單一物品與數量的對應，有系統示範提示。',
                'normal': '普通：單一物品與數量的對應，沒有示範提示。',
                'hard': '困難：多種物品與數量的對應，考驗觀察力。'
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
        // Game Start
        // =====================================================




        // =====================================================================

        // =====================================================
        // Initialization
        // =====================================================
        init() {
            Game.Debug.logGameFlow('遊戲初始化開始');

            try {
                // 🔧 [Bug修復] 清理所有計時器和事件監聽器
                Game.TimerManager.clearAll();
                Game.EventManager.removeAll();

                // 🎬 注入全局動畫樣式（避免重複定義）
                this.injectGlobalAnimationStyles();

                // 【配置驅動】清理觸控拖曳管理器（返回設定時）
                Game.HTML5DragSystem.cleanup();
                
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
            Game.Debug.logGameFlow('載入設定畫面');
            Game.Debug.logTemplate('settingsScreen', this.state.settings);

            // 🔧 [Bug修復] 清理遊戲UI相關計時器和事件監聽器
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');

            // 🔄 重置遊戲狀態
            this.resetGameState();

            const app = document.getElementById('app');
            const { settings } = this.state;
            
            app.innerHTML = this.HTMLTemplates.settingsScreen(
                settings.difficulty,
                settings.theme,
                settings.questionCount,
                settings.countingRange,
                settings.assistClick
            );

            Game.Debug.logUI('綁定設定選擇事件', 'game-settings');
            Game.EventManager.on(app.querySelector('.game-settings'), 'click', this.handleSelection.bind(this), {}, 'gameUI');

            Game.Debug.logUI('綁定開始遊戲事件', 'start-game-btn');
            Game.EventManager.on(app.querySelector('#start-game-btn'), 'click', this.start.bind(this), {}, 'gameUI');

            // 🎁 綁定獎勵系統連結事件
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
                    const params = new URLSearchParams({ unit: 'f1' });
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

            // 初始化主題系統
            this.initThemeSystem();

            // 更新開始按鈕狀態
            this.updateStartButton();

            Game.Debug.logGameFlow('設定畫面載入完成', settings);
        },

        handleSelection(event) {
            // 🔧 [新增] 解鎖手機音頻（用戶首次互動時）
            this.Audio.unlockAudio();
            
            const btn = event.target.closest('.selection-btn');
            if (!btn) return;

            // 檢查按鈕是否被禁用
            if (btn.disabled || btn.classList.contains('disabled')) {
                return; // 禁用的按鈕不執行任何操作
            }

            const { type, value } = btn.dataset;
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
                        const customInput = document.getElementById('custom-question-count-f1');
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

            // 🔧 [統一處理] 主題選擇（包含自訂主題和預設主題）
            if (type === 'theme') {
                this.state.settings.theme = value;
                btn.closest('.button-group').querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 🔧 [優化] 更新自訂主題設定區域（顯示/隱藏）
                this.updateCustomThemeSettings();
                this.updateStartButton();
                return;
            }

            this.state.settings[type] = (type === 'questionCount') ? parseInt(value) : value;
            if (type === 'questionCount') this.state.totalTurns = parseInt(value);

            // 🔧 [修復] 難度選擇變更時，先更新按鈕狀態，再更新相關區域
            const buttonGroup = btn.closest('.button-group');
            buttonGroup.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 🔧 [新增] 選擇預設題數時，隱藏自訂輸入框
            if (type === 'questionCount' && value !== 'custom') {
                const customDisplay = document.querySelector('.custom-question-display');
                const customInput = document.getElementById('custom-question-count-f1');
                if (customDisplay && customInput) {
                    customDisplay.style.display = 'none';
                    customInput.value = '';
                    customInput.style.background = 'white';
                    customInput.style.color = '#333';
                    customInput.style.borderColor = '#ddd';
                }
            }

            // 🔧 [優化] 如果是難度選擇變更，額外更新主題相關區域
            if (type === 'difficulty') {
                this.updateThemeButtonsState();
                this.updateCustomThemeSettings();
                // 🔧 [新增] 更新難度說明
                this.updateDifficultyDescription(value);
                // 👆 輔助點擊：只在簡單模式顯示
                const assistGroup = document.getElementById('assist-click-group');
                if (assistGroup) assistGroup.style.display = value !== 'easy' ? 'none' : '';
                if (value !== 'easy') this.state.settings.assistClick = false;
            }

            this.updateStartButton();
        },

        // 🔧 [新增] 處理點擊自訂題數輸入框
        handleCustomQuestionClick() {
            const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
            if (customBtn) {
                customBtn.click();
            }
        },

        updateStartButton() {
            const { difficulty, theme, questionCount, countingRange } = this.state.settings;
            const startBtn = document.getElementById('start-game-btn');
            
            // 檢查自訂主題是否有足夠的圖示
            const isCustomThemeValid = theme !== 'custom' || this.state.customItems.length >= 1;
            
            // 所有難度都不需要測驗模式設定
            if (difficulty === 'easy' && theme && questionCount && countingRange && isCustomThemeValid) {
                startBtn.disabled = false;
                startBtn.textContent = '開始遊戲！';
            } else if (difficulty === 'normal' && difficulty && theme && questionCount && countingRange && isCustomThemeValid) {
                startBtn.disabled = false;
                startBtn.textContent = '開始遊戲！';
            } else if (difficulty === 'hard' && difficulty && questionCount && countingRange) {
                // 困難模式不需要選擇主題，因為使用多種主題
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
        async start() {
            console.group(`${Game.Debug.logPrefix}[遊戲開始]`);
            const startTime = Game.Debug.logPerformance('遊戲開始');
            
            // 🔧 [新增] 在遊戲開始時解鎖音頻權限（手機端必須）
            if (!Game.state.audioUnlocked) {
                Game.Debug.logAudio('📱 嘗試解鎖手機音頻權限', 'game-start');
                await this.Audio.unlockAudio();
            }
            
            // 🔄 重置遊戲狀態
            this.resetGameState();
            this.state.startTime = Date.now(); // 記錄開始時間

            Game.Debug.logConfig(this.state.settings.difficulty, this.ModeConfig[this.state.settings.difficulty]);

            this.setupGameUI();
            if (this.state.settings.difficulty === 'easy' && this.state.settings.assistClick) {
                AssistClick.activate();
            }
            await this.startNewTurn();
            
            Game.Debug.logPerformance('遊戲開始', startTime);
            // console.groupEnd 已移除 - 使用 FLAGS 分類系統
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
                targetArea: document.getElementById('target-area'),
                sourceArea: document.getElementById('source-area'),
                optionsArea: document.getElementById('options-area'),
                progressInfo: document.getElementById('progress-info'),
                scoreInfo: document.getElementById('score-info'),
                gameTitle: document.getElementById('game-title')
            });
            
            // F1 不需要點擊事件監聽器，使用拖拽系統
            Game.Debug.logUI('F1使用拖拽系統，跳過點擊事件綁定');
            
            // --- 拖曳系統初始化已移到 startNewTurn 中，在DOM渲染完成後執行 ---
            
            // 🔧 [Bug修復] 使用 EventManager 管理事件監聽器
            Game.Debug.logUI('使用事件委託綁定選項事件', 'app delegated click');
            Game.EventManager.on(app, 'click', (event) => {
                // 檢查是否點擊的是選項按鈕
                const selectedBtn = event.target.closest('.payment-btn');
                if (selectedBtn && selectedBtn.closest('#options-area')) {
                    Game.Debug.logUserAction('事件委託捕獲選項點擊', {
                        buttonText: selectedBtn.textContent,
                        buttonValue: selectedBtn.dataset.value,
                        targetElement: event.target.tagName,
                        targetClass: event.target.className
                    });
                    this.boundHandleAnswerClick(event);
                    return; // 不要繼續處理其他點擊事件
                }
                
                // 檢查點擊到放置區域（用於點擊放置功能）
                const dropZone = event.target.closest('.drop-zone, .placement-zone, .placement-guide, .quantity-container, .normal-grid-item, .target-grid-item');
                if (dropZone && this.state.selectedClickItem) {
                    Game.Debug.logUserAction('事件委託捕獲放置區域點擊', {
                        zone: dropZone.className,
                        hasSelection: !!this.state.selectedClickItem
                    });
                    event.stopPropagation();
                    this.handleZoneClick(event);
                    return;
                }
                
                // 檢查點擊到可拖曳物品或已放置物品（由於物品本身已有onclick，這裡主要處理遺漏的情況）
                const clickableItem = event.target.closest('.draggable-item, .placed-item');
                if (clickableItem && !event.target.onclick) {
                    Game.Debug.logUserAction('事件委託捕獲物品點擊', {
                        item: clickableItem.className,
                        hasDirectHandler: !!event.target.onclick
                    });
                    event.stopPropagation();
                    this.handleItemClick(event);
                }
            }, {}, 'gameUI');

            // 記錄options-area的狀態但不依賴它進行事件綁定
            if (this.elements.optionsArea) {
                Game.Debug.logUI('options-area已存在', 'options-area', {
                    innerHTML: this.elements.optionsArea.innerHTML
                });
            } else {
                Game.Debug.logUI('options-area不存在，將使用事件委託處理', 'UI設置');
            }
            
            Game.Debug.logGameFlow('遊戲UI設置完成');
        },

        async startNewTurn() {
            // 防止重複調用的保護機制
            if (this.state.isStartingNewTurn) {
                Game.Debug.logGameFlow('阻止重複開始新回合', {
                    currentTurn: this.state.currentTurn,
                    isStartingNewTurn: this.state.isStartingNewTurn
                });
                return;
            }
            this.state.isStartingNewTurn = true;

            // 🔧 [Bug修復] 使用 try/finally 確保例外發生時 isStartingNewTurn 也會被重置
            try {
                console.group(`${Game.Debug.logPrefix}[開始新回合]`);
                if (this.state.currentTurn >= this.state.totalTurns) {
                    Game.Debug.logGameFlow('遊戲結束', {
                        currentTurn: this.state.currentTurn,
                        totalTurns: this.state.totalTurns
                    });
                    this.endGame();
                    return;
                }

                const oldTurn = this.state.currentTurn;
                this.state.currentTurn++;
                this.state.isAnswering = false;
                this.state.correctPlacements = 0; // F1: 正確放置數量
                this.state.draggedItems = [];    // F1: 已拖曳物件狀態

                // 清理模式特定狀態
                if (this.state.normalMode) {
                    this.state.normalMode = null;
                }
                if (this.state.easyMode) {
                    this.state.easyMode = null;
                }
                if (this.state.hardMode) {
                    this.state.hardMode = null;
                }

                Game.Debug.logState('新回合狀態',
                    { currentTurn: oldTurn, isAnswering: true },
                    { currentTurn: this.state.currentTurn, isAnswering: false, correctPlacements: 0 }
                );

                this.updateProgress();

                // 清空區域
                Game.Debug.logUI('清空遊戲區域');
                const targetArea = document.getElementById('target-area');
                const sourceArea = document.getElementById('source-area');
                if (targetArea) targetArea.innerHTML = '';
                if (sourceArea) sourceArea.innerHTML = '';
                if (this.elements.optionsArea) this.elements.optionsArea.innerHTML = '';

                // 清理模式特定的CSS樣式，避免模式間樣式干擾
                const styleIdsToRemove = ['dynamic-turn-styles', 'normal-mode-styles', 'hard-mode-styles'];
                styleIdsToRemove.forEach(styleId => {
                    const styleElement = document.head.querySelector(`#${styleId}`);
                    if (styleElement) {
                        styleElement.remove();
                        Game.Debug.logUI('清理樣式', { styleId });
                    }
                });

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

                // 困難模式不需要單一主題圖示，使用佔位符
                let randomIcon;
                if (difficulty === 'hard') {
                    // 困難模式會在renderHardMode中處理多個主題的圖示選擇
                    randomIcon = '🎯'; // 佔位符，實際圖示由renderHardMode決定
                } else {
                    // 簡單模式和普通模式使用選定的主題
                    randomIcon = this.gameData.themes[theme].slice().sort(() => 0.5 - Math.random())[0];
                }

                Game.Debug.logGameFlow('生成新題目', {
                    turn: this.state.currentTurn,
                    difficulty,
                    modeType: config.modeType,
                    correctAnswer: this.state.correctAnswer,
                    icon: randomIcon
                });

                // 根據模式類型渲染不同UI
                await this.renderModeSpecificUI(config, difficulty, randomIcon);

                // --- 【核心修正】在這裡刷新拖曳系統 ---
                Game.Debug.logGameFlow('DOM渲染完成，準備刷新拖曳系統');
                Game.HTML5DragSystem.refresh(difficulty);

                // 播放初始指導語音
                this.Speech.speak('initialInstruction', difficulty, config, {
                    targetCount: this.state.correctAnswer,
                    itemName: this.getItemName(randomIcon),
                    containerName: '容器'
                });

                Game.Debug.logGameFlow('新回合準備完成', {
                    turn: this.state.currentTurn,
                    correctAnswer: this.state.correctAnswer,
                    modeType: config.modeType
                });
            } catch (err) {
                Game.Debug.logError('startNewTurn 發生例外，重置 isStartingNewTurn', err);
                throw err;
            } finally {
                this.state.isStartingNewTurn = false;
            }
            // console.groupEnd 已移除 - 使用 FLAGS 分類系統
        },

        async renderModeSpecificUI(config, difficulty, randomIcon) {
            try {
                Game.Debug.logGameFlow('開始renderModeSpecificUI', { 
                    modeType: config.modeType, 
                    difficulty,
                    randomIcon
                });
                
                Game.Debug.logGameFlow('使用傳入的隨機圖示', { 
                    randomIcon,
                    difficulty
                });
                
                switch(config.modeType) {
                    case 'one-to-one-correspondence':
                        Game.Debug.logGameFlow('執行簡單模式渲染');
                        await this.renderEasyMode(randomIcon, difficulty);
                        break;
                    case 'quantity-to-numeral':
                        Game.Debug.logGameFlow('執行普通模式渲染');
                        this.renderNormalMode(randomIcon, difficulty);
                        break;
                    case 'multi-item-correspondence':
                        Game.Debug.logGameFlow('執行困難模式渲染');
                        this.renderHardMode(randomIcon, difficulty);
                        break;
                    default:
                        Game.Debug.logError('未知的模式類型', config.modeType);
                }
                
                Game.Debug.logGameFlow('renderModeSpecificUI完成');
            } catch (error) {
                Game.Debug.logError(error, 'renderModeSpecificUI執行失敗');
            }
        },

        async renderEasyMode(icon, difficulty) {
            const config = this.ModeConfig[difficulty];
            Game.Debug.logGameFlow('簡單模式開始渲染 - 包含演示動畫');
            const sourceArea = document.getElementById('source-area');
            const targetArea = document.getElementById('target-area');

            // --- 階段1：設置初始界面 ---
            sourceArea.innerHTML = '<h3>物品</h3><div class="source-container"></div>';
            targetArea.innerHTML = '<h3>對應</h3><div class="target-container correspondence-pairs-container"></div>';
            
            const sourceContainer = sourceArea.querySelector('.source-container');
            const targetContainer = targetArea.querySelector('.target-container');

            // --- 階段2：準備演示動畫的物件 ---
            // 先創建演示物品和目標區的放置框
            for (let i = 0; i < this.state.correctAnswer; i++) {
                // 創建演示物品
                sourceContainer.insertAdjacentHTML('beforeend', 
                    `<div class="demo-item" data-demo="${i}" style="width: 90px; height: 90px; display: inline-flex; align-items: center; justify-content: center; margin: 5px;">
                        ${this.HTMLTemplates.staticItem(icon, difficulty)}
                    </div>`
                );
                
                // 創建對應區，此時只有放置框，沒有老師的範例
                targetContainer.insertAdjacentHTML('beforeend', `
                    <div class="correspondence-pair" data-pair-index="${i}">
                        ${this.HTMLTemplates.dropZone(i, difficulty, true)}
                    </div>
                `);
            }
            
            // 執行演示動畫，此函式會負責將老師的範例物件移動並放置好
            await this.playDemonstrationAnimation(icon, difficulty, sourceContainer, targetContainer);

            // --- 階段3：設置學生操作環境 ---
            // 動畫已將目標區設置完畢，我們只需清空來源區，並填入可拖曳的學生物件
            sourceContainer.innerHTML = ''; 

            for (let i = 0; i < this.state.correctAnswer; i++) {
                // 🔧 [F3 做法] 不使用 wrapper，直接創建物品
                sourceContainer.insertAdjacentHTML('beforeend',
                    this.HTMLTemplates.draggableItem(icon, i, difficulty)
                );
            }
            
            // 目標區 (targetContainer) 維持動畫結束後的狀態，不再做任何更動
            Game.Debug.logGameFlow('簡單模式操作環境準備完成');
            
            // --- 拖曳系統初始化已統一移到 startNewTurn 中處理 ---
        },

        async playDemonstrationAnimation(icon, difficulty, sourceContainer, targetContainer) {
            const config = this.ModeConfig[difficulty];
            Game.Debug.logGameFlow('開始播放新版演示動畫');

            // 等待初始說明語音完整播放完畢
            await new Promise(resolve => {
                this.Speech.speak('demonstration', difficulty, config, {
                    itemCount: this.state.correctAnswer,
                    itemName: this.getItemName(icon)
                }, resolve); // 語音播放完畢後執行回調
            });

            // 語音播放完後短暫停頓
            await new Promise(resolve => setTimeout(resolve, 300));

            const animationContainer = document.querySelector('.correspondence-frame');

            // 改為依序移動，一個完成後再移動下一個
            for (let i = 0; i < this.state.correctAnswer; i++) {
                const demoItemContainer = sourceContainer.querySelector(`[data-demo="${i}"]`);
                const demoItem = demoItemContainer?.firstElementChild;
                const targetDropZone = targetContainer.querySelector(`[data-pair-index="${i}"] .drop-zone`);

                if (!demoItem || !targetDropZone) continue;

                // 等待單個物品的動畫完成
                await new Promise(resolve => {
                    const startRect = demoItem.getBoundingClientRect();
                    const endRect = targetDropZone.getBoundingClientRect();
                    const containerRect = animationContainer.getBoundingClientRect();

                    // 1. 計算移動距離
                    const deltaX = (endRect.left + endRect.width / 2) - (startRect.left + startRect.width / 2);
                    const deltaY = (endRect.top + endRect.height / 2) - (startRect.top + startRect.height / 2);

                    // 2. 將原物品從文檔流中抽離，準備動畫
                    demoItem.style.position = 'absolute';
                    demoItem.style.zIndex = '1000';
                    demoItem.style.top = `${startRect.top - containerRect.top}px`;
                    demoItem.style.left = `${startRect.left - containerRect.left}px`;
                    demoItem.style.margin = '0';
                    animationContainer.appendChild(demoItem);
                    demoItemContainer.style.opacity = '0';

                    // 3. 設置線性的 CSS Transition
                    const animationDuration = 1000; // 恆定 1 秒移動時間
                    demoItem.style.transition = `transform ${animationDuration}ms linear`;
                    
                    // 播放移動音效，並等待播放完畢
                    this.Audio.playSound('select', difficulty, config, () => {
                        // 4. 觸發移動動畫
                        requestAnimationFrame(() => {
                            demoItem.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                        });

                        // 5. 動畫結束後，將物件無縫轉換為最終的靜態範例
                        Game.TimerManager.setTimeout(() => {
                            // 播放成功音效，並等待播放完畢
                            this.Audio.playSound('correct', difficulty, config, () => {
                                const pairContainer = targetDropZone.closest('.correspondence-pair');
                                
                                if (pairContainer) {
                                    // 在對應容器中加入老師的最終範例
                                    pairContainer.insertAdjacentHTML('beforeend', this.HTMLTemplates.staticItem(icon, difficulty));
                                    
                                    // 為新範例加上成功動畫
                                    const teacherItem = pairContainer.querySelector('.static-item');
                                    if (teacherItem) {
                                        teacherItem.classList.add('pair-success');
                                        Game.TimerManager.setTimeout(() => teacherItem.classList.remove('pair-success'), 500, 'animation');
                                    }
                                }

                                // 移除已完成動畫的移動物件
                                demoItem.remove();
                                resolve(); // 這個物品的動畫已完成
                            });
                        }, animationDuration, 'animation');
                    });
                });

                // 每個物品完成後短暫停頓再進行下一個
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            await new Promise(resolve => setTimeout(resolve, 800)); // 所有動畫結束後等待一會兒
            Game.Debug.logGameFlow('演示動畫播放完成');
        },

        renderNormalMode(icon, difficulty) {
            Game.Debug.logGameFlow('執行普通模式渲染 (簡化版)');
            // 🔧 [Bug修復] 初始化 normalMode 狀態（避免 handleSourceDrop 存取 null.targetItems 崩潰）
            this.state.normalMode = { targetItems: [] };
            const targetArea = document.getElementById('target-area');
            const sourceArea = document.getElementById('source-area');
            
            // 來源區
            sourceArea.innerHTML = `
                <h3>物品框</h3>
                <div class="source-container" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; padding: 15px; border: 2px solid #ff9800; border-radius: 15px; background: linear-gradient(135deg, #fff3e0, #ffe0b2); min-height: 100px;"></div>
            `;
            
            // 目標區：創建虛線放置框，使用雙層結構（外層滿版，內層固定寬度）
            targetArea.innerHTML = `
                <h3>對應框 (請放置 ${this.state.correctAnswer} 個)</h3>
                <div class="placement-zone normal-placement-zone" id="target-placement-zone" style="
                    width: 100%;
                    padding: 15px;
                    border-radius: 12px;
                    background: #fdfdfd;
                    border: 2px dashed #8e44ad;
                    min-height: 120px;
                    box-sizing: border-box;
                ">
                    <div class="normal-grid-wrapper" style="
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        justify-content: center;
                        margin: 0 auto;
                    ">
                        ${Array.from({ length: this.state.correctAnswer }, (_, i) => `
                            <div class="drop-zone normal-drop-zone" data-drop-index="${i}" style="
                                width: 90px;
                                height: 90px;
                                box-sizing: border-box;
                                border: 2px dashed #8e44ad;
                                border-radius: 8px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                background: rgba(255, 255, 255, 0.8);
                                position: relative;
                            ">
                                <span class="guide-text" style="
                                    color: #8e44ad;
                                    font-size: 12px;
                                    text-align: center;
                                    pointer-events: none;
                                    opacity: 0.7;
                                ">放這裡</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="target-container-bottom" style="text-align: left; margin-top: 15px;">
                    <h3>目標區 (應有 ${this.state.correctAnswer} 個)</h3>
                    <div class="target-item-container" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;"></div>
                </div>
                <div class="completion-area" style="text-align: center; margin-top: 20px;">
                    <button class="complete-btn modern-complete-btn" id="complete-btn" onclick="Game.handleNormalComplete()">
                        <span class="btn-icon">✨</span>
                        <span class="btn-text">完成對應</span>
                        <span class="btn-effect"></span>
                    </button>
                </div>
            `;

            const sourceContainer = sourceArea.querySelector('.source-container');
            const targetItemContainer = targetArea.querySelector('.target-item-container');

            const distractorCount = this.getRandomInt(1, 5);
            const totalItems = this.state.correctAnswer + distractorCount;

            // 渲染來源物品（F3 做法：不使用 wrapper，改用 display toggle）
            for (let i = 0; i < totalItems; i++) {
                sourceContainer.insertAdjacentHTML('beforeend',
                    this.HTMLTemplates.draggableItem(icon, `normal-item-${i}`, difficulty)
                );
            }

            // 渲染目標提示物品
            for (let i = 0; i < this.state.correctAnswer; i++) {
                targetItemContainer.insertAdjacentHTML('beforeend', this.HTMLTemplates.staticItem(icon, difficulty));
            }
            
            Game.Debug.logGameFlow('普通模式UI渲染完成 (簡化版)');
        },

        generateHardModeItems() {
            const { theme, countingRange } = this.state.settings;
            const rangeConfig = this.gameData.countingRanges[countingRange];
            const totalItemsToPlace = this.getRandomInt(rangeConfig.minItems, rangeConfig.maxItems);
            const numTargetTypes = this.getRandomInt(Math.min(3, totalItemsToPlace), Math.min(5, totalItemsToPlace));
            const allAvailableIcons = [];
            Object.values(this.gameData.themes).forEach(themeIcons => allAvailableIcons.push(...themeIcons));
            const availableIcons = allAvailableIcons.sort(() => 0.5 - Math.random());
            const targetIcons = availableIcons.slice(0, numTargetTypes);
            const counts = new Array(numTargetTypes).fill(1);
            let remainingItems = totalItemsToPlace - numTargetTypes;
            while (remainingItems > 0) {
                counts[this.getRandomInt(0, numTargetTypes - 1)]++;
                remainingItems--;
            }
            const correctAnswerSet = new Map();
            targetIcons.forEach((icon, index) => correctAnswerSet.set(icon, counts[index]));

            const numDistractorTypes = this.getRandomInt(1, 3);
            const distractorItems = [];
            for (let i = 0; i < numDistractorTypes; i++) {
                const icon = availableIcons.pop();
                const count = this.getRandomInt(1, 5);
                for (let j = 0; j < count; j++) distractorItems.push({ icon, type: 'distractor' });
            }
            const sourceItems = [];
            correctAnswerSet.forEach((count, icon) => {
                for (let i = 0; i < count; i++) sourceItems.push({ icon, type: 'target' });
            });
            sourceItems.push(...distractorItems);
            sourceItems.sort(() => 0.5 - Math.random());
            
            return { correctAnswerSet, sourceItems };
        },

        renderHardMode(primaryIcon, difficulty) {
            Game.Debug.logGameFlow('執行困難模式渲染 (簡化版)');
            const config = this.ModeConfig[difficulty];
            const targetArea = document.getElementById('target-area');
            const sourceArea = document.getElementById('source-area');

            const { correctAnswerSet, sourceItems } = this.generateHardModeItems();

            // 來源區 (與普通模式統一樣式)
            sourceArea.innerHTML = `
                <h3>物品框</h3>
                <div class="source-container" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; padding: 15px; border: 2px solid #ff9800; border-radius: 15px; background: linear-gradient(135deg, #fff3e0, #ffe0b2); min-height: 100px;"></div>
            `;
            
            // 計算總放置格數 
            let totalPlacementSlots = 0;
            correctAnswerSet.forEach((count) => totalPlacementSlots += count);
            
            // 目標區 (參考普通模式的結構和樣式)
            targetArea.innerHTML = `
                <div class="header-with-hint">
                    <h3>對應框 (請放置 ${totalPlacementSlots} 個物品到正確位置)</h3>
                    ${config.uiElements.showHintButton ? `
                        <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                        <button class="modern-hint-btn" onclick="Game.handleHintClick()">
                            <span class="hint-icon">💡</span>
                            <span class="hint-text">提示</span>
                            <span class="hint-effect"></span>
                        </button>
                    ` : ''}
                </div>
                <div class="placement-zone hard-placement-zone" id="placement-zone" style="
                    padding: 15px;
                    border-radius: 12px;
                    background: #fdfdfd;
                    border: 2px dashed #f44336;
                    min-height: 120px;
                    width: 100%;
                    overflow-x: auto;
                ">
                    <div class="placement-grid" id="placement-grid" style="
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        justify-content: center;
                        align-items: flex-start;
                        align-content: flex-start;
                    "></div>
                </div>
                <div class="target-container-bottom" style="margin-top: 15px; width: 100%; overflow-x: auto;">
                    <h3 style="text-align: center;">目標區 (應有的物品類型和數量)</h3>
                    <div class="target-grid" style="
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        justify-content: center;
                        align-items: flex-start;
                        align-content: flex-start;
                    "></div>
                </div>
                <div class="completion-area" style="text-align: center; margin-top: 20px;">
                    <button class="complete-btn modern-complete-btn" id="complete-btn" onclick="Game.handleHardComplete()">
                        <span class="btn-icon">✨</span>
                        <span class="btn-text">完成對應</span>
                        <span class="btn-effect"></span>
                    </button>
                </div>
            `;
            
            const sourceContainer = sourceArea.querySelector('.source-container');
            const targetGrid = targetArea.querySelector('.target-grid');
            const placementGrid = targetArea.querySelector('.placement-grid');

            // 渲染來源物品（F3 做法：不使用 wrapper，改用 display toggle）
            sourceItems.forEach((item, index) => {
                sourceContainer.insertAdjacentHTML('beforeend',
                    this.HTMLTemplates.draggableItem(item.icon, `item-${index}`, difficulty)
                );
            });
            
            // 🔧 [困難模式修正] 創建完全對應的目標框和放置框布局
            // 先計算總物品數和合理的排列方式
            let totalItems = 0;
            correctAnswerSet.forEach(count => totalItems += count);

            // 🔧 [修正] 根據螢幕寬度自動計算每行可顯示的物品數
            const itemWidth = 90; // 物品寬度
            const gap = 10; // flexbox gap 間距

            // 🔧 [最終修正] 使用 getBoundingClientRect().width 獲取渲染後的精確寬度，解決計算不準的問題。
            const parentContainer = placementGrid.parentElement;
            const parentRect = parentContainer ? parentContainer.getBoundingClientRect() : null;
            // parentRect.width 包含 padding，因此需減去左右 padding (15px * 2 = 30px)
            const availableWidth = parentRect ? parentRect.width - 30 : window.innerWidth * 0.85;

            // 計算每行最多能放多少個物品 (公式不變)
            let maxItemsPerRow = Math.floor((availableWidth + gap) / (itemWidth + gap));

            // 限制最小值和最大值（上限為 15）
            maxItemsPerRow = Math.max(5, Math.min(15, maxItemsPerRow));

            const totalRows = Math.ceil(totalItems / maxItemsPerRow);

            // 🔧 [新增] 計算每一行的實際物品數量，確保目標框和放置框完全對應
            const itemsPerRow = [];
            for (let row = 0; row < totalRows; row++) {
                const startIndex = row * maxItemsPerRow;
                const endIndex = Math.min(startIndex + maxItemsPerRow, totalItems);
                itemsPerRow.push(endIndex - startIndex);
            }

            Game.Debug.logGameFlow('困難模式佈局計算', {
                totalItems,
                availableWidth,
                maxItemsPerRow,
                totalRows,
                itemsPerRow,
                correctAnswerSet: Array.from(correctAnswerSet.entries())
            });

            // 🔧 [新增] 計算實際需要的容器寬度
            const actualRowWidth = (itemWidth * maxItemsPerRow) + (gap * (maxItemsPerRow - 1));

            // 🔧 [關鍵修正] 設置固定寬度並置中，確保兩個網格佈局完全一致
            targetGrid.style.width = `${actualRowWidth}px`;
            placementGrid.style.width = `${actualRowWidth}px`;
            targetGrid.style.margin = '0 auto';
            placementGrid.style.margin = '0 auto';

            // 渲染目標提示物品和對應的放置格子（位置完全一致）
            let globalIndex = 0;
            correctAnswerSet.forEach((count, icon) => {
                for (let i = 0; i < count; i++) {
                    const currentRow = Math.floor(globalIndex / maxItemsPerRow);
                    const currentCol = globalIndex % maxItemsPerRow;

                    // 🔧 [修正] 在每行的最後一個元素後添加換行標記
                    const isLastInRow = (currentCol === maxItemsPerRow - 1) || (globalIndex === totalItems - 1);
                    const flexBasis = isLastInRow && (globalIndex === totalItems - 1) ? '100%' : 'auto';

                    // 渲染目標提示物品（顯示應有的物品）
                    targetGrid.insertAdjacentHTML('beforeend', `
                        <div class="static-item hard-static" data-icon="${icon}" data-row="${currentRow}" data-col="${currentCol}" style="
                            width: 90px;
                            height: 90px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 40px;
                            background: rgba(76, 175, 80, 0.1);
                            border: 2px solid #4caf50;
                            border-radius: 8px;
                            position: relative;
                            order: ${globalIndex};
                            flex-shrink: 0;
                        ">
                            ${icon}
                            <span style="
                                position: absolute;
                                bottom: 2px;
                                right: 4px;
                                font-size: 10px;
                                color: #4caf50;
                                font-weight: bold;
                            ">${globalIndex + 1}</span>
                        </div>
                    `);

                    // 渲染對應的放置格子（位置完全匹配）
                    placementGrid.insertAdjacentHTML('beforeend', `
                        <div class="drop-zone target-grid-item"
                             data-index="${globalIndex}"
                             data-expected-icon="${icon}"
                             data-row="${currentRow}"
                             data-col="${currentCol}"
                             style="
                            width: 90px;
                            height: 90px;
                            border: 2px dashed #f44336;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: rgba(255, 255, 255, 0.8);
                            position: relative;
                            order: ${globalIndex};
                            flex-shrink: 0;
                        ">
                            <span class="position-hint" style="
                                color: #f44336;
                                font-size: 10px;
                                text-align: center;
                                pointer-events: none;
                                opacity: 0.7;
                                font-weight: bold;
                            ">${globalIndex + 1}</span>
                        </div>
                    `);

                    globalIndex++;
                }
            });

            this.state.hardMode = { 
                correctAnswerSet,
                placedItems: new Map() // 初始化 placedItems 作為 Map
            };

            Game.Debug.logGameFlow('困難模式UI渲染完成 (簡化版)');
        },

        // =====================================================
        // F1 拖拽處理函數
        // =====================================================
        


        handleDragOver(event) {
            event.preventDefault(); // 允許放置
        },

        handleDragEnter(event) {
            event.preventDefault();
            const difficulty = this.state?.settings?.difficulty || 'easy';
            
            Game.Debug.logGameFlow('F1 DragEnter 事件觸發', {
                difficulty,
                eventTarget: event.target.className,
                eventCurrentTarget: event.currentTarget?.className
            });
            
            // [F3精確感應] 根據難度模式確定感應目標
            let selector;
            if (difficulty === 'easy') {
                // 簡單模式：只感應小放置框和來源區域
                selector = '.drop-zone, .source-container';
            } else if (difficulty === 'normal') {
                // 普通模式：只感應小放置框和來源區域
                selector = '.drop-zone, .source-container';
            } else if (difficulty === 'hard') {
                // 困難模式：只感應小格子和來源區域
                selector = '.target-grid-item, .source-container';
            }
            
            const target = event.target.closest(selector);
            Game.Debug.logGameFlow('F1 DragEnter 感應檢查', {
                selector,
                hasTarget: !!target,
                targetClass: target?.className
            });
            
            if (target) {
                const config = this.ModeConfig[difficulty];
                const dragOverClass = config?.cssClasses?.draggedOver || 'drag-over';
                target.classList.add(dragOverClass);
                
                Game.Debug.logGameFlow('F1 添加拖曳感應效果', {
                    targetClass: target.className,
                    addedClass: dragOverClass,
                    finalClassName: target.className,
                    hasClass: target.classList.contains(dragOverClass)
                });
            }
        },

        handleDragLeave(event) {
            const difficulty = this.state?.settings?.difficulty || 'easy';
            
            // [F3精確感應] 根據難度模式確定感應目標
            let selector;
            if (difficulty === 'easy') {
                // 簡單模式：只處理小放置框和來源區域
                selector = '.drop-zone, .source-container';
            } else if (difficulty === 'normal') {
                // 普通模式：只處理小放置框和來源區域
                selector = '.drop-zone, .source-container';
            } else if (difficulty === 'hard') {
                // 困難模式：只處理小格子和來源區域
                selector = '.target-grid-item, .source-container';
            }
            
            const target = event.target.closest(selector);
            if (target) {
                const config = this.ModeConfig[difficulty];
                const dragOverClass = config?.cssClasses?.draggedOver || 'drag-over';
                target.classList.remove(dragOverClass);
                
                Game.Debug.logGameFlow('F1 移除拖曳感應效果', {
                    targetClass: target.className,
                    removedClass: dragOverClass
                });
            }
        },


        handleNormalDrop(event, draggedElement, difficulty, config) {
            Game.Debug.logUserAction('普通模式拖放開始', {
                draggedElement: draggedElement.dataset.id,
                dropTarget: event.target.className
            });

            // 🔧 修復：優先匹配 .drop-zone，避免被外層 .placement-zone 攔截
            let dropTarget = event.target.closest('.drop-zone');
            if (!dropTarget) {
                dropTarget = event.target.closest('.placement-zone, .source-container');
            }
            if (!dropTarget) {
                Game.Debug.logUserAction('無效的放置目標');
                return;
            }
        
            const originalParent = draggedElement.parentElement;
        
            // --- 邏輯 A: 將圖示從「對應框」拖曳回「物品區」 ---
            if (dropTarget.classList.contains('source-container')) {
                Game.Debug.logUserAction('拖回物品區');
                // 如果是從drop-zone拖回的
                if (originalParent && originalParent.classList.contains('drop-zone')) {
                    dropTarget.appendChild(draggedElement);
                    draggedElement.classList.remove('placed-item');
                    
                    // 恢復drop-zone的狀態
                    originalParent.classList.remove('filled');
                    const guideText = originalParent.querySelector('.guide-text');
                    if (guideText) {
                        guideText.style.display = 'block';
                    }
                    
                    this.Audio.playSound('select', difficulty, config);
                }
                return;
            }
            
            // --- 邏輯 B: 在drop-zone內放置物品 ---
            if (dropTarget.classList.contains('drop-zone')) {
                Game.Debug.logUserAction('放置到drop-zone');
                
                // 檢查drop-zone是否已滿
                if (dropTarget.classList.contains('filled')) {
                    Game.Debug.logUserAction('drop-zone已滿');
                    return;
                }
                
                // 將物品移到drop-zone
                dropTarget.appendChild(draggedElement);
                dropTarget.classList.add('filled');
                draggedElement.classList.add('placed-item');
                
                // 隱藏引導文字
                const guideText = dropTarget.querySelector('.guide-text');
                if (guideText) {
                    guideText.style.display = 'none';
                }
                
                // 如果原本的位置也是drop-zone，恢復其狀態
                if (originalParent && originalParent.classList.contains('drop-zone')) {
                    originalParent.classList.remove('filled');
                    const originalGuideText = originalParent.querySelector('.guide-text');
                    if (originalGuideText) {
                        originalGuideText.style.display = 'block';
                    }
                }
                
                this.Audio.playSound('correct', difficulty, config);
                return;
            }
            
            // --- 邏輯 C: 拖到placement-zone背景區域，自動放置到第一個空的drop-zone ---
            if (dropTarget.classList.contains('placement-zone')) {
                Game.Debug.logUserAction('放置到placement-zone背景');
                
                const emptyDropZone = dropTarget.querySelector('.drop-zone:not(.filled)');
                if (emptyDropZone) {
                    // 遞歸調用自己，但目標改為空的drop-zone
                    const mockEvent = { target: emptyDropZone };
                    this.handleNormalDrop(mockEvent, draggedElement, difficulty, config);
                } else {
                    Game.Debug.logUserAction('沒有空的drop-zone');
                }
                return;
            }
        },

        handleSourceDrop(event) {
            event.preventDefault();
            
            const draggedData = event.dataTransfer ? event.dataTransfer.getData('text/plain') : null;
            if (!draggedData) {
                Game.Debug.logError('無法獲取拖曳資料');
                return;
            }
            const draggedIndex = parseInt(draggedData);
            const draggedElement = document.querySelector(`.draggable-item[data-index="${draggedIndex}"]`);
            
            if (!draggedElement) {
                Game.Debug.logUserAction('找不到拖曳元素');
                return;
            }
            
            // 只允許從放置區拖回源區域
            const wasInPlacementZone = draggedElement.closest('.placement-zone');
            if (!wasInPlacementZone) {
                Game.Debug.logUserAction('只能從放置區拖回源區域');
                return;
            }
            
            const difficulty = this.state.settings.difficulty;
            const config = this.ModeConfig[difficulty];
            const sourceContainer = event.target.closest('.source-container');
            
            // 移除拖曳樣式
            draggedElement.classList.remove('dragging');
            
            // 從放置區移除並更新狀態
            this.state.normalMode.targetItems = this.state.normalMode.targetItems.filter(
                item => item.element !== draggedElement
            );

            // 🔧 [F3 做法] 使用 display toggle 而非 DOM 移動
            const itemId = draggedElement.dataset.id;

            // 顯示原始物品
            if (itemId && sourceContainer) {
                const sourceItem = sourceContainer.querySelector(`.draggable-item[data-id="${itemId}"]`);
                if (sourceItem) {
                    sourceItem.style.display = '';
                    delete sourceItem.dataset.placed;
                    Game.Debug.logGameFlow('F3 做法：顯示原始物品', { itemId });
                }
            }

            // 移除放置區的複製品
            draggedElement.remove();

            this.Audio.playSound('select', difficulty, config);

            // 更新放置區視覺狀態
            const targetPlacementZone = document.getElementById('target-placement-zone');
            if (targetPlacementZone) {
                this.updatePlacementZoneVisuals(targetPlacementZone);
            }

            Game.Debug.logUserAction('物品返回源區域（F3 做法）', {
                draggedIndex,
                targetCount: this.state.normalMode.targetItems.length
            });
        },

        updatePlacementZoneVisuals(placementZone) {
            const zoneHint = placementZone.querySelector('.zone-hint');
            const placedItems = placementZone.querySelectorAll('.placed-item');
            
            if (placedItems.length > 0) {
                // 有物品時隱藏提示
                if (zoneHint) zoneHint.classList.add('has-items');
                placementZone.classList.add('has-items');
            } else {
                // 沒有物品時顯示提示
                if (zoneHint) zoneHint.classList.remove('has-items');
                placementZone.classList.remove('has-items');
            }
        },

        handleNormalComplete() {
            // 🔧 [防連點] 檢查是否正在處理或按鈕已禁用
            const completeBtn = document.getElementById('complete-btn');
            if (this.state.isAnswering || completeBtn?.disabled) {
                Game.Debug.logUserAction('[F1] 防抖：handleNormalComplete 忽略重複點擊');
                return;
            }
            this.state.isAnswering = true;

            const difficulty = this.state.settings.difficulty;
            const config = this.ModeConfig[difficulty];
            const placementZone = document.getElementById('target-placement-zone');
            // 正確計算：計算已填充的drop-zone數量
            const placedCount = placementZone ? placementZone.querySelectorAll('.drop-zone.filled').length : 0;
            const isCorrect = placedCount === this.state.correctAnswer;

            const btnText = completeBtn?.querySelector('.btn-text');
            const btnIcon = completeBtn?.querySelector('.btn-icon');
            if (completeBtn) {
                completeBtn.disabled = true;
                completeBtn.classList.remove('ready');
                if (btnText) btnText.textContent = '判斷中...';
                if (btnIcon) btnIcon.textContent = '⏳';
            }
            
            // 🔧 [Bug修復] 使用 TimerManager 管理判斷延遲（原 raw setTimeout）
            Game.TimerManager.setTimeout(() => {
                if (isCorrect) {
                    // 成功狀態
                    if (completeBtn) {
                        completeBtn.classList.add('success');
                        if (btnText) btnText.textContent = '答對了！';
                        if (btnIcon) btnIcon.textContent = '🎉';
                    }

                    this.Audio.playSound('correct02', difficulty, config);
                    this.startFireworksAnimation();
                    this.showNormalSuccess();

                    Game.TimerManager.setTimeout(() => {
                        this.handleTurnComplete(difficulty, config);
                    }, 1000, 'turnTransition');

                } else {
                    // 錯誤狀態
                    if (completeBtn) {
                        completeBtn.classList.add('error');
                        if (btnText) btnText.textContent = '再試一次';
                        if (btnIcon) btnIcon.textContent = '❌';
                    }

                    this.Audio.playSound('error', difficulty, config);
                    this.Speech.speak('incorrect', difficulty, config, {
                        targetCount: placedCount,
                        correctAnswer: this.state.correctAnswer
                    });
                    // 🔧 [Bug修復] 移除 returnItemsToSource() 呼叫
                    // 與困難模式一致，保留已放置的圖示在放置區

                    this.showNormalError(placedCount, false);

                    // 🔧 [Bug修復] 使用 TimerManager 管理按鈕恢復延遲（原 raw setTimeout）
                    Game.TimerManager.setTimeout(() => {
                        if (completeBtn) {
                            completeBtn.disabled = false;
                            completeBtn.classList.remove('error');
                            if (btnText) btnText.textContent = '完成對應';
                            if (btnIcon) btnIcon.textContent = '✨';
                        }
                        // 🔧 [Bug修復] 錯誤路徑需重置 isAnswering，否則防抖會永久封鎖後續正確點擊
                        this.state.isAnswering = false;
                    }, 2500, 'turnTransition');
                }
            }, 500, 'turnTransition');
        },

        returnItemsToSource() {
            // 🔧 [F3 做法] 使用 display toggle 而非 DOM 移動
            const placementZone = document.querySelector('.placement-zone');
            const sourceContainer = document.querySelector('.source-container');

            if (!placementZone || !sourceContainer) return;

            // 獲取所有放置在 placement-zone 中的物品（複製品）
            const placedItems = placementZone.querySelectorAll('.draggable-item, .placed-item');

            placedItems.forEach(item => {
                const itemId = item.dataset.id;

                // 🔧 [F3 做法] 顯示原始物品
                if (itemId) {
                    const sourceItem = sourceContainer.querySelector(`.draggable-item[data-id="${itemId}"]`);
                    if (sourceItem) {
                        sourceItem.style.display = '';
                        delete sourceItem.dataset.placed;
                    }
                }

                // 移除放置區的複製品
                item.remove();
            });

            Game.Debug.logUserAction('所有物品已返回源區域', {
                returnedCount: placedItems.length
            });
        },

        showNormalSuccess() {
            // 為普通模式放置區的所有物品同時添加配對成功動畫
            const placementGrid = document.querySelector('.placement-grid-normal');
            if (placementGrid) {
                const placedItems = placementGrid.querySelectorAll('.draggable-item');
                placedItems.forEach((item) => {
                    item.classList.add('pair-success');
                    // 🔧 [Bug修復] 使用 TimerManager 管理動畫清除計時器（原 raw setTimeout）
                    Game.TimerManager.setTimeout(() => {
                        item.classList.remove('pair-success');
                    }, 500, 'animation');
                });
            }

            // 為目標區的範例物品同時添加配對成功動畫
            const targetItemContainer = document.querySelector('.target-item-container');
            if (targetItemContainer) {
                const referenceItems = targetItemContainer.querySelectorAll('.static-item');
                referenceItems.forEach((item) => {
                    item.classList.add('pair-success');
                    Game.TimerManager.setTimeout(() => {
                        item.classList.remove('pair-success');
                    }, 500, 'animation');
                });
            }

        },

        showHardSuccess() {
            // 為困難模式放置區的所有物品同時添加配對成功動畫
            const placementZone = document.getElementById('placement-zone');
            if (placementZone) {
                const placedItems = placementZone.querySelectorAll('.draggable-item');
                placedItems.forEach((item) => {
                    item.classList.add('pair-success');
                    Game.TimerManager.setTimeout(() => {
                        item.classList.remove('pair-success');
                    }, 500, 'animation');
                });
            }

            // 為困難模式目標區的所有圖示同時添加配對成功動畫
            const targetGrid = document.querySelector('.target-grid');
            if (targetGrid) {
                const targetItems = targetGrid.querySelectorAll('.static-item');
                targetItems.forEach((item) => {
                    item.classList.add('pair-success');
                    Game.TimerManager.setTimeout(() => {
                        item.classList.remove('pair-success');
                    }, 500, 'animation');
                });
            }

        },

        showNormalError(actualCount, changeButtonState = true) {
            const completeBtn = document.getElementById('complete-btn');
            const errorMessage = actualCount === 0
                ? '請先將物品拖曳到放置區！'
                : `數量不正確！您放置了 ${actualCount} 個，正確答案是 ${this.state.correctAnswer} 個`;

            // 顯示錯誤訊息（可選擇是否改變按鈕狀態）
            if (completeBtn && changeButtonState) {
                completeBtn.textContent = errorMessage;
                completeBtn.style.background = '#f44336';

                // 🔧 [Bug修復] 使用 TimerManager 管理按鈕恢復計時器（原 raw setTimeout）
                Game.TimerManager.setTimeout(() => {
                    completeBtn.textContent = '完成對應';
                    completeBtn.style.background = '';
                    completeBtn.disabled = false;
                }, 2000, 'turnTransition');
            }

            // 為錯誤的放置區添加搖晃動畫
            const targetZone = document.getElementById('target-placement-zone');
            if (targetZone) {
                targetZone.classList.add('error-shake');
                Game.TimerManager.setTimeout(() => {
                    targetZone.classList.remove('error-shake');
                }, 600, 'animation');
            }

        },

        showQuantityOptions(difficulty, config) {
            const optionsArea = this.elements.optionsArea;
            if (!optionsArea) return;
            
            // 生成選項（正確答案 + 錯誤選項）
            const options = [this.state.correctAnswer];
            while(options.length < config.optionsCount) {
                const wrongAnswer = this.getRandomInt(1, this.state.correctAnswer + 3);
                if (!options.includes(wrongAnswer)) {
                    options.push(wrongAnswer);
                }
            }
            
            // 打亂選項順序
            options.sort(() => 0.5 - Math.random());
            
            optionsArea.innerHTML = this.HTMLTemplates.optionsButtons(options);
            
            // 綁定選項點擊事件
            optionsArea.querySelectorAll('.payment-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', (e) => this.handleAnswerClick(e, difficulty, config), {}, 'gameUI');
            });
            
            this.Speech.speak('chooseAnswer', difficulty, config);
        },

        handleAnswerClick(event, difficulty, config) {
            if (this.state.isAnswering) return;
            
            this.state.isAnswering = true;
            const selectedAnswer = parseInt(event.target.dataset.value);
            const isCorrect = selectedAnswer === this.state.correctAnswer;
            
            Game.Debug.logUserAction('選擇答案', {
                selected: selectedAnswer,
                correct: this.state.correctAnswer,
                isCorrect
            });
            
            // 判斷是否為最後一題
            const isLastQuestion = this.state.currentTurn + 1 >= this.state.totalTurns;
            const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';

            if (isCorrect) {
                this.state.score += 10;
                this.updateScore();
                this.Audio.playSound('success', difficulty, config);
                this.Speech.speak('correct', difficulty, config, { answer: this.state.correctAnswer, _suffix: endingText }, () => {
                    // 🔧 [Bug修復] 使用 TimerManager 管理計時器
                    Game.TimerManager.setTimeout(async () => await this.startNewTurn(), config.timing.nextQuestionDelay, 'turnTransition');
                });
            } else {
                this.Audio.playSound('error', difficulty, config);
                this.Speech.speak('incorrect', difficulty, config, {}, () => {
                    if (config.allowRetry && this.state.settings.testMode === 'retry') {
                        this.state.isAnswering = false;
                    } else {
                        this.Speech.speak('incorrectWithAnswer', difficulty, config, { answer: this.state.correctAnswer, _suffix: endingText }, () => {
                            // 🔧 [Bug修復] 使用 TimerManager 管理計時器
                            Game.TimerManager.setTimeout(async () => await this.startNewTurn(), config.timing.nextQuestionDelay, 'turnTransition');
                        });
                    }
                });
            }
        },

        // =====================================================
        // F1 困難模式連線處理函數
        // =====================================================
        
        handleCardClick(event) {
            const difficulty = this.state.settings.difficulty;
            const config = this.ModeConfig[difficulty];
            
            if (this.state.selectedCard) {
                this.state.selectedCard.classList.remove('selected-card');
            }
            
            this.state.selectedCard = event.target;
            event.target.classList.add('selected-card');
            
            const cardIndex = parseInt(event.target.dataset.cardIndex);
            const cardCount = parseInt(event.target.dataset.count);
            
            Game.Debug.logUserAction('選擇卡片', { cardIndex, cardCount });
        },

        handleNumberClick(event) {
            const difficulty = this.state.settings.difficulty;
            const config = this.ModeConfig[difficulty];
            
            if (!this.state.selectedCard) {
                Game.Debug.logUserAction('未選擇卡片');
                return;
            }
            
            const numberValue = parseInt(event.target.dataset.number);
            const cardCount = parseInt(this.state.selectedCard.dataset.count);
            const cardIndex = parseInt(this.state.selectedCard.dataset.cardIndex);
            
            const isCorrect = numberValue === cardCount;
            
            Game.Debug.logUserAction('連線嘗試', {
                cardCount,
                selectedNumber: numberValue,
                isCorrect
            });
            
            if (isCorrect) {
                // 標記為已連接
                this.state.selectedCard.classList.add('connected-card');
                event.target.classList.add('connected-number');
                this.state.connections.push({ cardIndex, numberValue });
                
                this.Audio.playSound('correct', difficulty, config);
                this.Speech.speak('correct', difficulty, config);
                
                // 檢查是否全部連完
                if (this.state.connections.length >= this.state.cardCounts.length) {
                    this.handleTurnComplete(difficulty, config);
                }
            } else {
                this.Audio.playSound('error', difficulty, config);
                this.Speech.speak('incorrect', difficulty, config);
            }
            
            this.state.selectedCard.classList.remove('selected-card');
            this.state.selectedCard = null;
        },

        // =====================================================
        // 🎯 [F1重構] 統一的物品放置與返回邏輯 (參考F3架構)
        // =====================================================

        /**
         * 統一處理物品放置操作
         * @param {HTMLElement} dragElement - 被拖曳的物品
         * @param {HTMLElement} dropZone - 放置的目標區域
         */
        handleItemPlacement(dragElement, dropZone) {
            const difficulty = this.state.settings.difficulty;
            const config = this.ModeConfig[difficulty];
            let actualDropZone = dropZone;
            let placementInfo = {
                dropZoneType: dropZone.className,
                dropZoneId: dropZone.id,
                itemId: dragElement.dataset.id || dragElement.dataset.index
            };

            // 🔧 [普通模式修正] 如果拖到大的placement-zone，找到第一個空的drop-zone
            if (difficulty === 'normal' && dropZone.classList.contains('placement-zone')) {
                const emptyDropZone = dropZone.querySelector('.drop-zone:not(.filled)');
                if (emptyDropZone) {
                    actualDropZone = emptyDropZone;
                    placementInfo.actualDropZone = emptyDropZone.className;
                    placementInfo.dropIndex = emptyDropZone.dataset.dropIndex;
                    Game.Debug.logGameFlow('普通模式自動選擇空的drop-zone', {
                        originalTarget: dropZone.className,
                        selectedDropZone: emptyDropZone.className,
                        dropIndex: emptyDropZone.dataset.dropIndex
                    });
                } else {
                    Game.Debug.logGameFlow('普通模式placement-zone已滿，無法放置');
                    return false; // 放置失敗
                }
            }

            // 🔧 [Bug修復] 困難模式：若目標格已有物品，執行取代或交換（須在 appendChild 前處理）
            if (difficulty === 'hard' && actualDropZone.classList.contains('target-grid-item')) {
                const existingItem = actualDropZone.querySelector('.draggable-item');
                if (existingItem && existingItem !== dragElement) {
                    const origParent = dragElement.parentElement;
                    const isFromSource = origParent && origParent.classList.contains('source-container');
                    if (isFromSource) {
                        // 從物品區拖來：直接將原有物品移回 source-container（困難模式直接移動元素，無F3隱藏機制）
                        origParent.appendChild(existingItem);
                        existingItem.style.display = '';
                        existingItem.classList.remove('placed-item', 'dragging', 'touch-dragging', 'static-item');
                        existingItem.setAttribute('draggable', 'true');
                        delete existingItem.dataset.placed;
                        delete existingItem.dataset.dragEventsAttached;
                        Game.Debug.logGameFlow('[F1] 困難模式取代：原有物品移回物品區', { id: existingItem.dataset.id || existingItem.dataset.icon });
                    } else if (origParent && origParent.classList.contains('target-grid-item')) {
                        // 從另一個格子拖來：交換兩格物品
                        origParent.appendChild(existingItem);
                        origParent.classList.add('filled');
                        Game.Debug.logGameFlow('[F1] 困難模式交換：原有物品移至原格子');
                    } else {
                        existingItem.remove();
                    }
                }
            }

            // 放置物品到正確的drop-zone
            actualDropZone.appendChild(dragElement);
            dragElement.classList.remove('placed-item'); // 確保狀態正確
            dragElement.classList.add('placed-item');   // 重新標記為已放置

            // 隱藏放置提示文字
            const placementHint = actualDropZone.querySelector('.placement-hint');
            if (placementHint) {
                placementHint.style.display = 'none';
            }

            // 標記為filled - 修正邏輯
            if (actualDropZone.classList.contains('drop-zone') || 
                actualDropZone.classList.contains('target-grid-item')) {
                actualDropZone.classList.add('filled');
                placementInfo.markedAsFilled = true;
            }

            // 📝 詳細log記錄放置資訊
            Game.Debug.logGameFlow('物品成功放置到具體位置', placementInfo);

            this.Audio.playSound('correct', difficulty, config);

            if (difficulty === 'easy') {
                // 🔒 [重要修正] 簡單模式下，成功放置後立即禁用該物品的拖曳功能
                dragElement.draggable = false;
                dragElement.classList.add('locked-item'); // 添加視覺標記
                Game.Debug.logGameFlow('簡單模式：已鎖定放置物品的拖曳功能', {
                    itemId: dragElement.dataset.id || dragElement.dataset.index,
                    draggable: dragElement.draggable
                });

                this.state.correctPlacements = document.getElementById('target-area').querySelectorAll('.filled').length;
                if (this.state.correctPlacements >= this.state.correctAnswer) {
                    // 簡單模式：所有物品放置完成時播放煙火和成功音效
                    this.Audio.playSound('correct02', difficulty, config);
                    this.startFireworksAnimation();
                    this.handleTurnComplete(difficulty, config);
                }
            } else if (difficulty === 'normal') {
                // 普通模式等待使用者點擊「完成」按鈕
                const placedCount = document.getElementById('target-placement-zone').querySelectorAll('.drop-zone.filled').length;
                Game.Debug.logGameFlow('普通模式放置狀態', {
                    placedCount,
                    requiredCount: this.state.correctAnswer,
                    isComplete: placedCount >= this.state.correctAnswer
                });
                // 🔧 [Bug修復] 若使用者在錯誤恢復期間補齊最後一個圖示，立即重新啟用完成按鈕
                if (placedCount >= this.state.correctAnswer) {
                    const completeBtn = document.getElementById('complete-btn');
                    if (completeBtn && completeBtn.disabled && completeBtn.classList.contains('error')) {
                        Game.TimerManager.clearByCategory('turnTransition');
                        completeBtn.disabled = false;
                        completeBtn.classList.remove('error');
                        completeBtn.classList.add('ready');
                        const btnText = completeBtn.querySelector('.btn-text');
                        const btnIcon = completeBtn.querySelector('.btn-icon');
                        if (btnText) btnText.textContent = '完成對應';
                        if (btnIcon) btnIcon.textContent = '✨';
                        this.state.isAnswering = false;
                        Game.Debug.logGameFlow('[F1] 錯誤恢復期間補齊圖示，立即重新啟用完成按鈕');
                    }
                }
            } else if (difficulty === 'hard') {
                // 困難模式需要更新 placedItems Map
                const icon = dragElement.dataset.icon;
                if (this.state.hardMode && this.state.hardMode.placedItems) {
                    if (!this.state.hardMode.placedItems.has(icon)) {
                        this.state.hardMode.placedItems.set(icon, []);
                    }
                    this.state.hardMode.placedItems.get(icon).push(dragElement);
                    Game.Debug.logGameFlow('困難模式物品放置', { 
                        icon, 
                        currentCount: this.state.hardMode.placedItems.get(icon).length,
                        placedItems: Array.from(this.state.hardMode.placedItems.entries()).map(([k, v]) => [k, v.length])
                    });
                }
            }

            return true; // 放置成功
        },

        handleItemReturn(dragElement) {
            const difficulty = this.state.settings.difficulty;
            const config = this.ModeConfig[difficulty];
            const sourceContainer = document.querySelector('.source-container');
            const originalParent = dragElement.parentElement;

            // 📝 詳細log記錄返回資訊
            Game.Debug.logGameFlow('物品返回源區域', {
                itemId: dragElement.dataset.id || dragElement.dataset.index,
                fromParent: originalParent?.className,
                fromParentId: originalParent?.id
            });

            if (sourceContainer) {
                // 🔧 [F3 做法] 使用 display toggle 而非 DOM 移動
                const itemId = dragElement.dataset.id;
                let originalRestored = false;

                // 顯示原始物品
                if (itemId) {
                    const sourceItem = sourceContainer.querySelector(`.draggable-item[data-id="${itemId}"]`);
                    if (sourceItem && sourceItem !== dragElement) {
                        sourceItem.style.display = '';
                        delete sourceItem.dataset.placed;
                        originalRestored = true;
                        Game.Debug.logGameFlow('F3 做法：顯示原始物品', { itemId });
                    }
                }

                // 🔧 [普通模式修正] 處理從 drop-zone 拖回的情況
                if (originalParent && originalParent.classList.contains('drop-zone')) {
                    originalParent.classList.remove('filled');

                    // 恢復放置提示
                    const placementHint = originalParent.querySelector('.placement-hint');
                    if (placementHint) {
                        placementHint.style.display = 'block';
                    }

                    Game.Debug.logGameFlow('普通模式drop-zone狀態恢復', {
                        dropIndex: originalParent.dataset.dropIndex,
                        removedFilled: true
                    });
                }

                // 如果是從placement-zone拖回，檢查是否需要重新顯示提示文字
                if (originalParent && originalParent.classList.contains('placement-zone')) {
                    const remainingItems = originalParent.querySelectorAll('.draggable-item, .placed-item');
                    // 減1是因為當前的 dragElement 還沒被移除
                    if (remainingItems.length <= 1) {
                        const placementHint = originalParent.querySelector('.placement-hint');
                        if (placementHint) {
                            placementHint.style.display = 'block';
                        }
                    }
                }

                // 如果是從格子型容器拖回，恢復格子的狀態
                if (originalParent && originalParent.classList.contains('filled') &&
                    !originalParent.classList.contains('drop-zone')) { // 避免重複處理drop-zone
                    originalParent.classList.remove('filled');
                }

                // 困難模式需要更新 placedItems Map
                if (difficulty === 'hard' && this.state.hardMode && this.state.hardMode.placedItems) {
                    const icon = dragElement.dataset.icon;
                    if (this.state.hardMode.placedItems.has(icon)) {
                        const itemList = this.state.hardMode.placedItems.get(icon);
                        const index = itemList.indexOf(dragElement);
                        if (index > -1) {
                            itemList.splice(index, 1);
                            if (itemList.length === 0) {
                                this.state.hardMode.placedItems.delete(icon);
                            }
                            Game.Debug.logGameFlow('困難模式物品返回', {
                                icon,
                                remainingCount: itemList.length,
                                placedItems: Array.from(this.state.hardMode.placedItems.entries()).map(([k, v]) => [k, v.length])
                            });
                        }
                    }
                }

                // 🔧 [Bug修復] 條件性移除：只有當原始物品已恢復時才移除拖曳元素
                if (originalRestored) {
                    dragElement.remove();
                } else {
                    // Fallback：將拖曳元素直接移回物品區
                    dragElement.style.display = '';
                    delete dragElement.dataset.placed;
                    // 移除可能的 placed 相關 class
                    dragElement.classList.remove('placed', 'filled');
                    sourceContainer.appendChild(dragElement);
                    Game.Debug.logGameFlow('Fallback：拖曳元素直接移回物品區', { itemId });
                }

                this.Audio.playSound('select', difficulty, config);
            }
        },

        handleTurnComplete(difficulty, config) {
            Game.Debug.logGameFlow('回合完成', {
                difficulty,
                correctAnswer: this.state.correctAnswer,
                modeType: config.modeType
            });

            // 修正：簡單模式也應該更新分數和進度
            this.state.score += 10;
            this.updateScore();

            // 記錄當前答案作為下一題的參考（避免重複）
            this.state.lastAnswer = this.state.correctAnswer;
            Game.Debug.logGameFlow('記錄上一題答案', {
                lastAnswer: this.state.lastAnswer,
                nextQuestionWillAvoid: this.state.lastAnswer
            });

            // 檢查是否為最後一題
            const isLastQuestion = this.state.currentTurn >= this.state.totalTurns;
            const endingText = isLastQuestion ? '，測驗結束' : '，進入下一題';

            // 🔧 [修正] 播放完成語音後自動進入下一題
            // 動態追加結尾文字
            this.Speech.speak('turnComplete', difficulty, config, {
                targetCount: this.state.correctAnswer,
                _suffix: endingText
            }, () => {
                // 如果是最後一題，直接顯示結果（不需要延遲）
                if (isLastQuestion) {
                    this.endGame();
                } else {
                    // 🔧 [Bug修復] 使用 TimerManager 管理計時器
                    Game.TimerManager.setTimeout(async () => {
                        await this.startNewTurn();
                    }, config.timing.nextQuestionDelay || 2000, 'turnTransition');
                }
            });
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

        getItemName(icon) {
            // 根據圖示返回中文名稱（完整對應 EmojiLibrary 三個主題）
            const itemNames = {
                // 水果（EmojiLibrary.food.fruits）
                '🍎': '蘋果', '🍊': '橘子', '🍋': '檸檬', '🍌': '香蕉', '🍉': '西瓜',
                '🍇': '葡萄', '🍓': '草莓', '🍑': '水蜜桃', '🍒': '櫻桃', '🥝': '奇異果',
                '🍈': '哈密瓜', '🍐': '西洋梨', '🥭': '芒果', '🍍': '鳳梨',
                // 動物（EmojiLibrary.animals.mammals）
                '🐶': '小狗', '🐱': '小貓', '🐭': '老鼠', '🐹': '倉鼠', '🐰': '兔子',
                '🦊': '狐狸', '🐻': '熊', '🐼': '貓熊', '🐨': '無尾熊', '🐯': '老虎',
                '🦁': '獅子', '🐮': '乳牛', '🐷': '小豬', '🐸': '青蛙',
                // 交通工具（EmojiLibrary.services.transport）
                '🚗': '轎車', '🚕': '計程車', '🚙': '越野車', '🚌': '公車', '🚎': '電車',
                '🚄': '高鐵', '🚅': '高速列車', '🚆': '火車', '🚇': '地鐵', '🚂': '蒸汽火車',
                '✈️': '飛機', '🚢': '輪船'
            };
            return itemNames[icon] || icon;
        },

        handleItemClick(event) {
            // 🔧 [新增] 防止點擊靜態圖示（目標區的參考圖示）
            const staticItemCheck = event.target.closest('.static-item');
            if (staticItemCheck) {
                Game.Debug.logUserAction('點擊到靜態圖示，操作已忽略', { element: staticItemCheck });
                return;
            }

            const difficulty = this.state.difficulty || this.state.settings?.difficulty;
            if (!difficulty) {
                Game.Debug.logUserAction('無法獲取難度設定，跳過點擊處理');
                return;
            }
            
            const config = this.ModeConfig[difficulty];
            if (!config) {
                Game.Debug.logUserAction('無法獲取模式配置，跳過點擊處理', { difficulty });
                return;
            }
            
            // 檢查是否啟用點擊移動功能
            if (!config.clickToMoveConfig?.enabled) {
                Game.Debug.logUserAction('點擊移動功能未啟用', { difficulty });
                return;
            }
            
            Game.Debug.logUserAction('處理物品點擊事件', { target: event.target });
            
            // 找到實際的拖曳元素（處理嵌套元素如 img）
            let clickedElement = event.target;
            if (!clickedElement.classList.contains('draggable-item') && !clickedElement.classList.contains('placed-item')) {
                clickedElement = event.target.closest('.draggable-item, .placed-item');
            }
            
            if (!clickedElement) {
                // 可能點擊了放置區域
                this.handleZoneClick(event);
                return;
            }
            
            Game.Debug.logUserAction('找到可點擊元素', { 
                element: clickedElement, 
                classes: clickedElement.className 
            });
            
            // 判斷是要放置還是取回
            if (clickedElement.classList.contains('placed-item') || clickedElement.closest('.placement-zone, .quantity-container, .drop-zone')) {
                // 點擊已放置的物品 - 嘗試取回
                this.handleClickToReturn(clickedElement, event);
            } else {
                // 點擊源區域的物品 - 嘗試選擇或放置
                this.handleClickToPlace(clickedElement, event);
            }
        },

        handleClickToPlace(clickedElement, event) {
            const difficulty = this.state.difficulty || this.state.settings?.difficulty;
            const config = this.ModeConfig[difficulty];
            
            if (!config) {
                Game.Debug.logUserAction('無法獲取配置，跳過點擊放置');
                return;
            }
            
            if (!config.clickToMoveConfig?.allowClickToPlace) {
                Game.Debug.logUserAction('此模式不允許點擊放置');
                return;
            }
            
            // 清除之前的選擇
            this.clearItemSelection();
            
            // 標記為選中
            clickedElement.classList.add(config.cssClasses.selectedItem);
            this.state.selectedClickItem = {
                element: clickedElement,
                id: clickedElement.dataset.id,
                icon: clickedElement.dataset.icon,
                index: clickedElement.dataset.index
            };
            
            // 音效和語音回饋
            if (config.clickToMoveConfig.audioFeedback) {
                this.Audio.playSound('select', difficulty, config);
            }
            
            if (config.clickToMoveConfig.speechFeedback) {
                const itemName = this.getItemName(clickedElement.dataset.icon);
                this.Speech.speak('itemSelected', difficulty, config, { itemName });
            }
            
            Game.Debug.logUserAction('物品已選擇', {
                element: clickedElement,
                id: clickedElement.dataset.id,
                icon: clickedElement.dataset.icon
            });
        },

        handleClickToReturn(clickedElement, event) {
            const difficulty = this.state.difficulty || this.state.settings?.difficulty;
            const config = this.ModeConfig[difficulty];
            
            if (!config) {
                Game.Debug.logUserAction('無法獲取配置，跳過點擊取回');
                return;
            }
            
            if (!config.clickToMoveConfig?.allowClickToReturn) {
                Game.Debug.logUserAction('此模式不允許點擊取回');
                return;
            }
            
            Game.Debug.logUserAction('嘗試點擊取回物品', { element: clickedElement });
            
            // 根據難度模式執行不同的取回邏輯
            switch (difficulty) {
                case 'easy':
                    // 簡單模式不允許取回
                    break;
                case 'normal':
                    this.handleNormalModeClickReturn(clickedElement);
                    break;
                case 'hard':
                    this.handleHardModeClickReturn(clickedElement);
                    break;
            }
        },

        handleZoneClick(event) {
            const difficulty = this.state.difficulty || this.state.settings?.difficulty;
            const config = this.ModeConfig[difficulty];
            
            if (!config) {
                Game.Debug.logUserAction('無法獲取配置，跳過區域點擊');
                return;
            }
            
            if (!this.state.selectedClickItem) {
                Game.Debug.logUserAction('沒有選中的物品');
                return;
            }
            
            // 找到點擊的放置區域
            let dropZone = event.target.closest('.drop-zone, .placement-zone, .placement-guide, .quantity-container, .normal-grid-item, .target-grid-item');
            
            if (!dropZone) {
                Game.Debug.logUserAction('點擊位置不是有效的放置區域');
                return;
            }
            
            Game.Debug.logUserAction('找到放置區域', { zone: dropZone });
            
            // 創建模擬拖放事件來重用現有邏輯
            const mockDropEvent = this.createMockDropEvent(this.state.selectedClickItem, dropZone);
            
            // 呼叫現有的拖放處理邏輯
            this.handleDrop(mockDropEvent);
            
            // 清除選擇狀態
            this.clearItemSelection();
        },

        handleNormalModeClickReturn(clickedElement) {
            const difficulty = this.state.difficulty || this.state.settings?.difficulty;
            const config = this.ModeConfig[difficulty];
            
            if (!config) {
                Game.Debug.logUserAction('無法獲取配置，跳過普通模式取回');
                return;
            }
            
            // 在普通模式中，找到物品在grid中的位置
            const gridItem = clickedElement.closest('.normal-grid-item');
            if (!gridItem) {
                Game.Debug.logUserAction('無法找到grid項目');
                return;
            }
            
            const itemIndex = parseInt(gridItem.dataset.index);
            if (isNaN(itemIndex)) {
                Game.Debug.logUserAction('無效的項目索引');
                return;
            }
            
            // 將物品移回源區域
            this.moveItemBackToSource(clickedElement, itemIndex, 'normal');
            
            // 語音回饋
            if (config.clickToMoveConfig.speechFeedback) {
                this.Speech.speak('itemReturnedByClick', difficulty, config);
            }
            
            // 音效回饋
            if (config.clickToMoveConfig.audioFeedback) {
                this.Audio.playSound('select', difficulty, config);
            }
        },

        handleHardModeClickReturn(clickedElement) {
            const difficulty = this.state.difficulty || this.state.settings?.difficulty;
            const config = this.ModeConfig[difficulty];
            
            if (!config) {
                Game.Debug.logUserAction('無法獲取配置，跳過困難模式取回');
                return;
            }
            
            // 在困難模式中，直接從放置區域移除物品
            const placementZone = clickedElement.closest('.placement-zone');
            if (placementZone) {
                // 將物品移回源區域
                this.moveItemBackToSource(clickedElement, null, 'hard');
                
                // 語音回饋
                if (config.clickToMoveConfig.speechFeedback) {
                    this.Speech.speak('itemReturnedByClick', difficulty, config);
                }
                
                // 音效回饋
                if (config.clickToMoveConfig.audioFeedback) {
                    this.Audio.playSound('select', difficulty, config);
                }
            }
        },

        moveItemBackToSource(placedElement, originalIndex, mode) {
            const sourceContainer = document.querySelector('.source-container');
            if (!sourceContainer) {
                Game.Debug.logError('找不到源容器');
                return;
            }

            // 🔧 [F3 做法] 使用 display toggle 而非創建新元素
            const itemId = placedElement.dataset.id;

            // 顯示原始物品
            if (itemId) {
                const sourceItem = sourceContainer.querySelector(`.draggable-item[data-id="${itemId}"]`);
                if (sourceItem) {
                    sourceItem.style.display = '';
                    delete sourceItem.dataset.placed;
                    Game.Debug.logGameFlow('F3 做法：顯示原始物品', { itemId });
                }
            }

            // 移除放置區的複製品
            placedElement.remove();

            // 更新對應的狀態
            if (mode === 'normal' && originalIndex !== null) {
                this.state.gridItems[originalIndex] = { filled: false, icon: '', element: null };
                this.state.placedCount = Math.max(0, this.state.placedCount - 1);
            } else if (mode === 'hard') {
                // 更新困難模式的相關狀態
                this.updateHardModeStateAfterReturn(placedElement);
            }

            Game.Debug.logUserAction('物品已移回源區域（F3 做法）', {
                mode,
                originalIndex,
                itemId
            });
        },

        updateHardModeStateAfterReturn(placedElement) {
            // 困難模式的狀態更新邏輯
            // 根據實際的困難模式實作來調整
            if (this.state.placedItems) {
                const itemId = placedElement.dataset.id;
                this.state.placedItems = this.state.placedItems.filter(item => item.id !== itemId);
            }
        },

        createMockDropEvent(selectedItem, dropZone) {
            // 創建模擬的拖放事件，重用現有的拖放邏輯
            return {
                preventDefault: () => {},
                stopPropagation: () => {},
                target: dropZone,
                dataTransfer: {
                    getData: (type) => {
                        if (type === 'text/plain') return selectedItem.id;
                        if (type === 'text/icon') return selectedItem.icon;
                        return '';
                    }
                },
                // 標記這是一個點擊產生的事件
                isClickEvent: true
            };
        },

        clearItemSelection() {
            const difficulty = this.state.difficulty || this.state.settings?.difficulty;
            const config = this.ModeConfig[difficulty];
            
            if (!config) {
                Game.Debug.logUserAction('無法獲取配置，但仍嘗試清除選擇狀態');
                if (this.state.selectedClickItem) {
                    this.state.selectedClickItem.element.classList.remove('selected-item');
                    this.state.selectedClickItem = null;
                }
                return;
            }
            
            if (this.state.selectedClickItem) {
                this.state.selectedClickItem.element.classList.remove(config.cssClasses.selectedItem);
                this.state.selectedClickItem = null;
                Game.Debug.logUserAction('清除物品選擇狀態');
            }
        },

        // =====================================================
        // 必要的輔助函數
        // =====================================================
        
        updateProgress() {
            const { currentTurn, totalTurns, score, settings } = this.state;
            const config = this.ModeConfig[settings.difficulty];
            
            if (this.elements.progressInfo && config?.textTemplates?.progressText) {
                const progressText = config.textTemplates.progressText
                    .replace('{current}', currentTurn)
                    .replace('{total}', totalTurns);
                this.elements.progressInfo.textContent = progressText;
            }
            
            if (this.elements.scoreInfo && config?.textTemplates?.scoreText) {
                const scoreText = config.textTemplates.scoreText.replace('{score}', score);
                this.elements.scoreInfo.textContent = scoreText;
            }
            
            if (this.elements.gameTitle) {
                this.elements.gameTitle.textContent = this.gameData.title;
            }
        },

        updateScore() {
            if (this.elements.scoreInfo) {
                const config = this.ModeConfig[this.state.settings.difficulty];
                if (config?.textTemplates?.scoreText) {
                    const scoreText = config.textTemplates.scoreText.replace('{score}', this.state.score);
                    this.elements.scoreInfo.textContent = scoreText;
                }
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

        getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        endGame() {
            if (this.state.isEndingGame) {
                Game.Debug.log('flow', '阻止重複遊戲結束');
                return;
            }
            this.state.isEndingGame = true;
            AssistClick.deactivate();
            // 🔧 [Bug修復] 清理回合轉換相關計時器
            Game.TimerManager.clearByCategory('turnTransition');

            const difficulty = this.state.settings.difficulty;
            const totalQuestions = this.state.totalTurns;
            const score = this.state.score;
            const correctAnswers = Math.floor(score / 10); // 每答對一題得10分
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
                                <div class="achievement-item">🎯 理解一對一對應概念</div>
                                <div class="achievement-item">🔢 練習圖形與數量的配對</div>
                                <div class="achievement-item">📝 建立基礎數學概念</div>
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

                    /* 🔧 [Bug修復] @keyframes fadeIn, celebrate, bounce, glow 已移至全局動畫樣式 */

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
            const rewardLink = app.querySelector('#endgame-reward-link');
            if (rewardLink) {
                rewardLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                });
            }

            this.Audio.playSound('success', null, { audioFeedback: true });
            this.triggerConfetti();
        },

        handleHardComplete() {
            // 🔧 [防連點] 檢查是否正在處理或按鈕已禁用
            const completeBtn = document.getElementById('complete-btn');
            if (this.state.isAnswering || completeBtn?.disabled) {
                Game.Debug.logUserAction('[F1] 防抖：handleHardComplete 忽略重複點擊');
                return;
            }
            this.state.isAnswering = true;

            const difficulty = this.state.settings.difficulty;
            const config = this.ModeConfig[difficulty];
            const { correctAnswerSet } = this.state.hardMode;

            const placementZone = document.getElementById('placement-zone');
            const placedItems = placementZone.querySelectorAll('.draggable-item');
            const placedCounts = new Map();
            placedItems.forEach(item => {
                const icon = item.dataset.icon;
                placedCounts.set(icon, (placedCounts.get(icon) || 0) + 1);
            });

            let isCorrect = true;
            if (placedCounts.size !== correctAnswerSet.size) {
                isCorrect = false;
            } else {
                for (const [correctIcon, requiredCount] of correctAnswerSet.entries()) {
                    if (placedCounts.get(correctIcon) !== requiredCount) {
                        isCorrect = false;
                        break;
                    }
                }
            }

            const btnText = completeBtn?.querySelector('.btn-text');
            const btnIcon = completeBtn?.querySelector('.btn-icon');
            if (completeBtn) {
                completeBtn.disabled = true;
                if (btnText) btnText.textContent = '判斷中...';
                if (btnIcon) btnIcon.textContent = '⏳';
            }

            // 🔧 [Bug修復] 使用 TimerManager 管理計時器
            Game.TimerManager.setTimeout(() => {
                if (isCorrect) {
                    this.Audio.playSound('correct02', difficulty, config);
                    this.startFireworksAnimation();
                    this.showHardSuccess();
                    this.Speech.speak('correct', difficulty, config, {}, () => {
                        Game.TimerManager.setTimeout(() => {
                            this.handleTurnComplete(difficulty, config);
                        }, 1000, 'turnTransition');
                    });
                } else {
                    this.Audio.playSound('error', difficulty, config);
                    this.Speech.speak('incorrect', difficulty, config);

                    document.getElementById('placement-zone').classList.add('error-shake');
                    Game.TimerManager.setTimeout(() => {
                        document.getElementById('placement-zone').classList.remove('error-shake');
                        if (completeBtn) {
                            completeBtn.disabled = false;
                            if (btnText) btnText.textContent = '完成對應';
                            if (btnIcon) btnIcon.textContent = '✨';
                        }
                        // 🔧 [Bug修復] 錯誤路徑需重置 isAnswering，否則防抖會永久封鎖後續點擊
                        this.state.isAnswering = false;
                    }, 2000, 'animation');
                }
            }, 500, 'animation');
        },

        triggerConfetti() {
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        },

        // =====================================================
        // 困難模式專用處理函數
        // =====================================================

        // 【修改後】 handleHardDrop 
        handleHardDrop(event, draggedElement, difficulty, config) {
            const dropTarget = event.target.closest('.placement-zone, .source-container, .target-grid-item');
            if (!dropTarget) return; // 忽略無效的放置點

            const originalParent = draggedElement.parentElement;

            // --- 邏輯 A: 將圖示從「對應框」拖曳回「物品區」 ---
            if (dropTarget.classList.contains('source-container')) {
                // 必須是從對應框內拖出的圖示才有效
                if (originalParent.closest('.placement-zone')) {
                    // 如果原來的格子是放置格，將其恢復為空格狀態
                    if (originalParent.classList.contains('target-grid-item')) {
                        originalParent.classList.remove('filled');
                        originalParent.innerHTML = `<span class="position-hint">${parseInt(originalParent.dataset.index) + 1}</span>`;
                    }
                    // 將圖示移回物品區
                    dropTarget.appendChild(draggedElement);
                    this.Audio.playSound('select', difficulty, config);
                }
                return; // 結束處理
            }
            
            // --- 邏輯 B: 在「對應框」內部放置或移動圖示 ---
            let targetSlot;
            // 情況 B-1: 直接拖曳到某個格子上
            if (dropTarget.classList.contains('target-grid-item')) {
                targetSlot = dropTarget;
            } 
            // 情況 B-2: 拖曳到對應框的背景區域，自動尋找第一個空格
            else if (dropTarget.classList.contains('placement-zone')) {
                targetSlot = dropTarget.querySelector('.target-grid-item:not(.filled)');
            }
            
            // 如果找不到可放置的格子 (例如所有格子都滿了)
            if (!targetSlot) {
                this.Audio.playSound('error', difficulty, config);
                return;
            }
            
            const itemAlreadyInSlot = targetSlot.querySelector('.draggable-item');

            // 避免將圖示拖放到自己身上
            if (itemAlreadyInSlot === draggedElement) return;

            // **執行移動或交換的核心邏輯**
            
            // 1. 將正在拖曳的圖示放入目標格子
            targetSlot.appendChild(draggedElement);
            targetSlot.classList.add('filled');
            
            // 🔧 [參考 a1 修正] 直接使用 JavaScript 隱藏提示文字，確保其消失
            const hint = targetSlot.querySelector('.position-hint');
            if (hint) {
                hint.style.display = 'none';
            }
            
            const originalParentIsSlot = originalParent.classList.contains('target-grid-item');

            // 2. 處理目標格子中原有的圖示 (如果有的話)
            if (itemAlreadyInSlot) {
                // 目標格有圖示，進行「交換」
                if (originalParentIsSlot) {
                    // 如果是從另一個格子拖曳來的，則將被交換的圖示放回原來的格子
                    originalParent.appendChild(itemAlreadyInSlot);
                } else {
                    // 如果是從「物品區」拖曳來的，則將被交換的圖示送回「物品區」
                    // 🔧 [F3 做法] 使用 display toggle 而非 DOM 移動
                    const sourceContainer = document.querySelector('.source-container');
                    const itemId = itemAlreadyInSlot.dataset.id;

                    // 顯示原始物品
                    if (itemId && sourceContainer) {
                        const sourceItem = sourceContainer.querySelector(`.draggable-item[data-id="${itemId}"]`);
                        if (sourceItem) {
                            sourceItem.style.display = '';
                            delete sourceItem.dataset.placed;
                            Game.Debug.logGameFlow('F3 做法：顯示原始物品（困難模式格子交換）', { itemId });
                        }
                    }

                    // 移除放置區的複製品
                    itemAlreadyInSlot.remove();
                }
            } else {
                // 目標格是空的，代表是「移動」
                // 如果是從另一個格子移動來的，則將原來的格子恢復為空格
                if (originalParentIsSlot) {
                    originalParent.classList.remove('filled');
                    originalParent.innerHTML = `<span class="position-hint">${parseInt(originalParent.dataset.index) + 1}</span>`;
                }
            }
            
            // 為任何成功的放置或移動提供正面音效回饋
            this.Audio.playSound('correct', difficulty, config);
        },



        // 【修改後】 handleHardComplete 

        handleHintClick() {
            const difficulty = this.state.settings.difficulty;
            const config = this.ModeConfig[difficulty];
            
            Game.Debug.logUserAction('點擊提示按鈕', { 
                difficulty, 
                hasConfig: !!config,
                hasHardMode: !!this.state.hardMode 
            });
            
            this.Audio.playSound('select', difficulty, config);
            this.Speech.speak('hintUsed', difficulty, config);

            // 🔧 [Bug修復] 防止 hardMode 為 null 時崩潰（非困難模式不應出現提示按鈕）
            if (!this.state.hardMode) {
                Game.Debug.logError('handleHintClick: hardMode 未初始化');
                return;
            }
            const { correctAnswerSet, placedItems } = this.state.hardMode;
            const neededIcons = new Map();

            // 找出還需要哪些圖示
            correctAnswerSet.forEach((requiredCount, icon) => {
                const placedCount = placedItems.has(icon) ? placedItems.get(icon).length : 0;
                if (placedCount < requiredCount) {
                    neededIcons.set(icon, requiredCount - placedCount);
                }
            });

            Game.Debug.logGameFlow('需要提示的圖示', { 
                neededIcons: Array.from(neededIcons.entries()),
                neededIconsSize: neededIcons.size 
            });

            // 在來源區找到這些圖示並加上提示動畫
            const sourceContainer = document.querySelector('.source-container');
            let totalGlowItems = 0;
            
            neededIcons.forEach((count, icon) => {
                const itemsInSource = Array.from(sourceContainer.querySelectorAll(`[data-icon="${icon}"]`));
                Game.Debug.logGameFlow(`尋找圖示 ${icon}`, { 
                    needCount: count,
                    foundInSource: itemsInSource.length 
                });
                
                for(let i = 0; i < Math.min(count, itemsInSource.length); i++) {
                    itemsInSource[i].classList.add('hint-glow');
                    totalGlowItems++;
                    Game.Debug.logGameFlow(`添加提示動畫`, { 
                        icon,
                        elementClass: itemsInSource[i].className 
                    });
                }
            });

            Game.Debug.logGameFlow('提示動畫添加完成', { 
                totalGlowItems,
                animationDuration: config.timing.hintAnimationDuration 
            });

            // 動畫結束後移除 class
            // 🔧 [Bug修復] 使用 TimerManager 管理提示動畫清除計時器（原 raw setTimeout）
            Game.TimerManager.setTimeout(() => {
                const glowElements = document.querySelectorAll('.hint-glow');
                Game.Debug.logGameFlow('移除提示動畫', { glowElementsCount: glowElements.length });
                glowElements.forEach(el => el.classList.remove('hint-glow'));
            }, config.timing.hintAnimationDuration || 1500, 'animation');
        },

        updatePlacementZoneHint(zoneId) {
            const placementZone = document.getElementById(zoneId);
            if (!placementZone) {
                Game.Debug.logUI('找不到放置區', zoneId);
                return;
            }
            
            const hint = placementZone.querySelector('.zone-hint');
            const hasItems = placementZone.querySelector('.draggable-item');

            Game.Debug.logUI('更新提示文字', zoneId, {
                hintFound: !!hint,
                hasItems: !!hasItems,
                itemCount: placementZone.querySelectorAll('.draggable-item').length
            });

            if (hint) {
                hint.classList.toggle('has-items', !!hasItems);
            }
        },

        // =====================================================
        // 🎨 自訂主題圖片上傳功能 - 配置驅動 (仿a1_simulated_shopping)
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
                fileInput.value = '';
                try {
                    fileInput.click();
                } catch (error) {
                    Game.Debug.logError('觸發檔案選擇器錯誤', error);
                }
            } else {
                Game.Debug.logError('找不到檔案輸入元素');
            }
        },

        async handleImageUpload(event) {
            Game.Debug.logUserAction('處理圖片上傳', event.target.files);
            const file = event.target.files[0];

            if (!file) {
                Game.Debug.logUserAction('沒有選擇檔案');
                return;
            }

            // 檢查文件類型
            if (!file.type.startsWith('image/')) {
                alert('請選擇圖片檔案！');
                return;
            }

            // 使用壓縮功能處理圖片（不再需要檢查大小，壓縮後會很小）
            try {
                Game.Debug.logUserAction('壓縮圖片中...');
                const compressedImage = await compressImage(file, 200, 0.7);
                this.showImagePreview(compressedImage);
            } catch (err) {
                Game.Debug.error('圖片壓縮失敗:', err);
                alert('圖片處理失敗，請重試！');
            }
        },

        showImagePreview(imageDataUrl) {
            Game.Debug.logUserAction('顯示圖片預覽');
            const modal = document.getElementById('image-preview-modal');
            const previewImg = document.getElementById('preview-image');
            
            if (!modal || !previewImg) {
                Game.Debug.logError('找不到預覽元素');
                return;
            }
            
            previewImg.src = imageDataUrl;
            modal.classList.add('show');
            
            // 儲存圖片資料供後續使用
            this.tempImageData = imageDataUrl;
            
            // 清空並聚焦到名稱輸入框
            const nameInput = document.getElementById('modal-custom-name');
            if (nameInput) {
                nameInput.value = '';
                Game.TimerManager.setTimeout(() => nameInput.focus(), 100, 'ui');
            }
        },

        closeImagePreview() {
            Game.Debug.logUserAction('關閉圖片預覽');
            const modal = document.getElementById('image-preview-modal');
            if (modal) {
                modal.classList.remove('show');
            }
            
            // 清除文件選擇和臨時資料
            const fileInput = document.getElementById('custom-image');
            if (fileInput) {
                fileInput.value = '';
            }
            this.tempImageData = null;
        },

        confirmAddCustomItem() {
            const name = document.getElementById('modal-custom-name').value.trim();
            
            if (!name) {
                alert('請輸入圖示名稱！');
                return;
            }
            
            if (!this.tempImageData) {
                alert('圖片資料遺失，請重新上傳！');
                return;
            }
            
            // 檢查名稱是否重複
            const isDuplicate = this.state.customItems.some(item => item.name === name);
            if (isDuplicate) {
                alert('圖示名稱已存在，請使用不同的名稱！');
                return;
            }
            
            // 新增自訂圖示到狀態
            const customItem = {
                imageData: this.tempImageData,
                name: name,
                id: Date.now() // 使用時間戳作為唯一ID
            };
            
            this.state.customItems.push(customItem);
            
            // 更新自訂主題的圖示陣列
            this.gameData.themes.custom.push(this.tempImageData);
            
            Game.Debug.logUserAction('新增自訂圖示', { name, id: customItem.id });
            
            // 關閉預覽視窗
            this.closeImagePreview();
            
            // 🔧 [優化] 只更新自訂主題設定區域，避免閃爍
            this.updateCustomThemeSettings();
            
            // 語音回饋（同 F2：使用 speechTemplates.addCustomItem 模板）
            const { difficulty } = this.state.settings;
            const config = this.ModeConfig[difficulty] || this.ModeConfig.normal;
            this.Speech.speak('addCustomItem', difficulty, config, { itemName: name });
        },

        removeCustomItem(index) {
            const item = this.state.customItems[index];
            if (!item) return;
            
            if (confirm(`確定要刪除圖示「${item.name}」嗎？`)) {
                // 從狀態中移除
                this.state.customItems.splice(index, 1);
                
                // 從主題陣列中移除對應的圖片資料
                const imageIndex = this.gameData.themes.custom.indexOf(item.imageData);
                if (imageIndex > -1) {
                    this.gameData.themes.custom.splice(imageIndex, 1);
                }
                
                Game.Debug.logUserAction('移除自訂圖示', { name: item.name, index });
                
                // 🔧 [優化] 只更新自訂主題設定區域，避免閃爍
                this.updateCustomThemeSettings();
                
                // 語音回饋
                this.Speech.speak('removeCustomItem', this.state.settings.difficulty, this.ModeConfig[this.state.settings.difficulty], {
                    itemName: item.name
                });
            }
        },

        // =====================================================
        // 主題系統
        // =====================================================
        initThemeSystem() {
            // 初始化主題選擇器事件
            const themeSelector = document.querySelector('.theme-selector');
            if (themeSelector) {
                Game.EventManager.on(themeSelector, 'click', this.handleThemeSelection.bind(this), {}, 'gameUI');
            }

            // 初始化自訂主題顏色選擇器
            const colorPickers = document.querySelectorAll('#custom-theme-controls input[type="color"]');
            colorPickers.forEach(picker => {
                Game.EventManager.on(picker, 'input', this.handleCustomColorChange.bind(this), {}, 'gameUI');
            });
            
            // 設置默認主題
            this.setInitialTheme();
        },
        
        handleThemeSelection(event) {
            const themeOption = event.target.closest('.theme-option');
            if (!themeOption) return;
            
            const themeName = themeOption.dataset.theme;
            
            // 更新選中狀態
            document.querySelectorAll('.theme-option').forEach(option => {
                option.classList.remove('active');
            });
            themeOption.classList.add('active');
            
            // 應用主題
            this.applyTheme(themeName);
            
            // 顯示/隱藏自訂主題控制項
            const customControls = document.getElementById('custom-theme-controls');
            if (customControls) {
                customControls.style.display = themeName === 'custom' ? 'block' : 'none';
            }
            
            // 播放選擇音效
            this.Audio.playSound('select', null, { audioFeedback: true });
        },
        
        applyTheme(themeName) {
            const body = document.body;
            
            // 移除現有主題類別
            body.classList.remove('theme-ai-robot', 'theme-dark', 'theme-custom');
            body.removeAttribute('data-theme');
            
            // 應用新主題
            switch (themeName) {
                case 'ai-robot':
                    body.classList.add('theme-ai-robot');
                    body.setAttribute('data-theme', 'ai-robot');
                    break;
                case 'dark':
                    body.classList.add('theme-dark');
                    body.setAttribute('data-theme', 'dark');
                    break;
                case 'custom':
                    body.classList.add('theme-custom');
                    body.setAttribute('data-theme', 'custom');
                    this.applyCustomTheme();
                    break;
                default:
                    body.setAttribute('data-theme', 'default');
                    break;
            }
            
            // 添加過渡動畫類別
            body.classList.add('theme-transitioning');
            Game.TimerManager.setTimeout(() => {
                body.classList.remove('theme-transitioning');
            }, 300, 'animation');
            
            // 儲存主題設定
            localStorage.setItem('f1-theme', themeName);
            
            // 如果存在主題系統，通知主題變更
            if (window.setTheme) {
                window.setTheme(themeName);
            }
        },
        
        setInitialTheme() {
            // 檢查是否有儲存的主題設定
            const savedTheme = localStorage.getItem('f1-theme') || 'ai-robot';
            
            // 設置默認選中狀態
            const defaultOption = document.querySelector(`[data-theme="${savedTheme}"]`);
            if (defaultOption) {
                defaultOption.classList.add('active');
                this.applyTheme(savedTheme);
                
                // 如果是自訂主題，顯示控制項
                if (savedTheme === 'custom') {
                    const customControls = document.getElementById('custom-theme-controls');
                    if (customControls) {
                        customControls.style.display = 'block';
                        this.loadCustomColors();
                    }
                }
            }
        },
        
        handleCustomColorChange(event) {
            const colorType = event.target.id.replace('-color-picker', '');
            const color = event.target.value;
            
            // 儲存顏色設定
            localStorage.setItem(`f1-custom-${colorType}`, color);
            
            // 更新預覽色點
            const colorDot = document.querySelector(`.custom-color-${colorType === 'primary' ? '1' : colorType === 'secondary' ? '2' : '3'}`);
            if (colorDot) {
                colorDot.style.background = color;
            }
            
            // 應用自訂主題
            if (document.body.getAttribute('data-theme') === 'custom') {
                this.applyCustomTheme();
            }
        },
        
        applyCustomTheme() {
            const primaryColor = localStorage.getItem('f1-custom-primary') || '#007bff';
            const secondaryColor = localStorage.getItem('f1-custom-secondary') || '#28a745';
            const backgroundColor = localStorage.getItem('f1-custom-background') || '#f8f9fa';
            
            // 創建或更新自訂CSS變數
            const root = document.documentElement;
            root.style.setProperty('--custom-primary', primaryColor);
            root.style.setProperty('--custom-secondary', secondaryColor);
            root.style.setProperty('--custom-bg', backgroundColor);
            root.style.setProperty('--custom-text', this.getContrastColor(backgroundColor));
        },
        
        loadCustomColors() {
            const primaryColor = localStorage.getItem('f1-custom-primary') || '#007bff';
            const secondaryColor = localStorage.getItem('f1-custom-secondary') || '#28a745';
            const backgroundColor = localStorage.getItem('f1-custom-background') || '#f8f9fa';
            
            // 設置顏色選擇器的值
            const primaryPicker = document.getElementById('primary-color-picker');
            const secondaryPicker = document.getElementById('secondary-color-picker');
            const backgroundPicker = document.getElementById('background-color-picker');
            
            if (primaryPicker) primaryPicker.value = primaryColor;
            if (secondaryPicker) secondaryPicker.value = secondaryColor;
            if (backgroundPicker) backgroundPicker.value = backgroundColor;
            
            // 更新預覽色點
            const colorDot1 = document.querySelector('.custom-color-1');
            const colorDot2 = document.querySelector('.custom-color-2');
            const colorDot3 = document.querySelector('.custom-color-3');
            
            if (colorDot1) colorDot1.style.background = primaryColor;
            if (colorDot2) colorDot2.style.background = secondaryColor;
            if (colorDot3) colorDot3.style.background = backgroundColor;
        },
        
        getContrastColor(hexColor) {
            // 簡單的對比色計算
            const hex = hexColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 128 ? '#000000' : '#ffffff';
        },

        // =====================================================================
        // HTML5 拖曳系統 - 整合版本
        // =====================================================================
        HTML5DragSystem: {
            isInitialized: false,
            dragState: {},
            activeDropZone: null, // 新增：追蹤目前懸停的放置區

            initialize(difficulty) {
                if (this.isInitialized) this.cleanup();
                Game.Debug.logGameFlow('初始化拖曳系統 (重構版)', { difficulty });

                const app = document.getElementById('app');
                if (!app) return;

                // 🔧 [Bug修復] 使用 EventManager 管理拖曳事件監聽器
                Game.EventManager.on(app, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
                Game.EventManager.on(app, 'dragend', this.handleDragEnd.bind(this), {}, 'dragSystem');
                Game.EventManager.on(app, 'dragover', this.handleDragOver.bind(this), {}, 'dragSystem');
                Game.EventManager.on(app, 'dragenter', this.handleDragEnter.bind(this), {}, 'dragSystem');
                Game.EventManager.on(app, 'dragleave', this.handleDragLeave.bind(this), {}, 'dragSystem');
                Game.EventManager.on(app, 'drop', this.handleDrop.bind(this), {}, 'dragSystem');

                this.setupTouchDragSupport(difficulty);
                this.isInitialized = true;
            },

            setupTouchDragSupport(difficulty) {
                if (!window.TouchDragUtility) return;
                window.TouchDragUtility.cleanupAll();
                const app = document.getElementById('app');

                // 🔧 [F3 做法] 可拖曳的物件：來源區的可見物品 或 任何已放置的物品
                const draggableSelector = '.source-container .draggable-item:not([style*="display: none"]), .placed-item';
                // 可放置的區域：所有放置槽 或 來源區容器
                const dropZoneSelector = '.drop-zone, .normal-grid-item, .target-grid-item, .placement-zone, .source-container';

                window.TouchDragUtility.registerDraggable(app, draggableSelector, {
                    onDragStart: (element) => {
                        this.dragState.dragElement = element;
                        return true;
                    },
                    onDrop: (dragElement, dropZone, event) => {
                        const finalDropZone = this.getPreciseDropZone(event, dropZoneSelector.split(', '));
                        if (finalDropZone) {
                            this.executeDrop(dragElement, finalDropZone);
                        }
                    },
                    onDragEnd: () => { this.dragState = {}; }
                });

                document.querySelectorAll(dropZoneSelector).forEach(zone => {
                     window.TouchDragUtility.registerDropZone(zone, (el, dz) => this.validateDrop(el, dz));
                });
            },
            
            getPreciseDropZone(event, validSelectors) {
                if (!event?.changedTouches?.length) return null;
                const touch = event.changedTouches[0];
                const clone = document.querySelector('.touch-drag-clone');
                if (clone) clone.style.display = 'none';
                const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
                if (clone) clone.style.display = '';
                return elements.find(el => validSelectors.some(selector => el.matches(selector.trim()))) || null;
            },

            setupSourceArea() {
                const sourceContainer = document.querySelector('.source-container');
                if (!sourceContainer) {
                    Game.Debug.logError(new Error('找不到來源區域容器'), 'HTML5拖曳系統初始化');
                    return;
                }

                // 使用事件委派
                sourceContainer.addEventListener('dragstart', this.handleDragStart.bind(this));
                sourceContainer.addEventListener('dragend', this.handleDragEnd.bind(this));
                
                // 設置所有可拖曳項目
                this.updateDraggableItems(sourceContainer);
                
                Game.Debug.logUI('來源區域拖曳設置完成', 'source-container');
            },

            /**
             * 設置放置區域
             */
            setupDropAreas(difficulty) {
                let dropSelectors = [];
                
                // 根據難度選擇對應的選擇器
                switch (difficulty) {
                    case 'easy':
                        dropSelectors = ['.drop-zone'];
                        break;
                    case 'normal':
                        dropSelectors = ['.drop-zone', '.normal-grid-item', '.placement-guide', '.placement-zone'];
                        break;
                    case 'hard':
                        dropSelectors = ['.drop-zone', '.target-grid-item', '.placement-guide', '.placement-zone'];
                        break;
                }

                dropSelectors.forEach(selector => {
                    const dropZones = document.querySelectorAll(selector);
                    dropZones.forEach(zone => {
                        this.setupSingleDropZone(zone);
                    });
                });

                Game.Debug.logUI('放置區域設置完成', 'drop-zones', { difficulty, zones: dropSelectors });
            },

            /**
             * 設置單個放置區域
             */
            setupSingleDropZone(zone) {
                zone.addEventListener('dragover', this.handleDragOver.bind(this));
                zone.addEventListener('drop', this.handleDrop.bind(this));
                zone.addEventListener('dragenter', this.handleDragEnter.bind(this));
                zone.addEventListener('dragleave', this.handleDragLeave.bind(this));
            },

            /**
             * 更新項目的可拖曳狀態
             */
            updateDraggableItems(container) {
                const items = container.querySelectorAll('.draggable-item:not(.static-item)');
                items.forEach(item => {
                    item.draggable = true;
                    item.setAttribute('data-draggable', 'true');
                });
            },

            /**
             * 設置 TouchDragUtility 手機支援
             */
            setupTouchDragSupport() {
                const currentDifficulty = Game.state?.settings?.difficulty;
                if (!currentDifficulty) {
                    Game.Debug.logError(new Error('難度未設定'), 'TouchDragUtility註冊');
                    return;
                }
                
                if (!window.TouchDragUtility) {
                    Game.Debug.logError(new Error('TouchDragUtility 未載入'), '手機拖曳支援');
                    return;
                }

                // 🔧 [F3 做法] 檢查可見的可拖拽元素是否存在，避免無意義的註冊
                const draggableElements = document.querySelectorAll('.draggable-item:not(.static-item):not([style*="display: none"])');
                if (draggableElements.length === 0) {
                    Game.Debug.logUserAction('可拖拽元素尚未渲染，跳過TouchDragUtility註冊');
                    return;
                }

                try {
                    Game.Debug.logUserAction('TouchDragUtility 已載入，開始註冊觸控拖曳', {
                        draggableCount: draggableElements.length,
                        difficulty: currentDifficulty
                    });

                    // 🔧 [F3 做法] 註冊來源區域和已放置區域 - 支援雙向拖拽（排除隱藏的物品）
                    const sourceContainer = document.querySelector('.source-container');
                    if (sourceContainer) {
                        window.TouchDragUtility.registerDraggable(
                            sourceContainer,
                            '.draggable-item:not(.static-item):not([style*="display: none"])',
                            {
                                onDragStart: Game.HTML5DragSystem.handleTouchDragStart.bind(Game.HTML5DragSystem),
                                onDrop: Game.HTML5DragSystem.handleTouchDrop.bind(Game.HTML5DragSystem)
                            }
                        );
                    }

                    // 🔧 [修正] 註冊放置區域作為可拖拽來源，支援拖回功能
                    const placementZones = document.querySelectorAll('.placement-zone, .normal-grid-item, .target-grid-item, .quantity-container');
                    placementZones.forEach(zone => {
                        window.TouchDragUtility.registerDraggable(
                            zone,
                            '.draggable-item:not(.static-item):not([style*="display: none"])',
                            {
                                onDragStart: Game.HTML5DragSystem.handleTouchDragStart.bind(Game.HTML5DragSystem),
                                onDrop: Game.HTML5DragSystem.handleTouchDrop.bind(Game.HTML5DragSystem)
                            }
                        );
                    });

                    // [關鍵修正] 註冊放置區域 - 移除大的placement-zone，只註冊精確的小放置框
                    let dropZoneSelector;
                    switch (currentDifficulty) {
                        case 'easy':
                            // 簡單模式：只有獨立的drop-zone和來源區
                            dropZoneSelector = '.drop-zone, .source-container';
                            break;
                        case 'normal':
                            // 普通模式：只使用小的drop-zone框和來源區
                            dropZoneSelector = '.drop-zone, .source-container';
                            break;
                        case 'hard':
                            // 困難模式：只有小的target-grid-item格子和來源區
                            dropZoneSelector = '.target-grid-item, .source-container';
                            break;
                        default:
                            dropZoneSelector = '.drop-zone, .placement-guide, .target-grid-item, .source-container';
                    }
                    const dropZones = document.querySelectorAll(dropZoneSelector);
                    dropZones.forEach(zone => {
                        window.TouchDragUtility.registerDropZone(zone, (dragElement, dropZone) => {
                            return Game.HTML5DragSystem.validateDrop(dragElement, dropZone);
                        });
                    });

                    Game.Debug.logUserAction('TouchDragUtility 手機支援設置完成', {
                        difficulty: currentDifficulty,
                        dropZoneCount: dropZones.length
                    });
                } catch (error) {
                    Game.Debug.logError(error, 'TouchDragUtility設置');
                }
            },

            // =================================================================
            // 拖曳事件處理
            // =================================================================

            /**
             * 開始拖曳
             */
            handleDragStart(event) {
                // 🔧 [Bug修復] 使用 closest() 確保從子元素（img/emoji-icon）開始拖曳時
                // 也能正確識別外層的 .draggable-item，與 F4 handleDragStart 修復方式一致
                const dragElement = event.target.closest('.draggable-item');
                if (!dragElement || dragElement.classList.contains('static-item')) {
                    event.preventDefault();
                    return;
                }

                // 🔒 [重要修正] 檢查物品是否已被鎖定（簡單模式下已正確放置的物品）
                if (dragElement.draggable === false || dragElement.classList.contains('locked-item')) {
                    Game.Debug.logUserAction('拖曳被阻止：物品已鎖定', {
                        itemId: dragElement.dataset.id || dragElement.dataset.index,
                        draggable: dragElement.draggable,
                        hasLockedClass: dragElement.classList.contains('locked-item')
                    });
                    event.preventDefault();
                    return;
                }

                this.dragState.dragElement = dragElement;
                this.dragState.startContainer = dragElement.parentElement;
                this.dragState.originalParent = dragElement.parentElement;

                // 設置拖曳資料
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/html', dragElement.outerHTML);
                event.dataTransfer.setData('application/json', JSON.stringify({
                    id: dragElement.dataset.id,
                    icon: dragElement.dataset.icon,
                    index: dragElement.dataset.index
                }));

                // 🆕 建立去背拖曳預覽（桌面端）
                const _dragImg = dragElement.querySelector('img');
                const _ghost = _dragImg ? _dragImg.cloneNode(true) : document.createElement('span');
                if (!_dragImg) {
                    const _emojiEl = dragElement.querySelector('.emoji-icon') || dragElement;
                    _ghost.textContent = _emojiEl.textContent.trim();
                    _ghost.style.fontSize = window.getComputedStyle(dragElement).fontSize;
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
                Game.TimerManager.setTimeout(() => {
                    dragElement.classList.add('dragging');
                }, 0, 'dragSystem');

                Game.Debug.logUserAction('開始拖曳', {
                    element: dragElement.dataset.id || dragElement.dataset.icon,
                    from: dragElement.parentElement.className
                });
            },

            /**
             * 拖曳結束
             */
            handleDragEnd(event) {
                const dragElement = this.dragState.dragElement;
                if(dragElement) {
                    dragElement.classList.remove('dragging');
                }
                
                if (this.activeDropZone) {
                    this.activeDropZone.classList.remove('drag-over');
                }

                this.dragState = {};
                this.activeDropZone = null;
                Game.Debug.logUserAction('拖曳結束');
            },

            /**
             * 拖曳經過
             */
            handleDragOver(event) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
            },

            /**
             * 進入放置區域
             */
            handleDragEnter(event) {
                event.preventDefault();
                const difficulty = Game.state.settings.difficulty;
                const config = Game.ModeConfig[difficulty];
                if (!config) return;

                const dropZoneSelector = '.drop-zone, .normal-grid-item, .target-grid-item, .source-container';
                const dropZone = event.target.closest(dropZoneSelector);

                // 如果進入的不是有效的放置區，或者進入的是當前已經啟動的放置區，則不執行任何操作
                if (!dropZone || dropZone === this.activeDropZone) {
                    return;
                }
                
                // 如果之前有啟動的放置區，先將其樣式移除
                if (this.activeDropZone) {
                    this.activeDropZone.classList.remove('drag-over');
                }
                
                // 驗證是否可以放置
                if (this.validateDrop(this.dragState.dragElement, dropZone)) {
                    dropZone.classList.add('drag-over');
                    this.activeDropZone = dropZone; // 更新當前啟動的放置區
                    
                    Game.Debug.logGameFlow('F1 拖曳進入有效區域', {
                        dropZoneClass: dropZone.className
                    });
                } else {
                    this.activeDropZone = null;
                }
            },

            /**
             * 離開放置區域
             */
            handleDragLeave(event) {
                event.preventDefault();
                
                // 如果沒有當前啟動的放置區，則不執行任何操作
                if (!this.activeDropZone) {
                    return;
                }
                
                // 檢查滑鼠是否真的離開了當前啟動的放置區
                // event.relatedTarget 是滑鼠將要進入的元素
                if (!this.activeDropZone.contains(event.relatedTarget)) {
                    this.activeDropZone.classList.remove('drag-over');
                    Game.Debug.logGameFlow('F1 拖曳離開有效區域', {
                        dropZoneClass: this.activeDropZone.className
                    });
                    this.activeDropZone = null; // 清空當前啟動的放置區
                }
            },

            /**
             * 放置操作
             */
            handleDrop(event) {
                event.preventDefault();
                event.stopPropagation();

                const dragElement = this.dragState.dragElement;
                const dropZone = this.activeDropZone; // 直接使用 handleDragEnter/Leave 追蹤的放置區
                
                Game.Debug.logGameFlow('HTML5拖放事件觸發', {
                    hasDropZone: !!dropZone,
                    hasDragElement: !!dragElement,
                    dropZoneClass: dropZone?.className
                });

                if (dragElement && dropZone) {
                    dropZone.classList.remove('drag-over');
                    this.executeDrop(dragElement, dropZone);
                }
                
                // 清理狀態
                this.activeDropZone = null;
            },

            /**
             * 手機拖曳開始
             */
            handleTouchDragStart(element, event) {
                this.dragState.dragElement = element;
                this.dragState.originalParent = element.parentElement;
                Game.Debug.logUserAction('手機拖曳開始', element.dataset.id || element.dataset.icon);
                return true; // 允許拖曳
            },

            /**
             * 手機放置操作
             */
            handleTouchDrop(dragElement, dropZone, event) {
                // [關鍵修正] 開始：精確定位觸控放開時的放置目標
                let finalDropZone = dropZone;
                
                // 檢查事件物件是否存在且包含觸控座標
                if (event && event.changedTouches && event.changedTouches.length > 0) {
                    const touch = event.changedTouches[0];
                    const x = touch.clientX;
                    const y = touch.clientY;

                    // 暫時隱藏拖曳的複製元素，以確保能偵測到下方的元素
                    const clone = document.querySelector('.touch-drag-clone');
                    if (clone) clone.style.display = 'none';

                    // 使用 elementsFromPoint 取得觸控點下的所有元素
                    const elementsUnderTouch = document.elementsFromPoint(x, y);
                    
                    // 恢復顯示複製元素
                    if (clone) clone.style.display = '';
                    
                    // 從元素列表中尋找最精確、有效的放置目標
                    // 優先級：放置格子 > 放置區容器 > 來源區容器
                    const preferredTargets = ['.drop-zone', '.normal-grid-item', '.target-grid-item', '.placement-guide', '.placement-zone', '.source-container'];
                    
                    for (const selector of preferredTargets) {
                        const preciseTarget = elementsUnderTouch.find(el => el.matches(selector));
                        if (preciseTarget) {
                            finalDropZone = preciseTarget;
                            // 新增：觸控拖曳的放置框訊息
                            const itemInfo = {
                                itemId: dragElement.dataset.id || dragElement.dataset.icon,
                                itemType: dragElement.className
                            };
                            
                            if (preciseTarget.classList.contains('placement-zone')) {
                                Game.Debug.logPlacementDrop('觸控：物品放入小放置框', 'placement-zone', itemInfo);
                            } else if (preciseTarget.classList.contains('drop-zone')) {
                                Game.Debug.logPlacementDrop('觸控：物品放入主要放置區', 'drop-zone', itemInfo);
                            } else if (preciseTarget.classList.contains('normal-grid-item') || preciseTarget.classList.contains('target-grid-item')) {
                                Game.Debug.logPlacementDrop('觸控：物品放入格子', preciseTarget.classList.contains('normal-grid-item') ? 'normal-grid' : 'target-grid', itemInfo);
                            } else if (preciseTarget.classList.contains('source-container')) {
                                Game.Debug.logPlacementDrop('觸控：物品返回物品框', 'source-container', itemInfo);
                            }
                            break; // 找到最高優先級的目標後就停止
                        }
                    }
                }
                // [關鍵修正] 結束

                if (this.validateDrop(dragElement, finalDropZone)) {
                    this.executeDrop(dragElement, finalDropZone);
                }
            },


            /**
             * 執行放置操作 - 🎯 [F1重構] 使用統一處理函數
             */
            executeDrop(dragElement, dropZone) {
                Game.Debug.logGameFlow('執行放置操作 (executeDrop)', {
                    element: dragElement.dataset.id,
                    targetZone: dropZone.id || dropZone.className
                });

                // Case 1: 拖曳回來源區
                if (dropZone.classList.contains('source-container')) {
                    Game.handleItemReturn(dragElement);
                    return;
                }

                // Case 2: 嚴格驗證 - 只允許精確放置到有效放置區域
                if (dropZone.classList.contains('drop-zone') || 
                    dropZone.classList.contains('normal-grid-item') || 
                    dropZone.classList.contains('target-grid-item') ||
                    dropZone.classList.contains('placement-zone')) {
                    
                    // 🔧 [普通模式修正] placement-zone不檢查filled狀態，交由handleItemPlacement處理
                    // 🔧 [困難模式修正] hard模式的target-grid-item允許取代，由handleItemPlacement處理
                    const _difficulty = Game.state?.settings?.difficulty || 'easy';
                    const _isHardReplace = _difficulty === 'hard' && dropZone.classList.contains('target-grid-item');
                    if (dropZone.classList.contains('filled') && !dropZone.classList.contains('placement-zone') && !_isHardReplace) {
                        Game.Debug.logGameFlow('放置失敗：目標格子已被佔用，返回物品框');
                        Game.handleItemReturn(dragElement);
                        return;
                    }
                    
                    // 執行精確放置
                    if (this.validateDrop(dragElement, dropZone)) {
                        Game.Debug.logGameFlow('驗證通過，嘗試放置', { target: dropZone.className });
                        const placementSuccess = Game.handleItemPlacement(dragElement, dropZone);
                        
                        if (placementSuccess) {
                            Game.Debug.logGameFlow('精確放置成功', { target: dropZone.className });
                        } else {
                            Game.Debug.logGameFlow('放置處理失敗，返回物品框');
                            Game.handleItemReturn(dragElement);
                        }
                    } else {
                        Game.Debug.logGameFlow('放置驗證失敗，返回物品框');
                        Game.handleItemReturn(dragElement);
                    }
                    return;
                }

                // Case 3: 其他所有情況都返回物品框
                Game.Debug.logGameFlow('拖拽到無效區域，返回物品框', {
                    targetClass: dropZone.className,
                    targetId: dropZone.id
                });
                Game.handleItemReturn(dragElement);
            },

            // 🎯 [F1重構] 新增驗證方法
            validateDrop(dragElement, dropZone) {
                if (!dragElement || !dropZone) return false;

                // 不允許放置在自己身上或自己所在的父容器中
                if (dragElement.parentElement === dropZone) return false;

                // 根據放置目標的類型進行驗證
                if (dropZone.classList.contains('placement-zone') || dropZone.classList.contains('source-container')) {
                    // 如果是容器型，永遠允許放置 (因為它們可以容納多個物品)
                    return true;
                }

                if (dropZone.classList.contains('drop-zone') || dropZone.classList.contains('normal-grid-item') || dropZone.classList.contains('target-grid-item')) {
                    // 🔧 [Bug修復] 困難模式允許向已填充的 target-grid-item 取代放置
                    const difficulty = Game.state?.settings?.difficulty || 'easy';
                    if (difficulty === 'hard' && dropZone.classList.contains('target-grid-item')) {
                        return true;
                    }
                    // 如果是格子型，則不允許放置在已經填充的格子上
                    return !dropZone.classList.contains('filled');
                }

                // 預設不允許
                return false;
            },

            /**
             * 處理拖回來源區域
             */
            handleReturnToSource(dragElement, sourceContainer, originalParent, difficulty) {
                // 🔧 [F3 做法] 使用 display toggle 而非 DOM 移動
                const itemId = dragElement.dataset.id;

                // 顯示原始物品
                if (itemId) {
                    const sourceItem = sourceContainer.querySelector(`.draggable-item[data-id="${itemId}"]`);
                    if (sourceItem) {
                        sourceItem.style.display = '';
                        delete sourceItem.dataset.placed;
                        Game.Debug.logGameFlow('F3 做法：顯示原始物品', { itemId });
                    }
                }

                // 恢復原始放置格狀態
                if (originalParent.classList.contains('normal-grid-item') ||
                    originalParent.classList.contains('target-grid-item')) {

                    // 🔧 [時序修復] 使用 setTimeout 確保 DOM 更新完成
                    Game.TimerManager.setTimeout(() => {
                        originalParent.classList.remove('filled');
                        const positionHint = originalParent.dataset.index;
                        if (positionHint !== undefined) {
                            originalParent.innerHTML = `<span class="position-hint">${parseInt(positionHint) + 1}</span>`;
                        }
                    }, 0, 'dragSystem');
                } else if (originalParent.classList.contains('drop-zone')) {
                    Game.TimerManager.setTimeout(() => {
                        originalParent.classList.remove('filled');
                    }, 0, 'dragSystem');
                }

                // 移除放置區的複製品
                dragElement.remove();

                // 播放音效
                if (Game.Audio) {
                    Game.Audio.playSound('select', difficulty, Game.ModeConfig[difficulty]);
                }

                Game.Debug.logUserAction('項目已返回來源區域（F3 做法）');
            },

            /**
             * 處理放置到目標區域
             */
            handlePlaceToTarget(dragElement, dropZone, originalParent, difficulty) {
                const config = Game.ModeConfig[difficulty];
                
                // 根據模式類型執行不同的處理邏輯
                if (config.modeType === 'one-to-one-correspondence') {
                    // 簡單模式專用處理
                    this.handleEasyModePlace(dragElement, dropZone, difficulty, config);
                } else {
                    // 普通和困難模式處理
                    this.handleNormalHardModePlace(dragElement, dropZone, originalParent, difficulty);
                }

                Game.Debug.logUserAction('項目已放置到目標區域');
                
                // 🔧 [修正] 不需要每次放置後都重新註冊TouchDragUtility
                // TouchDragUtility 會自動處理DOM變化，無需頻繁清理和重新註冊
            },

            /**
             * 處理簡單模式的放置（包含配對動畫和遊戲狀態管理）
             */
            handleEasyModePlace(dragElement, dropZone, difficulty, config) {
                if (!dropZone.classList.contains('drop-zone')) {
                    Game.Debug.logGameFlow('不是有效的簡單模式放置區域');
                    return;
                }
                
                // 取得拖曳元素的索引
                const draggedIndex = dragElement.dataset.id;
                const sourceContainer = document.querySelector('.source-container');

                // 移除拖曳樣式
                dragElement.classList.remove('dragging', 'touch-dragging');

                // 🔧 [F3 做法] 隱藏源物品而非移除
                if (sourceContainer && draggedIndex) {
                    const sourceItem = sourceContainer.querySelector(`.draggable-item[data-id="${draggedIndex}"]`);
                    if (sourceItem) {
                        sourceItem.style.display = 'none';
                        sourceItem.dataset.placed = 'true';
                        Game.Debug.logGameFlow('F3 做法：隱藏源物品', { draggedIndex });
                    }
                }

                // 複製HTML到放置區域（這樣可以確保樣式正確）
                dropZone.innerHTML = dragElement.outerHTML;
                dropZone.classList.add('filled');

                // 隱藏提示文字
                const hint = dropZone.querySelector('.position-hint');
                if (hint) {
                    hint.style.display = 'none';
                }

                // 如果拖曳元素不是源物品（可能是複製品），則移除它
                if (dragElement.parentElement && !dragElement.parentElement.classList.contains('source-container')) {
                    dragElement.remove();
                }
                
                // 確保放置的項目可見且可雙向拖曳
                const placedItem = dropZone.querySelector('.draggable-item');
                if (placedItem) {
                    placedItem.style.visibility = 'visible';
                    placedItem.style.pointerEvents = 'auto';
                    placedItem.setAttribute('draggable', 'true');
                    placedItem.classList.add('placed-item');
                    placedItem.addEventListener('dragstart', this.handleDragStart.bind(this));
                    placedItem.addEventListener('dragend', this.handleDragEnd.bind(this));
                }
                
                // 🎯 [關鍵] 配對成功動畫
                const pairContainer = dropZone.closest('.correspondence-pair');
                if (placedItem && pairContainer) {
                    const teacherItem = pairContainer.querySelector('.static-item');
                    if (teacherItem) {
                        // 添加配對成功動畫
                        teacherItem.classList.add('pair-success');
                        placedItem.classList.add('pair-success');
                        
                        Game.Debug.logUI('簡單模式配對動畫已觸發', 'pair-animation');

                        // 🔧 [Bug修復] 使用 TimerManager 管理動畫清除計時器（原 raw setTimeout）
                        Game.TimerManager.setTimeout(() => {
                            teacherItem.classList.remove('pair-success');
                            placedItem.classList.remove('pair-success');
                        }, 500, 'animation');
                    }
                }

                // 🎯 [關鍵] 更新遊戲狀態
                Game.state.correctPlacements++;
                
                Game.Debug.logGameFlow('簡單模式成功放置', {
                    draggedIndex,
                    correctPlacements: Game.state.correctPlacements,
                    totalNeeded: Game.state.correctAnswer
                });
                
                // 播放音效和語音
                Game.Audio.playSound('correct', difficulty, config);
                
                // 🎯 [修正] 普通和困難模式不自動完成，需要按下完成按鈕
                // 僅簡單模式才自動完成回合
                if (difficulty === 'easy' && Game.state.correctPlacements >= Game.state.correctAnswer) {
                    Game.handleTurnComplete(difficulty, config);
                }
            },

            /**
             * 處理普通和困難模式的放置
             */
            handleNormalHardModePlace(dragElement, dropZone, originalParent, difficulty) {
                Game.Debug.logGameFlow('handleNormalHardModePlace 開始', {
                    dragElement: dragElement.dataset.id || dragElement.dataset.index,
                    dropZoneClass: dropZone.className,
                    originalParentClass: originalParent?.className,
                    difficulty
                });

                // 🔧 [修正] 普通模式 placement-guide 特殊處理（優先級最高）
                if (dropZone.classList.contains('placement-guide')) {
                    Game.Debug.logGameFlow('處理 placement-guide 放置');

                    // 檢查是否已經有物品在這個格子中
                    const existingItem = dropZone.querySelector('.draggable-item');
                    if (existingItem) {
                        Game.Debug.logGameFlow('placement-guide 已有物品');
                        return;
                    }

                    const sourceContainer = document.querySelector('.source-container');
                    const itemId = dragElement.dataset.id;
                    const isFromSource = originalParent && originalParent.classList.contains('source-container');

                    // 🔧 [F3 做法] 如果從源區域拖曳，隱藏源物品並創建複製品
                    if (isFromSource && sourceContainer && itemId) {
                        const sourceItem = sourceContainer.querySelector(`.draggable-item[data-id="${itemId}"]`);
                        if (sourceItem) {
                            sourceItem.style.display = 'none';
                            sourceItem.dataset.placed = 'true';
                            Game.Debug.logGameFlow('F3 做法：隱藏源物品', { itemId });
                        }

                        // 創建複製品放到目標區
                        const clone = dragElement.cloneNode(true);
                        clone.classList.remove('dragging', 'touch-dragging');
                        clone.classList.add('placed-item');
                        clone.setAttribute('draggable', 'true');
                        delete clone.dataset.dragEventsAttached;

                        // 移除提示文字並放置物品
                        const guideHint = dropZone.querySelector('.guide-hint');
                        if (guideHint) {
                            guideHint.style.display = 'none';
                        }

                        dropZone.appendChild(clone);
                    } else {
                        // 非從源區域拖曳，直接移動
                        dragElement.classList.remove('dragging', 'touch-dragging');
                        dragElement.setAttribute('draggable', 'true');
                        dragElement.classList.remove('static-item');
                        dragElement.classList.add('placed-item');
                        delete dragElement.dataset.dragEventsAttached;

                        const guideHint = dropZone.querySelector('.guide-hint');
                        if (guideHint) {
                            guideHint.style.display = 'none';
                        }

                        dropZone.appendChild(dragElement);
                    }

                    // 播放成功音效和語音
                    Game.Audio.playSound('correct', difficulty, Game.ModeConfig[difficulty]);


                    Game.Debug.logGameFlow('placement-guide 放置完成');

                    // 🔧 [關鍵修正] 阻止事件冒泡到 placement-zone
                    // 設置一個標記，防止父容器的 placement-zone 被觸發
                    dragElement.setAttribute('data-placed-in-guide', 'true');
                    return;
                }

                if (dropZone.classList.contains('placement-zone')) {
                    Game.Debug.logGameFlow('處理 placement-zone 放置');

                    // 🔧 [關鍵修正] 檢查是否已經被放置到 placement-guide，避免重複處理
                    if (dragElement.getAttribute('data-placed-in-guide') === 'true') {
                        Game.Debug.logGameFlow('物品已在 placement-guide 中，跳過 placement-zone 處理');
                        dragElement.removeAttribute('data-placed-in-guide');
                        return;
                    }

                    const sourceContainer = document.querySelector('.source-container');
                    const itemId = dragElement.dataset.id;
                    const isFromSource = originalParent && originalParent.classList.contains('source-container');

                    // 🔧 [F3 做法] 如果從源區域拖曳，隱藏源物品並創建複製品
                    if (isFromSource && sourceContainer && itemId) {
                        const sourceItem = sourceContainer.querySelector(`.draggable-item[data-id="${itemId}"]`);
                        if (sourceItem) {
                            sourceItem.style.display = 'none';
                            sourceItem.dataset.placed = 'true';
                            Game.Debug.logGameFlow('F3 做法：隱藏源物品', { itemId });
                        }

                        // 創建複製品放到目標區
                        const clone = dragElement.cloneNode(true);
                        clone.classList.remove('dragging', 'touch-dragging');
                        clone.classList.add('placed-item');
                        clone.setAttribute('draggable', 'true');
                        delete clone.dataset.dragEventsAttached;

                        dropZone.appendChild(clone);
                    } else {
                        // 非從源區域拖曳，直接移動
                        dragElement.classList.remove('dragging', 'touch-dragging');
                        dragElement.setAttribute('draggable', 'true');
                        dragElement.classList.remove('static-item');
                        dragElement.classList.add('placed-item');
                        delete dragElement.dataset.dragEventsAttached;

                        dropZone.appendChild(dragElement);
                    }

                    // 播放成功音效和語音
                    Game.Audio.playSound('correct', difficulty, Game.ModeConfig[difficulty]);


                    Game.Debug.logGameFlow('placement-zone 放置完成');
                    return;
                }

                // 🔧 [修正] 困難模式 target-grid-item 特殊處理（類似 placement-guide）
                if (dropZone.classList.contains('target-grid-item')) {
                    Game.Debug.logGameFlow('處理 target-grid-item 放置');

                    // 檢查是否已經有物品在這個格子中
                    const existingItem = dropZone.querySelector('.draggable-item');
                    if (existingItem && !originalParent.classList.contains('target-grid-item')) {
                        // 如果格子已有物品，且來源不是另一個格子，則不允許放置
                        Game.Debug.logGameFlow('target-grid-item 已有物品且來源非格子');
                        return;
                    }

                    // 如果有現有物品且來源是格子，則交換位置
                    if (existingItem && originalParent.classList.contains('target-grid-item')) {
                        Game.Debug.logGameFlow('target-grid-item 交換物品');
                        originalParent.appendChild(existingItem);
                        existingItem.setAttribute('draggable', 'true');
                        existingItem.classList.remove('static-item');
                        existingItem.classList.add('placed-item');

                        // 🔧 [新增] 確保事件監聽器會在下次refresh時重新綁定
                        delete existingItem.dataset.dragEventsAttached;
                    }

                    const sourceContainer = document.querySelector('.source-container');
                    const itemId = dragElement.dataset.id;
                    const isFromSource = originalParent && originalParent.classList.contains('source-container');

                    // 移除提示文字
                    const positionHint = dropZone.querySelector('.position-hint');
                    if (positionHint) {
                        positionHint.style.display = 'none';
                    }

                    // 🔧 [F3 做法] 如果從源區域拖曳，隱藏源物品並創建複製品
                    if (isFromSource && sourceContainer && itemId) {
                        const sourceItem = sourceContainer.querySelector(`.draggable-item[data-id="${itemId}"]`);
                        if (sourceItem) {
                            sourceItem.style.display = 'none';
                            sourceItem.dataset.placed = 'true';
                            Game.Debug.logGameFlow('F3 做法：隱藏源物品', { itemId });
                        }

                        // 創建複製品放到目標區
                        const clone = dragElement.cloneNode(true);
                        clone.classList.remove('dragging', 'touch-dragging');
                        clone.classList.add('placed-item');
                        clone.setAttribute('draggable', 'true');
                        delete clone.dataset.dragEventsAttached;

                        dropZone.appendChild(clone);
                    } else {
                        // 非從源區域拖曳，直接移動
                        dragElement.classList.remove('dragging', 'touch-dragging');
                        dragElement.setAttribute('draggable', 'true');
                        dragElement.classList.remove('static-item');
                        dragElement.classList.add('placed-item');
                        delete dragElement.dataset.dragEventsAttached;

                        dropZone.appendChild(dragElement);
                    }

                    dropZone.classList.add('filled');

                    // 播放成功音效和語音
                    Game.Audio.playSound('correct', difficulty, Game.ModeConfig[difficulty]);


                    Game.Debug.logGameFlow('target-grid-item 放置完成');

                    // 🔧 [關鍵修正] 阻止事件冒泡到 placement-zone
                    dragElement.setAttribute('data-placed-in-guide', 'true');
                    return;
                }

                // 處理目標格子中已有的項目（困難模式網格邏輯）
                const existingItem = dropZone.querySelector('.draggable-item');
                if (existingItem) {
                    // 交換位置
                    if (originalParent.classList.contains('normal-grid-item') || 
                        originalParent.classList.contains('target-grid-item')) {
                        originalParent.appendChild(existingItem);
                        
                        // 🔧 [修正] 確保交換的物品保持拖拽功能
                        existingItem.setAttribute('draggable', 'true');
                        existingItem.classList.remove('static-item');
                        existingItem.classList.add('placed-item');
                        
                        // 🔧 [新增] 確保事件監聽器會在下次refresh時重新綁定
                        delete existingItem.dataset.dragEventsAttached;
                    } else {
                        // 如果原位置是來源區域，將現有項目移回來源
                        const sourceContainer = document.querySelector('.source-container');
                        if (sourceContainer) {
                            // 🔧 [F3 做法] 使用 display toggle 而非 DOM 移動
                            const itemId = existingItem.dataset.id;

                            // 顯示原始物品
                            if (itemId) {
                                const sourceItem = sourceContainer.querySelector(`.draggable-item[data-id="${itemId}"]`);
                                if (sourceItem) {
                                    sourceItem.style.display = '';
                                    delete sourceItem.dataset.placed;
                                    Game.Debug.logGameFlow('F3 做法：顯示原始物品（格子交換）', { itemId });
                                }
                            }

                            // 移除放置區的複製品
                            existingItem.remove();
                        }
                    }
                }

                // 🔧 [修正] 如果沒有交換，需要恢復原始放置格的數字
                if (!existingItem && (originalParent.classList.contains('normal-grid-item') ||
                    originalParent.classList.contains('target-grid-item'))) {
                    // 恢復原始格子狀態，顯示數字
                    originalParent.classList.remove('filled');
                    const positionIndex = originalParent.dataset.index;
                    if (positionIndex !== undefined) {
                        originalParent.innerHTML = `<span class="position-hint">${parseInt(positionIndex) + 1}</span>`;
                    }
                }

                const sourceContainer = document.querySelector('.source-container');
                const itemId = dragElement.dataset.id;
                const isFromSource = originalParent && originalParent.classList.contains('source-container');

                // 🔧 [F3 做法] 如果從源區域拖曳，隱藏源物品並創建複製品
                if (isFromSource && sourceContainer && itemId) {
                    const sourceItem = sourceContainer.querySelector(`.draggable-item[data-id="${itemId}"]`);
                    if (sourceItem) {
                        sourceItem.style.display = 'none';
                        sourceItem.dataset.placed = 'true';
                        Game.Debug.logGameFlow('F3 做法：隱藏源物品', { itemId });
                    }

                    // 創建複製品放到目標區
                    const clone = dragElement.cloneNode(true);
                    clone.classList.remove('dragging', 'touch-dragging');
                    clone.classList.add('placed-item');
                    clone.setAttribute('draggable', 'true');
                    clone.style.position = 'relative';
                    clone.style.zIndex = 'auto';
                    clone.style.margin = '0';
                    clone.style.transform = 'none';
                    delete clone.dataset.dragEventsAttached;

                    dropZone.appendChild(clone);
                } else {
                    // 非從源區域拖曳，直接移動
                    dragElement.classList.remove('dragging', 'touch-dragging');
                    dragElement.setAttribute('draggable', 'true');
                    dragElement.classList.remove('static-item');
                    dragElement.classList.add('placed-item');
                    delete dragElement.dataset.dragEventsAttached;

                    // 🔧 [修正] 添加定位樣式確保物品顯示在框內
                    dragElement.style.position = 'relative';
                    dragElement.style.zIndex = 'auto';
                    dragElement.style.margin = '0';
                    dragElement.style.transform = 'none';

                    dropZone.appendChild(dragElement);
                }

                // 使用 setTimeout 解決時序問題
                Game.TimerManager.setTimeout(() => {
                    // 標記為已填充
                    dropZone.classList.add('filled');

                    // 隱藏位置提示文字
                    const hint = dropZone.querySelector('.position-hint');
                    if (hint) {
                        hint.style.display = 'none';
                    }
                }, 0, 'dragSystem');

                // 更新遊戲狀態和播放音效
                this.updateGameState(difficulty);
            },

            /**
             * 更新遊戲狀態
             */
            updateGameState(difficulty) {
                const config = Game.ModeConfig[difficulty];
                if (!config) return;

                // 播放音效
                if (Game.Audio) {
                    Game.Audio.playSound('correct', difficulty, config);
                }

                // 檢查是否完成
                this.checkCompletion(difficulty, config);
            },

            /**
             * 檢查遊戲完成狀態
             */
            checkCompletion(difficulty, config) {
                // 計算已放置的項目數量
                const placedItems = this.countPlacedItems(difficulty);
                const targetCount = Game.state?.correctAnswer || 0;

                // 修正：僅簡單模式才自動完成，普通和困難模式需要按下完成按鈕
                if (difficulty === 'easy' && placedItems >= targetCount) {
                    // 遊戲完成
                    if (Game.handleTurnComplete) {
                        Game.handleTurnComplete(difficulty, config);
                    }
                }
            },

            /**
             * 計算已放置項目數量
             */
            countPlacedItems(difficulty) {
                let selector;
                switch (difficulty) {
                    case 'easy':
                        selector = '.drop-zone.filled';
                        break;
                    case 'normal':
                        selector = '.normal-grid-item.filled';
                        break;
                    case 'hard':
                        selector = '.target-grid-item.filled';
                        break;
                    default:
                        return 0;
                }
                
                return document.querySelectorAll(selector).length;
            },

            /**
             * 刷新拖曳狀態（用於動態內容更新後）
             */
            refresh() {
                if (!this.isInitialized) return;

                // 更新所有可拖曳項目
                const sourceContainer = document.querySelector('.source-container');
                if (sourceContainer) {
                    this.updateDraggableItems(sourceContainer);
                }

                Game.Debug.logGameFlow('F1 拖曳系統狀態已刷新');
            },

            /**
             * 清理拖曳系統
             */
            cleanup() {
                if (!this.isInitialized) return;
                Game.Debug.logGameFlow('清理拖曳系統');

                // 🔧 [Bug修復] 清理拖曳相關事件監聽器和動畫計時器
                Game.EventManager.removeByCategory('dragSystem');
                Game.TimerManager.clearByCategory('animation');

                if (window.TouchDragUtility?.cleanupAll) {
                    window.TouchDragUtility.cleanupAll();
                }
                this.isInitialized = false;
            },

            refresh(difficulty) {
                Game.Debug.logGameFlow('刷新拖曳系統');
                if (this.isInitialized) this.cleanup();
                this.initialize(difficulty);
            },

            oldCleanup() {
                if (!this.isInitialized) return;

                Game.Debug.logGameFlow('清理 F1 HTML5 拖曳系統');

                // 🔧 [性能優化] 清理 TouchDragUtility 所有註冊的處理器
                if (window.TouchDragUtility && window.TouchDragUtility.cleanupAll) {
                    try {
                        window.TouchDragUtility.cleanupAll();
                        Game.Debug.logGameFlow('TouchDragUtility 完全清理完成');
                    } catch (error) {
                        Game.Debug.logError(error, 'TouchDragUtility 清理');
                    }
                }

                // 重置狀態
                this.dragState = {
                    dragElement: null,
                    startContainer: null,
                    originalParent: null,
                    targetSlot: null
                };
                
                this.isInitialized = false;

                Game.Debug.logGameFlow('F1 HTML5 拖曳系統清理完成');
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
            // F1 easy: find next unplaced draggable item and first empty drop zone
            const sourceItem = document.querySelector('.draggable-item.easy-draggable:not(.placed):not(.static-item)');
            if (!sourceItem) return;
            const dropZone = document.querySelector('.drop-zone.easy-drop-zone:not(.filled):not(.occupied)') ||
                             document.querySelector('.drop-zone:not(.filled):not(.occupied)');
            if (!dropZone) return;
            this._queue = [{
                target: sourceItem,
                action: () => Game.HTML5DragSystem.executeDrop(sourceItem, dropZone)
            }];
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
                    if (this._enabled && document.querySelector('.draggable-item:not(.placed):not(.static-item)')) {
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
