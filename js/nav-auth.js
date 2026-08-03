// 導覽列「教師區」軟性登入閘門：未登入時隱藏 .nav-teacher 項目（獎勵板/學習歷程/教師指南/教案包），
// 避免學生從主頁誤入教師工具。純前端軟性遮蔽，非強加密。預設密碼可自行更換。
// apply 掛到 window.mtNavAuthApply：單元頁的導覽列是 js/reward-launcher.js 動態插入 DOM 的，
// 插入當下本檔案的初次 apply() 早跑過了，插入後要能再叫一次，判斷邏輯仍只有這一份。
(function () {
    var PW = 'mt2026';   // 預設教師密碼（可改）
    function authed() { return localStorage.getItem('mt_teacher_auth') === '1'; }
    function apply() {
        var on = authed();
        var items = document.querySelectorAll('.nav-teacher');
        for (var i = 0; i < items.length; i++) items[i].style.display = on ? '' : 'none';
        var btns = document.querySelectorAll('.nav-login-btn');
        for (var j = 0; j < btns.length; j++) btns[j].textContent = on ? '🔒 教師登出' : '🔓 教師登入';
    }
    window.mtNavAuthApply = apply;
    window.siteNavLogin = function () {
        if (authed()) { localStorage.removeItem('mt_teacher_auth'); apply(); return; }
        var pw = prompt('請輸入教師密碼（預設 mt2026）：');
        if (pw === null) return;
        if (pw === PW) { localStorage.setItem('mt_teacher_auth', '1'); apply(); }
        else alert('密碼不正確');
    };

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

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
    else apply();
})();
