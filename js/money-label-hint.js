/**
 * money-label-hint.js — 付款／找零畫面：金錢圖示下面的金額數字平常不顯示，按「提示」才出現（2026-10-06 使用者定）
 *
 * 規則：24 單元裡付款與找零的頁面，錢幣／紙鈔圖下面的「10元」「NT$ 10」「10 元」預設隱藏；
 *       學生按下任何「提示」鈕後顯示，維持到這一題結束（標題列的「第 N 題／關」換了就再隱藏）。
 * 掛在有付款或找零畫面的單元 HTML（A1 A2 A3 A4 A6 B5 B6 C5 C6），一支通用、不改各單元的模板：
 *   ① 找出畫面上的錢圖（檔名 N_yuan_*.png），往上最多兩層找「數字＝該面額」的短字（只認這種，價格、總額不會誤藏）
 *   ② 標上 class `mt-money-label`，`html:not(.mt-ml-show)` 時 display:none
 *   ③ 結算／回顧／交易完成這類畫面不動（那裡是成果展示，不是作答）
 * ⚠️ 新增付款／找零畫面不必另外寫——只要錢圖檔名是 N_yuan、金額字放在錢圖旁邊就會被收進來。
 * ⚠️ 金額字被藏起來後卡片會變矮；按提示後變回原高度（版面跳一下是預期的）。
 */
(function () {
    'use strict';
    if (window.__mtMoneyLabelHint) return;
    window.__mtMoneyLabelHint = true;

    var root = document.documentElement;
    var SHOW = 'mt-ml-show';
    var MARK = 'mt-money-label';
    var LABEL_RE = /^\s*(?:NT\$\s*)?(\d{1,4})\s*元?\s*$/;
    var MONEY_RE = /(?:^|\/)(\d{1,4})_yuan/;
    // 成果展示畫面：不藏
    var SKIP = '.results-screen, .results-container, .results-wrapper, .b-review-wrapper, .b-review-screen, ' +
        '.transaction-summary-screen, .summary-content, .pickup-complete-wrapper, .c3-results-overlay, ' +
        '[class*="completion"], [class*="complete-screen"]';
    var PROGRESS = '.title-bar, .b-header, .mcdonalds-title-bar, .atm-title-bar, .progress-info, #progress-info, ' +
        '.b-progress, .quiz-progress-info';

    var st = document.createElement('style');
    st.id = 'mt-money-label-style';
    st.textContent = 'html:not(.' + SHOW + ') .' + MARK + '{display:none!important}';
    (document.head || root).appendChild(st);

    function valueOf(img) {
        var m = MONEY_RE.exec(img.getAttribute('src') || '');
        return m ? +m[1] : 0;
    }
    function markAround(img) {
        var v = valueOf(img);
        if (!v || img.closest(SKIP)) return;
        var box = img.parentElement;
        for (var lv = 0; box && lv < 2; lv++, box = box.parentElement) {
            // 這一層裡只能有這一張錢圖，否則已經爬到整個錢包了
            if (box.querySelectorAll('img[src*="_yuan"]').length > 1) return;
            var found = false;
            var els = box.querySelectorAll('div, span, p, small, b, strong');
            for (var i = 0; i < els.length; i++) {
                var e = els[i];
                if (e.contains(img) || e.querySelector('img, div, span, p')) continue;
                var m = LABEL_RE.exec(e.textContent || '');
                if (m && +m[1] === v) { e.classList.add(MARK); found = true; }
            }
            if (found) return;
        }
    }
    var queued = false;
    function scan() {
        queued = false;
        var imgs = document.querySelectorAll('img[src*="_yuan"]');
        for (var i = 0; i < imgs.length; i++) markAround(imgs[i]);
    }
    function queue() {
        if (queued) return;
        queued = true;
        (window.requestAnimationFrame || setTimeout)(scan);
    }

    // 第幾題：標題列的「第 N 題」「第 N / M 題」「第 N 關」
    function questionKey() {
        var els = document.querySelectorAll(PROGRESS);
        for (var i = 0; i < els.length; i++) {
            var m = /第\s*(\d+)\s*(?:題|關|\/)/.exec(els[i].textContent || '');
            if (m) return m[0];
        }
        return '';
    }
    var shownAt = null;
    document.addEventListener('click', function (e) {
        var b = e.target && e.target.closest && e.target.closest('button, [role="button"], [onclick]');
        if (!b) return;
        var t = (b.textContent || '').replace(/\s+/g, '');
        if (t.length > 12 || t.indexOf('提示') < 0) return;
        root.classList.add(SHOW);
        shownAt = questionKey();
    }, true);
    setInterval(function () {
        if (!root.classList.contains(SHOW)) return;
        var k = questionKey();
        if (k !== shownAt) { root.classList.remove(SHOW); shownAt = null; }
    }, 600);

    function boot() {
        scan();
        new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
    }
    if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
