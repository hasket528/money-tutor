/**
 * ScanPay — 掃描付款的通用模組（不綁任何單元）
 *
 * 用鏡頭讀教具卡上的 AprilTag 標記（面額 ↔ 標記 ID 對應見 mt-markers.js），
 * 解到一張就回呼一次。同面額的卡共用同一個標記，因此去重不能靠內容，
 * 改用「離場偵測」：計入後必須讓畫面完全沒有標記達 CLEAR_MS，才會接受下一張。
 * 對應的操作節奏＝放一張 → 嗶 → 拿走 → 放下一張。
 *
 * 設計依據與參數推導見 doc/開發計畫/開發計畫_掃描付款_QR教具卡.md（三之二、三之三、三之四）。
 *
 * 用法：
 *   ScanPay.isSupported()                  // 非安全來源／無鏡頭／缺 AR 或 MTMarkers → false
 *   ScanPay.open({
 *     title:     '掃描付款',
 *     onMoney:   ({ value }) => {},        // 解到一張（已去重）
 *     getRemain: () => [{ value, count }], // 可選：畫面顯示「還可以付」
 *     onClose:   () => {}
 *   });
 *   ScanPay.close();
 *
 * 換頁自動關閉（2026-10-07 使用者定）：開著掃描視窗進到下一個畫面，視窗自己關掉（watchPage）。
 *   判斷「換頁了」＝①當初按的那顆掃描鈕（同 id、同文字）從畫面上消失超過 0.8 秒，或 ②標題列的「第 N 題／關」變了。
 *   ①容許短暫消失：單元重畫同一個畫面（投一枚、答錯重來）時按鈕會被拿掉又馬上由 MutationObserver 補回來。
 *   按鈕取自 opts.anchor，沒給就用觸發這次 open 的 click 事件的 currentTarget（各單元都在按鈕的 click 裡呼叫）。
 *
 * 相依（呼叫端負責在此檔之前依序載入）：
 *   vendor/aruco/cv.js → vendor/aruco/aruco.js → vendor/aruco/dictionaries/apriltag_16h5.js → mt-markers.js
 * 2026-09-05：解碼器由 jsQR 換成 AprilTag（`marker-scan.html` 的 `detectTag()` 搬過來的），
 * 對外介面（onMoney 回呼的 { value }）沒有變，呼叫端（scan-pay-a4.js 等）不必跟著改。
 */
(function (global) {
  'use strict';

  // ── 參數 ────────────────────────────────────────────────────────────
  var WANT_WIDTH = 1280;   // 預設抽幀寬度；QR 時代測出來的下限，AprilTag 標記變小後可能不必這麼高
  var FPS        = 8;      // 省電靠降 fps，解析度不能降
  var CLEAR_MS   = 800;    // 離場偵測門檻

  // 2026-09-05：解析度改成可調——不同裝置鏡頭與操作距離不同，
  // 沒有一個數字對所有機器都是最佳值，開放老師依現場情況調整。
  var CAM_WIDTHS   = [640, 960, 1280];
  var CAMW_LSKEY   = 'mt_scanpay_camw';

  function getSavedCamWidth() {
    try {
      var v = parseInt(global.localStorage.getItem(CAMW_LSKEY), 10);
      return CAM_WIDTHS.indexOf(v) !== -1 ? v : WANT_WIDTH;
    } catch (e) { return WANT_WIDTH; }
  }

  function saveCamWidth(w) {
    try { global.localStorage.setItem(CAMW_LSKEY, String(w)); } catch (e) { /* 私密模式等，忽略 */ }
  }

  var detector = null;     // AR.Detector，延遲建立（MTMarkers/AR 要等載入才存在）
  function getDetector() {
    if (!detector) {
      detector = new global.AR.Detector({ dictionaryName: global.MTMarkers.DICT, maxHammingDistance: global.MTMarkers.TAU });
    }
    return detector;
  }

  var STYLE_ID = 'scanpay-style';
  var CSS = [
    // 2026-09-05：從「全螢幕遮罩」改成「懸浮小視窗」——底下的遊戲畫面刻意露出來，
    // 學生對鏡頭的同時還看得到題目／錢包，不必在「看畫面」跟「對鏡頭」之間切換。
    '.scanpay-mask{position:fixed;right:16px;bottom:16px;z-index:99999;',
    'width:320px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);',
    'background:#0b1220;color:#e2e8f0;border-radius:16px;overflow:hidden;',
    'box-shadow:0 8px 30px rgba(0,0,0,.45);',
    'display:flex;flex-direction:column;font-family:"Microsoft JhengHei","PingFang TC",system-ui,sans-serif}',
    '.scanpay-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;',
    'background:#1e293b;border-bottom:1px solid #334155;flex:0 0 auto}',
    // ⚠️ 顏色要寫死：這個浮層會掛在各單元頁面上，宿主的 h2／p 樣式會蓋掉繼承來的顏色
    //    （A4 就把標題染成深色，在深色列上幾乎看不見）
    '.scanpay-bar h2{margin:0;font-size:.95rem;color:#e2e8f0;font-weight:700;white-space:nowrap}',
    '.scanpay-camsel{min-height:32px;border:1px solid #475569;border-radius:8px;background:#0f172a;',
    'color:#e2e8f0;font-size:.8rem;padding:2px 4px}',
    '.scanpay-x{min-width:36px;min-height:36px;border:none;border-radius:10px;background:#334155;',
    'color:#e2e8f0;font-size:1.1rem;font-weight:700;cursor:pointer;line-height:1;flex:0 0 auto}',
    '.scanpay-body{flex:1 1 auto;display:flex;flex-direction:column;min-height:0}',
    '.scanpay-stage{position:relative;height:200px;flex:0 0 auto;background:#000;overflow:hidden}',
    '.scanpay-stage video{width:100%;height:100%;object-fit:cover;display:block}',
    // 小視窗裡不再用「9999px 陰影」蓋住整個背景——那是全螢幕遮罩時代用來壓暗頁面的把戲，
    // 現在背景要露出來，取景框只留邊框本身
    '.scanpay-frame{position:absolute;inset:12% 16%;border:3px solid rgba(56,189,248,.9);border-radius:10px;',
    'transition:border-color .15s}',
    '.scanpay-frame.hit{border-color:#22c55e}',
    '.scanpay-state{flex:0 0 auto;padding:6px 10px;text-align:center;font-weight:700;font-size:.85rem;background:#0f172a}',
    '.scanpay-state.ready{color:#22c55e}.scanpay-state.wait{color:#f59e0b}',
    '.scanpay-info{flex:0 0 auto;display:flex;gap:8px;padding:8px 10px;background:#1e293b;',
    'border-top:1px solid #334155;font-size:.8rem;flex-wrap:wrap}',
    '.scanpay-info>div{flex:1 1 46%;min-width:0}',
    '.scanpay-info b{display:block;color:#94a3b8;font-weight:600;font-size:.72rem;margin-bottom:2px}',
    '.scanpay-info span{color:#e2e8f0}',
    '.scanpay-err{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);max-width:88%;',
    'background:rgba(127,29,29,.95);color:#fecaca;border-radius:10px;padding:8px 12px;font-size:.82rem;',
    'text-align:center;line-height:1.4}',
    '.scanpay-fatal{padding:16px;line-height:1.7;font-size:.85rem;color:#e2e8f0;overflow-y:auto;max-height:60vh}',
    '.scanpay-fatal strong{color:#fca5a5}',
    '.scanpay-fatal code{background:#1e293b;padding:2px 6px;border-radius:4px}'
  ].join('');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ── 狀態 ────────────────────────────────────────────────────────────
  var session = null;

  // ── 上線開關（2026-09-05）──────────────────────────────────────────
  // 掃描付款要先有標記教具卡才有意義（老師得先印），所以入口**預設不對學生顯示**。
  // 開啟：單元網址加 `?scanpay=1`（會記在這台裝置，之後直接進單元也看得到）；
  //       `?scanpay=0` 關掉。教具卡列印頁在 worksheet/money-cards.html。
  // ⚠️ 旗標檢查放在 isSupported() 裡面，六支單元接線層才能一個字都不用改——
  //    它們本來就有「不支援就不放按鈕」那道守門。
  var EN_LSKEY = 'mt_scanpay_enabled';

  // ⚠️ 網址參數是「一次性的設定動作」，用完要從網址拿掉（2026-09-06）：
  //    留著的話每次呼叫 isEnabled() 都會把 localStorage 覆寫回參數值，
  //    setEnabled() 寫什麼都會被蓋掉 → 互斥關不掉掃描付款，設定頁的開關也按不動。
  function stripQuery() {
    try {
      if (!global.history || !global.history.replaceState) return;
      var u = new URL(global.location.href);
      if (!u.searchParams.has('scanpay')) return;
      u.searchParams.delete('scanpay');
      global.history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
    } catch (e) { /* 舊瀏覽器／file:// 忽略 */ }
  }

  function isEnabled() {
    try {
      var q = new URLSearchParams(global.location.search).get('scanpay');
      if (q === '1' || q === '0') {
        global.localStorage.setItem(EN_LSKEY, q);
        stripQuery();
        return q === '1';
      }
      return global.localStorage.getItem(EN_LSKEY) === '1';
    } catch (e) { return false; }
  }

  // 設定頁的開關用（js/scan-pay/settings-tools.js）
  function setEnabled(on) {
    try { global.localStorage.setItem(EN_LSKEY, on ? '1' : '0'); } catch (e) {}
  }

  // ── 與「輔助點擊模式」互斥（2026-09-06）────────────────────────────
  // 輔助點擊＝學生只要點任何一下，系統就自動依序完成選商品／付款／找零；
  // 掃描付款＝學生自己拿卡片決定付哪一張。兩個同時開，等於學生舉起卡片的同時
  // 系統已經自己把錢付掉了，卡片變成沒有意義。輔助點擊優先（它服務的是手部控制
  // 更困難的學生），掃描付款自動退讓。
  //
  // ⚠️ 通用層不能直接讀單元的 state（六個單元的全域物件名各不相同），
  //    改由各單元外掛層在 boot 時把「怎麼拿到這個單元的 settings」註冊進來。
  var unitSettingsGetter = null;
  function setUnitSettings(fn) { unitSettingsGetter = fn; }

  function clickModeActive() {
    try {
      var st = unitSettingsGetter && unitSettingsGetter();
      // 輔助點擊只在簡單模式生效（設定頁的區塊本身就只在簡單模式顯示），
      // 所以難度不是 easy 時就算旗標留著 true 也不算數。
      return !!(st && st.clickMode && st.difficulty === 'easy');
    } catch (e) { return false; }
  }

  function isSupported() {
    return !!(isEnabled() &&
              !clickModeActive() &&
              global.isSecureContext &&
              navigator.mediaDevices && navigator.mediaDevices.getUserMedia &&
              global.AR && global.MTMarkers);
  }

  /** 說明「為什麼不支援」，用於在畫面上給可行動的訊息 */
  function unsupportedReason() {
    if (clickModeActive()) {
      return '這個單元開著「輔助點擊模式」，掃描付款不能同時使用——' +
             '輔助點擊會自動幫學生完成付款，卡片就沒有作用了。' +
             '要用掃描付款，請先到設定頁把輔助點擊模式停用。';
    }
    if (!global.isSecureContext) {
      return '這個頁面不是安全來源，瀏覽器不會給鏡頭權限。' +
             '請改用專案根目錄的「啟動本機伺服器.bat」開啟，' +
             '不要用 <code>file://</code>（也就是「用Edge開啟.bat」）。';
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return '這個瀏覽器不支援取用鏡頭。';
    }
    if (!global.AR || !global.MTMarkers) {
      return '找不到 <code>AR</code>／<code>MTMarkers</code>，請確認已依序載入 ' +
             '<code>vendor/aruco/cv.js</code>、<code>vendor/aruco/aruco.js</code>、' +
             '<code>vendor/aruco/dictionaries/apriltag_16h5.js</code>、<code>mt-markers.js</code>。';
    }
    return '';
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ── 換頁自動關閉 ──────────────────────────────────────────
  var PROGRESS_SEL = '.title-bar, .b-header, .mcdonalds-title-bar, .atm-title-bar, .progress-info, #progress-info, ' +
    '.b-progress, .quiz-progress-info';   // 同 js/money-label-hint.js
  var pageTimer = null;
  function questionKey() {
    var els = document.querySelectorAll(PROGRESS_SEL);
    for (var i = 0; i < els.length; i++) {
      var m = /第\s*(\d+)\s*(?:題|關|\/)/.exec(els[i].textContent || '');
      if (m) return m[0];
    }
    return '';
  }
  function visible(e) { return !!(e && e.isConnected && e.getClientRects().length); }
  function watchPage(anchor) {
    clearInterval(pageTimer);
    var id = anchor && anchor.id;
    var label = anchor && anchor.textContent;
    var q0 = questionKey();
    var miss = 0;
    pageTimer = setInterval(function () {
      if (!session) { clearInterval(pageTimer); return; }
      if (q0 && questionKey() && questionKey() !== q0) { close(); return; }
      if (!anchor) return;
      // 重畫後補回的同一顆：同 id 而且同文字——B／C 系列付款與找零共用一個 id，只差「掃描付款／掃描找零」
      if (!visible(anchor) && id) {
        var again = document.getElementById(id);
        if (again && again.textContent === label) anchor = again;
      }
      miss = visible(anchor) ? 0 : miss + 1;
      if (miss >= 2) close();
    }, 400);
  }
  function anchorOf(opts) {
    if (opts.anchor) return opts.anchor;
    var ev = global.event, t = ev && ev.currentTarget;
    return t && t.nodeType === 1 && t !== document.body ? t : null;
  }

  function open(opts) {
    opts = opts || {};
    if (session) close();
    injectStyle();
    var anchor = anchorOf(opts);

    var mask = el('div', 'scanpay-mask');
    var bar = el('div', 'scanpay-bar');
    var h2 = el('h2', null, opts.title || '掃描付款');
    var x = el('button', 'scanpay-x', '✕');
    x.setAttribute('aria-label', '關閉掃描');
    bar.appendChild(h2);
    bar.appendChild(x);
    mask.appendChild(bar);

    if (!isSupported()) {
      mask.appendChild(el('div', 'scanpay-fatal',
        '<strong>⚠️ 無法開啟掃描</strong><br><br>' + unsupportedReason()));
      document.body.appendChild(mask);
      x.addEventListener('click', close);
      session = { mask: mask, onClose: opts.onClose, fatal: true };
      watchPage(anchor);
      return;
    }

    // 解析度選單——插在標題與關閉鈕中間
    var camSel = document.createElement('select');
    camSel.className = 'scanpay-camsel';
    camSel.setAttribute('aria-label', '鏡頭解析度');
    var camWidth = getSavedCamWidth();
    CAM_WIDTHS.forEach(function (w) {
      var o = document.createElement('option');
      o.value = w;
      o.textContent = w + '×' + Math.round(w * 9 / 16);
      if (w === camWidth) o.selected = true;
      camSel.appendChild(o);
    });
    bar.insertBefore(camSel, x);

    var body = el('div', 'scanpay-body');
    var stage = el('div', 'scanpay-stage');
    var video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.muted = true;
    var frame = el('div', 'scanpay-frame');
    stage.appendChild(video);
    stage.appendChild(frame);

    var state = el('div', 'scanpay-state ready', '● 請把卡片放進框內');
    var info = el('div', 'scanpay-info');
    var gotBox = el('div', null, '<b>已掃</b><span>—</span>');
    var remainBox = el('div', null, '<b>還可以付</b><span>—</span>');
    info.appendChild(gotBox);
    info.appendChild(remainBox);

    body.appendChild(stage);
    body.appendChild(state);
    body.appendChild(info);
    mask.appendChild(body);
    document.body.appendChild(mask);

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d', { willReadFrequently: true });

    session = {
      mask: mask, video: video, frame: frame, state: state,
      gotBox: gotBox.querySelector('span'), remainBox: remainBox.querySelector('span'),
      stage: stage, canvas: canvas, ctx: ctx,
      stream: null, timer: null, running: false, camWidth: camWidth,
      phase: 'READY', lastSeenAt: 0, got: {},
      onMoney: opts.onMoney, getRemain: opts.getRemain, onClose: opts.onClose
    };

    camSel.addEventListener('change', function () {
      var w = parseInt(camSel.value, 10);
      saveCamWidth(w);
      restartCamera(w);
    });

    x.addEventListener('click', close);
    renderRemain();
    watchPage(anchor);
    start();
  }

  /** 切換解析度：停掉舊的鏡頭串流，用新的寬度重新要一次 */
  function restartCamera(w) {
    if (!session) return;
    session.camWidth = w;
    session.running = false;
    clearTimeout(session.timer);
    if (session.stream) { session.stream.getTracks().forEach(function (t) { t.stop(); }); session.stream = null; }
    session.video.srcObject = null;
    session.lastSeenAt = 0;
    setPhase('READY');
    start();
  }

  function setPhase(p) {
    if (!session) return;
    session.phase = p;
    if (p === 'READY') {
      session.state.className = 'scanpay-state ready';
      session.state.textContent = '● 請把卡片放進框內';
    } else {
      session.state.className = 'scanpay-state wait';
      session.state.textContent = '● 收到了 — 請把卡片移開';
    }
    session.frame.classList.toggle('hit', p === 'WAIT_CLEAR');
  }

  function renderGot() {
    var parts = [];
    Object.keys(session.got).sort(function (a, b) { return b - a; }).forEach(function (v) {
      parts.push(v + '元×' + session.got[v]);
    });
    session.gotBox.textContent = parts.length ? parts.join('、') : '—';
  }

  function renderRemain() {
    if (!session) return;
    if (typeof session.getRemain !== 'function') { session.remainBox.textContent = '—'; return; }
    var list;
    try { list = session.getRemain() || []; } catch (e) { list = []; }
    var parts = list.filter(function (r) { return r.count > 0; })
                    .map(function (r) { return r.value + '元×' + r.count; });
    session.remainBox.textContent = parts.length ? parts.join('、') : '（沒有了）';
  }

  var errTimer = null;
  /** 顯示一則短暫的錯誤訊息（掃到不能用的卡時給回饋，不是靜默失敗）*/
  function flash(msg) {
    if (!session) return;
    clearTimeout(errTimer);
    var box = session.stage.querySelector('.scanpay-err');
    if (!box) {
      box = el('div', 'scanpay-err');
      session.stage.appendChild(box);
    }
    box.textContent = msg;
    errTimer = setTimeout(function () {
      if (box && box.parentNode) box.parentNode.removeChild(box);
    }, 2600);
  }

  function tick() {
    if (!session || !session.running) return;
    var v = session.video;

    if (v.readyState < 2 || !v.videoWidth) {
      session.timer = setTimeout(tick, 1000 / FPS);
      return;
    }

    session.canvas.width = v.videoWidth;
    session.canvas.height = v.videoHeight;
    session.ctx.drawImage(v, 0, 0, session.canvas.width, session.canvas.height);
    var img = session.ctx.getImageData(0, 0, session.canvas.width, session.canvas.height);

    var found = getDetector().detect(img);   // [{ id, corners }]，可能同時偵測到多個
    var now = performance.now();

    if (found.length) {
      session.lastSeenAt = now;
      if (session.phase === 'READY') {
        for (var i = 0; i < found.length; i++) {
          var value = global.MTMarkers.valueOf(found[i].id);
          if (value === null) continue;   // 字典裡其他沒用到的碼，當沒看到，不打斷操作
          session.got[value] = (session.got[value] || 0) + 1;
          renderGot();
          setPhase('WAIT_CLEAR');
          if (typeof session.onMoney === 'function') {
            try { session.onMoney({ value: value }); } catch (e) { /* 呼叫端自理 */ }
          }
          renderRemain();
          break;
        }
      }
    } else if (session.phase === 'WAIT_CLEAR' && now - session.lastSeenAt >= CLEAR_MS) {
      setPhase('READY');
    }

    session.timer = setTimeout(tick, 1000 / FPS);
  }

  function start() {
    var camWidth = (session && session.camWidth) || WANT_WIDTH;
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: camWidth } },
      audio: false
    }).then(function (stream) {
      if (!session) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      session.stream = stream;
      session.video.srcObject = stream;
      return session.video.play();
    }).then(function () {
      if (!session) return;
      session.running = true;
      session.lastSeenAt = 0;
      setPhase('READY');
      tick();
    }).catch(function (e) {
      if (!session) return;
      var msg;
      if (e && e.name === 'NotAllowedError') {
        msg = '鏡頭權限被拒絕。請點網址列左邊的鎖頭圖示 → 「相機」→ 改成「允許」→ 重新整理。' +
              '（拒絕後瀏覽器不會再問第二次。）';
      } else if (e && (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError')) {
        msg = '找不到鏡頭裝置。';
      } else {
        msg = (e && e.name ? e.name + '：' : '') + (e && e.message ? e.message : '無法開啟鏡頭');
      }
      session.mask.innerHTML = '';
      var bar = el('div', 'scanpay-bar');
      var x = el('button', 'scanpay-x', '✕');
      bar.appendChild(el('h2', null, '掃描付款'));
      bar.appendChild(x);
      session.mask.appendChild(bar);
      session.mask.appendChild(el('div', 'scanpay-fatal',
        '<strong>⚠️ 無法開啟鏡頭</strong><br><br>' + msg));
      x.addEventListener('click', close);
    });
  }

  function close() {
    if (!session) return;
    var s = session;
    session = null;
    clearInterval(pageTimer);
    s.running = false;
    clearTimeout(s.timer);
    clearTimeout(errTimer);
    if (s.stream) s.stream.getTracks().forEach(function (t) { t.stop(); });
    if (s.video) s.video.srcObject = null;
    if (s.mask && s.mask.parentNode) s.mask.parentNode.removeChild(s.mask);
    if (typeof s.onClose === 'function') s.onClose();
  }

  // ── 掃描鈕擺在哪：所在框的標題列、靠左（全站單元都叫這一支）──
  // 2026-09-27 使用者定：先是「標題列靠右」，同日改「靠左」——掃描視窗開在右邊，按鈕在右邊會被擋住。
  // row＝標題列（或框的頂列）；btn＝掃描鈕。三種擺法：
  //   opts.start：標題本來就靠左的 flex 標題列（A5 有 ✕ 的彈窗、B3「今日可存金錢」）→ 直接排在最前面
  //   opts.rightGroup：標題列右側有絕對定位的群組（A4 普通／困難的提示鈕）→ 按鈕照樣貼左；
  //                    桌機右邊讓出群組寬，手機把群組連同按鈕變成標題列第一行（按鈕左、提示右）
  //   都沒有：按鈕絕對定位貼左，標題列左右各多留一個按鈕寬的內距——標題仍置中、窄螢幕也不會疊字
  //           （≤600px 只留左邊，標題往右讓一點，省下右邊的空白）。
  // ⚠️ 內距要「加在原本的內距上」：直接蓋掉的話，標題列原本的留白（彈窗標頭的 padding）就沒了。
  //    原值記在 data-sp-*，同一列重擺幾次都不會越加越多；unplaceLeft 還原。
  // ⚠️ 按下回饋只能改亮度／陰影：ai-theme.css 的全域 button:active{transform:scale(.95)!important}
  //    會把 translateY(-50%) 蓋掉、按鈕往下掉半個高度 → :active 要把定位值寫回去（CLAUDE.md 踩雷）。
  var LEFT_STYLE_ID = 'scanpay-left-style';
  function injectLeftStyle() {
    if (document.getElementById(LEFT_STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = LEFT_STYLE_ID;
    s.textContent =
      '.scanpay-left-row{position:relative!important;box-sizing:border-box!important}' +
      '.scanpay-left-abs{position:absolute!important;top:50%;margin:0!important;' +
      'transform:translateY(-50%)!important;z-index:2}' +
      '.scanpay-left-abs:active{transform:translateY(-50%)!important}' +
      '.scanpay-left-inline{margin-left:0!important;margin-right:10px!important;flex:none!important}' +
      '.scanpay-group-stack{position:static!important;transform:none!important;order:-1;' +
      'flex:0 0 100%!important;justify-content:space-between!important}' +
      '.scanpay-left-inline:active{transform:none!important}';
    document.head.appendChild(s);
  }
  function placeLeft(row, btn, opts) {
    opts = opts || {};
    injectLeftStyle();
    btn.classList.remove('scanpay-left-abs', 'scanpay-left-inline');
    btn.style.left = btn.style.top = '';
    if (opts.start) {
      row.insertBefore(btn, row.firstChild);
      btn.classList.add('scanpay-left-inline');
      return;
    }
    // 手機＋右側提示群組：群組改成標題列第一行，按鈕放進群組最前面（左）、提示留在右邊
    if (opts.rightGroup && window.innerWidth <= 600) {
      opts.rightGroup.insertBefore(btn, opts.rightGroup.firstChild);
      opts.rightGroup.classList.add('scanpay-group-stack');
      btn.classList.add('scanpay-left-inline');
      return;
    }
    row.insertBefore(btn, row.firstChild);
    row.classList.add('scanpay-left-row');
    btn.classList.add('scanpay-left-abs');
    // ⚠️ 各單元外掛自己有 `#<id>:active{transform:none!important}`（id 選擇器，壓過上面的 class 規則）
    //    → 按下去 translateY(-50%) 被拿掉，按鈕往下掉半個高度（2026-09-27 使用者回報「點擊瞬間下移」）。
    //    用「id＋class」再寫一條，優先權才蓋得過它。
    if (btn.id && !document.getElementById('scanpay-left-active-' + btn.id)) {
      var st = document.createElement('style');
      st.id = 'scanpay-left-active-' + btn.id;
      st.textContent = '#' + btn.id + '.scanpay-left-abs,#' + btn.id + '.scanpay-left-abs:active' +
        '{transform:translateY(-50%)!important}';
      document.head.appendChild(st);
    }
    if (row.dataset.spPl === undefined) {
      var cs = getComputedStyle(row);
      row.dataset.spPl = row.style.paddingLeft;
      row.dataset.spPr = row.style.paddingRight;
      row.dataset.spPlPx = parseFloat(cs.paddingLeft) || 0;
      row.dataset.spPrPx = parseFloat(cs.paddingRight) || 0;
      row.dataset.spMinH = row.style.minHeight;
      row.dataset.spDisp = row.style.cssText.match(/display\s*:/) ? row.style.display : '';
      // 一般區塊的標題（B5「💰 找零面額」）撐高後文字會貼在上緣、跟按鈕對不齊 → 改成 flex 垂直置中；
      // 原本就是 flex 的（B6、A1、A4）不動。圖示＋文字在 flex 裡會吃掉中間的空白，用 column-gap 補。
      // ⚠️ 裡面是 h3 這類區塊元素時不能改：它的置中靠自己的 text-align，一進 flex 就縮成字寬、跑到左邊（A2 踩到）
      var blockChild = [].some.call(row.children, function (c) {
        return c !== btn && getComputedStyle(c).display === 'block';
      });
      if (cs.display === 'block' && !blockChild) {
        row.dataset.spFlex = '1';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = /left|start/.test(cs.textAlign) ? 'flex-start' : 'center';
        row.style.flexWrap = 'wrap';
        row.style.columnGap = '6px';
      }
    }
    var pl = +row.dataset.spPlPx, pr = +row.dataset.spPrPx;
    var cs2 = getComputedStyle(row);
    // opts.inset：標題列自己沒有內距、卻貼著彈窗圓角（A2 投錢彈窗）→ 按鈕離邊緣留這麼多，上下也各留一點
    var inset = opts.inset || 0;
    var edge = pl > 0 ? pl : inset;
    btn.style.left = edge + 'px';
    var pad = (btn.offsetWidth || 120) + 10;
    row.style.paddingLeft = (edge + pad) + 'px';
    // 右邊也讓一個按鈕寬＝標題維持置中；標題本來就靠左的右邊不動。右側有提示群組時至少讓出群組寬
    var first = null;
    for (var c = row.firstElementChild; c; c = c.nextElementSibling) { if (c !== btn) { first = c; break; } }
    var centered = cs2.textAlign === 'center' || /center/.test(cs2.justifyContent) ||
      !!(first && getComputedStyle(first).textAlign === 'center');
    var rightPad = (window.innerWidth <= 600 || !centered) ? 0 : pad;
    if (opts.rightGroup) rightPad = Math.max(rightPad, opts.rightGroup.offsetWidth + 20);
    row.style.paddingRight = (pr + rightPad) + 'px';
    // 標題字比按鈕矮時（B1 標題 13px），列高要撐到按鈕的高度，否則按鈕上下凸出去壓到下一列
    row.style.minHeight = ((btn.offsetHeight || 40) + (inset ? inset * 2 : 0)) + 'px';
    // 手機上標題列折成好幾行（A4 簡單模式：標題／價格／已付各一行）→ 按鈕對齊第一行＝標題那一行，
    // 不要垂直置中到中間那行的徽章旁邊
    if (first && row.offsetHeight > (btn.offsetHeight || 40) * 1.6) {
      btn.style.top = Math.max(first.offsetTop + first.offsetHeight / 2, (btn.offsetHeight || 40) / 2) + 'px';
    }
  }
  function unplaceLeft(row) {
    if (!row || row.dataset.spPl === undefined) return;
    row.style.paddingLeft = row.dataset.spPl;
    row.style.paddingRight = row.dataset.spPr;
    row.style.minHeight = row.dataset.spMinH;
    if (row.dataset.spFlex) {
      ['alignItems', 'justifyContent', 'flexWrap', 'columnGap'].forEach(function (k) { row.style[k] = ''; });
      row.style.display = row.dataset.spDisp;
    }
    ['spPl', 'spPr', 'spPlPx', 'spPrPx', 'spMinH', 'spDisp', 'spFlex'].forEach(function (k) { delete row.dataset[k]; });
    row.classList.remove('scanpay-left-row');
  }

  /**
   * 派送一個跟真的拖曳一樣的 drop 事件（掃到一張卡＝學生用手拖一張，走同一條路：語音、音效、提示格、計分照原樣）。
   * 優先用真的 DataTransfer；舊版 Safari 的 DragEvent 建構子會忽略 dataTransfer，
   * 那時退回一般 Event ＋ 自己掛一個只有 getData 的 dataTransfer（各單元的 drop 處理只用到它）。
   */
  function fireDrop(target, data) {
    var ev = null;
    try {
      var dt = new DataTransfer();
      dt.setData('text/plain', data);
      ev = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
      if (!ev.dataTransfer || ev.dataTransfer.getData('text/plain') !== data) ev = null;
    } catch (e) { ev = null; }
    if (!ev) {
      ev = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'dataTransfer', {
        value: { getData: function () { return data; }, types: ['text/plain'] }
      });
    }
    target.dispatchEvent(ev);
  }

  /**
   * A3／A4／A6 的「找零」拖曳畫面（普通＋困難，B6 式：面額托盤可重複拖、放進 #<P>-wallet-zone）加「📷 掃描找零」。
   * 三個單元這個畫面的結構一模一樣、只差前綴（a3c／a4c／a6c），所以寫在這裡一份，各單元外掛呼叫一次（2026-09-27）。
   *   o.prefix   'a3c'|'a4c'|'a6c'
   *   o.btnId    按鈕 id（要跟付款那顆不同，兩個畫面不會同時出現）
   *   o.state    () => 單元的 gameState（讀提示格 <P>GhostMode／<P>HintSlots）
   *   o.error    () => 播單元自己的錯誤音效
   *   o.log      (...args) => 除錯紀錄（可無）
   * 按鈕放在「💰 找零面額」標題列、靠左（placeLeft；靠右會被掃描視窗擋住）。
   * 掃到一張：托盤沒有這個面額＝訊息；提示格模式下這個面額已經放滿＝訊息（掃描視窗裡看不到提示格，要講清楚）；
   *           其餘派送 drop `<P>denom:<面額>` 到錢包區＝跟手拖同一條路。
   */
  function attachChangeDrag(o) {
    var P = o.prefix;
    var log = o.log || function () {};
    function stage() {
      var zone = document.getElementById(P + '-wallet-zone');
      var tray = document.getElementById(P + '-tray-coins');
      return zone && tray ? { zone: zone, tray: tray } : null;
    }
    function onMoney(info) {
      var st = stage();
      if (!st) { global.ScanPay.flash('現在不是找零畫面'); return; }
      var v = info.value;
      if (!st.tray.querySelector('.' + P + '-denom-card[data-denom="' + v + '"]')) {
        global.ScanPay.flash('這次找零用不到 ' + v + ' 元'); o.error(); return;
      }
      var gs = (o.state && o.state()) || {};
      if (gs[P + 'GhostMode'] && !(gs[P + 'HintSlots'] || []).some(function (s) { return s.denom === v && !s.filled; })) {
        global.ScanPay.flash(v + ' 元不用再放了'); o.error(); return;
      }
      fireDrop(st.zone, P + 'denom:' + v);
      log('掃描找零 →', v);
    }
    function ensure() {
      var st = stage();
      if (!st || document.getElementById(o.btnId)) return;
      if (!isSupported()) return;
      var title = st.tray.previousElementSibling;
      if (!title) return;
      var btn = document.createElement('button');
      btn.id = o.btnId;
      btn.type = 'button';
      btn.className = 'scanpay-change-btn';
      btn.textContent = '📷 掃描找零';
      btn.addEventListener('click', function () {
        // 走 global.ScanPay.open（跟各單元外掛一樣），測試才換得掉鏡頭
        global.ScanPay.open({ title: '掃描找零', onMoney: onMoney, onClose: function () { log('掃描找零結束'); } });
      });
      injectChangeBtnStyle();
      placeLeft(title, btn);
      log('已插入掃描找零按鈕');
    }
    var host = document.getElementById('app') || document.body;
    new MutationObserver(ensure).observe(host, { childList: true, subtree: true });
    ensure();
  }
  /**
   * A3／A4／A6 簡單模式的「找零」畫面（店家那邊擺好要找的每一枚 → 拖到「我的錢包」對應的淡化格子）加「📷 掃描找零」。
   * 三個單元這個畫面的 DOM 與放下的處理各不相同，所以這裡只管共通的部分（插按鈕、開掃描、講錯誤訊息），
   * 「掃到一張之後怎麼放」由各單元外掛提供（2026-09-27）：
   *   o.btnId    按鈕 id
   *   o.stage    () => 標題元素（「店家找零」那一行）；不是這個畫面／不用找零＝null
   *   o.put      (面額) => null＝放好了；字串＝放不進去的原因（顯示在掃描視窗）
   *   o.error    () => 播單元自己的錯誤音效
   *   o.log      (...args)
   * 按鈕放在「店家找零」標題列、靠左（placeLeft）。
   */
  function attachEasyChange(o) {
    var log = o.log || function () {};
    function onMoney(info) {
      if (!o.stage()) { global.ScanPay.flash('現在不是找零畫面'); return; }
      var why = o.put(info.value);
      if (why) { global.ScanPay.flash(why); o.error(); return; }
      log('掃描找零（簡單）→', info.value);
    }
    function ensure() {
      var title = o.stage();
      if (!title || document.getElementById(o.btnId)) return;
      if (!isSupported()) return;
      var btn = document.createElement('button');
      btn.id = o.btnId;
      btn.type = 'button';
      btn.className = 'scanpay-change-btn';
      btn.textContent = '📷 掃描找零';
      btn.addEventListener('click', function () {
        global.ScanPay.open({ title: '掃描找零', onMoney: onMoney, onClose: function () { log('掃描找零結束'); } });
      });
      injectChangeBtnStyle();
      placeLeft(title, btn);
      log('已插入掃描找零按鈕（簡單模式）');
    }
    var host = document.getElementById('app') || document.body;
    new MutationObserver(ensure).observe(host, { childList: true, subtree: true });
    ensure();
  }

  // 外觀跟各單元的「掃描付款」同一套（藍色漸層）；按下回饋只改亮度，不可位移
  function injectChangeBtnStyle() {
    if (document.getElementById('scanpay-change-style')) return;
    var s = document.createElement('style');
    s.id = 'scanpay-change-style';
    s.textContent =
      '.scanpay-change-btn{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;' +
      'padding:8px 14px;min-height:40px;border:none;border-radius:12px;cursor:pointer;touch-action:manipulation;' +
      'background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;font-size:.9rem;font-weight:700;' +
      'box-shadow:0 2px 8px rgba(37,99,235,.35)}' +
      '.scanpay-change-btn:active{filter:brightness(.88);box-shadow:0 1px 4px rgba(37,99,235,.45)}';
    document.head.appendChild(s);
  }

  global.ScanPay = {
    fireDrop: fireDrop,
    attachChangeDrag: attachChangeDrag,
    attachEasyChange: attachEasyChange,
    placeLeft: placeLeft,
    unplaceLeft: unplaceLeft,
    isSupported: isSupported,
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    setUnitSettings: setUnitSettings,
    clickModeActive: clickModeActive,
    unsupportedReason: unsupportedReason,
    open: open,
    close: close,
    flash: flash,
    refreshRemain: renderRemain,
    isOpen: function () { return !!session; }
  };
})(window);
