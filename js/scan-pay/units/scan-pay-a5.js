/**
 * A5 ATM提款機 × 掃描付款 — 外掛層（試做用，範圍只有「存款」）
 *
 * ⚠️ 這一層刻意不改 js/a5_atm_simulator.js 一個字。
 *
 * A5 跟其他單元最大的不同：ATM 有六種任務類型（提款/存款/查詢/轉帳/自選/隨機），
 * 「掃描付款」這個隱喻（學生拿實體卡片代表要交出去的錢）**只對得上存款**——
 * 提款是機器吐錢給學生、查詢/轉帳不涉及實體現鈔，硬套掃描沒有意義，
 * 這支外掛只在「存入現鈔」畫面出現，其餘任務類型的畫面上不會有掃描鈕。
 *
 * ⚠️ 存款畫面其實有三種彈窗，UI 機制互不相同：
 *   1. 自由存款（`#bill-selection-modal` 無 easy/normal 修飾 class）：
 *      2000/1000/500/100 四種面額各一顆按鈕，每點一次呼叫公開方法 `addBill(value)`
 *      累加張數（沒有「這一張是哪一張」的概念，純計數器）。
 *   2. 簡單模式指定金額（`.easy-mode-deposit`）／普通困難模式指定金額（`.normal-mode-deposit`）：
 *      畫面上鋪一排**外觀相同、彼此可互換**的 1000 元鈔票圖示（`.money-icon-item`），
 *      點一張消失一張，是「選夠張數」的任務，不是「認識定額」——這兩種模式**只接受 1000 元**，
 *      而且沒有公開方法可呼叫，點擊邏輯是關在 `bindMoneyIconClickEvents`／
 *      `bindNormalModeMoneyIconClickEvents` 裡的 closure，只能對真實 DOM 元素
 *      呼叫 `.click()`（JS 的 `.click()` 會忽略 CSS `pointer-events:none`，
 *      所以要自己先排除 `.locked` 的圖示，不能靠 CSS 擋）。
 *
 * 相依：vendor/aruco/{cv.js,aruco.js,dictionaries/apriltag_16h5.js} → mt-markers.js
 *       → scan-pay.js → 本檔（順序不能反）
 */
(function () {
  'use strict';

  var BTN_ID = 'a5-scan-pay-btn';
  var STYLE_ID = 'a5-scan-pay-style';
  // 2026-09-27 使用者定：放在彈窗標題列、靠左（ScanPay.placeLeft；靠右會被掃描視窗擋住）。
  // 有 ✕ 的彈窗標題本來就靠左 → 按鈕排在標題前面；沒有 ✕ 的（簡單模式指定金額）按鈕貼左、
  // 標題左右各讓出按鈕寬，標題不會被擠掉。
  // ⚠️ 2026-09-06 曾把按鈕直接 append 進 flex 標題列，標題被壓到換行、按鈕被裁掉——
  //    當時改成「自己一整行置中」；現在改由 placeLeft 讓位，不再擠壓標題。
  var CSS = [
    // 沒有 ✕ 的標頭（簡單模式指定金額）是 flex、裡面只有一個置中的 h3——h3 只有字寬的話會被擠到按鈕旁邊，要讓它撐滿
    '#bill-selection-modal .modal-header.scanpay-left-row>h3{flex:1 1 auto}',
    '#' + BTN_ID + '{display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;',
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

  var FREE_VALUES = [2000, 1000, 500, 100];

  function A5() { return window.ATM; }

  function log() {
    var a = A5();
    if (a && a.Debug && a.Debug.log) {
      a.Debug.log.apply(a.Debug, ['coin'].concat([].slice.call(arguments)));
    }
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /**
   * 解到一張卡 → 依目前開著的是哪一種存款彈窗，走不同路徑。
   */
  function onMoney(info) {
    var a = A5();
    var value = info.value;

    if (!a || !a.state) {
      window.ScanPay.flash('遊戲還沒載入完成');
      return;
    }

    var modal = document.getElementById('bill-selection-modal');
    if (!modal) {
      window.ScanPay.flash('現在不是存款畫面');
      return;
    }

    var isAssignedModal = modal.classList.contains('easy-mode-deposit') ||
                           modal.classList.contains('normal-mode-deposit');

    if (isAssignedModal) {
      // 指定金額彈窗：只接受 1000 元，圖示彼此可互換，找第一張還沒存、沒鎖住的就好
      if (value !== 1000) {
        window.ScanPay.flash('這裡只能存 1000 元鈔票');
        return;
      }
      var icon = modal.querySelector('.money-icon-item:not(.deposited):not(.locked)');
      if (!icon) {
        window.ScanPay.flash('鈔票都存完了');
        return;
      }
      log('掃描存款（指定金額彈窗）→ 1000');
      icon.click();
    } else {
      // 自由存款：四種面額各一顆按鈕，直接呼叫 addBill()
      if (FREE_VALUES.indexOf(value) === -1) {
        window.ScanPay.flash('這個面額不能存入');
        return;
      }
      log('掃描存款（自由存款）→', value);
      a.addBill(value);
    }
  }

  // ── 按鈕注入 ────────────────────────────────────────────────────────
  function ensureButton() {
    if (document.getElementById(BTN_ID)) return;

    var header = document.querySelector('#bill-selection-modal .modal-header');
    if (!header) return;

    if (!window.ScanPay || !window.ScanPay.isSupported()) return;

    injectStyle();
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.innerHTML = '📷 掃描存款';
    btn.addEventListener('click', openScanner);
    var closeBtn = header.querySelector(':scope > .close-btn');
    window.ScanPay.placeLeft(header, btn, closeBtn ? { start: true } : null);
    log('已插入掃描存款按鈕');
  }

  function openScanner() {
    window.ScanPay.open({
      title: '掃描存款',
      onMoney: onMoney,
      onClose: function () { log('掃描結束'); }
    });
  }

  function boot() {
    // 讓通用層讀得到本單元的設定，用來判斷「輔助點擊模式」是否開著（兩者互斥）
    if (window.ScanPay && window.ScanPay.setUnitSettings) {
      window.ScanPay.setUnitSettings(function () {
        var g = A5();
        return g && g.state && g.state.settings;
      });
    }
    // 存款彈窗掛在 document.body（不是 #app），觀察範圍要跟著放大
    var mo = new MutationObserver(function () { ensureButton(); });
    mo.observe(document.body, { childList: true, subtree: true });
    ensureButton();
    log('A5 掃描存款外掛已啟動');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
