// F1 一對一對應 作業單 — 連連看題型（黑點在圖示框外）
WorksheetRegistry.register('f1', {
    name: 'F1 一對一對應',
    icon: '🔢',
    defaultCount: 5,
    subtitle() {
        return '連連看：將左右相同的圖示用線連起來';
    },

    toolbarConfig: {
        hidePrintAnswer: false,
        orientationButton: null,
        adjustCountButton: {
            label: '📊 圖示數量',
            type: 'dropdown',
            options: [
                { label: '1題(10個圖示)', value: '1_10' },
                { label: '2題(5個圖示)', value: '2_5' },
                { label: '3題(3個圖示)', value: '3_3' },
            ],
            getCurrentValue: (params) => params.f1Layout || '2_5',
            onChange: (val, app) => { app.params.f1Layout = val; app.generate(); }
        },
        fontButton: {
            label: '📝 測驗題型',
            type: 'dropdown',
            options: [
                { label: '一般', value: 'off' },
                { label: '虛線提示', value: 'on' },
            ],
            getCurrentValue: (params) => params.hintLines || 'off',
            onChange: (val, app) => { app.params.hintLines = val; app.generate(); }
        },
        needsPostRender: true
    },

    afterRender() {
        document.querySelectorAll('.f1-lines').forEach(svg => {
            const qIdx = svg.dataset.qidx;
            const pairs = JSON.parse(svg.dataset.pairs);
            const mode = svg.dataset.mode; // 'answer', 'hint', or 'none'
            const container = svg.closest('.matching-container');
            if (!container) return;
            const rect = container.getBoundingClientRect();
            svg.setAttribute('width', container.offsetWidth);
            svg.setAttribute('height', container.offsetHeight);
            svg.innerHTML = '';

            if (mode === 'none') return;

            pairs.forEach(({leftIdx, rightIdx}) => {
                const dotL = document.getElementById(`dot-left-${qIdx}-${leftIdx}`);
                const dotR = document.getElementById(`dot-right-${qIdx}-${rightIdx}`);
                if (!dotL || !dotR) return;
                const lRect = dotL.getBoundingClientRect();
                const rRect = dotR.getBoundingClientRect();
                const x1 = lRect.left - rect.left + lRect.width / 2;
                const y1 = lRect.top - rect.top + lRect.height / 2;
                const x2 = rRect.left - rect.left + rRect.width / 2;
                const y2 = rRect.top - rect.top + rRect.height / 2;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                if (mode === 'answer') {
                    line.setAttribute('stroke', 'red');
                    line.setAttribute('stroke-width', '2');
                } else {
                    line.setAttribute('stroke', '#ccc');
                    line.setAttribute('stroke-dasharray', '4,4');
                    line.setAttribute('stroke-width', '1.5');
                }
                svg.appendChild(line);
            });
        });
    },

    generate(options) {
        const layout = options.f1Layout || '2_5';
        const [countStr, itemCountStr] = layout.split('_');
        const count = parseInt(countStr);
        const itemCount = parseInt(itemCountStr);
        const showHintLines = options.hintLines === 'on';

        const allIcons = ['🍎','🍌','🍇','🍓','🍊','🥝','🍍','🍉','🍑','🍒',
            '🐶','🐱','🐭','🐰','🦊','🐻','🐼','🐨','🐯','🦁',
            '🚗','🚕','🚌','🚓','🚑','🚒','🚚','🚲','🚀','✈️'];
        const questions = [];
        const showAnswers = options._showAnswers || false;
        const pageId = Math.random().toString(36).slice(2, 8);

        for (let qIdx = 0; qIdx < count; qIdx++) {
            const icons = pickRandom(allIcons, itemCount);
            const leftOrder = shuffle(icons);
            const rightOrder = shuffle(icons);

            const leftHtml = leftOrder.map((ic, idx) =>
                `<div class="matching-item-wrapper"><div class="matching-item">${ic}</div><span id="dot-left-${pageId}-${qIdx}-${idx}" class="matching-dot-outside">●</span></div>`
            ).join('');
            const rightHtml = rightOrder.map((ic, idx) => {
                const origIdx = rightOrder.indexOf(ic);
                return `<div class="matching-item-wrapper"><span id="dot-right-${pageId}-${qIdx}-${idx}" class="matching-dot-outside">●</span><div class="matching-item">${ic}</div></div>`;
            }).join('');

            // Build pairs data: for each left item, find its matching right index
            const pairs = leftOrder.map((ic, idx) => {
                const rightIdx = rightOrder.indexOf(ic);
                return { leftIdx: idx, rightIdx: rightIdx };
            });

            // Determine line mode
            let lineMode = 'none';
            if (showAnswers) lineMode = 'answer';
            else if (showHintLines) lineMode = 'hint';

            const middleHtml = `<svg class="f1-lines" data-pairs='${JSON.stringify(pairs)}' data-qidx="${pageId}-${qIdx}" data-mode="${lineMode}"></svg>`;

            const visual = `<div class="matching-container" style="position:relative;">
                <div class="matching-column matching-left">${leftHtml}</div>
                ${middleHtml}
                <div class="matching-column matching-right">${rightHtml}</div>
            </div>`;

            questions.push({
                prompt: '請將左右相同的圖示用線連起來：',
                visual,
                answerArea: '',
                answerDisplay: ''
            });
        }
        return questions;
    }
});
