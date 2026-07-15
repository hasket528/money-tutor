// =================================================================
// FILE: js/student-badge.js
// DESC: 在各單元「遊戲畫面標題列右側」顯示目前選擇的學生（圓形頭像框）。
//       與 reward / dialogue / 金隊長基地共用同一份名冊與目前學生：
//       localStorage.rewardSystemStudents（含 photo base64）＋ sp_currentStudent。
//       有照片→顯示照片；沒照片→圓框內顯示名字。未選學生→不顯示。
// USAGE: 各單元 HTML 引入本檔即可（放 reward-launcher.js 之後）。
//        標題列由各單元 JS 重繪，故用 MutationObserver 於重繪後自動補插，零侵入、不動單元邏輯。
// =================================================================
(function () {
    'use strict';

    // 各系列標題列「右側容器」錨點（依專案現況）：
    //  .title-bar-right      A1/A2/A4/A6、C1~C6、F1~F6
    //  .atm-title-bar-right  A5
    //  .b-header-right       B1~B6
    //  .mcdonalds-title-bar > div:last-child   A3（右側容器無 class）
    const ANCHORS = [
        '.title-bar-right',
        '.atm-title-bar-right',
        '.b-header-right',
        '.mcdonalds-title-bar > div:last-child',
    ];

    function getStudent() {
        try {
            const cur = JSON.parse(localStorage.getItem('sp_currentStudent') || 'null');
            if (!cur || !cur.name) return null;
            const roster = JSON.parse(localStorage.getItem('rewardSystemStudents') || '[]');
            return roster.find(s => String(s.id) === String(cur.id)) || cur;   // 名冊找得到→帶 photo
        } catch { return null; }
    }

    function injectStyle() {
        if (document.getElementById('student-badge-style')) return;
        const st = document.createElement('style');
        st.id = 'student-badge-style';
        st.textContent = `
            .student-badge {
                width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
                border: 2.5px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                overflow: hidden; margin-left: 8px; background: #fff7ed;
                display: inline-flex; align-items: center; justify-content: center;
                vertical-align: middle; user-select: none;
            }
            .student-badge img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .student-badge.no-photo {
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                color: #7c2d12; font-weight: 900; line-height: 1; text-align: center;
            }
        `;
        document.head.appendChild(st);
    }

    function makeBadge(stu) {
        const el = document.createElement('div');
        el.className = 'student-badge';
        el.title = '目前學生：' + stu.name;
        el.setAttribute('aria-label', '目前學生：' + stu.name);
        if (stu.photo) {
            const img = document.createElement('img');
            img.src = stu.photo;
            img.alt = stu.name;
            el.appendChild(img);
        } else {
            el.classList.add('no-photo');
            el.textContent = stu.name;
            el.style.fontSize = stu.name.length <= 2 ? '15px' : (stu.name.length === 3 ? '12px' : '10px');
        }
        return el;
    }

    function ensure() {
        const stu = getStudent();
        if (!stu) return;
        injectStyle();
        ANCHORS.forEach(sel => {
            let anchors;
            try { anchors = document.querySelectorAll(sel); } catch { return; }
            anchors.forEach(anchor => {
                if (!anchor.querySelector(':scope > .student-badge')) anchor.appendChild(makeBadge(stu));
            });
        });
    }

    function refreshAll() {   // 學生換人（他分頁改的）→ 拆掉重插
        document.querySelectorAll('.student-badge').forEach(e => e.remove());
        ensure();
    }

    // 標題列由各單元 JS 於切換畫面時重繪 → 用 MutationObserver 補插。
    // ensure() 只在缺徽章時才 append，不會與 observer 形成迴圈。
    const mo = new MutationObserver(ensure);
    function start() {
        ensure();
        mo.observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();

    window.addEventListener('storage', (e) => {
        if (e.key === 'sp_currentStudent' || e.key === 'rewardSystemStudents') refreshAll();
    });
})();
