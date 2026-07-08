// 導覽列「教師區」軟性登入閘門：未登入時隱藏 .nav-teacher 項目（獎勵板/學習歷程/教師指南/教案包），
// 避免學生從主頁誤入教師工具。純前端軟性遮蔽，非強加密。預設密碼可自行更換。
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
    window.siteNavLogin = function () {
        if (authed()) { localStorage.removeItem('mt_teacher_auth'); apply(); return; }
        var pw = prompt('請輸入教師密碼（預設 mt2026）：');
        if (pw === null) return;
        if (pw === PW) { localStorage.setItem('mt_teacher_auth', '1'); apply(); }
        else alert('密碼不正確');
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
    else apply();
})();
