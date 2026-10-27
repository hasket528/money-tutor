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
    // ⭐ 學生挑的展示品（寵物／徽章／寶物）放在頭像右邊：資料與畫法在 js/showcase.js，這裡自動載入（各單元頁不用另外掛）
    const SELF_SRC = document.currentScript && document.currentScript.src;
    function loadShowcase() {
        if (window.MTShowcase || !SELF_SRC || document.getElementById('mt-showcase-js')) return;
        const sc = document.createElement('script');
        sc.id = 'mt-showcase-js';
        sc.src = new URL('showcase.js', SELF_SRC).href;
        sc.onload = () => refreshAll();
        document.head.appendChild(sc);
    }

    // 各系列標題列「標題文字欄位」（圓框插在欄位內、緊鄰標題文字右邊）：
    //  .title-bar-center                        A1/A2/A4/A6、C1~C6、F1~F6
    //  .atm-title-bar-center                    A5（步驟標題，textContent 更新會清掉徽章→observer 自動補回）
    //  .b-header-center                         B1~B6
    //  .mcdonalds-title-bar > div:nth-child(2)  A3（中欄步驟文字，無 class）
    const ANCHORS = [
        '.title-bar-center',
        '.atm-title-bar-center',
        '.b-header-center',
        '.mcdonalds-title-bar > div:nth-child(2)',
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
            /* 有徽章時，標題文字欄位轉 flex 置中 → 圓框緊鄰標題文字右邊（不改動無徽章時的版面） */
            .title-bar-center:has(> .student-badge),   /* 展示品 .mt-sc 接在頭像後面，同一列 */
            .atm-title-bar-center:has(> .student-badge),
            .b-header-center:has(> .student-badge),
            .mcdonalds-title-bar > div:nth-child(2):has(> .student-badge) {
                display: flex; align-items: center; justify-content: center; gap: 2px;
            }
            .student-badge img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .student-badge.no-photo {
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                color: #7c2d12; font-weight: 900; line-height: 1; text-align: center;
            }
            .student-badge { cursor: pointer; }
            /* 點徽章 → 學生資訊彈窗：樣式與程式都在 js/showcase.js（studentModal） */
        `;
        document.head.appendChild(st);
    }

    // 學生資訊彈窗：唯一定義在 js/showcase.js 的 studentModal（獎勵板點照片也用同一個，2026-10-07 統一）
    function showModal() {
        const stu = getStudent();   // 開啟當下重新讀，確保是最新資料
        if (stu && window.MTShowcase) MTShowcase.studentModal(stu);
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
        el.addEventListener('click', (e) => { e.stopPropagation(); showModal(); });
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
                if (!anchor.querySelector(':scope > .student-badge')) {
                    anchor.appendChild(makeBadge(stu));
                    const sc = window.MTShowcase && MTShowcase.el(stu.id, 'sc-head');
                    if (sc) { sc.addEventListener('click', (e) => { e.stopPropagation(); showModal(); }); anchor.appendChild(sc); }
                }
            });
        });
    }

    function refreshAll() {   // 學生換人（他分頁改的）→ 拆掉重插
        document.querySelectorAll('.student-badge, .mt-sc.sc-head').forEach(e => e.remove());
        ensure();
    }

    // 標題列由各單元 JS 於切換畫面時重繪 → 用 MutationObserver 補插。
    // ensure() 只在缺徽章時才 append，不會與 observer 形成迴圈。
    const mo = new MutationObserver(ensure);
    function start() {
        loadShowcase();
        ensure();
        mo.observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();

    window.addEventListener('storage', (e) => {
        if (e.key === 'sp_currentStudent' || e.key === 'rewardSystemStudents' || (e.key || '').startsWith('mt_showcase_')) refreshAll();
    });
})();
