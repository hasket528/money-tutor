// B1 今天帶多少錢 作業單
WorksheetRegistry.register('b1', {
    name: 'B1 今天帶多少錢',
    icon: '💰',
    defaultCount: 20,
    subtitle(opts) {
        const diff = { easy:'簡單', normal:'普通', hard:'困難' };
        const typeLabels = {
            'steps':         '數字填空：計算每次費用',
            'img-fill':      '圖示填空：計算每次費用',
            'fill':          '數字填空：計算最終費用',
            'fill-select':   '圖示填空：計算最終費用',
            'coin-select':   '圖示選擇：計算最終費用',
            'hint-select':   '提示選擇：計算最終費用',
            'hint-complete': '提示完成：計算最終費用',
        };
        return `${diff[opts.difficulty || 'easy']}・${typeLabels[opts.questionType || 'steps'] || ''}`;
    },

    toolbarConfig: {
        fontButton: {
            label: '📝 題型',
            type: 'dropdown',
            options: [
                { type: 'group',  label: '計算每次費用' },
                { label: '數字填空', value: 'steps'    },
                { label: '圖示填空', value: 'img-fill' },
                { type: 'group',  label: '計算最終費用' },
                { label: '數字填空',   value: 'fill'          },
                { label: '圖示填空',   value: 'fill-select'   },
                { label: '圖示選擇',   value: 'coin-select'   },
                { label: '提示選擇',   value: 'hint-select'   },
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

    _scenarios: {
        easy: [
            { icon:'🏫', label:'學校',     items:[{ name:'午餐費', cost:55  }, { name:'公車票', cost:20  }] },
            { icon:'🏪', label:'超商',     items:[{ name:'飲料費', cost:30  }, { name:'零食費', cost:20  }] },
            { icon:'📚', label:'圖書館',   items:[{ name:'影印費', cost:10  }, { name:'文具費', cost:15  }] },
            { icon:'🎭', label:'看表演',   items:[{ name:'表演票', cost:100 }, { name:'零食費', cost:20  }] },
            { icon:'🏊', label:'游泳課',   items:[{ name:'入場費', cost:80  }, { name:'飲料費', cost:15  }] },
            { icon:'🎨', label:'美術課',   items:[{ name:'材料費', cost:35  }, { name:'鉛筆費', cost:15  }] },
            { icon:'🚌', label:'搭公車',   items:[{ name:'公車票', cost:20  }, { name:'飲料費', cost:15  }] },
            { icon:'🌿', label:'逛公園',   items:[{ name:'停車費', cost:20  }, { name:'飲料費', cost:15  }] },
            { icon:'☕', label:'買早餐',   items:[{ name:'早餐費', cost:35  }, { name:'飲料費', cost:15  }] },
            { icon:'🐟', label:'買魚飼料', items:[{ name:'飼料費', cost:45  }, { name:'水草費', cost:20  }] },
        ],
        normal: [
            { icon:'🏫', label:'上學日',   items:[{ name:'午餐費', cost:60  }, { name:'公車費', cost:20  }] },
            { icon:'🎨', label:'才藝課',   items:[{ name:'課程費', cost:150 }, { name:'材料費', cost:50  }] },
            { icon:'🏥', label:'看醫生',   items:[{ name:'掛號費', cost:150 }, { name:'藥費',   cost:80  }] },
            { icon:'🎬', label:'看電影',   items:[{ name:'電影票', cost:280 }, { name:'爆米花', cost:90  }] },
            { icon:'🚂', label:'搭火車',   items:[{ name:'火車票', cost:250 }, { name:'便當費', cost:75  }] },
            { icon:'🏊', label:'游泳池',   items:[{ name:'入場費', cost:80  }, { name:'飲料費', cost:25  }] },
            { icon:'📖', label:'買書',     items:[{ name:'故事書費', cost:180 }, { name:'文具費', cost:45 }] },
            { icon:'🌄', label:'爬山',     items:[{ name:'門票費', cost:100 }, { name:'食物費', cost:120 }] },
            { icon:'🎮', label:'遊樂場',   items:[{ name:'門票費', cost:200 }, { name:'遊戲費', cost:50  }] },
            { icon:'🍜', label:'吃午飯',   items:[{ name:'午餐費', cost:85  }, { name:'飲料費', cost:30  }] },
        ],
        hard: [
            { icon:'🛒', label:'大採購',   items:[{ name:'衣服費',  cost:350 }, { name:'鞋子費', cost:490 }, { name:'書費',    cost:180 }] },
            { icon:'🎂', label:'買禮物',   items:[{ name:'禮物費',  cost:280 }, { name:'蛋糕費', cost:420 }, { name:'卡片費',  cost:35  }] },
            { icon:'🌿', label:'出遊',     items:[{ name:'公車費',  cost:20  }, { name:'冰淇淋費', cost:45 }, { name:'門票費',  cost:100 }, { name:'飲料費', cost:30 }] },
            { icon:'🏕️', label:'露營',   items:[{ name:'食材費',  cost:350 }, { name:'裝備費', cost:200 }, { name:'入場費',  cost:150 }] },
            { icon:'🎡', label:'遊樂園',   items:[{ name:'門票費',  cost:580 }, { name:'餐費',   cost:250 }, { name:'紀念品費', cost:180 }] },
            { icon:'🌍', label:'校外教學', items:[{ name:'交通費',  cost:80  }, { name:'午餐費', cost:120 }, { name:'門票費',  cost:200 }, { name:'零用錢', cost:100 }] },
            { icon:'🎓', label:'畢業典禮', items:[{ name:'服裝費',  cost:450 }, { name:'花束費', cost:280 }, { name:'聚餐費',  cost:350 }] },
            { icon:'🏖️', label:'海邊',   items:[{ name:'防曬乳',  cost:180 }, { name:'餐費',   cost:300 }, { name:'停車費',  cost:100 }, { name:'飲料費', cost:60  }] },
        ],
    },

    // 將金額分解為金錢圖示（最多顯示 6 枚，避免版面過長）
    _coinsDisplay(amount, renderCoin) {
        const coins = walletToCoins(amount);
        const displayed = coins.slice(0, 6);
        const more = coins.length > 6 ? `<span style="font-size:11px;color:#888;">…</span>` : '';
        return displayed.map(c => renderCoin(c)).join('') + more;
    },

    generate(options) {
        const diff = options.difficulty || 'easy';
        const questionType = options.questionType || 'steps';
        const coinStyle = options.coinStyle || 'real';
        const showAnswers = options._showAnswers || false;
        const usedLabels = options._usedValues || new Set();

        const renderCoin = (value) => {
            if (coinStyle === 'symbol')    return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };

        const src = this._scenarios[diff];
        const pool = shuffle(src.filter(s => !usedLabels.has(`b1_${s.label}`)));
        if (pool.length < 2) src.forEach(s => pool.push(s));
        const chosen = pool.slice(0, options.count || 20);
        chosen.forEach(s => usedLabels.add(`b1_${s.label}`));
        const checkbox = '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin:0 4px;vertical-align:middle;"></span>';

        const TH = 'padding:4px 8px;border-bottom:1.5px solid #9ca3af;';
        const TD = 'padding:3px 8px;';
        const TABLE = 'border-collapse:collapse;font-size:12pt;width:100%;margin-top:4px;';

        return chosen.map(scenario => {
            const total = scenario.items.reduce((s, it) => s + it.cost, 0);
            const itemsText = scenario.items.map(it => `${it.name} <strong>${it.cost}</strong> 元`).join('、');
            const basePrompt = `要去<span class="ws-emoji-icon">${scenario.icon}</span><strong>${scenario.label}</strong>，需要花：${itemsText}`;

            if (questionType === 'steps') {
                // 計算每次費用：四欄（同 B2），上次費用與本次費用填空，費用已揭露
                let running = 0;
                const rows = scenario.items.map(it => {
                    const prev = running;
                    running += it.cost;
                    const prevAns = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${prev}</span>`
                        : blankLine(true);
                    const newAns = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${running}</span>`
                        : blankLine(true);
                    return `<tr>
                        <td style="${TD}">${it.name}</td>
                        <td style="text-align:center;${TD}">${prevAns} 元</td>
                        <td style="text-align:center;${TD}font-weight:bold;">${it.cost}</td>
                        <td style="text-align:center;${TD}">${newAns} 元</td>
                    </tr>`;
                }).join('');
                return {
                    _key: `b1_${scenario.label}`,
                    prompt: `要去<span class="ws-emoji-icon">${scenario.icon}</span><strong>${scenario.label}</strong>，填入各項費用前後的累計金額：`,
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}">上次費用</th>
                            <th style="${TH}">本次費用</th>
                            <th style="${TH}">累計費用</th>
                        </tr>
                        ${rows}
                    </table>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            } else if (questionType === 'img-fill') {
                // 圖示填空：同數字填空三欄結構，費用欄與累計欄前均加金錢圖示提示
                let running = 0;
                const mkCoinHintCell = (amount, wide) => {
                    const coins = this._coinsDisplay(amount, renderCoin);
                    const ans   = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${amount}</span>`
                        : blankLine(wide);
                    return `<td style="${TD}"><span style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:3px;">${coins}<span style="margin-left:2px;">${ans} 元</span></span></td>`;
                };
                const rows = scenario.items.map(it => {
                    running += it.cost;
                    return `<tr>
                        <td style="${TD}">${it.name}</td>
                        ${mkCoinHintCell(it.cost, false)}
                        ${mkCoinHintCell(running, true)}
                    </tr>`;
                }).join('');
                return {
                    _key: `b1_${scenario.label}`,
                    prompt: `要去<span class="ws-emoji-icon">${scenario.icon}</span><strong>${scenario.label}</strong>，看金錢圖示，填入各項費用和累計金額：`,
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}">費用</th>
                            <th style="${TH}">累計（元）</th>
                        </tr>
                        ${rows}
                    </table>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            } else if (questionType === 'fill') {
                // 數字填空：表格條列各項費用，填入合計
                const itemRows = scenario.items.map(it => `<tr>
                    <td style="${TD}">${it.name}</td>
                    <td style="text-align:right;${TD}font-weight:bold;">${it.cost} 元</td>
                </tr>`).join('');
                const ans = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${total}</span>`
                    : blankLine(true);
                return {
                    _key: `b1_${scenario.label}`,
                    prompt: `要去<span class="ws-emoji-icon">${scenario.icon}</span><strong>${scenario.label}</strong>，計算共需多少費用：`,
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}text-align:right;">費用</th>
                        </tr>
                        ${itemRows}
                        <tr style="border-top:2px solid #9ca3af;background:#f9fafb;">
                            <td style="${TD}font-weight:bold;">合計</td>
                            <td style="text-align:right;${TD}">${ans} 元</td>
                        </tr>
                    </table>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            } else if (questionType === 'fill-select') {
                // 圖示填空：三欄表格（同 B2 fill-select），金錢圖示 + 費用填空，合計列同樣填空
                const mkCoinAmtRow = (labelHtml, amount) => {
                    const coins = this._coinsDisplay(amount, renderCoin);
                    const ans = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${amount}</span>`
                        : blankLine();
                    return `<tr>
                        <td style="${TD}">${labelHtml}</td>
                        <td style="${TD}">${coins}</td>
                        <td style="text-align:right;${TD}">${ans} 元</td>
                    </tr>`;
                };
                const totalCoins = this._coinsDisplay(total, renderCoin);
                const totalAns   = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${total}</span>`
                    : blankLine(true);
                return {
                    _key: `b1_${scenario.label}`,
                    prompt: `要去<span class="ws-emoji-icon">${scenario.icon}</span><strong>${scenario.label}</strong>，看金錢圖示，填入各項費用和合計：`,
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}">金錢圖示</th>
                            <th style="${TH}text-align:right;">費用（元）</th>
                        </tr>
                        ${scenario.items.map(it => mkCoinAmtRow(it.name, it.cost)).join('')}
                        <tr style="border-top:2px solid #9ca3af;background:#f9fafb;">
                            <td style="${TD}font-weight:bold;">合計</td>
                            <td style="${TD}">${totalCoins}</td>
                            <td style="text-align:right;${TD}">${totalAns} 元</td>
                        </tr>
                    </table>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            } else if (questionType === 'coin-select') {
                // 圖示選擇：三欄表格（項目|金錢圖示|費用），費用已揭露，下方選出正確錢幣組合
                const mkRevealRow = (labelHtml, amount) => {
                    const coins = this._coinsDisplay(amount, renderCoin);
                    return `<tr>
                        <td style="${TD}">${labelHtml}</td>
                        <td style="${TD}">${coins}</td>
                        <td style="text-align:right;${TD}font-weight:bold;">${amount} 元</td>
                    </tr>`;
                };
                const csOpts = this._coinOptions(total);
                const csChoices = csOpts.map((opt, i) => {
                    const label = String.fromCharCode(9312 + i);
                    const isCorrect = opt.total === total;
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
                const csTotalCoins = this._coinsDisplay(total, renderCoin);
                return {
                    _key: `b1_${scenario.label}`,
                    prompt: `要去<span class="ws-emoji-icon">${scenario.icon}</span><strong>${scenario.label}</strong>，請選出正確的錢幣組合：`,
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}">金錢圖示</th>
                            <th style="${TH}text-align:right;">費用</th>
                        </tr>
                        ${scenario.items.map(it => mkRevealRow(it.name, it.cost)).join('')}
                        <tr style="border-top:2px solid #9ca3af;background:#f9fafb;">
                            <td style="${TD}font-weight:bold;">合計</td>
                            <td style="${TD}">${csTotalCoins}</td>
                            <td style="text-align:right;${TD}font-weight:bold;">${total} 元</td>
                        </tr>
                    </table>
                    <div style="margin:6px 0;">共需 <strong>${total}</strong> 元，請選出正確的錢幣組合：</div>
                    <div class="coin-choice-options">${csChoices}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            } else if (questionType === 'hint-select') {
                // 提示選擇：三欄表格（項目|金錢圖示|費用），費用已揭露，選項旁顯示灰色金額提示
                const mkRevealRow2 = (labelHtml, amount) => {
                    const coins = this._coinsDisplay(amount, renderCoin);
                    return `<tr>
                        <td style="${TD}">${labelHtml}</td>
                        <td style="${TD}">${coins}</td>
                        <td style="text-align:right;${TD}font-weight:bold;">${amount} 元</td>
                    </tr>`;
                };
                const hsOpts = this._coinOptions(total);
                const hsChoices = hsOpts.map((opt, i) => {
                    const label = String.fromCharCode(9312 + i);
                    const isCorrect = opt.total === total;
                    const style = showAnswers && isCorrect ? 'border-color:red;border-width:3px;' : '';
                    const check = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const answerTag = (showAnswers && isCorrect)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${total} 元</span>` : '';
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold;min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>
                        <span style="color:#ccc;font-weight:bold;margin-left:6px;">${opt.total} 元</span>${answerTag}
                    </div>`;
                }).join('');
                const hsTotalCoins = this._coinsDisplay(total, renderCoin);
                return {
                    _key: `b1_${scenario.label}`,
                    prompt: `要去<span class="ws-emoji-icon">${scenario.icon}</span><strong>${scenario.label}</strong>，請選出正確的錢幣組合：`,
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}">金錢圖示</th>
                            <th style="${TH}text-align:right;">費用</th>
                        </tr>
                        ${scenario.items.map(it => mkRevealRow2(it.name, it.cost)).join('')}
                        <tr style="border-top:2px solid #9ca3af;background:#f9fafb;">
                            <td style="${TD}font-weight:bold;">合計</td>
                            <td style="${TD}">${hsTotalCoins}</td>
                            <td style="text-align:right;${TD}font-weight:bold;">${total} 元</td>
                        </tr>
                    </table>
                    <div style="margin:6px 0;">共需 <strong>${total}</strong> 元，請選出正確的錢幣組合：</div>
                    <div class="coin-choice-options">${hsChoices}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            } else { // hint-complete
                // 提示完成：三欄大表格（同 B2 hint-complete），金錢圖示填數量 + 費用填空
                if (!this._findCombo(total)) return null;
                const mkHintRow = (labelHtml, amount, isLast) => {
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
                    const rowStyle = isLast ? 'border-top:2px solid #9ca3af;background:#f9fafb;' : '';
                    return `<tr style="${rowStyle}">
                        <td style="${TD}${isLast ? 'font-weight:bold;' : ''}">${labelHtml}</td>
                        <td style="${TD}"><span style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:5px;">${parts}</span></td>
                        <td style="text-align:right;${TD}">${ans} 元</td>
                    </tr>`;
                };
                return {
                    _key: `b1_${scenario.label}`,
                    prompt: `要去<span class="ws-emoji-icon">${scenario.icon}</span><strong>${scenario.label}</strong>，看金錢圖示，填入數量和費用：`,
                    visual: `<table style="${TABLE}">
                        <tr style="background:#f3f4f6;">
                            <th style="${TH}text-align:left;">項目</th>
                            <th style="${TH}">金錢圖示（填數量）</th>
                            <th style="${TH}text-align:right;">費用（元）</th>
                        </tr>
                        ${scenario.items.map(it => mkHintRow(it.name, it.cost, false)).join('')}
                        ${mkHintRow('合計', total, true)}
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
