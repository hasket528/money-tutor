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
const SW_VERSION    = '20261015c';
const CACHE_CORE    = 'mt-core-' + SW_VERSION;
const CACHE_RUNTIME = 'mt-runtime';

// 換過內容的資源（音檔、角色圖）：**與 dialogue/sw.js 共用同一份清單**（各自維護必然漂移）。
// 為什麼站根也需要：主頁的店員頭像彈窗用的是 dialogue/ 底下的音檔與角色圖，
// 由這支 SW 攔截，走「快取優先」寫進 mt-runtime，而 mt-runtime 跨版保留
// → 換了聲音／換了圖之後回訪裝置仍是舊的（2026-09-12 使用者回報「漫畫店開場白是男聲」）。
// ⚠️ 用 try 包起來：importScripts 失敗會讓整支 SW 裝不起來，寧可退化成「不清舊音檔」。
try { importScripts('./dialogue/stale-assets.js'); } catch (e) {}
const STALE_ASSETS = self.STALE_ASSETS || [];

// 應用外殼：安裝時預先快取（保持精簡，避免任一檔缺失導致整包安裝失敗）
const PRECACHE = [
  './',
  './index.html',
  './version.txt',
  './manifest.json',
];

// 🔴 Cloudflare 轉址的兩個坑（2026-09-15；dialogue/sw.js 有同一個 unredirect，見 dialogue/CLAUDE.md）：
// Cloudflare Workers 的靜態資源會把 `/index.html` 307 轉到 `/`、`/teacher.html` 轉到 `/teacher`。
// ①fetch 跟著轉址拿到的回應帶 `redirected: true`，拿它回應**頁面導覽**會被瀏覽器拒收 → 整頁 ERR_FAILED。
//   預先快取的 './index.html' 就是這種，離線退回首頁時整頁打不開 → 存進去前、拿出來時都重包。
// ②線上時快取裡存的是轉址後的網址（`/teacher`），連結寫的卻是 `teacher.html`，
//   離線時照連結去查永遠查不到 → htmlCandidates 把兩種寫法都列出來查。
// 回歸測試：tests/_e2e_site_sw_offline.js（伺服器模仿 Cloudflare 轉址、真的註冊 SW、斷網）。
function unredirect(resp) {
  if (!resp || !resp.redirected) return resp;
  return resp.blob().then(body => new Response(body, {
    status: resp.status, statusText: resp.statusText, headers: resp.headers,
  }));
}

// 同一個頁面在快取裡可能是哪些網址：原樣、Cloudflare 轉址後的寫法、沒轉址的伺服器（本機）的寫法
function htmlCandidates(url) {
  const p = url.pathname, out = [p];
  if (p.endsWith('/index.html')) out.push(p.slice(0, -'index.html'.length));
  else if (p.endsWith('.html')) out.push(p.slice(0, -'.html'.length));
  else if (p.endsWith('/')) out.push(p + 'index.html');
  else if (!/\.[a-z0-9]+$/i.test(p)) out.push(p + '.html');
  return out.map(x => url.origin + x);
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_CORE)
      // 單檔失敗不擋整體安裝
      .then(cache => Promise.all(PRECACHE.map(u =>
        fetch(u)
          .then(resp => { if (!resp.ok) throw new Error(u); return unredirect(resp); })
          .then(resp => cache.put(u, resp))
          .catch(() => {})
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      // 🔴 **只清自己名下的舊版**（mt-core-*）。快取是整個網站共用的：原本寫「不是我的兩個就刪」，
      //    會把 dialogue/sw.js 的 shopping-practice-*／shopping-audio-*（老師按「下載語音包」存的離線語音）
      //    一起刪掉；dialogue 那支也反過來刪這邊的——每發一次版就互相清空（2026-09-15 離線測試發現）。
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('mt-core-') && k !== CACHE_CORE).map(k => caches.delete(k))
      ))
      // 執行期快取整包保留（圖與音檔大又幾乎不改），但**裡面的舊程式碼要清掉**：
      // 舊版是快取優先，裝置上可能還躺著幾個月前的 .js；不清的話換了策略也還是先吃到它。
      .then(() => caches.open(CACHE_RUNTIME).then(c =>
        c.keys().then(reqs => Promise.all(
          reqs.filter(r => /\.(js|css)$/i.test(new URL(r.url).pathname)).map(r => c.delete(r))
        ))
      ).catch(() => {}))
      // 重錄過的音檔也要清掉（見檔頭 STALE_ASSETS）：只刪點名的那幾支，
      // 其餘圖與音檔整包保留——換一次聲音就讓全站重下不合理。
      .then(() => caches.open(CACHE_RUNTIME).then(c =>
        c.keys().then(reqs => Promise.all(
          reqs.filter(r => STALE_ASSETS.some(name => r.url.endsWith(name))).map(r => c.delete(r))
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
  // 影片：不經過快取，直接交給瀏覽器（拖曳進度用的 Range 請求回 206，存進快取會失敗或回錯段落；16 MB 也不該進快取）
  if (/\.(mp4|webm)$/i.test(url.pathname) || req.headers.has('range')) return;

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
            Promise.resolve(unredirect(copy))
              .then(clean => caches.open(CACHE_CORE).then(c => c.put(req, clean)))
              .catch(() => {});
          }
          return resp;
        })
        .catch(async () => {
          if (!isHTML) return caches.match(req);
          // 離線：先找這一頁（兩種網址寫法；查詢字串不影響頁面本身，頁面讀的是網址列上的參數），
          // 都沒有才退回首頁。拿出來的一律過 unredirect（舊版 SW 存進去的轉址回應可能還在）。
          for (const u of htmlCandidates(url)) {
            const hit = await caches.match(u, { ignoreSearch: true });
            if (hit) return unredirect(hit);
          }
          const home = await caches.match('./', { ignoreSearch: true }) || await caches.match('./index.html');
          return unredirect(home) || Response.error();
        })
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
