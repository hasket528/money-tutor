// ─── 評量核心（純函式，不碰 DOM／資料庫）──────────────────────────────
// 規格：doc/開發計畫/評量規格_第0階段.md（定稿 v1）。這裡是「每題最終狀態、能力指標、精熟判定」的唯一定義處，
// js/learning-tracker.js（存檔、結算中斷摘要）、teacher.html（學習歷程、學習報告）都呼叫這一份，不要另寫一套。
// 測試：node tests/eval_core.test.js
//
// 瀏覽器：window.EvalCore（由 js/learning-tracker.js 自動載入，頁面不必另外掛）；Node：require('./eval-core.js')。
(function (root) {
  'use strict';

  // 每題的最終狀態（規格 3-2；代號給程式用、ICON 給畫面用）
  const STATE = {
    ASSIST: 'assist',   // 🤖 系統代答（👆 輔助點擊）——不列入能力指標
    PAUSE:  'pause',    // ⏸ 中斷（練習中途離開時還沒結束的題）——不列入
    FAIL:   'fail',     // ❌ 已作答未通過
    FIRST:  'first',    // ✅ 無錯答對
    FIXED:  'fixed',    // 🔧 自行修正
    HINT:   'hint',     // 💡 提示後完成
  };
  const ICON = { assist: '🤖', pause: '⏸', fail: '❌', first: '✅', fixed: '🔧', hint: '💡' };
  const COUNTED = new Set([STATE.FAIL, STATE.FIRST, STATE.FIXED, STATE.HINT]);   // 能力指標的分母

  // 一組作答事件（同一題、或同一題的同一步驟）→ 狀態
  //   closed＝這一題已結束（下一題開始作答，或練習正常完成）
  function stateOf(evs, closed, assisted) {
    if (assisted) return STATE.ASSIST;
    if (!closed) return STATE.PAUSE;
    if (!evs[evs.length - 1].ok) return STATE.FAIL;
    if (evs.some(e => e.hint && e.hint.length)) return STATE.HINT;
    return evs.every(e => e.ok) ? STATE.FIRST : STATE.FIXED;
  }

  // 作答事件 → 每題最終狀態（規格第三節）
  //   events：[{ n, step, label, ok, hint: ['self'|'auto'], t }]（依作答先後）
  //   opts.interrupted＝中斷摘要（最後一題沒有結束）；opts.assisted＝👆 輔助點擊
  //   回傳 [{ n, state, wrong: 錯誤次數, hint: ['self','auto'], steps: { 代號: 狀態 } }]，依題號出現順序
  function deriveQuestions(events, opts = {}) {
    const order = [], byN = new Map();
    (events || []).forEach(e => {
      const n = e.n || 0;
      if (!byN.has(n)) { byN.set(n, []); order.push(n); }
      byN.get(n).push(e);
    });
    const lastN = order[order.length - 1];
    return order.map(n => {
      const evs = byN.get(n);
      const closed = !opts.interrupted || n !== lastN;   // 中斷時，最後一題還沒結束
      const hint = [...new Set(evs.flatMap(e => e.hint || []))].sort().reverse();   // ['self','auto'] 順序固定
      const bySt = new Map();
      evs.forEach(e => { const s = e.step || 'answer'; if (!bySt.has(s)) bySt.set(s, []); bySt.get(s).push(e); });
      const steps = {};
      bySt.forEach((se, s) => { steps[s] = stateOf(se, closed, opts.assisted); });
      const kind = (evs.find(e => e.kind) || {}).kind;   // 題型（setKind，2026-10-11）
      return { n, state: stateOf(evs, closed, opts.assisted), wrong: evs.filter(e => !e.ok).length, ...(hint.length ? { hint } : {}), ...(kind ? { kind } : {}), steps };
    });
  }

  // 步驟代號 → 中文（單元在 logStep 第三個參數寫代號；B／C／F 不寫＝answer）。新增代號要加在這裡
  const STEP_NAMES = {
    answer: '作答',
    pick: '選商品', pay: '付款', change: '找零', change_calc: '計算找零', order: '操作順序',   // A1～A4
    menu: '選擇功能', pin: '輸入密碼', amount: '輸入金額', deposit: '放入金額',             // A5
    bank: '銀行代碼', account: '帳號', check: '核對資料', confirm: '確認',
    from: '起站', to: '迄站', type: '車種', qty: '張數',                                     // A6
    // B 系列（2026-10-11 補；pick／pay／change／deposit 與 A 系列共用）
    service: '選服務',                                                                         // A2
    price: '算商品價格', total: '算總金額', item: '算每一項的金額', weeks: '算需要幾週',      // B1～B3
    cheaper: '選便宜的', sort: '排序價格', diff: '算差額',                                   // B4
  };

  // ══ 第 2 階段：把各種紀錄攤成「題」，算能力指標（規格第五節）══════════════════════════════
  const DIFFS = ['easy', 'normal', 'hard'];
  const normDiff = (r) => DIFFS.includes(r && r.difficulty) ? r.difficulty : 'normal';   // 沒有難度（冒險、舊資料）一律普通
  const isMain = (r) => (r && r.source) === 'main';
  // 一筆紀錄屬於哪個單元／情境（主課程＝單元代號；對話＝場景|情境；同 teacher.html iepKeyOf）
  const keyOf = (r) => isMain(r) ? r.situationId : `${r.scenarioId}|${r.situationId}`;

  // 一筆紀錄 → 題目清單 [{ sid, ts, n, done, diff, key, state, hint, steps }]
  //   ① 有 questions（第 1 階段起的 24 單元、中斷摘要）：照用
  //   ② 對話：一段對話（一次情境練習）算一題（2026-10-11 使用者定，原本每一步算一題）——各步驟的狀態（score／attempts／hintUsed）
  //      存在 steps 給步驟分析用，整段的狀態由各步合併：有一步沒過＝❌、否則有提示＝💡、否則錯過＝🔧、都一次就對＝✅；
  //      👆 輔助點擊、逐字朗讀（學生自評，不是系統評分）的步驟不列入；整段都是＝🤖；沒做完（中斷摘要）＝⏸
  //   ③ 都沒有（一日金錢冒險一筆＝多關）：整次當一題（規格 6-1）——全對沒錯＝✅、全對有錯＝🔧、沒全對＝❌
  function itemsOf(r) {
    const base = { sid: r.id, ts: r.ts || 0, done: (r.status || 'done') === 'done', diff: normDiff(r), key: keyOf(r) };
    if (Array.isArray(r.questions) && r.questions.length) {
      return r.questions.map(q => ({ ...base, n: q.n, state: q.state, hint: q.hint || [], steps: q.steps || {}, ...(q.kind ? { kind: q.kind } : {}) }));
    }
    if (!isMain(r) && Array.isArray(r.steps) && r.steps.length) {
      const steps = {}, hints = new Set();
      r.steps.forEach((st, i) => {
        st = st || {};
        if (r.assisted || st.assisted || st.selfRated) return;
        // 2026-10-11 起對話每步存 hintSrcs（兩種都留）；之前只有 hintSrc 一種
        const hint = st.hintUsed ? (Array.isArray(st.hintSrcs) && st.hintSrcs.length ? [...st.hintSrcs] : st.hintSrc === 'self' ? ['self'] : ['auto']) : [];
        hint.forEach(h => hints.add(h));
        steps[st.stepId || ('s' + (i + 1))] = st.score !== 'perfect' ? STATE.FAIL : hint.length ? STATE.HINT
          : (st.attempts || 1) > 1 ? STATE.FIXED : STATE.FIRST;
      });
      const v = Object.values(steps);
      const state = !v.length ? STATE.ASSIST : !base.done ? STATE.PAUSE
        : v.includes(STATE.FAIL) ? STATE.FAIL : v.includes(STATE.HINT) ? STATE.HINT : v.includes(STATE.FIXED) ? STATE.FIXED : STATE.FIRST;
      return [{ ...base, n: 1, state, hint: [...hints].sort().reverse(), steps }];
    }
    const all = (r.total || 0) > 0 && (r.score || 0) >= r.total;
    const hinted = (r.hinted || 0) > 0;
    const state = r.assisted ? STATE.ASSIST : !all ? STATE.FAIL : hinted ? STATE.HINT : (r.wrongAttempts || 0) > 0 ? STATE.FIXED : STATE.FIRST;
    return [{ ...base, n: 1, state, hint: hinted ? ['self'] : [], steps: { answer: state } }];
  }
  // 多筆紀錄 → 題目清單，依時間、題號排好
  function itemsOfRecords(records) {
    return (records || []).flatMap(itemsOf).sort((a, b) => a.ts - b.ts || a.sid - b.sid || a.n - b.n);
  }

  // 能力指標（規格第五節）：只由作答資料決定，任何設定都不能改變這些數字；分母 0 時百分比為 null（畫面顯示「—」）
  function metrics(items) {
    const c = { first: 0, fixed: 0, hint: 0, fail: 0, pause: 0, assist: 0, hintSelf: 0, hintAuto: 0 };
    (items || []).forEach(q => {
      c[q.state] = (c[q.state] || 0) + 1;
      if (q.state === STATE.HINT) { if ((q.hint || []).includes('self')) c.hintSelf++; else c.hintAuto++; }
    });
    const den = c.first + c.fixed + c.hint + c.fail;
    const pct = (num) => den ? num / den * 100 : null;
    return { ...c, den, firstTry: pct(c.first), noHint: pct(c.first + c.fixed), completion: pct(c.first + c.fixed + c.hint) };
  }

  // ══ 第 3 階段：精熟判定（規格第六節）══════════════════════════════════════════════
  // 標準：{ vid, from, metric: 'firstTry'|'noHint'|'completion', pct, qn, minSessions, diff, steps, hintSrc }
  //   diff＝只看這個難度（null＝各難度分開判、整體看 minDiff 以上任一）；steps＝只看這些步驟代號；
  //   hintSrc＝completion 只承認這些來源的提示（null＝都承認）
  // 系統預設看「無錯答對率」：多數單元答錯可以重答，無提示答對率對大部分學生都接近 100%，當精熟判準太寬（2026-10-08，待使用者確認）
  const SYSTEM_DEFAULT = { vid: 'sys-v1', from: 0, metric: 'firstTry', metricDlg: 'tolerant', pct: 80, qn: 10, qnDlg: 5, minSessions: 2, diff: null, minDiff: 'easy', steps: null, hintSrc: null, tol: 1, tolDlg: 1 };
  // qnDlg＝生活情境對話看最近幾題（一段對話算一題，2026-10-11）；metricDlg＝對話預設「設定答對率」；tol／tolDlg＝設定答對率的容錯步數（見 tolAllowed）

  // 某時間點有效的版本：生效時間 ≤ ts 的最後一個（規格 6-2）；都還沒生效就用第一個
  function versionAt(versions, ts) {
    const vs = (versions || []).slice().sort((a, b) => (a.from || 0) - (b.from || 0));
    let v = vs[0] || null;
    vs.forEach(x => { if ((x.from || 0) <= ts) v = x; });
    return v;
  }

  // 依標準把題目換成「評量單位」：指定 steps 時改用步驟狀態（規格 3-2「整題與步驟分開評量」）
  function unitsFor(items, crit) {
    if (!crit.steps || !crit.steps.length) return items;
    return items.flatMap(q => crit.steps.filter(s => q.steps && q.steps[s]).map(s => ({ ...q, step: s, state: q.steps[s] })));
  }
  // 第四個指標「設定答對率」（metric 'tolerant'，2026-10-11 使用者定）：無錯答對率再放寬幾步——
  //   一題裡「沒有一次就對」的步驟（🔧／💡／❌ 都算）在容錯步數以內，就算這一題對。容錯只屬於這個指標，其他三個指標不看 tol。
  //   老師選 可錯 1／2 步（tol，預設 1）；一題至少要對六成步驟——步數少的題自動少容許（1～2 步＝0、3～4 步最多 1、5 步以上最多 2），只有一步的題永遠要一次就對。
  //   預設：生活情境對話＝設定答對率・可錯 1 步（metricDlg／tolDlg）、24 單元＝無錯答對率
  const tolAllowed = (nSteps, tol) => Math.max(0, Math.min(tol || 0, Math.floor(nSteps * 0.4)));
  // 一個評量單位算不算「成功」（依指標；completion 可限定提示來源）
  function success(q, crit) {
    if (crit.metric === 'tolerant') {
      const st = !q.step && q.steps ? Object.values(q.steps).filter(x => COUNTED.has(x)) : [];
      if (!st.length) return q.state === STATE.FIRST;
      return st.filter(x => x !== STATE.FIRST).length <= tolAllowed(st.length, crit.tol ?? 1);
    }
    if (crit.metric === 'firstTry') return q.state === STATE.FIRST;
    if (crit.metric === 'noHint') return q.state === STATE.FIRST || q.state === STATE.FIXED;
    if (q.state === STATE.HINT) return !crit.hintSrc || (q.hint || []).every(h => crit.hintSrc.includes(h));
    return q.state === STATE.FIRST || q.state === STATE.FIXED;
  }
  // 目標達成率：依標準的指標、步驟、提示來源算（IEP 用；**不改變 metrics() 的能力指標**）
  function goalRate(items, crit) {
    const u = unitsFor(items, crit).filter(q => COUNTED.has(q.state));
    const num = u.filter(q => success(q, crit)).length;
    return { num, den: u.length, value: u.length ? num / u.length * 100 : null };
  }

  // 精熟判定（一組已經篩好單元與難度的題目；兩個條件分開判斷，都達成才符合）
  //   opts.asOf＝算到這個時間（含）；opts.since＝評量期間起點（IEP 目標的 start；系統預設＝不限）
  //   回傳 { met, enough, window: { num, den, value, items }, sessions, need }
  function evaluate(items, crit, opts = {}) {
    const asOf = opts.asOf ?? Infinity, since = opts.since ?? -Infinity;
    const upTo = items.filter(q => q.ts <= asOf);
    // ① 最近 N 題：精確取最近 N 個列入評量的單位（可以切開一次練習）
    const all = unitsFor(upTo, crit).filter(q => COUNTED.has(q.state));
    const win = all.slice(-crit.qn);
    const num = win.filter(q => success(q, crit)).length;
    const enough = win.length >= crit.qn;
    const value = win.length ? num / win.length * 100 : null;
    // ② 評量期間內「正常完成、且至少含 1 題列入評量」的練習次數（中斷摘要不算）
    const sessions = new Set(all.filter(q => q.done && q.ts >= since).map(q => q.sid)).size;
    const met = enough && value >= crit.pct && sessions >= (crit.minSessions || 0);
    return { met, enough, sessions, window: { num, den: win.length, value, items: win.map(q => ({ sid: q.sid, n: q.n, ...(q.step ? { step: q.step } : {}) })) },
      need: { questions: Math.max(0, crit.qn - win.length), sessions: Math.max(0, (crit.minSessions || 0) - sessions) } };
  }

  // 一個單元的系統精熟（各難度分開判，整體＝minDiff 以上任一難度符合）
  //   records＝這位學生這個單元的紀錄（records＋中斷摘要都可以丟進來）；versions＝標準版本清單
  function evaluateUnit(records, versions, opts = {}) {
    const asOf = opts.asOf ?? Date.now();
    const crit = versionAt(versions && versions.length ? versions : [SYSTEM_DEFAULT], asOf);
    const items = itemsOfRecords(records);
    const perDiff = {};
    DIFFS.forEach(d => {
      if (crit.diff && crit.diff !== d) return;
      const sub = items.filter(q => q.diff === d);
      if (sub.length) perDiff[d] = evaluate(sub, crit, { ...opts, asOf });
    });
    const minIdx = Math.max(0, DIFFS.indexOf(crit.minDiff || 'easy'));
    const met = DIFFS.slice(minIdx).some(d => perDiff[d] && perDiff[d].met);
    return { met, crit, perDiff };
  }

  // 達標事件（規格 6-3，🏅 的依據）：依時間往後掃，每個版本第一次符合時記一筆；existing 裡已有的版本不再記
  //   items＝已篩好單元（與難度）的題目；回傳「新增的」事件（呼叫端存下來，之後不重算、不刪除）
  function findAchievements(items, versions, existing = [], opts = {}) {
    const have = new Set((existing || []).map(e => e.vid));
    const out = [];
    const sorted = items.slice().sort((a, b) => a.ts - b.ts || a.sid - b.sid || a.n - b.n);
    for (let i = 0; i < sorted.length; i++) {
      const t = sorted[i].ts;
      if (i + 1 < sorted.length && sorted[i + 1].ts === t) continue;   // 同一時間的題一起算完
      const v = versionAt(versions, t);
      if (!v || have.has(v.vid)) continue;
      const ev = evaluate(sorted.slice(0, i + 1), v, { since: opts.since, asOf: t });
      if (ev.met) {
        have.add(v.vid);
        out.push({ ts: t, vid: v.vid, criteria: { ...v }, metric: v.metric, num: ev.window.num, den: ev.window.den, value: ev.window.value, questions: ev.window.items });
      }
    }
    return out;
  }

  // 🏅 達標紀錄一律照「目前的標準」從原始作答紀錄即時重算（2026-10-12 使用者定：學習歷程、學習報告、IEP 目標全站統一，
  //   改標準＝🏅 跟著重算、馬上呈現；不再存「當時的版本」的事件）。回傳每一次「從未達到變成達到」的時間（舊→新），
  //   🏅 曾達精熟顯示最近一次；目前仍符合＝✅ 已精熟。crit＝目前的標準（一個版本）
  function achievementsNow(items, crit, opts = {}) {
    const out = [];
    const sorted = items.slice().sort((a, b) => a.ts - b.ts || a.sid - b.sid || a.n - b.n);
    let prev = false;
    for (let i = 0; i < sorted.length; i++) {
      const t = sorted[i].ts;
      if (i + 1 < sorted.length && sorted[i + 1].ts === t) continue;   // 同一時間的題一起算完
      if (opts.until != null && t > opts.until) break;
      const met = evaluate(sorted.slice(0, i + 1), crit, { since: opts.since, asOf: t }).met;
      if (met && !prev) out.push({ ts: t });
      prev = met;
    }
    return out;
  }
  // IEP 目標版：照目標目前的條件（最新版本），每次從未符合變成符合記一筆
  function goalAchievementsNow(goal, records) {
    const crit = versionAt(goal.versions && goal.versions.length ? goal.versions : [SYSTEM_DEFAULT], Infinity);
    const g = { ...goal, versions: [crit] };
    const keys = goal.units || [];
    const until = goalUntil(goal);
    const times = [...new Set(itemsOfRecords((records || []).filter(r => keys.includes(keyOf(r)))).map(q => q.ts))].filter(t => t <= until).sort((a, b) => a - b);
    const out = [];
    let prev = false;
    for (const t of times) {
      const met = evaluateGoal(g, records, { asOf: t }).met;
      if (met && !prev) out.push({ ts: t, criteria: { ...crit } });
      prev = met;
    }
    return out;
  }

  // IEP 目標的系統判定（規格第七節）：goal＝{ units, combine: 'each'|'pooled', versions, start, due }
  //   records＝這位學生的全部紀錄（records＋中斷摘要）。指定難度就只看那個難度；沒指定＝各難度分開、任一符合
  //   each＝每個單元都要符合；pooled＝所有單元的題合在一起判一次
  //   回傳的只是「符合系統條件」，IEP 目標達成與否由老師確認（confirmed），兩者分開
  // 評量期間（規格 start, due）：start 之前、due 那天之後的練習都不算（due＝評量結束日，含當天；沒填＝不限）
  const goalUntil = (goal) => goal.due ? +new Date(goal.due) + 86400000 - 1 : Infinity;
  function evaluateGoal(goal, records, opts = {}) {
    const asOf = Math.min(opts.asOf ?? Date.now(), goalUntil(goal));
    let crit = versionAt(goal.versions && goal.versions.length ? goal.versions : [SYSTEM_DEFAULT], asOf);
    if (crit.metric === 'tolerant' && crit.tol == null) crit = { ...crit, tol: SYSTEM_DEFAULT.tol };   // 設定答對率沒寫容錯＝可錯 1 步
    const since = goal.start ? +new Date(goal.start) : -Infinity;   // 沒填（''）＝不限；寫成 != null 會得到 NaN，完整練習次數永遠 0（2026-10-08 測試抓到）
    const units = goal.units || [];
    const itemsBy = (keys) => itemsOfRecords((records || []).filter(r => keys.includes(keyOf(r))));
    const judge = (items) => {
      const diffs = crit.diff ? [crit.diff] : DIFFS.slice(Math.max(0, DIFFS.indexOf(crit.minDiff || 'easy')));
      const per = {};
      diffs.forEach(d => { const sub = items.filter(q => q.diff === d); if (sub.length) per[d] = evaluate(sub, crit, { asOf, since }); });
      return { met: Object.values(per).some(x => x.met), perDiff: per };
    };
    if ((goal.combine || 'each') === 'pooled') {
      const res = judge(itemsBy(units));
      return { met: res.met, crit, combine: 'pooled', pooled: res };
    }
    const perUnit = {};
    units.forEach(k => { perUnit[k] = judge(itemsBy([k])); });
    return { met: units.length > 0 && units.every(k => perUnit[k].met), crit, combine: 'each', perUnit };
  }

  // IEP 目標的達標事件：依時間往後掃，每個版本第一次「符合系統條件」時記一筆（含當時每個單元／合併的視窗）
  //   existing＝已存下的事件（同版本不再記）；回傳新增的事件，呼叫端存進 goal.events，之後不重算、不刪除
  function goalAchievements(goal, records, existing = []) {
    const have = new Set((existing || []).map(e => e.vid));
    const keys = goal.units || [];
    const until = goalUntil(goal);   // 評量結束日之後的練習不會產生達標事件
    const times = [...new Set(itemsOfRecords((records || []).filter(r => keys.includes(keyOf(r)))).map(q => q.ts))].filter(t => t <= until).sort((a, b) => a - b);
    const out = [];
    for (const t of times) {
      const v = versionAt(goal.versions && goal.versions.length ? goal.versions : [SYSTEM_DEFAULT], t);
      if (!v || have.has(v.vid)) continue;
      const res = evaluateGoal(goal, records, { asOf: t });
      if (!res.met) continue;
      have.add(v.vid);
      const pick = (per) => Object.fromEntries(Object.entries(per.perDiff).filter(([, x]) => x.met)
        .map(([d, x]) => [d, { num: x.window.num, den: x.window.den, value: x.window.value, questions: x.window.items }]));
      out.push({ ts: t, vid: v.vid, criteria: { ...v }, combine: res.combine,
        evidence: res.combine === 'pooled' ? { pooled: pick(res.pooled) } : Object.fromEntries(Object.entries(res.perUnit).map(([k, x]) => [k, pick(x)])) });
    }
    return out;
  }

  // A 系列各單元會用到哪些步驟代號（各單元 logStep 第三個參數；B／C／F 一題一步＝answer，不列）。
  // IEP 目標的「只看這些步驟」選項、範本檢查（tests/_audit_iep_templates.js）都讀這一份
  const UNIT_STEPS = {
    a1: ['pick', 'pay'], a2: ['order', 'pay'], a3: ['change', 'change_calc'], a4: ['pick', 'pay', 'change', 'change_calc'],
    a5: ['menu', 'pin', 'amount', 'deposit', 'order', 'bank', 'account', 'check', 'confirm'], a6: ['from', 'to', 'type', 'qty', 'change'],
  };

  const api = { STATE, ICON, COUNTED, STEP_NAMES, UNIT_STEPS, SYSTEM_DEFAULT, DIFFS, normDiff, keyOf, deriveQuestions, tolAllowed, success,
    itemsOf, itemsOfRecords, metrics, versionAt, goalRate, evaluate, evaluateUnit, evaluateGoal, findAchievements, goalAchievements, achievementsNow, goalAchievementsNow };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EvalCore = api;
})(typeof window !== 'undefined' ? window : this);
