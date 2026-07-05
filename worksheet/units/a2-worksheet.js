// A2 理髮廳 作業單
WorksheetRegistry.register('a2', {
    name: 'A2 理髮廳',
    icon: '💈',
    defaultCount: 20,
    subtitle() { return '服務計費與找零'; },

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
            ],
            getCurrentValue: (params) => params.questionType || 'price-fill',
            onChange: (val, app) => { app.params.questionType = val; app.generate(); }
        }]
    },

    services: [
        { name: '男士剪髮', price: 150, img: 'icon-a2-mens-haircut' },
        { name: '女士剪髮', price: 200, img: 'icon-a2-womens-haircut' },
        { name: '洗髮', price: 30, img: 'icon-a2-hair-wash' },
        { name: '染髮', price: 500, img: 'icon-a2-hair-coloring' },
        { name: '頭皮隔離', price: 250, img: 'icon-a2-scalp-protection' },
        { name: '頭皮按摩', price: 150, img: 'icon-a2-scalp-massage' },
    ],

    _serviceImg(svc) {
        return `<img src="../images/a2/${svc.img}.png" class="drink-img" alt="${svc.name}" onerror="this.outerHTML='💈'">`;
    },

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

        if (isPrice) {
            // 價格計算：每題選 1-2 項服務，計算總價
            for (let i = 0; i < count; i++) {
                const numServices = randomInt(2, 3);
                const selectedSvcs = pickRandom(this.services, numServices);
                const total = selectedSvcs.reduce((s, svc) => s + svc.price, 0);
                const svcList = selectedSvcs.map(s => `${this._serviceImg(s)} ${s.name}(${s.price}元)`).join(' + ');

                if (questionType === 'price-fill') {
                    questions.push({
                        prompt: `你選擇了：${svcList}`,
                        visual: '',
                        answerArea: showAnswers
                            ? `總共費用 <span style="color:red;font-weight:bold;">${total}</span> 元`
                            : `總共費用 ${blankLine()} 元`,
                        answerDisplay: ''
                    });
                } else if (questionType === 'price-img-fill') {
                    // 圖示填空(價格計算)：在價格前顯示金錢圖示
                    const svcListWithCoins = selectedSvcs.map(s =>
                        `${this._serviceImg(s)} ${s.name} ${this._renderPriceWithCoins(s.price, renderCoin)}${showAnswers ? `(<span style="color:red;font-weight:bold;">${s.price}</span>元)` : `(${blankLine()})`}`
                    ).join(' + ');
                    questions.push({
                        prompt: `你選擇了：${svcListWithCoins}`,
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
                        prompt: `你選擇了：${svcList}`,
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
                        prompt: `你選擇了：${svcList}，總共 <span style="color:red;font-weight:bold;">${total}</span> 元，請選出正確的金額組合：`,
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
                        prompt: `你選擇了：${svcList}，總共 <span style="color:red;font-weight:bold;">${total}</span> 元，請選出正確的金額組合：`,
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
                        prompt: `你選擇了：${svcList}，總共費用如下：`,
                        visual: `<div style="margin:4px 0;">總共要 ${partsHtml} ${totalHint}</div>`,
                        answerArea: '',
                        answerDisplay: ''
                    });
                }
            }
            return questions;
        }

        // 找零計算：維持現有邏輯
        for (let i = 0; i < count; i++) {
            const numServices = randomInt(2, 3);
            const selected = pickRandom(this.services, numServices);
            const total = selected.reduce((s, svc) => s + svc.price, 0);
            const paid = [500, 1000].find(p => p >= total) || 1000;
            const change = paid - total;

            const svcList = selected.map(s => `${this._serviceImg(s)} ${s.name}(${s.price}元)`).join(' + ');

            if (questionType === 'fill') {
                questions.push({
                    prompt: `你選擇了：${svcList}`,
                    visual: '',
                    answerArea: showAnswers
                        ? `總共費用 <span style="color:red;font-weight:bold;">${total}</span> 元　你付 ${paid} 元，找回 <span style="color:red;font-weight:bold;">${change}</span> 元`
                        : `總共費用 ${blankLine()} 元　你付 ${paid} 元，找回 ${blankLine()} 元`,
                    answerDisplay: ''
                });
            } else if (questionType === 'img-fill') {
                // 圖示填空(找零計算)：在價格前顯示金錢圖示
                const svcListWithCoins = selected.map(s =>
                    `${this._serviceImg(s)} ${s.name} ${this._renderPriceWithCoins(s.price, renderCoin)}${showAnswers ? `(<span style="color:red;font-weight:bold;">${s.price}</span>元)` : `(${blankLine()})`}`
                ).join(' + ');
                questions.push({
                    prompt: `你選擇了：${svcListWithCoins}`,
                    visual: '',
                    answerArea: showAnswers
                        ? `總共費用 <span style="color:red;font-weight:bold;">${total}</span> 元　你付 ${paid} 元，找回 <span style="color:red;font-weight:bold;">${change}</span> 元`
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
                    prompt: `你選擇了：${svcList}`,
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
                    prompt: `你選擇了：${svcList}，總共 <span style="color:red;font-weight:bold;">${total}</span> 元，付 ${paid} 元，應找回 <span style="color:red;font-weight:bold;">${change}</span> 元，請選出正確的找零組合：`,
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
                    prompt: `你選擇了：${svcList}，總共 <span style="color:red;font-weight:bold;">${total}</span> 元，付 ${paid} 元，應找回 <span style="color:red;font-weight:bold;">${change}</span> 元，請選出正確的找零組合：`,
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
                    prompt: `你選擇了：${svcList}，總共 ${total} 元，付 ${paid} 元，應找回多少元？`,
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
