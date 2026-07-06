// ─── 學習紀錄資料庫（IndexedDB）─────────────────────
// 資料結構：
//   record { id(auto), scenarioId, situationId, difficulty,
//             score, total, steps[], durationSec, ts }
//   custom_audio { key, blob, mime, ts }
//     key 慣例：`${scenarioId}::${stepId}::say`（店員台詞錄音；未來回饋語用 ::fb）

// ⚠️ DB_VERSION 與 stores 需和 js/learning-tracker.js、index.html countRecords 保持一致
const DB_NAME    = 'shopping-practice';
const DB_VERSION = 2;
const STORE      = 'records';
const AUDIO_STORE = 'custom_audio';

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
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: 'key' });
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

// ─── 自訂情境錄音（老師語音工作室）───────────────────

async function dbAudioSave(key, blob) {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const req = db.transaction(AUDIO_STORE, 'readwrite').objectStore(AUDIO_STORE)
      .put({ key, blob, mime: blob.type || 'audio/webm', ts: Date.now() });
    req.onsuccess = () => resolve(key);
    req.onerror   = () => reject(req.error);
  });
}

async function dbAudioGet(key) {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const req = db.transaction(AUDIO_STORE, 'readonly').objectStore(AUDIO_STORE).get(key);
    req.onsuccess = () => resolve(req.result?.blob || null);
    req.onerror   = () => reject(req.error);
  });
}

async function dbAudioDelete(key) {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const req = db.transaction(AUDIO_STORE, 'readwrite').objectStore(AUDIO_STORE).delete(key);
    req.onsuccess = resolve;
    req.onerror   = () => reject(req.error);
  });
}

// 列出指定前綴的所有 key（例：刪除整個情境時清掉其全部錄音）
async function dbAudioKeys(prefix = '') {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const req = db.transaction(AUDIO_STORE, 'readonly').objectStore(AUDIO_STORE).getAllKeys();
    req.onsuccess = () => resolve((req.result || []).filter(k => String(k).startsWith(prefix)));
    req.onerror   = () => reject(req.error);
  });
}

async function dbAudioDeletePrefix(prefix) {
  const keys = await dbAudioKeys(prefix);
  await Promise.all(keys.map(k => dbAudioDelete(k)));
  return keys.length;
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
