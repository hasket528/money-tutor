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
        debug: false,   // 關閉 console 偵測訊息（需除錯時改回 true）

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

            // [2026-07] 喚醒 speechSynthesis：行動瀏覽器會擋「非手勢當下觸發」的即時語音（TTS），
            // 在首次手勢當下講一句靜音話即可解鎖——之後單元裡自動/延遲觸發的即時 TTS 才播得出來。
            // 就算單元隨後 speechSynthesis.cancel() 也不影響解鎖效果（在手勢內呼叫過 speak 即算數）。
            try {
                if (window.speechSynthesis && 'SpeechSynthesisUtterance' in window) {
                    const u = new SpeechSynthesisUtterance('。');
                    u.volume = 0;
                    window.speechSynthesis.speak(u);
                    this.log('🗣️ speechSynthesis 已喚醒');
                }
            } catch (e) {
                this.log('⚠️ speechSynthesis 喚醒失敗（不影響音訊解鎖）', e);
            }

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

// =================================================================
// TTS 中文語音守門（2026-07-15；2026-07-25 改雅婷第一順位）：統一全站「即時語音」。
// 為何雅婷第一：雅婷是 Windows 內建的「本機離線」zh-TW 語音，Web Speech（瀏覽器即時 TTS）
//   抓得到、最可靠；曉臻是 Edge/Azure 的「雲端」語音，通常「不」出現在 Web Speech 清單，
//   即時 TTS 叫不到 → 原本把曉臻放第一會失效、退到怪聲音（對話完成頁曾聽到怪音即此因）。
// 全站語音順序＝ ①預錄音檔（各模組自行播放，不經過這裡）
//              → ②微軟 雅婷 Yating（本機語音，第一順位）→ 微軟 曉臻 HsiaoChen（若有）
//              → ③Google 國語（臺灣）→ ④任何 zh-TW → ⑤任何中文 → ⑥都沒有則 lang=zh-TW 交系統挑。
// 攔截 speechSynthesis.speak：中文語句「沒指定語音、或被指定了非中文聲」時按上述順序補派，
// 保證中文用可靠的中文聲，不被英文等唸成「不知名語言」。
// ⚠️ 2026-08-02 血的教訓：**呼叫端已指定中文語音時一律尊重、不蓋**。
//   對話模組會依角色性別指定男聲/女聲（店員哥哥→Zhiwei/雲哲、旁白→曉臻），
//   舊版無條件蓋成雅婷 → 男店員永遠是女聲，整整一輪除錯都在找這個——
//   而且把 dialogue/ 單獨當根目錄起測試伺服器時本檔 404 不生效，永遠重現不了；
//   要驗證務必用整站根目錄（啟動本機伺服器.bat 的方式）。
// （預錄音檔＝角色指定聲不經此處，維持不變。）
// =================================================================
(function () {
    if (!window.speechSynthesis || !('SpeechSynthesisUtterance' in window)) return;
    const synth = window.speechSynthesis;
    const hasCJK = (s) => /[㐀-鿿豈-﫿]/.test(s || '');
    const isZh   = (v) => !!(v && v.lang && /^zh/i.test(String(v.lang).replace('_', '-')));

    function pickZhVoice() {
        const vs = synth.getVoices() || [];
        return vs.find(v => /Yating/i.test(v.name)) ||          // ① 微軟雅婷（Windows 本機／Edge Online）＝專案第一順位（Web Speech 最可靠）
               vs.find(v => /雅婷/.test(v.name)) ||
               vs.find(v => /HsiaoChen/i.test(v.name)) ||                                  // ② 微軟曉臻（Edge Online）
               vs.find(v => /曉臻|晓臻/.test(v.name)) ||
               vs.find(v => /google/i.test(v.name) && /^zh[-_]TW/i.test(v.lang || '')) ||  // ③ Google 台灣
               vs.find(v => v.name === 'Google 國語（臺灣）') ||
               vs.find(v => /^zh[-_]TW/i.test(v.lang || '')) ||                            // ④ 任何 zh-TW
               vs.find(isZh) ||                                                            // ⑤ 任何中文
               null;
    }

    // ── Apple 聲音升級（2026-10-02）：iPad／iPhone／Mac 的同一位聲音有一般／加強版／高音質三種，
    //    語言都是 zh-TW，各單元「找第一個 zh-TW」常抓到一般版，使用者下載了高音質也聽不到。
    //    先換成**同一位、同一語言**的較高音質版本（美佳一般版 → 美佳高音質）；找不到時見下方 crossPersonOk。
    //    Windows／Android 的聲音沒有這種標記 → 不會有任何變化。
    //    voiceURI 範例：com.apple.voice.compact.zh-TW.Meijia／….enhanced.…／….premium.…；
    //    舊版：com.apple.ttsbundle.Mei-Jia-compact／-premium；名稱可能帶「(Enhanced)」「（加強版）」「（高音質）」。
    const appleTier = (v) => {
        const s = (v.voiceURI || '') + ' ' + (v.name || '');
        if (/premium|高音質|高品質|優質/i.test(s)) return 3;
        if (/enhanced|加強|增強/i.test(s)) return 2;
        // Eloquence 家族（Shelley、Reed、Grandma…，com.apple.eloquence.*）是最機械的舊引擎，排在一切之下。
        // 2026-10-02 iPad 實測：清單上美佳永遠只有一個 com.apple.compact.zh-TW.Meijia，名稱也沒標高音質，
        //   但下載了高音質後指定它唸的就是高音質——所以光靠標記分不出來，要把 Eloquence 降級，
        //   單元抓到 Shelley 時才會換成美佳。
        if (/com\.apple\.eloquence\./i.test(v.voiceURI || '')) return 0;
        return 1;
    };
    const appleBase = (v) => {
        const uri = v.voiceURI || '';
        const m = uri.match(/com\.apple\.(?:voice\.(?:compact|enhanced|premium)\.[^.]+\.|ttsbundle\.)([^.]+?)(?:-(?:compact|premium|enhanced))?$/i);
        const key = m ? m[1] : (v.name || '').replace(/\s*[（(][^）)]*[）)]\s*$/, '');
        return key.replace(/[-\s]/g, '').toLowerCase();
    };
    // 2026-10-02 iPad 實測：美佳（高音質）已下載、直接指定也唸得出來，但單元「找第一個 zh-TW」抓到的是
    //   **別位**低音質聲音（不是美佳），同一位升級永遠對不上。所以：同一位找不到更好的，而目前是一般音質、
    //   同語言卻有加強版／高音質的聲音 → 換成最好的那位（同分優先美佳）。
    //   對話模組（/dialogue/）例外：那裡的聲音是依角色挑的，換人會變聲，只做同一位升級。
    const isMeijia = (c) => /meijia|mei-jia|美佳/i.test((c.voiceURI || '') + (c.name || ''));
    const crossPersonOk = !/\/dialogue\//.test(location.pathname);
    function upgradeApple(v) {
        const base = appleBase(v), tier = appleTier(v);
        if (tier === 3) return v;
        const all = synth.getVoices() || [];
        let best = v, bestTier = tier;
        for (const c of all) {
            if (c === v || c.lang !== v.lang || !base || appleBase(c) !== base) continue;
            const t = appleTier(c);
            if (t > bestTier) { best = c; bestTier = t; }
        }
        if (best === v && tier <= 1 && crossPersonOk) {
            for (const c of all) {
                if (c.lang !== v.lang) continue;
                const t = appleTier(c);
                if (t > bestTier || (t === bestTier && t >= 1 && isMeijia(c) && !isMeijia(best))) { best = c; bestTier = t; }
            }
        }
        return best;
    }

    // ── iPad／iPhone：中文一律用美佳（2026-10-02 使用者定「如果是 iPad 使用 TTS 時優先使用美佳」）──
    //    iOS 上所有瀏覽器都是 WebKit、沒有微軟／Google 語音，Siri 聲音也不開放給網頁；能用的中文聲裡
    //    只有美佳下載得到加強版／高音質，其餘（Shelley 等 Eloquence）都很機械。
    //    對話模組的男女角色在 iPad 上本來就挑不到男聲（MALE_VOICE_PAT 只認得微軟／Google 名字），
    //    原本全部落到 Shelley（女聲），所以改成美佳不會讓男角色變得更糟。
    //    例外：①__mtNoVoiceUpgrade（試聽某一支聲音）②__mtPinnedVoiceName（老師替自訂情境指定的聲音）。
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);   // iPadOS 預設用桌機版 UA
    function bestMeijia() {
        let best = null, bestTier = -1;
        for (const c of synth.getVoices() || []) {
            if (!isMeijia(c) || !/^zh[-_]TW/i.test(c.lang || '')) continue;
            const t = appleTier(c);
            if (t > bestTier) { best = c; bestTier = t; }
        }
        return best;
    }

    const origSpeak = synth.speak.bind(synth);
    synth.speak = function (u) {
        try {
            // 已指定中文語音＝呼叫端的刻意選擇（對話模組的角色聲），尊重不動。
            // 只在「沒指定」或「指定了非中文聲」時補派——那才是守門要解決的問題。
            if (u && hasCJK(u.text) && !isZh(u.voice)) {
                const v = pickZhVoice();
                if (v) { u.voice = v; u.lang = v.lang; }
                else { u.voice = null; u.lang = 'zh-TW'; }   // ⑥ 交系統挑中文
            }
            // 有更高音質的聲音就換過去（規則見 upgradeApple）
            // （html/voice-check.html 逐一試聽各版本時設 __mtNoVoiceUpgrade 暫停升級）
            // 不換聲音的兩種情況：試聽某一支聲音、老師替自訂情境指定的聲音（兩個升級步驟都不做）
            const keep = window.__mtNoVoiceUpgrade ||
                         !!(u && u.voice && window.__mtPinnedVoiceName && u.voice.name === window.__mtPinnedVoiceName);
            if (u && isZh(u.voice) && !keep) {
                const b = upgradeApple(u.voice);
                if (b !== u.voice) { u.voice = b; u.lang = b.lang; }
            }
            // iPad／iPhone：中文一律美佳（見 bestMeijia 上方說明）
            if (u && isIOS && hasCJK(u.text) && !keep) {
                const m = bestMeijia();
                if (m && m !== u.voice) { u.voice = m; u.lang = m.lang; }
            }
            guard.lastError = null;
        } catch (e) { guard.lastError = String(e && e.message || e); /* 守門失敗不影響發聲 */ }
        return origSpeak(u);
    };
    // 給 html/voice-check.html 顯示用：守門有沒有掛上、各聲音判成幾級、升級會換成誰
    const guard = window.MTVoiceGuard = {
        ver: '2026-10-02e', hooked: false, lastError: null, isIOS,
        tier: appleTier, base: appleBase, upgrade: upgradeApple, meijia: bestMeijia
    };
    guard.hooked = /upgradeApple/.test(String(synth.speak));
})();

// =================================================================
// 全站同一時間只有一個語音（2026-09-24 使用者定：「整個程式不能有兩個語音同時播放」）
// 起因：點小金探唸「遇到困難了嗎？…」時按提示鈕，兩段語音疊在一起。那不是小金探的問題——
//   預錄語音（<audio>）與即時語音（speechSynthesis）是兩條獨立管道，各模組各播各的，
//   只要兩個模組前後腳開口就會疊音。所以規則放在全站都會載入的這支，不在各模組各寫一份。
// 規則：新的語音開口，舊的就停（後到者優先）。
//   ・預錄語音 play()  → 停掉其他還在播的預錄語音＋speechSynthesis.cancel()
//   ・即時語音 speak() → 停掉還在播的預錄語音（即時語音彼此本來就排隊，不會同時響）
// 「語音」只認下面這些路徑；**音效不算**（放錢的叮、答對、錯誤、背景音樂要能跟語音同時響）。
//   新增語音資料夾時要加進 VOICE_RE，否則它不受這條規則管（會跟別的語音疊）。
// 守門：node tests/_e2e_single_voice.js
// =================================================================
(function () {
    if (window.__mtSingleVoice) return;
    window.__mtSingleVoice = true;
    const VOICE_RE = /\/audio\/chatbot\/|\/adventure\/audio\/|\/dialogue\/audio\/(clerk|clerk_browser|feedback|student)\/|^blob:/;
    const isVoice = (el) => VOICE_RE.test(el.currentSrc || el.src || '');
    const playing = new Set();

    function stopVoiceAudio(except) {
        playing.forEach(a => {
            if (a === except) return;
            playing.delete(a);
            try { a.pause(); } catch (e) {}
        });
    }

    const origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
        if (isVoice(this)) {
            stopVoiceAudio(this);
            try { if (window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel(); } catch (e) {}
            const a = this;
            playing.add(a);
            const done = () => playing.delete(a);
            a.addEventListener('ended', done, { once: true });
            a.addEventListener('pause', done, { once: true });
        }
        return origPlay.apply(this, arguments);
    };

    if (window.speechSynthesis) {
        const synth = window.speechSynthesis;
        const prevSpeak = synth.speak.bind(synth);
        synth.speak = function (u) {
            // 音量 0 的是解鎖用的靜音句（本檔 unlock()），不算開口
            if (!(u && u.volume === 0)) stopVoiceAudio(null);
            return prevSpeak(u);
        };
    }

    window.MTVoice = { stopAll() { stopVoiceAudio(null); try { speechSynthesis.cancel(); } catch (e) {} }, isVoice };
})();
