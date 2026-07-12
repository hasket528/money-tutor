// Service Worker — money_tutor 主站（24 單元離線化）
// 策略：
//   ・HTML 導覽 + version.txt：網路優先（線上永遠最新、更新提示條可正常偵測），離線退回快取
//   ・其他同源資源（js/css/圖片/音檔）：快取優先＋背景更新（首次線上開啟後即可離線）
//   ・SW_VERSION 換版即清掉舊的核心快取；執行期快取跨版保留以省流量
// 註：發版時把 SW_VERSION 與根目錄 version.txt、index.html 的 BUILD_VERSION 一起遞增。
const SW_VERSION    = '20260712a';
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

  // 其他同源資源：快取優先＋背景更新，寫入執行期快取
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
