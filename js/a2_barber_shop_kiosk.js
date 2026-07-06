// =================================================================
/**
 * @file a2_barber_shop_kiosk.js
 * @description A2 理髮店售票機模擬學習單元 - 配置驅動版本
 * @unit A2 - 理髮店售票機操作學習
 * @version 1.4.0 - Phase 2 完成：移除 7 處內嵌 @keyframes
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
// 基於A2架構的理髮店售票機開發
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const BarberKiosk = {
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
                coin: false,        // 投幣相關
                payment: false,     // 付款驗證
                service: false,     // 服務選擇
                flow: false,        // 遊戲流程
                assist: false,      // 輔助點擊模式
                hint: false,        // 提示系統
                timer: false,       // 計時器
                event: false,       // 事件處理
                error: true         // 錯誤（預設開啟）
            },

            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[A2-${category}]`, ...args);
                }
            },

            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[A2-${category}]`, ...args);
                }
            },

            error(...args) {
                console.error('[A2-ERROR]', ...args);
            }
        },

        // =====================================================
        // 🔧 金額轉換輔助函數 - 使用共用模組
        // =====================================================
        convertAmountToSpeech(amount) {
            // 使用共用模組的金額轉換函數
            return NumberSpeechUtils.convertToTraditionalCurrency(amount);
        },

        // =====================================================
        // 狀態管理系統（基於A2架構）
        // =====================================================
        state: {
            settings: {
                difficulty: null,            // null（未選擇）, easy, normal, hard
                walletType: null,            // null（未選擇）, default, fixed500, fixed1000
                walletAmount: null,          // 自訂錢包金額（已停用）
                customWalletTypes: null,     // 自訂錢包幣值類型（已停用）
                taskType: null,              // null（未選擇）, assigned, freeChoice
                questionCount: null,         // null（未選擇）, 5, 10, 15, 20, custom
                language: 'chinese',         // chinese, english
                audioEnabled: true,          // 音效開關
                speechEnabled: true,         // 語音開關
                animationSpeed: 'normal',    // slow, normal, fast
            },
            audioUnlocked: false,            // 手機端音頻解鎖狀態
            gameState: {
                // === 共用狀態 ===
                currentScene: 'service-selection',     // service-selection, payment, printing, complete
                currentStep: 1,              // 當前操作步驟（向後兼容）
                totalSteps: 3,               // 總步驟數：選擇服務→付款→取票
                selectedService: null,       // 選擇的服務項目
                requiredAmount: 0,           // 需要金額
                insertedAmount: 0,           // 已投入金額
                paymentComplete: false,      // 付款是否完成
                ticketPrinted: false,        // 票券是否已列印
                isProcessing: false,         // 是否正在處理
                showingModal: false,         // 是否顯示模態視窗
                queueNumber: 1,              // 等候號碼
                // 遊戲化元素
                experience: 0,               // 經驗值
                level: 1,                   // 等級
                completedOrders: 0,          // 完成訂單數
                startTime: null,             // 測驗開始時間

                // === 簡單模式專用 ===
                easyMode: {
                    currentStep: 'step1',   // 當前步驟：step1, step2, step3
                    assignedService: null,  // 指定的服務
                    walletAmount: 0,        // 錢包總金額
                    walletCoins: null,      // 錢包硬幣明細 {bills: [], coins: []}
                    walletComposition: null,  // 原始錢包組成（用於計算提示）
                    correctAmounts: null    // 正確的金額組合（用於提示時高亮）
                },

                // === 普通/困難模式專用 ===
                normalMode: {
                    currentStep: 'step1',   // 當前步驟：step1, step2, step3
                    errorCount: 0,          // 當前步驟的錯誤次數
                    hintShown: false,       // 提示是否已顯示
                    totalErrors: 0,         // 總錯誤次數（統計用）
                    paymentErrorCount: 0,   // 付款錯誤次數（用於觸發提示）
                    assignedService: null,  // 指定任務時的指定服務
                    walletAmount: 0,        // 錢包總金額
                    walletCoins: null,      // 錢包硬幣明細 {bills: [], coins: []}
                    billsInserted: false,   // 是否已投入紙鈔
                    coinsInserted: false,   // 是否已投入硬幣
                    tempSelectedMoney: [],  // 臨時選擇的金額（在確認前）
                    correctAmounts: null,   // 正確的金額組合（用於提示時鎖定）
                    hintTimer: null         // 普通模式自動提示計時器 ID
                },

                // === 🆕 輔助點擊模式狀態（參考 A5 ATM）===
                clickModeState: {
                    enabled: false,              // 是否啟用輔助點擊模式
                    waitingForClick: false,      // 是否等待用戶點擊繼續
                    clickReadyTime: 0,           // 點擊準備就緒時間（用於防快速點擊）
                    lastClickTime: 0,            // 最後點擊時間（防抖用）
                    isExecuting: false,          // 是否正在執行操作（防止競態條件）
                    _visualDelayTimer: null      // 視覺延遲計時器
                }
            },
            quiz: {
                currentQuestion: 0,
                score: 0,
                questions: [],
                startTime: null,
                attempts: 0
            }
        },

        // =====================================================
        // 配置驅動系統 - 服務項目配置
        // =====================================================
        serviceConfig: {
            easy: {
                services: [
                    {
                        id: 'mens_cut',
                        name: '男士剪髮',
                        price: 150,
                        icon: '../images/a2/icon-a2-mens-haircut.png',
                        description: '基本剪髮服務',
                        keyShortcut: '1'
                    },
                    {
                        id: 'womens_cut',
                        name: '女士剪髮',
                        price: 200,
                        icon: '../images/a2/icon-a2-womens-haircut.png',
                        description: '女士剪髮造型',
                        keyShortcut: '2'
                    },
                    {
                        id: 'wash',
                        name: '洗髮',
                        price: 30,
                        icon: '../images/a2/icon-a2-hair-wash.png',
                        description: '洗髮護理',
                        keyShortcut: '3'
                    },
                    {
                        id: 'color',
                        name: '染髮',
                        price: 500,
                        icon: '../images/a2/icon-a2-hair-coloring.png',
                        description: '專業染髮',
                        keyShortcut: '4'
                    },
                    {
                        id: 'scalp_isolation',
                        name: '頭皮隔離',
                        price: 250,
                        icon: '../images/a2/icon-a2-scalp-protection.png',
                        description: '頭皮保護隔離',
                        keyShortcut: '5'
                    },
                    {
                        id: 'head_massage',
                        name: '頭皮按摩',
                        price: 150,
                        icon: '../images/a2/icon-a2-scalp-massage.png',
                        description: '放鬆頭皮按摩',
                        keyShortcut: '6'
                    }
                ],
                acceptedMoney: [100, 50, 10, 5, 1] // 接受的金額面額
            },
            normal: {
                services: [
                    {
                        id: 'mens_cut',
                        name: '男士剪髮',
                        price: 150,
                        icon: '../images/a2/icon-a2-mens-haircut.png',
                        description: '基本剪髮服務',
                        keyShortcut: '1'
                    },
                    {
                        id: 'womens_cut',
                        name: '女士剪髮',
                        price: 200,
                        icon: '../images/a2/icon-a2-womens-haircut.png',
                        description: '女士剪髮造型',
                        keyShortcut: '2'
                    },
                    {
                        id: 'wash',
                        name: '洗髮',
                        price: 30,
                        icon: '../images/a2/icon-a2-hair-wash.png',
                        description: '洗髮護理',
                        keyShortcut: '3'
                    },
                    {
                        id: 'color',
                        name: '染髮',
                        price: 500,
                        icon: '../images/a2/icon-a2-hair-coloring.png',
                        description: '專業染髮',
                        keyShortcut: '4'
                    },
                    {
                        id: 'scalp_isolation',
                        name: '頭皮隔離',
                        price: 250,
                        icon: '../images/a2/icon-a2-scalp-protection.png',
                        description: '頭皮保護隔離',
                        keyShortcut: '5'
                    },
                    {
                        id: 'head_massage',
                        name: '頭皮按摩',
                        price: 150,
                        icon: '../images/a2/icon-a2-scalp-massage.png',
                        description: '放鬆頭皮按摩',
                        keyShortcut: '6'
                    }
                ],
                acceptedMoney: [100, 50, 10, 5, 1]
            },
            hard: {
                services: [
                    {
                        id: 'mens_cut',
                        name: '男士剪髮',
                        price: 150,
                        icon: '../images/a2/icon-a2-mens-haircut.png',
                        description: '基本剪髮服務',
                        keyShortcut: '1'
                    },
                    {
                        id: 'womens_cut',
                        name: '女士剪髮',
                        price: 200,
                        icon: '../images/a2/icon-a2-womens-haircut.png',
                        description: '女士剪髮造型',
                        keyShortcut: '2'
                    },
                    {
                        id: 'wash',
                        name: '洗髮',
                        price: 30,
                        icon: '../images/a2/icon-a2-hair-wash.png',
                        description: '洗髮護理',
                        keyShortcut: '3'
                    },
                    {
                        id: 'color',
                        name: '染髮',
                        price: 500,
                        icon: '../images/a2/icon-a2-hair-coloring.png',
                        description: '專業染髮',
                        keyShortcut: '4'
                    },
                    {
                        id: 'scalp_isolation',
                        name: '頭皮隔離',
                        price: 250,
                        icon: '../images/a2/icon-a2-scalp-protection.png',
                        description: '頭皮保護隔離',
                        keyShortcut: '5'
                    },
                    {
                        id: 'head_massage',
                        name: '頭皮按摩',
                        price: 150,
                        icon: '../images/a2/icon-a2-scalp-massage.png',
                        description: '放鬆頭皮按摩',
                        keyShortcut: '6'
                    }
                ],
                acceptedMoney: [100, 50, 10, 5, 1]
            }
        },

        // =====================================================
        // 配置驅動系統 - 語音模板配置
        // =====================================================
        speechTemplates: {
            easy: {
                welcome: '歡迎光臨百元理髮店，本機只收百元紙鈔或硬幣，不找零錢',
                serviceSelected: '您選擇了{serviceName}，費用是{price}元',
                paymentInstructions: '請投入{amount}元',
                paymentReceived: '已收到{amount}元',
                paymentComplete: '付款完成！',
                ticketPrinting: '票卷列印中，請稍候',
                ticketReady: '請取走您的號碼牌，號碼是{queueNumber}號',
                noChange: '本機不找零，請投入正確金額',
                insufficient: '金額不足，還需要{remaining}元',
                refund: '已退回{amount}元，感謝使用'
            },
            normal: {
                welcome: '歡迎光臨百元理髮店！本機只收百元紙鈔或硬幣，不找零錢',
                serviceSelected: '您選擇了{serviceName}，服務費用是{price}元',
                paymentInstructions: '請投入{amount}元',
                paymentReceived: '已收到{amount}元，謝謝您的付款',
                paymentComplete: '付款完成！',
                ticketPrinting: '票卷列印中，請稍後',
                ticketReady: '票據列印完成，請取走您的號碼牌。您的號碼是{queueNumber}號，請依序等候',
                noChange: '重要提醒：本機不找零，請投入正確金額',
                insufficient: '付款金額不足，還需要投入{remaining}元',
                refund: '系統已退回{amount}元，感謝您的使用'
            },
            hard: {
                welcome: '歡迎光臨百元理髮店！本機只收百元紙鈔或硬幣，不找零錢',
                serviceSelected: '您已選擇{serviceName}服務，服務費用為{price}元',
                paymentInstructions: '請投入總金額{amount}元',
                paymentReceived: '系統已收到{amount}元付款，感謝您的配合',
                paymentComplete: '付款完成！',
                ticketPrinting: '票卷列印中，請稍後',
                ticketReady: '服務票據列印完成，請務必取走您的號碼牌。您的排隊號碼是{queueNumber}號，請按照號碼順序等候服務，本券限當日使用',
                noChange: '重要警告：本機器不提供找零服務，請務必投入正確金額',
                insufficient: '付款金額不足，系統顯示還需要投入{remaining}元才能完成交易',
                refund: '系統正在退回您投入的{amount}元，請稍候並感謝您的使用'
            }
        },

        // =====================================================
        // 配置驅動系統 - 時間配置
        // =====================================================
        timingConfig: {
            easy: {
                speechDelay: 500,
                sceneTransition: 1000,
                paymentDelay: 1500,
                printingTime: 2000,
                animationDuration: 800
            },
            normal: {
                speechDelay: 300,
                sceneTransition: 800,
                paymentDelay: 1200,
                printingTime: 2500,
                animationDuration: 600
            },
            hard: {
                speechDelay: 200,
                sceneTransition: 600,
                paymentDelay: 1000,
                printingTime: 3000,
                animationDuration: 400
            }
        },

        // =====================================================
        // 音效和語音系統（基於A2）
        // =====================================================
        audio: {
            beepSound: null,
            errorSound: null,
            error02Sound: null,
            successSound: null,
            cashSound: null,
            printSound: null,

            init() {
                try {
                    this.beepSound = new Audio('../audio/units/click.mp3');
                    this.beepSound.preload = 'auto';
                    this.beepSound.volume = 0.6;

                    this.errorSound = new Audio('../audio/units/error.mp3');
                    this.errorSound.preload = 'auto';
                    this.errorSound.volume = 0.5;

                    this.error02Sound = new Audio('../audio/units/error.mp3');
                    this.error02Sound.preload = 'auto';
                    this.error02Sound.volume = 0.5;

                    this.successSound = new Audio('../audio/units/correct02.mp3');
                    this.successSound.preload = 'auto';
                    this.successSound.volume = 0.7;

                    this.cashSound = new Audio('../audio/units/correct02.mp3');
                    this.cashSound.preload = 'auto';
                    this.cashSound.volume = 0.7;

                    this.printSound = new Audio('../audio/units/click.mp3');
                    this.printSound.preload = 'auto';
                    this.printSound.volume = 0.8;

                    this.keypadSound = new Audio('../audio/units/keypad.mp3');
                    this.keypadSound.preload = 'auto';
                    this.keypadSound.volume = 0.7;

                    BarberKiosk.Debug.log('init', ' 音效系統初始化完成');
                } catch (error) {
                    BarberKiosk.Debug.error('[A2-Kiosk] 音效初始化錯誤:', error);
                }
            },

            playSound(soundType, callback = null) {
                if (!BarberKiosk.state.settings.audioEnabled || !BarberKiosk.state.audioUnlocked) {
                    if (callback) callback();
                    return;
                }

                try {
                    let sound = null;
                    switch (soundType) {
                        case 'beep': sound = this.beepSound; break;
                        case 'error': sound = this.errorSound; break;
                        case 'error02': sound = this.error02Sound; break;
                        case 'success': sound = this.successSound; break;
                        case 'cash': sound = this.cashSound; break;
                        case 'print': sound = this.printSound; break;
                        case 'click': sound = this.beepSound; break; // 使用beep聲音作為click
                        case 'keypad': sound = this.keypadSound; break;
                        default:
                            BarberKiosk.Debug.warn('audio', '[A2-Kiosk] 未知音效類型:', soundType);
                            if (callback) callback();
                            return;
                    }

                    if (sound) {
                        sound.currentTime = 0;
                        const playPromise = sound.play();
                        if (playPromise !== undefined) {
                            playPromise
                                .then(() => {
                                    if (callback) {
                                        BarberKiosk.TimerManager.setTimeout(callback, sound.duration * 1000 || 500, 'audioCallback');
                                    }
                                })
                                .catch(error => {
                                    BarberKiosk.Debug.warn('audio', '[A2-Kiosk] 音效播放失敗:', error);
                                    if (callback) callback();
                                });
                        } else if (callback) {
                            BarberKiosk.TimerManager.setTimeout(callback, 500, 'audioCallback');
                        }
                    } else if (callback) {
                        callback();
                    }
                } catch (error) {
                    BarberKiosk.Debug.error('[A2-Kiosk] 音效播放錯誤:', error);
                    if (callback) callback();
                }
            }
        },

        // =====================================================
        // 語音系統（基於配置驱动）
        // =====================================================
        speech: {
            synth: null,
            voice: null,

            init() {
                if ('speechSynthesis' in window) {
                    this.synth = window.speechSynthesis;
                    this.setupVoice();
                    BarberKiosk.Debug.log('init', ' 語音系統初始化完成');
                } else {
                    BarberKiosk.Debug.warn('audio', '[A2-Kiosk] 瀏覽器不支援語音合成');
                }
            },

            setupVoice() {
                const voices = this.synth.getVoices();
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
                    BarberKiosk.Debug.log('init', ' 使用語音:', this.voice.name);
                }
            },

            speak(templateKey, replacements = {}, callback = null) {
                if (!BarberKiosk.state.settings.speechEnabled || !this.synth || !this.voice) {
                    if (callback) callback();
                    return;
                }

                try {
                    const difficulty = BarberKiosk.state.settings.difficulty;
                    const template = BarberKiosk.speechTemplates[difficulty]?.[templateKey];

                    if (!template) {
                        BarberKiosk.Debug.warn('audio', '[A2-Kiosk] 找不到語音模板:', templateKey);
                        if (callback) callback();
                        return;
                    }

                    let speechText = template;
                    Object.keys(replacements).forEach(key => {
                        speechText = speechText.replace(new RegExp(`{${key}}`, 'g'), replacements[key]);
                    });

                    // 取消当前正在播放的语音
                    this.synth.cancel();

                    // 等待一小段时间确保取消完成
                    const delay = BarberKiosk.timingConfig[difficulty]?.speechDelay || 300;
                    BarberKiosk.TimerManager.setTimeout(() => {
                        const utterance = new SpeechSynthesisUtterance(speechText);
                        utterance.voice = this.voice;
                        utterance.rate = 1.0;
                        utterance.lang = this.voice.lang;

                        if (callback) {
                            let callbackExecuted = false;
                            const safeCallback = () => {
                                if (!callbackExecuted) {
                                    callbackExecuted = true;
                                    callback();
                                }
                            };

                            utterance.onend = () => {
                                safeCallback();
                            };

                            utterance.onerror = (event) => {
                                // 只記錄非中斷錯誤
                                if (event.error !== 'interrupted') {
                                    BarberKiosk.Debug.error('[A2-Kiosk] 語音播放錯誤:', event);
                                    // 🆕【修復 17】只有非 interrupted 錯誤才調用回調
                                    safeCallback();
                                } else {
                                    BarberKiosk.Debug.log('speech', ' 語音被中斷，不執行回調');
                                    callbackExecuted = true; // 防止逾時 safeCallback 仍然觸發
                                }
                            };

                            // 8 秒安全逾時，防止語音卡住時阻塞流程
                            BarberKiosk.TimerManager.setTimeout(safeCallback, 8000, 'speechDelay');
                        } else {
                            utterance.onerror = (event) => {
                                if (event.error !== 'interrupted') {
                                    BarberKiosk.Debug.error('[A2-Kiosk] 語音播放錯誤:', event);
                                }
                            };
                        }

                        this.synth.speak(utterance);
                    }, delay, 'speechDelay');

                } catch (error) {
                    BarberKiosk.Debug.error('[A2-Kiosk] 語音系統錯誤:', error);
                    if (callback) callback();
                }
            },

            // 自訂語音播放
            speakCustom(text, callback = null, interrupt = true) {
                if (!BarberKiosk.state.settings.speechEnabled || !this.synth || !this.voice) {
                    if (callback) callback();
                    return;
                }

                try {
                    // 如果需要中斷當前語音
                    if (interrupt && this.synth.speaking) {
                        BarberKiosk.Debug.log('speech', ' 取消當前語音');
                        this.synth.cancel();
                        BarberKiosk.TimerManager.setTimeout(() => this.performSpeechCustom(text, callback), 200, 'speechDelay');
                        return;
                    }

                    this.performSpeechCustom(text, callback);

                } catch (error) {
                    BarberKiosk.Debug.error('[A2-Kiosk] 語音系統錯誤:', error);
                    if (callback) callback();
                }
            },

            // 執行語音播放（參考 a5 的實現）
            performSpeechCustom(text, callback) {
                BarberKiosk.Debug.log('speech', ' performSpeechCustom 被調用，文字:', text, '語音系統狀態:', this.synth.speaking ? '正在播放' : '空閒');

                const utterance = new SpeechSynthesisUtterance(text);
                utterance.voice = this.voice;
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.lang = this.voice.lang;

                utterance.onstart = () => {
                    BarberKiosk.Debug.log('speech', ' 語音開始播放:', text);
                };

                if (callback) {
                    let callbackExecuted = false;
                    const safeCallback = () => {
                        if (!callbackExecuted) {
                            callbackExecuted = true;
                            BarberKiosk.Debug.log('speech', ' 語音播放結束，執行回調');
                            callback();
                        }
                    };

                    utterance.onend = () => {
                        BarberKiosk.Debug.log('speech', ' 語音 onend 事件觸發');
                        safeCallback();
                    };

                    utterance.onerror = (event) => {
                        BarberKiosk.Debug.error('[A2-Kiosk] 語音播放錯誤:', event.error, event);
                        // 🆕【修復 17 + 修復 20】如果是 interrupted，不調用回調（避免提前關閉彈窗）
                        if (event.error !== 'interrupted') {
                            safeCallback();
                        } else {
                            BarberKiosk.Debug.log('speech', ' 語音被中斷，不執行回調');
                            // 🆕【修復 20】標記回調已執行，防止 setTimeout 延遲回調執行
                            callbackExecuted = true;
                        }
                    };

                    // 根據文本長度計算超時時間（每個字約 0.6 秒，更保守）
                    const estimatedDuration = Math.max(text.length * 0.6 * 1000, 3000);
                    BarberKiosk.Debug.log('speech', `[Speech] 設定超時: ${estimatedDuration}ms，文字長度:`, text.length);
                    BarberKiosk.TimerManager.setTimeout(safeCallback, estimatedDuration, 'speechDelay');
                } else {
                    utterance.onend = () => {
                        BarberKiosk.Debug.log('speech', ' 語音 onend 事件觸發（無 callback）:', text);
                    };

                    utterance.onerror = (event) => {
                        // 'interrupted' 是正常行為（新語音中斷舊語音），不記錄為錯誤
                        if (event.error !== 'interrupted') {
                            BarberKiosk.Debug.error('[A2-Kiosk] 語音播放錯誤（無 callback）:', event.error, event);
                        }
                    };
                }

                BarberKiosk.Debug.log('speech', ' 準備調用 synth.speak()');
                this.synth.speak(utterance);
                BarberKiosk.Debug.log('speech', ' synth.speak() 已調用');
            }
        },

        // =====================================================
        // 煙火動畫和成功音效系統
        // =====================================================
        playSuccessFireworks() {
            // 只在指定任務模式下觸發煙火和音效（含先投幣指定任務）
            const taskType = this.state.settings.taskType;
            if (taskType !== 'assigned' && taskType !== 'coinFirstAssigned') {
                BarberKiosk.Debug.log('ui', ' 非指定任務模式，跳過煙火動畫');
                return;
            }

            BarberKiosk.Debug.log('ui', ' 🎆 觸發煙火動畫和成功音效');

            // 播放 correct02.mp3 音效
            const correct02Sound = document.getElementById('correct02-sound');
            if (correct02Sound) {
                correct02Sound.currentTime = 0;
                correct02Sound.play().catch(error => {
                    BarberKiosk.Debug.warn('ui', '[Fireworks] 音效播放失敗:', error);
                });
            }

            // 觸發 canvas-confetti 煙火動畫 - 只在中間播放
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            } else {
                BarberKiosk.Debug.warn('ui', '[Fireworks] canvas-confetti 庫未載入');
            }
        },

        // =====================================================
        // HTML模板系統
        // =====================================================
        HTMLTemplates: {
            titleBar() {
                const settings = BarberKiosk.state.settings;
                const gameState = BarberKiosk.state.gameState;
                const currentQuestion = gameState.completedOrders + 1;
                const totalQuestions = settings.questionCount || 5;
                const taskType = settings.taskType === 'assigned' ? '指定服務購票' : '自由選擇服務';

                return `
                    <div class="kiosk-title-bar">
                        <div class="title-bar-left">
                            <img src="../images/a2/icon-a2-barber-shop-02.png" alt="百元理髮店" style="width: 2rem; height: 2rem; object-fit: contain; margin-right: 0.5rem;">
                            <span>百元理髮店測驗</span>
                        </div>
                        <div class="title-bar-center">
                            ${taskType}
                        </div>
                        <div class="title-bar-right">
                            <span>第 ${currentQuestion} 題 / 共 ${totalQuestions} 題</span>
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="BarberKiosk.showSettings()">返回設定</button>
                        </div>
                    </div>
                `;
            },

            kioskBody() {
                return `
                    <div class="kiosk-body">
                        <!-- 左側面板 -->
                        <div class="kiosk-left-panel">
                            ${this.billSlotArea()}
                            ${this.coinSlotArea()}
                            ${this.walletButtonArea()}
                        </div>

                        <!-- 中央面板 -->
                        <div class="kiosk-center-panel">
                            ${this.kioskScreen()}
                        </div>

                        <!-- 右側面板 -->
                        <div class="kiosk-right-panel">
                            ${this.ticketDispenserArea()}
                        </div>
                    </div>
                `;
            },

            // 🎯 新增：獨立金額顯示區域（置頂）
            amountDisplayArea() {
                return `
                    <div class="amount-display-area">
                        <div class="money-display" id="money-display">
                            <div class="money-amount">NT$ <span id="inserted-amount">0</span></div>
                            <div class="money-needed">還需要: NT$ <span id="needed-amount">0</span></div>
                            <div class="money-status" id="money-status">請選擇服務項目</div>
                        </div>
                    </div>
                `;
            },

            billSlotArea() {
                return `
                    <div class="bill-slot-area">
                        <div class="bill-printer" onclick="BarberKiosk.showMoneySelection('bill')">
                            <div class="bill-slot-label">💸 紙鈔入口</div>
                            <div class="bill-slot">
                                <div class="bill-slot-label">點擊選擇紙鈔</div>
                                <div class="bill-opening"></div>
                            </div>
                        </div>
                    </div>
                `;
            },

            coinSlotArea() {
                return `
                    <div class="coin-slot-area">
                        <div class="coin-printer" onclick="BarberKiosk.showMoneySelection('coin')">
                            <div class="coin-slot-label">🪙 硬幣入口</div>
                            <div class="coin-slot">
                                <div class="coin-slot-label">點擊選擇硬幣</div>
                                <div class="coin-opening"></div>
                            </div>
                        </div>
                    </div>
                `;
            },

            walletButtonArea() {
                const difficulty = BarberKiosk.state.settings.difficulty;
                const showWalletBtn = difficulty === 'normal' || difficulty === 'hard';

                if (!showWalletBtn) return '';

                return `
                    <button class="wallet-btn" onclick="BarberKiosk.showWalletModal()" style="
                        padding: 12px 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border: none;
                        border-radius: 12px;
                        color: white;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                        transition: all 0.3s ease;
                        width: 240px;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.5)'"
                    onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)'">
                        <img src="../images/common/icons_wallet.png" alt="👛" style="width:1.5em;height:1.5em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='👛'"> 我的錢包
                    </button>
                `;
            },

            ticketDispenserArea() {
                const ticketPrinted = BarberKiosk.state.gameState.ticketPrinted;
                const selectedService = BarberKiosk.state.gameState.selectedService;
                const queueNumber = BarberKiosk.state.gameState.queueNumber;

                BarberKiosk.Debug.log('ui', ' 渲染票據出口 - ticketPrinted:', ticketPrinted, 'selectedService:', selectedService?.name, 'queueNumber:', queueNumber);

                const ticketHTML = ticketPrinted && selectedService ? `
                    <div class="printed-ticket">
                        <div class="ticket-mini-header">
                            <div class="shop-name">
                                <img src="../images/a2/icon-a2-barber-shop-02.png" alt="百元理髮店" style="width: 1.2rem; height: 1.2rem; object-fit: contain; vertical-align: middle; margin-right: 0.3rem;">
                                百元理髮店
                            </div>
                            <div class="queue-number-large">${String(queueNumber).padStart(2, '0')}</div>
                        </div>
                        <div class="ticket-mini-body">
                            <div class="service-info">
                                <span class="service-name">${selectedService.name}</span>
                                <span class="service-price">NT$ ${selectedService.price}</span>
                            </div>
                        </div>
                    </div>
                ` : '';

                // 修改判斷條件：當付款完成且票尚未印出時，顯示取票按鈕
                const paymentComplete = BarberKiosk.state.gameState.paymentComplete;
                const takeTicketButton = (paymentComplete && !ticketPrinted) ? `
                    <button class="take-ticket-btn" onclick="BarberKiosk.printTicket()">
                        📋 取走票據
                    </button>
                ` : (ticketPrinted ? `
                    <button class="take-ticket-btn" onclick="BarberKiosk.showTicketModal()">
                        📄 查看票券
                    </button>
                ` : '');

                return `
                    <div class="ticket-dispenser-area">
                        <div class="ticket-printer">
                            <div class="ticket-slot-label">🎫 票券出口</div>
                            <div class="ticket-slot">
                                <div class="ticket-opening"></div>
                                <div class="ticket-output" id="ticket-output">${ticketHTML}</div>
                            </div>
                            ${takeTicketButton}
                        </div>
                    </div>
                `;
            },

            kioskScreen() {
                const difficulty = BarberKiosk.state.settings.difficulty;
                const settings = BarberKiosk.state.settings;
                const services = BarberKiosk.serviceConfig[difficulty].services;
                // 🆕【修復 50】普通模式也顯示提示按鈕（除了保持錯誤3次自動提示外，新增手動提示按鈕）
                const showHintBtn = settings.difficulty === 'hard' || settings.difficulty === 'normal';

                return `
                    <div class="kiosk-screen" style="position: relative;">
                        ${showHintBtn ? `
                            <div style="position:absolute;right:0;top:15px;z-index:5;display:flex;align-items:center;gap:6px;">
                                <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                                <button class="hint-btn-screen" onclick="BarberKiosk.showHintButtonClick()" style="
                                padding: 15px 20px;
                                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                                border: none;
                                border-radius: 12px;
                                color: white;
                                font-size: 18px;
                                font-weight: 700;
                                cursor: pointer;
                                box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
                                transition: all 0.3s ease;
                                writing-mode: vertical-rl;
                                text-orientation: upright;
                            "
                            onmouseover="this.style.boxShadow='0 6px 20px rgba(251, 191, 36, 0.6)'; this.style.transform='scale(1.05)'"
                            onmouseout="this.style.boxShadow='0 4px 15px rgba(251, 191, 36, 0.4)'; this.style.transform=''">
                                💡提示
                            </button>
                            </div>
                        ` : ''}
                        <div class="screen-content" id="screen-content">
                            ${this.serviceSelectionScreen(services)}
                        </div>
                    </div>
                `;
            },

            welcomeScreen() {
                return `
                    <div class="welcome-screen slide-in-bottom">
                        <h2>🏪 歡迎光臨百元理髮店</h2>
                        <p>請點選您需要的服務項目</p>
                        <div class="progress-indicator">
                            <div class="progress-step active"></div>
                            <div class="progress-step"></div>
                            <div class="progress-step"></div>
                            <div class="progress-step"></div>
                        </div>
                        <div class="action-buttons">
                            <button class="action-btn" onclick="BarberKiosk.showServiceSelection()">
                                開始選擇服務
                            </button>
                        </div>
                    </div>
                `;
            },

            serviceSelectionScreen(services) {
                // 所有模式都不使用滑入動畫，直接顯示
                const animationClass = '';
                return `
                    <div class="service-selection-screen ${animationClass}">
                        <div class="money-display-in-screen" id="money-display-in-screen">
                            <div class="money-amount">NT$ <span id="inserted-amount-screen">0</span></div>
                            <div class="money-needed">還需要: NT$ <span id="needed-amount-screen">0</span></div>
                            <div class="money-status" id="money-status-screen">請選擇服務項目</div>
                        </div>
                        <div class="service-grid">
                            ${services.map(service => `
                                <div class="service-item-wrapper ${BarberKiosk.isCoinFirstMode() ? 'coin-first-locked-wrapper' : ''}">
                                    <div class="service-indicator" data-service-id="${service.id}">
                                        <div class="indicator-light"></div>
                                    </div>
                                    <div class="service-item ${BarberKiosk.isCoinFirstMode() ? 'coin-first-locked' : ''}" onclick="BarberKiosk.selectService('${service.id}')"
                                         data-service-id="${service.id}" data-price="${service.price}">
                                        <div class="service-icon"><img src="${service.icon}" alt="${service.name}" class="service-image"></div>
                                        <div class="service-name">${service.name}</div>
                                        <div class="service-price">NT$ ${service.price}</div>
                                        <div class="service-description">${service.description}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            },

            paymentScreen(service) {
                return `
                    <div class="payment-screen slide-in-right">
                        <h2>💰 請投入金額</h2>
                        <div class="progress-indicator">
                            <div class="progress-step completed"></div>
                            <div class="progress-step completed"></div>
                            <div class="progress-step active"></div>
                            <div class="progress-step"></div>
                        </div>
                        <div class="selected-service">
                            <div class="service-icon">${service.icon}</div>
                            <div class="service-name">${service.name}</div>
                            <div class="service-price">NT$ ${service.price}</div>
                        </div>
                        <div class="warning-message">
                            ⚠️ 本機不找零，請投入正確金額
                        </div>
                        <div class="info-message">
                            請使用左側投幣口投入 NT$ ${service.price}
                        </div>
                        <div class="action-buttons">
                            <button class="action-btn secondary" onclick="BarberKiosk.cancelPayment()">
                                取消付款
                            </button>
                        </div>
                    </div>
                `;
            },

            completionScreen(service, queueNumber) {
                return `
                    <div class="completion-screen slide-in-bottom">
                        <h2>✅ 付款完成</h2>
                        <div class="progress-indicator">
                            <div class="progress-step completed"></div>
                            <div class="progress-step completed"></div>
                            <div class="progress-step completed"></div>
                            <div class="progress-step completed"></div>
                        </div>
                        <div class="success-message">
                            感謝您的付款！正在列印票據...
                        </div>
                        <div class="queue-info">
                            <div class="queue-number">${queueNumber}</div>
                            <div class="queue-label">您的號碼</div>
                        </div>
                        <div class="action-buttons">
                            <button class="action-btn success" onclick="BarberKiosk.takeTicket()">
                                取走票據
                            </button>
                            <button class="action-btn secondary" onclick="BarberKiosk.startOver()">
                                重新開始
                            </button>
                        </div>
                    </div>
                `;
            },

            ticketTemplate(service, queueNumber) {
                const now = new Date();
                const dateStr = now.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
                const timeStr = now.toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                // 生成簡單的一維條碼
                const barcode = this.generateBarcode(queueNumber);

                return `
                    <div class="ticket-header">
                        <h3>✂️ 百元理髮店</h3>
                        <div class="shop-logo">🏪</div>
                        <div class="shop-info">專業理髮 | 價格實在 | 服務到家</div>
                        <div class="shop-address">台灣理髮店聯盟認證店家</div>
                    </div>
                    <div class="ticket-body">
                        <div class="service-section">
                            <div class="service-title">📋 服務明細</div>
                            <div class="service-details">
                                <div class="detail-row">
                                    <span class="detail-label">服務項目：</span>
                                    <span class="detail-value">${service.name}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">服務圖示：</span>
                                    <span class="detail-value">${service.icon}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">服務金額：</span>
                                    <span class="detail-value price">NT$ ${service.price}</span>
                                </div>
                            </div>
                        </div>

                        <div class="queue-section">
                            <div class="queue-title">🎫 排隊資訊</div>
                            <div class="queue-number-display">
                                <div class="queue-label">您的號碼</div>
                                <div class="queue-number-big">${String(queueNumber).padStart(2, '0')}</div>
                            </div>
                        </div>

                        <div class="barcode-section">
                            <div class="ticket-barcode">
                                ${barcode}
                            </div>
                            <div class="barcode-number">
                                NO. ${String(queueNumber).padStart(4, '0')}
                            </div>
                        </div>

                        <div class="notes-section">
                            <div class="important-notes">
                                <div class="note-title">⚠️ 重要提醒</div>
                                <div class="note-list">
                                    • 請依號碼順序等候<br>
                                    • 本券限當日使用，隔日作廢<br>
                                    • 請保管好您的號碼牌<br>
                                    • 如有問題請洽櫃檯人員
                                </div>
                            </div>
                        </div>

                        <div class="ticket-footer">
                            <div class="print-info">
                                <div class="print-date">列印日期：${dateStr}</div>
                                <div class="print-time">列印時間：${timeStr}</div>
                            </div>
                            <div class="machine-info">
                                機器編號：K001 | 版本：A2-V1.0
                            </div>
                        </div>
                    </div>
                `;
            },

            moneySelectionModal(type) {
                const title = type === 'bill' ? '💵 選擇紙鈔' : '🪙 選擇硬幣';
                const instructionText = type === 'bill' ? '請投入紙鈔，點擊紙鈔進行投入' : '請投入硬幣，點擊硬幣進行投入';

                // 取得已投入和需要金額
                const insertedAmount = BarberKiosk.state.gameState.insertedAmount || 0;
                // coinFirst 模式：顯示指定服務價格，而非超投保護上限（maxPrice）
                let requiredAmount = BarberKiosk.state.gameState.requiredAmount || 0;
                if (BarberKiosk.isCoinFirstMode()) {
                    const _assignedSvc = BarberKiosk.state.gameState.easyMode?.assignedService
                        || BarberKiosk.state.gameState.normalMode?.assignedService;
                    if (_assignedSvc) requiredAmount = _assignedSvc.price;
                }

                // 判斷是否為普通/困難模式
                const isNormalOrHardMode = BarberKiosk.state.settings.difficulty !== 'easy';

                // 簡單模式：顯示錢包中所有的紙鈔/硬幣（每張/每個都顯示）
                let itemsHTML = '';
                if (BarberKiosk.state.settings.difficulty === 'easy' && BarberKiosk.state.gameState.easyMode.walletCoins) {
                    const walletCoins = BarberKiosk.state.gameState.easyMode.walletCoins;
                    const availableItems = type === 'bill' ? walletCoins.bills : walletCoins.coins;
                    let correctAmounts = BarberKiosk.state.gameState.easyMode.correctAmounts;

                    // 🔧 [修復] 如果 correctAmounts 未被初始化，則立即初始化
                    // 這解決了選擇服務後直接打開彈窗時 correctAmounts 為空的問題
                    if (!correctAmounts || correctAmounts.length === 0) {
                        correctAmounts = [];
                        if (walletCoins.bills && walletCoins.bills.length > 0) {
                            correctAmounts.push(...walletCoins.bills);
                        }
                        if (walletCoins.coins && walletCoins.coins.length > 0) {
                            correctAmounts.push(...walletCoins.coins);
                        }
                        BarberKiosk.state.gameState.easyMode.correctAmounts = correctAmounts;
                        BarberKiosk.Debug.log('ui', ' 初始化 correctAmounts:', correctAmounts);
                    }

                    // 如果有正確金額組合，建立一個可用次數的映射
                    let correctCountMap = {};
                    if (correctAmounts && correctAmounts.length > 0) {
                        BarberKiosk.Debug.log('coin', ' 正確金額組合:', correctAmounts, '類型:', type);
                        correctAmounts.forEach(amount => {
                            correctCountMap[amount] = (correctCountMap[amount] || 0) + 1;
                        });
                        BarberKiosk.Debug.log('coin', ' 正確金額計數映射:', correctCountMap);
                    }

                    // 為每個紙鈔/硬幣生成單獨的卡片
                    itemsHTML = availableItems.map((value, index) => {
                        const icon = BarberKiosk.getRandomMoneyImage(value); // 🆕 使用隨機正反面
                        const name = type === 'bill' ? `${value}元紙鈔` : `${value}元硬幣`;
                        const uniqueId = `money-${type}-${value}-${index}`;

                        // 判斷這個金額是否在正確組合中
                        let isCorrect = false;
                        if (correctCountMap[value] && correctCountMap[value] > 0) {
                            isCorrect = true;
                            correctCountMap[value]--;
                            BarberKiosk.Debug.log('coin', ' 標記為正確:', value, 'index:', index);
                        }

                        // 加上正確金額的特殊樣式
                        const correctClass = isCorrect ? ' correct-money-hint' : '';

                        return `
                            <div class="individual-money-item money-type-${type}${correctClass}" id="${uniqueId}" onclick="BarberKiosk.selectMoney(${value}, '${type}', ${index})" data-value="${value}">
                                <div class="money-icon">
                                    <img src="${icon}" alt="${name}" class="money-image"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                    <div style="display:none; font-size:2.5em;">${type === 'bill' ? '💵' : '🪙'}</div>
                                </div>
                                <div class="money-label">${value} 元</div>
                            </div>
                        `;
                    }).join('');
                } else {
                    // 普通/困難模式：顯示錢包中的紙鈔/硬幣
                    const normalModeWallet = BarberKiosk.state.gameState.normalMode.walletCoins;
                    const correctAmounts = BarberKiosk.state.gameState.normalMode.correctAmounts;

                    if (normalModeWallet) {
                        const availableItems = type === 'bill' ? normalModeWallet.bills : normalModeWallet.coins;

                        // ★★★ 如果有正確金額組合，建立一個可用次數的映射 ★★★
                        let correctCountMap = {};
                        if (correctAmounts && correctAmounts.length > 0) {
                            BarberKiosk.Debug.log('coin', ' 正確金額組合:', correctAmounts, '類型:', type);
                            correctAmounts.forEach(amount => {
                                correctCountMap[amount] = (correctCountMap[amount] || 0) + 1;
                            });
                            BarberKiosk.Debug.log('coin', ' 正確金額計數映射:', correctCountMap);
                        }

                        BarberKiosk.Debug.log('coin', ' 可用物品 (type=' + type + '):', availableItems);

                        itemsHTML = availableItems.map((value, index) => {
                            const icon = BarberKiosk.getRandomMoneyImage(value); // 🆕 使用隨機正反面
                            const name = type === 'bill' ? `${value}元紙鈔` : `${value}元硬幣`;
                            const uniqueId = `money-${type}-${value}-${index}`;

                            // ★★★ 判斷這個金額是否在正確組合中 ★★★
                            let isCorrect = false;
                            if (correctCountMap[value] && correctCountMap[value] > 0) {
                                isCorrect = true;
                                correctCountMap[value]--;
                                BarberKiosk.Debug.log('coin', ' 標記為正確:', value, 'index:', index);
                            }

                            // 加上正確金額的特殊樣式
                            const correctClass = isCorrect ? ' correct-money-hint' : '';

                            return `
                                <div class="individual-money-item money-type-${type}${correctClass}" id="${uniqueId}" onclick="BarberKiosk.selectMoneyNormalMode(${value}, '${type}', ${index})" data-value="${value}">
                                    <div class="money-icon">
                                        <img src="${icon}" alt="${name}" class="money-image"
                                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                        <div style="display:none; font-size:2.5em;">${type === 'bill' ? '💵' : '🪙'}</div>
                                    </div>
                                    <div class="money-label">${value} 元</div>
                                </div>
                            `;
                        }).join('');
                    }
                }

                // 普通/困難模式：添加確認和取消按鈕
                const confirmButtonHTML = isNormalOrHardMode ? `
                    <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: center;">
                        <button class="cancel-payment-btn" onclick="BarberKiosk.cancelMoneySelection()" style="
                            flex: 0 0 140px;
                            padding: 15px;
                            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                            border: none;
                            border-radius: 12px;
                            color: white;
                            font-size: 18px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">
                            ✕ 取消
                        </button>
                        <button class="confirm-payment-btn" onclick="BarberKiosk.confirmMoneySelection('${type}')" style="
                            flex: 0 0 140px;
                            padding: 15px;
                            background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
                            border: none;
                            border-radius: 12px;
                            color: white;
                            font-size: 18px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">
                            ✓ 確認
                        </button>
                    </div>
                ` : '';

                return `
                    <div id="money-selection-modal" class="money-selection-modal">
                        <div class="modal-overlay"></div>
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>${title}</h3>
                            </div>
                            <div class="modal-instruction">
                                <p>${instructionText}</p>
                            </div>
                            <div class="modal-body">
                                <div class="money-grid">
                                    ${itemsHTML}
                                </div>
                            </div>
                            <div class="modal-footer">
                                <div class="payment-status">
                                    <div class="status-item">
                                        <span class="status-label">已投入：</span>
                                        <span class="status-value" id="modal-inserted-amount">${insertedAmount}</span>
                                        <span class="status-unit">元</span>
                                    </div>
                                    <div class="status-divider">/</div>
                                    <div class="status-item">
                                        <span class="status-label">需要：</span>
                                        <span class="status-value" id="modal-required-amount">${requiredAmount}</span>
                                        <span class="status-unit">元</span>
                                    </div>
                                </div>
                                ${confirmButtonHTML}
                            </div>
                        </div>
                    </div>
                `;
            },

            // 普通/困難模式：統一錢包式付款彈窗（紙鈔+硬幣同時顯示，依入口決定哪區可點）
            walletPaymentModal(activeType) {
                const wallet = BarberKiosk.state.gameState.normalMode.walletCoins;
                const correctAmounts = BarberKiosk.state.gameState.normalMode.correctAmounts;
                const insertedAmount = BarberKiosk.state.gameState.insertedAmount || 0;
                const hintShown = BarberKiosk.state.gameState.normalMode.hintShown;

                // 需要金額（coinFirst 用指定服務價格，否則用 requiredAmount）
                let requiredAmount = BarberKiosk.state.gameState.requiredAmount || 0;
                if (BarberKiosk.isCoinFirstMode()) {
                    const _svc = BarberKiosk.state.gameState.normalMode?.assignedService;
                    if (_svc) requiredAmount = _svc.price;
                }

                // 分別為紙鈔/硬幣建立正確金額計數映射
                const billCorrectMap = {};
                const coinCorrectMap = {};
                if (correctAmounts && correctAmounts.length > 0) {
                    correctAmounts.forEach(amount => {
                        if (amount >= 100) billCorrectMap[amount] = (billCorrectMap[amount] || 0) + 1;
                        else coinCorrectMap[amount] = (coinCorrectMap[amount] || 0) + 1;
                    });
                }

                const buildItems = (items, type, cMap) => {
                    if (!items || items.length === 0) {
                        return `<div style="color:#94a3b8;font-size:13px;padding:8px 4px;">（無${type === 'bill' ? '紙鈔' : '硬幣'}）</div>`;
                    }
                    return items.map((value, index) => {
                        const icon = BarberKiosk.getRandomMoneyImage(value);
                        const name = type === 'bill' ? `${value}元紙鈔` : `${value}元硬幣`;
                        const uniqueId = `money-${type}-${value}-${index}`;
                        let isCorrect = false;
                        if (cMap[value] && cMap[value] > 0) { isCorrect = true; cMap[value]--; }
                        const correctClass = isCorrect ? ' correct-money-hint' : '';
                        return `
                            <div class="individual-money-item money-type-${type}${correctClass}" id="${uniqueId}" onclick="BarberKiosk.selectMoneyNormalMode(${value}, '${type}', ${index})" data-value="${value}">
                                <div class="money-icon">
                                    <img src="${icon}" alt="${name}" class="money-image" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
                                    <div style="display:none;font-size:2.5em;">${type === 'bill' ? '💵' : '🪙'}</div>
                                </div>
                                <div class="money-label">${value} 元</div>
                            </div>`;
                    }).join('');
                };

                const bills = wallet ? wallet.bills : [];
                const coins = wallet ? wallet.coins : [];
                const billsHTML = buildItems(bills, 'bill', billCorrectMap);
                const coinsHTML = buildItems(coins, 'coin', coinCorrectMap);

                return `
                    <div id="money-selection-modal" class="money-selection-modal">
                        <div class="modal-overlay"></div>
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>💰 投入金額</h3>
                            </div>
                            <div class="modal-instruction">
                                <p>${activeType === 'bill' ? '請選擇要投入的紙鈔' : '請選擇要投入的硬幣'}</p>
                            </div>
                            <div class="modal-body">
                                <div class="wp-section ${activeType === 'bill' ? '' : 'inactive'}">
                                    <div class="wp-section-title">💵 紙鈔</div>
                                    <div class="money-grid">${billsHTML}</div>
                                </div>
                                <div class="wp-section ${activeType === 'coin' ? '' : 'inactive'}">
                                    <div class="wp-section-title">🪙 硬幣</div>
                                    <div class="money-grid">${coinsHTML}</div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <div class="payment-status">
                                    <div class="status-item">
                                        <span class="status-label">已投入：</span>
                                        <span class="status-value" id="modal-inserted-amount">${insertedAmount}</span>
                                        <span class="status-unit">元</span>
                                    </div>
                                    <div class="status-divider">/</div>
                                    <div class="status-item">
                                        <span class="status-label">需要：</span>
                                        <span class="status-value" id="modal-required-amount">${requiredAmount}</span>
                                        <span class="status-unit">元</span>
                                    </div>
                                </div>
                                <div style="display:flex;gap:10px;margin-top:15px;justify-content:center;">
                                    ${!hintShown ? `<button class="cancel-payment-btn" onclick="BarberKiosk.cancelMoneySelection()" style="flex:0 0 140px;padding:15px;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);border:none;border-radius:12px;color:white;font-size:18px;font-weight:600;cursor:pointer;">✕ 取消</button>` : ''}
                                    <button class="confirm-payment-btn" onclick="BarberKiosk.confirmMoneySelection('${activeType}')" style="flex:0 0 140px;padding:15px;background:linear-gradient(135deg,#4ade80 0%,#22c55e 100%);border:none;border-radius:12px;color:white;font-size:18px;font-weight:600;cursor:pointer;">✓ 確認</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            },

            generateBarcode(number) {
                // 生成簡單的一維條碼樣式
                const patterns = ['|||', '||| ', '|| |', '| ||', ' |||', '| | |', '||  ', ' || ', '  ||'];
                let barcode = '';
                const numStr = String(number).padStart(3, '0');

                for (let i = 0; i < numStr.length; i++) {
                    const digit = parseInt(numStr[i]);
                    barcode += patterns[digit] + ' ';
                }

                return barcode.trim();
            }
        },

        // =====================================================
        // 輕量通知（取代 alert）
        // =====================================================
        showToast(message, type = 'warning') {
            const existing = document.getElementById('a2-toast');
            if (existing) existing.remove();

            const colors = {
                warning: { bg: '#ff9800', text: '#fff' },
                success: { bg: '#4caf50', text: '#fff' },
                error: { bg: '#f44336', text: '#fff' }
            };
            const color = colors[type] || colors.warning;

            const toast = document.createElement('div');
            toast.id = 'a2-toast';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                background: ${color.bg}; color: ${color.text};
                padding: 12px 24px; border-radius: 10px; font-size: 15px; font-weight: bold;
                z-index: 99999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                opacity: 0; transition: opacity 0.3s ease; max-width: 90vw; text-align: center;
                white-space: pre-line;
            `;
            document.body.appendChild(toast);

            requestAnimationFrame(() => { toast.style.opacity = '1'; });

            this.TimerManager.setTimeout(() => {
                toast.style.opacity = '0';
                this.TimerManager.setTimeout(() => toast.remove(), 300, 'uiAnimation');
            }, 2000, 'uiAnimation');
        },

        // =====================================================
        // 設定頁面
        // =====================================================
        showSettings() {
            this._completionScreenShown = false;
            const app = document.getElementById('app');
            const s = this.state.settings;

            // 🆕 清理計時器和事件監聽器
            this.TimerManager.clearAll();
            this.EventManager.removeByCategory('gameUI');
            if (window.TutorContext) {
                TutorContext.update({ screen: 'settings' });
                TutorContext.getLiveData = null;
            }

            // 解鎖設定頁面滾動（A4 架構：只操作 #app）
            app.style.overflowY = 'auto';
            app.style.height = '100%';

            // ★★★ 重置遊戲狀態（特別是 ticketPrinted）★★★
            this.state.gameState.ticketPrinted = false;
            this.state.gameState.selectedService = null;
            this.state.gameState.paymentComplete = false;
            this.state.gameState.insertedAmount = 0;
            this.state.gameState.requiredAmount = 0;
            BarberKiosk.Debug.log('state', ' 重置遊戲狀態，ticketPrinted = false');

            // 清除輔助點擊模式的全局事件和 interval
            this.unbindClickModeHandler();

            app.innerHTML = `
                <div class="unit-welcome">
                    <div class="welcome-content">
                        <div class="settings-title-row">
                            <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                            <h1>單元A2：理髮店售票機</h1>
                        </div>
                        <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">體驗理髮店售票機操作，學習選擇理髮服務與投幣付款的流程</p>

                        <div class="game-settings">

                            <div class="setting-group">
                                <label>🎯 選擇難度：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${s.difficulty === 'easy' ? 'active' : ''}"
                                            data-type="difficulty" data-value="easy">
                                        簡單
                                    </button>
                                    <button class="selection-btn ${s.difficulty === 'normal' ? 'active' : ''}"
                                            data-type="difficulty" data-value="normal">
                                        普通
                                    </button>
                                    <button class="selection-btn ${s.difficulty === 'hard' ? 'active' : ''}"
                                            data-type="difficulty" data-value="hard">
                                        困難
                                    </button>
                                </div>
                                <div id="difficulty-description" class="setting-description" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 0.95em; color: #666; text-align: left;">
                                    ${this.getDifficultyDescription(s.difficulty)}
                                </div>
                            </div>


                            <div class="setting-group" style="background: #fff3cd; padding: 15px; border-radius: 10px; border: 2px solid #ffcc02; ${s.difficulty === 'easy' ? '' : 'display: none;'}">
                                <label style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 1.2em;">♿</span>
                                    <span>輔助點擊模式（單鍵操作）：</span>
                                </label>
                                <p style="font-size: 0.9em; color: #666; margin: 8px 0 12px 0; line-height: 1.5;">
                                    啟用後，只要偵測到點擊，系統會自動依序完成選擇服務、付款、找零等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                    <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式 + 指定服務」</strong>
                                </p>
                                <div class="button-group">
                                    <button class="selection-btn ${s.clickMode === true ? 'active' : ''}"
                                            data-type="clickMode" data-value="true">
                                        ✓ 啟用
                                    </button>
                                    <button class="selection-btn ${s.clickMode === false || s.clickMode === undefined ? 'active' : ''}"
                                            data-type="clickMode" data-value="false">
                                        ✗ 停用
                                    </button>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label>📋 任務類型：</label>
                                <div class="button-group" style="flex-direction:column;gap:6px;">
                                    <!-- 先投幣再選服務 -->
                                    <div style="font-size:0.8em;color:#888;font-weight:600;padding:2px 4px;margin-top:2px;${s.difficulty==='easy'?'display:none;':''}">💰 先投幣再選服務</div>
                                    <div class="button-group" style="${s.difficulty==='easy'?'display:none !important;':''}">
                                        <button class="selection-btn ${s.taskType === 'coinFirstAssigned' ? 'active' : ''}"
                                                data-type="taskType" data-value="coinFirstAssigned">
                                            指定任務
                                        </button>
                                        <button class="selection-btn ${s.taskType === 'coinFirstFree' ? 'active' : ''}"
                                                data-type="taskType" data-value="coinFirstFree">
                                            自選服務
                                        </button>
                                    </div>
                                    <!-- 先選服務再投幣 -->
                                    <div style="font-size:0.8em;color:#888;font-weight:600;padding:2px 4px;margin-top:4px;${s.difficulty==='easy'?'display:none;':''}">✂️ 先選服務再投幣</div>
                                    <div class="button-group" style="${s.difficulty==='easy'?'display:none !important;':''}">
                                        <button class="selection-btn ${s.taskType === 'assigned' ? 'active' : ''}"
                                                data-type="taskType" data-value="assigned">
                                            指定任務
                                        </button>
                                        <button class="selection-btn ${s.taskType === 'freeChoice' ? 'active' : ''}"
                                                data-type="taskType" data-value="freeChoice">
                                            自選服務
                                        </button>
                                    </div>
                                </div>
                                <div class="setting-description" style="margin-top:8px;padding:8px 10px;background:#f8f9fa;border-radius:8px;font-size:0.9em;color:#666;text-align:left;">
                                    ${{
                                        assigned: '先選擇要購買的服務，系統隨機指定項目，再投幣付款',
                                        freeChoice: '先自由選擇服務項目，再投幣付款',
                                        coinFirstAssigned: '先投幣/鈔，投入指定服務金額後燈號亮起，再選指定服務',
                                        coinFirstFree: '先投幣/鈔，投入等於服務金額後燈號亮起，可自由選擇'
                                    }[s.taskType] || '請選擇任務類型'}
                                </div>
                            </div>

                            <div class="setting-group">
                                <label><img src="../images/common/icons_wallet.png" alt="💰" style="width:1em;height:1em;vertical-align:middle;margin-right:2px;" onerror="this.outerHTML='💰'"> 錢包選項：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${s.walletType === 'default' ? 'active' : ''}"
                                            data-type="walletType" data-value="default"
                                            style="${(s.taskType === 'freeChoice' || s.taskType === 'coinFirstFree') ? 'display: none;' : ''}">
                                        預設
                                    </button>
                                    <button class="selection-btn ${s.walletType === 'fixed500' ? 'active' : ''}"
                                            data-type="walletType" data-value="fixed500"
                                            style="${(s.taskType !== 'freeChoice' && s.taskType !== 'coinFirstFree') ? 'display: none;' : ''}">
                                        500元
                                    </button>
                                    <button class="selection-btn ${s.walletType === 'fixed1000' ? 'active' : ''}"
                                            data-type="walletType" data-value="fixed1000"
                                            style="${(s.taskType !== 'freeChoice' && s.taskType !== 'coinFirstFree') ? 'display: none;' : ''}">
                                        1000元
                                    </button>
                                    <button class="selection-btn ${s.walletType === 'custom' ? 'active' : ''}"
                                            data-type="walletType" data-value="custom"
                                            style="${(s.taskType !== 'freeChoice' && s.taskType !== 'coinFirstFree') ? 'display: none;' : ''}">
                                        ${s.walletType === 'custom' && s.walletAmount ? s.walletAmount + '元（自訂）' : '自訂金額'}
                                    </button>
                                </div>
                            </div>

                            <div class="setting-group">
                                <label>📊 測驗題數：</label>
                                <div class="button-group">
                                    <button class="selection-btn ${s.questionCount === 1 ? 'active' : ''}"
                                            data-type="questionCount" data-value="1">
                                        1 題
                                    </button>
                                    <button class="selection-btn ${s.questionCount === 3 ? 'active' : ''}"
                                            data-type="questionCount" data-value="3">
                                        3 題
                                    </button>
                                    <button class="selection-btn ${s.questionCount === 5 ? 'active' : ''}"
                                            data-type="questionCount" data-value="5">
                                        5 題
                                    </button>
                                    <button class="selection-btn ${s.questionCount === 10 ? 'active' : ''}"
                                            data-type="questionCount" data-value="10">
                                        10 題
                                    </button>
                                    <button class="selection-btn ${s.questionCount !== null && ![1,3,5,10].includes(s.questionCount) ? 'active' : ''}"
                                            data-type="questionCount" data-value="custom">
                                        自訂
                                    </button>
                                </div>
                                <div class="custom-question-display" style="display: ${s.questionCount !== null && ![1,3,5,10].includes(s.questionCount) ? 'block' : 'none'}; margin-top: 10px;">
                                    <input type="text" id="custom-question-count-a2"
                                           value="${s.questionCount !== null && ![1,3,5,10].includes(s.questionCount) ? s.questionCount + '題' : ''}"
                                           placeholder="請輸入題數"
                                           style="padding: 8px; border-radius: 5px; border: 2px solid ${s.questionCount !== null && ![1,3,5,10].includes(s.questionCount) ? '#667eea' : '#ddd'}; background: ${s.questionCount !== null && ![1,3,5,10].includes(s.questionCount) ? '#667eea' : 'white'}; color: ${s.questionCount !== null && ![1,3,5,10].includes(s.questionCount) ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                                           readonly onclick="BarberKiosk.handleCustomQuestionClick()">
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

                            <div class="game-buttons">
                                <button class="back-to-main-btn"
                                        onclick="BarberKiosk.backToMainMenu()"
                                        aria-label="返回主畫面">
                                    返回主畫面
                                </button>
                                ${this.isSettingsComplete()
                                    ? `<button class="start-btn" onclick="BarberKiosk.startGame()" aria-label="開始遊戲">開始測驗</button>`
                                    : `<button class="start-btn disabled" disabled aria-label="開始遊戲">請完成所有設定選項</button>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 綁定設定按鈕事件
            this.bindSettingEvents();
        },

        // 綁定設定按鈕事件
        bindSettingEvents() {
            this.EventManager.removeByCategory('settings');
            document.querySelectorAll('.selection-btn').forEach(btn => {
                this.EventManager.on(btn, 'click', (e) => {
                    // 🆕 檢查 disabled 狀態
                    if (e.target.classList.contains('disabled')) {
                        return;
                    }

                    const type = e.target.dataset.type;
                    const value = e.target.dataset.value;

                    if (type && value) {
                        this.audio.playSound('beep');

                        // 特殊處理自訂題數
                        if (type === 'questionCount' && value === 'custom') {
                            this.showQuestionCountNumberInput();
                            return;
                        }

                        // 特殊處理自訂金額
                        if (type === 'walletType' && value === 'custom') {
                            this.showCustomWalletModal();
                            return;
                        }
                        // 更新設定
                        let actualValue = value;
                        if (type === 'questionCount') {
                            actualValue = parseInt(value);
                        }
                        this.updateSetting(type, actualValue);

                        // 更新按鈕狀態
                        const group = e.target.closest('.button-group');
                        group.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                        // taskType 按鈕分兩個 .button-group，需跨群組清除
                        if (type === 'taskType') {
                            document.querySelectorAll('[data-type="taskType"]').forEach(b => b.classList.remove('active'));
                        }
                        e.target.classList.add('active');

                    }
                }, {}, 'settings');
            });

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
                }, {}, 'settings');
            }

            // 📝 作業單連結事件
            const worksheetLink = document.getElementById('settings-worksheet-link');
            if (worksheetLink) {
                this.EventManager.on(worksheetLink, 'click', (e) => {
                    e.preventDefault();
                    // 作業單使用自己的預設值與工具列設定，不受遊戲設定影響
                    const params = new URLSearchParams({ unit: 'a2' });
                    window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
                }, {}, 'settings');
            }


        },

        // 檢查設定是否完整
        isSettingsComplete() {
            const s = this.state.settings;
            return s.difficulty && s.walletType && s.taskType && s.questionCount;
        },

        isCoinFirstMode() {
            const t = this.state.settings.taskType;
            return t === 'coinFirstAssigned' || t === 'coinFirstFree';
        },

        // 🔧 [新增] 取得難度說明
        getDifficultyDescription(difficulty) {
            const descriptions = {
                'easy': '簡單：系統會有視覺、語音提示，引導每個步驟。',
                'normal': '普通：自己完成操作，錯誤3次會自動提示。',
                'hard': '困難：自己完成操作，沒有自動提示。'
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

        // 更新設定
        updateSetting(key, value) {
            // 特殊處理 clickMode（轉換為布林值）
            if (key === 'clickMode') {
                const isEnabled = (value === 'true' || value === true);
                this.state.settings[key] = isEnabled;

                // 🔧 輔助點擊模式自動預設為指定服務
                if (isEnabled && this.state.settings.taskType !== 'assigned') {
                    this.state.settings.taskType = 'assigned';
                    document.querySelectorAll('[data-type="taskType"]').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.value === 'assigned');
                    });
                    BarberKiosk.Debug.log('assist', ' 輔助點擊模式：自動切換為指定服務');
                }

                // 🆕 clickMode 變更時更新「自選服務」按鈕的 disabled 狀態
                const freeChoiceBtn = document.querySelector('[data-type="taskType"][data-value="freeChoice"]');
                if (freeChoiceBtn) {
                    if (isEnabled) {
                        freeChoiceBtn.classList.add('disabled');
                    } else {
                        freeChoiceBtn.classList.remove('disabled');
                    }
                }
            } else {
                this.state.settings[key] = value;
            }

            // 如果選擇簡單模式，顯示任務類型選項
            if (key === 'difficulty' && value === 'easy') {
                // 顯示任務類型選項（指定任務和自選服務）；coinFirstFree 在簡單模式下隱藏
                const taskButtons = document.querySelectorAll('[data-type="taskType"]');
                taskButtons.forEach(btn => {
                    btn.style.display = btn.dataset.value === 'coinFirstFree' ? 'none' : '';
                });

                // 若當前選擇的是 coinFirstFree，簡單模式下自動切換為 coinFirstAssigned
                if (this.state.settings.taskType === 'coinFirstFree') {
                    this.state.settings.taskType = 'coinFirstAssigned';
                    taskButtons.forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.value === 'coinFirstAssigned');
                    });
                }

                // 根據當前任務類型顯示對應的錢包選項（如果有選擇的話）
                if (this.state.settings.taskType) {
                    this.updateWalletOptionsDisplay();
                }

                // 顯示輔助點擊模式選項（透過移除 display:none）
                const clickModeGroup = document.querySelector('[data-type="clickMode"]')?.closest('.setting-group');
                if (clickModeGroup) {
                    clickModeGroup.style.display = '';
                }

                // 🆕 根據當前 taskType 和 clickMode 更新 disabled 狀態
                this.updateClickModeDisabledState();


                // 🔧 [新增] 更新難度說明
                this.updateDifficultyDescription(value);
            }
            // 如果選擇普通或困難模式，顯示任務類型和錢包選項
            else if (key === 'difficulty' && (value === 'normal' || value === 'hard')) {
                // 顯示任務類型選項（指定任務和自選服務）
                const taskButtons = document.querySelectorAll('[data-type="taskType"]');
                taskButtons.forEach(btn => {
                    btn.style.display = '';
                });

                // 根據當前任務類型顯示對應的錢包選項（如果有選擇的話）
                if (this.state.settings.taskType) {
                    this.updateWalletOptionsDisplay();
                }

                // 隱藏輔助點擊模式選項並重置為 false（普通/困難模式不支援）
                const clickModeGroup = document.querySelector('[data-type="clickMode"]')?.closest('.setting-group');
                if (clickModeGroup) {
                    clickModeGroup.style.display = 'none';
                }
                this.state.settings.clickMode = false;


                // 🔧 [新增] 更新難度說明
                this.updateDifficultyDescription(value);
            }
            // 如果選擇指定任務，自動設定為預設錢包
            else if (key === 'taskType' && value === 'assigned') {
                this.state.settings.walletType = 'default';
                const walletButtons = document.querySelectorAll('[data-type="walletType"]');
                walletButtons.forEach(btn => {
                    if (btn.dataset.value === 'default') {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
                this.updateWalletOptionsDisplay();

                // 🆕 指定任務：移除輔助點擊「啟用」的 disabled
                const clickModeEnableBtn = document.querySelector('[data-type="clickMode"][data-value="true"]');
                if (clickModeEnableBtn) {
                    clickModeEnableBtn.classList.remove('disabled');
                }
            }
            // 如果選擇自選服務，清除預設錢包選擇（但不自動選其他選項）
            else if (key === 'taskType' && value === 'freeChoice') {
                if (this.state.settings.walletType === 'default') {
                    // 清除預設錢包的選擇
                    this.state.settings.walletType = null;
                    const walletButtons = document.querySelectorAll('[data-type="walletType"]');
                    walletButtons.forEach(btn => {
                        btn.classList.remove('active');
                    });
                }
                this.updateWalletOptionsDisplay();

                // 🆕 自選服務：重置 clickMode 為 false 並將「啟用」設為 disabled
                this.state.settings.clickMode = false;
                const clickModeButtons = document.querySelectorAll('[data-type="clickMode"]');
                clickModeButtons.forEach(btn => {
                    if (btn.dataset.value === 'false') {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
                const clickModeEnableBtn = document.querySelector('[data-type="clickMode"][data-value="true"]');
                if (clickModeEnableBtn) {
                    clickModeEnableBtn.classList.add('disabled');
                }
            }
            // 先投幣再選服務（指定）：自動設定為預設錢包
            else if (key === 'taskType' && value === 'coinFirstAssigned') {
                this.state.settings.walletType = 'default';
                const walletButtons = document.querySelectorAll('[data-type="walletType"]');
                walletButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === 'default');
                });
                this.updateWalletOptionsDisplay();
                // coinFirst 不支援輔助點擊
                this.state.settings.clickMode = false;
                document.querySelectorAll('[data-type="clickMode"]').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === 'false');
                });
                const cfAssignEnableBtn = document.querySelector('[data-type="clickMode"][data-value="true"]');
                if (cfAssignEnableBtn) cfAssignEnableBtn.classList.add('disabled');
            }
            // 先投幣再選服務（自選）：清除預設錢包
            else if (key === 'taskType' && value === 'coinFirstFree') {
                if (this.state.settings.walletType === 'default') {
                    this.state.settings.walletType = null;
                    document.querySelectorAll('[data-type="walletType"]').forEach(btn => btn.classList.remove('active'));
                }
                this.updateWalletOptionsDisplay();
                // coinFirst 不支援輔助點擊
                this.state.settings.clickMode = false;
                document.querySelectorAll('[data-type="clickMode"]').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.value === 'false');
                });
                const cfFreeEnableBtn = document.querySelector('[data-type="clickMode"][data-value="true"]');
                if (cfFreeEnableBtn) cfFreeEnableBtn.classList.add('disabled');
            }
            // 如果選擇預設錢包，自動切換到指定任務（coinFirstAssigned 時保持不變）
            else if (key === 'walletType' && value === 'default') {
                if (this.state.settings.taskType !== 'coinFirstAssigned') {
                    this.state.settings.taskType = 'assigned';
                    const taskButtons = document.querySelectorAll('[data-type="taskType"]');
                    taskButtons.forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.value === 'assigned');
                    });
                }
                this.updateWalletOptionsDisplay();

                // 🆕 切換到指定任務：移除輔助點擊「啟用」的 disabled
                const clickModeEnableBtn = document.querySelector('[data-type="clickMode"][data-value="true"]');
                if (clickModeEnableBtn) {
                    clickModeEnableBtn.classList.remove('disabled');
                }
            }
            // 如果選擇其他錢包選項，確保是自選服務（coinFirstFree 時保持不變）
            else if (key === 'walletType' && ['fixed500', 'fixed1000'].includes(value)) {
                if (this.state.settings.taskType !== 'freeChoice' && this.state.settings.taskType !== 'coinFirstFree') {
                    this.state.settings.taskType = 'freeChoice';
                    const taskButtons = document.querySelectorAll('[data-type="taskType"]');
                    taskButtons.forEach(btn => {
                        if (btn.dataset.value === 'freeChoice') {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });

                    // 🆕 切換到自選服務：重置 clickMode 並將「啟用」設為 disabled
                    this.state.settings.clickMode = false;
                    const clickModeButtons = document.querySelectorAll('[data-type="clickMode"]');
                    clickModeButtons.forEach(btn => {
                        if (btn.dataset.value === 'false') {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                    const clickModeEnableBtn = document.querySelector('[data-type="clickMode"][data-value="true"]');
                    if (clickModeEnableBtn) {
                        clickModeEnableBtn.classList.add('disabled');
                    }
                }
                this.updateWalletOptionsDisplay();
            }

            // 🔧 [修正] 當選擇預設題數時，隱藏自訂題數顯示框
            if (key === 'questionCount' && value !== 'custom') {
                const customDisplay = document.querySelector('.custom-question-display');
                const customInput = document.getElementById('custom-question-count-a2');
                if (customDisplay && customInput) {
                    customDisplay.style.display = 'none';
                    customInput.value = '';
                    customInput.style.background = 'white';
                    customInput.style.color = '#333';
                    customInput.style.borderColor = '#ddd';
                }
            }

            // 更新開始按鈕狀態
            this.updateStartButton();

            BarberKiosk.Debug.log('state', ' 設定已更新:', key, '=', value);
        },

        // 🆕 根據 taskType 和 clickMode 更新互斥的 disabled 狀態
        updateClickModeDisabledState() {
            const freeChoiceBtn = document.querySelector('[data-type="taskType"][data-value="freeChoice"]');
            const clickModeEnableBtn = document.querySelector('[data-type="clickMode"][data-value="true"]');

            // 若 clickMode 已啟用，則「自選服務」按鈕 disabled
            if (freeChoiceBtn) {
                if (this.state.settings.clickMode) {
                    freeChoiceBtn.classList.add('disabled');
                } else {
                    freeChoiceBtn.classList.remove('disabled');
                }
            }

            // 若 taskType 為 freeChoice，則輔助點擊「啟用」按鈕 disabled
            if (clickModeEnableBtn) {
                if (this.state.settings.taskType === 'freeChoice') {
                    clickModeEnableBtn.classList.add('disabled');
                } else {
                    clickModeEnableBtn.classList.remove('disabled');
                }
            }
        },

        // 根據任務類型更新錢包選項的顯示
        updateWalletOptionsDisplay() {
            const walletButtons = document.querySelectorAll('[data-type="walletType"]');
            const taskType = this.state.settings.taskType;

            walletButtons.forEach(btn => {
                const value = btn.dataset.value;
                if (taskType === 'assigned' || taskType === 'coinFirstAssigned') {
                    // 指定任務（含 coinFirst 指定）：只顯示預設
                    btn.style.display = (value === 'default') ? '' : 'none';
                } else if (taskType === 'freeChoice' || taskType === 'coinFirstFree') {
                    // 自選服務（含 coinFirst 自選）：顯示 500/1000/自訂，隱藏預設
                    const allowedValues = ['fixed500', 'fixed1000', 'custom'];
                    btn.style.display = allowedValues.includes(value) ? '' : 'none';
                } else {
                    // 未選擇任務類型：都顯示
                    btn.style.display = '';
                }
            });
        },

        // 更新開始按鈕狀態
        updateStartButton() {
            const startBtnContainer = document.querySelector('.game-buttons');
            if (!startBtnContainer) return;

            const backBtn = startBtnContainer.querySelector('.back-to-main-btn');
            if (this.isSettingsComplete()) {
                startBtnContainer.innerHTML = `
                    ${backBtn ? backBtn.outerHTML : '<button class="back-to-main-btn" onclick="BarberKiosk.backToMainMenu()" aria-label="返回主畫面">返回主畫面</button>'}
                    <button class="start-btn" onclick="BarberKiosk.startGame()" aria-label="開始遊戲">開始測驗</button>
                `;
            } else {
                startBtnContainer.innerHTML = `
                    ${backBtn ? backBtn.outerHTML : '<button class="back-to-main-btn" onclick="BarberKiosk.backToMainMenu()" aria-label="返回主畫面">返回主畫面</button>'}
                    <button class="start-btn disabled" onclick="BarberKiosk.showMissingSettings()" aria-label="開始遊戲">請完成所有設定選項</button>
                `;
            }
        },

        // 顯示缺少的設定項目
        showMissingSettings() {
            const s = this.state.settings;
            const missing = [];

            if (!s.difficulty) missing.push('遊戲難度');
            if (!s.walletType) missing.push('錢包選項');
            if (!s.taskType) missing.push('任務類型');
            if (!s.questionCount) missing.push('測驗題數');

            if (missing.length > 0) {
                this.showToast('請先完成以下設定：\n' + missing.map(m => '• ' + m).join('\n'), 'warning');
            }
        },

        // 開始遊戲
        startGame() {
            // 檢查是否已選擇所有必要設定
            if (!this.state.settings.difficulty) {
                this.showToast('請先選擇遊戲難度！', 'warning');
                return;
            }
            if (!this.state.settings.walletType) {
                this.showToast('請先選擇錢包選項！', 'warning');
                return;
            }
            if (!this.state.settings.taskType) {
                this.showToast('請先選擇任務類型！', 'warning');
                return;
            }
            if (!this.state.settings.questionCount) {
                this.showToast('請先選擇測驗題數！', 'warning');
                return;
            }

            this.audio.playSound('beep');

            // 重置完成畫面旗標（確保新一輪遊戲能正常顯示完成畫面）
            this._completionScreenShown = false;

            // 重置已完成訂單數
            this.state.gameState.completedOrders = 0;
            this.state.gameState.startTime = Date.now();
            if (window.TutorContext) {
                TutorContext.reset();
                TutorContext.update({ screen: 'game', phase: 'selectItem', difficulty: this.state.settings.difficulty, totalQuestions: this.state.settings.questionCount, questionIndex: 0 });
                const _bk = this;
                TutorContext.getLiveData = () => {
                    const gs = _bk.state.gameState;
                    const svc = gs.selectedService;
                    return {
                        serviceName: svc?.name   || null,
                        price:       svc?.price  ?? null,
                        inserted:    gs.insertedAmount ?? 0,
                        wallet:      _bk.state.settings.walletType || null,
                    };
                };
            }
            BarberKiosk.Debug.log('init', ' 重置已完成訂單數為 0');

            // 🔧 [新增] 重置全局交易狀態
            this.state.gameState.selectedService = null;
            this.state.gameState.insertedAmount = 0;
            this.state.gameState.requiredAmount = 0;
            this.state.gameState.paymentComplete = false;
            this.state.gameState.ticketPrinted = false;

            // 🔧 [新增] 重置輔助點擊模式狀態
            if (this.state.gameState.clickModeState) {
                this.state.gameState.clickModeState.enabled = false;
                this.state.gameState.clickModeState.currentPhase = 'welcome';
                this.state.gameState.clickModeState.currentStep = 0;
                this.state.gameState.clickModeState.actionQueue = [];
                this.state.gameState.clickModeState.waitingForClick = false;
                this.state.gameState.clickModeState.waitingForStart = false;
                this.state.gameState.clickModeState.lastClickTime = 0;
                BarberKiosk.Debug.log('init', ' 重置輔助點擊模式狀態');
            }

            // 先投幣再選服務（指定）：所有難度
            if (this.state.settings.taskType === 'coinFirstAssigned') {
                this.setupCoinFirstAssignedMode();
                this.showWelcomeScreen();
                return;
            }

            // 先投幣再選服務（自選）：普通/困難
            if (this.state.settings.taskType === 'coinFirstFree') {
                this.setupCoinFirstFreeMode();
                this.showWelcomeScreen();
                return;
            }

            // 簡單模式：指定任務
            if (this.state.settings.difficulty === 'easy' && this.state.settings.taskType === 'assigned') {
                this.setupEasyMode();
                this.showWelcomeScreen();
                return;
            }

            // 簡單模式：自選服務
            if (this.state.settings.difficulty === 'easy' && this.state.settings.taskType === 'freeChoice') {
                this.setupEasyFreeChoiceMode();
                this.showWelcomeScreen();
                return;
            }

            // 普通/困難模式：指定任務
            if ((this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard') &&
                this.state.settings.taskType === 'assigned') {
                this.setupAssignedMode();
                this.showWelcomeScreen();
                return;
            }

            // 普通/困難模式：自選服務
            if ((this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard') &&
                this.state.settings.taskType === 'freeChoice') {
                this.setupFreeChoiceMode();
                this.showWelcomeScreen();
                return;
            }
        },

        // 簡單模式設定
        setupEasyMode() {
            const difficulty = this.state.settings.difficulty;
            const services = this.serviceConfig[difficulty].services;

            // 🔧 [新增] 重置任務彈窗標記（新任務需要重新顯示）
            this._taskPopupDismissed = false;
            this._taskPopupScheduled = false;

            // 隨機選擇一個服務作為指定任務（避免與上一輪重複）
            const previousService = this.state.gameState.easyMode.assignedService;
            let randomService;

            if (previousService && services.length > 1) {
                // 如果有上一輪的服務且服務選項多於1個，排除上一輪的服務
                const availableServices = services.filter(s => s.id !== previousService.id);
                randomService = availableServices[Math.floor(Math.random() * availableServices.length)];
                BarberKiosk.Debug.log('flow', ' 排除上一輪服務:', previousService.name, '選擇新服務:', randomService.name);
            } else {
                // 第一輪或只有一個服務選項
                randomService = services[Math.floor(Math.random() * services.length)];
            }

            this.state.gameState.easyMode.assignedService = randomService;

            // 錢包金額 = 服務金額
            this.state.gameState.easyMode.walletAmount = randomService.price;

            // 生成錢包硬幣組成（根據金額分解）
            this.state.gameState.easyMode.walletCoins = this.generateWalletCoins(randomService.price);

            // 初始化簡單模式步驟為 step1
            this.state.gameState.easyMode.currentStep = 'step1';

            BarberKiosk.Debug.log('flow', ' 指定服務:', randomService.name, randomService.price + '元');
            BarberKiosk.Debug.log('flow', ' 錢包金額:', this.state.gameState.easyMode.walletAmount + '元');
            BarberKiosk.Debug.log('flow', ' 錢包組成:', this.state.gameState.easyMode.walletCoins);
        },

        // 簡單模式自選服務設定
        setupEasyFreeChoiceMode() {
            const walletType = this.state.settings.walletType;

            // 根據錢包類型決定固定金額
            let fixedAmount;
            if (walletType === 'fixed500') {
                fixedAmount = 500;
            } else if (walletType === 'fixed1000') {
                fixedAmount = 1000;
            } else {
                this.Debug.error('[Easy Free Choice] 無效的錢包類型:', walletType);
                return;
            }

            // 🆕【修復 44】生成固定金額的錢包（確保能對所有服務剛好付款）
            this.state.gameState.easyMode.walletAmount = fixedAmount;
            this.state.gameState.easyMode.walletCoins = this.generateFixedWalletForFreeChoice(fixedAmount);

            // 保存錢包組成供後續提示使用
            this.state.gameState.easyMode.walletComposition = {
                bills: [...this.state.gameState.easyMode.walletCoins.bills],
                coins: [...this.state.gameState.easyMode.walletCoins.coins]
            };

            // 自選服務模式不預先指定服務
            this.state.gameState.easyMode.assignedService = null;

            // 初始化簡單模式步驟為 step1
            this.state.gameState.easyMode.currentStep = 'step1';

            this.Debug.log('flow', '[Easy Free Choice] 錢包金額:', fixedAmount + '元');
            this.Debug.log('flow', '[Easy Free Choice] 錢包組成:', this.state.gameState.easyMode.walletCoins);
            this.Debug.log('flow', '[Easy Free Choice] 保存組成供提示使用');
        },

        // 🆕【修復 44】生成自選服務固定錢包（確保能對所有服務剛好付款）
        generateFixedWalletForFreeChoice(amount) {
            this.Debug.log('coin', `[Fixed Wallet Generator] 生成自選服務專用錢包: ${amount}元`);

            const coins = { bills: [], coins: [] };

            // A2 理髮店服務價格: 30元、150元、250元、500元
            // 需要確保能夠剛好付出這些金額

            if (amount === 500) {
                // 500元錢包：2×100元 + 5×50元 + 5×10元 = 500元
                // 驗證：
                // - 30元：3×10 ✓
                // - 150元：1×100 + 1×50 或 3×50 ✓
                // - 250元：2×100 + 1×50 或 5×50 ✓
                // - 500元：全部 ✓
                coins.bills = [100, 100];
                coins.coins = [50, 50, 50, 50, 50, 10, 10, 10, 10, 10];
                this.Debug.log('coin', '[Fixed Wallet] 500元組合 - 2張100元 + 5個50元 + 5個10元');
            } else if (amount === 1000) {
                // 1000元錢包：4×100元 + 10×50元 + 10×10元 = 1000元
                // 驗證：
                // - 30元：3×10 ✓
                // - 150元：1×100 + 1×50 或 3×50 ✓
                // - 250元：2×100 + 1×50 或 5×50 ✓
                // - 500元：4×100 + 2×50 或 10×50 ✓
                // - 1000元：全部 ✓
                coins.bills = [100, 100, 100, 100];
                coins.coins = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
                              10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
                this.Debug.log('coin', '[Fixed Wallet] 1000元組合 - 4張100元 + 10個50元 + 10個10元');
            } else {
                // 如果是其他金額，回退到隨機生成
                this.Debug.warn('coin', '[Fixed Wallet] 不支援的金額，使用隨機生成:', amount);
                return this.generateWalletCoins(amount);
            }

            // 驗證總金額
            const total = coins.bills.reduce((sum, val) => sum + val, 0) +
                         coins.coins.reduce((sum, val) => sum + val, 0);
            this.Debug.log('coin', `[Fixed Wallet] 驗證總金額: ${total}元 (預期: ${amount}元)`);

            if (total !== amount) {
                this.Debug.error('[Fixed Wallet] 金額錯誤！使用隨機生成代替');
                return this.generateWalletCoins(amount);
            }

            return coins;
        },

        // 生成錢包硬幣組成
        generateWalletCoins(amount) {
            const coins = { bills: [], coins: [] };
            let remaining = amount;

            // 可用面額
            const billValue = 100;
            const coinValues = [50, 10];

            // 計算可能的 100 元張數（0 到 amount/100）
            const maxBills = Math.floor(amount / billValue);

            // 隨機決定使用多少張 100 元
            // 但要確保剩餘金額可以用 50 和 10 元組成
            let numBills;
            let attempts = 0;
            let isValidCombination = false;

            while (attempts < 20 && !isValidCombination) {
                attempts++;
                // 隨機選擇 100 元的數量
                numBills = Math.floor(Math.random() * (maxBills + 1));
                remaining = amount - (numBills * billValue);

                // 檢查剩餘金額是否可以用 50 和 10 元組成
                if (remaining === 0 || remaining % 10 === 0) {
                    isValidCombination = true;
                }
            }

            // 如果找不到合適的組合，使用全部 100 元
            if (!isValidCombination) {
                numBills = maxBills;
                remaining = amount - (numBills * billValue);
            }

            // 添加 100 元紙鈔
            for (let i = 0; i < numBills; i++) {
                coins.bills.push(billValue);
            }

            // 處理剩餘金額 - 隨機分配 50 元和 10 元
            if (remaining > 0) {
                // 計算可能的 50 元數量
                const max50s = Math.floor(remaining / 50);

                // 隨機決定使用多少個 50 元
                const num50s = Math.floor(Math.random() * (max50s + 1));
                remaining -= (num50s * 50);

                // 添加 50 元硬幣
                for (let i = 0; i < num50s; i++) {
                    coins.coins.push(50);
                }

                // 剩餘的用 10 元
                const num10s = remaining / 10;
                for (let i = 0; i < num10s; i++) {
                    coins.coins.push(10);
                }
            }

            this.Debug.log('coin', `[Wallet Generator] 生成隨機組合 - ${numBills}張100元 + ${coins.coins.filter(c => c === 50).length}個50元 + ${coins.coins.filter(c => c === 10).length}個10元 = ${amount}元`);

            // 🆕【修復 40】優化錢包組成：減少過多硬幣，避免點擊過多
            // 規則：
            // - 10元硬幣 >10 個：每 10×10元 → 1×100元
            // - 50元硬幣 >10 個：每 10×50元 → 1×500元 或 5×100元
            const count10 = coins.coins.filter(c => c === 10).length;
            const count50 = coins.coins.filter(c => c === 50).length;

            // 優化 10元硬幣
            if (count10 > 10) {
                // 計算可以換多少組（每10個換1張100元）
                const groups = Math.floor(count10 / 10);
                const remainder = count10 % 10;

                // 如果換完後會剩0個，則少換1組（保留至少一些硬幣）
                const actualGroups = (remainder === 0 && groups > 1) ? groups - 1 : groups;

                if (actualGroups > 0) {
                    // 移除 actualGroups * 10 個 10元硬幣
                    const remove10Count = actualGroups * 10;
                    let removed = 0;
                    coins.coins = coins.coins.filter(c => {
                        if (c === 10 && removed < remove10Count) {
                            removed++;
                            return false;
                        }
                        return true;
                    });

                    // 添加 actualGroups 張 100元紙鈔
                    for (let i = 0; i < actualGroups; i++) {
                        coins.bills.push(100);
                    }

                    this.Debug.log('coin', `[Wallet Optimizer] 10元優化：${remove10Count}個10元 → ${actualGroups}張100元`);
                }
            }

            // 優化 50元硬幣
            if (count50 > 10) {
                // 計算可以換多少組（每10個換5張100元）
                const groups = Math.floor(count50 / 10);
                const remainder = count50 % 10;

                // 如果換完後會剩0個，則少換1組（保留至少一些硬幣）
                const actualGroups = (remainder === 0 && groups > 1) ? groups - 1 : groups;

                if (actualGroups > 0) {
                    // 移除 actualGroups * 10 個 50元硬幣
                    const remove50Count = actualGroups * 10;
                    let removed = 0;
                    coins.coins = coins.coins.filter(c => {
                        if (c === 50 && removed < remove50Count) {
                            removed++;
                            return false;
                        }
                        return true;
                    });

                    // 使用 5×100元（A2 理髮店只使用 100元紙鈔）
                    for (let i = 0; i < actualGroups * 5; i++) {
                        coins.bills.push(100);
                    }
                    this.Debug.log('coin', `[Wallet Optimizer] 50元優化：${remove50Count}個50元 → ${actualGroups * 5}張100元`);
                }
            }

            // 輸出優化後的組成
            const final10 = coins.coins.filter(c => c === 10).length;
            const final50 = coins.coins.filter(c => c === 50).length;
            const final100 = coins.bills.filter(c => c === 100).length;

            if (count10 > 10 || count50 > 10) {
                this.Debug.log('coin', `[Wallet Optimizer] 優化後組成 - ${final100}張100元 + ${final50}個50元 + ${final10}個10元 = ${amount}元`);
                this.Debug.log('coin', `[Wallet Optimizer] 優化效果 - 點擊次數從 ${count10 + count50 + numBills} 減少到 ${final10 + final50 + final100}`);
            }

            return coins;
        },

        // 計算使用最少數量的鈔票/硬幣組合支付指定金額（優先使用大面額）
        calculateSmallestDenominations(amount, walletCoins) {
            this.Debug.log('hint', `[Smallest Denominations] 計算 ${amount}元 的最少數量組合（優先大面額）`);
            this.Debug.log('hint', '[Smallest Denominations] 可用錢包:', walletCoins);

            // 統計錢包中每種面額的數量
            const available = {
                10: 0,
                50: 0,
                100: 0
            };

            // 統計硬幣
            if (walletCoins.coins) {
                walletCoins.coins.forEach(coin => {
                    if (available[coin] !== undefined) {
                        available[coin]++;
                    }
                });
            }

            // 統計紙鈔
            if (walletCoins.bills) {
                walletCoins.bills.forEach(bill => {
                    if (available[bill] !== undefined) {
                        available[bill]++;
                    }
                });
            }

            this.Debug.log('hint', '[Smallest Denominations] 可用面額統計:', available);

            // 優先使用大面額（最少數量）：100元 > 50元 > 10元
            const result = {
                10: 0,
                50: 0,
                100: 0,
                total: 0
            };

            let remaining = amount;

            // 先盡量使用100元
            const use100 = Math.min(Math.floor(remaining / 100), available[100]);
            result[100] = use100;
            remaining -= use100 * 100;
            this.Debug.log('hint', `[Smallest Denominations] 使用 ${use100} 張100元，剩餘: ${remaining}元`);

            // 再使用50元
            if (remaining > 0) {
                const use50 = Math.min(Math.floor(remaining / 50), available[50]);
                result[50] = use50;
                remaining -= use50 * 50;
                this.Debug.log('hint', `[Smallest Denominations] 使用 ${use50} 個50元，剩餘: ${remaining}元`);
            }

            // 最後使用10元
            if (remaining > 0) {
                const use10 = Math.min(Math.floor(remaining / 10), available[10]);
                result[10] = use10;
                remaining -= use10 * 10;
                this.Debug.log('hint', `[Smallest Denominations] 使用 ${use10} 個10元，剩餘: ${remaining}元`);
            }

            result.total = result[10] * 10 + result[50] * 50 + result[100] * 100;

            if (remaining > 0) {
                this.Debug.log('hint', '[Smallest Denominations] ⚠️ 無法用現有面額組合湊出金額，剩餘:', remaining);
                return null;
            }

            this.Debug.log('hint', '[Smallest Denominations] ✅ 計算結果:', result);
            return result;
        },

        // 簡單模式自選服務提示
        showEasyFreeChoiceHint(servicePrice) {
            this.Debug.log('hint', `[Easy Free Choice Hint] 為服務價格 ${servicePrice}元 生成提示`);

            // 🔧 [修復] 使用當前的 walletCoins 而非原始的 walletComposition
            // walletComposition 是初始快照，不會隨投幣更新
            // walletCoins 是實際錢包，會隨投幣更新
            let walletCoins = this.state.gameState.easyMode.walletCoins;
            if (!walletCoins) {
                // fallback 到 walletComposition
                walletCoins = this.state.gameState.easyMode.walletComposition;
                if (!walletCoins) {
                    this.Debug.error('[Easy Free Choice Hint] 錢包組成未保存');
                    return;
                }
            }

            // 計算最小面額組合
            const smallestCombination = this.calculateSmallestDenominations(servicePrice, walletCoins);
            if (!smallestCombination) {
                this.Debug.error('[Easy Free Choice Hint] 無法計算出有效組合');
                return;
            }

            // 將組合轉換為陣列格式（用於modal高亮顯示）
            const correctAmounts = [];
            if (smallestCombination[10] > 0) {
                for (let i = 0; i < smallestCombination[10]; i++) {
                    correctAmounts.push(10);
                }
            }
            if (smallestCombination[50] > 0) {
                for (let i = 0; i < smallestCombination[50]; i++) {
                    correctAmounts.push(50);
                }
            }
            if (smallestCombination[100] > 0) {
                for (let i = 0; i < smallestCombination[100]; i++) {
                    correctAmounts.push(100);
                }
            }

            // 保存正確組合到easy mode狀態
            this.state.gameState.easyMode.correctAmounts = correctAmounts;
            this.Debug.log('hint', '[Easy Free Choice Hint] 正確組合已保存:', correctAmounts);

            // 判斷需要紙鈔還是硬幣
            const needsBills = smallestCombination[100] > 0;
            const needsCoins = smallestCombination[10] > 0 || smallestCombination[50] > 0;

            // 獲取投入口元素
            const billSlot = document.querySelector('.bill-slot-area');
            const coinSlot = document.querySelector('.coin-slot-area');

            // 清除之前的提示並重置禁用狀態
            if (billSlot) {
                billSlot.classList.remove('easy-mode-hint');
                billSlot.style.pointerEvents = '';
                billSlot.style.opacity = '';
                billSlot.style.cursor = '';
            }
            if (coinSlot) {
                coinSlot.classList.remove('easy-mode-hint');
                coinSlot.style.pointerEvents = '';
                coinSlot.style.opacity = '';
                coinSlot.style.cursor = '';
            }
            this.Debug.log('hint', '[Easy Free Choice Hint] 已重置投幣口狀態');

            // 決定提示哪個入口
            if (needsBills && !needsCoins) {
                // 只需要紙鈔
                if (billSlot) {
                    billSlot.classList.add('easy-mode-hint');
                    this.speech.speakCustom('請投入紙鈔');
                }
                if (coinSlot) {
                    coinSlot.style.opacity = '0.3';
                    coinSlot.style.pointerEvents = 'none';
                }
                this.Debug.log('hint', '[Easy Free Choice Hint] 提示僅使用紙鈔');

                // 🆕 啟動 0.5秒 視覺延遲機制
                this.enableClickModeWithVisualDelay('FreeChoice-BillsOnly');
            } else if (needsCoins && !needsBills) {
                // 只需要硬幣
                if (coinSlot) {
                    coinSlot.classList.add('easy-mode-hint');
                    this.speech.speakCustom('請投入硬幣');
                }
                if (billSlot) {
                    billSlot.style.opacity = '0.3';
                    billSlot.style.pointerEvents = 'none';
                }
                this.Debug.log('hint', '[Easy Free Choice Hint] 提示僅使用硬幣');

                // 🆕 啟動 0.5秒 視覺延遲機制
                this.enableClickModeWithVisualDelay('FreeChoice-CoinsOnly');
            } else if (needsBills && needsCoins) {
                // 兩者都需要 - 優先提示紙鈔（大面額優先）
                if (billSlot) {
                    billSlot.classList.add('easy-mode-hint');
                    this.speech.speakCustom('請投入紙鈔');
                }
                // 暫時禁用硬幣入口（付完紙鈔後會重新調用此函數）
                if (coinSlot) {
                    coinSlot.style.pointerEvents = 'none';
                    coinSlot.style.opacity = '0.5';
                    coinSlot.style.cursor = 'not-allowed';
                }
                this.Debug.log('hint', '[Easy Free Choice Hint] 提示先使用紙鈔（大面額優先），暫時禁用硬幣入口');

                // 🆕 啟動 0.5秒 視覺延遲機制
                this.enableClickModeWithVisualDelay('FreeChoice-BillsThenCoins');
            }
        },

        // 普通/困難模式指定任務設定
        setupAssignedMode() {
            const difficulty = this.state.settings.difficulty;
            const services = this.serviceConfig[difficulty].services;

            // ★★★ 重置步驟為 step1（修復提示框錯誤位置問題） ★★★
            this.state.gameState.normalMode.currentStep = 'step1';
            this.state.gameState.normalMode.errorCount = 0;
            this.Debug.log('flow', '[setupAssignedMode] 已重置 normalMode.currentStep 為 step1');

            // ★★★ 清除上一輪的提示狀態 ★★★
            this.state.gameState.normalMode.hintShown = false;
            this.state.gameState.normalMode.correctAmounts = null;
            this.state.gameState.normalMode.paymentErrorCount = 0;
            this.state.gameState.normalMode.billsInserted = false;
            this.state.gameState.normalMode.coinsInserted = false;
            this.state.gameState.normalMode.usedAmounts = [];

            // 🔧 [新增] 重置任務彈窗標記（新任務需要重新顯示）
            this._taskPopupDismissed = false;
            this._taskPopupScheduled = false;

            // 移除所有提示動畫
            const billSlot = document.querySelector('.bill-slot-area');
            const coinSlot = document.querySelector('.coin-slot-area');
            if (billSlot) billSlot.classList.remove('easy-mode-hint');
            if (coinSlot) coinSlot.classList.remove('easy-mode-hint');

            this.Debug.log('flow', '[Assigned Mode] 已清除上一輪的提示狀態');

            // 隨機選擇一個服務作為指定任務（避免與上一輪重複）
            const previousService = this.state.gameState.normalMode.assignedService;
            let randomService;

            if (previousService && services.length > 1) {
                // 如果有上一輪的服務且服務選項多於1個，排除上一輪的服務
                const availableServices = services.filter(s => s.id !== previousService.id);
                randomService = availableServices[Math.floor(Math.random() * availableServices.length)];
                this.Debug.log('flow', '[Assigned Mode] 排除上一輪服務:', previousService.name, '選擇新服務:', randomService.name);
            } else {
                // 第一輪或只有一個服務選項
                randomService = services[Math.floor(Math.random() * services.length)];
            }

            this.state.gameState.normalMode.assignedService = randomService;

            // 生成錢包金額和硬幣組合
            if (this.state.settings.taskType === 'assigned') {
                // 指定任務模式：根據服務價格生成錢包
                const walletData = this.generateWalletForAssignedMode(randomService.price);
                this.state.gameState.normalMode.walletAmount = walletData.totalAmount;
                this.state.gameState.normalMode.walletCoins = {
                    bills: walletData.bills,
                    coins: walletData.coins
                };

                // ★★★ 保存原始錢包備份，用於退款時恢復 ★★★
                this.state.gameState.normalMode.originalWalletCoins = {
                    bills: [...walletData.bills],
                    coins: [...walletData.coins]
                };

                this.Debug.log('flow', '[Assigned Mode] 指定服務:', randomService.name, randomService.price + '元');
                this.Debug.log('flow', '[Assigned Mode] 錢包總金額:', walletData.totalAmount + '元');
                this.Debug.log('flow', '[Assigned Mode] 錢包組成:', {
                    bills: walletData.bills,
                    coins: walletData.coins
                });
            }
        },

        // 普通/困難模式自選任務設定
        setupFreeChoiceMode() {
            this.Debug.log('flow', '[Free Choice Mode] 初始化自選服務模式');

            // ★★★ 重置步驟為 step1（修復提示框錯誤位置問題） ★★★
            this.state.gameState.normalMode.currentStep = 'step1';
            this.state.gameState.normalMode.errorCount = 0;
            this.Debug.log('flow', '[setupFreeChoiceMode] 已重置 normalMode.currentStep 為 step1');

            // ★★★ 清除上一輪的提示狀態 ★★★
            this.state.gameState.normalMode.hintShown = false;
            this.state.gameState.normalMode.correctAmounts = null;
            this.state.gameState.normalMode.paymentErrorCount = 0;
            this.state.gameState.normalMode.billsInserted = false;
            this.state.gameState.normalMode.coinsInserted = false;
            this.state.gameState.normalMode.usedAmounts = [];

            // 移除所有提示動畫
            const billSlot = document.querySelector('.bill-slot-area');
            const coinSlot = document.querySelector('.coin-slot-area');
            if (billSlot) billSlot.classList.remove('easy-mode-hint');
            if (coinSlot) coinSlot.classList.remove('easy-mode-hint');

            // 生成錢包金額和硬幣組合
            if (this.state.settings.walletType === 'fixed500') {
                // 🆕【修復 44】500元：固定金額，確保能對所有服務剛好付款
                const fixedAmount = 500;
                const walletData = this.generateFixedWalletForFreeChoice(fixedAmount);
                this.state.gameState.normalMode.walletAmount = fixedAmount;
                this.state.gameState.normalMode.walletCoins = walletData;

                // 保存原始錢包備份
                this.state.gameState.normalMode.originalWalletCoins = {
                    bills: [...walletData.bills],
                    coins: [...walletData.coins]
                };

                this.Debug.log('flow', '[Free Choice + Fixed500] 500元錢包已生成');
                this.Debug.log('flow', '[Free Choice + Fixed500] 錢包總金額:', fixedAmount + '元');
                this.Debug.log('flow', '[Free Choice + Fixed500] 錢包組成:', walletData);
            } else if (this.state.settings.walletType === 'fixed1000') {
                // 🆕【修復 44】1000元：固定金額，確保能對所有服務剛好付款
                const fixedAmount = 1000;
                const walletData = this.generateFixedWalletForFreeChoice(fixedAmount);
                this.state.gameState.normalMode.walletAmount = fixedAmount;
                this.state.gameState.normalMode.walletCoins = walletData;

                // 保存原始錢包備份
                this.state.gameState.normalMode.originalWalletCoins = {
                    bills: [...walletData.bills],
                    coins: [...walletData.coins]
                };

                this.Debug.log('flow', '[Free Choice + Fixed1000] 1000元錢包已生成');
                this.Debug.log('flow', '[Free Choice + Fixed1000] 錢包總金額:', fixedAmount + '元');
                this.Debug.log('flow', '[Free Choice + Fixed1000] 錢包組成:', walletData);
            } else if (this.state.settings.walletType === 'custom' && this.state.settings.customWalletDetails) {
                const walletData = this.generateCustomWalletFromDetails(this.state.settings.customWalletDetails);
                const totalAmount = this.state.settings.walletAmount;
                this.state.gameState.normalMode.walletAmount = totalAmount;
                this.state.gameState.normalMode.walletCoins = walletData;
                this.state.gameState.normalMode.originalWalletCoins = {
                    bills: [...walletData.bills],
                    coins: [...walletData.coins]
                };
                this.Debug.log('flow', '[Free Choice + Custom] 自訂錢包已生成，總金額:', totalAmount + '元');
                this.Debug.log('flow', '[Free Choice + Custom] 錢包組成:', walletData);
            } else {
                // 預設錢包：使用固定金額生成
                const defaultAmount = 500; // 預設500元
                const walletData = this.generateWalletCoins(defaultAmount);
                this.state.gameState.normalMode.walletAmount = defaultAmount;
                this.state.gameState.normalMode.walletCoins = walletData;

                // 保存原始錢包備份
                this.state.gameState.normalMode.originalWalletCoins = {
                    bills: [...walletData.bills],
                    coins: [...walletData.coins]
                };

                this.Debug.log('flow', '[Free Choice + Default] 預設錢包已生成');
                this.Debug.log('flow', '[Free Choice + Default] 錢包總金額:', defaultAmount + '元');
                this.Debug.log('flow', '[Free Choice + Default] 錢包組成:', walletData);
            }
        },

        // 先投幣再選服務（指定）設定 - 支援所有難度
        setupCoinFirstAssignedMode() {
            const difficulty = this.state.settings.difficulty;
            const services = this.serviceConfig[difficulty].services;
            const isEasy = difficulty === 'easy';

            this._taskPopupDismissed = false;
            this._taskPopupScheduled = false;

            // 隨機選指定服務（避免重複上一輪）
            const previousService = isEasy
                ? this.state.gameState.easyMode.assignedService
                : this.state.gameState.normalMode.assignedService;
            let randomService;
            if (previousService && services.length > 1) {
                const available = services.filter(s => s.id !== previousService.id);
                randomService = available[Math.floor(Math.random() * available.length)];
            } else {
                randomService = services[Math.floor(Math.random() * services.length)];
            }

            this.Debug.log('flow', '[coinFirstAssigned] 指定服務:', randomService.name, randomService.price + '元');

            if (isEasy) {
                this.state.gameState.easyMode.assignedService = randomService;
                this.state.gameState.easyMode.walletAmount = randomService.price;
                this.state.gameState.easyMode.walletCoins = this.generateWalletCoins(randomService.price);
                this.state.gameState.easyMode.currentStep = 'step1';
                this.state.gameState.easyMode.correctAmounts = null;
            } else {
                this.state.gameState.normalMode.currentStep = 'step1';
                this.state.gameState.normalMode.errorCount = 0;
                this.state.gameState.normalMode.hintShown = false;
                this.state.gameState.normalMode.correctAmounts = null;
                this.state.gameState.normalMode.paymentErrorCount = 0;
                this.state.gameState.normalMode.billsInserted = false;
                this.state.gameState.normalMode.coinsInserted = false;
                this.state.gameState.normalMode.assignedService = randomService;
                this.state.gameState.normalMode.tempSelectedMoney = [];

                // 普通/困難模式：錢包 = 服務價格 + 隨機 100~500 元（與 assigned 模式一致）
                const walletData = this.generateWalletForAssignedMode(randomService.price);
                this.state.gameState.normalMode.walletAmount = walletData.totalAmount;
                this.state.gameState.normalMode.walletCoins = {
                    bills: walletData.bills,
                    coins: walletData.coins
                };
                this.state.gameState.normalMode.originalWalletCoins = {
                    bills: [...walletData.bills],
                    coins: [...walletData.coins]
                };
                this.Debug.log('flow', '[coinFirstAssigned] 錢包總金額:', walletData.totalAmount + '元');
            }
        },

        // 先投幣再選服務（自選）設定 - 僅普通/困難
        setupCoinFirstFreeMode() {
            // 錢包生成邏輯與 freeChoice 相同，直接複用
            this.setupFreeChoiceMode();
            // 確保無指定服務
            this.state.gameState.normalMode.assignedService = null;
            this.Debug.log('flow', '[coinFirstFree] 設定完成，assignedService = null');
        },

        /**
         * 生成指定範圍內的服務組合金額（適用於自選服務模式）
         * 確保金額等於一個或多個服務項目的組合價格，不需找零
         * @param {number} maxAmount - 最大金額（500 或 1000）
         * @returns {number} - 服務組合的總金額
         */
        generateRandomAmountWithin(maxAmount) {
            // 服務項目及價格
            const services = [
                { name: '男士剪髮', price: 150 },
                { name: '女士剪髮', price: 200 },
                { name: '洗髮', price: 30 },
                { name: '染髮', price: 500 },
                { name: '頭皮隔離', price: 250 },
                { name: '頭皮按摩', price: 150 }
            ];

            // 根據最大金額設定最小服務項目數量
            const minServices = 1;
            const maxServices = maxAmount === 500 ? 3 : 5; // 500元內最多3項，1000元內最多5項

            // 嘗試生成符合條件的服務組合（最多嘗試50次）
            let attempts = 0;
            let totalAmount = 0;

            while (attempts < 50) {
                attempts++;
                totalAmount = 0;

                // 隨機決定要選擇幾個服務項目
                const numServices = Math.floor(Math.random() * (maxServices - minServices + 1)) + minServices;

                // 隨機選擇服務項目並累加價格
                for (let i = 0; i < numServices; i++) {
                    const randomService = services[Math.floor(Math.random() * services.length)];
                    totalAmount += randomService.price;
                }

                // 檢查總金額是否在範圍內
                if (totalAmount > 0 && totalAmount <= maxAmount) {
                    this.Debug.log('coin', `[Wallet Amount Generator] 成功生成金額: ${totalAmount}元 (範圍: ${maxAmount}元以內, 嘗試次數: ${attempts})`);
                    return totalAmount;
                }
            }

            // 如果無法生成合適的組合，回退到簡單策略：使用單一服務
            const fallbackServices = services.filter(s => s.price <= maxAmount);
            if (fallbackServices.length > 0) {
                const fallbackService = fallbackServices[Math.floor(Math.random() * fallbackServices.length)];
                this.Debug.log('coin', `[Wallet Amount Generator] 使用回退策略，選擇單一服務: ${fallbackService.name} ${fallbackService.price}元`);
                return fallbackService.price;
            }

            // 最終回退：返回最小服務價格
            this.Debug.warn('coin', '[Wallet Amount Generator] 無法生成合適金額，使用最小服務價格');
            return 30; // 洗髮
        },

        /**
         * 為普通/困難模式指定任務生成錢包
         * @param {number} servicePrice - 服務價格
         * @returns {object} - {totalAmount, bills, coins}
         */
        generateWalletForAssignedMode(servicePrice) {
            this.Debug.log('coin', '[Wallet Generator] 開始生成錢包，服務價格:', servicePrice);

            // 1. 計算錢包總金額 = 服務價格 + (100~500隨機)
            const extraAmount = Math.floor(Math.random() * 401) + 100; // 100~500
            const totalAmount = servicePrice + extraAmount;
            this.Debug.log('coin', '[Wallet Generator] 額外金額:', extraAmount, '總金額:', totalAmount);

            // 2. 生成至少一種等於服務金額的精確組合
            const exactCombination = this.generateExactCombination(servicePrice);
            this.Debug.log('coin', '[Wallet Generator] 精確組合:', exactCombination);

            const wallet = {
                totalAmount: totalAmount,
                bills: [...exactCombination.bills],
                coins: [...exactCombination.coins]
            };

            // 3. 填充額外金額到錢包（只使用 10元、50元、100元）
            let currentTotal = servicePrice;
            const availableDenominations = [100, 50, 10]; // 移除 500元

            this.Debug.log('coin', '[Wallet Generator] 開始填充額外金額...');

            while (currentTotal < totalAmount) {
                const remaining = totalAmount - currentTotal;
                this.Debug.log('coin', '[Wallet Generator] 剩餘需要填充:', remaining);

                // 找出所有可用的面額（不超過剩餘金額）
                const validDenoms = availableDenominations.filter(d => d <= remaining);
                if (validDenoms.length === 0) {
                    this.Debug.log('coin', '[Wallet Generator] 無可用面額，停止填充');
                    break;
                }

                // 隨機選擇一個面額
                const denom = validDenoms[Math.floor(Math.random() * validDenoms.length)];
                this.Debug.log('coin', '[Wallet Generator] 選擇面額:', denom);

                if (denom >= 100) {
                    wallet.bills.push(denom);
                } else {
                    wallet.coins.push(denom);
                }
                currentTotal += denom;
            }

            // 計算實際錢包總金額（所有硬幣的總和）
            const actualTotalAmount = wallet.bills.reduce((sum, bill) => sum + bill, 0) +
                                      wallet.coins.reduce((sum, coin) => sum + coin, 0);

            this.Debug.log('coin', '[Wallet Generator] 生成完成，實際總額:', actualTotalAmount);
            this.Debug.log('coin', '[Wallet Generator] 最終錢包:', wallet);

            // 更新 wallet 的 totalAmount 為實際總額
            wallet.totalAmount = actualTotalAmount;

            return wallet;
        },

        /**
         * 生成等於服務金額的精確組合
         * @param {number} amount - 目標金額
         * @returns {object} - {bills: [], coins: []}
         */
        generateExactCombination(amount) {
            this.Debug.log('coin', '[Exact Combination] 生成精確組合，目標:', amount);

            const combinations = [];

            // 策略1: 使用100元紙鈔 + 餘數
            if (amount >= 100) {
                const hundreds = Math.floor(amount / 100);
                const remainder = amount % 100;

                if (remainder === 0) {
                    // 整百，只用100元
                    combinations.push({
                        bills: Array(hundreds).fill(100),
                        coins: []
                    });
                } else if (remainder % 50 === 0) {
                    // 餘數可以用50元整除
                    const fifties = remainder / 50;
                    combinations.push({
                        bills: Array(hundreds).fill(100),
                        coins: Array(fifties).fill(50)
                    });
                } else if (remainder % 10 === 0) {
                    // 餘數可以用10元整除
                    const tens = remainder / 10;
                    combinations.push({
                        bills: Array(hundreds).fill(100),
                        coins: Array(tens).fill(10)
                    });
                }

                // 策略2: 使用100元紙鈔 + 混合硬幣（50+10）
                if (remainder >= 50 && remainder % 10 === 0) {
                    const fifties = Math.floor(remainder / 50);
                    const remainingAfterFifties = remainder % 50;
                    const tens = remainingAfterFifties / 10;

                    if (fifties > 0 && tens > 0) {
                        combinations.push({
                            bills: Array(hundreds).fill(100),
                            coins: [...Array(fifties).fill(50), ...Array(tens).fill(10)]
                        });
                    }
                }
            }

            // 策略3: 純50元組合
            if (amount % 50 === 0) {
                const fifties = amount / 50;
                combinations.push({
                    bills: [],
                    coins: Array(fifties).fill(50)
                });
            }

            // 策略4: 純10元組合（如果金額不太大）
            if (amount % 10 === 0 && amount <= 200) {
                const tens = amount / 10;
                combinations.push({
                    bills: [],
                    coins: Array(tens).fill(10)
                });
            }

            // 策略5: 混合50元和10元
            if (amount >= 50 && amount % 10 === 0) {
                const fifties = Math.floor(amount / 50);
                const remainder = amount % 50;
                const tens = remainder / 10;

                if (fifties > 0 && tens > 0) {
                    combinations.push({
                        bills: [],
                        coins: [...Array(fifties).fill(50), ...Array(tens).fill(10)]
                    });
                }
            }

            // 如果沒有找到組合（理論上不應該發生），提供一個備用
            if (combinations.length === 0) {
                this.Debug.warn('coin', '[Exact Combination] 無法生成精確組合，使用備用方案');
                const tens = amount / 10;
                combinations.push({
                    bills: [],
                    coins: Array(tens).fill(10)
                });
            }

            // 隨機選擇一種組合
            const selected = combinations[Math.floor(Math.random() * combinations.length)];
            this.Debug.log('coin', '[Exact Combination] 找到', combinations.length, '種組合，選擇:', selected);

            return selected;
        },

        /**
         * 🆕 根據用戶設定的詳細數量生成錢包（新版，用於 A3 風格的自訂金額）
         * @param {object} details - 詳細的幣值數量 { 10: 2, 50: 1, 100: 3 }
         * @returns {object} - {totalAmount, bills, coins}
         */
        generateCustomWalletFromDetails(details) {
            this.Debug.log('coin', '[Custom Wallet From Details] 根據用戶設定生成錢包:', details);

            const bills = [];
            const coins = [];
            let totalAmount = 0;

            // 按面額從大到小處理
            const denominations = [100, 50, 10];

            for (const denom of denominations) {
                const quantity = details[denom] || 0;

                for (let i = 0; i < quantity; i++) {
                    if (denom >= 100) {
                        bills.push(denom);
                    } else {
                        coins.push(denom);
                    }
                    totalAmount += denom;
                }
            }

            this.Debug.log('coin', '[Custom Wallet From Details] 錢包生成完成:', {
                totalAmount,
                bills,
                coins
            });

            return {
                totalAmount,
                bills,
                coins
            };
        },

        /**
         * 為自訂金額模式生成錢包（舊版，保留以供相容）
         * @param {number} amount - 自訂金額
         * @param {array} availableTypes - 可用的幣值類型
         * @returns {object} - {totalAmount, bills, coins}
         */
        generateCustomWallet(amount, availableTypes) {
            this.Debug.log('coin', '[Custom Wallet] 開始生成自訂錢包，金額:', amount, '可用幣值:', availableTypes);

            const bills = [];
            const coins = [];
            let remaining = amount;

            // 按面額從大到小排序
            const sortedTypes = [...availableTypes].sort((a, b) => b - a);

            // 使用貪心算法分配金額
            for (const value of sortedTypes) {
                while (remaining >= value) {
                    if (value >= 100) {
                        bills.push(value);
                    } else {
                        coins.push(value);
                    }
                    remaining -= value;
                }
            }

            this.Debug.log('coin', '[Custom Wallet] 錢包生成完成:', {
                totalAmount: amount,
                bills: bills,
                coins: coins
            });

            return {
                totalAmount: amount,
                bills: bills,
                coins: coins
            };
        },

        // 🆕 輔助方法：隨機選擇金錢圖片（正面或反面）
        getRandomMoneyImage(value) {
            const side = Math.random() < 0.5 ? 'front' : 'back';
            return `../images/money/${value}_yuan_${side}.png`;
        },

        // 顯示歡迎畫面（簡單模式 & 普通/困難模式的指定任務）
        showWelcomeScreen() {
            const app = document.getElementById('app');
            const difficulty = this.state.settings.difficulty;
            const isEasyMode = difficulty === 'easy';

            // 根據難度獲取指定服務和錢包金額
            const assignedService = isEasyMode
                ? this.state.gameState.easyMode.assignedService
                : this.state.gameState.normalMode.assignedService;
            const walletAmount = isEasyMode ? this.state.gameState.easyMode.walletAmount : null;

            // ★★★ 重置頁碼，確保從第一頁開始 ★★★
            this.currentWelcomePage = 1;

            // 輔助點擊模式：初始化或重新初始化
            if (this.state.settings.clickMode) {
                this.Debug.log('assist', '[A2-ClickMode] 準備初始化輔助點擊模式，已綁定標記:', this._clickModeHandlerBound);

                // 檢查是否已綁定（第二輪及後續）
                if (this._clickModeHandlerBound) {
                    // 重新初始化狀態（參考 A3）
                    const gs = this.state.gameState;
                    gs.clickModeState.enabled = false;
                    gs.clickModeState.currentPhase = 'welcome';
                    gs.clickModeState.currentStep = 0;
                    gs.clickModeState.actionQueue = [];
                    gs.clickModeState.waitingForClick = false;
                    gs.clickModeState.waitingForStart = false;
                    gs.clickModeState.lastClickTime = 0; // 允許立即點擊
                    gs.clickModeState.welcomePageIndex = 1;
                    gs.clickModeState.initialPromptShown = false; // 重置提示標記

                    this.Debug.log('assist', '[A2-ClickMode] 重新初始化狀態（第二輪）');

                    this.TimerManager.setTimeout(() => {
                        gs.clickModeState.enabled = true;
                        gs.clickModeState.waitingForStart = true;
                        this.TimerManager.setTimeout(() => {
                            this.showStartPrompt(true); // 第二輪也顯示初始提示
                        }, 1000, 'clickMode');
                    }, 500, 'clickMode');
                } else {
                    // 首次初始化
                    this.initClickModeForWelcome();
                }
            }

            const renderPage = (page) => {
                if (page === 1) {
                    app.innerHTML = `
                        <style>
                            .welcome-container {
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                                padding: 20px;
                            }
                            .welcome-box {
                                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                                border: 3px solid var(--macaron-border);
                                border-radius: 24px;
                                padding: 60px;
                                text-align: center;
                                max-width: 600px;
                            }
                            .welcome-title {
                                font-size: 36px;
                                font-weight: 600;
                                color: var(--macaron-text);
                                margin-bottom: 30px;
                            }
                            .shop-logo {
                                width: 300px;
                                height: 300px;
                                object-fit: contain;
                                margin-top: 20px;
                                border: 4px solid var(--border-light);
                                border-radius: 20px;
                                padding: 20px;
                                background: #f9fafb;
                            }
                            .welcome-subtitle {
                                font-size: 20px;
                                color: var(--macaron-text-secondary);
                                margin-bottom: 40px;
                            }
                        </style>
                        <div class="welcome-container">
                            <div class="welcome-box">
                                <h1 class="welcome-title">歡迎光臨百元理髮店</h1>
                                <img src="../images/a2/icon-a2-barber-shop.png" alt="百元理髮店" class="shop-logo" onerror="this.style.display='none'">
                            </div>
                        </div>
                    `;

                    // 播放語音「歡迎光臨百元理髮店」後進入下一頁
                    this.speech.speak('welcome', {}, () => {
                        // 語音播放完後自動進入下一頁
                        this.TimerManager.setTimeout(() => {
                            this.nextWelcomePage();
                        }, 500, 'screenTransition');
                    });

                } else if (page === 2) {
                    // 根據難度模式取得錢包資料
                    const isEasyMode = this.state.settings.difficulty === 'easy';
                    const walletCoins = isEasyMode
                        ? this.state.gameState.easyMode.walletCoins
                        : this.state.gameState.normalMode.walletCoins;

                    // 計算錢包總金額
                    const walletAmount = isEasyMode
                        ? this.state.gameState.easyMode.walletAmount
                        : this.state.gameState.normalMode.walletAmount;

                    this.Debug.log('coin', '[Wallet Display] 錢包總金額:', walletAmount, '錢包組成:', walletCoins);

                    // 統計每種面額的數量（與 A5 相同的顯示方式）
                    const coinCounts = {};

                    // 統計紙鈔
                    walletCoins.bills.forEach(bill => {
                        coinCounts[bill] = (coinCounts[bill] || 0) + 1;
                    });

                    // 統計硬幣
                    walletCoins.coins.forEach(coin => {
                        coinCounts[coin] = (coinCounts[coin] || 0) + 1;
                    });

                    // 按面額從大到小排序並生成 HTML（與 A5 相同）
                    const moneyHTML = Object.entries(coinCounts)
                        .sort(([a], [b]) => b - a)
                        .map(([value, count]) => {
                            const imagePath = this.getRandomMoneyImage(parseInt(value)); // 🆕 使用隨機正反面
                            const type = parseInt(value) >= 100 ? 'bill' : 'coin';
                            return `
                                <div class="coin-group money-type-${type}">
                                    <img src="${imagePath}" alt="${value}元"
                                         onerror="this.outerHTML='<div style=\\'width:70px;height:70px;background:#ddd;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;\\'>${value}元</div>'">
                                    <div class="coin-info">
                                        <div class="coin-name">${value} 元</div>
                                        <div class="coin-count">× ${count}</div>
                                    </div>
                                </div>
                            `;
                        }).join('');

                    app.innerHTML = `
                        <style>
                            .welcome-container {
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                                padding: 20px;
                            }
                            .welcome-box {
                                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                                border: 3px solid var(--macaron-border);
                                border-radius: 24px;
                                padding: 60px;
                                text-align: center;
                                max-width: 700px;
                            }
                            .welcome-title {
                                font-size: 36px;
                                font-weight: 600;
                                color: var(--macaron-text);
                                margin-bottom: 20px;
                            }
                            .welcome-subtitle {
                                font-size: 24px;
                                font-weight: 600;
                                color: var(--macaron-text);
                                margin-bottom: 30px;
                            }
                            .wallet-display {
                                display: flex;
                                flex-wrap: wrap;
                                justify-content: center;
                                gap: 20px;
                                margin: 30px 0;
                            }
                            /* A5 風格的硬幣組樣式 */
                            .coin-group {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 10px;
                                padding: 15px;
                                background: rgba(255, 255, 255, 0.8);
                                border-radius: 15px;
                                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                                transition: transform 0.3s ease;
                            }
                            .coin-group:hover {
                                transform: translateY(-5px);
                            }
                            .coin-group img {
                                width: 70px;
                                height: 70px;
                                object-fit: contain;
                            }
                            /* 紙鈔較大 */
                            .coin-group.money-type-bill img {
                                width: 95px;
                                height: 72px;
                            }
                            /* 硬幣較小 */
                            .coin-group.money-type-coin img {
                                width: 60px;
                                height: 60px;
                            }
                            .coin-info {
                                text-align: center;
                            }
                            .coin-name {
                                font-size: 16px;
                                font-weight: 600;
                                color: var(--macaron-text);
                                margin-bottom: 3px;
                            }
                            .coin-count {
                                font-size: 18px;
                                font-weight: 700;
                                color: #3B82F6;
                            }
                        </style>
                        <div class="welcome-container">
                            <div class="welcome-box">
                                <h1 class="welcome-title"><img src="../images/common/icons_wallet.png" alt="💰" style="width:1.5em;height:1.5em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='💰'"> 您的錢包</h1>
                                <p class="welcome-subtitle">總共有 ${walletAmount} 元</p>
                                <div class="wallet-display">
                                    ${moneyHTML}
                                </div>
                            </div>
                        </div>
                    `;

                    // 播放語音「您的錢包總共×元」
                    const speechText = `您的錢包總共${walletAmount}元`;
                    this.speech.speakCustom(speechText, () => {
                        // 🆕【修復 41】輔助點擊模式下，由階段轉換控制遊戲開始，避免重複調用
                        // 語音播放完後自動開始遊戲（僅非輔助模式）
                        const isClickModeEnabled = this.state.gameState.clickModeState?.enabled;

                        if (isClickModeEnabled) {
                            this.Debug.log('assist', '[A2-ClickMode] 輔助模式下跳過自動開始遊戲，等待用戶點擊觸發階段轉換');
                            return;
                        }

                        this.TimerManager.setTimeout(() => {
                            const taskType = this.state.settings.taskType;

                            if (isEasyMode && taskType === 'assigned') {
                                // 簡單模式 + 指定任務
                                this.startEasyModeGame();
                            } else if (isEasyMode && (taskType === 'coinFirstAssigned' || taskType === 'coinFirstFree')) {
                                // 簡單模式 + coinFirst：同 startEasyModeGame（showCoinFirstScreen 在 render 後由 showTaskPopupIfNeeded 鎖定）
                                this.startEasyModeGame();
                            } else if (isEasyMode && taskType === 'freeChoice') {
                                // 簡單模式 + 自選服務：直接渲染遊戲界面
                                this.Debug.log('flow', '[Easy Free Choice] 開始自選服務遊戲');
                                this.audio.playSound('beep');
                                this.render();
                                this.bindEvents();
                            } else if (!isEasyMode && (taskType === 'assigned' || taskType === 'coinFirstAssigned')) {
                                // 普通/困難模式 + 指定任務（含 coinFirst）
                                this.startAssignedModeGame();
                            } else {
                                // 普通/困難模式 + 自選服務（含 coinFirstFree）：直接渲染遊戲界面
                                this.Debug.log('flow', '[Normal/Hard Free Choice] 開始自選服務遊戲');
                                this.audio.playSound('beep');
                                this.render();
                                this.bindEvents();
                            }
                        }, 500, 'screenTransition');
                    });
                }
            };

            // 渲染第一頁
            renderPage(this.currentWelcomePage);

            // 綁定下一頁函數
            this.nextWelcomePage = () => {
                this.currentWelcomePage++;
                renderPage(this.currentWelcomePage);
            };
        },

        // 開始簡單模式遊戲
        startEasyModeGame() {
            BarberKiosk.Debug.log('flow', ' 開始簡單模式遊戲');

            // ★★★ 重置票據狀態和步驟 ★★★
            this.state.gameState.ticketPrinted = false;
            this.state.gameState.paymentComplete = false;
            this.state.gameState.easyMode.currentStep = 'step1';
            BarberKiosk.Debug.log('flow', ' 重置狀態: ticketPrinted = false, currentStep = step1');

            // 重置付款狀態（避免累計錯誤）
            this.state.gameState.insertedAmount = 0;
            this.state.gameState.requiredAmount = 0;
            this.state.gameState.selectedService = null;

            // 添加簡單模式 class 到 body
            document.body.classList.add('easy-mode');

            this.audio.playSound('beep');
            this.render();
            this.bindEvents();

            // 重置投入口狀態（恢復可點擊）
            this.TimerManager.setTimeout(() => {
                const billSlotArea = document.querySelector('.bill-slot-area');
                const coinSlotArea = document.querySelector('.coin-slot-area');
                if (billSlotArea) {
                    billSlotArea.style.pointerEvents = '';
                    billSlotArea.style.opacity = '';
                    billSlotArea.style.cursor = '';
                }
                if (coinSlotArea) {
                    coinSlotArea.style.pointerEvents = '';
                    coinSlotArea.style.opacity = '';
                    coinSlotArea.style.cursor = '';
                }
            }, 100, 'uiAnimation');

            // 🔧 [A5架構] 任務彈窗顯示已移到 render() 函數內部，這裡不再處理

            // 簡單模式：顯示提示（延遲確保 DOM 完全渲染）
            this.TimerManager.setTimeout(() => {
                BarberKiosk.Debug.log('flow', ' 準備顯示提示，當前步驟:', this.state.gameState.easyMode.currentStep);
                BarberKiosk.Debug.log('flow', ' 指定服務:', this.state.gameState.easyMode.assignedService);
                this.showEasyModeHint();
            }, 1000);
        },

        // 開始普通/困難模式指定任務遊戲
        startAssignedModeGame(showPopup = true) {
            this.Debug.log('flow', '[Assigned Mode] 開始普通/困難模式指定任務遊戲', { showPopup });
            this.Debug.log('flow', '[Assigned Mode] 開始遊戲時 ticketPrinted =', this.state.gameState.ticketPrinted);

            // ★★★ 重置票據狀態和步驟 ★★★
            this.state.gameState.ticketPrinted = false;
            this.state.gameState.paymentComplete = false;
            this.state.gameState.normalMode.currentStep = 'step1';
            this.state.gameState.normalMode.errorCount = 0;
            this.Debug.log('flow', '[Assigned Mode] 重置狀態: ticketPrinted = false, currentStep = step1');

            // 重置付款狀態
            this.state.gameState.insertedAmount = 0;
            this.state.gameState.requiredAmount = 0;
            this.state.gameState.selectedService = null;

            // 重置普通/困難模式的投幣狀態
            this.state.gameState.normalMode.billsInserted = false;
            this.state.gameState.normalMode.coinsInserted = false;
            this.state.gameState.normalMode.tempSelectedMoney = [];

            this.audio.playSound('beep');
            this.render();
            this.bindEvents();

            // 更新入口狀態
            this.TimerManager.setTimeout(() => {
                this.updateSlotStatus();
            }, 100, 'uiAnimation');

            // 🔧 [A5架構] 任務彈窗顯示已移到 render() 函數內部，這裡不再處理
        },

        // 🔧 [A5架構] 顯示指定任務彈窗 - 完全參考 A5 的實現方式
        showTaskPopup() {
            const difficulty = this.state.settings.difficulty;
            const isEasyMode = difficulty === 'easy';
            const service = isEasyMode
                ? this.state.gameState.easyMode.assignedService
                : this.state.gameState.normalMode.assignedService;

            if (!service) {
                this.Debug.error('❌ [A2-Task Popup] 找不到已生成的指定服務');
                return;
            }

            // 🔧 [A5架構] 創建模態視窗元素（而不是用 innerHTML 字符串）
            const modal = document.createElement('div');
            modal.id = 'task-popup-overlay';
            modal.className = 'task-popup-modal';

            // coinFirst 模式：標題和說明文字不同（燈號亮起後切換文字）
            const isCoinFirst = this.isCoinFirstMode();
            const serviceAlreadyLit = isCoinFirst
                ? !!document.querySelector(`.service-item.coin-first-available[data-service-id="${service.id}"]`)
                : false;
            const popupTitle = isCoinFirst
                ? (serviceAlreadyLit ? '💡 請選擇服務' : '💰 先投幣再選服務')
                : '📋 您的任務';
            const popupDesc = isCoinFirst
                ? (serviceAlreadyLit
                    ? `${service.name}的燈號已亮起，請點選服務`
                    : `投入 <strong>NT$ ${service.price}</strong> 後，${service.name}的燈號就會亮起，再點選服務`)
                : '';

            modal.innerHTML = `
                <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="task-popup-title" onclick="event.stopPropagation();">
                    <div class="modal-header">
                        <h2 id="task-popup-title">${popupTitle}</h2>
                        <button class="close-modal-btn" onclick="event.stopPropagation(); event.preventDefault(); BarberKiosk.closeTaskPopup();">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="task-item-display">
                            <img src="${service.icon}" alt="${service.name}"
                                 onerror="this.style.display='none'">
                            <div class="item-info">
                                <h3 class="item-name">${service.name}</h3>
                                <p class="item-price">NT$ ${service.price}</p>
                                ${popupDesc ? `<p class="item-desc" style="font-size:0.85em;color:#666;margin-top:4px;">${popupDesc}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="start-task-btn" onclick="event.stopPropagation(); event.preventDefault(); BarberKiosk.closeTaskPopup();">
                            ${isCoinFirst ? (serviceAlreadyLit ? '去選服務' : '開始投幣') : '開始測驗'}
                        </button>
                    </div>
                </div>

                <style>
                    .task-popup-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(5px);
                        z-index: 10000;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        animation: modalFadeIn 0.3s ease-out;
                    }

                    .task-popup-modal .modal-content {
                        position: relative !important;
                        background: var(--macaron-card) !important;
                        border: 3px solid var(--macaron-pink) !important;
                        border-radius: 20px !important;
                        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3) !important;
                        max-width: 420px !important;
                        width: 90% !important;
                        max-height: 80vh !important;
                        overflow-y: auto !important;
                        animation: modalSlideIn 0.3s ease-out !important;
                        z-index: 10001 !important;
                        top: auto !important;
                        left: auto !important;
                        transform: none !important;
                    }

                    .task-popup-modal .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 25px 15px;
                        border-bottom: 2px solid #f0f0f0;
                    }

                    .task-popup-modal .modal-header h2 {
                        margin: 0;
                        color: var(--macaron-text);
                        font-size: 24px;
                        text-align: center;
                        flex: 1;
                        font-weight: 600;
                    }

                    .task-popup-modal .close-modal-btn {
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

                    .task-popup-modal .close-modal-btn:hover {
                        background: #f0f0f0;
                        color: #333;
                    }

                    .task-popup-modal .modal-body {
                        padding: 30px 25px;
                        text-align: center;
                    }

                    .task-popup-modal .task-item-display {
                        background: var(--macaron-pink);
                        border-radius: 16px;
                        padding: 30px 20px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }

                    .task-popup-modal .task-item-display img {
                        width: 160px;
                        height: 160px;
                        object-fit: contain;
                        margin-bottom: 20px;
                        display: block;
                        background: #F9FAFB;
                        border: 3px solid var(--border-light);
                        border-radius: 16px;
                        padding: 8px;
                    }

                    .task-popup-modal .item-info {
                        width: 100%;
                        text-align: center;
                    }

                    .task-popup-modal .item-name {
                        font-size: 26px;
                        color: var(--macaron-text);
                        margin: 0 0 12px 0;
                        font-weight: 700;
                    }

                    .task-popup-modal .item-price {
                        font-size: 24px;
                        color: var(--macaron-text-secondary);
                        margin: 0;
                        font-weight: 600;
                    }

                    .task-popup-modal .modal-footer {
                        padding: 20px 30px;
                        text-align: center;
                        border-top: 2px solid #f0f0f0;
                    }

                    .task-popup-modal .start-task-btn {
                        padding: 14px 45px;
                        background: var(--macaron-mint);
                        border: 2px solid var(--macaron-border);
                        border-radius: 24px;
                        color: var(--macaron-text);
                        font-size: 18px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        width: 100%;
                        max-width: 280px;
                    }

                    .task-popup-modal .start-task-btn:hover {
                        background: var(--macaron-blue);
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    }
                    /* @keyframes modalFadeIn/modalSlideIn 已移至 injectGlobalAnimationStyles() */
                </style>
            `;

            // 點擊外層遮罩關閉彈窗
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeTaskPopup();
                }
            });

            // 🔧 [A5架構] 將模態視窗添加到 body（而不是 insertAdjacentHTML）
            document.body.appendChild(modal);

            // 播放語音
            this.speech.speakCustom(`您的任務是${service.name}，請選擇正確的服務項目`);
        },

        // 🔧 [A5架構] 關閉任務彈窗 - 完全參考 A5 的實現方式
        closeTaskPopup() {
            // 🔧 [閃現修正] 清除任何pending的彈窗顯示timeout
            if (this._taskPopupTimeout) {
                this.TimerManager.clearTimeout(this._taskPopupTimeout);
                this._taskPopupTimeout = null;
                this.Debug.log('ui', '[Task Popup] 已清除pending的彈窗timeout');
            }

            // 🔧 [A5架構] 直接移除彈窗（不使用動畫延遲）
            const modal = document.getElementById('task-popup-overlay');
            if (modal) {
                modal.remove();
            }

            this.audio.playSound('beep');

            // 🔧 [A5架構] 設置標記，表示用戶已經看過任務彈窗，不要再顯示
            this._taskPopupDismissed = true;
            this._taskPopupScheduled = false;
            this.Debug.log('ui', '[Task Popup] 用戶已關閉任務彈窗，標記為已讀');

            // coinFirst 模式：關閉彈窗後播放投幣提示語音並顯示 easy 模式提示
            if (this.isCoinFirstMode()) {
                const difficulty = this.state.settings.difficulty;
                const taskType = this.state.settings.taskType;
                let assignedService = null;
                if (taskType === 'coinFirstAssigned') {
                    assignedService = difficulty === 'easy'
                        ? this.state.gameState.easyMode.assignedService
                        : this.state.gameState.normalMode.assignedService;
                }

                // 判斷服務燈號是否已亮起
                const serviceAlreadyLit = assignedService
                    ? !!document.querySelector(`.service-item.coin-first-available[data-service-id="${assignedService.id}"]`)
                    : !!document.querySelector('.service-item.coin-first-available');

                let speechMsg;
                if (serviceAlreadyLit && assignedService) {
                    speechMsg = `${assignedService.name}的燈號已亮起，請點選${assignedService.name}服務`;
                } else if (serviceAlreadyLit) {
                    speechMsg = '燈號已亮起，請點選服務';
                } else if (assignedService) {
                    speechMsg = `請先投幣，投入${this.convertAmountToSpeech(assignedService.price)}後，${assignedService.name}的燈號就會亮起`;
                } else {
                    speechMsg = '請先投幣，燈號亮起後再選擇服務';
                }

                this.speech.speakCustom(speechMsg, () => {
                    if (difficulty === 'easy') {
                        this.TimerManager.setTimeout(() => {
                            this.showEasyModeHint();
                        }, 200, 'uiAnimation');
                    }
                });
            }
        },

        // 🔧 [A5架構] 在界面渲染完成後判斷是否需要顯示任務彈窗
        // 參考 A5 的 showShoppingScreen() 最後的邏輯
        showTaskPopupIfNeeded() {
            // 檢查是否已經顯示過彈窗或已經排程顯示
            if (this._taskPopupDismissed || this._taskPopupScheduled) {
                this.Debug.log('ui', '[Task Popup] 用戶已看過任務彈窗或已排程顯示，跳過');
                return;
            }

            // 檢查是否有指定任務需要顯示
            const difficulty = this.state.settings.difficulty;
            const isEasyMode = difficulty === 'easy';
            const service = isEasyMode
                ? this.state.gameState.easyMode.assignedService
                : this.state.gameState.normalMode.assignedService;

            // 如果有指定任務，延遲 500ms 顯示任務彈窗（讓界面先渲染完成）
            if (service) {
                this.Debug.log('ui', '[Task Popup] 檢測到指定任務，準備顯示彈窗:', service.name);

                // coinFirst 模式：在顯示彈窗前先鎖定服務格子
                if (this.isCoinFirstMode()) {
                    this._lockServicesForCoinFirst();
                }

                // 🔧 [關鍵修正] 標記已排程，防止render()多次調用時重複排程
                this._taskPopupScheduled = true;
                // 🔧 [閃現修正] 儲存timeout ID，以便在關閉時可以清除
                this._taskPopupTimeout = this.TimerManager.setTimeout(() => {
                    this._taskPopupTimeout = null; // 清除timeout ID
                    // 再次檢查是否已被關閉（可能在延遲期間被快速關閉）
                    if (!this._taskPopupDismissed) {
                        this.showTaskPopup();
                    }
                }, 500, 'uiAnimation');
            } else if (this.isCoinFirstMode()) {
                // coinFirstFree（無指定服務）：直接鎖定服務格子並顯示引導語音
                this.Debug.log('ui', '[Task Popup] coinFirstFree 模式，鎖定服務格子並初始化');
                this._taskPopupScheduled = true;
                this.TimerManager.setTimeout(() => {
                    this._lockServicesForCoinFirst();
                    this._initCoinFirstScreen();
                }, 500, 'uiAnimation');
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
                BarberKiosk.Debug.log('timer', '🧹 [A2-TimerManager] 已清理所有計時器');
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
                    BarberKiosk.Debug.log('timer', `🧹 [A2-TimerManager] 已清理 ${count} 個 ${category} 類別計時器`);
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
                BarberKiosk.Debug.log('event', `🧹 [A2-EventManager] 已清理 ${count} 個事件監聯器`);
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
                    BarberKiosk.Debug.log('event', `🧹 [A2-EventManager] 已清理 ${count} 個 ${category} 類別事件監聽器`);
                }
            }
        },

        // ═══════════════════════════════════════════════════════════════════════════
        // 🎬 全局動畫樣式注入（避免重複定義）
        // ═══════════════════════════════════════════════════════════════════════════
        injectGlobalAnimationStyles() {
            if (document.getElementById('a2-global-animations')) return;

            const style = document.createElement('style');
            style.id = 'a2-global-animations';
            style.innerHTML = `
                /* 模態背景淡入 */
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                /* 模態內容縮放滑入 */
                @keyframes modalSlideIn {
                    from { transform: scale(0.7); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                /* 縮放上滑進場 */
                @keyframes slideInScale {
                    from { opacity: 0; transform: scale(0.8) translateY(-20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                /* 錯誤模態彈跳 */
                @keyframes errorModalBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
                /* 完成畫面慶祝 */
                @keyframes celebrate {
                    0% { transform: scale(0.8) rotate(-10deg); opacity: 0; }
                    50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                /* 完成畫面彈跳 */
                @keyframes completionBounce {
                    0%, 20%, 60%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-20px); }
                    80% { transform: translateY(-10px); }
                }
                /* 點擊模式脈衝（含中心定位） */
                @keyframes clickModePulse {
                    0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
                }
            `;
            document.head.appendChild(style);
            this.Debug.log('init', '🎬 全局動畫樣式注入完成');
        },

        // =====================================================
        // 初始化系統
        // =====================================================
        init() {
            BarberKiosk.Debug.log('init', ' 理髮店售票機系統啟動');

            // 🆕 清理舊計時器和事件監聽器
            this.TimerManager.clearAll();
            this.EventManager.removeAll();

            // 🎬 注入全局動畫樣式
            this.injectGlobalAnimationStyles();

            // 音效解鎖處理
            this.unlockAudio();

            // 初始化各系統
            this.audio.init();
            this.speech.init();

            // 🆕 綁定全局點擊攔截器（A5 輔助點擊模式機制）
            this.bindClickModeHandler();
            BarberKiosk.Debug.log('init', ' 全局點擊攔截器已綁定');

            // 設定語音系統事件監聽
            if ('speechSynthesis' in window) {
                speechSynthesis.addEventListener('voiceschanged', () => {
                    this.speech.setupVoice();
                }, { once: true });
            }

            // 顯示設定頁面
            this.showSettings();

            BarberKiosk.Debug.log('init', ' 系統初始化完成');
        },

        unlockAudio() {
            const unlockAudioContext = () => {
                this.state.audioUnlocked = true;
                BarberKiosk.Debug.log('init', ' 音頻已解鎖');

                document.removeEventListener('touchstart', unlockAudioContext);
                document.removeEventListener('touchend', unlockAudioContext);
                document.removeEventListener('mousedown', unlockAudioContext);
                document.removeEventListener('keydown', unlockAudioContext);
            };

            document.addEventListener('touchstart', unlockAudioContext, { once: true });
            document.addEventListener('touchend', unlockAudioContext, { once: true });
            document.addEventListener('mousedown', unlockAudioContext, { once: true });
            document.addEventListener('keydown', unlockAudioContext, { once: true });
        },

        // =====================================================
        // 渲染系統
        // =====================================================
        render() {
            const app = document.getElementById('app');
            if (!app) {
                this.Debug.error('[A2-Kiosk] 找不到app容器');
                return;
            }

            app.innerHTML = `
                ${this.HTMLTemplates.titleBar()}
                ${this.HTMLTemplates.kioskBody()}
            `;

            this.updateMoneyDisplay();

            // 普通/困難模式：更新入口狀態
            if (this.state.settings.difficulty !== 'easy') {
                this.TimerManager.setTimeout(() => {
                    this.updateSlotStatus();
                }, 100, 'uiAnimation');
            }

            // 🔧 [A5架構修正] 在界面渲染完成後，檢查是否需要顯示任務彈窗
            // 參考 A5 的 showShoppingScreen() 設計，將彈窗顯示邏輯移到這裡
            this.showTaskPopupIfNeeded();
        },

        updateScreen(content) {
            const screenContent = document.getElementById('screen-content');
            if (screenContent) {
                screenContent.innerHTML = content;
            }
        },

        updateMoneyDisplay() {
            const insertedAmountEl = document.getElementById('inserted-amount');
            const neededAmountEl = document.getElementById('needed-amount');
            const moneyStatusEl = document.getElementById('money-status');

            const _cfSvc = this.isCoinFirstMode()
                ? (this.state.gameState.easyMode?.assignedService || this.state.gameState.normalMode?.assignedService)
                : null;
            const _displayReq = _cfSvc ? _cfSvc.price : this.state.gameState.requiredAmount;
            if (insertedAmountEl) insertedAmountEl.textContent = this.state.gameState.insertedAmount;
            if (neededAmountEl) neededAmountEl.textContent = Math.max(0, _displayReq - this.state.gameState.insertedAmount);

            if (moneyStatusEl) {
                if (this.state.gameState.selectedService) {
                    if (this.state.gameState.insertedAmount >= this.state.gameState.requiredAmount) {
                        moneyStatusEl.textContent = '付款完成，請取票';
                        moneyStatusEl.style.color = '#4caf50';
                    } else {
                        moneyStatusEl.textContent = '請繼續投幣';
                        moneyStatusEl.style.color = '#f44336';
                    }
                } else {
                    moneyStatusEl.textContent = '請選擇服務項目';
                    moneyStatusEl.style.color = '#fff';
                }
            }
        },

        updateMoneyDisplayInScreen() {
            const insertedAmountScreenEl = document.getElementById('inserted-amount-screen');
            const neededAmountScreenEl = document.getElementById('needed-amount-screen');
            const moneyStatusScreenEl = document.getElementById('money-status-screen');

            const _cfSvcScreen = this.isCoinFirstMode()
                ? (this.state.gameState.easyMode?.assignedService || this.state.gameState.normalMode?.assignedService)
                : null;
            const _displayReqScreen = _cfSvcScreen ? _cfSvcScreen.price : this.state.gameState.requiredAmount;
            if (insertedAmountScreenEl) insertedAmountScreenEl.textContent = this.state.gameState.insertedAmount;
            if (neededAmountScreenEl) neededAmountScreenEl.textContent = Math.max(0, _displayReqScreen - this.state.gameState.insertedAmount);

            if (moneyStatusScreenEl) {
                const service = this.state.gameState.selectedService;

                if (service) {
                    // 已選擇服務
                    if (this.state.gameState.insertedAmount >= this.state.gameState.requiredAmount) {
                        // 付款完成
                        moneyStatusScreenEl.textContent = `${service.name} - 付款完成，請取票`;
                        moneyStatusScreenEl.style.color = '#4caf50';
                    } else if (this.state.gameState.insertedAmount > 0) {
                        // 投幣中
                        moneyStatusScreenEl.textContent = `${service.name} - 請繼續投幣`;
                        moneyStatusScreenEl.style.color = '#f44336';
                    } else {
                        // 剛選擇服務
                        moneyStatusScreenEl.textContent = `${service.name} - ${service.price}元`;
                        moneyStatusScreenEl.style.color = '#ffffff';
                    }
                } else {
                    // 未選擇服務
                    moneyStatusScreenEl.textContent = '請選擇服務項目';
                    moneyStatusScreenEl.style.color = '#ffffff';
                }
            }
        },

        // =====================================================
        // 主要操作流程
        // =====================================================
        showServiceSelection() {
            // coinFirst 模式：先投幣再選服務，步驟語義與原流程相反
            if (this.isCoinFirstMode()) {
                this.showCoinFirstScreen();
                return;
            }
            this.audio.playSound('beep');
            this.state.gameState.currentScene = 'service-selection';
            this.state.gameState.currentStep = 1;

            const difficulty = this.state.settings.difficulty;
            const services = this.serviceConfig[difficulty].services;

            this.updateScreen(this.HTMLTemplates.serviceSelectionScreen(services));
            this.speech.speak('welcome');
        },

        // =====================================================
        // coinFirst 模式：先投幣再選服務
        // =====================================================

        showCoinFirstScreen() {
            this.audio.playSound('beep');
            this._lockServicesForCoinFirst();
            this._initCoinFirstScreen();
        },

        // 鎖定服務（不播放語音）—— 用於 render() + 任務彈窗顯示前
        _lockServicesForCoinFirst() {
            // scene 設為 payment 讓 showMoneySelection / insertMoney 守衛放行
            this.state.gameState.currentScene = 'payment';
            this.state.gameState.currentStep = 1; // coinFirst step1 = 投幣

            // 設定 requiredAmount 為最高服務價格，作為超投保護上限
            const difficulty = this.state.settings.difficulty;
            const services = this.serviceConfig[difficulty].services;
            const maxPrice = Math.max(...services.map(s => s.price));
            this.state.gameState.requiredAmount = maxPrice;

            // 渲染服務格子（含 data-price 屬性）
            // coin-first-locked / coin-first-locked-wrapper 已在模板中直接帶入（同 A1 做法）
            this.updateScreen(this.HTMLTemplates.serviceSelectionScreen(services));

            // 確保 filter 生效（防止 transition:all 轉場或其他規則覆蓋）
            requestAnimationFrame(() => {
                document.querySelectorAll('.service-item.coin-first-locked').forEach(el => {
                    el.style.setProperty('filter', 'grayscale(80%) brightness(0.5)', 'important');
                    el.style.setProperty('opacity', '1', 'important');
                });
                document.querySelectorAll('.service-item-wrapper.coin-first-locked-wrapper').forEach(el => {
                    const light = el.querySelector('.indicator-light');
                    if (light) light.style.setProperty('filter', 'grayscale(80%) brightness(0.5)', 'important');
                });
            });
        },

        _initCoinFirstScreen() {
            const difficulty = this.state.settings.difficulty;
            const taskType = this.state.settings.taskType;

            // 更新螢幕狀態文字
            const statusEl = document.getElementById('money-status-screen');
            if (statusEl) statusEl.textContent = '請先投幣';
            const neededEl = document.getElementById('needed-amount-screen');
            if (neededEl) neededEl.textContent = '?';

            // 取得指定服務（coinFirstAssigned 模式）
            let assignedService = null;
            if (taskType === 'coinFirstAssigned') {
                assignedService = difficulty === 'easy'
                    ? this.state.gameState.easyMode.assignedService
                    : this.state.gameState.normalMode.assignedService;
            }

            let speechMsg;
            if (assignedService) {
                speechMsg = `請先投幣，投入${this.convertAmountToSpeech(assignedService.price)}後，${assignedService.name}的燈號就會亮起，再選擇服務`;
            } else {
                speechMsg = '請先投幣，投入與服務金額相同的金額後，燈號就會亮起，再選擇服務';
            }

            this.speech.speakCustom(speechMsg, () => {
                // 語音播完後顯示提示（easy 模式由 showEasyModeHint 處理，
                // normal/hard 由 showNormalModeHint 處理）
                if (difficulty === 'easy') {
                    this.showEasyModeHint();
                }
            });
        },

        // 簡單模式步驟驗證
        validateEasyModeAction(actionType, actionData) {
            if (this.state.settings.difficulty !== 'easy') return true;

            // 🆕【修復 16 + 修復 19】輔助點擊模式：繞過驗證，讓自動化流程順利執行
            const gs = this.state.gameState;
            if (gs.clickModeState && gs.clickModeState.enabled) {
                this.Debug.log('assist', '[A2-ClickMode] 輔助點擊模式已啟用，繞過簡單模式驗證:', actionType);
                return true;
            }

            const step = this.state.gameState.easyMode.currentStep;
            const taskType = this.state.settings.taskType;

            // coinFirst 模式步驟語義與原流程相反
            if (this.isCoinFirstMode()) {
                // coinFirst step1：應該投幣（不應選服務）
                if (step === 'step1') {
                    if (actionType === 'bill-slot' || actionType === 'coin-slot') {
                        return true; // 正確
                    }
                    // service 點擊由 selectService() 鎖定檢查處理，此處攔截其他錯誤動作
                    this.showEasyModeError(actionType);
                    return false;
                }
                // coinFirst step2：應該選服務（投幣完成後）
                if (step === 'step2') {
                    if (actionType === 'service') {
                        return true; // 正確（selectService() 已確認服務可用）
                    }
                    this.showEasyModeError(actionType);
                    return false;
                }
                // step3 邏輯同原流程，直接落入下方
            }

            // 步驟1：選擇服務
            if (step === 'step1') {
                if (actionType === 'service') {
                    // 自選服務模式：允許選擇任何服務
                    if (taskType === 'freeChoice') {
                        return true;
                    }

                    // 指定任務模式：只能選擇指定的服務
                    const assignedService = this.state.gameState.easyMode.assignedService;
                    if (assignedService && actionData === assignedService.id) {
                        return true; // 正確
                    } else {
                        this.showEasyModeError('service');
                        return false; // 錯誤
                    }
                } else {
                    this.showEasyModeError(actionType);
                    return false;
                }
            }

            // 步驟2：只能投幣（紙鈔投紙鈔口，硬幣投硬幣口）
            if (step === 'step2') {
                if (actionType === 'bill-slot' || actionType === 'coin-slot') {
                    return true; // 允許投幣
                } else {
                    this.showEasyModeError(actionType);
                    return false;
                }
            }

            // 步驟3：只能取票
            if (step === 'step3') {
                if (actionType === 'ticket') {
                    return true;
                } else {
                    this.showEasyModeError(actionType);
                    return false;
                }
            }

            return true;
        },

        // 顯示簡單模式錯誤
        showEasyModeError(actionType, targetElement = null) {
            this.audio.playSound('error02');

            // 如果沒有傳入目標元素，嘗試找到它
            if (!targetElement) {
                if (actionType === 'service') {
                    // 錯誤點擊服務項目 - 使用 event.target
                    targetElement = window.event?.target?.closest('.service-item');
                } else if (actionType === 'bill-slot' || actionType === 'coin-slot') {
                    // 錯誤點擊投幣口
                    targetElement = document.querySelector('.kiosk-left-panel');
                } else if (actionType === 'ticket' || actionType === 'ticket-area') {
                    // 錯誤點擊票券區
                    targetElement = document.querySelector('.ticket-dispenser-area');
                }
            }

            if (targetElement) {
                // 添加紅色×動畫和震動效果（不會讓元素消失）
                targetElement.classList.add('easy-mode-error', 'easy-mode-shake');
                this.TimerManager.setTimeout(() => {
                    // 只移除動畫類別，元素保持可見
                    targetElement.classList.remove('easy-mode-error', 'easy-mode-shake');
                }, 800, 'uiAnimation');
            }

            BarberKiosk.Debug.log('flow', ' 錯誤點擊:', actionType);
        },

        // ========================================
        // 🆕 A5 輔助點擊模式機制（視覺延遲與全局攔截）
        // ========================================

        /**
         * 🔧 啟用視覺同步延遲機制
         * 核心創新：等待視覺提示出現後 0.5秒 才允許點擊
         * 參考：A5 ATM enableClickModeWithVisualDelay
         * @param {string} source - 觸發來源（用於調試）
         */
        enableClickModeWithVisualDelay(source = 'unknown') {
            if (this.state.settings.difficulty !== 'easy') return;

            const gs = this.state.gameState;

            // 1. 立即鎖定，防止畫面剛出來瞬間的誤觸
            gs.clickModeState.waitingForClick = false;

            // 清除舊的計時器（如果有的話）
            if (gs.clickModeState._visualDelayTimer) {
                this.TimerManager.clearTimeout(gs.clickModeState._visualDelayTimer);
            }

            // 2. 檢測是否已有視覺提示在畫面上
            const existingHintElement = document.querySelector('.correct-money-hint, .easy-mode-hint');

            if (existingHintElement) {
                // 視覺提示已存在，立即解鎖（因為用戶已經看到了）
                this.Debug.log('assist', `[A2-ClickMode] 🔍 視覺提示已存在 (${source})，立即解鎖`);
                gs.clickModeState.waitingForClick = true;
                // 🔧 時間回溯：讓系統認為「已經準備好很久了」
                gs.clickModeState.clickReadyTime = Date.now() - 1000;
                gs.clickModeState.isExecuting = false;
            } else {
                // 視覺提示尚未出現，等待 0.5秒 後解鎖
                this.Debug.log('assist', `[A2-ClickMode] 🔒 視覺元素出現 (${source})，啟動 0.5秒 安全鎖定...`);

                gs.clickModeState._visualDelayTimer = this.TimerManager.setTimeout(() => {
                    if (gs.clickModeState) {
                        gs.clickModeState.waitingForClick = true;
                        // 🔧 時間回溯 1000ms
                        gs.clickModeState.clickReadyTime = Date.now() - 1000;
                        gs.clickModeState.isExecuting = false;
                        this.Debug.log('assist', `[A2-ClickMode] 🟢 0.5秒已過，解除鎖定 (已繞過防誤觸檢查)`);
                    }
                }, 500, 'clickMode');

                // 🛡️ 安全網：1.5秒後強制解鎖（防止系統卡死）
                this.TimerManager.setTimeout(() => {
                    if (gs.clickModeState && !gs.clickModeState.waitingForClick) {
                        this.Debug.log('assist', `[A2-ClickMode] ⚠️ 無視覺提示，啟動安全網解鎖 (${source})`);
                        gs.clickModeState.waitingForClick = true;
                        gs.clickModeState.clickReadyTime = Date.now() - 1000;
                        gs.clickModeState.isExecuting = false;
                    }
                }, 1500, 'clickMode');
            }
        },

        /**
         * 🔧 全局點擊攔截器
         * 參考：A5 ATM handleClickModeClick
         */
        interceptClickModeClick(event) {
            if (this.state.settings.difficulty !== 'easy') return;

            const gs = this.state.gameState;

            // 🆕【修復 31】如果輔助點擊模式未啟用，直接放行（設定頁面等）
            if (!gs.clickModeState || !gs.clickModeState.enabled) {
                return;
            }

            // 🆕【修復 32】歡迎畫面階段放行所有點擊（允許用戶導航）
            if (gs.clickModeState?.currentPhase === 'welcome') {
                return;
            }

            // 🆕【修復 29】viewTicket 階段放行所有點擊（與 Fix 28 對應）
            // 原因：此階段等待用戶手動點擊完成按鈕，必須放行以觸發 onclick
            if (gs.clickModeState?.currentPhase === 'viewTicket') {
                this.Debug.log('assist', '[A2-ClickMode] viewTicket 階段，interceptor 放行');
                return;
            }

            // 🆕【修復 33】selectService 階段放行所有點擊（允許用戶觸發自動執行）
            // 原因：此階段需要等待用戶點擊任何地方來觸發動作隊列執行
            if (gs.clickModeState?.currentPhase === 'selectService') {
                this.Debug.log('assist', '[A2-ClickMode] selectService 階段，interceptor 放行');
                return;
            }

            // 🆕【修復 34】payment 階段放行所有點擊（允許用戶觸發付款序列執行）
            // 原因：付款隊列建立後需要用戶點擊來觸發 executeNextAction()
            if (gs.clickModeState?.currentPhase === 'payment') {
                this.Debug.log('assist', '[A2-ClickMode] payment 階段，interceptor 放行');
                return;
            }

            // 🆕【修復 35】printTicket 階段放行所有點擊（允許用戶觸發列印票券）
            // 原因：列印票券隊列建立後需要用戶點擊來觸發 executeNextAction()
            if (gs.clickModeState?.currentPhase === 'printTicket') {
                this.Debug.log('assist', '[A2-ClickMode] printTicket 階段，interceptor 放行');
                return;
            }

            // 1. 程式觸發的點擊直接放行
            if (!event.isTrusted) {
                this.Debug.log('assist', '[A2-ClickMode] 🟢 程式觸發的點擊，放行');
                return;
            }

            // 2. 檢查是否在等待點擊狀態
            if (!gs.clickModeState.waitingForClick) {
                this.Debug.log('assist', '[A2-ClickMode] ⏳ 尚未解除鎖定，忽略點擊');
                // 🆕【優化】播放「鎖定」音效，提示用戶尚未就緒
                this.audio.playSound('error02');
                event.stopPropagation();
                event.preventDefault();
                return;
            }

            // 3. 防快速點擊：600ms 安全鎖（比 A2 原來的 300ms 更安全）
            const now = Date.now();
            const readyTime = gs.clickModeState.clickReadyTime || 0;
            const timeSinceReady = now - readyTime;

            if (timeSinceReady < 600) {
                this.Debug.log('assist', `[A2-ClickMode] ⏳ 點擊過快，忽略 (${timeSinceReady}ms < 600ms)`);
                // 🆕【優化】提供視覺反饋：抖動提示元素
                this.shakeHintAnimation();
                // 🆕【優化】播放「過快」音效，提示用戶點擊太快
                this.audio.playSound('error02');
                event.stopPropagation();
                event.preventDefault();
                return;
            }

            // 4. 白名單檢查：某些元素允許直接點擊
            const target = event.target;
            const isWhiteListed =
                target.closest('.service-item') ||
                target.closest('.individual-money-item') ||
                target.closest('.bill-slot-area') ||
                target.closest('.coin-slot-area') ||
                target.closest('.ticket-output') ||
                target.closest('.modal-content') ||
                target.closest('button');

            if (isWhiteListed) {
                this.Debug.log('assist', '[A2-ClickMode] 🟢 白名單元素，放行');
                // 更新最後點擊時間
                gs.clickModeState.lastClickTime = now;
                return; // 放行
            }

            // 5. 非白名單元素，攔截
            this.Debug.log('assist', '[A2-ClickMode] 🔴 非白名單元素，攔截');
            event.stopPropagation();
            event.preventDefault();
        },

        /**
         * 🆕【優化】抖動提示動畫（點擊過快時的視覺反饋）
         */
        shakeHintAnimation() {
            const hints = document.querySelectorAll('.easy-mode-hint, .correct-money-hint');
            if (hints.length === 0) return;

            hints.forEach(hint => {
                // 添加抖動動畫（@keyframes shake 已定義於 CSS）
                hint.style.animation = 'shake 0.3s ease-in-out';

                // 動畫結束後清除
                this.TimerManager.setTimeout(() => {
                    hint.style.animation = '';
                }, 300, 'uiAnimation');
            });
            // 🔧 [Phase 2] @keyframes shake 已移至 CSS (a2_barber_shop_kiosk.css:2602)
        },

        /**
         * 🆕【優化】檢查並恢復卡住的狀態
         */
        checkAndRecoverClickModeState() {
            const gs = this.state.gameState;

            // 只在輔助點擊模式啟用時檢查
            if (!gs.clickModeState || !gs.clickModeState.enabled) return;

            // 🆕【修復】正在等待使用者操作屬於正常狀態，不視為卡住
            if (gs.clickModeState.waitingForClick || gs.clickModeState.waitingForStart) {
                gs.clickModeState.lastUpdateTime = Date.now();
                return;
            }

            const now = Date.now();
            const lastUpdate = gs.clickModeState.lastUpdateTime || now;

            // 檢查是否卡住（超過 30 秒沒有進展）
            if (now - lastUpdate > 30000) {
                this.Debug.error('[A2-ClickMode] ⚠️ 檢測到卡住狀態，嘗試恢復');
                this.recoverClickModeState();
            }
        },

        /**
         * 🆕【優化】恢復點擊模式狀態
         */
        recoverClickModeState() {
            const gs = this.state.gameState;

            this.Debug.log('assist', '[A2-ClickMode] 🔧 恢復點擊模式狀態');

            // 清除所有計時器
            if (gs.clickModeState._visualDelayTimer) {
                this.TimerManager.clearTimeout(gs.clickModeState._visualDelayTimer);
                gs.clickModeState._visualDelayTimer = null;
            }
            if (gs.clickModeState._printCheckActive) {
                BarberKiosk.TimerManager.clearByCategory('autoAction');
                gs.clickModeState._printCheckActive = false;
            }

            // 🆕【修復】根據當前階段設置正確的等待狀態
            if (gs.clickModeState.currentPhase === 'welcome') {
                // welcome 階段使用 waitingForStart
                gs.clickModeState.waitingForStart = true;
                gs.clickModeState.waitingForClick = false;
            } else {
                // 其他階段使用 waitingForClick
                gs.clickModeState.waitingForClick = true;
                gs.clickModeState.waitingForStart = false;
            }
            gs.clickModeState.isExecuting = false;
            gs.clickModeState.clickReadyTime = Date.now() - 1000;

            // 更新最後更新時間
            gs.clickModeState.lastUpdateTime = Date.now();

            // 顯示提示
            this.showStartPrompt();

            this.Debug.log('assist', '[A2-ClickMode] ✅ 狀態已恢復');
        },

        /**
         * 🆕【優化 15】顯示進度指示器
         * 讓用戶知道當前在哪個階段
         */
        showPhaseIndicator(currentPhase) {
            // 移除舊的指示器
            const oldIndicator = document.getElementById('phase-indicator');
            if (oldIndicator) {
                oldIndicator.remove();
            }

            // 階段定義（coinFirst 模式使用不同的階段列表）
            const isCoinFirst = this.isCoinFirstMode();
            const phases = isCoinFirst ? [
                { id: 'welcome', label: '歡迎', icon: '👋' },
                { id: 'coinFirstInsert', label: '投幣', icon: '💰' },
                { id: 'coinFirstSelect', label: '選服務', icon: '✂️' },
                { id: 'printTicket', label: '列印票券', icon: '🎫' },
                { id: 'viewTicket', label: '查看票券', icon: '👁️' }
            ] : [
                { id: 'welcome', label: '歡迎', icon: '👋' },
                { id: 'selectService', label: '選擇服務', icon: '✂️' },
                { id: 'payment', label: '付款', icon: '💰' },
                { id: 'printTicket', label: '列印票券', icon: '🎫' },
                { id: 'viewTicket', label: '查看票券', icon: '👁️' }
            ];

            // 找到當前階段索引
            const currentIndex = phases.findIndex(p => p.id === currentPhase);
            if (currentIndex === -1) return; // 無效階段

            // 創建指示器容器
            const indicator = document.createElement('div');
            indicator.id = 'phase-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 255, 255, 0.95);
                border: 2px solid #4CAF50;
                border-radius: 25px;
                padding: 8px 20px;
                display: flex;
                gap: 15px;
                align-items: center;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                font-family: Arial, sans-serif;
            `;

            // 創建階段項目（只顯示相關階段）
            phases.forEach((phase, index) => {
                // 跳過歡迎階段（不顯示在指示器中）
                if (phase.id === 'welcome') return;

                const phaseItem = document.createElement('div');
                phaseItem.className = 'phase-item';

                // 判斷狀態
                const isCompleted = index < currentIndex;
                const isActive = index === currentIndex;

                phaseItem.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 14px;
                    font-weight: ${isActive ? 'bold' : 'normal'};
                    background: ${isActive ? '#4CAF50' : isCompleted ? '#E8F5E9' : '#F5F5F5'};
                    color: ${isActive ? 'white' : isCompleted ? '#4CAF50' : '#999'};
                    transition: all 0.3s ease;
                `;

                // 圖標
                const icon = document.createElement('span');
                icon.textContent = isCompleted ? '✓' : phase.icon;
                icon.style.cssText = `
                    font-size: 16px;
                `;

                // 文字
                const label = document.createElement('span');
                label.textContent = phase.label;

                phaseItem.appendChild(icon);
                phaseItem.appendChild(label);
                indicator.appendChild(phaseItem);
            });

            // 添加到頁面
            document.body.appendChild(indicator);

            this.Debug.log('assist', '[A2-ClickMode] 📊 進度指示器已更新:', currentPhase);
        },

        /**
         * 🆕【優化 15】隱藏進度指示器
         */
        hidePhaseIndicator() {
            const indicator = document.getElementById('phase-indicator');
            if (indicator) {
                indicator.style.opacity = '0';
                this.TimerManager.setTimeout(() => indicator.remove(), 300, 'uiAnimation');
            }
        },

        /**
         * 🔧 綁定全局點擊事件處理器
         * 參考：A5 ATM bindClickModeHandler
         */
        bindClickModeHandler() {
            if (this._clickModeHandlerBound) {
                this.Debug.log('assist', '[A2-ClickMode] 事件處理器已綁定，跳過重複綁定');
                return;
            }

            this.Debug.log('assist', '[A2-ClickMode] 綁定全局點擊事件處理器');

            // 綁定到文檔級別（capture phase）
            document.addEventListener('click', (e) => this.interceptClickModeClick(e), true);

            this._clickModeHandlerBound = true;
        },

        // 顯示簡單模式提示
        showEasyModeHint() {
            if (this.state.settings.difficulty !== 'easy') return;

            const step = this.state.gameState.easyMode.currentStep;
            this.Debug.log('hint', '[Easy Mode Hint] 步驟:', step);

            // 移除所有現有提示
            document.querySelectorAll('.easy-mode-hint').forEach(el => {
                el.classList.remove('easy-mode-hint');
            });

            // ★★★ 重置投幣口的禁用狀態（清除之前設置的樣式）★★★
            const billSlotArea = document.querySelector('.bill-slot-area');
            const coinSlotArea = document.querySelector('.coin-slot-area');
            if (billSlotArea) {
                billSlotArea.style.pointerEvents = '';
                billSlotArea.style.opacity = '';
                billSlotArea.style.cursor = '';
            }
            if (coinSlotArea) {
                coinSlotArea.style.pointerEvents = '';
                coinSlotArea.style.opacity = '';
                coinSlotArea.style.cursor = '';
            }
            this.Debug.log('hint', '[Easy Mode Hint] 已重置投幣口狀態');

            // coinFirst 模式步驟語義相反
            if (this.isCoinFirstMode()) {
                if (step === 'step1') {
                    // coinFirst step1：提示投幣口（根據錢包組成決定先幣還是先鈔）
                    const walletCoins = this.state.gameState.easyMode.walletCoins;
                    const hasBills = walletCoins?.bills?.length > 0;
                    const hasCoins = walletCoins?.coins?.length > 0;
                    const billSlotArea = document.querySelector('.bill-slot-area');
                    const coinSlotArea = document.querySelector('.coin-slot-area');

                    // 設定正確金額組合（所有錢包金額都是答案）
                    const correctAmounts = [];
                    if (walletCoins?.bills) correctAmounts.push(...walletCoins.bills);
                    if (walletCoins?.coins) correctAmounts.push(...walletCoins.coins);
                    this.state.gameState.easyMode.correctAmounts = correctAmounts;

                    // 優先提示對應面額的入口
                    const assignedService = this.state.gameState.easyMode.assignedService;
                    const price = assignedService?.price || 0;
                    const coinTotal = walletCoins?.coins?.reduce((s, c) => s + c, 0) || 0;

                    if (price > 0 && price <= coinTotal && hasCoins && coinSlotArea) {
                        // 只需硬幣就能付款，先提示硬幣口
                        coinSlotArea.classList.add('easy-mode-hint');
                    } else if (hasBills && billSlotArea) {
                        billSlotArea.classList.add('easy-mode-hint');
                    } else if (hasCoins && coinSlotArea) {
                        coinSlotArea.classList.add('easy-mode-hint');
                    }

                    this.enableClickModeWithVisualDelay('CoinFirst-Step1-Slot');
                    return;
                }
                if (step === 'step2') {
                    // coinFirst step2：提示已亮起的服務
                    const taskType = this.state.settings.taskType;
                    const assignedService = this.state.gameState.easyMode.assignedService;
                    let targetEl = null;
                    if (taskType === 'coinFirstAssigned' && assignedService) {
                        targetEl = document.querySelector(`.service-item.coin-first-available[data-service-id="${assignedService.id}"]`);
                    } else {
                        targetEl = document.querySelector('.service-item.coin-first-available');
                    }
                    if (targetEl) {
                        targetEl.classList.add('easy-mode-hint');
                        this.enableClickModeWithVisualDelay('CoinFirst-Step2-Service');
                    }
                    return;
                }
                // step3 同原流程，繼續往下
            }

            // 步驟1：提示點擊指定服務
            if (step === 'step1') {
                const assignedServiceId = this.state.gameState.easyMode.assignedService?.id;
                this.Debug.log('hint', '[Easy Mode Hint] 指定服務ID:', assignedServiceId);
                if (assignedServiceId) {
                    const serviceItem = document.querySelector(`.service-item[data-service-id="${assignedServiceId}"]`);
                    this.Debug.log('hint', '[Easy Mode Hint] 找到服務項目:', serviceItem);
                    if (serviceItem) {
                        serviceItem.classList.add('easy-mode-hint');
                        this.Debug.log('hint', '[Easy Mode Hint] 已添加提示動畫到服務項目');

                        // 🆕 啟動 0.5秒 視覺延遲機制
                        this.enableClickModeWithVisualDelay('Step1-Service');
                    } else {
                        this.Debug.warn('hint', '[Easy Mode Hint] 找不到服務項目元素');
                    }
                }
            }

            // 步驟2：根據錢包內容提示投幣口
            if (step === 'step2') {
                const walletCoins = this.state.gameState.easyMode.walletCoins;
                const hasBills = walletCoins && walletCoins.bills && walletCoins.bills.length > 0;
                const hasCoins = walletCoins && walletCoins.coins && walletCoins.coins.length > 0;

                this.Debug.log('hint', '[Easy Mode Hint] 錢包內容 - 紙鈔:', hasBills, '硬幣:', hasCoins);

                // ★★★ 設置正確金額組合（簡單模式+指定任務：所有錢包中的金額都是正確答案）★★★
                const correctAmounts = [];
                if (walletCoins) {
                    if (walletCoins.bills) {
                        correctAmounts.push(...walletCoins.bills);
                    }
                    if (walletCoins.coins) {
                        correctAmounts.push(...walletCoins.coins);
                    }
                }
                this.state.gameState.easyMode.correctAmounts = correctAmounts;
                this.Debug.log('hint', '[Easy Mode Hint] 設置正確金額組合:', correctAmounts);

                const billSlotArea = document.querySelector('.bill-slot-area');
                const coinSlotArea = document.querySelector('.coin-slot-area');

                // ★★★ 付款順序邏輯：優先硬幣，如需紙鈔則先付紙鈔再付硬幣 ★★★
                const requiredAmount = this.state.gameState.requiredAmount;
                const insertedAmount = this.state.gameState.insertedAmount || 0;
                const remainingAmount = requiredAmount - insertedAmount;

                // 計算硬幣總額
                let coinTotal = 0;
                if (walletCoins && walletCoins.coins) {
                    coinTotal = walletCoins.coins.reduce((sum, coin) => sum + coin, 0);
                }

                this.Debug.log('hint', '[Easy Mode Hint] 剩餘需付:', remainingAmount, '硬幣總額:', coinTotal, '有紙鈔:', hasBills, '有硬幣:', hasCoins);

                // 判斷付款策略
                if (remainingAmount <= coinTotal && hasCoins) {
                    // 策略1：只需要硬幣就能完成付款，優先提示硬幣
                    if (coinSlotArea) {
                        coinSlotArea.classList.add('easy-mode-hint');
                        this.Debug.log('hint', '[Easy Mode Hint] 硬幣足夠，優先提示硬幣入口');
                    }
                    // 禁用紙鈔入口
                    if (billSlotArea) {
                        billSlotArea.style.pointerEvents = 'none';
                        billSlotArea.style.opacity = '0.5';
                        billSlotArea.style.cursor = 'not-allowed';
                        this.Debug.log('hint', '[Easy Mode Hint] 硬幣足夠，禁用紙鈔入口');
                    }
                } else if (hasBills && hasCoins) {
                    // 策略2：需要紙鈔+硬幣，先提示紙鈔
                    if (billSlotArea) {
                        billSlotArea.classList.add('easy-mode-hint');
                        this.Debug.log('hint', '[Easy Mode Hint] 需要紙鈔+硬幣，先提示紙鈔入口');
                    }
                    // 暫時禁用硬幣入口（付完紙鈔後會重新調用此函數）
                    if (coinSlotArea) {
                        coinSlotArea.style.pointerEvents = 'none';
                        coinSlotArea.style.opacity = '0.5';
                        coinSlotArea.style.cursor = 'not-allowed';
                        this.Debug.log('hint', '[Easy Mode Hint] 需先付紙鈔，暫時禁用硬幣入口');
                    }
                } else if (hasBills && !hasCoins) {
                    // 策略3：只有紙鈔
                    if (billSlotArea) {
                        billSlotArea.classList.add('easy-mode-hint');
                        this.Debug.log('hint', '[Easy Mode Hint] 只有紙鈔，提示紙鈔入口');
                    }
                    // 禁用硬幣入口
                    if (coinSlotArea) {
                        coinSlotArea.style.pointerEvents = 'none';
                        coinSlotArea.style.opacity = '0.5';
                        coinSlotArea.style.cursor = 'not-allowed';
                        this.Debug.log('hint', '[Easy Mode Hint] 無硬幣，禁用硬幣入口');
                    }
                } else if (!hasBills && hasCoins) {
                    // 策略4：只有硬幣
                    if (coinSlotArea) {
                        coinSlotArea.classList.add('easy-mode-hint');
                        this.Debug.log('hint', '[Easy Mode Hint] 只有硬幣，提示硬幣入口');
                    }
                    // 禁用紙鈔入口
                    if (billSlotArea) {
                        billSlotArea.style.pointerEvents = 'none';
                        billSlotArea.style.opacity = '0.5';
                        billSlotArea.style.cursor = 'not-allowed';
                        this.Debug.log('hint', '[Easy Mode Hint] 無紙鈔，禁用紙鈔入口');
                    }
                }

                this.Debug.log('hint', '[Easy Mode Hint] 付款提示設置完成');

                // 🆕 啟動 0.5秒 視覺延遲機制
                this.enableClickModeWithVisualDelay('Step2-Payment');
            }

            // 步驟3：提示整個票券出口區域
            if (step === 'step3') {
                // 修改：提示按鈕和票券所在的整個區域，避免意外觸發事件
                const ticketArea = document.querySelector('.ticket-dispenser-area');
                if (ticketArea) {
                    ticketArea.classList.add('easy-mode-hint');
                    this.Debug.log('hint', '[Easy Mode Hint] 已添加提示到票券區域');

                    // 🆕 啟動 0.5秒 視覺延遲機制
                    this.enableClickModeWithVisualDelay('Step3-Ticket');
                }
            }
        },

        // ========== 普通/困難模式：統一的步驟管理系統 ==========

        /**
         * 處理普通/困難模式的操作驗證
         * @param {string} actionType - 操作類型：'selectService', 'insertBill', 'insertCoin', 'takeTicket'
         * @returns {boolean} - true: 錯誤操作已處理, false: 正確操作
         */
        handleNormalModeAction(actionType) {
            // 只在普通/困難模式生效
            if (this.state.settings.difficulty === 'easy') return false;

            const currentStep = this.state.gameState.normalMode.currentStep;
            let isWrongAction = false;

            switch (currentStep) {
                case 'step1':
                    if (this.isCoinFirstMode()) {
                        // coinFirst step1：應該投幣
                        if (actionType === 'insertBill' || actionType === 'insertCoin') {
                            isWrongAction = false; // 正確操作
                        } else if (actionType === 'takeTicket') {
                            isWrongAction = true; // 錯誤：尚未投幣就想取票
                        }
                        // selectService/selectWrongService 已由 selectService() 鎖定檢查處理
                        break;
                    }
                    // 原流程步驟1：應該選擇（正確的）服務
                    if (actionType === 'selectWrongService') {
                        // 選錯服務（指定任務模式）
                        isWrongAction = true;
                    } else if (actionType !== 'selectService') {
                        // 點擊了其他區域（投幣口、票券口等）
                        isWrongAction = true;
                    }
                    break;

                case 'step2':
                    if (this.isCoinFirstMode()) {
                        // coinFirst step2：應該選服務（投幣完成後）
                        if (actionType === 'selectService') {
                            isWrongAction = false; // 正確操作
                        } else if (actionType === 'insertBill' || actionType === 'insertCoin') {
                            isWrongAction = true; // 錯誤：已投幣，應選服務
                        } else if (actionType === 'takeTicket') {
                            isWrongAction = true;
                        }
                        // selectWrongService 不應發生（locked 服務被 selectService() 攔截）
                        break;
                    }
                    // 原流程步驟2：應該投幣（特殊處理：已付完的投入口不計錯誤）
                    if (actionType === 'insertBill' || actionType === 'insertCoin') {
                        // 檢查是否還需要該類型的投幣
                        const requiredAmount = this.state.gameState.requiredAmount;
                        const insertedAmount = this.state.gameState.insertedAmount;
                        const remainingAmount = requiredAmount - insertedAmount;

                        if (remainingAmount <= 0) {
                            // 已付完，但還在step2，這是正常情況（等待系統處理）
                            this.Debug.log('flow', '[Normal Mode] Step2 已付款完成，忽略投幣操作');
                            return false; // 不計錯誤
                        }

                        if (actionType === 'insertBill' && remainingAmount < 100) {
                            // 只需要硬幣了，點擊紙鈔口不計錯誤
                            this.Debug.log('flow', '[Normal Mode] Step2 只需要硬幣，紙鈔口點擊不計錯誤');
                            return false; // 不計錯誤
                        }

                        // 其他情況都是正確操作
                        isWrongAction = false;
                    } else if (actionType === 'selectService') {
                        // 自選服務模式：允許重新選擇服務，不計錯誤
                        if (this.state.settings.taskType === 'freeChoice') {
                            this.Debug.log('flow', '[Normal Mode] Step2 自選服務模式：允許重新選擇服務');
                            return false; // 不計錯誤，允許重新選擇
                        } else {
                            // 指定任務模式：不允許重新選擇
                            isWrongAction = true;
                        }
                    } else {
                        // 點擊了非投幣口且非服務項目（如票券口）
                        isWrongAction = true;
                    }
                    break;

                case 'step3':
                    // 步驟3：應該取票
                    if (actionType !== 'takeTicket') {
                        isWrongAction = true;
                    }
                    break;
            }

            if (isWrongAction) {
                // 累計錯誤次數
                this.state.gameState.normalMode.errorCount++;
                this.state.gameState.normalMode.totalErrors++;
                if (window.TutorContext) TutorContext.update({ errorCount: this.state.gameState.normalMode.errorCount });

                this.Debug.log('flow', `[Normal Mode] Step ${currentStep} 錯誤: ${actionType}, 累計: ${this.state.gameState.normalMode.errorCount}`);

                // 播放錯誤音效
                this.audio.playSound('error');

                // 普通模式：錯誤3次自動顯示提示（困難模式不自動顯示）
                if (this.state.settings.difficulty === 'normal' &&
                    this.state.gameState.normalMode.errorCount >= 3 &&
                    !this.state.gameState.normalMode.hintShown) {
                    this.showNormalModeHint();
                }

                return true; // 是錯誤操作
            }

            return false; // 是正確操作
        },

        /**
         * 提示前歸還已投入金額至錢包，確保從完整錢包重新計算提示組合
         */
        _restoreInsertedMoneyForHint() {
            if (this.state.gameState.insertedAmount <= 0) return;
            const usedAmounts = this.state.gameState.normalMode.usedAmounts || [];
            const walletCoins = this.state.gameState.normalMode.walletCoins;
            if (walletCoins && usedAmounts.length > 0) {
                usedAmounts.forEach(amount => {
                    if (amount >= 100) walletCoins.bills.push(amount);
                    else walletCoins.coins.push(amount);
                });
                walletCoins.bills.sort((a, b) => b - a);
                walletCoins.coins.sort((a, b) => b - a);
            }
            this.state.gameState.insertedAmount = 0;
            this.state.gameState.normalMode.billsInserted = false;
            this.state.gameState.normalMode.coinsInserted = false;
            this.state.gameState.normalMode.usedAmounts = [];
            this.state.gameState.normalMode.correctAmounts = null;
            this.updateMoneyDisplay();
            this.updateMoneyDisplayInScreen();
            this.Debug.log('hint', '[Hint Reset] 歸還已投入金額至錢包，重新從頭計算提示組合。錢包:', walletCoins);
        },

        /**
         * 顯示普通/困難模式提示（黃色光暈）
         */
        showNormalModeHint() {
            const step = this.state.gameState.normalMode.currentStep;

            this.Debug.log('flow', `[Normal Mode] 顯示 Step ${step} 提示`);

            // 移除舊提示
            document.querySelectorAll('.easy-mode-hint').forEach(el => {
                el.classList.remove('easy-mode-hint');
            });

            switch (step) {
                case 'step1': {
                    if (this.isCoinFirstMode()) {
                        // coinFirst step1 提示：先歸還已投入金額，再從完整錢包計算提示
                        this._restoreInsertedMoneyForHint();

                        const taskType = this.state.settings.taskType;
                        const assignedService = this.state.gameState.normalMode.assignedService;
                        const walletCoins = this.state.gameState.normalMode.walletCoins;

                        // 計算精確組合（reset 後 correctAmounts 一定為 null，強制重新計算）
                        if (walletCoins && !this.state.gameState.normalMode.correctAmounts) {
                            const allMoney = [...(walletCoins.bills || []), ...(walletCoins.coins || [])];
                            const targetPrice = assignedService?.price || 0;
                            if (targetPrice > 0) {
                                const exact = this.findExactCombination(allMoney, targetPrice);
                                if (exact) {
                                    this.state.gameState.normalMode.correctAmounts = exact;
                                }
                            }
                        }

                        const correctCombination = this.state.gameState.normalMode.correctAmounts;
                        const billSlot = document.querySelector('.bill-slot-area');
                        const coinSlot = document.querySelector('.coin-slot-area');

                        if (correctCombination && correctCombination.length > 0) {
                            const needsBills = correctCombination.some(a => a >= 100);
                            const needsCoins = correctCombination.some(a => a < 100);
                            const billsInserted = this.state.gameState.normalMode.billsInserted;
                            if (needsBills && !billsInserted && billSlot) {
                                billSlot.classList.add('easy-mode-hint');
                                this.speech.speakCustom('請投入紙鈔');
                            } else if (needsCoins && coinSlot) {
                                coinSlot.classList.add('easy-mode-hint');
                                this.speech.speakCustom('請投入硬幣');
                            } else if (needsBills && billSlot) {
                                billSlot.classList.add('easy-mode-hint');
                                this.speech.speakCustom('請投入紙鈔');
                            }
                        } else {
                            // 無法計算組合時，提示紙鈔口作為備用
                            if (billSlot) billSlot.classList.add('easy-mode-hint');
                            else if (coinSlot) coinSlot.classList.add('easy-mode-hint');
                            this.speech.speakCustom('請先投幣，燈號亮起後再選擇服務');
                        }
                        break;
                    }

                    // 原流程 step1：普通/困難模式統一改為彈窗提示
                    const taskType = this.state.settings.taskType;
                    const assignedService = this.state.gameState.normalMode.assignedService;

                    this.Debug.log('hint', '[Normal Mode Hint] Step1 - taskType:', taskType, 'assignedService:', assignedService);

                    if (taskType === 'assigned' && assignedService) {
                        // 指定任務：顯示任務彈窗（普通+困難模式均適用）
                        this.Debug.log('hint', '[Normal Mode Hint] 指定任務：顯示任務彈窗');
                        this.showTaskPopup();
                        return;
                    } else {
                        // 自選任務：光暈動畫提示整個服務選擇區域
                        const serviceGrid = document.querySelector('.service-grid');
                        if (serviceGrid) {
                            serviceGrid.classList.add('easy-mode-hint');
                        }
                        this.speech.speakCustom('請選擇一個服務項目');
                    }
                    break;
                }

                case 'step2':
                    if (this.isCoinFirstMode()) {
                        // coinFirst step2 提示：高亮已亮起的服務項目
                        const taskType2 = this.state.settings.taskType;
                        if (taskType2 === 'coinFirstAssigned') {
                            this.showTaskPopup();
                        } else {
                            // coinFirstFree：高亮所有已亮燈的服務
                            const availableItems = document.querySelectorAll('.service-item.coin-first-available');
                            availableItems.forEach(el => el.classList.add('easy-mode-hint'));
                            this.speech.speakCustom('請點選已亮燈的服務項目');
                        }
                        break;
                    }
                    // 付款彈窗已開啟時不重複提示（彈窗內有專屬的付款提示）
                    if (document.getElementById('money-selection-modal')) break;
                    // 先歸還已投入金額，從完整錢包重新計算正確提示組合
                    this._restoreInsertedMoneyForHint();
                    // ★★★ 修正：根據剩餘需要支付的金額來決定提示哪個入口 ★★★
                    const requiredAmount = this.state.gameState.requiredAmount;
                    const insertedAmount = this.state.gameState.insertedAmount;
                    const remainingAmount = requiredAmount - insertedAmount;

                    if (remainingAmount <= 0) {
                        // 已付完，不應該在此步驟，應該已進入step3
                        this.Debug.log('flow', '[Normal Mode] Step2 已付款完成，不顯示提示');
                        break;
                    }

                    // 取得入口元素
                    const billSlot = document.querySelector('.bill-slot-area');
                    const coinSlot = document.querySelector('.coin-slot-area');

                    // 取得錢包狀態和入口使用狀態
                    const walletCoins = this.state.gameState.normalMode.walletCoins;
                    const billsInserted = this.state.gameState.normalMode.billsInserted;
                    const coinsInserted = this.state.gameState.normalMode.coinsInserted;
                    const hasBills = walletCoins && walletCoins.bills.length > 0;
                    const hasCoins = walletCoins && walletCoins.coins.length > 0;

                    this.Debug.log('hint', '[Normal Mode Hint] Step2 - 剩餘金額:', remainingAmount, '紙鈔已投:', billsInserted, '硬幣已投:', coinsInserted);

                    // 🔧 [新增] 計算並設置正確的金額組合，讓付款視窗能顯示綠色提示
                    let correctCombination = this.state.gameState.normalMode.correctAmounts;
                    if (walletCoins && !correctCombination) {
                        const allMoney = [...walletCoins.bills, ...walletCoins.coins];
                        const exactCombination = this.findExactCombination(allMoney, requiredAmount);

                        if (exactCombination) {
                            this.state.gameState.normalMode.correctAmounts = exactCombination;
                            correctCombination = exactCombination;
                            this.Debug.log('hint', '[Normal Mode Hint] 設置正確金額組合:', exactCombination);
                        } else {
                            this.Debug.error('[Normal Mode Hint] 找不到精確組合');
                        }
                    }

                    // 🔧 [修正] 根據正確組合中需要什麼來決定提示哪個入口
                    if (correctCombination && correctCombination.length > 0) {
                        // 檢查正確組合中有沒有紙鈔（面額 >= 100）
                        const needsBills = correctCombination.some(amount => amount >= 100);
                        const needsCoins = correctCombination.some(amount => amount < 100);

                        this.Debug.log('hint', '[Normal Mode Hint] 正確組合需要 - 紙鈔:', needsBills, '硬幣:', needsCoins);

                        if (needsBills && hasBills && !billsInserted && billSlot) {
                            // 正確組合需要紙鈔，且還沒投入紙鈔
                            billSlot.classList.add('easy-mode-hint');
                            this.speech.speakCustom('請投入紙鈔');
                            this.Debug.log('hint', '[Normal Mode Hint] 提示紙鈔入口（正確組合需要紙鈔）');
                        } else if (needsCoins && hasCoins && !coinsInserted && coinSlot) {
                            // 正確組合需要硬幣，且還沒投入硬幣
                            coinSlot.classList.add('easy-mode-hint');
                            this.speech.speakCustom('請投入硬幣');
                            this.Debug.log('hint', '[Normal Mode Hint] 提示硬幣入口（正確組合需要硬幣）');
                        } else if (needsBills && billsInserted && needsCoins && hasCoins && !coinsInserted && coinSlot) {
                            // 紙鈔已投，現在需要硬幣
                            coinSlot.classList.add('easy-mode-hint');
                            this.speech.speakCustom('請投入硬幣');
                            this.Debug.log('hint', '[Normal Mode Hint] 提示硬幣入口（紙鈔已投，需要硬幣）');
                        }
                    } else {
                        // 沒有正確組合，使用舊邏輯作為備用
                        this.Debug.warn('hint', '[Normal Mode Hint] 沒有正確組合，使用剩餘金額判斷');
                        if (remainingAmount >= 100 && hasBills && !billsInserted && billSlot) {
                            billSlot.classList.add('easy-mode-hint');
                            this.speech.speakCustom('請投入紙鈔');
                        } else if (hasCoins && !coinsInserted && coinSlot) {
                            coinSlot.classList.add('easy-mode-hint');
                            this.speech.speakCustom('請投入硬幣');
                        }
                    }
                    break;

                case 'step3':
                    // 提示票券區域
                    const ticketArea = document.querySelector('.ticket-dispenser-area');
                    if (ticketArea) {
                        ticketArea.classList.add('easy-mode-hint');
                    }
                    this.speech.speakCustom('請點擊取走票據');
                    break;
            }

            this.state.gameState.normalMode.hintShown = true;
        },

        /**
         * 移除普通/困難模式提示
         */
        removeNormalModeHint() {
            document.querySelectorAll('.easy-mode-hint').forEach(el => {
                el.classList.remove('easy-mode-hint');
            });
        },

        /**
         * 付款錯誤三次後顯示提示並鎖定正確金額
         */
        showPaymentHintAfterErrors() {
            this.Debug.log('hint', '[Payment Hint] 顯示付款提示並鎖定正確金額');
            // 先歸還已投入金額，確保從完整錢包計算精確組合
            this._restoreInsertedMoneyForHint();

            let requiredAmount = this.state.gameState.requiredAmount;
            if (this.isCoinFirstMode()) {
                const _svc = this.state.gameState.normalMode?.assignedService;
                if (_svc) requiredAmount = _svc.price;
            }
            const walletCoins = this.state.gameState.normalMode.walletCoins;

            if (!walletCoins) {
                this.Debug.error('[Payment Hint] 錢包不存在');
                return;
            }

            this.Debug.log('hint', '[Payment Hint] 錢包內容 - 紙鈔:', walletCoins.bills, '硬幣:', walletCoins.coins);
            this.Debug.log('hint', '[Payment Hint] 需要金額:', requiredAmount);

            // 找出精確組合（等於服務價格的金額組合）
            const allMoney = [...walletCoins.bills, ...walletCoins.coins];
            this.Debug.log('hint', '[Payment Hint] 所有可用金額:', allMoney);

            const exactCombination = this.findExactCombination(allMoney, requiredAmount);

            if (!exactCombination) {
                this.Debug.error('[Payment Hint] 找不到精確組合');
                this.speech.speakCustom('錢包中的金額無法湊成所需金額，請重新開始');
                return;
            }

            this.Debug.log('hint', '[Payment Hint] 找到精確組合:', exactCombination, '總和:', exactCombination.reduce((a,b) => a+b, 0));

            // 儲存正確金額組合
            this.state.gameState.normalMode.correctAmounts = exactCombination;

            // ★★★ 設置提示已顯示標記 ★★★
            this.state.gameState.normalMode.hintShown = true;
            this.Debug.log('hint', '[Payment Hint] 已設置 hintShown = true');

            // 判斷需要哪些入口
            const needsBills = exactCombination.some(amount => amount >= 100);
            const needsCoins = exactCombination.some(amount => amount < 100);
            const billsInserted = this.state.gameState.normalMode.billsInserted;
            const coinsInserted = this.state.gameState.normalMode.coinsInserted;

            // 顯示提示動畫在下一個需要點擊的入口
            const billSlot = document.querySelector('.bill-slot-area');
            const coinSlot = document.querySelector('.coin-slot-area');

            if (needsBills && !billsInserted) {
                // 需要投紙鈔且還沒投
                if (billSlot) {
                    billSlot.classList.add('easy-mode-hint');
                    this.speech.speakCustom('請投入紙鈔，已標示正確的金額');
                }
            } else if (needsCoins && !coinsInserted) {
                // 需要投硬幣且還沒投
                if (coinSlot) {
                    coinSlot.classList.add('easy-mode-hint');
                    this.speech.speakCustom('請投入硬幣，已標示正確的金額');
                }
            }
        },

        /**
         * 找出精確組合（等於目標金額的組合）
         */
        findExactCombination(amounts, target) {
            this.Debug.log('hint', '[Find Combination] 開始尋找組合，金額列表:', amounts, '目標:', target);

            // 使用動態規劃找出一個精確組合
            const n = amounts.length;

            // dp[i][j] 表示使用前 i 個金額能否湊成 j
            // parent[i][j] 記錄狀態轉移路徑
            const dp = Array(n + 1).fill(null).map(() => Array(target + 1).fill(false));
            const parent = Array(n + 1).fill(null).map(() => Array(target + 1).fill(null));

            // 初始狀態：不使用任何金額，湊成0元
            for (let i = 0; i <= n; i++) {
                dp[i][0] = true;
            }

            // 填充 DP 表
            for (let i = 1; i <= n; i++) {
                const amount = amounts[i - 1];
                for (let j = 0; j <= target; j++) {
                    // 不使用第 i 個金額
                    if (dp[i - 1][j]) {
                        dp[i][j] = true;
                        if (!parent[i][j]) {
                            parent[i][j] = { use: false, prevAmount: j };
                        }
                    }

                    // 使用第 i 個金額
                    if (j >= amount && dp[i - 1][j - amount]) {
                        dp[i][j] = true;
                        parent[i][j] = { use: true, prevAmount: j - amount, amount: amount };
                    }
                }
            }

            if (!dp[n][target]) {
                this.Debug.log('hint', '[Find Combination] 找不到組合');
                return null; // 無法湊成目標金額
            }

            // 回溯找出使用的金額
            const result = [];
            let i = n;
            let j = target;

            while (i > 0 && j > 0) {
                const p = parent[i][j];
                if (!p) break;

                if (p.use) {
                    result.push(p.amount);
                    j = p.prevAmount;
                }
                i--;
            }

            this.Debug.log('hint', '[Find Combination] 找到組合:', result, '總和:', result.reduce((a, b) => a + b, 0));
            return result;
        },

        /**
         * 推進到下一步驟（普通/困難模式）
         */
        advanceNormalModeStep(nextStep) {
            const currentStep = this.state.gameState.normalMode.currentStep;

            this.Debug.log('flow', `[Normal Mode] 從 ${currentStep} 進入 ${nextStep}`);

            // 移除當前提示
            this.removeNormalModeHint();

            // 更新步驟並重置錯誤計數
            this.state.gameState.normalMode.currentStep = nextStep;
            this.state.gameState.normalMode.errorCount = 0;
            this.state.gameState.normalMode.hintShown = false;
        },

        // 自動提示觸發（計時器到期後呼叫）
        _fireAutoHint() {
            const step = this.state.gameState.normalMode.currentStep;
            if (step && !this.state.gameState.normalMode.hintShown) {
                this.showNormalModeHint();
            }
        },

        /**
         * 🆕【修復 50】普通/困難模式：手動觸發提示按鈕
         */
        showHintButtonClick() {
            // 🆕【修復 50】允許普通模式和困難模式使用提示按鈕
            if (this.state.settings.difficulty !== 'hard' && this.state.settings.difficulty !== 'normal') return;

            // 🔧 [新增] 防止手機端重複觸發（touchstart + click）
            const now = Date.now();
            if (this._lastHintTime && now - this._lastHintTime < 500) {
                this.Debug.log('flow', '[Normal/Hard Mode] 防抖：忽略重複點擊提示按鈕');
                return;
            }
            this._lastHintTime = now;

            this.Debug.log('flow', '[Normal/Hard Mode] 手動觸發提示');

            this.audio.playSound('click');
            this.showNormalModeHint();
        },

        selectService(serviceId) {
            // 防止手機端重複觸發
            const now = Date.now();
            if (this._lastServiceSelectTime && now - this._lastServiceSelectTime < 300) {
                this.Debug.log('service', '[Service] 防抖：忽略重複點擊');
                return;
            }
            this._lastServiceSelectTime = now;

            // coinFirst 模式：鎖定服務檢查（在一般驗證之前）
            if (this.isCoinFirstMode()) {
                const el = document.querySelector(`.service-item[data-service-id="${serviceId}"]`);
                if (el?.classList.contains('coin-first-locked')) {
                    this.audio.playSound('error');
                    const price = parseInt(el.dataset.price);
                    const inserted = this.state.gameState.insertedAmount;
                    this.speech.speakCustom(inserted === 0
                        ? '請先投幣，燈號亮起後才能選擇服務'
                        : `這個服務需要${this.convertAmountToSpeech(price)}，請投入正確金額`);
                    return;
                }
                // 服務未鎖定（coin-first-available）：允許繼續
            }

            // 簡單模式驗證
            if (!this.validateEasyModeAction('service', serviceId)) {
                return;
            }

            const difficulty = this.state.settings.difficulty;
            const isEasyMode = difficulty === 'easy';
            const service = this.serviceConfig[difficulty].services.find(s => s.id === serviceId);

            if (!service) {
                this.Debug.error('[A2-Kiosk] 找不到服務:', serviceId);
                return;
            }

            // 普通/困難模式驗證：檢查指定任務
            if (difficulty !== 'easy') {
                const taskType = this.state.settings.taskType;
                const assignedService = this.state.gameState.normalMode.assignedService;

                // 如果是指定任務，檢查是否選對
                if ((taskType === 'assigned' || taskType === 'coinFirstAssigned') && assignedService) {
                    if (service.id !== assignedService.id) {
                        // 選錯了！計入錯誤
                        this.handleNormalModeAction('selectWrongService');
                        this.audio.playSound('error');
                        this.speech.speakCustom(`選錯了，請選擇 ${assignedService.name}`);
                        return;
                    }
                }

                // 選對了或自選任務，檢查是否在正確步驟
                if (this.handleNormalModeAction('selectService')) {
                    return; // 錯誤操作，已處理
                }

                // 🎆 [防止重複] 只在第一次選擇正確服務時觸發煙火（步驟驗證通過後）
                if ((taskType === 'assigned' || taskType === 'coinFirstAssigned') && assignedService && service.id === assignedService.id) {
                    this.Debug.log('service', '[Service] 普通/困難模式：選擇正確服務，觸發煙火');
                    this.playSuccessFireworks();
                }
            }

            // 簡單模式：檢查是否為指定任務且選對了
            if (isEasyMode) {
                const taskType = this.state.settings.taskType;
                const assignedService = this.state.gameState.easyMode.assignedService;
                if (assignedService) {
                    if (taskType === 'coinFirstAssigned' && service.id !== assignedService.id) {
                        // coinFirstAssigned 簡單模式：其他亮起的服務不可選
                        this.audio.playSound('error');
                        this.speech.speakCustom(`選錯了，請選擇 ${assignedService.name}`);
                        return;
                    }
                    if (service.id === assignedService.id) {
                        // 🎆 簡單模式選對了！觸發煙火和音效
                        this.Debug.log('service', '[Service] 簡單模式：選擇正確服務，觸發煙火');
                        this.playSuccessFireworks();
                    }
                }
            }

            this.audio.playSound('beep');

            // 🔧 [新增] 自選服務模式：如果重新選擇服務，退還已投入的金額
            if (this.state.settings.taskType === 'freeChoice' &&
                this.state.gameState.selectedService &&
                this.state.gameState.insertedAmount > 0) {

                this.Debug.log('service', '[Service] 自選服務模式：重新選擇服務，退還已投入金額');

                // 退還已投入的金額到錢包
                const insertedAmount = this.state.gameState.insertedAmount;
                const tempSelectedMoney = this.state.gameState.normalMode.tempSelectedMoney || [];

                if (tempSelectedMoney.length > 0) {
                    // 將已投入的錢退回錢包
                    tempSelectedMoney.forEach(value => {
                        if (value >= 100) {
                            this.state.gameState.normalMode.walletCoins.bills.push(value);
                        } else {
                            this.state.gameState.normalMode.walletCoins.coins.push(value);
                        }
                    });

                    this.Debug.log('service', '[Service] 退還金額:', insertedAmount, '元，退還幣值:', tempSelectedMoney);
                }

                // 重置投入金額和已選金錢
                this.state.gameState.insertedAmount = 0;
                this.state.gameState.normalMode.tempSelectedMoney = [];
                this.state.gameState.normalMode.billsInserted = false;
                this.state.gameState.normalMode.coinsInserted = false;
            }

            // 🆕【修復 51】選擇服務後，移除服務選擇階段的提示動畫（黃色光暈）
            if (difficulty !== 'easy') {
                this.removeNormalModeHint();
                this.Debug.log('ui', '[Fix 51] 選擇服務後，移除提示動畫');
            }

            this.state.gameState.selectedService = service;
            this.state.gameState.requiredAmount = service.price;
            this.state.gameState.currentScene = 'payment';
            if (window.TutorContext) TutorContext.update({ phase: 'payment' });
            this.state.gameState.currentStep = 2;

            // 簡單模式：進入步驟2
            if (this.state.settings.difficulty === 'easy') {
                this.state.gameState.easyMode.currentStep = 'step2';

                // 檢查是否為自選服務模式
                const taskType = this.state.settings.taskType;
                if (taskType === 'freeChoice') {
                    // 自選服務：提示會在服務語音播放完畢後自動顯示（見上方的語音回調）
                    this.Debug.log('flow', '[Easy Free Choice] 選擇服務，等待語音播放完畢後顯示提示');
                } else {
                    // 🆕【修復】輔助點擊模式：立即顯示提示，避免延遲導致提示在點擊後才出現
                    const isClickMode = this.state.settings.clickMode &&
                                       this.state.gameState.clickModeState?.enabled;

                    if (isClickMode) {
                        // 輔助點擊模式：立即顯示提示
                        this.Debug.log('assist', '[A2-ClickMode] 服務選擇完成，立即顯示付款提示');
                        this.showEasyModeHint();
                    } else {
                        // 一般模式：延遲顯示提示
                        this.TimerManager.setTimeout(() => {
                            this.showEasyModeHint();
                        }, 800, 'uiAnimation');
                    }
                }
            } else {
                // 普通/困難模式：進入步驟2
                this.advanceNormalModeStep('step2');

                // 重置投幣狀態（選擇服務後可以重新投幣）
                this.state.gameState.normalMode.billsInserted = false;
                this.state.gameState.normalMode.coinsInserted = false;
                this.state.gameState.normalMode.tempSelectedMoney = [];

                // 更新入口狀態
                this.TimerManager.setTimeout(() => {
                    this.updateSlotStatus();
                }, 100, 'uiAnimation');
            }

            // 只更新狀態，不移除再添加（避免觸發動畫）
            // 先取消其他項目的選擇，並標記為已動畫過
            document.querySelectorAll('.service-item').forEach(item => {
                if (item.dataset.serviceId !== serviceId) {
                    item.classList.remove('selected');
                    item.classList.add('animated'); // 標記為已動畫過，避免重複播放動畫
                }
            });
            document.querySelectorAll('.indicator-light').forEach(light => {
                const indicator = light.closest('.service-indicator');
                if (indicator && indicator.dataset.serviceId !== serviceId) {
                    light.classList.remove('active');
                }
            });

            // 点亮选中的服务灯号
            const selectedIndicator = document.querySelector(`.service-indicator[data-service-id="${serviceId}"] .indicator-light`);
            if (selectedIndicator) {
                selectedIndicator.classList.add('active');
            }

            // 高亮选中的服务（如果尚未選擇）
            const selectedItem = document.querySelector(`.service-item[data-service-id="${serviceId}"]`);
            if (selectedItem && !selectedItem.classList.contains('selected')) {
                selectedItem.classList.add('selected');
                selectedItem.classList.add('animated'); // 標記為已動畫過
            }

            // 更新画面中的金额显示
            this.updateMoneyDisplayInScreen();

            // coinFirst 模式：付款已完成（投幣在選服務之前），直接進入列印
            if (this.isCoinFirstMode()) {
                this.completePayment();
                return;
            }

            // 完整播报服务选择信息，包含不找零提示
            // 簡單模式 + 自選服務：語音播放完畢後顯示投幣口提示
            const isEasyFreeChoice = this.state.settings.difficulty === 'easy' &&
                                     this.state.settings.taskType === 'freeChoice';

            this.speech.speak('serviceSelected', {
                serviceName: service.name,
                price: service.price
            }, isEasyFreeChoice ? () => {
                this.Debug.log('flow', '[Easy Free Choice] 服務語音播放完畢，顯示投幣口提示');
                this.showEasyFreeChoiceHint(service.price);
            } : null);
        },

        // 顯示金錢選擇模態窗口
        showMoneySelection(type) {
            // 簡單模式驗證
            const actionType = type === 'bill' ? 'bill-slot' : 'coin-slot';
            if (!this.validateEasyModeAction(actionType)) {
                return;
            }

            // 普通/困難模式驗證（根據類型傳入不同的 actionType）
            const normalModeActionType = type === 'bill' ? 'insertBill' : 'insertCoin';
            if (this.handleNormalModeAction(normalModeActionType)) {
                return; // 錯誤操作，已處理
            }

            if (!this.isCoinFirstMode() && (this.state.gameState.currentScene !== 'payment' || !this.state.gameState.selectedService)) {
                this.audio.playSound('error');
                this.showPaymentError('請先選擇服務項目');
                return;
            }

            // 提示模式下不再限制點選哪個入口，綠色勾勾已在彈窗內引導使用者

            // 🆕【修復 51】打開金額彈窗時，移除付款入口的提示動畫（黃色光暈）
            if (this.state.settings.difficulty !== 'easy') {
                this.removeNormalModeHint();
                this.Debug.log('ui', '[Fix 51] 打開金額彈窗，移除提示動畫');
            }

            const modalHTML = this.state.settings.difficulty === 'easy'
                ? this.HTMLTemplates.moneySelectionModal(type)
                : this.HTMLTemplates.walletPaymentModal(type);
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer.firstElementChild);

            // 添加顯示動畫
            const modal = document.getElementById('money-selection-modal');
            if (modal) {
                modal.classList.add('show');
            }

            this.audio.playSound('click');
        },

        // 關閉金錢選擇模態窗口
        closeMoneySelection() {
            const modal = document.getElementById('money-selection-modal');
            if (modal) {
                modal.remove();
            }

            // ★★★ 簡單模式：關閉modal後，如果還沒付完款，重新調用提示函數更新提示 ★★★
            if (this.state.settings.difficulty === 'easy') {
                const insertedAmount = this.state.gameState.insertedAmount || 0;
                const requiredAmount = this.state.gameState.requiredAmount || 0;

                if (insertedAmount < requiredAmount) {
                    BarberKiosk.Debug.log('flow', ' Modal關閉，還需付款，重新顯示提示');
                    // 延遲一下讓DOM更新完成
                    this.TimerManager.setTimeout(() => {
                        const taskType = this.state.settings.taskType;
                        if (taskType === 'freeChoice') {
                            // 自選服務：調用自選服務提示函數
                            const servicePrice = this.state.gameState.requiredAmount;
                            this.showEasyFreeChoiceHint(servicePrice);
                        } else {
                            // 指定任務：調用指定任務提示函數
                            this.showEasyModeHint();
                        }
                    }, 300, 'uiAnimation');
                } else {
                    // 🆕【修復】付款完成時，立即移除付款提示動畫
                    BarberKiosk.Debug.log('flow', ' Modal關閉，付款完成，移除提示動畫');
                    const billSlot = document.querySelector('.bill-slot-area');
                    const coinSlot = document.querySelector('.coin-slot-area');
                    if (billSlot) billSlot.classList.remove('easy-mode-hint');
                    if (coinSlot) coinSlot.classList.remove('easy-mode-hint');
                }
            }
        },

        // 選擇金錢並投入
        selectMoney(amount, slotType, itemIndex = 0) {
            // 簡單模式：驗證紙鈔/硬幣是否投入正確的口
            if (this.state.settings.difficulty === 'easy') {
                const isBill = amount >= 100; // 100, 500, 1000 是紙鈔
                const isCoin = amount < 100;  // 1, 5, 10, 50 是硬幣

                if (slotType === 'bill' && isCoin) {
                    this.audio.playSound('error02');
                    this.showPaymentError('硬幣不能投入紙鈔入口！');
                    return;
                }

                if (slotType === 'coin' && isBill) {
                    this.audio.playSound('error02');
                    this.showPaymentError('紙鈔不能投入硬幣入口！');
                    return;
                }

                // 🆕【修復 48】簡單模式：如果有正確金額提示，只允許點擊有綠色勾勾的金額
                const correctAmounts = this.state.gameState.easyMode.correctAmounts;
                const itemElement = document.getElementById(`money-${slotType}-${amount}-${itemIndex}`);

                // 如果有correctAmounts，且有提示，則只能點擊有提示的金額
                if (correctAmounts && correctAmounts.length > 0) {
                    if (!itemElement || !itemElement.classList.contains('correct-money-hint')) {
                        this.Debug.log('payment', '[Easy Mode Payment] 只能選擇有綠色勾勾的金額');
                        this.audio.playSound('error');
                        this.speech.speakCustom('請選擇有綠色勾勾的金額');
                        return;
                    }
                }

                // 添加投入動畫並隱藏該項目
                if (itemElement) {
                    itemElement.classList.add('money-inserted');
                    // 等待動畫完成後移除元素
                    this.TimerManager.setTimeout(() => {
                        itemElement.remove();
                    }, 300, 'uiAnimation');
                }

                // 從錢包中移除已投入的金額（根據索引位置移除）
                const walletCoins = this.state.gameState.easyMode.walletCoins;
                if (slotType === 'bill') {
                    if (itemIndex < walletCoins.bills.length) {
                        walletCoins.bills.splice(itemIndex, 1);
                    }
                } else {
                    if (itemIndex < walletCoins.coins.length) {
                        walletCoins.coins.splice(itemIndex, 1);
                    }
                }

                // 投入金額（不播放語音，跳過防抖檢查以支援快速點擊）
                this.insertMoney(amount, false, true);

                // coinFirst 模式：更新服務亮燈狀態
                if (this.isCoinFirstMode()) {
                    this.updateServiceAvailabilityByAmount();
                }

                // 檢查是否還有剩餘的紙鈔/硬幣
                const remainingItems = document.querySelectorAll('.individual-money-item:not(.money-inserted)');
                const isLastItem = remainingItems.length === 0;

                // 🆕【修復 48】簡單模式 + 自選服務：檢查當前彈窗中是否還有帶綠色勾勾的正確金額
                const remainingCorrectItems = document.querySelectorAll('.individual-money-item.correct-money-hint:not(.money-inserted)');
                const hasMoreCorrectItems = remainingCorrectItems.length > 0;
                const isEasyFreeChoice = this.state.settings.taskType === 'freeChoice';

                this.Debug.log('payment', '[Easy Mode Payment] 剩餘項目:', remainingItems.length, '剩餘正確項目:', remainingCorrectItems.length);

                // 延遲一小段時間確保 DOM 更新完成，然後立即播放語音（參考 a5 的做法）
                this.TimerManager.setTimeout(() => {
                    const currentAmount = this.state.gameState.insertedAmount;
                    const requiredAmount = this.state.gameState.requiredAmount;
                    const stillNeeded = Math.max(0, requiredAmount - currentAmount);

                    // 🆕【修復 24】簡化語音提示：播放累加後的總金額，例如「20元」
                    let speechText = `${this.convertAmountToSpeech(currentAmount)}`;

                    this.Debug.log('speech', '[Easy Mode Speech] 準備播放語音:', speechText, 'isLastItem:', isLastItem, 'paymentComplete:', stillNeeded === 0);

                    // 🆕【修復 39】只在付款真正完成時清除 isExecuting 標誌（修正 Fix 38）
                    // 原因：Fix 38 錯誤使用 OR 條件，導致紙鈔用完時就清除標誌，即使還差硬幣
                    //      正確邏輯：只有 stillNeeded === 0 才代表付款真正完成
                    const gs = this.state.gameState;
                    if (gs.clickModeState?.enabled && gs.clickModeState.isExecuting) {
                        if (stillNeeded === 0) {
                            // ✓ 付款完成：清除標誌，允許 callback 執行 completePayment()
                            this.Debug.log('assist', '[A2-ClickMode] 付款完成（金額已達標），清除 isExecuting 標誌，允許 callback 執行');
                            this.Debug.log('assist', `[A2-ClickMode] 已投入: ${currentAmount}元, 需要: ${requiredAmount}元, 剩餘: ${stillNeeded}元`);
                            gs.clickModeState.isExecuting = false;
                        } else {
                            // ✓ 付款未完成：保持標誌，防止彈窗過早關閉
                            this.Debug.log('assist', '[A2-ClickMode] 付款未完成，保持 isExecuting=true 防止彈窗關閉');
                            this.Debug.log('assist', `[A2-ClickMode] 已投入: ${currentAmount}元, 需要: ${requiredAmount}元, 剩餘: ${stillNeeded}元`);
                            this.Debug.log('assist', `[A2-ClickMode] isLastItem: ${isLastItem}, hasMoreCorrectItems: ${hasMoreCorrectItems}`);
                        }
                    }

                    // 🆕【修復】輔助點擊模式執行中時，不要自動關閉視窗
                    const isClickModeExecuting = this.state.gameState.clickModeState?.enabled &&
                                                 this.state.gameState.clickModeState?.isExecuting;

                    // 當金額達到要求 OR 錢包用完 OR (自選服務且當前彈窗的正確金額都投完了) 時，播放語音後自動關閉弹窗
                    // 🆕【修復】但如果是輔助點擊模式執行中，則不自動關閉，讓操作隊列控制關閉時機
                    if (!isClickModeExecuting && (isLastItem || stillNeeded === 0 || (isEasyFreeChoice && !hasMoreCorrectItems))) {
                        // 最後一個金額或付款完成：播放語音，並在完成後的回呼中執行後續所有操作
                        this.speech.speakCustom(speechText, () => {
                            this.Debug.log('flow', '[Fix] 語音播放完成，執行關閉視窗並完成付款');
                            this.closeMoneySelection();
                            // ★★★ 關鍵：將 completePayment() 移到語音回呼中，避免競速問題 ★★★
                            if (this.state.gameState.insertedAmount >= this.state.gameState.requiredAmount) {
                                // 🎆 簡單模式指定任務：付款正確時觸發煙火和音效
                                this.Debug.log('payment', '[Easy Mode Payment] 付款正確，檢查是否觸發煙火');
                                this.playSuccessFireworks();

                                this.completePayment();
                            }
                        }, true);
                    } else {
                        // 非最後一個金額且未付完：立即播放語音（會中斷前一個）
                        this.speech.speakCustom(speechText, null, true);
                    }
                }, 500, 'speechDelay');
            } else {
                // 非簡單模式：點擊後直接關閉
                this.insertMoney(amount);
                this.closeMoneySelection();
            }
        },

        /**
         * 普通/困難模式：選擇金額（不立即投入，而是暫存）
         */
        selectMoneyNormalMode(amount, slotType, itemIndex) {
            this.Debug.log('payment', '[Normal Mode Payment] 選擇金額:', amount, 'slotType:', slotType, 'itemIndex:', itemIndex);

            const tempSelected = this.state.gameState.normalMode.tempSelectedMoney;

            // 🆕【修復 48】如果已顯示提示，只允許點擊有綠色勾勾的金額
            const itemElement = document.getElementById(`money-${slotType}-${amount}-${itemIndex}`);
            if (this.state.gameState.normalMode.hintShown) {
                // 檢查是否有正確金額提示的 class
                if (!itemElement || !itemElement.classList.contains('correct-money-hint')) {
                    this.Debug.log('payment', '[Normal Mode Payment] 提示模式下，只能選擇有綠色勾勾的金額');
                    this.audio.playSound('error');
                    this.speech.speakCustom('請選擇有綠色勾勾的金額');
                    return;
                }
            }

            // 添加投入動畫並隱藏該項目
            if (itemElement) {
                itemElement.classList.add('money-inserted');
                // 等待動畫完成後移除元素
                this.TimerManager.setTimeout(() => {
                    itemElement.remove();
                }, 300, 'uiAnimation');
            }

            // 記錄選擇的金額
            tempSelected.push({
                amount: amount,
                slotType: slotType,
                itemIndex: itemIndex
            });

            this.Debug.log('payment', '[Normal Mode Payment] 已選擇金額列表:', tempSelected);

            // 更新彈跳視窗中的「已選擇」金額顯示
            // ★★★ 修正：要加上之前已經投入的金額（insertedAmount） ★★★
            const tempTotal = tempSelected.reduce((sum, item) => sum + item.amount, 0);
            const previousInserted = this.state.gameState.insertedAmount || 0;
            const totalWithPrevious = previousInserted + tempTotal;

            const modalInsertedAmount = document.getElementById('modal-inserted-amount');
            if (modalInsertedAmount) {
                modalInsertedAmount.textContent = totalWithPrevious;
                this.Debug.log('payment', '[Normal Mode Payment] 更新視窗顯示 - 之前已投入:', previousInserted, '本次選擇:', tempTotal, '總計:', totalWithPrevious);
            }

            // 播放音效
            this.audio.playSound('click');

            // 🆕【修復 24】簡化語音提示：播放累加後的總金額，例如「20元」（困難模式不播放，增加難度）
            if (this.state.settings.difficulty !== 'hard') {
                this.TimerManager.setTimeout(() => {
                    const speechText = `${this.convertAmountToSpeech(totalWithPrevious)}`;

                    this.Debug.log('speech', '[Normal Mode Speech] 準備播放語音:', speechText);
                    // 立即播放語音（會中斷前一個）
                    this.speech.speakCustom(speechText, null, true);
                }, 100, 'speechDelay');
            }
        },

        /**
         * 普通/困難模式：確認金額選擇並投入
         */
        confirmMoneySelection(slotType) {
            this.Debug.log('payment', '[Normal Mode Payment] 確認選擇，slotType:', slotType);

            const tempSelected = this.state.gameState.normalMode.tempSelectedMoney;

            if (tempSelected.length === 0) {
                this.audio.playSound('error');
                this.speech.speakCustom('請先選擇要投入的金額');
                return;
            }

            // 計算選擇的總金額
            const totalSelected = tempSelected.reduce((sum, item) => sum + item.amount, 0);
            this.Debug.log('payment', '[Normal Mode Payment] 選擇的總金額:', totalSelected);

            // 從錢包中移除已選擇的金額
            const walletCoins = this.state.gameState.normalMode.walletCoins;
            tempSelected.forEach(item => {
                if (item.slotType === 'bill') {
                    const index = walletCoins.bills.indexOf(item.amount);
                    if (index !== -1) {
                        walletCoins.bills.splice(index, 1);
                    }
                } else {
                    const index = walletCoins.coins.indexOf(item.amount);
                    if (index !== -1) {
                        walletCoins.coins.splice(index, 1);
                    }
                }
            });

            this.Debug.log('payment', '[Normal Mode Payment] 移除後錢包狀態:', walletCoins);

            // 投入金額
            const currentInserted = this.state.gameState.insertedAmount;
            this.state.gameState.insertedAmount = currentInserted + totalSelected;

            // 設置已投入標記
            if (slotType === 'bill') {
                this.state.gameState.normalMode.billsInserted = true;
            } else {
                this.state.gameState.normalMode.coinsInserted = true;
            }

            this.Debug.log('payment', '[Normal Mode Payment] 投入金額:', totalSelected, '累計:', this.state.gameState.insertedAmount);
            this.Debug.log('payment', '[Normal Mode Payment] billsInserted:', this.state.gameState.normalMode.billsInserted,
                        'coinsInserted:', this.state.gameState.normalMode.coinsInserted);

            // ★★★ 保存已使用的金額組合（用於提示模式驗證） ★★★
            if (!this.state.gameState.normalMode.usedAmounts) {
                this.state.gameState.normalMode.usedAmounts = [];
            }
            tempSelected.forEach(item => {
                this.state.gameState.normalMode.usedAmounts.push(item.amount);
            });

            // 清空臨時選擇
            this.state.gameState.normalMode.tempSelectedMoney = [];

            // 播放音效（指定任務模式及先投幣指定任務模式下不播放，避免與 correct02 或錯誤音效衝突）
            const _cfTaskType = this.state.settings.taskType;
            if (_cfTaskType !== 'assigned' && _cfTaskType !== 'coinFirstAssigned') {
                this.audio.playSound('cash');
            }

            // 更新顯示
            this.updateMoneyDisplay();
            this.updateMoneyDisplayInScreen();

            // 關閉視窗
            this.closeMoneySelection();

            // ★★★ 兩階段付款判定邏輯 ★★★
            const insertedAmount = this.state.gameState.insertedAmount;
            const originalWallet = this.state.gameState.normalMode.originalWalletCoins;
            const hadNoBills = !originalWallet || originalWallet.bills.length === 0;
            const hadNoCoins = !originalWallet || originalWallet.coins.length === 0;
            const bothInserted = this.state.gameState.normalMode.billsInserted
                              && this.state.gameState.normalMode.coinsInserted;

            // coinFirst 模式：驗證投幣金額並更新服務亮燈
            if (this.isCoinFirstMode()) {
                const cfService = this.state.gameState.normalMode.assignedService;
                const cfRequired = cfService ? cfService.price : null;

                const shouldVerify =
                    (cfRequired !== null && insertedAmount >= cfRequired) ||
                    bothInserted ||
                    (slotType === 'bill' && hadNoCoins) ||
                    (slotType === 'coin' && hadNoBills);

                if (shouldVerify) {
                    // 達到驗證條件：先驗證金額，正確才亮燈（避免超投時燈號誤亮）
                    this.TimerManager.setTimeout(() => {
                        this.validateCoinFirstPayment();
                    }, 300, 'screenTransition');
                } else {
                    // 尚未達驗證條件：即時更新可負擔服務亮燈（price <= insertedAmount）
                    this.TimerManager.setTimeout(() => {
                        this.updateServiceAvailabilityByAmount();
                    }, 300, 'serviceUnlock');
                    // 語音提示剩餘金額（指定任務才有目標金額）
                    if (cfRequired !== null) {
                        const remaining = cfRequired - insertedAmount;
                        const nextHint = !this.state.gameState.normalMode.billsInserted && walletCoins.bills.length > 0
                            ? `，還缺${this.convertAmountToSpeech(remaining)}，請投入紙鈔`
                            : !this.state.gameState.normalMode.coinsInserted && walletCoins.coins.length > 0
                            ? `，還缺${this.convertAmountToSpeech(remaining)}，請投入硬幣`
                            : '';
                        this.speech.speakCustom(this.convertAmountToSpeech(insertedAmount) + nextHint);
                    } else {
                        this.speech.speakCustom(this.convertAmountToSpeech(insertedAmount));
                    }
                }
                this.updateSlotStatus();
                if (this.state.gameState.normalMode.hintShown) this.updateHintAnimation();
                return;
            }

            // 普通/困難模式付款（先選服務後投幣）
            const requiredAmount = this.state.gameState.requiredAmount;
            const shouldVerify =
                insertedAmount >= requiredAmount ||    // 達額或超額 → 立即判定
                bothInserted ||                        // 兩種都投過 → 判定
                (slotType === 'bill' && hadNoCoins) || // 原本無硬幣 → 紙鈔後即判定
                (slotType === 'coin' && hadNoBills);   // 原本無紙鈔 → 硬幣後即判定

            if (shouldVerify) {
                this.Debug.log('payment', '[Normal Mode Payment] 投幣完成，驗證付款');
                this.TimerManager.setTimeout(() => {
                    this.validateNormalModePayment();
                }, 300, 'screenTransition');
            } else {
                const remaining = requiredAmount - insertedAmount;
                let nextHint = '';
                if (remaining > 0) {
                    if (!this.state.gameState.normalMode.billsInserted && walletCoins.bills.length > 0) {
                        nextHint = `，還缺${this.convertAmountToSpeech(remaining)}，請投入紙鈔`;
                    } else if (!this.state.gameState.normalMode.coinsInserted && walletCoins.coins.length > 0) {
                        nextHint = `，還缺${this.convertAmountToSpeech(remaining)}，請投入硬幣`;
                    }
                }
                this.speech.speakCustom(this.convertAmountToSpeech(insertedAmount) + nextHint, null, true);
            }

            // 更新入口禁用狀態
            this.updateSlotStatus();

            // 如果在提示模式下，更新提示動畫位置
            if (this.state.gameState.normalMode.hintShown) {
                this.updateHintAnimation();
            }
        },

        /**
         * 普通/困難模式：更新提示動畫位置
         */
        updateHintAnimation() {
            this.Debug.log('hint', '[Hint Animation] 更新提示動畫位置');

            const correctAmounts = this.state.gameState.normalMode.correctAmounts;
            if (!correctAmounts || correctAmounts.length === 0) {
                this.Debug.log('hint', '[Hint Animation] 沒有正確金額組合');
                return;
            }

            const billsInserted = this.state.gameState.normalMode.billsInserted;
            const coinsInserted = this.state.gameState.normalMode.coinsInserted;

            // 判斷需要哪些入口
            const needsBills = correctAmounts.some(amount => amount >= 100);
            const needsCoins = correctAmounts.some(amount => amount < 100);

            this.Debug.log('hint', '[Hint Animation] needsBills:', needsBills, 'billsInserted:', billsInserted);
            this.Debug.log('hint', '[Hint Animation] needsCoins:', needsCoins, 'coinsInserted:', coinsInserted);

            const billSlot = document.querySelector('.bill-slot-area');
            const coinSlot = document.querySelector('.coin-slot-area');

            // 移除所有提示動畫
            if (billSlot) billSlot.classList.remove('easy-mode-hint');
            if (coinSlot) coinSlot.classList.remove('easy-mode-hint');

            // 根據當前狀態顯示提示
            if (needsBills && !billsInserted) {
                // 需要投紙鈔且還沒投
                if (billSlot) {
                    billSlot.classList.add('easy-mode-hint');
                    this.Debug.log('hint', '[Hint Animation] 顯示紙鈔入口提示');
                }
            } else if (needsCoins && !coinsInserted) {
                // 需要投硬幣且還沒投
                if (coinSlot) {
                    coinSlot.classList.add('easy-mode-hint');
                    this.Debug.log('hint', '[Hint Animation] 顯示硬幣入口提示');
                }
            }
        },

        /**
         * 普通/困難模式：取消金額選擇
         */
        cancelMoneySelection() {
            this.Debug.log('payment', '[Normal Mode Payment] 取消選擇');

            // 清空臨時選擇
            this.state.gameState.normalMode.tempSelectedMoney = [];

            // 播放音效
            this.audio.playSound('beep');

            // 關閉視窗
            this.closeMoneySelection();

            // 語音提示：提示模式下說明仍需依提示完成
            if (this.state.gameState.normalMode.hintShown) {
                const remaining = this.state.gameState.requiredAmount - this.state.gameState.insertedAmount;
                if (remaining > 0) {
                    this.speech.speakCustom(`已取消，請依提示選擇有綠色勾勾的金額，尚需投入${this.convertAmountToSpeech(remaining)}`);
                } else {
                    this.speech.speakCustom('已取消選擇');
                }
            } else {
                this.speech.speakCustom('已取消選擇');
            }
        },

        /**
         * 普通/困難模式：驗證付款金額
         */
        validateNormalModePayment() {
            const inserted = this.state.gameState.insertedAmount;
            const required = this.state.gameState.requiredAmount;
            const hintShown = this.state.gameState.normalMode.hintShown;

            this.Debug.log('payment', '[Normal Mode Payment] 驗證付款 - 投入:', inserted, '需要:', required, '提示模式:', hintShown);

            // ★★★ 在提示模式下，除了金額正確，還要檢查是否使用了提示的組合 ★★★
            if (hintShown && inserted === required) {
                const correctAmounts = this.state.gameState.normalMode.correctAmounts || [];
                const usedAmounts = this.state.gameState.normalMode.usedAmounts || [];

                this.Debug.log('payment', '[Normal Mode Payment] 提示模式驗證 - 正確組合:', correctAmounts, '使用組合:', usedAmounts);

                // 檢查是否使用了正確的組合（順序可以不同，但金額必須完全一致）
                const sortedCorrect = [...correctAmounts].sort((a, b) => a - b);
                const sortedUsed = [...usedAmounts].sort((a, b) => a - b);
                const isCorrectCombination = JSON.stringify(sortedCorrect) === JSON.stringify(sortedUsed);

                if (!isCorrectCombination) {
                    this.Debug.log('payment', '[Normal Mode Payment] 提示模式下使用了錯誤的組合，不接受');
                    // 顯示錯誤但不增加錯誤計數（因為已經是提示模式）
                    this.audio.playSound('error');
                    this.speech.speakCustom('請使用有綠色標示的金額付款');
                    this.refundNormalModePayment();
                    return;
                }
            }

            if (inserted === required) {
                // 正確付款，重置錯誤計數
                this.Debug.log('payment', '[Normal Mode Payment] 付款正確！');
                this.state.gameState.normalMode.paymentErrorCount = 0;

                // 🎆 指定任務模式：付款正確時觸發煙火和音效
                this.Debug.log('payment', '[Payment] 付款正確，檢查是否觸發煙火');
                this.playSuccessFireworks();

                this.completePayment();
            } else {
                // 錯誤付款，退回金額
                this.Debug.log('payment', '[Normal Mode Payment] 付款錯誤，退回金額');

                // ★★★ 增加錯誤計數 ★★★
                this.state.gameState.normalMode.paymentErrorCount++;
                const errorCount = this.state.gameState.normalMode.paymentErrorCount;
                this.Debug.log('payment', '[Normal Mode Payment] 付款錯誤次數:', errorCount);

                this.audio.playSound('error');

                const willShowHintForMsg = errorCount >= 3 && this.state.settings.difficulty === 'normal';
                const hintSuffix = willShowHintForMsg ? '，請依提示付款' : `，已退回 ${inserted} 元，請重新付款`;
                const errorMessage = inserted < required
                    ? `付款金額不足${hintSuffix}`
                    : `付款金額過多${hintSuffix}`;

                // 普通模式 3 次錯誤自動提示；困難模式只有按提示鈕才顯示
                const shouldShowHint = errorCount >= 3 && this.state.settings.difficulty === 'normal';

                // 播放錯誤訊息語音，若需要顯示提示則在語音結束後觸發
                if (shouldShowHint) {
                    this.Debug.log('payment', '[Normal Mode Payment] 錯誤三次，語音結束後顯示提示');
                    this.speech.speakCustom(errorMessage, () => {
                        this.showPaymentHintAfterErrors();
                    });
                } else {
                    this.speech.speakCustom(errorMessage);
                }
                this.showPaymentError(errorMessage);

                // 退回金額到錢包（將已投入的金額退回）
                this.refundNormalModePayment();
            }
        },

        /**
         * coinFirst 模式：驗證投幣金額（指定任務=精確比對，自選任務=找匹配服務）
         */
        validateCoinFirstPayment() {
            const inserted = this.state.gameState.insertedAmount;
            const service = this.state.gameState.normalMode.assignedService;

            if (service) {
                // coinFirstAssigned：必須精確等於服務價格
                if (inserted === service.price) {
                    this.Debug.log('payment', '[coinFirst] 投幣正確！亮燈服務:', service.name);
                    // 煙火改在選擇正確服務時觸發（selectService），此處不重複
                    this.TimerManager.setTimeout(() => {
                        this.updateServiceAvailabilityByAmount();
                    }, 100, 'serviceUnlock');
                } else {
                    this._handleCoinFirstPaymentError(inserted, service.price);
                }
            } else {
                // coinFirstFree：看是否有服務與投幣金額相符
                const services = this.serviceConfig[this.state.settings.difficulty].services;
                const matched = services.find(s => s.price === inserted);
                if (matched) {
                    this.Debug.log('payment', '[coinFirst] 投幣匹配服務:', matched.name);
                    this.TimerManager.setTimeout(() => {
                        this.updateServiceAvailabilityByAmount();
                    }, 100, 'serviceUnlock');
                } else {
                    this._handleCoinFirstPaymentError(inserted, null);
                }
            }
        },

        /**
         * coinFirst 模式：處理付款錯誤（金額不符）
         */
        _handleCoinFirstPaymentError(inserted, required) {
            this.state.gameState.normalMode.paymentErrorCount++;
            const errorCount = this.state.gameState.normalMode.paymentErrorCount;
            this.audio.playSound('error');

            const willShowHint = this.state.settings.difficulty === 'normal' && errorCount >= 3;
            const hintSuffix = willShowHint ? '，請依提示付款' : '，請重新投入';
            let msg;
            if (required !== null) {
                msg = inserted < required
                    ? `付款金額不足${hintSuffix}`
                    : `付款金額過多${hintSuffix}`;
            } else {
                msg = `此金額無對應服務，請重新投入`;
            }

            if (willShowHint) {
                this.speech.speakCustom(msg, () => {
                    this.showPaymentHintAfterErrors();
                });
            } else {
                this.speech.speakCustom(msg);
            }
            this.showPaymentError(msg);

            this.refundNormalModePayment();
        },

        /**
         * 普通/困難模式：退回金額
         */
        refundNormalModePayment() {
            this.Debug.log('payment', '[Normal Mode Payment] 退回金額');

            // 重置付款狀態
            this.state.gameState.insertedAmount = 0;
            this.state.gameState.normalMode.billsInserted = false;
            this.state.gameState.normalMode.coinsInserted = false;
            this.state.gameState.normalMode.tempSelectedMoney = [];
            this.state.gameState.normalMode.usedAmounts = []; // 清空已使用金額記錄

            // ★★★ 恢復原始錢包，不重新生成 ★★★
            // 從備份中恢復原始錢包（在任務開始時已經保存）
            if (this.state.gameState.normalMode.originalWalletCoins) {
                this.state.gameState.normalMode.walletCoins = {
                    bills: [...this.state.gameState.normalMode.originalWalletCoins.bills],
                    coins: [...this.state.gameState.normalMode.originalWalletCoins.coins]
                };
                this.Debug.log('payment', '[Normal Mode Payment] 恢復原始錢包:', this.state.gameState.normalMode.walletCoins);
            }

            // 更新顯示
            this.updateMoneyDisplay();
            this.updateMoneyDisplayInScreen();
            this.updateSlotStatus();

            // coinFirst 模式：退幣時重鎖所有已亮起的服務燈號
            if (this.isCoinFirstMode()) {
                document.querySelectorAll('.service-item.coin-first-available, .service-item.coin-first-unlocking').forEach(el => {
                    el.classList.remove('coin-first-available', 'coin-first-unlocking');
                    el.classList.add('coin-first-locked');
                    el.style.setProperty('filter', 'grayscale(80%) brightness(0.5)', 'important');
                    el.style.setProperty('opacity', '1', 'important');
                    const wrapper = el.closest('.service-item-wrapper');
                    if (wrapper) {
                        wrapper.classList.add('coin-first-locked-wrapper');
                        const light = wrapper.querySelector('.indicator-light');
                        if (light) {
                            light.classList.remove('active');
                            light.style.setProperty('filter', 'grayscale(80%) brightness(0.5)', 'important');
                        }
                    }
                });
                this.Debug.log('payment', '[CoinFirst] 退幣：服務燈號已重鎖');
            }

            // ★★★ 如果在提示模式下，更新提示動畫位置 ★★★
            if (this.state.gameState.normalMode.hintShown) {
                this.updateHintAnimation();
            }

            this.Debug.log('payment', '[Normal Mode Payment] 退款完成，可以重新付款');
        },

        /**
         * 更新入口禁用狀態（普通/困難模式）
         */
        updateSlotStatus() {
            if (this.state.settings.difficulty === 'easy') return;

            const billSlotArea = document.querySelector('.bill-slot-area');
            const coinSlotArea = document.querySelector('.coin-slot-area');
            const walletCoins = this.state.gameState.normalMode.walletCoins;

            if (!walletCoins) return;

            this.Debug.log('coin', '[Slot Status] 當前狀態 - billsInserted:', this.state.gameState.normalMode.billsInserted,
                        'coinsInserted:', this.state.gameState.normalMode.coinsInserted);
            this.Debug.log('coin', '[Slot Status] 錢包狀態 - bills:', walletCoins.bills.length,
                        'coins:', walletCoins.coins.length);

            // 紙鈔入口：已投入或沒有紙鈔時禁用（不依金額達標，由兩階段流程控制）
            if (billSlotArea) {
                const shouldDisable = this.state.gameState.normalMode.billsInserted ||
                                     walletCoins.bills.length === 0;

                if (shouldDisable) {
                    billSlotArea.classList.add('disabled');
                    billSlotArea.style.pointerEvents = 'none';
                    billSlotArea.style.opacity = '0.5';
                    billSlotArea.style.cursor = 'not-allowed';
                } else {
                    billSlotArea.classList.remove('disabled');
                    billSlotArea.style.pointerEvents = '';
                    billSlotArea.style.opacity = '';
                    billSlotArea.style.cursor = '';
                }
            }

            // 硬幣入口：已投入或沒有硬幣時禁用
            if (coinSlotArea) {
                const shouldDisable = this.state.gameState.normalMode.coinsInserted ||
                                     walletCoins.coins.length === 0;

                if (shouldDisable) {
                    coinSlotArea.classList.add('disabled');
                    coinSlotArea.style.pointerEvents = 'none';
                    coinSlotArea.style.opacity = '0.5';
                    coinSlotArea.style.cursor = 'not-allowed';
                } else {
                    coinSlotArea.classList.remove('disabled');
                    coinSlotArea.style.pointerEvents = '';
                    coinSlotArea.style.opacity = '';
                    coinSlotArea.style.cursor = '';
                }
            }

            this.Debug.log('coin', '[Slot Status] 更新入口狀態 - 紙鈔停用:', billSlotArea?.classList.contains('disabled'),
                        '硬幣停用:', coinSlotArea?.classList.contains('disabled'));
        },

        insertMoney(amount, playSpeech = true, skipDebounce = false) {
            // 防止手機端重複觸發（但簡單模式的個別金額點擊可跳過此檢查）
            if (!skipDebounce) {
                const now = Date.now();
                if (this._lastInsertMoneyTime && now - this._lastInsertMoneyTime < 300) {
                    this.Debug.log('coin', '[Insert] 防抖：忽略重複投幣');
                    return;
                }
                this._lastInsertMoneyTime = now;
            }

            if (!this.isCoinFirstMode() && (this.state.gameState.currentScene !== 'payment' || !this.state.gameState.selectedService)) {
                this.audio.playSound('error');
                this.showPaymentError('請先選擇服務項目');
                return;
            }

            // 檢查是否接受此面額
            const difficulty = this.state.settings.difficulty;
            const acceptedMoney = this.serviceConfig[difficulty].acceptedMoney;

            if (!acceptedMoney.includes(amount)) {
                this.audio.playSound('error');
                this.showPaymentError(`不接受 ${amount} 元面額`);
                this.speech.speak('noChange');
                return;
            }

            // 檢查是否會超額付款
            const newAmount = this.state.gameState.insertedAmount + amount;
            if (newAmount > this.state.gameState.requiredAmount) {
                this.audio.playSound('error');
                this.showPaymentError('投入金額超過所需，本機不找零');
                this.speech.speak('noChange');
                return;
            }

            // 播放投幣音效和動畫（coinFirst / 指定任務模式下不播放 cash 音效）
            if (this.state.settings.taskType !== 'assigned' && !this.isCoinFirstMode()) {
                this.audio.playSound('cash');
            }
            this.playMoneyAnimation(amount);
            this.state.gameState.insertedAmount = newAmount;

            this.Debug.log('flow', `[A2-Kiosk] 投入 ${amount} 元，累計 ${this.state.gameState.insertedAmount} 元`);

            this.updateMoneyDisplay();
            this.updateMoneyDisplayInScreen();

            // 簡單模式：檢查錢包中是否還有該面額的錢，如果沒有就移除提示動畫並禁用入口
            if (this.state.settings.difficulty === 'easy' && this.state.gameState.easyMode.walletCoins) {
                const walletCoins = this.state.gameState.easyMode.walletCoins;

                // 檢查紙鈔（100元）
                if (amount === 100 || walletCoins.bills.length === 0) {
                    const billSlotArea = document.querySelector('.bill-slot-area');
                    if (billSlotArea && walletCoins.bills.length === 0) {
                        billSlotArea.classList.remove('easy-mode-hint');
                        billSlotArea.style.pointerEvents = 'none';
                        billSlotArea.style.opacity = '0.5';
                        billSlotArea.style.cursor = 'not-allowed';
                        BarberKiosk.Debug.log('flow', ' 紙鈔已付完，移除紙鈔入口提示並禁用');
                    }
                }

                // 檢查硬幣（5, 10, 50元）
                if (amount !== 100 || walletCoins.coins.length === 0) {
                    const coinSlotArea = document.querySelector('.coin-slot-area');
                    if (coinSlotArea && walletCoins.coins.length === 0) {
                        coinSlotArea.classList.remove('easy-mode-hint');
                        coinSlotArea.style.pointerEvents = 'none';
                        coinSlotArea.style.opacity = '0.5';
                        coinSlotArea.style.cursor = 'not-allowed';
                        BarberKiosk.Debug.log('flow', ' 硬幣已付完，移除硬幣入口提示並禁用');
                    }
                }
            }

            // 更新彈跳視窗中的金額顯示
            const modalInsertedAmount = document.getElementById('modal-inserted-amount');
            if (modalInsertedAmount) {
                modalInsertedAmount.textContent = this.state.gameState.insertedAmount;
            }

            // 只在非簡單模式或指定播放語音時才播放
            if (playSpeech) {
                this.speech.speak('paymentReceived', { amount: this.state.gameState.insertedAmount });
            }

            // 【重要】簡單模式的語音回饋和付款完成邏輯已移至 selectMoney() 的回呼中，以避免競速問題
            // 檢查是否付款完成（僅適用於非簡單模式）
            if (this.state.settings.difficulty !== 'easy') {
                if (this.isCoinFirstMode()) {
                    // coinFirst 模式：不自動 completePayment，改由 updateServiceAvailabilityByAmount 控制亮燈
                    // 超投時提示退幣（在 updateServiceAvailabilityByAmount 中處理）
                    this.Debug.log('flow', '[CoinFirst] 投幣完成，等待服務亮起');
                } else if (this.state.gameState.insertedAmount >= this.state.gameState.requiredAmount) {
                    this.TimerManager.setTimeout(() => {
                        this.completePayment();
                    }, this.timingConfig[difficulty]?.paymentDelay || 1200, 'screenTransition');
                } else {
                    const remaining = this.state.gameState.requiredAmount - this.state.gameState.insertedAmount;
                    this.TimerManager.setTimeout(() => {
                        this.speech.speak('insufficient', { remaining });
                    }, 1000, 'speechDelay');
                }
            }
            // 簡單模式：語音回饋已移至 selectMoney() 函數統一處理，此處不再發聲
        },

        /**
         * coinFirst 模式：根據已投金額更新服務亮燈狀態
         * 對應 A1 的 updateDrinkAvailabilityByCoinAmount
         */
        updateServiceAvailabilityByAmount() {
            if (!this.isCoinFirstMode()) return;

            const inserted = this.state.gameState.insertedAmount;
            const taskType = this.state.settings.taskType;
            const difficulty = this.state.settings.difficulty;

            // 取得指定服務（coinFirstAssigned 模式）
            let assignedServiceId = null;
            let assignedService = null;
            if (taskType === 'coinFirstAssigned') {
                assignedService = difficulty === 'easy'
                    ? this.state.gameState.easyMode.assignedService
                    : this.state.gameState.normalMode.assignedService;
                assignedServiceId = assignedService?.id;
            }

            let anyUnlocked = false;

            document.querySelectorAll('.service-item.coin-first-locked').forEach(el => {
                const price = parseInt(el.dataset.price);
                const serviceId = el.dataset.serviceId;
                const isAssignedService = (taskType === 'coinFirstAssigned') && (serviceId === assignedServiceId);

                // 亮燈條件：已投金額 >= 服務價格（同 A1 邏輯，兩種模式相同）
                const shouldUnlock = (price <= inserted);

                if (shouldUnlock) {
                    anyUnlocked = true;
                    // 清除 inline style（_lockServicesForCoinFirst 設的 !important），讓動畫得以運作
                    el.style.removeProperty('filter');
                    el.style.removeProperty('opacity');
                    el.classList.remove('coin-first-locked');
                    el.classList.add('coin-first-unlocking');
                    const wrapper = el.closest('.service-item-wrapper');
                    wrapper?.classList.remove('coin-first-locked-wrapper');
                    const light = wrapper?.querySelector('.indicator-light');
                    if (light) light.style.removeProperty('filter');

                    const serviceName = el.querySelector('.service-name')?.textContent || '';

                    this.TimerManager.setTimeout(() => {
                        el.classList.remove('coin-first-unlocking');
                        el.classList.add('coin-first-available');
                        const wrapperForLight = el.closest('.service-item-wrapper');
                        const activeLight = wrapperForLight?.querySelector('.indicator-light');
                        if (activeLight) activeLight.classList.add('active');

                        // 更新步驟至 step2（coinFirstAssigned 只在指定服務亮起時更新；coinFirstFree 在批次語音時統一更新）
                        if (isAssignedService) {
                            if (difficulty === 'easy') {
                                this.state.gameState.easyMode.currentStep = 'step2';
                            } else {
                                this.state.gameState.normalMode.currentStep = 'step2';
                                this.state.gameState.normalMode.errorCount = 0;
                            }
                            // coinFirstAssigned：只對指定服務播語音
                            this.speech.speakCustom(`${serviceName}的燈號亮起了，請點選這個服務`, () => {
                                if (difficulty === 'easy') this.showEasyModeHint();
                            });
                        }

                        this.Debug.log('flow', `[CoinFirst] 服務亮起: ${serviceName} (${price}元)`);
                    }, 650, 'serviceUnlock');
                }
            });

            // coinFirstFree：所有服務亮起後統一播放一次語音 + 更新步驟
            if (taskType !== 'coinFirstAssigned' && anyUnlocked) {
                this.TimerManager.setTimeout(() => {
                    if (difficulty === 'easy') {
                        this.state.gameState.easyMode.currentStep = 'step2';
                    } else {
                        this.state.gameState.normalMode.currentStep = 'step2';
                        this.state.gameState.normalMode.errorCount = 0;
                    }
                    const availCount = document.querySelectorAll('.service-item.coin-first-available').length;
                    const msg = availCount === 1
                        ? `燈號亮起了，請點選這個服務`
                        : `已有${availCount}個服務可以選了，請選擇一個`;
                    this.speech.speakCustom(msg, () => {
                        if (difficulty === 'easy') this.showEasyModeHint();
                    });
                }, 700, 'serviceUnlock');
            }

            // 超投提示：已投金額超出所有服務最高價格
            if (!anyUnlocked && inserted > 0) {
                const services = this.serviceConfig[difficulty].services;
                const maxPrice = Math.max(...services.map(s => s.price));

                if (inserted > maxPrice) {
                    this.speech.speakCustom('已超過所有服務金額，請按退幣鍵重來');
                    const refundBtn = document.querySelector('.refund-btn, .cancel-btn');
                    if (refundBtn) refundBtn.classList.add('easy-mode-hint');
                    this.Debug.log('flow', `[CoinFirst] 超投：${inserted}元 > 最高價${maxPrice}元`);
                } else if (taskType === 'coinFirstAssigned' && assignedService && inserted > assignedService.price) {
                    this.speech.speakCustom('投多了，請按退幣鍵重新投入正確金額');
                    this.Debug.log('flow', `[CoinFirst] 超投指定服務：${inserted}元 > ${assignedService.price}元`);
                }
            }
        },

        playMoneyAnimation(amount) {
            if (amount === 100) {
                // 紙鈔動畫
                const billAnimation = document.getElementById('bill-animation');
                if (billAnimation) {
                    billAnimation.classList.remove('inserting');
                    this.TimerManager.setTimeout(() => {
                        billAnimation.classList.add('inserting');
                        this.TimerManager.setTimeout(() => {
                            billAnimation.classList.remove('inserting');
                        }, 800, 'uiAnimation');
                    }, 100, 'uiAnimation');
                }
            } else {
                // 硬幣動畫
                const coinItem = document.querySelector(`[data-value="${amount}"]`);
                if (coinItem) {
                    coinItem.style.transform = 'scale(1.5) rotate(360deg)';
                    coinItem.style.boxShadow = '0 0 20px rgba(255, 193, 7, 0.8)';
                    this.TimerManager.setTimeout(() => {
                        coinItem.style.transform = '';
                        coinItem.style.boxShadow = '';
                    }, 600, 'uiAnimation');
                }
            }
        },

        showPaymentError(message) {
            // 創建設計感彈跳視窗顯示付款錯誤詳細資訊
            const service = this.state.gameState.selectedService
                ?? this.state.gameState.normalMode?.assignedService;
            let requiredAmount = this.state.gameState.requiredAmount;
            if (this.isCoinFirstMode()) {
                const _svc = this.state.gameState.normalMode?.assignedService;
                if (_svc) requiredAmount = _svc.price;
            }
            const insertedAmount = this.state.gameState.insertedAmount;

            // 判斷錯誤類型
            let errorType = '';
            let errorIcon = '';
            let errorColor = '';

            if (insertedAmount < requiredAmount) {
                errorType = '付款金額不足';
                errorIcon = '💰';
                errorColor = '#FF6B6B';
            } else if (insertedAmount > requiredAmount) {
                errorType = '付款金額過多';
                errorIcon = '💸';
                errorColor = '#FFA500';
            } else {
                errorType = '操作錯誤';
                errorIcon = '❌';
                errorColor = '#FF6B6B';
            }

            // 創建遮罩層
            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'payment-error-modal-overlay';
            modalOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(8px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease-out;
            `;

            // 創建彈跳視窗內容
            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: white;
                border-radius: 24px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                text-align: center;
                position: relative;
            `;

            modalContent.innerHTML = `
                <style>
                    /* 🔧 [Phase 2] @keyframes fadeIn/slideInScale 已移至 CSS/injectGlobalAnimationStyles() */
                    .error-modal-icon {
                        font-size: 72px;
                        margin-bottom: 16px;
                        animation: errorModalBounce 0.6s ease-in-out;
                    }
                    /* 🔧 [Phase 2] @keyframes errorModalBounce 已移至 injectGlobalAnimationStyles() */
                    .error-modal-title {
                        font-size: 28px;
                        font-weight: 700;
                        color: ${errorColor};
                        margin-bottom: 24px;
                        font-family: 'Noto Sans TC', sans-serif;
                    }
                    .error-modal-detail {
                        background: #F8F9FA;
                        border-radius: 16px;
                        padding: 24px;
                        margin-bottom: 24px;
                        text-align: left;
                    }
                    .error-modal-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid #E9ECEF;
                        font-size: 18px;
                    }
                    .error-modal-row:last-child {
                        border-bottom: none;
                    }
                    .error-modal-label {
                        color: #6C757D;
                        font-weight: 500;
                    }
                    .error-modal-value {
                        color: #212529;
                        font-weight: 700;
                        font-size: 20px;
                    }
                    .error-modal-value.highlight {
                        color: ${errorColor};
                        font-size: 24px;
                    }
                    .error-modal-message {
                        font-size: 18px;
                        color: #495057;
                        margin-bottom: 24px;
                        line-height: 1.6;
                    }
                    .error-modal-close-btn {
                        background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
                        color: white;
                        border: none;
                        border-radius: 12px;
                        padding: 16px 48px;
                        font-size: 18px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                        font-family: 'Noto Sans TC', sans-serif;
                    }
                    .error-modal-close-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
                    }
                    .error-modal-close-btn:active {
                        transform: translateY(0);
                    }
                </style>

                <div class="error-modal-icon">${errorIcon}</div>
                <div class="error-modal-title">${errorType}</div>

                <div class="error-modal-detail">
                    <div class="error-modal-row">
                        <span class="error-modal-label">服務項目</span>
                        <span class="error-modal-value">${service ? service.name : '未選擇'}</span>
                    </div>
                    <div class="error-modal-row">
                        <span class="error-modal-label">應付金額</span>
                        <span class="error-modal-value">${requiredAmount} 元</span>
                    </div>
                    <div class="error-modal-row">
                        <span class="error-modal-label">實付金額</span>
                        <span class="error-modal-value highlight">${insertedAmount} 元</span>
                    </div>
                </div>

                <div class="error-modal-message">
                    ${message}<br>
                    錢包金額已重置，請重新操作
                </div>

                <button class="error-modal-close-btn" id="close-error-modal-btn">
                    我知道了
                </button>
            `;

            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);

            // 綁定關閉按鈕
            const closeBtn = document.getElementById('close-error-modal-btn');
            const closeModal = () => {
                modalOverlay.style.animation = 'fadeOut 0.3s ease-out';
                this.TimerManager.setTimeout(() => {
                    if (modalOverlay.parentNode) {
                        modalOverlay.parentNode.removeChild(modalOverlay);
                    }
                }, 300, 'uiAnimation');
            };

            closeBtn.addEventListener('click', closeModal);

            // 點擊遮罩也可關閉
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    closeModal();
                }
            });

            // ESC 鍵關閉
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
            // 🔧 [Phase 2] @keyframes fadeOut 已移至 CSS (a2_barber_shop_kiosk.css:113)
        },

        completePayment() {
            this.state.gameState.paymentComplete = true;
            this.state.gameState.currentScene = 'printing';
            this.state.gameState.currentStep = 3;
            this.state.gameState.queueNumber = Math.floor(Math.random() * 99) + 1;

            // 🆕【修復 25】清除輔助點擊模式中剩餘的付款動作
            const gs = this.state.gameState;
            if (gs.clickModeState?.enabled && gs.clickModeState.currentPhase === 'payment') {
                this.Debug.log('assist', '[A2-ClickMode] 付款完成，清除剩餘隊列操作');
                this.Debug.log('assist', `[A2-ClickMode] 當前步驟: ${gs.clickModeState.currentStep}, 隊列長度: ${gs.clickModeState.actionQueue.length}`);

                // 將 currentStep 設為隊列長度，下次 executeNextAction() 會觸發階段轉換
                gs.clickModeState.currentStep = gs.clickModeState.actionQueue.length;

                this.Debug.log('assist', '[A2-ClickMode] 已跳過剩餘步驟，準備轉換到列印票據階段');
            }

            // 音效已在 playSuccessFireworks() 中播放，避免重複
            // this.audio.playSound('success');

            // 🆕【修復 45 + 語音順序修正】
            // 語音順序：先「付款完成」→ 再「票卷列印中，請稍候」
            // 為確保 printTicket() 一定執行，設定備援計時器

            const startPrintAfterSpeech = () => {
                this.Debug.log('payment', '[Complete Payment] 開始列印票據');
                this.printTicket();

                // 普通/困難模式：進入步驟3
                if (this.state.settings.difficulty !== 'easy') {
                    this.advanceNormalModeStep('step3');
                }
            };

            // 播放「付款完成，票卷列印中」語音並同步啟動列印動畫
            this.speech.speakCustom('付款完成，票卷列印中');
            startPrintAfterSpeech();

            // 備援機制：如果列印未觸發，2秒後強制執行
            this.TimerManager.setTimeout(() => {
                if (!this.state.gameState.ticketPrinted) {
                    this.Debug.log('payment', '[Complete Payment] 備援機制觸發，強制列印票據');
                    startPrintAfterSpeech();
                }
            }, 2000, 'screenTransition');
        },

        printTicket() {
            if (this.state.gameState.ticketPrinted) return;

            this.Debug.log('ui', '[Ticket Print] 開始列印票據 (最終修正版 v2)');
            this.state.gameState.ticketPrinted = true;
            this.state.gameState.currentStep = 4;

            if (this.state.settings.difficulty === 'easy') {
                this.state.gameState.easyMode.currentStep = 'step3';
            }

            const ticketOutput = document.getElementById('ticket-output');
            const dispenserArea = document.querySelector('.ticket-dispenser-area .ticket-printer');
            if (!ticketOutput || !dispenserArea) {
                this.Debug.error('[Ticket Print] 錯誤：找不到票券出口或容器元素');
                return;
            }

            const service = this.state.gameState.selectedService;
            const queueNumber = this.state.gameState.queueNumber;
            const miniTicketHTML = `
                <div class="printed-ticket">
                    <div class="ticket-mini-header">
                        <div class="shop-name">
                            <img src="../images/a2/icon-a2-barber-shop-02.png" alt="百元理髮店" style="width: 1.2rem; height: 1.2rem; object-fit: contain; vertical-align: middle; margin-right: 0.3rem;">
                            百元理髮店
                        </div>
                        <div class="queue-number-large">${String(queueNumber).padStart(2, '0')}</div>
                    </div>
                    <div class="ticket-mini-body">
                        <div class="service-info">
                            <span class="service-name">${service.name}</span>
                            <span class="service-price">NT$ ${service.price}</span>
                        </div>
                    </div>
                </div>`;

            const buttonHTML = `<button class="take-ticket-btn">📄 查看票券</button>`;

            ticketOutput.innerHTML = miniTicketHTML;

            const oldButton = dispenserArea.querySelector('.take-ticket-btn');
            if (oldButton) oldButton.remove();
            dispenserArea.insertAdjacentHTML('beforeend', buttonHTML);

            this.audio.playSound('print');

            // *** 關鍵修正：將事件綁定移到動畫之後 ***
            const ticketElement = ticketOutput.firstElementChild;
            const buttonElement = dispenserArea.querySelector('.take-ticket-btn');

            if (ticketElement) {
                ticketElement.style.animation = 'ticketSlideOut 0.8s ease-out forwards';
                this.Debug.log('ui', '[Ticket Print] 已套用票據動畫並設定 forwards');

                // 當動畫結束後才綁定點擊事件，避免意外觸發
                ticketElement.addEventListener('animationend', () => {
                    if (buttonElement) buttonElement.onclick = () => this.showTicketModal();
                    ticketElement.onclick = () => this.showTicketModal();
                    this.Debug.log('ui', '[Ticket Print] 動畫結束，已綁定點擊事件');

                    // 在這裡才顯示提示，確保一切就緒
                    if (this.state.settings.difficulty === 'easy') {
                        this.showEasyModeHint();
                    }
                }, { once: true }); // 事件只觸發一次
            }

            const moneyStatusEl = document.getElementById('money-status-screen');
            if (moneyStatusEl) {
                moneyStatusEl.textContent = '付款完成，請取票';
                moneyStatusEl.style.color = '#4caf50';
            }
        },

        // 顯示錢包查看彈跳視窗
        showWalletModal() {
            this.Debug.log('coin', '[Wallet] 顯示錢包彈窗');

            const walletCoins = this.state.gameState.normalMode.walletCoins;
            if (!walletCoins) {
                this.Debug.error('[Wallet] 錢包資料不存在');
                return;
            }

            // 計算錢包總金額
            const totalAmount = this.state.gameState.normalMode.walletAmount || 0;

            // 分類紙鈔和硬幣
            const bills = walletCoins.bills || [];
            const coins = walletCoins.coins || [];

            // 統計各面額數量
            const billCounts = {};
            bills.forEach(bill => {
                billCounts[bill] = (billCounts[bill] || 0) + 1;
            });

            const coinCounts = {};
            coins.forEach(coin => {
                coinCounts[coin] = (coinCounts[coin] || 0) + 1;
            });

            // 生成紙鈔 HTML - 分類顯示，每個面額重複顯示數量次
            const billsHTML = Object.keys(billCounts).length > 0
                ? Object.keys(billCounts).sort((a, b) => b - a).map(value => {
                    const count = billCounts[value];
                    // 生成該面額的多個圖示（🆕 每個都隨機正反面）
                    const images = Array(count).fill(0).map(() => {
                        const imagePath = this.getRandomMoneyImage(parseInt(value));
                        return `
                        <img src="${imagePath}" alt="${value}元"
                             style="width: 85px; height: 64px; object-fit: contain; margin: 5px;"
                             onerror="this.style.display='none'">
                    `;
                    }).join('');

                    return `
                        <div class="wallet-denomination-group">
                            <div class="wallet-denomination-label">${value} 元（${count} 張）</div>
                            <div class="wallet-images-row">
                                ${images}
                            </div>
                        </div>
                    `;
                }).join('')
                : '<p style="color: #999;">無紙鈔</p>';

            // 生成硬幣 HTML - 分類顯示，每個面額重複顯示數量次
            const coinsHTML = Object.keys(coinCounts).length > 0
                ? Object.keys(coinCounts).sort((a, b) => b - a).map(value => {
                    const count = coinCounts[value];
                    // 生成該面額的多個圖示（🆕 每個都隨機正反面）
                    const images = Array(count).fill(0).map(() => {
                        const imagePath = this.getRandomMoneyImage(parseInt(value));
                        return `
                        <img src="${imagePath}" alt="${value}元"
                             style="width: 85px; height: 64px; object-fit: contain; margin: 5px;"
                             onerror="this.style.display='none'">
                    `;
                    }).join('');

                    return `
                        <div class="wallet-denomination-group">
                            <div class="wallet-denomination-label">${value} 元（${count} 個）</div>
                            <div class="wallet-images-row">
                                ${images}
                            </div>
                        </div>
                    `;
                }).join('')
                : '<p style="color: #999;">無硬幣</p>';

            // 將提示鈕變模糊
            const hintBtn = document.querySelector('.hint-btn-screen');
            if (hintBtn) {
                hintBtn.style.filter = 'blur(3px)';
                hintBtn.style.pointerEvents = 'none';
            }

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.style.zIndex = '1000';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3 style="text-align: center; width: 100%;"><img src="../images/common/icons_wallet.png" alt="👛" style="width:1.5em;height:1.5em;vertical-align:middle;margin-right:4px;" onerror="this.outerHTML='👛'"> 我的錢包</h3>
                        <button class="close-modal-btn" onclick="BarberKiosk.closeWalletModal(this)"
                                style="position: absolute; right: 20px; top: 20px; background: none; border: none;
                                       font-size: 24px; cursor: pointer; color: #666;">✕</button>
                    </div>
                    <div class="modal-body" style="padding: 20px 30px;">
                        <div style="text-align: center; margin-bottom: 25px; padding: 20px;
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    border-radius: 15px; color: white;">
                            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">錢包總金額</div>
                            <div style="font-size: 36px; font-weight: 700;">NT$ ${totalAmount}</div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h4 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #667eea;
                                       padding-bottom: 8px;">💵 紙鈔（${bills.length} 張）</h4>
                            ${billsHTML}
                        </div>

                        <div>
                            <h4 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #764ba2;
                                       padding-bottom: 8px;">🪙 硬幣（${coins.length} 個）</h4>
                            ${coinsHTML}
                        </div>
                    </div>
                    <div class="modal-footer" style="padding: 20px 30px;">
                        <button onclick="BarberKiosk.closeWalletModal(this)"
                                style="width: 100%; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                       border: none; border-radius: 12px; color: white; font-size: 16px; font-weight: 600;
                                       cursor: pointer; transition: all 0.3s ease;"
                                onmouseover="this.style.transform='translateY(-2px)'"
                                onmouseout="this.style.transform=''">
                            ✓ 關閉
                        </button>
                    </div>
                </div>
                <style>
                    .wallet-denomination-group {
                        margin-bottom: 15px;
                        padding: 15px;
                        background: #f8f9fa;
                        border-radius: 12px;
                        border: 2px solid #e9ecef;
                    }
                    .wallet-denomination-label {
                        font-size: 16px;
                        font-weight: 600;
                        color: #333;
                        margin-bottom: 10px;
                        text-align: center;
                    }
                    .wallet-images-row {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        align-items: center;
                        gap: 5px;
                    }
                </style>
            `;
            document.body.appendChild(modal);

            this.audio.playSound('beep');
            this.speech.speakCustom(`您的錢包總共有 ${this.convertAmountToSpeech(totalAmount)}`);
        },

        // 關閉錢包彈跳視窗並恢復提示鈕
        closeWalletModal(element) {
            // 恢復提示鈕
            const hintBtn = document.querySelector('.hint-btn-screen');
            if (hintBtn) {
                hintBtn.style.filter = '';
                hintBtn.style.pointerEvents = '';
            }

            // 移除彈窗
            element.closest('.modal-overlay').remove();
        },

        // 顯示票據彈跳視窗
        showTicketModal() {
            this.Debug.log('ui', '[Ticket] 顯示票據彈窗');

            // 🆕【修復 16】調試：顯示當前狀態
            const gs = this.state.gameState;
            this.Debug.log('ui', '[Ticket] 當前狀態:', {
                clickModeActive: gs.clickModeState?.enabled,
                clickModePhase: gs.clickModeState?.currentPhase,
                easyModeStep: gs.easyMode?.currentStep,
                selectedService: gs.selectedService?.name,
                ticketPrinted: gs.ticketPrinted
            });

            // 🆕【修復 44】檢查彈窗是否正在等待顯示（防止 2.5 秒煙火延遲期間重複點擊）
            if (gs.isTicketModalPending) {
                this.Debug.log('ui', '[Ticket] 防抖：彈窗正在等待顯示中');
                return;
            }

            // 🆕【修復 21】如果在輔助點擊模式的 viewTicket 階段，保持模式運行，等待用戶點擊完成鈕
            if (gs.clickModeState?.enabled && gs.clickModeState?.currentPhase === 'viewTicket') {
                this.Debug.log('assist', '[A2-ClickMode] 用戶點擊查看票券，票據彈窗已顯示，等待用戶點擊完成鈕');
                // 保持輔助模式運行，等待用戶手動點擊完成鈕
            }

            // 防止手機端重複觸發
            const now = Date.now();
            if (this._lastTicketModalTime && now - this._lastTicketModalTime < 500) {
                this.Debug.log('ui', '[Ticket] 防抖：忽略重複點擊');
                return;
            }
            this._lastTicketModalTime = now;

            // 簡單模式驗證
            if (!this.validateEasyModeAction('ticket')) {
                this.Debug.log('ui', '[Ticket] 驗證失敗，無法取票');
                return;
            }

            // 普通/困難模式驗證
            if (this.handleNormalModeAction('takeTicket')) {
                return; // 錯誤操作，已處理
            }

            // 🎆 指定任務模式：查看票券時觸發煙火，然後等待動畫完成後再顯示彈窗
            this.Debug.log('ui', '[Ticket] 查看票券，檢查是否觸發煙火');
            const taskType = this.state.settings.taskType;
            const shouldPlayFireworks = taskType === 'assigned';

            if (shouldPlayFireworks) {
                this.playSuccessFireworks();
                this.Debug.log('ui', '[Ticket] 煙火動畫播放中，2.5秒後顯示票據彈窗');
            }

            // 🆕【修復 44】設定彈窗等待中旗標
            this.state.gameState.isTicketModalPending = true;

            // ★★★ 延遲顯示票據彈窗，等待煙火動畫完成 ★★★
            const delayTime = shouldPlayFireworks ? 2500 : 0; // 煙火動畫約2.5秒
            this.TimerManager.setTimeout(() => {
                this._showTicketModalContent();
            }, delayTime, 'screenTransition');
        },

        // ★★★ 新增：票據彈窗內容顯示（從 showTicketModal 分離出來）★★★
        _showTicketModalContent() {
            // 🆕【修復 44】清除等待中旗標
            this.state.gameState.isTicketModalPending = false;

            // 🆕【修復 44】移除已存在的票據彈窗（防止多個彈窗疊加）
            const existingModal = document.querySelector('.ticket-modal-content')?.closest('.modal-overlay');
            if (existingModal) {
                this.Debug.log('ui', '[Ticket] 移除已存在的票據彈窗');
                existingModal.remove();
            }

            const service = this.state.gameState.selectedService;
            const queueNumber = this.state.gameState.queueNumber;
            this.Debug.log('ui', '[Ticket] 顯示票據彈窗內容 - 服務:', service?.name, '號碼:', queueNumber);

            // 如果沒有選擇服務，不顯示票據（新一輪尚未選擇服務時）
            if (!service) {
                this.Debug.log('ui', '[Ticket] 錯誤：沒有選擇的服務，無法顯示票據');
                return;
            }

            // 移除提示動畫
            document.querySelectorAll('.easy-mode-hint').forEach(el => {
                el.classList.remove('easy-mode-hint');
            });
            this.Debug.log('ui', '[Ticket] 已移除所有提示動畫');

            // 將提示鈕變模糊
            const hintBtn = document.querySelector('.hint-btn-screen');
            if (hintBtn) {
                hintBtn.style.filter = 'blur(3px)';
                hintBtn.style.pointerEvents = 'none';
                this.Debug.log('ui', '[Ticket] 提示鈕已設為模糊');
            }

            // 將票券出口區域設為模糊
            const ticketArea = document.querySelector('.ticket-dispenser-area');
            if (ticketArea) {
                ticketArea.style.filter = 'blur(5px)';
                this.Debug.log('ui', '[Ticket] 票券出口區域已設為模糊');
            }

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.style.zIndex = '1000';
            modal.innerHTML = `
                <div class="modal-content ticket-modal-content">
                    <div class="modal-header" style="padding: 16px 24px 8px 24px;">
                        <h3 style="text-align: center; width: 100%;">🎫 您的票據</h3>
                    </div>
                    <div class="modal-body" style="padding: 20px 40px 40px 40px;">
                        <div class="ticket-large">
                            <div class="ticket-large-header" style="flex-direction: column; text-align: center;">
                                <div class="shop-name-large" style="justify-content: center; margin-bottom: 20px;">
                                    <img src="../images/a2/icon-a2-barber-shop-02.png" alt="百元理髮店" style="width: 4rem; height: 4rem; object-fit: contain; vertical-align: middle; margin-right: 0.5rem;">
                                    百元理髮店
                                </div>
                            </div>
                            <div class="ticket-large-divider"></div>
                            <div class="ticket-large-body">
                                <div class="ticket-info-row">
                                    <span class="ticket-label">服務項目：</span>
                                    <span class="ticket-value">${service.name}</span>
                                </div>
                                <div class="ticket-info-row">
                                    <span class="ticket-label">服務價格：</span>
                                    <span class="ticket-value ticket-price-large">NT$ ${service.price}</span>
                                </div>
                                <div class="ticket-info-row">
                                    <span class="ticket-label">等候號碼：</span>
                                    <span class="ticket-value">${String(queueNumber).padStart(2, '0')} 號</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="padding: 20px 24px;">
                        <button class="complete-btn" onclick="BarberKiosk.completeTransaction()">
                            ✓ 完成
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // 播放票據語音內容
            const self = this;
            this.TimerManager.setTimeout(() => {
                try {
                    self.speech.speakCustom(`您的號碼是${queueNumber}號，服務項目是${service.name}，價格是${self.convertAmountToSpeech(service.price)}，請等候叫號`);
                } catch (error) {
                    this.Debug.error('[Ticket] 語音播放錯誤:', error);
                }
            }, 300, 'speechDelay');
        },

        // 完成交易（不顯示交易摘要）
        completeTransaction() {
            this.Debug.log('flow', '[Complete] 開始完成交易，ticketPrinted =', this.state.gameState.ticketPrinted);

            // 防止手機端重複觸發
            const now = Date.now();
            if (this._lastCompleteTime && now - this._lastCompleteTime < 500) {
                this.Debug.log('flow', '[Complete] 防抖：忽略重複點擊');
                return;
            }
            this._lastCompleteTime = now;

            // 🆕【修復 22】如果在輔助點擊模式，結束模式並隱藏進度指示器
            const gs = this.state.gameState;
            if (gs.clickModeState?.enabled && gs.clickModeState?.currentPhase === 'viewTicket') {
                this.Debug.log('assist', '[A2-ClickMode] 用戶點擊完成鈕，輔助點擊模式結束');
                gs.clickModeState.enabled = false;
                gs.clickModeState.waitingForClick = false;
                this.hidePhaseIndicator();
            }

            // 關閉彈跳視窗
            const modal = document.querySelector('.modal-overlay');
            if (modal) {
                modal.remove();
            }

            // 恢復提示鈕
            const hintBtn = document.querySelector('.hint-btn-screen');
            if (hintBtn) {
                hintBtn.style.filter = '';
                hintBtn.style.pointerEvents = '';
                this.Debug.log('flow', '[Complete] 提示鈕模糊效果已清除');
            }

            // 恢復票券出口區域的模糊效果
            const ticketArea = document.querySelector('.ticket-dispenser-area');
            if (ticketArea) {
                ticketArea.style.filter = '';
                this.Debug.log('flow', '[Complete] 票券出口區域模糊效果已清除');
            }

            // 簡單模式：完成（移除所有提示）
            if (this.state.settings.difficulty === 'easy') {
                document.querySelectorAll('.easy-mode-hint').forEach(el => {
                    el.classList.remove('easy-mode-hint');
                });
            }

            this.audio.playSound('beep');

            // 增加已完成訂單數
            this.state.gameState.completedOrders++;
            this.Debug.log('flow', `[A2-Kiosk] 已完成訂單數: ${this.state.gameState.completedOrders}/${this.state.settings.questionCount}`);

            // 檢查是否達到設定的題數
            const targetCount = this.state.settings.questionCount;
            const completedCount = this.state.gameState.completedOrders;

            if (targetCount && completedCount >= targetCount) {
                // 達到目標題數，顯示完成畫面
                BarberKiosk.Debug.log('init', ' 測驗完成！');
                this.showCompletionScreen();
            } else {
                // 繼續下一輪
                const self = this;
                this.TimerManager.setTimeout(() => {
                    try {
                        this.Debug.log('flow', '[Complete] 500ms後準備重置狀態');
                        // 重置遊戲狀態
                        self.state.gameState.selectedService = null;
                        self.state.gameState.requiredAmount = 0;
                        self.state.gameState.insertedAmount = 0;
                        self.state.gameState.paymentComplete = false;
                        self.state.gameState.ticketPrinted = false;
                        this.Debug.log('flow', '[Complete] ticketPrinted 設為 false，值為:', self.state.gameState.ticketPrinted);
                        self.state.gameState.currentScene = 'service-selection';
                        self.state.gameState.currentStep = 1;

                        // 清空上一輪的票券（在進入歡迎畫面前）
                        const ticketOutput = document.getElementById('ticket-output');
                        if (ticketOutput) {
                            ticketOutput.innerHTML = '';
                            this.Debug.log('flow', '[Complete] 已清空上一輪票券');
                        }
                        // 移除「查看票券」按鈕
                        const dispenserArea = document.querySelector('.ticket-dispenser-area .ticket-printer');
                        if (dispenserArea) {
                            const oldButton = dispenserArea.querySelector('.take-ticket-btn');
                            if (oldButton) {
                                oldButton.remove();
                                this.Debug.log('flow', '[Complete] 已移除上一輪的查看票券按鈕');
                            }
                        }

                        // coinFirst 模式：重新設定並進入歡迎畫面
                        if (self.isCoinFirstMode()) {
                            this.Debug.log('flow', '[Complete] coinFirst 模式：準備下一輪');
                            self.state.gameState.normalMode.currentStep = 'step1';
                            self.state.gameState.normalMode.errorCount = 0;
                            self.state.gameState.normalMode.hintShown = false;
                            self.state.gameState.normalMode.billsInserted = false;
                            self.state.gameState.normalMode.coinsInserted = false;
                            self.state.gameState.normalMode.tempSelectedMoney = [];
                            self.state.gameState.normalMode.correctAmounts = null;
                            self.state.gameState.normalMode.usedAmounts = [];
                            self.removeNormalModeHint();
                            if (self.state.settings.taskType === 'coinFirstAssigned') {
                                self.setupCoinFirstAssignedMode();
                            } else {
                                self.setupCoinFirstFreeMode();
                            }
                            self.showWelcomeScreen();
                        }
                        // 簡單模式：重新設定並進入歡迎畫面
                        else if (self.state.settings.difficulty === 'easy' && self.state.settings.taskType === 'assigned') {
                            this.Debug.log('flow', '[Complete] 呼叫 setupEasyMode() 和 showWelcomeScreen()');
                            self.setupEasyMode();
                            self.showWelcomeScreen();
                        }
                        // 普通/困難模式指定任務：重新設定並進入歡迎畫面
                        else if ((self.state.settings.difficulty === 'normal' || self.state.settings.difficulty === 'hard') &&
                                 self.state.settings.taskType === 'assigned') {
                            this.Debug.log('flow', '[Complete] 呼叫 setupAssignedMode() 和 showWelcomeScreen()');
                            self.state.gameState.normalMode.currentStep = 'step1';
                            self.state.gameState.normalMode.errorCount = 0;
                            self.state.gameState.normalMode.hintShown = false;
                            self.state.gameState.normalMode.billsInserted = false;
                            self.state.gameState.normalMode.coinsInserted = false;
                            self.state.gameState.normalMode.tempSelectedMoney = [];
                            self.removeNormalModeHint();
                            this.Debug.log('flow', '[Complete] 呼叫 setupAssignedMode() 前，ticketPrinted =', self.state.gameState.ticketPrinted);
                            self.setupAssignedMode();
                            this.Debug.log('flow', '[Complete] setupAssignedMode() 後，ticketPrinted =', self.state.gameState.ticketPrinted);
                            self.showWelcomeScreen();
                            this.Debug.log('flow', '[Complete] showWelcomeScreen() 後，ticketPrinted =', self.state.gameState.ticketPrinted);
                        }
                        // 簡單模式自選服務：重新設定並進入歡迎畫面
                        else if (self.state.settings.difficulty === 'easy' && self.state.settings.taskType === 'freeChoice') {
                            this.Debug.log('flow', '[Complete] 簡單模式自選服務：呼叫 setupEasyFreeChoiceMode() 和 showWelcomeScreen()');
                            self.setupEasyFreeChoiceMode();
                            self.showWelcomeScreen();
                        }
                        // 🆕【修復 47】普通/困難模式自選任務：重新設定並進入歡迎畫面
                        else {
                            this.Debug.log('flow', '[Complete] 普通/困難模式自選：呼叫 setupFreeChoiceMode() 和 showWelcomeScreen()');
                            self.state.gameState.normalMode.currentStep = 'step1';
                            self.state.gameState.normalMode.errorCount = 0;
                            self.state.gameState.normalMode.hintShown = false;
                            self.state.gameState.normalMode.billsInserted = false;
                            self.state.gameState.normalMode.coinsInserted = false;
                            self.state.gameState.normalMode.tempSelectedMoney = [];
                            // 🆕【修復 46】清除上一輪的正確金額組合和已使用金額
                            self.state.gameState.normalMode.correctAmounts = null;
                            self.state.gameState.normalMode.usedAmounts = [];
                            self.state.gameState.normalMode.paymentErrorCount = 0;
                            this.Debug.log('flow', '[Complete] 已清除上一輪的提示組合和錯誤計數');
                            self.removeNormalModeHint();
                            // 🆕【修復 47】呼叫 setupFreeChoiceMode() 重新生成完整錢包
                            this.Debug.log('flow', '[Complete] 呼叫 setupFreeChoiceMode() 前，錢包狀態:', self.state.gameState.normalMode.walletCoins);
                            self.setupFreeChoiceMode();
                            this.Debug.log('flow', '[Complete] setupFreeChoiceMode() 後，錢包狀態:', self.state.gameState.normalMode.walletCoins);
                            // 🆕【修復 47】顯示歡迎畫面（第一頁：歡迎來百元理髮店，第二頁：我的錢包）
                            self.showWelcomeScreen();
                            this.Debug.log('flow', '[Complete] showWelcomeScreen() 後，準備開始第二輪');
                        }
                    } catch (error) {
                        this.Debug.error('[Complete] 開始下一輪錯誤:', error);
                    }
                }, 500, 'screenTransition');
            }
        },

        // 顯示測驗完成畫面
        showCompletionScreen() {
            if (this._completionScreenShown) {
                this.Debug.log('flow', '[A2] 完成畫面已顯示，忽略重複呼叫');
                return;
            }
            this._completionScreenShown = true;
            if (window.TutorContext) TutorContext.update({ screen: 'result' });
            document.getElementById('click-exec-overlay')?.remove();
            // 停用輔助點擊模式（完成畫面不需要輔助）
            const gs = this.state.gameState;
            if (gs.clickModeState) {
                this.Debug.log('assist', '[A2-ClickMode] 進入完成畫面，停用輔助點擊模式');
                gs.clickModeState.enabled = false;
                gs.clickModeState.waitingForClick = false;
                gs.clickModeState.waitingForStart = false;
            }
            this.unbindClickModeHandler();

            const completedCount = this.state.gameState.completedOrders;

            // 計算完成時間
            const endTime = Date.now();
            const startTime = this.state.gameState.startTime || endTime;
            const elapsedSeconds = Math.floor((endTime - startTime) / 1000);

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'a2', unitName: 'A2 理髮店售票機', series: 'A',
                score: completedCount, total: completedCount,
                difficulty: this.state.settings?.difficulty, durationSec: elapsedSeconds });
            const minutes = Math.floor(elapsedSeconds / 60);
            const seconds = elapsedSeconds % 60;
            const timeDisplay = minutes > 0 ? `${minutes} 分 ${seconds} 秒` : `${seconds} 秒`;

            const app = document.getElementById('app');

            // 允許完成畫面滾動（A4 架構：只操作 #app）
            app.style.overflowY = 'auto';
            app.style.height = '100%';

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
                                    <div class="achievement-item">🎯 完成理髮廳自助機操作流程學習</div>
                                    <div class="achievement-item">💰 學會服務選擇和付款計算</div>
                                    <div class="achievement-item">🪪 掌握取號和等候流程</div>
                                </div>
                            </div>

                            <div class="result-buttons">
                                <button class="play-again-btn" onclick="BarberKiosk.startGame()">
                                    <span class="btn-icon">🔄</span>
                                    <span class="btn-text">再玩一次</span>
                                </button>
                                <button class="main-menu-btn" onclick="BarberKiosk.showSettings()">
                                    <span class="btn-icon">⚙️</span>
                                    <span class="btn-text">返回設定</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    .results-wrapper {
                        position: relative;
                        width: 100%;
                        min-height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: flex-start;
                        padding: 20px 20px 80px 20px;
                        box-sizing: border-box;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        overflow-y: auto;
                        -webkit-overflow-scrolling: touch;
                        z-index: 10000;
                    }
                    /* 🔧 [Phase 2] @keyframes fadeIn/celebrate/completionBounce 已移至 CSS/injectGlobalAnimationStyles() */

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
                        animation: completionBounce 2s infinite;
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

            // 播放完成語音
            const countSpeech = NumberSpeechUtils.convertToQuantitySpeech(completedCount, '題');
            this.speech.speakCustom(`完成挑戰！共完成 ${countSpeech}，用時 ${timeDisplay}`);

            // 🎁 獎勵系統連結事件
            const endgameRewardLink = document.getElementById('endgame-reward-link');
            if (endgameRewardLink) {
                this.EventManager.on(endgameRewardLink, 'click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                }, {}, 'gameUI');
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
                        BarberKiosk.TimerManager.setTimeout(fireConfetti, 250, 'confetti');
                    };
                    fireConfetti();
                }
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

        // 取票（簡單模式）- 保留用於相容性
        takeTicket() {
            this.showTicketModal();
        },


        // updateTicketPreview方法已刪除，不再需要票據預覽功能

        // 簡單模式交易摘要
        showTransactionSummary() {
            const app = document.getElementById('app');
            const service = this.state.gameState.selectedService;
            const walletAmount = this.state.gameState.easyMode.walletAmount;

            app.innerHTML = `
                <style>
                    .summary-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: var(--macaron-bg);
                        padding: 20px;
                    }
                    .summary-box {
                        background: var(--macaron-card);
                        border: 3px solid var(--macaron-border);
                        border-radius: 24px;
                        padding: 40px;
                        max-width: 760px;
                        width: 100%;
                        box-sizing: border-box;
                        text-align: center;
                        box-shadow: none;
                    }
                    .summary-title {
                        font-size: 32px;
                        color: var(--macaron-text);
                        margin-bottom: 30px;
                    }
                    .summary-content {
                        margin: 30px 0;
                        font-size: 18px;
                        color: var(--macaron-text);
                        line-height: 2;
                    }
                    .summary-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 15px 20px;
                        margin: 10px 0;
                        background: var(--macaron-bg);
                        border-radius: 12px;
                        border: 2px solid var(--macaron-border);
                    }
                    .summary-label {
                        font-weight: 600;
                        color: var(--macaron-text-secondary);
                    }
                    .summary-value {
                        font-weight: 600;
                        color: var(--macaron-text);
                    }
                    .finish-btn {
                        margin-top: 30px;
                        padding: 15px 40px;
                        background: var(--macaron-mint);
                        border: 2px solid var(--macaron-border);
                        border-radius: 20px;
                        color: var(--macaron-text);
                        font-size: 20px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }
                    .finish-btn:hover {
                        background: var(--macaron-blue);
                        transform: translateY(-2px);
                    }
                    /* 手機端：縮小卡片內距，善用螢幕寬度 */
                    @media (max-width: 600px) {
                        .summary-container { padding: 12px; }
                        .summary-box { padding: 24px 18px; }
                        .summary-title { font-size: 26px; }
                    }
                </style>
                <div class="summary-container">
                    <div class="summary-box">
                        <h1 class="summary-title">🎉 交易完成！</h1>
                        <div class="summary-content">
                            <div class="summary-item">
                                <span class="summary-label">服務項目</span>
                                <span class="summary-value">${service.name}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">服務金額</span>
                                <span class="summary-value">NT$ ${service.price}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">已付金額</span>
                                <span class="summary-value">NT$ ${walletAmount}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">排隊號碼</span>
                                <span class="summary-value">${String(this.state.gameState.queueNumber).padStart(2, '0')} 號</span>
                            </div>
                        </div>
                        <p style="color: var(--macaron-text-secondary); margin: 20px 0;">
                            請至櫃檯依序等候服務
                        </p>
                        <button class="finish-btn" onclick="BarberKiosk.finishEasyMode()">
                            完成
                        </button>
                    </div>
                </div>
            `;
        },

        finishEasyMode() {
            this.audio.playSound('success');
            // 可以回到設定頁面或其他處理
            this.showSettings();
        },

        // =====================================================
        // 操作控制方法
        // =====================================================

        startOver() {
            this._completionScreenShown = false;
            this.audio.playSound('beep');

            // 重置狀態
            this.state.gameState = {
                ...this.state.gameState,
                currentScene: 'welcome',
                currentStep: 0,
                selectedService: null,
                requiredAmount: 0,
                insertedAmount: 0,
                paymentComplete: false,
                ticketPrinted: false,
                queueNumber: 1
            };

            // 回到歡迎畫面
            this.updateScreen(this.HTMLTemplates.welcomeScreen());
            this.updateMoneyDisplay();

            // 清空票券出口
            const ticketOutput = document.getElementById('ticket-output');
            if (ticketOutput) {
                ticketOutput.innerHTML = '';
            }
        },

        goBack() {
            this.audio.playSound('beep');

            if (this.state.gameState.currentScene === 'service-selection') {
                this.state.gameState.currentScene = 'welcome';
                this.state.gameState.currentStep = 0;
                this.updateScreen(this.HTMLTemplates.welcomeScreen());
            }
        },

        cancelPayment() {
            this.audio.playSound('beep');

            // 退回已投入的金額（模擬）
            if (this.state.gameState.insertedAmount > 0) {
                this.speech.speak('refund', { amount: this.state.gameState.insertedAmount });
            }

            // 重置付款狀態
            this.state.gameState.insertedAmount = 0;
            this.state.gameState.selectedService = null;
            this.state.gameState.requiredAmount = 0;

            // 返回服務選擇
            this.showServiceSelection();
        },

        // =====================================================
        // 事件處理系統
        // =====================================================
        bindEvents() {
            // document 層級匿名監聽器只綁定一次（整個 session 共用）
            // addTouchFeedback() 每輪都需重新綁定（render() 後 DOM 元素已替換）
            if (!this._documentEventsBound) {
                this._documentEventsBound = true;

                // 綁定投幣事件 - 現在改為彈窗選擇模式，移除直接投幣
                const handleMoneyInput = (event) => {
                    // 移除舊的直接投幣邏輯，現在通過點擊事件觸發模態窗口
                    // 保留結構以防其他地方需要
                };

                // 同時綁定點擊和觸控事件
                document.addEventListener('click', handleMoneyInput);
                document.addEventListener('touchend', handleMoneyInput);

                // 綁定票券出口區域的點擊事件（簡單模式錯誤驗證）
                document.addEventListener('click', (event) => {
                    // 檢查是否點擊票券出口區域
                    const ticketArea = event.target.closest('.ticket-dispenser-area');
                    if (ticketArea && this.state.settings.difficulty === 'easy') {
                        const step = this.state.gameState.easyMode.currentStep;
                        // 步驟1：不允許點擊票券區
                        if (step === 'step1') {
                            // 檢查是否點擊的是票券本身（步驟3才允許）
                            const isTicket = event.target.closest('.printed-ticket');
                            if (!isTicket) {
                                this.validateEasyModeAction('ticket-area');
                            }
                        }
                    }
                });

                // 防止觸控時的雙重觸發
                let touchHandled = false;
                document.addEventListener('touchstart', () => {
                    touchHandled = true;
                    this.TimerManager.setTimeout(() => touchHandled = false, 300, 'uiAnimation');
                });

                document.addEventListener('click', (event) => {
                    if (touchHandled) {
                        event.preventDefault();
                        return;
                    }
                });
            }

            // 每輪都需重新綁定：render() 後 DOM 元素已替換，舊元素的 listener 隨之消失
            this.addTouchFeedback();

            BarberKiosk.Debug.log('init', ' 事件監聽器綁定完成（包含觸控支援）');
        },

        addTouchFeedback() {
            // 為可觸控元素添加觸控回饋
            const touchableElements = document.querySelectorAll('.bill-slot, .coin-item, .action-btn, .service-item');

            touchableElements.forEach(element => {
                element.addEventListener('touchstart', (e) => {
                    element.style.transform = 'scale(0.95)';
                    element.style.transition = 'transform 0.1s ease';
                });

                element.addEventListener('touchend', (e) => {
                    this.TimerManager.setTimeout(() => {
                        element.style.transform = '';
                    }, 100, 'uiAnimation');
                });

                // 防止觸控時選中文字
                element.style.webkitUserSelect = 'none';
                element.style.userSelect = 'none';
                element.style.webkitTouchCallout = 'none';
            });
        },

        // =====================================================
        // 鍵盤快捷鍵處理
        // =====================================================
        handleServiceSelect(serviceNumber) {
            const difficulty = this.state.settings.difficulty;
            const services = this.serviceConfig[difficulty].services;

            if (serviceNumber >= 1 && serviceNumber <= services.length) {
                const service = services[serviceNumber - 1];
                this.selectService(service.id);
            }
        },

        handleEnterKey() {
            // 根據當前場景執行相應操作
            switch (this.state.gameState.currentScene) {
                case 'welcome':
                    this.showServiceSelection();
                    break;
                case 'printing':
                case 'complete':
                    this.takeTicket();
                    break;
                default:
                    break;
            }
        },

        handleCancelKey() {
            if (this.state.gameState.currentScene === 'payment') {
                this.cancelPayment();
            } else {
                this.goBack();
            }
        },

        // =====================================================
        // 返回主畫面
        // =====================================================
        backToMainMenu() {
            // 返回到單元選擇畫面
            window.location.href = '../index.html#part4';
        },

        // =====================================================
        // 數字輸入器功能（用於自訂題數）
        // =====================================================

        // 顯示題數輸入器
        showQuestionCountNumberInput() {
            this.showNumberInput('questionCount');
        },

        // 🔧 [新增] 點擊自訂題數輸入框時，觸發自訂按鈕
        handleCustomQuestionClick() {
            const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
            if (customBtn) {
                customBtn.click();
            }
        },

        // 自訂錢包的幣值數量狀態
        customWalletQuantities: {
            10: 0,
            50: 0,
            100: 0
        },

        // 顯示自訂錢包模態視窗（參考 A3 設計，只使用 10、50、100 元）
        showCustomWalletModal() {
            // 初始化數量（如果之前有設定過，則使用之前的設定）
            if (this.state.settings.customWalletDetails) {
                this.customWalletQuantities = { ...this.state.settings.customWalletDetails };
            } else {
                this.customWalletQuantities = { 10: 0, 50: 0, 100: 0 };
            }

            // 只使用 100、50、10 元（從大到小）
            const denominations = [100, 50, 10];

            let moneyItemsHTML = denominations.map(value => {
                const randomFace = Math.random() < 0.5 ? 'front' : 'back';
                const imagePath = `../images/money/${value}_yuan_${randomFace}.png`;
                const quantity = this.customWalletQuantities[value] || 0;
                const isBill = value >= 100;

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
                                width: ${isBill ? '80px' : '50px'};
                                height: auto;
                                object-fit: contain;
                            ">
                            <span style="font-size: 18px; font-weight: bold; color: #333;">${value}元</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button onclick="BarberKiosk.adjustCustomWalletQuantity(${value}, -1)"
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
                            <button onclick="BarberKiosk.adjustCustomWalletQuantity(${value}, 1)"
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
                        <div id="custom-wallet-warning" style="
                            text-align: center;
                            font-size: 14px;
                            color: #e74c3c;
                            min-height: 20px;
                            margin-top: -8px;
                            margin-bottom: 4px;
                        ">${totalAmount < 30 ? '⚠️ 最少需要 30 元' : ''}</div>

                        <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px;">
                            <button onclick="BarberKiosk.confirmCustomWallet()"
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
                            <button onclick="BarberKiosk.closeCustomWalletModal()"
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
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
        },

        // 調整自訂錢包幣值數量
        adjustCustomWalletQuantity(denomination, change) {
            const currentQty = this.customWalletQuantities[denomination] || 0;
            const newQty = Math.max(0, Math.min(20, currentQty + change)); // 限制0-20張

            this.customWalletQuantities[denomination] = newQty;

            // 更新顯示
            const qtyElement = document.getElementById(`custom-wallet-qty-${denomination}`);
            if (qtyElement) {
                qtyElement.textContent = newQty;
            }

            // 更新總金額
            const newTotal = this.calculateCustomWalletTotal();
            const totalElement = document.getElementById('custom-wallet-total');
            if (totalElement) {
                totalElement.textContent = `NT$ ${newTotal}`;
            }
            const warningEl = document.getElementById('custom-wallet-warning');
            if (warningEl) {
                warningEl.textContent = newTotal < 30 ? '⚠️ 最少需要 30 元' : '';
            }

            // 播放音效
            this.audio.playSound('beep');
        },

        // 計算自訂錢包總金額
        calculateCustomWalletTotal() {
            let total = 0;
            for (const [denomination, quantity] of Object.entries(this.customWalletQuantities)) {
                total += parseInt(denomination) * quantity;
            }
            return total;
        },

        // 確認自訂錢包設定
        confirmCustomWallet() {
            const totalAmount = this.calculateCustomWalletTotal();

            // 檢查金額範圍（30-1000元）
            if (totalAmount < 30) {
                this.showToast('錢包金額至少需要 30 元', 'warning');
                return;
            }

            if (totalAmount > 1000) {
                this.showToast('錢包金額不能超過 1000 元', 'warning');
                return;
            }

            // 檢查是否有選擇至少一種幣值
            const hasSelection = Object.values(this.customWalletQuantities).some(qty => qty > 0);
            if (!hasSelection) {
                this.showToast('請至少選擇一種幣值！', 'warning');
                return;
            }

            // 儲存詳細的幣值數量和總金額
            this.state.settings.customWalletDetails = { ...this.customWalletQuantities };
            this.state.settings.walletAmount = totalAmount;

            // 計算選擇了哪些幣值類型（用於錢包生成）
            const selectedTypes = Object.keys(this.customWalletQuantities)
                .filter(denom => this.customWalletQuantities[denom] > 0)
                .map(denom => parseInt(denom));
            this.state.settings.customWalletTypes = selectedTypes;
            this.state.settings.walletType = 'custom';

            this.Debug.log('coin', '[A2-BarberKiosk] 自訂錢包:', this.customWalletQuantities, '總金額:', totalAmount);

            this.closeCustomWalletModal();

            // 直接更新按鈕文字，避免設定頁重新渲染（閃爍）
            const customBtn = document.querySelector('[data-type="walletType"][data-value="custom"]');
            if (customBtn) {
                customBtn.textContent = totalAmount + '元（自訂）';
                document.querySelectorAll('[data-type="walletType"]').forEach(b => b.classList.remove('active'));
                customBtn.classList.add('active');
            }
            this.updateStartButton();

            this.speech.speakCustom(`已設定自訂錢包金額為${this.convertAmountToSpeech(totalAmount)}`);
        },

        // 檢查是否可以組成目標金額（動態規劃）
        canMakeAmount(amount, denominations) {
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

        // 關閉自訂錢包模態視窗
        closeCustomWalletModal() {
            const modal = document.getElementById('custom-wallet-modal');
            if (modal) {
                modal.remove();
            }
        },

        // 顯示數字輸入器
        showNumberInput(type = 'questionCount') {
            const existingPopup = document.getElementById('number-input-popup');
            if (existingPopup) {
                this.closeNumberInput();
                this.TimerManager.setTimeout(() => {
                    this.createNumberInput(type);
                }, 10, 'uiAnimation');
                return;
            }
            this.createNumberInput(type);
        },

        // 創建數字輸入器
        createNumberInput(type = 'questionCount') {
            let title = type === 'walletAmount' ? '請輸入錢包金額' : '請輸入題數';
            const inputPopupHTML = `<div id="number-input-popup" class="number-input-popup" data-input-type="${type}"><div class="number-input-container"><div class="number-input-header"><h3>${title}</h3><button class="close-btn" onclick="BarberKiosk.closeNumberInput()">×</button></div><div class="number-input-display"><input type="text" id="number-display" readonly value=""></div><div class="number-input-buttons"><button onclick="BarberKiosk.appendNumber('1')">1</button><button onclick="BarberKiosk.appendNumber('2')">2</button><button onclick="BarberKiosk.appendNumber('3')">3</button><button onclick="BarberKiosk.clearNumber()" class="clear-btn">清除</button><button onclick="BarberKiosk.appendNumber('4')">4</button><button onclick="BarberKiosk.appendNumber('5')">5</button><button onclick="BarberKiosk.appendNumber('6')">6</button><button onclick="BarberKiosk.backspaceNumber()" class="backspace-btn">⌫</button><button onclick="BarberKiosk.appendNumber('7')">7</button><button onclick="BarberKiosk.appendNumber('8')">8</button><button onclick="BarberKiosk.appendNumber('9')">9</button><button onclick="BarberKiosk.confirmNumber()" class="confirm-btn">確認</button><button onclick="BarberKiosk.appendNumber('0')" class="zero-btn">0</button></div></div></div>`;
            const inputStyles = `<style id="number-input-styles">.number-input-popup{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;animation:fadeIn 0.3s ease-out}.number-input-container{background:white;border-radius:15px;padding:20px;box-shadow:0 10px 30px rgba(0,0,0,0.3);width:320px;max-width:95vw;animation:bounceIn 0.3s ease-out}.number-input-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid #f0f0f0;padding-bottom:10px}.number-input-header h3{margin:0;color:#333;font-size:18px}.close-btn{background:none;border:none;font-size:24px;cursor:pointer;color:#666;padding:0;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center}.close-btn:hover{background:#f0f0f0}.number-input-display{margin-bottom:20px}#number-display{width:100%;border:2px solid #ddd;padding:15px;font-size:24px;text-align:center;border-radius:8px;background:#f9f9f9;font-family:'Courier New',monospace;box-sizing:border-box}.number-input-buttons{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.number-input-buttons button{padding:15px;font-size:18px;font-weight:bold;border:2px solid #ddd;border-radius:8px;background:white;cursor:pointer;transition:all 0.2s}.number-input-buttons button:hover{background:#f0f0f0;transform:translateY(-1px)}.number-input-buttons button:active{transform:translateY(0);background:#e0e0e0}.number-input-buttons button.clear-btn{background:#ff6b6b!important;color:white!important;border-color:#ff6b6b!important;font-size:14px!important}.number-input-buttons button.backspace-btn{background:#ffa726!important;color:white!important;border-color:#ffa726!important;font-size:16px!important}.number-input-buttons button.confirm-btn{background:#4caf50!important;color:white!important;border-color:#4caf50!important;grid-row:span 2;font-size:14px!important}.number-input-buttons button.zero-btn{grid-column:span 3}/* [Phase 2] @keyframes fadeIn/bounceIn 已移至 CSS (a2_barber_shop_kiosk.css:1155,1166) */</style>`;
            if (!document.getElementById('number-input-styles')) {
                document.head.insertAdjacentHTML('beforeend', inputStyles);
            }
            document.body.insertAdjacentHTML('beforeend', inputPopupHTML);
        },

        closeNumberInput() {
            const popup = document.getElementById('number-input-popup');
            if (popup) popup.remove();
        },

        appendNumber(digit) {
            const now = Date.now();
            if (this._lastAppendTime && now - this._lastAppendTime < 50) return;
            this._lastAppendTime = now;
            const display = document.getElementById('number-display');
            if (!display) return;
            this.audio.playSound('keypad');
            if (display.value === '' || display.value === '0') {
                display.value = digit;
            } else {
                display.value += digit;
            }
        },

        clearNumber() {
            const now = Date.now();
            if (this._lastClearTime && now - this._lastClearTime < 300) return;
            this._lastClearTime = now;
            const display = document.getElementById('number-display');
            if (!display) return;
            this.audio.playSound('keypad');
            display.value = '';
        },

        backspaceNumber() {
            const now = Date.now();
            if (this._lastBackspaceTime && now - this._lastBackspaceTime < 200) return;
            this._lastBackspaceTime = now;
            const display = document.getElementById('number-display');
            if (!display) return;
            this.audio.playSound('keypad');
            if (display.value.length > 1) {
                display.value = display.value.slice(0, -1);
            } else {
                display.value = '';
            }
        },

        confirmNumber() {
            const now = Date.now();
            if (this._lastConfirmTime && now - this._lastConfirmTime < 500) return;
            this._lastConfirmTime = now;
            const display = document.getElementById('number-display');
            const popup = document.getElementById('number-input-popup');
            const inputType = popup ? popup.dataset.inputType : 'questionCount';
            if (!display) return;
            const inputValue = parseInt(display.value);
            if (inputType === 'questionCount') {
                if (inputValue > 0 && inputValue <= 100) {
                    this.state.settings.questionCount = inputValue;
                    this.Debug.log('state', `[Setting] 自訂題數已設定: questionCount = ${inputValue}`);
                    this.audio.playSound('beep');

                    // 🔧 [修正] 直接更新DOM，避免重新渲染整個設定畫面（防止閃爍）
                    const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
                    if (customBtn) {
                        const group = customBtn.closest('.button-group');
                        group.querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                        customBtn.classList.add('active');
                    }

                    const customDisplay = document.querySelector('.custom-question-display');
                    const customInput = document.getElementById('custom-question-count-a2');
                    if (customDisplay && customInput) {
                        customDisplay.style.display = 'block';
                        customInput.value = `${inputValue}題`;
                        customInput.style.background = '#667eea';
                        customInput.style.color = 'white';
                        customInput.style.borderColor = '#667eea';
                    }

                    // 🔧 [修正] 更新開始按鈕狀態（避免按鈕卡在"請完成所有設定選項"）
                    this.updateStartButton();

                    this.closeNumberInput();
                } else {
                    this.showToast('請輸入1-100之間的有效題數！', 'warning');
                }
            } else if (inputType === 'walletAmount') {
                if (inputValue >= 30 && inputValue <= 1000) {
                    // 更新自訂錢包彈窗中的金額輸入框（不加「元」字）
                    const customAmountInput = document.getElementById('custom-wallet-amount');
                    if (customAmountInput) {
                        customAmountInput.value = inputValue;
                    }
                    this.audio.playSound('beep');
                    this.closeNumberInput();
                } else {
                    this.showToast('請輸入30-1000之間的有效金額！', 'warning');
                }
            }
        },

        // =====================================================
        // 輔助點擊模式 (Click Mode) - Phase 1: 核心基礎
        // =====================================================

        // 初始化輔助點擊模式（歡迎畫面階段）
        initClickModeForWelcome() {
            this.Debug.log('assist', '[A2-ClickMode] 初始化輔助點擊模式');

            // 初始化 clickModeState
            this.state.gameState.clickModeState = {
                enabled: false,
                currentPhase: 'welcome',
                currentStep: 0,
                actionQueue: [],
                waitingForClick: false,
                waitingForStart: false,
                lastClickTime: 0,
                welcomePageIndex: 1,
                initialPromptShown: false,  // 追蹤是否已顯示初始提示
                lastUpdateTime: Date.now()  // 🆕【優化】追蹤最後更新時間
            };

            // 建立輔助點擊遮罩（全程覆蓋，直到 click mode 結束）
            if (!document.getElementById('click-exec-overlay')) {
                const _ov = document.createElement('div');
                _ov.id = 'click-exec-overlay';
                const _tbEl = document.querySelector('.kiosk-title-bar');
                const _tbBottom = _tbEl ? Math.round(_tbEl.getBoundingClientRect().bottom) : 60;
                _ov.style.cssText = `position:fixed;top:${_tbBottom}px;left:0;right:0;bottom:0;z-index:10100;pointer-events:all;touch-action:none;background:transparent;`;
                document.body.appendChild(_ov);
            }

            // 綁定全局點擊事件監聽器
            this.bindClickModeHandler();

            // 🆕【優化】啟動狀態恢復監控（每 10 秒檢查一次）
            BarberKiosk.TimerManager.clearByCategory('clickModeRecovery');
            const scheduleRecoveryCheck = () => {
                BarberKiosk.TimerManager.setTimeout(() => {
                    this.checkAndRecoverClickModeState();
                    if (this.state.gameState?.clickModeState?.enabled) {
                        scheduleRecoveryCheck();
                    }
                }, 10000, 'clickModeRecovery');
            };
            scheduleRecoveryCheck();
            this.Debug.log('assist', '[A2-ClickMode] ✅ 狀態恢復監控已啟動');

            // 延遲啟用（500ms）
            this.TimerManager.setTimeout(() => {
                this.state.gameState.clickModeState.enabled = true;
                this.state.gameState.clickModeState.waitingForStart = true;
                this.Debug.log('assist', '[A2-ClickMode] 輔助點擊模式已啟用，等待用戶點擊開始');

                // 延遲顯示提示（1000ms）- 僅第一次
                this.TimerManager.setTimeout(() => {
                    this.showStartPrompt(true); // 傳入 true 表示是初始提示
                }, 1000, 'clickMode');
            }, 500, 'clickMode');
        },

        // 綁定全局點擊事件處理器
        bindClickModeHandler() {
            // 移除舊的監聽器（如果存在）
            if (this.clickModeHandler) {
                document.removeEventListener('click', this.clickModeHandler, true);
            }
            if (this.interceptClickModeHandler) {
                document.removeEventListener('click', this.interceptClickModeHandler, true);
            }

            // 🆕【修復 30】綁定捕獲階段處理器（interceptClickModeClick）
            this.interceptClickModeHandler = (e) => {
                this.interceptClickModeClick(e);
            };
            document.addEventListener('click', this.interceptClickModeHandler, true);

            // 創建新的監聽器（捕獲階段，確保在 service item 等元素之前攔截）
            this.clickModeHandler = (e) => {
                this.handleClickModeClick(e);
            };
            document.addEventListener('click', this.clickModeHandler, true);

            this._clickModeHandlerBound = true; // 標記已綁定
            this.Debug.log('assist', '[A2-ClickMode] 全局點擊事件已綁定（捕獲+冒泡）');
        },

        // 清除 click mode 狀態恢復監控 interval
        clearClickModeRecoveryInterval() {
            BarberKiosk.TimerManager.clearByCategory('clickModeRecovery');
            this.Debug.log('assist', '[A2-ClickMode] 狀態恢復監控已停止');
        },

        // 解除全局點擊事件處理器與 recovery interval
        unbindClickModeHandler() {
            document.getElementById('click-exec-overlay')?.remove();
            if (this.interceptClickModeHandler) {
                document.removeEventListener('click', this.interceptClickModeHandler, true);
            }
            if (this.clickModeHandler) {
                document.removeEventListener('click', this.clickModeHandler, true);
            }
            this._clickModeHandlerBound = false;
            this.clearClickModeRecoveryInterval();
            this.Debug.log('assist', '[A2-ClickMode] 全局點擊事件已解除');
        },

        // 處理輔助點擊模式的點擊事件
        handleClickModeClick(event) {
            const gs = this.state.gameState;

            // 白名單：標題列按鈕不攔截（返回設定、獎勵）
            const target = event.target;
            if (target.closest('.back-to-menu-btn') || target.closest('.reward-btn')) {
                this.Debug.log('assist', '[A2-ClickMode] 點擊標題列按鈕，放行');
                return;
            }

            // 程式觸發的點擊直接放行（autoSelectMoney / autoCloseTaskPopup 等使用 element.click()，isTrusted=false）
            if (!event.isTrusted) return;

            // 🆕【修復 37】viewTicket 階段：任何點擊都觸發完成動作
            // 原因：輔助點擊模式為手部操控不便的學生設計，無需精準點擊完成按鈕
            if (gs.clickModeState?.currentPhase === 'viewTicket') {
                // 無論是否有效，都阻止事件傳遞（防止完成按鈕 onclick 被二次觸發）
                event.stopPropagation();
                event.preventDefault();
                // 檢查是否已啟用且在等待點擊狀態
                if (gs.clickModeState.enabled && gs.clickModeState.waitingForClick) {
                    // 防抖：避免重複點擊
                    const now = Date.now();
                    if (now - gs.clickModeState.lastClickTime < 500) {
                        this.Debug.log('assist', '[A2-ClickMode] viewTicket 點擊過快，忽略');
                        return;
                    }
                    gs.clickModeState.lastClickTime = now;

                    this.Debug.log('assist', '[A2-ClickMode] viewTicket 階段，偵測到用戶點擊，觸發完成動作');
                    this.audio.playSound('click');

                    // 調用完成交易，進入下一輪
                    this.completeTransaction();
                }
                return;
            }

            // 如果有啟用輔助點擊模式設定，先阻止所有原始事件（即使尚未啟用也要阻止）
            if (this.state.settings.clickMode && gs.clickModeState) {
                event.preventDefault();
                event.stopPropagation();
            }

            // 檢查是否啟用輔助點擊模式
            if (!gs.clickModeState || !gs.clickModeState.enabled) {
                return;
            }

            // 防止誤觸（500ms 冷卻時間）
            const now = Date.now();
            if (now - gs.clickModeState.lastClickTime < 500) {
                this.Debug.log('assist', '[A2-ClickMode] 點擊過快，忽略');
                return;
            }
            gs.clickModeState.lastClickTime = now;
            // 🆕【優化】更新最後活動時間（用於狀態恢復機制）
            gs.clickModeState.lastUpdateTime = now;

            this.Debug.log('assist', '[A2-ClickMode] 點擊事件觸發，當前階段:', gs.clickModeState.currentPhase, '等待開始:', gs.clickModeState.waitingForStart, '等待點擊:', gs.clickModeState.waitingForClick);

            // 隱藏提示
            this.hideStartPrompt();
            this.audio.playSound('click');

            // 根據狀態處理點擊
            if (gs.clickModeState.waitingForStart) {
                // 等待開始狀態：根據階段執行相應操作
                gs.clickModeState.waitingForStart = false;

                if (gs.clickModeState.currentPhase === 'welcome') {
                    // 歡迎畫面導航
                    this.handleWelcomeNavigation();
                } else {
                    // 🆕【修復】其他階段：如果隊列未建立，則建立；然後執行
                    // 避免重複建立操作隊列（例如 handleWelcomeNavigation 已建立過）
                    if (!gs.clickModeState.actionQueue || gs.clickModeState.actionQueue.length === 0) {
                        this.buildActionQueue(gs.clickModeState.currentPhase);
                    }
                    this.executeNextAction();
                }
            } else if (gs.clickModeState.waitingForClick) {
                // 等待點擊繼續：執行下一個操作
                gs.clickModeState.waitingForClick = false;

                // 🆕【修復 43】printTicket 階段：移除右邊面板的提示動畫
                if (gs.clickModeState.currentPhase === 'printTicket') {
                    const ticketDispenser = document.querySelector('.ticket-dispenser-area');
                    if (ticketDispenser && ticketDispenser.classList.contains('easy-mode-hint')) {
                        ticketDispenser.classList.remove('easy-mode-hint');
                        this.Debug.log('assist', '[A2-ClickMode] 已移除票券區域的提示動畫');
                    }
                }

                this.executeNextAction();
            }
        },

        // 處理歡迎畫面導航
        handleWelcomeNavigation() {
            const gs = this.state.gameState;
            const welcomePageIndex = gs.clickModeState.welcomePageIndex;

            this.Debug.log('assist', '[A2-ClickMode] 歡迎畫面導航，當前頁:', welcomePageIndex);

            if (welcomePageIndex === 1) {
                // 第 1 頁 → 第 2 頁（錢包介紹）
                gs.clickModeState.welcomePageIndex = 2;
                this.nextWelcomePage();

                // 延遲允許點擊
                this.TimerManager.setTimeout(() => {
                    gs.clickModeState.waitingForStart = true;
                    this.showStartPrompt();
                }, 1500, 'clickMode');
            } else if (welcomePageIndex === 2) {
                // 第 2 頁 → 進入下一階段（coinFirst: coinFirstInsert；原流程: selectService）
                gs.clickModeState.welcomePageIndex = 1; // 重置

                const firstPhase = this.isCoinFirstMode() ? 'coinFirstInsert' : 'selectService';
                gs.clickModeState.currentPhase = firstPhase;

                // 🆕【優化 15】顯示進度指示器
                this.showPhaseIndicator(firstPhase);

                // 關閉歡迎畫面，進入遊戲
                if (this.state.settings.difficulty === 'easy') {
                    this.startEasyModeGame();
                } else {
                    this.startAssignedModeGame();
                }

                // 🆕【修復】立即建立操作隊列，避免競態條件
                // 延遲僅用於顯示開始提示，不延遲隊列建立
                this.buildActionQueue(firstPhase);

                this.TimerManager.setTimeout(() => {
                    gs.clickModeState.waitingForStart = true;
                    this.showStartPrompt();
                }, 1500, 'clickMode'); // 等待任務彈窗顯示和提示完成
            }
        },

        // 顯示「點擊任何一處繼續」提示
        showStartPrompt(isInitial = false) {
            const gs = this.state.gameState;
            if (!gs.clickModeState || !gs.clickModeState.enabled) return;

            // 如果不是初始提示，且已顯示過初始提示，則不再顯示
            if (!isInitial && gs.clickModeState.initialPromptShown) {
                this.Debug.log('assist', '[A2-ClickMode] 已顯示過初始提示，跳過後續提示');
                return;
            }

            // 如果是初始提示，標記為已顯示
            if (isInitial) {
                gs.clickModeState.initialPromptShown = true;
            }

            // 移除舊的提示（如果存在）
            this.hideStartPrompt();

            const prompt = document.createElement('div');
            prompt.id = 'click-mode-start-prompt';
            prompt.textContent = '點擊任何一處繼續';
            prompt.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(76, 175, 80, 0.95);
                color: white;
                padding: 20px 40px;
                border-radius: 12px;
                font-size: 32px;
                font-weight: bold;
                z-index: 10000;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                animation: clickModePulse 1.5s ease-in-out infinite;
                pointer-events: none;
            `;
            // 🔧 [Phase 2] @keyframes clickModePulse 已移至 injectGlobalAnimationStyles()

            document.body.appendChild(prompt);
            this.Debug.log('assist', '[A2-ClickMode] 顯示開始提示 (初始:', isInitial, ')');

            // 3秒後自動隱藏（可選）
            this.TimerManager.setTimeout(() => {
                this.hideStartPrompt();
            }, 3000, 'uiAnimation');
        },

        // 隱藏提示
        hideStartPrompt() {
            const prompt = document.getElementById('click-mode-start-prompt');
            if (prompt) {
                prompt.remove();
                this.Debug.log('assist', '[A2-ClickMode] 隱藏開始提示');
            }
        },

        // =====================================================
        // 輔助點擊模式 - Phase 3: 操作自動化
        // =====================================================

        // 建立操作隊列
        buildActionQueue(phase) {
            const gs = this.state.gameState;
            this.Debug.log('assist', '[A2-ClickMode] 建立操作隊列，階段:', phase);

            gs.clickModeState.actionQueue = [];
            gs.clickModeState.currentStep = 0;

            if (phase === 'coinFirstInsert') {
                // coinFirst 投幣階段：關閉任務彈窗 + 投入精確金額
                const assignedService = this.state.settings.difficulty === 'easy'
                    ? gs.easyMode.assignedService
                    : gs.normalMode.assignedService;

                // 先關閉任務彈窗（如果有的話）
                const actions = [];
                const taskPopup = document.getElementById('task-popup-overlay');
                if (taskPopup) actions.push({ type: 'closeTaskPopup' });

                // 計算精確付款序列（coinFirst 與原付款相同，只是在選服務之前）
                const paymentSequence = this.calculatePaymentSequence();
                actions.push(...paymentSequence);

                gs.clickModeState.actionQueue = actions;
            } else if (phase === 'coinFirstSelect') {
                // coinFirst 選服務階段：輪詢等待服務亮起後自動點擊
                const assignedService = this.state.settings.difficulty === 'easy'
                    ? gs.easyMode.assignedService
                    : gs.normalMode.assignedService;
                gs.clickModeState.actionQueue = [
                    { type: 'selectCoinFirstService', serviceId: assignedService?.id }
                ];
            } else if (phase === 'selectService') {
                // 選擇服務階段：關閉任務彈窗 + 選擇指定服務
                const assignedService = this.state.settings.difficulty === 'easy'
                    ? gs.easyMode.assignedService
                    : gs.normalMode.assignedService;

                gs.clickModeState.actionQueue = [
                    { type: 'closeTaskPopup' },
                    { type: 'selectService', serviceId: assignedService.id }
                ];
            } else if (phase === 'payment') {
                // 付款階段：計算並投入金額
                const paymentSequence = this.calculatePaymentSequence();
                gs.clickModeState.actionQueue = paymentSequence;
            } else if (phase === 'printTicket') {
                // 🆕【修復 43】等待票券列印階段：列印完成後直接顯示票據彈窗
                // 移除 clickViewTicket，改用 showModal 直接顯示彈窗，避免 2.5秒煙火延遲
                gs.clickModeState.actionQueue = [
                    { type: 'waitPrintComplete' },
                    { type: 'showModal' }
                ];
            } else if (phase === 'viewTicket') {
                // 查看票券階段
                gs.clickModeState.actionQueue = [
                    { type: 'closeTicketModal' }
                ];
            }

            this.Debug.log('assist', '[A2-ClickMode] 操作隊列已建立:', gs.clickModeState.actionQueue);

            // 🆕 【修復】簡單模式：啟動視覺延遲機制（參考 A3 正確實施）
            if (this.state.settings.difficulty === 'easy') {
                this.enableClickModeWithVisualDelay(`BuildQueue-${phase}`);
            }
        },

        // 執行下一個操作
        executeNextAction() {
            const gs = this.state.gameState;
            const queue = gs.clickModeState.actionQueue;
            const step = gs.clickModeState.currentStep;

            // 🆕【優化】更新最後活動時間（用於狀態恢復機制）
            gs.clickModeState.lastUpdateTime = Date.now();

            this.Debug.log('assist', '[A2-ClickMode] 執行操作，步驟:', step, '隊列長度:', queue.length);

            // 檢查是否完成當前階段
            if (step >= queue.length) {
                this.Debug.log('assist', '[A2-ClickMode] 當前階段操作完成，轉換階段');
                this.transitionToNextPhase();
                return;
            }

            const action = queue[step];

            // 🆕【修復 25】安全檢查：如果付款已完成，跳過剩餘金額選擇
            if (action.type === 'selectMoney' && this.state.gameState.paymentComplete) {
                this.Debug.log('assist', '[A2-ClickMode] 付款已完成，跳過剩餘金額選擇操作');
                this.transitionToNextPhase();
                return;
            }

            this.Debug.log('assist', '[A2-ClickMode] 執行操作:', action);

            // 🆕【修復 36】設置執行中標誌，防止付款過程中自動關閉彈窗
            gs.clickModeState.isExecuting = true;

            // 🆕【修復 42】特殊處理：如果是 closeTaskPopup，檢查彈窗是否存在
            if (action.type === 'closeTaskPopup') {
                const taskPopup = document.getElementById('task-popup-overlay');
                if (!taskPopup) {
                    this.Debug.log('assist', '[A2-ClickMode] 任務彈窗不存在（已被用戶關閉），跳過關閉步驟');
                    // 彈窗已被用戶點擊關閉，這次點擊已經被消費
                    // 跳過步驟 0，但等待下一次點擊再執行步驟 1
                    gs.clickModeState.currentStep++;
                    gs.clickModeState.waitingForClick = true; // 等待下一次點擊
                    this.Debug.log('assist', '[A2-ClickMode] 等待下一次點擊以執行步驟', gs.clickModeState.currentStep);
                    return;
                }
            }

            // 根據操作類型執行相應函數
            switch (action.type) {
                case 'closeTaskPopup':
                    this.autoCloseTaskPopup();
                    break;
                case 'selectService':
                    this.autoSelectService(action.serviceId);
                    break;
                case 'showMoneyModal':
                    this.autoShowMoneyModal(action.slotType);
                    break;
                case 'selectMoney':
                    this.autoSelectMoney(action.amount, action.slotType);
                    break;
                case 'waitPrintComplete':
                    this.autoWaitPrintComplete();
                    return; // 不增加步驟，等待完成後再繼續
                case 'showModal':
                    // 🆕【修復 43】直接顯示票據彈窗，無需程序化點擊按鈕
                    this.autoShowTicketModal();
                    return; // 不增加步驟，等待彈窗完全顯示後再繼續
                case 'clickViewTicket':
                    this.autoClickViewTicket();
                    return; // 🆕【修復】不增加步驟，等待點擊完成後再繼續
                case 'closeTicketModal':
                    this.autoCloseTicketModal();
                    return; // 🆕【修復】不增加步驟，等待彈窗完全顯示後再關閉
                case 'selectCoinFirstService':
                    this.autoSelectCoinFirstService(action.serviceId);
                    return; // 非同步輪詢，等待完成
            }

            // 增加步驟索引
            gs.clickModeState.currentStep++;

            // 設置等待用戶點擊
            gs.clickModeState.waitingForClick = true;

            // 延遲顯示提示
            this.TimerManager.setTimeout(() => {
                if (gs.clickModeState.waitingForClick) {
                    this.showStartPrompt();
                }
            }, 800, 'clickMode');
        },

        // 階段轉換
        transitionToNextPhase() {
            const gs = this.state.gameState;
            const currentPhase = gs.clickModeState.currentPhase;

            this.Debug.log('assist', '[A2-ClickMode] 階段轉換，當前階段:', currentPhase);

            // 🆕【修復 36】階段轉換時清除執行中標誌
            gs.clickModeState.isExecuting = false;

            // 🆕【修復】welcome 階段處理
            if (currentPhase === 'welcome') {
                // welcome 階段轉換：由 handleWelcomeNavigation() 處理
                // 這裡作為安全網，處理狀態恢復機制導致的異常情況
                this.Debug.log('assist', '[A2-ClickMode] welcome 階段異常轉換，重新導向到正確流程');
                gs.clickModeState.waitingForStart = true;
                this.showStartPrompt();
                return;
            }

            if (currentPhase === 'coinFirstInsert') {
                // coinFirst 投幣完成 → 等待服務亮起（動畫 650ms），再進入選服務階段
                gs.clickModeState.currentPhase = 'coinFirstSelect';
                this.showPhaseIndicator('coinFirstSelect');
                // 延遲 800ms 讓亮燈動畫完成後再建立隊列
                this.TimerManager.setTimeout(() => {
                    this.buildActionQueue('coinFirstSelect');
                    gs.clickModeState.waitingForStart = true;
                    this.showStartPrompt();
                }, 800, 'clickMode');
            } else if (currentPhase === 'coinFirstSelect') {
                // coinFirst 選服務完成 → 進入列印票券階段
                gs.clickModeState.currentPhase = 'printTicket';
                this.showPhaseIndicator('printTicket');
                requestAnimationFrame(() => {
                    this.TimerManager.setTimeout(() => {
                        this.buildActionQueue('printTicket');
                        gs.clickModeState.waitingForStart = true;
                        this.showStartPrompt();
                    }, 100, 'clickMode');
                });
            } else if (currentPhase === 'selectService') {
                // 選擇服務完成 → 進入付款階段
                gs.clickModeState.currentPhase = 'payment';
                // 🆕【優化 15】更新進度指示器
                this.showPhaseIndicator('payment');
                // 🆕【修復】延遲建立操作隊列，確保 DOM 已更新（付款提示已渲染）
                // 使用 requestAnimationFrame 等待下一幀，確保 render() 完成
                requestAnimationFrame(() => {
                    this.TimerManager.setTimeout(() => {
                        this.buildActionQueue('payment');
                        gs.clickModeState.waitingForStart = true;
                        this.showStartPrompt();
                    }, 100, 'clickMode'); // 額外 100ms 緩衝確保 DOM 完全更新
                });
            } else if (currentPhase === 'payment') {
                // 付款完成 → 進入列印票券階段
                gs.clickModeState.currentPhase = 'printTicket';
                // 🆕【優化 15】更新進度指示器
                this.showPhaseIndicator('printTicket');
                // 🆕【修復】延遲建立操作隊列，確保票券列印動畫已啟動
                requestAnimationFrame(() => {
                    this.TimerManager.setTimeout(() => {
                        this.buildActionQueue('printTicket');
                        gs.clickModeState.waitingForStart = true;
                        this.showStartPrompt();
                    }, 100, 'clickMode');
                });
            } else if (currentPhase === 'printTicket') {
                // 列印完成 → 進入查看票券階段（等待用戶點擊）
                this.Debug.log('assist', '[A2-ClickMode] 票券已列印，等待用戶點擊查看票券');
                gs.clickModeState.currentPhase = 'viewTicket';
                // 🆕【優化 15】更新進度指示器
                this.showPhaseIndicator('viewTicket');
                // 🆕【修復 21】不自動點擊，等待用戶手動點擊查看票券按鈕
                // 輔助點擊模式繼續運行，但不建立自動操作隊列
                gs.clickModeState.waitingForStart = false;
                gs.clickModeState.waitingForClick = true;
                // 當用戶點擊查看票券按鈕時，會觸發 showTicketModal，然後結束流程
            } else if (currentPhase === 'viewTicket') {
                // 查看票券完成 → 等待用戶點擊完成按鈕
                this.Debug.log('assist', '[A2-ClickMode] 票據彈窗已顯示，等待用戶點擊完成按鈕');
                // 🆕【修復 26】不在這裡禁用輔助模式，保持啟用狀態
                // 等待用戶點擊完成按鈕，由 completeTransaction() 處理模式結束和進入下一輪
                // gs.clickModeState.enabled 保持為 true
                // ⚠️ 不設置 waitingForClick = true，避免響應任意點擊造成無限循環
                // waitingForClick 保持為 false，只有點擊完成按鈕才會觸發 completeTransaction()
                // 進度指示器保持顯示，直到 completeTransaction() 被調用
            }
        },

        // =====================================================
        // 輔助點擊模式 - 自動化操作函數
        // =====================================================

        // 自動關閉任務彈窗
        autoCloseTaskPopup() {
            this.Debug.log('assist', '[A2-ClickMode] 自動關閉任務彈窗');
            this.audio.playSound('click');

            this.TimerManager.setTimeout(() => {
                const closeBtn = document.querySelector('#task-popup-overlay .start-task-btn');
                if (closeBtn) {
                    closeBtn.click();
                    this.Debug.log('assist', '[A2-ClickMode] 已點擊關閉按鈕');
                } else {
                    // 如果彈窗已經不存在，直接繼續
                    this.Debug.log('assist', '[A2-ClickMode] 任務彈窗已關閉或不存在');
                }
            }, 300, 'clickMode');
        },

        // 自動選擇服務
        autoSelectService(serviceId) {
            this.Debug.log('assist', '[A2-ClickMode] 自動選擇服務:', serviceId);
            this.audio.playSound('click');

            this.TimerManager.setTimeout(() => {
                const serviceButton = document.querySelector(`.service-item[data-service-id="${serviceId}"]`);
                if (serviceButton) {
                    this.Debug.log('assist', '[A2-ClickMode] 找到服務項目，準備點擊:', serviceId);
                    serviceButton.click();
                    this.Debug.log('assist', '[A2-ClickMode] 已點擊服務:', serviceId);
                } else {
                    this.Debug.error('[A2-ClickMode] 找不到服務項目:', serviceId);
                    // 列出所有可用的服務項目以便除錯
                    const allServices = document.querySelectorAll('.service-item');
                    this.Debug.log('assist', '[A2-ClickMode] 可用服務數量:', allServices.length);
                    allServices.forEach(s => {
                        this.Debug.log('assist', '[A2-ClickMode] 服務ID:', s.dataset.serviceId);
                    });
                }
            }, 800, 'clickMode'); // 增加延遲，確保任務彈窗已完全關閉且 DOM 已更新
        },

        // 自動打開金額選擇模態
        autoShowMoneyModal(slotType) {
            this.Debug.log('assist', '[A2-ClickMode] 自動打開金額選擇模態:', slotType);
            this.audio.playSound('click');

            // 檢查是否有現有彈窗需要關閉
            const existingModal = document.getElementById('money-selection-modal');
            if (existingModal) {
                this.Debug.log('assist', '[A2-ClickMode] 偵測到現有彈窗，先關閉');
                this.closeMoneySelection();
                // 等待彈窗關閉動畫完成後再開啟新彈窗
                this.TimerManager.setTimeout(() => {
                    this.showMoneySelection(slotType);
                    this.Debug.log('assist', '[A2-ClickMode] 已調用 showMoneySelection:', slotType);
                }, 1000, 'clickMode'); // 增加等待時間，確保彈窗完全關閉
            } else {
                // 沒有現有彈窗，直接開啟
                this.TimerManager.setTimeout(() => {
                    this.showMoneySelection(slotType);
                    this.Debug.log('assist', '[A2-ClickMode] 已調用 showMoneySelection:', slotType);
                }, 500, 'clickMode');
            }
        },

        // 自動選擇金額
        autoSelectMoney(amount, slotType) {
            this.Debug.log('assist', '[A2-ClickMode] 自動選擇金額:', amount, slotType);
            this.audio.playSound('click');

            // 使用輪詢機制等待金額選項出現
            let attempts = 0;
            const maxAttempts = 10; // 最多嘗試 10 次（5 秒）

            const checkAndSelect = () => {
                // 找到所有對應面額且未被使用的金額選項
                const moneyButtons = document.querySelectorAll(
                    `.individual-money-item[data-value="${amount}"]:not(.money-inserted)`
                );

                if (moneyButtons && moneyButtons.length > 0) {
                    // 點擊第一個未被使用的
                    const firstButton = moneyButtons[0];
                    const buttonId = firstButton.id;

                    // 解析 ID 獲取 index (格式: money-{type}-{value}-{index})
                    const match = buttonId.match(/money-(\w+)-(\d+)-(\d+)/);
                    if (match) {
                        const index = parseInt(match[3]);
                        this.Debug.log('assist', '[A2-ClickMode] 點擊金額按鈕:', amount, 'index:', index);

                        // 直接調用 selectMoney 函數
                        this.selectMoney(amount, slotType, index);
                        this.Debug.log('assist', '[A2-ClickMode] 已選擇金額，等待 A2 原有邏輯處理彈窗關閉');
                    }
                    return;
                }
                if (++attempts >= maxAttempts) {
                    this.Debug.error('[A2-ClickMode] 等待金額選項超時:', amount);
                    return;
                }
                BarberKiosk.TimerManager.setTimeout(checkAndSelect, 500, 'autoAction');
            };
            BarberKiosk.TimerManager.setTimeout(checkAndSelect, 500, 'autoAction');
        },

        // 等待票券列印完成
        autoWaitPrintComplete() {
            this.Debug.log('assist', '[A2-ClickMode] 等待票券列印完成');

            const gs = this.state.gameState;

            // 🆕【修復】如果已經在等待，不要創建新的輪詢
            if (gs.clickModeState._printCheckActive) {
                this.Debug.log('assist', '[A2-ClickMode] 已有等待中的檢查，跳過');
                return;
            }

            // 🆕【修復 43】立即檢查一次，避免不必要的延遲
            const viewButton = document.querySelector('.take-ticket-btn');
            if (gs.ticketPrinted && viewButton) {
                this.Debug.log('assist', '[A2-ClickMode] 票券列印完成且按鈕已出現');
                gs.clickModeState.currentStep++;
                // 🔧【修復】純程式步驟：自動執行下一步，無需用戶點擊
                this.Debug.log('assist', '[A2-ClickMode] 自動執行步驟', gs.clickModeState.currentStep);
                this.TimerManager.setTimeout(() => {
                    this.executeNextAction();
                }, 300, 'clickMode');
                return;
            }

            const pollPrintComplete = () => {
                // 同時檢查票券已列印 AND 查看票券按鈕已出現
                const viewButton = document.querySelector('.take-ticket-btn');
                if (gs.ticketPrinted && viewButton) {
                    gs.clickModeState._printCheckActive = false;
                    this.Debug.log('assist', '[A2-ClickMode] 票券列印完成且按鈕已出現');
                    gs.clickModeState.currentStep++;
                    // 🔧【修復】純程式步驟：自動執行下一步，無需用戶點擊
                    this.Debug.log('assist', '[A2-ClickMode] 自動執行步驟', gs.clickModeState.currentStep);
                    this.TimerManager.setTimeout(() => {
                        this.executeNextAction();
                    }, 300, 'clickMode');
                    return;
                }
                BarberKiosk.TimerManager.setTimeout(pollPrintComplete, 100, 'autoAction');
            };
            gs.clickModeState._printCheckActive = true;
            BarberKiosk.TimerManager.setTimeout(pollPrintComplete, 100, 'autoAction');
        },

        // 🆕【修復 43】自動顯示票據彈窗（無需程序化點擊，避免煙火延遲）
        autoShowTicketModal() {
            this.Debug.log('assist', '[A2-ClickMode] 自動顯示票據彈窗');
            this.audio.playSound('click');

            const gs = this.state.gameState;

            // 🆕【修復 43-完善】直接調用 _showTicketModalContent，完全跳過煙火動畫
            this.Debug.log('assist', '[A2-ClickMode] 直接顯示票據彈窗內容，跳過煙火動畫和延遲');
            this._showTicketModalContent();

            // 顯示彈窗後，遞增步驟並執行下一個操作（轉換到 viewTicket 階段）
            gs.clickModeState.currentStep++;
            this.executeNextAction();
        },

        // 自動點擊查看票券
        autoClickViewTicket() {
            this.Debug.log('assist', '[A2-ClickMode] 自動點擊查看票券');
            this.audio.playSound('click');

            const gs = this.state.gameState;

            // 🆕【修復 18】防止重複執行：檢查是否已在處理中
            if (gs.clickModeState._viewTicketProcessing) {
                this.Debug.log('assist', '[A2-ClickMode] 已在處理查看票券，跳過');
                return;
            }

            // 🆕【修復 16-2】等待動畫完成再點擊
            // 票券動畫需要 0.8 秒，onclick 處理器在動畫結束後才綁定
            const viewButton = document.querySelector('.take-ticket-btn');
            if (viewButton) {
                this.Debug.log('assist', '[A2-ClickMode] 找到查看票券按鈕，等待動畫完成...');

                // 🆕【修復 18】立即標記為處理中，防止重複執行
                gs.clickModeState._viewTicketProcessing = true;

                this.TimerManager.setTimeout(() => {
                    // 重新查詢按鈕，確保 onclick 已綁定
                    const button = document.querySelector('.take-ticket-btn');
                    if (button && button.onclick) {
                        this.Debug.log('assist', '[A2-ClickMode] onclick 處理器已綁定，點擊按鈕');
                        button.click();
                    } else {
                        this.Debug.warn('assist', '[A2-ClickMode] onclick 處理器未綁定，直接調用 showTicketModal');
                        this.showTicketModal();
                    }
                    this.Debug.log('assist', '[A2-ClickMode] 已點擊查看票券按鈕，繼續下一步');
                    // 🆕【修復】點擊完成後才遞增步驟並執行下一個操作
                    gs.clickModeState.currentStep++;
                    gs.clickModeState._viewTicketProcessing = false; // 🆕【修復 18】清除標記
                    this.executeNextAction();
                }, 1000, 'clickMode'); // 從 500ms 改為 1000ms，確保動畫完成
                return;
            }

            // 🆕【修復】如果按鈕不存在，使用輪詢機制
            // 🆕【修復 18】標記為處理中
            gs.clickModeState._viewTicketProcessing = true;

            let attempts = 0;
            const maxAttempts = 20; // 最多嘗試 20 次（10 秒）

            const checkButton = () => {
                const viewButton = document.querySelector('.take-ticket-btn');

                if (viewButton) {
                    this.Debug.log('assist', '[A2-ClickMode] 找到查看票券按鈕，等待動畫完成...');
                    this.TimerManager.setTimeout(() => {
                        // 🆕【修復 16-2】重新查詢並檢查 onclick 處理器
                        const button = document.querySelector('.take-ticket-btn');
                        if (button && button.onclick) {
                            this.Debug.log('assist', '[A2-ClickMode] onclick 處理器已綁定，點擊按鈕');
                            button.click();
                        } else {
                            this.Debug.warn('assist', '[A2-ClickMode] onclick 處理器未綁定，直接調用 showTicketModal');
                            this.showTicketModal();
                        }
                        this.Debug.log('assist', '[A2-ClickMode] 已點擊查看票券按鈕，繼續下一步');
                        // 🆕【修復】點擊完成後才遞增步驟並執行下一個操作
                        gs.clickModeState.currentStep++;
                        gs.clickModeState._viewTicketProcessing = false; // 🆕【修復 18】清除標記
                        this.executeNextAction();
                    }, 1000, 'clickMode'); // 從 500ms 改為 1000ms
                    return;
                }
                if (++attempts >= maxAttempts) {
                    this.Debug.error('[A2-ClickMode] 等待查看票券按鈕超時');
                    gs.clickModeState._viewTicketProcessing = false; // 🆕【修復 18】清除標記
                    return;
                }
                BarberKiosk.TimerManager.setTimeout(checkButton, 500, 'autoAction');
            };
            BarberKiosk.TimerManager.setTimeout(checkButton, 500, 'autoAction');
        },

        // 自動關閉票券彈窗
        autoCloseTicketModal() {
            this.Debug.log('assist', '[A2-ClickMode] 自動關閉票券彈窗');
            this.audio.playSound('click');

            const gs = this.state.gameState;

            // 🆕【修復】等待票券彈窗完全顯示後再關閉
            // 原因：showTicketModal 中如果有煙火動畫，會延遲 2.5 秒才顯示彈窗內容
            // 快速點擊時，關閉動作可能在彈窗顯示前就執行了
            let attempts = 0;
            const maxAttempts = 60; // 最多等待 6 秒（2.5秒煙火 + 緩衝）

            const waitForModal = () => {
                const modal = document.querySelector('.ticket-modal-content');
                attempts++;

                if (modal) {
                    // 彈窗已完全顯示，等待一小段時間讓使用者看到票券
                    this.Debug.log('assist', '[A2-ClickMode] 票券彈窗已顯示，準備關閉');
                    this.TimerManager.setTimeout(() => {
                        this.completeTransaction();
                        this.Debug.log('assist', '[A2-ClickMode] 已關閉票券彈窗，繼續下一步');
                        // 🆕【修復】關閉完成後才遞增步驟並執行下一個操作
                        gs.clickModeState.currentStep++;
                        this.executeNextAction();
                    }, 1000, 'clickMode'); // 顯示 1 秒讓使用者看到票券
                } else if (attempts >= maxAttempts) {
                    this.Debug.error('[A2-ClickMode] 等待票券彈窗超時，強制關閉');
                    this.completeTransaction();
                    gs.clickModeState.currentStep++;
                    this.executeNextAction();
                } else {
                    // 彈窗還未顯示，繼續等待
                    this.TimerManager.setTimeout(waitForModal, 100, 'clickMode');
                }
            };

            waitForModal();
        },

        /**
         * coinFirst 自動選服務：輪詢等待服務出現 coin-first-available 後點擊
         */
        autoSelectCoinFirstService(serviceId) {
            const gs = this.state.gameState;
            let attempts = 0;
            const maxAttempts = 20; // 最多等 2 秒

            const trySelect = () => {
                attempts++;
                const selector = serviceId
                    ? `.service-item.coin-first-available[data-service-id="${serviceId}"]`
                    : '.service-item.coin-first-available';
                const el = document.querySelector(selector);

                if (el) {
                    this.Debug.log('assist', '[A2-ClickMode] coinFirst 服務已亮起，自動點擊:', serviceId);
                    el.click();
                    gs.clickModeState.currentStep++;
                    gs.clickModeState.waitingForClick = true;
                    this.TimerManager.setTimeout(() => {
                        if (gs.clickModeState.waitingForClick) this.showStartPrompt();
                    }, 800, 'clickMode');
                } else if (attempts < maxAttempts) {
                    this.TimerManager.setTimeout(trySelect, 100, 'serviceUnlock');
                } else {
                    this.Debug.error('[A2-ClickMode] coinFirst 服務等待超時，強制繼續');
                    gs.clickModeState.currentStep++;
                    this.executeNextAction();
                }
            };

            this.TimerManager.setTimeout(trySelect, 100, 'serviceUnlock');
        },

        // 計算付款序列
        calculatePaymentSequence() {
            const required = this.state.gameState.easyMode.assignedService.price;
            const walletCoins = this.state.gameState.easyMode.walletCoins;
            const sequence = [];

            this.Debug.log('assist', '[A2-ClickMode] 計算付款序列，需要金額:', required, '錢包:', walletCoins);

            // 合併紙鈔和硬幣並排序（大到小）
            const allMoney = [...walletCoins.bills, ...walletCoins.coins]
                .sort((a, b) => b - a);

            let remaining = required;
            let lastSlotType = null;

            for (const value of allMoney) {
                if (value <= remaining) {
                    const slotType = value >= 100 ? 'bill' : 'coin';

                    // 只在切換 slot type 時才添加打開模態的操作
                    if (slotType !== lastSlotType) {
                        sequence.push({ type: 'showMoneyModal', slotType });
                        lastSlotType = slotType;
                    }

                    // 添加選擇金額的操作
                    sequence.push({ type: 'selectMoney', amount: value, slotType });
                    remaining -= value;
                }
                if (remaining === 0) break;
            }

            this.Debug.log('assist', '[A2-ClickMode] 付款序列:', sequence);
            return sequence;
        }
    };

    // =====================================================
    // 將 BarberKiosk 對象暴露到全域作用域
    // =====================================================
    window.BarberKiosk = BarberKiosk;

    // 立即初始化系統
    BarberKiosk.init();
    BarberKiosk.Debug.log('init', ' 理髮店售票機腳本載入完成');
});