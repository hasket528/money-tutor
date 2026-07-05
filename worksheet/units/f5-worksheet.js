// F5 量比較 作業單 — 多種題型
WorksheetRegistry.register('f5', {
    name: 'F5 量比較',
    icon: '⚖️',
    defaultCount: 10,
    subtitle(opts) {
        const type = opts.f5Type || 'num-check-big';
        const opt = this.toolbarConfig.fontButton.options.find(o => o.value === type);
        return opt ? opt.label : '';
    },

    toolbarConfig: {
        adjustCountButton: null,
        fontButton: {
            label: '📝 測驗題型',
            type: 'dropdown',
            options: [
                { label: '數字(勾選)：找大', value: 'num-check-big' },
                { label: '數字(勾選)：找小', value: 'num-check-small' },
                { label: '數字(勾選)：混合', value: 'num-check-mix' },
                { label: '圖示(有提示)：找大', value: 'icon-hint-big' },
                { label: '圖示(有提示)：找小', value: 'icon-hint-small' },
                { label: '圖示(有提示)：混合', value: 'icon-hint-mix' },
                { label: '圖示(無提示)：找大', value: 'icon-nohint-big' },
                { label: '圖示(無提示)：找小', value: 'icon-nohint-small' },
                { label: '圖示(無提示)：混合', value: 'icon-nohint-mix' },
                { label: '數字(填符號)：混合', value: 'num-symbol-mix' },
                { label: '圖示(填符號)：混合', value: 'icon-symbol-mix' },
            ],
            getCurrentValue: (params) => params.f5Type || 'num-check-big',
            onChange: (val, app) => { app.params.f5Type = val; app.generate(); }
        },
        orientationButton: {
            label: '📐 數量範圍',
            type: 'cycle',
            options: [
                { label: '1-5', value: 'small' },
                { label: '1-10', value: 'medium' },
                { label: '1-20', value: 'large' },
            ],
            getCurrentValue: (params) => params.rangeMode || 'small',
            onChange: (val, app) => { app.params.rangeMode = val; app.generate(); }
        }
    },

    _icons: ['🍎','🌟','🔵','🟡','🐱','🎈','🍀','⭐','🐶','🦊'],

    generate(options) {
        const { count = 10 } = options;
        const f5Type = options.f5Type || 'num-check-big';
        const rm = options.rangeMode || 'small';
        const ranges = { small: [1, 5], medium: [1, 10], large: [1, 20] };
        const [min, max] = ranges[rm] || ranges['small'];
        const showAnswers = options._showAnswers || false;
        const questions = [];

        const checkbox = '<span style="display:inline-block;width:16px;height:16px;border:1.5px solid #333;margin:0 4px;vertical-align:middle;"></span>';

        // Determine if equal values are allowed (only for fill-symbol types)
        const allowEqual = f5Type.includes('symbol');

        for (let i = 0; i < count; i++) {
            const a = randomInt(min, max);
            let b;
            if (allowEqual && Math.random() < 0.15) {
                b = a;
            } else {
                do { b = randomInt(min, max); } while (b === a);
            }

            const symbol = a > b ? '>' : a < b ? '<' : '=';
            const icon = this._icons[Math.floor(Math.random() * this._icons.length)];

            if (f5Type.startsWith('num-check')) {
                // 數字(勾選)
                let findBig;
                if (f5Type === 'num-check-big') findBig = true;
                else if (f5Type === 'num-check-small') findBig = false;
                else findBig = Math.random() < 0.5;

                const prompt = findBig ? '請在較大的數字上打勾：' : '請在較小的數字上打勾：';
                const aIsAnswer = findBig ? (a >= b) : (a <= b);
                const bIsAnswer = findBig ? (b >= a) : (b <= a);

                const aCheck = showAnswers && aIsAnswer
                    ? '<span style="color:red;font-weight:bold;font-size:14pt;">✓</span>' : checkbox;
                const bCheck = showAnswers && bIsAnswer
                    ? '<span style="color:red;font-weight:bold;font-size:14pt;">✓</span>' : checkbox;

                const visual = `<div class="compare-group">
                    <span style="display:inline-flex;align-items:center;gap:4px;">${aCheck}<span style="font-size:20pt; font-weight:bold;">${a}</span></span>
                    <span style="font-size:16pt; font-weight:bold; margin:0 16px;">VS</span>
                    <span style="display:inline-flex;align-items:center;gap:4px;">${bCheck}<span style="font-size:20pt; font-weight:bold;">${b}</span></span>
                </div>`;

                questions.push({ prompt, visual, answerArea: '', answerDisplay: '', _key: `f5_${a}_${b}_${f5Type}` });

            } else if (f5Type.startsWith('icon-hint')) {
                // 圖示(有提示)
                let findBig;
                if (f5Type === 'icon-hint-big') findBig = true;
                else if (f5Type === 'icon-hint-small') findBig = false;
                else findBig = Math.random() < 0.5;

                const prompt = findBig ? '請把比較多的圖示圈出來：' : '請把比較少的圖示圈出來：';
                const leftIcons = Array(a).fill(icon).join(' ');
                const rightIcons = Array(b).fill(icon).join(' ');

                const aIsAnswer = findBig ? (a >= b) : (a <= b);
                const bIsAnswer = findBig ? (b >= a) : (b <= a);

                const leftHint = aIsAnswer ? ` style="outline:2px dashed ${showAnswers ? 'red' : '#ccc'}; border-radius:8px; padding:2px 4px;"` : '';
                const rightHint = bIsAnswer ? ` style="outline:2px dashed ${showAnswers ? 'red' : '#ccc'}; border-radius:8px; padding:2px 4px;"` : '';

                const leftCount = `<span style="display:inline-block;width:28px;height:28px;border:1.5px solid #ccc;text-align:center;line-height:26px;font-size:12pt;color:#ccc;margin-left:4px;">${a}</span>`;
                const rightCount = `<span style="display:inline-block;width:28px;height:28px;border:1.5px solid #ccc;text-align:center;line-height:26px;font-size:12pt;color:#ccc;margin-left:4px;">${b}</span>`;

                const visual = `<div class="compare-group">
                    <span${leftHint}>${leftIcons}${leftCount}</span>
                    <span style="font-size:16pt; font-weight:bold; margin:0 10px;">VS</span>
                    <span${rightHint}>${rightIcons}${rightCount}</span>
                </div>`;

                questions.push({ prompt, visual, answerArea: '', answerDisplay: '', _key: `f5_${a}_${b}_${f5Type}` });

            } else if (f5Type.startsWith('icon-nohint')) {
                // 圖示(無提示)
                let findBig;
                if (f5Type === 'icon-nohint-big') findBig = true;
                else if (f5Type === 'icon-nohint-small') findBig = false;
                else findBig = Math.random() < 0.5;

                const prompt = findBig ? '請把比較多的圖示圈出來：' : '請把比較少的圖示圈出來：';
                const leftIcons = Array(a).fill(icon).join(' ');
                const rightIcons = Array(b).fill(icon).join(' ');
                const aIsAnswer = findBig ? (a >= b) : (a <= b);
                const bIsAnswer = findBig ? (b >= a) : (b <= a);

                const leftHint = showAnswers && aIsAnswer ? ' style="outline:2px dashed red; border-radius:8px; padding:2px 4px;"' : '';
                const rightHint = showAnswers && bIsAnswer ? ' style="outline:2px dashed red; border-radius:8px; padding:2px 4px;"' : '';

                const visual = `<div class="compare-group">
                    <span${leftHint}>${leftIcons}</span>
                    <span style="font-size:16pt; font-weight:bold; margin:0 10px;">VS</span>
                    <span${rightHint}>${rightIcons}</span>
                </div>`;

                questions.push({ prompt, visual, answerArea: '', answerDisplay: '', _key: `f5_${a}_${b}_${f5Type}` });

            } else if (f5Type === 'num-symbol-mix') {
                // 數字(填符號)
                const answerSymbol = showAnswers
                    ? `<span style="color:red;font-weight:bold;font-size:18pt;">${symbol}</span>`
                    : '<span style="display:inline-block;width:36px;height:36px;border:2px solid #333;font-size:18pt;text-align:center;line-height:32px;margin:0 8px;"></span>';

                const visual = `<div class="compare-group">
                    <span style="font-size:20pt; font-weight:bold;">${a}</span>
                    ${answerSymbol}
                    <span style="font-size:20pt; font-weight:bold;">${b}</span>
                </div>`;

                questions.push({
                    prompt: '比一比，請在 □ 中填入 >、< 或 =',
                    visual,
                    answerArea: '',
                    answerDisplay: '',
                    _key: `f5_${a}_${b}_sym`
                });

            } else if (f5Type === 'icon-symbol-mix') {
                // 圖示(填符號)
                const leftIcons = Array(a).fill(icon).join(' ');
                const rightIcons = Array(b).fill(icon).join(' ');
                const answerSymbol = showAnswers
                    ? `<span style="color:red;font-weight:bold;font-size:18pt;">${symbol}</span>`
                    : '<span style="display:inline-block;width:36px;height:36px;border:2px solid #333;font-size:18pt;text-align:center;line-height:32px;margin:0 8px;"></span>';

                const visual = `<div class="compare-group">
                    <span>${leftIcons}</span>
                    ${answerSymbol}
                    <span>${rightIcons}</span>
                </div>`;

                questions.push({
                    prompt: '比一比，請在 □ 中填入 >、< 或 =',
                    visual,
                    answerArea: '',
                    answerDisplay: '',
                    _key: `f5_${a}_${b}_iconsym`
                });
            }
        }
        return questions;
    }
});
