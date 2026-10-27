/**
 * B 系列 × 掃描付款 — 外掛層（B1／B2／B3／B5／B6 共用這一支）
 *
 *   B1 今天帶多少錢    步驟二「準備錢幣」：把錢放進錢包（托盤不限數量）
 *   B2 零用錢日記      步驟二：把算出來「剩下的零用錢」放出來（托盤不限數量）
 *   B3 存錢計畫        點日曆上的某一天 → 把當天要存的錢放進撲滿
 *                      簡單＝錢已拆好、逐枚放進同面額的格子；普通／困難＝自選面額（不限數量）
 *   B5 派對活動採購／B6 菜市場買菜
 *                      步驟二付款（托盤＝這一關給的錢，數量有限）＋步驟三找零（不限數量）
 *
 * ⚠️ 這一層刻意不改各單元的 js 一個字。不載入這支檔案，單元行為 100% 回到原樣。
 *
 * 為什麼這幾個單元共用一支：掃到之後的做法完全一樣（派送 drop 事件、掛按鈕、跟輔助點擊互斥），
 * 各單元不同的只有「怎麼認出現在的畫面」與「drop 資料長什麼樣子」——寫在下面的 STAGES 表。
 * 分開寫，共用的那一半就是好幾份要同步的程式。
 *
 * 做法：掃到一張卡 → 在放錢區派送一個 drop 事件，資料格式與拖曳時一模一樣。
 *   B1 準備錢幣：`<面額>`                               → 放進 #wallet-coins
 *   B2 剩下的錢：`<面額>`                               → 放進 #b2-wallet-coins
 *   B3 簡單：`{"denom":<面額>,"slotIdx":<來源錢幣序號>}` → 放進同面額的空格 .b3-drop-slot
 *   B3 普通／困難：`{"denom":<面額>}`                   → 放進 #b3-normal-placed-area
 *   B5/B6 付款：`tray:<trayUid>:<面額>:<正反面>`       → 放進 #bXp2-wallet-coins
 *   B5/B6 找零：`chdenom:<面額>`                        → 放進 #bXc-wallet-zone
 * 為什麼不直接叫單元的放錢函式（addCoin／_bXP2AddCoin…）：
 *   ① B5/B6 付款時，拖曳程式在叫 AddCoin「之前」還要把托盤上那張卡標成已用、藏起來，
 *      走 drop 事件才會一起做到，不必在這裡抄一份；
 *   ② B5/B6 找零真正在用的放錢函式是 _bXP2SetupChangeInteraction 裡的區域函式 handleDrop，
 *      外面叫不到；_bXP2AddChangeCoin 是「輔助點擊」專用版（語音規則不同、還會重建輔助佇列）。
 *   走 drop 事件＝跟學生用手拖曳走同一條路，語音、音效、提示格、計分全部照原樣。
 *   B1／B2 的 drop 處理只是轉呼叫 addCoin／_b2AddCoin，為了各單元同一種做法，也走 drop。
 *
 * 相依：vendor/aruco/{cv.js,aruco.js,dictionaries/apriltag_16h5.js} → mt-markers.js
 *       → scan-pay.js → 本檔（順序不能反）
 */
(function () {
  'use strict';

  var BTN_ID = 'b-scan-pay-btn';
  var ROW_CLASS = 'b-scan-pay-row';
  var STYLE_ID = 'b-scan-pay-style';
  // 2026-09-27 使用者定：按鈕放在托盤那一框的「標題列」、靠左（B5／B6 找零＝「💰 找零面額」那列，
  // 付款＝「我的錢包」那列；靠右會被掃描視窗擋住）。擺法共用 ScanPay.placeLeft（標題左右各留按鈕寬，手機不會疊字）。
  // 托盤前面沒有標題的畫面才退回「自己一列、靠左」。
  // ⚠️ 原本是「自己一列、置中」：B6 找零時托盤上的「👇 點這裡」提示會浮到那一列、蓋住按鈕。
  var CSS = [
    '.' + ROW_CLASS + '{display:flex;justify-content:flex-start;margin:-4px 0 10px}',
    '#' + BTN_ID + '{display:inline-flex;align-items:center;gap:6px;',
    'padding:8px 14px;min-height:40px;border:none;border-radius:12px;cursor:pointer;touch-action:manipulation;',
    'background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;font-size:.9rem;font-weight:700;',
    'box-shadow:0 2px 8px rgba(37,99,235,.35)}',
    // ⚠️ 按下回饋只改亮度／陰影，不可位移（CLAUDE.md「可點元素按下會位移」）；
    //    ai-theme.css 的全域 button:active{transform:scale(.95)!important} 要蓋回 none。
    '#' + BTN_ID + ':active{transform:none!important;',
    'filter:brightness(.88);box-shadow:0 1px 4px rgba(37,99,235,.45)}'
  ].join('');

  /** B 系列在檔案最上層寫 `let Game;`，不會掛在 window 上，只能用裸名字讀 */
  function G() {
    try { return (typeof Game !== 'undefined') ? Game : null; } catch (e) { return null; }
  }

  function log() {
    var g = G();
    if (g && g.Debug && typeof g.Debug.log === 'function') {
      g.Debug.log.apply(g.Debug, ['scan'].concat([].slice.call(arguments)));
    }
  }

  function playError() {
    var g = G();
    if (g && g.audio && typeof g.audio.play === 'function') {
      try { g.audio.play('error'); } catch (e) { /* 音效失敗不擋流程 */ }
    }
  }

  function flash(msg) { if (window.ScanPay) window.ScanPay.flash(msg); }

  // 派送一個跟真的拖曳一樣的 drop 事件——唯一定義在 scan-pay.js 的 ScanPay.fireDrop（A3／A4／A6 掃描找零也用它）
  function fireDrop(target, data) { window.ScanPay.fireDrop(target, data); }

  // 簡單模式（或按過提示後）有提示格時，不需要的面額會被單元拒收；
  // 掃描這邊先檢查，為的是給看得懂的訊息——拖曳時學生看得到提示格，掃描視窗裡看不到。
  function hintSlotsFull(slots, value) {
    if (!slots || !slots.length) return false;
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].denom === value && !slots[i].filled) return false;
    }
    return true;
  }

  /** B5/B6 付款托盤上還沒用掉的卡（托盤＝這一關給的錢，數量有限） */
  function unusedTrayCards(p, value) {
    var sel = '.' + p + 'p2-coin-drag' + (value != null ? '[data-denom="' + value + '"]' : '');
    return [].slice.call(document.querySelectorAll(sel)).filter(function (el) {
      return el.dataset.inUse !== 'true';
    });
  }

  /**
   * B1／B2：drop 資料就是面額數字、托盤不限數量、提示格在 state.quiz.hintSlots。
   * cardSel＝托盤卡片的 class（用來判斷這一題的托盤有沒有這個面額）
   */
  function putPlainDenom(st, value, cardSel, unit) {
    var q = G().state.quiz || {};
    if (!document.querySelector(cardSel + '[data-denom="' + value + '"]')) {
      flash('這一題用不到 ' + value + ' 元');
      playError();
      return;
    }
    if (q.showHint && hintSlotsFull(q.hintSlots, value)) {
      flash(value + ' 元不用再放了');
      playError();
      return;
    }
    fireDrop(st.zone, String(value));
    log('掃描放錢（' + unit + '）→', value);
  }

  // ── 各單元的畫面 ─────────────────────────────────────────────────────
  // detect() 找得到就回傳 { zone（放錢區）, tray（按鈕插在它前面）, p（前綴，可無）}，否則 null。
  // put(st, value) 處理一張掃到的卡。remain(st) 給掃描浮層的「還可以付」（不限數量的托盤不給）。
  // 以 DOM 判斷畫面（各單元的狀態欄位名稱不一，畫面才是學生眼前的真相）。
  var STAGES = [
    {
      id: 'b1-prepare', label: '📷 掃描放錢', title: '掃描放錢',
      detect: function () {
        var zone = document.getElementById('wallet-coins');
        var tray = document.getElementById('coin-tray');
        // #wallet-coins／#coin-tray 名稱太通用，一定要同時看到 B1 自己的托盤 class
        if (!zone || !tray || !tray.closest('.b1-coin-tray')) return null;
        return { zone: zone, tray: tray };
      },
      put: function (st, value) { putPlainDenom(st, value, '.b1-coin-draggable', 'B1'); }
    },
    {
      id: 'b2-remain', label: '📷 掃描放錢', title: '掃描放錢',
      detect: function () {
        var zone = document.getElementById('b2-wallet-coins');
        var tray = document.getElementById('b2-coin-tray');
        return zone && tray ? { zone: zone, tray: tray } : null;
      },
      // B2 與 B1 同一套（B2 的註解寫「B1 pattern」）：面額數字、提示格在 state.quiz
      put: function (st, value) { putPlainDenom(st, value, '.b2-coin-draggable', 'B2'); }
    },
    {
      // B3 簡單：當天的錢已拆好（例：35 元＝10、10、10、5），每枚要放進同面額的格子。
      // 掃到一張＝挑一枚還沒放的同面額錢、放進第一個同面額空格——學生不必決定放哪一格，
      // 那是拖曳才需要的手部動作；要練的是「拿出對的錢」。
      id: 'b3-easy', label: '📷 掃描存錢', title: '掃描存錢',
      detect: function () {
        var c = G() && G().state && G().state.calendar;
        var box = document.getElementById('b3-pig-drop-zone');
        var tray = document.getElementById('b3-daily-items');
        if (!c || !c.drag || c.drag.mode || !box || box.style.display === 'none' || !tray) return null;
        if (!document.querySelector('.b3-drop-slot')) return null;
        return { zone: box, tray: tray };
      },
      put: function (st, value) {
        var coin = document.querySelector('.b3-drag-coin:not(.b3-coin-placed)[data-denom="' + value + '"]');
        var slot = document.querySelector('.b3-drop-slot:not(.b3-slot-filled)[data-denom="' + value + '"]');
        if (!coin || !slot) {
          flash(document.querySelector('.b3-drag-coin[data-denom="' + value + '"]')
            ? '今天的 ' + value + ' 元已經放好了'
            : '今天不用存 ' + value + ' 元');
          playError();
          return;
        }
        fireDrop(slot, JSON.stringify({ denom: value, slotIdx: parseInt(coin.dataset.slotIdx, 10) }));
        log('掃描存錢（B3 簡單）→', value);
      }
    },
    {
      id: 'b3-free', label: '📷 掃描存錢', title: '掃描存錢',
      detect: function () {
        var c = G() && G().state && G().state.calendar;
        var zone = document.getElementById('b3-normal-placed-area');
        var tray = document.getElementById('b3-daily-items');
        if (!c || !c.drag || c.drag.mode !== 'normal' || !zone || !tray) return null;
        return { zone: zone, tray: tray };
      },
      put: function (st, value) {
        var drag = G().state.calendar.drag || {};
        if (!document.querySelector('.b3-ndrag-denom[data-denom="' + value + '"]')) {
          flash('今天用不到 ' + value + ' 元');
          playError();
          return;
        }
        if (drag.showHint && hintSlotsFull(drag.hintSlots, value)) {
          flash(value + ' 元不用再放了');
          playError();
          return;
        }
        // ⚠️ 放錢區每放一枚就整塊重繪（_updateNormalDropZone），每次都要重新抓 #b3-normal-placed-area
        var zone = document.getElementById('b3-normal-placed-area');
        if (zone) fireDrop(zone, JSON.stringify({ denom: value }));
        log('掃描存錢（B3）→', value);
      }
    },
    {
      id: 'b56-pay', label: '📷 掃描付款', title: '掃描付款',
      detect: function () {
        var ps = ['b5', 'b6'];
        for (var i = 0; i < ps.length; i++) {
          var zone = document.getElementById(ps[i] + 'p2-wallet-coins');
          var tray = document.getElementById(ps[i] + 'p2-tray-coins');
          if (zone && tray) return { zone: zone, tray: tray, p: ps[i] };
        }
        return null;
      },
      put: function (st, value) {
        var gs = G().state.game || {};
        if (gs.p2ShowHint && hintSlotsFull(gs.p2HintSlots, value)) {
          flash(value + ' 元不用再放了');
          playError();
          log('提示格沒有空位：', value);
          return;
        }
        if (!document.querySelector('.' + st.p + 'p2-coin-drag[data-denom="' + value + '"]')) {
          flash('錢包裡沒有 ' + value + ' 元');
          playError();
          return;
        }
        var card = unusedTrayCards(st.p, value)[0];
        if (!card) {
          flash('錢包裡的 ' + value + ' 元用完了');
          playError();
          return;
        }
        fireDrop(st.zone, 'tray:' + card.dataset.trayUid + ':' + value + ':' + (card.dataset.face || 'front'));
        log('掃描付款 →', value, card.dataset.trayUid);
      },
      remain: function (st) {
        var counts = {};
        unusedTrayCards(st.p).forEach(function (el) {
          var v = parseInt(el.dataset.denom, 10);
          counts[v] = (counts[v] || 0) + 1;
        });
        return Object.keys(counts).map(function (v) {
          return { value: parseInt(v, 10), count: counts[v] };
        }).sort(function (a, b) { return b.value - a.value; });
      }
    },
    {
      id: 'b56-change', label: '📷 掃描找零', title: '掃描找零',
      detect: function () {
        var ps = ['b5', 'b6'];
        for (var i = 0; i < ps.length; i++) {
          var zone = document.getElementById(ps[i] + 'c-wallet-zone');
          var tray = document.getElementById(ps[i] + 'c-tray-coins');
          if (zone && tray) return { zone: zone, tray: tray, p: ps[i] };
        }
        return null;
      },
      put: function (st, value) {
        var gs = G().state.game || {};
        if (!document.querySelector('.' + st.p + 'c-denom-card[data-denom="' + value + '"]')) {
          flash('這次找零用不到 ' + value + ' 元');
          playError();
          return;
        }
        if (gs.changeGhostMode && hintSlotsFull(gs.changeHintSlots, value)) {
          flash(value + ' 元不用再放了');
          playError();
          return;
        }
        fireDrop(st.zone, 'chdenom:' + value);
        log('掃描找零 →', value);
      }
    }
  ];

  /** 目前在哪個畫面：{ def, zone, tray, p } 或 null */
  function currentStage() {
    for (var i = 0; i < STAGES.length; i++) {
      var st = STAGES[i].detect();
      if (st) { st.def = STAGES[i]; return st; }
    }
    return null;
  }

  function getRemain() {
    var st = currentStage();
    return st && st.def.remain ? st.def.remain(st) : [];
  }

  function onMoney(info) {
    var g = G();
    if (!g || !g.state) { flash('遊戲還沒載入完成'); return; }
    var st = currentStage();
    if (!st) { flash('現在不是放錢的畫面'); return; }
    st.def.put(st, info.value);
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
    var st = currentStage();
    window.ScanPay.open({
      title: st ? st.def.title : '掃描付款',
      onMoney: onMoney,
      getRemain: getRemain,
      onClose: function () { log('掃描結束'); }
    });
  }

  function ensureButton() {
    var st = currentStage();
    var old = document.getElementById(BTN_ID);
    if (old) {
      // B3 存完一天不會重繪整頁，按鈕會留在畫面上 → 不在放錢狀態、或換了一種畫面就收掉重來
      if (st && old.dataset.stage === st.def.id) return;
      var oldRow = old.closest('.' + ROW_CLASS);
      if (oldRow) oldRow.parentNode.removeChild(oldRow);
      else {
        // 放在標題裡的：拿掉按鈕、把標題的內距還原（標題本身是單元的，不能跟著刪）
        var host = old.parentNode;
        host.removeChild(old);
        if (window.ScanPay && window.ScanPay.unplaceLeft) window.ScanPay.unplaceLeft(host);
      }
    }
    if (!st || !st.tray.parentNode) return;
    // 鏡頭不可用／老師沒開／輔助點擊開著 → 不放按鈕（按了才說失敗是更差的體驗）
    if (!window.ScanPay || !window.ScanPay.isSupported()) return;

    injectStyle();
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.textContent = st.def.label;
    btn.dataset.stage = st.def.id;
    btn.addEventListener('click', openScanner);
    // 托盤正上方那一行就是這一框的標題（b1-tray-title／b2-tray-title／b5p2-tray-title／b6p2-tray-title）
    var title = st.tray.previousElementSibling;
    // B3：托盤上面那行說明字（b3-daily-subtitle）放錢時是藏起來的 → 走下面的「自己一列」，
    //     落在「今日可存金錢」下方、金額（30 元）上方（2026-09-27 使用者指定這個位置）
    if (title && title.offsetParent && /title/.test(title.className) && !title.querySelector('button')) {
      window.ScanPay.placeLeft(title, btn);
    } else {
      var row = document.createElement('div');
      row.className = ROW_CLASS;
      row.appendChild(btn);
      st.tray.parentNode.insertBefore(row, st.tray);
    }
    log('已插入掃描按鈕（' + st.def.id + '）');
  }

  function boot() {
    // 通用層用來判斷「輔助點擊」是否開著（兩者互斥）。
    // ⚠️ B 系列的 clickMode 是字串 'on'/'off'，'off' 也是 truthy → 要轉成布林再交出去。
    if (window.ScanPay && window.ScanPay.setUnitSettings) {
      window.ScanPay.setUnitSettings(function () {
        var g = G();
        var s = g && g.state && g.state.settings;
        return s ? { clickMode: s.clickMode === 'on', difficulty: s.difficulty } : null;
      });
    }
    // 放錢畫面都是整段重繪 #app，按鈕會被沖掉 → 用 observer 補回來
    var host = document.getElementById('app') || document.body;
    var mo = new MutationObserver(function () { ensureButton(); });
    mo.observe(host, { childList: true, subtree: true });
    ensureButton();
    log('B 系列掃描付款外掛已啟動');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
