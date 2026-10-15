// F4 數字排序 作業單
WorksheetRegistry.register('f4', {
    name: 'F4 數字排序',
    icon: '🔢',
    defaultCount: 10,
    subtitle(opts) {
        const rs = opts.rangeSort || '1-10_3';
        const [rp] = rs.split('_');
        return `範圍：${rp}`;
    },

    toolbarConfig: {
        fontButton: {
            label: '📝 測驗題型',
            type: 'dropdown',
            options: [
                { label: '小到大', value: 'asc' },
                { label: '大到小', value: 'desc' },
                { label: '混合', value: 'mix' },
            ],
            getCurrentValue: (params) => params.f4SortDir || 'mix',
            onChange: (val, app) => { app.params.f4SortDir = val; app.generate(); }
        },
        adjustCountButton: {
            label: '🔢 數字範圍與數量',
            type: 'dropdown',
            options: [
                { label: '1-10 (3個)', value: '1-10_3' },
                { label: '1-10 (5個)', value: '1-10_5' },
                { label: '1-20 (5個)', value: '1-20_5' },
                { label: '1-20 (7個)', value: '1-20_7' },
                { label: '1-50 (7個)', value: '1-50_7' },
                { label: '1-50 (10個)', value: '1-50_10' },
                { label: '1-100 (10個)', value: '1-100_10' },
                { label: '自訂', value: 'custom' },
            ],
            getCurrentValue: (params) => params.rangeSort || '1-10_3',
            onChange: (val, app) => {
                if (val === 'custom') {
                    const input = prompt('請輸入範圍和數量（格式：最小值-最大值_數量，例如 1-30_6）：');
                    if (input && input.match(/^\d+-\d+_\d+$/)) {
                        const [rp, cp] = input.split('_');
                        const [lo, hi] = rp.split('-').map(Number);
                        const cnt = parseInt(cp);
                        if (lo >= 0 && hi > lo && cnt >= 2 && cnt <= 10 && cnt <= (hi - lo + 1)) {
                            app.params.rangeSort = input;
                            app.generate();
                            return;
                        }
                    }
                    alert('格式錯誤或範圍不合理（數量最多10個）');
                    return;
                }
                app.params.rangeSort = val;
                app.generate();
            }
        },
        orientationButton: {
            label: '📐 排序數列',
            type: 'cycle',
            options: [
                { label: '非連續', value: 'random' },
                { label: '連續', value: 'sequential' },
            ],
            getCurrentValue: (params) => params.sequential || 'sequential',
            onChange: (val, app) => { app.params.sequential = val; app.generate(); }
        },
        extraButtons: [
            {
                id: 'hint-btn',
                label: '💡 提示',
                type: 'dropdown',
                options: [
                    { label: '無提示', value: 'none' },
                    { label: '提示第1個', value: 'first' },
                    { label: '提示第1、3、5個', value: 'odd' },
                    { label: '提示全部', value: 'all' },
                ],
                getCurrentValue: (params) => params.f4Hint || 'none',
                onChange: (val, app) => { app.params.f4Hint = val; app.generate(); }
            }
        ]
    },

    generate(options) {
        const { count = 10 } = options;
        const rs = options.rangeSort || '1-10_3';
        const parts = rs.split('_');
        const rangePart = parts[0];
        const sortCount = parseInt(parts[1]) || 3;
        const [rMin, rMax] = rangePart.split('-').map(Number);
        const min = rMin || 1;
        const max = rMax || 10;

        const isSequential = (options.sequential || 'sequential') === 'sequential';
        const hintMode = options.f4Hint || 'none';
        const showAnswers = options._showAnswers || false;
        const sortDir = options.f4SortDir || 'mix';
        const questions = [];

        for (let i = 0; i < count; i++) {
            let arr;
            if (isSequential) {
                const start = randomInt(min, Math.max(min, max - sortCount + 1));
                arr = [];
                for (let j = 0; j < sortCount; j++) arr.push(start + j);
            } else {
                const nums = new Set();
                while (nums.size < Math.min(sortCount, max - min + 1)) {
                    nums.add(randomInt(min, max));
                }
                arr = [...nums];
            }

            let isDescending;
            if (sortDir === 'asc') isDescending = false;
            else if (sortDir === 'desc') isDescending = true;
            else isDescending = i % 2 === 1;

            const sorted = [...arr].sort((a, b) => isDescending ? b - a : a - b);
            const shuffled = shuffle(arr);

            // Determine which positions get hints
            const hintPositions = new Set();
            if (hintMode === 'first') {
                hintPositions.add(0);
            } else if (hintMode === 'odd') {
                for (let j = 0; j < sorted.length; j += 2) hintPositions.add(j);
            } else if (hintMode === 'all') {
                for (let j = 0; j < sorted.length; j++) hintPositions.add(j);
            }

            // Build sort boxes
            const boxes = sorted.map((num, idx) => {
                if (showAnswers) {
                    return `<div class="sort-box"><span class="answer-number">${num}</span></div>`;
                } else if (hintPositions.has(idx)) {
                    return `<div class="sort-box"><span class="hint-number">${num}</span></div>`;
                } else {
                    return '<div class="sort-box empty"></div>';
                }
            }).join(' → ');

            questions.push({
                prompt: isDescending ? '請將下列數字由大到小排列：' : '請將下列數字由小到大排列：',
                visual: `<div style="font-size:16pt; letter-spacing:6px;">${shuffled.join('　')}</div>`,
                answerArea: `<div class="sort-boxes">${boxes}</div>`,
                answerDisplay: showAnswers ? null : sorted.join(' → ')
            });
        }
        return questions;
    }
});
