// A1 販賣機 作業單 — 使用專案飲料圖片
WorksheetRegistry.register('a1', {
    name: 'A1 販賣機',
    icon: '🥤',
    defaultCount: 20,
    subtitle() { return '投幣與找零計算'; },

    toolbarConfig: {
        fontButton: null,
        orientationButton: null,
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
                { label: '數字填空(價格計算)', value: 'price-fill' },
                { label: '圖示填空(價格計算)', value: 'price-img-fill' },
                { label: '填空與選擇(價格計算)', value: 'price-fill-select' },
                { label: '圖示選擇(價格計算)', value: 'price-coin-select' },
                { label: '提示選擇(價格計算)', value: 'price-hint-select' },
                { label: '提示完成(價格計算)', value: 'price-hint-complete' },
                { label: '數字填空(找零計算)', value: 'fill' },
                { label: '圖示填空(找零計算)', value: 'img-fill' },
                { label: '填空與選擇(找零計算)', value: 'fill-select' },
                { label: '圖示選擇(找零計算)', value: 'coin-select' },
                { label: '提示選擇(找零計算)', value: 'hint-select' },
                { label: '提示完成(找零計算)', value: 'hint-complete' },
            ],
            getCurrentValue: (params) => params.questionType || 'price-fill',
            onChange: (val, app) => { app.params.questionType = val; app.generate(); }
        }]
    },

    drinks: [
        { name: '極品炭焙咖啡', price: 35, img: 'icon-a01-premium-roasted-coffee' },
        { name: '巨峰葡萄汁', price: 35, img: 'icon-a02-kyoho-grape-juice' },
        { name: '烏龍茶', price: 30, img: 'icon-a03-oolong-tea' },
        { name: '油切無糖綠茶', price: 30, img: 'icon-a04-sugar-free-green-tea' },
        { name: '特濃可可', price: 30, img: 'icon-a05-rich-cocoa' },
        { name: '陽光果粒柳橙汁', price: 35, img: 'icon-a06-orange-pulp-juice' },
        { name: '經典可樂', price: 30, img: 'icon-a07-classic-coke' },
        { name: '沁涼沙士', price: 25, img: 'icon-a08-sarsaparilla-drink' },
        { name: '氣泡蘋果飲', price: 25, img: 'icon-a09-sparkling-apple-drink' },
        { name: '勁爽沁涼可樂', price: 30, img: 'icon-a10-refreshing-cola' },
        { name: '阿薩姆奶茶', price: 28, img: 'icon-a11-assam-milk-tea' },
        { name: '鮮萃凍檸紅茶', price: 25, img: 'icon-a12-iced-lemon-tea' },
        { name: '蜜桃紅茶', price: 28, img: 'icon-a13-peach-black-tea' },
        { name: '皇家英倫奶茶', price: 28, img: 'icon-a14-royal-milk-tea' },
        { name: '運動補給飲', price: 25, img: 'icon-a15-sports-drink' },
        { name: '古早味豆漿', price: 25, img: 'icon-a16-traditional-soy-milk' },
        { name: '雪山礦泉水', price: 20, img: 'icon-a17-mountain-spring-water' },
        { name: '草莓歐蕾', price: 30, img: 'icon-a18-strawberry-au-lait' },
        { name: '蘆薈果粒飲', price: 30, img: 'icon-a19-aloe-drink' },
    ],

    _drinkImg(drink) {
        return `<img src="../images/a1/${drink.img}.png" class="drink-img" alt="${drink.name}">`;
    },

    // 將價格轉換為金錢圖示顯示
    _renderPriceWithCoins(price, renderCoin) {
        const coins = walletToCoins(price);
        return `<span class="price-coins">${coins.map(c => renderCoin(c)).join('')}</span>`;
    },

    // 選擇不重複價格的飲料
    _selectDrinksWithUniquePrice(count) {
        // 按價格分組
        const byPrice = {};
        for (const drink of this.drinks) {
            if (!byPrice[drink.price]) byPrice[drink.price] = [];
            byPrice[drink.price].push(drink);
        }
        const uniquePrices = Object.keys(byPrice).map(Number);
        // 隨機打亂價格順序
        for (let i = uniquePrices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [uniquePrices[i], uniquePrices[j]] = [uniquePrices[j], uniquePrices[i]];
        }
        // 取前 count 個不同價格，每個價格隨機選一個飲料
        const result = [];
        for (let i = 0; i < Math.min(count, uniquePrices.length); i++) {
            const price = uniquePrices[i];
            const drinksAtPrice = byPrice[price];
            result.push(drinksAtPrice[Math.floor(Math.random() * drinksAtPrice.length)]);
        }
        // 如果不夠，重複使用（但盡量避免連續相同價格）
        while (result.length < count) {
            const randomPrice = uniquePrices[Math.floor(Math.random() * uniquePrices.length)];
            const drinksAtPrice = byPrice[randomPrice];
            result.push(drinksAtPrice[Math.floor(Math.random() * drinksAtPrice.length)]);
        }
        return result;
    },

    // 智慧投入金額：超過飲料價格但使用合理幣值組合
    _getSmartPayment(price) {
        // 定義合理的投入金額（只使用 5, 10, 50, 100 的倍數）
        const validPayments = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
        // 找出所有大於等於價格的合理金額
        const candidates = validPayments.filter(p => p > price && p <= price + 30);
        if (candidates.length === 0) {
            // 若沒有候選，使用最接近的 10 的倍數或 50/100
            if (price < 50) return 50;
            if (price < 100) return 100;
            return Math.ceil(price / 10) * 10 + 10;
        }
        // 隨機選一個
        return candidates[Math.floor(Math.random() * candidates.length)];
    },

    generate(options) {
        const { count = 10 } = options;
        const questionType = options.questionType || 'price-fill';
        const coinStyle = options.coinStyle || 'real';
        const showAnswers = options._showAnswers || false;
        const renderCoin = (value) => {
            if (coinStyle === 'symbol') return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };
        const checkbox = '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin:0 4px;vertical-align:middle;"></span>';

        const questions = [];
        const isPrice = questionType.startsWith('price-');

        if (isPrice) {
            // 價格計算：每題選 2-3 瓶飲料，計算總價
            for (let i = 0; i < count; i++) {
                const numDrinks = randomInt(2, 3);
                const selectedDrinks = pickRandom(this.drinks, numDrinks);
                const total = selectedDrinks.reduce((s, d) => s + d.price, 0);
                const itemList = selectedDrinks.map(d => `${this._drinkImg(d)} ${d.name}(${d.price}元)`).join('、');

                if (questionType === 'price-fill') {
                    questions.push({
                        prompt: `你買了：${itemList}`,
                        visual: '',
                        answerArea: showAnswers
                            ? `總共費用 <span style="color:red;font-weight:bold;">${total}</span> 元`
                            : `總共費用 ${blankLine()} 元`,
                        answerDisplay: ''
                    });
                } else if (questionType === 'price-img-fill') {
                    // 圖示填空(價格計算)：在價格前顯示金錢圖示，金額用括號包圍
                    const itemListWithCoins = selectedDrinks.map(d =>
                        `${this._drinkImg(d)} ${d.name} ${this._renderPriceWithCoins(d.price, renderCoin)}${showAnswers ? `(<span style="color:red;font-weight:bold;">${d.price}</span>元)` : `(${blankLine()})`}`
                    ).join('、');
                    questions.push({
                        prompt: `你買了：${itemListWithCoins}`,
                        visual: '',
                        answerArea: showAnswers
                            ? `總共費用 <span style="color:red;font-weight:bold;">${total}</span> 元`
                            : `總共費用 ${this._renderPriceWithCoins(total, renderCoin)}${blankLine()} 元`,
                        answerDisplay: ''
                    });
                } else if (questionType === 'price-fill-select') {
                    const correctCoins = walletToCoins(total);
                    const opts = this._generateCoinOptions(total, correctCoins);
                    const choicesHtml = opts.map((opt, idx) => {
                        const label = String.fromCharCode(9312 + idx);
                        const isCorrect = opt.total === total;
                        const style = showAnswers && isCorrect ? 'border-color: red; border-width: 3px;' : '';
                        const check = (showAnswers && isCorrect)
                            ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                            : checkbox;
                        const amtField = (showAnswers && isCorrect)
    ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${total} 元</span>`
    : `<span style="display:inline-flex;align-items:flex-end;align-self:flex-end;margin-left:6px;gap:2px;"><span style="display:inline-block;min-width:60px;border-bottom:1.5px solid #333;line-height:1;"></span><span>元</span></span>`;
return `<div class="coin-choice-option" style="${style}">
                            <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                            <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>${amtField}
                        </div>`;
                    }).join('');
                    const fillArea = showAnswers
                        ? `總共費用 <span style="color:red;font-weight:bold;">${total}</span> 元`
                        : `總共費用 ${blankLine()} 元`;
                    questions.push({
                        prompt: `你買了：${itemList}`,
                        visual: `<div style="margin-bottom:6px;">${fillArea}</div>
                                 <div style="margin-bottom:4px;">請選出正確的金額組合：</div>
                                 <div class="coin-choice-options">${choicesHtml}</div>`,
                        answerArea: '',
                        answerDisplay: ''
                    });
                } else if (questionType === 'price-coin-select') {
                    const correctCoins = walletToCoins(total);
                    const opts = this._generateCoinOptions(total, correctCoins);
                    const choicesHtml = opts.map((opt, idx) => {
                        const label = String.fromCharCode(9312 + idx);
                        const isCorrect = opt.total === total;
                        const style = showAnswers && isCorrect ? 'border-color: red; border-width: 3px;' : '';
                        const check = (showAnswers && isCorrect)
                            ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                            : checkbox;
                        const amtField = (showAnswers && isCorrect)
    ? `<span style="color:red;font-weight:bold;margin-left:6px;align-self:flex-end;">答案：${total} 元</span>`
    : `<span style="display:inline-flex;align-items:flex-end;align-self:flex-end;margin-left:6px;gap:2px;"><span style="display:inline-block;min-width:60px;border-bottom:1.5px solid #333;line-height:1;"></span><span>元</span></span>`;
return `<div class="coin-choice-option" style="${style}">
                            <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                            <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>${amtField}
                        </div>`;
                    }).join('');
                    questions.push({
                        prompt: `你買了：${itemList}，總共 <span style="color:red;font-weight:bold;">${total}</span> 元，請選出正確的金額組合：`,
                        visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                        answerArea: '',
                        answerDisplay: ''
                    });
                } else if (questionType === 'price-hint-select') {
                    const correctCoins = walletToCoins(total);
                    const opts = this._generateCoinOptions(total, correctCoins);
                    const choicesHtml = opts.map((opt, idx) => {
                        const label = String.fromCharCode(9312 + idx);
                        const isCorrect = opt.total === total;
                        const style = showAnswers && isCorrect ? 'border-color: red; border-width: 3px;' : '';
                        const check = (showAnswers && isCorrect)
                            ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                            : checkbox;
                        const answerTag = (showAnswers && isCorrect)
    ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${total} 元</span></span>`
    : '';
return `<div class="coin-choice-option" style="${style}">
                            <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                            <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>
                            <span style="color:#ccc;font-weight:bold;margin-left:6px;">${opt.total}元</span>${answerTag}
                        </div>`;
                    }).join('');
                    questions.push({
                        prompt: `你買了：${itemList}，總共 <span style="color:red;font-weight:bold;">${total}</span> 元，請選出正確的金額組合：`,
                        visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                        answerArea: '',
                        answerDisplay: ''
                    });
                } else if (questionType === 'price-hint-complete') {
                    const combo = this._findCombo(total);
                    if (!combo) continue;
                    const coinQty = (value) => value >= 100 ? '張' : '個';
                    const partsHtml = combo.map(c => {
                        const icons = Array(c.count).fill(renderCoin(c.denom)).join('');
                        const answerNum = showAnswers
                            ? `<span style="color:red;font-weight:bold;">${c.count}</span>` : '___';
                        return `${answerNum}${coinQty(c.denom)} ${icons}`;
                    }).join('&nbsp;&nbsp;');
                    const totalColor = showAnswers ? 'color:red' : 'color:#ccc';
                    const totalHint = `<span style="font-size:14pt; font-weight:bold; margin-left:6px;">共 <span style="${totalColor};font-weight:bold;">${total}</span> 元</span>`;
                    questions.push({
                        prompt: `你買了：${itemList}，總共費用如下：`,
                        visual: `<div style="margin:4px 0;">總共要 ${partsHtml} ${totalHint}</div>`,
                        answerArea: '',
                        answerDisplay: ''
                    });
                }
            }
            return questions;
        }

        // 找零計算：單瓶飲料邏輯（不重複價格 + 智慧投入金額）
        const selected = this._selectDrinksWithUniquePrice(count);

        for (let i = 0; i < count; i++) {
            const drink = selected[i];
            const paid = this._getSmartPayment(drink.price);
            const change = paid - drink.price;
            const drinkImg = this._drinkImg(drink);
            const basePrompt = `${drinkImg} ${drink.name}，價格 ${drink.price} 元，投入 ${paid} 元`;

            if (questionType === 'fill') {
                questions.push({
                    prompt: `${basePrompt}，應找回多少？`,
                    visual: '',
                    answerArea: showAnswers
                        ? `答：找回 <span style="color:red;font-weight:bold;">${change}</span> 元`
                        : `答：找回 ${blankLine()} 元`,
                    answerDisplay: ''
                });
            } else if (questionType === 'img-fill') {
                // 圖示填空(找零計算)：在價格前顯示金錢圖示
                const priceCoins = this._renderPriceWithCoins(drink.price, renderCoin);
                const basePromptWithCoins = `${drinkImg} ${drink.name}，價格 ${priceCoins} ${drink.price} 元，投入 ${paid} 元`;
                questions.push({
                    prompt: `${basePromptWithCoins}，應找回多少？`,
                    visual: '',
                    answerArea: showAnswers
                        ? `答：找回 <span style="color:red;font-weight:bold;">${change}</span> 元`
                        : `答：找回 ${this._renderPriceWithCoins(change, renderCoin)}${blankLine()} 元`,
                    answerDisplay: ''
                });
            } else if (questionType === 'fill-select') {
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
    ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${change} 元</span>`
    : `<span style="display:inline-flex;align-items:flex-end;align-self:flex-end;margin-left:6px;gap:2px;"><span style="display:inline-block;min-width:60px;border-bottom:1.5px solid #333;line-height:1;"></span><span>元</span></span>`;
return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>${amtField}
                    </div>`;
                }).join('');
                const fillArea = showAnswers
                    ? `答：找回 <span style="color:red;font-weight:bold;">${change}</span> 元`
                    : `答：找回 ${blankLine()} 元`;
                questions.push({
                    prompt: `${basePrompt}，應找回多少？`,
                    visual: `<div style="margin-bottom:6px;">${fillArea}</div>
                             <div style="margin-bottom:4px;">請選出正確的找零組合：</div>
                             <div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
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
    ? `<span style="color:red;font-weight:bold;margin-left:6px;align-self:flex-end;">答案：${change} 元</span>`
    : `<span style="display:inline-flex;align-items:flex-end;align-self:flex-end;margin-left:6px;gap:2px;"><span style="display:inline-block;min-width:60px;border-bottom:1.5px solid #333;line-height:1;"></span><span>元</span></span>`;
return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>${amtField}
                    </div>`;
                }).join('');
                questions.push({
                    prompt: `${basePrompt}，應找回 <span style="color:red;font-weight:bold;">${change}</span> 元，請選出正確的找零組合：`,
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
                    const check = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const answerTag = (showAnswers && isCorrect)
    ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${change} 元</span></span>`
    : '';
return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>
                        <span style="color:#ccc;font-weight:bold;margin-left:6px;">${opt.total}元</span>${answerTag}
                    </div>`;
                }).join('');
                questions.push({
                    prompt: `${basePrompt}，應找回 <span style="color:red;font-weight:bold;">${change}</span> 元，請選出正確的找零組合：`,
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
                        ? `<span style="color:red;font-weight:bold;">${c.count}</span>` : '___';
                    return `${answerNum}${coinQty(c.denom)} ${icons}`;
                }).join('&nbsp;&nbsp;');
                const totalColor = showAnswers ? 'color:red' : 'color:#ccc';
                const totalHint = `<span style="font-size:14pt; font-weight:bold; margin-left:6px;">共 <span style="${totalColor};font-weight:bold;">${change}</span> 元</span>`;
                questions.push({
                    prompt: `${basePrompt}，應找回多少元？`,
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
