// Service Worker — 購物練習
const CACHE_CORE  = 'shopping-practice-v161';
const CACHE_AUDIO = 'shopping-audio-v3';

// 重錄過的音檔：啟動時只把這幾支從音檔快取移除（cache-first 會自動再抓新檔）。
// 為何不直接 bump CACHE_AUDIO：那會清掉整包已下載語音（上千條），使用者得重下。
// 檔名比對用 endsWith。清單保留數批，讓「跳版更新」的裝置也清得到；累積太長時再整批清空。
const STALE_AUDIO = [
  // 2026-07-30 換音色（Pulcherrima 女店長）
  'call_leave_intro.mp3',
  'call_leave_sick_leave_call_sick.mp3',
  'call_leave_sick_leave_say_proof.mp3',
  'call_leave_sudden_leave_call_sudden.mp3',
  'call_leave_sudden_leave_agree_makeup.mp3',
  'call_leave_late_notice_call_late.mp3',
  'call_leave_late_notice_arrive_soon.mp3',
  // 2026-07-30 改名阿豪→小藍＋換音色（Laomedeia 女救生員）
  'swimming_pool_intro.mp3',
  'swimming_pool_pool_ticket_buy_ticket.mp3',
  'swimming_pool_pool_ticket_pay_pool.mp3',
  'swimming_pool_pool_ticket_ask_rule.mp3',
  'swimming_pool_pool_locker_know_deposit.mp3',
  'swimming_pool_pool_locker_get_back.mp3',
  'swimming_pool_pool_lost_describe_item.mp3',
  'swimming_pool_pool_lost_thank_found.mp3',
  // 2026-08-13 便利商店・基本購物：商品由餅乾改巧克力（檔名不變、內容已重錄）
  'convenience_store_basic_ask_price.mp3',
  'convenience_store_basic_purchase.mp3',
  // 2026-08-14 便利商店：開場白統一「你好！歡迎光臨！」、基本購物巧克力改 50 元（找零同步）
  'convenience_store_basic_greeting.mp3',
  'convenience_store_basic_goodbye.mp3',
  'convenience_store_not_enough_money_greeting.mp3',
  // 2026-08-14 這批 greeting 的音檔內容自 7 月起就停在舊句「你好！請問有什麼需要幫忙的嗎？」
  //（資料檔文字早已是「你好！歡迎光臨！」，稽核比對不到音檔實際唸的內容），已全部重錄
  'convenience_store_cant_find_item_greeting.mp3',
  'convenience_store_expired_product_greeting.mp3',
  'convenience_store_unknown_greeting.mp3',
  // 2026-08-14 超市・基本購物：蘋果改單顆計價（35 元 ×3＝105 元），總價與找零同步
  'supermarket_basic_confirm_purchase.mp3',
  'supermarket_basic_checkout.mp3',
  'supermarket_basic_goodbye.mp3',
  // 2026-08-14 文具店・基本購買：商品改原子筆 20 元＋修正帶 45 元（總價與規格詢問同步）
  'stationery_store_basic_ask_spec.mp3',
  'stationery_store_basic_checkout.mp3',
  // 2026-08-14 麵包店／美妝店：加入看標價與數錢包兩步，商品數量與總價同步（檔名不變、內容已重錄）
  'bakery_basic_purchase.mp3',
  'bakery_basic_checkout.mp3',
  'beauty_store_basic_purchase.mp3',
  'bakery_basic_greeting.mp3',   // 開場白縮短為「你好！歡迎光臨！」，找麵包種類移到第 2 句
];

const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './data/frames.js',
  './data/scenarios.js',
  './data/clerk_gender.js',
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
      // 重錄過的音檔：只刪這幾支，其餘已下載語音保留
      .then(() => caches.open(CACHE_AUDIO))
      .then(cache => cache.keys().then(reqs => Promise.all(
        reqs
          .filter(r => STALE_AUDIO.some(name => r.url.endsWith(name)))
          .map(r => cache.delete(r))
      )))
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
        urls: keys.map(r => r.url),
      });
    })
  );
});
