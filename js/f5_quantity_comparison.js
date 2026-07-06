/**
 * @file f5_quantity_comparison.js
 * @description F5 數量大小比較 - 配置驅動版本
 * @unit F5 - 數量大小的比較
 * @version 2.2.0 - 配置驅動 + 詳細Debug系統
 * @lastModified 2025.08.30 下午1:58
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
// 🐛 Debug System - FLAGS 分類開關系統
// =================================================================
// 使用方式：在瀏覽器 Console 中輸入
// GameDebug.FLAGS.all = true;      // 開啟全部
// GameDebug.FLAGS.ui = true;       // 只開啟 UI 相關
// GameDebug.FLAGS.audio = true;    // 只開啟音效相關
// =================================================================

const GameDebug = {
    FLAGS: {
        all: false,        // 全域開關（開啟後顯示所有分類）
        init: false,       // 初始化相關
        config: false,     // 配置相關
        game: false,       // 遊戲流程
        ui: false,         // UI 操作
        audio: false,      // 音效系統
        speech: false,     // 語音系統
        events: false,     // 事件處理
        scoring: false,    // 計分系統
        timer: false,      // 計時器
        question: false,   // 題目生成
        render: false,     // 渲染相關
        animation: false,  // 動畫相關
        state: false,      // 狀態變更
        error: true        // 錯誤訊息（預設開啟）
    },

    log(category, ...args) {
        if (this.FLAGS.all || this.FLAGS[category]) {
            console.log(`[F5-${category}]`, ...args);
        }
    },

    warn(category, ...args) {
        if (this.FLAGS.all || this.FLAGS[category]) {
            console.warn(`[F5-${category}]`, ...args);
        }
    },

    error(...args) {
        if (this.FLAGS.error) {
            console.error('[F5-ERROR]', ...args);
        }
    },

    // =====================================================
    // 向後相容包裝方法（舊版 API 支援）
    // =====================================================
    logInit: (message, data) => GameDebug.log('init', message, data || ''),
    logConfig: (message, data) => GameDebug.log('config', message, data || ''),
    logGameFlow: (message, data) => GameDebug.log('game', message, data || ''),
    logUI: (message, data) => GameDebug.log('ui', message, data || ''),
    logAudio: (message, data) => GameDebug.log('audio', message, data || ''),
    logSpeech: (message, data) => GameDebug.log('speech', message, data || ''),
    logEvents: (message, data) => GameDebug.log('events', message, data || ''),
    logScoring: (message, data) => GameDebug.log('scoring', message, data || ''),
    logTimer: (message, data) => GameDebug.log('timer', message, data || ''),
    logGeneration: (message, data) => GameDebug.log('question', message, data || ''),
    logRendering: (message, data) => GameDebug.log('render', message, data || ''),
    logAnimation: (message, data) => GameDebug.log('animation', message, data || ''),
    logError: (message, data) => GameDebug.error(message, data || ''),
    logUserAction: (message, data) => GameDebug.log('events', `🖱️ ${message}`, data || ''),

    // 效能監控（暫時停用）
    performance: {
        timers: {},
        start(label) {},
        end(label) {}
    }
};

// =================================================================
// 配置驅動系統 - F5 數量大小比較遊戲配置中心
// =================================================================

const QuantityComparisonConfig = {
    // =====================================================
    // 🎯 遊戲基本配置
    // =====================================================
    game: {
        title: "單元F5：數量大小的比較",
        subtitle: "比較不同數量的多寡，了解大於、小於、等於的概念",
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
            description: '直接看圖形數量，選擇較多、較少或相同',
            visualMode: 'direct',
            showNumbers: true, // 簡單模式顯示數字
            maxQuantity: 10,
            minQuantity: 1,
            objectTypes: ['dots', 'shapes', 'icons'],
            speechFeedback: true,
            autoProgress: true,
            colors: {
                primary: '#28a745',
                secondary: '#20c997',
                correct: '#28a745',
                incorrect: '#dc3545',
                background: 'rgba(40, 167, 69, 0.1)'
            },
            timing: {
                feedbackDelay: 500,
                nextQuestionDelay: 2000,
                speechDelay: 300,
                animationInterval: 1 // 圖示顯示間隔時間 
            },
            scoring: {
                correctAnswer: 10,
                perfectLevel: 50
            },
            // 語音模板配置
            speechTemplates: {
                instruction: '請比較兩邊的數量，選擇正確的關係',
                correct: '太棒了，答對了！',
                incorrect: '再試試看，仔細觀察兩邊的數量',
                correctAnswer: '正確答案已顯示，請觀察兩邊的數量關係',
                complete: '恭喜完成所有題目！',
                addCustomItem: '已新增自訂圖示：{itemName}',
                removeCustomItem: '已移除圖示：{itemName}'
            }
        },
        normal: {
            id: 'normal',
            label: '普通',
            description: '先數出數量，再進行比較判斷',
            visualMode: 'counting',
            showNumbers: true,
            maxQuantity: 20,
            minQuantity: 5,
            objectTypes: ['mixed_shapes', 'animals', 'toys'],
            speechFeedback: true,
            requireConfirmation: true,
            colors: {
                primary: '#007bff',
                secondary: '#0056b3',
                correct: '#28a745',
                incorrect: '#dc3545',
                background: 'rgba(0, 123, 255, 0.1)'
            },
            timing: {
                feedbackDelay: 800,
                nextQuestionDelay: 3000,
                speechDelay: 300
            },
            scoring: {
                correctAnswer: 15,
                perfectLevel: 75
            },
            // 語音模板配置
            speechTemplates: {
                instruction: '請先數出兩邊的數量，再選擇正確的比較關係',
                counting: '左邊有{leftCount}個，右邊有{rightCount}個',
                correct: '太棒了，你數對了也比較對了！',
                incorrect: '再仔細數數看，然後比較大小',
                correctAnswer: '正確答案已顯示，請注意兩邊數量的比較關係',
                complete: '恭喜完成所有題目！',
                addCustomItem: '已新增自訂圖示：{itemName}',
                removeCustomItem: '已移除圖示：{itemName}'
            }
        },
        hard: {
            id: 'hard',
            label: '困難',
            description: '純數字比較，需要輸入答案',
            visualMode: 'number_input',
            showNumbers: true,
            showObjects: false,
            maxQuantity: 100,
            minQuantity: 1,
            customRange: true,
            objectTypes: ['complex_arrangements', 'patterns', 'groups'],
            speechFeedback: true,
            requireConfirmation: true,
            sameQuantityRatio: 0.4, // 40%機率出現相同數量的題目
            colors: {
                primary: '#dc3545',
                secondary: '#c82333',
                correct: '#28a745',
                incorrect: '#dc3545',
                background: 'rgba(220, 53, 69, 0.1)'
            },
            timing: {
                feedbackDelay: 1000,
                nextQuestionDelay: 4000,
                speechDelay: 300
            },
            scoring: {
                correctAnswer: 20,
                perfectLevel: 100
            },
            // 語音模板配置
            speechTemplates: {
                instruction: 'A組數字是{leftNumber}，B組數字是{rightNumber}，請問哪一組數字比較{comparisonType}，請輸入比較{comparisonType}的數字',
                correct: '答對了！繼續保持！',
                correctWithAnswer: '答對了，較{comparisonType}的數字是{correctAnswer}',
                incorrect: '答案不正確，正確答案是{correctAnswer}',
                complete: '恭喜完成所有題目！',
                addCustomItem: '已新增自訂圖示：{itemName}',
                removeCustomItem: '已移除圖示：{itemName}'
            }
        }
    },

    // =====================================================
    // 🔢 數量範圍配置
    // =====================================================
    quantityRanges: {
        '1-5': {
            id: '1-5',
            label: '1-5',
            description: '',
            minQuantity: 1,
            maxQuantity: 5
        },
        '1-10': {
            id: '1-10',
            label: '1-10',
            description: '',
            minQuantity: 1,
            maxQuantity: 10
        },
        '5-15': {
            id: '5-15',
            label: '5-15',
            description: '',
            minQuantity: 5,
            maxQuantity: 15
        },
        '10-20': {
            id: '10-20',
            label: '10-20',
            description: '',
            minQuantity: 10,
            maxQuantity: 20
        },
        '15-25': {
            id: '15-25',
            label: '15-25',
            description: '',
            minQuantity: 15,
            maxQuantity: 25
        },
        '20-30': {
            id: '20-30',
            label: '20-30',
            description: '',
            minQuantity: 20,
            maxQuantity: 30
        },
        custom: {
            id: 'custom',
            label: '自訂範圍',
            description: '',
            minQuantity: null,
            maxQuantity: null,
            requiresInput: true
        }
    },

    // =====================================================
    // 🎯 比較選項配置
    // =====================================================
    comparisonModes: {
        findSmaller: {
            id: 'findSmaller',
            label: '找出小的',
            description: '找出數量較少的一組',
            instruction: '請找出數量較少、數字較小的是哪一組？',
            order: 1
        },
        findLarger: {
            id: 'findLarger',
            label: '找出大的',
            description: '找出數量較多的一組',
            instruction: '請找出數量較多、數字較大的是哪一組？',
            order: 2
        },
        random: {
            id: 'random',
            label: '隨機 🎲',
            description: '隨機出現找大或找小的題目',
            instruction: '', // 動態生成
            order: 3
        }
    },

    // =====================================================
    // 🎯 比較類型配置
    // =====================================================
    comparisonTypes: {
        more: {
            id: 'more',
            label: '較多',
            symbol: '>',
            description: '左邊比右邊多',
            icon: '📈',
            color: '#28a745'
        },
        less: {
            id: 'less',
            label: '較少',
            symbol: '<',
            description: '左邊比右邊少',
            icon: '📉',
            color: '#dc3545'
        },
        same: {
            id: 'same',
            label: '一樣多',
            symbol: '=',
            description: '兩邊數量相同',
            icon: '⚖️',
            color: '#007bff'
        }
    },

    // =====================================================
    // 🎨 主題配置系統 (仿f3_number_recognition)
    // =====================================================
    themes: {
        fruits: ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍍', '🍉', '🍑', '🍒'],
        animals: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁'],
        vehicles: ['🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '🚚', '🚲', '🚀', '✈️'],
        shapes: ['🔵', '🟢', '🟡', '🟠', '🟣', '🔴', '⚫', '⚪', '🔺', '🔸'],
        sports: ['⚽', '🏀', '🏈', '🎾', '🏐', '🏓', '🏸', '🥎', '🏑', '🏒'],
        food: ['🍔', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🍗', '🍟', '🥨'],
        custom: [] // 自訂主題（動態載入自訂圖示）
    },

    // =====================================================
    // 🎨 物件類型配置
    // =====================================================
    get objectTypes() {
        if (typeof EmojiLibrary !== 'undefined') {
            return {
                dots: {
                    id: 'dots',
                    label: '圓點',
                    shapes: EmojiLibrary.colors.circles,
                    arrangement: 'random'
                },
                shapes: {
                    id: 'shapes',
                    label: '幾何圖形',
                    shapes: EmojiLibrary.colors.circles.slice(0, 7),
                    arrangement: 'grid'
                },
                icons: {
                    id: 'icons',
                    label: '圖示',
                    icons: EmojiLibrary.decorations.effects.slice(0, 7),
                    arrangement: 'scattered'
                },
                animals: {
                    id: 'animals',
                    label: '動物',
                    icons: EmojiLibrary.animals.mammals.slice(0, 7),
                    arrangement: 'line'
                },
                toys: {
                    id: 'toys',
                    label: '玩具',
                    icons: EmojiLibrary.activities.toys.slice(0, 7),
                    arrangement: 'cluster'
                },
                fruits: {
                    id: 'fruits',
                    label: '水果',
                    icons: EmojiLibrary.food.fruits.slice(0, 7),
                    arrangement: 'mixed'
                }
            };
        } else {
            // Fallback if EmojiLibrary not loaded
            return {
                dots: {
                    id: 'dots',
                    label: '圓點',
                    shapes: ['🔵', '🟢', '🟡', '🟠', '🟣', '🔴', '⚫', '⚪'],
                    arrangement: 'random'
                },
                shapes: {
                    id: 'shapes',
                    label: '幾何圖形',
                    shapes: ['⚫', '🔴', '🔵', '🟡', '🟢', '🟣', '🟠'],
                    arrangement: 'grid'
                },
                icons: {
                    id: 'icons',
                    label: '圖示',
                    icons: ['⭐', '🌟', '✨', '💎', '🔥', '⚡', '🌈'],
                    arrangement: 'scattered'
                },
                animals: {
                    id: 'animals',
                    label: '動物',
                    icons: ['🐶', '🐱', '🐰', '🐸', '🐻', '🐼', '🦊'],
                    arrangement: 'line'
                },
                toys: {
                    id: 'toys',
                    label: '玩具',
                    icons: ['🧸', '🚂', '⚽', '🎈', '🎯', '🎪', '🎭'],
                    arrangement: 'cluster'
                },
                fruits: {
                    id: 'fruits',
                    label: '水果',
                    icons: ['🍎', '🍌', '🍊', '🍇', '🍓', '🥝', '🍑'],
                    arrangement: 'mixed'
                }
            };
        }
    },

    // =====================================================
    // 📋 題目數量配置
    // =====================================================
    questionCounts: {
        1: {
            id: '1',
            label: '1題',
            description: '單題測試',
            value: 1
        },
        3: {
            id: '3',
            label: '3題',
            description: '簡短練習',
            value: 3
        },
        5: {
            id: '5',
            label: '5題',
            description: '快速練習',
            value: 5
        },
        10: {
            id: '10',
            label: '10題',
            description: '標準練習',
            value: 10
        },
        custom: {
            id: 'custom',
            label: '自訂',
            description: '自訂題目數量',
            value: null
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
        180: {
            id: '180',
            label: '180秒',
            description: '寬鬆時間限制',
            value: 180,
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
            warningTime: 15,
            order: 4
        }
    },

    // =====================================================
    // 📝 測驗模式配置
    // =====================================================
    testModes: {
        retry: {
            id: 'retry',
            label: '反複作答',
            description: '答錯時可重複作答直到答對',
            allowRetry: true,
            showCorrectAnswer: false,
            autoNext: false,
            order: 1
        },
        single: {
            id: 'single',
            label: '單次作答',
            description: '每題只能作答一次，答錯後顯示正確答案並進入下一題',
            allowRetry: false,
            showCorrectAnswer: true,
            autoNext: true,
            order: 2
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
                select: 'audio/click.mp3',
                correct: 'audio/correct02.mp3',
                incorrect: 'audio/error.mp3',
                success: 'audio/correct02.mp3',
                click: 'audio/click.mp3'
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
    // 🎨 視覺排列配置
    // =====================================================
    arrangements: {
        random: {
            id: 'random',
            name: '隨機散布',
            generator: 'randomScatter'
        },
        grid: {
            id: 'grid',
            name: '網格排列',
            generator: 'gridLayout'
        },
        line: {
            id: 'line',
            name: '直線排列',
            generator: 'lineLayout'
        },
        cluster: {
            id: 'cluster',
            name: '群組排列',
            generator: 'clusterLayout'
        },
        circle: {
            id: 'circle',
            name: '圓形排列',
            generator: 'circleLayout'
        }
    },

    // =====================================================
    // 🎲 難度差異配置
    // =====================================================
    difficultyDifferences: {
        easy: {
            minDifference: 2, // 最小數量差異
            maxDifference: 5, // 最大數量差異
            sameQuantityRate: 0.2 // 20%機率出現相同數量
        },
        normal: {
            minDifference: 1,
            maxDifference: 8,
            sameQuantityRate: 0.3 // 30%機率出現相同數量
        },
        hard: {
            minDifference: 1,
            maxDifference: 3, // 較小的差異增加難度
            sameQuantityRate: 0.4 // 40%機率出現相同數量，重點訓練
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
     * 獲取比較模式配置
     */
    getComparisonModeConfig(modeId) {
        return this.comparisonModes[modeId] || this.comparisonModes.findLarger;
    },

    /**
     * 獲取數量範圍配置
     */
    getQuantityRangeConfig(rangeId) {
        return this.quantityRanges[rangeId] || this.quantityRanges['1-10'];
    },

    /**
     * 獲取時間限制配置
     */
    getTimeLimitConfig(timeId) {
        return this.timeLimits[timeId] || this.timeLimits.none;
    },

    /**
     * 獲取題目數量配置
     */
    getQuestionCountConfig(countId) {
        // 如果是數字（自訂題目數量），直接返回該數量的配置
        if (typeof countId === 'number') {
            return {
                id: 'custom',
                label: '自訂',
                description: `自訂題目數量: ${countId}`,
                value: countId
            };
        }
        return this.questionCounts[countId] || this.questionCounts[10];
    },

    /**
     * 獲取音效配置
     */
    getSoundConfig(soundId) {
        return this.soundSettings[soundId] || this.soundSettings.on;
    },

    /**
     * 獲取測驗模式配置
     */
    getTestModeConfig(testModeId) {
        return this.testModes[testModeId] || this.testModes.retry;
    },

    /**
     * 獲取物件類型配置
     */
    getObjectTypeConfig(typeId) {
        return this.objectTypes[typeId] || this.objectTypes.dots;
    },

    /**
     * 獲取比較類型配置
     */
    getComparisonTypeConfig(typeId) {
        return this.comparisonTypes[typeId] || this.comparisonTypes.more;
    },

    /**
     * 獲取完整遊戲配置
     */
    getGameConfig(settings) {
        return {
            difficulty: this.getDifficultyConfig(settings.difficulty),
            comparisonMode: this.getComparisonModeConfig(settings.comparisonMode),
            quantityRange: this.getQuantityRangeConfig(settings.quantityRange),
            questionCount: this.getQuestionCountConfig(settings.questionCount),
            timeLimit: this.getTimeLimitConfig(settings.time),
            sound: this.getSoundConfig(settings.sound),
            testMode: this.getTestModeConfig(settings.testMode)
        };
    },

    /**
     * 驗證設定完整性
     */
    validateSettings(settings, gameInstance) {
        // 困難模式不需要主題設定；簡單模式自動完成，不需要選擇測驗模式
        const required = settings.difficulty === 'hard'
            ? ['difficulty', 'comparisonMode', 'quantityRange', 'questionCount', 'testMode']
            : settings.difficulty === 'easy'
            ? ['difficulty', 'comparisonMode', 'quantityRange', 'questionCount', 'theme']
            : ['difficulty', 'comparisonMode', 'quantityRange', 'questionCount', 'testMode', 'theme'];
        
        const basicValidation = required.every(key => settings[key] !== null && settings[key] !== undefined);
        
        // 🔍 詳細驗證訊息，協助除錯
        GameDebug.log('ui', '🔍 設定驗證詳情', {
            settings: { ...settings },
            required,
            missingSettings: required.filter(key => settings[key] === null || settings[key] === undefined),
            basicValidation,
            isHardMode: settings.difficulty === 'hard'
        });
        
        // 困難模式不需要檢查主題
        if (settings.difficulty === 'hard') {
            return basicValidation;
        }
        
        // 如果不是自訂主題，基本驗證通過就可以
        if (settings.theme !== 'custom') {
            return basicValidation;
        }
        
        // 驗證自訂主題是否有足夠的圖示
        if (settings.theme === 'custom' && gameInstance) {
            const isCustomThemeValid = gameInstance.state?.customItems?.length >= 1;
            GameDebug.log('ui', '🔍 自訂主題驗證', {
                customItemsCount: gameInstance.state?.customItems?.length || 0,
                isCustomThemeValid,
                finalValidation: basicValidation && isCustomThemeValid
            });
            return basicValidation && isCustomThemeValid;
        }
        
        return basicValidation;
    },

    /**
     * 獲取設定選項列表
     */
    getSettingOptions(category) {
        const configs = {
            difficulty: this.difficulties,
            comparisonMode: this.comparisonModes,
            quantityRange: this.quantityRanges,
            questionCount: this.questionCounts,
            time: this.timeLimits,
            sound: this.soundSettings,
            testMode: this.testModes
        };
        
        const categoryConfig = configs[category];
        if (!categoryConfig) return [];
        
        let options = Object.values(categoryConfig).map(config => ({
            id: config.id,        // 加入 id 屬性
            value: config.id,     // 保持向後相容
            label: config.label,
            description: config.description,
            order: config.order || 0,
            difficultyRestricted: config.difficultyRestricted || false  // 也加入這個重要屬性
        }));
        
        // 如果有order屬性，則按order排序
        if (options.some(option => option.order > 0)) {
            options.sort((a, b) => a.order - b.order);
        }
        
        return options;
    }
};

// 預設主題 = 所有主題的合集（隨機選用各種圖示）
QuantityComparisonConfig.themes.default = [
    ...QuantityComparisonConfig.themes.fruits,
    ...QuantityComparisonConfig.themes.animals,
    ...QuantityComparisonConfig.themes.vehicles,
    ...QuantityComparisonConfig.themes.shapes,
    ...QuantityComparisonConfig.themes.sports,
    ...QuantityComparisonConfig.themes.food
];

// =================================================================
// HTML模板系統 - F5 數量大小比較模板
// =================================================================

const QuantityComparisonTemplates = {
    /**
     * 設定頁面模板（匹配歡迎畫面樣式）
     */
    settingsScreen(config) {
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
                .custom-item-row:last-child { border-bottom: none; }
                .custom-item-row span { flex: 1; font-weight: bold; color: #333; }
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
            </style>
            <div class="unit-welcome">
                <div class="welcome-content">
                    <div class="settings-title-row">
                        <img src="../images/common/hint_detective.png" alt="金錢小助手" class="settings-mascot-img">
                        <h1>${config.gameTitle}</h1>
                    </div>
                    <p style="font-size: 1em; color: #666; margin-top: 15px; margin-bottom: 25px; line-height: 1.6;">比較不同數量的多寡，了解大於、小於、等於的概念</p>

                    <div class="game-settings">
                        ${this.generateSettingGroup('difficulty', '🎯 選擇難度：', config.difficultyOptions)}
                        <div id="difficulty-description" class="setting-description" style="margin-top: -15px; margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 0.95em; color: #666; text-align: left;">
                            ${this.getDifficultyDescription(config.difficultyOptions.find(o => o.active)?.value || 'normal')}
                        </div>
                        <div class="setting-group" id="assist-click-group" style="background: #fff3cd; padding: 15px; border-radius: 10px; border: 2px solid #ffcc02; ${config.currentDifficulty !== 'easy' ? 'display:none;' : ''}">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2em;">♿</span>
                                <span>輔助點擊模式（單鍵操作）：</span>
                            </label>
                            <p style="font-size: 0.9em; color: #666; margin: 8px 0 12px 0; line-height: 1.5;">
                                啟用後，只要偵測到點擊，系統會自動依序完成點選正確的數量比較結果等所有操作。適合手部控制能力較弱的學習者使用。<br>
                                <strong style="color: #ff6b6b;">⚠️ 僅適用於「簡單模式」</strong>
                            </p>
                            <div class="button-group">
                                <button class="selection-btn ${config.assistClick ? 'active' : ''}" id="assist-click-on">✓ 啟用</button>
                                <button class="selection-btn ${!config.assistClick ? 'active' : ''}" id="assist-click-off">✗ 停用</button>
                            </div>
                        </div>
                        ${this.generateSettingGroup('comparisonMode', '⚖️ 比較選項：', config.comparisonModeOptions)}
                        ${this.generateQuantityRangeGroup(config)}
                        ${this.generateQuestionCountGroup('📋 題目數量：', config.questionCountOptions, config.currentQuestionCount)}
                        ${this.generateSettingGroup('testMode', '📝 測驗模式：', config.testModeOptions)}
                        ${this.generateThemeSettingGroup(config)}
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
            </div>
        `;
    },

    /**
     * 遊戲頁面模板（採用F3風格）
     */
    gameScreen(config) {
        return `
            <div class="game-container">
                <div class="title-bar">
                    <div class="title-bar-left">
                        <div id="progress-info">第 ${config.currentLevel} / ${config.totalLevels} 題</div>
                    </div>
                    <div class="title-bar-center">
                        <div>${config.levelTitle}</div>
                    </div>
                    <div class="title-bar-right">
                        <button class="back-to-menu-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                        <button class="back-to-menu-btn" onclick="Game.init()">返回設定</button>
                    </div>
                </div>
                ${config.isHardMode ? `
                <div style="display:flex; justify-content:flex-end; align-items:center; padding:4px 20px 0 20px;">
                    <img src="../images/common/hint_detective.png" style="height:48px;width:auto;object-fit:contain;animation:settingsBounce 2.5s ease-in-out infinite;flex-shrink:0;">
                    <button id="f5-hint-btn" onclick="Game.showHardModeHint()" style="position:relative; background:linear-gradient(45deg,#4CAF50,#45a049); color:white; border:none; border-radius:25px; padding:8px 18px; font-size:14px; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 15px rgba(76,175,80,0.3); transition:all 0.3s; overflow:hidden;">
                        <span style="font-size:16px;">💡</span><span>提示</span>
                    </button>
                </div>` : ''}
                <div class="game-content" style="padding: 15px 20px !important; gap: 15px !important;">
                    <!-- 文字動畫提示區域 -->
                    <div class="question-prompt-area" id="question-prompt-area" style="min-height: 60px !important; margin-bottom: 5px !important;">
                        <div class="prompt-text" id="prompt-text" style="padding: 10px 25px !important;"></div>
                    </div>

                    <div id="comparison-area" class="comparison-area" style="padding: 25px !important; gap: 30px !important;">
                        <div class="quantity-group left-group" id="left-group">
                            <div class="quantity-counter" id="left-counter">0</div>
                            <div class="group-label">A組</div>
                            <div class="quantity-display" id="left-quantity"></div>
                            <div class="objects-container" id="left-objects"></div>
                            <div class="group-answer-btn" id="left-answer-btn"></div>
                        </div>
                        
                        <div class="comparison-symbol" id="comparison-symbol">
                            VS
                        </div>
                        
                        <div class="quantity-group right-group" id="right-group">
                            <div class="quantity-counter" id="right-counter">0</div>
                            <div class="group-label">B組</div>
                            <div class="quantity-display" id="right-quantity"></div>
                            <div class="objects-container" id="right-objects"></div>
                            <div class="group-answer-btn" id="right-answer-btn"></div>
                        </div>
                    </div>

                    <div id="answer-buttons" class="answer-buttons" style="display: none;">
                        <!-- 隱藏原有的中央答案按鈕區域 -->
                    </div>

                    <div id="next-container" class="next-container"></div>

                    </div>
                <div class="fireworks-container" id="fireworks-container"></div>
            </div>
        `;
    },

    /**
     * 生成答案按鈕HTML
     */
    generateAnswerButtons(config) {
        // 不使用此方法，改用 generateGroupAnswerButtons
        return '';
    },

    /**
     * 生成分組答案按鈕 (分別放在A、B組下方)
     */
    generateGroupAnswerButtons(config) {
        let leftButton = '';
        let rightButton = '';
        
        // 決定當前題目的比較類型
        let currentComparisonMode = config.comparisonMode;
        
        // 如果是隨機模式，根據當前題目的正確答案來決定按鈕文字
        if (config.comparisonMode === 'random' && config.currentQuestion) {
            if (config.currentQuestion.correctAnswer === 'more') {
                currentComparisonMode = 'findLarger';
            } else if (config.currentQuestion.correctAnswer === 'less') {
                currentComparisonMode = 'findSmaller';
            }
        }
        
        if (currentComparisonMode === 'findLarger') {
            // 找出大的模式
            leftButton = `
                <button class="group-comparison-btn selection-btn" data-comparison="left-larger">
                    A組較大
                </button>
            `;
            rightButton = `
                <button class="group-comparison-btn selection-btn" data-comparison="right-larger">
                    B組較大
                </button>
            `;
        } else if (currentComparisonMode === 'findSmaller') {
            // 找出小的模式
            leftButton = `
                <button class="group-comparison-btn selection-btn" data-comparison="left-smaller">
                    A組較小
                </button>
            `;
            rightButton = `
                <button class="group-comparison-btn selection-btn" data-comparison="right-smaller">
                    B組較小
                </button>
            `;
        }
        
        return { leftButton, rightButton };
    },

    /**
     * 生成數量範圍設定群組 (支援困難模式自訂範圍)
     */
    generateQuantityRangeGroup(config) {
        // 從傳入的 config 獲取當前難度，確保是最新的
        const currentDifficulty = config.difficultyOptions?.find(opt => opt.active)?.value || 'easy';
        const currentQuantityRange = config.quantityRangeOptions?.find(opt => opt.active)?.value || '1-10';
        
        const options = config.quantityRangeOptions
            .filter(option => !option.difficultyRestricted || currentDifficulty === 'hard')
            .map(option => `
                <button class="selection-btn${option.active ? ' active' : ''}"
                        data-type="quantityRange" data-value="${option.id}">
                    ${option.label}
                </button>
            `).join('');
        
        return `
            <div class="setting-group">
                <label class="setting-label">🔢 數量範圍：</label>
                <div class="setting-options button-group">
                    ${options}
                </div>
            </div>
        `;
    },
    
    /**
     * 遊戲版面樣式 - 簡化版（主要樣式已移至CSS檔案）
     */
    gameStyles(config) {
        return `
        <style>
            /* 僅保留基本的滾動設定，其他樣式已移至CSS檔案 */
            html, body {
                height: auto;
                margin: 0;
                overflow-y: auto;
            }
            .game-content {
                display: flex;
                flex-direction: column;
                flex-grow: 1; /* 改為 flex-grow，讓其可以成長 */
                padding: 15px 20px !important; /* 🔧 減少padding讓內容上移 */
                gap: 15px !important;
                justify-content: flex-start !important; /* 🔧 改為flex-start讓內容靠上 */
                align-items: center;
            }

            .comparison-area, .answer-area, .feedback-area {
                /* 【寬度限制修正】移除max-width限制，讓藍色容器可以滿版面 */
                width: 95%;
                border-radius: 15px;
                padding: 15px !important; /* 🔧 減少padding */
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 12px !important; /* 🔧 減少gap */
                box-sizing: border-box;
            }

            .comparison-area {
                background: #e3f2fd;
                border: 3px solid #90caf9;
                gap: 10px;              /* 減少gap讓更多空間給圖示框 */
                box-sizing: border-box;
                align-items: center;    /* 保持center避免影響A組B組框原始高度 */
                justify-content: space-between; /* 改為space-between充分利用空間 */
                display: flex;          /* 確保是flex佈局 */
            }
            
            .answer-area {
                background: #e8f5e9; 
                border: 3px dashed #a5d6a7; 
                flex-shrink: 0; /* 確保作答區不被壓縮 */
                min-height: 120px;
            }

            /* 【**修正**】直接隱藏 feedback-area 以防萬一 */
            .feedback-area {
                display: none;
            }
            
            .quantity-group {
                position: relative;     /* 🔧 [新增] 必要：讓 ::before/::after 偽元素相對於此定位 */
                flex: 1;                /* 改為flex: 1讓兩組平均分配所有可用空間 */
                max-width: none;        /* 移除最大寬度限制 */
                display: flex;          /* 使用 Flexbox 佈局 */
                flex-direction: column; /* 讓內部項目垂直排列 */
                gap: 8px;
                padding: 8px;           /* 減少padding從15px到8px */
                background: rgba(255, 255, 255, 0.9);
                border: 2px solid #b0bec5;
                border-radius: 15px;

                /* 移除所有 align-items，避免子項目寬度被壓縮 */
            }

            .group-label,
            .quantity-display {
                /* 【置中修正】
                   不再使用 align-self。改為讓標題和數字自然佔據100%寬度，
                   然後將其內部的文字內容置中。這不會影響到其他兄弟項目。*/
                width: 100%;
                text-align: center;
            }
            
            .group-label {
                font-size: 1.5rem;
                font-weight: bold;
                color: #0d47a1;
            }

            /* 隱藏舊的計數器，因為數字改在上方顯示 */
            .quantity-counter {
                display: none;
            }

            /* .objects-container 樣式已移至 f5-quantity-comparison.css 統一管理，
               使用響應式媒體查詢控制桌面10列、平板8列、手機5列 */

            /* left-group 和 right-group 的 .objects-container 樣式
               已移至 CSS 檔案統一管理 */

            .quantity-display {
                /* 樣式已移至 CSS 文件統一管理 */
            }
            
            .comparison-symbol {
                font-size: 3rem;
                font-weight: bold;
                color: #f57c00;
            }
            
            .answer-buttons {
                display: flex;
                gap: 20px;
                width: 100%; /* 【按鈕修正】讓按鈕容器佔滿寬度 */
            }

            .comparison-btn {
                flex: 1;
                max-width: 300px; /* 稍微限制寬度，避免在大螢幕上過長 */
                margin: 0 auto; /* 讓按鈕在flex容器中居中 */
                padding: 15px;
                font-size: 1.5rem;
                border-radius: 10px;
                cursor: pointer;
                border: 3px solid transparent;
                background-color: #fff;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
            }
            
            .comparison-btn:hover {
                transform: translateY(-5px);
                box-shadow: 0 6px 15px rgba(0,0,0,0.15);
            }

            .comparison-btn.selected {
                border-color: #007bff;
            }

            /* 正確選項：綠色圓形覆蓋 + 打勾圖示 */
            .comparison-btn.correct::after {
                content: '✓';
                position: absolute;
                inset: 0;
                background-color: rgba(40, 167, 69, 0.92);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 2.8rem;
                font-weight: bold;
                line-height: 1;
                z-index: 10;
                pointer-events: none;
                animation: icon-appear 0.3s ease-out forwards;
            }

            /* 組別強調動畫 - 已移至 injectGlobalAnimationStyles() */

            /* 錯誤選項：紅色圓形覆蓋 + 叉叉圖示 */
            .comparison-btn.incorrect::after {
                content: '✕';
                position: absolute;
                inset: 0;
                background-color: rgba(220, 53, 69, 0.92);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 2.8rem;
                font-weight: bold;
                line-height: 1;
                z-index: 10;
                pointer-events: none;
                animation: icon-appear 0.3s ease-out forwards;
            }

            .object-item {
                /* 還原圖示原始大小 */
                font-size: 2.5rem;
                line-height: 1;
                animation: bounce-in 0.5s ease-out forwards;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .next-container button {
                padding: 10px 25px;
                font-size: 1.2rem;
                border-radius: 20px;
            }

            /* @keyframes lively-correct, frantic-incorrect, pulse-correct, shake-incorrect 已移至 injectGlobalAnimationStyles() */

            /* 困難模式正確答案動畫 */
            .correct-answer-animation {
                animation: hard-mode-correct 2s ease-out !important;
                background-color: rgba(40, 167, 69, 0.3) !important;
                border: 3px solid #28a745 !important;
                box-shadow: 0 0 25px rgba(40, 167, 69, 0.8) !important;
            }

            /* @keyframes hard-mode-correct 已移至 injectGlobalAnimationStyles() */

            /* 🔧 [新增] 單次作答錯誤視覺標記 - 紅色×（組別元素用） */
            .group-comparison-btn.show-error-x,
            .quantity-group.show-error-x {
                position: relative;
                border-color: #ff0000 !important;
                box-shadow: 0 0 15px rgba(255, 0, 0, 0.5) !important;
                animation: shake 0.3s ease-in-out;
            }

            .group-comparison-btn.show-error-x::before,
            .quantity-group.show-error-x::before {
                content: '✕';
                position: absolute;
                top: -20px;              /* 🔧 改為上方 */
                left: 50%;
                transform: translateX(-50%);  /* 🔧 只水平置中 */
                width: 48px;             /* 🔧 與綠✓一致 */
                height: 48px;
                background-color: #dc3545;  /* 🔧 實心紅色圓圈背景 */
                color: white;            /* 🔧 白色×符號 */
                border-radius: 50%;      /* 🔧 圓形 */
                display: flex;           /* 🔧 使用 flex 布局居中 */
                align-items: center;
                justify-content: center;
                font-size: 28px;         /* 🔧 調整字體大小與綠✓一致 */
                font-weight: bold;
                line-height: 1;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);  /* 🔧 添加陰影 */
                z-index: 1000;
                animation: error-pulse 0.5s ease-in-out infinite alternate;
                pointer-events: none;
            }

            /* @keyframes error-pulse, shake 已移至 injectGlobalAnimationStyles() */

            /* 🔧 [新增] 正確答案視覺標記 - 綠色✓（組別元素用） */
            .group-comparison-btn.show-correct-tick,
            .quantity-group.show-correct-tick {
                position: relative !important;
                z-index: 9998 !important;
            }

            .group-comparison-btn.show-correct-tick::after,
            .quantity-group.show-correct-tick::after {
                content: '✓';
                position: absolute;
                top: -20px;              /* 🔧 改為上方，與紅×對齊 */
                left: 50%;               /* 🔧 改為水平置中 */
                transform: translateX(-50%);  /* 🔧 水平置中 */
                width: 48px;             /* 🔧 調整大小與紅×一致 */
                height: 48px;
                background-color: #28a745;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;         /* 🔧 調整字體大小 */
                font-weight: bold;
                line-height: 1;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                z-index: 9999;
                animation: correct-tick-appear 0.4s ease-out forwards;
                pointer-events: none;
            }

            /* @keyframes correct-tick-appear 已移至 injectGlobalAnimationStyles() */

            /* 簡單模式 左右框：綠色圓形徽章 + 打勾圖示（顯示在選項框上方） */
            .quantity-group.correct::after {
                content: '✓';
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background-color: #28a745;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 30px;
                font-weight: bold;
                line-height: 1;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                z-index: 10;
                pointer-events: none;
                animation: icon-appear 0.3s ease-out forwards;
            }

            /* 簡單模式 左右框：紅色圓形徽章 + 叉叉圖示（顯示在選項框上方） */
            .quantity-group.incorrect::after {
                content: '✕';
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background-color: #dc3545;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 30px;
                font-weight: bold;
                line-height: 1;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                z-index: 10;
                pointer-events: none;
                animation: icon-appear 0.3s ease-out forwards;
            }

        </style>
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
                    <a href="#" id="results-reward-link" class="reward-btn-link">
                        🎁 開啟獎勵系統
                    </a>
                </div>

                <div class="results-container">
                    <div class="results-grid">
                        <div class="result-card">
                            <div class="result-icon">✅</div>
                            <div class="result-label">答對題數</div>
                            <div class="result-value">${config.correctAnswers} / ${config.totalAnswers}</div>
                        </div>
                        <div class="result-card">
                            <div class="result-icon">📊</div>
                            <div class="result-label">正確率</div>
                            <div class="result-value">${config.accuracy}</div>
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
                            <div class="achievement-item">🎯 學會比較數量多寡</div>
                            <div class="achievement-item">🔢 掌握多／少／一樣多的概念</div>
                            <div class="achievement-item">📝 建立數量感知能力</div>
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
                    align-items: center;
                    min-height: 100vh;
                    padding: 20px;
                    box-sizing: border-box;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                /* @keyframes fadeIn, celebrate, bounce, glow 已移至 injectGlobalAnimationStyles() */

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
                    font-size: inherit;
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
    generateSettingGroup(type, label, options) {
        return `
            <div class="setting-group">
                <label class="setting-label">${label}</label>
                <div class="button-group" data-setting-type="${type}">
                    ${options.map(option => `
                        <button class="selection-btn${option.active ? ' active' : ''}"
                                data-type="${type}"
                                data-value="${option.value}">
                            ${option.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * 🔧 [新增] 取得難度說明
     */
    getDifficultyDescription(difficulty) {
        const descriptions = {
            'easy': '簡單：系統自動數數，有物品圖示及數字顯示，比較數量大小。',
            'normal': '普通：自己點數，有物品圖示及數字顯示，比較數量大小。',
            'hard': '困難：單純數字呈現，比較數字大小。'
        };
        return descriptions[difficulty] || '請選擇難度';
    },

    /**
     * 題數選擇群組模板（包含自訂顯示區域）- 新增
     */
    generateQuestionCountGroup(label, options, currentValue) {
        const isCustomActive = typeof currentValue === 'number' && ![1, 3, 5, 10].includes(currentValue);
        return `
            <div class="setting-group">
                <label class="setting-label">${label}</label>
                <div class="button-group" data-setting-type="questionCount">
                    ${options.map(option => `
                        <button class="selection-btn${option.active ? ' active' : ''}"
                                data-type="questionCount"
                                data-value="${option.value}">
                            ${option.label}
                        </button>
                    `).join('')}
                </div>
                <div class="custom-question-display" style="display: ${isCustomActive ? 'block' : 'none'}; margin-top: 10px;">
                    <input type="text" id="custom-question-count-f5"
                           value="${isCustomActive ? currentValue + '題' : ''}"
                           placeholder="請輸入題數"
                           style="padding: 8px; border-radius: 5px; border: 2px solid ${isCustomActive ? '#667eea' : '#ddd'}; background: ${isCustomActive ? '#667eea' : 'white'}; color: ${isCustomActive ? 'white' : '#333'}; text-align: center; cursor: pointer; width: 120px;"
                           readonly onclick="Game.handleCustomQuestionClick()">
                </div>
            </div>
        `;
    },

    /**
     * 主題選擇群組模板 (仿f3_number_recognition) - 修正版
     */
    generateThemeSettingGroup(config) {
        // 🚫 困難模式不顯示主題選擇，因為只有純數字沒有圖示
        const currentDifficulty = config.difficultyOptions?.find(opt => opt.active)?.value || 'easy';
        
        // 🔍 詳細除錯資訊
        GameDebug.log('ui', '🔍 主題選擇區域生成檢查', {
            currentDifficulty,
            difficultyOptions: config.difficultyOptions,
            activeOption: config.difficultyOptions?.find(opt => opt.active),
            shouldHide: currentDifficulty === 'hard'
        });
        
        if (currentDifficulty === 'hard') {
            GameDebug.log('ui', '🚫 困難模式偵測到，隱藏主題選擇區域');
            return ''; // 困難模式返回空字串，不顯示主題選擇區域
        }
        
        GameDebug.log('ui', '✅ 非困難模式，顯示主題選擇區域');
        const { theme, customItems } = config;
        
        // 直接使用配置中的主題，避免循環引用問題
        const themes = {
            fruits: ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍍', '🍉', '🍑', '🍒'],
            animals: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁'],
            vehicles: ['🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '🚚', '🚲', '🚀', '✈️'],
            shapes: ['🔵', '🟢', '🟡', '🟠', '🟣', '🔴', '⚫', '⚪', '🔺', '🔸'],
            sports: ['⚽', '🏀', '🏈', '🎾', '🏐', '🏓', '🏸', '🥎', '🏑', '🏒'],
            food: ['🍔', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🍗', '🍟', '🥨']
        };
        
        return `
            <div class="setting-group">
                <label class="setting-label">🎨 主題選擇：</label>
                <div class="button-group" data-setting-type="theme">
                    <button class="selection-btn ${theme === 'default' ? 'active' : ''}"
                            data-type="theme" data-value="default">
                        隨機 🎲
                    </button>
                    ${Object.entries(themes).map(([key, icons]) => {
                        const themeNames = {
                            fruits: '水果',
                            animals: '動物',
                            vehicles: '交通工具',
                            shapes: '形狀',
                            sports: '運動',
                            food: '食物'
                        };
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
                
                ${theme === 'custom' ? `
                    <div class="setting-group custom-theme-setup">
                        <h4>🎨 自訂主題設定</h4>
                        <p>上傳你的圖示並設定名稱：</p>
                        <div class="custom-items-list" style="display:flex;flex-direction:row;flex-wrap:wrap;gap:10px;min-height:60px;border:1px solid #e0e0e0;border-radius:5px;padding:10px;margin:10px 0;background:white;">
                            ${(customItems || []).map((item, index) => `
                                <div class="custom-item-row" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;border:1px solid #eee;border-radius:8px;background:#fafafa;text-align:center;width:fit-content;">
                                    <img src="${item.icon}" alt="${item.name}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;">
                                    <span style="font-size:12px;font-weight:bold;color:#333;">${item.name}</span>
                                    <button class="remove-btn" onclick="Game.removeCustomItem(${index})" style="padding:3px 8px;font-size:12px;">❌</button>
                                </div>
                            `).join('')}
                        </div>
                        <button class="upload-btn" onclick="Game.triggerImageUpload()"
                            style="background:linear-gradient(45deg,#2196F3,#42A5F5);color:white;font-weight:bold;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;font-size:14px;transition:background 0.3s ease,transform 0.3s ease;"
                            onmouseenter="this.style.background='linear-gradient(45deg,#FF9800,#FFA726)';this.style.transform='translateY(-2px)'"
                            onmouseleave="this.style.background='linear-gradient(45deg,#2196F3,#42A5F5)';this.style.transform=''"
                            ontouchstart="this.style.background='linear-gradient(45deg,#FF9800,#FFA726)'"
                            ontouchend="this.style.background='linear-gradient(45deg,#2196F3,#42A5F5)'">📸 上傳圖片</button>
                        <input type="file" id="image-upload" accept="image/*" style="display: none;">
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * 比較按鈕組模板
     */
    comparisonButtons(singleButton = null) {
        // 獲取當前設定的比較模式
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        const comparisonMode = gameConfig.comparisonMode.id;
        
        let moreText, lessText;
        
        // 根據設定的模式顯示選項文字
        if (comparisonMode === 'findLarger') {
            // 找出大的模式：顯示 A組較多、B組較多
            moreText = 'A組較多';
            lessText = 'B組較多';
        } else if (comparisonMode === 'findSmaller') {
            // 找出小的模式：顯示 A組較少、B組較少
            moreText = 'A組較少';
            lessText = 'B組較少';
        } else {
            // 預設模式：根據實際數量調整文字
            moreText = 'A組較多';
            lessText = 'A組較少';
            
            if (this.currentQuestion) {
                const { leftQuantity, rightQuantity } = this.currentQuestion;
                if (leftQuantity > rightQuantity) {
                    moreText = 'A組較多';
                    lessText = 'B組較少';
                } else if (rightQuantity > leftQuantity) {
                    moreText = 'B組較多';
                    lessText = 'A組較少';
                }
            }
        }

        const buttons = {
            more: `
                <button class="comparison-btn more-btn" data-comparison="more">
                    <div class="btn-icon">📈</div>
                    <div class="btn-text">${moreText} (&gt;)</div>
                </button>`,
            same: `
                <button class="comparison-btn same-btn" data-comparison="same">
                    <div class="btn-icon">⚖️</div>
                    <div class="btn-text">一樣多 (=)</div>
                </button>`,
            less: `
                <button class="comparison-btn less-btn" data-comparison="less">
                    <div class="btn-icon">📉</div>
                    <div class="btn-text">${lessText} (&lt;)</div>
                </button>`
        };

        // 如果指定了單一按鈕，只返回該按鈕
        if (singleButton && buttons[singleButton]) {
            return buttons[singleButton];
        }

        // 否則返回所有按鈕
        return Object.values(buttons).join('');
    },

    /**
     * 物件項目模板 - 修正為flexbox佈局
     */
    objectItem(type, content, index, position) {
        // 使用flexbox佈局，不需要absolute positioning
        return `
            <div class="object-item ${type}" 
                 data-index="${index}" 
                 style="animation-delay: ${index * 0.05}s;">
                ${content}
            </div>
        `;
    },

    /**
     * 數量顯示模板
     */
    quantityDisplay(quantity, showNumber = false) {
        return showNumber ? `
            <div class="quantity-number">${quantity}</div>
        ` : '';
    },

    /**
     * 下一題按鈕模板
     */
    nextButton() {
        return `<button id="next-btn" class="next-btn">下一題</button>`;
    },

    /**
     * 完成按鈕模板
     */
    completeButton() {
        return `<button id="complete-btn" class="complete-btn">完成測驗</button>`;
    },

    /**
     * 訊息顯示模板
     */
    messageDisplay(type, content) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        
        return `
            <div class="message ${type}">
                <span class="message-icon">${icons[type] || 'ℹ️'}</span>
                <span class="message-text">${content}</span>
            </div>
        `;
    },

    /**
     * 物件排列生成器 - 隨機散布
     */
    generateRandomArrangement(objects, containerWidth = 300, containerHeight = 200) {
        const positions = [];
        const objectSize = 35; // 預設物件大小
        const margin = 5;
        
        for (let i = 0; i < objects.length; i++) {
            let attempts = 0;
            let position;
            
            do {
                position = {
                    x: Math.random() * (containerWidth - objectSize - margin * 2) + margin,
                    y: Math.random() * (containerHeight - objectSize - margin * 2) + margin
                };
                attempts++;
            } while (attempts < 50 && this.checkOverlap(position, positions, objectSize));
            
            positions.push(position);
        }
        
        return positions;
    },

    /**
     * 物件排列生成器 - 網格排列
     */
    generateGridArrangement(objects, containerWidth = 300, containerHeight = 200) {
        const positions = [];
        const objectSize = 35;
        const cols = Math.ceil(Math.sqrt(objects.length));
        const rows = Math.ceil(objects.length / cols);
        
        const cellWidth = containerWidth / cols;
        const cellHeight = containerHeight / rows;
        
        for (let i = 0; i < objects.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            positions.push({
                x: col * cellWidth + (cellWidth - objectSize) / 2,
                y: row * cellHeight + (cellHeight - objectSize) / 2
            });
        }
        
        return positions;
    },

    /**
     * 物件排列生成器 - 直線排列
     */
    generateLineArrangement(objects, containerWidth = 300, containerHeight = 200) {
        const positions = [];
        const objectSize = 35;
        const spacing = Math.min((containerWidth - objectSize) / (objects.length -1 || 1), 45);
        const totalWidth = (objects.length - 1) * spacing;
        const startX = (containerWidth - totalWidth - objectSize) / 2;
        const y = (containerHeight - objectSize) / 2;
        
        for (let i = 0; i < objects.length; i++) {
            positions.push({
                x: startX + i * spacing,
                y: y
            });
        }
        
        return positions;
    },

    /**
     * 檢查物件重疊
     */
    checkOverlap(newPosition, existingPositions, objectSize) {
        const minDistance = objectSize;
        
        return existingPositions.some(pos => {
            const dx = newPosition.x - pos.x;
            const dy = newPosition.y - pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < minDistance;
        });
    },

    /**
     * 載入中模板
     */
    loadingScreen() {
        return `
            <div class="loading-screen">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <h3>載入中...</h3>
                    <p>正在準備數量比較遊戲</p>
                </div>
            </div>
        `;
    }
};

// =================================================================
// 主遊戲邏輯 - F5 數量大小比較遊戲控制器
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

/**
 * F5 數量大小比較遊戲主控制器
 * 基於 F4 架構，專注於比較概念教學
 */
class QuantityComparisonGame {
    constructor() {
        GameDebug.performance.start('game-constructor');
        GameDebug.logInit('🚀 遊戲建構子開始執行', { version: '2.2.0' });
        
        // 核心系統初始化
        this.Debug = GameDebug; // 整合 Debug 系統
        this.config = QuantityComparisonConfig;
        this.templates = QuantityComparisonTemplates;
        
        GameDebug.logConfig('📋 配置系統載入完成', {
            difficulties: Object.keys(this.config.difficulties),
            quantityRanges: Object.keys(this.config.quantityRanges),
            timeLimits: Object.keys(this.config.timeLimits)
        });
        
        // 遊戲狀態初始化
        this.gameState = 'menu'; // menu, playing, finished
        this.currentLevel = 1;
        this.totalLevels = 10;
        this.score = 0;
        this.correctAnswers = 0;
        this.totalAnswers = 0;
        
        GameDebug.logInit('🎮 遊戲狀態初始化完成', {
            gameState: this.gameState,
            currentLevel: this.currentLevel,
            totalLevels: this.totalLevels,
            score: this.score
        });
        
        // 遊戲設定初始化
        this.gameSettings = {
            difficulty: null,
            comparisonMode: null,
            quantityRange: null,
            questionCount: null,
            time: 'none', // 固定為無限制
            sound: 'on', // 固定為開啟音效
            testMode: null,
            theme: 'default', // 預設選擇預設主題（隨機混合所有圖示）
            assistClick: false
        };
        
        // 自訂主題狀態管理 (仿f3_number_recognition)
        this.state = {
            customItems: [],
            startTime: null, // 遊戲開始時間
            isAnswering: false // 🔧 [防連點] 答題處理中旗標
        };
        
        GameDebug.logConfig('⚙️ 遊戲設定初始化', this.gameSettings);
        
        // 當前題目資料
        this.currentQuestion = null;
        this.timer = null;
        this.timeRemaining = null;
        
        // 音效系統初始化
        this.sounds = {
            correct: document.getElementById('correct-sound'),
            success: document.getElementById('success-sound'),
            error: document.getElementById('error-sound'),
            incorrect: document.getElementById('error-sound'),
            select: document.getElementById('menu-select-sound'),
            click: document.getElementById('click-sound')
        };
        
        // 檢查音效元素載入狀況
        const soundStatus = {};
        Object.keys(this.sounds).forEach(key => {
            const element = this.sounds[key];
            if (element) {
                soundStatus[key] = {
                    status: '✅ 已載入',
                    src: element.src,
                    readyState: element.readyState,
                    networkState: element.networkState,
                    duration: element.duration,
                    volume: element.volume
                };
            } else {
                soundStatus[key] = '❌ 缺失';
            }
        });
        GameDebug.logAudio('🔊 音效系統初始化', soundStatus);
        
        // 🔍 音效環境檢查
        this.checkAudioEnvironment();
        
        // 語音系統初始化
        this.speechSynth = window.speechSynthesis;
        this.currentVoice = null;

        // 競態條件防護旗標
        this.lastSpeakId = 0;       // 追蹤最新的語音請求（Fix 2）
        this.easyModeResultShown = false; // 防止簡單模式結果重複觸發（Fix 3）
        this.gameSessionId = 0;     // 遊戲場次 ID，防止舊場次的回呼在新場次中觸發（Fix score）
        
        GameDebug.logSpeech('🎤 語音合成系統初始化', {
            speechSynth: this.speechSynth ? '✅ 可用' : '❌ 不可用',
            voicesLoaded: this.speechSynth ? this.speechSynth.getVoices().length : 0
        });
        
        // 啟動遊戲
        this.init();
        
        GameDebug.performance.end('game-constructor');
        GameDebug.logInit('✅ 遊戲建構完成');
    }
    
    /**
     * 初始化遊戲
     */
    init() {
        GameDebug.performance.start('game-init');
        GameDebug.logGameFlow('🎲 遊戲初始化開始');

        // 🔧 [Bug修復] 清理所有計時器和事件監聽器
        QuantityComparisonGame.TimerManager.clearAll();
        QuantityComparisonGame.EventManager.removeAll();
        // 🎬 注入全局動畫樣式
        this.injectGlobalAnimationStyles();

        this.gameState = 'menu';
        GameDebug.logGameFlow('📋 遊戲狀態設為: menu');

        this.setupSpeechSynthesis();
        this.showSettingsScreen();
        this.bindEvents();

        GameDebug.performance.end('game-init');
        GameDebug.logGameFlow('✅ 遊戲初始化完成');
    }

    /**
     * 🎬 全局動畫樣式注入
     */
    injectGlobalAnimationStyles() {
        if (document.getElementById('f5-global-animations')) return;

        const css = `
            @keyframes emphasis-glow { 0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.7); transform: scale(1.1); } 50% { box-shadow: 0 0 20px rgba(255, 215, 0, 1); transform: scale(1.15); } }
            @keyframes hint-border-flash { 0% { border-color: #ff6b6b; transform: scale(1.05); } 20% { border-color: #feca57; } 40% { border-color: #48dbfb; } 60% { border-color: #ff9ff3; } 80% { border-color: #54a0ff; } 100% { border-color: #5f27cd; transform: scale(1.05); } }
            @keyframes lively-correct { 0% { transform: scale(1); } 30% { transform: scale(1.15) rotate(-5deg); } 50% { transform: scale(0.95) rotate(5deg); } 70% { transform: scale(1.1) rotate(-2deg); } 100% { transform: scale(1) rotate(0); } }
            @keyframes frantic-incorrect { 0% { transform: translateX(0) rotate(0); } 15% { transform: translateX(-12px) rotate(-5deg); } 30% { transform: translateX(12px) rotate(5deg); } 45% { transform: translateX(-12px) rotate(-5deg); } 60% { transform: translateX(12px) rotate(5deg); } 75% { transform: translateX(-6px) rotate(-2deg); } 90% { transform: translateX(6px) rotate(2deg); } 100% { transform: translateX(0) rotate(0); } }
            @keyframes pulse-correct { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
            @keyframes shake-incorrect { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
            @keyframes hard-mode-correct { 0% { transform: scale(1); background-color: rgba(40, 167, 69, 0.1); box-shadow: 0 0 5px rgba(40, 167, 69, 0.4); } 25% { transform: scale(1.2); background-color: rgba(40, 167, 69, 0.4); box-shadow: 0 0 35px rgba(40, 167, 69, 1); } 50% { transform: scale(1.1) rotateZ(3deg); } 75% { transform: scale(1.15) rotateZ(-3deg); } 100% { transform: scale(1.1); background-color: rgba(40, 167, 69, 0.3); box-shadow: 0 0 25px rgba(40, 167, 69, 0.8); } }
            @keyframes error-pulse { from { transform: translateX(-50%) scale(1); opacity: 0.9; } to { transform: translateX(-50%) scale(1.1); opacity: 1; } }
            @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
            @keyframes correct-tick-appear { from { transform: translateX(-50%) scale(0) rotate(-180deg); opacity: 0; } to { transform: translateX(-50%) scale(1) rotate(0deg); opacity: 1; } }
            @keyframes icon-appear { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: scale(1); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes celebrate { 0% { transform: scale(0.8) rotate(-10deg); opacity: 0; } 50% { transform: scale(1.1) rotate(5deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
            @keyframes bounce { 0%, 20%, 60%, 100% { transform: translateY(0); } 40% { transform: translateY(-20px); } 80% { transform: translateY(-10px); } }
            @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(52, 152, 219, 0.4); } 50% { box-shadow: 0 0 30px rgba(52, 152, 219, 0.8); } }
        `;

        const style = document.createElement('style');
        style.id = 'f5-global-animations';
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    /**
     * 🔄 resetGameState - 統一遊戲狀態重置
     */
    resetGameState() {
        // 🔧 [Fix 1+4] 取消所有進行中的語音（防止舊遊戲的語音在新遊戲中播放）
        if (this.speechSynth) {
            this.speechSynth.cancel();
        }

        // 🔧 [Fix 1+4] 清除所有待執行的計時器（防止舊遊戲的 timer 觸發新遊戲的事件）
        QuantityComparisonGame.TimerManager.clearAll();

        // 核心遊戲狀態
        this.currentLevel = 1;
        this.totalLevels = 10;
        this.score = 0;
        this.correctAnswers = 0;
        this.totalAnswers = 0;

        // 自訂主題狀態
        this.state.startTime = null;
        this.state.isAnswering = false;
        this.gameState = 'idle';

        // 當前題目資料
        this.currentQuestion = null;
        this.timeRemaining = null;

        // 清除計時器
        QuantityComparisonGame.TimerManager.clearByCategory('timer');
        this.timer = null;

        // 🔧 [Fix 2+3] 重置競態條件防護旗標
        this.lastSpeakId = 0;
        this.easyModeResultShown = false;

        // 🔧 [Fix score] 每次重置遊戲時推進場次 ID，使舊場次的 Promise 回呼能夠識別自己已過期
        this.gameSessionId = (this.gameSessionId || 0) + 1;

        GameDebug.log('state', '🔄 遊戲狀態已重置', { gameSessionId: this.gameSessionId });
    }

    /**
     * 設置語音合成
     */
    setupSpeechSynthesis() {
        GameDebug.logSpeech('🎤 開始設置語音合成系統');
        
        if (!this.speechSynth) {
            GameDebug.logError('❌ 語音合成不可用', 'speechSynthesis 未定義');
            return;
        }
        
        const setVoice = () => {
            const voices = this.speechSynth.getVoices();
            GameDebug.logSpeech('🔍 檢測到語音', `共 ${voices.length} 個語音`);
            
            if (voices.length === 0) {
                GameDebug.logSpeech('⚠️ 暫無語音可用，等待載入');
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
            GameDebug.logSpeech(this.currentVoice ? `✅ 語音就緒: ${this.currentVoice.name}` : '❌ 找不到任何中文語音');
        };

        if (this.speechSynth.onvoiceschanged !== undefined) {
            this.speechSynth.onvoiceschanged = setVoice;
            GameDebug.logSpeech('📡 設置語音變更監聽器');
        }
        
        setVoice();
    }
    
    /**
     * 顯示設定畫面
     */
    showSettingsScreen() {
        AssistClick.deactivate();
        GameDebug.logUI('📋 顯示設定畫面');

        // 🔄 重置遊戲狀態
        this.resetGameState();

        const appContainer = document.getElementById('app');
        if (!appContainer) {
            GameDebug.logError('❌ 找不到 app 容器元素');
            return;
        }

        // 配置驅動的 UI 生成 (按照 CLAUDE.md 原則)
        // 配置驅動的設定選項生成（配合活動狀態）
        const setActiveState = (options, currentValue) => {
            return options.map(option => ({
                ...option,
                active: option.value === currentValue || (
                    // 處理自訂題目數量的特殊情況
                    option.value === 'custom' && typeof currentValue === 'number' && ![1, 5, 10, 15, 20].includes(currentValue)
                )
            }));
        };

        const config = {
            gameTitle: this.config.game.title,
            difficultyOptions: setActiveState(this.config.getSettingOptions('difficulty'), this.gameSettings.difficulty),
            comparisonModeOptions: setActiveState(this.config.getSettingOptions('comparisonMode'), this.gameSettings.comparisonMode),
            quantityRangeOptions: setActiveState(this.config.getSettingOptions('quantityRange'), this.gameSettings.quantityRange),
            questionCountOptions: setActiveState(this.config.getSettingOptions('questionCount'), this.gameSettings.questionCount),
            currentQuestionCount: this.gameSettings.questionCount, // 🔧 [新增] 傳遞當前題數值
            timeOptions: setActiveState(this.config.getSettingOptions('time'), this.gameSettings.time),
            testModeOptions: setActiveState(this.config.getSettingOptions('testMode'), this.gameSettings.testMode),
            soundOptions: setActiveState(this.config.getSettingOptions('sound'), this.gameSettings.sound),
            theme: this.gameSettings.theme,
            customItems: this.state.customItems || [],
            assistClick: this.gameSettings.assistClick,
            currentDifficulty: this.gameSettings.difficulty
        };
        
        GameDebug.logConfig('⚙️ 設定畫面配置生成完成', {
            gameTitle: config.gameTitle,
            optionsCount: {
                difficulty: config.difficultyOptions.length,
                quantityRange: config.quantityRangeOptions.length,
                questionCount: config.questionCountOptions.length,
                time: config.timeOptions.length,
                sound: config.soundOptions.length
            }
        });
        
        appContainer.innerHTML = this.templates.settingsScreen(config);
        this.updateStartButton();
        // 簡單模式下隱藏測驗模式選擇區塊（渲染後立即套用）
        this.updateTestModeVisibility(this.gameSettings.difficulty);

        // 👆 輔助點擊開關事件
        const assistOn = appContainer.querySelector('#assist-click-on');
        const assistOff = appContainer.querySelector('#assist-click-off');
        if (assistOn) {
            QuantityComparisonGame.EventManager.on(assistOn, 'click', (e) => {
                e.stopPropagation();
                this.gameSettings.assistClick = true;
                assistOn.classList.add('active');
                assistOff?.classList.remove('active');
            }, {}, 'gameUI');
        }
        if (assistOff) {
            QuantityComparisonGame.EventManager.on(assistOff, 'click', (e) => {
                e.stopPropagation();
                this.gameSettings.assistClick = false;
                assistOff.classList.add('active');
                assistOn?.classList.remove('active');
            }, {}, 'gameUI');
        }

        GameDebug.logUI('✅ 設定畫面渲染完成');
    }
    
    /**
     * 綁定事件監聽器
     */
    bindEvents() {
        // 🔧 [Bug修復] 使用 EventManager 統一管理事件監聽器
        // 使用事件委託處理所有按鈕點擊
        QuantityComparisonGame.EventManager.on(document.body, 'click', async (event) => {
            const target = event.target;
            
            // 🔍 詳細點擊事件除錯
            GameDebug.log('events', '🔍 點擊事件詳情', {
                target: target,
                tagName: target.tagName,
                className: target.className,
                classList: Array.from(target.classList || []),
                id: target.id,
                dataType: target.dataset?.type,
                dataValue: target.dataset?.value,
                hasSelectionBtnClass: target.classList.contains('selection-btn'),
                closestSelectionBtn: target.closest('.selection-btn')
            });
            
            if (target.classList.contains('selection-btn')) {
                GameDebug.log('events', '🎯 處理 selection-btn 點擊');
                this.handleSettingSelection(event);
            } else if (target.closest('.selection-btn')) {
                GameDebug.log('events', '🎯 處理子元素點擊，找到父級 selection-btn');
                this.handleSettingSelection(event);
            } else if (target.id === 'start-game-btn') {
                await this.startGame();
            } else if (target.closest('.comparison-btn')) {
                this.handleComparisonAnswer(event);
            } else if (target.id === 'next-btn') {
                await this.nextQuestion();
            } else if (target.id === 'complete-btn') {
                this.completeGame();
            } else {
                GameDebug.log('events', '🚫 未匹配任何處理器');
            }
        }, {}, 'gameUI');

        // 鍵盤快捷鍵
        QuantityComparisonGame.EventManager.on(document, 'keydown', (event) => {
            this.handleKeyPress(event);
        }, {}, 'gameUI');
        
        // 語音載入完成事件
        if (this.speechSynth && this.speechSynth.onvoiceschanged !== undefined) {
            this.speechSynth.onvoiceschanged = () => this.setupSpeechSynthesis();
        }

        // 🎁 獎勵系統連結事件監聽器
        QuantityComparisonGame.EventManager.on(document.body, 'click', (event) => {
            const rewardLink = event.target.closest('#settings-reward-link');
            if (rewardLink) {
                event.preventDefault();
                if (typeof RewardLauncher !== 'undefined') {
                        RewardLauncher.open();
                    } else {
                        window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                    }
            }

            const worksheetLink = event.target.closest('#settings-worksheet-link');
            if (worksheetLink) {
                event.preventDefault();
                // 作業單使用自己的預設值與工具列設定，不受遊戲設定影響
                const params = new URLSearchParams({ unit: 'f5' });
                window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
            }
        }, {}, 'gameUI');
    }

    /**
     * 處理設定選擇
     */
    handleSettingSelection(event) {
        // 🔓 解鎖手機音頻播放權限
        if (window.AudioUnlocker && !window.AudioUnlocker.isUnlocked) {
            window.AudioUnlocker.unlock();
        }
        
        const button = event.target.closest('.selection-btn'); // 修復：確保找到正確的按鈕元素
        if (!button) {
            GameDebug.log('events', '🚫 未找到 selection-btn 元素', {
                eventTarget: event.target,
                eventTargetTagName: event.target.tagName,
                eventTargetClass: event.target.className
            });
            return; // 防護子句：確保找到有效按鈕
        }
        
        const type = button.dataset.type;
        const value = button.dataset.value;
        
        GameDebug.log('events', '🔍 按鈕詳細資訊', {
            buttonElement: button,
            type,
            value,
            buttonInnerHTML: button.innerHTML,
            allDataAttributes: {...button.dataset}
        });
        
        GameDebug.logEvents('🎯 處理設定選擇', { type, value });
        
        // 🎯 特別針對數字範圍按鈕的音效除錯
        if (type === 'quantityRange') {
            GameDebug.log('audio', '🎮 🔢 數字範圍按鈕被點擊', {
                value,
                buttonText: button.textContent.trim(),
                timestamp: new Date().toLocaleTimeString(),
                audioContextState: window.audioContext ? window.audioContext.state : 'no context',
                gameSettings: this.gameSettings
            });
            
            // 檢查當前頁面的互動狀態
            GameDebug.log('audio', '🎮 📱 用戶互動狀態檢查', {
                documentHasFocus: document.hasFocus(),
                documentVisibilityState: document.visibilityState,
                audioUnlockerUnlocked: window.AudioUnlocker ? window.AudioUnlocker.isUnlocked : 'N/A',
                timeStamp: event.timeStamp,
                isTrusted: event.isTrusted
            });
        }
        
        // 配置驅動的音效播放 (按照 CLAUDE.md 原則)
        this.playSound('select');
        
        // UI 狀態更新
        const buttonGroup = button.parentElement;
        buttonGroup.querySelectorAll('.selection-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // 處理自訂選項
        GameDebug.log('events', '🎮 檢查是否為 custom 選項', {
            value,
            valueType: typeof value,
            type,
            typeType: typeof type,
            valueEqualsCustom: value === 'custom',
            typeEqualsQuantityRange: type === 'quantityRange'
        });
        
        if (value === 'custom') {
            GameDebug.log('events', '✅ 確認為 custom 選項，檢查 type');
            
            if (type === 'questionCount') {
                GameDebug.log('events', '🔢 處理自訂題目數量');
                GameDebug.logConfig('🔢 點擊自訂題目數量按鈕');
                this.showCustomQuestionCountInput();
                return;
            } else if (type === 'quantityRange') {
                GameDebug.log('events', '🎯 處理自訂數量範圍 - 準備顯示輸入器');
                GameDebug.logConfig('🎯 點擊自訂數量範圍按鈕');
                
                // 🔍 詳細狀態檢查，幫助除錯自訂範圍問題
                GameDebug.log('events', '🔍 自訂範圍詳細狀態檢查', {
                    currentDifficulty: this.gameSettings.difficulty,
                    currentComparisonMode: this.gameSettings.comparisonMode,
                    allSettings: { ...this.gameSettings },
                    buttonElement: button,
                    buttonDisabled: button.disabled,
                    buttonClasses: button.className
                });
                
                // 檢查 showRangeInput 方法是否存在
                GameDebug.log('events', '🔍 showRangeInput 方法檢查', {
                    methodExists: typeof this.showRangeInput === 'function',
                    methodType: typeof this.showRangeInput
                });
                
                GameDebug.log('events', '🚀 即將調用 showRangeInput，然後立即返回');

                const maxLimit = this.gameSettings.difficulty === 'hard' ? 1000 : 30;
                this.showRangeInput(`請輸入自訂數量範圍 (1-${maxLimit})`, (minVal, maxVal, feedbackDiv) => {
                    GameDebug.log('events', '📞 回調函數被調用', { minVal, maxVal });

                    if (minVal >= 1 && maxVal > minVal && maxVal <= maxLimit) {
                        // 建立自訂範圍配置
                        this.config.quantityRanges.custom.minQuantity = minVal;
                        this.config.quantityRanges.custom.maxQuantity = maxVal;
                        this.config.quantityRanges.custom.label = `${minVal}-${maxVal}`;

                        this.gameSettings.quantityRange = 'custom';
                        button.closest('.button-group').querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                        button.classList.add('active');
                        button.textContent = `${minVal}-${maxVal}`;
                        this.updateStartButton();
                        this.playSound('select');

                        GameDebug.log('events', '✅ 自訂範圍回調處理完成');
                        return true;
                    }
                    if (feedbackDiv) {
                        feedbackDiv.textContent = `⚠️ 請輸入有效範圍：最小值≥1，最大值≤${maxLimit}，且最大值>最小值`;
                        feedbackDiv.style.color = '#ff6b6b';
                    }
                    return false;
                }, maxLimit);
                
                GameDebug.log('events', '🛑 showRangeInput 已調用，現在返回避免繼續處理');
                return; // 重要：避免繼續執行通用設定處理邏輯
            }
        }
        
        // 儲存設定
        const previousValue = this.gameSettings[type];
        this.gameSettings[type] = value;

        // 🔧 [新增] 選擇預設題數時，隱藏自訂輸入框
        if (type === 'questionCount' && value !== 'custom') {
            const customDisplay = document.querySelector('.custom-question-display');
            const customInput = document.getElementById('custom-question-count-f5');
            if (customDisplay && customInput) {
                customDisplay.style.display = 'none';
                customInput.value = '';
                customInput.style.background = 'white';
                customInput.style.color = '#333';
                customInput.style.borderColor = '#ddd';
            }
        }

        GameDebug.logConfig('⚙️ 設定已更新', {
            type,
            previousValue,
            newValue: value,
            allSettings: { ...this.gameSettings }
        });

        // 如果是主題選擇，使用選擇性更新避免閃爍
        if (type === 'theme') {
            GameDebug.log('ui', '🎨 主題選擇，使用選擇性更新');
            this.updateCustomThemeSettings();
            this.updateStartButton(); // 🔧 修復: 更新開始按鈕狀態
            return;
        }

        // 如果是難度選擇，使用選擇性更新避免閃爍
        if (type === 'difficulty') {
            GameDebug.log('ui', '🎯 難度改變，使用選擇性更新', {
                newDifficulty: value,
                previousDifficulty: previousValue,
                needsThemeToggle: (value === 'hard') !== (previousValue === 'hard')
            });
            this.updateThemeButtonsState();
            // 🔧 [新增] 更新難度說明
            this.updateDifficultyDescription(value);
            // 簡單模式自動完成，不需選擇測驗模式；切換難度時同步顯示/隱藏
            this.updateTestModeVisibility(value);
            // 👆 輔助點擊：只在簡單模式顯示
            const assistGroup = document.getElementById('assist-click-group');
            if (assistGroup) assistGroup.style.display = value !== 'easy' ? 'none' : '';
            if (value !== 'easy') this.gameSettings.assistClick = false;
            // 切換難度時重置自訂範圍
            if (this.gameSettings.quantityRange === 'custom') {
                this.gameSettings.quantityRange = '1-10';
                this.config.quantityRanges.custom.minQuantity = null;
                this.config.quantityRanges.custom.maxQuantity = null;
                this.config.quantityRanges.custom.label = '自訂範圍';
                const customBtn = document.querySelector('[data-type="quantityRange"][data-value="custom"]');
                if (customBtn) {
                    customBtn.textContent = '自訂範圍';
                    customBtn.classList.remove('active');
                }
                const defaultBtn = document.querySelector('[data-type="quantityRange"][data-value="1-10"]');
                if (defaultBtn) defaultBtn.classList.add('active');
            }
            this.updateStartButton(); // 🔧 修復: 更新開始按鈕狀態
            return;
        }

        // 更新開始按鈕狀態
        this.updateStartButton();
    }

    /**
     * 更新測驗模式區塊的顯示狀態（簡單模式自動完成，不需選擇）
     */
    updateTestModeVisibility(difficulty) {
        const testModeGroup = document.querySelector('[data-setting-type="testMode"]')?.closest('.setting-group');
        if (!testModeGroup) return;

        if (difficulty === 'easy') {
            testModeGroup.style.display = 'none';
            // 自動設定 testMode 為 retry，確保遊戲邏輯正常運作
            this.gameSettings.testMode = 'retry';
        } else {
            testModeGroup.style.display = '';
        }
    }

    // 🔧 [新增] 處理點擊自訂題數輸入框
    handleCustomQuestionClick() {
        const customBtn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
        if (customBtn) {
            customBtn.click();
        }
    }

    /**
     * 更新開始按鈕狀態
     */
    updateStartButton() {
        const startBtn = document.getElementById('start-game-btn');
        if (!startBtn) return;

        const allSettingsComplete = this.config.validateSettings(this.gameSettings, this);

        GameDebug.log('ui', '🔍 開始按鈕狀態更新', {
            allSettingsComplete,
            currentSettings: { ...this.gameSettings },
            buttonText: allSettingsComplete ? '開始遊戲' : '請完成所有設定',
            buttonDisabled: !allSettingsComplete
        });

        if (allSettingsComplete) {
            startBtn.disabled = false;
            startBtn.textContent = '開始遊戲';
            startBtn.classList.add('ready');
        } else {
            startBtn.disabled = true;
            startBtn.textContent = '請完成所有設定';
            startBtn.classList.remove('ready');
        }
    }

    /**
     * 選擇性更新自訂主題設定區域（避免整頁重新渲染）
     */
    updateCustomThemeSettings() {
        GameDebug.log('ui', '🔄 選擇性更新自訂主題設定區域');

        // 找到主題選擇容器
        const themeContainer = document.querySelector('[data-setting-type="theme"]');
        if (!themeContainer) {
            GameDebug.warn('ui', '⚠️ 找不到主題選擇容器');
            return;
        }

        const parentGroup = themeContainer.closest('.setting-group');
        if (!parentGroup) {
            GameDebug.warn('ui', '⚠️ 找不到主題選擇群組');
            return;
        }

        // 生成新的主題選擇HTML
        const config = {
            ...this.gameSettings,
            difficultyOptions: [{ active: true, value: this.gameSettings.difficulty }],
            customItems: this.state.customItems
        };

        const newThemeHTML = this.templates.generateThemeSettingGroup(config);

        // 替換整個主題選擇群組
        parentGroup.outerHTML = newThemeHTML;

        // 重新綁定事件
        this.bindEvents();

        GameDebug.log('ui', '✅ 自訂主題設定區域更新完成');
    }

    /**
     * 更新主題按鈕狀態（當難度改變時顯示/隱藏主題選擇）
     */
    updateThemeButtonsState() {
        GameDebug.log('ui', '🔄 更新主題按鈕狀態');

        const currentDifficulty = this.gameSettings.difficulty;
        const themeGroup = document.querySelector('[data-setting-type="theme"]')?.closest('.setting-group');

        if (!themeGroup) {
            GameDebug.warn('ui', '⚠️ 找不到主題選擇群組');
            return;
        }

        // 困難模式隱藏主題選擇，其他模式顯示
        if (currentDifficulty === 'hard') {
            themeGroup.style.display = 'none';
            GameDebug.log('ui', '🚫 困難模式，隱藏主題選擇');
        } else {
            themeGroup.style.display = 'block';
            GameDebug.log('ui', '✅ 非困難模式，顯示主題選擇');
        }

        // 如果是困難模式，重設主題為預設值
        if (currentDifficulty === 'hard' && this.gameSettings.theme !== 'fruits') {
            this.gameSettings.theme = 'fruits';
            GameDebug.log('ui', '🔄 困難模式重設主題為水果');
        }
    }

    /**
     * 🔧 [新增] 更新難度說明顯示
     */
    updateDifficultyDescription(difficulty) {
        const descElement = document.getElementById('difficulty-description');
        if (descElement) {
            descElement.textContent = this.templates.getDifficultyDescription(difficulty);
        }
    }

    /**
     * 自訂題目數量輸入器（配置驅動，仿f3實現）
     */
    showCustomQuestionCountInput() {
        GameDebug.logConfig('🔢 準備顯示數字輸入器');
        this.showNumberInput('請輸入題目數量 (1-50)', (num) => {
            const count = parseInt(num);
            if (count >= 1 && count <= 50) {
                this.gameSettings.questionCount = count;

                // 更新按鈕狀態
                const btn = document.querySelector('[data-type="questionCount"][data-value="custom"]');
                if (btn) {
                    btn.closest('.button-group').querySelectorAll('.selection-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }

                // 🔧 [新增] 顯示自訂題數輸入框並套用藍色樣式（避免閃爍）
                const customDisplay = document.querySelector('.custom-question-display');
                const customInput = document.getElementById('custom-question-count-f5');
                if (customDisplay && customInput) {
                    customDisplay.style.display = 'block';
                    customInput.value = `${count}題`;
                    customInput.style.background = '#667eea';
                    customInput.style.color = 'white';
                    customInput.style.borderColor = '#667eea';
                }

                this.updateStartButton();

                GameDebug.logConfig('🔢 自訂題目數量', { count });
                return true;
            } else {
                alert('請輸入1-50之間的數字');
                return false;
            }
        });
    }
    
    /**
     * 通用數字輸入對話框（配置驅動，仿f3實現）
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
    }
    
    /**
     * 開始遊戲
     */
    async startGame() {
        // 防止重複調用
        if (this.gameState === 'playing') {
            GameDebug.logGameFlow('⚠️ 遊戲已在進行中，忽略重複調用');
            return;
        }

        GameDebug.performance.start('start-game');
        GameDebug.logGameFlow('🚀 開始遊戲');

        // 驗證設定完整性
        if (!this.config.validateSettings(this.gameSettings, this)) {
            GameDebug.logError('❌ 設定不完整，無法開始遊戲', this.gameSettings);
            return;
        }
        
        GameDebug.logConfig('✅ 設定驗證通過', this.gameSettings);
        
        // 配置驅動的音效播放
        this.playSound('click');
        this.gameState = 'playing';
        
        // 獲取遊戲配置 (按照 CLAUDE.md 配置驅動原則)
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        GameDebug.logConfig('🎮 遊戲配置生成完成', {
            difficulty: gameConfig.difficulty.label,
            quantityRange: `${gameConfig.quantityRange.minQuantity}-${gameConfig.quantityRange.maxQuantity}`,
            questionCount: gameConfig.questionCount.value,
            timeLimit: gameConfig.timeLimit.value,
            soundEnabled: gameConfig.sound.enabled
        });
        
        // 🔄 重置遊戲狀態
        this.resetGameState();
        this.totalLevels = gameConfig.questionCount.value;
        this.state.startTime = Date.now(); // 記錄開始時間
        window.LearningTracker?.resetWrong?.();   // 學習紀錄：錯誤/逐題計數歸零
        
        // 設置計時器
        if (gameConfig.timeLimit.value) {
            this.timeRemaining = gameConfig.timeLimit.value;
        }
        
        GameDebug.logGameFlow('🎯 遊戲狀態重置完成', {
            currentLevel: this.currentLevel,
            totalLevels: this.totalLevels,
            timeRemaining: this.timeRemaining
        });
        
        this.showGameScreen();
        if (this.gameSettings.difficulty === 'easy' && this.gameSettings.assistClick) {
            AssistClick.activate();
        }
        await this.generateQuestion();

        if (this.timeRemaining) {
            this.startTimer();
        }

        GameDebug.performance.end('start-game');
        GameDebug.logGameFlow('✅ 遊戲啟動完成');
    }
    
    /**
     * 顯示遊戲畫面
     */
    showGameScreen() {
        const appContainer = document.getElementById('app');
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        
        const config = {
            difficulty: gameConfig.difficulty.id,
            comparisonMode: gameConfig.comparisonMode ? gameConfig.comparisonMode.id : 'findLarger',
            levelTitle: `${this.config.game.title}`,
            currentLevel: this.currentLevel,
            totalLevels: this.totalLevels,
            score: this.score,
            timeDisplay: this.timeRemaining ? this.formatTime(this.timeRemaining) : '--',
            isHardMode: gameConfig.difficulty.id === 'hard'
        };
        
        appContainer.innerHTML = this.templates.gameScreen(config);
        appContainer.insertAdjacentHTML('beforeend', this.templates.gameStyles(config));
    }
    
    
    /**
     * 恢復容器顯示狀態（離開困難模式時使用）
     */
    restoreContainersVisibility() {
        // 檢查左側容器是否存在，如果不存在則重新建立
        let leftObjectsContainer = document.getElementById('left-objects');
        if (!leftObjectsContainer) {
            const leftGroup = document.getElementById('left-group');
            const leftQuantityDisplay = document.getElementById('left-quantity');
            if (leftGroup && leftQuantityDisplay) {
                leftObjectsContainer = document.createElement('div');
                leftObjectsContainer.className = 'objects-container';
                leftObjectsContainer.id = 'left-objects';
                // 插入到 left-quantity 之後，left-answer-btn 之前
                const leftAnswerBtn = document.getElementById('left-answer-btn');
                if (leftAnswerBtn) {
                    leftGroup.insertBefore(leftObjectsContainer, leftAnswerBtn);
                } else {
                    leftGroup.appendChild(leftObjectsContainer);
                }
                GameDebug.logUI('✅ 已重新建立 left-objects 容器');
            }
        } else {
            leftObjectsContainer.style.display = '';
            GameDebug.logUI('✅ 已恢復 left-objects 容器顯示');
        }
        
        // 檢查右側容器是否存在，如果不存在則重新建立
        let rightObjectsContainer = document.getElementById('right-objects');
        if (!rightObjectsContainer) {
            const rightGroup = document.getElementById('right-group');
            const rightQuantityDisplay = document.getElementById('right-quantity');
            if (rightGroup && rightQuantityDisplay) {
                rightObjectsContainer = document.createElement('div');
                rightObjectsContainer.className = 'objects-container';
                rightObjectsContainer.id = 'right-objects';
                // 插入到 right-quantity 之後，right-answer-btn 之前
                const rightAnswerBtn = document.getElementById('right-answer-btn');
                if (rightAnswerBtn) {
                    rightGroup.insertBefore(rightObjectsContainer, rightAnswerBtn);
                } else {
                    rightGroup.appendChild(rightObjectsContainer);
                }
                GameDebug.logUI('✅ 已重新建立 right-objects 容器');
            }
        } else {
            rightObjectsContainer.style.display = '';
            GameDebug.logUI('✅ 已恢復 right-objects 容器顯示');
        }
        
        // 恢復分組答案按鈕
        const leftAnswerBtn = document.getElementById('left-answer-btn');
        const rightAnswerBtn = document.getElementById('right-answer-btn');
        if (leftAnswerBtn) leftAnswerBtn.style.display = '';
        if (rightAnswerBtn) rightAnswerBtn.style.display = '';
    }

    /**
     * 生成題目
     */
    async generateQuestion() {
        GameDebug.performance.start('generate-question');
        GameDebug.logGeneration('🎲 開始生成題目', { level: this.currentLevel });
        
        // 每次生成新題目前，先恢復所有容器的顯示狀態
        this.restoreContainersVisibility();
        
        // 重置A、B組別的樣式（確保每題開始時都是乾淨狀態）
        this.resetGroupStyles();
        
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        const difficulty = gameConfig.difficulty;
        const quantityRange = gameConfig.quantityRange;
        
        GameDebug.logGeneration('📊 使用配置生成題目', {
            difficulty: difficulty.label,
            quantityRange: `${quantityRange.minQuantity}-${quantityRange.maxQuantity}`,
            objectTypes: difficulty.objectTypes
        });
        
        // 生成兩組物件的數量 (配置驅動)
        const quantities = this.generateQuantities(difficulty, quantityRange);
        const leftQuantity = quantities.left;
        const rightQuantity = quantities.right;
        
        GameDebug.logGeneration('🔢 數量生成完成', { leftQuantity, rightQuantity });
        
        // 根據比較模式確定正確答案
        const comparisonMode = this.gameSettings.comparisonMode;
        let correctAnswer;
        
        if (comparisonMode === 'findSmaller') {
            // 找出小的模式
            correctAnswer = 'less'; // 要求找出較小的組別
        } else if (comparisonMode === 'findLarger') {
            // 找出大的模式
            correctAnswer = 'more'; // 要求找出較大的組別
        } else if (comparisonMode === 'random') {
            // 隨機模式：隨機選擇找大或找小
            correctAnswer = Math.random() < 0.5 ? 'more' : 'less';
        } else {
            // 預設邏輯（向下相容）
            if (leftQuantity > rightQuantity) {
                correctAnswer = 'more';
            } else {
                correctAnswer = 'less';
            }
            // 不會有相同數量的情況
        }
        
        GameDebug.logGeneration('✅ 正確答案確定', { correctAnswer });
        
        // 使用選定的主題圖示 (配置驅動主題系統)
        const selectedTheme = this.gameSettings.theme;
        let themeIcons;
        
        if (selectedTheme === 'custom') {
            // 使用自訂主題
            themeIcons = this.state.customItems.map(item => item.icon);
            
            // 檢查自訂主題是否為空
            if (themeIcons.length === 0) {
                GameDebug.logError('自訂主題為空，回退到水果主題');
                themeIcons = this.config.themes.fruits;
            }
        } else {
            // 使用預設主題
            themeIcons = this.config.themes[selectedTheme] || this.config.themes.fruits;
        }
        
        // 選擇隨機圖示
        const selectedIcon = themeIcons[Math.floor(Math.random() * themeIcons.length)];
        
        GameDebug.logGeneration('🎨 主題圖示選定', {
            selectedTheme,
            selectedIcon: typeof selectedIcon === 'object' ? (selectedIcon.emoji || '物件') : (selectedIcon.length > 20 ? '自訂圖片' : selectedIcon),
            totalIcons: themeIcons.length,
            customItemsCount: this.state.customItems.length,
            configCustomThemeLength: this.config.themes.custom.length
        });
        
        // 創建題目物件
        this.currentQuestion = {
            leftQuantity,
            rightQuantity,
            correctAnswer,
            selectedTheme,
            selectedIcon,
            themeIcons,
            answered: false
        };
        
        GameDebug.logGeneration('📝 題目生成完成', this.currentQuestion);
        
        await this.renderQuestion();
        this.speakInstruction(difficulty);
        
        GameDebug.performance.end('generate-question');
    }
    
    /**
     * 生成數量組合
     */
    generateQuantities(difficulty, quantityRange) {
        const min = quantityRange.minQuantity;
        const max = quantityRange.maxQuantity;
        const diffConfig = this.config.difficultyDifferences[difficulty.id];
        
        let leftQuantity, rightQuantity;
        
        // 永遠生成不同數量，確保有大小差異
        leftQuantity = min + Math.floor(Math.random() * (max - min + 1));
        
        let attempts = 0;
        do {
            rightQuantity = min + Math.floor(Math.random() * (max - min + 1));
            attempts++;
        } while (
            attempts < 50 && 
            (leftQuantity === rightQuantity || // 確保數量不相同
             Math.abs(leftQuantity - rightQuantity) < diffConfig.minDifference ||
             Math.abs(leftQuantity - rightQuantity) > diffConfig.maxDifference)
        );
        
        // 如果嘗試50次都沒有找到合適的組合，強制生成不同數量
        if (leftQuantity === rightQuantity) {
            if (leftQuantity < max) {
                rightQuantity = leftQuantity + diffConfig.minDifference;
            } else {
                rightQuantity = leftQuantity - diffConfig.minDifference;
            }
        }
        
        return { left: leftQuantity, right: rightQuantity };
    }
    
    /**
     * 渲染題目
     */
    async renderQuestion() {
        const { leftQuantity, rightQuantity, selectedIcon } = this.currentQuestion;
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        
        GameDebug.logGameFlow('🎯 開始渲染題目', {
            difficulty: gameConfig.difficulty.id,
            testMode: gameConfig.testMode.id,
            allowRetry: gameConfig.testMode.allowRetry,
            fullTestMode: gameConfig.testMode
        });
        
        // 清空容器和數字
        document.getElementById('left-objects').innerHTML = '';
        document.getElementById('right-objects').innerHTML = '';
        document.getElementById('left-quantity').innerHTML = '';
        document.getElementById('right-quantity').innerHTML = '';

        // 清空答案按鈕
        const leftAnswerBtn = document.getElementById('left-answer-btn');
        const rightAnswerBtn = document.getElementById('right-answer-btn');
        if (leftAnswerBtn) leftAnswerBtn.innerHTML = '';
        if (rightAnswerBtn) rightAnswerBtn.innerHTML = '';
        GameDebug.logUI('🧹 已清空答案按鈕');

        // 清除上一題的動畫樣式
        const leftGroup = document.getElementById('left-group');
        const rightGroup = document.getElementById('right-group');
        this.clearGroupAnimationStyles(leftGroup);
        this.clearGroupAnimationStyles(rightGroup);
        GameDebug.logUI('🧹 已清除組別動畫樣式');

        // 🔧 [新增] 清除文字提示
        this.hideQuestionPrompt();

        // 🔧 [Fix 2+3] 每道新題目開始時重置語音競態旗標
        this.lastSpeakId = 0;
        this.easyModeResultShown = false;

        // 根據難度選擇渲染方式
        GameDebug.logGameFlow('🔍 條件檢查', {
            'difficulty.id': gameConfig.difficulty.id,
            'testMode.id': gameConfig.testMode.id,
            'testMode.allowRetry': gameConfig.testMode.allowRetry,
            'condition1': gameConfig.difficulty.id === 'normal',
            'isNormalMode': gameConfig.difficulty.id === 'normal'
        });
        
        if (gameConfig.difficulty.id === 'easy') {
            // 簡單模式：靜態渲染，使用者手動點擊各圖示（數數完成後自動判斷正確/錯誤）
            GameDebug.logGameFlow('🔥 進入簡單模式點擊計數渲染', {
                difficulty: gameConfig.difficulty.id,
                leftQuantity: leftQuantity,
                rightQuantity: rightQuantity
            });

            this.renderObjects('left-objects', leftQuantity, selectedIcon);
            this.renderObjects('right-objects', rightQuantity, selectedIcon);

            document.getElementById('left-quantity').innerHTML =
                this.templates.quantityDisplay(0, true);
            document.getElementById('right-quantity').innerHTML =
                this.templates.quantityDisplay(0, true);

            this.currentQuestion.leftClicked = 0;
            this.currentQuestion.rightClicked = 0;

            this.bindNormalTestClickEvents();

            const answerContainerEasy = document.getElementById('answer-buttons');
            if (answerContainerEasy) {
                answerContainerEasy.style.display = 'none';
            }
        } else if (gameConfig.difficulty.id === 'normal') {
            // 普通模式測驗：顯示可點擊圖示，數字從0開始
            GameDebug.logGameFlow('🔥 SUCCESS: 進入普通模式測驗渲染', {
                difficulty: gameConfig.difficulty.id,
                allowRetry: gameConfig.testMode.allowRetry,
                leftQuantity: leftQuantity,
                rightQuantity: rightQuantity
            });
            
            this.renderObjects('left-objects', leftQuantity, selectedIcon);
            this.renderObjects('right-objects', rightQuantity, selectedIcon);
            
            // 數字從0開始顯示
            document.getElementById('left-quantity').innerHTML = 
                this.templates.quantityDisplay(0, true);
            document.getElementById('right-quantity').innerHTML = 
                this.templates.quantityDisplay(0, true);
            
            GameDebug.logGameFlow('🔢 已設置數字為0', {
                leftHTML: document.getElementById('left-quantity').innerHTML,
                rightHTML: document.getElementById('right-quantity').innerHTML
            });
            
            // 儲存實際數量用於點擊驗證
            this.currentQuestion.leftQuantity = leftQuantity;
            this.currentQuestion.rightQuantity = rightQuantity;
            this.currentQuestion.leftClicked = 0;
            this.currentQuestion.rightClicked = 0;
            
            // 綁定圖示點擊事件
            this.bindNormalTestClickEvents();
            
            // 隱藏答案按鈕直到數數完成
            const answerContainer = document.getElementById('answer-buttons');
            if (answerContainer) {
                answerContainer.style.display = 'none';
            }
        } else if (gameConfig.difficulty.id === 'hard') {
            // 困難模式：純數字顯示
            GameDebug.logGameFlow('🔥 SUCCESS: 進入困難模式純數字渲染', {
                difficulty: gameConfig.difficulty.id,
                leftQuantity: leftQuantity,
                rightQuantity: rightQuantity
            });
            
            // 完全移除圖示容器（objects-container 就是空白虛線框）
            const leftObjectsContainer = document.getElementById('left-objects');
            const rightObjectsContainer = document.getElementById('right-objects');
            
            if (leftObjectsContainer) {
                leftObjectsContainer.remove();
                GameDebug.logUI('🚫 已完全移除 left-objects 容器');
            }
            if (rightObjectsContainer) {
                rightObjectsContainer.remove();
                GameDebug.logUI('🚫 已完全移除 right-objects 容器');
            }
            
            // 只顯示數字
            document.getElementById('left-quantity').innerHTML = 
                this.templates.quantityDisplay(leftQuantity, true);
            document.getElementById('right-quantity').innerHTML = 
                this.templates.quantityDisplay(rightQuantity, true);
            
            // 隱藏分組答案按鈕區域
            const leftAnswerBtn = document.getElementById('left-answer-btn');
            const rightAnswerBtn = document.getElementById('right-answer-btn');
            if (leftAnswerBtn) leftAnswerBtn.style.display = 'none';
            if (rightAnswerBtn) rightAnswerBtn.style.display = 'none';
            
            // 準備數字輸入器 (語音播放完後顯示)
            this.prepareNumberInput();
        } else {
            // 其他模式：使用標準渲染
            GameDebug.logGameFlow('📋 執行標準渲染模式', {
                difficulty: gameConfig.difficulty.id,
                testMode: gameConfig.testMode.id,
                allowRetry: gameConfig.testMode.allowRetry
            });
            
            this.renderObjects('left-objects', leftQuantity, selectedIcon);
            this.renderObjects('right-objects', rightQuantity, selectedIcon);
            
            // 是否顯示數量
            if (gameConfig.difficulty.showNumbers) {
                document.getElementById('left-quantity').innerHTML = 
                    this.templates.quantityDisplay(leftQuantity, true);
                document.getElementById('right-quantity').innerHTML = 
                    this.templates.quantityDisplay(rightQuantity, true);
            }
        }
        
        // 重置答案按鈕狀態
        document.querySelectorAll('.comparison-btn').forEach(btn => {
            btn.classList.remove('selected', 'correct', 'incorrect');
            btn.disabled = false;
        });
        
        // 清除訊息和下一題按鈕
        const messageArea = document.getElementById('message-area');
        const nextContainer = document.getElementById('next-container');
        if (messageArea) messageArea.innerHTML = '';
        if (nextContainer) nextContainer.innerHTML = '';
    }
    
    /**
     * 🔧 圖示渲染輔助函數
     * 支援純 emoji 字串（向後相容）和物件格式 { emoji, image }
     * @param {string|object} item - emoji 字串或 { emoji, image } 物件
     * @param {string} size - CSS 尺寸（如 '40px', '1em'）
     * @returns {string} HTML 字串
     */
    getIconHtml(item, size = '40px') {
        // 1. 純字串（向後相容）：直接返回
        if (typeof item === 'string') {
            // 檢查是否為自訂圖片 (base64 格式)
            if (item.startsWith('data:image/')) {
                return `<img src="${item}" alt="自訂圖示" style="width: ${size}; height: ${size}; object-fit: cover; border-radius: 5px; pointer-events: none; user-select: none;">`;
            }
            // 純 emoji 字串
            return item;
        }

        // 2. 物件格式 { emoji } - 只使用 emoji，不載入外部圖片
        if (item && typeof item === 'object') {
            return item.emoji || '';
        }

        // 3. 其他情況返回空字串
        return '';
    }

    /**
     * 渲染物件
     */
    renderObjects(containerId, quantity, selectedIcon) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 設定data-count屬性供CSS Grid使用
        container.setAttribute('data-count', quantity);

        // 生成物件內容 - 使用 getIconHtml 輔助函數
        const objects = [];
        for (let i = 0; i < quantity; i++) {
            const content = this.getIconHtml(selectedIcon, '40px');
            objects.push(`<div class="object-item">${content}</div>`);
        }

        container.innerHTML = objects.join('');
    }
    
    /**
     * 渲染物件 (舊版本 - 保留作為備用)
     */
    renderObjectsOld(containerId, quantity, objectConfig) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // 生成物件內容
        const objects = [];
        for (let i = 0; i < quantity; i++) {
            let content;
            if (objectConfig.emoji) {
                content = objectConfig.emoji;
            } else if (objectConfig.shapes) {
                content = objectConfig.shapes[i % objectConfig.shapes.length];
            } else if (objectConfig.icons) {
                content = objectConfig.icons[i % objectConfig.icons.length];
            } else {
                content = '●';
            }
            objects.push(content);
        }
        
        // 生成排列位置
        const arrangement = objectConfig.arrangement || 'random';
        const containerWidth = container.offsetWidth || 300;
        const containerHeight = container.offsetHeight || 200;
        let positions;
        
        switch (arrangement) {
            case 'grid':
                positions = this.templates.generateGridArrangement(objects, containerWidth, containerHeight);
                break;
            case 'line':
                positions = this.templates.generateLineArrangement(objects, containerWidth, containerHeight);
                break;
            default:
                positions = this.templates.generateRandomArrangement(objects, containerWidth, containerHeight);
        }
        
        // 生成 HTML
        container.innerHTML = objects.map((content, index) => 
            this.templates.objectItem(
                objectConfig.id,
                content,
                index,
                positions[index]
            )
        ).join('');
        
        // 設置容器為相對定位
        container.style.position = 'relative';
        container.style.height = '200px';
    }

    /**
     * 同步動畫渲染物件（用於簡單模式）
     */
    async renderObjectsAnimated(leftQuantity, rightQuantity, selectedIcon) {
        GameDebug.logAnimation('🎬 開始同步動畫渲染', {
            leftQuantity,
            rightQuantity,
            selectedIcon: typeof selectedIcon === 'object' ? (selectedIcon.emoji || '物件') : (selectedIcon.length > 20 ? '自訂圖片' : selectedIcon)
        });

        // 獲取相關 DOM 元素
        const leftContainer = document.getElementById('left-objects');
        const rightContainer = document.getElementById('right-objects');
        const leftQuantityDisplay = document.getElementById('left-quantity');
        const rightQuantityDisplay = document.getElementById('right-quantity');

        // 清空容器和數字顯示
        leftContainer.innerHTML = '';
        rightContainer.innerHTML = '';
        leftQuantityDisplay.innerHTML = this.templates.quantityDisplay(0, true);
        rightQuantityDisplay.innerHTML = this.templates.quantityDisplay(0, true);
        
        // 設定data-count屬性供CSS Grid使用
        leftContainer.setAttribute('data-count', leftQuantity);
        rightContainer.setAttribute('data-count', rightQuantity);

        const maxQuantity = Math.max(leftQuantity, rightQuantity);
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        const animationInterval = gameConfig.difficulty.timing?.animationInterval || 50; // 統一動畫間隔到0.05秒
        
        // 異步迴圈，逐一顯示圖示並播放語音
        for (let i = 0; i < maxQuantity; i++) {
            const currentCount = i + 1;
            const showLeft = currentCount <= leftQuantity;
            const showRight = currentCount <= rightQuantity;
            
            // 1. 顯示圖示 - 使用 getIconHtml 輔助函數
            if (showLeft) {
                const content = this.getIconHtml(selectedIcon, '40px');
                leftContainer.insertAdjacentHTML('beforeend', `<div class="object-item">${content}</div>`);
            }

            if (showRight) {
                const content = this.getIconHtml(selectedIcon, '40px');
                rightContainer.insertAdjacentHTML('beforeend', `<div class="object-item">${content}</div>`);
            }

            // 2. 更新數字顯示
            if (showLeft) {
                leftQuantityDisplay.innerHTML = this.templates.quantityDisplay(currentCount, true);
            }
            if (showRight) {
                rightQuantityDisplay.innerHTML = this.templates.quantityDisplay(currentCount, true);
            }

            // 3. 播放數字語音並等待其完成
            const countNumberText = String(currentCount);
            await this.speak(countNumberText, { delay: 0 }); // 立即播放，無延遲

            // 4. 等待下一個圖示的顯示間隔
            if (currentCount < maxQuantity) {
                await new Promise(resolve => setTimeout(resolve, animationInterval));
            }
        }
        
        // 等待所有圖示動畫播放完畢
        await new Promise(resolve => setTimeout(resolve, 500));

        GameDebug.logAnimation('✅ 同步動畫渲染完成', { totalObjects: maxQuantity });

        // 簡單模式：動畫完成後顯示正確答案按鈕
        if (gameConfig.difficulty.id === 'easy') {
            await this.showCorrectButtonAfterCounting();
        }
    }

    /**
     * 簡單模式：數數完成後讓組別可點擊
     */
    async showCorrectButtonAfterCounting() {
        GameDebug.logAnimation('🎯 簡單模式：準備讓組別可點擊');
        
        // 數數完成後立即進入選擇階段，不需要等待
        
        const leftGroup = document.getElementById('left-group');
        const rightGroup = document.getElementById('right-group');
        
        if (leftGroup && rightGroup) {
            // 清除原有的任何按鈕
            const buttonsContainer = document.querySelector('.answer-buttons');
            if (buttonsContainer) {
                buttonsContainer.innerHTML = '';
            }
            
            // 讓組別可點擊
            leftGroup.classList.add('clickable-group');
            rightGroup.classList.add('clickable-group');
            
            // 綁定點擊事件（使用統一方法避免重複綁定）
            this.bindGroupClickEvents();
            
            // 根據比較模式播放語音提示
            const gameConfig = this.config.getGameConfig(this.gameSettings);
            const comparisonMode = this.gameSettings.comparisonMode;
            
            if (comparisonMode && this.config.comparisonModes[comparisonMode]) {
                let instruction = this.config.comparisonModes[comparisonMode].instruction;
                
                // 隨機模式需要根據當前題目動態生成指令
                if (comparisonMode === 'random' && this.currentQuestion) {
                    if (this.currentQuestion.correctAnswer === 'more') {
                        instruction = this.config.comparisonModes.findLarger.instruction;
                    } else if (this.currentQuestion.correctAnswer === 'less') {
                        instruction = this.config.comparisonModes.findSmaller.instruction;
                    }
                }
                
                if (instruction) {
                    // 🔧 [新增] 同時顯示文字動畫提示
                    this.showQuestionPrompt(instruction);

                    // 🔧 [修復] 簡單模式：語音播放完成後觸發視覺提示
                    this.speak(instruction).then(() => {
                        // 語音播放完成後添加視覺效果
                        const selectedOption = this.currentQuestion.correctAnswer;
                        this.addVisualEffects(selectedOption);
                        GameDebug.logAnimation('✅ 簡單模式語音完成，已添加視覺提示', { selectedOption });
                    });
                } else {
                    // 預設語音
                    const defaultPrompt = '請點擊正確的組別';
                    this.showQuestionPrompt(defaultPrompt);

                    this.speak(defaultPrompt).then(() => {
                        // 語音播放完成後添加視覺效果
                        const selectedOption = this.currentQuestion.correctAnswer;
                        this.addVisualEffects(selectedOption);
                        GameDebug.logAnimation('✅ 簡單模式預設語音完成，已添加視覺提示', { selectedOption });
                    });
                }
            } else {
                // 預設語音
                const defaultPrompt = '請點擊正確的組別';
                this.showQuestionPrompt(defaultPrompt);

                this.speak(defaultPrompt).then(() => {
                    // 語音播放完成後添加視覺效果
                    const selectedOption = this.currentQuestion.correctAnswer;
                    this.addVisualEffects(selectedOption);
                    GameDebug.logAnimation('✅ 簡單模式預設語音完成，已添加視覺提示', { selectedOption });
                });
            }
            
            GameDebug.logAnimation('✅ 已讓組別可點擊', { 
                comparisonMode,
                leftQuantity: this.currentQuestion.leftQuantity,
                rightQuantity: this.currentQuestion.rightQuantity
            });
        }
    }
    
    /**
     * 處理組別選擇（簡單模式）
     */
    handleGroupSelection(selectedGroup) {
        // 🔧 [Fix score] 記錄當前場次，防止舊場次回呼污染新遊戲
        const mySessionId = this.gameSessionId;

        // 🔧 [防連點] 檢查是否正在處理答題
        if (this.state.isAnswering) {
            GameDebug.logEvents('[F5] 防抖：handleGroupSelection 忽略重複點擊');
            return;
        }
        this.state.isAnswering = true;

        GameDebug.logEvents('🎯 處理組別選擇', {
            selectedGroup,
            leftQuantity: this.currentQuestion.leftQuantity,
            rightQuantity: this.currentQuestion.rightQuantity,
            comparisonMode: this.gameSettings.comparisonMode
        });

        // 立即移除可點擊狀態和事件監聽器（防止重複觸發）
        const leftGroup = document.getElementById('left-group');
        const rightGroup = document.getElementById('right-group');
        
        if (leftGroup && rightGroup) {
            leftGroup.classList.remove('clickable-group');
            rightGroup.classList.remove('clickable-group');
            this.unbindGroupClickEvents();
        }
        
        // 根據比較模式判斷答案是否正確
        const { leftQuantity, rightQuantity } = this.currentQuestion;
        const comparisonMode = this.gameSettings.comparisonMode;
        let isCorrect = false;
        
        if (comparisonMode === 'findSmaller') {
            // 找出數量較少的組
            isCorrect = (selectedGroup === 'left' && leftQuantity < rightQuantity) || 
                       (selectedGroup === 'right' && rightQuantity < leftQuantity);
        } else if (comparisonMode === 'findLarger') {
            // 找出數量較多的組
            isCorrect = (selectedGroup === 'left' && leftQuantity > rightQuantity) || 
                       (selectedGroup === 'right' && rightQuantity > leftQuantity);
        } else if (comparisonMode === 'random') {
            // 隨機模式，根據當前題目的正確答案判斷
            const correctAnswer = this.currentQuestion.correctAnswer;
            if (correctAnswer === 'more') {
                isCorrect = (selectedGroup === 'left' && leftQuantity > rightQuantity) || 
                           (selectedGroup === 'right' && rightQuantity > leftQuantity);
            } else if (correctAnswer === 'less') {
                isCorrect = (selectedGroup === 'left' && leftQuantity < rightQuantity) || 
                           (selectedGroup === 'right' && rightQuantity < leftQuantity);
            }
        }
        
        // 計算對方組別 + 取得測驗模式設定
        const otherGroup = selectedGroup === 'left' ? 'right' : 'left';
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        const testMode = gameConfig.testMode;

        // 學習紀錄：逐題明細（題目＝比較組合）
        window.LearningTracker?.logStep?.(
            `第${this.currentLevel || '?'}題：比較 ${leftQuantity} 與 ${rightQuantity}`, isCorrect);

        // 立即顯示動畫效果和播放音效
        if (isCorrect) {
            // 答對：✓ 顯示在點擊組上方，✕ 顯示在對方組上方（讓兩組都有明確回饋）
            this.showCorrectGroupAnimation(selectedGroup);
            this.showIncorrectGroupAnimation(otherGroup, false); // 不自動清除，下一題渲染時 DOM 會重整
            this.playSound('correct');
            // 🔧 [修復] 簡單模式：增加總答題數計數
            this.totalAnswers++;
            this.handleCorrectAnswer();
        } else {
            // 答錯：✕ 顯示在點擊組上方，✓ 顯示在正確組上方（讓使用者知道正確答案）
            // retry 模式自動清除（700ms），single-test 保留至下一題
            this.showIncorrectGroupAnimation(selectedGroup, testMode.allowRetry);
            this.showCorrectGroupAnimation(otherGroup);
            window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
            this.playSound('incorrect');
            // 🔧 [修復] 簡單模式：增加總答題數計數
            this.totalAnswers++;

            if (testMode.allowRetry) {
                // 反覆作答模式：播放語音 + 2秒後重新啟用組別點擊
                this.handleIncorrectAnswer();

                QuantityComparisonGame.TimerManager.setTimeout(() => {
                    const leftGroup = document.getElementById('left-group');
                    const rightGroup = document.getElementById('right-group');

                    if (leftGroup && rightGroup) {
                        // 先清除所有動畫樣式（包括錯誤動畫）
                        this.clearGroupAnimationStyles(leftGroup);
                        this.clearGroupAnimationStyles(rightGroup);

                        // 恢復可點擊狀態
                        leftGroup.classList.add('clickable-group');
                        rightGroup.classList.add('clickable-group');

                        // 重新綁定點擊事件（使用統一方法避免重複綁定）
                        this.bindGroupClickEvents();

                        // 🔧 [防連點] 重置 isAnswering 允許重新作答
                        this.state.isAnswering = false;

                        GameDebug.logEvents('🔄 反覆作答模式：已恢復組別可點擊狀態和樣式');
                    }
                }, 2000, 'animation'); // 2秒後恢復
            } else {
                // 單次作答模式：等語音完成後自動進入下一題（修復：之前此路徑缺少進題邏輯）
                this.handleIncorrectAnswer().then(() => {
                    if (mySessionId !== this.gameSessionId) return; // 舊場次回呼，略過
                    QuantityComparisonGame.TimerManager.setTimeout(() => {
                        if (mySessionId !== this.gameSessionId) return;
                        if (this.currentLevel >= this.totalLevels) {
                            this.completeGame();
                        } else {
                            this.nextQuestion();
                        }
                    }, 1000, 'turnTransition');
                });
            }
        }

        // 🔧 [防連點] 正確答案或 retry 模式：短暫後重置（single-test 錯誤由下一題接管）
        if (!testMode.allowRetry || isCorrect) {
            QuantityComparisonGame.TimerManager.setTimeout(() => {
                this.state.isAnswering = false;
            }, 500, 'debounce');
        }
    }
    
    /**
     * 處理比較答案
     */
    handleComparisonAnswer(event) {
        // 🔧 [防連點] 檢查是否正在處理答題
        if (this.state.isAnswering) {
            GameDebug.logEvents('[F5] 防抖：忽略重複點擊（isAnswering=true）');
            return;
        }
        this.state.isAnswering = true;

        // 配置驅動的重複答題檢查 (按照 CLAUDE.md 原則)
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        const testMode = gameConfig.testMode;
        
        if (this.currentQuestion.answered && !testMode.allowRetry) {
            GameDebug.logEvents('⚠️ 重複答題，忽略', { testMode: testMode.id });
            return;
        }
        
        const button = event.target.closest('.comparison-btn');
        if (!button) {
            GameDebug.logError('❌ 無效的比較按鈕');
            return;
        }

        // 🔧 [Fix score] 記錄當前場次，防止舊場次回呼污染新遊戲
        const mySessionId = this.gameSessionId;

        const selectedAnswer = button.dataset.comparison;
        
        GameDebug.logEvents('🎯 處理比較答案', {
            selectedAnswer,
            correctAnswer: this.currentQuestion.correctAnswer,
            leftQuantity: this.currentQuestion.leftQuantity,
            rightQuantity: this.currentQuestion.rightQuantity
        });
        
        // 配置驅動的音效播放
        this.playSound('select');
        
        // 標記按鈕為已選擇
        document.querySelectorAll('.comparison-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        button.classList.add('selected');

        // 檢查答案
        const isCorrect = selectedAnswer === this.currentQuestion.correctAnswer;

        // 學習紀錄：逐題明細（困難模式比較按鈕）
        window.LearningTracker?.logStep?.(
            `第${this.currentLevel || '?'}題：比較 ${this.currentQuestion.leftQuantity} 與 ${this.currentQuestion.rightQuantity}`, isCorrect);
        
        GameDebug.logScoring('📊 答題統計更新', {
            isCorrect,
            selectedAnswer,
            correctAnswer: this.currentQuestion.correctAnswer,
            testMode: testMode.id,
            currentLevel: this.currentLevel
        });
        
        if (isCorrect) {
            // 正確答案：所有模式都標記為已答題並計分
            this.currentQuestion.answered = true;
            this.totalAnswers++;

            // 禁用所有按鈕
            document.querySelectorAll('.comparison-btn').forEach(btn => {
                btn.disabled = true;
            });

            // 非簡單模式：等語音播放完畢後再進入下一題（簡單模式在 handleCorrectAnswer 的 .then() 中處理）
            if (gameConfig.difficulty.id !== 'easy') {
                const testMode = gameConfig.testMode;
                GameDebug.logGameFlow('⏳ 正確答案：等語音完成後進入下一題', { testMode: testMode.id });

                this.handleCorrectAnswer(button).then(() => {
                    if (mySessionId !== this.gameSessionId) return; // 舊場次回呼，略過
                    QuantityComparisonGame.TimerManager.setTimeout(() => {
                        if (mySessionId !== this.gameSessionId) return;
                        // 反覆作答模式：直接進入下一題；單次作答模式：顯示下一題按鈕
                        if (testMode.allowRetry) {
                            if (this.currentLevel < this.totalLevels) {
                                this.nextQuestion();
                            } else {
                                this.completeGame();
                            }
                        } else {
                            this.showNextButton();
                        }
                    }, 500, 'turnTransition');
                });
            } else {
                this.handleCorrectAnswer(button);
            }

        } else {
            // 錯誤答案：根據測驗模式處理
            if (testMode.allowRetry) {
                // 反複作答模式：不標記為已答題，允許重新回答
                this.handleIncorrectAnswer(button);

                // 重置按鈕選擇狀態，允許重新選擇
                QuantityComparisonGame.TimerManager.setTimeout(() => {
                    document.querySelectorAll('.comparison-btn').forEach(btn => {
                        btn.classList.remove('selected', 'correct', 'incorrect');
                        btn.disabled = false;
                    });
                    // 🔧 [防連點] 重置 isAnswering 允許重新作答
                    this.state.isAnswering = false;
                }, 1500, 'animation');

                GameDebug.logGameFlow('🔄 反複作答模式：允許重新回答');

            } else {
                // 單次作答模式：標記為已答題，等語音完成後進入下一題
                this.currentQuestion.answered = true;
                this.totalAnswers++;

                // 禁用所有按鈕
                document.querySelectorAll('.comparison-btn').forEach(btn => {
                    btn.disabled = true;
                });

                GameDebug.logGameFlow('⏳ 單次作答模式錯誤：等語音完成後進入下一題');

                this.handleIncorrectAnswer(button).then(() => {
                    if (mySessionId !== this.gameSessionId) return; // 舊場次回呼，略過
                    // 語音完成後立即顯示正確答案（視覺反饋）
                    if (testMode.showCorrectAnswer) {
                        this.showCorrectAnswer();
                    }
                    // 短暫停留後進入下一題
                    QuantityComparisonGame.TimerManager.setTimeout(() => {
                        if (mySessionId !== this.gameSessionId) return;
                        if (this.currentLevel >= this.totalLevels) {
                            this.completeGame();
                        } else {
                            this.showNextButton();
                        }
                    }, 1500, 'turnTransition');
                });
            }
        }

        // 🔧 [防連點] 對於非 retry 模式，在處理完成後重置（正確答案或單次模式錯誤）
        // 因為按鈕已被禁用，所以直接重置即可
        if (!testMode.allowRetry || isCorrect) {
            QuantityComparisonGame.TimerManager.setTimeout(() => {
                this.state.isAnswering = false;
            }, 500, 'debounce');
        }
    }

    /**
     * 處理正確答案
     */
    handleCorrectAnswer(button) {
        GameDebug.logScoring('✅ 處理正確答案');
        
        // 如果有按鈕參數才添加樣式
        if (button && button.classList) {
            button.classList.add('correct');
        }
        
        this.correctAnswers++;
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        const points = gameConfig.difficulty.scoring.correctAnswer;
        this.score += points;
        
        GameDebug.logScoring('📈 分數更新', {
            pointsEarned: points,
            totalScore: this.score,
            correctAnswers: this.correctAnswers,
            accuracy: this.totalAnswers > 0 ? Math.round((this.correctAnswers / this.totalAnswers) * 100) : 0
        });
        
        this.updateGameInfo();
        
        // 配置驅動的音效和語音 (按照 CLAUDE.md 原則)
        this.playSound('correct');
        this.startFireworksAnimation();
        
        // 顯示成功訊息
        const messageArea = document.getElementById('message-area');
        if (messageArea) {
            messageArea.innerHTML = this.templates.messageDisplay(
                'success', 
                gameConfig.difficulty.speechTemplates.correct
            );
        }
        
        // 簡單模式：播放完整按鈕文字的語音，完成後觸發下一題
        if (gameConfig.difficulty.id === 'easy') {
            const { leftQuantity, rightQuantity } = this.currentQuestion;
            const selectedOption = this.currentQuestion.correctAnswer;
            
            let optionText;
            if (selectedOption === 'more') {
                optionText = leftQuantity > rightQuantity ? 'A組較多' : 'B組較多';
            } else {
                optionText = leftQuantity > rightQuantity ? 'B組較少' : 'A組較少';
            }
            // 不會有「一樣多」的情況
            
            // 播放語音並在完成後處理下一題
            const mySessionId = this.gameSessionId; // 🔧 [Fix score] 記錄當前場次
            this.speak(optionText).then(() => {
                if (mySessionId !== this.gameSessionId) return; // 舊場次回呼，略過
                // 添加視覺動畫效果
                this.addVisualEffects(selectedOption);
                QuantityComparisonGame.TimerManager.setTimeout(() => {
                    if (mySessionId !== this.gameSessionId) return;
                    const testMode = gameConfig.testMode;
                    // 反覆作答模式：直接進入下一題；單次作答模式：顯示下一題按鈕
                    if (testMode.allowRetry) {
                        // 反覆作答模式：直接進入下一題
                        if (this.currentLevel < this.totalLevels) {
                            this.nextQuestion();
                        } else {
                            this.completeGame();
                        }
                    } else {
                        // 單次作答模式：顯示下一題按鈕
                        this.showNextButton();
                    }
                }, 1000, 'turnTransition');
            });
        } else {
            // 其他模式使用配置驅動的語音模板（回傳 Promise，讓呼叫端可在語音完成後繼續）
            return this.speak(gameConfig.difficulty.speechTemplates.correct);
        }
    }

    /**
     * 顯示文字動畫提示 (修正版：穩定顯示，無額外動畫)
     */
    showQuestionPrompt(promptText) {
        GameDebug.logAnimation('📝 顯示文字提示', { promptText });
        const promptElement = document.getElementById('prompt-text');

        if (promptElement) {
            // 1. 設定提示文字
            promptElement.textContent = promptText;

            // 2. 確保移除舊的動畫 class，讓狀態保持乾淨
            promptElement.classList.remove('highlight');

            // 3. 僅添加 'show' class 來觸發 CSS transition，讓文字淡入並保持顯示
            //    不再有任何 setTimeout 來添加後續的 highlight 動畫
            promptElement.classList.add('show');

        } else {
            GameDebug.logError('❌ 找不到 prompt-text 元素！');
        }
    }

    /**
     * 隱藏文字動畫提示 (修正版：移除 setTimeout，防止競爭條件)
     */
    hideQuestionPrompt() {
        const promptElement = document.getElementById('prompt-text');
        if (promptElement) {
            // 只移除 class 來觸發淡出動畫。
            // 不再設定 setTimeout 或手動清空文字，
            // 因為下一次呼叫 showQuestionPrompt 時會自然地覆蓋文字內容。
            promptElement.classList.remove('show', 'highlight');
            GameDebug.logAnimation('🧹 隱藏文字提示');
        }
    }

    /**
     * 添加視覺動畫效果：淡化非重點組別，強調重點組別
     */
    addVisualEffects(selectedOption) {
        const leftGroup = document.getElementById('left-group');
        const rightGroup = document.getElementById('right-group');

        if (!leftGroup || !rightGroup) return;

        const { leftQuantity, rightQuantity } = this.currentQuestion;

        if (selectedOption === 'more') {
            // 較多的組別強調，較少的組別淡化
            if (leftQuantity > rightQuantity) {
                this.emphasizeGroup(leftGroup);
                this.fadeGroup(rightGroup);
            } else {
                this.emphasizeGroup(rightGroup);
                this.fadeGroup(leftGroup);
            }
        } else if (selectedOption === 'less') {
            // 較少的組別強調，較多的組別淡化
            if (leftQuantity < rightQuantity) {
                this.emphasizeGroup(leftGroup);
                this.fadeGroup(rightGroup);
            } else {
                this.emphasizeGroup(rightGroup);
                this.fadeGroup(leftGroup);
            }
        } else {
            // 一樣多時，兩組都強調
            this.emphasizeGroup(leftGroup);
            this.emphasizeGroup(rightGroup);
        }
    }

    /**
     * 強調組別動畫 - 🔧 [改善] 使用框線閃爍和微幅縮放
     */
    emphasizeGroup(groupElement) {
        // 🔧 [修復] 恢復微幅縮放動畫配合框線顏色變換
        groupElement.style.animation = 'hint-border-flash 1.5s ease-in-out infinite';
        groupElement.style.border = '5px solid #ff6b6b';
        groupElement.style.borderRadius = '10px';
        groupElement.style.zIndex = '10';
        groupElement.style.transition = 'all 0.3s ease';
    }

    /**
     * 淡化組別動畫 - 🔧 [改善] 使用微幅縮小和透明度變化
     */
    fadeGroup(groupElement) {
        // 🔧 [修復] 恢復微幅縮小和透明度變化
        groupElement.style.transform = 'scale(0.95)';
        groupElement.style.opacity = '0.6';
        groupElement.style.transition = 'all 0.3s ease';
        groupElement.style.zIndex = '1';

        // 添加灰色實線邊框暗示
        groupElement.style.border = '4px solid #ccc';
        groupElement.style.borderRadius = '10px';
    }
    
    /**
     * 處理錯誤答案
     */
    handleIncorrectAnswer(button) {
        // 如果有按鈕參數才添加樣式
        if (button && button.classList) {
            button.classList.add('incorrect');
        }
        
        // 標示正確答案（僅限非簡單模式有按鈕的情況）
        const correctBtn = document.querySelector(`[data-comparison="${this.currentQuestion.correctAnswer}"]`);
        if (correctBtn) {
            correctBtn.classList.add('correct');
        }

        window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
        this.playSound('incorrect');
        
        // 根據測驗模式播放不同的語音回饋
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        const testMode = gameConfig.testMode;
        
        let speechText;
        if (testMode.allowRetry) {
            // 反覆作答模式
            speechText = '對不起，你答錯了，請再試一次';
        } else {
            // 單次作答模式 - 判斷是否為最後一題
            const isLastLevel = this.currentLevel >= this.totalLevels;
            const endingText = isLastLevel ? '測驗結束' : '進入下一題';
            speechText = `對不起，你答錯了，${endingText}`;
        }

        // 語音回饋（回傳 Promise，讓呼叫端可在語音完成後繼續）
        return this.speak(speechText);
    }

    /**
     * 顯示正確答案 (用於單次作答模式)
     */
    showCorrectAnswer() {
        const correctBtn = document.querySelector(`[data-comparison="${this.currentQuestion.correctAnswer}"]`);
        if (correctBtn) {
            correctBtn.classList.add('correct');
        }

        // 顯示正確答案訊息
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        const messageArea = document.getElementById('message-area');
        const correctAnswerMessage = gameConfig.difficulty.speechTemplates.correctAnswer || '正確答案已顯示';

        if (messageArea) {
            messageArea.innerHTML = this.templates.messageDisplay(
                'info',
                correctAnswerMessage
            );
        }

        GameDebug.logGameFlow('✅ 顯示正確答案', {
            correctAnswer: this.currentQuestion.correctAnswer,
            testMode: gameConfig.testMode.id
        });
    }
    
    /**
     * 顯示下一題按鈕
     */
    showNextButton() {
        const nextContainer = document.getElementById('next-container');
        if (nextContainer) {
            if (this.currentLevel < this.totalLevels) {
                nextContainer.innerHTML = this.templates.nextButton();
            } else {
                nextContainer.innerHTML = this.templates.completeButton();
            }
        }
    }
    
    /**
     * 顯示答對組別動畫
     */
    showCorrectGroupAnimation(selectedGroup) {
        const groupElement = selectedGroup === 'left' ?
            document.getElementById('left-group') :
            document.getElementById('right-group');

        if (groupElement) {
            groupElement.classList.add('correct');
            GameDebug.logAnimation('✅ 顯示答對組別動畫', { selectedGroup });
        }
    }
    
    /**
     * 顯示答錯組別動畫
     */
    showIncorrectGroupAnimation(selectedGroup, autoClear = true) {
        const groupElement = selectedGroup === 'left' ?
            document.getElementById('left-group') :
            document.getElementById('right-group');

        if (groupElement) {
            groupElement.classList.add('incorrect');
            GameDebug.logAnimation('❌ 顯示答錯組別動畫', { selectedGroup, autoClear });

            if (autoClear) {
                // 反覆作答模式：圖示顯示後自動清除，讓選項恢復可點選
                QuantityComparisonGame.TimerManager.setTimeout(() => {
                    this.clearGroupAnimationStyles(groupElement);
                    GameDebug.logAnimation('🧹 已清除答錯動畫樣式', { selectedGroup });
                }, 700, 'animation');
            }
        }
    }
    
    /**
     * 清除組別動畫樣式（用於反覆作答恢復）
     */
    clearGroupAnimationStyles(groupElement) {
        if (groupElement) {
            // 移除動畫相關的CSS類（含新增的 correct/incorrect 覆蓋層）
            groupElement.classList.remove('correct-animation', 'incorrect-animation', 'correct', 'incorrect');

            // 清除動畫相關的inline樣式
            groupElement.style.animation = '';
            groupElement.style.transform = '';
            groupElement.style.backgroundColor = '';
            groupElement.style.border = '';
            groupElement.style.boxShadow = '';

            // 🔧 [修復] 清除視覺效果樣式 (emphasizeGroup/fadeGroup)
            groupElement.style.opacity = '';
            groupElement.style.filter = '';
            groupElement.style.zIndex = '';
            groupElement.style.transition = '';

            groupElement.style.removeProperty('animation');
            groupElement.style.removeProperty('transform');
            groupElement.style.removeProperty('background-color');
            groupElement.style.removeProperty('border');
            groupElement.style.removeProperty('box-shadow');
            groupElement.style.removeProperty('opacity');
            groupElement.style.removeProperty('filter');
            groupElement.style.removeProperty('z-index');
            groupElement.style.removeProperty('transition');

            GameDebug.logAnimation('🧹 已清除組別動畫樣式');
        }
    }
    
    /**
     * 綁定組別點擊事件
     */
    bindGroupClickEvents() {
        const leftGroup = document.getElementById('left-group');
        const rightGroup = document.getElementById('right-group');
        
        if (leftGroup && rightGroup) {
            // 先解綁事件（防止重複綁定）
            this.unbindGroupClickEvents();
            
            // 創建綁定函數並保存引用
            this.leftGroupHandler = () => this.handleGroupSelection('left');
            this.rightGroupHandler = () => this.handleGroupSelection('right');
            
            // 綁定新的事件監聽器
            leftGroup.addEventListener('click', this.leftGroupHandler);
            rightGroup.addEventListener('click', this.rightGroupHandler);
            
            GameDebug.logEvents('🔗 已綁定組別點擊事件');
        }
    }
    
    /**
     * 解綁組別點擊事件
     */
    unbindGroupClickEvents() {
        const leftGroup = document.getElementById('left-group');
        const rightGroup = document.getElementById('right-group');
        
        if (leftGroup && rightGroup && this.leftGroupHandler && this.rightGroupHandler) {
            leftGroup.removeEventListener('click', this.leftGroupHandler);
            rightGroup.removeEventListener('click', this.rightGroupHandler);
            
            // 清除引用
            this.leftGroupHandler = null;
            this.rightGroupHandler = null;
            
            GameDebug.logEvents('🔓 已解綁組別點擊事件');
        }
    }
    
    /**
     * 綁定普通模式測驗的圖示點擊事件
     */
    bindNormalTestClickEvents() {
        // 解綁舊的事件（防止重複綁定）
        this.unbindNormalTestClickEvents();
        
        // 為左側圖示綁定點擊事件
        const leftObjects = document.querySelectorAll('#left-objects .object-item');
        GameDebug.logEvents(`🔗 找到左側圖示: ${leftObjects.length}個`);
        
        leftObjects.forEach((obj, index) => {
            const handler = (event) => {
                event.stopPropagation();
                this.handleNormalTestClick('left', index, obj);
            };
            obj.addEventListener('click', handler);
            obj.style.cursor = 'pointer';
            obj.style.border = '2px solid #007bff'; // 添加藍色邊框表示可點擊
            // 儲存處理器引用以便後續解綁
            obj._clickHandler = handler;
        });
        
        // 為右側圖示綁定點擊事件
        const rightObjects = document.querySelectorAll('#right-objects .object-item');
        GameDebug.logEvents(`🔗 找到右側圖示: ${rightObjects.length}個`);
        
        rightObjects.forEach((obj, index) => {
            const handler = (event) => {
                event.stopPropagation();
                this.handleNormalTestClick('right', index, obj);
            };
            obj.addEventListener('click', handler);
            obj.style.cursor = 'pointer';
            obj.style.border = '2px solid #007bff'; // 添加藍色邊框表示可點擊
            // 儲存處理器引用以便後續解綁
            obj._clickHandler = handler;
        });
        
        GameDebug.logEvents('🔗 已綁定普通模式測驗圖示點擊事件');
    }
    
    /**
     * 解綁普通模式測驗的圖示點擊事件
     */
    unbindNormalTestClickEvents() {
        const allObjects = document.querySelectorAll('.object-item');
        allObjects.forEach(obj => {
            if (obj._clickHandler) {
                obj.removeEventListener('click', obj._clickHandler);
                obj.style.cursor = 'default';
                delete obj._clickHandler;
            }
        });
        
        GameDebug.logEvents('🔓 已解綁普通模式測驗圖示點擊事件');
    }
    
    /**
     * 處理普通模式測驗圖示點擊
     */
    async handleNormalTestClick(side, index, element) {
        // 檢查是否已經被點擊過
        if (element.classList.contains('clicked')) return;

        // 播放點擊音效
        this.playSound('click');

        // 標記為已點擊，使用CSS類別控制樣式
        element.classList.add('clicked');

        // 更新點擊計數
        let newCount;
        if (side === 'left') {
            this.currentQuestion.leftClicked++;
            newCount = this.currentQuestion.leftClicked;
            document.getElementById('left-quantity').innerHTML =
                this.templates.quantityDisplay(newCount, true);
        } else {
            this.currentQuestion.rightClicked++;
            newCount = this.currentQuestion.rightClicked;
            document.getElementById('right-quantity').innerHTML =
                this.templates.quantityDisplay(newCount, true);
        }

        GameDebug.logEvents(`📊 普通模式測驗點擊: ${side} 第${index}個圖示，計數: ${newCount}`);

        // 🔧 [Fix 2] 記錄本次點擊的語音 ID，確保只有最後一次點擊的語音完成後才觸發結果
        const mySpeakId = ++this.lastSpeakId;

        // 播放數字語音並等待完成（純數字：1、2、3...）
        await this.speak(newCount.toString());

        // 🔧 [Fix 2] 只有當本次語音是最新的（未被後續點擊打斷）才繼續
        // 這確保最後一個圖示的數字語音（如「4」）播放完畢後，才觸發結果語音
        if (mySpeakId === this.lastSpeakId) {
            this.checkNormalTestComplete();
        }
    }
    
    /**
     * 檢查點擊計數是否完成（簡單模式 / 普通模式共用）
     */
    checkNormalTestComplete() {
        const leftComplete = this.currentQuestion.leftClicked === this.currentQuestion.leftQuantity;
        const rightComplete = this.currentQuestion.rightClicked === this.currentQuestion.rightQuantity;

        if (leftComplete && rightComplete) {
            // 數完後解綁點擊事件
            this.unbindNormalTestClickEvents();

            const gameConfig = this.config.getGameConfig(this.gameSettings);

            if (gameConfig.difficulty.id === 'easy') {
                // 簡單模式：自動判斷正確/錯誤組別，顯示結果，不需使用者選擇
                this.handleEasyModeAutoResult();
            } else {
                // 普通模式：播放語音提示，同時顯示答案按鈕
                GameDebug.logGameFlow('🎯 普通模式數數完成，播放語音並顯示分組答案按鈕');

                // 根據比較模式決定語音提示
                let currentComparisonMode = gameConfig.comparisonMode.id;
                if (currentComparisonMode === 'random' && this.currentQuestion) {
                    currentComparisonMode = this.currentQuestion.correctAnswer === 'more' ? 'findLarger' : 'findSmaller';
                }

                let speechPrompt;
                if (currentComparisonMode === 'findLarger') {
                    speechPrompt = '請點擊數量較大的一組';
                } else if (currentComparisonMode === 'findSmaller') {
                    speechPrompt = '請點擊數量較小的一組';
                } else {
                    speechPrompt = '請點擊正確的一組';
                }

                // 播放語音提示（不等待完成，與按鈕同步顯示）
                this.speak(speechPrompt);

                // 顯示分組答案按鈕
                const buttons = this.templates.generateGroupAnswerButtons({
                    comparisonMode: gameConfig.comparisonMode.id,
                    currentQuestion: this.currentQuestion
                });

                const leftContainer = document.getElementById('left-answer-btn');
                const rightContainer = document.getElementById('right-answer-btn');

                if (leftContainer && buttons.leftButton) leftContainer.innerHTML = buttons.leftButton;
                if (rightContainer && buttons.rightButton) rightContainer.innerHTML = buttons.rightButton;

                this.bindGroupAnswerEvents();
            }
        }
    }

    /**
     * 簡單模式：數數完成後自動判斷並顯示結果（不需使用者選擇）
     */
    handleEasyModeAutoResult() {
        // 🔧 [Fix 3] 防止競態條件導致此函數被重複呼叫（確保每題只計分一次）
        if (this.easyModeResultShown) {
            GameDebug.log('state', '⚠️ handleEasyModeAutoResult 已執行過，略過重複呼叫');
            return;
        }
        this.easyModeResultShown = true;

        // 🔧 [Fix score] 記錄當前場次 ID，供 Promise 回呼驗證是否仍在同一場遊戲中
        const mySessionId = this.gameSessionId;

        const { leftQuantity, rightQuantity, correctAnswer } = this.currentQuestion;

        // 判斷哪個組符合比較條件（正確組）
        let correctGroup;
        if (correctAnswer === 'more') {
            correctGroup = leftQuantity > rightQuantity ? 'left' : 'right';
        } else {
            correctGroup = leftQuantity < rightQuantity ? 'left' : 'right';
        }
        const incorrectGroup = correctGroup === 'left' ? 'right' : 'left';

        // 顯示 ✓/✕ 圖示（不自動清除，下一題渲染時 DOM 重整）
        this.showCorrectGroupAnimation(correctGroup);
        this.showIncorrectGroupAnimation(incorrectGroup, false);

        // 播放正確音效
        this.playSound('correct');

        // 構建語音文字：「A組數量較大，進入下一題」/「B組數量較小，測驗結束」
        const groupLabel = correctGroup === 'left' ? 'A' : 'B';
        const comparisonLabel = correctAnswer === 'more' ? '較大' : '較小';
        const isLastLevel = this.currentLevel >= this.totalLevels;
        const endingText = isLastLevel ? '，測驗結束' : '，進入下一題';
        const speechText = `${groupLabel}組數量${comparisonLabel}${endingText}`;

        GameDebug.logGameFlow('🎯 簡單模式自動結果', { correctGroup, incorrectGroup, speechText });

        // 更新計分（簡單模式每題計為練習完成）
        this.correctAnswers++;
        this.totalAnswers++;
        this.updateGameInfo();

        // 播放語音後進入下一題
        this.speak(speechText).then(() => {
            // 🔧 [Fix score] 若遊戲已被重置（場次 ID 不符），不建立新的計時器
            if (mySessionId !== this.gameSessionId) {
                GameDebug.log('state', '⚠️ 偵測到舊場次回呼，略過 completeGame/nextQuestion');
                return;
            }
            QuantityComparisonGame.TimerManager.setTimeout(() => {
                if (mySessionId !== this.gameSessionId) return; // Double-check inside timer
                if (this.currentLevel < this.totalLevels) {
                    this.nextQuestion();
                } else {
                    this.completeGame();
                }
            }, 800, 'turnTransition');
        });
    }

    /**
     * 綁定分組答案按鈕事件
     */
    bindGroupAnswerEvents() {
        const groupButtons = document.querySelectorAll('.group-comparison-btn');
        groupButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const comparison = e.target.dataset.comparison;
                GameDebug.logEvents(`🎯 分組按鈕點擊: ${comparison}`);
                
                // 禁用所有按鈕防止重複點擊
                groupButtons.forEach(btn => btn.disabled = true);
                
                // 檢查答案
                this.checkAnswer(comparison);
            });
        });
    }

    /**
     * 檢查答案（用於普通模式測驗）
     * @param {string} comparison - 用戶選擇的答案 ('more' 或 'less')
     */
    checkAnswer(comparison) {
        // 🔧 [Fix score] 記錄當前場次，防止舊場次回呼污染新遊戲
        const mySessionId = this.gameSessionId;

        const { leftQuantity, rightQuantity } = this.currentQuestion;
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        let isCorrect = false;
        let selectedGroup = '';
        
        // 根據用戶選擇和實際數量判斷正確性
        if (comparison === 'left-larger') {
            isCorrect = leftQuantity > rightQuantity;
            selectedGroup = 'left';
        } else if (comparison === 'right-larger') {
            isCorrect = rightQuantity > leftQuantity;
            selectedGroup = 'right';
        } else if (comparison === 'left-smaller') {
            isCorrect = leftQuantity < rightQuantity;
            selectedGroup = 'left';
        } else if (comparison === 'right-smaller') {
            isCorrect = rightQuantity < leftQuantity;
            selectedGroup = 'right';
        }
        
        GameDebug.logScoring('📊 答案檢查', {
            userAnswer: comparison,
            leftQuantity: leftQuantity,
            rightQuantity: rightQuantity,
            selectedGroup: selectedGroup,
            isCorrect: isCorrect
        });

        if (isCorrect) {
            // 計分
            this.totalAnswers++;
            this.correctAnswers++;
            // 答對處理：添加視覺動畫效果
            this.showCorrectGroupAnimation(selectedGroup);
            this.playSound('correct');
            this.speak(gameConfig.difficulty.speechTemplates.correct).then(() => {
                if (mySessionId !== this.gameSessionId) return; // 舊場次回呼，略過
                if (this.currentLevel < this.totalLevels) {
                    this.nextQuestion();
                } else {
                    this.completeGame();
                }
            });
        } else {
            // 答錯處理：添加視覺動畫效果
            this.showIncorrectGroupAnimation(selectedGroup);
            window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
            this.playSound('incorrect');

            // 根據測試模式決定處理方式
            if (gameConfig.testMode.id === 'single') {
                // 單次作答：計入總答題數（答錯 = 1題答完）
                this.totalAnswers++;
                // 🔧 [新增] 單次作答：顯示視覺標記（綠✓）並播放詳細語音

                // 1. 解析正確答案信息
                const { correctAnswer: correctAnswerType } = this.currentQuestion; // 'more' 或 'less'
                const { leftQuantity, rightQuantity } = this.currentQuestion;

                // 確定正確組別和數量
                let correctSide, correctQuantity, comparisonTypeText;

                if (correctAnswerType === 'more') {
                    // 找較大的：哪一邊數量多
                    correctSide = leftQuantity > rightQuantity ? 'left' : 'right';
                    correctQuantity = Math.max(leftQuantity, rightQuantity);
                    comparisonTypeText = '比較大';
                } else { // 'less'
                    // 找較小的：哪一邊數量少
                    correctSide = leftQuantity < rightQuantity ? 'left' : 'right';
                    correctQuantity = Math.min(leftQuantity, rightQuantity);
                    comparisonTypeText = '比較小';
                }

                // 2. 構建正確按鈕的 data-comparison 值 (例如: 'left-larger', 'right-smaller')
                const buttonComparisonValue = correctAnswerType === 'more'
                    ? `${correctSide}-larger`
                    : `${correctSide}-smaller`;

                // 3. 立即顯示正確答案的綠色✓
                const correctBtn = document.querySelector(`[data-comparison="${buttonComparisonValue}"]`);

                GameDebug.logGameFlow('🔍 [普通模式單次作答] 查找正確按鈕', {
                    correctAnswerType: correctAnswerType,
                    correctSide: correctSide,
                    buttonComparisonValue: buttonComparisonValue,
                    buttonFound: !!correctBtn,
                    leftQuantity: leftQuantity,
                    rightQuantity: rightQuantity
                });

                if (correctBtn) {
                    correctBtn.classList.add('correct');
                    GameDebug.logAnimation('✅ 添加綠色✓標記到正確按鈕', {
                        button: buttonComparisonValue,
                        classes: correctBtn.className
                    });
                } else {
                    GameDebug.logGameFlow('❌ 未找到正確按鈕元素', {
                        buttonComparisonValue: buttonComparisonValue,
                        availableButtons: Array.from(document.querySelectorAll('[data-comparison]')).map(b => ({
                            comparison: b.dataset.comparison,
                            text: b.textContent.trim()
                        }))
                    });
                }

                // 4. 播放簡化語音: "不對，5比較大" (移除組別名稱)
                const detailedMessage = `不對，${correctQuantity}${comparisonTypeText}`;
                GameDebug.logSpeech('🎤 普通模式單次作答錯誤語音', { message: detailedMessage });

                this.speak(detailedMessage).then(() => {
                    if (mySessionId !== this.gameSessionId) return; // 舊場次回呼，略過
                    if (this.currentLevel < this.totalLevels) {
                        this.nextQuestion();
                    } else {
                        this.completeGame();
                    }
                });
            } else {
                // 反複作答：重新啟用按鈕
                const groupButtons = document.querySelectorAll('.group-comparison-btn');
                groupButtons.forEach(btn => btn.disabled = false);
                const retryMessage = gameConfig.difficulty.speechTemplates.retry || '不對，請再試一次';
                this.speak(retryMessage);
            }
        }
    }

    /**
     * 顯示自訂範圍輸入器 (仿 F2 風格)
     */
    showCustomRangeInput() {
        if (document.getElementById('custom-range-popup')) return;
        
        const popupHTML = `
            <div id="custom-range-popup" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;">
                <div style="background:white; padding:25px; border-radius:15px; width:450px; text-align:center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <h3 style="margin-bottom: 20px; color: #333; font-size: 1.4rem;">🔢 設定自訂數量範圍</h3>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 20px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">最小值:</label>
                            <input type="text" id="custom-min-display" readonly 
                                   style="width:80px; height:40px; font-size:1.5em; text-align:center; 
                                          padding: 5px; border: 2px solid #ddd; border-radius: 8px; background: #f8f9fa;">
                        </div>
                        <div style="font-size: 1.5rem; margin-top: 20px; color: #666;">~</div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">最大值:</label>
                            <input type="text" id="custom-max-display" readonly 
                                   style="width:80px; height:40px; font-size:1.5em; text-align:center; 
                                          padding: 5px; border: 2px solid #ddd; border-radius: 8px; background: #f8f9fa;">
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="margin-right: 10px; font-weight: bold; color: #333;">目前輸入:</label>
                        <select id="range-input-target" style="padding: 8px 12px; border: 2px solid #007bff; border-radius: 6px; font-size: 1rem;">
                            <option value="min">最小值</option>
                            <option value="max">最大值</option>
                        </select>
                    </div>
                    <div id="custom-range-number-pad" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; margin-bottom: 20px; max-width: 250px; margin-left: auto; margin-right: auto;"></div>
                    <div>
                        <button id="custom-range-cancel" style="padding: 10px 20px; margin-right: 10px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">取消</button>
                    </div>
                    <div style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                        <strong>說明：</strong>請分別設定最小值和最大值 (範圍: 1-100)
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        
        const pad = document.getElementById('custom-range-number-pad');
        const minDisplay = document.getElementById('custom-min-display');
        const maxDisplay = document.getElementById('custom-max-display');
        const targetSelect = document.getElementById('range-input-target');
        const cancelBtn = document.getElementById('custom-range-cancel');
        
        // 取消按鈕
        cancelBtn.onclick = () => {
            document.getElementById('custom-range-popup').remove();
            // 重置選項回到預設值
            const rangeOptions = document.querySelectorAll('input[name="quantityRange"]');
            rangeOptions.forEach(option => {
                if (option.value === '1-10') {
                    option.checked = true;
                    this.gameSettings.quantityRange = '1-10';
                }
            });
        };
        
        // 建立數字鍵盤
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '清除', '0', '確認'].forEach(key => {
            const btn = document.createElement('button');
            btn.textContent = key;
            btn.style.cssText = `
                padding: 12px; 
                font-size: 1.1em; 
                border: 2px solid #ddd; 
                border-radius: 6px; 
                cursor: pointer;
                background: #f8f9fa;
                transition: all 0.2s ease;
            `;
            
            // 特殊按鈕樣式
            if (key === '確認') {
                btn.style.background = '#28a745';
                btn.style.color = 'white';
                btn.style.gridColumn = 'span 2';
            } else if (key === '清除') {
                btn.style.background = '#ffc107';
            }
            
            btn.onmouseover = () => {
                if (key === '確認') {
                    btn.style.background = '#218838';
                } else if (key === '清除') {
                    btn.style.background = '#e0a800';
                } else {
                    btn.style.background = '#007bff';
                    btn.style.color = 'white';
                }
            };
            
            btn.onmouseout = () => {
                if (key === '確認') {
                    btn.style.background = '#28a745';
                    btn.style.color = 'white';
                } else if (key === '清除') {
                    btn.style.background = '#ffc107';
                    btn.style.color = 'black';
                } else {
                    btn.style.background = '#f8f9fa';
                    btn.style.color = 'black';
                }
            };
            
            btn.onclick = () => {
                const isMin = targetSelect.value === 'min';
                const currentDisplay = isMin ? minDisplay : maxDisplay;
                
                if (key === '清除') {
                    currentDisplay.value = '';
                } else if (key === '確認') {
                    const minVal = parseInt(minDisplay.value) || 0;
                    const maxVal = parseInt(maxDisplay.value) || 0;
                    
                    if (minVal > 0 && maxVal > minVal && maxVal <= 100) {
                        // 更新配置
                        this.config.quantityRanges.custom.minQuantity = minVal;
                        this.config.quantityRanges.custom.maxQuantity = maxVal;
                        this.config.quantityRanges.custom.label = `${minVal}-${maxVal}`;
                        
                        // 更新按鈕文字
                        const customOption = document.querySelector('input[name="quantityRange"][value="custom"]');
                        if (customOption) {
                            const optionText = customOption.nextElementSibling.querySelector('strong');
                            if (optionText) optionText.textContent = `${minVal}-${maxVal}`;
                        }
                        
                        this.playSound('select');
                        document.getElementById('custom-range-popup').remove();
                        GameDebug.logConfig('✅ 自訂範圍設定完成', { min: minVal, max: maxVal });
                    } else {
                        alert('請輸入有效範圍！\n- 最小值必須大於 0\n- 最大值必須大於最小值\n- 最大值不能超過 100');
                    }
                } else {
                    // 數字輸入，限制最大兩位數
                    if (currentDisplay.value.length < 3) {
                        currentDisplay.value += key;
                    }
                }
            };
            
            pad.appendChild(btn);
        });
    }

    /**
     * 顯示範圍輸入器 (同 F1 風格)
     */
    showRangeInput(title, callback, maxLimit = 30) {
        GameDebug.log('ui', '📊 showRangeInput 被調用', {
            title: title,
            callbackType: typeof callback,
            existingPopup: !!document.getElementById('range-input-popup')
        });

        if (document.getElementById('range-input-popup')) {
            GameDebug.log('ui', '⚠️ 已存在 range-input-popup，跳過顯示');
            return;
        }

        const popupHTML = `
            <div id="range-input-popup" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;">
                <div style="background:white; padding:20px; border-radius:15px; width:400px; text-align:center; position:relative;">
                    <button id="close-range-input" style="
                        position: absolute; top: 10px; right: 15px;
                        background: #ff4757; color: white; border: none; border-radius: 50%;
                        width: 30px; height: 30px; font-size: 1.2em; font-weight: bold;
                        cursor: pointer; display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 2px 8px rgba(255,71,87,0.3); transition: all 0.2s ease;
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

        // 點擊輸入框切換編輯目標
        minDisplay.onclick = () => {
            isInputingMax = false;
            currentInputType.textContent = '請輸入最小值';
            minDisplay.style.borderColor = '#4a90e2';
            maxDisplay.style.borderColor = '#ddd';
        };

        maxDisplay.onclick = () => {
            isInputingMax = true;
            currentInputType.textContent = '請輸入最大值';
            maxDisplay.style.borderColor = '#4a90e2';
            minDisplay.style.borderColor = '#ddd';
        };

        // 初始狀態：最小值高亮
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
                const feedbackDiv = document.getElementById('input-feedback');

                if (key === '清除') {
                    currentDisplay.value = '';
                } else if (key === '確認') {
                    if (!isInputingMax && minDisplay.value) {
                        // 最小值已填，自動切換到最大值
                        isInputingMax = true;
                        currentInputType.textContent = '請輸入最大值';
                        maxDisplay.style.borderColor = '#4a90e2';
                        minDisplay.style.borderColor = '#ddd';
                    } else if (isInputingMax && maxDisplay.value && minDisplay.value) {
                        const minVal = parseInt(minDisplay.value);
                        const maxVal = parseInt(maxDisplay.value);
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

                        if (!isInputingMax && numValue === 0) {
                            if (feedbackDiv) {
                                feedbackDiv.textContent = '⚠️ 最小值必須大於0';
                                feedbackDiv.style.color = '#ff6b6b';
                                QuantityComparisonGame.TimerManager.setTimeout(() => {
                                    feedbackDiv.textContent = '';
                                }, 2000, 'ui');
                            }
                            return;
                        }

                        if (numValue <= maxLimit) {
                            currentDisplay.value += key;
                            if (feedbackDiv) feedbackDiv.textContent = '';
                        } else {
                            if (feedbackDiv) {
                                feedbackDiv.textContent = `⚠️ 數值不能超過${maxLimit}`;
                                feedbackDiv.style.color = '#ff6b6b';
                                QuantityComparisonGame.TimerManager.setTimeout(() => {
                                    feedbackDiv.textContent = '';
                                }, 2000, 'ui');
                            }
                        }
                    }
                }
            };

            pad.appendChild(btn);
        });
    }

    /**
     * 刷新數量範圍選項 (當難度改變時)
     */
    refreshQuantityRangeOptions() {
        // 生成當前數量範圍選項配置
        const setActiveState = (options, currentValue) => {
            return options.map(option => ({
                ...option,
                isActive: option.id === currentValue
            }));
        };
        
        const quantityRangeOptions = setActiveState(
            this.config.getSettingOptions('quantityRange'), 
            this.gameSettings.quantityRange
        );
        
        const difficultyOptions = setActiveState(
            this.config.getSettingOptions('difficulty'), 
            this.gameSettings.difficulty
        );
        
        // 尋找數量範圍設定群組並更新
        const settingsContainer = document.querySelector('.game-settings');
        if (settingsContainer) {
            // 使用更精確的選擇器
            const quantityRangeGroups = settingsContainer.querySelectorAll('.setting-group');
            for (const group of quantityRangeGroups) {
                const heading = group.querySelector('h3');
                if (heading && heading.textContent.includes('數量範圍')) {
                    group.outerHTML = this.templates.generateQuantityRangeGroup({ 
                        quantityRangeOptions, 
                        difficultyOptions 
                    });
                    break;
                }
            }
        }
        
        // 🔍 檢查自訂範圍按鈕是否正確顯示
        QuantityComparisonGame.TimerManager.setTimeout(() => {
            const customRangeButton = document.querySelector('[data-value="custom"][data-type="quantityRange"]');
            const allQuantityRangeButtons = document.querySelectorAll('[data-type="quantityRange"]');

            GameDebug.log('ui', '🔍 自訂範圍按鈕狀態檢查', {
                buttonExists: !!customRangeButton,
                buttonVisible: customRangeButton ? !customRangeButton.style.display : false,
                buttonDisabled: customRangeButton ? customRangeButton.disabled : false,
                buttonElement: customRangeButton,
                currentDifficulty: this.gameSettings.difficulty,
                quantityRangeOptionsCount: quantityRangeOptions.length,
                customRangeInOptions: quantityRangeOptions.some(opt => opt.id === 'custom'),
                allQuantityRangeButtonsCount: allQuantityRangeButtons.length,
                allQuantityRangeButtons: Array.from(allQuantityRangeButtons).map(btn => ({
                    text: btn.textContent.trim(),
                    dataType: btn.dataset.type,
                    dataValue: btn.dataset.value,
                    classes: btn.className
                }))
            });
        }, 100, 'animation'); // 小延遲確保DOM更新完成
        
        GameDebug.logUI('🔄 數量範圍選項已刷新', { optionsCount: quantityRangeOptions.length });
    }

    /**
     * 準備數字輸入器 (困難模式)
     */
    prepareNumberInput() {
        // 在answer-buttons區域準備輸入按鈕
        const answerContainer = document.getElementById('answer-buttons');
        if (answerContainer) {
            answerContainer.innerHTML = '';
            answerContainer.style.display = 'none'; // 語音播放完再顯示
        }
    }

    /**
     * 顯示數字輸入按鈕 (困難模式語音播放完後調用)
     */
    showNumberInputButton() {
        const answerContainer = document.getElementById('answer-buttons');
        if (answerContainer) {
            answerContainer.innerHTML = `
                <button class="number-input-trigger" onclick="event.preventDefault(); event.stopPropagation(); Game.openNumberPad(event)">
                    點我輸入答案
                </button>
            `;
            answerContainer.style.display = 'flex';
        }
    }

    /**
     * 打開數字輸入器
     */
    openNumberPad(event) {
        GameDebug.logUI('🔢 [NUMPAD] 打開數字鍵盤', {
            eventType: event?.type,
            timestamp: new Date().toLocaleTimeString(),
            bodyTransform: getComputedStyle(document.body).transform,
            bodyScale: getComputedStyle(document.body).scale
        });

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const numberPadHTML = `
            <div class="number-pad-overlay" style="transform: none !important; transition: none !important; animation: none !important;" onclick="event.preventDefault(); event.stopPropagation(); Game.closeNumberPad(event)">
                <div class="number-pad-container" style="transform: none !important; transition: none !important; animation: none !important;" onclick="event.preventDefault(); event.stopPropagation()">
                    <div class="number-pad-header">
                        <h3>輸入答案</h3>
                        <button class="close-btn" onclick="event.preventDefault(); event.stopPropagation(); Game.closeNumberPad(event)">×</button>
                    </div>
                    <div class="number-pad-display">
                        <input type="text" id="number-input" readonly value="">
                    </div>
                    <div class="number-pad-buttons">
                        <button style="transform: none !important; transition: none !important;" onclick="event.preventDefault(); event.stopPropagation(); Game.inputNumber('7', event)">7</button>
                        <button style="transform: none !important; transition: none !important;" onclick="event.preventDefault(); event.stopPropagation(); Game.inputNumber('8', event)">8</button>
                        <button style="transform: none !important; transition: none !important;" onclick="event.preventDefault(); event.stopPropagation(); Game.inputNumber('9', event)">9</button>
                        <button style="transform: none !important; transition: none !important;" onclick="event.preventDefault(); event.stopPropagation(); Game.inputNumber('4', event)">4</button>
                        <button style="transform: none !important; transition: none !important;" onclick="event.preventDefault(); event.stopPropagation(); Game.inputNumber('5', event)">5</button>
                        <button style="transform: none !important; transition: none !important;" onclick="event.preventDefault(); event.stopPropagation(); Game.inputNumber('6', event)">6</button>
                        <button style="transform: none !important; transition: none !important;" onclick="event.preventDefault(); event.stopPropagation(); Game.inputNumber('1', event)">1</button>
                        <button style="transform: none !important; transition: none !important;" onclick="event.preventDefault(); event.stopPropagation(); Game.inputNumber('2', event)">2</button>
                        <button style="transform: none !important; transition: none !important;" onclick="event.preventDefault(); event.stopPropagation(); Game.inputNumber('3', event)">3</button>
                        <button class="span-2" style="transform: none !important; transition: none !important;" onclick="event.preventDefault(); event.stopPropagation(); Game.inputNumber('0', event)">0</button>
                        <button style="transform: none !important; transition: none !important;" onclick="event.preventDefault(); event.stopPropagation(); Game.clearInput(event)">清除</button>
                    </div>
                    <div class="number-pad-actions">
                        <button class="submit-btn" style="transform: none !important; transition: none !important;" onclick="event.preventDefault(); event.stopPropagation(); Game.submitNumberAnswer(event)">確認答案</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', numberPadHTML);

        GameDebug.logUI('✅ [NUMPAD] 數字鍵盤已插入 DOM', {
            overlayExists: !!document.querySelector('.number-pad-overlay'),
            bodyHasOverlay: document.body.contains(document.querySelector('.number-pad-overlay'))
        });
    }

    /**
     * 關閉數字輸入器
     */
    closeNumberPad(event) {
        GameDebug.logUI('🔢 [NUMPAD] 關閉數字鍵盤', {
            eventType: event?.type,
            timestamp: new Date().toLocaleTimeString()
        });

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const overlay = document.querySelector('.number-pad-overlay');
        if (overlay) {
            overlay.remove();
            GameDebug.logUI('✅ [NUMPAD] 數字鍵盤已移除');
        }
    }

    /**
     * 輸入數字
     */
    inputNumber(digit, event) {
        const bodyBefore = getComputedStyle(document.body);
        const overlayBefore = getComputedStyle(document.querySelector('.number-pad-overlay'));
        const htmlBefore = getComputedStyle(document.documentElement);

        GameDebug.log('ui', `🔢 點擊數字 ${digit} - BEFORE:`, {
            // Body 屬性
            bodyTransform: bodyBefore.transform,
            bodyScale: bodyBefore.scale,
            bodyWidth: bodyBefore.width,
            bodyHeight: bodyBefore.height,
            bodyZoom: bodyBefore.zoom,
            bodyOpacity: bodyBefore.opacity,
            // Overlay 屬性
            overlayTransform: overlayBefore.transform,
            overlayScale: overlayBefore.scale,
            overlayWidth: overlayBefore.width,
            overlayHeight: overlayBefore.height,
            overlayZoom: overlayBefore.zoom,
            overlayOpacity: overlayBefore.opacity,
            // HTML 屬性
            htmlZoom: htmlBefore.zoom,
            htmlTransform: htmlBefore.transform,
            // Viewport
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            visualViewportScale: window.visualViewport?.scale
        });

        GameDebug.logUI('🔢 [NUMPAD] 點擊數字鍵', {
            digit,
            eventType: event?.type,
            timestamp: new Date().toLocaleTimeString()
        });

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const input = document.getElementById('number-input');
        if (input) {
            const oldValue = input.value;
            input.value += digit;

            // 等待一小段時間讓瀏覽器完成任何可能的渲染變化
            QuantityComparisonGame.TimerManager.setTimeout(() => {
                const bodyAfter = getComputedStyle(document.body);
                const overlayAfter = getComputedStyle(document.querySelector('.number-pad-overlay'));

                GameDebug.log('ui', `✅ 數字 ${digit} 已輸入 - AFTER:`, {
                    bodyTransform: bodyAfter.transform,
                    bodyScale: bodyAfter.scale,
                    bodyWidth: bodyAfter.width,
                    bodyHeight: bodyAfter.height,
                    overlayTransform: overlayAfter.transform,
                    overlayScale: overlayAfter.scale,
                    overlayWidth: overlayAfter.width,
                    overlayHeight: overlayAfter.height,
                    transformChanged: bodyBefore.transform !== bodyAfter.transform,
                    overlayTransformChanged: overlayBefore.transform !== overlayAfter.transform
                });
            }, 50, 'animation');

            GameDebug.logUI('✅ [NUMPAD] 數字已輸入', {
                digit,
                oldValue,
                newValue: input.value
            });
        }
    }

    /**
     * 清除輸入
     */
    clearInput(event) {
        GameDebug.logUI('🔢 [NUMPAD] 清除輸入', {
            eventType: event?.type,
            timestamp: new Date().toLocaleTimeString()
        });

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const input = document.getElementById('number-input');
        if (input) {
            input.value = '';
            GameDebug.logUI('✅ [NUMPAD] 輸入已清除');
        }
    }

    /**
     * 提交數字答案
     */
    submitNumberAnswer(event) {
        GameDebug.logUI('🔢 [NUMPAD] 提交答案', {
            eventType: event?.type,
            timestamp: new Date().toLocaleTimeString()
        });

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const input = document.getElementById('number-input');
        if (input && input.value) {
            const userAnswer = parseInt(input.value);
            GameDebug.logUI('✅ [NUMPAD] 答案已提交', {
                userAnswer,
                inputValue: input.value
            });
            this.closeNumberPad(event);
            this.checkNumberAnswer(userAnswer);
        }
    }

    /**
     * 檢查數字答案
     */
    checkNumberAnswer(userAnswer) {
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        const correctAnswer = this.getCorrectAnswerForHardMode();
        
        if (userAnswer === correctAnswer) {
            // 答對處理：立即顯示動畫效果
            this.playSound('correct');
            this.showHardModeCorrectAnimation();
            
            // 取得比較類型用於語音
            const comparisonMode = this.gameSettings.comparisonMode;
            let comparisonType;
            
            // 根據比較模式和隨機模式決定語音內容
            if (comparisonMode === 'random' && this.currentQuestion.correctAnswer) {
                // 隨機模式：根據當前題目的正確答案類型
                comparisonType = this.currentQuestion.correctAnswer === 'more' ? '大' : '小';
            } else {
                // 標準模式：根據設定的比較模式
                switch (comparisonMode) {
                    case 'findSmaller':
                        comparisonType = '小';
                        break;
                    case 'findLarger':
                        comparisonType = '大';
                        break;
                    default:
                        comparisonType = '大'; // 預設值
                }
            }
            
            // 使用增強的語音模板
            let speechText = gameConfig.difficulty.speechTemplates.correctWithAnswer
                .replace('{comparisonType}', comparisonType)
                .replace('{correctAnswer}', correctAnswer);

            // 判斷是否為最後一題，加上結尾文字
            const isLastLevel = this.currentLevel >= this.totalLevels;
            const endingText = isLastLevel ? '，測驗結束' : '，進入下一題';
            speechText += endingText;

            GameDebug.logSpeech('🎯 困難模式答對語音', {
                comparisonMode,
                comparisonType,
                correctAnswer,
                speechText
            });

            this.speak(speechText).then(() => {
                // 語音播放完成後進入下一題
                this.handleHardModeCorrectAnswer();
            });
        } else {
            // 🔧 [新增] 答錯處理：添加視覺標記（紅×和綠✓）
            window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
            this.playSound('incorrect');

            const testMode = gameConfig.testMode.id;

            // 🔧 [修改] 所有模式都顯示視覺標記（紅×和綠✓）
            const { leftQuantity, rightQuantity } = this.currentQuestion;
            const { correctAnswer: correctAnswerType } = this.currentQuestion;

            // 判斷正確組別
            let correctGroup, incorrectGroup;
            if (correctAnswerType === 'more') {
                // 找較大的：正確組是數量多的那一邊
                correctGroup = leftQuantity > rightQuantity ? 'left' : 'right';
                incorrectGroup = leftQuantity > rightQuantity ? 'right' : 'left';
            } else { // 'less'
                // 找較小的：正確組是數量少的那一邊
                correctGroup = leftQuantity < rightQuantity ? 'left' : 'right';
                incorrectGroup = leftQuantity < rightQuantity ? 'right' : 'left';
            }

            const correctGroupElement = document.getElementById(`${correctGroup}-group`);
            const incorrectGroupElement = document.getElementById(`${incorrectGroup}-group`);

            // 1. 立即給錯誤組添加紅色×
            if (incorrectGroupElement) {
                incorrectGroupElement.classList.add('show-error-x');
                GameDebug.logAnimation('❌ 添加紅色×標記', { group: incorrectGroup });
            }

            // 2. 延遲0.5秒後給正確組添加綠色✓
            QuantityComparisonGame.TimerManager.setTimeout(() => {
                if (correctGroupElement) {
                    correctGroupElement.classList.add('show-correct-tick');
                    GameDebug.logAnimation('✅ 添加綠色✓標記', { group: correctGroup });
                }
            }, 500, 'animation');

            // 🔧 [新增] 根據測試模式決定語音內容
            // 使用共用模組轉換數字為中文讀法
            let convertedAnswer = correctAnswer;
            if (typeof NumberSpeechUtils !== 'undefined' && typeof correctAnswer === 'number') {
                convertedAnswer = NumberSpeechUtils.convertToPureNumberSpeech(correctAnswer);
            }
            let speechText = gameConfig.difficulty.speechTemplates.incorrect.replace('{correctAnswer}', convertedAnswer);

            if (testMode === 'retry') {
                // 反覆作答模式：在語音後加上「請再試一次」
                speechText += '，請再試一次';
            } else {
                // 單次作答模式：加上「進入下一題」或「測驗結束」
                const isLastLevel = this.currentLevel >= this.totalLevels;
                const endingText = isLastLevel ? '，測驗結束' : '，進入下一題';
                speechText += endingText;
            }

            this.speak(speechText).then(() => {
                // 語音播放完成後的處理
                this.handleHardModeIncorrectAnswer();
            });
        }
    }

    /**
     * 困難模式顯示正確答案動畫
     */
    showHardModeCorrectAnimation() {
        const { leftQuantity, rightQuantity } = this.currentQuestion;
        
        // 獲取正確答案的數值
        const correctAnswerValue = this.getCorrectAnswerForHardMode();
        
        // 確定哪一邊是正確答案：比較實際數值
        const isLeftCorrect = correctAnswerValue === leftQuantity;
        const correctSide = isLeftCorrect ? 'left' : 'right';
        
        // 找到整個組別容器，而不是只有數字顯示
        const correctGroupElement = document.getElementById(`${correctSide}-group`);
        
        GameDebug.logAnimation('🎯 困難模式正確答案動畫', {
            correctAnswerValue,
            leftQuantity,
            rightQuantity,
            isLeftCorrect,
            correctSide,
            targetElement: correctGroupElement ? 'group container found' : 'group container not found'
        });
        
        if (correctGroupElement) {
            // 添加正確答案動畫效果到整個組別容器
            correctGroupElement.classList.add('correct-answer-animation');

            // 2秒後移除動畫類別
            QuantityComparisonGame.TimerManager.setTimeout(() => {
                correctGroupElement.classList.remove('correct-answer-animation');
            }, 2000, 'animation');
        } else {
            // 備用方案：如果找不到組別容器，使用數字顯示元素
            const correctNumberElement = document.getElementById(`${correctSide}-quantity`);
            if (correctNumberElement) {
                correctNumberElement.classList.add('correct-answer-animation');
                QuantityComparisonGame.TimerManager.setTimeout(() => {
                    correctNumberElement.classList.remove('correct-answer-animation');
                }, 2000, 'animation');
            }
        }
    }
    
    /**
     * 困難模式答對處理
     */
    handleHardModeCorrectAnswer() {
        this.correctAnswers++;
        this.totalAnswers++;

        // 檢查是否完成所有題目
        if (this.currentLevel < this.totalLevels) {
            // 進入下一題
            this.currentLevel++;
            this.updateGameInfo(); // 🔧 [修復] 更新標題列顯示
            GameDebug.logGameFlow('🎯 困難模式進入下一題', { level: this.currentLevel });
            this.generateQuestion();
        } else {
            // 遊戲完成
            this.completeGame();
        }
    }

    /**
     * 困難模式答錯處理
     */
    handleHardModeIncorrectAnswer() {
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        const testMode = gameConfig.testMode.id;

        this.totalAnswers++;

        if (testMode === 'single') {
            // 🔧 單次作答：答錯直接進入下一題
            if (this.currentLevel < this.totalLevels) {
                this.currentLevel++;
                this.updateGameInfo();
                GameDebug.logGameFlow('🎯 困難模式單次作答答錯，進入下一題', { level: this.currentLevel });
                this.generateQuestion();
            } else {
                this.completeGame();
            }
        } else {
            // 🔧 反覆作答：答錯留在當前題，重新打開數字鍵盤讓用戶重試
            GameDebug.logGameFlow('🔄 困難模式反覆作答答錯，重新打開數字鍵盤', {
                level: this.currentLevel,
                totalAnswers: this.totalAnswers
            });

            // 延遲後清除視覺標記並重新打開數字鍵盤
            QuantityComparisonGame.TimerManager.setTimeout(() => {
                // 清除紅×和綠✓視覺標記
                const allGroups = document.querySelectorAll('.quantity-group');
                allGroups.forEach(group => {
                    group.classList.remove('show-error-x', 'show-correct-tick');
                });
                GameDebug.logAnimation('🧹 清除困難模式視覺標記，準備重試');

                // 重新打開數字鍵盤
                this.openNumberPad();
            }, 1500, 'turnTransition'); // 延遲1.5秒，讓用戶有時間看到視覺標記
        }
    }

    /**
     * 困難模式提示按鈕：在正確組別顯示綠色勾並播放語音
     */
    showHardModeHint() {
        if (!this.currentQuestion || this.currentQuestion.answered) return;

        const correctAnswer = this.getCorrectAnswerForHardMode();
        const { leftQuantity, rightQuantity, correctAnswer: correctAnswerType } = this.currentQuestion;

        // 判斷哪一組是正確答案
        let groupLabel;
        let correctGroupEl;
        if (correctAnswerType === 'more') {
            if (leftQuantity >= rightQuantity) {
                groupLabel = 'A';
                correctGroupEl = document.getElementById('left-group');
            } else {
                groupLabel = 'B';
                correctGroupEl = document.getElementById('right-group');
            }
        } else { // 'less'
            if (leftQuantity <= rightQuantity) {
                groupLabel = 'A';
                correctGroupEl = document.getElementById('left-group');
            } else {
                groupLabel = 'B';
                correctGroupEl = document.getElementById('right-group');
            }
        }

        // 比較類型文字
        const comparisonMode = this.gameSettings.comparisonMode;
        let comparisonType;
        if (comparisonMode === 'findSmaller' || correctAnswerType === 'less') {
            comparisonType = '小';
        } else {
            comparisonType = '大';
        }

        // 顯示綠色勾在正確組別（複用現有 show-correct-tick 樣式）
        if (correctGroupEl) {
            correctGroupEl.classList.add('show-correct-tick');
        }

        // 停用提示按鈕防止重複觸發
        const hintBtn = document.getElementById('f5-hint-btn');
        if (hintBtn) hintBtn.disabled = true;

        // 播放語音：「A組數字3比較小」
        const speechText = `${groupLabel}組數字${correctAnswer}比較${comparisonType}`;
        this.speak(speechText).then(() => {
            // 語音播放完成後移除綠色勾
            if (correctGroupEl) {
                correctGroupEl.classList.remove('show-correct-tick');
            }
            if (hintBtn) hintBtn.disabled = false;
        });
    }

    /**
     * 獲取困難模式正確答案
     */
    getCorrectAnswerForHardMode() {
        const { leftQuantity, rightQuantity, correctAnswer } = this.currentQuestion;
        const comparisonMode = this.gameSettings.comparisonMode;
        
        if (comparisonMode === 'findLarger' || 
            (comparisonMode === 'random' && correctAnswer === 'more')) {
            return Math.max(leftQuantity, rightQuantity);
        } else if (comparisonMode === 'findSmaller' || 
                   (comparisonMode === 'random' && correctAnswer === 'less')) {
            return Math.min(leftQuantity, rightQuantity);
        }
        
        return leftQuantity; // 默認返回
    }
    
    /**
     * 重置組別樣式
     */
    resetGroupStyles() {
        const leftGroup = document.getElementById('left-group');
        const rightGroup = document.getElementById('right-group');
        
        if (leftGroup && rightGroup) {
            // 移除所有相關樣式類（包含視覺標記）
            leftGroup.classList.remove('clickable-group', 'correct', 'incorrect', 'correct-animation', 'incorrect-animation', 'show-error-x', 'show-correct-tick');
            rightGroup.classList.remove('clickable-group', 'correct', 'incorrect', 'correct-animation', 'incorrect-animation', 'show-error-x', 'show-correct-tick');
            
            // 移除事件監聽器（防止重複綁定）
            this.unbindGroupClickEvents();
            
            // 完全重置所有視覺效果樣式
            [leftGroup, rightGroup].forEach(group => {
                group.style.opacity = '1';
                group.style.transform = 'none';
                group.style.filter = 'none';
                group.style.transition = 'none';
                group.style.zIndex = 'auto';
                group.style.backgroundColor = '';
                group.style.border = '';
                group.style.boxShadow = '';
                group.style.animation = '';
                group.style.removeProperty('transform');
                group.style.removeProperty('opacity');
                group.style.removeProperty('filter');
                group.style.removeProperty('transition');
                group.style.removeProperty('z-index');
                group.style.removeProperty('background-color');
                group.style.removeProperty('border');
                group.style.removeProperty('box-shadow');
                group.style.removeProperty('animation');
            });
            
            GameDebug.logUI('🔄 已重置A、B組樣式為正常狀態（無淡化效果）');
        }
        
        // 清除普通模式測驗的圖示點擊樣式
        const allObjects = document.querySelectorAll('.object-item');
        allObjects.forEach(obj => {
            obj.classList.remove('clicked');
            obj.style.opacity = '';
            obj.style.border = '';
            obj.style.borderRadius = '';
            obj.style.cursor = '';
        });

        // 🔧 [新增] 清除單次作答的視覺標記（紅×和綠✓）
        const allButtons = document.querySelectorAll('.comparison-btn, .group-comparison-btn');
        allButtons.forEach(btn => {
            btn.classList.remove('show-error-x', 'show-correct-tick', 'correct', 'incorrect');
        });
    }
    
    /**
     * 下一題
     */
    async nextQuestion() {
        // 🔧 [修復] 安全檢查：確保不超過總題數
        if (this.currentLevel >= this.totalLevels) {
            GameDebug.logGameFlow('⚠️ 嘗試進入下一題但已達到最大題數', {
                currentLevel: this.currentLevel,
                totalLevels: this.totalLevels
            });
            this.completeGame();
            return;
        }

        // 重置A、B組別的樣式
        this.resetGroupStyles();

        // 解綁普通模式測驗的點擊事件（如果存在）
        this.unbindNormalTestClickEvents();

        this.currentLevel++;
        this.updateGameInfo();
        await this.generateQuestion();
    }
    
    /**
     * 完成遊戲
     */
    completeGame() {
        if (this.gameState === 'finished') { GameDebug.log('state', '⚠️ [F5] completeGame 已執行過，忽略重複呼叫'); return; }

        AssistClick.deactivate();
        // 🔧 [Bug修復] 清理回合轉換相關計時器
        QuantityComparisonGame.TimerManager.clearByCategory('turnTransition');

        this.gameState = 'finished';
        QuantityComparisonGame.TimerManager.clearByCategory('timer');
        this.timer = null;

        this.playSound('success');
        this.showResultsScreen();
    }
    
    /**
     * 顯示結果畫面
     */
    showResultsScreen() {
        const appContainer = document.getElementById('app');

        // 🔧 [修復] 防止除以零，並增加除錯資訊
        const accuracy = this.totalAnswers > 0 ?
            Math.round((this.correctAnswers / this.totalAnswers) * 100) : 0;

        // 學習紀錄
        window.LearningTracker?.save({ unit: 'f5', unitName: 'F5 數量大小的比較', series: 'F',
            score: this.correctAnswers, total: this.totalAnswers, difficulty: this.state?.settings?.difficulty,
            durationSec: this.state?.startTime ? Math.floor((Date.now() - this.state.startTime) / 1000) : 0 });

        GameDebug.logScoring('📊 結果畫面計算', {
            correctAnswers: this.correctAnswers,
            totalAnswers: this.totalAnswers,
            accuracy: accuracy,
            rawAccuracy: this.totalAnswers > 0 ? this.correctAnswers / this.totalAnswers : 0
        });

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
        if (accuracy >= 90) {
            performanceMessage = '表現優異！';
            performanceIcon = '🏆';
        } else if (accuracy >= 70) {
            performanceMessage = '表現良好！';
            performanceIcon = '👍';
        } else if (accuracy >= 50) {
            performanceMessage = '還需努力！';
            performanceIcon = '💪';
        } else {
            performanceMessage = '多加練習！';
            performanceIcon = '📚';
        }

        const config = {
            correctAnswers: this.correctAnswers,
            totalAnswers: this.totalAnswers,
            accuracy: `${accuracy}%`,
            timeDisplay,
            performanceMessage,
            performanceIcon
        };

        appContainer.innerHTML = this.templates.resultsScreen(config);

        // 🎁 獎勵系統連結事件監聽器
        const resultsRewardLink = document.getElementById('results-reward-link');
        if (resultsRewardLink) {
            QuantityComparisonGame.EventManager.on(resultsRewardLink, 'click', (event) => {
                event.preventDefault();
                if (typeof RewardLauncher !== 'undefined') {
                    RewardLauncher.open();
                } else {
                    window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                }
            }, {}, 'resultsUI');
        }

        // 語音回饋
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        this.speak(gameConfig.difficulty.speechTemplates.complete);

        // 🎆 播放煙火效果
        this.startFireworksAnimation();
    }

    /**
     * 更新遊戲資訊顯示
     */
    updateGameInfo() {
        const progressInfo = document.getElementById('progress-info');
        if (progressInfo) progressInfo.textContent = `第 ${this.currentLevel}/${this.totalLevels} 題`;
    }
    
    /**
     * 開始計時器
     */
    startTimer() {
        GameDebug.logTimer('⏰ 開始計時器', { timeRemaining: this.timeRemaining });

        // 清除舊計時器
        QuantityComparisonGame.TimerManager.clearByCategory('timer');
        this.timer = null;
        GameDebug.logTimer('🔄 清除舊計時器');

        // 遞迴 TimerManager（可由 clearByCategory('timer') 立即停止）
        const tick = () => {
            QuantityComparisonGame.TimerManager.setTimeout(() => {
                if (this.gameState !== 'playing') {
                    GameDebug.logTimer('⏹️ 遊戲狀態變化，停止計時器', { gameState: this.gameState });
                    return;
                }

                this.timeRemaining--;

                GameDebug.logTimer('⏳ 時間減少', {
                    timeRemaining: this.timeRemaining,
                    formattedTime: this.formatTime(this.timeRemaining)
                });

                const timerInfo = document.getElementById('timer-info');
                if (timerInfo) {
                    timerInfo.textContent = `時間: ${this.formatTime(this.timeRemaining)}`;
                }

                // 配置驅動的時間警告 (按照 CLAUDE.md 原則)
                const gameConfig = this.config.getGameConfig(this.gameSettings);
                if (this.timeRemaining === gameConfig.timeLimit.warningTime) {
                    GameDebug.logTimer('⚠️ 時間警告觸發', { warningTime: gameConfig.timeLimit.warningTime });
                    this.playSound('incorrect');
                }

                // 時間到
                if (this.timeRemaining <= 0) {
                    GameDebug.logTimer('⌛ 時間到，結束遊戲');
                    this.completeGame();
                } else {
                    tick();
                }
            }, 1000, 'timer');
        };
        tick();
    }
    
    /**
     * 格式化時間顯示
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 語音合成 - 支援 Promise
     */
    speak(text, options = {}) {
        return new Promise(async (resolve) => {
            const gameConfig = this.config.getGameConfig(this.gameSettings);
            
            GameDebug.logSpeech('🎤 嘗試語音播放', {
                text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                soundEnabled: gameConfig.sound.enabled,
                speechSynth: !!this.speechSynth,
                currentVoice: this.currentVoice ? this.currentVoice.name : null
            });
            
            if (!gameConfig.sound.enabled) {
                GameDebug.logSpeech('🔇 音效已關閉，跳過語音');
                resolve();
                return;
            }
            
            if (!this.speechSynth || !this.currentVoice) {
                GameDebug.logError('❌ 語音合成不可用或未設置語音');
                resolve();
                return;
            }

            // 停止當前語音 - 防止重複播放
            if (this.speechSynth.speaking || this.speechSynth.pending) {
                this.speechSynth.cancel();
                GameDebug.logSpeech('🛑 停止當前語音');
                // 等待短暫時間確保停止完成
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.currentVoice;
            utterance.rate = options.rate || 1.0; // 允許自訂語速
            utterance.lang = this.currentVoice.lang;
            
            // 語音播放完成後解析 Promise
            utterance.onend = () => {
                GameDebug.logSpeech('✅ 語音播放完成');
                resolve();
            };
            
            utterance.onerror = (event) => {
                GameDebug.logError('❌ 語音播放錯誤', { error: event.error });
                resolve();
            };
            
            // 使用配置的延遲時間
            const delay = options.delay !== undefined ? options.delay : gameConfig.difficulty.timing.speechDelay;
            GameDebug.logSpeech('⏳ 延遲語音播放', { delay });

            QuantityComparisonGame.TimerManager.setTimeout(() => {
                GameDebug.logSpeech('▶️ 開始語音播放', {
                    voice: this.currentVoice.name,
                    rate: utterance.rate,
                    lang: utterance.lang
                });
                this.speechSynth.speak(utterance);
            }, delay, 'animation');
        });
    }
    
    /**
     * 語音指令
     */
    speakInstruction(difficulty) {
        const comparisonMode = this.gameSettings.comparisonMode;
        let instruction = '';
        let displayPrompt = '';

        // 🔧 [修改] 所有模式都在題目開始時顯示文字提示

        // 簡單模式
        if (difficulty.id === 'easy') {
            // 根據比較模式獲取指令
            if (comparisonMode && this.config.comparisonModes[comparisonMode]) {
                instruction = this.config.comparisonModes[comparisonMode].instruction;
                displayPrompt = instruction;

                // 隨機模式需要根據當前題目動態生成指令
                if (comparisonMode === 'random' && this.currentQuestion) {
                    if (this.currentQuestion.correctAnswer === 'more') {
                        instruction = this.config.comparisonModes.findLarger.instruction;
                        displayPrompt = instruction;
                    } else if (this.currentQuestion.correctAnswer === 'less') {
                        instruction = this.config.comparisonModes.findSmaller.instruction;
                        displayPrompt = instruction;
                    }
                }
            }

            // 🔧 簡單模式：題目開始時顯示文字提示並播放語音指令
            if (displayPrompt) {
                this.showQuestionPrompt(displayPrompt);
            }
            // 🔧 [Fix 1] 簡單模式：進入測驗頁面時播放指令語音（依比較模式）
            if (instruction) {
                this.speak(instruction); // 非阻塞，使用者可立即開始點擊
            }
            return;
        }

        // 困難模式：使用特殊語音模板
        if (difficulty.id === 'hard') {
            const { leftQuantity, rightQuantity } = this.currentQuestion;

            let comparisonType = '';
            // 🔧 [修改] 困難模式使用簡短的提示文字
            if (comparisonMode === 'findLarger' ||
                (comparisonMode === 'random' && this.currentQuestion.correctAnswer === 'more')) {
                comparisonType = '大';
                displayPrompt = '請找數字較大的是哪一組？';
            } else if (comparisonMode === 'findSmaller' ||
                       (comparisonMode === 'random' && this.currentQuestion.correctAnswer === 'less')) {
                comparisonType = '小';
                displayPrompt = '請找數字較小的是哪一組？';
            }

            instruction = difficulty.speechTemplates.instruction
                .replace('{leftNumber}', leftQuantity)
                .replace('{rightNumber}', rightQuantity)
                .replace(/\{comparisonType\}/g, comparisonType);

            // 🔧 困難模式：題目開始時就顯示文字提示
            this.showQuestionPrompt(displayPrompt);

            this.speak(instruction).then(() => {
                // 語音播放完畢後顯示輸入按鈕
                this.showNumberInputButton();
            });
            return;
        }

        // 普通模式：根據比較模式選擇指令
        if (comparisonMode && this.config.comparisonModes[comparisonMode]) {
            instruction = this.config.comparisonModes[comparisonMode].instruction;
            displayPrompt = instruction;

            // 隨機模式需要根據當前題目動態生成指令
            if (comparisonMode === 'random' && this.currentQuestion) {
                if (this.currentQuestion.correctAnswer === 'more') {
                    instruction = this.config.comparisonModes.findLarger.instruction;
                    displayPrompt = instruction;
                } else if (this.currentQuestion.correctAnswer === 'less') {
                    instruction = this.config.comparisonModes.findSmaller.instruction;
                    displayPrompt = instruction;
                }
            }

            if (instruction) {
                // 🔧 普通模式：題目開始時就顯示文字提示
                this.showQuestionPrompt(displayPrompt);
                this.speak(instruction);
                return;
            }
        }

        // 預設指令
        const defaultInstruction = difficulty.speechTemplates.instruction;
        this.showQuestionPrompt(defaultInstruction);
        this.speak(defaultInstruction);
    }
    
    /**
     * 獲取圖示對應的語音文字
     */
    getIconSpeechText(selectedIcon, selectedTheme) {
        // 處理物件格式 { emoji, image }
        let iconEmoji = selectedIcon;
        if (typeof selectedIcon === 'object' && selectedIcon !== null) {
            iconEmoji = selectedIcon.emoji || '';
        }

        // 如果是自訂圖片，使用"圖片"或自訂名稱
        if (typeof iconEmoji === 'string' && iconEmoji.startsWith('data:image/')) {
            // 尋找對應的自訂項目名稱
            const customItem = this.state.customItems.find(item => item.icon === iconEmoji);
            return customItem ? customItem.name : '圖片';
        }

        // 圖示到語音的映射表
        const iconSpeechMap = {
            // 水果
            '🍎': '蘋果', '🍌': '香蕉', '🍇': '葡萄', '🍓': '草莓', '🍊': '橘子',
            '🥝': '奇異果', '🍍': '鳳梨', '🍉': '西瓜', '🍑': '櫻桃', '🍒': '櫻桃',
            
            // 動物
            '🐶': '小狗', '🐱': '小貓', '🐭': '老鼠', '🐰': '兔子', '🦊': '狐狸',
            '🐻': '熊', '🐼': '熊貓', '🐨': '無尾熊', '🐯': '老虎', '🦁': '獅子',
            
            // 交通工具
            '🚗': '汽車', '🚕': '計程車', '🚌': '公車', '🚓': '警車', '🚑': '救護車',
            '🚒': '消防車', '🚚': '卡車', '🚲': '腳踏車', '🚀': '火箭', '✈️': '飛機',
            
            // 形狀
            '🔵': '藍色圓形', '🟢': '綠色圓形', '🟡': '黃色圓形', '🟠': '橘色圓形',
            '🟣': '紫色圓形', '🔴': '紅色圓形', '⚫': '黑色圓形', '⚪': '白色圓形',
            '🔺': '三角形', '🔸': '菱形',
            
            // 運動
            '⚽': '足球', '🏀': '籃球', '🏈': '橄欖球', '🎾': '網球', '🏐': '排球',
            '🏓': '乒乓球', '🏸': '羽毛球', '🥎': '棒球', '🏑': '曲棍球', '🏒': '冰球',
            
            // 食物
            '🍔': '漢堡', '🍕': '披薩', '🌭': '熱狗', '🥪': '三明治', '🌮': '墨西哥餅',
            '🌯': '捲餅', '🥙': '口袋餅', '🍗': '雞腿', '🍟': '薯條', '🥨': '椒鹽捲餅'
        };
        
        // 查找對應的語音文字（使用 emoji 作為 key）
        const speechText = iconSpeechMap[iconEmoji];
        if (speechText) {
            return speechText;
        }
        
        // 如果找不到對應，根據主題返回通用名稱
        const themeNames = {
            default: '物品',
            fruits: '水果',
            animals: '動物',
            vehicles: '交通工具',
            shapes: '形狀',
            sports: '運動用品',
            food: '食物'
        };

        return themeNames[selectedTheme] || '物品';
    }
    
    /**
     * 無延遲語音播放（用於動畫同步，不取消前一個語音）
     */
    speakWithoutDelay(text, callback = null) {
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        
        GameDebug.logSpeech('🎤 同步語音播放', {
            text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
            soundEnabled: gameConfig.sound.enabled,
            speechSynth: !!this.speechSynth,
            currentVoice: this.currentVoice ? this.currentVoice.name : null
        });
        
        if (!gameConfig.sound.enabled) {
            GameDebug.logSpeech('🔇 音效已關閉，跳過語音');
            if (callback) callback();
            return;
        }
        
        if (!this.speechSynth || !this.currentVoice) {
            GameDebug.logError('❌ 語音合成不可用或未設置語音');
            if (callback) callback();
            return;
        }
        
        // 不停止當前語音，允許重疊播放
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.currentVoice;
        utterance.rate = 1.0; // 標準語速
        utterance.lang = this.currentVoice.lang;
        
        if (callback) {
            let callbackExecuted = false;
            const safeCallback = () => {
                if (!callbackExecuted) {
                    callbackExecuted = true;
                    callback();
                }
            };
            utterance.onend = () => {
                GameDebug.logSpeech('✅ 同步語音播放完成');
                safeCallback();
            };
            utterance.onerror = (event) => {
                GameDebug.logError('❌ 同步語音播放錯誤', { error: event.error });
                safeCallback();
            };
            QuantityComparisonGame.TimerManager.setTimeout(safeCallback, 10000, 'speech');
        } else {
            utterance.onerror = (event) => {
                GameDebug.logError('❌ 同步語音播放錯誤', { error: event.error });
            };
        }
        
        // 直接播放，無延遲
        GameDebug.logSpeech('▶️ 開始同步語音播放', {
            voice: this.currentVoice.name,
            rate: utterance.rate,
            lang: utterance.lang
        });
        this.speechSynth.speak(utterance);
    }
    
    /**
     * 播放音效
     */
    playSound(soundName) {
        const gameConfig = this.config.getGameConfig(this.gameSettings);
        
        GameDebug.logAudio('🔊 嘗試播放音效', {
            soundName,
            soundEnabled: gameConfig.sound.enabled
        });
        
        if (!gameConfig.sound.enabled) {
            GameDebug.logAudio('🔇 音效已關閉，跳過播放');
            return;
        }
        
        const sound = this.sounds[soundName];
        if (!sound) {
            GameDebug.logError('❌ 音效檔案不存在', { soundName });
            return;
        }
        
        // 🔍 詳細音效狀態檢查
        GameDebug.log('audio', '🎮 音效詳細狀態', {
            soundName,
            audioElement: sound,
            readyState: sound.readyState,
            readyStateText: this.getReadyStateText(sound.readyState),
            networkState: sound.networkState,
            networkStateText: this.getNetworkStateText(sound.networkState),
            currentTime: sound.currentTime,
            duration: sound.duration,
            volume: sound.volume,
            muted: sound.muted,
            paused: sound.paused,
            ended: sound.ended,
            error: sound.error,
            src: sound.src,
            audioContextState: typeof AudioContext !== 'undefined' ? (window.audioContext ? window.audioContext.state : 'no global context') : 'AudioContext不支援',
            userAgent: navigator.userAgent.substring(0, 100)
        });
        
        try {
            sound.currentTime = 0;
            
            const playPromise = sound.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        GameDebug.log('audio', '🎮 ✅ Promise解析成功', {
                            soundName,
                            currentTime: sound.currentTime,
                            paused: sound.paused,
                            volume: sound.volume,
                            actuallyPlaying: !sound.paused && !sound.ended && sound.currentTime > 0
                        });
                        GameDebug.logAudio('✅ 音效播放Promise成功', { soundName });
                        
                        // 🔍 額外檢查：0.1秒後確認音效是否真的在播放
                        QuantityComparisonGame.TimerManager.setTimeout(() => {
                            GameDebug.log('audio', '🎮 0.1秒後狀態檢查', {
                                soundName,
                                currentTime: sound.currentTime,
                                paused: sound.paused,
                                ended: sound.ended,
                                volume: sound.volume,
                                actuallyPlaying: !sound.paused && !sound.ended && sound.currentTime > 0
                            });
                        }, 100, 'animation');
                    })
                    .catch(e => {
                        GameDebug.log('audio', '🎮 ❌ Promise被拒絕', {
                            soundName,
                            error: e.message,
                            errorName: e.name,
                            errorCode: e.code
                        });
                        GameDebug.logError('❌ 音效播放Promise失敗', { soundName, error: e.message });
                    });
            } else {
                GameDebug.log('audio', '🎮 ⚠️ play()沒有返回Promise', { soundName });
            }
        } catch (error) {
            GameDebug.log('audio', '🎮 ❌ 同步異常', {
                soundName,
                error: error.message,
                errorName: error.name
            });
            GameDebug.logError('❌ 音效播放同步異常', { soundName, error: error.message });
        }
    }
    
    /**
     * 獲取音效就緒狀態文字描述
     */
    getReadyStateText(readyState) {
        const states = {
            0: 'HAVE_NOTHING - 沒有資料',
            1: 'HAVE_METADATA - 有元數據',
            2: 'HAVE_CURRENT_DATA - 有當前位置數據',
            3: 'HAVE_FUTURE_DATA - 有未來數據',
            4: 'HAVE_ENOUGH_DATA - 有足夠數據'
        };
        return states[readyState] || `未知狀態: ${readyState}`;
    }
    
    /**
     * 獲取網路狀態文字描述
     */
    getNetworkStateText(networkState) {
        const states = {
            0: 'NETWORK_EMPTY - 尚未初始化',
            1: 'NETWORK_IDLE - 空閒',
            2: 'NETWORK_LOADING - 載入中',
            3: 'NETWORK_NO_SOURCE - 無音效來源'
        };
        return states[networkState] || `未知狀態: ${networkState}`;
    }
    
    /**
     * 檢查音效環境狀態
     */
    checkAudioEnvironment() {
        GameDebug.log('audio', '🎮 音效環境完整檢查', {
            // 基本瀏覽器支持
            AudioSupported: typeof Audio !== 'undefined',
            AudioContextSupported: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
            
            // AudioContext 狀態
            audioContext: (() => {
                try {
                    if (typeof AudioContext !== 'undefined') {
                        if (!window.audioContext) {
                            window.audioContext = new AudioContext();
                        }
                        return {
                            state: window.audioContext.state,
                            sampleRate: window.audioContext.sampleRate,
                            currentTime: window.audioContext.currentTime,
                            baseLatency: window.audioContext.baseLatency || 'N/A'
                        };
                    }
                    return 'AudioContext不支援';
                } catch (e) {
                    return `AudioContext錯誤: ${e.message}`;
                }
            })(),
            
            // 瀏覽器音效政策
            documentUserActivated: document.hasStorageAccess ? 'hasStorageAccess可用' : '需要用戶互動',
            audioUnlockerStatus: window.AudioUnlocker ? {
                isUnlocked: window.AudioUnlocker.isUnlocked,
                hasInteracted: window.AudioUnlocker.hasInteracted
            } : '沒有AudioUnlocker',
            
            // 媒體播放政策
            autoplayPolicy: (() => {
                try {
                    const audio = new Audio();
                    audio.volume = 0.1;
                    const promise = audio.play();
                    if (promise) {
                        promise.catch(() => {}); // 靜默捕獲錯誤
                        return 'Promise-based (現代瀏覽器)';
                    }
                    return 'Legacy API';
                } catch (e) {
                    return `自動播放檢查失敗: ${e.message}`;
                }
            })(),
            
            // 系統資訊
            platform: navigator.platform,
            userAgent: navigator.userAgent.substring(0, 150),
            language: navigator.language,
            onLine: navigator.onLine,
            cookieEnabled: navigator.cookieEnabled
        });

        // 📊 定期檢查AudioContext狀態變化
        // [已移除] 此專案使用 HTML5 Audio 元素，不需要監控 Web Audio API 的 AudioContext 狀態
        // if (window.audioContext) {
        //     const checkContextState = () => {
        //         if (window.audioContext.state !== 'running') {
        //             console.log('🎮 F5 AUDIO ENV: ⚠️ AudioContext狀態異常', {
        //                 state: window.audioContext.state,
        //                 timestamp: new Date().toLocaleTimeString()
        //             });
        //         }
        //     };
        //
        //     // 每5秒檢查一次
        //     setInterval(checkContextState, 5000);
        // }
    }
    
    /**
     * 處理鍵盤按鍵
     */
    handleKeyPress(event) {
        if (this.gameState !== 'playing') return;
        
        switch (event.key) {
            case '1':
                // A組較多
                document.querySelector('[data-comparison="more"]')?.click();
                break;
            case '2':
                // 一樣多
                document.querySelector('[data-comparison="same"]')?.click();
                break;
            case '3':
                // A組較少
                document.querySelector('[data-comparison="less"]')?.click();
                break;
            case 'Enter':
                // 下一題
                document.getElementById('next-btn')?.click() ||
                document.getElementById('complete-btn')?.click();
                break;
        }
    }

    /**
     * 重置遊戲
     */
    resetGame() {
        QuantityComparisonGame.TimerManager.clearByCategory('timer');
        this.timer = null;
        // 恢復所有容器顯示狀態
        this.restoreContainersVisibility();
        this.init();
    }

    // =====================================================
    // 🎨 自訂主題圖片上傳功能 (仿f3_number_recognition)
    // =====================================================
    
    /**
     * 觸發圖片上傳對話框
     */
    triggerImageUpload() {
        GameDebug.logUserAction('觸發圖片上傳');

        // 檢查上傳數量限制（最多8個）
        if (this.state.customItems.length >= 8) {
            alert('最多只能上傳8個圖示！');
            return;
        }

        const fileInput = document.getElementById('image-upload');
        if (fileInput) {
            fileInput.click();

            // 綁定檔案變更事件
            fileInput.onchange = (event) => this.handleImageUpload(event);
        }
    }

    /**
     * 處理圖片上傳
     */
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        GameDebug.logUserAction('處理圖片上傳', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        });

        // 檔案驗證
        if (!file.type.startsWith('image/')) {
            this.showImageUploadError('請選擇圖片檔案');
            return;
        }

        // 使用壓縮功能處理圖片（不再需要檢查大小，壓縮後會很小）
        try {
            GameDebug.logUserAction('壓縮圖片中...');
            const compressedImage = await compressImage(file, 200, 0.7);
            this.showImagePreview(compressedImage);
        } catch (err) {
            GameDebug.error('圖片壓縮失敗:', err);
            this.showImageUploadError('圖片處理失敗，請重試');
        }
    }

    /**
     * 顯示圖片預覽模態視窗
     */
    showImagePreview(imageData) {
        GameDebug.logUI('顯示圖片預覽模態視窗');
        
        // 創建模態視窗
        const modalHTML = `
            <div id="image-preview-modal" class="image-preview-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🎁 新增自訂圖示</h3>
                        <button class="close-btn" onclick="Game.closeImagePreview()">✕</button>
                    </div>
                    <div class="modal-body">
                        <img id="preview-image" src="${imageData}" alt="預覽圖片" style="max-width: 200px; max-height: 200px; object-fit: contain; border-radius: 10px;">
                        <input id="modal-custom-name" type="text" placeholder="請輸入圖示名稱" maxlength="10">
                    </div>
                    <div class="modal-footer">
                        <button class="cancel-btn" onclick="Game.closeImagePreview()">取消</button>
                        <button class="confirm-btn" onclick="Game.confirmAddCustomItem()">確認新增</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 儲存當前圖片資料供確認時使用
        this.tempImageData = imageData;
        
        // 焦點設定到名稱輸入框
        QuantityComparisonGame.TimerManager.setTimeout(() => {
            document.getElementById('modal-custom-name')?.focus();
        }, 100, 'animation');
    }

    /**
     * 確認新增自訂圖示
     */
    confirmAddCustomItem() {
        const nameInput = document.getElementById('modal-custom-name');
        const customName = nameInput?.value?.trim() || '';

        if (!customName) {
            nameInput?.focus();
            return;
        }

        if (!this.tempImageData) {
            GameDebug.logError('❌ 無圖片資料');
            return;
        }

        // 新增到自訂圖示清單
        const newItem = {
            name: customName,
            icon: this.tempImageData,
            id: Date.now()
        };

        this.state.customItems.push(newItem);
        
        // 更新自訂主題的圖示陣列 (關鍵修正)
        this.config.themes.custom.push(this.tempImageData);
        
        GameDebug.logUserAction('自訂圖示新增成功', { 
            name: customName,
            totalItems: this.state.customItems.length 
        });

        // 語音回饋
        this.speak(`已新增自訂圖示：${customName}`);

        // 關閉模態視窗並選擇性更新主題設定
        this.closeImagePreview();
        this.updateCustomThemeSettings();
        
        // 重新驗證設定
        this.updateStartButton();
    }

    /**
     * 移除自訂圖示
     */
    removeCustomItem(index) {
        if (index >= 0 && index < this.state.customItems.length) {
            const removedItem = this.state.customItems[index];
            this.state.customItems.splice(index, 1);
            
            // 同時從自訂主題陣列中移除 (關鍵修正)
            this.config.themes.custom.splice(index, 1);
            
            GameDebug.logUserAction('移除自訂圖示', { 
                name: removedItem.name,
                remainingItems: this.state.customItems.length 
            });

            // 語音回饋 - 如果設定尚未完成則跳過
            try {
                if (this.gameSettings.difficulty) {
                    const gameConfig = this.config.getGameConfig(this.gameSettings);
                    if (gameConfig?.difficulty?.speechTemplates?.removeCustomItem) {
                        const message = gameConfig.difficulty.speechTemplates.removeCustomItem.replace('{itemName}', removedItem.name);
                        this.speak(message);
                    }
                }
            } catch (error) {
                GameDebug.logError('語音回饋錯誤', error);
            }

            // 選擇性更新主題設定
            this.updateCustomThemeSettings();
            
            // 重新驗證設定
            this.updateStartButton();
        }
    }

    /**
     * 關閉圖片預覽模態視窗
     */
    closeImagePreview() {
        const modal = document.getElementById('image-preview-modal');
        if (modal) {
            modal.remove();
        }
        this.tempImageData = null;
        
        // 清除檔案輸入框
        const fileInput = document.getElementById('image-upload');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    /**
     * 顯示圖片上傳錯誤
     */
    showImageUploadError(message) {
        // 簡單的錯誤提示
        alert(message);
        GameDebug.logError('圖片上傳錯誤', message);
    }

    // =====================================================
    // 🎆 煙火動畫系統（與F4統一）
    // =====================================================
    startFireworksAnimation() {
        GameDebug.log('animation', '🎆 開始煙火動畫');
        
        // 🎆 使用canvas-confetti效果（兩波）
        if (window.confetti) {
            GameDebug.log('animation', '🎆 觸發canvas-confetti慶祝效果');
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });

            // 延遲觸發第二波煙火
            QuantityComparisonGame.TimerManager.setTimeout(() => {
                confetti({
                    particleCount: 100,
                    spread: 60,
                    origin: { y: 0.7 }
                });
            }, 200, 'animation');
        } else {
            GameDebug.log('animation', '🎆 canvas-confetti不可用');
        }
    }

    // =====================================================
    // ⏱️ TimerManager - 計時器統一管理
    // =====================================================
    static TimerManager = {
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
    };

    // =====================================================
    // 🎧 EventManager - 事件監聽器統一管理
    // =====================================================
    static EventManager = {
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
    };
}

// =================================================================
// 全局遊戲初始化和導出
// =================================================================

// 全局遊戲實例
let Game;

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
        // F5 easy: click all object-items in left and right groups
        const leftItems = Array.from(document.querySelectorAll('#left-objects .object-item:not(.clicked)'));
        const rightItems = Array.from(document.querySelectorAll('#right-objects .object-item:not(.clicked)'));
        const allItems = [...leftItems, ...rightItems];
        if (allItems.length === 0) return;
        this._queue = allItems.map(item => ({ target: item, action: () => item.click() }));
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
            }, 300);
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
                if (this._enabled && document.querySelector('.object-item')) {
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

// DOM 載入完成後初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    GameDebug.logInit('🌟 DOM 內容載入完成，開始初始化遊戲');
    GameDebug.performance.start('total-initialization');

    try {
        Game = new QuantityComparisonGame();
        
        // 全局導出供HTML onclick使用
        window.QuantityComparisonGame = Game;
        
        GameDebug.performance.end('total-initialization');
        GameDebug.logInit('🎉 F5 數量大小比較遊戲初始化完成！');
        
        // 輸出配置驅動開發總結
        GameDebug.log('init', '📋 配置驅動開發檢查清單', {
            '✅ 配置驅動音效系統': 'Audio.playSound() 使用配置',
            '✅ 配置驅動語音系統': 'Speech.speak() 使用模板和配置',
            '✅ 配置驅動UI生成': 'Templates 系統統一管理',
            '✅ 配置驅動時間管理': 'timing 參數來自配置',
            '✅ 配置驅動計分系統': 'scoring 參數來自配置',
            '✅ 詳細Debug系統': 'GameDebug 全面監控',
            '✅ 效能監控系統': 'Performance timing 追蹤'
        });
        
    } catch (error) {
        GameDebug.logError('💥 遊戲初始化失敗', {
            error: error.message,
            stack: error.stack
        });
        GameDebug.error('F5 遊戲初始化錯誤:', error);
    }
});

// 導出配置和模板（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        QuantityComparisonGame,
        QuantityComparisonConfig,
        QuantityComparisonTemplates
    };
} else {
    window.QuantityComparisonGame = QuantityComparisonGame;
    window.QuantityComparisonConfig = QuantityComparisonConfig;
    window.QuantityComparisonTemplates = QuantityComparisonTemplates;
}