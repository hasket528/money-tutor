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
