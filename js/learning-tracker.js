// ─── 學習紀錄追蹤器（主系統共用）────────────────────
// 與 dialogue/db.js 共用同一個 IndexedDB 資料庫
// 使用方式：
//   LearningTracker.save({ unit, unitName, series, score, total, difficulty, durationSec });
// 各單元在 showResults() / endGame() 完成時呼叫一次即可。

const LearningTracker = (() => {
  const DB_NAME    = 'shopping-practice';
  const STORE      = 'records';
  let _db = null;

  async function _open() {
    if (_db) return _db;
    return new Promise((resolve, reject) => {
      // 版本須與 dialogue/db.js 的 DB_VERSION 一致（目前 2），
      // 且 onupgradeneeded 建立相同的 stores——確保「哪個頁面先開」都能得到完整 schema。
      const req = indexedDB.open(DB_NAME, 2);
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
      };
      req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
      req.onerror   = ()  => reject(req.error);
    });
  }

  // ── 錯誤嘗試計數（反覆練習機制下，答錯不會反映在最終分數，需另行累計）──
  // 各單元在「答錯」分支呼叫 LearningTracker.logWrong()；save() 時一併寫入並歸零。
  let _wrongCount = 0;
  let _steps = [];   // 逐題明細 [{q, ok}]，save 時寫入 stepDetail 後歸零
  function logWrong(n = 1) { _wrongCount += n; }
  // 逐題記錄：q＝題目描述（例「第3題：辨識 10 元」）、ok＝是否答對。
  // 用法：各單元判題點呼叫 logStep(label, true/false)；答錯分支仍另呼叫 logWrong()。
  function logStep(q, ok) { _steps.push({ q: String(q).slice(0, 60), ok: !!ok }); }
  function resetWrong()    { _wrongCount = 0; _steps = []; }   // 單元重新開始時可呼叫

  // 「🌟 無錯通過」徽章：完成畫面上統一顯示（一處實作，24 單元通用）
  function _showFlawlessBadge() {
    try {
      if (document.getElementById('lt-flawless-badge')) return;
      const el = document.createElement('div');
      el.id = 'lt-flawless-badge';
      el.textContent = '🌟 全程無錯通過！金隊長已記錄';
      el.style.cssText = 'position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:99999;' +
        'background:linear-gradient(135deg,#f7c948,#de911d);color:#4a2b00;font-weight:800;' +
        'padding:12px 26px;border-radius:30px;font-size:1.05em;box-shadow:0 8px 24px rgba(222,145,29,.5);' +
        'animation:ltBadgePop .4s ease;font-family:inherit;pointer-events:none;';
      const style = document.createElement('style');
      style.textContent = '@keyframes ltBadgePop{0%{transform:translateX(-50%) scale(.4);opacity:0}' +
        '70%{transform:translateX(-50%) scale(1.12)}100%{transform:translateX(-50%) scale(1)}}';
      document.head.appendChild(style);
      document.body.appendChild(el);
      setTimeout(() => { el.style.transition = 'opacity .6s'; el.style.opacity = '0'; }, 4200);
      setTimeout(() => el.remove(), 5000);
    } catch (e) {}
  }

  // 學生自評（後設認知）：存檔成功後彈出 😀😐😣，點選寫回該筆紀錄的 selfRating；8 秒未答自動消失
  function _showSelfRating(recId) {
    try {
      if (recId == null || document.getElementById('lt-self-rating')) return;
      const wrap = document.createElement('div');
      wrap.id = 'lt-self-rating';
      wrap.style.cssText = 'position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:99998;' +
        'background:#fff;border:2px solid #93c5fd;border-radius:30px;padding:10px 18px;' +
        'box-shadow:0 8px 24px rgba(37,99,235,.25);display:flex;align-items:center;gap:10px;' +
        'font-family:inherit;font-size:1em;';
      wrap.innerHTML = '<span style="font-weight:700;color:#1d4ed8;">今天覺得怎麼樣？</span>' +
        ['easy|😀 簡單', 'ok|😐 普通', 'hard|😣 好難'].map(x => {
          const [v, label] = x.split('|');
          return `<button data-rate="${v}" style="border:1.5px solid #dbe7f5;background:#f8fbff;border-radius:20px;` +
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
          wrap.innerHTML = '<span style="font-weight:700;color:#16a34a;">謝謝你的分享！💛</span>';
          setTimeout(close, 1200);
        });
      });
      document.body.appendChild(wrap);
      setTimeout(() => { if (document.getElementById('lt-self-rating') === wrap && wrap.querySelector('button')) close(); }, 8000);
    } catch (e) {}
  }

  // 儲存一次練習結果
  // data: { unit, unitName, series, score, total, difficulty, durationSec, stars?, wrongAttempts? }
  async function save(data) {
    try {
      const db = await _open();
      // 與 dialogue 相同的學生維度（sp_currentStudent；null＝訪客）
      let student = null;
      try { student = JSON.parse(localStorage.getItem('sp_currentStudent') || 'null'); } catch {}
      const wrongAttempts = data.wrongAttempts ?? _wrongCount;
      _wrongCount = 0;
      const stepDetail = data.stepDetail ?? (_steps.length ? _steps : undefined);
      _steps = [];
      const record = {
        wrongAttempts,
        ...(stepDetail ? { stepDetail } : {}),
        flawless:     (data.total || 0) > 0 && wrongAttempts === 0 &&
                      (data.score || 0) >= (data.total || 0),
        studentId:    student?.id   ?? null,
        studentName:  student?.name ?? null,
        // 與 dialogue 紀錄格式對齊，讓 teacher.html 可一起顯示
        scenarioId:   data.series || data.unit,
        scenarioName: data.series ? `${data.series} 系列` : data.unitName || data.unit,
        situationId:  data.unit,
        situationName: data.unitName || data.unit,
        difficulty:   data.difficulty || 'normal',
        score:        data.score  || 0,
        total:        data.total  || 0,
        stars:        data.stars  ?? (data.total > 0 ? (data.score / data.total >= 0.84 ? 3 : data.score / data.total >= 0.5 ? 2 : 1) : 1),
        steps:        data.steps  || [],
        durationSec:  data.durationSec || 0,
        ts:           Date.now(),
        source:       'main',   // 區分來源：main / dialogue
      };
      const recId = await new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE, 'readwrite');
        const req = tx.objectStore(STORE).add(record);
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
      });
      if (record.flawless) _showFlawlessBadge();
      _showSelfRating(recId);
    } catch (e) {
      // 靜默失敗，不影響遊戲本體
    }
  }

  return { save, logWrong, logStep, resetWrong };
})();

// ⚠️ 頂層 const 不會掛上 window；各單元以 window.LearningTracker?.save() 呼叫，
// 少了這行所有單元記錄都會靜默跳過（2026-07-06 實測踩雷）。
window.LearningTracker = LearningTracker;
