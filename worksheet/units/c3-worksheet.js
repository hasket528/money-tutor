// C3 正確的金額 作業單
WorksheetRegistry.register('c3', {
    name: 'C3 正確的金額',
    icon: '💱',
    defaultCount: 8,
    subtitle() { return ''; },

    pairs: [
        { from: 5, to: 1, count: 5, category: 'small' },
        { from: 10, to: 1, count: 10, category: 'small' },
        { from: 10, to: 5, count: 2, category: 'small' },
        { from: 50, to: 5, count: 10, category: 'medium' },
        { from: 50, to: 10, count: 5, category: 'medium' },
        { from: 100, to: 10, count: 10, category: 'medium' },
        { from: 100, to: 50, count: 2, category: 'medium' },
        { from: 500, to: 100, count: 5, category: 'large' },
        { from: 1000, to: 100, count: 10, category: 'large' },
        { from: 1000, to: 500, count: 2, category: 'large' },
    ],

    toolbarConfig: {
        fontButton: {
            label: '🔤 兌換類別',
            type: 'dropdown',
            options: [
                { label: '全部', value: 'all' },
                { label: '小額 (1-10元)', value: 'small' },
                { label: '中額 (10-100元)', value: 'medium' },
                { label: '大額 (100-1000元)', value: 'large' },
            ],
            getCurrentValue: (params) => params.exchangeCategory || 'all',
            onChange: (val, app) => { app.params.exchangeCategory = val; app.generate(); }
        },
        orientationButton: {
            label: '📐 兌換方向',
            type: 'cycle',
            options: [
                { label: '混合', value: 'mixed' },
                { label: '合成', value: 'compose' },
                { label: '分解', value: 'decompose' },
            ],
            getCurrentValue: (params) => params.exchangeDirection || 'mixed',
            onChange: (val, app) => { app.params.exchangeDirection = val; app.generate(); }
        },
        adjustCountButton: {
            label: '📊 圖示類型',
            type: 'dropdown',
            options: [
                { label: '真實金錢(正面)', value: 'real' },
                { label: '真實金錢(反面)', value: 'real-back' },
                { label: '真實金錢(正、反面)', value: 'real-both' },
                { label: '金錢符號', value: 'symbol' },
            ],
            getCurrentValue: (params) => params.coinStyle || 'real',
            onChange: (val, app) => { app.params.coinStyle = val; app.generate(); }
        },
        extraButtons: [
            {
                id: 'question-type-btn',
                label: '📝 測驗題型',
                type: 'dropdown',
                options: [
                    { label: '數字填空', value: 'fill' },
                    { label: '圖示選擇', value: 'coin-select' },
                    { label: '圖示提示', value: 'hint-complete' },
                ],
                getCurrentValue: (params) => params.questionType || 'fill',
                onChange: (val, app) => { app.params.questionType = val; app.generate(); }
            }
        ]
    },

    generate(options) {
        const { count = 8 } = options;
        const cat = options.exchangeCategory || 'all';
        const dir = options.exchangeDirection || 'mixed';
        const coinStyle = options.coinStyle || 'real';
        const questionType = options.questionType || 'fill';
        const showAnswers = options._showAnswers || false;
        const renderCoin = (value) => {
            if (coinStyle === 'symbol') return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };
        const checkbox = '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin:0 4px;vertical-align:middle;"></span>';

        const answerOrBlank = (val) => showAnswers
            ? `<span style="color:red;font-weight:bold;">${val}</span>`
            : blankLine();

        let filteredPairs = this.pairs;
        if (cat !== 'all') {
            filteredPairs = this.pairs.filter(p => p.category === cat);
        }
        if (filteredPairs.length === 0) filteredPairs = this.pairs;

        const questions = [];
        const selected = pickRandom(filteredPairs, count);
        while (selected.length < count) {
            selected.push(filteredPairs[Math.floor(Math.random() * filteredPairs.length)]);
        }

        for (let i = 0; i < count; i++) {
            const p = selected[i];
            let doCompose;
            if (dir === 'compose') doCompose = true;
            else if (dir === 'decompose') doCompose = false;
            else doCompose = Math.random() < 0.5;

            if (questionType === 'fill') {
                if (doCompose) {
                    const correctAnswer = 1;
                    questions.push({
                        prompt: `${p.count}${coinQuantifier(p.to)}${p.to}元 ${renderCoin(p.to)} 可以換成幾${coinQuantifier(p.from)}${p.from}元 ${renderCoin(p.from)}？`,
                        visual: '',
                        answerArea: `答：可以換 ${answerOrBlank(correctAnswer)} ${coinQuantifier(p.from)} ${p.from}元`,
                        answerDisplay: ''
                    });
                } else {
                    questions.push({
                        prompt: `1${coinQuantifier(p.from)}${p.from}元 ${renderCoin(p.from)} 可以換成幾${coinQuantifier(p.to)}${p.to}元 ${renderCoin(p.to)}？`,
                        visual: '',
                        answerArea: `答：可以換 ${answerOrBlank(p.count)} ${coinQuantifier(p.to)} ${p.to}元`,
                        answerDisplay: ''
                    });
                }
            } else if (questionType === 'coin-select') {
                // 圖示選擇：3個選項帶方格勾選
                const correctCount = doCompose ? 1 : p.count;
                const targetDenom = doCompose ? p.from : p.to;
                const sourceDenom = doCompose ? p.to : p.from;
                const sourceCount = doCompose ? p.count : 1;

                const opts = this._generateSelectOptions(correctCount, targetDenom);
                const choicesHtml = opts.map((opt, idx) => {
                    const label = String.fromCharCode(9312 + idx);
                    const isCorrect = opt.count === correctCount;
                    const style = showAnswers && isCorrect ? 'border-color: red; border-width: 3px;' : '';
                    const coinsVisual = Array(opt.count).fill(renderCoin(targetDenom)).join('');
                    const check = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const correctAmount = opt.count * targetDenom;
                    const amtField = (showAnswers && isCorrect)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${correctAmount} 元</span>`
                        : `<span style="display:inline-flex;align-items:flex-end;align-self:flex-end;margin-left:6px;gap:2px;"><span style="display:inline-block;min-width:60px;border-bottom:1.5px solid #333;line-height:1;"></span><span>元</span></span>`;
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${coinsVisual}</div>${amtField}
                    </div>`;
                }).join('');

                const sourceVisual = Array(sourceCount).fill(renderCoin(sourceDenom)).join('');
                questions.push({
                    prompt: `${sourceCount}${coinQuantifier(sourceDenom)}${sourceDenom}元 ${sourceVisual} 可以換成幾${coinQuantifier(targetDenom)}${targetDenom}元 ${renderCoin(targetDenom)}？請勾選：`,
                    visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                });
            } else if (questionType === 'hint-complete') {
                // 圖示提示
                // 分解：1個大面額 = 幾個小面額（例：1個10元 = 2個5元）
                // 合成：多個小面額 = 幾個大面額（例：2個5元 = 1個10元）
                const correctCount = doCompose ? 1 : p.count;
                const targetDenom = doCompose ? p.from : p.to;
                const sourceDenom = doCompose ? p.to : p.from;
                const sourceCount = doCompose ? p.count : 1;

                const sourceVisual = Array(sourceCount).fill(renderCoin(sourceDenom)).join('');
                // 顯示正確數量的目標面額圖示（無勾選框）
                const targetVisual = Array(correctCount).fill(renderCoin(targetDenom)).join('');

                // 填空欄位：___個X元
                const answerBlank = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${correctCount}</span>`
                    : '___';

                questions.push({
                    prompt: `${sourceCount}${coinQuantifier(sourceDenom)}${sourceDenom}元 ${sourceVisual} ＝ 幾${coinQuantifier(targetDenom)}${targetDenom}元？請數一數：`,
                    visual: `<div style="display:flex; flex-wrap:wrap; gap:4px; align-items:center;">${targetVisual} ＝ ${answerBlank}${coinQuantifier(targetDenom)}${targetDenom}元</div>`,
                    answerArea: '',
                    answerDisplay: ''
                });
            }
        }
        return questions;
    },

    _generateSelectOptions(correctCount, denom) {
        const opts = [{ count: correctCount }];
        const attempts = new Set([correctCount]);
        for (let t = 0; t < 20 && opts.length < 3; t++) {
            const wrong = correctCount + randomInt(-3, 3);
            if (wrong <= 0 || attempts.has(wrong)) continue;
            attempts.add(wrong);
            opts.push({ count: wrong });
        }
        while (opts.length < 3) {
            const wrong = correctCount + opts.length + 1;
            opts.push({ count: wrong });
        }
        return shuffle(opts);
    }
});
