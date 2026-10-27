/**
 * A4 模擬購物 × 掃描付款 — 外掛層（試做用）
 *
 * ⚠️ 這一層刻意不改 js/a4_simulated_shopping.js 一個字。
 *    做法是從外部讀 DOM、呼叫既有的公開入口 Game.handleMoneyDrop()，
 *    不覆寫 Game 的任何方法。不載入這支檔案，A4 行為 100% 回到原樣。
 *
 * 為什麼 handleMoneyDrop 吃得下假事件：A4 的「輔助點擊模式」本來就是這樣做的
 * （見 ClickMode.executeNextPayment），事件只需要 preventDefault / target /
 * dataTransfer.getData 三個欄位。開頭那道 clickMode 防護判斷 event.isTrusted，
 * 假事件沒有這個欄位（undefined），所以不會被擋。
 *
 * 相依：vendor/aruco/{cv.js,aruco.js,dictionaries/apriltag_16h5.js} → mt-markers.js
 *       → scan-pay.js → 本檔（順序不能反）
 */
(function () {
  'use strict';

  var BTN_ID = 'a4-scan-pay-btn';
  var STYLE_ID = 'a4-scan-pay-style';
  // 2026-09-27 使用者定：跟「🛒付款區」同一列、靠左（ScanPay.placeLeft；靠右會被掃描視窗擋住）。
  // 普通／困難模式那一列右邊有提示鈕群組（position:absolute 貼右），交給 placeLeft 讓位。
  var CSS = [
    '#' + BTN_ID + '{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;',
    'padding:8px 14px;min-height:40px;border:none;border-radius:12px;cursor:pointer;touch-action:manipulation;',
    'background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;font-size:.9rem;font-weight:700;',
    'box-shadow:0 2px 8px rgba(37,99,235,.35)}',
    // ⚠️ 按下回饋只改亮度／陰影，**不可用 transform 位移**——按鈕在 mousedown 瞬間
    //    從指標下滑走，mouseup 就落在別的元素上，click 不會觸發（手機的 touch slop
    //    更敏感，一移就取消 tap）。見 CLAUDE.md「可點元素按下會位移」那條定則。
    // ⚠️ :active 的定位值由 ScanPay.placeLeft 的樣式鎖回（全域 button:active 會 scale）。
    '#' + BTN_ID + ':active{',
    'filter:brightness(.88);box-shadow:0 1px 4px rgba(37,99,235,.45)}'
  ].join('');

  function G() { return window.Game; }

  function log() {
    var g = G();
    if (g && g.Debug && g.Debug.log) {
      g.Debug.log.apply(g.Debug, ['scan'].concat([].slice.call(arguments)));
    }
  }

  function playError() {
    var g = G();
    if (g && g.audio && typeof g.audio.playErrorSound === 'function') g.audio.playErrorSound();
  }

  function speak(text) {
    var g = G();
    if (g && g.speech && typeof g.speech.speak === 'function') {
      try { g.speech.speak(text); } catch (e) { /* 語音失敗不擋流程 */ }
    }
  }

  /** 這個單元支援哪些面額（A4 的錢包只有 1/5/10/50/100/500/1000，沒有 200/2000）*/
  function supportedValues() {
    var g = G();
    var items = g && g.storeData && g.storeData.moneyItems;
    return items ? items.map(function (m) { return m.value; }) : [];
  }

  /** 錢包剩餘：掃描浮層的「還可以付」用這個 */
  function getRemain() {
    var g = G();
    var wallet = (g && g.state && g.state.gameState && g.state.gameState.playerWallet) || [];
    var counts = {};
    wallet.forEach(function (m) { counts[m.value] = (counts[m.value] || 0) + 1; });
    return Object.keys(counts).map(function (v) {
      return { value: parseInt(v, 10), count: counts[v] };
    }).sort(function (a, b) { return b.value - a.value; });
  }

  /**
   * 解到一張卡 → 換算成一次付款
   *
   * 找不到對應錢幣時一律給明確訊息，不靜默失敗——教具卡和畫面錢包對不上
   * 是很常見的狀況（老師印了一整套，題目只給其中幾張），那不是學生的錯，
   * 所以也不播成「答錯」，只播提示音。
   */
  function onMoney(info) {
    var g = G();
    var value = info.value;

    if (!g || !g.state || !g.state.gameState) {
      window.ScanPay.flash('遊戲還沒載入完成');
      return;
    }
    if (g.state.gameState.currentScene !== 'paying') {
      window.ScanPay.flash('現在不是付款畫面');
      return;
    }

    if (supportedValues().indexOf(value) === -1) {
      window.ScanPay.flash('這個單元沒有用到 ' + value + ' 元');
      playError();
      log('面額不在本單元清單：', value);
      return;
    }

    var wallet = g.state.gameState.playerWallet || [];
    var item = null;
    for (var i = 0; i < wallet.length; i++) {
      if (wallet[i].value === value) { item = wallet[i]; break; }
    }
    if (!item) {
      window.ScanPay.flash('錢包裡沒有 ' + value + ' 元了');
      playError();
      log('錢包已無此面額：', value);
      return;
    }

    // 決定放置目標：簡單模式要落在對應面額的提示格，其他模式落在付款區
    var difficulty = g.state.settings && g.state.settings.difficulty;
    var target;
    if (difficulty === 'easy') {
      target = document.querySelector('.hint-item.faded[data-value="' + value + '"]');
      if (!target) {
        window.ScanPay.flash(value + ' 元不用再付了');
        playError();
        log('簡單模式：該面額的提示格已滿', value);
        return;
      }
    } else {
      target = document.querySelector('.payment-zone');
      if (!target) {
        window.ScanPay.flash('找不到付款區');
        log('找不到 .payment-zone');
        return;
      }
    }

    var mockEvent = {
      preventDefault: function () {},
      target: target,
      dataTransfer: { getData: function () { return item.id; } }
    };

    log('掃描付款 →', item.name, item.id);
    g.handleMoneyDrop(mockEvent);
    speak(item.name);
  }

  // ── 按鈕注入 ────────────────────────────────────────────────────────
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function openScanner() {
    window.ScanPay.open({
      title: '掃描付款',
      onMoney: onMoney,
      getRemain: getRemain,
      onClose: function () { log('掃描結束'); }
    });
  }

  function ensureButton() {
    if (document.getElementById(BTN_ID)) return;

    // 掛進「🛒付款區」那個標題列，不是 .payment-zone 本身——按鈕跟標題同一列，
    // 不是跟錢幣格子同一列。找不到就不插入，不要退回去插到奇怪的位置。
    var header = document.querySelector('.payment-info-display-top');
    if (!header) return;

    // 鏡頭不可用就不要放按鈕——按了才說失敗是更差的體驗
    if (!window.ScanPay || !window.ScanPay.isSupported()) return;

    injectStyle();
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.innerHTML = '📷 掃描付款';
    btn.addEventListener('click', openScanner);
    var hintGroup = header.querySelector(':scope > div > .payment-hint-btn');
    window.ScanPay.placeLeft(header, btn, hintGroup ? { rightGroup: hintGroup.parentElement } : null);
    log('已插入掃描付款按鈕（付款區標題列，靠左）');
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
        prefix: 'a4c', btnId: 'a4-scan-change-btn',
        state: function () { var x = G(); return x && x.state && x.state.gameState; },
        error: function () { var g = G(); if (g && g.audio && g.audio.playErrorSound) g.audio.playErrorSound(); },
        log: log
      });
    }
    // 簡單模式找零（店家擺好每一枚 → 拖到錢包對應格子）的「📷 掃描找零」：
    // 對「該面額的空格」派送一個跟手拖一樣的 drop（資料 change-<編號>-<面額>），驗證與後續全走 handleChangeTargetDrop
    if (window.ScanPay && window.ScanPay.attachEasyChange) {
      window.ScanPay.attachEasyChange({
        btnId: 'a4-scan-change-easy-btn', log: log,
        stage: function () {
          if (!document.querySelector('.change-targets .change-target')) return null;
          return document.querySelector('.change-check-area > h3');
        },
        put: function (v) {
          var t = document.querySelector('.change-targets .change-target.faded[data-expected-value="' + v + '"]');
          var coin = [].slice.call(document.querySelectorAll('.store-change .change-money[data-money-value="' + v + '"]'))
            .filter(function (el) { return el.style.display !== 'none' && el.getClientRects().length > 0; })[0];
          if (!t || !coin) {
            return document.querySelector('.change-targets .change-target[data-expected-value="' + v + '"]')
              ? v + ' 元已經放好了' : '這次找零沒有 ' + v + ' 元';
          }
          window.ScanPay.fireDrop(t, 'change-' + coin.dataset.changeId + '-' + v);
          return null;
        },
        error: function () { var g = G(); if (g && g.audio && g.audio.playErrorSound) g.audio.playErrorSound(); }
      });
    }
    // A4 會整段重繪 #app，按鈕會被沖掉 → 用 observer 補回來
    var host = document.getElementById('app') || document.body;
    var mo = new MutationObserver(function () { ensureButton(); });
    mo.observe(host, { childList: true, subtree: true });
    ensureButton();
    log('A4 掃描付款外掛已啟動');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
