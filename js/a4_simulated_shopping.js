// =================================================================
/**
 * @file a4_simulated_shopping.js
 * @description A4 模擬購物 - 配置驅動版本
 * @unit A4 - 模擬購物
 * @version 2.5.0 - 動畫定義整合（17 個 JS 內嵌 + 3 個 HTML 內嵌遷移至 injectGlobalAnimationStyles）
 * @lastModified 2026.02.22
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
    const Game = {
        // =====================================================
        // 🐛 Debug 系統 - FLAGS 分類開關
        // =====================================================
        Debug: {
            FLAGS: {
                all: false,         // 全域開關
                init: false,        // 初始化
                state: false,       // 狀態管理
                ui: false,          // UI 渲染
                audio: false,       // 音效
                speech: false,      // 語音
                coin: false,        // 金錢相關
                payment: false,     // 付款驗證
                product: false,     // 商品選擇
                flow: false,        // 遊戲流程
                assist: false,      // 輔助點擊模式
                hint: false,        // 提示系統
                timer: false,       // 計時器
                event: false,       // 事件處理
                error: true         // 錯誤（預設開啟）
            },

            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[A4-${category}]`, ...args);
                }
            },

            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[A4-${category}]`, ...args);
                }
            },

            error(...args) {
                console.error('[A4-ERROR]', ...args);
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════
        // 🎬 全局動畫樣式注入（避免重複定義）
        // ═══════════════════════════════════════════════════════════════════════════
        injectGlobalAnimationStyles() {
            if (document.getElementById('a4-global-animations')) return;

            const style = document.createElement('style');
            style.id = 'a4-global-animations';
            style.innerHTML = `
                /* === 金錢與購物動畫 === */
                @keyframes moneyFloat {
                    0% { transform: translateY(0px); }
                    100% { transform: translateY(-8px); }
                }
                @keyframes calculatorSlideIn {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }

                /* === 彈窗動畫 === */
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideInJS {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes modalFadeOut {
                    from { opacity: 1; transform: scale(1); }
                    to { opacity: 0; transform: scale(0.8); }
                }
                @keyframes slideDown {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                /* === 選擇反饋動畫 === */
                @keyframes checkAppear {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes errorAppear {
                    0% { transform: scale(0) rotate(0deg); opacity: 0; }
                    50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
                    100% { transform: scale(1) rotate(360deg); opacity: 1; }
                }

                /* === 找零驗證動畫 === */
                @keyframes correctGreenGlow {
                    0% { transform: translateY(-10px) scale(1) rotate(0deg); box-shadow: 0 0 20px rgba(40, 167, 69, 0.6); }
                    25% { transform: translateY(-10px) scale(1.1) rotate(5deg); box-shadow: 0 0 40px rgba(40, 167, 69, 0.8); }
                    50% { transform: translateY(-10px) scale(1) rotate(-5deg); box-shadow: 0 0 60px rgba(40, 167, 69, 1); }
                    75% { transform: translateY(-10px) scale(1.05) rotate(3deg); box-shadow: 0 0 40px rgba(40, 167, 69, 0.8); }
                    100% { transform: translateY(-10px) scale(1) rotate(0deg); box-shadow: 0 0 20px rgba(40, 167, 69, 0.6); }
                }
                @keyframes incorrectRedPulse {
                    0% { transform: translateY(-10px) scale(1) rotate(0deg); box-shadow: 0 0 20px rgba(220, 53, 69, 0.6); }
                    25% { transform: translateY(-10px) scale(1.1) rotate(-5deg); box-shadow: 0 0 40px rgba(220, 53, 69, 0.8); }
                    50% { transform: translateY(-10px) scale(1) rotate(5deg); box-shadow: 0 0 60px rgba(220, 53, 69, 1); }
                    75% { transform: translateY(-10px) scale(1.05) rotate(-3deg); box-shadow: 0 0 40px rgba(220, 53, 69, 0.8); }
                    100% { transform: translateY(-10px) scale(1) rotate(0deg); box-shadow: 0 0 20px rgba(220, 53, 69, 0.6); }
                }
                @keyframes amount-bounce {
                    0% { opacity: 0; transform: translateY(30px) scale(0.3); }
                    60% { opacity: 1; transform: translateY(-10px) scale(1.1); }
                    80% { transform: translateY(5px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes correct-pulse {
                    0%, 100% { box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3); }
                    50% { box-shadow: 0 4px 25px rgba(40, 167, 69, 0.6); }
                }
                @keyframes error-sequence {
                    0% { opacity: 0; transform: translateY(30px) scale(0.3); }
                    60% { opacity: 1; transform: translateY(-10px) scale(1.1); }
                    80% { transform: translateY(5px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }

                /* === 背景與裝飾動畫 === */
                @keyframes gradient-flow {
                    0%, 100% { filter: hue-rotate(0deg); }
                    50% { filter: hue-rotate(180deg); }
                }
                @keyframes pulse-glow {
                    from { text-shadow: 0 3px 6px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.5); }
                    to { text-shadow: 0 5px 10px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.8), 0 0 60px rgba(255,215,0,0.4); }
                }

                /* === 完成畫面動畫 === */
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

                /* === HTML 遷移動畫 === */
                @keyframes errorX-appear {
                    from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    60% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
                @keyframes correct-tick-appear {
                    from { transform: scale(0) rotate(-180deg); opacity: 0; }
                    to { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            Game.Debug.log('init', '🎬 全局動畫樣式注入完成');
        },

        // =====================================================
        // 狀態管理系統（整合 unit5 架構）
        // =====================================================
        state: {
            settings: {
                difficulty: null,      // easy, normal, hard
                walletAmount: 'default',   // 'default'(預設), 'custom'(自訂)
                taskType: null,    // assigned(指定商品), freeChoice(自選商品)
                storeType: null, // convenience, market, breakfast, mcdonalds, pxmart, magic
                questionCount: null,        // 測驗題數
                clickMode: false,  // 🔧 [新增] 輔助點擊模式開關（僅簡單模式可用）
            },
            audioUnlocked: false,  // 🔧 [新增] 手機端音頻解鎖狀態
            gameState: {
                currentScene: 'settings',    // settings, shopping, paying, checking
                selectedItem: null,
                cart: [],
                playerWallet: [],
                walletTotal: 0,
                hasUserSelectedProduct: false, // 🔧 [新增] 標記用戶是否已成功選擇商品
                isProcessingProductSelection: false, // 🔧 [新增] 防止商品選擇重複點擊
                isProcessingPrice: false, // 用於控制價格確認按鈕重複點擊
                isProcessingPayment: false, // 用於控制支付語音播放
                isProcessingChange: false, // 用於控制找零語音播放
                isProcessingSpeech: false, // 用於控制一般語音播放
                isProcessingHint: false, // 用於控制提示按鈕重複點擊
                isShowingModal: false, // 用於控制模態視窗期間的語音
                isTransitioning: false, // 用於防止重複轉換到下一題
                currentTransaction: {
                    targetItem: null,        // 指定購買的商品
                    totalCost: 0,
                    amountPaid: 0,
                    paidMoney: [],          // 已付款的金錢
                    changeExpected: 0,
                    changeReceived: []
                },
                customItems: [],  // 魔法商店自訂商品
                previousTargetItemId: null,  // 記錄上一題的商品ID，避免重複
                cachedStoreProducts: null,   // 🔧 [修復] 緩存本場景商品價格，避免重複生成隨機價格
                questionHistory: [],  // 記錄已使用的商品和價格組合，避免重複題目
                
                // 🆕 普通模式錯誤追蹤（每個步驟獨立計數）
                stepErrorCounts: {
                    productSelection: 0,    // 商品選擇錯誤次數
                    payment: 0,             // 付款錯誤次數
                    changeCalculation: 0    // 找零計算錯誤次數
                },
                stepHintsShown: {
                    productSelection: false,  // 商品選擇提示是否已顯示
                    payment: false,           // 付款提示是否已顯示
                    changeCalculation: false  // 找零計算提示是否已顯示
                },

                // 🔧 [新增] 點擊放置功能狀態管理
                clickState: {
                    selectedItem: null,
                    lastClickTime: 0,
                    lastClickedElement: null,
                    doubleClickDelay: 800  // 🔧 增加到800ms，讓用戶更容易觸發雙擊
                },

                // 🔧 [新增] 輔助點擊模式狀態管理
                clickModeState: {
                    enabled: false,              // 設定中是否啟用
                    active: false,               // 是否正在運作
                    currentPhase: null,          // 當前階段：welcome/shopping/confirmPrice/payment/checking/nextQuestion
                    currentStep: 0,              // 當前步驟索引
                    actionQueue: [],             // 操作序列：[{type, data}, ...]
                    waitingForClick: false,      // 是否等待用戶點擊繼續
                    waitingForStart: false,      // 是否等待用戶點擊開始
                    lastClickTime: 0,            // 上次點擊時間戳記
                    promptVisible: false,        // 提示是否顯示中
                    // 🆕 新增（參考 A5）
                    clickReadyTime: 0,           // 點擊準備就緒時間（用於防快速點擊）
                    isExecuting: false,          // 是否正在執行操作（防止競態條件）
                    _visualDelayTimer: null      // 視覺延遲計時器
                },
            },
            quiz: {
                currentQuestion: 0,
                score: 0,
                questions: [],
                startTime: null,
                attempts: 0
            },
            loadingQuestion: false,
            // 🔧 [場景管理] 場景事件監聽器追蹤
            sceneListeners: []
        },

        // =====================================================
        // 場景配置系統（配置驅動架構）
        // =====================================================
        SceneConfig: {
            'settings': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 settings 場景');
                },
                onExit: () => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 settings 場景');
                    // 清理設定場景的事件監聽器
                }
            },
            'welcome': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 welcome 場景');
                    // 初始化錢包
                    context.initializeWallet();
                    // 🔧 [新增] 初始化輔助點擊模式
                    if (context.state.quiz.currentQuestion === 0) {
                        context.ClickMode.initForWelcome();
                    } else {
                        context.ClickMode.initForQuestion();
                    }
                    // 啟動歡迎序列流程
                    context.startWelcomeSequence();
                },
                onExit: () => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 welcome 場景');
                    // 清理歡迎場景的異步操作
                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }
                }
            },
            'shopping': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 shopping 場景');

                    // 🔧 [修正] 重置商品選擇處理狀態，確保用戶可以正常選擇商品
                    context.state.gameState.isProcessingProductSelection = false;

                    // 🔧 [新增] 建立輔助點擊模式動作佇列
                    context.ClickMode.buildActionQueue('shopping');

                    context.showShoppingScene();
                },
                onExit: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 shopping 場景');

                    // 🔧 [修復] 清除待執行的計時器，防止場景切換後仍執行回調
                    if (context.state.gameState.pendingTimers && context.state.gameState.pendingTimers.length > 0) {
                        context.state.gameState.pendingTimers.forEach(timerId => {
                            clearTimeout(timerId);
                        });
                        context.state.gameState.pendingTimers = [];
                        Game.Debug.log('timer', '🧹 [場景清理] 已清除所有待執行計時器');
                    }

                    // 🔧 [修復] 清除音效回調，防止舊場景的音效回調在新場景中執行
                    if (context.audio) {
                        if (context.audio.successSound) {
                            context.audio.successSound.onended = null;
                        }
                        if (context.audio.errorSound) {
                            context.audio.errorSound.onended = null;
                        }
                        if (context.audio.checkoutSound) {
                            context.audio.checkoutSound.onended = null;
                        }
                        Game.Debug.log('timer', '🧹 [場景清理] 已清除所有音效回調');
                    }

                    // 清理購物場景的事件監聽器和異步操作
                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }
                }
            },
            'paying': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 paying 場景');

                    // 重置狀態標誌
                    context.state.isProcessing = false;
                    context.state.gameState.isProcessingPrice = false;
                    context.state.gameState.isProcessingPayment = false;
                    context.state.gameState.isProcessingChange = false;
                    context.state.gameState.isProcessingSpeech = false;
                    context.state.gameState.isProcessingHint = false;
                    context.state.gameState.isShowingModal = false;
                    context.state.gameState.isTransitioning = false;
                    context.state.gameState.changeCompleted = false;

                    // 重置交易狀態
                    const selectedItem = context.state.gameState.selectedItem;
                    context.state.gameState.currentTransaction.totalCost = selectedItem.price;
                    context.state.gameState.currentTransaction.amountPaid = 0;
                    context.state.gameState.currentTransaction.paidMoney = [];
                    context.state.gameState.currentTransaction.changeExpected = 0;
                    context.state.gameState.currentTransaction.changeReceived = [];

                    // 重置付款提示狀態
                    context.state.gameState.droppedItems = null;
                    context.state.gameState.hintMoneyMapping = null;

                    // 🆕 [普通模式] 重置付款錯誤計數
                    context.state.gameState.stepErrorCounts.payment = 0;
                    context.state.gameState.stepHintsShown.payment = false;
                    Game.Debug.log('payment', '🔄 [付款場景] 付款錯誤計數已重置');

                    // 🔧 [新增] 建立輔助點擊模式動作佇列
                    context.ClickMode.buildActionQueue('payment');

                    // 🔧 [配置驅動] 只調用UI渲染方法，狀態已在onEnter中設置
                    context.renderPaymentSceneUI();
                },
                onExit: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 paying 場景');

                    // 🔧 [關鍵修正] 清除音效回調
                    if (context.audio && context.audio.successSound) {
                        context.audio.successSound.onended = null;
                    }

                    // 🔧 [關鍵修正] 取消語音合成
                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }

                    // 清理場景事件監聽器
                    if (context.state.sceneListeners) {
                        context.state.sceneListeners.forEach(({element, event, handler}) => {
                            const el = document.querySelector(element);
                            if (el) el.removeEventListener(event, handler);
                        });
                        context.state.sceneListeners = [];
                    }
                }
            },
            'priceConfirmation': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 priceConfirmation 場景');

                    // 重置處理狀態
                    context.state.gameState.isProcessingPrice = false;
                    context.state.gameState.isProcessingSpeech = false;

                    // 🔧 [新增] 建立輔助點擊模式動作佇列
                    context.ClickMode.buildActionQueue('priceConfirmation');

                    // 渲染價格確認場景UI
                    context.showPriceConfirmationScene();
                },
                onExit: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 priceConfirmation 場景');

                    // 清理計時器
                    if (context.state.gameState.pendingTimers && context.state.gameState.pendingTimers.length > 0) {
                        context.state.gameState.pendingTimers.forEach(timerId => {
                            clearTimeout(timerId);
                        });
                        context.state.gameState.pendingTimers = [];
                        Game.Debug.log('timer', '🧹 [場景清理] 已清除所有待執行計時器');
                    }

                    // 清理音效回調
                    if (context.audio) {
                        if (context.audio.successSound) {
                            context.audio.successSound.onended = null;
                        }
                        if (context.audio.errorSound) {
                            context.audio.errorSound.onended = null;
                        }
                        Game.Debug.log('timer', '🧹 [場景清理] 已清除所有音效回調');
                    }

                    // 取消語音合成
                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }
                }
            },
            'calculation': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 calculation 場景');
                    context.state.isProcessing = false;

                    // 🔧 [新增] 困難模式計算找零場景
                    context.renderCalculationSceneUI();
                },
                onExit: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 calculation 場景');

                    // 清理計算場景的異步操作
                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }
                }
            },
            'transactionSummary': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 transactionSummary 場景');

                    // 🔧 [配置驅動] 執行交易摘要邏輯
                    context.renderTransactionSummaryUI();
                },
                onExit: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 transactionSummary 場景');

                    // 清理交易摘要場景的異步操作
                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }
                }
            },
            'checking': {
                onEnter: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 進入 checking 場景');

                    // 🔧 [新增] 建立輔助點擊模式動作佇列
                    context.ClickMode.buildActionQueue('checking');

                    // 🔧 [配置驅動] 執行找零驗證邏輯
                    context.renderChangeVerificationUI();
                },
                onExit: (context) => {
                    Game.Debug.log('flow', '🎬 [場景管理] 離開 checking 場景');

                    // 清理找零場景的異步操作
                    if (window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                    }

                    // 清理動畫事件監聽器
                    const animations = document.querySelectorAll('[data-scene-animation]');
                    animations.forEach(el => {
                        if (context.sceneAnimationHandler) {
                            el.removeEventListener('animationend', context.sceneAnimationHandler);
                        }
                    });
                }
            }
        },

        // =====================================================
        // 場景管理器（統一切換系統）
        // =====================================================
        SceneManager: {
            switchScene(newScene, context) {
                context.Debug.log('flow', `🎬 [場景管理] 切換場景: ${context.state.gameState.currentScene} → ${newScene}`);

                const currentScene = context.state.gameState.currentScene;

                // 🔧 [修復] 防止重複切換到相同場景（避免重新初始化清空交易數據）
                if (currentScene === newScene) {
                    context.Debug.warn('flow', `⚠️ [場景管理] 嘗試切換到相同場景 "${newScene}"，忽略此操作以保護狀態數據`);
                    return;
                }

                const currentConfig = context.SceneConfig[currentScene];
                const newConfig = context.SceneConfig[newScene];

                // 1. 執行當前場景的 onExit 清理
                if (currentConfig && currentConfig.onExit) {
                    context.Debug.log('flow', `🧹 [場景管理] 清理場景: ${currentScene}`);
                    currentConfig.onExit.call(context, context);
                }

                // 2. 更新場景狀態
                context.state.gameState.currentScene = newScene;

                // 3. 執行新場景的 onEnter 設置
                if (newConfig && newConfig.onEnter) {
                    context.Debug.log('flow', `🚀 [場景管理] 初始化場景: ${newScene}`);
                    newConfig.onEnter.call(context, context);
                }
            }
        },

        // =====================================================
        // 音效和語音系統（繼承 unit5）
        // =====================================================
        audio: {
            dropSound: null,
            errorSound: null,
            successSound: null,
            checkoutSound: null,
            keypadSound: null,
            init() {
                try {
                    this.dropSound = new Audio('../audio/units/drop-sound.mp3');
                    this.dropSound.preload = 'auto';
                    this.dropSound.volume = 0.5;

                    this.errorSound = new Audio('../audio/units/error.mp3');
                    this.errorSound.preload = 'auto';

                    this.successSound = new Audio('../audio/units/correct02.mp3');
                    this.successSound.preload = 'auto';

                    this.checkoutSound = new Audio('../audio/units/checkout.mp3');
                    this.checkoutSound.preload = 'auto';
                    this.checkoutSound.volume = 0.5;

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
            playKeypadSound() {
                if (this.keypadSound) {
                    this.keypadSound.currentTime = 0;
                    this.keypadSound.play().catch(error => Game.Debug.log('audio', '播放按鍵音效失敗:', error));
                }
            },
            // 🔧 [修正] 讓 playErrorSound 支援回呼函式，以便在音效結束後執行操作
            playErrorSound(callback = null) {
                if (this.errorSound) {
                    try {
                        this.errorSound.currentTime = 0;
                        // 確保之前的 onended 監聽器被清除
                        this.errorSound.onended = null;
                        if (callback) {
                            this.errorSound.onended = callback;
                        }
                        this.errorSound.play().catch(error => {
                            Game.Debug.log('audio', '播放錯誤音效失敗:', error);
                            // 如果播放失敗，仍然執行回調，避免流程中斷
                            if (callback) {
                                Game.TimerManager.setTimeout(callback, 100, 'audioCallback');
                            }
                        });
                    } catch (error) {
                        Game.Debug.log('audio', '錯誤音效系統錯誤:', error);
                        if (callback) {
                            Game.TimerManager.setTimeout(callback, 100, 'audioCallback');
                        }
                    }
                } else {
                    Game.Debug.log('audio', '🔊 [A4-音效] errorSound 未載入，直接執行回調');
                    if (callback) {
                        Game.TimerManager.setTimeout(callback, 100, 'audioCallback');
                    }
                }
            },
            playSuccessSound(callback = null) {
                Game.Debug.log('audio', '🔊 [A4-音效] 嘗試播放成功音效', { hasSuccessSound: !!this.successSound, hasCallback: !!callback });

                // 🎆 啟動煙火動畫
                Game.startFireworksAnimation();

                if (this.successSound) {
                    try {
                        this.successSound.currentTime = 0;
                        if (callback) {
                            this.successSound.onended = callback;
                        }
                        this.successSound.play().catch(error => {
                            Game.Debug.log('audio', '播放音效失敗:', error);
                            // 音效播放失敗時仍然執行回調
                            if (callback) {
                                Game.TimerManager.setTimeout(callback, 100, 'audioCallback'); // 短暫延遲模擬音效時間
                            }
                        });
                    } catch (error) {
                        Game.Debug.log('audio', '音效系統錯誤:', error);
                        if (callback) {
                            Game.TimerManager.setTimeout(callback, 100, 'audioCallback');
                        }
                    }
                } else {
                    Game.Debug.log('audio', '🔊 [A4-音效] successSound 未載入，直接執行回調');
                    if (callback) {
                        // 如果音效無法播放，仍然執行回調
                        Game.TimerManager.setTimeout(callback, 100, 'audioCallback'); // 短暫延遲讓用戶有反應時間
                    }
                }
            },
            playCorrect02Sound(callback = null) {
                // correct02.mp3 已經在 successSound 中使用，所以直接調用 playSuccessSound
                this.playSuccessSound(callback);
            },
            playCheckoutSound(callback = null) {
                if (this.checkoutSound) {
                    this.checkoutSound.currentTime = 0;
                    if (callback) {
                        this.checkoutSound.onended = callback;
                    }
                    this.checkoutSound.play().catch(error => Game.Debug.log('audio', '播放音效失敗:', error));
                } else if (callback) {
                    // 如果音效無法播放，仍然執行回調
                    callback();
                }
            }
        },
        
        // =====================================================
        // 音頻解鎖系統 - 採用F1/C1/C2/C3/C4系統
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
                Game.Debug.log('audio', '🔓 [A4-音頻] 音頻權限解鎖成功');
                
                return true;
            } catch (error) {
                Game.Debug.log('audio', '⚠️ [A4-音頻] 音頻解鎖失敗，但繼續執行', error);
                this.state.audioUnlocked = true; // 設為true以避免重複嘗試
                return false;
            }
        },

        speech: {
            synth: window.speechSynthesis,
            voice: null,
            isReady: false,

            init() {
                Game.Debug.log('speech', '🎙️ [A4-語音] 初始化語音系統');

                let voiceInitAttempts = 0;
                const maxAttempts = 5;

                const setVoice = () => {
                    const voices = this.synth.getVoices();
                    voiceInitAttempts++;

                    Game.Debug.log('speech', '🎙️ [A4-語音] 取得語音列表', {
                        voiceCount: voices.length,
                        attempt: voiceInitAttempts,
                        allVoices: voices.map(v => ({ name: v.name, lang: v.lang }))
                    });

                    if (voices.length === 0) {
                        if (voiceInitAttempts < maxAttempts) {
                            Game.Debug.log('speech', '🎙️ [A4-語音] 語音列表為空，將重試');
                            Game.TimerManager.setTimeout(setVoice, 500, 'speechDelay');
                        } else {
                            Game.Debug.log('speech', '🎙️ [A4-語音] 手機端無語音，啟用靜音模式');
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
                        Game.Debug.log('speech', '🎙️ [A4-語音] 語音準備就緒', {
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
                        Game.Debug.log('speech', '🎙️ [A4-語音] 延遲重試語音初始化');
                        setVoice();
                    }
                }, 1000, 'speechDelay');
            },

            speak(text, options = {}) {  // 保持原有 options 接口兼容性
                const { interrupt = true, callback = null } = options;

                Game.Debug.log('speech', '🎙️ [A4-語音] 嘗試播放語音', {
                    text,
                    interrupt,
                    isReady: this.isReady,
                    audioUnlocked: Game.state.audioUnlocked,
                    voiceName: this.voice?.name
                });

                // 🔧 [新增] 手機端音頻解鎖檢查
                if (!Game.state.audioUnlocked) {
                    Game.Debug.log('speech', '🎙️ [A4-語音] ⚠️ 音頻權限未解鎖，跳過語音播放');
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'speechDelay');
                    return;
                }

                // 停止所有正在播放的語音，防止重疊和多重回調
                if (this.synth.speaking && interrupt) {
                    Game.Debug.log('speech', '🎙️ [A4-語音] 停止之前的語音播放');
                    this.synth.cancel();
                }

                if (!this.isReady || !text) {
                    Game.Debug.log('speech', '🎙️ [A4-語音] 語音系統未就緒或文字為空', { isReady: this.isReady, hasText: !!text });
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'speechDelay');
                    return;
                }

                // 🔧 [手機端修復] 檢查語音是否可用
                if (!this.voice) {
                    Game.Debug.log('speech', '🎙️ [A4-語音] 手機端無語音，跳過語音播放');
                    if (callback) Game.TimerManager.setTimeout(callback, 100, 'speechDelay');
                    return;
                }

                Game.Debug.log('speech', '🎙️ [A4-語音] 開始播放語音', {
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
                                Game.Debug.log('speech', '🎙️ [A4-語音] 語音播放完成，執行回調');
                                callback();
                            }
                        };

                        // 監聽語音播放結束事件
                        utterance.onend = safeCallback;
                        utterance.onerror = (e) => {
                            // 'interrupted' 是正常行為（新語音中斷舊語音），不記錄
                            if (e.error !== 'interrupted') {
                                Game.Debug.log('speech', '🎙️ [A4-語音] 語音播放錯誤', e);
                            }
                            // 🔧 [修正] 所有錯誤都立即調用回調，避免卡住流程
                            safeCallback();
                        };

                        // 安全措施：最多等待10秒
                        Game.TimerManager.setTimeout(safeCallback, 10000, 'speechDelay');
                    }

                    this.synth.speak(utterance);
                    Game.Debug.log('speech', '🎙️ [A4-語音] 語音已提交播放');
                } catch (error) {
                    Game.Debug.error('🎙️ [A4-語音] 語音播放異常', error);
                    if (callback) callback();
                }
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
        // 配置驅動系統 - ModeConfig 價格浮動配置
        // =====================================================
        ModeConfig: {
            easy: {
                // 價格浮動配置
                priceVariation: {
                    enabled: true,
                    variationRange: 0.1,          // ±10%浮動
                    roundingRule: 'nearest5',     // 四捨五入到5的倍數
                    minPrice: 5,                  // 最低價格限制
                    maxPrice: 50000,              // 最高價格限制
                    seedStrategy: 'perSession',   // 每個session固定價格
                    variationPatterns: {
                        food: { range: 0.1 },
                        daily: { range: 0.08 },
                        custom: { range: 0.15 }
                    }
                },
                // 語音模板配置
                speechTemplates: {
                    priceAnnounce: "現在{itemName}的價格是{price}元",
                    priceChanged: "今天{itemName}特價{price}元",
                    welcomeStore: "歡迎來到商店，今天有特別優惠喔！"
                },
                // 時間配置
                timing: {
                    priceDisplayDelay: 500,
                    speechDelay: 1000
                }
            },
            normal: {
                // 價格浮動配置
                priceVariation: {
                    enabled: true,
                    variationRange: 0.1,          // ±10%浮動
                    roundingRule: 'nearest1',     // 四捨五入到1的倍數
                    minPrice: 5,
                    maxPrice: 50000,
                    seedStrategy: 'perSession',
                    variationPatterns: {
                        food: { range: 0.1 },
                        daily: { range: 0.08 },
                        electronics: { range: 0.05 },
                        custom: { range: 0.12 }
                    }
                },
                // 語音模板配置
                speechTemplates: {
                    priceAnnounce: "今天{itemName}的價格是{price}元",
                    priceChanged: "{itemName}現在是{price}元",
                    welcomeStore: "歡迎光臨！今天的價格有些調整，請注意商品標價。"
                },
                // 時間配置
                timing: {
                    priceDisplayDelay: 300,
                    speechDelay: 800
                }
            },
            hard: {
                // 價格浮動配置
                priceVariation: {
                    enabled: true,
                    variationRange: 0.15,         // ±15%浮動
                    roundingRule: 'irregular',    // 不規則價格
                    minPrice: 5,
                    maxPrice: 50000,
                    seedStrategy: 'perSession',
                    variationPatterns: {
                        food: { range: 0.15 },
                        daily: { range: 0.12 },
                        electronics: { range: 0.08 },
                        toys: { range: 0.18 },
                        custom: { range: 0.2 }
                    }
                },
                // 語音模板配置
                speechTemplates: {
                    priceAnnounce: "{itemName}{price}元",
                    priceChanged: "價格{price}元",
                    welcomeStore: "歡迎光臨！"
                },
                // 時間配置
                timing: {
                    priceDisplayDelay: 200,
                    speechDelay: 600
                }
            }
        },

        // =====================================================
        // 動態價格生成策略模式
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
            generateItemSeed(basePrice, itemId, difficulty) {
                this.initSeed();
                return (this.sessionSeed + basePrice + itemId + difficulty.charCodeAt(0)) % 9999;
            },

            // 獲取模式配置
            getModeConfig(difficulty) {
                return Game.ModeConfig[difficulty] || Game.ModeConfig.normal;
            },

            // 主要價格生成方法
            generatePrice(basePrice, difficulty, itemCategory = 'food', itemId = 0) {
                const config = this.getModeConfig(difficulty);

                if (!config.priceVariation.enabled) {
                    return basePrice;
                }

                const variation = this.calculateVariation(basePrice, difficulty, itemCategory, itemId);
                const dynamicPrice = basePrice + variation;

                return this.applyRounding(dynamicPrice, config.priceVariation.roundingRule, config);
            },

            // 計算價格變動
            calculateVariation(basePrice, difficulty, category, itemId) {
                const config = this.getModeConfig(difficulty);
                const categoryConfig = config.priceVariation.variationPatterns[category];
                const range = categoryConfig ? categoryConfig.range : config.priceVariation.variationRange;

                // 生成確定性隨機數
                const seed = this.generateItemSeed(basePrice, itemId, difficulty);
                const randomFactor = this.seededRandom(seed);

                // 計算變動金額 (-range 到 +range)
                const variation = basePrice * range * (randomFactor * 2 - 1);

                return Math.round(variation);
            },

            // 應用四捨五入規則
            applyRounding(price, roundingRule, config) {
                let roundedPrice = price;

                switch (roundingRule) {
                    case 'nearest5':
                        roundedPrice = Math.round(price / 5) * 5;
                        break;
                    case 'nearest1':
                        roundedPrice = Math.round(price);
                        break;
                    case 'irregular':
                        // 困難模式：產生不規則價格（如23, 37, 41...）
                        roundedPrice = Math.round(price);
                        if (roundedPrice % 5 === 0) {
                            const adjustment = (this.seededRandom(price) > 0.5) ? 2 : 3;
                            roundedPrice += adjustment;
                        }
                        break;
                    default:
                        roundedPrice = Math.round(price);
                }

                // 確保價格在合理範圍內
                roundedPrice = Math.max(config.priceVariation.minPrice, roundedPrice);
                roundedPrice = Math.min(config.priceVariation.maxPrice, roundedPrice);

                return roundedPrice;
            },

            // 重設session（開始新遊戲時調用）
            resetSession() {
                this.sessionSeed = null;
                Game.Debug.log('product', '🎯 [價格策略] Session重設，價格將重新生成');
            }
        },

        // =====================================================
        // 商品資料系統（完整版）
        // =====================================================
        storeData: {
            // 金錢資料（繼承 unit5）
            moneyItems: [
                { value: 1, name: '1元', images: { front: '../images/money/1_yuan_front.png', back: '../images/money/1_yuan_back.png' } },
                { value: 5, name: '5元', images: { front: '../images/money/5_yuan_front.png', back: '../images/money/5_yuan_back.png' } },
                { value: 10, name: '10元', images: { front: '../images/money/10_yuan_front.png', back: '../images/money/10_yuan_back.png' } },
                { value: 50, name: '50元', images: { front: '../images/money/50_yuan_front.png', back: '../images/money/50_yuan_back.png' } },
                { value: 100, name: '100元', images: { front: '../images/money/100_yuan_front.png', back: '../images/money/100_yuan_back.png' } },
                { value: 500, name: '500元', images: { front: '../images/money/500_yuan_front.png', back: '../images/money/500_yuan_back.png' } },
                { value: 1000, name: '1000元', images: { front: '../images/money/1000_yuan_front.png', back: '../images/money/1000_yuan_back.png' } }
            ],

            // 不同商店的商品資料（引用共用資料）
            // 原始商品資料已移至 js/a4-shared-products.js
            // 注意：需確保 HTML 先引入 a4-shared-products.js
            storeProducts: Object.assign(
                {},
                typeof A4_SHARED_PRODUCTS !== 'undefined' ? A4_SHARED_PRODUCTS : {},
                { magic: [] }  // 魔法商店（動態載入自訂商品）
            ),

            // ===== 以下為備份資料（若 A4_SHARED_PRODUCTS 載入失敗時使用）=====
            _fallbackProducts: {
                convenience: [  // 便利商店 (fallback)
                    { id: 1, name: '蘋果', price: 20, category: 'food', emoji: '🍎', icon: 'icon-a4-apple-shop.png', price_min: 20, price_max: 35, description: '蘋果/顆' },
                    { id: 2, name: '餅乾', price: 25, category: 'food', emoji: '🍪', icon: 'icon-a4-cookies-shop.png', price_min: 25, price_max: 45, description: '餅乾/包' },
                    { id: 3, name: '飲料', price: 20, category: 'food', emoji: '🥤', icon: 'icon-a4-drink-shop.png', price_min: 20, price_max: 35, description: '飲料/瓶' },
                    { id: 4, name: '洋芋片', price: 30, category: 'food', emoji: '🍟', icon: 'icon-a4-potato-chips-shop.png', price_min: 30, price_max: 45, description: '洋芋片/包' },
                    { id: 5, name: '麵包', price: 25, category: 'food', emoji: '🍞', icon: 'icon-a4-bread-shop.png', price_min: 25, price_max: 40, description: '麵包/個' },
                    { id: 101, name: '泡麵', price: 35, category: 'food', emoji: '🍜', icon: 'icon-a4-instant-noodles-shop.png', price_min: 35, price_max: 55, description: '泡麵/碗' },
                    { id: 102, name: '口香糖', price: 39, category: 'food', emoji: '🍬', icon: 'icon-a4-chewing-gum-shop.png', price_min: 39, price_max: 45, description: '口香糖/包' },
                    { id: 103, name: '咖啡', price: 45, category: 'food', emoji: '☕', icon: 'icon-a4-coffee-shop.png', price_min: 45, price_max: 65, description: '咖啡/杯' },
                    { id: 104, name: '巧克力', price: 30, category: 'food', emoji: '🍫', icon: 'icon-a4-chocolate-shop.png', price_min: 30, price_max: 50, description: '巧克力/包' },
                    { id: 105, name: '衛生紙', price: 10, category: 'daily', emoji: '🧻', icon: 'icon-a4-tissue-paper-shop.png', price_min: 10, price_max: 20, description: '衛生紙/包' }
                ],
                market: [  // 菜市場
                    { id: 6, name: '香蕉', price: 50, category: 'food', emoji: '🍌', icon: 'icon-a4-banana-shop.png', price_min: 50, price_max: 80, description: '香蕉/串' },
                    { id: 7, name: '胡蘿蔔', price: 90, category: 'food', emoji: '🥕', icon: 'icon-a4-carrot-shop.png', price_min: 90, price_max: 150, description: '胡蘿蔔/6根' },
                    { id: 8, name: '蔥', price: 20, category: 'food', emoji: '🧅', icon: 'icon-a4-green-onion-shop.png', price_min: 20, price_max: 40, description: '蔥/把' },
                    { id: 9, name: '蛋', price: 80, category: 'food', emoji: '🥚', icon: 'icon-a4-egg-shop.png', price_min: 80, price_max: 120, description: '蛋/盒' },
                    { id: 10, name: '魚', price: 150, category: 'food', emoji: '🐟', icon: 'icon-a4-fish-shop.png', price_min: 150, price_max: 300, description: '魚/尾' },
                    { id: 106, name: '蘋果', price: 20, category: 'food', emoji: '🍎', icon: 'icon-a4-apple-shop.png', price_min: 20, price_max: 30, description: '蘋果/顆' },
                    { id: 107, name: '白菜', price: 50, category: 'food', emoji: '🥬', icon: 'icon-a4-cabbage-shop.png', price_min: 50, price_max: 100, description: '白菜/顆' },
                    { id: 108, name: '蕃茄', price: 60, category: 'food', emoji: '🍅', icon: 'icon-a4-tomato-shop.png', price_min: 60, price_max: 100, description: '蕃茄/2顆' },
                    { id: 109, name: '豬肉', price: 150, category: 'food', emoji: '🥩', icon: 'icon-a4-pork-shop.png', price_min: 150, price_max: 250, description: '豬肉/份' },
                    { id: 110, name: '雞肉', price: 150, category: 'food', emoji: '🍗', icon: 'icon-a4-chicken-shop.png', price_min: 150, price_max: 250, description: '雞肉/份' }
                ],
                breakfast: [  // 早餐店
                    { id: 11, name: '三明治', price: 25, category: 'food', emoji: '🥪', icon: 'icon-a4-sandwich-shop.png', price_min: 25, price_max: 45, description: '三明治/個' },
                    { id: 12, name: '豆漿', price: 20, category: 'food', emoji: '🥛', icon: 'icon-a4-soy-milk-shop.png', price_min: 20, price_max: 30, description: '豆漿/杯' },
                    { id: 13, name: '蛋餅', price: 30, category: 'food', emoji: '🥞', icon: 'icon-a4-egg-pancake-shop.png', price_min: 30, price_max: 45, description: '蛋餅/份' },
                    { id: 14, name: '吐司', price: 15, category: 'food', emoji: '🍞', icon: 'icon-a4-toast-shop.png', price_min: 15, price_max: 25, description: '吐司/片' },
                    { id: 15, name: '紅茶', price: 15, category: 'food', emoji: '🧋', icon: 'icon-a4-black-tea-shop.png', price_min: 15, price_max: 25, description: '紅茶/杯' },
                    { id: 111, name: '漢堡', price: 40, category: 'food', emoji: '🍔', icon: 'icon-a4-hamburger-shop.png', price_min: 40, price_max: 65, description: '漢堡/個' },
                    { id: 112, name: '奶茶', price: 25, category: 'food', emoji: '🥤', icon: 'icon-a4-milk-tea-shop.png', price_min: 25, price_max: 35, description: '奶茶/杯' },
                    { id: 113, name: '蘿蔔糕', price: 30, category: 'food', emoji: '🥘', icon: 'icon-a4-radish-cake-shop.png', price_min: 30, price_max: 45, description: '蘿蔔糕/份' },
                    { id: 114, name: '飯糰', price: 35, category: 'food', emoji: '🍙', icon: 'icon-a4-rice-ball-shop.png', price_min: 35, price_max: 50, description: '飯糰/個' },
                    { id: 115, name: '柳橙汁', price: 30, category: 'food', emoji: '🧃', icon: 'icon-a4-juice-shop.png', price_min: 30, price_max: 45, description: '柳橙汁/杯' }
                ],
                mcdonalds: [  // 美式速食店
                    { id: 16, name: '漢堡', price: 80, category: 'food', emoji: '🍔', icon: 'icon-a4-hamburger-shop.png', price_min: 80, price_max: 120, description: '漢堡/個' },
                    { id: 17, name: '薯條', price: 40, category: 'food', emoji: '🍟', icon: 'icon-a4-french-fries-shop.png', price_min: 40, price_max: 60, description: '薯條/份' },
                    { id: 18, name: '可樂', price: 30, category: 'food', emoji: '🥤', icon: 'icon-a4-cola-shop.png', price_min: 30, price_max: 45, description: '可樂/杯' },
                    { id: 19, name: '雞塊', price: 60, category: 'food', emoji: '🍗', icon: 'icon-a4-chicken-nuggets-shop.png', price_min: 60, price_max: 100, description: '雞塊/份' },
                    { id: 20, name: '蘋果派', price: 30, category: 'food', emoji: '🥧', icon: 'icon-a4-apple-pie-shop.png', price_min: 30, price_max: 45, description: '蘋果派/個' },
                    { id: 116, name: '冰淇淋', price: 15, category: 'food', emoji: '🍦', icon: 'icon-a4-ice-cream-shop.png', price_min: 15, price_max: 30, description: '冰淇淋/支' },
                    { id: 117, name: '炸雞翅', price: 45, category: 'food', emoji: '🍗', icon: 'icon-a4-fried-chicken-wings-shop.png', price_min: 45, price_max: 70, description: '炸雞翅/份' },
                    { id: 118, name: '蔬菜沙拉', price: 40, category: 'food', emoji: '🥗', icon: 'icon-a4-vegetable-salad-shop.png', price_min: 40, price_max: 65, description: '蔬菜沙拉/盒' },
                    { id: 120, name: '巧克力聖代', price: 35, category: 'food', emoji: '🍨', icon: 'icon-a4-chocolate-sundae-shop.png', price_min: 35, price_max: 55, description: '巧克力聖代/杯' }
                ],
                pxmart: [  // 超級市場
                    { id: 21, name: '洗髮精', price: 150, category: 'daily', emoji: '🧴', icon: 'icon-a4-shampoo-shop.png', price_min: 150, price_max: 250, description: '洗髮精/瓶' },
                    { id: 22, name: '牙膏', price: 60, category: 'daily', emoji: '🦷', icon: 'icon-a4-toothpaste-shop.png', price_min: 60, price_max: 120, description: '牙膏/條' },
                    { id: 23, name: '衛生紙', price: 120, category: 'daily', emoji: '🧻', icon: 'icon-a4-box-of-tissues-shop.png', price_min: 120, price_max: 200, description: '衛生紙/袋' },
                    { id: 24, name: '洗衣粉', price: 100, category: 'daily', emoji: '🧽', icon: 'icon-a4-laundry-detergent-shop.png', price_min: 100, price_max: 180, description: '洗衣粉/包' },
                    { id: 25, name: '餅乾', price: 80, category: 'food', emoji: '🍪', icon: 'icon-a4-family-pack-cookies-shop.png', price_min: 80, price_max: 150, description: '餅乾/大包' },
                    { id: 121, name: '牛奶', price: 80, category: 'food', emoji: '🥛', icon: 'icon-a4-milk-shop.png', price_min: 80, price_max: 95, description: '牛奶/瓶' },
                    { id: 122, name: '土司', price: 45, category: 'food', emoji: '🍞', icon: 'icon-a4-loaf-of-toast-shop.png', price_min: 45, price_max: 70, description: '土司/袋' },
                    { id: 123, name: '沐浴乳', price: 150, category: 'daily', emoji: '🧴', icon: 'icon-a4-body-wash-shop.png', price_min: 150, price_max: 250, description: '沐浴乳/瓶' },
                    { id: 124, name: '洗碗精', price: 80, category: 'daily', emoji: '🧽', icon: 'icon-a4-dish-soap-shop.png', price_min: 80, price_max: 120, description: '洗碗精/瓶' },
                    { id: 125, name: '泡麵', price: 100, category: 'food', emoji: '🍜', icon: 'icon-a4-case-of-instant-noodles-shop.png', price_min: 100, price_max: 200, description: '泡麵/箱' }
                ],
                clothing: [  // 服飾店
                    { id: 126, name: 'T恤', price: 290, category: 'clothing', emoji: '👕', icon: 'icon-a4-t-shirt-shop.png', price_min: 290, price_max: 590, description: 'T恤/件' },
                    { id: 127, name: '牛仔褲', price: 590, category: 'clothing', emoji: '👖', icon: 'icon-a4-jeans-shop.png', price_min: 590, price_max: 1200, description: '牛仔褲/條' },
                    { id: 128, name: '運動鞋', price: 800, category: 'clothing', emoji: '👟', icon: 'icon-a4-sneakers-shop.png', price_min: 800, price_max: 2500, description: '運動鞋/雙' },
                    { id: 129, name: '帽子', price: 200, category: 'clothing', emoji: '🧢', icon: 'icon-a4-hat-shop.png', price_min: 200, price_max: 500, description: '帽子/頂' },
                    { id: 130, name: '襪子', price: 50, category: 'clothing', emoji: '🧦', icon: 'icon-a4-socks-shop.png', price_min: 50, price_max: 150, description: '襪子/雙' },
                    { id: 131, name: '外套', price: 800, category: 'clothing', emoji: '🧥', icon: 'icon-a4-jacket-shop.png', price_min: 800, price_max: 2000, description: '外套/件' },
                    { id: 132, name: '裙子', price: 390, category: 'clothing', emoji: '👗', icon: 'icon-a4-skirt-shop.png', price_min: 390, price_max: 890, description: '裙子/條' },
                    { id: 133, name: '圍巾', price: 200, category: 'clothing', emoji: '🧣', icon: 'icon-a4-scarf-shop.png', price_min: 200, price_max: 500, description: '圍巾/條' },
                    { id: 134, name: '手套', price: 150, category: 'clothing', emoji: '🧤', icon: 'icon-a4-gloves-shop.png', price_min: 150, price_max: 300, description: '手套/雙' },
                    { id: 135, name: '內褲', price: 100, category: 'clothing', emoji: '👙', icon: 'icon-a4-underpants-shop.png', price_min: 100, price_max: 300, description: '內褲/件' }
                ],
                electronics: [  // 3C用品店
                    { id: 136, name: '耳機', price: 2000, category: 'electronics', emoji: '🎧', icon: 'icon-a4-headphones-shop.png', price_min: 1000, price_max: 3000, description: '耳機/副' },
                    { id: 137, name: '手機', price: 5000, category: 'electronics', emoji: '📱', icon: 'icon-a4-smartphone-shop.png', price_min: 2000, price_max: 9000, description: '手機/支' },
                    { id: 138, name: '平板電腦', price: 5000, category: 'electronics', emoji: '🖥️', icon: 'icon-a4-tablet-shop.png', price_min: 2500, price_max: 9000, description: '平板電腦/台' },
                    { id: 139, name: '智慧手錶', price: 3000, category: 'electronics', emoji: '⌚', icon: 'icon-a4-smartwatch-shop.png', price_min: 1500, price_max: 6500, description: '智慧手錶/支' },
                    { id: 140, name: '電動牙刷', price: 1500, category: 'electronics', emoji: '🪥', icon: 'icon-a4-electric-toothbrush-shop.png', price_min: 800, price_max: 4000, description: '電動牙刷/支' },
                    { id: 141, name: '無線藍牙喇叭', price: 2500, category: 'electronics', emoji: '🔊', icon: 'icon-a4-bluetooth-speaker-shop.png', price_min: 1500, price_max: 6000, description: '無線藍牙喇叭/個' },
                    { id: 142, name: '掌上遊戲機', price: 7000, category: 'electronics', emoji: '🎮', icon: 'icon-a4-handheld-console-shop.png', price_min: 3000, price_max: 9500, description: '掌上遊戲機/台' },
                    { id: 143, name: '網路攝影機', price: 1500, category: 'electronics', emoji: '📷', icon: 'icon-a4-webcam-shop.png', price_min: 800, price_max: 3500, description: '網路攝影機/個' },
                    { id: 144, name: '電子書閱讀器', price: 3000, category: 'electronics', emoji: '📚', icon: 'icon-a4-ereader-shop.png', price_min: 1500, price_max: 5500, description: '電子書閱讀器/台' },
                    { id: 145, name: '電動刮鬍刀', price: 2000, category: 'electronics', emoji: '🪒', icon: 'icon-a4-electric-shaver-shop.png', price_min: 800, price_max: 5000, description: '電動刮鬍刀/支' },
                    { id: 200, name: '行車紀錄器', price: 2500, category: 'electronics', emoji: '📹', icon: 'icon-a4-dashcam-shop.png', price_min: 1000, price_max: 6000, description: '行車紀錄器/個' }
                ],
                bookstore: [  // 書局
                    { id: 146, name: '小說', price: 250, category: 'books', emoji: '📚', icon: 'icon-a4-novel-shop.png', price_min: 250, price_max: 450, description: '小說/本' },
                    { id: 147, name: '字典', price: 400, category: 'books', emoji: '📖', icon: 'icon-a4-dictionary-shop.png', price_min: 400, price_max: 800, description: '字典/本' },
                    { id: 148, name: '漫畫', price: 100, category: 'books', emoji: '📘', icon: 'icon-a4-comic-book-shop.png', price_min: 100, price_max: 150, description: '漫畫/本' },
                    { id: 149, name: '雜誌', price: 120, category: 'books', emoji: '📰', icon: 'icon-a4-magazine-shop.png', price_min: 120, price_max: 250, description: '雜誌/本' },
                    { id: 150, name: '食譜', price: 300, category: 'books', emoji: '🥘', icon: 'icon-a4-cookbook-shop.png', price_min: 300, price_max: 600, description: '食譜/本' },
                    { id: 151, name: '繪本', price: 200, category: 'books', emoji: '🖼️', icon: 'icon-a4-picture-book-shop.png', price_min: 200, price_max: 500, description: '繪本/本' },
                    { id: 152, name: '旅遊書', price: 350, category: 'books', emoji: '✈️', icon: 'icon-a4-travel-guide-shop.png', price_min: 350, price_max: 650, description: '旅遊書/本' },
                    { id: 153, name: '參考書', price: 200, category: 'books', emoji: '📕', icon: 'icon-a4-reference-book-shop.png', price_min: 200, price_max: 550, description: '參考書/本' },
                    { id: 154, name: '書籤', price: 20, category: 'books', emoji: '🔖', icon: 'icon-a4-bookmark-shop.png', price_min: 20, price_max: 80, description: '書籤/張' },
                    { id: 155, name: '賀卡', price: 50, category: 'books', emoji: '💌', icon: 'icon-a4-greeting-card-shop.png', price_min: 50, price_max: 120, description: '賀卡/張' }
                ],
                toystore: [  // 玩具店
                    { id: 156, name: '玩具車', price: 150, category: 'toys', emoji: '🚗', icon: 'icon-a4-toy-car-shop.png', price_min: 150, price_max: 500, description: '玩具車/台' },
                    { id: 157, name: '娃娃', price: 300, category: 'toys', emoji: '🧸', icon: 'icon-a4-doll-shop.png', price_min: 300, price_max: 800, description: '娃娃/個' },
                    { id: 158, name: '積木', price: 500, category: 'toys', emoji: '🧱', icon: 'icon-a4-building-blocks-shop.png', price_min: 500, price_max: 1500, description: '積木/盒' },
                    { id: 159, name: '拼圖', price: 200, category: 'toys', emoji: '🧩', icon: 'icon-a4-puzzle-shop.png', price_min: 200, price_max: 600, description: '拼圖/盒' },
                    { id: 160, name: '球', price: 100, category: 'toys', emoji: '⚽', icon: 'icon-a4-ball-shop.png', price_min: 100, price_max: 300, description: '球/顆' },
                    { id: 161, name: '飛機', price: 200, category: 'toys', emoji: '✈️', icon: 'icon-a4-toy-plane-shop.png', price_min: 200, price_max: 600, description: '飛機/台' },
                    { id: 162, name: '機器人', price: 400, category: 'toys', emoji: '🤖', icon: 'icon-a4-robot-shop.png', price_min: 400, price_max: 1000, description: '機器人/個' },
                    { id: 163, name: '玩具槍', price: 150, category: 'toys', emoji: '🔫', icon: 'icon-a4-toy-gun-shop.png', price_min: 150, price_max: 400, description: '玩具槍/把' },
                    { id: 164, name: '彈珠', price: 50, category: 'toys', emoji: '🔮', icon: 'icon-a4-marbles-shop.png', price_min: 50, price_max: 100, description: '彈珠/袋' },
                    { id: 165, name: '溜溜球', price: 80, category: 'toys', emoji: '🪀', icon: 'icon-a4-yo-yo-shop.png', price_min: 80, price_max: 150, description: '溜溜球/個' }
                ],
                stationery: [  // 文具店
                    { id: 166, name: '鉛筆', price: 10, category: 'stationery', emoji: '✏️', icon: 'icon-a4-pencil-shop.png', price_min: 10, price_max: 20, description: '鉛筆/支' },
                    { id: 167, name: '原子筆', price: 15, category: 'stationery', emoji: '🖊️', icon: 'icon-a4-ballpoint-pen-shop.png', price_min: 15, price_max: 35, description: '原子筆/支' },
                    { id: 168, name: '橡皮擦', price: 10, category: 'stationery', emoji: '🧽', icon: 'icon-a4-eraser-shop.png', price_min: 10, price_max: 30, description: '橡皮擦/個' },
                    { id: 169, name: '尺', price: 15, category: 'stationery', emoji: '📏', icon: 'icon-a4-ruler-shop.png', price_min: 15, price_max: 40, description: '尺/把' },
                    { id: 170, name: '筆記本', price: 30, category: 'stationery', emoji: '📓', icon: 'icon-a4-notebook-shop.png', price_min: 30, price_max: 60, description: '筆記本/本' },
                    { id: 171, name: '膠水', price: 20, category: 'stationery', emoji: '🧴', icon: 'icon-a4-glue-shop.png', price_min: 20, price_max: 40, description: '膠水/瓶' },
                    { id: 172, name: '剪刀', price: 40, category: 'stationery', emoji: '✂️', icon: 'icon-a4-scissors-shop.png', price_min: 40, price_max: 80, description: '剪刀/把' },
                    { id: 173, name: '彩色筆', price: 80, category: 'stationery', emoji: '🖍️', icon: 'icon-a4-colored-pens-shop.png', price_min: 80, price_max: 150, description: '彩色筆/盒' },
                    { id: 174, name: '計算機', price: 150, category: 'stationery', emoji: '🧮', icon: 'icon-a4-calculator-shop.png', price_min: 150, price_max: 350, description: '計算機/台' },
                    { id: 175, name: '資料夾', price: 20, category: 'stationery', emoji: '📁', icon: 'icon-a4-folder-shop.png', price_min: 20, price_max: 50, description: '資料夾/個' }
                ],
                cosmetics: [  // 美妝店
                    { id: 176, name: '口紅', price: 300, category: 'cosmetics', emoji: '💄', icon: 'icon-a4-lipstick-shop.png', price_min: 300, price_max: 800, description: '口紅/支' },
                    { id: 177, name: '粉底液', price: 400, category: 'cosmetics', emoji: '🧴', icon: 'icon-a4-foundation-shop.png', price_min: 400, price_max: 1200, description: '粉底液/瓶' },
                    { id: 178, name: '睫毛膏', price: 250, category: 'cosmetics', emoji: '👁️', icon: 'icon-a4-mascara-shop.png', price_min: 250, price_max: 600, description: '睫毛膏/支' },
                    { id: 179, name: '眼影', price: 350, category: 'cosmetics', emoji: '🎨', icon: 'icon-a4-eyeshadow-shop.png', price_min: 350, price_max: 900, description: '眼影/盒' },
                    { id: 180, name: '面膜', price: 150, category: 'cosmetics', emoji: '😷', icon: 'icon-a4-face-mask-shop.png', price_min: 100, price_max: 300, description: '面膜/包' },
                    { id: 181, name: '洗面乳', price: 100, category: 'cosmetics', emoji: '🧴', icon: 'icon-a4-facial-cleanser-shop.png', price_min: 100, price_max: 300, description: '洗面乳/條' },
                    { id: 182, name: '乳液', price: 200, category: 'cosmetics', emoji: '🧴', icon: 'icon-a4-lotion-shop.png', price_min: 200, price_max: 500, description: '乳液/瓶' },
                    { id: 183, name: '香水', price: 800, category: 'cosmetics', emoji: '🌸', icon: 'icon-a4-perfume-shop.png', price_min: 800, price_max: 2500, description: '香水/瓶' },
                    { id: 184, name: '指甲油', price: 100, category: 'cosmetics', emoji: '💅', icon: 'icon-a4-nail-polish-shop.png', price_min: 100, price_max: 300, description: '指甲油/瓶' },
                    { id: 185, name: '化妝棉', price: 40, category: 'cosmetics', emoji: '🤍', icon: 'icon-a4-cotton-pads-shop.png', price_min: 40, price_max: 80, description: '化妝棉/盒' }
                ],
                sports: [  // 運動用品店
                    { id: 186, name: '籃球', price: 400, category: 'sports', emoji: '🏀', icon: 'icon-a4-basketball-shop.png', price_min: 400, price_max: 1000, description: '籃球/顆' },
                    { id: 187, name: '足球', price: 400, category: 'sports', emoji: '⚽', icon: 'icon-a4-soccer-ball-shop.png', price_min: 400, price_max: 1000, description: '足球/顆' },
                    { id: 188, name: '羽毛球拍', price: 600, category: 'sports', emoji: '🏸', icon: 'icon-a4-badminton-racket-shop.png', price_min: 600, price_max: 2000, description: '羽毛球拍/支' },
                    { id: 189, name: '網球', price: 50, category: 'sports', emoji: '🎾', icon: 'icon-a4-tennis-ball-shop.png', price_min: 50, price_max: 150, description: '網球/顆' },
                    { id: 190, name: '泳鏡', price: 200, category: 'sports', emoji: '🥽', icon: 'icon-a4-swimming-goggles-shop.png', price_min: 200, price_max: 600, description: '泳鏡/副' },
                    { id: 191, name: '慢步鞋', price: 1200, category: 'sports', emoji: '👟', icon: 'icon-a4-running-shoes-shop.png', price_min: 1200, price_max: 3000, description: '慢步鞋/雙' },
                    { id: 192, name: '瑜珈墊', price: 300, category: 'sports', emoji: '🧘', icon: 'icon-a4-yoga-mat-shop.png', price_min: 300, price_max: 800, description: '瑜珈墊/個' },
                    { id: 193, name: '啞鈴', price: 200, category: 'sports', emoji: '🏋️', icon: 'icon-a4-dumbbell-shop.png', price_min: 200, price_max: 600, description: '啞鈴/個' },
                    { id: 194, name: '護膝', price: 250, category: 'sports', emoji: '🦵', icon: 'icon-a4-knee-pad-shop.png', price_min: 250, price_max: 500, description: '護膝/個' },
                    { id: 195, name: '水壺', price: 150, category: 'sports', emoji: '🥤', icon: 'icon-a4-water-bottle-shop.png', price_min: 150, price_max: 500, description: '水壺/個' }
                ]
            },  // End of _fallbackProducts

            // 依難度設定的價格範圍
            priceRanges: {
                easy: [5, 50],      // 簡單：5-50元
                normal: [10, 200],  // 普通：10-200元  
                hard: [20, 500]     // 困難：20-500元
            },

            // 可用的錢幣面額（延續前面單元）
            denominations: [
                { value: 1, name: '1元', type: 'coin', images: { front: '../images/money/1_yuan_front.png', back: '../images/money/1_yuan_back.png' } },
                { value: 5, name: '5元', type: 'coin', images: { front: '../images/money/5_yuan_front.png', back: '../images/money/5_yuan_back.png' } },
                { value: 10, name: '10元', type: 'coin', images: { front: '../images/money/10_yuan_front.png', back: '../images/money/10_yuan_back.png' } },
                { value: 50, name: '50元', type: 'coin', images: { front: '../images/money/50_yuan_front.png', back: '../images/money/50_yuan_back.png' } },
                { value: 100, name: '100元', type: 'note', images: { front: '../images/money/100_yuan_front.png', back: '../images/money/100_yuan_back.png' } }
            ],

            // =====================================================
            // 動態價格處理方法
            // =====================================================

            // 為商品添加動態價格
            addDynamicPrice(item, difficulty) {
                // 自訂商品（魔法商店上傳）保留使用者設定的原始價格，不套用動態定價
                if (item.category === 'custom') {
                    return { ...item, basePrice: item.price };
                }

                if (item.price_min !== undefined && item.price_max !== undefined) {
                    // 新格式：在 price_min ~ price_max 範圍內隨機生成價格
                    const config = Game.PriceStrategy.getModeConfig(difficulty);
                    const range = item.price_max - item.price_min;
                    const randomPrice = item.price_min + Math.floor(Math.random() * (range + 1));

                    // 僅套用捨入規則，不套用 ModeConfig 的 minPrice/maxPrice 限制
                    let roundedPrice = randomPrice;
                    if (config && config.priceVariation) {
                        switch (config.priceVariation.roundingRule) {
                            case 'nearest5':
                                roundedPrice = Math.round(randomPrice / 5) * 5;
                                break;
                            case 'nearest1':
                                roundedPrice = Math.round(randomPrice);
                                break;
                            case 'irregular':
                                roundedPrice = Math.round(randomPrice);
                                if (roundedPrice % 5 === 0 && roundedPrice > 10) {
                                    roundedPrice += (Math.random() > 0.5) ? 2 : 3;
                                }
                                break;
                        }
                    }
                    // 確保在使用者定義的範圍內
                    roundedPrice = Math.max(item.price_min, Math.min(item.price_max, roundedPrice));

                    return { ...item, basePrice: item.price_min, price: roundedPrice };
                }

                // 舊格式 fallback
                const basePrice = item.price;
                const dynamicPrice = Game.PriceStrategy.generatePrice(
                    basePrice,
                    difficulty,
                    item.category,
                    item.id
                );

                return {
                    ...item,
                    basePrice: basePrice,
                    price: dynamicPrice
                };
            },

            // 為商品陣列批量添加動態價格
            applyDynamicPricing(products, difficulty) {
                return products.map(item => this.addDynamicPrice(item, difficulty));
            },

            // 獲取包含動態價格的商店商品
            getStoreProductsWithDynamicPricing(storeType, difficulty) {
                const originalProducts = this.storeProducts[storeType] || [];
                return this.applyDynamicPricing(originalProducts, difficulty);
            },

            // 重設所有商品價格（開始新遊戲時調用）
            resetAllPrices() {
                Game.PriceStrategy.resetSession();
                Game.Debug.log('product', '🎯 [商品數據] 所有商品價格已重設');
            }
        },

        // =====================================================
        // 🆕 TimerManager - 統一計時器管理（記憶體洩漏防護）
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
                Game.Debug.log('timer', '🧹 [A4-TimerManager] 已清理所有計時器');
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
                    Game.Debug.log('timer', `🧹 [A4-TimerManager] 已清理 ${count} 個 ${category} 類別計時器`);
                }
            }
        },

        // =====================================================
        // 🆕 EventManager - 統一事件監聽器管理（記憶體洩漏防護）
        // =====================================================
        EventManager: {
            listeners: [],

            on(element, type, handler, options = {}, category = 'default') {
                if (!element) return -1;
                element.addEventListener(type, handler, options);
                return this.listeners.push({ element, type, handler, options, category }) - 1;
            },

            removeAll() {
                let count = 0;
                this.listeners.forEach(l => {
                    if (l?.element) {
                        try {
                            l.element.removeEventListener(l.type, l.handler, l.options);
                            count++;
                        } catch(e) {}
                    }
                });
                this.listeners = [];
                Game.Debug.log('event', `🧹 [A4-EventManager] 已清理 ${count} 個事件監聽器`);
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
                    Game.Debug.log('event', `🧹 [A4-EventManager] 已清理 ${count} 個 ${category} 類別事件監聯器`);
                }
            }
        },

        // =====================================================
        // 初始化系統
        // =====================================================
        init() {
            Game.Debug.log('init', '單元A4：模擬購物 - 初始化開始');
            Game.Debug.log('init', '📦 [A4-Shopping] 版本: v9.53.0 (2026-02-22) - Debug Logger 嵌套物件修復');

            // 🆕 清理舊計時器和事件監聽器
            this.TimerManager.clearAll();
            this.EventManager.removeAll();

            // 🎬 注入全局動畫樣式（避免 JS/HTML 內嵌重複定義）
            this.injectGlobalAnimationStyles();

            try {
                // 檢查共用商品資料是否載入成功，否則使用備份資料
                if (!this.storeData.storeProducts.convenience ||
                    this.storeData.storeProducts.convenience.length === 0) {
                    Game.Debug.warn('init', 'A4_SHARED_PRODUCTS 未載入，使用備份商品資料');
                    this.storeData.storeProducts = {
                        ...this.storeData._fallbackProducts,
                        magic: []
                    };
                }

                // 初始化音效系統
                if (this.audio && typeof this.audio.init === 'function') {
                    this.audio.init();
                } else {
                    Game.Debug.warn('audio', '音效系統初始化失敗');
                }
                
                // 初始化語音系統
                if (this.speech && typeof this.speech.init === 'function') {
                    this.speech.init();
                } else {
                    Game.Debug.warn('speech', '語音系統初始化失敗');
                }
                
                // 顯示設定畫面
                this.showSettings();

            } catch (error) {
                Game.Debug.error('遊戲初始化失敗:', error);
                // 即使初始化失敗，也要顯示設定畫面
                this.showSettings();
            }
        },

        // =====================================================
        // 遊戲設定畫面（全新設計）
        // =====================================================
        showSettings() {
            // 🆕 清理計時器和事件監聽器
            this.TimerManager.clearAll();
            this.EventManager.removeByCategory('gameUI');
            this.EventManager.removeByCategory('settings');
            if (window.TutorContext) {
                TutorContext.update({ screen: 'settings' });
                TutorContext.getLiveData = null;
            }

            // 重置上一題的商品ID（重新開始遊戲時）
            this.state.gameState.previousTargetItemId = null;
            // 重置選中商品狀態
            this.state.gameState.selectedItems = [];
            // 🔧 [修復] 清除商品價格緩存（用戶可能更改商店類型或難度）
            this.state.gameState.cachedStoreProducts = null;
            // 🔧 [修復] 不要在showSettings時清空歷史記錄，保持題目多樣性
            // 只有在真正重新載入頁面時才清空歷史記錄

            // 清理可能殘留的選項樣式（反覆練習時的安全措施）
            document.querySelectorAll('.change-option').forEach(option => {
                option.classList.remove('selected', 'correct-selected', 'incorrect-selected');
                const amountDisplay = option.querySelector('.option-amount-display');
                if (amountDisplay) {
                    // 🔧 [修正] 普通模式保持顯示金額
                    this.setAmountDisplayByDifficulty(amountDisplay);
                }
            });
            
            const app = document.getElementById('app');
            const settings = this.state.settings;
            
            // 確保設定狀態正確初始化
            Game.Debug.log('state', '顯示設定畫面時的狀態:', settings);
            
            app.innerHTML = `
                <div class="unit-welcome">
                    <div class="welcome-content" style="text-align: center;">
                        <div class="settings-title-row">
                            <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                            <h1>單元A4：模擬購物</h1>
                        </div>
                        <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">在虛擬商店中選購商品，練習計算總價、付款與收取零錢</p>

                        <div class="game-settings">
                            <style>
                                .game-settings {
                                    text-align: left;
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
                                /* 保持標題置中 */
                                h1 {
                                    text-align: center;
                                }
                                /* 保持按鈕置中 */
                                .game-buttons {
                                    display: flex;
                                    justify-content: center;
                                    gap: 15px;
                                    margin-top: 30px;
                                }
                                /* 🔧 [新增] 購物場所滾動容器樣式 */
                                .store-scroll-container {
                                    max-height: 250px;
                                    overflow-y: auto;
                                    overflow-x: hidden;
                                    padding: 10px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 12px;
                                    background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);
                                    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
                                }
                                /* 美化滾動條 */
                                .store-scroll-container::-webkit-scrollbar {
                                    width: 10px;
                                }
                                .store-scroll-container::-webkit-scrollbar-track {
                                    background: #f1f1f1;
                                    border-radius: 10px;
                                    margin: 5px 0;
                                }
                                .store-scroll-container::-webkit-scrollbar-thumb {
                                    background: linear-gradient(135deg, #667eea, #764ba2);
                                    border-radius: 10px;
                                    border: 2px solid #f1f1f1;
                                }
                                .store-scroll-container::-webkit-scrollbar-thumb:hover {
                                    background: linear-gradient(135deg, #764ba2, #667eea);
                                }
                                /* 為火狐瀏覽器設置滾動條樣式 */
                                .store-scroll-container {
                                    scrollbar-width: thin;
                                    scrollbar-color: #667eea #f1f1f1;
                                }
                                /* 減少設定組之間的間距 */
                                .game-settings .setting-group {
                                    margin-bottom: 15px;
                                }
                                /* 手機版優化 */
                                @media (max-width: 768px) {
                                    .store-scroll-container {
                                        max-height: 200px;
                                    }
                                    .game-settings .setting-group {
                                        margin-bottom: 12px;
                                    }
                                }

                                /* 🔧 [FIX] 強制修正設定頁面 Modal 樣式 - 參照 F1 */
                                .image-preview-modal .modal-content {
                                    padding: 0 !important;
                                    width: 90% !important;
                                    max-width: 600px !important;
                                    border-radius: 15px !important;
                                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
                                    background: white !important;
                                }
                                .image-preview-modal .modal-header {
                                    display: flex !important;
                                    justify-content: space-between !important;
                                    align-items: center !important;
                                    padding: 20px !important;
                                    border-bottom: 1px solid #eee !important;
                                }
                                .image-preview-modal .modal-body {
                                    padding: 20px !important;
                                    display: block !important;
                                    background: linear-gradient(135deg, #e3f2fd, #bbdefb) !important;
                                }
                                .image-preview-modal .image-preview-container {
                                    text-align: center !important;
                                    margin-bottom: 15px !important;
                                    padding: 20px !important;
                                    background: linear-gradient(135deg, #e3f2fd, #bbdefb) !important;
                                    border: none !important;
                                    border-radius: 10px !important;
                                    min-width: unset !important;
                                    min-height: unset !important;
                                }
                                .image-preview-modal .image-preview-container img {
                                    max-width: 350px !important;
                                    max-height: 300px !important;
                                    object-fit: contain !important;
                                    border-radius: 10px !important;
                                    border: 2px solid #ddd !important;
                                }
                                .image-preview-modal .item-form {
                                    display: block !important;
                                }
                                .image-preview-modal .item-form .form-group {
                                    display: flex !important;
                                    flex-direction: row !important;
                                    align-items: center !important;
                                    margin-bottom: 10px !important;
                                    gap: 0 !important;
                                }
                                .image-preview-modal .item-form .form-group:last-child {
                                    margin-bottom: 0 !important;
                                }
                                .image-preview-modal .item-form label {
                                    min-width: 80px !important;
                                    font-weight: bold !important;
                                }
                                .image-preview-modal .item-form input {
                                    flex: 1 !important;
                                    padding: 10px !important;
                                    border: 2px solid #ddd !important;
                                    border-radius: 8px !important;
                                    font-size: 16px !important;
                                }
                                .image-preview-modal .item-form .price-unit {
                                    margin-left: 8px !important;
                                    font-weight: bold !important;
                                }
                                .image-preview-modal .modal-footer {
                                    display: flex !important;
                                    flex-direction: row !important;
                                    justify-content: center !important;
                                    align-items: center !important;
                                    gap: 20px !important;
                                    padding: 15px 20px !important;
                                    border-top: 1px solid #eee !important;
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
                            </style>
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


                            <!-- 🔧 [新增] 輔助點擊模式（僅簡單模式可用） -->
                            <div class="setting-group clickmode-section" style="background: #fff3cd; padding: 15px; border-radius: 10px; border: 2px solid #ffcc02; display: ${settings.difficulty === 'easy' ? 'block' : 'none'};">
                                <label style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 1.2em;">♿</span>
                                    <span>輔助點擊模式（單鍵操作）：</span>
                                </label>
                                <p style="font-size: 0.9em; color: #666; margin: 8px 0 12px 0; line-height: 1.5;">
                                    啟用後，只要偵測到點擊，系統會自動依序完成選擇商品、付款、找零等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                    <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式 + 指定商品」</strong>
                                </p>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.clickMode ? 'active' : ''}"
                                            data-type="clickMode" data-value="true">
                                        ✓ 啟用
                                    </button>
                                    <button class="selection-btn ${!settings.clickMode ? 'active' : ''}"
                                            data-type="clickMode" data-value="false">
                                        ✗ 停用
                                    </button>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label>📋 任務類型：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.taskType === 'assigned' || settings.clickMode ? 'active' : ''}"
                                            data-type="task" data-value="assigned">
                                        購買指定商品
                                    </button>
                                    <button class="selection-btn ${settings.taskType === 'freeChoice' && !settings.clickMode ? 'active' : ''}"
                                            data-type="task" data-value="freeChoice"
                                            ${settings.clickMode ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                        自選購買商品
                                    </button>
                                </div>
                                <div class="setting-description">
                                    <small id="task-desc">${settings.taskType === 'assigned' || settings.clickMode ? '系統會隨機指定要購買的商品' : '你可以在錢包金額內自由選擇商品'}${settings.clickMode ? ' (輔助點擊模式僅支援指定商品)' : ''}</small>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label><img src="../images/common/icons_wallet.png" alt="💰" style="width:1em;height:1em;vertical-align:middle;margin-right:2px;" onerror="this.outerHTML='💰'"> 錢包金額：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.walletAmount === 'default' ? 'active' : ''}"
                                            data-type="wallet" data-value="default">
                                        預設金額
                                    </button>
                                    <button class="selection-btn ${settings.walletAmount === 'custom' ? 'active' : ''}"
                                            data-type="wallet" data-value="custom" onclick="Game.showCustomWalletModal()">
                                        自訂金額
                                    </button>
                                </div>
                            </div>
                            
                            <div class="setting-group">
                                <label>🏪 購物場所：</label>
                                <div class="store-scroll-container">
                                    <div class="button-group">
                                        ${this.generateStoreButtons()}
                                    </div>
                                </div>
                            </div>

                            <!-- 🔧 [新增] 魔法商店設定容器 -->
                            <div id="magic-store-container">
                                ${settings.storeType === 'magic' ? this.getMagicStoreSettings() : ''}
                            </div>

                            <div class="setting-group">
                                <label>📊 測驗題數：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${settings.questionCount === 1 ? 'active' : ''}"
                                            data-type="questionCount" data-value="1">
                                        1題
                                    </button>
                                    <button class="selection-btn ${settings.questionCount === 3 ? 'active' : ''}"
                                            data-type="questionCount" data-value="3">
                                        3題
                                    </button>
                                    <button class="selection-btn ${settings.questionCount === 5 ? 'active' : ''}"
                                            data-type="questionCount" data-value="5">
                                        5題
                                    </button>
                                    <button class="selection-btn ${settings.questionCount === 10 ? 'active' : ''}"
                                            data-type="questionCount" data-value="10">
                                        10題
                                    </button>
                                    <button class="selection-btn custom-btn ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? 'active' : ''}"
                                            data-type="questionCount" data-value="custom">
                                        自訂
                                    </button>
                                </div>
                                <div class="custom-input-group" style="display: ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? 'block' : 'none'}; margin-top: 10px;">
                                    <input type="text" id="custom-question-count"
                                           value="${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? settings.questionCount + '題' : ''}"
                                           placeholder="請輸入題數"
                                           style="padding: 8px; border-radius: 5px; border: 2px solid ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? '#667eea' : '#ddd'}; background: ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? '#667eea' : 'white'}; color: ${settings.questionCount !== null && ![1,3,5,10].includes(settings.questionCount) ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                                           readonly onclick="Game.showQuestionCountNumberInput()">
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
                            <button class="back-to-main-btn" onclick="Game.backToMainMenu()" aria-label="返回主畫面">
                                返回主畫面
                            </button>
                            <button class="start-btn" onclick="Game.startGame()" aria-label="開始遊戲">
                                開始遊戲
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // 綁定設定選項事件
            this.bindSettingEvents();

            // 添加圖片預覽模態視窗到頁面
            this.addImagePreviewModal();

            // 確保預設簡單模式狀態正確初始化
            if (settings.difficulty === 'easy') {
                Game.Debug.log('init', '初始化時檢測到預設簡單模式，確保狀態正確設定');
                // 不需要調用 updateSetting，但要確保狀態一致性
                this.TimerManager.setTimeout(() => {
                    Game.Debug.log('state', '延遲檢查設定狀態:', this.state.settings.difficulty);
                }, 100, 'settingsUI');
            }
        },

        // 添加圖片預覽模態視窗到頁面
        addImagePreviewModal() {
            // 檢查是否已存在模態視窗，避免重複添加
            if (document.getElementById('image-preview-modal')) {
                return;
            }

            const modalHTML = `
                <!-- 圖片預覽小視窗 -->
                <div id="image-preview-modal" class="image-preview-modal">
                    <div class="modal-overlay" onclick="window.Game.closeImagePreview()"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>🎁 新增魔法商品</h3>
                            <button onclick="window.Game.closeImagePreview()" class="close-btn">✕</button>
                        </div>
                        <div class="modal-body">
                            <div class="image-preview-container">
                                <img id="preview-image" src="" alt="商品預覽" style="max-width: 350px; max-height: 300px; object-fit: contain; border-radius: 10px; border: 2px solid #ddd;">
                            </div>
                            <div class="item-form">
                                <div class="form-group">
                                    <label>商品名稱：</label>
                                    <input type="text" id="modal-custom-name" placeholder="請輸入商品名稱" maxlength="10">
                                </div>
                                <div class="form-group">
                                    <label>商品價格：</label>
                                    <input type="text" id="modal-custom-price" placeholder="請輸入價格" readonly onclick="window.Game.showCustomItemPriceInput()">
                                    <span class="price-unit">元</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button onclick="window.Game.closeImagePreview()" class="cancel-btn">取消</button>
                            <button onclick="window.Game.confirmAddCustomItem()" class="confirm-btn">確認新增</button>
                        </div>
                    </div>
                </div>
            `;

            // 將模態視窗添加到 body 末尾
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        },

        // 🔧 [新增] 更新魔法商店設定區域（避免整頁重新渲染）
        updateMagicStoreSettings() {
            const magicStoreContainer = document.getElementById('magic-store-container');
            if (!magicStoreContainer) return;

            if (this.state.settings.storeType === 'magic') {
                // 顯示魔法商店設定
                magicStoreContainer.innerHTML = this.getMagicStoreSettings();
            } else {
                // 隱藏魔法商店設定
                magicStoreContainer.innerHTML = '';
            }
        },

        // 關閉魔法商店設定
        closeMagicStoreSettings() {
            // 將商店類型切換回傳統商店
            this.state.settings.storeType = 'traditional';

            // 更新商店按鈕狀態
            this.updateStoreButtons();

            // 隱藏魔法商店設定區域
            const magicStoreContainer = document.getElementById('magic-store-container');
            if (magicStoreContainer) {
                magicStoreContainer.innerHTML = '';
            }

            // 播放選單選擇音效
            this.playMenuSelectSound();
        },

        // 取得自訂商品數量限制訊息
        getCustomItemLimitMessage() {
            const difficulty = this.state.settings.difficulty;
            const currentCount = this.state.gameState.customItems.length;

            // 如果難度尚未設定，提示用戶先選擇難度
            if (!difficulty) {
                return '請先選擇遊戲難度。';
            }

            let maxItems;
            let difficultyText;

            if (difficulty === 'hard') {
                maxItems = 5;
                difficultyText = '困難模式，最多顯示5種商品';
            } else {
                maxItems = 3;
                difficultyText = '簡單、普通模式，最多顯示3種商品';
            }

            if (currentCount >= maxItems) {
                return `已達上限${maxItems}個圖片，請先刪除現有圖片`;
            } else {
                return difficultyText + '。';
            }
        },

        // 取得自訂商品數量上限
        getCustomItemLimit() {
            const difficulty = this.state.settings.difficulty;
            // 如果難度尚未設定，預設使用簡單模式的限制
            return difficulty === 'hard' ? 5 : 3;
        },

        // 魔法商店設定區域
        getMagicStoreSettings() {
            return `
                <div class="magic-store-settings">
                    <div class="magic-store-header">
                        <h4>🎪 魔法商店設定</h4>
                        <button onclick="window.Game.closeMagicStoreSettings()" class="close-magic-store-btn">✕</button>
                    </div>
                    <p>上傳你的商品圖片並設定價格：</p>
                    <div class="custom-items-list" id="custom-items-list">
                        ${this.state.gameState.customItems.map((item, index) => `
                            <div class="custom-item">
                                <img src="${item.imageUrl}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid #ddd;">
                                <div class="item-info">
                                    <div class="item-name">${item.name}</div>
                                    <div class="item-price">${item.price}元</div>
                                </div>
                                <button onclick="Game.removeCustomItem(${index})" class="remove-btn">❌ 移除</button>
                            </div>
                        `).join('')}
                    </div>
                    <div class="add-custom-item">
                        <input type="file" id="custom-image" accept="image/*" style="display: none;" onchange="window.Game.handleImageUpload(event)">
                        <button type="button" onclick="window.Game.triggerImageUpload()" class="upload-btn ${!this.state.settings.difficulty || this.state.gameState.customItems.length >= this.getCustomItemLimit() ? 'disabled' : ''}">${!this.state.settings.difficulty ? '⚠️ 請先選擇難度' : (this.state.gameState.customItems.length >= this.getCustomItemLimit() ? '❌ 已達上限' : '📸 上傳圖片')}</button>
                        <div class="upload-hint">${this.getCustomItemLimitMessage()}</div>
                    </div>
                </div>
            `;
        },
        
        // 綁定設定事件
        bindSettingEvents() {
            // 設定選項點擊事件（避免重複綁定）
            document.querySelectorAll('.selection-btn').forEach(btn => {
                // 移除已存在的事件監聽器（如果有的話）
                if (btn.hasAttribute('data-event-bound')) {
                    return; // 已綁定過事件，跳過
                }
                
                btn.setAttribute('data-event-bound', 'true');
                btn.addEventListener('click', (e) => {
                    // 🔧 [新增] 如果按鈕被禁用，不處理點擊
                    if (e.target.hasAttribute('disabled')) {
                        Game.Debug.log('state', '[A4-設定] 按鈕已禁用，忽略點擊');
                        return;
                    }

                    // 🔧 [新增] 如果是任務類型且輔助點擊模式啟用，禁止選擇「自選購買商品」
                    const type = e.target.dataset.type;
                    const value = e.target.dataset.value;
                    if (type === 'task' && value === 'freeChoice' && this.state.settings.clickMode) {
                        Game.Debug.log('assist', '[A4-ClickMode] 輔助點擊模式下不能選擇「自選購買商品」');
                        return;
                    }

                    // 🔓 解鎖手機音頻播放權限
                    if (!this.state.audioUnlocked) {
                        this.unlockAudio();
                    }

                    if (type && value) {
                        // 播放選單選擇音效
                        this.playMenuSelectSound();

                        // 特殊處理測驗題數的自訂選項
                        if (type === 'questionCount' && value === 'custom') {
                            // 直接彈出數字輸入器
                            this.showCustomQuestionInput();
                            return;
                        } else if (type === 'questionCount' && value !== 'custom') {
                            // 隱藏自訂輸入框並設定預設值
                            const customInputGroup = document.querySelector('.custom-input-group');
                            if (customInputGroup) {
                                customInputGroup.style.display = 'none';
                                // 🔧 [新增] 恢復輸入框原始樣式
                                const customInput = document.getElementById('custom-question-count');
                                if (customInput) {
                                    customInput.value = '';
                                    customInput.style.background = 'white';
                                    customInput.style.color = '#333';
                                    customInput.style.borderColor = '#ddd';
                                }
                            }
                            this.updateSetting(type, parseInt(value));
                        } else {
                            this.updateSetting(type, value);
                        }
                        
                        // 更新按鈕狀態
                        const group = e.target.closest('.button-group');
                        group.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');

                        // 如果是任務類型，更新描述
                        if (type === 'task') {
                            const desc = document.getElementById('task-desc');
                            if (desc) {
                                desc.textContent = value === 'assigned' ? 
                                    '系統會隨機指定要購買的商品' : 
                                    '你可以在錢包金額內自由選擇商品';
                            }
                        }
                    }
                });
            });

            // 🎁 獎勵系統連結事件
            const settingsRewardLink = document.getElementById('settings-reward-link');
            this.EventManager.on(settingsRewardLink, 'click', (e) => {
                e.preventDefault();
                if (typeof RewardLauncher !== 'undefined') {
                    RewardLauncher.open();
                } else {
                    window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                }
            }, {}, 'settings');

            // 📝 作業單連結事件
            const worksheetLink = document.getElementById('settings-worksheet-link');
            this.EventManager.on(worksheetLink, 'click', (e) => {
                e.preventDefault();
                // 作業單使用自己的預設值與工具列設定，不受遊戲設定影響
                const params = new URLSearchParams({ unit: 'a4' });
                window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
            }, {}, 'settings');


            // 更新開始按鈕狀態
            this.updateStartButton();
        },

        // 更新開始按鈕狀態
        updateStartButton() {
            const startBtn = document.querySelector('.start-btn');
            if (!startBtn) return;

            // 🔧 如果選擇自訂金額，必須確認已設定 customWalletAmount
            const settings = this.state.settings;
            const isWalletValid = settings.walletAmount === 'custom'
                ? (settings.customWalletAmount && settings.customWalletAmount > 0)
                : settings.walletAmount;

            // 檢查所有必要設定是否完成
            const isValidSettings = settings.difficulty &&
                                  isWalletValid &&
                                  settings.taskType &&
                                  settings.storeType &&
                                  settings.questionCount;

            // 檢查魔法商店是否有商品
            const isMagicStoreValid = settings.storeType !== 'magic' ||
                                     this.state.gameState.customItems.length > 0;

            // 更新按鈕狀態
            if (isValidSettings && isMagicStoreValid) {
                startBtn.disabled = false;
                startBtn.textContent = '開始遊戲';
                startBtn.style.opacity = '1';
                startBtn.style.cursor = 'pointer';
                startBtn.onclick = () => this.startGame();
            } else {
                startBtn.disabled = true;
                startBtn.style.opacity = '0.5';
                startBtn.style.cursor = 'not-allowed';
                startBtn.onclick = () => this.showMissingSettings();

                // 顯示具體的錯誤訊息
                if (!isValidSettings) {
                    startBtn.textContent = '請完成所有設定選項';
                } else if (!isMagicStoreValid) {
                    startBtn.textContent = '魔法商店需要至少一個商品';
                }
            }
        },

        // 顯示缺少的設定項目
        showMissingSettings() {
            const s = this.state.settings;
            const missing = [];

            if (!s.difficulty) missing.push('遊戲難度');

            // 檢查錢包金額（包括自訂金額）
            const isWalletValid = s.walletAmount === 'custom'
                ? (s.customWalletAmount && s.customWalletAmount > 0)
                : s.walletAmount;
            if (!isWalletValid) {
                missing.push(s.walletAmount === 'custom' ? '錢包金額（請輸入自訂金額）' : '錢包金額');
            }

            if (!s.taskType) missing.push('任務類型');
            if (!s.storeType) missing.push('商店類型');
            if (!s.questionCount) missing.push('測驗題數');

            // 檢查魔法商店商品
            if (s.storeType === 'magic' && this.state.gameState.customItems.length === 0) {
                missing.push('魔法商店商品（至少上傳一個）');
            }

            if (missing.length > 0) {
                alert('請先完成以下設定：\n\n' + missing.map(m => '• ' + m).join('\n'));
            }
        },
        
        // 顯示自訂題目數量輸入框
        showCustomQuestionInput() {
            // 直接觸發數字輸入器
            this.showQuestionCountNumberInput();
        },

        // 🔧 [已移除] setCustomQuestionCount() - 改用數字輸入器處理

        // 更新設定
        updateSetting(type, value) {
            switch(type) {
                case 'difficulty':
                    this.state.settings.difficulty = value;
                    Game.Debug.log('state', '難度設定已更新為:', value);
                    // 當難度改變時，更新魔法商店設定以反映新的商品數量限制
                    this.updateMagicStoreSettings();
                    // 🔧 [新增] 根據難度顯示/隱藏輔助點擊模式選項
                    this.updateClickModeVisibility();
                    // 🔧 [新增] 更新難度說明
                    this.updateDifficultyDescription(value);
                    break;
                case 'wallet':
                    this.state.settings.walletAmount = (value === 'custom' || value === 'default') ? value : parseInt(value);
                    // 當錢包金額改變時，重新生成購物場所按鈕
                    this.updateStoreButtons();
                    break;
                case 'task':
                    this.state.settings.taskType = value;
                    break;
                case 'store':
                    this.state.settings.storeType = value;
                    // 🔧 [優化] 只更新魔法商店設定區域，避免整頁面重新渲染造成閃爍
                    this.updateMagicStoreSettings();
                    break;
                case 'questionCount':
                    this.state.settings.questionCount = parseInt(value);
                    break;

                case 'clickMode':
                    // 🔧 [新增] 處理輔助點擊模式設定
                    this.state.settings.clickMode = (value === 'true');
                    Game.Debug.log('assist', '[A4-ClickMode] 輔助點擊模式:', this.state.settings.clickMode ? '啟用' : '停用');

                    // 🔧 [新增] 如果啟用輔助點擊模式，強制設定任務類型為「購買指定商品」
                    if (this.state.settings.clickMode) {
                        this.state.settings.taskType = 'assigned';
                        Game.Debug.log('assist', '[A4-ClickMode] 已強制設定 state.settings.taskType = assigned');

                        // 更新UI上的任務類型按鈕狀態
                        const taskButtons = document.querySelectorAll('[data-type="task"]');
                        Game.Debug.log('assist', '[A4-ClickMode] 找到任務類型按鈕數量:', taskButtons.length);

                        taskButtons.forEach(btn => {
                            Game.Debug.log('assist', '[A4-ClickMode] 處理按鈕:', btn.dataset.value, btn.textContent.trim());
                            if (btn.dataset.value === 'assigned') {
                                btn.classList.add('active');
                                Game.Debug.log('assist', '[A4-ClickMode] 設定「購買指定商品」為active');
                            } else if (btn.dataset.value === 'freeChoice') {
                                btn.classList.remove('active');
                                btn.disabled = true;
                                btn.style.opacity = '0.5';
                                btn.style.cursor = 'not-allowed';
                                Game.Debug.log('assist', '[A4-ClickMode] 禁用「自選購買商品」');
                            }
                        });

                        // 更新任務類型描述
                        const taskDesc = document.getElementById('task-desc');
                        if (taskDesc) {
                            taskDesc.textContent = '系統會隨機指定要購買的商品 (輔助點擊模式僅支援指定商品)';
                            Game.Debug.log('assist', '[A4-ClickMode] 已更新任務類型描述');
                        }
                        Game.Debug.log('assist', '[A4-ClickMode] 已自動設定任務類型為「購買指定商品」');
                    } else {
                        // 🔧 [新增] 停用輔助點擊模式時，恢復「自選購買商品」按鈕
                        const taskButtons = document.querySelectorAll('[data-type="task"]');
                        taskButtons.forEach(btn => {
                            if (btn.dataset.value === 'freeChoice') {
                                btn.disabled = false;
                                btn.style.opacity = '';
                                btn.style.cursor = '';
                                Game.Debug.log('assist', '[A4-ClickMode] 恢復「自選購買商品」按鈕');
                            }
                        });

                        // 更新任務類型描述（根據當前選擇）
                        const taskDesc = document.getElementById('task-desc');
                        if (taskDesc) {
                            taskDesc.textContent = this.state.settings.taskType === 'assigned' ?
                                '系統會隨機指定要購買的商品' :
                                '你可以在錢包金額內自由選擇商品';
                        }
                    }
                    break;
            }
            Game.Debug.log('state', '設定已更新:', this.state.settings);

            // 更新開始按鈕狀態
            this.updateStartButton();
        },

        // 🔧 [新增] 根據難度顯示/隱藏輔助點擊模式選項
        updateClickModeVisibility() {
            const clickModeSection = document.querySelector('.clickmode-section');
            if (clickModeSection) {
                if (this.state.settings.difficulty === 'easy') {
                    clickModeSection.style.display = 'block';
                } else {
                    clickModeSection.style.display = 'none';
                    // 非簡單模式時，自動停用輔助點擊模式
                    this.state.settings.clickMode = false;
                }
            }
        },

        // 🔧 [新增] 取得難度說明
        getDifficultyDescription(difficulty) {
            const descriptions = {
                'easy': '簡單：系統會有視覺、語音提示，引導每個步驟。',
                'normal': '普通：自己完成購物，錯誤3次會自動提示。',
                'hard': '困難：自己完成購物，沒有自動提示。'
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

        // 更新購物場所按鈕
        updateStoreButtons() {
            // 找到包含購物場所標籤的設定組
            const settingGroups = document.querySelectorAll('.setting-group');
            let storeButtonGroup = null;
            
            settingGroups.forEach(group => {
                const label = group.querySelector('label');
                if (label && label.textContent.includes('🏪 購物場所')) {
                    storeButtonGroup = group.querySelector('.button-group');
                }
            });
            
            if (storeButtonGroup) {
                storeButtonGroup.innerHTML = this.generateStoreButtons();
                // 只為新生成的商店按鈕綁定事件
                this.bindStoreButtonEvents(storeButtonGroup);
            }
        },
        
        // 為商店按鈕綁定事件（避免重複綁定所有設定事件）
        bindStoreButtonEvents(storeButtonGroup) {
            const storeButtons = storeButtonGroup.querySelectorAll('.selection-btn');
            storeButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // 🔓 解鎖手機音頻播放權限
                    if (!this.state.audioUnlocked) {
                        this.unlockAudio();
                    }
                    
                    const type = e.target.dataset.type;
                    const value = e.target.dataset.value;
                    
                    if (type && value) {
                        // 播放選單選擇音效
                        this.playMenuSelectSound();
                        this.updateSetting(type, value);
                        
                        // 更新按鈕狀態
                        const group = e.target.closest('.button-group');
                        group.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                    }
                });
            });
        },
        
        // 觸發圖片上傳
        triggerImageUpload() {
            Game.Debug.log('ui', '=== 上傳按鈕被點擊了！ ===');
            Game.Debug.log('ui', '觸發圖片上傳');

            // 檢查是否已選擇難度
            if (!this.state.settings.difficulty) {
                alert('請先選擇遊戲難度。');
                return;
            }

            // 檢查是否已達到最大圖片數量限制
            const maxItems = this.getCustomItemLimit();
            if (this.state.gameState.customItems.length >= maxItems) {
                const difficultyText = this.state.settings.difficulty === 'hard' ? '困難模式最多5個' : '簡單、普通模式最多3個';
                alert(`${difficultyText}圖片！請先刪除現有圖片再上傳新圖片。`);
                return;
            }

            // 確保預覽視窗是隱藏的
            const modal = document.getElementById('image-preview-modal');
            if (modal) {
                modal.classList.remove('show');
                Game.Debug.log('ui', '確保預覽視窗隱藏');
            }
            
            const fileInput = document.getElementById('custom-image');
            if (fileInput) {
                // 重置檔案輸入，確保可以重新選擇同一個檔案
                fileInput.value = '';
                Game.Debug.log('ui', '檔案輸入已重置');
                
                // 直接觸發檔案選擇器，不使用延遲
                try {
                    fileInput.click();
                    Game.Debug.log('ui', '檔案選擇器已觸發');
                    
                    // 檢查是否成功觸發
                    this.TimerManager.setTimeout(() => {
                        if (!fileInput.files || fileInput.files.length === 0) {
                            Game.Debug.log('ui', '檔案選擇器已關閉，沒有選擇檔案');
                        }
                    }, 1000, 'uiAnimation');

                    // 備用檢查：如果瀏覽器不支援程式觸發檔案選擇器
                    this.TimerManager.setTimeout(() => {
                        const isFileDialogOpen = document.hasFocus();
                        if (isFileDialogOpen) {
                            Game.Debug.log('ui', '檔案選擇對話框正常開啟');
                        } else {
                            Game.Debug.warn('ui', '檔案選擇對話框可能未開啟，請檢查瀏覽器設定');
                        }
                    }, 100, 'uiAnimation');
                } catch (error) {
                    Game.Debug.error('觸發檔案選擇器時發生錯誤:', error);
                }
            } else {
                Game.Debug.error('找不到檔案輸入元素');
            }
        },
        
        // 處理圖片上傳
        // 根據金額生成購物場所按鈕
        generateStoreButtons() {
            const walletAmount = this.state.settings.walletAmount;
            const settings = this.state.settings;

            // 定義每個金額層級對應的商店
            const storesByAmount = {
                100: ['convenience', 'market', 'breakfast', 'stationery'],  // 100元以內：便利商店、菜市場、早餐店、文具店
                500: ['pxmart', 'mcdonalds', 'bookstore', 'toystore', 'cosmetics'],      // 500元以內：超級市場、美式速食店、書局、玩具店、美妝店
                1000: ['clothing', 'sports'],                               // 1000元以內：服飾店、運動用品店
                10000: ['electronics'],                                     // 10000元以內：3C賣場
                custom: 'all'                                               // 自訂金額：所有商店都可用
            };

            // 商店資訊
            const storeInfo = {
                convenience: { name: '便利商店', emoji: '🏪' },
                market: { name: '菜市場', emoji: '🥬' },
                breakfast: { name: '早餐店', emoji: '🍳' },
                mcdonalds: { name: '美式速食店', emoji: '🍟' },
                pxmart: { name: '超級市場', emoji: '🛒' },
                clothing: { name: '服飾店', emoji: '👕' },
                electronics: { name: '3C用品店', emoji: '📱' },
                bookstore: { name: '書局', emoji: '📚' },
                toystore: { name: '玩具店', emoji: '🧸' },
                stationery: { name: '文具店', emoji: '✏️' },
                cosmetics: { name: '美妝店', emoji: '💄' },
                sports: { name: '運動用品店', emoji: '⚽' },
                magic: { name: '魔法商店', emoji: '🎪' }
            };

            // 獲取實際金額
            let actualAmount = walletAmount;
            if (walletAmount === 'custom') {
                actualAmount = this.state.settings.customWalletAmount || 100;
            } else if (walletAmount === 'default' || !walletAmount) {
                actualAmount = 99999; // 預設金額：顯示全部商店
            }

            // 如果目前選中的商店不可用，重置選擇
            let availableStores = [];
            for (const [amount, stores] of Object.entries(storesByAmount)) {
                if (amount !== 'custom' && parseInt(amount) <= actualAmount) {
                    availableStores = availableStores.concat(stores);
                }
            }
            availableStores.push('magic');
            availableStores = [...new Set(availableStores)];

            if (settings.storeType && !availableStores.includes(settings.storeType)) {
                this.state.settings.storeType = null;
            }

            // 生成按金額分組的商店按鈕（含分隔線）
            let buttonsHTML = '';
            const amountLevels = [100, 500, 1000, 10000];

            for (let i = 0; i < amountLevels.length; i++) {
                const amount = amountLevels[i];
                const stores = storesByAmount[amount];

                // 檢查這個金額層級是否可用
                if (amount <= actualAmount && stores.length > 0) {
                    // 添加金額標籤分隔線
                    buttonsHTML += `
                        <div style="width: 100%; text-align: center; margin: 15px 0 10px 0;">
                            <span style="display: inline-block; padding: 5px 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 20px; font-size: 0.9em; font-weight: 600; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);">
                                ${amount}元以內
                            </span>
                        </div>
                    `;

                    // 添加該金額層級的商店按鈕
                    stores.forEach(storeKey => {
                        const store = storeInfo[storeKey];
                        const isActive = settings.storeType === storeKey;
                        const buttonClass = `selection-btn ${isActive ? 'active' : ''}`;

                        buttonsHTML += `
                            <button class="${buttonClass}" data-type="store" data-value="${storeKey}">
                                ${store.name}
                            </button>
                        `;
                    });
                }
            }

            // 最後添加魔法商店（獨立分隔）
            buttonsHTML += `
                <div style="width: 100%; text-align: center; margin: 15px 0 10px 0;">
                    <span style="display: inline-block; padding: 5px 15px; background: linear-gradient(135deg, #f093fb, #f5576c); color: white; border-radius: 20px; font-size: 0.9em; font-weight: 600; box-shadow: 0 2px 8px rgba(245, 87, 108, 0.3);">
                        ✨ 特殊商店
                    </span>
                </div>
                <button class="selection-btn ${settings.storeType === 'magic' ? 'active' : ''}" data-type="store" data-value="magic">
                    魔法商店
                </button>
            `;

            return buttonsHTML;
        },

        async handleImageUpload(event) {
            Game.Debug.log('ui', 'handleImageUpload 被調用', event);
            const file = event.target.files[0];
            Game.Debug.log('ui', '選擇的檔案:', file);
            if (!file) {
                Game.Debug.log('ui', '沒有選擇檔案');
                return;
            }

            // 雙重檢查圖片數量限制
            const maxItems = this.getCustomItemLimit();
            if (this.state.gameState.customItems.length >= maxItems) {
                const difficultyText = this.state.settings.difficulty === 'hard' ? '困難模式最多5個' : '簡單、普通模式最多3個';
                alert(`${difficultyText}圖片！請先刪除現有圖片再上傳新圖片。`);
                return;
            }

            // 檢查文件類型
            if (!file.type.startsWith('image/')) {
                alert('請選擇圖片檔案！');
                return;
            }

            // 使用壓縮功能處理圖片（不再需要檢查大小，壓縮後會很小）
            try {
                Game.Debug.log('ui', '開始壓縮圖片...');
                const compressedImage = await compressImage(file, 200, 0.7);
                Game.Debug.log('ui', '圖片壓縮完成，顯示預覽');
                this.showImagePreview(compressedImage);
            } catch (err) {
                Game.Debug.error('圖片壓縮失敗:', err);
                alert('圖片處理失敗，請重試！');
            }
        },
        
        // 顯示圖片預覽視窗
        showImagePreview(imageDataUrl) {
            Game.Debug.log('ui', 'showImagePreview 被調用');
            const modal = document.getElementById('image-preview-modal');
            const previewImg = document.getElementById('preview-image');

            Game.Debug.log('ui', '模態視窗元素:', modal);
            Game.Debug.log('ui', '預覽圖片元素:', previewImg);

            if (!modal) {
                Game.Debug.error('找不到預覽模態視窗元素');
                return;
            }

            if (!previewImg) {
                Game.Debug.error('找不到預覽圖片元素');
                return;
            }

            previewImg.src = imageDataUrl;
            modal.classList.add('show');
            Game.Debug.log('ui', '模態視窗已顯示');

            // 儲存圖片資料供後續使用
            this.tempImageData = imageDataUrl;

            // 清空輸入框
            document.getElementById('modal-custom-name').value = '';
            document.getElementById('modal-custom-price').value = '';

            // 聚焦到名稱輸入框
            this.TimerManager.setTimeout(() => {
                document.getElementById('modal-custom-name').focus();
            }, 100, 'uiAnimation');
        },
        
        // 關閉圖片預覽視窗
        closeImagePreview() {
            Game.Debug.log('ui', '嘗試關閉圖片預覽視窗');
            const modal = document.getElementById('image-preview-modal');
            if (modal) {
                modal.classList.remove('show');
                Game.Debug.log('ui', '圖片預覽視窗已關閉');
            } else {
                Game.Debug.error('找不到圖片預覽視窗元素');
            }
            
            // 清除文件選擇
            document.getElementById('custom-image').value = '';
            this.tempImageData = null;
        },
        
        // 確認新增自訂商品
        confirmAddCustomItem() {
            const name = document.getElementById('modal-custom-name').value.trim();
            const price = parseInt(document.getElementById('modal-custom-price').value);

            if (!name || !price || price <= 0) {
                alert('請填寫完整的商品資訊！');
                return;
            }

            // 取得實際錢包金額
            let actualWalletAmount = this.state.settings.walletAmount;
            if (this.state.settings.walletAmount === 'custom') {
                actualWalletAmount = this.state.settings.customWalletAmount;
            }

            if (!actualWalletAmount) {
                alert('請先設定錢包金額。');
                return;
            }

            if (price > actualWalletAmount) {
                alert(`商品價格不能超過錢包金額上限（${actualWalletAmount}元）！`);
                return;
            }

            if (!this.tempImageData) {
                alert('圖片資料遺失，請重新上傳！');
                return;
            }

            const customItem = {
                id: Date.now(), // 使用時間戳作為唯一ID
                name: name,
                price: price,
                category: 'custom',
                emoji: '🎁',
                description: `${name}`,
                imageUrl: this.tempImageData
            };

            this.state.gameState.customItems.push(customItem);

            // 關閉預覽視窗
            this.closeImagePreview();

            // 更新魔法商店設定區域以反映新的圖片數量限制
            this.updateMagicStoreSettings();

            // 更新開始按鈕狀態
            this.updateStartButton();

            // 語音提示
            this.speech.speak(`已新增${name}，價格${this.convertToTraditionalCurrency(price)}`);
        },
        
        // 新增自訂商品
        addCustomItem() {
            const imageFile = document.getElementById('custom-image').files[0];
            const name = document.getElementById('custom-name').value.trim();
            const price = parseInt(document.getElementById('custom-price').value);

            if (!imageFile || !name || !price || price <= 0) {
                alert('請填寫完整的商品資訊並選擇圖片！');
                return;
            }

            // 取得實際錢包金額
            let actualWalletAmount = this.state.settings.walletAmount;
            if (this.state.settings.walletAmount === 'custom') {
                actualWalletAmount = this.state.settings.customWalletAmount;
            }

            if (!actualWalletAmount) {
                alert('請先設定錢包金額。');
                return;
            }

            if (price > actualWalletAmount) {
                alert(`商品價格不能超過錢包金額上限（${actualWalletAmount}元）！`);
                return;
            }
            
            // 讀取圖片並轉為 base64
            const reader = new FileReader();
            reader.onload = (e) => {
                const customItem = {
                    id: Date.now(), // 使用時間戳作為唯一ID
                    name: name,
                    price: price,
                    category: 'custom',
                    emoji: '🎁',
                    description: `${name}`,
                    imageUrl: e.target.result
                };
                
                this.state.gameState.customItems.push(customItem);
                
                // 清空輸入框
                document.getElementById('custom-name').value = '';
                document.getElementById('custom-price').value = '';
                document.getElementById('custom-image').value = '';
                
                // 重新渲染設定頁面
                this.showSettings();
                
                // 更新開始按鈕狀態
                this.updateStartButton();
                
                this.speech.speak(`已新增${name}，價格${this.convertToTraditionalCurrency(price)}`);
            };
            reader.readAsDataURL(imageFile);
        },
        
        // 移除自訂商品
        removeCustomItem(index) {
            const item = this.state.gameState.customItems[index];
            this.state.gameState.customItems.splice(index, 1);

            // 更新魔法商店設定區域以反映新的圖片數量限制
            this.updateMagicStoreSettings();

            // 更新開始按鈕狀態
            this.updateStartButton();

            this.speech.speak(`已刪除商品：${item.name}`);
        },

        // 🆕 自訂錢包的幣值數量狀態
        customWalletQuantities: {
            1: 0,
            5: 0,
            10: 0,
            50: 0,
            100: 0,
            500: 0,
            1000: 0
        },

        // 🆕 計算自訂錢包總金額
        calculateCustomWalletTotal() {
            let total = 0;
            for (const [denomination, quantity] of Object.entries(this.customWalletQuantities)) {
                total += parseInt(denomination) * quantity;
            }
            return total;
        },

        // 🆕 調整自訂錢包幣值數量
        adjustCustomWalletQuantity(denomination, change) {
            const currentQty = this.customWalletQuantities[denomination] || 0;
            let newQty = Math.max(0, Math.min(10, currentQty + change)); // 🔧 限制0-10個

            // 🔧 [新增] 檢查總額是否超過 10000 元
            const tempQuantities = { ...this.customWalletQuantities };
            tempQuantities[denomination] = newQty;
            let tempTotal = 0;
            for (const [denom, qty] of Object.entries(tempQuantities)) {
                tempTotal += parseInt(denom) * qty;
            }

            // 如果總額超過 10000 元，則不允許增加
            if (tempTotal > 10000) {
                // 計算當前面額最多可以增加多少個
                const currentTotal = this.calculateCustomWalletTotal();
                const maxAllowedValue = 10000 - currentTotal + (currentQty * parseInt(denomination));
                const maxAllowedQty = Math.floor(maxAllowedValue / parseInt(denomination));
                newQty = Math.max(0, Math.min(10, maxAllowedQty));

                // 如果還是超過，則恢復原值
                tempQuantities[denomination] = newQty;
                tempTotal = 0;
                for (const [denom, qty] of Object.entries(tempQuantities)) {
                    tempTotal += parseInt(denom) * qty;
                }
                if (tempTotal > 10000) {
                    newQty = currentQty;
                    this.speech.speak('總金額不能超過10000元', { interrupt: true });
                }
            }

            this.customWalletQuantities[denomination] = newQty;

            // 更新顯示
            const qtyElement = document.getElementById(`custom-wallet-qty-${denomination}`);
            if (qtyElement) {
                qtyElement.textContent = newQty;
            }

            // 更新總金額
            const totalElement = document.getElementById('custom-wallet-total');
            if (totalElement) {
                const total = this.calculateCustomWalletTotal();
                totalElement.textContent = `NT$ ${total}`;

                // 🔧 [新增] 如果接近或達到上限，顯示警告顏色
                if (total >= 10000) {
                    totalElement.style.color = '#dc2626';
                    totalElement.style.fontWeight = 'bold';
                } else if (total >= 9000) {
                    totalElement.style.color = '#f59e0b';
                } else {
                    totalElement.style.color = '#059669';
                }
            }

            // 播放音效
            this.playMenuSelectSound();
        },

        // 顯示自訂錢包金額模態視窗
        showCustomWalletModal() {
            // 初始化數量（如果之前有設定過，則使用之前的設定）
            if (this.state.settings.customWalletDetails) {
                this.customWalletQuantities = { ...this.state.settings.customWalletDetails };
            } else {
                this.customWalletQuantities = { 1: 0, 5: 0, 10: 0, 50: 0, 100: 0, 500: 0, 1000: 0 };
            }

            const denominations = [1000, 500, 100, 50, 10, 5, 1];

            let moneyItemsHTML = denominations.map(value => {
                const randomFace = Math.random() < 0.5 ? 'front' : 'back';
                const moneyData = this.storeData.moneyItems.find(m => m.value === value);
                const imagePath = moneyData.images[randomFace];
                const quantity = this.customWalletQuantities[value] || 0;
                const isBanknote = value >= 100;

                return `
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 10px 15px;
                        background: #f8f9fa;
                        border-radius: 10px;
                        margin: 8px 0;
                    ">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${imagePath}" alt="${value}元" style="
                                width: ${isBanknote ? '80px' : '50px'};
                                height: auto;
                                object-fit: contain;
                            ">
                            <span style="font-size: 18px; font-weight: bold; color: #333;">${value}元</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button onclick="Game.adjustCustomWalletQuantity(${value}, -1)"
                                    style="
                                        width: 36px;
                                        height: 36px;
                                        border: none;
                                        background: #e74c3c;
                                        color: white;
                                        font-size: 20px;
                                        font-weight: bold;
                                        border-radius: 50%;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                    ">−</button>
                            <span id="custom-wallet-qty-${value}" style="
                                font-size: 20px;
                                font-weight: bold;
                                min-width: 40px;
                                text-align: center;
                                color: #2c3e50;
                            ">${quantity}</span>
                            <button onclick="Game.adjustCustomWalletQuantity(${value}, 1)"
                                    style="
                                        width: 36px;
                                        height: 36px;
                                        border: none;
                                        background: #27ae60;
                                        color: white;
                                        font-size: 20px;
                                        font-weight: bold;
                                        border-radius: 50%;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                    ">+</button>
                        </div>
                    </div>
                `;
            }).join('');

            const totalAmount = this.calculateCustomWalletTotal();

            const modalHTML = `
                <div id="custom-wallet-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                ">
                    <div style="
                        background: white;
                        padding: 25px;
                        border-radius: 20px;
                        box-shadow: 0 15px 40px rgba(0,0,0,0.3);
                        max-width: 450px;
                        width: 90%;
                        max-height: 85vh;
                        overflow-y: auto;
                    ">
                        <h3 style="
                            text-align: center;
                            color: #2c3e50;
                            margin-bottom: 20px;
                            font-size: 24px;
                        "><img src="../images/common/icons_wallet.png" alt="💰" style="width:1em;height:1em;vertical-align:middle;margin-right:2px;" onerror="this.outerHTML='💰'"> 自訂錢包內容</h3>

                        <div style="margin-bottom: 15px;">
                            ${moneyItemsHTML}
                        </div>

                        <div style="
                            background: linear-gradient(135deg, #667eea, #764ba2);
                            color: white;
                            padding: 15px;
                            border-radius: 12px;
                            text-align: center;
                            margin: 15px 0;
                        ">
                            <span style="font-size: 16px;">總金額：</span>
                            <span id="custom-wallet-total" style="font-size: 28px; font-weight: bold;">NT$ ${totalAmount}</span>
                        </div>

                        <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px;">
                            <button onclick="Game.closeCustomWalletModal()"
                                    style="
                                        background: #95a5a6;
                                        color: white;
                                        border: none;
                                        padding: 12px 35px;
                                        border-radius: 25px;
                                        font-size: 18px;
                                        font-weight: bold;
                                        cursor: pointer;
                                    ">✕ 取消</button>
                            <button onclick="Game.confirmCustomWallet()"
                                    style="
                                        background: linear-gradient(135deg, #27ae60, #2ecc71);
                                        color: white;
                                        border: none;
                                        padding: 12px 35px;
                                        border-radius: 25px;
                                        font-size: 18px;
                                        font-weight: bold;
                                        cursor: pointer;
                                        box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
                                    ">✓ 確定</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
        },
        
        // 確認自訂錢包設定
        confirmCustomWallet() {
            const totalAmount = this.calculateCustomWalletTotal();

            if (totalAmount === 0) {
                alert('請至少設定一個錢幣！');
                return;
            }

            if (totalAmount < 100) {
                alert('錢包金額不能少於100元');
                return;
            }

            if (totalAmount > 10000) {
                alert('錢包金額不能超過10000元');
                return;
            }

            // 儲存詳細的幣值數量
            this.state.settings.customWalletDetails = { ...this.customWalletQuantities };
            this.state.settings.customWalletAmount = totalAmount;
            this.state.settings.walletAmount = 'custom';

            Game.Debug.log('coin', '[A4-Train] 自訂錢包:', this.customWalletQuantities, '總金額:', totalAmount);
            this.closeCustomWalletModal();

            // 播放音效
            this.playMenuSelectSound();

            // 🆕 更新購物場所按鈕（根據金額顯示可用商店）
            this.updateStoreButtons();

            // 🆕 更新開始按鈕狀態
            this.updateStartButton();

            // 語音提示
            this.speech.speak(`已設定自訂錢包金額為${this.convertToTraditionalCurrency(totalAmount)}`);
        },
        
        // 預覽檢查是否可以組成目標金額（用於模態視窗驗證）
        canMakeAmountPreview(amount, denominations) {
            // 使用動態規劃檢查是否可能
            const dp = new Array(amount + 1).fill(false);
            dp[0] = true;
            
            for (const denom of denominations) {
                for (let i = denom; i <= amount; i++) {
                    if (dp[i - denom]) {
                        dp[i] = true;
                    }
                }
            }
            Game.Debug.log('payment', 'DP結果：', dp);
            return dp[amount];
        },
        
        // 關閉自訂錢包模態視窗
        closeCustomWalletModal() {
            const modal = document.getElementById('custom-wallet-modal');
            if (modal) {
                modal.remove();
            }
        },
        
        // 返回主畫面
        backToMainMenu() {
            // 返回到單元選擇畫面
            window.location.href = '../index.html#part4';
        },
        
        // 開始遊戲
        startGame() {
            Game.Debug.log('flow', '🎯 [A4-遊戲] 開始測驗，解鎖音頻並播放歡迎語音');

            // 檢查必要設定是否完成
            if (!this.state.settings.difficulty || !this.state.settings.walletAmount ||
                !this.state.settings.taskType || !this.state.settings.storeType ||
                !this.state.settings.questionCount) {
                alert('請完成所有設定選項再開始遊戲！');
                return;
            }

            // 🔧 [修復] 確保音頻已解鎖
            this.unlockAudio();

            // 檢查魔法商店是否有商品
            if (this.state.settings.storeType === 'magic' && this.state.gameState.customItems.length === 0) {
                alert('魔法商店需要至少一個自訂商品才能開始遊戲！');
                return;
            }
            
            // 初始化測驗狀態
            this.state.quiz.currentQuestion = 0;
            this.state.quiz.score = 0;
            this.state.quiz.startTime = Date.now();
            window.LearningTracker?.resetWrong?.();   // 學習紀錄：錯誤/逐題計數歸零
            if (window.TutorContext) {
                TutorContext.reset();
                TutorContext.update({ screen: 'game', phase: 'selectItem', difficulty: this.state.settings.difficulty, totalQuestions: this.state.settings.questionCount, questionIndex: 0 });
                const _a4 = this;
                TutorContext.getLiveData = () => {
                    const gs = _a4.state.gameState;
                    const item = gs.selectedItem || gs.currentTransaction?.targetItem;
                    return {
                        itemName: item?.name  || null,
                        price:    item?.price ?? null,
                        wallet:   _a4.state.settings.walletAmount ?? null,
                    };
                };
            }

            // 🎯 [新增] 重設動態價格系統
            this.storeData.resetAllPrices();
            Game.Debug.log('product', '🎯 [價格系統] 已為', this.state.settings.difficulty, '難度重設價格');

            // 🔧 [新增] 重置遊戲狀態標誌
            this.state.isProcessing = false;
            this.state.gameState.hasUserSelectedProduct = false;
            this.state.gameState.isProcessingProductSelection = false;
            this.state.gameState.selectedItem = null;
            this.state.gameState.currentTransaction.targetItem = null;

            // 🆕 [新增] 重置普通模式錯誤計數
            this.resetNormalModeState();
            this._completionSummaryShown = false;

            // 🔧 [配置驅動] 使用SceneManager切換到歡迎場景
            // 歡迎序列流程會在 welcome 場景的 onEnter 中自動啟動
            this.SceneManager.switchScene('welcome', this);
        },

        /**
         * 🆕 重置普通模式錯誤計數和提示狀態
         */
        resetNormalModeState() {
            this.state.gameState.stepErrorCounts = {
                productSelection: 0,
                payment: 0,
                changeCalculation: 0
            };
            this.state.gameState.stepHintsShown = {
                productSelection: false,
                payment: false,
                changeCalculation: false
            };
            Game.Debug.log('flow', '🔄 [普通模式] 錯誤計數已重置');
        },

         /**
         * 🆕 顯示商品選擇提示（第3次錯誤後）
         * @param {Object} targetItem - 目標商品
         */
        showProductSelectionHint(targetItem) {
            // 任務說明彈窗仍開啟時不顯示提示（商品被遮住）
            if (document.getElementById('target-item-modal')) return;
            Game.Debug.log('hint', `💡 [提示] 顯示商品選擇提示: ${targetItem.name}`);

            // 清除舊的提示
            document.querySelectorAll('.step-hint').forEach(el => {
                el.classList.remove('step-hint');
            });

            // 高亮正確的商品
            const productElement = document.querySelector(`[data-item-id="${targetItem.id}"]`);
            if (productElement) {
                productElement.classList.add('step-hint');
                this.speech.speak(`請選擇這個商品`, { interrupt: true });

                // 5秒後自動移除提示效果
                this.TimerManager.setTimeout(() => {
                    productElement.classList.remove('step-hint');
                }, 5000, 'uiAnimation');
            }
        },

        /**
         * 🆕 清除步驟提示
         */
        clearStepHints() {
            document.querySelectorAll('.step-hint').forEach(el => {
                el.classList.remove('step-hint');
            });
        },

        // 初始化錢包
        initializeWallet() {
            let walletMaxAmount = this.state.settings.walletAmount;
            const difficulty = this.state.settings.difficulty;
            const taskType = this.state.settings.taskType;
            this.state.gameState.playerWallet = [];
            this.state.gameState.walletTotal = 0;

            // 處理自訂錢包設定
            if (walletMaxAmount === 'custom') {
                this.initializeCustomWallet();
                return;
            }

            // 獲取當前商店的商品來計算合適的錢包金額
            const storeProducts = this.getCurrentStoreProducts();

            // 各商店錢包上限（元）
            const STORE_WALLET_CAPS = {
                convenience: 300, market: 300, breakfast: 300, stationery: 300,
                pxmart: 500, mcdonalds: 500, bookstore: 500, toystore: 500, cosmetics: 500,
                clothing: 3000, sports: 3000,
                electronics: 10000
            };
            // 預設金額：依商店最高商品價格自動計算上限（1.5～2.5 倍，整十元），依商店類型設上限
            if (walletMaxAmount === 'default' || !walletMaxAmount) {
                const prices = storeProducts.map(p => p.price);
                const maxPrice = Math.max(...prices);
                const multiplier = 1.5 + Math.random(); // 1.5～2.5 倍
                const storeType = this.state.settings.storeType || 'convenience';
                const walletCap = STORE_WALLET_CAPS[storeType] || 10000;
                walletMaxAmount = Math.min(Math.ceil(maxPrice * multiplier / 10) * 10, walletCap);
            }
            let actualWalletAmount;

            if (taskType === 'assigned') {
                // 指定商品模式：錢包金額要高於指定商品但低於上限
                const affordableItems = storeProducts.filter(item => item.price < walletMaxAmount);
                if (affordableItems.length > 0) {
                    const maxItemPrice = Math.max(...affordableItems.map(item => item.price));
                    // 隨機金額在最高商品價格+10元到上限之間
                    const minAmount = Math.min(maxItemPrice + 10, walletMaxAmount);
                    actualWalletAmount = Math.floor(Math.random() * (walletMaxAmount - minAmount + 1)) + minAmount;
                } else {
                    actualWalletAmount = walletMaxAmount;
                }
            } else {
                // 自選模式：確保能買到足夠數量的商品
                // 困難模式需要至少5種，普通模式需要至少3種，簡單模式需要至少3種
                const affordableItems = storeProducts.filter(item => item.price <= walletMaxAmount);
                if (affordableItems.length > 0) {
                    // 根據難度決定需要的商品數量
                    const requiredItemCount = difficulty === 'hard' ? 5 : (difficulty === 'normal' ? 3 : 3);

                    // 將商品按價格排序（從低到高）
                    const sortedItems = [...affordableItems].sort((a, b) => a.price - b.price);

                    // 取第N便宜的商品價格作為最小錢包金額
                    const targetIndex = Math.min(requiredItemCount - 1, sortedItems.length - 1);
                    const minWalletAmount = sortedItems[targetIndex].price;

                    // 隨機金額在第N便宜商品價格到上限之間
                    actualWalletAmount = Math.floor(Math.random() * (walletMaxAmount - minWalletAmount + 1)) + minWalletAmount;

                    Game.Debug.log('coin', `🎯 [錢包生成] 難度:${difficulty}, 需要${requiredItemCount}種商品, 第${targetIndex + 1}便宜商品價格:${minWalletAmount}元, 生成錢包:${actualWalletAmount}元`);
                } else {
                    actualWalletAmount = walletMaxAmount;
                }
            }
            
            // 根據難度和實際錢包金額生成錢幣組合
            let remainingAmount = actualWalletAmount;
            const availableMoney = [...this.storeData.moneyItems].reverse(); // 從大面額開始
            
            // 確保有足夠的小面額錢幣用於找錢
            if (difficulty === 'easy') {
                Game.Debug.log('coin', '簡單模式錢包生成 - 目標金額:', actualWalletAmount);
                // 簡單模式：主要使用小面額，方便計算
                while (remainingAmount > 0) {
                    for (const money of availableMoney.reverse()) { // 從小面額開始
                        if (money.value <= remainingAmount) {
                            this.addMoneyToWallet(money.value, 1);
                            remainingAmount -= money.value;
                            break;
                        }
                    }
                }
            } else if (difficulty === 'normal') {
                // 普通模式：混合面額
                while (remainingAmount > 0) {
                    for (const money of availableMoney) {
                        if (money.value <= remainingAmount) {
                            this.addMoneyToWallet(money.value, 1);
                            remainingAmount -= money.value;
                            break;
                        }
                    }
                }
            } else {
                // 困難模式：更多大面額，需要找錢
                while (remainingAmount > 0) {
                    for (const money of availableMoney) {
                        if (money.value <= remainingAmount) {
                            const count = Math.floor(remainingAmount / money.value);
                            if (count > 0) {
                                this.addMoneyToWallet(money.value, Math.min(count, 3));
                                remainingAmount -= money.value * Math.min(count, 3);
                            }
                            break;
                        }
                    }
                }
            }
            
            Game.Debug.log('coin', '錢包初始化完成:', this.state.gameState.playerWallet);
            Game.Debug.log('coin', '錢包總額:', this.state.gameState.walletTotal);
        },
        
        // 添加錢幣到錢包
        addMoneyToWallet(value, count) {
            const moneyData = this.storeData.moneyItems.find(m => m.value === value);
            if (moneyData && count > 0) {
                for (let i = 0; i < count; i++) {
                    // 隨機決定錢幣顯示正面或反面
                    const showFront = Math.random() < 0.5;
                    const currentFace = showFront ? 'front' : 'back';
                    const displayImage = moneyData.images[currentFace];
                    
                    this.state.gameState.playerWallet.push({
                        ...moneyData,
                        id: `money_${value}_${Date.now()}_${i}_${Math.floor(Math.random() * 1e9)}`,
                        currentFace: currentFace,
                        displayImage: displayImage
                    });
                    this.state.gameState.walletTotal += value;
                }
            }
        },
        
        // 初始化自訂錢包
        initializeCustomWallet() {
            const customAmount = this.state.settings.customWalletAmount || 100;

            // 🆕 如果有自訂錢包詳細資料，使用指定的幣值數量
            if (this.state.settings.customWalletDetails) {
                const denominations = [1000, 500, 100, 50, 10, 5, 1];
                for (const denom of denominations) {
                    const quantity = this.state.settings.customWalletDetails[denom] || 0;
                    if (quantity > 0) {
                        this.addMoneyToWallet(denom, quantity);
                    }
                }

                Game.Debug.log('coin', '自訂錢包初始化完成（使用詳細設定）:', this.state.gameState.playerWallet);
                Game.Debug.log('coin', '自訂錢包總額:', this.state.gameState.walletTotal);
                Game.Debug.log('coin', '錢幣分布:', this.state.settings.customWalletDetails);
                return;
            }

            // 🔧 舊版相容性：使用 customWalletTypes（如果沒有 customWalletDetails）
            const customTypes = this.state.settings.customWalletTypes || [1, 5, 10, 50, 100];

            // 檢查是否有不合理的選擇（所有選擇的面額都大於目標金額）
            const minSelectedValue = Math.min(...customTypes);
            if (minSelectedValue > customAmount) {
                alert(`選擇錯誤：最小面額${minSelectedValue}元大於目標金額${customAmount}元，請重新選擇幣值。`);
                return;
            }

            // 檢查是否可能組成目標金額（使用最小面額是否能整除或組合）
            const sortedTypes = customTypes.sort((a, b) => a - b);
            if (!this.canMakeAmount(customAmount, sortedTypes)) {
                alert(`選擇錯誤：無法使用選定的幣值組合成${customAmount}元，請重新選擇幣值。`);
                return;
            }

            // 使用貪心算法分配錢幣，確保所有選擇的面額都盡可能出現
            const coinDistribution = this.calculateOptimalDistribution(customAmount, customTypes);

            // 生成錢包
            for (const [value, count] of Object.entries(coinDistribution)) {
                if (count > 0) {
                    this.addMoneyToWallet(parseInt(value), count);
                }
            }

            Game.Debug.log('coin', '自訂錢包初始化完成:', this.state.gameState.playerWallet);
            Game.Debug.log('coin', '自訂錢包總額:', this.state.gameState.walletTotal);
            Game.Debug.log('coin', '錢幣分布:', coinDistribution);
        },
        
        // 檢查是否可以用給定面額組成目標金額
        canMakeAmount(amount, denominations) {
            // 使用動態規劃檢查是否可能
            const dp = new Array(amount + 1).fill(false);
            dp[0] = true;
            
            for (const denom of denominations) {
                for (let i = denom; i <= amount; i++) {
                    if (dp[i - denom]) {
                        dp[i] = true;
                    }
                }
            }
            
            return dp[amount];
        },
        
        // 計算最優分配方案，盡量讓每種面額都出現
        calculateOptimalDistribution(amount, denominations) {
            const distribution = {};
            const sortedDenoms = [...denominations].sort((a, b) => b - a); // 從大到小
            
            // 初始化分布
            for (const denom of denominations) {
                distribution[denom] = 0;
            }
            
            let remainingAmount = amount;
            
            // 首先確保每種面額至少出現一次（如果可能）
            for (const denom of sortedDenoms) {
                if (remainingAmount >= denom) {
                    // 檢查如果使用這個面額，剩餘金額是否還能被其他面額組成
                    const tempRemaining = remainingAmount - denom;
                    const otherDenoms = sortedDenoms.filter(d => d !== denom);
                    
                    if (tempRemaining === 0 || this.canMakeAmount(tempRemaining, denominations)) {
                        distribution[denom] = 1;
                        remainingAmount -= denom;
                    }
                }
            }
            
            // 然後使用貪心算法分配剩餘金額
            while (remainingAmount > 0) {
                let allocated = false;
                for (const denom of sortedDenoms) {
                    if (denom <= remainingAmount) {
                        distribution[denom]++;
                        remainingAmount -= denom;
                        allocated = true;
                        break;
                    }
                }
                
                if (!allocated) {
                    Game.Debug.warn('coin', `剩餘金額 ${remainingAmount} 無法分配`);
                    break;
                }
            }
            
            return distribution;
        },

        // 🔧 [新增] 開始歡迎序列流程
        startWelcomeSequence() {
            Game.Debug.log('flow', '🎯 [A4-歡迎] 開始歡迎序列流程');

            // 🔧 [修正] 先生成指定商品（如果是指定任務）
            this.generateTargetItemForWelcome();

            // 第一步：顯示購物場所歡迎畫面
            this.showWelcomeStoreScreen();
        },

        // 🔧 [新增] 為歡迎流程生成指定商品
        generateTargetItemForWelcome() {
            const settings = this.state.settings;

            if (settings.taskType === 'assigned') {
                // 獲取當前商店的商品
                const storeProducts = this.getCurrentStoreProducts();

                // 指定商品任務
                let affordableItems = storeProducts.filter(item => item.price <= this.state.gameState.walletTotal);
                Game.Debug.log('product', '🎯 [A4-商品] 錢包總額:', this.state.gameState.walletTotal);
                Game.Debug.log('product', '🎯 [A4-商品] 可負擔商品:', affordableItems.map(item => `${item.name}(${item.price}元)`));
                if (affordableItems.length === 0) {
                    alert('錢包金額不足以購買任何商品，請調整設定！');
                    this.showSettings();
                    return;
                }

                // 排除上一題的商品（如果有足夠的商品可選擇）
                if (this.state.gameState.previousTargetItemId && affordableItems.length > 1) {
                    affordableItems = affordableItems.filter(item => item.id !== this.state.gameState.previousTargetItemId);
                }

                // 🔧 [新增] 排除近期歷史中的重複商品
                const storeType = this.state.settings.storeType;
                const difficulty = this.state.settings.difficulty;
                let filteredItems = this.filterDuplicateItems(affordableItems, storeType, difficulty);

                // 如果過濾後沒有可用商品，使用原始列表（保證總是有商品可選）
                if (filteredItems.length === 0) {
                    Game.Debug.log('state', '🎯 [A4-歷史] 過濾後無可用商品，使用原始列表');
                    filteredItems = affordableItems;
                }

                Game.Debug.log('product', '🎯 [A4-商品] 過濾後可選商品:', filteredItems.map(item => `${item.name}(${item.price}元)`));
                const randomIndex = Math.floor(Math.random() * filteredItems.length);
                const targetItem = filteredItems[randomIndex];
                Game.Debug.log('product', '🎯 [A4-商品] 隨機選擇索引:', randomIndex, '/', filteredItems.length);

                // 🔧 [新增] 將選中的商品添加到歷史記錄
                this.addToQuestionHistory(targetItem, storeType, difficulty);

                // 🔧 [重要] 將商品設置到遊戲狀態中，供歡迎流程和購物場景使用
                this.state.gameState.selectedItem = targetItem;
                this.state.gameState.currentTransaction.targetItem = targetItem;

                Game.Debug.log('flow', '🎯 [A4-歡迎] 生成指定商品:', targetItem.name, targetItem.price);
            }
        },

        // 🔧 [新增] 題目歷史管理函數
        addToQuestionHistory(item, storeType, difficulty) {
            const historyEntry = {
                itemId: item.id,
                itemName: item.name,
                itemPrice: item.price,
                storeType: storeType,
                difficulty: difficulty,
                timestamp: Date.now()
            };
            this.state.gameState.questionHistory.push(historyEntry);

            // 限制歷史記錄數量（最多保留20題）
            if (this.state.gameState.questionHistory.length > 20) {
                this.state.gameState.questionHistory.shift();
            }

            Game.Debug.log('state', '🎯 [A4-歷史] 已添加題目到歷史:', historyEntry);
            Game.Debug.log('state', '🎯 [A4-歷史] 當前歷史記錄總數:', this.state.gameState.questionHistory.length);
        },

        // 🔧 [新增] 檢查商品是否在近期歷史中重複
        isItemInRecentHistory(item, storeType, difficulty, lookBackCount = 3) {
            const recentHistory = this.state.gameState.questionHistory.slice(-lookBackCount);
            const isRepeated = recentHistory.some(entry =>
                entry.itemId === item.id &&
                entry.storeType === storeType &&
                entry.difficulty === difficulty
            );

            if (isRepeated) {
                Game.Debug.log('state', '🎯 [A4-歷史] 發現重複商品:', item.name, item.price, '在', storeType, difficulty);
            }

            return isRepeated;
        },

        // 🔧 [新增] 過濾掉重複的商品
        filterDuplicateItems(items, storeType, difficulty) {
            // 🔧 [改善] 根據可用商品數量動態調整歷史檢查範圍
            // 如果商品數量較少，減少歷史檢查範圍，避免過度過濾
            const totalItems = items.length;
            let lookBackCount;

            if (totalItems <= 3) {
                lookBackCount = 1; // 商品很少時，只避免連續重複
            } else if (totalItems <= 6) {
                lookBackCount = 2; // 中等數量商品，避免近期重複
            } else {
                lookBackCount = 3; // 商品充足時，使用標準範圍
            }

            const filtered = items.filter(item => !this.isItemInRecentHistory(item, storeType, difficulty, lookBackCount));

            Game.Debug.log('product', `🎯 [A4-歷史] 商品過濾：總數${totalItems}，歷史檢查${lookBackCount}題，過濾後${filtered.length}`);

            return filtered;
        },

        // 🔧 [新增] 第一步：顯示購物場所歡迎畫面
        showWelcomeStoreScreen() {
            const app = document.getElementById('app');
            const settings = this.state.settings;

            // 確定商店名稱 - 使用現有的 getCurrentStoreInfo 確保一致性
            const storeName = this.getCurrentStoreInfo().name;

            // 創建歡迎畫面
            app.innerHTML = `
                <div class="welcome-screen">
                    <div class="welcome-content">
                        <div class="store-welcome">
                            <h1 class="store-title">
                                <span class="store-emoji">${this.getCurrentStoreInfo().emoji}</span>
                            </h1>
                            <div class="welcome-message">
                                <h2>歡迎來到${storeName}！</h2>
                                <div class="store-description">
                                    <p>準備開始您的購物體驗</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    .welcome-screen {
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        text-align: center;
                    }

                    .welcome-content {
                        max-width: 600px;
                        padding: 2rem;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    }

                    .store-title {
                        margin-bottom: 1rem;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                        line-height: 1 !important;
                    }

                    .store-title .store-emoji {
                        font-size: 8rem !important;
                        display: inline-block;
                    }

                    .welcome-message h2 {
                        font-size: 2rem;
                        margin-bottom: 1rem;
                        color: #fff;
                    }

                    .store-description p {
                        font-size: 1.2rem;
                        opacity: 0.9;
                    }
                </style>
            `;

            // 播放歡迎語音
            const speechText = `歡迎來到${storeName}`;
            Game.Debug.log('speech', '🎙️ [A4-歡迎] 播放商店歡迎語音:', speechText);

            this.speech.speak(speechText, {
                callback: () => {
                    Game.Debug.log('speech', '🎙️ [A4-歡迎] 商店歡迎語音完成，進入錢包介紹');
                    // 縮短延遲：從2秒改為500毫秒
                    Game.TimerManager.setTimeout(() => {
                        Game.showWalletIntroScreen();
                    }, 500, 'screenTransition');
                }
            });
        },

        // 🔧 [新增] 第二步：顯示錢包介紹畫面
        showWalletIntroScreen() {
            const app = document.getElementById('app');
            const walletTotal = this.state.gameState.walletTotal;

            // 創建錢包介紹畫面
            app.innerHTML = `
                <div class="wallet-intro-screen">
                    <div class="wallet-intro-content">
                        <div class="wallet-display">
                            <h1 class="wallet-title"><img src="../images/common/icons_wallet.png" alt="💰" style="width:1.5em;height:1.5em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='💰'"> 您的錢包</h1>
                            <div class="wallet-amount">
                                <h2>總金額：${walletTotal} 元</h2>
                            </div>
                            <div class="wallet-coins">
                                ${this.renderWalletCoinsDisplay()}
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    .wallet-intro-screen {
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                        color: white;
                        text-align: center;
                    }

                    .wallet-intro-content {
                        max-width: 700px;
                        padding: 2rem;
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    }

                    .wallet-title {
                        font-size: 3rem;
                        margin-bottom: 1rem;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                    }

                    .wallet-amount h2 {
                        font-size: 2.5rem;
                        margin-bottom: 2rem;
                        color: #fff;
                        background: rgba(255, 255, 255, 0.2);
                        padding: 1rem;
                        border-radius: 15px;
                    }

                    .wallet-coins {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 20px;
                        margin-top: 2rem;
                        padding: 1rem;
                    }

                    .intro-money-group {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        background: rgba(255, 255, 255, 0.9);
                        border-radius: 15px;
                        padding: 15px;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                        animation: moneyFloat 2s ease-in-out infinite alternate;
                        transition: all 0.3s ease;
                        min-width: 100px;
                    }

                    .intro-money-group:hover {
                        transform: scale(1.05);
                        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
                    }

                    .intro-money-image {
                        width: 70px;
                        height: 70px;
                        object-fit: contain;
                        margin-bottom: 10px;
                        border-radius: 8px;
                    }

                    .intro-money-info {
                        text-align: center;
                        color: #333;
                    }

                    .intro-money-name {
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 5px;
                        color: #2c3e50;
                    }

                    .intro-money-count {
                        font-size: 16px;
                        font-weight: bold;
                        color: #e74c3c;
                        background: rgba(231, 76, 60, 0.1);
                        padding: 3px 8px;
                        border-radius: 12px;
                    }

                    /* @keyframes moneyFloat 已移至 injectGlobalAnimationStyles() */
                </style>
            `;

            // 播放錢包語音
            const speechText = `你的錢包總共有${walletTotal}元`;
            Game.Debug.log('speech', '🎙️ [A4-歡迎] 播放錢包介紹語音:', speechText);

            this.speech.speak(speechText, {
                callback: () => {
                    Game.Debug.log('speech', '🎙️ [A4-歡迎] 錢包介紹語音完成');
                    // 縮短延遲：從2秒改為500毫秒
                    Game.TimerManager.setTimeout(() => {
                        // 🔧 [修改] 無論是指定商品還是自選商品，都直接進入購物場景
                        // 指定商品的彈跳視窗會在購物場景載入後顯示
                        Game.proceedToShopping();
                    }, 500, 'screenTransition');
                }
            });
        },

        // 🔧 [新增] 第三步：顯示指定商品畫面（僅限指定任務）
        showTargetItemScreen() {
            // 🔧 [修正] 使用已經生成的指定商品
            const targetItem = this.state.gameState.selectedItem;

            if (!targetItem) {
                Game.Debug.error('❌ [A4-歡迎] 找不到已生成的指定商品');
                alert('系統錯誤：找不到指定商品');
                this.showSettings();
                return;
            }

            const app = document.getElementById('app');

            // 創建指定商品畫面
            app.innerHTML = `
                <div class="target-item-screen">
                    <div class="target-item-content">
                        <div class="task-display">
                            <h1 class="task-title">🎯 購買任務</h1>
                            <div class="target-item">
                                <div class="item-image">
                                    ${this.getProductIconHTML(targetItem, '120px')}
                                </div>
                                <div class="item-info">
                                    <h2 class="item-name">${targetItem.description || targetItem.name}</h2>
                                    <h3 class="item-price">${targetItem.price} 元</h3>
                                </div>
                            </div>
                            <div class="task-instruction">
                                <p>請購買 ${this.parseProductDisplay(targetItem, 1).displayText}</p>
                                <p>價格：${targetItem.price} 元</p>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    .target-item-screen {
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
                        color: white;
                        text-align: center;
                    }

                    .target-item-content {
                        max-width: 600px;
                        padding: 2rem;
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    }

                    .task-title {
                        font-size: 3rem;
                        margin-bottom: 2rem;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                    }

                    .target-item {
                        background: rgba(255, 255, 255, 0.9);
                        color: #333;
                        border-radius: 15px;
                        padding: 2rem;
                        margin: 2rem 0;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    }

                    .item-image {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 1rem;
                    }

                    .item-image img {
                        width: 120px;
                        height: 120px;
                        object-fit: cover;
                        border-radius: 15px;
                    }

                    .item-emoji {
                        font-size: 8rem;
                        line-height: 1;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 120px;
                        height: 120px;
                    }

                    .item-name {
                        font-size: 2rem;
                        margin-bottom: 0.5rem;
                        color: #2c3e50;
                    }

                    .item-price {
                        font-size: 1.8rem;
                        color: #e74c3c;
                        font-weight: bold;
                    }

                    .task-instruction {
                        font-size: 1.5rem;
                        margin-top: 1rem;
                    }

                    .task-instruction p {
                        margin: 0.5rem 0;
                    }
                </style>
            `;

            // 播放指定商品語音
            const productInfo = this.parseProductDisplay(targetItem, 1);
            const speechText = `請購買${productInfo.speechText}，它要${targetItem.price}元`;
            Game.Debug.log('speech', '🎙️ [A4-歡迎] 播放指定商品語音:', speechText);

            this.speech.speak(speechText, {
                callback: () => {
                    Game.Debug.log('speech', '🎙️ [A4-歡迎] 指定商品語音完成，進入購物場景');
                    // 3秒後進入購物場景
                    Game.TimerManager.setTimeout(() => {
                        Game.proceedToShopping();
                    }, 3000, 'screenTransition');
                }
            });
        },

        // 🔧 [新增] 彈跳視窗顯示指定商品（適用所有難度模式）
        showTargetItemModal() {
            const targetItem = this.state.gameState.selectedItem;
            const settings = this.state.settings;

            if (!targetItem) {
                Game.Debug.error('❌ [A4-Modal] 找不到已生成的指定商品');
                return;
            }

            // 創建模態視窗
            const modal = document.createElement('div');
            modal.id = 'target-item-modal';
            modal.className = 'target-item-modal';

            // 根據難度決定顯示內容
            const difficultyClass = `difficulty-${settings.difficulty}`;

            modal.innerHTML = `
                <div class="modal-content ${difficultyClass}" onclick="event.stopPropagation();">
                    <div class="modal-header">
                        <h2>🎯 購買任務</h2>
                        <button class="close-modal-btn" onclick="event.stopPropagation(); event.preventDefault(); Game.closeTargetItemModal();">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="target-item-display">
                            <div class="item-image">
                                ${this.getProductIconHTML(targetItem, '128px')}
                            </div>
                            <div class="item-info">
                                <h3 class="item-name">${targetItem.description || targetItem.name}</h3>
                                <p class="item-price">${targetItem.price} 元</p>
                            </div>
                        </div>
                        <div class="task-instruction">
                            <p>請購買 <strong>${this.parseProductDisplay(targetItem, 1).displayText}</strong></p>
                            <p>價格：<strong>${targetItem.price} 元</strong></p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="start-shopping-btn" onclick="event.stopPropagation(); event.preventDefault(); Game.closeTargetItemModal();">
                            開始購物
                        </button>
                    </div>
                </div>

                <style>
                    .target-item-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(5px);
                        z-index: 10000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        animation: modalFadeIn 0.3s ease-out;
                    }

                    .modal-content {
                        position: relative;
                        background: white;
                        border-radius: 20px;
                        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
                        max-width: 480px;
                        width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                        animation: modalSlideIn 0.3s ease-out;
                    }

                    .modal-content.difficulty-easy {
                        border: 4px solid #4CAF50;
                    }

                    .modal-content.difficulty-normal {
                        border: 4px solid #FF9800;
                    }

                    .modal-content.difficulty-hard {
                        border: 4px solid #F44336;
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 25px 15px;
                        border-bottom: 2px solid #f0f0f0;
                    }

                    .modal-header h2 {
                        margin: 0;
                        color: #333;
                        font-size: 1.5rem;
                    }

                    .close-modal-btn {
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                        padding: 5px;
                        border-radius: 50%;
                        width: 35px;
                        height: 35px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .close-modal-btn:hover {
                        background: #f0f0f0;
                        color: #333;
                    }

                    .modal-body {
                        padding: 25px;
                        text-align: center;
                    }

                    .target-item-display {
                        background: #f8f9fa;
                        border-radius: 15px;
                        padding: 20px;
                        margin-bottom: 20px;
                    }

                    .item-image {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 15px;
                    }

                    .item-emoji {
                        font-size: 4rem;
                        line-height: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 100px;
                        height: 100px;
                    }

                    .item-name {
                        font-size: 1.5rem;
                        color: #333;
                        margin: 10px 0 5px;
                    }

                    .item-price {
                        font-size: 1.3rem;
                        color: #e74c3c;
                        font-weight: bold;
                        margin: 0;
                    }

                    .task-instruction {
                        background: #e3f2fd;
                        border-radius: 10px;
                        padding: 15px;
                        color: #1976d2;
                        font-size: 1.1rem;
                        line-height: 1.5;
                    }

                    .task-instruction p {
                        margin: 5px 0;
                    }

                    .modal-footer {
                        padding: 15px 25px 25px;
                        text-align: center;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    .start-shopping-btn {
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 25px;
                        font-size: 1.1rem;
                        cursor: pointer;
                        transition: background 0.3s ease;
                        min-width: 120px;
                    }

                    .start-shopping-btn:hover {
                        background: #45a049;
                    }

                    /* @keyframes modalFadeIn, modalSlideIn, modalFadeOut 已移至 injectGlobalAnimationStyles() */

                    /* 困難模式特殊樣式 - 移除價格隱藏，所有模式都顯示價格 */

                    .difficulty-hard .task-instruction {
                        background: #ffebee;
                        color: #c62828;
                    }
                </style>
            `;

            // 點擊外層遮罩關閉彈窗
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeTargetItemModal();
                }
            });

            document.body.appendChild(modal);

            // 播放指定商品語音
            const productInfo = this.parseProductDisplay(targetItem, 1);
            const speechText = `請購買${productInfo.speechText}，它要${targetItem.price}元`;

            Game.Debug.log('speech', '🎙️ [A4-Modal] 播放指定商品語音:', speechText);

            this.speech.speak(speechText, {
                callback: () => {
                    Game.Debug.log('speech', '🎙️ [A4-Modal] 指定商品語音完成');
                }
            });
        },

        // 🔧 [新增] 關閉指定商品模態視窗（直接移除，參考 A2 closeTaskPopup）
        closeTargetItemModal() {
            const modal = document.getElementById('target-item-modal');
            if (!modal) {
                Game.Debug.log('ui', '🔍 [A4-Modal] 模態視窗已不存在，忽略關閉請求');
                return;
            }
            modal.remove();
            Game.Debug.log('ui', '✅ [A4-Modal] 模態視窗已移除');
            // 🎯 簡單模式（非輔助點擊）：模態關閉後顯示目標商品提示
            if (this.state.settings.difficulty === 'easy' && !this.state.settings.clickMode) {
                const targetItem = this.state.gameState.selectedItem;
                if (targetItem) {
                    this.TimerManager.setTimeout(() => {
                        const productItems = document.querySelectorAll('.product-item');
                        for (const item of productItems) {
                            if (parseInt(item.dataset.itemId) === targetItem.id) {
                                item.classList.add('step-hint');
                                Game.Debug.log('assist', '[A4-Modal] 已顯示目標商品提示動畫');
                                break;
                            }
                        }
                    }, 200, 'hint');
                }
            }
        },

        // 🔧 [新增] 輔助函數：渲染錢包金錢顯示
        renderWalletCoinsDisplay() {
            const wallet = this.state.gameState.playerWallet;
            const coinGroups = {};

            // 統計各面額數量和保存金錢物件
            wallet.forEach(money => {
                if (!coinGroups[money.value]) {
                    coinGroups[money.value] = {
                        money: money,
                        count: 0
                    };
                }
                coinGroups[money.value].count++;
            });

            // 按面額排序並生成HTML
            return Object.keys(coinGroups)
                .map(value => parseInt(value))
                .sort((a, b) => b - a)
                .map(value => {
                    const group = coinGroups[value];
                    const money = group.money;
                    const count = group.count;
                    const imageSrc = money.displayImage || money.images.front;

                    return `
                        <div class="intro-money-group">
                            <img src="${imageSrc}" alt="${money.name}" class="intro-money-image" />
                            <div class="intro-money-info">
                                <div class="intro-money-name">${money.name}</div>
                                <div class="intro-money-count">×${count}</div>
                            </div>
                        </div>
                    `;
                })
                .join('');
        },

        // 🔧 [新增] 進入購物場景
        proceedToShopping() {
            Game.Debug.log('flow', '🎯 [A4-歡迎] 歡迎流程完成，進入購物場景');
            // 🔧 [配置驅動] 使用SceneManager統一切換場景
            this.SceneManager.switchScene('shopping', this);
        },

        // 顯示購物場景
        showShoppingScene() {
            Game.Debug.log('ui', '🔍 [A4-購物場景-v9.52.56] showShoppingScene被調用');
            console.trace('🔍 [A4-購物場景-v9.52.56] 調用堆棧:');

            // 🔧 [修復] 清除商品價格緩存，每題開始時重新生成價格
            this.state.gameState.cachedStoreProducts = null;
            Game.Debug.log('product', '🎯 [價格系統] 已清除商品價格緩存（新題目開始）');

            // 🔧 [修正] 重置用戶選擇狀態，防止困難模式防重複點選邏輯誤判
            this.state.gameState.hasUserSelectedProduct = false;
            this.state.gameState.isProcessingProductSelection = false;

            // 🔧 [修復] 清空自選商品清單，防止上一題的選擇累積到新題目
            // initializeSelectedItems() 只在陣列不存在時建立，導致跨題污染
            this.state.gameState.selectedItems = [];

            // 🆕 [新增] 重置商品選擇錯誤計數（每題開始時）
            this.state.gameState.stepErrorCounts.productSelection = 0;
            this.state.gameState.stepHintsShown.productSelection = false;
            this.clearStepHints();

            const app = document.getElementById('app');
            const settings = this.state.settings;

            // 獲取當前商店的商品（會自動緩存）
            const storeProducts = this.getCurrentStoreProducts();

            // 🔧 [修復] 指定商品模式：新快取產生的隨機價格可能與錢包計算時的舊價格不一致
            // → 將快取中目標商品的價格強制對齊 selectedItem（錢包計算所依據的價格），確保 selectProduct() 驗證不失敗
            if (settings.taskType === 'assigned' && this.state.gameState.selectedItem) {
                const storedItem = this.state.gameState.selectedItem;
                const cache = this.state.gameState.cachedStoreProducts;
                if (cache) {
                    const idx = cache.findIndex(p => p.id === storedItem.id);
                    if (idx >= 0 && cache[idx].price !== storedItem.price) {
                        Game.Debug.log('product', `🔧 [價格對齊] ${storedItem.name}: 新快取價格 ${cache[idx].price}元 → 對齊為 ${storedItem.price}元（錢包計算基準）`);
                        cache[idx] = { ...cache[idx], price: storedItem.price };
                    }
                }
            }

            // 根據任務類型生成任務
            let targetItem = null;
            let taskDescription = '';

            if (settings.taskType === 'assigned') {
                // 🔧 [修正] 使用歡迎流程中已經生成的指定商品
                targetItem = this.state.gameState.selectedItem || this.state.gameState.currentTransaction.targetItem;

                if (!targetItem) {
                    // 備用邏輯：如果歡迎流程沒有設置商品，則重新生成
                    let affordableItems = storeProducts.filter(item => item.price <= this.state.gameState.walletTotal);
                    if (affordableItems.length === 0) {
                        alert('錢包金額不足以購買任何商品，請調整設定！');
                        this.showSettings();
                        return;
                    }

                    // 排除上一題的商品（如果有足夠的商品可選擇）
                    if (this.state.gameState.previousTargetItemId && affordableItems.length > 1) {
                        affordableItems = affordableItems.filter(item => item.id !== this.state.gameState.previousTargetItemId);
                    }

                    // 🔧 [新增] 排除近期歷史中的重複商品
                    const storeType = this.state.settings.storeType;
                    const difficulty = this.state.settings.difficulty;
                    let filteredItems = this.filterDuplicateItems(affordableItems, storeType, difficulty);

                    // 如果過濾後沒有可用商品，使用原始列表（保證總是有商品可選）
                    if (filteredItems.length === 0) {
                        Game.Debug.log('state', '🎯 [A4-歷史] 購物場景：過濾後無可用商品，使用原始列表');
                        filteredItems = affordableItems;
                    }

                    targetItem = filteredItems[Math.floor(Math.random() * filteredItems.length)];

                    // 🔧 [新增] 將選中的商品添加到歷史記錄
                    this.addToQuestionHistory(targetItem, storeType, difficulty);

                    // 🔧 [修正] 設置選中商品狀態
                    this.state.gameState.selectedItem = targetItem;
                }

                this.state.gameState.currentTransaction.targetItem = targetItem;
                const productInfo = this.parseProductDisplay(targetItem, 1);
                taskDescription = `請購買${productInfo.displayText}`;
            } else {
                const budgetLimit = this.getBudgetLimit();
                taskDescription = `請在${budgetLimit}元內自由選擇商品購買`;
            }
            
            // 根據難度選擇商品顯示數量
            const itemCount = settings.difficulty === 'hard' ? 5 : 3;
            let displayItems = [];
            if (targetItem) {
                displayItems.push(targetItem);
                const otherItems = storeProducts.filter(item => item.id !== targetItem.id);
                // 隨機選擇其他商品（困難模式4個，其他模式2個）
                while (displayItems.length < itemCount && otherItems.length > 0) {
                    const randomIndex = Math.floor(Math.random() * otherItems.length);
                    displayItems.push(otherItems.splice(randomIndex, 1)[0]);
                }
            } else {
                // 自選模式，根據難度選擇商品數量（困難模式5個，其他模式3個）
                const affordableItems = storeProducts.filter(item => item.price <= this.state.gameState.walletTotal);
                while (displayItems.length < itemCount && affordableItems.length > 0) {
                    const randomIndex = Math.floor(Math.random() * affordableItems.length);
                    displayItems.push(affordableItems.splice(randomIndex, 1)[0]);
                }
            }
            
            // 打亂商品順序
            displayItems = this.shuffleArray(displayItems);
            
            app.innerHTML = `
                <div class="store-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">${this.getCurrentStoreInfo().emoji}</span>
                            <span>${this.getCurrentStoreInfo().name}</span>
                        </div>
                        <div class="title-bar-center">第一步：選擇購買的商品</div>
                        <div class="title-bar-right">
                            <span>第 ${this.state.quiz.currentQuestion + 1} 題 / 共 ${this.state.settings.questionCount || 10} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>
                    <!-- 指定購買商品框（原位置） / 自選模式標題文字 -->
                    ${targetItem ? `
                    <div class="unified-task-frame">
                        <div class="target-item-display">
                            <div class="item-content">
                                <div class="item-task-text"><span style="align-self:center;font-size:1.8em;font-weight:bold;">${taskDescription}</span>${this.getProductIconHTML(targetItem, '8rem')}<span style="align-self:center;font-size:1.8em;font-weight:bold;"> 共${targetItem.price}元</span><button class="a4-task-speak-btn" onclick="Game.speakShoppingTask()" title="朗讀任務">🔊</button></div>
                            </div>
                        </div>
                    </div>
                    ` : `
                    <div style="text-align: center; padding: 18px 20px 10px;">
                        <span style="font-size:1.8em; font-weight:bold;">商品選購 - ${taskDescription}</span>
                    </div>
                    `}

                    <!-- 商品選購區域 -->
                    <div class="product-selection-area">
                        <div class="products-grid">
                            ${displayItems.map(item => `
                                <div class="product-item ${targetItem ? '' : 'multi-select-mode'}" data-item-id="${item.id}" data-item-name="${this.parseProductDisplay(item, 1).displayText}" data-item-price="${item.price}" onclick="${targetItem ? `Game.selectProduct(${item.id})` : `Game.toggleProduct(${item.id})`}" onmouseenter="Game.handleProductHover(event)">
                                    ${!targetItem ? `<div class="selection-indicator">✓</div>` : ''}
                                    <div class="product-icon">${this.getProductIconHTML(item, '8rem')}</div>
                                    <div class="product-info">
                                        <div class="product-name">${this.parseProductDisplay(item, 1).displayText}</div>
                                        <div class="product-price">${item.price}元</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    ${!targetItem && settings.difficulty === 'easy' ? `
                    <!-- 自選模式下一步按鈕（簡單模式） -->
                    <div class="next-step-area" style="padding: 20px; text-align: center;">
                        <div class="selected-summary-simple" id="selected-summary-simple" style="margin-bottom: 15px; font-size: 1.1rem; color: #666;">
                            <p id="selected-count-text">尚未選擇商品</p>
                        </div>
                        <button id="proceed-to-confirm-btn" class="proceed-btn"
                                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 15px 40px; border-radius: 25px; font-size: 1.2rem; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.5)';"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.4)';"
                                onclick="Game.proceedToConfirmPrice()" disabled>
                            下一步：確認價格
                        </button>
                    </div>
                    ` : ''}

                    ${!targetItem && (settings.difficulty === 'normal' || settings.difficulty === 'hard') ? `
                    <!-- 自選模式下一步按鈕（普通/困難模式） -->
                    <div class="next-step-area" style="padding: 20px; text-align: center;">
                        <div class="selected-summary-simple" id="selected-summary-simple" style="margin-bottom: 15px; font-size: 1.1rem; color: #666;">
                            <p id="selected-count-text">尚未選擇商品</p>
                        </div>
                        <button id="proceed-to-confirm-btn" class="proceed-btn"
                                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 15px 40px; border-radius: 25px; font-size: 1.2rem; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.5)';"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.4)';"
                                onclick="Game.proceedToConfirmPrice()" disabled>
                            下一步：確認價格
                        </button>
                    </div>
                    ` : ''}
                </div>
            `;
            
            // 🔧 [修改] 歡迎流程已在序列中處理，這裡只需要設置初始狀態
            Game.Debug.log('flow', '🎯 [A4-購物] 購物場景已載入，等待用戶互動');

            // 設置語音狀態，允許商品懸停語音（但金錢語音仍然禁用）
            this.state.gameState.isShowingModal = false;
            this.state.gameState.isProcessingPrice = false;
            this.state.gameState.isProcessingPayment = false;
            this.state.gameState.isProcessingChange = false;
            this.state.gameState.isProcessingSpeech = false;
            
            // 添加困難模式提示按鈕的樣式
            if (settings.difficulty === 'hard') {
                this.addEmojiHintStyles();
            }

            // 🔧 [新增] 添加第一步計算機的樣式
            this.addStep1CalculatorStyles();

            // 🔧 [新增] 修正商品方框樣式，確保完整包圍文字
            if (!document.getElementById('product-item-fix-styles')) {
                const style = document.createElement('style');
                style.id = 'product-item-fix-styles';
                style.textContent = `
                    /* 修正商品方框樣式，確保完整包圍emoji和文字 */
                    .product-item {
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: flex-start !important;
                        padding: 15px !important;
                        border: 2px solid #e0e0e0 !important;
                        border-radius: 12px !important;
                        background: white !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        min-height: 200px !important;
                        position: relative !important;
                        overflow: visible !important;
                    }
                    .product-item:hover {
                        border-color: #4CAF50 !important;
                        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2) !important;
                        transform: translateY(-2px) !important;
                    }
                    .product-icon {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        margin-bottom: 10px !important;
                        line-height: 1 !important;
                        width: 100% !important;
                        height: auto !important;
                        min-height: 120px !important;
                    }
                    .product-info {
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        text-align: center !important;
                        width: 100% !important;
                        margin-top: auto !important;
                    }
                    .product-name {
                        font-size: 16px !important;
                        font-weight: bold !important;
                        color: #333 !important;
                        margin-bottom: 5px !important;
                        line-height: 1.2 !important;
                    }
                    .product-price {
                        font-size: 14px !important;
                        font-weight: bold !important;
                        color: #e74c3c !important;
                        margin-bottom: 3px !important;
                    }
                    .product-description {
                        font-size: 12px !important;
                        color: #666 !important;
                        line-height: 1.3 !important;
                    }
                    /* 確保自訂商品圖片不會溢出 */
                    .custom-product-image {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        margin-bottom: 10px !important;
                        width: 100% !important;
                        height: auto !important;
                    }
                    .custom-product-image img {
                        max-width: 100% !important;
                        max-height: 120px !important;
                        object-fit: cover !important;
                        border-radius: 8px !important;
                    }
                    /* 選擇模式樣式 */
                    .product-item.multi-select-mode.selected {
                        border-color: #4CAF50 !important;
                        background: #f8fff8 !important;
                    }
                    .selection-indicator {
                        position: absolute !important;
                        top: 10px !important;
                        right: 10px !important;
                        background: #4CAF50 !important;
                        color: white !important;
                        border-radius: 50% !important;
                        width: 25px !important;
                        height: 25px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        font-size: 14px !important;
                        font-weight: bold !important;
                        opacity: 0 !important;
                        transition: opacity 0.3s ease !important;
                    }
                    .product-item.multi-select-mode.selected .selection-indicator {
                        opacity: 1 !important;
                    }
                `;
                document.head.appendChild(style);
            }

            // 🔧 [性能修復] 在錢包渲染完成後初始化TouchDragUtility
            this.TimerManager.setTimeout(() => {
                this.initializeTouchDragSupport();

                // 🔧 [新增] 指定商品模式顯示彈跳視窗
                if (settings.taskType === 'assigned' && targetItem) {
                    this.TimerManager.setTimeout(() => {
                        this.showTargetItemModal();
                    }, 500, 'uiAnimation'); // 延遲500ms確保界面穩定

                }
            }, 100, 'uiAnimation');
        },

        // 🎯 [新增] 初始化TouchDragUtility手機拖放支援
        initializeTouchDragSupport() {
            if (!window.TouchDragUtility) {
                Game.Debug.warn('event', '⚠️ TouchDragUtility 未載入，跳過手機拖放支援');
                return;
            }

            try {
                Game.Debug.log('event', '🎯 [A4] 初始化 TouchDragUtility 手機拖放支援');

                // 先清理之前的註冊
                const gameArea = document.getElementById('app');
                if (!gameArea) {
                    Game.Debug.error('❌ 找不到遊戲區域，跳過TouchDragUtility註冊');
                    return;
                }

                // 取消之前的註冊
                window.TouchDragUtility.unregisterDraggable(gameArea);

                window.TouchDragUtility.registerDraggable(
                    gameArea,
                    '.money-item[draggable="true"], .payment-money-item[draggable="true"], .change-money[draggable="true"], .normal-change-money[draggable="true"], .change-money.draggable, .change-money',
                    {
                        onDragStart: (element, event) => {
                            // 🔧 [修復] 處理不同類型元素的ID獲取
                            const elementId = element.dataset.moneyId ||
                                            element.dataset.changeId ||
                                            element.id ||
                                            `${element.className}-${Date.now()}`;
                            Game.Debug.log('event', '📱 TouchDrag 金錢拖拽開始:', elementId);
                            
                            // 🎵 [新增] 觸控拖曳時播放幣值語音
                            const moneyName = element.dataset.moneyName;
                            if (moneyName && this.speechSynthesis && this.speechSynthesis.isReady) {
                                Game.Debug.log('speech', '🎵 [A4-觸控拖曳語音] 播放幣值語音:', moneyName);
                                this.speechSynthesis.speak(moneyName, { interrupt: false });
                            }
                            
                            return true; // 允許拖拽
                        },
                        onDrop: (draggedElement, dropZone, receivedSyntheticEvent) => {
                            Game.Debug.log('event', '📱 TouchDrag 金錢放置:', draggedElement.dataset.moneyId || draggedElement.dataset.changeId, dropZone.className);
                            Game.Debug.log('event', '📱 TouchDrag DEBUG: onDrop handler called');
                            Game.Debug.log('event', '📱 TouchDrag DEBUG: 收到的事件物件', receivedSyntheticEvent);

                            // ================================================================================
                            // 🎯 [手機端修復v2] 改進事件對象創建邏輯
                            // 確保 event.target 正確指向 dropZone，而不是空對象
                            // ================================================================================
                            const finalEvent = {
                                target: dropZone, // 🔧 直接使用 dropZone 作為 target
                                preventDefault: () => {},
                                originalEvent: receivedSyntheticEvent,
                                syntheticTouchDrop: true,
                                dataTransfer: {
                                    getData: (format) => {
                                        if (draggedElement.dataset.changeId !== undefined) {
                                            return `change-${draggedElement.dataset.changeId}-${draggedElement.dataset.moneyValue}`;
                                        }
                                        if (draggedElement.dataset.moneyId) {
                                            return draggedElement.dataset.moneyId;
                                        }
                                        return '';
                                    }
                                }
                            };

                            Game.Debug.log('event', '📱 TouchDrag DEBUG: 最終事件物件', finalEvent);

                            const currentScene = this.state.gameState.currentScene;
                            const isChangeElement = draggedElement.classList.contains('change-money');
                            // 🔧 修正：dropZone 可能就是精確的 target，所以也要檢查 finalEvent.target
                            const isChangeDropZone = finalEvent.target.classList.contains('change-targets') || finalEvent.target.classList.contains('change-target');
                            const isWalletDropZone = finalEvent.target.classList.contains('wallet-area') || finalEvent.target.classList.contains('wallet-content');

                            if (currentScene === 'checking' && isChangeElement && isChangeDropZone) {
                                Game.Debug.log('event', '📱 TouchDrag [路由 1: 找零驗證] -> handleChangeTargetDrop');
                                this.handleChangeTargetDrop(finalEvent);

                            // 案例 2: 任何將錢幣拖回錢包的操作。
                            } else if (isWalletDropZone) {
                                Game.Debug.log('event', '📱 TouchDrag [路由 2: 返回錢包] -> handleWalletDrop');
                                this.handleWalletDrop(finalEvent);

                            // 案例 3 (預設): 處理所有其他情況，主要是第二步的付款操作。
                            } else {
                                Game.Debug.log('event', '📱 TouchDrag [路由 3: 一般付款] -> handleMoneyDrop');
                                this.handleMoneyDrop(finalEvent);
                            }
                        },
                        onDragEnd: (element, event) => {
                            Game.Debug.log('event', '📱 TouchDrag 拖拽結束');
                        }
                    }
                );

                // 註冊放置區域 - 改為更廣泛的選擇器
                const dropZones = [];
                
                // 簡單模式：提示位置
                const hintItems = gameArea.querySelectorAll('.hint-item');
                hintItems.forEach(hintItem => dropZones.push(hintItem));
                
                // 普通/困難模式：付款區域
                const paymentZones = gameArea.querySelectorAll('.payment-zone, .payment-selection-area, .drop-zone, .payment-area');
                paymentZones.forEach(zone => dropZones.push(zone));
                
                // 錢包區域（用於拖回）
                const walletZones = gameArea.querySelectorAll('.wallet-area, .wallet-content');
                walletZones.forEach(zone => dropZones.push(zone));
                
                // 找零相關區域
                const changeZones = gameArea.querySelectorAll('.change-targets, .store-change, .collected-change, .change-money-area');
                changeZones.forEach(zone => dropZones.push(zone));

                // 🔧 [修復手機端拖放] 針對找零頁面，額外註冊具體的 .change-target 元素
                const individualChangeTargets = gameArea.querySelectorAll('.change-target');
                individualChangeTargets.forEach(target => dropZones.push(target));

                // 🔧 [手機端找零修復] 特別針對淡化的找零目標進行註冊
                const fadedChangeTargets = gameArea.querySelectorAll('.change-target.faded');
                fadedChangeTargets.forEach(target => {
                    if (!dropZones.includes(target)) {
                        dropZones.push(target);
                    }
                });

                dropZones.forEach(zone => {
                    window.TouchDragUtility.registerDropZone(zone, () => true);
                });

                Game.Debug.log('event', `✅ A4 TouchDragUtility 註冊完成: ${dropZones.length}個放置區域`);
                Game.Debug.log('event', `🔍 放置區域詳情:`, dropZones.map(zone => zone.className));

            } catch (error) {
                Game.Debug.error('❌ A4 TouchDragUtility 初始化失敗:', error);
            }
        },
        
        // 朗讀指定任務（任務框右側🔊按鈕用）
        speakShoppingTask() {
            const targetItem = this.state.gameState.selectedItem || this.state.gameState.currentTransaction.targetItem;
            if (!targetItem) return;
            const productInfo = this.parseProductDisplay(targetItem, 1);
            const speechText = `請購買${productInfo.speechText}，共${this.convertToTraditionalCurrency(targetItem.price)}`;
            this.speech.speak(speechText, { interrupt: true });
        },

        // 顯示任務指示彈窗（支援主題切換）
        showTaskModal(targetItem) {
            // 模態狀態已經在showShoppingScene中設置，這裡確認一下
            this.state.gameState.isShowingModal = true;
            Game.Debug.log('ui', '開始顯示任務模態視窗，確認阻止懸停語音');
            
            const productInfo = this.parseProductDisplay(targetItem, 1);
            const speechText = `請購買${productInfo.speechText}，共${this.convertToTraditionalCurrency(targetItem.price)}`;
            
            // 獲取當前主題
            const currentTheme = window.getCurrentTheme ? window.getCurrentTheme() : { name: 'ai-robot' };
            const isDarkTheme = currentTheme.name === 'dark';
            
            // 創建彈窗
            const modalOverlay = document.createElement('div');
            modalOverlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0, 0, 0, 0.75);
                display: flex; align-items: center; justify-content: center;
                z-index: 2000; opacity: 0; transition: opacity 0.3s;
            `;

            const modalContent = document.createElement('div');
            // 根據主題設定不同樣式
            if (isDarkTheme) {
                modalContent.style.cssText = `
                    background: linear-gradient(135deg, #34495e, #2c3e50);
                    padding: 40px 50px; border-radius: 15px; text-align: center;
                    color: #ecf0f1; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    transform: scale(0.8); transition: transform 0.3s;
                `;
            } else {
                modalContent.style.cssText = `
                    background: linear-gradient(135deg, var(--ai-cloud-white), var(--ai-light-blue));
                    padding: 40px 50px; border-radius: 15px; text-align: center;
                    color: var(--ai-text-primary, #333); box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    transform: scale(0.8); transition: transform 0.3s;
                    border: 3px solid var(--ai-vibrant-orange);
                `;
            }

            modalContent.innerHTML = `
                <h2 style="font-size: 2.2em; margin: 0 0 20px 0; color: ${isDarkTheme ? '#f1c40f' : 'var(--ai-vibrant-orange)'};">購買的物品</h2>
                <div style="font-size: 1.5em; margin: 20px 0; display: flex; flex-direction: column; align-items: center;">
                    ${this.getTaskItemDisplay(targetItem, isDarkTheme)}
                    <div style="font-weight: bold; color: ${isDarkTheme ? '#ecf0f1' : 'var(--ai-text-primary, #333)'};">${targetItem.name} 共${targetItem.price}元</div>
                </div>
            `;

            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);

            // 語音播報並關閉彈窗
            this.speech.speak(speechText, {
                callback: () => {
                    Game.TimerManager.setTimeout(() => {
                        modalOverlay.style.opacity = '0';
                        Game.TimerManager.setTimeout(() => {
                            document.body.removeChild(modalOverlay);
                            // 清除模態視窗狀態，允許懸停語音
                            Game.state.gameState.isShowingModal = false;
                            Game.Debug.log('ui', '任務模態視窗已關閉，恢復懸停語音');
                        }, 300, 'uiAnimation');
                    }, 1500, 'uiAnimation');
                }
            });

            // 淡入動畫
            this.TimerManager.setTimeout(() => {
                modalOverlay.style.opacity = '1';
                modalContent.style.transform = 'scale(1)';
            }, 10, 'uiAnimation');
        },
        
        // 獲取任務物品顯示（用於彈窗，支援主題）
        getTaskItemDisplay(item, isDarkTheme = false) {
            const backgroundStyle = isDarkTheme 
                ? 'background: rgba(255,255,255,0.1);' 
                : 'background: white; border: 2px solid var(--ai-vibrant-orange);';
            
            return `
                <div class="task-item-display" 
                     style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; 
                            ${backgroundStyle} border-radius: 8px; font-size: 2.5em; margin-bottom: 15px;">
                    ${this.getProductIconHTML(item, '70px')}
                </div>
            `;
        },
        
        // 獲取當前商店的商品（配置驅動的動態價格版本）
        // 🔧 [修復] 使用緩存機制，確保同一場景內商品價格一致
        getCurrentStoreProducts() {
            const storeType = this.state.settings.storeType;
            const difficulty = this.state.settings.difficulty;

            // 🔧 [修復] 如果有緩存的商品（本場景），直接返回
            if (this.state.gameState.cachedStoreProducts) {
                return this.state.gameState.cachedStoreProducts;
            }

            let products;

            if (storeType === 'magic') {
                // 魔法商店的自訂商品也應用動態價格
                if (difficulty) {
                    products = this.storeData.applyDynamicPricing(this.state.gameState.customItems, difficulty);
                } else {
                    products = this.state.gameState.customItems;
                }
            } else if (difficulty) {
                // 使用配置驅動的動態價格系統
                products = this.storeData.getStoreProductsWithDynamicPricing(storeType, difficulty);
            } else {
                // 後備方案：如果沒有設定難度，返回原始價格
                Game.Debug.warn('state', '🎯 [價格系統] 未設定難度，使用原始價格');
                products = this.storeData.storeProducts[storeType] || [];
            }

            // 🔧 [修復] 緩存生成的商品，確保同一場景內價格一致
            this.state.gameState.cachedStoreProducts = products;
            Game.Debug.log('product', '🎯 [價格系統] 已緩存商品價格，商品數量:', products.length);

            return products;
        },
        
        // 獲取當前商店信息
        getCurrentStoreInfo() {
            const storeType = this.state.settings.storeType;
            const storeInfo = {
                convenience: { name: '便利商店', emoji: '🏪' },
                market: { name: '菜市場', emoji: '🥬' },
                breakfast: { name: '早餐店', emoji: '🍳' },
                mcdonalds: { name: '美式速食店', emoji: '🍟' },
                pxmart: { name: '超級市場', emoji: '🛒' },
                clothing: { name: '服飾店', emoji: '👕' },
                electronics: { name: '3C用品店', emoji: '📱' },
                bookstore: { name: '書局', emoji: '📚' },
                toystore: { name: '玩具店', emoji: '🧸' },
                stationery: { name: '文具店', emoji: '✏️' },
                cosmetics: { name: '美妝店', emoji: '💄' },
                sports: { name: '運動用品店', emoji: '⚽' },
                magic: { name: '魔法商店', emoji: '🎪' }
            };
            return storeInfo[storeType] || { name: '便利商店', emoji: '🏪' };
        },

        // 獲取商店顯示名稱
        getStoreDisplayName(storeType) {
            const storeNames = {
                convenience: '🏪 便利商店',
                market: '🥬 菜市場',
                breakfast: '🍳 早餐店',
                mcdonalds: '🍟 美式速食店',
                pxmart: '🛒 超級市場',
                clothing: '👕 服飾店',
                electronics: '📱 3C用品店',
                bookstore: '📚 書局',
                toystore: '🧸 玩具店',
                stationery: '✏️ 文具店',
                cosmetics: '💄 美妝店',
                sports: '⚽ 運動用品店',
                magic: '🎪 魔法商店'
            };
            return storeNames[storeType] || '商店';
        },
        
        // 格式化商品顯示（統一處理單一商品和組合商品）
        formatItemDisplay(selectedItem, size = 'normal') {
            // 檢查 selectedItem 是否存在
            if (!selectedItem) {
                Game.Debug.warn('ui', '⚠️ formatItemDisplay: selectedItem 為 null 或 undefined');
                return '未知商品';
            }

            if (selectedItem.category === 'multi-selection') {
                // 組合商品顯示 - 每個商品圖片/emoji與名稱配對
                const iconSize = size === 'large' ? '48px' : (size === 'small' ? '20px' : '24px');
                const itemPairs = selectedItem.items.map(item => {
                    const itemName = item.name || item.description || '';
                    return `${this.getProductIconHTML(item, iconSize)} ${itemName}`;
                }).join('、');
                return itemPairs;
            } else {
                // 單一商品顯示
                const iconSize = size === 'large' ? '48px' : (size === 'small' ? '20px' : '24px');
                return `${this.getProductIconHTML(selectedItem, iconSize)} ${selectedItem.name}`;
            }
        },
        
        // 🔧 [新增] 商品圖片/emoji 渲染輔助函式
        getProductIconHTML(item, size = '8rem') {
            if (item.icon) {
                return `<img src="../images/a4/${item.icon}" alt="${item.name}" style="width: ${size}; height: ${size}; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'"><span style="font-size: ${size}; display: none;">${item.emoji}</span>`;
            }
            if (item.category === 'custom' && item.imageUrl) {
                return `<img src="${item.imageUrl}" alt="${item.name}" style="width: ${size}; height: ${size}; object-fit: cover; border-radius: 8px;">`;
            }
            return `<span style="font-size: ${size};">${item.emoji}</span>`;
        },

        // 🔧 [新增] 解析商品描述並生成正確的顯示格式
        parseProductDisplay(item, count = 1) {
            const description = item.description || item.name;

            // 如果描述包含 "/"，則解析為 "商品名/量詞" 格式
            if (description.includes('/')) {
                const [productName, measureWord] = description.split('/');
                const mw = measureWord.trim();
                // 量詞本身已含數字時（如「2顆」），不再加 count 前綴，避免「12顆蕃茄」
                const prefix = /^\d/.test(mw) ? '' : `${count}`;
                const text = `${prefix}${mw}${productName.trim()}`;
                return {
                    name: productName.trim(),
                    measureWord: mw,
                    displayText: text,
                    speechText: text
                };
            } else {
                // 如果沒有 "/"，使用原來的邏輯
                const mw = this.getMeasureWord(description);
                const prefix = /^\d/.test(mw) ? '' : `${count}`;
                const text = `${prefix}${mw}${description}`;
                return {
                    name: description,
                    measureWord: mw,
                    displayText: text,
                    speechText: text
                };
            }
        },

        // 獲取適當的量詞
        getMeasureWord(itemName) {
            const measureWords = {
                '蘋果': '顆', '餅乾': '包', '飲料': '瓶', '洋芋片': '包', '麵包': '個',
                '泡麵': '碗', '口香糖': '包', '咖啡': '杯', '巧克力': '包', '衛生紙': '包',
                '香蕉': '串', '胡蘿蔔': '6根', '蔥': '把', '蛋': '盒', '魚': '尾',
                '白菜': '顆', '蕃茄': '2顆', '豬肉': '份', '雞肉': '份',
                '三明治': '個', '豆漿': '杯', '蛋餅': '份', '吐司': '片', '紅茶': '杯',
                '漢堡': '個', '奶茶': '杯', '蘿蔔糕': '份', '飯糰': '個', '柳橙汁': '杯',
                '薯條': '份', '可樂': '杯', '雞塊': '份', '蘋果派': '個', '冰淇淋': '支',
                '炸雞翅': '份', '蔬菜沙拉': '盒', '巧克力聖代': '杯',
                '洗髮精': '瓶', '牙膏': '條', '洗衣粉': '包', '牛奶': '瓶', '土司': '袋',
                '沐浴乳': '瓶', '洗碗精': '瓶',
                'T恤': '件', '牛仔褲': '條', '運動鞋': '雙', '帽子': '頂', '襪子': '雙',
                '外套': '件', '裙子': '條', '圍巾': '條', '手套': '雙', '內褲': '件',
                '手機': '支', '耳機': '副', '充電器': '個', '滑鼠': '個', '鍵盤': '個',
                '隨身碟': '個', '平板': '台', '喇叭': '組', '電池': '組', '記憶卡': '張',
                '小說': '本', '字典': '本', '漫畫': '本', '雜誌': '本', '食譜': '本',
                '繪本': '本', '旅遊書': '本', '參考書': '本', '書籤': '張', '賀卡': '張',
                '玩具車': '台', '娃娃': '個', '積木': '盒', '拼圖': '盒', '球': '顆',
                '飛機': '台', '機器人': '個', '玩具槍': '把', '彈珠': '袋', '溜溜球': '個',
                '鉛筆': '支', '原子筆': '支', '橡皮擦': '個', '尺': '把', '筆記本': '本',
                '膠水': '瓶', '剪刀': '把', '彩色筆': '盒', '計算機': '台', '資料夾': '個',
                '口紅': '支', '粉底液': '瓶', '睫毛膏': '支', '眼影': '盒', '面膜': '包',
                '洗面乳': '條', '乳液': '瓶', '香水': '瓶', '指甲油': '瓶', '化妝棉': '盒',
                '籃球': '顆', '足球': '顆', '羽毛球拍': '支', '網球': '顆', '泳鏡': '副',
                '慢步鞋': '雙', '瑜珈墊': '個', '啞鈴': '個', '護膝': '個', '水壺': '個'
            };
            return measureWords[itemName] || '個'; // 預設使用「個」
        },
        
        // 渲染錢包內容
        renderWalletContent() {
            // 🔧 [修正] 按面額從小到大排序顯示
            const sortedWallet = [...this.state.gameState.playerWallet].sort((a, b) => a.value - b.value);
            return sortedWallet.map(money => {
                const isBanknote = money.value >= 100;
                const itemClass = isBanknote ? 'money-item banknote' : 'money-item coin';
                return `
                <div class="${itemClass}" data-money-id="${money.id}" data-money-name="${money.name}" draggable="true"
                     ondragstart="Game.handleMoneyDragStart(event)"
                     onclick="Game.handleMoneyClick(event)"
                     onmouseenter="Game.handleMoneyHover(event)">
                    <img src="${money.displayImage || money.images.front}" alt="${money.name}">
                    <div class="money-value">${money.name}</div>
                </div>
                `;
            }).join('');
        },
        
        // 渲染錢包內容（含提示）
        renderWalletContentWithHints(optimalPayment) {
            Game.Debug.log('hint', '渲染錢包提示，最佳方案:', optimalPayment);

            const optimalValues = optimalPayment || [];
            const optimalCounts = {};

            // 計算最佳方案中各面額的數量
            optimalValues.forEach(value => {
                optimalCounts[value] = (optimalCounts[value] || 0) + 1;
            });

            Game.Debug.log('hint', '最佳方案面額計數:', optimalCounts);

            // 🔧 [修正] 按面額從小到大排序顯示
            const sortedWallet = [...this.state.gameState.playerWallet].sort((a, b) => a.value - b.value);

            return sortedWallet.map((money, index) => {
                const isOptimal = optimalCounts[money.value] > 0;
                if (isOptimal) {
                    optimalCounts[money.value]--; // 減少計數
                }
                
                const isBanknote = money.value >= 100;
                const itemClass = isBanknote ? 'money-item banknote' : 'money-item coin';
                const opacity = isOptimal ? '0.5' : '1';
                const border = isOptimal ? '3px solid #4CAF50' : '1px solid #ddd';
                const backgroundColor = isOptimal ? '#e8f5e8' : 'white';
                
                Game.Debug.log('coin', `錢幣 ${money.name} (${money.value}元) - 是否最佳: ${isOptimal}`);
                
                return `
                    <div class="${itemClass} ${isOptimal ? 'optimal-hint' : ''}" 
                         data-money-id="${money.id}" 
                         data-money-name="${money.name}"
                         draggable="true" 
                         ondragstart="Game.handleMoneyDragStart(event)"
                         onclick="Game.handleMoneyClick(event)"
                         onmouseenter="Game.handleMoneyHover(event)" 
                         style="opacity: ${opacity}; 
                                border: ${border}; 
                                border-radius: 8px; 
                                background-color: ${backgroundColor};
                                box-shadow: ${isOptimal ? '0 0 10px rgba(76, 175, 80, 0.5)' : 'none'};
                                transition: all 0.3s ease;">
                        <img src="${money.displayImage || money.images.front}" alt="${money.name}">
                        <div class="money-value">${money.name}</div>
                        ${isOptimal ? '<div style="position: absolute; top: -5px; right: -5px; background: #4CAF50; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px;">✓</div>' : ''}
                    </div>
                `;
            }).join('');
        },
        
        // 洗牌函數
        shuffleArray(array) {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
        },
        
        // 初始化選中商品狀態
        initializeSelectedItems() {
            if (!this.state.gameState.selectedItems) {
                this.state.gameState.selectedItems = [];
            }
        },
        
        // 切換商品選擇（自選模式）
        toggleProduct(itemId) {
            // 🔧 [新增] 防止重複點擊機制
            if (this.state.gameState.isProcessingProductSelection) {
                Game.Debug.log('flow', '🚫 [防重複] 正在處理商品選擇，忽略重複點擊');
                return;
            }

            // 🔧 [新增] 設置處理狀態
            this.state.gameState.isProcessingProductSelection = true;

            this.initializeSelectedItems();
            
            const storeProducts = this.getCurrentStoreProducts();
            const item = storeProducts.find(product => product.id === itemId);
            if (!item) {
                // 🔧 [新增] 錯誤時重置處理狀態
                this.state.gameState.isProcessingProductSelection = false;
                return;
            }
            
            const selectedIndex = this.state.gameState.selectedItems.findIndex(selected => selected.id === itemId);
            
            if (selectedIndex >= 0) {
                // 取消選擇
                this.state.gameState.selectedItems.splice(selectedIndex, 1);
                this.speech.speak(`取消選擇${item.name}`, { interrupt: true });
            } else {
                // 檢查是否會超過預算限制
                const currentTotal = this.state.gameState.selectedItems.reduce((sum, selected) => sum + selected.price, 0);
                const newTotal = currentTotal + item.price;
                
                // 取得適當的預算限制
                const budgetLimit = this.getBudgetLimit();
                
                if (newTotal > budgetLimit) {
                    // 🔧 [新增] 錯誤時重置處理狀態
                    this.state.gameState.isProcessingProductSelection = false;
                    this.speech.speak('超過金額，無法購買', { interrupt: true });
                    return;
                }
                
                // 添加選擇
                this.state.gameState.selectedItems.push(item);
                this.speech.speak(`選擇${item.name}，${this.convertToTraditionalCurrency(item.price)}`, { interrupt: true });
            }
            
            // 更新視覺狀態
            this.updateProductSelection();

            // 🔧 [修改] 所有模式都使用簡化摘要（已選擇 X 項商品）
            this.updateSelectedCountSummary();

            // 🔧 [新增] 完成處理後重置狀態
            this.state.gameState.isProcessingProductSelection = false;
        },
        
        // 確認多選購買
        confirmMultiPurchase() {
            if (this.state.isProcessing) return;
            if (!this.state.gameState.selectedItems || this.state.gameState.selectedItems.length === 0) {
                this.speech.speak('請先選擇要購買的商品', { interrupt: true });
                return;
            }
            this.state.isProcessing = true;
            
            const difficulty = this.state.settings.difficulty;
            const totalPrice = this.state.gameState.selectedItems.reduce((sum, item) => sum + item.price, 0);
            const itemNames = this.state.gameState.selectedItems.map(item => item.name).join('、');
            
            // 困難/普通模式需要驗證用戶輸入的總計
            if (difficulty === 'hard' || difficulty === 'normal') {
                const totalInput = document.getElementById('selected-total-input');
                const confirmBtn = document.getElementById('confirm-purchase-btn');

                if (!totalInput || !totalInput.value || confirmBtn.disabled) {
                    this.speech.speak('請先輸入正確的總計金額', { interrupt: true });
                    return;
                }

                const inputValue = parseInt(totalInput.value.replace('元', '').replace(' (錯誤)', ''));

                if (inputValue === totalPrice) {
                    // 答對了
                    Game.Debug.log('flow', `${difficulty === 'hard' ? '困難' : '普通'}模式答對，開始播放音效和語音`);
                    this.audio.playCorrect02Sound(() => {
                        Game.Debug.log('audio', '音效播放完成，開始播放語音');

                        let speechCompleted = false;

                        // 設置安全超時，防止語音系統卡住
                        const safetyTimeout = Game.TimerManager.setTimeout(() => {
                            if (!speechCompleted) {
                                Game.Debug.log('speech', '語音播放超時，強制進入付款頁面');
                                speechCompleted = true;
                                Game.proceedToPayment(totalPrice, itemNames);
                            }
                        }, 5000, 'speechDelay'); // 5秒超時

                        this.speech.speak(`答對，商品金額總共${this.convertToTraditionalCurrency(totalPrice)}`, {
                            callback: () => {
                                if (!speechCompleted) {
                                    Game.Debug.log('speech', '語音播放完成，準備進入付款頁面');
                                    speechCompleted = true;
                                    Game.TimerManager.clearTimeout(safetyTimeout);
                                    // 使用 setTimeout 確保語音完全結束
                                    Game.TimerManager.setTimeout(() => {
                                        Game.proceedToPayment(totalPrice, itemNames);
                                    }, 100, 'screenTransition');
                                }
                            }
                        });
                    });
                } else {
                    // 答錯了 - 先播放error.mp3音效
                    Game.Debug.log('flow', `${difficulty === 'hard' ? '困難' : '普通'}模式答錯，開始播放錯誤音效`);
                    this.audio.playErrorSound(() => {
                        Game.Debug.log('audio', '錯誤音效播放完成，立即播放語音回饋');

                        // 鼓勵再試一次
                        const speechText = '你輸入的金額錯誤，請再試一次';

                        // 立即播放語音，不延遲
                        this.speech.speak(speechText, {
                            interrupt: true
                        });
                    });

                    // 重置輸入框
                    totalInput.value = '';
                    totalInput.style.color = 'inherit';
                    totalInput.style.borderColor = 'inherit';
                    totalInput.placeholder = '請重新輸入正確金額';
                    confirmBtn.disabled = true;
                    confirmBtn.textContent = '確認購買';
                    this.state.isProcessing = false;
                    return;
                }
            } else {
                // 簡單模式直接進入付款流程
                this.proceedToPayment(totalPrice, itemNames);
            }
        },

        // 🔧 [新增] 確認多選價格（第二步專用 - 普通/困難）
        confirmMultiPurchasePrice() {
            if (this.state.isProcessing) return;
            const difficulty = this.state.settings.difficulty;
            const totalPrice = this.state.gameState.selectedItems
                .reduce((sum, item) => sum + item.price, 0);
            const itemNames = this.state.gameState.selectedItems
                .map(item => item.name).join('、');

            const totalInput = document.getElementById('selected-total-input');
            const confirmBtn = document.getElementById('confirm-purchase-btn');

            if (!totalInput?.value || confirmBtn.disabled) {
                this.speech.speak('請先輸入正確的總計金額', { interrupt: true });
                return;
            }

            const inputValue = parseInt(totalInput.value.replace(/[^\d]/g, ''));

            Game.Debug.log('payment', '🔍 [A4-價格確認] 驗證輸入:', { inputValue, totalPrice, isCorrect: inputValue === totalPrice });

            if (inputValue === totalPrice) {
                // 答對
                this.state.isProcessing = true;
                Game.Debug.log('payment', '✅ [A4-價格確認] 答對！進入付款流程');
                this.audio.playCorrect02Sound(() => {
                    let speechCompleted = false;
                    const safetyTimeout = Game.TimerManager.setTimeout(() => {
                        if (!speechCompleted) {
                            speechCompleted = true;
                            Game.proceedToPayment(totalPrice, itemNames);
                        }
                    }, 5000, 'speechDelay');

                    this.speech.speak(
                        `答對，商品金額總共${this.convertToTraditionalCurrency(totalPrice)}`,
                        {
                            callback: () => {
                                if (!speechCompleted) {
                                    speechCompleted = true;
                                    Game.TimerManager.clearTimeout(safetyTimeout);
                                    Game.TimerManager.setTimeout(() => {
                                        Game.proceedToPayment(totalPrice, itemNames);
                                    }, 100, 'screenTransition');
                                }
                            }
                        }
                    );
                });
            } else {
                // 答錯
                Game.Debug.log('payment', '❌ [A4-價格確認] 答錯，提示重新輸入');
                this.audio.playErrorSound(() => {
                    this.speech.speak('你輸入的金額錯誤，請再試一次', { interrupt: true });
                });

                // 重置輸入
                totalInput.value = '';
                totalInput.placeholder = '請重新輸入正確金額';
                confirmBtn.disabled = true;
                this.state.isProcessing = false;
            }
        },

        // 🔧 [新增] 確認簡單模式價格（無需驗證，直接進入付款）
        confirmEasyModePrice() {
            Game.Debug.log('flow', '🎯 [A4-簡單模式] 確認價格，進入付款流程');

            const taskType = this.state.settings.taskType;
            const isSingleItem = taskType === 'assigned';

            // 準備付款場景所需數據
            let speechText;

            if (isSingleItem) {
                // 單一商品（購買指定商品模式）- 語音同普通模式
                const selectedItem = this.state.gameState.selectedItem;
                const totalPrice = selectedItem.price;
                const productInfo = this.parseProductDisplay(selectedItem, 1);
                speechText = `正確！${productInfo.speechText}的價格是${this.convertToTraditionalCurrency(totalPrice)}`;
            } else {
                // 多個商品（自選購買商品模式）
                const selectedItems = this.state.gameState.selectedItems;
                const totalPrice = selectedItems.reduce((sum, item) => sum + item.price, 0);
                speechText = `答對，商品價格總共${this.convertToTraditionalCurrency(totalPrice)}`;
            }

            // 播放音效（自動觸發煙火動畫）+ 語音 + 進入付款
            this.audio.playCorrect02Sound(() => {
                let speechCompleted = false;

                // 安全超時，防止語音系統卡住
                const safetyTimeout = Game.TimerManager.setTimeout(() => {
                    if (!speechCompleted) {
                        speechCompleted = true;
                        if (isSingleItem) {
                            // 單一商品：直接進入付款場景（selectedItem已正確設置）
                            Game.SceneManager.switchScene('paying', Game);
                        } else {
                            // 多個商品：使用proceedToPayment創建組合商品
                            const selectedItems = Game.state.gameState.selectedItems;
                            const totalPrice = selectedItems.reduce((sum, item) => sum + item.price, 0);
                            const itemNames = selectedItems.map(item => item.name).join('、');
                            Game.proceedToPayment(totalPrice, itemNames);
                        }
                    }
                }, 5000, 'speechDelay');

                // 播放語音
                this.speech.speak(
                    speechText,
                    {
                        callback: () => {
                            if (!speechCompleted) {
                                speechCompleted = true;
                                Game.TimerManager.clearTimeout(safetyTimeout);
                                Game.TimerManager.setTimeout(() => {
                                    if (isSingleItem) {
                                        // 單一商品：直接進入付款場景（selectedItem已正確設置）
                                        Game.SceneManager.switchScene('paying', Game);
                                    } else {
                                        // 多個商品：使用proceedToPayment創建組合商品
                                        const selectedItems = Game.state.gameState.selectedItems;
                                        const totalPrice = selectedItems.reduce((sum, item) => sum + item.price, 0);
                                        const itemNames = selectedItems.map(item => item.name).join('、');
                                        Game.proceedToPayment(totalPrice, itemNames);
                                    }
                                }, 100, 'screenTransition');
                            }
                        }
                    }
                );
            });
        },

        // 🔧 [新增] 進入價格確認流程（自選模式 - 普通/困難）
        proceedToConfirmPrice() {
            if (this.state.isProcessing) return;
            if (!this.state.gameState.selectedItems || this.state.gameState.selectedItems.length === 0) {
                this.speech.speak('請先選擇要購買的商品', { interrupt: true });
                return;
            }

            this.state.isProcessing = true;
            const itemNames = this.state.gameState.selectedItems
                .map(item => item.name)
                .join('、');

            Game.Debug.log('flow', '🎯 [A4-自選] 進入價格確認流程，已選商品:', itemNames);

            // 播放音效和語音
            const difficulty = this.state.settings.difficulty;
            const speechText = difficulty === 'easy'
                ? `你已選擇${itemNames}`
                : `你已選擇${itemNames}，請確認商品總額`;

            this.audio.playSuccessSound(() => {
                this.speech.speak(speechText, {
                    callback: () => {
                        Game.TimerManager.setTimeout(() => {
                            this.state.isProcessing = false;
                            // 使用 SceneManager 切換到價格確認場景
                            Game.SceneManager.switchScene('priceConfirmation', Game);
                        }, 1000, 'screenTransition');
                    }
                });
            });
        },

        // 進入付款流程
        proceedToPayment(totalPrice, itemNames) {
            // 創建組合商品對象
            const combinedItem = {
                id: 'multi-' + Date.now(),
                name: itemNames,
                price: totalPrice,
                category: 'multi-selection',
                description: `組合商品：${itemNames}`,
                items: this.state.gameState.selectedItems
            };
            
            // 設置為選中商品並進入付款流程
            this.state.gameState.selectedItem = combinedItem;
            // 🔧 [配置驅動] 使用SceneManager切換到付款場景
            this.SceneManager.switchScene('paying', this);
        },
        
        // 更新商品選擇視覺狀態
        updateProductSelection() {
            this.initializeSelectedItems();
            
            const productItems = document.querySelectorAll('.product-item.multi-select-mode');
            productItems.forEach(item => {
                const itemId = parseInt(item.dataset.itemId);
                const isSelected = this.state.gameState.selectedItems.some(selected => selected.id === itemId);
                
                if (isSelected) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        },
        
        // 更新選中商品摘要
        updateSelectedSummary() {
            this.initializeSelectedItems();
            
            const selectedItemsList = document.getElementById('selected-items-list');
            const selectedTotal = document.getElementById('selected-total');
            const selectedTotalInput = document.getElementById('selected-total-input');
            const confirmBtn = document.getElementById('confirm-purchase-btn');
            const difficulty = this.state.settings.difficulty;
            
            if (!selectedItemsList || (!selectedTotal && !selectedTotalInput) || !confirmBtn) return;
            
            if (this.state.gameState.selectedItems.length === 0) {
                selectedItemsList.innerHTML = '<p>尚未選擇商品</p>';
                if (selectedTotal) selectedTotal.textContent = '0';
                if (selectedTotalInput) selectedTotalInput.value = '';
                confirmBtn.disabled = true;
            } else {
                // 🔧 [修改] 橫式排列顯示選中商品：咖啡47元+蘋果28元=？
                const total = this.state.gameState.selectedItems.reduce((sum, item) => sum + item.price, 0);

                const itemsHtml = this.state.gameState.selectedItems.map((item, index) => {
                    if (index === 0) {
                        return `${item.name}${item.price}元`;
                    } else {
                        return ` + ${item.name}${item.price}元`;
                    }
                }).join('') + (difficulty === 'hard' ? ' = ？' : ` = ${total}元`);

                selectedItemsList.innerHTML = `<div class="selected-items-horizontal">${itemsHtml}</div>`;
                
                // 儲存實際總計供驗證使用
                this.state.gameState.actualTotal = total;
                
                if (difficulty === 'hard' || difficulty === 'normal') {
                    // 困難/普通模式：不自動顯示總計，等用戶輸入
                    if (selectedTotalInput) {
                        selectedTotalInput.placeholder = '請輸入總計金額';
                    }
                    confirmBtn.disabled = true; // 需要用戶輸入正確金額後才能啟用
                } else {
                    // 簡單模式：直接顯示總計
                    if (selectedTotal) selectedTotal.textContent = total;
                    confirmBtn.disabled = false;
                }
                
                // 檢查是否超過錢包金額並更新樣式
                if (total > this.state.gameState.walletTotal) {
                    if (selectedTotal) selectedTotal.style.color = 'red';
                    if (selectedTotalInput) selectedTotalInput.style.borderColor = 'red';
                } else {
                    if (selectedTotal) selectedTotal.style.color = 'green';
                    if (selectedTotalInput) selectedTotalInput.style.borderColor = 'inherit';
                }
            }
        },

        // 🔧 [新增] 更新簡化的選中商品摘要（自選模式 - 普通/困難第一步）
        updateSelectedCountSummary() {
            const selectedCountText = document.getElementById('selected-count-text');
            const proceedBtn = document.getElementById('proceed-to-confirm-btn');

            if (!selectedCountText || !proceedBtn) return;

            const count = this.state.gameState.selectedItems.length;

            if (count === 0) {
                selectedCountText.textContent = '尚未選擇商品';
                proceedBtn.disabled = true;
            } else {
                selectedCountText.textContent = `已選擇 ${count} 項商品`;
                proceedBtn.disabled = false;
            }
        },

        // 顯示錢包金額數字輸入器
        showWalletNumberInput() {
            this.showNumberInput('wallet');
        },

        // 顯示題數數字輸入器
        showQuestionCountNumberInput() {
            this.showNumberInput('questionCount');
        },

        // 顯示數字輸入器（通用版本）
        showNumberInput(type = 'total') {
            // 檢查是否已存在數字輸入器，如果存在則先清除
            const existingPopup = document.getElementById('number-input-popup');
            if (existingPopup) {
                Game.Debug.log('ui', '🔄 發現已存在的數字輸入器，先清除再重新創建');
                this.closeNumberInput();
                // 使用微小延遲確保DOM完全清理
                this.TimerManager.setTimeout(() => {
                    this.createNumberInput(type);
                }, 10, 'uiAnimation');
                return;
            }

            this.createNumberInput(type);
        },

        // 創建數字輸入器
        createNumberInput(type = 'total') {

            const isWalletMode = type === 'wallet';
            const isPriceMode = type === 'price';
            const isQuestionCountMode = type === 'questionCount';
            const isCustomItemPriceMode = type === 'customItemPrice';
            let title = '請輸入總計金額';
            if (isWalletMode) title = '請輸入錢包金額';
            if (isPriceMode) title = '請輸入商品價格';
            if (isQuestionCountMode) title = '請輸入題數';
            if (isCustomItemPriceMode) title = '請輸入商品價格';
            
            const inputPopupHTML = `
                <div id="number-input-popup" class="number-input-popup" data-input-type="${type}">
                    <div class="number-input-container">
                        <div class="number-input-header">
                            <h3>${title}</h3>
                            <button class="close-btn" onclick="Game.closeNumberInput()">×</button>
                        </div>
                        <div class="number-input-display">
                            <input type="text" id="number-display" readonly value="">
                        </div>
                        <div class="number-input-buttons">
                            <button onclick="Game.appendNumber('1')">1</button>
                            <button onclick="Game.appendNumber('2')">2</button>
                            <button onclick="Game.appendNumber('3')">3</button>
                            <button onclick="Game.clearNumber()" class="clear-btn">清除</button>
                            
                            <button onclick="Game.appendNumber('4')">4</button>
                            <button onclick="Game.appendNumber('5')">5</button>
                            <button onclick="Game.appendNumber('6')">6</button>
                            <button onclick="Game.backspaceNumber()" class="backspace-btn">⌫</button>
                            
                            <button onclick="Game.appendNumber('7')">7</button>
                            <button onclick="Game.appendNumber('8')">8</button>
                            <button onclick="Game.appendNumber('9')">9</button>
                            <button onclick="Game.confirmNumber()" class="confirm-btn" rowspan="2">確認</button>
                            
                            <button onclick="Game.appendNumber('0')" class="zero-btn">0</button>
                        </div>
                    </div>
                </div>
            `;

            // 添加數字輸入器樣式
            const inputStyles = `
                    .number-input-popup {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.7);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 10000;
                    }

                    .number-input-container {
                        background: white;
                        border-radius: 15px;
                        padding: 20px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        width: 300px;
                        max-width: 90vw;
                    }

                    .number-input-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #f0f0f0;
                        padding-bottom: 10px;
                    }

                    .number-input-header h3 {
                        margin: 0;
                        color: #333;
                        font-size: 18px;
                    }

                    .close-btn {
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .close-btn:hover {
                        background: #f0f0f0;
                    }

                    .number-input-display {
                        margin-bottom: 20px;
                    }

                    #number-display {
                        width: 100%;
                        border: 2px solid #ddd;
                        padding: 15px;
                        font-size: 24px;
                        text-align: center;
                        border-radius: 8px;
                        background: #f9f9f9;
                        font-family: 'Courier New', monospace;
                    }

                    .number-input-buttons {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 10px;
                    }

                    .number-input-buttons button {
                        padding: 15px;
                        font-size: 18px;
                        font-weight: bold;
                        border: 2px solid #ddd;
                        border-radius: 8px;
                        background: white;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .number-input-buttons button:hover {
                        background: #f0f0f0;
                        transform: translateY(-1px);
                    }

                    .number-input-buttons button:active {
                        transform: translateY(0);
                        background: #e0e0e0;
                    }

                    .number-input-buttons button.clear-btn {
                        background: #ff6b6b !important;
                        color: white !important;
                        border-color: #ff6b6b !important;
                        padding: 15px 8px !important;
                        font-size: 14px !important;
                        width: auto !important;
                        min-width: 60px !important;
                        max-width: 80px !important;
                    }

                    .number-input-buttons button.clear-btn:hover {
                        background: #ff5252 !important;
                    }

                    .number-input-buttons button.backspace-btn {
                        background: #ffa726 !important;
                        color: white !important;
                        border-color: #ffa726 !important;
                        padding: 15px 8px !important;
                        font-size: 16px !important;
                        width: auto !important;
                        min-width: 60px !important;
                        max-width: 80px !important;
                    }

                    .number-input-buttons button.backspace-btn:hover {
                        background: #ff9800 !important;
                    }

                    .number-input-buttons button.confirm-btn {
                        background: #4caf50 !important;
                        color: white !important;
                        border-color: #4caf50 !important;
                        grid-row: span 2;
                        padding: 15px 8px !important;
                        font-size: 14px !important;
                        width: auto !important;
                        min-width: 60px !important;
                        max-width: 80px !important;
                    }

                    .number-input-buttons button.confirm-btn:hover {
                        background: #45a049 !important;
                    }

                    .number-input-buttons .zero-btn {
                        grid-column: span 3;
                    }
            `;

            // 檢查並移除舊的樣式（如果存在）
            const existingStyles = document.getElementById('number-input-styles');
            if (existingStyles) {
                existingStyles.remove();
            }

            // 添加樣式到head
            const styleElement = document.createElement('style');
            styleElement.id = 'number-input-styles';
            styleElement.textContent = inputStyles;
            document.head.appendChild(styleElement);

            // 添加數字輸入器到頁面
            document.body.insertAdjacentHTML('beforeend', inputPopupHTML);
        },

        // ▼▼▼ 【需求 #2 新增】 ▼▼▼
        // 顯示總計提示（困難模式專用）
        showTotalHint() {
            const formulaElement = document.getElementById('selected-items-list');
            if (!formulaElement || formulaElement.dataset.showingHint === 'true') {
                // 如果元素不存在或正在顯示提示，則不執行任何操作
                return;
            }

            // 1. 計算當前選中商品的實際總金額
            const total = this.state.gameState.selectedItems.reduce((sum, item) => sum + item.price, 0);
            const selectedItems = this.state.gameState.selectedItems;

            // 2. 保存原始公式
            const originalFormula = formulaElement.textContent;

            // 3. 生成顯示答案的公式
            const itemsFormulaWithAnswer = selectedItems.map((item, index) => {
                return (index === 0 ? '' : ' + ') + `${item.name}${item.price}元`;
            }).join('') + ` = ${total}元`;

            // 4. 更新公式顯示答案
            formulaElement.textContent = itemsFormulaWithAnswer;
            formulaElement.dataset.showingHint = 'true';

            // 5. 語音播放使用傳統數字格式
            const speechText = `目前總計${this.convertToTraditionalCurrency(total)}`;
            this.speech.speak(speechText, { interrupt: true });

            // 6. 設置 3 秒後恢復為「？」
            this.TimerManager.setTimeout(() => {
                formulaElement.textContent = originalFormula;
                formulaElement.dataset.showingHint = 'false';
            }, 3000, 'uiAnimation');
        },
        // ▲▲▲ 【需求 #2 新增結束】 ▲▲▲

        // 🔧 [新增] 切換第一步的計算機
        toggleStep1Calculator() {
            const toggleBtn = document.getElementById('step1-toggle-calculator-btn');
            const calculatorContainer = document.getElementById('step1-calculator-container');

            if (!toggleBtn || !calculatorContainer) {
                Game.Debug.error('找不到計算機按鈕或容器');
                return;
            }

            // 切換顯示/隱藏狀態
            const isOpen = calculatorContainer.style.display !== 'none';

            if (isOpen) {
                // 關閉計算機
                calculatorContainer.style.display = 'none';
                toggleBtn.textContent = '🧮 計算機';
            } else {
                // 開啟計算機
                calculatorContainer.style.display = 'flex';
                toggleBtn.textContent = '🧮 關閉';

                // 初始化計算機狀態
                const calculatorState = {
                    displayValue: '0',
                    previousValue: null,
                    operator: null,
                    waitingForOperand: false,
                    expression: ''
                };

                // 設置計算機事件監聽器
                this.setupCalculatorListeners(calculatorState);
            }
        },

        // 🔧 [新增] 點擊背景遮罩關閉計算機
        closeStep1CalculatorOnBackdrop(event) {
            // 只有點擊背景區域時才關閉，點擊計算機本身不關閉
            if (event.target.id === 'step1-calculator-container' ||
                event.target.classList.contains('step1-calculator-container')) {
                this.toggleStep1Calculator();
            }
        },

        // 🔧 [新增] 切換第二步的計算機（價格確認場景）
        toggleStep2Calculator() {
            const container = document.getElementById('step2-calculator-container');
            if (!container) {
                Game.Debug.error('找不到第二步計算機容器');
                return;
            }

            if (container.style.display === 'none' || !container.style.display) {
                container.style.display = 'flex';
                this.speech.speak('打開計算機', { interrupt: true });
                Game.Debug.log('ui', '🧮 [計算機] 第二步計算機已開啟');
                const calculatorState = {
                    displayValue: '0',
                    previousValue: null,
                    operator: null,
                    waitingForOperand: false,
                    expression: ''
                };
                this.setupCalculatorListeners(calculatorState);
            } else {
                container.style.display = 'none';
                this.speech.speak('關閉計算機', { interrupt: true });
                Game.Debug.log('ui', '🧮 [計算機] 第二步計算機已關閉');
                const buttons = container.querySelectorAll('.calc-btn');
                buttons.forEach(btn => {
                    const newBtn = btn.cloneNode(true);
                    btn.parentNode.replaceChild(newBtn, btn);
                });
            }
        },

        // 🔧 [新增] 點擊背景遮罩關閉第二步計算機
        closeStep2CalculatorOnBackdrop(event) {
            // 只有點擊背景區域時才關閉，點擊計算機本身不關閉
            if (event.target.id === 'step2-calculator-container' ||
                event.target.classList.contains('step2-calculator-container')) {
                this.toggleStep2Calculator();
            }
        },

        // 【新增】為 emoji 提示按鈕添加專用樣式
        addEmojiHintStyles() {
            if (document.getElementById('emoji-hint-styles')) return;

            const style = document.createElement('style');
            style.id = 'emoji-hint-styles';
            style.textContent = `
                .emoji-hint-btn {
                    background: #f0f0f0;
                    border: 1px solid #ccc;
                    border-radius: 20px;
                    padding: 5px 12px;
                    margin-left: 10px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                }
                .emoji-hint-btn:hover {
                    background: #e0e0e0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .emoji-hint-btn .hint-emoji {
                    margin-right: 5px;
                }
                .emoji-hint-btn .hint-text-reveal {
                    font-weight: bold;
                    color: #007bff;
                }
                .emoji-hint-btn.showing-hint {
                    background: #e3f2fd;
                    border-color: #007bff;
                }
            `;

            document.head.appendChild(style);
        },

        // 🔧 [新增] 為第一步計算機添加樣式
        addStep1CalculatorStyles() {
            if (document.getElementById('step1-calculator-styles')) return;

            const style = document.createElement('style');
            style.id = 'step1-calculator-styles';
            style.textContent = `
                /* total-display 布局樣式（相對定位，作為提示按鈕的定位基準） */
                .total-display {
                    position: relative;
                    margin-top: 15px;
                    width: 100%;
                }

                /* total-content 置中對齊 selected-items-list（只包含總計和計算機） */
                .total-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 18px;
                    font-weight: bold;
                    text-align: center;
                }

                /* 提示按鈕靠右對齊 */
                .stylish-hint-btn {
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                }

                /* 第一步計算機按鈕樣式（在總計旁邊） */
                .step1-calculator-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    margin-left: 10px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                }

                .step1-calculator-btn:hover {
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }

                .step1-calculator-btn:active {
                    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
                }

                /* 第一步計算機容器樣式（全屏透明遮罩，計算機在右側） */
                .step1-calculator-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                }

                /* 計算機彈窗容器（在右側） */
                .calculator-popup {
                    position: relative;
                    margin-right: 20px;
                    animation: calculatorSlideIn 0.3s ease-out;
                    box-shadow: -5px 0 20px rgba(0, 0, 0, 0.3);
                }

                /* @keyframes calculatorSlideIn 已移至 injectGlobalAnimationStyles() */

                /* 關閉按鈕 */
                .calculator-close-btn {
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    width: 32px;
                    height: 32px;
                    background: #ff4757;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    font-size: 20px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    transition: all 0.2s ease;
                    z-index: 10001;
                }

                .calculator-close-btn:hover {
                    background: #ee5a6f;
                    transform: rotate(90deg);
                }

                /* 選中商品列表置中 */
                .selected-items-list {
                    text-align: center;
                    padding: 10px;
                }

                /* 橫式排列選中商品樣式 */
                .selected-items-horizontal {
                    font-size: 18px;
                    font-weight: bold;
                    color: #2d3748;
                    padding: 10px;
                    background: #f0f9ff;
                    border-radius: 8px;
                    text-align: center;
                    display: inline-block;
                }

                /* 計算機樣式（在彈窗中顯示） */
                .step1-calculator-container .calculator {
                    background: #2d3748;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                    width: 350px;
                    max-width: 90vw;
                    margin: 0 auto;
                    position: relative;
                }

                .step1-calculator-container .calculator-expression {
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

                .step1-calculator-container .calculator-display {
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

                .step1-calculator-container .calculator-buttons {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                }

                .step1-calculator-container .calc-btn {
                    padding: 20px;
                    font-size: 1.3em;
                    font-weight: bold;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
                }

                /* 已移除計算機按鈕縮小動畫效果 */
                /* .step1-calculator-container .calc-btn:active {
                    transform: scale(0.95);
                } */

                /* 🔧 [修復] 防止計算機彈窗、計算機容器在點擊時縮小 */
                .step1-calculator-container:active,
                .calculator-popup:active,
                .step1-calculator-container .calculator:active {
                    transform: none !important;
                }

                .step1-calculator-container .number-btn {
                    background: #4a5568;
                    color: white;
                }

                .step1-calculator-container .number-btn:hover {
                    background: #718096;
                }

                .step1-calculator-container .operator-btn {
                    background: #f6ad55;
                    color: white;
                }

                .step1-calculator-container .operator-btn:hover {
                    background: #ed8936;
                }

                .step1-calculator-container .clear-btn {
                    background: #fc8181;
                    color: white;
                }

                .step1-calculator-container .clear-btn:hover {
                    background: #f56565;
                }

                .step1-calculator-container .equals-btn {
                    background: #48bb78;
                    color: white;
                }

                .step1-calculator-container .equals-btn:hover {
                    background: #38a169;
                }

                /* 深色模式樣式 */
                [data-theme="dark"] .step1-calculator-btn {
                    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
                    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
                }

                [data-theme="dark"] .step1-calculator-btn:hover {
                    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
                }

                [data-theme="dark"] .selected-items-horizontal {
                    background: #1e293b;
                    color: #e2e8f0;
                }

                /* 響應式設計 */
                @media (max-width: 768px) {
                    .step1-calculator-container .calculator {
                        max-width: 100%;
                    }

                    .step1-calculator-container .calc-btn {
                        padding: 15px;
                        font-size: 1.1em;
                    }
                }
            `;

            document.head.appendChild(style);
        },

        // 關閉數字輸入器
        closeNumberInput() {
            const popup = document.getElementById('number-input-popup');
            if (popup) {
                popup.remove();
            }
            // 確保移除樣式元素
            const styles = document.getElementById('number-input-styles');
            if (styles) {
                styles.remove();
            }
        },

        // 添加數字到輸入框
        appendNumber(digit) {
            const display = document.getElementById('number-display');
            if (!display) return;
            this.audio.playKeypadSound();
            if (display.value === '' || display.value === '0') {
                display.value = digit;
            } else {
                display.value += digit;
            }
        },

        // 清除輸入
        clearNumber() {
            const display = document.getElementById('number-display');
            if (!display) return;
            this.audio.playKeypadSound();
            display.value = '';
        },

        // 退格
        backspaceNumber() {
            const display = document.getElementById('number-display');
            if (!display) return;
            this.audio.playKeypadSound();
            if (display.value.length > 1) {
                display.value = display.value.slice(0, -1);
            } else {
                display.value = '';
            }
        },

        // 確認輸入的數字
        confirmNumber() {
            const display = document.getElementById('number-display');
            const popup = document.getElementById('number-input-popup');
            const inputType = popup ? popup.dataset.inputType : 'total';
            
            if (!display) return;

            const inputValue = parseInt(display.value);
            
            if (inputType === 'wallet') {
                // 錢包金額輸入
                const walletInput = document.getElementById('custom-wallet-amount');
                if (!walletInput) return;

                if (inputValue >= 100 && inputValue <= 5000) {
                    walletInput.value = inputValue + '元';
                    this.closeNumberInput();
                } else {
                    alert('請輸入100-5000之間的有效金額！');
                }
            } else if (inputType === 'questionCount') {
                // 題數輸入
                if (inputValue > 0 && inputValue <= 100) {
                    // 更新設定
                    this.state.settings.questionCount = inputValue;

                    // 更新自訂按鈕為 active
                    const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
                    if (customBtn) {
                        const group = customBtn.closest('.button-group');
                        group.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                        customBtn.classList.add('active');
                    }

                    // 🔧 [修正] 顯示自訂輸入框並更新題數顯示（仿A5，但避免閃爍）
                    const customInputGroup = document.querySelector('.custom-input-group');
                    if (customInputGroup) {
                        customInputGroup.style.display = 'block';
                        const customInput = document.getElementById('custom-question-count');
                        if (customInput) {
                            customInput.value = `${inputValue}題`;
                            // 🔧 [新增] 套用藍色標示樣式（與被選定的按鈕一致）
                            customInput.style.background = '#667eea';
                            customInput.style.color = 'white';
                            customInput.style.borderColor = '#667eea';
                        }
                    }

                    // 更新開始按鈕狀態
                    this.updateStartButton();

                    // 語音提示
                    this.speech.speak(`已設定測驗題數為${inputValue}題`);

                    this.closeNumberInput();
                } else {
                    alert('請輸入1-100之間的有效題數！');
                }
            } else if (inputType === 'price') {
                // 價格輸入（困難模式）
                const priceInput = document.getElementById('price-input');
                const confirmBtn = document.getElementById('confirm-price-btn');

                if (!priceInput) return;

                priceInput.value = inputValue;
                confirmBtn.disabled = !inputValue || inputValue <= 0;
                this.closeNumberInput();
            } else if (inputType === 'customItemPrice') {
                // 自訂商品價格輸入
                const customPriceInput = document.getElementById('modal-custom-price');

                if (!customPriceInput) return;

                if (inputValue >= 1 && inputValue <= 1000) {
                    customPriceInput.value = inputValue;
                    this.closeNumberInput();
                } else {
                    alert('請輸入1-1000之間的有效價格！');
                }
            } else {
                // 總計金額輸入（困難模式）
                const totalInput = document.getElementById('selected-total-input');
                const confirmBtn = document.getElementById('confirm-purchase-btn');

                if (!totalInput) return;

                // 直接顯示輸入值，不進行驗證
                totalInput.value = inputValue + '元';
                confirmBtn.disabled = false;
                confirmBtn.textContent = '確認購買';
                this.closeNumberInput();
            }
        },
        
        // 取得預算限制
        getBudgetLimit() {
            // 所有模式都使用完整錢包金額
            return this.state.gameState.walletTotal;
        },
        
        // 選擇商品（指定模式）
        selectProduct(itemId) {
            // 🔧 [新增] 通用防重複點擊機制
            if (this.state.gameState.isProcessingProductSelection) {
                Game.Debug.log('flow', '🚫 [防重複] 正在處理商品選擇，忽略重複點擊');
                return;
            }

            const storeProducts = this.getCurrentStoreProducts();
            const selectedItem = storeProducts.find(item => item.id === itemId);

            if (!selectedItem) {
                Game.Debug.error('找不到商品:', itemId);
                return;
            }

            // 🔧 [修正] 困難模式防重複點選機制 - 只在同一場景內且用戶已成功完成選擇後才阻止
            if (this.state.settings.difficulty === 'hard' &&
                this.state.settings.taskType === 'assigned' &&
                this.state.gameState.hasUserSelectedProduct &&
                this.state.gameState.currentScene === 'shopping' &&
                this.state.gameState.currentTransaction.targetItem &&
                this.state.gameState.currentTransaction.targetItem.id === selectedItem.id) {
                Game.Debug.log('flow', '🚫 [困難模式] 防止重複點選正確商品');
                return; // 靜默返回，不播放任何音效或語音
            }

            // 🔧 [新增] 設置處理狀態，防止重複點擊
            this.state.gameState.isProcessingProductSelection = true;

            // 檢查是否為指定任務且選擇正確
            if (this.state.settings.taskType === 'assigned') {
                const targetItem = this.state.gameState.currentTransaction.targetItem;
                window.LearningTracker?.logStep?.(`選擇商品：${targetItem.name}`, selectedItem.id === targetItem.id);
                if (selectedItem.id !== targetItem.id) {
                    // 🔧 [新增] 錯誤時重置處理狀態，允許重新選擇
                    this.state.gameState.isProcessingProductSelection = false;
                    // 顯示錯誤視覺回饋
                    this.showErrorFeedback(itemId);

                    // 🆕 [新增] 普通模式：錯誤計數與提示
                    const difficulty = this.state.settings.difficulty;
                    if (difficulty === 'normal') {
                        window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                        this.state.gameState.stepErrorCounts.productSelection++;
                        const errorCount = this.state.gameState.stepErrorCounts.productSelection;
                        Game.Debug.log('hint', `🔴 [商品選擇] 普通模式錯誤次數: ${errorCount}`);

                        if (errorCount >= 3 && !this.state.gameState.stepHintsShown.productSelection) {
                            // 第3次錯誤後顯示提示
                            this.state.gameState.stepHintsShown.productSelection = true;
                            this.showProductSelectionHint(targetItem);
                            this.audio.playErrorSound();
                            return;
                        }
                    }

                    // 使用 parseProductDisplay 生成正確的語音格式
                    const productInfo = this.parseProductDisplay(targetItem, 1);
                    this.speech.speak(`請選擇指定的商品${productInfo.speechText}`, { interrupt: true });
                    this.audio.playErrorSound();
                    return;
                }
            }

            // 檢查金額是否足夠
            if (selectedItem.price > this.state.gameState.walletTotal) {
                // 🔧 [新增] 錯誤時重置處理狀態，允許重新選擇
                this.state.gameState.isProcessingProductSelection = false;
                const productInfo = this.parseProductDisplay(selectedItem, 1);
                this.speech.speak(`錢包金額不足，無法購買${productInfo.speechText}`, { interrupt: true });
                this.audio.playErrorSound();
                return;
            }
            
            // 選擇成功
            this.state.gameState.selectedItem = selectedItem;
            this.state.gameState.currentTransaction.totalCost = selectedItem.price;
            if (window.TutorContext) TutorContext.update({ phase: 'payment' });
            // 🔧 [新增] 標記用戶已成功選擇商品，啟用防重複機制
            this.state.gameState.hasUserSelectedProduct = true;
            
            // 添加視覺回饋：綠色勾勾和其他商品變暗
            this.showSelectionFeedback(itemId);
            
            // 先播放音效和語音確認選擇
            // 🔧 [修正] 無論音效是否成功，都確保場景轉換正常進行
            const proceedWithSelection = () => {
                const difficulty = this.state.settings.difficulty;
                
                // 🔧 [修正] 統一使用商品的描述名稱，與其他語音保持一致
                const productInfo = this.parseProductDisplay(selectedItem, 1);

                if (difficulty === 'easy') {
                    // 簡單模式：進入價格確認場景（語音同普通模式）
                    this.speech.speak(`你選擇了${productInfo.speechText}，請確認商品價格`, {
                        callback: () => {
                            // 🔧 [修復] 使用 TimerManager 追蹤計時器
                            Game.TimerManager.setTimeout(() => {
                                // 🔧 [修復] 驗證當前場景，防止在錯誤場景下切換
                                const currentScene = Game.state.gameState.currentScene;
                                if (currentScene === 'shopping') {
                                    // 🔧 [修改] 使用SceneManager切換到價格確認場景
                                    Game.SceneManager.switchScene('priceConfirmation', Game);
                                } else {
                                    context.Debug.warn('flow', `⚠️ [商品選擇回調] 在 ${currentScene} 場景下被調用，忽略場景切換`);
                                }
                            }, 1000, 'screenTransition');
                        }
                    });
                } else {
                    // 普通和困難模式：需要用戶確認價格
                    this.speech.speak(`你選擇了${productInfo.speechText}，請確認商品價格`, {
                        callback: () => {
                            // 🔧 [修復] 使用 TimerManager 追蹤計時器
                            Game.TimerManager.setTimeout(() => {
                                const currentScene = Game.state.gameState.currentScene;
                                if (currentScene === 'shopping') {
                                    Game.showPriceInputScene(selectedItem);
                                } else {
                                    context.Debug.warn('flow', `⚠️ [商品選擇回調] 在 ${currentScene} 場景下被調用，忽略價格輸入`);
                                }
                            }, 1000, 'screenTransition');
                        }
                    });
                }
            };
            
            // 嘗試播放音效，無論成功與否都執行場景轉換
            try {
                this.audio.playSuccessSound(proceedWithSelection);
            } catch (error) {
                Game.Debug.log('audio', '音效播放失敗，直接進行場景轉換:', error);
                proceedWithSelection();
            }
        },
        
        // 顯示價格輸入場景（指定商品模式）
        showPriceInputScene(selectedItem) {
            const app = document.getElementById('app');
            const settings = this.state.settings;
            const difficulty = settings.difficulty;
            
            // 根據商品類別生成顯示內容
            let itemDisplayText = selectedItem.name;
            let itemDisplayIcons = '';
            
            itemDisplayIcons = this.getProductIconHTML(selectedItem, '8rem');
            
            app.innerHTML = `
                <div class="store-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">${this.getCurrentStoreInfo().emoji}</span>
                            <span>${this.getCurrentStoreInfo().name}</span>
                        </div>
                        <div class="title-bar-center">第二步：確認商品價格</div>
                        <div class="title-bar-right">
                            <span>第 ${this.state.quiz.currentQuestion + 1} 題 / 共 ${this.state.settings.questionCount || 10} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>

                    <!-- 選中的商品顯示 -->
                    <div class="unified-task-frame">
                        <div class="task-header">
                            <h2>已選擇的商品</h2>
                        </div>
                        <div class="selected-item-display">
                            <div class="item-task-text"><span style="align-self:center;font-size:1.8em;font-weight:bold;">${itemDisplayText}</span>${itemDisplayIcons}<span style="align-self:center;font-size:1.8em;font-weight:bold;"> 共${selectedItem.price}元</span></div>
                        </div>
                    </div>

                    <!-- 價格輸入區域 -->
                    <div class="price-input-area">
                        <h3 class="section-title">請輸入商品價格</h3>
                        <div class="price-input-container">
                            <div class="price-display">
                                <span>價格：</span>
                                <input type="text" id="price-input" class="price-input-field" placeholder="請確認價格" readonly onclick="Game.showPriceNumberInput()">
                                <span class="currency">元</span>
                            </div>
                            <button id="confirm-price-btn" class="confirm-btn" onclick="Game.confirmPrice()" disabled>
                                確認價格
                            </button>
                        </div>
                    </div>
                </div>
            `;
        },

        // 🔧 [新增] 顯示價格確認場景（自選模式第二步）
        showPriceConfirmationScene() {
            const settings = this.state.settings;
            const difficulty = settings.difficulty;

            if (difficulty === 'easy') {
                // 簡單模式：顯示價格公式 + 確認購買按鈕（無輸入框）
                this.showEasyModePriceConfirmation();
            } else {
                // 普通/困難模式：顯示價格公式 + 輸入框 + 驗證
                this.showNormalHardModePriceConfirmation();
            }
        },

        // 🔧 [新增] 顯示普通/困難模式的價格確認場景
        showNormalHardModePriceConfirmation() {
            const app = document.getElementById('app');
            const settings = this.state.settings;
            const difficulty = settings.difficulty;
            const selectedItems = this.state.gameState.selectedItems;

            // 計算總計
            const totalPrice = selectedItems.reduce((sum, item) => sum + item.price, 0);

            // 生成商品列表顯示（同指定商品 item-task-text 橫排）
            const selectedItemsDisplay = selectedItems.map(item => {
                const productInfo = this.parseProductDisplay(item, 1);
                const icon = this.getProductIconHTML(item, '8rem');
                return `<div class="item-task-text" style="margin-bottom: 8px;"><span style="align-self:center;font-size:1.8em;font-weight:bold;">${productInfo.displayText}</span>${icon}<span style="align-self:center;font-size:1.8em;font-weight:bold;"> ${item.price}元</span></div>`;
            }).join('');

            // 生成商品公式（咖啡47元+蘋果28元=？）
            // 單一商品時隱藏價格顯示
            const itemsFormula = selectedItems.length === 1
                ? `${selectedItems[0].name}` + (difficulty === 'hard' ? ' = ？' : ` = ${totalPrice}元`)
                : selectedItems.map((item, index) => {
                    return (index === 0 ? '' : ' + ') + `${item.name}${item.price}元`;
                }).join('') + (difficulty === 'hard' ? ' = ？' : ` = ${totalPrice}元`);

            app.innerHTML = `
                <div class="store-layout">
                    <!-- 標題欄 -->
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">${this.getCurrentStoreInfo().emoji}</span>
                            <span>${this.getCurrentStoreInfo().name}</span>
                        </div>
                        <div class="title-bar-center">第二步：確認商品價格</div>
                        <div class="title-bar-right">
                            <span>第 ${this.state.quiz.currentQuestion + 1} 題 / 共 ${settings.questionCount || 10} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>

                    <!-- 已選擇的商品 -->
                    <div class="unified-task-frame">
                        <div class="task-header">
                            <h2>已選擇的商品</h2>
                        </div>
                        <div class="selected-items-display" style="padding: 10px 20px;">
                            ${selectedItemsDisplay}
                        </div>
                    </div>

                    <!-- 價格確認區域 -->
                    <div class="price-input-area">
                        <!-- 標題列（包含計算機和提示按鈕） -->
                        <div style="position: relative; text-align: center; margin-bottom: 10px; min-height: 40px; display: flex; align-items: center; justify-content: center;">
                            <h3 class="section-title" style="margin: 0;">請輸入商品總計</h3>

                            ${difficulty === 'hard' ? `
                                <!-- 計算機按鈕（困難模式，在提示按鈕左側） -->
                                <button id="step2-toggle-calculator-btn"
                                        class="step1-calculator-btn"
                                        style="position: absolute; right: 165px; padding: 8px 16px; font-size: 14px;"
                                        onclick="Game.toggleStep2Calculator()">
                                    🧮 計算機
                                </button>
                            ` : ''}

                            ${(difficulty === 'hard' || difficulty === 'normal') ? `
                                <!-- 提示按鈕（最右側） -->
                                <div style="position:absolute;right:0;display:flex;align-items:center;gap:6px;">
                                    <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                                    <button class="hint-btn" id="total-hint-btn"
                                            style="padding: 8px 16px; font-size: 14px;"
                                            onclick="Game.showTotalHint()"
                                            title="顯示總計提示">
                                        💡<span class="hint-text">提示</span>
                                    </button>
                                </div>
                            ` : ''}
                        </div>

                        <!-- 商品公式 -->
                        <div class="selected-items-formula" id="selected-items-list" style="font-size: 1.8em; font-weight: bold; margin-bottom: 20px; text-align: center; color: #333;">
                            ${itemsFormula}
                        </div>

                        <!-- 總計輸入 -->
                        <div class="price-input-container">
                            <div class="price-display" style="display: flex; align-items: center; justify-content: center; margin: 15px 0;">
                                <span>總計：</span>
                                <input type="text" id="selected-total-input"
                                       class="price-input-field"
                                       placeholder="請輸入總計金額"
                                       readonly
                                       onclick="Game.showNumberInput()">
                                <span class="currency">元</span>
                            </div>

                            <button id="confirm-purchase-btn"
                                    class="confirm-btn"
                                    onclick="Game.confirmMultiPurchasePrice()"
                                    disabled>
                                確認購買
                            </button>
                        </div>

                        <!-- 計算機容器（困難模式） -->
                        ${difficulty === 'hard' ? `
                            <div id="step2-calculator-container"
                                 class="step1-calculator-container"
                                 style="display: none;"
                                 onclick="Game.closeStep2CalculatorOnBackdrop(event)">
                                <div class="calculator-popup">
                                    <button class="calculator-close-btn"
                                            onclick="Game.toggleStep2Calculator()">✕</button>
                                    ${this.getCalculatorHTML()}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            // 添加困難模式提示樣式
            if (difficulty === 'hard') {
                this.addEmojiHintStyles();
            }

            Game.Debug.log('ui', '🎨 [A4-價格確認] 第二步UI已渲染');
        },

        // 🔧 [新增] 顯示簡單模式的價格確認場景
        showEasyModePriceConfirmation() {
            const app = document.getElementById('app');
            const settings = this.state.settings;
            const taskType = settings.taskType;

            // 判斷是單一商品（指定模式）還是多個商品（自選模式）
            const isSingleItem = taskType === 'assigned';
            const selectedItem = this.state.gameState.selectedItem;
            const selectedItems = this.state.gameState.selectedItems || [];

            let priceFormula = '';
            let totalPrice = 0;

            if (isSingleItem) {
                // 單一商品：「🍞麵包52元」
                const productInfo = this.parseProductDisplay(selectedItem, 1);
                priceFormula = `${this.getProductIconHTML(selectedItem, '8rem')}<span style="font-size: 1.5rem;">${productInfo.displayText}${selectedItem.price}元</span>`;
                totalPrice = selectedItem.price;
            } else {
                // 多個商品：「🍞麵包52元+🥤飲料25元=77元」；單商品：「🍞麵包52元」（不顯示=）
                totalPrice = selectedItems.reduce((sum, item) => sum + item.price, 0);
                const itemsPart = selectedItems.map(item => {
                    const productInfo = this.parseProductDisplay(item, 1);
                    return `${this.getProductIconHTML(item, '8rem')}<span style="font-size: 1.5rem;">${productInfo.displayText}${item.price}元</span>`;
                }).join('<span style="font-size: 1.5rem;"> + </span>');
                priceFormula = selectedItems.length === 1
                    ? itemsPart
                    : itemsPart + `<span style="font-size: 1.5rem;"> = ${totalPrice}元</span>`;
            }

            app.innerHTML = `
                <div class="store-layout">
                    <!-- 標題欄 -->
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">${this.getCurrentStoreInfo().emoji}</span>
                            <span>${this.getCurrentStoreInfo().name}</span>
                        </div>
                        <div class="title-bar-center">第二步：確認商品價格</div>
                        <div class="title-bar-right">
                            <span>第 ${this.state.quiz.currentQuestion + 1} 題 / 共 ${settings.questionCount || 10} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>

                    <!-- 已選擇的商品 -->
                    <div class="unified-task-frame">
                        <div class="task-header">
                            <h2>已選擇的商品</h2>
                        </div>
                        <div class="price-formula-display" style="padding: 30px; text-align: center; font-size: 1.5rem; font-weight: bold; color: #333; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px;">
                            ${priceFormula}
                        </div>
                    </div>

                    <!-- 確認購買按鈕 -->
                    <div class="confirm-area" style="padding: 20px; text-align: center;">
                        <button id="confirm-easy-price-btn"
                                class="confirm-btn"
                                onclick="Game.confirmEasyModePrice()"
                                style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none; padding: 20px 50px; border-radius: 30px; font-size: 1.3rem; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);">
                            確認購買
                        </button>
                    </div>
                </div>
            `;

            Game.Debug.log('ui', '🎨 [A4-簡單模式] 價格確認UI已渲染');
        },

        // 顯示自訂商品價格數字輸入器
        showCustomItemPriceInput() {
            Game.Debug.log('ui', '🔢 顯示自訂商品價格數字輸入器');
            this.showNumberInput('customItemPrice');
        },

        // 顯示價格數字輸入器（困難模式）
        showPriceNumberInput() {
            // 防止在處理中重複點擊
            if (this.state.gameState.isProcessingPrice) {
                Game.Debug.log('flow', '🚫 價格處理中，忽略重複點擊');
                return;
            }

            Game.Debug.log('ui', '🔢 顯示價格數字輸入器');
            this.showNumberInput('price');
        },
        
        // 確認價格輸入
        confirmPrice() {
            // 防重複點擊機制
            const confirmBtn = document.getElementById('confirm-price-btn');
            if (confirmBtn.disabled || this.state.gameState.isProcessingPrice) {
                return;
            }

            const priceInput = document.getElementById('price-input');
            const inputPrice = parseInt(priceInput.value);
            const selectedItem = this.state.gameState.selectedItem;
            const actualPrice = selectedItem.price;

            if (!inputPrice || inputPrice <= 0) {
                this.speech.speak('請輸入有效的價格', { interrupt: true });
                return;
            }

            if (inputPrice === actualPrice) {
                // 價格正確 - 設置處理狀態，禁用按鈕
                this.state.gameState.isProcessingPrice = true;
                confirmBtn.disabled = true;
                confirmBtn.textContent = '處理中...';

                this.audio.playSuccessSound(() => {
                    const productInfo = this.parseProductDisplay(selectedItem, 1);
                    this.speech.speak(`正確！${productInfo.speechText}的價格是${this.convertToTraditionalCurrency(actualPrice)}`, {
                        callback: () => {
                            Game.TimerManager.setTimeout(() => {
                                // 🔧 [配置驅動] 使用SceneManager切換到付款場景（狀態清理已在onExit中處理）
                                Game.SceneManager.switchScene('paying', Game);
                                // 清除處理狀態
                                Game.state.gameState.isProcessingPrice = false;
                            }, 1000, 'screenTransition');
                        }
                    });
                });
            } else {
                // 價格錯誤
                this.audio.playErrorSound();
                const productInfo = this.parseProductDisplay(selectedItem, 1);
                this.speech.speak(`錯誤！${productInfo.speechText}的正確價格是${this.convertToTraditionalCurrency(actualPrice)}，請重新輸入`, { interrupt: true });
                priceInput.value = '';
                confirmBtn.disabled = true;
                confirmBtn.textContent = '確認價格';
            }
        },
        
        // 顯示選擇回饋效果
        showSelectionFeedback(selectedItemId) {
            // 獲取所有商品項目
            const productItems = document.querySelectorAll('.product-item');
            
            productItems.forEach(item => {
                const itemId = parseInt(item.dataset.itemId);
                
                if (itemId === selectedItemId) {
                    // 正確選擇的商品：添加綠色勾勾
                    item.style.position = 'relative';
                    const checkMark = document.createElement('div');
                    checkMark.innerHTML = '✓';
                    checkMark.style.cssText = `
                        position: absolute;
                        top: -10px;
                        right: -10px;
                        background: #4CAF50;
                        color: white;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        font-weight: bold;
                        z-index: 10;
                        animation: checkAppear 0.3s ease-out;
                    `;
                    item.appendChild(checkMark);
                } else {
                    // 其他商品：變暗
                    item.style.opacity = '0.3';
                    item.style.pointerEvents = 'none';
                }
            });

            // @keyframes checkAppear 已移至 injectGlobalAnimationStyles()
        },

        // 顯示錯誤回饋效果
        showErrorFeedback(selectedItemId) {
            // 獲取選中的商品項目
            const selectedItem = document.querySelector(`[data-item-id="${selectedItemId}"]`);
            
            if (selectedItem) {
                // 錯誤選擇的商品：添加紅色叉叉
                selectedItem.style.position = 'relative';
                const errorMark = document.createElement('div');
                errorMark.innerHTML = '✗';
                errorMark.style.cssText = `
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    background: #f44336;
                    color: white;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: bold;
                    z-index: 10;
                    animation: errorAppear 0.3s ease-out;
                `;
                selectedItem.appendChild(errorMark);
                
                // 3秒後移除錯誤標記
                this.TimerManager.setTimeout(() => {
                    if (errorMark.parentNode) {
                        errorMark.parentNode.removeChild(errorMark);
                    }
                }, 3000, 'uiAnimation');
            }

            // @keyframes errorAppear 已移至 injectGlobalAnimationStyles()
        },

        // 計算最佳付款方案（優先不找零，其次找零最小）
        calculateOptimalPayment(targetAmount, availableMoney) {
            Game.Debug.log('payment', '計算最佳付款方案:', { targetAmount, availableMoney });

            // 🔧 防護：targetAmount 無效時提前返回，避免 new Array(NaN) 拋出 RangeError
            if (!targetAmount || typeof targetAmount !== 'number' || isNaN(targetAmount) || targetAmount <= 0) {
                Game.Debug.warn('payment', '❌ [A4-付款計算] 無效的目標金額，跳過計算:', targetAmount);
                return null;
            }

            // 🔧 [修正] 簡單模式特殊處理：找等於或超過目標金額的最接近幣值（參考a4簡單模式）
            if (this.state.settings.difficulty === 'easy') {
                // 收集所有 >= 目標金額的錢幣
                const validCoins = availableMoney.filter(money => money.value >= targetAmount);

                if (validCoins.length > 0) {
                    // 按面額排序（從小到大），選擇最接近目標金額的
                    validCoins.sort((a, b) => a.value - b.value);
                    const bestCoin = validCoins[0];
                    Game.Debug.log('payment', '簡單模式：使用單一大面額支付', {
                        money: bestCoin.value,
                        target: targetAmount,
                        allValidCoins: validCoins.map(c => c.value)
                    });
                    return [bestCoin.value];
                }
            }

            // 計算每種面額的數量
            const coinCounts = {};
            availableMoney.forEach(money => {
                coinCounts[money.value] = (coinCounts[money.value] || 0) + 1;
            });

            Game.Debug.log('payment', '可用錢幣統計:', coinCounts);

            const allCoins = Object.keys(coinCounts).map(Number).sort((a, b) => a - b); // 從小到大排序，便於動態規劃
            
            // 策略1: 尋找精確付款方案（不找零）
            function findExactPayment(target, coinsList, counts) {
                if (!target || isNaN(target) || target <= 0 || target > 100000) return null;
                // 使用動態規劃找到所有可能的精確付款組合
                const dp = new Array(target + 1).fill(null);
                dp[0] = [];
                
                for (let amount = 1; amount <= target; amount++) {
                    for (const coin of coinsList) {
                        if (coin <= amount && counts[coin] > 0) {
                            const prevAmount = amount - coin;
                            if (dp[prevAmount] !== null) {
                                // 計算到目前為止使用的錢幣數量
                                const usedCoins = {};
                                dp[prevAmount].forEach(c => {
                                    usedCoins[c] = (usedCoins[c] || 0) + 1;
                                });
                                
                                // 檢查是否還有這種面額可用
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
            
            // 首先嘗試找精確付款方案
            let exactSolution = findExactPayment(targetAmount, allCoins, coinCounts);
            
            if (exactSolution) {
                Game.Debug.log('payment', '找到精確付款方案:', exactSolution);
                return exactSolution;
            }
            
            // 策略2: 找零最小值方案
            Game.Debug.log('payment', '找不到精確付款，尋找找零最小的方案');
            
            let bestSolution = null;
            let minChange = Infinity;
            
            // 生成所有可能的付款組合，找出找零最小的
            function generatePaymentCombinations(coinsList, counts) {
                const combinations = [];
                
                // 遞歸生成所有可能的組合
                function backtrack(index, currentCombination, currentSum) {
                    if (currentSum >= targetAmount) {
                        combinations.push({
                            coins: currentCombination.slice(),
                            sum: currentSum,
                            change: currentSum - targetAmount
                        });
                        return;
                    }
                    
                    if (index >= coinsList.length) {
                        return;
                    }
                    
                    const coin = coinsList[index];
                    const maxCount = counts[coin];
                    
                    // 嘗試使用0到maxCount個這種面額的錢幣
                    for (let count = 0; count <= maxCount; count++) {
                        // 添加count個當前面額的錢幣
                        for (let i = 0; i < count; i++) {
                            currentCombination.push(coin);
                        }
                        
                        backtrack(index + 1, currentCombination, currentSum + coin * count);
                        
                        // 回溯，移除添加的錢幣
                        for (let i = 0; i < count; i++) {
                            currentCombination.pop();
                        }
                    }
                }
                
                backtrack(0, [], 0);
                return combinations;
            }
            
            // 對於大數量的錢幣，使用簡化的貪心方法避免組合爆炸
            const totalCoins = Object.values(coinCounts).reduce((a, b) => a + b, 0);
            
            if (totalCoins > 20) {
                // 使用貪心算法：找到能支付且找零最小的單一錢幣
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
                
                // 如果沒有單一錢幣能支付，使用貪心組合
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
            } else {
                // 對於少量錢幣，使用完整的組合搜索
                const combinations = generatePaymentCombinations(allCoins, coinCounts);
                
                // 篩選出能夠支付的組合
                const validCombinations = combinations.filter(combo => combo.sum >= targetAmount);
                
                if (validCombinations.length > 0) {
                    // 找出找零最小的組合
                    validCombinations.sort((a, b) => {
                        if (a.change !== b.change) {
                            return a.change - b.change; // 找零最小優先
                        }
                        return a.coins.length - b.coins.length; // 錢幣數最少優先
                    });
                    
                    bestSolution = validCombinations[0].coins;
                    minChange = validCombinations[0].change;
                }
            }
            
            if (bestSolution) {
                Game.Debug.log('payment', `找到找零最小方案: ${bestSolution}, 找零: ${minChange}元`);
                return bestSolution;
            }
            
            // 策略3: 最後備用方案
            Game.Debug.log('payment', '使用最終備用方案');
            const finalCounts = { ...coinCounts };
            const finalSolution = [];
            let remaining = targetAmount;
            
            const coinsLargeToSmall = allCoins.slice().sort((a, b) => b - a);
            for (const coin of coinsLargeToSmall) {
                while (remaining > 0 && finalCounts[coin] > 0) {
                    finalSolution.push(coin);
                    remaining -= coin;
                    finalCounts[coin]--;
                }
                if (remaining <= 0) break;
            }
            
            Game.Debug.log('payment', '最終解決方案:', finalSolution);
            return finalSolution || [];
        },
        
        // 生成付款提示HTML（參考單元4簡單模式）
        generatePaymentHints(optimalPayment) {
            Game.Debug.log('payment', '生成付款提示:', optimalPayment);
            
            // 檢查是否有有效的付款方案
            if (!optimalPayment || optimalPayment.length === 0) {
                Game.Debug.log('payment', '沒有付款方案，返回空字符串');
                return '';
            }
            
            // 初始化droppedItems狀態
            if (!this.state.gameState.droppedItems || this.state.gameState.droppedItems.length !== optimalPayment.length) {
                this.state.gameState.droppedItems = new Array(optimalPayment.length).fill(null);
            }
            
            // 為每個提示位置分配具體的錢包錢幣
            if (!this.state.gameState.hintMoneyMapping) {
                this.state.gameState.hintMoneyMapping = new Array(optimalPayment.length).fill(null);
                const usedWalletIndices = new Set();

                Game.Debug.log('hint', '🔍 [付款提示映射] 開始建立映射');
                Game.Debug.log('hint', '🔍 [付款提示映射] 最佳方案:', optimalPayment);
                Game.Debug.log('hint', '🔍 [付款提示映射] 錢包內容:', this.state.gameState.playerWallet.map(m => `${m.name}(${m.id})`));

                optimalPayment.forEach((value, index) => {
                    // 找到錢包中尚未被分配的相同面額錢幣（用陣列索引追蹤，避免重複id問題）
                    const walletIndex = this.state.gameState.playerWallet.findIndex((m, idx) =>
                        m.value === value && !usedWalletIndices.has(idx)
                    );
                    if (walletIndex >= 0) {
                        const availableMoney = this.state.gameState.playerWallet[walletIndex];
                        this.state.gameState.hintMoneyMapping[index] = availableMoney;
                        usedWalletIndices.add(walletIndex);
                        Game.Debug.log('hint', `🔍 [付款提示映射] 位置${index}: ${value}元 → ${availableMoney.name}(${availableMoney.id})`);
                    } else {
                        Game.Debug.warn('hint', `🔍 [付款提示映射] 位置${index}: ${value}元 → 找不到可用錢幣`);
                    }
                });

                Game.Debug.log('hint', '🔍 [付款提示映射] 映射完成:', this.state.gameState.hintMoneyMapping.map(m => m ? m.name : 'null'));
            }
            
            // 創建帶有原始索引的陣列，然後按面額排序（大到小）
            const paymentWithIndex = optimalPayment.map((value, originalIndex) => ({
                value,
                originalIndex
            }));
            
            // 按面額排序：大金額在左，小金額在右
            paymentWithIndex.sort((a, b) => b.value - a.value);
            
            let hintsHTML = '';
            paymentWithIndex.forEach(({ value, originalIndex }) => {
                const moneyData = this.storeData.moneyItems.find(m => m.value === value);
                if (moneyData) {
                    const droppedItem = this.state.gameState.droppedItems[originalIndex];
                    const isLitUp = droppedItem !== null;
                    
                    // 如果已經放置錢幣，使用放置的錢幣圖片；否則使用映射的錢包錢幣圖片
                    let imageSrc;
                    if (isLitUp) {
                        imageSrc = droppedItem.imageSrc;
                    } else {
                        const mappedMoney = this.state.gameState.hintMoneyMapping[originalIndex];
                        imageSrc = mappedMoney ? (mappedMoney.displayImage || mappedMoney.images.front) : moneyData.images.front;
                    }
                    const hintClass = isLitUp ? 'hint-item lit-up' : 'hint-item faded';
                    const isBanknoteHint = value >= 100;
                    const hintImgStyle = isBanknoteHint
                        ? 'width: 100px; height: auto; max-height: 60px; object-fit: contain;'
                        : 'width: 50px; height: 50px; object-fit: contain;';

                    hintsHTML += `<div class="${hintClass}" data-value="${value}" data-position="${originalIndex}">
                        <img src="${imageSrc}" alt="${moneyData.name}" style="${hintImgStyle}">
                        <div class="hint-value">${moneyData.name}</div>
                    </div>`;
                }
            });
            
            return hintsHTML;
        },

        // 🔧 [配置驅動] 純UI渲染方法，不處理狀態邏輯
        renderPaymentSceneUI() {
            Game.Debug.log('ui', '🎨 [A4-付款場景UI] 渲染付款場景UI');

            const app = document.getElementById('app');
            const selectedItem = this.state.gameState.selectedItem;
            const settings = this.state.settings;

            // 計算最佳付款方案
            const optimalPayment = this.calculateOptimalPayment(selectedItem.price, this.state.gameState.playerWallet);
            Game.Debug.log('payment', '付款場景 - 商品價格:', selectedItem.price);
            Game.Debug.log('payment', '付款場景 - 錢包內容:', this.state.gameState.playerWallet);
            Game.Debug.log('payment', '付款場景 - 錢包面額明細:', this.state.gameState.playerWallet.map(m => m.value).sort((a, b) => b - a));
            Game.Debug.log('payment', '付款場景 - 最佳付款方案:', optimalPayment);
            Game.Debug.log('payment', '付款場景 - 最佳付款方案面額:', optimalPayment);

            // 根據難度決定是否顯示提示
            const difficulty = settings.difficulty;
            const showVisualHints = difficulty === 'easy';
            const showVoiceHints = difficulty === 'easy' || difficulty === 'normal';

            // 🔧 [修復] 確保 droppedItems 在簡單模式下正確初始化
            if (difficulty === 'easy' && optimalPayment && optimalPayment.length > 0) {
                if (!this.state.gameState.droppedItems || this.state.gameState.droppedItems.length !== optimalPayment.length) {
                    this.state.gameState.droppedItems = new Array(optimalPayment.length).fill(null);
                    Game.Debug.log('state', '🔧 [付款場景] 初始化 droppedItems:', this.state.gameState.droppedItems.length, '個位置');
                }

                // 初始化 hintMoneyMapping（用陣列索引追蹤，避免重複id問題）
                if (!this.state.gameState.hintMoneyMapping) {
                    this.state.gameState.hintMoneyMapping = new Array(optimalPayment.length).fill(null);
                    const usedWalletIndices = new Set();

                    optimalPayment.forEach((value, index) => {
                        const walletIndex = this.state.gameState.playerWallet.findIndex((m, idx) =>
                            m.value === value && !usedWalletIndices.has(idx)
                        );
                        if (walletIndex >= 0) {
                            this.state.gameState.hintMoneyMapping[index] = this.state.gameState.playerWallet[walletIndex];
                            usedWalletIndices.add(walletIndex);
                        }
                    });
                }
            }

            // 處理商品顯示邏輯
            let itemDisplayText = '';
            let itemDisplayIcons = '';

            if (selectedItem.category === 'multi-selection') {
                // 組合商品顯示 - 格式：🐟 魚、🥕 胡蘿蔔（emoji大小8rem同第二步）
                itemDisplayText = selectedItem.items.map(item => {
                    const productInfo = this.parseProductDisplay(item, 1);
                    return `${this.getProductIconHTML(item, '8rem')}<span style="font-size:1.8em;font-weight:bold;align-self:center;"> ${productInfo.name}</span>`;
                }).join('、');
                itemDisplayIcons = '';  // 不需要單獨的圖標，因為已包含在文字中
            } else {
                // 單一商品顯示 - 格式：🐟 魚（emoji大小8rem同第二步）
                const productInfo = this.parseProductDisplay(selectedItem, 1);
                itemDisplayText = `${this.getProductIconHTML(selectedItem, '8rem')}<span style="font-size:1.8em;font-weight:bold;align-self:center;"> ${productInfo.name}</span>`;
                itemDisplayIcons = '';
            }

            app.innerHTML = `
                <style>
                    .payment-header-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        width: 100%;
                    }
                    .hint-spacer {
                        flex: 0 0 auto;
                        width: 80px;
                    }
                    /* 🔧 [修正] 移除 flex: 1，確保標題不佔滿空間，允許置中 */
                    .payment-title {
                        text-align: center;
                        font-size: 18px;
                        font-weight: bold;
                        color: #FF9800;
                        margin: 0;
                    }
                    .payment-info-display {
                        text-align: center;
                        margin: 10px 0;
                        line-height: 1.5;
                    }
                    .product-price-info {
                        color: #2196F3;
                        font-weight: bold;
                        margin-right: 20px;
                    }
                    .paid-amount-info {
                        color: #4CAF50;
                        font-weight: bold;
                    }
                    .price-amount {
                        color: #2196F3;
                        font-weight: bold;
                    }
                    .payment-hint-btn {
                        background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
                        border: none;
                        color: white;
                        padding: 8px 12px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        transition: all 0.3s ease;
                        flex: 0 0 auto;
                    }
                    .payment-hint-btn:hover {
                        background: linear-gradient(135deg, #F57C00 0%, #E65100 100%);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    }
                    .payment-hint-btn:active {
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    .payment-hints {
                        margin: 20px 0;
                    }
                    .visual-hints {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        gap: 15px;
                        flex-wrap: nowrap;
                        overflow-x: auto;
                        padding: 10px;
                    }
                    .hint-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 5px;
                        padding: 10px;
                        border-radius: 10px;
                        background: white;
                        border: 2px solid #ddd;
                        min-width: 80px;
                        flex-shrink: 0;
                    }
                    .hint-item.faded {
                        opacity: 0.4;
                        filter: grayscale(80%);
                    }
                    .hint-item.lit-up {
                        opacity: 1;
                        border-color: #4CAF50;
                        background: #E8F5E8;
                        transform: scale(1.05);
                    }
                    .hint-value {
                        font-size: 12px;
                        font-weight: bold;
                        color: #333;
                        text-align: center;
                    }
                </style>
                <div class="store-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">${this.getCurrentStoreInfo().emoji}</span>
                            <span>${this.getCurrentStoreInfo().name}</span>
                        </div>
                        <div class="title-bar-center">第三步：付錢</div>
                        <div class="title-bar-right">
                            <span>第 ${this.state.quiz.currentQuestion + 1} 題 / 共 ${this.state.settings.questionCount || 10} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>

                    <!-- 購買目標物品框 -->
                    <div class="unified-task-frame">
                        <div class="task-header">
                            <h2>購買的物品</h2>
                        </div>
                        <div class="selected-item-display">
                            <div class="item-task-text">${itemDisplayText}${itemDisplayIcons}<span style="align-self:center;font-size:1.8em;font-weight:bold;"> 共${selectedItem.price}元</span></div>
                        </div>
                    </div>

                    <!-- 付款區域（移到錢包上方） -->
                    <div class="payment-selection-area">
                        <div class="payment-area">
                            <!-- 付款區標題、商品價格和已付金額置中顯示 -->
                            <div class="payment-info-display-top" style="display: flex !important; justify-content: center !important; align-items: center !important; flex-wrap: wrap !important; gap: 15px !important; width: 100% !important; margin-bottom: 10px; position: relative;">
                                <h3 class="payment-title">🛒付款區</h3>
                                <span class="payment-info-badge product-price-badge">
                                    商品價格: <span class="price-amount">${selectedItem.price}</span>元
                                </span>
                                <span class="payment-info-badge paid-amount-badge">
                                    已付金額: <span class="paid-amount-value">${difficulty === 'hard' ? '???' : this.state.gameState.currentTransaction.amountPaid}</span>元
                                </span>
                                ${(difficulty === 'hard' || difficulty === 'normal') ? `
                                    <div style="position:absolute;right:10px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:6px;">
                                        <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                                        <button class="payment-hint-btn" onclick="Game.showPaidAmountHint()" title="顯示已付金額">
                                            💡<span class="hint-text">提示</span>
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="payment-zone"
                                 ondrop="Game.handleMoneyDrop(event)"
                                 ondragover="Game.handleDragOver(event)"
                                 ondragenter="Game.handleDragEnter(event)"
                                 ondragleave="Game.handleDragLeave(event)">
                                <div class="payment-placeholder">
                                    將錢幣拖曳到這裡付款
                                </div>
                                <div class="payment-money" id="payment-money" style="display: none;"></div>

                                <!-- 最佳付款提示區域 -->
                                ${optimalPayment && showVisualHints ? `
                                    <div class="payment-hints">
                                        <div class="visual-hints">
                                            ${this.generatePaymentHints(optimalPayment)}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>


                            <button class="confirm-btn" id="confirm-payment" onclick="Game.confirmPayment()" ${difficulty === 'hard' ? '' : 'disabled'}>
                                確認付款
                            </button>
                        </div>
                    </div>

                    <!-- 錢包區域（移到付款區下方） -->
                    <div class="wallet-area-top">
                        <div class="wallet-content wallet-fullwidth"
                             ${(difficulty === 'normal' || difficulty === 'hard') ? `
                             ondrop="Game.handleWalletDrop(event)"
                             ondragover="Game.handleWalletDragOver(event)"
                             ondragenter="Game.handleWalletDragEnter(event)"
                             ondragleave="Game.handleWalletDragLeave(event)"` : ''}>
                            <div class="wallet-total-header">我的錢包 總計：${this.state.gameState.walletTotal}元</div>
                            <div class="wallet-money-icons">
                                ${this.renderWalletContent()}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 重置交易狀態
            this.state.gameState.currentTransaction.amountPaid = 0;
            this.state.gameState.currentTransaction.paidMoney = [];
            this.state.gameState.paidAmountRevealed = false;

            // 初始化時，如果有提示區域，隱藏placeholder
            this.TimerManager.setTimeout(() => {
                const hasHints = document.querySelector('.payment-hints');
                const paymentPlaceholder = document.querySelector('.payment-placeholder');
                if (hasHints && paymentPlaceholder) {
                    paymentPlaceholder.style.display = 'none';
                    Game.Debug.log('hint', '已隱藏付款提示文字，因為有淡化金錢圖示');
                }
            }, 100, 'uiAnimation');

            // 如果有語音提示，播放場景介紹語音
            if (showVoiceHints) {
                this.TimerManager.setTimeout(() => {
                    // 獲取商品名稱
                    const itemName = selectedItem.category === 'multi-selection'
                        ? selectedItem.items.map(item => this.parseProductDisplay(item, 1).speechText).join('、')
                        : this.parseProductDisplay(selectedItem, 1).speechText;

                    // 新的引導語音格式：你購買了×，共×元，請付款
                    const speechText = `你購買了${itemName}，共${this.convertToTraditionalCurrency(selectedItem.price)}，請付款`;
                    this.speech.speak(speechText);
                }, 1000, 'speechDelay');
            }

            // 🔧 [配置驅動] 在錢包渲染完成後重新初始化TouchDragUtility
            this.TimerManager.setTimeout(() => {
                this.initializeTouchDragSupport();
            }, 100, 'uiAnimation');

            // 🆕 簡單模式：啟動視覺延遲機制（付款提示）
            if (this.state.settings.difficulty === 'easy' && this.ClickMode.isEnabled()) {
                this.ClickMode.enableClickModeWithVisualDelay('PaymentHints');
            }
        },

        // 🔧 [配置驅動] 舊的顯示付款場景方法，現已由 SceneManager 取代
        showPaymentScene() {
            Game.Debug.log('flow', '⚠️ [A4-付款場景] showPaymentScene 已被配置驅動架構取代，請使用 SceneManager.switchScene("paying", this)');
            // 🔧 [配置驅動] 直接調用新的場景管理器
            this.SceneManager.switchScene('paying', this);
        },

        // 處理金錢懸停語音
        handleMoneyHover(event) {
            const moneyElement = event.target.closest('.money-item') || event.target.closest('.payment-money-item');
            if (!moneyElement) return;

            const moneyName = moneyElement.dataset.moneyName;
            if (!moneyName) return;

            // 🔧 [修正] 在付錢場景中不播放金錢語音
            if (this.state.gameState.currentScene === 'paying') {
                Game.Debug.log('speech', '在付錢場景中，不播放金錢語音');
                return;
            }

            // 檢查是否正在處理語音
            if (this.state.gameState.isProcessingSpeech) {
                Game.Debug.log('speech', '金錢語音被阻止播放，語音處理中');
                return;
            }

            Game.Debug.log('speech', '播放金錢語音:', moneyName);
            this.speech.speak(moneyName);
        },

        // 處理商品懸停語音
        handleProductHover(event) {
            // 停用第1頁面商品圖示碰觸語音功能
            const currentScene = this.state.gameState.currentScene;
            if (currentScene === 'shopping') {
                Game.Debug.log('speech', '🚫 [A4-商品懸停] 第1頁面商品圖示碰觸語音功能已停用');
                return;
            }

            const productElement = event.target.closest('.product-item');
            if (!productElement) return;

            const productName = productElement.dataset.itemName;
            const productPrice = productElement.dataset.itemPrice;
            const productId = productElement.dataset.itemId;

            Game.Debug.log('speech', 'handleProductHover被調用:', productName, productPrice);
            Game.Debug.log('state', '付款處理狀態:', this.state.gameState.isProcessingPayment);
            Game.Debug.log('state', '語音處理狀態:', this.state.gameState.isProcessingSpeech);

            // 🔧 [修正] 指定任務模式下，在模態視窗顯示前不播放語音
            if (this.state.settings.taskType === 'assigned' &&
                this.state.gameState.currentScene === 'shopping' &&
                !this.state.gameState.hasUserSelectedProduct) {
                Game.Debug.log('speech', '🚫 [指定任務] 模態視窗顯示前，不播放商品語音');
                return;
            }

            // 🔧 [修正] 所有難度模式防重複hover已選中商品的語音機制
            if (this.state.settings.taskType === 'assigned' &&
                this.state.gameState.hasUserSelectedProduct &&
                this.state.gameState.selectedItem &&
                this.state.gameState.selectedItem.id == productId) {
                Game.Debug.log('speech', '🚫 [已選擇] 防止重複hover已選中商品的語音');
                return;
            }

            // 如果正在付款處理中、語音處理中或顯示模態視窗，不播放懸停語音
            if (this.state.gameState.isProcessingPayment || this.state.gameState.isProcessingSpeech || this.state.gameState.isShowingModal) {
                Game.Debug.log('speech', '商品語音被阻止播放，原因:', {
                    isProcessingPayment: this.state.gameState.isProcessingPayment,
                    isProcessingSpeech: this.state.gameState.isProcessingSpeech,
                    isShowingModal: this.state.gameState.isShowingModal
                });
                return;
            }
            
            // 清除之前的語音播放和狀態
            if (this.speech.currentUtterance) {
                window.speechSynthesis.cancel();
            }
            
            // 確保先清除舊狀態，然後設置新狀態
            this.state.gameState.isProcessingSpeech = false;
            this.TimerManager.setTimeout(() => {
                this.state.gameState.isProcessingSpeech = true;

                // 只播放商品名稱和價格，不進行預算檢查
                const speechText = `${productName}，${this.convertToTraditionalCurrency(productPrice)}`;
                Game.Debug.log('speech', '準備播放商品語音:', speechText);
                this.speech.speak(speechText, {
                    callback: () => {
                        Game.Debug.log('speech', '商品語音播放完成');
                        Game.state.gameState.isProcessingSpeech = false;
                    }
                });
            }, 10, 'speechDelay');
            
            // 備用清除機制：2秒後強制清除語音處理狀態
            this.TimerManager.setTimeout(() => {
                if (this.state.gameState.isProcessingSpeech) {
                    Game.Debug.log('speech', '強制清除商品語音處理狀態');
                    this.state.gameState.isProcessingSpeech = false;
                }
            }, 2000, 'speechDelay');
        },

        // 🔧 [新增] 點擊放置功能處理函數
        handleMoneyClick(event) {
            Game.Debug.log('assist', '🎯 [A4點擊除錯] handleMoneyClick 被呼叫');

            // 檢查當前場景，第2步和第3步頁面停用雙擊放置功能
            const currentScene = this.state.gameState.currentScene;
            if (currentScene === 'paying' || currentScene === 'checking') {
                Game.Debug.log('assist', '🚫 [A4點擊除錯] 第2步和第3步頁面已停用雙擊放置功能');
                return;
            }

            // 找到金錢元素
            const moneyElement = event.target.closest('.money-item') || event.target.closest('.payment-money-item');
            if (!moneyElement || !moneyElement.dataset.moneyId) {
                Game.Debug.log('assist', '❌ [A4點擊除錯] 未找到有效的金錢元素');
                return;
            }

            const moneyId = moneyElement.dataset.moneyId;
            const currentTime = Date.now();
            const clickState = this.state.gameState.clickState;
            const difficulty = this.state.settings.difficulty;
            
            Game.Debug.log('assist', '🔍 [A4點擊除錯] 點擊狀態檢查', {
                moneyId: moneyId,
                lastClickedElementId: clickState.lastClickedElement?.dataset?.moneyId,
                timeDiff: currentTime - clickState.lastClickTime,
                isPaymentItem: moneyElement.classList.contains('payment-money-item'),
                doubleClickDelay: clickState.doubleClickDelay
            });
            
            // 判斷是錢包中的錢還是付款區的錢
            const isPaymentMoney = moneyElement.classList.contains('payment-money-item');
            
            if (isPaymentMoney && (difficulty === 'normal' || difficulty === 'hard')) {
                // 付款區的錢 - 點擊一次即取回
                Game.Debug.log('assist', '🔙 [A4點擊除錯] 點擊付款區金錢，執行取回');
                this.handleMoneyReturn(moneyElement);
                this.clearMoneySelection();
                return;
            }
            
            // 錢包中的錢 - 需要雙擊放置
            const isSameElement = clickState.lastClickedElement && 
                                clickState.lastClickedElement.dataset.moneyId === moneyId;
            const isWithinDoubleClickTime = (currentTime - clickState.lastClickTime) < clickState.doubleClickDelay;
            
            if (isSameElement && isWithinDoubleClickTime) {
                // 雙擊 - 執行放置
                Game.Debug.log('assist', '✅ [A4點擊除錯] 偵測到雙擊，執行放置');
                this.executeMoneyPlacement(moneyElement);
                this.clearMoneySelection();
            } else {
                // 單擊 - 選擇金錢
                Game.Debug.log('assist', '🔵 [A4點擊除錯] 第一次點擊，選擇金錢');
                this.selectMoney(moneyElement);
                clickState.lastClickTime = currentTime;
                clickState.lastClickedElement = moneyElement;
            }
        },
        
        // 選擇金錢物品
        selectMoney(moneyElement) {
            // 清除之前的選擇
            this.clearMoneySelection();
            
            // 標記新的選擇
            moneyElement.classList.add('selected-item');
            this.state.gameState.clickState.selectedItem = moneyElement;
            
            // 播放選擇音效
            if (this.audio.selectSound) {
                this.audio.selectSound.play().catch(console.log);
            }
            
            Game.Debug.log('assist', '🎵 [A4點擊除錯] 金錢已選擇', { moneyId: moneyElement.dataset.moneyId });
        },
        
        // 清除金錢選擇狀態
        clearMoneySelection() {
            const selectedItem = this.state.gameState.clickState.selectedItem;
            if (selectedItem) {
                selectedItem.classList.remove('selected-item');
                this.state.gameState.clickState.selectedItem = null;
                Game.Debug.log('assist', '🧹 [A4點擊除錯] 清除選擇狀態');
            }
        },
        
        // 執行金錢放置（模擬拖放邏輯）
        executeMoneyPlacement(moneyElement) {
            const moneyId = moneyElement.dataset.moneyId;
            
            // 找到對應的金錢物品資料
            const moneyItem = this.state.gameState.playerWallet.find(item => item.id === moneyId);
            if (!moneyItem) {
                Game.Debug.error('❌ [A4點擊除錯] 找不到對應的金錢物品');
                return;
            }
            
            Game.Debug.log('assist', '🚀 [A4點擊除錯] 執行金錢放置', { moneyItem: moneyItem.name });
            
            // 根據當前難度決定放置邏輯
            const difficulty = this.state.settings.difficulty;
            
            if (difficulty === 'easy') {
                // 簡單模式：尋找對應的提示位置
                this.handleEasyModeClick(moneyItem, moneyElement);
            } else if (difficulty === 'normal' || difficulty === 'hard') {
                // 普通/困難模式：直接放置到付款區域
                this.handleDirectPaymentClick(moneyItem, moneyElement);
            }
        },
        
        // 簡單模式點擊處理
        handleEasyModeClick(moneyItem, moneyElement) {
            const hintItems = document.querySelectorAll('.hint-item[data-type="money"]');
            const targetHint = Array.from(hintItems).find(item => 
                parseInt(item.dataset.value) === moneyItem.value && !item.classList.contains('completed')
            );
            
            if (targetHint) {
                Game.Debug.log('assist', '✅ [A4點擊除錯] 簡單模式 - 找到對應提示位置');
                
                // 模擬拖放到提示位置
                const mockEvent = {
                    target: targetHint,
                    preventDefault: () => {},
                    dataTransfer: {
                        getData: () => moneyItem.id
                    }
                };
                
                this.handleMoneyDrop(mockEvent);
            } else {
                Game.Debug.log('assist', '❌ [A4點擊除錯] 簡單模式 - 沒有找到對應的提示位置');
                this.audio.playErrorSound();
            }
        },
        
        // 普通/困難模式直接付款處理
        handleDirectPaymentClick(moneyItem, moneyElement) {
            Game.Debug.log('assist', '💰 [A4點擊除錯] 普通/困難模式 - 直接付款');
            
            // 從錢包移除錢幣
            const walletIndex = this.state.gameState.playerWallet.findIndex(m => m.id === moneyItem.id);
            if (walletIndex !== -1) {
                this.state.gameState.playerWallet.splice(walletIndex, 1);
                this.state.gameState.walletTotal -= moneyItem.value;
            }
            
            // 加入付款金額
            this.state.gameState.currentTransaction.amountPaid += moneyItem.value;
            // 確保錢幣不被標記為提示位置放置
            moneyItem.isHintPlacement = false;
            this.state.gameState.currentTransaction.paidMoney.push(moneyItem);
            
            // 播放成功音效
            this.audio.playDropSound();
            
            // 從提示列表移除已放置的錢幣（防止綠色勾勾轉移至同面額錢幣）
            if (this.state.gameState.activeWalletHintList) {
                const hintList = this.state.gameState.activeWalletHintList;
                const idx = hintList.findIndex(h => h.value === moneyItem.value);
                if (idx !== -1) {
                    hintList.splice(idx, 1);
                    if (hintList.length === 0) this.state.gameState.activeWalletHintList = null;
                }
            }

            // 更新UI
            this.updatePaymentDisplay();
            
            // 根據難度決定是否播放語音提示和過度付款檢測
            const difficulty = this.state.settings.difficulty;
            if (difficulty === 'normal') {
                this.state.gameState.isProcessingPayment = true;
                this.state.gameState.isProcessingSpeech = false;
                this.speech.speak(`已放入${moneyItem.name}，目前付款總額${this.convertToTraditionalCurrency(this.state.gameState.currentTransaction.amountPaid)}`, {
                    interrupt: true,
                    callback: () => {
                        this.state.gameState.isProcessingPayment = false;
                        // 🔧 [新增] 普通模式語音播放完成後更新按鈕狀態
                        this.updatePaymentDisplay();
                    }
                });
            } else if (difficulty === 'hard') {
                // 🔧 [移除] 困難模式即時過度付款檢測（點擊版本） - 改為在確認付款時才檢查
                // 原本的即時檢測已移除，現在只在按下確認付款後才會判斷是否過度付款
                // 按提示鈕後解鎖：播放已付金額語音
                if (this.state.gameState.paidAmountRevealed) {
                    const currentAmount = this.state.gameState.currentTransaction.amountPaid;
                    this.speech.speak(`已付${this.convertToTraditionalCurrency(currentAmount)}`, { interrupt: true });
                }
            }

            // 檢查付款是否完成
            this.checkPaymentCompletion();
        },
        
        // 點擊取回付款區金錢
        handleMoneyReturn(moneyElement) {
            const moneyId = moneyElement.dataset.moneyId;
            Game.Debug.log('assist', '🔄 [A4點擊除錯] 處理金錢取回', { moneyId });
            
            // 找到對應的金錢物品
            const paidMoneyIndex = this.state.gameState.currentTransaction.paidMoney.findIndex(m => m.id === moneyId);
            if (paidMoneyIndex === -1) {
                Game.Debug.error('❌ [A4點擊除錯] 找不到對應的已付款金錢');
                return;
            }
            
            const moneyItem = this.state.gameState.currentTransaction.paidMoney[paidMoneyIndex];
            
            // 從付款中移除
            this.state.gameState.currentTransaction.paidMoney.splice(paidMoneyIndex, 1);
            this.state.gameState.currentTransaction.amountPaid -= moneyItem.value;
            
            // 放回錢包
            this.state.gameState.playerWallet.push(moneyItem);
            this.state.gameState.walletTotal += moneyItem.value;
            
            // 播放音效
            if (this.audio.selectSound) {
                this.audio.selectSound.play().catch(console.log);
            }
            
            Game.Debug.log('assist', '✅ [A4點擊除錯] 金錢已取回', { 
                moneyName: moneyItem.name,
                newAmountPaid: this.state.gameState.currentTransaction.amountPaid 
            });
            
            // 更新UI
            this.updatePaymentDisplay();
        },
        
        // 🔧 [新增] 檢查付款是否完成
        checkPaymentCompletion() {
            const transaction = this.state.gameState.currentTransaction;
            const isPaymentComplete = transaction.amountPaid >= transaction.totalCost;
            
            Game.Debug.log('payment', '💰 [A4付款檢查] 檢查付款狀態', {
                amountPaid: transaction.amountPaid,
                totalCost: transaction.totalCost,
                isComplete: isPaymentComplete
            });
            
            if (isPaymentComplete) {
                Game.Debug.log('payment', '✅ [A4付款檢查] 付款已完成');
                // 這裡可以添加付款完成後的邏輯，如顯示找錢或完成提示
                // 目前保持與原有邏輯一致，不自動觸發下一步
            }
        },

        handleMoneyDragStart(event) {
            // 尋找拖拽的金錢元素，可能是 .money-item 或 .payment-money-item
            const moneyElement = event.target.closest('.money-item') || event.target.closest('.payment-money-item');
            
            if (!moneyElement || !moneyElement.dataset.moneyId) {
                Game.Debug.error('無法找到有效的金錢元素或金錢ID');
                event.preventDefault();
                return;
            }
            
            const moneyId = moneyElement.dataset.moneyId;
            
            // 🎵 [新增] 播放拖曳金錢的幣值語音
            const moneyName = moneyElement.dataset.moneyName;
            if (moneyName && this.speechSynthesis && this.speechSynthesis.isReady) {
                Game.Debug.log('speech', '🎵 [A4-拖曳語音] 播放幣值語音:', moneyName);
                this.speechSynthesis.speak(moneyName, { interrupt: false });
            }
            
            event.dataTransfer.setData('text/plain', moneyId);
            event.dataTransfer.effectAllowed = 'move';
        },
        
        // 處理拖曳懸停
        handleDragOver(event) {
            const difficulty = this.state.settings.difficulty;
            const hintItem = event.target.closest('.hint-item');
            const paymentZone = event.target.closest('.payment-zone');
            
            if (difficulty === 'easy' && hintItem) {
                // 簡單模式：只允許拖曳到提示位置
                event.preventDefault(); 
                event.dataTransfer.dropEffect = 'move';
            } else if ((difficulty === 'normal' || difficulty === 'hard') && paymentZone) {
                // 普通和困難模式：允許拖曳到整個付款區域
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
            } else {
                event.dataTransfer.dropEffect = 'none';
            }
        },
        
        // 處理拖曳進入
        handleDragEnter(event) {
            event.preventDefault();
            const difficulty = this.state.settings.difficulty;
            const hintItem = event.target.closest('.hint-item');
            const paymentZone = event.target.closest('.payment-zone');
            
            if (difficulty === 'easy' && hintItem && hintItem.classList.contains('faded')) {
                // 簡單模式：為提示項目添加視覺反饋
                hintItem.classList.add('drag-over-hint');
            } else if ((difficulty === 'normal' || difficulty === 'hard') && paymentZone) {
                // 普通和困難模式：為付款區域添加視覺反饋
                paymentZone.classList.add('drag-over-payment');
            }
        },
        
        // 處理拖曳離開
        handleDragLeave(event) {
            const difficulty = this.state.settings.difficulty;
            const hintItem = event.target.closest('.hint-item');
            const paymentZone = event.target.closest('.payment-zone');
            
            if (difficulty === 'easy' && hintItem) {
                // 簡單模式：移除提示項目的視覺反饋
                hintItem.classList.remove('drag-over-hint');
            } else if ((difficulty === 'normal' || difficulty === 'hard') && paymentZone) {
                // 普通和困難模式：移除付款區域的視覺反饋
                paymentZone.classList.remove('drag-over-payment');
            }
        },
        
        // 處理金錢放置
        handleMoneyDrop(event) {
            event.preventDefault();

            // 🔧 輔助點擊模式：不允許使用者直接拖曳付款，須透過點擊模式操作
            if (event.isTrusted && this.state.settings.clickMode && this.state.gameState.clickModeState?.active) {
                this.audio.playErrorSound();
                return;
            }

            // 清除所有拖拽樣式
            document.querySelectorAll('.hint-item').forEach(item => {
                item.classList.remove('drag-over-hint');
            });
            document.querySelectorAll('.payment-zone').forEach(zone => {
                zone.classList.remove('drag-over-payment');
            });
            
            const dragData = event.dataTransfer.getData('text/plain');
            let moneyItem;

            // 檢查 dragData 是否有效
            if (!dragData) {
                Game.Debug.error('🚫 [A4-拖放] dragData 為 undefined 或 null，無法處理拖放');
                return;
            }

            // 判斷是找零錢幣還是玩家錢包錢幣
            if (dragData.startsWith('change-')) {
                // 找零錢幣格式: change-{changeId}-{moneyValue}
                const parts = dragData.split('-');
                const changeId = parts[1];
                const moneyValue = parseInt(parts[2]);

                Game.Debug.log('coin', '處理找零錢幣拖曳 - changeId:', changeId, 'value:', moneyValue);

                // 從交易記錄中找到對應的找零錢幣
                const changeIndex = parseInt(changeId);
                if (this.state.gameState.currentTransaction &&
                    this.state.gameState.currentTransaction.changeReceived &&
                    this.state.gameState.currentTransaction.changeReceived[changeIndex]) {
                    moneyItem = this.state.gameState.currentTransaction.changeReceived[changeIndex];
                } else {
                    Game.Debug.error('找不到對應的找零錢幣 - changeId:', changeId);
                    return;
                }
            } else {
                // 玩家錢包錢幣
                moneyItem = this.state.gameState.playerWallet.find(m => m.id === dragData);

                if (!moneyItem) {
                    Game.Debug.error('找不到拖曳的錢幣:', dragData);
                    return;
                }
            }
            
            const difficulty = this.state.settings.difficulty;
            
            // 簡單模式：檢查是否拖曳到提示位置（支援付錢頁面的 hint-item 和找零頁面的 change-target）
            if (difficulty === 'easy') {
                const hintItem = event.target.closest('.hint-item, .change-target');
                if (hintItem) {
                    // 支援兩種數據屬性格式：付錢頁面 (position/value) 和找零頁面 (targetIndex/expectedValue)
                    const position = parseInt(hintItem.dataset.position || hintItem.dataset.targetIndex);
                    const expectedValue = parseInt(hintItem.dataset.value || hintItem.dataset.expectedValue);

                    // 判斷是付錢頁面還是找零頁面
                    const isChangeTarget = hintItem.classList.contains('change-target');
                    const targetArray = isChangeTarget ? this.state.gameState.changeDropTargets : this.state.gameState.droppedItems;

                    // 檢查面額是否匹配且位置未被佔用
                    if (targetArray && moneyItem.value === expectedValue &&
                        (isChangeTarget ? !targetArray[position].isPlaced : targetArray[position] === null)) {
                        // 放置到提示位置成功
                        if (isChangeTarget) {
                            // 找零頁面狀態更新
                            targetArray[position].isPlaced = true;
                            targetArray[position].placedMoney = moneyItem;
                            // 點亮該提示位置
                            hintItem.className = hintItem.className.replace('faded', 'lit-up');
                        } else {
                            // 付錢頁面狀態更新
                            targetArray[position] = {
                                moneyItem: moneyItem,
                                imageSrc: moneyItem.displayImage || moneyItem.images.front
                            };
                            // 點亮該提示位置
                            hintItem.className = 'hint-item lit-up';
                        }

                        hintItem.querySelector('img').src = moneyItem.displayImage || moneyItem.images.front;
                    
                    // 從錢包移除
                    if (!dragData.startsWith('change-')) {
                        // 只有玩家錢包的錢幣才需要從錢包移除
                        const walletIndex = this.state.gameState.playerWallet.findIndex(m => m.id === dragData);
                        if (walletIndex !== -1) {
                            this.state.gameState.playerWallet.splice(walletIndex, 1);
                            this.state.gameState.walletTotal -= moneyItem.value;
                        }
                    }
                    
                    // 標記為提示位置付款（僅付錢頁面）
                    moneyItem.isHintPlacement = true;
                    if (!isChangeTarget) {
                        // 只有付錢頁面才更新付款狀態
                        this.state.gameState.currentTransaction.paidMoney.push(moneyItem);
                        this.state.gameState.currentTransaction.amountPaid += moneyItem.value;
                    }
                    
                    Game.Debug.log('coin', `錢幣 ${moneyItem.name} 已放置到提示位置 ${position}`);
                    
                    // 播放成功音效和語音
                    this.audio.playDropSound();
                    
                    // 根據難度決定是否播放語音提示
                    if (difficulty === 'easy' || difficulty === 'normal') {
                        // 設置付款處理標誌，防止懸停語音干擾
                        this.state.gameState.isProcessingPayment = true;
                        this.state.gameState.isProcessingSpeech = false; // 清除一般語音處理標誌

                        // 🔧 [新增] 檢查是否為最後一個提示位置（支援兩種狀態結構）
                        let filledPositions, totalPositions;
                        if (isChangeTarget) {
                            // 找零頁面：檢查 changeDropTargets
                            filledPositions = this.state.gameState.changeDropTargets.filter(item => item.isPlaced).length;
                            totalPositions = this.state.gameState.changeDropTargets.length;
                        } else {
                            // 付錢頁面：檢查 droppedItems
                            if (this.state.gameState.droppedItems && Array.isArray(this.state.gameState.droppedItems)) {
                                filledPositions = this.state.gameState.droppedItems.filter(item => item !== null).length;
                                totalPositions = this.state.gameState.droppedItems.length;
                            } else {
                                Game.Debug.warn('state', '⚠️ droppedItems 未初始化或不是數組');
                                filledPositions = 0;
                                totalPositions = 1;
                            }
                        }
                        const isLastPosition = filledPositions === totalPositions;
                        Game.Debug.log('flow', `🔍 [簡單模式] 已填滿: ${filledPositions}/${totalPositions}, 是否最後位置: ${isLastPosition}`);

                        if (isLastPosition) {
                            // 🔧 [修改] 最後一個位置完成 - 根據頁面類型執行不同處理

                            if (isChangeTarget) {
                                // 找零頁面：觸發找零完成處理
                                // 清除處理標誌
                                this.state.gameState.isProcessingPayment = false;

                                Game.TimerManager.setTimeout(() => {
                                    // 檢查找零是否正確並進入下一階段
                                    Game.checkChangeVerificationResult();
                                }, 1000, 'screenTransition');
                            } else {
                                // 🔧 [修改] 付錢頁面（簡單模式）：播放總額語音，並立即啟用確認付款按鈕
                                const totalAmount = this.state.gameState.currentTransaction.amountPaid;
                                const speechText = `目前總額${totalAmount}元`;

                                // 播放語音（不等待語音完成）
                                this.speech.speak(speechText, { interrupt: true });

                                // 立即啟用按鈕
                                this.state.gameState.isProcessingPayment = false;
                                const confirmBtn = document.getElementById('confirm-payment');
                                if (confirmBtn) {
                                    confirmBtn.disabled = false;
                                    confirmBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                                    confirmBtn.style.cursor = 'pointer';
                                    Game.Debug.log('flow', '✅ [簡單模式] 已立即啟用確認付款按鈕，等待用戶點擊');
                                    // 🎯 簡單模式：顯示確認付款按鈕提示動畫
                                    Game.TimerManager.setTimeout(() => {
                                        confirmBtn.classList.add('step-hint');
                                    }, 300, 'hint');
                                }
                            }
                        } else {
                            // 根據頁面類型使用不同的語音格式
                            let speechText;
                            if (isChangeTarget) {
                                // 找零頁面：語音反饋找零錢放置
                                speechText = `已收取${moneyItem.name}找零`;
                            } else {
                                // 付錢頁面：統一使用新的語音格式：已付款×元，目前總額×元（使用阿拉伯數字）
                                speechText = `已付款${moneyItem.name}，目前總額${this.state.gameState.currentTransaction.amountPaid}元`;
                            }

                            this.speech.speak(speechText, {
                                interrupt: true,
                                callback: () => {
                                    // 語音完成後清除處理標誌
                                    this.state.gameState.isProcessingPayment = false;
                                }
                            });
                        }
                    }
                    // 困難模式不播放語音提示
                    } else {
                        // 錯誤情況：面額不匹配或位置已被佔用
                        Game.Debug.log('coin', '面額不匹配或位置已被佔用');
                        this.handleInvalidDrop(moneyItem);
                        return;
                    }
                } else {
                    // 簡單模式但沒有找到提示項目
                    Game.Debug.log('flow', '簡單模式：沒有找到有效的提示位置');
                    this.handleInvalidDrop(moneyItem);
                    return;
                }
            } else if (difficulty === 'normal' || difficulty === 'hard') {
                // 普通和困難模式：直接付款處理
                const paymentZone = event.target.closest('.payment-zone, .payment-area, .payment-selection-area');
                if (paymentZone) {
                    // 成功拖曳到付款區域，直接將錢幣加入付款
                    Game.Debug.log('payment', `${difficulty}模式 - 直接付款:`, moneyItem.name);
                    
                    // 從錢包移除錢幣
                    if (!dragData.startsWith('change-')) {
                        // 只有玩家錢包的錢幣才需要從錢包移除
                        const walletIndex = this.state.gameState.playerWallet.findIndex(m => m.id === dragData);
                        if (walletIndex !== -1) {
                            this.state.gameState.playerWallet.splice(walletIndex, 1);
                            this.state.gameState.walletTotal -= moneyItem.value;
                        }
                    }
                    
                    // 加入付款金額
                    this.state.gameState.currentTransaction.amountPaid += moneyItem.value;
                    // 確保錢幣不被標記為提示位置放置
                    moneyItem.isHintPlacement = false;
                    this.state.gameState.currentTransaction.paidMoney.push(moneyItem);
                    
                    // 播放成功音效
                    this.audio.playDropSound();
                    
                    // 根據難度決定是否播放語音提示
                    if (difficulty === 'normal') {
                        // 設置付款處理標誌，防止懸停語音干擾
                        this.state.gameState.isProcessingPayment = true;
                        this.state.gameState.isProcessingSpeech = false;

                        // 🔧 [修正] 普通模式：移除即時過度付款檢查，只播放付款金額
                        const currentAmount = this.state.gameState.currentTransaction.amountPaid;

                        // 只播放付款確認，不做過度付款檢查（改為在確認付款時檢查）
                        this.speech.speak(`已放入${moneyItem.name}，目前付款總額${this.convertToTraditionalCurrency(currentAmount)}`, {
                            interrupt: true,
                            callback: () => {
                                // 語音完成後清除處理標誌
                                this.state.gameState.isProcessingPayment = false;
                            }
                        });
                    }
                    // 困難模式：按提示鈕後解鎖，才播放已付金額語音
                    if (difficulty === 'hard' && this.state.gameState.paidAmountRevealed) {
                        const currentAmount = this.state.gameState.currentTransaction.amountPaid;
                        this.speech.speak(`已付${this.convertToTraditionalCurrency(currentAmount)}`, { interrupt: true });
                    }
                } else {
                    // 拖曳到付款區域外的其他地方
                    Game.Debug.log('coin', '不能放置到付款區域外');
                    this.handleInvalidDrop(moneyItem);
                    return;
                }
            } else {
                // 簡單模式但拖曳到非提示位置的其他區域 - 這是不允許的
                Game.Debug.log('coin', '不能放置到非提示位置');
                this.handleInvalidDrop(moneyItem);
                return;
            }

            // 🔧 [移除] 即時檢測，改為在確認付款時才判斷

            // 從提示列表移除已放置的錢幣（防止綠色勾勾轉移至同面額錢幣）
            if (this.state.gameState.activeWalletHintList && moneyItem) {
                const hintList = this.state.gameState.activeWalletHintList;
                const idx = hintList.findIndex(h => h.value === moneyItem.value);
                if (idx !== -1) {
                    hintList.splice(idx, 1);
                    if (hintList.length === 0) this.state.gameState.activeWalletHintList = null;
                }
            }

            // 更新顯示
            this.updatePaymentDisplay();
        },
        
        // 處理無效的拖拽放置
        handleInvalidDrop(moneyItem) {
            // 播放錯誤音效
            this.audio.playErrorSound();
            
            // 錢幣返回錢包（實際上不需要操作，因為錢幣從未被移除）
            // 但為了視覺效果，可以添加一個短暫的反饋
            
            // 根據難度決定是否播放語音提示
            const difficulty = this.state.settings.difficulty;
            if (difficulty === 'easy' || difficulty === 'normal') {
                const hintExists = this.state.gameState.droppedItems && this.state.gameState.droppedItems.length > 0;
                if (hintExists && difficulty === 'easy') {
                    // 簡單模式：提到淡化圖示
                    this.speech.speak('請放置正確的金錢', { interrupt: true });
                } else if (hintExists && difficulty === 'normal') {
                    // 普通模式：不提淡化圖示（因為沒有視覺提示）
                    this.speech.speak('請將金錢放置正確的付款位置', { interrupt: true });
                } else {
                    this.speech.speak('付款區域不接受此操作', { interrupt: true });
                }
            }
            // 困難模式不播放語音提示
            
            Game.Debug.log('coin', `無效拖拽：${moneyItem.name} 已返回錢包`);
        },
        
        // 更新付款顯示
        updatePaymentDisplay() {
            const transaction = this.state.gameState.currentTransaction;
            const paidAmount = transaction.amountPaid;
            const itemPrice = transaction.totalCost;
            const changeAmount = paidAmount - itemPrice;

            // 🔧 [修正] 更新付款區域的已付金額顯示
            const paidAmountElement = document.querySelector('.paid-amount-value');
            if (paidAmountElement) {
                const difficulty = this.state.settings.difficulty;
                if (difficulty === 'hard' && !this.state.gameState.paidAmountRevealed) {
                    paidAmountElement.textContent = '???';
                } else {
                    paidAmountElement.textContent = `${paidAmount}`;
                }
            }

            // 更新錢包顯示 - 只更新金錢圖示區域，保持結構完整
            const walletMoneyIcons = document.querySelector('.wallet-money-icons');
            if (walletMoneyIcons) {
                walletMoneyIcons.innerHTML = this.renderWalletContent();
                // 重新套用提示勾勾（若有活躍提示）
                if (this.state.gameState.activeWalletHintList && this.state.gameState.activeWalletHintList.length > 0) {
                    this.showWalletHintWithTicks(this.state.gameState.activeWalletHintList);
                }

                // 🔧 [性能修復] 錢包更新後重新初始化TouchDragUtility
                this.TimerManager.setTimeout(() => {
                    this.initializeTouchDragSupport();
                }, 50, 'uiAnimation');
            }

            // 更新錢包總計標題
            const walletTotalHeader = document.querySelector('.wallet-total-header');
            if (walletTotalHeader) {
                walletTotalHeader.textContent = `我的錢包 總計：${this.state.gameState.walletTotal}元`;
            }
            
            // 顯示付款區域的錢幣（不顯示已放置在提示位置的錢幣）
            const paymentMoney = document.getElementById('payment-money');
            const paymentPlaceholder = document.querySelector('.payment-placeholder');
            
            // 過濾出只放置在一般區域的錢幣（排除提示位置的錢幣）
            const generalAreaMoney = transaction.paidMoney.filter(money => !money.isHintPlacement);
            
            if (generalAreaMoney.length > 0) {
                paymentPlaceholder.style.display = 'none';
                paymentMoney.style.display = 'flex';
                
                const difficulty = this.state.settings.difficulty;
                const isDraggable = difficulty === 'normal' || difficulty === 'hard';
                
                paymentMoney.innerHTML = generalAreaMoney.map((money, index) => {
                    const randomFace = Math.random() < 0.5 ? 'front' : 'back';
                    const imagePath = money.images[randomFace];
                    const isBanknote = money.value >= 100;
                    const imgStyle = isBanknote
                        ? 'width: 100px; height: auto; max-height: 60px; object-fit: contain;'
                        : 'width: 50px; height: 50px;';
                    return `
                    <div class="payment-money-item lit-up ${isDraggable ? 'draggable-back' : ''}"
                         ${isDraggable ? `draggable="true" ondragstart="Game.handleMoneyDragStart(event)"` : ''}
                         onclick="Game.handleMoneyClick(event)"
                         data-money-id="${money.id}"
                         data-instance-id="${money.id}_instance_${index}">
                        <img src="${imagePath}" alt="${money.name}" style="${imgStyle}">
                        <div class="hint-value">${money.name}</div>
                    </div>
                `;
                }).join('');
                
                // 🔧 [關鍵修正] 付款區域錢幣渲染完成後重新初始化TouchDragUtility
                if (isDraggable) {
                    this.TimerManager.setTimeout(() => {
                        this.initializeTouchDragSupport();
                    }, 50, 'uiAnimation');
                }
            } else {
                // 如果沒有在一般區域的錢幣，隱藏payment-money
                paymentMoney.style.display = 'none';
                // 如果有提示區域且沒有一般付款，也隱藏placeholder
                const hasHints = document.querySelector('.payment-hints');
                if (hasHints) {
                    paymentPlaceholder.style.display = 'none';
                }
            }
            
            // 付款摘要功能已移除
            
            // 更新確認按鈕狀態
            const confirmBtn = document.getElementById('confirm-payment');
            const difficulty = this.state.settings.difficulty;

            if (difficulty === 'hard') {
                // 困難模式：按鈕始終可用，文字不變
                confirmBtn.disabled = false;
                confirmBtn.classList.add('ready');
                confirmBtn.textContent = '確認付款';
            } else if (difficulty === 'normal') {
                // 🔧 [修正] 普通模式：金額足夠時即可啟用，不需等待語音播放完成
                if (paidAmount >= itemPrice) {
                    // 金額足夠時啟用（即使語音播放中也允許點擊）
                    confirmBtn.disabled = false;
                    confirmBtn.classList.add('ready');
                    confirmBtn.textContent = '確認付款';
                } else {
                    // 金額不足時禁用
                    confirmBtn.disabled = true;
                    confirmBtn.classList.remove('ready');
                    confirmBtn.textContent = `還需要${itemPrice - paidAmount}元`;
                }
            } else {
                // 🔧 [修正] 簡單模式：如果正在處理付款語音，不要啟用按鈕（避免與語音回調衝突）
                if (this.state.gameState.isProcessingPayment) {
                    // 正在播放「目前總額...」語音，保持按鈕禁用狀態
                    // 按鈕會在語音播放完成後由回調函數啟用
                    Game.Debug.log('payment', '🔧 [付款顯示] 正在處理付款語音，保持按鈕禁用');
                    confirmBtn.disabled = true;
                    confirmBtn.classList.remove('ready');
                    // 🔧 [修復] 簡單模式保持按鈕文字為「確認付款」，不顯示「處理中...」
                    confirmBtn.textContent = '確認付款';
                } else if (paidAmount >= itemPrice) {
                    // 足夠金額且沒在處理語音時才啟用
                    confirmBtn.disabled = false;
                    confirmBtn.classList.add('ready');
                    confirmBtn.textContent = '確認付款';
                } else {
                    // 金額不足時禁用
                    confirmBtn.disabled = true;
                    confirmBtn.classList.remove('ready');
                    confirmBtn.textContent = `還需要${itemPrice - paidAmount}元`;
                }
            }
        },
        
        // 檢查是否有多餘的金錢（普通模式專用）
        hasExcessMoney(paidMoney, targetAmount) {
            // 遍歷每個已付款的金錢，檢查移除任何一個後是否仍能滿足付款需求
            for (let i = 0; i < paidMoney.length; i++) {
                const moneyToRemove = paidMoney[i];
                const remainingAmount = paidMoney
                    .filter((_, index) => index !== i)
                    .reduce((sum, money) => sum + money.value, 0);

                // 如果移除這個金錢後仍然大於等於目標金額，說明這個金錢是多餘的
                if (remainingAmount >= targetAmount) {
                    Game.Debug.log('payment', `發現多餘金錢: ${moneyToRemove.name}，移除後剩餘金額: ${remainingAmount}元`);
                    return moneyToRemove; // 返回具體的多餘金錢對象
                }
            }
            return false;
        },

        // =====================================================
        // 🌟 【修正版 v2】更智能的過度付款檢測
        // 新邏輯：直接計算「最佳的退款組合」
        // =====================================================
        findOptimalReturnMoney(paidMoney, itemPrice) {
            const paidAmount = paidMoney.reduce((sum, money) => sum + money.value, 0);
            Game.Debug.log('payment', `🔍 [新智能檢測 v2] 開始尋找最佳退款組合`, {
                itemPrice,
                paidAmount,
                paidMoney: paidMoney.map(m => m.value)
            });

            // 步驟 1: 生成所有可能的「退款」組合
            // 我們從已付的錢中，看看可以退回哪些組合
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
                Game.Debug.log('payment', '💡 [新智能檢測 v2] 當前付款已是最佳組合，無需退款。');
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

            Game.Debug.log('payment', `💡 [新智能檢測 v2] 建議的最佳退款組合:`, finalChoice.map(m => m.value));

            return finalChoice;
        },

        // 🔧 [新增] 生成金錢組合（用於找最優付款方案）
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

        // =====================================================
        // 🌟 【新增】(困難模式) 輔助函式：退回所有已付金錢
        // =====================================================
        returnAllPaidMoney() {
            const transaction = this.state.gameState.currentTransaction;
            const paidMoney = [...transaction.paidMoney]; // 複製陣列以安全操作

            if (paidMoney.length === 0) {
                return; // 如果付款區沒錢，則不執行任何操作
            }

            // 將所有已付的錢移回錢包
            this.state.gameState.playerWallet.push(...paidMoney);

            // 更新錢包總額
            const amountReturned = paidMoney.reduce((sum, money) => sum + money.value, 0);
            this.state.gameState.walletTotal += amountReturned;

            // 重置付款區狀態
            transaction.paidMoney = [];
            transaction.amountPaid = 0;

            // 播放音效並更新UI
            this.audio.playDropSound(); // 您也可以換成一個更適合的"退回"音效
            this.updatePaymentDisplay();
            Game.Debug.log('flow', `[困難模式] ${amountReturned}元已全部退回錢包。`);
        },

        // =====================================================
        // 🌟 【新增】(困難模式) 輔助函式：生成最佳付款語音
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
                const moneyName = this.storeData.moneyItems.find(m => m.value === value)?.name || `${value}元`;
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

        // 🔧 [新增] 生成智能退回提示語音
        generateReturnMoneyMessage(moneyToReturn) {
            if (!moneyToReturn || moneyToReturn.length === 0) return '';

            Game.Debug.log('payment', '🔍 [A4-退款訊息] 原始退款金錢列表:', moneyToReturn);

            // 按面額大小排序（從大到小）
            const sortedMoney = [...moneyToReturn].sort((a, b) => b.value - a.value);
            Game.Debug.log('payment', '🔍 [A4-退款訊息] 排序後金錢列表:', sortedMoney);

            // 統計每種面額的數量
            const countByValue = {};
            sortedMoney.forEach(money => {
                countByValue[money.value] = (countByValue[money.value] || 0) + 1;
            });
            Game.Debug.log('payment', '🔍 [A4-退款訊息] 面額統計:', countByValue);

            // 生成語音文字
            const moneyParts = Object.entries(countByValue)
                .sort(([a], [b]) => parseInt(b) - parseInt(a)) // 按面額從大到小
                .map(([value, count]) => {
                    const traditionalValue = this.convertToTraditionalCurrency(parseInt(value));
                    const part = `${count}個${value}元`;
                    Game.Debug.log('payment', `🔍 [A4-退款訊息] 面額${value}元 → ${part}`);
                    return part;
                });

            Game.Debug.log('payment', '🔍 [A4-退款訊息] 語音部分列表:', moneyParts);

            let finalMessage = '';
            if (moneyParts.length === 1) {
                finalMessage = `請拿回${moneyParts[0]}`;
            } else if (moneyParts.length === 2) {
                finalMessage = `請拿回${moneyParts.join('、')}`;
            } else {
                const lastPart = moneyParts.pop();
                finalMessage = `請拿回${moneyParts.join('、')}、${lastPart}`;
            }

            Game.Debug.log('speech', '🗣️ [A4-退款訊息] 最終語音訊息:', finalMessage);
            return finalMessage;
        },

        // 計算最佳付款組合（用於不足金額時的提示）- 重命名避免衝突
        calculateOptimalPaymentForInsufficientAmount(neededAmount) {
            const wallet = this.state.gameState.playerWallet;
            const result = [];
            let remaining = neededAmount;

            // 按面額從大到小排序
            const sortedWallet = wallet.slice().sort((a, b) => b.value - a.value);

            for (const money of sortedWallet) {
                while (remaining >= money.value && remaining > 0) {
                    result.push(money);
                    remaining -= money.value;

                    if (remaining === 0) {
                        break;
                    }
                }
                if (remaining === 0) {
                    break;
                }
            }

            // 如果無法精確組成需要的金額，返回最接近的組合
            if (remaining > 0 && result.length === 0) {
                // 找最小面額的錢
                const minMoney = sortedWallet[sortedWallet.length - 1];
                if (minMoney) {
                    result.push(minMoney);
                }
            }

            return result;
        },

        // 在付款區閃爍提示需要收回的金錢
        // 在付款區顯示錯誤提示（新版：紅色×動畫）
        highlightPaymentMoney(moneyList) {
            Game.Debug.log('hint', '🔥 [錯誤提示] highlightPaymentMoney 被調用', { moneyList });

            // 清除之前的錯誤提示效果
            const existingHighlights = document.querySelectorAll('.payment-money-item.show-error-x');
            existingHighlights.forEach(item => {
                item.classList.remove('show-error-x');
            });

            // 統計需要提示的錢幣數量
            const moneyCount = {};
            moneyList.forEach(money => {
                const value = money.value || (typeof money.id === 'string' ? parseInt(money.id.split('_')[1]) : money.id);
                moneyCount[value] = (moneyCount[value] || 0) + 1;
            });
            Game.Debug.log('hint', '🔥 [錯誤提示] 需要提示的錢幣統計:', moneyCount);

            // 獲取所有付款區的錢幣元素
            const allPaymentItems = document.querySelectorAll('.payment-money-item');

            // 按面額分組付款區錢幣
            const paymentItemsByValue = {};
            allPaymentItems.forEach(item => {
                const moneyId = item.dataset.moneyId;
                const value = parseInt(moneyId.split('_')[1]);
                if (!paymentItemsByValue[value]) {
                    paymentItemsByValue[value] = [];
                }
                paymentItemsByValue[value].push(item);
            });

            // 為相應數量的付款區錢幣添加錯誤提示效果
            let highlightCount = 0;
            Object.keys(moneyCount).forEach(valueStr => {
                const value = parseInt(valueStr);
                const needCount = moneyCount[valueStr];
                const availableItems = paymentItemsByValue[value] || [];

                const itemsToHighlight = availableItems.slice(0, Math.min(needCount, availableItems.length));
                itemsToHighlight.forEach(element => {
                    // 【核心修改】將 class 從 'flash-highlight' 改為 'show-error-x'
                    element.classList.add('show-error-x');
                    highlightCount++;
                    Game.Debug.log('hint', `🔥 [錯誤提示] 已為錢幣 ${element.dataset.moneyId} 添加×動畫`);
                });
            });
            Game.Debug.log('hint', '🔥 [錯誤提示] 實際添加效果的錢幣數量:', highlightCount);

            // 3秒後移除錯誤提示效果
            this.TimerManager.setTimeout(() => {
                const highlightedItems = document.querySelectorAll('.show-error-x');
                Game.Debug.log('hint', `🔥 [錯誤提示] 3秒後移除×動畫，數量: ${highlightedItems.length}`);
                highlightedItems.forEach(item => {
                    item.classList.remove('show-error-x');
                });
            }, 3000, 'uiAnimation');
        },


        // =====================================================
        // 🌟 【修正版 v2】確認付款 - 讓困難模式更智能
        // =====================================================
        confirmPayment() {
            // --- 步驟 1: 初始狀態檢查與設置 ---
            const difficulty = this.state.settings.difficulty;
            if (difficulty === 'normal') {
                if (this.state.gameState.isProcessingPayment || this.state.gameState.isProcessingSpeech) {
                    window.speechSynthesis.cancel();
                    this.state.gameState.isProcessingPayment = false;
                    this.state.gameState.isProcessingSpeech = false;
                    this.updatePaymentDisplay();
                }
            }

            const confirmBtn = document.getElementById('confirm-payment');
            if (confirmBtn && confirmBtn.disabled) {
                return;
            }

            const transaction = this.state.gameState.currentTransaction;
            const paidAmount = transaction.amountPaid;
            const itemPrice = transaction.totalCost;

            // --- 步驟 2: 付款金額不足檢查 ---
            if (paidAmount < itemPrice) {
                this.audio.playErrorSound();
                const neededAmount = itemPrice - paidAmount;

                if (difficulty === 'normal') {
                    // 🆕 [普通模式] 付款錯誤計數
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    window.LearningTracker?.logStep?.(`付款（應付${itemPrice}元）`, false);
                    this.state.gameState.stepErrorCounts.payment++;
                    const errorCount = this.state.gameState.stepErrorCounts.payment;
                    Game.Debug.log('hint', `🔴 [付款] 普通模式錯誤次數: ${errorCount}`);

                    // 退回所有金錢到錢包（同困難模式，不顯示×提示）
                    this.returnAllPaidMoney();

                    if (errorCount >= 3) {
                        // 第3次後：同提示鈕邏輯（退回後重新計算全錢包最佳組合）
                        const allAvailableMoney = [...this.state.gameState.playerWallet];
                        const optimalPayment = this.calculateOptimalPayment(itemPrice, allAvailableMoney);
                        const speechText = this.generateOptimalPaymentSpeech(optimalPayment);
                        this.speech.speak(speechText, { interrupt: true });
                        if (optimalPayment && optimalPayment.length > 0) {
                            this.showWalletHintWithTicks(optimalPayment.map(val => ({ value: val })));
                        }
                    } else {
                        this.speech.speak('付款金額不足，請重新付款', { interrupt: true });
                    }
                } else if (difficulty === 'hard') {
                    // 困難模式：先語音提示，語音完成後退回所有錢
                    this.speech.speak('你付的錢不夠，請再試一次', {
                        interrupt: true,
                        callback: () => {
                            this.returnAllPaidMoney(); // 語音完成後退回所有錢
                        }
                    });
                } else {
                    this.speech.speak('付款金額不足，請繼續拖曳錢幣', { interrupt: true });
                }
                return;
            }

            // --- 步驟 3: 【核心修正】智能過度付款檢查 (同時適用於普通和困難模式) ---
            if ((difficulty === 'normal' || difficulty === 'hard') && paidAmount > itemPrice) {
                const paidMoney = transaction.paidMoney.filter(money => !money.isHintPlacement);
                const moneyToReturn = this.findOptimalReturnMoney(paidMoney, itemPrice);

                // 情況 A: moneyToReturn > 0，代表玩家付了錢，但有更好的付款方式 (例如付167元，錢包有100,50,10,5,1元，卻付了200元)。
                // 這種情況下，提示錯誤。
                if (moneyToReturn && moneyToReturn.length > 0) {
                    this.audio.playErrorSound();

                    if (difficulty === 'normal') {
                        // 🆕 [普通模式] 付款錯誤計數（付太多錢）
                        window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                        window.LearningTracker?.logStep?.(`付款（應付${itemPrice}元）`, false);
                        this.state.gameState.stepErrorCounts.payment++;
                        const errorCount = this.state.gameState.stepErrorCounts.payment;
                        Game.Debug.log('hint', `🔴 [付款] 普通模式錯誤次數: ${errorCount}`);

                        // 退回所有金錢到錢包（不顯示×提示）
                        this.returnAllPaidMoney();

                        if (errorCount >= 3) {
                            // 第3次後：同提示鈕邏輯
                            const allAvailableMoney = [...this.state.gameState.playerWallet];
                            const optimalPayment = this.calculateOptimalPayment(itemPrice, allAvailableMoney);
                            const speechText = this.generateOptimalPaymentSpeech(optimalPayment);
                            this.speech.speak(speechText, { interrupt: true });
                            if (optimalPayment && optimalPayment.length > 0) {
                                this.showWalletHintWithTicks(optimalPayment.map(val => ({ value: val })));
                            }
                        } else {
                            this.speech.speak('你付了太多的錢，請重新付款', { interrupt: true });
                        }
                    } else { // 困難模式
                        // 困難模式只給一般提示，並退回所有錢
                        this.speech.speak('你付了太多的錢，請再試一次', {
                            interrupt: true,
                            callback: () => {
                                this.returnAllPaidMoney();
                            }
                        });
                    }
                    return; // 中斷流程，讓用戶修正
                }

                // 情況 B: moneyToReturn 是 [] (空陣列)，代表雖然多付了，但這是最佳付款方式 (例如 167元付200元)。
                // 這種情況我們 **不做任何事**，直接讓程式繼續往下執行到付款成功的部分。
            }

            // --- 步驟 4: 付款成功流程 ---
            window.LearningTracker?.logStep?.(`付款（應付${itemPrice}元）`, true);
            this.state.gameState.isProcessingPayment = true;
            if (confirmBtn) {
                confirmBtn.disabled = true;
                // 🔧 [修復] 簡單模式保持按鈕文字為「確認付款」，其他模式顯示「處理中...」
                if (difficulty !== 'easy') {
                    confirmBtn.textContent = '處理中...';
                }
            }

            transaction.changeExpected = paidAmount - itemPrice;

            // 🔧 [修正] 簡單模式：直接執行後續流程（不播放煙火動畫和成功音效）
            if (difficulty === 'easy') {
                Game.Debug.log('flow', '📋 [簡單模式] 確認付款，執行後續流程');
                // 直接執行後續流程，保留收銀機音效
                this.proceedWithPaymentSuccess(paidAmount, difficulty, transaction, confirmBtn);
            } else {
                // 普通/困難模式：直接執行後續流程
                this.proceedWithPaymentSuccess(paidAmount, difficulty, transaction, confirmBtn);
            }
        },

        // 🔧 [新增] 執行付款成功後的後續流程（獨立為函數，供簡單模式延遲調用）
        proceedWithPaymentSuccess(paidAmount, difficulty, transaction, confirmBtn) {
            // 清除提示勾勾（付款成功，不再需要提示）
            this.state.gameState.activeWalletHintList = null;
            // 🔧 [修復] 驗證當前場景，防止在錯誤場景下執行
            const currentScene = this.state.gameState.currentScene;
            if (currentScene !== 'paying') {
                Game.Debug.warn('flow', `⚠️ [付款成功流程] 在 ${currentScene} 場景下被調用，忽略此調用`);
                return;
            }

            // 🔧 [修復] 驗證交易數據完整性
            if (!transaction || transaction.amountPaid === 0) {
                Game.Debug.error('❌ [付款成功流程] 交易數據異常，amountPaid 為 0 或交易對象不存在');
                Game.Debug.error('交易對象:', transaction);
                Game.Debug.error('傳入的 paidAmount:', paidAmount);
                // 嘗試從當前狀態恢復
                const currentTransaction = this.state.gameState.currentTransaction;
                if (currentTransaction && currentTransaction.amountPaid > 0) {
                    Game.Debug.log('flow', '🔧 [付款成功流程] 從當前狀態恢復交易數據');
                    transaction = currentTransaction;
                    paidAmount = currentTransaction.amountPaid;
                } else {
                    Game.Debug.error('❌ [付款成功流程] 無法恢復交易數據，終止流程');
                    return;
                }
            }

            this.audio.playCheckoutSound(() => {
                this.speech.speak(`你總共付了${this.convertToTraditionalCurrency(paidAmount)}`, {
                    callback: () => {
                        // 🔧 [修復] 確保 amountPaid 在場景切換前保持正確值（防止非同步期間被清零）
                        this.state.gameState.currentTransaction.amountPaid = paidAmount;
                        if (transaction.changeExpected > 0) {
                            this.generateChange();
                        }
                        this.showChangeVerification(); // 總是進入找零驗證

                        if (difficulty !== 'hard') {
                            Game.TimerManager.setTimeout(() => {
                                if (transaction.changeExpected > 0) {
                                    Game.speech.speak(`需要找你${Game.convertToTraditionalCurrency(transaction.changeExpected)}`, {
                                        callback: () => {
                                            if (difficulty === 'normal') {
                                                Game.TimerManager.setTimeout(() => {
                                                    // 🔧 [修正] 檢查場景和交易狀態，防止在用戶已點擊答案後播放語音
                                                    const currentScene = Game.state.gameState.currentScene;
                                                    const hasCompleted = Game.state.gameState.completedTransaction;

                                                    if (currentScene === 'checking' && !hasCompleted) {
                                                        Game.speech.speak(`請選擇正確的答案`);
                                                    } else {
                                                        Game.Debug.log('speech', `🔇 [A4-找零提示] ${hasCompleted ? '用戶已完成選擇' : '場景已切換至 ' + currentScene}，跳過語音播放`);
                                                    }
                                                }, 300, 'speechDelay');
                                            }
                                        }
                                    });
                                } else {
                                    Game.speech.speak(`不需要找零錢`);
                                }
                            }, 500, 'speechDelay');
                        }
                        this.state.gameState.isProcessingPayment = false;
                    }
                });
            });
        },
        
        // 生成找零
        generateChange() {
            let changeAmount = this.state.gameState.currentTransaction.changeExpected;
            const changeCoins = [];
            const availableMoney = [...this.storeData.moneyItems].reverse();
            
            // 貪心算法計算找零
            for (const money of availableMoney) {
                while (changeAmount >= money.value) {
                    changeCoins.push({
                        ...money,
                        id: `change_${money.value}_${Date.now()}_${Math.random()}`
                    });
                    changeAmount -= money.value;
                }
            }
            
            this.state.gameState.currentTransaction.changeReceived = changeCoins;
            Game.Debug.log('coin', '系統找零:', changeCoins);
        },

        // 🔧 [配置驅動] 純UI渲染方法，不處理狀態邏輯
        renderChangeVerificationUI() {
            Game.Debug.log('ui', '🎨 [A4-找零驗證UI] 渲染找零驗證UI');

            const app = document.getElementById('app');
            const transaction = this.state.gameState.currentTransaction;
            const selectedItem = this.state.gameState.selectedItem;
            const settings = this.state.settings;
            const difficulty = settings.difficulty;

            // 🔧 [修復] 檢查 selectedItem 是否為 null，如果是則返回到 shopping 場景
            if (!selectedItem) {
                Game.Debug.error('❌ [A4-找零驗證UI] selectedItem 為 null，無法渲染找零驗證UI');
                Game.Debug.log('flow', '🔧 [A4-找零驗證UI] 返回到 shopping 場景重新選擇商品');
                this.TimerManager.setTimeout(() => {
                    this.SceneManager.switchScene('shopping', this);
                }, 100, 'screenTransition');
                return;
            }

            Game.Debug.log('flow', '找零驗證 - 難度:', difficulty);
            Game.Debug.log('flow', '找零驗證 - 預期找零金額:', transaction.changeExpected);
            Game.Debug.log('flow', '找零驗證 - 是否簡單模式且需找零:', difficulty === 'easy' && transaction.changeExpected > 0);

            // 🔧 [移除] 困難模式已改為獨立計算場景，不再使用彈窗

            // 簡單模式使用新的拖曳找零系統
            if (difficulty === 'easy' && transaction.changeExpected > 0) {
                Game.Debug.log('flow', '使用簡單模式找零驗證');
                this.showEasyModeChangeVerification(app, transaction, selectedItem);
            } else {
                Game.Debug.log('flow', '使用普通/困難模式找零驗證');
                // 普通模式，或無需找零的情況，保持原有邏輯
                this.showNormalHardModeChangeVerification(app, transaction, selectedItem);
            }
        },

        // 🔧 [配置驅動] 渲染交易摘要UI方法
        renderTransactionSummaryUI() {
            Game.Debug.log('ui', '🎨 [A4-交易摘要UI] 渲染交易摘要UI');

            const app = document.getElementById('app');
            const summaryData = this.state.gameState.summaryData;

            if (!summaryData) {
                Game.Debug.error('❌ [A4-交易摘要] 沒有可用的摘要數據');
                return;
            }

            const { selectedItem, transaction, onComplete } = summaryData;

            // 使用現有的showTransactionSummaryScreenWithData方法，但傳入回調
            this.showTransactionSummaryScreenWithData(selectedItem, transaction, onComplete);
        },

        // 顯示找零驗證
        showChangeVerification() {
            const difficulty = this.state.settings.difficulty;

            // 🔧 [新增] 困難模式先進入計算場景
            if (difficulty === 'hard') {
                Game.Debug.log('flow', '🎬 [A4-找零驗證] 困難模式：切換到計算場景');
                this.SceneManager.switchScene('calculation', this);
            } else {
                Game.Debug.log('flow', '🎬 [A4-找零驗證] 切換到找零驗證場景');
                this.SceneManager.switchScene('checking', this);
            }
        },
        
        // 簡單模式找零驗證（拖曳系統）
        showEasyModeChangeVerification(app, transaction, selectedItem) {
            // 🔧 [修復] 檢查 selectedItem 是否為 null
            if (!selectedItem) {
                Game.Debug.error('❌ [A4-簡單模式找零] selectedItem 為 null，無法顯示找零驗證');
                Game.Debug.log('flow', '🔧 [A4-簡單模式找零] 返回到 shopping 場景');
                this.TimerManager.setTimeout(() => {
                    this.SceneManager.switchScene('shopping', this);
                }, 100, 'screenTransition');
                return;
            }

            // 計算剩餘錢包內容（扣除已付款的錢幣）
            const remainingWallet = this.calculateRemainingWallet();

            // 獲取當前難度設定
            const difficulty = this.state.settings.difficulty;
            
            // 初始化找零拖曳狀態
            this.state.gameState.changeDropTargets = transaction.changeReceived.map((money, index) => ({
                expectedMoney: money,
                isDropped: false,
                position: index
            }));
            
            
            app.innerHTML = `
                <div class="store-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">${this.getCurrentStoreInfo().emoji}</span>
                            <span>${this.getCurrentStoreInfo().name}</span>
                        </div>
                        <div class="title-bar-center">第四步：確認有沒有需要找零錢</div>
                        <div class="title-bar-right">
                            <span>第 ${this.state.quiz.currentQuestion + 1} 題 / 共 ${this.state.settings.questionCount || 10} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>

                    <div class="change-check-area">
                        <h3>店家找零</h3>
                        <div class="store-change">
                            ${transaction.changeReceived.map((money, index) => {
                                const randomFace = Math.random() < 0.5 ? 'front' : 'back';
                                const imagePath = money.images[randomFace];
                                const isBanknote = money.value >= 100;
                                const changeImgStyle = isBanknote
                                    ? 'width: 100px; height: auto; max-height: 60px; object-fit: contain; pointer-events: none;'
                                    : 'width: 50px; height: 50px; object-fit: contain; pointer-events: none;';
                                return `
                                <div class="change-money draggable"
                                     data-change-id="${index}"
                                     data-money-value="${money.value}"
                                     data-money-name="${money.name}"
                                     draggable="true"
                                     ondragstart="Game.handleChangeDragStart(event)"
                                     onclick="Game.handleChangeMoneyClick(event)"
                                     onmouseenter="Game.handleChangeMoneyHover(event)">
                                    <img src="${imagePath}" alt="${money.name}" style="${changeImgStyle}">
                                    <span style="pointer-events: none;">${money.name}</span>
                                </div>
                            `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="change-amount-display">
                        <div class="summary-change">
                            <span>找回零錢：</span>
                            <span class="change-amount-value">${transaction.changeExpected}元</span>
                        </div>
                    </div>

                    <!-- 淡化金錢圖示放置區域 -->
                    <div class="change-targets-container">
                        <h3>請將找回的零錢放到下方對應位置</h3>
                        <div class="change-targets">
                            ${transaction.changeReceived.map((money, index) => {
                                const isBanknote = money.value >= 100;
                                const itemClass = isBanknote ? 'money-item banknote' : 'money-item coin';
                                const randomFace = Math.random() < 0.5 ? 'front' : 'back';
                                const imagePath = money.images[randomFace];
                                return `
                                <div class="${itemClass} change-target faded"
                                     data-target-index="${index}"
                                     data-expected-value="${money.value}"
                                     ondrop="Game.handleChangeTargetDrop(event)"
                                     ondragover="Game.handleChangeTargetDragOver(event)"
                                     ondragenter="Game.handleChangeTargetDragEnter(event)"
                                     ondragleave="Game.handleChangeTargetDragLeave(event)">
                                    <img src="${imagePath}" alt="${money.name}">
                                    <div class="money-value">${money.name}</div>
                                </div>
                            `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            // 添加拖曳樣式
            this.addChangeDragStyles();
            
            // ▼▼▼ 【需求 #2 修正】 ▼▼▼
            // 簡單模式也添加找零語音提示
            this.TimerManager.setTimeout(() => {
                const itemNames = selectedItem.category === 'multi-selection'
                                ? selectedItem.items.map(item => this.parseProductDisplay(item, 1).speechText).join('、')
                                : this.parseProductDisplay(selectedItem, 1).speechText;

                const speechText = `你購買的商品有：${itemNames}，共${this.convertToTraditionalCurrency(transaction.totalCost)}。你付了${this.convertToTraditionalCurrency(transaction.amountPaid)}，請問有沒有需要找零錢，要找多少錢？`;

                Game.Debug.log('speech', `🗣️ 播放找零提示語音 (簡單模式): "${speechText}"`);
                this.speech.speak(speechText);
            }, 500, 'speechDelay'); // 延遲500毫秒
            // ▲▲▲ 【需求 #2 修正結束】 ▲▲▲

            // 🎯 重新初始化TouchDragUtility以支援找零頁面拖拽
            this.TimerManager.setTimeout(() => {
                this.initializeTouchDragSupport();
            }, 100, 'uiAnimation');
        },
        
        // 普通和困難模式找零驗證（拖曳系統）
        showNormalHardModeChangeVerification(app, transaction, selectedItem) {
            // 🔧 [修復] 檢查 selectedItem 是否為 null
            if (!selectedItem) {
                Game.Debug.error('❌ [A4-普通/困難模式找零] selectedItem 為 null，無法顯示找零驗證');
                Game.Debug.log('flow', '🔧 [A4-普通/困難模式找零] 返回到 shopping 場景');
                this.TimerManager.setTimeout(() => {
                    this.SceneManager.switchScene('shopping', this);
                }, 100, 'screenTransition');
                return;
            }

            // 困難模式且需要找零：使用 B6 式拖曳介面
            if (this.state.settings.difficulty === 'hard' && transaction.changeExpected > 0) {
                this._a4ShowHardChangeDrag(app, transaction, selectedItem);
                return;
            }

            // 困難模式且不需找零：顯示「剛好付款」確認畫面
            if (this.state.settings.difficulty === 'hard' && transaction.changeExpected === 0) {
                this.state.isProcessing = false;
                app.innerHTML = `
                <div class="store-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">${this.getCurrentStoreInfo().emoji}</span>
                            <span>${this.getCurrentStoreInfo().name}</span>
                        </div>
                        <div class="title-bar-center">第四步：確認有沒有需要找零錢</div>
                        <div class="title-bar-right">
                            <span>第 ${this.state.quiz.currentQuestion + 1} 題 / 共 ${this.state.settings.questionCount || 10} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px;gap:24px;">
                        <div style="background:#fff;border-radius:20px;padding:40px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.15);max-width:480px;width:100%;">
                            <div style="font-size:80px;margin-bottom:16px;">✅</div>
                            <div style="font-size:28px;font-weight:800;color:#4caf50;margin-bottom:8px;">剛好付款！</div>
                            <div style="font-size:18px;color:#666;margin-bottom:32px;">付款金額剛剛好，不需要找零。</div>
                            <button id="a4-exact-pay-btn" style="background:linear-gradient(135deg,#4caf50,#45a049);color:#fff;border:none;padding:18px 50px;border-radius:25px;font-size:1.3em;font-weight:700;cursor:pointer;box-shadow:0 4px 15px rgba(76,175,80,0.3);">
                                ✅ 完成交易
                            </button>
                        </div>
                    </div>
                </div>`;
                this.TimerManager.setTimeout(() => {
                    this.speech.speak('剛好付款，不需要找零');
                }, 300, 'speechDelay');
                const exactBtn = document.getElementById('a4-exact-pay-btn');
                if (exactBtn) {
                    exactBtn.addEventListener('click', () => {
                        if (this.state.isProcessing) return;
                        this.state.isProcessing = true;
                        Game.TimerManager.setTimeout(() => Game.showGameComplete(true), 400, 'screenTransition');
                    });
                }
                return;
            }

            // 計算剩餘錢包內容（扣除已付款的錢幣）
            const remainingWallet = this.calculateRemainingWallet();

            // 初始化普通模式找零拖曳狀態
            this.state.gameState.normalChangeCollected = [];
            
            // 生成所有可能的找零金錢（500元、100元、50元、10元、5元、1元）
            const availableChangeMoney = [
                { value: 500, name: '500元', images: { front: '../images/money/500_yuan_front.png', back: '../images/money/500_yuan_back.png' } },
                { value: 100, name: '100元', images: { front: '../images/money/100_yuan_front.png', back: '../images/money/100_yuan_back.png' } },
                { value: 50, name: '50元', images: { front: '../images/money/50_yuan_front.png', back: '../images/money/50_yuan_back.png' } },
                { value: 10, name: '10元', images: { front: '../images/money/10_yuan_front.png', back: '../images/money/10_yuan_back.png' } },
                { value: 5, name: '5元', images: { front: '../images/money/5_yuan_front.png', back: '../images/money/5_yuan_back.png' } },
                { value: 1, name: '1元', images: { front: '../images/money/1_yuan_front.png', back: '../images/money/1_yuan_back.png' } }
            ];
            
            // 統一使用store-layout類別以確保標題欄充滿視窗寬度
            const difficulty = this.state.settings.difficulty;
            const isEasyModeNoChange = difficulty === 'easy' && transaction.changeExpected === 0;
            // 🔧 [修正] 只在普通/困難模式下添加 normal-hard-change-mode class
            const containerClass = difficulty === 'normal' || difficulty === 'hard' ?
                'store-layout normal-hard-change-mode' : 'store-layout';

            // 🔧 [修正] 先檢查是否為重試，再生成或使用儲存的選項
            const isRetryAfterError = !!(this.state.gameState.currentChangeOptions);
            let changeOptions = [];

            if (difficulty === 'normal' || difficulty === 'hard') {
                if (isRetryAfterError) {
                    // 錯誤重試時使用已儲存的選項
                    changeOptions = this.state.gameState.currentChangeOptions;
                    Game.Debug.log('flow', '🔄 使用已儲存的找零選項（保持選項固定）');
                } else {
                    // 第一次生成選項
                    changeOptions = this.generateChangeOptions(transaction.changeExpected);
                    this.state.gameState.currentChangeOptions = changeOptions;
                    Game.Debug.log('flow', '🆕 生成新的找零選項');
                }
            }

            // 處理商品顯示邏輯（同第三步，圖片大小8rem，字體同第四步計算找零頁面）
            let itemDisplayText = '';
            if (selectedItem.category === 'multi-selection') {
                itemDisplayText = selectedItem.items.map(item => {
                    const productInfo = this.parseProductDisplay(item, 1);
                    return `${this.getProductIconHTML(item, '8rem')}<span style="font-size:1.8em;font-weight:bold;align-self:center;"> ${productInfo.name}</span>`;
                }).join('、');
            } else {
                const productInfo = this.parseProductDisplay(selectedItem, 1);
                itemDisplayText = `${this.getProductIconHTML(selectedItem, '8rem')}<span style="font-size:1.8em;font-weight:bold;align-self:center;"> ${productInfo.name}</span>`;
            }

            app.innerHTML = `
                <div class="${containerClass}">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">${this.getCurrentStoreInfo().emoji}</span>
                            <span>${this.getCurrentStoreInfo().name}</span>
                        </div>
                        <div class="title-bar-center">第四步：確認有沒有需要找零錢</div>
                        <div class="title-bar-right">
                            <span>第 ${this.state.quiz.currentQuestion + 1} 題 / 共 ${this.state.settings.questionCount || 10} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>

                    <!-- 購買目標物品框（同第三步） -->
                    <div class="unified-task-frame">
                        <div class="task-header">
                            <h2>購買的物品</h2>
                        </div>
                        <div class="selected-item-display">
                            <div class="item-task-text">${itemDisplayText}<span style="align-self:center;font-size:1.8em;font-weight:bold;"> 共${transaction.totalCost}元</span></div>
                        </div>
                    </div>

                    ${isEasyModeNoChange ? `
                        <!-- 簡單模式無找零的顯示 -->
                        <div class="change-amount-display">
                            <div class="summary-change">
                                <span>找回零錢：</span>
                                <span class="change-amount-value">0元</span>
                            </div>
                        </div>
                    ` : `
                        <!-- 普通模式三選一找零選項 - 分為上下兩個框 -->
                        <!-- 上框：題目 -->
                        <div class="change-question-area">
                            <div class="change-title">找零金額</div>
                            <div class="change-amount-highlight">${transaction.changeExpected}元</div>
                        </div>

                        <!-- 下框：答案選項 -->
                        <div class="change-options-area">
                            <div class="change-options">
                                ${changeOptions.map((option, index) => `
                                    <div class="change-option ${option.isCorrect ? 'correct-option' : ''}"
                                         data-option-index="${index}"
                                         data-is-correct="${option.isCorrect}"
                                         data-change-amount="${option.totalValue}"
                                         onclick="Game.selectChangeOption(${index}, ${option.isCorrect}, ${option.totalValue})">
                                        <div class="option-money-display">
                                            ${option.money.length === 0 ?
                                                '<div class="no-change-display"><div style="font-size: 2em; font-weight: bold; margin-bottom: 5px;">0元</div><div>不需找零</div></div>' :
                                                option.money.map(money => {
                                                    // 判斷是否為紙鈔（100元以上）- 金錢圖示縮小15%
                                                    const isBanknote = money.value >= 100;
                                                    const imageStyle = isBanknote ?
                                                        'width: 102px; height: auto; max-height: 61px; object-fit: contain;' :
                                                        'width: 68px; height: 68px; object-fit: contain;';
                                                    const randomFace = Math.random() < 0.5 ? 'front' : 'back';
                                                    const imagePath = money.images[randomFace];

                                                    return `
                                                        <div class="money-item-option">
                                                            <img src="${imagePath}" alt="${money.name}" style="${imageStyle}">
                                                        </div>
                                                    `;
                                                }).join('')
                                            }
                                        </div>
                                        <div class="option-amount-display" style="display: ${difficulty === 'hard' ? 'none' : ''};">
                                            <span class="amount-value">${option.totalValue}元</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `}
                    
                    ${isEasyModeNoChange ? `
                        <!-- 簡單模式無找零的確認按鈕 -->
                        <div class="action-buttons">
                            <button class="confirm-btn" onclick="Game.completeEasyModeNoChange()">
                                確認無需找零
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
            
            // 根據模式添加對應的樣式
            if (isEasyModeNoChange) {
                this.addChangeDragStyles(); // 使用簡單模式樣式
            } else {
                this.addNormalChangeDragStyles(); // 使用普通模式樣式
            }
            
            // ▼▼▼ 【需求 #2 修正】 ▼▼▼
            // 🔧 [修正] 錯誤重試時不播放語音提示
            // isRetryAfterError 已在上方定義

            if (!isRetryAfterError) {
                // 只在第一次進入找零驗證頁面時播放語音提示
                this.TimerManager.setTimeout(() => {
                    const difficulty = this.state.settings.difficulty;
                    let speechText;

                    if (difficulty === 'normal' || difficulty === 'hard') {
                        // 普通和困難模式：直接說明需要找零的金額
                        const changeAmount = transaction.changeExpected;
                        if (changeAmount > 0) {
                            speechText = `需要找您${this.convertToTraditionalCurrency(changeAmount)}，請選擇正確的答案`;
                        } else {
                            speechText = `這次購物不需要找零，請選擇正確的答案`;
                        }
                    } else {
                        // 簡單模式：原有的詳細語音
                        const itemNames = selectedItem.category === 'multi-selection'
                                        ? selectedItem.items.map(item => this.parseProductDisplay(item, 1).speechText).join('、')
                                        : this.parseProductDisplay(selectedItem, 1).speechText;
                        speechText = `你購買的商品有：${itemNames}，共${this.convertToTraditionalCurrency(transaction.totalCost)}。你付了${this.convertToTraditionalCurrency(transaction.amountPaid)}，請問有沒有需要找零錢，要找多少錢？`;
                    }

                    Game.Debug.log('speech', `🗣️ 播放找零提示語音: "${speechText}"`);
                    this.speech.speak(speechText);
                }, 500, 'speechDelay'); // 延遲500毫秒
            } else {
                Game.Debug.log('speech', '🔇 [A4-找零] 錯誤重試，跳過語音提示播放');
            }
            // ▲▲▲ 【需求 #2 修正結束】 ▲▲▲

            // 🎯 重新初始化TouchDragUtility以支援找零頁面拖拽
            this.TimerManager.setTimeout(() => {
                this.initializeTouchDragSupport();
            }, 100, 'uiAnimation');

            // 🆕 簡單模式：啟動視覺延遲機制（找零提示）
            if (this.state.settings.difficulty === 'easy' && this.ClickMode.isEnabled()) {
                this.ClickMode.enableClickModeWithVisualDelay('ChangeTargets');
            }
        },
        
        // ── A4 困難模式找零拖曳介面 ──────────────────────────────────

        _a4ShowHardChangeDrag(app, transaction, selectedItem) {
            const gs   = this.state.gameState;
            const change = transaction.changeExpected;

            // 初始化狀態
            gs.a4cGhostMode  = false;
            gs.a4cHintSlots  = [];
            gs.a4cErrorCount = 0;
            gs.a4cPlaced     = [];
            gs.a4cTotal      = change;
            gs.a4cHintShown  = false;

            // 面額托盤（依找零金額）
            let trayDenoms;
            if (change <= 100)      { trayDenoms = [50, 10, 5, 1]; }
            else if (change < 1000) { trayDenoms = [500, 100, 50, 10, 5, 1]; }
            else                    { trayDenoms = [1000, 500, 100, 50, 10, 5, 1]; }

            const trayFaces = {};
            trayDenoms.forEach(d => { trayFaces[d] = Math.random() < 0.5 ? 'back' : 'front'; });
            gs.a4cTrayFaces = trayFaces;

            // 貪婪最佳解
            const greedySolution = {};
            let remSol = change;
            for (const d of [1000, 500, 100, 50, 10, 5, 1]) {
                const cnt = Math.floor(remSol / d);
                if (cnt > 0) { greedySolution[d] = cnt; remSol -= cnt * d; }
            }
            gs.a4cGreedySolution = greedySolution;

            // 付款後錢包剩餘
            const walletRemaining = (gs.walletTotal || 0) - (transaction.amountPaid || 0);
            gs.a4cWalletBase = walletRemaining;

            // 靜態錢包金幣
            const walletCoins = [];
            let _rem = walletRemaining;
            for (const d of [1000, 500, 100, 50, 10, 5, 1]) {
                const cnt = Math.floor(_rem / d);
                for (let i = 0; i < cnt; i++) walletCoins.push(d);
                _rem -= cnt * d;
            }
            const walletStaticHtml = walletCoins.map(d => {
                const isBill = d >= 100;
                const face = Math.random() < 0.5 ? 'back' : 'front';
                const w = isBill ? 80 : 52;
                return `<div class="a4c-wc-static">
                    <img src="../images/money/${d}_yuan_${face}.png" alt="${d}元"
                         style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;" draggable="false" onerror="this.style.display='none'">
                    <span class="a4c-denom-label">${d}元</span>
                </div>`;
            }).join('');

            // 面額托盤 HTML
            const trayHtml = trayDenoms.map(d => {
                const isBill = d >= 100;
                return `<div class="a4c-denom-card" draggable="true" data-denom="${d}" data-face="${trayFaces[d]}" title="${d}元">
                    <img src="../images/money/${d}_yuan_${trayFaces[d]}.png" alt="${d}元"
                         class="${isBill ? 'a4c-banknote-img' : 'a4c-coin-img'}" draggable="false" onerror="this.style.display='none'">
                    <span class="a4c-denom-label">${d}元</span>
                </div>`;
            }).join('');

            // 商品顯示
            let itemDisplayText = '';
            if (selectedItem.category === 'multi-selection') {
                itemDisplayText = selectedItem.items.map(item => {
                    const productInfo = this.parseProductDisplay(item, 1);
                    return `${this.getProductIconHTML(item, '8rem')}<span style="font-size:1.8em;font-weight:bold;align-self:center;"> ${productInfo.name}</span>`;
                }).join('、');
            } else {
                const productInfo = this.parseProductDisplay(selectedItem, 1);
                itemDisplayText = `${this.getProductIconHTML(selectedItem, '8rem')}<span style="font-size:1.8em;font-weight:bold;align-self:center;"> ${productInfo.name}</span>`;
            }

            app.innerHTML = `
            <div class="store-layout">
                <div class="title-bar">
                    <div class="title-bar-left">
                        <span class="store-icon-large">${this.getCurrentStoreInfo().emoji}</span>
                        <span>${this.getCurrentStoreInfo().name}</span>
                    </div>
                    <div class="title-bar-center">第四步：確認有沒有需要找零錢</div>
                    <div class="title-bar-right">
                        <span>第 ${this.state.quiz.currentQuestion + 1} 題 / 共 ${this.state.settings.questionCount || 10} 題</span>
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                    </div>
                </div>

                <div style="flex:1;display:flex;flex-direction:column;padding:12px;gap:10px;overflow-y:auto;box-sizing:border-box;">

                    <!-- 任務框：商品 + 找零金額 + 提示鈕 -->
                    <div class="a4c-task-frame">
                        <div class="a4c-task-left" style="flex-direction:column;align-items:center;gap:8px;">
                            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;">
                                ${itemDisplayText}
                            </div>
                            <div class="a4c-change-row">
                                <span class="a4c-change-label">找零金額：</span>
                                <span class="a4c-change-num">${change} 元</span>
                            </div>
                        </div>
                        <div class="a4c-task-right" style="flex-direction:row;min-width:unset;">
                            <img src="../images/common/hint_detective.png" alt="" class="a4c-mascot a4c-mascot-bounce" onerror="this.style.display='none'">
                            <button class="a4c-hint-btn" id="a4c-hint-btn">💡 提示</button>
                        </div>
                    </div>

                    <!-- 拖曳金錢區 -->
                    <div class="a4c-card">
                        <div class="a4c-card-title">💰 找零面額（可重複拖曳）</div>
                        <div class="a4c-tray-coins" id="a4c-tray-coins">${trayHtml}</div>
                    </div>

                    <!-- 我的錢包 -->
                    <div class="a4c-card">
                        <div class="a4c-card-title" style="display:flex;align-items:center;">
                            <div style="flex:1;"></div>
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span>💼 我的錢包</span>
                                <span class="a4c-wallet-info a4c-hidden" id="a4c-wallet-info"><span id="a4c-wallet-balance">${walletRemaining}</span>元（已找回 <span id="a4c-placed-total">0</span>/${change} 元）</span>
                            </div>
                            <div style="flex:1;display:flex;justify-content:flex-end;">
                                <button class="a4c-wallet-toggle-btn" id="a4c-wallet-toggle">▶ 展開錢包</button>
                            </div>
                        </div>
                        <div class="a4c-wallet-split">
                            <!-- 左：原有錢包（預設折疊） -->
                            <div class="a4c-wallet-left" id="a4c-wallet-left" style="display:none;">
                                ${walletStaticHtml || '<span class="a4c-empty-hint">（餘額為0）</span>'}
                            </div>
                            <!-- 右：找零放置區（永遠展開） -->
                            <div class="a4c-wallet-right a4c-drop-zone" id="a4c-wallet-zone">
                                <div id="a4c-wallet-coins" style="display:flex;flex-wrap:wrap;gap:10px;width:100%;align-items:flex-end;justify-content:center;min-height:60px;">
                                    <span class="a4c-empty-hint">把找零金錢拖曳到這裡</span>
                                </div>
                            </div>
                        </div>
                        <div style="text-align:center;margin-top:12px;">
                            <button class="a4c-confirm-btn" id="a4c-confirm-btn" disabled>✅ 確認找零</button>
                        </div>
                    </div>

                </div>
            </div>`;

            this.TimerManager.setTimeout(() => {
                const changeAmt = transaction.changeExpected;
                const speechText = `找您${this.convertToTraditionalCurrency(changeAmt)}，請把找回的金錢拖曳到我的錢包`;
                this.speech.speak(speechText);
            }, 400, 'speechDelay');

            this.TimerManager.setTimeout(() => this._a4SetupChangeDragInteraction(transaction), 100, 'uiAnimation');
        },

        _a4SetupChangeDragInteraction(transaction) {
            const gs     = this.state.gameState;
            const change = transaction.changeExpected;
            const trayEl     = document.getElementById('a4c-tray-coins');
            const walletZone = document.getElementById('a4c-wallet-zone');
            const confirmBtn = document.getElementById('a4c-confirm-btn');
            const hintBtn    = document.getElementById('a4c-hint-btn');
            if (!trayEl || !walletZone) return;

            let _dropCooldown = false;
            const handleDrop = (denom) => {
                if (_dropCooldown) return;
                _dropCooldown = true;
                setTimeout(() => { _dropCooldown = false; }, 300);
                const face = gs.a4cTrayFaces?.[denom] || 'front';
                const uid  = 'a4c' + Date.now() + Math.floor(Math.random() * 10000);
                if (gs.a4cGhostMode) {
                    const slotIdx = (gs.a4cHintSlots || []).findIndex(s => s.denom === denom && !s.filled);
                    if (slotIdx === -1) { Game.TimerManager.setTimeout(() => {}, 0, 'sfx'); return; }
                    gs.a4cHintSlots[slotIdx].filled = true;
                    gs.a4cHintSlots[slotIdx].uid = uid;
                    gs.a4cPlaced.push({ denom, uid, face });
                } else {
                    gs.a4cPlaced.push({ denom, uid, face });
                }
                this._a4UpdateChangeDisplay(change);
                this._a4RenderWalletCoins(change);
                const runningTotal = (gs.a4cPlaced || []).reduce((s, p) => s + p.denom, 0);
                // 設計意圖：只在按過提示後才播拖曳語音，避免干擾
                if (gs.a4cHintShown) this.speech.speak(`找回${this.convertToTraditionalCurrency(runningTotal)}`);
            };

            // Desktop drag from tray
            trayEl.querySelectorAll('.a4c-denom-card').forEach(card => {
                const denom = parseInt(card.dataset.denom);
                card.addEventListener('dragstart', e => {
                    e.dataTransfer.setData('text/plain', `a4cdenom:${denom}`);
                    card.classList.add('a4c-dragging');
                });
                card.addEventListener('dragend', () => card.classList.remove('a4c-dragging'));
            });
            walletZone.addEventListener('dragover', e => { e.preventDefault(); walletZone.classList.add('a4c-drop-active'); });
            walletZone.addEventListener('dragleave', e => {
                if (!walletZone.contains(e.relatedTarget)) walletZone.classList.remove('a4c-drop-active');
            });
            walletZone.addEventListener('drop', e => {
                e.preventDefault(); walletZone.classList.remove('a4c-drop-active');
                const d = e.dataTransfer.getData('text/plain');
                if (d.startsWith('a4cdenom:')) handleDrop(parseInt(d.replace('a4cdenom:', '')));
            });

            // Touch drag from tray
            trayEl.querySelectorAll('.a4c-denom-card').forEach(card => {
                const denom = parseInt(card.dataset.denom);
                let ghostEl = null;
                card.addEventListener('touchstart', e => {
                    const t = e.touches[0];
                    ghostEl = card.cloneNode(true);
                    ghostEl.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.8;transform:scale(1.05);left:${t.clientX - 35}px;top:${t.clientY - 50}px;`;
                    document.body.appendChild(ghostEl);
                }, { passive: true });
                card.addEventListener('touchmove', e => {
                    e.preventDefault();
                    const t = e.touches[0];
                    if (ghostEl) { ghostEl.style.left = (t.clientX - 35) + 'px'; ghostEl.style.top = (t.clientY - 50) + 'px'; }
                    const r = walletZone.getBoundingClientRect();
                    walletZone.classList.toggle('a4c-drop-active',
                        t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom);
                }, { passive: false });
                card.addEventListener('touchend', e => {
                    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
                    walletZone.classList.remove('a4c-drop-active');
                    const t = e.changedTouches[0];
                    const r = walletZone.getBoundingClientRect();
                    if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) handleDrop(denom);
                }, { passive: true });
            });

            // × 移除按鈕
            const walletCoinsEl = document.getElementById('a4c-wallet-coins');
            if (walletCoinsEl) {
                walletCoinsEl.addEventListener('click', e => {
                    const btn = e.target.closest('.a4c-wc-remove');
                    if (!btn) return;
                    if (gs.a4cGhostMode) {
                        const slotIdx = parseInt(btn.dataset.slotIdx);
                        if (!isNaN(slotIdx) && gs.a4cHintSlots[slotIdx]) {
                            const uid = gs.a4cHintSlots[slotIdx].uid;
                            gs.a4cHintSlots[slotIdx].filled = false;
                            gs.a4cHintSlots[slotIdx].uid = null;
                            gs.a4cPlaced = gs.a4cPlaced.filter(p => p.uid !== uid);
                        }
                    } else {
                        const uid = btn.dataset.uid;
                        gs.a4cPlaced = gs.a4cPlaced.filter(p => p.uid !== uid);
                    }
                    this._a4UpdateChangeDisplay(change);
                    this._a4RenderWalletCoins(change);
                });

                // Desktop 拖回托盤
                let _draggingWalletUid = null;
                walletCoinsEl.addEventListener('dragstart', e => {
                    const item = e.target.closest('.a4c-wc-item[data-uid]');
                    if (!item) return;
                    _draggingWalletUid = item.dataset.uid;
                    e.dataTransfer.setData('text/plain', `a4cuid:${_draggingWalletUid}`);
                    e.dataTransfer.effectAllowed = 'move';
                });
                document.addEventListener('dragend', function _a4DragEnd(e) {
                    if (!_draggingWalletUid) return;
                    const uid = _draggingWalletUid;
                    _draggingWalletUid = null;
                    if (e.dataTransfer.dropEffect === 'none') {
                        if (gs.a4cGhostMode) {
                            const slotIdx = (gs.a4cHintSlots || []).findIndex(s => s.uid === uid);
                            if (slotIdx !== -1) { gs.a4cHintSlots[slotIdx].filled = false; gs.a4cHintSlots[slotIdx].uid = null; }
                        }
                        gs.a4cPlaced = (gs.a4cPlaced || []).filter(p => p.uid !== uid);
                    }
                });

                // Touch 拖回
                let _touchWalletUid = null;
                let _touchGhostEl   = null;
                walletCoinsEl.addEventListener('touchstart', e => {
                    const item = e.target.closest('.a4c-wc-item[data-uid]');
                    if (!item) return;
                    _touchWalletUid = item.dataset.uid;
                    const t = e.touches[0];
                    _touchGhostEl = item.cloneNode(true);
                    _touchGhostEl.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.7;left:${t.clientX - 30}px;top:${t.clientY - 40}px;`;
                    document.body.appendChild(_touchGhostEl);
                }, { passive: true });
                walletCoinsEl.addEventListener('touchmove', e => {
                    if (!_touchGhostEl) return;
                    e.preventDefault();
                    const t = e.touches[0];
                    _touchGhostEl.style.left = (t.clientX - 30) + 'px';
                    _touchGhostEl.style.top  = (t.clientY - 40) + 'px';
                }, { passive: false });
                walletCoinsEl.addEventListener('touchend', e => {
                    if (_touchGhostEl) { _touchGhostEl.remove(); _touchGhostEl = null; }
                    if (!_touchWalletUid) return;
                    const uid = _touchWalletUid;
                    _touchWalletUid = null;
                    const t   = e.changedTouches[0];
                    const zone = document.getElementById('a4c-wallet-zone');
                    const r    = zone?.getBoundingClientRect();
                    const inside = r && t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;
                    if (!inside) {
                        if (gs.a4cGhostMode) {
                            const slotIdx = (gs.a4cHintSlots || []).findIndex(s => s.uid === uid);
                            if (slotIdx !== -1) { gs.a4cHintSlots[slotIdx].filled = false; gs.a4cHintSlots[slotIdx].uid = null; }
                        }
                        gs.a4cPlaced = (gs.a4cPlaced || []).filter(p => p.uid !== uid);
                        this._a4UpdateChangeDisplay(change);
                        this._a4RenderWalletCoins(change);
                    }
                }, { passive: true });
            }

            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    if (this.state.isProcessing) return;
                    this.state.isProcessing = true;
                    this._a4ConfirmChange(change);
                });
            }

            if (hintBtn) {
                hintBtn.addEventListener('click', () => {
                    gs.a4cHintShown = true;
                    const walletInfo = document.getElementById('a4c-wallet-info');
                    if (walletInfo) walletInfo.classList.remove('a4c-hidden');
                    this._a4ShowChangeGhostSlots(change);
                    this._a4ShowChangeHintModal(change);
                });
            }

            const walletToggle = document.getElementById('a4c-wallet-toggle');
            if (walletToggle) {
                walletToggle.addEventListener('click', () => {
                    const left = document.getElementById('a4c-wallet-left');
                    if (!left) return;
                    const expanded = left.style.display !== 'none';
                    left.style.display = expanded ? 'none' : '';
                    walletToggle.textContent = expanded ? '▶ 展開錢包' : '◀ 收起錢包';
                });
            }
        },

        _a4UpdateChangeDisplay(change) {
            const gs = this.state.gameState;
            const placedTotal = (gs.a4cPlaced || []).reduce((s, p) => s + p.denom, 0);
            const exact = placedTotal === change;
            const totalEl = document.getElementById('a4c-placed-total');
            if (totalEl) totalEl.textContent = placedTotal;
            const balanceEl = document.getElementById('a4c-wallet-balance');
            if (balanceEl) balanceEl.textContent = (gs.a4cWalletBase || 0) + placedTotal;
            const confirmBtn = document.getElementById('a4c-confirm-btn');
            if (confirmBtn) {
                confirmBtn.disabled = false;
            }
        },

        _a4RenderWalletCoins(change) {
            const gs = this.state.gameState;
            const walletCoinsEl = document.getElementById('a4c-wallet-coins');
            if (!walletCoinsEl) return;

            const _makeFilledSlot = (denom, face, uid, slotIdx) => {
                const isBill = denom >= 100;
                const w = isBill ? 80 : 52;
                const div = document.createElement('div');
                div.className = 'a4c-wc-item';
                div.draggable = true;
                div.dataset.uid = uid || '';
                div.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;" draggable="false" onerror="this.style.display='none'">
                    <span class="a4c-denom-label">${denom}元</span>
                    <button class="a4c-wc-remove" data-uid="${uid || ''}"${slotIdx != null ? ` data-slot-idx="${slotIdx}"` : ''} title="移除">×</button>`;
                return div;
            };
            const _makeGhostSlot = (denom, face) => {
                const isBill = denom >= 100;
                const w = isBill ? 80 : 52;
                const div = document.createElement('div');
                div.className = 'a4c-ghost-slot';
                div.dataset.denom = denom;
                div.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;opacity:0.3;" draggable="false" onerror="this.style.display='none'">
                    <span class="a4c-denom-label" style="opacity:0.3;">${denom}元</span>`;
                return div;
            };

            if (gs.a4cGhostMode && gs.a4cHintSlots?.length > 0) {
                if (gs.a4cHintSlots.every(s => s.filled)) {
                    gs.a4cGhostMode = false;
                    walletCoinsEl.innerHTML = '';  // 清除所有 ghost slot，避免殘留
                } else {
                    const kids = Array.from(walletCoinsEl.children);
                    if (kids.length !== gs.a4cHintSlots.length) {
                        walletCoinsEl.innerHTML = '';
                        gs.a4cHintSlots.forEach((slot, idx) => {
                            walletCoinsEl.appendChild(slot.filled ? _makeFilledSlot(slot.denom, slot.face, slot.uid, idx) : _makeGhostSlot(slot.denom, slot.face));
                        });
                    } else {
                        gs.a4cHintSlots.forEach((slot, idx) => {
                            const el = kids[idx];
                            const curFilled = el.classList.contains('a4c-wc-item');
                            if (slot.filled === curFilled) return;
                            walletCoinsEl.replaceChild(slot.filled ? _makeFilledSlot(slot.denom, slot.face, slot.uid, idx) : _makeGhostSlot(slot.denom, slot.face), el);
                        });
                    }
                    return;
                }
            }

            if (!gs.a4cPlaced || gs.a4cPlaced.length === 0) {
                walletCoinsEl.innerHTML = '<span class="a4c-empty-hint">把找零金錢拖曳到這裡</span>';
                return;
            }
            const emptyEl = walletCoinsEl.querySelector('.a4c-empty-hint');
            if (emptyEl) emptyEl.remove();
            const existingMap = {};
            walletCoinsEl.querySelectorAll('.a4c-wc-item').forEach(el => { existingMap[el.dataset.uid] = el; });
            const desiredUids = new Set(gs.a4cPlaced.map(p => p.uid));
            Object.entries(existingMap).forEach(([uid, el]) => { if (!desiredUids.has(uid)) el.remove(); });
            gs.a4cPlaced.forEach(p => {
                if (existingMap[p.uid]) return;
                walletCoinsEl.appendChild(_makeFilledSlot(p.denom, p.face, p.uid, null));
            });
        },

        _a4ConfirmChange(change) {
            const gs = this.state.gameState;
            const placedTotal = (gs.a4cPlaced || []).reduce((s, p) => s + p.denom, 0);

            if (placedTotal !== change) {
                this.state.isProcessing = false;
                gs.a4cErrorCount = (gs.a4cErrorCount || 0) + 1;
                const dir = placedTotal > change ? '太多了' : '太少了';
                const walletZone = document.getElementById('a4c-wallet-zone');
                if (walletZone) {
                    walletZone.style.animation = 'a4cShake 0.4s ease';
                    this.TimerManager.setTimeout(() => { if (walletZone) walletZone.style.animation = ''; }, 500, 'ui');
                }
                this.speech.speak(`不對喔，找零算${dir}，請再試一次`);
                gs.a4cPlaced    = [];
                gs.a4cGhostMode = false;
                gs.a4cHintSlots = [];
                this._a4UpdateChangeDisplay(change);
                this._a4RenderWalletCoins(change);
                if (gs.a4cErrorCount >= 3) {
                    gs.a4cErrorCount = 0;
                    this.TimerManager.setTimeout(() => this._a4ShowChangeGhostSlots(change), 900, 'ui');
                }
                return;
            }

            // 找零正確
            this.state.gameState.isProcessingChange = false;
            this.audio.playCorrect02Sound();
            if (typeof confetti === 'function') {
                confetti({ particleCount: 80, angle: 90, spread: 70, origin: { x: 0.5, y: 0.3 }, startVelocity: 35, ticks: 70, colors: ['#FFD700','#FFA500','#FF6B6B','#4CAF50','#2196F3','#FF69B4'] });
            }
            const speechText = `正確！應該找您${this.convertToTraditionalCurrency(change)}`;
            this.speech.speak(speechText, {
                callback: () => {
                    this.state.isProcessing = false;
                    Game.TimerManager.setTimeout(() => {
                        Game.showGameComplete(true);
                    }, 1000, 'screenTransition');
                }
            });
        },

        _a4ShowChangeGhostSlots(change) {
            const gs = this.state.gameState;
            gs.a4cPlaced    = [];
            gs.a4cGhostMode = true;
            const solution = gs.a4cGreedySolution || {};
            const slots = [];
            Object.entries(solution).sort(([a], [b]) => b - a).forEach(([d, cnt]) => {
                const denom = parseInt(d);
                const face  = gs.a4cTrayFaces?.[denom] || 'front';
                for (let i = 0; i < cnt; i++) slots.push({ denom, face, filled: false, uid: null });
            });
            gs.a4cHintSlots = slots;
            // 強制清空，避免 DOM diff 誤判 empty-hint span 為 ghost slot
            const _wc4 = document.getElementById('a4c-wallet-coins');
            if (_wc4) _wc4.innerHTML = '';
            this._a4UpdateChangeDisplay(change);
            this._a4RenderWalletCoins(change);
            const parts = Object.entries(solution).sort(([a], [b]) => b - a).map(([d, cnt]) => `${cnt}個${d}元`);
            this.speech.speak(`可以用${parts.join('，')}`);
        },

        _a4UpdateChangeTrayHints() {
            const gs = this.state.gameState;
            document.querySelectorAll('.a4c-denom-card').forEach(el => el.classList.remove('b6-product-here-hint'));
            if (!gs.a4cGhostMode) return;
            const needed = {};
            (gs.a4cHintSlots || []).filter(s => !s.filled).forEach(s => { needed[s.denom] = (needed[s.denom] || 0) + 1; });
            document.querySelectorAll('.a4c-denom-card').forEach(el => {
                const d = parseInt(el.dataset.denom);
                if (needed[d]) el.classList.add('b6-product-here-hint');
            });
        },

        _a4ShowChangeHintModal(change) {
            const gs = this.state.gameState;
            const solution = gs.a4cGreedySolution || {};
            const parts = Object.entries(solution).sort(([a], [b]) => b - a).map(([d, cnt]) => `${cnt}個${d}元`);
            const speechText = `找零${this.convertToTraditionalCurrency(change)}，可以用${parts.join('，')}`;

            let hintListHTML = '';
            Object.entries(solution).sort(([a], [b]) => b - a).forEach(([d, cnt]) => {
                const denom  = parseInt(d);
                const face   = gs.a4cTrayFaces?.[denom] || 'front';
                const isBill = denom >= 100;
                const imgStyle = isBill ? 'width:80px;height:auto;max-height:50px;' : 'width:50px;height:50px;';
                hintListHTML += `
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:10px 14px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
                    <img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                         style="${imgStyle}object-fit:contain;" onerror="this.style.display='none'" draggable="false">
                    <span style="font-size:18px;font-weight:700;color:#1f2937;">${denom}元</span>
                    <span style="color:#9ca3af;font-size:16px;">×</span>
                    <span style="font-size:18px;font-weight:700;color:#059669;">${cnt} 個</span>
                </div>`;
            });

            const existing = document.getElementById('a4c-hint-modal');
            if (existing) existing.remove();
            const overlay = document.createElement('div');
            overlay.id = 'a4c-hint-modal';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10200;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = `
                <div style="background:white;border-radius:16px;padding:24px;max-width:420px;width:92%;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
                    <div style="text-align:center;font-size:20px;font-weight:700;color:#059669;margin-bottom:6px;">💡 找零提示</div>
                    <div style="text-align:center;font-size:14px;color:#6b7280;margin-bottom:14px;">建議的找零方式：</div>
                    <div>${hintListHTML}</div>
                    <div style="display:flex;gap:10px;justify-content:center;margin-top:12px;">
                        <button id="a4c-hm-replay" style="background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;padding:10px 20px;border-radius:20px;font-size:15px;font-weight:700;cursor:pointer;">🔊 再播一次</button>
                        <button id="a4c-hm-close" style="background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;padding:10px 20px;border-radius:20px;font-size:15px;font-weight:700;cursor:pointer;">我知道了</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);

            this.speech.speak(speechText);
            const closeModal = () => overlay.remove();
            document.getElementById('a4c-hm-close')?.addEventListener('click', closeModal);
            document.getElementById('a4c-hm-replay')?.addEventListener('click', () => { this.speech.speak(speechText); });
            overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
        },

        // 添加普通模式找零拖曳樣式
        addNormalChangeDragStyles() {
            if (!document.getElementById('normal-change-drag-styles')) {
                const style = document.createElement('style');
                style.id = 'normal-change-drag-styles';
                style.textContent = `
                    .store-layout .change-check-area {
                        background: white;
                        margin: 20px;
                        padding: 30px;
                        border-radius: 15px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    }
                    
                    .store-layout .wallet-area {
                        background: white;
                        margin: 20px;
                        padding: 30px;
                        border-radius: 15px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                        width: calc(100% - 40px);
                        box-sizing: border-box;
                    }
                    
                    .remaining-wallet-row, .change-targets-row, .collected-change-area {
                        margin-bottom: 20px;
                        padding: 15px;
                        border: 1px solid #ddd;
                        border-radius: 10px;
                        background: #f9f9f9;
                        width: 100%;
                        box-sizing: border-box;
                    }
                    
                    .remaining-wallet-row h4, .change-targets-row h4, .collected-change-area h4 {
                        margin: 0 0 15px 0;
                        color: #333;
                        font-size: 16px;
                        font-weight: bold;
                    }

                    .collected-change-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                    }

                    .collected-change-header h4 {
                        margin: 0;
                    }

                    .current-change-total-display {
                        background: linear-gradient(135deg, #e8f5e8, #d4edda);
                        color: #2d5a31;
                        padding: 8px 12px;
                        border-radius: 8px;
                        border: 1px solid #b8e6c1;
                        font-size: 14px;
                        font-weight: bold;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        text-align: center;
                        margin: 0 auto;
                        width: fit-content;
                    }
                    
                    .collected-change {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        min-height: 60px;
                        border: 2px dashed #ccc;
                        border-radius: 8px;
                        padding: 10px;
                        background: white;
                    }
                    
                    .collected-change.drag-over {
                        border-color: #4CAF50;
                        background-color: rgba(76, 175, 80, 0.1);
                    }
                    
                    .store-change.drag-over-store {
                        border: 2px solid #4CAF50;
                        background-color: rgba(76, 175, 80, 0.1);
                        border-radius: 10px;
                    }
                    
                    .remaining-wallet {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 15px;
                        margin-bottom: 20px;
                        min-height: 100px;
                        border: 2px solid #e8f5e8;
                        border-radius: 15px;
                        padding: 20px;
                        background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%);
                        justify-content: flex-start;
                    }
                    
                    .remaining-wallet .money-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 10px;
                        border: 2px solid #4CAF50;
                        border-radius: 12px;
                        background: white;
                        cursor: default;
                        transition: all 0.3s ease;
                    }
                    
                    .remaining-wallet .money-item img {
                        width: 50px;
                        height: 50px;
                        object-fit: contain;
                        margin-bottom: 8px;
                    }
                    
                    /* 紙鈔和硬幣的特殊樣式 */
                    .remaining-wallet .money-item.banknote {
                        min-height: 140px;
                        min-width: 120px;
                    }
                    
                    .remaining-wallet .money-item.coin {
                        min-height: 120px;
                        min-width: 80px;
                    }
                    
                    .remaining-wallet .money-item.banknote img {
                        width: 100px !important;
                        height: auto !important;
                        max-height: 60px !important;
                        object-fit: contain !important;
                    }
                    
                    .remaining-wallet .money-item.coin img {
                        width: 50px !important;
                        height: 50px !important;
                        border-radius: 50% !important;
                    }
                    
                    .remaining-wallet .money-item .money-value {
                        font-weight: bold;
                        color: #2E7D32;
                        font-size: 12px;
                    }
                    
                    .change-action-area {
                        text-align: center;
                        margin: 20px;
                    }
                    
                    .complete-change-btn {
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 25px;
                        font-size: 18px;
                        cursor: pointer;
                        transition: background 0.3s ease;
                    }
                    
                    .complete-change-btn:hover {
                        background: #45a049;
                    }
                    
                    .complete-change-btn:disabled {
                        background: #ccc;
                        cursor: not-allowed;
                    }

                    /* 三選一找零選項樣式 - 分為上下兩個框 */
                    .change-question-area {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        margin: 20px 20px 10px 20px;
                        padding: 30px;
                        border-radius: 20px;
                        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }

                    .change-question-area::before {
                        content: '';
                        position: absolute;
                        top: -2px;
                        left: -2px;
                        right: -2px;
                        bottom: -2px;
                        background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c);
                        border-radius: 22px;
                        z-index: -1;
                        animation: gradient-flow 3s ease infinite;
                    }

                    /* @keyframes gradient-flow 已移至 injectGlobalAnimationStyles() */

                    .change-title {
                        color: white;
                        font-size: 18px;
                        font-weight: 500;
                        margin-bottom: 10px;
                        text-align: center;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    }

                    .change-amount-highlight {
                        color: #fff;
                        font-size: 42px;
                        font-weight: bold;
                        margin: 0;
                        text-align: center;
                        width: 100%;
                        display: block;
                        text-shadow: 0 3px 6px rgba(0,0,0,0.4);
                        animation: pulse-glow 2s ease-in-out infinite alternate;
                    }

                    /* @keyframes pulse-glow 已移至 injectGlobalAnimationStyles() */

                    .change-options-area {
                        background: white;
                        margin: 10px 20px 20px 20px;
                        padding: 25px 30px;
                        border-radius: 15px;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                        border-top: 3px solid #e9ecef;
                    }

                    .change-options {
                        display: flex;
                        justify-content: space-around;
                        gap: 20px;
                        flex-wrap: wrap;
                    }

                    .change-option {
                        background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
                        border: 3px solid #007bff;
                        border-radius: 25px;
                        padding: 25px 20px;
                        min-width: 300px;
                        min-height: 220px;
                        cursor: pointer;
                        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        text-align: center;
                        box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15);
                        position: relative;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }

                    .change-option::after {
                        content: '';
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        width: 20px;
                        height: 20px;
                        background: rgba(0, 123, 255, 0.1);
                        border-radius: 50%;
                        transform: scale(0);
                        transition: transform 0.3s ease;
                    }

                    .change-option::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                        transition: left 0.5s;
                    }

                    .change-option:hover {
                        transform: translateY(-12px) scale(1.02);
                        box-shadow: 0 15px 35px rgba(0, 123, 255, 0.3);
                        border-color: #0056b3;
                        background: linear-gradient(145deg, #ffffff 0%, #e3f2fd 100%);
                    }

                    .change-option:hover::before {
                        left: 100%;
                    }

                    .change-option:hover::after {
                        transform: scale(1);
                    }

                    .change-option:active {
                        transform: translateY(-8px) scale(0.98);
                        box-shadow: 0 10px 25px rgba(0, 123, 255, 0.25);
                    }

                    .change-option.selected {
                        transform: translateY(-10px) scale(1.05);
                        box-shadow: 0 15px 35px rgba(0,0,0,0.25);
                        border-width: 4px;
                    }

                    /* 移除通用的選中::after樣式，改用具體的correct-selected和incorrect-selected */

                    .change-option.correct-selected {
                        border: 4px solid #28a745;
                        background: linear-gradient(145deg, #ffffff 0%, #d4edda 100%);
                        box-shadow: 0 0 20px rgba(40, 167, 69, 0.6);
                        animation: correctGreenGlow 1.5s ease-in-out 3 forwards;
                    }

                    .change-option.incorrect-selected {
                        border: 4px solid #dc3545;
                        background: linear-gradient(145deg, #ffffff 0%, #f8d7da 100%);
                        box-shadow: 0 0 20px rgba(220, 53, 69, 0.6);
                        animation: incorrectRedPulse 0.5s ease-in-out 1 forwards;
                    }

                    .change-option.incorrect-selected::after {
                        content: '✕';
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) scale(1);
                        width: 60px;
                        height: 60px;
                        background: rgba(220, 53, 69, 0.9);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 30px;
                        font-weight: bold;
                        color: white;
                        z-index: 10;
                        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.5);
                    }

                    .change-option.correct-selected::after {
                        content: '✓';
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) scale(1);
                        width: 60px;
                        height: 60px;
                        background: rgba(40, 167, 69, 0.9);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 30px;
                        font-weight: bold;
                        color: white;
                        z-index: 10;
                        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.5);
                    }

                    .option-money-display {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        align-items: center;
                        gap: 15px;
                        min-height: 120px;
                        padding: 20px 10px;
                    }

                    .money-item-option {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(255, 255, 255, 0.8);
                        border-radius: 12px;
                        padding: 10px;
                        box-shadow: 0 3px 8px rgba(0,0,0,0.1);
                        transition: transform 0.2s ease;
                    }

                    .money-item-option:hover {
                        transform: scale(1.05);
                        box-shadow: 0 5px 12px rgba(0,0,0,0.15);
                    }

                    .money-item-option img {
                        border-radius: 8px;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                        filter: brightness(1.05);
                    }

                    .no-change-display {
                        color: #28a745;
                        font-weight: bold;
                        font-size: 24px;
                        padding: 40px 20px;
                        background: linear-gradient(145deg, rgba(40, 167, 69, 0.1), rgba(40, 167, 69, 0.05));
                        border-radius: 15px;
                        border: 3px solid #28a745;
                        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 100%;
                        height: 100%;
                    }

                    /* @keyframes correctGreenGlow, incorrectRedPulse 已移至 injectGlobalAnimationStyles() */

                    /* 金額數字顯示樣式 - 預設隱藏 */
                    .option-amount-display {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 15px;
                        padding: 12px 20px;
                        margin-top: 15px;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                        display: none; /* 預設隱藏 */
                        opacity: 0;
                        transform: translateY(20px);
                        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }

                    /* 🔧 只在普通/困難模式下：點擊後或選中後才顯示金額 */
                    .normal-hard-change-mode .change-option.clicked .option-amount-display,
                    .normal-hard-change-mode .change-option.correct-selected .option-amount-display,
                    .normal-hard-change-mode .change-option.incorrect-selected .option-amount-display {
                        display: block;
                        opacity: 1;
                        transform: translateY(0);
                    }

                    /* 🔧 簡單模式：金額一開始就顯示 */
                    .store-layout:not(.normal-hard-change-mode) .option-amount-display {
                        display: block;
                        opacity: 1;
                        transform: translateY(0);
                    }

                    .option-amount-display.show-animation {
                        animation: amount-bounce 0.6s ease-out;
                    }

                    .amount-value {
                        color: white;
                        font-size: 24px;
                        font-weight: bold;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        display: block;
                    }

                    /* @keyframes amount-bounce, correct-pulse, error-sequence 已移至 injectGlobalAnimationStyles() */

                    /* 選中狀態的金額顯示效果 */
                    .change-option.correct-selected .option-amount-display {
                        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                        animation: amount-bounce 0.6s ease-out, correct-pulse 1.5s ease-in-out infinite;
                    }

                    .change-option.incorrect-selected .option-amount-display {
                        background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
                        animation: error-sequence 0.5s ease-out;
                    }
                `;
                document.head.appendChild(style);
            }
        },
        
        // 處理普通模式找零金錢拖曳開始
        handleNormalChangeDragStart(event) {
            const changeId = event.target.dataset.changeId;
            const moneyValue = event.target.dataset.moneyValue;
            const moneyName = event.target.dataset.moneyName;
            
            if (!changeId || !moneyValue) {
                Game.Debug.error('無法取得普通模式找零拖曳數據');
                return;
            }
            
            event.dataTransfer.setData('text/plain', `normal-change-${changeId}-${moneyValue}-${moneyName}`);
            event.dataTransfer.effectAllowed = 'copy';
        },
        
        // 處理普通模式錢包區域拖曳懸停
        handleNormalChangeWalletDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        },
        
        // 處理普通模式錢包區域拖曳進入
        handleNormalChangeWalletDragEnter(event) {
            event.preventDefault();
            const collectedArea = event.target.closest('.collected-change');
            if (collectedArea) {
                collectedArea.classList.add('drag-over');
            }
        },
        
        // 處理普通模式錢包區域拖曳離開
        handleNormalChangeWalletDragLeave(event) {
            const collectedArea = event.target.closest('.collected-change');
            if (collectedArea) {
                collectedArea.classList.remove('drag-over');
            }
        },
        
        // 處理普通模式錢包區域拖曳放置
        handleNormalChangeWalletDrop(event) {
            event.preventDefault();
            
            // 清除拖曳樣式
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
            
            const dragData = event.dataTransfer.getData('text/plain');
            if (!dragData.startsWith('normal-change-')) return;
            
            const [, , changeId, moneyValue, moneyName] = dragData.split('-');
            const value = parseInt(moneyValue);
            
            // 添加到收集區域
            if (!this.state.gameState.normalChangeCollected) {
                this.state.gameState.normalChangeCollected = [];
            }
            
            this.state.gameState.normalChangeCollected.push({
                value: value,
                name: moneyName,
                id: `collected-${Date.now()}-${Math.random()}`
            });
            
            // 播放成功音效
            this.audio.playDropSound();
            
            // 計算目前收集的找零總額
            const currentTotal = this.state.gameState.normalChangeCollected.reduce((sum, money) => sum + money.value, 0);
            
            // 設置找零處理標誌，防止懸停語音干擾
            this.state.gameState.isProcessingChange = true;
            this.state.gameState.isProcessingSpeech = false;
            
            // 播放找零收集語音 - 困難模式只播放找回×元，不播放總額
            const difficulty = this.state.settings.difficulty;
            if (difficulty === 'hard') {
                this.speech.speak(`找回${this.convertToTraditionalCurrency(value)}`, {
                    interrupt: true,
                    callback: () => {
                        this.state.gameState.isProcessingChange = false;
                    }
                });
            } else {
                this.speech.speak(`目前找回零錢${this.convertToTraditionalCurrency(currentTotal)}`, {
                    interrupt: true,
                    callback: () => {
                        this.state.gameState.isProcessingChange = false;
                    }
                });
            }
            
            // 更新收集區域顯示
            this.updateCollectedChangeDisplay();
            
            // 備用機制：3秒後強制清除處理標誌
            this.TimerManager.setTimeout(() => {
                if (this.state.gameState.isProcessingChange) {
                    this.state.gameState.isProcessingChange = false;
                }
            }, 3000, 'uiAnimation');
        },
        
        // 更新收集到的找零顯示
        updateCollectedChangeDisplay() {
            const collectedArea = document.getElementById('collected-change');
            if (!collectedArea || !this.state.gameState.normalChangeCollected) return;

            collectedArea.innerHTML = this.state.gameState.normalChangeCollected.map((money, index) => {
                const side = Math.random() < 0.5 ? 'front' : 'back'; // 🆕 隨機正反面
                return `
                <div class="payment-money-item lit-up draggable-back"
                     draggable="true"
                     ondragstart="Game.handleCollectedChangeDragStart(event)"
                     data-money-id="${money.id}"
                     data-collected-index="${index}">
                    <img src="../images/money/${money.value}_yuan_${side}.png" alt="${money.name}" style="width: 51px; height: 51px;">
                    <div class="hint-value">${money.name}</div>
                </div>
                `;
            }).join('');

            // 更新普通模式的找回零錢總額顯示
            const difficulty = this.state.settings.difficulty;
            if (difficulty === 'normal') {
                const totalElement = document.getElementById('current-change-total');
                if (totalElement) {
                    const currentTotal = this.state.gameState.normalChangeCollected.reduce((sum, money) => sum + money.value, 0);
                    totalElement.textContent = currentTotal;
                }
            }
        },
        
        // 處理收集到的找零拖曳開始
        handleCollectedChangeDragStart(event) {
            const collectedIndex = event.target.closest('.payment-money-item').dataset.collectedIndex;
            const moneyId = event.target.closest('.payment-money-item').dataset.moneyId;
            
            if (!collectedIndex || !moneyId) {
                Game.Debug.error('無法取得收集找零的拖曳數據');
                return;
            }
            
            event.dataTransfer.setData('text/plain', `collected-change-${collectedIndex}-${moneyId}`);
            event.dataTransfer.effectAllowed = 'move';
            
            Game.Debug.log('coin', '開始拖曳收集的找零:', { collectedIndex, moneyId });
        },
        
        // 處理店家找零區域拖曳懸停
        handleStoreChangeDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        },
        
        // 處理店家找零區域拖曳進入
        handleStoreChangeDragEnter(event) {
            event.preventDefault();
            const storeChange = event.target.closest('.store-change');
            if (storeChange) {
                storeChange.classList.add('drag-over-store');
            }
        },
        
        // 處理店家找零區域拖曳離開
        handleStoreChangeDragLeave(event) {
            const storeChange = event.target.closest('.store-change');
            if (storeChange) {
                storeChange.classList.remove('drag-over-store');
            }
        },
        
        // 處理店家找零區域拖曳放置
        handleStoreChangeDrop(event) {
            event.preventDefault();
            
            // 清除拖曳樣式
            document.querySelectorAll('.drag-over-store').forEach(el => {
                el.classList.remove('drag-over-store');
            });
            
            const dragData = event.dataTransfer.getData('text/plain');
            if (!dragData.startsWith('collected-change-')) return;
            
            const [, , collectedIndex, moneyId] = dragData.split('-');
            const index = parseInt(collectedIndex);
            
            if (this.state.gameState.normalChangeCollected && this.state.gameState.normalChangeCollected[index]) {
                // 從收集區域移除該金錢
                this.state.gameState.normalChangeCollected.splice(index, 1);

                // 播放成功音效
                this.audio.playDropSound();

                // 計算剩餘找零總額
                const remainingTotal = this.state.gameState.normalChangeCollected.reduce((sum, money) => sum + money.value, 0);

                // 播放語音回饋（普通模式）
                const difficulty = this.state.settings.difficulty;
                if (difficulty === 'normal') {
                    // 🔧 [修正] 如果是最後一個金錢被拖回，播放特殊語音
                    const speechText = remainingTotal === 0 ?
                        '目前找回零錢 零元' :
                        `目前找回零錢${this.convertToTraditionalCurrency(remainingTotal)}`;

                    this.speech.speak(speechText, {
                        interrupt: true
                    });
                }

                // 更新收集區域顯示
                this.updateCollectedChangeDisplay();

                Game.Debug.log('coin', '找零金錢已退回店家找零區域');
            }
        },
        
        // 完成普通模式找零
        completeNormalChange() {
            const difficulty = this.state.settings.difficulty;

            // 只允許普通和困難模式調用此函數
            if (difficulty === 'easy') {
                Game.Debug.log('flow', '簡單模式不應該調用 completeNormalChange()');
                return;
            }

            const transaction = this.state.gameState.currentTransaction;
            const expectedChange = transaction.changeExpected;

            // 簡化邏輯：普通模式現在像簡單模式一樣，直接驗證店家給出的找零是否正確
            if (true) { // 暫時總是正確，因為只是確認店家找零
                // 找零正確
                this.audio.playSuccessSound(() => {
                    const changeAmount = Game.state.gameState.currentTransaction.changeExpected;

                    Game.TimerManager.setTimeout(() => {
                        // 🔧 [修正] 零元時的特殊語音
                        const speechText = changeAmount === 0 ?
                            '找回零錢 零元，恭喜！答案正確' :
                            `找您${Game.convertToTraditionalCurrency(changeAmount)}，恭喜！答案正確`;

                        Game.speech.speak(speechText, {
                            callback: () => {
                                Game.TimerManager.setTimeout(() => {
                                    Game.showGameComplete(true);
                                }, 1000, 'screenTransition');
                            }
                        });
                    }, 500, 'speechDelay');
                });
            } else {
                // 找零錯誤
                this.audio.playErrorSound();
                this.speech.speak(`找零金額不正確，應該是${this.convertToTraditionalCurrency(expectedChange)}，你收集了${this.convertToTraditionalCurrency(collectedTotal)}，請重新收集`, { interrupt: true });
            }
        },
        
        // 簡單模式無找零確認
        completeEasyModeNoChange() {
            // 🔧 [修復] 檢查當前場景，防止上一輪的回調在錯誤場景執行
            const currentScene = this.state.gameState.currentScene;
            if (currentScene !== 'checking') {
                Game.Debug.warn('flow', `⚠️ [A4-簡單模式無找零] 在 ${currentScene} 場景下被調用，忽略此調用`);
                return;
            }

            // 直接完成，因為確實無需找零
            this.audio.playSuccessSound(() => {
                // 🔧 [修復] 再次檢查場景
                const currentScene = Game.state.gameState.currentScene;
                if (currentScene !== 'checking') {
                    Game.Debug.warn('flow', `⚠️ [A4-簡單模式無找零音效完成] 在 ${currentScene} 場景下被調用，忽略此回調`);
                    return;
                }

                Game.TimerManager.setTimeout(() => {
                    Game.speech.speak('正確！這次購物無需找零', {
                        callback: () => {
                            // 🔧 [修復] 檢查場景後再進入下一階段
                            const currentScene = Game.state.gameState.currentScene;
                            if (currentScene !== 'checking') {
                                Game.Debug.warn('flow', `⚠️ [A4-簡單模式無找零語音完成] 在 ${currentScene} 場景下被調用，忽略此回調`);
                                return;
                            }

                            Game.TimerManager.setTimeout(() => {
                                Game.showGameComplete(true);
                            }, 1000, 'screenTransition');
                        }
                    });
                }, 500, 'speechDelay');
            });
        },

        // 🔧 [修正] 生成找零選項（三選一）- 確保選項金額唯一性
        generateChangeOptions(expectedChange) {
            const correctOption = {
                isCorrect: true,
                totalValue: expectedChange,
                money: expectedChange === 0 ? [] : this.generateChangeMoneyDisplay(expectedChange)
            };

            const wrongOptions = [];
            const existingValues = new Set([expectedChange]);

            if (expectedChange === 0) {
                // 當不需要找零時，生成兩個唯一的、非零的錯誤選項
                while (wrongOptions.length < 2) {
                    const wrongAmount = Math.floor(Math.random() * 35) + 5; // 5到39元
                    if (!existingValues.has(wrongAmount)) {
                        existingValues.add(wrongAmount);
                        wrongOptions.push({
                            isCorrect: false,
                            totalValue: wrongAmount,
                            money: this.generateChangeMoneyDisplay(wrongAmount)
                        });
                    }
                }
            } else {
                // 當需要找零時，生成兩個唯一的錯誤選項
                while (wrongOptions.length < 2) {
                    let wrongAmount;
                    const randomChoice = Math.random();

                    if (randomChoice < 0.5) {
                        // 策略1：多找的金額
                        wrongAmount = expectedChange + (Math.floor(Math.random() * 16) + 5); // 多找 5~20 元
                    } else {
                        // 策略2：少找的金額 (確保至少為1)
                        const reduction = Math.floor(Math.random() * 10) + 1; // 減少 1~10 元
                        wrongAmount = Math.max(1, expectedChange - reduction);
                    }

                    if (!existingValues.has(wrongAmount)) {
                        existingValues.add(wrongAmount);
                        wrongOptions.push({
                            isCorrect: false,
                            totalValue: wrongAmount,
                            money: this.generateChangeMoneyDisplay(wrongAmount)
                        });
                    }
                }
            }

            const allOptions = [correctOption, ...wrongOptions];
            return this.shuffleArray(allOptions);
        },

        // 生成找零金錢顯示
        generateChangeMoneyDisplay(amount) {
            if (amount === 0) return [];

            const money = [];
            let remaining = amount;

            // 優先使用大面額
            const denominations = [500, 100, 50, 10, 5, 1];

            for (const denom of denominations) {
                while (remaining >= denom) {
                    const moneyItem = this.storeData?.moneyItems?.find(m => m.value === denom);
                    if (moneyItem) {
                        money.push({...moneyItem});
                        remaining -= denom;
                    } else {
                        break;
                    }
                }
            }

            return money;
        },

        // 隨機排列陣列
        shuffleArray(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        },

        // 🔧 [修改] 輔助函數：根據難度設定金額顯示
        setAmountDisplayByDifficulty(amountDisplay) {
            if (!amountDisplay) return;
            const difficulty = this.state.settings.difficulty;

            if (difficulty === 'normal') {
                // 🔧 [修改] 普通模式：移除 inline style，讓 CSS 控制顯示
                amountDisplay.style.display = '';
                amountDisplay.classList.remove('show-animation');
            } else {
                // 簡單和困難模式：保持原有邏輯
                amountDisplay.style.display = '';
                amountDisplay.classList.remove('show-animation');
            }
        },

        // ========== A4 困難模式：第三步計算找零頁面 ==========

        renderCalculationSceneUI() {
            Game.Debug.log('ui', '🎨 [A4-計算場景UI] 渲染計算找零頁面');

            const app = document.getElementById('app');
            const transaction = this.state.gameState.currentTransaction;
            const selectedItem = this.state.gameState.selectedItem;
            const { totalCost, amountPaid, changeExpected } = transaction;

            // 獲取商品顯示信息（圖示同第三步 8rem，文字垂直置中）
            let itemDisplay;
            if (selectedItem.category === 'multi-selection') {
                itemDisplay = selectedItem.items.map(item => {
                    const info = this.parseProductDisplay(item, 1);
                    return `<span class="item-display-pair">${this.getProductIconHTML(item, '8rem')}<span class="item-name-text">${info.name}</span></span>`;
                }).join('、');
            } else {
                const info = this.parseProductDisplay(selectedItem, 1);
                itemDisplay = `<span class="item-display-pair">${this.getProductIconHTML(selectedItem, '8rem')}<span class="item-name-text">${info.name}</span></span>`;
            }

            app.innerHTML = `
                <style>${this.getCalculationSceneCSS()}</style>
                <div class="store-layout">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <span class="store-icon-large">${this.getCurrentStoreInfo().emoji}</span>
                            <span>${this.getCurrentStoreInfo().name}</span>
                        </div>
                        <div class="title-bar-center">第四步：計算找零金額</div>
                        <div class="title-bar-right">
                            <span>第 ${this.state.quiz.currentQuestion + 1} 題 / 共 ${this.state.settings.questionCount || 10} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="location.reload()">返回設定</button>
                        </div>
                    </div>

                    <div class="calculation-scene-container">
                        <div class="top-row">
                            <!-- 左側：商品資訊區域 -->
                            <div class="item-info-section">
                                <div class="section-title">🛍️ 購買物品</div>
                                <div class="item-info" style="text-align: center;">
                                    <div class="item-display">${itemDisplay}</div>
                                    <div class="transaction-summary">
                                        <div>商品總價：${totalCost}元</div>
                                        <div>實付金額：${amountPaid}元</div>
                                    </div>
                                </div>
                            </div>

                            <!-- 右側：計算機區域 -->
                            <div class="calculator-area">
                                <div class="calculator-toggle">
                                    <button id="toggle-calculator-btn" class="calculator-btn">
                                        🧮 開啟計算機
                                    </button>
                                </div>
                                <div id="calculator-container" class="calculator-container" style="display: none;">
                                    ${this.getCalculatorHTML()}
                                </div>
                            </div>
                        </div>

                        <!-- 計算公式區域 -->
                        <div class="calculation-section">
                            <div class="section-title">💰 計算找零金額</div>
                            <div class="calculation-formula">
                                <span class="formula-text">${amountPaid}元 - ${totalCost}元 = </span>
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
                            <button id="confirm-calculation-btn" class="confirm-btn" disabled>
                                確認答案
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // 設置事件監聽器
            this.setupCalculationSceneListeners(transaction, selectedItem);
        },

        setupCalculationSceneListeners(transaction, selectedItem) {
            const input = document.getElementById('change-input');
            const confirmBtn = document.getElementById('confirm-calculation-btn');
            const toggleCalcBtn = document.getElementById('toggle-calculator-btn');
            const calculatorContainer = document.getElementById('calculator-container');

            // 🆕 [普通模式] 使用 stepErrorCounts 追蹤找零計算錯誤
            this.state.gameState.stepErrorCounts.changeCalculation = 0;
            this.state.gameState.stepHintsShown.changeCalculation = false;
            Game.Debug.log('hint', '🔄 [找零計算-Scene] 錯誤計數已重置');

            let calculatorOpen = false;
            let calculatorState = {
                displayValue: '0',
                previousValue: null,
                operator: null,
                waitingForOperand: false,
                expression: ''
            };

            // 點擊輸入框顯示數字鍵盤
            input.addEventListener('click', () => {
                this.showNumberPad(input, confirmBtn, transaction.changeExpected);
            });

            // 切換計算機
            toggleCalcBtn.addEventListener('click', () => {
                calculatorOpen = !calculatorOpen;
                calculatorContainer.style.display = calculatorOpen ? 'block' : 'none';
                toggleCalcBtn.textContent = calculatorOpen ? '🧮 關閉計算機' : '🧮 開啟計算機';

                if (calculatorOpen) {
                    calculatorState.displayValue = '0';
                    calculatorState.previousValue = null;
                    calculatorState.operator = null;
                    calculatorState.waitingForOperand = false;
                    calculatorState.expression = '';
                    this.setupCalculatorListeners(calculatorState);
                } else {
                    const buttons = calculatorContainer.querySelectorAll('.calc-btn');
                    buttons.forEach(btn => {
                        const newBtn = btn.cloneNode(true);
                        btn.parentNode.replaceChild(newBtn, btn);
                    });
                }
            });

            // 確認按鈕
            confirmBtn.addEventListener('click', () => {
                const userAnswer = parseInt(input.value);
                window.LearningTracker?.logStep?.(`找零計算（應找${transaction.changeExpected}元）`, userAnswer === transaction.changeExpected);
                if (userAnswer === transaction.changeExpected) {
                    // 答對了，顯示視覺回饋後進入找零驗證頁面
                    input.style.border = '3px solid #10b981';
                    input.style.background = '#ecfdf5';
                    input.style.color = '#065f46';
                    confirmBtn.disabled = true;
                    confirmBtn.textContent = '✓ 正確！';
                    confirmBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

                    this.audio.playCorrect02Sound();

                    const speechText = `答對了！找回${this.convertToTraditionalCurrency(transaction.changeExpected)}`;
                    this.speech.speak(speechText, {
                        callback: () => {
                            // 生成找零
                            this.generateChange();
                            // 進入第四步：找零驗證
                            this.SceneManager.switchScene('checking', this);
                        }
                    });
                } else {
                    // 答錯了，顯示視覺回饋
                    input.style.border = '3px solid #ef4444';
                    input.style.background = '#fef2f2';
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this.state.gameState.stepErrorCounts.changeCalculation++;
                    const errorCount = this.state.gameState.stepErrorCounts.changeCalculation;
                    Game.Debug.log('hint', `🔴 [找零計算-Scene] 錯誤次數: ${errorCount}`);
                    this.audio.playErrorSound();

                    let feedbackText;
                    if (errorCount >= 3) {
                        feedbackText = `答案是${this.convertToTraditionalCurrency(transaction.changeExpected)}，再想想看`;
                    } else {
                        feedbackText = '答錯了，再試試看';
                    }

                    this.speech.speak(feedbackText);
                    this.TimerManager.setTimeout(() => {
                        input.value = '';
                        input.style.border = '3px solid #ffd700';
                        input.style.background = 'white';
                        input.style.color = '#2d3748';
                        confirmBtn.disabled = true;
                    }, 1500, 'uiAnimation');
                }
            });
        },

        getCalculationSceneCSS() {
            return `
                /* 計算找零場景容器 - 緊湊佈局 */
                .calculation-scene-container {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 8px 20px 20px 20px;
                    max-width: 1100px;
                    margin: 0 auto;
                    position: relative;
                }

                /* 商品資訊與計算機區域 */
                .top-row {
                    position: relative;
                    display: grid;
                    grid-template-columns: 1fr 500px 1fr;
                    width: 100%;
                    min-height: 160px;
                }

                /* 商品資訊區域 */
                .item-info-section {
                    grid-column: 2;
                    width: 500px;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    border-radius: 20px;
                    padding: 12px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                }

                .item-info {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    background: white;
                    padding: 12px;
                    border-radius: 15px;
                    margin-top: 5px;
                }

                .item-display {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 0.5rem;
                }

                .item-display-pair {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .item-name-text {
                    font-size: 1.8em;
                    font-weight: bold;
                    color: #2d3748;
                    vertical-align: middle;
                }

                .transaction-summary {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    font-size: 1.2em;
                    color: #4a5568;
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

                .calculator-toggle {
                    text-align: center;
                }

                .calculator-btn {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 12px 30px;
                    font-size: 1.3em;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);
                    width: 100%;
                }

                .calculator-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(245, 158, 11, 0.4);
                }

                .calculator-container {
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                }

                /* 計算找零金額區域 */
                .calculation-section {
                    width: 500px;
                    margin: 0 auto;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    padding: 12px;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                }

                .calculation-section .section-title {
                    color: white;
                    margin-bottom: 10px;
                    font-size: 1.5em;
                    font-weight: bold;
                    text-align: center;
                }

                .calculation-formula {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 15px;
                    border-radius: 15px;
                }

                .formula-text {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: white;
                    white-space: nowrap;
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

                /* 確認按鈕區域 */
                .confirm-section {
                    width: 500px;
                    margin: 0 auto;
                    text-align: center;
                }

                .confirm-btn {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border: none;
                    border-radius: 15px;
                    padding: 15px 40px;
                    font-size: 1.5em;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                }

                .confirm-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
                }

                .confirm-btn:disabled {
                    background: #d1d5db;
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
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }

                .number-pad {
                    background: white;
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    min-width: 300px;
                }

                .number-pad-display {
                    background: #f5f5f5;
                    padding: 15px;
                    border-radius: 10px;
                    text-align: center;
                    font-size: 2em;
                    font-weight: bold;
                    margin-bottom: 15px;
                    min-height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
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
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .num-btn:hover {
                    background: #f0f0f0;
                    border-color: #2196F3;
                }

                .num-btn:active {
                    transform: scale(0.95);
                }

                .number-pad-footer {
                    display: flex;
                    gap: 10px;
                }

                .num-cancel-btn,
                .num-confirm-btn {
                    flex: 1;
                    padding: 15px;
                    font-size: 1.2em;
                    font-weight: bold;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .num-cancel-btn {
                    background: #e0e0e0;
                    color: #333;
                }

                .num-cancel-btn:hover {
                    background: #d0d0d0;
                }

                .num-confirm-btn {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                }

                .num-confirm-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
                }

                /* 計算機樣式 */
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

                /* 已移除計算機按鈕縮小動畫效果 */
                /* .calc-btn:active {
                    transform: scale(0.95);
                } */

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

                /* 響應式設計 */
                @media (max-width: 1000px) {
                    .calculation-scene-container {
                        padding: 15px;
                    }

                    .top-row {
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
                    }

                    .confirm-section {
                        width: 100%;
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

        // ========== A4 困難模式：計算彈窗 (從C6移植) ==========

        showA4HardModeCalculationModal(transaction, selectedItem) {
            Game.Debug.log('ui', '🎨 [A4-困難模式] 顯示計算彈窗');
            Game.Debug.log('product', '📦 [A4-困難模式] selectedItem:', selectedItem);
            Game.Debug.log('product', '📦 [A4-困難模式] selectedItem.emoji:', selectedItem?.emoji);
            const { totalCost, amountPaid, changeExpected } = transaction;

            // 獲取商品顯示信息（使用formatItemDisplay統一處理）
            const itemDisplay = this.formatItemDisplay(selectedItem, 'large');

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
                            <div class="item-details">
                                <div class="item-display">
                                    ${itemDisplay}
                                </div>
                                <div class="transaction-summary">
                                    <div>商品總價：${totalCost}元</div>
                                    <div>實付金額：${amountPaid}元</div>
                                </div>
                            </div>
                        </div>
                        <div class="calculation-formula">
                            <span class="formula-text">${amountPaid}元 - ${totalCost}元 = </span>
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
            this.setupCalculationModalListeners(transaction, selectedItem);
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

        setupCalculationModalListeners(transaction, selectedItem) {
            const input = document.getElementById('change-input');
            const confirmBtn = document.getElementById('confirm-calculation-btn');
            const toggleCalcBtn = document.getElementById('toggle-calculator-btn');
            const calculatorContainer = document.getElementById('calculator-container');

            // 🆕 [普通模式] 使用 stepErrorCounts 追蹤找零計算錯誤
            this.state.gameState.stepErrorCounts.changeCalculation = 0;
            this.state.gameState.stepHintsShown.changeCalculation = false;
            Game.Debug.log('hint', '🔄 [找零計算-Modal] 錯誤計數已重置');

            let calculatorOpen = false;
            let calculatorState = {
                displayValue: '0',
                previousValue: null,
                operator: null,
                waitingForOperand: false,
                expression: ''
            };

            // 點擊輸入框顯示數字鍵盤
            input.addEventListener('click', () => {
                this.showNumberPad(input, confirmBtn, transaction.changeExpected);
            });

            // 切換計算機
            toggleCalcBtn.addEventListener('click', () => {
                calculatorOpen = !calculatorOpen;
                calculatorContainer.style.display = calculatorOpen ? 'block' : 'none';
                toggleCalcBtn.textContent = calculatorOpen ? '🧮 關閉計算機' : '🧮 開啟計算機';

                if (calculatorOpen) {
                    calculatorState.displayValue = '0';
                    calculatorState.previousValue = null;
                    calculatorState.operator = null;
                    calculatorState.waitingForOperand = false;
                    calculatorState.expression = '';
                    this.setupCalculatorListeners(calculatorState);
                } else {
                    const buttons = calculatorContainer.querySelectorAll('.calc-btn');
                    buttons.forEach(btn => {
                        const newBtn = btn.cloneNode(true);
                        btn.parentNode.replaceChild(newBtn, btn);
                    });
                }
            });

            // 確認按鈕
            confirmBtn.addEventListener('click', () => {
                const userAnswer = parseInt(input.value);
                window.LearningTracker?.logStep?.(`找零計算（應找${transaction.changeExpected}元）`, userAnswer === transaction.changeExpected);
                if (userAnswer === transaction.changeExpected) {
                    // 答對了，關閉彈窗，進入找零驗證頁面
                    this.audio.playCorrect02Sound();

                    const speechText = `答對了！找回${this.convertToTraditionalCurrency(transaction.changeExpected)}`;
                    this.speech.speak(speechText, {
                        callback: () => {
                            document.getElementById('calculation-modal-overlay').remove();
                            // 🔧 [修正] 直接進入選擇題驗證頁面，避免重複顯示計算彈窗
                            const app = document.getElementById('app');
                            this.showNormalHardModeChangeVerification(app, transaction, selectedItem);
                        }
                    });
                } else {
                    // 答錯了
                    // 🆕 [普通模式] 使用 stepErrorCounts 計數
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this.state.gameState.stepErrorCounts.changeCalculation++;
                    const errorCount = this.state.gameState.stepErrorCounts.changeCalculation;
                    Game.Debug.log('hint', `🔴 [找零計算-Modal] 錯誤次數: ${errorCount}`);
                    this.audio.playErrorSound();

                    const correctAnswer = transaction.changeExpected;
                    let speechText;

                    if (errorCount < 3) {
                        speechText = '不對，請再試一次';
                    } else {
                        speechText = `不對，正確答案是${correctAnswer}元，請再試一次`;
                    }

                    this.speech.speak(speechText, {
                        callback: () => {
                            input.value = '';
                            confirmBtn.disabled = true;
                        }
                    });
                }
            });
        },

        showNumberPad(input, confirmBtn, correctAnswer) {
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

            numBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const value = btn.dataset.value;
                    currentValue += value;
                    display.textContent = currentValue;
                });
            });

            backspaceBtn.addEventListener('click', () => {
                currentValue = currentValue.slice(0, -1);
                display.textContent = currentValue || '0';
            });

            clearBtn.addEventListener('click', () => {
                currentValue = '';
                display.textContent = '0';
            });

            cancelPadBtn.addEventListener('click', () => {
                numberPad.remove();
            });

            confirmPadBtn.addEventListener('click', () => {
                input.value = currentValue;
                confirmBtn.disabled = !currentValue;
                numberPad.remove();
            });
        },

        setupCalculatorListeners(state) {
            const display = document.getElementById('calculator-display');
            const expression = document.getElementById('calculator-expression');
            const buttons = document.querySelectorAll('.calc-btn');

            const updateDisplay = () => {
                display.textContent = state.displayValue;
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
                    if (nextOperator) {
                        state.expression = `${inputValue} ${nextOperator}`;
                    }
                } else if (state.operator) {
                    const currentValue = state.previousValue || 0;
                    const newValue = this.calculate(currentValue, inputValue, state.operator);

                    state.displayValue = String(newValue);
                    state.previousValue = newValue;

                    if (nextOperator) {
                        state.expression = `${newValue} ${nextOperator}`;
                    } else {
                        state.expression = '';
                    }
                }

                state.waitingForOperand = true;
                state.operator = nextOperator;
                updateDisplay();
            };

            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
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
                });
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

                /* @keyframes fadeIn 已移至 injectGlobalAnimationStyles() */

                .calculation-modal {
                    background: white;
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
                    animation: slideDown 0.3s ease;
                }

                /* @keyframes slideDown 已移至 injectGlobalAnimationStyles() */

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

                .transaction-summary {
                    font-size: 1.2em;
                    color: #2d3748;
                }

                .transaction-summary div {
                    margin-bottom: 10px;
                }

                .item-emoji {
                    font-size: 4em;
                }

                .item-details {
                    flex: 1;
                }

                .item-display {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 15px;
                }

                .item-display .item-emoji {
                    font-size: 4em;
                }

                .item-name {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #2d3748;
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

                /* 已移除計算機按鈕縮小動畫效果 */
                /* .calc-btn:active {
                    transform: scale(0.95);
                } */

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

        // 處理找零選項選擇
        selectChangeOption(optionIndex, isCorrect, changeAmount) {
            // 🔧 [增強] 防止重複點擊機制：檢查全局狀態和特定選項狀態
            if (this.state.gameState.isTransitioning || this.state.gameState.isProcessingChange) {
                Game.Debug.log('flow', '🚫 [A4-找零] 選項處理中，忽略重複點擊');
                return;
            }

            // 🔧 [新增] 檢查特定選項是否已被點擊過
            const selectedOption = document.querySelector(`[data-option-index="${optionIndex}"]`);
            if (!selectedOption) {
                Game.Debug.log('flow', '🚫 [A4-找零] 找不到選項元素');
                return;
            }

            if (selectedOption.classList.contains('selected') ||
                selectedOption.classList.contains('correct-selected') ||
                selectedOption.classList.contains('incorrect-selected')) {
                Game.Debug.log('flow', '🚫 [A4-找零] 選項已被選中，忽略重複點擊');
                return;
            }

            // 設置處理標誌
            this.state.gameState.isProcessingChange = true;

            Game.Debug.log('flow', `選擇選項 ${optionIndex + 1}: ${changeAmount}元, 正確: ${isCorrect}`);

            // 移除所有選項的選中狀態和金額顯示
            document.querySelectorAll('.change-option').forEach(option => {
                option.classList.remove('selected', 'correct-selected', 'incorrect-selected', 'clicked');
                const amountDisplay = option.querySelector('.option-amount-display');
                if (amountDisplay) {
                    // 🔧 [修正] 普通模式保持顯示金額
                    this.setAmountDisplayByDifficulty(amountDisplay);
                }
            });

            // 添加選中狀態和動畫
            if (selectedOption) {
                // 🔧 添加 clicked class 以顯示金額
                selectedOption.classList.add('clicked');
                selectedOption.classList.add('selected');
                selectedOption.classList.add(isCorrect ? 'correct-selected' : 'incorrect-selected');

                // 🔧 [修改] 顯示選中選項的金額數字（透過 CSS class 控制）
                const amountDisplay = selectedOption.querySelector('.option-amount-display');
                if (amountDisplay) {
                    // 所有難度都透過 CSS 的 .clicked class 來控制顯示
                    // 不設置 inline style，讓 CSS 規則來控制
                    amountDisplay.classList.add('show-animation');
                }
            }

            // 立即播放音效
            if (isCorrect) {
                // 🔧 [統一設計] 正確處理：只播放音效，使用CSS動畫事件清理
                this.audio.playSuccessSound();
                this.handleCorrectChangeSelectionSimplified(selectedOption, changeAmount);
            } else {
                // 🔧 [重新設計] 錯誤處理：只播放音效，使用CSS動畫事件清理
                this.audio.playErrorSound();
                this.handleIncorrectChangeSelectionSimplified(selectedOption);
            }
        },

        // 🔧 [全新設計] 簡化的正確處理：使用CSS動畫事件控制
        handleCorrectChangeSelectionSimplified(selectedOption, changeAmount) {
            Game.Debug.log('flow', '🎉 [A4-找零] 正確處理：使用CSS動畫事件精確控制');
            Game.Debug.log('flow', '🔍 [A4-找零] 找零金額參數:', changeAmount, '類型:', typeof changeAmount);

            // 🔧 [關鍵修正] 防止競爭條件的旗標
            let hasHandled = false;
            // 🔧 [修正雙重觸發] 儲存備用機制計時器ID
            let backupTimerId = null;

            // 🔧 [關鍵修正] 統一的正確處理函數，防止競爭條件
            const onCorrect = (source) => {
                if (hasHandled) {
                    Game.Debug.log('flow', `🚫 [A4-找零] ${source}觸發，但已處理過，跳過`);
                    return;
                }
                hasHandled = true;
                Game.Debug.log('flow', `✅ [A4-找零] ${source}觸發，開始處理正確答案`);

                // 清除備用機制
                if (backupTimerId) {
                    clearTimeout(backupTimerId);
                    backupTimerId = null;
                    Game.Debug.log('timer', '🔧 [A4-找零] 已清除備用機制');
                }

                // 移除事件監聽器
                selectedOption.removeEventListener('animationend', handleAnimationEnd);

                // 立即清除處理標誌
                this.state.gameState.isProcessingChange = false;

                // 強制停止所有語音播放，防止衝突
                if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    Game.Debug.log('speech', '🔧 [A4-找零] 已取消所有語音合成，防止衝突');
                }

                // 保存完整的交易數據
                this.state.gameState.completedTransaction = {
                    selectedItem: this.state.gameState.selectedItem,
                    totalCost: this.state.gameState.currentTransaction.totalCost,
                    amountPaid: this.state.gameState.currentTransaction.amountPaid,
                    changeExpected: this.state.gameState.currentTransaction.changeExpected,
                    paidMoney: [...this.state.gameState.currentTransaction.paidMoney]
                };

                // 播放正確語音
                const speechText = changeAmount === 0 ?
                    '正確！這次購物無需找零' :
                    `正確！應該找您${this.convertToTraditionalCurrency(changeAmount)}`;

                Game.Debug.log('speech', '🔍 [A4-找零] 即將播放的語音內容:', speechText);

                this.speech.speak(speechText, {
                    callback: () => {
                        Game.Debug.log('flow', '🔧 [A4-找零] 語音完成回調，調用showGameComplete');

                        // 清理UI效果
                        selectedOption.classList.remove('selected', 'correct-selected', 'incorrect-selected');
                        selectedOption.style.animation = '';
                        selectedOption.style.transform = '';
                        selectedOption.style.boxShadow = '';
                        selectedOption.style.border = '';
                        selectedOption.style.background = '';

                        // 🔧 [修正] 根據難度設定金額顯示
                        const amountDisplay = selectedOption.querySelector('.option-amount-display');
                        if (amountDisplay) {
                            this.setAmountDisplayByDifficulty(amountDisplay);
                        }

                        // 調用showGameComplete進入自動流程
                        Game.Debug.log('flow', '🎯 [A4-找零] 語音完成，調用showGameComplete進入自動流程');
                        Game.TimerManager.setTimeout(() => {
                            Game.showGameComplete(true);
                        }, 1000, 'screenTransition');
                    }
                });
            };

            // 🔧 [關鍵修正] 使用CSS動畫事件而非setTimeout
            const handleAnimationEnd = (event) => {
                Game.Debug.log('ui', '🔍 [A4-找零] 動畫事件觸發:', event.animationName);
                // 🔧 [修正] 正確匹配動畫名稱 - 實際觸發的是不同的動畫
                if (event.animationName === 'correctGreenGlow' ||
                    event.animationName === 'amount-bounce' ||
                    event.animationName.includes('correct') ||
                    event.target === selectedOption) {
                    onCorrect('動畫事件');
                }
            };

            // 監聽CSS動畫結束事件
            selectedOption.addEventListener('animationend', handleAnimationEnd);

            // 🔧 [修正] 簡化的備用機制，延長時間防止誤觸發
            backupTimerId = this.TimerManager.setTimeout(() => {
                onCorrect('備用機制');
                backupTimerId = null;
            }, 1500, 'uiAnimation'); // 延長到1.5秒，降低誤觸發風險
        },

        // 🗑️ [保留] 舊的正確處理函數（暫時保留以防需要回滾）
        handleCorrectChangeSelection_OLD(changeAmount) {
            // 🔧 [新增] 延遲復原動畫的備用機制
            const resetAnimation = () => {
                document.querySelectorAll('.change-option').forEach(option => {
                    option.classList.remove('selected', 'correct-selected', 'incorrect-selected');
                    // 🔧 [修正] 根據難度設定金額顯示
                    const amountDisplay = option.querySelector('.option-amount-display');
                    if (amountDisplay) {
                        this.setAmountDisplayByDifficulty(amountDisplay);
                    }
                });
            };

            this.TimerManager.setTimeout(() => {
                const speechText = changeAmount === 0 ?
                    '正確！這次購物無需找零' :
                    `正確！應該找您${this.convertToTraditionalCurrency(changeAmount)}`;

                this.speech.speak(speechText, {
                    callback: () => {
                        resetAnimation();
                        // 🔧 [新增] 清除處理標誌
                        Game.state.gameState.isProcessingChange = false;
                        Game.TimerManager.setTimeout(() => {
                            Game.showGameComplete(true);
                        }, 1000, 'screenTransition');
                    }
                });

                // 🔧 [新增] 備用復原機制 - 無論語音是否成功都會執行
                this.TimerManager.setTimeout(() => {
                    resetAnimation();
                    // 🔧 [新增] 備用機制也要清除處理標誌
                    Game.state.gameState.isProcessingChange = false;
                    Game.TimerManager.setTimeout(() => {
                        Game.showGameComplete(true);
                    }, 1000, 'screenTransition');
                }, 3000, 'uiAnimation'); // 3秒後強制復原
            }, 500, 'speechDelay');
        },

        // 🔧 [全新設計] 簡化的錯誤處理：只有音效+動畫，無語音干擾
        handleIncorrectChangeSelectionSimplified(selectedOption) {
            Game.Debug.log('audio', '🔊 [A4-找零] 錯誤處理：只播放音效和動畫，無語音干擾');

            // 🔧 [關鍵修正] 使用CSS動畫事件而非setTimeout
            const handleAnimationEnd = (event) => {
                if (event.animationName === 'incorrectRedPulse') {
                    Game.Debug.log('ui', '✅ [A4-找零] CSS動畫結束，立即清理UI');

                    // 立即清除所有視覺效果
                    selectedOption.classList.remove('selected', 'correct-selected', 'incorrect-selected');
                    selectedOption.style.animation = '';
                    selectedOption.style.transform = '';
                    selectedOption.style.boxShadow = '';
                    selectedOption.style.border = '';
                    selectedOption.style.background = '';

                    // 🔧 [修正] 根據難度設定金額顯示
                    const amountDisplay = selectedOption.querySelector('.option-amount-display');
                    if (amountDisplay) {
                        this.setAmountDisplayByDifficulty(amountDisplay);
                    }

                    // 移除事件監聽器
                    selectedOption.removeEventListener('animationend', handleAnimationEnd);

                    // 立即解除點擊鎖定
                    this.state.gameState.isProcessingChange = false;
                    Game.Debug.log('flow', '✅ [A4-找零] 用戶可以立即重新選擇');
                }
            };

            // 監聽CSS動畫結束事件
            selectedOption.addEventListener('animationend', handleAnimationEnd);

            // 備用機制：防止事件失效
            this.TimerManager.setTimeout(() => {
                if (this.state.gameState.isProcessingChange) {
                    Game.Debug.log('timer', '🔧 [A4-找零] 備用清理機制啟動');
                    selectedOption.classList.remove('selected', 'correct-selected', 'incorrect-selected');

                    // 🔧 [修正] 備用機制根據難度設定金額顯示
                    const amountDisplay = selectedOption.querySelector('.option-amount-display');
                    if (amountDisplay) {
                        this.setAmountDisplayByDifficulty(amountDisplay);
                    }

                    selectedOption.removeEventListener('animationend', handleAnimationEnd);
                    this.state.gameState.isProcessingChange = false;
                }
            }, 1000, 'uiAnimation');
        },

        // 🗑️ [保留] 舊的錯誤處理函數（暫時保留以防需要回滾）
        handleIncorrectChangeSelection_OLD(selectedAmount) {
            const correctAmount = this.state.gameState.currentTransaction.changeExpected;

            // 🔧 [修正] 定義動畫重置函數
            const resetAnimation = () => {
                document.querySelectorAll('.change-option').forEach(option => {
                    // 立即清除所有視覺效果和動畫
                    option.classList.remove('selected', 'correct-selected', 'incorrect-selected');
                    option.style.animation = 'none'; // 強制停止動畫
                    option.style.transform = ''; // 清除transform
                    option.style.boxShadow = ''; // 清除box-shadow
                    option.style.border = ''; // 重置邊框
                    option.style.background = ''; // 重置背景

                    const amountDisplay = option.querySelector('.option-amount-display');
                    if (amountDisplay) {
                        // 🔧 [修正] 根據難度設定金額顯示
                        this.setAmountDisplayByDifficulty(amountDisplay);
                    }
                });
                Game.Debug.log('ui', '✅ [A4-找零] 錯誤動畫UI已強制清理完成');
            };

            // 🔧 [修正] 等待錯誤動畫播放完成後再清理視覺效果
            // incorrectRedPulse 動畫時長為 0.5秒，精確等待 500ms 與動畫同步
            this.TimerManager.setTimeout(() => {
                resetAnimation();
            }, 500, 'uiAnimation');

            // 播放錯誤提示語音
            const speechText = correctAmount === 0 ?
                '不對，這次購物無需找零，請重新選擇' :
                `不對，正確的找零應該是${this.convertToTraditionalCurrency(correctAmount)}，請重新選擇`;

            this.speech.speak(speechText, {
                callback: () => {
                    // 🔧 [優化] 語音結束後，解除點擊鎖定，允許用戶重新選擇
                    this.state.gameState.isProcessingChange = false;
                    Game.Debug.log('speech', '✅ [A4-找零] 錯誤提示語音完成，用戶可以重新選擇');
                }
            });

            // 備用機制 - 確保處理標誌被清除，以防語音系統卡住
            this.TimerManager.setTimeout(() => {
                if (this.state.gameState.isProcessingChange) {
                    Game.Debug.log('timer', '🔧 [A4-找零] 備用機制：強制清除處理標誌');
                    this.state.gameState.isProcessingChange = false;
                }
            }, 3000, 'uiAnimation'); // 3秒後強制清除標誌
        },

        // 困難模式不需找零確認
        completeNoChange() {
            const difficulty = this.state.settings.difficulty;
            
            // 只允許困難模式調用此函數
            if (difficulty !== 'hard') {
                Game.Debug.log('flow', '只有困難模式可以調用 completeNoChange()');
                return;
            }
            
            const transaction = this.state.gameState.currentTransaction;
            const expectedChange = transaction.changeExpected;
            
            if (expectedChange === 0) {
                // 確實不需找零 - 正確
                this.audio.playSuccessSound(() => {
                    Game.TimerManager.setTimeout(() => {
                        Game.speech.speak('正確！這次購物不需找零', {
                            callback: () => {
                                Game.TimerManager.setTimeout(() => {
                                    Game.showGameComplete(true);
                                }, 1000, 'screenTransition');
                            }
                        });
                    }, 500, 'speechDelay');
                });
            } else {
                // 需要找零但選擇了不需找零 - 錯誤
                this.audio.playErrorSound();
                this.speech.speak(`錯誤！這次購物需要找零，應該找零，請重新選擇`, { interrupt: true });
            }
        },
        
        // 計算剩餘錢包內容（扣除已付款的錢幣）
        calculateRemainingWallet() {
            const originalWallet = [...this.state.gameState.playerWallet];
            const paidMoney = this.state.gameState.currentTransaction.paidMoney;
            
            // 從原始錢包中移除已付款的錢幣
            const remainingWallet = [];
            const usedPaidMoney = [];
            
            originalWallet.forEach(money => {
                // 檢查這個錢幣是否已被用於付款
                const usedIndex = paidMoney.findIndex(paid => 
                    paid.value === money.value && !usedPaidMoney.includes(paid)
                );
                
                if (usedIndex === -1) {
                    // 沒有用於付款，保留在錢包中
                    remainingWallet.push(money);
                } else {
                    // 標記為已使用
                    usedPaidMoney.push(paidMoney[usedIndex]);
                }
            });
            
            return remainingWallet;
        },
        
        // 添加找零拖曳樣式（已移至CSS文件，此函數保留用於其他拖曳相關樣式）
        addChangeDragStyles() {
            if (!document.getElementById('change-drag-styles')) {
                const style = document.createElement('style');
                style.id = 'change-drag-styles';
                style.textContent = `
                    /* 確保父級元素不影響標題欄寬度 */
                    #app {
                        width: 100vw !important;
                        max-width: 100vw !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-sizing: border-box !important;
                    }
                    
                    .store-layout {
                        width: 100vw !important;
                        min-height: 100vh;
                        box-sizing: border-box;
                        margin: 0 !important;
                        padding: 0 !important;
                        position: relative !important;
                    }
                    
                    .store-layout .title-bar {
                        margin: 0 !important;
                        padding: 20px 30px !important;
                        width: 100vw !important;
                        max-width: 100vw !important;
                        box-sizing: border-box !important;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important;
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        position: relative !important;
                        left: 0 !important;
                        right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    
                    .store-layout .transaction-summary {
                        background: white;
                        margin: 20px;
                        padding: 30px;
                        border-radius: 15px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                        width: calc(100% - 40px);
                        box-sizing: border-box;
                    }
                    
                    .store-layout .change-check-area {
                        background: white;
                        margin: 20px;
                        padding: 30px;
                        border-radius: 15px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                        width: calc(100% - 40px);
                        box-sizing: border-box;
                    }
                    
                    .store-layout .wallet-area {
                        background: white;
                        margin: 20px;
                        padding: 30px;
                        border-radius: 15px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                        width: calc(100% - 40px);
                        box-sizing: border-box;
                    }
                    
                    .store-layout .change-targets-row,
                    .store-layout .remaining-wallet-row {
                        margin-bottom: 20px;
                        padding: 15px;
                        border: 1px solid #ddd;
                        border-radius: 10px;
                        background: #f9f9f9;
                        width: 100%;
                        box-sizing: border-box;
                    }
                    
                    .store-layout .change-targets-row h4,
                    .store-layout .remaining-wallet-row h4 {
                        margin: 0 0 15px 0;
                        color: #333;
                        font-size: 16px;
                        font-weight: bold;
                    }
                    
                    .store-layout .change-targets {
                        min-height: 80px;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 15px;
                        justify-content: center;
                        padding: 10px;
                    }

                    .store-layout .change-targets-container {
                        background: white;
                        margin: 20px;
                        padding: 30px;
                        border-radius: 15px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                        width: calc(100% - 40px);
                        box-sizing: border-box;
                    }

                    .store-layout .change-targets-container h3 {
                        text-align: center;
                        color: #333;
                        margin-bottom: 20px;
                        font-size: 18px;
                    }

                    .store-layout .change-target {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 15px;
                        border: 3px dashed #ccc;
                        border-radius: 12px;
                        background: #f9f9f9;
                        min-width: 80px;
                        min-height: 100px;
                        transition: all 0.3s ease;
                    }

                    .store-layout .change-target.faded {
                        opacity: 0.4;
                        filter: grayscale(70%);
                    }

                    .store-layout .change-target.faded img {
                        width: 50px;
                        height: 50px;
                        object-fit: contain;
                    }

                    .store-layout .change-target.faded .money-value {
                        font-size: 12px;
                        color: #666;
                        margin-top: 5px;
                        text-align: center;
                    }

                    .store-layout .change-target.dragover {
                        border-color: #4CAF50;
                        background-color: #e8f5e8;
                        opacity: 1;
                        filter: none;
                    }

                    .store-layout .change-target.filled {
                        border-color: #4CAF50;
                        background-color: #e8f5e8;
                        opacity: 1;
                        filter: none;
                    }
                    
                    
                    .change-money.draggable {
                        cursor: grab;
                        transition: transform 0.2s ease;
                    }
                    
                    .change-money.draggable:hover {
                        transform: scale(1.05);
                    }
                    
                    .change-money.draggable:active {
                        cursor: grabbing;
                    }
                    
                    .remaining-wallet {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 15px;
                        margin-bottom: 20px;
                        min-height: 100px;
                        border: 2px solid #e8f5e8;
                        border-radius: 15px;
                        padding: 20px;
                        background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%);
                        justify-content: flex-start;
                    }
                    
                    .remaining-wallet .money-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 10px;
                        border: 2px solid #4CAF50;
                        border-radius: 12px;
                        background: white;
                        cursor: default;
                        transition: all 0.3s ease;
                    }
                    
                    .remaining-wallet .money-item img {
                        width: 50px;
                        height: 50px;
                        object-fit: contain;
                        margin-bottom: 8px;
                    }
                    
                    /* 紙鈔和硬幣的特殊樣式 */
                    .remaining-wallet .money-item.banknote {
                        min-height: 140px;
                        min-width: 120px;
                    }
                    
                    .remaining-wallet .money-item.coin {
                        min-height: 120px;
                        min-width: 80px;
                    }
                    
                    .remaining-wallet .money-item.banknote img {
                        width: 100px !important;
                        height: auto !important;
                        max-height: 60px !important;
                        object-fit: contain !important;
                    }
                    
                    .remaining-wallet .money-item.coin img {
                        width: 50px !important;
                        height: 50px !important;
                        border-radius: 50% !important;
                    }
                    
                    .remaining-wallet .money-item .money-value {
                        font-weight: bold;
                        color: #2E7D32;
                        font-size: 12px;
                    }
                    
                    .change-targets {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 15px;
                        border-top: 1px solid #eee;
                        padding-top: 15px;
                        justify-content: center;
                    }
                    
                    .change-target {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 10px;
                        border: 2px dashed #ccc;
                        border-radius: 12px;
                        background: #f5f5f5;
                        transition: all 0.3s ease;
                        cursor: default;
                    }
                    
                    .change-target img {
                        width: 50px;
                        height: 50px;
                        object-fit: contain;
                        margin-bottom: 8px;
                    }
                    
                    /* 找零目標位置的紙鈔和硬幣樣式 */
                    .change-target.banknote {
                        min-height: 140px;
                        min-width: 120px;
                    }
                    
                    .change-target.coin {
                        min-height: 120px;
                        min-width: 80px;
                    }
                    
                    .change-target.banknote img {
                        width: 100px !important;
                        height: auto !important;
                        max-height: 60px !important;
                        object-fit: contain !important;
                    }
                    
                    .change-target.coin img {
                        width: 50px !important;
                        height: 50px !important;
                        border-radius: 50% !important;
                    }
                    
                    .change-target .money-value {
                        font-weight: bold;
                        color: #666;
                        font-size: 12px;
                    }
                    
                    .change-target.faded {
                        opacity: 0.4;
                        filter: grayscale(70%);
                    }
                    
                    .change-target.drag-over {
                        border-color: #4CAF50;
                        background-color: rgba(76, 175, 80, 0.1);
                        transform: scale(1.05);
                    }
                    
                    .change-target.filled {
                        opacity: 1;
                        filter: none;
                        border-color: #4CAF50;
                        background-color: rgba(76, 175, 80, 0.2);
                    }
                    
                    .wallet-content.drag-over-wallet {
                        border-color: #4CAF50;
                        background-color: rgba(76, 175, 80, 0.05);
                    }

                    /* 找回零錢顯示置中樣式 */
                    .change-amount-display {
                        text-align: center;
                        margin: 20px 0;
                        padding: 15px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 12px;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                    }

                    .summary-change {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        gap: 8px;
                        font-size: 18px;
                        font-weight: bold;
                        color: white;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                    }

                    .change-amount-value {
                        color: #f1c40f;
                        font-size: 20px;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    }
                `;
                document.head.appendChild(style);
            }
        },
        
        // 處理找零金錢懸停語音
        handleChangeMoneyHover(event) {
            const changeElement = event.target.closest('.change-money');
            if (!changeElement) return;

            const moneyName = changeElement.dataset.moneyName;

            // 🚫 [修正] 完全禁用找零頁面金錢碰觸語音
            Game.Debug.log('speech', '找零頁面金錢語音已被全面禁用:', moneyName);
            return;
            
            // 清除之前的語音播放和狀態
            if (this.speech.currentUtterance) {
                window.speechSynthesis.cancel();
            }
            
            // 確保先清除舊狀態，然後設置新狀態
            this.state.gameState.isProcessingSpeech = false;
            this.TimerManager.setTimeout(() => {
                this.state.gameState.isProcessingSpeech = true;

                // 播放當前找零金錢的語音
                Game.Debug.log('speech', '準備播放找零金錢語音:', moneyName);
                this.speech.speak(moneyName, {
                    callback: () => {
                        Game.Debug.log('speech', '找零金錢語音播放完成');
                        Game.state.gameState.isProcessingSpeech = false;
                    }
                });
            }, 10, 'speechDelay');

            // 備用清除機制：2秒後強制清除語音處理狀態
            this.TimerManager.setTimeout(() => {
                if (this.state.gameState.isProcessingSpeech) {
                    Game.Debug.log('speech', '強制清除找零金錢語音處理狀態');
                    this.state.gameState.isProcessingSpeech = false;
                }
            }, 2000, 'speechDelay');
        },
        
        // 🔧 [新增] 處理店家找零區金錢點擊功能
        handleChangeMoneyClick(event) {
            Game.Debug.log('assist', '🎯 [A4找零點擊] handleChangeMoneyClick 被呼叫');

            // 檢查當前場景，第3步頁面停用雙擊放置功能
            const currentScene = this.state.gameState.currentScene;
            if (currentScene === 'checking') {
                Game.Debug.log('assist', '🚫 [A4找零點擊] 第3步頁面已停用雙擊放置功能');
                return;
            }
            
            const changeElement = event.target.closest('.change-money');
            if (!changeElement) {
                Game.Debug.log('assist', '❌ [A4找零點擊] 未找到找零金錢元素');
                return;
            }
            
            const changeId = changeElement.dataset.changeId;
            const moneyValue = parseInt(changeElement.dataset.moneyValue);
            const moneyName = changeElement.dataset.moneyName;
            
            Game.Debug.log('assist', '🔍 [A4找零點擊] 點擊店家找零', {
                changeId: changeId,
                moneyValue: moneyValue,
                moneyName: moneyName
            });
            
            if (!changeId || !moneyValue) {
                Game.Debug.error('❌ [A4找零點擊] 找零數據不完整');
                return;
            }
            
            // 檢查是否為雙擊（使用相同的雙擊檢測邏輯）
            const currentTime = Date.now();
            const clickState = this.state.gameState.clickState;
            
            const isSameElement = clickState.lastClickedElement && 
                                clickState.lastClickedElement.dataset.changeId === changeId;
            const isWithinDoubleClickTime = (currentTime - clickState.lastClickTime) < clickState.doubleClickDelay;
            
            Game.Debug.log('assist', '🔍 [A4找零點擊] 雙擊檢測', {
                isSameElement: isSameElement,
                timeDiff: currentTime - clickState.lastClickTime,
                isWithinDoubleClickTime: isWithinDoubleClickTime
            });
            
            if (isSameElement && isWithinDoubleClickTime) {
                // 雙擊 - 執行將找零金錢放置到錢包
                Game.Debug.log('assist', '✅ [A4找零點擊] 偵測到雙擊，執行找零放置');
                this.executeChangeMoneyPlacement(changeElement);
                this.clearMoneySelection();
            } else {
                // 單擊 - 選擇找零金錢
                Game.Debug.log('assist', '🔵 [A4找零點擊] 第一次點擊，選擇找零金錢');
                this.selectChangeMoneyItem(changeElement);
                clickState.lastClickTime = currentTime;
                clickState.lastClickedElement = changeElement;
            }
        },
        
        // 選擇找零金錢物品
        selectChangeMoneyItem(changeElement) {
            // 清除之前的選擇
            this.clearMoneySelection();
            
            // 標記新的選擇
            changeElement.classList.add('selected-item');
            this.state.gameState.clickState.selectedItem = changeElement;
            
            // 播放選擇音效
            if (this.audio.selectSound) {
                this.audio.selectSound.play().catch(console.log);
            }
            
            Game.Debug.log('assist', '🎵 [A4找零點擊] 找零金錢已選擇', { changeId: changeElement.dataset.changeId });
        },
        
        // 執行找零金錢放置（模擬拖放到錢包）
        executeChangeMoneyPlacement(changeElement) {
            const changeId = changeElement.dataset.changeId;
            const moneyValue = parseInt(changeElement.dataset.moneyValue);
            const moneyName = changeElement.dataset.moneyName;
            
            Game.Debug.log('assist', '🚀 [A4找零點擊] 執行找零金錢放置', { 
                changeId: changeId,
                moneyValue: moneyValue,
                moneyName: moneyName
            });
            
            // 創建模擬的拖放事件
            const mockDropEvent = {
                preventDefault: () => {},
                target: document.querySelector('.wallet-content'),
                dataTransfer: {
                    getData: (type) => {
                        if (type === 'text/plain') {
                            return `change-${changeId}-${moneyValue}-${moneyName}`;
                        }
                        return '';
                    }
                },
                clickPlacement: true // 標記這是點擊放置
            };
            
            // 調用現有的錢包拖放處理邏輯
            this.handleChangeWalletDrop(mockDropEvent);
        },
        
        // 🔧 [新增] 普通/困難模式店家找零區金錢點擊功能
        handleNormalChangeMoneyClick(event) {
            Game.Debug.log('assist', '🎯 [A4普通找零點擊] handleNormalChangeMoneyClick 被呼叫');

            // 檢查當前場景，第3步頁面停用雙擊放置功能
            const currentScene = this.state.gameState.currentScene;
            if (currentScene === 'checking') {
                Game.Debug.log('assist', '🚫 [A4普通找零點擊] 第3步頁面已停用雙擊放置功能');
                return;
            }
            
            const changeElement = event.target.closest('.change-money');
            if (!changeElement) {
                Game.Debug.log('assist', '❌ [A4普通找零點擊] 未找到找零金錢元素');
                return;
            }
            
            const changeId = changeElement.dataset.changeId;
            const moneyValue = parseInt(changeElement.dataset.moneyValue);
            const moneyName = changeElement.dataset.moneyName;
            
            Game.Debug.log('assist', '🔍 [A4普通找零點擊] 點擊店家找零', {
                changeId: changeId,
                moneyValue: moneyValue,
                moneyName: moneyName
            });
            
            // 檢查雙擊
            const currentTime = Date.now();
            const clickState = this.state.gameState.clickState;
            
            const isSameElement = clickState.lastClickedElement && 
                                clickState.lastClickedElement.dataset.changeId === changeId;
            const isWithinDoubleClickTime = (currentTime - clickState.lastClickTime) < clickState.doubleClickDelay;
            
            if (isSameElement && isWithinDoubleClickTime) {
                // 雙擊 - 執行找零放置
                Game.Debug.log('assist', '✅ [A4普通找零點擊] 偵測到雙擊，執行找零放置');
                this.executeNormalChangeMoneyPlacement(changeElement);
                this.clearMoneySelection();
            } else {
                // 單擊 - 選擇找零金錢
                Game.Debug.log('assist', '🔵 [A4普通找零點擊] 第一次點擊，選擇找零金錢');
                this.selectChangeMoneyItem(changeElement);
                clickState.lastClickTime = currentTime;
                clickState.lastClickedElement = changeElement;
            }
        },
        
        // 執行普通/困難模式找零金錢放置
        executeNormalChangeMoneyPlacement(changeElement) {
            const changeId = changeElement.dataset.changeId;
            const moneyValue = parseInt(changeElement.dataset.moneyValue);
            const moneyName = changeElement.dataset.moneyName;
            
            Game.Debug.log('assist', '🚀 [A4普通找零點擊] 執行找零金錢放置', { 
                changeId: changeId,
                moneyValue: moneyValue,
                moneyName: moneyName
            });
            
            // 創建模擬的拖放事件
            const mockDropEvent = {
                preventDefault: () => {},
                target: document.querySelector('.wallet-content'),
                dataTransfer: {
                    getData: (type) => {
                        if (type === 'text/plain') {
                            return `normal-change-${changeId}-${moneyValue}-${moneyName}`;
                        }
                        return '';
                    }
                },
                clickPlacement: true
            };
            
            // 調用普通模式錢包拖放處理邏輯
            this.handleNormalChangeWalletDrop(mockDropEvent);
        },

        // 處理錢包中金錢在找零驗證頁面的點擊事件
        handleWalletChangeClick(event) {
            Game.Debug.log('assist', '🎯 [A4錢包找零點擊] handleWalletChangeClick 被呼叫');

            // 檢查當前場景，第3步頁面停用雙擊放置功能
            const currentScene = this.state.gameState.currentScene;
            if (currentScene === 'checking') {
                Game.Debug.log('assist', '🚫 [A4錢包找零點擊] 第3步頁面已停用雙擊放置功能');
                return;
            }
            
            // 找到金錢元素
            const moneyElement = event.target.closest('.money-item');
            if (!moneyElement || !moneyElement.dataset.moneyId) {
                Game.Debug.log('assist', '❌ [A4錢包找零點擊] 未找到有效的金錢元素');
                return;
            }
            
            const moneyId = moneyElement.dataset.moneyId;
            const currentTime = Date.now();
            const clickState = this.state.gameState.clickState;
            const difficulty = this.state.settings.difficulty;
            
            Game.Debug.log('assist', '🔍 [A4錢包找零點擊] 點擊狀態檢查', {
                moneyId: moneyId,
                lastClickedElementId: clickState.lastClickedElement?.dataset?.moneyId,
                timeDiff: currentTime - clickState.lastClickTime,
                doubleClickDelay: clickState.doubleClickDelay
            });
            
            // 判斷是否為雙擊
            const isSameElement = clickState.lastClickedElement && 
                                clickState.lastClickedElement.dataset.moneyId === moneyId;
            const isWithinDoubleClickTime = (currentTime - clickState.lastClickTime) < clickState.doubleClickDelay;
            
            if (isSameElement && isWithinDoubleClickTime) {
                // 雙擊 - 執行錢包金錢放回動作
                Game.Debug.log('assist', '✅ [A4錢包找零點擊] 偵測到雙擊，執行錢包金錢放回');
                this.executeWalletChangeReturn(moneyElement);
                this.clearMoneySelection();
            } else {
                // 單擊 - 選擇錢包金錢
                Game.Debug.log('assist', '🔵 [A4錢包找零點擊] 第一次點擊，選擇錢包金錢');
                this.selectMoney(moneyElement);
                clickState.lastClickTime = currentTime;
                clickState.lastClickedElement = moneyElement;
            }
        },

        // 執行錢包金錢放回動作（在找零驗證頁面）
        executeWalletChangeReturn(moneyElement) {
            const moneyId = moneyElement.dataset.moneyId;
            const difficulty = this.state.settings.difficulty;
            
            Game.Debug.log('assist', '🚀 [A4錢包找零點擊] 執行錢包金錢放回', { 
                moneyId: moneyId,
                difficulty: difficulty
            });
            
            // 根據難度決定放回的目標區域
            if (difficulty === 'easy') {
                // 簡單模式：錢包金錢不能被點擊放回（通常沒有這個需求）
                Game.Debug.log('assist', '⚠️ [A4錢包找零點擊] 簡單模式不支援錢包金錢放回');
                return;
            } else {
                // 普通/困難模式：錢包金錢點擊放回到店家找零區域
                this.executeWalletToChangeReturn(moneyElement);
            }
        },

        // 錢包金錢放回到店家找零區域
        executeWalletToChangeReturn(moneyElement) {
            const moneyId = moneyElement.dataset.moneyId;
            
            // 找到對應的錢幣數據
            const money = this.state.gameState.wallet.find(m => m.id === moneyId);
            if (!money) {
                Game.Debug.error('❌ [A4錢包找零點擊] 在錢包中找不到對應的金錢:', moneyId);
                return;
            }
            
            // 從錢包中移除
            this.state.gameState.wallet = this.state.gameState.wallet.filter(m => m.id !== moneyId);
            this.updateWalletTotal();
            
            // 加回到店家找零區域
            // 找到店家找零區域並創建找零金錢元素
            const changeArea = document.querySelector('.change-money-display') || document.querySelector('.change-display');
            if (changeArea) {
                const changeId = `change-return-${Date.now()}`;
                const changeMoneyHTML = `
                    <div class="change-money" 
                         data-change-id="${changeId}" 
                         data-money-value="${money.value}"
                         onclick="Game.handleNormalChangeMoneyClick(event)"
                         draggable="true" 
                         ondragstart="Game.handleChangeDragStart(event)">
                        <img src="${money.displayImage || money.images.front}" alt="${money.name}">
                        <div class="money-value">${money.name}</div>
                    </div>
                `;
                changeArea.insertAdjacentHTML('beforeend', changeMoneyHTML);
                
                Game.Debug.log('assist', '✅ [A4錢包找零點擊] 成功將錢包金錢放回店家找零區域');
            } else {
                Game.Debug.error('❌ [A4錢包找零點擊] 找不到店家找零區域');
                // 如果找不到找零區域，將錢幣加回錢包
                this.state.gameState.wallet.push(money);
                this.updateWalletTotal();
                return;
            }
            
            // 重新渲染錢包內容
            const walletContent = document.querySelector('.remaining-wallet');
            if (walletContent) {
                // 重新渲染剩餘錢包內容
                const remainingWallet = this.state.gameState.wallet.filter(money => 
                    !this.state.transaction.collectedChange.some(collected => collected.id === money.id)
                );
                
                walletContent.innerHTML = remainingWallet.map(money => {
                    const isBanknote = money.value >= 100;
                    const itemClass = isBanknote ? 'money-item banknote' : 'money-item coin';
                    return `
                        <div class="${itemClass}" 
                             data-money-id="${money.id}" 
                             data-money-name="${money.name}"
                             onclick="Game.handleWalletChangeClick(event)">
                            <img src="${money.displayImage || money.images.front}" alt="${money.name}">
                            <div class="money-value">${money.name}</div>
                        </div>
                    `;
                }).join('');
            }
        },

        // 處理找零錢幣拖曳開始
        handleChangeDragStart(event) {
            // 由於子元素使用了 pointer-events: none，事件目標應該是 .change-money 元素
            const changeId = event.target.dataset.changeId;
            const moneyValue = event.target.dataset.moneyValue;
            
            Game.Debug.log('coin', '拖曳開始 - changeId:', changeId, 'moneyValue:', moneyValue);
            
            if (!changeId || !moneyValue) {
                Game.Debug.error('無法取得拖曳數據 - changeId或moneyValue為空');
                Game.Debug.error('event.target.dataset:', event.target.dataset);
                return;
            }
            
            event.dataTransfer.setData('text/plain', `change-${changeId}-${moneyValue}`);
            event.dataTransfer.effectAllowed = 'move';
        },
        
        // 處理錢包區域拖曳懸停
        handleChangeWalletDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        },
        
        // 處理錢包區域拖曳進入
        handleChangeWalletDragEnter(event) {
            event.preventDefault();
            const walletArea = event.target.closest('.wallet-change-area');
            if (walletArea) {
                walletArea.classList.add('drag-over-wallet');
            }
            
            // 檢查是否懸停在目標位置上
            const target = event.target.closest('.change-target');
            if (target && target.classList.contains('faded')) {
                target.classList.add('drag-over');
            }
        },
        
        // 處理錢包區域拖曳離開
        handleChangeWalletDragLeave(event) {
            const walletArea = event.target.closest('.wallet-change-area');
            if (walletArea) {
                walletArea.classList.remove('drag-over-wallet');
            }
            
            const target = event.target.closest('.change-target');
            if (target) {
                target.classList.remove('drag-over');
            }
        },

        // 處理找零目標拖曳進入
        handleChangeTargetDragEnter(event) {
            event.preventDefault();
            const target = event.target.closest('.change-target');
            if (target) {
                target.classList.add('drag-over');
            }
        },

        // 處理找零目標拖曳經過
        handleChangeTargetDragOver(event) {
            event.preventDefault();
            // 保持拖曳狀態，允許放置
        },

        // 處理找零目標拖曳離開
        handleChangeTargetDragLeave(event) {
            const target = event.target.closest('.change-target');
            if (target) {
                target.classList.remove('drag-over');
            }
        },

        // 處理找零目標拖曳放置
        handleChangeTargetDrop(event) {
            event.preventDefault();

            // 🔧 輔助點擊模式：不允許使用者直接拖曳找零，須透過點擊模式操作
            if (event.isTrusted && this.state.settings.clickMode && this.state.gameState.clickModeState?.active) {
                this.audio.playErrorSound();
                return;
            }

            // 清除拖曳樣式
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });

            const dragData = event.dataTransfer.getData('text/plain');

            // 檢查 dragData 是否有效
            if (!dragData) {
                Game.Debug.error('🚫 [A4-找零拖放] dragData 為 undefined 或 null，無法處理拖放');
                return;
            }

            if (!dragData.startsWith('change-')) {
                Game.Debug.log('coin', '🚫 [A4-找零拖放] 不是找零錢幣，忽略拖放');
                return;
            }

            const [, changeId, moneyValue] = dragData.split('-');

            // ================================================================================
            // 🎯 【v3 最終修正】 增強目標查找邏輯
            // 新增策略4：當事件目標是父容器時，主動在容器內尋找匹配的子目標。
            // ================================================================================
            let target = null;

            // 方法1: 嘗試使用 event.target.closest()（適用於桌面端拖放）
            if (event.target && typeof event.target.closest === 'function') {
                target = event.target.closest('.change-target');
                if (target) {
                    Game.Debug.log('coin', '📱 [A4-找零拖放] 方法1成功：使用 event.target.closest() 找到目標');
                }
            }

            // 方法2: 如果方法1失敗，直接檢查 event.target 是否就是目標元素（適用於手機端）
            if (!target && event.target && event.target.classList && event.target.classList.contains('change-target')) {
                target = event.target;
                Game.Debug.log('coin', '📱 [A4-找零拖放] 方法2成功：event.target 本身就是目標元素');
            }

            // 方法3: 如果前兩種方法都失敗，查找當前具有 hover 效果的目標（TouchDragUtility備用方案）
            if (!target) {
                target = document.querySelector('.change-target.touch-drop-zone-hover, .change-target.drag-over');
                if (target) {
                    Game.Debug.log('coin', '📱 [A4-找零拖放] 方法3成功：找到具有 hover 效果的目標元素');
                }
            }

            // 🔽🔽🔽 【新增的策略4】 🔽🔽🔽
            if (!target) {
                // 如果仍然找不到目標，且事件目標是父容器，則在容器內尋找匹配的子目標
                const container = event.target.closest('.change-targets');
                if (container) {
                    Game.Debug.log('coin', '🎯 [A4-找零拖放] 策略4：在容器內尋找匹配的目標');

                    // 尋找第一個尚未被填充（仍有 faded class）且金額匹配的目標
                    const matchingTarget = container.querySelector(
                        `.change-target.faded[data-expected-value="${moneyValue}"]`
                    );

                    if (matchingTarget) {
                        Game.Debug.log('coin', '✅ [A4-找零拖放] 策略4成功：找到一個匹配且可用的目標');
                        target = matchingTarget;
                    } else {
                        Game.Debug.log('coin', '🟡 [A4-找零拖放] 策略4：在容器內未找到匹配或可用的目標');
                    }
                }
            }
            // 🔼🔼🔼 【新增的策略4結束】 🔼🔼🔼

            if (!target) {
                Game.Debug.log('coin', '🚫 [A4-找零拖放] 所有策略均失敗，未找到找零目標區域');
                // 播放錯誤音效，提示用戶放置到正確位置
                this.audio.playErrorSound();
                this.speech.speak('請放置到正確的圖示上', { interrupt: true });
                return;
            }

            if (!target.classList.contains('faded')) {
                Game.Debug.log('coin', '🚫 [A4-找零拖放] 目標位置已被填充');
                return;
            }

            const targetIndex = parseInt(target.dataset.targetIndex);
            const expectedValue = parseInt(target.dataset.expectedValue);

            // 檢查面額是否匹配
            if (parseInt(moneyValue) === expectedValue) {
                Game.Debug.log('coin', '✅ [A4-找零拖放] 找零錢幣放置成功', {
                    changeId: changeId,
                    moneyValue: moneyValue,
                    targetIndex: targetIndex
                });

                // 成功放置 - 視覺效果
                target.classList.remove('faded');
                target.classList.add('filled');

                // 隱藏原始找零錢幣
                const originalMoney = document.querySelector(`[data-change-id="${changeId}"]`);
                if (originalMoney) {
                    originalMoney.style.display = 'none';
                }

                // 播放成功音效
                this.audio.playDropSound();

                // 檢查是否所有找零都已放置完成
                const allTargets = document.querySelectorAll('.change-target');
                const filledTargets = document.querySelectorAll('.change-target.filled');

                if (allTargets.length === filledTargets.length) {
                    Game.Debug.log('flow', '🎉 [A4-找零拖放] 所有找零錢幣已正確放置');

                    // 播放成功音效和煙火動畫
                    this.audio.playSuccessSound(() => {
                        // 🔧 [修復] 檢查當前場景，防止上一輪的回調在下一輪的付款場景執行
                        const currentScene = this.state.gameState.currentScene;
                        if (currentScene !== 'checking') {
                            Game.Debug.warn('flow', `⚠️ [A4-找零完成] 在 ${currentScene} 場景下被調用，忽略此回調`);
                            return;
                        }

                        // 計算總找零金額
                        const totalChangeAmount = Array.from(filledTargets).reduce((sum, target) => {
                            return sum + parseInt(target.dataset.expectedValue);
                        }, 0);

                        // 播放成功語音
                        const speechText = `答對了，你總共拿回${this.convertToTraditionalCurrency(totalChangeAmount)}`;
                        Game.Debug.log('speech', '🎙️ [A4-找零完成] 播放成功語音:', speechText);

                        this.speech.speak(speechText, {
                            callback: () => {
                                // 🔧 [修復] 再次檢查當前場景，確保語音播放後的回調也在正確的場景下執行
                                const currentScene = this.state.gameState.currentScene;
                                if (currentScene !== 'checking') {
                                    Game.Debug.warn('flow', `⚠️ [A4-找零語音完成] 在 ${currentScene} 場景下被調用，忽略此回調`);
                                    return;
                                }

                                // 語音播放完成後進入下一輪或交易摘要
                                Game.Debug.log('flow', '🎯 [A4-找零完成] 語音播放完成，進入下一階段');
                                this.proceedToNextQuestion();
                            }
                        });
                    });
                }
            } else {
                Game.Debug.log('coin', '❌ [A4-找零拖放] 面額不匹配', {
                    provided: moneyValue,
                    expected: expectedValue
                });

                // 播放錯誤音效
                this.audio.playErrorSound();
            }
        },

        // 處理錢包區域拖曳放置
        handleChangeWalletDrop(event) {
            event.preventDefault();
            
            // 清除拖曳樣式
            document.querySelectorAll('.drag-over-wallet').forEach(el => {
                el.classList.remove('drag-over-wallet');
            });
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
            
            const dragData = event.dataTransfer.getData('text/plain');
            if (!dragData.startsWith('change-')) return;
            
            const [, changeId, moneyValue] = dragData.split('-');
            const target = event.target.closest('.change-target');
            
            if (target && target.classList.contains('faded')) {
                const targetIndex = parseInt(target.dataset.targetIndex);
                const expectedValue = parseInt(target.dataset.expectedValue);
                
                // 檢查面額是否匹配
                if (parseInt(moneyValue) === expectedValue) {
                    // 成功放置
                    target.classList.remove('faded');
                    target.classList.add('filled');
                    
                    // 隱藏原始找零錢幣
                    const originalMoney = document.querySelector(`[data-change-id="${changeId}"]`);
                    if (originalMoney) {
                        originalMoney.style.display = 'none';
                    }
                    
                    // 更新狀態
                    this.state.gameState.changeDropTargets[targetIndex].isDropped = true;
                    
                    // 播放成功音效
                    this.audio.playDropSound();
                    
                    // 計算目前已放置的找零總額
                    const droppedTargets = this.state.gameState.changeDropTargets.filter(target => target.isDropped);
                    const currentChangeTotal = droppedTargets.reduce((sum, target) => sum + target.expectedMoney.value, 0);
                    
                    // 設置找零處理標誌，防止懸停語音干擾
                    this.state.gameState.isProcessingChange = true;
                    this.state.gameState.isProcessingSpeech = false; // 清除一般語音處理標誌
                    
                    // 檢查是否為最後一個金錢
                    const allDropped = this.state.gameState.changeDropTargets.every(target => target.isDropped);
                    const moneyItem = this.state.gameState.changeDropTargets[targetIndex].expectedMoney;
                    
                    // 將allDropped狀態暫存，供後續使用
                    this.state.gameState._lastDroppedAll = allDropped;
                    
                    if (allDropped) {
                        // 最後一個金錢，設置完成標誌並直接播放完成語音
                        this.state.gameState.changeCompleted = true;

                        Game.TimerManager.setTimeout(() => {
                            Game.audio.playSuccessSound(() => {
                                // 🔧 [修復] 檢查當前場景，防止上一輪的回調在下一輪的付款場景執行
                                const currentScene = Game.state.gameState.currentScene;
                                if (currentScene !== 'checking') {
                                    Game.Debug.warn('flow', `⚠️ [A4-找零錢包完成] 在 ${currentScene} 場景下被調用，忽略此回調`);
                                    return;
                                }

                                // 🔧 [修正] 零元時的特殊語音
                                const speechText = currentChangeTotal === 0 ?
                                    '找回零錢 零元，恭喜！答案正確' :
                                    `找您${Game.convertToTraditionalCurrency(currentChangeTotal)}，恭喜！答案正確`;

                                Game.speech.speak(speechText, {
                                    callback: () => {
                                        // 🔧 [修復] 再次檢查當前場景
                                        const currentScene = Game.state.gameState.currentScene;
                                        if (currentScene !== 'checking') {
                                            Game.Debug.warn('flow', `⚠️ [A4-找零錢包語音完成] 在 ${currentScene} 場景下被調用，忽略此回調`);
                                            return;
                                        }

                                        Game.TimerManager.setTimeout(() => {
                                            Game.proceedToNextQuestion();
                                        }, 1000, 'screenTransition');
                                    }
                                });
                            });
                        }, 300, 'uiAnimation');
                    } else {
                        // 不是最後一個，播放放置語音
                        this.speech.speak(`已放入${moneyItem.name}`, { 
                            interrupt: true,
                            callback: () => {
                                // 語音完成後清除處理標誌
                                this.state.gameState.isProcessingChange = false;
                            }
                        });
                    }
                    
                    // 備用機制：3秒後強制清除處理標誌（僅在非最後一個金錢時檢查完成）
                    this.TimerManager.setTimeout(() => {
                        if (this.state.gameState.isProcessingChange) {
                            Game.Debug.log('state', '強制清除找零處理狀態');
                            this.state.gameState.isProcessingChange = false;
                            // 只有當不是全部完成時才檢查（避免重複完成邏輯）
                            if (!this.state.gameState._lastDroppedAll && !this.state.gameState.changeCompleted) {
                                this.checkChangeComplete();
                            }
                        }
                    }, 3000, 'uiAnimation');
                } else {
                    // 面額不匹配
                    this.audio.playErrorSound();
                    this.speech.speak('面額不正確，請重新拖曳', { interrupt: true });
                }
            } else {
                // 沒有拖到正確位置
                this.audio.playErrorSound();
                this.speech.speak('請拖曳到對應的淡化圖示位置', { interrupt: true });
            }
        },
        
        // 檢查找零是否全部完成
        checkChangeComplete() {
            const allDropped = this.state.gameState.changeDropTargets.every(target => target.isDropped);
            
            if (allDropped && !this.state.gameState.changeCompleted) {
                // 設置完成標誌，避免重複播放
                this.state.gameState.changeCompleted = true;

                const changeAmount = this.state.gameState.currentTransaction.changeExpected;

                // 全部完成，播放成功音效和語音
                this.TimerManager.setTimeout(() => {
                    // 先播放 correct02.mp3
                    Game.audio.playSuccessSound(() => {
                        // 🔧 [修復] 檢查當前場景，防止上一輪的回調在下一輪的付款場景執行
                        const currentScene = Game.state.gameState.currentScene;
                        if (currentScene !== 'checking') {
                            Game.Debug.warn('flow', `⚠️ [A4-找零檢查完成] 在 ${currentScene} 場景下被調用，忽略此回調`);
                            return;
                        }

                        // 🔧 [修正] 零元時的特殊語音
                        const speechText = changeAmount === 0 ?
                            '找回零錢 零元，恭喜！答案正確' :
                            `找您${Game.convertToTraditionalCurrency(changeAmount)}，恭喜！答案正確`;

                        // 然後播放合併的找零和恭喜語音
                        Game.speech.speak(speechText, {
                            callback: () => {
                                // 🔧 [修復] 再次檢查當前場景
                                const currentScene = Game.state.gameState.currentScene;
                                if (currentScene !== 'checking') {
                                    Game.Debug.warn('flow', `⚠️ [A4-找零檢查語音完成] 在 ${currentScene} 場景下被調用，忽略此回調`);
                                    return;
                                }

                                // 進入下一題或完成測驗
                                Game.TimerManager.setTimeout(() => {
                                    Game.proceedToNextQuestion();
                                }, 1000, 'screenTransition');
                            }
                        });
                    });
                }, 500, 'uiAnimation');
            }
        },
        
        // 進入下一題或完成測驗
        proceedToNextQuestion() {
            // 直接使用 showGameComplete 函數處理下一題或完成測驗
            this.showGameComplete(true);
        },
        
        // 處理錢包拖曳懸停（普通和困難模式拖回功能）
        handleWalletDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        },
        
        // 處理錢包拖曳進入
        handleWalletDragEnter(event) {
            event.preventDefault();
            const walletContent = event.target.closest('.wallet-content');
            if (walletContent) {
                walletContent.classList.add('drag-over-wallet-return');
            }
        },
        
        // 處理錢包拖曳離開
        handleWalletDragLeave(event) {
            const walletContent = event.target.closest('.wallet-content');
            if (walletContent) {
                walletContent.classList.remove('drag-over-wallet-return');
            }
        },
        
        // 處理錢包拖曳放置（拖回功能）
        handleWalletDrop(event) {
            event.preventDefault();
            
            // 清除拖曳樣式
            document.querySelectorAll('.drag-over-wallet-return').forEach(el => {
                el.classList.remove('drag-over-wallet-return');
            });
            
            const moneyId = event.dataTransfer.getData('text/plain');
            const difficulty = this.state.settings.difficulty;
            
            // 只有普通和困難模式支援拖回
            if (difficulty !== 'normal' && difficulty !== 'hard') {
                return;
            }
            
            // 檢查是否是從付款區域拖回的錢幣
            const paidMoney = this.state.gameState.currentTransaction.paidMoney;
            const moneyToReturn = paidMoney.find(money => money.id === moneyId);
            
            if (moneyToReturn) {
                // 將錢幣從付款中移除
                const paidIndex = paidMoney.findIndex(money => money.id === moneyId);
                if (paidIndex !== -1) {
                    paidMoney.splice(paidIndex, 1);
                }
                
                // 從付款總額中扣除
                this.state.gameState.currentTransaction.amountPaid -= moneyToReturn.value;
                
                // 將錢幣加回錢包
                this.state.gameState.playerWallet.push(moneyToReturn);
                this.state.gameState.walletTotal += moneyToReturn.value;
                
                // 播放成功音效
                this.audio.playDropSound();
                
                // 根據難度播放語音提示
                if (difficulty === 'normal') {
                    // 🔧 [新增] 設置語音處理狀態，確保按鈕在語音播放期間禁用
                    this.state.gameState.isProcessingPayment = true;

                    // 🔧 [修正] 檢查是否為最後一個金錢（付款總額為零）
                    const speechText = this.state.gameState.currentTransaction.amountPaid === 0 ?
                        `${moneyToReturn.name}已退回錢包，目前付款 0元` :
                        `${moneyToReturn.name}已退回錢包，目前付款總額${this.state.gameState.currentTransaction.amountPaid}元`;

                    this.speech.speak(speechText, {
                        interrupt: true,
                        callback: () => {
                            this.state.gameState.isProcessingPayment = false;
                            // 🔧 [新增] 語音播放完成後更新按鈕狀態
                            this.updatePaymentDisplay();
                        }
                    });
                }
                
                // 更新顯示
                this.updatePaymentDisplay();
                
                Game.Debug.log('coin', `錢幣 ${moneyToReturn.name} 已退回錢包`);
            } else {
                // 不是有效的拖回操作
                this.audio.playErrorSound();
                if (difficulty === 'normal') {
                    this.speech.speak('只能將已付款的錢幣拖回錢包', { interrupt: true });
                }
            }
        },
        
        // 驗證找零
        verifyChange(isCorrect) {
            const transaction = this.state.gameState.currentTransaction;
            const expectedChange = transaction.changeExpected;
            
            if (expectedChange === 0) {
                // 無需找零的情況，用戶點擊"正確"就是對的
                if (isCorrect) {
                    // 回答正確 - 播放成功音效和語音後進入下一題
                    this.audio.playSuccessSound(() => {
                        this.speech.speak('答對了，讓我們繼續下一題', {
                            callback: () => {
                                this.showGameComplete(true);
                            }
                        });
                    });
                }
            } else {
                // 需要找零的情況，檢查找零是否正確
                const actualChange = transaction.changeReceived.reduce((sum, money) => sum + money.value, 0);
                const isActuallyCorrect = actualChange === expectedChange;
                
                if (isCorrect === isActuallyCorrect) {
                    // 回答正確 - 播放成功音效和語音後進入下一題
                    this.audio.playSuccessSound(() => {
                        this.speech.speak('答對了，讓我們繼續下一題', {
                            callback: () => {
                                this.showGameComplete(true);
                            }
                        });
                    });
                } else {
                    // 回答錯誤 - 播放錯誤語音但不切換場景
                    this.audio.playErrorSound();
                    this.speech.speak(isActuallyCorrect ? '找零其實是正確的，再仔細檢查看看' : '找零確實有問題，要更仔細觀察', {
                        callback: () => {
                            Game.TimerManager.setTimeout(() => {
                                Game.speech.speak('請再次檢查找零金額');
                            }, 1500, 'speechDelay');
                        }
                    });
                }
            }
        },

        // 顯示交易摘要畫面（下一輪前的總結）
        showTransactionSummaryScreen(callback) {
            const app = document.getElementById('app');
            const selectedItem = this.state.gameState.selectedItem;
            const transaction = this.state.gameState.currentTransaction;
            this.showTransactionSummaryScreenWithData(selectedItem, transaction);
        },

        // =====================================================
        // 🌟 [修改] 顯示交易摘要畫面 (新增按鈕，移除回呼)
        // =====================================================
        showTransactionSummaryScreenWithData(selectedItem, transaction, callback) {
            const app = document.getElementById('app');
            const _prevBodyBg = document.body.style.background;
            document.body.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';

            const mkMoneyIcons = (amount) => {
                if (!amount || amount <= 0) return '';
                const denoms = [1000, 500, 100, 50, 10, 5, 1];
                const imgs = [];
                let rem = amount;
                for (const d of denoms) {
                    const cnt = Math.floor(rem / d);
                    for (let i = 0; i < cnt; i++) {
                        const face = Math.random() < 0.5 ? 'back' : 'front';
                        imgs.push({ d, face });
                    }
                    rem -= cnt * d;
                }
                return imgs.map(({ d, face }) => {
                    const isBill = d >= 100;
                    const w = isBill ? 68 : 44;
                    return `<img src="../images/money/${d}_yuan_${face}.png" alt="${d}元"
                        style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};${isBill ? 'border-radius:4px' : 'border-radius:50%'};margin:3px;" draggable="false" onerror="this.style.display='none'">`;
                }).join('');
            };

            // 創建交易摘要畫面
            app.innerHTML = `
                <div class="transaction-summary-screen">
                    <div class="summary-content">
                        <div class="summary-header">
                            <h1>📋 交易完成</h1>
                            <p>第 ${this.state.quiz.currentQuestion} 題已完成</p>
                        </div>

                        <div class="transaction-details">
                            <div class="summary-card">
                                <h2>交易摘要</h2>
                                <div style="text-align:center; margin: 0.6rem 0 1.4rem;">
                                    ${selectedItem.category === 'multi-selection'
                                        ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px;">${selectedItem.items.map(it => `<div style="text-align:center;background:rgba(76,175,80,0.08);border-radius:12px;padding:10px;">${this.getProductIconHTML(it, '70px')}</div>`).join('')}</div>`
                                        : `<div style="animation:productReveal 0.5s ease-out;">${this.getProductIconHTML(selectedItem, '180px')}</div>`
                                    }
                                </div>
                                <style>@keyframes productReveal{0%{opacity:0;transform:scale(0.7) translateY(10px)}60%{transform:scale(1.06) translateY(-2px)}100%{opacity:1;transform:scale(1) translateY(0)}}</style>
                                <div class="summary-item">
                                    <span>購買商品：</span>
                                    <span>${selectedItem.category === 'multi-selection'
                                        ? selectedItem.items.map(it => it.name || it.description || '').join('、')
                                        : selectedItem.name
                                    }</span>
                                </div>
                                <div class="summary-item">
                                    <span>商品價格：</span>
                                    <span>${transaction.totalCost}元</span>
                                </div>
                                <div class="a4-money-icons-row">${mkMoneyIcons(transaction.totalCost)}</div>
                                <div class="summary-item">
                                    <span>已付金額：</span>
                                    <span>${transaction.amountPaid}元</span>
                                </div>
                                <div class="a4-money-icons-row">${mkMoneyIcons(transaction.amountPaid)}</div>
                                <div class="summary-item">
                                    <span>應找零錢：</span>
                                    <span>${transaction.changeExpected}元</span>
                                </div>
                                ${transaction.changeExpected > 0 ? `<div class="a4-money-icons-row">${mkMoneyIcons(transaction.changeExpected)}</div>` : ''}
                            </div>
                        </div>

                        <div class="next-round-notice">
                            <p>${this.state.quiz.currentQuestion >= this.state.settings.questionCount ? '已完成購物任務' : '準備進入下一輪購物...'}</p>
                        </div>
                    </div>
                </div>

                <style>
                    .transaction-summary-screen {
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        box-sizing: border-box;
                        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                        color: white;
                        text-align: center;
                    }

                    .summary-content {
                        width: 100%;
                        max-width: 760px;
                        padding: 2rem;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                        box-sizing: border-box;
                    }

                    .a4-money-icons-row {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 4px;
                        justify-content: flex-start;
                        align-items: center;
                        padding: 6px 0 10px;
                    }

                    .summary-header h1 {
                        font-size: 2.5rem;
                        margin-bottom: 0.5rem;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                    }

                    .summary-header p {
                        font-size: 1.2rem;
                        opacity: 0.9;
                        margin-bottom: 2rem;
                    }

                    .summary-card {
                        background: rgba(255, 255, 255, 0.9);
                        color: #333;
                        border-radius: 20px;
                        padding: 2.5rem;
                        margin: 1.5rem 0;
                        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
                        max-width: 640px;
                        width: 100%;
                        box-sizing: border-box;
                        margin-left: auto;
                        margin-right: auto;
                    }

                    .summary-card h2 {
                        color: #4CAF50;
                        margin-bottom: 1.5rem;
                        font-size: 1.8rem;
                        text-align: center;
                    }

                    .summary-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 1rem 0;
                        border-bottom: 1px solid #f0f0f0;
                        font-size: 1.3rem;
                    }

                    .summary-item:last-child {
                        border-bottom: none;
                        font-weight: bold;
                        color: #4CAF50;
                    }

                    .summary-emoji {
                        font-size: 2.5rem !important;
                        display: inline-block;
                        vertical-align: middle;
                        margin-right: 8px;
                        line-height: 1;
                    }

                    .primary-btn {
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 25px;
                        font-size: 1.2rem;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                    }

                    .primary-btn:hover {
                        background: #45a049;
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
                    }

                    .primary-btn:active {
                        transform: translateY(0);
                    }

                    .next-round-notice {
                        margin-top: 2rem;
                        font-size: 1.2rem;
                        opacity: 0.9;
                    }

                    /* 手機端：縮小外框與卡片內距，讓內容善用螢幕寬度 */
                    @media (max-width: 600px) {
                        .summary-content { padding: 1.2rem; border-radius: 16px; }
                        .summary-card { padding: 1.5rem 1.2rem; }
                        .summary-header h1 { font-size: 2rem; }
                        .summary-item { font-size: 1.15rem; padding: 0.8rem 0; }
                    }
                </style>
            `;

            // 生成語音文字
            let itemName;
            if (selectedItem && selectedItem.items && selectedItem.items.length > 0) {
                // 多個商品時，逐一列出每個商品（不使用"組合商品"前綴）
                const itemDescriptions = selectedItem.items.map(item => {
                    return this.parseProductDisplay(item, 1).speechText;
                });
                itemName = itemDescriptions.join('，');
            } else {
                // 單一商品
                itemName = selectedItem ? this.parseProductDisplay(selectedItem, 1).speechText : '未知商品';
            }
            const _changeSpeech = transaction.changeExpected === 0 ? '找回零元' : `找回${this.convertToTraditionalCurrency(transaction.changeExpected)}`;
            const speechText = `購買商品：${itemName}，商品價格：${this.convertToTraditionalCurrency(transaction.totalCost)}，已付金額：${this.convertToTraditionalCurrency(transaction.amountPaid)}，${_changeSpeech}`;

            Game.Debug.log('speech', '🎙️ [A4-摘要] 播放交易摘要語音:', speechText);

            // 播放交易摘要語音
            try {
                this.speech.speak(speechText, {
                    callback: () => {
                        Game.Debug.log('flow', '🎙️ [A4-摘要] 交易摘要語音完成，準備進入下一輪');
                        // 2秒後進入下一輪
                        Game.TimerManager.setTimeout(() => {
                            document.body.style.background = _prevBodyBg;
                            if (callback) {
                                Game.Debug.log('flow', '🔧 [A4-摘要] 執行回調函數，進入下一題');
                                callback();
                            } else {
                                Game.Debug.warn('flow', '⚠️ [A4-摘要] 回調函數不存在');
                            }
                        }, 2000, 'screenTransition');
                    }
                });
            } catch (error) {
                Game.Debug.warn('speech', '⚠️ [A4-摘要] 語音播放失敗，但繼續流程:', error);
                // 語音失敗時，仍然執行回調以確保流程繼續
                this.TimerManager.setTimeout(() => {
                    document.body.style.background = _prevBodyBg;
                    if (callback) {
                        Game.Debug.log('flow', '🔧 [A4-摘要] 語音失敗，直接執行回調函數');
                        callback();
                    }
                }, 2000, 'screenTransition');
            }
        },

        // =====================================================
        // 🌟 [新增] 準備下一題的獨立函數
        // =====================================================
        prepareNextQuestion() {
            Game.Debug.log('flow', '🎯 [A4-下一題] 開始準備下一題');

            // 🔧 [增強修正] 強制停止所有語音播放和清除所有定時器，防止殘留回調干擾
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
                Game.Debug.log('speech', '🔧 [A4-下一題] 已取消所有語音合成');
            }

            // 🔧 [新增] 清除所有可能的定時器（雖然我們已經改為直接調用，但防止有遺漏）
            for (let i = 1; i < 99999; i++) {
                window.clearTimeout(i);
            }
            Game.Debug.log('timer', '🔧 [A4-下一題] 已清除所有定時器');

            // 重置商品狀態
            this.state.gameState.selectedItem = null;
            this.state.gameState.selectedItems = [];
            // 重置用戶選擇標誌，準備下一題
            this.state.gameState.hasUserSelectedProduct = false;
            this.state.gameState.isProcessingProductSelection = false;
            this.state.gameState.currentTransaction = {
                targetItem: null,
                totalCost: 0,
                amountPaid: 0,
                changeExpected: 0,
                changeReceived: []
            };
            // 清除已保存的完整交易數據
            this.state.gameState.completedTransaction = null;

            Game.Debug.log('flow', '🎯 [A4-下一題] 狀態重置完成，開始初始化下一題');

            // 🔧 [修正] 重置所有處理狀態標誌，防止異步操作干擾
            this.state.gameState.isProcessingPayment = false;
            this.state.gameState.isProcessingSpeech = false;
            this.state.gameState.isProcessingChange = false;
            this.state.gameState.isTransitioning = false;

            // 為下一題重新初始化錢包
            this.initializeWallet();

            // 🔧 [配置驅動] 使用SceneManager切換到購物場景
            this.SceneManager.switchScene('shopping', this);

            // 重置轉換標誌
            this.TimerManager.setTimeout(() => {
                this.state.gameState.isTransitioning = false;
            }, 1000, 'screenTransition');
        },

        // 顯示遊戲完成
        showGameComplete(success = true) {
            // 🔧 [修復] 檢查當前場景，確保不會在錯誤的場景下被調用
            const currentScene = this.state.gameState.currentScene;
            if (currentScene === 'paying' || currentScene === 'shopping') {
                Game.Debug.warn('flow', `⚠️ [A4-遊戲完成] 在 ${currentScene} 場景下被調用，忽略此調用`);
                return;
            }

            // 防止重複調用
            if (this.state.gameState.isTransitioning) {
                Game.Debug.log('flow', '正在轉換中，忽略重複的 showGameComplete 調用');
                return;
            }
            this.state.gameState.isTransitioning = true;
            if (window.TutorContext) TutorContext.update({ screen: 'result' });

            // 🔧 [修復] 立即清除所有定時器和語音，防止殘留回調干擾
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
                Game.Debug.log('speech', '🔧 [A4-遊戲完成] 立即取消所有語音合成');
            }
            for (let i = 1; i < 99999; i++) {
                window.clearTimeout(i);
            }
            Game.Debug.log('timer', '🔧 [A4-遊戲完成] 立即清除所有定時器');

            // 🔧 [修正] 根據成功/失敗執行不同邏輯
            if (!success) {
                // 錯誤回答處理：重新開始當前題目
                Game.Debug.log('flow', '🔄 [A4-找零] 回答錯誤，重新開始當前題目');
                this.state.gameState.isTransitioning = false;

                // 重新顯示找零驗證頁面
                this.TimerManager.setTimeout(() => {
                    this.showChangeVerification();
                }, 1000, 'screenTransition');
                return;
            }

            // 成功回答：更新測驗進度
            this.state.quiz.currentQuestion++;

            // 🔧 [修正] 清除當前題目的找零選項，讓下一題重新生成
            delete this.state.gameState.currentChangeOptions;

            // 檢查是否還需要更多題目
            if (this.state.quiz.currentQuestion < this.state.settings.questionCount) {
                // 保存當前題目的商品ID，下一題時排除它
                if (this.state.gameState.selectedItem) {
                    this.state.gameState.previousTargetItemId = this.state.gameState.selectedItem.id;
                }

                // 🔧 [修正] 使用保存的完整交易數據而非當前可能已重置的數據
                const currentSelectedItem = this.state.gameState.completedTransaction?.selectedItem || this.state.gameState.selectedItem;
                const currentTransaction = this.state.gameState.completedTransaction || { ...this.state.gameState.currentTransaction };

                // 🔧 [新增] 調試交易摘要數據
                Game.Debug.log('state', '🔍 [A4-摘要] 保存交易數據:', {
                    商品: currentSelectedItem?.name,
                    商品價格: currentTransaction.totalCost,
                    已付金額: currentTransaction.amountPaid,
                    預期找零: currentTransaction.changeExpected,
                    已付金錢: currentTransaction.paidMoney?.map(m => m.name),
                    數據來源: this.state.gameState.completedTransaction ? '已保存數據' : '當前數據'
                });

                // 🔧 [配置驅動] 保存交易數據並切換到交易摘要場景
                Game.Debug.log('flow', '🔧 [A4-遊戲完成] 使用SceneManager切換到交易摘要場景');

                // 保存交易數據供交易摘要場景使用
                this.state.gameState.summaryData = {
                    selectedItem: currentSelectedItem,
                    transaction: currentTransaction,
                    onComplete: () => {
                        Game.Debug.log('flow', '🔧 [A4-遊戲完成] 交易摘要完成，重置狀態並進入下一題');

                        // 🔧 [關鍵修正] 強制停止所有語音合成，清除殘留回調
                        if (window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                            Game.Debug.log('speech', '🔧 [A4-遊戲完成] 已強制取消所有語音合成，防止殘留回調');
                        }

                        // 🔧 [關鍵修正] 清除所有可能的定時器，防止價格確認等回調觸發
                        for (let i = 1; i < 99999; i++) {
                            window.clearTimeout(i);
                        }
                        Game.Debug.log('timer', '🔧 [A4-遊戲完成] 已清除所有定時器，防止殘留回調');

                        // 在顯示摘要後才重置商品狀態
                        this.state.gameState.selectedItem = null;
                        this.state.gameState.selectedItems = [];
                        this.state.gameState.currentTransaction = {
                            targetItem: null,
                            totalCost: 0,
                            amountPaid: 0,
                            paidMoney: [],
                            changeExpected: 0,
                            changeReceived: []
                        };
                        // 清除已保存的完整交易數據
                        this.state.gameState.completedTransaction = null;
                        // 🔧 [修復] 清除商品價格緩存，下一題會重新生成
                        this.state.gameState.cachedStoreProducts = null;

                    // 🔧 [修正] 重置所有處理狀態標誌，防止異步操作干擾
                    this.state.gameState.isProcessingPayment = false;
                    this.state.gameState.isProcessingSpeech = false;
                    this.state.gameState.isProcessingChange = false;
                    this.state.gameState.isTransitioning = false;

                    // 為下一題重新初始化錢包
                    this.initializeWallet();

                    // 🔧 [配置驅動] 使用SceneManager切換到歡迎場景，開始新一輪
                    this.SceneManager.switchScene('welcome', this);

                    // 重置轉換標誌
                    Game.TimerManager.setTimeout(() => {
                        Game.state.gameState.isTransitioning = false;
                    }, 1000, 'screenTransition');
                    }
                };

                // 🔧 [配置驅動] 切換到交易摘要場景
                this.SceneManager.switchScene('transactionSummary', this);
                return;
            }
            
            // 🎯 所有題目完成，使用原本的交易完成頁面，完成後進入測驗總結
            // 取得當前交易資料（與非最後一題相同的方式）
            const currentSelectedItem = this.state.gameState.completedTransaction?.selectedItem || this.state.gameState.selectedItem;
            const currentTransaction = this.state.gameState.completedTransaction || this.state.gameState.currentTransaction;

            // 保存交易數據供交易摘要場景使用
            this.state.gameState.summaryData = {
                selectedItem: currentSelectedItem,
                transaction: currentTransaction,
                onComplete: () => {
                    // 🎯 最後一題：進入測驗總結（而不是下一題）
                    this.showCompletionSummary();
                }
            };

            // 🔧 [配置驅動] 切換到交易摘要場景（原本的交易完成頁面）
            this.SceneManager.switchScene('transactionSummary', this);
        },

        // 🎯 顯示測驗總結
        showCompletionSummary() {
            if (this._completionSummaryShown) return;
            this._completionSummaryShown = true;
            // 停用輔助點擊模式：移除 overlay div + 解除 document capture 監聽器
            // （直接 remove() overlay div 不夠，document listener 仍會攔截並阻擋按鈕點擊）
            this.ClickMode.unbind();
            // 停用輔助點擊模式（完成畫面不需要輔助）
            const gs = this.state.gameState;
            if (gs.clickModeState) {
                Game.Debug.log('assist', '[A4-ClickMode] 進入完成畫面，停用輔助點擊模式');
                gs.clickModeState.enabled = false;
                gs.clickModeState.waitingForClick = false;
                gs.clickModeState.waitingForStart = false;
            }

            const completedCount = this.state.settings.questionCount || 10;

            // 計算完成時間
            const endTime = Date.now();
            const startTime = this.state.quiz.startTime || endTime;
            const elapsedSeconds = Math.floor((endTime - startTime) / 1000);

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'a4', unitName: 'A4 模擬購物', series: 'A',
                score: completedCount, total: completedCount,
                difficulty: this.state.settings?.difficulty, durationSec: elapsedSeconds });
            const minutes = Math.floor(elapsedSeconds / 60);
            const seconds = elapsedSeconds % 60;
            const timeDisplay = minutes > 0 ? `${minutes} 分 ${seconds} 秒` : `${seconds} 秒`;

            const app = document.getElementById('app');
            if (!app) return;

            app.innerHTML = `
                <div class="results-wrapper">
                    <div class="results-screen">
                        <div class="results-header">
                            <div class="trophy-icon">🏆</div>
                            <div class="results-title-row">
                                <img src="../images/common/hint_detective.png" class="results-mascot-img" alt="金錢小助手">
                                <h1 class="results-title">🎉 完成挑戰 🎉</h1>
                                <span class="results-mascot-spacer"></span>
                            </div>
                        </div>

                        <div class="reward-btn-container">
                            <a href="#" id="endgame-reward-link" class="reward-btn-link">
                                🎁 開啟獎勵系統
                            </a>
                        </div>

                        <div class="results-container">
                            <div class="results-grid">
                                <div class="result-card">
                                    <div class="result-icon">✅</div>
                                    <div class="result-label">完成題數</div>
                                    <div class="result-value">${completedCount} 題</div>
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
                                ${this.getPerformanceByCount(completedCount)}
                            </div>

                            <!-- 學習成果描述 -->
                            <div class="learning-achievements">
                                <h3>🏆 學習成果</h3>
                                <div class="achievement-list">
                                    <div class="achievement-item">🎯 完成超市購物結帳流程學習</div>
                                    <div class="achievement-item">🛒 學會商品挑選和數量確認</div>
                                    <div class="achievement-item">💰 掌握結帳付款和找零計算</div>
                                </div>
                            </div>

                            <div class="result-buttons">
                                <button class="play-again-btn" onclick="Game.startGame()">
                                    <span class="btn-icon">🔄</span>
                                    <span class="btn-text">再玩一次</span>
                                </button>
                                <button class="main-menu-btn" onclick="Game.showSettings()">
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
                        align-items: flex-start;
                        min-height: 100vh;
                        padding: 20px;
                        box-sizing: border-box;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        overflow-y: auto;
                    }

                    /* @keyframes fadeIn, celebrate, bounce 已移至 injectGlobalAnimationStyles() */

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

                    .reward-btn-container {
                        position: relative;
                        z-index: 2;
                        text-align: center;
                        margin-top: 15px;
                        margin-bottom: 10px;
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

                    .performance-section {
                        background: #ffffff;
                        border: 1px solid #e0e0e0;
                        padding: 20px;
                        border-radius: 12px;
                        margin-bottom: 25px;
                        text-align: center;
                    }

                    .performance-section h3 {
                        color: #333333;
                        margin: 0 0 15px 0;
                        font-size: 1.2em;
                    }

                    .performance-badge {
                        display: inline-block;
                        background: linear-gradient(45deg, #f39c12, #e67e22);
                        color: white;
                        padding: 12px 30px;
                        border-radius: 25px;
                        font-size: 1.3em;
                        font-weight: bold;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                        box-shadow: 0 4px 15px rgba(243,156,18,0.4);
                        margin: 10px 0;
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
                        grid-template-columns: repeat(2, 1fr);
                        gap: 20px;
                        margin-bottom: 25px;
                    }

                    .result-card {
                        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                        padding: 20px;
                        border-radius: 12px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                        transition: transform 0.3s ease;
                        border: 2px solid transparent;
                    }

                    .result-card:hover {
                        transform: translateY(-5px);
                        border-color: #3498db;
                    }

                    .result-icon { font-size: 2em; margin-bottom: 10px; }
                    .result-label { font-size: 1em; color: #6c757d; margin-bottom: 8px; }
                    .result-value { font-size: 1.6em; font-weight: bold; color: #2c3e50; }

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
                        min-width: 160px;
                        justify-content: center;
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                    }

                    .play-again-btn {
                        background: linear-gradient(135deg, #27ae60, #2ecc71);
                        color: white;
                    }

                    .play-again-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
                    }

                    .main-menu-btn {
                        background: linear-gradient(135deg, #8e44ad, #9b59b6);
                        color: white;
                    }

                    .main-menu-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(142, 68, 173, 0.4);
                    }
                </style>
            `;

            // 🎁 獎勵系統連結事件
            const endgameRewardLink = document.getElementById('endgame-reward-link');
            if (endgameRewardLink) {
                endgameRewardLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                });
            }

            // 播放成功音效和煙火
            this.TimerManager.setTimeout(() => {
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
                        this.TimerManager.setTimeout(fireConfetti, 250, 'confetti');
                    };
                    fireConfetti();
                }

                // 播放完成語音
                const countSpeech = NumberSpeechUtils.convertToQuantitySpeech(completedCount, '題');
                this.speech.speak(`完成挑戰！共完成 ${countSpeech}，用時 ${timeDisplay}`);
            }, 100, 'uiAnimation');
        },

        // 根據完成題數取得表現評價
        getPerformanceByCount(count) {
            let icon, msg;
            if (count >= 8)      { icon = '🏆'; msg = `完成了 ${count} 題，做得很棒，表現優異！`; }
            else if (count >= 6) { icon = '👍'; msg = `完成了 ${count} 題，做得不錯，表現良好！`; }
            else if (count >= 3) { icon = '💪'; msg = `完成了 ${count} 題，再努力一點，加油！`; }
            else                 { icon = '📚'; msg = `完成了 ${count} 題，多多練習，你可以的！`; }
            return `<div class="performance-badge">${icon} ${msg}</div>`;
        },

        // 播放選單選擇音效
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
        // 🌟 【修正】在錢包區顯示綠色打勾提示 (增強版)
        // =====================================================
        showWalletHintWithTicks(moneyList) {
            Game.Debug.log('hint', '✅ [打勾提示] showWalletHintWithTicks 被調用', { moneyList });
            // 儲存活躍提示清單，讓 updatePaymentDisplay 重繪後可重新套用
            this.state.gameState.activeWalletHintList = moneyList;

            const walletContainer = document.querySelector('.wallet-content');
            if (!walletContainer) {
                Game.Debug.error('✅ [打勾提示] 錯誤：找不到錢包容器 .wallet-content');
                return;
            }

            // 清除之前的提示效果
            walletContainer.querySelectorAll('.money-item.show-correct-tick').forEach(item => {
                item.classList.remove('show-correct-tick');
            });

            // 統計需要提示的錢幣數量
            const moneyCount = {};
            moneyList.forEach(money => {
                const value = money.value;
                moneyCount[value] = (moneyCount[value] || 0) + 1;
            });
            Game.Debug.log('hint', '✅ [打勾提示] 需要提示的錢幣統計:', moneyCount);

            // 【核心修正】為每個面額找到足夠數量的、尚未被標記的錢幣元素
            Object.keys(moneyCount).forEach(valueStr => {
                const value = parseInt(valueStr);
                let needed = moneyCount[valueStr];
                const availableItems = walletContainer.querySelectorAll(`.money-item[data-money-id*="money_${value}_"]`);

                for (const item of availableItems) {
                    if (needed > 0 && !item.classList.contains('show-correct-tick')) {
                        item.classList.add('show-correct-tick');
                        needed--;
                        Game.Debug.log('hint', `✅ [打勾提示] 已為錢幣 ${item.dataset.moneyId} 添加打勾`);
                    }
                    if (needed === 0) break; // 該面額已找足
                }
            });

            // 打勾持續顯示，直到金錢被拖曳到付款區時自然隨 DOM 元素移除而消失
        },

        // =====================================================
        // 🌟 【修正】困難模式付款提示功能 - 提供最佳付款建議並顯示綠色打勾 (增強版)
        // =====================================================
        showPaidAmountHint() {
            // 防止重複點擊
            if (this.state.gameState.isProcessingHint) {
                Game.Debug.log('hint', '🚫 [提示按鈕] 正在處理提示，忽略重複點擊');
                return;
            }

            const transaction = this.state.gameState.currentTransaction;
            const capturedPaidAmount = transaction.amountPaid; // 退回前先記錄已付金額
            const itemPrice = transaction.totalCost;

            Game.Debug.log('hint', '💡 [困難模式提示] 提示按鈕被點擊');

            // 設置處理狀態
            this.state.gameState.isProcessingHint = true;

            // 退回所有已付金錢到錢包
            if (capturedPaidAmount > 0) {
                this.returnAllPaidMoney();
            }

            // 永久解鎖已付金額顯示（後續拖曳即時更新，新題目時 paidAmountRevealed 會重置）
            this.state.gameState.paidAmountRevealed = true;

            // 若退回前有已付金額，先顯示該金額3秒，再切換為即時顯示
            if (capturedPaidAmount > 0) {
                const el = document.querySelector('.paid-amount-value');
                if (el) el.textContent = `${capturedPaidAmount}`;
                this.TimerManager.clearByCategory('paidReveal');
                this.TimerManager.setTimeout(() => {
                    const el2 = document.querySelector('.paid-amount-value');
                    if (el2) el2.textContent = `${this.state.gameState.currentTransaction.amountPaid}`;
                }, 3000, 'paidReveal');
            }

            // 計算最佳付款方案
            const allAvailableMoney = [...this.state.gameState.playerWallet];
            Game.Debug.log('hint', '💡 [提示] 當前錢包面額:', allAvailableMoney.map(m => m.value).sort((a, b) => b - a));
            Game.Debug.log('hint', '💡 [提示] 目標商品價格:', itemPrice);
            const optimalPayment = this.calculateOptimalPayment(itemPrice, allAvailableMoney);
            Game.Debug.log('hint', '💡 [提示] 最佳付款方案面額:', optimalPayment);
            const speechText = this.generateOptimalPaymentSpeech(optimalPayment);

            // 儲存提示資料供確認按鈕使用
            this._lastPaymentHintSpeech = speechText;
            this._lastOptimalPaymentA4 = optimalPayment;

            // 建立提示清單 HTML（含金錢圖片）
            let hintListHTML = '';
            if (optimalPayment && optimalPayment.length > 0) {
                const valueCounts = {};
                optimalPayment.forEach(val => { valueCounts[val] = (valueCounts[val] || 0) + 1; });
                const sortedValues = Object.keys(valueCounts).map(Number).sort((a, b) => b - a);
                sortedValues.forEach(val => {
                    const cnt = valueCounts[val];
                    const moneyData = this.storeData.moneyItems.find(m => m.value === val);
                    const imgSrc = moneyData ? moneyData.images.front : '';
                    const isCoin = val < 100;
                    const imgStyle = isCoin
                        ? 'width:50px;height:50px;object-fit:contain;'
                        : 'width:80px;height:auto;max-height:50px;object-fit:contain;';
                    hintListHTML += `
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:10px 14px;background:#f9f9f9;border-radius:10px;border:1px solid #eee;">
                            ${imgSrc ? `<img src="${imgSrc}" alt="${val}元" style="${imgStyle}">` : ''}
                            <span style="font-size:20px;font-weight:bold;color:#333;">${val}元</span>
                            <span style="color:#999;font-size:16px;">×</span>
                            <span style="font-size:20px;font-weight:bold;color:#e65100;">${cnt} 張</span>
                        </div>`;
                });
            }

            // 顯示提示彈窗
            const existingModal = document.getElementById('a4PaymentHintModal');
            if (existingModal) existingModal.remove();

            const modalHTML = `
                <div id="a4PaymentHintModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:10050;">
                    <div style="background:linear-gradient(135deg,#fff 0%,#f8f9fa 100%);border-radius:20px;max-width:460px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;border:3px solid #FF9800;">
                        <div style="background:linear-gradient(135deg,#FF9800 0%,#FFb040 100%);padding:20px 30px;display:flex;align-items:center;justify-content:center;gap:12px;color:white;">
                            <span style="font-size:40px;line-height:1;">💡</span>
                            <h2 style="margin:0;font-size:22px;font-weight:bold;text-shadow:0 2px 4px rgba(0,0,0,0.2);">付款提示</h2>
                        </div>
                        <div style="padding:24px 30px;">
                            <p style="font-size:16px;color:#555;margin-bottom:16px;font-weight:500;text-align:center;">建議的付款方式：</p>
                            ${hintListHTML}
                        </div>
                        <div style="padding:0 30px 24px;display:flex;gap:10px;justify-content:center;">
                            <button onclick="Game.replayPaymentHintSpeech()"
                                style="background:linear-gradient(135deg,#4caf50,#45a049);border:none;color:white;padding:8px 18px;border-radius:25px;cursor:pointer;font-size:16px;display:flex;align-items:center;gap:6px;">
                                🔊 再播一次
                            </button>
                            <button onclick="Game.confirmPaymentHint()"
                                style="background:linear-gradient(135deg,#FF9800,#e65100);border:none;color:white;padding:8px 22px;border-radius:25px;cursor:pointer;font-size:16px;font-weight:bold;">
                                我知道了
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // 播放語音提示
            this.speech.speak(speechText, { interrupt: true });

            // 500ms 後解除處理狀態，允許再次點擊
            this.TimerManager.setTimeout(() => {
                this.state.gameState.isProcessingHint = false;
            }, 500, 'uiAnimation');

            Game.Debug.log('hint', '💡 [付款提示] 彈窗已顯示，語音:', speechText);
        },

        // 重播付款提示語音
        replayPaymentHintSpeech() {
            try { this.menuSelectAudio?.play().catch(() => {}); } catch(e) {}
            if (this._lastPaymentHintSpeech) {
                this.speech.speak(this._lastPaymentHintSpeech, { interrupt: true });
            }
        },

        // 確認付款提示彈窗，套用視覺勾勾提示
        confirmPaymentHint() {
            try { this.menuSelectAudio?.play().catch(() => {}); } catch(e) {}
            const modal = document.getElementById('a4PaymentHintModal');
            if (modal) modal.remove();
            if (this._lastOptimalPaymentA4 && this._lastOptimalPaymentA4.length > 0) {
                const moneyObjectsToHighlight = this._lastOptimalPaymentA4.map(val => ({ value: val }));
                this.showWalletHintWithTicks(moneyObjectsToHighlight);
            }
            this.state.gameState.isProcessingHint = false;
        },

        showChangeCalculationHint() {
            if (this.state.gameState.isProcessingHint) return;
            this.state.gameState.isProcessingHint = true;

            const transaction = this.state.gameState.currentTransaction;
            const paid = transaction.amountPaid;
            const cost = transaction.totalCost;
            const change = transaction.changeExpected;

            Game.Debug.log('hint', `💡 [找零提示] 已付 ${paid}，商品 ${cost}，找零 ${change}`);

            // 高亮輸入框
            const input = document.getElementById('change-input');
            if (input) {
                input.style.boxShadow = '0 0 15px rgba(255, 193, 7, 0.8)';
                input.style.borderColor = '#FFC107';
                this.TimerManager.setTimeout(() => {
                    if (input) {
                        input.style.boxShadow = '';
                        input.style.borderColor = '';
                    }
                }, 3000, 'uiAnimation');
            }

            // 語音提示
            const speech = typeof convertToTraditionalCurrency === 'function'
                ? `小提示，${convertToTraditionalCurrency(paid)}減去${convertToTraditionalCurrency(cost)}，應找零${convertToTraditionalCurrency(change)}`
                : `應找零 ${change} 元`;
            this.speech.speak(speech, { interrupt: true });

            this.TimerManager.setTimeout(() => {
                this.state.gameState.isProcessingHint = false;
            }, 500, 'uiAnimation');
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
                }, 200, 'uiAnimation');
            } else {
                Game.Debug.log('ui', '🎆 canvas-confetti不可用');
            }
        },

        // ================================================================
        // 輔助點擊模式（Click Mode）系統
        // 基於 A1/A2/A3/A5 經驗實作，適配 A4 場景系統
        // ================================================================
        ClickMode: {
            // 檢查是否啟用輔助點擊模式
            isEnabled() {
                return Game.state.settings.clickMode === true &&
                       Game.state.settings.difficulty === 'easy';
            },

            // 初始化（歡迎畫面）
            initForWelcome() {
                if (!this.isEnabled()) return;

                Game.Debug.log('assist', '[A4-ClickMode] 初始化輔助點擊模式 - 歡迎畫面');

                const clickState = Game.state.gameState.clickModeState;
                clickState.enabled = true;
                clickState.active = false;
                clickState.currentPhase = 'welcome';
                clickState.currentStep = 0;
                clickState.actionQueue = [];
                clickState.waitingForStart = true;
                clickState.waitingForClick = false;
                clickState.lastClickTime = 0;  // 🔧 [修正] 重置最後點擊時間

                // 添加CSS類別來移除焦點邊框
                document.body.classList.add('click-mode-active');

                this.bind();
                this.showPrompt('點擊任意處開始');
            },

            // 重新初始化（新題目）
            initForQuestion() {
                if (!this.isEnabled()) return;

                Game.Debug.log('assist', '[A4-ClickMode] 重新初始化 - 新題目');

                const clickState = Game.state.gameState.clickModeState;
                clickState.active = false;
                clickState.currentPhase = 'welcome';
                clickState.currentStep = 0;
                clickState.actionQueue = [];
                clickState.waitingForStart = true;
                clickState.waitingForClick = false;
                clickState.lastClickTime = 0;  // 🔧 [修正] 重置最後點擊時間，避免防抖邏輯誤判

                this.showPrompt('點擊任意處開始下一題');
            },

            // 綁定全域點擊事件
            bind() {
                if (this._boundHandler) return; // 防止重複綁定

                // 建立輔助點擊遮罩（全程覆蓋，直到 click mode 結束）
                if (!document.getElementById('click-exec-overlay')) {
                    const _ov = document.createElement('div');
                    _ov.id = 'click-exec-overlay';
                    const _tbEl = document.querySelector('.title-bar');
                    const _tbBottom = _tbEl ? Math.round(_tbEl.getBoundingClientRect().bottom) : 60;
                    _ov.style.cssText = `position:fixed;top:${_tbBottom}px;left:0;right:0;bottom:0;z-index:10100;pointer-events:all;touch-action:none;background:transparent;`;
                    document.body.appendChild(_ov);
                }

                this._boundHandler = (e) => this.handleClick(e);
                document.addEventListener('click', this._boundHandler, true);
                Game.Debug.log('assist', '[A4-ClickMode] 全域點擊監聽器已綁定');
            },

            // 解除綁定
            unbind() {
                document.getElementById('click-exec-overlay')?.remove();
                if (this._boundHandler) {
                    document.removeEventListener('click', this._boundHandler, true);
                    this._boundHandler = null;
                    Game.Debug.log('assist', '[A4-ClickMode] 全域點擊監聽器已解除');
                }
            },

            /**
             * 🔧 啟用視覺同步延遲機制（參考 A5 ATM）
             * 核心創新：等待視覺提示出現後 0.5秒 才允許點擊
             * @param {string} source - 觸發來源（用於調試）
             */
            enableClickModeWithVisualDelay(source = 'unknown') {
                const clickState = Game.state.gameState.clickModeState;

                // 1. 立即鎖定，防止畫面剛出來瞬間的誤觸
                clickState.waitingForClick = false;

                // 清除舊的計時器（如果有的話）
                if (clickState._visualDelayTimer) {
                    Game.TimerManager.clearTimeout(clickState._visualDelayTimer);
                }

                // 2. 檢測是否已有視覺提示在畫面上
                const existingHintElement = document.querySelector('.hint-item.faded, .hint-item.lit-up, .change-target');

                if (existingHintElement) {
                    // 視覺提示已存在，立即解鎖（因為用戶已經看到了）
                    Game.Debug.log('assist', `[A4-ClickMode] 🔍 視覺提示已存在 (${source})，立即解鎖`);
                    clickState.waitingForClick = true;
                    // 🔧 時間回溯：讓系統認為「已經準備好很久了」
                    clickState.clickReadyTime = Date.now() - 1000;
                    clickState.isExecuting = false;
                } else {
                    // 視覺提示尚未出現，等待 0.5秒 後解鎖
                    Game.Debug.log('assist', `[A4-ClickMode] 🔒 視覺元素出現 (${source})，啟動 0.5秒 安全鎖定...`);

                    clickState._visualDelayTimer = Game.TimerManager.setTimeout(() => {
                        if (clickState) {
                            clickState.waitingForClick = true;
                            // 🔧 時間回溯 1000ms
                            clickState.clickReadyTime = Date.now() - 1000;
                            clickState.isExecuting = false;
                            Game.Debug.log('assist', `[A4-ClickMode] 🟢 0.5秒已過，解除鎖定 (已繞過防誤觸檢查)`);
                        }
                    }, 500, 'clickMode');

                    // 🛡️ 安全網：1.5秒後強制解鎖（防止系統卡死）
                    Game.TimerManager.setTimeout(() => {
                        if (clickState && !clickState.waitingForClick) {
                            Game.Debug.log('assist', `[A4-ClickMode] ⚠️ 無視覺提示，啟動安全網解鎖 (${source})`);
                            clickState.waitingForClick = true;
                            clickState.clickReadyTime = Date.now() - 1000;
                            clickState.isExecuting = false;
                        }
                    }, 1500, 'clickMode');
                }
            },

            // 全域點擊處理
            handleClick(e) {
                const clickState = Game.state.gameState.clickModeState;

                // 🆕 【修復】程式觸發的點擊直接放行（參考 A2 正確實施）
                if (!e.isTrusted) {
                    Game.Debug.log('assist', '[A4-ClickMode] 🟢 程式觸發的點擊，放行');
                    return;
                }

                // 【修復】購買任務彈窗：overlay(z:10100) 高於 modal(z:10000)，
                // e.target 為 overlay 元素，whitelist 無法偵測到 modal，故需在此手動關閉（直接移除，同 A2）
                const _taskModal = document.getElementById('target-item-modal');
                if (_taskModal) {
                    _taskModal.remove();
                    Game.Debug.log('assist', '[A4-ClickMode] 購買任務彈窗已關閉');
                    // 🎯 第一次點擊只關閉彈窗，顯示目標商品提示，等待第二次點擊選購
                    const targetItem = Game.state.gameState.selectedItem;
                    if (targetItem) {
                        Game.TimerManager.setTimeout(() => {
                            const productItems = document.querySelectorAll('.product-item');
                            for (const item of productItems) {
                                if (parseInt(item.dataset.itemId) === targetItem.id) {
                                    item.classList.add('step-hint');
                                    Game.Debug.log('assist', '[A4-ClickMode] 已顯示目標商品提示動畫，等待第二次點擊');
                                    break;
                                }
                            }
                        }, 200, 'hint');
                    }
                    return; // 本次點擊只關閉彈窗，等待學生再次點擊才選擇商品
                }

                // 檢查是否點擊在模態視窗或其按鈕上，如果是則不攔截
                if (e.target.closest('.back-to-menu-btn') ||
                    e.target.closest('.modal-overlay') ||
                    e.target.closest('.modal-content') ||
                    e.target.closest('.target-item-modal') ||
                    e.target.closest('.modal-btn') ||
                    e.target.closest('.start-shopping-btn') ||
                    e.target.closest('.confirm-button') ||
                    e.target.closest('.verify-button')) {
                    Game.Debug.log('assist', '[A4-ClickMode] 點擊在模態視窗或UI按鈕上，不攔截');
                    return;
                }

                // 🆕 檢查是否在等待點擊狀態（waitingForStart 也視為等待中，允許通過）
                if (!clickState.waitingForClick && !clickState.waitingForStart) {
                    Game.Debug.log('assist', '[A4-ClickMode] ⏳ 尚未解除鎖定，忽略點擊');
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }

                // 🆕 防快速點擊：600ms 安全鎖（從 300ms 提升）
                const now = Date.now();
                const readyTime = clickState.clickReadyTime || 0;
                const timeSinceReady = now - readyTime;

                if (timeSinceReady < 600) {
                    Game.Debug.log('assist', `[A4-ClickMode] ⏳ 點擊過快，忽略 (${timeSinceReady}ms < 600ms)`);
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }

                clickState.lastClickTime = now;

                // 檢查是否處於等待狀態
                if (clickState.waitingForStart) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleStartClick();
                    return;
                }

                if (clickState.waitingForClick) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleContinueClick();
                    return;
                }
            },

            // 處理開始點擊
            handleStartClick() {
                Game.Debug.log('assist', '[A4-ClickMode] 處理開始點擊');

                const clickState = Game.state.gameState.clickModeState;
                clickState.waitingForStart = false;
                clickState.active = true;

                this.hidePrompt();
                

                // welcome 階段不執行任何動作，只是啟動模式
                Game.Debug.log('assist', '[A4-ClickMode] 輔助點擊模式已啟動，等待進入購物場景');
            },

            // 處理繼續點擊
            handleContinueClick() {
                Game.Debug.log('assist', '[A4-ClickMode] 處理繼續點擊');

                const clickState = Game.state.gameState.clickModeState;
                clickState.waitingForClick = false;

                this.hidePrompt();
                

                // 🔧 [新增] 檢查是否等待確認付款
                if (clickState.waitingForConfirmPayment) {
                    Game.Debug.log('assist', '[A4-ClickMode] 點擊確認付款按鈕');
                    clickState.waitingForConfirmPayment = false;

                    const confirmBtn = document.querySelector('#confirm-payment');
                    if (confirmBtn && !confirmBtn.disabled) {
                        confirmBtn.click();
                        Game.Debug.log('assist', '[A4-ClickMode] 已點擊確認付款按鈕');
                    } else {
                        Game.Debug.warn('assist', '[A4-ClickMode] 確認付款按鈕未找到或已禁用');
                    }
                    return;
                }

                // 🔧 [修正] 檢查是否在付款或找零階段，如果是則執行一次操作
                if (clickState.currentPhase === 'payment' && clickState.paymentQueue) {
                    // 付款階段：放置一個金錢
                    this.executeNextPayment();
                } else if (clickState.currentPhase === 'checking' && (clickState.changeQueue || clickState.needsNoChangeButton)) {
                    // 找零階段：放置一個找零或點擊按鈕
                    this.executeNextChange();
                } else {
                    // 其他階段：執行下一個動作
                    Game.TimerManager.setTimeout(() => {
                        this.executeNext();
                    }, 300, 'clickMode');
                }
            },

            // 建立動作佇列
            buildActionQueue(phase) {
                Game.Debug.log('assist', '[A4-ClickMode] 建立動作佇列:', phase);

                const clickState = Game.state.gameState.clickModeState;
                clickState.currentPhase = phase;
                clickState.currentStep = 0;
                clickState.actionQueue = [];

                switch(phase) {
                    case 'shopping':
                        // 購物階段：選擇商品
                        clickState.actionQueue = [
                            { type: 'selectProduct', data: null }
                        ];
                        break;

                    case 'priceConfirmation':  // 場景名稱
                    case 'confirmPrice':       // 保持向後兼容
                        // 確認價格階段：點擊確認
                        clickState.actionQueue = [
                            { type: 'confirmPrice', data: null }
                        ];
                        // 🎯 簡單模式：顯示確認購買按鈕提示動畫
                        Game.TimerManager.setTimeout(() => {
                            const btn = document.getElementById('confirm-easy-price-btn');
                            if (btn) btn.classList.add('step-hint');
                        }, 700, 'hint');
                        break;

                    case 'payment':
                        // 付款階段：選擇並放置金錢
                        clickState.actionQueue = [
                            { type: 'payMoney', data: null }
                        ];
                        break;

                    case 'checking':
                        // 驗證找零階段：選擇找零
                        clickState.actionQueue = [
                            { type: 'selectChange', data: null }
                        ];
                        break;

                    case 'nextQuestion':
                        // 下一題階段：點擊繼續
                        clickState.actionQueue = [
                            { type: 'clickNext', data: null }
                        ];
                        break;

                    default:
                        // 未知階段：提供警告並保持空佇列
                        Game.Debug.warn('assist', '[A4-ClickMode] 未知的階段:', phase);
                        clickState.actionQueue = [];
                        break;
                }

                Game.Debug.log('assist', '[A4-ClickMode] 動作佇列已建立:', clickState.actionQueue);

                // 🆕 【修復】簡單模式：啟動視覺延遲機制（參考 A3 正確實施）
                if (Game.state.settings.difficulty === 'easy') {
                    this.enableClickModeWithVisualDelay(`BuildQueue-${phase}`);
                }

                // 如果是 payment 或 checking 階段，且模式已啟用，自動開始執行
                if (clickState.active && (phase === 'payment' || phase === 'checking')) {
                    Game.TimerManager.setTimeout(() => {
                        Game.Debug.log('assist', '[A4-ClickMode] 自動開始執行', phase, '階段');
                        this.executeNext();
                    }, 1000, 'clickMode');
                }
            },

            // 執行下一個動作
            executeNext() {
                const clickState = Game.state.gameState.clickModeState;

                if (!clickState.active) {
                    Game.Debug.log('assist', '[A4-ClickMode] 模式未啟用，停止執行');
                    return;
                }

                if (clickState.currentStep >= clickState.actionQueue.length) {
                    Game.Debug.log('assist', '[A4-ClickMode] 所有動作已完成，等待場景切換');
                    return;
                }

                const action = clickState.actionQueue[clickState.currentStep];
                Game.Debug.log('assist', `[A4-ClickMode] 執行動作 ${clickState.currentStep + 1}/${clickState.actionQueue.length}:`, action.type);

                clickState.currentStep++;
                this.executeAction(action);
            },

            // 執行具體動作
            executeAction(action) {
                switch(action.type) {
                    case 'selectProduct':
                        this.autoSelectProduct();
                        break;
                    case 'confirmPrice':
                        this.autoConfirmPrice();
                        break;
                    case 'payMoney':
                        this.autoPayMoney();
                        break;
                    case 'selectChange':
                        this.autoSelectChange();
                        break;
                    case 'clickNext':
                        this.autoClickNext();
                        break;
                    default:
                        Game.Debug.warn('assist', '[A4-ClickMode] 未知動作類型:', action.type);
                        this.showWaitPrompt();
                }
            },

            // 自動選擇商品
            autoSelectProduct() {
                Game.Debug.log('assist', '[A4-ClickMode] 自動選擇商品');

                // 檢查是否為指定商品模式
                const taskType = Game.state.settings.taskType;
                // 🔧 [修正] A4 使用 selectedItem，不是 assignedItem
                const selectedItem = Game.state.gameState.selectedItem;
                const targetItem = Game.state.gameState.currentTransaction?.targetItem || selectedItem;

                Game.Debug.log('assist', '[A4-ClickMode] 任務類型:', taskType);
                Game.Debug.log('assist', '[A4-ClickMode] selectedItem:', selectedItem);
                Game.Debug.log('assist', '[A4-ClickMode] targetItem:', targetItem);

                let targetProduct = null;

                if (taskType === 'assigned' && targetItem) {
                    // 指定商品模式：找到指定的商品
                    Game.Debug.log('assist', '[A4-ClickMode] 指定商品模式，尋找商品:', targetItem.name);
                    const productItems = document.querySelectorAll('.product-item');
                    Game.Debug.log('assist', '[A4-ClickMode] 頁面上共有', productItems.length, '個商品');

                    for (const item of productItems) {
                        // 🔧 [修正] 使用 data-item-name 屬性或 .product-name 元素
                        const itemName = item.dataset.itemName || item.querySelector('.product-name')?.textContent?.trim();
                        const itemId = item.dataset.itemId;
                        Game.Debug.log('assist', '[A4-ClickMode] 檢查商品:', itemName, 'ID:', itemId, '目標ID:', targetItem.id);

                        // 優先使用 ID 比對，因為名稱可能有格式化
                        if (parseInt(itemId) === targetItem.id || itemName === targetItem.name) {
                            targetProduct = item;
                            Game.Debug.log('assist', '[A4-ClickMode] ✅ 找到指定商品:', itemName);
                            break;
                        }
                    }

                    if (!targetProduct) {
                        Game.Debug.warn('assist', '[A4-ClickMode] ⚠️ 找不到指定商品:', targetItem.name, 'ID:', targetItem.id);
                    }
                } else {
                    // 自選模式：選擇第一個可負擔的商品
                    Game.Debug.log('assist', '[A4-ClickMode] 自選模式或無指定商品，選擇第一個商品');
                    const productItems = document.querySelectorAll('.product-item');
                    if (productItems.length > 0) {
                        targetProduct = productItems[0];
                    }
                }

                if (targetProduct) {
                    // 🎯 簡單模式：立即顯示「點這裡」提示動畫
                    targetProduct.classList.add('step-hint');
                    // 模擬點擊商品（800ms 後移除提示並點擊）
                    Game.TimerManager.setTimeout(() => {
                        targetProduct.classList.remove('step-hint');
                        targetProduct.click();
                        Game.Debug.log('assist', '[A4-ClickMode] 已點擊商品，將自動進入下一階段');
                    }, 800, 'clickMode');
                } else {
                    Game.Debug.warn('assist', '[A4-ClickMode] 找不到可選擇的商品');
                }
            },

            // 自動確認價格
            autoConfirmPrice() {
                Game.Debug.log('assist', '[A4-ClickMode] 自動確認價格');

                // 找到確認按鈕（簡單模式使用 #confirm-easy-price-btn）
                const confirmBtn = document.querySelector('#confirm-easy-price-btn');
                if (confirmBtn) {
                    Game.TimerManager.setTimeout(() => {
                        confirmBtn.click();
                        Game.Debug.log('assist', '[A4-ClickMode] 已確認價格');
                    }, 500, 'clickMode');
                } else {
                    Game.Debug.warn('assist', '[A4-ClickMode] 找不到確認按鈕');
                }
            },

            // 自動付款
            autoPayMoney() {
                Game.Debug.log('assist', '[A4-ClickMode] 準備付款');

                // 🔧 [修正] 使用 UI 已經計算好的 hintMoneyMapping，而不是重新計算
                const hintMoneyMapping = Game.state.gameState.hintMoneyMapping;

                if (!hintMoneyMapping || hintMoneyMapping.length === 0) {
                    Game.Debug.warn('assist', '[A4-ClickMode] 找不到付款提示映射');
                    return;
                }

                Game.Debug.log('assist', '[A4-ClickMode] 使用 UI 的付款方案:', hintMoneyMapping.map(m => m ? m.name : 'null'));

                // 🔧 [修正] 存儲付款序列（使用 hintMoneyMapping），不立即執行
                const clickState = Game.state.gameState.clickModeState;
                clickState.paymentQueue = hintMoneyMapping;
                clickState.paymentIndex = 0;

                Game.Debug.log('assist', '[A4-ClickMode] 付款序列已準備，共', hintMoneyMapping.length, '個金錢');
                Game.Debug.log('assist', '[A4-ClickMode] 等待用戶點擊開始付款');

                // 設置等待狀態
                clickState.waitingForClick = true;
            },

            // 執行付款序列
            executePaymentSequence(payment) {
                let currentIndex = 0;

                const payNext = () => {
                    if (currentIndex >= payment.length) {
                        Game.Debug.log('assist', '[A4-ClickMode] 付款完成');
                        return;
                    }

                    // 每次都重新獲取最新的錢包狀態
                    const wallet = Game.state.gameState.playerWallet || Game.state.gameState.wallet || [];

                    if (!Array.isArray(wallet) || wallet.length === 0) {
                        Game.Debug.warn('assist', '[A4-ClickMode] 錢包為空，無法付款');
                        return;
                    }

                    const moneyValue = payment[currentIndex];

                    // 使用正確的 transaction 引用
                    const currentTransaction = Game.state.gameState.currentTransaction;
                    const moneyPaid = currentTransaction ? currentTransaction.paidMoney || [] : [];

                    Game.Debug.log('assist', '[A4-ClickMode] 當前錢包狀態:', wallet.map(m => `${m.name}(${m.id})`));
                    Game.Debug.log('assist', '[A4-ClickMode] 已付款:', moneyPaid.map(m => `${m.name}(${m.id})`));
                    Game.Debug.log('assist', '[A4-ClickMode] 尋找金額:', moneyValue);

                    const moneyItem = wallet.find(m => m.value === moneyValue);

                    if (moneyItem) {
                        // 簡單模式下使用拖曳方式
                        Game.Debug.log('assist', '[A4-ClickMode] 準備拖曳金錢:', moneyItem.name, 'ID:', moneyItem.id);

                        // 找到淡化的提示位置
                        const hintItems = document.querySelectorAll('.hint-item.faded');
                        if (hintItems.length > 0) {
                            // 模擬拖曳到第一個淡化位置
                            const dropTarget = hintItems[0];

                            // 創建模擬的拖放事件 - dataTransfer.getData 應該返回 money.id
                            const mockEvent = {
                                preventDefault: () => {},
                                target: dropTarget,
                                dataTransfer: {
                                    getData: (format) => {
                                        Game.Debug.log('assist', '[A4-ClickMode] getData called with format:', format);
                                        return moneyItem.id;
                                    }
                                }
                            };

                            Game.Debug.log('assist', '[A4-ClickMode] 模擬拖曳事件:', {
                                moneyId: moneyItem.id,
                                moneyName: moneyItem.name,
                                targetPosition: dropTarget.dataset.position
                            });

                            Game.handleMoneyDrop(mockEvent);
                            Game.Debug.log('assist', '[A4-ClickMode] 已執行 handleMoneyDrop');
                        } else {
                            Game.Debug.warn('assist', '[A4-ClickMode] 找不到淡化的提示位置');
                        }
                    } else {
                        Game.Debug.warn('assist', '[A4-ClickMode] 找不到符合的金錢:', moneyValue);
                    }

                    currentIndex++;

                    if (currentIndex < payment.length) {
                        Game.TimerManager.setTimeout(payNext, 1000, 'clickMode');
                    }
                };

                Game.TimerManager.setTimeout(payNext, 500, 'clickMode');
            },

            // 🔧 [新增] 執行下一個付款操作（每次點擊放置一個金錢）
            executeNextPayment() {
                const clickState = Game.state.gameState.clickModeState;
                const paymentQueue = clickState.paymentQueue;
                const currentIndex = clickState.paymentIndex;

                Game.Debug.log('assist', '[A4-ClickMode] executeNextPayment - 當前索引:', currentIndex, '/', paymentQueue.length);

                if (currentIndex >= paymentQueue.length) {
                    Game.Debug.log('assist', '[A4-ClickMode] 所有金錢已放置完成');
                    // 付款完成，清除狀態
                    clickState.paymentQueue = null;
                    clickState.paymentIndex = 0;

                    // 設置標記：下一次點擊時觸發確認付款
                    clickState.waitingForConfirmPayment = true;
                    clickState.waitingForClick = true;  // 允許下一次點擊
                    Game.Debug.log('assist', '[A4-ClickMode] 等待用戶點擊以確認付款');
                    return;
                }

                // 🔧 [修正] paymentQueue 存儲的是錢幣對象，不是面額值
                const moneyItem = paymentQueue[currentIndex];

                if (!moneyItem) {
                    Game.Debug.warn('assist', '[A4-ClickMode] 錢幣對象為 null，跳過');
                    clickState.paymentIndex++;
                    if (clickState.paymentIndex < paymentQueue.length) {
                        clickState.waitingForClick = true;
                    }
                    return;
                }

                // 找到對應 currentIndex 的提示位置（用 data-position 精確定位，不依賴 DOM 順序）
                const dropTarget = document.querySelector(`.hint-item.faded[data-position="${currentIndex}"]`);
                if (dropTarget) {
                    // 創建模擬的拖放事件
                    const mockEvent = {
                        preventDefault: () => {},
                        target: dropTarget,
                        dataTransfer: {
                            getData: (format) => moneyItem.id
                        }
                    };

                    Game.Debug.log('assist', '[A4-ClickMode] 模擬拖曳事件:', {
                        moneyId: moneyItem.id,
                        moneyName: moneyItem.name,
                        targetPosition: dropTarget.dataset.position
                    });

                    Game.handleMoneyDrop(mockEvent);
                    Game.Debug.log('assist', '[A4-ClickMode] 已執行 handleMoneyDrop');

                    // 增加索引
                    clickState.paymentIndex++;

                    // 如果還有更多金錢需要放置，等待下次點擊
                    if (clickState.paymentIndex < paymentQueue.length) {
                        clickState.waitingForClick = true;
                        Game.Debug.log('assist', '[A4-ClickMode] 等待用戶點擊放置下一個金錢 (' + (clickState.paymentIndex + 1) + '/' + paymentQueue.length + ')');
                    } else {
                        Game.Debug.log('assist', '[A4-ClickMode] 所有金錢已放置完成');
                        // 設置標記：下一次點擊時觸發確認付款
                        clickState.waitingForConfirmPayment = true;
                        clickState.waitingForClick = true;
                        Game.Debug.log('assist', '[A4-ClickMode] 等待用戶點擊以確認付款');
                    }
                } else {
                    Game.Debug.warn('assist', '[A4-ClickMode] 找不到對應的提示位置:', currentIndex);
                }
            },

            // 自動選擇找零
            autoSelectChange() {
                Game.Debug.log('assist', '[A4-ClickMode] 準備找零');

                const transaction = Game.state.gameState.currentTransaction;
                if (!transaction) {
                    Game.Debug.warn('assist', '[A4-ClickMode] 找不到交易資料');
                    return;
                }

                const changeReceived = transaction.changeReceived || [];
                const changeExpected = transaction.changeExpected || 0;

                Game.Debug.log('assist', '[A4-ClickMode] 找零金額:', changeReceived);
                Game.Debug.log('assist', '[A4-ClickMode] 預期找零:', changeExpected);

                const clickState = Game.state.gameState.clickModeState;

                // 🔧 [修正] 如果無需找零，準備點擊「確認無需找零」按鈕
                if (changeReceived.length === 0 || changeExpected === 0) {
                    Game.Debug.log('assist', '[A4-ClickMode] 無需找零，準備點擊確認按鈕');
                    clickState.changeQueue = null;
                    clickState.changeIndex = 0;
                    clickState.needsNoChangeButton = true;
                    clickState.waitingForClick = true;
                    // 🎯 簡單模式：顯示確認無需找零按鈕提示動畫
                    Game.TimerManager.setTimeout(() => {
                        const noChangeBtn = document.querySelector('.confirm-btn');
                        if (noChangeBtn) noChangeBtn.classList.add('step-hint');
                    }, 300, 'hint');
                } else {
                    // 有找零：準備拖曳序列
                    Game.Debug.log('assist', '[A4-ClickMode] 需要找零，共', changeReceived.length, '個金錢');
                    clickState.changeQueue = changeReceived;
                    clickState.changeIndex = 0;
                    clickState.needsNoChangeButton = false;
                    clickState.waitingForClick = true;
                }
            },

            // 🔧 [新增] 執行下一個找零操作（每次點擊放置一個找零或點擊按鈕）
            executeNextChange() {
                const clickState = Game.state.gameState.clickModeState;

                // 如果無需找零，點擊「確認無需找零」按鈕
                if (clickState.needsNoChangeButton) {
                    Game.Debug.log('assist', '[A4-ClickMode] 點擊確認無需找零按鈕');
                    const noChangeBtn = document.querySelector('.confirm-btn');
                    if (noChangeBtn) {
                        noChangeBtn.click();
                        Game.Debug.log('assist', '[A4-ClickMode] 已點擊確認無需找零按鈕');
                        clickState.needsNoChangeButton = false;
                    } else {
                        Game.Debug.warn('assist', '[A4-ClickMode] 找不到確認無需找零按鈕');
                    }
                    return;
                }

                // 如果有找零，拖曳一個找零金錢
                const changeQueue = clickState.changeQueue;
                const currentIndex = clickState.changeIndex;

                if (!changeQueue || currentIndex >= changeQueue.length) {
                    Game.Debug.log('assist', '[A4-ClickMode] 找零完成');
                    clickState.changeQueue = null;
                    clickState.changeIndex = 0;
                    return;
                }

                const changeMoney = changeQueue[currentIndex];
                Game.Debug.log('assist', '[A4-ClickMode] 準備拖曳找零:', changeMoney.name, '索引:', currentIndex);

                // 找到對應的淡化找零目標
                const changeTargets = document.querySelectorAll('.change-target.faded');
                if (changeTargets.length > 0) {
                    const dropTarget = changeTargets[0];

                    // 創建模擬的拖放事件 - 找零格式是 change-{changeId}-{moneyValue}
                    const mockEvent = {
                        preventDefault: () => {},
                        target: dropTarget,
                        dataTransfer: {
                            getData: (format) => `change-${currentIndex}-${changeMoney.value}`
                        }
                    };

                    Game.Debug.log('assist', '[A4-ClickMode] 模擬找零拖曳事件:', {
                        changeId: currentIndex,
                        moneyValue: changeMoney.value,
                        moneyName: changeMoney.name,
                        targetIndex: dropTarget.dataset.targetIndex
                    });

                    Game.handleChangeTargetDrop(mockEvent);
                    Game.Debug.log('assist', '[A4-ClickMode] 已執行 handleChangeTargetDrop');

                    // 增加索引
                    clickState.changeIndex++;

                    // 如果還有更多找零需要放置，等待下次點擊
                    if (clickState.changeIndex < changeQueue.length) {
                        clickState.waitingForClick = true;
                        Game.Debug.log('assist', '[A4-ClickMode] 等待用戶點擊放置下一個找零 (' + (clickState.changeIndex + 1) + '/' + changeQueue.length + ')');
                    } else {
                        Game.Debug.log('assist', '[A4-ClickMode] 所有找零已放置完成');
                    }
                } else {
                    Game.Debug.warn('assist', '[A4-ClickMode] 找不到淡化的找零目標位置');
                }
            },

            // 自動點擊下一題
            autoClickNext() {
                Game.Debug.log('assist', '[A4-ClickMode] 自動點擊下一題');

                const nextBtn = document.querySelector('.next-question-btn');
                if (nextBtn) {
                    Game.TimerManager.setTimeout(() => {
                        nextBtn.click();
                        Game.Debug.log('assist', '[A4-ClickMode] 已點擊下一題');
                    }, 500, 'clickMode');
                } else {
                    Game.Debug.warn('assist', '[A4-ClickMode] 找不到下一題按鈕');
                    this.showWaitPrompt();
                }
            },

            // 計算最佳付款組合
            calculateOptimalPayment(targetAmount) {
                const wallet = Game.state.gameState.playerWallet || Game.state.gameState.wallet || [];

                if (!Array.isArray(wallet) || wallet.length === 0) {
                    Game.Debug.warn('assist', '[A4-ClickMode] 錢包為空或無效');
                    return [];
                }

                const available = wallet.map(m => m.value).sort((a, b) => b - a);

                Game.Debug.log('assist', '[A4-ClickMode] 可用金錢:', available);
                Game.Debug.log('assist', '[A4-ClickMode] 目標金額:', targetAmount);

                // 簡單貪婪算法：從大到小選擇
                const payment = [];
                let remaining = targetAmount;

                for (const value of available) {
                    while (remaining >= value) {
                        payment.push(value);
                        remaining -= value;
                    }
                    if (remaining === 0) break;
                }

                // 如果無法剛好付款，選擇大於目標金額的最小組合
                if (remaining > 0) {
                    payment.length = 0;
                    remaining = targetAmount;

                    for (const value of available) {
                        payment.push(value);
                        remaining -= value;
                        if (remaining <= 0) break;
                    }
                }

                Game.Debug.log('assist', '[A4-ClickMode] 最佳付款組合:', payment);
                return payment;
            },

            // 顯示提示
            showPrompt(text) {
                const clickState = Game.state.gameState.clickModeState;
                if (clickState.promptVisible) return;

                // 創建提示元素
                const prompt = document.createElement('div');
                prompt.id = 'click-mode-prompt';
                prompt.className = 'click-mode-prompt';
                prompt.innerHTML = `
                    <div class="prompt-content">
                        <div class="prompt-icon">👆</div>
                        <div class="prompt-text">${text}</div>
                    </div>
                `;

                document.body.appendChild(prompt);
                clickState.promptVisible = true;

                // 添加淡入效果
                Game.TimerManager.setTimeout(() => {
                    prompt.classList.add('visible');
                }, 10, 'uiAnimation');
            },

            // 隱藏提示
            hidePrompt() {
                const prompt = document.getElementById('click-mode-prompt');
                if (prompt) {
                    prompt.classList.remove('visible');
                    Game.TimerManager.setTimeout(() => {
                        prompt.remove();
                    }, 300, 'uiAnimation');
                }

                Game.state.gameState.clickModeState.promptVisible = false;
            },

            // 顯示等待提示
            showWaitPrompt() {
                const clickState = Game.state.gameState.clickModeState;
                clickState.waitingForClick = true;
                this.showPrompt('點擊任意處繼續');
            }
        }
    };
    
    // 將 Game 物件掛載到全域，供 HTML 事件使用
    window.Game = Game;
    
    // 初始化遊戲
    Game.init();
});
