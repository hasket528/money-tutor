/**
 * C 系列 × 掃描付款 — 外掛層（C1／C5／C6 共用這一支，2026-10-04）
 *
 *   C1 金錢的種類與面額  「請找出 X」：學生從整疊教具卡裡拿出那一張給鏡頭看＝作答（三種難度都可用）。
 *                        掃到的面額是選項之一 → 跟點那個選項一模一樣；
 *                        不在選項裡 → 一樣算答錯（使用者 2026-10-04 定，方案 A），提示「這是 Y 元，不是 X 元」。
 *   C5 足額付款           把錢包的錢放進購物區（簡單／普通／困難）
 *   C6 找零與計算         步驟一付款；步驟二找零（簡單＝店家找回的錢放進錢包的提示格；
 *                        普通／困難＝從「找零面額」托盤拿錢放進錢包，2026-10-04 改成拖曳後才有）
 *
 * ⚠️ 這一層刻意不改各單元的 js 一個字。不載入這支檔案，單元行為 100% 回到原樣。
 * 做法同 scan-pay-b.js：掃到一張卡 → 派送一個跟拖曳一模一樣的 drop 事件（ScanPay.fireDrop），
 * 走單元自己的放錢流程，語音、音效、提示、計分全部照原樣。C1 是選擇題，改成觸發選項本身的 click。
 *
 * 相依：vendor/aruco/{cv.js,aruco.js,dictionaries/apriltag_16h5.js} → mt-markers.js → scan-pay.js → 本檔
 */
(function () {
  'use strict';

  var BTN_ID = 'c-scan-pay-btn';
  var ROW_CLASS = 'c-scan-pay-row';
  var STYLE_ID = 'c-scan-pay-style';
  var CSS = [
    '.' + ROW_CLASS + '{display:flex;justify-content:flex-start;margin:4px 0 8px}',
    '#' + BTN_ID + '{display:inline-flex;align-items:center;gap:6px;',
    'padding:8px 14px;min-height:40px;border:none;border-radius:12px;cursor:pointer;touch-action:manipulation;',
    'background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;font-size:.9rem;font-weight:700;',
    'box-shadow:0 2px 8px rgba(37,99,235,.35)}',
    // 按下回饋只改亮度，不可位移（CLAUDE.md「可點元素按下會位移」）
    '#' + BTN_ID + ':active{transform:none!important;filter:brightness(.88)}',
    // C1：掃描小視窗原本固定右下角，會蓋住第四個選項 → 桌面改右上（題目卡右半是空的）、
    //     iPad 橫式改左下（題目卡下面只有掃描鈕與吉祥物）。只影響 C1 頁面。
    '.c1-unit .scanpay-mask{top:76px;bottom:auto}',
    'html.tablet-land .c1-unit .scanpay-mask{top:auto;bottom:16px;right:auto;left:16px}'
  ].join('');

  /** C 系列在檔案最上層寫 `let Game;`，不會掛在 window 上（C6 例外有掛），只能用裸名字讀 */
  function G() {
    try { return (typeof Game !== 'undefined') ? Game : null; } catch (e) { return null; }
  }
  function log() {
    var g = G();
    if (g && g.Debug && typeof g.Debug.log === 'function') g.Debug.log.apply(g.Debug, ['scan'].concat([].slice.call(arguments)));
  }
  function flash(msg) { if (window.ScanPay) window.ScanPay.flash(msg); }
  function errorSound() {
    var g = G();
    try {
      if (g && g.audio && g.audio.playErrorSound) g.audio.playErrorSound();
      else document.getElementById('error-sound') && document.getElementById('error-sound').play();
    } catch (e) { /* 音效失敗不擋流程 */ }
  }
  function visible(el) { return !!(el && el.getClientRects().length && !el.classList.contains('hidden')); }
  function fireDrop(target, data) { window.ScanPay.fireDrop(target, data); }

  /** 錢包裡（還沒付出去的）同面額的錢 */
  function walletMoney(containerSel, value, attr) {
    return [].slice.call(document.querySelectorAll(containerSel)).filter(function (el) {
      return visible(el) && parseInt(el.dataset[attr || 'value'], 10) === value;
    });
  }
  function walletRemain(containerSel, attr) {
    var counts = {};
    [].slice.call(document.querySelectorAll(containerSel)).forEach(function (el) {
      if (!visible(el)) return;
      var v = parseInt(el.dataset[attr || 'value'], 10);
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.keys(counts).map(function (v) { return { value: parseInt(v, 10), count: counts[v] }; })
      .sort(function (a, b) { return b.value - a.value; });
  }

  // ── 各單元的畫面 ─────────────────────────────────────────────────────
  // detect() → { zone, anchor（按鈕插在它前面）} 或 null；put(st, value)；remain(st) 可選
  var STAGES = [
    {
      id: 'c1-answer', label: '📷 掃描作答', title: '拿出那張錢給鏡頭看',
      detect: function () {
        var area = document.getElementById('options-area');
        if (!area || !document.body.classList.contains('c1-unit') || !area.querySelector('.product-item')) return null;
        return { zone: area, anchor: area };
      },
      put: function (st, value) {
        var g = G();
        if (!g || !g.state || g.state.isAnswering) { flash('等一下，上一題還在處理'); return; }
        var q = g.state.quizQuestions && g.state.quizQuestions[g.state.currentQuestionIndex - 1];
        var correct = q && q.answer;
        if (!correct) return;
        var opt = st.zone.querySelector('.product-item[data-value="' + value + '"]');
        if (opt) {
          opt.click();   // 跟學生點那個選項完全一樣（對錯、語音、計分都是單元自己判）
          log('C1 掃描作答（選項內）→', value);
          return;
        }
        // 不在選項裡：一樣算答錯。給單元的判題函式一個「看不見的選項」，
        // 對錯紀錄、扣分、重答／下一題的規則都照單元原本的流程，畫面上不會有錯的那一格被標紅。
        flash('這是 ' + value + ' 元，不是 ' + correct.value + ' 元');
        var ghost = document.createElement('div');
        ghost.className = 'product-item';
        ghost.dataset.value = String(value);
        g.checkAnswer({ type: 'scan', currentTarget: ghost }, correct);
        log('C1 掃描作答（選項外，算答錯）→', value);
      }
    },
    {
      id: 'c5-pay', label: '📷 掃描付款', title: '掃描付款',
      detect: function () {
        var zone = document.getElementById('payment-zone-area');
        var src = document.getElementById('money-source-area');
        if (!zone || !src || !document.body.classList.contains('c5-unit')) return null;
        return { zone: zone, anchor: src };
      },
      put: function (st, value) {
        var m = walletMoney('#money-source-area .money-item', value)[0];
        if (!m) { flash('錢包裡沒有 ' + value + ' 元'); errorSound(); return; }
        fireDrop(st.zone, m.id);
        log('C5 掃描付款 →', value, m.id);
      },
      remain: function () { return walletRemain('#money-source-area .money-item'); }
    },
    {
      id: 'c6-pay', label: '📷 掃描付款', title: '掃描付款',
      detect: function () {
        var zone = document.getElementById('payment-drop-zone');
        var wallet = document.getElementById('wallet-container');
        if (!zone || !wallet || !document.body.classList.contains('c6-unit')) return null;
        return { zone: zone, anchor: wallet };
      },
      put: function (st, value) {
        var m = walletMoney('#wallet-container [id^="wallet-money-"]', value)[0];
        if (!m) { flash('錢包裡沒有 ' + value + ' 元'); errorSound(); return; }
        // 簡單模式有淡化提示：用不到的面額單元會拒收，掃描這邊先給看得懂的訊息
        var hints = document.querySelectorAll('#payment-money-container .hint-money');
        if (hints.length && !document.querySelector('#payment-money-container .hint-money.faded[data-value="' + value + '"]:not([data-wallet-id])')) {
          flash(value + ' 元不用再放了'); errorSound(); return;
        }
        fireDrop(st.zone, m.id.replace('wallet-money-', ''));
        log('C6 掃描付款 →', value, m.id);
      },
      remain: function () { return walletRemain('#wallet-container [id^="wallet-money-"]'); }
    },
    {
      // C6 簡單：店家找回的錢（.change-money）放進錢包裡同面額的淡化格（.wallet-target.faded）
      id: 'c6-change-easy', label: '📷 掃描找零', title: '掃描找零',
      detect: function () {
        var t = document.querySelector('.wallet-target');
        var src = document.querySelector('.store-change');
        if (!t || !src || !document.body.classList.contains('c6-unit')) return null;
        return { zone: null, anchor: src };
      },
      put: function (st, value) {
        var m = [].slice.call(document.querySelectorAll('.store-change .change-money')).filter(function (el) {
          return visible(el) && parseInt(el.dataset.moneyValue, 10) === value;
        })[0];
        var slot = document.querySelector('.wallet-target.faded[data-expected-value="' + value + '"]') ||
                   (!document.querySelector('.wallet-target[data-expected-value]') && document.querySelector('.wallet-target.faded'));
        if (!m || !slot) { flash('這次找零用不到 ' + value + ' 元'); errorSound(); return; }
        fireDrop(slot, m.id.replace('change-money-', ''));
        log('C6 掃描找零（簡單）→', value);
      }
    },
    {
      // C6 普通／困難：「找零面額」托盤（不限數量）→ 我的錢包
      id: 'c6-change-drag', label: '📷 掃描找零', title: '掃描找零',
      detect: function () {
        var zone = document.getElementById('c6c-wallet-zone');
        var tray = document.getElementById('c6c-tray-coins');
        return zone && tray ? { zone: zone, anchor: tray } : null;
      },
      put: function (st, value) {
        if (!document.querySelector('.c6c-denom-card[data-denom="' + value + '"]')) {
          flash('這次找零用不到 ' + value + ' 元'); errorSound(); return;
        }
        fireDrop(st.zone, 'c6chdenom:' + value);
        log('C6 掃描找零 →', value);
      }
    }
  ];

  function currentStage() {
    for (var i = 0; i < STAGES.length; i++) {
      var st = STAGES[i].detect();
      if (st) { st.def = STAGES[i]; return st; }
    }
    return null;
  }

  function onMoney(info) {
    var g = G();
    if (!g || !g.state) { flash('遊戲還沒載入完成'); return; }
    var st = currentStage();
    if (!st) { flash('現在不是放錢的畫面'); return; }
    st.def.put(st, info.value);
  }

  function openScanner() {
    var st = currentStage();
    var opts = {
      title: st ? st.def.title : '掃描付款',
      onMoney: onMoney,
      onClose: function () { log('掃描結束'); }
    };
    // 「還可以付」只給錢包數量有限的付款畫面；C1 作答與找零托盤（不限數量）不給，視窗顯示「—」而不是「（沒有了）」
    if (st && st.def.remain) opts.getRemain = function () { var s = currentStage(); return s && s.def.remain ? s.def.remain(s) : []; };
    window.ScanPay.open(opts);
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function ensureButton() {
    var st = currentStage();
    var old = document.getElementById(BTN_ID);
    if (old) {
      if (st && old.dataset.stage === st.def.id && document.body.contains(old)) return;
      var row = old.closest('.' + ROW_CLASS);
      if (row) row.parentNode.removeChild(row);
      else {
        // 放在標題裡的：拿掉按鈕、把標題的內距還原（標題是單元的，不能跟著刪）
        var host = old.parentNode;
        host.removeChild(old);
        if (window.ScanPay && window.ScanPay.unplaceLeft) window.ScanPay.unplaceLeft(host);
      }
    }
    if (!st || !st.anchor || !st.anchor.parentNode) return;
    // 鏡頭不可用／老師沒開／輔助點擊開著 → 不放按鈕
    if (!window.ScanPay || !window.ScanPay.isSupported()) return;
    injectStyle();
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.textContent = st.def.label;
    btn.dataset.stage = st.def.id;
    btn.addEventListener('click', openScanner);
    // 錨點正上方那一行是這一框的標題（C5／C6「我的錢包」、C6「店家找零」「找零面額」）→ 掛進標題列、靠左
    // （ScanPay.placeLeft，跟 A／B 系列同一支；2026-10-05 使用者定：掃描鈕所在框有標題就跟標題同一列）。
    // 沒有標題的（C1 選項區）才自己佔一列。
    var title = st.anchor.previousElementSibling;
    if (title && title.offsetParent && (/title/.test(title.className) || /^H[1-4]$/.test(title.tagName)) &&
        !title.querySelector('button')) {
      window.ScanPay.placeLeft(title, btn);
    } else {
      var wrap = document.createElement('div');
      wrap.className = ROW_CLASS;
      wrap.appendChild(btn);
      st.anchor.parentNode.insertBefore(wrap, st.anchor);
    }
    log('已插入掃描按鈕（' + st.def.id + '）');
  }

  function boot() {
    // C 系列沒有輔助點擊模式（C1／C5／C6 設定頁都沒有這一項）；仍交出難度給通用層
    if (window.ScanPay && window.ScanPay.setUnitSettings) {
      window.ScanPay.setUnitSettings(function () {
        var g = G();
        var s = g && g.state && g.state.settings;
        return s ? { clickMode: false, difficulty: s.difficulty } : null;
      });
    }
    var host = document.getElementById('app') || document.body;
    var mo = new MutationObserver(function () { ensureButton(); });
    mo.observe(host, { childList: true, subtree: true });
    ensureButton();
    log('C 系列掃描付款外掛已啟動');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
