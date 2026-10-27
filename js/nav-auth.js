// 導覽列「教師區」軟性登入閘門：未登入時隱藏 .nav-teacher 項目（獎勵板/學習歷程；教師指南與教案包 2026-10-09 起移到學習歷程總覽的「教師資源」），
// 避免學生從主頁誤入教師工具。純前端軟性遮蔽，非強加密。老師可在登入視窗修改密碼（萬用密碼見下方 MASTER）。
// apply 掛到 window.mtNavAuthApply：單元頁的導覽列是 js/reward-launcher.js 動態插入 DOM 的，
// 插入當下本檔案的初次 apply() 早跑過了，插入後要能再叫一次，判斷邏輯仍只有這一份。
(function () {
    // 教師密碼（2026-10-09 使用者定）：
    //   ・MASTER＝萬用密碼，任何時候都能登入、也能拿來修改密碼（忘了自訂密碼時用）；畫面上一律不顯示，免得學生看到
    //   ・老師在登入視窗的「🔑 修改密碼」改成自己的密碼，存雜湊在 mt_teacher_pw（這台瀏覽器；全站備份會一起帶走）
    //   純前端軟性遮蔽、非強加密：只防學生誤入，不防會看原始碼的人
    var MASTER = 'MT2026';
    var PW_KEY = 'mt_teacher_pw';
    function hashPw(pw) {   // FNV-1a 32 位元＋固定前綴：只是不讓 localStorage 直接看得到明碼
        var h = 0x811c9dc5, str = 'mt-teacher|' + pw;
        for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
        return ('0000000' + h.toString(16)).slice(-8);
    }
    function customHash() { try { return localStorage.getItem(PW_KEY) || ''; } catch (e) { return ''; } }
    // 密碼對不對的唯一判斷處：萬用密碼（大小寫都算）或老師自訂的密碼
    function pwOk(pw) {
        pw = String(pw || '').trim();
        if (!pw) return false;
        if (pw.toUpperCase() === MASTER) return true;
        var h = customHash();
        return !!h && hashPw(pw) === h;
    }
    function authed() { return localStorage.getItem('mt_teacher_auth') === '1'; }
    function apply() {
        var on = authed();
        var items = document.querySelectorAll('.nav-teacher');
        for (var i = 0; i < items.length; i++) items[i].style.display = on ? '' : 'none';
        var btns = document.querySelectorAll('.nav-login-btn');
        for (var j = 0; j < btns.length; j++) btns[j].textContent = on ? '🔒 教師登出' : '🔓 教師登入';
        // 讓頁面上其他教師專用的東西（例：主頁金婆婆彈窗的「刪除學生」分頁）跟著登入／登出收合
        try { document.dispatchEvent(new CustomEvent('mt-teacher-auth', { detail: { on: on } })); } catch (e) {}
    }
    window.mtNavAuthApply = apply;
    // 登入狀態的唯一判斷處；其他頁面程式要問「現在是不是老師」一律呼叫這支，不要自己讀 localStorage
    window.mtTeacherAuthed = authed;
    window.siteNavLogin = function () {
        if (authed()) { localStorage.removeItem('mt_teacher_auth'); apply(); return; }
        openLogin();
    };

    // ── 登入視窗（取代 prompt：要放「修改密碼」，也不再寫出預設密碼）──────────
    // 顏色三態：:root 淺色 → @media 跟隨系統 → [data-theme="dark"] 強制深色（兩塊逐字對應）
    var CSS = '' +
        ':root{--mtl-bg:#fff;--mtl-fg:#1f2937;--mtl-sub:#6b7280;--mtl-line:#d1d5db;--mtl-in:#fff;--mtl-alt:#f3f4f6;--mtl-err:#dc2626;--mtl-ok:#15803d}' +
        '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--mtl-bg:#1f2937;--mtl-fg:#f3f4f6;--mtl-sub:#9ca3af;--mtl-line:#4b5563;--mtl-in:#111827;--mtl-alt:#374151;--mtl-err:#f87171;--mtl-ok:#4ade80}}' +
        '[data-theme="dark"]{--mtl-bg:#1f2937;--mtl-fg:#f3f4f6;--mtl-sub:#9ca3af;--mtl-line:#4b5563;--mtl-in:#111827;--mtl-alt:#374151;--mtl-err:#f87171;--mtl-ok:#4ade80}' +
        '#mt-login{position:fixed;inset:0;z-index:11000;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px}' +
        '#mt-login[hidden]{display:none!important}' +
        '#mt-login .mtl-box{background:var(--mtl-bg);color:var(--mtl-fg);border-radius:14px;padding:20px 22px;width:100%;max-width:340px;box-shadow:0 10px 30px rgba(0,0,0,.3);font-family:inherit;text-align:left}' +
        '#mt-login h3{margin:0 0 12px;font-size:1.1rem;color:var(--mtl-fg)}' +
        '#mt-login label{display:block;font-size:.85rem;margin:8px 0 4px;color:var(--mtl-fg)}' +
        '#mt-login input{width:100%;box-sizing:border-box;padding:9px 10px;font-size:1rem;border:1px solid var(--mtl-line);border-radius:8px;background:var(--mtl-in);color:var(--mtl-fg);font-family:inherit}' +
        '#mt-login .mtl-row{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}' +
        '#mt-login button{padding:8px 16px;border-radius:8px;border:none;font-size:.95rem;cursor:pointer;font-family:inherit;touch-action:manipulation}' +
        '#mt-login .mtl-go{background:#4f46e5;color:#fff}' +
        '#mt-login .mtl-no{background:var(--mtl-alt);color:var(--mtl-fg)}' +
        '#mt-login .mtl-link{background:none;color:var(--mtl-sub);padding:10px 0 0;font-size:.85rem;text-decoration:underline}' +
        '#mt-login .mtl-msg{min-height:1.2em;font-size:.85rem;margin-top:8px;color:var(--mtl-err)}' +
        '#mt-login .mtl-msg.ok{color:var(--mtl-ok)}' +
        '#mt-login .mtl-change{border-top:1px dashed var(--mtl-line);margin-top:12px;padding-top:4px}' +
        '#mt-login .mtl-change[hidden]{display:none}' +
        '#mt-login .mtl-note{font-size:.78rem;color:var(--mtl-sub);margin:6px 0 0;line-height:1.5}';
    var box = null;
    function build() {
        if (box) return box;
        var st = document.createElement('style'); st.id = 'mt-login-style'; st.textContent = CSS;
        document.head.appendChild(st);
        box = document.createElement('div');
        box.id = 'mt-login'; box.hidden = true;
        box.innerHTML =
            '<form class="mtl-box" role="dialog" aria-modal="true" aria-labelledby="mtl-title" autocomplete="off">' +
            '<h3 id="mtl-title">🔓 教師登入</h3>' +
            '<label for="mtl-pw">教師密碼</label><input type="password" id="mtl-pw">' +
            '<div class="mtl-msg" id="mtl-msg" role="status"></div>' +
            '<div class="mtl-row"><button type="button" class="mtl-no" data-mtl="close">取消</button><button type="submit" class="mtl-go">登入</button></div>' +
            '<button type="button" class="mtl-link" data-mtl="toggle">🔑 修改密碼</button>' +
            '<div class="mtl-change" id="mtl-change" hidden>' +
            '<label for="mtl-old">目前的密碼</label><input type="password" id="mtl-old">' +
            '<label for="mtl-new">新密碼</label><input type="password" id="mtl-new">' +
            '<label for="mtl-new2">再輸入一次新密碼</label><input type="password" id="mtl-new2">' +
            '<p class="mtl-note">改好之後用新密碼登入。密碼存在這台電腦的瀏覽器裡。</p>' +
            '<div class="mtl-row"><button type="button" class="mtl-go" data-mtl="save">儲存新密碼</button></div>' +
            '</div></form>';
        document.body.appendChild(box);
        var $ = function (id) { return box.querySelector('#' + id); };
        var msg = function (t, ok) { var m = $('mtl-msg'); m.textContent = t; m.className = 'mtl-msg' + (ok ? ' ok' : ''); };
        box.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault();
            if (pwOk($('mtl-pw').value)) { localStorage.setItem('mt_teacher_auth', '1'); close(); apply(); }
            else { msg('密碼不正確'); $('mtl-pw').select(); }
        });
        box.addEventListener('click', function (e) {
            var act = e.target.getAttribute && e.target.getAttribute('data-mtl');
            if (e.target === box || act === 'close') close();
            else if (act === 'toggle') {
                var c = $('mtl-change'); c.hidden = !c.hidden; msg('');
                if (!c.hidden) $('mtl-old').focus();
            } else if (act === 'save') {
                var n = $('mtl-new').value.trim(), n2 = $('mtl-new2').value.trim();
                if (!pwOk($('mtl-old').value)) { msg('目前的密碼不正確'); return; }
                if (n.length < 4) { msg('新密碼至少 4 個字'); return; }
                if (n !== n2) { msg('兩次輸入的新密碼不一樣'); return; }
                try { localStorage.setItem(PW_KEY, hashPw(n)); } catch (err) { msg('存不進去（瀏覽器不允許儲存）'); return; }
                $('mtl-old').value = $('mtl-new').value = $('mtl-new2').value = '';
                $('mtl-change').hidden = true;
                msg('✅ 新密碼已儲存，請用新密碼登入', true);
                $('mtl-pw').value = ''; $('mtl-pw').focus();
            }
        });
        box.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
        return box;
    }
    function openLogin() {
        var b = build();
        b.querySelectorAll('input').forEach(function (i) { i.value = ''; });
        b.querySelector('#mtl-change').hidden = true;
        b.querySelector('#mtl-msg').textContent = '';
        b.hidden = false;
        b.querySelector('#mtl-pw').focus();
    }
    function close() { if (box) box.hidden = true; }

    // 導覽列「🌟 成就與寵物」：還沒有任何學生時，reward/index.html?page=growth 沒有人可以開，
    // 舊行為是先整頁導過去、渲染出「優良表現獎勵板」底頁，過 300ms 才跳出提示，使用者會先看到
    // 不該看到的那個頁面。改在點擊當下（尚未導航）就判斷，沒有學生就攔下、只留下彈窗。
    function hasStudents() {
        try { return JSON.parse(localStorage.getItem('rewardSystemStudents') || '[]').length > 0; }
        catch (e) { return false; }
    }
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('.nav-growth');
        if (!a || hasStudents()) return;
        e.preventDefault();
        alert('目前還沒有學生～請先在「主頁 → 金婆婆」建立學生。');
    }, true);

    // ── 設定頁導覽列（24 單元設定頁、生活情境對話的情境頁／設定頁共用；2026-10-10 從 reward-launcher.js 搬來）──
    // 唯一定義處：連結清單與樣式只寫在這裡。mtUnitNav(prefix) 回傳 <nav>，prefix＝到站根的相對路徑（'../'）。
    // 2026-10-10 使用者定：項目與一日金錢冒險的導覽列一致——主頁／生活情境對話／一日金錢冒險／小遊戲／成就與寵物
    // （＋登入後 🏆／📊）／深淺色切換／教師登入。第三欄＝額外 class；nav-teacher／nav-growth 的顯示與否交給上面的 apply()。
    var UNIT_NAV_LINKS = [
        ['index.html', '🏠 主頁(金錢核心課程)', ''],
        ['index.html?hero=chatdog', '💬 生活情境對話', ''],
        ['index.html?hero=doctor', '🗺️ 一日金錢冒險', ''],
        ['index.html?hero=detective', '🎮 小遊戲', ''],
        ['reward/index.html?page=growth', '🌟 成就與寵物', 'nav-growth'],
        ['reward/index.html', '🏆 優良表現獎勵板', 'nav-teacher'],
        ['teacher.html', '📊 學習歷程總覽', 'nav-teacher']
    ];
    var UNIT_NAV_CSS =
        '.mt-unit-nav{align-self:stretch;flex:0 0 auto;width:100%;box-sizing:border-box;' +
        'position:sticky;top:0;z-index:10000;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;' +
        'padding:9px 14px;margin:0 0 10px;background:linear-gradient(135deg,#1e3a5f,#2563eb);box-shadow:0 2px 10px rgba(0,0,0,.12);}' +
        '.mt-unit-nav a,.mt-unit-nav .theme-toggle-btn{color:#fff;text-decoration:none;font-weight:700;font-size:.88rem;padding:7px 14px;' +
        'border-radius:10px;background:rgba(255,255,255,.14);border:none;white-space:nowrap;line-height:1.5;font-family:inherit;cursor:pointer;}' +
        '.mt-unit-nav a:hover,.mt-unit-nav .theme-toggle-btn:hover{background:rgba(255,255,255,.3);}' +
        '.mt-unit-nav .nav-login-btn{color:#fff;font-weight:700;font-size:.88rem;padding:7px 14px;line-height:1.5;' +
        'border-radius:10px;background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.45);' +
        'cursor:pointer;font-family:inherit;white-space:nowrap;}';
    window.mtUnitNav = function (prefix) {
        prefix = prefix || '';
        if (!document.getElementById('mt-unit-nav-style')) {
            var st = document.createElement('style'); st.id = 'mt-unit-nav-style'; st.textContent = UNIT_NAV_CSS;
            document.head.appendChild(st);
        }
        var nav = document.createElement('nav');
        nav.className = 'mt-unit-nav';
        nav.setAttribute('aria-label', '網站導覽');
        nav.innerHTML = UNIT_NAV_LINKS.map(function (l) {
            return '<a href="' + prefix + l[0] + '"' + (l[2] ? ' class="' + l[2] + '"' : '') + '>' + l[1] + '</a>';
        }).join('') + '<button type="button" class="theme-toggle-btn"></button>'
            + '<button type="button" class="nav-login-btn" onclick="siteNavLogin()">' + (authed() ? '🔒 教師登出' : '🔓 教師登入') + '</button>';
        // 深淺色鈕的字與點擊由 js/theme-switch.js 負責；nav 插進 DOM 之後才綁得到 → 下一輪再叫它
        setTimeout(function () { if (window.MTTheme && window.MTTheme.refresh) window.MTTheme.refresh(); }, 0);
        return nav;
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
    else apply();
})();
