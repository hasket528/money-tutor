// A4 超市購物 作業單
WorksheetRegistry.register('a4', {
    name: 'A4 超市購物',
    icon: '🛒',
    defaultCount: 20,

    storeWalletMap: {
        convenience: 500, market: 500, breakfast: 500, stationery: 500,
        pxmart: 1000, mcdonalds: 500, bookstore: 1000, toystore: 1000, cosmetics: 1000,
        clothing: 5000, sports: 5000, electronics: 10000
    },
    storeInfo: {
        convenience: { name: '便利商店', emoji: '🏪' },
        market: { name: '菜市場', emoji: '🥬' },
        breakfast: { name: '早餐店', emoji: '🍳' },
        stationery: { name: '文具店', emoji: '✏️' },
        pxmart: { name: '超級市場', emoji: '🛒' },
        mcdonalds: { name: '美式速食店', emoji: '🍟' },
        bookstore: { name: '書局', emoji: '📚' },
        toystore: { name: '玩具店', emoji: '🧸' },
        cosmetics: { name: '美妝店', emoji: '💄' },
        clothing: { name: '服飾店', emoji: '👕' },
        sports: { name: '運動用品店', emoji: '⚽' },
        electronics: { name: '3C用品店', emoji: '📱' },
    },

    // 商品圖示：優先用 icon 圖片，fallback 用 emoji
    _productImg(item) {
        if (item.icon) {
            return `<img src="../images/a4/${item.icon}" class="drink-img" alt="${item.name || ''}" onerror="this.style.display='none'">`;
        }
        return `<span style="margin-right:2px;">${item.emoji || ''}</span>`;
    },

    dynamicName(opts) {
        if (opts.storeType === 'mixed') return 'A4 綜合商店購物';
        const info = this.storeInfo && this.storeInfo[opts.storeType];
        return info ? `A4 ${info.name}購物` : 'A4 超市購物';
    },

    subtitle(opts) {
        if ((opts?.questionType || 'price-fill') === 'budget-plan') {
            const diff = { easy: '簡單', normal: '普通', hard: '困難' };
            return `預算規劃　難度：${diff[opts?.difficulty || 'easy']}`;
        }
        return '購物計算與找零';
    },

    toolbarConfig: {
        fontButton: {
            label: '🏪 商店類型',
            type: 'dropdown',
            options: [
                { label: '🏪 便利商店', value: 'convenience' },
                { label: '🥬 菜市場', value: 'market' },
                { label: '🍳 早餐店', value: 'breakfast' },
                { label: '✏️ 文具店', value: 'stationery' },
                { label: '🛒 超級市場', value: 'pxmart' },
                { label: '🍟 美式速食店', value: 'mcdonalds' },
                { label: '📚 書局', value: 'bookstore' },
                { label: '🧸 玩具店', value: 'toystore' },
                { label: '💄 美妝店', value: 'cosmetics' },
                { label: '👕 服飾店', value: 'clothing' },
                { label: '⚽ 運動用品店', value: 'sports' },
                { label: '📱 3C用品店', value: 'electronics' },
                { label: '🎲 混合', value: 'mixed' },
            ],
            getCurrentValue: (params) => params.storeType || 'convenience',
            onChange: (val, app) => {
                app.params.storeType = val;
                const config = WorksheetRegistry.get('a4');
                app.params.walletAmount = val === 'mixed' ? 'auto' : String(config.storeWalletMap[val] || 500);
                app.generate();
            }
        },
        orientationButton: {
            label: '💰 錢包金額',
            type: 'dropdown',
            options: [
                { label: '100元', value: '100' },
                { label: '500元', value: '500' },
                { label: '1000元', value: '1000' },
                { label: '5000元', value: '5000' },
                { label: '10000元', value: '10000' },
                { label: '自動（依商店）', value: 'auto' },
            ],
            getCurrentValue: (params) => params.walletAmount || '500',
            onChange: (val, app) => { app.params.walletAmount = val; app.generate(); }
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
                { label: '預算規劃', value: 'budget-plan' },
            ],
            getCurrentValue: (params) => params.questionType || 'price-fill',
            onChange: (val, app) => { app.params.questionType = val; app.generate(); }
        },
        {
            id: 'a4-budget-difficulty-btn',
            label: '🎯 預算難度',
            type: 'dropdown',
            options: [
                { label: '簡單', value: 'easy' },
                { label: '普通', value: 'normal' },
                { label: '困難', value: 'hard' },
            ],
            visible: (params) => (params.questionType || 'price-fill') === 'budget-plan',
            getCurrentValue: (params) => params.difficulty || 'easy',
            onChange: (val, app) => { app.params.difficulty = val; app.generate(); }
        },
        {
            id: 'a4-budget-layout-btn',
            label: '📄 版面',
            type: 'cycle',
            options: [
                { label: '每頁 1 題', value: 'single' },
                { label: '每頁 2 題', value: 'double' },
            ],
            visible: (params) => (params.questionType || 'price-fill') === 'budget-plan',
            getCurrentValue: (params) => params.budgetLayout || 'single',
            onChange: (val, app) => { app.params.budgetLayout = val; app.generate(); }
        }]
    },

    // 商品資料（引用共用資料）
    // 原始商品資料已移至 js/a4-shared-products.js
    // 此處保留備份資料作為 fallback
    stores: (function() {
        // 優先使用共用資料
        if (typeof A4_SHARED_PRODUCTS !== 'undefined') {
            return A4_SHARED_PRODUCTS;
        }
        // Fallback：使用備份資料
        return {
        convenience: [
            { name: '蘋果', emoji: '🍎', price: 20 },
            { name: '餅乾', emoji: '🍪', price: 25 },
            { name: '飲料', emoji: '🥤', price: 20 },
            { name: '洋芋片', emoji: '🍟', price: 30 },
            { name: '麵包', emoji: '🍞', price: 25 },
            { name: '泡麵', emoji: '🍜', price: 35 },
            { name: '口香糖', emoji: '🍬', price: 39 },
            { name: '咖啡', emoji: '☕', price: 45 },
            { name: '巧克力', emoji: '🍫', price: 30 },
            { name: '衛生紙', emoji: '🧻', price: 10 },
        ],
        market: [
            { name: '香蕉', emoji: '🍌', price: 8 },
            { name: '胡蘿蔔', emoji: '🥕', price: 15 },
            { name: '蔥', emoji: '🧅', price: 25 },
            { name: '蛋', emoji: '🥚', price: 80 },
            { name: '魚', emoji: '🐟', price: 180 },
            { name: '蘋果', emoji: '🍎', price: 25 },
            { name: '白菜', emoji: '🥬', price: 35 },
            { name: '蕃茄', emoji: '🍅', price: 12 },
            { name: '豬肉', emoji: '🥩', price: 280 },
            { name: '雞肉', emoji: '🍗', price: 150 },
        ],
        breakfast: [
            { name: '三明治', emoji: '🥪', price: 65 },
            { name: '豆漿', emoji: '🥛', price: 25 },
            { name: '蛋餅', emoji: '🥞', price: 45 },
            { name: '吐司', emoji: '🍞', price: 55 },
            { name: '紅茶', emoji: '🍵', price: 35 },
            { name: '漢堡', emoji: '🍔', price: 85 },
            { name: '奶茶', emoji: '🧋', price: 55 },
            { name: '蘿蔔糕', emoji: '🍘', price: 45 },
            { name: '飯糰', emoji: '🍙', price: 55 },
            { name: '果汁', emoji: '🧃', price: 35 },
        ],
        stationery: [
            { name: '鉛筆', emoji: '✏️', price: 8 },
            { name: '橡皮擦', emoji: '🧹', price: 10 },
            { name: '原子筆', emoji: '🖊️', price: 15 },
            { name: '筆記本', emoji: '📓', price: 35 },
            { name: '彩色筆', emoji: '🖍️', price: 60 },
            { name: '剪刀', emoji: '✂️', price: 45 },
            { name: '膠水', emoji: '🧴', price: 25 },
            { name: '尺', emoji: '📏', price: 20 },
            { name: '資料夾', emoji: '📂', price: 30 },
            { name: '色紙', emoji: '🎨', price: 150 },
        ],
        pxmart: [
            { name: '洗衣精', emoji: '🧴', price: 150 },
            { name: '牙膏', emoji: '🪥', price: 80 },
            { name: '衛生紙', emoji: '🧻', price: 200 },
            { name: '沐浴乳', emoji: '🧼', price: 120 },
            { name: '洗髮精', emoji: '🧴', price: 180 },
            { name: '牛奶', emoji: '🥛', price: 65 },
            { name: '雞蛋', emoji: '🥚', price: 85 },
            { name: '吐司', emoji: '🍞', price: 45 },
            { name: '果汁', emoji: '🧃', price: 55 },
            { name: '餅乾', emoji: '🍪', price: 25 },
        ],
        mcdonalds: [
            { name: '大麥克', emoji: '🍔', price: 75 },
            { name: '麥香雞', emoji: '🍗', price: 55 },
            { name: '薯條', emoji: '🍟', price: 45 },
            { name: '雞塊', emoji: '🍗', price: 60 },
            { name: '可樂', emoji: '🥤', price: 35 },
            { name: '冰淇淋', emoji: '🍦', price: 25 },
            { name: '蘋果派', emoji: '🥧', price: 35 },
            { name: '玉米湯', emoji: '🥣', price: 40 },
            { name: '沙拉', emoji: '🥗', price: 85 },
            { name: '鬆餅', emoji: '🧇', price: 125 },
        ],
        bookstore: [
            { name: '繪本', emoji: '📖', price: 200 },
            { name: '漫畫', emoji: '📚', price: 120 },
            { name: '小說', emoji: '📕', price: 280 },
            { name: '雜誌', emoji: '📰', price: 150 },
            { name: '貼紙', emoji: '🏷️', price: 35 },
            { name: '明信片', emoji: '🖼️', price: 15 },
            { name: '日記本', emoji: '📔', price: 80 },
            { name: '著色本', emoji: '🎨', price: 60 },
            { name: '拼圖', emoji: '🧩', price: 250 },
            { name: '地球儀', emoji: '🌍', price: 400 },
        ],
        toystore: [
            { name: '積木', emoji: '🧱', price: 350 },
            { name: '娃娃', emoji: '🧸', price: 250 },
            { name: '小汽車', emoji: '🚗', price: 150 },
            { name: '拼圖', emoji: '🧩', price: 200 },
            { name: '黏土', emoji: '🎨', price: 80 },
            { name: '彈珠', emoji: '🔮', price: 50 },
            { name: '桌遊', emoji: '🎲', price: 400 },
            { name: '水槍', emoji: '🔫', price: 120 },
            { name: '風箏', emoji: '🪁', price: 180 },
            { name: '泡泡水', emoji: '🫧', price: 60 },
        ],
        cosmetics: [
            { name: '護手霜', emoji: '🧴', price: 150 },
            { name: '面膜', emoji: '🎭', price: 200 },
            { name: '口紅', emoji: '💄', price: 350 },
            { name: '洗面乳', emoji: '🧼', price: 180 },
            { name: '化妝水', emoji: '💧', price: 280 },
            { name: '防曬乳', emoji: '☀️', price: 320 },
            { name: '乳液', emoji: '🧴', price: 250 },
            { name: '髮圈', emoji: '💍', price: 80 },
            { name: '指甲油', emoji: '💅', price: 120 },
            { name: '香水', emoji: '🌸', price: 800 },
        ],
        clothing: [
            { name: 'T恤', emoji: '👕', price: 350 },
            { name: '短褲', emoji: '🩳', price: 450 },
            { name: '外套', emoji: '🧥', price: 1200 },
            { name: '帽子', emoji: '🧢', price: 300 },
            { name: '襪子', emoji: '🧦', price: 100 },
            { name: '洋裝', emoji: '👗', price: 800 },
            { name: '圍巾', emoji: '🧣', price: 250 },
            { name: '手套', emoji: '🧤', price: 200 },
            { name: '背包', emoji: '🎒', price: 650 },
            { name: '皮帶', emoji: '👔', price: 380 },
        ],
        sports: [
            { name: '籃球', emoji: '🏀', price: 500 },
            { name: '足球', emoji: '⚽', price: 450 },
            { name: '羽球拍', emoji: '🏸', price: 800 },
            { name: '跳繩', emoji: '🏋️', price: 150 },
            { name: '瑜珈墊', emoji: '🧘', price: 600 },
            { name: '水壺', emoji: '🥤', price: 350 },
            { name: '護膝', emoji: '🦵', price: 250 },
            { name: '運動毛巾', emoji: '🏊', price: 100 },
            { name: '泳鏡', emoji: '🥽', price: 300 },
            { name: '棒球手套', emoji: '🥊', price: 1500 },
        ],
        electronics: [
            { name: '耳機', emoji: '🎧', price: 800 },
            { name: '充電線', emoji: '🔌', price: 250 },
            { name: '行動電源', emoji: '🔋', price: 600 },
            { name: '手機殼', emoji: '📱', price: 350 },
            { name: '記憶卡', emoji: '💾', price: 400 },
            { name: '滑鼠', emoji: '🖱️', price: 500 },
            { name: '鍵盤', emoji: '⌨️', price: 1200 },
            { name: 'USB隨身碟', emoji: '💿', price: 300 },
            { name: '螢幕保護貼', emoji: '🖥️', price: 120 },
            { name: '藍牙喇叭', emoji: '🔊', price: 800 },
        ],
    };  // End of fallback stores
    })(),  // End of IIFE

    generate(options) {
        const { count = 5 } = options;
        const store = options.storeType || 'convenience';
        const isMixed = store === 'mixed';
        const storeKeys = Object.keys(this.stores);
        const questionType = options.questionType || 'price-fill';
        const diff = options.difficulty || 'easy';
        const coinStyle = options.coinStyle || 'real';
        const showAnswers = options._showAnswers || false;
        const renderCoin = (value) => {
            if (coinStyle === 'symbol') return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };
        const checkbox = '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin:0 4px;vertical-align:middle;"></span>';

        // ── 預算規劃（不走一般迴圈）────────────────────────────────
        if (questionType === 'budget-plan') {
            const budgetLayout = options.budgetLayout || 'single';
            const compact = budgetLayout === 'double';
            const needed = compact ? 2 : 1;
            const numItems = { easy: 6, normal: 8, hard: 10 }[diff] || 6;

            const buildQuestion = () => {
                const currentStore = isMixed
                    ? storeKeys[Math.floor(Math.random() * storeKeys.length)]
                    : store;
                const products = this.stores[currentStore] || this.stores.convenience;
                const storeInfoData = this.storeInfo[currentStore] || { name: '商店', emoji: '🏪' };

                const matItems = pickRandom(products, Math.min(numItems, products.length));
                const allTotal = matItems.reduce((s, it) => s + it.price, 0);
                const ratio = 0.5 + Math.random() * 0.15;
                const roundTo = allTotal > 500 ? 50 : 10;
                const rawBudget = Math.round(allTotal * ratio / roundTo) * roundTo;
                const minPrice = Math.min(...matItems.map(it => it.price));
                const budget = Math.max(rawBudget, minPrice + roundTo);

                const exampleSel = [];
                if (showAnswers) {
                    let rem = budget;
                    for (const item of matItems) {
                        if (item.price <= rem) { exampleSel.push(item); rem -= item.price; }
                    }
                }
                const exampleTotal = exampleSel.reduce((s, it) => s + it.price, 0);

                const TH = 'padding:4px 6px;border:1px solid #ccc;font-size:10.5pt;';
                const TD = 'padding:3px 6px;border:1px solid #ddd;font-size:10pt;vertical-align:middle;';
                const ckBox  = `<span style="display:inline-block;width:14px;height:14px;border:1.5px solid #333;vertical-align:middle;margin-right:4px;border-radius:2px;"></span>`;
                const ckDone = `<span style="display:inline-block;width:14px;height:14px;border:1.5px solid red;color:red;font-size:11px;line-height:14px;text-align:center;vertical-align:middle;margin-right:4px;border-radius:2px;">✓</span>`;
                const priceBlank = `<span style="display:inline-block;border-bottom:1px solid #333;min-width:50px;height:1.2em;"></span>`;
                const tFS  = compact ? '9.5pt' : '11pt';
                const fFS  = compact ? '10.5pt' : '12pt';
                const mTop = compact ? '6px' : '10px';

                const itemRows = matItems.map(item => {
                    const checked = showAnswers && exampleSel.some(s => s.name === item.name);
                    const cb = checked ? ckDone : ckBox;
                    const priceCell = (showAnswers && checked)
                        ? `<span style="color:red;font-weight:bold;">${item.price}</span>`
                        : priceBlank;
                    return `<tr>
                        <td style="${TD}">${cb}${this._productImg(item)}${item.name}（${item.price}元）</td>
                        <td style="${TD}text-align:right;">${priceCell}</td>
                    </tr>`;
                }).join('');

                const spendFill = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${exampleTotal}</span>`
                    : `<span style="display:inline-block;border-bottom:1.5px solid #333;min-width:60px;height:1.2em;"></span>`;
                const remFill = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${budget - exampleTotal}</span>`
                    : `<span style="display:inline-block;border-bottom:1.5px solid #333;min-width:60px;height:1.2em;"></span>`;

                const tableHtml = `<table style="width:100%;border-collapse:collapse;font-size:${tFS};">
                    <thead><tr style="background:#4a90d9;color:white;">
                        <th style="${TH}text-align:left;width:75%;">${storeInfoData.emoji} ${storeInfoData.name}商品</th>
                        <th style="${TH}text-align:right;width:25%;">金額</th>
                    </tr></thead>
                    <tbody>${itemRows}</tbody>
                </table>
                <div style="margin-top:${mTop};font-size:${fFS};line-height:2.4;text-align:right;padding-right:7px;">
                    預算 <strong>${budget}</strong> 元 &nbsp;－&nbsp; 花費 ${spendFill} 元 &nbsp;＝&nbsp; 剩餘 ${remFill} 元
                </div>`;

                return {
                    _key: `a4_budget_${diff}_${currentStore}_${Math.random().toString(36).slice(2, 7)}`,
                    prompt: `你有 <strong>${budget}</strong> 元要去${storeInfoData.name}購物，請在下方勾選想買的商品，並將價格填入右側欄位（注意不能超過預算！）：`,
                    visual: tableHtml,
                    answerArea: '',
                    answerDisplay: ''
                };
            };

            return Array.from({ length: needed }, buildQuestion);
        }

        const questions = [];
        const isPrice = questionType.startsWith('price-');

        for (let i = 0; i < count; i++) {
            const currentStore = isMixed
                ? storeKeys[Math.floor(Math.random() * storeKeys.length)]
                : store;
            const products = this.stores[currentStore] || this.stores.convenience;
            const currentWallet = (options.walletAmount === 'auto' || isMixed)
                ? (this.storeWalletMap[currentStore] || 500)
                : (parseInt(options.walletAmount) || 500);

            let items, total;
            let attempts = 0;
            const maxAttempts = 50;

            do {
                items = [];
                const usedNames = new Set();
                const numItems = attempts >= 20 ? 2 : randomInt(2, 4);
                for (let j = 0; j < numItems; j++) {
                    let item;
                    do {
                        item = products[Math.floor(Math.random() * products.length)];
                    } while (usedNames.has(item.name));
                    usedNames.add(item.name);
                    // 高價品數量限制
                    let qty;
                    if (attempts >= 20) {
                        qty = 1;
                    } else if (item.price > 500) {
                        qty = 1;
                    } else if (item.price > 200) {
                        qty = randomInt(1, 2);
                    } else {
                        qty = randomInt(1, 3);
                    }
                    items.push({ ...item, qty });
                }
                total = items.reduce((s, it) => s + it.price * it.qty, 0);
                attempts++;
            } while (total >= currentWallet && attempts < maxAttempts);

            if (total >= currentWallet) continue;

            const paid = currentWallet;
            const change = paid - total;
            const isFillType = questionType === 'price-fill' || questionType === 'price-fill-select' || questionType === 'fill' || questionType === 'fill-select' || questionType === 'price-img-fill' || questionType === 'img-fill';
            const isImgFillType = questionType === 'price-img-fill' || questionType === 'img-fill';

            // 將價格轉換為金錢圖示顯示
            const renderPriceWithCoins = (price) => {
                const coins = walletToCoins(price);
                return `<span class="price-coins">${coins.map(c => renderCoin(c)).join('')}</span>`;
            };

            let listHtml = '<div class="shopping-list">';
            // 混合模式顯示商店名稱
            if (isMixed) {
                const info = this.storeInfo[currentStore];
                if (info) {
                    listHtml += `<div style="font-weight:bold; margin-bottom:4px;">${info.emoji || ''} ${info.name}：</div>`;
                }
            }
            items.forEach(it => {
                const subtotal = it.price * it.qty;
                const subtotalDisplay = (isFillType && !showAnswers)
                    ? '<span style="display:inline-block; border-bottom:2.5px solid #000; min-width:50px; text-align:center;">&nbsp;</span>'
                    : (isFillType && showAnswers)
                        ? `<span style="color:red;font-weight:bold;">${subtotal}</span>`
                        : `${subtotal}`;
                // 圖示填空：在價格前顯示金錢圖示
                const priceDisplay = isImgFillType
                    ? `${renderPriceWithCoins(it.price)}${showAnswers ? `(<span style="color:red;font-weight:bold;">${it.price}</span>元)` : `(${blankLine()})`}`
                    : `${it.price}`;
                listHtml += `<div class="shopping-item"><span>${this._productImg(it)}${it.name} × ${it.qty}</span><span>${priceDisplay} × ${it.qty} = ${subtotalDisplay} 元</span></div>`;
            });
            // 非填空題型：加入加號分隔線和總計
            if (!isFillType) {
                listHtml += `<div style="border-top: 1.5px solid #333; margin-top: 4px; padding-top: 4px; display: flex; justify-content: space-between;">
                    <span style="font-weight:bold;">＋</span>
                    <span style="font-weight:bold;">${total} 元</span>
                </div>`;
            }
            listHtml += '</div>';

            if (isPrice) {
                if (questionType === 'price-fill') {
                    questions.push({
                        prompt: '🛒 購物清單如下，請計算總金額：',
                        visual: listHtml,
                        answerArea: showAnswers
                            ? `總共 <span style="color:red;font-weight:bold;">${total}</span> 元`
                            : `總共 ${blankLine()} 元`,
                        answerDisplay: ''
                    });
                } else if (questionType === 'price-img-fill') {
                    // 圖示填空(價格計算)：購物清單已包含金錢圖示
                    questions.push({
                        prompt: '🛒 購物清單如下，請計算總金額：',
                        visual: listHtml,
                        answerArea: showAnswers
                            ? `總共 <span style="color:red;font-weight:bold;">${total}</span> 元`
                            : `總共 ${walletToCoins(total).map(c => renderCoin(c)).join('')}${blankLine()} 元`,
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
                        ? `總共 <span style="color:red;font-weight:bold;">${total}</span> 元`
                        : `總共 ${blankLine()} 元`;
                    questions.push({
                        prompt: '🛒 購物清單如下，請計算總金額：',
                        visual: listHtml + `<div style="margin-top:6px;margin-bottom:6px;">${fillArea}</div>
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
                        prompt: '🛒 購物清單如下：',
                        visual: listHtml + `<div style="margin-top:6px;">總共 <span style="color:red;font-weight:bold;">${total}</span> 元，請選出正確的金額組合：</div><div class="coin-choice-options">${choicesHtml}</div>`,
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
                        prompt: '🛒 購物清單如下：',
                        visual: listHtml + `<div style="margin-top:6px;">總共 <span style="color:red;font-weight:bold;">${total}</span> 元，請選出正確的金額組合：</div><div class="coin-choice-options">${choicesHtml}</div>`,
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
                        prompt: '🛒 購物清單如下，總共費用如下：',
                        visual: listHtml + `<div style="margin:4px 0;">總共要 ${partsHtml} ${totalHint}</div>`,
                        answerArea: '',
                        answerDisplay: ''
                    });
                }
                continue;
            }

            if (questionType === 'fill') {
                questions.push({
                    prompt: '🛒 購物清單如下，請計算總金額與找零：',
                    visual: listHtml,
                    answerArea: showAnswers
                        ? `(1) 總共 <span style="color:red;font-weight:bold;">${total}</span> 元　(2) 付 ${paid} 元，找回 <span style="color:red;font-weight:bold;">${change >= 0 ? change : '不夠'}</span> 元`
                        : `(1) 總共 ${blankLine()} 元　(2) 付 ${paid} 元，找回 ${blankLine()} 元`,
                    answerDisplay: ''
                });
            } else if (questionType === 'img-fill') {
                // 圖示填空(找零計算)：購物清單已包含金錢圖示
                questions.push({
                    prompt: '🛒 購物清單如下，請計算總金額與找零：',
                    visual: listHtml,
                    answerArea: showAnswers
                        ? `(1) 總共 <span style="color:red;font-weight:bold;">${total}</span> 元　(2) 付 ${paid} 元，找回 <span style="color:red;font-weight:bold;">${change >= 0 ? change : '不夠'}</span> 元`
                        : `(1) 總共 ${walletToCoins(total).map(c => renderCoin(c)).join('')}${blankLine()} 元　(2) 付 ${paid} 元，找回 ${walletToCoins(change).map(c => renderCoin(c)).join('')}${blankLine()} 元`,
                    answerDisplay: ''
                });
            } else if (questionType === 'fill-select' && change <= 0) {
                // change <= 0 時 fallback 為純填空
                questions.push({
                    prompt: '🛒 購物清單如下，請計算總金額與找零：',
                    visual: listHtml,
                    answerArea: showAnswers
                        ? `(1) 總共 <span style="color:red;font-weight:bold;">${total}</span> 元　(2) 付 ${paid} 元，找回 <span style="color:red;font-weight:bold;">不夠</span> 元`
                        : `(1) 總共 ${blankLine()} 元　(2) 付 ${paid} 元，找回 ${blankLine()} 元`,
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
                    ? `(1) 總共 <span style="color:red;font-weight:bold;">${total}</span> 元　(2) 付 ${paid} 元，找回 <span style="color:red;font-weight:bold;">${change}</span> 元`
                    : `(1) 總共 ${blankLine()} 元　(2) 付 ${paid} 元，找回 ${blankLine()} 元`;
                questions.push({
                    prompt: '🛒 購物清單如下，請計算總金額與找零：',
                    visual: listHtml + `<div style="margin-top:6px;margin-bottom:6px;">${fillArea}</div>
                             <div style="margin-bottom:4px;">請選出正確的找零組合：</div>
                             <div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                });
            } else if (change <= 0) {
                questions.push({
                    prompt: '🛒 購物清單如下，請計算總金額與找零：',
                    visual: listHtml,
                    answerArea: showAnswers
                        ? `(1) 總共 <span style="color:red;font-weight:bold;">${total}</span> 元　(2) 付 ${paid} 元，找回 <span style="color:red;font-weight:bold;">不夠</span> 元`
                        : `(1) 總共 ${blankLine()} 元　(2) 付 ${paid} 元，找回 ${blankLine()} 元`,
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
                    prompt: '🛒 購物清單如下：',
                    visual: listHtml + `<div style="margin-top:6px;">總共 <span style="color:red;font-weight:bold;">${total}</span> 元，付 ${paid} 元，應找回 <span style="color:red;font-weight:bold;">${change}</span> 元，請選出正確的找零組合：</div><div class="coin-choice-options">${choicesHtml}</div>`,
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
                    prompt: '🛒 購物清單如下：',
                    visual: listHtml + `<div style="margin-top:6px;">總共 <span style="color:red;font-weight:bold;">${total}</span> 元，付 ${paid} 元，應找回 <span style="color:red;font-weight:bold;">${change}</span> 元，請選出正確的找零組合：</div><div class="coin-choice-options">${choicesHtml}</div>`,
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
                    prompt: '🛒 購物清單如下：',
                    visual: listHtml + `<div style="margin-top:6px;">總共 ${total} 元，付 ${paid} 元，應找回多少元？</div><div style="margin:4px 0;">找回 ${partsHtml} ${totalHint}</div>`,
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
