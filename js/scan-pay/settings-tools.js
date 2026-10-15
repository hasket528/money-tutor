/**
 * A 系列（與 B5/B6）設定頁的兩個老師工具 — 外掛層
 *
 *   📷 掃描付款開關   → 插在「🎯 選擇難度」的「困難」右邊
 *   🪙 列印金錢教材教具卡 → 與「產生作業單」並排在同一組
 *
 * 這兩個原本在 teacher.html 的工具列，但老師實際在用的是單元設定頁——
 * 開關藏在另一個頁面，等於老師不會知道有這個功能（2026-09-06 實機就是這樣：
 * 進 A6 付款畫面看不到掃描按鈕，因為沒人告訴他要先去別的地方打開）。
 *
 * ⚠️ 這一層刻意不改六支單元 js 一個字（同 scan-pay-a*.js 的做法）：
 *    設定頁是每次進入重新渲染的，所以用 MutationObserver 補回按鈕。
 *
 * ⚠️ 按鈕**不設 data-type / data-value**：設定頁的共用處理器是
 *    `if (type && value)` 才動作，兩個都不給就不會被當成設定項。
 *    狀態也**不用 active class**——點難度時處理器會把同一個 .button-group 裡的
 *    active 全部清掉，借用它會被一起洗掉，所以開關狀態自己用文字與底色表示。
 *
 * 相依：mt-markers.js → scan-pay.js（要用 ScanPay.isEnabled/setEnabled）
 */
(function (global) {
  'use strict';

  var TOGGLE_ID = 'settings-scanpay-toggle';
  var CARDS_ID  = 'settings-money-cards-link';
  var STYLE_ID  = 'settings-tools-style';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      '#' + TOGGLE_ID + '.on{background:linear-gradient(135deg,#0ea5e9,#2563eb)!important;',
      'color:#fff!important;border-color:#2563eb!important}',
      '#' + TOGGLE_ID + '.scanpay-blocked{opacity:.45!important;cursor:not-allowed!important;',
      'background:#e9ecef!important;color:#6c757d!important;border-color:#ced4da!important}',
      '#' + CARDS_ID + '{color:#000!important;font-weight:bold!important;text-decoration:none;',
      'display:inline-flex;align-items:center;justify-content:center}'
    ].join('');
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  // 「輔助點擊模式」開著時，掃描付款要讓位（見 scan-pay.js 的 clickModeActive 註解）。
  // 這裡讀 DOM 而不是單元的 state：六個單元的全域物件名各不相同（VendingMachine／
  // BarberKiosk／McDonald／Game／ATM），但設定頁按鈕的 data-type 是一致的。
  // ⚠️ **不要抓容器的 class/id**：六個單元各寫各的（clickModeSetting／click-mode-setting／
  //    clickmode-section／沒有 id），只有 A4/A6 有 .clickmode-section。
  // ⚠️ 要連「看不看得到」一起判斷——六個單元都是在非簡單模式時把整區 display:none，
  //    此時 clickMode 旗標可能還留著 true，但畫面上根本沒這個選項，不該算數。
  function clickModeOn() {
    // B 系列（2026-09-27 起）的設定頁是另一套，而且兩種寫法並存：
    //   B1／B5／B6＝.b-sel-btn[data-assist="on"]；B2＝#assist-group 裡的 .b-sel-btn[data-val="on"]
    //   （B2 的 data-val 也用在難度鈕，所以一定要限定在 #assist-group 裡）
    var on = document.querySelector('.selection-btn[data-type="clickMode"][data-value="true"]') ||
             document.querySelector('.b-sel-btn[data-assist="on"]') ||
             document.querySelector('#assist-group .b-sel-btn[data-val="on"]');
    if (!on) return false;                          // 這個單元沒有輔助點擊選項
    if (!on.getClientRects().length) return false;  // 整區被隱藏（非簡單模式）
    return on.classList.contains('active');
  }

  // ⚠️ 只在值真的改變時才寫 DOM：這支是被 MutationObserver 呼叫的，
  //    無條件寫入會自己觸發下一次 observer，變成無限迴圈。
  function set(el, prop, val) { if (el[prop] !== val) el[prop] = val; }

  function paint(btn) {
    var blocked = clickModeOn();

    // 互斥：輔助點擊開著就把掃描付款關掉（不是只擋 UI——學生端讀的是這個旗標）
    if (blocked && global.ScanPay && global.ScanPay.isEnabled()) {
      global.ScanPay.setEnabled(false);
    }

    var on = !blocked && global.ScanPay && global.ScanPay.isEnabled();
    set(btn, 'textContent', blocked ? '📷 掃描付款：不可用' : (on ? '📷 掃描付款：開' : '📷 掃描付款：關'));
    set(btn, 'disabled', blocked);
    if (btn.classList.contains('on') !== !!on) btn.classList.toggle('on', !!on);
    if (btn.classList.contains('scanpay-blocked') !== blocked) btn.classList.toggle('scanpay-blocked', blocked);
    set(btn, 'title', blocked
      ? '「輔助點擊模式」開著時不能用掃描付款：輔助點擊會自動幫學生完成付款，卡片就沒有作用了。要用掃描付款請先把上面的輔助點擊模式停用。'
      : (on
        ? '學生在付款／投幣畫面會看到「📷 掃描付款」。記得先用「🪙 列印金錢教材教具卡」印好卡片。'
        : '開啟後，付款／投幣畫面會出現「📷 掃描付款」，可以用鏡頭讀教具卡上的標記代替拖曳。'));
  }

  function ensureToggle() {
    if (document.getElementById(TOGGLE_ID)) return;
    // 掛在「困難」右邊＝同一個 .button-group 的最後
    // A 系列：.selection-btn[data-type="difficulty"] 在 .button-group 裡；
    // B 系列：.b-sel-btn.b-diff-hard 在 .b-btn-group 裡（B5/B6 用 data-val、B1 用 data-diff，
    //   兩種都有 b-diff-hard 這個 class）。按鈕沿用各自的 class 才會跟旁邊長得一樣。
    // ⚠️ 不可給 data-val／data-diff、不可加 b-diff-* class：難度處理器是在設定頁渲染後「同步」
    //    querySelectorAll 綁的，本按鈕由 MutationObserver 在之後才插入，所以不會被綁到——
    //    但只要帶了那些屬性，下次有人改成事件委派就會把它當成一個難度。
    var hardA = document.querySelector('.selection-btn[data-type="difficulty"][data-value="hard"]');
    var hardB = !hardA && document.querySelector('.b-sel-btn.b-diff-hard');
    var hard = hardA || hardB;
    var group = hard && hard.closest(hardA ? '.button-group' : '.b-btn-group');
    if (!group) return;
    if (!global.ScanPay) return;

    injectStyle();
    var btn = document.createElement('button');
    btn.id = TOGGLE_ID;
    btn.type = 'button';
    btn.className = hardA ? 'selection-btn' : 'b-sel-btn';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();          // 不要讓設定頁的共用處理器也收到
      global.ScanPay.setEnabled(!global.ScanPay.isEnabled());
      paint(btn);
    });
    paint(btn);
    group.appendChild(btn);
  }

  // 🪙 列印金錢教材教具卡：與「產生作業單」共用同一個 .setting-group／.button-group，
  // 標題改成「📝 作業單與🪙 金錢教材教具卡：」。沿用原本的結構，標題與按鈕的間距
  // 就跟設定頁其他選項完全一致（不另包容器、不自己調 margin）。
  function ensureCardsLink() {
    if (document.getElementById(CARDS_ID)) return;
    var ws = document.getElementById('settings-worksheet-link');
    var isB = !!(ws && ws.classList.contains('b-sel-btn'));
    var group = ws && ws.closest(isB ? '.b-btn-group' : '.button-group');
    if (!group) return;

    var title = group.parentNode.querySelector('label');
    if (title) title.textContent = '📝 作業單與🪙 金錢教材教具卡：';

    injectStyle();
    var a = document.createElement('a');
    a.id = CARDS_ID;
    a.className = isB ? 'b-sel-btn' : 'selection-btn';
    a.href = '../worksheet/money-cards.html';
    a.target = '_blank';
    a.textContent = '列印教具卡';
    a.title = '可自選面額（1／5／10／50／100／200／500…元）、調整圖示大小、選紙張與張數；依中央銀行規定預設為真錢的 70%（不提供 75%～125%），每張卡都印「教具」字樣。列印前先用頁面上的尺規校正比例';
    group.appendChild(a);
  }

  function tick() {
    ensureToggle();
    ensureCardsLink();
    // ⚠️ ensureToggle 在按鈕已存在時會早退，但「輔助點擊」可能剛被切換 →
    //    每次都要重畫一次狀態，否則老師點了輔助點擊，掃描付款那顆還顯示「開」。
    var btn = document.getElementById(TOGGLE_ID);
    if (btn) paint(btn);
  }

  function boot() {
    // 設定頁每次進入都重新渲染 → 用 observer 補回來（同 scan-pay-a*.js）
    var host = document.getElementById('app') || document.body;
    var mo = new MutationObserver(tick);
    mo.observe(host, { childList: true, subtree: true });
    // ⚠️ 點「輔助點擊：啟用」只換 class、不增減元素 → 上面的 observer 收不到，
    //    開關會一直顯示「開」（2026-09-27 B1／B2 實測）。點擊後重畫一次；
    //    等設定頁自己的處理器跑完（它也是 click）才讀得到新的 active 狀態，所以延到下一輪。
    document.addEventListener('click', function () { setTimeout(tick, 0); }, true);
    tick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
