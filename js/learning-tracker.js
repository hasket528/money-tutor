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
      // 不指定版本：跟隨現有 DB 版本（dialogue/db.js 負責升級 schema），
      // 指定舊版本號會在 DB 已升級後拋 VersionError。
      const req = indexedDB.open(DB_NAME);
      req.onupgradeneeded = (e) => {
        // 只在 DB 尚不存在時建立基本 store
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('ts',         'ts',         { unique: false });
          store.createIndex('scenarioId', 'scenarioId', { unique: false });
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
