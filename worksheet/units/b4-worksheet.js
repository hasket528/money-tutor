// B4 特賣比一比 作業單
WorksheetRegistry.register('b4', {
    name: 'B4 特賣比一比',
    icon: '🏷️',
    defaultCount: 10,
    subtitle(opts) {
        const qt = {
            'cheaper-num':   '數字填空(2家-找便宜)',
            'cheaper-coin':  '圖示填空(2家-找便宜)',
            'cheaper-hint':  '圈選完成(2家-找便宜)',
            'cheaper3-num':  '數字填空(3家-找便宜)',
            'cheaper3-coin': '圖示填空(3家-找便宜)',
            'cheaper3-hint': '圈選完成(3家-找便宜)',
            'fill-num':      '數字填空(計算差額)',
            'fill-coin':     '圖示填空(計算差額)',
            'fill-hint':     '提示完成(計算差額)',
            'fill-select':   '圖示完成(計算差額)',
        };
        return `題型：${qt[opts.questionType || 'cheaper-num']}`;
    },

    toolbarConfig: {
        fontButton: null,
        adjustCountButton: {
            label: '🎯 難度',
            type: 'dropdown',
            options: [
                { label: '簡單', value: 'easy'   },
                { label: '普通', value: 'normal' },
                { label: '困難', value: 'hard'   },
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
                    { label: '真實金錢(正面)',     value: 'real'      },
                    { label: '真實金錢(反面)',     value: 'real-back' },
                    { label: '真實金錢(正、反面)', value: 'real-both' },
                    { label: '金錢符號',           value: 'symbol'    },
                ],
                getCurrentValue: (params) => params.coinStyle || 'real',
                onChange: (val, app) => { app.params.coinStyle = val; app.generate(); }
            },
            {
                id: 'question-type-btn',
                label: '📝 測驗題型',
                type: 'dropdown',
                options: [
                    { label: '數字填空(2家店比較-找便宜)',   value: 'cheaper-num'   },
                    { label: '圖示填空(2家店比較-找便宜)',   value: 'cheaper-coin'  },
                    { label: '圈選完成(2家店比較-找便宜)',   value: 'cheaper-hint'  },
                    { label: '數字填空(3家店比較-找便宜)',   value: 'cheaper3-num'  },
                    { label: '圖示填空(3家店比較-找便宜)',   value: 'cheaper3-coin' },
                    { label: '圈選完成(3家店比較-找便宜)',   value: 'cheaper3-hint' },
                    { label: '數字填空(計算差額)',           value: 'fill-num'      },
                    { label: '圖示填空(計算差額)',           value: 'fill-coin'     },
                    { label: '圖示完成(計算差額)',           value: 'fill-select'   },
                    { label: '提示完成(計算差額)',           value: 'fill-hint'     },
                ],
                getCurrentValue: (params) => params.questionType || 'cheaper-num',
                onChange: (val, app) => { app.params.questionType = val; app.generate(); }
            },
        ],
    },

    // optA.price > optB.price（2家比較時 optB 永遠較便宜）
    _items: {
        easy: [
            { name:'原子筆',       icon:'🖊️', optA:{ store:'書局',   price:15 }, optB:{ store:'大賣場', price:12 }, optC:{ store:'量販店', price:10 } },
            { name:'礦泉水',       icon:'💧',  optA:{ store:'超商',   price:20 }, optB:{ store:'量販店', price:13 }, optC:{ store:'超市',   price:16 } },
            { name:'果汁（1瓶）',  icon:'🧃',  optA:{ store:'超商',   price:35 }, optB:{ store:'超市',   price:25 }, optC:{ store:'量販店', price:20 } },
            { name:'面紙（一包）', icon:'🧻',  optA:{ store:'超商',   price:39 }, optB:{ store:'量販店', price:25 }, optC:{ store:'大賣場', price:22 } },
            { name:'牙刷',         icon:'🪥',  optA:{ store:'藥局',   price:39 }, optB:{ store:'量販店', price:29 }, optC:{ store:'超市',   price:32 } },
            { name:'蘋果（1斤）',  icon:'🍎',  optA:{ store:'超市',   price:45 }, optB:{ store:'菜市場', price:35 }, optC:{ store:'量販店', price:40 } },
            { name:'餅乾（一盒）', icon:'🍪',  optA:{ store:'超商',   price:45 }, optB:{ store:'超市',   price:35 }, optC:{ store:'量販店', price:28 } },
            { name:'巧克力',       icon:'🍫',  optA:{ store:'超商',   price:55 }, optB:{ store:'超市',   price:42 }, optC:{ store:'量販店', price:38 } },
            { name:'牛奶（1公升）',icon:'🥛',  optA:{ store:'超商',   price:65 }, optB:{ store:'超市',   price:55 }, optC:{ store:'量販店', price:48 } },
            { name:'鉛筆盒',       icon:'✏️',  optA:{ store:'文具店', price:85 }, optB:{ store:'超市',   price:65 }, optC:{ store:'書局',   price:72 } },
        ],
        normal: [
            { name:'洗碗精',       icon:'🧼',  optA:{ store:'超市',   price:59  }, optB:{ store:'量販店', price:45  }, optC:{ store:'大賣場', price:52  } },
            { name:'電池（4顆）',  icon:'🔋',  optA:{ store:'超商',   price:85  }, optB:{ store:'量販店', price:59  }, optC:{ store:'大賣場', price:68  } },
            { name:'色鉛筆',       icon:'🖍️', optA:{ store:'文具店', price:120 }, optB:{ store:'大賣場', price:89  }, optC:{ store:'量販店', price:75  } },
            { name:'水壺',         icon:'🫙',  optA:{ store:'品牌店', price:185 }, optB:{ store:'量販店', price:135 }, optC:{ store:'超市',   price:160 } },
            { name:'洗髮精',       icon:'🧴',  optA:{ store:'藥妝店', price:189 }, optB:{ store:'量販店', price:149 }, optC:{ store:'超市',   price:169 } },
            { name:'桌遊',         icon:'🎲',  optA:{ store:'玩具店', price:260 }, optB:{ store:'量販店', price:195 }, optC:{ store:'網購',   price:180 } },
            { name:'毛巾',         icon:'🧣',  optA:{ store:'百貨',   price:250 }, optB:{ store:'市場',   price:180 }, optC:{ store:'量販店', price:195 } },
            { name:'故事書',       icon:'📖',  optA:{ store:'書店',   price:280 }, optB:{ store:'二手店', price:150 }, optC:{ store:'網購',   price:130 } },
        ],
        hard: [
            { name:'手套',   icon:'🧤',  optA:{ store:'百貨',   price:320  }, optB:{ store:'市場',   price:180  }, optC:{ store:'量販店', price:145  } },
            { name:'拖鞋',   icon:'🩴',  optA:{ store:'百貨',   price:390  }, optB:{ store:'夜市',   price:120  }, optC:{ store:'量販店', price:150  } },
            { name:'玩具組', icon:'🧸',  optA:{ store:'玩具店', price:450  }, optB:{ store:'量販店', price:320  }, optC:{ store:'網購',   price:265  } },
            { name:'雨傘',   icon:'☂️',  optA:{ store:'百貨',   price:480  }, optB:{ store:'夜市',   price:150  }, optC:{ store:'量販店', price:200  } },
            { name:'書包',   icon:'🎒',  optA:{ store:'百貨',   price:580  }, optB:{ store:'量販店', price:360  }, optC:{ store:'網購',   price:290  } },
            { name:'運動鞋', icon:'👟',  optA:{ store:'品牌店', price:1580 }, optB:{ store:'網購',   price:1200 }, optC:{ store:'特賣場', price:950  } },
        ],
    },

    generate(options) {
        const questionType = options.questionType || 'cheaper-num';
        const coinStyle    = options.coinStyle     || 'real';
        const showAnswers  = options._showAnswers  || false;
        const usedKeys     = options._usedValues   || new Set();
        const count        = options.count         || 10;
        const difficulty   = options.difficulty    || 'easy';
        const items        = this._items[difficulty] || this._items.easy;
        const keyPrefix    = `b4_${difficulty}_`;

        // 從題型後綴推導金額呈現方式
        let priceStyle;
        if (questionType.endsWith('-num'))       priceStyle = 'num-only';
        else if (questionType.endsWith('-coin')) priceStyle = 'coin-blank';
        else if (questionType.endsWith('-hint')) priceStyle = 'coin-num';
        else                                     priceStyle = 'num-only';

        const renderCoin = (value) => {
            if (coinStyle === 'symbol')    return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };

        // 金額呈現方式：純數字 / 金錢圖示+底線 / 金錢圖示+數字
        const renderPrice = (price) => {
            if (priceStyle === 'num-only') {
                return `<strong>${price}</strong> 元`;
            }
            const coins = walletToCoins(price);
            const coinImgsHtml = `<div style="display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:2px;margin:2px 0 1px;">${coins.map(c => renderCoin(c)).join('')}</div>`;
            if (priceStyle === 'coin-num') {
                return `${coinImgsHtml}<strong>${price}</strong> 元`;
            }
            // coin-blank：金錢圖示 + 底線填寫
            return `${coinImgsHtml}${blankLine()} 元`;
        };

        const available = items.map((_, i) => i).filter(i => !usedKeys.has(keyPrefix + i));
        const pool      = shuffle(available.length >= 2 ? available : items.map((_, i) => i));
        const chosen    = pool.slice(0, count);
        chosen.forEach(i => usedKeys.add(keyPrefix + i));

        const iconSpan = (icon) => `<span class="ws-emoji-icon">${icon}</span>`;

        return chosen.map(idx => {
            const item = items[idx];
            const itemKey = keyPrefix + idx;

            const swapped    = Math.random() < 0.5;
            const left       = swapped ? item.optB : item.optA;
            const right      = swapped ? item.optA : item.optB;
            const cheaperOpt = item.optB;          // optB 永遠較便宜（2家比較）
            const diff       = item.optA.price - item.optB.price;

            // 兩家比較區塊
            const priceRow = `<div style="display:flex;gap:18px;margin:6px 0;font-size:13pt;">
                <span style="flex:1;text-align:center;background:#fef9c3;border-radius:8px;padding:4px 8px;">
                    🏪 ${left.store}<br>${renderPrice(left.price)}
                </span>
                <span style="flex:1;text-align:center;background:#dbeafe;border-radius:8px;padding:4px 8px;">
                    🏬 ${right.store}<br>${renderPrice(right.price)}
                </span>
            </div>`;

            // ── 找便宜（2家店比較）────────────────────────────────────
            if (questionType === 'cheaper-num' || questionType === 'cheaper-coin') {
                const ans = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${cheaperOpt.store}</span>`
                    : blankLine();
                return {
                    _key: itemKey,
                    prompt: `${iconSpan(item.icon)}<strong>${item.name}</strong> 在兩家店的售價如下：`,
                    visual: priceRow,
                    answerArea: `哪家比較便宜？${ans}`,
                    answerDisplay: ''
                };
            }

            // ── 找便宜（2家店比較-圈選完成）──────────────────────────
            if (questionType === 'cheaper-hint') {
                const storeA = left.store;
                const storeB = right.store;
                const cheapestStore = cheaperOpt.store;
                const circleHtml = showAnswers
                    ? `${storeA === cheapestStore
                        ? `<span style="display:inline-block;border:2.5px solid red;border-radius:50%;padding:1px 8px;color:red;font-weight:bold;margin:0 6px;">${storeA}</span>`
                        : `<span style="margin:0 6px;">${storeA}</span>`
                      }&ensp;&ensp;${storeB === cheapestStore
                        ? `<span style="display:inline-block;border:2.5px solid red;border-radius:50%;padding:1px 8px;color:red;font-weight:bold;margin:0 6px;">${storeB}</span>`
                        : `<span style="margin:0 6px;">${storeB}</span>`
                      }`
                    : `<span style="margin:0 10px;">${storeA}</span>&ensp;&ensp;<span style="margin:0 10px;">${storeB}</span>`;
                return {
                    _key: itemKey,
                    prompt: `${iconSpan(item.icon)}<strong>${item.name}</strong> 在兩家店的售價如下：`,
                    visual: priceRow,
                    answerArea: `哪家比較便宜，請圈出來&ensp;${circleHtml}`,
                    answerDisplay: ''
                };
            }

            // ── 找便宜（3家店比較）────────────────────────────────────
            if (questionType === 'cheaper3-num' || questionType === 'cheaper3-coin' || questionType === 'cheaper3-hint') {
                const stores3   = [item.optA, item.optB, item.optC];
                const cheapest3 = stores3.reduce((a, b) => a.price < b.price ? a : b);
                const shuffled3 = shuffle([...stores3]);
                const storeIcons = ['🏪', '🏬', '🏦'];
                const colors3    = ['#fef9c3', '#dbeafe', '#dcfce7'];
                const priceRow3 = `<div style="display:flex;gap:10px;margin:6px 0;font-size:12pt;">
                    ${shuffled3.map((opt, i) => `<span style="flex:1;text-align:center;background:${colors3[i]};border-radius:8px;padding:4px 6px;">
                        ${storeIcons[i]} ${opt.store}<br>${renderPrice(opt.price)}
                    </span>`).join('')}
                </div>`;

                if (questionType === 'cheaper3-hint') {
                    const circleHtml3 = shuffled3.map(opt => {
                        if (showAnswers && opt.store === cheapest3.store) {
                            return `<span style="display:inline-block;border:2.5px solid red;border-radius:50%;padding:1px 8px;color:red;font-weight:bold;margin:0 5px;">${opt.store}</span>`;
                        }
                        return `<span style="margin:0 5px;">${opt.store}</span>`;
                    }).join('&ensp;&ensp;');
                    return {
                        _key: itemKey,
                        prompt: `${iconSpan(item.icon)}<strong>${item.name}</strong> 在三家店的售價如下：`,
                        visual: priceRow3,
                        answerArea: `哪家最便宜，請圈出來&ensp;${circleHtml3}`,
                        answerDisplay: ''
                    };
                }

                const ans = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${cheapest3.store}</span>`
                    : blankLine();
                return {
                    _key: itemKey,
                    prompt: `${iconSpan(item.icon)}<strong>${item.name}</strong> 在三家店的售價如下：`,
                    visual: priceRow3,
                    answerArea: `哪家最便宜？${ans}`,
                    answerDisplay: ''
                };
            }

            // ── 計算差額（fill-num / fill-coin / fill-hint）──────────
            if (questionType === 'fill-coin') {
                const diffCoins = walletToCoins(diff);
                const diffCoinImgs = `<span style="display:inline-flex;flex-wrap:wrap;align-items:center;gap:2px;margin:0 3px;vertical-align:middle;">${diffCoins.map(c => renderCoin(c)).join('')}</span>`;
                return {
                    _key: itemKey,
                    prompt: `${iconSpan(item.icon)}<strong>${item.name}</strong> 在兩家店的售價如下：`,
                    visual: priceRow,
                    answerArea: `${cheaperOpt.store}便宜了&ensp;${diffCoinImgs}${blankLine()} 元`,
                    answerDisplay: ''
                };
            }

            if (questionType === 'fill-hint') {
                const mkHintComplete = (price) => {
                    const combo = this._findCombo(price);
                    if (!combo) return `<strong>${price}</strong> 元`;
                    const partsHtml = combo.map(c => {
                        const icons  = Array(c.count).fill(renderCoin(c.denom)).join('');
                        const ansNum = showAnswers
                            ? `<span style="color:red;font-weight:bold;">${c.count}</span>` : '___';
                        const qty    = c.denom >= 100 ? '張' : '個';
                        return `${ansNum}${qty}&nbsp;${icons}`;
                    }).join('&ensp;');
                    const numStyle = showAnswers ? 'color:red;font-weight:bold;' : 'color:#ccc;font-weight:bold;';
                    return `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:3px;margin:3px 0;">${partsHtml}&ensp;共 <span style="${numStyle}">${price}</span> 元</div>`;
                };

                const priceRowHC = `<div style="display:flex;gap:18px;margin:6px 0;font-size:12pt;">
                    <span style="flex:1;text-align:center;background:#fef9c3;border-radius:8px;padding:4px 8px;">
                        🏪 ${left.store}<br>${mkHintComplete(left.price)}
                    </span>
                    <span style="flex:1;text-align:center;background:#dbeafe;border-radius:8px;padding:4px 8px;">
                        🏬 ${right.store}<br>${mkHintComplete(right.price)}
                    </span>
                </div>`;

                const diffCombo = this._findCombo(diff);
                let diffArea;
                if (diffCombo) {
                    const partsHtml = diffCombo.map(c => {
                        const icons  = Array(c.count).fill(renderCoin(c.denom)).join('');
                        const ansNum = showAnswers
                            ? `<span style="color:red;font-weight:bold;">${c.count}</span>` : '___';
                        const qty    = c.denom >= 100 ? '張' : '個';
                        return `${ansNum}${qty}&nbsp;${icons}`;
                    }).join('&ensp;');
                    const numStyle = showAnswers ? 'color:red;font-weight:bold;' : 'color:#ccc;font-weight:bold;';
                    diffArea = `${cheaperOpt.store}便宜了&ensp;${partsHtml}&ensp;共 <span style="${numStyle}">${diff}</span> 元`;
                } else {
                    const ans = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${diff}</span>` : blankLine();
                    diffArea = `${cheaperOpt.store}便宜了${ans} 元`;
                }

                return {
                    _key: itemKey,
                    prompt: `${iconSpan(item.icon)}<strong>${item.name}</strong> 在兩家店的售價如下：`,
                    visual: priceRowHC,
                    answerArea: diffArea,
                    answerDisplay: ''
                };
            }

            // ── 計算差額（選擇完成）───────────────────────────────────
            if (questionType === 'fill-select') {
                const mkHintComplete = (price) => {
                    const combo = this._findCombo(price);
                    if (!combo) return `<strong>${price}</strong> 元`;
                    const partsHtml = combo.map(c => {
                        const icons = Array(c.count).fill(renderCoin(c.denom)).join('');
                        const qty   = c.denom >= 100 ? '張' : '個';
                        return `${c.count}${qty}&nbsp;${icons}`;
                    }).join('&ensp;');
                    return `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:3px;margin:3px 0;">${partsHtml}&ensp;<span style="font-weight:bold;">共 ${price} 元</span></div>`;
                };

                const priceRowFS = `<div style="display:flex;gap:18px;margin:6px 0;font-size:12pt;">
                    <span style="flex:1;text-align:center;background:#fef9c3;border-radius:8px;padding:4px 8px;">
                        🏪 ${left.store}<br>${mkHintComplete(left.price)}
                    </span>
                    <span style="flex:1;text-align:center;background:#dbeafe;border-radius:8px;padding:4px 8px;">
                        🏬 ${right.store}<br>${mkHintComplete(right.price)}
                    </span>
                </div>`;

                const checkbox = '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin:0 4px;vertical-align:middle;"></span>';
                const diffCoins = walletToCoins(diff);
                const opts = this._generateCoinOptions(diff, diffCoins);
                const choicesHtml = opts.map((opt, i) => {
                    const label     = String.fromCharCode(9312 + i);
                    const isCorrect = opt.total === diff;
                    const style     = showAnswers && isCorrect ? 'border-color:red;border-width:3px;' : '';
                    const check     = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const amtField = (showAnswers && isCorrect)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${diff} 元</span>`
                        : `<span style="display:inline-flex;align-items:flex-end;align-self:flex-end;margin-left:6px;gap:2px;"><span style="display:inline-block;min-width:60px;border-bottom:1.5px solid #333;line-height:1;"></span><span>元</span></span>`;
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold;min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>${amtField}
                    </div>`;
                }).join('');

                return {
                    _key: itemKey,
                    prompt: `${iconSpan(item.icon)}<strong>${item.name}</strong> 在兩家店的售價如下：`,
                    visual: `${priceRowFS}
                        <div style="margin-bottom:4px;"><strong>${cheaperOpt.store}</strong> 便宜 <strong>${diff}</strong> 元？請選出正確的金額組合：</div>
                        <div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };
            }

            // fill-num（預設）
            const ans = showAnswers
                ? `<span style="color:red;font-weight:bold;">${diff}</span>`
                : blankLine();
            return {
                _key: itemKey,
                prompt: `${iconSpan(item.icon)}<strong>${item.name}</strong> 在兩家店的售價如下：`,
                visual: priceRow,
                answerArea: `${cheaperOpt.store}便宜了${ans} 元`,
                answerDisplay: ''
            };
        });
    },

    _generateCoinOptions(correctAmount, correctCoins) {
        const options = [{ coins: [...correctCoins], total: correctAmount }];
        for (let attempt = 0; attempt < 20 && options.length < 3; attempt++) {
            const offset      = randomInt(1, Math.max(5, Math.floor(correctAmount * 0.3)));
            const wrongAmount = Math.random() < 0.5
                ? correctAmount + offset
                : Math.max(1, correctAmount - offset);
            if (options.some(o => o.total === wrongAmount)) continue;
            options.push({ coins: walletToCoins(wrongAmount), total: wrongAmount });
        }
        while (options.length < 3) {
            const wrongAmount = correctAmount + options.length * 3;
            options.push({ coins: walletToCoins(wrongAmount), total: wrongAmount });
        }
        return shuffle(options);
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
});
