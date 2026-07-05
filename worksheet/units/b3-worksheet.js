// B3 存錢計畫 作業單
WorksheetRegistry.register('b3', {
    name: 'B3 存錢計畫',
    icon: '🐷',
    defaultCount: 20,
    subtitle(opts) {
        const diff = { easy:'小金額', normal:'中金額', hard:'大金額' };
        return `難度：${diff[opts.difficulty || 'easy']}`;
    },

    toolbarConfig: {
        fontButton: null,
        adjustCountButton: {
            label: '🎯 難度',
            type: 'dropdown',
            options: [
                { label: '簡單（小金額）', value: 'easy' },
                { label: '普通（中金額）', value: 'normal' },
                { label: '困難（大金額）', value: 'hard' },
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
                    { label: '真實金錢(正面)', value: 'real' },
                    { label: '真實金錢(反面)', value: 'real-back' },
                    { label: '真實金錢(正、反面)', value: 'real-both' },
                    { label: '金錢符號', value: 'symbol' },
                ],
                getCurrentValue: (params) => params.coinStyle || 'real',
                onChange: (val, app) => { app.params.coinStyle = val; app.generate(); }
            },
            {
                id: 'question-type-btn',
                label: '📝 測驗題型',
                type: 'dropdown',
                options: [
                    { label: '數字填空（存幾天）',      value: 'fill' },
                    { label: '填空與選擇（存幾天＋金額組合）', value: 'fill-select' },
                    { label: '圖示選擇（選出正確金額）', value: 'coin-select' },
                    { label: '提示選擇（有金額提示）',  value: 'hint-select' },
                    { label: '提示完成（填入幣值數量）', value: 'hint-complete' },
                    { label: '月曆模式（提示圈選）',  value: 'calendar-hint' },
                    { label: '月曆模式（數字填寫）',  value: 'calendar-fill' },
                ],
                getCurrentValue: (params) => params.questionType || 'fill',
                onChange: (val, app) => { app.params.questionType = val; app.generate(); }
            },
            {
                id: 'cal-layout-btn',
                label: '📄 版面',
                type: 'cycle',
                options: [
                    { label: '每頁 4 題', value: '4' },
                    { label: '每頁 2 題', value: '2' },
                    { label: '每頁 1 題', value: '1' },
                ],
                visible: (params) => {
                    const qt = params.questionType || 'fill';
                    return qt === 'calendar-hint' || qt === 'calendar-fill';
                },
                getCurrentValue: (params) => params.calLayout || '4',
                onChange: (val, app) => { app.params.calLayout = val; app.generate(); }
            },
        ],
    },

    _items: {
        easy: [
            { name: '繪畫工具組', price: 280, icon: '🎨' },
            { name: '玩具機器人', price: 300, icon: '🤖' },
            { name: '望遠鏡',    price: 350, icon: '🔭' },
            { name: '故事書',    price: 200, icon: '📕' },
            { name: '漫畫書',    price: 180, icon: '📚' },
            { name: '玩具車',    price: 300, icon: '🚗' },
            { name: '娃娃',      price: 350, icon: '🪆' },
        ],
        normal: [
            { name: '繪畫工具組', price: 280, icon: '🎨' },
            { name: '玩具機器人', price: 300, icon: '🤖' },
            { name: '望遠鏡',    price: 350, icon: '🔭' },
            { name: '烹飪玩具組', price: 420, icon: '🍳' },
            { name: '故事書套組', price: 450, icon: '📚' },
            { name: '科學實驗組', price: 480, icon: '🔬' },
            { name: '遊樂園門票', price: 500, icon: '🎡' },
            { name: '魔術道具組', price: 550, icon: '🎩' },
            { name: '生日蛋糕',  price: 600, icon: '🎂' },
            { name: '運動鞋',    price: 800, icon: '👟' },
        ],
        hard: [
            { name: '魔術道具組', price: 550,  icon: '🎩' },
            { name: '音樂盒',    price: 650,  icon: '🎵' },
            { name: '運動鞋',    price: 800,  icon: '👟' },
            { name: '水族箱',    price: 1200, icon: '🐠' },
            { name: '電動遊戲機', price: 1500, icon: '🎮' },
            { name: '腳踏車',    price: 2400, icon: '🚴' },
        ],
    },

    _weekly: {
        easy:   [50, 100, 150, 200],
        normal: [30, 50, 75, 100, 120, 150],
        hard:   [25, 35, 50, 65, 80, 100, 125, 150, 175, 200],
    },

    // 月曆模式：含每日存款金額的題目資料（商品與價格與 _items 對齊）
    // daysNeeded = ceil(price/daily)；設計使所有題目皆 ≤ 21 天（3 週內完成）
    _calItems: {
        easy: [
            { name: '繪畫工具組', price: 280, icon: '🎨', daily:  50 }, //  6天
            { name: '故事書',    price: 200, icon: '📕', daily:  50 }, //  4天
            { name: '玩具車',    price: 300, icon: '🚗', daily: 100 }, //  3天
            { name: '玩具機器人', price: 300, icon: '🤖', daily:  50 }, //  6天
            { name: '漫畫書',    price: 180, icon: '📚', daily:  30 }, //  6天
            { name: '望遠鏡',    price: 350, icon: '🔭', daily:  50 }, //  7天
            { name: '娃娃',      price: 350, icon: '🪆', daily:  50 }, //  7天
        ],
        normal: [
            { name: '望遠鏡',    price: 350, icon: '🔭', daily:  50 }, //  7天
            { name: '烹飪玩具組', price: 420, icon: '🍳', daily:  60 }, //  7天
            { name: '故事書套組', price: 450, icon: '📚', daily:  50 }, //  9天
            { name: '科學實驗組', price: 480, icon: '🔬', daily:  60 }, //  8天
            { name: '遊樂園門票', price: 500, icon: '🎡', daily: 100 }, //  5天
            { name: '魔術道具組', price: 550, icon: '🎩', daily:  50 }, // 11天
            { name: '生日蛋糕',  price: 600, icon: '🎂', daily:  50 }, // 12天
            { name: '運動鞋',    price: 800, icon: '👟', daily: 100 }, //  8天
        ],
        hard: [
            { name: '魔術道具組', price:  550, icon: '🎩', daily:  50 }, // 11天
            { name: '音樂盒',    price:  650, icon: '🎵', daily:  50 }, // 13天
            { name: '運動鞋',    price:  800, icon: '👟', daily: 100 }, //  8天
            { name: '水族箱',    price: 1200, icon: '🐠', daily: 100 }, // 12天
            { name: '電動遊戲機', price: 1500, icon: '🎮', daily: 150 }, // 10天
            { name: '腳踏車',    price: 2400, icon: '🚴', daily: 200 }, // 12天
        ],
    },

    generate(options) {
        const diff        = options.difficulty   || 'easy';
        const questionType = options.questionType || 'fill';
        const coinStyle   = options.coinStyle     || 'real';
        const showAnswers = options._showAnswers  || false;
        const count       = options.count         || 20;

        const renderCoin = (value) => {
            if (coinStyle === 'symbol')    return coinSymbol(value);
            if (coinStyle === 'real-back') return coinImgBack(value);
            if (coinStyle === 'real-both') return coinImgRandom(value);
            return coinImgFront(value);
        };

        const checkbox = '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin:0 4px;vertical-align:middle;"></span>';

        const items      = this._items[diff];
        const weeklyOpts = this._weekly[diff];
        const usedKeys   = options._usedValues || new Set();
        const questions  = [];

        // ── 月曆模式：直接回傳，不走下方 while 迴圈 ───────────────
        if (questionType === 'calendar-hint' || questionType === 'calendar-fill') {
            const calItems  = this._calItems[diff];
            const isHint    = questionType === 'calendar-hint';
            const calCount  = Math.min(count, 4);
            const calQs     = [];
            let calTries    = 0;
            const CAL_YEAR  = 2025;
            const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

            // ── 版面尺寸：根據每頁題數決定格子大小 ──
            const perPage = parseInt(options.calLayout || '4');
            const S = perPage === 1
                ? { tdH:'54px', thFS:'11pt',  dayFS:'12.5pt', noteFS:'9.5pt',  monthFS:'12pt',  promptFS:'15pt', ansFS:'13pt', circleW:'32px', circleH:'32px', circleFS:'10.5pt', fillH:'15px', fillAnsFS:'10.5pt' }
                : perPage === 2
                ? { tdH:'38px', thFS:'9pt',   dayFS:'10pt',   noteFS:'7.5pt',  monthFS:'10pt',  promptFS:'14pt', ansFS:'12pt', circleW:'24px', circleH:'24px', circleFS:'8.5pt',  fillH:'11px', fillAnsFS:'8pt'    }
                : { tdH:'26px', thFS:'7.5pt', dayFS:'8pt',    noteFS:'6pt',    monthFS:'9pt',   promptFS:'13pt', ansFS:'10pt', circleW:'18px', circleH:'18px', circleFS:'7.5pt',  fillH:'9px',  fillAnsFS:'6.5pt'  };

            // ── 產生單一月曆 block ──
            const genOne = () => {
                let gTries = 0;
                while (gTries++ < 20) {
                    const item = calItems[Math.floor(Math.random() * calItems.length)];
                    const key  = `b3cal_${item.name}_${diff}`;
                    if (usedKeys.has(key) && usedKeys.size < calItems.length) continue;
                    usedKeys.add(key);

                    const daysNeeded = Math.ceil(item.price / item.daily);

                    let month, daysInMonth, firstDayOfWeek;
                    let mTries = 0;
                    do {
                        month = Math.floor(Math.random() * 12) + 1;
                        daysInMonth    = new Date(CAL_YEAR, month, 0).getDate();
                        firstDayOfWeek = new Date(CAL_YEAR, month - 1, 1).getDay();
                        mTries++;
                    } while (daysNeeded > daysInMonth && mTries < 12);
                    if (daysNeeded > daysInMonth) continue;

                    const maxStart = daysInMonth - daysNeeded + 1;
                    const startDay = Math.floor(Math.random() * maxStart) + 1;

                    const numRows = Math.ceil((firstDayOfWeek + daysInMonth) / 7);
                    const DAY_LABELS = ['日','一','二','三','四','五','六'];
                    const thStyle = `background:#4a90d9;color:white;text-align:center;padding:2px 0;font-size:${S.thFS};font-weight:bold;border:1px solid #bcd;`;
                    const tdBase  = `text-align:center;border:1px solid #ccc;padding:1px 0;vertical-align:top;height:${S.tdH};width:14.28%;`;
                    const tdEmpty = 'background:#f0f0f0;border:1px solid #ddd;';

                    const headerRow = DAY_LABELS.map(d => `<th style="${thStyle}">${d}</th>`).join('');

                    let bodyRows = '';
                    for (let row = 0; row < numRows; row++) {
                        let cells = '';
                        for (let col = 0; col < 7; col++) {
                            const cellIdx = row * 7 + col;
                            const dayNum  = cellIdx - firstDayOfWeek + 1;
                            if (dayNum < 1 || dayNum > daysInMonth) {
                                cells += `<td style="${tdBase}${tdEmpty}"></td>`;
                            } else {
                                const isSaving  = dayNum >= startDay && dayNum <= (startDay + daysNeeded - 1);
                                const periodDay = dayNum - startDay + 1;

                                if (isHint) {
                                    const daySpan = (showAnswers && isSaving)
                                        ? `<span style="display:inline-block;width:${S.circleW};height:${S.circleH};line-height:${S.circleH};border-radius:50%;border:2px solid red;color:red;font-weight:bold;font-size:${S.circleFS};">${dayNum}</span>`
                                        : `<span style="font-size:${S.dayFS};font-weight:bold;">${dayNum}</span>`;
                                    const hintDiv = isSaving
                                        ? `<div style="color:#999;font-size:${S.noteFS};margin-top:0;">${periodDay * item.daily}元</div>`
                                        : '';
                                    cells += `<td style="${tdBase}">${daySpan}${hintDiv}</td>`;
                                } else {
                                    const dayDiv = `<div style="font-size:${S.dayFS};font-weight:bold;">${dayNum}</div>`;
                                    let writeArea;
                                    if (isSaving) {
                                        writeArea = showAnswers
                                            ? `<div style="color:red;font-weight:bold;font-size:${S.fillAnsFS};">${periodDay * item.daily}元</div>`
                                            : `<div style="border-bottom:1px solid #999;margin:1px 2px 0;min-height:${S.fillH};"></div>`;
                                    } else {
                                        writeArea = `<div style="min-height:${S.fillH};"></div>`;
                                    }
                                    cells += `<td style="${tdBase}">${dayDiv}${writeArea}</td>`;
                                }
                            }
                        }
                        bodyRows += `<tr>${cells}</tr>`;
                    }

                    const answerFill = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${daysNeeded}</span>`
                        : blankLine();

                    const subPrompt = isHint
                        ? `想買「<span class="ws-emoji-icon">${item.icon}</span><strong>${item.name}</strong>」需要 ${item.price} 元，從 <strong>${MONTH_NAMES[month - 1]}${startDay}號</strong>開始，每天存 <strong>${item.daily}</strong> 元，請圈出存錢的日期：`
                        : `想買「<span class="ws-emoji-icon">${item.icon}</span><strong>${item.name}</strong>」需要 ${item.price} 元，從 <strong>${MONTH_NAMES[month - 1]}${startDay}號</strong>開始，每天存 <strong>${item.daily}</strong> 元，請填寫每天的累計存款：`;

                    const calHtml = `
<div style="font-weight:bold;font-size:${S.monthFS};margin-bottom:2px;color:#4a90d9;text-align:center;">${MONTH_NAMES[month - 1]}</div>
<table style="width:100%;border-collapse:collapse;margin:0 0 2px;table-layout:fixed;">
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${bodyRows}</tbody>
</table>`;

                    return { key, subPrompt, calHtml, answerFill };
                }
                return null;
            };

            const mkCell = (num, q) => `
    <div style="min-width:0;">
        <div style="font-size:${S.promptFS};margin-bottom:4px;">(${num}) ${q.subPrompt}</div>
        ${q.calHtml}
        <div style="font-size:${S.ansFS};margin-top:3px;">共需存：${q.answerFill} 天才能買到</div>
    </div>`;

            while (calQs.length < calCount && calTries < calCount * 30) {
                calTries++;
                const cals = [];
                let failed = false;
                for (let i = 0; i < perPage; i++) {
                    const q = genOne();
                    if (!q) { failed = true; break; }
                    cals.push(q);
                }
                if (failed || cals.length < perPage) continue;

                let visual;
                if (perPage === 4) {
                    visual = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;">
    ${cals.map((q, i) => mkCell(i + 1, q)).join('')}
</div>`;
                } else if (perPage === 2) {
                    visual = `<div style="display:flex;flex-direction:column;gap:14px;">
    ${cals.map((q, i) => mkCell(i + 1, q)).join('')}
</div>`;
                } else {
                    visual = mkCell(1, cals[0]);
                }

                calQs.push({
                    _key: cals.map(c => c.key).join('+'),
                    prompt: '',
                    visual,
                    answerArea: '',
                    answerDisplay: ''
                });
            }
            return calQs;
        }

        let attempts = 0;

        while (questions.length < count && attempts < count * 4) {
            attempts++;
            const item   = items[Math.floor(Math.random() * items.length)];
            const weekly = weeklyOpts[Math.floor(Math.random() * weeklyOpts.length)];
            const key    = `b3_${item.name}_${weekly}`;
            if (usedKeys.has(key) && usedKeys.size < items.length * weeklyOpts.length) continue;
            usedKeys.add(key);

            const days = Math.ceil(item.price / weekly);
            const price = item.price;

            // ── 1. 數字填空：填入需要存幾天 ──────────────────────────
            if (questionType === 'fill') {
                const ans = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${days}</span>`
                    : blankLine();
                questions.push({
                    _key: key,
                    prompt: `想買「<span class="ws-emoji-icon">${item.icon}</span><strong>${item.name}</strong>」要 ${price} 元，每天存 <strong>${weekly}</strong> 元，要存幾天才夠？`,
                    visual: '',
                    answerArea: `需存 ${ans} 天`,
                    answerDisplay: ''
                });

            // ── 2. 填空與選擇：填入天數 ＋ 選出總價的金額組合 ──────────
            } else if (questionType === 'fill-select') {
                const daysAns = showAnswers
                    ? `<span style="color:red;font-weight:bold;">${days}</span>`
                    : blankLine();
                const correctCoins = walletToCoins(price);
                const opts = this._generateCoinOptions(price, correctCoins);
                const choicesHtml = opts.map((opt, idx) => {
                    const label     = String.fromCharCode(9312 + idx);
                    const isCorrect = opt.total === price;
                    const style     = showAnswers && isCorrect ? 'border-color: red; border-width: 3px;' : '';
                    const check     = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const answerTag = (showAnswers && isCorrect)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${price} 元</span>`
                        : '';
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>${answerTag}
                    </div>`;
                }).join('');
                questions.push({
                    _key: key,
                    prompt: `想買「<span class="ws-emoji-icon">${item.icon}</span><strong>${item.name}</strong>」要 ${price} 元，每天存 <strong>${weekly}</strong> 元，要存幾天才夠？`,
                    visual: `<div style="margin-bottom:6px;">需存 ${daysAns} 天</div>
                             <div style="margin-bottom:4px;">請選出 <strong>${price} 元</strong> 的正確金額組合：</div>
                             <div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                });

            // ── 3. 圖示選擇：給出總價，從選項中選出正確金額組合 ────────
            } else if (questionType === 'coin-select') {
                const correctCoins = walletToCoins(price);
                const opts = this._generateCoinOptions(price, correctCoins);
                const choicesHtml = opts.map((opt, idx) => {
                    const label     = String.fromCharCode(9312 + idx);
                    const isCorrect = opt.total === price;
                    const style     = showAnswers && isCorrect ? 'border-color: red; border-width: 3px;' : '';
                    const check     = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const amtField = (showAnswers && isCorrect)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${price} 元</span>`
                        : `<span style="display:inline-flex;align-items:flex-end;align-self:flex-end;margin-left:6px;gap:2px;"><span style="display:inline-block;min-width:60px;border-bottom:1.5px solid #333;line-height:1;"></span><span>元</span></span>`;
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>${amtField}
                    </div>`;
                }).join('');
                questions.push({
                    _key: key,
                    prompt: `「<span class="ws-emoji-icon">${item.icon}</span><strong>${item.name}</strong>」要 <span style="color:red;font-weight:bold;">${price}</span> 元，請選出正確的金額組合：`,
                    visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                });

            // ── 4. 提示選擇：同圖示選擇，但選項旁附上灰色金額提示 ──────
            } else if (questionType === 'hint-select') {
                const correctCoins = walletToCoins(price);
                const opts = this._generateCoinOptions(price, correctCoins);
                const choicesHtml = opts.map((opt, idx) => {
                    const label     = String.fromCharCode(9312 + idx);
                    const isCorrect = opt.total === price;
                    const style     = showAnswers && isCorrect ? 'border-color: red; border-width: 3px;' : '';
                    const check     = (showAnswers && isCorrect)
                        ? '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid red;color:red;font-size:14px;line-height:16px;text-align:center;margin:0 4px;vertical-align:middle;">✓</span>'
                        : checkbox;
                    const answerTag = (showAnswers && isCorrect)
                        ? `<span style="color:red;font-weight:bold;margin-left:6px;">答案：${price} 元</span>`
                        : '';
                    return `<div class="coin-choice-option" style="${style}">
                        <span style="font-weight:bold; min-width:20px;">${label}</span>${check}
                        <div class="combo-coins">${opt.coins.map(c => renderCoin(c)).join('')}</div>
                        <span style="color:#ccc;font-weight:bold;margin-left:6px;">${opt.total}元</span>${answerTag}
                    </div>`;
                }).join('');
                questions.push({
                    _key: key,
                    prompt: `「<span class="ws-emoji-icon">${item.icon}</span><strong>${item.name}</strong>」要 <span style="color:red;font-weight:bold;">${price}</span> 元，請選出正確的金額組合：`,
                    visual: `<div class="coin-choice-options">${choicesHtml}</div>`,
                    answerArea: '',
                    answerDisplay: ''
                });

            // ── 5. 提示完成：顯示幣值圖示，填入各幣值的數量 ────────────
            } else if (questionType === 'hint-complete') {
                const combo = this._findCombo(price);
                if (!combo) continue;
                const partsHtml = combo.map(c => {
                    const icons     = Array(c.count).fill(renderCoin(c.denom)).join('');
                    const answerNum = showAnswers
                        ? `<span style="color:red;font-weight:bold;">${c.count}</span>` : '___';
                    const qty       = c.denom >= 100 ? '張' : '個';
                    return `${answerNum}${qty} ${icons}`;
                }).join('&nbsp;&nbsp;');
                const totalColor = showAnswers ? 'color:red' : 'color:#ccc';
                const totalHint  = `<span style="font-size:14pt;font-weight:bold;margin-left:6px;">共 <span style="${totalColor};font-weight:bold;">${price}</span> 元</span>`;
                questions.push({
                    _key: key,
                    prompt: `想買「<span class="ws-emoji-icon">${item.icon}</span><strong>${item.name}</strong>」，填入正確的幣值數量，湊出 ${price} 元：`,
                    visual: `<div style="margin:4px 0;">${partsHtml} ${totalHint}</div>`,
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
            const offset      = randomInt(1, Math.max(5, Math.floor(correctAmount * 0.3)));
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
