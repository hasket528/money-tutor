/**
 * student-picker.js
 * 共用「選擇測驗學生」元件：測驗開始前（設定/難度頁）讓老師選定或更換目前學生。
 *
 * 資料層與全站既有機制完全共用，不另建欄位：
 *   - 名冊：localStorage['rewardSystemStudents']（reward/ 系統維護）
 *   - 目前學生：localStorage['sp_currentStudent']（{id,name} 或 null=訪客）
 * LearningTracker.save() 已會自動讀 sp_currentStudent 寫入紀錄，這裡只負責把它設對。
 *
 * 自帶樣式（比照 js/student-badge.js 的 injectStyle() 做法），不依賴 ai-theme.css /
 * b-series.css / dialogue style.css 的既有 class，避免三處視覺語言互相污染。
 *
 * API：
 *   StudentPicker.getCurrent()          // 讀目前學生
 *   StudentPicker.mount(containerIdOrEl, { unit }) // 冪等，畫面每次重繪後可重複呼叫；
 *                                       // 學生列下方會列出這位學生在本單元的 IEP 目標（unit 不給就從網址推）
 */
(function () {
    'use strict';

    var ROSTER_KEY  = 'rewardSystemStudents';
    var CURRENT_KEY = 'sp_currentStudent';
    var STYLE_ID    = 'student-picker-style';
    var MODAL_ID    = 'sp-modal-overlay';

    var mountedEls = [];

    // ⭐ 學生的展示品（寵物／徽章／寶物）放在名冊卡片頭像旁：資料與畫法在 js/showcase.js，這裡自動載入
    var SELF_SRC = document.currentScript && document.currentScript.src;
    function loadShowcase() {
        if (window.MTShowcase || !SELF_SRC || document.getElementById('mt-showcase-js')) return;
        var sc = document.createElement('script');
        sc.id = 'mt-showcase-js';
        sc.src = new URL('showcase.js', SELF_SRC).href;
        document.head.appendChild(sc);
    }
    loadShowcase();

    // 🏁 這位學生在本單元的 IEP 目標（js/iep-reminder.js）：接在學生列下方，載入好再重畫一次
    function loadIepReminder() {
        if (window.IepReminder || !SELF_SRC || document.getElementById('mt-iep-reminder-js')) return;
        var sc = document.createElement('script');
        sc.id = 'mt-iep-reminder-js';
        sc.src = new URL('iep-reminder.js', SELF_SRC).href;
        sc.onload = function () { refreshAllBars(); };
        document.head.appendChild(sc);
    }
    loadIepReminder();

    function loadRoster() {
        try { return JSON.parse(localStorage.getItem(ROSTER_KEY) || '[]'); }
        catch (e) { return []; }
    }

    function getCurrent() {
        try { return JSON.parse(localStorage.getItem(CURRENT_KEY) || 'null'); }
        catch (e) { return null; }
    }

    function setCurrent(stu) {
        if (stu) localStorage.setItem(CURRENT_KEY, JSON.stringify({ id: stu.id, name: stu.name }));
        else localStorage.removeItem(CURRENT_KEY);
        refreshAllBars();
    }

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent =
            '.sp-bar{display:flex;align-items:center;gap:10px;background:#eff6ff;' +
            'border:2px solid #93c5fd;border-radius:14px;padding:10px 14px;margin:0 0 16px;' +
            'cursor:pointer;font-family:inherit;font-size:0.95em;}' +
            '.sp-bar:hover{border-color:#3b82f6;}' +
            '.sp-bar--guest{background:#fef2f2;border-color:#fca5a5;}' +
            '.sp-bar--guest:hover{border-color:#ef4444;}' +
            '.sp-bar-icon{font-size:1.2em;flex-shrink:0;}' +
            '.sp-bar-text{flex:1;color:#1e3a8a;font-weight:600;}' +
            '.sp-bar--guest .sp-bar-text{color:#991b1b;}' +
            '.sp-bar-text strong{color:#1d4ed8;}' +
            '.sp-bar--guest .sp-bar-text strong{color:#b91c1c;}' +
            '.sp-bar-btn{flex-shrink:0;background:#3b82f6;color:#fff;border:none;' +
            'border-radius:20px;padding:6px 16px;font-weight:700;font-size:0.9em;' +
            'cursor:pointer;font-family:inherit;}' +
            '.sp-bar--guest .sp-bar-btn{background:#ef4444;}' +
            '.sp-bar-btn:hover{opacity:0.88;}' +
            '.sp-modal-overlay{position:fixed;inset:0;z-index:20000;display:flex;' +
            'align-items:center;justify-content:center;padding:16px;}' +
            '.sp-modal-overlay[hidden]{display:none;}' +
            '.sp-modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.45);}' +
            '.sp-modal-card{position:relative;background:#fff;border-radius:22px;padding:28px 28px 24px;' +
            'width:100%;max-width:720px;max-height:88vh;overflow-y:auto;' +   // 2026-10-07 使用者定：放大一點（原 480px）
            ''+
            'box-shadow:0 10px 40px rgba(0,0,0,0.25);display:flex;flex-direction:column;' +
            'gap:14px;font-family:inherit;}' +
            '.sp-modal-title{margin:0;font-size:1.5em;font-weight:800;color:#1f2937;' +
            'text-align:center;}' +
            '.sp-modal-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));' +
            'gap:14px;}' +   // 有展示品的卡片頭像旁多一個圓，最小寬度放得下兩個圓
            '.sp-modal-list:has(.mt-sc){grid-template-columns:repeat(auto-fill,minmax(160px,1fr));}' +
            '.sp-card{display:flex;flex-direction:column;align-items:center;gap:6px;' +
            'background:#f9fafb;border:2px solid #e5e7eb;border-radius:16px;padding:16px 10px;' +
            'cursor:pointer;font-family:inherit;transition:border-color .15s,transform .1s;}' +
            '.sp-card:hover{border-color:#3b82f6;transform:translateY(-2px);}' +
            '.sp-card--selected{border-color:#3b82f6;background:#eff6ff;}' +
            '.sp-card-photo{width:76px;height:76px;border-radius:50%;object-fit:cover;}' +
            '.sp-card-pics{display:flex;align-items:center;justify-content:center;gap:6px;}' +
            '.sp-card-photo--emoji{display:flex;align-items:center;justify-content:center;' +
            'font-size:2.4em;background:#e5e7eb;}' +
            '.sp-card-name{font-size:1.05em;font-weight:700;color:#1f2937;text-align:center;}' +
            '.sp-modal-hint{font-size:0.92em;color:#6b7280;text-align:center;margin:0;}' +
            '.sp-modal-close{align-self:center;background:#e5e7eb;color:#1f2937;border:none;' +
            'border-radius:20px;padding:10px 30px;font-size:1em;font-weight:700;cursor:pointer;font-family:inherit;}' +
            '.sp-modal-close:hover{background:#d1d5db;}' +
            // 深色模式：這個元件自帶樣式、原本完全沒有深色覆蓋（淺色柔和色浮在深色頁面上
            // 刺眼且辨識度差，2026-09-09 使用者截圖回報「選擇學生文字看不清楚」才發現）。
            // 兩區塊逐字對應，只差外層 gate，寫法同 CLAUDE.md「深色模式規則」。
            '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .sp-bar{' +
            'background:#1E3A5F;border-color:#2563eb;}' +
            ':root:not([data-theme="light"]) .sp-bar--guest{background:#450A0A;border-color:#b91c1c;}' +
            ':root:not([data-theme="light"]) .sp-bar-text{color:#93C5FD;}' +
            ':root:not([data-theme="light"]) .sp-bar--guest .sp-bar-text{color:#FCA5A5;}' +
            ':root:not([data-theme="light"]) .sp-bar-text strong{color:#BFDBFE;}' +
            ':root:not([data-theme="light"]) .sp-bar--guest .sp-bar-text strong{color:#FECACA;}' +
            ':root:not([data-theme="light"]) .sp-modal-card{background:#1E293B;box-shadow:0 10px 40px rgba(0,0,0,0.5);}' +
            ':root:not([data-theme="light"]) .sp-modal-title{color:#F1F5F9;}' +
            ':root:not([data-theme="light"]) .sp-card{background:#0F172A;border-color:#334155;}' +
            ':root:not([data-theme="light"]) .sp-card--selected{border-color:#60A5FA;background:#1E3A5F;}' +
            ':root:not([data-theme="light"]) .sp-card-photo--emoji{background:#334155;}' +
            ':root:not([data-theme="light"]) .sp-card-name{color:#E2E8F0;}' +
            ':root:not([data-theme="light"]) .sp-modal-hint{color:#94A3B8;}' +
            ':root:not([data-theme="light"]) .sp-modal-close{background:#334155;color:#E2E8F0;}' +
            ':root:not([data-theme="light"]) .sp-modal-close:hover{background:#475569;}}' +
            '[data-theme="dark"] .sp-bar{background:#1E3A5F;border-color:#2563eb;}' +
            '[data-theme="dark"] .sp-bar--guest{background:#450A0A;border-color:#b91c1c;}' +
            '[data-theme="dark"] .sp-bar-text{color:#93C5FD;}' +
            '[data-theme="dark"] .sp-bar--guest .sp-bar-text{color:#FCA5A5;}' +
            '[data-theme="dark"] .sp-bar-text strong{color:#BFDBFE;}' +
            '[data-theme="dark"] .sp-bar--guest .sp-bar-text strong{color:#FECACA;}' +
            '[data-theme="dark"] .sp-modal-card{background:#1E293B;box-shadow:0 10px 40px rgba(0,0,0,0.5);}' +
            '[data-theme="dark"] .sp-modal-title{color:#F1F5F9;}' +
            '[data-theme="dark"] .sp-card{background:#0F172A;border-color:#334155;}' +
            '[data-theme="dark"] .sp-card--selected{border-color:#60A5FA;background:#1E3A5F;}' +
            '[data-theme="dark"] .sp-card-photo--emoji{background:#334155;}' +
            '[data-theme="dark"] .sp-card-name{color:#E2E8F0;}' +
            '[data-theme="dark"] .sp-modal-hint{color:#94A3B8;}' +
            '[data-theme="dark"] .sp-modal-close{background:#334155;color:#E2E8F0;}' +
            '[data-theme="dark"] .sp-modal-close:hover{background:#475569;}';
        document.head.appendChild(style);
    }

    function ensureModal() {
        var overlay = document.getElementById(MODAL_ID);
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = MODAL_ID;
        overlay.className = 'sp-modal-overlay';
        overlay.hidden = true;
        overlay.innerHTML =
            '<div class="sp-modal-backdrop"></div>' +
            '<div class="sp-modal-card" role="dialog" aria-modal="true" aria-labelledby="sp-modal-title">' +
                '<h3 class="sp-modal-title" id="sp-modal-title">選擇測驗學生</h3>' +
                '<div class="sp-modal-list" id="sp-modal-list"></div>' +
                '<p class="sp-modal-hint" id="sp-modal-hint"></p>' +
                '<button type="button" class="sp-modal-close">關閉</button>' +
            '</div>';
        document.body.appendChild(overlay);
        overlay.querySelector('.sp-modal-backdrop').addEventListener('click', closeModal);
        overlay.querySelector('.sp-modal-close').addEventListener('click', closeModal);
        return overlay;
    }

    function closeModal() {
        var overlay = document.getElementById(MODAL_ID);
        if (overlay) overlay.hidden = true;
    }

    function openModal() {
        injectStyle();
        var overlay = ensureModal();
        var list = overlay.querySelector('#sp-modal-list');
        var hint = overlay.querySelector('#sp-modal-hint');
        var roster = loadRoster();
        var cur = getCurrent();
        list.innerHTML = '';

        function addCard(label, photoHtml, selected, onPick, stuId) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'sp-card' + (selected ? ' sp-card--selected' : '');
            btn.innerHTML = '<span class="sp-card-pics">' + photoHtml + '</span><span class="sp-card-name"></span>';
            btn.querySelector('.sp-card-name').textContent = label;
            var scEl = stuId != null && window.MTShowcase && window.MTShowcase.el(stuId, 'sc-pick');
            if (scEl) btn.querySelector('.sp-card-pics').appendChild(scEl);
            btn.addEventListener('click', function () {
                onPick();
                closeModal();
            });
            list.appendChild(btn);
        }

        roster.forEach(function (s) {
            var photo = s.photo
                ? '<img class="sp-card-photo" src="' + s.photo + '" alt="">'
                : '<span class="sp-card-photo sp-card-photo--emoji">🙂</span>';
            addCard(s.name || '(未命名)', photo,
                !!(cur && String(cur.id) === String(s.id)),
                function () { setCurrent(s); }, s.id);
        });
        addCard('訪客（不指定）',
            '<span class="sp-card-photo sp-card-photo--emoji">👤</span>',
            !cur, function () { setCurrent(null); });

        hint.textContent = roster.length
            ? '名冊與獎勵系統共用；要新增學生請到主頁「金婆婆」，或學習歷程總覽的「👥 學生名冊」。'
            : '尚未建立學生名冊——請先到主頁找金婆婆新增學生，或先以訪客身分測驗。';

        overlay.hidden = false;
    }

    function renderBar(container) {
        var cur = getCurrent();
        container.innerHTML = '';
        var bar = document.createElement('div');
        bar.className = 'sp-bar' + (cur ? '' : ' sp-bar--guest');

        var icon = document.createElement('span');
        icon.className = 'sp-bar-icon';
        icon.textContent = cur ? '🧑‍🎓' : '⚠️';

        var text = document.createElement('span');
        text.className = 'sp-bar-text';
        if (cur) {
            text.appendChild(document.createTextNode('測驗學生：'));
            var strong = document.createElement('strong');
            strong.textContent = cur.name || '(未命名)';
            text.appendChild(strong);
        } else {
            text.textContent = '尚未選擇學生（將以訪客記錄）';
        }

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sp-bar-btn';
        btn.textContent = cur ? '更換' : '選擇';

        bar.appendChild(icon);
        bar.appendChild(text);
        bar.appendChild(btn);
        bar.addEventListener('click', openModal);
        container.appendChild(bar);

        if (window.IepReminder) {
            var note = document.createElement('div');
            container.appendChild(note);
            window.IepReminder.render(note, container._spUnit);
        }
    }

    function refreshAllBars() {
        mountedEls.forEach(function (el) {
            if (el && document.body.contains(el)) renderBar(el);
        });
    }

    // opts.unit＝IEP 目標用的單元代號（生活情境傳「場景|情境」；24 單元不用給，從網址推）
    function mount(target, opts) {
        injectStyle();
        var el = typeof target === 'string' ? document.getElementById(target) : target;
        if (!el) return;
        if (mountedEls.indexOf(el) === -1) mountedEls.push(el);
        el._spUnit = opts && opts.unit;
        renderBar(el);
    }

    window.StudentPicker = {
        getCurrent: getCurrent,
        mount: mount
    };
})();
