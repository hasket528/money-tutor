// F3 數字認讀 作業單 — 圈出正確數量（圖示不重複）
WorksheetRegistry.register('f3', {
    name: 'F3 數字認讀',
    icon: '🔢',
    defaultCount: 8,
    subtitle() {
        return '圈出正確數量';
    },

    _themes: {
        fruits: ['🍎','🍌','🍇','🍓','🍊','🥝','🍍','🍉','🍑','🍒'],
        animals: ['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🐨','🐯','🦁'],
        vehicles: ['🚗','🚕','🚌','🚓','🚑','🚒','🚚','🚲','🚀','✈️'],
    },

    toolbarConfig: {
        adjustCountButton: {
            label: '🔢 數字範圍',
            type: 'dropdown',
            options: [
                { label: '1-5', value: '1-5' },
                { label: '1-10', value: '1-10' },
                { label: '5-15', value: '5-15' },
                { label: '10-20', value: '10-20' },
                { label: '自訂', value: 'custom' },
            ],
            getCurrentValue: (params) => params.numberRange || '1-10',
            onChange: (val, app) => {
                if (val === 'custom') {
                    const input = prompt('請輸入範圍（格式：最小值-最大值，例如 3-12）：');
                    if (input && input.match(/^\d+-\d+$/)) {
                        const [lo, hi] = input.split('-').map(Number);
                        if (lo >= 1 && hi > lo && hi <= 30) {
                            app.params.numberRange = `custom_${lo}-${hi}`;
                            app.generate();
                            return;
                        }
                    }
                    alert('格式錯誤或範圍不合理');
                    return;
                }
                app.params.numberRange = val;
                app.generate();
            }
        },
        fontButton: {
            label: '🎨 主題選擇',
            type: 'dropdown',
            options: [
                { label: '水果', value: 'fruits' },
                { label: '動物', value: 'animals' },
                { label: '交通工具', value: 'vehicles' },
                { label: '混合', value: 'mixed' },
            ],
            getCurrentValue: (params) => params.theme || 'fruits',
            onChange: (val, app) => { app.params.theme = val; app.generate(); }
        },
        orientationButton: null,
        extraButtons: [{
            id: 'question-type-btn',
            label: '📝 測驗題型',
            type: 'dropdown',
            options: [
                { label: '一般', value: 'normal' },
                { label: '虛線提示', value: 'hint' },
            ],
            getCurrentValue: (params) => params.f3QuestionType || 'normal',
            onChange: (val, app) => { app.params.f3QuestionType = val; app.generate(); }
        }]
    },

    generate(options) {
        const { count = 8 } = options;
        const rangeStr = options.numberRange || '1-10';
        const hintMode = options.f3QuestionType || 'normal';
        let minTarget, maxTarget;
        if (rangeStr.startsWith('custom_')) {
            const [lo, hi] = rangeStr.replace('custom_', '').split('-').map(Number);
            minTarget = lo; maxTarget = hi;
        } else {
            const ranges = { '1-5': [1, 5], '1-10': [1, 10], '5-15': [5, 15], '10-20': [10, 20] };
            [minTarget, maxTarget] = ranges[rangeStr] || ranges['1-10'];
        }

        const theme = options.theme || 'fruits';
        const allIcons = theme === 'mixed'
            ? [...this._themes.fruits, ...this._themes.animals, ...this._themes.vehicles]
            : (this._themes[theme] || this._themes.fruits);
        const shuffledIcons = shuffle(allIcons);
        const questions = [];

        for (let i = 0; i < count; i++) {
            const icon = shuffledIcons[i % shuffledIcons.length];
            const target = randomInt(minTarget, maxTarget);
            const total = target + randomInt(1, Math.max(1, Math.min(5, maxTarget - target + 3)));

            const showAnswers = options._showAnswers || false;
            let visual = '<div class="item-grid">';
            for (let j = 0; j < total; j++) {
                const hintClass = (hintMode === 'hint' && j < target) ? ' grid-item-hint' : '';
                const answerClass = (showAnswers && j < target) ? ' grid-item-answer' : '';
                visual += `<span class="grid-item${hintClass}${answerClass}">${icon}</span> `;
            }
            visual += '</div>';

            questions.push({
                prompt: `請圈出 <strong style="font-size:1.4em;">${target}</strong> 個 ${icon}：`,
                visual,
                answerArea: '',
                answerDisplay: ''
            });
        }
        return questions;
    }
});
