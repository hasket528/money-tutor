// C2 數錢 作業單 — 使用真實金錢圖片
WorksheetRegistry.register('c2', {
    name: 'C2 數錢',
    icon: '💰',
    defaultCount: 20,
    subtitle(opts) {
        return '';
    },

    toolbarConfig: {
        fontButton: {
            label: '🔤 面額選擇',
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
            getCurrentValue: (params) => params.denoms || '1,5,10,50,100,500,1000',
            onChange: (val, app) => { app.params.denoms = val; app.generate(); }
        },
        orientationButton: {
            label: '📐 金錢數量',
            type: 'cycle',
            options: [
                { label: '2-4個', value: 'easy' },
                { label: '2-6個', value: 'normal' },
                { label: '2-10個', value: 'hard' },
            ],
            getCurrentValue: (params) => params.difficulty || 'easy',
            onChange: (val, app) => { app.params.difficulty = val; app.generate(); }
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
        extraButtons: [{
            id: 'question-type-btn',
            label: '📝 測驗題型',
            type: 'dropdown',
            options: [
                { label: '數字填空', value: 'fill' },
                { label: '提示完成', value: 'hint-complete' },
            ],
            getCurrentValue: (params) => params.c2QuestionType || 'fill',
            onChange: (val, app) => { app.params.c2QuestionType = val; app.generate(); }
        }]
    },

    generate(options) {
        const { difficulty = 'easy', count = 20 } = options;
        const denomStr = options.denoms || '1,5,10,50,100,500,1000';
        const denoms = denomStr.split(',').map(Number);
        const coinStyle = options.coinStyle || 'real';
        const questionType = options.c2QuestionType || 'fill';
        const showAnswers = options._showAnswers || false;
        const renderCoin = (value) => {
            if (coinStyle === 'symbol') return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };

        const questions = [];
        const maxCoins = difficulty === 'easy' ? 4 : difficulty === 'normal' ? 6 : 10;
        const coinQty = (value) => value >= 100 ? '張' : '個';

        for (let i = 0; i < count; i++) {
            const numCoins = randomInt(2, maxCoins);
            const selected = [];
            let total = 0;
            for (let j = 0; j < numCoins; j++) {
                const d = denoms[Math.floor(Math.random() * denoms.length)];
                selected.push(d);
                total += d;
            }
            selected.sort((a, b) => b - a);

            if (questionType === 'hint-complete') {
                // Group by denomination
                const grouped = {};
                selected.forEach(d => { grouped[d] = (grouped[d] || 0) + 1; });
                const combo = Object.entries(grouped)
                    .map(([d, c]) => ({ denom: parseInt(d), count: c }))
                    .sort((a, b) => b.denom - a.denom);

                const partsHtml = combo.map(c => {
                    const icons = Array(c.count).fill(renderCoin(c.denom)).join('');
                    const answerNum = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${c.count}</span>` : '___';
                    return `${answerNum}${coinQty(c.denom)} ${icons}`;
                }).join('&nbsp;&nbsp;');
                const totalColor = showAnswers ? 'color:red' : 'color:#ccc';
                const totalHint = `共 <span style="${totalColor};font-weight:bold;">${total}</span> 元`;

                questions.push({
                    prompt: '數一數，下面的錢共有多少元？',
                    visual: `<div style="display:flex; flex-wrap:wrap; gap:4px; align-items:center;">${partsHtml} <span style="font-size:14pt; font-weight:bold; margin-left:6px;">${totalHint}</span></div>`,
                    answerArea: '',
                    answerDisplay: ''
                });
            } else {
                // fill (default)
                questions.push({
                    prompt: '數一數，下面的錢共有多少元？',
                    visual: `<div style="display:flex; flex-wrap:wrap; gap:4px; align-items:center;">${selected.map(d => renderCoin(d)).join('')}</div>`,
                    answerArea: showAnswers
                        ? `答：共 <span style="color:red;font-weight:bold;">${total}</span> 元`
                        : `答：共 ${blankLine()} 元`,
                    answerDisplay: ''
                });
            }
        }
        return questions;
    }
});
