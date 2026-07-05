// C4 正確的金額 作業單
WorksheetRegistry.register('c4', {
    name: '正確的金額',
    icon: '💰',
    defaultCount: 20,
    subtitle(opts) {
        const d = { '1': '1~9元', '2': '10~99元', '3': '100~999元', '4': '1000~9999元' };
        return d[opts.digits] || '';
    },

    toolbarConfig: {
        fontButton: {
            label: '🔤 目標金額',
            type: 'cycle',
            options: [
                { label: '1位數', value: '1' },
                { label: '2位數', value: '2' },
                { label: '3位數', value: '3' },
                { label: '4位數', value: '4' },
            ],
            getCurrentValue: (params) => params.digits || '2',
            onChange: (val, app) => { app.params.digits = val; app.generate(); }
        },
        orientationButton: {
            label: '📐 面額選擇',
            type: 'modal',
            multiSelect: true,
            options: [
                { label: '1元', value: '1' },
                { label: '5元', value: '5' },
                { label: '10元', value: '10' },
                { label: '50元', value: '50' },
                { label: '100元', value: '100' },
                { label: '500元', value: '500' },
                { label: '1000元', value: '1000' },
            ],
            getCurrentValue: (params) => params.denomFilter || '',
            onChange: (val, app) => { app.params.denomFilter = val; app.generate(); }
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
                    { label: '提示選擇', value: 'hint-select' },
                    { label: '提示完成', value: 'hint-complete' },
                ],
                getCurrentValue: (params) => params.c4QuestionType || 'coin-select',
                onChange: (val, app) => { app.params.c4QuestionType = val; app.generate(); }
            }
        ]
    },

    generate(options) {
        const { digits = '2', count = 20 } = options;
        const coinStyle = options.coinStyle || 'real';
        const questionType = options.c4QuestionType || 'coin-select';
        const digitRanges = { '1': [1, 9], '2': [10, 99], '3': [100, 999], '4': [1000, 9999] };
        const [min, max] = digitRanges[digits] || digitRanges['2'];
        const showAnswers = options._showAnswers || false;

        let denoms;
        if (options.denomFilter) {
            denoms = options.denomFilter.split(',').map(Number).filter(n => n > 0);
        }
        if (!denoms || denoms.length === 0) {
            const denomList = { '1': [1, 5, 10], '2': [1, 5, 10, 50], '3': [10, 50, 100, 500], '4': [100, 500, 1000] };
            denoms = denomList[digits] || denomList['2'];
        }

        const renderCoin = (value) => {
            if (coinStyle === 'symbol') return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };

        const coinQty = (value) => value >= 100 ? '張' : '個';

        const questions = [];

        for (let i = 0; i < count; i++) {
            const price = randomInt(min, max);
            const correctCombo = this._findCombo(price, denoms);

            if (questionType === 'fill') {
                if (!correctCombo) continue;
                const coinsHtml = correctCombo.map(c => Array(c.count).fill(renderCoin(c.denom)).join('')).join(' ');
                questions.push({
                    prompt: '數一數，總共有多少元？',
                    visual: `<div class="combo-coins">${coinsHtml}</div>`,
                    answerArea: showAnswers
                        ? `答：共 <span style="color:red;font-weight:bold;">${price}</span> 元`
                        : '答：共 ______ 元',
                    answerDisplay: ''
                });

            } else if (questionType === 'hint-complete') {
                if (!correctCombo) continue;
                const partsHtml = correctCombo.map(c => {
                    const icons = Array(c.count).fill(renderCoin(c.denom)).join('');
                    const answerNum = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${c.count}</span>`
                        : '___';
                    return `${answerNum}${coinQty(c.denom)} ${icons}`;
                }).join('&nbsp;&nbsp;');
                // 底線中間顯示灰色粗體數字答案提示
                const totalAnswer = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${price}</span>`
                    : `<span style="display:inline-block;border-bottom:2px solid #333;min-width:50px;text-align:center;"><span style="color:#ccc;font-weight:bold;">${price}</span></span>`;
                questions.push({
                    prompt: '數一數，總共多少元？',
                    visual: `<div class="combo-coins">${partsHtml} ＝ ${totalAnswer}元</div>`,
                    answerArea: '',
                    answerDisplay: ''
                });

            } else if (questionType === 'hint-select') {
                // 提示選擇：與 coin-select 相同，但每個選項旁加灰色金額提示
                const allCombos = this._generateCombos(price, denoms, correctCombo);
                const combosHtml = allCombos.map(combo => {
                    const isCorrect = combo.total === price;
                    const checkboxContent = showAnswers && isCorrect ? '✓' : '';
                    const checkboxStyle = showAnswers && isCorrect ? 'color: red; font-weight: bold;' : '';
                    const coinsHtml = combo.coins.map(c => Array(c.count).fill(renderCoin(c.denom)).join('')).join(' ');
                    const answerMark = showAnswers && isCorrect ? ' <span class="answer-text">✔ 正確</span>' : '';
                    return `<div class="combo-option">
                        <div class="combo-checkbox" style="${checkboxStyle}">${checkboxContent}</div>
                        <div class="combo-coins">${coinsHtml}</div>
                        <span style="color:#ccc;font-weight:bold;margin-left:6px;">${combo.total}元</span>${answerMark}
                    </div>`;
                }).join('');

                questions.push({
                    prompt: `哪一個是 ${price} 元？請勾選正確金錢組合：`,
                    visual: `<div class="combo-options">${combosHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                });

            } else {
                // coin-select
                const allCombos = this._generateCombos(price, denoms, correctCombo);
                const combosHtml = allCombos.map(combo => {
                    const isCorrect = combo.total === price;
                    const checkboxContent = showAnswers && isCorrect ? '✓' : '';
                    const checkboxStyle = showAnswers && isCorrect ? 'color: red; font-weight: bold;' : '';
                    const coinsHtml = combo.coins.map(c => Array(c.count).fill(renderCoin(c.denom)).join('')).join(' ');
                    const amtField = (showAnswers && isCorrect)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">${combo.total} 元</span>`
                        : `<span style="display:inline-flex;align-items:flex-end;align-self:flex-end;margin-left:6px;gap:2px;"><span style="display:inline-block;min-width:60px;border-bottom:1.5px solid #333;line-height:1;"></span><span>元</span></span>`;
                    return `<div class="combo-option">
                        <div class="combo-checkbox" style="${checkboxStyle}">${checkboxContent}</div>
                        <div class="combo-coins">${coinsHtml}</div>${amtField}
                    </div>`;
                }).join('');

                questions.push({
                    prompt: `哪一個是 ${price} 元？請勾選正確金錢組合：`,
                    visual: `<div class="combo-options">${combosHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                });
            }
        }
        return questions;
    },

    _findCombo(amount, denoms) {
        const sorted = [...denoms].sort((a, b) => b - a);
        const result = [];
        let remaining = amount;
        for (const d of sorted) {
            if (remaining >= d) {
                const c = Math.floor(remaining / d);
                result.push({ denom: d, count: c });
                remaining -= c * d;
            }
        }
        if (remaining > 0) return null;
        return result;
    },

    _generateCombos(price, denoms, correctCombo) {
        const combos = [];

        if (correctCombo) {
            combos.push({ coins: correctCombo, total: price });
        }

        const attempts = [];
        for (let t = 0; t < 20 && attempts.length < 3; t++) {
            const offset = randomInt(1, Math.max(3, Math.floor(price * 0.3)));
            const wrongAmount = Math.random() < 0.5 ? price + offset : Math.max(1, price - offset);
            if (wrongAmount === price || attempts.includes(wrongAmount)) continue;
            const wrongCombo = this._findCombo(wrongAmount, denoms);
            if (wrongCombo) {
                attempts.push(wrongAmount);
                combos.push({ coins: wrongCombo, total: wrongAmount });
            }
        }

        let fallback = 1;
        while (combos.length < 3) {
            const wrongAmount = price + fallback * 2;
            fallback++;
            if (combos.some(c => c.total === wrongAmount)) continue;
            const wrongCombo = this._findCombo(wrongAmount, denoms);
            if (wrongCombo) {
                combos.push({ coins: wrongCombo, total: wrongAmount });
            } else {
                const coins = walletToCoins(wrongAmount);
                const grouped = [];
                const seen = {};
                for (const c of coins) {
                    if (!seen[c]) { seen[c] = 0; }
                    seen[c]++;
                }
                for (const [d, cnt] of Object.entries(seen)) {
                    grouped.push({ denom: parseInt(d), count: cnt });
                }
                combos.push({ coins: grouped, total: wrongAmount });
            }
        }

        return shuffle(combos).slice(0, 4);
    }
});
