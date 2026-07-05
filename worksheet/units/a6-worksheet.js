// A6 火車票 作業單 — 付款金額 > 票價金額
WorksheetRegistry.register('a6', {
    name: 'A6 火車票',
    icon: '🚂',
    defaultCount: 20,
    subtitle() { return '票價計算與找零'; },

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

    // 票價來源：A6 單元 fareMatrixTzeChiang（自強號 × 1.0，區間車 × 0.6 四捨五入）
    routes: [
        { from: '臺北', to: '板橋', local: 20, express: 34 },
        { from: '臺北', to: '桃園', local: 60, express: 100 },
        { from: '臺北', to: '新竹', local: 152, express: 254 },
        { from: '臺北', to: '臺中', local: 300, express: 500 },
        { from: '臺北', to: '嘉義', local: 450, express: 750 },
        { from: '臺北', to: '臺南', local: 535, express: 892 },
        { from: '臺北', to: '高雄', local: 586, express: 976 },
        { from: '臺北', to: '花蓮', local: 470, express: 784 },
        { from: '臺北', to: '宜蘭', local: 216, express: 360 },
        { from: '板橋', to: '桃園', local: 44, express: 74 },
        { from: '桃園', to: '新竹', local: 100, express: 166 },
        { from: '臺中', to: '嘉義', local: 190, express: 316 },
        { from: '臺中', to: '高雄', local: 356, express: 594 },
        { from: '臺南', to: '高雄', local: 78, express: 130 },
        { from: '花蓮', to: '臺東', local: 277, express: 462 },
    ],

    trainNames: { local: '區間車', express: '自強號' },

    // 將價格轉換為金錢圖示顯示
    _renderPriceWithCoins(price, renderCoin) {
        const coins = walletToCoins(price);
        return `<span class="price-coins">${coins.map(c => renderCoin(c)).join('')}</span>`;
    },

    generate(options) {
        const { count = 8 } = options;
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

        for (let i = 0; i < count; i++) {
            const route = this.routes[Math.floor(Math.random() * this.routes.length)];
            const trainType = Math.random() < 0.5 ? 'local' : 'express';
            const tickets = randomInt(1, 3);
            const unitPrice = route[trainType];
            const total = unitPrice * tickets;
            const paid = [100, 500, 1000, 2000, 5000].find(p => p > total) || 5000;
            const change = paid - total;

            const routeDesc = `🚂 ${route.from} 到 ${route.to}，搭乘${this.trainNames[trainType]}`;
            const ticketDesc = tickets === 1 ? '一張票' : `${tickets} 張票`;
            const pricePrompt = `${routeDesc}。一張票 ${unitPrice} 元，請問 ${ticketDesc}總共多少錢？`;
            const changePrompt = `${routeDesc}。一張票 ${unitPrice} 元，買了 ${tickets} 張票，付 ${paid} 元，請問應找回多少錢？`;
            const priceVisual = `<div>算式：${unitPrice} 元 × ${tickets} 張 = ${total} 元</div>`;
            const priceVisualFill = showAnswers
                ? `<div>算式：${unitPrice} 元 × ${tickets} 張 = <span style="color:red;font-weight:bold;">${total}</span> 元</div>`
                : `<div>算式：${unitPrice} 元 × ${tickets} 張 = ？？？ 元</div>`;

            if (isPrice) {
                // 價格計算題型（只問總票價，不涉及找零）
                if (questionType === 'price-fill') {
                    questions.push({
                        prompt: pricePrompt,
                        visual: priceVisualFill,
                        answerArea: showAnswers
                            ? `總票價 <span style="color:red;font-weight:bold;">${total}</span> 元`
                            : `總票價 ${blankLine()} 元`,
                        answerDisplay: ''
                    });
                } else if (questionType === 'price-img-fill') {
                    // 圖示填空(價格計算)：在單價前顯示金錢圖示
                    const priceVisualWithCoins = showAnswers
                        ? `<div>總票價：${this._renderPriceWithCoins(unitPrice, renderCoin)}${showAnswers ? `(<span style="color:red;font-weight:bold;">${unitPrice}</span>元)` : `(${blankLine()})`} × ${tickets} 張 = <span style="color:red;font-weight:bold;">${total}</span> 元</div>`
                        : `<div>總票價：${this._renderPriceWithCoins(unitPrice, renderCoin)}${showAnswers ? `(<span style="color:red;font-weight:bold;">${unitPrice}</span>元)` : `(${blankLine()})`} × ${tickets} 張 = ？？？ 元</div>`;
                    questions.push({
                        prompt: pricePrompt,
                        visual: priceVisualWithCoins,
                        answerArea: showAnswers
                            ? `總票價 <span style="color:red;font-weight:bold;">${total}</span> 元`
                            : `總票價 ${this._renderPriceWithCoins(total, renderCoin)}${blankLine()} 元`,
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
                        ? `總票價 <span style="color:red;font-weight:bold;">${total}</span> 元`
                        : `總票價 ${blankLine()} 元`;
                    questions.push({
                        prompt: pricePrompt,
                        visual: priceVisualFill + `<div style="margin-top:6px;margin-bottom:6px;">${fillArea}</div>
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
                        prompt: `${routeDesc}。一張票 ${unitPrice} 元，${ticketDesc}共 <span style="color:red;font-weight:bold;">${total}</span> 元，請選出正確的金額組合：`,
                        visual: priceVisual + `<div class="coin-choice-options">${choicesHtml}</div>`,
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
                        prompt: `${routeDesc}。一張票 ${unitPrice} 元，${ticketDesc}共 <span style="color:red;font-weight:bold;">${total}</span> 元，請選出正確的金額組合：`,
                        visual: priceVisual + `<div class="coin-choice-options">${choicesHtml}</div>`,
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
                        prompt: `${pricePrompt}，請看金幣組合：`,
                        visual: priceVisual + `<div style="margin:4px 0;">總共要 ${partsHtml} ${totalHint}</div>`,
                        answerArea: '',
                        answerDisplay: ''
                    });
                }
                continue;
            }

            if (questionType === 'fill') {
                questions.push({
                    prompt: changePrompt,
                    visual: priceVisualFill,
                    answerArea: showAnswers
                        ? `總票價 <span style="color:red;font-weight:bold;">${total}</span> 元　你付 ${paid} 元，找回 <span style="color:red;font-weight:bold;">${change}</span> 元`
                        : `總票價 ${blankLine()} 元　你付 ${paid} 元，找回 ${blankLine()} 元`,
                    answerDisplay: ''
                });
            } else if (questionType === 'img-fill') {
                // 圖示填空(找零計算)：在單價前顯示金錢圖示
                const priceVisualWithCoins = showAnswers
                    ? `<div>總票價：${this._renderPriceWithCoins(unitPrice, renderCoin)}${showAnswers ? `(<span style="color:red;font-weight:bold;">${unitPrice}</span>元)` : `(${blankLine()})`} × ${tickets} 張 = <span style="color:red;font-weight:bold;">${total}</span> 元</div>`
                    : `<div>總票價：${this._renderPriceWithCoins(unitPrice, renderCoin)}${showAnswers ? `(<span style="color:red;font-weight:bold;">${unitPrice}</span>元)` : `(${blankLine()})`} × ${tickets} 張 = ？？？ 元</div>`;
                questions.push({
                    prompt: changePrompt,
                    visual: priceVisualWithCoins,
                    answerArea: showAnswers
                        ? `總票價 <span style="color:red;font-weight:bold;">${total}</span> 元，你付 ${paid} 元，找回 <span style="color:red;font-weight:bold;">${change}</span> 元`
                        : `總共費用 ${this._renderPriceWithCoins(total, renderCoin)}${blankLine()} 元　你付 ${paid} 元，找回 ${this._renderPriceWithCoins(change, renderCoin)}${blankLine()} 元`,
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
                    ? `總共費用 <span style="color:red;font-weight:bold;">${total}</span> 元　你付 ${paid} 元，找回 <span style="color:red;font-weight:bold;">${change}</span> 元`
                    : `總共費用 ${blankLine()} 元　你付 ${paid} 元，找回 ${blankLine()} 元`;
                questions.push({
                    prompt: changePrompt,
                    visual: priceVisualFill + `<div style="margin-top:6px;margin-bottom:6px;">${fillArea}</div>
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
                    prompt: `${routeDesc}。一張票 ${unitPrice} 元，${tickets} 張票共 <span style="color:red;font-weight:bold;">${total}</span> 元，付 ${paid} 元，應找回 <span style="color:red;font-weight:bold;">${change}</span> 元，請選出正確的找零組合：`,
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
                    prompt: `${routeDesc}。一張票 ${unitPrice} 元，${tickets} 張票共 <span style="color:red;font-weight:bold;">${total}</span> 元，付 ${paid} 元，應找回 <span style="color:red;font-weight:bold;">${change}</span> 元，請選出正確的找零組合：`,
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
                    prompt: `${routeDesc}。一張票 ${unitPrice} 元，${tickets} 張票共 ${total} 元，付 ${paid} 元，應找回多少元？`,
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
