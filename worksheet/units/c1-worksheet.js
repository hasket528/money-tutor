// C1 認識錢幣 作業單 — 三種題型 + 金錢圖示類型
WorksheetRegistry.register('c1', {
    name: 'C1 認識錢幣',
    icon: '🪙',
    defaultCount: 20,
    subtitle(opts) {
        const c = { coins: '硬幣', notes: '紙鈔', mixed: '混合' };
        return `請將指定面額的錢幣圈出來（${c[opts.coinType] || '混合'}）`;
    },

    toolbarConfig: {
        fontButton: {
            label: '🔤 面額選擇',
            type: 'cycle',
            options: [
                { label: '硬幣', value: 'coins' },
                { label: '紙鈔', value: 'notes' },
                { label: '混合', value: 'mixed' },
            ],
            getCurrentValue: (params) => params.coinType || 'mixed',
            onChange: (val, app) => { app.params.coinType = val; app.generate(); }
        },
        orientationButton: {
            label: '📐 圖示類型',
            type: 'dropdown',
            options: [
                { label: '真實金錢(正面)', value: 'real' },
                { label: '真實金錢(反面)', value: 'real-back' },
                { label: '真實金錢(正、反面)', value: 'real-both' },
                { label: '金錢符號', value: 'symbol' },
            ],
            getCurrentValue: (params) => params.coinStyle || 'real-both',
            onChange: (val, app) => { app.params.coinStyle = val; app.generate(); }
        },
        adjustCountButton: {
            label: '🔢 圖示數量',
            type: 'dropdown',
            options: [
                { label: '3個', value: '3' },
                { label: '5個', value: '5' },
                { label: '7個', value: '7' },
                { label: '10個', value: '10' },
                { label: '自訂', value: 'custom' },
            ],
            getCurrentValue: (params) => params.coinCount || '5',
            onChange: (val, app) => {
                if (val === 'custom') {
                    const input = prompt('請輸入圖示數量（1-10）：');
                    const n = parseInt(input);
                    if (n >= 1 && n <= 10) {
                        app.params.coinCount = String(n);
                        app.generate();
                    } else {
                        alert('請輸入 1-10 之間的數字');
                    }
                    return;
                }
                app.params.coinCount = val;
                app.generate();
            }
        },
        extraButtons: [
            {
                id: 'question-type-btn',
                label: '📝 測驗題型',
                type: 'dropdown',
                options: [
                    { label: '數字顯示', value: 'number' },
                    { label: '圖片顯示', value: 'image' },
                    { label: '提示圈選', value: 'hint' },
                ],
                getCurrentValue: (params) => params.c1QuestionType || 'number',
                onChange: (val, app) => { app.params.c1QuestionType = val; app.generate(); }
            }
        ]
    },

    generate(options) {
        const { count = 20 } = options;
        const coinType = options.coinType || 'mixed';
        const totalCoins = parseInt(options.coinCount) || 5;
        const coinStyle = options.coinStyle || 'real-both';
        const questionType = options.c1QuestionType || 'number';
        const showAnswers = options._showAnswers || false;

        const renderCoin = (value) => {
            if (coinStyle === 'symbol') return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };

        // For C1 coin display, we need classes for answer/hint circles
        const renderCoinWithClass = (value, extraClass) => {
            if (coinStyle === 'symbol') {
                const isNote = value >= 100;
                return `<span class="coin-symbol${isNote ? ' note-symbol' : ''}${extraClass ? ' ' + extraClass : ''}">${value}</span>`;
            }
            const side = coinStyle === 'real-back' ? 'back' : coinStyle === 'real-both' ? (Math.random() < 0.5 ? 'front' : 'back') : 'front';
            return `<img src="../images/money/${value}_yuan_${side}.png" class="coin-img${value >= 100 ? ' note-img' : ''}${extraClass ? ' ' + extraClass : ''}" alt="${value}元">`;
        };

        let allValues;
        if (coinType === 'coins') allValues = [1, 5, 10, 50];
        else if (coinType === 'notes') allValues = [100, 500, 1000];
        else allValues = [1, 5, 10, 50, 100, 500, 1000];

        const questions = [];

        for (let i = 0; i < count; i++) {
            const targetValue = allValues[Math.floor(Math.random() * allValues.length)];
            const targetCount = randomInt(1, Math.max(1, Math.min(3, totalCoins - 1)));
            const distractorValues = allValues.filter(v => v !== targetValue);
            const distractorCount = totalCoins - targetCount;
            const coins = [];
            for (let j = 0; j < targetCount; j++) coins.push({ value: targetValue, isTarget: true });
            for (let j = 0; j < distractorCount; j++) {
                coins.push({ value: distractorValues[Math.floor(Math.random() * distractorValues.length)], isTarget: false });
            }
            const shuffled = shuffle(coins);

            // Build prompt based on question type
            const targetCoinDisplay = renderCoin(targetValue);
            let prompt;
            if (questionType === 'image' || questionType === 'hint') {
                prompt = `請將 ${targetValue} 元 ${targetCoinDisplay} 圈出來：`;
            } else {
                prompt = `請將 ${targetValue} 元圈出來：`;
            }

            // Build visual with appropriate classes
            const visual = `<div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">${
                shuffled.map(c => {
                    let extraClass = '';
                    if (showAnswers && c.isTarget) extraClass = 'coin-answer-circle';
                    else if (questionType === 'hint' && c.isTarget) extraClass = 'coin-hint-circle';
                    return renderCoinWithClass(c.value, extraClass);
                }).join('')
            }</div>`;

            questions.push({
                prompt,
                visual,
                answerArea: '',
                answerDisplay: questionType === 'number' ? `圈出 ${targetCount} ${coinQuantifier(targetValue)} ${targetValue} 元` : ''
            });
        }
        return questions;
    }
});
