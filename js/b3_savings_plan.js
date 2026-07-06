// =============================================================
// FILE: js/b3_savings_plan.js — B3 存錢計畫
// =============================================================
'use strict';

// ── 圖片壓縮工具 ──────────────────────────────────────────────
function b3CompressImage(file, maxWidth = 200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                let w = img.width, h = img.height;
                if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// ── 商品資料庫（依難度篩選）─────────────────────────────────────
const B3_ALL_ITEMS = [
    // ── easy (≤400 元) ─────────────────────────────────────────
    { name: '鉛筆盒',    price: 180,  icon: '🖊️', img: 'c5/icon-c5-pencil-case.png',       cat: 'book'    },
    { name: '漫畫書',    price: 200,  icon: '📚', img: 'c5/icon-c5-comic-book.png',        cat: 'book'    },
    { name: '日記本',    price: 240,  icon: '📓', img: 'c5/icon-c5-diary.png',             cat: 'book'    },
    { name: '故事書',    price: 260,  icon: '📕', img: 'c5/icon-c5-story-book.png',        cat: 'book'    },
    { name: '玩具車',    price: 300,  icon: '🚗', img: 'c5/icon-c5-toy-car.png',           cat: 'toy'     },
    { name: '計算機',    price: 340,  icon: '🔢', img: 'c5/icon-c5-calculator.png',        cat: 'tech'    },
    { name: '娃娃',      price: 350,  icon: '🪆', img: 'c5/icon-c5-doll.png',              cat: 'toy'     },
    { name: '遙控車',    price: 380,  icon: '🏎️', img: 'c5/icon-c5-rc-car.png',            cat: 'toy'     },
    { name: '機器人玩具', price: 400,  icon: '🤖', img: 'c5/icon-c5-robot.png',             cat: 'toy'     },
    // ── normal（≤800 元）──────────────────────────────────────
    { name: '運動上衣',  price: 450,  icon: '👕', img: 'c5/icon-c5-shirt.png',             cat: 'outdoor' },
    { name: '耳機',      price: 480,  icon: '🎧', img: 'c5/icon-c5-headphones.png',        cat: 'tech'    },
    { name: '運動褲',    price: 520,  icon: '👖', img: 'c5/icon-c5-pants.png',             cat: 'outdoor' },
    { name: '外套',      price: 550,  icon: '🧥', img: 'c5/icon-c5-jacket.png',            cat: 'outdoor' },
    { name: '籃球鞋',    price: 620,  icon: '👟', img: 'c5/icon-c5-basketball-shoes.png',  cat: 'outdoor' },
    { name: '藍芽喇叭',  price: 680,  icon: '🔊', img: 'c5/icon-c5-bluetooth-speaker.png', cat: 'tech'    },
    { name: '滑板',      price: 750,  icon: '🛹', img: 'c5/icon-c5-skateboard.png',        cat: 'outdoor' },
    { name: '智慧手錶',  price: 800,  icon: '⌚', img: 'c5/icon-c5-smartwatch.png',        cat: 'tech'    },
    // ── hard（全部）──────────────────────────────────────────
    { name: '腳踏車',    price: 1500, icon: '🚴', img: 'c5/icon-c5-bicycle.png',           cat: 'outdoor' },
    { name: '平板電腦',  price: 3000, icon: '📱', img: 'c5/icon-c5-tablet.png',            cat: 'tech'    },
    { name: '手機',      price: 4500, icon: '📲', img: 'c5/icon-c5-phone.png',             cat: 'tech'    },
];

const B3_ITEMS_BY_DIFF = {
    easy:   B3_ALL_ITEMS.filter(i => i.price <= 400),
    normal: B3_ALL_ITEMS.filter(i => i.price <= 800),
    hard:   B3_ALL_ITEMS,
};

const B3_WEEKLY_OPTIONS = {
    easy:   [50, 100, 150, 200],
    normal: [30, 50, 75, 100, 120, 150],
    hard:   [25, 35, 50, 65, 80, 100, 125, 150, 175, 200],
};

// ── 面額兌換規則（供撲滿手動兌換）────────────────────────────────
const EXCHANGE_RULES = [
    { from: 1,   count: 10, to: 10   },
    { from: 1,   count: 5,  to: 5    },
    { from: 5,   count: 2,  to: 10   },
    { from: 10,  count: 5,  to: 50   },
    { from: 50,  count: 2,  to: 100  },
    { from: 100, count: 5,  to: 500  },
    { from: 500, count: 2,  to: 1000 },
];

// ── 金額語音轉換（安全版）──────────────────────────────────────
const toTWD = v => typeof convertToTraditionalCurrency === 'function'
    ? convertToTraditionalCurrency(v) : `${v}元`;

// ── 隨機正反面（所有面額 50/50）──────────────────────────────────
const b3Rf = () => Math.random() < 0.5 ? 'back' : 'front';

// ── Game 物件 ────────────────────────────────────────────────────
let Game;

document.addEventListener('DOMContentLoaded', () => {
    Game = {

        // ── 1. Debug ──────────────────────────────────────────
        Debug: {
            FLAGS: { all: false, init: false, speech: false, question: false, error: true },
            log(cat, ...a)  { if (this.FLAGS.all || this.FLAGS[cat]) console.log(`[B3-${cat}]`, ...a); },
            warn(cat, ...a) { if (this.FLAGS.all || this.FLAGS[cat]) console.warn(`[B3-${cat}]`, ...a); },
            error(...a)     { console.error('[B3-ERROR]', ...a); },
        },

        // ── 2. TimerManager ───────────────────────────────────
        TimerManager: {
            timers: new Map(), timerIdCounter: 0,
            setTimeout(callback, delay, category = 'default') {
                const id = ++this.timerIdCounter;
                const timerId = window.setTimeout(() => { this.timers.delete(id); callback(); }, delay);
                this.timers.set(id, { timerId, category });
                return id;
            },
            clearTimeout(id) {
                const t = this.timers.get(id);
                if (t) { window.clearTimeout(t.timerId); this.timers.delete(id); }
            },
            clearAll() { this.timers.forEach(t => window.clearTimeout(t.timerId)); this.timers.clear(); },
            clearByCategory(cat) {
                this.timers.forEach((t, id) => {
                    if (t.category === cat) { window.clearTimeout(t.timerId); this.timers.delete(id); }
                });
            },
        },

        // ── 3. EventManager ───────────────────────────────────
        EventManager: {
            listeners: [],
            on(el, type, fn, opts = {}, cat = 'default') {
                if (!el) return -1;
                el.addEventListener(type, fn, opts);
                return this.listeners.push({ element: el, type, handler: fn, options: opts, category: cat }) - 1;
            },
            removeAll() {
                this.listeners.forEach(l => {
                    try { l?.element?.removeEventListener(l.type, l.handler, l.options); } catch(e) {}
                });
                this.listeners = [];
            },
            removeByCategory(cat) {
                this.listeners.forEach((l, i) => {
                    if (l?.category === cat) {
                        try { l.element?.removeEventListener(l.type, l.handler, l.options); } catch(e) {}
                        this.listeners[i] = null;
                    }
                });
            },
        },

        // ── 4. Audio ──────────────────────────────────────────
        audio: {
            sounds: {},
            init() {
                ['correct', 'success', 'error', 'click', 'coin', 'keypad'].forEach(name => {
                    const el = document.getElementById(`${name}-sound`);
                    if (el) this.sounds[name] = el;
                });
            },
            play(name) {
                const s = this.sounds[name];
                if (!s) return;
                try { s.currentTime = 0; s.play().catch(() => {}); } catch(e) {}
            },
        },

        // ── 5. Speech ─────────────────────────────────────────
        Speech: {
            cachedVoice: null,
            _loadVoice() {
                if (!window.speechSynthesis) return;
                const voices = window.speechSynthesis.getVoices();
                if (voices.length === 0) {
                    Game.TimerManager.setTimeout(() => Game.Speech._loadVoice(), 500, 'speech');
                    return;
                }
                this.cachedVoice =
                    voices.find(v => v.name.startsWith('Microsoft Yating')) ||
                    voices.find(v => v.name.startsWith('Microsoft Hanhan')) ||
                    voices.find(v => v.name === 'Google 國語（臺灣）') ||
                    voices.find(v => v.lang === 'zh-TW') ||
                    voices.find(v => v.lang.startsWith('zh')) ||
                    voices[0] ||
                    null;
            },
            speak(text, callback) {
                if (!window.speechSynthesis) { callback?.(); return; }
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                u.lang = this.cachedVoice?.lang || 'zh-TW'; u.rate = 1.0;
                if (this.cachedVoice) u.voice = this.cachedVoice;
                let callbackExecuted = false;
                const safeCallback = () => { if (callbackExecuted) return; callbackExecuted = true; callback?.(); };
                u.onend = safeCallback;
                u.onerror = (e) => { if (e.error !== 'interrupted') Game.Debug.warn('speech', '語音錯誤', e.error); safeCallback(); };
                Game.TimerManager.setTimeout(safeCallback, 10000, 'speech');
                try {
                    window.speechSynthesis.speak(u);
                } catch(e) {
                    Game.Debug.warn('speech', '語音播放失敗', e);
                    safeCallback();
                }
            },
        },

        // ── 6. State ──────────────────────────────────────────
        tempItemImageData: null, // 上傳預覽暫存

        state: {
            settings: {
                difficulty: null,
                questionCount: null,  // normal/hard only
                retryMode: null,      // normal/hard only
                startDate: null,      // easy only (null = today)
                dailyAmount: null,    // easy only (null = auto)
                priceRange: null,     // easy only (max price of items)
                clickMode: 'off',     // easy mode only
                itemCat: 'all',       // item category filter (all/toy/book/outdoor/tech)
            },
            quiz: {
                currentQuestion: 0,
                totalQuestions: 0,
                correctCount: 0,
                streak: 0,
                questions: [],
                achievedGoals: [],
                startTime: null,
                currentInput: '',
            },
            calendar: {
                item: null,
                dailyAmount: 0,
                accumulated: 0,
                denomPile: {},          // 實際持有面額 {denom: count}
                clickedDays: 0,
                startDate: null,
                startTime: null,
                drag: null,
                hardDailyAmounts: [],   // hard mode: 預先產生的每日存款金額陣列
                hardSavedAmounts: [],   // hard mode: 實際每天存入的金額記錄
            },
            customItems: [], // { name, price, imageData, isCustom:true }（跨局保留）
            isEndingGame: false,
            isProcessing: false,
        },

        // ── 7. Init ───────────────────────────────────────────
        init() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeAll();
            this.injectGlobalAnimationStyles();
            this.audio.init();
            Game.Speech._loadVoice();
            if (window.speechSynthesis?.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = () => Game.Speech._loadVoice();
            }
            this.showSettings();
        },

        injectGlobalAnimationStyles() {
            if (document.getElementById('b3-global-animations')) return;
            const style = document.createElement('style');
            style.id = 'b3-global-animations';
            style.textContent = `
                @keyframes b3SlotPop {
                    0%   { transform: translateY(-16px) scale(0.4); opacity: 0; }
                    60%  { transform: translateY(3px) scale(1.2); }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes b3CoinFloat {
                    0%   { transform: translate(var(--b3-dx, 0px), 0px) scale(1);   opacity: 1; }
                    60%  { transform: translate(var(--b3-dx, 0px), -80px) scale(1.3); opacity: 0.9; }
                    100% { transform: translate(var(--b3-dx, 0px), -140px) scale(0.6); opacity: 0; }
                }
                @keyframes b3SlotFill {
                    0%   { transform: scale(0.5); opacity: 0; }
                    70%  { transform: scale(1.15); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes b3DropWrong {
                    0%, 100% { transform: translateX(0); }
                    20%      { transform: translateX(-6px); }
                    40%      { transform: translateX(6px); }
                    60%      { transform: translateX(-4px); }
                    80%      { transform: translateX(4px); }
                }
                @keyframes b3CheckPop {
                    0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
                    60%  { transform: scale(1.3) rotate(5deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        },

        resetGameState() {
            const q = this.state.quiz;
            q.currentQuestion  = 0;
            q.totalQuestions   = this.state.settings.questionCount || 0;
            q.correctCount     = 0;
            q.streak           = 0;
            q.questions        = [];
            q.achievedGoals    = [];
            q.startTime        = null;
            q.currentInput     = '';
            const c = this.state.calendar;
            c.item = null; c.dailyAmount = 0; c.accumulated = 0; c.denomPile = {};
            c.clickedDays = 0; c.startDate = null; c.startTime = null; c.drag = null;
            c.hardDailyAmounts = []; c.hardSavedAmounts = [];
            this.state.isEndingGame = false;
            this.state.isProcessing  = false;
            Game.Debug.log('init', '🔄 [B3] 遊戲狀態已重置');
        },

        // ── 8. 設定頁 ─────────────────────────────────────────
        showSettings() {
            window.speechSynthesis.cancel();
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            this.resetGameState();
            document.getElementById('app').innerHTML = this._renderSettingsHTML();
            this._bindSettingsEvents();
            Game.Debug.log('init', 'showSettings 完成');
        },

        _renderSettingsHTML() {
            const today = new Date().toISOString().split('T')[0];
            return `
    <div class="unit-welcome">
        <div class="welcome-content">
            <div class="settings-title-row">
                <img src="../images/common/hint_detective.png" alt="金錢小助手"
                     class="settings-mascot-img" onerror="this.style.display='none'">
                <h1>單元B3：存錢計畫</h1>
            </div>
            <div class="game-settings">
                <div class="b-setting-group">
                    <label style="font-size:13px;color:#6b7280;text-align:left;display:block;">
                        ✨ 設定存錢目標，每天累積存款，達成夢想！<br>
                        簡單：固定每日存款；普通：選擇存款天數與金額；困難：金額每天隨機變動
                    </label>
                </div>
                <div class="b-setting-group">
                    <label class="b-setting-label">🎯 難度選擇：</label>
                    <div class="b-btn-group" id="diff-group">
                        <button class="b-sel-btn b-diff-easy"   data-val="easy">簡單</button>
                        <button class="b-sel-btn b-diff-normal" data-val="normal">普通</button>
                        <button class="b-sel-btn b-diff-hard"   data-val="hard">困難</button>
                    </div>
                    <div class="b-diff-desc" id="diff-desc"></div>
                </div>

                <div class="b-setting-group" id="assist-click-group" style="display:none;">
                    <label class="b-setting-label">🤖 輔助點擊</label>
                    <div class="b-btn-group" id="assist-group">
                        <button class="b-sel-btn" data-assist="on">✓ 啟用</button>
                        <button class="b-sel-btn active" data-assist="off">✗ 停用</button>
                    </div>
                    <div style="margin-top:4px;font-size:12px;color:#6b7280;">
                        啟用後，只要偵測到點擊便會自動執行下一個步驟
                    </div>
                </div>

                <div class="b-setting-group b3-cal-settings" id="cal-settings-group" style="display:none;">
                    <label class="b-setting-label">📅 開始日期：</label>
                    <div class="b-btn-group">
                        <input type="date" id="b3-start-date" class="b3-date-input" value="${today}">
                    </div>
                </div>

                <div class="b-setting-group b3-cal-settings" id="cal-price-range-group" style="display:none;">
                    <label class="b-setting-label">🛒 購買物品金額：</label>
                    <div class="b-btn-group" id="price-range-group">
                        <button class="b-sel-btn" data-range="300">300元以內</button>
                        <button class="b-sel-btn" data-range="500">500元以內</button>
                        <button class="b-sel-btn" data-range="800">800元以內</button>
                        <button class="b-sel-btn" data-range="2000">2000元以內</button>
                        <button class="b-sel-btn" data-range="5000">全部商品</button>
                    </div>
                </div>

                <!-- 普通模式設定 -->
                <div class="b-setting-group b3-normal-settings" id="n-start-date-group" style="display:none;">
                    <label class="b-setting-label">📅 開始日期：</label>
                    <div class="b-btn-group">
                        <input type="date" id="b3-n-start-date" class="b3-date-input" value="${today}">
                    </div>
                </div>
                <div class="b-setting-group b3-normal-settings" id="n-price-range-group" style="display:none;">
                    <label class="b-setting-label">🛒 購買物品金額：</label>
                    <div class="b-btn-group" id="n-price-range-btns">
                        <button class="b-sel-btn" data-nrange="300">300元以內</button>
                        <button class="b-sel-btn" data-nrange="500">500元以內</button>
                        <button class="b-sel-btn" data-nrange="800">800元以內</button>
                        <button class="b-sel-btn" data-nrange="2000">2000元以內</button>
                        <button class="b-sel-btn" data-nrange="5000">全部商品</button>
                    </div>
                </div>
                <!-- 困難模式設定 -->
                <div class="b-setting-group b3-hard-settings" id="h-start-date-group" style="display:none;">
                    <label class="b-setting-label">📅 開始日期：</label>
                    <div class="b-btn-group">
                        <input type="date" id="b3-h-start-date" class="b3-date-input" value="${today}">
                    </div>
                </div>
                <div class="b-setting-group b3-hard-settings" id="h-price-range-group" style="display:none;">
                    <label class="b-setting-label">🛒 購買物品金額：</label>
                    <div class="b-btn-group" id="h-price-range-btns">
                        <button class="b-sel-btn" data-hrange="300">300元以內</button>
                        <button class="b-sel-btn" data-hrange="500">500元以內</button>
                        <button class="b-sel-btn" data-hrange="800">800元以內</button>
                        <button class="b-sel-btn" data-hrange="2000">2000元以內</button>
                        <button class="b-sel-btn" data-hrange="5000">全部商品</button>
                    </div>
                </div>

                <!-- 自訂物品（所有模式共用，置於所有購買金額選項之後、存款天數之前） -->
                <div class="b-setting-group">
                    <label class="b-setting-label">🖼️ 自訂物品（選填）：</label>
                    <div class="b3-custom-items-list" id="b3-custom-items-list">
                        ${this._renderCustomItemsPanel()}
                    </div>
                    <div class="b-btn-group" style="margin-top:6px;">
                        <button class="b-sel-btn" id="b3-add-custom-item-btn" style="background:linear-gradient(45deg,#FF6B6B,#4ECDC4);color:#fff;border:none;">${this.state.customItems.length > 0 ? '替換物品' : '上傳物品'}</button>
                    </div>
                    <div style="margin-top:4px;font-size:12px;color:#6b7280;">上傳圖片作為存錢目標（圖片會自動壓縮）</div>
                    <input type="file" id="b3-custom-image" accept="image/*" style="display:none;">
                </div>

                <!-- 簡單模式：存款天數與金額（移至自訂物品之後） -->
                <div class="b-setting-group b3-cal-settings" id="cal-daily-group" style="display:none;">
                    <label class="b-setting-label">📅 存款天數與金額：</label>
                    <div class="b-btn-group" id="daily-group">
                        <button class="b-sel-btn" data-daily="6-10">6-10天</button>
                        <button class="b-sel-btn" data-daily="9-15">9-15天</button>
                        <button class="b-sel-btn" data-daily="10-20">10-20天</button>
                        <button class="b-sel-btn" data-daily="custom">自訂金額</button>
                    </div>
                </div>
                <div class="b3-cal-settings b3-days-preview" id="b3-days-preview" style="display:none;"></div>

                <!-- 普通模式：存款天數與金額 -->
                <div class="b-setting-group b3-normal-settings" id="n-daily-group" style="display:none;">
                    <label class="b-setting-label">📅 存款天數與金額：</label>
                    <div class="b-btn-group" id="n-daily-btn-group">
                        <button class="b-sel-btn" data-ndaily="6-10">6-10天</button>
                        <button class="b-sel-btn" data-ndaily="9-15">9-15天</button>
                        <button class="b-sel-btn" data-ndaily="10-20">10-20天</button>
                        <button class="b-sel-btn" data-ndaily="custom">自訂金額</button>
                    </div>
                </div>
                <div class="b3-normal-settings b3-days-preview" id="b3-n-days-preview" style="display:none;"></div>

                <!-- 困難模式：存款天數與金額 -->
                <div class="b-setting-group b3-hard-settings" id="h-daily-group" style="display:none;">
                    <label class="b-setting-label">📅 存款天數與金額：</label>
                    <div class="b-btn-group" id="h-daily-btn-group">
                        <button class="b-sel-btn" data-hdaily="6-10">6-10天</button>
                        <button class="b-sel-btn" data-hdaily="9-15">9-15天</button>
                        <button class="b-sel-btn" data-hdaily="10-20">10-20天</button>
                        <button class="b-sel-btn" data-hdaily="custom">自訂金額</button>
                    </div>
                </div>
                <div class="b3-hard-settings b3-days-preview" id="b3-h-days-preview" style="display:none;"></div>

                <div class="b-setting-group">
                    <label class="b-setting-label">🎁 獎勵系統：</label>
                    <div class="b-btn-group">
                        <a href="#" id="settings-reward-link" class="b-sel-btn active"
                           style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">
                            開啟獎勵系統
                        </a>
                    </div>
                </div>
                <div class="b-setting-group">
                    <label class="b-setting-label">📝 作業單：</label>
                    <div class="b-btn-group">
                        <a href="#" id="settings-worksheet-link" class="b-sel-btn active"
                           style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">
                            產生作業單
                        </a>
                    </div>
                </div>

                <!-- 自訂物品上傳預覽 Modal -->
                <div id="b3-item-preview-modal" class="b3-modal-overlay" style="display:none;">
                    <div class="b3-modal-box">
                        <div class="b3-modal-header">🖼️ 新增自訂物品</div>
                        <div class="b3-modal-body">
                            <img id="b3-preview-image" src="" alt="預覽" class="b3-modal-preview-img">
                            <div class="b3-modal-field">
                                <label class="b3-modal-label">物品名稱：</label>
                                <input type="text" id="b3-custom-item-name" class="b3-modal-input" placeholder="例如：新玩具" maxlength="10">
                            </div>
                            <div class="b3-modal-field">
                                <label class="b3-modal-label">目標金額（元）：</label>
                                <div id="b3-item-price-display" class="b3-modal-input" style="cursor:pointer;display:flex;align-items:center;justify-content:center;min-height:44px;font-size:20px;font-weight:700;color:#d97706;border:2px dashed #d97706;border-radius:10px;background:#fffbeb;" onclick="Game._openItemPriceNumpad()">點擊輸入金額</div>
                            </div>
                        </div>
                        <div class="b3-modal-footer">
                            <button id="b3-modal-cancel-btn" class="b3-modal-btn b3-modal-btn-cancel">取消</button>
                            <button id="b3-modal-confirm-btn" class="b3-modal-btn b3-modal-btn-confirm">確認新增</button>
                        </div>
                    </div>
                </div>
                <div class="b-setting-group b3-quiz-settings" style="display:none">
                    <label class="b-setting-label">🗂️ 目標類別：</label>
                    <div class="b-btn-group" id="b3-cat-group">
                        <button class="b-sel-btn active" data-cat="all">全部</button>
                        <button class="b-sel-btn" data-cat="toy">🎮 玩具</button>
                        <button class="b-sel-btn" data-cat="book">📚 書本</button>
                        <button class="b-sel-btn" data-cat="outdoor">🌿 戶外</button>
                        <button class="b-sel-btn" data-cat="tech">💻 科技</button>
                    </div>
                </div>
                <div class="b-setting-group">
                    <label style="font-size:13px;color:#6b7280;text-align:left;display:block;">
                        ✨ 簡單：月曆存錢，面額已分解好直接放置｜普通：月曆存錢，自行組合面額｜困難：月曆存錢，每天金額不同
                    </label>
                </div>
            </div>
            <div class="game-buttons">
                <button class="back-btn" onclick="Game.backToMenu()">返回主選單</button>
                <button class="start-btn" id="start-btn" disabled>▶ 開始練習</button>
            </div>
        </div>
    </div>

    <!-- 每天存款金額數字鍵盤彈窗 -->
    <div id="b3-daily-numpad-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10200;align-items:center;justify-content:center;">
        <div style="background:#fff;border-radius:20px;padding:24px;width:300px;max-width:90vw;border:3px solid #d97706;box-shadow:0 8px 32px rgba(217,119,6,0.3);">
            <div style="text-align:center;margin-bottom:14px;">
                <div style="font-size:14px;color:#92400e;font-weight:700;margin-bottom:10px;">💰 自訂每天存款金額</div>
                <div id="b3-numpad-display" style="font-size:2.4rem;font-weight:900;color:#92400e;background:#fef3c7;border:2px solid #d97706;border-radius:12px;padding:10px 20px;min-height:60px;display:flex;align-items:center;justify-content:center;letter-spacing:2px;">--</div>
                <div style="font-size:12px;color:#6b7280;margin-top:5px;">1 ～ 9999 元</div>
            </div>
            <div id="b3-numpad-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;">
                <button data-np="1"       style="padding:14px 0;font-size:1.3rem;font-weight:700;background:#fef9c3;color:#92400e;border:2px solid #d97706;border-radius:10px;cursor:pointer;">1</button>
                <button data-np="2"       style="padding:14px 0;font-size:1.3rem;font-weight:700;background:#fef9c3;color:#92400e;border:2px solid #d97706;border-radius:10px;cursor:pointer;">2</button>
                <button data-np="3"       style="padding:14px 0;font-size:1.3rem;font-weight:700;background:#fef9c3;color:#92400e;border:2px solid #d97706;border-radius:10px;cursor:pointer;">3</button>
                <button data-np="4"       style="padding:14px 0;font-size:1.3rem;font-weight:700;background:#fef9c3;color:#92400e;border:2px solid #d97706;border-radius:10px;cursor:pointer;">4</button>
                <button data-np="5"       style="padding:14px 0;font-size:1.3rem;font-weight:700;background:#fef9c3;color:#92400e;border:2px solid #d97706;border-radius:10px;cursor:pointer;">5</button>
                <button data-np="6"       style="padding:14px 0;font-size:1.3rem;font-weight:700;background:#fef9c3;color:#92400e;border:2px solid #d97706;border-radius:10px;cursor:pointer;">6</button>
                <button data-np="7"       style="padding:14px 0;font-size:1.3rem;font-weight:700;background:#fef9c3;color:#92400e;border:2px solid #d97706;border-radius:10px;cursor:pointer;">7</button>
                <button data-np="8"       style="padding:14px 0;font-size:1.3rem;font-weight:700;background:#fef9c3;color:#92400e;border:2px solid #d97706;border-radius:10px;cursor:pointer;">8</button>
                <button data-np="9"       style="padding:14px 0;font-size:1.3rem;font-weight:700;background:#fef9c3;color:#92400e;border:2px solid #d97706;border-radius:10px;cursor:pointer;">9</button>
                <button data-np="clear"   style="padding:14px 0;font-size:1.1rem;font-weight:700;background:#fee2e2;color:#dc2626;border:2px solid #fca5a5;border-radius:10px;cursor:pointer;">清除</button>
                <button data-np="0"       style="padding:14px 0;font-size:1.3rem;font-weight:700;background:#fef9c3;color:#92400e;border:2px solid #d97706;border-radius:10px;cursor:pointer;">0</button>
                <button data-np="confirm" style="padding:14px 0;font-size:1.1rem;font-weight:700;background:#d1fae5;color:#065f46;border:2px solid #6ee7b7;border-radius:10px;cursor:pointer;">確認</button>
            </div>
            <button id="b3-numpad-cancel" style="width:100%;padding:9px;border:2px solid #d97706;border-radius:10px;background:transparent;color:#92400e;font-size:14px;cursor:pointer;font-weight:600;">取消</button>
        </div>
    </div>`;
        },

        _diffDescriptions: {
            easy:   '簡單：月曆模擬！點擊每一天存入固定金額，面額已幫你分解好，直接拖曳放置即可',
            normal: '普通：月曆模擬！每天自行組合正確面額存入撲滿，比簡單模式更具挑戰性',
            hard:   '困難：月曆模擬！每天存款金額不固定，每次存入不同金額，挑戰自行組合正確面額',
        },

        _bindSettingsEvents() {
            Game.EventManager.removeByCategory('settings');
            document.querySelectorAll('#diff-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#diff-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const diff = btn.dataset.val;
                    this.state.settings.difficulty = diff;
                    const desc = document.getElementById('diff-desc');
                    if (desc) { desc.textContent = this._diffDescriptions[diff]; desc.classList.add('show'); }
                    // Show/hide settings by difficulty
                    document.querySelectorAll('.b3-cal-settings').forEach(el => el.style.display = diff === 'easy' ? '' : 'none');
                    document.querySelectorAll('.b3-normal-settings').forEach(el => el.style.display = diff === 'normal' ? '' : 'none');
                    document.querySelectorAll('.b3-hard-settings').forEach(el => el.style.display = diff === 'hard' ? '' : 'none');
                    document.querySelectorAll('.b3-quiz-settings').forEach(el => el.style.display = 'none');
                    // 輔助點擊：只有簡單模式才顯示
                    const assistGroup = document.getElementById('assist-click-group');
                    if (diff === 'easy') {
                        if (assistGroup) assistGroup.style.display = '';
                    } else {
                        if (assistGroup) assistGroup.style.display = 'none';
                        this.state.settings.clickMode = 'off';
                        document.querySelectorAll('#assist-group .b-sel-btn').forEach(b => b.classList.toggle('active', b.dataset.assist === 'off'));
                    }
                    // 切換難度：清除所有模式的選項狀態（含按鈕 active、自訂文字、設定值）
                    this.state.settings.questionCount = null;
                    this.state.settings.retryMode = null;
                    this.state.settings.priceRange  = null;
                    this.state.settings.dailyAmount  = null;
                    document.querySelectorAll('#price-range-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('#daily-group .b-sel-btn').forEach(b => { b.classList.remove('active'); if (b.dataset.daily==='custom') b.textContent='自訂金額'; });
                    document.querySelectorAll('#n-price-range-btns .b-sel-btn').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('#n-daily-btn-group .b-sel-btn').forEach(b => { b.classList.remove('active'); if (b.dataset.ndaily==='custom') b.textContent='自訂金額'; });
                    document.querySelectorAll('#h-price-range-btns .b-sel-btn').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('#h-daily-btn-group .b-sel-btn').forEach(b => { b.classList.remove('active'); if (b.dataset.hdaily==='custom') b.textContent='自訂金額'; });
                    // 讀取對應模式的開始日期
                    const dateIdMap = { easy: 'b3-start-date', normal: 'b3-n-start-date', hard: 'b3-h-start-date' };
                    const activeDateInput = document.getElementById(dateIdMap[diff]);
                    if (activeDateInput) this.state.settings.startDate = activeDateInput.value;
                    // 更新 preview（清除空白黃框）
                    this._updateDaysPreview();
                    this._updateNDaysPreview();
                    this._updateHDaysPreview();
                    this._checkCanStart();
                }, {}, 'settings');
            });

            // Date input
            const dateInput = document.getElementById('b3-start-date');
            Game.EventManager.on(dateInput, 'change', () => {
                this.state.settings.startDate = dateInput.value;
            }, {}, 'settings');

            // Price range buttons
            document.querySelectorAll('#price-range-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#price-range-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.priceRange = parseInt(btn.dataset.range);
                    this._updateDaysPreview();
                    this._checkCanStart();
                }, {}, 'settings');
            });

            // ── 數字鍵盤彈窗（三模式共用）────────────────────────
            let _npSource = null;
            let _npValue  = '';
            const numpadModal   = document.getElementById('b3-daily-numpad-modal');
            const numpadDisplay = document.getElementById('b3-numpad-display');

            const showNumpad = (source) => {
                _npSource = source;
                _npValue  = '';
                numpadDisplay.textContent = '--';
                const titleEl = numpadModal.querySelector('div[style*="font-weight:700"]');
                if (titleEl) {
                    titleEl.textContent = source === 'hard'
                        ? '📅 自訂每日平均存款金額'
                        : '💰 自訂每天存款金額';
                }
                numpadModal.style.display = 'flex';
            };
            const hideNumpad = () => { numpadModal.style.display = 'none'; };
            const confirmNumpad = () => {
                const val = parseInt(_npValue, 10);
                if (!_npValue || val < 1 || val > 9999) return;
                const label = `自訂 ${val} 元`;
                this.state.settings.dailyAmount = val;
                if (_npSource === 'easy') {
                    document.querySelectorAll('#daily-group .b-sel-btn[data-daily="custom"]').forEach(b => b.textContent = label);
                    this._updateDaysPreview();
                } else if (_npSource === 'normal') {
                    document.querySelectorAll('#n-daily-btn-group .b-sel-btn[data-ndaily="custom"]').forEach(b => b.textContent = label);
                    this._updateNDaysPreview();
                } else if (_npSource === 'hard') {
                    document.querySelectorAll('#h-daily-btn-group .b-sel-btn[data-hdaily="custom"]').forEach(b => b.textContent = label);
                    this._updateHDaysPreview();
                }
                hideNumpad();
                this._checkCanStart();
            };

            // ── 目標金額專用浮動數字鍵盤（z-index > b3-modal-overlay 10300，定位於彈窗右側）──
            this._openItemPriceNumpad = () => {
                const existing = document.getElementById('b3-price-numpad');
                if (existing) existing.remove();

                // 計算定位：優先放在彈窗右側，空間不足則放左側，再不夠則置中
                const modalBox = document.querySelector('#b3-item-preview-modal .b3-modal-box');
                let posStyle = 'top:50%;left:50%;transform:translate(-50%,-50%)';
                if (modalBox) {
                    const r = modalBox.getBoundingClientRect();
                    const npW = 260;
                    if (window.innerWidth - r.right >= npW + 16) {
                        posStyle = `top:${Math.round(r.top)}px;left:${Math.round(r.right) + 12}px`;
                    } else if (r.left >= npW + 16) {
                        posStyle = `top:${Math.round(r.top)}px;left:${Math.round(r.left) - npW - 12}px`;
                    }
                }

                let _pVal = '';
                const el = document.createElement('div');
                el.id = 'b3-price-numpad';
                el.style.cssText = `position:fixed;${posStyle};z-index:10400;background:#fff;border-radius:20px;padding:20px;width:260px;border:3px solid #d97706;box-shadow:0 8px 32px rgba(217,119,6,0.4);`;
                el.innerHTML = `
                    <div style="text-align:center;margin-bottom:12px;">
                        <div style="font-size:13px;color:#92400e;font-weight:700;margin-bottom:8px;">🎯 輸入目標金額（最高 9999 元）</div>
                        <div id="b3-price-np-display" style="font-size:2rem;font-weight:900;color:#92400e;background:#fef3c7;border:2px solid #d97706;border-radius:12px;padding:8px 16px;min-height:52px;display:flex;align-items:center;justify-content:center;">--</div>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;">
                        ${[['1','1'],['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],['8','8'],['9','9'],['清除','clear'],['0','0'],['確認','confirm']].map(([label, val]) => {
                            const bg  = val==='clear'?'#fee2e2':val==='confirm'?'#d1fae5':'#fef9c3';
                            const col = val==='clear'?'#dc2626':val==='confirm'?'#065f46':'#92400e';
                            const bd  = val==='clear'?'#fca5a5':val==='confirm'?'#6ee7b7':'#d97706';
                            return `<button data-pnp="${val}" style="padding:12px 0;font-size:1.2rem;font-weight:700;background:${bg};color:${col};border:2px solid ${bd};border-radius:10px;cursor:pointer;">${label}</button>`;
                        }).join('')}
                    </div>
                    <button id="b3-price-np-cancel" style="width:100%;padding:8px;border:2px solid #d97706;border-radius:10px;background:transparent;color:#92400e;font-size:14px;cursor:pointer;font-weight:600;">取消</button>
                `;
                document.body.appendChild(el);

                const display = el.querySelector('#b3-price-np-display');
                const close   = () => el.remove();

                el.querySelectorAll('[data-pnp]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const k = btn.dataset.pnp;
                        if (k === 'clear') {
                            this.audio.play('keypad');
                            _pVal = '';
                            display.textContent = '--';
                        } else if (k === 'confirm') {
                            const v = parseInt(_pVal, 10);
                            if (!_pVal || v < 1 || v > 9999) return;
                            this.tempItemPrice = v;
                            const priceDisplay = document.getElementById('b3-item-price-display');
                            if (priceDisplay) {
                                priceDisplay.textContent = `${v} 元`;
                                priceDisplay.style.color = '#065f46';
                                priceDisplay.style.borderColor = '#065f46';
                                priceDisplay.style.background = '#ecfdf5';
                            }
                            close();
                        } else {
                            if (_pVal.length >= 4) return;
                            this.audio.play('keypad');
                            _pVal += k;
                            display.textContent = _pVal;
                        }
                    });
                });
                el.querySelector('#b3-price-np-cancel').addEventListener('click', close);
            };

            document.querySelectorAll('#b3-numpad-grid [data-np]').forEach(npBtn => {
                Game.EventManager.on(npBtn, 'click', () => {
                    const k = npBtn.dataset.np;
                    if (k === 'clear') {
                        this.audio.play('keypad');
                        _npValue = '';
                        numpadDisplay.textContent = '--';
                    } else if (k === 'confirm') {
                        confirmNumpad();
                    } else {
                        if (_npValue.length >= 4) return;
                        this.audio.play('keypad');
                        _npValue += k;
                        numpadDisplay.textContent = _npValue;
                    }
                }, {}, 'settings');
            });
            Game.EventManager.on(document.getElementById('b3-numpad-cancel'), 'click', hideNumpad, {}, 'settings');
            Game.EventManager.on(numpadModal, 'click', (e) => { if (e.target === numpadModal) hideNumpad(); }, {}, 'settings');

            // ── 簡單模式：存款天數與金額 ──────────────────────────
            document.querySelectorAll('#daily-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#daily-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const v = btn.dataset.daily;
                    if (v === 'custom') {
                        this.state.settings.dailyAmount = 'custom';
                        showNumpad('easy');
                    } else {
                        this.state.settings.dailyAmount = v;
                        this._updateDaysPreview();
                        this._checkCanStart();
                    }
                }, {}, 'settings');
            });

            // ── 普通模式設定事件 ──────────────────────────────
            // Normal: 開始日期
            const nDateInput = document.getElementById('b3-n-start-date');
            if (nDateInput) {
                Game.EventManager.on(nDateInput, 'change', () => {
                    this.state.settings.startDate = nDateInput.value;
                }, {}, 'settings');
            }

            // Normal: 購買物品金額
            document.querySelectorAll('#n-price-range-btns .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#n-price-range-btns .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.priceRange = parseInt(btn.dataset.nrange);
                    this._updateNDaysPreview();
                    this._checkCanStart();
                }, {}, 'settings');
            });

            // Normal: 存款天數與金額（6-10/9-15/10-20/自訂金額）
            document.querySelectorAll('#n-daily-btn-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#n-daily-btn-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const v = btn.dataset.ndaily;
                    if (v === 'custom') {
                        this.state.settings.dailyAmount = 'custom';
                        showNumpad('normal');
                    } else {
                        this.state.settings.dailyAmount = v;
                        this._updateNDaysPreview();
                        this._checkCanStart();
                    }
                }, {}, 'settings');
            });

            // Hard mode: 開始日期
            const hDateInput = document.getElementById('b3-h-start-date');
            if (hDateInput) {
                Game.EventManager.on(hDateInput, 'change', () => {
                    this.state.settings.startDate = hDateInput.value;
                }, {}, 'settings');
            }

            // Hard mode: 購買物品金額
            document.querySelectorAll('#h-price-range-btns .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#h-price-range-btns .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.priceRange = parseInt(btn.dataset.hrange);
                    this._updateHDaysPreview();
                    this._checkCanStart();
                }, {}, 'settings');
            });

            // Hard mode: 存款天數與金額（6-10/9-15/10-20/自訂金額）
            document.querySelectorAll('#h-daily-btn-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#h-daily-btn-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const v = btn.dataset.hdaily;
                    if (v === 'custom') {
                        this.state.settings.dailyAmount = 'custom';
                        showNumpad('hard');
                    } else {
                        this.state.settings.dailyAmount = v;
                        this._updateHDaysPreview();
                        this._checkCanStart();
                    }
                }, {}, 'settings');
            });

            // 自訂物品上傳
            Game.EventManager.on(document.getElementById('b3-add-custom-item-btn'), 'click', () => {
                this.triggerCustomItemUpload();
            }, {}, 'settings');
            Game.EventManager.on(document.getElementById('b3-custom-image'), 'change', (e) => {
                this.handleCustomItemUpload(e);
            }, {}, 'settings');
            Game.EventManager.on(document.getElementById('b3-modal-cancel-btn'), 'click', () => {
                this.closeCustomItemPreview();
            }, {}, 'settings');
            Game.EventManager.on(document.getElementById('b3-modal-confirm-btn'), 'click', () => {
                this.confirmAddCustomItem();
            }, {}, 'settings');

            const rewardLink = document.getElementById('settings-reward-link');
            Game.EventManager.on(rewardLink, 'click', (e) => {
                e.preventDefault();
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'settings');

            Game.EventManager.on(document.getElementById('settings-worksheet-link'), 'click', (e) => {
                e.preventDefault();
                const params = new URLSearchParams({ unit: 'b3' });
                window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
            }, {}, 'settings');

            document.querySelectorAll('#b3-cat-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#b3-cat-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.itemCat = btn.dataset.cat;
                    this._updateDaysPreview();
                    this._checkCanStart();
                }, {}, 'settings');
            });

            document.querySelectorAll('#assist-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#assist-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.clickMode = btn.dataset.assist;
                    this._checkCanStart();
                }, {}, 'settings');
            });

            Game.EventManager.on(document.getElementById('start-btn'), 'click', () => this.startGame(), {}, 'settings');
        },

        // ── 自訂物品管理 ──────────────────────────────────────
        _itemIconHTML(item, size = '128px') {
            if (item.imageData) {
                return `<img src="${item.imageData}" alt="${item.name}" style="width:${size};height:${size};object-fit:cover;border-radius:8px;" draggable="false">`;
            }
            if (item.img) {
                const fallback = item.icon || '🎁';
                return `<img src="../images/${item.img}" alt="${item.name}" style="width:${size};height:${size};object-fit:contain;" draggable="false" onerror="this.replaceWith(document.createTextNode('${fallback}'))">`;
            }
            return item.icon || '🎁';
        },

        _renderCustomItemsPanel() {
            const items = this.state.customItems;
            if (!items.length) {
                return `<div class="b3-custom-empty">尚未新增自訂物品</div>`;
            }
            return items.map((item, i) => `
                <div class="b3-custom-item-card">
                    <img src="${item.imageData}" alt="${item.name}" class="b3-custom-item-img">
                    <div class="b3-custom-item-info">
                        <div class="b3-custom-item-name">${item.name}</div>
                        <div class="b3-custom-item-price">${item.price} 元</div>
                    </div>
                    <button class="b3-custom-remove-btn" onclick="Game.removeCustomItem(${i})">✕</button>
                </div>`).join('');
        },

        _updateCustomItemsPanel() {
            const panel = document.getElementById('b3-custom-items-list');
            if (panel) panel.innerHTML = this._renderCustomItemsPanel();
            // 同步按鈕文字：有物品→替換物品；無物品→上傳物品
            const btn = document.getElementById('b3-add-custom-item-btn');
            if (btn) btn.textContent = this.state.customItems.length > 0 ? '替換物品' : '上傳物品';
        },

        triggerCustomItemUpload() {
            // 不限制數量：上傳新圖片會取代既有的自訂物品
            const fileInput = document.getElementById('b3-custom-image');
            if (fileInput) { fileInput.value = ''; fileInput.click(); }
        },

        async handleCustomItemUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) { alert('請選擇圖片檔案！'); return; }
            try {
                const compressed = await b3CompressImage(file, 200, 0.7);
                this.showCustomItemPreview(compressed);
            } catch (err) {
                Game.Debug.warn('init', '圖片壓縮失敗', err);
                alert('圖片處理失敗，請重試！');
            }
        },

        showCustomItemPreview(imageDataUrl) {
            this.tempItemImageData = imageDataUrl;
            this.tempItemPrice = null;
            const modal = document.getElementById('b3-item-preview-modal');
            const img   = document.getElementById('b3-preview-image');
            if (!modal || !img) return;
            img.src = imageDataUrl;
            modal.style.display = 'flex';
            const nameInput = document.getElementById('b3-custom-item-name');
            if (nameInput) { nameInput.value = ''; Game.TimerManager.setTimeout(() => nameInput.focus(), 100, 'ui'); }
            const priceDisplay = document.getElementById('b3-item-price-display');
            if (priceDisplay) {
                priceDisplay.textContent = '點擊輸入金額';
                priceDisplay.style.color = '#d97706';
                priceDisplay.style.borderColor = '#d97706';
                priceDisplay.style.background = '#fffbeb';
            }
        },

        closeCustomItemPreview() {
            const modal = document.getElementById('b3-item-preview-modal');
            if (modal) modal.style.display = 'none';
            const fileInput = document.getElementById('b3-custom-image');
            if (fileInput) fileInput.value = '';
            this.tempItemImageData = null;
            this.tempItemPrice = null;
            // 關閉時一併移除浮動數字鍵盤
            const priceNp = document.getElementById('b3-price-numpad');
            if (priceNp) priceNp.remove();
        },

        confirmAddCustomItem() {
            const name  = (document.getElementById('b3-custom-item-name')?.value || '').trim();
            const price = this.tempItemPrice;
            if (!name)           { alert('請輸入物品名稱！'); return; }
            if (!this.tempItemImageData) { alert('圖片資料遺失，請重新上傳！'); return; }
            if (!price || price < 1 || price > 9999) { alert('請點擊金額欄位並輸入 1～9999 之間的目標金額！'); return; }
            // 限定 1 個：直接取代（不疊加）
            this.state.customItems = [{ name, price, imageData: this.tempItemImageData, isCustom: true }];
            this.closeCustomItemPreview();
            this._updateCustomItemsPanel();
            this._updateDaysPreview();
            this._checkCanStart();
            Game.Speech.speak(`已設定存錢目標：${name}`);
        },

        removeCustomItem(index) {
            const item = this.state.customItems[index];
            if (!item) return;
            if (confirm(`確定要刪除「${item.name}」嗎？`)) {
                this.state.customItems.splice(index, 1);
                this._updateCustomItemsPanel();
                this._updateDaysPreview();
                Game.Speech.speak(`已移除：${item.name}`);
            }
        },

        _updateDaysPreview() {
            const preview = document.getElementById('b3-days-preview');
            if (!preview) return;
            const s = this.state.settings;
            const range = s.priceRange;
            const daily = s.dailyAmount;

            if (!range && !daily && this.state.customItems.length === 0) {
                preview.style.display = 'none';
                return;
            }

            const niceAmounts = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500];
            const rangeTargets  = { '6-10': 8, '9-15': 12, '10-20': 15 };
            const rangeLabels   = { '6-10': '6～10', '9-15': '9～15', '10-20': '10～20' };
            const builtInInRange = range ? B3_ALL_ITEMS.filter(i => i.price <= range) : [];
            const customItems = this.state.customItems;
            const lines = [];

            if (daily in rangeTargets) {
                // 天數範圍模式：計算每天存款金額區間
                const target = rangeTargets[daily];
                const label  = rangeLabels[daily];
                if (range && builtInInRange.length > 0) {
                    const prices = builtInInRange.map(i => i.price);
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    const dailyForMin = niceAmounts.find(a => a >= minPrice / target) || 500;
                    const dailyForMax = niceAmounts.find(a => a >= maxPrice / target) || 500;
                    if (dailyForMin === dailyForMax) {
                        lines.push(`💰 每天存款約 <strong>${dailyForMin} 元</strong>，預計 <strong>${label} 天</strong>達成目標`);
                    } else {
                        lines.push(`💰 每天存款約 <strong>${dailyForMin}～${dailyForMax} 元</strong>，預計 <strong>${label} 天</strong>達成目標`);
                    }
                } else if (!range) {
                    lines.push(`📅 目標：<strong>${label} 天</strong>達成，存款金額依物品自動計算`);
                }
                customItems.forEach(item => {
                    const d = niceAmounts.find(a => a >= item.price / target) || 500;
                    const actualDays = Math.ceil(item.price / d);
                    lines.push(`🎯 ${item.name}（${item.price}元）每天存 ${d} 元，約 <strong>${actualDays} 天</strong>`);
                });
            } else if (typeof daily === 'number') {
                // 自訂金額模式
                if (range && builtInInRange.length > 0) {
                    const prices = builtInInRange.map(i => i.price);
                    const minDays = Math.ceil(Math.min(...prices) / daily);
                    const maxDays = Math.ceil(Math.max(...prices) / daily);
                    lines.push(`💰 每天存 <strong>${daily} 元</strong>，預計需要 <strong>${minDays}～${maxDays} 天</strong>`);
                }
                customItems.forEach(item => {
                    lines.push(`🎯 ${item.name}（${item.price}元）需要 <strong>${Math.ceil(item.price / daily)} 天</strong>`);
                });
            } else if (!daily && customItems.length > 0) {
                customItems.forEach(item => {
                    lines.push(`🎯 ${item.name}（${item.price}元）— 請先選擇存款天數`);
                });
            }

            if (lines.length === 0) { preview.style.display = 'none'; return; }
            preview.innerHTML = lines.join('<br>');
            preview.style.display = '';
        },

        _checkCanStart() {
            const s = this.state.settings;
            const btn = document.getElementById('start-btn');
            if (!btn) return;
            if (!s.difficulty) { btn.disabled = true; return; }
            const hasTarget = !!s.priceRange || this.state.customItems.length > 0;
            if (s.difficulty === 'easy') {
                btn.disabled = !hasTarget || !s.dailyAmount || (s.dailyAmount === 'custom');
            } else if (s.difficulty === 'normal') {
                btn.disabled = !hasTarget || !s.dailyAmount ||
                               s.dailyAmount === 'custom' || s.dailyAmount === 'preset-pending';
            } else {
                btn.disabled = !hasTarget || !s.dailyAmount || s.dailyAmount === 'custom';
            }
        },

        // 普通模式設定頁天數預覽（寫入 #b3-n-days-preview）
        _updateNDaysPreview() {
            const preview = document.getElementById('b3-n-days-preview');
            if (!preview) return;
            const s = this.state.settings;
            const range = s.priceRange;
            const daily = s.dailyAmount;
            if (!daily || daily === 'custom') { preview.style.display = 'none'; return; }
            if (!range) {
                preview.innerHTML = '📋 請先選擇購買物品金額，即可顯示存款預估';
                preview.style.display = '';
                return;
            }

            const niceAmounts  = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500];
            const rangeTargets = { '6-10': 8, '9-15': 12, '10-20': 15 };
            const rangeLabels  = { '6-10': '6～10', '9-15': '9～15', '10-20': '10～20' };
            const items = B3_ALL_ITEMS.filter(i => i.price <= range);
            if (!items.length) { preview.style.display = 'none'; return; }
            const prices = items.map(i => i.price);

            let html = '';
            if (daily in rangeTargets) {
                const target = rangeTargets[daily];
                const label  = rangeLabels[daily];
                const dailyForMin = niceAmounts.find(a => a >= Math.min(...prices) / target) || 500;
                const dailyForMax = niceAmounts.find(a => a >= Math.max(...prices) / target) || 500;
                if (dailyForMin === dailyForMax) {
                    html = `💰 每天存款約 <strong>${dailyForMin} 元</strong>，預計 <strong>${label} 天</strong>達成目標`;
                } else {
                    html = `💰 每天存款約 <strong>${dailyForMin}～${dailyForMax} 元</strong>，預計 <strong>${label} 天</strong>達成目標`;
                }
            } else if (typeof daily === 'number') {
                const minDays = Math.ceil(Math.min(...prices) / daily);
                const maxDays = Math.ceil(Math.max(...prices) / daily);
                html = minDays === maxDays
                    ? `💰 每天存 <strong>${daily} 元</strong>，預計需要 <strong>${minDays} 天</strong>`
                    : `💰 每天存 <strong>${daily} 元</strong>，預計需要 <strong>${minDays}～${maxDays} 天</strong>`;
            }

            if (!html) { preview.style.display = 'none'; return; }
            preview.innerHTML = html;
            preview.style.display = '';
        },

        // 困難模式設定頁天數預覽（寫入 #b3-h-days-preview）
        _updateHDaysPreview() {
            const preview = document.getElementById('b3-h-days-preview');
            if (!preview) return;
            const s = this.state.settings;
            const range = s.priceRange;
            const daily = s.dailyAmount;

            if (!daily || daily === 'custom') { preview.style.display = 'none'; return; }
            if (!range) {
                preview.innerHTML = '📋 請先選擇購買物品金額，即可顯示存款預估';
                preview.style.display = '';
                return;
            }

            const rangeLabels = { '6-10': '6～10', '9-15': '9～15', '10-20': '10～20' };
            const items = B3_ALL_ITEMS.filter(i => i.price <= range);
            if (!items.length) { preview.style.display = 'none'; return; }
            const prices = items.map(i => i.price);

            let html = '';
            if (daily in rangeLabels) {
                html = `📅 每天存款金額隨機變動，預計約 <strong>${rangeLabels[daily]} 天</strong>完成目標`;
            } else if (typeof daily === 'number') {
                const minDays = Math.max(1, Math.round(Math.min(...prices) / daily));
                const maxDays = Math.max(1, Math.round(Math.max(...prices) / daily));
                html = minDays === maxDays
                    ? `📅 每天存款金額隨機變動，平均約 <strong>${daily} 元</strong> / 天，預計約 <strong>${minDays} 天</strong>`
                    : `📅 每天存款金額隨機變動，平均約 <strong>${daily} 元</strong> / 天，預計約 <strong>${minDays}～${maxDays} 天</strong>`;
            }

            if (!html) { preview.style.display = 'none'; return; }
            preview.innerHTML = html;
            preview.style.display = '';
        },

        // ── 9. 遊戲開始 ───────────────────────────────────────
        startGame() {
            Game.EventManager.removeByCategory('settings');
            Game.TimerManager.clearAll();
            this.state.isEndingGame = false;
            this.state.isProcessing  = false;

            this._startCalendarSession();
        },

        // ── Calendar Session（easy / normal / hard）─────────────────────
        _startCalendarSession() {
            const s = this.state.settings;
            const diff = s.difficulty;
            const maxPrice = s.priceRange || 400;
            const builtIn = B3_ALL_ITEMS.filter(i => i.price <= maxPrice);
            const customInRange = this.state.customItems.filter(i => i.price <= maxPrice);
            const pool    = customInRange.length > 0 || builtIn.length > 0
                ? [...customInRange, ...builtIn]
                : B3_ALL_ITEMS.slice(0, 3); // fallback if range too small
            const items = pool.slice().sort(() => Math.random() - 0.5);
            const item  = items[0];

            // Calculate daily amount
            let dailyAmount;
            let hardDailyAmounts = [];
            if (diff === 'hard') {
                // Hard mode：每天金額不固定，預先產生陣列
                const rangeTargets = { '6-10': 8, '9-15': 12, '10-20': 15 };
                const hardTargetDays = rangeTargets[s.dailyAmount]
                    || (typeof s.dailyAmount === 'number' ? Math.max(3, Math.round(item.price / s.dailyAmount)) : 15);
                hardDailyAmounts = this._generateHardDailyAmounts(item.price, hardTargetDays);
                // dailyAmount 用平均值做顯示估算
                const avg = hardDailyAmounts.slice(0, hardTargetDays).reduce((a, b) => a + b, 0) / hardTargetDays;
                dailyAmount = Math.round(avg / 5) * 5 || 50;
            } else {
                const niceAmounts = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500];
                const rangeTargets = { '6-10': 8, '9-15': 12, '10-20': 15 };
                if (s.dailyAmount in rangeTargets) {
                    const target = rangeTargets[s.dailyAmount];
                    const rawPerDay = item.price / target;
                    dailyAmount = niceAmounts.find(a => a >= rawPerDay) || 500;
                } else if (!s.dailyAmount || s.dailyAmount === 'auto') {
                    const rawPerDay = item.price / 15;
                    dailyAmount = niceAmounts.find(a => a >= rawPerDay) || 100;
                } else {
                    dailyAmount = s.dailyAmount;
                }
                // Normal mode：每天金額也變動（變幅較小）
                if (diff === 'normal') {
                    hardDailyAmounts = this._generateNormalDailyAmounts(dailyAmount);
                }
            }

            // Start date
            let startDate;
            if (s.startDate) {
                startDate = new Date(s.startDate + 'T00:00:00');
            } else {
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
            }

            this.state.calendar = {
                item,
                dailyAmount,
                accumulated: 0,
                denomPile: {},
                clickedDays: 0,
                startDate,
                startTime: Date.now(),
                drag: null,
                hardDailyAmounts,
                hardSavedAmounts: [],
            };

            this.showWelcomeScreen();
        },

        // ── 歡迎畫面（進入月曆前顯示存錢目標）───────────────────────
        showWelcomeScreen() {
            const app = document.getElementById('app');
            const c = this.state.calendar;
            const _wcDiff   = this.state.settings.difficulty;
            const isHard   = _wcDiff === 'hard';
            const isNormal = _wcDiff === 'normal';
            const daysNeeded = Math.ceil(c.item.price / c.dailyAmount);

            const metaHTML = (isHard || isNormal)
                ? `<div class="b3-wc-meta-item">💰 每天存款金額不固定</div>
                   <div class="b3-wc-meta-item">⏰ 預計約 <strong>${daysNeeded}</strong> 天存到</div>`
                : `<div class="b3-wc-meta-item">💰 每天存 <strong>${c.dailyAmount}</strong> 元</div>
                   <div class="b3-wc-meta-item">⏰ 預計 <strong>${daysNeeded}</strong> 天存到</div>`;

            app.innerHTML = `
                <style>
                    .b3-wc-container {
                        display:flex;flex-direction:column;justify-content:center;
                        align-items:center;min-height:100vh;
                        background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);
                        padding:20px;
                    }
                    .b3-wc-box {
                        background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);
                        border:3px solid #fbbf24;border-radius:24px;
                        padding:48px 60px;text-align:center;
                        max-width:480px;width:100%;
                        box-shadow:0 8px 32px rgba(0,0,0,0.12);
                    }
                    .b3-wc-title {
                        font-size:22px;font-weight:800;color:#b45309;margin-bottom:20px;
                    }
                    .b3-wc-icon-wrap {
                        margin:0 auto 16px;
                        width:128px;height:128px;
                        display:flex;align-items:center;justify-content:center;
                    }
                    .b3-wc-icon-wrap img {
                        width:128px;height:128px;object-fit:contain;border-radius:8px;
                    }
                    .b3-wc-name {
                        font-size:22px;font-weight:800;color:#92400e;margin-bottom:8px;
                    }
                    .b3-wc-price {
                        font-size:32px;font-weight:900;color:#d97706;margin-bottom:16px;
                    }
                    .b3-wc-meta {
                        display:flex;flex-direction:column;gap:8px;margin-bottom:28px;
                    }
                    .b3-wc-meta-item {
                        background:rgba(255,255,255,0.7);
                        border:2px solid #fde68a;border-radius:12px;
                        padding:8px 16px;font-size:16px;color:#78350f;font-weight:600;
                    }
                    .b3-wc-start-btn {
                        background:linear-gradient(135deg,#d97706,#b45309);
                        color:#fff;border:none;border-radius:16px;
                        padding:14px 40px;font-size:20px;font-weight:700;
                        cursor:pointer;
                        box-shadow:0 4px 12px rgba(217,119,6,0.4);
                        transition:transform 0.15s,box-shadow 0.15s;
                    }
                    .b3-wc-start-btn:hover {
                        transform:translateY(-2px);
                        box-shadow:0 6px 18px rgba(217,119,6,0.5);
                    }
                    @media(max-width:480px){
                        .b3-wc-box{padding:32px 16px;}
                        .b3-wc-price{font-size:26px;}
                        .b3-wc-start-btn{font-size:17px;padding:12px 28px;}
                        .b3-wc-icon-wrap,.b3-wc-icon-wrap img{width:96px;height:96px;}
                    }
                </style>
                <div class="b3-wc-container">
                    <div class="b3-wc-box">
                        <div class="b3-wc-title">🎯 存錢目標</div>
                        <div class="b3-wc-icon-wrap">${this._itemIconHTML(c.item, '128px')}</div>
                        <div class="b3-wc-name">${c.item.name}</div>
                        <div class="b3-wc-price">需要 ${c.item.price} 元</div>
                        <div class="b3-wc-meta">${metaHTML}</div>
                        <button class="b3-wc-start-btn" id="b3-wc-start-btn">開始存錢！🐷</button>
                    </div>
                </div>`;

            Game.Speech.speak(`存錢目標，${c.item.name}，需要 ${c.item.price} 元`);

            const startBtn = document.getElementById('b3-wc-start-btn');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    window.speechSynthesis.cancel();
                    Game.Speech.speak('開始存錢', () => {
                        this.renderCalendar();
                        if (this.state.settings.clickMode === 'on') {
                            Game.TimerManager.setTimeout(() => AssistClick.activate(null), 400, 'ui');
                        }
                    });
                }, { once: true });
            }

            if (this.state.settings.clickMode === 'on') {
                Game.TimerManager.setTimeout(() => AssistClick.activate(), 400, 'ui');
            }
        },

        // ── Normal Mode：產生每日變動金額陣列（變幅較小） ──────────────
        _generateNormalDailyAmounts(baseAmount) {
            const allNice = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 300];
            const lo = Math.max(Math.round(baseAmount * 0.6 / 5) * 5, 5);
            const hi = Math.round(baseAmount * 1.5 / 5) * 5;
            let pool = allNice.filter(a => a >= lo && a <= hi);
            if (pool.length < 2) {
                pool = [
                    Math.max(5, Math.round(baseAmount * 0.7 / 5) * 5),
                    baseAmount,
                    Math.round(baseAmount * 1.3 / 5) * 5,
                ].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i);
            }
            if (!pool.length) pool = [baseAmount];
            const result = [];
            for (let i = 0; i < 80; i++) result.push(pool[Math.floor(Math.random() * pool.length)]);
            return result;
        },

        // ── Hard Mode：產生每日變動金額陣列 ──────────────────────────
        _generateHardDailyAmounts(price, targetDays = 15) {
            const avgPerDay = price / targetDays;
            const allNice = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 180, 200, 250, 300, 400, 500];
            const lo = Math.max(avgPerDay * 0.4, 5);
            const hi = avgPerDay * 2.5;
            let pool = allNice.filter(a => a >= lo && a <= hi);
            if (pool.length < 3) {
                const base = Math.max(10, Math.round(avgPerDay / 5) * 5);
                pool = [
                    Math.max(5, Math.round(base * 0.6 / 5) * 5),
                    base,
                    Math.round(base * 1.5 / 5) * 5,
                ].filter((v, i, arr) => arr.indexOf(v) === i);
            }
            const result = [];
            for (let i = 0; i < 80; i++) {
                result.push(pool[Math.floor(Math.random() * pool.length)]);
            }
            return result;
        },

        _showCalendarTaskPopup() {
            const c = this.state.calendar;
            const isHard = this.state.settings.difficulty === 'hard';
            const daysNeeded = Math.ceil(c.item.price / c.dailyAmount);
            const metaHTML = isHard
                ? `<span>💰 每天存款金額不固定</span><span>⏰ 預計約 <strong>${daysNeeded}</strong> 天存到</span>`
                : `<span>💰 每天存 <strong>${c.dailyAmount}</strong> 元</span><span>⏰ 預計 <strong>${daysNeeded}</strong> 天存到</span>`;
            const overlay = document.createElement('div');
            overlay.className = 'b3-task-popup-overlay';
            overlay.innerHTML = `
        <div class="b3-task-popup">
            <div class="b3-task-popup-title">🎯 存錢目標</div>
            <div class="b3-task-item-icon-wrap">${this._itemIconHTML(c.item, 'min(480px, 72vw)')}</div>
            <div class="b3-task-item-name">${c.item.name}</div>
            <div class="b3-task-item-price">需要 <strong>${c.item.price}</strong> 元</div>
            <div class="b3-task-meta">${metaHTML}</div>
            <button class="b3-task-start-btn" id="b3-task-start">開始存錢！🐷</button>
        </div>`;
            document.body.appendChild(overlay);
            Game.Speech.speak(`存錢目標，${c.item.name}，需要 ${c.item.price} 元`);
            document.getElementById('b3-task-start').addEventListener('click', () => {
                overlay.remove();
                AssistClick.deactivate();
                Game.Speech.speak('開始存錢');
                // 輔助點擊：開場彈窗關閉後，重新啟動以接管月曆操作
                if (Game.state.settings.clickMode === 'on') {
                    Game.TimerManager.setTimeout(() => AssistClick.activate(null), 600, 'ui');
                }
            });

            // 輔助點擊：高亮「開始存錢」按鈕
            if (this.state.settings.clickMode === 'on') {
                Game.TimerManager.setTimeout(() => AssistClick.activate(null), 400, 'ui');
            }
        },

        renderCalendar() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            this.state.isProcessing = false;

            const c = this.state.calendar;
            const diff = this.state.settings.difficulty;
            const isHard   = diff === 'hard';
            const isNormal = diff === 'normal';
            const pct = Math.min(100, Math.round((c.accumulated / c.item.price) * 100));
            const daysNeeded = Math.ceil(c.item.price / c.dailyAmount);
            const remaining = Math.max(0, c.item.price - c.accumulated);
            const modeLabel = (isHard || isNormal) ? '月曆存錢・變動金額' : '月曆存錢・投入存款';

            const app = document.getElementById('app');
            app.innerHTML = `
<div class="b-header">
    <div class="b-header-left"><span class="b-header-unit">🐷 存錢計畫</span></div>
    <div class="b-header-center">${modeLabel}</div>
    <div class="b-header-right">
        <button class="b-reward-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
        <button class="b-back-btn" onclick="Game.showSettings()">返回設定</button>
    </div>
</div>
<div class="b3-cal-layout">
    <div class="b3-cal-item-col">
        <div class="b3-cal-info-card">
            <button class="b-inline-replay b3-cal-replay-btn" id="replay-speech-btn" title="重播語音">🔊</button>
            <div class="b3-cal-item-section">
                <div class="b3-cal-item-center-col">
                    <span class="b3-cal-item-icon-lg b3-icon-zoom-trigger" id="b3-cal-icon-trigger">${this._itemIconHTML(c.item, '96px')}</span>
                    <div class="b3-cal-item-title">${c.item.name}</div>
                    <div class="b3-cal-item-target">目標：${c.item.price} 元</div>
                </div>
                <div class="b3-cal-pct-badge" id="b3-cal-pct">${pct}%</div>
            </div>
            <div class="b3-cal-progress-section">
                <div class="b3-cal-prog-bar-wrap">
                    <div class="b3-cal-progress-fill" id="b3-cal-progress-fill" style="width:${pct}%"></div>
                </div>
                <div class="b3-cal-stats-center">
                    <div class="b3-cal-stats-line">已存 <span id="b3-cal-accumulated" class="b3-cal-acc-num">${c.accumulated}</span> 元、還需 <span id="b3-cal-remaining" class="b3-cal-rem-num">${remaining}</span> 元</div>
                    <div class="b3-cal-stat-sep">｜</div>
                    <div class="b3-cal-stats-line">${(isHard || isNormal) ? '每天金額不固定' : `每天存 ${c.dailyAmount} 元`}</div>
                    <div class="b3-cal-stat-sep">｜</div>
                    <div class="b3-cal-stats-line">${(isHard || isNormal) ? `預計約 ${daysNeeded} 天` : `共 ${daysNeeded} 天`}</div>
                    <div class="b3-cal-stat-sep">｜</div>
                    <div class="b3-cal-stats-line b3-days-left-line">距完成 <span id="b3-days-left" class="b3-days-left-num">${daysNeeded}</span> 天</div>
                    <div class="b3-est-date" id="b3-est-date">計算中…</div>
                </div>
            </div>
        </div>
    </div>
    <div class="b3-cal-center-col">
        <div class="b3-cal-card" id="b3-calendar">${this._renderCalendarHTML()}</div>
    </div>
    <div class="b3-pig-col" id="b3-pig-col">
        <div class="b3-daily-card" id="b3-daily-card">
            <div class="b3-daily-header-row">
                <span class="b3-daily-header">今日可存金錢</span>
                <div class="b3-daily-hint-wrap" id="b3-daily-hint-wrap" style="display:none">
                    <img src="../images/common/hint_detective.png" class="b3-daily-hint-mascot" alt="" onerror="this.style.display='none'">
                    <button class="b3-daily-hint-btn" id="b3-daily-hint-btn">💡 提示</button>
                </div>
            </div>
            <div class="b3-daily-subtitle" id="b3-daily-subtitle">點擊日曆上的存錢圖示開始</div>
            <div class="b3-daily-items" id="b3-daily-items"></div>
        </div>
        <div class="b3-pig-card" id="b3-pig-bank">
            <div id="b3-pig-drop-zone" class="b3-pig-drop-zone" style="display:none">
                <div class="b3-pig-drop-title">存入金錢區</div>
                <div class="b3-drop-slots" id="b3-drop-slots"></div>
            </div>
            <div id="b3-pig-content">${this._renderPiggyBankCard()}</div>
        </div>
    </div>
</div>`;

            this._bindCalendarEvents();
        },

        // ── 撲滿卡片 ──────────────────────────────────────────────

        // 將金額分解為各面額張數
        _decomposeToDenominations(amount) {
            const result = {};
            let rem = Math.max(0, Math.round(amount));
            for (const d of [1000, 500, 100, 50, 10, 5, 1]) {
                if (rem >= d) { result[d] = Math.floor(rem / d); rem %= d; }
            }
            return result;
        },

        _renderPiggyBankCard(changedDenoms) {
            const c     = this.state.calendar;
            const total = c.accumulated;
            changedDenoms = changedDenoms || {};
            const pile  = c.denomPile || {};

            const pctRing = c.item ? Math.min(100, Math.round((total / c.item.price) * 100)) : 0;
            const ringDeg = pctRing * 3.6;
            const pigSectionHd = `<div class="b3-pig-section-hd">
                <span class="b3-pig-section-title">🐷 我的撲滿</span>
                <div class="b3-progress-ring-wrap">
                    <div class="b3-progress-ring" id="b3-progress-ring" style="background:conic-gradient(#f59e0b ${ringDeg}deg, #e5e7eb ${ringDeg}deg)">
                        <div class="b3-progress-ring-inner"><span id="b3-ring-pct">${pctRing}%</span></div>
                    </div>
                </div>
                <span class="b3-pig-section-total"><strong>${total}</strong> 元</span>
            </div>`;

            if (total === 0) {
                return `${pigSectionHd}
                    <div class="b3-pig-empty">點擊日期開始存錢</div>`;
            }

            // 直接使用 denomPile（不自動兌換）
            const coinDenoms = [1, 5, 10, 50].filter(d => pile[d] > 0);
            const billDenoms = [100, 500, 1000].filter(d => pile[d] > 0);
            const hasBoth    = coinDenoms.length > 0 && billDenoms.length > 0;

            const renderRow = (denom, count) => {
                const isBill    = denom >= 100;
                const imgSize   = isBill ? '90px' : '55px';
                const thumbSize = isBill ? '40px' : '28px';
                const isChanged = !!changedDenoms[denom];
                let imgs = '';
                for (let i = 0; i < count; i++) {
                    const isNew = isChanged && (i === count - 1);
                    imgs += `<span class="b3-pig-img-wrap${isNew ? ' b3-pig-img-new' : ''}"><img src="../images/money/${denom}_yuan_${b3Rf()}.png" style="width:${imgSize};height:auto;" draggable="false" alt="${denom}元"></span>`;
                }

                // 兌換按鈕
                const rule = EXCHANGE_RULES.find(r => r.from === denom && count >= r.count);
                const exchBtn = rule
                    ? `<button class="b3-pig-exch-btn" data-from="${rule.from}" data-count="${rule.count}" data-to="${rule.to}">🔄 ${rule.count}個${rule.from}元換1個${rule.to}元</button>`
                    : '';

                return `<div class="b3-pig-row">
                    <div class="b3-pig-row-label">
                        <img src="../images/money/${denom}_yuan_${b3Rf()}.png" style="width:${thumbSize};height:auto;" draggable="false" alt="" class="b3-pig-row-thumb">
                        <span class="b3-pig-row-denom">${denom}元 ×${count}</span>
                    </div>
                    <div class="b3-pig-row-imgs">${imgs}</div>
                    ${exchBtn}
                </div>`;
            };

            const coinsRows = coinDenoms.map(d => renderRow(d, pile[d])).join('');
            const billsRows = billDenoms.map(d => renderRow(d, pile[d])).join('');

            return `${pigSectionHd}
                <div class="b3-pig-body">
                    ${coinDenoms.length ? `<div class="b3-pig-group">
                        <div class="b3-pig-group-hd">🪙 硬幣</div>
                        ${coinsRows}
                    </div>` : ''}
                    ${hasBoth ? '<div class="b3-pig-group-divider"></div>' : ''}
                    ${billDenoms.length ? `<div class="b3-pig-group">
                        <div class="b3-pig-group-hd">💵 紙鈔</div>
                        ${billsRows}
                    </div>` : ''}
                </div>`;
        },

        _updatePiggyBankCard(changedDenoms = {}) {
            const card = document.getElementById('b3-pig-content');
            if (!card) return;
            card.innerHTML = this._renderPiggyBankCard(changedDenoms);
        },

        _handleExchange(from, count, to) {
            const c = this.state.calendar;
            if ((c.denomPile[from] || 0) < count) return;
            c.denomPile[from] -= count;
            if (c.denomPile[from] === 0) delete c.denomPile[from];
            c.denomPile[to] = (c.denomPile[to] || 0) + 1;
            this._updatePiggyBankCard({ [to]: true });
            this.audio.play('coin');
            Game.Speech.speak(`${count}個${from}元換成1個${to}元`);
        },

        _renderCalendarHTML() {
            const c = this.state.calendar;
            const isHard = this.state.settings.difficulty === 'hard';
            const startDate = c.startDate;
            const year  = startDate.getFullYear();
            const month = startDate.getMonth();
            const startDay = startDate.getDate();
            const nextClickDay = startDay + c.clickedDays; // 1-based day number to click next
            // hard mode：目前月份已存天數在 hardSavedAmounts 中的起始索引
            const hardBaseIdx = c.hardSavedAmounts.length - c.clickedDays;

            // First day of month (0=Sun)
            const firstWeekday = new Date(year, month, 1).getDay();
            const daysInMonth  = new Date(year, month + 1, 0).getDate();

            const weekHeaders = ['日', '一', '二', '三', '四', '五', '六']
                .map(d => `<div class="b3-cal-weekday">${d}</div>`).join('');

            let cells = '';
            // Blank cells before first day
            for (let i = 0; i < firstWeekday; i++) {
                cells += `<div class="b3-cal-cell b3-cal-blank"></div>`;
            }
            for (let d = 1; d <= daysInMonth; d++) {
                let cls = 'b3-cal-cell';
                let inner = `<span class="b3-cal-day-num">${d}</span>`;
                if (d < startDay) {
                    cls += ' b3-cal-before';
                } else if (d < nextClickDay) {
                    // Already saved
                    cls += ' b3-cal-done';
                    const savedAmt = isHard
                        ? (c.hardSavedAmounts[hardBaseIdx + (d - startDay)] ?? '?')
                        : c.dailyAmount;
                    inner += `<span class="b3-cal-saved-amt">+${savedAmt}</span><span class="b3-cal-check">✓</span>`;
                } else if (d === nextClickDay) {
                    cls += ' b3-cal-active';
                    inner += `<span class="b3-cal-coin">🐷</span>`;
                } else {
                    cls += ' b3-cal-future';
                }
                cells += `<div class="${cls}" data-day="${d}">${inner}</div>`;
            }

            return `
<div class="b3-cal-month-header">${year}年${month + 1}月</div>
<div class="b3-cal-grid">
    ${weekHeaders}
    ${cells}
</div>`;
        },

        _updateCalendarUI(skipPigUpdate = false) {
            const c = this.state.calendar;
            const pct = Math.min(100, Math.round((c.accumulated / c.item.price) * 100));
            const remaining = Math.max(0, c.item.price - c.accumulated);
            const startDay = c.startDate.getDate();
            const justClickedDay = startDay + c.clickedDays - 1;
            const nextDay = startDay + c.clickedDays;
            const daysInMonth = new Date(c.startDate.getFullYear(), c.startDate.getMonth() + 1, 0).getDate();

            // Update info card numbers
            const accEl = document.getElementById('b3-cal-accumulated');
            if (accEl) accEl.textContent = c.accumulated;
            const fillEl = document.getElementById('b3-cal-progress-fill');
            if (fillEl) fillEl.style.width = pct + '%';
            const pctEl = document.getElementById('b3-cal-pct');
            if (pctEl) pctEl.textContent = pct + '%';
            const remEl = document.getElementById('b3-cal-remaining');
            if (remEl) remEl.textContent = remaining;
            // 進度環（Round 30）
            const ringEl = document.getElementById('b3-progress-ring');
            if (ringEl) {
                ringEl.style.background = `conic-gradient(#f59e0b ${pct * 3.6}deg, #e5e7eb ${pct * 3.6}deg)`;
                const ringLabelEl = document.getElementById('b3-ring-pct');
                if (ringLabelEl) ringLabelEl.textContent = pct + '%';
            }
            // 距完成天數 + 完成預測日期（Round 37）
            const daysLeftEl = document.getElementById('b3-days-left');
            // hard mode：用最近一天的金額做估算
            const daysLeft   = remaining > 0 ? Math.ceil(remaining / (c.dailyAmount || 1)) : 0;
            if (daysLeftEl) {
                daysLeftEl.textContent = daysLeft;
                daysLeftEl.className = 'b3-days-left-num' + (daysLeft <= 3 ? ' near' : '');
            }
            const estDateEl = document.getElementById('b3-est-date');
            if (estDateEl) {
                if (remaining <= 0) {
                    estDateEl.textContent = '🎉 達標！';
                    estDateEl.className = 'b3-est-date reached';
                } else {
                    const today = new Date();
                    today.setDate(today.getDate() + daysLeft);
                    const mm = today.getMonth() + 1;
                    const dd = today.getDate();
                    estDateEl.textContent = `預計 ${mm}/${dd} 達標`;
                    estDateEl.className = 'b3-est-date' + (daysLeft <= 5 ? ' soon' : '');
                }
            }

            // Update clicked cell: active → done
            const clickedCell = document.querySelector(`.b3-cal-cell[data-day="${justClickedDay}"]`);
            if (clickedCell) {
                const isHard = this.state.settings.difficulty === 'hard';
                const savedAmt = isHard
                    ? (c.hardSavedAmounts[c.hardSavedAmounts.length - 1] ?? c.dailyAmount)
                    : c.dailyAmount;
                clickedCell.className = 'b3-cal-cell b3-cal-done';
                clickedCell.innerHTML = `<span class="b3-cal-day-num">${justClickedDay}</span><span class="b3-cal-saved-amt">+${savedAmt}</span><span class="b3-cal-check">✓</span>`;
            }

            if (nextDay <= daysInMonth) {
                // Activate next cell in same month
                const nextCell = document.querySelector(`.b3-cal-cell[data-day="${nextDay}"]`);
                if (nextCell) {
                    nextCell.className = 'b3-cal-cell b3-cal-active';
                    nextCell.innerHTML = `<span class="b3-cal-day-num">${nextDay}</span><span class="b3-cal-coin">🐷</span>`;
                    Game.EventManager.on(nextCell, 'click', () => {
                        this._handleDayClick(nextDay);
                    }, {}, 'gameUI');
                }
            } else {
                // Advance to next month and full re-render
                c.startDate = new Date(c.startDate.getFullYear(), c.startDate.getMonth() + 1, 1);
                c.clickedDays = 0;
                this.renderCalendar();
                return;
            }
            if (!skipPigUpdate) this._updatePiggyBankCard();
            this.state.isProcessing = false;
        },

        _bindCalendarEvents() {
            document.querySelectorAll('.b3-cal-active').forEach(el => {
                Game.EventManager.on(el, 'click', () => {
                    this._handleDayClick(parseInt(el.dataset.day));
                }, {}, 'gameUI');
            });
            const replayBtn = document.getElementById('replay-speech-btn');
            if (replayBtn) {
                Game.EventManager.on(replayBtn, 'click', () => {
                    const text = this.state.calendar.lastSpeech;
                    if (text) Game.Speech.speak(text);
                }, {}, 'gameUI');
            }
            // 存錢目標圖示點擊放大（月曆模式）
            const calIconEl = document.getElementById('b3-cal-icon-trigger');
            if (calIconEl) {
                Game.EventManager.on(calIconEl, 'click', () => {
                    const item = this.state.calendar.item;
                    if (item) this._showIconZoomModal(item);
                }, {}, 'gameUI');
            }
            // 兌換按鈕：委派監聽（pig-content 重繪後仍有效）
            const pigContent = document.getElementById('b3-pig-content');
            if (pigContent) {
                Game.EventManager.on(pigContent, 'click', (e) => {
                    const btn = e.target.closest('.b3-pig-exch-btn');
                    if (!btn) return;
                    this._handleExchange(
                        parseInt(btn.dataset.from),
                        parseInt(btn.dataset.count),
                        parseInt(btn.dataset.to)
                    );
                }, {}, 'gameUI');
            }
        },

        _spawnCoinParticles(originEl, amount) {
            const denom = amount >= 100 ? 100 : amount >= 50 ? 50 : amount >= 10 ? 10 : amount >= 5 ? 5 : 1;
            const isBanknote = denom >= 100;
            const imgSize = isBanknote ? '36px' : '30px';
            const COUNT = 6;
            const rect = originEl ? originEl.getBoundingClientRect() : null;
            const cx = rect ? rect.left + rect.width  / 2 : window.innerWidth  / 2;
            const cy = rect ? rect.top  + rect.height / 2 : window.innerHeight / 2;
            for (let i = 0; i < COUNT; i++) {
                const span = document.createElement('span');
                const dx = (Math.random() - 0.5) * 80;          // -40 ~ +40 px 水平漂移
                const delay = i * 60;                            // 每粒間隔 60ms
                const dur   = 700 + Math.random() * 300;        // 700~1000ms
                span.innerHTML = `<img src="../images/money/${denom}_yuan_${b3Rf()}.png" style="width:${imgSize};height:auto;display:block;" draggable="false">`;
                span.style.cssText = [
                    'position:fixed',
                    `left:${cx}px`,
                    `top:${cy}px`,
                    'pointer-events:none',
                    'z-index:99999',
                    'user-select:none',
                    `--b3-dx:${dx}px`,
                    `animation:b3CoinFloat ${dur}ms ease-out ${delay}ms both`,
                ].join(';');
                document.body.appendChild(span);
                Game.TimerManager.setTimeout(() => { span.remove(); }, dur + delay + 100, 'coinFloat');
            }
        },

        _getMoneyImagesHTML(amount) {
            const DENOMS = [100, 50, 10, 5, 1];
            const imgs = [];
            let rem = amount;
            for (const d of DENOMS) {
                while (rem >= d && imgs.length < 3) {
                    const isBanknote = d >= 100;
                    const w = isBanknote ? '64px' : '56px';
                    imgs.push(`<img src="../images/money/${d}_yuan_${b3Rf()}.png" style="width:${w};height:auto;" draggable="false" alt="${d}元">`);
                    rem -= d;
                }
                if (imgs.length >= 3) break;
            }
            return imgs.join('');
        },

        _handleDayClick(day) {
            if (this.state.isProcessing) return;
            this.state.isProcessing = true;
            this.audio.play('click');
            const c = this.state.calendar;
            const month = c.startDate.getMonth() + 1;
            const dayNum = c.clickedDays + 1;
            const diff = this.state.settings.difficulty;
            Game.Speech.speak(`${month}月${day}日，第${dayNum}天`, () => {
                if (diff === 'hard' || diff === 'normal') {
                    this._startHardDragSession(day);
                } else {
                    this._startDragSession(day);
                }
            });
        },

        // ── 拖曳存錢工作階段 ─────────────────────────────────────

        // 將金額展開為面額項目陣列（從大到小）
        _decomposeToDenomItems(amount) {
            const items = [];
            let rem = Math.max(0, Math.round(amount));
            for (const d of [1000, 500, 100, 50, 10, 5, 1]) {
                const count = Math.floor(rem / d);
                rem %= d;
                for (let i = 0; i < count; i++) {
                    items.push({ denom: d, slotIdx: items.length });
                }
            }
            return items;
        },

        _startDragSession(day) {
            const c = this.state.calendar;
            const items = this._decomposeToDenomItems(c.dailyAmount);
            items.forEach(item => { item.face = b3Rf(); }); // 每枚隨機正/反面
            c.drag = { dayBeingSaved: day, items, placedCount: 0, placedAmount: 0 };

            const pigBank = document.getElementById('b3-pig-bank');
            if (!pigBank) return;

            // 在既有的「今日可存金錢」卡片填入金錢圖示
            const subtitle = document.getElementById('b3-daily-subtitle');
            const itemsContainer = document.getElementById('b3-daily-items');
            if (subtitle) subtitle.style.display = 'none';
            if (itemsContainer) itemsContainer.innerHTML = this._renderDailyItemsHTML(items);

            // 顯示「存入金錢區」放置槽
            const dropZone = document.getElementById('b3-pig-drop-zone');
            const slotsContainer = document.getElementById('b3-drop-slots');
            if (slotsContainer) slotsContainer.innerHTML = this._renderDropZoneHTML(items);
            if (dropZone) dropZone.style.display = '';

            const speechText = `今天可以存${toTWD(c.dailyAmount)}`;
            c.lastSpeech = speechText;
            Game.Speech.speak(speechText);

            this._initCalendarDragAndDrop();
        },

        _renderDailyItemsHTML(items) {
            return items.map(item => {
                const isBill  = item.denom >= 100;
                const imgSize = isBill ? '80px' : '58px';
                const face    = item.face || b3Rf();
                return `<div class="b3-drag-coin" draggable="true"
                             data-denom="${item.denom}" data-slot-idx="${item.slotIdx}"
                             id="b3-drag-coin-${item.slotIdx}">
                    <img src="../images/money/${item.denom}_yuan_${face}.png"
                         style="width:${imgSize};height:auto;" draggable="false" alt="${item.denom}元">
                </div>`;
            }).join('');
        },

        _renderDropZoneHTML(items) {
            return items.map(item => {
                const isBill  = item.denom >= 100;
                const imgSize = isBill ? '80px' : '58px';
                const face    = item.face || b3Rf();
                return `<div class="b3-drop-slot" data-denom="${item.denom}" data-slot-idx="${item.slotIdx}">
                    <img src="../images/money/${item.denom}_yuan_${face}.png"
                         style="width:${imgSize};height:auto;" draggable="false" alt="${item.denom}元">
                </div>`;
            }).join('');
        },

        _initCalendarDragAndDrop() {
            // 桌面 HTML5 拖曳
            document.querySelectorAll('.b3-drag-coin').forEach(coin => {
                Game.EventManager.on(coin, 'dragstart', (e) => {
                    coin.classList.add('b3-dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        denom:   parseInt(coin.dataset.denom),
                        slotIdx: parseInt(coin.dataset.slotIdx),
                    }));
                    const img = coin.querySelector('img');
                    if (img && e.dataTransfer.setDragImage) {
                        // 使用 CSS 顯示尺寸（非 naturalWidth）避免偏移過大
                        const rect = img.getBoundingClientRect();
                        const iw = rect.width  || parseInt(img.style.width)  || 58;
                        const ih = rect.height || parseInt(img.style.width)  || 58;
                        e.dataTransfer.setDragImage(img, iw / 2, ih / 2);
                    }
                }, {}, 'gameUI');
                Game.EventManager.on(coin, 'dragend', () => {
                    coin.classList.remove('b3-dragging');
                }, {}, 'gameUI');
            });

            document.querySelectorAll('.b3-drop-slot').forEach(slot => {
                Game.EventManager.on(slot, 'dragover', (e) => {
                    if (!slot.classList.contains('b3-slot-filled')) {
                        e.preventDefault();
                        slot.classList.add('b3-drop-hover');
                    }
                }, {}, 'gameUI');
                Game.EventManager.on(slot, 'dragleave', () => {
                    slot.classList.remove('b3-drop-hover');
                }, {}, 'gameUI');
                Game.EventManager.on(slot, 'drop', (e) => {
                    e.preventDefault();
                    slot.classList.remove('b3-drop-hover');
                    if (slot.classList.contains('b3-slot-filled')) return;
                    try {
                        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                        this._handleCoinDrop(data.denom, data.slotIdx, slot);
                    } catch(err) {}
                }, {}, 'gameUI');
            });

            // 觸控支援（TouchDragUtility）
            if (window.TouchDragUtility) {
                const pigCol = document.getElementById('b3-pig-col');
                if (pigCol) {
                    window.TouchDragUtility.cleanupAll?.();
                    window.TouchDragUtility.registerDraggable(pigCol, '.b3-drag-coin', {
                        onDragStart: (el) => !el.classList.contains('b3-coin-placed'),
                        onDrop: (draggedEl, dropZone) => {
                            if (!dropZone?.classList.contains('b3-drop-slot')) return;
                            if (dropZone.classList.contains('b3-slot-filled')) return;
                            this._handleCoinDrop(
                                parseInt(draggedEl.dataset.denom),
                                parseInt(draggedEl.dataset.slotIdx),
                                dropZone
                            );
                        },
                    });
                    document.querySelectorAll('.b3-drop-slot').forEach(slot => {
                        window.TouchDragUtility.registerDropZone(slot);
                    });
                }
            }
        },

        // ── 普通模式：自由組合面額拖曳 ──────────────────────────

        _startNormalDragSession(day) {
            const c = this.state.calendar;
            const targetAmount = c.dailyAmount;

            // 可用面額：所有 ≤ targetAmount 的面額，加上「下一個較大面額」
            const ALL_DENOMS = [1, 5, 10, 50, 100, 500, 1000];
            const smaller = ALL_DENOMS.filter(d => d <= targetAmount);
            const nextLarger = ALL_DENOMS.find(d => d > targetAmount);
            const availDenoms = nextLarger ? [...smaller, nextLarger] : smaller;
            if (!availDenoms.length) availDenoms.push(1);

            c.drag = {
                dayBeingSaved: day,
                mode: 'normal',
                targetAmount,
                placedItems: [],  // [{ denom, uid }]
                placedTotal: 0,
                availDenoms,
                items: [],        // 完成後填入，供 _completeDragSession 使用
                errorCount: 0,
                showHint: false,
                hintSlots: [],
            };

            const pigBank = document.getElementById('b3-pig-bank');
            if (!pigBank) return;

            // 更新「今日可存金錢」卡片：顯示大數字 + 面額選項
            this._updateNormalDailyCard();

            // 顯示放置區
            const dropZone = document.getElementById('b3-pig-drop-zone');
            const slotsContainer = document.getElementById('b3-drop-slots');
            if (slotsContainer) slotsContainer.innerHTML = this._renderNormalDropZoneHTML();
            if (dropZone) dropZone.style.display = '';

            const speechText = `今天要存${toTWD(targetAmount)}，請選擇正確的面額`;
            c.lastSpeech = speechText;
            Game.Speech.speak(speechText);

            this._initNormalDragAndDrop();
            this.state.isProcessing = false;
        },

        // ── Hard Mode：每天變動金額的拖曳工作階段 ───────────────────
        _startHardDragSession(day) {
            const c = this.state.calendar;
            // 補充金額陣列（不夠時再產生）
            while (c.clickedDays >= c.hardDailyAmounts.length) {
                c.hardDailyAmounts.push(...this._generateHardDailyAmounts(c.item.price));
            }
            // 取得今天的變動金額，覆寫 dailyAmount 供 _startNormalDragSession 使用
            c.dailyAmount = c.hardDailyAmounts[c.clickedDays];
            this._startNormalDragSession(day);
        },

        _updateNormalDailyCard() {
            const c = this.state.calendar;
            const drag = c.drag;
            const subtitle = document.getElementById('b3-daily-subtitle');
            const itemsContainer = document.getElementById('b3-daily-items');
            if (subtitle) subtitle.style.display = 'none';
            if (!itemsContainer) return;
            // 顯示提示按鈕（普通／困難模式）
            const hintWrap = document.getElementById('b3-daily-hint-wrap');
            const hintBtn = document.getElementById('b3-daily-hint-btn');
            if (hintWrap) hintWrap.style.display = '';
            if (hintBtn) {
                hintBtn.textContent = '💡 提示';
                Game.EventManager.on(hintBtn, 'click', () => this._toggleDepositHint(), {}, 'gameUI');
            }
            itemsContainer.innerHTML = `
<div class="b3-normal-target-wrap">
    <div class="b3-normal-target-amount">${drag.targetAmount}</div>
    <div class="b3-normal-target-unit">元</div>
</div>
<div class="b3-normal-denom-sources">
    ${(() => {
        const tf = {};
        drag.availDenoms.forEach(d => { tf[d] = b3Rf(); });
        this.state.calendar.drag.trayFaces = tf;
        return drag.availDenoms.map(d => {
            const isBill = d >= 100;
            const imgSize = isBill ? '72px' : '54px';
            return `<div class="b3-ndrag-denom" draggable="true" data-denom="${d}">
                <img src="../images/money/${d}_yuan_${tf[d]}.png" style="width:${imgSize};height:auto;" draggable="false" alt="${d}元">
                <div class="b3-ndrag-label">${d}元</div>
            </div>`;
        }).join('');
    })()}
</div>`;
        },

        _renderNormalDropZoneHTML() {
            const c = this.state.calendar;
            const drag = c.drag;
            if (!drag || drag.mode !== 'normal') return '';
            const total = drag.placedTotal;
            const target = drag.targetAmount;
            const isHard = this.state.settings.difficulty === 'hard';

            // 提示模式：ghost slots（未填=淡化，已填=正常）；一般模式：每枚各自顯示
            let placedHTML;
            const tf = drag.trayFaces || {};
            if (drag.showHint && drag.hintSlots?.length) {
                placedHTML = drag.hintSlots.map((slot, idx) => {
                    const isBill = slot.denom >= 100;
                    const imgSize = isBill ? '68px' : '44px';
                    const face = slot.face || tf[slot.denom] || 'front';
                    return `<div class="b3-nplaced-item${slot.filled ? '' : ' b3-nplaced-ghost-slot'}" data-hint-idx="${idx}">
                        <img src="../images/money/${slot.denom}_yuan_${face}.png" style="width:${imgSize};height:auto;" draggable="false" alt="${slot.denom}元">
                    </div>`;
                }).join('');
            } else {
                placedHTML = drag.placedItems.length
                    ? drag.placedItems.map(({ denom }) => {
                        const isBill = denom >= 100;
                        const imgSize = isBill ? '68px' : '44px';
                        const face = tf[denom] || 'front';
                        return `<div class="b3-nplaced-item">
                            <img src="../images/money/${denom}_yuan_${face}.png" style="width:${imgSize};height:auto;" draggable="false" alt="${denom}元">
                        </div>`;
                    }).join('')
                    : `<div class="b3-nplace-hint">拖曳或點擊面額放入此處</div>`;
            }

            const hideAmount = this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard';
            const totalColor = hideAmount ? '#888' : (total === target ? '#16a34a' : total > target ? '#dc2626' : '#1e40af');
            const confirmDisabled = total <= 0 ? 'disabled' : '';
            return `
<div class="b3-normal-placed-area" id="b3-normal-placed-area">${placedHTML}</div>
<div class="b3-normal-total-row">
    <span>已存：</span><span id="b3-n-total" style="color:${totalColor};font-weight:900;">${hideAmount ? '？' : total + ' 元'}</span>
    ${hideAmount ? '' : `<span> / 目標：${target} 元</span>`}
</div>
<div class="b3-normal-action-row">
    <button class="b3-normal-clear-btn" id="b3-normal-clear-btn">🗑️ 清除</button>
    <button class="b3-normal-confirm-btn" id="b3-normal-confirm-btn" ${confirmDisabled}>✅ 確認</button>
</div>`;
        },

        _initNormalDragAndDrop() {
            // 1. HTML5 拖曳：來源面額（drag source tiles）
            document.querySelectorAll('.b3-ndrag-denom').forEach(tile => {
                Game.EventManager.on(tile, 'dragstart', (e) => {
                    tile.classList.add('b3-ndragging');
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/plain', JSON.stringify({ denom: parseInt(tile.dataset.denom) }));
                    const img = tile.querySelector('img');
                    if (img && e.dataTransfer.setDragImage) {
                        const rect = img.getBoundingClientRect();
                        const iw = rect.width || 54;
                        const ih = rect.height || 54;
                        e.dataTransfer.setDragImage(img, iw / 2, ih / 2);
                    }
                }, {}, 'gameUI');
                Game.EventManager.on(tile, 'dragend', () => tile.classList.remove('b3-ndragging'), {}, 'gameUI');
                // 點擊也能新增
                Game.EventManager.on(tile, 'click', () => {
                    this._handleNormalDrop(parseInt(tile.dataset.denom));
                }, {}, 'gameUI');
            });

            // 2. 觸控支援（TouchDragUtility）
            if (window.TouchDragUtility) {
                const pigCol = document.getElementById('b3-pig-col');
                if (pigCol) {
                    window.TouchDragUtility.cleanupAll?.();
                    window.TouchDragUtility.registerDraggable(pigCol, '.b3-ndrag-denom', {
                        onDragStart: () => true,
                        onDrop: (draggedEl) => {
                            this._handleNormalDrop(parseInt(draggedEl.dataset.denom));
                        },
                    });
                }
                // 登記整個「存入金錢區」容器為 drop zone（持久存在，不被 DOM 更新破壞）
                // 作為 b3-normal-placed-area 之外的 fallback（手指落在合計列/按鈕區時仍能觸發）
                const pigDropZone = document.getElementById('b3-pig-drop-zone');
                if (pigDropZone) window.TouchDragUtility.registerDropZone(pigDropZone);
            }

            // 3. 放置區事件（每次 DOM 更新後需重綁）
            this._bindNormalDropZoneEvents();
        },

        _bindNormalDropZoneEvents() {
            // 放置區：直接綁定到 b3-normal-placed-area（HTML5 dragover 必須在目標元素上 preventDefault）
            const dropZone = document.getElementById('b3-normal-placed-area');
            if (dropZone) {
                Game.EventManager.on(dropZone, 'dragover', (e) => {
                    e.preventDefault();
                    dropZone.classList.add('b3-ndrop-hover');
                }, {}, 'gameUI');
                Game.EventManager.on(dropZone, 'dragleave', (e) => {
                    if (!dropZone.contains(e.relatedTarget)) {
                        dropZone.classList.remove('b3-ndrop-hover');
                    }
                }, {}, 'gameUI');
                Game.EventManager.on(dropZone, 'drop', (e) => {
                    e.preventDefault();
                    dropZone.classList.remove('b3-ndrop-hover');
                    try {
                        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                        if (data.denom) this._handleNormalDrop(data.denom);
                    } catch(err) {}
                }, {}, 'gameUI');
                // 觸控放置區（每次更新後重新登記新元素）
                if (window.TouchDragUtility) {
                    window.TouchDragUtility.registerDropZone(dropZone);
                }
            }
            const confirmBtn = document.getElementById('b3-normal-confirm-btn');
            if (confirmBtn) Game.EventManager.on(confirmBtn, 'click', () => this._confirmNormalDeposit(), {}, 'gameUI');
            const clearBtn = document.getElementById('b3-normal-clear-btn');
            if (clearBtn) Game.EventManager.on(clearBtn, 'click', () => this._clearNormalDropZone(), {}, 'gameUI');
        },

        _handleNormalDrop(denom) {
            const c = this.state.calendar;
            if (!c.drag || c.drag.mode !== 'normal') return;
            if (this.state.isProcessing) return;

            // 提示模式：找對應 ghost slot 填入（直接更新 DOM，不重繪整體避免閃爍）
            if (c.drag.showHint && c.drag.hintSlots?.length) {
                const slotIdx = c.drag.hintSlots.findIndex(s => s.denom === denom && !s.filled);
                if (slotIdx === -1) {
                    this.audio.play('error');
                    return;
                }
                c.drag.hintSlots[slotIdx].filled = true;
                c.drag.placedItems.push({ denom, uid: Date.now() + '_' + Math.random().toString(36).slice(2, 7) });
                c.drag.placedTotal += denom;
                this.audio.play('coin');
                // 直接移除該槽位的 ghost class，讓 CSS transition 從淡化漸變為正常
                const slotEl = document.querySelector(`[data-hint-idx="${slotIdx}"]`);
                if (slotEl) slotEl.classList.remove('b3-nplaced-ghost-slot');
                // 僅更新確認按鈕啟用狀態
                const confirmBtn = document.getElementById('b3-normal-confirm-btn');
                if (confirmBtn) confirmBtn.disabled = c.drag.placedTotal <= 0;
                return;
            }

            // 一般模式
            const newTotal = c.drag.placedTotal + denom;
            const target = c.drag.targetAmount;
            if (newTotal > target && this.state.settings.difficulty !== 'hard') {
                this.audio.play('error');
                Game.Speech.speak(`放太多了！目標是${toTWD(target)}`);
                return;
            }
            this.audio.play('coin');
            const uid = Date.now() + '_' + Math.random().toString(36).slice(2, 7);
            c.drag.placedItems.push({ denom, uid });
            c.drag.placedTotal = newTotal;
            this._updateNormalDropZone();
            if (this.state.settings.difficulty !== 'hard') {
                Game.TimerManager.setTimeout(() => Game.Speech.speak(toTWD(newTotal)), 80, 'ui');
            }
        },

        _updateNormalDropZone() {
            const slotsContainer = document.getElementById('b3-drop-slots');
            if (slotsContainer) slotsContainer.innerHTML = this._renderNormalDropZoneHTML();
            this._bindNormalDropZoneEvents();
        },

        _clearNormalDropZone() {
            const c = this.state.calendar;
            if (!c.drag || c.drag.mode !== 'normal') return;
            c.drag.placedItems = [];
            c.drag.placedTotal = 0;
            if (c.drag.showHint && c.drag.hintSlots) {
                c.drag.hintSlots.forEach(s => s.filled = false);
            }
            this._updateNormalDropZone();
        },

        _confirmNormalDeposit() {
            const c = this.state.calendar;
            if (!c.drag || c.drag.mode !== 'normal') return;
            if (this.state.isProcessing) return;
            const { placedTotal, targetAmount } = c.drag;
            if (placedTotal === targetAmount) {
                this.state.isProcessing = true;
                this.audio.play('correct');
                // 移除提示高亮
                document.querySelectorAll('.b3-ndrag-hint').forEach(el => el.classList.remove('b3-ndrag-hint'));
                c.drag.items = c.drag.placedItems.map((item, i) => ({ denom: item.denom, slotIdx: i }));
                c.drag.placedCount = c.drag.items.length;
                c.drag.placedAmount = placedTotal;
                Game.Speech.speak(`存入${toTWD(targetAmount)}，正確！`, () => {
                    this._completeDragSession();
                });
            } else if (placedTotal > targetAmount) {
                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                c.drag.errorCount++;
                this.audio.play('error');
                Game.TimerManager.setTimeout(() => {
                    Game.Speech.speak(`不對喔，你存的錢太多，請再試一次`);
                }, 300, 'ui');
                if (c.drag.errorCount >= 3 && this.state.settings.difficulty === 'normal' && !c.drag.showHint) {
                    this._toggleDepositHint(); // 含退回動畫 + 清空 + ghost slot 淡化提示
                } else {
                    document.querySelectorAll('.b3-nplaced-item').forEach(el => el.classList.add('b3-nplaced-return'));
                    Game.TimerManager.setTimeout(() => { this._clearNormalDropZone(); }, 240, 'ui');
                }
            } else {
                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                c.drag.errorCount++;
                this.audio.play('error');
                Game.TimerManager.setTimeout(() => {
                    Game.Speech.speak(`不對喔，你存的錢太少，請再試一次`);
                }, 300, 'ui');
                if (c.drag.errorCount >= 3 && this.state.settings.difficulty === 'normal' && !c.drag.showHint) {
                    this._toggleDepositHint(); // 含退回動畫 + 清空 + ghost slot 淡化提示
                } else {
                    document.querySelectorAll('.b3-nplaced-item').forEach(el => el.classList.add('b3-nplaced-return'));
                    Game.TimerManager.setTimeout(() => { this._clearNormalDropZone(); }, 240, 'ui');
                }
            }
        },

        _toggleDepositHint() {
            const c = this.state.calendar;
            if (!c.drag) return;
            // 困難模式：彈窗顯示正確組合圖示＋語音
            if (this.state.settings.difficulty === 'hard') {
                this._showHardModeHintModal();
                return;
            }
            // 普通模式：ghost slots
            c.drag.showHint = !c.drag.showHint;
            const btn = document.getElementById('b3-daily-hint-btn');
            if (btn) btn.textContent = c.drag.showHint ? '💡 隱藏' : '💡 提示';
            if (c.drag.showHint) {
                c.drag.errorCount = 0; // 啟用提示時重置錯誤計數，避免立即再次觸發提示
                // 計算正確組合 → hintSlots
                const ALL_DENOMS = [1000, 500, 100, 50, 10, 5, 1];
                let rem = c.drag.targetAmount;
                const slots = [];
                const tf = c.drag.trayFaces || {};
                ALL_DENOMS.forEach(d => {
                    if (rem >= d) {
                        const cnt = Math.floor(rem / d);
                        for (let i = 0; i < cnt; i++) slots.push({ denom: d, filled: false, face: tf[d] || b3Rf() });
                        rem %= d;
                    }
                });
                c.drag.hintSlots = slots;
                // 語音提示：「可以存入 2 個 10 元，1 個 5 元」
                const denomCounts = {};
                slots.forEach(s => denomCounts[s.denom] = (denomCounts[s.denom] || 0) + 1);
                const parts = Object.entries(denomCounts)
                    .sort(([a], [b]) => b - a)
                    .map(([d, cnt]) => `${cnt}個${d}元`);
                Game.Speech.speak(`可以存入${parts.join('，')}`);
                if (c.drag.placedItems.length) {
                    // 已放置金錢先播退回動畫，再清除並顯示 ghost slots
                    document.querySelectorAll('.b3-nplaced-item').forEach(el => el.classList.add('b3-nplaced-return'));
                    Game.TimerManager.setTimeout(() => {
                        c.drag.placedItems = [];
                        c.drag.placedTotal = 0;
                        this._updateNormalDropZone();
                    }, 240, 'ui');
                } else {
                    this._updateNormalDropZone();
                }
            } else {
                c.drag.hintSlots = [];
                this._updateNormalDropZone();
            }
        },

        _showHardModeHintModal() {
            const c = this.state.calendar;
            if (!c.drag) return;
            const target = c.drag.targetAmount;
            // 貪婪分解面額組合
            const ALL_DENOMS = [1000, 500, 100, 50, 10, 5, 1];
            let rem = target;
            const items = [];
            ALL_DENOMS.forEach(d => {
                if (rem >= d) {
                    const cnt = Math.floor(rem / d);
                    for (let i = 0; i < cnt; i++) items.push(d);
                    rem %= d;
                }
            });
            // 語音說明
            const denomCounts = {};
            items.forEach(d => denomCounts[d] = (denomCounts[d] || 0) + 1);
            const parts = Object.entries(denomCounts)
                .sort(([a], [b]) => b - a)
                .map(([d, cnt]) => `${cnt}個${d}元`);
            Game.Speech.speak(`今天要存${toTWD(target)}，可以用${parts.join('，')}`);
            // 彈窗
            const existing = document.getElementById('b3-hard-hint-modal');
            if (existing) existing.remove();
            const modal = document.createElement('div');
            modal.id = 'b3-hard-hint-modal';
            modal.className = 'b3-hint-modal-overlay';
            modal.innerHTML = `<div class="b3-hint-modal">
                <div class="b3-hint-modal-title">💡 今天要存 ${target} 元</div>
                <div class="b3-hint-modal-imgs">
                    ${items.map(d => {
                        const imgSize = d >= 100 ? '62px' : '48px';
                        return `<img src="../images/money/${d}_yuan_${b3Rf()}.png" style="width:${imgSize};height:auto;" draggable="false" alt="${d}元">`;
                    }).join('')}
                </div>
                <button class="b3-hint-modal-close">✕ 關閉</button>
            </div>`;
            document.body.appendChild(modal);
            const close = () => { window.speechSynthesis.cancel(); modal.remove(); };
            modal.querySelector('.b3-hint-modal-close').addEventListener('click', close);
            modal.addEventListener('click', e => { if (e.target === modal) close(); });
        },

        _showNormalDepositHint() {
            const c = this.state.calendar;
            if (!c.drag) return;
            const target = c.drag.targetAmount;
            // 貪婪分解最佳面額組合
            const ALL_DENOMS = [1000, 500, 100, 50, 10, 5, 1];
            let remaining = target;
            const hintMap = {};
            ALL_DENOMS.forEach(d => {
                if (remaining >= d) {
                    hintMap[d] = Math.floor(remaining / d);
                    remaining %= d;
                }
            });
            // 高亮對應面額格子（脈動動畫）
            document.querySelectorAll('.b3-ndrag-denom').forEach(tile => {
                const d = parseInt(tile.dataset.denom);
                if (hintMap[d]) tile.classList.add('b3-ndrag-hint');
            });
            // 語音提示
            const parts = Object.entries(hintMap)
                .filter(([, cnt]) => cnt > 0)
                .sort(([a], [b]) => b - a)
                .map(([d, cnt]) => `${d}元${cnt > 1 ? cnt + '個' : ''}`);
            Game.Speech.speak(`提示：可以用 ${parts.join('、')} 組合成${toTWD(target)}`);
        },

        // ── Easy 模式：對應槽位放置 ──────────────────────────────

        _handleCoinDrop(denom, slotIdx, targetSlot) {
            const c = this.state.calendar;
            if (!c.drag) return;
            const targetDenom = parseInt(targetSlot.dataset.denom);
            if (denom !== targetDenom) {
                this.audio.play('error');
                targetSlot.classList.add('b3-drop-wrong');
                Game.TimerManager.setTimeout(() => targetSlot.classList.remove('b3-drop-wrong'), 500, 'ui');
                return;
            }
            // 填充槽位
            this.audio.play('coin');
            targetSlot.classList.add('b3-slot-filled');
            const check = document.createElement('div');
            check.className = 'b3-slot-check';
            check.textContent = '✓';
            targetSlot.appendChild(check);

            // 隱藏來源金錢圖示
            const sourceCoin = document.getElementById(`b3-drag-coin-${slotIdx}`);
            if (sourceCoin) sourceCoin.classList.add('b3-coin-placed');

            c.drag.placedCount++;
            c.drag.placedAmount += denom;
            const isLast = c.drag.placedCount >= c.drag.items.length;
            if (isLast) {
                Game.Speech.speak(`存入${toTWD(c.drag.placedAmount)}`, () => {
                    this._completeDragSession();
                });
            } else {
                Game.Speech.speak(`存入${toTWD(c.drag.placedAmount)}`);
            }
        },

        _completeDragSession() {
            const c = this.state.calendar;
            if (!c.drag) return;
            const draggedItems = c.drag.items; // 存起來，下面 c.drag = null 後仍可用
            const savedAmount  = c.dailyAmount; // 本次實際存入金額（hard mode 已在 _startHardDragSession 更新）
            c.drag = null;

            // hard mode：記錄本天實際存入金額
            if (this.state.settings.difficulty === 'hard') {
                c.hardSavedAmounts.push(savedAmount);
            }

            this.audio.play('correct');
            const pigBank = document.getElementById('b3-pig-bank');
            this._spawnCoinParticles(pigBank, savedAmount);

            const prevAccum = c.accumulated;
            c.accumulated += savedAmount;
            c.clickedDays++;

            // 里程碑偵測（25 / 50 / 75 %）
            const prevPct = Math.floor(prevAccum / c.item.price * 100);
            const newPct  = Math.floor(c.accumulated / c.item.price * 100);
            const crossed = [25, 50, 75].find(m => prevPct < m && newPct >= m);
            if (crossed) this._showMilestoneBadge(crossed);

            // 存錢粒子特效（Round 38）
            this._showSavingsSparkle();

            // 更新 denomPile（不做自動兌換，逐枚加入）
            const changedDenoms = {};
            draggedItems.forEach(item => {
                c.denomPile[item.denom] = (c.denomPile[item.denom] || 0) + 1;
                changedDenoms[item.denom] = true;
            });

            // 清除來源卡片金錢圖示，恢復提示文字
            const subtitle = document.getElementById('b3-daily-subtitle');
            const itemsContainer = document.getElementById('b3-daily-items');
            if (itemsContainer) itemsContainer.innerHTML = '';
            if (subtitle) subtitle.style.display = '';
            const hintWrap = document.getElementById('b3-daily-hint-wrap');
            if (hintWrap) hintWrap.style.display = 'none';

            // 立即隱藏「存入金錢區」
            const dropZone = document.getElementById('b3-pig-drop-zone');
            const slotsContainer = document.getElementById('b3-drop-slots');
            if (dropZone) dropZone.style.display = 'none';
            if (slotsContainer) slotsContainer.innerHTML = '';

            // 立即更新撲滿（不等語音完成，顯示新增面額動畫）
            this._updatePiggyBankCard(changedDenoms);

            const reached   = c.accumulated >= c.item.price;
            if (reached) {
                const speechText = `太棒了！存到${toTWD(c.accumulated)}了，可以買${c.item.name}了！`;
                c.lastSpeech = speechText;
                Game.Speech.speak(speechText, () => {
                    this.state.isProcessing = false;
                    Game.TimerManager.setTimeout(() => this._onCalendarGoalReached(), 400, 'turnTransition');
                });
            } else {
                this._updateCalendarUI(true); // pig already updated
                const remaining = Math.max(0, c.item.price - c.accumulated);
                const daysLeft  = Math.ceil(remaining / (c.dailyAmount || 1));
                const _dlCh = [,'一','兩','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十'][daysLeft] || String(daysLeft);
                const speechText = `存入${toTWD(savedAmount)}！還差${toTWD(remaining)}，再存${_dlCh}天就達標了！`;
                c.lastSpeech = speechText;
                Game.Speech.speak(speechText);
                this._showCountdownHint(remaining, daysLeft);
            }
        },

        // ── 倒數提示浮動卡（B1 _showExactMatchToast pattern）─────
        _showCountdownHint(remaining, daysLeft) {
            const prev = document.getElementById('b3-countdown-hint');
            if (prev) prev.remove();
            const hint = document.createElement('div');
            hint.id = 'b3-countdown-hint';
            hint.className = 'b3-countdown-hint';
            hint.innerHTML = `<span class="b3-cd-num">${remaining}</span><span class="b3-cd-label">元・再存 ${daysLeft} 天</span>`;
            document.body.appendChild(hint);
            Game.TimerManager.setTimeout(() => {
                hint.classList.add('b3-cd-fade');
                Game.TimerManager.setTimeout(() => { if (hint.parentNode) hint.remove(); }, 400, 'ui');
            }, 2000, 'ui');
        },

        // ── 存錢粒子特效（Round 38）──────────────────────────────
        _showSavingsSparkle() {
            const emojis = ['✨', '💫', '⭐', '🌟', '💰'];
            const pigBank = document.getElementById('b3-pig-bank');
            const rect = pigBank ? pigBank.getBoundingClientRect() : null;
            const baseLeft = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
            const baseTop  = rect ? rect.top : window.innerHeight / 2;
            for (let i = 0; i < 5; i++) {
                const sp = document.createElement('div');
                sp.className = 'b3-sparkle';
                sp.textContent = emojis[i % emojis.length];
                sp.style.cssText = `left:${baseLeft - 40 + Math.random() * 80}px;top:${baseTop + Math.random() * 30}px;animation-delay:${Math.random() * 0.25}s;position:fixed;`;
                document.body.appendChild(sp);
                Game.TimerManager.setTimeout(() => sp.remove(), 1400, 'ui');
            }
        },

        _showMilestoneBadge(pct) {
            const existing = document.getElementById('b3-milestone-badge');
            if (existing) existing.remove();
            const labels  = { 25: '存了四分之一！🎉', 50: '存了一半！🌟', 75: '快到了！💪' };
            // 里程碑慶賀語音（Round 44：更具體的鼓勵語句）
            const celebSpeeches = {
                25: '已經存了四分之一了，繼續加油！',
                50: '存了一半了，真棒！',
                75: '快到了，差一點點！',
            };
            const badge = document.createElement('div');
            badge.id = 'b3-milestone-badge';
            badge.className = 'b3-milestone-badge';
            badge.innerHTML = `<span class="b3-milestone-pct">${pct}%</span><span>${labels[pct]}</span>`;
            document.body.appendChild(badge);
            this.audio.play('correct');
            Game.TimerManager.setTimeout(() => Game.Speech.speak(celebSpeeches[pct]), 200, 'ui');
            Game.TimerManager.setTimeout(() => {
                if (document.body.contains(badge)) badge.remove();
            }, 2200, 'ui');
        },

        _onCalendarGoalReached() {
            if (this.state.isEndingGame) return;
            this.state.isEndingGame = true;

            const c = this.state.calendar;
            // 100% 達標慶賀語音（Round 44）
            const itemName = c.item ? c.item.name : '目標';
            Game.Speech.speak(`達標了！${itemName}可以買了！`);

            // 達標煙火慶祝（Round 45）
            if (typeof confetti === 'function') {
                const burst = (angle, x) => confetti({ angle, spread: 55, particleCount: 40, origin: { x, y: 0.55 }, zIndex: 10200 });
                burst(60, 0.25);
                Game.TimerManager.setTimeout(() => burst(120, 0.75), 300, 'ui');
                Game.TimerManager.setTimeout(() => burst(90, 0.5), 600, 'ui');
            }
            const elapsed = c.startTime ? (Date.now() - c.startTime) : 0;
            const mins = Math.floor(elapsed / 60000);
            const secs = Math.floor((elapsed % 60000) / 1000);

            // 學習紀錄（月曆存錢模式：以完成存款天數計）
            window.LearningTracker?.save({ unit: 'b3', unitName: 'B3 存錢計畫', series: 'B',
                score: c.clickedDays || 0, total: c.clickedDays || 0,
                difficulty: this.state.settings?.difficulty,
                durationSec: Math.floor(elapsed / 1000) });

            const app = document.getElementById('app');
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            app.style.overflow = 'auto'; app.style.height = 'auto'; app.style.minHeight = '100vh';

            // ── 第一畫面：達成存錢目標 ──
            app.innerHTML = `
<div class="b-res-wrapper">
    <div class="b-res-screen">
        <div class="b-res-header">
            <div class="b-res-trophy" style="font-size:3rem;animation:none;">🎉</div>
            <h1 class="b-res-title">達成存錢目標！</h1>
        </div>
        <div class="b-res-container">
            <div class="b3-cal-success-item">
                <span class="b3-cal-success-icon">${this._itemIconHTML(c.item, '160px')}</span>
                <div class="b3-cal-success-name">${c.item.name} 買到了！</div>
                <div class="b3-cal-success-price">${c.item.price} 元</div>
            </div>
            <div class="b-res-grid" style="grid-template-columns:1fr 1fr;">
                <div class="b-res-card b-res-card-1">
                    <div class="b-res-icon">📅</div>
                    <div class="b-res-label">存錢天數</div>
                    <div class="b-res-value">${c.clickedDays} 天</div>
                </div>
                <div class="b-res-card b-res-card-2">
                    <div class="b-res-icon">💰</div>
                    <div class="b-res-label">每天存款</div>
                    <div class="b-res-value">${c.dailyAmount} 元</div>
                </div>
            </div>
            <div class="b-res-btns">
                <button id="b3-view-summary-btn" class="b-res-play-btn">
                    <span class="btn-icon">📊</span><span class="btn-text">查看測驗總結</span>
                </button>
            </div>
        </div>
    </div>
</div>`;

            // 輔助點擊：目標達成畫面渲染後主動呼叫 buildQueue
            // （不依賴 MutationObserver，避免 queue 仍有舊步驟時 observer 跳過偵測）
            if (this.state.settings.clickMode === 'on') {
                Game.TimerManager.setTimeout(() => {
                    if (AssistClick._enabled) AssistClick.buildQueue();
                }, 300, 'ui');
            }

            Game.EventManager.on(document.getElementById('b3-view-summary-btn'), 'click', () => {
                window.speechSynthesis.cancel();
                Game.EventManager.removeByCategory('gameUI');
                AssistClick.deactivate(); // 測驗總結畫面讓使用者自行操作
                // ── 第二畫面：測驗總結 ──
                app.innerHTML = `
<div class="b-res-wrapper">
    <div class="b-res-screen">
        <div class="b-res-header">
            <div class="b-res-trophy">🏆</div>
            <div class="b-res-title-row">
                <img src="../images/common/hint_detective.png"
                     class="b-res-mascot" alt="金錢小助手" onerror="this.style.display='none'">
                <h1 class="b-res-title">🎉 存錢成功！🎉</h1>
                <span class="b-res-mascot-spacer"></span>
            </div>
        </div>
        <div class="b-res-reward-wrap">
            <a href="#" id="endgame-reward-link" class="b-res-reward-link">
                🎁 開啟獎勵系統
            </a>
        </div>
        <div class="b-res-container">
            <div class="b-res-grid" style="grid-template-columns:1fr 1fr;">
                <div class="b-res-card b-res-card-1">
                    <div class="b-res-icon">✅</div>
                    <div class="b-res-label">完成天數</div>
                    <div class="b-res-value">${c.clickedDays} 天</div>
                </div>
                <div class="b-res-card b-res-card-2">
                    <div class="b-res-icon">⏱️</div>
                    <div class="b-res-label">完成時間</div>
                    <div class="b-res-value">${mins > 0 ? mins + '分' : ''}${secs}秒</div>
                </div>
            </div>
            <div class="b-res-perf-section">
                <h3>📊 表現評價</h3>
                <div class="b-res-perf-badge" style="background:#f59e0b;">
                    🏆 完成了 ${c.clickedDays} 天，成功存到夢想物品！
                </div>
            </div>
            <div class="b-res-achievements">
                <h3>🏆 學習成果</h3>
                <div class="b-res-ach-list">
                    <div class="b-res-ach-item">✅ 了解每天存錢的重要性</div>
                    <div class="b-res-ach-item">✅ 體驗為目標存錢的過程</div>
                    <div class="b-res-ach-item">✅ 學習累積存款達成夢想</div>
                </div>
            </div>
            <div class="b-res-btns">
                <button id="play-again-btn" class="b-res-play-btn">
                    <span class="btn-icon">🔄</span><span class="btn-text">再玩一次</span>
                </button>
                <button id="back-settings-btn" class="b-res-back-btn">
                    <span class="btn-icon">⚙️</span><span class="btn-text">返回設定</span>
                </button>
            </div>
        </div>
    </div>
</div>`;
                Game.EventManager.on(document.getElementById('play-again-btn'), 'click',
                    () => this.startGame(), {}, 'gameUI');
                Game.EventManager.on(document.getElementById('back-settings-btn'), 'click',
                    () => this.showSettings(), {}, 'gameUI');
                Game.EventManager.on(document.getElementById('endgame-reward-link'), 'click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                    else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                }, {}, 'gameUI');
                this._fireConfetti();
                Game.TimerManager.setTimeout(() => Game.Speech.speak('存錢成功，繼續加油！'), 300, 'speech');
            }, {}, 'gameUI');

            Game.TimerManager.setTimeout(() => {
                document.getElementById('success-sound')?.play();
                this._fireConfetti();
            }, 100, 'confetti');
            Game.TimerManager.setTimeout(() => {
                Game.Speech.speak(`太棒了！你只用了${c.clickedDays}天就存到了${toTWD(c.item.price)}，買到了${c.item.name}！`);
            }, 800, 'speech');
        },

        // ── 10. 題目產生 ──────────────────────────────────────
        _generateQuestions(count) {
            const diff    = this.state.settings.difficulty;
            const cat     = this.state.settings.itemCat || 'all';
            const builtIn = B3_ITEMS_BY_DIFF[diff];
            const filtered = (cat && cat !== 'all') ? builtIn.filter(i => i.cat === cat) : builtIn;
            const catPool  = filtered.length >= 2 ? filtered : builtIn; // fallback if too few
            const pool    = this.state.customItems.length > 0
                ? [...this.state.customItems, ...catPool]
                : catPool;
            const items   = pool.slice().sort(() => Math.random() - 0.5);
            const weekly  = B3_WEEKLY_OPTIONS[diff];
            const result  = [];

            for (let i = 0; i < count; i++) {
                const item   = items[i % items.length];
                const wkAmt  = weekly[Math.floor(Math.random() * weekly.length)];
                const answer = Math.ceil(item.price / wkAmt);
                const choices = diff === 'easy' ? this._generateChoices(answer) : null;
                result.push({ item, weekly: wkAmt, answer, choices });
            }
            return result;
        },

        _generateChoices(correct) {
            // 4選項 + 結構化干擾項（C1 adaptive pool pattern，Round 42）
            // 針對常見計算錯誤設計干擾：少算1週、忘記無條件進位、算一半
            const structured = [
                Math.max(1, correct - 1),               // 忘記進位（最常見錯誤）
                correct + 1,                            // 多算1週
                Math.max(2, Math.ceil(correct * 0.6)), // 估算不足
                correct + 2,                            // 寬鬆估算
            ];
            const opts = new Set([correct]);
            for (const c of structured) {
                if (opts.size >= 4) break;
                if (c > 0 && c !== correct) opts.add(c);
            }
            // 不足4個時隨機補足
            let attempts = 0;
            while (opts.size < 4 && attempts < 60) {
                attempts++;
                const delta = Math.floor(Math.random() * 4) + 1;
                const candidate = Math.random() < 0.5 ? correct + delta : Math.max(1, correct - delta);
                if (candidate > 0 && candidate !== correct) opts.add(candidate);
            }
            return Array.from(opts).sort(() => Math.random() - 0.5);
        },

        // ── 存錢目標開題彈窗（B2 _showTaskIntroModal pattern）─────
        _showSavingsGoalModal(question, afterClose = null) {
            document.getElementById('b3-goal-modal')?.remove();
            const modal = document.createElement('div');
            modal.id = 'b3-goal-modal';
            modal.className = 'b3-goal-modal';
            modal.innerHTML = `
                <div class="b3-goal-modal-inner">
                    <div class="b3-goal-modal-icon">${this._itemIconHTML(question.item, 'min(200px, 48vw)')}</div>
                    <div class="b3-goal-modal-name">${question.item.name}</div>
                    <div class="b3-goal-modal-price">${question.item.price} 元</div>
                    <div class="b3-goal-modal-tap">點任意處繼續</div>
                </div>`;
            document.body.appendChild(modal);
            let closed = false;
            const close = () => {
                if (closed) return;
                closed = true;
                window.speechSynthesis.cancel();
                modal.remove();
                afterClose?.();
            };
            Game.Speech.speak(`存錢目標：${question.item.name}，${question.item.price}元`);
            modal.addEventListener('click', close);
            Game.TimerManager.setTimeout(() => close(), 2500, 'ui');
        },

        // ── 11. 題目渲染 ──────────────────────────────────────
        renderQuestion() {
            Game.TimerManager.clearAll();
            window.speechSynthesis.cancel();
            Game.EventManager.removeByCategory('gameUI');
            AssistClick.deactivate();
            this.state.isProcessing  = false;
            this.state.quiz.currentInput = '';

            const q   = this.state.quiz;
            const app = document.getElementById('app');
            app.innerHTML = this._renderQuestionHTML(q.questions[q.currentQuestion]);
            this._bindQuestionEvents(q.questions[q.currentQuestion]);

            // 開題存錢目標彈窗（B2 _showTaskIntroModal pattern）
            const question = this.state.quiz.questions[this.state.quiz.currentQuestion];
            const diff = this.state.settings.difficulty;
            this._showSavingsGoalModal(question, () => {
                // 語音引導（彈窗關閉後才播）
                Game.TimerManager.setTimeout(() => {
                    const price = question.item.price;
                    const weekly = question.weekly;
                    const speechMap = {
                        easy:   `${question.item.name}要${toTWD(price)}，每週存${weekly}元，需要幾週？`,
                        normal: `${question.item.name}要${toTWD(price)}，每週存${weekly}元，輸入需要幾週。`,
                        hard:   `${question.item.name}要${toTWD(price)}，每週存${weekly}元，輸入正確週數。`,
                    };
                    this.state.quiz.lastSpeechText = speechMap[diff];
                    Game.Speech.speak(speechMap[diff]);
                }, 300, 'speech');

                // 輔助點擊：彈窗關閉後重啟，改為高亮題目操作元件
                if (this.state.settings.clickMode === 'on') {
                    Game.TimerManager.setTimeout(() => {
                        AssistClick.deactivate();
                        AssistClick.activate(question);
                    }, 300, 'ui');
                }
            });

            // 輔助點擊：彈窗顯示期間先高亮彈窗本身（點任意處繼續）
            if (this.state.settings.clickMode === 'on') {
                Game.TimerManager.setTimeout(() => AssistClick.activate(null), 400, 'ui');
            }
        },

        _renderQuestionHTML(question) {
            const diff = this.state.settings.difficulty;
            const q    = this.state.quiz;
            const pct  = Math.round((q.currentQuestion / q.totalQuestions) * 100);

            return `
            <div class="b-header">
                <div class="b-header-left">
                    <span class="b-header-unit">🐷 存錢計畫</span>
                </div>
                <div class="b-header-center">計算存錢天數</div>
                <div class="b-header-right">
                    <span class="b-progress">第 ${q.currentQuestion + 1} 題 / 共 ${q.totalQuestions} 題</span>
                    <button class="b-reward-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                    <button class="b-back-btn" onclick="Game.showSettings()">返回設定</button>
                </div>
            </div>
            <div class="game-container">
                <div class="progress-bar-wrap">
                    <div class="progress-bar-fill" style="width:${pct}%"></div>
                </div>
                <div class="progress-text">${q.currentQuestion + 1} / ${q.totalQuestions}</div>

                <div class="b3-goal-card">
                    <span class="b3-goal-icon" id="b3-goal-icon-click">${this._itemIconHTML(question.item, '72px')}</span>
                    <div class="b3-goal-name">${question.item.name}</div>
                    <div class="b3-goal-price-label">目標價格</div>
                    <div class="b3-goal-price">${question.item.price} 元</div>
                </div>

                <div class="b3-weekly-strip">
                    <span>每週存</span>
                    <span class="b3-weekly-amount${diff === 'hard' ? ' b3-weekly-hidden' : ''}" id="b3-weekly-val"
                          data-weekly="${question.weekly}">${diff === 'hard' ? '??? 元' : question.weekly + ' 元'}</span>
                    <span>，需要幾週才夠？</span>
                    <button class="b-inline-replay" id="replay-speech-btn" title="重播語音">🔊</button>
                    ${diff === 'hard' ? `<button class="b3-reveal-weekly-btn" id="b3-reveal-weekly-btn">👁️ 提示</button>` : ''}
                </div>

                <div class="b3-answer-card" id="b3-answer-area">
                    ${diff === 'easy'
                        ? this._renderChoicesHTML(question)
                        : this._renderNumpadHTML()}
                </div>

                <div class="b3-week-preview" id="b3-week-preview"></div>

                <div id="b3-anim-section"></div>
            </div>`;
        },

        _renderChoicesHTML(question) {
            // 每個選項下方顯示配速預覽（Round 34）；4選項時改 2×2 格局（Round 42）
            const btns = question.choices.map(c => {
                const totalSaved = question.weekly * c;
                const paceNote = `每週${question.weekly}元 × ${c}週 = ${totalSaved}元`;
                return `
                <button class="b3-choice-btn" data-val="${c}">
                    ${c}
                    <span class="b3-choice-suffix">週</span>
                    <span class="b3-choice-pace">${paceNote}</span>
                </button>`;
            }).join('');
            const gridClass = question.choices.length >= 4 ? 'b3-choices b3-choices-4' : 'b3-choices';
            return `
            <div class="b3-question-box">請選擇正確的週數</div>
            <div class="${gridClass}">${btns}</div>`;
        },

        _renderNumpadHTML() {
            const digits = [7, 8, 9, 4, 5, 6, 1, 2, 3];
            return `
            <div class="b3-numpad-section">
                <div class="b3-question-box" style="margin-bottom:10px;">輸入需要的週數</div>
                <div class="b3-input-display" id="b3-input-display">
                    <span id="b3-input-value">＿</span><span class="b3-unit-hint">週</span>
                </div>
                <div class="b3-numpad">
                    ${digits.map(n => `<button class="b3-numpad-btn" data-digit="${n}">${n}</button>`).join('')}
                    <button class="b3-numpad-btn btn-del" data-action="del">⌫</button>
                    <button class="b3-numpad-btn" data-digit="0">0</button>
                    <button class="b3-numpad-btn btn-ok" data-action="ok">確認</button>
                </div>
            </div>`;
        },

        // ── 存週預覽格（F5 量比較 pattern）──────────────────────
        _updateWeekPreview(n, question) {
            const preview = document.getElementById('b3-week-preview');
            if (!preview) return;
            const cap = Math.min(n, 16); // 最多顯示16格
            const isCorrect = n === question.answer;
            const blocks = [];
            for (let i = 0; i < cap; i++) {
                blocks.push(`<span class="b3-week-block${isCorrect ? ' correct' : ''}" style="animation-delay:${i * 60}ms"></span>`);
            }
            const extra = n > 16 ? `<span class="b3-week-extra">+${n - 16}</span>` : '';
            const label = `<span class="b3-week-label">${n} 週</span>`;
            // 即時剩餘金額標籤（Round 39）
            const savedSoFar = n * question.weekly;
            const remaining  = Math.max(0, question.item.price - savedSoFar);
            const remTag = remaining > 0
                ? `<span class="b3-week-rem">還差 ${remaining} 元</span>`
                : `<span class="b3-week-rem enough">🎉 足夠！</span>`;
            preview.innerHTML = `<div class="b3-week-blocks">${blocks.join('')}${extra}</div>${label}${remTag}`;
        },

        // ── 圖示放大彈窗 ──────────────────────────────────────────
        _showIconZoomModal(item) {
            document.getElementById('b3-icon-zoom-modal')?.remove();
            document.getElementById('b3-goal-modal')?.remove();
            const modal = document.createElement('div');
            modal.id = 'b3-icon-zoom-modal';
            modal.className = 'b3-icon-zoom-overlay';
            let content;
            if (item.imageData) {
                content = `<img src="${item.imageData}" alt="${item.name}" class="b3-zoom-img">`;
            } else if (item.img) {
                const fallback = item.icon || '🎁';
                content = `<img src="../images/${item.img}" alt="${item.name}" class="b3-zoom-img" onerror="this.replaceWith(document.createTextNode('${fallback}'))">`;
            } else {
                content = `<span class="b3-zoom-emoji">${item.icon || '🎁'}</span>`;
            }
            modal.innerHTML = `
                <div class="b3-icon-zoom-box">
                    ${content}
                    <div class="b3-zoom-label">${item.name}</div>
                    <div class="b3-zoom-tap">點任意處關閉</div>
                </div>`;
            document.body.appendChild(modal);
            modal.addEventListener('click', () => modal.remove());
            Game.Speech.speak(item.name);
        },

        // ── 12. 事件綁定 ──────────────────────────────────────
        _bindQuestionEvents(question) {
            const diff = this.state.settings.difficulty;

            // 存錢目標圖示點擊放大
            const goalIconEl = document.getElementById('b3-goal-icon-click');
            if (goalIconEl) {
                Game.EventManager.on(goalIconEl, 'click', () => this._showIconZoomModal(question.item), {}, 'gameUI');
            }
            if (diff === 'easy') {
                document.querySelectorAll('.b3-choice-btn').forEach(btn => {
                    Game.EventManager.on(btn, 'click', () => {
                        this._updateWeekPreview(parseInt(btn.dataset.val), question);
                        this._handleChoiceAnswer(parseInt(btn.dataset.val), question);
                    }, {}, 'gameUI');
                });
            } else {
                document.querySelectorAll('.b3-numpad-btn').forEach(btn => {
                    Game.EventManager.on(btn, 'click', () => {
                        if (this.state.isProcessing) return;
                        this.audio.play('keypad');
                        const action = btn.dataset.action;
                        const digit  = btn.dataset.digit;
                        if (digit !== undefined) {
                            if (this.state.quiz.currentInput.length < 4) {
                                this.state.quiz.currentInput += digit;
                            }
                        } else if (action === 'del') {
                            this.state.quiz.currentInput = this.state.quiz.currentInput.slice(0, -1);
                        } else if (action === 'ok') {
                            this._handleNumpadAnswer(question);
                            return;
                        }
                        this._updateInputDisplay();
                        const n = parseInt(this.state.quiz.currentInput);
                        if (!isNaN(n) && n > 0) this._updateWeekPreview(n, question);
                    }, {}, 'gameUI');
                });
            }
            // 語音重播
            const replayBtn = document.getElementById('replay-speech-btn');
            if (replayBtn) {
                Game.EventManager.on(replayBtn, 'click', () => {
                    const text = this.state.quiz.lastSpeechText;
                    if (text) Game.Speech.speak(text);
                }, {}, 'gameUI');
            }
            // 困難模式：每週存款揭示按鈕（Round 43）
            const revealWeeklyBtn = document.getElementById('b3-reveal-weekly-btn');
            if (revealWeeklyBtn) {
                Game.EventManager.on(revealWeeklyBtn, 'click', () => {
                    const el = document.getElementById('b3-weekly-val');
                    if (!el) return;
                    const weekly = el.dataset.weekly;
                    el.classList.remove('b3-weekly-hidden');
                    el.textContent = weekly + ' 元';
                    revealWeeklyBtn.textContent = '✅ 已揭示';
                    revealWeeklyBtn.disabled = true;
                    Game.Speech.speak(`每週存${weekly}元`);
                }, {}, 'gameUI');
            }
        },

        _updateInputDisplay() {
            const el = document.getElementById('b3-input-value');
            if (el) el.textContent = this.state.quiz.currentInput || '＿';
        },

        _showCenterFeedback(icon, text = '') {
            document.querySelector('.b-center-feedback')?.remove();
            const overlay = document.createElement('div');
            overlay.className = 'b-center-feedback';
            overlay.innerHTML = `<span class="b-cf-icon">${icon}</span>${text ? `<span class="b-cf-text">${text}</span>` : ''}`;
            document.body.appendChild(overlay);
            Game.TimerManager.setTimeout(() => overlay.remove(), 1200, 'ui');
        },

        // ── 13. 答題處理 ──────────────────────────────────────
        _handleChoiceAnswer(chosen, question) {
            if (this.state.isProcessing) return;
            this.state.isProcessing = true;

            const isCorrect = chosen === question.answer;

            document.querySelectorAll('.b3-choice-btn').forEach(btn => {
                btn.disabled = true;
                const v = parseInt(btn.dataset.val);
                if (v === question.answer) btn.classList.add('correct');
                else if (v === chosen && !isCorrect) btn.classList.add('wrong');
            });

            if (isCorrect) {
                this.state.quiz.correctCount++;
                this.state.quiz.streak = (this.state.quiz.streak || 0) + 1;
                this.state.quiz.achievedGoals.push({ item: question.item, weekly: question.weekly, answer: question.answer });
                this.audio.play('correct');
                this._showCenterFeedback('✅', '答對了！');

                Game.Speech.speak(`答對了！每週存${question.weekly}元，需要${question.answer}週，就能買${question.item.name}了！`);
                Game.TimerManager.setTimeout(() => {
                    this._showPiggyAnimation(question, () => this.nextQuestion());
                }, 500, 'turnTransition');
            } else {
                this.state.quiz.streak = 0;
                this.audio.play('error');
                if (this.state.settings.retryMode === 'retry') {
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this._showCenterFeedback('❌', '再試一次！');
                    Game.Speech.speak(`不對喔，再想想看`);
                    Game.TimerManager.setTimeout(() => {
                        this.state.isProcessing = false;
                        document.querySelectorAll('.b3-choice-btn').forEach(btn => {
                            btn.disabled = false;
                            btn.classList.remove('wrong');
                        });
                    }, 1600, 'turnTransition');
                } else {
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this._showCenterFeedback('❌', '答錯了！');
                    Game.Speech.speak(`正確答案是${question.answer}週`);
                    Game.TimerManager.setTimeout(() => this.nextQuestion(), 2000, 'turnTransition');
                }
            }
        },

        // ── 最佳存法提示（Round 31）─────────────────────────────
        _showBestSavingHint(question) {
            if (document.querySelector('.b3-best-hint')) return;
            // 計算其他週存金額對應的週數（展示對比）
            const target = question.item.price;
            const weekly = question.weekly;
            const correct = question.answer;
            const half = Math.ceil(target / (weekly / 2));
            const double = Math.ceil(target / (weekly * 2));
            const container = document.querySelector('.b3-numpad-section') || document.querySelector('.b3-quiz-area');
            if (!container) return;
            const hint = document.createElement('div');
            hint.className = 'b3-best-hint';
            hint.innerHTML = `<span class="b3-bh-label">💡 換個方式比較：</span>
                <div class="b3-bh-rows">
                    <span class="b3-bh-row slow">每週存 ${Math.round(weekly/2)} 元 → ${half} 週</span>
                    <span class="b3-bh-row correct">✓ 每週存 ${weekly} 元 → ${correct} 週</span>
                    <span class="b3-bh-row fast">每週存 ${weekly * 2} 元 → ${double} 週</span>
                </div>`;
            container.appendChild(hint);
        },

        // ── 除法提示（答錯後顯示計算公式）───────────────────────
        _showDivisionHint(question) {
            if (document.querySelector('.b3-div-hint')) return;
            const section = document.querySelector('.b3-numpad-section');
            if (!section) return;
            const hint = document.createElement('div');
            hint.className = 'b3-div-hint';

            // 算式行
            hint.innerHTML = `<span class="b3-hint-label">💡 計算方式：</span>`
                + `${question.item.price} 元 <span class="b3-hint-op">÷</span> `
                + `${question.weekly} 元/週 `
                + `<span class="b3-hint-op">≈</span> `
                + `<span class="b3-hint-ans">${question.answer}</span> 週（無條件進位）`;

            // 視覺週存模擬（F4 方塊動畫 + C2 逐一計數 pattern）
            const maxShow   = 8;
            const total     = question.answer;
            const show      = Math.min(total, maxShow);
            const overflow  = total > maxShow ? total - maxShow : 0;
            const blocksHTML = Array.from({ length: show }, (_, i) => {
                const acc = question.weekly * (i + 1);
                return `<div class="b3-wsim-block" style="animation-delay:${(i * 90)}ms">`
                    + `<div class="b3-wsim-week">第${i + 1}週</div>`
                    + `<div class="b3-wsim-acc">${acc}元</div>`
                    + `</div>`;
            }).join('');
            const overflowHTML = overflow > 0
                ? `<div class="b3-wsim-more">… 共 ${total} 週</div>` : '';

            const simDiv = document.createElement('div');
            simDiv.className = 'b3-wsim';
            simDiv.innerHTML = `<div class="b3-wsim-title">每週存 <strong>${question.weekly}</strong> 元，累積進度：</div>`
                + `<div class="b3-wsim-blocks">${blocksHTML}${overflowHTML}</div>`;
            hint.appendChild(simDiv);
            section.appendChild(hint);
        },

        _handleNumpadAnswer(question) {
            if (this.state.isProcessing) return;
            const input = parseInt(this.state.quiz.currentInput);
            if (!input || input <= 0) return;
            this.state.isProcessing = true;

            const isCorrect = input === question.answer;

            const displayEl = document.getElementById('b3-input-display');
            if (displayEl) displayEl.style.background = isCorrect ? '#064e3b' : '#7f1d1d';

            document.querySelectorAll('.b3-numpad-btn').forEach(btn => btn.disabled = true);

            if (isCorrect) {
                this.state.quiz.correctCount++;
                this.state.quiz.streak = (this.state.quiz.streak || 0) + 1;
                this.state.quiz.achievedGoals.push({ item: question.item, weekly: question.weekly, answer: question.answer });
                this.audio.play('correct');
                this._showCenterFeedback('✅', '答對了！');

                Game.Speech.speak(`答對了！每週存${question.weekly}元，需要${question.answer}週，就能買${question.item.name}了！`);
                Game.TimerManager.setTimeout(() => {
                    this._showPiggyAnimation(question, () => this.nextQuestion());
                }, 500, 'turnTransition');
            } else {
                this.state.quiz.streak = 0;
                this.audio.play('error');
                this._showDivisionHint(question); // 答錯即顯示除法公式
                this._showBestSavingHint(question); // 最佳存法提示（Round 31）
                if (this.state.settings.retryMode === 'retry') {
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this._showCenterFeedback('❌', '再試一次！');
                    Game.Speech.speak(`不對喔，參考提示再試一次`);
                    Game.TimerManager.setTimeout(() => {
                        this.state.isProcessing = false;
                        this.state.quiz.currentInput = '';
                        this._updateInputDisplay();
                        const displayEl = document.getElementById('b3-input-display');
                        if (displayEl) displayEl.style.background = '';
                        document.querySelectorAll('.b3-numpad-btn').forEach(btn => btn.disabled = false);
                    }, 1800, 'turnTransition');
                } else {
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this._showCenterFeedback('❌', '答錯了！');
                    Game.Speech.speak(`正確答案是${question.answer}週`);
                    Game.TimerManager.setTimeout(() => this.nextQuestion(), 2500, 'turnTransition');
                }
            }
        },

        // ── 14. 撲滿動畫 ──────────────────────────────────────
        _showPiggyAnimation(question, callback) {
            const animSection = document.getElementById('b3-anim-section');
            if (!animSection) { callback(); return; }

            const totalWeeks   = question.answer;
            const displaySlots = Math.min(totalWeeks, 8);
            const weeksPerSlot = totalWeeks <= 8 ? 1 : Math.ceil(totalWeeks / 8);
            const slotNote     = totalWeeks > 8 ? `（每格代表 ${weeksPerSlot} 週）` : '';

            const slotsHTML = Array.from({ length: displaySlots }, (_, i) =>
                `<div class="b3-slot" id="b3-slot-${i}">🪙</div>`
            ).join('');

            animSection.innerHTML = `
                <div class="b3-anim-card">
                    <div class="b3-piggy-wrap">
                        <div class="b3-piggy-emoji" id="b3-piggy">🐷</div>
                        <div class="b3-slots-track">${slotsHTML}</div>
                        <div class="b3-weeks-label">
                            共 <strong>${totalWeeks}</strong> 週存到
                            <strong>${this._itemIconHTML(question.item, '22px')} ${question.item.name}</strong>！${slotNote}
                        </div>
                    </div>
                </div>`;

            let slotIndex = 0;
            const fillNext = () => {
                if (slotIndex < displaySlots) {
                    const slot = document.getElementById(`b3-slot-${slotIndex}`);
                    if (slot) slot.classList.add('filled');
                    this.audio.play('coin');
                    slotIndex++;
                    Game.TimerManager.setTimeout(fillNext, 350, 'animation');
                } else {
                    const piggy = document.getElementById('b3-piggy');
                    if (piggy) piggy.classList.add('shake');
                    Game.TimerManager.setTimeout(callback, 900, 'animation');
                }
            };
            fillNext();
        },

        // ── 15. 下一題 ────────────────────────────────────────
        nextQuestion() {
            this.state.quiz.currentQuestion++;
            if (this.state.quiz.currentQuestion >= this.state.quiz.totalQuestions) {
                this.showResults();
            } else {
                this.renderQuestion();
            }
        },

        // ── 16. 完成畫面 ──────────────────────────────────────
        showResults() {
            if (this.state.isEndingGame) return;
            this.state.isEndingGame = true;

            AssistClick.deactivate();
            Game.TimerManager.clearByCategory('turnTransition');
            Game.EventManager.removeByCategory('gameUI');

            const q        = this.state.quiz;
            const elapsed  = q.startTime ? (Date.now() - q.startTime) : 0;
            const mins     = Math.floor(elapsed / 60000);
            const secs     = Math.floor((elapsed % 60000) / 1000);
            const accuracy = q.totalQuestions > 0
                ? Math.round((q.correctCount / q.totalQuestions) * 100) : 0;

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'b3', unitName: 'B3 存錢計畫', series: 'B',
                score: q.correctCount, total: q.totalQuestions, difficulty: this.state.settings?.difficulty,
                durationSec: Math.floor(elapsed / 1000) });

            let perfText, perfMedal;
            if (accuracy === 100)    { perfText = `🥇 完美！全部答對！`;                         perfMedal = '🥇'; }
            else if (accuracy >= 90) { perfText = `🥇 完成了 ${q.correctCount} 題，表現優異！`;   perfMedal = '🥇'; }
            else if (accuracy >= 70) { perfText = `🥈 完成了 ${q.correctCount} 題，表現良好！`;   perfMedal = '🥈'; }
            else if (accuracy >= 50) { perfText = `🥉 完成了 ${q.correctCount} 題，繼續努力！`;   perfMedal = '🥉'; }
            else                     { perfText = `⭐ 完成了 ${q.correctCount} 題，多多練習加油！`; perfMedal = '⭐'; }

            // 取最後一題物品做購買展示
            const lastQ      = q.questions[q.totalQuestions - 1] || {};
            const lastItem   = lastQ.item   || { name: '', price: '', icon: '🎁' };
            const lastWeekly = lastQ.weekly || '';
            const lastAnswer = lastQ.answer || '';

            const app = document.getElementById('app');
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            app.style.overflow = 'auto'; app.style.height = 'auto'; app.style.minHeight = '100vh';

            // ── 省錢清單 金錢圖示 helper ──────────────────────────────
            const b3MkMoneyIcons = (amt) => {
                if (!amt) return '';
                const denoms = [1000, 500, 100, 50, 10, 5, 1];
                let rem = amt; const parts = [];
                for (const d of denoms) {
                    if (rem <= 0) break;
                    const cnt = Math.floor(rem / d);
                    if (cnt > 0) { parts.push({ d, cnt }); rem -= cnt * d; }
                    if (parts.length >= 4) break;
                }
                return parts.map(p =>
                    `<span style="display:inline-flex;align-items:center;gap:2px;margin:2px 3px 2px 0;">
                        <img src="../images/money/${p.d}_yuan_${b3Rf()}.png" alt="${p.d}元"
                             style="width:36px;height:36px;object-fit:contain;" draggable="false" onerror="this.style.display='none'">
                        ${p.cnt > 1 ? `<span style="font-size:13px;font-weight:bold;color:#374151;">×${p.cnt}</span>` : ''}
                    </span>`
                ).join('');
            };

            // ── 存錢目標卡片（省錢清單主體）─────────────────────────────
            const catLabels = { toy:'🎮 玩具類', book:'📚 書本類', outdoor:'🌿 戶外類', tech:'💻 科技類' };
            const catColors  = { toy:'#7c3aed', book:'#1d4ed8', outdoor:'#15803d', tech:'#b45309' };
            const catBg      = { toy:'#f5f3ff', book:'#eff6ff', outdoor:'#f0fdf4', tech:'#fffbeb' };
            const catBorder  = { toy:'#c4b5fd', book:'#93c5fd', outdoor:'#86efac', tech:'#fde68a' };
            const catLabel   = (() => { const c = this.state.settings.itemCat; return (c && c !== 'all') ? ` · ${catLabels[c] || ''}` : ''; })();

            const goalsGridHTML = q.achievedGoals && q.achievedGoals.length > 0 ? `
            <div class="b3-goals-grid">
                ${q.achievedGoals.map(g => {
                    const cat   = g.item.cat || 'toy';
                    const color = catColors[cat] || '#7c3aed';
                    const bg    = catBg[cat]    || '#f5f3ff';
                    const bdr   = catBorder[cat] || '#c4b5fd';
                    return `
                    <div class="b3-goal-result-card" style="background:${bg};border-color:${bdr};">
                        <div class="b3-grc-top-badge" style="background:${color};">${catLabels[cat] || '🎁'}</div>
                        <div class="b3-grc-icon">${this._itemIconHTML(g.item, '72px')}</div>
                        <div class="b3-grc-name" style="color:${color};">${g.item.name}</div>
                        <div class="b3-grc-section">
                            <div class="b3-grc-label">目標金額</div>
                            <div class="b3-grc-price" style="color:${color};">${g.item.price} 元</div>
                            <div class="b3-grc-icons">${b3MkMoneyIcons(g.item.price)}</div>
                        </div>
                        <div class="b3-grc-divider"></div>
                        <div class="b3-grc-section">
                            <div class="b3-grc-label">每週存款</div>
                            <div class="b3-grc-weekly">${g.weekly} 元 / 週</div>
                            <div class="b3-grc-icons">${b3MkMoneyIcons(g.weekly)}</div>
                        </div>
                        <div class="b3-grc-weeks-badge">⏱ 共需 <strong>${g.answer}</strong> 週</div>
                    </div>`;
                }).join('')}
            </div>` : '';

            const totalPrice = q.achievedGoals ? q.achievedGoals.reduce((s, g) => s + g.item.price, 0) : 0;
            const avgWeeks   = q.achievedGoals?.length ? Math.round(q.achievedGoals.reduce((s, g) => s + g.answer, 0) / q.achievedGoals.length) : 0;
            const statsHTML  = q.achievedGoals && q.achievedGoals.length > 0 ? `
            <div class="b3-res-stats-row">
                <div class="b3-res-stat-card b3-rsc-purple">
                    <div class="b3-rsc-icon">🎯</div>
                    <div class="b3-rsc-val">${q.achievedGoals.length}</div>
                    <div class="b3-rsc-label">目標數量</div>
                </div>
                <div class="b3-res-stat-card b3-rsc-orange">
                    <div class="b3-rsc-icon">💰</div>
                    <div class="b3-rsc-val">${totalPrice}</div>
                    <div class="b3-rsc-label">合計金額（元）</div>
                    <div class="b3-rsc-icons">${b3MkMoneyIcons(totalPrice)}</div>
                </div>
                <div class="b3-res-stat-card b3-rsc-green">
                    <div class="b3-rsc-icon">📅</div>
                    <div class="b3-rsc-val">${avgWeeks}</div>
                    <div class="b3-rsc-label">平均所需週數</div>
                </div>
            </div>` : '';

            const diffLabel = { easy: '簡單模式', normal: '普通模式', hard: '困難模式' }[this.state.settings.difficulty] || '';

            // ── 第一頁：省錢清單 ──
            app.innerHTML = `
<div class="b-header">
    <div class="b-header-left"><span class="b-header-unit">🐷 存錢計畫</span></div>
    <div class="b-header-center">省錢清單${catLabel}</div>
    <div class="b-header-right">
        <button class="b-reward-btn" id="b3-res1-reward-btn">🎁 獎勵</button>
        <button class="b-back-btn" id="b3-res1-back-btn">返回設定</button>
    </div>
</div>
<div class="b-review-wrapper">
    <div class="b-review-screen">
        ${lastItem.name ? `
        <div class="b3-res-success-banner">
            <span class="b3-rsb-icon">${this._itemIconHTML(lastItem, '64px')}</span>
            <div class="b3-rsb-text">
                <div class="b3-rsb-title">🎉 ${lastItem.name} 買到了！</div>
                <div class="b3-rsb-price">${lastItem.price} 元 ${b3MkMoneyIcons(lastItem.price)}</div>
            </div>
        </div>` : ''}
        ${goalsGridHTML}
        ${statsHTML}
        <button id="b3-view-summary-btn" class="b-review-next-btn">
            📊 查看測驗總結
        </button>
    </div>
</div>`;

            Game.EventManager.on(document.getElementById('b3-res1-reward-btn'), 'click', () => {
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'gameUI');
            Game.EventManager.on(document.getElementById('b3-res1-back-btn'), 'click',
                () => this.showSettings(), {}, 'gameUI');

            Game.TimerManager.setTimeout(() => {
                document.getElementById('success-sound')?.play();
            }, 100, 'confetti');
            Game.TimerManager.setTimeout(() => {
                if (lastItem.name) Game.Speech.speak(`太棒了！${lastItem.name}買到了！`);
            }, 600, 'speech');

            Game.EventManager.on(document.getElementById('b3-view-summary-btn'), 'click', () => {
                window.speechSynthesis.cancel();
                Game.EventManager.removeByCategory('gameUI');
                // ── 第二頁：測驗總結 ──
                app.innerHTML = `
<div class="b-header">
    <div class="b-header-left"><span class="b-header-unit">🐷 存錢計畫</span></div>
    <div class="b-header-center">測驗總結</div>
    <div class="b-header-right">
        <button class="b-reward-btn" id="b3-res2-reward-btn">🎁 獎勵</button>
        <button class="b-back-btn" id="b3-res2-back-btn">返回設定</button>
    </div>
</div>
<div class="b-res-wrapper">
    <div class="b-res-screen">
        <div class="b-res-header">
            <div class="b-res-trophy">🏆</div>
            <div class="b-res-title-row">
                <img src="../images/common/hint_detective.png"
                     class="b-res-mascot" alt="金錢小助手" onerror="this.style.display='none'">
                <h1 class="b-res-title">🎉 存錢達人 🎉</h1>
                <span class="b-res-mascot-spacer"></span>
            </div>
        </div>
        <div class="b-res-container">
            <div class="b-res-grid" style="grid-template-columns:1fr 1fr;">
                <div class="b-res-card b-res-card-1">
                    <div class="b-res-icon">✅</div>
                    <div class="b-res-label">完成題數</div>
                    <div class="b-res-value">${q.correctCount} 題</div>
                </div>
                <div class="b-res-card b-res-card-2">
                    <div class="b-res-icon">⏱️</div>
                    <div class="b-res-label">完成時間</div>
                    <div class="b-res-value">${mins > 0 ? mins + '分' : ''}${secs}秒</div>
                </div>
            </div>
            <div class="b-res-perf-section">
                <h3>📊 表現評價</h3>
                <div class="b-res-perf-badge">${perfText}</div>
            </div>
            <div class="b-res-achievements">
                <h3>🏆 學習成果</h3>
                <div class="b-res-ach-list">
                    <div class="b-res-ach-item">✅ 計算達成目標所需時間</div>
                    <div class="b-res-ach-item">✅ 了解定期存錢的概念</div>
                    <div class="b-res-ach-item">✅ 練習加法累積計算</div>
                </div>
            </div>
            ${q.achievedGoals && q.achievedGoals.length > 0 ? `
            <div class="b3-res-goals">
                <h3>🐷 存錢目標清單${ (() => { const catLabels = { toy:'🎮 玩具類', book:'📚 書本類', outdoor:'🌿 戶外類', tech:'💻 科技類' }; const c = this.state.settings.itemCat; return (c && c !== 'all') ? ` · ${catLabels[c] || ''}` : ''; })() }</h3>
                <div class="b3-goal-list">
                    ${q.achievedGoals.map(g => `
                    <div class="b3-goal-row">
                        <span class="b3-goal-icon">${g.item.icon || '🎁'}</span>
                        <span class="b3-goal-name">${g.item.name}</span>
                        <span class="b3-goal-price">${g.item.price}元</span>
                        <span class="b3-goal-weeks">每週存${g.weekly}元 × ${g.answer}週</span>
                    </div>`).join('')}
                </div>
            </div>
            <div class="b3-goal-summary">
                <div class="b3-gs-item">
                    <span class="b3-gs-label">目標數量</span>
                    <span class="b3-gs-val">${q.achievedGoals.length} 個</span>
                </div>
                <div class="b3-gs-item">
                    <span class="b3-gs-label">合計目標金額</span>
                    <span class="b3-gs-val">${q.achievedGoals.reduce((s, g) => s + g.item.price, 0)} 元</span>
                </div>
                <div class="b3-gs-item">
                    <span class="b3-gs-label">平均需要週數</span>
                    <span class="b3-gs-val">${Math.round(q.achievedGoals.reduce((s, g) => s + g.answer, 0) / q.achievedGoals.length)} 週</span>
                </div>
                <div class="b3-gs-item highlight">
                    <span class="b3-gs-label">平均每週存款</span>
                    <span class="b3-gs-val">${Math.round(q.achievedGoals.reduce((s, g) => s + g.weekly, 0) / q.achievedGoals.length)} 元</span>
                </div>
            </div>` : ''}
            <div class="b-res-btns">
                <button id="play-again-btn" class="b-res-play-btn">
                    <span class="btn-icon">🔄</span><span class="btn-text">再玩一次</span>
                </button>
                <button id="back-settings-btn" class="b-res-back-btn">
                    <span class="btn-icon">⚙️</span><span class="btn-text">返回設定</span>
                </button>
            </div>
        </div>
    </div>
</div>`;
                Game.EventManager.on(document.getElementById('play-again-btn'), 'click',
                    () => this.startGame(), {}, 'gameUI');
                Game.EventManager.on(document.getElementById('back-settings-btn'), 'click',
                    () => this.showSettings(), {}, 'gameUI');
                Game.EventManager.on(document.getElementById('b3-res2-reward-btn'), 'click', () => {
                    if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                    else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                }, {}, 'gameUI');
                Game.EventManager.on(document.getElementById('b3-res2-back-btn'), 'click',
                    () => this.showSettings(), {}, 'gameUI');
                this._fireConfetti();
                Game.TimerManager.setTimeout(() => {
                    let msg;
                    if (accuracy === 100)    msg = '太厲害了，全部答對了！';
                    else if (accuracy >= 80) msg = `很棒喔，答對了${q.correctCount}題！`;
                    else if (accuracy >= 60) msg = '不錯喔，繼續加油！';
                    else                     msg = '要再加油喔，多練習幾次！';
                    Game.Speech.speak(msg);
                }, 300, 'speech');
            }, {}, 'gameUI');
        },

        _fireConfetti() {
            if (typeof confetti !== 'function') return;
            const duration = 3000, end = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1001 };
            const rand = (a, b) => Math.random() * (b - a) + a;
            const fire = () => {
                const t = end - Date.now();
                if (t <= 0) return;
                const n = 50 * (t / duration);
                confetti({ ...defaults, particleCount: n, origin: { x: rand(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount: n, origin: { x: rand(0.7, 0.9), y: Math.random() - 0.2 } });
                Game.TimerManager.setTimeout(fire, 250, 'confetti');
            };
            fire();
        },

        backToMenu() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeAll();
            window.location.href = '../index.html#part3';
        },
    };

    // 👆 輔助點擊模式（AssistClick）— 獨立區塊（困難 quiz 模式）
    // ============================================================
    const AssistClick = {
        _overlay: null, _handler: null, _touchHandler: null,
        _queue: [], _enabled: false,
        _lastHighlighted: null, _observer: null,

        activate(question) {
            if (this._overlay) return;
            this._overlay = document.createElement('div');
            this._overlay.id = 'b3-assist-overlay';
            const tbEl = document.querySelector('.b-header');
            const tbBottom = tbEl ? Math.round(tbEl.getBoundingClientRect().bottom) : 60;
            this._overlay.style.cssText = `position:fixed;top:${tbBottom}px;left:0;right:0;bottom:0;z-index:10100;pointer-events:all;touch-action:none;background:transparent;cursor:pointer;`;
            document.body.appendChild(this._overlay);
            this._handler      = (e) => { e.stopPropagation(); this._executeStep(); };
            this._touchHandler = (e) => { e.preventDefault(); e.stopPropagation(); this._executeStep(); };
            this._overlay.addEventListener('click',    this._handler);
            this._overlay.addEventListener('touchend', this._touchHandler, { passive: false });
            this._enabled = true;
            this._startObserver();
            this.buildQueue(question);
        },

        deactivate() {
            if (this._overlay) {
                this._overlay.removeEventListener('click',    this._handler);
                this._overlay.removeEventListener('touchend', this._touchHandler);
                this._overlay.remove();
                this._overlay = null;
            }
            if (this._observer) { this._observer.disconnect(); this._observer = null; }
            this._clearHighlight();
            this._queue = []; this._enabled = false;
            this._handler = null; this._touchHandler = null;
        },

        buildQueue(question) {
            if (!this._enabled) return;
            this._clearHighlight();
            this._queue = [];

            // 開題目標彈窗：優先偵測（點任意處繼續）
            // 高亮內層卡片而非外層 fixed overlay，避免 assist-click-hint 的 position:relative
            // 覆蓋 position:fixed 導致彈窗版面崩潰
            const goalModal = document.getElementById('b3-goal-modal');
            if (goalModal) {
                const inner = goalModal.querySelector('.b3-goal-modal-inner') || goalModal;
                this._queue = [{ el: inner, action: () => goalModal.click() }];
                this._highlight(this._queue[0].el);
                return;
            }

            // 月曆開場彈窗：優先偵測「開始存錢」按鈕
            const taskStartBtn = document.getElementById('b3-task-start');
            if (taskStartBtn) {
                this._queue = [{ el: taskStartBtn, action: () => taskStartBtn.click() }];
                this._highlight(this._queue[0].el);
                return;
            }

            // 達成存錢目標畫面：高亮「查看測驗總結」按鈕
            const viewSummaryBtn = document.getElementById('b3-view-summary-btn');
            if (viewSummaryBtn) {
                this._queue = [{ el: viewSummaryBtn, action: () => viewSummaryBtn.click() }];
                this._highlight(viewSummaryBtn);
                return;
            }

            const diff = Game.state.settings.difficulty;
            const c    = Game.state.calendar;

            // ── 月曆模式：簡單模式拖曳工作階段（逐一放置金錢）──────────
            // c.drag 存在且無 mode 屬性 = easy mode drag session
            if (diff === 'easy' && c.drag && !c.drag.mode) {
                const firstCoin = document.querySelector('.b3-drag-coin:not(.b3-coin-placed)');
                if (firstCoin) {
                    const denom   = parseInt(firstCoin.dataset.denom);
                    const slotIdx = parseInt(firstCoin.dataset.slotIdx);
                    // 動態查找 slot，避免 DOM 重建後參照失效
                    this._queue = [{ el: firstCoin, action: () => {
                        const slot = document.querySelector(`.b3-drop-slot[data-slot-idx="${slotIdx}"]:not(.b3-slot-filled)`);
                        if (slot) Game._handleCoinDrop(denom, slotIdx, slot);
                    }}];
                    this._highlight(firstCoin);
                }
                return;
            }

            // ── 月曆模式：普通／困難模式拖曳工作階段（點面額 → 確認）──
            if ((diff === 'normal' || diff === 'hard') && c.drag?.mode === 'normal') {
                const remaining = c.drag.targetAmount - c.drag.placedTotal;
                if (remaining > 0) {
                    // 貪婪找出下一個可點擊的最大面額
                    const ALL_DENOMS = [1000, 500, 100, 50, 10, 5, 1];
                    const d = ALL_DENOMS.find(d => d <= remaining && document.querySelector(`.b3-ndrag-denom[data-denom="${d}"]`));
                    if (d) {
                        const tile = document.querySelector(`.b3-ndrag-denom[data-denom="${d}"]`);
                        this._queue = [{ el: tile, action: () => tile.click() }];
                        this._highlight(tile);
                    }
                } else if (c.drag.placedTotal === c.drag.targetAmount) {
                    // 金額剛好達標，高亮確認按鈕
                    const confirmBtn = document.getElementById('b3-normal-confirm-btn');
                    if (confirmBtn && !confirmBtn.disabled) {
                        this._queue = [{ el: confirmBtn, action: () => {
                            const btn = document.getElementById('b3-normal-confirm-btn');
                            if (btn && !btn.disabled) btn.click();
                        }}];
                        this._highlight(confirmBtn);
                    }
                }
                return;
            }

            // ── 月曆模式：兌換按鈕（無拖曳工作階段時優先於日期點擊）──
            // c.drag === null（drag session 已結束或尚未開始），偵測可兌換面額
            const exchBtn = document.querySelector('.b3-pig-exch-btn');
            if (exchBtn) {
                this._queue = [{ el: exchBtn, action: () => exchBtn.click() }];
                this._highlight(exchBtn);
                return;
            }

            // ── 月曆模式：等待點擊日期格 ─────────────────────────────
            const activeDay = document.querySelector('.b3-cal-active');
            if (activeDay) {
                this._queue = [{ el: activeDay, action: () => activeDay.click() }];
                this._highlight(activeDay);
                return;
            }

            // ── 測驗模式（Quiz）────────────────────────────────────────
            const q = question || Game.state.quiz.questions?.[Game.state.quiz.currentQuestion];
            if (!q) return;

            if (diff === 'easy') {
                // Easy：選擇題模式 — 直接高亮正確答案的選項按鈕
                const correctBtn = document.querySelector(`.b3-choice-btn[data-val="${q.answer}"]`);
                if (correctBtn) {
                    this._queue = [{ el: correctBtn, action: () => correctBtn.click() }];
                }
            } else {
                // Normal/Hard：數字鍵盤模式
                const steps = [];
                const digits = String(q.answer).split('');
                for (const d of digits) {
                    const btn = document.querySelector(`.b3-numpad-btn[data-digit="${d}"]`);
                    if (btn) steps.push({ el: btn, action: () => btn.click() });
                }
                const okBtn = document.querySelector('.b3-numpad-btn[data-action="ok"]');
                if (okBtn) steps.push({ el: okBtn, action: () => okBtn.click() });
                this._queue = steps;
            }

            if (this._queue.length > 0) this._highlight(this._queue[0].el);
        },

        _executeStep() {
            if (!this._enabled || this._queue.length === 0) return;
            const step = this._queue.shift();
            this._clearHighlight();
            if (step?.action) step.action();
            Game.TimerManager.setTimeout(() => {
                if (this._enabled && this._queue.length > 0) this._highlight(this._queue[0].el);
            }, 120, 'ui');
        },

        _startObserver() {
            const app = document.getElementById('app');
            if (!app) return;
            let t = null;
            this._observer = new MutationObserver(() => {
                if (!this._enabled || this._queue.length > 0) return;
                if (t) window.clearTimeout(t);
                t = window.setTimeout(() => { if (this._enabled) this.buildQueue(); }, 400);
            });
            this._observer.observe(app, { childList: true, subtree: true });
        },

        _highlight(el) {
            this._clearHighlight();
            if (!el) return;
            el.classList.add('assist-click-hint');
            this._lastHighlighted = el;
        },

        _clearHighlight() {
            if (this._lastHighlighted) {
                this._lastHighlighted.classList.remove('assist-click-hint');
                this._lastHighlighted = null;
            }
            document.querySelectorAll('.assist-click-hint').forEach(e => e.classList.remove('assist-click-hint'));
        }
    };

    Game.init();
});
