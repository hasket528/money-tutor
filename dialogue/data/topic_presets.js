/**
 * 情境類型（自訂情境用）── 一份定義，三個地方吃：
 *   ① 情境編輯器的「⓪ 這是哪一類的練習？」下拉
 *   ② `buildAiPrompt` 依類型換掉身分敘述／對象敘述／關鍵字建議三段
 *   ③ 「用範本開始」的 3 步空白骨架（開場 → 主要任務 → 收尾）
 *
 * 為什麼要有 ③：AI 那條路要離開 App 去貼提示詞，不是每位老師都願意；
 * 範本讓老師改字就能用（見 docs/開發計畫_日常對話練習精進.md 四、B-2）。
 *
 * ⚠️ 資料欄名 `shopkeeper_prompt` 不改（改欄名會連動錄音 key、匯出包、編輯器三處），
 *    但**畫面與提示詞的措辭一律去店員化**：「店員說的話」→「對方說的話」。
 * ⚠️ 範本展開後必須通過 `js/step_rules.js`（唯一正解、干擾項不得 ∈ accepted、
 *    keywords／feedback 齊全）——`tests/topic_presets.test.js` 每支範本都驗。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TopicPresets = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 每個類型：
  //   key/label      下拉用
  //   designer       AI 提示詞裡的「你是誰」（身分敘述）
  //   partner        對話對象預設（老師沒填「對方是誰」時用這個）
  //   focus          任務語氣重點（也當作「練習重點」欄的 placeholder）
  //   topicHint      情境欄的 placeholder（換類型時跟著換，老師才知道要填什麼）
  //   kwExample      關鍵字建議的例子——購物類舉「多少錢」，社交類不該再舉這個
  //   template       3 步空白骨架（開場 → 主要任務 → 收尾）
  const PRESETS = [
    {
      key: 'shopping', label: '🛒 日常購物（預設）',
      designer: '生活自理與金錢使用',
      partner: '店員或老闆',
      focus: '點餐、詢價、結帳、找零',
      topicHint: '例如：在麵包店詢問今日特價',
      kwExample: '「多少錢」「菠蘿麵包」',
      template: [
        { id: 'greeting', say: '你好，歡迎光臨！', task: '跟對方打招呼',
          answer: '你好', accepted: ['你好', '您好'], kw: ['你好', '您好'],
          wrong: ['我不知道', '我要回家了', '不用了'] },
        { id: 'ask_price', say: '你好，需要什麼嗎？', task: '說出你要買的東西、問多少錢',
          answer: '我要一個麵包，多少錢？', accepted: ['我要一個麵包，多少錢？', '請問麵包多少錢？'],
          kw: ['麵包', '多少錢'], wrong: ['我不知道', '我在等人', '沒關係'] },
        { id: 'pay_thanks', say: '總共 30 元，謝謝。', task: '把錢給對方並道謝',
          answer: '這是 30 元，謝謝', accepted: ['這是 30 元，謝謝', '給你 30 元，謝謝'],
          kw: ['30', '謝謝'], wrong: ['我沒有錢', '算了', '再見'] },
      ],
    },
    {
      key: 'social', label: '🙋 社交互動',
      designer: '社交技巧',
      partner: '同學、鄰居或朋友',
      focus: '打招呼、邀約、婉拒、道歉、輪流說話',
      topicHint: '例如：同學邀我下課一起打球',
      kwExample: '「一起」「可以嗎」「對不起」',
      template: [
        { id: 'greeting', say: '嗨，早安！', task: '跟同學打招呼',
          answer: '早安', accepted: ['早安', '嗨，早安'], kw: ['早安', '嗨'],
          wrong: ['我不想講話', '你走開', '不知道'] },
        { id: 'invite', say: '下課要不要一起打球？', task: '答應對方，或說出你的想法',
          answer: '好啊，我想一起打球', accepted: ['好啊，我想一起打球', '好，我要跟你一起打球'],
          kw: ['一起打球', '一起'], wrong: ['我不知道', '你自己去', '沒關係'] },
        { id: 'decline', say: '那你要不要順便去福利社？', task: '不想去的時候，禮貌地說不要並說出理由',
          answer: '不用了，謝謝，我想先休息', accepted: ['不用了，謝謝，我想先休息', '謝謝，我這次不去'],
          kw: ['不用', '謝謝'], wrong: ['隨便', '你很煩', '我不知道'] },
      ],
    },
    {
      key: 'school', label: '🏫 校園生活',
      designer: '校園生活適應',
      partner: '老師、同學或學校職員',
      focus: '請假、借用物品、報告狀況、請求協助',
      topicHint: '例如：跟老師報告自己不舒服',
      kwExample: '「可以借我」「我不舒服」「請問」',
      template: [
        { id: 'call_teacher', say: '怎麼了嗎？', task: '叫老師並說你有事情要說',
          answer: '老師，我有事情想跟你說', accepted: ['老師，我有事情想跟你說', '老師，可以跟你說一件事嗎？'],
          kw: ['老師'], wrong: ['沒事', '不用了', '我不知道'] },
        { id: 'say_need', say: '你說說看，發生什麼事？', task: '說出你需要什麼幫忙',
          answer: '我的課本不見了，可以幫我嗎？', accepted: ['我的課本不見了，可以幫我嗎？', '我找不到課本，請老師幫忙'],
          kw: ['課本', '幫'], wrong: ['沒什麼', '算了', '我要回家'] },
        { id: 'thanks', say: '好，老師陪你去找。', task: '跟老師道謝',
          answer: '謝謝老師', accepted: ['謝謝老師', '謝謝'], kw: ['謝謝'],
          wrong: ['不用了', '喔', '再見'] },
      ],
    },
    {
      key: 'health', label: '🏥 醫療健康',
      designer: '就醫溝通',
      partner: '醫師、護理師或藥師',
      focus: '說明不舒服的地方、聽從指示、複述用藥方式',
      topicHint: '例如：看醫生時說出哪裡不舒服',
      kwExample: '「肚子痛」「一天三次」「飯後」',
      template: [
        { id: 'describe', say: '哪裡不舒服呢？', task: '說出你哪裡不舒服',
          answer: '我肚子痛', accepted: ['我肚子痛', '我的肚子痛'], kw: ['肚子', '痛'],
          wrong: ['我不知道', '沒事', '都可以'] },
        { id: 'answer_when', say: '痛多久了？', task: '說出從什麼時候開始不舒服',
          answer: '從昨天晚上開始痛', accepted: ['從昨天晚上開始痛', '昨天晚上就開始了'],
          kw: ['昨天'], wrong: ['忘記了', '隨便', '沒關係'] },
        { id: 'repeat_dose', say: '這個藥飯後吃，一天三次。', task: '把吃藥的方式複述一次確認',
          answer: '飯後吃，一天三次', accepted: ['飯後吃，一天三次', '我知道了，飯後吃，一天三次'],
          kw: ['飯後', '三次'], wrong: ['好', '我不知道', '再說一次'] },
      ],
    },
    {
      key: 'workplace', label: '💼 職場',
      designer: '職場社會技巧',
      partner: '店長或同事',
      focus: '報到、請假、聽不懂就問、承認錯誤',
      topicHint: '例如：上班聽不懂交代的工作',
      kwExample: '「請問」「我不太懂」「對不起」',
      template: [
        { id: 'report', say: '你來啦，今天準時喔。', task: '跟店長打招呼並報到',
          answer: '店長好，我來上班了', accepted: ['店長好，我來上班了', '店長早，我來上班了'],
          kw: ['店長'], wrong: ['我要走了', '不知道', '沒有'] },
        { id: 'ask_again', say: '你先把這些貨排到架上。', task: '聽不懂的時候，開口再問一次',
          answer: '不好意思，可以再說一次嗎？', accepted: ['不好意思，可以再說一次嗎？', '對不起，我不太懂，可以再說一次嗎？'],
          kw: ['再說一次'], wrong: ['好', '我知道了', '隨便'] },
        { id: 'confirm', say: '就是把牛奶放到冰箱裡。', task: '把要做的事複述一次',
          answer: '我知道了，要把牛奶放到冰箱', accepted: ['我知道了，要把牛奶放到冰箱', '好，我把牛奶放到冰箱'],
          kw: ['牛奶', '冰箱'], wrong: ['好', '我不會', '等一下'] },
      ],
    },
    {
      key: 'transport', label: '🚌 交通出行',
      designer: '社區行動能力',
      partner: '司機或站務人員',
      focus: '確認路線、求助、坐過站怎麼辦',
      topicHint: '例如：問司機這班車有沒有到火車站',
      kwExample: '「有沒有到」「火車站」「下一班」',
      template: [
        { id: 'ask_route', say: '要上車嗎？', task: '問這班車會不會到你要去的地方',
          answer: '請問這班車有到火車站嗎？', accepted: ['請問這班車有到火車站嗎？', '這班車會到火車站嗎？'],
          kw: ['火車站'], wrong: ['我不知道', '隨便', '不用了'] },
        { id: 'confirm_stop', say: '有喔，第三站就到了。', task: '複述一次，確認在哪一站下車',
          answer: '好，第三站下車', accepted: ['好，第三站下車', '我知道了，第三站下車'],
          kw: ['第三站'], wrong: ['好', '我不知道', '再見'] },
        { id: 'ask_help', say: '（你發現坐過站了）', task: '跟司機說你坐過站了，請他幫忙',
          answer: '不好意思，我坐過站了，可以幫我嗎？', accepted: ['不好意思，我坐過站了，可以幫我嗎？', '司機先生，我坐過站了，請你幫我'],
          kw: ['坐過站'], wrong: ['沒關係', '我自己走', '算了'] },
      ],
    },
    {
      key: 'safety', label: '🛡️ 情緒與求助',
      designer: '自我保護與情緒表達',
      partner: '陌生人、大人或老師',
      focus: '拒絕、求助、保護自己、說出感受',
      topicHint: '例如：陌生人要我上他的車',
      kwExample: '「我不要」「我要找老師」「不可以」',
      template: [
        { id: 'refuse', say: '小朋友，我載你回家好不好？', task: '大聲說不要',
          answer: '我不要，謝謝', accepted: ['我不要，謝謝', '不要，我不認識你'], kw: ['不要'],
          wrong: ['好啊', '謝謝你', '我不知道'] },
        { id: 'find_adult', say: '沒關係啦，上車就好了。', task: '說你要去找老師或家人',
          answer: '我要去找老師', accepted: ['我要去找老師', '我要去找我媽媽'], kw: ['找老師', '找我媽媽'],
          wrong: ['好', '等一下', '隨便'] },
        { id: 'tell_feeling', say: '（你回到學校，看到老師）', task: '把剛才發生的事和你的感覺說出來',
          answer: '老師，剛剛有陌生人要載我，我很害怕', accepted: ['老師，剛剛有陌生人要載我，我很害怕', '老師，有一個陌生人叫我上車，我好怕'],
          kw: ['陌生人', '害怕'], wrong: ['沒事', '我忘記了', '不用管'] },
      ],
    },
    {
      key: 'custom', label: '✏️ 其他（老師自填）',
      designer: '生活對話',
      partner: '',
      focus: '',
      topicHint: '例如：在圖書館問櫃檯怎麼借書',
      kwExample: '能區分這一步的詞（不要用「好」「要」這種每一步都會出現的萬用詞）',
      template: [
        { id: 'opening', say: '（開場：對方先說的第一句話）', task: '（學生這一步要做什麼）',
          answer: '（學生的標準答案）', accepted: ['（學生的標準答案）'], kw: ['標準答案'],
          wrong: ['我不知道', '沒關係', '算了'] },
        { id: 'main_task', say: '（主要任務：對方的回應或提問）', task: '（學生這一步要做什麼）',
          answer: '（學生的標準答案二）', accepted: ['（學生的標準答案二）'], kw: ['標準答案二'],
          wrong: ['我不知道', '沒關係', '算了'] },
        { id: 'closing', say: '（收尾：對方的結束語）', task: '（學生怎麼收尾，例如道謝）',
          answer: '謝謝', accepted: ['謝謝', '謝謝你'], kw: ['謝謝'],
          wrong: ['我不知道', '沒關係', '算了'] },
      ],
    },
  ];

  const DEFAULT_KEY = 'shopping';   // 舊資料沒有 category 欄＝日常購物

  function get(key) {
    return PRESETS.find(p => p.key === key) || PRESETS.find(p => p.key === DEFAULT_KEY);
  }

  /**
   * 把範本的精簡格式展開成完整步驟（與編輯器存下來的結構相同）。
   * 展開結果必須通過 js/step_rules.js——干擾項一律不放進 accepted，
   * feedback 三項補齊，options[0] 就是標準答案。
   */
  function expandTemplate(key, idPrefix) {
    const preset = get(key);
    const prefix = idPrefix || 'step';
    return preset.template.map((t, i) => {
      const accepted = (t.accepted && t.accepted.length ? t.accepted : [t.answer]).slice();
      if (!accepted.includes(t.answer)) accepted.unshift(t.answer);
      return {
        id: `${prefix}_${i + 1}_${t.id}`,
        shopkeeper_prompt: t.say,
        task: t.task,
        keywords: t.kw.slice(),
        keywords_mode: 'any',
        accepted_phrases: accepted,
        llm_context_hint: '',
        options: [t.answer, ...t.wrong.slice(0, 3)],
        feedback: {
          perfect: '很好！說得很清楚！',
          partial: `說出了重點！試試說完整：「${t.answer}」`,
          failed: `可以這樣說：「${t.answer}」`,
        },
      };
    });
  }

  return { PRESETS, DEFAULT_KEY, get, expandTemplate };
});
