// B5 派對活動採購 作業單
WorksheetRegistry.register('b5', {
    name: 'B5 派對活動採購',
    icon: '🎂',
    defaultCount: 10,
    subtitle(opts) {
        const qt = {
            'price-fill':          '數字填空(價格計算)',
            'price-img-fill':      '圖示填空(價格計算)',
            'price-fill-select':   '填空與選擇(價格計算)',
            'price-coin-select':   '圖示選擇(價格計算)',
            'price-hint-select':   '提示選擇(價格計算)',
            'price-hint-complete': '提示完成(價格計算)',
            'fill':                '數字填空(找零計算)',
            'img-fill':            '圖示填空(找零計算)',
            'fill-select':         '填空與選擇(找零計算)',
            'coin-select':         '圖示選擇(找零計算)',
            'hint-select':         '提示選擇(找零計算)',
            'hint-complete':       '提示完成(找零計算)',
            'budget-plan':         '預算規劃',
        };
        const diff = { easy:'簡單', normal:'普通', hard:'困難' };
        return `難度：${diff[opts.difficulty || 'easy']}　題型：${qt[opts.questionType || 'price-fill']}`;
    },

    toolbarConfig: {
        fontButton: {
            label: '📝 題型',
            type: 'dropdown',
            options: [
                { label: '數字填空(價格計算)',   value: 'price-fill'          },
                { label: '圖示填空(價格計算)',   value: 'price-img-fill'      },
                { label: '填空與選擇(價格計算)', value: 'price-fill-select'   },
                { label: '圖示選擇(價格計算)',   value: 'price-coin-select'   },
                { label: '提示選擇(價格計算)',   value: 'price-hint-select'   },
                { label: '提示完成(價格計算)',   value: 'price-hint-complete' },
                { label: '數字填空(找零計算)',   value: 'fill'                },
                { label: '圖示填空(找零計算)',   value: 'img-fill'            },
                { label: '填空與選擇(找零計算)', value: 'fill-select'         },
                { label: '圖示選擇(找零計算)',   value: 'coin-select'         },
                { label: '提示選擇(找零計算)',   value: 'hint-select'         },
                { label: '提示完成(找零計算)',   value: 'hint-complete'       },
                { label: '預算規劃',             value: 'budget-plan'         },
            ],
            getCurrentValue: (p) => p.questionType || 'price-fill',
            onChange: (v, app) => { app.params.questionType = v; app.generate(); }
        },
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
                id: 'b5-budget-layout-btn',
                label: '📄 版面',
                type: 'cycle',
                options: [
                    { label: '每頁 1 題', value: 'single' },
                    { label: '每頁 2 題', value: 'double' },
                ],
                visible: (params) => (params.questionType || 'price-fill') === 'budget-plan',
                getCurrentValue: (params) => params.budgetLayout || 'single',
                onChange: (val, app) => { app.params.budgetLayout = val; app.generate(); }
            },
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
            }
        ],
    },

    // 三大活動主題：🎂 生日派對 / 🎃 萬聖節派對 / 🌸 春日野餐
    // 簡單：2 項，各項 ≤ 100 元；普通：2–3 項（含中等消費）；困難：3–4 項（含高單價）
    _scenarios: {
        easy: [
            { icon:'🎂', event:'生日派對',   label:'氣球蠟燭',   items:[{ name:'彩色氣球',   cost:50 }, { name:'生日蠟燭',   cost:30 }] },
            { icon:'🎂', event:'生日派對',   label:'帽子彩帶',   items:[{ name:'派對帽',     cost:80 }, { name:'彩帶裝飾',   cost:65 }] },
            { icon:'🎂', event:'生日派對',   label:'糖果拉炮',   items:[{ name:'糖果禮包',   cost:90 }, { name:'噴彩拉炮',   cost:55 }] },
            { icon:'🎃', event:'萬聖節派對', label:'南瓜骷髏',   items:[{ name:'南瓜燈',     cost:85 }, { name:'骷髏貼紙',   cost:30 }] },
            { icon:'🎃', event:'萬聖節派對', label:'糖果蜘蛛',   items:[{ name:'糖果袋',     cost:60 }, { name:'蜘蛛網裝飾', cost:45 }] },
            { icon:'🎃', event:'萬聖節派對', label:'面具糖果',   items:[{ name:'鬼臉面具',   cost:75 }, { name:'萬聖糖果',   cost:50 }] },
            { icon:'🌸', event:'春日野餐',   label:'三明治飲料', items:[{ name:'三明治',     cost:60 }, { name:'氣泡水',     cost:40 }] },
            { icon:'🌸', event:'春日野餐',   label:'餅乾水果',   items:[{ name:'餅乾零食',   cost:55 }, { name:'水果盒',     cost:80 }] },
            { icon:'🌸', event:'春日野餐',   label:'涼帽紙巾',   items:[{ name:'涼帽',       cost:90 }, { name:'紙巾',       cost:25 }] },
            { icon:'🌸', event:'春日野餐',   label:'保冷袋飲料', items:[{ name:'保冷袋',     cost:70 }, { name:'氣泡水',     cost:40 }] },
            { icon:'🎂', event:'生日派對',   label:'彩帶蠟燭',   items:[{ name:'彩帶裝飾',   cost:65 }, { name:'生日蠟燭',   cost:30 }] },
            { icon:'🎂', event:'生日派對',   label:'氣球帽子',   items:[{ name:'彩色氣球',   cost:50 }, { name:'派對帽',     cost:80 }] },
            { icon:'🎂', event:'生日派對',   label:'拉炮帽子',   items:[{ name:'噴彩拉炮',   cost:55 }, { name:'派對帽',     cost:80 }] },
            { icon:'🎃', event:'萬聖節派對', label:'南瓜蜘蛛',   items:[{ name:'南瓜燈',     cost:85 }, { name:'蜘蛛網裝飾', cost:45 }] },
            { icon:'🎃', event:'萬聖節派對', label:'鬼糖拉炮',   items:[{ name:'萬聖糖果',   cost:50 }, { name:'噴彩拉炮',   cost:55 }] },
            { icon:'🌸', event:'春日野餐',   label:'水果帽子',   items:[{ name:'水果盒',     cost:80 }, { name:'涼帽',       cost:90 }] },
            { icon:'🌸', event:'春日野餐',   label:'餅乾氣泡水', items:[{ name:'餅乾零食',   cost:55 }, { name:'氣泡水',     cost:40 }] },
            { icon:'🌸', event:'春日野餐',   label:'三明治紙巾', items:[{ name:'三明治',     cost:60 }, { name:'紙巾',       cost:25 }] },
        ],
        normal: [
            { icon:'🎂', event:'生日派對',   label:'相機禮包',    items:[{ name:'拍立得相機', cost:150 }, { name:'糖果禮包',   cost:90  }] },
            { icon:'🎂', event:'生日派對',   label:'禮物氣球',    items:[{ name:'小禮物',     cost:200 }, { name:'彩色氣球',   cost:50  }] },
            { icon:'🎂', event:'生日派對',   label:'飲料蠟燭帽',  items:[{ name:'果汁飲料',   cost:120 }, { name:'生日蠟燭',   cost:30  }, { name:'派對帽',     cost:80  }] },
            { icon:'🎂', event:'生日派對',   label:'相機彩帶',    items:[{ name:'拍立得相機', cost:150 }, { name:'彩帶裝飾',   cost:65  }] },
            { icon:'🎃', event:'萬聖節派對', label:'女巫魔杖',    items:[{ name:'女巫帽',     cost:120 }, { name:'巫師魔杖',   cost:65  }] },
            { icon:'🎃', event:'萬聖節派對', label:'裝扮面具',    items:[{ name:'萬聖裝扮',   cost:180 }, { name:'鬼臉面具',   cost:75  }] },
            { icon:'🎃', event:'萬聖節派對', label:'南瓜假髮袋',  items:[{ name:'南瓜燈',     cost:85  }, { name:'恐怖假髮',   cost:100 }, { name:'糖果袋',     cost:60  }] },
            { icon:'🌸', event:'春日野餐',   label:'野餐籃三明治',items:[{ name:'野餐籃',     cost:150 }, { name:'三明治',     cost:60  }] },
            { icon:'🌸', event:'春日野餐',   label:'水果零食飲料',items:[{ name:'水果盒',     cost:80  }, { name:'氣泡水',     cost:40  }, { name:'餅乾零食',   cost:55  }] },
            { icon:'🌸', event:'春日野餐',   label:'防曬帽巾',    items:[{ name:'防曬乳',     cost:100 }, { name:'涼帽',       cost:90  }, { name:'紙巾',       cost:25  }] },
            { icon:'🎂', event:'生日派對',   label:'禮物飲料',    items:[{ name:'小禮物',     cost:200 }, { name:'果汁飲料',   cost:120 }] },
            { icon:'🎂', event:'生日派對',   label:'相機帽氣球',  items:[{ name:'拍立得相機', cost:150 }, { name:'派對帽',     cost:80  }, { name:'彩色氣球',   cost:50  }] },
            { icon:'🎃', event:'萬聖節派對', label:'女巫萬聖糖',  items:[{ name:'女巫帽',     cost:120 }, { name:'萬聖糖果',   cost:50  }] },
            { icon:'🎃', event:'萬聖節派對', label:'假髮面具拉炮',items:[{ name:'恐怖假髮',   cost:100 }, { name:'鬼臉面具',   cost:75  }, { name:'噴彩拉炮',   cost:55  }] },
            { icon:'🌸', event:'春日野餐',   label:'野餐籃餅乾',  items:[{ name:'野餐籃',     cost:150 }, { name:'餅乾零食',   cost:55  }] },
            { icon:'🌸', event:'春日野餐',   label:'防曬水果帽',  items:[{ name:'防曬乳',     cost:100 }, { name:'水果盒',     cost:80  }, { name:'涼帽',       cost:90  }] },
            { icon:'🎂', event:'生日派對',   label:'蠟燭彩帶飲料',items:[{ name:'生日蠟燭',   cost:30  }, { name:'彩帶裝飾',   cost:65  }, { name:'果汁飲料',   cost:120 }] },
            { icon:'🎃', event:'萬聖節派對', label:'裝扮骷髏網',  items:[{ name:'萬聖裝扮',   cost:180 }, { name:'骷髏貼紙',   cost:30  }, { name:'蜘蛛網裝飾', cost:45  }] },
        ],
        hard: [
            { icon:'🎂', event:'生日派對',   label:'蛋糕飲料氣球', items:[{ name:'生日蛋糕',   cost:380 }, { name:'果汁飲料',   cost:120 }, { name:'彩色氣球',   cost:50  }] },
            { icon:'🎂', event:'生日派對',   label:'蛋糕禮物蠟燭', items:[{ name:'生日蛋糕',   cost:380 }, { name:'小禮物',     cost:200 }, { name:'生日蠟燭',   cost:30  }] },
            { icon:'🎂', event:'生日派對',   label:'相機禮物糖果', items:[{ name:'拍立得相機', cost:150 }, { name:'小禮物',     cost:200 }, { name:'糖果禮包',   cost:90  }] },
            { icon:'🎂', event:'生日派對',   label:'完整生日套組', items:[{ name:'生日蛋糕',   cost:380 }, { name:'果汁飲料',   cost:120 }, { name:'小禮物',     cost:200 }, { name:'彩色氣球', cost:50  }] },
            { icon:'🎃', event:'萬聖節派對', label:'萬聖三件組',   items:[{ name:'萬聖裝扮',   cost:180 }, { name:'女巫帽',     cost:120 }, { name:'南瓜燈',     cost:85  }] },
            { icon:'🎃', event:'萬聖節派對', label:'萬聖全套',     items:[{ name:'萬聖裝扮',   cost:180 }, { name:'恐怖假髮',   cost:100 }, { name:'鬼臉面具',   cost:75  }, { name:'糖果袋', cost:60  }] },
            { icon:'🌸', event:'春日野餐',   label:'野餐豪華組',   items:[{ name:'野餐籃',     cost:150 }, { name:'防曬乳',     cost:100 }, { name:'水果盒',     cost:80  }, { name:'三明治', cost:60  }] },
            { icon:'🌸', event:'春日野餐',   label:'野餐全裝備',   items:[{ name:'野餐籃',     cost:150 }, { name:'保冷袋',     cost:70  }, { name:'涼帽',       cost:90  }, { name:'餅乾零食', cost:55 }] },
            { icon:'🎂', event:'生日派對',   label:'生日豪華全套', items:[{ name:'生日蛋糕',   cost:380 }, { name:'拍立得相機', cost:150 }, { name:'小禮物',     cost:200 }] },
            { icon:'🎃', event:'萬聖節派對', label:'萬聖豪華套',   items:[{ name:'萬聖裝扮',   cost:180 }, { name:'女巫帽',     cost:120 }, { name:'恐怖假髮',   cost:100 }, { name:'骷髏貼紙', cost:30 }] },
            { icon:'🌸', event:'春日野餐',   label:'春日完整配備', items:[{ name:'野餐籃',     cost:150 }, { name:'防曬乳',     cost:100 }, { name:'水果盒',     cost:80  }, { name:'氣泡水',   cost:40  }] },
            { icon:'🎂', event:'生日派對',   label:'完整派對四件', items:[{ name:'生日蛋糕',   cost:380 }, { name:'果汁飲料',   cost:120 }, { name:'彩帶裝飾',   cost:65  }, { name:'派對帽',   cost:80  }] },
            { icon:'🎃', event:'萬聖節派對', label:'萬聖裝扮四件', items:[{ name:'萬聖裝扮',   cost:180 }, { name:'女巫帽',     cost:120 }, { name:'巫師魔杖',   cost:65  }, { name:'恐怖假髮', cost:100 }] },
            { icon:'🌸', event:'春日野餐',   label:'豪華野餐套組', items:[{ name:'野餐籃',     cost:150 }, { name:'防曬乳',     cost:100 }, { name:'涼帽',       cost:90  }, { name:'保冷袋',   cost:70  }] },
        ],
    },

    _itemEmoji: {
        // 生日派對
        '生日蛋糕': '🎂', '彩色氣球': '🎈', '生日蠟燭': '🕯️', '派對帽': '🎩',
        '噴彩拉炮': '🎉', '彩帶裝飾': '🎊', '糖果禮包': '🍬', '小禮物': '🎁',
        '果汁飲料': '🧃', '拍立得相機': '📸',
        // 萬聖節派對
        '南瓜燈': '🎃', '糖果袋': '🍭', '女巫帽': '🧙', '鬼臉面具': '👻',
        '萬聖裝扮': '🦇', '蜘蛛網裝飾': '🕸️', '骷髏貼紙': '💀', '巫師魔杖': '🪄',
        '萬聖糖果': '🍫',
        '恐怖假髮': '🧟',
        // 春日野餐
        '三明治': '🥪', '水果盒': '🍓', '野餐籃': '🧺', '餅乾零食': '🍪',
        '涼帽': '👒', '紙巾': '🧻', '一次性餐具': '🍴', '保冷袋': '🧊',
        '氣泡水': '🥤', '防曬乳': '☀️',
    },

    _coinsDisplay(amount, renderCoin) {
        const coins = walletToCoins(amount);
        const displayed = coins.slice(0, 6);
        const more = coins.length > 6 ? `<span style="font-size:11px;color:#888;">…</span>` : '';
        return displayed.map(c => renderCoin(c)).join('') + more;
    },

    generate(options) {
        const diff         = options.difficulty    || 'easy';
        const questionType = options.questionType  || 'price-fill';
        const coinStyle    = options.coinStyle     || 'real';
        const showAnswers  = options._showAnswers  || false;
        const usedLabels   = options._usedValues   || new Set();

        const renderCoin = (value) => {
            if (coinStyle === 'symbol')    return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };

        const src    = this._scenarios[diff];
        const pool   = shuffle(src.filter(s => !usedLabels.has(`b5_${s.label}`)));
        if (pool.length < 2) src.forEach(s => pool.push(s));
        const chosen = pool.slice(0, options.count || 10);
        chosen.forEach(s => usedLabels.add(`b5_${s.label}`));

        const checkbox = '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin:0 4px;vertical-align:middle;"></span>';

        // ── 預算規劃（單題模式，不走 scenario 迴圈）────────────────────
        if (questionType === 'budget-plan') {
            const budgetLayout = options.budgetLayout || 'single';
            const compact = budgetLayout === 'double';

            const rPrice = (name) => {
                const range = this._costRanges[name];
                if (!range) return 0;
                const [lo, hi] = range;
                return Math.round((lo + Math.random() * (hi - lo)) / 5) * 5;
            };

            const buildQuestion = (variant) => {
                const theme   = variant.theme;
                const budget  = variant.budget;
                const matCats = variant.categories.map(cat => ({
                    label: cat.label,
                    items: cat.items.map(item => ({ name: item.name, cost: rPrice(item.name) }))
                }));
                const TH = `border:1px solid #bbb;padding:${compact?'2px 4px':'5px 6px'};font-weight:bold;`;
                const TD = `border:1px solid #ddd;padding:${compact?'2px 4px':'4px 6px'};`;
                const ckBox  = `<span style="display:inline-block;width:14px;height:14px;border:1.5px solid #333;vertical-align:middle;margin-right:4px;border-radius:2px;"></span>`;
                const ckDone = `<span style="display:inline-block;width:14px;height:14px;border:1.5px solid red;color:red;font-size:11px;line-height:14px;text-align:center;vertical-align:middle;margin-right:4px;border-radius:2px;">✓</span>`;
                const nameBlank  = `<span style="display:inline-block;border-bottom:1px solid #333;min-width:80px;height:1.2em;"></span>`;
                const priceBlank = `<span style="display:inline-block;border-bottom:1px solid #333;min-width:50px;height:1.2em;"></span>`;

                const exampleSel = [];
                if (showAnswers) {
                    let rem = budget;
                    for (const cat of matCats) {
                        for (const item of cat.items) {
                            if (item.cost <= rem) { exampleSel.push(item); rem -= item.cost; }
                        }
                    }
                }
                const exampleTotal = exampleSel.reduce((s, i) => s + i.cost, 0);

                const gap = compact ? '2px 8px' : '4px 12px';
                const mt  = compact ? '2px' : '4px';
                const rows = matCats.map(cat => {
                    const itemsHtml = `<div style="display:flex;flex-wrap:wrap;gap:${gap};margin-top:${mt};">
                        ${cat.items.map(item => {
                            const sel = showAnswers && exampleSel.includes(item);
                            const em  = this._itemEmoji[item.name] ? `<span class="ws-emoji-icon">${this._itemEmoji[item.name]}</span>` : '';
                            return `<span style="white-space:nowrap;">${sel ? ckDone : ckBox}${em}${item.name}（${item.cost}元）</span>`;
                        }).join('')}
                    </div>`;
                    const selItems = cat.items.filter(item => showAnswers && exampleSel.includes(item));
                    const catSpend = selItems.reduce((s, i) => s + i.cost, 0);
                    const col2 = (showAnswers && selItems.length > 0)
                        ? selItems.map(i => `<span style="color:red;font-weight:bold;">${i.name}</span>`).join('、')
                        : nameBlank;
                    const col3 = (showAnswers && selItems.length > 0)
                        ? `<span style="color:red;font-weight:bold;">${catSpend}</span>`
                        : priceBlank;
                    return `<tr>
                        <td style="${TD}font-weight:bold;color:#1a5276;">${cat.label}${itemsHtml}</td>
                        <td style="${TD}">${col2}</td>
                        <td style="${TD}text-align:right;">${col3} 元</td>
                    </tr>`;
                }).join('');

                const totalFill = showAnswers ? `<span style="color:red;font-weight:bold;">${exampleTotal}</span>` : priceBlank;
                const spendFill = showAnswers ? `<span style="color:red;font-weight:bold;">${exampleTotal}</span>` : `<span style="display:inline-block;border-bottom:1.5px solid #333;min-width:60px;height:1.2em;"></span>`;
                const remFill   = showAnswers ? `<span style="color:red;font-weight:bold;">${budget - exampleTotal}</span>` : `<span style="display:inline-block;border-bottom:1.5px solid #333;min-width:60px;height:1.2em;"></span>`;
                const tFS  = compact ? '9.5pt' : '11pt';
                const fFS  = compact ? '10.5pt' : '12pt';
                const mTop = compact ? '6px' : '10px';

                const tableHtml = `<table style="width:100%;border-collapse:collapse;font-size:${tFS};margin:4px 0;">
                    <thead><tr style="background:#4a90d9;color:white;">
                        <th style="${TH}text-align:left;width:55%;">商品項目</th>
                        <th style="${TH}text-align:left;width:27%;">購買商品</th>
                        <th style="${TH}text-align:right;width:18%;">金額</th>
                    </tr></thead>
                    <tbody>
                        ${rows}
                        <tr style="background:#f9fafb;">
                            <td colspan="2" style="${TD}border-top:2px solid #9ca3af;font-weight:bold;">總共花費</td>
                            <td style="${TD}border-top:2px solid #9ca3af;text-align:right;font-weight:bold;">${totalFill} 元</td>
                        </tr>
                    </tbody>
                </table>
                <div style="margin-top:${mTop};font-size:${fFS};line-height:2.4;text-align:right;padding-right:7px;">
                    預算 <strong>${budget}</strong> 元 &nbsp;－&nbsp; 花費 ${spendFill} 元 &nbsp;＝&nbsp; 剩餘 ${remFill} 元
                </div>`;

                return {
                    _key: `b5_budget_${diff}_${theme}`,
                    prompt: `${theme}，你的預算是 <strong>${budget}</strong> 元，請在下方勾選想買的商品，並將商品名稱和價格填入右側欄位（注意不能超過預算！）：`,
                    visual: tableHtml,
                    answerArea: '',
                    answerDisplay: ''
                };
            };

            const available = shuffle(
                this._budgetVariants[diff].filter(v => !usedLabels.has(`b5_budget_${diff}_${v.theme}`))
            );
            const needed = budgetLayout === 'double' ? 2 : 1;
            const chosen = available.length >= needed
                ? available.slice(0, needed)
                : shuffle(this._budgetVariants[diff]).slice(0, needed);

            return chosen.map(buildQuestion);
        }

        return chosen.map(scenario => {
            const total     = scenario.items.reduce((s, it) => s + it.cost, 0);
            const paid      = [100, 200, 500, 1000, 2000].find(p => p > total) || 2000;
            const change    = paid - total;
            const getIcon   = name => { const e = this._itemEmoji[name]; return e ? `<span class="ws-emoji-icon">${e}</span>` : ''; };
            const itemsText = scenario.items
                .map(it => `${getIcon(it.name)}${it.name} <strong>${it.cost}</strong> 元`)
                .join('、');
            const basePromptFact = `辦<span class="ws-emoji-icon">${scenario.icon}</span><strong>${scenario.event}</strong>，買 ${itemsText}`;
            const basePrompt = `${basePromptFact}，總共要多少錢？`;

            // ── 價格計算：數字填空 ─────────────────────────────────────
            if (questionType === 'price-fill') {
                const ans = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${total}</span>`
                    : blankLine();
                return {
                    _key: `b5_${scenario.label}`,
                    prompt: basePrompt,
                    visual: '',
                    answerArea: `答：${ans} 元`,
                    answerDisplay: ''
                };

            // ── 價格計算：圖示填空 ─────────────────────────────────────
            } else if (questionType === 'price-img-fill') {
                const itemsWithCoins = scenario.items.map(it => {
                    const coinRow = this._coinsDisplay(it.cost, renderCoin);
                    return `${getIcon(it.name)}${it.name} <span style="vertical-align:middle;">${coinRow}</span>`;
                }).join('&emsp;');
                const answerArea = showAnswers
                    ? `共需 <span style="color:red;font-weight:bold;">${total}</span> 元`
                    : `共需 <span style="vertical-align:middle;">${this._coinsDisplay(total, renderCoin)}</span>${blankLine()} 元`;
                return {
                    _key: `b5_${scenario.label}`,
                    prompt: `辦<span class="ws-emoji-icon">${scenario.icon}</span><strong>${scenario.event}</strong>，買：`,
                    visual: `<div style="margin:4px 0 6px;line-height:2.2;">${itemsWithCoins}</div>`,
                    answerArea,
                    answerDisplay: ''
                };

            // ── 價格計算：填空與選擇 ───────────────────────────────────
            } else if (questionType === 'price-fill-select') {
                const opts      = this._coinOptions(total);
                const fillArea  = showAnswers
                    ? `共需帶：<span style="color:red;font-weight:bold;">${total}</span> 元`
                    : `共需帶：${blankLine()} 元`;
                const choicesHtml = opts.map((opt, i) => {
                    const label     = String.fromCharCode(9312 + i);
                    const isCorrect = opt.total === total;
                    const style     = showAnswers && isCorrect ? 'border-color:red;border-width:3px;' : '';
                    const check     = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const ansTag    = (showAnswers && isCorrect)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${total} 元</span>` : '';
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold;min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>${ansTag}
                    </div>`;
                }).join('');
                return {
                    _key: `b5_${scenario.label}`,
                    prompt: basePromptFact,
                    visual: `<div style="margin-bottom:6px;">${fillArea}</div>
                             <div style="margin-bottom:4px;">請選出正確的錢幣組合：</div>
                             <div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            // ── 價格計算：圖示選擇 ─────────────────────────────────────
            } else if (questionType === 'price-coin-select') {
                const opts        = this._coinOptions(total);
                const choicesHtml = opts.map((opt, i) => {
                    const label     = String.fromCharCode(9312 + i);
                    const isCorrect = opt.total === total;
                    const style     = showAnswers && isCorrect ? 'border-color:red;border-width:3px;' : '';
                    const check     = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold;min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>
                    </div>`;
                }).join('');
                return {
                    _key: `b5_${scenario.label}`,
                    prompt: `${basePromptFact}，共需 <strong>${total}</strong> 元，請選出正確的錢幣組合：`,
                    visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            // ── 價格計算：提示選擇 ─────────────────────────────────────
            } else if (questionType === 'price-hint-select') {
                const opts        = this._coinOptions(total);
                const choicesHtml = opts.map((opt, i) => {
                    const label     = String.fromCharCode(9312 + i);
                    const isCorrect = opt.total === total;
                    const style     = showAnswers && isCorrect ? 'border-color:red;border-width:3px;' : '';
                    const check     = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const ansTag    = (showAnswers && isCorrect)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${total} 元</span>` : '';
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold;min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>
                        <span style="color:#ccc;font-weight:bold;margin-left:6px;">${opt.total} 元</span>${ansTag}
                    </div>`;
                }).join('');
                return {
                    _key: `b5_${scenario.label}`,
                    prompt: `${basePromptFact}，共需 <strong>${total}</strong> 元，請選出正確的錢幣組合：`,
                    visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            // ── 價格計算：提示完成 ─────────────────────────────────────
            } else if (questionType === 'price-hint-complete') {
                const combo = this._findCombo(total);
                if (!combo) return null;
                const partsHtml = combo.map(c => {
                    const icons  = Array(Math.min(c.count, 5)).fill(renderCoin(c.denom)).join('');
                    const ansNum = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${c.count}</span>` : '___';
                    const unit   = c.denom >= 100 ? '張' : '個';
                    return `${ansNum}${unit} ${icons}`;
                }).join('&nbsp;&nbsp;');
                const totalHint = `<span style="margin-left:8px;">共 <span style="color:#ccc;font-weight:bold;">${total}</span> 元</span>`;
                return {
                    _key: `b5_${scenario.label}`,
                    prompt: basePromptFact,
                    visual: `<div style="margin:4px 0;">需帶：${partsHtml}${totalHint}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            // ── 找零計算：數字填空 ─────────────────────────────────────
            } else if (questionType === 'fill') {
                return {
                    _key: `b5_${scenario.label}`,
                    prompt: `${basePromptFact}，付 ${paid} 元，應找回多少錢？`,
                    visual: '',
                    answerArea: showAnswers
                        ? `共需 <span style="color:red;font-weight:bold;">${total}</span> 元　付 ${paid} 元，找回 <span style="color:red;font-weight:bold;">${change}</span> 元`
                        : `共需 ${blankLine()} 元　付 ${paid} 元，找回 ${blankLine()} 元`,
                    answerDisplay: ''
                };

            // ── 找零計算：圖示填空 ─────────────────────────────────────
            } else if (questionType === 'img-fill') {
                const itemsWithCoins = scenario.items.map(it => {
                    const coinRow = this._coinsDisplay(it.cost, renderCoin);
                    return `${getIcon(it.name)}${it.name} <span style="vertical-align:middle;">${coinRow}</span>`;
                }).join('&emsp;');
                return {
                    _key: `b5_${scenario.label}`,
                    prompt: `辦<span class="ws-emoji-icon">${scenario.icon}</span><strong>${scenario.event}</strong>，買：`,
                    visual: `<div style="margin:4px 0 6px;line-height:2.2;">${itemsWithCoins}</div>`,
                    answerArea: showAnswers
                        ? `共需 <span style="color:red;font-weight:bold;">${total}</span> 元　付 ${paid} 元，找回 <span style="color:red;font-weight:bold;">${change}</span> 元`
                        : `共需 ${this._coinsDisplay(total, renderCoin)}${blankLine()} 元　付 ${paid} 元，找回 ${this._coinsDisplay(change, renderCoin)}${blankLine()} 元`,
                    answerDisplay: ''
                };

            // ── 找零計算：填空與選擇 ───────────────────────────────────
            } else if (questionType === 'fill-select') {
                const fillArea  = showAnswers
                    ? `共需 <span style="color:red;font-weight:bold;">${total}</span> 元　付 ${paid} 元，找回 <span style="color:red;font-weight:bold;">${change}</span> 元`
                    : `共需 ${blankLine()} 元　付 ${paid} 元，找回 ${blankLine()} 元`;
                const opts = this._coinOptions(change);
                const choicesHtml = opts.map((opt, i) => {
                    const label     = String.fromCharCode(9312 + i);
                    const isCorrect = opt.total === change;
                    const style     = showAnswers && isCorrect ? 'border-color:red;border-width:3px;' : '';
                    const check     = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const ansTag    = (showAnswers && isCorrect)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${change} 元</span>` : '';
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold;min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>${ansTag}
                    </div>`;
                }).join('');
                return {
                    _key: `b5_${scenario.label}`,
                    prompt: `${basePromptFact}，付 ${paid} 元，應找回多少錢？`,
                    visual: `<div style="margin-bottom:6px;">${fillArea}</div>
                             <div style="margin-bottom:4px;">請選出正確的找零組合：</div>
                             <div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            // ── 找零計算：圖示選擇 ─────────────────────────────────────
            } else if (questionType === 'coin-select') {
                const opts        = this._coinOptions(change);
                const choicesHtml = opts.map((opt, i) => {
                    const label     = String.fromCharCode(9312 + i);
                    const isCorrect = opt.total === change;
                    const style     = showAnswers && isCorrect ? 'border-color:red;border-width:3px;' : '';
                    const check     = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold;min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>
                    </div>`;
                }).join('');
                return {
                    _key: `b5_${scenario.label}`,
                    prompt: `${basePromptFact}，共需 <strong>${total}</strong> 元，付 ${paid} 元，應找回 <strong>${change}</strong> 元，請選出正確的找零組合：`,
                    visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            // ── 找零計算：提示選擇 ─────────────────────────────────────
            } else if (questionType === 'hint-select') {
                const opts        = this._coinOptions(change);
                const choicesHtml = opts.map((opt, i) => {
                    const label     = String.fromCharCode(9312 + i);
                    const isCorrect = opt.total === change;
                    const style     = showAnswers && isCorrect ? 'border-color:red;border-width:3px;' : '';
                    const check     = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const ansTag    = (showAnswers && isCorrect)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${change} 元</span>` : '';
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold;min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>
                        <span style="color:#ccc;font-weight:bold;margin-left:6px;">${opt.total} 元</span>${ansTag}
                    </div>`;
                }).join('');
                return {
                    _key: `b5_${scenario.label}`,
                    prompt: `${basePromptFact}，共需 <strong>${total}</strong> 元，付 ${paid} 元，應找回 <strong>${change}</strong> 元，請選出正確的找零組合：`,
                    visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            // ── 找零計算：提示完成 ─────────────────────────────────────
            } else {
                const combo = this._findCombo(change);
                if (!combo) return null;
                const partsHtml = combo.map(c => {
                    const icons  = Array(Math.min(c.count, 5)).fill(renderCoin(c.denom)).join('');
                    const ansNum = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${c.count}</span>` : '___';
                    const unit   = c.denom >= 100 ? '張' : '個';
                    return `${ansNum}${unit} ${icons}`;
                }).join('&nbsp;&nbsp;');
                const changeHint = `<span style="margin-left:8px;">找回 <span style="color:#ccc;font-weight:bold;">${change}</span> 元</span>`;
                return {
                    _key: `b5_${scenario.label}`,
                    prompt: `${basePromptFact}，共需 ${total} 元，付 ${paid} 元，應找回多少元？`,
                    visual: `<div style="margin:4px 0;">找回：${partsHtml}${changeHint}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };
            }
        }).filter(Boolean);
    },

    _costRanges: {
        '彩色氣球': [25, 40], '生日蠟燭': [15, 25], '彩帶裝飾': [30, 50], '派對帽':   [40, 60],
        '噴彩拉炮': [25, 45], '糖果禮包': [45, 65], '餅乾零食': [35, 55], '氣泡水':   [20, 40],
        '三明治':   [40, 60], '水果盒':   [50, 70], '小禮物':   [65, 95], '果汁飲料': [50, 70],
        '拍立得相機':[130,170],'南瓜燈':  [55, 80], '糖果袋':   [30, 50], '女巫帽':   [65, 90],
        '鬼臉面具': [40, 60], '骷髏貼紙': [20, 30], '巫師魔杖': [45, 65], '萬聖裝扮': [125,170],
        '蜘蛛網裝飾':[20, 40],'恐怖假髮': [65, 95], '萬聖糖果': [25, 45], '野餐籃':  [100,140],
        '一次性餐具':[20, 30],'紙巾':     [15, 25], '保冷袋':   [45, 65], '涼帽':     [55, 80],
        '防曬乳':   [75,110],
    },

    _budgetVariants: {
        easy: [
            {
                theme: '🎂 生日派對', budget: 200,
                categories: [
                    { label: '🎈 派對裝飾', items: [
                        { name: '彩色氣球' }, { name: '生日蠟燭' }, { name: '彩帶裝飾' },
                        { name: '派對帽' },   { name: '噴彩拉炮' },
                    ]},
                    { label: '🍬 食物飲料', items: [
                        { name: '糖果禮包' }, { name: '餅乾零食' }, { name: '氣泡水' }, { name: '三明治' },
                    ]},
                    { label: '🎁 小物道具', items: [
                        { name: '小禮物' }, { name: '水果盒' },
                    ]},
                ]
            },
            {
                theme: '🎃 萬聖節派對', budget: 200,
                categories: [
                    { label: '🎭 裝扮道具', items: [
                        { name: '女巫帽' }, { name: '鬼臉面具' }, { name: '骷髏貼紙' }, { name: '巫師魔杖' },
                    ]},
                    { label: '🍬 糖果點心', items: [
                        { name: '糖果袋' }, { name: '萬聖糖果' }, { name: '餅乾零食' },
                    ]},
                    { label: '🕸️ 場景布置', items: [
                        { name: '南瓜燈' }, { name: '蜘蛛網裝飾' },
                    ]},
                ]
            },
            {
                theme: '🌸 春日野餐', budget: 200,
                categories: [
                    { label: '🥪 野餐食物', items: [
                        { name: '三明治' }, { name: '餅乾零食' }, { name: '水果盒' }, { name: '氣泡水' },
                    ]},
                    { label: '🧺 野餐用品', items: [
                        { name: '紙巾' }, { name: '保冷袋' },
                    ]},
                    { label: '🌞 防護用品', items: [
                        { name: '涼帽' },
                    ]},
                ]
            },
            {
                theme: '🎉 特別節日', budget: 200,
                categories: [
                    { label: '🎭 裝扮道具', items: [
                        { name: '女巫帽' }, { name: '鬼臉面具' }, { name: '噴彩拉炮' },
                    ]},
                    { label: '🍭 甜點飲料', items: [
                        { name: '糖果禮包' }, { name: '氣泡水' }, { name: '水果盒' },
                    ]},
                    { label: '🌸 場景布置', items: [
                        { name: '彩帶裝飾' }, { name: '生日蠟燭' }, { name: '南瓜燈' },
                    ]},
                ]
            },
        ],
        normal: [
            {
                theme: '🎂 生日派對', budget: 350,
                categories: [
                    { label: '🎈 派對裝飾', items: [
                        { name: '彩色氣球' }, { name: '生日蠟燭' }, { name: '彩帶裝飾' },
                        { name: '派對帽' },   { name: '噴彩拉炮' },
                    ]},
                    { label: '🍰 食物飲料', items: [
                        { name: '糖果禮包' }, { name: '餅乾零食' }, { name: '氣泡水' },
                        { name: '三明治' },   { name: '水果盒' },
                    ]},
                    { label: '🎁 特別禮物', items: [
                        { name: '小禮物' }, { name: '果汁飲料' }, { name: '南瓜燈' },
                    ]},
                ]
            },
            {
                theme: '🎃 萬聖節派對', budget: 350,
                categories: [
                    { label: '🎭 萬聖裝扮', items: [
                        { name: '女巫帽' }, { name: '鬼臉面具' }, { name: '骷髏貼紙' }, { name: '巫師魔杖' },
                    ]},
                    { label: '🍬 糖果點心', items: [
                        { name: '糖果袋' }, { name: '萬聖糖果' }, { name: '餅乾零食' }, { name: '糖果禮包' },
                    ]},
                    { label: '🕸️ 場景布置', items: [
                        { name: '南瓜燈' }, { name: '蜘蛛網裝飾' }, { name: '恐怖假髮' },
                    ]},
                ]
            },
            {
                theme: '🌸 春日野餐', budget: 350,
                categories: [
                    { label: '🥪 野餐食物', items: [
                        { name: '三明治' }, { name: '餅乾零食' }, { name: '水果盒' },
                        { name: '氣泡水' }, { name: '保冷袋' },
                    ]},
                    { label: '🧺 野餐用品', items: [
                        { name: '野餐籃' }, { name: '一次性餐具' }, { name: '紙巾' },
                    ]},
                    { label: '🌞 防護用品', items: [
                        { name: '涼帽' }, { name: '防曬乳' },
                    ]},
                ]
            },
            {
                theme: '🎉 特別節日', budget: 320,
                categories: [
                    { label: '🎭 裝扮道具', items: [
                        { name: '女巫帽' }, { name: '鬼臉面具' }, { name: '巫師魔杖' },
                    ]},
                    { label: '🍭 甜點飲料', items: [
                        { name: '糖果禮包' }, { name: '果汁飲料' }, { name: '水果盒' },
                    ]},
                    { label: '🕸️ 場景裝飾', items: [
                        { name: '彩帶裝飾' }, { name: '南瓜燈' }, { name: '蜘蛛網裝飾' },
                    ]},
                ]
            },
        ],
        hard: [
            {
                theme: '🎂 生日派對', budget: 500,
                categories: [
                    { label: '🎈 派對裝飾', items: [
                        { name: '彩色氣球' }, { name: '生日蠟燭' }, { name: '彩帶裝飾' },
                        { name: '派對帽' },   { name: '噴彩拉炮' },
                    ]},
                    { label: '🍰 食物飲料', items: [
                        { name: '糖果禮包' }, { name: '餅乾零食' }, { name: '氣泡水' },
                        { name: '三明治' },   { name: '水果盒' },
                    ]},
                    { label: '🎁 特別禮物', items: [
                        { name: '小禮物' }, { name: '拍立得相機' }, { name: '果汁飲料' },
                    ]},
                ]
            },
            {
                theme: '🎃 萬聖節派對', budget: 450,
                categories: [
                    { label: '🎭 萬聖裝扮', items: [
                        { name: '女巫帽' }, { name: '鬼臉面具' }, { name: '骷髏貼紙' },
                        { name: '巫師魔杖' },{ name: '恐怖假髮' }, { name: '萬聖裝扮' },
                    ]},
                    { label: '🍬 糖果點心', items: [
                        { name: '糖果袋' }, { name: '萬聖糖果' }, { name: '糖果禮包' },
                    ]},
                    { label: '🕸️ 場景布置', items: [
                        { name: '南瓜燈' }, { name: '蜘蛛網裝飾' },
                    ]},
                ]
            },
            {
                theme: '🌸 春日野餐', budget: 500,
                categories: [
                    { label: '🥪 野餐食物', items: [
                        { name: '三明治' }, { name: '餅乾零食' }, { name: '水果盒' },
                        { name: '氣泡水' }, { name: '保冷袋' },
                    ]},
                    { label: '🧺 野餐用品', items: [
                        { name: '野餐籃' }, { name: '一次性餐具' }, { name: '紙巾' },
                    ]},
                    { label: '🌞 防護用品', items: [
                        { name: '涼帽' }, { name: '防曬乳' },
                    ]},
                ]
            },
            {
                theme: '🎉 特別節日', budget: 480,
                categories: [
                    { label: '🎭 表演服裝', items: [
                        { name: '萬聖裝扮' }, { name: '女巫帽' }, { name: '恐怖假髮' }, { name: '巫師魔杖' },
                    ]},
                    { label: '🍭 派對食物', items: [
                        { name: '糖果禮包' }, { name: '果汁飲料' }, { name: '水果盒' }, { name: '餅乾零食' },
                    ]},
                    { label: '🌸 場景裝飾', items: [
                        { name: '彩帶裝飾' }, { name: '南瓜燈' },
                    ]},
                ]
            },
        ],
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
            const offset   = randomInt(1, 3) * 10;
            const wrongAmt = Math.random() < 0.5
                ? correctAmount + offset
                : Math.max(10, correctAmount - offset);
            if (options.some(o => o.total === wrongAmt)) continue;
            options.push({ coins: walletToCoins(wrongAmt), total: wrongAmt });
        }
        while (options.length < 3) {
            options.push({ coins: walletToCoins(correctAmount + options.length * 10), total: correctAmount + options.length * 10 });
        }
        return shuffle(options);
    },
});
