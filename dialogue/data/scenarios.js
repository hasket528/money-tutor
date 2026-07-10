// 對話腳本資料庫
// 結構：場所 → situations[] → steps[]

// ─── 精簡步驟建構器 mkStep（可漸進採用；舊步驟維持純物件，完全不受影響）──────────
// 目的：新步驟只寫必要欄位，其餘由預設補齊，減少重複與前後不一致（見 docs/dialogue_keyword_map.md §5）。
// 產出＝完整 step 物件，下游 script.js／稽核／產生器皆視為一般步驟，不需知道精簡格式。
// 因定義於本檔頂端，所有 `new Function(scenarios.js)` 的載入器（稽核/產生器）與瀏覽器都自動可用。
//
// 用法：
//   steps: [
//     mkStep({ id:'greeting', say:'你好！請問需要幫忙嗎？', task:'跟店員打招呼',
//              options:['你好！','謝謝再見','多少錢？','在哪裡？'], kw:'greet' }),
//     mkStep({ id:'purchase', say:'這包餅乾 35 元。', task:'告訴店員你要買餅乾',
//              options:['我要買餅乾','廁所在哪裡？','謝謝再見','餅乾在哪？'], kw:['我要買','要買'],
//              accepted:['我要買餅乾','我要這包餅乾'] }),
//   ]
// 欄位：id* / say(或 shopkeeper_prompt)* / task* / options[]*（[0]=正解）；
//       kw（或 keywords）＝預設集字串｜關鍵字陣列；mode（或 keywords_mode）預設 'any'；
//       accepted（或 accepted_phrases）預設 [正解]、且一定含正解；feedback 可只覆寫部分；
//       透傳選用欄位：image / image_label / frame / frame_ref / slots / grow_slots / clerkImage / clerkName。
const KW_PRESETS = {
  greet:  ['你好', '您好', '哈囉', '嗨', '早', '早安', 'hi'],
  bye:    ['謝謝', '再見', '掰', '感謝', '謝', '拜拜', 'bye', '掰掰', '謝囉'],
  thanks: ['謝謝', '再見', '掰', '感謝', '謝', '拜拜', 'bye', '掰掰', '謝囉'],
  pay:    ['現金', '刷卡', '悠遊卡', '付現', '信用卡'],
  price:  ['怎麼賣', '多少錢', '多少元', '費多少'],
};
function mkStep(c) {
  const opt0 = (c.options && c.options[0]) || '';
  // 正解一律納入 accepted_phrases（滿足守門員規則 options[0]∈accepted_phrases）
  let accepted = c.accepted_phrases || c.accepted || [opt0];
  if (opt0 && !accepted.includes(opt0)) accepted = [opt0, ...accepted];
  // keywords：字串＝套預設集；陣列＝直接用；省略＝退回「正解全句」（安全但較嚴，鼓勵改填 kw）
  let keywords = c.keywords || c.kw;
  if (typeof keywords === 'string') keywords = KW_PRESETS[keywords] || [keywords];
  if (!keywords) keywords = [opt0.replace(/[！？。，、!?.,\s「」]/g, '')].filter(Boolean);
  const step = {
    id: c.id,
    shopkeeper_prompt: c.shopkeeper_prompt != null ? c.shopkeeper_prompt : c.say,
    task: c.task,
    options: c.options,
    accepted_phrases: accepted,
    keywords,
    // 全 213 步慣例為 'any'（命中任一關鍵字即算）；省略時採此預設而非引擎的 'all'
    keywords_mode: (c.keywords_mode != null ? c.keywords_mode : c.mode) || 'any',
    feedback: { perfect: '說得很清楚！', partial: '說出了重點！', failed: `可以這樣說：「${opt0}」`, ...(c.feedback || {}) },
  };
  for (const k of ['image', 'image_label', 'frame', 'frame_ref', 'slots', 'grow_slots', 'clerkImage', 'clerkName'])
    if (c[k] != null) step[k] = c[k];
  return step;
}

const SCENARIOS_DATA = {
  scenarios: [

    // ══════════════════════════════════════════
    // 便利商店
    // ══════════════════════════════════════════
    {
      id: "convenience_store", name: "便利商店", icon: "🏪", available: true,
      theme: { color: '#16A34A', bg: '#DCFCE7', accent: '#15803D' },
      situations: [
        {
          id: "basic", name: "基本購物", icon: "🛍️",
          desc: "從找商品、詢問價格到結帳的完整購物流程",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！請問有什麼需要幫忙的嗎？", task:"跟店員打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安","hi"], keywords_mode:'any',
              accepted_phrases:["你好！","您好！","哈囉！"],
              options:["你好！","謝謝再見","這個多少錢？","廁所在哪裡？"],
              frame:{ template:"{greet}", slots:{ greet:{ answer:"你好！", choices:[
                { text:"你好！", emoji:"👋" }, { text:"謝謝再見", emoji:"🙋" },
                { text:"這個多少錢？", emoji:"💰" }, { text:"廁所在哪裡？", emoji:"🚻" } ] } } },
              feedback:{ perfect:"很好！打招呼打得很有禮貌！", partial:"不錯！可以說得更完整一點喔", failed:"可以這樣說：「你好！」" } },
            { id:"ask_location", shopkeeper_prompt:"請問你要找什麼呢？", task:"詢問餅乾在哪裡",
              image:"images/a4/icon-a4-cookies-shop.png", image_label:"餅乾",
              keywords:["餅乾"], keywords_mode:'any',
              accepted_phrases:["請問餅乾在哪裡？","餅乾在哪裡？","餅乾放在哪？"],
              options:["請問餅乾在哪裡？","我要結帳","謝謝再見","這個多少錢？"],
              frame:{ template:"請問 {item} 在哪裡？", slots:{ item:{ answer:"餅乾", choices:[
                { text:"餅乾", emoji:"🍪" }, { text:"飲料", emoji:"🥤" },
                { text:"麵包", emoji:"🍞" }, { text:"報紙", emoji:"📰" } ] } } },
              feedback:{ perfect:"問得很清楚！", partial:"說出了重點！試著說完整：「請問餅乾在哪裡？」", failed:"可以這樣說：「請問餅乾在哪裡？」" } },
            { id:"ask_price", shopkeeper_prompt:"餅乾在第二排喔，請問還需要什麼嗎？", task:"詢問餅乾的價格",
              image:"images/a4/icon-a4-cookies-shop.png", image_label:"餅乾",
              keywords:["怎麼賣","多少錢","多少元","費多少"], keywords_mode:'any',
              accepted_phrases:["請問餅乾多少錢？","請問這個多少錢？","餅乾多少錢？","多少錢？","怎麼賣？"],
              options:["請問餅乾多少錢？","我要買這個","謝謝","請問廁所在哪裡？"],
              frame:{ template:"請問 {item} 多少錢？", slots:{ item:{ answer:"餅乾", choices:[
                { text:"餅乾", emoji:"🍪" }, { text:"飲料", emoji:"🥤" },
                { text:"麵包", emoji:"🍞" }, { text:"報紙", emoji:"📰" } ] } } },
              feedback:{ perfect:"問得很好！", partial:"說出了重點！可以加上「請問」會更有禮貌", failed:"可以這樣說：「請問這個多少錢？」" } },
            { id:"purchase", shopkeeper_prompt:"這包餅乾是 35 元。", task:"告訴店員你要買餅乾",
              image:"images/a4/icon-a4-cookies-shop.png", image_label:"餅乾",
              keywords:["我要買","要買"], keywords_mode:'any',
              accepted_phrases:["我要買餅乾","我要買這個","要買餅乾","我要買"],
              options:["我要買餅乾","請問廁所在哪裡？","謝謝再見","餅乾在哪裡？"],
              frame_ref:"want_item",
              slots:{ item:{ answer:"餅乾", choices:[
                { text:"餅乾", emoji:"🍪" }, { text:"飲料", emoji:"🥤" },
                { text:"報紙", emoji:"📰" }, { text:"雨傘", emoji:"☂️" } ] } },
              grow_slots:{ item2:{ answer:"牛奶", choices:[
                { text:"牛奶", emoji:"🥛" }, { text:"報紙", emoji:"📰" },
                { text:"雨傘", emoji:"☂️" }, { text:"電池", emoji:"🔋" } ] } },
              feedback:{ perfect:"很好！購買的說法很清楚！", partial:"說出了重點！可以說完整一點", failed:"可以這樣說：「我要買這個！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！請問要付現金還是刷卡呢？", task:"告訴店員付款方式",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金","我要刷卡","用悠遊卡","付現金"],
              options:["我付現金","我要刷卡","用悠遊卡","餅乾在哪裡？"],
              frame:{ template:"{pay}", slots:{ pay:{ answer:["我付現金","我要刷卡","用悠遊卡"], choices:[
                { text:"我付現金", emoji:"💵" }, { text:"我要刷卡", emoji:"💳" },
                { text:"用悠遊卡", emoji:"🎫" }, { text:"餅乾在哪裡？", emoji:"🍪" } ] } } },
              feedback:{ perfect:"說得很清楚！", partial:"聽到了！可以說得更完整喔", failed:"可以說：「我付現金」或「我要刷卡」" } },
            { id:"goodbye", shopkeeper_prompt:"好的，35 元，找您 65 元，謝謝光臨！", task:"跟店員道謝說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝再見！","謝謝！再見！","掰掰！謝謝！"],
              options:["謝謝再見！","你好","我要買東西","請問在哪裡？"],
              frame:{ template:"{bye}", slots:{ bye:{ answer:"謝謝再見！", choices:[
                { text:"謝謝再見！", emoji:"🙏" }, { text:"你好", emoji:"👋" },
                { text:"我要買東西", emoji:"🛒" }, { text:"請問在哪裡？", emoji:"❓" } ] } } },
              feedback:{ perfect:"道謝道得很有禮貌！太棒了！", partial:"說了！可以同時說謝謝和再見喔", failed:"可以這樣說：「謝謝再見！」" } }
          ]
        },
        {
          id: "not_enough_money", name: "錢不夠", icon: "💸",
          desc: "結帳時發現錢不夠，如何禮貌地向店員說明",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！請問有什麼需要幫忙的嗎？", task:"跟店員打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安","hi"], keywords_mode:'any',
              accepted_phrases:["你好！","您好！"],
              options:["你好！","謝謝再見","這個多少錢？","廁所在哪裡？"],
              feedback:{ perfect:"很好！打招呼很有禮貌！", partial:"不錯！可以說得更完整", failed:"可以這樣說：「你好！」" } },
            { id:"ask_price", shopkeeper_prompt:"請問要找什麼呢？", task:"詢問餅乾的價格",
              image:"images/a4/icon-a4-cookies-shop.png", image_label:"餅乾",
              keywords:["怎麼賣","多少錢","多少元","費多少"], keywords_mode:'any',
              accepted_phrases:["請問餅乾多少錢？","請問這個多少錢？","餅乾多少錢？","多少錢？"],
              options:["請問餅乾多少錢？","我要買這個","有沒有飲料？","謝謝"],
              feedback:{ perfect:"問得很好！", partial:"說出了重點！可以加上「請問」更有禮貌", failed:"可以這樣說：「請問這個多少錢？」" } },
            { id:"want_buy", shopkeeper_prompt:"這包餅乾是 60 元喔！", task:"告訴店員你要買",
              image:"images/a4/icon-a4-cookies-shop.png", image_label:"餅乾",
              keywords:["買","要","給","來","拿","好","需要"], keywords_mode:'any',
              accepted_phrases:["我要買！","好，我要這個！","我要一包！"],
              options:["我要買！","請問廁所在哪裡？","餅乾在哪裡？","謝謝再見"],
              feedback:{ perfect:"很好！", partial:"說出了重點！", failed:"可以這樣說：「我要買！」" } },
            { id:"not_enough", shopkeeper_prompt:"好的！60 元，請問付現金嗎？（你翻開錢包，發現只有 40 元）",
              task:"告訴店員你的錢不夠",
              keywords:["不夠","只有","不足","不到"], keywords_mode:'any',
              accepted_phrases:["不好意思，我的錢不夠","不好意思，我錢不夠，不能買","我只有 40 元，錢不夠"],
              options:["不好意思，我的錢不夠","我下次再來","可以少一點嗎？","我用刷卡"],
              feedback:{ perfect:"說得很有禮貌！誠實說出來很棒！", partial:"說出了重點！可以說：「不好意思，我的錢不夠」", failed:"可以這樣說：「不好意思，我的錢不夠」" } },
            { id:"goodbye", shopkeeper_prompt:"沒關係！那你可以把餅乾放回去，下次再來喔！", task:"向店員道謝說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝，下次再來！","好的，謝謝！"],
              options:["謝謝！再見！","你好！","我要買餅乾！","廁所在哪裡？"],
              feedback:{ perfect:"說得很有禮貌！下次記得多帶一點錢喔！", partial:"有說謝謝！可以再加上「再見」", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        },
        {
          id: "cant_find_item", name: "找不到商品", icon: "🔍",
          desc: "在店裡找不到想買的商品，向店員求助",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！歡迎光臨！", task:"跟店員打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安","hi"], keywords_mode:'any',
              accepted_phrases:["你好！","您好！","哈囉！"],
              options:["你好！","謝謝再見","廁所在哪？","多少錢？"],
              feedback:{ perfect:"很好！打招呼打得很有禮貌！", partial:"不錯！可以說得更完整", failed:"可以這樣說：「你好！」" } },
            { id:"ask_help", shopkeeper_prompt:"請問需要幫忙嗎？", task:"請店員幫你找牛奶",
              keywords:["牛奶"], keywords_mode:'any',
              accepted_phrases:["請問你們有賣牛奶嗎？","請問牛奶在哪裡？","我在找牛奶"],
              options:["請問你們有賣牛奶嗎？","我要結帳","謝謝再見","請問多少錢？"],
              feedback:{ perfect:"問得很清楚！", partial:"說出了重點！試著說完整：「請問你們有賣牛奶嗎？」", failed:"可以這樣說：「請問你們有賣牛奶嗎？」" } },
            { id:"out_of_stock", shopkeeper_prompt:"不好意思，我們的牛奶今天賣完了，要等明天才有喔！",
              task:"問有沒有其他飲料可以買",
              keywords:["其他","別的","還有","飲料","豆漿","果汁"], keywords_mode:'any',
              accepted_phrases:["好的，那有沒有其他飲料？","謝謝，那我看看其他的","知道了，有沒有豆漿？"],
              options:["好的，那有沒有其他飲料？","謝謝，那我不買了","好的，我明天再來","那換成果汁可以嗎？"],
              feedback:{ perfect:"很好！懂得詢問替代方案！", partial:"說出了重點！可以問看看其他選擇", failed:"可以這樣說：「好的，那有沒有其他飲料？」" } },
            { id:"alternative", shopkeeper_prompt:"有的！我們有豆漿和果汁，在飲料櫃裡喔！", task:"說你要去看看，並道謝",
              keywords:["去看","看看","謝謝"], keywords_mode:'any',
              accepted_phrases:["好的，我去看看！謝謝！","謝謝，我去飲料櫃看看！","好，謝謝你！"],
              options:["好的，我去看看！謝謝！","那我不要了","可以幫我拿嗎？","謝謝再見"],
              feedback:{ perfect:"很好！知道怎麼解決問題！", partial:"說出了重點！加上謝謝更有禮貌", failed:"可以這樣說：「好的，我去看看！謝謝！」" } },
            { id:"goodbye", shopkeeper_prompt:"不客氣！需要幫忙隨時說喔！", task:"向店員道謝說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝你！","好的，謝謝再見！"],
              options:["謝謝！再見！","好的，謝謝！","掰掰！","謝謝你幫忙！"],
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！可以再加上「再見」", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        },
        {
          id: "expired_product", name: "商品過期了", icon: "📦",
          desc: "發現商品已過期，如何禮貌地向店員反映",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！歡迎光臨！", task:"跟店員打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安","hi"], keywords_mode:'any',
              accepted_phrases:["你好！","您好！"],
              options:["你好！","謝謝再見","我要結帳","多少錢？"],
              feedback:{ perfect:"很好！", partial:"可以說得更完整", failed:"可以這樣說：「你好！」" } },
            { id:"report_problem", shopkeeper_prompt:"（你拿起一盒果凍，發現保存期限已過了）",
              task:"告訴店員這個商品過期了",
              keywords:["過期","日期","壞了","不能","問題","期限","過了"], keywords_mode:'any',
              accepted_phrases:["不好意思，這個好像過期了","這個保存期限過了","這個商品過期了"],
              options:["不好意思，這個好像過期了","我要買這個","請問多少錢？","謝謝再見"],
              feedback:{ perfect:"很好！勇敢說出來！保護自己很重要！", partial:"說出了重點！讓店員知道商品有問題是正確的！", failed:"可以這樣說：「不好意思，這個好像過期了」" } },
            { id:"wait", shopkeeper_prompt:"非常感謝！不好意思，請稍等，我馬上幫你換一個新的！",
              task:"謝謝店員，說你願意等",
              keywords:["好","謝謝","可以","等","行","沒問題","沒關係","ok"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","可以，我等你！","好，沒關係！"],
              options:["好的，謝謝！","那我不買了","可以，我等你！","謝謝你處理"],
              feedback:{ perfect:"很好！有耐心等待！", partial:"說出了重點！", failed:"可以這樣說：「好的，謝謝！」" } },
            { id:"thanks", shopkeeper_prompt:"這是新的！謝謝你告訴我們，這次免費送你！",
              task:"感謝店員的處理",
              keywords:["謝謝","太好了","好","感謝","很好","棒"], keywords_mode:'any',
              accepted_phrases:["謝謝！太好了！","謝謝你！","謝謝，再見！"],
              options:["謝謝！太好了！","謝謝你！","這樣可以嗎？謝謝！","謝謝，再見！"],
              feedback:{ perfect:"說得很有禮貌！謝謝你讓店家改善商品品質！", partial:"有說謝謝！", failed:"可以這樣說：「謝謝！太好了！」" } }
          ]
        },
        {
          id: "wrong_change", name: "找零錯了", icon: "💰",
          desc: "店員找錯零錢，如何禮貌地指出並核對",
          steps: [
            { id:"pay", shopkeeper_prompt:"飲料 25 元，謝謝！（你給了 50 元）", task:"告訴店員你給了 50 元",
              keywords:["50","100","200","500","1000","五十","一百","兩百","五百","一千"], keywords_mode:'any',
              accepted_phrases:["我給你 50 元","這是 50 元","給你 50 元"],
              options:["我給你 50 元","這是 50 元","給你","謝謝"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我給你 50 元」" } },
            { id:"wrong_change", shopkeeper_prompt:"好的！找您 15 元。（店員找回 15 元，但正確應找 25 元）",
              task:"禮貌地告訴店員找零好像不對",
              keywords:["不對","錯","應該","少","多","找錯","好像","差"], keywords_mode:'any',
              accepted_phrases:["不好意思，找零好像不對","應該找我 25 元","不好意思，少找了 10 元"],
              options:["不好意思，找零好像不對","謝謝，沒關係","可以再算一次嗎？","我再數數看"],
              feedback:{ perfect:"很好！禮貌指出來很重要！", partial:"說出了重點！有「不好意思」更有禮貌", failed:"可以這樣說：「不好意思，找零好像不對」" } },
            { id:"corrected", shopkeeper_prompt:"啊，不好意思！我再數一次……對，找您 25 元，非常抱歉！",
              task:"說沒關係，謝謝店員",
              keywords:["謝謝","沒關係","好","沒事","了解","知道","OK"], keywords_mode:'any',
              accepted_phrases:["沒關係，謝謝！","好的，謝謝！","謝謝，沒事！"],
              options:["沒關係，謝謝！","好的，謝謝！","謝謝，沒事！","再見！"],
              feedback:{ perfect:"說得很有禮貌！大度說「沒關係」很棒！", partial:"有說謝謝！", failed:"可以這樣說：「沒關係，謝謝！」" } }
          ]
        },
        {
          id: "need_bag", name: "需要袋子", icon: "🛍️",
          desc: "結帳後才想到要袋子，如何補充請求",
          steps: [
            { id:"after_pay", shopkeeper_prompt:"好的！飲料和餅乾共 60 元，找您 40 元，謝謝！",
              task:"請店員給你一個袋子",
              keywords:["袋子","袋","裝","打包","包裝","塑膠袋"], keywords_mode:'any',
              accepted_phrases:["請問可以給我袋子嗎？","不好意思，我需要袋子","可以給我一個袋子嗎？"],
              options:["請問可以給我袋子嗎？","不用了，謝謝","謝謝再見","可以幫我裝袋嗎？"],
              feedback:{ perfect:"問得很有禮貌！", partial:"說出了重點！可以說：「請問可以給我袋子嗎？」", failed:"可以這樣說：「請問可以給我袋子嗎？」" } },
            { id:"bag_cost", shopkeeper_prompt:"好的！袋子要 2 元，可以嗎？", task:"說可以，你要袋子",
              keywords:["好","可以","行","OK","沒問題"], keywords_mode:'any',
              accepted_phrases:["好的，可以！","可以！","好，謝謝！"],
              options:["好的，可以！","不用了，謝謝","太貴了不要了","好，謝謝！"],
              feedback:{ perfect:"很好！", partial:"說出了重點！", failed:"可以這樣說：「好的，可以！」" } },
            { id:"goodbye", shopkeeper_prompt:"好的！袋子在這裡，謝謝光臨！", task:"道謝說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝，掰掰！","好的，謝謝！"],
              options:["謝謝！再見！","謝謝，掰掰！","好的，謝謝！","謝謝再見！"],
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！再加上「再見」", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 早餐店
    // ══════════════════════════════════════════
    {
      id: "breakfast_shop", name: "早餐店", icon: "🍳", available: true,
      theme: { color: '#D97706', bg: '#FEF3C7', accent: '#B45309' },
      situations: [
        {
          id: "basic", name: "基本點餐", icon: "🍳",
          desc: "點蛋餅和飲料，完整的早餐點餐流程",
          steps: [
            { id:"greeting", shopkeeper_prompt:"早安！歡迎光臨！", task:"跟店員打招呼，說早安",
              keywords:["你好","您好","哈囉","嗨","早","早安","午安","晚安","hi","請問","喂"], keywords_mode:'any',
              accepted_phrases:["早安！","你好！","您好！"],
              options:["早安！","謝謝再見","我要結帳","這個多少錢？"],
              feedback:{ perfect:"說得很好！早安打招呼很有禮貌！", partial:"不錯！可以加上「早安」讓招呼更完整", failed:"可以這樣說：「早安！」" } },
            { id:"order_main", shopkeeper_prompt:"請問要點什麼呢？", task:"點一份蛋餅",
              image:"images/a4/icon-a4-egg-pancake-shop.png", image_label:"蛋餅",
              keywords:["蛋餅"], keywords_mode:'any',
              accepted_phrases:["我要一份蛋餅","給我蛋餅","我要蛋餅"],
              options:["我要一份蛋餅","我要一杯豆漿","謝謝再見","請問廁所在哪裡？"],
              frame_ref:"want_item",
              slots:{ item:{ answer:"蛋餅", choices:[
                { text:"蛋餅", emoji:"🥞" }, { text:"漢堡", emoji:"🍔" },
                { text:"三明治", emoji:"🥪" }, { text:"飯糰", emoji:"🍙" } ] } },
              feedback:{ perfect:"點餐說得很清楚！", partial:"說出了重點！試著說完整：「我要一份蛋餅」", failed:"可以這樣說：「我要一份蛋餅」" } },
            { id:"customize", shopkeeper_prompt:"好的！蛋餅要加蛋嗎？", task:"回答店員：要加蛋",
              image:"images/a4/icon-a4-egg-pancake-shop.png", image_label:"蛋餅",
              keywords:["加蛋"], keywords_mode:'any',
              accepted_phrases:["要加蛋！","請幫我加蛋","加蛋"],
              options:["要加蛋！","不用了謝謝","請問多少錢？","我要奶茶"],
              feedback:{ perfect:"說得很清楚！", partial:"有說出重點！可以說：「要加蛋！」", failed:"可以這樣說：「要加蛋！」" } },
            { id:"order_drink", shopkeeper_prompt:"好的！請問要配什麼飲料？我們有豆漿和奶茶。", task:"點一杯熱豆漿",
              image:"images/a4/icon-a4-soy-milk-shop.png", image_label:"熱豆漿",
              keywords:["豆漿"], keywords_mode:'any',
              accepted_phrases:["我要熱豆漿","給我豆漿","我要豆漿"],
              options:["我要熱豆漿","我要奶茶","不用了謝謝","我要可樂"],
              frame_ref:"want_item",
              slots:{ item:{ answer:"豆漿", choices:[
                { text:"豆漿", emoji:"🥛" }, { text:"奶茶", emoji:"🧋" },
                { text:"紅茶", emoji:"🍵" }, { text:"咖啡", emoji:"☕" } ] } },
              feedback:{ perfect:"點飲料說得很好！", partial:"說出了飲料名稱！可以加上「我要」會更完整", failed:"可以這樣說：「我要熱豆漿」" } },
            { id:"checkout", shopkeeper_prompt:"好的！蛋餅加蛋和熱豆漿，總共 55 元，請問怎麼付款？",
              task:"告訴店員付款方式",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金","我要刷卡"],
              options:["我付現金","我要刷卡","用行動支付","我沒帶錢"],
              feedback:{ perfect:"說得很清楚！付款方式說明得很好！", partial:"聽到了！說清楚付款方式會更好", failed:"可以說：「我付現金」或「我要刷卡」" } },
            { id:"goodbye", shopkeeper_prompt:"好的，找您 45 元，餐點馬上好，請稍等一下！", task:"向店員道謝",
              keywords:["謝謝","感謝","謝"], keywords_mode:'any',
              accepted_phrases:["謝謝！","好的，謝謝！","謝謝，我等一下！"],
              options:["好的，謝謝！","再見","我要走了","還要加東西"],
              feedback:{ perfect:"道謝道得很有禮貌！太棒了！", partial:"有說謝謝！可以再加上「好的」更自然", failed:"可以這樣說：「好的，謝謝！」" } }
          ]
        },
        {
          id: "not_enough_money", name: "錢不夠", icon: "💸",
          desc: "結帳時發現錢不夠，如何跟老闆說明並做調整",
          steps: [
            { id:"greeting", shopkeeper_prompt:"早安！歡迎光臨！", task:"跟老闆打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安","午安","晚安","hi","請問","喂"], keywords_mode:'any',
              accepted_phrases:["早安！","你好！","您好！"],
              options:["早安！","謝謝再見","我要點餐","多少錢？"],
              feedback:{ perfect:"早安說得很好！", partial:"不錯！可以加上「早安」更應景", failed:"可以這樣說：「早安！」" } },
            { id:"order", shopkeeper_prompt:"請問要點什麼？", task:"點一份蛋餅和豆漿",
              image:"images/a4/icon-a4-egg-pancake-shop.png", image_label:"蛋餅",
              keywords:["蛋餅","豆漿"], keywords_mode:'any',
              accepted_phrases:["我要一份蛋餅和一杯豆漿","給我蛋餅，還有豆漿","我要蛋餅加豆漿"],
              options:["我要一份蛋餅和一杯豆漿","我要漢堡","謝謝再見","什麼最好吃？"],
              frame_ref:"want_two",
              slots:{
                item:{ answer:"蛋餅", choices:[ { text:"蛋餅", emoji:"🥞" }, { text:"漢堡", emoji:"🍔" }, { text:"三明治", emoji:"🥪" } ] },
                item2:{ answer:"豆漿", choices:[ { text:"豆漿", emoji:"🥛" }, { text:"奶茶", emoji:"🧋" }, { text:"紅茶", emoji:"🍵" } ] } },
              feedback:{ perfect:"點餐說得很清楚！", partial:"說出了部分！試著說完整：「我要一份蛋餅和一杯豆漿」", failed:"可以這樣說：「我要一份蛋餅和一杯豆漿」" } },
            { id:"hear_total", shopkeeper_prompt:"好的！蛋餅加豆漿，總共 55 元！", task:"告訴老闆你要付錢",
              keywords:["好","付","現金","給你"], keywords_mode:'any',
              accepted_phrases:["好的！","我付現金！","好，給你！"],
              options:["好的！","我付現金！","有沒有刷卡？","可以便宜嗎？"],
              feedback:{ perfect:"很好！", partial:"說出了重點！", failed:"可以這樣說：「好的！」" } },
            { id:"not_enough", shopkeeper_prompt:"（你打開錢包，發現只有 40 元）",
              task:"告訴老闆你的錢不夠",
              keywords:["不夠","只有","沒有","錢不夠","不到","不足","差","少","帶"], keywords_mode:'any',
              accepted_phrases:["不好意思，我錢不夠，不能買","不好意思，我只有 40 元，不夠","我錢不夠，對不起"],
              options:["不好意思，我錢不夠，不能買","我下次再來","可以先欠著嗎？","那我只要豆漿好了"],
              feedback:{ perfect:"說得很誠實！這樣很棒！", partial:"說出了重點！誠實說出來才能讓老闆幫你", failed:"可以這樣說：「不好意思，我錢不夠，不能買」" } },
            { id:"adjust", shopkeeper_prompt:"沒關係！你有 40 元，豆漿 25 元，找你 15 元，要嗎？",
              task:"決定只買豆漿，道謝",
              keywords:["好","可以","豆漿"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！那我要豆漿！","可以，謝謝！","好，謝謝你！"],
              options:["好的，謝謝！那我要豆漿！","不了，謝謝，我下次再來","好，謝謝你！","可以，謝謝！"],
              feedback:{ perfect:"很好！懂得隨機應變！", partial:"說出了重點！有謝謝老闆很好！", failed:"可以這樣說：「好的，謝謝！那我要豆漿！」" } }
          ]
        },
        {
          id: "wrong_order", name: "想換餐點", icon: "🔄",
          desc: "點完餐才發現點錯了，如何禮貌地請老闆更換",
          steps: [
            { id:"order", shopkeeper_prompt:"早安！請問要點什麼？", task:"打招呼並點蛋餅",
              keywords:["蛋餅"], keywords_mode:'any',
              accepted_phrases:["早安！我要一份蛋餅","你好，我要蛋餅","我要一份蛋餅"],
              options:["早安！我要一份蛋餅","謝謝再見","有什麼好吃的？","我要漢堡"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「早安！我要一份蛋餅」" } },
            { id:"confirm", shopkeeper_prompt:"好的，一份蛋餅，要加蛋嗎？", task:"說你要加蛋",
              keywords:["加蛋"], keywords_mode:'any',
              accepted_phrases:["要加蛋！","請加蛋！","要，加蛋"],
              options:["要加蛋！","不用了","隨便","我要改點別的"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「要加蛋！」" } },
            { id:"change_mind", shopkeeper_prompt:"好的！（老闆開始準備）",
              task:"突然想改成漢堡，請老闆幫你換",
              keywords:["換","改","不好意思","可以換","可以改","想改","漢堡","更換"], keywords_mode:'any',
              accepted_phrases:["不好意思，可以改成漢堡嗎？","不好意思，我想換成漢堡","可以換成漢堡嗎？不好意思"],
              options:["不好意思，可以改成漢堡嗎？","沒事，蛋餅就好","我不要了","謝謝"],
              feedback:{ perfect:"說得很有禮貌！記得要說「不好意思」！", partial:"說出了要換的意思！記得加上「不好意思」會更禮貌", failed:"可以這樣說：「不好意思，可以改成漢堡嗎？」" } },
            { id:"confirm2", shopkeeper_prompt:"可以！漢堡 45 元，一樣要加蛋嗎？", task:"說不用加蛋，謝謝",
              keywords:["不用","不加","不要"], keywords_mode:'any',
              accepted_phrases:["不用了，謝謝！","不加蛋，謝謝！","不用，謝謝！"],
              options:["不用了，謝謝！","要，請加蛋！","隨便","謝謝"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！加上謝謝很有禮貌", failed:"可以這樣說：「不用了，謝謝！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！漢堡 45 元，請等一下！", task:"付錢並道謝",
              keywords:["謝謝"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","謝謝，我等你！","謝謝！","我付現金！謝謝！"],
              options:["好的，謝謝！","謝謝，我等你！","我付現金！謝謝！","謝謝！"],
              feedback:{ perfect:"很好！耐心等待很棒！", partial:"有說謝謝！很有禮貌！", failed:"可以這樣說：「好的，謝謝！」" } }
          ]
        },
        {
          id: "ask_recommendation", name: "不知道要點什麼", icon: "🤔",
          desc: "不知道要吃什麼，請老闆推薦今日招牌",
          steps: [
            { id:"greet_ask", shopkeeper_prompt:"早安！請問要點什麼？",
              task:"打招呼並請老闆推薦",
              keywords:["推薦","好吃","招牌","不知道","建議"], keywords_mode:'any',
              accepted_phrases:["早安！我不知道要吃什麼，有什麼推薦？","早安！請問有什麼好吃的？","不知道要點什麼，可以推薦嗎？"],
              options:["早安！我不知道要吃什麼，有什麼推薦？","早安！我要蛋餅","謝謝再見","我看一下菜單"],
              feedback:{ perfect:"很好！懂得詢問推薦！", partial:"說出了重點！", failed:"可以這樣說：「早安！我不知道要吃什麼，有什麼推薦？」" } },
            { id:"recommend", shopkeeper_prompt:"今天蛋餅加蛋超好吃，蘿蔔糕也很受歡迎！", task:"說你要蛋餅加蛋",
              keywords:["蛋餅","加蛋"], keywords_mode:'any',
              accepted_phrases:["好的，我要蛋餅加蛋！","那我要蛋餅加蛋！","蛋餅加蛋！"],
              options:["好的，我要蛋餅加蛋！","那我要蘿蔔糕！","都來一個！","謝謝再見"],
              feedback:{ perfect:"很好！接受推薦很棒！", partial:"說出了重點！", failed:"可以這樣說：「好的，我要蛋餅加蛋！」" } },
            { id:"drink", shopkeeper_prompt:"好的！要配飲料嗎？", task:"說你要一杯豆漿",
              keywords:["豆漿"], keywords_mode:'any',
              accepted_phrases:["我要豆漿！","給我豆漿","一杯豆漿"],
              options:["我要豆漿！","我要奶茶","不用了，謝謝","我要柳橙汁"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我要豆漿！」" } },
            { id:"checkout", shopkeeper_prompt:"蛋餅加蛋加豆漿，共 60 元，謝謝！", task:"付款並道謝",
              keywords:["謝謝"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","謝謝，我付現金！","謝謝！"],
              options:["好的，謝謝！","謝謝，我付現金！","謝謝！","掰掰！"],
              feedback:{ perfect:"很棒！太有禮貌了！", partial:"有說謝謝！", failed:"可以這樣說：「好的，謝謝！」" } }
          ]
        },
        {
          id: "wait_too_long", name: "等太久了", icon: "⏰",
          desc: "等餐等了很久，如何禮貌地詢問老闆",
          steps: [
            { id:"ask_order", shopkeeper_prompt:"（你點完餐已等了 10 分鐘，其他客人都拿到了）",
              task:"禮貌地問老闆你的餐點好了沒",
              keywords:["好了","餐點","多久","不好意思"], keywords_mode:'any',
              accepted_phrases:["不好意思，請問我的餐點好了嗎？","請問蛋餅好了嗎？","不好意思，我等了一段時間了"],
              options:["不好意思，請問我的餐點好了嗎？","我的餐點好了嗎？","等了很久了！","請問要多久？"],
              feedback:{ perfect:"問得很有禮貌！「不好意思」說得很好！", partial:"說出了重點！加上「不好意思」更有禮貌", failed:"可以這樣說：「不好意思，請問我的餐點好了嗎？」" } },
            { id:"apology", shopkeeper_prompt:"啊，不好意思！馬上好，再等 2 分鐘！",
              task:"說沒關係，你願意等",
              keywords:["沒關係","好","謝謝","等","行","沒事","OK"], keywords_mode:'any',
              accepted_phrases:["沒關係，我等你！","好的，謝謝！","沒事，我再等等！"],
              options:["沒關係，我等你！","好的，謝謝！","沒事，我再等等！","好，謝謝！"],
              feedback:{ perfect:"很好！有耐心等待！", partial:"說出了重點！", failed:"可以這樣說：「沒關係，我等你！」" } },
            { id:"receive", shopkeeper_prompt:"好了！不好意思讓你久等了！", task:"說謝謝，沒關係",
              keywords:["謝謝","沒關係","好","沒事","還好","OK","了解"], keywords_mode:'any',
              accepted_phrases:["謝謝！沒關係！","謝謝你！","沒關係，謝謝！"],
              options:["謝謝！沒關係！","謝謝你！","沒關係，謝謝！","謝謝，好香！"],
              feedback:{ perfect:"說得很有禮貌！寬容的態度很棒！", partial:"有說謝謝！", failed:"可以這樣說：「謝謝！沒關係！」" } }
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 超市
    // ══════════════════════════════════════════
    {
      id: "supermarket", name: "超市", icon: "🛒", available: true,
      theme: { color: '#7C3AED', bg: '#EDE9FE', accent: '#6D28D9' },
      situations: [
        {
          id: "basic", name: "基本購物", icon: "🛒",
          desc: "從詢問位置到秤重結帳的完整超市購物流程",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！歡迎光臨！", task:"跟服務人員打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安","午安","晚安","hi","請問","喂"], keywords_mode:'any',
              accepted_phrases:["你好！","您好！","哈囉！"],
              options:["你好！","謝謝再見","我要結帳","這個多少錢？"],
              feedback:{ perfect:"打招呼打得很有禮貌！很棒！", partial:"不錯！可以說得更完整一點", failed:"可以這樣說：「你好！」" } },
            { id:"ask_location", shopkeeper_prompt:"請問需要幫忙嗎？", task:"詢問蔬菜水果區在哪裡",
              keywords:["蔬菜","水果"], keywords_mode:'any',
              accepted_phrases:["請問蔬菜水果在哪裡？","水果區在哪邊？","蔬菜在哪裡？"],
              options:["請問蔬菜水果在哪裡？","我要結帳","謝謝再見","這個多少錢？"],
              frame_ref:"ask_location",
              slots:{ item:{ answer:"蔬菜水果", choices:[
                { text:"蔬菜水果", emoji:"🥬" }, { text:"飲料", emoji:"🥤" },
                { text:"餅乾", emoji:"🍪" }, { text:"牛奶", emoji:"🥛" } ] } },
              feedback:{ perfect:"問得很清楚！", partial:"說出了部分重點！試著說完整：「請問蔬菜水果在哪裡？」", failed:"可以這樣說：「請問蔬菜水果在哪裡？」" } },
            { id:"ask_weigh", shopkeeper_prompt:"蔬菜水果區在右手邊。請問還需要什麼嗎？", task:"請服務人員幫忙秤重蘋果",
              keywords:["秤"], keywords_mode:'any',
              accepted_phrases:["請幫我秤一下這個蘋果","麻煩幫我秤重","可以幫我秤重嗎？"],
              options:["請幫我秤一下這個蘋果","我要結帳了","謝謝再見","請問廁所在哪裡？"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了部分！試著說：「請幫我秤一下這個蘋果」", failed:"可以這樣說：「請幫我秤一下這個蘋果」" } },
            { id:"confirm_purchase", shopkeeper_prompt:"這包蘋果重 0.6 公斤，一公斤 80 元，所以是 48 元，你要買嗎？",
              task:"告訴店員你要買這包蘋果",
              keywords:["買","要","好","給","來","拿","這個"], keywords_mode:'any',
              accepted_phrases:["好的，我要買！","我要這包！","要買！"],
              options:["好的，我要買！","請問廁所在哪裡？","蘋果在哪裡？","謝謝再見"],
              feedback:{ perfect:"很好！購買意願說得很清楚！", partial:"說出了重點！可以說得更完整：「好的，我要買！」", failed:"可以這樣說：「好的，我要買！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！蘋果 48 元，請到收銀台結帳，請問怎麼付款？",
              task:"告訴收銀員付款方式",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金","我要刷卡","用悠遊卡"],
              options:["我付現金","我要刷卡","用悠遊卡","我沒帶錢"],
              feedback:{ perfect:"說得很清楚！", partial:"聽到了！說清楚付款方式會更好", failed:"可以說：「我付現金」或「用悠遊卡」" } },
            { id:"goodbye", shopkeeper_prompt:"好的，找您 52 元，請拿好，歡迎再來！", task:"道謝並說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝再見！","謝謝！再見！","謝謝，掰掰！"],
              options:["謝謝再見！","你好","我要買東西","請問在哪裡？"],
              feedback:{ perfect:"道謝道得很有禮貌！太棒了！", partial:"有說了！同時說謝謝和再見更完整喔", failed:"可以這樣說：「謝謝再見！」" } }
          ]
        },
        {
          id: "cant_find_item", name: "找不到商品", icon: "🔍",
          desc: "在超市找不到有機雞蛋，向店員求助並接受建議",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！歡迎光臨！", task:"跟店員打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安","午安","晚安","hi","請問","喂"], keywords_mode:'any',
              accepted_phrases:["你好！","您好！"],
              options:["你好！","謝謝再見","我要結帳","多少錢？"],
              feedback:{ perfect:"很好！", partial:"可以說得更完整", failed:"可以這樣說：「你好！」" } },
            { id:"ask_eggs", shopkeeper_prompt:"請問需要幫忙嗎？", task:"詢問有機雞蛋在哪裡",
              keywords:["雞蛋","蛋","有機"], keywords_mode:'any',
              accepted_phrases:["請問有機雞蛋在哪裡？","我在找有機雞蛋","請問雞蛋在哪裡？"],
              options:["請問有機雞蛋在哪裡？","我要結帳","謝謝再見","請問多少錢？"],
              frame_ref:"ask_location",
              slots:{ item:{ answer:"有機雞蛋", choices:[
                { text:"有機雞蛋", emoji:"🥚" }, { text:"牛奶", emoji:"🥛" },
                { text:"蔬菜", emoji:"🥬" }, { text:"飲料", emoji:"🥤" } ] } },
              feedback:{ perfect:"問得很清楚！", partial:"說出了重點！試著說完整：「請問有機雞蛋在哪裡？」", failed:"可以這樣說：「請問有機雞蛋在哪裡？」" } },
            { id:"out_of_stock", shopkeeper_prompt:"不好意思，有機雞蛋賣完了！但我們還有普通雞蛋，你要嗎？",
              task:"詢問普通雞蛋的價格",
              keywords:["多少","幾元","價格","怎麼賣"], keywords_mode:'any',
              accepted_phrases:["普通雞蛋多少錢？","那普通的多少錢？","請問多少錢？"],
              options:["普通雞蛋多少錢？","那我不要了","好，給我普通的","謝謝再見"],
              feedback:{ perfect:"很好！懂得詢問替代方案！", partial:"說出了重點！可以問價格再決定", failed:"可以這樣說：「普通雞蛋多少錢？」" } },
            { id:"decide", shopkeeper_prompt:"普通雞蛋一盒 10 顆，45 元！", task:"告訴店員你要買普通雞蛋",
              keywords:["好","買","要","給","可以","行","謝謝","換","選"], keywords_mode:'any',
              accepted_phrases:["好的，我要買！","那給我普通的！","好，我要這盒！"],
              options:["好的，我要買！","那給我普通的！","請問廁所在哪裡？","雞蛋在哪裡？"],
              feedback:{ perfect:"很好！懂得隨機應變！", partial:"說出了重點！", failed:"可以這樣說：「好的，我要買！」" } },
            { id:"goodbye", shopkeeper_prompt:"好的！請到收銀台結帳，謝謝！", task:"道謝說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝你！再見！","好的，謝謝！"],
              options:["謝謝！再見！","謝謝你！","好的，謝謝！","掰掰！"],
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！很好！", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        },
        {
          id: "not_enough_money", name: "錢不夠", icon: "💸",
          desc: "結帳時發現錢不夠，禮貌說明並放回一樣商品",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！歡迎光臨！", task:"跟收銀員打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安","午安","晚安","hi","請問","喂"], keywords_mode:'any',
              accepted_phrases:["你好！","您好！"],
              options:["你好！","謝謝再見","多少錢？","我要結帳"],
              feedback:{ perfect:"很好！", partial:"可以說得更完整", failed:"可以這樣說：「你好！」" } },
            { id:"checkout_start", shopkeeper_prompt:"您好！蘋果 48 元、牛奶 65 元，總共 113 元，請問怎麼付款？",
              task:"告訴收銀員你要付現金",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金","付現金","現金"],
              options:["我付現金","我要刷卡","用悠遊卡","稍等一下"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我付現金」" } },
            { id:"not_enough", shopkeeper_prompt:"（你數了錢，發現只有 80 元，不夠 113 元）",
              task:"告訴收銀員你的錢不夠",
              keywords:["不夠","只有","不足","不到"], keywords_mode:'any',
              accepted_phrases:["不好意思，我的錢不夠","我只有 80 元，不夠","不好意思，我錢不夠"],
              options:["不好意思，我的錢不夠","我下次再來","可以刷卡嗎？","我再找找錢"],
              feedback:{ perfect:"說得很誠實！很勇敢！", partial:"說出了重點！讓收銀員知道是正確的！", failed:"可以這樣說：「不好意思，我的錢不夠」" } },
            { id:"return_item", shopkeeper_prompt:"沒關係！你要放回哪一樣？",
              task:"說你要放回牛奶",
              keywords:["牛奶"], keywords_mode:'any',
              accepted_phrases:["我放回牛奶好了","把牛奶放回去","牛奶退掉"],
              options:["我放回牛奶好了","我放回蘋果","都放回去","我再想想"],
              feedback:{ perfect:"很好！懂得解決問題！", partial:"說出了重點！", failed:"可以這樣說：「我放回牛奶好了」" } },
            { id:"goodbye", shopkeeper_prompt:"好的！那蘋果 48 元，找您 32 元，謝謝！", task:"道謝說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝你！","好的，謝謝！"],
              options:["謝謝！再見！","謝謝你！","好的，謝謝！","掰掰！"],
              feedback:{ perfect:"說得很有禮貌！下次多帶一點錢喔！", partial:"有說謝謝！", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        },
        {
          id: "damaged_product", name: "商品有問題", icon: "🚨",
          desc: "發現商品有破損，向店員反映並請求更換",
          steps: [
            { id:"find_damage", shopkeeper_prompt:"（你在貨架上拿了一瓶果汁，發現蓋子有裂痕）",
              task:"向附近的店員反映商品有問題",
              keywords:["問題","裂","壞","漏","破","損","裂痕","壞掉","不好"],keywords_mode:'any',
              accepted_phrases:["不好意思，這瓶果汁好像有問題","這個蓋子裂掉了","這個商品壞了"],
              options:["不好意思，這瓶果汁好像有問題","我要買這個","請問多少錢？","謝謝再見"],
              feedback:{ perfect:"很好！主動反映問題很棒！", partial:"說出了重點！", failed:"可以這樣說：「不好意思，這瓶果汁好像有問題」" } },
            { id:"staff_check", shopkeeper_prompt:"謝謝你告訴我！我來看看……確實蓋子有裂，我幫你換一瓶！",
              task:"謝謝店員，說你願意等",
              keywords:["謝謝","好","可以","等","行","沒問題","麻煩"], keywords_mode:'any',
              accepted_phrases:["謝謝！我等你！","好的，謝謝！","可以，謝謝！"],
              options:["謝謝！我等你！","那我不要了","好的，謝謝！","可以，謝謝！"],
              feedback:{ perfect:"很好！有耐心等待！", partial:"說出了重點！", failed:"可以這樣說：「謝謝！我等你！」" } },
            { id:"new_item", shopkeeper_prompt:"這是新的！完整沒有問題，請確認一下！",
              task:"確認沒問題，道謝",
              keywords:["好","謝謝","沒問題","可以","OK","看過了"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","沒問題，謝謝！","謝謝你！"],
              options:["好的，謝謝！","沒問題，謝謝！","謝謝你！","謝謝，再見！"],
              feedback:{ perfect:"說得很有禮貌！", partial:"有說謝謝！", failed:"可以這樣說：「好的，謝謝！」" } },
            { id:"checkout", shopkeeper_prompt:"不客氣！請到收銀台結帳，謝謝！", task:"道謝說再見",
              keywords:["謝謝","再見","掰"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝你！再見！","好的，謝謝！"],
              options:["謝謝！再見！","謝謝你！","好的，謝謝！","掰掰！謝謝！"],
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        },
        {
          id: "wrong_change", name: "找零錯了", icon: "💰",
          desc: "收銀員找錯零，如何禮貌地指出並核對",
          steps: [
            { id:"pay", shopkeeper_prompt:"蘋果 48 元，謝謝！（你給了 100 元）", task:"告訴收銀員你給了 100 元",
              keywords:["50","100","200","500","1000","五十","一百","兩百","五百","一千"], keywords_mode:'any',
              accepted_phrases:["我給你 100 元","這是 100 元","給你 100 元"],
              options:["我給你 100 元","這是 100 元","給你","謝謝"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我給你 100 元」" } },
            { id:"wrong_change", shopkeeper_prompt:"好的！找您 42 元！（收銀員找回 42 元，但正確應找 52 元）",
              task:"禮貌地告訴收銀員找零好像不對",
              keywords:["不對","錯","應該","少","多","找錯","好像","差"], keywords_mode:'any',
              accepted_phrases:["不好意思，找零好像不對","應該找我 52 元","不好意思，好像少了 10 元"],
              options:["不好意思，找零好像不對","謝謝，沒關係","可以再算一次嗎？","我再數數看"],
              feedback:{ perfect:"很好！勇敢禮貌地說出來！", partial:"說出了重點！加上「不好意思」更有禮貌", failed:"可以這樣說：「不好意思，找零好像不對」" } },
            { id:"corrected", shopkeeper_prompt:"不好意思！我再算一次……對，找您 52 元，真的很抱歉！",
              task:"說沒關係，謝謝",
              keywords:["謝謝","沒關係","好","沒事","了解","知道","OK"], keywords_mode:'any',
              accepted_phrases:["沒關係，謝謝！","好的，謝謝！","謝謝，沒事！"],
              options:["沒關係，謝謝！","好的，謝謝！","謝謝，沒事！","謝謝再見！"],
              feedback:{ perfect:"說得很有禮貌！", partial:"有說謝謝！", failed:"可以這樣說：「沒關係，謝謝！」" } }
          ]
        },
        {
          id: "ask_sale", name: "詢問特賣商品", icon: "🏷️",
          desc: "在超市詢問有沒有特價活動或推薦商品",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！歡迎光臨！", task:"打招呼並詢問今天有沒有特賣",
              keywords:["特賣","特價","優惠","打折"], keywords_mode:'any',
              accepted_phrases:["請問今天有沒有特賣？","有沒有特價商品？","今天有什麼優惠嗎？"],
              options:["請問今天有沒有特賣？","有沒有特價商品？","今天有什麼優惠嗎？","謝謝再見"],
              feedback:{ perfect:"問得很好！懂得找優惠！", partial:"說出了重點！", failed:"可以這樣說：「請問今天有沒有特賣？」" } },
            { id:"staff_answers", shopkeeper_prompt:"有！今天雞蛋和優格都有特價，買二送一喔！",
              task:"說你要去看看雞蛋",
              keywords:["看看","去看","雞蛋","謝謝"], keywords_mode:'any',
              accepted_phrases:["好的，我去看看雞蛋！","那我去看雞蛋！","好，謝謝你！"],
              options:["好的，我去看看雞蛋！","那我去看雞蛋！","都買！","謝謝，我去看看！"],
              feedback:{ perfect:"很好！積極去看看！", partial:"說出了重點！", failed:"可以這樣說：「好的，我去看看雞蛋！」" } },
            { id:"decide", shopkeeper_prompt:"雞蛋特賣區在左手邊！需要幫忙嗎？", task:"說謝謝，你可以自己找",
              keywords:["自己","不用","謝謝"], keywords_mode:'any',
              accepted_phrases:["謝謝，我自己去找！","不用了，謝謝！","謝謝，我可以！"],
              options:["謝謝，我自己去找！","不用了，謝謝！","可以帶我去嗎？","謝謝！"],
              feedback:{ perfect:"很好！說得很有禮貌！", partial:"說出了重點！", failed:"可以這樣說：「謝謝，我自己去找！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！需要幫忙隨時說！",
              task:"謝謝店員說再見",
              keywords:["謝謝","再見","掰"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝你！","好的，謝謝！"],
              options:["謝謝！再見！","謝謝你！","好的，謝謝！","掰掰！"],
              feedback:{ perfect:"說得很有禮貌！", partial:"有說謝謝！", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 夜市攤販
    // ══════════════════════════════════════════
    {
      id: "night_market", name: "夜市攤販", icon: "🧋", available: true,
      theme: { color: '#DC2626', bg: '#FEF2F2', accent: '#B91C1C' },
      situations: [
        {
          id: "basic", name: "基本點飲料", icon: "🧋",
          desc: "在夜市點珍珠奶茶，包含議價的完整流程",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！歡迎光臨，請問要什麼？", task:"跟攤販老闆打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安","午安","晚安","hi","請問","喂"], keywords_mode:'any',
              accepted_phrases:["你好！","您好！","哈囉！"],
              options:["你好！","謝謝再見","多少錢？","廁所在哪裡？"],
              feedback:{ perfect:"打招呼打得很好！", partial:"不錯！可以說得更完整一點", failed:"可以這樣說：「你好！」" } },
            { id:"order", shopkeeper_prompt:"我們有珍珠奶茶、冬瓜茶和檸檬汁，你要哪一種？",
              task:"點一杯珍珠奶茶",
              keywords:["珍珠","奶茶"], keywords_mode:'any',
              accepted_phrases:["我要珍珠奶茶","給我珍珠奶茶","一杯珍珠奶茶"],
              options:["我要珍珠奶茶","我要冬瓜茶","我要檸檬汁","謝謝再見"],
              frame_ref:"want_item",
              slots:{ item:{ answer:"珍珠奶茶", choices:[
                { text:"珍珠奶茶", emoji:"🧋" }, { text:"冬瓜茶", emoji:"🍵" },
                { text:"檸檬汁", emoji:"🧃" }, { text:"咖啡", emoji:"☕" } ] } },
              feedback:{ perfect:"點餐說得很清楚！", partial:"說出了重點！試著說完整：「我要珍珠奶茶」", failed:"可以這樣說：「我要珍珠奶茶」" } },
            { id:"size", shopkeeper_prompt:"好的！大杯還是小杯？", task:"回答要大杯",
              keywords:["大杯","大","大的","最大","要大","大號"], keywords_mode:'any',
              accepted_phrases:["大杯！","我要大杯","大的"],
              options:["大杯！","小杯好了","中杯","我不知道"],
              feedback:{ perfect:"說得很清楚！", partial:"有說出重點！可以說：「大杯！」", failed:"可以這樣說：「大杯！」" } },
            { id:"ask_price", shopkeeper_prompt:"好的！大杯珍珠奶茶，請問還需要什麼嗎？", task:"詢問珍珠奶茶多少錢",
              keywords:["多少","幾塊","幾元","幾錢","怎麼賣","多少錢","幾塊錢","價格","多少元","賣多少"], keywords_mode:'any',
              accepted_phrases:["請問多少錢？","這杯多少錢？","多少錢？"],
              options:["請問多少錢？","謝謝再見","我要再一杯","好的"],
              frame_ref:"ask_price",
              slots:{ item:{ answer:"珍珠奶茶", choices:[
                { text:"珍珠奶茶", emoji:"🧋" }, { text:"雞排", emoji:"🍗" },
                { text:"香腸", emoji:"🌭" }, { text:"飲料", emoji:"🥤" } ] } },
              feedback:{ perfect:"問得很好！", partial:"說出了重點！可以加上「請問」會更有禮貌", failed:"可以這樣說：「請問多少錢？」" } },
            { id:"bargain", shopkeeper_prompt:"大杯珍珠奶茶 60 元喔！", task:"試試看跟老闆說能不能便宜一點",
              keywords:["便宜","算","少","打折","優惠","可以少","降","便宜點"], keywords_mode:'any',
              accepted_phrases:["可以算我便宜一點嗎？","可以便宜嗎？","少一點嘛！"],
              options:["可以算我便宜一點嗎？","你好！","請問廁所在哪裡？","謝謝再見"],
              feedback:{ perfect:"議價說得很有禮貌！", partial:"說出了想法！可以說：「可以算我便宜一點嗎？」", failed:"可以這樣說：「可以算我便宜一點嗎？」" } },
            { id:"checkout", shopkeeper_prompt:"好啦，算你 55 元！", task:"付款並向老闆道謝",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["謝謝！我付現金。","我付現金","我要刷卡"],
              options:["謝謝！我付現金。","還要再便宜！","我要退貨","謝謝再見"],
              feedback:{ perfect:"太棒了！既道謝又說清楚付款方式！", partial:"有說謝謝！可以再說一下付款方式", failed:"可以這樣說：「謝謝！我付現金。」" } }
          ]
        },
        {
          id: "not_enough_money", name: "錢不夠", icon: "💸",
          desc: "議價後仍然錢不夠，誠實向老闆說明",
          steps: [
            { id:"order_ask", shopkeeper_prompt:"你好！請問要什麼？", task:"點珍珠奶茶並詢問價格",
              keywords:["珍珠","奶茶"], keywords_mode:'any',
              accepted_phrases:["我要珍珠奶茶，請問多少錢？","珍珠奶茶多少錢？","我要珍珠奶茶，多少錢？"],
              options:["我要珍珠奶茶，請問多少錢？","謝謝再見","我要冬瓜茶","請問你們有什麼？"],
              feedback:{ perfect:"說得很完整！一次說清楚要什麼還問了價格！", partial:"說出了重點！試著同時說要什麼和問價格", failed:"可以這樣說：「我要珍珠奶茶，請問多少錢？」" } },
            { id:"hear_price", shopkeeper_prompt:"大杯 60 元，小杯 45 元！", task:"說你要小杯的",
              keywords:["小杯","小"], keywords_mode:'any',
              accepted_phrases:["我要小杯的","小杯！","給我小杯"],
              options:["我要小杯的","我要大杯的","請問廁所在哪裡？","謝謝再見"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我要小杯的」" } },
            { id:"check_money", shopkeeper_prompt:"好的！小杯珍珠奶茶 45 元。（你找錢包，發現只有 30 元）",
              task:"告訴老闆你的錢不夠",
              keywords:["不夠","只有","不足","不到"], keywords_mode:'any',
              accepted_phrases:["不好意思，我的錢不夠","我只有 30 元，不夠","不好意思，我錢不夠，不能買"],
              options:["不好意思，我的錢不夠","可以算我便宜一點嗎？","我下次再來","我回去拿錢"],
              feedback:{ perfect:"說得很有禮貌！誠實很重要！", partial:"說出了重點！", failed:"可以這樣說：「不好意思，我的錢不夠」" } },
            { id:"vendor_response", shopkeeper_prompt:"沒關係！那你 30 元給我，我算你冬瓜茶小杯，要嗎？",
              task:"接受老闆的建議，道謝",
              keywords:["好","可以","沒問題"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","可以，謝謝！","好，謝謝老闆！"],
              options:["好的，謝謝！","不用了，謝謝","可以，謝謝！","那我下次再來"],
              feedback:{ perfect:"很好！懂得接受別人的好意！", partial:"說出了重點！", failed:"可以這樣說：「好的，謝謝！」" } },
            { id:"goodbye", shopkeeper_prompt:"拿好！下次帶多一點錢喔！", task:"道謝說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝老闆！再見！","謝謝，掰掰！"],
              options:["謝謝！再見！","謝謝老闆！再見！","謝謝，掰掰！","好的，謝謝！"],
              feedback:{ perfect:"太棒了！有禮貌道別！", partial:"有說謝謝！再加上「再見」更完整", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        },
        {
          id: "wrong_flavor", name: "點錯口味了", icon: "🔄",
          desc: "發現拿到的飲料口味不對，如何禮貌地請老闆更換",
          steps: [
            { id:"order", shopkeeper_prompt:"你好！請問要什麼？", task:"點一杯冬瓜茶",
              keywords:["冬瓜"], keywords_mode:'any',
              accepted_phrases:["我要冬瓜茶","給我冬瓜茶","一杯冬瓜茶"],
              options:["我要冬瓜茶","我要珍珠奶茶","我要檸檬汁","謝謝再見"],
              frame_ref:"want_item",
              slots:{ item:{ answer:"冬瓜茶", choices:[
                { text:"冬瓜茶", emoji:"🍵" }, { text:"珍珠奶茶", emoji:"🧋" },
                { text:"檸檬汁", emoji:"🧃" }, { text:"咖啡", emoji:"☕" } ] } },
              feedback:{ perfect:"點餐說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我要冬瓜茶」" } },
            { id:"receive_wrong", shopkeeper_prompt:"（老闆遞給你一杯檸檬汁）這是你的！",
              task:"告訴老闆你點的是冬瓜茶，不是檸檬汁",
              keywords:["冬瓜"], keywords_mode:'any',
              accepted_phrases:["不好意思，我點的是冬瓜茶","這個不對，我要冬瓜茶","不好意思，我要的是冬瓜茶"],
              options:["不好意思，我點的是冬瓜茶","謝謝，就這樣吧","這個多少錢？","我不要了"],
              feedback:{ perfect:"很好！說得很清楚！有「不好意思」更有禮貌！", partial:"說出了重點！記得加上「不好意思」", failed:"可以這樣說：「不好意思，我點的是冬瓜茶」" } },
            { id:"vendor_fix", shopkeeper_prompt:"啊，不好意思！我拿錯了，馬上給你換！",
              task:"說沒關係，謝謝老闆",
              keywords:["沒關係","謝謝","好","沒事","OK","行"], keywords_mode:'any',
              accepted_phrases:["沒關係，謝謝！","好的，謝謝！","謝謝老闆！"],
              options:["沒關係，謝謝！","好的，謝謝！","謝謝老闆！","沒事！"],
              feedback:{ perfect:"很好！寬容地說「沒關係」很棒！", partial:"說出了重點！", failed:"可以這樣說：「沒關係，謝謝！」" } },
            { id:"checkout", shopkeeper_prompt:"這是冬瓜茶！45 元，謝謝！", task:"付錢並道謝",
              keywords:["謝謝"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","謝謝！","謝謝，再見！"],
              options:["好的，謝謝！","謝謝！","謝謝，再見！","掰掰，謝謝！"],
              feedback:{ perfect:"太棒了！很有禮貌！", partial:"有說謝謝！", failed:"可以這樣說：「好的，謝謝！」" } }
          ]
        },
        {
          id: "find_stall", name: "找不到攤位", icon: "🗺️",
          desc: "在夜市找不到特定攤位，向路人或其他攤販詢問方向",
          steps: [
            { id:"ask_direction", shopkeeper_prompt:"（你在夜市迷路，找不到珍珠奶茶攤。旁邊有一個攤販老闆）",
              task:"向攤販詢問珍珠奶茶攤在哪裡",
              keywords:["珍珠奶茶","奶茶"], keywords_mode:'any',
              accepted_phrases:["不好意思，請問珍珠奶茶攤在哪裡？","請問哪裡有珍珠奶茶？","不好意思，珍珠奶茶在哪裡？"],
              options:["不好意思，請問珍珠奶茶攤在哪裡？","請問哪裡有珍珠奶茶？","謝謝再見","我再找找"],
              feedback:{ perfect:"問得很清楚！「不好意思」說得很好！", partial:"說出了重點！加上「不好意思」更有禮貌", failed:"可以這樣說：「不好意思，請問珍珠奶茶攤在哪裡？」" } },
            { id:"directions", shopkeeper_prompt:"珍珠奶茶攤在前面第三個，往前走就看到了！",
              task:"謝謝對方，說你知道了",
              keywords:["謝謝","知道","好","了解","找到了","OK","清楚"], keywords_mode:'any',
              accepted_phrases:["謝謝！我知道了！","謝謝你！","好的，謝謝！"],
              options:["謝謝！我知道了！","謝謝你！","好的，謝謝！","謝謝，掰掰！"],
              feedback:{ perfect:"說得很有禮貌！", partial:"有說謝謝！", failed:"可以這樣說：「謝謝！我知道了！」" } },
            { id:"arrive", shopkeeper_prompt:"（你找到了！）你好！請問要什麼？", task:"打招呼並點珍珠奶茶大杯",
              keywords:["珍珠","奶茶"], keywords_mode:'any',
              accepted_phrases:["你好！我要大杯珍珠奶茶！","你好，給我大杯珍珠奶茶！","我要珍珠奶茶，大杯！"],
              options:["你好！我要大杯珍珠奶茶！","你好，給我大杯珍珠奶茶！","我要冬瓜茶","謝謝再見"],
              feedback:{ perfect:"很好！找到攤位了，說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「你好！我要大杯珍珠奶茶！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！大杯珍珠奶茶 60 元，謝謝！", task:"付款並道謝",
              keywords:["謝謝"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","謝謝，我付現金！","謝謝！"],
              options:["好的，謝謝！","謝謝，我付現金！","謝謝！","掰掰！"],
              feedback:{ perfect:"很棒！", partial:"有說謝謝！", failed:"可以這樣說：「好的，謝謝！」" } }
          ]
        },
        {
          id: "wrong_change", name: "找零錯了", icon: "💰",
          desc: "夜市老闆找錯零錢，如何禮貌地指出並核對",
          steps: [
            { id:"pay", shopkeeper_prompt:"大杯珍珠奶茶 55 元，謝謝！（你給了 100 元）", task:"告訴老闆你給了 100 元",
              keywords:["50","100","200","500","1000","五十","一百","兩百","五百","一千"], keywords_mode:'any',
              accepted_phrases:["我給你 100 元","這是 100 元","給你 100 元"],
              options:["我給你 100 元","這是 100 元","給你","謝謝"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我給你 100 元」" } },
            { id:"wrong_change", shopkeeper_prompt:"找你 35 元！（老闆找回 35 元，但正確應找 45 元）",
              task:"禮貌地告訴老闆找零好像不對",
              keywords:["不對","錯","應該","少","多","找錯","好像","差"], keywords_mode:'any',
              accepted_phrases:["不好意思，好像少找了 10 元","應該找我 45 元","不好意思，找零好像不對"],
              options:["不好意思，好像少找了 10 元","謝謝，沒關係","可以再算一次嗎？","我再數數看"],
              feedback:{ perfect:"很好！禮貌指出很重要！", partial:"說出了重點！", failed:"可以這樣說：「不好意思，好像少找了 10 元」" } },
            { id:"corrected", shopkeeper_prompt:"啊！真的，不好意思！補你 10 元，這是 45 元！",
              task:"說沒關係，謝謝",
              keywords:["謝謝","沒關係","好","沒事","了解","知道","OK"], keywords_mode:'any',
              accepted_phrases:["沒關係，謝謝！","好的，謝謝！","謝謝老闆！"],
              options:["沒關係，謝謝！","好的，謝謝！","謝謝老闆！","謝謝，再見！"],
              feedback:{ perfect:"說得很有禮貌！大度說「沒關係」很棒！", partial:"有說謝謝！", failed:"可以這樣說：「沒關係，謝謝！」" } }
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 藥局
    // ══════════════════════════════════════════
    {
      id: "pharmacy", name: "藥局", icon: "💊", available: true,
      theme: { color: '#0891B2', bg: '#E0F2FE', accent: '#0E7490' },
      situations: [
        {
          id: "basic", name: "基本買藥", icon: "💊",
          desc: "描述症狀、詢問用法到結帳的完整買藥流程",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！請問需要什麼嗎？", task:"跟藥師打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安","午安","晚安","hi","請問","喂"], keywords_mode:'any',
              accepted_phrases:["你好！","您好！"],
              options:["你好！","謝謝再見","我要買東西","多少錢？"],
              feedback:{ perfect:"打招呼打得很有禮貌！", partial:"不錯！可以說得更完整", failed:"可以這樣說：「你好！」" } },
            { id:"describe_symptom", shopkeeper_prompt:"請問有什麼不舒服嗎？", task:"告訴藥師你頭痛",
              keywords:["頭痛","頭"], keywords_mode:'any',
              accepted_phrases:["我頭痛","我頭很痛","頭痛"],
              options:["我頭痛","我肚子痛","我發燒了","我沒有不舒服"],
              feedback:{ perfect:"說明症狀說得很清楚！", partial:"說出了症狀！試著說完整：「我頭痛」", failed:"可以這樣說：「我頭痛」" } },
            { id:"allergy", shopkeeper_prompt:"好的，請問你有沒有對哪種藥過敏？", task:"告訴藥師你沒有藥物過敏",
              keywords:["沒有","不知道","沒","無","不清楚","好像沒有"], keywords_mode:'any',
              accepted_phrases:["沒有過敏","我沒有過敏","不知道"],
              options:["沒有過敏","我不知道","有過敏","請問什麼是過敏？"],
              feedback:{ perfect:"回答得很好！", partial:"說出了重點！可以說完整：「沒有過敏」", failed:"可以這樣說：「沒有過敏」" } },
            { id:"ask_usage", shopkeeper_prompt:"好的，我幫你拿止痛藥。請問有沒有問題？", task:"詢問這個藥要怎麼吃",
              keywords:["怎麼","服用","使用","用法","吃幾次","如何"], keywords_mode:'any',
              accepted_phrases:["請問這個藥怎麼吃？","一天要吃幾次？","怎麼使用？"],
              options:["請問這個藥怎麼吃？","好的謝謝","我不要了","請問多少錢？"],
              feedback:{ perfect:"問得很好！詢問用法很重要！", partial:"說出了部分！完整說：「請問這個藥怎麼吃？」", failed:"可以這樣說：「請問這個藥怎麼吃？」" } },
            { id:"checkout", shopkeeper_prompt:"飯後一天吃三次，一次一顆。這盒止痛藥 80 元，請問怎麼付款？",
              task:"告訴藥師付款方式",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金","我要刷卡","現金","用悠遊卡"],
              options:["我付現金","我要刷卡","用悠遊卡","請問廁所在哪裡？"],
              feedback:{ perfect:"說得很清楚！", partial:"聽到了！說清楚付款方式會更好", failed:"可以說：「我付現金」或「我要刷卡」" } },
            { id:"goodbye", shopkeeper_prompt:"好的，找您 20 元，記得飯後吃喔！請多休息！", task:"向藥師道謝說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝您！再見！","謝謝，再見！","謝謝！"],
              options:["謝謝您！再見！","你好","我要再買一盒","請問還有什麼藥？"],
              feedback:{ perfect:"道謝道得很有禮貌！保重喔！", partial:"有說謝謝！可以再加上「再見」", failed:"可以這樣說：「謝謝您！再見！」" } }
          ]
        },
        {
          id: "out_of_stock", name: "藥缺貨了", icon: "📤",
          desc: "想買的藥缺貨，詢問替代藥品的完整流程",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！請問需要什麼？", task:"跟藥師打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安","午安","晚安","hi","請問","喂"], keywords_mode:'any',
              accepted_phrases:["你好！","您好！"],
              options:["你好！","謝謝再見","我要買藥","多少錢？"],
              feedback:{ perfect:"很好！", partial:"可以說得更完整", failed:"可以這樣說：「你好！」" } },
            { id:"ask_medicine", shopkeeper_prompt:"請問需要什麼藥？", task:"詢問有沒有感冒藥",
              keywords:["感冒"], keywords_mode:'any',
              accepted_phrases:["請問有感冒藥嗎？","我要買感冒藥","有沒有感冒藥？"],
              options:["請問有感冒藥嗎？","我要買止痛藥","謝謝再見","我要買維他命"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！試著說完整：「請問有感冒藥嗎？」", failed:"可以這樣說：「請問有感冒藥嗎？」" } },
            { id:"out_of_stock_response", shopkeeper_prompt:"不好意思，感冒藥今天賣完了！但我們有喉糖和維他命 C，可以幫助舒緩喔！",
              task:"詢問那些東西要怎麼用",
              keywords:["怎麼","用","吃","效果","方法","如何","怎樣"], keywords_mode:'any',
              accepted_phrases:["請問怎麼用？","那怎麼吃？","請問有什麼效果？"],
              options:["請問怎麼用？","那我不要了","好的，謝謝","我要喉糖"],
              feedback:{ perfect:"問得很好！詢問用法很重要！", partial:"說出了重點！", failed:"可以這樣說：「請問怎麼用？」" } },
            { id:"decide", shopkeeper_prompt:"喉糖可以直接含在嘴裡，維他命 C 用水吞。你要哪一個？",
              task:"說你要買喉糖",
              keywords:["喉糖"], keywords_mode:'any',
              accepted_phrases:["我要喉糖","給我喉糖","我買喉糖"],
              options:["我要喉糖","我要維他命 C","兩個都要","謝謝再見"],
              frame_ref:"want_item",
              slots:{ item:{ answer:"喉糖", choices:[
                { text:"喉糖", emoji:"🍬" }, { text:"維他命", emoji:"💊" },
                { text:"口罩", emoji:"😷" }, { text:"OK繃", emoji:"🩹" } ] } },
              feedback:{ perfect:"很好！懂得選擇替代方案！", partial:"說出了重點！", failed:"可以這樣說：「我要喉糖」" } },
            { id:"checkout", shopkeeper_prompt:"好的！喉糖一盒 60 元，請問怎麼付款？", task:"付款並道謝",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金，謝謝！","現金，謝謝！","刷卡，謝謝"],
              options:["我付現金，謝謝！","刷卡，謝謝","謝謝再見","多少錢？"],
              feedback:{ perfect:"很棒！付款和道謝都說到了！", partial:"說出了部分！可以同時說付款方式和謝謝", failed:"可以這樣說：「我付現金，謝謝！」" } }
          ]
        },
        {
          id: "not_enough_money", name: "錢不夠", icon: "💸",
          desc: "買藥時發現錢不夠，如何向藥師說明",
          steps: [
            { id:"describe", shopkeeper_prompt:"你好！請問有什麼不舒服嗎？", task:"告訴藥師你肚子痛",
              keywords:["肚子","胃"], keywords_mode:'any',
              accepted_phrases:["我肚子痛","我肚子不舒服","肚子痛"],
              options:["我肚子痛","我頭痛","我發燒","我很不舒服"],
              feedback:{ perfect:"說明症狀說得很清楚！", partial:"說出了症狀！試著說完整：「我肚子痛」", failed:"可以這樣說：「我肚子痛」" } },
            { id:"recommend", shopkeeper_prompt:"好的！我建議你用這個腸胃藥，一盒 120 元。", task:"告訴藥師你要買",
              keywords:["要","好","給"], keywords_mode:'any',
              accepted_phrases:["好的，我要！","我要這個！","好，給我！"],
              options:["好的，我要！","請問廁所在哪裡？","現在幾點了？","謝謝再見"],
              feedback:{ perfect:"很好！", partial:"說出了重點！", failed:"可以這樣說：「好的，我要！」" } },
            { id:"not_enough", shopkeeper_prompt:"好的！120 元，請問怎麼付款？（你找錢包，只有 80 元）",
              task:"告訴藥師你的錢不夠",
              keywords:["不夠","只有","不足","不到"], keywords_mode:'any',
              accepted_phrases:["不好意思，我的錢不夠","我只有 80 元，不夠","不好意思，我錢不夠"],
              options:["不好意思，我的錢不夠","我下次再來","可以少一點嗎？","有沒有比較便宜的？"],
              feedback:{ perfect:"說得很誠實！很勇敢！", partial:"說出了重點！", failed:"可以這樣說：「不好意思，我的錢不夠」" } },
            { id:"alternative", shopkeeper_prompt:"沒關係！有一款小包裝的，4 顆裝，75 元，你要嗎？",
              task:"接受藥師的建議，道謝",
              keywords:["好","可以","我要"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","好，我要！謝謝！","可以，謝謝！"],
              options:["好的，謝謝！","好，我要！謝謝！","不用了，謝謝","那我下次再來"],
              feedback:{ perfect:"很好！懂得接受幫助！", partial:"說出了重點！", failed:"可以這樣說：「好的，謝謝！」" } }
          ]
        },
        {
          id: "ask_side_effects", name: "詢問副作用", icon: "⚠️",
          desc: "拿到藥後詢問藥師有沒有副作用，了解注意事項",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！請問需要什麼？", task:"跟藥師打招呼並說你要拿止痛藥",
              keywords:["你好","您好","哈囉","嗨","早","早安","午安","晚安","hi","請問","喂"], keywords_mode:'any',
              accepted_phrases:["你好！我要買止痛藥","您好，我要止痛藥","你好，請問有止痛藥嗎？"],
              options:["你好！我要買止痛藥","您好，我要止痛藥","謝謝再見","我要買感冒藥"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「你好！我要買止痛藥」" } },
            { id:"get_medicine", shopkeeper_prompt:"好的！這是止痛藥，一盒 80 元。", task:"詢問這個藥有沒有副作用",
              keywords:["副作用","不舒服","影響","注意","有沒有","效果","會不會"], keywords_mode:'any',
              accepted_phrases:["請問這個藥有沒有副作用？","吃了會有副作用嗎？","請問有什麼要注意的嗎？"],
              options:["請問這個藥有沒有副作用？","吃了會有副作用嗎？","請問有什麼要注意的嗎？","好的，謝謝"],
              feedback:{ perfect:"問得很棒！了解副作用很重要！", partial:"說出了重點！詢問注意事項是好習慣", failed:"可以這樣說：「請問這個藥有沒有副作用？」" } },
            { id:"staff_explains", shopkeeper_prompt:"有些人吃了可能會想睡覺，所以不能開車。另外要飯後吃，空腹吃會胃痛。",
              task:"謝謝藥師的說明，說你知道了",
              keywords:["謝謝","知道","好","了解","記住","OK","清楚"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！我知道了！","謝謝你說明！","了解，謝謝！"],
              options:["好的，謝謝！我知道了！","謝謝你說明！","了解，謝謝！","謝謝，我記住了！"],
              feedback:{ perfect:"很好！記住這些注意事項很重要！", partial:"有說謝謝！", failed:"可以這樣說：「好的，謝謝！我知道了！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！80 元，請問怎麼付款？", task:"付款並道謝",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金，謝謝！","現金，謝謝！","刷卡，謝謝"],
              options:["我付現金，謝謝！","刷卡，謝謝","謝謝再見","多少錢？"],
              feedback:{ perfect:"很棒！", partial:"有說謝謝！", failed:"可以這樣說：「我付現金，謝謝！」" } }
          ]
        },
        {
          id: "need_receipt", name: "需要收據", icon: "🧾",
          desc: "結帳後請藥師開收據，以便日後保險申請",
          steps: [
            { id:"checkout_done", shopkeeper_prompt:"好的！腸胃藥 120 元，找您 80 元，謝謝！",
              task:"請藥師給你收據",
              keywords:["收據","發票","單","要收據"], keywords_mode:'any',
              accepted_phrases:["請問可以給我收據嗎？","不好意思，我需要收據","可以給我一張收據嗎？"],
              options:["請問可以給我收據嗎？","不用了，謝謝","謝謝再見","可以給我發票嗎？"],
              feedback:{ perfect:"很好！記得拿收據很重要！", partial:"說出了重點！", failed:"可以這樣說：「請問可以給我收據嗎？」" } },
            { id:"get_receipt", shopkeeper_prompt:"當然可以！這是你的收據，請收好！",
              task:"謝謝藥師",
              keywords:["謝謝","好","收到","感謝","OK","拿到"], keywords_mode:'any',
              accepted_phrases:["謝謝！","謝謝你！","好的，謝謝！"],
              options:["謝謝！","謝謝你！","好的，謝謝！","謝謝，再見！"],
              feedback:{ perfect:"很有禮貌！記得保存收據喔！", partial:"有說謝謝！", failed:"可以這樣說：「謝謝！」" } },
            { id:"goodbye", shopkeeper_prompt:"不客氣！請多休息，早日康復！",
              task:"向藥師道謝說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝你！再見！","謝謝，再見！"],
              options:["謝謝！再見！","謝謝你！再見！","謝謝，再見！","謝謝您！"],
              feedback:{ perfect:"說得很有禮貌！保重喔！", partial:"有說謝謝！再加上「再見」", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 服飾店
    // ══════════════════════════════════════════
    {
      id: "clothing_store", name: "服飾店", icon: "👗", available: true,
      theme: { color: '#DB2777', bg: '#FCE7F3', accent: '#BE185D' },
      situations: [
        {
          id: "basic", name: "基本試穿", icon: "👗",
          desc: "詢問外套、試穿、換尺寸到結帳的完整購衣流程",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！歡迎！請問在找什麼呢？", task:"打招呼並說你想找外套",
              keywords:["外套"], keywords_mode:'any',
              accepted_phrases:["你好！我想找外套","您好，我要找外套","我想看外套"],
              options:["你好！我想找外套","謝謝再見","多少錢？","有沒有褲子？"],
              frame_ref:"find_item",
              slots:{ item:{ answer:"外套", choices:[
                { text:"外套", emoji:"🧥" }, { text:"褲子", emoji:"👖" },
                { text:"裙子", emoji:"👗" }, { text:"帽子", emoji:"🧢" } ] } },
              feedback:{ perfect:"說得很好！既打招呼又說明了需求！", partial:"說出了部分！可以說：「你好！我想找外套」", failed:"可以這樣說：「你好！我想找外套」" } },
            { id:"ask_size", shopkeeper_prompt:"好的！我們這邊有很多款外套，請問你平常穿幾號？",
              task:"告訴店員你穿 M 號",
              keywords:["M","中號"], keywords_mode:'any',
              accepted_phrases:["我穿 M 號","M 號","中號"],
              options:["我穿 M 號","我穿 S 號","我穿 L 號","我不知道"],
              frame_ref:"wear_size",
              slots:{ size:{ answer:"M", choices:[
                { text:"M", emoji:"📏" }, { text:"S", emoji:"📏" },
                { text:"L", emoji:"📏" }, { text:"XL", emoji:"📏" } ] } },
              feedback:{ perfect:"說得很清楚！", partial:"有說出尺寸！可以說完整：「我穿 M 號」", failed:"可以這樣說：「我穿 M 號」" } },
            { id:"ask_tryon", shopkeeper_prompt:"好的，這件外套很多人喜歡，你覺得怎麼樣？", task:"詢問能不能試穿",
              keywords:["試穿","穿","試","穿看看","試試","可以試嗎","穿一下"], keywords_mode:'any',
              accepted_phrases:["請問可以試穿嗎？","我可以試穿嗎？","可以穿看看嗎？"],
              options:["請問可以試穿嗎？","你好！","請問廁所在哪裡？","謝謝再見"],
              feedback:{ perfect:"問得很好！禮貌詢問試穿！", partial:"說出了重點！完整說：「請問可以試穿嗎？」", failed:"可以這樣說：「請問可以試穿嗎？」" } },
            { id:"express_fit", shopkeeper_prompt:"當然可以！試衣間在那邊。（試穿後）請問這件合不合身？",
              task:"告訴店員這件衣服太大了",
              keywords:["大","不太合"], keywords_mode:'any',
              accepted_phrases:["這件太大了","有點大，不太合","不太合"],
              options:["這件太大了","很合身，我要買！","顏色不好看","謝謝，不用了"],
              feedback:{ perfect:"表達得很清楚！", partial:"說出了問題！可以說完整：「這件太大了」", failed:"可以這樣說：「這件太大了」" } },
            { id:"exchange", shopkeeper_prompt:"那我幫你換小一號，S 號可以嗎？", task:"同意換 S 號",
              keywords:["好","可以","S"], keywords_mode:'any',
              accepted_phrases:["好的，可以！","S 號好了，謝謝","可以，謝謝"],
              options:["好的，可以！","不要，再小一號","算了，不買了","還有其他顏色嗎？"],
              feedback:{ perfect:"回答得很好！", partial:"有回應！可以說完整：「好的，可以！」", failed:"可以這樣說：「好的，可以！」" } },
            { id:"checkout", shopkeeper_prompt:"S 號很合身！這件外套 850 元，請問怎麼付款？",
              task:"告訴店員要購買並付款方式",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我要買！我付現金","好的，我要買，刷卡","我要買，現金"],
              options:["我要買！我付現金","我要買，刷卡","太貴了，不買了","可以再便宜嗎？"],
              feedback:{ perfect:"太棒了！說得很清楚！", partial:"說出了部分！可以同時說要買和付款方式", failed:"可以這樣說：「我要買！我付現金」" } }
          ]
        },
        {
          id: "no_right_size", name: "沒有合適尺寸", icon: "📏",
          desc: "想要的外套沒有合適尺寸，如何與店員溝通並作決定",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！歡迎光臨！", task:"打招呼說你想找褲子",
              keywords:["褲子"], keywords_mode:'any',
              accepted_phrases:["你好！我想找褲子","你好，我要找褲子","我想看褲子"],
              options:["你好！我想找褲子","謝謝再見","多少錢？","有沒有外套？"],
              frame_ref:"find_item",
              slots:{ item:{ answer:"褲子", choices:[
                { text:"褲子", emoji:"👖" }, { text:"外套", emoji:"🧥" },
                { text:"裙子", emoji:"👗" }, { text:"鞋子", emoji:"👟" } ] } },
              feedback:{ perfect:"很好！說得很清楚！", partial:"說出了部分！", failed:"可以這樣說：「你好！我想找褲子」" } },
            { id:"ask_size", shopkeeper_prompt:"好的！請問你穿幾號？", task:"告訴店員你穿 L 號",
              keywords:["穿L","要L","大號"], keywords_mode:'any',
              accepted_phrases:["我穿 L 號","穿 L 號","我要 L 號","大號"],
              options:["我穿 L 號","我穿 M 號","我穿 XL 號","我不知道"],
              frame_ref:"wear_size",
              slots:{ size:{ answer:"L", choices:[
                { text:"L", emoji:"📏" }, { text:"M", emoji:"📏" },
                { text:"XL", emoji:"📏" }, { text:"S", emoji:"📏" } ] } },
              feedback:{ perfect:"說得很清楚！", partial:"說出了尺寸！", failed:"可以這樣說：「我穿 L 號」" } },
            { id:"no_size", shopkeeper_prompt:"不好意思，這款褲子的 L 號已經賣完了，只剩 M 號和 XL 號。",
              task:"問有沒有其他款式的 L 號",
              keywords:["其他","款","有沒有","別款","其他款","別的","換","不同款"], keywords_mode:'any',
              accepted_phrases:["有沒有其他款式的 L 號？","有別的款式嗎？","還有其他 L 號的嗎？"],
              options:["有沒有其他款式的 L 號？","那我要 XL 號好了","謝謝再見","這樣我不買了"],
              feedback:{ perfect:"很好！懂得詢問其他選項！", partial:"說出了重點！", failed:"可以這樣說：「有沒有其他款式的 L 號？」" } },
            { id:"alternative", shopkeeper_prompt:"有喔！這款也不錯，而且正在特價，你要試穿嗎？",
              task:"說你要試穿看看",
              keywords:["試穿","穿看看","試試","好謝謝"], keywords_mode:'any',
              accepted_phrases:["好的，我來試穿看看！","可以，我穿看看！","好，謝謝！"],
              options:["好的，我來試穿看看！","謝謝，不用了","這個多少錢？","有沒有更好看的？"],
              feedback:{ perfect:"很好！願意嘗試！", partial:"說出了重點！", failed:"可以這樣說：「好的，我來試穿看看！」" } },
            { id:"decision", shopkeeper_prompt:"（試穿後）這款 L 號合不合身？",
              task:"說很合身，你要買",
              keywords:["合身","要買","好穿","舒服"], keywords_mode:'any',
              accepted_phrases:["很合身！我要買！","合身，我要！","我要買這件！"],
              options:["很合身！我要買！","有點緊，不買了","顏色不喜歡","我再考慮一下"],
              feedback:{ perfect:"太棒了！果斷決定！", partial:"說出了重點！", failed:"可以這樣說：「很合身！我要買！」" } }
          ]
        },
        {
          id: "return_exchange", name: "想退換貨", icon: "🔄",
          desc: "買完衣服回家發現問題，回店裡請求換貨",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！歡迎光臨，請問有什麼需要幫忙的嗎？",
              task:"打招呼說你想換貨",
              keywords:["換"], keywords_mode:'any',
              accepted_phrases:["你好！我想換貨","您好，我要換一件衣服","不好意思，我要換貨"],
              options:["你好！我想換貨","謝謝再見","我要買東西","多少錢？"],
              feedback:{ perfect:"說得很清楚！直接說明來意很好！", partial:"說出了重點！", failed:"可以這樣說：「你好！我想換貨」" } },
            { id:"explain", shopkeeper_prompt:"好的，請問是什麼問題呢？", task:"說明衣服有線頭，品質有問題",
              keywords:["線頭","問題","壞","破","品質","有線","瑕疵","不對"],keywords_mode:'any',
              accepted_phrases:["這件衣服有線頭","這件衣服有問題，有線頭","品質有問題，有線頭"],
              options:["這件衣服有線頭","我買錯了","我不喜歡這個顏色","我想換大一點的"],
              feedback:{ perfect:"說明問題說得很清楚！", partial:"說出了重點！告訴店員問題在哪裡！", failed:"可以這樣說：「這件衣服有線頭」" } },
            { id:"check_receipt", shopkeeper_prompt:"可以讓我看一下收據嗎？", task:"說你有帶收據",
              keywords:["有帶","收據","我有"], keywords_mode:'any',
              accepted_phrases:["有！這是收據","我有帶，在這裡","有，我有收據"],
              options:["有！這是收據","我有帶，在這裡","我忘記帶了","可以查我的電話嗎？"],
              feedback:{ perfect:"很好！記得帶收據很重要！", partial:"說出了重點！", failed:"可以這樣說：「有！這是收據」" } },
            { id:"choose_solution", shopkeeper_prompt:"好的！你可以選擇換一件新的，或是退款，你要哪一個？",
              task:"說你要換一件新的",
              keywords:["換"], keywords_mode:'any',
              accepted_phrases:["我要換一件新的","換一件新的","換新的"],
              options:["我要換一件新的","我要退款","你好！","請問廁所在哪裡？"],
              feedback:{ perfect:"很好！清楚說明你的選擇！", partial:"說出了重點！", failed:"可以這樣說：「我要換一件新的」" } },
            { id:"goodbye", shopkeeper_prompt:"好的！這是新的一件，同款同色，請確認看看！",
              task:"確認沒問題，道謝",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","沒問題，謝謝！","很好，謝謝！"],
              options:["好的，謝謝！","沒問題，謝謝！","很好，謝謝！","謝謝，再見！"],
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！", failed:"可以這樣說：「好的，謝謝！」" } }
          ]
        },
        {
          id: "ask_discount", name: "詢問折扣", icon: "🏷️",
          desc: "在服飾店詢問有沒有打折或優惠活動",
          steps: [
            { id:"greet_ask", shopkeeper_prompt:"你好！歡迎光臨！", task:"打招呼並詢問有沒有折扣",
              keywords:["你好","您好","哈囉","嗨","早","打折","折扣","特價","優惠","推薦","好吃","不知道"], keywords_mode:'any',
              accepted_phrases:["你好！請問有沒有打折？","你好，有沒有特價商品？","請問現在有優惠嗎？"],
              options:["你好！請問有沒有打折？","你好，有沒有特價商品？","請問現在有優惠嗎？","謝謝再見"],
              feedback:{ perfect:"問得很好！懂得找優惠！", partial:"說出了重點！", failed:"可以這樣說：「你好！請問有沒有打折？」" } },
            { id:"answer", shopkeeper_prompt:"有！現在外套類全館九折，而且買兩件再送一件！",
              task:"說你想看看外套",
              keywords:["好","看看","外套","那我","行","要","去看"], keywords_mode:'any',
              accepted_phrases:["好的，我想看外套！","那我看看外套！","好，我要看外套！"],
              options:["好的，我想看外套！","那我看看外套！","都給我！","謝謝再見"],
              feedback:{ perfect:"很好！積極去看！", partial:"說出了重點！", failed:"可以這樣說：「好的，我想看外套！」" } },
            { id:"show", shopkeeper_prompt:"好的！這邊是外套區，你覺得哪款好看？", task:"說你喜歡這件藍色的",
              keywords:["藍"], keywords_mode:'any',
              accepted_phrases:["我喜歡這件藍色的！","這件藍色的很好看！","我要試穿這件藍色的！"],
              options:["我喜歡這件藍色的！","這件藍色的很好看！","我要試穿這件藍色的！","都不喜歡"],
              frame_ref:"like_color",
              slots:{ color:{ answer:"藍色", choices:[
                { text:"藍色", emoji:"🔵" }, { text:"紅色", emoji:"🔴" },
                { text:"白色", emoji:"⚪" }, { text:"黑色", emoji:"⚫" } ] } },
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我喜歡這件藍色的！」" } },
            { id:"buy", shopkeeper_prompt:"好眼光！這件現在九折，原價 500 元，折扣後 450 元！",
              task:"告訴店員你要買這件",
              keywords:["買","要","好","給","行","就這","我要"], keywords_mode:'any',
              accepted_phrases:["好的，我要買！","那我買這件！","我要這件！"],
              options:["好的，我要買！","那我買這件！","有更便宜的嗎？","謝謝再見"],
              feedback:{ perfect:"很好！果斷決定！", partial:"說出了重點！", failed:"可以這樣說：「好的，我要買！」" } }
          ]
        },
        {
          id: "wrong_change", name: "找零錯了", icon: "💰",
          desc: "服飾店找錯零錢，如何禮貌地指出並核對",
          steps: [
            { id:"pay", shopkeeper_prompt:"外套 850 元，謝謝！（你給了 1000 元）", task:"告訴店員你給了 1000 元",
              keywords:["50","100","200","500","1000","五十","一百","兩百","五百","一千"], keywords_mode:'any',
              accepted_phrases:["我給你 1000 元","這是 1000 元","給你一千元"],
              options:["我給你 1000 元","這是 1000 元","給你","謝謝"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我給你 1000 元」" } },
            { id:"wrong_change", shopkeeper_prompt:"好的！找您 100 元！（店員找回 100 元，但正確應找 150 元）",
              task:"禮貌地告訴店員找零好像不對",
              keywords:["不對","錯","應該","少","多","找錯","好像","差"], keywords_mode:'any',
              accepted_phrases:["不好意思，找零好像不對","應該找我 150 元","不好意思，少找了 50 元"],
              options:["不好意思，找零好像不對","謝謝，沒關係","可以再算一次嗎？","我再數數看"],
              feedback:{ perfect:"很好！禮貌指出很重要！", partial:"說出了重點！", failed:"可以這樣說：「不好意思，找零好像不對」" } },
            { id:"corrected", shopkeeper_prompt:"啊！對不起！應該找 150 元，這是多的 50 元，非常抱歉！",
              task:"說沒關係，謝謝店員",
              keywords:["謝謝","沒關係","好","沒事","了解","知道","OK"], keywords_mode:'any',
              accepted_phrases:["沒關係，謝謝！","好的，謝謝！","謝謝，沒事！"],
              options:["沒關係，謝謝！","好的，謝謝！","謝謝，沒事！","謝謝再見！"],
              feedback:{ perfect:"說得很有禮貌！大度說「沒關係」很棒！", partial:"有說謝謝！", failed:"可以這樣說：「沒關係，謝謝！」" } }
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 速食店
    // ══════════════════════════════════════════
    {
      id: "fast_food", name: "速食店", icon: "🍔", available: true,
      theme: { color: '#EA580C', bg: '#FFF7ED', accent: '#C2410C' },
      situations: [
        {
          id: "basic", name: "基本點餐", icon: "🍔",
          desc: "點漢堡套餐到取餐的完整速食點餐流程",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！歡迎光臨，可以點餐了！", task:"打招呼並說你要點餐",
              keywords:["點餐","點東西","你好","您好"], keywords_mode:'any',
              accepted_phrases:["你好！我要點餐","你好，我要點東西","我要點餐"],
              options:["你好！我要點餐","謝謝再見","請問廁所在哪裡？","多少錢？"],
              feedback:{ perfect:"說得很好！既打招呼又說要點餐！", partial:"說出了部分！可以說：「你好！我要點餐」", failed:"可以這樣說：「你好！我要點餐」" } },
            { id:"order_meal", shopkeeper_prompt:"請說，你要點什麼？", task:"點一個漢堡套餐",
              keywords:["漢堡"], keywords_mode:'any',
              accepted_phrases:["我要一個漢堡套餐","給我漢堡套餐","一個漢堡套餐"],
              options:["我要一個漢堡套餐","我要薯條","我要炸雞","我要飲料"],
              frame_ref:"want_item",
              slots:{ item:{ answer:"漢堡套餐", choices:[
                { text:"漢堡套餐", emoji:"🍔" }, { text:"薯條", emoji:"🍟" },
                { text:"雞塊", emoji:"🍗" }, { text:"冰淇淋", emoji:"🍦" } ] } },
              feedback:{ perfect:"點餐說得很清楚！", partial:"說出了重點！試著說完整：「我要一個漢堡套餐」", failed:"可以這樣說：「我要一個漢堡套餐」" } },
            { id:"customize_drink", shopkeeper_prompt:"好的！套餐的飲料要大杯還是小杯？冰的還是溫的？",
              task:"告訴店員飲料要小杯、不要冰",
              keywords:["去冰","不要冰","溫","常溫","微冰","無冰","少冰"], keywords_mode:'any',
              accepted_phrases:["小杯，不要冰","小杯，去冰","小杯溫的"],
              options:["小杯，不要冰","大杯，正常冰","小杯，多冰","我不要飲料"],
              feedback:{ perfect:"客製化說得很清楚！", partial:"說出了部分！可以同時說杯型和冰塊：「小杯，不要冰」", failed:"可以這樣說：「小杯，不要冰」" } },
            { id:"checkout", shopkeeper_prompt:"好的！漢堡套餐一共 120 元，請問怎麼付款？",
              task:"告訴店員付款方式",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金","刷卡","用信用卡","用悠遊卡"],
              options:["我付現金","刷卡","用悠遊卡","我沒帶錢"],
              feedback:{ perfect:"說得很清楚！", partial:"聽到了！說清楚付款方式會更好", failed:"可以說：「我付現金」或「刷卡」" } },
            { id:"wait_number", shopkeeper_prompt:"找您 80 元，你的號碼牌是 35 號，叫到號碼再來取餐！",
              task:"道謝並確認你的號碼牌",
              keywords:["謝謝","好","知道","了解","收到","OK","記住"], keywords_mode:'any',
              accepted_phrases:["謝謝！我知道了","好的，謝謝！","謝謝，35 號"],
              options:["謝謝！我知道了","再見","我要取消","請問幾號？"],
              feedback:{ perfect:"很好！記得注意叫號喔！", partial:"有回應！可以說：「謝謝！我知道了」", failed:"可以這樣說：「謝謝！我知道了」" } },
            { id:"pickup", shopkeeper_prompt:"35 號！漢堡套餐好了，請來這邊取餐！", task:"回應並道謝取餐",
              keywords:["謝謝","我來","來了","收到"], keywords_mode:'any',
              accepted_phrases:["謝謝！我來了","好的，謝謝！","謝謝！"],
              options:["謝謝！我來了","我還沒叫到號","請問在哪裡取？","謝謝再見"],
              feedback:{ perfect:"太棒了！享用你的餐點吧！", partial:"有回應！可以說：「謝謝！我來了」", failed:"可以這樣說：「謝謝！我來了」" } }
          ]
        },
        {
          id: "wrong_order", name: "點錯了要改", icon: "🔄",
          desc: "點完餐才發現點錯，如何禮貌地請店員更改",
          steps: [
            { id:"order", shopkeeper_prompt:"你好！歡迎光臨，請問要點什麼？", task:"打招呼並點雞塊套餐",
              keywords:["雞塊"], keywords_mode:'any',
              accepted_phrases:["你好！我要雞塊套餐","你好，給我雞塊套餐","我要雞塊套餐"],
              options:["你好！我要雞塊套餐","我要漢堡","我要薯條","謝謝再見"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「你好！我要雞塊套餐」" } },
            { id:"confirm", shopkeeper_prompt:"好的！雞塊套餐一份，飲料要什麼？", task:"說你要可樂",
              keywords:["可樂"], keywords_mode:'any',
              accepted_phrases:["我要可樂","給我可樂","可樂"],
              options:["我要可樂","我要果汁","不要飲料","我要水"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我要可樂」" } },
            { id:"change_mind", shopkeeper_prompt:"好的！（店員開始輸入）",
              task:"突然想改成漢堡套餐，禮貌地請店員更改",
              keywords:["換","改","不好意思","可以換","可以改","想改","漢堡","更換"], keywords_mode:'any',
              accepted_phrases:["不好意思，可以改成漢堡套餐嗎？","不好意思，我想換成漢堡","可以改成漢堡嗎？不好意思"],
              options:["不好意思，可以改成漢堡套餐嗎？","沒事，雞塊就好","我不要了","謝謝"],
              feedback:{ perfect:"說得很有禮貌！「不好意思」說得很好！", partial:"說出了要換的意思！記得加上「不好意思」會更禮貌", failed:"可以這樣說：「不好意思，可以改成漢堡套餐嗎？」" } },
            { id:"confirm2", shopkeeper_prompt:"可以！漢堡套餐 120 元，飲料一樣可樂嗎？", task:"確認可樂，道謝",
              keywords:["對","沒錯","好的","可以"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","可以，謝謝！","對，謝謝！"],
              options:["好的，謝謝！","可以，謝謝！","不要可樂，換成果汁","謝謝"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！加上謝謝很有禮貌", failed:"可以這樣說：「好的，謝謝！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！漢堡套餐 120 元，請問怎麼付款？", task:"付款並道謝",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金，謝謝！","現金，謝謝！","謝謝，我付現金！","刷卡，謝謝"],
              options:["我付現金，謝謝！","刷卡，謝謝","謝謝再見","多少錢？"],
              feedback:{ perfect:"很棒！", partial:"有說謝謝！", failed:"可以這樣說：「我付現金，謝謝！」" } }
          ]
        },
        {
          id: "not_enough_money", name: "錢不夠", icon: "💸",
          desc: "結帳時發現錢不夠，決定改點便宜一點的餐點",
          steps: [
            { id:"order", shopkeeper_prompt:"你好！歡迎光臨，請問要點什麼？", task:"點漢堡套餐",
              keywords:["漢堡"], keywords_mode:'any',
              accepted_phrases:["我要漢堡套餐","給我漢堡套餐","一個漢堡套餐"],
              options:["我要漢堡套餐","我要薯條","謝謝再見","什麼最好吃？"],
              frame_ref:"want_item",
              slots:{ item:{ answer:"漢堡套餐", choices:[
                { text:"漢堡套餐", emoji:"🍔" }, { text:"薯條", emoji:"🍟" },
                { text:"雞塊", emoji:"🍗" }, { text:"冰淇淋", emoji:"🍦" } ] } },
              feedback:{ perfect:"點餐說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我要漢堡套餐」" } },
            { id:"hear_price", shopkeeper_prompt:"好的！漢堡套餐 120 元，請問怎麼付款？",
              task:"告訴店員你要付現金",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金","付現金","現金"],
              options:["我付現金","刷卡","用悠遊卡","稍等一下"],
              feedback:{ perfect:"很好！", partial:"說出了重點！", failed:"可以這樣說：「我付現金」" } },
            { id:"not_enough", shopkeeper_prompt:"（你數錢，發現只有 80 元，不夠 120 元）",
              task:"告訴店員你的錢不夠",
              keywords:["不夠","只有","不足","不到"], keywords_mode:'any',
              accepted_phrases:["不好意思，我的錢不夠","我只有 80 元，不夠","不好意思，我錢不夠，不能買"],
              options:["不好意思，我的錢不夠","我下次再來","可以少一點嗎？","我刷卡"],
              feedback:{ perfect:"說得很誠實！很勇敢！", partial:"說出了重點！", failed:"可以這樣說：「不好意思，我的錢不夠」" } },
            { id:"cheaper_option", shopkeeper_prompt:"沒關係！我們的炸雞腿只要 65 元，你要嗎？",
              task:"接受建議，說你要炸雞腿",
              keywords:["炸雞","雞腿","好"], keywords_mode:'any',
              accepted_phrases:["好的，我要炸雞腿！","好，給我炸雞腿！謝謝！","好，謝謝！"],
              options:["好的，我要炸雞腿！","不用了，謝謝","那我不吃了","還有其他的嗎？"],
              feedback:{ perfect:"很好！懂得接受替代方案！", partial:"說出了重點！", failed:"可以這樣說：「好的，我要炸雞腿！」" } }
          ]
        },
        {
          id: "wait_too_long", name: "等太久了", icon: "⏰",
          desc: "速食店等餐等了很久，如何禮貌地詢問店員",
          steps: [
            { id:"order_done", shopkeeper_prompt:"（你點完餐拿到號碼牌 12 號，等了 15 分鐘還沒叫到）",
              task:"禮貌地向店員詢問你的餐點",
              keywords:["好了","餐點","號","等","還沒","好嗎","快好了","多久"], keywords_mode:'any',
              accepted_phrases:["不好意思，請問 12 號的餐點好了嗎？","不好意思，我等了很久了","請問我的餐點快好了嗎？"],
              options:["不好意思，請問 12 號的餐點好了嗎？","不好意思，我等了很久了","請問我的餐點快好了嗎？","我要取消訂單"],
              feedback:{ perfect:"問得很有禮貌！「不好意思」說得很好！", partial:"說出了重點！加上「不好意思」更有禮貌", failed:"可以這樣說：「不好意思，請問 12 號的餐點好了嗎？」" } },
            { id:"staff_check", shopkeeper_prompt:"非常抱歉！讓你久等了，我馬上去確認！",
              task:"說沒關係，請他確認",
              keywords:["謝謝","好","可以","等","行","沒問題","麻煩"], keywords_mode:'any',
              accepted_phrases:["沒關係，謝謝！","好的，謝謝！","麻煩你了，謝謝！"],
              options:["沒關係，謝謝！","好的，謝謝！","麻煩你了，謝謝！","快一點！"],
              feedback:{ perfect:"說得很有禮貌！耐心等待很棒！", partial:"說出了重點！", failed:"可以這樣說：「沒關係，謝謝！」" } },
            { id:"receive", shopkeeper_prompt:"12 號！你的漢堡套餐來了，非常抱歉讓你久等！",
              task:"說謝謝，並說沒關係",
              keywords:["謝謝","沒關係","好","沒事","還好","OK","了解"], keywords_mode:'any',
              accepted_phrases:["謝謝！沒關係！","謝謝，沒關係！","謝謝，我等到了！"],
              options:["謝謝！沒關係！","謝謝，沒關係！","謝謝，我等到了！","謝謝！"],
              feedback:{ perfect:"說得很有禮貌！寬容的態度很棒！", partial:"有說謝謝！", failed:"可以這樣說：「謝謝！沒關係！」" } }
          ]
        },
        {
          id: "need_napkins", name: "需要餐巾紙", icon: "🧻",
          desc: "拿到餐點後發現沒有餐巾紙和吸管，如何向店員索取",
          steps: [
            { id:"pickup", shopkeeper_prompt:"35 號！漢堡套餐好了，請來取餐！",
              task:"道謝並詢問餐巾紙在哪裡",
              keywords:["餐巾紙","紙巾","衛生紙"], keywords_mode:'any',
              accepted_phrases:["謝謝！請問餐巾紙在哪裡？","謝謝，餐巾紙在哪？","請問哪裡有餐巾紙？"],
              options:["謝謝！請問餐巾紙在哪裡？","謝謝，餐巾紙在哪？","請問哪裡有餐巾紙？","謝謝再見"],
              feedback:{ perfect:"問得很好！既道謝又問了需要的東西！", partial:"說出了重點！記得先說謝謝", failed:"可以這樣說：「謝謝！請問餐巾紙在哪裡？」" } },
            { id:"location", shopkeeper_prompt:"餐巾紙和吸管都在右邊的自取區！",
              task:"謝謝店員",
              keywords:["謝謝","好","知道","了解","OK","找到了"], keywords_mode:'any',
              accepted_phrases:["謝謝！","好的，謝謝！","謝謝你！"],
              options:["謝謝！","好的，謝謝！","謝謝你！","謝謝，再見！"],
              feedback:{ perfect:"說得很有禮貌！", partial:"有說謝謝！", failed:"可以這樣說：「謝謝！」" } }
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 文具店
    // ══════════════════════════════════════════
    {
      id: "stationery_store", name: "文具店", icon: "✏️", available: true,
      theme: { color: '#4F46E5', bg: '#EEF2FF', accent: '#4338CA' },
      situations: [
        {
          id: "basic", name: "基本購買", icon: "✏️",
          desc: "詢問鉛筆位置、規格到結帳的完整文具購買流程",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！請問在找什麼嗎？", task:"跟店員打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安","午安","晚安","hi","請問","喂"], keywords_mode:'any',
              accepted_phrases:["你好！","您好！"],
              options:["你好！","謝謝再見","多少錢？","有沒有折扣？"],
              feedback:{ perfect:"打招呼打得很好！", partial:"不錯！可以說得更完整", failed:"可以這樣說：「你好！」" } },
            { id:"ask_location", shopkeeper_prompt:"請問需要幫忙嗎？", task:"詢問鉛筆在哪裡",
              keywords:["鉛筆"], keywords_mode:'any',
              accepted_phrases:["請問鉛筆在哪裡？","鉛筆放在哪裡？","鉛筆在哪裡？"],
              options:["請問鉛筆在哪裡？","我要結帳","謝謝再見","請問多少錢？"],
              frame_ref:"ask_location",
              slots:{ item:{ answer:"鉛筆", choices:[
                { text:"鉛筆", emoji:"✏️" }, { text:"橡皮擦", emoji:"🧽" },
                { text:"尺", emoji:"📏" }, { text:"膠水", emoji:"🧴" } ] } },
              feedback:{ perfect:"問得很清楚！", partial:"說出了重點！試試說完整：「請問鉛筆在哪裡？」", failed:"可以這樣說：「請問鉛筆在哪裡？」" } },
            { id:"ask_spec", shopkeeper_prompt:"鉛筆在第二排，請問有需要什麼規格嗎？", task:"詢問有沒有 2B 鉛筆",
              keywords:["2B","二B"], keywords_mode:'any',
              accepted_phrases:["請問有 2B 鉛筆嗎？","我要 2B 的","有 2B 嗎？"],
              options:["請問有 2B 鉛筆嗎？","我要 HB 的","給我最便宜的","我要一打鉛筆"],
              feedback:{ perfect:"詢問規格說得很好！", partial:"說出了規格！試著說完整：「請問有 2B 鉛筆嗎？」", failed:"可以這樣說：「請問有 2B 鉛筆嗎？」" } },
            { id:"ask_price", shopkeeper_prompt:"有的！2B 鉛筆在這邊，請問還需要什麼嗎？", task:"詢問這盒鉛筆多少錢",
              keywords:["多少","幾塊","幾元","幾錢","怎麼賣","多少錢","幾塊錢","價格","多少元","賣多少"], keywords_mode:'any',
              accepted_phrases:["請問這盒多少錢？","這個多少錢？","多少錢？"],
              options:["請問這盒多少錢？","好的謝謝","我要買兩盒","謝謝再見"],
              frame_ref:"ask_price",
              slots:{ item:{ answer:"鉛筆", choices:[
                { text:"鉛筆", emoji:"✏️" }, { text:"筆記本", emoji:"📓" },
                { text:"剪刀", emoji:"✂️" }, { text:"膠水", emoji:"🧴" } ] } },
              feedback:{ perfect:"問得很好！", partial:"說出了重點！可以加上「請問」更有禮貌", failed:"可以這樣說：「請問這盒多少錢？」" } },
            { id:"purchase", shopkeeper_prompt:"這盒 2B 鉛筆 12 枝裝，45 元。", task:"告訴店員你要買鉛筆",
              keywords:["我要買","要買"], keywords_mode:'any',
              accepted_phrases:["我要買鉛筆","我要買這盒","要買鉛筆","我要買"],
              options:["我要買鉛筆","你好！","請問廁所在哪裡？","謝謝再見"],
              frame_ref:"want_item",
              slots:{ item:{ answer:"鉛筆", choices:[
                { text:"鉛筆", emoji:"✏️" }, { text:"橡皮擦", emoji:"🧽" },
                { text:"尺", emoji:"📏" }, { text:"膠水", emoji:"🧴" } ] } },
              feedback:{ perfect:"很好！購買意願說得很清楚！", partial:"說出了重點！可以說完整：「我要買這盒！」", failed:"可以這樣說：「我要買這盒！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！45 元，請問怎麼付款？", task:"付款並道謝",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金，謝謝！","現金，謝謝！","刷卡，謝謝","悠遊卡，謝謝"],
              options:["我付現金，謝謝！","刷卡，謝謝","悠遊卡，謝謝","我沒帶錢"],
              feedback:{ perfect:"太棒了！付款和道謝都說到了！", partial:"說出了部分！可以同時說付款方式和謝謝", failed:"可以這樣說：「我付現金，謝謝！」" } }
          ]
        },
        {
          id: "cant_find_item", name: "找不到商品", icon: "🔍",
          desc: "找不到想買的橡皮擦，向店員求助並接受建議",
          steps: [
            { id:"greeting", shopkeeper_prompt:"你好！請問在找什麼嗎？", task:"跟店員打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安","午安","晚安","hi","請問","喂"], keywords_mode:'any',
              accepted_phrases:["你好！","您好！"],
              options:["你好！","謝謝再見","多少錢？","有沒有折扣？"],
              feedback:{ perfect:"很好！", partial:"可以說得更完整", failed:"可以這樣說：「你好！」" } },
            { id:"ask_eraser", shopkeeper_prompt:"請問需要幫忙嗎？", task:"詢問有沒有大塊的橡皮擦",
              keywords:["橡皮擦","橡皮","大塊"], keywords_mode:'any',
              accepted_phrases:["請問有沒有大塊的橡皮擦？","我在找大橡皮擦","有大塊橡皮擦嗎？"],
              options:["請問有沒有大塊的橡皮擦？","我要鉛筆","謝謝再見","我要尺"],
              feedback:{ perfect:"問得很清楚！", partial:"說出了重點！試著說完整：「請問有沒有大塊的橡皮擦？」", failed:"可以這樣說：「請問有沒有大塊的橡皮擦？」" } },
            { id:"no_big", shopkeeper_prompt:"不好意思，大塊的橡皮擦賣完了！但我們有普通大小的，一個 15 元。",
              task:"問說普通大小的夠不夠用",
              keywords:["夠","可以","好","普通","行"], keywords_mode:'any',
              accepted_phrases:["普通大小可以嗎？","普通的夠用嗎？","好，普通的可以"],
              options:["普通大小可以嗎？","那我不買了","好，普通的可以","謝謝再見"],
              feedback:{ perfect:"很好！懂得確認替代品是否合用！", partial:"說出了重點！", failed:"可以這樣說：「普通大小可以嗎？」" } },
            { id:"decide", shopkeeper_prompt:"普通的很好用喔！很多同學都在買！", task:"說你要買兩個",
              keywords:["兩個","兩"], keywords_mode:'any',
              accepted_phrases:["好的，我要兩個！","那我買兩個！","我要兩個，謝謝！"],
              options:["好的，我要兩個！","那我買兩個！","那我只買一個","謝謝再見"],
              feedback:{ perfect:"很好！清楚說明要買幾個！", partial:"說出了重點！", failed:"可以這樣說：「好的，我要兩個！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！兩個橡皮擦共 30 元，謝謝！", task:"付款並道謝說再見",
              keywords:["謝謝"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝，再見！","好的，謝謝！"],
              options:["謝謝！再見！","謝謝，再見！","好的，謝謝！","掰掰！謝謝！"],
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！再加上「再見」更完整", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        },
        {
          id: "not_enough_money", name: "錢不夠", icon: "💸",
          desc: "買文具時錢不夠，選擇只買需要的商品",
          steps: [
            { id:"select_items", shopkeeper_prompt:"你好！請問找到你要的東西了嗎？", task:"告訴店員你要買鉛筆和尺",
              keywords:["鉛筆","尺"], keywords_mode:'any',
              accepted_phrases:["我要買鉛筆和尺","給我鉛筆和尺","我要這個鉛筆和這把尺"],
              options:["我要買鉛筆和尺","我要買橡皮擦","謝謝再見","我再找找"],
              frame_ref:"want_two",
              slots:{
                item:{ answer:"鉛筆", choices:[ { text:"鉛筆", emoji:"✏️" }, { text:"橡皮擦", emoji:"🧽" }, { text:"膠水", emoji:"🧴" } ] },
                item2:{ answer:"尺", choices:[ { text:"尺", emoji:"📏" }, { text:"剪刀", emoji:"✂️" }, { text:"筆記本", emoji:"📓" } ] } },
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我要買鉛筆和尺」" } },
            { id:"hear_total", shopkeeper_prompt:"好的！鉛筆 45 元、尺 35 元，共 80 元。",
              task:"告訴店員你要付現金",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金","付現金","現金"],
              options:["我付現金","刷卡","用悠遊卡","稍等一下"],
              feedback:{ perfect:"很好！", partial:"說出了重點！", failed:"可以這樣說：「我付現金」" } },
            { id:"not_enough", shopkeeper_prompt:"（你數錢，發現只有 50 元，不夠 80 元）",
              task:"告訴店員你的錢不夠",
              keywords:["不夠","只有","沒有","錢不夠","不到","不足","差","少","帶"], keywords_mode:'any',
              accepted_phrases:["不好意思，我的錢不夠","我只有 50 元，不夠","不好意思，我錢不夠"],
              options:["不好意思，我的錢不夠","我下次再來","可以先欠著嗎？","那我只買鉛筆好了"],
              feedback:{ perfect:"說得很誠實！很勇敢！", partial:"說出了重點！", failed:"可以這樣說：「不好意思，我的錢不夠」" } },
            { id:"choose", shopkeeper_prompt:"沒關係！你要留鉛筆還是尺呢？", task:"說你只買鉛筆",
              keywords:["鉛筆"], keywords_mode:'any',
              accepted_phrases:["我只買鉛筆好了","只要鉛筆","我買鉛筆就好"],
              options:["我只買鉛筆好了","我只買尺好了","兩個都不要了","讓我想一想"],
              feedback:{ perfect:"很好！懂得做選擇！", partial:"說出了重點！", failed:"可以這樣說：「我只買鉛筆好了」" } }
          ]
        },
        {
          id: "ask_sale", name: "詢問特賣活動", icon: "🏷️",
          desc: "詢問文具店有沒有特賣或開學優惠活動",
          steps: [
            { id:"greet_ask", shopkeeper_prompt:"你好！請問在找什麼嗎？",
              task:"打招呼並詢問有沒有開學特賣",
              keywords:["你好","您好","哈囉","嗨","早","打折","折扣","特價","優惠","推薦","好吃","不知道"], keywords_mode:'any',
              accepted_phrases:["你好！請問有沒有開學特賣？","你好，有沒有特價商品？","請問有優惠活動嗎？"],
              options:["你好！請問有沒有開學特賣？","你好，有沒有特價商品？","請問有優惠活動嗎？","謝謝再見"],
              feedback:{ perfect:"問得很好！懂得找優惠！", partial:"說出了重點！", failed:"可以這樣說：「你好！請問有沒有開學特賣？」" } },
            { id:"answer", shopkeeper_prompt:"有！本週筆記本買三本打八折，鉛筆也有第二件半價喔！",
              task:"說你要買三本筆記本",
              keywords:["筆記本","三本"], keywords_mode:'any',
              accepted_phrases:["好的，我要三本筆記本！","那我買三本筆記本！","我要三本！"],
              options:["好的，我要三本筆記本！","那我買三本筆記本！","我也要鉛筆！","謝謝再見"],
              feedback:{ perfect:"很好！懂得利用優惠！", partial:"說出了重點！", failed:"可以這樣說：「好的，我要三本筆記本！」" } },
            { id:"choose", shopkeeper_prompt:"好的！請問要哪種顏色的封面？有紅、藍、黃可以選！", task:"說你要藍色的",
              keywords:["藍"], keywords_mode:'any',
              accepted_phrases:["我要藍色的！","給我藍色！","藍色！"],
              options:["我要藍色的！","我要紅色的！","我要黃色的！","三種各一本！"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我要藍色的！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！三本筆記本，打八折共 120 元，謝謝！", task:"付款並道謝",
              keywords:["謝謝","現金"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","謝謝，我付現金！","謝謝！"],
              options:["好的，謝謝！","謝謝，我付現金！","謝謝！","掰掰！"],
              feedback:{ perfect:"很棒！有利用到優惠！", partial:"有說謝謝！", failed:"可以這樣說：「好的，謝謝！」" } }
          ]
        },
        {
          id: "wrong_change", name: "找零錯了", icon: "💰",
          desc: "文具店找錯零錢，如何禮貌地指出並核對",
          steps: [
            { id:"pay", shopkeeper_prompt:"鉛筆 45 元，謝謝！（你給了 100 元）", task:"告訴店員你給了 100 元",
              keywords:["50","100","200","500","1000","五十","一百","兩百","五百","一千"], keywords_mode:'any',
              accepted_phrases:["我給你 100 元","這是 100 元","給你 100 元"],
              options:["我給你 100 元","這是 100 元","給你","謝謝"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我給你 100 元」" } },
            { id:"wrong_change", shopkeeper_prompt:"找你 45 元！（店員找回 45 元，但正確應找 55 元）",
              task:"禮貌地告訴店員找零好像不對",
              keywords:["不對","錯","應該","少","多","找錯","好像","差"], keywords_mode:'any',
              accepted_phrases:["不好意思，找零好像不對","應該找我 55 元","不好意思，少找了 10 元"],
              options:["不好意思，找零好像不對","謝謝，沒關係","可以再算一次嗎？","我再數數看"],
              feedback:{ perfect:"很好！禮貌指出很重要！", partial:"說出了重點！", failed:"可以這樣說：「不好意思，找零好像不對」" } },
            { id:"corrected", shopkeeper_prompt:"啊，對不起！是我算錯了，補你 10 元，找您 55 元！",
              task:"說沒關係，謝謝店員",
              keywords:["謝謝","沒關係","好","沒事","了解","知道","OK"], keywords_mode:'any',
              accepted_phrases:["沒關係，謝謝！","好的，謝謝！","謝謝，沒事！"],
              options:["沒關係，謝謝！","好的，謝謝！","謝謝，沒事！","謝謝再見！"],
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！", failed:"可以這樣說：「沒關係，謝謝！」" } }
          ]
        }
      ]
    }


    // ══════════════════════════════════════════
    // 電話預約
    // ══════════════════════════════════════════
    ,{
      id: "phone_reservation", name: "電話預約", icon: "📞", available: true,
      theme: { color: '#0891B2', bg: '#E0F2FE', accent: '#0E7490' },
      situations: [
        {
          id: "clinic", name: "診所掛號", icon: "🏥", clerkImage: "images/clerk-clinic.png", clerkName: "診所人員",
          desc: "打電話給診所預約看診時間",
          steps: [
            { id:"greeting", shopkeeper_prompt:"您好，這裡是仁愛診所，請問有什麼需要幫忙的嗎？", task:"跟診所人員打招呼",
              keywords:["你好","您好","哈囉","嗨","早","早安"], keywords_mode:'any',
              accepted_phrases:["你好！","您好！","嗨！","早安！","你好，請問一下","你好，我想掛號"],
              options:["你好！","謝謝再見","請問你們在哪裡？","我要掛號"],
              feedback:{ perfect:"打招呼很有禮貌！", partial:"說出了重點！", failed:"可以這樣說：「你好！」" } },
            { id:"ask_appt", shopkeeper_prompt:"請問是要掛號嗎？", task:"說你要預約看診",
              keywords:["預約","掛號","看診","看醫生","約","掛","看"], keywords_mode:'any',
              accepted_phrases:["我想預約看診","我要掛號","我要預約看醫生","我想掛號","我要約看診","幫我掛號"],
              options:["我想預約看診","我要掛號","謝謝再見","我只是詢問"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！試著說完整：「我想預約看診」", failed:"可以這樣說：「我想預約看診」" } },
            { id:"symptom", shopkeeper_prompt:"好的，請問是哪裡不舒服？", task:"說你頭痛和發燒",
              keywords:["頭痛","發燒","頭","燒"], keywords_mode:'any',
              accepted_phrases:["我頭痛和發燒","我發燒了，頭也在痛","我頭痛、好像有點發燒","頭痛跟發燒","我不舒服，頭痛又發燒"],
              options:["我頭痛和發燒","我只是想定期檢查","我肚子痛","我不知道"],
              feedback:{ perfect:"說明症狀說得很清楚！", partial:"說出了症狀！可以說完整：「我頭痛和發燒」", failed:"可以這樣說：「我頭痛和發燒」" } },
            { id:"time", shopkeeper_prompt:"好的，請問你方便什麼時間過來？", task:"說你明天下午方便",
              keywords:["明天"], keywords_mode:'any',
              accepted_phrases:["明天下午可以","明天下午方便","明天午後好","我明天下午都可以","明天下午三點可以嗎"],
              options:["明天下午可以","今天下午可以嗎？","我這週都可以","謝謝再見"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！可以說：「明天下午可以」", failed:"可以這樣說：「明天下午可以」" } },
            { id:"confirm", shopkeeper_prompt:"好的，明天下午三點，請問貴姓大名？", task:"告訴診所你的名字",
              keywords:["我叫","我是","名字","姓","小明"], keywords_mode:'any',
              accepted_phrases:["我叫小明","我的名字是小明","我姓王，叫小明","小明","我是小明"],
              options:["我叫小明","好的，謝謝","我不方便告訴你","我叫小美"],
              feedback:{ perfect:"說得很好！", partial:"說出了重點！", failed:"可以說出你的名字喔" } },
            { id:"goodbye", shopkeeper_prompt:"好的，明天下午三點，小明，請記得帶健保卡！", task:"謝謝診所人員，說再見",
              keywords:["謝謝","再見","掰","知道","好","了解","謝","收到"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","好的，謝謝！","知道了！謝謝再見！","感謝！再見！","好，謝謝你！","謝謝，掰掰！"],
              options:["謝謝！再見！","好的，謝謝！","知道了！謝謝再見！","謝謝，掰掰！"],
              feedback:{ perfect:"道謝道得很有禮貌！太棒了！", partial:"有說謝謝！再加上「再見」", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        },
        {
          id: "haircut", name: "預約剪髮", icon: "✂️", clerkImage: "images/clerk-salon.png", clerkName: "髮廊人員",
          desc: "打電話給髮廊預約剪髮時間",
          steps: [
            { id:"greeting", shopkeeper_prompt:"喂，你好，這裡是美美髮廊！", task:"打招呼說你想預約",
              keywords:["你好","您好","嗨","哈囉","預約","預訂","約"], keywords_mode:'any',
              accepted_phrases:["你好！我想預約","嗨！我要預約","您好，請問可以預約嗎？","你好，我要約剪髮","我想預約剪髮"],
              options:["你好！我想預約","謝謝再見","我只是問問","你們在哪裡？"],
              feedback:{ perfect:"說得很清楚！既打招呼又說明來意！", partial:"說出了部分！可以說：「你好！我想預約」", failed:"可以這樣說：「你好！我想預約」" } },
            { id:"service", shopkeeper_prompt:"好的，請問要預約什麼服務？", task:"說你要剪髮",
              keywords:["剪","修"], keywords_mode:'any',
              accepted_phrases:["我要剪髮","剪頭髮","我想剪一下頭髮","我要修一下","剪短一點","幫我剪髮"],
              options:["我要剪髮","我要染髮","我要燙髮","謝謝再見"],
              frame_ref:"want_item",
              slots:{ item:{ answer:"剪髮", choices:[
                { text:"剪髮", emoji:"✂️" }, { text:"染髮", emoji:"🎨" },
                { text:"燙髮", emoji:"💈" }, { text:"洗髮", emoji:"🧴" } ] } },
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我要剪髮」" } },
            { id:"time", shopkeeper_prompt:"好的，請問您想預約什麼時候？", task:"說你想預約後天上午",
              keywords:["後天","上午","明天","這週","方便","約"], keywords_mode:'any',
              accepted_phrases:["後天上午可以嗎？","我想約後天上午","後天早上方便嗎？","後天上午好了","後天上午有空嗎"],
              options:["後天上午可以嗎？","今天下午可以嗎？","週末可以嗎？","謝謝再見"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「後天上午可以嗎？」" } },
            { id:"confirm", shopkeeper_prompt:"後天上午十點有空，可以嗎？", task:"確認時間，道謝",
              keywords:["好的","謝謝","沒問題","OK"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","可以，謝謝！","沒問題，謝謝！","好！謝謝！","OK，謝謝！","行！謝謝！"],
              options:["好的，謝謝！","不行，可以換個時間嗎？","可以，謝謝！","謝謝再見"],
              feedback:{ perfect:"確認時間說得很好！", partial:"有確認！加上謝謝更有禮貌", failed:"可以這樣說：「好的，謝謝！」" } },
            { id:"goodbye", shopkeeper_prompt:"好的，後天上午十點，請準時喔！", task:"道謝說再見",
              keywords:["謝謝","再見","掰","好","知道","收到","了解"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","好的，謝謝！再見！","收到！謝謝！","知道了！謝謝再見！","謝謝，掰掰！","感謝！再見！"],
              options:["謝謝！再見！","好的，謝謝！再見！","收到！謝謝！","謝謝，掰掰！"],
              feedback:{ perfect:"道謝道得很有禮貌！太棒了！", partial:"有說謝謝！再加上「再見」", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        },
        {
          id: "restaurant", name: "餐廳訂位", icon: "🍽️", clerkImage: "images/clerk-restaurant.png", clerkName: "餐廳人員",
          desc: "打電話給餐廳預約用餐座位",
          steps: [
            { id:"greeting", shopkeeper_prompt:"您好，幸福餐廳，請問需要什麼服務？", task:"說你想訂位",
              keywords:["訂位","預約","位子","想訂"], keywords_mode:'any',
              accepted_phrases:["你好！我想訂位","我想預約座位","你好，我要訂位","我想訂個位子","你好，可以幫我訂位嗎？"],
              options:["你好！我想訂位","謝謝再見","你們今天有沒有位子？","你們菜單有什麼？"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「你好！我想訂位」" } },
            { id:"people", shopkeeper_prompt:"好的，請問幾位？", task:"說要訂 4 個人的位子",
              keywords:["四","4","四位","四人","四個人","四個"], keywords_mode:'any',
              accepted_phrases:["四個人","四位","我們有四個人","要四個位子","四人","4個人"],
              options:["四個人","兩個人","六個人","謝謝再見"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「四個人」" } },
            { id:"time", shopkeeper_prompt:"好的，請問什麼時候？", task:"說你要訂今晚六點",
              keywords:["今晚","六點"], keywords_mode:'all',
              accepted_phrases:["今晚六點","今晚六點鐘","我要訂今晚六點","今晚六點可以嗎"],
              options:["今晚六點","明晚六點","今晚七點","謝謝再見"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「今晚六點」" } },
            { id:"name", shopkeeper_prompt:"好的，請問訂位的名字？", task:"告訴餐廳你的名字",
              keywords:["我叫","我是","名字","姓","小明"], keywords_mode:'any',
              accepted_phrases:["我叫小明","小明","我是小明","姓王，叫小明","王小明","小明訂的"],
              options:["我叫小明","好的謝謝","我叫小美","我叫阿傑"],
              feedback:{ perfect:"說得很好！", partial:"說出了重點！", failed:"說出你的名字就可以囉！" } },
            { id:"goodbye", shopkeeper_prompt:"好的！王小明，今晚六點，四位，我們等您！", task:"謝謝餐廳人員，說再見",
              keywords:["謝謝","再見","掰","好","知道","收到","謝"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","好的，謝謝！","收到，謝謝！","謝謝，再見！","好！謝謝！","謝謝，掰掰！"],
              options:["謝謝！再見！","好的，謝謝！","收到，謝謝！","謝謝，掰掰！"],
              feedback:{ perfect:"道謝道得很有禮貌！太棒了！", partial:"有說謝謝！再加上「再見」", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        }
      ]
    }
    // ══════════════════════════════════════════
    // 問路
    // ══════════════════════════════════════════
    ,{
      id: "ask_directions", name: "問路", icon: "🗺️", available: true,
      theme: { color: '#16A34A', bg: '#DCFCE7', accent: '#15803D' },
      situations: [
        {
          id: "mrt", name: "問捷運站", icon: "🚇", clerkImage: "images/clerk-mrt.png", clerkName: "捷運站務員",
          desc: "在街上詢問路人捷運站怎麼走",
          steps: [
            { id:"greeting", shopkeeper_prompt:"（路上遇到一位路人，你想詢問捷運站方向）", task:"禮貌地叫住路人",
              keywords:["不好意思","打擾","請問","你好","您好","嗨"], keywords_mode:'any',
              accepted_phrases:["不好意思，請問一下","打擾一下，請問","不好意思，可以問你嗎？","請問一下！","不好意思！","嗨，請問一下"],
              options:["不好意思，請問一下","謝謝再見","你好","打擾一下，請問"],
              feedback:{ perfect:"「不好意思」說得很有禮貌！", partial:"說出了重點！加上「不好意思」更禮貌", failed:"可以這樣說：「不好意思，請問一下」" } },
            { id:"ask_location", shopkeeper_prompt:"請問有什麼需要幫忙的嗎？", task:"詢問台北車站捷運站怎麼走",
              keywords:["捷運","車站","台北"], keywords_mode:'any',
              accepted_phrases:["請問捷運台北車站怎麼走？","台北車站捷運站在哪裡？","請問怎麼去捷運站？","捷運站在哪？","台北車站怎麼走？","捷運怎麼去？"],
              options:["請問捷運台北車站怎麼走？","謝謝再見","我迷路了","台北車站在哪裡？"],
              frame_ref:"ask_way",
              slots:{ place:{ answer:"台北車站", choices:[
                { text:"台北車站", emoji:"🚉" }, { text:"公車站", emoji:"🚌" },
                { text:"洗手間", emoji:"🚻" }, { text:"便利商店", emoji:"🏪" } ] } },
              feedback:{ perfect:"問得很清楚！", partial:"說出了重點！試著說完整：「請問捷運台北車站怎麼走？」", failed:"可以這樣說：「請問捷運台北車站怎麼走？」" } },
            { id:"listen", shopkeeper_prompt:"往前走大概 200 公尺，看到紅綠燈左轉，再走一段就到了！", task:"謝謝路人，說你知道了",
              keywords:["謝謝","知道","了解","好","收到","OK"], keywords_mode:'any',
              accepted_phrases:["謝謝你！","謝謝你！知道了！","謝謝！知道了！","了解，謝謝！","好，謝謝！","知道了，謝謝！","謝謝，我去找找！"],
              options:["謝謝你！","謝謝！知道了！","了解，謝謝！","謝謝，我去找找！"],
              feedback:{ perfect:"謝謝說得很有禮貌！", partial:"有說謝謝！可以再加上「知道了」", failed:"可以這樣說：「謝謝你！知道了！」" } },
            { id:"confirm", shopkeeper_prompt:"好的！你知道是要左轉嗎？", task:"確認你記住方向，再次道謝",
              keywords:["知道","好","謝謝","了解","記住","對","清楚"], keywords_mode:'any',
              accepted_phrases:["知道了，謝謝！","好，我記住了！謝謝！","了解，謝謝你！","對，謝謝！","清楚了，謝謝！","記住了！謝謝你！"],
              options:["知道了，謝謝！","好，我記住了！謝謝！","了解，謝謝你！","謝謝，再見！"],
              feedback:{ perfect:"說得很有禮貌！再次道謝很棒！", partial:"有說謝謝！", failed:"可以這樣說：「知道了，謝謝！」" } }
          ]
        },
        {
          id: "bus", name: "問公車站", icon: "🚌", clerkImage: "images/clerk-bus.png", clerkName: "路人",
          desc: "詢問公車站在哪裡，以及搭哪路公車",
          steps: [
            { id:"greeting", shopkeeper_prompt:"（你想知道公車站在哪裡，旁邊有一位店員）", task:"禮貌地開口詢問",
              keywords:["不好意思","請問","打擾","你好","您好"], keywords_mode:'any',
              accepted_phrases:["不好意思，請問一下","打擾一下","請問！","不好意思，可以問你嗎？","不好意思！請問"],
              options:["不好意思，請問一下","謝謝再見","你好","打擾一下"],
              feedback:{ perfect:"「不好意思」說得很有禮貌！", partial:"說出了重點！加上「不好意思」更有禮貌", failed:"可以這樣說：「不好意思，請問一下」" } },
            { id:"ask_stop", shopkeeper_prompt:"好的，請問需要什麼幫忙？", task:"詢問最近的公車站在哪裡",
              keywords:["公車","公車站"], keywords_mode:'any',
              accepted_phrases:["請問附近有公車站嗎？","最近的公車站在哪裡？","公車站怎麼走？","公車站在哪？","請問公車站在哪裡？","附近有公車站嗎？"],
              options:["請問附近有公車站嗎？","最近的公車站在哪裡？","公車站在哪？","謝謝再見"],
              feedback:{ perfect:"問得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「請問附近有公車站嗎？」" } },
            { id:"ask_route", shopkeeper_prompt:"公車站就在前面路口右邊！請問你要去哪裡？", task:"說你要去台北101，問搭哪路公車",
              keywords:["101","哪路","搭哪","幾號","幾路","哪班","公車"], keywords_mode:'any',
              accepted_phrases:["我要去台北101，請問搭哪路公車？","去101搭幾號公車？","請問哪路公車到101？","台北101要搭什麼車？","到101要搭幾路？"],
              options:["我要去台北101，請問搭哪路公車？","去101搭幾號公車？","謝謝再見","我看看地圖"],
              feedback:{ perfect:"問得很好！一次問到地點和路線！", partial:"說出了重點！", failed:"可以這樣說：「我要去台北101，請問搭哪路公車？」" } },
            { id:"thanks", shopkeeper_prompt:"搭 33 路公車，在下一站下車就到了！", task:"感謝對方並說再見",
              keywords:["謝謝","再見","感謝","掰","知道","了解","好"], keywords_mode:'any',
              accepted_phrases:["謝謝你！再見！","感謝！再見！","謝謝，掰掰！","了解！謝謝再見！","知道了！謝謝！","好，謝謝你！再見！"],
              options:["謝謝你！再見！","感謝！再見！","謝謝，掰掰！","知道了！謝謝！"],
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！再加上「再見」更完整", failed:"可以這樣說：「謝謝你！再見！」" } }
          ]
        },
        {
          id: "lost", name: "我迷路了", icon: "😰", clerkImage: "images/clerk-lost.png", clerkName: "路人",
          desc: "在陌生地方迷路，向路人求助找到目的地",
          steps: [
            { id:"greeting", shopkeeper_prompt:"（你在陌生地方迷路了，需要向路人求助）", task:"禮貌地叫住路人說你迷路了",
              keywords:["不好意思","請問","迷路","找不到","你好","幫"], keywords_mode:'any',
              accepted_phrases:["不好意思，我迷路了！","請問一下，我找不到路！","不好意思，可以幫我嗎？我迷路了","打擾一下，我迷路了","不好意思，我找不到路"],
              options:["不好意思，我迷路了！","謝謝再見","你好","請問一下！"],
              feedback:{ perfect:"勇敢開口求助很棒！「不好意思」也說得很好！", partial:"說出了重點！加上「不好意思」更有禮貌", failed:"可以這樣說：「不好意思，我迷路了！」" } },
            { id:"ask_help", shopkeeper_prompt:"沒關係！請問你要去哪裡？", task:"說你要找全家便利商店",
              keywords:["全家","便利商店","7-11","超商"], keywords_mode:'any',
              accepted_phrases:["我在找全家便利商店","請問全家便利商店在哪裡？","全家在哪裡？","我要找便利商店","請問附近有全家嗎？","全家怎麼走？"],
              options:["我在找全家便利商店","請問全家便利商店在哪裡？","全家在哪裡？","謝謝再見"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我在找全家便利商店」" } },
            { id:"listen", shopkeeper_prompt:"全家就在這條路的末端，往右走大概 100 公尺就看到了！", task:"謝謝路人的指引",
              keywords:["謝謝","感謝","好","了解","知道","OK"], keywords_mode:'any',
              accepted_phrases:["謝謝你！","感謝你！","謝謝！知道了！","太感謝了！","謝謝你的幫助！","了解！謝謝你！"],
              options:["謝謝你！","感謝你！","謝謝！知道了！","太感謝了！"],
              feedback:{ perfect:"謝謝說得很有誠意！太棒了！", partial:"有說謝謝！很好！", failed:"可以這樣說：「謝謝你！」" } },
            { id:"confirm_dir", shopkeeper_prompt:"往右走就對了，加油！", task:"確認方向，再次道謝說再見",
              keywords:["謝謝","再見","好","知道","了解","掰","感謝"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","好，謝謝你！再見！","了解！謝謝再見！","感謝！再見！","謝謝，掰掰！","謝謝你！掰掰！"],
              options:["謝謝！再見！","好，謝謝你！再見！","了解！謝謝再見！","謝謝，掰掰！"],
              feedback:{ perfect:"說得很有禮貌！找到目的地加油！", partial:"有說謝謝！再加上「再見」更完整", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        }
      ]
    }

  ]
};
