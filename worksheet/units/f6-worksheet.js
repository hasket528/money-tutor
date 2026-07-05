// F6 數的組成 作業單
WorksheetRegistry.register('f6', {
    name: 'F6 數的組成',
    icon: '🧮',
    defaultCount: 20,
    subtitle(opts) {
        const m = { composition: '合成', decomposition: '分解', fillBlank: '填空' };
        return m[opts.mode] || '合成';
    },

    _emojiSets: ['🍎','🍌','🍇','🍓','🍊','🥝','🍍','🍉','🍑','🍒'],

    toolbarConfig: {
        fontButton: {
            label: '📝 測驗題型',
            type: 'dropdown',
            options: [
                { label: '合成(數字)', value: 'composition-number' },
                { label: '合成(圖示)', value: 'composition-emoji' },
                { label: '分解(數字)', value: 'decomposition-number' },
                { label: '分解(圖示)', value: 'decomposition-emoji' },
                { label: '填空(數字)', value: 'fillBlank-number' },
                { label: '填空(圖示)', value: 'fillBlank-emoji' },
            ],
            getCurrentValue: (params) => {
                const mode = params.mode || 'composition';
                const displayMode = params.displayMode || 'number';
                return `${mode}-${displayMode}`;
            },
            onChange: (val, app) => {
                const [mode, displayMode] = val.split('-');
                app.params.mode = mode;
                app.params.displayMode = displayMode;
                app.generate();
            }
        },
        orientationButton: {
            label: '📐 數量範圍',
            type: 'dropdown',
            options: [
                { label: '2-5', value: 'range1-5' },
                { label: '2-10', value: 'range1-10' },
                { label: '5-15', value: 'range5-15' },
                { label: '自訂', value: 'custom' },
            ],
            getCurrentValue: (params) => params.f6CustomRange ? 'custom' : (params.numberRange || params.range || 'range1-5'),
            onChange: (val, app) => {
                if (val === 'custom') {
                    const input = prompt('請輸入範圍（格式：最小值-最大值，例如 3-12）：');
                    if (input && input.match(/^\d+-\d+$/)) {
                        const [lo, hi] = input.split('-').map(Number);
                        if (lo >= 2 && hi > lo && hi <= 30) {
                            app.params.f6CustomRange = `${lo}-${hi}`;
                            app.generate();
                            return;
                        }
                    }
                    alert('格式錯誤或範圍不合理');
                } else {
                    delete app.params.f6CustomRange;
                    app.params.numberRange = val;
                    app.generate();
                }
            }
        },
        adjustCountButton: null
    },

    generate(options) {
        const { mode = 'composition', count = 20 } = options;
        const displayMode = options.displayMode || 'number';
        let min, max;

        if (options.f6CustomRange) {
            const [lo, hi] = options.f6CustomRange.split('-').map(Number);
            min = lo; max = hi;
        } else {
            const nr = options.numberRange || options.range || 'range1-5';
            const ranges = {
                'range1-5': [2, 5], 'range1-10': [2, 10], 'range5-15': [5, 15]
            };
            [min, max] = ranges[nr] || ranges['range1-5'];
        }

        const questions = [];
        const emojiSet = this._emojiSets;

        for (let i = 0; i < count; i++) {
            const total = randomInt(min, max);
            let part1;
            if (displayMode === 'emoji') {
                // Emoji mode: ensure both parts >= 1
                part1 = randomInt(1, total - 1);
            } else {
                part1 = randomInt(0, total);
            }
            const part2 = total - part1;
            const emoji = emojiSet[i % emojiSet.length];

            const fmt = (n) => {
                if (displayMode === 'emoji') {
                    // emoji 模式：小數字顯示重複 emoji，大數字用「emoji × 數量」格式
                    // 使用 --ws-icon-scale CSS 變數支援圖示大小調整
                    const emojiStyle = 'style="font-size: calc(1.2em * var(--ws-icon-scale, 1)); display: inline-block;"';
                    if (n === 0) return `<span class="emoji-zero" ${emojiStyle}>(0)</span>`;
                    if (n <= 5) {
                        return `<span class="emoji-group" ${emojiStyle}>${emoji.repeat(n)}</span>`;
                    } else {
                        // 大數字：顯示「🍎 × 12」格式，節省空間
                        return `<span class="emoji-group" ${emojiStyle}>${emoji} × ${n}</span>`;
                    }
                }
                return `<strong>${n}</strong>`;
            };

            if (mode === 'composition') {
                // 合成：part1 + part2 = ___
                questions.push({
                    prompt: '請算出答案：',
                    visual: `<div class="composition-eq">
                        ${fmt(part1)} ＋ ${fmt(part2)} ＝ ${blankLine()}
                    </div>`,
                    answerArea: '',
                    answerDisplay: `${part1} + ${part2} = ${total}`
                });
            } else if (mode === 'decomposition') {
                // 分解：total = part1 + ___
                questions.push({
                    prompt: `${total} 可以分成哪兩個數？`,
                    visual: `<div class="composition-eq">
                        ${fmt(total)} ＝ ${fmt(part1)} ＋ ${blankLine()}
                    </div>`,
                    answerArea: '',
                    answerDisplay: `${total} = ${part1} + ${part2}`
                });
            } else {
                // 填空：part1 + ___ = total
                questions.push({
                    prompt: '請填入空格中的數字：',
                    visual: `<div class="composition-eq">
                        ${fmt(part1)} ＋ ${blankLine()} ＝ ${fmt(total)}
                    </div>`,
                    answerArea: '',
                    answerDisplay: `${part1} + ${part2} = ${total}`
                });
            }
        }
        return questions;
    }
});
