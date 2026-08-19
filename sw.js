// Service Worker — money_tutor 主站（24 單元離線化）
// 策略：
//   ・HTML 導覽 + version.txt：網路優先（線上永遠最新、更新提示條可正常偵測），離線退回快取
//   ・**程式碼（.js/.css）：網路優先、離線退回快取**（見下方 isCode 的說明）
//   ・圖片／音檔等靜態資源：快取優先＋背景更新（首次線上開啟後即可離線，且很少改動）
//   ・SW_VERSION 換版即清掉舊的核心快取；執行期快取跨版保留以省流量（但裡面的程式碼會清掉）
//
// ⚠️ **這支 SW 攔截整個站台的同源 GET**，adventure/ 與 games/ 也在內——
//    它們自己沒有 sw.js，但一樣吃這裡的快取。檔頭原本寫「games/adventure 無 sw，
//    純靜態不受影響」是錯的，2026-08-19 因此誤判過一輪：冒險的媒體卡修正明明已上線，
//    實機卻仍是舊行為，因為 adventure.js 走「快取優先」而 mt-runtime 跨版不清。
// 註：發版時把 SW_VERSION 與根目錄 version.txt、index.html 的 BUILD_VERSION 一起遞增。
const SW_VERSION    = '20260819d';
const CACHE_CORE    = 'mt-core-' + SW_VERSION;
const CACHE_RUNTIME = 'mt-runtime';

// 應用外殼：安裝時預先快取（保持精簡，避免任一檔缺失導致整包安裝失敗）
const PRECACHE = [
  './',
  './index.html',
  './version.txt',
  './manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_CORE)
      // 單檔失敗不擋整體安裝
      .then(cache => Promise.all(PRECACHE.map(u => cache.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_CORE && k !== CACHE_RUNTIME).map(k => caches.delete(k))
      ))
      // 執行期快取整包保留（圖與音檔大又幾乎不改），但**裡面的舊程式碼要清掉**：
      // 舊版是快取優先，裝置上可能還躺著幾個月前的 .js；不清的話換了策略也還是先吃到它。
      .then(() => caches.open(CACHE_RUNTIME).then(c =>
        c.keys().then(reqs => Promise.all(
          reqs.filter(r => /\.(js|css)$/i.test(new URL(r.url).pathname)).map(r => c.delete(r))
        ))
      ).catch(() => {}))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== location.origin) return;   // 只處理同源

  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');
  const isVersion = url.pathname.endsWith('/version.txt');

  // HTML 導覽與 version.txt：網路優先，離線退回快取（HTML 再退回首頁）
  if (isHTML || isVersion) {
    event.respondWith(
      fetch(req)
        .then(resp => {
          if (resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_CORE).then(c => c.put(req, copy));
          }
          return resp;
        })
        .catch(() => caches.match(req).then(c =>
          c || (isHTML ? caches.match('./index.html') : undefined)
        ))
    );
    return;
  }

  // 程式碼（.js/.css）：網路優先，離線才退回快取。
  // ⚠️ 這裡**不能用快取優先**：那會讓「修好的程式碼要重整兩次才生效」變成常態
  //    （第一次吃舊快取、背景才更新），老師與實機驗收都會看到早已修好的舊 bug。
  //    圖片音檔維持快取優先，是因為它們大又幾乎不改；程式碼小又天天改，剛好相反。
  if (/\.(js|css)$/i.test(url.pathname)) {
    event.respondWith(
      fetch(req)
        .then(resp => {
          if (resp.ok && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE_RUNTIME).then(c => c.put(req, copy));
          }
          return resp;
        })
        .catch(() => caches.match(req))   // 離線：用上次成功抓到的版本
    );
    return;
  }

  // 其他同源資源（圖片／音檔／字型…）：快取優先＋背景更新，寫入執行期快取
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(resp => {
        if (resp.ok && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE_RUNTIME).then(c => c.put(req, copy));
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
