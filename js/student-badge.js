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
            .student-badge { cursor: pointer; }
            /* 點徽章 → 學生資訊彈窗（z-index 高於全站遮罩 10100） */
            .sbm-overlay {
                position: fixed; inset: 0; z-index: 10200;
                background: rgba(0,0,0,0.55);
                display: flex; align-items: center; justify-content: center;
            }
            .sbm-card {
                background: #fff; border-radius: 20px; padding: 22px 22px 18px;
                box-shadow: 0 12px 40px rgba(0,0,0,0.35);
                display: flex; flex-direction: column; align-items: center; gap: 14px;
                max-width: 88vw;
            }
            .sbm-photo {
                width: 300px; height: 300px; max-width: 72vw; max-height: 72vw;
                border-radius: 18px; overflow: hidden; background: #fff7ed;
                display: flex; align-items: center; justify-content: center;
            }
            .sbm-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .sbm-avatar {
                width: 100%; height: 100%;
                background: linear-gradient(135deg, #fde68a, #f59e0b);
                display: flex; align-items: center; justify-content: center;
                font-size: 130px; line-height: 1;
            }
            .sbm-name {
                font-size: 1.5rem; font-weight: 900; color: #7c2d12;
                text-align: center; line-height: 1.3; word-break: break-all;
            }
        `;
        document.head.appendChild(st);
    }

    // 學生資訊彈窗：有照片→300×300 照片＋名字；沒照片→虛擬頭像佔位＋名字。點任意處關閉。
    function showModal() {
        const stu = getStudent();   // 開啟當下重新讀，確保是最新資料
        if (!stu) return;
        injectStyle();
        document.querySelector('.sbm-overlay')?.remove();
        const overlay = document.createElement('div');
        overlay.className = 'sbm-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-label', '學生資訊：' + stu.name);
        const photoHTML = stu.photo
            ? '<img alt="">'
            : '<div class="sbm-avatar">👤</div>';
        overlay.innerHTML = `
            <div class="sbm-card">
              <div class="sbm-photo">${photoHTML}</div>
              <div class="sbm-name"></div>
            </div>`;
        if (stu.photo) overlay.querySelector('img').src = stu.photo;
        overlay.querySelector('.sbm-name').textContent = stu.name;
        overlay.addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
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
