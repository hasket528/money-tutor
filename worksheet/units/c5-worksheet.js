// C5 夠不夠 作業單 — 錢包用真實金錢圖片
WorksheetRegistry.register('c5', {
    name: 'C5 夠不夠',
    icon: '🤔',
    defaultCount: 30,
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
            description: '仍會參考目標金額位數，合理出現其他的不同面額的金錢',
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
        extraButtons: [{
            id: 'question-type-btn',
            label: '📝 測驗題型',
            type: 'dropdown',
            options: [
                { label: '數字填空', value: 'fill' },
                { label: '圖示選擇', value: 'coin-select' },
                { label: '提示選擇', value: 'coin-text' },
                { label: '提示完成', value: 'hint-complete' },
            ],
            getCurrentValue: (params) => params.c5QuestionType || 'fill',
            onChange: (val, app) => { app.params.c5QuestionType = val; app.generate(); }
        }]
    },

    items: {
        '1': [
            { name: '棒棒糖',   emoji: '🍭', img: 'icon-c5-lollipop' },
            { name: '星星貼紙', emoji: '⭐', img: 'icon-c5-star-sticker' },
            { name: '彩虹橡皮擦', emoji: '🌈', img: 'icon-c5-rainbow-eraser' },
            { name: '口香糖',   emoji: '🍬', img: 'icon-c5-gum' },
        ],
        '2': [
            { name: '餅乾',   emoji: '🍪', img: 'icon-c5-cookie' },
            { name: '彩色筆', emoji: '🎨', img: 'icon-c5-colored-pen' },
            { name: '筆袋',   emoji: '✏️', img: 'icon-c5-pencil-case' },
            { name: '玩具車', emoji: '🚗', img: 'icon-c5-toy-car' },
        ],
        '3': [
            { name: '故事書', emoji: '📚', img: 'icon-c5-story-book' },
            { name: '漫畫書', emoji: '📖', img: 'icon-c5-comic-book' },
            { name: '水壺',   emoji: '🥤', img: 'icon-c5-cup' },
            { name: '娃娃',   emoji: '🪆', img: 'icon-c5-doll' },
        ],
        '4': [
            { name: '平板',   emoji: '📱', img: 'icon-c5-tablet' },
            { name: '腳踏車', emoji: '🚲', img: 'icon-c5-bicycle' },
            { name: '球鞋',   emoji: '👟', img: 'icon-c5-basketball-shoes' },
            { name: '機器人', emoji: '🤖', img: 'icon-c5-robot' },
        ]
    },

    _itemImg(item) {
        if (item.img) {
            return `<img src="../images/c5/${item.img}.png" class="c-item-img" alt="${item.name}">`;
        }
        return `<span style="font-size:1.6em;">${item.emoji}</span>`;
    },

    generate(options) {
        const { digits = '2', count = 30 } = options;
        const coinStyle = options.coinStyle || 'real';
        const questionType = options.c5QuestionType || 'fill';
        const digitRanges = { '1': [1, 9], '2': [10, 99], '3': [100, 999], '4': [1000, 9999] };
        const [min, max] = digitRanges[digits] || digitRanges['2'];
        const itemPool = this.items[digits] || this.items['2'];
        const showAnswers = options._showAnswers || false;

        let walletDenoms;
        if (options.denomFilter) {
            walletDenoms = options.denomFilter.split(',').map(Number).filter(n => n > 0);
        }

        const renderCoin = (value) => {
            if (coinStyle === 'symbol') return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };

        const coinQty = (value) => value >= 100 ? '張' : '個';
        const checkbox = '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin:0 4px;vertical-align:middle;"></span>';

        const questions = [];
        const usedItems = new Set();

        for (let i = 0; i < count; i++) {
            const price = randomInt(min, max);

            if (usedItems.size >= itemPool.length) usedItems.clear();
            let item;
            do {
                item = itemPool[Math.floor(Math.random() * itemPool.length)];
            } while (usedItems.has(item.name) && usedItems.size < itemPool.length);
            usedItems.add(item.name);

            const enough = Math.random() < 0.5;
            let wallet;
            if (enough) {
                wallet = price + randomInt(0, Math.max(1, Math.floor(price * 0.3)));
            } else {
                wallet = Math.max(1, price - randomInt(1, Math.max(1, Math.floor(price * 0.3))));
            }
            const answer = wallet >= price ? '夠' : '不夠';
            const coins = walletDenoms ? this._walletWithDenoms(wallet, walletDenoms) : walletToCoins(wallet);
            const bigEmoji = this._itemImg(item);

            if (questionType === 'fill') {
                const totalDisplay = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${wallet}</span>`
                    : blankLine();
                const walletVisual = `<div style="display:flex; flex-wrap:wrap; gap:3px; align-items:center; margin:4px 0;">
                    ${coins.map(c => renderCoin(c)).join('')}
                    <span style="font-size:14pt; font-weight:bold; margin-left:6px;">= ${totalDisplay} 元</span>
                </div>`;

                const enoughCheck = showAnswers && answer === '夠'
                    ? '<span style="color:red;font-weight:bold;font-size:14pt;">✓</span>'
                    : '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin-right:4px;vertical-align:middle;"></span>';
                const notEnoughCheck = showAnswers && answer === '不夠'
                    ? '<span style="color:red;font-weight:bold;font-size:14pt;">✓</span>'
                    : '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin-right:4px;vertical-align:middle;"></span>';

                questions.push({
                    prompt: `${bigEmoji} ${item.name}的價格是 ${price} 元，請問你的錢，夠不夠買？`,
                    visual: walletVisual,
                    answerArea: `<div class="options-row">
                        <span style="font-size:13pt; padding:4px 0;">${enoughCheck}夠</span>
                        <span style="font-size:13pt; padding:4px 0;">${notEnoughCheck}不夠</span>
                    </div>`,
                    answerDisplay: ''
                });

            } else if (questionType === 'coin-select' || questionType === 'coin-text') {
                const opts = this._generateEnoughOptions(price, walletDenoms);
                const choicesHtml = opts.map((opt, idx) => {
                    const label = String.fromCharCode(9312 + idx);
                    const style = showAnswers && opt.isAnswer ? 'border-color: red; border-width: 3px;' : '';
                    const coinsHtml = opt.coins.map(c => renderCoin(c)).join('');
                    const textHint = questionType === 'coin-text'
                        ? `<span style="color:#ccc; font-weight:bold; margin-left:6px;">${opt.total}元</span>` : '';
                    const check = (showAnswers && opt.isAnswer)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const amtField = (showAnswers && opt.isAnswer)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${opt.total} 元</span>`
                        : `<span style="display:inline-flex;align-items:flex-end;align-self:flex-end;margin-left:6px;gap:2px;"><span style="display:inline-block;min-width:60px;border-bottom:1.5px solid #333;line-height:1;"></span><span>元</span></span>`;
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${coinsHtml}</div>${textHint}${amtField}
                    </div>`;
                }).join('');

                questions.push({
                    prompt: `${bigEmoji} ${item.name}的價格是 ${price} 元，請問哪一個選項的錢夠買？`,
                    visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: '',
                    _key: `c5_${price}_${wallet}`
                });

            } else if (questionType === 'hint-complete') {
                const combo = this._findCombo(wallet, walletDenoms || [1000, 500, 100, 50, 10, 5, 1]);
                if (!combo) continue;
                const partsHtml = combo.map(c => {
                    const icons = Array(c.count).fill(renderCoin(c.denom)).join('');
                    const answerNum = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${c.count}</span>`
                        : '___';
                    return `${answerNum}${coinQty(c.denom)} ${icons}`;
                }).join('&nbsp;&nbsp;');

                const totalColor = showAnswers ? 'red' : '#ccc';
                const totalHint = `<span style="font-size:14pt; font-weight:bold; margin-left:6px;">總共是 <span style="color:${totalColor};font-weight:bold;">${wallet}</span> 元</span>`;

                // 虛線框顯示在正確答案上，答案卷時變成紅色實線框
                const enoughStyle = answer === '夠'
                    ? (showAnswers ? 'border:2px solid red; border-radius:20px;' : 'border:1.5px dashed #333; border-radius:20px;')
                    : '';
                const notEnoughStyle = answer === '不夠'
                    ? (showAnswers ? 'border:2px solid red; border-radius:20px;' : 'border:1.5px dashed #333; border-radius:20px;')
                    : '';

                questions.push({
                    prompt: `${bigEmoji} ${item.name}的價格是 ${price} 元，數一數你的錢，夠不夠買？`,
                    visual: `<div class="combo-coins">${partsHtml} ${totalHint}</div>`,
                    answerArea: `<div class="options-row">
                        <span style="font-size:13pt; padding:4px 12px; ${enoughStyle}">夠</span>
                        <span style="font-size:13pt; padding:4px 12px; ${notEnoughStyle}">不夠</span>
                    </div>`,
                    answerDisplay: '',
                    _key: `c5_${price}_${wallet}`
                });
            }
        }
        return questions;
    },

    _walletWithDenoms(amount, denoms) {
        const sorted = [...denoms].sort((a, b) => b - a);
        const result = [];
        let remaining = amount;
        for (const d of sorted) {
            while (remaining >= d) {
                result.push(d);
                remaining -= d;
            }
        }
        if (remaining > 0) return walletToCoins(amount);
        return result;
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

    _generateEnoughOptions(price, walletDenoms) {
        const options = [];
        const enoughAmount = price + randomInt(0, Math.max(1, Math.floor(price * 0.3)));
        const enoughCoins = walletDenoms ? this._walletWithDenoms(enoughAmount, walletDenoms) : walletToCoins(enoughAmount);
        options.push({ coins: enoughCoins, total: enoughAmount, isAnswer: true });

        const usedTotals = new Set([enoughAmount]);
        for (let attempt = 0; attempt < 40 && options.length < 3; attempt++) {
            const notEnoughAmount = Math.max(1, price - randomInt(1, Math.max(1, Math.floor(price * 0.4))));
            if (usedTotals.has(notEnoughAmount)) continue;
            usedTotals.add(notEnoughAmount);
            const coins = walletDenoms ? this._walletWithDenoms(notEnoughAmount, walletDenoms) : walletToCoins(notEnoughAmount);
            options.push({ coins, total: notEnoughAmount, isAnswer: false });
        }

        while (options.length < 3) {
            let amt = Math.max(1, price - options.length * 2);
            while (usedTotals.has(amt) && amt > 1) amt--;
            usedTotals.add(amt);
            options.push({ coins: walletToCoins(amt), total: amt, isAnswer: false });
        }

        return shuffle(options);
    }
});
