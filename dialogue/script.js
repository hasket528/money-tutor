// ─── 對話引擎（抽象層）────────────────────────────
// 這個介面設計讓未來可以直接替換成 LLM 引擎，前端不用改動

class DialogueEngine {
  evaluate(input, step) { throw new Error('未實作'); }
}

class RuleBasedEngine extends DialogueEngine {
  evaluate(input, step) {
    const text = input.trim();
    const detected = step.keywords.filter(kw => text.includes(kw));
    if ((step.keywords_mode || 'all') === 'any') {
      if (detected.length > 0) return { score: 'perfect', detected };
      return { score: 'failed', detected: [] };
    }
    if (detected.length >= step.keywords.length) return { score: 'perfect', detected };
    if (detected.length > 0)                     return { score: 'partial',  detected };
    return { score: 'failed', detected: [] };
  }
}

// ─── LLM 評分引擎（Gemini API）──────────────────────
// 需在設定頁填入 Gemini API Key 才會啟用，否則自動 fallback 到規則引擎

class LLMEngine extends DialogueEngine {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  }

  async evaluate(input, step) {
    const prompt = `你是一位評分助手，負責評估學生的對話練習。

任務：${step.task}
學生應說的參考答案：${step.accepted_phrases?.join('、') || ''}
學生實際說的：${input}

請判斷學生的回答是否達成任務，回傳 JSON：
{"score": "perfect"|"partial"|"failed", "reason": "一句話說明"}

評分標準：
- perfect：語意正確，達成溝通目的
- partial：部分正確，有說到關鍵點但不完整
- failed：完全離題或未達成溝通目的`;

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 128 },
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data  = await res.json();
      const text  = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(text);
      return { score: parsed.score || 'failed', detected: [], reason: parsed.reason };
    } catch {
      // API 失敗時 fallback 到規則引擎
      return new RuleBasedEngine().evaluate(input, step);
    }
  }
}

// 啟動引擎：有 API Key → LLM，否則 → 規則引擎
function createEngine() {
  const key = localStorage.getItem('gemini_api_key');
  return key ? new LLMEngine(key) : new RuleBasedEngine();
}

let engine = createEngine();


// ─── 語音容錯系統 ────────────────────────────────────

// STT 常見辨識錯誤對應表：[錯誤辨識, 正確詞]
const PRONUNCIATION_MAP = [
  // 疑問代詞（最常見：那→哪）
  ['那裡', '哪裡'], ['那里', '哪裡'], ['哪里', '哪裡'], ['那裏', '哪裡'],
  ['那邊', '哪邊'],

  // 數量／價格
  ['多小', '多少'], ['多紹', '多少'],
  ['幾快', '幾塊'], ['機塊', '幾塊'],
  ['怎賣', '怎麼賣'],

  // 付款
  ['付線', '付現'], ['付現今', '付現金'],
  ['現今', '現金'], ['現近', '現金'],
  ['刷可', '刷卡'], ['刷卡機', '刷卡'],
  ['悠遊', '悠遊卡'],

  // 食物／飲料
  ['單餅', '蛋餅'], ['旦餅', '蛋餅'],
  ['珍珠拿茶', '珍珠奶茶'], ['珍珠那茶', '珍珠奶茶'],
  ['大盃', '大杯'], ['小盃', '小杯'],

  // 動作
  ['加旦', '加蛋'], ['家蛋', '加蛋'],
  ['稱重', '秤重'],
  ['試穿看看', '試穿'], ['試穿一下', '試穿'],

  // 問候
  ['哈嘍', '哈囉'], ['哈喂', '哈囉'],

  // 同音字（STT 常把「訂」聽成「定」）
  ['定位', '訂位'], ['定個位', '訂個位'], ['定餐', '訂餐'],

  // 時間口語變體（「晚上六點」≈「今晚六點」；順序重要：先處理帶「明天」的組合，再處理單獨「晚上」）
  ['今天晚上', '今晚'], ['明天晚上', '明晚'], ['晚上', '今晚'],

  // STT 常加上的贅詞
  ['請問一下', '請問'],
  ['謝謝你', '謝謝'], ['謝謝您', '謝謝'],
  ['好的好的', '好的'], ['可以可以', '可以'],
  ['頭疼', '頭痛'],
];

// 阿拉伯數字時間 → 中文（如 STT 的「6點」→「六點」；時間用「兩點」不用「二點」）
const _HOUR_CH = { '1':'一', '2':'兩', '3':'三', '4':'四', '5':'五', '6':'六', '7':'七', '8':'八', '9':'九' };

// 移除語助詞並套用對應表
function normalizePronunciation(text) {
  let t = text
    .replace(/\s+/g, '')
    .replace(/[啊呢吧喔唷囉嗎耶欸呀哦哩]+$/g, '');
  // 單獨的個位數小時：6點→六點（前面不接數字，避免 12點 被誤改）
  t = t.replace(/(?<![0-9])([1-9])點/g, (_, d) => _HOUR_CH[d] + '點');
  for (const [wrong, correct] of PRONUNCIATION_MAP) {
    t = t.split(wrong).join(correct);
  }
  return t.trim();
}

// 計算中文字數（一字 = 一音節）
function countChinese(text) {
  return (text.match(/[一-鿿㐀-䶿]/g) || []).length;
}

// 兩段文字的音節比率（0~1）
function syllableRatio(a, b) {
  const ca = countChinese(a), cb = countChinese(b);
  if (!ca || !cb) return 0;
  return Math.min(ca, cb) / Math.max(ca, cb);
}


// ─── 語音輸入（Web Speech API）──────────────────────

class SpeechRecognizer {
  constructor() {
    const API = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!API) { this.supported = false; return; }
    this.supported     = true;
    this._sessionActive = false;  // rec.start() 是否已呼叫
    this._listening     = false;  // 目前是否要接受辨識結果
    this._flushing      = false;  // 正在清空緩衝（abort 重啟中），onend 不得結束聆聽
    this._onResult = null;
    this._onError  = null;
    this._onEnd    = null;

    this.rec = new API();
    this.rec.lang           = 'zh-TW';
    this.rec.continuous     = true;   // 整個 session 只 start() 一次，不重複觸發授權提示
    this.rec.interimResults = false;

    // 內部 handler：只在 _listening 旗標為 true 時才回傳結果
    this.rec.onresult = (e) => {
      if (!this._listening) return;
      const last = e.results[e.results.length - 1];
      if (!last.isFinal) return;
      this._listening = false;
      const text = last[0].transcript;
      this._onResult?.(text);
      this._onEnd?.();
    };
    this.rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (!this._listening) return;
      this._listening = false;
      this._onError?.(e.error);
    };
    // continuous 模式下 onend 代表 session 意外中斷（網路逾時等），自動重啟
    this.rec.onend = () => {
      if (this._sessionActive) {
        try { this.rec.start(); } catch (_) {}
      }
      // 主動 abort 清空緩衝時，不要把聆聽狀態關掉
      if (this._flushing) { this._flushing = false; return; }
      if (this._listening) {
        this._listening = false;
        this._onEnd?.();
      }
    };
  }

  // 進入練習頁時呼叫一次：取得麥克風授權並啟動辨識 session
  async beginSession() {
    if (!this.supported || this._sessionActive) return;
    // getUserMedia 先拿授權（只問一次），之後 rec.start() 不再跳提示
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      } catch (_) {}
    }
    this._sessionActive = true;
    try { this.rec.start(); } catch (_) { this._sessionActive = false; }
  }

  // 離開練習頁時呼叫：結束 session
  endSession() {
    this._sessionActive = false;
    this._listening     = false;
    if (this.supported) try { this.rec.stop(); } catch (_) {}
  }

  // 按下麥克風按鈕：設定本次要接受的 callback，並確保 session 已啟動
  start(onResult, onError, onEnd) {
    if (!this.supported) { onError('not-supported'); return; }
    this._onResult  = onResult;
    this._onError   = onError;
    this._onEnd     = onEnd;
    this._listening = true;
    if (!this._sessionActive) { this.beginSession(); return; }
    // 清空按下之前累積的辨識緩衝（喇叭播出的店員語音會被收音轉成文字，
    // 若不清掉，會在按下後被當成學生說的話送出）。abort 後 onend 自動重啟新 session。
    this._flushing = true;
    try { this.rec.abort(); } catch (_) { this._flushing = false; }
  }

  // 放開麥克風按鈕（若有 pointerup 需求）：停止接受結果，但不停 session
  stop() {
    this._listening = false;
  }

  // 向後相容：startWithDifficulty 呼叫 requestPermission()
  requestPermission() { this.beginSession(); }
}


// ─── 音效系統 ────────────────────────────────────────

const sfx = {
  _play(file) {
    const audio = new Audio('audio/units/' + file);
    audio.volume = 0.7;
    audio.play().catch(() => {});
  },
  click()    { this._play('select.mp3'); },
  correct()  { this._play('correct02.mp3'); },
  // partial 用中性音效：說對一半時不該聽到和失敗一樣的錯誤音
  partial()  { this._play('select.mp3'); },
  failed()   { this._play('error.mp3'); },
  complete() { this._play('success.mp3'); },
};


// ─── 語音角色管理 ────────────────────────────────────

// 已知語音的顯示名稱與性別對應表（用於比對 getVoices() 回傳的完整名稱）
const VOICE_INFO = [
  { keyword: 'Yating',      name: '小美', gender: 'female', isDefault: true, image: 'images/clerk-yating.jpg',     role: '便利商店' },
  { keyword: 'Zhiwei',      name: '阿豪', gender: 'male',                    image: 'images/clerk-zhiwei.jpg',     role: '速食店' },
  { keyword: '曉臻',        name: '阿芬', gender: 'female',                  image: 'images/clerk-xiaozheng.jpg',  role: '超市' },
  { keyword: '雲哲',        name: '阿宏', gender: 'male',                    image: 'images/clerk-yunzhe.jpg',     role: '文具店' },
  { keyword: '曉雨',        name: '小雅', gender: 'female',                  image: 'images/clerk-xiaoyu.jpg',     role: '服飾店' },
  { keyword: 'Google 國語', name: 'Google', gender: 'neutral' },
  { keyword: 'Google',      name: 'Google', gender: 'neutral' },
  { keyword: '晓晓',        name: '阿香', gender: 'female',                  image: 'images/clerk-xiaoxiao.png',   role: '早餐店' },
  { keyword: '云希',        name: '阿財', gender: 'male',                    image: 'images/clerk-yunxi.jpg',      role: '夜市' },
  { keyword: '云健',        name: '阿祥', gender: 'male',                    image: 'images/clerk-yunjian.jpg',    role: '超市' }, // 專屬「超市收銀員」圖待生成（見 clerk-avatar-prompts.md #9）；未生成前語音選擇器退回 emoji
  { keyword: '晓伊',        name: '淑惠', gender: 'female',                  image: 'images/clerk-xiaoyi.jpg',     role: '藥局' },
  { keyword: '云扬',        name: '阿義', gender: 'male',                    image: 'images/clerk-yunyang.jpg',    role: '早餐店' },
  { keyword: '晓辰',        name: '阿柔', gender: 'female',                  image: 'images/clerk-bakery.png',     role: '麵包店' },
  { keyword: '晓梦',        name: '萱萱', gender: 'female',                  image: 'images/clerk-beauty.png',     role: '美妝雜貨店' },
  { keyword: '晓睿',        name: '小茜', gender: 'female',                  image: 'images/clerk-drink.png',      role: '手搖飲料店' },
  { keyword: '云枫',        name: '老王', gender: 'male',                    image: 'images/clerk-lunchbox.png',   role: '便當店' },
  { keyword: '云野',        name: '阿澄', gender: 'male',                    image: 'images/clerk-coffee.png',     role: '咖啡店' },
  { keyword: '晓涵',        name: '阿珍', gender: 'female',                  image: 'images/clerk-postoffice.png', role: '郵局櫃臺' },
  { keyword: '晓墨',        name: '靜姐', gender: 'female',                  image: 'images/clerk-library.png',    role: '圖書館' },
  { keyword: '云泽',        name: '阿凱', gender: 'male',                    image: 'images/clerk-police.png',     role: '警察局' },
];

const GENDER_AVATAR = { female: '👩', male: '👨', neutral: '🧑' };

// 場所 → 店員對應（含開場介紹詞）
const SCENARIO_CLERK_MAP = {
  convenience_store: { keyword: 'Yating', intro: '你好！我是便利商店的店員小美。在這裡你可以練習詢問商品在哪裡、結帳付款，還有找零錯誤時怎麼說。點卡片就可以開始練習囉！' },
  breakfast_shop:    { keyword: '晓晓',   intro: '早安！我是早餐店的店員。在這裡你可以練習點餐、詢問今日招牌，還有等太久時怎麼有禮貌地開口問。' },
  supermarket:       { keyword: '曉臻',   intro: '你好！我是超市的服務人員阿芬。在這裡你可以練習找商品、請人幫忙秤重，還有錢不夠或商品有問題時怎麼應對。' },
  night_market:      { keyword: '云希',   intro: '嗨！我是夜市的攤販。在這裡你可以練習點飲料、詢問價格，甚至試試看跟老闆議價喔！' },
  pharmacy:          { keyword: '晓伊',   intro: '你好！我是藥局的藥師。在這裡你可以練習說明症狀、詢問藥的用法，還有藥缺貨時怎麼應對。' },
  clothing_store:    { keyword: '曉雨',   intro: '你好！我是服飾店的店員小雅。在這裡你可以練習詢問尺寸、要求試穿，還有想退換貨時怎麼說。' },
  fast_food:         { keyword: 'Zhiwei', intro: '嗨！我是速食店的服務員。在這裡你可以練習點餐、客製化你的餐點，還有餐點等太久時怎麼開口問。' },
  stationery_store:  { keyword: '雲哲',   intro: '你好！我是文具店的店員阿宏。在這裡你可以練習找文具、詢問特賣活動，還有遇到找零問題時怎麼說。' },
  phone_reservation: { keyword: 'Yating', name: '小晴', role: '電話客服', image: 'images/clerk-phone.png',      intro: '你好！在這裡你可以練習打電話預約——包括診所掛號、髮廊剪髮和餐廳訂位。說話要清楚，讓對方聽得懂喔！' },
  ask_directions:    { keyword: 'Yating', name: '小芸', role: '熱心路人', image: 'images/clerk-directions.png', intro: '你好！在這裡你可以練習在外面問路——問捷運站、公車站，還有迷路時怎麼跟路人求助。「不好意思」要先說！' },
  bakery:            { keyword: '晓辰',   intro: '你好！我是麵包店的老闆阿柔。在這裡你可以練習詢問麵包口味、購買點心，還有麵包賣完時怎麼辦。剛出爐的麵包最香囉！' },
  beauty_store:      { keyword: '晓梦',   intro: '你好！我是美妝雜貨店的店員萱萱。在這裡你可以練習找保養品、請店員推薦商品，還有詢問特價活動怎麼說。' },
  drink_shop:        { keyword: '晓睿',   intro: '你好！我是手搖飲料店的店員小茜。在這裡你可以練習點飲料、說出甜度冰塊，還有點錯了要怎麼禮貌地更正。' },
  lunchbox_shop:     { keyword: '云枫',   intro: '你好！我是便當店的老闆老王。在這裡你可以練習點便當、詢問今日特餐，還有等太久時怎麼有禮貌地開口問。' },
  coffee_shop:       { keyword: '云野',   intro: '你好！我是咖啡店的店員阿澄。在這裡你可以練習點咖啡、詢問座位插座，還有點錯口味時怎麼更正。' },
  post_office:       { keyword: '晓涵',   intro: '你好！我是郵局櫃檯人員阿珍。在這裡你可以練習寄包裹、買郵票，還有詢問多久會送到怎麼說。' },
  library:           { keyword: '晓墨',   intro: '你好！我是圖書館的館員靜姐。在這裡你可以練習借書、辦借書證，還有還書逾期時怎麼禮貌地應對。' },
  police_station:    { keyword: '云泽',   intro: '你好！我是警察局的警員阿凱。在這裡你可以練習報案、遺失物招領，還有遇到危險時怎麼向警察求助。' },
  anti_scam:         { keyword: '云希', name: '阿威', role: '反詐騙宣導員', image: 'images/clerk-antiscam.jpg', intro: '你好！我是反詐騙宣導員阿威。在這裡你可以練習接到詐騙電話怎麼保護自己，像是中獎詐騙、假客服、借提款卡、買點數。記住四步：不給錢、不給資料、掛電話、告訴大人！' },
  classmate_borrow:  { keyword: 'Zhiwei', name: '小傑', role: '同班同學', image: 'images/clerk-classmate.jpg', intro: '嗨，我是你的同學小傑！這裡練習同學跟你借錢時怎麼辦——要不要借、借了怎麼記下來、約好還錢時間、怎麼開口把錢要回來，還有怎麼好好拒絕。' },
  online_scam:       { keyword: '云枫', name: '阿睿', role: '網路安全老師', image: 'images/clerk-onlinescam.jpg', intro: '你好！我是網路安全老師阿睿。在這裡你可以練習在網路上遇到陌生人要你花錢時怎麼保護自己，像是假網拍叫你先匯款、中獎簡訊叫你點連結。記住：不先匯款、不點陌生連結、不給帳號密碼！' },
  self_protect:      { keyword: '云泽', name: '安安', role: '金錢安全老師', image: 'images/clerk-selfprotect.jpg', intro: '你好！我是金錢安全老師安安。在這裡你可以練習怎麼主動保護自己的錢，像是被人勒索要錢怎麼辦、錢和密碼怎麼保管好、撿到別人的錢怎麼處理。' },
  job_scam:          { keyword: '云枫', name: '阿全', role: '打工防詐老師', image: 'images/clerk-jobguard.jpg', intro: '你好！我是打工防詐老師阿全。在這裡你可以練習找打工時怎麼保護自己，像是有人要你先繳保證金、押證件，或說有太好賺的工作。記住三不：不先繳錢、不押證件、不借帳戶！' },
  privacy_protect:   { keyword: '云希', name: '小薇', role: '資安老師', image: 'images/clerk-privacy.jpg', intro: '你好！我是資安老師小薇。在這裡你可以練習保護個人資料，像是驗證碼不唸給別人、問卷個資不亂填、帳號密碼不外借。記住：個資就像家裡的鑰匙，不能隨便交出去！' },
  take_bus:          { keyword: '云扬', name: '阿原', role: '公車', image: 'images/clerk-takebus.jpg', intro: '你好！我是公車司機阿原，在這裡你可以練習搭公車——包括先確認路線、上車刷卡或投現，還有零錢不夠、坐過站的時候怎麼開口求助。' },
  mrt_station:       { keyword: '云健', name: '阿潔', role: '捷運站', image: 'images/clerk-mrtstaff.jpg', intro: '你好！我是捷運站務員阿潔。在這裡你可以練習搭捷運，包括不會買票請人教、卡片刷不過去要加值、搭錯方向怎麼問。有問題找站務員就對了！' },
  train_ticket:      { keyword: '晓涵', name: '惠姐', role: '火車站售票口', image: 'images/clerk-trainticket.jpg', intro: '你好！我是火車站售票口的惠姐。在這裡你可以練習到售票口買票，包括說清楚目的地和車種、付錢確認找零、問月台，還有趕不上車、車票不見時怎麼辦。' },
  taxi:              { keyword: '雲哲', name: '陳伯', role: '計程車', image: 'images/clerk-taxi.jpg', intro: '你好！我是計程車司機陳伯。在這裡你可以練習搭計程車，包括上車前先問價錢確認預算、說清楚目的地、下車付錢確認找零，不舒服也要開口說。' },
  easycard_service:  { keyword: '晓梦', name: '小雲', role: '悠遊卡服務台', image: 'images/clerk-easycard.jpg', intro: '你好！我是悠遊卡服務台的服務員小雲，在這裡你可以練習，加值後確認餘額、卡片掉了趕快掛失、辦學生卡要帶什麼。' },
  ride_manner:       { keyword: '曉雨', name: '車長', role: '車廂禮儀', image: 'images/clerk-ridemanner.jpg', intro: '你好，我是車長，在這裡你可以練習車廂裡的禮儀與求助——像是讓座給需要的人、有禮貌請人幫忙，還有陌生人跟你要錢時怎麼拒絕、找站務員' },
  cinema:            { keyword: '晓辰', name: '阿哲', role: '電影院', image: 'images/clerk-cinema.jpg', intro: '你好！我是電影院服務員阿哲。在這裡你可以練習買電影票，包括選場次、用學生證買優惠票、加購前想想預算，遲到了也知道怎麼辦。' },
  ktv:               { keyword: '晓睿', name: '小雅', role: 'KTV', image: 'images/clerk-ktv.jpg', intro: '歡迎光臨！我是 KTV 服務員小雅。在這裡你可以練習問清楚計費、算總價大家分攤、時間到照預算收手，還有點歌機不會用怎麼請人教。' },
  swimming_pool:     { keyword: '晓晓', name: '游泳池店員', role: '游泳池', image: 'images/clerk-pool.jpg', intro: '你好！我是游泳池的服務人員。這裡練習買學生票、租置物櫃認識「押金」、東西不見了到服務台找回來。' },
  amusement_park:    { keyword: '晓伊', name: '小樂', role: '遊樂園', image: 'images/clerk-park.jpg', intro: '歡迎光臨，我是遊樂園的工作人員小樂，在這裡你可以練習算一算哪種票划算、問設施安全限制，還有和朋友走散時找工作人員、在原地等。' },
  arcade:            { keyword: '曉臻', name: '阿翔', role: '電子遊樂場', image: 'images/clerk-arcade.jpg', intro: '歡迎光臨！我是遊樂場店員阿翔。在這裡，你可以練習換代幣控制預算、夾娃娃先設上限說到做到，機台吃錢不拍不踢找店員。' },
  comic_store:       { keyword: '云野', name: '小新', role: '漫畫店', image: 'images/clerk-comic.jpg', intro: '歡迎光臨！我是漫畫店的店員小新，在這裡你可以練習租書認識押金和逾期費、遲還了誠實道歉，還有辦會員時哪些資料能給、哪些不能給。' },
  job_interview:     { keyword: '云泽', name: '阿宏店長', role: '打工面試', image: 'images/clerk-jobinterview.jpg', intro: '你好！我是阿宏店長。在這裡你可以練習打工面試，包括自我介紹、誠實回答問題，還有問清楚時薪和發薪日；遇到要先繳錢的，記得先回家問大人喔！' },
  first_day:         { keyword: 'Zhiwei', name: '前輩同事', role: '第一天上班', image: 'images/clerk-firstday.jpg', intro: '嗨，我是帶你的前輩！這裡練習第一天報到——主動打招呼、聽工作說明複誦重點、問清楚制服和置物，好的開始是成功的一半！' },
  ask_at_work:       { keyword: '云健', name: '資深同事', role: '工作中求助', image: 'images/clerk-senior.jpg', intro: '這裡練習工作中最重要的能力——聽不懂就問、做錯了主動承認、不會操作請人示範。不裝懂的人進步最快！' },
  call_leave:        { keyword: 'Yating', name: '林店長', role: '電話請假', image: 'images/clerk-callleave.jpg', intro: '你好！我是店裡的林店長。在這裡你可以練習打電話請假，包括生病提早說、臨時有事誠心道歉配合補班、要遲到先通知。' },
  get_paid:          { keyword: '晓涵', name: '會計阿姨', role: '領薪水', image: 'images/clerk-payday.jpg', intro: '你好！這裡練習領薪水——時薪乘時數自己算一次、當面點清楚、發現算錯有禮貌反映，最後別忘了先存一部分，這是理財的開始！' },
  serve_customer:    { keyword: '曉雨', name: '客人', role: '接待客人', image: 'images/clerk-customer.jpg', intro: '這次換你當店員囉！練習歡迎光臨和謝謝光臨、被客人問倒了找懂的人、客人不高興先道歉再請主管——把學過的對話換邊用用看！' },
};

// 固定 5 個學生角色（頭像用 emoji + 色圓）
const STUDENT_PROFILES = [
  // voiceKeyword：瀏覽器 Web Speech 用（Edge 內建、免安裝，發佈給他人也能用）。
  // fileKey：對應 audio/student/stu_{fileKey}_{hash}.wav 預錄檔（見 voicegen/_gen_student_lines.js
  //   ＋ data/student_audio_map.js 查表）；選項喇叭優先播預錄檔，缺檔才退回即時瀏覽器 TTS。
  // 阿傑（智威/雲哲）停用：智威系統音不自然、雲哲已給小明用。目前 4 個學生。
  { name: '小明', emoji: '👦', color: '#DBEAFE', voiceKeyword: '雲哲',    gender: 'male',    image: 'images/xiaoming.png', fileKey: 'xiaoming' },
  { name: '小玲', emoji: '👧', color: '#FCE7F3', voiceKeyword: 'Yating',  gender: 'female',  image: 'images/xiaoling.png', fileKey: 'xiaoling' },
  { name: '小婷', emoji: '👩', color: '#EDE9FE', voiceKeyword: '曉臻',    gender: 'female',  image: 'images/xiaoting.png', fileKey: 'xiaoting' },
  { name: '小恩', emoji: '🧑', color: '#FEF3C7', voiceKeyword: '曉雨',    gender: 'neutral', image: 'images/xiaoen.png',   fileKey: 'xiaoen' },
];

const voiceManager = {
  all: [],          // 可用的中文語音清單
  selected: null,   // 目前播放用的語音物件
  selectedInfo: null, // 目前「顯示」用的店員資訊（含無聲音的店員）

  _loadVoices() {
    const all = speechSynthesis.getVoices();
    if (all.length === 0) return false;

    // 收集所有 zh 開頭的語音（zh-TW、zh-CN、zh_TW 等格式都接受）
    const zh = all.filter(v => v.lang.toLowerCase().startsWith('zh'));

    // 優先順序：Edge Online > Google > 系統語音；同級內 zh-TW 排 zh-CN 前
    // Edge Online：名稱含 "Online"（如 "Microsoft Yating Online (Natural) - zh-TW"）
    // Google：名稱含 "Google"（如 "Google 國語"）
    // 系統：其餘（如 "Microsoft Yating - zh-TW"）
    function engineScore(v) {
      const n = v.name;
      if (n.includes('Online')) return 0;   // Edge online
      if (n.includes('Google')) return 1;   // Google TTS
      return 2;                             // 系統 / 離線語音
    }
    this.all = [...zh].sort((a, b) => {
      const es = engineScore(a) - engineScore(b);
      if (es !== 0) return es;
      // 同引擎：zh-TW 排前
      const aTW = a.lang.toLowerCase().includes('tw') ? 0 : 1;
      const bTW = b.lang.toLowerCase().includes('tw') ? 0 : 1;
      return aTW - bTW;
    });

    // 預設選 Yating；優先取 Edge Online 版，找不到就用第一個
    if (!this.selected) {
      this.selected = this.all.find(v => v.name.includes('Yating')) || this.all[0] || null;
    }
    // 預設顯示資訊也跟著對齊
    if (!this.selectedInfo && this.selected) {
      this.selectedInfo = this.getInfo(this.selected);
    }
    return this.all.length > 0;
  },

  // 重新載入語音清單
  refresh() {
    this._loadVoices();
    renderUserVoiceSelector();
  },

  init() {
    return new Promise(resolve => {
      // 先試一次（同步取得）
      if (this._loadVoices()) { resolve(); return; }

      // voiceschanged 事件：語音清單更新時觸發（可能觸發多次）
      const onChanged = () => {
        this._loadVoices();
        if (!userVoiceManager.selected) userVoiceManager.init();
        renderUserVoiceSelector();
      };
      speechSynthesis.addEventListener('voiceschanged', onChanged);

      // 輪詢補救：有些瀏覽器不觸發 voiceschanged，每 300ms 檢查一次，最多 4 秒
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (this._loadVoices() || tries >= 13) {
          clearInterval(poll);
          resolve();
        }
      }, 300);
    });
  },

  // 取得語音的顯示資訊
  getInfo(voice) {
    const info = VOICE_INFO.find(i => voice.name.includes(i.keyword));
    if (info) return info;
    // 找不到就從完整名稱萃取簡稱
    const shortName = voice.name.split(' - ')[0].replace('Microsoft ', '').trim();
    return { name: shortName, gender: 'neutral' };
  },

  // 根據目前選取語音的性別回傳店員頭像
  getAvatar() {
    if (!this.selected) return '🧑‍💼';
    const gender = this.getInfo(this.selected).gender;
    return GENDER_AVATAR[gender] || '🧑';
  },
};


// ─── 學生語音管理器（用於選項喇叭播放）──────────────

const userVoiceManager = {
  selected: null,
  selectedStudentIdx: 0,   // 預設第一個學生（小明）

  init() {
    // 學生示範語音（「聽示範」用）：品質優先。
    // 優先挑高品質引擎（Edge Online / Google 神經語音）且 zh-TW，盡量與店員不同；
    // 找不到「不同的高品質語音」時，寧可用同一個高品質語音，也不要為了音色不同而降品質。
    const all   = voiceManager.all;
    const clerk = voiceManager.selected;
    const hiFi  = v => /online|google|natural|yating|hsiao/i.test(v.name);
    const isTW  = v => (v.lang || '').toLowerCase().includes('tw');
    this.selected =
      all.find(v => v !== clerk && hiFi(v) && isTW(v)) ||   // 高品質 + zh-TW + 與店員不同
      all.find(v => hiFi(v) && isTW(v))                ||   // 高品質 + zh-TW
      all.find(v => hiFi(v))                           ||   // 任一高品質
      all.find(v => v !== clerk)                       ||   // 退：與店員不同
      all[0] || null;
    this.selectedStudentIdx = 0;
  },

  getInfo(v) { return voiceManager.getInfo(v); },

  getAvatar() {
    if (!this.selected) return '🙋';
    const gender = this.getInfo(this.selected).gender;
    return GENDER_AVATAR[gender] || '🧑';
  },
};


// ─── 語音輸出（Web Speech Synthesis）────────────────

// 專案預設的「即時高品質語音」挑選：Online zh-TW > Online > Google zh-TW > zh-TW > all[0]。
// 傳入 prefer（例如店員語音）：若它本身已是 Online/Natural 高品質就沿用，否則升級。
function bestTWVoice(prefer) {
  const A = voiceManager.all || [];
  const isHiFi = v => v && /online|google|natural/i.test(v.name);
  if (isHiFi(prefer)) return prefer;
  return A.find(v => v.name.includes('Online') && v.lang.toLowerCase().includes('tw'))
      || A.find(v => v.name.includes('Online'))
      || A.find(v => v.name.includes('Google') && v.lang.toLowerCase().includes('tw'))
      || A.find(v => v.lang.toLowerCase().includes('tw'))
      || prefer || A[0] || null;
}

// 心裡 OS（括號旁白）語音：固定用「曉臻 HsiaoChen」當旁白聲；退援順位＝
// 曉臻(HsiaoChen) → 雅婷(Yating) → 其他 Online/Natural zh-TW → 一般高品質挑選。
function bestOSVoice() {
  const A = voiceManager.all || [];
  const tw = v => (v.lang || '').toLowerCase().includes('tw');
  return A.find(v => /hsiaochen|曉臻/i.test(v.name))
      || A.find(v => /yating|雅婷/i.test(v.name))
      || A.find(v => /online|natural/i.test(v.name) && tw(v))
      || bestTWVoice(null);
}

// 電話號碼要「逐字唸」：165 是反詐騙專線，TTS 預設會唸成「一百六十五」。
// 只轉換整段剛好等於 165 的數字——其他三位數在本 App 幾乎都是金額（如「總共 113 元」），
// 逐字唸反而錯。顯示文字維持阿拉伯數字不變，只有唸出來的那一份被替換。
// ⚠️ 預錄音檔（學生選項/回饋語）走的是 voicegen 的生成清單，那邊有各自的同名轉換，改規則要兩邊一起改。
function toSpeechText(text) {
  const s = String(text ?? '');
  // 後面接「元」的一律當金額（「165 元」唸一百六十五元），其餘的 165 才是專線號碼
  return s.replace(/\d+/g, (n, i) =>
    (n === '165' && !/^\s*元/.test(s.slice(i + n.length))) ? '一六五' : n);
}

const tts = {
  speak(text, rate = 0.85, onEnd) {
    if (!window.speechSynthesis) { if (onEnd) onEnd(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(toSpeechText(text));
    // 後備瀏覽器 TTS 也用高品質即時語音：店員聲音若已是 Online/Natural 就沿用，
    // 否則升級為最佳 Online zh-TW（與提示/任務朗讀同一支高品質聲音）
    const voice = bestTWVoice(voiceManager.selected);
    u.lang = voice?.lang || 'zh-TW';
    u.rate = rate;
    if (voice) u.voice = voice;

    // 店員說話時的頭像動畫
    const avatar = document.getElementById('shopkeeper-avatar');
    let ended = false;
    const finish = () => { avatar?.classList.remove('speaking'); if (!ended) { ended = true; if (onEnd) onEnd(); } };
    u.onstart = () => avatar?.classList.add('speaking');
    u.onend   = finish;
    u.onerror = finish;

    window.speechSynthesis.speak(u);
  },
  cancel() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.getElementById('shopkeeper-avatar')?.classList.remove('speaking');
  }
};

// 以最高品質的繁體中文語音朗讀（提示文字、系統說明用）
// 優先順序與 voiceManager.all 的排序一致：
//   1. Edge Online zh-TW（如 Microsoft Yating Online Natural - zh-TW）
//   2. 其他 Edge Online 語音
//   3. Google zh-TW
//   4. 任何 zh-TW 語音
//   5. voiceManager.all[0]（排序後最佳可用語音）
function speakHint(text, rate = 0.85) {
  if (!window.speechSynthesis) return;
  stopAllAudio();

  const voice = bestTWVoice(null);

  const u = new SpeechSynthesisUtterance(toSpeechText(text));
  u.lang  = voice?.lang || 'zh-TW';
  u.rate  = rate;
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

// 心理 OS（旁白）：店員台詞後方括號內的內心話（如「老闆找回 35 元，但正確應找 45 元」）。
// 語音生成器會剝除括號 → OS 無預錄檔，一律用瀏覽器即時 TTS 唸出。
// 語速略慢、不觸發店員頭像動畫（這是旁白/內心話，不是店員在說話）。
// 不呼叫 stopAllAudio（呼叫時機為店員台詞已播完），只接續唸出 OS。
function speakInnerOS(text, onEnd) {
  if (!text || !window.speechSynthesis) { onEnd?.(); return; }
  const voice = bestOSVoice();   // 旁白固定曉臻→雅婷→…
  const u = new SpeechSynthesisUtterance(toSpeechText(text));
  u.lang = voice?.lang || 'zh-TW';
  u.rate = 0.82;
  if (voice) u.voice = voice;
  let ended = false;
  const finish = () => { if (!ended) { ended = true; onEnd?.(); } };
  u.onend = finish; u.onerror = finish;
  window.speechSynthesis.speak(u);
}

// ─── 旁白句（自述／心裡話）判定與播放（2026-07-23）──────────────
// 這類步驟不是角色在說話：整句由「旁白聲」（曉臻）唸出、照畫面文字順序、不拆段、
// 不觸發店員頭像動畫。涵蓋四類：純括號旁白、（想一想）反思句、（你掛掉了電話）自問
// 引導句、括號外只剩狀聲詞（如「（閘門）嗶嗶！（亮紅燈，門沒開）」）。
// 預錄檔＝標準 clerk 檔名 {場景}_{情境}_{步驟}（Edge 曉臻，voicegen/lists/narration_list.csv）。
// ⚠️ 規則與 voicegen/_gen_narration_list.js 鏡像——改任一邊務必同步另一邊！
function isNarrationPrompt(fp) {
  if (!/^\s*（/.test(fp)) return false;
  const rest = fp.replace(/（[^）]*）/g, '').trim();
  if (!rest) return true;                                    // 純旁白（整句都在括號內）
  if (/^\s*（想一想）/.test(fp)) return true;                 // 反思句
  if (/^\s*（你掛掉了電話）/.test(fp)) return true;            // 掛電話後的自問引導句
  return /^[嗶叭叮咚鈴噹～~！!？?。，、\s…]+$/.test(rest);     // 括號外只剩狀聲詞／標點
}
// 旁白句朗讀文字：括號拿掉、界線變停頓，維持原文順序（預錄清單同一規則）
function narrationSpeechText(fp) {
  return fp
    .replace(/）\s*/g, '，')
    .replace(/（\s*/g, '')
    .replace(/([。！？])，/g, '$1')
    .replace(/[，、]+$/, '')
    .trim();
}
// 旁白句播放：預錄檔（mp3→wav）→ 即時旁白 TTS（曉臻→雅婷）。不動店員頭像。
function playNarration(step, fp) {
  const base  = `audio/clerk/${state.scenario.id}_${state.situation.id}_${step.id}`;
  const cands = [base + '.mp3', base + '.wav'];
  let i = 0;
  const tryNext = () => {
    if (i >= cands.length) { speakInnerOS(narrationSpeechText(fp)); return; }
    const a = new Audio(cands[i++]);
    _shopkeeperAudio = a;
    a.onended = () => { if (_shopkeeperAudio === a) _shopkeeperAudio = null; };
    a.onerror = () => { if (_shopkeeperAudio === a) { _shopkeeperAudio = null; tryNext(); } };
    a.play().catch(() => { if (_shopkeeperAudio === a) { _shopkeeperAudio = null; tryNext(); } });
  };
  tryNext();
}

// 播放心裡 OS：預錄旁白 MP3（曉臻，audio/clerk/{場景}_{情境}_{步驟}_os）優先——
// 像店員台詞一樣可自動播放；缺檔才退回即時 TTS（bestOSVoice：曉臻→雅婷）。
function playInnerOS(step, osText, onDone) {
  if (!osText) { onDone?.(); return; }
  if (state.scenario?.isCustom) { speakInnerOS(osText, onDone); return; }  // 自訂情境無預錄 → 即時 TTS
  const base  = `audio/clerk/${state.scenario.id}_${state.situation.id}_${step.id}_os`;
  const cands = [base + '.mp3', base + '.wav'];
  let i = 0;
  const tryNext = () => {
    if (i >= cands.length) { speakInnerOS(osText, onDone); return; }
    const a = new Audio(cands[i++]);
    _shopkeeperAudio = a;
    a.onended = () => { if (_shopkeeperAudio === a) { _shopkeeperAudio = null; onDone?.(); } };
    a.onerror = () => { if (_shopkeeperAudio === a) { _shopkeeperAudio = null; tryNext(); } };
    a.play().catch(() => { if (_shopkeeperAudio === a) { _shopkeeperAudio = null; tryNext(); } });
  };
  tryNext();
}


// ─── 店員語音播放（優先預錄音檔，無檔案時 fallback TTS）────────────
// 查找順序：
//   1. audio/clerk/{scenario_id}_{situation_id}_{step_id}.wav  （情境專屬）
//   2. audio/clerk/{scenario_id}_unknown_{step_id}.wav          （共用版）
//   3. TTS 語音合成
let _shopkeeperAudio = null;
let _feedbackAudio   = null;
let _userAudio       = null;   // 學生示範音檔（本機 edge-tts 伺服器產生）

// 本機 edge-tts 語音伺服器（voicegen/voice_server.py）：學生語音優先走它，音色最準；
// 連不到就退回瀏覽器即時 TTS。_voiceServerDown 記住本次 session 是否連過失敗，避免重複卡頓。
const VOICE_SERVER   = 'http://localhost:5678';
// 只有本機開發時才可能有這台伺服器。線上（GitHub Pages）與手機一律直接視為「不可用」，
// 否則每次都要先打一個必然失敗的請求，等失敗才退回 TTS——延遲之外還會脫離使用者手勢脈絡，
// 行動瀏覽器會擋掉之後的播放。
let _voiceServerDown = !/^(localhost|127\.0\.0\.1)$/.test(location.hostname);

// 播放世代序號：每次 stopAllAudio 就 +1。跨越「等待」的接續播放（句首旁白唸完 → 接店員台詞、
// 台詞播完 → 接句尾旁白）在真正開播前比對世代，避免使用者已關彈窗/已作答後語音才冒出來。
let _audioSeq = 0;

// 停止所有系統語音（WAV + TTS），任何新語音播放前都應呼叫
function stopAllAudio() {
  _audioSeq++;
  if (_shopkeeperAudio) { _shopkeeperAudio.pause(); _shopkeeperAudio = null; }
  if (_feedbackAudio)   { _feedbackAudio.pause();   _feedbackAudio   = null; }
  if (_userAudio)       { _userAudio.pause();       _userAudio       = null; }
  // 跟讀的自己錄音回放（echoRecorder 於後方定義，執行期才會用到）
  if (typeof echoRecorder !== 'undefined' && echoRecorder._audio) {
    try { echoRecorder._audio.pause(); } catch {}
    echoRecorder._audio = null;
  }
  tts.cancel();
}

// ── Android 媒體控制卡殘留修復（2026-07-23，同 adventure）────────
// 店員預錄 mp3 播到一半離頁/切背景時，只 pause 會留下「暫停中」媒體工作階段，
// 手機通知欄的媒體卡（頁標題＋播放條）會殘留到分頁關閉。離頁時徹底卸載＋清工作階段。
(() => {
  const release = () => {
    [_shopkeeperAudio, _feedbackAudio, _userAudio].forEach(a => {
      if (a) { try { a.pause(); a.src = ''; a.load(); } catch (_) {} }
    });
    stopAllAudio();
    try {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
    } catch (_) {}
  };
  window.addEventListener('pagehide', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
})();

function playShopkeeperAudio(step) {
  stopAllAudio();

  const avatar = document.getElementById('shopkeeper-avatar');
  const base    = `audio/clerk/${state.scenario.id}`;
  const stepId  = step.id;

  // 自訂情境：老師錄音（IndexedDB blob）→ 即時 TTS。不查伺服器音檔（必為 404）。
  if (state.scenario?.isCustom) {
    playCustomStepAudio(step, avatar);
    return;
  }
  // 旁白句（自述／心裡話／反思／狀聲）：整句一個旁白聲照文字順序唸，
  // 不拆「旁白＋店員」兩段、不觸發店員頭像動畫（見 isNarrationPrompt 定義處說明）。
  {
    const fp = step.shopkeeper_prompt || '';
    if (isNarrationPrompt(fp)) { playNarration(step, fp); return; }
  }
  // 候選清單：情境專屬 → 共用版（_unknown_）；各試 mp3 與 wav。
  // mp3 優先（檔小、預錄主格式；wav 已備份移出，留 .wav 後備相容舊部署）
  const candidates = [
    `${base}_${state.situation.id}_${stepId}.mp3`,
    `${base}_${state.situation.id}_${stepId}.wav`,
    `${base}_unknown_${stepId}.mp3`,
    `${base}_unknown_${stepId}.wav`,
  ];
  let candidateIdx = 0;
  let done = false;

  // 心理 OS：店員台詞後方括號內的內心話（如「（老闆找回 35 元，但正確應找 45 元）」）。
  // 拆成「店員台詞」＋「OS 內容」：先播店員台詞（預錄檔優先），播完再用即時 TTS 唸出 OS。
  const fullPrompt = step.shopkeeper_prompt || '';
  const osMatch    = fullPrompt.match(/（([^）]*)）/);
  const osText     = osMatch ? osMatch[1].trim() : '';
  const clerkLine  = fullPrompt.replace(/（[^）]*）/g, '').trim();
  // 唸的順序＝畫面上文字的順序：括號在句首（「（電話響了）欸，我是…」）＝場景旁白，
  // 要先唸旁白再唸台詞；括號在句尾（「…（老闆找回 35 元）」）＝事後內心話，維持台詞在前。
  const osLeading  = !!osText && /^\s*（/.test(fullPrompt);
  const mySeq      = _audioSeq;   // 本次播放的世代（stopAllAudio 會使其失效）
  const speakOS    = () => {
    if (osText && !osLeading) setTimeout(() => { if (mySeq === _audioSeq) playInnerOS(step, osText); }, 350);
  };

  const doTTS = () => {
    if (done) return;
    done = true;
    // 有店員台詞：先唸台詞再接心理 OS；純旁白步驟（無台詞）：直接用旁白語音唸 OS，不唸括號
    // （句首旁白已在進台詞前唸過，這裡不重複）
    if (clerkLine) tts.speak(clerkLine, 0.85, speakOS);
    else if (osText && !osLeading) playInnerOS(step, osText);
    else if (!osText) tts.speak(fullPrompt, 0.85);
  };

  function tryNext() {
    if (candidateIdx >= candidates.length) { doTTS(); return; }
    const filename = candidates[candidateIdx++];
    const audio = new Audio(filename);
    _shopkeeperAudio = audio;
    audio.onplay  = () => avatar?.classList.add('speaking');
    // 店員預錄台詞播完 → 接續唸心理 OS（OS 無預錄檔，走即時 TTS）
    audio.onended = () => { if (_shopkeeperAudio === audio) { done = true; avatar?.classList.remove('speaking'); speakOS(); } };
    // onerror 與 play().catch 對同一個失敗檔案會「雙重觸發」；用 _shopkeeperAudio===audio
    // 守門，確保每個候選只前進一次，避免同時播放兩個音檔（依優先順序只播第一個可用的）
    audio.onerror = () => { if (_shopkeeperAudio === audio) { _shopkeeperAudio = null; tryNext(); } };
    audio.play().then(() => { done = true; }).catch(() => { if (_shopkeeperAudio === audio) { _shopkeeperAudio = null; tryNext(); } });
  }

  // 句首旁白先唸完，隔 250ms 再進店員台詞；其餘情況直接播台詞（旁白由 speakOS 收尾）
  if (osLeading) playInnerOS(step, osText, () => setTimeout(() => { if (mySeq === _audioSeq) tryNext(); }, 250));
  else tryNext();
}

// 自訂情境步驟語音：老師錄音 blob（custom_audio store）優先，缺檔走即時 TTS。
// 與 playShopkeeperAudio 相同的頭像動畫／心理 OS 行為。
function playCustomStepAudio(step, avatar) {
  const fullPrompt = step.shopkeeper_prompt || '';
  const osMatch    = fullPrompt.match(/（([^）]*)）/);
  const osText     = osMatch ? osMatch[1].trim() : '';
  const clerkLine  = fullPrompt.replace(/（[^）]*）/g, '').trim();
  const osLeading  = !!osText && /^\s*（/.test(fullPrompt);   // 同 playShopkeeperAudio：句首旁白先唸
  const mySeq      = _audioSeq;
  const speakOS    = () => {
    if (osText && !osLeading) setTimeout(() => { if (mySeq === _audioSeq) playInnerOS(step, osText); }, 350);
  };
  const doTTS      = () => {
    if (clerkLine) tts.speak(clerkLine, 0.85, speakOS);
    else if (osText && !osLeading) playInnerOS(step, osText);   // 句首旁白已在 start 前唸過，不重複
    else if (!osText) tts.speak(fullPrompt, 0.85);
  };

  const start = () => {
    const key = `${state.scenario.id}::${step.id}::say`;
    (typeof dbAudioGet === 'function' ? dbAudioGet(key) : Promise.resolve(null))
      .then(blob => {
        if (!blob) { doTTS(); return; }
        const url   = URL.createObjectURL(blob);
        const audio = new Audio(url);
        _shopkeeperAudio = audio;
        audio.onplay  = () => avatar?.classList.add('speaking');
        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (_shopkeeperAudio === audio) { avatar?.classList.remove('speaking'); speakOS(); }
        };
        audio.onerror = () => { URL.revokeObjectURL(url); if (_shopkeeperAudio === audio) { _shopkeeperAudio = null; doTTS(); } };
        audio.play().catch(() => { if (_shopkeeperAudio === audio) { _shopkeeperAudio = null; doTTS(); } });
      })
      .catch(doTTS);
  };

  if (osLeading) playInnerOS(step, osText, () => setTimeout(() => { if (mySeq === _audioSeq) start(); }, 250));
  else start();
}

// 以學生語音朗讀（選項喇叭用）。onEnd：唸完（或無法唸）後的回呼，供「播完再出彈窗」使用。
// 播放優先序：① 預錄音檔 audio/student/stu_{fileKey}_{hash}.wav（見 data/student_audio_map.js
//   查表＋ voicegen/_gen_student_lines.js；免 Edge 瀏覽器也能聽到一致的神經語音）
//   → ② 本機 edge-tts 伺服器（未預錄時的次選，需自行開啟伺服器）
//   → ③ 瀏覽器即時 TTS（最後備援，音色受瀏覽器/系統限制）。
function speakAsUser(text, onEnd) {
  stopAllAudio();
  const student = STUDENT_PROFILES[userVoiceManager.selectedStudentIdx];
  const hash = window.STUDENT_AUDIO_MAP && window.STUDENT_AUDIO_MAP[text];
  if (hash && student?.fileKey) {
    const base = `audio/student/stu_${student.fileKey}_${hash}`;
    // ⚠️ mp3 必須排第一（與店員台詞鏈一致）：deploy 只上傳 mp3（robocopy 排除 wav），
    // 若 wav 在前，線上必定先 404、要到 onerror 回呼才播 mp3——那時已脫離使用者手勢的同步脈絡，
    // 行動瀏覽器（iOS 最嚴）會擋掉該次 play()，症狀就是「手機點喇叭沒聲音、電腦正常」。
    const candidates = [`${base}.mp3`, `${base}.wav`];
    let idx = 0;
    const tryNext = () => {
      if (idx >= candidates.length) { speakAsUserLive(text, onEnd); return; }
      const audio = new Audio(candidates[idx++]);
      _userAudio = audio;
      audio.onended = () => { if (_userAudio === audio) _userAudio = null; if (onEnd) onEnd(); };
      audio.onerror = () => { if (_userAudio === audio) { _userAudio = null; tryNext(); } };
      audio.play().catch(() => { if (_userAudio === audio) { _userAudio = null; tryNext(); } });
    };
    tryNext();
    return;
  }
  speakAsUserLive(text, onEnd);
}

// 學生示範語音（次選＋後備）：優先用本機 edge-tts 伺服器（音色最準，與 voice-preview 相同）；
// 伺服器沒開/失敗時自動退回瀏覽器即時 TTS（可離線，但音色受瀏覽器限制）。
function speakAsUserLive(text, onEnd) {
  const student   = STUDENT_PROFILES[userVoiceManager.selectedStudentIdx];
  const edgeVoice = student?.edgeVoice;
  if (edgeVoice && !_voiceServerDown) {
    const url = `${VOICE_SERVER}/speak?voice=${encodeURIComponent(edgeVoice)}`
              + `&text=${encodeURIComponent(text)}&rate=0.9`;
    const audio = new Audio(url);
    _userAudio = audio;
    let fell = false;
    const fallback = () => {
      if (fell) return;
      fell = true;
      _voiceServerDown = true;                 // 本次 session 不再重試伺服器
      if (_userAudio === audio) _userAudio = null;
      browserSpeakAsUser(text, onEnd);         // 退回瀏覽器 TTS
    };
    audio.onended = () => { if (_userAudio === audio) _userAudio = null; if (onEnd) onEnd(); };
    audio.onerror = fallback;
    audio.play().catch(fallback);
    return;
  }
  browserSpeakAsUser(text, onEnd);
}

// 瀏覽器即時 TTS（後備）
function browserSpeakAsUser(text, onEnd) {
  window.speechSynthesis && window.speechSynthesis.cancel();
  let done = false;
  const finish = () => { if (!done) { done = true; if (onEnd) onEnd(); } };
  if (!window.speechSynthesis) { finish(); return; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = userVoiceManager.selected?.lang || 'zh-TW';
  u.rate = 0.9;
  if (userVoiceManager.selected) u.voice = userVoiceManager.selected;
  if (onEnd) {
    u.onend = finish;
    u.onerror = finish;
    // 保險：部分瀏覽器（Chrome 長句）不觸發 onend，用估算時間補上，避免彈窗出不來
    setTimeout(finish, Math.min(8000, 1200 + text.length * 220));
  }
  window.speechSynthesis.speak(u);
}


// ─── Confetti ────────────────────────────────────────

function launchConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  container.innerHTML = '';

  const colors = ['#2563EB', '#16A34A', '#EA580C', '#9333EA', '#F59E0B', '#EC4899', '#06B6D4'];
  const shapes = ['0', '50%', '2px'];

  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const size = 8 + Math.random() * 8;
    el.style.left            = Math.random() * 100 + 'vw';
    el.style.width           = size + 'px';
    el.style.height          = size + 'px';
    el.style.background      = colors[Math.floor(Math.random() * colors.length)];
    el.style.borderRadius    = shapes[Math.floor(Math.random() * shapes.length)];
    el.style.animationDuration  = (1.4 + Math.random() * 1.8) + 's';
    el.style.animationDelay     = (Math.random() * 0.6) + 's';
    container.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}


// ─── 無障礙設定 ──────────────────────────────────────

const a11y = {
  applyContrast(on) {
    document.body.classList.toggle('high-contrast', on);
    const btn = document.getElementById('btn-high-contrast');
    if (btn) btn.setAttribute('aria-checked', String(on));
  },

  toggleContrast() {
    const on = !document.body.classList.contains('high-contrast');
    this.applyContrast(on);
    localStorage.setItem('sp_contrast', on ? '1' : '');
  },

  applyFontSize(size) {
    document.body.classList.remove('font-large', 'font-xlarge');
    if (size === 'large')  document.body.classList.add('font-large');
    if (size === 'xlarge') document.body.classList.add('font-xlarge');
    document.querySelectorAll('.font-size-btn').forEach(btn => {
      const active = btn.dataset.size === size;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  },

  setFontSize(size) {
    this.applyFontSize(size);
    localStorage.setItem('sp_fontsize', size);
  },

  applyAAC(on) {
    document.body.classList.toggle('aac-mode', on);
    const btn = document.getElementById('btn-aac-mode');
    if (btn) btn.setAttribute('aria-checked', String(on));
  },
  toggleAAC() {
    const on = !document.body.classList.contains('aac-mode');
    this.applyAAC(on);
    localStorage.setItem('sp_aac', on ? '1' : '');
  },

  // 店員迎接彈窗：進入練習時店員放大登場並說第一句台詞（sp_clerkgreet，預設開）
  clerkGreet: true,
  applyClerkGreet(on) {
    this.clerkGreet = on;
    const btn = document.getElementById('btn-clerk-greet');
    if (btn) btn.setAttribute('aria-checked', String(on));
  },
  toggleClerkGreet() {
    this.applyClerkGreet(!this.clerkGreet);
    localStorage.setItem('sp_clerkgreet', this.clerkGreet ? '1' : '0');
  },

  init() {
    this.applyContrast(localStorage.getItem('sp_contrast') === '1');
    this.applyFontSize(localStorage.getItem('sp_fontsize') || 'normal');
    this.applyAAC(localStorage.getItem('sp_aac') === '1');
    this.applyClerkGreet(localStorage.getItem('sp_clerkgreet') !== '0');
  },
};


// ─── 自訂情境儲存 ────────────────────────────────────

const CUSTOM_KEY = 'shoppingPractice_custom';

function loadCustom() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); }
  catch { return []; }
}

function saveCustom(arr) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(arr));
}

// ─── 對話包匯出/匯入（自訂情境＋老師錄音＋照片打包分享）──────────
// 格式：{ version:2, type:'dialogue-pack', exported, scenarios:[…], audio:{ key: dataURL } }
// v2 起 audio map 一併含照片 blob（key 尾 ::img、__scene::img）；匯入以 `${sc.id}::`
// 前綴通用再映射，故 v1 舊包（無照片）仍可匯入，向下相容。

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function dataURLToBlob(dataURL) {
  const [head, body] = dataURL.split(',');
  const mime  = head.match(/data:([^;]+)/)?.[1] || 'audio/webm';
  const bytes = atob(body);
  const arr   = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function exportDialoguePack() {
  const customs = loadCustom();
  if (customs.length === 0) return null;
  const audio = {};
  for (const sc of customs) {
    const keys = await dbAudioKeys(`${sc.id}::`).catch(() => []);
    for (const key of keys) {
      const blob = await dbAudioGet(key).catch(() => null);
      if (blob) audio[key] = await blobToDataURL(blob);
    }
  }
  return JSON.stringify({
    version: 2, type: 'dialogue-pack', exported: Date.now(),
    scenarios: customs, audio,
  });
}

// 回傳 { scenarios, audios }（匯入數量）。id 撞號自動重編，錄音 key 跟著改。
async function importDialoguePack(jsonText) {
  const data = JSON.parse(jsonText);
  if (data.type !== 'dialogue-pack' || !Array.isArray(data.scenarios)) {
    throw new Error('不是對話包檔案');
  }
  const existing = loadCustom();
  const usedIds  = new Set([...existing.map(s => s.id), ...SCENARIOS_DATA.scenarios.map(s => s.id)]);
  const audioMap = data.audio || {};
  let audios = 0;

  for (let i = 0; i < data.scenarios.length; i++) {
    const sc = data.scenarios[i];
    if (!sc?.id || !Array.isArray(sc.steps)) continue;
    let newId = sc.id;
    if (usedIds.has(newId)) newId = `custom_${Date.now()}_${i}`;
    usedIds.add(newId);

    for (const [key, dataURL] of Object.entries(audioMap)) {
      if (!key.startsWith(`${sc.id}::`)) continue;
      const newKey = newId + key.slice(sc.id.length);
      try {
        await dbAudioSave(newKey, dataURLToBlob(dataURL));
        audios++;
      } catch {}
    }
    existing.push({ ...sc, id: newId, available: true });
  }
  saveCustom(existing);
  return { scenarios: data.scenarios.length, audios };
}

// ─── 內建情境對話覆寫（關鍵字／完整語句／選項）───────────────────
// 教師可在設定頁修改內建情境的判定關鍵字、可接受完整語句（accepted_phrases）與選項
// （options），存在本機（不動 scenarios.js、不影響任何預錄語音——音檔仍唸原句）。
// 值格式：舊版＝關鍵字陣列（相容保留）；2026-07-23 起＝{ keywords?, accepted?, options? }。
// 套用點：startWithSituation 進子情境時以 applyStepOverrides 產生覆寫後的步驟複本，
// 下游（提示/判定/選項渲染/評分/自動句框）全部自然生效；手工 frame 句框不受影響。
const KW_OVERRIDE_KEY = 'sp_keywordOverrides';
function loadKeywordOverrides() {
  try { return JSON.parse(localStorage.getItem(KW_OVERRIDE_KEY)) || {}; } catch { return {}; }
}
function saveKeywordOverrides(obj) {
  try { localStorage.setItem(KW_OVERRIDE_KEY, JSON.stringify(obj)); } catch {}
}
function kwOverrideId(scId, sitId, stepId) { return `${scId}__${sitId}__${stepId}`; }
// 舊格式（陣列＝只有關鍵字）→ 新格式物件
function normalizeOverride(v) {
  if (Array.isArray(v)) return { keywords: v };
  return (v && typeof v === 'object') ? v : {};
}
// 依目前情境取步驟「有效關鍵字」：有覆寫回傳套用覆寫的 step 複本，否則原樣回傳
// （評分路徑的第二道保險；accepted/options 已在進情境時套用）
function withEffectiveKeywords(step) {
  const sc = state?.scenario, sit = state?.situation;
  if (sc && sit && step?.id) {
    const ov = normalizeOverride(loadKeywordOverrides()[kwOverrideId(sc.id, sit.id, step.id)]);
    if (Array.isArray(ov.keywords) && ov.keywords.length) return { ...step, keywords: ov.keywords };
  }
  return step;
}
// 進子情境時套用覆寫：回傳步驟已覆寫的 situation 複本（無覆寫＝原物件，零成本）
function applyStepOverrides(scId, sitId, situation) {
  const all = loadKeywordOverrides();
  const hasAny = (situation.steps || []).some(st => all[kwOverrideId(scId, sitId, st.id)]);
  if (!hasAny) return situation;
  return {
    ...situation,
    steps: situation.steps.map(st => {
      const ov = normalizeOverride(all[kwOverrideId(scId, sitId, st.id)]);
      if (!ov.keywords && !ov.accepted && !ov.options) return st;
      const out = { ...st };
      if (Array.isArray(ov.keywords) && ov.keywords.length)   out.keywords         = ov.keywords;
      if (Array.isArray(ov.accepted) && ov.accepted.length)   out.accepted_phrases = ov.accepted;
      if (Array.isArray(ov.options)  && ov.options.length >= 2) out.options        = ov.options;
      // 守門：options[0]（正解）必須 ∈ accepted_phrases（選項判定與稽核規則依賴）
      if (out.options?.length && !(out.accepted_phrases || []).includes(out.options[0]))
        out.accepted_phrases = [out.options[0], ...(out.accepted_phrases || [])];
      return out;
    }),
  };
}

// 關鍵字編輯器 UI（只列內建情境；自訂情境已有自己的步驟編輯器）
function openKeywordEditor() {
  const scSel = document.getElementById('kw-scenario-select');
  scSel.innerHTML = '';
  SCENARIOS_DATA.scenarios
    .filter(s => s.available !== false && s.situations?.length)
    .forEach(s => {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = `${s.icon || ''} ${s.name}`.trim();
      scSel.appendChild(o);
    });
  scSel.onchange = renderKwSituations;
  document.getElementById('kw-situation-select').onchange = renderKwSteps;
  // 欄位顯示勾選：載入記憶狀態＋綁定（勾選只切顯示，不重繪、不丟未存輸入）
  const show = loadKwShow();
  [['kw', 'kw-show-kw'], ['acc', 'kw-show-acc'], ['opt', 'kw-show-opt']].forEach(([k, id]) => {
    const cb = document.getElementById(id);
    cb.checked  = !!show[k];
    cb.onchange = applyKwFieldVisibility;
  });
  renderKwSituations();
  nav.push('screen-keyword-editor');
}

function renderKwSituations() {
  const sc = SCENARIOS_DATA.scenarios.find(s => s.id === document.getElementById('kw-scenario-select').value);
  const sitSel = document.getElementById('kw-situation-select');
  sitSel.innerHTML = '';
  (sc?.situations || []).forEach(sit => {
    const o = document.createElement('option');
    o.value = sit.id;
    o.textContent = `${sit.icon || ''} ${sit.name}`.trim();
    sitSel.appendChild(o);
  });
  renderKwSteps();
}

function renderKwSteps() {
  const scId  = document.getElementById('kw-scenario-select').value;
  const sitId = document.getElementById('kw-situation-select').value;
  const sc    = SCENARIOS_DATA.scenarios.find(s => s.id === scId);
  const sit   = sc?.situations.find(x => x.id === sitId);
  const overrides = loadKeywordOverrides();
  const list  = document.getElementById('kw-step-list');
  list.innerHTML = '';
  document.getElementById('kw-save-status').textContent = '';

  (sit?.steps || []).forEach(step => {
    const key   = kwOverrideId(scId, sitId, step.id);
    const ov    = normalizeOverride(overrides[key]);
    const isOv  = !!(ov.keywords || ov.accepted || ov.options);
    const curKw  = ov.keywords || step.keywords || [];
    const curAcc = ov.accepted || step.accepted_phrases || [];
    const curOpt = ov.options  || step.options || [];

    const row = document.createElement('div');
    row.className   = 'form-group kw-step-row';
    row.dataset.key = key;
    row.dataset.defKw  = (step.keywords || []).join(',');
    row.dataset.defAcc = (step.accepted_phrases || []).join('\n');
    row.dataset.defOpt = (step.options || []).join('\n');

    const label = document.createElement('label');
    label.className   = 'form-label';
    label.textContent = step.task || step.id;
    if (isOv) {
      const b = document.createElement('span');
      b.style.cssText = 'color:var(--orange);font-size:0.8em';
      b.textContent   = '（已修改）';
      label.append(' ', b);
    }

    const hint = document.createElement('p');
    hint.className = 'form-hint';
    hint.style.margin = '0 0 4px';
    hint.textContent = `店員：「${step.shopkeeper_prompt || ''}」`;

    const mkSub = (text) => {
      const p = document.createElement('p');
      p.className = 'form-hint';
      p.style.cssText = 'margin:6px 0 2px;font-weight:600';
      p.textContent = text;
      return p;
    };

    const kwInput = document.createElement('input');
    kwInput.className = 'form-input kw-step-input';
    kwInput.type      = 'text';
    kwInput.value     = curKw.join(', ');
    kwInput.placeholder = '逗號分隔；留空＝還原預設';

    const accInput = document.createElement('textarea');
    accInput.className = 'form-input kw-acc-input';
    accInput.rows      = Math.min(4, Math.max(2, curAcc.length));
    accInput.value     = curAcc.join('\n');
    accInput.placeholder = '一行一句；第 1 行＝標準答案；清空＝還原預設';
    accInput.style.cssText = 'resize:vertical;font-size:0.85rem';

    const optInput = document.createElement('textarea');
    optInput.className = 'form-input kw-opt-input';
    optInput.rows      = Math.min(5, Math.max(2, curOpt.length));
    optInput.value     = curOpt.join('\n');
    optInput.placeholder = '一行一個；第 1 行＝正確選項；清空＝還原預設';
    optInput.style.cssText = 'resize:vertical;font-size:0.85rem';

    // 各欄位包進分類容器，由上方勾選控制顯示（只切顯示不重繪，未存的輸入不會丟）
    const wrapField = (cls, subLabel, inputEl) => {
      const d = document.createElement('div');
      d.className = cls;
      d.append(mkSub(subLabel), inputEl);
      return d;
    };
    row.append(
      label, hint,
      wrapField('kw-field-kw',  '🔑 關鍵字（說話／打字判定）', kwInput),
      wrapField('kw-field-acc', '💬 可接受完整語句（第 1 句＝標準答案，用於提示與高級判定）', accInput),
      wrapField('kw-field-opt', '🔘 選項（第 1 個＝正解，用於選項模式）', optInput),
    );
    list.appendChild(row);
  });
  applyKwFieldVisibility();
}

// ─── 編輯欄位顯示勾選（要不要呈現編修）───────────────────
// 三個分類各一個勾選框；未勾選＝收起該欄位（值仍在 DOM，儲存時照常保留）。狀態記憶本機。
const KW_SHOW_KEY = 'sp_kwEditorShow';
function loadKwShow() {
  const def = { kw: true, acc: false, opt: false };
  try { return { ...def, ...(JSON.parse(localStorage.getItem(KW_SHOW_KEY)) || {}) }; }
  catch { return def; }
}
function applyKwFieldVisibility() {
  const show = {
    kw:  document.getElementById('kw-show-kw').checked,
    acc: document.getElementById('kw-show-acc').checked,
    opt: document.getElementById('kw-show-opt').checked,
  };
  try { localStorage.setItem(KW_SHOW_KEY, JSON.stringify(show)); } catch {}
  document.querySelectorAll('.kw-field-kw').forEach(el => { el.hidden = !show.kw; });
  document.querySelectorAll('.kw-field-acc').forEach(el => { el.hidden = !show.acc; });
  document.querySelectorAll('.kw-field-opt').forEach(el => { el.hidden = !show.opt; });
}

function saveKeywordEditor() {
  const overrides = loadKeywordOverrides();
  let droppedOpts = 0;   // 因「干擾項＝可接受語句」被剔除的選項數（守唯一正解）
  document.querySelectorAll('.kw-step-row').forEach(row => {
    const key   = row.dataset.key;
    const kwArr  = row.querySelector('.kw-step-input').value
      .split(/[,，、]+/).map(s => s.trim()).filter(Boolean);
    const accArr = row.querySelector('.kw-acc-input').value
      .split(/\n+/).map(s => s.trim()).filter(Boolean);
    let optArr   = row.querySelector('.kw-opt-input').value
      .split(/\n+/).map(s => s.trim()).filter(Boolean);

    // 守門：正解對齊＋唯一正解（干擾項不得 ∈ 可接受語句；欄位留空時以預設值交叉檢查）
    const effAcc = accArr.length ? accArr : row.dataset.defAcc.split('\n').filter(Boolean);
    if (optArr.length) {
      const answer = optArr[0];
      if (accArr.length && !accArr.includes(answer)) accArr.unshift(answer);
      const before = optArr.length;
      optArr = [answer, ...optArr.slice(1).filter(o => o !== answer && !effAcc.includes(o) && !accArr.includes(o))];
      droppedOpts += before - optArr.length;
    }

    const o = {};
    if (kwArr.length  && kwArr.join(',')   !== row.dataset.defKw)  o.keywords = kwArr;
    if (accArr.length && accArr.join('\n') !== row.dataset.defAcc) o.accepted = accArr;
    if (optArr.length >= 2 && optArr.join('\n') !== row.dataset.defOpt) o.options = optArr;
    if (Object.keys(o).length) overrides[key] = o;
    else delete overrides[key];
  });
  saveKeywordOverrides(overrides);
  renderKwSteps();
  document.getElementById('kw-save-status').textContent =
    `✓ 已儲存（下次進入該情境生效）${droppedOpts ? `；有 ${droppedOpts} 個干擾選項與可接受語句相同，已自動剔除` : ''}`;
}

function resetKwSituation() {
  const overrides = loadKeywordOverrides();
  document.querySelectorAll('.kw-step-row').forEach(row => { delete overrides[row.dataset.key]; });
  saveKeywordOverrides(overrides);
  renderKwSteps();
  document.getElementById('kw-save-status').textContent = '↩ 已還原本子情境的全部預設（關鍵字／語句／選項）';
}

function getAllScenarios() {
  return [...loadCustom().map(s => ({ ...s, isCustom: true })), ...SCENARIOS_DATA.scenarios];
}


// ─── 學生名冊（與 reward/ 獎勵系統共用）──────────────
// 名冊來源：localStorage 'rewardSystemStudents'（reward/ 系統維護）
// 目前學生：localStorage 'sp_currentStudent'（{id, name}；null = 訪客）

const CURRENT_STUDENT_KEY = 'sp_currentStudent';

function loadStudentRoster() {
  try { return JSON.parse(localStorage.getItem('rewardSystemStudents') || '[]'); }
  catch { return []; }
}

function getCurrentStudent() {
  try { return JSON.parse(localStorage.getItem(CURRENT_STUDENT_KEY) || 'null'); }
  catch { return null; }
}

function setCurrentStudent(s) {
  if (s) localStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify({ id: s.id, name: s.name }));
  else localStorage.removeItem(CURRENT_STUDENT_KEY);
  renderStudentChip();
}

function renderStudentChip() {
  const btn = document.getElementById('btn-student');
  if (!btn) return;
  const cur = getCurrentStudent();
  const label = cur ? (cur.name || '(未命名)') : '選擇學生';
  btn.innerHTML = `<span class="icon-badge">👤</span> ${label}`;
  btn.classList.toggle('student-chip--set', !!cur);
}

function openStudentModal() {
  const list = document.getElementById('student-select-list');
  list.innerHTML = '';
  const roster = loadStudentRoster();
  const cur = getCurrentStudent();

  const addCard = (label, photoHtml, selected, onPick) => {
    const btn = document.createElement('button');
    btn.className = 'student-select-card' + (selected ? ' selected' : '');
    btn.innerHTML = `${photoHtml}<span class="student-select-name">${label}</span>`;
    btn.addEventListener('click', () => {
      sfx.click();
      onPick();
      document.getElementById('student-modal').hidden = true;
    });
    list.appendChild(btn);
  };

  roster.forEach(s => {
    const photo = s.photo
      ? `<img class="student-select-photo" src="${s.photo}" alt="">`
      : '<span class="student-select-photo student-select-photo--emoji">🙂</span>';
    addCard(s.name || '(未命名)', photo, cur?.id === s.id, () => setCurrentStudent(s));
  });
  addCard('訪客（不記名）',
    '<span class="student-select-photo student-select-photo--emoji">👤</span>',
    !cur, () => setCurrentStudent(null));

  document.getElementById('student-modal-hint').textContent = roster.length
    ? '名冊與獎勵系統共用；要新增學生請到獎勵系統。'
    : '尚未建立學生名冊——請先到主頁，找金婆婆新增學生，或先以訪客身分練習。';
  document.getElementById('student-modal').hidden = false;
}

// 主題色預設
const THEME_PRESETS = [
  { color: '#16A34A', bg: '#DCFCE7', accent: '#15803D', label: '綠' },
  { color: '#D97706', bg: '#FEF3C7', accent: '#B45309', label: '橘' },
  { color: '#7C3AED', bg: '#EDE9FE', accent: '#6D28D9', label: '紫' },
  { color: '#2563EB', bg: '#DBEAFE', accent: '#1D4ED8', label: '藍' },
  { color: '#DB2777', bg: '#FCE7F3', accent: '#BE185D', label: '粉' },
];


// ─── 導覽堆疊 ────────────────────────────────────────

const nav = {
  stack: [],
  push(toId) {
    const cur = document.querySelector('.screen.active')?.id;
    if (cur) this.stack.push(cur);
    showScreen(toId);
  },
  pop() {
    showScreen(this.stack.pop() || 'screen-home');
  },
};


// ─── 工具函式 ────────────────────────────────────────

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}


// ─── 應用狀態 ────────────────────────────────────────

const state = {
  scenario:    null,
  situation:   null,    // 目前選取的情境（含 steps）
  simpleMode:  false,   // 簡易版：只練前 3 步
  stepIndex:   0,
  failCount:   0,
  hintLevel:   0,
  inputMode:   'voice',
  isListening: false,
  results:     [],
  difficulty:  'normal',
  frameLadder: false,   // 句框階梯是否啟用（初/中級啟用、高級維持自由輸入）
  promptLevel: 5,       // 提示褪除等級：6=最多支持 … 1=最少（自己說）
  scaffoldMode: false,  // 鷹架模式：系統主導輸入模式（隱藏下方切換列，由 promptLevel 決定模式）
};


// ─── 提示褪除階梯（promptLevel）─────────────────────────
// 支持多→少（數字越小＝越獨立）：
//   L6 看圖造句+2卡(emoji) / L5 看圖造句+4卡(emoji) / L4 詞庫組句 / L3 看句選擇 /
//   L2 照念(看範句開口念) / L1 自己說(無提示開口說)
// 終點是「開口說」：點選只是幫學生把句子建立起來的鷹架，最終要學生自己說出口。
// 答對降一級（褪除支持）、答錯升一級（無錯學習，回到更多鷹架）。
const LADDER = { SPEAK: 1, ECHO: 2, OPTIONS: 3, WORDBANK: 4, PICK4: 5, PICK2: 6 };
const LADDER_MIN = LADDER.SPEAK, LADDER_MAX = LADDER.PICK2;
const PROMPT_LEVEL_START = { easy: LADDER.PICK2, normal: LADDER.PICK4, hard: LADDER.WORDBANK };

// 精熟標準（ABA）：連續答對幾次才褪除一級提示，避免最易階兩選一猜對就降級。
// 教師可在設定頁調整（1~3，預設 2）。
function getMasteryCriterion() {
  const v = parseInt(localStorage.getItem('sp_masteryCriterion'), 10);
  return (v >= 1 && v <= 3) ? v : 2;
}

function promptLevelKey(scenarioId) {
  const stu = getCurrentStudent();
  return `sp_promptLevel_${stu?.id || 'guest'}_${scenarioId}`;
}
function loadPromptLevel(scenarioId, fallback) {
  const v = parseInt(localStorage.getItem(promptLevelKey(scenarioId)), 10);
  return (v >= LADDER_MIN && v <= LADDER_MAX) ? v : fallback;
}
function savePromptLevel(scenarioId, lvl) {
  try { localStorage.setItem(promptLevelKey(scenarioId), String(lvl)); } catch {}
}
// 句框階梯啟用時，依 promptLevel 決定本步驟輸入模式；否則回 null（沿用使用者選擇）
// 'speak'/'echo' 為開口說（語音），其餘為點選模式。
function resolveLadderMode(step) {
  if (!state.frameLadder) return null;
  const lvl = state.promptLevel;
  if (lvl <= LADDER.SPEAK)   return 'speak';     // L1 自己說（無提示開口）
  if (lvl <= LADDER.ECHO)    return 'echo';      // L2 照念（看範句開口念）
  if (lvl <= LADDER.OPTIONS) return 'options';   // L3 看句選擇
  const frame = getStepFrame(step);
  if (lvl <= LADDER.WORDBANK && frame && buildWordBank(frame)) return 'wordbank'; // L4 詞庫組句
  return frame ? 'frame' : 'options';            // L5/L6 看圖造句（無句框則退回選項）
}

const recognizer = new SpeechRecognizer();


// ─── 畫面切換 ────────────────────────────────────────

let _shopkeeperTimer = null;   // renderStep 排的「延遲播放店員語音」timer；換頁時要清掉以免在別頁觸發
let _lastGreetKey = null;      // 店員迎接彈窗的去重鍵（場所|情境|步驟）：同步驟重繪（重試/切模式）不重複跳窗

function showScreen(id) {
  stopAllAudio();
  clearTimeout(_shopkeeperTimer);   // 取消尚未觸發的店員語音（避免離開練習頁後才響）
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}


// ─── 語音選擇器 UI ────────────────────────────────────

function renderVoiceSelector() {
  const list = document.getElementById('voice-list');
  list.innerHTML = '';

  // 固定顯示所有有圖片的店員（不管語音有沒有安裝）
  const clerks = VOICE_INFO.filter(info => info.image);

  if (clerks.length === 0) {
    list.innerHTML = '<p class="voice-none">（無法讀取語音清單，語音功能可能受限）</p>';
    return;
  }

  // 備用語音（當店員語音未安裝時使用）
  const fallbackVoice = voiceManager.all.find(v => v.name.includes('Yating'))
                     || voiceManager.all[0]
                     || null;

  clerks.forEach(info => {
    // 找對應的已安裝語音
    const matchedVoice = voiceManager.all.find(v => v.name.includes(info.keyword));
    const hasVoice     = !!matchedVoice;
    const isActive     = voiceManager.selectedInfo?.keyword === info.keyword
                      || (!voiceManager.selectedInfo && info.isDefault);

    const avatarHtml = `<img class="voice-avatar-img" src="${info.image}" alt="${info.name}">`;
    const roleHtml   = info.role ? `<span class="voice-role">${info.role}</span>` : '';
    // 語音未安裝時顯示小提示
    const badgeHtml  = !hasVoice
      ? '<span class="voice-na-badge" title="此語音未安裝，將使用預設語音">🔇</span>'
      : '';

    const card = document.createElement('button');
    card.className = 'voice-card' + (isActive ? ' selected' : '') + (!hasVoice ? ' voice-unavailable' : '');
    card.setAttribute('aria-label', `選擇店員 ${info.name}${!hasVoice ? '（語音未安裝）' : ''}`);
    card.setAttribute('aria-pressed', String(isActive));
    card.innerHTML = `
      ${avatarHtml}
      <span class="voice-name">${info.name}</span>
      ${roleHtml}
      ${badgeHtml}
    `;
    // 圖檔缺失（例如專屬頭像尚未生成）時退回 emoji，避免破圖
    const imgEl = card.querySelector('.voice-avatar-img');
    if (imgEl) imgEl.addEventListener('error', () => {
      const span = document.createElement('span');
      span.className = 'voice-avatar';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = GENDER_AVATAR[info.gender] || '🧑';
      imgEl.replaceWith(span);
    });
    card.addEventListener('click', () => {
      voiceManager.selectedInfo = info;
      voiceManager.selected     = matchedVoice || fallbackVoice;
      sfx.click();
      tts.speak('你好！歡迎光臨！');
      renderVoiceSelector();
    });
    list.appendChild(card);
  });
}


// ─── 學生語音選擇器 UI ────────────────────────────────

function renderUserVoiceSelector() {
  const list = document.getElementById('user-voice-list');
  if (!list) return;
  list.innerHTML = '';

  // 備用語音（學生語音未安裝時使用）
  const fallback = voiceManager.all.find(v => v.name.includes('Zhiwei'))
                || voiceManager.all.find(v => v.name.includes('Yating'))
                || voiceManager.all[0]
                || null;

  STUDENT_PROFILES.forEach((student, idx) => {
    const matchedVoice = voiceManager.all.find(v => v.name.includes(student.voiceKeyword));
    const isActive     = userVoiceManager.selectedStudentIdx === idx
                      || (!userVoiceManager.selectedStudentIdx && idx === 0);

    const avatarHtml = student.image
      ? `<img class="voice-avatar-img" src="${student.image}" alt="${student.name}">`
      : `<span class="student-avatar" style="background:${student.color}" aria-hidden="true">${student.emoji}</span>`;
    const roleHtml = '';

    const card = document.createElement('button');
    card.className = 'voice-card user-voice-card' + (isActive ? ' selected' : '');
    card.setAttribute('aria-label', `選擇學生 ${student.name}`);
    card.setAttribute('aria-pressed', String(isActive));
    card.innerHTML = `
      ${avatarHtml}
      <span class="voice-name">${student.name}</span>
      ${roleHtml}
    `;
    card.addEventListener('click', () => {
      userVoiceManager.selectedStudentIdx = idx;
      userVoiceManager.selected = matchedVoice || fallback;
      sfx.click();
      speakAsUser('我要點餐！');
      renderUserVoiceSelector();
    });
    list.appendChild(card);
  });
}


// ─── 首頁「選擇學生語音」頭像列 + 彈窗 ──────────────────

function selectStudentVoice(idx) {
  const student  = STUDENT_PROFILES[idx];
  const fallback = voiceManager.all.find(v => v.name.includes('Zhiwei'))
                || voiceManager.all.find(v => v.name.includes('Yating'))
                || voiceManager.all[0] || null;
  const matched  = voiceManager.all.find(v => v.name.includes(student.voiceKeyword));
  userVoiceManager.selectedStudentIdx = idx;
  userVoiceManager.selected = matched || fallback;
  return { student, matched };
}

function renderHomeStudentStrip() {
  const strip = document.getElementById('home-student-strip');
  if (!strip) return;
  strip.innerHTML = '';
  STUDENT_PROFILES.forEach((student, idx) => {
    const isActive = userVoiceManager.selectedStudentIdx === idx;
    const btn = document.createElement('button');
    btn.className = 'home-student-avatar' + (isActive ? ' selected' : '');
    btn.setAttribute('aria-label', `學生 ${student.name} 的語音`);
    btn.title = student.name;
    btn.innerHTML = student.image
      ? `<img src="${student.image}" alt="${student.name}">`
      : `<span class="student-avatar" style="background:${student.color}">${student.emoji}</span>`;
    const img = btn.querySelector('img');
    if (img) img.onerror = () => {
      btn.innerHTML = `<span class="student-avatar" style="background:${student.color}">${student.emoji}</span>`;
    };
    btn.addEventListener('click', () => { sfx.click(); openStudentVoicePopup(idx); });
    strip.appendChild(btn);
  });
}

function openStudentVoicePopup(idx) {
  const { student } = selectStudentVoice(idx);
  const img = document.getElementById('student-voice-img');
  img.src = student.image || '';
  img.alt = student.name;
  document.getElementById('student-voice-name').textContent = student.name;
  document.getElementById('student-voice-role').textContent = '';
  document.getElementById('student-voice-modal').hidden = false;
  speakAsUser('你好！我要點餐！');
  renderHomeStudentStrip();   // 更新選中框
}

function hideStudentVoicePopup() {
  stopAllAudio();
  document.getElementById('student-voice-modal').hidden = true;
}


// ─── 店員介紹彈窗（主頁點頭像）─────────────────────────

function showClerkPopup(scenario, clerkInfo) {
  if (!clerkInfo) return;
  const img  = document.getElementById('clerk-modal-img');
  img.src = clerkInfo.image;
  img.alt = clerkInfo.name;
  img.hidden = false;
  document.getElementById('clerk-modal-name').textContent = clerkInfo.name;
  document.getElementById('clerk-modal-role').textContent = clerkInfo.role || '';
  document.getElementById('clerk-modal-text').textContent = SCENARIO_CLERK_MAP[scenario.id]?.intro || '';
  const modal = document.getElementById('clerk-modal');
  modal.hidden = false;
  // 記住目前彈窗對應的場所，供「再聽一次」使用
  modal._scenario = scenario;
  modal._practiceStep = null;
  playClerkIntro(scenario);
}

function hideClerkPopup() {
  stopAllAudio();
  const modal = document.getElementById('clerk-modal');
  modal.hidden = true;
  modal._scenario = null;
  modal._practiceStep = null;
}

// ─── 練習頁店員彈窗（點頭像／進入練習自動迎接）─────────
// 共用 clerk-modal（桌面端店員圖 300px）：放大目前步驟的店員，並播放這一步的台詞。
function showPracticeClerkPopup() {
  const step = state.situation?.steps?.[state.stepIndex];
  if (!step) return;
  const scMap     = SCENARIO_CLERK_MAP[state.scenario?.id];
  const voiceInfo = voiceManager.selectedInfo
                 || (voiceManager.selected ? voiceManager.getInfo(voiceManager.selected) : null);
  // 圖片以練習頁頭像當下顯示者為準（含教師自訂場景照片），再退回場景/語音推斷
  const curImg = document.querySelector('#shopkeeper-avatar img')?.getAttribute('src') || '';
  const img  = curImg || step.clerkImage || state.situation.clerkImage || scMap?.image || voiceInfo?.image || '';
  const name = step.clerkName  || state.situation.clerkName  || scMap?.name  || voiceInfo?.name  || '店員';
  const imgEl = document.getElementById('clerk-modal-img');
  imgEl.src = img;
  imgEl.alt = name;
  imgEl.hidden = !img;
  imgEl.onerror = () => { imgEl.hidden = true; };
  document.getElementById('clerk-modal-name').textContent = name;
  document.getElementById('clerk-modal-role').textContent =
    state.situation.clerkName ? '' : (scMap?.role || voiceInfo?.role || '');
  // 彈窗下方顯示正在播放的台詞文字（與語音同步呈現，多元表徵）
  document.getElementById('clerk-modal-text').textContent = step.shopkeeper_prompt || '';
  const modal = document.getElementById('clerk-modal');
  modal.hidden = false;
  modal._scenario = null;
  modal._practiceStep = step;   // 「再聽一次」重播本步驟台詞
  playShopkeeperAudio(step);
}


// ─── 店員介紹語音 ─────────────────────────────────────

function playClerkIntro(scenario) {
  const clerkData = SCENARIO_CLERK_MAP[scenario.id];
  if (!clerkData) return;
  stopAllAudio();
  const voice = voiceManager.all.find(v => v.name.includes(clerkData.keyword));
  const info  = VOICE_INFO.find(v => v.keyword === clerkData.keyword);
  if (voice) voiceManager.selected = voice;
  if (info)  voiceManager.selectedInfo = info;

  const candidates = [
    `audio/clerk/${scenario.id}_intro.mp3`,
    `audio/clerk/${scenario.id}_intro.wav`,
  ];
  let idx = 0;
  const tryNext = () => {
    if (idx >= candidates.length) { tts.speak(clerkData.intro, 0.85); return; }
    const audio = new Audio(candidates[idx++]);
    _shopkeeperAudio = audio;
    audio.onended = () => { if (_shopkeeperAudio === audio) _shopkeeperAudio = null; };
    audio.onerror = () => { if (_shopkeeperAudio === audio) { _shopkeeperAudio = null; tryNext(); } };
    audio.play().catch(() => { if (_shopkeeperAudio === audio) { _shopkeeperAudio = null; tryNext(); } });
  };
  tryNext();
}


// ─── 回饋語音播放（優先音檔，fallback TTS）──────────────
function playFeedbackAudio(text, score) {
  stopAllAudio();
  // 自訂情境無預錄回饋檔，直接即時 TTS（避免 404 徒勞查找）
  if (state.scenario?.isCustom) { tts.speak(text); return; }
  const step = state.situation.steps[state.stepIndex];
  const base = `audio/feedback/${state.scenario.id}_${state.situation.id}_${step.id}_${score}`;
  const candidates = [`${base}.mp3`, `${base}.wav`];
  let idx = 0;
  const tryNext = () => {
    if (idx >= candidates.length) { tts.speak(text); return; }
    const audio = new Audio(candidates[idx++]);
    _feedbackAudio = audio;
    audio.onended = () => { if (_feedbackAudio === audio) _feedbackAudio = null; };
    audio.onerror = () => { if (_feedbackAudio === audio) { _feedbackAudio = null; tryNext(); } };
    audio.play().catch(() => { if (_feedbackAudio === audio) { _feedbackAudio = null; tryNext(); } });
  };
  tryNext();
}


// ─── 首頁 ────────────────────────────────────────────

// 情境分部（A 方案：依溝通難度進程）。自訂情境走 'custom' 分部。
const SCENARIO_PART = {
  convenience_store: 1, supermarket: 1, stationery_store: 1, bakery: 1, beauty_store: 1, clothing_store: 1,   // 第一部分・基礎買賣
  breakfast_shop: 2, fast_food: 2, night_market: 2, drink_shop: 2, lunchbox_shop: 2, coffee_shop: 2,  // 第二部分・點餐客製
  pharmacy: 3, phone_reservation: 3, ask_directions: 3, post_office: 3, library: 3, police_station: 3,  // 第三部分・生活應對
  anti_scam: 4, classmate_borrow: 4, online_scam: 4, self_protect: 4, job_scam: 4, privacy_protect: 4,  // 第四部分・金錢安全
  take_bus: 5, mrt_station: 5, train_ticket: 5, taxi: 5, easycard_service: 5, ride_manner: 5,  // 第五部分・交通出行
  cinema: 6, ktv: 6, swimming_pool: 6, amusement_park: 6, arcade: 6, comic_store: 6,  // 第六部分・休閒娛樂
  job_interview: 7, first_day: 7, ask_at_work: 7, call_leave: 7, get_paid: 7, serve_customer: 7,  // 第七部分・職場初體驗
};
let homePart = '1';   // 目前選中的分部（'1'|'2'|'3'|'custom'）

function renderHome() {
  recognizer.endSession();
  tts.cancel();
  const grid = document.getElementById('scenario-grid');
  grid.innerHTML = '';

  getAllScenarios().filter(sc =>
    homePart === 'custom' ? sc.isCustom : (!sc.isCustom && (SCENARIO_PART[sc.id] || 1) === Number(homePart))
  ).forEach(scenario => {
    const clerkData = SCENARIO_CLERK_MAP[scenario.id];
    const clerkBase = clerkData ? VOICE_INFO.find(v => v.keyword === clerkData.keyword) : null;
    // 允許 SCENARIO_CLERK_MAP 以 name/role/image 覆寫語音角色的預設頭像。
    // 用於沒有專屬語音的情境（電話預約、問路）——語音沿用 keyword，頭像用自己的圖。
    const clerkInfo = clerkData ? {
      keyword: clerkData.keyword,
      name:  clerkData.name  || clerkBase?.name,
      role:  clerkData.role  || clerkBase?.role,
      image: clerkData.image || clerkBase?.image,
    } : null;

    // 外層 wrapper（讓店員頭像可以浮出卡片上方）
    const wrap = document.createElement('div');
    wrap.className = 'scenario-card-wrap';

    const card = document.createElement('button');
    card.className = 'scenario-card' + (scenario.available === false ? ' disabled' : '');
    card.disabled = (scenario.available === false);
    card.setAttribute('aria-label', scenario.name);

    const theme = scenario.theme || { color: '#2563EB', bg: '#EFF6FF' };
    wrap.style.setProperty('--card-color', theme.color);
    wrap.style.setProperty('--card-bg', theme.bg);
    card.style.setProperty('--card-color', theme.color);
    card.style.setProperty('--card-bg', theme.bg);

    const stepLabel = scenario.situations
      ? `${scenario.situations.length} 種情境`
      : ((scenario.steps?.length ?? 0) > 0 ? `${scenario.steps.length} 個對話步驟` : '即將推出');
    const isCustom = scenario.isCustom;
    // 商店場景圖（僅內建情境）：鋪在卡片最底層當背景，載入失敗則移除→退回 emoji 圖示
    const sceneImg = !isCustom ? `images/scenes/${scenario.id}.webp` : null;

    card.innerHTML = `
      ${sceneImg ? `<img class="card-bg-img" src="${sceneImg}" alt="" aria-hidden="true">` : ''}
      <div class="card-content">
        <div class="card-icon-wrap">
          <span class="card-icon">${scenario.icon || '💬'}</span>
        </div>
        <div class="card-title-row">
          <span class="card-name">${scenario.name}</span>
          <span class="card-steps">📝 ${stepLabel}</span>
        </div>
        <span class="card-badge ${scenario.available === false ? 'coming-soon' : ''}">
          ${isCustom ? '自訂情境 →' : scenario.available === false ? '即將推出' : '開始練習 →'}
        </span>
      </div>
    `;
    if (sceneImg) {
      card.classList.add('has-scene');
      const bg = card.querySelector('.card-bg-img');
      if (bg) bg.addEventListener('error', () => { bg.remove(); card.classList.remove('has-scene'); });
    }
    if (scenario.available !== false) {
      card.addEventListener('click', () => startScenario(scenario));
    }
    wrap.appendChild(card);

    // 店員頭像按鈕（僅內建且有圖片的場所）
    if (clerkInfo?.image && !isCustom) {
      const clerkBtn = document.createElement('button');
      clerkBtn.className = 'clerk-intro-btn';
      clerkBtn.setAttribute('aria-label', `${clerkInfo.name} 介紹`);
      clerkBtn.title = `點我聽 ${clerkInfo.name} 介紹`;
      clerkBtn.innerHTML = `<img src="${clerkInfo.image}" alt="${clerkInfo.name}">`;
      // 圖檔不存在（如尚未生成的專屬頭像）時，直接移除頭像鈕，避免顯示破圖
      clerkBtn.querySelector('img').onerror = () => clerkBtn.remove();
      clerkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sfx.click();
        showClerkPopup(scenario, clerkInfo);
        clerkBtn.classList.add('speaking');
        setTimeout(() => clerkBtn.classList.remove('speaking'), 3000);
      });
      wrap.appendChild(clerkBtn);
    }

    grid.appendChild(wrap);
  });

  // 「➕ 自訂情境」入口卡：僅在「⭐ 自訂」分部顯示（老師自編對話入口）
  if (homePart === 'custom') {
    const addWrap = document.createElement('div');
    addWrap.className = 'scenario-card-wrap';
    const addCard = document.createElement('button');
    addCard.className = 'scenario-card scenario-card-add';
    addCard.setAttribute('aria-label', '建立自訂情境');
    addCard.innerHTML = `
      <div class="card-icon-wrap"><span class="card-icon">➕</span></div>
      <span class="card-name">自訂情境</span>
      <span class="card-steps">🧑‍🏫 老師自編對話</span>
      <span class="card-badge">建立新情境 →</span>
    `;
    addCard.addEventListener('click', () => { sfx.click(); openScenarioEditor(-1); });
    addWrap.appendChild(addCard);
    grid.appendChild(addWrap);
  }

  renderHomeStudentStrip();
  showScreen('screen-home');
}


// ─── 開始情境 ────────────────────────────────────────

function startScenario(scenario) {
  // 自動切換到此場所對應的店員語音
  const clerkData = SCENARIO_CLERK_MAP[scenario.id];
  if (clerkData) {
    const voice = voiceManager.all.find(v => v.name.includes(clerkData.keyword));
    const info  = VOICE_INFO.find(v => v.keyword === clerkData.keyword);
    const fallback = voiceManager.all.find(v => v.name.includes('Yating')) || voiceManager.all[0];
    voiceManager.selected     = voice || fallback;
    voiceManager.selectedInfo = info  || null;
  }

  state.scenario  = scenario;
  state.situation = null;
  state.results   = [];
  state.scaffoldMode = false;   // 選新場景時先歸零，只有走鷹架入口才啟用
  // 瀏覽器不支援語音輸入（如部分 iPad Safari）時，預設改用選項模式
  state.inputMode = recognizer.supported ? 'voice' : 'options';

  const theme = scenario.theme || { color: '#2563EB', bg: '#EFF6FF', accent: '#1D4ED8' };
  for (const id of ['screen-practice', 'screen-difficulty', 'screen-situation']) {
    const el = document.getElementById(id);
    el.style.setProperty('--scene-color',  theme.color);
    el.style.setProperty('--scene-lt',     theme.bg);
    el.style.setProperty('--scene-accent', theme.accent || theme.color);
  }

  // 自訂情境：無 situations 子層（扁平 steps），包成單一情境直接進難度選擇
  if (!scenario.situations && Array.isArray(scenario.steps)) {
    startWithSituation({
      id:   'custom',
      name: '自訂練習',
      icon: scenario.icon || '💬',
      desc: '',
      steps: scenario.steps,
    });
    return;
  }

  const sitIcon = document.getElementById('sit-icon');
  sitIcon.textContent      = scenario.icon || '💬';
  sitIcon.style.background = 'transparent';   // emoji 圖示不加底色
  document.getElementById('sit-name').textContent = scenario.name;

  renderSituationOptions();
  showScreen('screen-situation');
}

function renderSituationOptions() {
  const container = document.getElementById('situation-options');
  container.innerHTML = '';
  (state.scenario.situations || []).forEach(sit => {
    const stepCount = state.simpleMode
      ? Math.min(3, sit.steps.length)
      : sit.steps.length;
    const badge = state.simpleMode && sit.steps.length > 3
      ? '<span class="sit-card-mode-badge">簡易 3 步</span>'
      : '';
    const card = document.createElement('button');
    card.className = 'situation-card';
    card.innerHTML = `
      <div class="sit-card-header">
        <span class="sit-icon">${sit.icon}</span>
        <span class="sit-name">${sit.name}${badge}</span>
      </div>
      <p class="sit-desc">${sit.desc} <span style="color:var(--gray-600);font-size:0.8em">（${stepCount} 步驟）</span></p>
    `;
    card.addEventListener('click', () => { sfx.click(); startWithSituation(sit); });
    container.appendChild(card);
  });
}

// 鷹架模式總開關：目前先關閉（功能尚未成熟，只開放初/中/高級難度）。
// 之後要重新啟用，把此旗標改回 true 即可；相關程式（階梯/照念/自己說）都保留。
const SCAFFOLD_ENABLED = false;

// 鷹架模式適用範圍：每個場所的「主情境」＝ situations 的第一個（基本購物/基本點餐/診所掛號/問捷運站…）。
// 特殊情境（錢不夠、找不到商品…）與自訂扁平場景維持原難度流程。
function isScaffoldPilot(scenario, situation) {
  if (!SCAFFOLD_ENABLED) return false;
  const first = scenario?.situations?.[0];
  return !!first && !!situation && first.id === situation.id;
}

function startWithSituation(situation) {
  // 內建情境套用教師覆寫（關鍵字／完整語句／選項）；自訂情境有自己的編輯器，不套
  const effective = state.scenario?.isCustom
    ? situation
    : applyStepOverrides(state.scenario.id, situation.id, situation);
  // 簡易版：截取前 3 步驟
  const steps = state.simpleMode
    ? { ...effective, steps: effective.steps.slice(0, 3) }
    : effective;
  state.situation = steps;
  const label = `${state.scenario.name}・${situation.name}${state.simpleMode ? '（簡易）' : ''}`;

  // 難度選擇頁（鷹架卡置頂＋初/中/高級）。鷹架模式只在各場所「主情境」顯示。
  document.getElementById('diff-icon').textContent = state.scenario.icon || '💬';
  document.getElementById('diff-name').textContent = label;
  document.getElementById('diff-steps').textContent = `${steps.steps.length} 個對話步驟`;

  const showScaffold = isScaffoldPilot(state.scenario, situation);
  document.getElementById('diff-scaffold-card').hidden = !showScaffold;
  // 有鷹架時它是首選（讓出「推薦」高亮）；沒有鷹架時中級維持推薦
  document.getElementById('diff-scaffold-card').classList.toggle('diff-card--recommended', showScaffold);
  document.getElementById('diff-normal-card').classList.toggle('diff-card--recommended', !showScaffold);
  document.getElementById('diff-prompt').textContent = showScaffold ? '要怎麼練習？' : '請選擇練習難度';

  showScreen('screen-difficulty');
}

// 鷹架模式入口：系統主導，起始 L5（看圖 4 卡・中級），依表現自動褪除/加回鷹架，終點是開口說
function startScaffoldMode() {
  state.scaffoldMode = true;
  startWithDifficulty('normal');
}

function startWithDifficulty(difficulty) {
  state.difficulty = difficulty;
  state.stepIndex  = 0;
  state.results    = [];
  state.startTs    = Date.now();
  // 句框階梯：初/中級啟用並走最有結構的路徑；高級維持自由輸入（挑戰）
  state.frameLadder = (difficulty !== 'hard');
  state.promptLevel = state.frameLadder
    ? loadPromptLevel(state.scenario.id, PROMPT_LEVEL_START[difficulty] ?? LADDER.PICK4)
    : LADDER.SPEAK;
  state.consecutiveCorrect = 0;   // 精熟標準：連續答對計數
  recognizer.requestPermission();
  _lastGreetKey = null;            // 新一輪練習：迎接彈窗去重鍵歸零（每一步都會由店員登場唸台詞）
  showScreen('screen-practice');   // 先切練習頁（showScreen 會 clearTimeout 店員語音計時器）
  renderStep();                    // 再 renderStep 設自動播放計時器，否則第一步的自動播放會被 showScreen 清掉
}


// ─── 渲染步驟 ────────────────────────────────────────

function renderStep() {
  const step  = state.situation.steps[state.stepIndex];
  const total = state.situation.steps.length;

  // 進度列（含當前步驟：第一步就看得到進度，較有「正在前進」的感覺）
  document.getElementById('progress-fill').style.width =
    (((state.stepIndex + 1) / total) * 100) + '%';
  document.getElementById('step-counter').textContent =
    `${state.stepIndex + 1} / ${total}`;

  // 店員頭像優先序：子情境專屬圖(clerkImage) ＞ 場景店員(SCENARIO_CLERK_MAP 覆寫，如小晴/小芸) ＞ 語音推斷
  const avatarEl   = document.getElementById('shopkeeper-avatar');
  const scMap      = SCENARIO_CLERK_MAP[state.scenario?.id];
  const voiceInfo  = voiceManager.selectedInfo
                  || (voiceManager.selected ? voiceManager.getInfo(voiceManager.selected) : null);
  const avatarImg  = step.clerkImage || state.situation.clerkImage || scMap?.image || voiceInfo?.image;
  const avatarName = step.clerkName  || state.situation.clerkName  || scMap?.name  || voiceInfo?.name || '店員';
  if (avatarImg) {
    avatarEl.innerHTML = `<img src="${avatarImg}" alt="${avatarName}">`;
    // 圖檔缺失時退回場景店員圖，再退回 emoji（避免破圖）
    avatarEl.querySelector('img').onerror = () => {
      const fb = scMap?.image || voiceInfo?.image;
      if (fb && fb !== avatarImg) avatarEl.innerHTML = `<img src="${fb}" alt="${avatarName}">`;
      else avatarEl.textContent = voiceManager.getAvatar();
    };
  } else {
    avatarEl.textContent = voiceManager.getAvatar();
  }
  // 教師自訂場景照片（IndexedDB）優先覆蓋店員頭像
  const _rScId = state.scenario?.id, _rIdx = state.stepIndex;
  if (_rScId) {
    resolveCustomImageURL(`${_rScId}::__scene::img`).then(url => {
      if (url && state.scenario?.id === _rScId && state.stepIndex === _rIdx) {
        avatarEl.innerHTML = `<img src="${url}" alt="${avatarName}">`;
      }
    });
  }

  // 店員對話
  document.getElementById('shopkeeper-speech-text').textContent = step.shopkeeper_prompt;

  // 商品圖片：教師自訂照片(IndexedDB) ＞ scenarios.js 內建 image
  const imgCard = document.getElementById('step-image-card');
  const imgEl   = document.getElementById('step-image');
  const lblEl   = document.getElementById('step-image-label');
  if (step.image) {
    imgEl.src         = step.image;
    imgEl.alt         = step.image_label || step.task || '商品圖示';
    lblEl.textContent = step.image_label || '';
    imgCard.hidden    = false;
    imgEl.onerror     = () => { imgCard.hidden = true; };
  } else {
    imgCard.hidden    = true;
    imgEl.src         = '';
    imgEl.alt         = '';
    lblEl.textContent = '';
  }
  // 教師自訂步驟照片（IndexedDB）優先顯示（即使沒有內建 image 也會出現）
  if (_rScId && step.id) {
    resolveCustomImageURL(`${_rScId}::${step.id}::img`).then(url => {
      if (!url || state.scenario?.id !== _rScId || state.stepIndex !== _rIdx) return;
      imgEl.onerror     = null;
      imgEl.src         = url;
      imgEl.alt         = step.image_label || step.task || '照片';
      lblEl.textContent = step.image_label || '';
      imgCard.hidden    = false;
    });
  }

  // 任務
  document.getElementById('task-text').textContent = step.task;

  // 重置狀態
  state.failCount    = 0;
  state.hintLevel    = 0;
  state.stepAttempts = 0;      // 本步驟作答次數（重試累計，IEP 紀錄用）
  state.stepHintUsed = false;  // 本步驟是否用過提示
  hideFeedback();
  hideActionRow();

  // 標題列：場景圖示 + 「場景・練習情境」，例如「早餐店・基本點餐」（不再顯示難度）
  document.getElementById('ph-scene-icon').textContent = state.scenario?.icon || '💬';
  document.getElementById('ph-scene-name').textContent =
    `${state.scenario?.name || ''}・${state.situation?.name || ''}`;

  // 初級：隱藏「你的任務」框，直接在畫面內顯示「你可以這樣說」提示句
  // （不用彈窗，避免和店員語音同時出現；也不讓任務框與提示框同時佔版面）
  const easyBox = document.getElementById('easy-hint-box');
  const taskBox = document.getElementById('task-box');
  if (state.difficulty === 'easy') {
    taskBox.hidden = true;
    document.getElementById('easy-hint-text').textContent =
      `「${step.accepted_phrases[0]}」`;
    easyBox.hidden = false;
    document.getElementById('hint-text').textContent =
      `提示：「${step.accepted_phrases[0]}」`;
  } else {
    taskBox.hidden = false;
    easyBox.hidden = true;
  }
  // 初級已有「你可以這樣說」提示框（含喇叭），底部「💡 提示」按鈕多餘 → 隱藏；中/高級保留
  document.getElementById('btn-hint-trigger').hidden = (state.difficulty === 'easy');
  hideHint();

  // 設定輸入模式：
  // ・鷹架模式：由 promptLevel 階梯決定（看圖造句→詞庫→選項→照念→自己說），學生不手動切。
  // ・自由模式：預設「跟讀」(開口練習)；學生可手動切看圖造句/詞庫/選擇/打字並沿用。
  if (state.scaffoldMode) {
    applyScaffoldMode(resolveLadderMode(step) || 'options', step);
  } else {
    setInputMode(state.inputMode);
  }

  // 播放店員語音（優先音檔，fallback TTS）
  // 店員迎接彈窗開啟時：每個新步驟改由彈窗放大店員唸台詞（彈窗內含播放）；
  // 同步驟重繪（重試/切輸入模式）只重播語音、不再跳窗
  clearTimeout(_shopkeeperTimer);
  const greetKey = `${state.scenario?.id}|${state.situation?.id}|${state.stepIndex}`;
  const doGreet  = a11y.clerkGreet && greetKey !== _lastGreetKey;
  if (doGreet) _lastGreetKey = greetKey;
  _shopkeeperTimer = setTimeout(() => {
    // 只在仍停留於練習頁時才播（防呼叫後又離開頁面／快速換頁殘留）
    if (!document.getElementById('screen-practice').classList.contains('active')) return;
    if (doGreet) showPracticeClerkPopup(); else playShopkeeperAudio(step);
  }, 400);

  // 除錯面板更新
  if (window._debugUpdate) window._debugUpdate();
}


// ─── 鷹架模式：把階梯模式套到畫面 ─────────────────────
// 'speak'/'echo' → 開口說（語音輸入）；echo 另顯示範句讓學生照念。其餘 → 一般點選模式。
function applyScaffoldMode(ladderMode, step) {
  const modelBox = document.getElementById('easy-hint-box');
  const label    = document.querySelector('#easy-hint-box .easy-hint-label');
  if (ladderMode === 'speak' || ladderMode === 'echo') {
    if (ladderMode === 'echo') {
      // 照念：顯示完整範句 + 喇叭（btn-easy-hint-speak 會唸 accepted_phrases[0]）
      if (label) label.textContent = '🗣️ 照著念一次';
      document.getElementById('easy-hint-text').textContent = `「${step.accepted_phrases[0]}」`;
      document.getElementById('hint-text').textContent = `提示：「${step.accepted_phrases[0]}」`;
      modelBox.hidden = false;
    } else {
      // 自己說：不給範句
      modelBox.hidden = true;
    }
    // 沒有語音辨識的瀏覽器：階梯的「開口說」兩級都導到跟讀（自評），
    // 否則 setInputMode('voice') 會被轉走、鷹架路徑在這些裝置上直接斷掉
    setInputMode(recognizer.supported ? 'voice' : 'echo');
  } else {
    if (label) label.textContent = '💡 你可以這樣說';
    modelBox.hidden = true;
    setInputMode(ladderMode);
  }
}

// ─── 跟讀模式（不需語音辨識）──────────────────────────
// 用於沒有 SpeechRecognition 的瀏覽器（三星瀏覽器、iOS 主畫面 App…）：
// 給範句 → 學生照念 → 自評三級。不辨識、不比對，成績照記但標 selfRated，
// 報表上與「系統評分」分開呈現，才不會混淆 IEP 資料的來源。
function echoModelSentence(step) {
  return (step?.accepted_phrases && step.accepted_phrases[0]) || step?.options?.[0] || '';
}

// 跟讀錄音：念完可以播回自己的聲音，自評才有依據（純憑印象容易隨手按「很清楚」）。
// 刻意**只留在記憶體**，換步驟就丟：不寫 IndexedDB → 不佔空間、學生的聲音不會留在裝置上。
// 錄音（MediaRecorder）與語音辨識是兩回事，三星瀏覽器／iOS 主畫面 App 都有錄音。
const echoRecorder = {
  _rec: null, _stream: null, _chunks: [], _url: null, _audio: null,

  get supported() { return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder); },
  get recording() { return this._rec?.state === 'recording'; },
  get hasClip()   { return !!this._url; },

  async start() {
    stopAllAudio();
    this.discard();
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      echoSetStatus('沒辦法使用麥克風，請允許錄音權限；也可以不錄音直接自評。');
      unlockEchoRate();          // 拿不到麥克風就別把學生卡在這一步
      return;
    }
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
               : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
    this._chunks = [];
    this._rec = mime ? new MediaRecorder(this._stream, { mimeType: mime }) : new MediaRecorder(this._stream);
    this._rec.ondataavailable = e => { if (e.data?.size) this._chunks.push(e.data); };
    this._rec.onstop = () => {
      this._releaseStream();
      const blob = new Blob(this._chunks, { type: this._rec?.mimeType || 'audio/webm' });
      if (blob.size >= 200) this._url = URL.createObjectURL(blob);
      echoSetStatus(this._url ? '錄好了！按「▶ 聽我念的」聽聽看，再評分。' : '錄音太短，再念一次試試。');
      if (this._url) unlockEchoRate(); else updateEchoRecUI();   // 念過了才開放自評
    };
    this._rec.start();
    echoSetStatus('🔴 錄音中……請念出上面的句子，念完按「⏹ 停止」。');
    updateEchoRecUI();
  },

  stop() { if (this.recording) { try { this._rec.stop(); } catch {} } },

  play() {
    if (!this._url) return;
    stopAllAudio();
    this._audio = new Audio(this._url);
    this._audio.play().catch(() => echoSetStatus('播不出來，請再錄一次。'));
  },

  // 換步驟／離開跟讀模式：丟掉錄音並確實關掉麥克風（否則指示燈會一直亮著）
  discard() {
    this.stop();
    this._releaseStream();
    if (this._audio) { try { this._audio.pause(); } catch {} this._audio = null; }
    if (this._url) { URL.revokeObjectURL(this._url); this._url = null; }
    this._chunks = [];
  },

  _releaseStream() {
    this._stream?.getTracks().forEach(t => t.stop());
    this._stream = null;
  },
};

function echoSetStatus(msg) {
  const el = document.getElementById('echo-status');
  if (el) { el.textContent = msg || ''; el.hidden = !msg; }
}

// 自評是否已開放：先念過（錄完音／按了「不錄音，直接評分」）才給評分，順序才是「做→評」。
// 錄音失敗或裝置不能錄音時也會開放，免得流程卡死。
let _echoRateUnlocked = false;
function unlockEchoRate() { _echoRateUnlocked = true; updateEchoRecUI(); }

function updateEchoRecUI() {
  const recBtn  = document.getElementById('btn-echo-rec');
  const playBtn = document.getElementById('btn-echo-play');
  const skipBtn = document.getElementById('btn-echo-skip-rec');
  const rateBox = document.getElementById('echo-rate-block');
  if (!recBtn || !playBtn) return;

  const canRecord = echoRecorder.supported;
  recBtn.hidden  = !canRecord;
  playBtn.hidden = !canRecord || !echoRecorder.hasClip || echoRecorder.recording;
  if (canRecord) {
    recBtn.textContent = echoRecorder.recording ? '⏹ 停止'
                       : echoRecorder.hasClip   ? '🔄 重新錄音'
                       : '🎤 錄下我念的';
    recBtn.classList.toggle('recording', echoRecorder.recording);
  }

  // 不能錄音的裝置直接開放自評；能錄音的要先念過（或明示跳過錄音）
  const rateOpen = _echoRateUnlocked || !canRecord;
  if (rateBox) rateBox.hidden = !rateOpen;
  if (skipBtn) skipBtn.hidden = rateOpen || echoRecorder.recording;
}

function renderEchoRow() {
  const step = state.situation?.steps[state.stepIndex];
  if (!step) return;
  document.getElementById('echo-model-text').textContent = `「${echoModelSentence(step)}」`;
  echoRecorder.discard();          // 每一步重新錄，不會播到上一句
  _echoRateUnlocked = false;       // 新的一步：自評重新鎖回去，先念再評
  echoSetStatus(echoRecorder.supported ? '' : '這個瀏覽器不能錄音，念完直接自評即可。');
  updateEchoRecUI();
}

// 自評 → 走與其他模式相同的結果流程（handleResult），只是 score 來自學生／老師的判斷
function handleEchoSelfRate(rate) {
  const step = state.situation?.steps[state.stepIndex];
  if (!step) return;
  const sentence = echoModelSentence(step);
  if (rate === 'failed') {                    // 「再練一次」＝不記分，只重播示範讓學生再試
    speakAsUser(sentence);
    return;
  }
  handleResult(sentence, { score: rate, detected: [], selfRated: true });
}

// ─── 語音輸入不可用時的說明 ──────────────────────────
// 只把按鈕 disabled 會讓使用者完全不知道原因（手機看不到 title）。這裡依實際環境給具體說法，
// 最常見的是 iPhone「加到主畫面」的 App 版本：Safari 分頁有語音辨識，standalone 模式沒有。
function voiceEnvInfo() {
  const ua  = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
                  || navigator.standalone === true;
  const inApp = /Line\/|FBAN|FBAV|Instagram/i.test(ua);
  // 瀏覽器判斷順序有講究：Samsung Internet／Edge／Opera 的 UA 都含 "Chrome"，必須先比對它們
  const samsung = /SamsungBrowser/i.test(ua);
  const browser = samsung                    ? '三星瀏覽器'
                : /EdgA?\//.test(ua)         ? 'Edge'
                : /OPR\/|Opera/i.test(ua)    ? 'Opera'
                : /Firefox\/|FxiOS/i.test(ua)? 'Firefox'
                : /Chrome\//.test(ua)        ? 'Chrome'
                : /Safari\//.test(ua)        ? 'Safari'
                : '其他瀏覽器';
  return { ios, standalone, inApp, samsung, browser, android: /Android/.test(ua) };
}

function voiceUnsupportedReason() {
  const e = voiceEnvInfo();
  const where = `（偵測到：${e.ios ? 'iPhone／iPad' : e.android ? 'Android' : '電腦'}・${e.browser}${e.standalone ? '・已安裝為 App' : ''}${e.inApp ? '・App 內建瀏覽器' : ''}）`;
  const fallback = '這裡改用「🗣️ 跟讀」：一樣開口念，念完自己評分（紀錄會標明是自評）。';
  // 三星瀏覽器（Samsung Internet）基於 Chromium 但沒有實作語音辨識 API，換 Chrome 即可
  if (e.samsung)
    return `三星瀏覽器沒有語音辨識功能。要用「說話」請改用 Chrome 開啟本站，再從 Chrome 選單「加到主畫面」重新安裝。${fallback}${where}`;
  if (e.ios && e.standalone)
    return `「加到主畫面」的 App 版本沒有語音辨識，這是 iPhone 系統的限制。要用「說話」請改用 Safari 開啟本站。${fallback}${where}`;
  if (e.inApp)
    return `從 LINE／FB 內建瀏覽器開啟時沒有語音辨識。請用選單的「用瀏覽器開啟」。${fallback}${where}`;
  if (e.standalone)
    return `安裝成 App 的版本在這台裝置拿不到語音辨識。請改用瀏覽器開啟本站。${fallback}${where}`;
  return `此瀏覽器沒有語音辨識，建議改用 Chrome 或 Safari。${fallback}${where}`;
}

// ─── 輸入模式切換 ────────────────────────────────────

function setInputMode(mode) {
  const step = state.situation?.steps[state.stepIndex];
  const hasFrame = !!getStepFrame(step);

  // 詞庫排序按鈕：只有本步驟能切詞（有可切詞的句框）時才出現
  const wbBtn = document.querySelector('.mode-btn[data-mode="wordbank"]');
  if (wbBtn) wbBtn.hidden = !buildWordBank(getStepFrame(step));

  // AAC 模式強制使用選項，不允許切換
  if (document.body.classList.contains('aac-mode')) mode = 'options';
  // 不支援語音輸入的瀏覽器：改走「跟讀」（一樣要開口，只是改自評），不再直接退回選項
  if (mode === 'voice' && !recognizer.supported) mode = 'echo';
  // 本步驟沒有句框卻停在 frame/wordbank 模式 → 退回選項，確保向後相容
  if ((mode === 'frame' || mode === 'wordbank') && !hasFrame) mode = 'options';
  if (mode === 'wordbank' && !buildWordBank(getStepFrame(step))) mode = 'options';
  state.inputMode = mode;

  document.getElementById('options-grid').hidden   = (mode !== 'options');
  document.getElementById('frame-slot').hidden     = (mode !== 'frame');
  document.getElementById('word-bank').hidden      = (mode !== 'wordbank');
  document.getElementById('text-input-row').hidden = (mode !== 'text');
  document.getElementById('voice-row').hidden      = (mode !== 'voice');
  document.getElementById('echo-row').hidden       = (mode !== 'echo');
  // 離開跟讀模式一定要收掉錄音，否則麥克風會一直開著
  if (mode !== 'echo' && typeof echoRecorder !== 'undefined') echoRecorder.discard();

  // AAC 模式 / 鷹架模式時隱藏模式切換列（鷹架模式由系統主導輸入模式）
  const aacOn = document.body.classList.contains('aac-mode');
  document.querySelector('.mode-switcher').hidden = aacOn || state.scaffoldMode;
  const vNote = document.getElementById('voice-unsupported-note');
  vNote.hidden = recognizer.supported || aacOn;
  if (!vNote.hidden) vNote.textContent = voiceUnsupportedReason();

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (mode === 'options')  renderOptions();
  if (mode === 'frame')    renderFrameSlot();
  if (mode === 'wordbank') renderWordBank();
  if (mode === 'echo')     renderEchoRow();
  if (mode === 'text') {
    document.getElementById('text-input').value = '';
    document.getElementById('text-input').focus();
  }
}


// ─── 看圖造句（句框填空）模式 ─────────────────────────
// 受控產出：學生只能從圖卡選一個填進固定句框，判定為精確比對（零 AI、零誤判）。
// 難度綁定提示量：最易階(L6)顯示 2 張卡、次階(L5)顯示 4 張卡＋emoji。

// 取得步驟的句框：手工 frame 優先；否則由既有 options 自動衍生「整句填空」frame，
// 讓所有步驟（含未手寫 frame 的）都能用看圖造句模式，且零額外資料維護成本。
function getStepFrame(step) {
  if (step?.frame) return step.frame;
  // 跨情境句框庫：frame_ref 指向共用 template，slots 由步驟提供（P4）
  if (step?.frame_ref) {
    const lib = (window.FRAME_LIBRARY || {})[step.frame_ref];
    if (lib && step.slots) {
      // 句框成長（P10）：精熟到最獨立(L1)且備有 grow_slots → 改用更長句框挑戰
      if (lib.grows_to && step.grow_slots && state.frameLadder && state.promptLevel <= 1) {
        const grown = (window.FRAME_LIBRARY || {})[lib.grows_to];
        if (grown) return { template: grown.template, slots: { ...step.slots, ...step.grow_slots }, _grown: true };
      }
      return { template: lib.template, slots: step.slots, grows_to: lib.grows_to };
    }
  }
  if (!step?.options || step.options.length < 2) return null;
  const answer  = step.options[0];   // renderOptions 以 options[0] 為正解
  const choices = step.options.map(o => ({ text: o, emoji: guessEmoji(o) }));
  return { template: '{say}', slots: { say: { answer, choices } }, _auto: true };
}

// 依語句關鍵字猜一個 emoji 當圖卡視覺提示（純輔助，不需精準）
// 規則由「具體品項」到「通用語句」排列（先比對到的優先）。
const EMOJI_RULES = [
  // 具體食物 / 飲料
  [/蛋餅/, '🥞'], [/三明治|吐司|土司/, '🥪'], [/漢堡/, '🍔'], [/薯條/, '🍟'],
  [/雞塊|炸雞/, '🍗'], [/便當|餐點|套餐/, '🍱'], [/飯糰|御飯糰/, '🍙'],
  [/珍珠|珍奶|奶茶/, '🧋'], [/咖啡/, '☕'], [/紅茶|綠茶|茶/, '🍵'],
  [/果汁/, '🧃'], [/豆漿/, '🥛'], [/可樂|汽水/, '🥤'], [/牛奶/, '🥛'],
  [/餅乾/, '🍪'], [/麵包/, '🍞'], [/糖果/, '🍬'], [/冰淇淋|霜淇淋/, '🍦'],
  // 生鮮
  [/雞蛋|蛋$/, '🥚'], [/水果|蘋果/, '🍎'], [/香蕉/, '🍌'], [/蔬菜|青菜|菜$/, '🥬'], [/米$|白米/, '🍚'],
  // 文具
  [/鉛筆/, '✏️'], [/原子筆|筆$/, '🖊️'], [/橡皮擦/, '🧽'], [/尺$|直尺/, '📏'],
  [/膠水/, '🧴'], [/筆記本|本子|簿/, '📓'], [/剪刀/, '✂️'],
  // 服飾
  [/上衣|衣服|T恤/, '👕'], [/褲子|長褲|短褲/, '👖'], [/裙子|洋裝/, '👗'],
  [/鞋|球鞋/, '👟'], [/帽子/, '🧢'], [/外套|大衣/, '🧥'], [/尺寸|大小|號$/, '📏'],
  // 藥局
  [/感冒|頭痛|止痛|退燒|藥/, '💊'], [/OK繃|繃帶|貼布/, '🩹'], [/口罩/, '😷'], [/副作用/, '⚠️'],
  // 其他商品 / 服務
  [/報紙|雜誌/, '📰'], [/雨傘|傘$/, '☂️'], [/電池/, '🔋'], [/袋子|塑膠袋|提袋/, '🛍️'],
  [/收據|發票/, '🧾'], [/餐巾紙|衛生紙|紙巾/, '🧻'], [/折扣|特價|優惠|打折/, '🏷️'],
  [/退貨|換貨|退換/, '🔄'], [/票$|車票|門票/, '🎫'],
  // 付款
  [/現金|付現/, '💵'], [/刷卡|信用卡/, '💳'], [/悠遊卡|電子票/, '🎫'],
  // 社交 / 通用語句
  [/你好|您好|哈囉|嗨|早安|午安|晚安/, '👋'],
  [/再見|掰|拜拜/, '🙋'],
  [/謝謝|感謝|不好意思|抱歉/, '🙏'],
  [/多少錢|價格|幾塊|幾元|怎麼賣/, '💰'],
  [/哪裡|在哪|怎麼走|怎麼去/, '📍'],
  [/廁所|洗手間/, '🚻'],
  [/錢不夠|不夠|沒帶錢/, '😟'],
  [/我要買|要買|買這|購買/, '🛒'],
  [/飲料/, '🥤'],
  [/位子|訂位|預約|掛號/, '📅'],
  [/名字|我叫/, '🙋'],
];
function guessEmoji(text) {
  for (const [re, emo] of EMOJI_RULES) if (re.test(text)) return emo;
  return '💬';
}

// 無錯學習：高亮並朗讀正解卡（最易階答錯時用，把錯誤轉成示範）
function errorlessReveal(choicesEl, answers) {
  const correctBtn = [...choicesEl.querySelectorAll('.frame-card')]
    .find(b => answers.includes(b.dataset.choiceText));
  if (!correctBtn) return;
  correctBtn.classList.add('show-answer');
  stopAllAudio();
  speakAsUser(correctBtn.dataset.choiceText);
}

function renderFrameSlot() {
  const step  = state.situation.steps[state.stepIndex];
  const frame = getStepFrame(step);
  if (!frame) return;

  const slotKeys   = Object.keys(frame.slots);   // 支援單一或多個填空（依序填）
  const sentenceEl = document.getElementById('frame-sentence');
  const choicesEl  = document.getElementById('frame-choices');
  const filled     = {};                          // slotKey → 已選文字

  // 卡片數量與視覺提示量由 promptLevel 決定（階梯停用時退回難度判斷）
  const lvl = state.frameLadder ? state.promptLevel
            : (state.difficulty === 'easy' ? LADDER.PICK2 : LADDER.PICK4);
  const showVisual = lvl >= LADDER.PICK4;   // 詞庫階(L4)以下純文字，減少視覺支持

  // 句框：依 filled / 當前待填，把每個 {slot} 渲染成填好或空格
  const renderSentence = (currentKey) => {
    let html = frame.template;
    for (const k of slotKeys) {
      const piece = filled[k] != null
        ? `<span class="frame-fill">${filled[k]}</span>`
        : `<span class="frame-blank${k === currentKey ? ' active' : ''}">＿＿</span>`;
      html = html.replace(`{${k}}`, () => piece);
    }
    sentenceEl.innerHTML = html;
  };

  const finish = (ok) => {
    let sentence = frame.template;
    for (const k of slotKeys) sentence = sentence.replace(`{${k}}`, () => filled[k] || '＿＿');
    choicesEl.querySelectorAll('.frame-card').forEach(b => { b.disabled = true; });
    handleResult(sentence, { score: ok ? 'perfect' : 'failed', detected: [] });
  };

  const renderChoicesFor = (slotKey) => {
    const slot    = frame.slots[slotKey];
    const answers = Array.isArray(slot.answer) ? slot.answer : [slot.answer];
    choicesEl.innerHTML = '';

    let choices = slot.choices.slice();
    if (lvl >= LADDER.PICK2) {   // L6：只給 2 張（1 正解 + 1 干擾）
      const correct = choices.find(c => answers.includes(c.text));
      const others  = shuffle(choices.filter(c => !answers.includes(c.text))).slice(0, 1);
      choices = shuffle([correct, ...others].filter(Boolean));
    } else {
      choices = shuffle(choices);
    }

    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'frame-card' + (showVisual ? '' : ' text-only');
      btn.setAttribute('aria-label', choice.text);
      btn.dataset.choiceText = choice.text;

      let visual = '';
      if (showVisual) {
        visual = choice.img
          ? `<img class="frame-card-img" src="${choice.img}" alt="">`
          : `<span class="frame-card-emoji" aria-hidden="true">${choice.emoji || '🔲'}</span>`;
      }
      btn.innerHTML = `${visual}<span class="frame-card-text">${choice.text}</span>`;

      btn.addEventListener('click', () => {
        const isCorrect = answers.includes(choice.text);
        filled[slotKey] = choice.text;
        renderSentence(null);

        if (!isCorrect) {
          choicesEl.querySelectorAll('.frame-card').forEach(b => { b.disabled = true; });
          btn.classList.add('wrong');
          // 無錯學習：最易階(L6・2 選 1)答錯 → 立即高亮並朗讀正解卡
          if (lvl >= LADDER.PICK2) errorlessReveal(choicesEl, answers);
          finish(false);
          return;
        }

        btn.classList.add('correct');
        const nextKey = slotKeys.find(k => filled[k] == null);
        if (nextKey) {                 // 多填空：填好一格 → 朗讀並進入下一格
          speakAsUser(choice.text);
          renderSentence(nextKey);
          renderChoicesFor(nextKey);
        } else {
          finish(true);
        }
      });

      choicesEl.appendChild(btn);
    });
  };

  renderSentence(slotKeys[0]);
  renderChoicesFor(slotKeys[0]);
}


// ─── 詞庫組句模式（L2）─────────────────────────────────
// 由句框 template 自動切詞：學生點詞卡依序排出句子，判定為「詞序完全相符」。
// 整句填空（template '{say}'）無法切詞，回傳 null（該 promptLevel 退回看圖造句）。

function buildWordBank(frame) {
  if (!frame || frame.template === '{say}') return null;
  const slotKeys = Object.keys(frame.slots);
  const answerOf = k => { const a = frame.slots[k].answer; return Array.isArray(a) ? a[0] : a; };
  // 把 template 每個 {slot} token 換成該格答案（支援單一或多個填空）
  const sequence = frame.template.trim().split(/\s+/)
    .map(t => {
      const k = slotKeys.find(key => t.includes(`{${key}}`));
      return k ? t.replace(`{${k}}`, answerOf(k)) : t;
    })
    .filter(Boolean);
  if (sequence.length < 2) return null;
  const answers = slotKeys.map(answerOf);
  const distractors = slotKeys
    .flatMap(k => (frame.slots[k].choices || []).map(c => c.text))
    .filter(t => !answers.includes(t)).slice(0, 2);
  return { sequence, distractors };
}

function renderWordBank() {
  const step  = state.situation.steps[state.stepIndex];
  const frame = getStepFrame(step);
  const wb    = buildWordBank(frame);
  if (!wb) { setInputMode('frame'); return; }   // 無法切詞 → 退回看圖造句

  const buildEl = document.getElementById('wb-build');
  const poolEl  = document.getElementById('wb-pool');
  const built   = [];                            // 已排出的詞（依序）
  buildEl.innerHTML = '';
  poolEl.innerHTML  = '';

  const pool = shuffle([...wb.sequence, ...wb.distractors]);

  // 排滿最後一張卡時：先唸「最後一個詞」（如「多少錢」）→ 再完整唸整句 → 才出判斷彈窗。
  // 回傳 true 表示已排滿並接手發音（呼叫端就不要再單獨唸該詞，避免被 stopAllAudio 蓋掉）。
  const check = (lastWord) => {
    if (built.length !== wb.sequence.length) return false;
    const ok = built.every((w, i) => w === wb.sequence[i]);
    buildEl.querySelectorAll('.wb-tile').forEach(t => { t.disabled = true; });
    poolEl.querySelectorAll('.wb-tile').forEach(t => { t.disabled = true; });
    buildEl.classList.add(ok ? 'correct' : 'wrong');
    const sentence = built.join('');
    speakAsUser(lastWord, () =>
      speakAsUser(sentence, () =>
        handleResult(sentence, { score: ok ? 'perfect' : 'failed', detected: [] })));
    return true;
  };

  const renderPool = () => {
    poolEl.innerHTML = '';
    pool.forEach((word, idx) => {
      if (pool[idx] === null) return;            // 已被取用
      const t = document.createElement('button');
      t.className = 'wb-tile';
      t.textContent = word;
      t.addEventListener('click', () => {
        built.push(word);
        pool[idx] = null;
        renderBuild(); renderPool();
        // 排滿最後一張 → check 串接唸該詞+整句+判斷；否則只唸該詞
        if (!check(word)) speakAsUser(word);
      });
      poolEl.appendChild(t);
    });
  };
  const renderBuild = () => {
    buildEl.innerHTML = '';
    if (built.length === 0) {
      const ph = document.createElement('span');
      ph.className = 'wb-placeholder';
      ph.textContent = '點下面的詞，排出句子';
      buildEl.appendChild(ph);
      return;
    }
    built.forEach((word, i) => {
      const t = document.createElement('button');
      t.className = 'wb-tile in-build';
      t.textContent = word;
      t.addEventListener('click', () => {           // 點已排出的詞 → 收回詞庫
        built.splice(i, 1);
        const slotIdx = pool.indexOf(null);
        if (slotIdx >= 0) pool[slotIdx] = word; else pool.push(word);
        renderBuild(); renderPool();
      });
      buildEl.appendChild(t);
    });
  };

  buildEl.classList.remove('correct', 'wrong');
  renderBuild();
  renderPool();
}


// ─── 選項模式 ────────────────────────────────────────

function renderOptions() {
  const step = state.situation.steps[state.stepIndex];
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';

  const shuffled = shuffle(step.options);

  shuffled.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.setAttribute('aria-label', opt);

    // 選項文字
    const textSpan = document.createElement('span');
    textSpan.className = 'option-text';
    textSpan.textContent = opt;

    // 喇叭按鈕（不觸發答題）
    const speakSpan = document.createElement('span');
    speakSpan.className = 'btn-speak-option';
    speakSpan.setAttribute('role', 'button');
    speakSpan.setAttribute('aria-label', `播放「${opt}」`);
    speakSpan.setAttribute('tabindex', '0');
    speakSpan.textContent = '🔊';
    speakSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      speakAsUser(opt);
    });
    speakSpan.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); speakAsUser(opt); }
    });

    btn.addEventListener('click', (e) => {
      if (e.target.closest('.btn-speak-option')) return;
      grid.querySelectorAll('.option-btn').forEach(b => { b.disabled = true; });
      // 選項模式用精確比對（options[0] 為正解、accepted_phrases 為可接受說法）。
      // 不能用關鍵字評分：通用關鍵字（要、給、謝謝…）會把「選錯商品」誤判為正確。
      const norm = s => s.replace(/[！？。，、!?.,\s]/g, '');
      const isCorrect = opt === step.options[0]
        || (step.accepted_phrases || []).some(p => norm(p) === norm(opt));
      const result = { score: isCorrect ? 'perfect' : 'failed', detected: [] };
      btn.classList.add(result.score === 'perfect' ? 'correct' : 'wrong');
      // 先播放所選選項的語音，唸完再出判斷彈窗（彈窗內會再播正確/錯誤的語音提示）
      speakAsUser(opt, () => handleResult(opt, result));
    });

    // 🔊 放在文字左邊
    btn.appendChild(speakSpan);
    btn.appendChild(textSpan);
    grid.appendChild(btn);
  });
}


// ─── 處理輸入（統一入口）────────────────────────────

// 依難度調整評分（含音節數回退）
function applyDifficultyRules(result, text, step) {
  // 初級＝音節寬鬆：完全沒對到關鍵字，但字數/長度接近 → 給「部分對」（鼓勵開口）
  if (state.difficulty === 'easy' && result.score === 'failed') {
    if (syllableRatio(text, step.accepted_phrases?.[0] || '') >= 0.55 && countChinese(text) >= 1) {
      result = { score: 'partial', detected: [], syllableFallback: true };
    }
  }
  // 初級：有對到關鍵字的結果升級為全對；音節寬鬆給的部分對不升
  //（否則「沒有」對「你好」只因長度相近就被當全對）
  if (state.difficulty === 'easy' && result.score !== 'failed' && !result.syllableFallback)
    return { ...result, score: 'perfect' };
  // 中級＝純關鍵字：沒對到關鍵字即答錯，不做音節寬鬆（此處不加料，直接回傳引擎結果）
  return result;
}

function evaluateInput(text, step) {
  // 高級＝完整語句：需說出「完整標準答案」才算對（精確比對，不看關鍵字、不寬鬆）
  if (state.difficulty === 'hard') {
    // 去標點後再削句尾語助詞（嗎/喔/吧…），兩邊對稱——避免學生輸入被 normalizePronunciation
    // 削掉尾綴「嗎」、標準答案卻因「嗎？」保留而誤判不符（例：請問有2B鉛筆嗎）
    const norm = s => (s || '').replace(/[！？。，、!?.,\s「」]/g, '').replace(/[啊呢吧喔唷囉嗎耶欸呀哦哩]+$/, '');
    const t = norm(text);
    // 可接受答案＝accepted_phrases ＋ options[0] ＋ 回饋 failed 的示範句（「」內）。
    // 納入示範句＝「app 叫學生怎麼說，就一定接受那個說法」，避免示範句漏列 accepted_phrases 而誤判。
    const demo = (step.feedback?.failed || '').match(/「([^」]+)」/)?.[1];
    const accepts = [...(step.accepted_phrases || []), step.options?.[0], demo].filter(Boolean);
    const ok = !!t && accepts.some(p => norm(p) === t);
    return { score: ok ? 'perfect' : 'failed', detected: [] };
  }
  // 初級（音節寬鬆）/ 中級（關鍵字）：關鍵字比對 + 難度規則
  // 套用教師在設定頁修改的「內建關鍵字覆寫」（高級不看關鍵字，故上面已先 return）
  const kwStep = withEffectiveKeywords(step);
  const raw = engine.evaluate(text, kwStep);
  // 規則引擎是同步的，直接回傳
  if (!(raw instanceof Promise)) return applyDifficultyRules(raw, text, kwStep);
  // LLM 引擎是非同步的，回傳 Promise
  return raw.then(r => applyDifficultyRules(r, text, kwStep));
}

async function handleInput(rawText) {
  if (window._debugShowSTT) window._debugShowSTT(rawText);
  const step       = state.situation.steps[state.stepIndex];
  const normalized = normalizePronunciation(rawText);
  const result = evaluateInput(normalized, step);
  if (result instanceof Promise) {
    result.then(r => handleResult(rawText, r));
  } else {
    handleResult(rawText, result);
  }
}

// 回饋訊息中「」內的示範句獨立突出顯示（識字量低的學生先看到重點）
function renderFeedbackMsg(el, msg) {
  el.innerHTML = '';
  const m = msg.match(/「([^」]+)」/);
  if (!m) { el.textContent = msg; return; }
  el.appendChild(document.createTextNode(msg.slice(0, m.index)));
  const q = document.createElement('span');
  q.className = 'feedback-quote';
  q.textContent = `「${m[1]}」`;
  el.appendChild(q);
  el.appendChild(document.createTextNode(msg.slice(m.index + m[0].length)));
}

function handleResult(text, result) {
  const step = state.situation.steps[state.stepIndex];

  // 作答結果顯示：選擇/造句/詞庫（非語音、非打字）顯示「回答正確/錯誤」；語音/打字顯示「偵測到你說的」
  const isSelection = (state.inputMode !== 'voice' && state.inputMode !== 'text');
  const heardLabel = document.getElementById('feedback-heard-label');
  if (heardLabel) {
    // 跟讀是學生自己判斷念得好不好，沒有辨識結果可秀，講「回答正確」也不精確
    heardLabel.textContent = result.selfRated ? '你念的句子'
      : isSelection ? (result.score === 'perfect' ? '回答正確' : '回答錯誤')
      : '偵測到你說的';
  }
  document.getElementById('heard-text').textContent =
    text || (isSelection ? '' : '（沒有偵測到語音）');

  const resultEl = document.getElementById('feedback-result');
  const msgEl    = document.getElementById('feedback-msg');
  const noVoice  = !String(text || '').trim();

  if (result.score === 'perfect') {
    resultEl.className   = 'feedback-result perfect';
    resultEl.innerHTML   = '<span class="result-icon">✅</span><span class="result-text">說得很好！</span>';
    renderFeedbackMsg(msgEl, step.feedback.perfect);
    sfx.correct();
    playFeedbackAudio(step.feedback.perfect, 'perfect');

  } else if (result.score === 'partial') {
    resultEl.className   = 'feedback-result partial';
    resultEl.innerHTML   = '<span class="result-icon">💪</span><span class="result-text">再試一次！</span>';
    const partialMsg = result.syllableFallback
      ? `偵測到你有說話！請試著說清楚：「${step.accepted_phrases[0]}」`
      : step.feedback.partial;
    renderFeedbackMsg(msgEl, partialMsg);
    sfx.partial();
    playFeedbackAudio(partialMsg, 'partial');
    state.failCount++;
    if (state.failCount >= 3 && state.difficulty !== 'hard') showHint();  // 高級不自動提示，只能按「💡 提示」

  } else if (noVoice) {
    // 完全沒收到語音：和「說錯」分開呈現，避免學生以為自己說的話被當成錯誤
    resultEl.className   = 'feedback-result failed';
    resultEl.innerHTML   = '<span class="result-icon">🔇</span><span class="result-text">沒有聽到聲音</span>';
    const silentMsg = '再靠近一點，大聲說一次！';
    renderFeedbackMsg(msgEl, silentMsg);
    sfx.partial();
    stopAllAudio();
    tts.speak(silentMsg);
    state.failCount++;
    if (state.failCount >= 3 && state.difficulty !== 'hard') showHint();  // 高級不自動提示，只能按「💡 提示」

  } else {
    resultEl.className   = 'feedback-result failed';
    resultEl.innerHTML   = '<span class="result-icon">❌</span><span class="result-text">說的和任務不一樣喔</span>';
    renderFeedbackMsg(msgEl, step.feedback.failed);
    sfx.failed();
    playFeedbackAudio(step.feedback.failed, 'failed');
    state.failCount++;
    if (state.failCount >= 3 && state.difficulty !== 'hard') showHint();  // 高級不自動提示，只能按「💡 提示」
  }

  // 每一步只保留最後一次結果：重試成功就以成功計，完成頁摘要與報告依步驟對位
  state.stepAttempts++;
  state.results[state.stepIndex] = {
    stepId: step.id,
    score: result.score,
    attempts: state.stepAttempts,
    hintUsed: state.stepHintUsed,
    promptLevel: state.frameLadder ? state.promptLevel : null,  // 作答當下的支持等級（IEP 用）
    mode: state.inputMode,                                       // 作答當下的反應模式（語音/選項/打字/句框/詞庫/跟讀）
    selfRated: !!result.selfRated,                               // 跟讀＝學生自評，非系統評分（報表需分開看）
  };

  // 提示褪除（精熟標準）：連續答對 MASTERY 次才降一級；答錯立即升一級並重置連對。
  // 答錯升級後，學生按「再試一次」會自動得到更多鷹架（retryStep 會重繪）。
  if (state.frameLadder && (getStepFrame(step) || state.scaffoldMode)) {
    if (result.score === 'perfect') {
      state.consecutiveCorrect = (state.consecutiveCorrect || 0) + 1;
      if (state.consecutiveCorrect >= getMasteryCriterion()) {
        state.promptLevel = Math.max(LADDER_MIN, state.promptLevel - 1);
        state.consecutiveCorrect = 0;
      }
    } else {
      state.consecutiveCorrect = 0;
      state.promptLevel = Math.min(LADDER_MAX, state.promptLevel + 1);
    }
    savePromptLevel(state.scenario.id, state.promptLevel);
  }

  showFeedback();

  // 完全正確才顯示「下一步」；否則也顯示讓學生選擇跳過
  const isLast = (state.stepIndex + 1 >= state.situation.steps.length);
  document.getElementById('btn-next').textContent = isLast ? '完成 ✓' : '下一步 →';
  document.getElementById('btn-retry').hidden = (result.score === 'perfect');
  showActionRow();
}


// ─── 提示系統（漸進式）──────────────────────────────

// 顯示提示：統一用「內嵌提示框」(對話框下方，如初級)，不再用彈窗，版面更簡潔。
// 由「💡 提示」按鈕手動觸發(任何難度都可)，或由中級錯 3 次自動觸發(見 handleResult)。
function showHint() {
  const step = state.situation.steps[state.stepIndex];
  state.stepHintUsed = true;
  document.getElementById('easy-hint-text').textContent = `「${step.accepted_phrases[0]}」`;
  document.getElementById('easy-hint-box').hidden = false;
  // 點提示時直接朗讀完整提示（含「你可以這樣說」引導語，與畫面標籤一致）
  speakHint(`你可以這樣說，${step.accepted_phrases[0]}`);
}

function hideHint() {
  document.getElementById('hint-modal').hidden = true;
}


// ─── 回饋 / 按鈕 顯示控制 ───────────────────────────

function showFeedback()  { document.getElementById('feedback-modal').hidden = false; }
function hideFeedback()  { document.getElementById('feedback-modal').hidden = true; }
function showActionRow() { document.getElementById('action-row').hidden = false; }
function hideActionRow() { document.getElementById('action-row').hidden = true; }


// ─── 下一步 / 重試 ──────────────────────────────────

function nextStep() {
  // 先關回饋彈窗與按鈕列（最後一步走 showComplete，不經過 renderStep 的清理，
  // 否則彈窗會蓋在完成頁上面關不掉）
  hideFeedback();
  hideActionRow();
  hideHint();
  if (state.stepIndex + 1 >= state.situation.steps.length) {
    showComplete();
    return;
  }
  state.stepIndex++;
  renderStep();
}

function retryStep() {
  hideFeedback();
  hideActionRow();
  hideHint();
  // 維持原模式，重繪當前輸入區
  if (state.inputMode === 'options')  renderOptions();
  if (state.inputMode === 'wordbank') renderWordBank();
  if (state.inputMode === 'frame')    renderFrameSlot();
  if (state.inputMode === 'text') {
    document.getElementById('text-input').value = '';
    document.getElementById('text-input').focus();
  }
}


// ─── 完成頁 ──────────────────────────────────────────

function showComplete() {
  // 以「步驟數」為分母、每步的最終結果計分：重試成功不扣分
  const total   = state.situation.steps.length;
  const perfect = state.results.filter(r => r?.score === 'perfect').length;
  const ratio   = total > 0 ? perfect / total : 0;

  const starCount = ratio >= 0.84 ? 3 : ratio >= 0.5 ? 2 : 1;
  const msg       = ratio >= 0.84
    ? '表現得很棒！繼續加油！'
    : ratio >= 0.5
    ? '不錯喔！再多練習幾次會更好！'
    : '沒關係，多練習幾次就會進步！';

  // 星星逐一彈出
  const starsEl = document.getElementById('complete-stars');
  starsEl.innerHTML = Array.from({ length: starCount }, (_, i) =>
    `<span class="star" aria-hidden="true">⭐</span>`
  ).join('') + `<span class="sr-only">${starCount} 顆星</span>`;

  document.getElementById('complete-msg').textContent = msg;

  document.getElementById('complete-title').textContent = '練習完成！';

  // 三顆星撒花
  if (starCount === 3) setTimeout(launchConfetti, 600);

  // 步驟摘要（含重試與提示標記，供教師參考）
  const summaryEl = document.getElementById('complete-summary');
  summaryEl.innerHTML = '';
  state.situation.steps.forEach((step, i) => {
    const r    = state.results[i];
    const icon = !r
      ? '⬜'
      : r.score === 'perfect' ? '✅' : r.score === 'partial' ? '💪' : '❌';
    const extra = [
      r?.attempts > 1 ? `試了 ${r.attempts} 次` : '',
      r?.hintUsed ? '💡' : '',
    ].filter(Boolean).join(' ');
    const row = document.createElement('div');
    row.className = 'summary-row';
    row.innerHTML = `<span class="summary-icon">${icon}</span><span style="flex:1">${step.task}</span>`
      + (extra ? `<span class="summary-extra">${extra}</span>` : '');
    summaryEl.appendChild(row);
  });

  // 鷹架達成：本次答對時用到的「最少提示等級」（數字越小＝越獨立）
  const LADDER_LABEL = { 6: '看圖 2 選 1（L6）', 5: '看圖 4 選 1（L5）', 4: '詞庫組句（L4）', 3: '看句選擇（L3）', 2: '照著念（L2）', 1: '自己說（L1）' };
  const lvlsUsed = state.results
    .filter(r => r?.score === 'perfect' && r?.promptLevel)
    .map(r => r.promptLevel);
  const minPromptLevel = lvlsUsed.length ? Math.min(...lvlsUsed) : null;
  if (SCAFFOLD_ENABLED && minPromptLevel) {   // 鷹架隱藏時不顯示「最少提示」徽章
    const row = document.createElement('div');
    row.className = 'summary-row ladder-achieve';
    row.innerHTML = `<span class="summary-icon">🪜</span>`
      + `<span style="flex:1">這次你最少靠提示就做到：<b>${LADDER_LABEL[minPromptLevel]}</b></span>`;
    summaryEl.prepend(row);
  }

  sfx.complete();
  showScreen('screen-complete');
  setTimeout(() => tts.speak(msg), 800);

  // 推薦相關遊戲單元
  renderRecommendCards(state.scenario.id);

  // 待發獎勵（pendingRewards → reward/ 計分板）：2026-07-23 改教師設定制，預設關閉。
  // 教師在 teacher.html「🎁 完成獎勵設定」開總開關＋設「對話練習」點數才會寫入
  // （固定點數制，與 24 單元一致；設定鍵 mt_unit_rewards_cfg，讀法同 learning-tracker.js）。
  // 未設定＝完全不動作；獎勵經濟平常統一走金隊長成長系統。
  const curStudent = getCurrentStudent();
  const partial = state.results.filter(r => r?.score === 'partial').length;
  let rewardPoints = 0;
  try {
    const rewardCfg = JSON.parse(localStorage.getItem('mt_unit_rewards_cfg') || 'null');
    if (rewardCfg?.enabled) rewardPoints = Math.max(0, parseInt(rewardCfg.units?.dialogue, 10) || 0);
  } catch (_) {}
  if (rewardPoints > 0) {
    try {
      const pending = JSON.parse(localStorage.getItem('pendingRewards') || '[]');
      const who = curStudent ? `（${curStudent.name}）` : '';
      pending.push({ points: rewardPoints, studentId: curStudent?.id ?? null, source: `購物練習：${state.scenario.name}・${state.situation.name}${who}` });
      localStorage.setItem('pendingRewards', JSON.stringify(pending));
    } catch (_) {}
  }
  // 完成頁點數顯示（未啟用時清空不顯示）
  const rewardEl = document.getElementById('complete-reward');
  if (rewardEl) rewardEl.textContent = rewardPoints > 0 ? `🎁 獲得 ${rewardPoints} 點獎勵！` : '';

  // 儲存學習紀錄
  const endTs = Date.now();
  // 本場主要反應模式＝各步驟出現最多者（每步可切換）
  const modeCount = {};
  state.results.forEach(r => { if (r?.mode) modeCount[r.mode] = (modeCount[r.mode] || 0) + 1; });
  const sessionMode = Object.entries(modeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || state.inputMode || null;
  dbSave({
    studentId:    curStudent?.id ?? null,
    studentName:  curStudent?.name || '',
    scenarioId:   state.scenario.id,
    scenarioName: state.scenario.name,
    situationId:  state.situation.id,
    situationName: state.situation.name,
    difficulty:   state.difficulty,
    mode:         sessionMode,       // 反應模式（語音/選項/打字/句框/詞庫）
    score:        perfect,
    total,
    stars:        starCount,
    minPromptLevel,                 // 本次最少提示等級（IEP 鷹架褪除追蹤；null=未用句框階梯）
    steps:        state.results.map((r, i) => ({
      stepId:   state.situation.steps[i]?.id,
      task:     state.situation.steps[i]?.task,
      score:    r?.score,
      attempts: r?.attempts || 1,
      hintUsed: !!r?.hintUsed,
      promptLevel: r?.promptLevel ?? null,
      mode: r?.mode ?? null,
      selfRated: !!r?.selfRated,      // 跟讀自評（非系統評分）
    })),
    durationSec: Math.round((endTs - (state.startTs || endTs)) / 1000),
  }).catch(() => {});
}


// ─── 語音輸入控制 ────────────────────────────────────

// 回音過濾：辨識結果若幾乎就是店員台詞（喇叭聲被收音），視為沒有聽到學生說話。
// 門檻保守：至少 5 個字且覆蓋台詞 60% 以上，才視為回音（避免誤殺「你好」這類正確短答）。
function isPromptEcho(text) {
  const step = state.situation?.steps[state.stepIndex];
  if (!step) return false;
  const strip = s => normalizePronunciation(s).replace(/[！？。，、…（）!?.,()\s「」]/g, '');
  const a = strip(text);
  const b = strip(step.shopkeeper_prompt);
  if (a.length < 5 || !b) return false;
  return a.includes(b) || (b.includes(a) && a.length / b.length >= 0.6);
}

function startListening() {
  if (state.isListening) return;
  state.isListening = true;

  // 停掉還在播的店員語音，避免喇叭聲被麥克風收進去
  stopAllAudio();

  const btn = document.getElementById('btn-mic');
  btn.classList.add('listening');
  btn.querySelector('.mic-label').textContent = '聆聽中…';

  recognizer.start(
    (text) => {
      stopListeningUI();
      handleInput(isPromptEcho(text) ? '' : text);
    },
    (err) => {
      stopListeningUI();
      if (err === 'not-supported') {
        document.getElementById('hint-text').textContent =
          '這個瀏覽器沒有語音輸入功能，建議用 Edge 或 Chrome 開啟。也可以改用下方的「🔘 選擇對話」或「⌨️ 打字」。';
        document.getElementById('hint-modal').hidden = false;
      } else if (err !== 'no-speech' && err !== 'aborted') {
        handleInput('');
      }
    },
    () => { stopListeningUI(); }
  );
}

function stopListeningUI() {
  state.isListening = false;
  const btn = document.getElementById('btn-mic');
  btn.classList.remove('listening');
  btn.querySelector('.mic-label').textContent = '點我說話';
}


// ─── 設定頁：自訂情境列表 ────────────────────────────

function renderSettings() {
  renderUserVoiceSelector();
  const list   = document.getElementById('custom-scenario-list');
  const empty  = document.getElementById('custom-empty');
  const customs = loadCustom();
  list.innerHTML = '';

  if (customs.length === 0) {
    list.hidden  = true;
    empty.hidden = false;
    return;
  }
  list.hidden  = false;
  empty.hidden = true;

  customs.forEach((sc, idx) => {
    const theme = sc.theme || THEME_PRESETS[3];
    const card  = document.createElement('div');
    card.className = 'custom-card';
    card.innerHTML = `
      <div class="custom-card-icon" style="background:${theme.bg}; color:${theme.color}">
        ${sc.icon || '💬'}
      </div>
      <div class="custom-card-info">
        <div class="custom-card-name">${sc.name || '未命名情境'}</div>
        <div class="custom-card-steps">${sc.steps.length} 個步驟</div>
      </div>
      <div class="custom-card-actions">
        <button class="btn-card-action" data-action="edit">✏️ 編輯</button>
        <button class="btn-card-action danger" data-action="delete" aria-label="刪除">🗑️</button>
      </div>
    `;
    card.querySelector('[data-action="edit"]').addEventListener('click', () => openScenarioEditor(idx));
    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm(`確定要刪除「${sc.name}」嗎？此動作無法復原。`)) {
        const arr = loadCustom();
        arr.splice(idx, 1);
        saveCustom(arr);
        // 一併清除此情境的所有老師錄音
        if (typeof dbAudioDeletePrefix === 'function') dbAudioDeletePrefix(`${sc.id}::`).catch(() => {});
        renderSettings();
      }
    });
    list.appendChild(card);
  });
}


// ─── 情境編輯器 ─────────────────────────────────────

let editingScenarioIdx = -1;
let editingScenarioId  = null;   // 進編輯器即固定（新情境預產），錄音 key 依賴它
let editingSteps       = [];
let selectedTheme      = THEME_PRESETS[0];

// ─── AI 輔助情境生成（免 API Key，2026-07-23 改版）──────────────────
// 舊流程要使用者自備 Gemini API Key 直接打 API，門檻高；改為三段式：
// ①引導問答（主題/對象/重點/步驟數）組出提示詞 → ②使用者複製、貼到 Gemini/ChatGPT
// 網頁版送出 → ③把 AI 的回答整段貼回來，importAiSteps 防呆解析＋正規化後匯入。
// settings 的 gemini_api_key 只剩「LLM 語意評分」在用，與此流程無關。

function buildAiPrompt() {
  const topic   = document.getElementById('ai-gen-topic').value.trim();
  const partner = document.getElementById('ai-gen-partner').value.trim();
  const focus   = document.getElementById('ai-gen-focus').value.trim();
  const count   = document.getElementById('ai-gen-count').value || '5';
  return `你是特殊教育「生活對話練習」的課程設計師。請為以下情境設計 ${count} 個對話步驟，讓國中特教學生練習開口表達。

情境主題：${topic}
${partner ? `對話對象：${partner}\n` : ''}${focus ? `練習重點：${focus}\n` : ''}
每個步驟包含（全部繁體中文、台灣日常口語、句子簡短）：
- id: 英文小寫底線識別碼（如 greeting、ask_price）
- shopkeeper_prompt: 對方說的一句話（自然口語）
- task: 學生的任務說明（簡短祈使句，如「跟老闆打招呼」）
- accepted_phrases: 3-5 個學生可被接受的答句，第 1 個是最標準的答案
- options: 恰好 4 個選項。第 1 個必須與 accepted_phrases 的第 1 個完全相同；後 3 個是明顯不合適的干擾選項，且不可以是 accepted_phrases 裡的任何一句
- keywords: 3-6 個判斷答對的關鍵詞（要用能區分這一步的詞，如「多少錢」「菠蘿麵包」；不要用「好」「要」「謝謝」這種每步都會出現的萬用詞）
- feedback: { "perfect": "稱讚語", "partial": "部分正確時的鼓勵", "failed": "可以這樣說：「第1個標準答案」" }

只回傳 JSON 陣列（以 [ 開頭、以 ] 結尾），不要 markdown 圍欄、不要任何說明文字：
[{"id":"greeting","shopkeeper_prompt":"...","task":"...","accepted_phrases":["..."],"options":["...","...","...","..."],"keywords":["..."],"feedback":{"perfect":"...","partial":"...","failed":"..."}}]`;
}

async function copyAiPrompt() {
  const status = document.getElementById('ai-gen-status');
  const topic  = document.getElementById('ai-gen-topic').value.trim();
  if (!topic) {
    status.textContent = '請先填「① 要練習的情境」再複製';
    document.getElementById('ai-gen-topic').focus();
    return;
  }
  const prompt = buildAiPrompt();
  let copied = false;
  try { await navigator.clipboard.writeText(prompt); copied = true; }
  catch {
    // http／舊瀏覽器後備：暫置 textarea + execCommand
    const ta = document.createElement('textarea');
    ta.value = prompt;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { copied = document.execCommand('copy'); } catch {}
    ta.remove();
  }
  status.textContent = copied
    ? '✅ 提示詞已複製！開 Gemini 或 ChatGPT 貼上送出，再把回答貼到下面第 ⑤ 格'
    : '❌ 複製失敗，請長按選取下方文字自行複製';
  // 複製失敗時把提示詞放進貼上框讓使用者手動複製（成功時保持乾淨）
  if (!copied) document.getElementById('ai-gen-paste').value = prompt;
}

// 從 AI 回答文字裡萃取 JSON 陣列：容忍 markdown 圍欄、前後說明文字
function extractJsonArray(text) {
  const t = String(text || '').replace(/```[a-z]*/gi, '').trim();
  const s = t.indexOf('[');
  const e = t.lastIndexOf(']');
  if (s === -1 || e <= s) return null;
  try {
    const arr = JSON.parse(t.slice(s, e + 1));
    return Array.isArray(arr) ? arr : null;
  } catch { return null; }
}

// 單步正規化：補齊預設值並套用資料慣例（options[0]=正解∈accepted、干擾項不得∈accepted）
function normalizeAiStep(raw, i) {
  if (!raw || typeof raw !== 'object') return null;
  const prompt   = String(raw.shopkeeper_prompt || raw.say || '').trim();
  const task     = String(raw.task || '').trim();
  const accepted = (Array.isArray(raw.accepted_phrases) ? raw.accepted_phrases : [])
    .map(s => String(s).trim()).filter(Boolean);
  const options  = (Array.isArray(raw.options) ? raw.options : [])
    .map(s => String(s).trim()).filter(Boolean);
  const answer   = accepted[0] || options[0] || '';
  if (!prompt || !task || !answer) return null;
  if (!accepted.includes(answer)) accepted.unshift(answer);

  const FALLBACK_WRONG = ['我不知道', '沒關係', '好的謝謝'];
  const wrong = options.filter(o => o !== answer && !accepted.includes(o));
  for (const fb of FALLBACK_WRONG) {
    if (wrong.length >= 3) break;
    if (fb !== answer && !wrong.includes(fb) && !accepted.includes(fb)) wrong.push(fb);
  }

  let keywords = (Array.isArray(raw.keywords) ? raw.keywords : [])
    .map(s => String(s).trim()).filter(Boolean);
  if (!keywords.length) keywords = [answer.replace(/[！？。，、!?.,\s「」]/g, '')].filter(Boolean);

  let id = String(raw.id || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!id) id = 'step_' + (Date.now() + i);
  while (editingSteps.some(s => s.id === id)) id += '_2';   // 撞名防呆（錄音 key 依賴 id）

  return {
    id,
    shopkeeper_prompt: prompt,
    task,
    keywords,
    keywords_mode: 'any',
    accepted_phrases: accepted,
    llm_context_hint: '',
    options: [answer, ...wrong.slice(0, 3)],
    feedback: {
      perfect: String(raw.feedback?.perfect || '').trim() || '很好！說得很棒！',
      partial: String(raw.feedback?.partial || '').trim() || `說出了重點！試試說完整：「${answer}」`,
      failed:  String(raw.feedback?.failed  || '').trim() || `可以這樣說：「${answer}」`,
    },
  };
}

function importAiSteps() {
  const status = document.getElementById('ai-gen-status');
  const pasteEl = document.getElementById('ai-gen-paste');
  const raw = pasteEl.value.trim();
  if (!raw) { status.textContent = '請先把 AI 的回答貼到第 ⑤ 格'; pasteEl.focus(); return; }

  const arr = extractJsonArray(raw);
  if (!arr) {
    status.textContent = '❌ 看不懂貼上的內容——請確認複製到的是 AI 的「整段回答」（裡面要有 [ … ] 的 JSON）';
    return;
  }
  const steps = arr.map((r, i) => normalizeAiStep(r, i)).filter(Boolean);
  if (!steps.length) {
    status.textContent = '❌ 回答裡沒有可用的步驟（缺 shopkeeper_prompt／task／答案）——請回 AI 說「請照原格式重新輸出」再貼一次';
    return;
  }

  editingSteps.push(...steps);
  renderStepList();
  pasteEl.value = '';
  const skipped = arr.length - steps.length;
  status.textContent = `✅ 已匯入 ${steps.length} 個步驟${skipped ? `（略過 ${skipped} 個格式不完整的）` : ''}，請逐步確認後儲存`;

  // 情境名稱空白時自動帶入主題
  const nameEl = document.getElementById('edit-name');
  const topic  = document.getElementById('ai-gen-topic').value.trim();
  if (!nameEl.value && topic) nameEl.value = topic;
}


function openScenarioEditor(idx) {
  editingScenarioIdx = idx;
  const customs = loadCustom();
  const sc      = idx >= 0 ? customs[idx] : null;

  editingSteps      = sc ? JSON.parse(JSON.stringify(sc.steps)) : [];
  selectedTheme     = sc?.theme ?? THEME_PRESETS[0];
  editingScenarioId = sc?.id ?? ('custom_' + Date.now());

  document.getElementById('scenario-editor-title').textContent = sc ? '編輯情境' : '新增情境';
  document.getElementById('edit-name').value  = sc?.name  ?? '';
  document.getElementById('edit-icon').value  = sc?.icon  ?? '';

  renderColorSwatches();
  renderStepList();
  scenePhoto.init(`${editingScenarioId}::__scene::img`);
  nav.push('screen-scenario-editor');
}

function renderColorSwatches() {
  const container = document.getElementById('edit-color');
  container.innerHTML = '';
  THEME_PRESETS.forEach(preset => {
    const sw = document.createElement('button');
    sw.type      = 'button';
    sw.className = 'color-swatch' + (preset.color === selectedTheme.color ? ' selected' : '');
    sw.style.background = preset.color;
    sw.title     = preset.label;
    sw.setAttribute('aria-label', preset.label);
    sw.addEventListener('click', () => { selectedTheme = preset; renderColorSwatches(); });
    container.appendChild(sw);
  });
}

function renderStepList() {
  const list  = document.getElementById('step-list');
  const empty = document.getElementById('step-list-empty');
  list.innerHTML = '';
  empty.hidden   = editingSteps.length > 0;

  editingSteps.forEach((step, i) => {
    const item = document.createElement('div');
    item.className = 'step-item';
    const isFirst = i === 0;
    const isLast  = i === editingSteps.length - 1;
    item.innerHTML = `
      <div class="step-num">${i + 1}</div>
      <div class="step-info">
        <div class="step-task">${step.task}</div>
        <div class="step-prompt">${step.shopkeeper_prompt}</div>
      </div>
      <div class="step-actions">
        <button class="btn-step-action" data-a="up"   title="上移" ${isFirst ? 'disabled' : ''}>↑</button>
        <button class="btn-step-action" data-a="down" title="下移" ${isLast  ? 'disabled' : ''}>↓</button>
        <button class="btn-step-action" data-a="edit">編輯</button>
        <button class="btn-step-action danger" data-a="del">✕</button>
      </div>
    `;
    // 已有老師錄音的步驟顯示 🎙️ 徽章（非同步補上）
    if (step.id && editingScenarioId && typeof dbAudioGet === 'function') {
      dbAudioGet(`${editingScenarioId}::${step.id}::say`).then(blob => {
        if (blob) item.querySelector('.step-task')?.insertAdjacentHTML(
          'beforeend', ' <span class="step-rec-badge" title="已有老師錄音">🎙️</span>');
      }).catch(() => {});
    }

    item.querySelectorAll('[data-a]').forEach(btn => {
      btn.addEventListener('click', () => {
        switch (btn.dataset.a) {
          case 'up':
            if (i > 0) { [editingSteps[i-1], editingSteps[i]] = [editingSteps[i], editingSteps[i-1]]; renderStepList(); }
            break;
          case 'down':
            if (i < editingSteps.length - 1) { [editingSteps[i], editingSteps[i+1]] = [editingSteps[i+1], editingSteps[i]]; renderStepList(); }
            break;
          case 'edit':
            openStepEditor(i);
            break;
          case 'del': {
            const sid = editingSteps[i]?.id;
            if (sid && typeof dbAudioDelete === 'function') {
              dbAudioDelete(`${editingScenarioId}::${sid}::say`).catch(() => {});
              dbAudioDelete(`${editingScenarioId}::${sid}::img`).catch(() => {});
              _customImgCache.delete(`${editingScenarioId}::${sid}::img`);
            }
            editingSteps.splice(i, 1);
            renderStepList();
            break;
          }
        }
      });
    });
    list.appendChild(item);
  });
}

function saveScenario() {
  const name = document.getElementById('edit-name').value.trim();
  const icon = document.getElementById('edit-icon').value.trim();

  if (!name) {
    alert('請填寫情境名稱');
    document.getElementById('edit-name').focus();
    return;
  }
  if (editingSteps.length === 0) {
    alert('請至少新增一個對話步驟');
    return;
  }

  const arr = loadCustom();
  const sc  = {
    id:        editingScenarioId || ('custom_' + Date.now()),
    name,
    icon:      icon || '💬',
    theme:     selectedTheme,
    available: true,
    steps:     editingSteps,
  };

  if (editingScenarioIdx >= 0) arr[editingScenarioIdx] = sc;
  else arr.push(sc);

  saveCustom(arr);
  sfx.click();
  nav.pop();
  renderSettings();
  // 從首頁 ➕ 卡進來時，pop 回首頁需重繪卡片列表
  if (document.getElementById('screen-home').classList.contains('active')) renderHome();
}


// ─── 語音工作室（步驟編輯器：老師錄音／TTS 試聽）──────────
// 錄音立即存 IndexedDB（key = `${scenarioId}::${stepId}::say`），
// 練習播放鏈：老師錄音 → 即時 TTS（見 playCustomStepAudio）。
const voiceStudio = {
  key: null,
  getText: null,        // 回傳目前輸入框的店員台詞（TTS 試聽用）
  _recorder: null,
  _chunks: [],
  _audio: null,
  _stream: null,

  get supported() {
    return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
  },

  // 每次開啟步驟編輯器呼叫：綁定 key 並刷新按鈕狀態
  async init(key, getText) {
    this.stopAll();
    this.key = key;
    this.getText = getText;
    const recBtn = document.getElementById('btn-vs-rec');
    if (!this.supported) {
      recBtn.hidden = true;
      this._setStatus('此瀏覽器不支援錄音，練習將使用電腦語音朗讀。');
    } else {
      recBtn.hidden = false;
    }
    await this.refresh();
  },

  async refresh() {
    let has = false;
    try { has = !!(await dbAudioGet(this.key)); } catch {}
    document.getElementById('btn-vs-play').hidden = !has;
    document.getElementById('btn-vs-del').hidden  = !has;
    if (has) this._setStatus('✅ 已有老師錄音，練習時會播放您的聲音。可重新錄音覆蓋。');
  },

  _setStatus(msg) {
    const el = document.getElementById('vs-status');
    if (el) el.textContent = msg;
  },

  previewTTS() {
    this.stopAll();
    const text = (this.getText?.() || '').replace(/（[^）]*）/g, '').trim();
    if (!text) { this._setStatus('請先在上方填「店員說的話」再試聽。'); return; }
    tts.speak(text, 0.85);
  },

  async toggleRecord() {
    const btn = document.getElementById('btn-vs-rec');
    if (this._recorder && this._recorder.state === 'recording') {
      this._recorder.stop();
      return;
    }
    this.stopAll();
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this._setStatus('❌ 無法使用麥克風，請確認瀏覽器已允許麥克風權限。');
      return;
    }
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
               : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
    this._chunks = [];
    this._recorder = mime ? new MediaRecorder(this._stream, { mimeType: mime }) : new MediaRecorder(this._stream);
    this._recorder.ondataavailable = (e) => { if (e.data.size) this._chunks.push(e.data); };
    this._recorder.onstop = async () => {
      this._stream?.getTracks().forEach(t => t.stop());
      this._stream = null;
      btn.textContent = '🎙️ 錄音';
      btn.classList.remove('recording');
      const blob = new Blob(this._chunks, { type: this._recorder.mimeType || 'audio/webm' });
      if (blob.size < 200) { this._setStatus('錄音太短，未儲存。'); await this.refresh(); return; }
      try {
        await dbAudioSave(this.key, blob);
        this._setStatus('✅ 錄音已儲存！按 ▶️ 試聽，或重新錄音覆蓋。');
      } catch {
        this._setStatus('❌ 錄音儲存失敗，請再試一次。');
      }
      await this.refresh();
    };
    this._recorder.start();
    btn.textContent = '⏹ 停止錄音';
    btn.classList.add('recording');
    this._setStatus('🔴 錄音中……唸出「店員說的話」，唸完按「⏹ 停止錄音」。');
  },

  async playRecording() {
    this.stopAll();
    const blob = await dbAudioGet(this.key).catch(() => null);
    if (!blob) { this._setStatus('沒有錄音。'); await this.refresh(); return; }
    const url = URL.createObjectURL(blob);
    this._audio = new Audio(url);
    this._audio.onended = () => URL.revokeObjectURL(url);
    this._audio.play().catch(() => {});
  },

  async deleteRecording() {
    this.stopAll();
    await dbAudioDelete(this.key).catch(() => {});
    this._setStatus('已刪除錄音，練習將改用電腦語音朗讀。');
    await this.refresh();
  },

  // 取消新增步驟時清掉孤兒錄音
  async discardIfNew(isNewStep) {
    this.stopAll();
    if (isNewStep && this.key) await dbAudioDelete(this.key).catch(() => {});
  },

  stopAll() {
    if (this._recorder?.state === 'recording') { try { this._recorder.stop(); } catch {} }
    this._stream?.getTracks().forEach(t => t.stop());
    this._stream = null;
    if (this._audio) { try { this._audio.pause(); } catch {} this._audio = null; }
    tts.cancel();
  },
};

// ─── 照片工作室（場景圖／步驟插圖：教師上傳真實照片，存 IndexedDB）──────
// 與錄音同一 store（custom_audio），key 慣例：
//   步驟插圖 `${scenarioId}::${stepId}::img`、場景圖 `${scenarioId}::__scene::img`
// 播放時優先讀本機照片，無則退回 scenarios.js 的 image/clerkImage 內建路徑。
function compressImageToBlob(file, maxDim = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        const r = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * r); h = Math.round(h * r);
      }
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      cv.toBlob(b => b ? resolve(b) : reject(new Error('compress failed')), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
  });
}

// 播放端照片解析（帶快取，key 未變不重建 URL；上傳/刪除時清該 key 快取）
const _customImgCache = new Map();  // key -> objectURL | null
async function resolveCustomImageURL(key) {
  if (_customImgCache.has(key)) return _customImgCache.get(key);
  let url = null;
  try {
    const blob = typeof dbAudioGet === 'function' ? await dbAudioGet(key) : null;
    if (blob) url = URL.createObjectURL(blob);
  } catch {}
  _customImgCache.set(key, url);
  return url;
}

// 通用照片上傳器（步驟編輯器與情境編輯器共用）
function makePhotoUploader({ previewId, removeBtnId, statusId }) {
  return {
    key: null,
    async init(key) { this.key = key; await this.refresh(); },
    async refresh() {
      let blob = null;
      try { blob = this.key ? await dbAudioGet(this.key) : null; } catch {}
      const prev = document.getElementById(previewId);
      const rm   = document.getElementById(removeBtnId);
      if (!prev) return;
      if (prev.dataset.objUrl) { URL.revokeObjectURL(prev.dataset.objUrl); prev.dataset.objUrl = ''; }
      if (blob) {
        const u = URL.createObjectURL(blob);
        prev.src = u; prev.hidden = false; prev.dataset.objUrl = u;
        if (rm) rm.hidden = false;
      } else {
        prev.hidden = true; prev.removeAttribute('src');
        if (rm) rm.hidden = true;
      }
    },
    async upload(file) {
      if (!file || !this.key) return;
      const st = statusId && document.getElementById(statusId);
      try {
        const blob = await compressImageToBlob(file);
        await dbAudioSave(this.key, blob);
        _customImgCache.delete(this.key);
        if (st) st.textContent = '✅ 照片已儲存，練習時會顯示這張。';
      } catch {
        if (st) st.textContent = '❌ 照片處理失敗，請換一張再試。';
      }
      await this.refresh();
    },
    async remove() {
      if (!this.key) return;
      await dbAudioDelete(this.key).catch(() => {});
      _customImgCache.delete(this.key);
      const st = statusId && document.getElementById(statusId);
      if (st) st.textContent = '已移除照片，練習時會用內建圖示。';
      await this.refresh();
    },
    async discardIfNew(isNew) {
      if (isNew && this.key) { await dbAudioDelete(this.key).catch(() => {}); _customImgCache.delete(this.key); }
    },
  };
}
const stepPhoto  = makePhotoUploader({ previewId: 'edit-step-photo-preview',  removeBtnId: 'btn-step-photo-del',  statusId: 'step-photo-status' });
const scenePhoto = makePhotoUploader({ previewId: 'edit-scene-photo-preview', removeBtnId: 'btn-scene-photo-del', statusId: 'scene-photo-status' });


// ─── 步驟編輯器 ─────────────────────────────────────

let editingStepIdx = -1;
let editingStepId  = null;   // 進步驟編輯器即固定（新步驟預產），錄音 key 依賴它

function openStepEditor(idx) {
  editingStepIdx = idx;
  const step = idx >= 0 ? editingSteps[idx] : null;
  editingStepId = step?.id ?? ('step_' + Date.now());
  voiceStudio.init(`${editingScenarioId}::${editingStepId}::say`, () =>
    document.getElementById('edit-prompt').value.trim());
  stepPhoto.init(`${editingScenarioId}::${editingStepId}::img`);

  document.getElementById('step-editor-title').textContent = step ? '編輯步驟' : '新增步驟';
  document.getElementById('edit-prompt').value   = step?.shopkeeper_prompt ?? '';
  document.getElementById('edit-task').value     = step?.task              ?? '';
  document.getElementById('edit-answer').value   = step?.accepted_phrases?.[0] ?? '';
  document.getElementById('edit-keywords').value = step?.keywords?.join(', ')  ?? '';

  // options[0] = correct; [1][2][3] = wrong
  const opts = step?.options ?? [];
  document.getElementById('edit-opt1').value = opts[1] ?? '';
  document.getElementById('edit-opt2').value = opts[2] ?? '';
  document.getElementById('edit-opt3').value = opts[3] ?? '';

  // 回饋語：只回填「非預設」的自訂值，預設值留白（placeholder 說明預設內容）
  const ans0 = step?.accepted_phrases?.[0] ?? '';
  const fbP  = step?.feedback?.perfect ?? '';
  const fbF  = step?.feedback?.failed  ?? '';
  document.getElementById('edit-fb-perfect').value = (fbP && fbP !== '很好！說得很棒！') ? fbP : '';
  document.getElementById('edit-fb-failed').value  = (fbF && fbF !== `可以這樣說：「${ans0}」`) ? fbF : '';

  // 進階：看圖造句句框（item-slot）回填
  const fr = step?.frame;
  let frTpl = '', frChoices = '';
  if (fr?.template && fr.template !== '{say}' && fr.slots) {
    const k = Object.keys(fr.slots)[0];
    frTpl = fr.template;
    const slot = fr.slots[k];
    const ans = Array.isArray(slot.answer) ? slot.answer[0] : slot.answer;
    const rest = (slot.choices || []).map(c => c.text).filter(t => t !== ans);
    frChoices = [ans, ...rest].join(',');
  }
  document.getElementById('edit-frame-template').value = frTpl;
  document.getElementById('edit-frame-choices').value  = frChoices;

  nav.push('screen-step-editor');
}

function saveStep() {
  const prompt  = document.getElementById('edit-prompt').value.trim();
  const task    = document.getElementById('edit-task').value.trim();
  const answer  = document.getElementById('edit-answer').value.trim();

  if (!prompt) { alert('請填寫店員說的話');    document.getElementById('edit-prompt').focus(); return; }
  if (!task)   { alert('請填寫學生的任務說明'); document.getElementById('edit-task').focus();   return; }
  if (!answer) { alert('請填寫標準答案');       document.getElementById('edit-answer').focus(); return; }

  const rawKw   = document.getElementById('edit-keywords').value.trim();
  const keywords = rawKw
    ? rawKw.split(/[,，\s]+/).map(k => k.trim()).filter(Boolean)
    : [answer];

  const FALLBACK_WRONG = ['我不知道', '沒關係', '好的謝謝'];
  const wrongOpts = [
    document.getElementById('edit-opt1').value.trim(),
    document.getElementById('edit-opt2').value.trim(),
    document.getElementById('edit-opt3').value.trim(),
  ].filter(Boolean);
  while (wrongOpts.length < 3) {
    const fb = FALLBACK_WRONG.find(g => g !== answer && !wrongOpts.includes(g)) || '…';
    wrongOpts.push(fb);
  }

  const step = {
    id: editingStepId || ('step_' + Date.now()),
    shopkeeper_prompt: prompt,
    task,
    keywords,
    accepted_phrases:  [answer],
    llm_context_hint:  '',
    options:           [answer, ...wrongOpts.slice(0, 3)],
    feedback: {
      perfect: document.getElementById('edit-fb-perfect').value.trim() || '很好！說得很棒！',
      partial: `說出了重點！試試說完整：「${answer}」`,
      failed:  document.getElementById('edit-fb-failed').value.trim() || `可以這樣說：「${answer}」`,
    },
  };

  // 進階：看圖造句句框（item-slot）。填了 template（含 {空格}）與選項才建立
  const frTpl     = document.getElementById('edit-frame-template').value.trim();
  const frChoices = document.getElementById('edit-frame-choices').value.trim();
  const slotMatch = frTpl.match(/\{([^}]+)\}/);
  if (slotMatch && frChoices) {
    const slotKey = slotMatch[1];
    const items   = frChoices.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
    if (items.length >= 2) {
      step.frame = {
        template: frTpl,
        slots: { [slotKey]: {
          answer: items[0],
          choices: items.map(t => ({ text: t, emoji: guessEmoji(t) })),
        } },
      };
    }
  }

  if (editingStepIdx >= 0) editingSteps[editingStepIdx] = step;
  else editingSteps.push(step);

  voiceStudio.stopAll();
  sfx.click();
  nav.pop();
  renderStepList();
}


// ─── 事件綁定 ────────────────────────────────────────

// ESC 鍵關閉所有彈窗
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!document.getElementById('clerk-modal').hidden)    { hideClerkPopup(); return; }
  if (!document.getElementById('student-voice-modal').hidden) { hideStudentVoicePopup(); return; }
  if (!document.getElementById('hint-modal').hidden)     { hideHint();     return; }
  if (!document.getElementById('feedback-modal').hidden) { hideFeedback(); return; }
});

document.addEventListener('DOMContentLoaded', async () => {
  await voiceManager.init();
  userVoiceManager.init();


  // 情境選擇頁：上一頁（=首頁）+ 返回主頁
  document.getElementById('btn-sit-back').addEventListener('click', renderHome);
  document.getElementById('btn-sit-home').addEventListener('click', renderHome);

  // 簡易版 / 完整版切換
  document.querySelectorAll('.sit-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sit-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.simpleMode = btn.dataset.mode === 'simple';
      renderSituationOptions();
    });
  });

  // 難度選擇頁：上一頁（=情境選擇；自訂情境無此層 → 回主頁）+ 返回主頁
  document.getElementById('btn-diff-back').addEventListener('click', () => {
    if (state.scenario?.situations) showScreen('screen-situation');
    else renderHome();
  });
  document.getElementById('btn-diff-home').addEventListener('click', renderHome);
  // 鷹架卡（置頂，僅主情境顯示）：系統帶練，終點開口說
  document.getElementById('diff-scaffold-card').addEventListener('click', () => { sfx.click(); startScaffoldMode(); });
  // 難度卡（初/中/高級）：只綁有 data-level 的卡，避免誤把鷹架卡當難度
  document.querySelectorAll('.diff-card[data-level]').forEach(card => {
    card.addEventListener('click', () => {
      sfx.click();
      state.scaffoldMode = false;   // 自由模式：學生自己選輸入方式
      startWithDifficulty(card.dataset.level);
    });
  });

  // 練習頁：上一頁（=難度/模式選擇頁）+ 返回主頁
  document.getElementById('btn-prev').addEventListener('click', () => showScreen('screen-difficulty'));
  document.getElementById('btn-back').addEventListener('click', renderHome);

  // 麥克風按鈕
  document.getElementById('btn-mic').addEventListener('click', startListening);

  // 店員對話框左邊的 🔊：再聽一次店員語音
  document.getElementById('btn-replay-clerk').addEventListener('click', () => {
    const step = state.situation?.steps[state.stepIndex];
    if (step) playShopkeeperAudio(step);
  });

  // 提示按鈕 & 提示彈窗關閉
  document.getElementById('btn-hint-trigger').addEventListener('click', showHint);
  document.getElementById('btn-hint-close').addEventListener('click', hideHint);
  document.getElementById('hint-backdrop').addEventListener('click', hideHint);
  document.getElementById('btn-hint-speak').addEventListener('click', () => {
    const text = document.getElementById('hint-text').textContent;
    if (text) speakHint(text);
  });
  document.getElementById('btn-easy-hint-speak').addEventListener('click', () => {
    const step = state.situation?.steps[state.stepIndex];
    if (step) speakHint(`你可以這樣說，${step.accepted_phrases[0]}`);
  });

  // 朗讀「你的任務」（瀏覽器 TTS，即時朗讀，不需預先產生音檔）
  document.getElementById('btn-task-speak').addEventListener('click', () => {
    const step = state.situation?.steps[state.stepIndex];
    if (step?.task) speakHint(step.task);
  });

  // 輸入模式切換
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.scenario) return;
      hideFeedback();
      hideActionRow();
      setInputMode(btn.dataset.mode);
    });
  });

  // 文字輸入送出
  document.getElementById('btn-text-submit').addEventListener('click', () => {
    const text = document.getElementById('text-input').value.trim();
    if (text) handleInput(text);
  });
  document.getElementById('text-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = e.target.value.trim();
      if (text) handleInput(text);
    }
  });

  // 下一步 / 重試
  document.getElementById('btn-next').addEventListener('click', nextStep);
  document.getElementById('btn-retry').addEventListener('click', retryStep);

  // 完成頁
  document.getElementById('btn-again').addEventListener('click', () => {
    if (state.situation) startWithSituation(state.situation);
    else startScenario(state.scenario);
  });
  document.getElementById('btn-change-sit').addEventListener('click', () => startScenario(state.scenario));
  document.getElementById('btn-home').addEventListener('click', renderHome);

  // 資料匯出匯入
  document.getElementById('btn-export-data').addEventListener('click', async () => {
    const json = await dbExport();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `shopping-practice-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('input-import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const statusEl = document.getElementById('import-status');
    try {
      const text = await file.text();
      const count = await dbImport(text);
      statusEl.textContent = `✅ 已匯入 ${count} 筆紀錄`;
    } catch {
      statusEl.textContent = '❌ 匯入失敗，請確認檔案格式';
    }
    e.target.value = '';
  });

  // 對話包匯出/匯入
  document.getElementById('btn-export-pack').addEventListener('click', async () => {
    const statusEl = document.getElementById('pack-status');
    statusEl.textContent = '⏳ 打包中…';
    try {
      const json = await exportDialoguePack();
      if (!json) { statusEl.textContent = '沒有自訂情境可以匯出，先到首頁「➕ 自訂情境」建立一個吧！'; return; }
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `對話包_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      statusEl.textContent = '✅ 已匯出（含老師錄音）';
    } catch {
      statusEl.textContent = '❌ 匯出失敗，請再試一次';
    }
  });

  document.getElementById('input-import-pack').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const statusEl = document.getElementById('pack-status');
    statusEl.textContent = '⏳ 匯入中…';
    try {
      const { scenarios, audios } = await importDialoguePack(await file.text());
      statusEl.textContent = `✅ 已匯入 ${scenarios} 個情境、${audios} 段錄音`;
      renderSettings();
    } catch (err) {
      statusEl.textContent = `❌ 匯入失敗：${err.message || '請確認是對話包檔案'}`;
    }
    e.target.value = '';
  });

  // AI API Key
  const keyInput  = document.getElementById('input-api-key');
  const keyStatus = document.getElementById('api-key-status');
  const saved = localStorage.getItem('gemini_api_key') || '';
  keyInput.value = saved ? '••••••••' : '';
  keyStatus.textContent = saved ? '✅ 已設定（AI 語意評分啟用中）' : '未設定（使用關鍵字比對）';
  document.getElementById('btn-save-api-key').addEventListener('click', () => {
    const val = keyInput.value.trim();
    if (!val || val.startsWith('•')) { keyStatus.textContent = '未變更'; return; }
    if (val === 'clear') {
      localStorage.removeItem('gemini_api_key');
      keyInput.value = '';
      keyStatus.textContent = '已清除 API Key';
    } else {
      localStorage.setItem('gemini_api_key', val);
      keyInput.value = '••••••••';
      keyStatus.textContent = '✅ 已儲存（AI 語意評分啟用中）';
    }
    engine = createEngine();
  });
  const clearKeyBtn = document.getElementById('btn-clear-api-key');
  if (clearKeyBtn) {
    clearKeyBtn.addEventListener('click', () => {
      if (!localStorage.getItem('gemini_api_key')) {
        keyStatus.textContent = '目前未設定金鑰';
        return;
      }
      if (!confirm('確定要清除已儲存的 Gemini API Key 嗎？清除後將改回免費的關鍵字比對模式。')) return;
      localStorage.removeItem('gemini_api_key');
      keyInput.value = '';
      keyStatus.textContent = '已清除 API Key（改用免費關鍵字比對）';
      engine = createEngine();
    });
  }

  // 精熟標準（提示褪除門檻）
  const masterySel = document.getElementById('select-mastery');
  if (masterySel) {
    masterySel.value = String(getMasteryCriterion());
    masterySel.addEventListener('change', () => {
      localStorage.setItem('sp_masteryCriterion', masterySel.value);
    });
  }

  // 無障礙設定
  a11y.init();
  document.getElementById('btn-high-contrast').addEventListener('click', () => a11y.toggleContrast());
  document.getElementById('btn-aac-mode').addEventListener('click', () => a11y.toggleAAC());
  document.getElementById('btn-clerk-greet').addEventListener('click', () => a11y.toggleClerkGreet());
  document.querySelectorAll('.font-size-btn').forEach(btn => {
    btn.addEventListener('click', () => a11y.setFontSize(btn.dataset.size));
  });

  // 設定頁
  document.getElementById('btn-settings').addEventListener('click', () => {
    renderSettings();
    nav.push('screen-settings');
  });
  document.getElementById('btn-settings-back').addEventListener('click', () => {
    nav.pop();
    renderHome();
  });
  document.getElementById('btn-add-scenario').addEventListener('click', () => openScenarioEditor(-1));

  // 內建關鍵字編輯頁
  document.getElementById('btn-edit-keywords').addEventListener('click', openKeywordEditor);
  document.getElementById('btn-kw-back').addEventListener('click', () => nav.pop());
  document.getElementById('btn-kw-save').addEventListener('click', saveKeywordEditor);
  document.getElementById('btn-kw-reset-situation').addEventListener('click', resetKwSituation);

  // 情境編輯頁
  document.getElementById('btn-scenario-back').addEventListener('click', () => {
    // 取消「新增情境」→ 清掉此暫定情境 id 底下的孤兒錄音
    if (editingScenarioIdx < 0 && editingScenarioId && typeof dbAudioDeletePrefix === 'function') {
      dbAudioDeletePrefix(`${editingScenarioId}::`).catch(() => {});
    }
    nav.pop();
  });
  document.getElementById('btn-save-scenario').addEventListener('click', saveScenario);
  document.getElementById('btn-add-step').addEventListener('click', () => openStepEditor(-1));
  document.getElementById('btn-ai-copy-prompt').addEventListener('click', copyAiPrompt);
  document.getElementById('btn-ai-import').addEventListener('click', importAiSteps);

  // 步驟編輯頁
  document.getElementById('btn-step-back').addEventListener('click', () => {
    voiceStudio.discardIfNew(editingStepIdx < 0);   // 取消新增步驟 → 清孤兒錄音
    stepPhoto.discardIfNew(editingStepIdx < 0);      // 取消新增步驟 → 清孤兒照片
    nav.pop();
  });
  document.getElementById('btn-save-step').addEventListener('click', saveStep);

  // 照片上傳（步驟插圖＋場景圖）
  document.getElementById('edit-step-photo-input').addEventListener('change', (e) => {
    if (e.target.files?.[0]) stepPhoto.upload(e.target.files[0]); e.target.value = '';
  });
  document.getElementById('btn-step-photo-del').addEventListener('click', () => stepPhoto.remove());
  document.getElementById('edit-scene-photo-input').addEventListener('change', (e) => {
    if (e.target.files?.[0]) scenePhoto.upload(e.target.files[0]); e.target.value = '';
  });
  document.getElementById('btn-scene-photo-del').addEventListener('click', () => scenePhoto.remove());

  // 語音工作室（步驟編輯器內）
  document.getElementById('btn-vs-tts').addEventListener('click', () => voiceStudio.previewTTS());
  document.getElementById('btn-vs-rec').addEventListener('click', () => voiceStudio.toggleRecord());
  document.getElementById('btn-vs-play').addEventListener('click', () => voiceStudio.playRecording());
  document.getElementById('btn-vs-del').addEventListener('click', () => voiceStudio.deleteRecording());

  // 學生選擇
  renderStudentChip();
  document.getElementById('btn-student').addEventListener('click', openStudentModal);

  // 情境分部 tab：同一版面過濾顯示（第一/二/三部分＋自訂）
  document.getElementById('home-parts')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.home-part-btn');
    if (!btn) return;
    sfx.click();
    homePart = btn.dataset.part;
    document.querySelectorAll('.home-part-btn').forEach(b => b.classList.toggle('active', b === btn));
    renderHome();
  });
  document.getElementById('btn-home-reward')?.addEventListener('click', () => {
    if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
    else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
  });
  document.getElementById('student-backdrop').addEventListener('click', () => {
    document.getElementById('student-modal').hidden = true;
  });

  // 店員介紹彈窗
  document.getElementById('clerk-backdrop').addEventListener('click', hideClerkPopup);
  document.getElementById('btn-clerk-close').addEventListener('click', () => { sfx.click(); hideClerkPopup(); });
  document.getElementById('btn-clerk-replay').addEventListener('click', () => {
    const modal = document.getElementById('clerk-modal');
    if (modal._practiceStep) playShopkeeperAudio(modal._practiceStep);
    else if (modal._scenario) playClerkIntro(modal._scenario);
  });

  // 練習頁店員頭像：點擊放大並重播這一步的台詞（鍵盤 Enter/空白鍵同）
  const shopAvatar = document.getElementById('shopkeeper-avatar');
  shopAvatar.addEventListener('click', () => { sfx.click(); showPracticeClerkPopup(); });
  shopAvatar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sfx.click(); showPracticeClerkPopup(); }
  });

  // 學生語音彈窗
  document.getElementById('student-voice-backdrop').addEventListener('click', hideStudentVoicePopup);
  document.getElementById('btn-student-voice-close').addEventListener('click', () => { sfx.click(); hideStudentVoicePopup(); });
  document.getElementById('btn-student-voice-replay').addEventListener('click', () => speakAsUser('你好！我要點餐！'));

  // 瀏覽器不支援語音輸入：藏起「🎤 說話」即可——「🗣️ 跟讀」是常駐模式，
  // 學生照樣能開口念、聽自己的錄音，切換列也不會多出一顆用不了的鈕。
  if (!recognizer.supported) {
    const voiceBtn = document.querySelector('.mode-btn[data-mode="voice"]');
    voiceBtn.hidden = true;
    document.querySelector('.mode-btn[data-mode="echo"]').title = voiceUnsupportedReason();
  }

  // 跟讀模式：聽示範 ＋ 錄音回放 ＋ 三級自評
  document.getElementById('btn-echo-listen').addEventListener('click', () => {
    const step = state.situation?.steps[state.stepIndex];
    if (step) speakAsUser(echoModelSentence(step));
  });
  document.getElementById('btn-echo-rec').addEventListener('click', () => {
    sfx.click();
    if (echoRecorder.recording) echoRecorder.stop(); else echoRecorder.start();
  });
  document.getElementById('btn-echo-play').addEventListener('click', () => { sfx.click(); echoRecorder.play(); });
  document.getElementById('btn-echo-skip-rec').addEventListener('click', () => { sfx.click(); unlockEchoRate(); });
  document.querySelectorAll('.btn-echo-rate').forEach(btn => {
    btn.addEventListener('click', () => { sfx.click(); handleEchoSelfRate(btn.dataset.rate); });
  });

  // 學習歷程已移至專案「學習歷程總覽」（teacher.html）；主頁內嵌歷程頁與其事件綁定已移除

  // 語音包下載按鈕
  document.getElementById('btn-cache-audio').addEventListener('click', cacheCurrentScenarioAudio);

  // 獎勵系統
  document.getElementById('btn-reward').addEventListener('click', () => {
    if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
    else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
  });

  // 啟動
  renderHome();

  // ─── 除錯工具初始化 ──────────────────────────────
  if (new URLSearchParams(location.search).get('debug') === '1') {
    initDebugPanel();
  }
});


// ─── 完成頁推薦遊戲 ──────────────────────────────────

const SCENARIO_RECOMMEND = {
  convenience_store: [
    { label: '🛒 A4 超市購物', url: '../html/a4_supermarket.html' },
    { label: '💰 C6 找零練習', url: '../html/c6_making_change.html' },
    { label: '🏧 A5 ATM 操作', url: '../html/a5_atm_simulator.html' },
  ],
  breakfast_shop: [
    { label: '🍔 A3 麥當勞點餐', url: '../html/a3_mcdonalds.html' },
    { label: '💵 C5 夠不夠',    url: '../html/c5_enough_or_not.html' },
  ],
  supermarket: [
    { label: '🛒 A4 超市購物',   url: '../html/a4_supermarket.html' },
    { label: '💰 C6 找零練習',   url: '../html/c6_making_change.html' },
    { label: '🏪 A1 販賣機',    url: '../html/a1_vending_machine.html' },
  ],
  night_market: [
    { label: '💰 C6 找零練習',   url: '../html/c6_making_change.html' },
    { label: '🏪 A1 販賣機',    url: '../html/a1_vending_machine.html' },
    { label: '📊 B4 特賣比一比', url: '../html/b4_sale_compare.html' },
  ],
  pharmacy: [
    { label: '💵 C5 夠不夠',    url: '../html/c5_enough_or_not.html' },
    { label: '💰 C6 找零練習',   url: '../html/c6_making_change.html' },
  ],
  clothing_store: [
    { label: '🛒 A4 超市購物',   url: '../html/a4_supermarket.html' },
    { label: '📊 B4 特賣比一比', url: '../html/b4_sale_compare.html' },
  ],
  fast_food: [
    { label: '🍔 A3 麥當勞點餐', url: '../html/a3_mcdonalds.html' },
    { label: '💵 C5 夠不夠',    url: '../html/c5_enough_or_not.html' },
  ],
  stationery_store: [
    { label: '🛒 A4 超市購物',   url: '../html/a4_supermarket.html' },
    { label: '💰 C6 找零練習',   url: '../html/c6_making_change.html' },
  ],
};

function renderRecommendCards(scenarioId) {
  const box = document.getElementById('complete-recommend');
  const items = SCENARIO_RECOMMEND[scenarioId];
  if (!items?.length) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `<div class="complete-recommend-title">🎮 接著練習</div>
    <div class="recommend-cards">
      ${items.map(i => `<a class="recommend-card" href="${i.url}" target="_blank">${i.label}</a>`).join('')}
    </div>`;
}


// ─── 列印報告 ────────────────────────────────────────

// 從一筆學習紀錄產生報告（學習歷程頁的列印按鈕使用，教師功能）
function printReport(record) {
  if (!record) return;
  const date = new Date(record.ts || Date.now()).toLocaleString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const stars = '⭐'.repeat(record.stars || 0);

  const rows = (record.steps || []).map((s, i) => {
    const icon = !s.score ? '—' : s.score === 'perfect' ? '✅' : s.score === 'partial' ? '💪' : '❌';
    return `<tr><td>${i + 1}</td><td>${s.task || ''}</td><td style="text-align:center">${icon}</td>`
      + `<td style="text-align:center">${s.attempts || 1}</td>`
      + `<td style="text-align:center">${s.hintUsed ? '💡' : ''}</td></tr>`;
  }).join('');

  document.getElementById('print-report-sheet').innerHTML = `
    <h1>購物練習報告</h1>
    <div class="rpt-meta">
      學生：${record.studentName || '訪客'}　練習時間：${date}<br>
      情境：${record.scenarioName || record.scenarioId} — ${record.situationName || record.situationId}<br>
      成績：${record.score}/${record.total} 答對　${stars}
    </div>
    <table>
      <tr><th>#</th><th>對話任務</th><th>結果</th><th>嘗試次數</th><th>使用提示</th></tr>
      ${rows}
    </table>`;

  window.print();
}


// ─── PWA 語音包快取 ──────────────────────────────────

function getCacheableAudioUrls() {
  if (!state.scenario) return [];
  const stems = [];
  const base  = `audio/clerk/${state.scenario.id}`;

  // intro
  stems.push(`${base}_intro`);

  // 所有情境的 clerk 音檔
  (state.scenario.situations || []).forEach(sit => {
    sit.steps.forEach(step => {
      stems.push(`${base}_${sit.id}_${step.id}`);
      stems.push(`${base}_unknown_${step.id}`);
      // feedback
      ['perfect', 'partial', 'failed'].forEach(score => {
        stems.push(`audio/feedback/${state.scenario.id}_${sit.id}_${step.id}_${score}`);
      });
    });
  });

  // 每個檔名嘗試 mp3 與 wav 兩種副檔名（不存在的會在快取時自然失敗，不影響其他檔）
  const urls = stems.flatMap(s => [`${s}.mp3`, `${s}.wav`]);

  // 去重，轉為絕對 URL
  return [...new Set(urls)].map(u => new URL(u, location.href).href);
}

async function cacheCurrentScenarioAudio() {
  const btn = document.getElementById('btn-cache-audio');
  if (!navigator.serviceWorker?.controller) {
    alert('Service Worker 未就緒，請重新整理頁面後再試。');
    return;
  }
  const urls = getCacheableAudioUrls();
  if (urls.length === 0) return;

  btn.classList.add('caching');
  btn.title = '下載中…';

  navigator.serviceWorker.controller.postMessage({ type: 'CACHE_AUDIO', urls });

  await new Promise(resolve => {
    const handler = (e) => {
      if (e.data?.type === 'CACHE_AUDIO_DONE') {
        navigator.serviceWorker.removeEventListener('message', handler);
        resolve(e.data);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
  });

  btn.classList.remove('caching');
  btn.classList.add('cached');
  btn.textContent = '✅';
  btn.title = '語音包已下載，可離線使用';
}


// ─── 除錯工具 ────────────────────────────────────────

function initDebugPanel() {
  const panel = document.getElementById('debug-panel');
  panel.hidden = false;

  // 更新 debug 資訊（renderStep 呼叫後觸發）
  window._debugUpdate = () => {
    if (!state.scenario || !state.situation) return;
    const step  = state.situation.steps[state.stepIndex];
    const total = state.situation.steps.length;
    document.getElementById('dbg-scenario').textContent  = state.scenario.id;
    document.getElementById('dbg-situation').textContent = state.situation.id;
    document.getElementById('dbg-step').textContent = `${state.stepIndex + 1}/${total}  id=${step.id}`;

    // 列出候選音檔
    const base  = `audio/clerk/${state.scenario.id}`;
    const files = [
      `${base}_${state.situation.id}_${step.id}.mp3`,
      `${base}_unknown_${step.id}.mp3`,
    ];
    document.getElementById('dbg-audio').textContent = files.join(' → ');
  };

  // 顯示 STT 原始文字（注入到 handleInput）
  const _origHandleInput = window.handleInput;
  if (typeof handleInput === 'function') {
    const origRef = handleInput;
    window._debugShowSTT = (raw) => {
      document.getElementById('dbg-stt').textContent = raw || '（空）';
    };
  }

  // 跳步驟
  document.getElementById('dbg-jump-btn').addEventListener('click', () => {
    const idx = parseInt(document.getElementById('dbg-jump-input').value, 10);
    if (!state.situation || isNaN(idx)) return;
    state.stepIndex = Math.max(0, Math.min(idx, state.situation.steps.length - 1));
    renderStep();
    hideFeedback();
  });

  // 強制下一步
  document.getElementById('dbg-force-next').addEventListener('click', () => {
    if (!state.situation) return;
    nextStep();
  });
}
