/**
 * 獎勵系統啟動器
 * 可從任何頁面呼叫獎勵系統，並傳送學生表現分數
 */

// ── 主站 PWA：註冊 Service Worker（各單元頁皆載入本檔 → 一處註冊涵蓋全站）──
// 以本檔（js/reward-launcher.js）位置推站根：上一層即站根，sw.js 在站根、scope=站根。
(function registerMainSW() {
  try {
    if (!('serviceWorker' in navigator)) return;
    const cs = document.currentScript;
    if (!cs || !cs.src) return;
    const swUrl = new URL('../sw.js', cs.src).href;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swUrl).catch(() => {});
    });
  } catch (e) {}
})();

// ── 測驗總結頁「🎁 開啟獎勵系統」只給老師（2026-10-03 使用者定：給獎勵是老師的事，教師沒登入就不出現；桌面／觸控都一樣）──
// 24 單元的總結頁都載入本檔，按鈕外框只有兩種：A／C／F＝.reward-btn-container、B＝.b-res-reward-wrap。
// 預設藏起來，<html> 有 .mt-teacher 才顯示；「是不是老師」只問 js/nav-auth.js 的 mtTeacherAuthed()，
// 並聽它的 mt-teacher-auth 事件（導覽列登入／登出當下就跟著變），不自己讀 localStorage。
(function teacherOnlyRewardButton() {
  try {
    const st = document.createElement('style');
    st.id = 'mt-teacher-only-reward-style';
    st.textContent = 'html:not(.mt-teacher) :is(.reward-btn-container, .b-res-reward-wrap){display:none !important;}';
    (document.head || document.documentElement).appendChild(st);
    const sync = function () {
      const on = !!(window.mtTeacherAuthed && window.mtTeacherAuthed());
      document.documentElement.classList.toggle('mt-teacher', on);
    };
    document.addEventListener('mt-teacher-auth', sync);
    window.addEventListener('storage', function (e) { if (e.key === 'mt_teacher_auth') sync(); });   // 別的分頁登入／登出
    if (window.mtTeacherAuthed) { sync(); return; }
    const cs = document.currentScript;
    if (!cs || !cs.src) return;
    const src = new URL('nav-auth.js', cs.src).href;
    if ([].some.call(document.scripts, function (s) { return s.src === src; })) return;   // 已載入中：等它的 mt-teacher-auth
    const s = document.createElement('script');
    s.src = src;
    s.onload = sync;
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {}
})();

const RewardLauncher = {
    // 獎勵系統視窗參考
    rewardWindow: null,

    // 預設設定
    config: {
        windowWidth: 1200,
        windowHeight: 800,
        rewardPagePath: 'reward/index.html'
    },

    /**
     * 初始化 - 自動計算相對路徑
     */
    init() {
        // 根據當前頁面位置計算 reward 頁面的相對路徑
        const currentPath = window.location.pathname;

        // 如果在子目錄中，調整路徑
        if (currentPath.includes('/html/') || currentPath.includes('/adventure/') || currentPath.includes('/dialogue/')) {
            this.config.rewardPagePath = '../reward/index.html';
        } else {
            this.config.rewardPagePath = 'reward/index.html';
        }

        console.log('🎁 獎勵系統啟動器已初始化');
    },

    /**
     * 開啟獎勵系統視窗
     * @returns {Window} 獎勵視窗參考
     */
    open() {
        // 只給老師（見檔頭 teacherOnlyRewardButton）：按鈕藏起來之外再擋一層，沒登入就不開
        if (window.mtTeacherAuthed && !window.mtTeacherAuthed()) return null;
        // 如果視窗已開啟且未關閉，則聚焦
        if (this.rewardWindow && !this.rewardWindow.closed) {
            this.rewardWindow.focus();
            return this.rewardWindow;
        }

        // 計算視窗位置（螢幕中央）
        const left = (screen.width - this.config.windowWidth) / 2;
        const top = (screen.height - this.config.windowHeight) / 2;

        // 開啟新視窗
        this.rewardWindow = window.open(
            this.config.rewardPagePath,
            'RewardSystem',
            `width=${this.config.windowWidth},height=${this.config.windowHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        if (!this.rewardWindow) {
            alert('無法開啟獎勵系統視窗，請檢查瀏覽器是否阻擋彈出視窗。');
            return null;
        }

        console.log('🎁 獎勵系統視窗已開啟');
        return this.rewardWindow;
    },

    /**
     * 關閉獎勵系統視窗
     */
    close() {
        if (this.rewardWindow && !this.rewardWindow.closed) {
            this.rewardWindow.close();
            this.rewardWindow = null;
            console.log('🎁 獎勵系統視窗已關閉');
        }
    },

    /**
     * 答對一題，累積1分
     * 這是最常用的方法 - 每完成/答對一題就呼叫一次
     * @param {string} activityName - 活動名稱（可選）
     */
    addOnePoint(activityName = '') {
        const source = activityName || document.title || '測驗';
        this.sendPoints(1, `答對一題`);
    },

    /**
     * 傳送加分訊息給獎勵系統（累積到暫存區，等老師確認後發放）
     * @param {number} points - 要加的分數（正數加分，負數扣分）
     * @param {string} reason - 加分原因（可選）
     */
    sendPoints(points, reason = '') {
        // 將分數存入 localStorage，讓獎勵系統讀取
        const pendingRewards = JSON.parse(localStorage.getItem('pendingRewards') || '[]');
        const source = document.title || window.location.pathname;

        pendingRewards.push({
            points: points,
            reason: reason,
            timestamp: Date.now(),
            source: source
        });
        localStorage.setItem('pendingRewards', JSON.stringify(pendingRewards));

        // 計算目前累積的總分
        const totalPending = pendingRewards.reduce((sum, r) => sum + r.points, 0);
        console.log(`🎁 已記錄: +${points} 分 (${source}) | 目前累積待發放: ${totalPending} 分`);

        // 如果獎勵視窗已開啟，通知它更新
        if (this.rewardWindow && !this.rewardWindow.closed) {
            this.rewardWindow.postMessage({
                type: 'REWARD_UPDATE',
                points: points,
                reason: reason
            }, '*');
        }
    },

    /**
     * 根據活動表現自動計算並發送獎勵
     * @param {Object} performance - 表現數據
     * @param {number} performance.score - 得分 (0-100)
     * @param {number} performance.accuracy - 正確率 (0-1)
     * @param {number} performance.timeBonus - 時間獎勵 (0-1)
     * @param {string} performance.activityName - 活動名稱
     */
    rewardByPerformance(performance) {
        let totalPoints = 0;
        let reasons = [];

        // 基於分數的獎勵
        if (performance.score !== undefined) {
            if (performance.score >= 90) {
                totalPoints += 3;
                reasons.push('優異成績');
            } else if (performance.score >= 70) {
                totalPoints += 2;
                reasons.push('良好成績');
            } else if (performance.score >= 60) {
                totalPoints += 1;
                reasons.push('及格');
            }
        }

        // 基於正確率的獎勵
        if (performance.accuracy !== undefined) {
            if (performance.accuracy >= 0.95) {
                totalPoints += 2;
                reasons.push('高正確率');
            } else if (performance.accuracy >= 0.8) {
                totalPoints += 1;
                reasons.push('正確率佳');
            }
        }

        // 時間獎勵
        if (performance.timeBonus !== undefined && performance.timeBonus > 0) {
            totalPoints += Math.floor(performance.timeBonus);
            reasons.push('快速完成');
        }

        // 發送獎勵
        if (totalPoints > 0) {
            const activityName = performance.activityName || '活動';
            this.sendPoints(totalPoints, `${activityName}: ${reasons.join(', ')}`);
        }

        return totalPoints;
    },

    /**
     * 取得待處理的獎勵列表
     * @returns {Array} 待處理獎勵
     */
    getPendingRewards() {
        return JSON.parse(localStorage.getItem('pendingRewards') || '[]');
    },

    /**
     * 取得目前累積的待發放總分
     * @returns {number} 總分數
     */
    getPendingPoints() {
        const rewards = this.getPendingRewards();
        return rewards.reduce((sum, r) => sum + r.points, 0);
    },

    /**
     * 清除待處理的獎勵
     */
    clearPendingRewards() {
        localStorage.removeItem('pendingRewards');
        console.log('🎁 已清除待處理獎勵');
    }
};

// ── 單元設定頁：注入專案導覽列 ＋ 隱藏設定頁的「開啟獎勵系統」按鈕 ──
// 集中一處涵蓋全部 24 單元（皆載入本檔、皆用 #settings-reward-link、皆渲染於 #app）。
// 導覽列注入 #app 首位＝設定頁專屬；遊戲開始 app.innerHTML 重繪即自然移除。
// 教師區項目／成就與寵物的「沒有學生就攔下」判斷，跟主頁（index.html）共用同一份規則
// （class="nav-teacher"／"nav-growth"，邏輯只寫在 js/nav-auth.js），這裡只負責標記，不重寫判斷。
(function unitSettingsNav() {
    if (!location.pathname.includes('/html/')) return;   // 僅作用於單元頁
    const NAV_ID = 'unit-site-nav';
    // 連結清單與樣式的唯一定義在 js/nav-auth.js 的 mtUnitNav（生活情境對話的情境頁／設定頁也用同一支）
    // nav-auth.js 平常只在自己所在頁面的 DOMContentLoaded 套用一次；這裡的導覽列是之後才動態插進
    // DOM 的，插入當下要主動再叫它套一次。單元頁原本沒載入這支檔案，只有這裡需要才動態補上。
    function ensureNavAuthLoaded(cb) {
        if (window.mtUnitNav) { cb(); return; }
        const existing = document.querySelector('script[src$="nav-auth.js"]');   // 檔頭的「獎勵鈕只給老師」可能已用絕對網址載入
        if (existing) { existing.addEventListener('load', cb, { once: true }); return; }
        const s = document.createElement('script');
        s.src = '../js/nav-auth.js';
        s.onload = cb;
        document.head.appendChild(s);
    }
    function hideRewardRow() {
        const link = document.getElementById('settings-reward-link');
        if (!link || link.dataset.navHidden) return;
        let el = link.parentElement;
        for (let i = 0; i < 5 && el; i++, el = el.parentElement) {
            const lab = el.querySelector('label');
            if (lab && /獎勵系統/.test(lab.textContent)) { el.style.display = 'none'; break; }
        }
        link.dataset.navHidden = '1';   // 註記：只隱藏一次（且 link 留在 DOM 當「設定頁」訊號）
    }
    function sync() {
        if (!document.getElementById('settings-reward-link')) return;   // 設定頁訊號（遊戲畫面不含）
        hideRewardRow();
        const app = document.getElementById('app');
        if (app && !app.querySelector(':scope > #' + NAV_ID)) {
            if (!window.mtUnitNav) { ensureNavAuthLoaded(run); return; }   // 產生器在 nav-auth.js，載入後再跑一次
            const nav = window.mtUnitNav('../');
            nav.id = NAV_ID;
            app.insertBefore(nav, app.firstChild);
            window.mtNavAuthApply();
        }
    }
    const run = function () { try { sync(); } catch (e) {} };
    try { new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    run();
    setTimeout(run, 300);
})();

// 自動初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RewardLauncher.init());
} else {
    RewardLauncher.init();
}

// 匯出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RewardLauncher;
}
