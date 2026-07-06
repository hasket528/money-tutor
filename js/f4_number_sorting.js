/**
 * @file f4_number_sorting.js
 * @description F4 數字排序 - 配置驅動版本
 * @unit F4 - 數字排序
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

// =====================================================
// 🎯 配置驅動系統
// =====================================================

/**
 * 遊戲配置中心 - 所有設定都通過配置驅動
 */
const NumberSortingConfig = {
    // =====================================================
    // 🎯 遊戲基本配置
    // =====================================================
    game: {
        title: "單元F4：數字排序",
        subtitle: "理解數字的大小順序關係，學習將數字由小到大排序",
        version: "2.0.0",
        author: "配置驅動版本"
    },

    // =====================================================
    // 🎨 難度配置
    // =====================================================
    difficulties: {
        easy: {
            id: 'easy',
            label: '簡單',
            description: '顯示數字提示，正確答案會自動鎖定',
            showHints: true,
            autoLock: true,
            instantFeedback: true,
            speechFeedback: true,
            shuffleNumbers: true, // 【新增】簡單模式也要打亂數字
            colors: {
                primary: '#28a745',
                secondary: '#20c997',
                slot: '#28a745',
                slotBackground: 'rgba(40, 167, 69, 0.1)'
            },
            timing: {
                feedbackDelay: 100,
                nextQuestionDelay: 1000,
                speechDelay: 300
            },
            scoring: {
                correctAnswer: 10,
                perfectLevel: 50
            },
            // 語音模板配置
            speechTemplates: {
                levelComplete: '恭喜你答對了，進入下一題',
                levelCompleteLast: '恭喜你答對了，測驗結束',
                complete: '恭喜完成所有題目！'
            }
        },
        normal: {
            id: 'normal',
            label: '普通',
            description: '需要手動確認答案，提供即時回饋',
            showHints: false,
            autoLock: false,
            instantFeedback: false,
            requireConfirmation: true,
            speechFeedback: true,
            shuffleNumbers: true, // 【新增】普通模式也要打亂數字
            colors: {
                primary: '#007bff',
                secondary: '#0056b3',
                slot: '#007bff',
                slotBackground: 'rgba(0, 123, 255, 0.1)'
            },
            timing: {
                feedbackDelay: 500,
                nextQuestionDelay: 2000,
                wrongAnswerDelay: 2000,
                speechDelay: 300
            },
            scoring: {
                correctAnswer: 15,
                perfectLevel: 75
            },
            // 語音模板配置
            speechTemplates: {
                correct: '恭喜你答對了，進入下一題',
                correctLast: '恭喜你答對了，測驗結束', // 最後一題正確語音
                incorrect: '對不起，有錯誤喔，請再試一次。',
                incorrectSingle: '對不起你答錯了，進入下一題', // 單次作答錯誤語音
                incorrectSingleLast: '對不起你答錯了，測驗結束', // 🆕 最後一題錯誤語音
                complete: '恭喜完成所有題目！'
            }
        },
        hard: {
            id: 'hard',
            label: '困難',
            description: '無拖拽提示，需點擊輸入數字排序',
            showHints: false,
            autoLock: false,
            instantFeedback: false,
            requireConfirmation: true,
            inputMode: true,
            speechFeedback: true,
            colors: {
                primary: '#dc3545',
                secondary: '#c82333',
                slot: '#dc3545',
                slotBackground: 'rgba(220, 53, 69, 0.1)'
            },
            timing: {
                feedbackDelay: 1000,
                nextQuestionDelay: 3000,
                wrongAnswerDelay: 3000,
                speechDelay: 300
            },
            scoring: {
                correctAnswer: 20,
                perfectLevel: 100
            },
            // 語音模板配置
            speechTemplates: {
                instruction: '{instruction}', // 動態指令內容
                correct: '恭喜你答對了，進入下一題',
                correctLast: '恭喜你答對了，測驗結束', // 最後一題正確語音
                incorrect: '對不起，有錯誤喔，請再試一次。',
                incorrectSingle: '對不起你答錯了，進入下一題', // 單次作答錯誤語音
                incorrectSingleLast: '對不起你答錯了，測驗結束', // 🆕 最後一題錯誤語音
                complete: '恭喜完成所有題目！'
            }
        }
    },

    // =====================================================
    // 📊 數字範圍配置
    // =====================================================
    numberRanges: {
        '1-10': {
            id: '1-10',
            label: '1-10',
            description: '基礎數字認知',
            startNumber: 1,
            endNumber: 10,
            levels: 1,
            numbersPerLevel: 10
        },
        '1-20': {
            id: '1-20',
            label: '1-20',
            description: '進階數字順序',
            startNumber: 1,
            endNumber: 20,
            levels: 2,
            numbersPerLevel: 10
        },
        '1-50': {
            id: '1-50',
            label: '1-50',
            description: '中等範圍挑戰',
            startNumber: 1,
            endNumber: 50,
            levels: 5,
            numbersPerLevel: 10
        },
        '1-100': {
            id: '1-100',
            label: '1-100',
            description: '完整百數表',
            startNumber: 1,
            endNumber: 100,
            levels: 10,
            numbersPerLevel: 10
        },
        custom: {
            id: 'custom',
            label: '自訂範圍',
            description: '自由設定數字範圍',
            customizable: true,
            defaultConfig: {
                startNumber: 1,
                endNumber: 20,
                numbersPerLevel: 10
            }
        }
    },

    // =====================================================
    // 📋 排序數量配置
    // =====================================================
    sortingCounts: {
        preset: {
            id: 'preset',
            label: '⭐ 預設 (10個)',
            description: '預設排序10個數字（推薦）',
            value: 10,
            order: 0
        },
        3: {
            id: '3',
            label: '3個數字',
            description: '每題排序3個數字',
            value: 3,
            order: 1
        },
        5: {
            id: '5',
            label: '5個數字',
            description: '每題排序5個數字',
            value: 5,
            order: 2
        },
        10: {
            id: '10',
            label: '10個數字',
            description: '每題排序10個數字',
            value: 10,
            order: 3
        },
        15: {
            id: '15',
            label: '15個數字',
            description: '每題排序15個數字',
            value: 15,
            order: 4
        },
        20: {
            id: '20',
            label: '20個數字',
            description: '每題排序20個數字',
            value: 20,
            order: 5
        },
        custom: {
            id: 'custom',
            label: '自訂',
            description: '自由設定排序數量',
            customizable: true,
            defaultValue: 10,
            order: 6
        }
    },

    // =====================================================
    // ⏰ 時間限制配置
    // =====================================================
    timeLimits: {
        none: {
            id: 'none',
            label: '無限制',
            description: '不限制完成時間',
            value: null,
            showTimer: false,
            order: 1
        },
        300: {
            id: '300',
            label: '300秒',
            description: '寬鬆時間限制',
            value: 300,
            showTimer: true,
            warningTime: 60,
            order: 2
        },
        120: {
            id: '120',
            label: '120秒',
            description: '標準時間限制',
            value: 120,
            showTimer: true,
            warningTime: 30,
            order: 3
        },
        60: {
            id: '60',
            label: '60秒',
            description: '快速挑戰模式',
            value: 60,
            showTimer: true,
            warningTime: 10,
            order: 4
        }
    },

    // =====================================================
    // 📝 測驗模式配置
    // =====================================================
    testModes: {
        retry: {
            id: 'retry',
            label: '反複練習',
            description: '答錯時可以重新作答，適合學習模式',
            allowRetry: true,
            showCorrectAnswer: false
        },
        single: {
            id: 'single',
            label: '單次作答',
            description: '每題只能作答一次，答錯會顯示正確答案',
            allowRetry: false,
            showCorrectAnswer: true
        }
    },

    // =====================================================
    // 🔊 音效配置
    // =====================================================
    soundSettings: {
        on: {
            id: 'on',
            label: '開啟音效',
            description: '播放遊戲音效和語音提示',
            enabled: true,
            sounds: {
                select: '../audio/units/click.mp3',
                correct: '../audio/units/correct.mp3',
                correct02: '../audio/units/correct02.mp3',
                incorrect: '../audio/units/error.mp3',
                success: '../audio/units/success.mp3',
                click: '../audio/units/click.mp3'
            }
        },
        off: {
            id: 'off',
            label: '關閉音效',
            description: '靜音模式',
            enabled: false,
            sounds: {}
        }
    },

    // =====================================================
    // 🔧 輔助方法
    // =====================================================
    
    /**
     * 獲取難度配置
     */
    getDifficultyConfig(difficultyId) {
        return this.difficulties[difficultyId] || this.difficulties.normal;
    },

    /**
     * 獲取數字範圍配置
     */
    getNumberRangeConfig(rangeId) {
        return this.numberRanges[rangeId] || this.numberRanges['1-10'];
    },

    /**
     * 獲取時間限制配置
     */
    getTimeLimitConfig(timeId) {
        return this.timeLimits[timeId] || this.timeLimits.none;
    },

    /**
     * 獲取排序數量配置
     */
    getSortingCountConfig(countId) {
        return this.sortingCounts[countId] || this.sortingCounts[10];
    },

    /**
     * 獲取音效配置
     */
    getSoundConfig(soundId) {
        return this.soundSettings[soundId] || this.soundSettings.on;
    },

    /**
     * 獲取完整遊戲配置
     */
    getGameConfig(settings) {
        return {
            difficulty: this.getDifficultyConfig(settings.difficulty),
            numberRange: this.getNumberRangeConfig(settings.numberRange),
            sortingCount: this.getSortingCountConfig(settings.sortingCount),
            timeLimit: this.getTimeLimitConfig(settings.time),
            sound: this.getSoundConfig(settings.sound)
        };
    },

    /**
     * 驗證設定完整性
     */
    validateSettings(settings) {
        // 🔧 簡單模式不需要選擇測驗模式
        const modeRequired = settings.difficulty !== 'easy';
        const modeValid = modeRequired ? (settings.testMode !== null && settings.testMode !== undefined) : true;

        // 檢查必要設定
        return settings.difficulty && settings.numberRange && settings.sortingCount && modeValid;
    },

    /**
     * 獲取設定選項列表
     */
    getSettingOptions(category) {
        const configs = {
            difficulty: this.difficulties,
            numberRange: this.numberRanges,
            sortingCount: this.sortingCounts,
            time: this.timeLimits,
            testMode: this.testModes,
            sound: this.soundSettings
        };
        
        const categoryConfig = configs[category];
        if (!categoryConfig) return [];
        
        let options = Object.values(categoryConfig).map(config => ({
            value: config.id,
            label: config.label,
            description: config.description,
            order: config.order || 0
        }));
        
        // 如果有order屬性，則按order排序
        if (options.some(option => option.order > 0)) {
            options.sort((a, b) => a.order - b.order);
        }
        
        return options;
    }
};

// =====================================================
// 🎨 HTML模板系統
// =====================================================

const NumberSortingTemplates = {
    /**
     * 設定頁面模板（匹配歡迎畫面樣式）
     */
    settingsScreen(config) {
        return `
            <div class="unit-welcome">
                <div class="welcome-content">
                    <div class="settings-title-row">
                        <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                        <h1>${config.gameTitle}</h1>
                    </div>
                    <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">理解數字的大小順序關係，學習將數字由小到大排序</p>

                    <div class="game-settings">
                        ${this.generateSettingGroup('difficulty', '🎯 選擇難度：', config.difficultyOptions, config.difficulty)}
                        <div id="difficulty-description" class="setting-description" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 0.95em; color: #666; text-align: left;">
                            ${this.getDifficultyDescription(config.difficulty)}
                        </div>
                        <div class="setting-group" id="assist-click-group" style="background: #fff3cd; padding: 15px; border-radius: 10px; border: 2px solid #ffcc02; ${config.difficulty !== 'easy' ? 'display:none;' : ''}">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2em;">♿</span>
                                <span>輔助點擊模式（單鍵操作）：</span>
                            </label>
                            <p style="font-size: 0.9em; color: #666; margin: 8px 0 12px 0; line-height: 1.5;">
                                啟用後，只要偵測到點擊，系統會自動依序完成拖曳數字至正確位置完成排序等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式」</strong>
                            </p>
                            <div class="button-group">
                                <button class="selection-btn ${config.assistClick ? 'active' : ''}" id="assist-click-on">✓ 啟用</button>
                                <button class="selection-btn ${!config.assistClick ? 'active' : ''}" id="assist-click-off">✗ 停用</button>
                            </div>
                        </div>
                        ${this.generateSettingGroup('numberRange', '📊 數字範圍：', config.numberRangeOptions, config.difficulty)}
                        ${this.generateSettingGroup('sortingCount', '📋 排序數量：', config.sortingCountOptions, config.difficulty)}
                        ${this.generateSettingGroup('testMode', '📝 測驗模式：', config.testModeOptions, config.difficulty)}
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
                        <button class="back-btn" onclick="window.location.href='../index.html'">返回主選單</button>
                        <button id="start-game-btn" class="start-btn" disabled>
                            請完成所有設定
                        </button>
                    </div>
                </div>

                ${this.customRangeModal()}
            </div>
        `;
    },

    /**
     * 困難模式遊戲頁面模板（輸入模式）
     */
    hardModeGameScreen(config) {
        return `
            <div class="number-sorting-container difficulty-${config.difficulty}">
                <!-- 標題欄（標準三段式布局） -->
                <div class="header-section">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <div id="progress-info">第 ${config.currentLevel} / ${config.totalLevels} 題</div>
                        </div>
                        <div class="title-bar-center">
                            <div>單元F4：數字排序</div>
                        </div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                        </div>
                    </div>
                </div>
                
                <!-- 困難模式專用遊戲區域 -->
                <div class="game-section">
                    
                    <div id="instruction-area" class="instruction-area">
                        <div class="instruction-content" style="position: relative; display: flex; justify-content: center; align-items: center; width: 100%; padding: 10px 25px; min-height: 60px; background-color: #f8f9fa; border-radius: 50px; box-sizing: border-box;">
                            
                            <div style="position: relative; display: flex; justify-content: center; align-items: center;">
                                
                                <div style="position: absolute; right: 100%; margin-right: 15px; white-space: nowrap;">
                                    <button id="play-numbers-btn" class="action-button-group" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 2px solid #007bff; border-radius: 25px; background-color: #ffffff; cursor: pointer; font-size: 14px; font-weight: 600; color: #007bff;">
                                        <span>唸出題目數字</span>
                                        <span style="font-size: 18px;">🔊</span>
                                    </button>
                                </div>

                                <div id="instruction-text" class="instruction-text" style="font-weight: bold; font-size: 1.2em;"></div>

                            </div>
                            
                            <div class="instruction-actions" style="position: absolute; right: 25px; top: 50%; transform: translateY(-50%);">
                                <button id="show-answer-btn" class="action-button-group" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 2px solid #ffc107; border-radius: 25px; background-color: #ffffff; cursor: pointer; font-size: 14px; font-weight: 600; color: #ffc107;">
                                    <span>提示</span>
                                    <span style="font-size: 18px;">💡</span>
                                </button>
                            </div>
                        </div>
                        
                        <style>
                        .action-button-group:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        }
                        
                        .modal-close-btn:hover {
                            background-color: #c0392b !important;
                            transform: scale(1.1);
                        }

                        /* 點擊時固定不動 - 防止下移效果 */
                        .modal-close-btn:active {
                            background-color: #a83226 !important;
                            transform: scale(1);
                        }

                        /* 數字選擇器關閉按鈕 - 點擊時固定不動 */
                        .close-btn:active {
                            background: #bd2130;
                            transform: translateY(-50%);
                        }

                        @media (max-width: 768px) {
                            /* 在小螢幕上保持水平排列，但簡化佈局 */
                            .instruction-content {
                                flex-direction: row !important;
                                padding: 15px 10px !important;
                                min-height: auto !important;
                                gap: 15px;
                                border-radius: 20px !important;
                            }

                            .instruction-content > div {
                                position: static !important;
                                transform: none !important;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 10px;
                            }
                            
                            .instruction-content > div > div {
                                position: static !important;
                                margin: 0 !important;
                            }
                            
                            .instruction-actions {
                                justify-content: center;
                            }
                            
                            .action-button-group {
                                font-size: 12px !important;
                                padding: 6px 10px !important;
                            }
                            
                            .action-button-group span:last-child {
                                font-size: 16px !important;
                            }
                            
                            #instruction-text {
                                font-size: 1em !important;
                                text-align: center;
                            }
                        }
                        
                        @media (max-width: 480px) {
                            #instruction-text {
                                font-size: 0.9em !important;
                            }
                        }
                        </style>
                    </div>
                    
                    <div id="input-container" class="input-container">
                        <h3 class="section-title">✏️ 請點擊空白框輸入數字</h3>
                        <div id="input-slots" class="input-slots"></div>
                    </div>
                    
                    <div class="control-section">
                        <div id="message-area" class="message-area"></div>
                        <div id="submit-container" class="submit-container"></div>
                    </div>
                </div>
                
                <div class="fireworks-container" id="fireworks-container"></div>
                
                ${this.numberSelectorModal()}
            </div>
        `;
    },

    /**
     * 遊戲頁面模板（匹配原版結構）
     */
    gameScreen(config) {
        return `
            <div class="number-sorting-container difficulty-${config.difficulty}">
                <!-- 標題欄（標準三段式布局） -->
                <div class="header-section">
                    <div class="title-bar">
                        <div class="title-bar-left">
                            <div id="progress-info">第 ${config.currentLevel} / ${config.totalLevels} 題</div>
                        </div>
                        <div class="title-bar-center">
                            <div>單元F4：數字排序</div>
                        </div>
                        <div class="title-bar-right">
                            <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                            <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                        </div>
                    </div>
                </div>
                
                <!-- 遊戲區域（匹配統一任務框架） -->
                <div class="game-section">
                    
                    <div id="number-container" class="number-container"></div>
                    <div id="answer-container" class="answer-container"></div>
                    
                    <div class="control-section">
                        <div id="message-area" class="message-area"></div>
                        <div id="confirm-container" class="confirm-container"></div>
                    </div>
                </div>
                
                <div class="fireworks-container" id="fireworks-container"></div>
            </div>
        `;
    },

    /**
     * 結果頁面模板（新版F1統一樣式）
     */
    resultsScreen(config) {
        return `
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
                    <a href="#" id="complete-reward-link" class="reward-btn-link">
                        🎁 開啟獎勵系統
                    </a>
                </div>

                <div class="results-container">
                    <div class="results-grid">
                        <div class="result-card">
                            <div class="result-icon">✅</div>
                            <div class="result-label">答對題數</div>
                            <div class="result-value">${config.correctAnswers} / ${config.totalQuestions}</div>
                        </div>
                        <div class="result-card">
                            <div class="result-icon">📊</div>
                            <div class="result-label">正確率</div>
                            <div class="result-value">${config.percentage}%</div>
                        </div>
                        <div class="result-card">
                            <div class="result-icon">⏱️</div>
                            <div class="result-label">完成時間</div>
                            <div class="result-value">${config.timeDisplay}</div>
                        </div>
                    </div>

                    <!-- 表現評價 -->
                    <div class="performance-section">
                        <h3>📊 表現評價</h3>
                        <div class="performance-badge">${config.performanceMessage}</div>
                    </div>

                    <!-- 學習成果描述 -->
                    <div class="learning-achievements">
                        <h3>🏆 學習成果</h3>
                        <div class="achievement-list">
                            <div class="achievement-item">🎯 學會比較數字大小</div>
                            <div class="achievement-item">🔢 掌握由小到大排列技巧</div>
                            <div class="achievement-item">📝 練習由大到小排列方式</div>
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
                .results-wrapper {
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    min-height: 100%;
                    padding: 20px 20px 80px 20px;
                    box-sizing: border-box;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                }

                /* 🔧 [Bug修復] @keyframes 已移至 injectGlobalAnimationStyles() 統一管理 */

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
    },

    /**
     * 設定選項群組模板
     */
    generateSettingGroup(type, label, options, difficulty = null) {
        return `
            <div class="setting-group" ${type === 'testMode' ? 'id="mode-selection-group"' : ''}>
                <label class="setting-label">${label}</label>
                <div class="button-group" data-setting-type="${type}">
                    ${options.map(option => `
                        <button class="selection-btn"
                                data-type="${type}"
                                data-value="${option.value}"
                                ${option.active ? 'class="selection-btn active"' : ''}
                                ${type === 'testMode' && difficulty === 'easy' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                            ${option.label}
                        </button>
                    `).join('')}
                </div>
                ${type === 'numberRange' ? '<div id="custom-range-display" class="custom-display"></div>' : ''}
                ${type === 'sortingCount' ? '<div id="custom-sorting-count-display" class="custom-display" style="display: none; margin-top: 10px;"><input type="text" id="custom-sorting-count-value" value="" placeholder="請設定排序數量" style="padding: 8px; border-radius: 5px; border: 2px solid #667eea; background: #667eea; color: white; text-align: center; cursor: pointer; width: 140px; font-weight: bold;" readonly onclick="Game.showCustomSortingCountModal()"></div>' : ''}
                ${type === 'testMode' && difficulty === 'easy' ? '<p style="color: #999; font-size: 0.9em; margin-top: 8px;">簡單模式自動完成，無需選擇測驗模式</p>' : ''}
            </div>
        `;
    },

    /**
     * 取得難度說明文字
     */
    getDifficultyDescription(difficulty) {
        const descriptions = {
            easy: '簡單：有視覺提示，錯誤自動回饋，引導下完成題目。',
            normal: '普通：無視覺提示。',
            hard: '困難：無視覺提示，以輸入數字方式，完成正確的數字排序。'
        };
        return descriptions[difficulty] || '';
    },

    /**
     * 數字方塊模板
     */
    numberBox(number) {
        return `
            <div class="number-box" data-value="${number}" draggable="true">
                ${number}
                <div class="check-mark">✓</div>
            </div>
        `;
    },

    /**
     * 插槽模板
     */
    slot(position, showHint = false, hintNumber = '') {
        return `
            <div class="slot" data-position="${position}">
                ${showHint ? `<span class="slot-hint">${hintNumber}</span>` : ''}
            </div>
        `;
    },

    /**
     * 確認按鈕模板
     */
    confirmButton() {
        return `<button id="confirm-btn" class="confirm-btn">確認答案</button>`;
    },

    /**
     * 自訂範圍模態框模板
     */
    customRangeModal() {
        // 簡化版本 - 現在使用數字輸入器代替表單輸入
        return `
            <!-- 自訂範圍現在使用數字輸入器，不再需要這個模態框 -->
        `;
    },

    /**
     * 自訂排序數量數字輸入器模態框模板
     */

    /**
     * 數字選擇器模態框模板
     */
    numberSelectorModal() {
        return `
            <div class="modal-overlay" id="number-selector-modal">
                <div class="modal-content number-selector-content">
                    <div class="position-header">
                        <div class="position-info" id="position-info">請輸入第 1 個位置的數字</div>
                        <button class="close-btn" style="transform: translateY(-50%) !important; transition: none !important;" onclick="event.stopPropagation(); Game.closeNumberSelector()">&times;</button>
                    </div>
                    
                    <div class="current-input-display" id="current-input-display"></div>
                    
                    <div class="number-keypad">
                        <button class="keypad-btn" data-number="1">1</button>
                        <button class="keypad-btn" data-number="2">2</button>
                        <button class="keypad-btn" data-number="3">3</button>
                        <button class="keypad-btn clear-btn" data-action="clear">清除</button>
                        
                        <button class="keypad-btn" data-number="4">4</button>
                        <button class="keypad-btn" data-number="5">5</button>
                        <button class="keypad-btn" data-number="6">6</button>
                        <button class="keypad-btn backspace-btn" data-action="backspace">⌫</button>
                        
                        <button class="keypad-btn" data-number="7">7</button>
                        <button class="keypad-btn" data-number="8">8</button>
                        <button class="keypad-btn" data-number="9">9</button>
                        <button class="keypad-btn confirm-btn" data-action="confirm">確認</button>
                        
                        <button class="keypad-btn zero-btn" data-number="0">0</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 數字序列語音播放模態框
     */
    numberSequenceModal(numbersToRead, instructionText) {
        // 判斷是否為答案提示
        const isHint = instructionText.includes('💡 答案提示');
        const modalIcon = isHint ? '💡' : '🔢';
        const modalTitle = isHint ? '答案提示' : '聽取數字序列';

        // 處理提示文字的多行顯示
        const hintTitle = '💡 答案提示：';
        const hintNumbers = isHint ? instructionText.replace(hintTitle, '').trim() : '';
        
        return `
            <div class="modal-overlay voice-playback-modal" id="voice-playback-modal">
                <div class="modal-content voice-playback-content ${isHint ? 'hint-modal' : ''}" style="position: relative;">
                    <button id="close-modal-btn" class="modal-close-btn" style="position: absolute; top: 10px; right: 10px; width: 30px; height: 30px; border: none; border-radius: 50%; background-color: #e74c3c; color: white; font-size: 20px; font-weight: bold; cursor: pointer; z-index: 1000; transform: none !important; transition: none !important;">&times;</button>
                    <div class="voice-modal-header" style="padding-top: 20px;">
                        <div class="voice-icon">${modalIcon}</div>
                        <h3 class="voice-modal-title">${modalTitle}</h3>
                    </div>
                    
                    <div class="voice-modal-body">
                        <div class="instruction-display">
                            ${isHint ? `
                                <p class="instruction-text" style="margin-bottom: 0; text-align: center;">${hintTitle}</p>
                                <p class="instruction-text" style="margin-top: 8px; font-weight: normal; text-align: center;">${hintNumbers}</p>
                            ` : `
                                <p class="instruction-text">${instructionText}</p>
                            `}
                        </div>
                        
                        <div class="numbers-display">
                            <div class="numbers-container" id="voice-numbers-container">
                                ${numbersToRead.split('，').map((num, index) => 
                                    `<span class="number-item" data-index="${index}">${num}</span>`
                                ).join('')}
                            </div>
                        </div>
                        
                        <div class="voice-status">
                            <div class="voice-animation">
                                <div class="sound-wave">
                                    <div class="wave-bar"></div>
                                    <div class="wave-bar"></div>
                                    <div class="wave-bar"></div>
                                    <div class="wave-bar"></div>
                                    <div class="wave-bar"></div>
                                </div>
                            </div>
                            <p class="voice-status-text">🔊 正在播放數字序列...</p>
                        </div>
                    </div>
                    
                    <div class="voice-modal-footer">
                        <div class="progress-indicator">
                            <div class="progress-bar" id="voice-progress-bar"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

// 全域遊戲物件
let Game;

document.addEventListener('DOMContentLoaded', () => {
    Game = {
        // =====================================================
        // 🐛 Debug System - FLAGS 分類開關系統
        // =====================================================
        // 使用方式：在瀏覽器 Console 中輸入
        // Game.Debug.FLAGS.all = true;      // 開啟全部
        // Game.Debug.FLAGS.drag = true;     // 只開啟拖曳相關
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
                game: false,       // 遊戲流程
                user: false,       // 使用者行為
                error: true        // 錯誤訊息（預設開啟）
            },

            log(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.log(`[F4-${category}]`, ...args);
                }
            },

            warn(category, ...args) {
                if (this.FLAGS.all || this.FLAGS[category]) {
                    console.warn(`[F4-${category}]`, ...args);
                }
            },

            error(...args) {
                if (this.FLAGS.error) {
                    console.error('[F4-ERROR]', ...args);
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

            logDragDrop(message, data) {
                this.log('drag', message, data);
            },

            logAudio(message, data) {
                this.log('audio', message, data);
            },

            logConfig(message, data) {
                this.log('init', message, data);
            },

            logMobileDrag(phase, element, event, data = null) {
                if (!this.FLAGS.all && !this.FLAGS.drag && !this.FLAGS.touch) return;
                const elementInfo = {
                    tagName: element?.tagName,
                    className: element?.className,
                    id: element?.id,
                    dataValue: element?.dataset?.value,
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
            if (document.getElementById('f4-global-animations')) return;

            const css = `
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
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
            style.id = 'f4-global-animations';
            style.innerHTML = css;
            document.head.appendChild(style);
        },

        // =====================================================
        // 🔄 resetGameState - 統一遊戲狀態重置
        // =====================================================
        resetGameState() {
            // 核心遊戲狀態
            this.state.currentLevel = 1;
            this.state.totalLevels = 1;
            this.state.score = 0;
            this.state.timeRemaining = null;
            this.state.isChecking = false;
            this.state.startTime = null;
            this.state.isEndingGame = false;

            // 清除計時器
            this.TimerManager.clearByCategory('timer');
            this.state.timerInterval = null;

            // 遊戲數據
            this.state.currentNumbers = [];
            this.state.correctOrder = [];
            this.state.draggedElement = null;

            Game.Debug.log('state', '🔄 遊戲狀態已重置');
        },

        // =====================================================
        // 🎮 遊戲狀態管理
        // =====================================================
        state: {
            currentLevel: 1,
            totalLevels: 1,
            score: 0,
            timeRemaining: null,
            isChecking: false,
            startTime: null,
            timerInterval: null,
            currentNumbers: [],
            correctOrder: [],
            draggedElement: null,
            
            // 設定狀態
            settings: {
                difficulty: null,
                numberRange: null,
                sortingCount: null,
                time: 'none', // 固定為無時間限制
                testMode: null,
                sound: 'on', // 固定為開啟音效
                assistClick: false
            },
            
            // 遊戲模式設定（預設連續數列）
            gameMode: {
                isConsecutive: true // 預設為連續數列
            },
            
            // 自訂範圍設定
            customRange: {
                startNumber: 1,
                endNumber: 20,
                numbersPerLevel: 10,
                totalLevels: 1
            },
            
            // 自訂排序數量設定
            customSortingCount: 10
        },

        // =====================================================
        // 🎨 UI元素管理
        // =====================================================
        elements: {
            app: null,
            gameTitle: null,
            numberContainer: null,
            answerContainer: null,
            confirmContainer: null,
            messageArea: null,
            progressInfo: null,
            scoreInfo: null,
            timerInfo: null,
            fireworksContainer: null
        },

        // =====================================================
        // 🚀 初始化系統
        // =====================================================
        init() {
            Game.Debug.logGameFlow('遊戲系統初始化開始');
            // 🔧 [Bug修復] 清理所有計時器和事件監聽器
            this.TimerManager.clearAll();
            this.EventManager.removeAll();
            // 🎬 注入全局動畫樣式
            this.injectGlobalAnimationStyles();
            this.initElements();
            this.Speech.init();
            this.showSettings();
            Game.Debug.logGameFlow('遊戲系統初始化完成');
        },

        initElements() {
            this.elements.app = document.getElementById('app');
            if (!this.elements.app) {
                Game.Debug.error('找不到 #app 元素');
                return;
            }
        },

        // =====================================================
        // ⚙️ 設定頁面系統
        // =====================================================
        showSettings() {
            AssistClick.deactivate();
            Game.Debug.logGameFlow('顯示設定頁面');
            // 🔧 [Bug修復] 清理遊戲UI相關計時器和事件監聯器
            this.TimerManager.clearAll();
            this.EventManager.removeByCategory('gameUI');

            // 🔄 重置遊戲狀態
            this.resetGameState();

            const config = {
                gameTitle: NumberSortingConfig.game.title,
                difficulty: this.state.settings.difficulty,
                assistClick: this.state.settings.assistClick,
                difficultyOptions: this.getOptionsWithState('difficulty'),
                numberRangeOptions: this.getOptionsWithState('numberRange'),
                sortingCountOptions: this.getOptionsWithState('sortingCount'),
                timeOptions: this.getOptionsWithState('time'),
                testModeOptions: this.getOptionsWithState('testMode'),
                soundOptions: this.getOptionsWithState('sound')
            };

            this.elements.app.innerHTML = NumberSortingTemplates.settingsScreen(config);
            this.bindSettingsEvents();

            // 🔧 [新增] 如果已設定自訂排序數量，顯示藍色框
            if (this.state.settings.sortingCount === 'custom' && this.state.customSortingCount) {
                const customDisplay = document.getElementById('custom-sorting-count-display');
                const customInput = document.getElementById('custom-sorting-count-value');
                if (customDisplay && customInput) {
                    customDisplay.style.display = 'block';
                    customInput.value = `${this.state.customSortingCount}個`;
                    customInput.style.background = '#667eea';
                    customInput.style.color = 'white';
                    customInput.style.border = '2px solid #667eea';
                }
            }

            this.updateStartButton();
        },

        getOptionsWithState(category) {
            const options = NumberSortingConfig.getSettingOptions(category);
            const currentValue = this.state.settings[category];
            
            return options.map(option => ({
                ...option,
                active: option.value === currentValue
            }));
        },

        bindSettingsEvents() {
            // 設定選擇事件（使用 EventManager）
            const settingsForm = this.elements.app.querySelector('.game-settings');
            if (settingsForm) {
                this.EventManager.on(settingsForm, 'click', this.handleSettingSelection.bind(this), {}, 'gameUI');
            }

            // 開始遊戲按鈕
            const startButton = document.getElementById('start-game-btn');
            if (startButton) {
                this.EventManager.on(startButton, 'click', this.startGame.bind(this), {}, 'gameUI');
            }

            // 獎勵系統連結
            const rewardLink = document.getElementById('settings-reward-link');
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
            const worksheetLink = document.getElementById('settings-worksheet-link');
            if (worksheetLink) {
                this.EventManager.on(worksheetLink, 'click', (e) => {
                    e.preventDefault();
                    // 作業單使用自己的預設值與工具列設定，不受遊戲設定影響
                    const params = new URLSearchParams({ unit: 'f4' });
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

        handleSettingSelection(event) {
            // 🔓 解鎖手機音頻播放權限
            if (window.AudioUnlocker && !window.AudioUnlocker.isUnlocked) {
                window.AudioUnlocker.unlock();
            }
            
            const button = event.target.closest('.selection-btn');
            if (!button) return;

            const { type, value } = button.dataset;
            Game.Debug.logUserAction(`選擇設定: ${type} = ${value}`);

            // 播放選擇音效
            this.playSelectSound();

            // 特殊處理自訂範圍
            if (type === 'numberRange' && value === 'custom') {
                this.showCustomRangeModal();
                return;
            }

            // 特殊處理自訂排序數量
            if (type === 'sortingCount' && value === 'custom') {
                this.showCustomSortingCountModal();
                return;
            }

            // 更新設定
            this.updateSetting(type, value);

            // 更新UI狀態
            this.updateSettingButtons(type, value);

            // 🔧 [新增] 如果選擇非自訂的排序數量，隱藏藍色框
            if (type === 'sortingCount' && value !== 'custom') {
                const customDisplay = document.getElementById('custom-sorting-count-display');
                const customInput = document.getElementById('custom-sorting-count-value');
                if (customDisplay && customInput) {
                    customDisplay.style.display = 'none';
                    customInput.value = '';
                    customInput.style.background = 'white';
                    customInput.style.color = '#333';
                    customInput.style.border = '2px solid #ddd';
                }
                // 清除自訂排序數量
                this.state.customSortingCount = null;
            }

            // 🔧 如果修改難度，更新測驗模式按鈕的可用性
            if (type === 'difficulty') {
                this.updateModeButtonsAvailability(value);
                this.updateDifficultyDescription(value);
                // 👆 輔助點擊：只在簡單模式顯示
                const assistGroup = document.getElementById('assist-click-group');
                if (assistGroup) assistGroup.style.display = value !== 'easy' ? 'none' : '';
                if (value !== 'easy') this.state.settings.assistClick = false;
            }

            this.updateStartButton();
        },

        updateSetting(type, value) {
            this.state.settings[type] = value;
            Game.Debug.logConfig(`設定更新: ${type} = ${value}`, this.state.settings);
        },

        updateSettingButtons(type, selectedValue) {
            const buttonGroup = this.elements.app.querySelector(`[data-setting-type="${type}"]`);
            if (!buttonGroup) return;

            buttonGroup.querySelectorAll('.selection-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === selectedValue);
            });
        },

        // 🔧 更新測驗模式按鈕的可用性（簡單模式時禁用）
        updateModeButtonsAvailability(difficulty) {
            const modeButtons = document.querySelectorAll('[data-type="testMode"]');
            const modeGroup = document.getElementById('mode-selection-group');
            if (!modeGroup) return;

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
                Game.Debug.logConfig('簡單模式：測驗模式已重置為null');
            } else {
                // 普通/困難模式：啟用測驗模式按鈕
                modeButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                });

                // 移除提示文字
                const existingHint = modeGroup.querySelector('.mode-hint');
                if (existingHint) {
                    existingHint.remove();
                }
            }
        },

        // 更新難度說明文字
        updateDifficultyDescription(difficulty) {
            const descDiv = document.getElementById('difficulty-description');
            if (descDiv) {
                descDiv.textContent = NumberSortingTemplates.getDifficultyDescription(difficulty);
            }
        },

        updateStartButton() {
            const startButton = document.getElementById('start-game-btn');
            if (!startButton) return;

            const { difficulty, numberRange, sortingCount, testMode } = this.state.settings;

            // 🔧 簡單模式不需要選擇測驗模式
            const modeRequired = difficulty !== 'easy';
            const modeValid = modeRequired ? (testMode !== null && testMode !== undefined) : true;

            // 檢查所有必要設定是否完成
            const allSettingsComplete = difficulty && numberRange && sortingCount && modeValid;

            startButton.disabled = !allSettingsComplete;
            startButton.textContent = allSettingsComplete ? '開始遊戲' : '請完成所有設定';
            startButton.className = allSettingsComplete ? 'start-btn' : 'start-btn disabled';
        },

        // =====================================================
        // 🎯 自訂範圍系統
        // =====================================================
        showCustomRangeModal() {
            Game.Debug.logGameFlow('顯示自訂範圍設定（數字輸入器模式）');
            
            // 步驟1：輸入起始數字
            this.showStartNumberInput();
        },
        
        /**
         * 顯示起始數字輸入器
         */
        showStartNumberInput() {
            Game.Debug.logGameFlow('顯示起始數字輸入器');
            
            this.showNumberInput(
                '🔢 輸入起始數字 (1-999)',
                (startNumber) => {
                    Game.Debug.logUserAction(`起始數字輸入: ${startNumber}`);
                    
                    // 驗證起始數字
                    if (startNumber < 1 || startNumber > 999) {
                        alert('起始數字必須在 1-999 之間！');
                        this.showStartNumberInput(); // 重新輸入
                        return;
                    }
                    
                    // 儲存起始數字
                    this.state.tempCustomRange = {
                        startNumber: startNumber
                    };
                    
                    // 進入結束數字輸入
                    this.showEndNumberInput();
                },
                () => {
                    // 取消回調
                    Game.Debug.logUserAction('取消起始數字輸入');
                }
            );
        },
        
        /**
         * 顯示結束數字輸入器
         */
        showEndNumberInput() {
            const startNumber = this.state.tempCustomRange.startNumber;
            Game.Debug.logGameFlow(`顯示結束數字輸入器（起始: ${startNumber}）`);
            
            this.showNumberInput(
                `🔢 輸入結束數字 (>${startNumber})`,
                (endNumber) => {
                    Game.Debug.logUserAction(`結束數字輸入: ${endNumber}`);
                    
                    // 驗證結束數字
                    if (endNumber <= startNumber) {
                        alert(`結束數字必須大於起始數字 ${startNumber}！`);
                        this.showEndNumberInput(); // 重新輸入
                        return;
                    }
                    
                    if (endNumber > 999) {
                        alert('結束數字不能超過 999！');
                        this.showEndNumberInput(); // 重新輸入
                        return;
                    }
                    
                    // 完成範圍設定
                    this.confirmCustomRange(startNumber, endNumber);
                },
                () => {
                    // 取消回調 - 返回起始數字輸入
                    Game.Debug.logUserAction('取消結束數字輸入，返回起始數字輸入');
                    this.showStartNumberInput();
                }
            );
        },
        
        /**
         * 確認自訂範圍設定
         */
        confirmCustomRange(startNumber, endNumber) {
            Game.Debug.logConfig('確認自訂範圍設定', { startNumber, endNumber });
            
            // 計算範圍大小和預設每題數字數量
            const totalNumbers = endNumber - startNumber + 1;
            const defaultNumbersPerLevel = Math.min(10, totalNumbers); // 預設10個，但不超過範圍
            
            // 更新自訂範圍狀態
            this.state.customRange = {
                startNumber: startNumber,
                endNumber: endNumber,
                numbersPerLevel: defaultNumbersPerLevel,
                isConsecutive: true // 預設為連續數列
            };
            
            // 更新設定
            this.updateSetting('numberRange', 'custom');
            this.updateSettingButtons('numberRange', 'custom');
            this.updateCustomRangeDisplay();
            this.updateStartButton();
            
            Game.Debug.logConfig('自訂範圍設定完成', this.state.customRange);
        },

        closeCustomRangeModal() {
            // 簡化版本 - 現在使用數字輸入器，不再需要這個函數
            Game.Debug.logGameFlow('關閉自訂範圍設定 (已簡化)');
        },

        validateCustomRange(start, end, perLevel) {
            if (start < 1 || end > 999) {
                alert('數字範圍必須在 1-999 之間！');
                return false;
            }
            if (start >= end) {
                alert('結束數字必須大於起始數字！');
                return false;
            }
            if (perLevel < 3 || perLevel > 15) {
                alert('每題數字數量必須在 3-15 之間！');
                return false;
            }
            if ((end - start + 1) < perLevel) {
                alert('數字範圍必須大於或等於每題數字數量！');
                return false;
            }
            return true;
        },

        updateCustomRangeDisplay() {
            const display = document.getElementById('custom-range-display');
            if (display && this.state.settings.numberRange === 'custom') {
                const { startNumber, endNumber, numbersPerLevel, isConsecutive } = this.state.customRange;
                const sequenceType = isConsecutive ? '連續數列' : '非連續數列';
                display.innerHTML = `
                    <div class="custom-info">
                        範圍：${startNumber}-${endNumber} | 每題：${numbersPerLevel}個數字 | ${sequenceType}
                    </div>
                `;
                display.style.display = 'block';
            } else if (display) {
                display.style.display = 'none';
            }
        },

        /**
         * 顯示數字輸入器 (適配自f2風格)
         */
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
                        if (display.value) {
                            const numValue = parseInt(display.value);
                            document.getElementById('number-input-popup').remove();
                            callback(numValue);
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
        // 🎯 自訂排序數量系統
        // =====================================================
        // 🎯 [F6標準] 顯示自訂排序數量輸入器（3x4網格，內聯樣式）
        showCustomSortingCountModal() {
            Game.Debug.logGameFlow('顯示自訂排序數量數字輸入器');

            if (document.getElementById('sorting-count-input-popup')) return;

            const keypadAudio = new Audio('../audio/units/keypad.mp3');
            keypadAudio.volume = 0.7;
            keypadAudio.preload = 'auto';

            const popupHTML = `
                <div id="sorting-count-input-popup" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;">
                    <div style="background:white; padding:20px; border-radius:15px; width:320px; text-align:center; position:relative;">
                        <button id="close-sorting-count-input" style="
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
                        <h3 style="margin-top: 10px; color: #333;">請設定排序數量 (3-20)</h3>
                        <input type="text" id="sorting-count-display" readonly style="width:90%; font-size:2em; text-align:center; margin-bottom:15px; padding: 8px; border: 2px solid #ddd; border-radius: 8px;">
                        <div id="sorting-count-pad" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;"></div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', popupHTML);
            const pad = document.getElementById('sorting-count-pad');
            const display = document.getElementById('sorting-count-display');
            const closeBtn = document.getElementById('close-sorting-count-input');

            closeBtn.onclick = () => {
                document.getElementById('sorting-count-input-popup').remove();
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
                    if (key !== '確認') { keypadAudio.currentTime = 0; keypadAudio.play().catch(() => {}); }

                    if (key === '清除') {
                        display.value = '';
                    } else if (key === '確認') {
                        const count = parseInt(display.value);
                        if (display.value && this.validateCustomSortingCount(count)) {
                            Game.Debug.logUserAction(`確認排序數量輸入: ${count}`);

                            // 設定排序數量
                            this.state.customSortingCount = count;

                            // 更新設定
                            this.updateSetting('sortingCount', 'custom');
                            this.updateSettingButtons('sortingCount', 'custom');

                            // 🔧 [新增] 顯示自訂排序數量藍色框
                            const customDisplay = document.getElementById('custom-sorting-count-display');
                            const customInput = document.getElementById('custom-sorting-count-value');
                            if (customDisplay && customInput) {
                                customDisplay.style.display = 'block';
                                customInput.value = `${count}個`;
                                customInput.style.background = '#667eea';
                                customInput.style.color = 'white';
                                customInput.style.border = '2px solid #667eea';
                            }

                            this.updateStartButton();

                            // 關閉選擇器
                            document.getElementById('sorting-count-input-popup').remove();

                            Game.Debug.logConfig('自訂排序數量設定完成', { count });
                        }
                    } else {
                        if (display.value.length < 2) display.value += key;
                    }
                };
                pad.appendChild(btn);
            });
        },

        validateCustomSortingCount(count) {
            if (isNaN(count) || count < 3 || count > 20) {
                return false;
            }
            return true;
        },

        // =====================================================
        // 🎮 遊戲主邏輯
        // =====================================================
        startGame() {
            Game.Debug.logGameFlow('開始遊戲');

            // 播放點擊音效
            this.playClickSound();

            // 初始化遊戲狀態
            this.initGameState();

            // 顯示遊戲畫面
            this.showGameScreen();

            if (this.state.settings.difficulty === 'easy' && this.state.settings.assistClick) {
                AssistClick.activate();
            }

            // 開始第一關
            this.startLevel();
        },

        initGameState() {
            // 🔄 重置遊戲狀態
            this.resetGameState();
            this.state.startTime = Date.now();
            window.LearningTracker?.resetWrong?.();   // 學習紀錄：錯誤/逐題計數歸零

            const gameConfig = NumberSortingConfig.getGameConfig(this.state.settings);
            
            // 設定關卡數（使用排序數量設定）
            const sortingCount = this.state.settings.sortingCount === 'custom' 
                ? this.state.customSortingCount 
                : gameConfig.sortingCount.value;
            
            // 根據數字範圍計算總題數
            // 🔧 [Bug修復] 自訂範圍的 startNumber/endNumber 存於 this.state.customRange，
            // 而非 gameConfig.numberRange（後者的 custom 物件無頂層這兩個欄位）
            const rangeConfig = this.state.settings.numberRange === 'custom'
                ? this.state.customRange
                : gameConfig.numberRange;
            const totalNumbers = rangeConfig.endNumber - rangeConfig.startNumber + 1;
            this.state.totalLevels = Math.ceil(totalNumbers / sortingCount);
            this.state.numbersPerLevel = sortingCount;
            
            // 設定計時器
            if (gameConfig.timeLimit.value) {
                this.state.timeRemaining = gameConfig.timeLimit.value;
                this.startTimer();
            }
            
            Game.Debug.logConfig('遊戲狀態初始化完成', {
                totalLevels: this.state.totalLevels,
                sortingCount: gameConfig.sortingCount.value || this.state.customSortingCount,
                timeLimit: gameConfig.timeLimit.value,
                difficulty: gameConfig.difficulty.id
            });
        },

        showGameScreen() {
            const gameConfig = NumberSortingConfig.getGameConfig(this.state.settings);
            const config = {
                difficulty: gameConfig.difficulty.id,
                levelTitle: this.getLevelTitle(),
                currentLevel: this.state.currentLevel,
                totalLevels: this.state.totalLevels,
                score: this.state.score,
                timeDisplay: this.getTimeDisplay()
            };
            
            // 根據難度模式選擇不同的畫面模板
            if (gameConfig.difficulty.inputMode) {
                this.elements.app.innerHTML = NumberSortingTemplates.hardModeGameScreen(config);
            } else {
                this.elements.app.innerHTML = NumberSortingTemplates.gameScreen(config);
            }
            
            this.initGameElements();
            this.bindGameEvents();
            
            // 重新註冊觸控拖拽區域
            this.registerTouchDropZones();
        },

        initGameElements() {
            // 通用元素
            this.elements.gameTitle = document.querySelector('.game-title');
            this.elements.messageArea = document.getElementById('message-area');
            this.elements.progressInfo = document.getElementById('progress-info');
            this.elements.scoreInfo = document.getElementById('score-info');
            this.elements.timerInfo = document.getElementById('timer-info');
            this.elements.fireworksContainer = document.getElementById('fireworks-container');
            
            // 一般模式元素
            this.elements.numberContainer = document.getElementById('number-container');
            this.elements.answerContainer = document.getElementById('answer-container');
            this.elements.confirmContainer = document.getElementById('confirm-container');
            
            // 困難模式元素
            this.elements.instructionArea = document.getElementById('instruction-area');
            this.elements.instructionText = document.getElementById('instruction-text');
            this.elements.inputSlots = document.getElementById('input-slots');
            this.elements.submitContainer = document.getElementById('submit-container');
        },

        bindGameEvents() {
            const gameConfig = NumberSortingConfig.getGameConfig(this.state.settings);
            
            if (gameConfig.difficulty.inputMode) {
                // 困難模式：綁定點擊輸入事件
                this.bindInputEvents();
            } else {
                // 一般模式：拖放事件
                this.bindDragDropEvents();
            }
        },

        bindInputEvents() {
            // 輸入框點擊事件已在 renderInputSlots 中綁定
            // 這裡綁定鍵盤事件（使用 EventManager）
            this.EventManager.on(document, 'keydown', this.handleKeydown.bind(this), {}, 'gameUI');
        },

        handleInputSlotClick(event) {
            const index = parseInt(event.target.dataset.index);
            Game.Debug.logUserAction(`點擊輸入框 ${index}`);
            
            // 設為當前輸入框
            this.setActiveInputSlot(index);
            
            // 彈出數字輸入對話框
            this.showNumberInputDialog(index);
        },

        setActiveInputSlot(index) {
            // 移除所有active狀態
            document.querySelectorAll('.input-slot').forEach(slot => {
                slot.classList.remove('active');
            });
            
            this.state.currentInputIndex = index;
            
            // 如果有有效索引，設為active
            if (index >= 0) {
                const targetSlot = document.querySelector(`[data-index="${index}"]`);
                if (targetSlot) {
                    targetSlot.classList.add('active');
                }
            }
        },

        showNumberInputDialog(index) {
            Game.Debug.logUserAction(`顯示數字輸入器: 位置${index + 1}`);
            
            // 儲存當前輸入框索引和臨時輸入值
            this.state.currentInputIndex = index;
            this.state.tempInputValue = this.state.inputValues[index]?.toString() || '';
            
            // 更新位置資訊
            const positionInfo = document.getElementById('position-info');
            if (positionInfo) {
                positionInfo.textContent = `請輸入第 ${index + 1} 個位置的數字`;
            }
            
            // 初始化按鍵輸入器
            this.initializeKeypad();
            
            // 顯示當前輸入值
            this.updateInputDisplay();
            
            // 顯示數字選擇器
            const modal = document.getElementById('number-selector-modal');
            if (modal) {
                modal.classList.add('show');
            }
        },

        initializeKeypad() {
            // 先移除舊的事件監聽器，避免重複綁定
            const keypadBtns = document.querySelectorAll('.keypad-btn');
            keypadBtns.forEach(btn => {
                // 使用 cloneNode 方式移除所有事件監聽器
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
            });
            
            // 重新綁定按鍵事件（使用 EventManager）
            const newKeypadBtns = document.querySelectorAll('.keypad-btn');
            newKeypadBtns.forEach(btn => {
                this.EventManager.on(btn, 'click', (e) => {
                    const number = e.target.dataset.number;
                    const action = e.target.dataset.action;

                    if (number !== undefined) {
                        this.handleKeypadNumber(number);
                    } else if (action) {
                        this.handleKeypadAction(action);
                    }
                }, {}, 'gameUI');
            });
        },

        handleKeypadNumber(digit) {
            Game.Debug.logUserAction(`按鍵輸入: ${digit}`);
            
            // 限制最多輸入3位數字
            if (this.state.tempInputValue.length < 3) {
                this.state.tempInputValue += digit;
                this.updateInputDisplay();
            }
        },

        handleKeypadAction(action) {
            Game.Debug.logUserAction(`按鍵操作: ${action}`);
            
            switch (action) {
                case 'backspace':
                    if (this.state.tempInputValue.length > 0) {
                        this.state.tempInputValue = this.state.tempInputValue.slice(0, -1);
                        this.updateInputDisplay();
                    }
                    break;
                case 'clear':
                    this.state.tempInputValue = '';
                    this.updateInputDisplay();
                    break;
                case 'confirm':
                    this.confirmKeypadInput();
                    break;
            }
        },

        updateInputDisplay() {
            const display = document.getElementById('current-input-display');
            if (display) {
                display.textContent = this.state.tempInputValue || '請輸入數字';
                display.className = `current-input-display ${this.state.tempInputValue ? 'has-value' : 'empty'}`;
            }
        },

        confirmKeypadInput() {
            const number = parseInt(this.state.tempInputValue);
            
            if (this.state.tempInputValue && !isNaN(number) && number >= 0) {
                Game.Debug.logUserAction(`確認輸入: ${number} for 位置${this.state.currentInputIndex + 1}`);
                
                // 播放輸入數字的語音
                this.Speech.speak(number.toString());
                Game.Debug.logUserAction(`播放數字語音: ${number}`);
                
                // 設定輸入值
                this.setInputValue(this.state.currentInputIndex, number);
                
                // 關閉輸入器
                this.closeNumberSelector();
            } else {
                // 如果輸入為空或無效，提示用戶
                alert('請輸入有效的數字！');
            }
        },

        closeNumberSelector() {
            const modal = document.getElementById('number-selector-modal');
            if (modal) {
                modal.classList.remove('show');
            }
            
            // 移除active狀態
            this.setActiveInputSlot(-1);
        },

        setInputValue(index, value) {
            this.state.inputValues[index] = value;
            
            // 更新顯示
            const slot = document.querySelector(`[data-index="${index}"]`);
            if (slot) {
                slot.textContent = value;
                if (value !== '') {
                    slot.classList.add('filled');
                } else {
                    slot.classList.remove('filled');
                }
            }
            
            Game.Debug.logUserAction(`設定輸入值: 位置${index} = ${value}`);
            
            // 檢查是否全部填完
            this.checkAllInputsFilled();
        },

        checkAllInputsFilled() {
            const allFilled = this.state.inputValues.every(value => value !== '');
            
            if (allFilled) {
                this.showSubmitButton();
            } else {
                this.hideSubmitButton();
            }
        },

        showSubmitButton() {
            if (!this.elements.submitContainer) return;
            
            this.elements.submitContainer.innerHTML = `
                <button class="submit-btn show" id="submit-answer-btn">
                    送出答案
                </button>
            `;
            
            const submitBtn = document.getElementById('submit-answer-btn');
            if (submitBtn) {
                this.EventManager.on(submitBtn, 'click', this.submitHardModeAnswer.bind(this), {}, 'gameUI');
            }
            
            Game.Debug.logGameFlow('顯示送出按鈕');
        },

        hideSubmitButton() {
            if (this.elements.submitContainer) {
                this.elements.submitContainer.innerHTML = '';
            }
        },

        submitHardModeAnswer() {
            // 🛡️ 防止重複點擊
            if (this.state.isChecking) {
                Game.Debug.logGameFlow('困難模式：正在處理答案，忽略重複點擊');
                return;
            }

            this.state.isChecking = true;
            Game.Debug.logGameFlow('困難模式：送出答案', this.state.inputValues);

            // 立即隱藏送出按鈕，防止再次點擊
            this.hideSubmitButton();

            // 檢查答案是否正確
            const isCorrect = this.validateHardModeAnswer();

            if (isCorrect) {
                this.handleCorrectAnswer();
            } else {
                this.handleIncorrectHardModeAnswer();
            }
        },

        validateHardModeAnswer() {
            for (let i = 0; i < this.state.correctOrder.length; i++) {
                if (this.state.inputValues[i] !== this.state.correctOrder[i]) {
                    return false;
                }
            }
            return true;
        },

        handleIncorrectHardModeAnswer() {
            Game.Debug.logGameFlow('困難模式：答案錯誤');
            window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
            this.playSound('incorrect');

            const testMode = this.state.settings.testMode;

            // 根據測驗模式決定行為
            if (testMode === 'single') {
                // 🔧 檢查是否是最後一題
                const isLastLevel = this.state.currentLevel >= this.state.totalLevels;

                if (isLastLevel) {
                    // 最後一題錯誤
                    this.showMessage('對不起有錯誤，測驗結束。', 'error');
                    // 🔧 [Bug修復] 使用 TimerManager 統一管理
                    this.TimerManager.setTimeout(() => {
                        this.Speech.speakTemplate('incorrectSingleLast', () => {
                            Game.Debug.logGameFlow('困難模式最後一題錯誤語音播放完成，結束測驗');
                            this.TimerManager.setTimeout(() => {
                                this.completeGame();
                            }, 500, 'turnTransition');
                        });
                    }, 300, 'turnTransition');
                } else {
                    // 非最後一題錯誤
                    this.showMessage('對不起有錯誤，進入下一題。', 'error');
                    // 🔧 [Bug修復] 使用 TimerManager 統一管理
                    this.TimerManager.setTimeout(() => {
                        this.Speech.speakTemplate('incorrectSingle', () => {
                            Game.Debug.logGameFlow('困難模式單次作答錯誤語音播放完成，進入下一題');
                            this.TimerManager.setTimeout(() => {
                                this.nextLevel();
                            }, 500, 'turnTransition');
                        });
                    }, 300, 'turnTransition');
                }
            } else {
                // 反複練習模式：先播放錯誤音效，延遲後播放語音
                this.showMessage('對不起，有錯誤喔，請再試一次。', 'error');
                // 🔧 [Bug修復] 使用 TimerManager 統一管理
                this.TimerManager.setTimeout(() => {
                    this.Speech.speakTemplate('incorrect', () => {
                        // 清空所有輸入，重新顯示輸入介面
                        this.TimerManager.setTimeout(() => {
                            this.clearAllInputs();
                            this.showMessage('');
                            // 🔓 重置檢查狀態，允許重新送出
                            this.state.isChecking = false;
                            // 完全重新渲染困難模式界面而不是嘗試恢復
                            this.renderHardModeLevel();
                        }, 1000, 'turnTransition');
                    });
                }, 300, 'turnTransition');
            }
        },

        clearAllInputs() {
            this.state.inputValues.fill('');
            
            document.querySelectorAll('.input-slot').forEach(slot => {
                slot.textContent = '';
                slot.classList.remove('filled', 'active');
            });
            
            this.hideSubmitButton();
        },

        resetHardModeInterface() {
            Game.Debug.logGameFlow('重置困難模式介面開始');
            
            // 檢查元素存在性
            Game.Debug.logGameFlow('檢查元素存在性', {
                instructionArea: !!this.elements.instructionArea,
                inputSlots: !!this.elements.inputSlots,
                submitContainer: !!this.elements.submitContainer
            });
            
            // 重新顯示指令區域
            if (this.elements.instructionArea) {
                this.elements.instructionArea.style.display = 'block';
                Game.Debug.logGameFlow('重新顯示指令區域');
            } else {
                Game.Debug.logGameFlow('找不到instructionArea元素');
            }
            
            // 重新顯示輸入框區域
            if (this.elements.inputSlots) {
                this.elements.inputSlots.style.display = 'block';
                Game.Debug.logGameFlow('重新顯示輸入框區域，當前內容:', this.elements.inputSlots.innerHTML);
            } else {
                Game.Debug.logGameFlow('找不到inputSlots元素');
            }
            
            // 重新顯示所有提示
            const hints = document.querySelectorAll('.slot-hint');
            Game.Debug.logGameFlow('找到提示框數量:', hints.length);
            hints.forEach((hint, index) => {
                hint.style.display = 'block';
                Game.Debug.logGameFlow(`重新顯示提示框 ${index}`);
            });
            
            // 重新顯示送出按鈕容器（如果存在）
            if (this.elements.submitContainer) {
                this.elements.submitContainer.style.display = 'block';
                Game.Debug.logGameFlow('重新顯示送出按鈕容器');
            } else {
                Game.Debug.logGameFlow('找不到submitContainer元素');
            }
            
            // 重置輸入狀態
            this.state.currentInputIndex = -1;
            
            // 重新渲染輸入框（包含事件綁定）
            Game.Debug.logGameFlow('重新渲染輸入框');
            this.renderInputSlots();
            
            // 重新生成並顯示送出按鈕
            Game.Debug.logGameFlow('重新生成送出按鈕');
            this.showSubmitButton();
            
            Game.Debug.logGameFlow('困難模式介面重置完成');
        },

        handleKeydown(event) {
            // 可以在這裡添加鍵盤快捷鍵支援
            if (event.key === 'Escape') {
                this.setActiveInputSlot(-1);
            }
        },

        // =====================================================
        // 📱 響應式與工具方法
        // =====================================================
        getLevelTitle() {
            return `第 ${this.state.currentLevel} 題`;
        },

        getTimeDisplay() {
            if (this.state.timeRemaining === null) {
                return '無限制';
            }
            const minutes = Math.floor(this.state.timeRemaining / 60);
            const seconds = this.state.timeRemaining % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        },

        // =====================================================
        // 🎯 關卡管理
        // =====================================================
        startLevel() {
            Game.Debug.logGameFlow(`開始第 ${this.state.currentLevel} 關`);
            
            // 生成關卡數字
            this.generateLevelNumbers();
            
            const gameConfig = NumberSortingConfig.getGameConfig(this.state.settings);
            
            if (gameConfig.difficulty.inputMode) {
                // 困難模式：顯示指令和輸入框
                this.renderHardModeLevel();
            } else {
                // 一般模式：渲染數字和插槽
                this.renderNumbers();
                this.renderSlots();
                
                // 清空確認容器和訊息
                this.elements.confirmContainer.innerHTML = '';
                
                // 播放簡單/普通模式的開始語音
                this.playEasyNormalModeInstruction();
            }
            
            this.showMessage('');
        },

        playEasyNormalModeInstruction() {
            // 只在第一題時播放指令語音
            if (this.state.currentLevel === 1) {
                const instructionText = "請將數字由小到大排序";
                this.Speech.speak(instructionText);
                Game.Debug.logGameFlow('播放簡單/普通模式指令語音', { text: instructionText });
            }
        },

        renderHardModeLevel() {
            Game.Debug.logGameFlow('渲染困難模式關卡');
            
            // 生成指令文字和語音
            const instructionData = this.generateInstruction();
            
            // 顯示指令
            if (this.elements.instructionText) {
                this.elements.instructionText.textContent = instructionData.text;
            }
            
            // 綁定喇叭按鈕事件
            this.bindPlayNumbersButton(instructionData.numbersToRead);
            
            // 綁定提示按鈕事件
            this.bindShowAnswerButton();
            
            // 生成輸入框
            this.renderInputSlots();
            
            // 初始化困難模式狀態
            this.state.inputValues = new Array(this.state.currentNumbers.length).fill('');
            this.state.currentInputIndex = -1;
            
            // 顯示語音播放模態框並播放數字序列
            this.showVoicePlaybackModal(instructionData);
        },

        bindPlayNumbersButton(numbersToRead) {
            const playBtn = document.getElementById('play-numbers-btn');
            if (playBtn) {
                // 移除之前的事件監聽器
                playBtn.replaceWith(playBtn.cloneNode(true));
                const newBtn = document.getElementById('play-numbers-btn');
                
                this.EventManager.on(newBtn, 'click', () => {
                    Game.Debug.logUserAction('點擊播放數字按鈕');
                    this.Speech.speak(numbersToRead);
                }, {}, 'gameUI');
            }
        },

        bindShowAnswerButton() {
            const showBtn = document.getElementById('show-answer-btn');
            if (showBtn) {
                // 移除之前的事件監聽器
                showBtn.replaceWith(showBtn.cloneNode(true));
                const newBtn = document.getElementById('show-answer-btn');
                
                this.EventManager.on(newBtn, 'click', () => {
                    Game.Debug.logUserAction('點擊顯示答案提示按鈕');
                    this.showAnswerHint();
                }, {}, 'gameUI');
            }
        },

        showAnswerHint() {
            // 生成答案提示文字和語音
            const answerText = this.state.correctOrder.join('、');
            const answerSpeech = `答案是：${this.state.correctOrder.join('，')}`;
            
            // 創建答案提示的指令數據，使用與開始時相同的格式
            const hintInstructionData = {
                text: `💡 答案提示：${answerText}`,
                speech: answerSpeech,
                numbersToRead: this.state.correctOrder.join('，'),
                isConsecutive: true
            };
            
            // 使用語音播放模態框顯示答案提示
            this.showVoicePlaybackModal(hintInstructionData);
            
            Game.Debug.logGameFlow('顯示答案提示', { 
                text: answerText,
                speech: answerSpeech 
            });
        },

        generateInstruction() {
            const isConsecutive = this.state.settings.numberRange === 'custom' 
                ? this.state.customRange.isConsecutive 
                : this.state.gameMode.isConsecutive;
            
            let instructionText, speechText, numbersToRead;
            
            if (isConsecutive) {
                // 連續數列：顯示範圍
                const start = this.state.correctOrder[0];
                const end = this.state.correctOrder[this.state.correctOrder.length - 1];
                instructionText = `${start} 至 ${end} 的數字，由小到大排序`;
                speechText = `請將 ${start} 至 ${end} 的數字，由小到大排序`;
                numbersToRead = this.state.correctOrder.join('，');
            } else {
                // 非連續數列：顯示最小到最大範圍
                const start = Math.min(...this.state.correctOrder);
                const end = Math.max(...this.state.correctOrder);
                instructionText = `${start} 至 ${end} 的數字，由小到大排序`;
                speechText = `請將 ${start} 至 ${end} 的數字，由小到大排序`;
                numbersToRead = this.state.correctOrder.join('，');
            }
            
            Game.Debug.logGameFlow('生成困難模式指令', { 
                isConsecutive, 
                text: instructionText,
                numbers: this.state.correctOrder 
            });
            
            return {
                text: instructionText,
                speech: speechText,
                numbersToRead: numbersToRead,
                isConsecutive: isConsecutive
            };
        },

        renderInputSlots() {
            if (!this.elements.inputSlots) return;
            
            this.elements.inputSlots.innerHTML = '';
            
            this.state.correctOrder.forEach((_, index) => {
                const slot = document.createElement('div');
                slot.className = 'input-slot';
                slot.dataset.index = index;
                this.EventManager.on(slot, 'click', this.handleInputSlotClick.bind(this), {}, 'gameUI');

                this.elements.inputSlots.appendChild(slot);
            });
        },

        generateLevelNumbers() {
            const gameConfig = NumberSortingConfig.getGameConfig(this.state.settings);
            
            if (this.state.settings.numberRange === 'custom') {
                this.generateCustomRangeNumbers();
            } else {
                this.generateStandardRangeNumbers();
            }
            
            // 根據模式決定是否打亂數字
            if (gameConfig.difficulty.shuffleNumbers || 
                (gameConfig.gameMode && gameConfig.gameMode.shuffleNumbers) ||
                gameConfig.difficulty.id === 'hard') {
                this.shuffleArray(this.state.currentNumbers);
                Game.Debug.logGameFlow(`${gameConfig.difficulty.label}：數字已隨機打亂`);
            }
        },

        generateCustomRangeNumbers() {
            const { startNumber, endNumber } = this.state.customRange;
            const numbersPerLevel = this.state.numbersPerLevel;
            
            // 使用新的順序分組邏輯
            const rangeConfig = { startNumber, endNumber };
            this.generateSequentialNumbers(rangeConfig, numbersPerLevel);
        },

        /**
         * 新的順序分組數字生成邏輯
         * 從数字範围的起始到結束，按照排序數量分組
         */
        generateSequentialNumbers(rangeConfig, numbersPerLevel) {
            const { startNumber, endNumber } = rangeConfig;
            const currentLevel = this.state.currentLevel;
            
            // 計算當前關卡的起始數字
            const groupStartNumber = startNumber + (currentLevel - 1) * numbersPerLevel;
            const groupEndNumber = Math.min(groupStartNumber + numbersPerLevel - 1, endNumber);
            
            // 生成當前組的數字
            const selectedNumbers = [];
            for (let i = groupStartNumber; i <= groupEndNumber; i++) {
                selectedNumbers.push(i);
            }
            
            this.state.currentNumbers = [...selectedNumbers];
            this.state.correctOrder = [...selectedNumbers];
            
            Game.Debug.logGameFlow(`第 ${currentLevel} 題生成順序數字組`, {
                numbers: selectedNumbers,
                range: `${groupStartNumber}-${groupEndNumber}`,
                totalRange: `${startNumber}-${endNumber}`,
                numbersPerLevel: numbersPerLevel
            });
        },

        generateCustomConsecutiveNumbers(startNumber, endNumber, numbersCount) {
            // 確保有足夠的連續數字空間
            const availableStart = startNumber;
            const availableEnd = endNumber - numbersCount + 1;
            
            if (availableEnd < availableStart) {
                // 如果範圍不夠，使用最小範圍
                const selectedNumbers = [];
                for (let i = 0; i < Math.min(numbersCount, endNumber - startNumber + 1); i++) {
                    selectedNumbers.push(startNumber + i);
                }
                this.state.currentNumbers = [...selectedNumbers];
                this.state.correctOrder = [...selectedNumbers];
            } else {
                // 隨機選擇起始點，生成連續數字
                const randomStart = Math.floor(Math.random() * (availableEnd - availableStart + 1)) + availableStart;
                const selectedNumbers = [];
                for (let i = 0; i < numbersCount; i++) {
                    selectedNumbers.push(randomStart + i);
                }
                this.state.currentNumbers = [...selectedNumbers];
                this.state.correctOrder = [...selectedNumbers];
            }
            
            Game.Debug.logGameFlow(`第 ${this.state.currentLevel} 題生成自訂連續數字`, {
                numbers: this.state.currentNumbers,
                range: `${startNumber}-${endNumber}`
            });
        },

        generateCustomNonConsecutiveNumbers(startNumber, endNumber, numbersCount) {
            // 從自訂範圍中隨機選取數字
            const availableNumbers = [];
            for (let i = startNumber; i <= endNumber; i++) {
                availableNumbers.push(i);
            }
            
            // 隨機選取指定數量的數字
            this.shuffleArray(availableNumbers);
            const selectedNumbers = availableNumbers.slice(0, Math.min(numbersCount, availableNumbers.length));
            
            // 排序作為正確答案
            selectedNumbers.sort((a, b) => a - b);
            
            this.state.currentNumbers = [...selectedNumbers];
            this.state.correctOrder = [...selectedNumbers];
            
            Game.Debug.logGameFlow(`第 ${this.state.currentLevel} 題生成自訂非連續數字`, {
                numbers: selectedNumbers,
                count: selectedNumbers.length,
                range: `${startNumber}-${endNumber}`
            });
        },

        generateStandardRangeNumbers() {
            const rangeConfig = NumberSortingConfig.getNumberRangeConfig(this.state.settings.numberRange);
            const numbersPerLevel = this.state.numbersPerLevel;
            
            // 新的順序分組邏輯：從起始到結束連續分組
            this.generateSequentialNumbers(rangeConfig, numbersPerLevel);
        },

        generateConsecutiveNumbers(rangeConfig) {
            const numbersCount = 10; // 固定10個數字
            
            // 確保有足夠的連續數字空間
            const availableStart = rangeConfig.startNumber;
            const availableEnd = rangeConfig.endNumber - numbersCount + 1;
            
            if (availableEnd < availableStart) {
                // 如果範圍不夠，使用最小範圍
                const startNumber = rangeConfig.startNumber;
                const selectedNumbers = [];
                for (let i = 0; i < numbersCount; i++) {
                    selectedNumbers.push(startNumber + i);
                }
                this.state.currentNumbers = [...selectedNumbers];
                this.state.correctOrder = [...selectedNumbers];
            } else {
                // 隨機選擇起始點，生成連續數字
                const startNumber = Math.floor(Math.random() * (availableEnd - availableStart + 1)) + availableStart;
                const selectedNumbers = [];
                for (let i = 0; i < numbersCount; i++) {
                    selectedNumbers.push(startNumber + i);
                }
                this.state.currentNumbers = [...selectedNumbers];
                this.state.correctOrder = [...selectedNumbers];
            }
            
            Game.Debug.logGameFlow(`第 ${this.state.currentLevel} 題生成連續數字`, {
                numbers: this.state.currentNumbers,
                range: `${this.state.currentNumbers[0]}-${this.state.currentNumbers[numbersCount-1]}`
            });
        },

        generateNonConsecutiveNumbers(rangeConfig) {
            const numbersCount = 10; // 固定10個數字
            
            // 從數字範圍中隨機選取不連續的數字
            const availableNumbers = [];
            for (let i = rangeConfig.startNumber; i <= rangeConfig.endNumber; i++) {
                availableNumbers.push(i);
            }
            
            // 隨機選取指定數量的數字
            this.shuffleArray(availableNumbers);
            const selectedNumbers = availableNumbers.slice(0, Math.min(numbersCount, availableNumbers.length));
            
            // 排序作為正確答案
            selectedNumbers.sort((a, b) => a - b);
            
            this.state.currentNumbers = [...selectedNumbers];
            this.state.correctOrder = [...selectedNumbers];
            
            Game.Debug.logGameFlow(`第 ${this.state.currentLevel} 題生成非連續數字`, {
                numbers: selectedNumbers,
                count: selectedNumbers.length
            });
        },

        shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        },

        renderNumbers() {
            if (!this.elements.numberContainer) return;
            
            this.elements.numberContainer.innerHTML = '';
            
            this.state.currentNumbers.forEach(number => {
                const numberElement = document.createElement('div');
                numberElement.className = 'number-box';
                numberElement.setAttribute('data-value', number);
                numberElement.setAttribute('draggable', 'true');
                numberElement.textContent = number;
                
                const checkMark = document.createElement('div');
                checkMark.className = 'check-mark';
                checkMark.textContent = '✓';
                numberElement.appendChild(checkMark);
                
                this.elements.numberContainer.appendChild(numberElement);
            });
            
            // 重新註冊觸控拖拽區域（因為新增了numbers）
            this.registerTouchDropZones();
        },

        renderSlots() {
            if (!this.elements.answerContainer) return;
            
            const gameConfig = NumberSortingConfig.getGameConfig(this.state.settings);
            const showHints = gameConfig.difficulty.showHints;
            
            this.elements.answerContainer.innerHTML = '';
            
            this.state.correctOrder.forEach((number, index) => {
                const slot = document.createElement('div');
                slot.className = 'slot';
                slot.setAttribute('data-position', index);
                
                if (showHints) {
                    const hint = document.createElement('span');
                    hint.className = 'slot-hint';
                    hint.textContent = number;
                    slot.appendChild(hint);
                }
                
                this.elements.answerContainer.appendChild(slot);
            });
            
            // 🔧 [修正] 在 slots 渲染完成後設置觸控拖拽系統
            this.setupTouchDrag();
        },

        // =====================================================
        // 🖱️ 拖放系統
        // =====================================================
        bindDragDropEvents() {
            if (!this.elements.app) return;

            // Traditional mouse drag events
            // 🔧 [Bug修復] 使用 EventManager 統一管理拖曳事件
            this.EventManager.on(this.elements.app, 'dragstart', this.handleDragStart.bind(this), {}, 'dragSystem');
            this.EventManager.on(this.elements.app, 'dragend', this.handleDragEnd.bind(this), {}, 'dragSystem');
            this.EventManager.on(this.elements.app, 'dragover', this.handleDragOver.bind(this), {}, 'dragSystem');
            this.EventManager.on(this.elements.app, 'dragenter', this.handleDragEnter.bind(this), {}, 'dragSystem');
            this.EventManager.on(this.elements.app, 'dragleave', this.handleDragLeave.bind(this), {}, 'dragSystem');
            this.EventManager.on(this.elements.app, 'drop', this.handleDrop.bind(this), {}, 'dragSystem');
            
            // Touch drag support will be setup when slots are rendered
        },

        setupTouchDrag() {
            Game.Debug.log('drag', '🎯 setupTouchDrag 被調用，當前 TouchDragUtility 狀態:', !!window.TouchDragUtility);
            Game.Debug.log('drag', '🎯 window 對象包含的屬性:', Object.keys(window).filter(key => key.includes('TouchDrag')));
            
            this.waitForTouchDragUtility(() => {
                this.setupTouchDragActual();
            });
        },

        waitForTouchDragUtility(callback, attempts = 0) {
            Game.Debug.log('init', `🎯 等待 TouchDragUtility，嘗試 ${attempts + 1}/5，狀態:`, !!window.TouchDragUtility);
            
            if (window.TouchDragUtility) {
                Game.Debug.log('drag', '🎯 TouchDragUtility 已可用，執行回調');
                callback();
            } else if (attempts < 5) {
                // 🔧 [Bug修復] 使用 TimerManager 統一管理
                this.TimerManager.setTimeout(() => {
                    this.waitForTouchDragUtility(callback, attempts + 1);
                }, 100, 'dragSystem');
            } else {
                Game.Debug.error('🎯 TouchDragUtility 仍然不可用，跳過觸控拖拽功能');
                Game.Debug.log('drag', '🎯 將使用傳統滑鼠拖拽功能');
            }
        },

        setupTouchDragActual() {
            
            Game.Debug.log('drag', '🎯 開始設置觸控拖拽功能...');
            Game.Debug.log('drag', '🎯 App元素:', this.elements.app);
            
            // Check if draggable elements exist
            const draggableElements = this.elements.app.querySelectorAll('.number-box:not(.correct)');
            Game.Debug.log('drag', '🎯 找到可拖拽元素:', draggableElements.length, draggableElements);
            
            // Add simple touch test to first element
            if (draggableElements.length > 0) {
                const testElement = draggableElements[0];
                Game.Debug.log('drag', '🎯 添加測試觸控事件到:', testElement);
                // 🔧 [Bug修復] 使用 EventManager 統一管理觸控事件
                this.EventManager.on(testElement, 'touchstart', (e) => {
                    Game.Debug.log('drag', '🎯 測試觸控開始事件觸發!', e);
                }, { passive: false }, 'dragSystem');
            }
            
            // Register draggable elements
            window.TouchDragUtility.registerDraggable(
                this.elements.app,
                '.number-box:not(.correct)',
                {
                    // 🔧 [修正1] 新增視覺回饋配置 - 確保拖拽時數字圖示跟著移動
                    createDragImage: true,
                    dragImageOffset: { x: 25, y: 25 },
                    
                    onDragStart: (element, event) => {
                        Game.Debug.log('drag', '🎯 觸控拖拽開始:', element, event);
                        
                        // Check if drag should be allowed
                        if (element.classList.contains('correct')) {
                            Game.Debug.log('drag', '🎯 元素已正確，阻止拖拽');
                            return false;
                        }
                        
                        this.state.draggedElement = element;
                        const number = element.dataset.value;
                        
                        Game.Debug.log('drag', '🎯 設置拖拽元素:', number);
                        Game.Debug.logDragDrop(`開始觸控拖拽數字: ${number}`);
                        
                        // 🔧 [修正2] 加強語音播放 - 確保語音系統已準備好
                        if (this.Speech && this.Speech.isReady && this.Speech.voice) {
                            this.Speech.speak(number);
                        } else {
                            Game.Debug.log('drag', '🎯 語音系統未就緒，跳過語音播放');
                        }
                        
                        // 🔧 [修正1] 添加視覺拖拽樣式
                        element.style.opacity = '0.8';
                        element.classList.add('dragging');
                        
                        return true;
                    },
                    onDrop: (draggedElement, dropZone, event) => {
                        // Ensure draggedElement is set
                        this.state.draggedElement = draggedElement;
                        
                        // Handle touch drop with proper zone detection
                        const slot = dropZone.closest('.slot');
                        const numberContainer = dropZone.closest('.number-container');
                        
                        // 新增：F4專用放置框檢測
                        const itemInfo = {
                            numberValue: draggedElement.dataset.value,
                            itemClass: draggedElement.className,
                            dropZoneClass: dropZone.className,
                            slotPosition: slot?.dataset.position,
                            isNumberContainer: !!numberContainer
                        };
                        
                        Game.Debug.logDragDrop(`觸控放置檢測: slot=${!!slot}, numberContainer=${!!numberContainer}, dropZone=${dropZone.className}`);
                        
                        if (slot && this.state.draggedElement) {
                            const draggedNumber = parseInt(this.state.draggedElement.dataset.value);
                            const position = parseInt(slot.dataset.position);
                            const correctNumber = this.state.correctOrder[position];
                            const isCorrect = draggedNumber === correctNumber;
                            
                            Game.Debug.logDragDrop(`觸控放置到slot: position=${position}, number=${draggedNumber}, correct=${correctNumber}, isCorrect=${isCorrect}`);
                            Game.Debug.logPlacementDrop('手機端：數字放入排序槽', 'sorting-slot', itemInfo);
                            Game.Debug.log('touch', `📱 手機拖放: 數字${draggedNumber}到位置${position}, 正確=${isCorrect}`);
                            
                            this.handleSlotDrop(slot);
                        } else if (numberContainer && this.state.draggedElement) {
                            Game.Debug.logDragDrop(`觸控放置到數字容器`);
                            Game.Debug.logPlacementDrop('手機端：數字返回數字容器', 'number-container', itemInfo);
                            this.handleNumberContainerDrop();
                        } else {
                            Game.Debug.logDragDrop(`觸控放置失敗: 找不到有效的放置目標`);
                            Game.Debug.logPlacementDrop('手機端：數字放入無效區域', 'invalid-drop', itemInfo);
                        }
                    },
                    onDragEnd: (element, event) => {
                        // Reset dragged element state
                        if (this.state.draggedElement) {
                            this.state.draggedElement = null;
                        }
                        
                        // 🔧 [修正1] 恢復視覺樣式
                        element.style.opacity = '1';
                        element.classList.remove('dragging');
                        
                        // 清除所有拖拽樣式
                        document.querySelectorAll('.slot.drag-over').forEach(slot => {
                            slot.classList.remove('drag-over');
                        });
                    }
                }
            );
            
            // Register drop zones
            this.registerTouchDropZones();
        },

        registerTouchDropZones() {
            this.waitForTouchDragUtility(() => {
                this.registerTouchDropZonesActual();
            });
        },

        registerTouchDropZonesActual() {
            
            Game.Debug.log('drag', '🎯 開始註冊觸控放置區域...');
            
            // Register slots as drop zones
            const slots = this.elements.app.querySelectorAll('.slot');
            Game.Debug.log('drag', '🎯 找到slots:', slots.length, slots);
            Game.Debug.logDragDrop(`註冊觸控放置區域: 找到 ${slots.length} 個 slots`);
            
            slots.forEach((slot, index) => {
                window.TouchDragUtility.registerDropZone(slot, (draggedElement, dropZone) => {
                    // 🔧 [修正] 允許替換操作 - 普通困難模式支援拖曳替換
                    const difficulty = this.state?.settings?.difficulty || 'easy';
                    
                    if (difficulty === 'easy') {
                        // 簡單模式：只能放置到沒有正確數字的slot
                        const hasCorrectNumber = dropZone.querySelector('.number-box.correct');
                        Game.Debug.logDragDrop(`簡單模式檢查slot ${index}: hasCorrectNumber=${!!hasCorrectNumber}`);
                        return !hasCorrectNumber;
                    } else {
                        // 普通/困難模式：允許替換，包括已有數字的slot
                        Game.Debug.logDragDrop(`${difficulty}模式允許替換 - slot ${index} 可放置`);
                        return true;
                    }
                });
            });
            
            // Register number container as drop zone
            const numberContainer = this.elements.app.querySelector('.number-container');
            if (numberContainer) {
                Game.Debug.logDragDrop('註冊數字容器為放置區域');
                window.TouchDragUtility.registerDropZone(numberContainer, () => true);
            } else {
                Game.Debug.logDragDrop('找不到數字容器');
            }
        },

        handleDragStart(event) {
            // 🔧 [Bug修復] 使用 closest() 而非 classList.contains()，確保從子元素（如 check-mark）
            // 拖曳時也能正確識別到 number-box，避免因點擊子元素導致拖曳失效
            const numberBox = event.target.closest('.number-box');
            if (!numberBox || numberBox.classList.contains('correct')) {
                event.preventDefault();
                return;
            }

            this.state.draggedElement = numberBox;
            const number = numberBox.dataset.value;

            Game.Debug.logDragDrop(`開始拖拽數字: ${number}`);

            // 播放數字語音
            this.Speech.speak(number);

            event.dataTransfer.setData('text/plain', number);
            event.dataTransfer.effectAllowed = 'move';

            // 🔧 [Bug修復] 使用 TimerManager 統一管理
            this.TimerManager.setTimeout(() => {
                numberBox.style.opacity = '0.5';
            }, 0, 'animation');
        },

        handleDragEnd(event) {
            if (this.state.draggedElement) {
                this.state.draggedElement.style.opacity = '1';
                this.state.draggedElement = null;
            }
            
            // 清除所有拖拽樣式
            document.querySelectorAll('.slot.drag-over').forEach(slot => {
                slot.classList.remove('drag-over');
            });
        },

        handleDragOver(event) {
            event.preventDefault();
        },

        handleDragEnter(event) {
            event.preventDefault();
            const slot = event.target.closest('.slot');
            if (slot) {
                const difficulty = this.state?.settings?.difficulty || 'easy';
                
                if (difficulty === 'easy') {
                    // 簡單模式：只有沒有正確數字的slot才顯示懸停效果
                    if (!slot.querySelector('.number-box.correct')) {
                        slot.classList.add('drag-over');
                    }
                } else {
                    // 普通/困難模式：所有slot都可以顯示懸停效果（支援替換）
                    slot.classList.add('drag-over');
                }
            }
        },

        handleDragLeave(event) {
            const slot = event.target.closest('.slot');
            if (slot) {
                slot.classList.remove('drag-over');
            }
        },

        handleDrop(event) {
            event.preventDefault();
            const slot = event.target.closest('.slot');
            const numberContainer = event.target.closest('.number-container');
            
            if (slot && this.state.draggedElement) {
                this.handleSlotDrop(slot);
            } else if (numberContainer && this.state.draggedElement) {
                this.handleNumberContainerDrop();
            }
        },

        handleSlotDrop(slot) {
            const position = parseInt(slot.dataset.position);
            const draggedNumber = parseInt(this.state.draggedElement.dataset.value);
            
            Game.Debug.logDragDrop(`放置數字 ${draggedNumber} 到位置 ${position}`);
            
            // 移除現有數字
            const existingBox = slot.querySelector('.number-box');
            if (existingBox && existingBox !== this.state.draggedElement) {
                this.elements.numberContainer.appendChild(existingBox);
                existingBox.classList.remove('correct', 'incorrect');
            }
            
            // 放入新數字
            slot.appendChild(this.state.draggedElement);
            this.state.draggedElement.classList.remove('correct', 'incorrect');
            
            // 處理答案檢查
            this.processAnswer(slot, position, draggedNumber);
        },

        handleNumberContainerDrop() {
            if (this.state.draggedElement.parentNode !== this.elements.numberContainer) {
                this.elements.numberContainer.appendChild(this.state.draggedElement);
                this.state.draggedElement.classList.remove('correct', 'incorrect');
            }
        },

        processAnswer(slot, position, number) {
            const gameConfig = NumberSortingConfig.getGameConfig(this.state.settings);
            const correctNumber = this.state.correctOrder[position];
            const isCorrect = number === correctNumber;
            
            Game.Debug.log('game', `🎯 processAnswer: position=${position}, number=${number}, correct=${correctNumber}, isCorrect=${isCorrect}`);
            Game.Debug.log('game', `🎯 instantFeedback=${gameConfig.difficulty.instantFeedback}, difficulty=${gameConfig.difficulty.id}`);
            
            if (gameConfig.difficulty.instantFeedback) {
                // 簡單模式：立即反饋
                Game.Debug.log('game', `🎯 調用 handleInstantFeedback，isCorrect=${isCorrect}`);
                this.handleInstantFeedback(slot, isCorrect);
            } else {
                // 普通/困難模式：等待確認
                Game.Debug.log('game', `🎯 非簡單模式，調用 checkAllSlotsFilled`);
                this.checkAllSlotsFilled();
            }
        },

        handleInstantFeedback(slot, isCorrect) {
            const numberBox = slot.querySelector('.number-box');
            if (!numberBox) return;
            
            if (isCorrect) {
                numberBox.classList.add('correct');
                numberBox.draggable = false;
                
                // 隱藏提示
                const hint = slot.querySelector('.slot-hint');
                if (hint) hint.style.display = 'none';
                
                // 不在這裡計分，等整題完成時再計分
            } else {
                numberBox.classList.add('incorrect');
                Game.Debug.logAudio('觸發錯誤音效 - 答案不正確');
                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                this.playSound('incorrect');
                Game.Debug.log('audio', '🔊 播放錯誤音效: incorrect');
                
                // 🎯 簡單模式：錯誤數字自動返回
                const gameConfig = NumberSortingConfig.getGameConfig(this.state.settings);
                if (gameConfig.difficulty.id === 'easy') {
                    this.autoReturnIncorrectNumber(numberBox, slot);
                }
            }
            
            this.checkLevelCompletion();
        },

        // 🎯 自動返回錯誤數字（簡單模式專用）
        autoReturnIncorrectNumber(numberBox, slot) {
            Game.Debug.log('drag', '🎯 自動返回錯誤數字開始');

            // 新增搖擺動畫效果
            numberBox.classList.add('shake-animation');

            // 延遲後移除搖擺效果並返回數字容器
            // 🔧 [Bug修復] 使用 TimerManager 統一管理
            this.TimerManager.setTimeout(() => {
                // 移除搖擺動畫
                numberBox.classList.remove('shake-animation');

                // 移除錯誤標記
                numberBox.classList.remove('incorrect');

                // 恢復拖拽功能
                numberBox.draggable = true;

                // 返回到數字容器
                if (this.elements.numberContainer && numberBox.parentNode !== this.elements.numberContainer) {
                    this.elements.numberContainer.appendChild(numberBox);
                    Game.Debug.log('drag', '🎯 錯誤數字已返回數字容器');
                }
                // 🔧 [Bug修復] 觸控拖曳由 setupTouchDragActual() 的 `.number-box:not(.correct)` 選擇器統一覆蓋，
                // 無需在此重新呼叫 registerDraggable（重複呼叫會覆蓋原有選擇器，導致所有圖示無法再拖曳）

            }, 800, 'animation'); // 搖擺動畫持續時間
        },

        checkAllSlotsFilled() {
            const allSlots = this.elements.answerContainer.querySelectorAll('.slot');
            const allFilled = Array.from(allSlots).every(slot => slot.querySelector('.number-box'));
            
            if (allFilled) {
                this.showConfirmButton();
            }
        },

        showConfirmButton() {
            Game.Debug.logGameFlow('顯示確認按鈕');
            this.elements.confirmContainer.innerHTML = NumberSortingTemplates.confirmButton();
            
            const confirmBtn = document.getElementById('confirm-btn');
            if (confirmBtn) {
                // 🔧 [Bug修復] 使用 EventManager 統一管理
                this.EventManager.on(confirmBtn, 'click', this.confirmAnswers.bind(this), {}, 'gameUI');
            }
        },

        confirmAnswers() {
            Game.Debug.logGameFlow('確認答案');
            this.elements.confirmContainer.innerHTML = '';
            
            let allCorrect = true;
            const incorrectBoxes = [];
            
            const slots = this.elements.answerContainer.querySelectorAll('.slot');
            slots.forEach((slot, index) => {
                const numberBox = slot.querySelector('.number-box');
                if (!numberBox) return;
                
                const number = parseInt(numberBox.dataset.value);
                const correctNumber = this.state.correctOrder[index];
                const isCorrect = number === correctNumber;
                
                numberBox.classList.remove('correct', 'incorrect');
                
                if (isCorrect) {
                    numberBox.classList.add('correct');
                    // 不在這裡計分，等所有答案確認後在handleCorrectAnswer中計分
                } else {
                    numberBox.classList.add('incorrect');
                    incorrectBoxes.push(numberBox);
                    allCorrect = false;
                }
            });
            
            if (allCorrect) {
                this.handleCorrectAnswer();
            } else {
                this.handleIncorrectAnswer(incorrectBoxes);
            }
        },

        handleCorrectAnswer() {
            Game.Debug.logGameFlow('答案全部正確');
            
            // 先播放 correct02.mp3 音效
            this.playSound('correct02');
            
            // 啟動煙火動畫
            this.startFireworksAnimation();
            
            this.showMessage('太棒了，你答對了！', 'success');
            
            // 答對一題給10分
            this.updateScore(10);
            
            // 重置檢查狀態
            this.state.isChecking = false;
            
            // 延遲播放語音，讓音效和煙火先展現
            // 🔧 [Bug修復] 使用 TimerManager 統一管理
            this.TimerManager.setTimeout(() => {
                // 判斷是否為最後一題
                const isLastLevel = this.state.currentLevel >= this.state.totalLevels;
                const templateKey = isLastLevel ? 'correctLast' : 'correct';

                // 播放語音，語音播放完成後才進入下一題
                this.Speech.speakTemplate(templateKey, () => {
                    Game.Debug.logGameFlow('正確答案語音播放完成，準備進入下一題');

                    this.TimerManager.setTimeout(() => {
                        if (this.state.currentLevel < this.state.totalLevels) {
                            this.nextLevel();
                        } else {
                            this.completeGame();
                        }
                    }, 500, 'turnTransition'); // 語音後稍微延遲
                });
            }, 800, 'turnTransition'); // 讓音效和煙火先播放800ms
        },

        handleIncorrectAnswer(incorrectBoxes) {
            Game.Debug.logGameFlow(`答案有錯誤，錯誤數量: ${incorrectBoxes.length}`);
            this.playSound('incorrect');

            const gameConfig = NumberSortingConfig.getGameConfig(this.state.settings);
            const testMode = this.state.settings.testMode;

            // 根據測驗模式決定行為
            if (testMode === 'single' && (gameConfig.difficulty.id === 'normal' || gameConfig.difficulty.id === 'hard')) {
                // 🔧 檢查是否是最後一題
                const isLastLevel = this.state.currentLevel >= this.state.totalLevels;

                if (isLastLevel) {
                    // 最後一題錯誤
                    this.showMessage('對不起有錯誤，測驗結束。', 'error');
                    // 🔧 [Bug修復] 使用 TimerManager 統一管理
                    this.TimerManager.setTimeout(() => {
                        this.Speech.speakTemplate('incorrectSingleLast', () => {
                            Game.Debug.logGameFlow('最後一題錯誤語音播放完成，結束測驗');
                            this.TimerManager.setTimeout(() => {
                                this.completeGame();
                            }, 500, 'turnTransition');
                        });
                    }, 300, 'turnTransition');
                } else {
                    // 非最後一題錯誤
                    this.showMessage('對不起有錯誤，進入下一題。', 'error');
                    // 🔧 [Bug修復] 使用 TimerManager 統一管理
                    this.TimerManager.setTimeout(() => {
                        this.Speech.speakTemplate('incorrectSingle', () => {
                            Game.Debug.logGameFlow('單次作答模式錯誤語音播放完成，進入下一題');
                            this.TimerManager.setTimeout(() => {
                                this.nextLevel();
                            }, 500, 'turnTransition');
                        });
                    }, 300, 'turnTransition');
                }
            } else {
                // 反複練習模式：先播放錯誤音效，延遲後播放語音
                this.showMessage('對不起，有錯誤喔，請再試一次。', 'error');
                // 🔧 [Bug修復] 使用 TimerManager 統一管理
                this.TimerManager.setTimeout(() => {
                    this.Speech.speakTemplate('incorrect', () => {
                        Game.Debug.logGameFlow('錯誤答案語音播放完成，恢復錯誤數字');

                        this.TimerManager.setTimeout(() => {
                            incorrectBoxes.forEach(box => {
                                box.classList.remove('incorrect');
                                this.elements.numberContainer.appendChild(box);
                            });

                            this.showMessage('');
                            this.checkAllSlotsFilled();
                        }, 300, 'animation');
                    });
                }, 300, 'turnTransition');
            }
        },

        // =====================================================
        // 🎮 遊戲控制
        // =====================================================
        nextLevel() {
            this.state.currentLevel++;
            Game.Debug.logGameFlow(`進入第 ${this.state.currentLevel} 關`);
            
            this.updateGameInfo();
            this.startLevel();
        },

        completeGame() {
            Game.Debug.logGameFlow('遊戲完成');

            // 🎵 播放成功音效
            this.playSound('success');

            // 播放完成語音
            this.Speech.speakTemplate('complete', () => {
                Game.Debug.logGameFlow('遊戲完成語音播放完成');
            });

            this.showResults('恭喜完成所有題目！', '🏆');
        },

        updateGameInfo() {
            if (this.elements.gameTitle) {
                this.elements.gameTitle.textContent = this.getLevelTitle();
            }
            if (this.elements.progressInfo) {
                // 🔧 修正：添加「第」和「題」
                this.elements.progressInfo.textContent = `第 ${this.state.currentLevel} / ${this.state.totalLevels} 題`;
            }
            if (this.elements.scoreInfo) {
                this.elements.scoreInfo.textContent = this.state.score;
            }
        },

        updateScore(points) {
            this.state.score += points;
            this.updateGameInfo();
        },

        showMessage(text, type = 'info') {
            if (!this.elements.messageArea) return;
            
            this.elements.messageArea.textContent = text;
            this.elements.messageArea.className = `message-area ${type}`;
            
            if (text) {
                this.elements.messageArea.style.display = 'block';
            } else {
                this.elements.messageArea.style.display = 'none';
            }
        },

        // =====================================================
        // 🎤 語音播放模態框系統
        // =====================================================
        showVoicePlaybackModal(instructionData) {
            Game.Debug.logGameFlow('顯示語音播放模態框', instructionData);
            
            // 創建模態框HTML
            const modalHTML = NumberSortingTemplates.numberSequenceModal(
                instructionData.numbersToRead, 
                instructionData.text
            );
            
            // 添加到頁面
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // 顯示模態框
            const modal = document.getElementById('voice-playback-modal');
            if (modal) {
                // 為關閉按鈕綁定事件
                const closeBtn = document.getElementById('close-modal-btn');
                if (closeBtn) {
                    // 🔧 [Bug修復] 使用 EventManager 統一管理
                    this.EventManager.on(closeBtn, 'click', () => {
                        Game.Debug.logUserAction('點擊關閉提示視窗按鈕');
                        this.closeVoicePlaybackModal();
                    }, {}, 'gameUI');
                }
                
                // 添加顯示類別以觸發動畫
                requestAnimationFrame(() => {
                    modal.classList.add('show');
                });
                
                // 開始語音播放和動畫
                this.startVoicePlayback(instructionData.numbersToRead, instructionData.speech);
            }
        },

        /**
         * [已修改-完整指令版] 開始語音播放和同步動畫 (使用 async/await)
         */
        async startVoicePlayback(numbersToRead, speechText) {
            const numbersArray = numbersToRead.split('，');
            const progressBar = document.getElementById('voice-progress-bar');
            const numbersContainer = document.getElementById('voice-numbers-container');
            const modal = document.getElementById('voice-playback-modal');

            if (!progressBar || !numbersContainer || !modal) {
                Game.Debug.logGameFlow('語音播放模態框缺少必要元素，提前終止');
                return;
            }

            const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

            // 🎯 修改：先播放完整指令語音（不分割）
            Game.Debug.log('drag', '🎯 開始播放完整指令語音:', speechText);
            await this.Speech.speakAndWait(speechText);
            
            // 短暫停頓，準備播放數字序列
            await sleep(300);
            
            // 🎯 數字序列播放提示
            Game.Debug.log('drag', '🎯 完整指令播放完成，開始播放數字序列:', numbersToRead);

            for (let i = 0; i < numbersArray.length; i++) {
                if (!document.body.contains(modal)) {
                    Game.Debug.logGameFlow('偵測到模態框已關閉，中斷語音播放序列');
                    return;
                }

                const number = numbersArray[i];

                const prevItem = numbersContainer.querySelector('.number-item.highlighting');
                if (prevItem) {
                    prevItem.classList.remove('highlighting');
                }

                const currentItem = numbersContainer.querySelector(`[data-index="${i}"]`);
                if (currentItem) {
                    currentItem.classList.add('highlighting');
                }

                const progress = ((i + 1) / numbersArray.length) * 100;
                progressBar.style.width = `${progress}%`;
                progressBar.style.transition = 'width 0.1s linear'; // 加快進度條動畫

                // 唸出數字並「等待」它唸完
                await this.Speech.speakAndWait(number);
                
                // [修改] 大幅縮短數字間的停頓，製造連續播放的效果
                await sleep(50);
            }

            Game.Debug.logGameFlow('語音與動畫序列播放完成，準備關閉模態框');
            await sleep(500); // [修改] 縮短結束前的延遲

            if (document.body.contains(modal)) {
                this.closeVoicePlaybackModal();
            }
        },

        closeVoicePlaybackModal() {
            // 停止任何正在播放的語音
            if (this.Speech && this.Speech.synth) {
                this.Speech.synth.cancel();
                Game.Debug.logAudio('關閉提示視窗，語音已停止');
            }

            const modal = document.getElementById('voice-playback-modal');
            if (modal) {
                // 防止重複觸發關閉
                if (modal.isClosing) return;
                modal.isClosing = true;
                
                // 添加退出動畫
                modal.style.animation = 'modalFadeOut 0.3s ease-in-out forwards';
                
                // 動畫完成後移除元素
                // 🔧 [Bug修復] 使用 TimerManager 統一管理
                Game.TimerManager.setTimeout(() => {
                    modal.remove();
                    Game.Debug.logGameFlow('語音播放模態框已關閉');
                }, 300, 'animation');
            }
        },

        // =====================================================
        // 🎙️ 語音系統
        // =====================================================
        Speech: {
            synth: window.speechSynthesis,
            voice: null,
            isReady: false,
            
            init() {
                Game.Debug.logAudio('初始化語音系統');
                
                let voiceInitAttempts = 0;
                const maxAttempts = 10;
                
                const loadVoices = () => {
                    const voices = this.synth.getVoices();
                    Game.Debug.logAudio('取得語音列表', { count: voices.length });
                    voiceInitAttempts++;
                    
                    // 🔧 [修正2] 語音系統優化 - 增加重試機制和更好的fallback
                    if (voices.length === 0) {
                        if (voiceInitAttempts < maxAttempts) {
                            Game.Debug.logAudio('語音未就緒，等待中...', { attempt: voiceInitAttempts });
                            // 🔧 [Bug修復] 使用 TimerManager 統一管理
                            Game.TimerManager.setTimeout(loadVoices, 300, 'speech'); // 縮短等待時間
                            return;
                        } else {
                            Game.Debug.logAudio('手機端無語音，啟用靜音模式', 'fallback', 'system');
                            this.voice = null;
                            this.isReady = true;
                            return;
                        }
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
                        Game.Debug.logAudio('語音準備就緒', { 
                            name: this.voice.name, 
                            lang: this.voice.lang 
                        });
                        this.isReady = true;
                    } else {
                        Game.Debug.logAudio('未找到中文語音，啟用靜音模式', 'fallback');
                        this.voice = null;
                        this.isReady = true;
                    }
                };
                
                // 語音載入可能需要時間
                if (this.synth.getVoices().length === 0) {
                    this.synth.addEventListener('voiceschanged', loadVoices);
                } else {
                    loadVoices();
                }
            },
            
            speak(text, callback) {
                Game.Debug.logAudio('開始播放語音', { text });
                
                // 檢查音效設定
                const soundConfig = NumberSortingConfig.getSoundConfig(Game.state.settings.sound);
                if (!soundConfig.enabled) {
                    Game.Debug.logAudio('語音被設定關閉', { text });
                    if (callback) callback();
                    return;
                }
                
                // 🔧 [修正2] 語音播放檢查優化 - 提供更詳細的診斷訊息
                if (!this.isReady) {
                    Game.Debug.logAudio('語音系統未初始化完成，跳過播放', { text, isReady: this.isReady });
                    if (callback) callback();
                    return;
                }
                
                if (!this.voice) {
                    Game.Debug.logAudio('靜音模式或語音未就緒，跳過播放', { 
                        text, 
                        isReady: this.isReady, 
                        hasVoice: !!this.voice 
                    });
                    if (callback) callback();
                    return;
                }
                
                // 停止所有正在播放的語音
                if (this.synth.speaking) {
                    this.synth.cancel();
                }
                
                if (!text) {
                    if (callback) callback();
                    return;
                }

                // 🔧 如果文字是純數字，使用共用模組轉換為中文數字
                let speechText = text;
                if (typeof NumberSpeechUtils !== 'undefined' && !isNaN(text) && text.toString().trim() !== '') {
                    speechText = NumberSpeechUtils.convertToPureNumberSpeech(parseInt(text));
                }

                let callbackExecuted = false;
                const safeCallback = () => {
                    if (callback && !callbackExecuted) {
                        callbackExecuted = true;
                        callback();
                    }
                };

                try {
                    const utterance = new SpeechSynthesisUtterance(speechText);

                    if (this.voice) {
                        utterance.voice = this.voice;
                        utterance.lang = this.voice.lang;
                    }

                    // 標準語速（與F1統一）
                    utterance.rate = 1.0;

                    utterance.onend = () => {
                        Game.Debug.logAudio('語音播放完成', { text });
                        safeCallback();
                    };

                    utterance.onerror = (error) => {
                        Game.Debug.logAudio('語音播放錯誤，但保持語音功能可用', error);
                        // 🔧 [修正] 不要因為一次錯誤就禁用語音，保持語音功能可用
                        // this.voice = null; // 註解掉這行，避免永久禁用語音
                        safeCallback();
                    };

                    // 10 秒安全逾時，防止語音卡住時阻塞流程
                    Game.TimerManager.setTimeout(safeCallback, 10000, 'speech');
                    this.synth.speak(utterance);
                } catch (error) {
                    Game.Debug.logAudio('語音播放異常，但保持語音功能可用', error);
                    // 🔧 [修正] 不要因為異常就永久禁用語音
                    // this.voice = null; // 註解掉這行，避免永久禁用語音
                    safeCallback();
                }
            },

            /**
             * [新增] Promise 版本的語音播放，用於 async/await
             * @param {string} text - 要播放的文字
             * @returns {Promise<void>}
             */
            speakAndWait(text) {
                return new Promise((resolve) => {
                    this.speak(text, resolve); // speak 方法本身的回調會 resolve 這個 Promise
                });
            },

            // 配置驅動的語音播放方法
            speakTemplate(templateKey, callback) {
                const gameConfig = NumberSortingConfig.getGameConfig(Game.state.settings);
                const difficulty = gameConfig.difficulty;
                
                Game.Debug.logAudio('播放語音模板', { 
                    templateKey, 
                    difficulty: difficulty.id,
                    speechFeedback: difficulty.speechFeedback 
                });
                
                // 檢查是否啟用語音反饋
                if (!difficulty.speechFeedback) {
                    Game.Debug.logAudio('語音反饋被關閉', { templateKey });
                    if (callback) callback();
                    return;
                }
                
                // 獲取語音模板
                const speechTemplate = difficulty.speechTemplates && difficulty.speechTemplates[templateKey];
                if (!speechTemplate) {
                    Game.Debug.logAudio(`找不到語音模板: ${templateKey}`, { difficulty: difficulty.id });
                    if (callback) callback();
                    return;
                }
                
                // 播放語音
                this.speak(speechTemplate, callback);
            }
        },

        // =====================================================
        // 🎵 音效系統
        // =====================================================
        playSound(soundType) {
            const soundConfig = NumberSortingConfig.getSoundConfig(this.state.settings.sound);
            if (!soundConfig.enabled) return;
            
            const soundFile = soundConfig.sounds[soundType];
            if (!soundFile) return;
            
            Game.Debug.logAudio(`播放音效: ${soundType}`);
            
            try {
                const audio = new Audio(soundFile);
                audio.play().catch(error => {
                    Game.Debug.logAudio(`音效播放失敗: ${soundType}`, error);
                });
            } catch (error) {
                Game.Debug.logAudio(`音效系統錯誤: ${soundType}`, error);
            }
        },

        // 播放選擇音效（設定頁面專用）
        playSelectSound() {
            Game.Debug.logAudio('播放選擇音效');
            
            try {
                const audio = document.getElementById('menu-select-sound');
                if (audio) {
                    audio.currentTime = 0;
                    audio.play().catch(error => {
                        Game.Debug.logAudio('選擇音效播放失敗', error);
                    });
                }
            } catch (error) {
                Game.Debug.logAudio('選擇音效系統錯誤', error);
            }
        },

        // 播放點擊音效（按鈕專用）
        playClickSound() {
            Game.Debug.logAudio('播放點擊音效');
            
            try {
                const audio = document.getElementById('click-sound');
                if (audio) {
                    audio.currentTime = 0;
                    audio.play().catch(error => {
                        Game.Debug.logAudio('點擊音效播放失敗', error);
                    });
                }
            } catch (error) {
                Game.Debug.logAudio('點擊音效系統錯誤', error);
            }
        },

        // =====================================================
        // 🎆 煙火動畫系統（簡化版）
        // =====================================================
        startFireworksAnimation() {
            Game.Debug.log('game', '🎆 開始簡化版煙火動畫');
            
            // 🎆 使用canvas-confetti效果
            if (window.confetti) {
                Game.Debug.log('game', '🎆 觸發canvas-confetti慶祝效果');
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                
                // 延遲一點時間再觸發第二波
                // 🔧 [Bug修復] 使用 TimerManager 統一管理
                this.TimerManager.setTimeout(() => {
                    confetti({
                        particleCount: 100,
                        spread: 60,
                        origin: { y: 0.7 }
                    });
                }, 200, 'animation');
            } else {
                Game.Debug.warn('game', '❌ canvas-confetti 未載入');
            }
        },

        // =====================================================
        // 🏁 遊戲結束
        // =====================================================
        showResults(message, trophy) {
            if (this.state.isEndingGame) { Game.Debug.logGameFlow('⚠️ [F4] showResults 已執行過，忽略重複呼叫'); return; }
            this.state.isEndingGame = true;
            AssistClick.deactivate();

            // 🔧 修正：每題10分，所以答對題數 = 分數 / 10
            const correctAnswers = this.state.score / 10;
            const totalQuestions = this.state.totalLevels;
            const percentage = Math.round((correctAnswers / totalQuestions) * 100);

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'f4', unitName: 'F4 數字排序', series: 'F',
                score: correctAnswers, total: totalQuestions, difficulty: this.state.settings?.difficulty,
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

            const config = {
                correctAnswers,
                totalQuestions,
                percentage,
                timeDisplay,
                performanceMessage,
                performanceIcon
            };

            this.elements.app.innerHTML = NumberSortingTemplates.resultsScreen(config);

            // 🔧 [修正] 完成畫面滾動修正（A 系列標準作法）
            this.elements.app.style.overflowY = 'auto';
            this.elements.app.style.height = '100%';

            // 🎁 獎勵系統連結事件監聯器
            const rewardLink = document.getElementById('complete-reward-link');
            if (rewardLink) {
                // 🔧 [Bug修復] 使用 EventManager 統一管理
                this.EventManager.on(rewardLink, 'click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
                }, {}, 'gameUI');
            }

            // 🎆 播放煙火效果
            this.startFireworksAnimation();
        },

        calculateTimeUsed() {
            if (!this.state.startTime) return '未知';
            
            const totalTime = Math.floor((Date.now() - this.state.startTime) / 1000);
            const minutes = Math.floor(totalTime / 60);
            const seconds = totalTime % 60;
            
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        },

        // =====================================================
        // 🎮 遊戲控制方法
        // =====================================================
        resetGame() {
            Game.Debug.logGameFlow('重置遊戲');
            this.playSound('click');
            
            // 清除計時器
            this.TimerManager.clearByCategory('timer');
            this.state.timerInterval = null;
            
            this.startGame();
        },

        // =====================================================
        // ⏰ 計時器系統
        // =====================================================
        startTimer() {
            this.TimerManager.clearByCategory('timer');
            this.state.timerInterval = null;
            
            const tick = () => {
                this.state.timeRemaining--;
                
                if (this.state.timeRemaining <= 0) {
                    this.state.timerInterval = null;
                    this.handleTimeUp();
                } else {
                    this.updateTimerDisplay();
                    this.state.timerInterval = this.TimerManager.setTimeout(tick, 1000, 'timer');
                }
            };
            this.state.timerInterval = this.TimerManager.setTimeout(tick, 1000, 'timer');
        },

        updateTimerDisplay() {
            if (this.elements.timerInfo) {
                this.elements.timerInfo.textContent = this.getTimeDisplay();
                
                const gameConfig = NumberSortingConfig.getGameConfig(this.state.settings);
                const warningTime = gameConfig.timeLimit.warningTime || 30;
                
                if (this.state.timeRemaining <= warningTime) {
                    this.elements.timerInfo.classList.add('warning');
                } else {
                    this.elements.timerInfo.classList.remove('warning');
                }
            }
        },

        handleTimeUp() {
            this.TimerManager.clearByCategory('timer');
            this.state.timerInterval = null;
            this.showResults('時間到！', '⏰');
        },

        // =====================================================
        // 🎯 關卡完成檢查
        // =====================================================
        checkLevelCompletion() {
            if (this.state.isChecking) return;
            
            const correctBoxes = this.elements.answerContainer.querySelectorAll('.number-box.correct');
            if (correctBoxes.length === this.state.correctOrder.length) {
                this.state.isChecking = true;
                
                // 簡單模式需要特別處理：播放整題完成語音後再進入下一題
                const gameConfig = NumberSortingConfig.getGameConfig(this.state.settings);
                if (gameConfig.difficulty.instantFeedback) {
                    this.handleEasyModeCompletion();
                } else {
                    this.handleCorrectAnswer();
                }
            }
        },

        handleEasyModeCompletion() {
            Game.Debug.logGameFlow('簡單模式：整題完成');
            
            // 先播放 correct02.mp3 音效
            this.playSound('correct02');
            
            // 啟動煙火動畫
            this.startFireworksAnimation();
            
            // 顯示訊息
            this.showMessage('太棒了，你答對了！', 'success');
            
            // 答對一題給10分
            this.updateScore(10);
            
            // 重置檢查狀態
            this.state.isChecking = false;
            
            // 延遲播放語音，讓音效和煙火先展現
            // 🔧 [Bug修復] 使用 TimerManager 統一管理
            this.TimerManager.setTimeout(() => {
                // 判斷是否為最後一題
                const isLastLevel = this.state.currentLevel >= this.state.totalLevels;
                const templateKey = isLastLevel ? 'levelCompleteLast' : 'levelComplete';

                // 播放整題完成語音，語音播放完成後才進入下一題
                this.Speech.speakTemplate(templateKey, () => {
                    Game.Debug.logGameFlow('簡單模式：整題完成語音播放完畢');

                    this.TimerManager.setTimeout(() => {
                        if (this.state.currentLevel < this.state.totalLevels) {
                            this.nextLevel();
                        } else {
                            this.completeGame();
                        }
                    }, 500, 'turnTransition');
                });
            }, 800, 'turnTransition'); // 讓音效和煙火先播放800ms
        }
    };

    // 全域函數供 HTML 調用
    window.Game = Game;

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
            // F4 easy: find the next empty slot and place the correct number via internal state
            const slots = Array.from(document.querySelectorAll('.slot'));
            if (!slots.length) return;
            // Find first slot that doesn't have a correctly-placed number-box
            const nextSlot = slots.find(s => !s.querySelector('.number-box'));
            if (!nextSlot) {
                // All slots filled — look for a confirm/next button
                const confirmBtn = document.getElementById('confirm-btn') || document.getElementById('submit-answer-btn');
                if (confirmBtn && !confirmBtn.disabled) {
                    this._queue = [{ target: confirmBtn, action: () => confirmBtn.click() }];
                    this._step = 0;
                    this._highlight(confirmBtn);
                }
                return;
            }
            const position = parseInt(nextSlot.dataset.position);
            const correctOrder = Game.state.correctOrder;
            if (!correctOrder || correctOrder[position] === undefined) return;
            const correctValue = correctOrder[position];
            // Find the unplaced number-box with that value
            const numberBox = Array.from(document.querySelectorAll('.number-box')).find(el => {
                return parseInt(el.dataset.value) === correctValue && !el.closest('.slot');
            });
            if (!numberBox) return;
            this._queue = [{
                target: numberBox,
                action: () => {
                    Game.state.draggedElement = numberBox;
                    Game.handleSlotDrop(nextSlot);
                }
            }];
            this._step = 0;
            this._highlight(numberBox);
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

    // 初始化遊戲
    Game.init();
});