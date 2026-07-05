// C6 找零 作業單
WorksheetRegistry.register('c6', {
    name: 'C6 找零',
    icon: '🧾',
    defaultCount: 30,
    subtitle(opts) {
        const amounts = (opts.walletAmount || '50,100,200,500').split(',');
        return `付款金額：${amounts.map(a => a === 'random' ? '隨機' : a + '元').join('、')}`;
    },

    toolbarConfig: {
        fontButton: {
            label: '🔤 錢包金額',
            type: 'modal',
            multiSelect: true,
            options: [
                { label: '50元', value: '50' },
                { label: '100元', value: '100' },
                { label: '200元', value: '200' },
                { label: '500元', value: '500' },
                { label: '隨機(50-500)', value: 'random' },
            ],
            getCurrentValue: (params) => params.walletAmount || '50,100,200,500',
            onChange: (val, app) => {
                const values = val.split(',');
                if (values.includes('random') && values.length > 1) {
                    alert('「隨機」不能與其他金額同時選擇，請只選擇「隨機」或其他金額。');
                    return;
                }
                app.params.walletAmount = val;
                app.generate();
            }
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
        orientationButton: null,
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
                getCurrentValue: (params) => params.questionType || 'fill',
                onChange: (val, app) => { app.params.questionType = val; app.generate(); }
            }
        ]
    },

    allItems: [
        { name: '餅乾',     emoji: '🍪', img: 'icon-c6-cookie' },
        { name: '飲料',     emoji: '🥤', img: 'icon-c6-drink' },
        { name: '鉛筆',     emoji: '✏️', img: 'icon-c6-pencil' },
        { name: '橡皮擦',   emoji: '🧹', img: 'icon-c6-eraser' },
        { name: '棒棒糖',   emoji: '🍭', img: 'icon-c6-lollipop' },
        { name: '漢堡',     emoji: '🍔', img: 'icon-c6-hamburger' },
        { name: '蛋糕',     emoji: '🍰', img: 'icon-c6-cake' },
        { name: '積木',     emoji: '🧱', img: 'icon-c6-blocks' },
        { name: '玩具熊',   emoji: '🧸', img: 'icon-c6-teddy-bear' },
        { name: '筆記本',   emoji: '📓', img: 'icon-c6-notebook' },
        { name: '口香糖',   emoji: '🍬', img: 'icon-c6-gum' },
        { name: '巧克力',   emoji: '🍫', img: 'icon-c6-chocolate' },
        { name: '星星貼紙', emoji: '⭐', img: 'icon-c6-star-sticker' },
        { name: '愛心貼紙', emoji: '💖', img: 'icon-c6-heart-sticker' },
        { name: '球',       emoji: '⚽', img: 'icon-c6-ball' },
    ],

    _itemImg(item) {
        if (item.img) {
            return `<img src="../images/c6/${item.img}.png" class="c-item-img" alt="${item.name}">`;
        }
        return `<span style="font-size:1.6em;">${item.emoji}</span>`;
    },

    generate(options) {
        const { count = 30 } = options;
        const walletOptionStrs = (options.walletAmount || '50,100,200,500').split(',');
        const questionType = options.questionType || 'fill';
        const coinStyle = options.coinStyle || 'real';
        const showAnswers = options._showAnswers || false;
        const renderCoin = (value) => {
            if (coinStyle === 'symbol') return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };
        const checkbox = '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin:0 4px;vertical-align:middle;"></span>';

        const items = this.allItems;

        const questions = [];

        for (let i = 0; i < count; i++) {
            const walletStr = walletOptionStrs[Math.floor(Math.random() * walletOptionStrs.length)];
            let wallet;
            if (walletStr === 'random') {
                wallet = Math.round(randomInt(50, 500) / 10) * 10;
            } else {
                wallet = parseInt(walletStr);
            }

            const price = randomInt(1, wallet - 1);
            const change = wallet - price;
            const item = items[Math.floor(Math.random() * items.length)];
            const bigEmoji = this._itemImg(item);

            if (questionType === 'fill') {
                const changeDisplay = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${change}</span>`
                    : blankLine();
                questions.push({
                    prompt: `${bigEmoji} ${item.name}的價格是 ${price} 元，付了 ${wallet} 元，應該找回多少元？`,
                    visual: '',
                    answerArea: `答：找回 ${changeDisplay} 元`,
                    answerDisplay: ''
                });
            } else if (questionType === 'coin-select') {
                const correctCoins = walletToCoins(change);
                const opts = this._generateCoinOptions(change, correctCoins);
                const choicesHtml = opts.map((opt, idx) => {
                    const label = String.fromCharCode(9312 + idx);
                    const isCorrect = opt.total === change;
                    const style = showAnswers && isCorrect ? 'border-color: red; border-width: 3px;' : '';
                    const check = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const amtField = (showAnswers && isCorrect)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${opt.total} 元</span>`
                        : `<span style="display:inline-flex;align-items:flex-end;align-self:flex-end;margin-left:6px;gap:2px;"><span style="display:inline-block;min-width:60px;border-bottom:1.5px solid #333;line-height:1;"></span><span>元</span></span>`;
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>${amtField}
                    </div>`;
                }).join('');

                questions.push({
                    prompt: `${bigEmoji} ${item.name}的價格是 ${price} 元，付了 ${wallet} 元，應該找回 ${change} 元？請選出正確的找零組合：`,
                    visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                });
            } else if (questionType === 'hint-select') {
                const correctCoins = walletToCoins(change);
                const opts = this._generateCoinOptions(change, correctCoins);
                const choicesHtml = opts.map((opt, idx) => {
                    const label = String.fromCharCode(9312 + idx);
                    const isCorrect = opt.total === change;
                    const style = showAnswers && isCorrect ? 'border-color: red; border-width: 3px;' : '';
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold; min-width:20px;">${label}</span>${checkbox}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>
                        <span style="color:#ccc;font-weight:bold;margin-left:6px;">${opt.total}元</span>
                    </div>`;
                }).join('');

                questions.push({
                    prompt: `${bigEmoji} ${item.name}的價格是 ${price} 元，付了 ${wallet} 元，應該找 ${change} 元，請選出正確的找零組合：`,
                    visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                });
            } else if (questionType === 'hint-complete') {
                const combo = this._findCombo(change);
                if (!combo) continue;
                const coinQty = (value) => value >= 100 ? '張' : '個';
                const partsHtml = combo.map(c => {
                    const icons = Array(c.count).fill(renderCoin(c.denom)).join('');
                    const answerNum = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${c.count}</span>`
                        : '___';
                    return `${answerNum}${coinQty(c.denom)} ${icons}`;
                }).join('&nbsp;&nbsp;');
                const totalHint = `<span style="font-size:14pt; font-weight:bold; margin-left:6px;">共 <span style="color:#ccc;font-weight:bold;">${change}</span> 元</span>`;

                questions.push({
                    prompt: `${bigEmoji} ${item.name}的價格是 ${price} 元，付了 ${wallet} 元，應該找回多少元？`,
                    visual: `<div style="margin:4px 0;">找回 ${partsHtml} ${totalHint}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                });
            }
        }
        return questions;
    },

    _findCombo(amount) {
        const denoms = [1000, 500, 100, 50, 10, 5, 1];
        const result = [];
        let remaining = amount;
        for (const d of denoms) {
            if (remaining >= d) {
                const c = Math.floor(remaining / d);
                result.push({ denom: d, count: c });
                remaining -= c * d;
            }
        }
        if (remaining > 0) return null;
        return result;
    },

    _generateCoinOptions(correctAmount, correctCoins) {
        const options = [{ coins: [...correctCoins], total: correctAmount }];

        for (let attempt = 0; attempt < 20 && options.length < 3; attempt++) {
            const offset = randomInt(1, Math.max(5, Math.floor(correctAmount * 0.3)));
            const wrongAmount = Math.random() < 0.5
                ? correctAmount + offset
                : Math.max(1, correctAmount - offset);
            if (options.some(o => o.total === wrongAmount)) continue;
            const wrongCoins = walletToCoins(wrongAmount);
            options.push({ coins: wrongCoins, total: wrongAmount });
        }

        while (options.length < 3) {
            const wrongAmount = correctAmount + options.length * 3;
            options.push({ coins: walletToCoins(wrongAmount), total: wrongAmount });
        }

        return shuffle(options);
    }
});
