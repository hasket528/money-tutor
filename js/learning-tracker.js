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

  // 儲存一次練習結果
  // data: { unit, unitName, series, score, total, difficulty, durationSec, stars? }
  async function save(data) {
    try {
      const db = await _open();
      // 與 dialogue 相同的學生維度（sp_currentStudent；null＝訪客）
      let student = null;
      try { student = JSON.parse(localStorage.getItem('sp_currentStudent') || 'null'); } catch {}
      const record = {
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
      await new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE, 'readwrite');
        const req = tx.objectStore(STORE).add(record);
        req.onsuccess = resolve;
        req.onerror   = () => reject(req.error);
      });
    } catch (e) {
      // 靜默失敗，不影響遊戲本體
    }
  }

  return { save };
})();

// ⚠️ 頂層 const 不會掛上 window；各單元以 window.LearningTracker?.save() 呼叫，
// 少了這行所有單元記錄都會靜默跳過（2026-07-06 實測踩雷）。
window.LearningTracker = LearningTracker;
