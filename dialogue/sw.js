// Service Worker — 購物練習
const CACHE_CORE  = 'shopping-practice-v92';
const CACHE_AUDIO = 'shopping-audio-v2';

const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './data/frames.js',
  './data/scenarios.js',
  './manifest.json',
  './icon.svg',
];

// 安裝：預先快取核心檔案
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_CORE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// 啟動：刪除舊版快取（保留音檔快取）
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_CORE && k !== CACHE_AUDIO)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// 攔截請求
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // 音效（sfx）：網路優先，快取備援
  if (url.includes('/audio/units/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // 語音音檔（clerk / feedback）：快取優先（由 cacheAudioFiles 訊息主動填入）
  if (url.includes('/audio/clerk/') || url.includes('/audio/feedback/')) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  // 核心資源：快取優先，背景更新
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetched = fetch(event.request).then(response => {
        if (response.ok) {
          caches.open(CACHE_CORE).then(c => c.put(event.request, response.clone()));
        }
        return response;
      });
      return cached || fetched;
    })
  );
});

// 接收主頁面的「快取音檔」指令
self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_AUDIO') return;
  const urls = event.data.urls || [];
  caches.open(CACHE_AUDIO).then(cache => {
    let done = 0;
    const total = urls.length;
    const results = { cached: 0, failed: 0 };

    if (total === 0) {
      event.source?.postMessage({ type: 'CACHE_AUDIO_DONE', ...results });
      return;
    }

    urls.forEach(url => {
      fetch(url)
        .then(resp => {
          if (resp.ok) { cache.put(url, resp); results.cached++; }
          else results.failed++;
        })
        .catch(() => { results.failed++; })
        .finally(() => {
          done++;
          // 回報進度
          event.source?.postMessage({ type: 'CACHE_AUDIO_PROGRESS', done, total });
          if (done === total) {
            event.source?.postMessage({ type: 'CACHE_AUDIO_DONE', ...results });
          }
        });
    });
  });
});

// 查詢目前音檔快取清單
self.addEventListener('message', event => {
  if (event.data?.type !== 'GET_CACHED_AUDIO') return;
  caches.open(CACHE_AUDIO).then(cache =>
    cache.keys().then(keys => {
      event.source?.postMessage({
        type: 'CACHED_AUDIO_LIST',
        urls: keys.map(r => r.url),
      });
    })
  );
});
