// F2 唱數 作業單 — 圖示不重複
WorksheetRegistry.register('f2', {
    name: 'F2 唱數',
    icon: '🔢',
    defaultCount: 10,
    subtitle(opts) {
        const r = { 'range1-5': '1~5', 'range1-10': '1~10', 'range15-20': '15~20', 'range20-30': '20~30' };
        return `範圍：${r[opts.range] || '1~5'}`;
    },

    toolbarConfig: {
        adjustCountButton: {
            label: '📊 圖示數量',
            type: 'dropdown',
            options: [
                { label: '1-5', value: 'range1-5' },
                { label: '1-10', value: 'range1-10' },
                { label: '15-20', value: 'range15-20' },
                { label: '20-30', value: 'range20-30' },
                { label: '自訂', value: 'custom' },
            ],
            getCurrentValue: (params) => params.range || 'range1-5',
            onChange: (val, app) => {
                if (val === 'custom') {
                    const input = prompt('請輸入範圍（格式：最小值-最大值，例如 3-12）：');
                    if (input && input.match(/^\d+-\d+$/)) {
                        const [lo, hi] = input.split('-').map(Number);
                        if (lo >= 0 && hi > lo && hi <= 100) {
                            app.params.range = `custom_${lo}-${hi}`;
                            app.generate();
                            return;
                        }
                    }
                    alert('格式錯誤或範圍不合理');
                    return;
                }
                app.params.range = val;
                app.generate();
            }
        },
        fontButton: {
            label: '📝 測驗題型',
            type: 'dropdown',
            options: [
                { label: '數數完成', value: 'count' },
                { label: '提示完成', value: 'hint' },
            ],
            getCurrentValue: (params) => params.f2QuestionType || 'count',
            onChange: (val, app) => { app.params.f2QuestionType = val; app.generate(); }
        },
        orientationButton: {
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
        }
    },

    _themes: {
        fruits: ['🍎','🍌','🍇','🍓','🍊','🥝','🍍','🍉','🍑','🍒'],
        animals: ['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🐨','🐯','🦁'],
        vehicles: ['🚗','🚕','🚌','🚓','🚑','🚒','🚚','🚲','🚀','✈️'],
    },

    generate(options) {
        const { difficulty = 'easy', count = 10 } = options;
        const rangeStr = options.range || 'range1-5';
        const questionType = options.f2QuestionType || 'count';
        const showAnswers = options._showAnswers || false;
        let min, max;
        if (rangeStr.startsWith('custom_')) {
            const [lo, hi] = rangeStr.replace('custom_', '').split('-').map(Number);
            min = lo; max = hi;
        } else {
            const ranges = {
                'range1-5': [1, 5], 'range1-10': [1, 10],
                'range15-20': [15, 20], 'range20-30': [20, 30]
            };
            [min, max] = ranges[rangeStr] || ranges['range1-5'];
        }

        const theme = options.theme || 'fruits';
        const allIcons = theme === 'mixed'
            ? [...this._themes.fruits, ...this._themes.animals, ...this._themes.vehicles]
            : (this._themes[theme] || this._themes.fruits);
        const shuffledIcons = shuffle(allIcons);
        const questions = [];
        const usedAnswers = new Set();

        for (let i = 0; i < count; i++) {
            const icon = shuffledIcons[i % shuffledIcons.length];

            if (difficulty === 'easy') {
                const lo = min;
                const hi = max;
                let answer;
                let attempts = 0;
                do {
                    answer = randomInt(lo, hi);
                    attempts++;
                } while (usedAnswers.has(answer) && attempts < 50);
                usedAnswers.add(answer);

                if (questionType === 'hint') {
                    // 提示完成：每個圖示前顯示數字提示
                    const answerDisplay = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${answer}</span>`
                        : blankLine();
                    questions.push({
                        prompt: `數一數，共有幾個 ${icon}？`,
                        visual: this._gridWithHint(icon, answer, showAnswers),
                        answerArea: `答：${answerDisplay} 個`,
                        answerDisplay: ''
                    });
                } else {
                    // 數數完成：原本的題型
                    questions.push({
                        prompt: `數一數，共有幾個 ${icon}？`,
                        visual: this._grid(icon, answer),
                        answerArea: `答：${blankLine()} 個`,
                        answerDisplay: `${answer} 個`
                    });
                }
            } else if (difficulty === 'normal') {
                const start = randomInt(min, Math.max(min, max - 5));
                const len = Math.min(6, max - start + 1);
                const seq = [];
                const blanks = new Set();
                while (blanks.size < Math.min(2, len - 1)) {
                    blanks.add(randomInt(1, len - 1));
                }
                for (let j = 0; j < len; j++) {
                    if (blanks.has(j)) {
                        seq.push(blankLine());
                    } else {
                        seq.push(`<strong>${start + j}</strong>`);
                    }
                }
                const ansNums = [...blanks].sort((a, b) => a - b).map(b => start + b);
                questions.push({
                    prompt: '請填入正確的數字：',
                    visual: `<div style="font-size:14pt; letter-spacing: 8px;">${seq.join('，')}</div>`,
                    answerArea: '',
                    answerDisplay: ansNums.join('、')
                });
            } else {
                const start = randomInt(Math.max(min + 3, min), max);
                const len = Math.min(6, start - min + 1);
                const seq = [];
                const blanks = new Set();
                while (blanks.size < Math.min(2, len - 1)) {
                    blanks.add(randomInt(1, len - 1));
                }
                for (let j = 0; j < len; j++) {
                    if (blanks.has(j)) {
                        seq.push(blankLine());
                    } else {
                        seq.push(`<strong>${start - j}</strong>`);
                    }
                }
                const ansNums = [...blanks].sort((a, b) => a - b).map(b => start - b);
                questions.push({
                    prompt: '請填入正確的數字（倒數）：',
                    visual: `<div style="font-size:14pt; letter-spacing: 8px;">${seq.join('，')}</div>`,
                    answerArea: '',
                    answerDisplay: ansNums.join('、')
                });
            }
        }
        return questions;
    },

    _grid(icon, n) {
        let h = '<div class="item-grid">';
        for (let i = 0; i < n; i++) {
            if (i > 0 && i % 10 === 0) h += '<br>';
            h += `<span class="grid-item">${icon}</span> `;
        }
        return h + '</div>';
    },

    _gridWithHint(icon, n, showAnswers) {
        // 提示完成：每個圖示前顯示粗灰色數字（參照 A1 樣式 #ccc）
        let h = '<div class="item-grid" style="display:flex; flex-wrap:wrap; gap:4px; align-items:center;">';
        for (let i = 0; i < n; i++) {
            if (i > 0 && i % 10 === 0) h += '<br>';
            const num = i + 1;
            const numStyle = showAnswers
                ? 'color:red; font-weight:bold; font-size:0.9em; margin-right:2px;'
                : 'color:#ccc; font-weight:bold; font-size:0.9em; margin-right:2px;';
            h += `<span class="grid-item-hint-wrapper" style="display:inline-flex; align-items:center;">
                <span style="${numStyle}">${num}</span>
                <span class="grid-item">${icon}</span>
            </span> `;
        }
        return h + '</div>';
    }
});
