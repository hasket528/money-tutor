/* js/captain-tools.js — 金隊長工具「共用資料層」
 * index.html（金隊長基地）與 dialogue/teacher.html（學習歷程總覽）共用同一份邏輯，
 * 避免全站備份/還原、學習紀錄/錄音讀取、老師指派 的程式在兩頁各寫一份而分歧。
 * 只做資料層；各頁自己接自己的按鈕與狀態顯示。
 * 相依：同源 localStorage 與 IndexedDB 'shopping-practice'（records / custom_audio）。
 */
(function () {
  const DB_NAME = 'shopping-practice', DB_VERSION = 2;

  // 讀全部學習紀錄
  function readAllRecords() {
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('records')) {
            const store = db.createObjectStore('records', { keyPath: 'id', autoIncrement: true });
            store.createIndex('ts', 'ts', { unique: false });
            store.createIndex('scenarioId', 'scenarioId', { unique: false });
          }
          if (!db.objectStoreNames.contains('custom_audio')) db.createObjectStore('custom_audio', { keyPath: 'key' });
        };
        req.onsuccess = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('records')) { db.close(); resolve([]); return; }
          const q = db.transaction('records', 'readonly').objectStore('records').getAll();
          q.onsuccess = () => { db.close(); resolve(q.result || []); };
          q.onerror = () => { db.close(); resolve([]); };
        };
        req.onerror = () => resolve([]);
        req.onblocked = () => resolve([]);
      } catch { resolve([]); }
    });
  }

  // 讀全部錄音/照片 blob（轉 dataURL 供備份打包）
  function readAllAudio() {
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('custom_audio')) { db.close(); resolve([]); return; }
          const q = db.transaction('custom_audio', 'readonly').objectStore('custom_audio').getAll();
          q.onsuccess = async () => {
            const out = [];
            for (const it of (q.result || [])) {
              const dataURL = await new Promise(r => {
                const fr = new FileReader();
                fr.onload = () => r(fr.result);
                fr.onerror = () => r(null);
                fr.readAsDataURL(it.blob);
              });
              if (dataURL) out.push({ key: it.key, mime: it.mime, ts: it.ts, dataURL });
            }
            db.close(); resolve(out);
          };
          q.onerror = () => { db.close(); resolve([]); };
        };
        req.onerror = () => resolve([]);
      } catch { resolve([]); }
    });
  }

  const setStatus = (el, msg) => { if (el) el.textContent = msg; };

  // 全站備份 → 觸發下載單一 JSON（statusEl 可選，用來顯示進度）
  async function backup(statusEl) {
    setStatus(statusEl, '⏳ 打包中…');
    try {
      const ls = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.toLowerCase().includes('api_key')) continue;   // 金鑰不入備份
        ls[k] = localStorage.getItem(k);
      }
      const pack = {
        type: 'mt-full-backup', version: 1, exported: Date.now(),
        localStorage: ls,
        records: await readAllRecords(),
        audio: await readAllAudio(),
      };
      const blob = new Blob([JSON.stringify(pack)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `金錢小達人備份_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus(statusEl, `✅ 已匯出備份（學習紀錄 ${pack.records.length} 筆、錄音/照片 ${pack.audio.length} 段）`);
    } catch (e) {
      setStatus(statusEl, '❌ 備份失敗，請再試一次');
    }
  }

  // 從備份檔還原（會取代本機資料；成功後自動重整）
  async function restoreFromFile(file, statusEl) {
    if (!file) return;
    try {
      const pack = JSON.parse(await file.text());
      if (pack.type !== 'mt-full-backup') throw new Error('不是備份檔');
      if (!confirm(`確定要還原「${new Date(pack.exported).toLocaleString('zh-TW')}」的備份嗎？\n目前這台瀏覽器的資料將被取代！`)) {
        return;
      }
      // localStorage
      Object.keys(localStorage).forEach(k => { if (!k.toLowerCase().includes('api_key')) localStorage.removeItem(k); });
      Object.entries(pack.localStorage || {}).forEach(([k, v]) => localStorage.setItem(k, v));
      // IndexedDB
      await new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (ev) => {
          const db = ev.target.result;
          if (!db.objectStoreNames.contains('records')) {
            const s = db.createObjectStore('records', { keyPath: 'id', autoIncrement: true });
            s.createIndex('ts', 'ts', { unique: false });
            s.createIndex('scenarioId', 'scenarioId', { unique: false });
          }
          if (!db.objectStoreNames.contains('custom_audio')) db.createObjectStore('custom_audio', { keyPath: 'key' });
        };
        req.onsuccess = (ev) => {
          const db = ev.target.result;
          const tx = db.transaction(['records', 'custom_audio'], 'readwrite');
          const rs = tx.objectStore('records');
          rs.clear();
          (pack.records || []).forEach(r => { try { rs.put(r); } catch (x) {} });
          const as = tx.objectStore('custom_audio');
          as.clear();
          (pack.audio || []).forEach(it => {
            try {
              const [head, body] = it.dataURL.split(',');
              const mime = head.match(/data:([^;]+)/)?.[1] || it.mime || 'audio/webm';
              const bytes = atob(body);
              const arr = new Uint8Array(bytes.length);
              for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
              as.put({ key: it.key, blob: new Blob([arr], { type: mime }), mime, ts: it.ts || Date.now() });
            } catch (x) {}
          });
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); reject(tx.error); };
        };
        req.onerror = () => reject(req.error);
      });
      setStatus(statusEl, '✅ 還原完成，頁面即將重新整理…');
      setTimeout(() => location.reload(), 900);
    } catch (err) {
      setStatus(statusEl, '❌ 還原失敗：' + (err.message || '請確認是備份檔'));
    }
  }

  // 老師指派（資料層）：mt_assign_{studentId} = [{unit, ts, claimed}]
  function assignStore(stuId) {
    try { return JSON.parse(localStorage.getItem(`mt_assign_${stuId}`) || '[]'); } catch { return []; }
  }
  function saveAssign(stuId, arr) {
    localStorage.setItem(`mt_assign_${stuId}`, JSON.stringify(arr));
  }
  // 指派一個單元給學生（回傳 true=成功、false=已在清單）
  function addAssignment(stuId, unit) {
    const arr = assignStore(stuId);
    if (arr.some(a => a.unit === unit && !a.claimed)) return false;
    arr.push({ unit, ts: Date.now(), claimed: false });
    saveAssign(stuId, arr);
    return true;
  }

  window.CaptainTools = { readAllRecords, readAllAudio, backup, restoreFromFile, assignStore, saveAssign, addAssignment };
})();
