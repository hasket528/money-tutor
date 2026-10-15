/**
 * choice-mark.js — 指定任務「選對／選錯」標記（A1～A4 共用，唯一定義）
 *
 * 2026-09-25 使用者定：A1～A4 指定任務選商品（A2 選服務），
 *   選錯＝紅底白 ✕、選對＝綠底白 ✓，兩者同一個樣式與動畫——就是 A1 原本的紅色 ✕
 *   （SVG 圓形底＋白線、旋轉彈出 0.5 秒、1.5 秒後縮小消失）。
 *   原本只有 A1 有 ✕（寫在 a1_vending_machine.js 內），A3 另寫了一套柔和版 → 收斂成這一份。
 *
 * 用法：ChoiceMark.show(元素, 'wrong' | 'ok')
 *   元素＝要疊標記的那張商品／服務卡；是 position:static 會自動改成 relative。
 *   標記不擋點擊（pointer-events:none）。同一張卡再叫一次會先移除舊的。
 *   也用在 A1 普通／困難「點錯步驟」的投幣口、退幣鈕；元素短邊 < 80px 時標記自動縮小。
 * 各單元 HTML 都要引入（放在單元 JS 之前）：a1／a2／a3／a4。
 */
(function () {
    'use strict';
    if (window.ChoiceMark) return;

    const CSS = `
        .choice-mark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            z-index: 10;
            pointer-events: none;
            animation: choiceMarkAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .choice-mark.choice-mark-out { animation: choiceMarkDisappear 0.3s ease-out forwards; }
        .choice-mark svg { width: 100%; height: 100%; }
        .choice-mark-wrong svg { filter: drop-shadow(0 4px 8px rgba(231, 76, 60, 0.5)); }
        .choice-mark-ok svg { filter: drop-shadow(0 4px 8px rgba(39, 174, 96, 0.5)); }
        @keyframes choiceMarkAppear {
            0% { transform: translate(-50%, -50%) scale(0) rotate(-180deg); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.2) rotate(0deg); }
            100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes choiceMarkDisappear {
            to { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        }`;

    const SVG = {
        wrong: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="#e74c3c" opacity="0.9"/>
                    <line x1="30" y1="30" x2="70" y2="70" stroke="white" stroke-width="8" stroke-linecap="round"/>
                    <line x1="70" y1="30" x2="30" y2="70" stroke="white" stroke-width="8" stroke-linecap="round"/>
                </svg>`,
        ok: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="#27ae60" opacity="0.9"/>
                    <polyline points="28,52 44,68 73,34" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`
    };

    function ensureStyle() {
        if (document.getElementById('choice-mark-style')) return;
        const st = document.createElement('style');
        st.id = 'choice-mark-style';
        st.textContent = CSS;
        document.head.appendChild(st);
    }

    function show(el, kind) {
        if (!el) return null;
        ensureStyle();
        el.querySelectorAll(':scope > .choice-mark').forEach(m => m.remove());
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
        const mark = document.createElement('div');
        mark.className = 'choice-mark ' + (kind === 'ok' ? 'choice-mark-ok' : 'choice-mark-wrong');
        mark.setAttribute('aria-hidden', 'true');
        mark.innerHTML = kind === 'ok' ? SVG.ok : SVG.wrong;
        // 小元素（投幣口、退幣鈕這類按鈕）縮小標記，免得 100px 的圈整個蓋過旁邊的按鈕
        const r = el.getBoundingClientRect(), side = Math.min(r.width, r.height);
        if (side > 0 && side < 80) { const px = Math.max(40, Math.round(side * 1.1)) + 'px'; mark.style.width = mark.style.height = px; }
        el.appendChild(mark);
        // 1.5 秒後縮小消失（同 A1 原本的時序）；元素若已被重繪移除，計時器照跑也不會出錯
        setTimeout(() => {
            mark.classList.add('choice-mark-out');
            setTimeout(() => mark.remove(), 300);
        }, 1500);
        return mark;
    }

    window.ChoiceMark = { show };
})();
