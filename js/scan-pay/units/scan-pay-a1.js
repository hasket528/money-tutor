/**
 * A1 自動販賣機 × 掃描付款 — 外掛層（試做用）
 *
 * ⚠️ 這一層刻意不改 js/a1_vending_machine.js 一個字。
 *    做法是從外部讀 DOM、呼叫既有的公開入口 VendingMachine.clickCoin(coinId, value)，
 *    不覆寫 VendingMachine 的任何方法。不載入這支檔案，A1 行為 100% 回到原樣。
 *
 * A1 跟 A4 不一樣：投幣本來就是「點擊硬幣」而不是拖放，clickCoin(coinId, value) 只要給
 * 「哪個 DOM 元素、多少錢」兩個參數就會自己完成投入（扣錢包、播音效、判斷是否投足），
 * 不需要像 A4 那樣假造 dragstart/drop 事件。但 clickCoin 內部第一行就是
 * document.getElementById(coinId)，找不到就整支函數直接 return——
 * 所以 coinId 一定要是「錢包彈窗裡目前真實存在的那枚硬幣」的 id，不能隨便編。
 *
 * 相依：vendor/aruco/{cv.js,aruco.js,dictionaries/apriltag_16h5.js} → mt-markers.js
 *       → scan-pay.js → 本檔（順序不能反）
 */
(function () {
  'use strict';

  var BTN_ID = 'a1-scan-pay-btn';
  var STYLE_ID = 'a1-scan-pay-style';
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

  function VM() { return window.VendingMachine; }

  function log() {
    var v = VM();
    if (v && v.Debug && v.Debug.log) {
      v.Debug.log.apply(v.Debug, ['coin'].concat([].slice.call(arguments)));
    }
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /** 錢包剩餘：掃描浮層的「還可以付」用這個（walletCoins 是 {面額: 張數} 物件，不是陣列）*/
  function getRemain() {
    var v = VM();
    var coins = (v && v.state && v.state.gameState && v.state.gameState.walletCoins) || {};
    return Object.keys(coins).map(function (val) {
      return { value: parseInt(val, 10), count: coins[val] };
    }).filter(function (r) { return r.count > 0; })
      .sort(function (a, b) { return b.value - a.value; });
  }

  /**
   * 解到一張卡 → 到「請投入硬幣」彈窗裡找一枚同面額、目前可點的硬幣，模擬點擊它
   *
   * 找不到可用硬幣時一律給明確訊息，不靜默失敗——教具卡跟畫面錢包對不上、
   * 或提示模式下該面額被禁用，都是常見狀況，不是學生的錯。
   */
  function onMoney(info) {
    var v = VM();
    var value = info.value;

    if (!v || !v.state || !v.state.gameState) {
      window.ScanPay.flash('遊戲還沒載入完成');
      return;
    }

    var modal = document.getElementById('wallet-coins-modal');
    if (!modal) {
      window.ScanPay.flash('現在不是投幣畫面');
      return;
    }

    var container = document.getElementById('coinsContainer');
    if (!container) {
      window.ScanPay.flash('找不到硬幣清單');
      return;
    }

    // 同面額可能有好幾枚，挑第一枚「還沒在消失動畫中、沒被禁用」的
    var candidates = container.querySelectorAll('.individual-coin[data-value="' + value + '"]');
    var coin = null;
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (c.classList.contains('inserted')) continue;            // 已經投入、動畫中
      if (c.getAttribute('data-disabled') === 'true') continue;   // 提示模式下的非提示硬幣
      coin = c;
      break;
    }

    if (!coin) {
      window.ScanPay.flash(candidates.length > 0
        ? '現在不能投這個面額'
        : '錢包裡沒有 ' + value + ' 元了');
      if (v.audio && typeof v.audio.play === 'function') v.audio.play('error03');
      log('找不到可用硬幣：', value);
      return;
    }

    log('掃描投幣 →', coin.id, value);
    v.clickCoin(coin.id, value);
  }

  // ── 按鈕注入 ────────────────────────────────────────────────────────
  function ensureButton() {
    if (document.getElementById(BTN_ID)) return;

    // 掛進「💰請投入硬幣」那個標題列、靠左（ScanPay.placeLeft；2026-09-27 全站掃描鈕一律這樣擺，靠右會被掃描視窗擋住）
    var titleRow = document.getElementById('coinModalTitle');
    if (!titleRow) return;

    // 鏡頭不可用就不要放按鈕——按了才說失敗是更差的體驗
    if (!window.ScanPay || !window.ScanPay.isSupported()) return;

    injectStyle();
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.innerHTML = '📷 掃描投幣';
    btn.addEventListener('click', openScanner);
    window.ScanPay.placeLeft(titleRow, btn);
    log('已插入掃描投幣按鈕');
  }

  function openScanner() {
    window.ScanPay.open({
      title: '掃描投幣',
      onMoney: onMoney,
      getRemain: getRemain,
      onClose: function () { log('掃描結束'); }
    });
  }

  function boot() {
    // 讓通用層讀得到本單元的設定，用來判斷「輔助點擊模式」是否開著（兩者互斥）
    if (window.ScanPay && window.ScanPay.setUnitSettings) {
      window.ScanPay.setUnitSettings(function () {
        var g = VM();
        return g && g.state && g.state.settings;
      });
    }
    // 硬幣彈窗是掛在 document.body（不是 #app），觀察範圍要跟著放大，否則彈窗
    // 重新渲染時（每次選商品、每次重試）新按鈕補不回來
    var mo = new MutationObserver(function () { ensureButton(); });
    mo.observe(document.body, { childList: true, subtree: true });
    ensureButton();
    log('A1 掃描投幣外掛已啟動');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
