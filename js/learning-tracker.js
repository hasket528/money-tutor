// ─── 學習紀錄追蹤器（主系統共用）────────────────────
// 與 dialogue/db.js 共用同一個 IndexedDB 資料庫
// 使用方式：
//   LearningTracker.save({ unit, unitName, series, score, total, difficulty, durationSec, assistFrom: this.state.settings });
//   紀錄另存設定快照 settings（短字串／數字／布林，見 settingsSnapshot）；沒有設定物件的頁面可直接傳 settings: {…}
//   assistFrom＝單元的設定物件，由 assistedFrom() 判斷這次有沒有開輔助點擊（判斷只寫在這裡，單元不要自己算）。
// 各單元在 showResults() / endGame() 完成時呼叫一次即可。

const LearningTracker = (() => {
  const DB_NAME    = 'shopping-practice';
  const STORE      = 'records';
  const INTERRUPTED = 'interrupted';   // 中斷摘要（規格第四節）
  let _db = null;

  // 評量核心 js/eval-core.js（每題最終狀態等純函式）：由這裡自動載入，32 個頁面不必各自掛 <script>。
  // 只有存檔／結算時才用得到，那時早就載好；萬一還沒好就等它（_core()）。
  const _coreReady = (typeof window === 'undefined' || window.EvalCore) ? Promise.resolve() : new Promise((resolve) => {
    try {
      const me = document.currentScript && document.currentScript.src;
      const s = document.createElement('script');
      s.src = me ? me.replace(/learning-tracker\.js(\?.*)?$/, 'eval-core.js') : 'js/eval-core.js';
      s.onload = s.onerror = () => resolve();
      (document.head || document.documentElement).appendChild(s);
    } catch (e) { resolve(); }
  });
  const _core = () => _coreReady.then(() => window.EvalCore);

  async function _open() {
    if (_db) return _db;
    return new Promise((resolve, reject) => {
      // 版本須與 dialogue/db.js 的 DB_VERSION 一致（目前 3），
      // 且 onupgradeneeded 建立相同的 stores——確保「哪個頁面先開」都能得到完整 schema。
      // 版本 3（2026-10-08）：新增 interrupted（中斷摘要，規格第四節）。另開資料表是為了讓只讀 records 的舊程式
      // （獎勵、成長系統、主頁）完全看不到中斷摘要，練習次數與獎勵不會被灌水。
      const req = indexedDB.open(DB_NAME, 3);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('ts',         'ts',         { unique: false });
          store.createIndex('scenarioId', 'scenarioId', { unique: false });
        }
        if (!db.objectStoreNames.contains('custom_audio')) {
          db.createObjectStore('custom_audio', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(INTERRUPTED)) {
          db.createObjectStore(INTERRUPTED, { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
      req.onerror   = ()  => reject(req.error);
    });
  }

  // ── 錯誤嘗試計數（反覆練習機制下，答錯不會反映在最終分數，需另行累計）──
  // 各單元在「答錯」分支呼叫 LearningTracker.logWrong()；save() 時一併寫入並歸零。
  let _wrongCount = 0;
  // 答錯一次：同時記一筆作答事件（2026-10-11）——有 setStep() 記到目前這一步，沒有就記到目前這一題（answer）。
  //   原本只累加次數，只呼叫 logWrong 的答錯點（C／F 拖錯、選錯）在逐題紀錄裡看不到，那一題被當成無錯答對。
  //   同一次答錯若單元也呼叫了 logStep(false)（前後都可以），只記一筆。
  function logWrong(n = 1) {
    _wrongCount += n;
    _syncQ();
    let qn, step, label;
    if (_cur) { qn = _curN(); step = _cur.step; label = _cur.label; }
    else { const k = questionKey(); qn = k ? parseInt(k.slice(1), 10) : null; step = 'answer'; label = `第${qn}題`; }
    if (qn == null || isNaN(qn)) return;
    for (let i = 0; i < n; i++) {
      const mate = _mateOf(qn, 'ls');   // 單元剛用 logStep(false) 記過的同一次答錯
      if (mate) { mate._m = 1; continue; }
      _push(qn, step, label, false, true);
    }
  }

  // ── 作答事件與暫存（2026-10-08 評量規格定稿 v1 第二、四節）──────────────────
  // 每作答一次記一筆 { n: 第幾題, step: 步驟代號, label: 給老師看的文字, ok, hint: 這次作答前出現過的提示來源, t }。
  // 統計一律用 n／step，不用 label。B／C／F 一題通常一步，不給代號＝'answer'；A 系列各單元在呼叫處寫代號。
  // 每作答一次就把這次練習寫進 localStorage 暫存（不靠 pagehide，手機不一定觸發）；
  // 正常存檔成功才刪暫存；中途離開的暫存在「確定放棄」時轉成中斷摘要（_finalizeDraft）。
  const DRAFT_PREFIX = 'mt_lt_draft_';
  const STALE_MS = 30 * 60 * 1000;   // 最後作答超過 30 分鐘＝放棄（使用者 2026-10-08 定）
  const OTHER_TAB_MS = 30 * 1000;    // 開始新練習時，30 秒內還在更新的暫存＝別的分頁正在用，不結算
  let _events = [];
  let _session = null;     // { sessionId, unit, settings, studentId, studentName, startTs }（第一次作答時建立）
  let _begin = null;       // resetWrong 傳進來的 { unit, settings }
  let _lastN = 0;
  const _unitFromPage = () => { try { const m = /\/([abcf][1-6])_[^/]*\.html/i.exec(location.pathname); return m ? m[1].toLowerCase() : null; } catch (e) { return null; } };
  const _student = () => { try { return JSON.parse(localStorage.getItem('sp_currentStudent') || 'null'); } catch (e) { return null; } };
  const _newSessionId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);   // 同時當 IndexedDB 紀錄 id（規格第二節）
  const _draftKey = (s) => `${DRAFT_PREFIX}${s.studentId ?? 'guest'}_${s.sessionId}`;

  function _writeDraft() {
    if (!_session) return;
    const s = _session;
    try {
      localStorage.setItem(_draftKey(s), JSON.stringify({
        v: 1, sessionId: s.sessionId, studentId: s.studentId, studentName: s.studentName, unit: s.unit,
        difficulty: s.settings?.difficulty || 'normal', assisted: assistedFrom(s.settings),
        startTs: s.startTs, lastTs: Date.now(), events: _events,
      }));
    } catch (e) {
      // 容量滿／隱私模式：這次練習只靠記憶體，正常完成時照常存檔；不擋學生、不跳訊息（規格第四節）
      try { console.warn('[LearningTracker] 暫存寫入失敗', e); } catch (_) {}
    }
  }

  // 逐題記錄：label＝給老師看的文字（例「任務：選擇 可樂」）、ok＝是否答對、step＝步驟代號（不給＝'answer'）。
  // 用法：各單元判題點呼叫 logStep(label, true/false[, 'pay'])；答錯分支仍另呼叫 logWrong()。
  function logStep(label, ok, step) {
    _syncQ();
    const k = questionKey();
    const n = parseInt(k.slice(1), 10) || _lastN || 1;   // 讀不到題號（理論上不會）沿用上一題
    step = step || (_cur && _curN() === n ? _cur.step : '') || 'answer';
    // 同一次答錯：logWrong 已經先記了一筆 → 換成這筆的文字，不另記
    const mate = !ok && _mateOf(n, 'lw');
    if (mate) { mate.label = String(label).slice(0, 60); mate.step = step; mate._m = 1; delete mate.auto; _writeDraft(); return; }
    _push(n, step, label, ok, false);
  }

  // ── 目前步驟（2026-10-11 使用者定：步驟分析要看到每一個操作步驟）──────────────────
  // 有好幾個步驟的單元在「進入某一步」時呼叫 setStep('pay')（代號見 js/eval-core.js STEP_NAMES）：
  //   ①這一步裡的 logWrong() 自動記成這一步答錯（各單元原本的答錯點不必逐一改）
  //   ②換到下一步、換題或存檔時，前一步自動記「完成」（這些單元答對才能往下走；已經用 logStep(true) 記過就不重複）
  //   ③提示只算在出現提示時的那一步（不然選商品時按的提示，會讓付款、找零都變成提示後完成）
  // 沒呼叫 setStep 的單元（C／F 單一步驟）完全照舊。
  let _cur = null;          // { n, step, label }
  // 同一次答錯常是 logStep(false)＋logWrong() 兩個呼叫（前後都有）：同一個同步流程（同一個 tick）裡、同一題，一筆配一筆
  let _tick = 0, _tickArmed = false;
  const _curTick = () => { if (!_tickArmed) { _tickArmed = true; Promise.resolve().then(() => { _tick++; _tickArmed = false; }); } return _tick; };
  function _mateOf(n, kind) {   // kind：'lw'＝找 logWrong 記的、'ls'＝找 logStep(false) 記的；都要還沒配對過
    const t = _curTick();
    for (let i = _events.length - 1; i >= 0; i--) {
      const e = _events[i];
      if (e._t !== t) break;
      if (e.n === n && !e.ok && !e._m && (kind === 'lw' ? e.auto : !e.auto && !e.syn)) return e;
    }
    return null;
  }
  const _hintSteps = new Map();   // 'Q3|pay' → { self, auto }
  const _hintPending = new Map();  // 'Q3' → { self, auto }：還沒宣告步驟時出現的提示
  // 題號換了（標題列已是下一題）但目前步驟還是上一題的 → 先結束上一題那一步
  function _syncQ() {
    if (!_cur || _cur.n == null) return;
    const k = questionKey();
    if (k && parseInt(k.slice(1), 10) !== _cur.n) _closeStep();
  }
  function _hintOf(k, step) {
    if (_stepMode && _hintPending.has(k)) {   // 還沒宣告步驟時出現的提示，給這一題第一個記到的步驟
      const po = _hintPending.get(k), sk = k + '|' + step, so = _hintSteps.get(sk) || { self: false, auto: false };
      _hintSteps.set(sk, { self: so.self || po.self, auto: so.auto || po.auto });
      _hintPending.delete(k);
    }
    const src = _cur || _stepMode ? _hintSteps.get(k + '|' + step) : _hintQs.get(k);
    return src ? [...(src.self ? ['self'] : []), ...(src.auto ? ['auto'] : [])] : [];
  }
  let _stepMode = false;    // 這次練習用過 setStep → 提示改成逐步驟算
  // 單次作答模式（答錯就換題）：C 系列 mode 'single'／'proceed'、F 系列 testMode 'single'——不可自動補「完成」
  const _single = () => { const st = (_begin && _begin.settings) || {}; return st.mode === 'single' || st.mode === 'proceed' || st.testMode === 'single'; };
  // 沒有 setStep 的單元：換到下一題時，上一題最後一筆是答錯（反複作答模式＝後來改對才換題）就補一筆完成
  let _closing = false;
  //   只補「這一題只有 logWrong 記的答錯」的題：單元自己用 logStep 記過這一題的，以單元記的為準（例：單次作答最後一筆是答錯）
  let _synth = false;
  function _closeImplicit(m) {
    if (_stepMode || _single() || !m) return;
    const mine = _events.filter(e => e.n === m), last = mine[mine.length - 1];
    if (!last || last.ok || mine.some(e => !e.auto)) return;
    _closing = true; _synth = true; _push(m, last.step, last.label, true, false); _synth = false; _closing = false;
  }
  function _push(n, step, label, ok, fromWrong) {
    if (!_closing && _lastN && n !== _lastN) _closeImplicit(_lastN);
    const k = 'Q' + n;
    _qLastOk[k] = !!ok;
    _lastN = n;
    const hint = _hintOf(k, step);
    if (!_session) {
      const st = _student();
      _session = { sessionId: _newSessionId(), unit: _begin?.unit || _unitFromPage(), settings: _begin?.settings || null,
        studentId: st?.id ?? null, studentName: st?.name ?? null, startTs: Date.now() };
    }
    _kindN();
    const kind = _kindByN[n];
    _events.push({ n, step, label: String(label).slice(0, 60), ok: !!ok, ...(hint.length ? { hint } : {}), ...(kind ? { kind } : {}),
      ...(fromWrong ? { auto: true } : {}), ...(_synth ? { syn: true } : {}), _t: _curTick(), t: Date.now() });
    _writeDraft();
  }
  // 結束目前這一步：這一題這一步最後一筆不是「對」就補一筆完成
  function _closeStep() {
    if (!_cur) return;
    const n = _curN(), { step, label } = _cur;
    _cur = null;
    if (n == null) return;
    const mine = _events.filter(e => e.n === n && e.step === step), last = mine[mine.length - 1];
    if (!last || (!last.ok && !_single())) { _synth = true; _push(n, step, label, true, false); _synth = false; }   // 單次作答：答錯就換題，不補完成
  }
  // ── 每題的題型（2026-10-11 使用者定：步驟分析依題型分大欄）──────────────────
  // 設定是「隨機」時每題的類型不同（F6 合成／分解／填空、A5 提款／存款…）→ 單元出題時呼叫 setKind('composition')，
  // 這一題的作答事件都帶 kind，eval-core 存進每題的 kind。題號同 setStep：畫面畫完才讀。
  let _kind = null;          // { kind, n }
  const _kindByN = {};
  function setKind(kind) {
    if (!kind) return;
    const cur = _kind = { kind: String(kind), n: null };
    setTimeout(() => { if (_kind === cur) _kindN(); }, 0);
  }
  function _kindN() {
    if (!_kind || _kind.n != null) return;
    const k = questionKey();
    if (!k) return;
    _kind.n = parseInt(k.slice(1), 10);
    _kindByN[_kind.n] = _kind.kind;
  }
  // 單元多半在畫面函式一開頭呼叫，這時標題列的「第幾題」可能還沒畫（或還是上一題）→ 題號等畫面畫完再讀（_curN）
  function setStep(step, label) {
    if (!step) return;
    if (_cur && _cur.step === step) return;   // 同一步重畫畫面
    _closeStep();
    _stepMode = true;
    const cur = _cur = { n: null, step, label };
    setTimeout(() => { if (_cur === cur) _curN(); }, 0);
  }
  // 目前這一步的題號（第一次用到時才從標題列讀）；讀不到＝不在作答畫面
  function _curN() {
    if (!_cur) return null;
    if (_cur.n == null) {
      const k = questionKey();
      if (!k) return null;
      _cur.n = parseInt(k.slice(1), 10);
      if (!_cur.label) _cur.label = `第${_cur.n}題：${STEP_LABEL[_cur.step] || _cur.step}`;
    }
    return _cur.n;
  }
  // 步驟代號的中文（只給事件文字用；統計一律看代號）。與 js/eval-core.js STEP_NAMES 同一份——載得到就用它
  const STEP_LABEL = new Proxy({}, { get: (o, k) => (typeof window !== 'undefined' && window.EvalCore && window.EvalCore.STEP_NAMES[k]) || k });

  // 單元開始一次新練習時呼叫（24 單元的開始處都有）：info＝{ unit: 'a1', settings: this.state.settings }
  // 這一頁上一次沒做完的練習＝放棄，立刻結算；同一位學生在別處留下、30 秒沒更新的暫存也一起結算（規格第四節）。
  function resetWrong(info) {
    if (_session && _events.length) _finalizeDraft(_draftKey(_session));
    _wrongCount = 0; _events = []; _session = null; _lastN = 0; _hintQs.clear(); _qLastOk = {};
    _cur = null; _stepMode = false; _hintSteps.clear(); _hintPending.clear(); _kind = null; Object.keys(_kindByN).forEach(k => delete _kindByN[k]);
    _begin = info || null;
    const st = _student();
    _sweepDrafts((d) => (d.studentId ?? null) === (st?.id ?? null) && Date.now() - (d.lastTs || 0) > OTHER_TAB_MS);
  }

  // ── 💡 提示後完成（2026-10-06 使用者定）────────────────────────────
  // 定義（唯一定義處，teacher.html／主頁／成長系統都讀存檔結果，不要自己再算）：
  //   ✅ 獨立答對＝這一題沒有用過提示、學生自己完成
  //   ❌ 錯誤作答＝每一次實際答錯（logWrong，照舊）
  //   💡 提示後完成＝這一題出現過提示、最後有完成 → 不算獨立答對；同一題幾次提示都只算 1 題；
  //      提示本身不算錯誤（之前實際答錯的照記）
  //      來源分兩種（正確率、精熟一樣處理，老師端分開顯示）：
  //        主動提示＝學生自己按提示；自動提示＝普通模式連錯 3 次系統自動跳出（各單元在自動提示處呼叫 logHint('auto')）
  //      同一題兩種都有＝算主動（學生先求助了）
  //   🌟 無錯通過＝沒有答錯、也沒有用過提示
  // 以「題」為單位：提示之後拖幾枚錢、點幾下都歸這一題。題號取標題列的「第 N 題／關」。
  // 單次作答模式（C／F）按了提示仍答錯的題＝錯誤作答，不算提示後完成（看那一題最後一次 logStep）。
  // 主動提示怎麼抓：下方全站點擊偵測，只認真人按下（isTrusted）——標題列小金探彈窗的 💡，或畫面上的提示鈕
  // （按鈕字含「提示」，或 class／id 帶 hint 且 title 含「提示」）。程式替學生 .click() 的不算主動
  // （C5 自動提示就是這樣按的，它另外呼叫 logHint('auto')）。重複記同一題沒關係。
  const _hintQs = new Map();   // 題號 → { self, auto }
  let _qLastOk = {};
  const PROGRESS_SEL = '.title-bar, .b-header, .mcdonalds-title-bar, .atm-title-bar, .kiosk-title-bar, .app-header, ' +
    '.progress-info, #progress-info, .b-progress, .quiz-progress-info';
  // 標題列的「第 N 題」「第 N / M 題」「第 N 關」；money-label-hint.js 也用這一個判斷換題
  function questionKey() {
    // 單元說「整次練習只算一題」（F4：標題列的「第 N / M 題」其實是關數）：先問單元，不看標題列
    if (_qSourceFirst) { try { const n = _qSource && _qSource(); if (n) return 'Q' + n; } catch (e) {} }
    const els = document.querySelectorAll(PROGRESS_SEL);
    for (const el of els) {
      const m = /第\s*(\d+)\s*(?:題|關|\/)/.exec(el.textContent || '');
      if (m) return 'Q' + m[1];
    }
    // 標題列沒寫題號的畫面（A5 ATM 標題列寫「步驟」、B3 月曆存錢整次＝1 題）：單元自己告訴我現在第幾題
    try { const n = _qSource && _qSource(); if (n) return 'Q' + n; } catch (e) {}
    return '';
  }
  // 單元登記「現在第幾題」：回傳數字＝在作答畫面；回傳 null／0＝不在（設定頁、結算頁）
  // { first: true }＝以單元回報的為準、不看標題列（標題列的題號不是「題」的時候用）
  let _qSource = null, _qSourceFirst = false;
  function setQuestionSource(fn, opts) { _qSource = fn; _qSourceFirst = !!(opts && opts.first); }
  // 這顆按鈕是不是「提示」鈕（學生求助）。title-heroes.js 的小金探 💡 會替學生 .click() 原本那顆，一樣抓得到。
  function isHintButton(b) {
    if (!b) return false;
    const t = (b.textContent || '').replace(/\s+/g, '');
    if (t.includes('提示') && t.length <= 12 && !/關閉|隱藏|收起/.test(t)) return true;
    return /hint/i.test(String(b.className) + ' ' + b.id) && /提示/.test(b.title || '') && !/錢包|wallet/i.test(b.title + (b.getAttribute('onclick') || ''));
  }
  // src：'self'（學生自己按，點擊偵測會呼叫）／'auto'（普通模式連錯 3 次系統自動跳出，各單元呼叫）
  function logHint(src = 'self') {
    const k = questionKey();
    if (!k) return;   // 沒有題號＝不在作答畫面（設定頁、結算頁）
    const o = _hintQs.get(k) || { self: false, auto: false };
    o[src === 'auto' ? 'auto' : 'self'] = true;
    _hintQs.set(k, o);
    _syncQ();
    if (_cur && _curN() != null) {   // 逐步驟：只算在目前這一步
      const sk = k + '|' + _cur.step, so = _hintSteps.get(sk) || { self: false, auto: false };
      so[src === 'auto' ? 'auto' : 'self'] = true;
      _hintSteps.set(sk, so);
    } else if (_stepMode) {          // 這一題還沒宣告步驟（例：一進題目就先按提示）→ 算給接下來的第一步
      const po = _hintPending.get(k) || { self: false, auto: false };
      po[src === 'auto' ? 'auto' : 'self'] = true;
      _hintPending.set(k, po);
    }
  }
  if (typeof document !== 'undefined') document.addEventListener('click', (e) => {
    if (!e.isTrusted || !e.target || !e.target.closest) return;
    if (e.target.closest('.th-pop-bulb')) { logHint(); return; }   // 小金探彈窗的 💡（js/title-heroes.js）
    if (isHintButton(e.target.closest('button, [role="button"], [onclick]'))) logHint();
  }, true);
  // 存檔時：用過提示、且那一題最後是完成的題數（沒有逐題紀錄的單元＝視為完成）
  // 回傳 { all, auto }：auto＝只有自動提示的題（同一題也按過主動提示＝算主動）
  function _hintedDone(score) {
    let all = 0, auto = 0;
    _hintQs.forEach((o, k) => { if (_qLastOk[k] !== false) { all++; if (!o.self) auto++; } });
    const cap = score || 0;
    return { all: Math.min(all, cap), auto: Math.min(auto, cap) };
  }

  // 「🌟 無錯通過」徽章：完成畫面上統一顯示（一處實作，24 單元＋生活情境對話共用）
  // 兩邊文字一樣（2026-09-27 使用者定「💯 ！全程無錯通過！」）；img＝對話模組傳金好聊頭像（dialogue/script.js showComplete）。
  function _showFlawlessBadge(text, img) {
    try {
      if (document.getElementById('lt-flawless-badge')) return;
      const el = document.createElement('div');
      el.id = 'lt-flawless-badge';
      if (img) {
        const pic = document.createElement('img');
        pic.src = img; pic.alt = '';
        pic.style.cssText = 'width:44px;height:44px;border-radius:50%;background:#fff;object-fit:cover;flex:none;';
        pic.onerror = () => pic.remove();
        el.appendChild(pic);
      }
      el.appendChild(document.createTextNode(text || '💯 ！全程無錯通過！'));
      el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99999;' +
        'display:flex;align-items:center;gap:10px;width:max-content;max-width:calc(100vw - 32px);box-sizing:border-box;' +
        'text-align:center;white-space:pre-line;line-height:1.5;' +
        'background:linear-gradient(135deg,#f7c948,#de911d);color:#4a2b00;font-weight:800;' +
        'padding:12px 26px;border-radius:30px;font-size:1.05em;box-shadow:0 8px 24px rgba(222,145,29,.5);' +
        'animation:ltBadgePop .4s ease;font-family:inherit;pointer-events:none;';
      const style = document.createElement('style');
      style.textContent = '@keyframes ltBadgePop{0%{transform:translate(-50%,-50%) scale(.4);opacity:0}' +
        '70%{transform:translate(-50%,-50%) scale(1.12)}100%{transform:translate(-50%,-50%) scale(1)}}';
      document.head.appendChild(style);
      document.body.appendChild(el);
      setTimeout(() => { el.style.transition = 'opacity .6s'; el.style.opacity = '0'; }, 4200);
      setTimeout(() => el.remove(), 5000);
    } catch (e) {}
  }

  // 是否目前顯示為深色模式（一次性讀取，非監聽——鏡射 CSS 的 [data-theme] 優先／跟隨系統邏輯，
  // 用於這種寫死 inline style、CSS 覆蓋不到的浮動泡泡；不要另外監聽變化，見 js/theme-switch.js 檔頭說明）
  function _isDark() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'light') return false;
    if (t === 'dark') return true;
    try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }

  // 學生自評（後設認知）── 2026-09-26 使用者要求：比照生活情境對話，**內嵌在總結頁**（放在「學習成果」下方）、不自動消失。
  // 24 單元的總結頁都有「學習成果」區塊：A／C／F＝.learning-achievements，B＝.b-res-achievements；
  // 一日金錢冒險的「今天的七項金錢技能」（.adv-sum-block）就是它的學習成果（2026-10-03 起一併內嵌，結算頁統一排法：學生自評在左下）。
  // 總結頁是存檔前後才畫出來的，所以最多等 4 秒找錨點；真的找不到才退回原本的浮動泡泡（_showSelfRating）。
  const _SR_ANCHOR = '.learning-achievements, .b-res-achievements, .adv-sum-block';
  function _srStyle() {
    if (document.getElementById('lt-selfrate-style')) return;
    const st = document.createElement('style');
    st.id = 'lt-selfrate-style';
    const dark = '--lt-sr-bg:rgba(59,130,246,.16);--lt-sr-bd:rgba(147,197,253,.35);--lt-sr-title:#93C5FD;' +
      '--lt-sr-btn-bg:#0F172A;--lt-sr-btn-bd:#334155;--lt-sr-btn-fg:#E2E8F0;--lt-sr-hover:#1E293B;--lt-sr-done:#4ADE80;';
    st.textContent =
      '.lt-selfrate-block{--lt-sr-bg:rgba(59,130,246,.10);--lt-sr-bd:rgba(59,130,246,.28);--lt-sr-title:#2563EB;' +
      '--lt-sr-btn-bg:#fff;--lt-sr-btn-bd:#dbe7f5;--lt-sr-btn-fg:#334155;--lt-sr-hover:#eff6ff;--lt-sr-done:#16a34a;' +
      'background:var(--lt-sr-bg);border:1.5px solid var(--lt-sr-bd);border-radius:12px;padding:12px 14px;margin:14px 0;' +
      'text-align:center;box-sizing:border-box;}' +
      '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .lt-selfrate-block{' + dark + '}}' +
      '[data-theme="dark"] .lt-selfrate-block{' + dark + '}' +
      '.lt-selfrate-title{font-size:1rem;font-weight:700;color:var(--lt-sr-title);margin-bottom:10px;}' +
      '.lt-selfrate-block.done .lt-selfrate-title{color:var(--lt-sr-done);margin-bottom:0;}' +
      '.lt-selfrate-btns{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;}' +
      // 寫死底色的按鈕一定要寫死文字色（UA 的 buttontext 會跟系統深色變白，見 CLAUDE.md 深色模式規則）
      '.lt-selfrate-btn{min-height:44px;min-width:88px;padding:8px 16px;border:1.5px solid var(--lt-sr-btn-bd);border-radius:22px;' +
      'background:var(--lt-sr-btn-bg);color:var(--lt-sr-btn-fg);font-family:inherit;font-size:1rem;font-weight:600;cursor:pointer;' +
      'touch-action:manipulation;}' +
      '.lt-selfrate-btn:hover{background:var(--lt-sr-hover);}';
    document.head.appendChild(st);
  }
  function _saveRate(recId, rate) {
    return _open().then(db => new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      const g = st.get(recId);
      g.onsuccess = () => { const r = g.result; if (r) { r.selfRating = rate; st.put(r); } };
      tx.oncomplete = resolve; tx.onerror = resolve;
    })).catch(() => {});
  }
  // 總結頁按鈕列最左邊加「回到首頁」（2026-09-26 使用者要求）。24 單元的按鈕列只有兩種：A／C／F＝.result-buttons，B＝.b-res-btns。
  // 複製同一列「返回設定」那顆的 class 與內部結構，外觀才會跟旁邊一致；去處同單元原有的「返回主選單」（../index.html）。
  function _addHomeBtn() {
    try {
      const row = [...document.querySelectorAll('.result-buttons, .b-res-btns')].pop();
      if (!row || row.querySelector('[data-lt-home]')) return;
      const tpl = [...row.querySelectorAll('button')].find(b => /返回設定/.test(b.textContent)) || row.querySelector('button');
      if (!tpl) return;
      const btn = tpl.cloneNode(true);
      btn.removeAttribute('onclick'); btn.removeAttribute('id');
      btn.setAttribute('data-lt-home', '1');
      btn.type = 'button';
      const ic = btn.querySelector('.btn-icon'), tx = btn.querySelector('.btn-text');
      if (ic && tx) { ic.textContent = '🏠'; tx.textContent = '回到首頁'; }
      else btn.textContent = '🏠 回到首頁';
      btn.addEventListener('click', () => { window.location.href = '../index.html'; });
      row.insertBefore(btn, row.firstChild);
    } catch (e) {}
  }
  // waitAnchor＝24 單元（一定有「學習成果」）：錨點沒出現就一直等，不退回浮動泡泡。
  // ⚠️ 2026-09-27：B1／B2／B3／B5 的總結頁要學生按「查看測驗總結」才畫出來（存檔時還不存在），
  //    原本只等 4 秒就退回 8 秒自動消失的泡泡 → 按了查看之後總結頁根本沒有自評。
  //    起點評估沒有「學習成果」區塊，維持 4 秒後改用泡泡（一日金錢冒險 2026-10-03 起用 .adv-sum-block 當錨點）。
  let _srWaiting = null;   // 還在等錨點的那一次（新的一次存檔會取代它，免得上一局的自評插到這一局）
  function _embedSelfRating(recId, waitAnchor) {
    if (recId == null) return;
    if (_srWaiting) { _srWaiting.disconnect(); _srWaiting = null; }
    let tries = 0;
    const tick = () => {
      // 不看是否可見：總結頁可能先畫好、藏在按鈕後面
      const anchor = [...document.querySelectorAll(_SR_ANCHOR)].pop();
      if (!anchor) {
        if (++tries < 27) return setTimeout(tick, 150);
        if (!waitAnchor) return _showSelfRating(recId);
        // 等學生按「查看測驗總結」：總結頁出現（DOM 有新增）時再試；最多等 30 分鐘
        const mo = new MutationObserver(() => {
          if (!document.querySelector(_SR_ANCHOR)) return;
          mo.disconnect(); if (_srWaiting === mo) _srWaiting = null;
          tick();
        });
        mo.observe(document.body, { childList: true, subtree: true });
        _srWaiting = mo;
        setTimeout(() => { mo.disconnect(); if (_srWaiting === mo) _srWaiting = null; }, 30 * 60 * 1000);
        return;
      }
      try {
        _srStyle();
        document.querySelectorAll('.lt-selfrate-block').forEach(el => el.remove());
        const box = document.createElement('div');
        box.className = 'lt-selfrate-block';
        box.innerHTML = '<div class="lt-selfrate-title">😀 這次練習，你覺得怎麼樣？</div><div class="lt-selfrate-btns">' +
          ['easy|😀|簡單', 'ok|😐|普通', 'hard|😣|好難'].map(x => {
            const [v, em, label] = x.split('|');
            return `<button type="button" class="lt-selfrate-btn" data-rate="${v}"><span aria-hidden="true">${em}</span> ${label}</button>`;
          }).join('') + '</div>';
        box.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
          box.querySelectorAll('button').forEach(b => { b.disabled = true; });
          _saveRate(recId, btn.dataset.rate);
          box.classList.add('done');
          box.querySelector('.lt-selfrate-title').textContent = '謝謝你告訴老師！💛';
          box.querySelector('.lt-selfrate-btns').remove();
        }));
        anchor.insertAdjacentElement('afterend', box);
        _addHomeBtn();
      } catch (e) {}
    };
    tick();
  }

  // 學生自評（後設認知）：存檔成功後彈出 😀😐😣，點選寫回該筆紀錄的 selfRating；8 秒未答自動消失
  function _showSelfRating(recId) {
    try {
      if (recId == null || document.getElementById('lt-self-rating')) return;
      const dark = _isDark();
      const wrap = document.createElement('div');
      wrap.id = 'lt-self-rating';
      wrap.style.cssText = 'position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:99998;' +
        'background:' + (dark ? '#1E293B' : '#fff') + ';border:2px solid #93c5fd;border-radius:30px;padding:10px 18px;' +
        'box-shadow:0 8px 24px rgba(37,99,235,.25);display:flex;align-items:center;gap:10px;' +
        'font-family:inherit;font-size:1em;';
      wrap.innerHTML = '<span style="font-weight:700;color:' + (dark ? '#93C5FD' : '#1d4ed8') + ';">今天覺得怎麼樣？</span>' +
        ['easy|😀 簡單', 'ok|😐 普通', 'hard|😣 好難'].map(x => {
          const [v, label] = x.split('|');
          return `<button data-rate="${v}" style="border:1.5px solid ${dark ? '#334155' : '#dbe7f5'};background:${dark ? '#0F172A' : '#f8fbff'};color:${dark ? '#E2E8F0' : 'inherit'};border-radius:20px;` +
                 `padding:6px 12px;cursor:pointer;font-family:inherit;font-size:0.95em;">${label}</button>`;
        }).join('');
      const close = () => wrap.remove();
      wrap.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', async () => {
          const rate = btn.dataset.rate;
          try {
            const db = await _open();
            await new Promise((resolve) => {
              const tx = db.transaction(STORE, 'readwrite');
              const st = tx.objectStore(STORE);
              const g = st.get(recId);
              g.onsuccess = () => {
                const r = g.result;
                if (r) { r.selfRating = rate; st.put(r); }
              };
              tx.oncomplete = resolve;
              tx.onerror = resolve;
            });
          } catch (e) {}
          wrap.innerHTML = '<span style="font-weight:700;color:' + (dark ? '#4ADE80' : '#16a34a') + ';">謝謝你的分享！💛</span>';
          setTimeout(close, 1200);
        });
      });
      document.body.appendChild(wrap);
      setTimeout(() => { if (document.getElementById('lt-self-rating') === wrap && wrap.querySelector('button')) close(); }, 8000);
    } catch (e) {}
  }

  // 儲存一次練習結果
  // data: { unit, unitName, series, score, total, difficulty, durationSec, stars?, wrongAttempts? }
  // 這次練習是不是「輔助點擊（單鍵操作）」完成的（2026-09-30 使用者定：比照對話模組，標 👆、不算無錯通過與精熟）。
  // 各單元開關名稱不同：A／B 系列 clickMode（A＝true/false，B＝'on'/'off'，⚠️ 'off' 是真值不能用 !!）、C／F 系列 assistClick。
  // 輔助點擊只在簡單模式有效；切到別的難度後殘留的開關不算。
  // 設定頁輔助點擊選項下方的說明（24 單元共用，只寫在這裡；對話模組的同一句在 dialogue/script.js renderSetup）
  const ASSIST_NOTE = '練習紀錄會標上 👆 符號（代表輔助點擊），老師看得出這次是系統幫忙完成的，所以不算「🌟 無錯通過」，也不算「已經學會」。';

  function assistedFrom(s) {
    if (!s || s.difficulty !== 'easy') return false;
    return s.clickMode === true || s.clickMode === 'on' || s.assistClick === true;
  }

  // 這次練習的設定快照（2026-10-08，IEP 範本 v2：目標會寫「數數範圍 1-10」這類設定，之後要能據此判斷）：
  //   單元的設定物件（assistFrom）只留短的字串／數字／布林——自訂圖片（data:／blob:）、商品清單等物件與陣列一律不存
  function settingsSnapshot(s) {
    if (!s || typeof s !== 'object') return null;
    const out = {};
    Object.keys(s).forEach(k => {
      const v = s[k];
      if (typeof v === 'number' || typeof v === 'boolean') out[k] = v;
      else if (typeof v === 'string' && v.length <= 40 && !/^(data|blob):/.test(v)) out[k] = v;
    });
    return Object.keys(out).length ? out : null;
  }

  // 一筆 IndexedDB 寫入／刪除，完成（oncomplete）才 resolve——「寫入成功後才刪暫存」靠這個（規格第四節）
  function _tx(store, fn) {
    return _open().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      let out;
      const r = fn(tx.objectStore(store));
      if (r) r.onsuccess = () => { out = r.result; };
      tx.oncomplete = () => resolve(out);
      tx.onerror = tx.onabort = () => reject(tx.error);
    }));
  }
  function _get(store, id) {
    return _open().then(db => new Promise((resolve) => {
      const r = db.transaction(store, 'readonly').objectStore(store).get(id);
      r.onsuccess = () => resolve(r.result); r.onerror = () => resolve(undefined);
    }));
  }

  // 某位學生的全部紀錄（records＋中斷摘要），唯讀。設定頁的 IEP 提醒（js/iep-reminder.js）用來判定 📏 系統精熟／🏁 IEP 精熟（2026-10-09）
  function studentRecords(sid) {
    const all = (store) => _open().then(db => new Promise((resolve) => {
      const r = db.transaction(store, 'readonly').objectStore(store).getAll();
      r.onsuccess = () => resolve(r.result || []); r.onerror = () => resolve([]);
    })).catch(() => []);
    const mine = (r) => r && r.studentId != null && String(r.studentId) === String(sid);
    return Promise.all([all(STORE), all(INTERRUPTED)]).then(([a, b]) => a.concat(b).filter(mine));
  }

  // 暫存 → 中斷摘要（interrupted 資料表）。重複執行不會多一筆（id＝sessionId、用 put）；
  // 同一次練習已經正常存成 done（另一分頁的極端情況）就只刪暫存。
  const _finalizing = new Set();
  async function _finalizeDraft(key) {
    if (_finalizing.has(key)) return;
    _finalizing.add(key);
    try {
      let d = null;
      try { d = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
      if (!d || !d.sessionId || !(d.events || []).length) { try { localStorage.removeItem(key); } catch (e) {} return; }
      if (await _get(STORE, d.sessionId)) { try { localStorage.removeItem(key); } catch (e) {} return; }
      const core = await _core();
      const unit = d.unit || '';
      const summary = {
        id: d.sessionId, status: 'interrupted', source: 'main',
        studentId: d.studentId ?? null, studentName: d.studentName ?? null,
        scenarioId: unit ? unit[0].toUpperCase() : '', situationId: unit, unit,
        difficulty: d.difficulty || 'normal', ...(d.assisted ? { assisted: true } : {}),
        events: d.events, ...(core ? { questions: core.deriveQuestions(d.events, { interrupted: true, assisted: !!d.assisted }) } : {}),
        startTs: d.startTs, ts: d.lastTs, durationSec: Math.round(((d.lastTs || 0) - (d.startTs || 0)) / 1000),
      };
      await _tx(INTERRUPTED, st => st.put(summary));
      try { localStorage.removeItem(key); } catch (e) {}
    } catch (e) {
      // 寫入失敗：暫存留著，下次再試
    } finally { _finalizing.delete(key); }
  }
  // 結算符合條件的暫存（不含這一頁正在進行的練習）
  function _sweepDrafts(pick) {
    try {
      const own = _session ? _draftKey(_session) : null;
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(DRAFT_PREFIX) || k === own) continue;
        let d = null;
        try { d = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) {}
        if (!d || pick(d)) _finalizeDraft(k);
      }
    } catch (e) {}
  }
  // 頁面載入時：結算超過 30 分鐘沒更新的暫存（老師打開學習歷程也會跑到這裡，teacher.html 有載入本檔）
  const sweepStale = () => _sweepDrafts(d => Date.now() - (d.lastTs || 0) > STALE_MS);
  if (typeof window !== 'undefined') setTimeout(sweepStale, 1500);

  // 🔴 設定頁選幾題，紀錄就是幾題（2026-10-10 使用者定，24 單元通則；唯一的補齊處）。
  // 有些題目單元沒有逐題記到——簡單模式「點完就自動過關」沒有作答這一步（C2／F1…）、輔助點擊代按——
  // 沒有逐題紀錄時，學習歷程會把整次練習當成 1 題。這裡補上：沒記到的題號依單元回報的答對數補成完成，
  // 答對數用完還缺的補成未通過；該題按過提示照樣帶上。補上的事件標 fill:true（看得出是補的）。
  function _fillMissing(events, total, score) {
    total = total | 0;
    const seen = new Set(events.map(e => e.n));
    if (total <= 0 || seen.size >= total) return events;
    const lastOk = new Map(); events.forEach(e => lastOk.set(e.n, !!e.ok));
    let okLeft = Math.max(0, (score | 0) - [...lastOk.values()].filter(Boolean).length);
    const out = events.slice(), t = Date.now();
    for (let n = 1; n <= total && seen.size < total; n++) {
      if (seen.has(n)) continue;
      seen.add(n);
      const ok = okLeft > 0; if (ok) okLeft--;
      const src = _hintQs.get('Q' + n);
      const hint = src ? [...(src.self ? ['self'] : []), ...(src.auto ? ['auto'] : [])] : [];
      out.push({ n, step: 'answer', label: `第${n}題`, ok, fill: true, ...(hint.length ? { hint } : {}), ...(_kindByN[n] ? { kind: _kindByN[n] } : {}), t });
    }
    return out.sort((a, b) => a.n - b.n);   // 穩定排序：同一題裡的先後不變
  }

  async function save(data) {
    try {
      const db = await _open();
      // 與 dialogue 相同的學生維度（sp_currentStudent；null＝訪客）
      let student = null;
      try { student = JSON.parse(localStorage.getItem('sp_currentStudent') || 'null'); } catch {}
      _closeStep();   // 最後一步：存檔＝做完
      _closeImplicit(_lastN);
      const wrongAttempts = data.wrongAttempts ?? _wrongCount;
      _wrongCount = 0;
      // 只補 24 單元：一日金錢冒險的 total 是總分（8），規格 6-1 定整次當一題，不能補成 8 題
      const evAll = /^[abcf][1-6]$/.test(String(data.unit || '')) ? _fillMissing(_events, data.total, data.score) : _events;
      const events = evAll.map(({ auto, syn, _t, _m, ...e }) => e);   // 內部欄位不存
      // 舊格式 stepDetail 只放單元自己 logStep 記的（與補齊的題），不放 logWrong 自動記的答錯與自動補的完成——主頁弱點單元等仍讀它，維持原意
      const ownEvents = evAll.filter(e => !e.auto && !e.syn).map(({ auto, syn, _t, _m, ...e }) => e);
      const session = _session;
      _events = []; _session = null; _lastN = 0;
      const assisted = !!(data.assisted ?? assistedFrom(data.assistFrom));
      const hd = assisted ? { all: 0, auto: 0 } : _hintedDone(data.score);   // 👆 輔助點擊整場另計，不談提示
      const hinted = hd.all;
      _hintQs.clear(); _qLastOk = {}; _stepMode = false; _hintSteps.clear(); _hintPending.clear(); _kind = null; Object.keys(_kindByN).forEach(k => delete _kindByN[k]);
      const core = await _core();
      // 舊版學習歷程讀的逐題明細（第 5、6 階段改讀 questions 後拿掉）
      const stepDetail = data.stepDetail ?? (ownEvents.length ? ownEvents.map(e => ({ q: e.label, ok: e.ok,
        ...(e.hint ? { hint: true, ...(e.hint.includes('self') ? {} : { hintAuto: true }) } : {}) })) : undefined);
      const record = {
        id: session?.sessionId ?? _newSessionId(),
        status: 'done',
        ...(events.length ? { events } : {}),
        ...(core && events.length ? { questions: core.deriveQuestions(events, { assisted }) } : {}),
        // 規格 3-1「換題時題號一定會變」的自我檢查：事件裡的題數≠單元回報的總題數就標記（不影響其他欄位，
        // 第 5、6 階段與整合測試據此找出題號沒跟著換的單元）。2026-10-10 起存檔前先 _fillMissing 補齊，還標到＝補不起來（題號超出總題數之類），要查單元。
        ...(events.length && (data.total || 0) > 0 && new Set(events.map(e => e.n)).size !== data.total
          ? { qCheck: { events: new Set(events.map(e => e.n)).size, total: data.total } } : {}),
        wrongAttempts,
        hinted,   // 💡 提示後完成題數（2026-10-06 起才有；沒有這個欄位＝舊紀錄，當時沒記提示，不可當成 0 次）
        hintedAuto: hd.auto,   // 其中只有「自動提示」的題數（主動＝hinted − hintedAuto）
        ...(assisted ? { assisted: true } : {}),
        ...(stepDetail ? { stepDetail } : {}),
        flawless:     !assisted && (data.total || 0) > 0 && wrongAttempts === 0 && hinted === 0 &&
                      (data.score || 0) >= (data.total || 0),
        studentId:    student?.id   ?? null,
        studentName:  student?.name ?? null,
        // 與 dialogue 紀錄格式對齊，讓 teacher.html 可一起顯示
        scenarioId:   data.series || data.unit,
        scenarioName: data.series ? `${data.series} 系列` : data.unitName || data.unit,
        situationId:  data.unit,
        situationName: data.unitName || data.unit,
        difficulty:   data.difficulty || 'normal',
        // 設定頁選了什麼（數數範圍、錢包金額…）：預設取單元的設定物件 assistFrom；沒有設定物件的（冒險）另傳 settings
        ...(settingsSnapshot(data.settings || data.assistFrom) ? { settings: settingsSnapshot(data.settings || data.assistFrom) } : {}),
        score:        data.score  || 0,
        total:        data.total  || 0,
        stars:        data.stars  ?? (data.total > 0 ? (data.score / data.total >= 0.84 ? 3 : data.score / data.total >= 0.5 ? 2 : 1) : 1),
        steps:        data.steps  || [],
        durationSec:  data.durationSec || 0,
        ts:           Date.now(),
        source:       'main',   // 區分來源：main / dialogue
      };
      const recId = await _tx(STORE, st => st.put(record));   // id＝sessionId，用 put：重複存也不會多一筆
      // 寫入成功才刪暫存；同一次練習若已被（另一分頁）結算成中斷摘要，刪掉那筆，只留 done（規格第四節）
      if (session) {
        try { localStorage.removeItem(_draftKey(session)); } catch (e) {}
        _tx(INTERRUPTED, st => st.delete(session.sessionId)).catch(() => {});
      }
      if (record.flawless) _showFlawlessBadge();
      _embedSelfRating(recId, /^[abcf][1-6]$/.test(String(data.unit || '')));
    } catch (e) {
      // 靜默失敗，不影響遊戲本體
    }
  }

  // ── 單元獎勵（2026-10-05 起）──────────────
  // 這裡不再寫 pendingRewards（優良表現獎勵板只由老師手動給分）。單元完成的金幣直接由紀錄推算：
  // js/growth-system.js 的 unclaimedCoins 依 teacher.html「🎁 單元獎勵設定」計算，學生到「成就與寵物」頁領取。

  const hintState = () => ({ q: questionKey(), hinted: [..._hintQs.keys()], self: [..._hintQs].filter(([, o]) => o.self).map(([k]) => k),
    auto: [..._hintQs].filter(([, o]) => o.auto).map(([k]) => k), lastOk: { ..._qLastOk } });   // 測試用
  const evalState = () => ({ session: _session && { ..._session, settings: undefined }, events: _events.slice() });   // 測試用
  return { save, logWrong, logStep, setStep, setKind, logHint, isHintButton, questionKey, setQuestionSource, hintState, resetWrong, assistedFrom, ASSIST_NOTE, showFlawlessBadge: _showFlawlessBadge,
    sweepStale, evalState, finalizeDraft: _finalizeDraft, DRAFT_PREFIX, studentRecords };
})();

// ⚠️ 頂層 const 不會掛上 window；各單元以 window.LearningTracker?.save() 呼叫，
// 少了這行，所有單元的學習記錄都會靜默跳過（2026-07-06 修正）。
window.LearningTracker = LearningTracker;
