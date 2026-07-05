// B6 菜市場買菜 作業單
WorksheetRegistry.register('b6', {
    name: 'B6 菜市場買菜',
    icon: '🛒',
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
                id: 'b6-budget-layout-btn',
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

    // 簡單：2 項，便宜蔬菜水果為主（各項 ≤ 50 元）
    // 普通：3 項，含中等食材（雞蛋、水果）
    // 困難：3–4 項，含較貴食材（哈密瓜、白米、葡萄）
    _scenarios: {
        easy: [
            { icon:'🥬', label:'買蔬菜',     location:'菜市場',    items:[{ name:'高麗菜', unit:'顆', cost:30 }, { name:'青蔥',   unit:'把', cost:20 }] },
            { icon:'🍅', label:'買番茄蔥',   location:'早市',      items:[{ name:'番茄',   unit:'斤', cost:45 }, { name:'青蔥',   unit:'把', cost:20 }] },
            { icon:'🍎', label:'買蘋果蕉',   location:'水果攤',    items:[{ name:'蘋果',   unit:'斤', cost:50 }, { name:'香蕉',   unit:'把', cost:25 }] },
            { icon:'🧂', label:'買雜貨',     location:'超市',      items:[{ name:'食鹽',   unit:'包', cost:20 }, { name:'豆腐',   unit:'塊', cost:25 }] },
            { icon:'🥬', label:'買根莖菜',   location:'傳統市場',  items:[{ name:'地瓜',   unit:'斤', cost:35 }, { name:'菠菜',   unit:'把', cost:25 }] },
            { icon:'🍌', label:'買水果',     location:'水果攤',    items:[{ name:'香蕉',   unit:'把', cost:25 }, { name:'柳橙',   unit:'斤', cost:40 }] },
            { icon:'🍜', label:'買麵食',     location:'超市',      items:[{ name:'麵條',   unit:'包', cost:35 }, { name:'食鹽',   unit:'包', cost:20 }] },
            { icon:'🥕', label:'買根菜',     location:'傳統市場',  items:[{ name:'紅蘿蔔', unit:'斤', cost:40 }, { name:'地瓜',   unit:'斤', cost:35 }] },
            { icon:'🥦', label:'買新鮮菜',   location:'早市',      items:[{ name:'高麗菜', unit:'顆', cost:30 }, { name:'番茄',   unit:'斤', cost:45 }] },
            { icon:'🍊', label:'買柑橘',     location:'水果攤',    items:[{ name:'柳橙',   unit:'斤', cost:40 }, { name:'蘋果',   unit:'斤', cost:50 }] },
            { icon:'🏪', label:'超市蔬菜',   location:'超市',      items:[{ name:'洋蔥',   unit:'斤', cost:35 }, { name:'紅蘿蔔', unit:'斤', cost:40 }] },
            { icon:'🌿', label:'傳統市場菜', location:'傳統市場',  items:[{ name:'菠菜',   unit:'把', cost:25 }, { name:'番茄',   unit:'斤', cost:45 }] },
            { icon:'🌽', label:'買玉米地瓜', location:'早市',      items:[{ name:'玉米',   unit:'條', cost:40 }, { name:'地瓜',   unit:'斤', cost:35 }] },
            { icon:'🧅', label:'買洋蔥青蔥', location:'傳統市場',  items:[{ name:'洋蔥',   unit:'斤', cost:35 }, { name:'青蔥',   unit:'把', cost:20 }] },
            { icon:'🍊', label:'水果攤柑橘', location:'水果攤',    items:[{ name:'柳橙',   unit:'斤', cost:40 }, { name:'香蕉',   unit:'把', cost:25 }] },
            { icon:'🥬', label:'早市嫩菜',   location:'早市',      items:[{ name:'菠菜',   unit:'把', cost:25 }, { name:'豆腐',   unit:'塊', cost:25 }] },
            { icon:'🌾', label:'超市米麵',   location:'超市',      items:[{ name:'麵條',   unit:'包', cost:35 }, { name:'食鹽',   unit:'包', cost:20 }] },
            { icon:'🌽', label:'市場玉米菠菜',location:'傳統市場', items:[{ name:'玉米',   unit:'條', cost:40 }, { name:'菠菜',   unit:'把', cost:25 }] },
        ],
        normal: [
            { icon:'🛒', label:'今日買菜',   location:'菜市場',    items:[{ name:'高麗菜', unit:'顆', cost:30 }, { name:'番茄',   unit:'斤', cost:45 }, { name:'豆腐',   unit:'塊', cost:25 }] },
            { icon:'🛒', label:'蔬果採購',   location:'傳統市場',  items:[{ name:'蘋果',   unit:'斤', cost:50 }, { name:'菠菜',   unit:'把', cost:25 }, { name:'雞蛋',   unit:'盒', cost:65 }] },
            { icon:'🛒', label:'週末採買',   location:'超市',      items:[{ name:'地瓜',   unit:'斤', cost:35 }, { name:'香蕉',   unit:'把', cost:25 }, { name:'麵條',   unit:'包', cost:35 }] },
            { icon:'🛒', label:'廚房補貨',   location:'超市',      items:[{ name:'醬油',   unit:'瓶', cost:45 }, { name:'豆腐',   unit:'塊', cost:25 }, { name:'青蔥',   unit:'把', cost:20 }] },
            { icon:'🛒', label:'蔬菜水果',   location:'早市',      items:[{ name:'紅蘿蔔', unit:'斤', cost:40 }, { name:'柳橙',   unit:'斤', cost:40 }, { name:'食鹽',   unit:'包', cost:20 }] },
            { icon:'🛒', label:'晚餐食材',   location:'菜市場',    items:[{ name:'番茄',   unit:'斤', cost:45 }, { name:'麵條',   unit:'包', cost:35 }, { name:'雞蛋',   unit:'盒', cost:65 }] },
            { icon:'🛒', label:'鮮果雜貨',   location:'水果攤',    items:[{ name:'葡萄',   unit:'串', cost:80 }, { name:'高麗菜', unit:'顆', cost:30 }, { name:'豆腐',   unit:'塊', cost:25 }] },
            { icon:'🛒', label:'平日買菜',   location:'早市',      items:[{ name:'菠菜',   unit:'把', cost:25 }, { name:'蘋果',   unit:'斤', cost:50 }, { name:'醬油',   unit:'瓶', cost:45 }] },
            { icon:'🛒', label:'蔬菜雜糧',   location:'傳統市場',  items:[{ name:'地瓜',   unit:'斤', cost:35 }, { name:'紅蘿蔔', unit:'斤', cost:40 }, { name:'麵條',   unit:'包', cost:35 }] },
            { icon:'🛒', label:'水果零食',   location:'水果攤',    items:[{ name:'芒果',   unit:'斤', cost:60 }, { name:'香蕉',   unit:'把', cost:25 }, { name:'食鹽',   unit:'包', cost:20 }] },
            { icon:'🏪', label:'超市採購',   location:'超市',      items:[{ name:'洋蔥',   unit:'斤', cost:35 }, { name:'雞蛋',   unit:'盒', cost:65 }, { name:'麵條',   unit:'包', cost:35 }] },
            { icon:'🌿', label:'早市三樣',   location:'早市',      items:[{ name:'番茄',   unit:'斤', cost:45 }, { name:'高麗菜', unit:'顆', cost:30 }, { name:'豆腐',   unit:'塊', cost:25 }] },
            { icon:'🌽', label:'傳統市場蔬菜',location:'傳統市場', items:[{ name:'玉米',   unit:'條', cost:40 }, { name:'紅蘿蔔', unit:'斤', cost:40 }, { name:'菠菜',   unit:'把', cost:25 }] },
            { icon:'🍊', label:'水果攤採買', location:'水果攤',    items:[{ name:'蘋果',   unit:'斤', cost:50 }, { name:'葡萄',   unit:'串', cost:80 }, { name:'香蕉',   unit:'把', cost:25 }] },
            { icon:'🛒', label:'週間補充',   location:'超市',      items:[{ name:'洋蔥',   unit:'斤', cost:35 }, { name:'醬油',   unit:'瓶', cost:45 }, { name:'雞蛋',   unit:'盒', cost:65 }] },
            { icon:'🌿', label:'菜市場大買', location:'菜市場',    items:[{ name:'芒果',   unit:'斤', cost:60 }, { name:'番茄',   unit:'斤', cost:45 }, { name:'豆腐',   unit:'塊', cost:25 }] },
        ],
        hard: [
            { icon:'🛒', label:'週間大買',   location:'菜市場',    items:[{ name:'白米',   unit:'包', cost:90 }, { name:'雞蛋',   unit:'盒', cost:65 }, { name:'高麗菜', unit:'顆', cost:30 }, { name:'番茄',   unit:'斤', cost:45 }] },
            { icon:'🛒', label:'豐盛採買',   location:'傳統市場',  items:[{ name:'哈密瓜', unit:'顆', cost:120}, { name:'雞蛋',   unit:'盒', cost:65 }, { name:'青蔥',   unit:'把', cost:20 }] },
            { icon:'🛒', label:'週一補貨',   location:'超市',      items:[{ name:'白米',   unit:'包', cost:90 }, { name:'醬油',   unit:'瓶', cost:45 }, { name:'豆腐',   unit:'塊', cost:25 }, { name:'菠菜',   unit:'把', cost:25 }] },
            { icon:'🛒', label:'豐盛晚餐',   location:'菜市場',    items:[{ name:'葡萄',   unit:'串', cost:80 }, { name:'番茄',   unit:'斤', cost:45 }, { name:'麵條',   unit:'包', cost:35 }, { name:'雞蛋',   unit:'盒', cost:65 }] },
            { icon:'🛒', label:'滿載而歸',   location:'早市',      items:[{ name:'哈密瓜', unit:'顆', cost:120}, { name:'白米',   unit:'包', cost:90 }, { name:'紅蘿蔔', unit:'斤', cost:40 }] },
            { icon:'🛒', label:'精心備料',   location:'傳統市場',  items:[{ name:'芒果',   unit:'斤', cost:60 }, { name:'白米',   unit:'包', cost:90 }, { name:'雞蛋',   unit:'盒', cost:65 }, { name:'地瓜',   unit:'斤', cost:35 }] },
            { icon:'🛒', label:'假日大買',   location:'超市',      items:[{ name:'哈密瓜', unit:'顆', cost:120}, { name:'蘋果',   unit:'斤', cost:50 }, { name:'白米',   unit:'包', cost:90 }, { name:'青蔥',   unit:'把', cost:20 }] },
            { icon:'🛒', label:'一週食材',   location:'菜市場',    items:[{ name:'葡萄',   unit:'串', cost:80 }, { name:'白米',   unit:'包', cost:90 }, { name:'醬油',   unit:'瓶', cost:45 }, { name:'番茄',   unit:'斤', cost:45 }] },
            { icon:'🏪', label:'超市大採',   location:'超市',      items:[{ name:'哈密瓜', unit:'顆', cost:120}, { name:'雞蛋',   unit:'盒', cost:65 }, { name:'洋蔥',   unit:'斤', cost:35 }, { name:'麵條',   unit:'包', cost:35 }] },
            { icon:'🌿', label:'年節採買',   location:'傳統市場',  items:[{ name:'白米',   unit:'包', cost:90 }, { name:'葡萄',   unit:'串', cost:80 }, { name:'豆腐',   unit:'塊', cost:25 }, { name:'醬油',   unit:'瓶', cost:45 }] },
            { icon:'🛒', label:'早市大採',   location:'早市',      items:[{ name:'哈密瓜', unit:'顆', cost:120}, { name:'芒果',   unit:'斤', cost:60 }, { name:'番茄',   unit:'斤', cost:45 }, { name:'青蔥',   unit:'把', cost:20 }] },
            { icon:'🛒', label:'豐盛食材',   location:'菜市場',    items:[{ name:'葡萄',   unit:'串', cost:80 }, { name:'白米',   unit:'包', cost:90 }, { name:'雞蛋',   unit:'盒', cost:65 }, { name:'高麗菜', unit:'顆', cost:30 }] },
        ],
    },

    _itemEmoji: {
        '高麗菜': '🥬', '青蔥': '🌿', '番茄': '🍅', '蘋果': '🍎',
        '香蕉': '🍌', '食鹽': '🧂', '地瓜': '🍠', '菠菜': '🥬',
        '柳橙': '🍊', '麵條': '🍜', '紅蘿蔔': '🥕', '醬油': '🍶',
        '雞蛋': '🥚', '葡萄': '🍇', '芒果': '🥭', '白米': '🌾',
        '哈密瓜': '🍈',
        '洋蔥':   '🧅', '玉米': '🌽',
    },

    _coinsDisplay(amount, renderCoin) {
        const coins     = walletToCoins(amount);
        const displayed = coins.slice(0, 6);
        const more      = coins.length > 6 ? `<span style="font-size:11px;color:#888;">…</span>` : '';
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
        const pool   = shuffle(src.filter(s => !usedLabels.has(`b6_${s.label}`)));
        if (pool.length < 2) src.forEach(s => pool.push(s));
        const chosen = pool.slice(0, options.count || 10);
        chosen.forEach(s => usedLabels.add(`b6_${s.label}`));

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
                const location = variant.location;
                const budget   = variant.budget;
                const matCats  = variant.categories.map(cat => ({
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
                    _key: `b6_budget_${diff}_${location}`,
                    prompt: `去<strong>${location}</strong>買菜，你的預算是 <strong>${budget}</strong> 元，請在下方勾選想買的商品，並將商品名稱和價格填入右側欄位（注意不能超過預算！）：`,
                    visual: tableHtml,
                    answerArea: '',
                    answerDisplay: ''
                };
            };

            const available = shuffle(
                this._budgetVariants[diff].filter(v => !usedLabels.has(`b6_budget_${diff}_${v.location}`))
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
                .map(it => `${getIcon(it.name)}${it.name}（1${it.unit}）<strong>${it.cost}</strong> 元`)
                .join('、');
            const loc = scenario.location || '菜市場';
            const basePromptFact = `去<span class="ws-emoji-icon">${scenario.icon}</span><strong>${loc}</strong>，買 ${itemsText}`;
            const basePrompt = `${basePromptFact}，總共要多少錢？`;

            // ── 價格計算：數字填空 ─────────────────────────────────────
            if (questionType === 'price-fill') {
                const ans = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${total}</span>`
                    : blankLine();
                return {
                    _key: `b6_${scenario.label}`,
                    prompt: basePrompt,
                    visual: '',
                    answerArea: `答：${ans} 元`,
                    answerDisplay: ''
                };

            // ── 價格計算：圖示填空 ─────────────────────────────────────
            } else if (questionType === 'price-img-fill') {
                const itemsWithCoins = scenario.items.map(it => {
                    const coinRow = this._coinsDisplay(it.cost, renderCoin);
                    return `${getIcon(it.name)}${it.name}（1${it.unit}） <span style="vertical-align:middle;">${coinRow}</span>`;
                }).join('&emsp;');
                const answerArea = showAnswers
                    ? `共需 <span style="color:red;font-weight:bold;">${total}</span> 元`
                    : `共需 <span style="vertical-align:middle;">${this._coinsDisplay(total, renderCoin)}</span>${blankLine()} 元`;
                return {
                    _key: `b6_${scenario.label}`,
                    prompt: `去<span class="ws-emoji-icon">${scenario.icon}</span><strong>${loc}</strong>，買：`,
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
                    _key: `b6_${scenario.label}`,
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
                    _key: `b6_${scenario.label}`,
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
                    _key: `b6_${scenario.label}`,
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
                    _key: `b6_${scenario.label}`,
                    prompt: basePromptFact,
                    visual: `<div style="margin:4px 0;">需帶：${partsHtml}${totalHint}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };

            // ── 找零計算：數字填空 ─────────────────────────────────────
            } else if (questionType === 'fill') {
                return {
                    _key: `b6_${scenario.label}`,
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
                    return `${getIcon(it.name)}${it.name}（1${it.unit}） <span style="vertical-align:middle;">${coinRow}</span>`;
                }).join('&emsp;');
                return {
                    _key: `b6_${scenario.label}`,
                    prompt: `去<span class="ws-emoji-icon">${scenario.icon}</span><strong>${loc}</strong>，買：`,
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
                    _key: `b6_${scenario.label}`,
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
                    _key: `b6_${scenario.label}`,
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
                    _key: `b6_${scenario.label}`,
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
                    _key: `b6_${scenario.label}`,
                    prompt: `${basePromptFact}，共需 ${total} 元，付 ${paid} 元，應找回多少元？`,
                    visual: `<div style="margin:4px 0;">找回：${partsHtml}${changeHint}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                };
            }
        }).filter(Boolean);
    },

    _costRanges: {
        '高麗菜': [25, 40], '青蔥':   [15, 28], '番茄':   [35, 55], '菠菜':   [20, 35],
        '地瓜':   [28, 45], '洋蔥':   [28, 42], '紅蘿蔔': [30, 50], '玉米':   [30, 50],
        '蘋果':   [40, 65], '香蕉':   [20, 35], '柳橙':   [30, 50], '芒果':   [48, 75],
        '葡萄':   [60,100], '哈密瓜': [95,150], '雞蛋':   [55, 80], '麵條':   [28, 45],
        '豆腐':   [20, 35], '白米':   [75,110], '醬油':   [35, 55], '食鹽':   [15, 25],
    },

    _budgetVariants: {
        easy: [
            {
                location: '早市', budget: 100,
                categories: [
                    { label: '🥬 蔬菜類', items: [
                        { name: '高麗菜' }, { name: '青蔥' }, { name: '番茄' }, { name: '菠菜' },
                    ]},
                    { label: '🍎 水果類', items: [
                        { name: '蘋果' }, { name: '香蕉' }, { name: '柳橙' },
                    ]},
                    { label: '🛒 雜糧類', items: [
                        { name: '豆腐' }, { name: '食鹽' }, { name: '麵條' },
                    ]},
                ]
            },
            {
                location: '超市', budget: 100,
                categories: [
                    { label: '🥬 蔬菜區', items: [
                        { name: '洋蔥' }, { name: '地瓜' }, { name: '紅蘿蔔' }, { name: '菠菜' },
                    ]},
                    { label: '🍊 水果區', items: [
                        { name: '蘋果' }, { name: '柳橙' }, { name: '香蕉' },
                    ]},
                    { label: '🛒 食品區', items: [
                        { name: '豆腐' }, { name: '麵條' }, { name: '食鹽' },
                    ]},
                ]
            },
            {
                location: '傳統市場', budget: 100,
                categories: [
                    { label: '🥬 葉菜類', items: [
                        { name: '高麗菜' }, { name: '菠菜' }, { name: '番茄' },
                    ]},
                    { label: '🌽 根莖類', items: [
                        { name: '地瓜' }, { name: '紅蘿蔔' }, { name: '玉米' },
                    ]},
                    { label: '🍌 水果類', items: [
                        { name: '香蕉' }, { name: '柳橙' }, { name: '蘋果' },
                    ]},
                ]
            },
            {
                location: '夜市', budget: 100,
                categories: [
                    { label: '🥬 蔬菜攤', items: [
                        { name: '高麗菜' }, { name: '菠菜' }, { name: '番茄' },
                    ]},
                    { label: '🍊 水果攤', items: [
                        { name: '香蕉' }, { name: '柳橙' }, { name: '蘋果' },
                    ]},
                    { label: '🛒 雜貨攤', items: [
                        { name: '豆腐' }, { name: '食鹽' }, { name: '麵條' },
                    ]},
                ]
            },
        ],
        normal: [
            {
                location: '早市', budget: 200,
                categories: [
                    { label: '🥬 蔬菜類', items: [
                        { name: '高麗菜' }, { name: '青蔥' }, { name: '番茄' }, { name: '菠菜' }, { name: '地瓜' },
                    ]},
                    { label: '🍎 水果類', items: [
                        { name: '蘋果' }, { name: '香蕉' }, { name: '柳橙' }, { name: '芒果' }, { name: '葡萄' },
                    ]},
                    { label: '🛒 食材雜糧', items: [
                        { name: '雞蛋' }, { name: '麵條' }, { name: '豆腐' }, { name: '醬油' },
                    ]},
                ]
            },
            {
                location: '超市', budget: 200,
                categories: [
                    { label: '🥬 蔬菜區', items: [
                        { name: '洋蔥' }, { name: '紅蘿蔔' }, { name: '番茄' }, { name: '菠菜' },
                    ]},
                    { label: '🍊 水果區', items: [
                        { name: '蘋果' }, { name: '葡萄' }, { name: '芒果' },
                    ]},
                    { label: '🛒 食品區', items: [
                        { name: '雞蛋' }, { name: '白米' }, { name: '麵條' }, { name: '醬油' },
                    ]},
                ]
            },
            {
                location: '傳統市場', budget: 200,
                categories: [
                    { label: '🥬 葉菜類', items: [
                        { name: '高麗菜' }, { name: '菠菜' }, { name: '青蔥' }, { name: '番茄' },
                    ]},
                    { label: '🌽 根莖類', items: [
                        { name: '地瓜' }, { name: '紅蘿蔔' }, { name: '玉米' },
                    ]},
                    { label: '🛒 食材類', items: [
                        { name: '雞蛋' }, { name: '豆腐' }, { name: '醬油' },
                    ]},
                ]
            },
            {
                location: '夜市', budget: 180,
                categories: [
                    { label: '🥬 蔬菜攤', items: [
                        { name: '高麗菜' }, { name: '菠菜' }, { name: '番茄' }, { name: '青蔥' },
                    ]},
                    { label: '🍊 水果攤', items: [
                        { name: '蘋果' }, { name: '葡萄' }, { name: '芒果' },
                    ]},
                    { label: '🛒 食材攤', items: [
                        { name: '雞蛋' }, { name: '豆腐' }, { name: '醬油' },
                    ]},
                ]
            },
        ],
        hard: [
            {
                location: '早市', budget: 350,
                categories: [
                    { label: '🥬 蔬菜類', items: [
                        { name: '高麗菜' }, { name: '青蔥' }, { name: '番茄' }, { name: '菠菜' }, { name: '地瓜' },
                    ]},
                    { label: '🍎 水果類', items: [
                        { name: '蘋果' }, { name: '香蕉' }, { name: '葡萄' }, { name: '哈密瓜' },
                    ]},
                    { label: '🛒 食材雜糧', items: [
                        { name: '雞蛋' }, { name: '麵條' }, { name: '豆腐' }, { name: '白米' }, { name: '醬油' },
                    ]},
                ]
            },
            {
                location: '超市', budget: 350,
                categories: [
                    { label: '🥬 蔬菜區', items: [
                        { name: '洋蔥' }, { name: '紅蘿蔔' }, { name: '番茄' }, { name: '菠菜' }, { name: '地瓜' },
                    ]},
                    { label: '🍊 水果區', items: [
                        { name: '蘋果' }, { name: '芒果' }, { name: '葡萄' }, { name: '哈密瓜' },
                    ]},
                    { label: '🛒 食品區', items: [
                        { name: '雞蛋' }, { name: '白米' }, { name: '麵條' }, { name: '醬油' },
                    ]},
                ]
            },
            {
                location: '傳統市場', budget: 350,
                categories: [
                    { label: '🥬 蔬菜類', items: [
                        { name: '高麗菜' }, { name: '菠菜' }, { name: '番茄' }, { name: '青蔥' },
                    ]},
                    { label: '🍊 水果類', items: [
                        { name: '蘋果' }, { name: '哈密瓜' }, { name: '葡萄' },
                    ]},
                    { label: '🛒 年節食材', items: [
                        { name: '白米' }, { name: '雞蛋' }, { name: '醬油' }, { name: '豆腐' },
                    ]},
                ]
            },
            {
                location: '夜市', budget: 320,
                categories: [
                    { label: '🥬 蔬菜攤', items: [
                        { name: '高麗菜' }, { name: '菠菜' }, { name: '番茄' }, { name: '青蔥' }, { name: '地瓜' },
                    ]},
                    { label: '🍊 水果攤', items: [
                        { name: '蘋果' }, { name: '哈密瓜' }, { name: '葡萄' },
                    ]},
                    { label: '🛒 食材攤', items: [
                        { name: '白米' }, { name: '雞蛋' }, { name: '豆腐' }, { name: '醬油' },
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
