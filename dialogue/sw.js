// Service Worker — 購物練習
const CACHE_CORE  = 'shopping-practice-v387';
const CACHE_AUDIO = 'shopping-audio-v3';

// 換過內容的資源（重錄的音檔、換掉的角色圖）：啟動時把這幾支從快取移除（cache-first 會自動再抓新檔）。
// 清單搬到 stale-assets.js（**與站根 sw.js 共用同一份**，兩邊各自維護必然漂移）。
// ⚠️ 用 try 包起來：importScripts 失敗會讓整支 SW 裝不起來，寧可退化成「不清舊音檔」。
try { importScripts('./stale-assets.js'); } catch (e) {}
const STALE_ASSETS = self.STALE_ASSETS || [];
// 整個資料夾一起重生時（例：回饋語 2244 條全部重錄）用「路徑片段＋批次標籤」，**每台裝置只清一次**：
// 清完在音檔快取裡留一個標記，之後每次發版不會再把已經重新下載的檔案清掉。
// （STALE_ASSETS 的逐一點名是每次啟動都清——名字少時無所謂，放上千個就等於每發一次版全部重下）
const STALE_PREFIXES = self.STALE_PREFIXES || [];
const STALE_MARK = '__stale-mark__/';

const PRECACHE = [
  './',
  './index.html',
  './style.css',
  '../js/hero-modal.js',
  '../css/hero-modal.css',
  '../js/detective-hint.js',     // 小金探點擊彈窗（全站共用，2026-09-27）
  '../js/learning-tracker.js',   // 無錯通過徽章（與 24 單元共用，2026-09-27）
  '../js/eval-core.js',          // 評量核心（learning-tracker.js 自動載入，2026-10-08）
  '../js/result-voice.js',       // 完成頁結算音效分四段（與 24 單元共用，2026-10-02）
  '../css/detective-hint.css',
  '../js/tablet-layout.js',       // iPad 橫式版面判斷＋規則（與 24 單元共用，2026-10-03）
  '../css/tablet-landscape.css',
  './custom-scenes.js',
  './script.js',
  './data/frames.js',
  './data/tips.js',
  './data/scenarios.js',
  './data/clerk_gender.js',
  './js/step_rules.js',
  './data/topic_presets.js',
  './manifest.json',
  './icon.svg',
];

// 🔴 「轉址過的回應」不可以交給頁面導覽（2026-09-15 正式站實測）：
// Cloudflare Workers 會把 `/dialogue/index.html` 307 轉到 `/dialogue/`，fetch 跟著轉址後拿到的回應
// 帶 `redirected: true`。這種回應存進快取、再拿去回應頁面導覽，瀏覽器會拒收 → 整頁 ERR_FAILED。
// 回訪的人點導覽列「生活情境對話」（href＝index.html）、主頁與 teacher.html 的連結都會中。
// 做法＝存進快取前、從快取拿出來時，都把它重包成一個普通的回應（內容一樣，只是不帶轉址標記）。
// 回歸測試：tests/_e2e_sw_redirect.js（伺服器模仿 Cloudflare 的轉址、真的註冊 SW）。
function unredirect(resp) {
  if (!resp || !resp.redirected) return resp;
  return resp.blob().then(body => new Response(body, {
    status: resp.status, statusText: resp.statusText, headers: resp.headers,
  }));
}

// 安裝：預先快取核心檔案（任一支抓不到就整包失敗，同 cache.addAll；差別只在轉址過的回應要重包）
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_CORE)
      .then(cache => Promise.all(PRECACHE.map(u =>
        fetch(u)
          .then(resp => {
            if (!resp.ok) throw new Error(`預先快取失敗：${u}（${resp.status}）`);
            return unredirect(resp);
          })
          .then(resp => cache.put(u, resp))
      )))
      .then(() => self.skipWaiting())
  );
});

// 啟動：刪除舊版快取（保留音檔快取）
// 🔴 **只清自己名下的舊版**（shopping-practice-*／shopping-audio-*）。快取是整個網站共用的：
//    原本寫「不是我的兩個就刪」，會把站根 sw.js 的 mt-core-*／mt-runtime（24 單元離線用的頁面、圖、音檔）
//    一起刪掉；站根那支也反過來刪這邊的——每發一次版就互相清空（2026-09-15 離線測試發現）。
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => (k.startsWith('shopping-practice-') && k !== CACHE_CORE) ||
                       (k.startsWith('shopping-audio-') && k !== CACHE_AUDIO))
          .map(k => caches.delete(k))
      ))
      // 重錄過的音檔：只刪這幾支，其餘已下載語音保留
      .then(() => caches.open(CACHE_AUDIO))
      .then(cache => cache.keys().then(reqs => {
        const done = new Set(reqs.map(r => r.url).filter(u => u.includes(STALE_MARK))
                                 .map(u => u.slice(u.indexOf(STALE_MARK) + STALE_MARK.length)));
        const pending = STALE_PREFIXES.filter(p => p && p.path && p.tag && !done.has(p.tag));
        return Promise.all(
          reqs
            .filter(r => !r.url.includes(STALE_MARK))
            .filter(r => STALE_ASSETS.some(name => r.url.endsWith(name)) || pending.some(p => r.url.includes(p.path)))
            .map(r => cache.delete(r))
        ).then(() => Promise.all(pending.map(p =>
          cache.put(new Request(self.registration.scope + STALE_MARK + p.tag), new Response('cleared')))));
      }))
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

  // 語音音檔（clerk / feedback / chatbot）：快取優先（由 cacheAudioFiles 訊息主動填入）
  // ⚠️ /audio/chatbot/ 是**站根**目錄（小百科卡片、完成頁鼓勵語、首頁角色語音），
  //    但請求由 dialogue 頁面發出，所以還是這支 SW 在攔。少了這一條它會掉進下面的
  //    「核心資源」分支被塞進 CACHE_CORE——而 CACHE_CORE 每次 bump 版本就整包清掉，
  //    等於每發一次版，這些音檔全部要重抓。
  if (url.includes('/audio/clerk/') || url.includes('/audio/feedback/') || url.includes('/audio/chatbot/')) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  // 站根共用程式（../js/*.js：學生選擇列、IEP 目標提醒、學習紀錄…）：網路優先，離線才用快取（2026-10-09）
  // ⚠️ 這些檔案在 dialogue/ 外面，改了不會讓 deploy.ps1 遞增這裡的 CACHE_CORE；走下面的「快取優先」
  //    會一直先拿到舊版——實例：設定頁選了學生卻不出現 IEP 目標（24 單元由站根 SW 管，沒有這個問題）
  const u = new URL(url);
  if (u.origin === self.location.origin && /\/js\/[^/]+\.js$/.test(u.pathname) && !u.pathname.includes('/dialogue/')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_CORE).then(c => c.put(event.request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => caches.match(event.request).then(c => c || Response.error()))
    );
    return;
  }

  // 核心資源：快取優先，背景更新
  // ⚠️ 從快取拿出來的也要過 unredirect：舊版 SW 存進去的轉址回應可能還在（見上方 unredirect 的說明）
  // ⚠️ 頁面導覽查快取要忽略查詢字串：主頁的場所卡是 `index.html?scenario=<id>`，每個 id 都不一樣，
  //    照原樣查永遠查不到 → 離線時整頁打不開（2026-09-15）。同一個 HTML，參數由頁面自己讀網址列。
  //    同一個 HTML 也跟快取裡的 script.js 同版，比「HTML 抓網路、JS 吃快取」一致。
  const isNav = event.request.mode === 'navigate';
  event.respondWith(
    caches.match(event.request, isNav ? { ignoreSearch: true } : undefined).then(cached => {
      const fetched = fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          Promise.resolve(unredirect(copy))
            .then(clean => caches.open(CACHE_CORE).then(c => c.put(event.request, clean)))
            .catch(() => {});
        }
        return response;
      });
      if (cached) {
        fetched.catch(() => {});          // 離線時背景更新失敗是預期的，不要丟未處理的 rejection
        return unredirect(cached);
      }
      // 離線又沒快取過這一頁：退回模組首頁（還是同一個 index.html），不要整頁打不開
      return isNav
        ? fetched.catch(() => caches.match('./', { ignoreSearch: true }).then(h => unredirect(h) || Response.error()))
        : fetched;
    })
  );
});

// 接收主頁面的「快取音檔」指令
// 版本查詢：頁面用它比對「程式版本」與「SW 實際在用的快取版本」。
// 兩者不一致＝這個分頁還在跑快取裡的舊程式，是最常見的「改了卻沒生效」原因。
self.addEventListener('message', event => {
  if (event.data?.type !== 'GET_VERSION') return;
  event.ports?.[0]?.postMessage({ version: CACHE_CORE });
});

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
        urls: keys.map(r => r.url).filter(u => !u.includes(STALE_MARK)),   // 批次清除標記不是音檔
      });
    })
  );
});
