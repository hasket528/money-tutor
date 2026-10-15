/**
 * A3 美式速食自助點餐 × 掃描付款 — 外掛層（試做用）
 *
 * ⚠️ 這一層刻意不改 js/a3_mcdonalds_order.js 一個字。
 *    做法是從外部讀 DOM、呼叫既有的公開入口 McDonald.fillPaymentTarget() /
 *    addMoneyToPaymentArea()，不覆寫 McDonald 的任何方法。
 *    不載入這支檔案，A3 行為 100% 回到原樣。
 *
 * A3 的付款拖放事件是用 addEventListener 掛的（不是 A1/A2/A4 那種 onclick/ondrop
 * 屬性），本來沒有現成的公開函數可以直接呼叫——但 A3 自己的輔助點擊模式
 * 已經先解決了同一個問題：`autoPayMoney(value)` 會呼叫
 * `fillPaymentTarget(target, data, null)` / `addMoneyToPaymentArea(data, null)`，
 * 第三個參數傳 null 就代表「不是使用者直接拖曳」，函式內部本來就支援這樣呼叫
 * （見該函式開頭的 clickMode 判斷註解）。我們沒有直接呼叫 autoPayMoney 本身——
 * 它還會動 clickModeState.currentStep 這類屬於「輔助點擊佇列」的狀態，
 * 在沒有那條佇列的情況下呼叫可能會出錯或有副作用，所以只抄它「找錢、填付款」
 * 那一段核心邏輯，不牽動點擊佇列。
 *
 * ⚠️ fillPaymentTarget() 本身不驗證面額對不對——呼叫端要先自己核對
 * `data-expected-value` 是否等於掃到的面額，選錯目標會被無條件填進去。
 *
 * 相依：vendor/aruco/{cv.js,aruco.js,dictionaries/apriltag_16h5.js} → mt-markers.js
 *       → scan-pay.js → 本檔（順序不能反）
 */
(function () {
  'use strict';

  var BTN_ID = 'a3-scan-pay-btn';
  var STYLE_ID = 'a3-scan-pay-style';
  // 2026-09-27 使用者定：放在「💰付款區」標題列、靠左（靠右會被掃描視窗擋住）——插進左側佔位欄
  // （右側佔位欄是提示鈕，普通／困難才有）。兩個佔位欄改成等分剩餘寬度，標題維持置中。
  var CSS = [
    '.a3-scan-head>.a3-pay-headspacer{flex:1 1 0!important;width:auto!important;min-width:0}',
    '.a3-scan-head>.a3-pay-headspacer:first-child{display:flex;align-items:center}',
    '.a3-scan-head>h2{flex:0 1 auto!important}',
    '#' + BTN_ID + '{display:inline-flex;align-items:center;gap:6px;',
    'padding:8px 14px;min-height:36px;border:none;border-radius:10px;cursor:pointer;touch-action:manipulation;',
    'background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;font-size:13px;font-weight:700;',
    'box-shadow:0 2px 8px rgba(37,99,235,.35);white-space:nowrap}',
    // ⚠️ 按下回饋只改亮度／陰影，**不可用 transform 位移**——按鈕在 mousedown 瞬間
    //    從指標下滑走，mouseup 就落在別的元素上，click 不會觸發（手機的 touch slop
    //    更敏感，一移就取消 tap）。見 CLAUDE.md「可點元素按下會位移」那條定則。
    // ⚠️ `transform:none!important` 是要壓過 ai-theme.css 的全域
    //    `button:active{transform:scale(.95)!important}`——按下時縮放會讓按鈕從指標下
    //    滑走，click 落空（同 CLAUDE.md 彈窗遮罩那條的解法）。
    '#' + BTN_ID + ':active{transform:none!important;',
    'filter:brightness(.88);box-shadow:0 1px 4px rgba(37,99,235,.45)}'
  ].join('');

  function MD() { return window.McDonald; }

  function log() {
    var m = MD();
    if (m && m.Debug && m.Debug.log) {
      m.Debug.log.apply(m.Debug, ['coin'].concat([].slice.call(arguments)));
    }
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /** 錢包剩餘：availableWalletMoney 是 [{value, image, ...}] 陣列，攤平計數 */
  function getRemain() {
    var m = MD();
    var list = (m && m.state && m.state.gameState && m.state.gameState.availableWalletMoney) || [];
    var counts = {};
    list.forEach(function (x) { counts[x.value] = (counts[x.value] || 0) + 1; });
    return Object.keys(counts).map(function (v) {
      return { value: parseInt(v, 10), count: counts[v] };
    }).sort(function (a, b) { return b.value - a.value; });
  }

  /**
   * 解到一張卡 → 到「付款區」找同面額的錢包資料 + 對應的付款目標，
   * 呼叫 fillPaymentTarget（有具體目標時）或 addMoneyToPaymentArea（自由付款時）。
   */
  function onMoney(info) {
    var m = MD();
    var value = info.value;

    if (!m || !m.state || !m.state.gameState) {
      window.ScanPay.flash('遊戲還沒載入完成');
      return;
    }

    var paymentArea = document.getElementById('payment-area');
    if (!paymentArea) {
      window.ScanPay.flash('現在不是付款畫面');
      return;
    }

    var availableMoney = m.state.gameState.availableWalletMoney || [];
    var idx = availableMoney.findIndex(function (x) { return x.value === value; });
    if (idx === -1) {
      window.ScanPay.flash('錢包裡沒有 ' + value + ' 元了');
      if (m.audio && typeof m.audio.playSound === 'function') m.audio.playSound('error');
      log('錢包沒有面額：', value);
      return;
    }
    var money = availableMoney[idx];

    var walletItem = document.querySelector('#wallet-area .money-item[data-value="' + value + '"]');
    var targets = paymentArea.querySelectorAll('.payment-target');

    if (targets.length > 0) {
      // 指定餐點模式：有具體的付款目標，一定要對到「面額吻合且還沒填」的那一格
      var target = paymentArea.querySelector('.payment-target:not(.filled)[data-expected-value="' + value + '"]');
      if (!target) {
        window.ScanPay.flash('這個面額現在不用付');
        if (m.audio && typeof m.audio.playSound === 'function') m.audio.playSound('error');
        log('找不到吻合的付款目標：', value);
        return;
      }
      if (walletItem) walletItem.remove();
      log('掃描付款（有目標）→', value);
      m.fillPaymentTarget(target, { value: money.value, image: money.image }, null);
    } else {
      // 自選購買／自由付款模式：沒有具體目標，直接加進付款區
      if (walletItem) walletItem.remove();
      log('掃描付款（自由付款）→', value);
      m.addMoneyToPaymentArea({ value: money.value, image: money.image }, null);
    }
  }

  // ── 按鈕注入 ────────────────────────────────────────────────────────
  function ensureButton() {
    if (document.getElementById(BTN_ID)) return;

    var paymentArea = document.getElementById('payment-area');
    if (!paymentArea) return;

    // 掛進「💰付款區」標題列左側的佔位欄
    var card = paymentArea.closest('.a3-pay-card');
    var spacers = card ? card.querySelectorAll('.a3-pay-headspacer') : [];
    var spacer = spacers[0];
    if (!spacer || spacers.length < 2) return;

    if (!window.ScanPay || !window.ScanPay.isSupported()) return;

    injectStyle();
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.innerHTML = '📷 掃描';
    btn.addEventListener('click', openScanner);
    spacer.insertBefore(btn, spacer.firstChild);
    spacer.parentElement.classList.add('a3-scan-head');
    log('已插入掃描付款按鈕');
  }

  function openScanner() {
    window.ScanPay.open({
      title: '掃描付款',
      onMoney: onMoney,
      getRemain: getRemain,
      onClose: function () { log('掃描結束'); }
    });
  }

  function boot() {
    // 讓通用層讀得到本單元的設定，用來判斷「輔助點擊模式」是否開著（兩者互斥）
    if (window.ScanPay && window.ScanPay.setUnitSettings) {
      window.ScanPay.setUnitSettings(function () {
        var g = MD();
        return g && g.state && g.state.settings;
      });
    }
    // 找零拖曳畫面（普通＋困難）的「📷 掃描找零」——共用 ScanPay.attachChangeDrag（A3／A4／A6 同一份）
    if (window.ScanPay && window.ScanPay.attachChangeDrag) {
      window.ScanPay.attachChangeDrag({
        prefix: 'a3c', btnId: 'a3-scan-change-btn',
        state: function () { var x = MD(); return x && x.state && x.state.gameState; },
        error: function () { var m = MD(); if (m && m.audio && m.audio.playSound) m.audio.playSound('error'); },
        log: log
      });
    }
    // 簡單模式找零（店家擺好每一枚 → 拖到錢包對應格子）的「📷 掃描找零」：做法同輔助點擊自動收零錢
    //（先移除店家那枚，再以 null 呼叫 fillChangeTarget——語音、音效、已找回金額照原樣）
    if (window.ScanPay && window.ScanPay.attachEasyChange) {
      window.ScanPay.attachEasyChange({
        btnId: 'a3-scan-change-easy-btn', log: log,
        stage: function () {
          var area = document.getElementById('store-change-area');
          if (!area || !document.querySelector('#change-collection-area .change-target')) return null;
          return area.parentElement.querySelector('h2');
        },
        put: function (v) {
          var m = MD();
          var t = document.querySelector('#change-collection-area .change-target:not(.filled)[data-expected-value="' + v + '"]');
          var coin = document.querySelector('#store-change-area .change-money-item[data-value="' + v + '"]');
          if (!t || !coin) {
            return document.querySelector('#change-collection-area .change-target[data-expected-value="' + v + '"]')
              ? v + ' 元已經放好了' : '這次找零沒有 ' + v + ' 元';
          }
          var image = coin.dataset.image;
          coin.remove();
          m.fillChangeTarget(t, { value: v, image: image }, null);
          return null;
        },
        error: function () { var m = MD(); if (m && m.audio && m.audio.playSound) m.audio.playSound('error'); }
      });
    }
    var host = document.getElementById('app') || document.body;
    var mo = new MutationObserver(function () { ensureButton(); });
    mo.observe(host, { childList: true, subtree: true });
    ensureButton();
    log('A3 掃描付款外掛已啟動');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
