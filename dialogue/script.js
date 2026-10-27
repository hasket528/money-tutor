// ⚠️ 改了 script.js／index.html 就要把這個版本號和 sw.js 的 CACHE_CORE 一起 +1，
// 否則 Service Worker 會繼續餵舊程式（核心資源是快取優先）。
// 設定頁最下方會顯示「程式版本 vs 快取版本 vs 開啟方式」，不一致就知道是快取沒更新。
// `node tests/_audit_version.js` 會擋下兩處對不上的情況。
const APP_VERSION = 'v387';

// ─── 對話引擎（抽象層）────────────────────────────
// 這個介面設計讓未來可以直接替換成 LLM 引擎，前端不用改動

class DialogueEngine {
  evaluate(input, step) { throw new Error('未實作'); }
}

class RuleBasedEngine extends DialogueEngine {
  // 比對邏輯在下方 ruleEvaluate（判定區塊內，測試與稽核直接抽那一支來跑，不另抄一份）
  evaluate(input, step) { return ruleEvaluate(input, step); }
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
  ['零前', '零錢'], ['另錢', '零錢'], ['零千', '零錢'],   // 「換零錢」最常被聽成的三種

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

  // 同音誤聽（2026-08-19 補，來源：stt_probe 掃描教材高頻詞）
  // 錢/前/千 同音，是最常被打錯的一組——「多少錢」出現在 20+ 步
  ['多少前', '多少錢'], ['多少千', '多少錢'], ['幾前', '幾錢'],
  ['線金', '現金'], ['現斤', '現金'], ['副現', '付現'],
  ['悠游卡', '悠遊卡'], ['心用卡', '信用卡'],
  ['行動之付', '行動支付'], ['形動支付', '行動支付'],
  ['收具', '收據'], ['收劇', '收據'], ['發飄', '發票'],
  ['推貨', '退貨'], ['四穿', '試穿'], ['是穿', '試穿'],
  ['過旗', '過期'], ['東瓜茶', '冬瓜茶'], ['巧客力', '巧克力'],
  ['土司', '吐司'], ['洗麵乳', '洗面乳'],
  ['包果', '包裹'], ['包過', '包裹'], ['刮號', '掛號'],
  ['做過站', '坐過站'], ['作過站', '坐過站'], ['座過站', '坐過站'],   // 坐/做/作/座 同音（2026-10-10 使用者定）

  // STT 常加上的贅詞
  ['請問一下', '請問'],
  ['謝謝你', '謝謝'], ['謝謝您', '謝謝'],
  ['好的好的', '好的'], ['可以可以', '可以'],
  ['頭疼', '頭痛'],

  // ⚠️ 收尾：上面 ['悠遊','悠遊卡'] 是字串替換，碰到本來就完整的「悠遊卡」會疊成「悠遊卡卡」
  //（既有 bug，2026-08-19 發現）。放在最後把疊出來的字收掉——順序有意義，別往上搬。
  ['悠遊卡卡', '悠遊卡'],
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
  // 金錢單位的口語／同音變體統一成「元」（對照表是字串替換，窮舉不了每一個數字，故用正則）：
  //   10圓→10元（數字後面的「圓」幾乎只可能是錢）
  //   5塊→5元（學生講「五塊」而標準句寫「5 元」是最常見的落差）
  // ⚠️ 「塊」用負向斷言擋掉後面接中文字的情況，「一塊蛋糕」「三塊布」不會被誤轉成「1元蛋糕」。
  //    殘留風險：「我要 3 塊」若指的是三塊點心仍會被轉成「3 元」——金錢教材語境下判斷划算。
  // 放在對照表之後，讓對照表產生的結果也一併正規化。
  t = _moneyUnitToYuan(t);
  return t.trim();
}
// 金額單位統一成「元」：20圓／20塊／20塊錢 → 20元（2026-09-23 補「塊錢」與「20塊給你」這類後面接字的說法）。
// 「塊」後面接中文字時只放行常見的虛詞／動詞（給、就、好、嗎、的…），「一塊蛋糕」「三塊布」仍不轉。
// 簡單／普通（normKw）與困難（normHard）共用這一支。
function _moneyUnitToYuan(t) {
  return String(t)
    .replace(/(\d+)圓/g, '$1元')
    .replace(/(\d+)塊錢/g, '$1元')
    .replace(/(\d+)塊(?=[給就好嗎對找的可請謝夠還也呢啦喔吧]|[^一-龥]|$)/g, '$1元');
}
// 只講數字、沒講單位（「我給你 20」「一百」）也算講到「20元」這個金額關鍵字（2026-09-23 使用者要求）。
// 只認完整的數字：200／120 不算 20；後面接量詞或其他單位的也不算（20個、20號、20分鐘、20點不是錢）。
const _BARE_NUM_STOP = '元個塊張枚圓位人本杯份站件盒部包瓶支條顆罐袋款號折週排碗雙隻把串片台點次天樣種步班分秒歲年月日樓公乘加減除';
function _bareMoneyHit(t, k) {
  const m = /^(\d+)元$/.exec(k);
  if (!m) return false;
  return new RegExp(`(?<![\\d第])${m[1]}(?![\\d${_BARE_NUM_STOP}])`).test(t);
}

// ─── 高級判定：必要成分（硬門檻）＋ 完整度（比例）─────────────────
// 2026-08-05 改。原本是「整句逐字相等」（accepted_phrases 逐一比對），問題有二：
//   ① 語音辨識本來就會聽錯字（零錢→零前），②同一個意思有無限多種說法，資料端窮舉不完。
// 於是「我想把 100 元換成 10 個 10 元」只因為「要」講成「想」就判錯，難度高到不合理。
//
// 改成不列舉、不產生句子，直接量學生說出的那一句，三道關卡：
//   ① 關鍵詞　step.keywords 任一命中即可——整組視為「同一個必要成分」，因為那多半是
//      同義寫法（10個10元／十個十元／…），真要求全中會比舊版更嚴。
//   ② 數字　　(a) 任務敘述裡寫出來的數字必須講到；(b) 學生說出的數字不得與標準句集合矛盾。
//      沒寫進任務、學生也沒講的數字不扣分，那交給 ③ 判完整度。
//      **金額看錢的總數、不看字面數字**（2026-09-18，見下方 _moneyOf）。
//   ③ 完整度　與最相近標準句的字元重合率（最長共同子序列，允許中間插字、語序微調）。
//      達標＝全對；②過了但③未達＝部分對（重點抓對、句子沒說完整），這正是高級與中級的分界。
//
// ⚠️ ② 在 2026-08-05 由「正解 options[0] 裡的數字必須全部講到」改成現在這兩條。舊版把兩件事
//    混為一談：「說錯金額」（要擋）與「沒說次要數字」（不該擋）。實測全站 2056 個
//    accepted_phrases 有 34 句被舊版判 failed——資料說「這樣講可以」，規則卻判錯，兩邊互相矛盾。
//    絕大多數是任務根本沒要求那個數字（任務寫「說要加值」而正解是「好，我要加值一百元」；
//    「算出總價確認」的重點是 597 而不是人數 3）。
//    **必要數字改以 step.task 為準**，因為那是螢幕上給學生看的指示：要求學生講的東西必須先講給他聽。
//    要讓某個數字變成必答，就把它寫進任務敘述。
//      · count_check 標準句集合只有 {100} → 學生說「我數好了剛好 10 元」→ 10 講錯 → failed
//      · （舊）say_combo「換成 10 個 10 元」缺 100 → failed。2026-09-18 起 10 個 10 元的總數就是 100，
//        算有講到；使用者也決定這樣講算全對，這幾句已加回 accepted_phrases。
//
// 不變式：**accepted_phrases 裡的每一句，高級都必須判全對**（③ 對 accepts 自己恆為 1.0，
//    所以只有 ①② 擋得住）。資料若認為某句只算「部分完整」，就不該放進 accepted_phrases。
//    由 tests/hard_mode.test.js 的全站掃描守著。
// 回歸測試：tests/hard_mode.test.js（直接抽本段原始碼執行，不另外鏡像一份邏輯）。
const HARD_COVERAGE = 0.70;

const _CN_DIGIT = { 零:0, 一:1, 二:2, 兩:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9 };
// 中文數字→阿拉伯，只轉「數字＋單位」的組合（避免「一下」「一定」被誤改成「1下」）
// ── 數字寫法：意思相同就要判得一樣（2026-09-19 使用者：「重點是意思相同」）──────────────
// 語音辨識同一句話，有時寫「三本」有時寫「3本」、有時「一百九十乘二十」有時「190×20」。
// 學生的話、標準句、關鍵字都先經過這裡換成同一種寫法（阿拉伯數字＋中文字），再比對。
//
// 國字數字轉成阿拉伯數字的三種情況：
//   ①後面接量詞：_CN_UNIT_ALWAYS（原本就有的）連單獨的「一」也轉；_CN_UNIT_NOT_ONE（2026-09-19 補的）單獨的「一」不轉——
//     「差一點、再說一次、有一天、一樣、下一步」不是數量；「點一份蛋餅」「一杯珍珠奶茶」的「一」只是「一個」的意思，
//     轉成 1 會讓困難模式要求學生一定要講出來（全站不變式會擋：「給我蛋餅」變成判錯）。
//   ②沒有量詞、但一看就是數字：有數字字又有「十百千萬」（一百九十、二十、一千、三千八百），或「十五」這種。
//     單獨的「十」「百」「千」不轉——「十分感謝」「百貨公司」「千萬不要」不是數字。
//   ③三個以上的數字字連在一起（一六五、一一零、一零一＝專線或編號）；兩個的不轉——「下週六一定到」的「六一」不是 61。
// legacyOnly＝只做①的原本量詞：困難模式 ②(a) 從**任務**找「必答數字」時用，維持舊判準——
//   任務的國字數量多半是情境描述（「算算看：三顆蘋果總共多少錢」要的是 105 元，「3 顆」講不講都行）。
// 另外統一的寫法（legacyOnly 時不做）：10萬＝100000、190×20＝190乘20、3:00＝3點、3:30＝3點半。
const _CN_UNIT_ALWAYS = '元個塊張枚圓位人';
const _CN_UNIT_NOT_ONE = '本杯份站件盒部包瓶支條顆罐袋款號折週排碗雙隻把串片台點次天樣種步班';
const _CN_UNIT_MULTI = ['小時', '分鐘', '公分', '公斤', '公尺'];
const _CN_RUN_RE = /[一二兩三四五六七八九十百千萬零]+/g;
function _cnUnitAt(after) {
  if (_CN_UNIT_MULTI.some(u => after.startsWith(u))) return 'notOne';
  const ch = after[0] || '';
  if (ch && _CN_UNIT_ALWAYS.includes(ch)) return 'always';
  if (ch && _CN_UNIT_NOT_ONE.includes(ch)) return 'notOne';
  return null;
}
function cnNumToArabic(s, legacyOnly) {
  // 單位含「圓」：學生說「十圓」時先轉成「10圓」，才輪得到 normalizePronunciation 把它正規化成「10元」
  // 單位含「位／人」：訂位步驟的正解是「四個人」，學生說「四位」要能對得上（漏了會判 failed）
  let out = String(s || '').replace(_CN_RUN_RE, (m, off, str) => {
    const unit = _cnUnitAt(str.slice(off + m.length));
    if (/^零|零$/.test(m) && !/^[零一二三四五六七八九]{3,}$/.test(m)) return m;   // 「零錢」「零用錢」不是數字
    if (/^萬/.test(m)) return m;   // 「萬一」不是數字；「10萬」的萬交給下面的阿拉伯數字＋萬
    if (unit) {
      if (legacyOnly && unit !== 'always') return m;
      if (m === '一' && unit === 'notOne') return m;
      const n = _cnInt(m);
      return n === null ? m : String(n);   // 看不懂的寫法原樣退回：寧可不轉也不要轉錯
    }
    if (legacyOnly) return m;
    if (/^[零一二三四五六七八九]{3,}$/.test(m)) return [...m].map(c => _CN_DIGIT[c]).join('');
    if ((/[一二兩三四五六七八九]/.test(m) && /[十百千萬]/.test(m)) || /^十[一二三四五六七八九]$/.test(m)) {
      const n = _cnInt(m);
      return n === null ? m : String(n);
    }
    return m;
  });
  if (legacyOnly) return out;
  return out
    // 反方向：_CN_UNIT_NOT_ONE 前面單獨的「1」寫回「一」——辨識成「1杯20元」「再說1次」「哪1天」時，
    //   跟「一杯」「再說一次」「哪一天」才會是同一種寫法（「11杯」「21天」不動）
    .replace(new RegExp(`(^|[^\\d])1(?=[${_CN_UNIT_NOT_ONE}]|${_CN_UNIT_MULTI.join('|')})`, 'g'), '$1一')
    .replace(/(\d+)萬(?!\d)/g, (_m, n) => String(+n * 10000))            // 10萬 ＝ 100000
    .replace(/(\d)\s*[×xX*＊]\s*(?=\d)/g, '$1乘')                         // 190×20 ＝ 190乘20
    .replace(/(\d)\s*[+＋]\s*(?=\d)/g, '$1加')
    .replace(/(^|[^\d])(\d{1,2})[:：]00(?!\d)/g, '$1$2點')                  // 3:00 ＝ 3點
    .replace(/(^|[^\d])(\d{1,2})[:：]30(?!\d)/g, '$1$2點半')                // 3:30 ＝ 3點半
    .replace(/(^|[^\d])(\d{1,2})[:：](\d{2})(?!\d)/g, '$1$2點$3分');
}
// 國字整數：十五、兩百、一百零五、一千零五十、三千八百、十萬、兩萬五；口語省略尾巴的「一百五」＝150、「三千八」＝3800
function _cnInt(m) {
  const w = m.indexOf('萬');
  if (w >= 0) {
    if (m.indexOf('萬', w + 1) >= 0) return null;
    const hi = w === 0 ? 1 : _cnInt(m.slice(0, w));
    const loStr = m.slice(w + 1);
    const lo = !loStr ? 0 : /^[一二兩三四五六七八九]$/.test(loStr) ? _CN_DIGIT[loStr] * 1000 : _cnInt(loStr);
    return hi === null || lo === null ? null : hi * 10000 + lo;
  }
  const UNIT = { 十: 10, 百: 100, 千: 1000 };
  let total = 0, cur = null, last = Infinity, zero = false;
  for (const ch of m) {
    if (ch === '零') { zero = true; continue; }
    if (_CN_DIGIT[ch] !== undefined) { if (cur !== null) return null; cur = _CN_DIGIT[ch]; continue; }
    const u = UNIT[ch];
    if (!u || u >= last) return null;
    total += (cur === null ? 1 : cur) * u;
    cur = null; last = u; zero = false;
  }
  if (cur !== null) total += (!zero && last !== Infinity && last >= 100) ? cur * last / 10 : cur;
  return total;
}
// 數字中間的連字號拿掉（2026-09-19）：語音辨識會把電話寫成「0912-345-678」，標準句是「0912345678」；
// 關鍵字「7-11」兩邊一樣變成「711」。只接「數字-數字」，破折號「——」與其他文字不動。
function _joinDigitDash(s) {
  return String(s).replace(/(\d)[-－‐–](?=\d)/g, '$1');
}
// 學生輸入與標準句都走這一套，兩邊必須對稱（否則標準句的「那裡」會對不上學生的「哪裡」）
function normHard(s, legacyNums) {
  return _joinDigitDash(normalizePronunciation(cnNumToArabic(s, legacyNums)))
    // ＿＝沒選學生時自我介紹句裡的名字空格（見 personalizeSituation），不算標準句要講的字
    .replace(/[！？。，、!?.,\s「」…＿]/g, '')
    .replace(/[啊呢吧喔唷囉嗎耶欸呀哦哩]+$/, '');
}
// ── ② 的金額：看錢的總數，不看字面數字（2026-09-18）─────────────────────
// 使用者實測：「我要拿一張 100 元換 10 個 10 元」判「講錯數字」——「一張」的 1 不在標準句裡。
// 全站 10 個遞錢的步驟說「我給你一張 100 元」也都判不算對；數零錢說「10 個 10 元，剛好 100 元」一樣。
// 逐字比數字的問題：錢一樣多、只是說法不同，就被當成講錯。改成把金額寫法換算成錢：
//   [K 個／張／枚] N 元 → 總數 K×N；K＝1 視同直接說 N 元（「一張 100 元」＝「100 元」）。
// 規則（judgeHardSentence ②）：
//   · 必答數字：學生說的任一筆金額「總數」相同就算講到（「換 10 個 10 元」＝講到 100）
//   · 直接說 N 元：N 要出現在標準說法裡（同舊規則）
//   · 說 K 個 N 元：總數要跟某一句標準說法裡的金額一樣；那筆金額若指定了怎麼組（10 個 10 元），
//     面額也要一樣——「2 個 50 元」也是 100 元，但換不到販賣機要的 10 元硬幣，仍算錯
//   · 總數要跟這一步的故事對得上：只有一張 100 元的學生說「兩張 100 元換 20 個 10 元」仍算錯
//     （換得對，但跟故事對不上，對話接不下去；使用者 2026-09-18 定）
//   · 不是錢的數字（2 個漢堡、4 個人、12 號）照舊逐字比對
// 全站實測：2,995 句可接受說法、2,340 個干擾選項，判定一句都沒變（只會把被誤判的說法變對）。
const _MONEY_RE = /(?:(\d+)(個|張|枚))?(\d+)元/g;
function _moneyOf(t) {
  const out = [];
  for (const m of String(t).matchAll(_MONEY_RE)) {
    const k = m[1] ? +m[1] : null, n = +m[3];
    const combo = k !== null && k !== 1;
    out.push({ text: m[0], k: combo ? k : null, n, total: combo ? k * n : n,
               from: m.index, to: m.index + m[0].length });
  }
  return out;
}
// 不屬於金額寫法的數字（數量、號碼、時間…），照舊逐字比對
function _nonMoneyNums(t, money) {
  const out = [];
  for (const m of String(t).matchAll(/\d+/g))
    if (!money.some(x => m.index >= x.from && m.index < x.to)) out.push(m[0]);
  return out;
}
// ── ③ 分段比對（2026-09-17）─────────────────────────────────────────
// 標準答案拆成「段落」＝標點分開的句子＋句子頭尾的稱呼／禮貌語（拆法唯一定義在 js/step_rules.js 的
// speechParts，任務說明檢查也用同一支）。**每段裡的字要照順序，段與段之間順序不限。**
// 為什麼：「不好意思老闆，可以幫我換零錢嗎」「謝謝，不用了」這種換位置在口語上完全正確，
// 整句依序比對卻會把換了位置的字扣掉——全站實測 1,264 種換位置說法有 478 種被判不算對。
// 為什麼不乾脆不看順序：段內的順序有意義（「我給你」≠「你給我」），也要擋得住字亂排。
// 與整句比對取高者，所以只會讓換位置的說法變對，不會讓原本判對的變錯。
// 規則檔沒載到（StepRules 不存在）時退回整句比對，不會壞。
const _stepRules = () => (typeof StepRules !== 'undefined' ? StepRules : null);
// 從 t 裡還沒用過的字挑出與 c 的最長共同子序列，並把用到的字標記起來（同一個字不能算給兩段）
function _lcsTake(t, used, c) {
  const idx = [];
  for (let i = 0; i < t.length; i++) if (!used[i]) idx.push(i);
  const n = idx.length, m = c.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
    dp[i][j] = t[idx[i - 1]] === c[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  let i = n, j = m, k = 0;
  while (i > 0 && j > 0) {
    if (t[idx[i - 1]] === c[j - 1]) { used[idx[i - 1]] = 1; k++; i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--;
  }
  return k;
}
function _segmentCoverage(t, p) {
  const sr = _stepRules();
  if (!sr) return 0;
  const segs = sr.speechParts(p).map(x => normHard(x.text)).filter(Boolean).sort((a, b) => b.length - a.length);
  const total = segs.reduce((s, c) => s + c.length, 0);
  if (!total) return 0;
  const used = new Uint8Array(t.length);
  let got = 0;
  for (const c of segs) got += _lcsTake(t, used, c);
  return got / total;
}
// 句首的稱呼／禮貌語先剝掉再判斷否定：「不好意思，我要買巧克力」的「不」不是拒絕
function _stripLeadingPolite(t) {
  const sr = _stepRules();
  if (!sr) return t;
  let s = t, moved = true;
  while (s && moved) {
    moved = false;
    for (const w of sr.MOVABLE_CHUNKS) if (s.startsWith(w)) { s = s.slice(w.length); moved = true; break; }
  }
  return s;
}
// 最長共同子序列長度（字元層級）
function _lcsLen(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}
// 關鍵字的比對形式。cnNumToArabic 只在「數字後面接單位」時才轉換，所以裸的中文數字關鍵字
// （「一百」「二十」「四」）永遠轉不了，而學生話裡的「一百元」早就變成「100元」——兩邊永遠對不上。
// 補上單位再轉一次、砍掉補的單位，就得到可比對的阿拉伯數字形式。非數字關鍵字不受影響（結果相同）。
function _kwForms(k) {
  const a = normHard(k);
  const b = normHard(k + '元').replace(/元$/, '');
  return b && b !== a ? [a, b] : [a];
}

// ── 簡單／普通的關鍵字比對（2026-09-18）──────────────────────────────
// 原文比不到時，再用「去標點、國字數字轉阿拉伯數字」的形式比一次——**只會多認、不會少認**。
// 起因（使用者實測）：換零錢「告訴老闆你要換成 10 個 10 元」，學生說「10 個 10 元」，
// 語音辨識寫成「10個，10元。」，關鍵字「10個10元」被逗號隔開就比不到；辨識也可能寫成「十個十元」。
// ⚠️ 關鍵字這邊**不剝句尾語助詞**（困難模式的 normHard 會剝）：「好嗎」「哈囉」「謝囉」「可以試嗎」
//    剝掉就變成「好」「哈」「謝」，會大量誤判。所以另寫 normKw，數字轉換仍用同一支 cnNumToArabic。
function normKw(s) {
  return _moneyUnitToYuan(_joinDigitDash(cnNumToArabic(String(s))).replace(/[！？。，、!?.,\s「」…]/g, ''));
}
function kwHit(text, kw) {
  if (!kw) return false;
  if (text.includes(kw)) return true;
  const t = normKw(text);
  const a = normKw(kw);
  const b = normKw(kw + '元').replace(/元$/, '');   // 裸國字數字關鍵字（「一百」）補單位才轉得動，同 _kwForms
  return (!!a && t.includes(a)) || (!!b && b !== a && t.includes(b)) || _bareMoneyHit(t, a);
}
function ruleEvaluate(input, step) {
  const text = String(input).trim();
  const kws = step.keywords || [];
  const detected = kws.filter(kw => kwHit(text, kw));
  if ((step.keywords_mode || 'all') === 'any') {
    if (detected.length > 0) return { score: 'perfect', detected };
    return { score: 'failed', detected: [] };
  }
  if (detected.length >= kws.length) return { score: 'perfect', detected };
  if (detected.length > 0)            return { score: 'partial',  detected };
  return { score: 'failed', detected: [] };
}
function judgeHardSentence(text, step) {
  const t = normHard(text);
  if (!t) return { score: 'failed', detected: [] };
  // ① 關鍵詞（整組任一命中）
  const kws = (step.keywords || []).flatMap(_kwForms).filter(Boolean);
  if (kws.length && !kws.some(k => t.includes(k) || _bareMoneyHit(t, k))) return { score: 'failed', detected: [] };
  // 這一步的標準句集合：正解 + accepted_phrases + failed 回饋裡的示範句（②③ 共用）
  const answer = step.options?.[0] || '';
  const demo = (step.feedback?.failed || '').match(/「([^」]+)」/)?.[1];
  const accepts = [...(step.accepted_phrases || []), answer, demo].filter(Boolean);
  // ② 數字，兩條各司其職：
  //   (a) 必講　**任務敘述與正解都出現**的數字。任務是螢幕上給學生看的指示（要求他講的東西
  //       得先講給他聽），正解是實際要說的話——只取交集，才不會把任務裡的情境說明也算成必答：
  //       「請老闆幫你把 100 元換成零錢」的 100 沒出現在正解「可以幫我換零錢嗎？」裡，就不強求。
  //       不變式：正解自己永遠通過（交集必為正解的子集）。
  //   (b) 不得講錯　學生說出的數字必須出現在標準句集合裡，否則就是講錯內容（金額尤其）。
  //   金額兩條都看錢的總數，不看字面數字（見上方 _moneyOf）。
  const said = _moneyOf(t);
  const saidTotals = new Set(said.map(m => String(m.total)));
  const inAnswer = new Set(normHard(answer).match(/\d+/g) || []);
  const missing = [...new Set(normHard(step.task || '', true).match(/\d+/g) || [])]
    .filter(n => inAnswer.has(n) && !t.includes(n) && !saidTotals.has(n));
  if (missing.length) return { score: 'failed', detected: [], missingNums: missing };
  const allowed = new Set(accepts.flatMap(p => normHard(p).match(/\d+/g) || []));
  if (allowed.size) {
    const facts = accepts.flatMap(p => _moneyOf(normHard(p)));
    const wrong = [];
    for (const m of said) {
      if (m.k === null) { if (!allowed.has(String(m.n))) wrong.push(m.text); continue; }
      const same = facts.filter(f => f.total === m.total);
      const combos = same.filter(f => f.k !== null);
      if (!same.length || (combos.length && !combos.some(f => f.n === m.n))) wrong.push(m.text);
    }
    for (const n of _nonMoneyNums(t, said)) if (!allowed.has(n)) wrong.push(n);
    if (wrong.length) return { score: 'failed', detected: [], wrongNums: [...new Set(wrong)] };
  }
  // ②之二 否定意圖：學生明說「我不知道／我不要／我沒有要…」，卻因為句子裡含著標準句的字
  //   而拿到高完整度（③ 的 LCS 只看「標準句被覆蓋多少」，學生多講的字不扣分）。
  //   例：任務「告訴店員你要買巧克力」，學生說「我不知道要買什麼」——沒完成任務卻 100%。
  // ⚠️ **標準句自己就是否定句的步驟不套用**（藥局「我沒有過敏」、「我不要袋子」、
  //   婉拒類的「不用了，謝謝」）——那些步驟的任務本來就是講否定，否則會誤傷正解。
  // ⚠️ 2026-09-17 兩處修正（原本只看「整句是不是不／沒開頭」）：
  //   (a) 學生句首的稱呼／禮貌語先剝掉——「不好意思，我要買巧克力」以前被當成拒絕，
  //       全站在正解前面加「不好意思／對不起」有 57% 判不算對
  //   (b) 「標準句是否定句」改看**內容段**開頭——「不好意思，我的錢不夠」以前因為開頭是「不」
  //       就讓整步都不查否定，學生說「我不知道」也放行
  const NEG_START = /^我?(不|沒)/;
  const sr = _stepRules();
  const negAnswer = p => sr
    ? sr.speechParts(p).some(x => x.kind === 'content' && NEG_START.test(normHard(x.text)))
    : NEG_START.test(normHard(p));
  if (NEG_START.test(_stripLeadingPolite(t)) && !accepts.some(negAnswer)) {
    return { score: 'partial', detected: [], negated: true };
  }
  // ③ 完整度（取最相近的標準句；整句依序比對與分段比對取高者，見上方 _segmentCoverage）
  let coverage = 0;
  for (const p of accepts) {
    const np = normHard(p);
    if (np.length) coverage = Math.max(coverage, _lcsLen(t, np) / np.length, _segmentCoverage(t, p));
  }
  return { score: coverage >= HARD_COVERAGE ? 'perfect' : 'partial', detected: [], coverage };
}

// ─── 語音輸入（Web Speech API）──────────────────────

class SpeechRecognizer {
  constructor() {
    const API = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!API) { this.supported = false; return; }
    this.supported  = true;
    this._listening = false;  // 目前是否要接受辨識結果
    this._running   = false;  // rec.start() 之後、onend 之前（＝麥克風開著）
    this._onResult = null;
    this._onError  = null;
    this._onEnd    = null;

    this.rec = new API();
    this.rec.lang           = 'zh-TW';
    // continuous：讓學生把話慢慢說完，不會因為中間停頓就被判定講完（特教學生反應慢）。
    // ⚠️ 但 session 只活在「按下麥克風 → 收到結果」這段，見 start() / _release()。
    this.rec.continuous     = true;
    this.rec.interimResults = false;

    // 內部 handler：只在 _listening 旗標為 true 時才回傳結果
    this.rec.onresult = (e) => {
      if (!this._listening) return;
      const last = e.results[e.results.length - 1];
      if (!last.isFinal) return;
      const text = last[0].transcript;
      this._release();          // 先關麥克風再回呼——接下來就要播店員語音了
      this._onResult?.(text);
      this._onEnd?.();
    };
    this.rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (!this._listening) return;
      this._release();
      this._onError?.(e.error);
    };
    this.rec.onend = () => {
      this._running = false;
      if (this._listening) {    // 沒收到結果就結束（逾時、被系統中斷）
        this._listening = false;
        this._onEnd?.();
      }
    };
  }

  // 進練習頁時呼叫一次：**只拿麥克風授權，不啟動辨識**。
  // 🔴 Android 定則（2026-09-05 實機回報）：辨識 session 活著就等於麥克風開著，
  //    系統會一直握著音訊焦點，店員語音被壓住播不出來；而 continuous 模式在 Android
  //    會頻繁 onend，舊版在 onend 裡自動 rec.start() 重開，於是每重開一次就響一次
  //    系統的「噔噔噔」提示音（那是 Android 自己的音，網頁關不掉，只能少開幾次）。
  //    所以麥克風改成「按下才開、收到結果就關」。
  async beginSession() {
    if (!this.supported) return;
    // 先問一次授權，之後 rec.start() 就不會再跳系統提示
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      } catch (_) {}
    }
  }

  // 離開練習頁：確保麥克風不會留在開著的狀態
  endSession() { this._release(); }

  // 關麥克風並停止接受結果。abort() 會觸發 onend，但那時 _listening 已是 false，
  // 不會誤觸 _onEnd（否則畫面會以為「學生沒說話」而跳回饋）。
  _release() {
    this._listening = false;
    if (!this.supported || !this._running) return;
    this._running = false;
    try { this.rec.abort(); } catch (_) {}
  }

  // 按下麥克風按鈕：開麥克風並設定本次要接受的 callback
  start(onResult, onError, onEnd) {
    if (!this.supported) { onError('not-supported'); return; }
    this._onResult  = onResult;
    this._onError   = onError;
    this._onEnd     = onEnd;
    this._listening = true;
    // 每次都是全新的 session，緩衝天生是空的——不必再像常駐時那樣 abort 清掉
    // 「喇叭播出的店員語音被收進去、按下後當成學生說的話」（呼叫端另有 isPromptEcho 把關）。
    try { this.rec.start(); this._running = true; }
    catch (_) {
      if (this._running) return;      // 已經在跑（連點兩下）→ 沿用現有 session
      this._listening = false;
      onError('start-failed');
    }
  }

  // 放開麥克風按鈕：停止聆聽並關掉麥克風
  stop() { this._release(); }

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
  // 語音角色目錄：**一支語音＝一個角色**（keyword＝聲音鍵、name＝顯示名、gender、image、role）。
  // ⚠️ `keyword` 是聲音鍵，改顯示名時不要動它。
  // ⚠️ 這份表同時被 `tools/gen_home_catalog.js` 用 `const VOICE_INFO = [...]` 正則抽去產主頁快照
  //    （它用 new Function 執行整段，所以**加欄位不會壞**，但陣列的起訖格式不要動）。
  // `engineHint`：這個角色配的是哪一版音色（online＝Edge 雲端、local＝系統本機、google＝Google TTS、
  //    any＝都可以）。程式推導不出來，所以記在這裡；畫面上的引擎標籤仍以實際語音為準。
  // 「有沒有角色圖」不另設欄位——真相是檔案在不在，圖缺了 onerror 會退回泛用頭像（多存一份會不同步）。
  { keyword: 'Yating',      name: '小美', gender: 'female', isDefault: true, engineHint: 'local',  image: 'images/clerk-yating.jpg',     role: '便利商店' },
  { keyword: 'Zhiwei',      name: '阿豪', gender: 'male',                    engineHint: 'local',  image: 'images/clerk-zhiwei.jpg',     role: '速食店' },
  { keyword: '曉臻',        name: '阿芬', gender: 'female',                  engineHint: 'online', image: 'images/clerk-xiaozheng.jpg',  role: '超市' },
  { keyword: '雲哲',        name: '阿宏', gender: 'male',                    engineHint: 'online', image: 'images/clerk-yunzhe.jpg',     role: '文具店' },
  { keyword: '曉雨',        name: '小雅', gender: 'female',                  engineHint: 'online', image: 'images/clerk-xiaoyu.jpg',     role: '服飾店' },
  // Chrome 上只有這三支（實機盤點）；最後一條是總括後備，比對順序由上而下
  { keyword: 'Google 國語',   name: 'Google', persona: 'neutral',            engineHint: 'google', role: 'zh-TW 合成語音' },
  { keyword: 'Google 普通话', name: 'Google', persona: 'neutral',            engineHint: 'google', role: 'zh-CN 合成語音' },
  { keyword: 'Google 粤語',   name: 'Google', persona: 'neutral',            engineHint: 'google', role: 'zh-HK 合成語音' },
  { keyword: 'Google',        name: 'Google', persona: 'neutral',            engineHint: 'google', role: '合成語音' },
  { keyword: '晓晓',        name: '阿香', gender: 'female',                  engineHint: 'online', image: 'images/clerk-xiaoxiao.png',   role: '早餐店' },
  { keyword: '云希',        name: '阿財', gender: 'male',                    engineHint: 'online', image: 'images/clerk-yunxi.jpg',      role: '夜市' },
  { keyword: '云健',        name: '阿祥', gender: 'male',                    engineHint: 'online', image: 'images/clerk-yunjian.png',    role: '超市' },
  { keyword: '晓伊',        name: '淑惠', gender: 'female',                  engineHint: 'online', image: 'images/clerk-xiaoyi.jpg',     role: '藥局' },
  { keyword: '云扬',        name: '阿義', gender: 'male',                    engineHint: 'online', image: 'images/clerk-yunyang.jpg',    role: '早餐店' },
  { keyword: '晓辰',        name: '阿柔', gender: 'female',                  engineHint: 'online', image: 'images/clerk-bakery.png',     role: '麵包店' },
  { keyword: '晓梦',        name: '萱萱', gender: 'female',                  engineHint: 'online', image: 'images/clerk-beauty.png',     role: '美妝雜貨店' },
  { keyword: '晓睿',        name: '小茜', gender: 'female',                  engineHint: 'online', image: 'images/clerk-drink.png',      role: '手搖飲料店' },
  { keyword: '云枫',        name: '老王', gender: 'male',                    engineHint: 'online', image: 'images/clerk-lunchbox.png',   role: '便當店' },
  { keyword: '云野',        name: '阿澄', gender: 'male',                    engineHint: 'online', image: 'images/clerk-coffee.png',     role: '咖啡店' },
  { keyword: '晓涵',        name: '阿珍', gender: 'female',                  engineHint: 'online', image: 'images/clerk-postoffice.png', role: '郵局櫃臺' },
  { keyword: '晓墨',        name: '靜姐', gender: 'female',                  engineHint: 'online', image: 'images/clerk-library.png',    role: '圖書館' },
  { keyword: '云泽',        name: '阿凱', gender: 'male',                    engineHint: 'online', image: 'images/clerk-police.png',     role: '警察局' },

  // ── 2026-08-18 依**實機盤點**修正（來源：docs/語音盤點_各瀏覽器.md）──
  // 這些音色**不綁任何內建場所**，老師只是拿它們當自訂情境的聲音，所以不給職業角色，
  // 而是依「這支聲音聽起來像誰」對應到一張**通用形象**（見上方 VOICE_PERSONAS）：
  // 同一種語音性質共用一張圖，換性別判定只要改 persona，不必重生圖。
  // ⚠️ 先前憑微軟文件猜的 晓秋／晓双／晓萱／晓颜／晓悠／晓甄／云皓 七支，**實機 Edge 上根本不存在**，
  //    已全部移除——這就是計畫 C-4 ① 要求「先盤點再生成」的原因。
  // ⚠️ persona 目前只是依名稱與語系推定，**還沒逐支用耳朵確認**（云希掛 Male 但 F0 比女聲高、
  //    云夏是卡通童聲，都是前車之鑑）。要修正只改這一欄，不必重生圖。
  { keyword: '晓北', persona: 'female_adult',  engineHint: 'online', role: 'zh-CN 東北官話・女聲' },
  { keyword: '晓妮', persona: 'female_adult',  engineHint: 'online', role: 'zh-CN 陝西官話・女聲' },
  { keyword: '云夏', persona: 'boy',           engineHint: 'online', role: 'zh-CN 童聲' },
  { keyword: '曉佳', persona: 'female_adult',  engineHint: 'online', role: 'zh-HK 粵語・女聲' },
  { keyword: '曉曼', persona: 'female_adult',  engineHint: 'online', role: 'zh-HK 粵語・女聲' },
  { keyword: '雲龍', persona: 'male_mature',   engineHint: 'online', role: 'zh-HK 粵語・男聲' },
  { keyword: 'Hanhan', persona: 'female_adult', engineHint: 'local', role: 'zh-TW 本機・女聲' },

];

// ─── 通用形象庫（依「語音性質」而不是職業）──────────────────
// 為什麼不給每支語音一個職業角色：這些音色沒有綁場所，老師的情境可能是合作社、診所批價、
// 導師談話……任何場所。**硬規定：不能有任何場所識別特徵**（延續 GENERIC_CLERKS 小雯／小宇的
// 二版原則：素色 T 恤＋牛仔褲、單一純色背景、無制服無道具，見 docs/clerk-avatar-prompts.md）。
// 好處：同一種語音性質共用一張圖，之後用耳朵修正某支語音的性別／年齡感，只要改它的 persona。
const VOICE_PERSONAS = {
  // age 給 AI 提示詞用：小孩的聲音不該被寫成老闆娘、店員
  female_adult:  { name: '女生（大人）', gender: 'female',  age: 'adult',  image: 'images/clerk-generic-female.jpg' },
  male_adult:    { name: '男生（大人）', gender: 'male',    age: 'adult',  image: 'images/clerk-generic-male.jpg' },
  female_mature: { name: '女生（成熟）', gender: 'female',  age: 'mature', image: 'images/voice-roles/female-mature.png' },
  male_mature:   { name: '男生（成熟）', gender: 'male',    age: 'mature', image: 'images/voice-roles/male-mature.png' },
  girl:          { name: '女生（小孩）', gender: 'female',  age: 'child',  image: 'images/voice-roles/girl.png' },
  boy:           { name: '男生（小孩）', gender: 'male',    age: 'child',  image: 'images/voice-roles/boy.png' },
  neutral:       { name: '中性聲音',     gender: 'neutral', age: 'adult',  image: 'images/voice-roles/neutral.png' },
};

// VOICE_INFO 的一筆 → 補上 persona 的顯示資訊（條目自己寫的欄位優先）。
// 讀 VOICE_INFO 的地方一律經過這裡，才不會有的地方看得到形象、有的地方看不到。
function expandVoiceRole(entry) {
  if (!entry) return null;
  const p = entry.persona ? VOICE_PERSONAS[entry.persona] : null;
  if (!p) return entry;
  return { ...entry, name: entry.name || p.name, gender: entry.gender || p.gender, image: entry.image || p.image };
}

// **自訂情境專用**：任何語音都對應到一張通用形象，**絕不用 42 場所的店員圖**。
// 為什麼：那些圖綁死了場所（曉臻＝超市阿芬、曉雨＝服飾店小雅…），老師的情境可能是
// 合作社、診所批價、導師談話……用場所店員圖等於把情境綁進那家店——這正是
// clerk-generic 二版拿掉圍裙與木質櫃檯的同一個理由。
// 對應順序：目錄裡標的 persona → 目錄裡的性別 → 音色名單判性別 → 中性。
function voicePersonaFor(voiceName) {
  const entry = VOICE_INFO.find(i => String(voiceName || '').includes(i.keyword));
  if (entry?.persona && VOICE_PERSONAS[entry.persona]) return VOICE_PERSONAS[entry.persona];
  const g = entry?.gender || voiceGenderOf({ name: String(voiceName || '') });
  if (g === 'male')   return VOICE_PERSONAS.male_adult;
  if (g === 'female') return VOICE_PERSONAS.female_adult;
  return VOICE_PERSONAS.neutral;
}

// keyword 比對（＝聲音鍵）：語音名稱含哪個 keyword 就是哪個角色
function voiceRoleFor(voiceName) {
  const n = String(voiceName || '');
  return expandVoiceRole(VOICE_INFO.find(i => n.includes(i.keyword)) || null);
}

const GENDER_AVATAR = { female: '👩', male: '👨', neutral: '🧑' };

// 教師自訂情境用的「泛用店員」（2026-08-02）。內建 42 場景各有專屬角色（SCENARIO_CLERK_MAP），
// 自訂情境沒有，過去只能顯示 emoji。這兩張圖刻意不帶任何店家識別特徵（素色 T 恤＋牛仔褲），
// 因為老師的情境可能是合作社、福利社、診所批價……任何場所。場景圖同理，男女共用一張。
// 姓名（2026-08-02 由「店員姊姊／店員哥哥」改真人名）：已核對過與全站 42 場景配角＋4 位學生
// 共 44 個既有角色名不重複（見 dialogue/docs/clerk-avatar-prompts.md 的核對紀錄）。
const GENERIC_CLERKS = {
  female: { key: 'female', name: '小雯', gender: 'female', image: 'images/clerk-generic-female.jpg' },
  male:   { key: 'male',   name: '小宇', gender: 'male',   image: 'images/clerk-generic-male.jpg' },
};
const CUSTOM_SCENE_IMAGE = 'images/scenes/custom.webp';

// 自訂情境的對話角色形象。優先序：
//   ① 老師指定的語音若有專屬角色圖 → 用那個角色（C-3：一支語音＝一個角色，形象與聲音一致）
//   ② 否則用泛用角色小雯／小宇（舊資料沒有 clerkGender 這欄 → 預設女生，與過去 emoji 的預設一致）
// ⚠️ 老師上傳的場景照片仍然蓋在最上層（見 renderStep），這裡只決定「沒有照片時顯示誰」。
function getCustomClerk(scenario) {
  const ref = scenario?.role?.voiceRef;
  if (ref?.name) {
    const p = voicePersonaFor(ref.name);
    return { key: ref.name, name: p.name, gender: p.gender, image: p.image };
  }
  return GENERIC_CLERKS[scenario?.clerkGender] || GENERIC_CLERKS.female;
}

// voiceRef → 語音角色目錄裡的那個角色（找不到回 null）。
// 比對走 keyword（＝聲音鍵），與 voiceManager.getInfo 同一套規則。
function voiceRoleOf(ref) {
  return ref?.name ? voiceRoleFor(ref.name) : null;
}

// 場所 → 店員對應（含開場介紹詞）
const SCENARIO_CLERK_MAP = {
  convenience_store: { keyword: 'Yating', intro: '你好！我是便利商店的店員小美。在這裡你可以練習詢問商品在哪裡、結帳付款，還有找零錯誤時怎麼說。點卡片就可以開始練習囉！' },
  breakfast_shop:    { keyword: '晓晓',   intro: '早安！我是早餐店的店員。在這裡你可以練習點餐、詢問今日招牌，還有等太久時怎麼有禮貌地開口問。' },
  supermarket:       { keyword: '曉臻',   intro: '你好！我是超市的服務人員阿芬。在這裡你可以練習找商品、請人幫忙秤重，還有錢不夠或商品有問題時怎麼應對。' },
  night_market:      { keyword: '云希',   intro: '嗨！我是夜市的攤販。在這裡你可以練習點飲料和小吃、問清楚價格，還有遇到問題時怎麼有禮貌地說。' },
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
  classmate_borrow:  { keyword: 'Zhiwei', name: '小傑', role: '同班同學', image: 'images/clerk-classmate.jpg', intro: '嗨！我是你的同學小傑。在這裡你可以練習同學跟你借錢時怎麼辦，包括怎麼好好拒絕、怎麼說清楚理由、請他去找老師幫忙，還有借出去的錢怎麼開口要回來。' },
  online_scam:       { keyword: '云枫', name: '阿睿', role: '網路安全老師', image: 'images/clerk-onlinescam.jpg', intro: '你好！我是網路安全老師阿睿。在這裡你可以練習在網路上遇到陌生人要你花錢時怎麼保護自己，像是假網拍叫你先匯款、中獎簡訊叫你點連結。記住：不先匯款、不點陌生連結、不給帳號密碼！' },
  self_protect:      { keyword: '曉臻', name: '安安', role: '金錢安全老師', image: 'images/clerk-selfprotect.jpg', intro: '你好！我是金錢安全老師安安。在這裡你可以練習怎麼主動保護自己的錢，像是被人勒索要錢怎麼辦、錢和密碼怎麼保管好、撿到別人的錢怎麼處理。' },
  job_scam:          { keyword: '云枫', name: '阿全', role: '打工防詐老師', image: 'images/clerk-jobguard.jpg', intro: '你好！我是打工防詐老師阿全。在這裡你可以練習找打工時怎麼保護自己，像是有人要你先繳保證金、押證件，或說有太好賺的工作。記住三不：不先繳錢、不押證件、不借帳戶！' },
  privacy_protect:   { keyword: '曉臻', name: '小薇', role: '資安老師', image: 'images/clerk-privacy.jpg', intro: '你好！我是資安老師小薇。在這裡你可以練習保護個人資料，像是驗證碼不唸給別人、問卷個資不亂填、帳號密碼不外借。記住：個資就像家裡的鑰匙，不能隨便交出去！' },
  take_bus:          { keyword: '云扬', name: '阿源', role: '公車', image: 'images/clerk-takebus.jpg', intro: '你好！我是公車司機阿源。在這裡你可以練習搭公車，包括先確認路線、上車刷卡或投現，還有零錢不夠、坐過站時怎麼開口求助。' },
  mrt_station:       { keyword: '曉臻', name: '阿潔', role: '捷運站', image: 'images/clerk-mrtstaff.jpg', intro: '你好！我是捷運站務員阿潔。在這裡你可以練習搭捷運，包括不會買票請人教、卡片刷不過去要加值、搭錯方向怎麼問。有問題找站務員就對了！' },
  train_ticket:      { keyword: '晓涵', name: '惠姐', role: '火車站售票口', image: 'images/clerk-trainticket.jpg', intro: '你好！我是火車站售票口的惠姐。在這裡你可以練習到售票口買票，包括說清楚目的地和車種、付錢確認找零、問月台，還有趕不上車、車票不見時怎麼辦。' },
  taxi:              { keyword: '雲哲', name: '陳伯', role: '計程車', image: 'images/clerk-taxi.jpg', intro: '你好！我是計程車司機陳伯。在這裡你可以練習搭計程車，包括上車前先問價錢確認預算、說清楚目的地、下車付錢確認找零，不舒服也要開口說。' },
  easycard_service:  { keyword: '晓梦', name: '小昀', role: '悠遊卡服務台', image: 'images/clerk-easycard.jpg', intro: '你好！我是悠遊卡服務台的小昀。在這裡你可以練習加值後確認餘額、卡片掉了趕快掛失、辦學生卡要帶什麼。' },
  ride_manner:       { keyword: '曉雨', name: '車長', role: '車廂禮儀', image: 'images/clerk-ridemanner.jpg', intro: '你好，我是車長，在這裡你可以練習車廂裡的禮儀與求助——像是讓座給需要的人、有禮貌請人幫忙，還有陌生人跟你要錢時，怎麼拒絕、找列車長幫忙。' },
  cinema:            { keyword: '雲哲', name: '阿哲', role: '電影院', image: 'images/clerk-cinema.jpg', intro: '你好！我是電影院服務員阿哲。在這裡你可以練習買電影票，包括選場次、用學生證買優惠票、加購前想想預算，遲到了也知道怎麼辦。' },
  ktv:               { keyword: '晓睿', name: '小雅', role: 'KTV', image: 'images/clerk-ktv.jpg', intro: '歡迎光臨！我是 KTV 服務員小雅。在這裡你可以練習問清楚計費、算總價大家分攤、時間到照預算收手，還有點歌機不會用怎麼請人教。' },
  swimming_pool:     { keyword: '晓晓', name: '小藍', role: '游泳池', image: 'images/clerk-pool.jpg', intro: '你好！我是游泳池的救生員小藍。在這裡你可以練習買學生票、租置物櫃認識押金、東西不見了到服務台找回來。' },
  amusement_park:    { keyword: '雲哲', name: '小樂', role: '遊樂園', image: 'images/clerk-park.jpg', intro: '歡迎光臨，我是遊樂園的工作人員小樂，在這裡你可以練習算一算哪種票划算、問設施安全限制，還有和朋友走散時找工作人員、在原地等。' },
  arcade:            { keyword: '雲哲', name: '阿翔', role: '電子遊樂場', image: 'images/clerk-arcade.jpg', intro: '歡迎光臨！我是遊樂場的店員阿翔。在這裡你可以練習換代幣控制預算、夾娃娃先設上限說到做到，機台吃錢不拍不踢找店員。' },
  comic_store:       { keyword: '晓墨', name: '小昕', role: '漫畫店', image: 'images/clerk-comic.jpg', intro: '歡迎光臨！我是漫畫店的店員小昕。在這裡你可以練習租書認識押金和逾期費、遲還了誠實道歉，還有分辨辦會員留哪些資料合理、哪些絕對不能給。' },
  job_interview:     { keyword: '云泽', name: '阿宏店長', role: '打工面試', image: 'images/clerk-jobinterview.jpg', intro: '你好！我是阿宏店長。在這裡你可以練習打工面試，包括自我介紹、誠實回答問題，還有問清楚時薪和發薪日；遇到要先繳錢的，記得先回家問大人喔！' },
  first_day:         { keyword: 'Zhiwei', name: '志豪', role: '第一天上班', image: 'images/clerk-firstday.jpg', intro: '嗨！我是帶你的學長志豪。在這裡你可以練習第一天報到，包括主動打招呼、聽工作說明複誦重點、問清楚制服和置物。' },
  ask_at_work:       { keyword: '云健', name: '陳師傅', role: '工作中求助', image: 'images/clerk-senior.jpg', intro: '你好！我是你的資深同事陳師傅。在這裡你可以練習工作中最重要的能力，像是聽不懂就問、做錯了主動承認、不會操作請人示範。' },
  call_leave:        { keyword: 'Yating', name: '林店長', role: '電話請假', image: 'images/clerk-callleave.jpg', intro: '你好！我是店裡的林店長。在這裡你可以練習打電話請假，包括生病提早說、臨時有事誠心道歉配合補班、要遲到先通知。' },
  get_paid:          { keyword: '晓涵', name: '秀琴阿姨', role: '領薪水', image: 'images/clerk-payday.jpg', intro: '你好！我是公司的會計秀琴阿姨。在這裡你可以練習領薪水，包括時薪乘時數自己算一次、當面點清楚、發現算錯有禮貌反映，最後別忘了先存一部分。' },
  serve_customer:    { keyword: '雲哲', name: '客人', role: '接待客人', image: 'images/clerk-customer.jpg', intro: '這次換你當店員囉！在這裡你可以練習接待客人，像是說歡迎光臨和謝謝光臨、被客人問倒了找懂的人、客人不高興先道歉再請主管。' },
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
    refreshVoiceInventories();
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
        refreshVoiceInventories();
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

  // 取得語音的顯示資訊（persona 會在這裡展開成 name/gender/image）
  getInfo(voice) {
    const info = voiceRoleFor(voice.name);
    if (info) return info;
    // 找不到就從完整名稱萃取簡稱（一律走 voiceShortName，簡→繁與去引擎字樣只有那一份定義）
    return { name: voiceShortName(voice.name), gender: 'neutral' };
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
    // 選擇存在 sp_studentVoiceIdx；畫面在情境設定頁（作答方式＝選擇對話時出現，renderUserVoiceSelector）
    this.selectedStudentIdx = this.loadIdx();
    const chosen = STUDENT_PROFILES[this.selectedStudentIdx];
    if (chosen) {
      const matched = all.find(v => v.name.includes(chosen.voiceKeyword));
      if (matched) this.selected = matched;
    }
  },

  STORE_KEY: 'sp_studentVoiceIdx',
  loadIdx() {
    const n = parseInt(localStorage.getItem(this.STORE_KEY), 10);
    return Number.isInteger(n) && n >= 0 && n < STUDENT_PROFILES.length ? n : 0;
  },
  saveIdx(idx) {
    this.selectedStudentIdx = idx;
    try { localStorage.setItem(this.STORE_KEY, String(idx)); } catch (e) {}
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

// ── 依角色性別挑語音（2026-08-02，自訂情境的泛用男/女店員用）──────────
// 為什麼要自己判性別：語音清單的 name 沒有性別欄位，SpeechSynthesisVoice 也不給。
// 只能靠「已知音色名單」比對——這與 voicegen/voice_ears.json 的原則一致：**性別只信耳朵**，
// 引擎回報的 gender 會標錯，所以這裡列的是實際聽過的音色。
// ⚠️ 男聲在多數裝置上是稀缺資源：Google 中文語音全族都是女聲、Windows 系統聲要另外裝
// zh-TW 語音套件才有 Zhiwei；Edge 才穩定有 Online 男聲。挑不到就回 null，由呼叫端決定退路。
// ⚠️ `yunxi(?!a)`：Yunxia（云夏）是卡通童聲、實測 311.7 Hz，不能被 `yunxi` 順手吃進來當男店員。
const MALE_VOICE_PAT   = /yunjhe|云哲|雲哲|zhiwei|智威|yunxi(?!a)|云希|yunjian|云健|yunyang|云扬|yunze|云泽|yunfeng|云枫|yunye|云野|kangkang|康康/i;
const FEMALE_VOICE_PAT = /yating|雅婷|hsiaochen|曉臻|hsiaoyu|曉雨|hsiaochi|曉琪|xiaoxiao|晓晓|xiaoyi|晓伊|xiaochen|晓辰|xiaomeng|晓梦|xiaorui|晓睿|xiaohan|晓涵|xiaomo|晓墨|hanhan|涵涵|huihui|慧慧|yaoyao|瑤瑤|google 國語|google 普通话/i;

function voiceGenderOf(v) {
  // ⚠️ 要走展開後的資料：只寫 persona 的條目本身沒有 gender 欄，
  //    直接讀 info.gender 會拿到 undefined（不是 'neutral'），畫面性別標籤就空掉了。
  const info = voiceRoleFor(v.name);
  if (info && info.gender && info.gender !== 'neutral') return info.gender;   // 專案已聽過確認的音色最優先
  if (MALE_VOICE_PAT.test(v.name))   return 'male';
  if (FEMALE_VOICE_PAT.test(v.name)) return 'female';
  return 'neutral';
}

// 實測夠低沉的男聲（F0：YunJhe 119.1、Yunjian 117.1、Yunyang 114.8 Hz）。
// 男聲不是有就好——同樣掛「Male」的 Yunxi 是 185.3 Hz，比女聲 Yating 的 175.8 還高，
// 拿來當店員會被學生聽成女生。所以挑男聲時「低沉的」優先於「同語系的」。
const DEEP_MALE_PAT = /yunjhe|云哲|雲哲|yunjian|云健|yunyang|云扬|yunze|云泽|yunfeng|云枫|yunye|云野/i;

// ⚠️ 這裡曾經有一整套「偵測指定失敗 → 記黑名單 → 換人重講」的機制，2026-08-02 全部移除。
// 移除原因（血淚）：那套機制自己製造假陽性並連鎖自我毀滅——
//   ① 在 u.onstart 比對「u.voice 是不是我指定的那支」來判斷成功與否，本身就不可靠；
//   ② 判定失敗後 cancel() 隔 30ms 立刻重講，Chromium 還在處理 cancel，
//      這時的 voice 設定又容易失效 → 換去的那支也被判定失敗 → 一路標到全部語音都「壞掉」；
//   ③ 全部壞掉後 preferVoice 變成 null，落回品質優先的預設挑選＝女聲，
//      於是男角色永遠用女聲說話，而畫面還信誓旦旦說「這台的男聲全部不能用」。
// 同一台電腦上，沒有這套機制的簡單實作（Downloads/voice-audition.html）從頭到尾正常。
// **定則：直接指定語音就好，不要自作聰明去驗證瀏覽器有沒有照做。**

// 該性別的最佳語音（音質優先）。挑完就直接用，不再驗證瀏覽器有沒有照做——見上方說明。
function bestVoiceByGender(gender) {
  const A    = voiceManager.all || [];
  const tw   = v => (v.lang || '').toLowerCase().includes('tw');
  const hiFi = v => /online|natural|google/i.test(v.name);
  const deep = v => DEEP_MALE_PAT.test(v.name);

  const match = A.filter(v => voiceGenderOf(v) === gender);

  // 🔴 使用者定則（2026-09-25）：Edge 上女角色一律「曉臻」、男角色一律「雲哲」（兩支都是 zh-TW 雲端）；
  //    其他瀏覽器以高品質語音優先，真的沒有才退回本機的女聲／男聲——下面的順序就是這條規則。
  const edgeFirst = gender === 'male' ? /yunjhe|雲哲/i : /hsiaochen|曉臻/i;
  const pinned = match.find(v => edgeFirst.test(v.name) && hiFi(v));
  if (pinned) return pinned;

  // 男聲：低沉＋高品質＋台灣腔最前（實測 F0：雲哲 119 Hz ＞ 系統音 Zhiwei 153.8 Hz）
  if (gender === 'male') {
    return match.find(v => deep(v) && hiFi(v) && tw(v))
        || match.find(v => deep(v) && hiFi(v))
        || match.find(deep)
        || match.find(v => hiFi(v) && tw(v))
        || match.find(tw)
        || match[0] || null;
  }
  return match.find(v => hiFi(v) && tw(v))
      || match.find(tw)
      || match.find(hiFi)
      || match[0] || null;
}

// 這台裝置有沒有該性別的中文語音（編輯器用來決定男店員能不能選）
function hasVoiceForGender(gender) { return !!bestVoiceByGender(gender); }


// ─── 老師指定的語音：存三件一組，換裝置時逐級退回（C-2）──────────────
// 存 `{ name, lang, voiceURI }` 而不是只存名字：`Microsoft Yating` 與
// `Microsoft Yating Online (Natural)` 在畫面上長得幾乎一樣，只存名字會挑錯版本。
// ⚠️ **退回幾級要如實回報**（只給老師看，練習畫面不顯示——學生不需要知道音源降級）。
// ⚠️ 挑好就直接指定，**不驗證瀏覽器有沒有照做**（見上方那段血淚說明）。

// 人聲基底名：把引擎與語系的差異洗掉，只留「這是誰的聲音」。
// Microsoft Yating Online (Natural) - Chinese (Taiwan) → yating
function voiceBaseName(name) {
  return String(name || '')
    .split(' - ')[0]
    .replace(/microsoft\s*/i, '')
    .replace(/\((natural[^)]*)\)/i, '')
    .replace(/\bonline\b/i, '')
    .replace(/[\s_]+/g, '')
    .toLowerCase();
}

// 語音名稱的簡→繁對照（**只影響畫面顯示**，2026-09-05）。
// 為什麼要轉：瀏覽器回傳的名字是微軟給的，zh-CN 那批一律是簡體（晓晓／云希／云扬…），
// 跟 zh-TW／zh-HK 的繁體名（曉臻／雲哲／曉曼）混在同一個下拉裡，老師看起來像兩套系統。
// 為什麼用「單字對照」而不是「每支語音一條」：微軟會增減語音，逐支列一定會漏
// （憑文件猜清單已經錯過一次，見 docs/語音盤點_各瀏覽器.md）；這些名字用的字很集中，
// 轉字元就能涵蓋還沒出現的新語音。
// 🔴 **絕對不能拿轉換後的名字去比對語音**：`voiceRef`／`VOICE_INFO.keyword`／`voiceBaseName`
//    都必須用瀏覽器給的原名，否則在老師的電腦上會挑不到語音（那台只認得「云希」）。
const VOICE_NAME_TC = {
  '晓':'曉', '云':'雲', '梦':'夢', '枫':'楓', '泽':'澤', '颜':'顏', '双':'雙', '龙':'龍',
  '静':'靜', '洁':'潔', '语':'語', '韵':'韻', '悦':'悅', '瑶':'瑤', '岚':'嵐', '阳':'陽',
  '兰':'蘭', '谦':'謙', '莹':'瑩', '丽':'麗', '华':'華', '宝':'寶', '贝':'貝', '风':'風',
  '辉':'輝', '锦':'錦', '钰':'鈺', '诗':'詩', '纯':'純', '园':'園', '远':'遠', '东':'東',
  '乐':'樂', '学':'學', '杰':'傑', '凤':'鳳', '凯':'凱', '伟':'偉', '军':'軍', '涛':'濤',
  '扬':'揚', '娅':'婭',
  // Google 那三支的名字帶語系描述（Google 普通话（中国大陆）／粤語（香港）），一起轉
  '话':'話', '国':'國', '陆':'陸', '粤':'粵', '简':'簡', '体':'體',
};
const toTraditionalVoiceName = s =>
  String(s || '').replace(/[\u4e00-\u9fff]/g, c => VOICE_NAME_TC[c] || c);

// 畫面顯示用的短名：Microsoft Yating Online (Natural) - Chinese (Taiwan) → Yating。
// 引擎（☁️/💻/🌐）與語系（zh-TW…）已經各自有標籤，名稱重複那些字只會在手機上佔三行。
// ⚠️ 完整名稱仍放進 title，老師要回報問題時才有完整識別資訊。
// ⚠️ 這裡的回傳值**只能拿來顯示**（名字已轉繁體），要比對語音請用原始 `v.name`。
function voiceShortName(v) {
  const n = String((v && v.name) || v || '');
  const short = n.split(' - ')[0]
          .replace(/^Microsoft\s+/i, '')
          .replace(/\s*Online\s*\(Natural[^)]*\)/i, '')
          .replace(/\s*\(Natural[^)]*\)/i, '')
          .trim() || n;
  // 結尾的地區括號（中國大陸）／（臺灣）／(Taiwan) 一律拿掉（2026-09-21 使用者指示）；語系仍有 zh-TW／zh-CN 標籤
  return toTraditionalVoiceName(short).replace(/\s*[（(][^）)]*[）)]\s*$/, '').trim();
}

const voiceLangTag = v => {
  const l = String(v?.lang || '').toLowerCase().replace('_', '-');
  if (l.includes('tw')) return 'zh-TW';
  if (l.includes('hk')) return 'zh-HK';
  if (l.includes('cn')) return 'zh-CN';
  return v?.lang || 'zh';
};

// 引擎三態：Google／雲端（Edge Online、Natural）／本機系統音。
// 兩支同名語音的差別就在這裡，畫面一定要標出來。
function voiceEngineTag(v) {
  const n = String(v?.name || '');
  if (/google/i.test(n)) return '🌐 Google';
  if (/online|natural/i.test(n)) return '☁️ 雲端';
  return '💻 本機';
}

function voiceRefOf(voice) {
  if (!voice) return null;
  return { name: voice.name, lang: voice.lang, voiceURI: voice.voiceURI || '' };
}

// 把存下來的 voiceRef 在這台找回語音。
// 回傳 { voice, status, wanted }；status＝none／exact／same-name／downgraded／missing
function resolveVoiceRef(ref, fallbackGender) {
  const all = voiceManager.all || [];
  if (!ref || !ref.name) return { voice: null, status: 'none', wanted: null };

  const exact = all.find(v => (ref.voiceURI && v.voiceURI === ref.voiceURI)
                           || (v.name === ref.name && v.lang === ref.lang));
  if (exact) return { voice: exact, status: 'exact', wanted: ref };

  const sameName = all.find(v => v.name === ref.name);
  if (sameName) return { voice: sameName, status: 'same-name', wanted: ref };

  // 同一個人聲的其他引擎版本（雲端 ⇄ 本機）：音質會不一樣，但至少還是同一個人
  const base = voiceBaseName(ref.name);
  const sameVoice = base && all.find(v => voiceBaseName(v.name) === base);
  if (sameVoice) return { voice: sameVoice, status: 'downgraded', wanted: ref };

  return { voice: bestVoiceByGender(fallbackGender || 'female'), status: 'missing', wanted: ref };
}

// ⚠️ Chromium 的坑（2026-08-02 由使用者的裝置診斷出來）：
// `getVoices()` 每次可能回傳**全新的物件實例**，而雲端 Online 語音是非同步載入的
// （那台 17 支語音裡有 14 支雲端）。頁面載入時存進 voiceManager.all 的物件，等到要唸的時候
// 早就跟引擎當下那批對不上，設給 `u.voice` 會被靜默忽略 → 一律用系統預設語音唸
// （那台就是女聲 Yating，所以男女店員聽起來完全一樣）。
// 開發機只有 3 支本機語音、一次載完，物件永遠有效，因此完全無法重現。
// 解法：真正要唸之前，用「名字」重新抓一次當下的物件。
function freshVoice(v) {
  if (!v || !window.speechSynthesis) return v;
  const all = window.speechSynthesis.getVoices();
  return all.find(x => x.name === v.name && x.lang === v.lang)
      || all.find(x => x.name === v.name)
      || v;
}

// ── file:// 開啟的限制（2026-08-02 實測確認）────────────────────────
// 直接雙擊 index.html 開啟時，**Chromium 會忽略 utterance.voice**：程式指定 Zhiwei（男），
// 瀏覽器照樣用系統預設語音（這台是 Yating 女聲）——於是男女店員聽起來一模一樣，
// 文字卻是對的，非常容易誤判成「程式挑錯聲音」。同一份程式用 localhost 開就完全正常。
// 麥克風在 file:// 也不是安全內容（🎤 說話模式直接不能用），所以一律提醒改用 start.bat。
function isFileProtocol() { return location.protocol === 'file:'; }

// 設定頁的版本資訊：程式版本、SW 實際在用的快取版本、開啟方式，三件事一次講清楚。
// 「改了卻沒生效」幾乎都是這三者其中之一出問題，與其猜，不如讓畫面直接說。
async function renderVersionInfo() {
  const el = document.getElementById('version-info');
  if (!el) return;

  let swVer = null;
  try {
    const ctrl = navigator.serviceWorker?.controller;
    if (ctrl) {
      swVer = await new Promise(resolve => {
        const ch = new MessageChannel();
        ch.port1.onmessage = e => resolve(e.data?.version || null);
        ctrl.postMessage({ type: 'GET_VERSION' }, [ch.port2]);
        setTimeout(() => resolve(null), 1500);   // 舊版 SW 不認得這個訊息，別卡住畫面
      });
    }
  } catch (_) {}

  const swShort = swVer ? swVer.replace('shopping-practice-', '') : null;
  const rows = [
    ['程式版本', APP_VERSION, null],
    ['快取版本', swShort || (isFileProtocol() ? '未啟用（檔案開啟時沒有）' : '未啟用'),
      (swShort && swShort !== APP_VERSION)
        ? '⚠️ 與程式版本不一致，請按 Ctrl+Shift+R 重新整理兩次' : null],
    ['開啟方式', isFileProtocol() ? '📁 直接開啟檔案（file://）' : `🌐 ${location.origin}`,
      isFileProtocol() ? '⚠️ 這種開法 🎤 麥克風不能用、離線快取不生效，請改用 start.bat' : null],
  ];
  el.innerHTML = rows.map(([k, v, warn]) =>
    `<div class="version-row"><span class="version-key">${k}</span>`
    + `<span class="version-val">${v}</span></div>`
    + (warn ? `<div class="version-warn">${warn}</div>` : '')
  ).join('');
}

// 語音診斷：列出這台實際有哪些中文語音、程式判定的性別、以及「點下去真的唸得出來嗎」。
// 存在的理由：語音清單每台電腦都不一樣（有沒有雲端 Online 語音差最多），
// 開發機測到的結果不能代表老師的電腦——與其猜，不如讓這台自己講。
// ─── 這台可以用的聲音（語音盤點，C-1）──────────────────
// 同一支渲染函式，兩個地方用：
//   ① 設定頁「🔊 這台可以用的聲音」——完整版，含 🔊／🅰️ 雙鈕對照試聽（診斷用）
//   ② 情境編輯器內嵌——精簡版（compact），每列可「設為這個情境的聲音」
// 老師不必在兩頁之間來回切；清單**只列這台實際有的語音**，所以不會選到不存在的音色。
// ⚠️ 兩顆試聽鈕的意義：🔊＝App 平常的播放方式，🅰️＝最原始的 Web Speech 呼叫。
//    兩顆聽起來不一樣＝App 播放鏈有問題；一樣＝瀏覽器或系統層的限制（別再往 App 裡找）。

function renderVoiceInventory(containerId, opts) {
  const o   = opts || {};
  const box = document.getElementById(containerId);
  if (!box) return;
  box.hidden = false;

  const zh = (voiceManager.all || []);
  if (!zh.length) {
    box.innerHTML = '<p class="form-hint">這台裝置找不到任何中文語音。可到 Windows「設定 → 時間與語言 → 語音」加裝中文（繁體）語音，或改用 Microsoft Edge 開啟。</p>';
    return;
  }

  const head = o.compact
    ? `<p class="form-hint" style="margin-bottom:6px">這台裝置有 ${zh.length} 支中文語音。點 🔊 試聽，按「設為這個情境的聲音」就會固定用它唸台詞。</p>`
    : `<p class="form-hint" style="margin-bottom:8px">這台裝置有 ${zh.length} 支中文語音；`
      + `目前<b>女生角色</b>會用 <b>${bestVoiceByGender('female') ? voiceShortName(bestVoiceByGender('female')) : '（無）'}</b>、`
      + `<b>男生角色</b>會用 <b>${bestVoiceByGender('male') ? voiceShortName(bestVoiceByGender('male')) : '（無，男生角色停用）'}</b>。<br>`
      + `每一列有兩顆試聽鈕：<b>🔊</b>＝App 平常的播放方式，<b>🅰️</b>＝最原始的 Web Speech 呼叫。`
      + `<b>兩顆聽起來不一樣就是 App 的播放鏈有問題</b>；一樣則是瀏覽器或系統層的限制。<br>`
      + `⚠️ 換一台電腦或換瀏覽器，這份清單就不一樣——自訂情境指定的聲音在別台可能要換人唸。</p>`;

  const sel = o.selectedRef ? voiceBaseName(o.selectedRef.name) : null;
  box.innerHTML = head + zh.map((v, i) => {
    const g       = voiceGenderOf(v);
    const label   = g === 'male' ? '♂ 男' : g === 'female' ? '♀ 女' : '－ 未知';
    // compact＝情境編輯器：顯示通用形象，免得老師以為選了曉臻就會得到「超市阿芬」
    const role    = o.compact ? voicePersonaFor(v.name) : voiceRoleFor(v.name);
    const active  = sel && voiceBaseName(v.name) === sel && v.name === o.selectedRef.name;
    return `<div class="voice-diag-row${active ? ' selected' : ''}">`
         + `<button class="voice-diag-play" data-i="${i}" aria-label="用 App 的方式試聽 ${v.name}">🔊</button>`
         + (o.compact ? '' : `<button class="voice-diag-play voice-diag-raw" data-i="${i}" aria-label="用最原始的方式試聽 ${v.name}">🅰️</button>`)
         + `<span class="voice-diag-tag">${label}</span>`
         + `<span class="voice-diag-tag">${voiceEngineTag(v)}</span>`
         + `<span class="voice-diag-tag">${voiceLangTag(v)}</span>`
         + (role?.image
             ? `<img class="voice-role-avatar" src="${role.image}" alt="" title="${role.name}${role.role ? '｜' + role.role : ''}" onerror="this.remove()">`
             : '')
         + `<span class="voice-diag-name" title="${v.name}">${voiceShortName(v)}`
         + (role?.name && role.name !== 'Google' ? `<span class="voice-role-name">${role.name}</span>` : '')
         + `</span>`
         + (o.compact
             ? `<button class="voice-pick-btn" data-pick="${i}">${active ? '✓ 使用中' : '設為這個情境的聲音'}</button>`
             : '')
         + `</div>`;
  }).join('') + `<p id="${containerId}-result" class="form-hint" style="margin-top:8px"></p>`;

  const sayLine = '你好，請問要說什麼呢？';   // 中性試聽句（這裡的語音不只用在店員）

  box.querySelectorAll('.voice-diag-raw').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const v = zh[Number(btn.dataset.i)];
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(sayLine);
      if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = 0.9; u.pitch = 1;
      u.onstart = () => {
        const res = document.getElementById(`${containerId}-result`);
        const got = u.voice?.name || '(瀏覽器預設)';
        if (res) res.innerHTML = (got === v?.name)
          ? `🅰️ 原始方式：確實是 <b>${got}</b> 唸的`
          : `🅰️ 原始方式：指定 <b>${v?.name}</b>，實際唸的是 <b>${got}</b>`;
      };
      // 試聽某一支聲音＝照實唸，不讓 iPad 的「一律美佳」換掉（js/audio-unlocker.js）
      window.__mtNoVoiceUpgrade = true;
      try { speechSynthesis.speak(u); } finally { window.__mtNoVoiceUpgrade = false; }
    });
  });

  box.querySelectorAll('.voice-diag-play:not(.voice-diag-raw)').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = zh[Number(btn.dataset.i)];
      window.__mtNoVoiceUpgrade = true;
      try { tts.speak(sayLine, 1, null, v); } finally { window.__mtNoVoiceUpgrade = false; }
      // 只是如實顯示「剛才誰在唸」給老師看，**不據此判定語音壞掉**（見血淚說明）
      setTimeout(() => {
        const actual = tts.lastVoiceName || '(未知)';
        const res = document.getElementById(`${containerId}-result`);
        if (res) res.innerHTML = actual === v.name
          ? `🔊 App 方式：確實是 <b>${v.name}</b> 唸的`
          : `⚠️ App 方式：指定 <b>${v.name}</b>，實際唸的卻是 <b>${actual}</b>`
            + (o.compact ? '' : `——請按同一列的 <b>🅰️</b> 再聽一次，兩者若不同就是 App 的播放鏈有問題`);
      }, 900);
    });
  });

  box.querySelectorAll('.voice-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = zh[Number(btn.dataset.pick)];
      if (typeof o.onPick === 'function') o.onPick(v);
    });
  });
}

// 語音清單非同步載入完成後，把畫面上已經開著的盤點重繪一次
function refreshVoiceInventories() {
  if (document.getElementById('voice-inventory')?.innerHTML) renderVoiceInventory('voice-inventory');
  if (document.getElementById('screen-scenario-editor')?.classList.contains('active')) renderVoiceSelect();
}

// 舊名保留：版本資訊區塊的「🔍 檢查這台的語音」仍可呼叫（其入口已移到設定頁的語音盤點區）
function renderVoiceDiag() { renderVoiceInventory('voice-diag'); }

// 「複製這台的語音清單」：各裝置實況盤點用（C-4 生角色圖前要先知道每台實際有哪些音色）
async function copyVoiceList() {
  const zh = voiceManager.all || [];
  const text = [
    `語音清單（${zh.length} 支中文語音）`,
    `瀏覽器：${navigator.userAgent}`,
    `網址：${location.href}`,
    '',
    ...zh.map(v => `${voiceEngineTag(v)}\t${voiceLangTag(v)}\t${voiceGenderOf(v) === 'male' ? '男' : voiceGenderOf(v) === 'female' ? '女' : '未知'}\t${v.name}\t${v.voiceURI || ''}`),
  ].join('\n');

  const status = document.getElementById('voice-copy-status');
  let copied = false;
  try { await navigator.clipboard.writeText(text); copied = true; }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { copied = document.execCommand('copy'); } catch {}
    ta.remove();
  }
  if (status) status.textContent = copied
    ? `✅ 已複製 ${zh.length} 支語音的清單，可貼進文件或訊息裡`
    : '❌ 複製失敗，請改用截圖';
}

function showFileProtocolWarning() {
  if (!isFileProtocol()) return;
  const bar = document.getElementById('file-protocol-warn');
  if (!bar) return;
  bar.hidden = false;
  document.getElementById('file-warn-close')?.addEventListener('click', () => { bar.hidden = true; });
}

// 角色性別：自訂情境看老師挑的 clerkGender；內建情境查 data/clerk_gender.js。
// ⚠️ **不能用音色的性別代替角色的性別**——兩者常常不一致（電影院阿哲是男生，配的音色卻是
// 女聲「晓辰」），照音色判會讓男角色用女聲說話。角色性別的真相在 voicegen/voice_config.json
// 與 voice_ears.json（人工聽過確認），由 _gen_voice_truth.js 產出 data/clerk_gender.js 快照，
// 跑任何語音稽核都會自動重生。VOICE_INFO 的 gender 只當快照缺場景時的最後退路。
// ⚠️ 步驟層的角色覆寫（clerkName/clerkImage，如車廂禮儀的站務員）性別無從得知，一律以場景主角色為準。
function clerkGenderOf(scenario) {
  if (scenario?.isCustom) return getCustomClerk(scenario).gender;
  const id = scenario?.id;
  if (typeof CLERK_GENDER !== 'undefined' && CLERK_GENDER[id]) return CLERK_GENDER[id];
  const scMap = SCENARIO_CLERK_MAP[id];
  const info  = scMap ? VOICE_INFO.find(v => v.keyword === scMap.keyword) : null;
  return (info && info.gender !== 'neutral') ? info.gender : null;
}

// 角色台詞該用哪支即時語音：先照角色性別挑，挑不到才回 null（呼叫端走 bestTWVoice）。
// 為什麼不能只靠 bestTWVoice：它是「品質優先」的挑選，會把不是 Online/Natural 的音色
// 升級成最好的 zh-TW 語音——在只有系統音的裝置上，男聲 Zhiwei 會被升級成女聲 Hanhan，
// 於是男角色全部用女聲說話（2026-08-02 回報「男生頭像卻是 Yating 的聲音」的真因）。
function voiceForClerk(scenario) {
  const g = clerkGenderOf(scenario);
  // 自訂情境：老師若指定過某支語音（role.voiceRef），優先照他的意思——
  // 換裝置時 resolveVoiceRef 會逐級退回，最後才落回「依性別自動挑」。
  const ref = scenario?.role?.voiceRef;
  // iPad／iPhone 的中文一律換成美佳（js/audio-unlocker.js），老師指定的聲音除外——
  // 這裡記下「這個情境指定的是誰」，守門看到同名就不換（找不到指定聲音而退回自動挑的不算）。
  window.__mtPinnedVoiceName = null;
  if (ref) {
    const r = resolveVoiceRef(ref, g);
    if (r.voice) {
      if (r.status !== 'missing') window.__mtPinnedVoiceName = r.voice.name;
      return r.voice;
    }
  }
  return g ? bestVoiceByGender(g) : null;
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
// 破音字：唸「還(huán)」的地方換成同音的「環」，**畫面文字不動**。
// 瀏覽器 TTS 同樣沒有注音標記可用，且「還」單獨出現時一律唸成 hái。
// 🔴 **這裡就是唯一定義處**：預錄音檔那側（voicegen/_read_clerk_map.js 的 applyTtsHomophones）
//    是用正則讀這一份，不另存一份——所以只改這裡。（2026-09-29 修正：原註解寫反成「這是鏡像」。）
// ⚠️ 只收「明確是 huán」的詞組，不做泛用取代：全站含「還」的文字絕大多數是 hái
//    （還是／還要／還有／還差／還沒），換錯會壞得更難發現；特別不要收「來還」（「本來還有…」會被誤傷）。
// 「長了一點」（褲管長了一點，cháng）：引擎唸成 zhǎng，2026-09-29 使用者聽出。全站只有這一句，收整個詞組。
const TTS_HOMOPHONES = [
  [/還書/g, '環書'], [/還我/g, '環我'], [/還你/g, '環你'], [/還給/g, '環給'],
  [/還這本/g, '環這本'], [/還那本/g, '環那本'], [/還漫畫/g, '環漫畫'], [/還錢/g, '環錢'],
  [/長了一點/g, '常了一點'],
  // 號碼要一位一位唸（2026-10-10 使用者定）：TTS 會把「258」唸成兩百五十八、「5917」唸成五千九百一十七。
  // 只收「後三碼／取貨編號」後面那一串，金額不受影響；一字換一字（258→二五八），逐字朗讀的切字位置不會跑掉。
  // 「悠遊卡」的卡被唸錯（2026-10-10 使用者聽出），改用只有 kǎ 一個讀音的「佧」；學生與旁白都套。
  // 第三欄 'noClerk'＝**預錄的店員台詞不套**（使用者只指定學生跟旁白；店員是 Gemini 付費錄音、沒回報唸錯）。
  // 即時語音（toSpeechText）一律套用。
  [/悠遊卡/g, '悠遊佧', 'noClerk'],
  [/三碼 258/g, '三碼 二五八'], [/三碼是 258/g, '三碼是 二五八'], [/編號 5917/g, '編號 五九一七'],
];

function toSpeechText(text) {
  const s0 = String(text ?? '');
  const s = TTS_HOMOPHONES.reduce((t, [re, to]) => t.replace(re, to), s0);
  // 後面接「元」的一律當金額（「165 元」唸一百六十五元），其餘的 165 才是專線號碼
  return s.replace(/\d+/g, (n, i) =>
    (n === '165' && !/^\s*元/.test(s.slice(i + n.length))) ? '一六五' : n);
}

const tts = {
  lastVoiceName: null,   // 上一句實際發聲的語音（試聽回報／診斷用）
  // preferVoice：指定要用哪支語音（角色台詞依性別挑聲音用）；傳 null 才走「品質優先」的挑選。
  // ⚠️ 角色說話一律要傳 preferVoice——bestTWVoice 會為了音質把男聲換成女聲（見 voiceForClerk）。
  speak(text, rate = 0.85, onEnd, preferVoice = null) {
    if (!window.speechSynthesis) { if (onEnd) onEnd(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(toSpeechText(text));
    // 後備瀏覽器 TTS 也用高品質即時語音：店員聲音若已是 Online/Natural 就沿用，
    // 否則升級為最佳 Online zh-TW（與提示/任務朗讀同一支高品質聲音）
    // ⚠️ 這五行刻意與 Downloads/voice-audition.html 的 speak() 逐字相同（那份在同一台電腦上
    // 證實能正確切換語音）。順序＝先 voice 再 lang、最後 rate，中間不做任何額外處理。
    // 之前繞過這個順序、加了 freshVoice 與 try/catch 之後就一路播不出指定的聲音，
    // 所以**這段不要再「優化」**，要動先去 voice-audition.html 對照。
    let voice = preferVoice || bestTWVoice(voiceManager.selected);
    try {
      if (voice) { u.voice = voice; u.lang = voice.lang; }
    } catch (_) {
      voice = null;                      // 物件失效時賦值會丟 TypeError，讓瀏覽器用預設語音把話說完
    }
    if (!voice) u.lang = 'zh-TW';
    u.rate = rate;
    // 記下「我們要求的」與「瀏覽器真的用的」——這兩者會不一樣：file:// 下指定會被無視，
    // 讀回來是系統預設語音。編輯器的試聽就是靠這個如實回報，不必再猜是不是挑錯聲音。
    this.lastVoiceName = voice?.name || '(未指定)';

    // 店員說話時的頭像動畫
    const avatar = document.getElementById('shopkeeper-avatar');
    let ended = false, started = false;
    const finish = () => { avatar?.classList.remove('speaking'); if (!ended) { ended = true; if (onEnd) onEnd(); } };
    // 只記錄實際發聲者供診斷顯示，**不做任何自動判定或換人**（見檔案上方的血淚說明）
    u.onstart = () => {
      started = true;
      tts.lastVoiceName = u.voice?.name || '(瀏覽器預設)';
      avatar?.classList.add('speaking');
    };
    u.onend   = finish;
    u.onerror = finish;

    window.speechSynthesis.speak(u);
    // 沒發出去就往下走（句尾旁白、彈窗接續…都排在 onEnd 後面）——說明見 ttsStallWatchdog
    ttsStallWatchdog(() => started, finish);
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
  let ended = false, started = false;
  const finish = () => { if (!ended) { ended = true; onEnd?.(); } };
  u.onstart = () => { started = true; };
  u.onend = finish; u.onerror = finish;
  window.speechSynthesis.speak(u);
  ttsStallWatchdog(() => started, finish);
}

// 🔴 `speechSynthesis.speak()` 有可能**整個不發聲，而且 onend／onerror 都不會來**——
// 最常見的是 Chrome 在 `cancel()` 之後緊接著 `speak()` 的競態（本專案每次播放前都會先
// `stopAllAudio()`→`tts.cancel()`），其次是這台裝置根本沒有可用語音、分頁被靜音、
// 或 speechSynthesis 卡在 paused 狀態。
// 問題是**後面還有東西排在它後面**：自訂情境的句首旁白唸完才播老師的錄音、內建情境的句首旁白
// 唸完才播店員台詞——前面這句沒有回報結束，後面那段就永遠不會出現，症狀是「錄了音卻完全沒反應」
// （2026-09-20 使用者回報，桌機）。
// 判準刻意取「**從來沒開始過**」而不是「唸太久」：`onstart` 沒觸發、而且瀏覽器既沒在唸也沒有排隊
// ＝這句確定沒發出去，往下走不會跟正在唸的話疊在一起。
function ttsStallWatchdog(hasStarted, onStalled, ms = 1200) {
  setTimeout(() => {
    if (hasStarted()) return;
    try { if (speechSynthesis.speaking || speechSynthesis.pending) return; } catch (_) {}
    onStalled();
  }, ms);
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
  if (/^\s*(（[^）]*）\s*)*（想一想）/.test(fp)) return true;  // 反思句（前面可先有一段情境旁白：「（你把早餐帶回家…）（想一想）…」，2026-09-29 補——原本只認句首，這種句子被錄成店員聲）
  if (/^\s*（你掛掉了電話）/.test(fp)) return true;            // 掛電話後的自問引導句
  if (/^接下來要做什麼？$/.test(rest)) return true;             // 「（你封鎖了對方。）接下來要做什麼？」這類引導句（2026-09-29 補：不補就變成詐騙者問學生）
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
    a.onended = () => { if (_shopkeeperAudio === a) _shopkeeperAudio = null; releaseAudio(a); };
    a.onerror = () => { if (_shopkeeperAudio === a) { _shopkeeperAudio = null; tryNext(); } };
    a.play().catch(() => { if (_shopkeeperAudio === a) { _shopkeeperAudio = null; tryNext(); } });
  };
  tryNext();
}

// 播放心裡 OS：預錄旁白 MP3（曉臻，audio/clerk/{場景}_{情境}_{步驟}_os）優先——
// 像店員台詞一樣可自動播放；缺檔才退回即時 TTS（bestOSVoice：曉臻→雅婷）。
// 把一句台詞拆成「括號旁白」與「店員台詞」，並記下旁白在句首還是句尾。
// **唯一的拆解定義處**：播放（playShopkeeperAudio／playCustomStepAudio）與練習頁彈窗都走這支，
// 否則彈窗顯示的兩段與實際播出的兩段會對不上。全站沒有一步帶兩個以上括號（2026-09-13 盤點），
// 所以只取第一個括號當旁白。
function splitPrompt(fp) {
  const full      = fp || '';
  const m         = full.match(/（([^）]*)）/);
  const osText    = m ? m[1].trim() : '';
  const clerkLine = full.replace(/（[^）]*）/g, '').trim();
  return { osText, clerkLine, osLeading: !!osText && /^\s*（/.test(full) };
}

// 一步的台詞要拆成幾段、依什麼順序呈現——**唯一定義處**（練習頁的店員彈窗與判定編輯器共用）。
// 老師在編輯頁讀到的分段，必須跟學生實際看到的彈窗一模一樣，否則「（想一想）要看什麼？」
// 這種句子會在編輯頁被標成店員在講話，實際上學生看到的是一個內心獨白彈窗。
//   'inner'    整句都是旁白（情境敘述／心裡話／想一想）→ 一個內心獨白
//   'os'+'clerk'（或反序）店員台詞＋一段括號旁白 → 兩段，依文字順序
//   'clerkAll' 純店員台詞 → 一段
function promptPhases(fp) {
  const full = fp || '';
  if (isNarrationPrompt(full)) return ['inner'];
  const { osText, clerkLine, osLeading } = splitPrompt(full);
  if (osText && clerkLine) return osLeading ? ['os', 'clerk'] : ['clerk', 'os'];
  return ['clerkAll'];
}

// 練習頁對話框的顯示文字：旁白與台詞各佔一行（搭配 #shopkeeper-speech-text 的 white-space: pre-line）
function bubbleText(fp) {
  const full = fp || '';
  const ph = promptPhases(full);
  if (ph.length < 2) return full;
  const { osText, clerkLine } = splitPrompt(full);
  const parts = { os: `（${osText}）`, clerk: clerkLine };
  return ph.map(p => parts[p]).join('\n');
}

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
    a.onended = () => { if (_shopkeeperAudio === a) { _shopkeeperAudio = null; releaseAudio(a); onDone?.(); } };
    a.onerror = () => { if (_shopkeeperAudio === a) { _shopkeeperAudio = null; tryNext(); } };
    a.play().catch(() => { if (_shopkeeperAudio === a) { _shopkeeperAudio = null; tryNext(); } });
  };
  tryNext();
}


// 徹底卸載一個 <audio>：只把變數設 null 不夠——Audio 物件還握著 src，
// Android Chrome 通知欄的媒體卡會留到分頁關閉（2026-08-19 實機回報，先在 adventure 修）。
// ⚠️ **播完（onended）也要走這裡**，不是只有被打斷時才卸載。
function releaseAudio(a) {
  if (!a) return;
  a.onended = a.onerror = null;
  try { a.pause(); a.src = ''; a.load(); } catch (_) {}
}

// ─── 店員語音播放（優先預錄音檔，無檔案時 fallback TTS）────────────
// 查找順序：
//   1. audio/clerk/{scenario_id}_{situation_id}_{step_id}.wav  （情境專屬）
//   2. audio/clerk/{scenario_id}_unknown_{step_id}.wav          （共用版）
//   3. TTS 語音合成
let _shopkeeperAudio = null;
let _feedbackAudio   = null;
let _userAudio       = null;   // 學生示範音檔（本機 edge-tts 伺服器產生）
let _homeCharAudio   = null;   // 首頁角色語音（金隊長／金好聊）
let _tipsAudio       = null;   // 情境小百科的卡片語音（見下方「情境小百科」區塊）

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
  if (_homeCharAudio)   { _homeCharAudio.pause();   _homeCharAudio   = null; }
  if (_tipsAudio)       { _tipsAudio.pause();       _tipsAudio       = null; }
  // 完成頁的結算音效與「等音效播完才唸」的排程（離開完成頁後不可冒出鼓勵語）
  window.ResultVoice?.stop();
  // 跟讀的自己錄音回放（echoRecorder 於後方定義，執行期才會用到）
  if (typeof echoRecorder !== 'undefined' && echoRecorder._audio) {
    try { echoRecorder._audio.pause(); } catch {}
    echoRecorder._audio = null;
  }
  tts.cancel();
}

// ── 首頁角色語音（金隊長／金好聊，共用主站 audio/chatbot 預錄音檔＋文字與主頁一致）──
const HOME_CHAR_SPEECH = {
  captain: { audio: '../audio/chatbot/index_captain_intro', text: '大家好，我是金隊長！你的努力，我都會記錄下來。跟我一起完成今天的任務，每天比昨天更進步！' },
  chatdog: { audio: '../audio/chatbot/index_chatdog_intro', text: '汪！我是金好聊，最喜歡聽你說話了！跟我一起去逛商店，練習開口說、輕鬆買東西吧！' },
};
// 完成頁的鼓勵語由**金好聊**唸（他就在鼓勵語旁邊，聲音要跟形象一致）。
// 音檔與站台主頁的金好聊同一個音色（Puck），清單在 voicegen/lists/jinhaoliao_list.csv。
// ⚠️ key 是畫面上顯示的那句話——改文字就要一起改這裡並重生音檔，否則會唸到別句。
const COMPLETE_SPEECH = {
  '表現得很棒！繼續加油！':       '../audio/chatbot/chatdog_complete_great',
  '不錯喔！再多練習幾次會更好！': '../audio/chatbot/chatdog_complete_good',
  '沒關係，多練習幾次就會進步！': '../audio/chatbot/chatdog_complete_try',
};

// 播一段預錄（mp3 → wav → 即時 TTS 逐級後備，與其他語音同一套規則）
function playChatdogLine(text) {
  const base = COMPLETE_SPEECH[text];
  if (!base) { tts.speak(text, 1); return; }
  stopAllAudio();
  const exts = ['mp3', 'wav'];
  let i = 0;
  const tryNext = () => {
    if (i >= exts.length) { tts.speak(text, 1); return; }
    const audio = new Audio(`${base}.${exts[i++]}`);
    _homeCharAudio = audio;
    let advanced = false;
    const fail = () => { if (advanced) return; advanced = true; tryNext(); };
    audio.onerror = fail;
    audio.onended = () => { if (_homeCharAudio === audio) _homeCharAudio = null; releaseAudio(audio); };
    // ⚠️ 手機可能擋掉脫離手勢脈絡的自動播放——被擋就安靜結束，學生可以點金好聊頭像再聽
    audio.play().catch(fail);
  };
  tryNext();
}

function speakHomeCharacter(key) {
  const c = HOME_CHAR_SPEECH[key];
  if (!c) return;
  stopAllAudio();
  const exts = ['mp3', 'wav'];
  let i = 0;
  const tryNext = () => {
    if (i >= exts.length) { tts.speak(c.text, 0.92); return; }
    const audio = new Audio(`${c.audio}.${exts[i++]}`);
    _homeCharAudio = audio;
    let advanced = false;
    const fail = () => { if (advanced) return; advanced = true; tryNext(); };
    audio.onerror = fail;
    audio.onended = () => { if (_homeCharAudio === audio) _homeCharAudio = null; releaseAudio(audio); };
    audio.play().catch(fail);
  };
  tryNext();
}

// ── 角色彈窗（金好聊／金隊長）：畫面走**共用元件** ../js/hero-modal.js ──────────
// 🔴 站台主頁載入同一支 → 兩頁的彈窗不可能長得不一樣。
//    （使用者實測回報過：從主頁進來、按上一頁停在本模組首頁，再點金好聊得到「比較小的彈窗」，
//     以為畫面壞了——真因就是兩邊各寫一份。）這裡只注入本模組的資料與播放方式。
function configureHeroModal() {
  if (!window.HeroModal) return;
  HeroModal.configure({
    heroImage: h => h === 'captain' ? '../images/common/captain_gold.png' : '../images/common/money_chat_dog.png',
    heroText:  h => (HOME_CHAR_SPEECH[h] || {}).text || '',
    playHeroIntro: h => speakHomeCharacter(h),
    stopVoice: () => stopAllAudio(),
  });
}

function openHeroModal(hero) {
  if (!window.HeroModal) return;
  if (hero === 'captain') {
    const roster = loadStudentRoster();
    const cur    = getCurrentStudent();
    const items  = roster.map(st => ({ name: st.name || '(未命名)', image: st.photo || '', emoji: '🙂', _st: st }));
    items.push({ name: '訪客（不記名）', emoji: '👤', color: '#E2E8F0', _st: null });
    const curIdx = cur ? Math.max(0, roster.findIndex(st => st.id === cur.id)) : items.length - 1;
    HeroModal.open('captain', {
      picker: {
        title: '👤 這次練習的是誰',
        note: roster.length
          ? '名冊與獎勵系統共用；要新增學生請到獎勵系統。'
          : '尚未建立學生名冊——請先到主頁，找金婆婆新增學生，或先以訪客身分練習。',
        items, current: curIdx,
        onPick: i => { setCurrentStudent(items[i]._st); renderStudentChip(); },
        closeOnPick: true,   // 選好「是誰」就收起來（沒有東西可以試聽）
      },
    });
    return;
  }
  // 「選擇學生語音」已移到情境設定頁（作答方式＝🔘 選擇對話 才出現；2026-09-28 使用者定）→ 金好聊彈窗只剩角色介紹
  HeroModal.open('chatdog');
}

// （彈窗一開就自我介紹的延遲與守門已移進共用元件 ../js/hero-modal.js）

// ══════════════════════════════════════════════════════════════════
// 情境小百科（金好聊講禮儀／金博士補充金錢常識）
// 資料＝data/tips.js（唯一來源）；計畫＝docs/開發計畫_情境小百科.md
// ══════════════════════════════════════════════════════════════════

/** 取某個情境的小百科卡；沒有就回 null（自訂情境一律沒有） */
function getTipCard(scenarioId, situationId) {
  const lib = window.TIPS_LIBRARY;
  if (!lib || !scenarioId || !situationId) return null;
  return (lib.scenes?.[scenarioId] || {})[situationId] || null;
}

/** 這個情境有沒有小百科可看（決定練習頁的小百科鈕要不要出現） */
function hasTipCard(scenario, situation) {
  // ⚠️ 自訂情境走 state.scenario＝自訂情境自己（做法二），它沒有內建卡片 → 不給入口，
  //    否則學生點開會是空的。掛在場所底下的自訂情境同理。
  if (!scenario || scenario.isCustom) return false;
  // 老師可在設定頁整個關掉（sp_tips）——判斷收斂在這裡，兩個入口都跟著關
  if (typeof a11y !== 'undefined' && a11y.tips === false) return false;
  return !!getTipCard(scenario.id, situation?.id);
}

let _tipsCurrent = null;   // { stem, text } 供「🔊 再聽一次」用（_tipsAudio 與其他 audio 變數一起宣告在上方）

/** 播一張卡的語音：mp3 → wav → 即時 TTS 逐級後備（與全站其他語音同一套規則）
 *  ⚠️ 後備鏈本身就會處理缺檔，**呼叫端不可以再補一個 tts.speak**
 *     （2026-09-05 完成頁「兩個聲音同時唸」就是這樣來的）。 */
function playTipVoice(stem, text) {
  stopAllAudio();
  _tipsCurrent = { stem, text };
  const exts = ['mp3', 'wav'];
  let i = 0;
  const tryNext = () => {
    if (i >= exts.length) { tts.speak(text, 0.92); return; }
    const audio = new Audio(`../audio/chatbot/${stem}.${exts[i++]}`);
    _tipsAudio = audio;
    let advanced = false;
    const fail = () => { if (advanced) return; advanced = true; tryNext(); };
    audio.onerror = fail;
    audio.onended = () => { if (_tipsAudio === audio) _tipsAudio = null; releaseAudio(audio); };
    // 手機可能擋掉脫離手勢脈絡的自動播放 → 被擋就安靜結束，學生可以按「🔊 再聽一次」
    audio.play().catch(fail);
  };
  tryNext();
}

// 目前這個彈窗在看什麼。切角色（點頭像）與換情境（📖 換一個）都只改這裡再重繪，
// 不各自散落狀態——同 24 單元知識卡 State.currentCardUnit / currentCardId 的作法。
let _tipsCtx = {
  scenarioId: '',    // 目前這張卡屬於哪個場所
  situationId: '',   // …哪個情境
  who: 'chatdog',    // 下方顯示誰的文字：chatdog（預設）| doctor
  docRefs: [],       // 這個情境引用的金博士卡
  docIndex: 0,       // 看到第幾張金博士卡
};

/** 這個場所有卡片的情境 id 清單（順序照 scenarios.js，＝畫面上情境卡的順序） */
function tipSituationIds(scenarioId) {
  const sc = (getAllScenarios() || []).find(s => s.id === scenarioId);
  return (sc?.situations || []).map(s => s.id).filter(id => getTipCard(scenarioId, id));
}
function tipSituationName(scenarioId, situationId) {
  const sc = (getAllScenarios() || []).find(s => s.id === scenarioId);
  return (sc?.situations || []).find(s => s.id === situationId)?.name || '';
}

/** 上方角色欄：左金好聊、右金博士；這個情境沒有金錢卡就隱藏右半、左半改佔滿 */
function renderTipsAvatars() {
  const dog = document.getElementById('tips-av-chatdog');
  const doc = document.getElementById('tips-av-doctor');
  if (!dog || !doc) return;
  const solo = _tipsCtx.docRefs.length === 0;
  doc.hidden = solo;
  document.getElementById('tips-picker')?.classList.toggle('solo', solo);
  // ⚠️ 只給 aria-pressed，**不做視覺差異**（不淡化也不放大縮小）——
  //    現在顯示的是誰，由下方的說話者名字交代。
  dog.setAttribute('aria-pressed', String(_tipsCtx.who === 'chatdog'));
  doc.setAttribute('aria-pressed', String(_tipsCtx.who === 'doctor'));
}

/** 標頭那一行：「說話者-情境名」（情境名查不到就只留說話者） */
function setTipsSpeaker(who) {
  const name = tipSituationName(_tipsCtx.scenarioId, _tipsCtx.situationId);
  document.getElementById('tips-speaker').textContent = name ? `${who}-${name}` : who;
}

/** 依 _tipsCtx 重繪整張卡（唯一的渲染入口） */
function renderTips() {
  const modal = document.getElementById('tips-modal');
  const cardEl = modal.querySelector('.tips-modal-card');
  // 這個場所／這張卡沒有別張可換時，「換一個」沒有意義 → 收起來
  document.getElementById('btn-tips-next').hidden = !_tipsCanNext();
  if (_tipsCtx.who === 'doctor') {
    const id = _tipsCtx.docRefs[_tipsCtx.docIndex];
    const card = window.TIPS_LIBRARY?.money?.[id];
    if (!card) return;
    cardEl.dataset.who = 'doctor';
    setTipsSpeaker('金博士的金錢小知識');
    document.getElementById('tips-title').textContent   = card.title;
    document.getElementById('tips-text').textContent    = card.text;
    // 這個情境引用了多張時，「換一個」在金博士的卡之間輪；只有一張就照常換情境
    playTipVoice(`tipdoc_${id}`, card.text);
  } else {
    const card = getTipCard(_tipsCtx.scenarioId, _tipsCtx.situationId);
    if (!card) return;
    // ⚠️ 顏色跟著「誰在說」固定，不跟卡片的 axis 跑——金好聊永遠藍、金博士永遠紫，
    //    學生用顏色認人，不是認分類（axis 仍在資料裡，只是不再影響畫面）。
    cardEl.dataset.who = 'chatdog';
    setTipsSpeaker('金好聊小百科');
    document.getElementById('tips-title').textContent   = card.title;
    document.getElementById('tips-text').textContent    = card.text;
    playTipVoice(`tip_${_tipsCtx.scenarioId}_${_tipsCtx.situationId}`, card.text);
  }
  renderTipsAvatars();
}

/** 這個場所還有沒有別張可換（給「📖 換一個」決定要不要出現） */
function _tipsCanNext() {
  if (_tipsCtx.who === 'doctor' && _tipsCtx.docRefs.length > 1) return true;
  return tipSituationIds(_tipsCtx.scenarioId).length > 1;
}

/** 切到某個情境，並重算它引用了哪些金博士卡
 *  keepWho：換情境時沿用學生剛剛在看的那位（新情境沒有金錢卡就退回金好聊）；
 *  不傳＝**預設顯示金好聊那張**（打開彈窗就是這條路）。 */
function showTipSituation(scenarioId, situationId, keepWho) {
  const card = getTipCard(scenarioId, situationId);
  if (!card) return;
  _tipsCtx.scenarioId = scenarioId;
  _tipsCtx.situationId = situationId;
  _tipsCtx.docRefs = (card.doctor || []).filter(id => window.TIPS_LIBRARY?.money?.[id]);
  _tipsCtx.docIndex = 0;
  _tipsCtx.who = keepWho === 'doctor' && _tipsCtx.docRefs.length ? 'doctor' : 'chatdog';
  renderTips();
}

/** 📖 換一個：金博士有多張時先看完他的，否則換這個場所的下一個情境（循環） */
function tipsNext() {
  if (_tipsCtx.who === 'doctor' && _tipsCtx.docIndex + 1 < _tipsCtx.docRefs.length) {
    _tipsCtx.docIndex++;
    renderTips();
    return;
  }
  const ids = tipSituationIds(_tipsCtx.scenarioId);
  if (ids.length < 2) return;                       // 只有一張卡，沒得換
  const i = ids.indexOf(_tipsCtx.situationId);
  showTipSituation(_tipsCtx.scenarioId, ids[(i + 1) % ids.length], _tipsCtx.who);
}

/** 打開小百科（唯一入口函式，兩個按鈕都走它） */
function openTips(scenario, situation) {
  if (!getTipCard(scenario?.id, situation?.id)) return;
  document.getElementById('tips-modal').hidden = false;
  // 打開＝預設顯示金好聊那張（他講的就是這個情境的禮儀），並唸出來
  showTipSituation(scenario.id, situation.id);
}

function closeTips() {
  stopAllAudio();
  if (_tipsAudio) { releaseAudio(_tipsAudio); _tipsAudio = null; }
  _tipsCurrent = null;
  document.getElementById('tips-modal').hidden = true;
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

function playShopkeeperAudio(step, part = 'all') {
  stopAllAudio();

  const avatar = document.getElementById('shopkeeper-avatar');
  const base    = `audio/clerk/${state.scenario.id}`;
  const stepId  = step.id;

  // 自訂情境：老師錄音（IndexedDB blob）→ 即時 TTS。不查伺服器音檔（必為 404）。
  if (state.scenario?.isCustom) {
    playCustomStepAudio(step, avatar, part);
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
  // 唸的順序＝畫面上文字的順序：括號在句首（「（電話響了）欸，我是…」）＝場景旁白，
  // 要先唸旁白再唸台詞；括號在句尾（「…（老闆找回 35 元）」）＝事後內心話，維持台詞在前。
  const { osText, clerkLine, osLeading } = splitPrompt(fullPrompt);
  // part：練習頁彈窗把「內心獨白」與「店員台詞」拆成先後兩個彈窗，每個彈窗只播自己那一段
  if (part === 'os') { playInnerOS(step, osText); return; }
  const onlyClerk  = part === 'clerk';
  const mySeq      = _audioSeq;   // 本次播放的世代（stopAllAudio 會使其失效）
  const speakOS    = () => {
    if (!onlyClerk && osText && !osLeading) setTimeout(() => { if (mySeq === _audioSeq) playInnerOS(step, osText); }, 350);
  };

  // 缺預錄檔時的即時語音也要合角色性別：不指定的話 bestTWVoice 會把男聲升級成女聲，
  // 男店員（阿豪、阿宏、阿財…）就全部變成女生在說話。
  const clerkVoice = voiceForClerk(state.scenario);
  const doTTS = () => {
    if (done) return;
    done = true;
    // 有店員台詞：先唸台詞再接心理 OS；純旁白步驟（無台詞）：直接用旁白語音唸 OS，不唸括號
    // （句首旁白已在進台詞前唸過，這裡不重複）
    if (clerkLine) tts.speak(clerkLine, 0.85, speakOS, clerkVoice);
    else if (!onlyClerk && osText && !osLeading) playInnerOS(step, osText);
    else if (!osText) tts.speak(fullPrompt, 0.85, null, clerkVoice);
  };

  function tryNext() {
    if (candidateIdx >= candidates.length) { doTTS(); return; }
    const filename = candidates[candidateIdx++];
    const audio = new Audio(filename);
    _shopkeeperAudio = audio;
    audio.onplay  = () => avatar?.classList.add('speaking');
    // 店員預錄台詞播完 → 接續唸心理 OS（OS 無預錄檔，走即時 TTS）
    audio.onended = () => { releaseAudio(audio); if (_shopkeeperAudio === audio) { done = true; avatar?.classList.remove('speaking'); speakOS(); } };
    // onerror 與 play().catch 對同一個失敗檔案會「雙重觸發」；用 _shopkeeperAudio===audio
    // 守門，確保每個候選只前進一次，避免同時播放兩個音檔（依優先順序只播第一個可用的）
    audio.onerror = () => { if (_shopkeeperAudio === audio) { _shopkeeperAudio = null; tryNext(); } };
    audio.play().then(() => { done = true; }).catch(() => { if (_shopkeeperAudio === audio) { _shopkeeperAudio = null; tryNext(); } });
  }

  // 句首旁白先唸完，隔 250ms 再進店員台詞；其餘情況直接播台詞（旁白由 speakOS 收尾）
  if (osLeading && !onlyClerk) playInnerOS(step, osText, () => setTimeout(() => { if (mySeq === _audioSeq) tryNext(); }, 250));
  else tryNext();
}

// 自訂情境步驟語音：老師錄音 blob（custom_audio store）優先，缺檔走即時 TTS。
// 與 playShopkeeperAudio 相同的頭像動畫／心理 OS 行為。
function playCustomStepAudio(step, avatar, part = 'all') {
  const fullPrompt = step.shopkeeper_prompt || '';
  const { osText, clerkLine, osLeading } = splitPrompt(fullPrompt);   // 同 playShopkeeperAudio：句首旁白先唸
  if (part === 'os') { playInnerOS(step, osText); return; }
  const onlyClerk  = part === 'clerk';
  // 🔴 「整句都是旁白」的步驟（沒有『對方說的話』，內容全在全形括號裡，例如「自己從頭寫」範本
  //    的三個佔位步驟）：老師在這一步錄的音**就是那句旁白本身**，不是另有台詞。
  //    這裡要跟一般步驟分開處理，否則會走到「句首旁白先唸完再播台詞」那條路：
  //    先用機器旁白音唸一次、再用老師的聲音唸第二次；而且學生只要在機器音唸完前按掉彈窗，
  //    `stopAllAudio()` 會讓排在後面的錄音世代失效 → **老師的錄音整個沒播出來**
  //    （2026-09-20 使用者回報「錄好音之後練習時語音播放沒有反應」）。
  const narrationOnly = !clerkLine && !!osText;
  const mySeq      = _audioSeq;
  const speakOS    = () => {
    if (!onlyClerk && osText && !osLeading) setTimeout(() => { if (mySeq === _audioSeq) playInnerOS(step, osText); }, 350);
  };
  // 店員台詞用「所選泛用店員性別」的聲音（男聲：Edge Online 男聲／系統 Zhiwei…）。
  // 這台裝置沒有該性別的中文語音時 bestVoiceByGender 回 null → tts.speak 自動退回預設高品質語音，
  // 圖是男生但聲音是女生——編輯器已在選擇時就把不可用的性別擋掉，這裡只是最後一道保險
  // （舊資料存了 male、之後換到沒有男聲的裝置上開，仍要唸得出來）。
  const clerkVoice = voiceForClerk(state.scenario);
  // ⚠️ 語速 1（正常）：內建教材放慢到 0.85 是教學設計，老師自編的情境沒有那個前提，
  //    放慢聽起來反而不自然（2026-08-18 使用者要求）。
  const doTTS      = () => {
    if (clerkLine) tts.speak(clerkLine, 1, speakOS, clerkVoice);
    else if (narrationOnly) playInnerOS(step, osText);                       // 純旁白且沒錄音 → 旁白語音唸（此時沒有人在 start 前唸過）
    else if (!onlyClerk && osText && !osLeading) playInnerOS(step, osText);   // 句首旁白已在 start 前唸過，不重複
    else if (!osText) tts.speak(fullPrompt, 1, null, clerkVoice);
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
          releaseAudio(audio);
          if (_shopkeeperAudio === audio) { avatar?.classList.remove('speaking'); speakOS(); }
        };
        audio.onerror = () => { URL.revokeObjectURL(url); if (_shopkeeperAudio === audio) { _shopkeeperAudio = null; doTTS(); } };
        audio.play().catch(() => { if (_shopkeeperAudio === audio) { _shopkeeperAudio = null; doTTS(); } });
      })
      .catch(doTTS);
  };

  // 純旁白步驟一律先查老師的錄音（有錄音就用它當這句旁白，沒有才由 doTTS 用旁白語音唸）。
  // 其餘步驟維持原行為：句首旁白先唸完，再播「對方說的話」。
  if (osLeading && !narrationOnly && !onlyClerk) playInnerOS(step, osText, () => setTimeout(() => { if (mySeq === _audioSeq) start(); }, 250));
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
  // 網站版對照表另帶 STUDENT_AUDIO_AVAIL（deploy.ps1 用 tools/filter_student_map.js 產生）：這位學生在網站上沒有這句錄音
  // → 直接即時語音，不先抓一個 404（404 之後已脫離手勢，手機會擋掉接著的即時語音＝點喇叭沒聲音）。本機版沒有這一項＝全部都有。
  const avail = window.STUDENT_AUDIO_AVAIL;
  const hasFile = !avail || (avail[student?.fileKey] && !avail[student.fileKey].includes(hash));
  if (hash && student?.fileKey && hasFile) {
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
      audio.onended = () => { if (_userAudio === audio) _userAudio = null; releaseAudio(audio); if (onEnd) onEnd(); };
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
    audio.onended = () => { if (_userAudio === audio) _userAudio = null; releaseAudio(audio); if (onEnd) onEnd(); };
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
  // 學生也要用合性別的聲音：selected 是「品質優先」挑的，本身不看性別，
  // 學生專屬音色沒安裝時（多數只有系統音的電腦都是），女學生會被配到男聲。
  const student = STUDENT_PROFILES[userVoiceManager.selectedStudentIdx];
  const voice = voiceManager.all.find(v => student?.voiceKeyword && v.name.includes(student.voiceKeyword))
             || (student?.gender && student.gender !== 'neutral' ? bestVoiceByGender(student.gender) : null)
             || userVoiceManager.selected;

  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice?.lang || 'zh-TW';
  u.rate = 0.9;
  if (voice) u.voice = voice;
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

  // 情境小百科：練習頁的小百科鈕（sp_tips，預設開）。
  // 情境卡右上角原本也有 📖，2026-09-15 改成 ✏️ 編輯鈕，入口只剩練習頁這一個。
  tips: true,
  applyTips(on) {
    this.tips = on;
    const btn = document.getElementById('btn-tips-toggle');
    if (btn) btn.setAttribute('aria-checked', String(on));
    // 關掉時把練習頁那顆一併收起來（打開時由下一次 startWithSituation 依有沒有卡決定）
    const fab = document.getElementById('btn-tips-fab');
    if (fab && !on) fab.hidden = true;
  },
  toggleTips() {
    this.applyTips(!this.tips);
    localStorage.setItem('sp_tips', this.tips ? '1' : '0');
  },

  init() {
    this.applyContrast(localStorage.getItem('sp_contrast') === '1');
    this.applyFontSize(localStorage.getItem('sp_fontsize') || 'normal');
    this.applyAAC(localStorage.getItem('sp_aac') === '1');
    this.applyClerkGreet(localStorage.getItem('sp_clerkgreet') !== '0');
    this.applyTips(localStorage.getItem('sp_tips') !== '0');
  },
};


// ─── 自訂情境儲存 ────────────────────────────────────

// ─── 自訂情境／自訂場景：資料層在 custom-scenes.js ─────────────────
// 🔴 **規則的唯一定義處是 `custom-scenes.js`**（站台主頁也要建立場景 → 兩邊共用同一份：
//    id 產生、配色、預設場景、舊資料遷移）。這裡只取別名讓既有呼叫點不必改動，
//    **不要在這裡另寫規則**，也不要把規則抄回來。
const CUSTOM_KEY               = CustomScenes.CUSTOM_KEY;
const CUSTOM_SCENE_KEY         = CustomScenes.SCENE_KEY;
const CUSTOM_ICON              = CustomScenes.ICON;
const CUSTOM_THEME_PALETTE     = CustomScenes.PALETTE;
const SCENE_ICON_CHOICES       = CustomScenes.SCENE_ICONS;
const DEFAULT_SCENE_ID         = CustomScenes.DEFAULT_ID;
const DEFAULT_SCENE_NAME       = CustomScenes.DEFAULT_NAME;
const pickPaletteTheme         = CustomScenes.pickTheme;
const loadCustom               = CustomScenes.loadCustoms;
const saveCustom               = CustomScenes.saveCustoms;
const loadCustomScenes         = CustomScenes.loadScenes;
const saveCustomScenes         = CustomScenes.saveScenes;
const getCustomScene           = CustomScenes.getScene;
const customSceneAsScenario    = CustomScenes.sceneAsScenario;
const sceneSituationCount      = CustomScenes.countSituations;
const ensureDefaultScene       = CustomScenes.ensureDefault;
const migrateCustomsIntoScenes = CustomScenes.migrate;

/**
 * 刪除一個自訂場景（連同底下的情境——它們就住在這個場景裡，留著會變成點不到的孤兒）。
 * 資料怎麼刪在 custom-scenes.js；這裡負責問使用者、清掉那些情境的老師錄音。
 */
function deleteCustomScene(id) {
  const scene = getCustomScene(id);
  if (!scene) return false;
  const kids = loadCustom().filter(sc => sc && sc.parentId === id);
  const ok = confirm(kids.length
    ? `「${scene.name}」底下還有 ${kids.length} 個情境：${kids.map(k => k.name || '未命名情境').join('、')}
`
      + '刪除場景會連同這些情境一起刪掉，此動作無法復原。要繼續嗎？'
    : `確定要刪除場景「${scene.name}」嗎？此動作無法復原。`);
  if (!ok) return false;
  const res = CustomScenes.remove(id);
  (res?.removed || []).forEach(k => {
    if (typeof dbAudioDeletePrefix === 'function') dbAudioDeletePrefix(`${k.id}::`).catch(() => {});
  });
  return true;
}

// ── 建立／編輯場景的小彈窗（名稱＋圖示，顏色自動配，不給老師選）──────────────
let _editingSceneId = null;   // null＝新增
let _sceneIconPick  = CUSTOM_ICON;

function openSceneModal(id) {
  _editingSceneId = id || null;
  const scene = id ? getCustomScene(id) : null;
  document.getElementById('scene-modal-title').textContent = scene ? '✏️ 編輯場景' : '➕ 建立場景';
  const nameInput = document.getElementById('scene-name-input');
  nameInput.value = scene?.name || '';
  renderSceneIconRow(scene?.icon || CUSTOM_ICON);
  document.getElementById('scene-modal-msg').textContent = '';
  document.getElementById('scene-modal').hidden = false;
  setTimeout(() => nameInput.focus(), 50);
}

function closeSceneModal() {
  document.getElementById('scene-modal').hidden = true;
}

function renderSceneIconRow(current) {
  _sceneIconPick = current || CUSTOM_ICON;
  const row = document.getElementById('scene-icon-row');
  row.innerHTML = '';
  SCENE_ICON_CHOICES.forEach(ic => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'scene-icon-btn' + (ic === _sceneIconPick ? ' on' : '');
    b.textContent = ic;
    b.setAttribute('aria-pressed', String(ic === _sceneIconPick));
    b.addEventListener('click', () => renderSceneIconRow(ic));
    row.appendChild(b);
  });
}

function saveSceneFromModal() {
  const name = document.getElementById('scene-name-input').value.trim();
  const msg  = document.getElementById('scene-modal-msg');
  if (!name) { msg.textContent = '請先輸入場景名稱。'; return; }
  const ok = _editingSceneId ? CustomScenes.rename(_editingSceneId, name, _sceneIconPick)
                             : !!CustomScenes.create(name, _sceneIconPick);
  if (!ok) { msg.textContent = '找不到這個場景，可能已經被刪掉了。'; return; }
  closeSceneModal();
  renderHome();
}

/**
 * 刪除一個自訂情境（設定頁列表與情境清單卡片右上角的 🗑️ 共用的唯一定義處）。
 * ⚠️ 以 **id** 定位不用索引：兩個畫面拿到的索引都是 loadCustom() 當下的位置，
 *    另一個分頁剛好動過名冊時索引就對不上，會刪錯人。
 * 回傳有沒有真的刪掉（使用者按取消＝false），呼叫端自己決定要重繪哪一頁。
 */
function deleteCustomScenario(sc) {
  if (!sc) return false;
  if (!confirm(`確定要刪除「${sc.name || '未命名情境'}」嗎？此動作無法復原。`)) return false;
  const arr = loadCustom();
  const i = arr.findIndex(s => s && s.id === sc.id);
  if (i < 0) return false;
  arr.splice(i, 1);
  saveCustom(arr);
  // 一併清除此情境的所有老師錄音——⚠️ **只在沒有別筆共用這個 id 時**（舊資料可能因為連按兩次儲存
  // 而有同 id 的重複卡；刪掉其中一張就把另一張還在用的錄音一起清掉，老師完全查不出原因）。
  if (typeof dbAudioDeletePrefix === 'function' && !arr.some(s => s && s.id === sc.id)) {
    dbAudioDeletePrefix(`${sc.id}::`).catch(() => {});
  }
  return true;
}

// ─── 對話包匯出/匯入（自訂情境＋老師錄音＋照片打包分享）──────────
// 格式：{ version:3, type:'dialogue-pack', exported, scenarios:[…], audio:{ key: dataURL } }
// v2 起 audio map 一併含照片 blob（key 尾 ::img、__scene::img）；匯入以 `${sc.id}::`
// 前綴通用再映射，故 v1 舊包（無照片）仍可匯入，向下相容。
// v3 起情境帶 `parentId`（掛在哪個內建場所底下）；匯入時父場所不存在會降級成獨立情境。
// 版本號只是給人看的標記——匯入端一律看欄位在不在，不靠版本號分支。

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
  // 2026-09-16：情境住在場景裡 → 用到的場景要一起打包，
  // 否則對方匯入時父層對不上，整批會被收進「我的場景」、老師原本的分類就沒了。
  const usedScenes = new Set(customs.map(sc => sc.parentId).filter(Boolean));
  const scenes = loadCustomScenes().filter(s => usedScenes.has(s.id));
  return JSON.stringify({
    version: 4, type: 'dialogue-pack', exported: Date.now(),
    scenes, scenarios: customs, audio,
  });
}

// 回傳 { scenarios, audios, orphaned, flawed }（匯入數量＋被降級成獨立的情境名＋步驟不合規則的情境名）。
// id 撞號自動重編，錄音 key 跟著改。
async function importDialoguePack(jsonText) {
  const data = JSON.parse(jsonText);
  if (data.type !== 'dialogue-pack' || !Array.isArray(data.scenarios)) {
    throw new Error('不是對話包檔案');
  }
  const existing = loadCustom();
  const usedIds  = new Set([...existing.map(s => s.id), ...SCENARIOS_DATA.scenarios.map(s => s.id)]);

  // v4 起對話包會帶自訂場景：先把這台還沒有的建起來，情境才掛得回原本的分類。
  // 同 id 視為同一個場景（例如兩台都有預設的「我的場景」）→ 併進去，不重建一份。
  if (Array.isArray(data.scenes)) {
    const mine = loadCustomScenes();
    data.scenes.forEach(sc => {
      if (!sc?.id || mine.some(m => m.id === sc.id)) return;
      mine.push({ id: sc.id, name: sc.name || DEFAULT_SCENE_NAME, icon: sc.icon || CUSTOM_ICON,
                  theme: sc.theme || pickPaletteTheme(mine, sc.id), createdAt: sc.createdAt || Date.now() });
    });
    saveCustomScenes(mine);
  }
  const audioMap = data.audio || {};
  let audios = 0;
  const orphaned = [];   // 父場所在這台找不到、已降級成獨立的情境名
  const flawed   = [];   // 步驟不合規則的情境名（照樣匯入，只是說出來）

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
    // 父場所不存在（別台的舊版場所、或未來場所改名）→ 降級成獨立自訂情境並回報，
    // 不能讓情境整個不見：老師的教材比「掛在哪裡」重要。
    // 2026-09-16 起情境一定要有歸屬：父層可以是內建場所或這台已有的自訂場景，
    // 都對不上（含舊包本來就沒有 parentId）就收進預設場景——不可以讓情境變成點不到的孤兒。
    let parentId = sc.parentId ?? null;
    const known = !!parentId
      && (SCENARIOS_DATA.scenarios.some(s => s.id === parentId) || !!getCustomScene(parentId));
    if (!known) {
      if (parentId) orphaned.push(sc.name || newId);
      parentId = ensureDefaultScene();
    }
    // 匯入**不擋**——別台老師的教材再怎麼不合規則也不能弄不見；
    // 只是如實說出來，進編輯器儲存時就地檢查會再指出是哪一步。
    if (typeof StepRules !== 'undefined') {
      const bad = StepRules.checkSteps(sc.steps, { profile: 'custom' })
        .filter(r => StepRules.hasError(r.issues));
      if (bad.length) flawed.push(`${sc.name || newId}（${bad.length} 步）`);
    }

    existing.push({ ...sc, id: newId, parentId, available: true });
  }
  saveCustom(existing);
  return { scenarios: data.scenarios.length, audios, orphaned, flawed };
}

// 「這兩句算不算同一句話」的單一定義：只差標點與空白就算同一句。
// 選項模式的判對（renderOptions）與教師存檔時的唯一正解守門都用這一支——
// 兩邊若不一致，老師寫「我要買郵票！」當干擾項會被放行，學生點下去卻判對。
const samePhrase = (a, b) => {
  const norm = t => String(t).replace(/[！？。，、!?.,\s]/g, '');
  return norm(a) === norm(b);
};

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

// ─── 自我介紹帶入學生自己的名字（2026-09-19 使用者定）─────────────────
// 對話裡不替學生取名字（原本寫死「我是小安」「我叫小明」），別人稱呼學生一律用「你」；
// 學生自我介紹的那幾步，資料寫 {名字}，開始練習時換成名冊裡目前選的學生（sp_currentStudent）。
// 沒選學生（訪客）：畫面顯示「＿＿」，關鍵字改成「我是／我叫」這類說法——要說成「我叫○○」才算（只講名字認不出來，系統不知道學生叫什麼）；
// 困難模式的 normHard 會把「＿」拿掉，所以「我是王小華」對「我是＿＿」不會因為空格被扣完整度。
// 有選學生：關鍵字＝名字＋「我是／我叫」（語音辨識常把名字寫成同音字，中級不因此判錯；困難模式仍要跟含真名的標準句比）。
// ⚠️ 這幾步的學生選項沒有預錄（_gen_student_lines.js 跳過含 {名字} 的選項），播放時退回即時語音；
//    回饋語含 {名字} 的同理（2026-10-10 使用者定）：_gen_all_feedback.js 不預錄，playFeedbackAudio 看 _nameFeedback 改即時語音、唸出真名。
const NAME_TOKEN = '{名字}';
const NAME_BLANK = '＿＿';
const NAME_KEYWORDS = ['我是', '我叫', '名字是', '我姓'];
function personalizeStep(st, name) {
  if (!st || !JSON.stringify(st).includes(NAME_TOKEN)) return st;
  const put = name || NAME_BLANK;
  const fill = v => typeof v === 'string' ? v.split(NAME_TOKEN).join(put) : v;
  const out = { ...st, shopkeeper_prompt: fill(st.shopkeeper_prompt), task: fill(st.task) };
  if (Array.isArray(st.options)) out.options = st.options.map(fill);
  if (Array.isArray(st.accepted_phrases)) out.accepted_phrases = st.accepted_phrases.map(fill);
  if (st.feedback) {
    out.feedback = Object.fromEntries(Object.entries(st.feedback).map(([k, v]) => [k, fill(v)]));
    // 記下哪幾句回饋語原本含 {名字}：那幾句沒有預錄，playFeedbackAudio 改即時語音
    const nf = Object.keys(st.feedback).filter(k => String(st.feedback[k]).includes(NAME_TOKEN));
    if (nf.length) out._nameFeedback = nf;
  }
  if (Array.isArray(st.keywords)) {
    out.keywords = [...new Set(st.keywords.flatMap(k =>
      k === NAME_TOKEN ? (name ? [name, ...NAME_KEYWORDS] : NAME_KEYWORDS) : [fill(k)]))];
  }
  if (st.frame) out.frame = JSON.parse(JSON.stringify(st.frame).split(NAME_TOKEN).join(JSON.stringify(put).slice(1, -1)));
  return out;
}
function personalizeSituation(sit, name) {
  if (!sit || !Array.isArray(sit.steps)) return sit;
  const steps = sit.steps.map(st => personalizeStep(st, name));
  return steps.some((st, i) => st !== sit.steps[i]) ? { ...sit, steps } : sit;
}

// 關鍵字編輯器 UI（只列內建情境；自訂情境已有自己的步驟編輯器）
// 傳入 scId/sitId＝直接跳到那一個情境（情境選擇頁卡片右上角的 ✏️ 走這條），
// 不傳＝從設定頁進來，兩個下拉都停在第一項讓老師自己選。
function openKeywordEditor(scId, sitId) {
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
  if (scId && [...scSel.options].some(o => o.value === scId)) scSel.value = scId;
  renderKwSituations();
  if (sitId) {
    const sitSel = document.getElementById('kw-situation-select');
    if ([...sitSel.options].some(o => o.value === sitId)) { sitSel.value = sitId; renderKwSteps(); }
  }
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

  (sit?.steps || []).forEach((step, i) => {
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
    row.dataset.task   = step.task || step.id;

    // 標題＝「第 N 步：任務說明」。編號是老師對照學生畫面用的（練習頁也是這樣數），
    // 不是資料欄位——步驟順序就是 steps 的順序，不另存編號。
    const label = document.createElement('label');
    label.className   = 'form-label kw-step-title';
    label.textContent = `第 ${i + 1} 步：${step.task || step.id}`;
    if (isOv) {
      const b = document.createElement('span');
      b.style.cssText = 'color:var(--orange);font-size:0.8em';
      b.textContent   = '（已修改）';
      label.append(' ', b);
    }

    // 台詞分兩種：括號內＝旁白／心裡話（練習時用曉臻的旁白聲唸、不動店員頭像），
    // 括號外＝店員真正說出口的話（角色聲）。拆法走唯一定義處 splitPrompt，顯示順序也跟著它的
    // osLeading——否則老師在這裡讀到的先後，會跟學生實際聽到的先後對不上。
    // 台詞分兩種：括號內＝旁白／心裡話（練習時用曉臻的旁白聲唸、彈窗不擺店員的臉），
    // 括號外＝店員真正說出口的話（角色聲）。分段走 promptPhases，與學生看到的彈窗完全一致。
    const fullPrompt = step.shopkeeper_prompt || '';
    const { osText, clerkLine } = splitPrompt(fullPrompt);
    const hint = document.createElement('div');
    hint.style.margin = '0 0 4px';
    const mkLine = (cls, text) => {
      const p = document.createElement('p');
      p.className = `form-hint ${cls}`;
      p.style.margin = '0';
      p.textContent = text;
      return p;
    };
    const LINE = {
      inner:    () => mkLine('kw-step-os',    `💭 旁白（心裡話）：${fullPrompt}`),
      os:       () => mkLine('kw-step-os',    `💭 旁白（心裡話）：${osText}`),
      clerk:    () => mkLine('kw-step-clerk', `🗣️ 店員：「${clerkLine}」`),
      clerkAll: () => mkLine('kw-step-clerk', `🗣️ 店員：「${clerkLine || fullPrompt}」`),
    };
    promptPhases(fullPrompt).forEach(ph => hint.appendChild(LINE[ph]()));

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
      wrapField('kw-field-acc', '💬 可接受完整語句（第 1 句＝標準答案，用於提示與困難判定）', accInput),
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
  // 收集要回報給老師的事。一律用「學生會遇到什麼」來描述，不講程式術語——
  // 這一頁是給第一次接觸的老師看的。
  const dropped = [];   // 干擾項與可接受語句相同 → 已自動移除
  const kwHits  = [];   // 干擾項含有該步關鍵字 → 用說的／打字時也會判對（只能提醒）
  document.querySelectorAll('.kw-step-row').forEach(row => {
    const key   = row.dataset.key;
    const task  = row.dataset.task || '';
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
      const kept = [answer, ...optArr.slice(1).filter(o =>
        !samePhrase(o, answer)
        && !effAcc.some(a => samePhrase(a, o))
        && !accArr.some(a => samePhrase(a, o)))];
      optArr.slice(1).filter(o => !kept.includes(o)).forEach(o => dropped.push({ task, opt: o }));
      optArr = kept;
    }

    // 提醒（不自動改）：選項模式是「一字不差」比對，說話／打字模式卻是「說到關鍵字就算對」。
    // 干擾選項只要含有關鍵字，學生用講的說出那一句就會過關——這是兩種作答方式的落差，
    // 不是老師打錯字，所以只說明、不動老師刻意寫的句子。
    const effKw = kwArr.length ? kwArr : row.dataset.defKw.split(',').filter(Boolean);
    optArr.slice(1).forEach(opt => {
      const hit = effKw.filter(k => kwHit(opt, k));   // 跟實際判定同一套比對（去標點、國字數字）
      if (hit.length) kwHits.push({ task, opt, hit });
    });

    const o = {};
    if (kwArr.length  && kwArr.join(',')   !== row.dataset.defKw)  o.keywords = kwArr;
    if (accArr.length && accArr.join('\n') !== row.dataset.defAcc) o.accepted = accArr;
    if (optArr.length >= 2 && optArr.join('\n') !== row.dataset.defOpt) o.options = optArr;
    if (Object.keys(o).length) overrides[key] = o;
    else delete overrides[key];
  });
  saveKeywordOverrides(overrides);
  renderKwSteps();

  // 老師輸入的文字一律走 textContent，不組 HTML 字串
  const status = document.getElementById('kw-save-status');
  status.innerHTML = '';
  const line = (text, cls) => {
    const el = document.createElement('p');
    el.className = cls;
    el.textContent = text;
    status.appendChild(el);
  };
  line('✓ 已儲存。下次進入這個情境練習時就會用新的設定。', 'kw-status-ok');
  dropped.forEach(d => line(
    `已自動移除選項「${d.opt}」（在「${d.task}」這一步）：一題只能有一個正確答案，`
    + '且這一句跟「可以接受的說法」寫的一樣。', 'kw-status-note'));
  kwHits.forEach(h => line(
    `提醒：選項「${h.opt}」（在「${h.task}」這一步）裡面有關鍵字「${h.hit.join('、')}」，`
    + '學生用說的或打字時，說出這一句也會算對。'
    + '可以把關鍵字改得更明確，或換一個不含這些字的選項。',
    'kw-status-warn'));
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


// ─── 自訂情境掛進場所（parentId）────────────────────
// `parentId` 只是「這張卡片要出現在哪個場所底下」的**入口標籤**，不改變資料從屬：
// 點進去練習時 `state.scenario` 仍是自訂情境自己，所以全站 14 處 `isCustom` 判斷
// （店員頭像鏈、音檔路徑、教師覆寫、學習紀錄…）本來就成立，一處都不用改。
// 代價只有兩個，在這裡補：標題補上父場所名、場景圖與主題色讀父場所的。
// 判讀一律走這三支函式，不要在各處自己 find（見主 CLAUDE.md 的單一真相紀律）。

function getParentScenario(sc) {
  if (!sc?.parentId) return null;
  // 父層可能是內建場所，也可能是老師自己建的場景（2026-09-16 起）——
  // 兩種都由這一支回答，呼叫端（標題／顏色／返回哪一頁／設定頁說明）不必各自判斷。
  return SCENARIOS_DATA.scenarios.find(s => s.id === sc.parentId)
      || customSceneAsScenario(getCustomScene(sc.parentId));
}

// 掛在某場所底下的自訂情境（保留在 loadCustom() 陣列中的索引，✏️ 編輯要用）
function customsOfParent(parentId) {
  return loadCustom()
    .map((sc, idx) => ({ sc, idx }))
    .filter(({ sc }) => sc.parentId === parentId);
}

// 畫面標題／學習紀錄的單元名：掛在場所下就補成「便利商店・合作社買午餐」
function scenarioDisplayName(sc) {
  const parent = getParentScenario(sc);
  return parent ? `${parent.name}・${sc.name}` : (sc?.name || '');
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
  renderPracticeStudentAvatar();
}

function renderStudentChip() {
  const chip = document.getElementById('btn-student-cta');
  if (!chip) return;
  const cur = getCurrentStudent();
  const label = cur ? (cur.name || '(未命名)') : '選擇學生';
  chip.innerHTML = `<span class="icon-badge">👤</span> ${label}`;
}

// 練習頁店員頭像旁的學生頭像（2026-09-11 新增；點擊放大見 showStudentPhotoZoom）：
// 訪客（未選學生）不顯示——沒有身分可標示，留白比放一個空白圓框清楚。
// 有照片用照片，沒照片用 emoji 佔位。click/keydown 監聽只在 bindEvents() 綁一次，
// 這裡每步都會呼叫，只更新內容、不重綁事件。
function renderPracticeStudentAvatar() {
  const el = document.getElementById('student-avatar-dlg');
  if (!el) return;
  const cur = getCurrentStudent();
  if (!cur) { el.hidden = true; return; }
  const stu = loadStudentRoster().find(s => String(s.id) === String(cur.id)) || cur;
  el.hidden = false;
  el.title = '目前學生：' + (stu.name || '') + '（點我放大看照片）';
  el.setAttribute('aria-label', '目前學生：' + (stu.name || '') + '，點我放大看照片');
  el.innerHTML = stu.photo ? `<img src="${stu.photo}" alt="">` : '🙂';
}

// 點學生頭像 → 放大彈窗（樣式比照 reward/script.js 的 showPhotoZoom）
function showStudentPhotoZoom() {
  const cur = getCurrentStudent();
  if (!cur) return;
  const stu = loadStudentRoster().find(s => String(s.id) === String(cur.id)) || cur;
  showPhotoZoom({ name: stu.name || '', photo: stu.photo || '' });
}

/** 頭像放大彈窗（唯一畫法）：練習頁的學生照片、設定頁的學生語音頭像共用。
 *  fixed:true＝固定 300×300（設定頁學生語音頭像，2026-09-28 使用者指定） */
function showPhotoZoom({ name = '', photo = '', emoji = '🙂', fixed = false } = {}) {
  document.querySelector('.student-photo-zoom-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'student-photo-zoom-overlay' + (fixed ? ' spz-fixed' : '');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', '放大頭像：' + name);
  const photoHTML = photo ? '<img alt="">' : '<div class="spz-avatar"></div>';
  overlay.innerHTML = `
    <button type="button" class="spz-x" aria-label="關閉">✕</button>
    <div class="spz-name"></div>
    ${photoHTML}
    <div class="spz-hint">點擊任意處關閉</div>`;
  if (photo) overlay.querySelector('img').src = photo;
  else overlay.querySelector('.spz-avatar').textContent = emoji;
  overlay.querySelector('.spz-name').textContent = name;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

// 金隊長的「選學生」彈窗也改用共用元件（openHeroModal('captain')）——
// 原本這裡自己畫一份清單，與站台主頁的成長基地長得完全不一樣。

// 主題色預設
const THEME_PRESETS = [
  { color: '#16A34A', bg: '#DCFCE7', accent: '#15803D', label: '綠' },
  { color: '#D97706', bg: '#FEF3C7', accent: '#B45309', label: '橘' },
  { color: '#7C3AED', bg: '#EDE9FE', accent: '#6D28D9', label: '紫' },
  { color: '#2563EB', bg: '#DBEAFE', accent: '#1D4ED8', label: '藍' },
  { color: '#DB2777', bg: '#FCE7F3', accent: '#BE185D', label: '粉' },
];


// ─── 導覽堆疊 ────────────────────────────────────────

// 這一次是從站台主頁深連結進來的（?editor=new）：返回時要回站台主頁，不是本模組首頁
let _fromSiteHome = false;

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
  parentScenario: null, // 自訂情境掛在哪個內建場所底下（parentId 對應的場所物件；null＝獨立）
  situation:   null,    // 目前選取的情境（含 steps）
  simpleMode:  null,    // 簡易版：只練前 3 步（null＝設定頁還沒選）
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
  lockInputMode: false, // 設定頁選「固定這個方式」：練習頁不顯示作答方式切換列（2026-09-27）
  assistMode:  false,   // 輔助點擊（選擇對話專用）：點畫面任何地方＝替學生按下一個正確動作（2026-09-30）
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

// ─── 學習紀錄的欄位（完成紀錄與中途離開的草稿共用，唯一定義處）────────────
// 自訂情境：場景名與情境名分開存（2026-09-17 起）。原本 scenarioName＝「場景・情境名」、
// situationName 固定是包裝用的「自訂練習」→ 學習歷程總覽分不出場景與情境，週報還把所有自訂情境併成一列。
// 舊紀錄仍是舊格式，teacher.html 的 dlgNamesOf() 兩種都認；老師改名後以該頁查到的目前名稱為準。
function dialogueRecordBase() {
  const curStudent = getCurrentStudent();
  const isCustomRun = !!state.scenario.isCustom;
  return {
    studentId:    curStudent?.id ?? null,
    studentName:  curStudent?.name || '',
    scenarioId:   state.scenario.id,
    scenarioName: isCustomRun ? (getParentScenario(state.scenario)?.name || '') : state.scenario.name,
    situationId:  state.situation.id,
    situationName: isCustomRun ? state.scenario.name : state.situation.name,
    ...(isCustomRun ? { isCustom: true, parentId: state.scenario.parentId || null } : {}),
    difficulty:   state.difficulty,
  };
}
function dialogueRecordSteps(results) {
  return results.map((r, i) => ({
    stepId:   state.situation.steps[i]?.id,
    task:     state.situation.steps[i]?.task,
    score:    r?.score,
    attempts: r?.attempts || 1,
    spoke:    r?.spoke   || 0,     // 🗣️ 有收到語音的次數（語音模式才有，其餘恆 0）
    noVoice:  r?.noVoice || 0,     // 🔇 沒收到語音的次數
    hintUsed: !!r?.hintUsed,
    ...(r?.hintSrc ? { hintSrc: r.hintSrc } : {}),
    ...(r?.hintSrcs ? { hintSrcs: r.hintSrcs } : {}),
    promptLevel: r?.promptLevel ?? null,
    mode: r?.mode ?? null,
    selfRated: !!r?.selfRated,      // 跟讀自評（非系統評分）
    assisted: !!r?.assisted,        // 👆 輔助點擊（系統替學生按的）
  }));
}
// 中途離開的草稿（2026-10-09 使用者定，存取在 db.js）：只放「做完的步驟」——
// 最後一步若還沒答對就離開＝那一步沒做完，不算（同 24 單元「沒做完的那一題不算」）
function saveDialogueDraft() {
  if (typeof dbDraftWrite !== 'function' || !state.sessionId || !state.situation) return;
  const upto = state.results.slice(0, state.stepIndex + 1);
  const steps = dialogueRecordSteps(upto).filter((st, i) => upto[i]);   // 先對位再濾空格，步驟名稱才不會錯位
  if (state.results[state.stepIndex]?.score !== 'perfect') steps.pop();
  dbDraftWrite({
    id: state.sessionId, ...dialogueRecordBase(),
    mode: state.inputMode || null,
    steps, total: steps.length, score: steps.filter(st => st.score === 'perfect').length,
    ...(steps.some(st => st.assisted) ? { assisted: true } : {}),
    startTs: state.startTs, ts: Date.now(), durationSec: Math.round((Date.now() - state.startTs) / 1000),
  });
}

function showScreen(id) {
  // 離開練習頁、不是去完成頁＝中途離開：草稿存成中斷摘要（一步都沒做完的不存，db.js 判斷）
  if (id !== 'screen-practice' && id !== 'screen-complete' && document.getElementById('screen-practice')?.classList.contains('active')
      && typeof dbFinalizeDialogueDraft === 'function') {
    dbFinalizeDialogueDraft().catch(() => {});
  }
  stopAllAudio();
  clearTimeout(_shopkeeperTimer);   // 取消尚未觸發的店員語音（避免離開練習頁後才響）
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}


// ─── 語音選擇器 UI ────────────────────────────────────

// ⚠️ 死程式碼（2026-08-02 查證）：index.html 已無 `#voice-list`，店員語音選擇器整個從 UI 移除，
// 全專案也沒有呼叫點（只有函式內部自我重繪）。保留是為了日後若要恢復「選店員聲音」的入口；
// 真的要恢復時記得 list 可能為 null 要先防呆。
function renderVoiceSelector() {
  const list = document.getElementById('voice-list');
  if (!list) return;
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
      // 專屬音色沒安裝時，試聽也要用同性別的替代聲音（fallbackVoice 是女聲，
      // 直接用會讓男店員的卡片發出女聲）
      const demoVoice = matchedVoice
        || (info.gender !== 'neutral' ? bestVoiceByGender(info.gender) : null);
      tts.speak('你好！歡迎光臨！', 0.85, null, demoVoice);
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

  STUDENT_PROFILES.forEach((student, idx) => {
    const matchedVoice = voiceManager.all.find(v => v.name.includes(student.voiceKeyword));
    // 專屬音色沒安裝時退到「同性別」的聲音，不是寫死的那一支——
    // 原本一律退 Zhiwei（男），害女學生小婷、中性小恩都用男聲說話。
    const fallback = (student.gender && student.gender !== 'neutral'
                        ? bestVoiceByGender(student.gender) : null)
                  || voiceManager.all[0] || null;
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
      userVoiceManager.saveIdx(idx);   // 存起來，下次開啟沿用同一個選擇
      userVoiceManager.selected = matchedVoice || fallback;
      sfx.click();
      speakAsUser('我要點餐！');
      renderUserVoiceSelector();
      // 點頭像順便放大看是誰（300×300；2026-09-28 使用者要求）
      showPhotoZoom({ name: student.name, photo: student.image, emoji: student.emoji, fixed: true });
    });
    list.appendChild(card);
  });
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
  modal._rolePreview = false;
  modal._phases = null;
  modal._phaseIdx = 0;
  document.getElementById('btn-clerk-close').textContent = '知道了';   // 分段彈窗會改成「繼續 ▶」
}

// ─── 練習頁店員彈窗（點頭像／進入練習自動迎接）─────────
// 共用 clerk-modal（桌面端店員圖 300px）：放大目前步驟的店員，並播放這一步的台詞。
// 內心獨白圖：旁白步驟的彈窗用（見 showPracticeClerkPopup）
const INNER_THOUGHT_IMAGE = 'images/inner-thought.jpg';

function showPracticeClerkPopup() {
  const step = state.situation?.steps?.[state.stepIndex];
  if (!step) return;
  const fp = step.shopkeeper_prompt || '';
  // 幾個彈窗、什麼順序＝promptPhases（唯一定義處，判定編輯器顯示同一套；2026-09-13 使用者要求）。
  // ⚠️ 每個彈窗只播自己那一段（playShopkeeperAudio 的 part），否則第一個彈窗就把兩段都唸完了。
  const phases = promptPhases(fp);
  const modal = document.getElementById('clerk-modal');
  modal._scenario = null;
  modal._practiceStep = step;   // 「再聽一次」重播本步驟目前這一段
  modal._phases = phases;
  modal._phaseIdx = 0;
  renderPracticePhase();
}

/** 畫出練習頁彈窗目前這一段（內心獨白或店員），並只播這一段的語音 */
function renderPracticePhase() {
  const modal = document.getElementById('clerk-modal');
  const step  = modal._practiceStep;
  const phase = modal._phases?.[modal._phaseIdx];
  if (!step || !phase) return;
  const fp = step.shopkeeper_prompt || '';
  const { osText, clerkLine } = splitPrompt(fp);
  const scMap     = SCENARIO_CLERK_MAP[state.scenario?.id];
  const voiceInfo = voiceManager.selectedInfo
                 || (voiceManager.selected ? voiceManager.getInfo(voiceManager.selected) : null);
  // 圖片以練習頁頭像當下顯示者為準（含教師自訂場景照片），再退回場景/語音推斷
  const generic = state.scenario?.isCustom ? getCustomClerk(state.scenario) : null;
  const curImg = document.querySelector('#shopkeeper-avatar img')?.getAttribute('src') || '';
  // 旁白＝**不是店員在說話**，彈窗不擺店員的臉：改顯示內心獨白圖（學生托著下巴＋「想一想…」泡泡）
  const inner = phase === 'inner' || phase === 'os';
  const img  = inner ? INNER_THOUGHT_IMAGE
             : (curImg || step.clerkImage || state.situation.clerkImage || scMap?.image || generic?.image || voiceInfo?.image || '');
  const name = inner ? '內心獨白'
             : (step.clerkName  || state.situation.clerkName  || scMap?.name  || generic?.name  || voiceInfo?.name  || '店員');
  const imgEl = document.getElementById('clerk-modal-img');
  imgEl.src = img;
  imgEl.alt = name;
  imgEl.hidden = !img;
  // ⚠️ 店員圖是圓形裁切，但內心獨白圖的泡泡在右上角，圓形會切掉泡泡裡的字 → 改圓角方框
  imgEl.classList.toggle('is-inner', inner);
  imgEl.onerror = () => { imgEl.hidden = true; };
  // 換到第二個彈窗時重新播一次進場動畫，學生才看得出「換人了」
  imgEl.style.animation = 'none'; void imgEl.offsetWidth; imgEl.style.animation = '';
  document.getElementById('clerk-modal-name').textContent = name;
  // 自訂情境不顯示 voiceInfo 的職稱（那是首頁選的內建店員，例如「便利商店」，與本情境無關）
  document.getElementById('clerk-modal-role').textContent = inner ? '' :
    (state.situation.clerkName ? '' : (scMap?.role || (generic ? '' : voiceInfo?.role) || ''));
  // 彈窗下方顯示正在播放的那一段文字（與語音同步呈現，多元表徵）
  document.getElementById('clerk-modal-text').textContent =
    phase === 'os' ? `（${osText}）` : phase === 'clerk' ? clerkLine : fp;
  // 還有下一個彈窗時，按鈕寫「繼續」，學生才知道按了還有東西（不是關掉就結束）
  const hasNext = modal._phaseIdx < modal._phases.length - 1;
  document.getElementById('btn-clerk-close').textContent = hasNext ? '繼續 ▶' : '知道了';
  modal.hidden = false;
  playShopkeeperAudio(step, phase === 'os' ? 'os' : phase === 'clerk' ? 'clerk' : 'all');
}

/** 練習頁彈窗往下一段；已經是最後一段就回 false（讓呼叫端關掉彈窗） */
function advancePracticePhase() {
  const modal = document.getElementById('clerk-modal');
  if (!modal._practiceStep || !modal._phases || modal._phaseIdx >= modal._phases.length - 1) return false;
  stopAllAudio();
  modal._phaseIdx++;
  renderPracticePhase();
  return true;
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
  // 這台裝置沒裝該店員的專屬音色時（多數只有系統音的電腦都是如此），至少要找一支同性別的頂上；
  // 否則 selected 會停在上一個角色（預設女聲雅婷），男店員的自我介紹就用女聲唸了。
  // 性別以「角色」為準（clerkGenderOf），不是音色——兩者常不一致。
  const introVoice = voice || voiceForClerk(scenario);

  const candidates = [
    `audio/clerk/${scenario.id}_intro.mp3`,
    `audio/clerk/${scenario.id}_intro.wav`,
  ];
  let idx = 0;
  const tryNext = () => {
    if (idx >= candidates.length) { tts.speak(clerkData.intro, 0.85, null, introVoice); return; }
    const audio = new Audio(candidates[idx++]);
    _shopkeeperAudio = audio;
    audio.onended = () => { if (_shopkeeperAudio === audio) _shopkeeperAudio = null; releaseAudio(audio); };
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
  // 回饋語含 {名字}（自我介紹那幾步）：沒有預錄，直接即時語音唸出帶入真名的句子；
  // 沒選學生時畫面是「＿＿」，唸成「你的名字」（2026-10-10 使用者定，同學生選項含 {名字} 的做法）
  if (step?._nameFeedback?.includes(score)) { tts.speak(String(text).split(NAME_BLANK).join('你的名字')); return; }
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

// 初級「有講話就給部分對」的專屬語音：先播一句通用肯定語，唸完接原本步驟的「可以這樣說」示範音檔。
// 肯定語全站共用同一句、同一個檔案，不必比照 playFeedbackAudio 逐步驟各錄一份。
const SPOKE_ACK_TEXT = '很棒，你有說出口！';
function playSpokeAckThenFeedback(demoText) {
  stopAllAudio();
  const proceed = () => playFeedbackAudio(demoText, 'failed');
  if (state.scenario?.isCustom) { tts.speak(SPOKE_ACK_TEXT, 0.85, proceed); return; }
  const candidates = ['audio/feedback/spoke_detected.mp3', 'audio/feedback/spoke_detected.wav'];
  let idx = 0;
  const tryNext = () => {
    if (idx >= candidates.length) { tts.speak(SPOKE_ACK_TEXT, 0.85, proceed); return; }
    const audio = new Audio(candidates[idx++]);
    _feedbackAudio = audio;
    audio.onended = () => { if (_feedbackAudio === audio) _feedbackAudio = null; proceed(); };
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

  // 掛在各場所底下的自訂情境（parentId）：場所卡要標「＋N 自訂」。
  // 先一次算好，別讓 42 張卡各自去 loadCustom() 一次。
  const customByParent = {};
  loadCustom().forEach(sc => {
    if (sc.parentId) (customByParent[sc.parentId] ||= []).push(sc);
  });

  // ⭐ 自訂分部列的是**場景卡**（2026-09-16 起，使用者定案）：自訂情境不再自己當一張大卡，
  // 而是條列在場景底下——與內建「便利商店 → 7 個情境」同一種讀法。
  // 舊資料（沒掛場所的自訂情境）在啟動時已由 migrateCustomsIntoScenes() 收進預設場景。
  const cardList = homePart === 'custom'
    ? loadCustomScenes().map(customSceneAsScenario)
    : SCENARIOS_DATA.scenarios.filter(sc => (SCENARIO_PART[sc.id] || 1) === Number(homePart));

  cardList.forEach(scenario => {
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

    const attachedCount = customByParent[scenario.id]?.length || 0;
    const isScene  = !!scenario.isCustomScene;    // 老師自己建的場景卡
    const isCustom = scenario.isCustom;
    const stepLabel = isScene
      ? `${attachedCount} 種情境`                  // 場景本身沒有內建情境，數的就是老師加的那些
      : (scenario.situations
          ? `${scenario.situations.length} 種情境`
          : ((scenario.steps?.length ?? 0) > 0 ? `${scenario.steps.length} 個對話步驟` : '即將推出'))
        + (attachedCount ? ` ＋${attachedCount} 自訂` : '');
    // 商店場景圖：鋪在卡片最底層當背景，載入失敗則移除→退回 emoji 圖示。
    // 自訂情境沒有專屬場景，用自訂情境示意圖（這裡只會有獨立的自訂情境，掛在場所下的不列）。
    // 場景卡**不鋪底圖**：42 個內建場所各有自己的照片，自訂的只有同一張示意圖——
    // 兩三張場景卡鋪上去會長得一模一樣，反而分不出誰是誰。改成顯示老師選的圖示＋自己的顏色。
    const sceneImg = isScene ? null
                   : isCustom ? CUSTOM_SCENE_IMAGE
                   : `images/scenes/${scenario.id}.webp`;

    card.innerHTML = `
      ${sceneImg ? `<img class="card-bg-img" src="${sceneImg}" alt="" aria-hidden="true">` : ''}
      <div class="card-content">
        <div class="card-icon-wrap">
          <span class="card-icon">${scenario.icon || CUSTOM_ICON}</span>
        </div>
        <div class="card-title-row">
          <span class="card-name">${scenario.name}</span>
          <span class="card-steps">📝 ${stepLabel}</span>
        </div>
        <span class="card-badge ${scenario.available === false ? 'coming-soon' : ''}">
          ${isScene ? (attachedCount ? '開始練習 →' : '加入第一個情境 →')
                    : isCustom ? '自訂情境 →' : scenario.available === false ? '即將推出' : '開始練習 →'}
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

    // 場景卡（老師自己建的）右上角：✏️ 改名字／換圖示、🗑️ 刪掉整個場景。
    // 內建場所沒有這兩顆——那 42 個不是老師的東西，改不得也刪不得。
    if (isScene) {
      // ⚠️ 卡片骨架是 innerHTML 組的，場景名稱是老師打的字 → 這裡改用 textContent 覆寫一次
      const nameEl = card.querySelector('.card-name');
      if (nameEl) nameEl.textContent = scenario.name;

      const mk = (cls, label, title, onClick) => {
        const b = document.createElement('button');
        b.className = cls;
        b.type = 'button';
        b.title = title;
        b.setAttribute('aria-label', `${title}：${scenario.name}`);
        b.textContent = label;
        b.addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); onClick(); });
        return b;
      };
      wrap.appendChild(mk('scene-admin-btn scene-edit-btn', '✏️', '編輯這個場景',
                          () => openSceneModal(scenario.id)));
      wrap.appendChild(mk('scene-admin-btn scene-del-btn', '🗑️', '刪除這個場景',
                          () => { if (deleteCustomScene(scenario.id)) renderHome(); }));
    }

    grid.appendChild(wrap);
  });

  // 「➕ 建立場景」入口卡：僅在「⭐ 自訂」分部顯示。
  // **排第一個**（2026-09-15 使用者要求）：原本接在所有卡片後面，數量一多就要捲到最後才找得到。
  // 2026-09-16 起建立的是「場景」（情境改在場景裡面加），所以文案一併換掉。
  if (homePart === 'custom') {
    const addWrap = document.createElement('div');
    addWrap.className = 'scenario-card-wrap';
    const addCard = document.createElement('button');
    addCard.className = 'scenario-card scenario-card-add';
    addCard.setAttribute('aria-label', '建立自訂場景');
    addCard.innerHTML = `
      <div class="card-icon-wrap"><span class="card-icon">➕</span></div>
      <span class="card-name">建立場景</span>
      <span class="card-steps">🧑‍🏫 老師自編：先建場景，再加情境</span>
      <span class="card-badge">建立新場景 →</span>
    `;
    addCard.addEventListener('click', () => { sfx.click(); openSceneModal(null); });
    addWrap.appendChild(addCard);
    grid.prepend(addWrap);
  }

  showScreen('screen-home');
}


// ─── 開始情境 ────────────────────────────────────────

function startScenario(scenario) {
  refreshAudioPackBtn(scenario);   // 📥／✅ 依「這個場所」有沒有下載過（原本換場所後一直停在 ✅）
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
  // 掛在場所底下的自訂情境：state.scenario 仍是自訂情境自己（做法二），
  // 父場所只用於標題、主題色與「上一頁」要回哪裡。
  state.parentScenario = getParentScenario(scenario);
  state.situation = null;
  state.situationBase = null;
  state.results   = [];
  state.scaffoldMode = false;   // 選新場景時先歸零，只有走鷹架入口才啟用
  // 瀏覽器不支援語音輸入（如部分 iPad Safari）時，預設改用選項模式
  state.inputMode = recognizer.supported ? 'voice' : 'options';

  const theme = state.parentScenario?.theme
             || scenario.theme
             || { color: '#2563EB', bg: '#EFF6FF', accent: '#1D4ED8' };
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
      icon: scenario.icon || CUSTOM_ICON,
      desc: '',
      steps: scenario.steps,
    });
    return;
  }

  const sitIcon = document.getElementById('sit-icon');
  sitIcon.textContent      = scenario.icon || CUSTOM_ICON;
  sitIcon.style.background = 'transparent';   // emoji 圖示不加底色
  document.getElementById('sit-name').textContent = scenario.name;

  renderSituationOptions();
  showScreen('screen-situation');
}

// ── 簡易版要練哪幾步：練「3 步實質內容」，第 1 步若是純打招呼就不佔額度 ──────────
// 2026-09-05：招呼獨立成第一步之後，招呼若也算進那 3 步，情境核心會被擠出簡易版——
// 「點錯了要改」會變成招呼→點餐→回答飲料，唯獨沒有「請店員更改」那一步。
// 2026-09-27 使用者定：一律取「前 3 步」會漏重點（購物類沒付到錢、防詐類沒講到告訴家人／打 165），
// 情境可以在 data/scenarios.js 寫 simple_steps（步驟 id 清單，可跳著挑）指定這 3 步；沒寫的照舊取前 3 步。
// 挑選清單與理由：docs/簡易版重點三步_建議清單.md。
// ⚠️ 唯一定義處＝simpleSteps()；不要在呼叫點自己寫 slice(0, 3)——那就是第二份定義。
const SIMPLE_CORE_STEPS = 3;
const GREETING_ONLY_RE = /^(你好|您好|老闆好|老闆你好|藥師好|阿姨好|叔叔好|早安|午安|哈囉|嗨|hi)$/i;
function isGreetingOnlyStep(step) {
  const ans = (step && (step.options && step.options[0]) ) ||
              (step && (step.accepted_phrases && step.accepted_phrases[0])) || '';
  return GREETING_ONLY_RE.test(String(ans).replace(/[！!，,。.？?、\s]/g, ''));
}
function simpleSteps(sit) {
  const list = (sit && sit.steps) || [];
  const lead = isGreetingOnlyStep(list[0]) ? [list[0]] : [];
  const ids  = Array.isArray(sit && sit.simple_steps) ? sit.simple_steps : null;
  if (ids) {
    // 照原本的先後順序排（不照 simple_steps 的寫法順序）；有 id 對不到＝資料寫錯，退回前 3 步並警告
    const picked = list.filter(s => ids.includes(s.id) && !lead.includes(s));
    if (picked.length === ids.length) return [...lead, ...picked];
    console.warn('[simple_steps] 有步驟 id 對不到，改取前 3 步：', sit.id, ids);
  }
  return list.slice(0, Math.min(SIMPLE_CORE_STEPS + lead.length, list.length));
}

function renderSituationOptions() {
  const container = document.getElementById('situation-options');
  container.innerHTML = '';
  (state.scenario.situations || []).forEach(sit => {
    // 完整版／簡易版在難度頁才選（2026-09-23），情境卡一律顯示完整步數
    const stepCount = sit.steps.length;
    const badge = '';
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

    // ✏️ 編輯這個情境的對話內容（判定編輯器：學生要說的話、哪些說法算答對、選項）。
    // 2026-09-15 使用者要求：這個位置原本是 📖 小百科，改成跟下方自訂情境卡一樣的 ✏️；
    // 難度頁底部那顆「✏️ 編輯這個對話的內容」同時移除（入口收斂到這裡）。小百科仍在練習頁。
    // ⚠️ 卡片本身是 <button>，按鈕不能巢狀 → 包一層 .sit-card-wrap、✏️ 絕對定位浮上去。
    const wrap = document.createElement('div');
    wrap.className = 'sit-card-wrap';
    wrap.appendChild(card);
    const editBtn = document.createElement('button');
    editBtn.className = 'sit-edit-btn';
    editBtn.type = 'button';
    editBtn.textContent = '✏️';
    editBtn.title = '編輯這個情境的對話內容';
    editBtn.setAttribute('aria-label', `編輯 ${sit.name} 的對話內容`);
    editBtn.addEventListener('click', e => {
      e.stopPropagation();        // 別讓事件冒泡到卡片而直接開始練習
      sfx.click();
      openKeywordEditor(state.scenario.id, sit.id);
    });
    wrap.appendChild(editBtn);
    container.appendChild(wrap);
  });

  renderAttachedCustomSituations(container);
}

// 內建情境之後，接上掛在這個場所底下的自訂情境，最後一張是「➕ 自訂情境」入口卡。
// ⚠️ 絕不可把自訂情境 push 進 `state.scenario.situations`——那是 SCENARIOS_DATA 常數裡的
//    陣列，push 進去會永久污染記憶體中的內建資料，症狀是切出去再切回來卡片越積越多
//    （同型事故：B6 `_pickMissions` 忘了淺拷貝而污染 B6_MISSIONS，見主 CLAUDE.md）。
//    這裡只是「另外再接一段 DOM」，原陣列一個字都沒碰。
function renderAttachedCustomSituations(container) {
  const scenario = state.scenario;
  if (!scenario || scenario.isCustom) return;   // 自訂情境本身沒有這一層

  customsOfParent(scenario.id).forEach(({ sc, idx }) => {
    const total     = sc.steps?.length || 0;
    const stepCount = total;   // 完整版／簡易版在難度頁才選，情境卡一律顯示完整步數
    const badge = '';

    // 卡片本身是 <button>，✏️ 不能巢狀在裡面（HTML 不合法）→ 同 renderHome 的店員鈕，
    // 用 wrapper 包起來、✏️ 絕對定位浮在右上角。
    const wrap = document.createElement('div');
    wrap.className = 'sit-card-wrap';

    const card = document.createElement('button');
    card.className = 'situation-card situation-card-custom';
    card.innerHTML = `
      <div class="sit-card-header">
        <span class="sit-icon">${sc.icon || CUSTOM_ICON}</span>
        <span class="sit-name"><span class="sit-name-text"></span>${badge}</span>
      </div>
      <p class="sit-desc">老師自編的練習 <span style="color:var(--gray-600);font-size:0.8em">（${stepCount} 步驟）</span></p>
    `;
    // ⚠️ 情境名稱是老師打的字 → textContent，不跟著進 HTML 字串
    card.querySelector('.sit-name-text').textContent = sc.name || '未命名情境';
    // 點進去練習的是自訂情境**自己**（state.scenario 換成它），
    // 所以 isCustom 要補上——loadCustom() 存的資料沒有這個旗標，是 getAllScenarios 才加的。
    card.addEventListener('click', () => { sfx.click(); startScenario({ ...sc, isCustom: true }); });
    wrap.appendChild(card);

    const editBtn = document.createElement('button');
    editBtn.className = 'sit-edit-btn';
    editBtn.type = 'button';
    editBtn.title = '編輯這個自訂情境';
    editBtn.setAttribute('aria-label', `編輯 ${sc.name || '自訂情境'}`);
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.click();
      openScenarioEditor(idx);
    });
    wrap.appendChild(editBtn);

    // 🗑️ 刪除（就在 ✏️ 旁邊）：內建情境沒有這顆，只有老師自己編的才刪得掉。
    // 刪掉之後這一頁要重畫（少一張卡），不能只把節點移走——索引會跟著錯位。
    const delBtn = document.createElement('button');
    delBtn.className = 'sit-del-btn';
    delBtn.type = 'button';
    delBtn.title = '刪除這個自訂情境';
    delBtn.setAttribute('aria-label', `刪除 ${sc.name || '自訂情境'}`);
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.click();
      if (deleteCustomScenario(sc)) renderSituationOptions();
    });
    wrap.appendChild(delBtn);
    wrap.classList.add('has-del');

    container.appendChild(wrap);
  });

  const addCard = document.createElement('button');
  addCard.className = 'situation-card situation-card-add';
  addCard.innerHTML = `
    <div class="sit-card-header">
      <span class="sit-icon">➕</span>
      <span class="sit-name">自訂情境</span>
    </div>
    <p class="sit-desc">在【${scenario.name}】底下自己編一段對話（老師用）</p>
  `;
  addCard.addEventListener('click', () => {
    sfx.click();
    openScenarioEditor(-1, { parentId: scenario.id });
  });
  container.appendChild(addCard);
}

// 鷹架模式總開關：目前先關閉（功能尚未成熟，只開放初/中/高級難度）。
// 之後要重新啟用，把此旗標改回 true 即可；相關程式（階梯/照念/自己說）都保留。
// 🔴 這支旗標管「句框這一族」的全部入口（2026-09-19 使用者定，一起關、日後一起開）：
//   ① 鷹架模式本身（isScaffoldPilot）＝自動褪除階梯 L6→L1
//   ② 學生練習頁的「🧱 詞庫排序」按鈕（setInputMode；靠句框切詞才出現，全站 57 步有）
//   ③ 自訂情境步驟編輯器的「看圖造句句框」欄位（openStepEditor）
// 關的只是入口，資料與程式碼都保留：老師既有的 frame 照常回填、儲存，內建步驟的 frame_ref 不動。
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
  state.situationFull = state.scenario?.isCustom
    ? situation
    : applyStepOverrides(state.scenario.id, situation.id, situation);
  state.situationPicked = situation;
  resetSetup();
  applyStepMode();

  // 難度選擇頁（鷹架卡置頂＋初/中/高級）。鷹架模式只在各場所「主情境」顯示。
  document.getElementById('diff-icon').textContent = state.scenario.icon || CUSTOM_ICON;

  const showScaffold = isScaffoldPilot(state.scenario, situation);
  document.getElementById('diff-scaffold-card').hidden = !showScaffold;
  // 有鷹架時它是首選（讓出「推薦」高亮）；沒有鷹架時中級維持推薦
  document.getElementById('diff-scaffold-card').classList.toggle('diff-card--recommended', showScaffold);
  renderSetup();

  // 練習頁的小百科鈕：這個情境沒有卡就不出現（自訂情境一律沒有）
  const tipsFab = document.getElementById('btn-tips-fab');
  if (tipsFab) tipsFab.hidden = !hasTipCard(state.scenario, state.situation);

  // unit＝IEP 目標的單元代號（學習歷程的生活情境用「場景|情境」），學生列下方列出這位學生在這個情境的 IEP 目標
  if (window.StudentPicker) StudentPicker.mount('diff-student-picker-slot', { unit: `${state.scenario.id}|${situation.id}` });

  showScreen('screen-difficulty');
}

// 完整版／簡易版（難度頁上的切換鈕；2026-09-23 從情境頁移過來）：
// 依 state.simpleMode 從 situationFull 截出要練的步驟，並更新標題列的名稱與步數。
function applyStepMode() {
  const full = state.situationFull;
  if (!full) return;
  const simpleList = simpleSteps(full);
  const canSimplify = full.steps.length > simpleList.length;
  const simple = state.simpleMode && canSimplify;
  // 簡易版：只練重點那幾步（招呼不佔額度，見 simpleSteps）
  const steps = simple ? { ...full, steps: simpleList } : full;
  state.situation = steps;
  state.situationBase = steps;   // 名字還沒帶入的版本；開始練習時才依當下選的學生帶入（難度頁還能換學生）
  const sit = state.situationPicked || full;
  const label = (state.parentScenario
    ? scenarioDisplayName(state.scenario)                       // 便利商店・合作社買午餐
    : `${state.scenario.name}・${sit.name}`)                    // 便利商店・基本購物
    + (simple ? '（簡易）' : '');
  document.getElementById('diff-name').textContent = label;
  document.getElementById('diff-steps').textContent = `${steps.steps.length} 個對話步驟`;
  // ⚠️ 只限練習範圍那一列：設定頁的難度／作答方式／切換鈕也借用 .sit-mode-btn 樣式，抓全部會一起被點亮（2026-09-27）
  document.querySelectorAll('#sit-mode-row .sit-mode-btn').forEach(b =>
    b.classList.toggle('active', (b.dataset.mode === 'simple') === state.simpleMode));
}

// 鷹架模式入口：系統主導，起始 L5（看圖 4 卡・中級），依表現自動褪除/加回鷹架，終點是開口說
function startScaffoldMode() {
  state.scaffoldMode = true;
  state.assistMode = false;
  state.lockInputMode = false;
  startWithDifficulty('normal');
}

// ── 設定頁（2026-09-27 使用者定，比照金錢核心 24 單元）──────────────────
// 練習範圍／難度／作答方式／能不能切換，選好按「開始練習」才開始。
const SETUP_KEY = 'sp_setup';
const SETUP_DIFF_DESC = {
  easy:   '有開口說話就給鼓勵；講到關鍵詞才算答對。畫面上直接顯示「你可以這樣說」。適合剛開始練習開口。',
  normal: '說到關鍵詞就算對，不必一字不差。⭐ 推薦：大部分學生從這裡開始。',
  hard:   '重點要講對，句子也要說完整；只講重點算部分對。',
};
const SETUP_MODE_DESC = {
  voice:   '按「點我說話」對著麥克風說，系統聽完判斷說得對不對。',
  echo:    '先聽示範、再跟著念，念完可以聽自己的錄音並自己評分。沒有語音辨識的瀏覽器也能用。',
  tapread: '標準答案拆成一顆顆字，照順序點，系統唸一個字、學生跟著念一個字。',
  options: '從幾個說法裡選出正確的那一句。',
  text:    '把要說的話打出來。',
};
// 2026-09-27 使用者定：練習範圍／作答方式**不預選**（每選一個新情境都重來）；難度預設「普通」（按鈕標 ⭐ 推薦）、
// 「固定這個方式」預設選好。三項都選了「開始練習」才按得下去。所以也不再記住上次的選擇（第一版存過 sp_setup，這裡順手清掉）。
const setup = { difficulty: 'normal', inputMode: null, lock: true, assist: false };
try { localStorage.removeItem(SETUP_KEY); } catch (e) {}
function resetSetup() {
  setup.difficulty = 'normal'; setup.inputMode = null; setup.lock = true; setup.assist = false;
  state.simpleMode = null;   // null＝還沒選（applyStepMode 當完整版算步數，但兩顆都不亮）
}

// 這台能不能用「說話」由 recognizer 決定：不能用時畫面顯示成「跟讀」（setInputMode 也是這樣退）
// 輔助點擊只給「簡單」難度（2026-09-30 使用者定），開著時作答方式一律是「選擇對話」
function setupAssistOn() { return setup.assist && setup.difficulty === 'easy'; }

function setupEffectiveMode() {
  return (setup.inputMode === 'voice' && !recognizer.supported) ? 'echo' : setup.inputMode;
}

function renderSetup() {
  const mode = setupEffectiveMode();
  document.querySelectorAll('.setup-diff-btn').forEach(b => b.classList.toggle('active', b.dataset.level === setup.difficulty));
  const assistLocked = setupAssistOn();   // 輔助點擊開著＝作答方式固定「選擇對話」，其他鈕按不下去
  document.querySelectorAll('.setup-mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
    if (b.dataset.mode === 'voice') b.hidden = !recognizer.supported;
    b.disabled = assistLocked && b.dataset.mode !== 'options';
  });
  document.querySelectorAll('.setup-lock-btn').forEach(b => b.classList.toggle('active', (b.dataset.lock === '1') === setup.lock));
  // ⚠️ 快取裡的舊 index.html 配新 script.js 時這幾格不存在 → 不畫、不丟錯（同 btn-*-x 的 ?. 定則）
  if (!document.getElementById('setup-diff-desc')) return;
  document.getElementById('setup-diff-desc').textContent = SETUP_DIFF_DESC[setup.difficulty] || '';
  // 練習範圍說明（2026-09-27 使用者要求）：步數跟著這個情境算，簡易版＝simpleSteps 實際挑出來的步數
  const rangeDesc = document.getElementById('setup-range-desc');
  if (rangeDesc) {
    const full = state.situationFull;
    const total = full ? full.steps.length : 0;
    const easyN = full ? simpleSteps(full).length : 0;
    rangeDesc.textContent = state.simpleMode == null ? ''
      : total <= easyN ? `這個情境只有 ${total} 步，簡易版和完整版練的一樣。`
      : state.simpleMode ? (isGreetingOnlyStep(full.steps[0])
          ? `先打招呼，再練習這個情境的 ${easyN - 1} 個重點（共 ${easyN} 步），適合剛開始練習或時間比較短的時候。`
          : `只練習這個情境的 ${easyN} 個重點（共 ${easyN} 步），適合剛開始練習或時間比較短的時候。`)
      : `從頭到尾練習整個情境的完整對話（共 ${total} 步）。`;
  }
  // 學生語音只影響「選擇對話」的選項朗讀 → 只在選了這個作答方式時出現（2026-09-28 從主頁金好聊彈窗搬來）
  const voiceSec = document.getElementById('setup-student-voice');
  if (voiceSec) {
    const show = mode === 'options';
    if (show && voiceSec.hidden) renderUserVoiceSelector();
    voiceSec.hidden = !show;
  }
  // 輔助點擊在難度框內、只給「簡單」；開著就一定是選擇對話＋固定作答方式（練習中切去說話／打字，輔助點擊就沒意義）→ 能不能切換那一項收起來
  const assistOn  = assistLocked;
  const assistSec = document.getElementById('setup-assist');
  if (assistSec) {
    assistSec.hidden = setup.difficulty !== 'easy';
    document.querySelectorAll('.setup-assist-btn').forEach(b => b.classList.toggle('active', (b.dataset.assist === '1') === setup.assist));
    document.getElementById('setup-assist-desc').textContent = setup.assist
      ? // 後半句與 24 單元共用的說明同一句（js/learning-tracker.js 的 ASSIST_NOTE），改字兩邊一起改
      '點畫面任何地方，系統就替學生選擇正確的選項回答。適合口語表達困難或障礙程度較重的學生。練習紀錄會標上 👆 符號（代表輔助點擊），老師看得出這次是系統幫忙完成的，所以不算「🌟 無錯通過」，也不算「已經學會」。'
      : '學生自己點選答案。';
  }
  const lockSec = document.getElementById('setup-lock');
  if (lockSec) lockSec.hidden = assistOn;
  document.getElementById('setup-mode-desc').textContent = assistOn ? '輔助點擊開啟中，作答方式固定為「🔘 選擇對話」。' : mode ? SETUP_MODE_DESC[mode]
    + (setup.inputMode === 'voice' && !recognizer.supported ? `（${voiceUnsupportedReason()}）` : '') : '';
  const modeName = mode ? document.querySelector(`.setup-mode-btn[data-mode="${mode}"]`)?.textContent || '' : '';
  document.getElementById('setup-lock-desc').textContent = setup.lock
    ? (modeName ? `練習頁下方不顯示切換列，只用「${modeName}」作答。` : '練習頁下方不顯示切換列，只用上面選的作答方式。')
    : '練習頁下方有作答方式切換列，學生可以自己切換。';
  // 三項都選了才能開始；還沒選的列出來，老師知道差哪一項
  const missing = [!setup.difficulty && '難度', state.simpleMode == null && '練習範圍', !mode && '作答方式'].filter(Boolean);
  const startBtn = document.getElementById('btn-setup-start');
  startBtn.disabled = missing.length > 0;
  const note = document.getElementById('setup-missing');
  if (note) note.textContent = missing.length ? `請先選擇：${missing.join('、')}` : '';
}

function startFromSetup() {
  if (state.simpleMode == null || !setup.difficulty || !setup.inputMode) return;
  state.scaffoldMode  = false;
  state.inputMode     = setup.inputMode;   // 不支援語音時由 setInputMode 退成跟讀
  state.assistMode    = setupAssistOn();
  state.lockInputMode = setup.lock || state.assistMode;
  startWithDifficulty(setup.difficulty);
}

function startWithDifficulty(difficulty) {
  // 自我介紹的步驟帶入目前學生的名字（每次開始都重算：學生可能在難度頁剛換人）
  if (state.situationBase) state.situation = personalizeSituation(state.situationBase, getCurrentStudent()?.name || '');
  state.difficulty = difficulty;
  state.stepIndex  = 0;
  state.results    = [];
  state.startTs    = Date.now();
  // 中途離開（2026-10-09）：上一次沒做完留下的草稿先存成中斷摘要，再開始這一次
  if (typeof dbFinalizeDialogueDraft === 'function') dbFinalizeDialogueDraft().catch(() => {});
  state.sessionId  = state.startTs * 1000 + Math.floor(Math.random() * 1000);   // 同 js/learning-tracker.js 的 sessionId 寫法
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

// 步驟圖卡：支援單張與多張並排。多張用於錢包內容（100 元＋50 元＝看得到兩張鈔票）。
// 第一張沿用 id="step-image"，教師自訂照片與既有樣式仍靠這個 id 定位。
// 2026-09-19 算式圖（使用者定）：陣列裡副檔名是圖片的才當圖，其餘當文字——
//   ["蘋果.png","+","蘋果.png","+","蘋果.png","=","105 元"] → 🍎 ＋ 🍎 ＋ 🍎 ＝ 105 元
//   ＋ − × ＝ ＜ ＞ 顯示成大符號，其他（「105 元」）顯示成粗體字。
// 金錢圖：紙鈔（100 元以上）要比錢幣大（使用者定）——紙鈔是 2:1 長方形，放進同一個正方框反而比錢幣小。
const STEP_IMG_RE = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i;
// 老師上傳的照片是 blob:／data: 網址，瀏覽器給的，**沒有副檔名**——不另外認就會掉進下面的
// 算式文字分支，整串網址被當文字印在畫面上（2026-09-19 使用者回報：自訂情境上傳照片顯示 blob:http://…）
const STEP_OBJ_RE = /^(blob:|data:image\/)/i;
const STEP_OP_MAP = { '+': '＋', '＋': '＋', '-': '－', '−': '－', '－': '－', 'x': '×', '×': '×', '=': '＝', '＝': '＝', '<': '＜', '＜': '＜', '>': '＞', '＞': '＞' };
function renderStepImages(srcs, alt, label) {
  const card = document.getElementById('step-image-card');
  const row  = document.getElementById('step-image-row');
  const lbl  = document.getElementById('step-image-label');
  row.innerHTML = '';
  if (!srcs.length) { card.hidden = true; lbl.textContent = ''; card.classList.remove('multi', 'many', 'equation', 'single-money'); return; }
  let imgCount = 0, moneyCount = 0, billCount = 0, hasOp = false;
  srcs.forEach(src => {
    // 「圖片路徑::說明」＝圖的正下方加一行小字（算式裡每個商品下面寫單價，使用者定 2026-09-19：菠蘿麵包下方寫 25 元）
    // ⚠️ blob:／data: 既不切「::」也不看副檔名：那是老師上傳的照片，網址由瀏覽器產生、不帶說明文字
    const raw   = String(src);
    const isObj = STEP_OBJ_RE.test(raw);
    let [s, cap] = isObj ? [raw, ''] : raw.split('::').map(x => x.trim());
    // 2026-09-26 使用者定：金錢圖一律在下方標金額（「10 元」）；硬幣改用反面（印面額數字那面）。資料寫了「::說明」就照資料。
    const mny = !isObj && s.match(/money\/(\d+)_yuan_front\.png/);
    if (mny) {
      if (+mny[1] < 100) s = s.replace('_yuan_front.png', '_yuan_back.png');
      if (!cap) cap = `${mny[1]} 元`;
    }
    if (!isObj && !STEP_IMG_RE.test(s)) {
      const sp = document.createElement('span');
      if (STEP_OP_MAP[s]) { sp.className = 'step-eq-op'; sp.textContent = STEP_OP_MAP[s]; hasOp = true; }
      else { sp.className = 'step-eq-text'; sp.textContent = s; }
      row.appendChild(sp);
      return;
    }
    const im = document.createElement('img');
    if (imgCount === 0) im.id = 'step-image';
    imgCount++;
    const money = s.match(/money\/(\d+)_yuan/);
    if (money) { const isBill = +money[1] >= 100; im.classList.add(isBill ? 'money-bill' : 'money-coin'); moneyCount++; if (isBill) billCount++; }
    im.src = s;
    im.alt = alt;
    // 單張載入失敗＝整張卡收掉；多張時只收掉壞的那張，其餘照顯示
    im.onerror = () => { im.remove(); if (!row.children.length) card.hidden = true; };
    if (cap) {
      const item = document.createElement('span');
      item.className = 'step-eq-item';
      const c = document.createElement('span');
      c.className = 'step-eq-cap';
      c.textContent = cap;
      item.append(im, c);
      row.appendChild(item);
    } else {
      row.appendChild(im);
    }
  });
  lbl.textContent = label;
  card.hidden = false;
  card.classList.toggle('multi', imgCount > 1 || hasOp);
  // many＝「數硬幣」的十格框排法（一行 5 個，style.css）。⚠️ **有紙鈔就不能套**：格子是 48／72px 的
  // 正方形，2:1 的紙鈔 contain 進去會被縮到比硬幣還小；紙鈔改走 .multi 的自動換行，維持 2:1 的大小。
  // （2026-09-20 領薪水「當面數一下 3800 元」＝7 張鈔票時發現，既有的 10 枚 10 元硬幣不受影響）
  card.classList.toggle('many', imgCount >= 6 && !hasOp && billCount === 0);
  card.classList.toggle('equation', hasOp);
  // 單張商品圖：桌機 300×300、其他裝置依版面縮放（使用者定 2026-09-19，只限商品圖）；單張錢維持原本大小
  card.classList.toggle('single-money', imgCount === 1 && moneyCount === 1 && !hasOp);
}

function renderStep() {
  const step  = state.situation.steps[state.stepIndex];
  const total = state.situation.steps.length;

  // 這一步結尾會自動播店員台詞，所以先確保麥克風不是開著的——
  // 上一步若按了麥克風卻改用選項作答，Android 那邊麥克風還握著音訊焦點，台詞就播不出來。
  recognizer.stop();
  stopListeningUI();

  // 進度列（含當前步驟：第一步就看得到進度，較有「正在前進」的感覺）
  document.getElementById('progress-fill').style.width =
    (((state.stepIndex + 1) / total) * 100) + '%';
  document.getElementById('step-counter').textContent =
    `${state.stepIndex + 1} / ${total}`;
  renderPracticeStudentAvatar();

  // 店員頭像優先序：子情境專屬圖(clerkImage) ＞ 場景店員(SCENARIO_CLERK_MAP 覆寫，如小晴/小芸) ＞ 語音推斷
  const avatarEl   = document.getElementById('shopkeeper-avatar');
  const scMap      = SCENARIO_CLERK_MAP[state.scenario?.id];
  const voiceInfo  = voiceManager.selectedInfo
                  || (voiceManager.selected ? voiceManager.getInfo(voiceManager.selected) : null);
  // 自訂情境：用老師挑的泛用店員（無 scMap），排在 voiceInfo 之前——否則會顯示首頁選的
  // 那位內建店員（例如便利商店小美），與情境無關。老師上傳的場景照片仍會在下方覆蓋掉。
  const genericClerk = state.scenario?.isCustom ? getCustomClerk(state.scenario) : null;
  const avatarImg  = step.clerkImage || state.situation.clerkImage || scMap?.image || genericClerk?.image || voiceInfo?.image;
  const avatarName = step.clerkName  || state.situation.clerkName  || scMap?.name  || genericClerk?.name  || voiceInfo?.name || '店員';
  if (avatarImg) {
    avatarEl.innerHTML = `<img src="${avatarImg}" alt="${avatarName}">`;
    // 圖檔缺失時退回場景店員圖，再退回 emoji（避免破圖）。
    // 自訂情境不退回 voiceInfo 的圖——那是首頁選的內建店員，與這個情境無關。
    avatarEl.querySelector('img').onerror = () => {
      const fb = scMap?.image || (genericClerk ? null : voiceInfo?.image);
      if (fb && fb !== avatarImg) avatarEl.innerHTML = `<img src="${fb}" alt="${avatarName}">`;
      else avatarEl.textContent = genericClerk ? GENDER_AVATAR[genericClerk.gender] : voiceManager.getAvatar();
    };
  } else {
    avatarEl.textContent = genericClerk ? GENDER_AVATAR[genericClerk.gender] : voiceManager.getAvatar();
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
  // 旁白＋店員台詞的混合句分兩行顯示（2026-10-01 使用者要求：「（情境敘述）你好！歡迎光臨！」的台詞從新的一行開始）。
  // 分段與先後走 promptPhases／splitPrompt，與彈窗、播放順序一致；純旁白或純台詞照原文一行。
  document.getElementById('shopkeeper-speech-text').textContent = bubbleText(step.shopkeeper_prompt);

  // 商品圖片：教師自訂照片(IndexedDB) ＞ scenarios.js 內建 image
  // step.image 可以是字串（單張）或**陣列**（多張並排）。陣列用於「錢包裡有什麼」——
  // 一張 100 元＋一個 50 元要看得到兩張實體鈔票，學生才數得出 150 元（合成圖的話每種組合都得另外生一張）。
  renderStepImages(Array.isArray(step.image) ? step.image : (step.image ? [step.image] : []),
                   step.image_label || step.task || '商品圖示', step.image_label || '');
  // 教師自訂步驟照片（IndexedDB）優先顯示（即使沒有內建 image 也會出現）
  if (_rScId && step.id) {
    resolveCustomImageURL(`${_rScId}::${step.id}::img`).then(url => {
      if (!url || state.scenario?.id !== _rScId || state.stepIndex !== _rIdx) return;
      renderStepImages([url], step.image_label || step.task || '照片', step.image_label || '');
    });
  }

  // 任務
  document.getElementById('task-text').textContent = step.task;

  // 重置狀態。這一步已經有紀錄（按「上一步」回來、或回來後再往下走）就從紀錄接續累計，
  // 不歸零——否則重答會把之前的作答次數／開口次數／提示紀錄蓋掉，老師端少算。
  const prevRec = (state.results || [])[state.stepIndex];
  state.failCount    = 0;
  state.hintLevel    = 0;
  state.stepAttempts = prevRec?.attempts || 0;       // 本步驟作答次數（重試累計，IEP 紀錄用）
  state.stepSpoke    = prevRec?.spoke    || 0;       // 本步驟「有收到語音」的次數（開口參與度，只在語音模式累計）
  state.stepNoVoice  = prevRec?.noVoice  || 0;       // 本步驟「沒收到語音」的次數（太小聲／沒開口／收音問題）
  state.stepHintUsed = !!prevRec?.hintUsed;          // 本步驟是否用過提示
  state.stepHintSelf = prevRec?.hintSrc === 'self';  // 其中學生自己按過（💡 主動提示）
  state.stepHintAuto = (prevRec?.hintSrcs || [prevRec?.hintSrc]).includes('auto');   // 其中連錯 3 次系統自動跳出過
  hideFeedback();
  hideActionRow();

  // 標題列：場景圖示 + 「場景・練習情境」，例如「早餐店・基本點餐」（不再顯示難度）
  document.getElementById('ph-scene-icon').textContent = state.scenario?.icon || CUSTOM_ICON;
  document.getElementById('ph-scene-name').textContent = state.parentScenario
    ? scenarioDisplayName(state.scenario)
    : `${state.scenario?.name || ''}・${state.situation?.name || ''}`;

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
  // 初級已有「你可以這樣說」提示框（含喇叭），任務框（連同裡面的提示鈕）整個藏起來；中/高級每步從「提示」開始
  document.getElementById('btn-hint-trigger').hidden = (state.difficulty === 'easy');
  syncHintBtn();
  hideHint();

  // 設定輸入模式：
  // ・鷹架模式：由 promptLevel 階梯決定（看圖造句→詞庫→選項→照念→自己說），學生不手動切。
  // ・自由模式：預設「跟讀」(開口練習)；學生可手動切看圖造句/詞庫/選擇/打字並沿用。
  if (state.scaffoldMode) {
    applyScaffoldMode(resolveLadderMode(step) || 'options', step);
  } else {
    setInputMode(state.inputMode);
  }
  if (state.assistMode) assistStart();

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
      if (label) label.textContent = '照著念一次：';
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
    if (label) label.textContent = '你可以這樣說：';
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

// 🔴 唸示範句的**唯一定義處**：提示彈窗、簡單難度的「你可以這樣說」喇叭、跟讀模式的
//「🔊 聽示範」與「🔁 再練一次」四處共用（使用者定 2026-09-19：同一種說法、同一個聲音，
// 學生才不會以為任務說明與示範句是兩個不同的東西）。原本三處各自組字、跟讀還另走學生音色。
// 前面帶「你可以這樣說，」是刻意的：只唸答案，學生會分不出那是要他複誦還是店員在講話。
function speakModelSentence(step) {
  const sentence = echoModelSentence(step);
  if (sentence) speakHint(`你可以這樣說，${sentence}`);
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
    speakModelSentence(step);                 // 與「🔊 聽示範」完全相同的說法與聲音
    return;
  }
  handleResult(sentence, { score: rate, detected: [], selfRated: true });
}

// ─── 逐字朗讀（2026-09-25 使用者定）──────────────────────
// 給低功能學生：標準答案拆成一顆顆字，**只能照順序點**（只有下一顆會亮，點到別顆就輕輕搖一下、
// 下一顆閃一下提醒，不出聲、不記錯）；點一顆唸一顆，學生跟著念。點完最後一顆唸整句，
// 出現「✓ 我念完了」才記分——記成完成，模式標 tapread，老師端與系統評分分開看。
// 聲音＝即時語音，與「🔊 聽示範」同一支（bestTWVoice）。
//
// 切法（使用者選「逐字，少數黏一起」）：
//   ① 數字連同後面的單位一顆（「100元」唸一百元，不拆成 1、0、0）；英文字母一段一顆（L 號、ATM）
//   ② 輕聲字 的／了／得／著 黏在前一個字（單獨唸會變 dí／liǎo／dé／zháo）
//   ③ 單獨唸會唸錯音的詞整顆：店長、學長（zhǎng）、教我（jiāo）、為了／為您／為什麼（wèi）、重排（chóng）、禮貌地、歸還
//   ④「還」唸 huán 的地方沿用 TTS_HOMOPHONES（整句先換好「環」再切），規則不另寫一份
//   ⑤ 標點不做按鈕，只當間隔顯示
const TAPREAD_WORDS  = ['為什麼', '禮貌地', '店長', '學長', '教我', '為了', '為您', '重排', '歸還'];
const TAPREAD_UNIT   = '(?:公分|公斤|小時|分鐘|[元塊個本張杯包位號點分歲次天瓶份支件顆盒條碗片樓路班站趟人折枝雙])';
const TAPREAD_ATTACH = /^[的了得著]$/;

// 回傳 [{ text, speech, tap }]：tap=false 是標點（只顯示）。speech 是這一顆要唸的字（已套破音字）。
function tapReadUnits(sentence) {
  const src = String(sentence || '');
  // 整句先套破音字，對照表的替換都是一字換一字（還→環），長度不變，才能用同一組位置切
  const said = TTS_HOMOPHONES.reduce((t, [re, to]) => t.replace(re, to), src);
  const lead = new RegExp(`^(?:\\d+(?:[.,:]\\d+)?|[A-Za-z]+)\\s*${TAPREAD_UNIT}?`);
  const units = [];
  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    if (/^\s/.test(rest)) { i++; continue; }
    let len = 0, tap = true;
    const m = rest.match(lead);
    const w = TAPREAD_WORDS.find(x => rest.startsWith(x));
    if (m) len = m[0].length;
    else if (w) len = w.length;
    else if (/^[㐀-鿿]/.test(rest)) len = 1;
    else { len = 1; tap = false; }                      // 標點、符號
    const text = src.slice(i, i + len).replace(/\s+/g, '');
    const speech = said.slice(i, i + len).replace(/\s+/g, '');
    const prev = units[units.length - 1];
    if (tap && TAPREAD_ATTACH.test(text) && prev?.tap) { prev.text += text; prev.speech += speech; }
    else units.push({ text, speech, tap });
    i += len;
  }
  return units;
}

const tapRead = { units: [], next: 0, seq: 0, wholeSaid: false };

// 🔴「我念完了」的出現條件只看狀態：字都點完了、整句也唸過（開始唸就算）→ 之後**任何一段**語音唸完都叫出按鈕。
// 不可以只掛在「最後一顆 → 整句」那條串接的收尾上：學生點完馬上按「🔊 聽整句」（或再點一顆已點過的字），
// 新的一段語音會讓前一段的收尾作廢，按鈕就永遠不出來（2026-09-25 使用者回報）。
function tapReadMaybeDone() {
  if (tapRead.wholeSaid && tapReadNextIdx() < 0) document.getElementById('btn-tapread-done').hidden = false;
}

// 唸整句：「🔊 聽整句」與點完最後一顆的自動接續共用
function speakTapReadWhole() {
  const st = state.situation?.steps[state.stepIndex];
  if (!st) return;
  if (tapReadNextIdx() < 0) tapRead.wholeSaid = true;   // 字還沒點完就聽整句，不算數
  speakTapRead(echoModelSentence(st));
}

function speakTapRead(text, onEnd) {
  if (!text || !window.speechSynthesis) { onEnd?.(); return; }
  stopAllAudio();
  const my = ++tapRead.seq;
  const voice = bestTWVoice(null);                     // 與 speakHint（聽示範）同一支聲音
  const u = new SpeechSynthesisUtterance(toSpeechText(text));
  u.lang = voice?.lang || 'zh-TW';
  u.rate = 0.85;
  if (voice) u.voice = voice;
  let started = false, ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    if (my === tapRead.seq) onEnd?.();
    tapReadMaybeDone();                                // 被新語音蓋掉的那段也要檢查（見 tapReadMaybeDone）
  };
  u.onstart = () => { started = true; };
  u.onend = finish;
  u.onerror = finish;
  window.speechSynthesis.speak(u);
  ttsStallWatchdog(() => started, finish);            // 沒發聲也要往下走，不能卡住「我念完了」
}

function renderTapRead() {
  const step = state.situation?.steps[state.stepIndex];
  const box  = document.getElementById('tapread-tiles');
  if (!step || !box) return;
  tapRead.units = tapReadUnits(echoModelSentence(step));
  tapRead.next  = 0;
  tapRead.seq++;                                       // 上一步還在唸的收尾不再作數
  tapRead.wholeSaid = false;
  box.innerHTML = '';
  tapRead.units.forEach((u, idx) => {
    const el = document.createElement(u.tap ? 'button' : 'span');
    el.textContent = u.text;
    if (u.tap) {
      el.type = 'button';
      el.className = 'tapread-tile';
      el.dataset.idx = String(idx);
    } else el.className = 'tapread-punct';
    box.appendChild(el);
  });
  document.getElementById('btn-tapread-done').hidden = true;
  tapReadMarkNext();
}

// 下一顆要點的是第幾個（跳過標點）；全部點完回 -1
function tapReadNextIdx() {
  for (let k = tapRead.next; k < tapRead.units.length; k++) if (tapRead.units[k].tap) return k;
  return -1;
}

function tapReadMarkNext() {
  const nx = tapReadNextIdx();
  document.querySelectorAll('#tapread-tiles .tapread-tile').forEach(el => {
    const idx = Number(el.dataset.idx);
    el.classList.toggle('is-next', idx === nx);
    el.classList.toggle('is-done', idx < (nx < 0 ? Infinity : nx));
    el.setAttribute('aria-disabled', idx === nx ? 'false' : 'true');
  });
}

function handleTapReadTile(el) {
  const idx = Number(el.dataset.idx);
  const nx  = tapReadNextIdx();
  if (idx !== nx) {
    if (el.classList.contains('is-done')) {            // 點過的字可以再聽一次，不影響進度
      speakTapRead(tapRead.units[idx].speech);
      return;
    }
    // 還沒輪到：輕輕搖一下，下一顆閃一下提醒；不出聲、不記錯
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    const nEl = document.querySelector(`#tapread-tiles .tapread-tile[data-idx="${nx}"]`);
    if (nEl) { nEl.classList.remove('flash'); void nEl.offsetWidth; nEl.classList.add('flash'); }
    // 動畫結束要把 class 拿掉：.flash 會蓋掉「下一顆」的光暈動畫，留著光暈就不回來
    setTimeout(() => { el.classList.remove('shake'); nEl?.classList.remove('flash'); }, 1100);
    return;
  }
  tapRead.next = idx + 1;
  tapReadMarkNext();
  const last = tapReadNextIdx() < 0;
  speakTapRead(tapRead.units[idx].speech, last ? () => {
    // 最後一顆唸完 → 停一下把整句連起來唸，唸完才出現「我念完了」
    // （學生搶先按了「聽整句」就不再重唸一次）
    setTimeout(() => { if (!tapRead.wholeSaid) speakTapReadWhole(); }, 300);
  } : null);
}

function handleTapReadDone() {
  const step = state.situation?.steps[state.stepIndex];
  if (!step || tapReadNextIdx() >= 0) return;
  handleResult(echoModelSentence(step), { score: 'perfect', detected: [] });
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

  // 詞庫排序按鈕：只有本步驟能切詞（有可切詞的句框）時才出現；SCAFFOLD_ENABLED 關著就一律不出現
  const wbBtn = document.querySelector('.mode-btn[data-mode="wordbank"]');
  if (wbBtn) wbBtn.hidden = !SCAFFOLD_ENABLED || !buildWordBank(getStepFrame(step));

  // 切走語音模式時要把麥克風關掉：Android 上麥克風開著就一直握著音訊焦點，
  // 學生改用選項或打字後，店員語音會播不出來（同 SpeechRecognizer 的 Android 定則）。
  if (state.inputMode === 'voice' && mode !== 'voice') { recognizer.stop(); stopListeningUI(); }

  // AAC 模式強制使用選項，不允許切換
  if (document.body.classList.contains('aac-mode')) mode = 'options';
  // 不支援語音輸入的瀏覽器：改走「跟讀」（一樣要開口，只是改自評），不再直接退回選項
  if (mode === 'voice' && !recognizer.supported) mode = 'echo';
  // 句框入口關閉時，frame/wordbank 一律退回選項（renderWordBank 切不出詞時也會往回丟 'frame'）
  if (!SCAFFOLD_ENABLED && (mode === 'frame' || mode === 'wordbank')) mode = 'options';
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
  document.getElementById('tapread-row').hidden    = (mode !== 'tapread');
  // 離開跟讀模式一定要收掉錄音，否則麥克風會一直開著
  if (mode !== 'echo' && typeof echoRecorder !== 'undefined') echoRecorder.discard();

  // AAC 模式 / 鷹架模式時隱藏模式切換列（鷹架模式由系統主導輸入模式）
  const aacOn = document.body.classList.contains('aac-mode');
  document.querySelector('.mode-switcher').hidden = aacOn || state.scaffoldMode || state.lockInputMode;
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
  if (mode === 'tapread')  renderTapRead();
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
    if (opt === step.options[0]) btn.dataset.answer = '1';   // 輔助點擊找正解用（亂序後位置不固定）

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
      const isCorrect = opt === step.options[0]
        || (step.accepted_phrases || []).some(p => samePhrase(p, opt));
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


// ─── 輔助點擊（選擇對話專用，2026-09-30 使用者定）────────────────────
// 比照金錢 24 單元的「輔助點擊模式（單鍵操作）」：點畫面任何地方＝替學生按「下一個正確動作」，
// 那個目標先亮起來（.assist-target）。對話模組每一步固定三格，所以不維護 A 系列那種動作佇列，
// 每次點擊當下看畫面決定按什麼（assistTarget），不會因為狀態沒跟上而卡住：
//   店員彈窗開著 → 「繼續／知道了」；回饋彈窗開著 → 「下一步／完成」；其餘 → 正確選項（data-answer）。
// ・只攔練習頁；完成頁、設定頁照常操作。白名單：導覽列、「← 上一頁」、🏠。
// ・語音還在唸就不接受（學生一路點過去什麼都沒聽到＝白練）；但語音卡住超過 ASSIST_BUSY_MAX 就放行，免得整頁點不動。
// ・替學生按的是 target.click()，在學生真的點擊的事件裡同步呼叫 → 手機的手勢脈絡還在，選項語音不會被擋。
// ・紀錄每步標 assisted，teacher.html 的 flawlessOf／精熟判定排除它（見那邊的註解）。
const ASSIST_DEBOUNCE = 600;     // 同 A 系列 CLICK_MODE
const ASSIST_BUSY_MAX = 8000;
const ASSIST_STEP_WAIT = 700;    // renderStep 400ms 後才跳店員彈窗：這段空檔不讓學生直接選答案
let _assistLastClick = 0;
let _assistStepTs = 0;
let _assistTarget = null;
let _assistTargetTs = 0;
let _assistTimer = null;

function assistActive() {
  return state.assistMode && document.getElementById('screen-practice').classList.contains('active');
}

function assistTarget() {
  if (!document.getElementById('clerk-modal').hidden) return document.getElementById('btn-clerk-close');
  if (!document.getElementById('feedback-modal').hidden) return document.getElementById('btn-next');
  if (Date.now() - _assistStepTs < ASSIST_STEP_WAIT) return null;
  const grid = document.getElementById('options-grid');
  if (grid.hidden) return null;
  return grid.querySelector('.option-btn[data-answer="1"]:not(:disabled)');
}

function assistAudioBusy() {
  const playing = a => a && !a.paused && !a.ended;
  return playing(_shopkeeperAudio) || playing(_feedbackAudio) || playing(_userAudio)
      || !!window.speechSynthesis?.speaking;
}

// 亮起目前的目標；畫面沒在練習頁就全部熄掉並停掉計時器
function assistRefresh() {
  const active = assistActive();
  const t = active ? assistTarget() : null;
  if (t !== _assistTarget) {
    _assistTarget?.classList.remove('assist-target');
    t?.classList.add('assist-target');
    _assistTarget = t;
    _assistTargetTs = Date.now();
  }
  document.body.classList.toggle('dlg-assist', active);
  if (!state.assistMode) { clearInterval(_assistTimer); _assistTimer = null; }
}

function assistStart() {
  _assistStepTs = Date.now();
  if (!_assistTimer) _assistTimer = setInterval(assistRefresh, 200);
  assistRefresh();
}

document.addEventListener('click', e => {
  if (!assistActive() || !e.isTrusted) return;   // 程式觸發的（下面的 target.click()）放行
  if (e.target.closest('.site-nav, #btn-prev, #btn-back')) return;
  e.preventDefault();
  e.stopPropagation();
  const now = Date.now();
  if (now - _assistLastClick < ASSIST_DEBOUNCE) return;
  const t = assistTarget();
  if (!t) return;
  if (assistAudioBusy() && now - _assistTargetTs < ASSIST_BUSY_MAX) return;
  _assistLastClick = now;
  t.click();
  assistRefresh();
}, true);


// ─── 處理輸入（統一入口）────────────────────────────

// 依難度調整評分
function applyDifficultyRules(result, text, step) {
  // 初級：完全沒對到關鍵字，但只要有偵測到語音（開口說了什麼）→ 給「部分對」（鼓勵開口，但不算數）。
  // 重度障礙學生的門檻是「有沒有開口」，連音節長度寬鬆都太難，故不比對長度，只看有沒有講話。
  if (state.difficulty === 'easy' && result.score === 'failed' && text.trim().length > 0) {
    result = { score: 'partial', detected: [], spokeFallback: true };
  }
  // 初級：有對到關鍵字的結果升級為全對；上面「有講話但沒對到」的部分對不升
  //（否則只要開口就會被當全對，關鍵字比對形同虛設）
  if (state.difficulty === 'easy' && result.score !== 'failed' && !result.spokeFallback)
    return { ...result, score: 'perfect' };
  // 中級＝純關鍵字：沒對到關鍵字即答錯，不做寬鬆處理（此處不加料，直接回傳引擎結果）
  return result;
}

function evaluateInput(text, step) {
  // 高級＝完整語句：必要成分（關鍵詞＋數字）全中，再看與標準句的重合度決定全對／部分對。
  // 判定細節與設計理由見上方 judgeHardSentence。教師的關鍵字覆寫在高級也生效（①要用到 keywords）。
  if (state.difficulty === 'hard') return judgeHardSentence(text, withEffectiveKeywords(step));
  // 初級（有講就給部分對）/ 中級（關鍵字）：關鍵字比對 + 難度規則
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
    heardLabel.textContent = (result.selfRated || state.inputMode === 'tapread') ? '你念的句子'
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

  } else if (result.score === 'partial' && result.spokeFallback) {
    // 初級專屬：關鍵字沒對到，但有偵測到語音就先肯定「有開口」，再接原本的示範句語音，
    // 不算全對（不進精熟／連續答對，失敗次數照計，跟其他非全對結果一致）。
    resultEl.className   = 'feedback-result partial';
    resultEl.innerHTML   = '<span class="result-icon">👏</span><span class="result-text">很棒，你有說出口！</span>';
    renderFeedbackMsg(msgEl, step.feedback.failed);
    sfx.partial();
    playSpokeAckThenFeedback(step.feedback.failed);
    state.failCount++;
    if (state.failCount >= 3 && state.difficulty !== 'hard') showHint(true);  // 高級不自動提示，只能按「💡 提示」

  } else if (result.score === 'partial') {
    // 高級專屬：必要成分（關鍵詞＋金額）都講對了，只是句子沒說完整。
    // 這時該給的不是「再試一次」，而是**先肯定重點對了，再把整句示範出來**讓他照著說一次
    //（資料裡的 feedback.partial 是為中級寫的，多半只提醒用詞、不含完整句）。
    const hardPartial = state.difficulty === 'hard';
    const partialMsg  = hardPartial ? `再把整句說完整：「${step.options[0]}」` : step.feedback.partial;
    resultEl.className   = 'feedback-result partial';
    resultEl.innerHTML   = `<span class="result-icon">💪</span><span class="result-text">${hardPartial ? '重點說對了！' : '再試一次！'}</span>`;
    renderFeedbackMsg(msgEl, partialMsg);
    sfx.partial();
    // ⚠️ playFeedbackAudio 依「{場景}_{情境}_{步驟}_{score}」取檔、**不看文字**：高級這句是
    // 帶標準句動態組出來的，沒有對應預錄檔，照原路走會播到既有的 _partial.mp3（唸的是資料裡
    // 的舊文字），畫面與聲音就對不上。故高級直接走即時 TTS。
    if (hardPartial) { stopAllAudio(); tts.speak(partialMsg); }
    else playFeedbackAudio(partialMsg, 'partial');
    state.failCount++;
    if (state.failCount >= 3 && state.difficulty !== 'hard') showHint(true);  // 高級不自動提示，只能按「💡 提示」

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
    if (state.failCount >= 3 && state.difficulty !== 'hard') showHint(true);  // 高級不自動提示，只能按「💡 提示」

  } else {
    resultEl.className   = 'feedback-result failed';
    resultEl.innerHTML   = '<span class="result-icon">❌</span><span class="result-text">說的和任務不一樣喔</span>';
    renderFeedbackMsg(msgEl, step.feedback.failed);
    sfx.failed();
    playFeedbackAudio(step.feedback.failed, 'failed');
    state.failCount++;
    if (state.failCount >= 3 && state.difficulty !== 'hard') showHint(true);  // 高級不自動提示，只能按「💡 提示」
  }

  // 🗣️ 開口統計（重度障礙學生的參與度指標，與「說對」分開看）：
  // 只在語音辨識模式累計——打字不是開口、跟讀是學生自評沒有辨識結果、選項/句框/詞庫不需出聲。
  // 每次作答的結果只留最後一次（見下），所以開口與否必須在這裡當場累加，事後無法回推。
  if (state.inputMode === 'voice' && !result.selfRated) {
    if (noVoice) state.stepNoVoice++; else state.stepSpoke++;
  }

  // 每一步只保留最後一次結果：重試成功就以成功計，完成頁摘要與報告依步驟對位
  state.stepAttempts++;
  state.results[state.stepIndex] = {
    stepId: step.id,
    score: result.score,
    attempts: state.stepAttempts,
    spoke:   state.stepSpoke,     // 累計：這一步有收到語音幾次
    noVoice: state.stepNoVoice,   // 累計：這一步沒收到語音幾次
    hintUsed: state.stepHintUsed,
    // 💡 提示來源（2026-10-06，定義同 js/learning-tracker.js）：'self'＝學生自己按過；'auto'＝只有連錯 3 次系統自動跳出
    ...(state.stepHintUsed ? { hintSrc: state.stepHintSelf ? 'self' : 'auto' } : {}),
    // 兩種來源都留（2026-10-11 使用者定，同 24 單元 events[].hint）：['self','auto']；hintSrc 保留給舊的讀法
    ...(state.stepHintUsed ? { hintSrcs: [...(state.stepHintSelf ? ['self'] : []), ...(state.stepHintAuto || !state.stepHintSelf ? ['auto'] : [])] } : {}),
    promptLevel: state.frameLadder ? state.promptLevel : null,  // 作答當下的支持等級（IEP 用）
    mode: state.inputMode,                                       // 作答當下的反應模式（語音/選項/打字/句框/詞庫/跟讀）
    selfRated: !!result.selfRated,                               // 跟讀＝學生自評，非系統評分（報表需分開看）
    assisted: !!state.assistMode,                                // 輔助點擊＝系統替學生按的，不是學生自己選的
  };
  saveDialogueDraft();   // 中途離開用：每答完一步就記下目前進度

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
  // 2026-09-26 使用者定：藍色（btn-primary）只是提示下一個動作——答對＝「下一步」藍，沒全對＝「再試一次」藍；
  // 三顆都照樣可以按（寬度一樣，見 style.css #action-row）
  const ok = (result.score === 'perfect');
  const setPrimary = (el, on) => { el.classList.toggle('btn-primary', on); el.classList.toggle('btn-secondary', !on); };
  setPrimary(document.getElementById('btn-next'), ok);
  setPrimary(document.getElementById('btn-retry'), !ok);
  // 「← 上一步」每一步都有（第一步＝回難度選擇頁，見 prevStep）。⚠️ btn-prev 是練習頁的「← 上一頁」，別撞名
  document.getElementById('btn-prev-step').hidden = false;
  showActionRow();
}


// ─── 提示系統（漸進式）──────────────────────────────

// 顯示提示：統一用「內嵌提示框」(對話框下方，如初級)，不再用彈窗，版面更簡潔。
// 由「💡 提示」按鈕手動觸發(任何難度都可)，或由中級錯 3 次自動觸發(見 handleResult)。
// 提示鈕的字跟著提示框走：收著＝「提示」、開著＝「關閉提示」（2026-09-27 使用者定）。
// 提示框被任何地方打開或收起後都呼叫這支，不要在各處自己改字。
function syncHintBtn() {
  const open = !document.getElementById('easy-hint-box').hidden;
  const lbl  = document.getElementById('hint-btn-label');
  if (lbl) lbl.textContent = open ? '關閉提示' : '提示';
  document.getElementById('btn-hint-trigger')?.setAttribute('aria-expanded', String(open));
}

function toggleHint() {
  if (document.getElementById('easy-hint-box').hidden) { showHint(); return; }
  document.getElementById('easy-hint-box').hidden = true;
  stopAllAudio();
  syncHintBtn();
}

// auto＝連錯 3 次系統自動跳出；學生按 💡（toggleHint）＝主動提示
function showHint(auto = false) {
  const step = state.situation.steps[state.stepIndex];
  state.stepHintUsed = true;
  if (!auto) state.stepHintSelf = true; else state.stepHintAuto = true;
  document.getElementById('easy-hint-text').textContent = `「${step.accepted_phrases[0]}」`;
  document.getElementById('easy-hint-box').hidden = false;
  syncHintBtn();
  // 點提示時直接朗讀完整提示。⚠️ 唸的是「你可以這樣說」而不是畫面上的「小金探偷偷告訴你」：
  // 畫面標籤是角色框（小金探是「提示的人」，D），語音則要維持明確的指令語——
  // 對特教學生來說，聽到要做什麼比聽到誰在說話重要。提示語音走品質優先，不是角色台詞。
  speakModelSentence(step);
}

// 關掉彈窗＝語音一起停（2026-10-10 使用者定：日常情境對話關閉視窗後語音要同時關閉）。
// 店員彈窗（hideClerkPopup）、小百科（closeTips）本來就有；提示與回饋彈窗原本只藏畫面、語音繼續唸。
function hideHint() {
  const wasOpen = !document.getElementById('hint-modal').hidden;
  document.getElementById('hint-modal').hidden = true;
  if (wasOpen) stopAllAudio();
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

// 回上一步（2026-09-18 使用者要求：回饋彈窗「再試一次」左邊）。那一步已經有的作答紀錄不清掉，
// renderStep 會從 state.results 接續累計（見「重置狀態」那段），老師端的作答次數才不會少算。
// 第一步往前已經沒有對話了 → 回難度選擇頁，跟練習頁左上角「← 上一頁」同一支（使用者 2026-09-18：第一步也要有上一步）
function backToDifficulty() { showScreen('screen-difficulty'); }

function prevStep() {
  hideFeedback();
  hideActionRow();
  hideHint();
  if (state.stepIndex === 0) { backToDifficulty(); return; }
  state.stepIndex--;
  renderStep();
}

function retryStep() {
  stopAllAudio();   // 回饋彈窗的 ✕／Esc／再試一次都走這裡：回饋語音不可在關掉後繼續唸
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
  // 金好聊的鼓勵語排在下方 showScreen 之後（等結算音效播完才唸）；點他的頭像可以再聽一次
  const encImg = document.querySelector('.complete-encourage img');
  if (encImg) {
    encImg.style.cursor = 'pointer';
    encImg.title = '點我再聽一次';
    encImg.onclick = () => playChatdogLine(msg);
  }

  document.getElementById('complete-title').textContent = '練習完成！';

  // 三張統計卡片：答對步驟 / 正確率 / 星星
  const setStat = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setStat('stat-correct', `${perfect}/${total}`);
  setStat('stat-rate',    `${Math.round(ratio * 100)}%`);
  setStat('stat-stars',   `${starCount}/3`);

  // 三顆星撒花
  if (starCount === 3) setTimeout(launchConfetti, 600);

  // 🌟 全程無錯通過：每一步第一次就答對。跟讀（學生自評）與逐字朗讀不是系統評分，不算。
  // 徽章與 24 單元同一份（js/learning-tracker.js）；只顯示不出聲（鼓勵語已在唸）。
  const flawless = total > 0 && state.situation.steps.every((_, i) => {
    const r = state.results[i];
    return r?.score === 'perfect' && (r.attempts || 1) === 1 && !r.selfRated && r.mode !== 'tapread' && !r.assisted && !r.hintUsed;   // 用過提示不算無錯（2026-10-06，同 teacher.html flawlessOf）
  });
  if (flawless) setTimeout(() => window.LearningTracker?.showFlawlessBadge(
    null,   // 文字與 24 單元同一句（learning-tracker.js 預設），這裡只換金好聊頭像
    '../images/common/money_chat_dog.png'), 500);

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
      r?.assisted ? '👆' : '',
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

  showScreen('screen-complete');
  // ⚠️ 一定要排在 showScreen 之後：showScreen 會 stopAllAudio，排在前面音效一出聲就被停掉。
  // 結算音效依正確率分四段（分段唯一定義在 ../js/result-voice.js 的 LINES，與 24 單元共用），
  // 金好聊等音效播完才唸鼓勵語——原本 400ms 後就開口，跟音效疊在一起。點他的頭像可以再聽一次
  if (window.ResultVoice) {
    ResultVoice.playSfx(Math.round(ratio * 100));
    ResultVoice.afterSfx(() => playChatdogLine(msg));
  } else {
    sfx.complete();
    setTimeout(() => playChatdogLine(msg), 400);
  }
  // ⚠️ 這裡不要再 tts.speak(msg)：鼓勵語已由上面的 playChatdogLine 唸（金好聊預錄），
  //    而它本身就有 mp3 → wav → 即時 TTS 的後備鏈，缺檔或被手機擋掉時會自己退回 TTS。
  //    2026-08-19 加預錄時漏刪這行，於是 400ms 播預錄、800ms 又用 TTS 唸同一句，
  //    兩個聲音疊在一起（2026-09-05 Android 實機回報）。

  // 推薦相關遊戲單元
  renderRecommendCards(state.scenario.id);

  // 單元獎勵（2026-10-05 起）：不再寫 pendingRewards（優良表現獎勵板只由老師手動給分）。
  // 金幣由紀錄推算（../js/growth-system.js 的 coinsForRecord；設定在 teacher.html「🎁 單元獎勵設定」，
  // 沒設定＝每次 5 金幣），學生到「成就與寵物」頁領取。完成頁只提示這次可以領幾個（讀法與 coinsForRecord 一致）。
  const curStudent = getCurrentStudent();
  const partial = state.results.filter(r => r?.score === 'partial').length;
  let rewardCoins = 0;
  try {
    const rc = JSON.parse(localStorage.getItem('mt_unit_rewards_cfg') || 'null');
    const v2 = !!(rc && rc.v === 2);
    if (!v2 || rc.enabled !== false) {
      const v = v2 ? rc.units?.dialogue : undefined;
      rewardCoins = v == null ? 5 : Math.max(0, parseInt(v, 10) || 0);
    }
  } catch (_) {}
  // 沒選學生（訪客）領不到，就不提示
  const rewardEl = document.getElementById('complete-reward');
  if (rewardEl) rewardEl.textContent = (rewardCoins > 0 && curStudent) ? `🪙 單元獎勵 ${rewardCoins} 金幣，到「成就與寵物」領取！` : '';

  // 儲存學習紀錄
  const endTs = Date.now();
  // 本場主要反應模式＝各步驟出現最多者（每步可切換）
  const modeCount = {};
  state.results.forEach(r => { if (r?.mode) modeCount[r.mode] = (modeCount[r.mode] || 0) + 1; });
  const sessionMode = Object.entries(modeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || state.inputMode || null;
  resetSelfRate();          // 每場重置自評區（上一場的選擇不可留到這一場）
  // 紀錄欄位（含自訂情境的場景／情境名）由 dialogueRecordBase／dialogueRecordSteps 產生，中途離開的草稿共用
  if (typeof dbDraftClear === 'function') dbDraftClear();   // 正常完成：不是中途離開
  const savePromise = dbSave({
    ...dialogueRecordBase(),
    mode:         sessionMode,       // 反應模式（語音/選項/打字/句框/詞庫）
    score:        perfect,
    total,
    stars:        starCount,
    minPromptLevel,                 // 本次最少提示等級（IEP 鷹架褪除追蹤；null=未用句框階梯）
    steps:        dialogueRecordSteps(state.results),
    ...(state.results.some(r => r?.assisted) ? { assisted: true } : {}),   // teacher.html 據此排除無錯通過／精熟
    durationSec: Math.round((endTs - (state.startTs || endTs)) / 1000),
  }).catch(() => null);
  // 存檔是非同步的，但學生可能在它完成前就按自評 → 存 Promise 而非 id，點下去再 await
  _selfRateSave = savePromise;
}


// ─── 學生自評（後設認知）────────────────────────────
// 24 單元走 learning-tracker._showSelfRating（浮動泡泡、8 秒自動消失）；
// 對話練習只有一個完成頁，改為內嵌且不自動消失——學生可以慢慢想，未作答就是不記錄。
let _selfRateSave = null;   // dbSave 的 Promise，resolve 為該筆紀錄 id

function resetSelfRate() {
  _selfRateSave = null;
  const block = document.getElementById('selfrate-block');
  const title = document.getElementById('selfrate-title');
  const btns  = document.getElementById('selfrate-btns');
  if (!block || !title || !btns) return;
  block.classList.remove('done');
  title.textContent = '😀 這次練習，你覺得怎麼樣？';
  btns.hidden = false;
  btns.querySelectorAll('.dlg-selfrate-btn').forEach(b => {
    b.disabled = false;
    b.setAttribute('aria-pressed', 'false');
  });
}

function bindSelfRate() {
  const block = document.getElementById('selfrate-block');
  const btns  = document.getElementById('selfrate-btns');
  if (!block || !btns) return;
  btns.querySelectorAll('.dlg-selfrate-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (btn.disabled) return;
      const rate = btn.dataset.rate;
      btn.setAttribute('aria-pressed', 'true');
      btns.querySelectorAll('.dlg-selfrate-btn').forEach(b => { b.disabled = true; });
      sfx.click();
      // 存檔失敗不影響學生（僅少一筆自評），畫面照樣給正向回饋
      try { await dbSetSelfRating(await _selfRateSave, rate); } catch (_) {}
      block.classList.add('done');
      document.getElementById('selfrate-title').textContent = '謝謝你告訴老師！💛';
      btns.hidden = true;
    });
  });
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
  renderVersionInfo();
  renderVoiceInventory('voice-inventory');   // 🔊 這台可以用的聲音（C-1：從版本資訊區塊獨立出來）
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
    const theme = getParentScenario(sc)?.theme || sc.theme || THEME_PRESETS[3];   // 掛在場所底下＝場所的顏色
    const card  = document.createElement('div');
    card.className = 'custom-card';
    card.innerHTML = `
      <div class="custom-card-icon" style="background:${theme.bg}; color:${theme.color}">
        ${sc.icon || CUSTOM_ICON}
      </div>
      <div class="custom-card-info">
        <div class="custom-card-name">${sc.name || '未命名情境'}</div>
        <div class="custom-card-steps">${sc.steps.length} 個步驟${
          getParentScenario(sc) ? ` · 掛在【${getParentScenario(sc).name}】底下` : ''}</div>
      </div>
      <div class="custom-card-actions">
        <button class="btn-card-action" data-action="edit">✏️ 編輯</button>
        <button class="btn-card-action danger" data-action="delete" aria-label="刪除">🗑️</button>
      </div>
    `;
    // ⚠️ 同上：老師打的名稱不進 HTML 字串
    card.querySelector('.custom-card-name').textContent = sc.name || '未命名情境';
    card.querySelector('[data-action="edit"]').addEventListener('click', () => openScenarioEditor(idx));
    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (deleteCustomScenario(sc)) renderSettings();
    });
    list.appendChild(card);
  });
}


// ─── 情境編輯器 ─────────────────────────────────────

let editingScenarioIdx = -1;
let editingScenarioId  = null;   // 進編輯器即固定（新情境預產），錄音 key 依賴它
let editingSteps       = [];
let selectedClerkGender = 'female';   // 泛用店員性別（GENERIC_CLERKS 的鍵）
let editingParentId    = null;        // 掛在哪個內建場所底下（null＝獨立，只在 ⭐ 自訂分部）
let selectedCategory   = '';          // 情境類型（data/topic_presets.js 的 key）；''＝還沒選——**一定要老師自己選**，不給預設
let justFilledIds      = new Set();   // 剛換上的範本步驟 id：步驟清單亮一下，老師捲到下面也看得出來換過了
let selectedVoiceRef   = null;        // 老師指定的語音 { name, lang, voiceURI }；null＝依角色性別自動挑

// ─── AI 輔助情境生成（免 API Key，2026-07-23 改版）──────────────────
// 舊流程要使用者自備 Gemini API Key 直接打 API，門檻高；改為三段式：
// ①引導問答（主題/對象/重點/步驟數）組出提示詞 → ②使用者複製、貼到 Gemini/ChatGPT
// 網頁版送出 → ③把 AI 的回答整段貼回來，importAiSteps 防呆解析＋正規化後匯入。
// settings 的 gemini_api_key 只剩「LLM 語意評分」在用，與此流程無關。

function buildAiPrompt() {
  // 對話角色的性別與年紀要進提示詞：畫面上的角色圖與唸台詞的語音都跟著目前選的語音走
  // （一支語音＝一個形象），若 AI 寫出「謝謝姊姊」配男生圖、或把小孩的聲音寫成老闆娘，
  // 學生看到聽到的會互相矛盾。
  const clerk = currentRolePersona();
  // 組字只在 data/topic_presets.js 的 buildPrompt：類型、學生程度、主題優先規則都在那裡，
  // tests/topic_presets.test.js 直接驗產出的提示詞。這裡只負責讀畫面欄位。
  return TopicPresets.buildPrompt({
    topic:    document.getElementById('ai-gen-topic').value,
    partner:  document.getElementById('ai-gen-partner').value,
    focus:    document.getElementById('ai-gen-focus').value,
    count:    document.getElementById('ai-gen-count').value || '5',
    category: selectedCategory,
    gender:   clerk.gender,
    age:      clerk.age,
    ...learnerSettings(),
  });
}

async function copyAiPrompt() {
  const status = document.getElementById('ai-gen-status');
  const topic  = document.getElementById('ai-gen-topic').value.trim();
  if (!topic) {
    status.textContent = '請先填「① 要練習的情境」再複製';
    document.getElementById('ai-gen-topic').focus();
    return;
  }
  if (typeof TopicPresets === 'undefined' || !TopicPresets.buildPrompt) {
    status.textContent = '❌ 程式還沒更新完成，請重新整理頁面再試一次';
    return;
  }
  // 類型一定要老師自己選：原本預設「日常購物」，老師沒注意到就把「認識新同學」寫成購物（2026-09-14）。
  // 曾用關鍵詞猜類型補救，但只認得清單上的詞、補不完也會猜錯，2026-09-15 使用者決定拿掉、改成必選。
  if (!selectedCategory) {
    status.textContent = '請先在上面選「這是哪一類情境的練習」再複製';
    document.getElementById('edit-category')?.focus();
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

  // 干擾項不得 ∈ accepted（唯一正解）。比對走規則檔的正規化——標點不算差異，
  // 否則「我不知道。」會漏過這裡，等老師按儲存時才被就地檢查擋下（同一件事兩套判準）。
  const isAccepted = o => accepted.some(a => stepNorm(a) === stepNorm(o));
  const wrong = options.filter(o => stepNorm(o) !== stepNorm(answer) && !isAccepted(o));
  const FALLBACK_WRONG = ['我不知道', '沒關係', '好的謝謝'];
  for (const fb of FALLBACK_WRONG) {
    if (wrong.length >= 3) break;
    if (stepNorm(fb) !== stepNorm(answer) && !wrong.some(w => stepNorm(w) === stepNorm(fb)) && !isAccepted(fb)) wrong.push(fb);
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

  // 範本填進來、還沒改過的步驟 → 被 AI 的步驟取代（疊在範本後面，老師還得一步步刪）；老師改過或自己加的保留
  const before = editingSteps.length;
  editingSteps = editingSteps.filter(s => !isUntouchedTemplateStep(s));
  const replacedTemplate = editingSteps.length < before;
  editingSteps.push(...steps);
  justFilledIds = new Set();
  renderStepList();
  pasteEl.value = '';
  const skipped = arr.length - steps.length;
  status.textContent = `✅ 已匯入 ${steps.length} 個步驟${replacedTemplate ? '（取代了還沒改過的範本步驟）' : ''}${
    skipped ? `（略過 ${skipped} 個格式不完整的）` : ''}，請逐步確認後儲存`;

  // 匯入成功就關掉彈窗，老師才看得到下方的步驟；結果訊息改顯示在學生設定區
  const aiModal = document.getElementById('ai-gen-modal');
  if (aiModal) aiModal.hidden = true;
  setLearnerStatus(status.textContent);

  // 情境名稱空白時自動帶入主題
  const nameEl = document.getElementById('edit-name');
  const topic  = document.getElementById('ai-gen-topic').value.trim();
  if (!nameEl.value && topic) nameEl.value = topic;
}


// opts.parentId：從某個場所的情境頁按「➕ 自訂情境」進來時帶入，預先掛在那個場所底下。
function openScenarioEditor(idx, opts = {}) {
  editingScenarioIdx = idx;
  const customs = loadCustom();
  const sc      = idx >= 0 ? customs[idx] : null;

  editingSteps      = sc ? JSON.parse(JSON.stringify(sc.steps)) : [];
  editingScenarioId = sc?.id ?? ('custom_' + Date.now());
  selectedClerkGender = GENERIC_CLERKS[sc?.clerkGender] ? sc.clerkGender : 'female';
  // 舊資料與別台匯進來的舊版對話包都沒有這一欄 → 一律 ?? null（缺欄＝獨立情境）
  editingParentId = sc ? (sc.parentId ?? null) : (opts.parentId ?? null);
  // 沒有類型＝還沒選（新情境一律從「請選擇練習類型」開始；不相容舊資料，使用者 2026-09-14 確認過去都是試用）
  selectedCategory = (typeof TopicPresets !== 'undefined' && TopicPresets.PRESETS.some(p => p.key === sc?.category))
    ? sc.category : '';
  justFilledIds = new Set();
  selectedVoiceRef = sc?.role?.voiceRef ?? null;     // 舊資料沒有 role 欄＝沒指定，自動挑

  document.getElementById('scenario-editor-title').textContent = sc ? '編輯情境' : '新增情境';
  document.getElementById('edit-name').value  = sc?.name  ?? '';

  renderParentPicker();
  renderCategoryPicker();
  renderLearnerPickers();
  renderVoiceSelect();
  renderStepList();
  scenePhoto.init(`${editingScenarioId}::__scene::img`);
  nav.push('screen-scenario-editor');
}

// ─── 情境類型（B：主題不限購物）──────────────────────
// 類型定義在 `data/topic_presets.js`（一份定義同時餵下拉、AI 提示詞、空白範本），
// 這裡只做畫面。⚠️ 資料欄名 `shopkeeper_prompt` 不動，但**畫面措辭一律去店員化**——
// 社交／醫療／求助類的情境裡沒有「店員」，寫成「對方」老師才不會覺得這工具只能做購物。

function topicPreset(key) {
  // 規則檔沒載到時（舊 SW 快取）退回一組最小的購物預設，不讓編輯器整個壞掉
  if (typeof TopicPresets === 'undefined') {
    return { key: 'shopping', label: '日常購物', designer: '生活自理與金錢使用',
             partner: '店員或老闆', focus: '點餐、詢價、結帳、找零',
             topicHint: '例如：在麵包店詢問今日特價', kwExample: '「多少錢」「菠蘿麵包」', template: [] };
  }
  return TopicPresets.get(key);
}

// 「套用範本」要先選了練習類型才有作用
function syncApplyTemplateBtn() {
  // 按鈕一直顯示；沒選類型時點下去才提示（2026-09-21 使用者改）。選了類型就把提示收掉
  const note = document.getElementById('step-source-note');
  if (note && selectedCategory) note.hidden = true;
  // 按鈕是開關：下方有「沒改過的範本步驟」＝已套用，文字變「取消套用」（2026-09-21 使用者指示）
  const b = document.getElementById('btn-apply-template');
  if (b) b.textContent = hasAppliedTemplate() ? '↩️ 取消套用' : '📝 套用範本';
}

function hasAppliedTemplate() {
  return (editingSteps || []).some(isUntouchedTemplateStep);
}

// 取消套用：拿掉沒改過的範本步驟；老師改過、自己加的、錄過音的步驟都保留
async function cancelTemplate() {
  const rec = await stepIdsWithRecording(editingSteps);
  const before = editingSteps.length;
  editingSteps = editingSteps.filter(s => !(isUntouchedTemplateStep(s) && !rec.has(s.id)));
  justFilledIds = new Set();
  sfx.click();
  renderStepList();
  const n = before - editingSteps.length;
  setLearnerStatus(n ? `已取消套用：拿掉 ${n} 個範本步驟。` : '這些步驟你改過或錄過音，所以沒有拿掉。');
}

function renderCategoryPicker() {
  const sel = document.getElementById('edit-category');
  if (!sel) return;
  if (typeof TopicPresets !== 'undefined') {
    // 第一項是「請選擇練習類型」：類型一定要老師自己選，不給預設（見 copyAiPrompt 的說明）
    sel.innerHTML = '<option value="" disabled>請選擇練習類型</option>' + TopicPresets.PRESETS
      .map(p => `<option value="${p.key}">${p.label}</option>`).join('');
  }
  sel.value = selectedCategory;
  if (!selectedCategory) sel.selectedIndex = 0;
  sel.onchange = () => {
    selectedCategory = sel.value;
    renderCategoryHint();
    // 選類型不會直接填入範本（2026-09-21 使用者指示：要按「📝 套用範本」）；但下方已經是沒改過的範本步驟時，
    // 跟換層級一樣換成新類型的那組（步驟區上方的說明寫的就是「換類型或層級會自動換掉」；2026-10-10 補上，原本只有換層級會換）
    fillLearnerTemplate('tier');
    syncApplyTemplateBtn();
  };
  renderCategoryHint();
  syncApplyTemplateBtn();
}

// 換類型時，AI 問答的三個提示文字跟著換——老師才知道這一類該填什麼
function renderCategoryHint() {
  const chosen = !!selectedCategory;
  const p = chosen ? topicPreset(selectedCategory) : null;
  const hint = document.getElementById('edit-category-hint');
  if (hint) hint.innerHTML = !chosen
    ? '先選練習類型：選了才會出現「📝 套用範本」，AI 提示詞也會照這個類型寫。'
    : p.focus
      ? `這一類的練習重點通常是：<b>${p.focus}</b>。範本與 AI 提示詞都會跟著這個類型走。`
      : '自己決定練習內容。範本與 AI 提示詞都會跟著這個類型走。';

  const topic = document.getElementById('ai-gen-topic');
  if (topic)   topic.placeholder = chosen ? p.topicHint : '例如：認識新同學';
  const partner = document.getElementById('ai-gen-partner');
  if (partner) partner.placeholder = chosen && p.partner ? `例如：${p.partner}` : '例如：圖書館櫃檯人員';
  const focus = document.getElementById('ai-gen-focus');
  if (focus)   focus.placeholder = chosen && p.focus ? `例如：${p.focus}；句子要短一點` : '例如：練習開口求助；句子要短一點';
  const note = document.getElementById('ai-gen-topic-note');
  if (note)    note.innerHTML = chosen
    ? `提示詞會依情境類型<b>${p.label}</b>產生（要改到上面「這是哪一類情境的練習」）。`
    : '';   // 2026-09-21 使用者指示：沒選類型時不顯示提醒
}

// 學生設定（學段／層級 T1–T3／學習階段／需求特徵）：選項與規則定義在 data/topic_presets.js，
// 這裡只畫畫面。**範本與 AI 提示詞共用這一組**——放在類型下拉旁邊就是這個原因。
// 分層依據是 tools/IEP 的四軸判層（見 topic_presets.js 依賴宣告）。
// 記住上一次的選擇（同一位老師通常教同一群學生），只存在這台裝置。
const LEARNER_PICKERS = [
  { id: 'learner-stage', store: 'sp_aiStage', list: () => TopicPresets.STAGES, fallback: () => TopicPresets.DEFAULT_STAGE },
  { id: 'learner-tier',  store: 'sp_aiTier',  list: () => TopicPresets.TIERS,  fallback: () => 't1' },
  { id: 'learner-phase', store: 'sp_aiPhase', list: () => TopicPresets.PHASES, fallback: () => 'none' },
];

function loadLearnerTraits() {
  try {
    const arr = JSON.parse(localStorage.getItem('sp_aiTraits') || '[]');
    return Array.isArray(arr) ? arr.filter(k => TopicPresets.TRAITS.some(t => t.key === k)) : [];
  } catch { return []; }
}

// 目前畫面上的學生設定（AI 提示詞與範本都讀這一支）
function learnerSettings() {
  const val = id => document.getElementById(id)?.value;
  const traits = [...document.querySelectorAll('#learner-traits input[type="checkbox"]:checked')].map(i => i.value);
  return { stage: val('learner-stage'), tier: val('learner-tier'), phase: val('learner-phase'), traits };
}

function renderLearnerPickers() {
  if (typeof TopicPresets === 'undefined' || !TopicPresets.TIERS) return;
  for (const p of LEARNER_PICKERS) {
    const sel = document.getElementById(p.id);
    if (!sel) continue;
    const list = p.list();
    sel.innerHTML = list.map(x => `<option value="${x.key}">${x.label}</option>`).join('');
    const saved = localStorage.getItem(p.store);
    sel.value = list.some(x => x.key === saved) ? saved : p.fallback();
    sel.onchange = () => {
      localStorage.setItem(p.store, sel.value);
      renderLearnerNote();
      if (p.id === 'learner-tier') fillLearnerTemplate('tier');   // 2026-09-21：下方已有沒改過的範本才換成新層級的；否則不動
    };
  }
  const box = document.getElementById('learner-traits');
  if (box) {
    const on = loadLearnerTraits();
    box.innerHTML = TopicPresets.TRAITS.map(t => `<label class="learner-trait">
        <input type="checkbox" value="${t.key}"${on.includes(t.key) ? ' checked' : ''}> ${t.label}</label>`).join('');
    box.onchange = () => {
      localStorage.setItem('sp_aiTraits', JSON.stringify(learnerSettings().traits));
      renderLearnerNote();
    };
  }
  setLearnerStatus('');
  renderLearnerNote();
}

// 下拉與勾選的說明：層級（含「3 步驟對話」）、學習階段、每一個勾起來的需求特徵各一行，
// 老師選了什麼就看得到「範本／提示詞會因此有什麼不同」。文字都在 topic_presets.js 的 desc。
// 選「3 步驟對話」時學習階段不適用（它是不分層的一般對話）→ 下拉變灰；
// 真正決定提示詞用不用的是 TopicPresets.buildPrompt，這裡只負責讓老師看得出來。
function renderLearnerNote() {
  const el = document.getElementById('learner-note');
  if (!el || typeof TopicPresets === 'undefined' || !TopicPresets.TIERS) return;
  // 選「3 步驟對話」時學習階段不適用：下拉直接顯示「不適用」並變灰；換回 T1～T3 就放回老師原本選的
  // （原本的選擇存在 sp_aiPhase，「不適用」不寫進去）
  const phaseApplies = TopicPresets.getTier(learnerSettings().tier).key !== 'none';
  const phaseSel = document.getElementById('learner-phase');
  if (phaseSel) {
    let na = phaseSel.querySelector('option[value="na"]');
    if (!phaseApplies) {
      if (!na) { na = new Option('不適用', 'na'); phaseSel.prepend(na); }
      phaseSel.value = 'na';
    } else if (na) {
      na.remove();
      const saved = localStorage.getItem('sp_aiPhase');
      phaseSel.value = TopicPresets.PHASES.some(p => p.key === saved) ? saved : 'none';
    }
    phaseSel.disabled = !phaseApplies;
  }
  const s = learnerSettings();
  const tier = TopicPresets.getTier(s.tier), phase = TopicPresets.getPhase(s.phase);
  const stage = TopicPresets.getStage(s.stage);
  const traits = TopicPresets.getTraits(s.traits);
  const lines = [];
  if (stage.desc) lines.push(`${stage.label}：${stage.desc}`);
  lines.push(`${tier.key === 'none' ? tier.label : tier.label.split(' ')[0]}：${tier.desc}`);
  if (!phaseApplies) lines.push('學習階段：選 T1～T3 才適用（3 步驟對話不分層）。');
  else if (phase.desc) lines.push(`學習階段：${phase.desc}`);
  traits.forEach(t => lines.push(`${t.label}：${t.desc}`));
  if (traits.length) lines.push('（需求特徵只影響 AI 提示詞，範本不變）');
  el.textContent = lines.join('\n');
}

function setLearnerStatus(text) {
  const el = document.getElementById('learner-status');
  if (!el) return;
  el.textContent = text;
  el.hidden = !text;
}

// 一步的「內容指紋」：只看老師看得到、改得到的文字（欄位順序固定）。
// 不直接比整個物件的 JSON——步驟編輯頁按儲存會重建物件，內容沒變、欄位順序或附帶欄位變了也會被當成「改過」。
const stepSig = s => JSON.stringify([s.shopkeeper_prompt, s.task, s.accepted_phrases, s.options, s.keywords, s.feedback]);

// 所有範本步驟（每一類 × 每一層）的內容指紋——只給「沒有 tplSig 記號」的舊步驟用（記號是 2026-09-15 才開始存的），
// 靠這份認出「還是範本原樣」的步驟（2026-09-15 使用者回報：重新打開後換層級，原本三步驟沒有換掉）
let _allTemplateSigs = null;
function allTemplateSigs() {
  if (!_allTemplateSigs && typeof TopicPresets !== 'undefined') {
    _allTemplateSigs = new Set();
    for (const p of TopicPresets.PRESETS) for (const t of TopicPresets.TIERS)
      TopicPresets.expandTemplate(p.key, 'x', t.key).forEach(s => _allTemplateSigs.add(stepSig(s)));
  }
  return _allTemplateSigs || new Set();
}

// 這一步是不是「範本填進來、老師還沒改過」的步驟
// ① 有 tplSig 記號（填入時記下、跟著存檔）：內容指紋跟記號一樣＝沒改過。範本文字日後改版也認得出來
// ② 沒有記號的舊步驟：id 是範本產生的（tpl 開頭）且內容跟現在某一組範本一模一樣
function isUntouchedTemplateStep(s) {
  if (s.tplSig) return s.tplSig === stepSig(s);
  return /^tpl\d+_\d+_/.test(s.id || '') && allTemplateSigs().has(stepSig(s));
}

// 依「類型＋層級」把 3 步範本（開場 → 主要任務 → 收尾）填進步驟，老師改字就能用。
// 觸發點只有兩個：選練習類型、選層級（原本的「📝 用 3 步範本開始」按鈕已併進層級下拉，2026-09-15）。
// 規則（2026-09-15 使用者定案：換層級時「原本新增的那三個步驟就要自動刪除」，不要再跳詢問）：
//   ① 範本填進來、還沒改過的步驟 → 自動刪掉，新範本放在它們原本的位置
//   ② 老師改過的範本步驟、自己加的、AI 匯入的 → 一律保留（不問、也不會被刪）
//   ③ 步驟區已經全是老師自己的內容 → 不再塞範本進去
// 「錄音對不到任何步驟」時要講出來——否則老師只知道「我明明錄過，練習卻沒聲音」，
// 完全看不出錄音還躺在資料庫裡、只是掛在一個已經不存在的步驟上（2026-09-20 修掉的成因③ 會留下這種殘骸；
// 手動刪步驟已經會連帶刪錄音，所以正常操作不會看到這行）。
// ⚠️ **不自動接回某一步**：舊步驟的文字已經不可考，接到別句上就變成「音檔唸的跟畫面文字不一樣」，
//    那是這個專案最難查的一類錯。只說有幾段、請老師重錄。
async function reportOrphanRecordings() {
  const el = document.getElementById('step-list-orphan');
  if (!el) return;
  el.hidden = true;
  if (!editingScenarioId || typeof dbAudioKeys !== 'function') return;
  let keys = [];
  try { keys = await dbAudioKeys(`${editingScenarioId}::`); } catch (_) { return; }
  const live = new Set(editingSteps.map(s => s.id).filter(Boolean));
  const orphans = keys.filter(k => {
    const m = String(k).match(/^.+?::(.+)::say$/);
    return m && !live.has(m[1]);
  });
  if (!orphans.length) return;
  el.hidden = false;
  el.textContent = `⚠️ 有 ${orphans.length} 段錄音對不到任何步驟（步驟被換掉或刪掉時留下的），練習時不會播出來。請在要配音的那一步重新錄一次。`;
}

// 這些步驟已經有老師錄音（錄音不在文字指紋裡，`isUntouchedTemplateStep` 看不出來）
async function stepIdsWithRecording(steps) {
  const out = new Set();
  if (typeof dbAudioGet !== 'function' || !editingScenarioId) return out;
  await Promise.all((steps || []).map(async s => {
    if (!s?.id) return;
    try { if (await dbAudioGet(`${editingScenarioId}::${s.id}::say`)) out.add(s.id); } catch (_) {}
  }));
  return out;
}

// 選了層級就換成那一層的範本（顆粒度不同，不只是句子長短）；學習階段與需求特徵只進 AI 提示詞。
async function fillLearnerTemplate(trigger) {
  if (typeof TopicPresets === 'undefined') return;
  // 2026-09-21 使用者指示：不再直接套用範本，要按「📝 套用範本」才填。
  // 換層級時（trigger==='tier'）只有「下方已經是沒改過的範本步驟」才換成新層級的範本；下方沒有就什麼都不做
  if (trigger === 'tier') {
    const rec = await stepIdsWithRecording(editingSteps);
    if (!selectedCategory || !editingSteps.some(s => isUntouchedTemplateStep(s) && !rec.has(s.id))) return;
  }
  if (!selectedCategory) { setLearnerStatus('先選上面的練習類型，才會填入範本。'); return; }
  const p = topicPreset(selectedCategory);
  const tier = TopicPresets.getTier(learnerSettings().tier);
  const name = `${p.label}・${tier.label}`;

  // 🔴 **錄過音的範本步驟＝老師已經動過這一步，不可以被新範本換掉**（2026-09-20）：
  //    新範本的步驟 id 是重新產生的（`tpl<時間>_…`），換掉之後那段錄音就孤兒在 IndexedDB 裡，
  //    練習時對不到任何步驟——症狀正是「錄好音之後練習時語音播放沒有反應」。
  //    文字指紋看不出「有沒有錄音」（錄音不在 `stepSig` 裡），所以這裡要另外問一次資料庫。
  const recorded = await stepIdsWithRecording(editingSteps);
  const isTpl = s => isUntouchedTemplateStep(s) && !recorded.has(s.id);

  const firstTpl = editingSteps.findIndex(isTpl);
  const kept = editingSteps.filter(s => !isTpl(s));
  if (firstTpl < 0 && kept.length) {
    setLearnerStatus(recorded.size
      ? '步驟區已經有你自己的內容（含錄過音的步驟），這次沒有加入範本。'
      : '步驟區已經有你自己的內容，這次沒有加入範本。');
    return;
  }
  // 新範本插在第一個被刪掉的範本步驟原本的位置（前面保留下來的步驟不動）
  const at = firstTpl < 0 ? 0 : editingSteps.slice(0, firstTpl).filter(s => !isTpl(s)).length;
  const fresh = TopicPresets.expandTemplate(p.key, 'tpl' + Date.now().toString().slice(-5), tier.key);
  // 每一步記下「我是哪一組範本、原本的內容指紋」，跟著情境存檔——重新打開、範本日後改版都認得出來
  fresh.forEach(st => { st.tplSig = stepSig(st); st.tplName = name; });
  editingSteps = [...kept.slice(0, at), ...fresh, ...kept.slice(at)];
  justFilledIds = new Set(fresh.map(st => st.id));
  sfx.click();
  renderStepList();
  const keptRec = kept.filter(s => recorded.has(s.id)).length;
  setLearnerStatus(`✅ 已換成「${name}」的 ${fresh.length} 個步驟${
    kept.length ? `（你改過或自己加的 ${kept.length} 個步驟保留著${keptRec ? `，其中 ${keptRec} 個有你的錄音` : ''}）` : ''}`);
}

// 情境編輯器內嵌的語音挑選（C-1 ④）＋ 降級如實回報（C-2）。
// ⚠️ 回報**只給老師看**：練習畫面一個字都不顯示，學生不需要知道音源降級。
function renderVoicePickerStatus() {
  const el = document.getElementById('voice-picker-current');
  if (!el) return;
  const gender = (GENERIC_CLERKS[selectedClerkGender] || GENERIC_CLERKS.female).gender;

  if (!selectedVoiceRef) {
    const auto = bestVoiceByGender(gender);
    el.innerHTML = `目前是<b>自動挑選</b>：這台會用 <b>${auto ? `${voiceShortName(auto)}（${voiceEngineTag(auto)}）` : '（找不到中文語音）'}</b> 唸台詞。`
                 + '想固定用某一支，就從上面的下拉選。';
    return;
  }

  const r = resolveVoiceRef(selectedVoiceRef, gender);
  const named = r.voice ? `${voiceShortName(r.voice)}（${voiceEngineTag(r.voice)}）` : '（無）';
  const wantedName = voiceShortName(selectedVoiceRef.name);
  const msg = {
    exact:        `已指定 <b>${named}</b> 唸這個情境的台詞。`,
    'same-name':  `已指定 <b>${named}</b> 唸這個情境的台詞。`,
    downgraded:   `這個瀏覽器沒有你當初選的 <b>${wantedName}</b> 的那個版本，`
                + `改用同一個人聲的另一個版本 <b>${named}</b>——<b>音質會不一樣</b>。`,
    missing:      `這台裝置沒有 <b>${wantedName}</b>，已改用同性別的 <b>${named}</b>；`
                + '可以從下面重新指定一支這台有的。',
  }[r.status] || '';

  // 選到的語音性別與角色形象不同時如實說出來（不擋，老師可能就是要這樣）
  const vg = r.voice ? voiceGenderOf(r.voice) : null;
  const mismatch = (vg === 'male' || vg === 'female') && vg !== gender
    ? `<br>⚠️ 這支聲音聽起來是<b>${vg === 'male' ? '男生' : '女生'}</b>，和角色形象（${
        gender === 'male' ? '男生' : '女生'}）不一樣。`
    : '';

  el.innerHTML = msg + mismatch;
}

// 「要出現在哪個場所底下」下拉：獨立 ＋ 依分部分組的 42 個內建場所。
// 分部標籤直接讀首頁那排 tab 的文字，不在這裡再抄一份（改了 index.html 這裡自動跟著）。
function renderParentPicker() {
  const sel = document.getElementById('edit-parent');
  if (!sel) return;
  // 2026-09-16 起沒有「獨立情境」這個選項了——情境一定住在某個場景或場所底下。
  // 老師自己的場景排最前面（那是他最可能要放的地方），再接 42 個內建場所。
  sel.innerHTML = '';
  const myScenes = loadCustomScenes();
  if (myScenes.length) {
    const g0 = document.createElement('optgroup');
    g0.label = '⭐ 我的場景';
    myScenes.forEach(sc => {
      const o = document.createElement('option');
      o.value = sc.id;
      o.textContent = `${sc.icon || CUSTOM_ICON} ${sc.name}`;
      g0.appendChild(o);
    });
    sel.appendChild(g0);
  } else {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = `⭐ ${DEFAULT_SCENE_NAME}`;   // ⚠️ 不要加括號說明——窄手機下拉框放不下（見 _e2e_ai_prompt 的寬度檢查）
    sel.appendChild(o);
  }

  const byPart = {};
  SCENARIOS_DATA.scenarios.forEach(s => { (byPart[SCENARIO_PART[s.id] || 1] ||= []).push(s); });
  Object.keys(byPart).sort((a, b) => a - b).forEach(part => {
    const g = document.createElement('optgroup');
    g.label = document.querySelector(`.home-part-btn[data-part="${part}"]`)?.textContent.trim()
           || `第 ${part} 部分`;
    byPart[part].forEach(s => {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = `${s.icon || '🏪'} ${s.name}`;
      g.appendChild(o);
    });
    sel.appendChild(g);
  });

  // 從設定頁「新增情境」或站台主頁 ?editor=new 進來時沒帶父層 → 預設放進第一個場景；
  // 一個場景都沒有就先留空，儲存時 saveScenario 會自動建立「我的場景」。
  if (!editingParentId) editingParentId = myScenes[0]?.id || null;
  sel.value = editingParentId || '';
  sel.onchange = () => { editingParentId = sel.value || null; renderParentHint(); };
  renderParentHint();
}

function renderParentHint() {
  const el = document.getElementById('edit-parent-hint');
  if (!el) return;
  const parent = getParentScenario({ parentId: editingParentId });
  // ⚠️ 場景名稱是老師打的字 → 一律 textContent，不組進 HTML 字串
  el.textContent = parent
    ? `建立在【${parent.name}】底下：學生點進${parent.name}，就會在情境清單看到這一個。`
    : `還沒有任何場景：儲存時會自動建立「${DEFAULT_SCENE_NAME}」，之後可以在「⭐ 自訂」分部改名字。`;
}


// 對話角色＝下拉選聲音（2026-08-18 改版）。
// 舊版是「小雯／小宇」兩張卡片先選性別、再另外挑語音，等於同一件事分兩處設定；
// 現在**一個下拉直接選這台實際有的語音**，形象跟著語音走（voicePersonaFor），
// 所以不會選到不存在的音色，也不會出現「圖是男生、聲音是女生」。
// ⚠️ 清單只列這台有的語音——換裝置時由 resolveVoiceRef 逐級退回並如實回報（C-2）。

function renderVoiceSelect() {
  const sel = document.getElementById('edit-voice-select');
  if (!sel) return;
  const all = voiceManager.all || [];
  const cur = selectedVoiceRef ? resolveVoiceRef(selectedVoiceRef, null).voice : null;

  sel.innerHTML = '<option value="">🎲 自動挑選（用這台最好的聲音）</option>'
    + all.map((v, i) => {
        const p = voicePersonaFor(v.name);
        const on = cur && v.name === cur.name && v.lang === cur.lang;
        return `<option value="${i}"${on ? ' selected' : ''}>`
             + `${p.name}・${voiceShortName(v)}（${voiceEngineTag(v)} ${voiceLangTag(v)}）</option>`;
      }).join('');
  if (!cur) sel.value = '';

  sel.onchange = () => {
    const v = sel.value === '' ? null : all[Number(sel.value)];
    selectedVoiceRef = v ? voiceRefOf(v) : null;
    renderVoiceSelect();
    if (v) previewRoleVoice();     // 選了就聽一次：老師當場聽到的就是學生會聽到的
  };
  renderVoicePickerStatus();
  renderRoleAvatar();
  renderAiGenderNote();
}

// 目前這個情境的角色形象（沒指定語音就是自動挑選那支的形象）
function currentRolePersona() {
  if (selectedVoiceRef) return voicePersonaFor(selectedVoiceRef.name);
  const auto = bestVoiceByGender((GENERIC_CLERKS[selectedClerkGender] || GENERIC_CLERKS.female).gender);
  return auto ? voicePersonaFor(auto.name)
              : VOICE_PERSONAS[selectedClerkGender === 'male' ? 'male_adult' : 'female_adult'];
}

function renderRoleAvatar() {
  const img = document.getElementById('role-avatar-img');
  if (!img) return;
  const p = currentRolePersona();
  img.src = p.image;
  img.alt = p.name;
  img.onerror = () => { img.removeAttribute('src'); };
}

// 點頭像或試聽時：放大顯示這個角色（沿用既有 clerk-modal，不另開層級）
function showRolePopup(persona, alsoSpeak) {
  const p = persona || currentRolePersona();
  const img = document.getElementById('clerk-modal-img');
  if (!img) return;
  img.src = p.image;
  img.alt = p.name;
  img.hidden = false;
  document.getElementById('clerk-modal-name').textContent = p.name;
  document.getElementById('clerk-modal-role').textContent = '這個情境的對話角色';
  document.getElementById('clerk-modal-text').textContent = '學生在練習畫面會看到他，台詞也是他唸的。';
  const modal = document.getElementById('clerk-modal');
  modal.hidden = false;
  modal._scenario = null;
  modal._practiceStep = null;
  modal._rolePreview = true;      // 「再聽一次」要唸試聽句，不是場所開場白
  if (alsoSpeak) speakRolePreview();
}

const ROLE_PREVIEW_TEXT = '你好，等一下就用這個聲音跟你說話。';

// ⚠️ 語速用 1（正常）：試聽與自訂情境的台詞都不放慢——放慢是內建教材的教學設計，
//    老師自己編的情境沒有那個前提，聽起來反而不自然（2026-08-18 使用者要求）。
function speakRolePreview() {
  const v = selectedVoiceRef ? resolveVoiceRef(selectedVoiceRef, null).voice
                             : bestVoiceByGender(currentRolePersona().gender);
  // 試聽老師選的那支聲音＝照實唸，不讓 iPad 的「一律美佳」換掉（js/audio-unlocker.js）
  window.__mtNoVoiceUpgrade = !!selectedVoiceRef;
  try { tts.speak(ROLE_PREVIEW_TEXT, 1, null, v); } finally { window.__mtNoVoiceUpgrade = false; }
}

function previewRoleVoice() {
  showRolePopup(currentRolePersona(), true);
}

// AI 提示詞區的提醒：目前選了誰（提示詞的稱呼與語音都跟著它走）
function renderAiGenderNote() {
  const el = document.getElementById('ai-gen-gender-note');
  if (!el) return;
  const p = currentRolePersona();
  el.innerHTML = '';   // 2026-09-21 使用者指示：這行提醒不再顯示（稱呼與語音仍照選的聲音走）
}

function renderStepList() {
  syncApplyTemplateBtn();
  const list  = document.getElementById('step-list');
  const empty = document.getElementById('step-list-empty');
  list.innerHTML = '';
  empty.hidden   = editingSteps.length > 0;

  // 步驟區上方標出「目前是哪一組範本」：換層級後老師捲到這裡也看得出換過了
  // （2026-09-15 使用者回報「切到 T1 下方 3 步驟沒有消失」——T1 一樣是 3 步、有些步驟文字相同，提示又在上面看不到）
  const source = document.getElementById('step-list-source');
  if (source) {
    const tplStep = editingSteps.find(s => s.tplName && isUntouchedTemplateStep(s));
    source.hidden = !tplStep;
    source.textContent = tplStep ? `目前是「${tplStep.tplName}」的範本步驟（換類型或層級會自動換掉，改過的步驟會保留）` : '';
  }
  reportOrphanRecordings();
  const flash = justFilledIds;
  justFilledIds = new Set();   // 只亮這一次

  editingSteps.forEach((step, i) => {
    const item = document.createElement('div');
    item.className = 'step-item' + (flash.has(step.id) ? ' just-filled' : '');
    const isFirst = i === 0;
    const isLast  = i === editingSteps.length - 1;
    // 第一行標「任務」＝步驟編輯頁最上方「這一步的名稱」；第二行直接放對方說的話（使用者要求不加「對方說」標籤）。
    // 按鈕寫出文字、點文字本身也能進編輯——老師才知道要去哪裡改（2026-09-15 使用者要求）
    item.innerHTML = `
      <div class="step-num">${i + 1}</div>
      <button type="button" class="step-info" data-a="edit" aria-label="編輯第 ${i + 1} 步">
        <div class="step-task"><span class="step-field">任務</span>${step.task}</div>
        <div class="step-prompt">${step.shopkeeper_prompt}</div>
      </button>
      <div class="step-actions">
        <button class="btn-step-action" data-a="up"   aria-label="上移第 ${i + 1} 步" ${isFirst ? 'disabled' : ''}>↑ 上移</button>
        <button class="btn-step-action" data-a="down" aria-label="下移第 ${i + 1} 步" ${isLast  ? 'disabled' : ''}>↓ 下移</button>
        <button class="btn-step-action primary" data-a="edit">✏️ 編輯</button>
        <button class="btn-step-action danger" data-a="del" aria-label="刪除第 ${i + 1} 步">✕ 刪除</button>
      </div>
    `;
    // 任務說明沒點名標準答案的每件事 → ⚠️ 徽章（AI 匯入後老師一眼看出要回去補哪幾步）
    const unclear = taskClarityOf(step);
    if (unclear.length) {
      const badge = document.createElement('span');
      badge.className = 'step-clarity-badge';
      badge.textContent = '⚠️ 任務可以寫清楚一點';
      badge.title = taskClaritySummary(unclear);   // 老師打的字用 textContent／title，不進 innerHTML
      item.querySelector('.step-task')?.append(' ', badge);
    }
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

// ─── 自訂情境的就地檢查（唯一的守門員）──────────────────
// 自訂情境存在 localStorage，**六支稽核一支都照不到**（它們只讀 data/scenarios.js），
// 所以老師按下儲存的那一刻就是唯一能擋住壞資料的時機。
// 判準不在這裡，在 `js/step_rules.js`——那一份 `tests/_audit_schema.js` 也在用，
// 規則只能有一份。這裡只負責「怎麼把問題講給老師聽」。
// ⚠️ 規則檔沒載到時（舊 SW 快取的 index.html）一律放行，不能因為守門員缺席就不讓老師存檔。

// 與規則檔同一套正規化（標點與空白不算差異）；規則檔沒載到時退回原字串比對
const stepNorm = s => (typeof StepRules !== 'undefined' ? StepRules.norm(s) : String(s == null ? '' : s));

// ── 任務說明原則的提醒（2026-09-17）──────────────────────────────
// 標準答案要講的每件事（禮貌用語、稱呼、東西、金額），任務說明都要點名——困難模式拿學生的話跟標準答案比完整度，
// 任務沒要求的字，學生照著任務講就會被判不完整。判準唯一定義在 js/step_rules.js 的 checkTaskClarity，這裡只負責顯示。
// **只提醒、不擋存檔**：規則是字面比對，換句話說會誤報，老師看過覺得沒問題就直接存。
function taskClarityOf(step) {
  if (typeof StepRules === 'undefined' || !StepRules.checkTaskClarity) return [];
  try { return StepRules.checkTaskClarity(step); } catch (_) { return []; }
}
function taskClaritySummary(issues) {
  const parts = [...new Set(issues.map(i => `「${i.part}」`))].join('');
  return `標準答案裡的${parts}，任務說明還沒寫到——學生照任務講，困難模式可能判不算對。` +
    `可以寫成「先說…，再…」把每件事都點出來。`;
}
// 步驟編輯頁：打字時在「這一步的名稱」下方即時提醒
function refreshTaskClarityHint() {
  const el = document.getElementById('edit-task-clarity');
  if (!el) return;
  const answer = document.getElementById('edit-answer').value.trim();
  const task   = document.getElementById('edit-task').value.trim();
  const more = (document.getElementById('edit-accepted-more')?.value || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
  const kwRaw = document.getElementById('edit-keywords').value.trim();
  const issues = (answer && task) ? taskClarityOf({
    task, options: [answer], accepted_phrases: [answer, ...more],
    keywords: kwRaw ? kwRaw.split(/[,，\s]+/).filter(Boolean) : [answer],
  }) : [];
  el.hidden = !issues.length;
  el.textContent = issues.length ? `💡 ${taskClaritySummary(issues)}` : '';
}

function stepErrorsOf(step, otherIds) {
  if (typeof StepRules === 'undefined') return [];
  return StepRules.checkStep(step, { profile: 'custom', otherIds }).filter(i => i.level === 'error');
}

// 回傳給人看的說明；沒問題回 null
function describeStepProblems(steps) {
  if (typeof StepRules === 'undefined') return null;
  const bad = StepRules.checkSteps(steps, { profile: 'custom' })
    .filter(r => StepRules.hasError(r.issues));
  if (!bad.length) return null;
  return bad.map(({ index, step, issues }) => {
    const title = step?.task || step?.shopkeeper_prompt || '(還沒填內容)';
    const lines = issues.filter(i => i.level === 'error').map(i => `　・${i.msg}`).join('\n');
    return `第 ${index + 1} 步「${title}」\n${lines}`;
  }).join('\n\n');
}

function saveScenario() {
  const name = document.getElementById('edit-name').value.trim();

  if (!name) {
    alert('請填寫情境名稱');
    document.getElementById('edit-name').focus();
    return;
  }
  if (editingSteps.length === 0) {
    alert('請至少新增一個對話步驟');
    return;
  }

  const problems = describeStepProblems(editingSteps);
  if (problems) {
    alert(`這個情境還不能儲存，請先修正：\n\n${problems}`);
    return;
  }

  const arr = loadCustom();
  const id  = editingScenarioId || ('custom_' + Date.now());
  const sc  = {
    id,
    name,
    icon:        CUSTOM_ICON,           // 自訂情境一律 ⭐（編輯器不讓老師選，2026-09-15）
    // 掛在場所底下＝沿用那個場所的顏色，不存；獨立情境自動配一個別的自訂情境沒用過的顏色
    theme:       null,                  // 一律掛在場景／場所底下 → 顏色跟父層（見 getParentScenario）
    // 掛在哪個場景／場所底下（只出現在那裡）。2026-09-16 起一定有歸屬：
    // 老師沒挑過就自動建立並收進「我的場景」，不再有沒地方可去的獨立情境。
    parentId:    editingParentId || ensureDefaultScene(),
    category:    selectedCategory || null, // 情境類型（範本與提示詞跟著它換）；null＝老師沒選（練習本身用不到這欄）
    // 老師指定的語音；沒指定就整個欄位不寫（缺欄＝依角色性別自動挑）。
    // `role.key`（語音角色目錄）留給 C-3，這期只有 voiceRef。
    ...(selectedVoiceRef ? { role: { voiceRef: selectedVoiceRef } } : {}),
    clerkGender: selectedClerkGender,   // 泛用店員（頭像＋唸台詞的聲音）；舊資料沒這欄＝女
    available:   true,
    steps:       editingSteps,
  };

  if (editingScenarioIdx >= 0) arr[editingScenarioIdx] = sc;
  else {
    arr.push(sc);
    // 🔴 存完就把游標移到這一筆：再按一次「儲存情境」＝更新同一筆，不可以再 push 一次
    //    （連按兩下會多出一張**同 id** 的卡；老師刪掉多的那張時，`deleteCustomScenario` 依 id 前綴
    //    清錄音，會把還在用的那一份一起清掉 → 症狀就是「錄好音之後練習時語音播放沒有反應」）。
    editingScenarioIdx = arr.length - 1;
  }

  saveCustom(arr);
  sfx.click();
  // 從站台主頁的「去建立自訂情境」進來的：存好就回主頁的自訂情境頁（新情境會出現在那裡）
  if (_fromSiteHome) { location.href = '../index.html?hero=chatdog&part=custom'; return; }
  nav.pop();
  renderSettings();
  // 從首頁 ➕ 卡進來時，pop 回首頁需重繪卡片列表
  if (document.getElementById('screen-home').classList.contains('active')) renderHome();
  // 從某場所情境頁的 ➕／✏️ 進來時，pop 回情境頁也要重繪（新卡片才會出現、改掛走的才會消失）
  else if (document.getElementById('screen-situation').classList.contains('active')) renderSituationOptions();
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
    if (!text) { this._setStatus('請先在上方填「對方說的話」，或填「內心 OS／情境旁白」，再試聽。'); return; }
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
      // 🔴 WebP 不是 JPEG：JPEG 沒有透明通道，canvas 的透明像素會被壓成**純黑**——老師上傳
      // 去背的商品 PNG 就會變成一張黑底圖（2026-09-19 實測角落 rgb(0,0,0)，7/07 上線起就是如此）。
      // WebP 保留透明、同畫質下還比 JPEG 小；不支援 webp 編碼的瀏覽器，toBlob 依規格會自動
      // 退回 image/png（一樣保留透明，只是檔案大一些），所以不必自己偵測。
      cv.toBlob(b => b ? resolve(b) : reject(new Error('compress failed')), 'image/webp', quality);
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

// 步驟編輯頁最上方的標題「第 1 步：［這一步的名稱］」——名稱就是「學生的任務說明」那一格，直接在標題上改
let _stepListScrollY = 0;
function renderStepEditorHeading() {
  const el = document.getElementById('step-editor-heading');
  if (!el) return;
  const n = editingStepIdx >= 0 ? editingStepIdx + 1 : editingSteps.length + 1;
  el.textContent = editingStepIdx >= 0 ? `第 ${n} 步` : `新增第 ${n} 步`;
}
function restoreStepListScroll() {
  requestAnimationFrame(() => window.scrollTo(0, _stepListScrollY));
}

function openStepEditor(idx) {
  editingStepIdx = idx;
  const step = idx >= 0 ? editingSteps[idx] : null;
  editingStepId = step?.id ?? ('step_' + Date.now());
  // 試聽的文字＝「對方說的話」；這一步只有旁白時就唸旁白（否則純旁白步驟按 🔊 會說「請先填對方說的話」，
  // 老師以為這一步不能配音，但錄音本來就是給這句旁白用的——播放端同一套規則見 playCustomStepAudio）
  voiceStudio.init(`${editingScenarioId}::${editingStepId}::say`, () =>
    document.getElementById('edit-prompt').value.trim()
    || document.getElementById('edit-os').value.trim());
  stepPhoto.init(`${editingScenarioId}::${editingStepId}::img`);

  document.getElementById('step-editor-title').textContent = step ? '編輯步驟' : '新增步驟';
  _stepListScrollY = window.scrollY;   // 回到步驟清單時放回原本的位置
  // 「對方說的話」與「內心 OS」在資料上是同一欄，用 splitPrompt 拆回兩格顯示
  // （純旁白步驟＝整句都在括號裡 → 上面那格留空，下面那格放內容）。
  const _sp = splitPrompt(step?.shopkeeper_prompt ?? '');
  document.getElementById('edit-prompt').value   = _sp.clerkLine;
  document.getElementById('edit-os').value       = _sp.osText;
  document.getElementById('edit-os-after').checked = !!_sp.osText && !_sp.osLeading;
  document.getElementById('edit-task').value     = step?.task              ?? '';
  document.getElementById('edit-answer').value   = step?.accepted_phrases?.[0] ?? '';
  // 標準答案以外、也算答對的講法（範本與 AI 產生的都有 3～5 種，這格讓老師看得到、改得到、存得住）
  const moreEl = document.getElementById('edit-accepted-more');
  if (moreEl) moreEl.value = (step?.accepted_phrases ?? []).slice(1).join('\n');
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
  // 欄位顯示與否只看旗標；值照常回填，儲存時原樣寫回（隱藏不等於清掉老師既有的資料）
  const frGroup = document.getElementById('step-frame-group');
  if (frGroup) frGroup.hidden = !SCAFFOLD_ENABLED;

  renderStepEditorHeading();
  nav.push('screen-step-editor');
  // 從很下面的步驟清單點進來時，視窗會停在原本的高度（畫面切換不會自己捲動）→ 一律從最上面開始，
  // 第一眼先看到這一步的標題與「對方說的話」（2026-09-15 使用者要求）
  refreshTaskClarityHint();
  window.scrollTo(0, 0);
  document.querySelector('#screen-step-editor .editor-body')?.scrollTo?.(0, 0);
}

// 兩格組回一欄：OS 用全形括號包起來，位置由勾選決定（splitPrompt 靠這對括號拆回來）。
// ⚠️ OS 內文自己不能再有全形括號，否則 splitPrompt 只認第一個「）」會把句子切在半路 → 一律換成半形。
function joinPrompt(clerkLine, osText, osAfter) {
  const os = (osText || '').trim().replace(/（/g, '(').replace(/）/g, ')');
  const cl = (clerkLine || '').trim();
  if (!os) return cl;
  return osAfter && cl ? `${cl}（${os}）` : `（${os}）${cl}`;
}

function saveStep() {
  const clerkLine = document.getElementById('edit-prompt').value.trim();
  const osText    = document.getElementById('edit-os').value.trim();
  const prompt  = joinPrompt(clerkLine, osText, document.getElementById('edit-os-after').checked);
  const task    = document.getElementById('edit-task').value.trim();
  const answer  = document.getElementById('edit-answer').value.trim();

  // 兩格至少要有一格：只填 OS＝純旁白步驟（內建教材有 178 步是這樣），是合法的一步
  if (!prompt) { alert('請填寫「對方說的話」，或只填「內心 OS／情境旁白」也可以');
                 document.getElementById('edit-prompt').focus(); return; }
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

  // 其他也算答對的講法：去掉跟標準答案或彼此重複的（標點不算差異，同 step_rules 的比對）
  const more = (document.getElementById('edit-accepted-more')?.value || '')
    .split(/\n+/).map(s => s.trim()).filter(Boolean);
  const accepted = [answer];
  for (const p of more) if (!accepted.some(a => stepNorm(a) === stepNorm(p))) accepted.push(p);
  const prev = editingStepIdx >= 0 ? editingSteps[editingStepIdx] : null;

  const step = {
    id: editingStepId || ('step_' + Date.now()),
    shopkeeper_prompt: prompt,
    task,
    keywords,
    // 沿用原本的判定方式；沒有就用「講到任一關鍵字就算對」——這頁的提示本來就這樣寫。
    // 缺欄時引擎當成 all（每個關鍵字都要講到），範本與 AI 步驟一按儲存判定就變嚴（2026-09-15 修）
    keywords_mode:     prev?.keywords_mode || 'any',
    accepted_phrases:  accepted,
    // 範本記號跟著帶過去：內容沒改＝仍是範本（換層級會自動換掉），改了指紋就對不上＝老師的步驟
    ...(prev?.tplSig ? { tplSig: prev.tplSig, tplName: prev.tplName } : {}),
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

  const otherIds = editingSteps
    .filter((_, i) => i !== editingStepIdx)
    .map(s => s.id).filter(Boolean);
  const errs = stepErrorsOf(step, otherIds);
  if (errs.length) {
    alert(`這一步還不能存，請先修正：\n\n${errs.map(e => `・${e.msg}`).join('\n')}`);
    return;
  }
  // 任務說明原則：只提醒，老師按「確定」照樣存
  const unclear = taskClarityOf(step);
  if (unclear.length && !confirm(`${taskClaritySummary(unclear)}\n\n按「確定」先存起來，按「取消」回去改任務說明。`)) {
    document.getElementById('edit-task').focus();
    return;
  }

  if (editingStepIdx >= 0) editingSteps[editingStepIdx] = step;
  else editingSteps.push(step);

  voiceStudio.stopAll();
  sfx.click();
  nav.pop();
  renderStepList();
  restoreStepListScroll();
}


// ─── 事件綁定 ────────────────────────────────────────

// ESC 鍵關閉所有彈窗
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!document.getElementById('clerk-modal').hidden)    { hideClerkPopup(); return; }
  if (window.HeroModal && HeroModal.isOpen()) { HeroModal.close(); return; }   // 角色彈窗（共用元件）
  if (!document.getElementById('hint-modal').hidden)     { hideHint();     return; }
  // 回饋彈窗關掉＝留在這一步再答一次：只藏彈窗的話，作答後被鎖住的選項不會解開，學生會卡住（2026-09-19）
  if (!document.getElementById('feedback-modal').hidden) { retryStep();    return; }
  if (document.getElementById('ai-gen-modal')?.hidden === false) { document.getElementById('ai-gen-modal').hidden = true; return; }
  if (document.getElementById('scene-modal')?.hidden === false) { closeSceneModal(); return; }
  if (document.getElementById('audio-pack-modal')?.hidden === false) { closeAudioPackModal(); return; }
});

document.addEventListener('DOMContentLoaded', async () => {
  showFileProtocolWarning();
  // 舊資料（改版前沒掛場所的自訂情境）收進預設場景——要在畫任何一張卡之前跑（冪等）
  migrateCustomsIntoScenes();
  configureHeroModal();
  await voiceManager.init();
  // 中途離開：上一次關掉分頁或重新整理時還在練習＝存成中斷摘要（2026-10-09）
  if (typeof dbFinalizeDialogueDraft === 'function') dbFinalizeDialogueDraft().catch(() => {});
  userVoiceManager.init();


  // 「🏠 返回主頁」＝回**站台主頁**（不是本模組首頁），並讓主頁直接停在金好聊＋這個場所所屬的分部。
  // 「← 上一頁」才是回本模組首頁。
  const goSiteHome = () => {
    // 回主頁時要停在對得上的分頁：自訂場景／掛在自訂場景底下的情境 → 「⭐ 自訂」，
    // 其餘照場所所屬的分部（掛在內建場所底下的自訂情境用父場所的）。
    const sc = state.scenario;
    const part = sc?.isCustomScene || (sc?.parentId && !SCENARIO_PART[sc.parentId] && getCustomScene(sc.parentId))
      ? 'custom'
      : (SCENARIO_PART[sc?.id] ?? SCENARIO_PART[sc?.parentId]);
    const go = () => { location.href = '../index.html?hero=chatdog' + (part ? '&part=' + part : ''); };
    // 練習到一半按 🏠：先把中途離開存好再換頁（換頁會中斷寫入；最多等 0.8 秒，存不進去下次開啟對話時補存）
    if (document.getElementById('screen-practice')?.classList.contains('active') && typeof dbFinalizeDialogueDraft === 'function') {
      Promise.race([dbFinalizeDialogueDraft().catch(() => {}), new Promise(r => setTimeout(r, 800))]).then(go);
    } else go();
  };

  // 情境選擇頁／設定頁上方的導覽列（2026-10-10 比照 F1 設定頁；唯一定義在 js/nav-auth.js 的 mtUnitNav）
  if (window.mtUnitNav) {
    document.querySelectorAll('.dlg-nav-slot').forEach(slot => {
      const nav = window.mtUnitNav('../');
      // 「💬 生活情境對話」＝回站台主頁金好聊、並停在這個場所所屬的分頁（goSiteHome，原本「🏠 返回主頁」的行為）
      nav.querySelector('a[href="../index.html?hero=chatdog"]')?.addEventListener('click', e => { e.preventDefault(); goSiteHome(); });
      slot.replaceWith(nav);
    });
    window.mtNavAuthApply?.();
  }
  // 情境選擇頁：「上一頁」回本模組首頁的場所清單（回站台主頁＝導覽列的「🏠 主頁」）
  // 🔴 「← 上一頁」＝**回我來的地方**（2026-09-16 使用者實測回報）：從站台主頁點卡片進來的
  //    （連結帶 ?from=home）要回站台主頁；直接開 dialogue 的才回本模組首頁。
  //    原本一律 renderHome()，老師從主頁點自訂場景進來、按上一頁卻停在對話模組首頁，
  //    以為還在主頁 → 點那裡的金好聊卡片得到的是另一個（比較小的）彈窗，覺得畫面壞了。
  document.getElementById('btn-sit-back')?.addEventListener('click', () => {
    sfx.click();
    if (_fromSiteHome) { goSiteHome(); return; }
    renderHome();
  });

  // 簡易版 / 完整版切換（在難度頁上，切了直接改這次要練的步驟與標題列步數）
  // ⚠️ 只限練習範圍那一列：設定頁的難度／作答方式／切換鈕也借用 .sit-mode-btn 樣式，抓全部會一起被點亮（2026-09-27）
  document.querySelectorAll('#sit-mode-row .sit-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.click();
      state.simpleMode = btn.dataset.mode === 'simple';
      applyStepMode();
      renderSetup();   // 「開始練習」要不要亮、還差哪一項
    });
  });

  // 難度選擇頁：上一頁（=情境選擇；自訂情境無此層 → 回主頁）+ 返回主頁
  document.getElementById('btn-diff-back').addEventListener('click', () => {
    if (state.scenario?.situations) showScreen('screen-situation');
    // 掛在場所／場景底下的自訂情境是從那一層的情境頁進來的，回那一頁才對得上路徑
    else if (state.parentScenario) startScenario(state.parentScenario);
    else if (_fromSiteHome) goSiteHome();
    else renderHome();
  });

  // 鷹架卡（置頂，僅主情境顯示）：系統帶練，終點開口說
  document.getElementById('diff-scaffold-card').addEventListener('click', () => { sfx.click(); startScaffoldMode(); });
  // 設定頁：難度／作答方式／能不能切換 → 「開始練習」
  document.querySelectorAll('.setup-diff-btn').forEach(b => b.addEventListener('click', () => {
    sfx.click(); setup.difficulty = b.dataset.level;
    if (setup.difficulty !== 'easy') setup.assist = false;   // 輔助點擊只給簡單；換掉難度就關掉，免得藏起來還開著
    renderSetup();
  }));
  document.querySelectorAll('.setup-mode-btn').forEach(b => b.addEventListener('click', () => {
    sfx.click(); setup.inputMode = b.dataset.mode; renderSetup();
  }));
  document.querySelectorAll('.setup-lock-btn').forEach(b => b.addEventListener('click', () => {
    sfx.click(); setup.lock = b.dataset.lock === '1'; renderSetup();
  }));
  document.querySelectorAll('.setup-assist-btn').forEach(b => b.addEventListener('click', () => {
    sfx.click(); setup.assist = b.dataset.assist === '1';
    if (setup.assist) setup.inputMode = 'options';   // 開啟輔助點擊＝作答方式套用「選擇對話」
    renderSetup();
  }));
  document.getElementById('btn-setup-start')?.addEventListener('click', () => { sfx.click(); startFromSetup(); });

  // 練習頁：上一頁（=難度/模式選擇頁）+ 返回主頁
  document.getElementById('btn-prev').addEventListener('click', backToDifficulty);
  document.getElementById('btn-back').addEventListener('click', goSiteHome);

  // 麥克風按鈕
  document.getElementById('btn-mic').addEventListener('click', startListening);

  // 店員對話框左邊的 🔊：再聽一次店員語音
  document.getElementById('btn-replay-clerk').addEventListener('click', () => {
    const step = state.situation?.steps[state.stepIndex];
    if (step) playShopkeeperAudio(step);
  });

  // 提示按鈕 & 提示彈窗關閉
  document.getElementById('btn-hint-trigger').addEventListener('click', () => { sfx.click(); toggleHint(); });
  document.getElementById('btn-hint-close').addEventListener('click', hideHint);
  // ✕ 的綁定一律用 ?.：快取裡的舊 index.html 配新 script.js 時按鈕還不存在，丟錯會讓整個開場中斷、卡在「正在開啟情境…」（2026-09-19 實際踩到）
  document.getElementById('btn-hint-x')?.addEventListener('click', hideHint);
  document.getElementById('hint-backdrop').addEventListener('click', hideHint);
  document.getElementById('btn-hint-speak').addEventListener('click', () => {
    const text = document.getElementById('hint-text').textContent;
    if (text) speakHint(text);
  });
  document.getElementById('btn-easy-hint-speak').addEventListener('click', () => {
    const step = state.situation?.steps[state.stepIndex];
    if (step) speakModelSentence(step);
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
  // 右上角 ✕＝關掉回饋、留在這一步再答一次（與 Esc 相同；不是「下一步」）
  document.getElementById('btn-feedback-x')?.addEventListener('click', retryStep);
  document.getElementById('btn-prev-step').addEventListener('click', prevStep);

  // 完成頁
  document.getElementById('btn-again').addEventListener('click', () => {
    if (state.situation) startWithSituation(state.situation);
    else startScenario(state.scenario);
  });
  document.getElementById('btn-change-sit').addEventListener('click', () => startScenario(state.scenario));
  document.getElementById('btn-home').addEventListener('click', renderHome);
  bindSelfRate();   // 完成頁學生自評（綁一次，每場由 resetSelfRate 重置）

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
  document.getElementById('btn-voice-diag')?.addEventListener('click', renderVoiceDiag);

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
      const { scenarios, audios, orphaned, flawed } = await importDialoguePack(await file.text());
      statusEl.textContent = `✅ 已匯入 ${scenarios} 個情境、${audios} 段錄音`
        + (orphaned?.length
            ? `（${orphaned.join('、')}：原本掛的場所在這台找不到，已改放到「${DEFAULT_SCENE_NAME}」，可在編輯器重新指定）`
            : '')
        + (flawed?.length
            ? `　⚠️ ${flawed.join('、')}的步驟不符規則（例如一步有兩個正解、缺關鍵字），練習可以跑，但進編輯器儲存時會要求先修正。`
            : '');
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
  document.getElementById('btn-tips-toggle').addEventListener('click', () => a11y.toggleTips());
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
  // 用箭頭函式包起來：openKeywordEditor(scId, sitId) 現在有參數，
  // 直接當 handler 會把 Event 物件當成場景 id 傳進去。
  document.getElementById('btn-edit-keywords').addEventListener('click', () => openKeywordEditor());
  document.getElementById('btn-kw-back').addEventListener('click', () => nav.pop());
  document.getElementById('btn-kw-save').addEventListener('click', saveKeywordEditor);
  document.getElementById('btn-kw-reset-situation').addEventListener('click', resetKwSituation);

  // 情境編輯頁
  document.getElementById('btn-scenario-back').addEventListener('click', () => {
    // 取消「新增情境」→ 清掉此暫定情境 id 底下的孤兒錄音
    if (editingScenarioIdx < 0 && editingScenarioId && typeof dbAudioDeletePrefix === 'function') {
      dbAudioDeletePrefix(`${editingScenarioId}::`).catch(() => {});
    }
    // 從站台主頁的「去建立自訂情境」直接進來的話，nav 堆疊是空的（會落回本模組首頁）→ 回站台主頁的自訂情境頁
    if (_fromSiteHome) { location.href = '../index.html?hero=chatdog&part=custom'; return; }
    nav.pop();
  });
  document.getElementById('btn-save-scenario').addEventListener('click', saveScenario);
  document.getElementById('btn-add-step').addEventListener('click', () => openStepEditor(-1));
  document.getElementById('btn-voice-copy')?.addEventListener('click', copyVoiceList);
  // 點頭像＝放大看這個角色；點試聽＝放大＋用正常語速唸一句
  document.getElementById('btn-role-avatar')?.addEventListener('click', () => { sfx.click(); showRolePopup(); });
  document.getElementById('btn-role-preview')?.addEventListener('click', () => { sfx.click(); previewRoleVoice(); });
  document.getElementById('btn-ai-copy-prompt').addEventListener('click', copyAiPrompt);
  document.getElementById('btn-ai-import').addEventListener('click', importAiSteps);

  // 步驟編輯頁
  document.getElementById('btn-step-back').addEventListener('click', () => {
    voiceStudio.discardIfNew(editingStepIdx < 0);   // 取消新增步驟 → 清孤兒錄音
    stepPhoto.discardIfNew(editingStepIdx < 0);      // 取消新增步驟 → 清孤兒照片
    nav.pop();
    restoreStepListScroll();
  });
  document.getElementById('btn-save-step').addEventListener('click', saveStep);
  ['edit-task', 'edit-answer', 'edit-accepted-more', 'edit-keywords'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', refreshTaskClarityHint));

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

  // 學生選擇（金隊長卡片，點擊開啟選學生彈窗）
  renderStudentChip();
  const btnStudent = document.getElementById('btn-student');
  btnStudent.addEventListener('click', () => { sfx.click(); openHeroModal('captain'); });
  btnStudent.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sfx.click(); openHeroModal('captain'); }
  });

  // 金好聊卡片：開共用的角色彈窗（與站台主頁同一個元件，版型與互動完全一致）
  const btnChatdog = document.getElementById('btn-chatdog-open');
  const openChatdogModal = () => { sfx.click(); openHeroModal('chatdog'); };
  btnChatdog.addEventListener('click', openChatdogModal);
  btnChatdog.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChatdogModal(); }
  });

  // 建立／編輯自訂場景的小彈窗
  document.getElementById('scene-backdrop').addEventListener('click', closeSceneModal);
  // 對話角色下方的兩個入口（2026-09-21）：套用範本＝依目前類型＋層級填入；AI 幫我寫步驟＝開彈窗
  document.getElementById('btn-apply-template')?.addEventListener('click', () => {
    if (hasAppliedTemplate()) { cancelTemplate(); return; }
    sfx.click();
    if (!selectedCategory) {
      const note = document.getElementById('step-source-note');
      note.textContent = '請先在上面選「這是哪一類情境的練習」，才能套用範本。';
      note.hidden = false;
      const sel = document.getElementById('edit-category');
      sel?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      sel?.focus();
      return;
    }
    fillLearnerTemplate('button');
  });
  const aiModal = document.getElementById('ai-gen-modal');
  document.getElementById('btn-open-ai-gen')?.addEventListener('click', () => { sfx.click(); aiModal.hidden = false; });
  document.getElementById('btn-ai-gen-x')?.addEventListener('click', () => { sfx.click(); aiModal.hidden = true; });
  document.getElementById('ai-gen-backdrop')?.addEventListener('click', () => { aiModal.hidden = true; });
  document.getElementById('btn-scene-cancel').addEventListener('click', () => { sfx.click(); closeSceneModal(); });
  document.getElementById('btn-scene-x')?.addEventListener('click', () => { sfx.click(); closeSceneModal(); });
  document.getElementById('btn-scene-save').addEventListener('click', () => { sfx.click(); saveSceneFromModal(); });
  // 打完名字直接按 Enter 就能存（老師多半用鍵盤輸入）
  document.getElementById('scene-name-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveSceneFromModal(); }
  });

  // 情境分部 tab：同一版面過濾顯示（第一/二/三部分＋自訂）
  document.getElementById('home-parts')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.home-part-btn');
    if (!btn) return;
    sfx.click();
    homePart = btn.dataset.part;
    document.querySelectorAll('.home-part-btn').forEach(b => b.classList.toggle('active', b === btn));
    renderHome();
  });
  // （btn-home-reward 的綁定已移除：首頁那顆獎勵鈕早先就拿掉了，
  //   因為寫了 `?.` 所以沒報錯、綁定一直留著指向不存在的元素。）

  // ── 情境小百科 ──
  document.getElementById('tips-backdrop').addEventListener('click', closeTips);
  document.getElementById('btn-tips-close').addEventListener('click', () => { sfx.click(); closeTips(); });
  // 標頭右上角的 ✕（同 24 單元金博士彈窗）；下方的「知道了」也還在，兩個都能關
  document.getElementById('btn-tips-x').addEventListener('click', () => { sfx.click(); closeTips(); });
  document.getElementById('btn-tips-replay').addEventListener('click', () => {
    if (_tipsCurrent) playTipVoice(_tipsCurrent.stem, _tipsCurrent.text);
  });
  // 標頭的兩顆角色頭像：點誰，下方就顯示（並唸）誰說的話。
  // ⚠️ 點已經在顯示的那位不要「什麼都不做」——對學生來說點角色就是要聽他講，
  //    沒反應會被當成壞掉；renderTips() 本來就會重播該張卡的語音。
  document.getElementById('tips-av-chatdog').addEventListener('click', () => {
    sfx.click();
    _tipsCtx.who = 'chatdog';
    renderTips();
  });
  document.getElementById('tips-av-doctor').addEventListener('click', () => {
    if (!_tipsCtx.docRefs.length) return;
    sfx.click();
    _tipsCtx.who = 'doctor';
    _tipsCtx.docIndex = 0;
    renderTips();
  });
  // 📖 換一個：金博士有多張先看完，否則換這個場所的下一個情境
  document.getElementById('btn-tips-next').addEventListener('click', () => { sfx.click(); tipsNext(); });
  // 練習頁的小百科鈕（手機＝標題列一顆鈕／桌面＝右下角浮動鈕，同一個元素）
  document.getElementById('btn-tips-fab').addEventListener('pointerdown', e => {
    e.preventDefault();
    sfx.click();
    openTips(state.scenario, state.situation);
  });

  // 店員介紹彈窗
  // 練習頁的分段彈窗（內心獨白 → 店員，或反過來）：按「繼續」／點遮罩都先往下一段，最後一段才關
  document.getElementById('clerk-backdrop').addEventListener('click', () => { if (!advancePracticePhase()) hideClerkPopup(); });
  document.getElementById('btn-clerk-close').addEventListener('click', () => { sfx.click(); if (!advancePracticePhase()) hideClerkPopup(); });
  // 右上角 ✕＝整個關掉（分段彈窗也不再往下一段；台詞在練習頁的對話泡泡裡還看得到）
  document.getElementById('btn-clerk-x')?.addEventListener('click', () => { sfx.click(); hideClerkPopup(); });
  document.getElementById('btn-clerk-replay').addEventListener('click', () => {
    const modal = document.getElementById('clerk-modal');
    if (modal._practiceStep) {
      const phase = modal._phases?.[modal._phaseIdx];
      playShopkeeperAudio(modal._practiceStep, phase === 'os' ? 'os' : phase === 'clerk' ? 'clerk' : 'all');
    }
    else if (modal._scenario) playClerkIntro(modal._scenario);
    else if (modal._rolePreview) speakRolePreview();   // 編輯器的角色試聽
  });

  // 練習頁店員頭像：點擊放大並重播這一步的台詞（鍵盤 Enter/空白鍵同）
  const shopAvatar = document.getElementById('shopkeeper-avatar');
  shopAvatar.addEventListener('click', () => { sfx.click(); showPracticeClerkPopup(); });
  shopAvatar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sfx.click(); showPracticeClerkPopup(); }
  });

  // 練習頁學生頭像：點擊放大看照片（鍵盤 Enter/空白鍵同）
  const stuAvatarDlg = document.getElementById('student-avatar-dlg');
  stuAvatarDlg.addEventListener('click', () => { sfx.click(); showStudentPhotoZoom(); });
  stuAvatarDlg.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sfx.click(); showStudentPhotoZoom(); }
  });

  // 學生語音彈窗

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
    // 說法與聲音都走 speakModelSentence（唯一定義處）：與提示彈窗、簡單難度的提示喇叭一致。
    // 原本走 speakAsUser（學生預錄音色）且只唸答案本身，是全站唯一不一致的地方。
    if (step) speakModelSentence(step);
  });
  document.getElementById('btn-echo-rec').addEventListener('click', () => {
    sfx.click();
    if (echoRecorder.recording) echoRecorder.stop(); else echoRecorder.start();
  });
  document.getElementById('btn-echo-play').addEventListener('click', () => { sfx.click(); echoRecorder.play(); });
  document.getElementById('btn-echo-skip-rec').addEventListener('click', () => { sfx.click(); unlockEchoRate(); });
  // 逐字朗讀：字塊是每一步重畫的，綁在容器上。⚠️ 新元素一律 ?.（舊快取 index.html＋新 script.js 時還不存在）
  document.getElementById('tapread-tiles')?.addEventListener('click', e => {
    const t = e.target.closest('.tapread-tile'); if (t) handleTapReadTile(t);
  });
  document.getElementById('btn-tapread-whole')?.addEventListener('click', () => {
    sfx.click(); speakTapReadWhole();
  });
  document.getElementById('btn-tapread-reset')?.addEventListener('click', () => { sfx.click(); stopAllAudio(); renderTapRead(); });
  document.getElementById('btn-tapread-done')?.addEventListener('click', () => { sfx.click(); handleTapReadDone(); });
  document.querySelectorAll('.btn-echo-rate').forEach(btn => {
    btn.addEventListener('click', () => { sfx.click(); handleEchoSelfRate(btn.dataset.rate); });
  });

  // 學習歷程已移至專案「學習歷程總覽」（teacher.html）；主頁內嵌歷程頁與其事件綁定已移除

  // 語音包下載按鈕：先開說明彈窗（何時需要／下載哪些），確認後才下載（2026-09-23）
  // ⚠️ 新按鈕綁定用 ?.——回訪裝置可能拿到快取裡的舊 index.html＋新 script.js（見 dialogue/CLAUDE.md）
  document.getElementById('btn-cache-audio').addEventListener('click', () => { sfx.click(); openAudioPackModal(); });
  document.getElementById('btn-audio-pack-go')?.addEventListener('click', () => { sfx.click(); cacheCurrentScenarioAudio(); });
  ['btn-audio-pack-x', 'btn-audio-pack-cancel', 'audio-pack-backdrop'].forEach(id =>
    document.getElementById(id)?.addEventListener('click', () => { sfx.click(); closeAudioPackModal(); }));

  // 練習頁標題列的「🎁 獎勵系統」按鈕與這裡的綁定已於 2026-09-07 移除，
  // 理由見 index.html 練習頁 .ah-right 的註解。獎勵入口＝導覽列的「🏆 優良表現獎勵板」。

  // 啟動
  // 站台主頁的場所卡片會帶 ?scenario=<id> 進來（?part=<1-7> 只選分部不進情境），
  // 這樣學生在主頁點了「便利商店」就直接開始，不用到這裡再找一次。
  {
    const q  = new URLSearchParams(location.search);
    const sp = q.get('part');
    if (sp && (/^[1-7]$/.test(sp) || sp === 'custom')) {
      homePart = sp;
      document.querySelectorAll('.home-part-btn').forEach(b => b.classList.toggle('active', b.dataset.part === sp));
    }
    // 站台主頁的卡片連結都帶 ?from=home：返回時要回主頁，不是停在本模組首頁
    if (q.get('from') === 'home') _fromSiteHome = true;
    const sid = q.get('scenario');
    // ?scenario= 可能是：內建場所／自訂情境／**老師自己的場景**（站台主頁的自訂分頁連過來的）
    const sc  = sid ? (getAllScenarios().find(s => s.id === sid && s.available !== false)
                       || customSceneAsScenario(getCustomScene(sid))) : null;
    // 直接用 ?scenario= 進來時，首頁分部先切到它所屬的那一部分——
    // 難度頁／情境頁「上一頁」會回首頁，分部也要對得上，返回才不會跳回第一部分。
    if (sc && !sp) {
      const pPart = sc.isCustomScene ? 'custom'
                  : (sc.parentId ? SCENARIO_PART[sc.parentId] : null);
      if (pPart) {
        homePart = String(pPart);
        document.querySelectorAll('.home-part-btn').forEach(b => b.classList.toggle('active', b.dataset.part === homePart));
      }
    }
    // renderHome() 結尾會 showScreen('screen-home')，直接跳情境時會先閃一下首頁 →
    // 先建好首頁內容（返回時要用），再立刻切到情境頁，中間不讓首頁露臉
    renderHome();
    if (sc) {
      startScenario(sc);
      // &sit=<情境代號>：直接進那個情境（金隊長基地「老師指派」的任務卡帶過來的，2026-10-07）
      const sit = q.get('sit') && (sc.situations || []).find(t => t.id === q.get('sit'));
      if (sit) startWithSituation(sit);
    }
    // 站台主頁的「去建立自訂情境 →」帶 ?editor=new 進來：直接開新增情境的編輯頁
    else if (q.get('editor') === 'new') { _fromSiteHome = true; openScenarioEditor(-1); }
    // 站台主頁的「建立場景 →」帶 ?scene=new 進來：切到 ⭐ 自訂分部並打開建立場景的彈窗
    else if (q.get('scene') === 'new') {
      homePart = 'custom';
      document.querySelectorAll('.home-part-btn').forEach(b => b.classList.toggle('active', b.dataset.part === 'custom'));
      renderHome();
      openSceneModal(null);
    }
    document.documentElement.classList.remove('deep-link');   // 擋幕收起（見 index.html 的說明）
  }

  // ─── 除錯工具初始化 ──────────────────────────────
  if (new URLSearchParams(location.search).get('debug') === '1') {
    initDebugPanel();
  }
});


// ─── 完成頁推薦遊戲 ──────────────────────────────────

const SCENARIO_RECOMMEND = {
  convenience_store: [
    { label: '🛒 A4 模擬購物',           url: '../html/a4_simulated_shopping.html' },
    { label: '💰 C6 找零與計算',         url: '../html/c6_making_change.html' },
    { label: '🏧 A5 ATM提款機',          url: '../html/a5_atm_simulator.html' },
  ],
  breakfast_shop: [
    { label: '🍔 A3 美式速食自助點餐',   url: '../html/a3_mcdonalds_order.html' },
    { label: '💵 C5 足額付款',           url: '../html/c5_sufficient_payment.html' },
    { label: '🔄 C3 金錢面額的兌換',     url: '../html/c3_money_exchange.html' },
    { label: '🏪 A1 自動飲料販賣機',     url: '../html/a1_vending_machine.html' },
  ],
  supermarket: [
    { label: '🛒 A4 模擬購物',           url: '../html/a4_simulated_shopping.html' },
    { label: '💰 C6 找零與計算',         url: '../html/c6_making_change.html' },
    { label: '🏪 A1 自動飲料販賣機',     url: '../html/a1_vending_machine.html' },
  ],
  night_market: [
    { label: '💰 C6 找零與計算',         url: '../html/c6_making_change.html' },
    { label: '🏪 A1 自動飲料販賣機',     url: '../html/a1_vending_machine.html' },
    { label: '📊 B4 商品價格比較',         url: '../html/b4_sale_comparison.html' },
  ],
  pharmacy: [
    { label: '💵 C5 足額付款',           url: '../html/c5_sufficient_payment.html' },
    { label: '💰 C6 找零與計算',         url: '../html/c6_making_change.html' },
  ],
  clothing_store: [
    { label: '🛒 A4 模擬購物',           url: '../html/a4_simulated_shopping.html' },
    { label: '📊 B4 商品價格比較',         url: '../html/b4_sale_comparison.html' },
  ],
  fast_food: [
    { label: '🍔 A3 美式速食自助點餐',   url: '../html/a3_mcdonalds_order.html' },
    { label: '💵 C5 足額付款',           url: '../html/c5_sufficient_payment.html' },
  ],
  stationery_store: [
    { label: '🛒 A4 模擬購物',           url: '../html/a4_simulated_shopping.html' },
    { label: '💰 C6 找零與計算',         url: '../html/c6_making_change.html' },
  ],
};

function renderRecommendCards(scenarioId) {
  const box = document.getElementById('complete-recommend');
  // 2026-09-26 使用者定：完成頁不再顯示「🎮 接著練習」推薦卡（結束頁只留自評與三個按鈕）。
  // SCENARIO_RECOMMEND 資料保留（單元改名時仍照 CLAUDE.md 同步），要恢復就拿掉下一行。
  box.hidden = true; return;
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
      + `<td style="text-align:center">${s.hintUsed ? '💡' : ''}${s.assisted ? '👆' : ''}</td></tr>`;
  }).join('');

  document.getElementById('print-report-sheet').innerHTML = `
    <h1>購物練習報告</h1>
    <div class="rpt-meta">
      學生：${record.studentName || '訪客'}　練習時間：${date}<br>
      情境：${record.scenarioName || record.scenarioId} — ${record.situationName || record.situationId}<br>
      成績：${record.score}/${record.total} 答對　${stars}${record.assisted ? '　（👆 輔助點擊：系統替學生按的）' : ''}
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
        if (String(step.feedback?.[score] || '').includes(NAME_TOKEN)) return;   // 含 {名字} 的回饋語沒有預錄（即時語音）
        stems.push(`audio/feedback/${state.scenario.id}_${sit.id}_${step.id}_${score}`);
      });
    });
    // 情境小百科：這個場所每個情境一張卡（../audio/chatbot/ 在站根，
    // new URL(..., location.href) 會解析成正確的絕對路徑）
    if (getTipCard(state.scenario.id, sit.id)) {
      stems.push(`../audio/chatbot/tip_${state.scenario.id}_${sit.id}`);
    }
  });
  // 卡片引用到的金博士知識卡（跨場所共用，去重後一起收）
  const docRefs = new Set();
  (state.scenario.situations || []).forEach(sit => {
    (getTipCard(state.scenario.id, sit.id)?.doctor || []).forEach(id => docRefs.add(id));
  });
  docRefs.forEach(id => stems.push(`../audio/chatbot/tipdoc_${id}`));

  // 每個檔名嘗試 mp3 與 wav 兩種副檔名（不存在的會在快取時自然失敗，不影響其他檔）
  const urls = stems.flatMap(s => [`${s}.mp3`, `${s}.wav`]);

  // 去重，轉為絕對 URL
  return [...new Set(urls)].map(u => new URL(u, location.href).href);
}

// 說明彈窗：老師看到 📥 不知道它做什麼、也不知道只下載這一個場所（2026-09-23 使用者）。
// 下載範圍的唯一定義是上面的 getCacheableAudioUrls()；彈窗文字（index.html #audio-pack-modal）要跟它一致。
let _audioPackBusy = false;
// 哪些場所下載過：只是給按鈕顯示 📥／✅ 用的提示，存本機；讀寫失敗就當沒下載過（真正的檔案在 SW 快取裡）
const AUDIO_PACK_KEY = 'sp_audioPacks';
function audioPackIds() {
  try { return JSON.parse(localStorage.getItem(AUDIO_PACK_KEY) || '[]'); } catch { return []; }
}
function markAudioPack(id) {
  try { localStorage.setItem(AUDIO_PACK_KEY, JSON.stringify([...new Set([...audioPackIds(), id])])); } catch {}
}
function refreshAudioPackBtn(scenario) {
  const btn = document.getElementById('btn-cache-audio');
  if (!btn || _audioPackBusy) return;
  const done = !!scenario && audioPackIds().includes(scenario.id);
  btn.classList.toggle('cached', done);
  btn.textContent = done ? '✅' : '📥';
  btn.title = done ? `「${scenario.name}」的語音包已下載，可離線練習（點開看說明）`
                   : '離線語音包：沒有網路時才需要（點開看說明）';
}
function openAudioPackModal() {
  if (!state.scenario) return;
  const modal = document.getElementById('audio-pack-modal');
  if (!modal) { cacheCurrentScenarioAudio(); return; }   // 舊版 index.html（快取）沒有彈窗 → 維持原本直接下載
  document.getElementById('audio-pack-place').textContent = state.scenario.name || '這個場所';
  if (!_audioPackBusy) {
    const done = document.getElementById('btn-cache-audio').classList.contains('cached');
    document.getElementById('audio-pack-status').textContent =
      done ? '✅ 這個場所已經下載過了，要更新可以再下載一次。' : '';
    const go = document.getElementById('btn-audio-pack-go');
    go.disabled = false;
    go.textContent = done ? '重新下載' : '開始下載';
    document.getElementById('btn-audio-pack-cancel').textContent = done ? '關閉' : '不用了';
  }
  modal.hidden = false;
}
function closeAudioPackModal() {
  // 下載中關掉也沒關係：背景繼續，標題列按鈕的提示文字會顯示進度，完成變 ✅
  const modal = document.getElementById('audio-pack-modal');
  if (modal) modal.hidden = true;
}

async function cacheCurrentScenarioAudio() {
  const btn = document.getElementById('btn-cache-audio');
  const status = document.getElementById('audio-pack-status');
  const go = document.getElementById('btn-audio-pack-go');
  const say = (msg) => { if (status) status.textContent = msg; };
  if (_audioPackBusy) return;
  if (!navigator.serviceWorker?.controller) {
    say('⚠️ 離線功能還沒準備好，請重新整理頁面後再試一次。');
    if (!status) alert('Service Worker 未就緒，請重新整理頁面後再試。');
    return;
  }
  const urls = getCacheableAudioUrls();
  if (urls.length === 0) return;
  const pack = { id: state.scenario.id, name: state.scenario.name };   // 下載途中可能換場所，記下是哪一個

  _audioPackBusy = true;
  if (go) go.disabled = true;
  btn.classList.remove('cached');
  btn.classList.add('caching');
  btn.textContent = '📥';
  btn.title = '語音包下載中…';
  say('下載中… 0%');

  navigator.serviceWorker.controller.postMessage({ type: 'CACHE_AUDIO', urls });

  // sw.js 每處理一個檔就回報 CACHE_AUDIO_PROGRESS（原本沒接到畫面上，大場所看起來像卡住）
  await new Promise(resolve => {
    const handler = (e) => {
      if (e.data?.type === 'CACHE_AUDIO_PROGRESS') {
        const pct = Math.round(e.data.done / e.data.total * 100);
        say(`下載中… ${pct}%`);
        btn.title = `語音包下載中… ${pct}%`;
      } else if (e.data?.type === 'CACHE_AUDIO_DONE') {
        navigator.serviceWorker.removeEventListener('message', handler);
        resolve(e.data);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
  });

  _audioPackBusy = false;
  markAudioPack(pack.id);
  btn.classList.remove('caching');
  refreshAudioPackBtn(state.scenario);   // 還在同一個場所＝✅；已換場所＝依那個場所的紀錄
  say(`✅ 下載完成！沒有網路時也能練習「${pack.name}」了。`);
  if (go) { go.disabled = false; go.textContent = '重新下載'; }
  const cancel = document.getElementById('btn-audio-pack-cancel');
  if (cancel) cancel.textContent = '關閉';
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
