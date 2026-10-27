/**
 * tablet-layout.js — iPad 橫式版面開關（2026-10-02 使用者定：做一個適合 iPad 橫放的版面，桌面版完全不動）
 *
 * 判斷「主要操作是手指＋橫放＋夠大的螢幕」→ 在 <html> 加 class `tablet-land`，
 * 版面規則全寫在 css/tablet-landscape.css，每條都以 html.tablet-land 開頭，所以桌面滑鼠永遠套不到。
 *
 * 為什麼不用寬度判斷：iPad 橫放（1024～1366 寬）跟縮小視窗的桌面版同尺寸，用寬度一定撞在一起。
 * 為什麼不看瀏覽器名稱：iPadOS 的 Safari 預設回報桌機版 UA（假裝是 Mac）。
 * 為什麼還要 min-height：手機橫放也是手指＋橫放，但高度只有 400 上下，那是另一種版面。
 *
 * 手動切換（給偵測不準時、或在桌機預覽用）：網址加 ?layout=tablet／desktop／auto，記在 localStorage['mt_layout']。
 *   window.MTLayout.set('tablet'|'desktop'|null)；MTLayout.isTablet()
 * ⚠️ 要放在 <head>、所有 CSS 之前同步載入，否則第一幀會先畫出桌面版再跳過去。
 *
 * 2026-10-05 起另加 `desk-wide`：不是平板、視窗寬 ≥ 1200 且高 ≥ 600 的桌面 → 結算頁也用平板那套兩欄排法
 * （只有 tablet-landscape.css 的結算頁兩節認這個 class，遊戲畫面不受影響），並依空白多寡縮放：
 * 量總結卡片（.results-screen／.b-res-screen）實際的寬高，算出剛好放進視窗的倍率，介於 0.8～1.35——
 * 不能用固定倍率：各單元內容量不同（A5 學習成果 4 條，固定倍率在 1280×720 會把按鈕擠出畫面）。
 * 總結頁是各單元進結果時才插進來的、學生自評區塊又晚幾秒才出現 → 監看 DOM 變化與視窗大小隨時重算。
 */
(function () {
    var KEY = 'mt_layout';
    var root = document.documentElement;
    var mq = window.matchMedia
        ? window.matchMedia('(pointer: coarse) and (orientation: landscape) and (min-width: 1000px) and (min-height: 600px)')
        : null;

    function stored() {
        try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function save(v) {
        try { if (v === 'tablet' || v === 'desktop') localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) {}
    }

    try {
        var q = new URLSearchParams(location.search).get('layout');
        if (q === 'tablet' || q === 'desktop') save(q);
        else if (q === 'auto') save(null);
    } catch (e) {}

    function isTablet() {
        var p = stored();
        if (p === 'tablet') return true;
        if (p === 'desktop') return false;
        return !!(mq && mq.matches);
    }
    var wideMq = window.matchMedia ? window.matchMedia('(min-width: 1200px) and (min-height: 600px)') : null;
    function apply() {
        var tab = isTablet();
        root.classList.toggle('tablet-land', tab);
        root.classList.toggle('desk-wide', !tab && !!(wideMq && wideMq.matches));
        fitSummary();
        fitQuiz();
    }

    // 結算頁依內容量縮放（只在 desk-wide）
    var fitQueued = false;
    // 24 單元（A／C／F＝.results-screen、B＝.b-res-screen）＋生活情境對話完成頁（.dlg-result-card）；
    // 一日金錢冒險另有自己的整頁自動縮放（adventure.js 檔尾），不在這裡
    var SUMMARY_SEL = '.results-screen, .b-res-screen, #screen-complete.active .dlg-result-card, .b1-unit .b-review-screen, .b2-unit .b-review-screen, .b6-unit .b6-wc2-box';   // 後三項：B1／B2 結算回顧頁、B6 開場任務卡（2026-10-05 測驗頁桌面版）
    function fitSummary() {
        var el = document.querySelector(SUMMARY_SEL);
        if (!el) return;
        if (!root.classList.contains('desk-wide')) { el.style.removeProperty('zoom'); return; }
        el.style.zoom = '1';                                   // 先量原尺寸
        // ⚠️ 用 offsetWidth／offsetHeight／offsetTop（版面尺寸），不用 getBoundingClientRect：
        //    對話完成頁有進場動畫（transform 縮放＋位移），動畫中量到的會偏小，倍率就算太大、多出幾 px 可捲
        var r = { width: el.offsetWidth, height: el.offsetHeight };
        if (!r.height || !r.width) return;
        observeSize(el);
        var wrap = el.parentElement;
        var top = 0;                                           // 外框距頁面頂端（上方若有標題列＝B 系列，要扣掉）
        for (var p = wrap || el; p; p = p.offsetParent) top += p.offsetTop;
        // 外框上下留白與卡片自己的上下外距照實際樣式扣（各模組不同；對話完成頁用固定 24px 估會多出幾 px 可捲）
        var ws = wrap ? getComputedStyle(wrap) : null, es = getComputedStyle(el);
        var padV = ws ? (parseFloat(ws.paddingTop) || 0) + (parseFloat(ws.paddingBottom) || 0) : 0;
        var marV = (parseFloat(es.marginTop) || 0) + (parseFloat(es.marginBottom) || 0);   // 外距會跟著 zoom 縮放
        var availH = window.innerHeight - Math.max(0, top) - padV - 8;
        var availW = window.innerWidth - 48;
        var z = Math.min(1.35, availH / (r.height + marV), availW / r.width);
        z = Math.max(0.8, Math.round(z * 100) / 100);
        el.style.zoom = String(z);   // 與上次相同時尺寸不變，ResizeObserver 不會再觸發
    }
    // 卡片內容晚到或撐高（每一步的清單、自評區塊、版面重排）不一定會新增節點 → 用 ResizeObserver 盯卡片本身。
    // 我們自己改 zoom 也會讓尺寸變，但重算時量的是 zoom＝1 的原尺寸，倍率不變就不會一直來回觸發。
    var ro = null, roTarget = null;
    function observeSize(el) {
        if (roTarget === el || !window.ResizeObserver) return;
        if (!ro) ro = new ResizeObserver(function () { queueFit(); });
        if (roTarget) ro.unobserve(roTarget);
        ro.observe(el);
        roTarget = el;
    }
    // ── 測驗頁整區放大（desk-wide，2026-10-05 起逐單元加入）──
    // 只放「題目區整塊等比放大不會出事」的單元：拖曳的影子／小提示都掛在 body、用畫面座標（position:fixed），
    // 不在題目區裡面，所以題目區 zoom 不會錯位（B1／B2 已逐行確認）。
    // 量題目區裡「實際內容」的寬高（外框是 flex:1 撐滿畫面，不能量外框），放大到剛好放得下，上限 1.6；
    // 內容本來就比畫面高時維持原尺寸（不縮小，照舊捲動）。換步驟會整塊重繪 → MutationObserver 觸發重算。
    // 各單元：sel＝外框；min／max＝倍率上下限（min＜1＝內容比畫面高時可以縮小）；
    //   fixW＝外框寬是 100%／100vw，zoom 後會偏一邊 → 改貼合內容寬、左右置中；
    //   kids＝不縮外框本身、只縮它的子區塊（skip 的除外）——C 系列標題列跟題目區在同一個外框裡，標題列不該跟著縮
    // 2026-10-05 A1／B5（原本就要捲動）只縮不放（max 1）：拖曳影子都掛在 body、以 elementFromPoint 判斷落點，zoom 安全。
    // ⚠️ C3／C6 試過整頁縮放，使用者否決（2026-10-05「不能單純用倍率」：圖示跟著變小、版面不合理）→ 改逐單元調版面
    var QUIZ_FIT = [
        { sel: '.b1-unit .b-game-wrap', min: 1, max: 1.6 },
        { sel: '.b2-unit .b-game-wrap', min: 1, max: 1.6 },
        { sel: '.a2-unit .kiosk-body', min: 0.7, max: 1.5, fixW: true },   // 售票機三欄（入口｜螢幕｜出口）整台等比縮放；外框寬 100vw，zoom 後 vw 也被放大 → fixW
        { sel: '.a1-unit .main-content-wrapper', min: 0.7, max: 1 },   // 販賣機整台（取物口原本在畫面外）；不可 fixW：機台寬度跟著外框撐開，貼合內容會塌成一條
        { sel: '.a5-unit .atm-main-frame', min: 0.55, max: 1 },   // ATM 整台（擬真機台，同 A1／A2 當成一台設備等比縮放；原本 1280×720 #app 內要捲 350px）
    ];
    var QUIZ_SEL = QUIZ_FIT.map(function (q) { return q.sel; }).join(', ');
    var ZPROPS = ['zoom', 'width', 'margin-left', 'margin-right'];
    function fitQuiz() {
        if (!QUIZ_FIT) return;   // apply() 第一次在檔案前段就被呼叫，這時清單還沒定義
        var cfg = null, el = null;
        for (var q = 0; q < QUIZ_FIT.length && !el; q++) { el = document.querySelector(QUIZ_FIT[q].sel); cfg = QUIZ_FIT[q]; }
        if (!el) return;
        // 要縮放的對象：外框本身，或（kids）它的子區塊
        var targets = cfg.kids
            ? Array.prototype.filter.call(el.children, function (k) { return !(cfg.skip && k.matches(cfg.skip)); })
            : [el];
        var clear = function (t) { ZPROPS.forEach(function (k) { t.style.removeProperty(k); }); };
        if (!root.classList.contains('desk-wide')) { targets.forEach(clear); return; }
        targets.forEach(function (t) { clear(t); t.style.zoom = '1'; });
        // 量內容合起來的範圍：整塊模式量外框的子元素，kids 模式量各子區塊本身
        var parts = cfg.kids ? targets : Array.prototype.slice.call(el.children);
        var top = Infinity, bottom = 0, left = Infinity, right = 0, absTop = Infinity;
        parts.forEach(function (k) {
            if (!k.offsetParent) return;                         // 隱藏的、position:fixed 的提示不算
            top = Math.min(top, k.offsetTop);
            bottom = Math.max(bottom, k.offsetTop + Math.max(k.offsetHeight, k.scrollHeight));   // 面板內要捲的（A2 螢幕）照內容算
            left = Math.min(left, k.offsetLeft);
            right = Math.max(right, k.offsetLeft + k.offsetWidth);
            var y = 0;
            for (var p = k; p; p = p.offsetParent) y += p.offsetTop;
            absTop = Math.min(absTop, y);
        });
        if (!isFinite(top) || bottom <= top || right <= left) return;
        var cs = getComputedStyle(el);
        var h = bottom - top + (parseFloat(cs.paddingBottom) || 0) + (cfg.kids ? 0 : (parseFloat(cs.paddingTop) || 0));
        var w = right - left + (cfg.kids ? 0 : (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0));
        if (!cfg.kids) { absTop = 0; for (var p2 = el; p2; p2 = p2.offsetParent) absTop += p2.offsetTop; }
        var z = Math.min(cfg.max, (window.innerHeight - absTop - 8) / h, (window.innerWidth - 24) / w);
        z = Math.max(cfg.min, Math.round(z * 100) / 100);
        var setZ = function (v) {
            targets.forEach(function (t) {
                t.style.zoom = String(v);
                if (cfg.fixW) { t.style.width = 'fit-content'; t.style.marginLeft = 'auto'; t.style.marginRight = 'auto'; }
            });
        };
        setZ(z);
        // 內容若用 vw／vh 定寬高（B2 日記卡、A2 外框），zoom 後這些單位也會被放大，事前算不準 →
        // 設完看有沒有因此出現橫向／直向捲動，有就一點一點縮回（最小到該單元的下限）。
        // 捲動容器不一定是整頁（A2 是 #app、C3 是外框自己捲）→ 往上找第一個會捲的一起檢查（kids 模式從外框本身找起）
        var sc = cfg.kids ? el : el.parentElement;
        while (sc && sc !== document.body && !/auto|scroll/.test(getComputedStyle(sc).overflowY + getComputedStyle(sc).overflowX)) sc = sc.parentElement;
        var over = function () {
            return root.scrollWidth > window.innerWidth + 1 || root.scrollHeight > window.innerHeight + 1 ||
                (sc && sc !== document.body && (sc.scrollHeight > sc.clientHeight + 1 || sc.scrollWidth > sc.clientWidth + 1));
        };
        for (var n = 0; n < 25 && z > cfg.min && over(); n++) {
            z = Math.max(cfg.min, Math.round((z - 0.04) * 100) / 100);
            setZ(z);
        }
    }
    function queueFit() {
        if (fitQueued) return;
        fitQueued = true;
        (window.requestAnimationFrame || setTimeout)(function () { fitQueued = false; fitSummary(); fitQuiz(); });
    }

    apply();
    // 拉動視窗：重算 desk-wide 與結算頁倍率
    window.addEventListener('resize', apply);
    // 結算頁插進來、學生自評等區塊晚到 → 重算（只在 desk-wide 且畫面上有總結卡片時才真的量）
    function watch() {
        try {
            new MutationObserver(function () {
                if (root.classList.contains('desk-wide') && document.querySelector(SUMMARY_SEL + ', ' + QUIZ_SEL)) queueFit();
            }).observe(document.body, { childList: true, subtree: true });
        } catch (e) {}
    }
    if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
    // 卡片裡的角色圖比量測晚載入 → 載入完卡片長高，要再算一次（不然會多出幾 px 可捲）
    document.addEventListener('load', function (e) {
        if (e.target && e.target.tagName === 'IMG' && root.classList.contains('desk-wide') && document.querySelector(SUMMARY_SEL + ', ' + QUIZ_SEL)) queueFit();   // 測驗頁（B5 步驟二商品圖）同理
    }, true);
    // 轉向（橫↔直）時重新判斷
    if (mq) {
        if (mq.addEventListener) mq.addEventListener('change', apply);
        else if (mq.addListener) mq.addListener(apply);
    }

    window.MTLayout = {
        get: stored,
        set: function (v) { save(v); apply(); },
        isTablet: isTablet
    };
})();
