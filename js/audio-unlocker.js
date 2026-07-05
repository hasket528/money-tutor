// =================================================================
// FILE: js/AudioUnlocker.js
// DESC: 解決行動裝置瀏覽器音訊自動播放限制的通用工具
// USAGE: 在所有遊戲主程式之前引入此JS檔案。
// 最後修正: 2025.09.03 - 使用內嵌Base64靜音音訊，提高解鎖成功率
// =================================================================

(function() {
    // 使用立即執行函式(IIFE)避免污染全域變數
    const AudioUnlocker = {
        isUnlocked: false,
        logPrefix: '[AudioUnlocker]',
        debug: true,

        log(message, data = null) {
            if (!this.debug) return;
            const timestamp = new Date().toLocaleTimeString();
            console.log(`${this.logPrefix} ${timestamp}: ${message}`, data || '');
        },

        // [核心修正] 內嵌一個微小、有效的靜音MP3的Base64數據
        // 這可以避免任何外部檔案載入失敗的問題
        silentAudioSrc: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA',

        async unlock() {
            if (this.isUnlocked) {
                this.log('✅ 音頻已解鎖，無需重複操作');
                return true;
            }

            this.log('🔓 嘗試解鎖音頻播放權限...');

            // 創建一個統一的 AudioContext
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 檢查 AudioContext 狀態
            // 如果在互動前狀態不是 'running'，需要在互動後恢復
            if (audioContext.state === 'suspended') {
                try {
                    await audioContext.resume();
                    this.log('🎵 AudioContext 已從 suspended 狀態恢復');
                } catch (e) {
                    this.log('⚠️ 恢復 AudioContext 失敗', e);
                }
            }

            // 透過播放一個極短的無聲音頻來觸發音頻解鎖
            try {
                const audio = new Audio();
                audio.src = this.silentAudioSrc;
                audio.volume = 0; // 確保靜音
                audio.play()
                    .then(() => {
                        this.isUnlocked = true;
                        this.log('✅ 音頻權限解鎖成功！');
                        // 觸發一個全域事件，讓其他JS檔案知道音訊已解鎖
                        window.dispatchEvent(new CustomEvent('audiounlocked'));
                    })
                    .catch((error) => {
                        // 雖然失敗，但可能是因為 audioContext.resume() 已成功，所以仍標記為 unlocked
                        this.isUnlocked = true; 
                        this.log('⚠️ 透過 HTMLAudioElement 解鎖失敗，但繼續執行', error.message);
                    });

                return true;
            } catch (error) {
                this.isUnlocked = true; // 設為true以避免重複嘗試
                this.log('❌ 音頻解鎖過程中發生未知錯誤', error);
                return false;
            }
        },

        init() {
            this.log('📱 AudioUnlocker 模組已載入');
            // 定義一個事件列表，監聽使用者的首次互動
            const events = ['touchstart', 'touchend', 'click', 'keydown', 'mousedown'];
            
            const unlockHandler = (event) => {
                this.log(`🖱️ 偵測到使用者互動: ${event.type}`);
                this.unlock();
                // 解鎖後，移除所有監聽器，這個動作只執行一次
                events.forEach(e => document.body.removeEventListener(e, unlockHandler));
            };

            this.log('🎯 初始化自動音頻解鎖監聽器');
            events.forEach(e => document.body.addEventListener(e, unlockHandler, { once: true, capture: true }));
        }
    };

    // 將 AudioUnlocker 附加到 window 物件上，使其可被外部呼叫
    window.AudioUnlocker = AudioUnlocker;
    // 自動初始化
    AudioUnlocker.init();
})();