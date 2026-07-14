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
              options:["我付現金","我不想付錢","我不買了","餅乾在哪裡？"],
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
              options:["好的，謝謝！","那我不買了","哼，不用你管！","謝謝你處理"],
              feedback:{ perfect:"很好！有耐心等待！", partial:"說出了重點！", failed:"可以這樣說：「好的，謝謝！」" } },
            { id:"thanks", shopkeeper_prompt:"這是新的！謝謝你告訴我們，這次免費送你！",
              task:"感謝店員的處理",
              keywords:["謝謝","太好了","好","感謝","很好","棒"], keywords_mode:'any',
              accepted_phrases:["謝謝！太好了！","謝謝你！","謝謝，再見！"],
              options:["謝謝！太好了！","哼，不用你管！","這樣可以嗎？謝謝！","喂，我走了！"],
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
              options:["我給你 50 元","我不想付錢","給你","謝謝"],
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
              options:["沒關係，謝謝！","哼，不用你管！","喂，我走了！","再見！"],
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
              options:["好的，可以！","不用了，謝謝","太貴了不要了","哼，不用你管！"],
              feedback:{ perfect:"很好！", partial:"說出了重點！", failed:"可以這樣說：「好的，可以！」" } },
            { id:"goodbye", shopkeeper_prompt:"好的！袋子在這裡，謝謝光臨！", task:"道謝說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝，掰掰！","好的，謝謝！"],
              options:["謝謝！再見！","哼，不用你管！","喂，我走了！","快點啦，很煩耶！"],
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
              options:["我付現金","我不想付錢","用行動支付","我沒帶錢"],
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
              options:["好的！","我不吃了","有沒有刷卡？","可以便宜嗎？"],
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
              options:["好的，謝謝！那我要豆漿！","不了，謝謝，我下次再來","哼，不用你管！","喂，我走了！"],
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
              options:["好的，謝謝！","哼，不用你管！","喂，我走了！","快點啦，很煩耶！"],
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
              options:["好的，謝謝！","哼，不用你管！","喂，我走了！","掰掰！"],
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
              options:["沒關係，我等你！","哼，不用你管！","喂，我走了！","好，謝謝！"],
              feedback:{ perfect:"很好！有耐心等待！", partial:"說出了重點！", failed:"可以這樣說：「沒關係，我等你！」" } },
            { id:"receive", shopkeeper_prompt:"好了！不好意思讓你久等了！", task:"說謝謝，沒關係",
              keywords:["謝謝","沒關係","好","沒事","還好","OK","了解"], keywords_mode:'any',
              accepted_phrases:["謝謝！沒關係！","謝謝你！","沒關係，謝謝！"],
              options:["謝謝！沒關係！","哼，不用你管！","喂，我走了！","謝謝，好香！"],
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
              options:["我付現金","我不想付錢","我不買了","我沒帶錢"],
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
              options:["好的，我要買！","我先走了","請問廁所在哪裡？","雞蛋在哪裡？"],
              feedback:{ perfect:"很好！懂得隨機應變！", partial:"說出了重點！", failed:"可以這樣說：「好的，我要買！」" } },
            { id:"goodbye", shopkeeper_prompt:"好的！請到收銀台結帳，謝謝！", task:"道謝說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝你！再見！","好的，謝謝！"],
              options:["謝謝！再見！","謝謝你！","哼，不用你管！","掰掰！"],
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
              options:["謝謝！再見！","哼，不用你管！","喂，我走了！","掰掰！"],
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
              options:["謝謝！我等你！","那我不要了","哼，不用你管！","喂，我走了！"],
              feedback:{ perfect:"很好！有耐心等待！", partial:"說出了重點！", failed:"可以這樣說：「謝謝！我等你！」" } },
            { id:"new_item", shopkeeper_prompt:"這是新的！完整沒有問題，請確認一下！",
              task:"確認沒問題，道謝",
              keywords:["好","謝謝","沒問題","可以","OK","看過了"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","沒問題，謝謝！","謝謝你！"],
              options:["好的，謝謝！","哼，不用你管！","喂，我走了！","謝謝，再見！"],
              feedback:{ perfect:"說得很有禮貌！", partial:"有說謝謝！", failed:"可以這樣說：「好的，謝謝！」" } },
            { id:"checkout", shopkeeper_prompt:"不客氣！請到收銀台結帳，謝謝！", task:"道謝說再見",
              keywords:["謝謝","再見","掰"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝你！再見！","好的，謝謝！"],
              options:["謝謝！再見！","謝謝你！","哼，不用你管！","掰掰！謝謝！"],
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
              options:["我給你 100 元","我不想付錢","給你","謝謝"],
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
              options:["沒關係，謝謝！","哼，不用你管！","喂，我走了！","謝謝再見！"],
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
              options:["請問今天有沒有特賣？","我要結帳","廁所在哪裡？","謝謝再見"],
              feedback:{ perfect:"問得很好！懂得找優惠！", partial:"說出了重點！", failed:"可以這樣說：「請問今天有沒有特賣？」" } },
            { id:"staff_answers", shopkeeper_prompt:"有！今天雞蛋和優格都有特價，買二送一喔！",
              task:"說你要去看看雞蛋",
              keywords:["看看","去看","雞蛋","謝謝"], keywords_mode:'any',
              accepted_phrases:["好的，我去看看雞蛋！","那我去看雞蛋！","好，謝謝你！"],
              options:["好的，我去看看雞蛋！","我要買玩具！","都買！","謝謝，我去看看！"],
              feedback:{ perfect:"很好！積極去看看！", partial:"說出了重點！", failed:"可以這樣說：「好的，我去看看雞蛋！」" } },
            { id:"decide", shopkeeper_prompt:"雞蛋特賣區在左手邊！需要幫忙嗎？", task:"說謝謝，你可以自己找",
              keywords:["自己","不用","謝謝"], keywords_mode:'any',
              accepted_phrases:["謝謝，我自己去找！","不用了，謝謝！","謝謝，我可以！"],
              options:["謝謝，我自己去找！","你很囉唆耶！","可以帶我去嗎？","謝謝！"],
              feedback:{ perfect:"很好！說得很有禮貌！", partial:"說出了重點！", failed:"可以這樣說：「謝謝，我自己去找！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！需要幫忙隨時說！",
              task:"謝謝店員說再見",
              keywords:["謝謝","再見","掰"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝你！","好的，謝謝！"],
              options:["謝謝！再見！","哼，不用你管！","喂，我走了！","掰掰！"],
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
              options:["好的，謝謝！","不用了，謝謝","哼，不用你管！","那我下次再來"],
              feedback:{ perfect:"很好！懂得接受別人的好意！", partial:"說出了重點！", failed:"可以這樣說：「好的，謝謝！」" } },
            { id:"goodbye", shopkeeper_prompt:"拿好！下次帶多一點錢喔！", task:"道謝說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝老闆！再見！","謝謝，掰掰！"],
              options:["謝謝！再見！","哼，不用你管！","喂，我走了！","好的，謝謝！"],
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
              options:["沒關係，謝謝！","哼，不用你管！","喂，我走了！","沒事！"],
              feedback:{ perfect:"很好！寬容地說「沒關係」很棒！", partial:"說出了重點！", failed:"可以這樣說：「沒關係，謝謝！」" } },
            { id:"checkout", shopkeeper_prompt:"這是冬瓜茶！45 元，謝謝！", task:"付錢並道謝",
              keywords:["謝謝"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","謝謝！","謝謝，再見！"],
              options:["好的，謝謝！","哼，不用你管！","喂，我走了！","掰掰，謝謝！"],
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
              options:["不好意思，請問珍珠奶茶攤在哪裡？","我要結帳","謝謝再見","我再找找"],
              feedback:{ perfect:"問得很清楚！「不好意思」說得很好！", partial:"說出了重點！加上「不好意思」更有禮貌", failed:"可以這樣說：「不好意思，請問珍珠奶茶攤在哪裡？」" } },
            { id:"directions", shopkeeper_prompt:"珍珠奶茶攤在前面第三個，往前走就看到了！",
              task:"謝謝對方，說你知道了",
              keywords:["謝謝","知道","好","了解","找到了","OK","清楚"], keywords_mode:'any',
              accepted_phrases:["謝謝！我知道了！","謝謝你！","好的，謝謝！"],
              options:["謝謝！我知道了！","哼，不用你管！","喂，我走了！","謝謝，掰掰！"],
              feedback:{ perfect:"說得很有禮貌！", partial:"有說謝謝！", failed:"可以這樣說：「謝謝！我知道了！」" } },
            { id:"arrive", shopkeeper_prompt:"（你找到了！）你好！請問要什麼？", task:"打招呼並點珍珠奶茶大杯",
              keywords:["珍珠","奶茶"], keywords_mode:'any',
              accepted_phrases:["你好！我要大杯珍珠奶茶！","你好，給我大杯珍珠奶茶！","我要珍珠奶茶，大杯！"],
              options:["你好！我要大杯珍珠奶茶！","你好！我要小杯紅茶！","我要冬瓜茶","謝謝再見"],
              feedback:{ perfect:"很好！找到攤位了，說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「你好！我要大杯珍珠奶茶！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！大杯珍珠奶茶 60 元，謝謝！", task:"付款並道謝",
              keywords:["謝謝"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","謝謝，我付現金！","謝謝！"],
              options:["好的，謝謝！","哼，不用你管！","喂，我走了！","掰掰！"],
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
              options:["我給你 100 元","我不想付錢","給你","謝謝"],
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
              options:["沒關係，謝謝！","哼，不用你管！","喂，我走了！","謝謝，再見！"],
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
              options:["我付現金","我不想付錢","我不買了","請問廁所在哪裡？"],
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
              options:["我付現金，謝謝！","哼，不用你管！","謝謝再見","多少錢？"],
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
              options:["好的，謝謝！","哼，不用你管！","不用了，謝謝","那我下次再來"],
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
              options:["你好！我要買止痛藥","我要買糖果","謝謝再見","我要買感冒藥"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「你好！我要買止痛藥」" } },
            { id:"get_medicine", shopkeeper_prompt:"好的！這是止痛藥，一盒 80 元。", task:"詢問這個藥有沒有副作用",
              keywords:["副作用","不舒服","影響","注意","有沒有","效果","會不會"], keywords_mode:'any',
              accepted_phrases:["請問這個藥有沒有副作用？","吃了會有副作用嗎？","請問有什麼要注意的嗎？"],
              options:["請問這個藥有沒有副作用？","我要結帳","廁所在哪裡？","好的，謝謝"],
              feedback:{ perfect:"問得很棒！了解副作用很重要！", partial:"說出了重點！詢問注意事項是好習慣", failed:"可以這樣說：「請問這個藥有沒有副作用？」" } },
            { id:"staff_explains", shopkeeper_prompt:"有些人吃了可能會想睡覺，所以不能開車。另外要飯後吃，空腹吃會胃痛。",
              task:"謝謝藥師的說明，說你知道了",
              keywords:["謝謝","知道","好","了解","記住","OK","清楚"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！我知道了！","謝謝你說明！","了解，謝謝！"],
              options:["好的，謝謝！我知道了！","哼，不用你管！","喂，我走了！","謝謝，我記住了！"],
              feedback:{ perfect:"很好！記住這些注意事項很重要！", partial:"有說謝謝！", failed:"可以這樣說：「好的，謝謝！我知道了！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！80 元，請問怎麼付款？", task:"付款並道謝",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金，謝謝！","現金，謝謝！","刷卡，謝謝"],
              options:["我付現金，謝謝！","哼，不用你管！","謝謝再見","多少錢？"],
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
              options:["謝謝！","哼，不用你管！","喂，我走了！","謝謝，再見！"],
              feedback:{ perfect:"很有禮貌！記得保存收據喔！", partial:"有說謝謝！", failed:"可以這樣說：「謝謝！」" } },
            { id:"goodbye", shopkeeper_prompt:"不客氣！請多休息，早日康復！",
              task:"向藥師道謝說再見",
              keywords:["謝謝","再見","掰","感謝","謝","拜拜","bye","掰掰","謝囉"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝你！再見！","謝謝，再見！"],
              options:["謝謝！再見！","哼，不用你管！","喂，我走了！","謝謝您！"],
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
              options:["有！這是收據","我把它丟掉了","我忘記帶了","可以查我的電話嗎？"],
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
              options:["好的，謝謝！","哼，不用你管！","喂，我走了！","謝謝，再見！"],
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
              options:["你好！請問有沒有打折？","我要結帳","廁所在哪裡？","謝謝再見"],
              feedback:{ perfect:"問得很好！懂得找優惠！", partial:"說出了重點！", failed:"可以這樣說：「你好！請問有沒有打折？」" } },
            { id:"answer", shopkeeper_prompt:"有！現在外套類全館九折，而且買兩件再送一件！",
              task:"說你想看看外套",
              keywords:["好","看看","外套","那我","行","要","去看"], keywords_mode:'any',
              accepted_phrases:["好的，我想看外套！","那我看看外套！","好，我要看外套！"],
              options:["好的，我想看外套！","我想買鞋子","都給我！","謝謝再見"],
              feedback:{ perfect:"很好！積極去看！", partial:"說出了重點！", failed:"可以這樣說：「好的，我想看外套！」" } },
            { id:"show", shopkeeper_prompt:"好的！這邊是外套區，你覺得哪款好看？", task:"說你喜歡這件藍色的",
              keywords:["藍"], keywords_mode:'any',
              accepted_phrases:["我喜歡這件藍色的！","這件藍色的很好看！","我要試穿這件藍色的！"],
              options:["我喜歡這件藍色的！","這件黑色的好看！","我要回家了","都不喜歡"],
              frame_ref:"like_color",
              slots:{ color:{ answer:"藍色", choices:[
                { text:"藍色", emoji:"🔵" }, { text:"紅色", emoji:"🔴" },
                { text:"白色", emoji:"⚪" }, { text:"黑色", emoji:"⚫" } ] } },
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我喜歡這件藍色的！」" } },
            { id:"buy", shopkeeper_prompt:"好眼光！這件現在九折，原價 500 元，折扣後 450 元！",
              task:"告訴店員你要買這件",
              keywords:["買","要","好","給","行","就這","我要"], keywords_mode:'any',
              accepted_phrases:["好的，我要買！","那我買這件！","我要這件！"],
              options:["好的，我要買！","太貴了，算了","有更便宜的嗎？","謝謝再見"],
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
              options:["我給你 1000 元","我不想付錢","給你","謝謝"],
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
              options:["沒關係，謝謝！","哼，不用你管！","喂，我走了！","謝謝再見！"],
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
              options:["我付現金","我不想付錢","我不買了","我沒帶錢"],
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
              options:["好的，謝謝！","哼，不用你管！","不要可樂，換成果汁","謝謝"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！加上謝謝很有禮貌", failed:"可以這樣說：「好的，謝謝！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！漢堡套餐 120 元，請問怎麼付款？", task:"付款並道謝",
              keywords:["現金","刷卡","悠遊卡","付現","信用卡"], keywords_mode:'any',
              accepted_phrases:["我付現金，謝謝！","現金，謝謝！","謝謝，我付現金！","刷卡，謝謝"],
              options:["我付現金，謝謝！","哼，不用你管！","謝謝再見","多少錢？"],
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
              options:["不好意思，請問 12 號的餐點好了嗎？","喂！怎麼那麼慢！","我要結帳","我要取消訂單"],
              feedback:{ perfect:"問得很有禮貌！「不好意思」說得很好！", partial:"說出了重點！加上「不好意思」更有禮貌", failed:"可以這樣說：「不好意思，請問 12 號的餐點好了嗎？」" } },
            { id:"staff_check", shopkeeper_prompt:"非常抱歉！讓你久等了，我馬上去確認！",
              task:"說沒關係，請他確認",
              keywords:["謝謝","好","可以","等","行","沒問題","麻煩"], keywords_mode:'any',
              accepted_phrases:["沒關係，謝謝！","好的，謝謝！","麻煩你了，謝謝！"],
              options:["沒關係，謝謝！","哼，不用你管！","喂，我走了！","快一點！"],
              feedback:{ perfect:"說得很有禮貌！耐心等待很棒！", partial:"說出了重點！", failed:"可以這樣說：「沒關係，謝謝！」" } },
            { id:"receive", shopkeeper_prompt:"12 號！你的漢堡套餐來了，非常抱歉讓你久等！",
              task:"說謝謝，並說沒關係",
              keywords:["謝謝","沒關係","好","沒事","還好","OK","了解"], keywords_mode:'any',
              accepted_phrases:["謝謝！沒關係！","謝謝，沒關係！","謝謝，我等到了！"],
              options:["謝謝！沒關係！","哼，不用你管！","喂，我走了！","謝謝！"],
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
              options:["謝謝！請問餐巾紙在哪裡？","哼，不用你管！","我要結帳","謝謝再見"],
              feedback:{ perfect:"問得很好！既道謝又問了需要的東西！", partial:"說出了重點！記得先說謝謝", failed:"可以這樣說：「謝謝！請問餐巾紙在哪裡？」" } },
            { id:"location", shopkeeper_prompt:"餐巾紙和吸管都在右邊的自取區！",
              task:"謝謝店員",
              keywords:["謝謝","好","知道","了解","OK","找到了"], keywords_mode:'any',
              accepted_phrases:["謝謝！","好的，謝謝！","謝謝你！"],
              options:["謝謝！","哼，不用你管！","喂，我走了！","謝謝，再見！"],
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
              options:["我付現金，謝謝！","哼，不用你管！","喂，我走了！","我沒帶錢"],
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
              options:["普通大小可以嗎？","那我不買了","哼，不用你管！","謝謝再見"],
              feedback:{ perfect:"很好！懂得確認替代品是否合用！", partial:"說出了重點！", failed:"可以這樣說：「普通大小可以嗎？」" } },
            { id:"decide", shopkeeper_prompt:"普通的很好用喔！很多同學都在買！", task:"說你要買兩個",
              keywords:["兩個","兩"], keywords_mode:'any',
              accepted_phrases:["好的，我要兩個！","那我買兩個！","我要兩個，謝謝！"],
              options:["好的，我要兩個！","我要買十個！","那我只買一個","謝謝再見"],
              feedback:{ perfect:"很好！清楚說明要買幾個！", partial:"說出了重點！", failed:"可以這樣說：「好的，我要兩個！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！兩個橡皮擦共 30 元，謝謝！", task:"付款並道謝說再見",
              keywords:["謝謝"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","謝謝，再見！","好的，謝謝！"],
              options:["謝謝！再見！","哼，不用你管！","喂，我走了！","掰掰！謝謝！"],
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
              options:["你好！請問有沒有開學特賣？","我要結帳","廁所在哪裡？","謝謝再見"],
              feedback:{ perfect:"問得很好！懂得找優惠！", partial:"說出了重點！", failed:"可以這樣說：「你好！請問有沒有開學特賣？」" } },
            { id:"answer", shopkeeper_prompt:"有！本週筆記本買三本打八折，鉛筆也有第二件半價喔！",
              task:"說你要買三本筆記本",
              keywords:["筆記本","三本"], keywords_mode:'any',
              accepted_phrases:["好的，我要三本筆記本！","那我買三本筆記本！","我要三本！"],
              options:["好的，我要三本筆記本！","我要五本畫畫本！","我也要鉛筆！","謝謝再見"],
              feedback:{ perfect:"很好！懂得利用優惠！", partial:"說出了重點！", failed:"可以這樣說：「好的，我要三本筆記本！」" } },
            { id:"choose", shopkeeper_prompt:"好的！請問要哪種顏色的封面？有紅、藍、黃可以選！", task:"說你要藍色的",
              keywords:["藍"], keywords_mode:'any',
              accepted_phrases:["我要藍色的！","給我藍色！","藍色！"],
              options:["我要藍色的！","我要紅色的！","我要黃色的！","三種各一本！"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我要藍色的！」" } },
            { id:"checkout", shopkeeper_prompt:"好的！三本筆記本，打八折共 120 元，謝謝！", task:"付款並道謝",
              keywords:["謝謝","現金"], keywords_mode:'any',
              accepted_phrases:["好的，謝謝！","謝謝，我付現金！","謝謝！"],
              options:["好的，謝謝！","哼，不用你管！","喂，我走了！","掰掰！"],
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
              options:["我給你 100 元","我不想付錢","給你","謝謝"],
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
              options:["沒關係，謝謝！","哼，不用你管！","喂，我走了！","謝謝再見！"],
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
              options:["我想預約看診","我要訂便當","謝謝再見","我只是詢問"],
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
              options:["謝謝！再見！","哼，不用你管！","喂，我走了！","快點啦，很煩耶！"],
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
              options:["好的，謝謝！","不行，可以換個時間嗎？","哼，不用你管！","謝謝再見"],
              feedback:{ perfect:"確認時間說得很好！", partial:"有確認！加上謝謝更有禮貌", failed:"可以這樣說：「好的，謝謝！」" } },
            { id:"goodbye", shopkeeper_prompt:"好的，後天上午十點，請準時喔！", task:"道謝說再見",
              keywords:["謝謝","再見","掰","好","知道","收到","了解"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","好的，謝謝！再見！","收到！謝謝！","知道了！謝謝再見！","謝謝，掰掰！","感謝！再見！"],
              options:["謝謝！再見！","哼，不用你管！","喂，我走了！","快點啦，很煩耶！"],
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
              options:["謝謝！再見！","哼，不用你管！","喂，我走了！","快點啦，很煩耶！"],
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
              options:["不好意思，請問一下","謝謝再見","喂！過來一下！","我要買車票"],
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
              options:["謝謝你！","哼，不用你管！","喂，我走了！","快點啦，很煩耶！"],
              feedback:{ perfect:"謝謝說得很有禮貌！", partial:"有說謝謝！可以再加上「知道了」", failed:"可以這樣說：「謝謝你！知道了！」" } },
            { id:"confirm", shopkeeper_prompt:"好的！你知道是要左轉嗎？", task:"確認你記住方向，再次道謝",
              keywords:["知道","好","謝謝","了解","記住","對","清楚"], keywords_mode:'any',
              accepted_phrases:["知道了，謝謝！","好，我記住了！謝謝！","了解，謝謝你！","對，謝謝！","清楚了，謝謝！","記住了！謝謝你！"],
              options:["知道了，謝謝！","哼，不用你管！","喂，我走了！","謝謝，再見！"],
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
              options:["不好意思，請問一下","謝謝再見","喂！公車站在哪！","我要買東西"],
              feedback:{ perfect:"「不好意思」說得很有禮貌！", partial:"說出了重點！加上「不好意思」更有禮貌", failed:"可以這樣說：「不好意思，請問一下」" } },
            { id:"ask_stop", shopkeeper_prompt:"好的，請問需要什麼幫忙？", task:"詢問最近的公車站在哪裡",
              keywords:["公車","公車站"], keywords_mode:'any',
              accepted_phrases:["請問附近有公車站嗎？","最近的公車站在哪裡？","公車站怎麼走？","公車站在哪？","請問公車站在哪裡？","附近有公車站嗎？"],
              options:["請問附近有公車站嗎？","我要結帳","廁所在哪裡？","謝謝再見"],
              feedback:{ perfect:"問得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「請問附近有公車站嗎？」" } },
            { id:"ask_route", shopkeeper_prompt:"公車站就在前面路口右邊！請問你要去哪裡？", task:"說你要去台北101，問搭哪路公車",
              keywords:["101","哪路","搭哪","幾號","幾路","哪班","公車"], keywords_mode:'any',
              accepted_phrases:["我要去台北101，請問搭哪路公車？","去101搭幾號公車？","請問哪路公車到101？","台北101要搭什麼車？","到101要搭幾路？"],
              options:["我要去台北101，請問搭哪路公車？","我要結帳","謝謝再見","我看看地圖"],
              feedback:{ perfect:"問得很好！一次問到地點和路線！", partial:"說出了重點！", failed:"可以這樣說：「我要去台北101，請問搭哪路公車？」" } },
            { id:"thanks", shopkeeper_prompt:"搭 33 路公車，在下一站下車就到了！", task:"感謝對方並說再見",
              keywords:["謝謝","再見","感謝","掰","知道","了解","好"], keywords_mode:'any',
              accepted_phrases:["謝謝你！再見！","感謝！再見！","謝謝，掰掰！","了解！謝謝再見！","知道了！謝謝！","好，謝謝你！再見！"],
              options:["謝謝你！再見！","哼，不用你管！","喂，我走了！","快點啦，很煩耶！"],
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
              options:["我在找全家便利商店","我要結帳","廁所在哪裡？","謝謝再見"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！", failed:"可以這樣說：「我在找全家便利商店」" } },
            { id:"listen", shopkeeper_prompt:"全家就在這條路的末端，往右走大概 100 公尺就看到了！", task:"謝謝路人的指引",
              keywords:["謝謝","感謝","好","了解","知道","OK"], keywords_mode:'any',
              accepted_phrases:["謝謝你！","感謝你！","謝謝！知道了！","太感謝了！","謝謝你的幫助！","了解！謝謝你！"],
              options:["謝謝你！","哼，不用你管！","喂，我走了！","快點啦，很煩耶！"],
              feedback:{ perfect:"謝謝說得很有誠意！太棒了！", partial:"有說謝謝！很好！", failed:"可以這樣說：「謝謝你！」" } },
            { id:"confirm_dir", shopkeeper_prompt:"往右走就對了，加油！", task:"確認方向，再次道謝說再見",
              keywords:["謝謝","再見","好","知道","了解","掰","感謝"], keywords_mode:'any',
              accepted_phrases:["謝謝！再見！","好，謝謝你！再見！","了解！謝謝再見！","感謝！再見！","謝謝，掰掰！","謝謝你！掰掰！"],
              options:["謝謝！再見！","哼，不用你管！","喂，我走了！","快點啦，很煩耶！"],
              feedback:{ perfect:"說得很有禮貌！找到目的地加油！", partial:"有說謝謝！再加上「再見」更完整", failed:"可以這樣說：「謝謝！再見！」" } }
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 麵包店（第一部分・基礎買賣）
    // ══════════════════════════════════════════
    {
      id: "bakery", name: "麵包店", icon: "🍞", available: true,
      theme: { color: '#A16207', bg: '#FEFCE8', accent: '#854D0E' },
      situations: [
        {
          id: "basic", name: "基本購買", icon: "🍞",
          desc: "詢問麵包口味、確認價錢到結帳的完整購買流程",
          steps: [
            mkStep({ id:"greeting", say:"你好！歡迎光臨，請問要買什麼麵包呢？", task:"跟老闆打招呼",
              options:["你好！","謝謝再見","多少錢？","有沒有奶油麵包？"], kw:"greet",
              feedback:{ perfect:"打招呼打得很好！", partial:"不錯！可以說得更完整" } }),
            mkStep({ id:"ask_location", say:"請問想找哪一種麵包呢？", task:"詢問菠蘿麵包在哪裡",
              options:["請問菠蘿麵包在哪裡？","我要結帳","謝謝再見","請問多少錢？"], kw:["菠蘿"],
              frame_ref:"ask_location", slots:{ item:{ answer:"菠蘿麵包", choices:[
                { text:"菠蘿麵包", emoji:"🍍" }, { text:"蛋糕", emoji:"🍰" },
                { text:"三明治", emoji:"🥪" }, { text:"貝果", emoji:"🥯" } ] } },
              feedback:{ perfect:"問得很清楚！", partial:"說出了重點！試試說完整：「請問菠蘿麵包在哪裡？」" } }),
            mkStep({ id:"ask_price", say:"菠蘿麵包在你左手邊那一排喔！", task:"詢問這個多少錢",
              options:["請問這個多少錢？","好的謝謝","我要買兩個","謝謝再見"], kw:"price",
              frame_ref:"ask_price", slots:{ item:{ answer:"菠蘿麵包", choices:[
                { text:"菠蘿麵包", emoji:"🍍" }, { text:"吐司", emoji:"🍞" },
                { text:"貝果", emoji:"🥯" }, { text:"蛋糕", emoji:"🍰" } ] } },
              feedback:{ perfect:"問得很好！", partial:"說出了重點！可以加上「請問」更有禮貌" } }),
            mkStep({ id:"purchase", say:"這個菠蘿麵包 25 元，請問還需要別的嗎？", task:"告訴老闆你要買這個",
              options:["我要買這個","你好！","請問廁所在哪裡？","謝謝再見"], kw:["我要買","要買"],
              frame_ref:"want_item", slots:{ item:{ answer:"菠蘿麵包", choices:[
                { text:"菠蘿麵包", emoji:"🍍" }, { text:"吐司", emoji:"🍞" },
                { text:"貝果", emoji:"🥯" }, { text:"蛋糕", emoji:"🍰" } ] } },
              feedback:{ perfect:"很好！購買意願說得很清楚！", partial:"說出了重點！可以說完整：「我要買這個！」" } }),
            mkStep({ id:"checkout", say:"好的！25 元，請問怎麼付款？", task:"付款並道謝",
              options:["我付現金，謝謝！","刷卡，謝謝","悠遊卡，謝謝","我沒帶錢"], kw:"pay",
              feedback:{ perfect:"太棒了！付款和道謝都說到了！", partial:"說出了部分！可以同時說付款方式和謝謝" } })
          ]
        },
        {
          id: "not_enough_money", name: "錢不夠", icon: "💸",
          desc: "買吐司時發現錢不夠，改買便宜的替代品",
          steps: [
            mkStep({ id:"select", say:"你好！請問想要買什麼？", task:"告訴老闆你要買一條吐司",
              options:["我要買一條吐司","我要買蛋糕","謝謝再見","我再看看"], kw:["吐司"],
              frame_ref:"want_item", slots:{ item:{ answer:"吐司", choices:[
                { text:"吐司", emoji:"🍞" }, { text:"蛋糕", emoji:"🍰" }, { text:"貝果", emoji:"🥯" } ] } },
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"hear_total", say:"好的！這條吐司 45 元。", task:"告訴老闆你要付現金",
              options:["我付現金","刷卡","用悠遊卡","稍等一下"], kw:"pay",
              feedback:{ perfect:"很好！", partial:"說出了重點！" } }),
            mkStep({ id:"not_enough", say:"（你打開錢包，發現只有 30 元，不夠 45 元）", task:"告訴老闆你的錢不夠",
              options:["不好意思，我的錢不夠","我下次再來","可以先欠著嗎？","那我不買了"],
              kw:["不夠","只有","沒有","錢不夠","不到","不足","差","少"],
              feedback:{ perfect:"說得很誠實！很勇敢！", partial:"說出了重點！" } }),
            mkStep({ id:"choose", say:"沒關係！要不要換小一點的餐包，一個只要 15 元？", task:"說你要改買餐包",
              options:["好，我要餐包","我還是要吐司","兩個都不要了","讓我想一想"], kw:["餐包","改"],
              feedback:{ perfect:"很好！懂得因應調整！", partial:"說出了重點！" } })
          ]
        },
        {
          id: "cant_find_item", name: "找不到想要的口味", icon: "🔍",
          desc: "紅豆麵包賣完了，接受店員建議改買其他口味",
          steps: [
            mkStep({ id:"greeting", say:"你好！請問在找什麼呢？", task:"跟老闆打招呼",
              options:["你好！","謝謝再見","多少錢？","有沒有折扣？"], kw:"greet",
              feedback:{ perfect:"很好！", partial:"可以說得更完整" } }),
            mkStep({ id:"ask_redbean", say:"請問需要幫忙嗎？", task:"詢問有沒有紅豆麵包",
              options:["請問有沒有紅豆麵包？","我要吐司","謝謝再見","我要蛋糕"], kw:["紅豆"],
              feedback:{ perfect:"問得很清楚！", partial:"說出了重點！試著說完整：「請問有沒有紅豆麵包？」" } }),
            mkStep({ id:"sold_out", say:"不好意思，紅豆麵包剛好賣完了！但我們有奶酥口味的喔。", task:"說你要試試看奶酥麵包",
              options:["好，我要試試看奶酥的","那我不買了","我要吐司好了","謝謝再見"], kw:["奶酥","試試"],
              feedback:{ perfect:"很好！願意嘗試新口味！", partial:"說出了重點！" } }),
            mkStep({ id:"decide", say:"奶酥麵包很多人喜歡喔！", task:"說你要買兩個奶酥麵包",
              options:["我要買兩個","我只要一個","那我不要了","謝謝再見"], kw:["兩個"],
              feedback:{ perfect:"很好！清楚說明數量！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！兩個奶酥麵包共 50 元，謝謝！", task:"付款並道謝說再見",
              options:["謝謝！再見！","哼，不用你管！","好的，謝謝！","掰掰！謝謝！"], kw:"bye",
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！再加上「再見」更完整" } })
          ]
        },
        {
          id: "ask_fresh", name: "詢問新不新鮮", icon: "⏰",
          desc: "詢問麵包是不是剛出爐的，再決定要買什麼",
          steps: [
            mkStep({ id:"greeting", say:"你好！請問需要幫忙嗎？", task:"跟老闆打招呼",
              options:["你好！","謝謝再見","多少錢？","營業到幾點？"], kw:"greet",
              feedback:{ perfect:"很好！", partial:"可以說得更完整" } }),
            mkStep({ id:"ask_fresh", say:"請問需要幫忙嗎？", task:"詢問麵包是不是剛出爐的",
              options:["請問這是剛出爐的嗎？","我要結帳","謝謝再見","有沒有折扣？"], kw:["剛出爐","新鮮","出爐"],
              feedback:{ perfect:"問得很好！懂得關心新鮮度！", partial:"說出了重點！" } }),
            mkStep({ id:"answer", say:"是的！這批是半小時前剛出爐的，還熱熱的喔！", task:"說你要買兩個奶油餐包",
              options:["我要買兩個奶油餐包","我要一個就好","那我不買了","謝謝再見"], kw:["奶油餐包","兩個"],
              feedback:{ perfect:"很好！說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！兩個奶油餐包共 30 元，謝謝！", task:"付款並道謝",
              options:["好的，謝謝！","謝謝，我付現金！","謝謝！","掰掰！"], kw:["謝謝","現金"],
              feedback:{ perfect:"很棒！", partial:"有說謝謝！" } })
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 美妝雜貨店（第一部分・基礎買賣）
    // ══════════════════════════════════════════
    {
      id: "beauty_store", name: "美妝雜貨店", icon: "💄", available: true,
      theme: { color: '#C026D3', bg: '#FAE8FF', accent: '#A21CAF' },
      situations: [
        {
          id: "basic", name: "基本購買", icon: "🧴",
          desc: "詢問乳液位置、確認價錢到結帳的完整購買流程",
          steps: [
            mkStep({ id:"greeting", say:"你好！歡迎光臨，請問需要什麼呢？", task:"跟店員打招呼",
              options:["你好！","謝謝再見","多少錢？","有沒有試用包？"], kw:"greet",
              feedback:{ perfect:"打招呼打得很好！", partial:"不錯！可以說得更完整" } }),
            mkStep({ id:"ask_location", say:"請問想找哪一種商品呢？", task:"詢問乳液在哪裡",
              options:["請問乳液在哪裡？","我要結帳","謝謝再見","請問多少錢？"], kw:["乳液"],
              frame_ref:"ask_location", slots:{ item:{ answer:"乳液", choices:[
                { text:"乳液", emoji:"🧴" }, { text:"洗面乳", emoji:"🧼" },
                { text:"香皂", emoji:"🧽" }, { text:"洗髮精", emoji:"🧴" } ] } },
              feedback:{ perfect:"問得很清楚！", partial:"說出了重點！試試說完整：「請問乳液在哪裡？」" } }),
            mkStep({ id:"ask_price", say:"乳液在這一排喔，請問還需要什麼嗎？", task:"詢問這罐多少錢",
              options:["請問這罐多少錢？","好的謝謝","我要買兩罐","謝謝再見"], kw:"price",
              frame_ref:"ask_price", slots:{ item:{ answer:"乳液", choices:[
                { text:"乳液", emoji:"🧴" }, { text:"防曬乳", emoji:"🧴" },
                { text:"洗面乳", emoji:"🧼" }, { text:"香皂", emoji:"🧽" } ] } },
              feedback:{ perfect:"問得很好！", partial:"說出了重點！可以加上「請問」更有禮貌" } }),
            mkStep({ id:"purchase", say:"這罐乳液 120 元，請問還需要別的嗎？", task:"告訴店員你要買這罐",
              options:["我要買這罐","你好！","請問廁所在哪裡？","謝謝再見"], kw:["我要買","要買"],
              frame_ref:"want_item", slots:{ item:{ answer:"乳液", choices:[
                { text:"乳液", emoji:"🧴" }, { text:"洗面乳", emoji:"🧼" },
                { text:"香皂", emoji:"🧽" }, { text:"洗髮精", emoji:"🧴" } ] } },
              feedback:{ perfect:"很好！購買意願說得很清楚！", partial:"說出了重點！可以說完整：「我要買這罐！」" } }),
            mkStep({ id:"checkout", say:"好的！120 元，請問怎麼付款？", task:"付款並道謝",
              options:["我付現金，謝謝！","刷卡，謝謝","悠遊卡，謝謝","我沒帶錢"], kw:"pay",
              feedback:{ perfect:"太棒了！付款和道謝都說到了！", partial:"說出了部分！可以同時說付款方式和謝謝" } })
          ]
        },
        {
          id: "ask_recommendation", name: "詢問推薦商品", icon: "🧴",
          desc: "詢問店員推薦的防曬乳，並完成購買",
          steps: [
            mkStep({ id:"greeting", say:"你好！請問需要幫忙嗎？", task:"跟店員打招呼",
              options:["你好！","謝謝再見","多少錢？","有沒有折扣？"], kw:"greet",
              feedback:{ perfect:"很好！", partial:"可以說得更完整" } }),
            mkStep({ id:"ask_rec", say:"請問需要幫忙嗎？", task:"詢問有沒有推薦的防曬乳",
              options:["請問有推薦的防曬乳嗎？","我要買洗髮精","謝謝再見","我要買香皂"], kw:["防曬","推薦"],
              feedback:{ perfect:"問得很好！懂得請人推薦！", partial:"說出了重點！" } }),
            mkStep({ id:"answer", say:"這款防曬乳很多人買，清爽不黏膩喔！", task:"說你要買這罐",
              options:["好，我要這罐","那我再想想","我不需要了","謝謝再見"], kw:["我要買","要買","這罐"],
              feedback:{ perfect:"很好！說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！這罐防曬乳 150 元，謝謝！", task:"付款並道謝",
              options:["好的，謝謝！","謝謝，我付現金！","謝謝！","掰掰！"], kw:["謝謝","現金"],
              feedback:{ perfect:"很棒！", partial:"有說謝謝！" } })
          ]
        },
        {
          id: "not_enough_money", name: "錢不夠", icon: "💸",
          desc: "買洗面乳時發現錢不夠，改買便宜的香皂",
          steps: [
            mkStep({ id:"select", say:"你好！請問想要買什麼？", task:"告訴店員你要買洗面乳",
              options:["我要買洗面乳","我要買乳液","謝謝再見","我再看看"], kw:["洗面乳"],
              frame_ref:"want_item", slots:{ item:{ answer:"洗面乳", choices:[
                { text:"洗面乳", emoji:"🧼" }, { text:"乳液", emoji:"🧴" }, { text:"香皂", emoji:"🧽" } ] } },
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"hear_total", say:"好的！這罐洗面乳 90 元。", task:"告訴店員你要付現金",
              options:["我付現金","刷卡","用悠遊卡","稍等一下"], kw:"pay",
              feedback:{ perfect:"很好！", partial:"說出了重點！" } }),
            mkStep({ id:"not_enough", say:"（你打開錢包，發現只有 50 元，不夠 90 元）", task:"告訴店員你的錢不夠",
              options:["不好意思，我的錢不夠","我下次再來","可以先欠著嗎？","那我不買了"],
              kw:["不夠","只有","沒有","錢不夠","不到","不足","差","少"],
              feedback:{ perfect:"說得很誠實！很勇敢！", partial:"說出了重點！" } }),
            mkStep({ id:"choose", say:"沒關係！要不要換一塊香皂，只要 35 元？", task:"說你要改買香皂",
              options:["好，我要香皂","我還是要洗面乳","兩個都不要了","讓我想一想"], kw:["香皂","改"],
              feedback:{ perfect:"很好！懂得因應調整！", partial:"說出了重點！" } })
          ]
        },
        {
          id: "ask_sale", name: "詢問特價活動", icon: "🏷️",
          desc: "詢問洗髮精買一送一的活動並完成購買",
          steps: [
            mkStep({ id:"greet_ask", say:"你好！請問需要幫忙嗎？", task:"打招呼並詢問有沒有特價活動",
              options:["你好！請問有特價活動嗎？","你好，有沒有折扣？","請問有優惠嗎？","謝謝再見"], kw:["特價","折扣","優惠"],
              feedback:{ perfect:"問得很好！懂得找優惠！", partial:"說出了重點！" } }),
            mkStep({ id:"answer", say:"有的！這款洗髮精本週買一送一喔！", task:"說你要買這款洗髮精",
              options:["好，我要買這款","那我再想想","我不需要了","謝謝再見"], kw:["我要買","要買","洗髮精"],
              feedback:{ perfect:"很好！懂得利用優惠！", partial:"說出了重點！" } }),
            mkStep({ id:"choose", say:"好的！請問要哪一種香味？有花香、果香跟無香可以選！", task:"說你要花香的",
              options:["我要花香的！","我要果香的！","我要無香的！","三種各一瓶！"], kw:["花香"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！買一送一共 199 元，謝謝！", task:"付款並道謝",
              options:["好的，謝謝！","謝謝，我付現金！","謝謝！","掰掰！"], kw:["謝謝","現金"],
              feedback:{ perfect:"很棒！有利用到優惠！", partial:"有說謝謝！" } })
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 手搖飲料店（第二部分・點餐客製）
    // ══════════════════════════════════════════
    {
      id: "drink_shop", name: "手搖飲料店", icon: "🧋", available: true,
      theme: { color: '#0D9488', bg: '#CCFBF1', accent: '#0F766E' },
      situations: [
        {
          id: "basic", name: "基本點飲料", icon: "🧋",
          desc: "點飲料並說出甜度、冰塊的完整點餐流程",
          steps: [
            mkStep({ id:"greeting", say:"你好！歡迎光臨，請問要喝什麼呢？", task:"跟店員打招呼",
              options:["你好！","謝謝再見","多少錢？","有優惠嗎？"], kw:"greet",
              feedback:{ perfect:"打招呼打得很好！", partial:"不錯！可以說得更完整" } }),
            mkStep({ id:"order", say:"好的，請問要點什麼飲料呢？", task:"告訴店員你要一杯珍珠奶茶",
              options:["我要一杯珍珠奶茶","我要結帳","謝謝再見","有什麼推薦？"], kw:["珍珠奶茶"],
              frame_ref:"want_item", slots:{ item:{ answer:"珍珠奶茶", choices:[
                { text:"珍珠奶茶", emoji:"🧋" }, { text:"綠茶", emoji:"🍵" },
                { text:"紅茶拿鐵", emoji:"🥤" }, { text:"檸檬水", emoji:"🍋" } ] } },
              feedback:{ perfect:"點得很清楚！", partial:"說出了重點！試試說完整：「我要一杯珍珠奶茶」" } }),
            mkStep({ id:"ask_sweet", say:"好的！請問甜度要幾分呢？", task:"說你要半糖",
              options:["半糖","全糖","無糖","微糖"], kw:["半糖"],
              feedback:{ perfect:"說得很清楚！懂得選擇甜度！", partial:"說出了重點！" } }),
            mkStep({ id:"ask_ice", say:"好的，半糖！請問冰塊要正常還是少冰呢？", task:"說你要少冰",
              options:["少冰","正常冰","去冰","溫的"], kw:["少冰"],
              feedback:{ perfect:"說得很清楚！懂得選擇冰塊！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！半糖少冰的珍珠奶茶 55 元，請問怎麼付款？", task:"付款並道謝",
              options:["我付現金，謝謝！","刷卡，謝謝","悠遊卡，謝謝","我沒帶錢"], kw:"pay",
              feedback:{ perfect:"太棒了！付款和道謝都說到了！", partial:"說出了部分！可以同時說付款方式和謝謝" } })
          ]
        },
        {
          id: "wrong_order", name: "點錯了要改", icon: "🔄",
          desc: "店員複誦飲料弄錯了，禮貌地更正",
          steps: [
            mkStep({ id:"order", say:"你好！請問要喝什麼呢？", task:"告訴店員你要一杯綠茶",
              options:["我要一杯綠茶","我要珍珠奶茶","謝謝再見","有什麼推薦？"], kw:["綠茶"],
              feedback:{ perfect:"點得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"clerk_mistake", say:"好的，一杯紅茶對嗎？", task:"告訴店員你點的是綠茶不是紅茶",
              options:["不是喔，我要綠茶","對，紅茶就好","謝謝再見","我要換飲料"], kw:["綠茶","不是"],
              feedback:{ perfect:"很好！勇敢地更正了！", partial:"說出了重點！" } }),
            mkStep({ id:"confirm", say:"不好意思，我聽錯了！好的，一杯綠茶。", task:"說謝謝店員的更正",
              options:["謝謝你！","沒關係！","再確認一次","謝謝再見"], kw:["謝謝"],
              feedback:{ perfect:"很有禮貌！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！綠茶一杯 40 元，謝謝！", task:"付款並道謝",
              options:["好的，謝謝！","謝謝，我付現金！","謝謝！","掰掰！"], kw:["謝謝","現金"],
              feedback:{ perfect:"很棒！", partial:"有說謝謝！" } })
          ]
        },
        {
          id: "not_enough_money", name: "錢不夠", icon: "💸",
          desc: "點大杯飲料時發現錢不夠，改點小杯",
          steps: [
            mkStep({ id:"select", say:"你好！請問要喝什麼呢？", task:"告訴店員你要一杯大杯奶茶",
              options:["我要一杯大杯奶茶","我要小杯就好","謝謝再見","我再看看"], kw:["大杯","奶茶"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"hear_total", say:"好的！大杯奶茶 50 元。", task:"告訴店員你要付現金",
              options:["我付現金","刷卡","用悠遊卡","稍等一下"], kw:"pay",
              feedback:{ perfect:"很好！", partial:"說出了重點！" } }),
            mkStep({ id:"not_enough", say:"（你翻了翻口袋，發現只有 35 元，不夠 50 元）", task:"告訴店員你的錢不夠",
              options:["不好意思，我的錢不夠","我下次再來","可以先欠著嗎？","那我不買了"],
              kw:["不夠","只有","沒有","錢不夠","不到","不足","差","少"],
              feedback:{ perfect:"說得很誠實！很勇敢！", partial:"說出了重點！" } }),
            mkStep({ id:"choose", say:"沒關係！要不要改點中杯，只要 35 元？", task:"說你要改成中杯",
              options:["好，我要中杯","我還是要大杯","兩個都不要了","讓我想一想"], kw:["中杯","改"],
              feedback:{ perfect:"很好！懂得因應調整！", partial:"說出了重點！" } })
          ]
        },
        {
          id: "ask_size", name: "詢問大小杯價錢", icon: "📏",
          desc: "詢問飲料大小杯的價差，再決定要點什麼",
          steps: [
            mkStep({ id:"greet_ask", say:"你好！請問要喝什麼呢？", task:"打招呼並詢問大杯多少錢",
              options:["你好！請問大杯多少錢？","你好，有什麼優惠？","請問有折扣嗎？","謝謝再見"], kw:["大杯","多少錢"],
              feedback:{ perfect:"問得很好！", partial:"說出了重點！" } }),
            mkStep({ id:"answer", say:"大杯 50 元，中杯 40 元喔！", task:"說你要一杯大杯的紅茶",
              options:["我要一杯大杯紅茶","我要中杯就好","那我再想想","謝謝再見"], kw:["大杯","紅茶"],
              feedback:{ perfect:"很好！說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"ask_sweet", say:"好的！請問甜度要幾分呢？", task:"說你要微糖",
              options:["微糖","全糖","無糖","半糖"], kw:["微糖"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！大杯微糖紅茶 50 元，謝謝！", task:"付款並道謝",
              options:["好的，謝謝！","謝謝，我付現金！","謝謝！","掰掰！"], kw:["謝謝","現金"],
              feedback:{ perfect:"很棒！", partial:"有說謝謝！" } })
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 便當店（第二部分・點餐客製）
    // ══════════════════════════════════════════
    {
      id: "lunchbox_shop", name: "便當店", icon: "🍱", available: true,
      theme: { color: '#9A3412', bg: '#FFEDD5', accent: '#7C2D12' },
      situations: [
        {
          id: "basic", name: "基本點餐", icon: "🍱",
          desc: "選擇主菜與飯量的完整便當購買流程",
          steps: [
            mkStep({ id:"greeting", say:"你好！請問要吃什麼呢？", task:"跟老闆打招呼",
              options:["你好！","謝謝再見","多少錢？","今天有什麼菜？"], kw:"greet",
              feedback:{ perfect:"打招呼打得很好！", partial:"不錯！可以說得更完整" } }),
            mkStep({ id:"choose_meat", say:"好的，請問要哪一種主菜呢？", task:"告訴老闆你要雞腿便當",
              options:["我要雞腿便當","我要結帳","謝謝再見","有什麼推薦？"], kw:["雞腿"],
              frame_ref:"want_item", slots:{ item:{ answer:"雞腿便當", choices:[
                { text:"雞腿便當", emoji:"🍗" }, { text:"排骨便當", emoji:"🥩" },
                { text:"魚排便當", emoji:"🐟" }, { text:"滷蛋便當", emoji:"🥚" } ] } },
              feedback:{ perfect:"點得很清楚！", partial:"說出了重點！試試說完整：「我要雞腿便當」" } }),
            mkStep({ id:"ask_rice", say:"好的！請問飯要正常還是少一點呢？", task:"說你要飯少一點",
              options:["飯少一點","正常飯量","飯多一點","不要飯"], kw:["少一點","飯少"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！雞腿便當飯少一點，共 80 元，請問怎麼付款？", task:"付款並道謝",
              options:["我付現金，謝謝！","刷卡，謝謝","悠遊卡，謝謝","我沒帶錢"], kw:"pay",
              feedback:{ perfect:"太棒了！付款和道謝都說到了！", partial:"說出了部分！可以同時說付款方式和謝謝" } })
          ]
        },
        {
          id: "not_enough_money", name: "錢不夠", icon: "💸",
          desc: "點雞腿便當時發現錢不夠，改點便宜的滷蛋便當",
          steps: [
            mkStep({ id:"select", say:"你好！請問要吃什麼呢？", task:"告訴老闆你要雞腿便當",
              options:["我要雞腿便當","我要滷蛋便當","謝謝再見","我再看看"], kw:["雞腿"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"hear_total", say:"好的！雞腿便當 90 元。", task:"告訴老闆你要付現金",
              options:["我付現金","刷卡","用悠遊卡","稍等一下"], kw:"pay",
              feedback:{ perfect:"很好！", partial:"說出了重點！" } }),
            mkStep({ id:"not_enough", say:"（你數了數錢包裡的錢，只有 60 元，不夠 90 元）", task:"告訴老闆你的錢不夠",
              options:["不好意思，我的錢不夠","我下次再來","可以先欠著嗎？","那我不買了"],
              kw:["不夠","只有","沒有","錢不夠","不到","不足","差","少"],
              feedback:{ perfect:"說得很誠實！很勇敢！", partial:"說出了重點！" } }),
            mkStep({ id:"choose", say:"沒關係！要不要換滷蛋便當，只要 55 元？", task:"說你要改買滷蛋便當",
              options:["好，我要滷蛋便當","我還是要雞腿便當","兩個都不要了","讓我想一想"], kw:["滷蛋","改"],
              feedback:{ perfect:"很好！懂得因應調整！", partial:"說出了重點！" } })
          ]
        },
        {
          id: "ask_special", name: "詢問今日特餐", icon: "🌟",
          desc: "詢問今天有什麼特餐，再決定要買什麼",
          steps: [
            mkStep({ id:"greet_ask", say:"你好！請問要吃什麼呢？", task:"打招呼並詢問今日特餐是什麼",
              options:["你好！請問今天有什麼特餐？","你好，有推薦的嗎？","請問最便宜的是什麼？","謝謝再見"],
              kw:["特餐","推薦"],
              feedback:{ perfect:"問得很好！懂得詢問特餐！", partial:"說出了重點！" } }),
            mkStep({ id:"answer", say:"今天特餐是排骨便當，只要 70 元喔！", task:"說你要一個特餐",
              options:["好，我要一個特餐","那我再想想","我要別的","謝謝再見"], kw:["特餐","我要"],
              feedback:{ perfect:"很好！懂得利用特餐！", partial:"說出了重點！" } }),
            mkStep({ id:"ask_rice", say:"好的！請問飯要正常還是多一點呢？", task:"說你要正常飯量",
              options:["正常飯量","飯多一點","飯少一點","不要飯"], kw:["正常"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！特餐一份 70 元，謝謝！", task:"付款並道謝",
              options:["好的，謝謝！","謝謝，我付現金！","謝謝！","掰掰！"], kw:["謝謝","現金"],
              feedback:{ perfect:"很棒！有利用到特餐！", partial:"有說謝謝！" } })
          ]
        },
        {
          id: "wait_too_long", name: "等太久了", icon: "⏰",
          desc: "排隊等便當等太久，禮貌地詢問還要多久",
          steps: [
            mkStep({ id:"wait", say:"（你已經在便當店等了好一陣子，便當還沒好）", task:"禮貌地詢問還要等多久",
              options:["請問還要等多久呢？","算了，我不要了","我要換別的","你好"],
              kw:["還要","多久","等"],
              feedback:{ perfect:"問得很有禮貌！", partial:"說出了重點！" } }),
            mkStep({ id:"answer", say:"不好意思，再兩分鐘就好囉！", task:"說好，你願意再等一下",
              options:["好的，我再等一下","那我不要了","可以快一點嗎？","謝謝再見"], kw:["再等","好的"],
              feedback:{ perfect:"很有耐心！", partial:"說出了重點！" } }),
            mkStep({ id:"receive", say:"久等了！這是你的雞腿便當，80 元。", task:"付款並道謝",
              options:["我付現金，謝謝！","刷卡，謝謝","悠遊卡，謝謝","終於好了！"], kw:"pay",
              feedback:{ perfect:"太棒了！付款和道謝都說到了！", partial:"說出了部分！" } }),
            mkStep({ id:"thanks", say:"謝謝你的耐心等待！", task:"跟老闆道謝說再見",
              options:["謝謝！再見！","哼，不用你管！","好的，謝謝！","掰掰！謝謝！"], kw:"bye",
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！再加上「再見」更完整" } })
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 咖啡店（第二部分・點餐客製）
    // ══════════════════════════════════════════
    {
      id: "coffee_shop", name: "咖啡店", icon: "☕", available: true,
      theme: { color: '#78350F', bg: '#FDF6EC', accent: '#451A03' },
      situations: [
        {
          id: "basic", name: "基本點咖啡", icon: "☕",
          desc: "點咖啡並說出冰熱、大小的完整點餐流程",
          steps: [
            mkStep({ id:"greeting", say:"你好！歡迎光臨，請問要喝什麼呢？", task:"跟店員打招呼",
              options:["你好！","謝謝再見","多少錢？","有優惠嗎？"], kw:"greet",
              feedback:{ perfect:"打招呼打得很好！", partial:"不錯！可以說得更完整" } }),
            mkStep({ id:"order", say:"好的，請問要點什麼咖啡呢？", task:"告訴店員你要一杯拿鐵",
              options:["我要一杯拿鐵","我要結帳","謝謝再見","有什麼推薦？"], kw:["拿鐵"],
              frame_ref:"want_item", slots:{ item:{ answer:"拿鐵", choices:[
                { text:"拿鐵", emoji:"☕" }, { text:"美式咖啡", emoji:"☕" },
                { text:"卡布奇諾", emoji:"☕" }, { text:"熱可可", emoji:"🍫" } ] } },
              feedback:{ perfect:"點得很清楚！", partial:"說出了重點！試試說完整：「我要一杯拿鐵」" } }),
            mkStep({ id:"ask_hot_or_iced", say:"好的！請問要熱的還是冰的呢？", task:"說你要冰的",
              options:["冰的","熱的","溫的","都可以"], kw:["冰的"],
              feedback:{ perfect:"說得很清楚！懂得選擇冰熱！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！冰拿鐵一杯 65 元，請問怎麼付款？", task:"付款並道謝",
              options:["我付現金，謝謝！","刷卡，謝謝","悠遊卡，謝謝","我沒帶錢"], kw:"pay",
              feedback:{ perfect:"太棒了！付款和道謝都說到了！", partial:"說出了部分！可以同時說付款方式和謝謝" } })
          ]
        },
        {
          id: "not_enough_money", name: "錢不夠", icon: "💸",
          desc: "點拿鐵時發現錢不夠，改點便宜的美式咖啡",
          steps: [
            mkStep({ id:"select", say:"你好！請問要喝什麼呢？", task:"告訴店員你要一杯拿鐵",
              options:["我要一杯拿鐵","我要美式咖啡","謝謝再見","我再看看"], kw:["拿鐵"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"hear_total", say:"好的！拿鐵一杯 65 元。", task:"告訴店員你要付現金",
              options:["我付現金","刷卡","用悠遊卡","稍等一下"], kw:"pay",
              feedback:{ perfect:"很好！", partial:"說出了重點！" } }),
            mkStep({ id:"not_enough", say:"（你打開錢包，發現只有 45 元，不夠 65 元）", task:"告訴店員你的錢不夠",
              options:["不好意思，我的錢不夠","我下次再來","可以先欠著嗎？","那我不買了"],
              kw:["不夠","只有","沒有","錢不夠","不到","不足","差","少"],
              feedback:{ perfect:"說得很誠實！很勇敢！", partial:"說出了重點！" } }),
            mkStep({ id:"choose", say:"沒關係！要不要換美式咖啡，只要 45 元？", task:"說你要改點美式咖啡",
              options:["好，我要美式咖啡","我還是要拿鐵","兩個都不要了","讓我想一想"], kw:["美式","改"],
              feedback:{ perfect:"很好！懂得因應調整！", partial:"說出了重點！" } })
          ]
        },
        {
          id: "ask_seat", name: "詢問座位與插座", icon: "🔌",
          desc: "詢問店裡有沒有空位和插座可以使用",
          steps: [
            mkStep({ id:"greet_ask", say:"你好！請問要喝什麼呢？", task:"打招呼並詢問有沒有插座的位子",
              options:["你好！請問有插座的位子嗎？","你好，有位子嗎？","請問可以坐多久？","謝謝再見"],
              kw:["插座","位子"],
              feedback:{ perfect:"問得很有禮貌！", partial:"說出了重點！" } }),
            mkStep({ id:"answer", say:"有的！靠窗那一區都有插座喔！", task:"說謝謝店員的說明",
              options:["謝謝你！","好的，我知道了","太好了！","謝謝再見"], kw:["謝謝"],
              feedback:{ perfect:"很有禮貌！", partial:"說出了重點！" } }),
            mkStep({ id:"order", say:"請問要點什麼飲料呢？", task:"說你要一杯熱美式",
              options:["我要一杯熱美式","我要拿鐵","謝謝再見","我再看看"], kw:["美式"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！熱美式一杯 50 元，謝謝！", task:"付款並道謝",
              options:["好的，謝謝！","謝謝，我付現金！","謝謝！","掰掰！"], kw:["謝謝","現金"],
              feedback:{ perfect:"很棒！", partial:"有說謝謝！" } })
          ]
        },
        {
          id: "wrong_order", name: "點錯口味了", icon: "🔄",
          desc: "店員複誦口味弄錯了，禮貌地更正",
          steps: [
            mkStep({ id:"order", say:"你好！請問要喝什麼呢？", task:"告訴店員你要一杯焦糖拿鐵",
              options:["我要一杯焦糖拿鐵","我要美式咖啡","謝謝再見","有什麼推薦？"], kw:["焦糖"],
              feedback:{ perfect:"點得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"clerk_mistake", say:"好的，一杯香草拿鐵對嗎？", task:"告訴店員你點的是焦糖不是香草",
              options:["不是喔，我要焦糖的","對，香草就好","謝謝再見","我要換飲料"], kw:["焦糖","不是"],
              feedback:{ perfect:"很好！勇敢地更正了！", partial:"說出了重點！" } }),
            mkStep({ id:"confirm", say:"不好意思，我聽錯了！好的，一杯焦糖拿鐵。", task:"說謝謝店員的更正",
              options:["謝謝你！","沒關係！","再確認一次","謝謝再見"], kw:["謝謝"],
              feedback:{ perfect:"很有禮貌！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！焦糖拿鐵一杯 70 元，謝謝！", task:"付款並道謝",
              options:["好的，謝謝！","謝謝，我付現金！","謝謝！","掰掰！"], kw:["謝謝","現金"],
              feedback:{ perfect:"很棒！", partial:"有說謝謝！" } })
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 郵局櫃臺（第三部分・生活應對）
    // ══════════════════════════════════════════
    {
      id: "post_office", name: "郵局櫃臺", icon: "📮", available: true,
      theme: { color: '#1D4ED8', bg: '#DBEAFE', accent: '#1E40AF' },
      situations: [
        {
          id: "basic", name: "寄送包裹", icon: "📦",
          desc: "告訴櫃檯人員要寄包裹，確認費用並付款",
          steps: [
            mkStep({ id:"greeting", say:"你好！請問需要辦理什麼業務呢？", task:"跟櫃檯人員打招呼",
              options:["你好！","謝謝再見","多少錢？","請問怎麼寄信？"], kw:"greet",
              feedback:{ perfect:"打招呼打得很好！", partial:"不錯！可以說得更完整" } }),
            mkStep({ id:"tell_purpose", say:"好的，請問要辦理什麼呢？", task:"告訴櫃檯人員你要寄包裹",
              options:["我要寄包裹","我要買郵票","謝謝再見","我要領錢"], kw:["寄包裹","包裹"],
              frame_ref:"want_item", slots:{ item:{ answer:"包裹", choices:[
                { text:"包裹", emoji:"📦" }, { text:"信件", emoji:"✉️" },
                { text:"郵票", emoji:"📮" }, { text:"明信片", emoji:"📬" } ] } },
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！試著說完整：「我要寄包裹」" } }),
            mkStep({ id:"weigh", say:"好的，請把包裹放上來給我秤重喔！", task:"告訴櫃檯人員好的",
              options:["好的，謝謝！","不用了","等一下","我改變主意了"], kw:["好的"],
              feedback:{ perfect:"很好！", partial:"說出了重點！" } }),
            mkStep({ id:"ask_price", say:"這個包裹重 1 公斤，請問還需要什麼嗎？", task:"詢問這樣要多少錢",
              options:["請問這樣要多少錢？","好的謝謝","我要寄兩個","謝謝再見"], kw:"price",
              frame_ref:"ask_price", slots:{ item:{ answer:"包裹", choices:[
                { text:"包裹", emoji:"📦" }, { text:"信件", emoji:"✉️" } ] } },
              feedback:{ perfect:"問得很好！", partial:"說出了重點！可以加上「請問」更有禮貌" } }),
            mkStep({ id:"checkout", say:"好的！運費 90 元，請問怎麼付款？", task:"付款並道謝",
              options:["我付現金，謝謝！","刷卡，謝謝","悠遊卡，謝謝","我沒帶錢"], kw:"pay",
              feedback:{ perfect:"太棒了！付款和道謝都說到了！", partial:"說出了部分！可以同時說付款方式和謝謝" } })
          ]
        },
        {
          id: "buy_stamp", name: "購買郵票", icon: "✉️",
          desc: "詢問並購買寄信要用的郵票",
          steps: [
            mkStep({ id:"greet_ask", say:"你好！請問需要辦理什麼業務呢？", task:"打招呼並詢問郵票怎麼賣",
              options:["你好！請問郵票怎麼賣？","你好，我要買郵票","請問多少錢一張？","謝謝再見"],
              kw:["郵票"],
              feedback:{ perfect:"問得很好！", partial:"說出了重點！" } }),
            mkStep({ id:"answer", say:"國內信郵票一張 5 元喔！請問要幾張呢？", task:"說你要買兩張",
              options:["我要兩張","我要一張","我要十張","謝謝再見"], kw:["兩張"],
              feedback:{ perfect:"很好！說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"confirm", say:"好的，兩張郵票，請問還需要什麼嗎？", task:"說不用了，謝謝",
              options:["不用了，謝謝","我還要買包裹箱","再給我一張","謝謝再見"], kw:["不用","謝謝"],
              feedback:{ perfect:"很好！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！兩張郵票共 10 元，謝謝！", task:"付款並道謝",
              options:["好的，謝謝！","謝謝，我付現金！","謝謝！","掰掰！"], kw:["謝謝","現金"],
              feedback:{ perfect:"很棒！", partial:"有說謝謝！" } })
          ]
        },
        {
          id: "not_enough_money", name: "錢不夠", icon: "💸",
          desc: "寄包裹時發現錢不夠，改用比較便宜的寄送方式",
          steps: [
            mkStep({ id:"select", say:"你好！請問要辦理什麼呢？", task:"告訴櫃檯人員你要寄包裹",
              options:["我要寄包裹","我要買郵票","謝謝再見","我再想想"], kw:["包裹"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"hear_total", say:"好的！這個包裹用宅配寄送要 150 元。", task:"告訴櫃檯人員你要付現金",
              options:["我付現金","刷卡","用悠遊卡","稍等一下"], kw:"pay",
              feedback:{ perfect:"很好！", partial:"說出了重點！" } }),
            mkStep({ id:"not_enough", say:"（你數了數皮夾裡的錢，只有 100 元，不夠 150 元）", task:"告訴櫃檯人員你的錢不夠",
              options:["不好意思，我的錢不夠","我下次再來","可以先欠著嗎？","那我不寄了"],
              kw:["不夠","只有","沒有","錢不夠","不到","不足","差","少"],
              feedback:{ perfect:"說得很誠實！很勇敢！", partial:"說出了重點！" } }),
            mkStep({ id:"choose", say:"沒關係！要不要改用普通包裹寄送，只要 90 元？", task:"說好，你要改用普通包裹",
              options:["好，我要普通包裹","我還是要宅配","兩個都不要了","讓我想一想"], kw:["普通包裹","改"],
              feedback:{ perfect:"很好！懂得因應調整！", partial:"說出了重點！" } })
          ]
        },
        {
          id: "ask_time", name: "詢問多久會到", icon: "🕐",
          desc: "詢問寄出的包裹大約幾天會送達",
          steps: [
            mkStep({ id:"greet_ask", say:"你好！請問需要辦理什麼呢？", task:"打招呼並詢問包裹多久會到",
              options:["你好！請問包裹多久會到？","你好，我要寄包裹","請問幾天會到？","謝謝再見"],
              kw:["多久","幾天"],
              feedback:{ perfect:"問得很好！懂得確認時間！", partial:"說出了重點！" } }),
            mkStep({ id:"answer", say:"一般大約 2 到 3 天會送到喔！", task:"說好的，你要寄這個包裹",
              options:["好的，那我要寄這個","那我要用比較快的","謝謝再見","我再考慮一下"],
              kw:["好的","我要寄"],
              feedback:{ perfect:"很好！", partial:"說出了重點！" } }),
            mkStep({ id:"weigh", say:"好的，運費是 90 元，請問怎麼付款？", task:"付款並道謝",
              options:["我付現金，謝謝！","刷卡，謝謝","悠遊卡，謝謝","我沒帶錢"], kw:"pay",
              feedback:{ perfect:"太棒了！付款和道謝都說到了！", partial:"說出了部分！" } }),
            mkStep({ id:"thanks", say:"好的，謝謝你的耐心等候！", task:"跟櫃檯人員道謝說再見",
              options:["謝謝！再見！","哼，不用你管！","好的，謝謝！","掰掰！謝謝！"], kw:"bye",
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！再加上「再見」更完整" } })
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 圖書館（第三部分・生活應對）
    // ══════════════════════════════════════════
    {
      id: "library", name: "圖書館", icon: "📚", available: true,
      theme: { color: '#155E75', bg: '#ECFEFF', accent: '#164E63' },
      situations: [
        {
          id: "basic", name: "基本借書", icon: "📖",
          desc: "出示借書證、借閱一本書的完整流程",
          steps: [
            mkStep({ id:"greeting", say:"你好！請問需要幫忙嗎？", task:"跟館員打招呼",
              options:["你好！","謝謝再見","這本書多少錢？","廁所在哪裡？"], kw:"greet",
              feedback:{ perfect:"打招呼打得很好！", partial:"不錯！可以說得更完整" } }),
            mkStep({ id:"tell_purpose", say:"好的，請問要借什麼呢？", task:"說你要借這本書",
              options:["我要借這本書","我要買這本書","謝謝再見","請問幾點關門？"], kw:["我要借","要借"],
              frame_ref:"want_item", slots:{ item:{ answer:"故事書", choices:[
                { text:"故事書", emoji:"📖" }, { text:"漫畫", emoji:"📕" },
                { text:"雜誌", emoji:"📰" }, { text:"繪本", emoji:"🖼️" } ] } },
              feedback:{ perfect:"很好！借閱意願說得很清楚！", partial:"說出了重點！可以說完整：「我要借這本書」" } }),
            mkStep({ id:"show_card", say:"好的，請給我看你的借書證。", task:"出示借書證",
              options:["這是我的借書證","我沒有借書證","我要辦一張","謝謝再見"], kw:["借書證","這是"],
              feedback:{ perfect:"很好！配合度很高！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的！借閱期限是兩週，兩週後要記得還書喔！", task:"說謝謝",
              options:["好的，謝謝！","謝謝，我會記得的！","知道了，謝謝！","謝謝再見"], kw:"bye",
              feedback:{ perfect:"說得很有禮貌！記得準時還書喔！", partial:"有說謝謝！" } })
          ]
        },
        {
          id: "cant_find_book", name: "找不到書", icon: "🔍",
          desc: "找不到想借的書，向館員求助並問路線",
          steps: [
            mkStep({ id:"greeting", say:"你好！請問在找什麼嗎？", task:"跟館員打招呼",
              options:["你好！","謝謝再見","這本書多少錢？","可以借幾本？"], kw:"greet",
              feedback:{ perfect:"很好！", partial:"可以說得更完整" } }),
            mkStep({ id:"ask_book", say:"請問需要幫忙嗎？", task:"詢問有沒有某本書",
              options:["請問有這本書嗎？","我要辦借書證","謝謝再見","我要還書"], kw:["這本書","有沒有"],
              feedback:{ perfect:"問得很清楚！", partial:"說出了重點！試著說完整：「請問有這本書嗎？」" } }),
            mkStep({ id:"locate", say:"有的！在二樓的兒童讀物區喔！", task:"說謝謝並詢問怎麼走",
              options:["謝謝！請問怎麼走？","好，謝謝你","我知道了","謝謝再見"], kw:["怎麼走","哪裡"],
              feedback:{ perfect:"很好！懂得進一步詢問！", partial:"說出了重點！" } }),
            mkStep({ id:"thanks", say:"沿著樓梯上去，右手邊就是了。", task:"道謝說再見",
              options:["謝謝！再見！","哼，不用你管！","好的，謝謝！","掰掰！謝謝！"], kw:"bye",
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！再加上「再見」更完整" } })
          ]
        },
        {
          id: "overdue_book", name: "還書逾期", icon: "⏰",
          desc: "還書時發現逾期，禮貌道歉並確認罰款",
          steps: [
            mkStep({ id:"return", say:"你好！請問要還書嗎？", task:"說你要還這本書",
              options:["我要還這本書","我要借書","謝謝再見","我要辦借書證"], kw:["還書","我要還"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"overdue_notice", say:"（系統顯示這本書已經逾期 3 天）", task:"為逾期向館員道歉",
              options:["對不起，我忘記了","這不關我的事","那我不還了","謝謝再見"],
              kw:["對不起","抱歉","不好意思"],
              feedback:{ perfect:"很好！懂得為疏失道歉！", partial:"說出了重點！" } }),
            mkStep({ id:"ask_fee", say:"沒關係，逾期一天 2 元，這樣是 6 元喔。", task:"說好的並確認付款",
              options:["好的，我付 6 元","太貴了，我不付","下次再付","謝謝再見"], kw:["好的","付"],
              feedback:{ perfect:"很好！懂得為自己的疏忽負責！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的，謝謝你！", task:"付款並道謝",
              options:["謝謝你！","好的，謝謝！","不客氣","再見"], kw:"bye",
              feedback:{ perfect:"很棒！有禮貌地完成了！", partial:"有說謝謝！" } })
          ]
        },
        {
          id: "apply_card", name: "辦借書證", icon: "🪪",
          desc: "第一次到圖書館，辦理借書證",
          steps: [
            mkStep({ id:"greet_ask", say:"你好！請問需要辦理什麼呢？", task:"打招呼並說你要辦借書證",
              options:["你好！我要辦借書證","你好，我要借書","請問要收費嗎？","謝謝再見"],
              kw:["借書證","辦"],
              feedback:{ perfect:"問得很好！", partial:"說出了重點！" } }),
            mkStep({ id:"ask_info", say:"好的！請問你是本地居民還是學生呢？", task:"說你是學生",
              options:["我是學生","我是居民","都不是","謝謝再見"], kw:["學生"],
              feedback:{ perfect:"很好！說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"confirm", say:"好的，請幫我填一下這張表格。", task:"說好的謝謝",
              options:["好的，謝謝！","我不會填","可以幫我填嗎？","謝謝再見"], kw:["好的","謝謝"],
              feedback:{ perfect:"很好！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"辦好了！這是你的借書證，歡迎常來！", task:"道謝說再見",
              options:["謝謝！再見！","哼，不用你管！","好的，謝謝！","掰掰！謝謝！"], kw:"bye",
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！再加上「再見」更完整" } })
          ]
        }
      ]
    },

    // ══════════════════════════════════════════
    // 警察局（第三部分・生活應對）
    // ══════════════════════════════════════════
    {
      id: "police_station", name: "警察局", icon: "🚓", available: true,
      theme: { color: '#1E3A8A', bg: '#EFF6FF', accent: '#1D4ED8' },
      situations: [
        {
          id: "lost_item", name: "遺失物品", icon: "🎒",
          desc: "東西不見了，向警員報案並說明遺失地點",
          steps: [
            mkStep({ id:"greeting", say:"你好！請問需要什麼協助？", task:"跟警員打招呼並說你想報案",
              options:["你好！我想報案","你好！","請問廁所在哪裡？","謝謝再見"], kw:["報案"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"describe", say:"好的，請問你遺失了什麼呢？", task:"說你的背包不見了",
              options:["我的背包不見了","我要買背包","謝謝再見","我要問路"], kw:["背包","不見了","遺失"],
              frame_ref:"want_item", slots:{ item:{ answer:"背包", choices:[
                { text:"背包", emoji:"🎒" }, { text:"錢包", emoji:"👛" },
                { text:"手機", emoji:"📱" }, { text:"雨傘", emoji:"☂️" } ] } },
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"details", say:"好的，請問是在哪裡弄丟的呢？", task:"說在公園弄丟的",
              options:["在公園弄丟的","在學校弄丟的","我不記得了","謝謝再見"], kw:["公園"],
              feedback:{ perfect:"很好！懂得說明地點！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的，我幫你登記，如果找到會通知你！", task:"道謝",
              options:["謝謝你！","好的，謝謝！","謝謝，再見！","太好了，謝謝！"], kw:"bye",
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！" } })
          ]
        },
        {
          id: "separated_from_family", name: "跟家人走散了", icon: "😰",
          desc: "在公共場所家人走散了，向警察求助",
          steps: [
            mkStep({ id:"greeting", say:"你好，這位學生你怎麼了嗎？", task:"說你弟弟不見了",
              options:["我弟弟不見了","你好！","我要買東西","謝謝再見"], kw:["走散","不見了","弟弟"],
              feedback:{ perfect:"很勇敢，說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"ask_details", say:"別擔心，我們會幫你！請問你還記得你弟弟穿什麼顏色的衣服嗎？",
              task:"說出弟弟衣服的顏色",
              options:["弟弟穿紅色的衣服","弟弟穿藍色的衣服","我不記得了","謝謝再見"], kw:["紅色","藍色","衣服"],
              feedback:{ perfect:"很好！記得清楚細節很重要！", partial:"說出了重點！" } }),
            mkStep({ id:"broadcast", say:"好的，我馬上幫你廣播協尋！", task:"說謝謝",
              options:["謝謝你！","好的，謝謝！","太好了","不客氣"], kw:["謝謝"],
              feedback:{ perfect:"很有禮貌！", partial:"說出了重點！" } }),
            mkStep({ id:"reunite", say:"太好了，找到你弟弟了！", task:"開心地道謝說再見",
              options:["謝謝你！再見！","太好了！謝謝！","弟弟！","謝謝，掰掰！"], kw:"bye",
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！" } })
          ]
        },
        {
          id: "found_item", name: "撿到東西", icon: "💰",
          desc: "撿到別人遺失的錢包，誠實送交警察局招領",
          steps: [
            mkStep({ id:"greeting", say:"你好！請問有什麼事嗎？", task:"打招呼並說你撿到東西",
              options:["你好！我撿到東西","你好！","我要報案","謝謝再見"], kw:["撿到"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"hand_in", say:"好的，請問你撿到什麼呢？", task:"說你撿到一個錢包",
              options:["我撿到一個錢包","我撿到一支手機","我撿到一把傘","謝謝再見"], kw:["錢包","撿到"],
              feedback:{ perfect:"很好！說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"where_found", say:"謝謝你這麼誠實！請問在哪裡撿到的？", task:"說在公車站撿到的",
              options:["在公車站撿到的","在公園撿到的","我不記得了","謝謝再見"], kw:["公車站"],
              feedback:{ perfect:"很好！懂得說明地點！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的，謝謝你的幫忙，你真是個好學生！", task:"道謝說再見",
              options:["謝謝！再見！","不客氣，再見！","謝謝誇獎！","掰掰！"], kw:"bye",
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！" } })
          ]
        },
        {
          id: "stranger_danger", name: "有人跟著我", icon: "🆘",
          desc: "覺得被陌生人跟蹤，跑進警察局尋求協助",
          steps: [
            mkStep({ id:"approach", say:"（你覺得有陌生人一直跟著你，跑進警察局）", task:"跟警察說你需要幫助",
              options:["請幫幫我！","你好！","我要問路","謝謝再見"], kw:["幫我","幫助","救命"],
              feedback:{ perfect:"很勇敢，做得很好！", partial:"說出了重點！" } }),
            mkStep({ id:"explain", say:"別緊張，你現在很安全！請問發生什麼事了？", task:"說有人跟蹤你",
              options:["有人一直跟著我","我迷路了","我肚子餓","謝謝再見"], kw:["跟蹤","跟著我"],
              feedback:{ perfect:"說得很清楚！", partial:"說出了重點！" } }),
            mkStep({ id:"reassure", say:"你做得很好，來這裡找我們是對的！請問可以打電話給你的家人嗎？",
              task:"說可以打給媽媽",
              options:["可以，打給我媽媽","可以，打給我爸爸","我不知道電話","謝謝再見"], kw:["打給","媽媽","爸爸"],
              feedback:{ perfect:"很好！懂得配合警察！", partial:"說出了重點！" } }),
            mkStep({ id:"checkout", say:"好的，我們馬上聯絡你的家人，你先坐著休息。", task:"說謝謝",
              options:["謝謝你！","好的，謝謝！","謝謝，我在這裡等","太好了，謝謝！"], kw:"bye",
              feedback:{ perfect:"說得很有禮貌！太棒了！", partial:"有說謝謝！" } })
          ]
        }
      ]
    },

    {
      id: "anti_scam", name: "接到詐騙電話", icon: "📱", available: true,
      theme: { color: '#DC2626', bg: '#FEE2E2', accent: '#B91C1C' },
      situations: [
        {
          id: "scam_prize", name: "中獎詐騙電話", icon: "🎁", clerkName: "陌生來電",
          desc: "接到說你中獎、要你先付錢的電話",
          steps: [
            mkStep({ id:"ask_who", say:"（電話響了，是陌生號碼）喂，恭喜你！你中了十萬元大獎！", task:"先問對方是誰",
              options:["你是誰？","太好了，我要領獎！","我的名字是…","好啊，錢給我"],
              accepted:["你是誰？","請問你是誰","你哪位","請問哪位"], kw:["誰","哪位"],
              feedback:{ failed:"先問清楚：「你是誰？」" } }),
            mkStep({ id:"refuse_fee", say:"我是抽獎中心的！只要先付三千元手續費，馬上把獎金匯給你！", task:"拒絕付手續費",
              options:["我不要付錢","好，我付手續費","要去哪裡付？","那我匯給你"],
              accepted:["我不要付錢","我不付","不給你錢","我不會付"], kw:["不要","不付","不給","不會付"],
              feedback:{ failed:"要領獎卻先要你付錢，是詐騙。可以說：「我不要付錢」" } }),
            mkStep({ id:"refuse_info", say:"別擔心，只要告訴我你的姓名和銀行帳號就好！", task:"拒絕給個人資料",
              options:["我不會給你資料","我的名字是…","帳號可以說給你","好，我告訴你"],
              accepted:["我不會給你資料","不能給你","我不告訴你","我不會說"], kw:["不會給","不能給","不告訴","不會說"],
              feedback:{ failed:"帳號和姓名不能給陌生人。可以說：「我不會給你資料」" } }),
            mkStep({ id:"hang_up", say:"機會難得，現在不辦就沒有了喔！", task:"說這是詐騙、要掛電話",
              options:["這是詐騙，我要掛電話了","再等我想一下","那我考慮看看","好啦不要生氣"],
              accepted:["這是詐騙，我要掛電話了","你是詐騙","我要掛了","我要掛電話"], kw:["詐騙","掛"],
              feedback:{ failed:"直接掛掉最安全。可以說：「這是詐騙，我要掛電話了」" } }),
            mkStep({ id:"tell_family", say:"（你掛掉了電話）接下來要做什麼？", task:"說要告訴家人或打 165",
              options:["我要告訴家人","再打回去問清楚","刪掉就好不用管","自己處理就好"],
              accepted:["我要告訴家人","告訴老師","跟大人說","我要打165","打165"], kw:["告訴","老師","家人","165","大人"],
              feedback:{ failed:"要告訴大人。可以說：「我要告訴家人」，或打反詐騙專線 165。" } }),
            mkStep({ id:"review", say:"（想一想）怎麼知道那是詐騙電話？", task:"說出判斷的理由",
              options:["先要錢的就是詐騙","中獎就是好運","對方很客氣應該是真的","有獎金就先領"],
              accepted:["先要錢的就是詐騙","先要錢就是詐騙","要先付錢就是詐騙"], kw:["先要錢","就是詐騙"],
              feedback:{ perfect:"答對了！中獎不用先付錢。", failed:"記住：中獎不用先付錢，先要錢的就是詐騙。" } }),
          ]
        },
        {
          id: "fake_service", name: "假客服電話", icon: "🎧", clerkName: "陌生來電",
          desc: "接到假客服說重複扣款、要你去 ATM 操作",
          steps: [
            mkStep({ id:"ask_who", say:"（電話響了）你好，這裡是網購客服，你的訂單重複扣款了！", task:"先問對方是誰",
              options:["你是誰？","真的嗎？怎麼辦","那要退我錢","訂單編號多少"],
              accepted:["你是誰？","請問你是誰","你哪位","請問哪位"], kw:["誰","哪位"],
              feedback:{ failed:"先問清楚：「你是誰？」" } }),
            mkStep({ id:"refuse_atm", say:"你現在去 ATM 按幾個鍵，就能解除扣款！", task:"說 ATM 不能解除扣款",
              options:["ATM 不能解除扣款","好，我去 ATM","ATM 在哪裡？","要按哪些鍵？"],
              accepted:["ATM 不能解除扣款","ATM不能解除","我不會去ATM","那不是真的"], kw:["不能","不會去","不是真的"],
              feedback:{ failed:"ATM 只能領錢存錢，不能解除扣款。可以說：「ATM 不能解除扣款」" } }),
            mkStep({ id:"hang_up", say:"再不去錢就被扣走了，快點！", task:"說這是詐騙、要掛電話",
              options:["這是詐騙，我要掛電話了","好啦我馬上去","先別扣我錢","我很緊張怎麼辦"],
              accepted:["這是詐騙，我要掛電話了","你是詐騙","我要掛了","我要掛電話"], kw:["詐騙","掛"],
              feedback:{ failed:"叫你緊張、快去 ATM 就是詐騙。可以說：「這是詐騙，我要掛電話了」" } }),
            mkStep({ id:"call_165", say:"（你掛掉了電話）要怎麼確認是不是詐騙？", task:"說要打 165 查證",
              options:["我要打 165 查證","再等他打來","上網查 ATM","算了不管了"],
              accepted:["我要打 165 查證","打165","我要打165問","打165查證"], kw:["165","查證"],
              feedback:{ failed:"有疑問就打反詐騙專線。可以說：「我要打 165 查證」" } }),
            mkStep({ id:"tell_family", say:"很好！還要做什麼？", task:"說要告訴家人",
              options:["我要告訴家人","自己知道就好","跟同學說就好","刪掉電話記錄"],
              accepted:["我要告訴家人","告訴老師","跟大人說","告訴大人"], kw:["告訴","老師","家人","大人"],
              feedback:{ failed:"要告訴大人。可以說：「我要告訴家人」" } }),
            mkStep({ id:"review", say:"（想一想）這種電話怎麼分辨？", task:"說出判斷的理由",
              options:["叫你去 ATM 操作的就是詐騙","客服電話都要聽","扣款就要馬上處理","按鍵解除很正常"],
              accepted:["叫你去 ATM 操作的就是詐騙","去ATM操作是詐騙","ATM不能解除扣款"], kw:["ATM","詐騙"],
              feedback:{ perfect:"答對了！叫你去 ATM 操作就是詐騙。", failed:"記住：真客服不會叫你去 ATM，叫你去 ATM 操作的就是詐騙。" } }),
          ]
        },
        {
          id: "lend_card", name: "借提款卡的電話", icon: "💳", clerkName: "陌生來電",
          desc: "有人打電話裝熟、要借你的提款卡（本系列最重要）",
          steps: [
            mkStep({ id:"ask_who", say:"（電話響了）欸，我是你朋友的朋友啦！", task:"先問對方是誰",
              options:["你是誰？","喔好啊什麼事","朋友的朋友喔","是哪個朋友"],
              accepted:["你是誰？","請問你是誰","你哪位","請問哪位"], kw:["誰","哪位"],
              feedback:{ failed:"先問清楚：「你是誰？」" } }),
            mkStep({ id:"refuse_card", say:"你的提款卡借我用一下，一天給你五百元！", task:"拒絕借提款卡",
              options:["提款卡不能借人","一天五百喔好啊","要用多久？","借你沒關係"],
              accepted:["提款卡不能借人","我不借你卡","提款卡不能借","不能借給你"], kw:["不能借","不借"],
              feedback:{ failed:"提款卡絕對不能借人。可以說：「提款卡不能借人」" } }),
            mkStep({ id:"refuse_lure", say:"兩天就還你，穩賺的啦！", task:"再次拒絕，不被利誘",
              options:["說不借就是不借","那好吧兩天喔","真的穩賺嗎？","那你先給錢"],
              accepted:["說不借就是不借","不借就是不借","我不會借","還是不借"], kw:["不借","不會借"],
              feedback:{ failed:"說幾次都不借。可以說：「說不借就是不借」" } }),
            mkStep({ id:"refuse_pin", say:"那你把提款卡密碼告訴我也行！", task:"拒絕給密碼",
              options:["密碼不能告訴別人","密碼是…","我想想看","那你要保密喔"],
              accepted:["密碼不能告訴別人","密碼不能說","我不會告訴你密碼","密碼不能給"], kw:["不能告訴","不能說","不會告訴","不能給"],
              feedback:{ failed:"密碼不能告訴任何人。可以說：「密碼不能告訴別人」" } }),
            mkStep({ id:"tell_teacher", say:"（你掛掉了電話）接下來要做什麼？", task:"說要告訴老師或家人",
              options:["我要告訴老師","下次再說","封鎖就好","自己記住就好"],
              accepted:["我要告訴老師","告訴家人","跟大人說","我要打165"], kw:["告訴","老師","家人","大人","165"],
              feedback:{ failed:"要告訴大人。可以說：「我要告訴老師」" } }),
            mkStep({ id:"review", say:"（想一想）為什麼不能借提款卡？", task:"說出理由",
              options:["借出帳戶會變成詐騙幫兇","朋友借用沒關係","反正有錢拿","借一下應該還好"],
              accepted:["借出帳戶會變成詐騙幫兇","會變成詐騙幫兇","提款卡不能借人"], kw:["幫兇","不能借","詐騙"],
              feedback:{ perfect:"答對了！借出帳戶會害自己變成詐騙幫兇。", failed:"記住：提款卡借出去，帳戶會被拿去詐騙，自己會變成幫兇。" } }),
          ]
        },
        {
          id: "buy_points", name: "要你買點數的電話", icon: "🎮", clerkName: "陌生來電",
          desc: "網友打電話要你幫買遊戲點數、唸卡號",
          steps: [
            mkStep({ id:"ask_who", say:"（電話響了）嗨，我是網路上認識你的朋友！", task:"先問對方是誰",
              options:["你是誰？","嗨你好啊","網路朋友喔","有什麼事嗎"],
              accepted:["你是誰？","請問你是誰","你哪位","請問哪位"], kw:["誰","哪位"],
              feedback:{ failed:"先問清楚：「你是誰？」" } }),
            mkStep({ id:"refuse_points", say:"幫我買遊戲點數，把卡號唸給我，我馬上還你錢！", task:"拒絕買點數",
              options:["我不會買點數給你","好啊卡號是…","要買多少？","先還我錢再說"],
              accepted:["我不會買點數給你","我不買點數","不會幫你買","我不要買"], kw:["不會買","不買","不要買","不會幫"],
              feedback:{ failed:"幫陌生人買點數、唸卡號就是被騙。可以說：「我不會買點數給你」" } }),
            mkStep({ id:"hang_up", say:"拜託啦很急！你不幫我就是不夠朋友！", task:"說這是詐騙、要掛電話",
              options:["這是詐騙，我要掛電話了","好啦別生氣","那我考慮","那買一點點"],
              accepted:["這是詐騙，我要掛電話了","你是詐騙","我要掛了","我要掛電話"], kw:["詐騙","掛"],
              feedback:{ failed:"用感情逼你買點數就是詐騙。可以說：「這是詐騙，我要掛電話了」" } }),
            mkStep({ id:"ask_family", say:"（你掛掉了電話）接下來要做什麼？", task:"說要先問家人",
              options:["我要先問家人","再想想看","自己決定就好","刪掉就好"],
              accepted:["我要先問家人","先問家人","告訴家人","跟大人說"], kw:["問家人","家人","大人","告訴"],
              feedback:{ failed:"不確定就先問大人。可以說：「我要先問家人」" } }),
            mkStep({ id:"review", say:"（想一想）這種要求怎麼分辨？", task:"說出判斷的理由",
              options:["電話裡要點數卡號的就是詐騙","網友都可以幫忙","買點數還錢很正常","朋友要幫忙"],
              accepted:["電話裡要點數卡號的就是詐騙","要點數卡號是詐騙","要卡號就是詐騙"], kw:["要點數","卡號"],
              feedback:{ perfect:"答對了！要你買點數、唸卡號就是詐騙。", failed:"記住：電話裡要你買點數、唸卡號的就是詐騙。" } }),
          ]
        }
      ]
    },

    {
      id: "classmate_borrow", name: "同學借錢", icon: "🤝", available: true,
      theme: { color: '#0891B2', bg: '#E0F2FE', accent: '#0E7490' },
      situations: [
        {
          id: "lend", name: "同學跟你借錢", icon: "💰", clerkName: "小傑",
          desc: "同學開口跟你借錢，練習怎麼處理",
          steps: [
            mkStep({ id:"ask_purpose", say:"欸，借我一百元買飲料啦！", task:"先問他要用來做什麼",
              options:["你要用來做什麼？","好啊借你一百","我沒錢啦","為什麼找我"],
              accepted:["你要用來做什麼？","你要做什麼","借錢做什麼","要買什麼"], kw:["做什麼","買什麼"],
              feedback:{ failed:"先問用途比較好。可以說：「你要用來做什麼？」" } }),
            mkStep({ id:"lend_less", say:"我想買飲料跟餅乾。", task:"說你只能借他二十元",
              options:["我只能借你二十元","好，一百給你","那不借了","你自己買"],
              accepted:["我只能借你二十元","我只有二十元可以借","只能借二十","借你二十元"], kw:["二十","只能借"],
              feedback:{ failed:"量力而為，借得起再借。可以說：「我只能借你二十元」" } }),
            mkStep({ id:"write_down", say:"好啦二十就二十。", task:"說要把它記下來",
              options:["我們把它記下來","不用記啦","隨便你","算了不借了"],
              accepted:["我們把它記下來","要記下來","把它記起來","記下來比較好"], kw:["記下來","記起來"],
              feedback:{ failed:"借錢要記帳才不會忘。可以說：「我們把它記下來」" } }),
            mkStep({ id:"set_date", say:"要記喔？好。", task:"約好星期五還",
              options:["你星期五還我好嗎？","什麼時候都可以","不用還沒關係","下次再說"],
              accepted:["你星期五還我好嗎？","星期五還我","星期五可以還嗎","禮拜五還我好嗎"], kw:["星期五","禮拜五"],
              feedback:{ failed:"要約好還錢的日子。可以說：「你星期五還我好嗎？」" } }),
            mkStep({ id:"confirm", say:"好，星期五還你。", task:"再確認一次約定",
              options:["說好了，星期五還","不用了拉倒","真的假的","隨便啦"],
              accepted:["說好了，星期五還","說好囉星期五","好，星期五","一言為定"], kw:["星期五","說好","一言為定"],
              feedback:{ failed:"確認一次更清楚。可以說：「說好了，星期五還」" } }),
            mkStep({ id:"review", say:"（想一想）借錢給同學要記得哪三件事？", task:"說出三件事",
              options:["問用途、記下來、約時間","有錢就借","不用記那麼多","看心情借"],
              accepted:["問用途、記下來、約時間","問用途記下來約時間","要問用途要記帳要約時間"], kw:["用途","記下來","約時間"],
              feedback:{ perfect:"答對了！問用途、記下來、約時間。", failed:"記住三件事：問用途、記下來、約時間。" } }),
          ]
        },
        {
          id: "ask_back", name: "開口要回來", icon: "🗣️", clerkName: "小傑",
          desc: "借出去的錢對方沒還，練習怎麼開口要回（最難）",
          steps: [
            mkStep({ id:"remind", say:"（星期五到了，小傑沒有還錢）", task:"提醒他借錢的事",
              options:["上星期借你的二十元，記得嗎？","算了不敢說","當作沒這回事","再等他久一點"],
              accepted:["上星期借你的二十元，記得嗎？","你還記得借二十元嗎","上次借你的錢記得嗎","記得跟我借二十元嗎"], kw:["借","二十","記得"],
              feedback:{ failed:"先提醒他。可以說：「上星期借你的二十元，記得嗎？」" } }),
            mkStep({ id:"ask_return", say:"喔對，我忘了！", task:"開口請他還錢",
              options:["可以還我了嗎？","沒關係不用還","那算了","下次再說"],
              accepted:["可以還我了嗎？","可以還我嗎","請還我錢","可以還錢了嗎"], kw:["還我","還錢"],
              feedback:{ failed:"要開口要回來。可以說：「可以還我了嗎？」" } }),
            mkStep({ id:"reschedule", say:"啊我今天沒帶錢…", task:"重新約明天還",
              options:["那你明天還我好嗎？","那就不用還了","你都沒帶喔算了","真的很煩耶"],
              accepted:["那你明天還我好嗎？","明天還我好嗎","那明天還我","可以明天還嗎"], kw:["明天","還我"],
              feedback:{ failed:"再約一個新日子。可以說：「那你明天還我好嗎？」" } }),
            mkStep({ id:"seek_help", say:"明天再說啦…（他一直拖）", task:"提議一起去跟老師說",
              options:["我們去跟老師說","那我不管了","一直被拖延","那就算了吧"],
              accepted:["我們去跟老師說","去跟老師說","我們找老師","跟老師講"], kw:["老師","找老師"],
              feedback:{ failed:"一直拖就找老師幫忙。可以說：「我們去跟老師說」" } }),
            mkStep({ id:"review", say:"（想一想）要回自己借出去的錢，對不對？", task:"說出你的想法",
              options:["要回自己的錢不是壞事","要錢很不好意思","算了當作送他","朋友不能要錢"],
              accepted:["要回自己的錢不是壞事","要回自己的錢是對的","要自己的錢沒有錯"], kw:["自己的錢","不是壞事","沒有錯","對的"],
              feedback:{ perfect:"答對了！要回自己的錢一點也沒錯。", failed:"記住：要回自己借出去的錢，不是壞事。" } }),
          ]
        },
        {
          id: "refuse", name: "拒絕借錢", icon: "🚫", clerkName: "小傑",
          desc: "不想借、也借不起時，練習好好拒絕",
          steps: [
            mkStep({ id:"refuse", say:"（小傑這星期第三次來借）欸，再借我五十元啦！", task:"拒絕，說沒有多的錢",
              options:["我沒有多的錢","好啦再借你","那你要還喔","五十有點多"],
              accepted:["我沒有多的錢","我沒有錢可以借","我沒有多餘的錢","我自己也不夠"], kw:["沒有","不夠"],
              feedback:{ failed:"可以誠實拒絕。可以說：「我沒有多的錢」" } }),
            mkStep({ id:"hold_firm", say:"你不借我就不是朋友了！", task:"堅定拒絕，不被情緒勒索",
              options:["我真的不能借你","好啦別生氣","那借一點點","不然你別不高興"],
              accepted:["我真的不能借你","真的不能借","我不能借你","還是不能借"], kw:["不能借","不借"],
              feedback:{ failed:"用這句話威脅你就更不該借。可以說：「我真的不能借你」" } }),
            mkStep({ id:"alternative", say:"那我怎麼辦啦…", task:"給他替代辦法：去問老師",
              options:["你可以去問老師","不然去借別人","我也沒辦法","你自己想辦法"],
              accepted:["你可以去問老師","去問老師","可以找老師幫忙","去跟老師說"], kw:["老師"],
              feedback:{ failed:"給他一個好方向。可以說：「你可以去問老師」" } }),
            mkStep({ id:"review", say:"（想一想）拒絕借錢，還能當好朋友嗎？", task:"說出你的想法",
              options:["拒絕借錢也可以是好朋友","不借就是壞朋友","借了才是好朋友","不借會沒朋友"],
              accepted:["拒絕借錢也可以是好朋友","拒絕借錢也是好朋友","不借也可以是朋友"], kw:["拒絕借錢","也可以"],
              feedback:{ perfect:"答對了！拒絕借錢也可以是好朋友。", failed:"記住：拒絕借錢，也可以是好朋友。" } }),
          ]
        }
      ]
    },

    {
      id: "online_scam", name: "網路詐騙", icon: "💻", available: true,
      theme: { color: '#EA580C', bg: '#FFEDD5', accent: '#C2410C' },
      situations: [
        {
          id: "fake_sale", name: "假網拍先匯款", icon: "🛒", clerkName: "陌生賣家",
          desc: "網路賣家超便宜、要你先匯款",
          steps: [
            mkStep({ id:"ask_who", say:"（有人私訊你）哈囉！這支手機全新只要兩千，超便宜！", task:"先問對方是誰",
              options:["你是誰？","好便宜我要買","怎麼匯款給你","兩千好划算"],
              accepted:["你是誰？","請問你是誰","你哪位","這是誰"], kw:["誰","哪位"],
              feedback:{ failed:"先問清楚：「你是誰？」" } }),
            mkStep({ id:"refuse_prepay", say:"你先匯款到這個帳戶，我馬上寄給你！", task:"拒絕先匯款",
              options:["我不要先匯款","好，我馬上匯","帳號給我","先匯一半好嗎"],
              accepted:["我不要先匯款","不要先匯款","我不先匯錢","不能先匯款"], kw:["不要先匯","不先匯","不能先匯"],
              feedback:{ failed:"沒收到東西不能先付錢。可以說：「我不要先匯款」" } }),
            mkStep({ id:"ask_meet", say:"現在不買就被別人搶走了喔！", task:"提議面交（當面交易）",
              options:["可以面交嗎？","那我趕快匯","好啦先匯款","再便宜一點"],
              accepted:["可以面交嗎？","我要面交","面交比較安全","可以當面交易嗎"], kw:["面交","當面"],
              feedback:{ failed:"當面一手交錢一手交貨最安全。可以說：「可以面交嗎？」" } }),
            mkStep({ id:"walk_away", say:"面交太麻煩了啦，先匯款比較快！", task:"太可疑就不要買",
              options:["太便宜怪怪的，我不買","那好吧我匯","那算了先匯","再想想"],
              accepted:["太便宜怪怪的，我不買","太便宜有問題我不買","怪怪的我不買","我不買了"], kw:["不買","怪怪"],
              feedback:{ failed:"不肯面交又急著要你匯款，很可疑。可以說：「太便宜怪怪的，我不買」" } }),
            mkStep({ id:"review", say:"（想一想）網路買東西要小心什麼？", task:"說出判斷的理由",
              options:["叫你先匯款的要小心","便宜就先買","匯款最快","賣家說的都對"],
              accepted:["叫你先匯款的要小心","先匯款要小心","叫你先匯款是詐騙"], kw:["先匯款","要小心"],
              feedback:{ perfect:"答對了！叫你先匯款的要特別小心。", failed:"記住：沒面交就叫你先匯款的，要特別小心。" } }),
          ]
        },
        {
          id: "fake_link", name: "中獎簡訊點連結", icon: "📩", clerkName: "陌生訊息",
          desc: "手機收到中獎簡訊、要你點連結",
          steps: [
            mkStep({ id:"read", say:"（我的手機收到一封中獎簡訊，上面寫著：恭喜你中獎了，點這個連結就能領獎品！）", task:"判斷這是不是真的",
              options:["這可能是詐騙","太好了我點","中什麼獎？","趕快點連結"],
              accepted:["這可能是詐騙","可能是詐騙","這是詐騙","應該是詐騙"], kw:["詐騙"],
              feedback:{ failed:"沒參加抽獎卻中獎，很可疑。可以說：「這可能是詐騙」" } }),
            mkStep({ id:"no_click", say:"（簡訊又傳來催促：快點這個連結，不然獎品就沒了！）", task:"拒絕點連結",
              options:["我不會點這個連結","好我點看看","連結在哪","點了會怎樣"],
              accepted:["我不會點這個連結","我不點連結","不會點連結","我不點"], kw:["不會點","不點"],
              feedback:{ failed:"陌生連結不要點。可以說：「我不會點這個連結」" } }),
            mkStep({ id:"no_info", say:"（那連結會叫你輸入帳號密碼）", task:"拒絕輸入帳號密碼",
              options:["我不輸入帳號密碼","輸入就輸入","密碼要打哪","帳號給它"],
              accepted:["我不輸入帳號密碼","不輸入密碼","我不會輸入","帳號密碼不能給"], kw:["不輸入","不會輸入","不能給"],
              feedback:{ failed:"帳號密碼絕對不能輸入給陌生網站。可以說：「我不輸入帳號密碼」" } }),
            mkStep({ id:"ask_family", say:"這種簡訊該怎麼辦？", task:"說要問家人",
              options:["我要問家人","點連結看看","回覆這封簡訊","輸入資料領獎"],
              accepted:["我要問家人","問家人","告訴家人","跟大人說"], kw:["問家人","家人","大人","告訴"],
              feedback:{ failed:"不確定就問大人。可以說：「我要問家人」" } }),
            mkStep({ id:"review", say:"（想一想）這種中獎簡訊怎麼分辨？", task:"說出判斷的理由",
              options:["要點連結的中獎是詐騙","中獎都是真的","有連結就點","領獎要輸密碼"],
              accepted:["要點連結的中獎是詐騙","中獎要點連結是詐騙","要點連結就是詐騙"], kw:["點連結","詐騙"],
              feedback:{ perfect:"答對了！要你點連結的中獎簡訊就是詐騙。", failed:"記住：要你點連結、輸帳密的中獎簡訊就是詐騙。" } }),
          ]
        }
      ]
    },

    {
      id: "self_protect", name: "保護自己的錢", icon: "🛡️", available: true,
      theme: { color: '#0D9488', bg: '#CCFBF1', accent: '#0F766E' },
      situations: [
        {
          id: "extortion", name: "被勒索要錢", icon: "🚫", clerkName: "安全小老師",
          desc: "有人威脅你、逼你給錢時怎麼辦（最重要）",
          steps: [
            mkStep({ id:"refuse", say:"假裝有人凶你說：「不給錢就打你！」——你會怎麼回答？", task:"拒絕，不給錢",
              options:["我不會給你錢","好啦我給你","給多少才夠","不要打我，錢給你"],
              accepted:["我不會給你錢","我不給你錢","不給你錢","我不會給"], kw:["不會給","不給"],
              feedback:{ failed:"被威脅也不能給錢。可以說：「我不會給你錢」" } }),
            mkStep({ id:"seek_help", say:"他還是一直威脅你，你要怎麼做？", task:"說要告訴老師",
              options:["我要告訴老師","那我給他","自己想辦法","我不敢說"],
              accepted:["我要告訴老師","告訴老師","跟老師說","告訴家人"], kw:["告訴","老師","家人"],
              feedback:{ failed:"一定要說出來、找大人幫忙。可以說：「我要告訴老師」" } }),
            mkStep({ id:"principle", say:"被威脅要錢，最重要的是什麼？", task:"說出最重要的一件事",
              options:["一定要告訴大人","自己解決就好","忍一忍就好","給錢了事"],
              accepted:["一定要告訴大人","要告訴大人","一定要說出來"], kw:["告訴大人","說出來"],
              feedback:{ failed:"最重要的是告訴大人，不要自己扛。可以說：「一定要告訴大人」" } }),
            mkStep({ id:"review", say:"（想一想）被勒索為什麼不能自己忍？", task:"說出理由",
              options:["忍會被一直勒索","忍就沒事了","給錢最快","不關別人的事"],
              accepted:["忍會被一直勒索","一直忍會被一直要","忍會被一直要錢"], kw:["一直勒索","一直要"],
              feedback:{ perfect:"答對了！忍下來只會被一直勒索。", failed:"記住：忍下來會被一直勒索，一定要告訴大人。" } }),
          ]
        },
        {
          id: "keep_safe", name: "保管好自己的錢", icon: "🔒", clerkName: "安全小老師",
          desc: "平常怎麼收好錢、保密密碼、撿到錢怎麼辦",
          steps: [
            mkStep({ id:"hide_money", say:"出門帶很多錢，被別人看到了，怎麼辦？", task:"說錢要收好、不露白",
              options:["錢要收好不露白","拿出來炫耀","借給別人看","放桌上就好"],
              accepted:["錢要收好不露白","錢要收好","把錢收好","不要露白"], kw:["收好","露白"],
              feedback:{ failed:"錢不要露出來給人看。可以說：「錢要收好不露白」" } }),
            mkStep({ id:"pin_secret", say:"有人要看你的提款卡密碼，你會說？", task:"拒絕給密碼",
              options:["密碼不能給別人看","好啊我給你看","密碼是…","給你看一下"],
              accepted:["密碼不能給別人看","密碼不能給","密碼不能說","密碼要保密"], kw:["不能給","不能說","保密"],
              feedback:{ failed:"密碼不能給任何人看。可以說：「密碼不能給別人看」" } }),
            mkStep({ id:"found_money", say:"你在地上撿到別人的錢，怎麼辦？", task:"說要交給老師",
              options:["交給老師","自己收起來","拿去買東西","分給同學"],
              accepted:["交給老師","拿給老師","交給大人","還給失主"], kw:["交給","老師","大人","失主"],
              feedback:{ failed:"撿到的錢不是自己的，要交出去。可以說：「交給老師」" } }),
            mkStep({ id:"review", say:"（想一想）保護自己的錢有哪些方法？", task:"說出方法",
              options:["收好、密碼保密、撿到交出去","有錢就炫耀","密碼給朋友","撿到自己留"],
              accepted:["收好、密碼保密、撿到交出去","錢收好密碼保密撿到交出去","要收好要保密要交出去"], kw:["收好","保密"],
              feedback:{ perfect:"答對了！收好、密碼保密、撿到交出去。", failed:"記住：錢要收好、密碼要保密、撿到別人的要交出去。" } }),
          ]
        }
      ]
    },

    {
      id: "job_scam", name: "打工陷阱", icon: "💼", available: true,
      theme: { color: '#D97706', bg: '#FEF3C7', accent: '#B45309' },
      situations: [
        {
          id: "pay_deposit", name: "要先繳保證金", icon: "💰", clerkName: "可疑老闆",
          desc: "應徵打工，老闆說要先繳保證金才能上班",
          steps: [
            mkStep({ id:"ask_detail", say:"（你去應徵打工）你好啊！我們這裡時薪很高，馬上可以上班！", task:"先問工作內容",
              options:["請問工作內容是什麼？","太好了馬上上班","時薪多少？先說","好，我要做"],
              accepted:["請問工作內容是什麼？","工作內容是什麼","請問要做什麼","要做什麼工作"], kw:["內容","做什麼"],
              feedback:{ failed:"先問清楚要做什麼。可以說：「請問工作內容是什麼？」" } }),
            mkStep({ id:"refuse_deposit", say:"都很簡單啦！不過要先繳三千元保證金，才能開始上班喔！", task:"拒繳保證金",
              options:["我不會先繳錢","好，我繳三千","可以分期繳嗎？","繳了馬上上班嗎"],
              accepted:["我不會先繳錢","我不繳錢","我不會繳","不繳保證金"], kw:["不繳","不會繳","不會先繳"],
              feedback:{ failed:"正當工作不會先要你繳錢。可以說：「我不會先繳錢」" } }),
            mkStep({ id:"say_reason", say:"這是規定啦！每個人都要繳，做滿一個月就退你！", task:"說出理由：正當工作不用先繳錢",
              options:["正當的工作不用先繳錢","規定就沒辦法了","做滿一個月喔，好","那可以先繳一半嗎"],
              accepted:["正當的工作不用先繳錢","正當工作不用繳錢","工作不用先繳錢"], kw:["正當","不用先繳"],
              feedback:{ failed:"記住這句：「正當的工作不用先繳錢」" } }),
            mkStep({ id:"leave_ask", say:"你不繳就不能上班，機會給別人囉！", task:"說要回家問家人再決定",
              options:["我要回家問家人再決定","好啦好啦我繳","不要給別人，等我","那我借錢來繳"],
              accepted:["我要回家問家人再決定","回家問家人","我要先問家人","先問過家人"], kw:["問家人","問大人","問過家人"],
              feedback:{ failed:"先離開，回家問大人。可以說：「我要回家問家人再決定」" } }),
            mkStep({ id:"review", say:"（想一想）怎麼分辨打工陷阱？", task:"說出判斷的理由",
              options:["上班前先要錢的就是陷阱","繳保證金很正常","時薪高就趕快做","老闆人好就可以"],
              accepted:["上班前先要錢的就是陷阱","先要錢的工作是陷阱","先繳錢的打工是陷阱"], kw:["先要錢","陷阱"],
              feedback:{ perfect:"答對了！上班前先要你繳錢的就是陷阱。", failed:"記住：還沒上班就先要你繳錢的，就是打工陷阱。" } }),
          ]
        },
        {
          id: "keep_id", name: "要押證件", icon: "🪪", clerkName: "可疑老闆",
          desc: "老闆說要把身分證押在店裡才能打工",
          steps: [
            mkStep({ id:"refuse_id", say:"來上班可以，先把你的身分證押在我這裡！", task:"拒絕押證件",
              options:["證件不能押給別人","好，證件給你","只押健保卡可以嗎","押幾天就好？"],
              accepted:["證件不能押給別人","我不會押證件","證件不能給你","身分證不能給別人"], kw:["不能押","不會押","不能給"],
              feedback:{ failed:"證件不能押給任何人。可以說：「證件不能押給別人」" } }),
            mkStep({ id:"refuse_copy", say:"那影印一份留著總可以吧？快點啦！", task:"說要先問家人",
              options:["我要先問家人","影印應該沒關係","好啊你去印","印完要還我喔"],
              accepted:["我要先問家人","先問家人","我要問過大人","問過家人再說"], kw:["問家人","問大人","問過家人","問過大人"],
              feedback:{ failed:"證件影本也可能被拿去亂用。可以說：「我要先問家人」" } }),
            mkStep({ id:"why_danger", say:"（想一想）證件被別人拿走會怎麼樣？", task:"說出危險",
              options:["會被拿去辦門號或借錢","沒什麼關係","放老闆那比較安全","可以換高時薪"],
              accepted:["會被拿去辦門號或借錢","被拿去亂用","會被冒用"], kw:["辦門號","冒用","亂用"],
              feedback:{ failed:"證件會被拿去辦門號、借錢。記住：證件不離身。" } }),
            mkStep({ id:"tell_family", say:"如果已經把證件給出去了，要怎麼辦？", task:"說要馬上告訴家人",
              options:["馬上告訴家人想辦法拿回來","等老闆自己還","下次再去拿","不敢說，算了"],
              accepted:["馬上告訴家人想辦法拿回來","馬上告訴家人","趕快告訴大人","告訴家人拿回來"], kw:["告訴家人","告訴大人"],
              feedback:{ failed:"越早說越好處理。可以說：「馬上告訴家人想辦法拿回來」" } }),
            mkStep({ id:"review", say:"（想一想）打工時證件怎麼保護？", task:"說出方法",
              options:["證件不押不借，只給看不給拿","老闆要就給","押證件換工作值得","影本可以隨便給"],
              accepted:["證件不押不借，只給看不給拿","證件不押不借","不押也不借"], kw:["不押","不借"],
              feedback:{ perfect:"答對了！證件不押、不借，只給看、不給拿。", failed:"記住：證件不押、不借，只給看、不給拿。" } }),
          ]
        },
        {
          id: "too_good", name: "輕鬆高薪的工作", icon: "🤑", clerkName: "陌生網友",
          desc: "網路上看到「日領三千、超輕鬆」的打工訊息",
          steps: [
            mkStep({ id:"ask_what", say:"（網路訊息）同學看過來！日領三千、工作超輕鬆，要做嗎？", task:"先問要做什麼",
              options:["請問要做什麼工作？","要！馬上做","日領三千真好","在哪裡上班？"],
              accepted:["請問要做什麼工作？","要做什麼工作","工作內容是什麼"], kw:["做什麼","內容"],
              feedback:{ failed:"先問清楚。可以說：「請問要做什麼工作？」" } }),
            mkStep({ id:"refuse_account", say:"超簡單！只要提供你的銀行帳戶收錢，再領出來交給我們就好！", task:"拒絕提供帳戶",
              options:["帳戶不能給別人用","好簡單，我要做","要收多少錢？","領出來交給誰？"],
              accepted:["帳戶不能給別人用","我不會給帳戶","帳戶不能借人","不給帳戶"], kw:["帳戶不能","不給帳戶","不會給"],
              feedback:{ failed:"帳戶借人收錢＝當詐騙車手。可以說：「帳戶不能給別人用」" } }),
            mkStep({ id:"say_illegal", say:"這不違法啦，大家都在做，錢很好賺！", task:"說這是違法的車手工作",
              options:["這是車手，是違法的","大家都做那就好","賺一次就好","錢好賺就做吧"],
              accepted:["這是車手，是違法的","這是違法的","這是車手","幫領錢是違法的"], kw:["車手","違法"],
              feedback:{ failed:"幫詐團收錢領錢＝車手，會被警察抓。可以說：「這是車手，是違法的」" } }),
            mkStep({ id:"block_tell", say:"考慮一下嘛，缺錢的時候很好用喔！", task:"說要封鎖並告訴大人",
              options:["我要封鎖你並告訴大人","先留著以後說","缺錢再來找你","不回覆就好"],
              accepted:["我要封鎖你並告訴大人","封鎖並告訴大人","封鎖你告訴家人","我要告訴大人"], kw:["封鎖","告訴"],
              feedback:{ failed:"封鎖＋告訴大人。可以說：「我要封鎖你並告訴大人」" } }),
            mkStep({ id:"review", say:"（想一想）「錢多事少」的打工訊息怎麼判斷？", task:"說出判斷的理由",
              options:["太好賺的工作就是陷阱","運氣好遇到好工作","先做做看再說","日領現金比較好"],
              accepted:["太好賺的工作就是陷阱","太好賺就是陷阱","錢多事少是陷阱"], kw:["太好賺","陷阱"],
              feedback:{ perfect:"答對了！太好賺的工作就是陷阱。", failed:"記住：錢多、事少、快領現——太好賺的工作就是陷阱。" } }),
          ]
        }
      ]
    },

    {
      id: "privacy_protect", name: "保護個人資料", icon: "🔐", available: true,
      theme: { color: '#4F46E5', bg: '#E0E7FF', accent: '#3730A3' },
      situations: [
        {
          id: "otp_code", name: "要驗證碼的電話", icon: "📲", clerkName: "陌生來電",
          desc: "有人打來說要你唸手機收到的驗證碼",
          steps: [
            mkStep({ id:"ask_who", say:"（電話響了）你好！我是電信客服，系統出錯，需要你的協助！", task:"先問對方是誰",
              options:["你是誰？","好，要怎麼幫忙","系統出錯喔","我的手機沒壞"],
              accepted:["你是誰？","請問你是誰","你哪位","請問哪位"], kw:["誰","哪位"],
              feedback:{ failed:"先問清楚：「你是誰？」" } }),
            mkStep({ id:"refuse_code", say:"等一下你手機會收到六位數字的簡訊，唸給我聽就好！", task:"拒絕唸驗證碼",
              options:["驗證碼不能給別人","好，我唸給你","收到了，數字是…","等一下喔我看看"],
              accepted:["驗證碼不能給別人","驗證碼不能說","我不會唸給你","不能告訴你"], kw:["驗證碼不能","不會唸","不能告訴"],
              feedback:{ failed:"驗證碼＝錢包鑰匙。可以說：「驗證碼不能給別人」" } }),
            mkStep({ id:"hang_up", say:"不給的話你的手機門號會被停用喔，快點！", task:"說這是詐騙、要掛電話",
              options:["這是詐騙，我要掛電話了","不要停我門號","好啦我唸","要停多久？"],
              accepted:["這是詐騙，我要掛電話了","你是詐騙","我要掛了","我要掛電話"], kw:["詐騙","掛"],
              feedback:{ failed:"催你快一點的就是詐騙。可以說：「這是詐騙，我要掛電話了」" } }),
            mkStep({ id:"tell_family", say:"（你掛掉了電話）接下來要做什麼？", task:"說要告訴家人",
              options:["我要告訴家人","不用說沒關係","把簡訊刪掉就好","打回去罵他"],
              accepted:["我要告訴家人","告訴老師","跟大人說","告訴大人"], kw:["告訴","家人","老師","大人"],
              feedback:{ failed:"要告訴大人。可以說：「我要告訴家人」" } }),
            mkStep({ id:"review", say:"（想一想）為什麼驗證碼不能唸給別人？", task:"說出理由",
              options:["有驗證碼就能把錢轉走","唸一次沒關係","客服要就要給","數字而已不重要"],
              accepted:["有驗證碼就能把錢轉走","驗證碼能轉走錢","別人會把錢轉走"], kw:["轉走","驗證碼"],
              feedback:{ perfect:"答對了！驗證碼一給，錢就可能被轉走。", failed:"記住：驗證碼是錢包鑰匙，唸給別人＝把鑰匙交出去。" } }),
          ]
        },
        {
          id: "street_survey", name: "填問卷送禮物", icon: "📋", clerkName: "問卷人員",
          desc: "路上有人請你填問卷送小禮物，要寫電話和身分證字號",
          steps: [
            mkStep({ id:"ask_purpose", say:"同學你好～填個問卷就送可愛小禮物喔！", task:"先問問卷用途",
              options:["請問這是做什麼用的？","好啊禮物給我","要填多久？","禮物是什麼？"],
              accepted:["請問這是做什麼用的？","這是做什麼的","做什麼用途","問卷做什麼用"], kw:["做什麼","用途"],
              feedback:{ failed:"先問用途。可以說：「請問這是做什麼用的？」" } }),
            mkStep({ id:"refuse_fill", say:"就是市場調查啦！這裡填名字、電話，還有身分證字號～", task:"拒絕填個資",
              options:["個人資料我不能填","好，我填","只填名字可以嗎","電話是零九…"],
              accepted:["個人資料我不能填","我不能填個資","個資不能給","我不填資料"], kw:["不能填","不填","個資不能"],
              feedback:{ failed:"電話、身分證字號是重要個資。可以說：「個人資料我不能填」" } }),
            mkStep({ id:"refuse_gift", say:"不填就沒有禮物囉，很可愛耶！", task:"拒絕，說不用禮物",
              options:["沒關係，我不用禮物","那好吧我填","禮物先給我再填","填假的可以嗎"],
              accepted:["沒關係，我不用禮物","我不用禮物","不用了謝謝","我不需要禮物"], kw:["不用禮物","不需要","不用了"],
              feedback:{ failed:"小禮物換個資不值得。可以說：「沒關係，我不用禮物」" } }),
            mkStep({ id:"review", say:"（想一想）個資給出去會怎麼樣？", task:"說出危險",
              options:["會接到詐騙電話或被冒用","沒什麼影響","換到禮物就好","大家都在填"],
              accepted:["會接到詐騙電話或被冒用","會被詐騙","會被冒用","被拿去亂用"], kw:["詐騙","冒用","亂用"],
              feedback:{ perfect:"答對了！個資外流會接到詐騙電話、被冒用。", failed:"記住：個資給出去，可能被詐騙、被冒用。" } }),
          ]
        },
        {
          id: "share_password", name: "朋友要借帳號密碼", icon: "🎮", clerkName: "同學",
          desc: "同學想跟你借遊戲帳號和密碼",
          steps: [
            mkStep({ id:"refuse_pw", say:"欸～你的遊戲帳號借我玩，密碼跟我說一下！", task:"拒絕給密碼",
              options:["密碼不能告訴別人","好啊密碼是…","你保證不亂用喔","只借你一天喔"],
              accepted:["密碼不能告訴別人","密碼不能給","我不會給密碼","密碼不能說"], kw:["密碼不能","不會給"],
              feedback:{ failed:"好朋友也不能給密碼。可以說：「密碼不能告訴別人」" } }),
            mkStep({ id:"offer_alt", say:"小氣耶！我們不是好朋友嗎？", task:"友善拒絕＋提替代方案",
              options:["我們可以一起玩，但密碼不能給","好啦別生氣，給你","那我改密碼再借你","你用我的手機玩，密碼我自己按"],
              accepted:["我們可以一起玩，但密碼不能給","可以一起玩但密碼不能給","一起玩但不給密碼"], kw:["一起玩","不能給"],
              feedback:{ failed:"拒絕也可以友善。可以說：「我們可以一起玩，但密碼不能給」" } }),
            mkStep({ id:"why_risk", say:"（想一想）帳號密碼借朋友會有什麼問題？", task:"說出風險",
              options:["帳號可能被亂用還要不回來","朋友借一下沒關係","再申請新的就好","沒差反正免費"],
              accepted:["帳號可能被亂用還要不回來","會被亂用","帳號會被拿走","可能被盜用"], kw:["亂用","拿走","盜用"],
              feedback:{ failed:"帳號被亂用、要不回來都很麻煩。記住：密碼只有自己和家人知道。" } }),
            mkStep({ id:"review", say:"（想一想）密碼可以告訴誰？", task:"說出正確對象",
              options:["只有自己和家人知道","好朋友可以","老師同學都可以","寫在課本上就好"],
              accepted:["只有自己和家人知道","自己和家人","只有家人"], kw:["自己","家人"],
              feedback:{ perfect:"答對了！密碼只有自己和家人知道。", failed:"記住：密碼只有自己和家人知道，其他人都不行。" } }),
          ]
        }
      ]
    },

    {
      id: "take_bus", name: "搭公車", icon: "🚌", available: true,
      theme: { color: '#059669', bg: '#D1FAE5', accent: '#047857' },
      situations: [
        {
          id: "bus_basic", name: "基本搭車", icon: "🚌", clerkName: "公車司機",
          desc: "上車確認路線、刷卡付車資、請司機提醒下車",
          steps: [
            mkStep({ id:"ask_route", say:"（公車來了，車門打開）你好！", task:"問司機有沒有到目的地",
              options:["請問有到火車站嗎？","司機好帥","我要坐車","多少錢啊"],
              accepted:["請問有到火車站嗎？","有到火車站嗎","請問這班有到火車站嗎"], kw:["有到","火車站"],
              feedback:{ failed:"先確認路線再上車。可以說：「請問有到火車站嗎？」" } }),
            mkStep({ id:"pay_fare", say:"有喔！上車請刷卡或投現15元！", task:"說要刷卡",
              options:["好，我刷卡","太貴了不搭了","先讓我坐下再說","你先開車"],
              accepted:["好，我刷卡","我要刷卡","我刷卡"], kw:["刷卡"],
              feedback:{ failed:"上車要付車資。可以說：「好，我刷卡」" } }),
            mkStep({ id:"ask_remind", say:"嗶！（刷卡成功）找位子坐好喔！", task:"請司機到站提醒",
              options:["請問到火車站可以提醒我嗎？","到了我自己知道","你記得叫我喔","我站這裡就好"],
              accepted:["請問到火車站可以提醒我嗎？","到站可以提醒我嗎","可以提醒我下車嗎"], kw:["提醒"],
              feedback:{ failed:"怕坐過站可以先請司機幫忙。可以說：「請問到火車站可以提醒我嗎？」" } }),
            mkStep({ id:"thank_driver", say:"沒問題，到站我叫你！", task:"跟司機道謝",
              options:["謝謝司機！","應該的吧","嗯","快開車吧"],
              accepted:["謝謝司機！","謝謝","謝謝你"], kw:["謝謝"],
              feedback:{ failed:"別人幫忙要道謝。可以說：「謝謝司機！」" } }),
            mkStep({ id:"review", say:"（想一想）上公車的順序是什麼？", task:"說出順序",
              options:["先確認路線，上車刷卡，需要幫忙先說","上車再說有沒有到","先搶位子坐","下車的時候再付錢也可以"],
              accepted:["先確認路線，上車刷卡，需要幫忙先說","先確認路線再刷卡","確認路線、刷卡、請司機提醒"], kw:["確認路線","刷卡"],
              feedback:{ perfect:"答對了！先確認路線、上車刷卡、需要幫忙先說。", failed:"記住：先確認路線，上車刷卡，需要幫忙先跟司機說。" } }),
          ]
        },
        {
          id: "bus_no_change", name: "零錢不夠", icon: "💸", clerkName: "公車司機",
          desc: "投現才發現零錢不夠時，誠實跟司機說",
          steps: [
            mkStep({ id:"tell_driver", say:"上車請投現15元喔！", task:"誠實說零錢不夠",
              options:["不好意思，我的零錢不夠","假裝投了就好","那我用跑的","（默默站著不說話）"],
              accepted:["不好意思，我的零錢不夠","我零錢不夠","零錢不夠"], kw:["零錢不夠","不夠"],
              feedback:{ failed:"錢不夠要誠實說。可以說：「不好意思，我的零錢不夠」" } }),
            mkStep({ id:"ask_card", say:"喔喔，那你有悠遊卡嗎？", task:"問可不可以刷卡",
              options:["有，請問可以刷卡嗎？","沒有不行嗎","你借我錢","我下車好了"],
              accepted:["有，請問可以刷卡嗎？","可以刷卡嗎","我刷卡可以嗎"], kw:["刷卡"],
              feedback:{ failed:"可以改用刷卡。可以說：「有，請問可以刷卡嗎？」" } }),
            mkStep({ id:"thank_ok", say:"可以啊，刷卡就好！", task:"道謝",
              options:["謝謝司機！","好險","嚇死我了","早說嘛"],
              accepted:["謝謝司機！","謝謝","謝謝你"], kw:["謝謝"],
              feedback:{ failed:"可以說：「謝謝司機！」" } }),
            mkStep({ id:"review", say:"（想一想）搭車前要準備什麼？", task:"說出準備",
              options:["先準備好零錢或票卡","上車再想辦法","跟別人借就好","用走的就不用帶"],
              accepted:["先準備好零錢或票卡","準備好零錢或悠遊卡","先準備零錢"], kw:["準備","零錢"],
              feedback:{ perfect:"答對了！出門前先準備好零錢或票卡。", failed:"記住：搭車前先準備好零錢或票卡。" } }),
          ]
        },
        {
          id: "bus_miss_stop", name: "坐過站了", icon: "😳", clerkName: "公車司機",
          desc: "發現坐過站，不慌張向司機求助",
          steps: [
            mkStep({ id:"tell_miss", say:"（糟糕，窗外的站牌好像過了！）", task:"跟司機說坐過站了",
              options:["司機不好意思，我坐過站了","（不敢說，繼續搭）","怎麼辦怎麼辦","都是公車開太快"],
              accepted:["司機不好意思，我坐過站了","我坐過站了","坐過站了怎麼辦"], kw:["坐過站"],
              feedback:{ failed:"坐過站不用怕，先說出來。可以說：「司機不好意思，我坐過站了」" } }),
            mkStep({ id:"ask_back", say:"沒關係！下一站下車就可以了。", task:"問下車後怎麼回去",
              options:["請問下車後怎麼走回去？","那我跳下去","算了我搭到終點","不管了啦"],
              accepted:["請問下車後怎麼走回去？","怎麼走回去","下車後怎麼回去"], kw:["怎麼走","怎麼回去"],
              feedback:{ failed:"問清楚回程。可以說：「請問下車後怎麼走回去？」" } }),
            mkStep({ id:"confirm_back", say:"對面搭回程的車，坐兩站就到了！", task:"複誦確認",
              options:["好，對面搭回程，坐兩站","喔","隨便啦","太複雜了"],
              accepted:["好，對面搭回程，坐兩站","對面搭回程坐兩站","對面搭車坐兩站"], kw:["對面","兩站"],
              feedback:{ failed:"聽完覆述一次不會忘。可以說：「好，對面搭回程，坐兩站」" } }),
            mkStep({ id:"thank_bye", say:"聰明！下一站到囉！", task:"道謝下車",
              options:["謝謝司機，再見！","終於","下次不搭了","嗯嗯"],
              accepted:["謝謝司機，再見！","謝謝司機","謝謝再見"], kw:["謝謝"],
              feedback:{ failed:"可以說：「謝謝司機，再見！」" } }),
            mkStep({ id:"review", say:"（想一想）坐過站怎麼辦？", task:"說出方法",
              options:["不慌張，馬上告訴司機","坐回總站再說","偷偷下車","怪司機沒提醒"],
              accepted:["不慌張，馬上告訴司機","不慌張告訴司機","馬上告訴司機"], kw:["告訴司機"],
              feedback:{ perfect:"答對了！不慌張，馬上告訴司機。", failed:"記住：坐過站不慌張，馬上告訴司機想辦法。" } }),
          ]
        }
      ]
    },

    {
      id: "mrt_station", name: "捷運站", icon: "🚇", available: true,
      theme: { color: '#0284C7', bg: '#E0F2FE', accent: '#075985' },
      situations: [
        {
          id: "mrt_buy_help", name: "不會買票", icon: "🎫", clerkName: "捷運站務員",
          desc: "售票機不會操作，開口請站務員教",
          steps: [
            mkStep({ id:"ask_help", say:"（售票機好複雜…旁邊有站務員）", task:"開口求助",
              options:["不好意思，我不會買票，可以教我嗎？","機器壞了啦","算了不搭了","（站著一直看）"],
              accepted:["不好意思，我不會買票，可以教我嗎？","我不會買票","可以教我買票嗎"], kw:["不會買票","教我"],
              feedback:{ failed:"不會就開口問。可以說：「不好意思，我不會買票，可以教我嗎？」" } }),
            mkStep({ id:"say_dest", say:"好啊！你要到哪一站？", task:"說目的地",
              options:["我要到台北車站","很遠的地方","你猜猜看","不知道耶"],
              accepted:["我要到台北車站","到台北車站","我要去台北車站"], kw:["台北車站"],
              feedback:{ failed:"說清楚目的地。可以說：「我要到台北車站」" } }),
            mkStep({ id:"pay_coin", say:"到台北車站是25元，按這裡再投錢就可以了！", task:"投錢買票",
              options:["好，我投25元","太貴了吧","可以賒帳嗎","你幫我出錢"],
              accepted:["好，我投25元","我投25元","投25元"], kw:["25"],
              feedback:{ failed:"照金額投錢。可以說：「好，我投25元」" } }),
            mkStep({ id:"thank_staff", say:"票出來囉，拿好！", task:"道謝",
              options:["謝謝站務員！","喔耶","走了","嗯"],
              accepted:["謝謝站務員！","謝謝","謝謝你"], kw:["謝謝"],
              feedback:{ failed:"可以說：「謝謝站務員！」" } }),
            mkStep({ id:"review", say:"（想一想）不會操作機器時怎麼辦？", task:"說出方法",
              options:["請站務員教我","亂按看看","放棄回家","偷看別人怎麼用"],
              accepted:["請站務員教我","找站務員幫忙","請人教我"], kw:["站務員","教我"],
              feedback:{ perfect:"答對了！不會操作就請站務員教。", failed:"記住：不會操作機器，就開口請站務員教你。" } }),
          ]
        },
        {
          id: "mrt_card_fail", name: "卡片刷不過", icon: "💳", clerkName: "捷運站務員",
          desc: "閘門刷不過，找站務員發現餘額不足要加值",
          steps: [
            mkStep({ id:"tell_fail", say:"（閘門）嗶嗶！（亮紅燈，門沒開）", task:"找站務員說明",
              options:["站務員，我的卡片刷不過去","用力再刷十次","從旁邊鑽過去","踢閘門一下"],
              accepted:["站務員，我的卡片刷不過去","卡片刷不過","我的卡刷不過去"], kw:["刷不過"],
              feedback:{ failed:"刷不過就找站務員。可以說：「站務員，我的卡片刷不過去」" } }),
            mkStep({ id:"do_topup", say:"我看看…你的卡片餘額不足喔，要加值！", task:"說要加值",
              options:["好，我要加值一百元","卡片是壞掉了吧","先讓我過去啦","算了我不搭了"],
              accepted:["好，我要加值一百元","我要加值","幫我加值"], kw:["加值"],
              feedback:{ failed:"餘額不足要加值。可以說：「好，我要加值一百元」" } }),
            mkStep({ id:"check_balance", say:"好的，收你一百元，加值完成！", task:"道謝並確認餘額",
              options:["謝謝，請問現在餘額多少？","趕快讓我過","一百元好貴","就這樣？"],
              accepted:["謝謝，請問現在餘額多少？","現在餘額多少","餘額多少錢"], kw:["餘額"],
              feedback:{ failed:"加值後確認餘額。可以說：「謝謝，請問現在餘額多少？」" } }),
            mkStep({ id:"review", say:"（想一想）卡片刷不過的原因可能是什麼？", task:"說出原因",
              options:["可能餘額不足，要加值","閘門討厭我","卡片生氣了","運氣不好而已"],
              accepted:["可能餘額不足，要加值","餘額不足要加值","餘額不夠了"], kw:["餘額不足","餘額不夠"],
              feedback:{ perfect:"答對了！刷不過常常是餘額不足，加值就好。", failed:"記住：刷不過先想到餘額不足，找站務員加值。" } }),
          ]
        },
        {
          id: "mrt_wrong_dir", name: "搭錯方向", icon: "🔄", clerkName: "捷運站務員",
          desc: "發現搭反方向，下車找站務員問怎麼辦",
          steps: [
            mkStep({ id:"tell_wrong", say:"（咦？站名越來越不對…搭反了！到站趕快下車找站務員）", task:"說明搭錯方向",
              options:["不好意思，我搭錯方向了","這捷運亂開","我要客訴","沒差繼續坐"],
              accepted:["不好意思，我搭錯方向了","我搭錯方向","搭錯方向了怎麼辦"], kw:["搭錯方向"],
              feedback:{ failed:"搭錯就下車求助。可以說：「不好意思，我搭錯方向了」" } }),
            mkStep({ id:"confirm_fix", say:"別擔心！到對面月台搭回去就可以了，不用再買票！", task:"複誦確認",
              options:["好，到對面月台搭回去","要再買一次票嗎","走出站再進來嗎","太麻煩了吧"],
              accepted:["好，到對面月台搭回去","到對面月台搭回去","對面月台搭回去"], kw:["對面月台"],
              feedback:{ failed:"覆述一次確認聽懂。可以說：「好，到對面月台搭回去」" } }),
            mkStep({ id:"thank_fix", say:"對！慢慢來，不急！", task:"道謝",
              options:["謝謝站務員！","好險喔","嚇死","先走了"],
              accepted:["謝謝站務員！","謝謝","謝謝你"], kw:["謝謝"],
              feedback:{ failed:"可以說：「謝謝站務員！」" } }),
            mkStep({ id:"review", say:"（想一想）發現搭錯車怎麼辦？", task:"說出方法",
              options:["下一站下車，找站務員問","坐到底再說","跳過去對面","假裝沒發現"],
              accepted:["下一站下車，找站務員問","下車找站務員","下一站下車問站務員"], kw:["下車","站務員"],
              feedback:{ perfect:"答對了！下一站下車，找站務員問清楚。", failed:"記住：搭錯車就在下一站下車，找站務員幫忙。" } }),
          ]
        }
      ]
    },

    {
      id: "train_ticket", name: "火車站售票口", icon: "🚆", available: true,
      theme: { color: '#B45309', bg: '#FEF3C7', accent: '#92400E' },
      situations: [
        {
          id: "train_buy", name: "買車票", icon: "🎫", clerkName: "售票員",
          desc: "到售票口買票：說目的地、選車種、付錢、問月台",
          steps: [
            mkStep({ id:"say_dest", say:"你好，請問要到哪裡？", task:"說目的地和張數",
              options:["我要一張到台中的票","坐火車","便宜的那種","你推薦哪裡"],
              accepted:["我要一張到台中的票","一張到台中","到台中一張"], kw:["台中"],
              feedback:{ failed:"說清楚目的地和張數。可以說：「我要一張到台中的票」" } }),
            mkStep({ id:"choose_train", say:"好的！區間車85元，自強號180元，要哪一種？", task:"選車種",
              options:["我要區間車，85元的","都可以啦","最快又最便宜的","不知道差在哪"],
              accepted:["我要區間車，85元的","我要區間車","區間車一張"], kw:["區間車"],
              feedback:{ failed:"選一種車。可以說：「我要區間車，85元的」" } }),
            mkStep({ id:"pay_train", say:"區間車一張85元！", task:"付錢",
              options:["好，這是100元","太貴了算了","可以算便宜點嗎","先欠著下次給"],
              accepted:["好，這是100元","這是100元","給你100元"], kw:["100"],
              feedback:{ failed:"付錢。可以說：「好，這是100元」" } }),
            mkStep({ id:"ask_platform", say:"找你15元，這是你的票！", task:"收好找零並問月台",
              options:["謝謝，請問在第幾月台搭車？","走了走了","錢對不對啊","車什麼時候開"],
              accepted:["謝謝，請問在第幾月台搭車？","第幾月台","在哪個月台"], kw:["月台"],
              feedback:{ failed:"拿了票確認月台。可以說：「謝謝，請問在第幾月台搭車？」" } }),
            mkStep({ id:"review", say:"（想一想）買火車票要說清楚什麼？", task:"說出重點",
              options:["說清楚目的地、車種和張數","只要給錢就好","越快越好","讓售票員決定"],
              accepted:["說清楚目的地、車種和張數","目的地車種張數","說清楚目的地和車種"], kw:["目的地","車種"],
              feedback:{ perfect:"答對了！說清楚目的地、車種、張數。", failed:"記住：買票要說清楚目的地、車種和張數。" } }),
          ]
        },
        {
          id: "train_change", name: "趕不上車", icon: "⏰", clerkName: "售票員",
          desc: "火車開走了，到售票口問能不能改班次",
          steps: [
            mkStep({ id:"ask_change", say:"（糟糕，火車開走了…到售票口問問看）", task:"說明趕不上、問可否改班",
              options:["不好意思，我趕不上車了，可以改下一班嗎？","火車怎麼不等我","把錢退我","我要投訴"],
              accepted:["不好意思，我趕不上車了，可以改下一班嗎？","可以改下一班嗎","趕不上車可以改票嗎"], kw:["改下一班","改票"],
              feedback:{ failed:"趕不上可以問改班。可以說：「不好意思，我趕不上車了，可以改下一班嗎？」" } }),
            mkStep({ id:"confirm_time", say:"可以喔！下一班40分鐘後，幫你改好了，不用加錢！", task:"確認時間並道謝",
              options:["謝謝！下一班是40分鐘後對嗎？","那麼久喔","算了退票好了","早知道用跑的"],
              accepted:["謝謝！下一班是40分鐘後對嗎？","40分鐘後對嗎","下一班40分鐘後"], kw:["40分"],
              feedback:{ failed:"確認新班次時間。可以說：「謝謝！下一班是40分鐘後對嗎？」" } }),
            mkStep({ id:"ask_wait", say:"對！可以在候車室坐著等喔。", task:"問候車室位置",
              options:["好，請問候車室在哪裡？","我站著等就好","40分鐘要幹嘛","嗚嗚嗚"],
              accepted:["好，請問候車室在哪裡？","候車室在哪","哪裡有候車室"], kw:["候車室"],
              feedback:{ failed:"可以說：「好，請問候車室在哪裡？」" } }),
            mkStep({ id:"review", say:"（想一想）趕不上車怎麼辦？", task:"說出方法",
              options:["到售票口問能不能改班次","票丟掉重買一張","硬闖月台等下班車","回家不去了"],
              accepted:["到售票口問能不能改班次","問售票口改班次","找售票口改票"], kw:["售票口","改"],
              feedback:{ perfect:"答對了！趕不上就到售票口問改班次。", failed:"記住：趕不上車先到售票口，問能不能改下一班。" } }),
          ]
        },
        {
          id: "train_lost", name: "車票不見了", icon: "😱", clerkName: "售票員",
          desc: "車票不見了，向站務人員說明求助",
          steps: [
            mkStep({ id:"tell_lost", say:"（口袋裡的票不見了！趕快找站務人員）", task:"說明車票不見",
              options:["不好意思，我的車票不見了","有人偷我的票","沒票也讓我上車啦","（一直翻口袋不說話）"],
              accepted:["不好意思，我的車票不見了","我的車票不見了","車票不見了怎麼辦"], kw:["票不見"],
              feedback:{ failed:"票不見了先說出來。可以說：「不好意思，我的車票不見了」" } }),
            mkStep({ id:"give_info", say:"別緊張！你買的是哪一班、到哪裡的票？", task:"提供班次資訊",
              options:["十點的區間車，到台中","就是火車啊","忘記了","你們自己查"],
              accepted:["十點的區間車，到台中","十點到台中","十點的車到台中"], kw:["十點","台中"],
              feedback:{ failed:"說出班次和目的地。可以說：「十點的區間車，到台中」" } }),
            mkStep({ id:"promise_keep", say:"查到了！補張證明給你，下次票要收好喔！", task:"道謝並說會收好",
              options:["謝謝！下次我會把票收好","都是口袋的錯","票太小張了","嗯"],
              accepted:["謝謝！下次我會把票收好","我會把票收好","下次會收好"], kw:["收好"],
              feedback:{ failed:"可以說：「謝謝！下次我會把票收好」" } }),
            mkStep({ id:"review", say:"（想一想）車票要怎麼保管？", task:"說出方法",
              options:["收在固定的地方，像錢包裡","隨手放口袋","拿在手上甩","請別人幫我拿"],
              accepted:["收在固定的地方，像錢包裡","收在固定地方","放錢包收好"], kw:["固定","錢包"],
              feedback:{ perfect:"答對了！票收在固定的地方，像錢包裡。", failed:"記住：票和錢一樣，收在固定的地方。" } }),
          ]
        }
      ]
    },

    {
      id: "taxi", name: "搭計程車", icon: "🚕", available: true,
      theme: { color: '#CA8A04', bg: '#FEF9C3', accent: '#A16207' },
      situations: [
        {
          id: "taxi_basic", name: "基本搭車", icon: "🚕", clerkName: "計程車司機",
          desc: "說清楚目的地，下車付錢、確認找零",
          steps: [
            mkStep({ id:"say_dest", say:"你好！請問要到哪裡？", task:"說目的地",
              options:["請到中山醫院，謝謝","隨便開","前面那邊","跟著前面的車"],
              accepted:["請到中山醫院，謝謝","到中山醫院","我要到中山醫院"], kw:["中山醫院"],
              feedback:{ failed:"說清楚目的地。可以說：「請到中山醫院，謝謝」" } }),
            mkStep({ id:"ask_fare", say:"（15分鐘後）中山醫院到囉！", task:"問車資",
              options:["請問多少錢？","開門讓我下去","到了喔","再見"],
              accepted:["請問多少錢？","多少錢","車資多少"], kw:["多少錢","車資"],
              feedback:{ failed:"下車前先問車資。可以說：「請問多少錢？」" } }),
            mkStep({ id:"pay_taxi", say:"一共180元！", task:"付錢",
              options:["好，這是200元","好貴喔不想付","下次再給","我先下車喔"],
              accepted:["好，這是200元","這是200元","給你200元"], kw:["200"],
              feedback:{ failed:"照表付錢。可以說：「好，這是200元」" } }),
            mkStep({ id:"check_change", say:"收200，找你20元，慢走！", task:"確認找零並道謝",
              options:["謝謝，找零20元我收到了","錢我拿走了喔","嗯","（直接下車關門）"],
              accepted:["謝謝，找零20元我收到了","找零收到了","20元收到了"], kw:["找零","20"],
              feedback:{ failed:"找零當面確認。可以說：「謝謝，找零20元我收到了」" } }),
            mkStep({ id:"review", say:"（想一想）搭計程車要注意什麼？", task:"說出重點",
              options:["說清楚目的地，下車付錢確認找零","上車睡覺就好","給錢不用數","越快越好"],
              accepted:["說清楚目的地，下車付錢確認找零","說清楚目的地並確認找零","講目的地、付錢、對找零"], kw:["目的地","找零"],
              feedback:{ perfect:"答對了！說清楚目的地，付錢後確認找零。", failed:"記住：上車說清楚目的地，下車付錢、當面確認找零。" } }),
          ]
        },
        {
          id: "taxi_ask_price", name: "先問車資", icon: "💰", clerkName: "計程車司機",
          desc: "上車前先問大概多少錢，確認預算夠不夠",
          steps: [
            mkStep({ id:"ask_price", say:"你好，要搭車嗎？", task:"先問到目的地多少錢",
              options:["請問到火車站大概多少錢？","算便宜一點啦","你們會亂喊價嗎","上車再說"],
              accepted:["請問到火車站大概多少錢？","到火車站多少錢","大概多少錢"], kw:["多少錢"],
              feedback:{ failed:"上車前先問價錢。可以說：「請問到火車站大概多少錢？」" } }),
            mkStep({ id:"decide_ride", say:"大概150元左右喔！", task:"確認搭車",
              options:["好，那我要搭車","太貴了，我用走的","150？算120啦","讓我想三天"],
              accepted:["好，那我要搭車","我要搭車","那就搭吧"], kw:["我要搭","那就搭"],
              feedback:{ failed:"價錢可以接受就上車。可以說：「好，那我要搭車」" } }),
            mkStep({ id:"confirm_price", say:"上車吧！", task:"上車後再確認一次價錢",
              options:["跟您確認，到火車站大概150元對嗎？","隨便多少都行","開吧開吧","不確認了"],
              accepted:["跟您確認，到火車站大概150元對嗎？","150元對嗎","大概150元對吧"], kw:["150"],
              feedback:{ failed:"上車再確認一次。可以說：「跟您確認，到火車站大概150元對嗎？」" } }),
            mkStep({ id:"review", say:"（想一想）為什麼上車前先問價錢？", task:"說出理由",
              options:["先問價錢，確認預算夠不夠","司機喜歡被問","上車才刺激","問了比較快到"],
              accepted:["先問價錢，確認預算夠不夠","先問價錢","確認預算夠不夠"], kw:["先問","預算"],
              feedback:{ perfect:"答對了！先問價錢，確認預算夠不夠。", failed:"記住：上車前先問價錢，確認自己帶的錢夠。" } }),
          ]
        },
        {
          id: "taxi_sick", name: "暈車請開慢", icon: "🤢", clerkName: "計程車司機",
          desc: "身體不舒服時，開口說出需求",
          steps: [
            mkStep({ id:"say_sick", say:"（車開得有點快，你覺得頭暈…）", task:"開口說出需求",
              options:["司機先生，我會暈車，可以開慢一點嗎？","（忍耐不說話）","停車我要吐了！","你會不會開車啊"],
              accepted:["司機先生，我會暈車，可以開慢一點嗎？","可以開慢一點嗎","請開慢一點"], kw:["開慢"],
              feedback:{ failed:"不舒服要說出來。可以說：「司機先生，我會暈車，可以開慢一點嗎？」" } }),
            mkStep({ id:"thank_kind", say:"沒問題！幫你開個窗戶透氣好嗎？", task:"說好並道謝",
              options:["好，謝謝你","不用管我","隨便","窗戶髒髒的"],
              accepted:["好，謝謝你","謝謝","好的謝謝"], kw:["謝謝"],
              feedback:{ failed:"可以說：「好，謝謝你」" } }),
            mkStep({ id:"review", say:"（想一想）身體不舒服的時候怎麼辦？", task:"說出方法",
              options:["開口說出需求，請對方幫忙","忍耐到最後","生氣怪別人","下車用走的"],
              accepted:["開口說出需求，請對方幫忙","開口說出需求","說出來請人幫忙"], kw:["說出","開口"],
              feedback:{ perfect:"答對了！不舒服要開口說，別人才能幫你。", failed:"記住：身體不舒服，開口說出需求。" } }),
          ]
        }
      ]
    },

    {
      id: "easycard_service", name: "悠遊卡服務台", icon: "💳", available: true,
      theme: { color: '#7C3AED', bg: '#EDE9FE', accent: '#5B21B6' },
      situations: [
        {
          id: "card_topup", name: "加值悠遊卡", icon: "💰", clerkName: "服務台人員",
          desc: "到服務台加值，完成後確認餘額",
          steps: [
            mkStep({ id:"say_add", say:"你好！這裡是悠遊卡服務台～", task:"說要加值",
              options:["你好，我要加值悠遊卡","卡片給你","我要買新卡","幫我弄一下"],
              accepted:["你好，我要加值悠遊卡","我要加值","幫我加值"], kw:["加值"],
              feedback:{ failed:"說清楚需求。可以說：「你好，我要加值悠遊卡」" } }),
            mkStep({ id:"say_amount", say:"好的！要加值多少呢？", task:"說金額並付錢",
              options:["加值一百元，這是錢","越多越好","你幫我決定","先加十元試試"],
              accepted:["加值一百元，這是錢","加值一百元","一百元"], kw:["一百"],
              feedback:{ failed:"說清楚金額。可以說：「加值一百元，這是錢」" } }),
            mkStep({ id:"confirm_balance", say:"好囉，加值完成！現在餘額235元。", task:"複誦餘額確認",
              options:["好的，餘額235元，謝謝！","隨便啦","有加就好","你不要騙我喔"],
              accepted:["好的，餘額235元，謝謝！","餘額235元","235元謝謝"], kw:["235"],
              feedback:{ failed:"複誦餘額確認。可以說：「好的，餘額235元，謝謝！」" } }),
            mkStep({ id:"review", say:"（想一想）加值完要確認什麼？", task:"說出重點",
              options:["確認餘額對不對","卡片有沒有變重","顏色有沒有變","不用確認直接走"],
              accepted:["確認餘額對不對","確認餘額","看餘額對不對"], kw:["餘額"],
              feedback:{ perfect:"答對了！加值完確認餘額對不對。", failed:"記住：加值完要確認餘額，跟收據或口頭說的一樣。" } }),
          ]
        },
        {
          id: "card_lost", name: "卡片掉了要掛失", icon: "😢", clerkName: "服務台人員",
          desc: "悠遊卡不見了，到服務台掛失保住餘額",
          steps: [
            mkStep({ id:"report_lost", say:"（悠遊卡不見了！趕快到服務台）", task:"說明要掛失",
              options:["我的悠遊卡不見了，想要掛失","有人撿到卡片嗎","賠我一張新卡","掉了就掉了吧"],
              accepted:["我的悠遊卡不見了，想要掛失","悠遊卡不見了要掛失","我要掛失"], kw:["掛失","不見"],
              feedback:{ failed:"掉卡要趕快掛失。可以說：「我的悠遊卡不見了，想要掛失」" } }),
            mkStep({ id:"say_named", say:"好的，是記名卡嗎？記名卡掛失後餘額可以保留喔！", task:"回答是記名學生卡",
              options:["是，我的是記名學生卡","這是什麼意思？","不知道耶","應該吧大概"],
              accepted:["是，我的是記名學生卡","是記名學生卡","記名的"], kw:["記名"],
              feedback:{ failed:"想一想卡片有沒有登記名字。可以說：「是，我的是記名學生卡」" } }),
            mkStep({ id:"thank_saved", say:"掛失完成！餘額幫你保留，補一張新卡就好。", task:"道謝",
              options:["謝謝！還好卡片有記名","運氣好而已","卡片再見","嗯嗯好"],
              accepted:["謝謝！還好卡片有記名","還好有記名","謝謝餘額有保留"], kw:["記名","餘額"],
              feedback:{ failed:"可以說：「謝謝！還好卡片有記名」" } }),
            mkStep({ id:"review", say:"（想一想）為什麼卡片要記名？", task:"說出理由",
              options:["掉了可以掛失，餘額不會不見","比較好看","刷比較快","可以炫耀"],
              accepted:["掉了可以掛失，餘額不會不見","掛失餘額不會不見","掛失後餘額保留"], kw:["掛失","餘額"],
              feedback:{ perfect:"答對了！記名卡掉了可以掛失，餘額保得住。", failed:"記住：卡片記名，掉了掛失，裡面的錢才保得住。" } }),
          ]
        },
        {
          id: "card_student", name: "辦學生卡", icon: "🎓", clerkName: "服務台人員",
          desc: "詢問怎麼辦學生悠遊卡、要帶什麼",
          steps: [
            mkStep({ id:"ask_student", say:"你好，需要什麼服務嗎？", task:"問怎麼辦學生卡",
              options:["請問怎麼辦學生悠遊卡？","給我一張最好的卡","有優惠嗎快說","辦卡送什麼"],
              accepted:["請問怎麼辦學生悠遊卡？","怎麼辦學生卡","辦學生悠遊卡"], kw:["學生"],
              feedback:{ failed:"說清楚要辦什麼。可以說：「請問怎麼辦學生悠遊卡？」" } }),
            mkStep({ id:"show_id", say:"要帶學生證和100元喔！有帶嗎？", task:"拿出學生證和錢",
              options:["有，這是我的學生證和100元","明天再帶來","用眼神證明我是學生","沒有不行嗎"],
              accepted:["有，這是我的學生證和100元","這是學生證和100元","有帶學生證"], kw:["學生證"],
              feedback:{ failed:"把文件和錢拿出來。可以說：「有，這是我的學生證和100元」" } }),
            mkStep({ id:"ask_discount", say:"好囉！這是你的學生卡，搭車有優惠喔！", task:"道謝並問優惠",
              options:["謝謝！請問優惠是打幾折？","終於好了","快給我卡","先走了"],
              accepted:["謝謝！請問優惠是打幾折？","優惠是打幾折","優惠多少"], kw:["優惠","幾折"],
              feedback:{ failed:"問清楚優惠內容。可以說：「謝謝！請問優惠是打幾折？」" } }),
            mkStep({ id:"review", say:"（想一想）辦證件類的卡要準備什麼？", task:"說出準備",
              options:["要帶證明文件和費用","只要人到就好","帶零食","什麼都不用帶"],
              accepted:["要帶證明文件和費用","證明文件和費用","帶證件和錢"], kw:["證件","文件","費用"],
              feedback:{ perfect:"答對了！辦卡要帶證明文件和費用。", failed:"記住：辦卡要帶證明文件（像學生證）和費用。" } }),
          ]
        }
      ]
    },

    {
      id: "ride_manner", name: "車廂禮儀與求助", icon: "🚈", available: true,
      theme: { color: '#DB2777', bg: '#FCE7F3', accent: '#9D174D' },
      situations: [
        {
          id: "offer_seat", name: "讓座給需要的人", icon: "🧓", clerkName: "老奶奶",
          desc: "看到更需要座位的人，主動讓座",
          steps: [
            mkStep({ id:"give_seat", say:"（一位老奶奶上車，車上沒有空位了，你坐在座位上）", task:"主動讓座",
              options:["奶奶，這個位子給您坐","（假裝睡覺）","（一直看窗外）","位子是我先搶到的"],
              accepted:["奶奶，這個位子給您坐","這個位子給您坐","奶奶請坐"], kw:["給您坐","請坐"],
              feedback:{ failed:"看到需要的人主動讓座。可以說：「奶奶，這個位子給您坐」" } }),
            mkStep({ id:"reply_kind", say:"哎呀謝謝你，真是好孩子！", task:"有禮貌回應",
              options:["不客氣，您慢慢坐","對啊我人超好","要一起擠嗎","站著也不錯啦"],
              accepted:["不客氣，您慢慢坐","不客氣","不會，不客氣"], kw:["不客氣"],
              feedback:{ failed:"可以說：「不客氣，您慢慢坐」" } }),
            mkStep({ id:"review", say:"（想一想）什麼時候要讓座？", task:"說出時機",
              options:["看到更需要座位的人就讓座","被瞪的時候才讓","廣播叫我才讓","永遠不用讓"],
              accepted:["看到更需要座位的人就讓座","有人更需要座位","讓給需要的人"], kw:["需要"],
              feedback:{ perfect:"答對了！看到更需要座位的人，主動讓座。", failed:"記住：看到老人家、孕婦等更需要座位的人，主動讓座。" } }),
          ]
        },
        {
          id: "drop_item", name: "東西掉了請人幫忙", icon: "🎒", clerkName: "隔壁乘客",
          desc: "水壺滾到別人腳邊，有禮貌請人幫忙",
          steps: [
            mkStep({ id:"ask_pick", say:"（你的水壺滾到別人腳邊了）", task:"有禮貌請人幫忙撿",
              options:["不好意思，可以幫我撿一下水壺嗎？","（自己爬過去撿）","喂，踢過來","算了不要了"],
              accepted:["不好意思，可以幫我撿一下水壺嗎？","可以幫我撿一下嗎","幫我撿水壺"], kw:["幫我撿"],
              feedback:{ failed:"開口請人幫忙。可以說：「不好意思，可以幫我撿一下水壺嗎？」" } }),
            mkStep({ id:"thank_pick", say:"來，你的水壺！", task:"道謝",
              options:["謝謝你！","好險","水壺沒破吧","嗯"],
              accepted:["謝謝你！","謝謝","謝謝你"], kw:["謝謝"],
              feedback:{ failed:"可以說：「謝謝你！」" } }),
            mkStep({ id:"review", say:"（想一想）請別人幫忙要怎麼說？", task:"說出方法",
              options:["先說不好意思，再有禮貌地請人幫忙","大聲命令別人","用手指比一比","等別人主動來"],
              accepted:["先說不好意思，再有禮貌地請人幫忙","先說不好意思再請幫忙","有禮貌地請幫忙"], kw:["不好意思","禮貌"],
              feedback:{ perfect:"答對了！先說不好意思，再有禮貌地請人幫忙。", failed:"記住：請人幫忙先說不好意思，再說請幫我。" } }),
          ]
        },
        {
          id: "stranger_money", name: "陌生人跟你要錢", icon: "🙅", clerkName: "陌生乘客",
          desc: "車上有陌生人跟你要錢：拒絕並靠近站務員",
          steps: [
            mkStep({ id:"refuse_give", say:"（車上陌生人靠近）同學，借我一百元啦！", task:"拒絕陌生人",
              options:["不好意思，我不能借","好啦給你","你好可憐喔","（默默掏錢包）"],
              accepted:["不好意思，我不能借","我不能借","不借"], kw:["不能借","不借"],
              feedback:{ failed:"陌生人要錢一律拒絕。可以說：「不好意思，我不能借」" } }),
            mkStep({ id:"find_staff", say:"不借喔？那你零用錢很多齁～", task:"離開並找站務員",
              options:["（走向站務員）站務員，有人跟我要錢","（繼續坐著不動）","跟他聊天轉移話題","下一站馬上逃走"],
              accepted:["（走向站務員）站務員，有人跟我要錢","站務員，有人跟我要錢","有人跟我要錢","有人一直跟我要錢"], kw:["跟我要錢"],
              feedback:{ failed:"馬上靠近工作人員。可以說：「站務員，有人跟我要錢」" } }),
            mkStep({ id:"thank_safe", say:"好，你站我旁邊，我來處理！", task:"道謝",
              options:["謝謝站務員","我自己也可以啦","他好可怕","嗚嗚"],
              accepted:["謝謝站務員","謝謝","謝謝你"], kw:["謝謝"],
              feedback:{ failed:"可以說：「謝謝站務員」" } }),
            mkStep({ id:"review", say:"（想一想）車上有陌生人跟你要錢怎麼辦？", task:"說出方法",
              options:["拒絕，然後靠近站務員或司機","給一點點就好","跟他吵架","下車用跑的"],
              accepted:["拒絕，然後靠近站務員或司機","拒絕然後找站務員","拒絕並靠近司機"], kw:["拒絕","站務員"],
              feedback:{ perfect:"答對了！拒絕，然後靠近站務員或司機求助。", failed:"記住：拒絕，然後靠近站務員或司機，不要單獨面對。" } }),
          ]
        }
      ]
    },

    {
      id: "cinema", name: "電影院", icon: "🎬", available: true,
      theme: { color: '#6D28D9', bg: '#EDE9FE', accent: '#5B21B6' },
      situations: [
        {
          id: "cinema_buy", name: "買電影票", icon: "🎬", clerkName: "電影院店員",
          desc: "選場次、用學生證買優惠票",
          steps: [
            mkStep({ id:"say_movie", say:"你好！請問要看哪一部電影？", task:"說片名和張數",
              options:["我要一張《海洋總動員》的票","隨便一部","最好看的那部","你幫我選"],
              accepted:["我要一張《海洋總動員》的票","一張海洋總動員","海洋總動員一張"], kw:["海洋總動員"],
              feedback:{ failed:"說清楚片名和張數。可以說：「我要一張《海洋總動員》的票」" } }),
            mkStep({ id:"choose_time", say:"好的！有兩點和四點的場次，要哪一場？", task:"選場次",
              options:["我要兩點的場次","都可以","現在馬上開演的","越晚越好"],
              accepted:["我要兩點的場次","兩點的場次","我要兩點的"], kw:["兩點"],
              feedback:{ failed:"選一個場次。可以說：「我要兩點的場次」" } }),
            mkStep({ id:"student_price", say:"兩點的！全票280元，學生票230元喔！", task:"用學生證買學生票",
              options:["我有學生證，買學生票","全票好了反正一樣","不用證件算我便宜啦","有更便宜的嗎"],
              accepted:["我有學生證，買學生票","我有學生證買學生票","買學生票"], kw:["學生票"],
              feedback:{ failed:"有學生證可以買優惠票。可以說：「我有學生證，買學生票」" } }),
            mkStep({ id:"pay_movie", say:"好的，學生票230元！", task:"付錢",
              options:["好，這是250元","太貴了不看了","賒帳可以嗎","先看完再付"],
              accepted:["好，這是250元","這是250元","給你250元"], kw:["250"],
              feedback:{ failed:"付錢。可以說：「好，這是250元」" } }),
            mkStep({ id:"review", say:"（想一想）買電影票怎麼比較省錢？", task:"說出方法",
              options:["有學生證就買學生優惠票","永遠買全票","不用比較","叫別人請客"],
              accepted:["有學生證就買學生優惠票","買學生優惠票","用學生證買優惠票"], kw:["學生","優惠"],
              feedback:{ perfect:"答對了！有學生證記得買優惠票。", failed:"記住：有學生證就用，優惠票能省錢。" } }),
          ]
        },
        {
          id: "cinema_snack", name: "加購爆米花", icon: "🍿", clerkName: "電影院店員",
          desc: "加購前先想預算，需要才買",
          steps: [
            mkStep({ id:"ask_combo", say:"要不要加購爆米花套餐？大套餐150元、小套餐90元！", task:"想想預算再決定",
              options:["我剩100元，買小套餐就好","大的！錢不夠再說","都買！","你送我一份啦"],
              accepted:["我剩100元，買小套餐就好","買小套餐就好","我買小套餐"], kw:["小套餐"],
              feedback:{ failed:"先想想剩多少錢。可以說：「我剩100元，買小套餐就好」" } }),
            mkStep({ id:"pay_snack", say:"小套餐90元！", task:"付錢並確認找零",
              options:["這是100元，要找我10元","錢都給你不用找","（放下錢就走）","算80就好"],
              accepted:["這是100元，要找我10元","這是100元要找10元","找我10元"], kw:["10元"],
              feedback:{ failed:"付錢也要會算找零。可以說：「這是100元，要找我10元」" } }),
            mkStep({ id:"review", say:"（想一想）加購東西前要想什麼？", task:"說出重點",
              options:["想想預算夠不夠，需要才買","店員推銷就買","越大份越划算","先買再煩惱"],
              accepted:["想想預算夠不夠，需要才買","想預算夠不夠","需要才買"], kw:["預算","需要"],
              feedback:{ perfect:"答對了！加購前先想預算，需要才買。", failed:"記住：加購前先想預算夠不夠、是不是真的需要。" } }),
          ]
        },
        {
          id: "cinema_late", name: "遲到了", icon: "⏰", clerkName: "電影院店員",
          desc: "電影開演了才到，請工作人員協助入場",
          steps: [
            mkStep({ id:"ask_enter", say:"（糟糕，電影開演10分鐘了才到…）", task:"問可否入場",
              options:["不好意思，我遲到了，還可以進場嗎？","（直接衝進去）","退票！","門怎麼打不開"],
              accepted:["不好意思，我遲到了，還可以進場嗎？","遲到了還可以進場嗎","還能進場嗎"], kw:["進場"],
              feedback:{ failed:"遲到先問工作人員。可以說：「不好意思，我遲到了，還可以進場嗎？」" } }),
            mkStep({ id:"follow_staff", say:"可以喔！裡面燈光暗，我帶你進去，小聲一點喔！", task:"說好並道謝",
              options:["好的，謝謝你","我自己來就好","大聲喊我朋友在哪","開燈找位子"],
              accepted:["好的，謝謝你","好的謝謝","謝謝你"], kw:["謝謝"],
              feedback:{ failed:"可以說：「好的，謝謝你」" } }),
            mkStep({ id:"review", say:"（想一想）看電影遲到了怎麼辦？", task:"說出方法",
              options:["請工作人員幫忙，小聲入場","用衝的進去","在門口生氣","要求重播"],
              accepted:["請工作人員幫忙，小聲入場","請工作人員幫忙","小聲入場"], kw:["工作人員","小聲"],
              feedback:{ perfect:"答對了！請工作人員幫忙，小聲入場不影響別人。", failed:"記住：遲到請工作人員帶位，小聲入場。" } }),
          ]
        }
      ]
    },

    {
      id: "ktv", name: "KTV", icon: "🎤", available: true,
      theme: { color: '#E11D48', bg: '#FFE4E6', accent: '#BE123C' },
      situations: [
        {
          id: "ktv_book", name: "訂包廂問計費", icon: "🎤", clerkName: "KTV店員",
          desc: "問清楚怎麼計費、算出總價再消費",
          steps: [
            mkStep({ id:"ask_fee", say:"歡迎光臨！請問幾位？", task:"說人數並問計費",
              options:["三位，請問怎麼計費？","很多人","先進去再說","有得唱就好"],
              accepted:["三位，請問怎麼計費？","三位怎麼計費","請問怎麼計費"], kw:["計費"],
              feedback:{ failed:"先問清楚怎麼算錢。可以說：「三位，請問怎麼計費？」" } }),
            mkStep({ id:"count_total", say:"三位的話，唱兩小時每人199元，含飲料喝到飽！", task:"算出總價確認",
              options:["好，三個人總共597元對嗎？","199就是全部的錢吧","不用算了啦","太複雜我不唱了"],
              accepted:["好，三個人總共597元對嗎？","三個人總共597元對嗎","總共597元"], kw:["597"],
              feedback:{ failed:"人數乘單價等於總價。可以說：「好，三個人總共597元對嗎？」" } }),
            mkStep({ id:"pay_ktv", say:"對！一共597元。", task:"付錢",
              options:["好，這是600元","發票免了算便宜點","一人先付100","唱完再付"],
              accepted:["好，這是600元","這是600元","給你600元"], kw:["600"],
              feedback:{ failed:"付錢。可以說：「好，這是600元」" } }),
            mkStep({ id:"review", say:"（想一想）跟朋友一起消費，錢怎麼算？", task:"說出方法",
              options:["先算好總價，大家分攤","誰有錢誰付","都給店員決定","不算直接給"],
              accepted:["先算好總價，大家分攤","算好總價大家分攤","先算總價再分攤"], kw:["總價","分攤"],
              feedback:{ perfect:"答對了！先算好總價，大家公平分攤。", failed:"記住：一起消費先算總價，公平分攤。" } }),
          ]
        },
        {
          id: "ktv_extend", name: "要不要續時", icon: "⏳", clerkName: "KTV店員",
          desc: "時間到了，照預算婉拒續時",
          steps: [
            mkStep({ id:"say_no", say:"（電話響）三位好，包廂時間快到囉，要續唱一小時嗎？每人再加99元！", task:"照預算婉拒",
              options:["不用了，我們唱到這裡就好","續！錢再想辦法","再續三小時","你們請客的話就續"],
              accepted:["不用了，我們唱到這裡就好","不用了唱到這裡就好","不續了謝謝"], kw:["不用了","不續"],
              feedback:{ failed:"預算用完就停。可以說：「不用了，我們唱到這裡就好」" } }),
            mkStep({ id:"go_pay", say:"好的！請到櫃檯結帳～", task:"結帳道謝",
              options:["好，我們馬上過去，謝謝","再唱最後十首","假裝沒聽到","從後門走"],
              accepted:["好，我們馬上過去，謝謝","馬上過去謝謝","好的謝謝"], kw:["謝謝"],
              feedback:{ failed:"可以說：「好，我們馬上過去，謝謝」" } }),
            mkStep({ id:"review", say:"（想一想）為什麼時間到就結束？", task:"說出理由",
              options:["照預算玩，才不會花太多錢","被店員趕而已","下次不來了","唱歌不好玩了"],
              accepted:["照預算玩，才不會花太多錢","照預算玩不會花太多","照預算才不會超支"], kw:["預算"],
              feedback:{ perfect:"答對了！照預算玩，快樂不透支。", failed:"記住：說好的預算就是界線，時間到就結束。" } }),
          ]
        },
        {
          id: "ktv_help", name: "點歌機不會用", icon: "🎶", clerkName: "KTV店員",
          desc: "按服務鈴請店員教，學會操作",
          steps: [
            mkStep({ id:"call_staff", say:"（點歌機的畫面好複雜…）", task:"按服務鈴求助",
              options:["（按服務鈴）不好意思，可以教我點歌嗎？","（隨便亂按）","不唱了","叫朋友用嘴唱"],
              accepted:["（按服務鈴）不好意思，可以教我點歌嗎？","不好意思，可以教我點歌嗎？","可以教我點歌嗎","教我用點歌機"], kw:["點歌"],
              feedback:{ failed:"不會用就求助。可以說：「不好意思，可以教我點歌嗎？」" } }),
            mkStep({ id:"repeat_learn", say:"當然！輸入歌名按這裡，然後按『點播』就好了！", task:"複誦確認",
              options:["輸入歌名，再按點播，對嗎？","太難了你幫我點到底","好喔隨便","再教十次"],
              accepted:["輸入歌名，再按點播，對嗎？","輸入歌名再按點播","按點播對嗎"], kw:["點播"],
              feedback:{ failed:"覆述一次記得牢。可以說：「輸入歌名，再按點播，對嗎？」" } }),
            mkStep({ id:"thank_teach", say:"沒錯！學得真快！", task:"道謝",
              options:["謝謝你！","應該的","走吧","嗯"],
              accepted:["謝謝你！","謝謝","謝謝你"], kw:["謝謝"],
              feedback:{ failed:"可以說：「謝謝你！」" } }),
            mkStep({ id:"review", say:"（想一想）遇到不會用的東西怎麼辦？", task:"說出方法",
              options:["開口請人教，學會就是自己的","裝懂","放棄","叫別人代勞一輩子"],
              accepted:["開口請人教，學會就是自己的","開口請人教","請人教我學會"], kw:["請人教","開口"],
              feedback:{ perfect:"答對了！開口請人教，學會就是自己的。", failed:"記住：不會就開口請人教。" } }),
          ]
        }
      ]
    },

    {
      id: "swimming_pool", name: "游泳池", icon: "🏊", available: true,
      theme: { color: '#0891B2', bg: '#CFFAFE', accent: '#0E7490' },
      situations: [
        {
          id: "pool_ticket", name: "買門票", icon: "🎫", clerkName: "游泳池店員",
          desc: "買學生優惠票、問場地規則",
          steps: [
            mkStep({ id:"buy_ticket", say:"你好！游泳池門票全票80元、學生票50元！", task:"買學生票",
              options:["一張學生票，這是我的學生證","全票吧沒差","我用看的不用票","多少錢都行"],
              accepted:["一張學生票，這是我的學生證","一張學生票","學生票一張"], kw:["學生票"],
              feedback:{ failed:"記得用學生證買優惠票。可以說：「一張學生票，這是我的學生證」" } }),
            mkStep({ id:"pay_pool", say:"學生票50元！", task:"付錢",
              options:["好，這是50元","沒零錢，算免費","下水再給","刷臉可以嗎"],
              accepted:["好，這是50元","這是50元","給你50元"], kw:["50"],
              feedback:{ failed:"付錢。可以說：「好，這是50元」" } }),
            mkStep({ id:"ask_rule", say:"這是你的票！第一次來嗎？", task:"問使用規則",
              options:["對，請問有什麼要注意的嗎？","規則看心情","直接跳水","不用說我都會"],
              accepted:["對，請問有什麼要注意的嗎？","有什麼要注意的嗎","要注意什麼"], kw:["注意"],
              feedback:{ failed:"第一次去先問規則。可以說：「對，請問有什麼要注意的嗎？」" } }),
            mkStep({ id:"review", say:"（想一想）進新場所要先做什麼？", task:"說出重點",
              options:["先了解規則，付費入場","直接衝進去","跟著別人混進去","大聲喧嘩"],
              accepted:["先了解規則，付費入場","先了解規則付費入場","先問規則再入場"], kw:["規則"],
              feedback:{ perfect:"答對了！先了解規則、付費入場。", failed:"記住：新場所先問規則、付費再進場。" } }),
          ]
        },
        {
          id: "pool_locker", name: "租置物櫃", icon: "🔒", clerkName: "游泳池店員",
          desc: "認識押金：暫放的錢，退櫃會還",
          steps: [
            mkStep({ id:"ask_locker", say:"（要放包包…看到置物櫃區有管理員）", task:"問怎麼租",
              options:["請問置物櫃怎麼租？","這櫃子免費的吧","（隨便塞一格）","包包背著游"],
              accepted:["請問置物櫃怎麼租？","置物櫃怎麼租","怎麼租置物櫃"], kw:["置物櫃","怎麼租"],
              feedback:{ failed:"先問清楚。可以說：「請問置物櫃怎麼租？」" } }),
            mkStep({ id:"know_deposit", say:"租金10元，另外押金20元，退櫃的時候押金會還你喔！", task:"確認押金會退",
              options:["好，押金20元退櫃會還我對嗎？","那20元是被你賺走嗎","30元全部拿去","不租了好貴"],
              accepted:["好，押金20元退櫃會還我對嗎？","押金20元會還我對嗎","押金會退對嗎"], kw:["押金"],
              feedback:{ failed:"押金是暫放的錢，會退回。可以說：「好，押金20元退櫃會還我對嗎？」" } }),
            mkStep({ id:"get_back", say:"（游完泳退櫃）這是押金20元，還給你！", task:"確認收回並道謝",
              options:["謝謝，20元收到了","這是小費送你","忘記拿走了","錢變多了嗎"],
              accepted:["謝謝，20元收到了","20元收到了","謝謝收到了"], kw:["收到"],
              feedback:{ failed:"拿回押金要確認。可以說：「謝謝，20元收到了」" } }),
            mkStep({ id:"review", say:"（想一想）什麼是押金？", task:"說出概念",
              options:["暫時放在店家的錢，歸還東西就退回","給店家的小費","罰款","租金的一部分不會退"],
              accepted:["暫時放在店家的錢，歸還東西就退回","歸還東西就退回的錢","暫放店家會退回"], kw:["退回"],
              feedback:{ perfect:"答對了！押金是暫放的錢，歸還東西就會退回。", failed:"記住：押金是暫時放著的錢，東西還了就會退回來。" } }),
          ]
        },
        {
          id: "pool_lost", name: "蛙鏡不見了", icon: "🥽", clerkName: "游泳池店員",
          desc: "到服務台說清楚特徵，詢問失物招領",
          steps: [
            mkStep({ id:"ask_lost", say:"（游完泳，蛙鏡不見了…找服務台）", task:"詢問失物招領",
              options:["請問有人撿到蛙鏡嗎？","誰偷了我的東西！","算了再買一個","（哭著回家）"],
              accepted:["請問有人撿到蛙鏡嗎？","有人撿到蛙鏡嗎","有撿到蛙鏡嗎"], kw:["蛙鏡"],
              feedback:{ failed:"先到服務台問。可以說：「請問有人撿到蛙鏡嗎？」" } }),
            mkStep({ id:"describe_item", say:"我看看～是什麼顏色的蛙鏡？", task:"描述特徵",
              options:["藍色的，鏡帶上有寫名字","就蛙鏡的樣子","不記得了","很好看的那種"],
              accepted:["藍色的，鏡帶上有寫名字","藍色的有寫名字","藍色的蛙鏡"], kw:["藍色"],
              feedback:{ failed:"說出顏色等特徵。可以說：「藍色的，鏡帶上有寫名字」" } }),
            mkStep({ id:"thank_found", say:"找到了！是這支嗎？下次記得放置物櫃喔！", task:"道謝並回應建議",
              options:["是！謝謝你，下次我會放置物櫃","還好啦沒差","你們應該幫我保管","再見"],
              accepted:["是！謝謝你，下次我會放置物櫃","謝謝下次會放置物櫃","是的謝謝"], kw:["謝謝"],
              feedback:{ failed:"可以說：「是！謝謝你，下次我會放置物櫃」" } }),
            mkStep({ id:"review", say:"（想一想）東西不見了怎麼辦？", task:"說出方法",
              options:["到服務台說清楚特徵詢問","當作沒發生","懷疑別人偷的","馬上買新的"],
              accepted:["到服務台說清楚特徵詢問","到服務台說特徵詢問","去服務台問"], kw:["服務台"],
              feedback:{ perfect:"答對了！到服務台說清楚特徵，找回機會最大。", failed:"記住：東西不見先到服務台，說清楚特徵。" } }),
          ]
        }
      ]
    },

    {
      id: "amusement_park", name: "遊樂園", icon: "🎡", available: true,
      theme: { color: '#EA580C', bg: '#FFEDD5', accent: '#C2410C' },
      situations: [
        {
          id: "park_ticket", name: "哪種票划算", icon: "🎟️", clerkName: "遊樂園工作人員",
          desc: "單項券和一日券，算一算哪種划算",
          steps: [
            mkStep({ id:"compare_ticket", say:"歡迎！單項券一次50元，一日券350元玩到飽，要哪一種？", task:"想想玩幾項再決定",
              options:["我想玩很多項，一日券比較划算","便宜的那個","都買","你覺得呢"],
              accepted:["我想玩很多項，一日券比較划算","一日券比較划算","我買一日券"], kw:["一日券"],
              feedback:{ failed:"想玩超過七項，一日券就划算。可以說：「我想玩很多項，一日券比較划算」" } }),
            mkStep({ id:"pay_park", say:"一日券350元！", task:"付錢並確認找零",
              options:["這是400元，請找我50元","不用找了","（丟下錢跑去玩）","可以先玩再付嗎"],
              accepted:["這是400元，請找我50元","這是400元找我50元","請找我50元"], kw:["50元"],
              feedback:{ failed:"確認找零。可以說：「這是400元，請找我50元」" } }),
            mkStep({ id:"review", say:"（想一想）怎麼判斷哪種票划算？", task:"說出方法",
              options:["算一算玩幾項，比較哪種便宜","買最貴的就對","不用算隨便買","問別人買什麼跟著買"],
              accepted:["算一算玩幾項，比較哪種便宜","算玩幾項比較便宜","算一算再比較"], kw:["比較","算一算"],
              feedback:{ perfect:"答對了！先算玩幾項，比較哪種票划算。", failed:"記住：先算會玩幾項，再比較哪種票便宜。" } }),
          ]
        },
        {
          id: "park_height", name: "設施安全詢問", icon: "📏", clerkName: "遊樂園工作人員",
          desc: "先問限制、誠實回答，安全第一",
          steps: [
            mkStep({ id:"ask_limit", say:"（雲霄飛車入口）你好！", task:"問設施限制",
              options:["請問這個設施有什麼限制嗎？","直接排隊就對了","小孩都能玩吧","不用問啦"],
              accepted:["請問這個設施有什麼限制嗎？","有什麼限制嗎","有限制嗎"], kw:["限制"],
              feedback:{ failed:"玩之前先問限制。可以說：「請問這個設施有什麼限制嗎？」" } }),
            mkStep({ id:"answer_honest", say:"要140公分以上，心臟不好不能搭喔！你OK嗎？", task:"誠實回答",
              options:["我150公分，身體健康，可以搭","差一點點沒關係吧","幫我踮腳量","不知道耶"],
              accepted:["我150公分，身體健康，可以搭","我150公分可以搭","身高夠可以搭"], kw:["可以搭"],
              feedback:{ failed:"安全規定要誠實。可以說：「我150公分，身體健康，可以搭」" } }),
            mkStep({ id:"review", say:"（想一想）為什麼要遵守設施限制？", task:"說出理由",
              options:["是為了安全，不符合就不搭","工作人員找麻煩","規定參考用","排隊比較快"],
              accepted:["是為了安全，不符合就不搭","為了安全不符合就不搭","規定是為了安全"], kw:["安全"],
              feedback:{ perfect:"答對了！限制是為了安全，不符合就不搭。", failed:"記住：設施限制是保護你的安全。" } }),
          ]
        },
        {
          id: "park_lost", name: "和朋友走散了", icon: "😰", clerkName: "遊樂園工作人員",
          desc: "走散不亂跑：找工作人員、在原地等",
          steps: [
            mkStep({ id:"find_help", say:"（人好多，回頭朋友不見了！）", task:"找工作人員求助",
              options:["（找到工作人員）不好意思，我和朋友走散了","（到處亂跑找人）","大聲尖叫","自己回家"],
              accepted:["（找到工作人員）不好意思，我和朋友走散了","不好意思，我和朋友走散了","我和朋友走散了","和朋友走散了"], kw:["走散"],
              feedback:{ failed:"走散先找工作人員。可以說：「不好意思，我和朋友走散了」" } }),
            mkStep({ id:"give_phone", say:"別擔心！你有朋友的電話嗎？我幫你打！", task:"提供電話",
              options:["有，他的電話是0912345678","背不起來","電話是秘密","你用猜的"],
              accepted:["有，他的電話是0912345678","電話是0912345678","0912345678"], kw:["0912"],
              feedback:{ failed:"提供朋友電話。可以說：「有，他的電話是0912345678」" } }),
            mkStep({ id:"stay_here", say:"打通了！他過來找你，你在服務台這裡等，不要走開喔！", task:"說好會在原地等",
              options:["好，我在服務台等，不走開","我去找他比較快","繞一圈再回來","好無聊喔"],
              accepted:["好，我在服務台等，不走開","在服務台等不走開","我在原地等"], kw:["服務台等","原地等"],
              feedback:{ failed:"待在原地最容易被找到。可以說：「好，我在服務台等，不走開」" } }),
            mkStep({ id:"review", say:"（想一想）走散了怎麼辦？", task:"說出方法",
              options:["找工作人員幫忙，在原地等","到處跑來跑去找","哭著自己回家","不理朋友了"],
              accepted:["找工作人員幫忙，在原地等","找工作人員在原地等","找工作人員幫忙"], kw:["工作人員"],
              feedback:{ perfect:"答對了！找工作人員幫忙，在原地等候。", failed:"記住：走散了找工作人員，然後在原地等。" } }),
          ]
        }
      ]
    },

    {
      id: "arcade", name: "電子遊樂場", icon: "🕹️", available: true,
      theme: { color: '#9333EA', bg: '#F3E8FF', accent: '#7E22CE' },
      situations: [
        {
          id: "arcade_token", name: "換代幣", icon: "🪙", clerkName: "遊樂場店員",
          desc: "換代幣前先設預算，換剛好就好",
          steps: [
            mkStep({ id:"ask_token", say:"歡迎光臨！這裡玩遊戲要用代幣喔！", task:"問怎麼換",
              options:["請問代幣怎麼換？","機器直接投鈔票吧","先玩再換","送我幾個"],
              accepted:["請問代幣怎麼換？","代幣怎麼換","怎麼換代幣"], kw:["代幣"],
              feedback:{ failed:"先問清楚。可以說：「請問代幣怎麼換？」" } }),
            mkStep({ id:"exchange_some", say:"100元換10個代幣！", task:"控制預算換剛好",
              options:["我換100元就好，控制預算","換500元玩個夠","全部零用錢都換","先欠著"],
              accepted:["我換100元就好，控制預算","換100元就好","我換100元"], kw:["100元"],
              feedback:{ failed:"一次換太多容易花過頭。可以說：「我換100元就好，控制預算」" } }),
            mkStep({ id:"review", say:"（想一想）為什麼不一次換太多代幣？", task:"說出理由",
              options:["換多容易玩過頭，先設好預算","代幣會過期","拿著太重","店員會笑"],
              accepted:["換多容易玩過頭，先設好預算","先設好預算","換多容易玩過頭"], kw:["預算","玩過頭"],
              feedback:{ perfect:"答對了！先設預算，換剛好就好。", failed:"記住：先設好預算，代幣換剛好就好。" } }),
          ]
        },
        {
          id: "arcade_stop", name: "夾娃娃要停損", icon: "🧸", clerkName: "遊樂場店員",
          desc: "玩之前設上限，說到做到守住預算",
          steps: [
            mkStep({ id:"set_limit", say:"（夾娃娃機好可愛！你有10個代幣）", task:"先設上限",
              options:["我最多夾5次，夾不到就停","夾到為止！","10個全部投","跟機台拼了"],
              accepted:["我最多夾5次，夾不到就停","最多夾5次夾不到就停","最多夾5次"], kw:["5次","就停"],
              feedback:{ failed:"玩之前先設上限。可以說：「我最多夾5次，夾不到就停」" } }),
            mkStep({ id:"keep_promise", say:"（5次都沒夾到…好想再試一次！）", task:"遵守約定停手",
              options:["說好5次就5次，我停手","再一次就好","把剩的全投了","借代幣繼續"],
              accepted:["說好5次就5次，我停手","說好5次就停手","我停手"], kw:["停手","就停"],
              feedback:{ failed:"說到做到最厲害。可以說：「說好5次就5次，我停手」" } }),
            mkStep({ id:"feel_good", say:"（雖然沒夾到，但你守住了約定）", task:"說出正向想法",
              options:["沒夾到沒關係，我守住了預算","我是失敗者","機台壞掉害的","下次投100次"],
              accepted:["沒夾到沒關係，我守住了預算","沒夾到沒關係守住預算","守住了預算"], kw:["守住","預算"],
              feedback:{ failed:"守住預算就是贏。可以說：「沒夾到沒關係，我守住了預算」" } }),
            mkStep({ id:"review", say:"（想一想）夾娃娃機為什麼要設上限？", task:"說出理由",
              options:["它很難夾到，不設限會花光錢","上限是給小孩的","設了比較好夾","店員規定的"],
              accepted:["它很難夾到，不設限會花光錢","不設限會花光錢","很難夾到要設上限"], kw:["花光","設上限"],
              feedback:{ perfect:"答對了！夾娃娃很難中，設好上限才不會花光錢。", failed:"記住：夾娃娃很難夾中，先設上限、守住預算。" } }),
          ]
        },
        {
          id: "arcade_eat_coin", name: "機台吃錢了", icon: "😤", clerkName: "遊樂場店員",
          desc: "機台故障不動手，找店員處理",
          steps: [
            mkStep({ id:"tell_broken", say:"（投了代幣，機台卻沒反應…）", task:"找店員說明",
              options:["店員，這台機器吃了我的代幣","（用力拍機台）","（踢機器）","自認倒楣"],
              accepted:["店員，這台機器吃了我的代幣","機台吃代幣了","代幣投了沒反應"], kw:["吃了我的代幣","吃代幣","沒反應"],
              feedback:{ failed:"機台故障找店員處理。可以說：「店員，這台機器吃了我的代幣」" } }),
            mkStep({ id:"thank_fix", say:"抱歉抱歉！我檢查一下…好了，還你一個代幣！", task:"道謝",
              options:["謝謝你！","早該修了","賠我兩個","哼"],
              accepted:["謝謝你！","謝謝","謝謝你"], kw:["謝謝"],
              feedback:{ failed:"可以說：「謝謝你！」" } }),
            mkStep({ id:"review", say:"（想一想）機器故障怎麼辦？", task:"說出方法",
              options:["不拍不踢，找店員處理","用力拍就會好","踢一腳試試","走掉算了"],
              accepted:["不拍不踢，找店員處理","找店員處理","不拍不踢找店員"], kw:["店員"],
              feedback:{ perfect:"答對了！機器故障不動手，找店員處理。", failed:"記住：機器故障不要拍打，找店員處理。" } }),
          ]
        }
      ]
    },

    {
      id: "comic_store", name: "漫畫店", icon: "📚", available: true,
      theme: { color: '#16A34A', bg: '#DCFCE7', accent: '#15803D' },
      situations: [
        {
          id: "comic_rent", name: "租漫畫", icon: "📖", clerkName: "漫畫店店員",
          desc: "認識「租」：要歸還、有押金、比較便宜",
          steps: [
            mkStep({ id:"ask_rent", say:"歡迎光臨！想找什麼書呢？", task:"問租書規則",
              options:["請問租漫畫怎麼算錢？","白看可以嗎","這裡是圖書館吧","隨便逛逛"],
              accepted:["請問租漫畫怎麼算錢？","租漫畫怎麼算錢","租書怎麼算"], kw:["怎麼算"],
              feedback:{ failed:"先問規則。可以說：「請問租漫畫怎麼算錢？」" } }),
            mkStep({ id:"know_deposit2", say:"一本一天10元，要先付100元押金辦租書證喔！", task:"確認押金規則",
              options:["好，押金退證的時候會還我對嗎？","100元被你賺走了","太貴不租了","不辦證直接拿走"],
              accepted:["好，押金退證的時候會還我對嗎？","押金會還我對嗎","退證會還押金嗎"], kw:["押金"],
              feedback:{ failed:"押金會退回。可以說：「好，押金退證的時候會還我對嗎？」" } }),
            mkStep({ id:"pay_rent", say:"對！這本租三天，30元！", task:"付錢",
              options:["好，這是30元","10元租到飽吧","看完再付","借我錢"],
              accepted:["好，這是30元","這是30元","給你30元"], kw:["30"],
              feedback:{ failed:"付租金。可以說：「好，這是30元」" } }),
            mkStep({ id:"review", say:"（想一想）租東西和買東西差在哪？", task:"說出差異",
              options:["租的要歸還，價錢比較便宜","一樣的意思","租的可以不還","買比較便宜"],
              accepted:["租的要歸還，價錢比較便宜","租的要歸還比較便宜","租要歸還"], kw:["歸還"],
              feedback:{ perfect:"答對了！租的要歸還，所以價錢便宜。", failed:"記住：租＝借用要歸還，買＝自己的。" } }),
          ]
        },
        {
          id: "comic_overdue", name: "還書遲到了", icon: "😓", clerkName: "漫畫店店員",
          desc: "逾期主動道歉、付逾期費，負起責任",
          steps: [
            mkStep({ id:"admit_late", say:"（糟糕，說好三天，第五天才來還…）", task:"主動道歉說明",
              options:["不好意思，我遲了兩天還書","（把書丟著就跑）","書不是我租的","你們沒提醒我"],
              accepted:["不好意思，我遲了兩天還書","我遲了兩天還書","遲還了對不起"], kw:["遲","還書"],
              feedback:{ failed:"遲了就誠實道歉。可以說：「不好意思，我遲了兩天還書」" } }),
            mkStep({ id:"pay_fee", say:"沒關係，誠實很好！補逾期費一天10元，兩天20元喔！", task:"付逾期費",
              options:["好，這是20元逾期費","可以不要付嗎","下次一起算","好貴喔不想付"],
              accepted:["好，這是20元逾期費","這是20元逾期費","付20元"], kw:["20元"],
              feedback:{ failed:"逾期費要補。可以說：「好，這是20元逾期費」" } }),
            mkStep({ id:"review", say:"（想一想）跟人約好的時間做不到怎麼辦？", task:"說出方法",
              options:["誠實說明道歉，該補的補","裝作忘記","怪別人沒提醒","再也不去那家店"],
              accepted:["誠實說明道歉，該補的補","誠實道歉該補的補","誠實說明道歉"], kw:["誠實","道歉"],
              feedback:{ perfect:"答對了！誠實道歉，該負的責任要負。", failed:"記住：做不到就誠實道歉，該補的責任要補。" } }),
          ]
        },
        {
          id: "comic_member", name: "辦會員卡", icon: "💳", clerkName: "漫畫店店員",
          desc: "分辨合理與不合理的個資要求",
          steps: [
            mkStep({ id:"ask_member", say:"對了，我們有會員卡，租十送一喔！要辦嗎？", task:"問辦卡條件",
              options:["請問辦會員卡要錢嗎？","馬上辦十張","不用問直接辦","會員都是騙人的"],
              accepted:["請問辦會員卡要錢嗎？","辦會員卡要錢嗎","辦卡要費用嗎"], kw:["要錢","費用"],
              feedback:{ failed:"先問條件。可以說：「請問辦會員卡要錢嗎？」" } }),
            mkStep({ id:"judge_info", say:"免費辦卡！只要留姓名和電話就可以囉！", task:"判斷合理後同意",
              options:["好，常來租的話很划算，我辦","電話幹嘛給你","把我家地址身分證都給你","不辦，什麼資料都不給"],
              accepted:["好，常來租的話很划算，我辦","常來很划算我辦","好我要辦"], kw:["我辦","要辦"],
              feedback:{ failed:"店家辦會員留姓名電話是常見合理的，跟詐騙要密碼不一樣。可以說：「好，常來租的話很划算，我辦」" } }),
            mkStep({ id:"thank_gift", say:"辦好了！這次租書就先送你一張貼紙！", task:"道謝",
              options:["謝謝你！","貼紙好醜","就這樣？","再送一張"],
              accepted:["謝謝你！","謝謝","謝謝你"], kw:["謝謝"],
              feedback:{ failed:"可以說：「謝謝你！」" } }),
            mkStep({ id:"review", say:"（想一想）哪些個資可以給、哪些絕對不行？", task:"說出分辨",
              options:["店家辦會員留名字電話合理；密碼驗證碼絕不能給","什麼都不能給","什麼都可以給","看心情"],
              accepted:["店家辦會員留名字電話合理；密碼驗證碼絕不能給","名字電話合理密碼絕不能給","會員留電話合理密碼不行"], kw:["密碼","合理"],
              feedback:{ perfect:"答對了！一般會員留名字電話合理，但密碼、驗證碼絕對不能給。", failed:"記住：辦會員留名字電話常見合理；密碼、驗證碼給了錢會被偷。" } }),
          ]
        }
      ]
    },

    {
      id: "job_interview", name: "打工面試", icon: "🤝", available: true,
      theme: { color: '#2563EB', bg: '#DBEAFE', accent: '#1D4ED8' },
      situations: [
        {
          id: "interview_intro", name: "自我介紹", icon: "🙋", clerkName: "店長",
          desc: "面試時說清楚名字、會什麼、為什麼想來",
          steps: [
            mkStep({ id:"greet_intro", say:"你好，請坐！先自我介紹一下吧！", task:"說名字和應徵職位",
              options:["店長好，我是小安，來應徵假日工讀","（低頭不說話）","你先說","履歷上都有寫啊"],
              accepted:["店長好，我是小安，來應徵假日工讀","我是小安來應徵工讀","我是小安"], kw:["小安"],
              feedback:{ failed:"面試先報名字和來意。可以說：「店長好，我是小安，來應徵假日工讀」" } }),
            mkStep({ id:"say_skill", say:"小安你好！說說看你會什麼？", task:"說會做的事",
              options:["我會整理貨架，也會打掃，做事很仔細","什麼都會","不知道耶","薪水多少先說"],
              accepted:["我會整理貨架，也會打掃，做事很仔細","我會整理貨架和打掃","做事很仔細"], kw:["整理","仔細"],
              feedback:{ failed:"說具體會做的事。可以說：「我會整理貨架，也會打掃，做事很仔細」" } }),
            mkStep({ id:"why_work", say:"為什麼想來打工呢？", task:"說出動機",
              options:["我想學習工作，自己賺零用錢","爸媽逼的","無聊","不知道"],
              accepted:["我想學習工作，自己賺零用錢","想學習工作自己賺錢","想自己賺零用錢"], kw:["賺","學習"],
              feedback:{ failed:"說出正向的動機。可以說：「我想學習工作，自己賺零用錢」" } }),
            mkStep({ id:"review", say:"（想一想）面試自我介紹要說什麼？", task:"說出重點",
              options:["名字、會什麼、為什麼想來","越少越好","隨便聊","背成語"],
              accepted:["名字、會什麼、為什麼想來","名字會什麼為什麼想來","說名字和會的事"], kw:["名字","會什麼"],
              feedback:{ perfect:"答對了！名字、會什麼、為什麼想來。", failed:"記住：自我介紹說名字、會什麼、為什麼想來。" } }),
          ]
        },
        {
          id: "interview_answer", name: "回答問題", icon: "💬", clerkName: "店長",
          desc: "誠實具體回答時段、通勤等問題",
          steps: [
            mkStep({ id:"say_time", say:"很好！你什麼時間可以來上班？", task:"說可工作時段",
              options:["週六和週日的下午我可以","隨時都行吧","看心情","你排我就來"],
              accepted:["週六和週日的下午我可以","週六週日下午可以","週末下午可以"], kw:["週六","週末"],
              feedback:{ failed:"說清楚可以的時段。可以說：「週六和週日的下午我可以」" } }),
            mkStep({ id:"say_commute", say:"那你怎麼來上班呢？", task:"說通勤方式",
              options:["我搭公車來，大概20分鐘","用飛的","很遠很麻煩","家人載看心情"],
              accepted:["我搭公車來，大概20分鐘","搭公車來20分鐘","我搭公車來"], kw:["公車"],
              feedback:{ failed:"說清楚怎麼到。可以說：「我搭公車來，大概20分鐘」" } }),
            mkStep({ id:"wait_result", say:"好！我們會再通知你，這週內會打電話給你！", task:"確認並道謝",
              options:["好的，謝謝店長，我等您電話","現在就告訴我","不錄取我就投訴","喔"],
              accepted:["好的，謝謝店長，我等您電話","謝謝店長我等您電話","好的謝謝"], kw:["謝謝"],
              feedback:{ failed:"可以說：「好的，謝謝店長，我等您電話」" } }),
            mkStep({ id:"review", say:"（想一想）回答面試問題的重點？", task:"說出重點",
              options:["誠實回答，說得具體清楚","隨便答","答非所問","都說不知道"],
              accepted:["誠實回答，說得具體清楚","誠實回答具體清楚","誠實又具體"], kw:["誠實","具體"],
              feedback:{ perfect:"答對了！誠實回答，說得具體清楚。", failed:"記住：面試回答要誠實、具體。" } }),
          ]
        },
        {
          id: "interview_ask", name: "問清楚條件", icon: "💰", clerkName: "店長",
          desc: "問時薪與發薪日；遇到要先繳錢的要小心",
          steps: [
            mkStep({ id:"ask_pay", say:"OK！那你還有什麼想問的嗎？", task:"問時薪與發薪日",
              options:["請問時薪多少？什麼時候發薪水？","沒有問題","可以偷吃東西嗎","幾點下班就好"],
              accepted:["請問時薪多少？什麼時候發薪水？","時薪多少什麼時候發薪","請問時薪多少"], kw:["時薪"],
              feedback:{ failed:"工作條件要問清楚。可以說：「請問時薪多少？什麼時候發薪水？」" } }),
            mkStep({ id:"confirm_pay", say:"時薪190元，每月10號發薪，做滿一個月喔！", task:"複誦確認",
              options:["時薪190元，10號發薪，對嗎？","隨便都可以","太少了吧","現金先給我"],
              accepted:["時薪190元，10號發薪，對嗎？","時薪190元10號發薪對嗎","190元10號發薪"], kw:["190"],
              feedback:{ failed:"複誦一次確認。可以說：「時薪190元，10號發薪，對嗎？」" } }),
            mkStep({ id:"uniform_fee", say:"對了，制服要先跟你收500元喔！", task:"先不答應，說要問家人",
              options:["這個我要回家問過家人再決定","好，馬上給你500","應該要繳的吧","先欠著之後扣薪水"],
              accepted:["這個我要回家問過家人再決定","回家問過家人再決定","我要先問家人"], kw:["問過家人","問家人"],
              feedback:{ failed:"上班前要先繳錢的都要小心。可以說：「這個我要回家問過家人再決定」" } }),
            mkStep({ id:"review", say:"（想一想）面試遇到要先繳錢的怎麼辦？", task:"說出方法",
              options:["先不答應，回家問大人","馬上繳表示誠意","借錢也要繳","繳了才有工作"],
              accepted:["先不答應，回家問大人","先不答應回家問大人","回家問大人"], kw:["問大人"],
              feedback:{ perfect:"答對了！要先繳錢的工作先問大人，多半有問題。", failed:"記住：先繳錢才能上班的，先回家問大人再決定。" } }),
          ]
        }
      ]
    },

    {
      id: "first_day", name: "第一天報到", icon: "📋", available: true,
      theme: { color: '#0D9488', bg: '#CCFBF1', accent: '#0F766E' },
      situations: [
        {
          id: "greet_all", name: "跟大家打招呼", icon: "👋", clerkName: "前輩同事",
          desc: "主動打招呼，留下好印象",
          steps: [
            mkStep({ id:"intro_team", say:"（第一天上班，前輩帶你認識大家）來，這是新同事！", task:"跟大家自我介紹",
              options:["大家好，我是小安，請多多指教","（躲在後面）","嗨","你們是誰"],
              accepted:["大家好，我是小安，請多多指教","大家好我是小安請多指教","我是小安請多指教"], kw:["小安","指教"],
              feedback:{ failed:"主動打招呼。可以說：「大家好，我是小安，請多多指教」" } }),
            mkStep({ id:"reply_welcome", say:"歡迎歡迎！有問題都可以問我們喔！", task:"回應並道謝",
              options:["謝謝大家，我會努力學習","應該的","好喔","不會有問題啦"],
              accepted:["謝謝大家，我會努力學習","謝謝大家我會努力學習","謝謝大家"], kw:["謝謝"],
              feedback:{ failed:"可以說：「謝謝大家，我會努力學習」" } }),
            mkStep({ id:"review", say:"（想一想）到新環境的第一步是什麼？", task:"說出重點",
              options:["主動打招呼，留下好印象","等別人來認識我","裝忙","躲起來"],
              accepted:["主動打招呼，留下好印象","主動打招呼","主動打招呼留好印象"], kw:["打招呼"],
              feedback:{ perfect:"答對了！主動打招呼，留下好印象。", failed:"記住：新環境先主動打招呼。" } }),
          ]
        },
        {
          id: "listen_task", name: "聽工作說明", icon: "📝", clerkName: "前輩同事",
          desc: "聽指令複誦重點，不懂就問",
          steps: [
            mkStep({ id:"repeat_task", say:"你今天的工作是把飲料補到冰箱，日期舊的放前面喔！", task:"複誦確認",
              options:["好，補飲料到冰箱，舊的放前面，對嗎？","知道了啦","太簡單了","（點頭就走）"],
              accepted:["好，補飲料到冰箱，舊的放前面，對嗎？","補飲料舊的放前面對嗎","舊的放前面對嗎"], kw:["舊的放前面"],
              feedback:{ failed:"複誦重點確認。可以說：「好，補飲料到冰箱，舊的放前面，對嗎？」" } }),
            mkStep({ id:"ask_where", say:"沒錯！很會聽重點喔！", task:"問飲料去哪裡搬",
              options:["請問飲料要去哪裡搬？","我自己找找","應該在某處吧","等等再說"],
              accepted:["請問飲料要去哪裡搬？","飲料去哪裡搬","去哪裡搬飲料"], kw:["哪裡搬"],
              feedback:{ failed:"不知道就問。可以說：「請問飲料要去哪裡搬？」" } }),
            mkStep({ id:"review", say:"（想一想）聽工作指令的訣竅？", task:"說出方法",
              options:["複誦一次重點，不懂就問","記在心裡就好","邊聽邊滑手機","猜猜看"],
              accepted:["複誦一次重點，不懂就問","複誦重點不懂就問","複誦一次重點"], kw:["複誦"],
              feedback:{ perfect:"答對了！複誦重點、不懂就問。", failed:"記住：聽完指令複誦一次，不懂馬上問。" } }),
          ]
        },
        {
          id: "ask_stuff", name: "問制服與置物", icon: "👕", clerkName: "前輩同事",
          desc: "問清楚換裝與物品放置，儀容整齊",
          steps: [
            mkStep({ id:"ask_uniform", say:"對了，這是你的制服和名牌！", task:"問哪裡換衣服、包包放哪",
              options:["請問哪裡可以換衣服、包包放哪裡？","直接在這換","包包背著工作","名牌好醜"],
              accepted:["請問哪裡可以換衣服、包包放哪裡？","哪裡換衣服包包放哪","哪裡可以換衣服"], kw:["換衣服"],
              feedback:{ failed:"問清楚再行動。可以說：「請問哪裡可以換衣服、包包放哪裡？」" } }),
            mkStep({ id:"go_change", say:"員工休息室在後面，有你的置物櫃！", task:"道謝並去準備",
              options:["謝謝，我去換好就開始工作","休息室先睡一下","置物櫃是我的了","喔"],
              accepted:["謝謝，我去換好就開始工作","換好就開始工作","謝謝我去換"], kw:["換好","謝謝"],
              feedback:{ failed:"可以說：「謝謝，我去換好就開始工作」" } }),
            mkStep({ id:"review", say:"（想一想）上班的服裝儀容？", task:"說出重點",
              options:["照規定穿制服，整齊乾淨","穿自己喜歡的","髒了也沒差繼續穿","不戴名牌"],
              accepted:["照規定穿制服，整齊乾淨","照規定穿制服整齊乾淨","照規定穿制服"], kw:["制服","整齊"],
              feedback:{ perfect:"答對了！照規定穿制服，保持整齊乾淨。", failed:"記住：照規定穿制服，整齊乾淨是基本。" } }),
          ]
        }
      ]
    },

    {
      id: "ask_at_work", name: "不懂就問", icon: "🙋", available: true,
      theme: { color: '#F59E0B', bg: '#FEF3C7', accent: '#B45309' },
      situations: [
        {
          id: "not_understand", name: "聽不懂指令", icon: "🤔", clerkName: "資深同事",
          desc: "聽不懂就請對方再說一次，不用猜的",
          steps: [
            mkStep({ id:"ask_again", say:"小安，去把那個『棧板』上的貨搬過來！", task:"聽不懂請再說一次",
              options:["不好意思，什麼是棧板？可以再說一次嗎？","（隨便搬個東西）","喔好（其實聽不懂）","自己用猜的"],
              accepted:["不好意思，什麼是棧板？可以再說一次嗎？","什麼是棧板可以再說一次嗎","可以再說一次嗎"], kw:["再說一次","棧板"],
              feedback:{ failed:"聽不懂馬上問。可以說：「不好意思，什麼是棧板？可以再說一次嗎？」" } }),
            mkStep({ id:"got_it", say:"喔！就是地上那個木頭墊板，貨都疊在上面！", task:"確認聽懂並行動",
              options:["我懂了，木頭墊板上的貨，馬上搬","還是不懂但算了","木頭喔","（發呆）"],
              accepted:["我懂了，木頭墊板上的貨，馬上搬","懂了木頭墊板上的貨","我懂了馬上搬"], kw:["懂了"],
              feedback:{ failed:"聽懂了就回應。可以說：「我懂了，木頭墊板上的貨，馬上搬」" } }),
            mkStep({ id:"review", say:"（想一想）聽不懂指令怎麼辦？", task:"說出方法",
              options:["馬上問清楚，不要用猜的","假裝懂","隨便做","等被罵"],
              accepted:["馬上問清楚，不要用猜的","馬上問清楚不用猜","問清楚不要猜"], kw:["問清楚"],
              feedback:{ perfect:"答對了！馬上問清楚，不要用猜的。", failed:"記住：聽不懂就問，用猜的容易做錯。" } }),
          ]
        },
        {
          id: "made_mistake", name: "做錯了", icon: "😅", clerkName: "資深同事",
          desc: "做錯主動承認，問清楚怎麼改",
          steps: [
            mkStep({ id:"admit_wrong", say:"（糟糕，你把日期新的飲料放前面了，前輩發現了）", task:"主動承認錯誤",
              options:["對不起，我放錯了，馬上重排","不是我放的","本來就這樣","誰規定的"],
              accepted:["對不起，我放錯了，馬上重排","對不起放錯了馬上重排","對不起我放錯了"], kw:["對不起","放錯"],
              feedback:{ failed:"做錯就承認。可以說：「對不起，我放錯了，馬上重排」" } }),
            mkStep({ id:"know_why", say:"沒關係，新人都會錯！記得舊的放前面，客人才會先買到舊的！", task:"確認原因",
              options:["我懂了，舊的先賣掉才不會過期","規則好多喔","隨便放不行嗎","喔"],
              accepted:["我懂了，舊的先賣掉才不會過期","舊的先賣掉才不會過期","懂了不會過期"], kw:["過期"],
              feedback:{ failed:"了解原因才記得住。可以說：「我懂了，舊的先賣掉才不會過期」" } }),
            mkStep({ id:"review", say:"（想一想）工作做錯了怎麼辦？", task:"說出方法",
              options:["主動承認，問清楚怎麼改","藏起來","怪別人","裝沒事"],
              accepted:["主動承認，問清楚怎麼改","主動承認問怎麼改","主動承認錯誤"], kw:["主動承認"],
              feedback:{ perfect:"答對了！主動承認，問清楚怎麼改。", failed:"記住：做錯了主動承認，學會怎麼改。" } }),
          ]
        },
        {
          id: "cant_operate", name: "不會操作機器", icon: "🖨️", clerkName: "資深同事",
          desc: "請人示範、自己試做、說謝謝",
          steps: [
            mkStep({ id:"ask_demo", say:"幫我用這台標價機打一下價格標！", task:"請對方示範",
              options:["我還不會用，可以示範一次給我看嗎？","（亂按一通）","我不要用機器","叫別人做"],
              accepted:["我還不會用，可以示範一次給我看嗎？","可以示範一次給我看嗎","不會用可以示範嗎"], kw:["示範"],
              feedback:{ failed:"不會就請人示範。可以說：「我還不會用，可以示範一次給我看嗎？」" } }),
            mkStep({ id:"try_it", say:"看好喔…這樣就好了！換你試試！", task:"試做並請對方提醒",
              options:["好，我試試看，做錯請提醒我","不用看著我啦","好緊張不敢用","你再做一次"],
              accepted:["好，我試試看，做錯請提醒我","我試試看做錯請提醒","我試試看"], kw:["試試"],
              feedback:{ failed:"勇敢試做。可以說：「好，我試試看，做錯請提醒我」" } }),
            mkStep({ id:"thank_teach", say:"上手了嘛！學得很快！", task:"道謝",
              options:["謝謝前輩教我！","小事一樁","我本來就會","嗯"],
              accepted:["謝謝前輩教我！","謝謝","謝謝前輩"], kw:["謝謝"],
              feedback:{ failed:"可以說：「謝謝前輩教我！」" } }),
            mkStep({ id:"review", say:"（想一想）學新技能的三步驟？", task:"說出步驟",
              options:["請人示範、自己試做、說謝謝","直接上手","看一眼就會","躲開不學"],
              accepted:["請人示範、自己試做、說謝謝","示範試做說謝謝","請人示範自己試做"], kw:["示範","試做"],
              feedback:{ perfect:"答對了！請人示範、自己試做、說謝謝。", failed:"記住：示範→試做→道謝，新技能就學會了。" } }),
          ]
        }
      ]
    },

    {
      id: "call_leave", name: "打電話請假", icon: "📞", available: true,
      theme: { color: '#DC2626', bg: '#FEF2F2', accent: '#991B1B' },
      situations: [
        {
          id: "sick_leave", name: "生病請假", icon: "🤒", clerkName: "店長",
          desc: "提早打電話、說清楚原因",
          steps: [
            mkStep({ id:"call_sick", say:"（你發燒了，明天要上班…打電話給店長）喂，你好！", task:"表明身分說明請假",
              options:["店長好，我是小安，我發燒了，明天想請病假","明天我不去了喔（掛斷）","（傳貼圖就好）","不去就知道了吧"],
              accepted:["店長好，我是小安，我發燒了，明天想請病假","我是小安發燒了想請病假","我發燒了想請假"], kw:["請病假","請假"],
              feedback:{ failed:"請假要說清楚。可以說：「店長好，我是小安，我發燒了，明天想請病假」" } }),
            mkStep({ id:"say_proof", say:"好，知道了！你好好休息，記得看醫生喔！", task:"道謝並說會附證明",
              options:["謝謝店長，我看完醫生會傳診斷證明","不用看醫生啦","好了再說","喔耶放假"],
              accepted:["謝謝店長，我看完醫生會傳診斷證明","謝謝會傳診斷證明","謝謝店長"], kw:["謝謝"],
              feedback:{ failed:"可以說：「謝謝店長，我看完醫生會傳診斷證明」" } }),
            mkStep({ id:"review", say:"（想一想）請假的重點是什麼？", task:"說出重點",
              options:["提早說、講清楚原因和天數","當天不出現就好","叫同學代打電話","傳個貼圖"],
              accepted:["提早說、講清楚原因和天數","提早說清楚原因天數","提早說講清楚原因"], kw:["提早","原因"],
              feedback:{ perfect:"答對了！提早說、講清楚原因和天數。", failed:"記住：請假要提早、親自說、講清楚原因。" } }),
          ]
        },
        {
          id: "sudden_leave", name: "臨時有事", icon: "😣", clerkName: "店長",
          desc: "誠心道歉、主動配合補班",
          steps: [
            mkStep({ id:"call_sudden", say:"（家裡臨時有急事，今天的班沒辦法上了）喂？", task:"道歉說明並問補班",
              options:["店長對不起，家裡有急事，今天沒辦法上班，需要補班嗎？","今天不來了","有事，先這樣","你自己想辦法"],
              accepted:["店長對不起，家裡有急事，今天沒辦法上班，需要補班嗎？","對不起家裡有急事需要補班嗎","對不起今天沒辦法上班"], kw:["對不起","急事"],
              feedback:{ failed:"臨時請假更要道歉。可以說：「店長對不起，家裡有急事，今天沒辦法上班，需要補班嗎？」" } }),
            mkStep({ id:"agree_makeup", say:"了解，臨時有事沒辦法！我找人代班，你下週六補班好嗎？", task:"答應補班並道謝",
              options:["好的，下週六我一定到，謝謝店長","再看看","不要啦","隨便"],
              accepted:["好的，下週六我一定到，謝謝店長","下週六一定到謝謝","好的下週六到"], kw:["下週六"],
              feedback:{ failed:"配合補班。可以說：「好的，下週六我一定到，謝謝店長」" } }),
            mkStep({ id:"review", say:"（想一想）臨時請假的態度？", task:"說出重點",
              options:["誠心道歉，主動配合補班","請假是我的權利","沒什麼好說的","消失就好"],
              accepted:["誠心道歉，主動配合補班","誠心道歉配合補班","道歉並配合補班"], kw:["道歉","補班"],
              feedback:{ perfect:"答對了！誠心道歉，主動配合補班。", failed:"記住：臨時請假要誠心道歉、配合補班。" } }),
          ]
        },
        {
          id: "late_notice", name: "要遲到了", icon: "⏰", clerkName: "店長",
          desc: "遲到先通知，預估到達時間",
          steps: [
            mkStep({ id:"call_late", say:"（公車誤點，上班要遲到了…先打電話）喂？", task:"先通知並預估時間",
              options:["店長，公車誤點，我大概晚15分鐘到，很抱歉","反正會到","（不打電話，用跑的）","都是公車的錯"],
              accepted:["店長，公車誤點，我大概晚15分鐘到，很抱歉","公車誤點晚15分鐘到很抱歉","我會晚15分鐘到"], kw:["15分"],
              feedback:{ failed:"要遲到先通知。可以說：「店長，公車誤點，我大概晚15分鐘到，很抱歉」" } }),
            mkStep({ id:"arrive_soon", say:"沒問題，路上小心，不用跑！", task:"道謝",
              options:["謝謝店長，我盡快到","那我慢慢走","下次還是會遲到","好喔"],
              accepted:["謝謝店長，我盡快到","謝謝我盡快到","謝謝店長"], kw:["謝謝"],
              feedback:{ failed:"可以說：「謝謝店長，我盡快到」" } }),
            mkStep({ id:"review", say:"（想一想）為什麼遲到要先通知？", task:"說出理由",
              options:["讓店裡能先安排，也表示負責","不通知也沒差","通知了就不算遲到","怕被罵而已"],
              accepted:["讓店裡能先安排，也表示負責","讓店裡先安排表示負責","先通知表示負責"], kw:["安排","負責"],
              feedback:{ perfect:"答對了！先通知讓店裡能安排，也表示負責。", failed:"記住：要遲到先通知、預估時間，這是負責任。" } }),
          ]
        }
      ]
    },

    {
      id: "get_paid", name: "領薪水", icon: "💵", available: true,
      theme: { color: '#65A30D', bg: '#ECFCCB', accent: '#4D7C0F' },
      situations: [
        {
          id: "check_pay", name: "核對薪資", icon: "🧮", clerkName: "會計阿姨",
          desc: "時薪×時數自己算一次，當面點清楚",
          steps: [
            mkStep({ id:"count_first", say:"小安，這是你這個月的薪水袋，時薪190元、你做了20小時！", task:"自己算一次總額",
              options:["190乘20，應該是3800元對嗎？","多少都行","不用算啦","直接收走"],
              accepted:["190乘20，應該是3800元對嗎？","190乘20是3800對嗎","應該是3800元"], kw:["3800"],
              feedback:{ failed:"自己的薪水自己算。可以說：「190乘20，應該是3800元對嗎？」" } }),
            mkStep({ id:"count_cash", say:"沒錯，3800元！當面點一點喔！", task:"當面點錢",
              options:["好，我當面數一下…3800元沒錯","不用啦相信你","回家再看","（塞進口袋）"],
              accepted:["好，我當面數一下…3800元沒錯","當面數一下3800沒錯","我數一下"], kw:["數一下","3800"],
              feedback:{ failed:"當面點清楚。可以說：「好，我當面數一下…3800元沒錯」" } }),
            mkStep({ id:"review", say:"（想一想）領薪水要做什麼？", task:"說出重點",
              options:["自己算一次，當面點清楚","拿了就跑","不好意思數","都給媽媽處理"],
              accepted:["自己算一次，當面點清楚","算一次當面點清楚","自己算當面點"], kw:["當面","算"],
              feedback:{ perfect:"答對了！自己算一次，當面點清楚。", failed:"記住：領薪水先自己算，再當面點清楚。" } }),
          ]
        },
        {
          id: "pay_wrong", name: "薪水算錯了", icon: "😲", clerkName: "會計阿姨",
          desc: "發現金額不對，有禮貌反映請對方確認",
          steps: [
            mkStep({ id:"speak_up", say:"（你算出來是3800，但袋子裡只有3600元…）", task:"有禮貌反映",
              options:["不好意思，我算是3800，這裡只有3600，可以再確認嗎？","你少給我錢！","算了自認倒楣","偷偷再拿別的"],
              accepted:["不好意思，我算是3800，這裡只有3600，可以再確認嗎？","我算是3800這裡只有3600可以確認嗎","少了可以再確認嗎"], kw:["3600","確認"],
              feedback:{ failed:"發現不對有禮貌說。可以說：「不好意思，我算是3800，這裡只有3600，可以再確認嗎？」" } }),
            mkStep({ id:"accept_fix", say:"哎呀真的耶，是我數錯了！補你200元，謝謝你有算！", task:"接受並道謝",
              options:["沒關係，謝謝店長","早就該給了","罰你雙倍","下次再錯試試看"],
              accepted:["沒關係，謝謝店長","沒關係謝謝","謝謝"], kw:["謝謝"],
              feedback:{ failed:"可以說：「沒關係，謝謝店長」" } }),
            mkStep({ id:"review", say:"（想一想）發現錢不對要怎麼說？", task:"說出方法",
              options:["有禮貌地說出來，請對方確認","大聲罵人","忍住不說","上網公審"],
              accepted:["有禮貌地說出來，請對方確認","有禮貌說出來請確認","有禮貌反映"], kw:["有禮貌"],
              feedback:{ perfect:"答對了！有禮貌地說出來，請對方確認。", failed:"記住：錢不對就有禮貌反映，不吵架也不吃虧。" } }),
          ]
        },
        {
          id: "plan_save", name: "薪水怎麼用", icon: "🐷", clerkName: "會計阿姨",
          desc: "自己賺的錢：先存一部分再安排",
          steps: [
            mkStep({ id:"say_plan", say:"第一次領薪水，有什麼打算？", task:"說出儲蓄規劃",
              options:["我要先存1000元，剩下的當零用錢","全部花光慶祝","都拿去夾娃娃","借同學一半"],
              accepted:["我要先存1000元，剩下的當零用錢","先存1000剩下當零用","我要先存一部分"], kw:["存"],
              feedback:{ failed:"先想怎麼存。可以說：「我要先存1000元，剩下的當零用錢」" } }),
            mkStep({ id:"be_proud", say:"太棒了！會存錢的人最厲害！", task:"回應並說出想法",
              options:["謝謝！這是我自己賺的錢，要好好規劃","存錢好無聊","隨便說說的","明天就花掉"],
              accepted:["謝謝！這是我自己賺的錢，要好好規劃","自己賺的錢要好好規劃","謝謝我會好好規劃"], kw:["規劃"],
              feedback:{ failed:"可以說：「謝謝！這是我自己賺的錢，要好好規劃」" } }),
            mkStep({ id:"review", say:"（想一想）賺來的錢怎麼安排？", task:"說出方法",
              options:["先存一部分，再安排花費","賺多少花多少","放著不管","全部藏床下"],
              accepted:["先存一部分，再安排花費","先存一部分再安排","先存再花"], kw:["先存"],
              feedback:{ perfect:"答對了！先存一部分，剩下的再安排——這就是理財的開始。", failed:"記住：領到錢先存一部分，剩下再安排。" } }),
          ]
        }
      ]
    },

    {
      id: "serve_customer", name: "接待客人", icon: "👥", available: true,
      theme: { color: '#4F46E5', bg: '#E0E7FF', accent: '#3730A3' },
      situations: [
        {
          id: "greet_customer", name: "基本服務用語", icon: "😊", clerkName: "客人",
          desc: "換你當店員：歡迎光臨、請稍等、謝謝光臨",
          steps: [
            mkStep({ id:"say_welcome", say:"（有客人走進店裡）", task:"打招呼",
              options:["歡迎光臨！","（繼續滑手機）","來了喔","買什麼快說"],
              accepted:["歡迎光臨！","歡迎光臨"], kw:["歡迎光臨"],
              feedback:{ failed:"客人進門要打招呼。可以說：「歡迎光臨！」" } }),
            mkStep({ id:"be_patient", say:"（客人說：結帳可以等我一下嗎？我還要拿個東西）", task:"禮貌回應",
              options:["好的，請慢慢來，我等您","快一點喔","不行喔要下班了","（翻白眼）"],
              accepted:["好的，請慢慢來，我等您","請慢慢來我等您","好的請慢慢來"], kw:["慢慢來"],
              feedback:{ failed:"對客人要有耐心。可以說：「好的，請慢慢來，我等您」" } }),
            mkStep({ id:"say_bye", say:"（客人結完帳要離開了）", task:"送客",
              options:["謝謝光臨，歡迎再來！","終於走了","慢走不送","下一位"],
              accepted:["謝謝光臨，歡迎再來！","謝謝光臨歡迎再來","謝謝光臨"], kw:["謝謝光臨"],
              feedback:{ failed:"送客要有禮貌。可以說：「謝謝光臨，歡迎再來！」" } }),
            mkStep({ id:"review", say:"（想一想）服務客人的基本態度？", task:"說出重點",
              options:["有禮貌、有耐心，客人才會再來","客人趕快買完就好","心情好才服務","不理客人"],
              accepted:["有禮貌、有耐心，客人才會再來","有禮貌有耐心","禮貌又耐心"], kw:["禮貌","耐心"],
              feedback:{ perfect:"答對了！有禮貌、有耐心，客人才會再來。", failed:"記住：對客人有禮貌、有耐心。" } }),
          ]
        },
        {
          id: "hard_question", name: "被客人問倒了", icon: "🤷", clerkName: "客人",
          desc: "不裝懂，找懂的人來回答",
          steps: [
            mkStep({ id:"dont_guess", say:"（客人問：這個保養品孕婦可以用嗎？你不知道答案）", task:"不裝懂找支援",
              options:["這個我不確定，我請店長來為您說明","可以吧應該","不可以吧大概","隨便選一個答"],
              accepted:["這個我不確定，我請店長來為您說明","不確定請店長來說明","我請店長來"], kw:["店長"],
              feedback:{ failed:"不確定不能亂答。可以說：「這個我不確定，我請店長來為您說明」" } }),
            mkStep({ id:"relay_q", say:"（你去找店長）", task:"清楚轉達問題",
              options:["店長，客人想問這個保養品孕婦能不能用，麻煩您了","有人找你","你去看一下啦","客人好煩"],
              accepted:["店長，客人想問這個保養品孕婦能不能用，麻煩您了","客人問孕婦能不能用麻煩您","客人想問孕婦能不能用"], kw:["孕婦"],
              feedback:{ failed:"轉達要說清楚問題。可以說：「店長，客人想問這個保養品孕婦能不能用，麻煩您了」" } }),
            mkStep({ id:"review", say:"（想一想）被客人問倒了怎麼辦？", task:"說出方法",
              options:["不裝懂，找懂的人來回答","隨便答一個","說不知道就走開","叫客人自己查"],
              accepted:["不裝懂，找懂的人來回答","不裝懂找懂的人","找懂的人回答"], kw:["不裝懂","懂的人"],
              feedback:{ perfect:"答對了！不裝懂，找懂的人來回答。", failed:"記住：不會的問題不亂答，找懂的人幫忙。" } }),
          ]
        },
        {
          id: "angry_customer", name: "客人不高興", icon: "😠", clerkName: "客人",
          desc: "先道歉，處理不了請主管",
          steps: [
            mkStep({ id:"say_sorry", say:"（客人生氣：我等很久了！你們動作太慢了吧！）", task:"先道歉",
              options:["真的很抱歉讓您久等了","是你自己來的時間不對","急什麼","（跑走）"],
              accepted:["真的很抱歉讓您久等了","很抱歉讓您久等了","對不起讓您久等"], kw:["久等"],
              feedback:{ failed:"客人不高興先道歉。可以說：「真的很抱歉讓您久等了」" } }),
            mkStep({ id:"get_manager", say:"（客人還是很生氣）", task:"請主管處理",
              options:["我請店長來協助您，請稍等","你再吵我報警","不然你要怎樣","（哭出來）"],
              accepted:["我請店長來協助您，請稍等","請店長來協助您","我請店長來"], kw:["店長"],
              feedback:{ failed:"處理不了就找主管。可以說：「我請店長來協助您，請稍等」" } }),
            mkStep({ id:"review", say:"（想一想）遇到生氣的客人怎麼辦？", task:"說出方法",
              options:["先道歉，處理不了就請主管","跟客人吵回去","躲起來","裝聽不到"],
              accepted:["先道歉，處理不了就請主管","先道歉請主管","道歉後請主管處理"], kw:["道歉","主管"],
              feedback:{ perfect:"答對了！先道歉，處理不了就請主管。", failed:"記住：先道歉安撫，處理不了請主管，不用自己硬扛。" } }),
          ]
        }
      ]
    }

  ]
};
