// B2 零用錢日記 作業單
WorksheetRegistry.register('b2', {
    name: 'B2 零用錢日記',
    icon: '📒',
    defaultCount: 8,
    subtitle(opts) {
        const diff = { easy:'簡單', normal:'普通', hard:'困難' };
        const typeLabels = {
            'steps':         '數字填空：計算每次餘額',
            'img-fill':      '圖示填空：計算每次餘額',
            'fill':          '數字填空：計算最終餘額',
            'fill-select':   '圖示填空：計算最終餘額',
            'coin-select':   '圖示選擇：計算最終餘額',
            'hint-select':   '提示選擇：計算最終餘額',
            'hint-complete': '提示完成：計算最終餘額',
        };
        return `${diff[opts.difficulty || 'easy']}・${typeLabels[opts.questionType || 'steps'] || ''}`;
    },

    toolbarConfig: {
        fontButton: {
            label: '📝 題型',
            type: 'dropdown',
            options: [
                { type: 'group',  label: '計算每次餘額' },
                { label: '數字填空', value: 'steps'    },
                { label: '圖示填空', value: 'img-fill' },
                { type: 'group',  label: '計算最終餘額' },
                { label: '數字填空', value: 'fill'          },
                { label: '圖示填空', value: 'fill-select' },
                { label: '圖示選擇',   value: 'coin-select' },
                { label: '提示選擇',   value: 'hint-select' },
                { label: '提示完成',   value: 'hint-complete' },
            ],
            getCurrentValue: (p) => p.questionType || 'steps',
            onChange: (v, app) => { app.params.questionType = v; app.generate(); }
        },
        adjustCountButton: {
            label: '🎯 難度',
            type: 'dropdown',
            options: [
                { label: '簡單', value: 'easy' },
                { label: '普通', value: 'normal' },
                { label: '困難', value: 'hard' },
            ],
            getCurrentValue: (p) => p.difficulty || 'easy',
            onChange: (v, app) => { app.params.difficulty = v; app.generate(); }
        },
        orientationButton: null,
        extraButtons: [
            {
                id: 'coin-style-btn',
                label: '📊 圖示類型',
                type: 'dropdown',
                options: [
                    { label: '真實金錢(正面)',     value: 'real' },
                    { label: '真實金錢(反面)',     value: 'real-back' },
                    { label: '真實金錢(正、反面)', value: 'real-both' },
                    { label: '金錢符號',           value: 'symbol' },
                ],
                getCurrentValue: (params) => params.coinStyle || 'real',
                onChange: (val, app) => { app.params.coinStyle = val; app.generate(); }
            }
        ],
    },

    _templates: {
        easy: [
            { startAmount: 100, events: [
                { type: 'income',  name: '媽媽給零用錢', amount: 50,  icon: '💰' },
                { type: 'expense', name: '買飲料',       amount: 30,  icon: '🧋' },
            ]},
            { startAmount: 50, events: [
                { type: 'income',  name: '幫忙洗碗',     amount: 20,  icon: '🍽️' },
                { type: 'expense', name: '買糖果',       amount: 15,  icon: '🍬' },
            ]},
            { startAmount: 200, events: [
                { type: 'expense', name: '買文具',       amount: 80,  icon: '✏️' },
                { type: 'income',  name: '爸爸獎勵',     amount: 50,  icon: '🌟' },
            ]},
            { startAmount: 80, events: [
                { type: 'income',  name: '過年紅包',     amount: 100, icon: '🧧' },
                { type: 'expense', name: '買玩具',       amount: 120, icon: '🎮' },
            ]},
            { startAmount: 150, events: [
                { type: 'expense', name: '買早餐',       amount: 40,  icon: '🥐' },
                { type: 'income',  name: '幫忙買菜',     amount: 20,  icon: '🛒' },
            ]},
            { startAmount: 60, events: [
                { type: 'income',  name: '阿嬤零用錢',   amount: 50,  icon: '💝' },
                { type: 'expense', name: '買貼紙',       amount: 25,  icon: '🌸' },
            ]},
            { startAmount: 300, events: [
                { type: 'expense', name: '買書',         amount: 150, icon: '📚' },
                { type: 'expense', name: '買點心',       amount: 30,  icon: '🍪' },
            ]},
            { startAmount: 120, events: [
                { type: 'income',  name: '幫忙打掃',     amount: 30,  icon: '🧹' },
                { type: 'expense', name: '買冰淇淋',     amount: 45,  icon: '🍦' },
            ]},
        ],
        normal: [
            { startAmount: 200, events: [
                { type: 'income',  name: '爸爸給零用錢', amount: 100, icon: '💰' },
                { type: 'expense', name: '買文具',       amount: 45,  icon: '✏️' },
                { type: 'expense', name: '買零食',       amount: 35,  icon: '🍿' },
                { type: 'income',  name: '幫忙家事',     amount: 20,  icon: '🧹' },
            ]},
            { startAmount: 150, events: [
                { type: 'income',  name: '生日紅包',     amount: 200, icon: '🧧' },
                { type: 'expense', name: '買玩具',       amount: 120, icon: '🎮' },
                { type: 'expense', name: '看電影',       amount: 80,  icon: '🎬' },
                { type: 'expense', name: '買飲料',       amount: 35,  icon: '🧋' },
            ]},
            { startAmount: 300, events: [
                { type: 'expense', name: '買運動鞋',     amount: 180, icon: '👟' },
                { type: 'income',  name: '幫鄰居送報',   amount: 50,  icon: '📰' },
                { type: 'expense', name: '買午餐',       amount: 60,  icon: '🍱' },
                { type: 'income',  name: '媽媽零用錢',   amount: 100, icon: '💝' },
            ]},
            { startAmount: 500, events: [
                { type: 'expense', name: '買書包',       amount: 350, icon: '🎒' },
                { type: 'income',  name: '爺爺紅包',     amount: 100, icon: '🧧' },
                { type: 'expense', name: '買文具',       amount: 75,  icon: '✏️' },
                { type: 'income',  name: '節省獎勵',     amount: 50,  icon: '🌟' },
            ]},
            { startAmount: 100, events: [
                { type: 'income',  name: '媽媽零用錢',   amount: 150, icon: '💰' },
                { type: 'expense', name: '買零食',       amount: 45,  icon: '🍬' },
                { type: 'income',  name: '幫忙澆花',     amount: 20,  icon: '🌱' },
                { type: 'expense', name: '買飲料',       amount: 30,  icon: '🧋' },
            ]},
            { startAmount: 250, events: [
                { type: 'expense', name: '買故事書',     amount: 90,  icon: '📖' },
                { type: 'expense', name: '買彩色筆',     amount: 65,  icon: '🖍️' },
                { type: 'income',  name: '幫忙洗車',     amount: 80,  icon: '🚗' },
                { type: 'expense', name: '買冰淇淋',     amount: 40,  icon: '🍦' },
            ]},
        ],
        hard: [
            { startAmount: 500, events: [
                { type: 'income',  name: '媽媽零用錢',   amount: 300, icon: '💰' },
                { type: 'expense', name: '買運動服',     amount: 280, icon: '👕' },
                { type: 'income',  name: '幫忙搬家具',   amount: 100, icon: '🛋️' },
                { type: 'expense', name: '買書',         amount: 145, icon: '📚' },
                { type: 'expense', name: '看表演',       amount: 200, icon: '🎭' },
                { type: 'income',  name: '過年紅包',     amount: 500, icon: '🧧' },
            ]},
            { startAmount: 800, events: [
                { type: 'expense', name: '買腳踏車配件', amount: 350, icon: '🚴' },
                { type: 'income',  name: '比賽獎金',     amount: 200, icon: '🏆' },
                { type: 'expense', name: '買運動鞋',     amount: 480, icon: '👟' },
                { type: 'income',  name: '爺爺奶奶紅包', amount: 600, icon: '🧧' },
                { type: 'expense', name: '買生日禮物',   amount: 250, icon: '🎁' },
                { type: 'expense', name: '吃大餐',       amount: 185, icon: '🍽️' },
            ]},
            { startAmount: 1000, events: [
                { type: 'income',  name: '暑期打工',     amount: 500, icon: '💼' },
                { type: 'expense', name: '買智慧手錶',   amount: 890, icon: '⌚' },
                { type: 'income',  name: '幫忙補習',     amount: 300, icon: '📖' },
                { type: 'expense', name: '買球鞋',       amount: 395, icon: '👟' },
                { type: 'income',  name: '獎學金',       amount: 200, icon: '🎓' },
                { type: 'expense', name: '買文具組',     amount: 120, icon: '✏️' },
            ]},
        ],
    },

    // 將金額分解為金錢圖示（最多顯示 5 枚）
    _coinsDisplay(amount, renderCoin) {
        const coins = walletToCoins(amount);
        const displayed = coins.slice(0, 5);
        const more = coins.length > 5 ? `<span style="font-size:11px;color:#888;">…</span>` : '';
        return displayed.map(c => renderCoin(c)).join('') + more;
    },

    generate(options) {
        const diff = options.difficulty || 'easy';
        const type = options.questionType || 'steps';
        const coinStyle = options.coinStyle || 'real';
        const showAnswers = options._showAnswers || false;
        const usedKeys = options._usedValues || new Set();

        const renderCoin = (value) => {
            if (coinStyle === 'symbol')    return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };
        const pool = this._templates[diff];
        const available = pool.map((_, i) => i).filter(i => !usedKeys.has(`b2_${diff}_${i}`));
        const idxList = shuffle(available.length >= 2 ? available : pool.map((_, i) => i))
            .slice(0, options.count || 8);
        idxList.forEach(i => usedKeys.add(`b2_${diff}_${i}`));
        const checkbox = '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin:0 4px;vertical-align:middle;"></span>';

        const TH = 'padding:4px 8px;border-bottom:1.5px solid #9ca3af;';
        const TD = 'padding:3px 8px;';
        const TABLE = 'border-collapse:collapse;font-size:12pt;width:100%;margin-top:4px;';

        return idxList.map(idx => {
            const { startAmount, events } = pool[idx];
            const finalBalance = events.reduce(
                (b, e) => e.type === 'income' ? b + e.amount : b - e.amount, startAmount);

            // ── 共用：兩欄事件表格（項目 | 金額），含「一開始有」首列 ──
            const buildEventsTable = () => {
                const rows = events.map(e => {
                    const sign  = e.type === 'income' ? '+' : '−';
                    const color = e.type === 'income' ? '#059669' : '#dc2626';
                    return `<tr>
                        <td style="${TD}"><span class="ws-emoji-icon">${e.icon}</span> ${e.name}</td>
                        <td style="text-align:center;${TD}color:${color};font-weight:bold;">${sign} ${e.amount} 元</td>
                    </tr>`;
                }).join('');
                return `<table style="${TABLE}">
                    <tr style="background:#f3f4f6;">
                        <th style="${TH}text-align:left;">項目</th>
                        <th style="${TH}">金額</th>
                    </tr>
                    <tr>
                        <td style="${TD}">💰 一開始有</td>
                        <td style="text-align:center;${TD}font-weight:bold;">${startAmount} 元</td>
                    </tr>
                    ${rows}
                </table>`;
            };

            if (type === 'fill') {
                // 數字填空：事件表格 + 最後一列填入最終餘額（對齊金額欄）
                const ans = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${finalBalance}</span>`
                    : blankLine(true);
                const eventRows = events.map(e => {
                    const sign  = e.type === 'income' ? '+' : '−';
                    const color = e.type === 'income' ? '#059669' : '#dc2626';
                    return `<tr>
                        <td style="${TD}"><span class="ws-emoji-icon">${e.icon}</span> ${e.name}</td>
                        <td style="text-align:right;${TD}color:${color};font-weight:bold;">${sign} ${e.amount} 元</td>
                    </tr>`;
                }).join('');
                return {
                    _key: `b2_${diff}_${idx}`,
                    prompt: '根據日記記錄，計算最後的餘額：',
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}text-align:right;">金額</th>
                        </tr>
                        <tr>
                            <td style="${TD}">💰 一開始有</td>
                            <td style="text-align:right;${TD}font-weight:bold;">${startAmount} 元</td>
                        </tr>
                        ${eventRows}
                        <tr style="border-top:2px solid #9ca3af;">
                            <td style="${TD}font-weight:bold;">最後剩下</td>
                            <td style="text-align:right;${TD}">${ans} 元</td>
                        </tr>
                    </table>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            } else if (type === 'steps') {
                // 逐步計算：四欄表格，每列含「上次餘額」空白與「這次餘額」空白
                let running = startAmount;
                const rows = events.map(e => {
                    const prevBalance = running;
                    running = e.type === 'income' ? running + e.amount : running - e.amount;
                    const sign     = e.type === 'income' ? '+' : '−';
                    const amtColor = e.type === 'income' ? '#059669' : '#dc2626';
                    const prevAns  = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${prevBalance}</span>`
                        : blankLine(true);
                    const newAns   = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${running}</span>`
                        : blankLine(true);
                    return `<tr>
                        <td style="${TD}"><span class="ws-emoji-icon">${e.icon}</span> ${e.name}</td>
                        <td style="text-align:center;${TD}">${prevAns} 元</td>
                        <td style="text-align:center;${TD}color:${amtColor};font-weight:bold;">${sign} ${e.amount}</td>
                        <td style="text-align:center;${TD}">${newAns} 元</td>
                    </tr>`;
                }).join('');
                return {
                    _key: `b2_${diff}_${idx}`,
                    prompt: '根據日記記錄，計算零用錢餘額：',
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}">上次餘額</th>
                            <th style="${TH}">本次金額</th>
                            <th style="${TH}">這次餘額</th>
                        </tr>
                        <tr>
                            <td style="${TD}">💰 一開始有</td>
                            <td style="text-align:center;${TD}color:#9ca3af;">—</td>
                            <td style="text-align:center;${TD}color:#9ca3af;">—</td>
                            <td style="text-align:center;${TD}font-weight:bold;">${startAmount} 元</td>
                        </tr>
                        ${rows}
                    </table>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            } else if (type === 'img-fill') {
                // 圖示填空：四欄表格（同數字填空），各餘額欄前加金錢圖示作為提示
                const mkCoinHintCell = (amount) => {
                    const coins = this._coinsDisplay(amount, renderCoin);
                    const ans   = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${amount}</span>`
                        : blankLine(true);
                    return `<td style="text-align:center;${TD}"><span style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:3px;">${coins}<span style="margin-left:2px;">${ans} 元</span></span></td>`;
                };
                let running = startAmount;
                const rows = events.map(e => {
                    const prevBalance = running;
                    running = e.type === 'income' ? running + e.amount : running - e.amount;
                    const sign     = e.type === 'income' ? '+' : '−';
                    const amtColor = e.type === 'income' ? '#059669' : '#dc2626';
                    return `<tr>
                        <td style="${TD}"><span class="ws-emoji-icon">${e.icon}</span> ${e.name}</td>
                        ${mkCoinHintCell(prevBalance)}
                        <td style="text-align:center;${TD}color:${amtColor};font-weight:bold;">${sign} ${e.amount}</td>
                        ${mkCoinHintCell(running)}
                    </tr>`;
                }).join('');
                return {
                    _key: `b2_${diff}_${idx}`,
                    prompt: '看金錢圖示，填入每次的餘額：',
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}">上次餘額</th>
                            <th style="${TH}">金額</th>
                            <th style="${TH}">這次餘額</th>
                        </tr>
                        <tr>
                            <td style="${TD}">💰 一開始有</td>
                            <td style="text-align:center;${TD}color:#9ca3af;">—</td>
                            <td style="text-align:center;${TD}color:#9ca3af;">—</td>
                            <td style="text-align:center;${TD}font-weight:bold;">${startAmount} 元</td>
                        </tr>
                        ${rows}
                    </table>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            } else if (type === 'fill-select') {
                // 圖示填空：每列顯示金錢圖示，金額改底線；最後填最終餘額
                const mkCoinAmtRow = (labelHtml, amount, color) => {
                    const coins = this._coinsDisplay(amount, renderCoin);
                    const ans   = showAnswers
                        ? `<span style="color:${color || 'red'};font-weight:bold;">${amount}</span>`
                        : blankLine();
                    return `<tr>
                        <td style="${TD}">${labelHtml}</td>
                        <td style="${TD}">${coins}</td>
                        <td style="text-align:right;${TD}">${ans} 元</td>
                    </tr>`;
                };
                const eventRows = events.map(e => {
                    const sign  = e.type === 'income' ? '（+）' : '（−）';
                    const color = e.type === 'income' ? '#059669' : '#dc2626';
                    const label = `<span class="ws-emoji-icon">${e.icon}</span> ${e.name}<span style="color:${color};font-weight:bold;">${sign}</span>`;
                    return mkCoinAmtRow(label, e.amount, color);
                }).join('');
                const finalCoins = this._coinsDisplay(finalBalance, renderCoin);
                const finalAns   = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${finalBalance}</span>`
                    : blankLine(true);
                return {
                    _key: `b2_${diff}_${idx}`,
                    prompt: '看圖填入每筆金額，並計算最後的餘額：',
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}">金錢圖示</th>
                            <th style="${TH}text-align:right;">金額</th>
                        </tr>
                        ${mkCoinAmtRow('💰 一開始有', startAmount, '#111')}
                        ${eventRows}
                        <tr style="border-top:2px solid #9ca3af;background:#f9fafb;">
                            <td style="${TD}font-weight:bold;">📊 最後剩下</td>
                            <td style="${TD}">${finalCoins}</td>
                            <td style="text-align:right;${TD}">${finalAns} 元</td>
                        </tr>
                    </table>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            } else if (type === 'coin-select') {
                // 圖示選擇：fill-select 樣式表格（含金錢圖示，金額含+/−前綴），選出最後餘額的錢幣組合
                if (finalBalance <= 0) return null;
                const mkRevealRow = (labelHtml, amount, color, signPrefix) => {
                    const coins = this._coinsDisplay(amount, renderCoin);
                    const colorStyle = color ? `color:${color};` : '';
                    const signHtml   = signPrefix ? `<span style="${colorStyle}font-weight:bold;">${signPrefix} </span>` : '';
                    const amtHtml    = `${signHtml}<span style="${colorStyle}font-weight:bold;">${amount}</span>`;
                    return `<tr>
                        <td style="${TD}">${labelHtml}</td>
                        <td style="${TD}">${coins}</td>
                        <td style="text-align:right;${TD}">${amtHtml} 元</td>
                    </tr>`;
                };
                const csEventRows = events.map(e => {
                    const signLabel = e.type === 'income' ? '（+）' : '（−）';
                    const signAmt   = e.type === 'income' ? '+' : '−';
                    const color     = e.type === 'income' ? '#059669' : '#dc2626';
                    const label     = `<span class="ws-emoji-icon">${e.icon}</span> ${e.name}<span style="color:${color};font-weight:bold;">${signLabel}</span>`;
                    return mkRevealRow(label, e.amount, color, signAmt);
                }).join('');
                const opts = this._coinOptions(finalBalance);
                const choicesHtml = opts.map((opt, i) => {
                    const label = String.fromCharCode(9312 + i);
                    const isCorrect = opt.total === finalBalance;
                    const style = showAnswers && isCorrect ? 'border-color:red;border-width:3px;' : '';
                    const check = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const amtField = showAnswers
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;align-self:flex-end;">${opt.total} 元</span>`
                        : `<span style="display:inline-flex;align-items:flex-end;align-self:flex-end;margin-left:6px;gap:2px;"><span style="display:inline-block;min-width:60px;border-bottom:1.5px solid #333;line-height:1;"></span><span>元</span></span>`;
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold;min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>
                        ${amtField}
                    </div>`;
                }).join('');
                return {
                    _key: `b2_${diff}_${idx}`,
                    prompt: '看金錢圖示，選出最後餘額的錢幣組合：',
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}">金錢圖示</th>
                            <th style="${TH}text-align:right;">金額</th>
                        </tr>
                        ${mkRevealRow('💰 一開始有', startAmount, '#111')}
                        ${csEventRows}
                    </table>
                    <div style="margin:6px 0;">最後剩下 <strong>${finalBalance}</strong> 元，請選出正確的錢幣組合：</div>
                    <div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            } else if (type === 'hint-select') {
                // 提示選擇：fill-select 樣式表格（含金錢圖示，金額含+/−前綴），選項旁顯示灰色金額提示
                if (finalBalance <= 0) return null;
                const mkRevealRow2 = (labelHtml, amount, color, signPrefix) => {
                    const coins = this._coinsDisplay(amount, renderCoin);
                    const colorStyle = color ? `color:${color};` : '';
                    const signHtml   = signPrefix ? `<span style="${colorStyle}font-weight:bold;">${signPrefix} </span>` : '';
                    const amtHtml    = `${signHtml}<span style="${colorStyle}font-weight:bold;">${amount}</span>`;
                    return `<tr>
                        <td style="${TD}">${labelHtml}</td>
                        <td style="${TD}">${coins}</td>
                        <td style="text-align:right;${TD}">${amtHtml} 元</td>
                    </tr>`;
                };
                const hsEventRows = events.map(e => {
                    const signLabel = e.type === 'income' ? '（+）' : '（−）';
                    const signAmt   = e.type === 'income' ? '+' : '−';
                    const color     = e.type === 'income' ? '#059669' : '#dc2626';
                    const label     = `<span class="ws-emoji-icon">${e.icon}</span> ${e.name}<span style="color:${color};font-weight:bold;">${signLabel}</span>`;
                    return mkRevealRow2(label, e.amount, color, signAmt);
                }).join('');
                const opts2 = this._coinOptions(finalBalance);
                const choicesHtml2 = opts2.map((opt, i) => {
                    const label = String.fromCharCode(9312 + i);
                    const isCorrect = opt.total === finalBalance;
                    const style = showAnswers && isCorrect ? 'border-color:red;border-width:3px;' : '';
                    const check = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const answerTag = (showAnswers && isCorrect)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${finalBalance} 元</span>` : '';
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold;min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>
                        <span style="color:#ccc;font-weight:bold;margin-left:6px;">${opt.total} 元</span>${answerTag}
                    </div>`;
                }).join('');
                return {
                    _key: `b2_${diff}_${idx}`,
                    prompt: '看金錢圖示，選出最後餘額的錢幣組合：',
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}">金錢圖示</th>
                            <th style="${TH}text-align:right;">金額</th>
                        </tr>
                        ${mkRevealRow2('💰 一開始有', startAmount, '#111')}
                        ${hsEventRows}
                    </table>
                    <div style="margin:6px 0;">最後剩下 <strong>${finalBalance}</strong> 元，請選出正確的錢幣組合：</div>
                    <div class="coin-choice-options">${choicesHtml2}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            } else { // hint-complete
                // 提示完成：fill-select 樣式三欄大表格，金錢圖示欄顯示 ___個[coin]，金額欄填空
                if (finalBalance <= 0) return null;
                if (!this._findCombo(finalBalance)) return null;

                const mkHintRow = (labelHtml, amount, color, isLast) => {
                    const combo = this._findCombo(amount);
                    if (!combo) return '';
                    const parts = combo.map(c => {
                        const icon   = renderCoin(c.denom);
                        const ansNum = showAnswers
                            ? `<span style="color:red;font-weight:bold;">${c.count}</span>` : '___';
                        const unit   = c.denom >= 100 ? '張' : '個';
                        return `<span style="white-space:nowrap;">${ansNum}${unit}&nbsp;${icon}</span>`;
                    }).join('&ensp;');
                    const ans = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${amount}</span>`
                        : `<span style="color:#ccc;font-weight:bold;">${amount}</span>`;
                    const colorStyle = color ? `color:${color};` : '';
                    const rowStyle = isLast ? `border-top:2px solid #9ca3af;background:#f9fafb;` : '';
                    return `<tr style="${rowStyle}">
                        <td style="${TD}${isLast ? 'font-weight:bold;' : ''}">${labelHtml}</td>
                        <td style="${TD}"><span style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:5px;">${parts}</span></td>
                        <td style="text-align:right;${TD}"><span style="${colorStyle}">${ans}</span> 元</td>
                    </tr>`;
                };

                const hcEventRows = events.map(e => {
                    const sign  = e.type === 'income' ? '（+）' : '（−）';
                    const color = e.type === 'income' ? '#059669' : '#dc2626';
                    const label = `<span class="ws-emoji-icon">${e.icon}</span> ${e.name}<span style="color:${color};font-weight:bold;">${sign}</span>`;
                    return mkHintRow(label, e.amount, color, false);
                }).join('');

                return {
                    _key: `b2_${diff}_${idx}`,
                    prompt: '看金錢圖示，填入數量和每筆金額：',
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}">金錢圖示（填數量）</th>
                            <th style="${TH}text-align:right;">金額</th>
                        </tr>
                        ${mkHintRow('💰 一開始有', startAmount, '#111', false)}
                        ${hcEventRows}
                        ${mkHintRow('📊 最後剩下', finalBalance, null, true)}
                    </table>`,
                    answerArea: '',
                    answerDisplay: ''
                };
            }
        }).filter(Boolean);
    },

    _findCombo(amount) {
        const denoms = [1000, 500, 100, 50, 10, 5, 1];
        const result = [];
        let r = amount;
        for (const d of denoms) {
            if (r >= d) { const c = Math.floor(r / d); result.push({ denom: d, count: c }); r -= c * d; }
        }
        return r === 0 ? result : null;
    },

    _coinOptions(correctAmount) {
        const correct = walletToCoins(correctAmount);
        const options = [{ coins: [...correct], total: correctAmount }];
        for (let a = 0; a < 20 && options.length < 3; a++) {
            const offset = randomInt(1, 3) * 10;
            const wrongAmt = Math.random() < 0.5 ? correctAmount + offset : Math.max(10, correctAmount - offset);
            if (options.some(o => o.total === wrongAmt)) continue;
            options.push({ coins: walletToCoins(wrongAmt), total: wrongAmt });
        }
        while (options.length < 3) {
            options.push({ coins: walletToCoins(correctAmount + options.length * 10), total: correctAmount + options.length * 10 });
        }
        return shuffle(options);
    },
});
