/**
 * A6 火車購票 × 掃描付款 — 外掛層（試做用）
 *
 * ⚠️ 這一層刻意不改 js/a6_train_ticket.js 一個字。
 *
 * A6 比 A1/A2/A4 都難掛：付款的 drop 邏輯是用
 * `this.EventManager.on(paymentArea, 'drop', (e) => {...})` 掛的一大段閉包，
 * 完全沒有拆出公開方法可以直接呼叫（跟 A3 一開始以為的狀況一樣，但 A3 後來
 * 查到 fillPaymentTarget/addMoneyToPaymentArea 其實是公開方法，A6 沒有這種後路）。
 * 唯一能觸發它的辦法，是真的對 DOM 元素 dispatch 一個 `drop` 事件、
 * 把 `dataTransfer.getData()` 接到我們要的資料上，讓瀏覽器的事件系統
 * 自然呼叫到那段閉包——這跟「呼叫函式」效果一樣，只是要透過事件系統繞一手。
 *
 * ⚠️ 簡單模式的付款一定要「拖到正確的提示格」才算數（`.payment-hint-item.faded
 * [data-hint-value]`），程式碼判斷目標用的是 `e.target.closest('.payment-hint-item')`
 * ——所以事件要 dispatch 在**那個提示格本身**（讓它 bubble 上去），
 * 不能 dispatch 在 `#payment-area` 上（那樣 e.target 就是付款區容器本身，
 * `.closest('.payment-hint-item')` 一定找不到，会被判定成「沒拖到提示位置」而拒絕）。
 * 普通/困難模式沒有提示格，直接 dispatch 在 `#payment-area` 上即可。
 *
 * 相依：vendor/aruco/{cv.js,aruco.js,dictionaries/apriltag_16h5.js} → mt-markers.js
 *       → scan-pay.js → 本檔（順序不能反）
 */
(function () {
  'use strict';

  var BTN_ID = 'a6-scan-pay-btn';
  var STYLE_ID = 'a6-scan-pay-style';
  var CSS = [
    '#' + BTN_ID + '{display:inline-flex;align-items:center;gap:6px;',
    'padding:8px 16px;min-height:36px;border:none;border-radius:20px;cursor:pointer;touch-action:manipulation;',
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

  function G() { return window.Game; }

  function log() {
    var g = G();
    if (g && g.Debug && g.Debug.log) {
      g.Debug.log.apply(g.Debug, ['payment'].concat([].slice.call(arguments)));
    }
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /** 對元素 dispatch 一個帶假 dataTransfer 的 drop 事件，讓 EventManager 掛的
   *  閉包當成真的拖放來處理（indexStr 對應 e.dataTransfer.getData('text/plain')）*/
  function dispatchDrop(target, indexStr) {
    var evt = new Event('drop', { bubbles: true, cancelable: true });
    evt.dataTransfer = { getData: function () { return indexStr; } };
    target.dispatchEvent(evt);
  }

  /** 錢包剩餘：直接看 DOM 顯示狀態（已付款的錢幣是 style.display='none'，
   *  不是從 playerWallet 陣列移除），跟 onMoney() 找可用項目用同一套判準 */
  function getRemain() {
    var walletArea = document.getElementById('wallet-display');
    if (!walletArea) return [];
    var counts = {};
    walletArea.querySelectorAll('.money-item').forEach(function (el) {
      if (el.style.display === 'none') return;
      var v = parseInt(el.dataset.value, 10);
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.keys(counts).map(function (v) {
      return { value: parseInt(v, 10), count: counts[v] };
    }).sort(function (a, b) { return b.value - a.value; });
  }

  /**
   * 解到一張卡 → 到錢包找一個同面額、還沒付出去的項目，
   * 對正確的目標 dispatch 一個 drop 事件。
   */
  function onMoney(info) {
    var g = G();
    var value = info.value;

    if (!g || !g.state || !g.state.gameState) {
      window.ScanPay.flash('遊戲還沒載入完成');
      return;
    }

    var paymentArea = document.getElementById('payment-area');
    if (!paymentArea) {
      window.ScanPay.flash('現在不是付款畫面');
      return;
    }

    var walletArea = document.getElementById('wallet-display');
    if (!walletArea) {
      window.ScanPay.flash('找不到錢包');
      return;
    }

    var candidates = walletArea.querySelectorAll('.money-item[data-value="' + value + '"]');
    var item = null;
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i].style.display === 'none') continue;
      item = candidates[i];
      break;
    }
    if (!item) {
      window.ScanPay.flash('錢包裡沒有 ' + value + ' 元了');
      return;
    }
    var index = item.dataset.index;

    var difficulty = g.state.settings.difficulty;

    if (difficulty === 'easy') {
      var hint = paymentArea.querySelector('.payment-hint-item.faded[data-hint-value="' + value + '"]');
      if (!hint) {
        window.ScanPay.flash('這個面額現在不用付');
        return;
      }
      log('掃描付款（提示位置）→', value);
      dispatchDrop(hint, index);
    } else {
      log('掃描付款（自由付款）→', value);
      dispatchDrop(paymentArea, index);
    }
  }

  // ── 按鈕注入 ────────────────────────────────────────────────────────
  function ensureButton() {
    if (document.getElementById(BTN_ID)) return;

    var header = document.querySelector('.payment-info-display-top');
    if (!header) return;

    if (!window.ScanPay || !window.ScanPay.isSupported()) return;

    injectStyle();
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.innerHTML = '📷 掃描付款';
    btn.addEventListener('click', openScanner);
    window.ScanPay.placeLeft(header, btn);   // 付款區頂列（票價／目前付款）、靠左
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
        var g = G();
        return g && g.state && g.state.settings;
      });
    }
    // 找零拖曳畫面（普通＋困難）的「📷 掃描找零」——共用 ScanPay.attachChangeDrag（A3／A4／A6 同一份）
    if (window.ScanPay && window.ScanPay.attachChangeDrag) {
      window.ScanPay.attachChangeDrag({
        prefix: 'a6c', btnId: 'a6-scan-change-btn',
        state: function () { var x = G(); return x && x.state && x.state.gameState; },
        error: function () { var g = G(); if (g && g.playSound) g.playSound('error'); },
        log: log
      });
    }
    // 簡單模式找零（店家擺好每一枚 → 拖到錢包對應格子）的「📷 掃描找零」：
    // 對「該面額還沒放的格子」派送一個跟手拖一樣的 drop（資料 easy-change-<編號>-<面額>），驗證與後續全走 handleEasyChangeTargetDrop
    if (window.ScanPay && window.ScanPay.attachEasyChange) {
      window.ScanPay.attachEasyChange({
        btnId: 'a6-scan-change-easy-btn', log: log,
        stage: function () {
          if (!document.querySelector('#easy-change-targets .easy-change-target')) return null;
          return document.querySelector('.easy-change-source > h4');
        },
        put: function (v) {
          var g = G(), dropped = (g && g.state && g.state.gameState && g.state.gameState.easyChangeDropped) || {};
          var t = [].slice.call(document.querySelectorAll('#easy-change-targets .easy-change-target[data-expected-value="' + v + '"]'))
            .filter(function (el) { return !dropped[el.dataset.targetIndex]; })[0];
          var coin = [].slice.call(document.querySelectorAll('#easy-change-money .easy-change-money[data-money-value="' + v + '"]'))
            .filter(function (el) { return el.style.display !== 'none' && el.getClientRects().length > 0; })[0];
          if (!t || !coin) {
            return document.querySelector('#easy-change-targets .easy-change-target[data-expected-value="' + v + '"]')
              ? v + ' 元已經放好了' : '這次找零沒有 ' + v + ' 元';
          }
          window.ScanPay.fireDrop(t, 'easy-change-' + coin.dataset.changeIndex + '-' + v);
          return null;
        },
        error: function () { var g = G(); if (g && g.playSound) g.playSound('error'); }
      });
    }
    var host = document.getElementById('app') || document.body;
    var mo = new MutationObserver(function () { ensureButton(); });
    mo.observe(host, { childList: true, subtree: true });
    ensureButton();
    log('A6 掃描付款外掛已啟動');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
