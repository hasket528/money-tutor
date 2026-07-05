// ─── 學習紀錄資料庫（IndexedDB）─────────────────────
// 資料結構：
//   record { id(auto), scenarioId, situationId, difficulty,
//             score, total, steps[], durationSec, ts }

const DB_NAME    = 'shopping-practice';
const DB_VERSION = 1;
const STORE      = 'records';

let _db = null;

async function dbOpen() {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
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

async function dbSave(record) {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).add({ ...record, ts: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function dbAll() {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function dbClear() {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).clear();
    req.onsuccess = resolve;
    req.onerror   = () => reject(req.error);
  });
}

// 匯出全部資料（JSON 字串）
async function dbExport() {
  const records = await dbAll();
  return JSON.stringify({ version: 1, exported: Date.now(), records }, null, 2);
}

// 匯入資料（JSON 字串），回傳匯入筆數
async function dbImport(jsonStr) {
  const data = JSON.parse(jsonStr);
  const records = data.records || [];
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    records.forEach(r => {
      const { id: _, ...rest } = r;   // 移除舊 id，讓 auto-increment 重新指定
      store.add(rest);
    });
    tx.oncomplete = () => resolve(records.length);
    tx.onerror    = () => reject(tx.error);
  });
}
