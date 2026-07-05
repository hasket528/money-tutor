// A5 ATM 作業單
WorksheetRegistry.register('a5', {
    name: 'A5 ATM',
    icon: '🏧',
    defaultCount: 2,  // 每頁2題
    subtitle(opts) {
        const typeLabels = {
            'steps': '提款機步驟',
            'deposit-fill': '存款計算-數字填空',
            'deposit-img-fill': '存款計算-圖示填空',
            'deposit-fill-select': '存款計算-填空與選擇',
            'deposit-coin-select': '存款計算-圖示選擇',
            'deposit-hint-select': '存款計算-提示選擇',
            'deposit-hint-complete': '存款計算-提示完成',
            'withdraw-fill': '提款計算-數字填空',
            'withdraw-img-fill': '提款計算-圖示填空',
            'withdraw-fill-select': '提款計算-填空與選擇',
            'withdraw-coin-select': '提款計算-圖示選擇',
            'withdraw-hint-select': '提款計算-提示選擇',
            'withdraw-hint-complete': '提款計算-提示完成'
        };
        return typeLabels[opts.questionType] || '提款機步驟';
    },

    toolbarConfig: {
        fontButton: {
            label: '💰 帳戶金額',
            type: 'dropdown',
            options: [
                { label: '1000-2000元', value: '1000-2000' },
                { label: '2000-5000元', value: '2000-5000' },
                { label: '5000-10000元', value: '5000-10000' }
            ],
            getCurrentValue: (params) => params.accountAmount || '2000-5000',
            onChange: (val, app) => { app.params.accountAmount = val; app.generate(); }
        },
        orientationButton: null,
        adjustCountButton: {
            label: '📊 圖示類型',
            type: 'dropdown',
            options: [
                { label: '真實金錢(正面)', value: 'real' },
                { label: '真實金錢(反面)', value: 'real-back' },
                { label: '真實金錢(正、反面)', value: 'real-both' },
                { label: '金錢符號', value: 'symbol' }
            ],
            getCurrentValue: (params) => params.coinStyle || 'real',
            onChange: (val, app) => { app.params.coinStyle = val; app.generate(); }
        },
        extraButtons: [{
            id: 'question-type-btn',
            label: '📝 測驗題型',
            type: 'dropdown',
            options: [
                // 原始步驟排序（改名）
                { label: '提款機步驟', value: 'steps' },
                // 存款計算（6種）
                { label: '數字填空(存款)', value: 'deposit-fill' },
                { label: '圖示填空(存款)', value: 'deposit-img-fill' },
                { label: '填空與選擇(存款)', value: 'deposit-fill-select' },
                { label: '圖示選擇(存款)', value: 'deposit-coin-select' },
                { label: '提示選擇(存款)', value: 'deposit-hint-select' },
                { label: '提示完成(存款)', value: 'deposit-hint-complete' },
                // 提款計算（6種）
                { label: '數字填空(提款)', value: 'withdraw-fill' },
                { label: '圖示填空(提款)', value: 'withdraw-img-fill' },
                { label: '填空與選擇(提款)', value: 'withdraw-fill-select' },
                { label: '圖示選擇(提款)', value: 'withdraw-coin-select' },
                { label: '提示選擇(提款)', value: 'withdraw-hint-select' },
                { label: '提示完成(提款)', value: 'withdraw-hint-complete' }
            ],
            getCurrentValue: (params) => params.questionType || 'steps',
            onChange: (val, app) => { app.params.questionType = val; app.generate(); }
        }]
    },

    // 步驟資料（原有）
    steps: {
        withdraw: [
            '插入金融卡', '輸入密碼', '選擇「提款」', '輸入提款金額', '確認金額', '取出現金', '取回金融卡'
        ],
        deposit: [
            '插入金融卡', '輸入密碼', '選擇「存款」', '放入現金', '確認存款金額', '取回金融卡'
        ],
        inquiry: [
            '插入金融卡', '輸入密碼', '選擇「餘額查詢」', '查看餘額資訊', '取回金融卡'
        ],
        transfer: [
            '插入金融卡', '輸入密碼', '選擇「轉帳」', '輸入銀行代碼', '輸入對方帳號', '輸入轉帳金額', '確認轉帳資訊', '取回金融卡'
        ]
    },

    // 僅使用紙幣面額
    _NOTES: [1000, 500, 100],

    generate(options) {
        const questionType = options.questionType || 'steps';
        const showAnswers = options._showAnswers || false;
        const coinStyle = options.coinStyle || 'real';
        const accountRange = options.accountAmount || '2000-5000';

        // 提款機步驟題型
        if (questionType === 'steps') {
            // 每頁固定2題，使用 _usedValues 避免跨頁重複
            return this._generateStepsQuestions(2, showAnswers, options._usedValues);
        }

        // 存款/提款計算題型：滿版（20題，由 _trimOverflowQuestions 裁剪）
        const count = 20;
        const isDeposit = questionType.startsWith('deposit-');
        return this._generateCalculationQuestions({
            questionType,
            count,
            showAnswers,
            coinStyle,
            accountRange,
            isDeposit
        });
    },

    // 步驟排序題型
    _generateStepsQuestions(count, showAnswers, usedValues) {
        const allTypes = ['withdraw', 'deposit', 'inquiry', 'transfer'];
        const labels = { withdraw: '提款', deposit: '存款', inquiry: '餘額查詢', transfer: '轉帳' };
        const questions = [];

        // 過濾掉已使用的交易類型（根據 prompt 中的類型名稱）
        let availableTypes = allTypes;
        if (usedValues && usedValues.size > 0) {
            availableTypes = allTypes.filter(type => {
                const promptKey = `🏧 請將「${labels[type]}」的操作步驟按正確順序排列（填入編號）：`;
                return !usedValues.has(promptKey);
            });
        }

        // 隨機打亂可用的交易類型
        const types = shuffle(availableTypes);

        for (let i = 0; i < Math.min(count, types.length); i++) {
            const type = types[i];
            const steps = this.steps[type];
            const shuffled = shuffle([...steps]);

            questions.push({
                prompt: `🏧 請將「${labels[type]}」的操作步驟按正確順序排列（填入編號）：`,
                visual: `<div>${shuffled.map((s, idx) => `<div style="margin:3px 0;">${idx + 1}. ${s}</div>`).join('')}</div>`,
                answerArea: showAnswers
                    ? `正確順序：${steps.map((s) => {
                        // 找到打亂後的編號
                        const shuffledIdx = shuffled.indexOf(s) + 1;
                        return `<span style="color:red;font-weight:bold;">${shuffledIdx}</span>`;
                      }).join(' → ')}`
                    : `正確順序：${steps.map(() => blankLine()).join(' → ')}`,
                answerDisplay: ''
            });
        }
        return questions;
    },

    // 計算題型
    _generateCalculationQuestions({ questionType, count, showAnswers, coinStyle, accountRange, isDeposit }) {
        const questions = [];
        const renderCoin = (value) => {
            if (coinStyle === 'symbol') return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };
        const checkbox = '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin:0 4px;vertical-align:middle;"></span>';

        for (let i = 0; i < count; i++) {
            // 隨機帳戶金額
            const [minAcc, maxAcc] = accountRange.split('-').map(Number);
            const account = this._roundToHundred(randomInt(minAcc, maxAcc));

            // 隨機交易金額（整百）
            const transaction = isDeposit
                ? this._randomDepositAmount()
                : this._randomWithdrawAmount(account);

            // 計算結果
            const result = isDeposit
                ? account + transaction
                : account - transaction;

            // 題目描述
            const basePrompt = isDeposit
                ? `你的帳戶有 ${account} 元，存款 ${transaction} 元`
                : `你的帳戶有 ${account} 元，提款 ${transaction} 元`;

            const resultLabel = isDeposit ? '帳戶總共' : '帳戶餘額';

            // 依題型生成問題
            const typeKey = questionType.replace('deposit-', '').replace('withdraw-', '');
            questions.push(this._buildQuestionByType({
                typeKey,
                basePrompt,
                result,
                resultLabel,
                showAnswers,
                renderCoin,
                checkbox,
                account,
                transaction,
                isDeposit
            }));
        }
        return questions;
    },

    // 將價格轉換為金錢圖示顯示
    _renderPriceWithCoins(price, renderCoin) {
        const coins = this._notesToCoins(price);
        return `<span class="price-coins">${coins.map(c => renderCoin(c)).join('')}</span>`;
    },

    // 依題型建構問題
    _buildQuestionByType({ typeKey, basePrompt, result, resultLabel, showAnswers, renderCoin, checkbox, account, transaction, isDeposit }) {
        switch (typeKey) {
            case 'fill':
                return {
                    prompt: `${basePrompt}：`,
                    visual: '',
                    answerArea: showAnswers
                        ? `${resultLabel} <span style="color:red;font-weight:bold;">${result}</span> 元`
                        : `${resultLabel} ${blankLine()} 元`,
                    answerDisplay: ''
                };

            case 'img-fill': {
                // 圖示填空：在帳戶金額和交易金額前顯示金錢圖示
                const accountCoins = this._renderPriceWithCoins(account, renderCoin);
                const transactionCoins = this._renderPriceWithCoins(transaction, renderCoin);
                const actionLabel = isDeposit ? '存款' : '提款';
                const promptWithCoins = `你的帳戶有 ${accountCoins}${showAnswers ? `(<span style="color:red;font-weight:bold;">${account}</span>元)` : `(${blankLine()})`}，${actionLabel} ${transactionCoins}${showAnswers ? `(<span style="color:red;font-weight:bold;">${transaction}</span>元)` : `(${blankLine()})`}`;
                return {
                    prompt: `${promptWithCoins}：`,
                    visual: '',
                    answerArea: showAnswers
                        ? `${resultLabel} <span style="color:red;font-weight:bold;">${result}</span> 元`
                        : `${resultLabel} ${this._renderPriceWithCoins(result, renderCoin)}${blankLine()} 元`,
                    answerDisplay: ''
                };
            }

            case 'fill-select': {
                const correctCoins = this._notesToCoins(result);
                const opts = this._generateCoinOptions(result, correctCoins);
                const choicesHtml = opts.map((opt, idx) => {
                    const label = String.fromCharCode(9312 + idx);
                    const isCorrect = opt.total === result;
                    const style = showAnswers && isCorrect ? 'border-color: red; border-width: 3px;' : '';
                    const check = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const amtField = (showAnswers && isCorrect)
    ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${result} 元</span>`
    : `<span style="display:inline-flex;align-items:flex-end;align-self:flex-end;margin-left:6px;gap:2px;"><span style="display:inline-block;min-width:60px;border-bottom:1.5px solid #333;line-height:1;"></span><span>元</span></span>`;
return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>${amtField}
                    </div>`;
                }).join('');
                const fillArea = showAnswers
                    ? `${resultLabel} <span style="color:red;font-weight:bold;">${result}</span> 元`
                    : `${resultLabel} ${blankLine()} 元`;
                return {
                    prompt: `${basePrompt}：`,
                    visual: `<div style="margin-bottom:6px;">${fillArea}</div>
                             <div style="margin-bottom:4px;">請選出正確的金額組合：</div>
                             <div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };
            }

            case 'coin-select': {
                const correctCoins = this._notesToCoins(result);
                const opts = this._generateCoinOptions(result, correctCoins);
                const choicesHtml = opts.map((opt, idx) => {
                    const label = String.fromCharCode(9312 + idx);
                    const isCorrect = opt.total === result;
                    const style = showAnswers && isCorrect ? 'border-color: red; border-width: 3px;' : '';
                    const check = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const amtField = (showAnswers && isCorrect)
    ? `<span style="color:red;font-weight:bold;margin-left:6px;align-self:flex-end;">答案：${result} 元</span>`
    : `<span style="display:inline-flex;align-items:flex-end;align-self:flex-end;margin-left:6px;gap:2px;"><span style="display:inline-block;min-width:60px;border-bottom:1.5px solid #333;line-height:1;"></span><span>元</span></span>`;
return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>${amtField}
                    </div>`;
                }).join('');
                return {
                    prompt: `${basePrompt}，${resultLabel} <span style="color:red;font-weight:bold;">${result}</span> 元，請選出正確的金額組合：`,
                    visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };
            }

            case 'hint-select': {
                const correctCoins = this._notesToCoins(result);
                const opts = this._generateCoinOptions(result, correctCoins);
                const choicesHtml = opts.map((opt, idx) => {
                    const label = String.fromCharCode(9312 + idx);
                    const isCorrect = opt.total === result;
                    const style = showAnswers && isCorrect ? 'border-color: red; border-width: 3px;' : '';
                    const check = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const answerTag = (showAnswers && isCorrect)
    ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${result} 元</span></span>`
    : '';
return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>
                        <span style="color:#ccc;font-weight:bold;margin-left:6px;">${opt.total}元</span>${answerTag}
                    </div>`;
                }).join('');
                return {
                    prompt: `${basePrompt}，${resultLabel} <span style="color:red;font-weight:bold;">${result}</span> 元，請選出正確的金額組合：`,
                    visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };
            }

            case 'hint-complete': {
                const combo = this._findCombo(result);
                if (!combo) {
                    // fallback：無法拆解時用數字填空
                    return {
                        prompt: `${basePrompt}：`,
                        visual: '',
                        answerArea: showAnswers
                            ? `${resultLabel} <span style="color:red;font-weight:bold;">${result}</span> 元`
                            : `${resultLabel} ${blankLine()} 元`,
                        answerDisplay: ''
                    };
                }
                const partsHtml = combo.map(c => {
                    const icons = Array(c.count).fill(renderCoin(c.denom)).join('');
                    const answerNum = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${c.count}</span>` : '___';
                    return `${answerNum}張 ${icons}`;
                }).join('&nbsp;&nbsp;');
                const totalColor = showAnswers ? 'color:red' : 'color:#ccc';
                const totalHint = `<span style="font-size:14pt; font-weight:bold; margin-left:6px;">共 <span style="${totalColor};font-weight:bold;">${result}</span> 元</span>`;
                return {
                    prompt: `${basePrompt}，${resultLabel}為：`,
                    visual: `<div style="margin:4px 0;">${partsHtml} ${totalHint}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };
            }

            default:
                return {
                    prompt: basePrompt,
                    visual: '',
                    answerArea: '',
                    answerDisplay: ''
                };
        }
    },

    // 金額取整到百位
    _roundToHundred(amount) {
        return Math.round(amount / 100) * 100;
    },

    // 隨機存款金額（500-3000，整百）
    _randomDepositAmount() {
        const amounts = [500, 1000, 1500, 2000, 2500, 3000];
        return amounts[randomInt(0, amounts.length - 1)];
    },

    // 隨機提款金額（帳戶20-80%，整百）
    _randomWithdrawAmount(account) {
        const min = Math.max(100, Math.floor(account * 0.2 / 100) * 100);
        const max = Math.floor(account * 0.8 / 100) * 100;
        return this._roundToHundred(randomInt(min, max));
    },

    // 金額拆解為紙幣（僅 100/500/1000）
    _notesToCoins(amount) {
        const result = [];
        let remaining = amount;
        for (const d of this._NOTES) {
            while (remaining >= d) {
                result.push(d);
                remaining -= d;
            }
        }
        return result;
    },

    // 找到幣值組合
    _findCombo(amount) {
        const result = [];
        let remaining = amount;
        for (const d of this._NOTES) {
            if (remaining >= d) {
                const c = Math.floor(remaining / d);
                result.push({ denom: d, count: c });
                remaining -= c * d;
            }
        }
        if (remaining > 0) return null;
        return result;
    },

    // 生成選項（1正確 + 2錯誤）
    _generateCoinOptions(correctAmount, correctCoins) {
        const options = [{ coins: [...correctCoins], total: correctAmount }];
        for (let attempt = 0; attempt < 20 && options.length < 3; attempt++) {
            // 使用整百的偏移量
            const offset = (randomInt(1, 5)) * 100;
            const wrongAmount = Math.random() < 0.5
                ? correctAmount + offset
                : Math.max(100, correctAmount - offset);
            if (options.some(o => o.total === wrongAmount)) continue;
            const wrongCoins = this._notesToCoins(wrongAmount);
            options.push({ coins: wrongCoins, total: wrongAmount });
        }
        while (options.length < 3) {
            const wrongAmount = correctAmount + options.length * 100;
            options.push({ coins: this._notesToCoins(wrongAmount), total: wrongAmount });
        }
        return shuffle(options);
    }
});
