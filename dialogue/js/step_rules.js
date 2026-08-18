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

  return { norm, checkStep, checkSteps, hasError, CUSTOM_RELAXED };
});
