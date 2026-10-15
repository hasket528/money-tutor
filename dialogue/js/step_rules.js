/**
 * 對話步驟規則（單一真相）
 *
 * 同一份判準給兩邊用，**不要在任何一邊另外寫一份**：
 *   ① `tests/_audit_schema.js`（node）── 驗 `data/scenarios.js` 的內建教材
 *   ② `script.js` 的情境編輯器（瀏覽器）── 老師存自訂情境時就地檢查
 *
 * 為什麼需要 ②：自訂情境存在 localStorage，**六支稽核一支都照不到**，
 * 編輯器的就地檢查是它唯一的守門員（見 docs/開發計畫_日常對話練習精進.md 七）。
 *
 * 兩邊的差別只有「嚴重度」，不是「規則」：內建教材要求最嚴（`profile: 'builtin'`），
 * 老師自訂情境把「編輯器本來就會自動補的欄位」降成提醒（`profile: 'custom'`，
 * 名單＝下方 `CUSTOM_RELAXED`），免得老師被自己沒填、系統也會補的東西擋住。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StepRules = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 比對用正規化：標點與空白不算差異（「多少錢？」＝「多少錢」）
  const norm = s => String(s == null ? '' : s).replace(/[！？。，、!?.,\s「」]/g, '');
  const nonEmptyStr = v => typeof v === 'string' && v.trim().length > 0;

  // 自訂情境放寬成提醒的規則：這幾項編輯器存檔時會自動補齊，
  // 擋下來只會讓老師卡在「不是他造成的問題」上（舊資料、別台匯進來的對話包尤其常缺）。
  const CUSTOM_RELAXED = new Set(['feedback_missing', 'feedback_demo_not_accepted']);

  /**
   * 檢查單一步驟。
   * @param {object} step
   * @param {object} [opts]
   * @param {'builtin'|'custom'} [opts.profile='builtin']
   * @param {string[]} [opts.otherIds] 同一情境內其他步驟的 id（判 id 重複用）
   * @returns {{level:'error'|'warn', code:string, msg:string}[]}
   */
  function checkStep(step, opts) {
    const o = opts || {};
    const custom = o.profile === 'custom';
    const issues = [];
    const add = (level, code, msg) => {
      if (level === 'error' && custom && CUSTOM_RELAXED.has(code)) level = 'warn';
      issues.push({ level, code, msg });
    };

    if (!step || typeof step !== 'object') {
      add('error', 'step_invalid', '步驟資料不是物件');
      return issues;
    }

    // ── id：決定音檔檔名 {場景}_{情境}_{步驟} 與老師錄音的 key，撞號會蓋到別步的錄音
    if (!nonEmptyStr(step.id)) add('error', 'id_missing', '缺步驟 id');
    else if ((o.otherIds || []).some(id => id === step.id))
      add('error', 'id_dup', `步驟 id「${step.id}」重複（錄音會蓋到另一步）`);

    // ── 必填文字
    if (!nonEmptyStr(step.shopkeeper_prompt)) add('error', 'prompt_missing', '缺「對方說的話」');
    if (!nonEmptyStr(step.task))              add('error', 'task_missing', '缺「學生的任務」');

    // ── accepted_phrases：標準答案，[0] 是示範句來源
    const accepted = Array.isArray(step.accepted_phrases) ? step.accepted_phrases : null;
    if (!accepted || accepted.length === 0) add('error', 'accepted_missing', '缺標準答案（accepted_phrases）');
    else accepted.forEach((p, i) => {
      if (!nonEmptyStr(p)) add('error', 'accepted_empty_item', `標準答案第 ${i + 1} 句是空白`);
    });

    // ── options：[0] 是正解，其餘是干擾項
    const options = Array.isArray(step.options) ? step.options : null;
    if (!options || options.length < 2) add('error', 'options_too_few', '選項需要 2 個以上（1 個正解＋干擾項）');
    else {
      options.forEach((opt, i) => {
        if (!nonEmptyStr(opt)) add('error', 'options_empty_item', `選項第 ${i + 1} 個是空白`);
      });
      if (new Set(options.map(norm)).size !== options.length)
        add('warn', 'options_dup', '有重複的選項');
    }

    if (options && options.length && accepted && accepted.length) {
      // 選項／語音／打字三種模式對「正解」的認定必須一致
      if (!accepted.some(p => norm(p) === norm(options[0])))
        add('error', 'answer_not_accepted', `選項第 1 個「${options[0]}」不在標準答案裡（選項模式與語音模式會判得不一樣）`);

      // 唯一正解：干擾項不得 ∈ accepted_phrases。
      // 犯了這條＝這一步有兩個正解，學生選干擾項也算對，練習就白做了。
      const acc = new Set(accepted.map(norm));
      options.slice(1).forEach((opt, i) => {
        if (acc.has(norm(opt)))
          add('error', 'distractor_accepted', `干擾選項「${opt}」也算標準答案（第 ${i + 2} 個選項）——一步只能有一個正解`);
      });
    }

    // ── keywords：語音／打字模式的判定依據，缺了就永遠判不對
    const kws = Array.isArray(step.keywords) ? step.keywords : null;
    if (!kws || kws.length === 0) add('error', 'keywords_missing', '缺關鍵字（語音與打字模式會判不出來）');
    else kws.forEach((k, i) => {
      if (!nonEmptyStr(k)) add('error', 'keywords_empty_item', `關鍵字第 ${i + 1} 個是空白`);
    });

    if (step.keywords_mode != null && !['any', 'all'].includes(step.keywords_mode))
      add('error', 'keywords_mode_invalid', `keywords_mode 只能是 any 或 all（現在是「${step.keywords_mode}」）`);

    // ── feedback：三種評分的回饋文字
    const fb = step.feedback || {};
    for (const k of ['perfect', 'partial', 'failed'])
      if (!nonEmptyStr(fb[k])) add('error', 'feedback_missing', `feedback.${k} 缺或空白`);

    // 統一對照：failed 回饋裡的示範句「…」必須是可接受答案，
    // 否則學生照著示範說卻被判錯（高級是精確比對）。
    const demo = (fb.failed || '').match(/「([^」]+)」/);
    if (demo && accepted) {
      const pool = [...accepted, ...(options || []).slice(0, 1)].map(norm);
      if (!pool.includes(norm(demo[1])))
        add('error', 'feedback_demo_not_accepted', `回饋語的示範句「${demo[1]}」不在標準答案裡（學生照著說會被判錯）`);
    }

    // ── 句框（frame 整合的正確性由 _audit_frames 驗，這裡只抓漏填）
    if (step.slots && !step.frame_ref && !step.frame) add('warn', 'slots_without_frame', '有 slots 但沒有 frame_ref/frame');
    if (step.grow_slots && !step.frame_ref)           add('warn', 'grow_slots_without_frame', '有 grow_slots 但沒有 frame_ref');

    return issues;
  }

  /**
   * 檢查一整組步驟（含 id 在組內是否重複）。
   * @returns {{index:number, step:object, issues:object[]}[]} 只回傳有問題的步驟
   */
  function checkSteps(steps, opts) {
    const list = Array.isArray(steps) ? steps : [];
    const out = [];
    list.forEach((step, index) => {
      // 只跟「前面的步驟」比 id：同一組重複的 id 只報一次，不會兩步互相報
      const otherIds = list.slice(0, index).map(s => s && s.id).filter(Boolean);
      const issues = checkStep(step, Object.assign({}, opts, { otherIds }));
      if (issues.length) out.push({ index, step, issues });
    });
    return out;
  }

  const hasError = issues => issues.some(i => i.level === 'error');

  // ════════════════════════════════════════════════════════════════════
  // 稱呼與禮貌語（2026-09-17）——兩個地方用同一份，不要另抄：
  //   ① script.js 困難判定：這些詞在口語裡放前放後都對（「不好意思老闆」＝「老闆不好意思」），
  //      比對標準答案時不看它們的位置；句首的禮貌語也不算「否定」（「不好意思」不是拒絕）。
  //   ② checkTaskClarity：標準答案裡有這些詞，任務說明就要點名
  //      （使用者定案：禮貌用語「加到任務中」，不是從標準答案拿掉）。
  // named＝任務裡出現這些字就算有點名（「道謝」≈謝謝、「打招呼」≈你好）。「禮貌地」不算——說不出是哪一句。
  // ════════════════════════════════════════════════════════════════════
  const POLITE_GROUPS = [
    { words: ['不好意思'],                                  named: /不好意思/ },
    { words: ['對不起', '抱歉'],                            named: /對不起|抱歉|道歉/ },
    { words: ['麻煩你', '麻煩您'],                          named: /麻煩/ },
    { words: ['請問'],                                      named: /請問/ },
    { words: ['謝謝你', '謝謝您', '謝謝', '感謝'],          named: /謝/ },
    { words: ['你好', '您好', '哈囉', '早安', '午安', '晚安'], named: /招呼|問好|問候|你好|您好|哈囉|早安|午安|晚安/ },
    { words: ['再見', '掰掰', '拜拜'],                      named: /再見|道別|掰掰|拜拜/ },
  ];
  const ADDRESS_WORDS = ['老闆娘', '老闆', '店長', '經理', '阿姨', '叔叔', '伯伯', '阿伯', '奶奶', '爺爺', '姐姐', '姊姊', '哥哥',
    '店員', '老師', '醫生', '藥師', '司機', '先生', '小姐'];
  // 長的排前面：「謝謝你」要先於「謝謝」、「老闆娘」要先於「老闆」被切出來
  const MOVABLE_CHUNKS = [...POLITE_GROUPS.flatMap(g => g.words), ...ADDRESS_WORDS].sort((a, b) => b.length - a.length);
  const SEGMENT_SPLIT = /[，,、！!？?。；;…「」]+/;
  // 「老闆好」「店長好」是一句招呼，不拆（拆了會變成「好老闆」也算對）
  const ADDRESS_GREETING = new RegExp('^(' + ADDRESS_WORDS.join('|') + ')(好|早|早安)$');
  const PARTICLES_ONLY = /^[了嗎呢吧啊喔呀囉哦耶欸啦]+$/;
  const greetingGroup = () => POLITE_GROUPS.find(g => g.words.includes('你好'));

  /**
   * 把一句話拆成「段落」：標點分開的句子，再把**句子頭尾**的稱呼／禮貌語剝成獨立一段。
   * 只剝頭尾：「謝謝老闆再見」→ 謝謝／老闆／再見；「我請店長來協助您」的店長在句子中間，是內容的一部分，不拆。
   * 只剩語助詞的碎片（「麻煩您了」剝完剩「了」）直接丟掉。
   * @returns {{kind:'polite'|'address'|'content', text:string}[]}
   */
  function speechParts(sentence) {
    const out = [];
    // （按服務鈴）這類動作說明不是要講的話，先拿掉
    for (const raw of String(sentence == null ? '' : sentence).replace(/（[^）]*）|\([^)]*\)/g, '，').split(SEGMENT_SPLIT)) {
      let seg = raw.replace(/\s+/g, '');
      if (!seg) continue;
      if (ADDRESS_GREETING.test(seg)) { out.push({ kind: 'polite', text: seg }); continue; }
      const head = [], tail = [];
      let moved = true;
      while (seg && moved) {
        moved = false;
        for (const w of MOVABLE_CHUNKS) {
          if (seg.startsWith(w)) { head.push(w); seg = seg.slice(w.length); moved = true; break; }
          if (seg.length > w.length && seg.endsWith(w)) { tail.unshift(w); seg = seg.slice(0, -w.length); moved = true; break; }
        }
      }
      const kindOf = w => ADDRESS_WORDS.includes(w) ? 'address' : 'polite';
      head.forEach(w => out.push({ kind: kindOf(w), text: w }));
      if (seg && !PARTICLES_ONLY.test(seg)) out.push({ kind: 'content', text: seg });
      tail.forEach(w => out.push({ kind: kindOf(w), text: w }));
    }
    return out;
  }
  // 一段禮貌語屬於哪一組（「老闆好」這種整句招呼歸到打招呼）
  const politeGroupOf = text => POLITE_GROUPS.find(g => g.words.includes(text)) || greetingGroup();

  // 內容段有沒有被任務點名：
  //   ①這一步的關鍵字出現在這段裡，任務也寫到了 ②這段的數字任務也寫到了
  //   ③這段有「兩個實字連在一起」出現在任務裡（「現金」「巧克」）——虛字組成的「我要」「要買」不算，
  //     否則「告訴店員你要買的東西」會被當成有寫到「巧克力」 ④都沒有實字時（「好的」「不能買」），整段要出現在任務裡
  const FUNC_CHARS = new Set([...'我你您他她它們的了是要有在這那個一兩和與也都就不沒很能會可以想給幫把被讓請嗎呢吧啊喔呀好說去來用付拿買再先']);
  const RESPONSE_ONLY = /^(好|好的|好啊|嗯|對|對了|是|是的|行|可以|沒問題|OK|ok|Ok|沒事|知道了|我知道了|了解|收到)$/;
  // 回應詞（好的／對／我知道了）：任務寫了「答應／接受／確認…」就算有點名
  const RESPONSE_NAMED = /答應|同意|接受|確認|知道|了解|好/;
  // 數量的國字與阿拉伯數字視為同一件事（2026-09-19 使用者：「4個人」跟「四個人」意思一樣）。
  // 只轉後面接量詞的（四個人、兩本、一百元），「一下」「一起」這種不是數量的不動。
  const CN_DIGIT = { 零: 0, 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const CN_UNIT = { 十: 10, 百: 100, 千: 1000 };
  const CN_QTY = /[零一二兩三四五六七八九十百千]+(?=[個位本張杯份支元塊顆盒包瓶次天點號人碗條件歲樓站路])/g;
  function cnQtyToDigits(s) {
    return s.replace(CN_QTY, run => {
      let total = 0, cur = 0;
      for (const ch of run) {
        if (ch in CN_DIGIT) cur = CN_DIGIT[ch];
        else { total += (cur || 1) * CN_UNIT[ch]; cur = 0; }
      }
      return String(total + cur);
    });
  }
  function contentNamed(content, task, keywords) {
    // 任務是對學生說的（「說你要去找老師」），答句是學生自己說的（「我要去找老師」）：比對前把任務的「你」換成「我」
    //   （原樣也要比：任務直接引用答句時「說：給你」換了就對不上）
    const c = cnQtyToDigits(norm(content)), t0 = cnQtyToDigits(norm(task)), t1 = t0.replace(/[你妳]/g, '我');
    const has = x => t0.includes(x) || t1.includes(x);
    // 請求的外殼不算內容：「可以陪我找嗎」對「請老師陪你找」
    const core = c.replace(/^(可不可以|能不能|可以|請你|請)/, '').replace(/[嗎呢吧啊喔]+$/, '');
    if (!c || has(c) || (core.length >= 2 && has(core))) return true;
    if (RESPONSE_ONLY.test(c) && RESPONSE_NAMED.test(t0)) return true;
    // 任務刻意讓學生自己決定內容、只點出「是哪一類」：付款方式（四種都收，見付款方式判定原則）、自己有多少錢
    if (/付款方式|付錢方式|怎麼付/.test(t0) && /現金|付現|刷卡|悠遊卡|信用卡|行動支付/.test(c)) return true;
    if (/多少錢|多少元|金額|價錢|價格/.test(t0) && /\d/.test(c) &&
        [...c.replace(/\d+|元|塊/g, '')].every(ch => FUNC_CHARS.has(ch))) return true;
    if ((keywords || []).some(k => { const nk = norm(k); return nk && c.includes(nk) && has(nk); })) return true;
    const nums = c.match(/\d+/g);
    if (nums && nums.some(n => has(n))) return true;
    for (let i = 0; i + 1 < c.length; i++) {
      if (FUNC_CHARS.has(c[i]) || FUNC_CHARS.has(c[i + 1]) || /\d/.test(c[i] + c[i + 1])) continue;
      if (has(c.slice(i, i + 2))) return true;
    }
    return false;
  }

  /**
   * 任務說明有沒有點名標準答案要講的每一件事（2026-09-17 任務說明原則）。
   * 規則：標準答案講幾件事，任務就寫幾件事；禮貌用語、稱呼、品項、金額都要點名。
   * 為什麼要有：困難模式拿學生的話跟標準答案比完整度——任務沒要求「不好意思」，
   * 學生照任務講「找零好像不對」就只到 7 成以下、判不算對，錯的其實是任務沒寫清楚。
   *
   * 只給提醒、不擋存檔（判準是字面比對，會有換句話說的漏網與誤報，需要人看）。
   * @param {object} step
   * @returns {{code:string, level:'warn', part:string, msg:string, literalOk:boolean}[]}
   *   literalOk＝這一步有沒有「某一種可以接受的說法」是任務全部點名到的
   *   （false＝學生照任務字面講，困難模式很可能判不算對 → 優先修）
   */
  function checkTaskClarity(step) {
    if (!step || !nonEmptyStr(step.task)) return [];
    const task = step.task;
    const answer = (Array.isArray(step.options) && step.options[0]) ||
                   (Array.isArray(step.accepted_phrases) && step.accepted_phrases[0]) || '';
    // 範本的空白欄位（「（完整的一句話）」「（學生要判斷或應變的事）」）還沒填，不檢查
    const isPlaceholder = v => /^（[^）]*）$/.test(String(v).trim());
    if (!nonEmptyStr(answer) || isPlaceholder(answer) || isPlaceholder(task)) return [];
    const missingOf = (sentence) => speechParts(sentence).filter(p => {
      if (p.kind === 'polite')  return !(politeGroupOf(p.text).named.test(task) || task.includes(p.text));
      if (p.kind === 'address') return !task.includes(p.text);
      return !contentNamed(p.text, task, step.keywords);
    });
    const missing = missingOf(answer);
    if (!missing.length) return [];
    const pool = [answer, ...(Array.isArray(step.accepted_phrases) ? step.accepted_phrases : [])];
    const literalOk = pool.some(p => nonEmptyStr(p) && missingOf(p).length === 0);
    return missing.map(p => ({
      level: 'warn', literalOk, part: p.text,
      code: p.kind === 'content' ? (RESPONSE_ONLY.test(p.text) ? 'task_response_missing' : 'task_content_missing')
                                 : (p.kind === 'address' ? 'task_address_missing' : 'task_polite_missing'),
      msg: p.kind === 'polite'  ? `標準答案有「${p.text}」，任務沒寫到（例：先說「${p.text}」，再…）`
         : p.kind === 'address' ? `標準答案有稱呼「${p.text}」，任務沒寫到（例：跟${p.text}說…）`
         : `標準答案有「${p.text}」，任務沒寫出這件事`,
    }));
  }

  return { norm, checkStep, checkSteps, hasError, CUSTOM_RELAXED,
           MOVABLE_CHUNKS, ADDRESS_WORDS, POLITE_GROUPS, speechParts, checkTaskClarity };
});
