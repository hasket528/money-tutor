/**
 * A2 理髮店售票機 × 掃描付款 — 外掛層（試做用）
 *
 * ⚠️ 這一層刻意不改 js/a2_barber_shop_kiosk.js 一個字。
 *    做法是從外部讀 DOM、呼叫既有的公開入口 BarberKiosk.selectMoney() /
 *    selectMoneyNormalMode()，不覆寫 BarberKiosk 的任何方法。
 *    不載入這支檔案，A2 行為 100% 回到原樣。
 *
 * A2 的錢包結構跟 A1/A4 都不一樣：{bills:[面額,...], coins:[面額,...]}
 * 是兩個純數字陣列，不是物件也不是計數表。畫面上每一張紙鈔/硬幣的 DOM id
 * 是 `money-{bill|coin}-{面額}-{陣列索引}` 這個固定格式，
 * selectMoney(amount, slotType, itemIndex) / selectMoneyNormalMode(...) 兩個入口
 * 都是直接照這個 id 反查元素（document.getElementById），所以我們只要找到
 * 一個目前真實存在、還沒被投入的同面額項目，把它 id 拆開餵回去就好。
 *
 * ⚠️ 簡單模式呼叫 selectMoney()，普通/困難模式呼叫 selectMoneyNormalMode()——
 *    兩個彈窗模板不同（moneySelectionModal 只顯示單一類型；walletPaymentModal
 *    紙鈔/硬幣同時顯示，但只有目前作用中的 .wp-section 那一區能投），
 *    掃描時要先看清楚是哪個模式、哪一區在作用中，不能兩邊都硬呼叫同一個函數。
 *
 * 相依：vendor/aruco/{cv.js,aruco.js,dictionaries/apriltag_16h5.js} → mt-markers.js
 *       → scan-pay.js → 本檔（順序不能反）
 */
(function () {
  'use strict';

  var BTN_ID = 'a2-scan-pay-btn';
  var STYLE_ID = 'a2-scan-pay-style';
  var CSS = [
    '#' + BTN_ID + '{display:inline-flex;align-items:center;gap:6px;',
    'padding:8px 16px;min-height:40px;border:none;border-radius:8px;cursor:pointer;touch-action:manipulation;',
    'background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;font-size:14px;font-weight:700;',
    'box-shadow:0 2px 8px rgba(37,99,235,.35)}',
    // ⚠️ 按下回饋只改亮度／陰影，**不可用 transform 位移**——按鈕在 mousedown 瞬間
    //    從指標下滑走，mouseup 就落在別的元素上，click 不會觸發（手機的 touch slop
    //    更敏感，一移就取消 tap）。見 CLAUDE.md「可點元素按下會位移」那條定則。
    // ⚠️ `transform:none!important` 是要壓過 ai-theme.css 的全域
    //    `button:active{transform:scale(.95)!important}`——按下時縮放會讓按鈕從指標下
    //    滑走，click 落空（同 CLAUDE.md 彈窗遮罩那條的解法）。
    '#' + BTN_ID + ':active{transform:none!important;',
    'filter:brightness(.88);box-shadow:0 1px 4px rgba(37,99,235,.45)}'
  ].join('');

  function BK() { return window.BarberKiosk; }

  function log() {
    var b = BK();
    if (b && b.Debug && b.Debug.log) {
      b.Debug.log.apply(b.Debug, ['coin'].concat([].slice.call(arguments)));
    }
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /** 錢包剩餘：{bills:[值,...], coins:[值,...]} 兩個陣列攤平計數 */
  function getRemain() {
    var b = BK();
    if (!b || !b.state || !b.state.settings) return [];
    var difficulty = b.state.settings.difficulty;
    var wallet = difficulty === 'easy'
      ? (b.state.gameState.easyMode && b.state.gameState.easyMode.walletCoins)
      : (b.state.gameState.normalMode && b.state.gameState.normalMode.walletCoins);
    if (!wallet) return [];
    var all = [].concat(wallet.bills || [], wallet.coins || []);
    var counts = {};
    all.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
    return Object.keys(counts).map(function (v) {
      return { value: parseInt(v, 10), count: counts[v] };
    }).sort(function (a, b2) { return b2.value - a.value; });
  }

  /**
   * 解到一張卡 → 到「投入金額」彈窗裡找一個同面額、目前可點的項目，
   * 拆解它的 id 反推 slotType/itemIndex，呼叫對應難度的公開入口。
   */
  function onMoney(info) {
    var b = BK();
    var value = info.value;

    if (!b || !b.state || !b.state.gameState) {
      window.ScanPay.flash('遊戲還沒載入完成');
      return;
    }

    var modal = document.getElementById('money-selection-modal');
    if (!modal) {
      window.ScanPay.flash('現在不是投錢畫面');
      return;
    }

    // 普通/困難模式的統一錢包彈窗（walletPaymentModal）紙鈔/硬幣同時顯示，
    // 但只有目前作用中（沒有 .inactive）的那一區能投；簡單模式的彈窗
    // （moneySelectionModal）本來就只顯示單一類型，沒有這個分區，scope 退回整個 modal。
    var activeScope = modal.querySelector('.wp-section:not(.inactive)') || modal;

    var el = activeScope.querySelector('.individual-money-item[data-value="' + value + '"]:not(.money-inserted)');
    if (!el) {
      // 面額存在但落在非作用區（例如投幣入口開著卻掃紙鈔）要跟一般「沒有這個面額」分開講
      var elsewhere = modal.querySelector('.individual-money-item[data-value="' + value + '"]:not(.money-inserted)');
      window.ScanPay.flash(elsewhere ? '現在這個入口不能投這個面額' : '錢包裡沒有 ' + value + ' 元了');
      if (b.audio && typeof b.audio.playSound === 'function') b.audio.playSound('error');
      log('找不到可用項目：', value);
      return;
    }

    var parts = el.id.split('-');   // money-{type}-{value}-{index}
    var slotType = parts[1];
    var itemIndex = parseInt(parts[3], 10);

    log('掃描投入 →', el.id, value, slotType, itemIndex);

    if (b.state.settings.difficulty === 'easy') {
      b.selectMoney(value, slotType, itemIndex);
    } else {
      b.selectMoneyNormalMode(value, slotType, itemIndex);
    }
  }

  // ── 按鈕注入 ────────────────────────────────────────────────────────
  function ensureButton() {
    if (document.getElementById(BTN_ID)) return;

    // 兩種難度的彈窗模板不同，但都用同一個 #money-selection-modal 外殼＋.modal-header
    var header = document.querySelector('#money-selection-modal .modal-header');
    if (!header) return;

    if (!window.ScanPay || !window.ScanPay.isSupported()) return;

    injectStyle();
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.innerHTML = '📷 掃描投入';
    btn.addEventListener('click', openScanner);
    window.ScanPay.placeLeft(header, btn, { inset: 10 });   // 彈窗標題列、靠左（標頭沒有內距，離圓角留 10px）
    log('已插入掃描投入按鈕');
  }

  function openScanner() {
    window.ScanPay.open({
      title: '掃描投入',
      onMoney: onMoney,
      getRemain: getRemain,
      onClose: function () { log('掃描結束'); }
    });
  }

  function boot() {
    // 讓通用層讀得到本單元的設定，用來判斷「輔助點擊模式」是否開著（兩者互斥）
    if (window.ScanPay && window.ScanPay.setUnitSettings) {
      window.ScanPay.setUnitSettings(function () {
        var g = BK();
        return g && g.state && g.state.settings;
      });
    }
    // 投錢彈窗掛在 document.body（不是 #app），觀察範圍要跟著放大
    var mo = new MutationObserver(function () { ensureButton(); });
    mo.observe(document.body, { childList: true, subtree: true });
    ensureButton();
    log('A2 掃描投入外掛已啟動');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
