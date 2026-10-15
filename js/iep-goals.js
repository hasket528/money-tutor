// ─── 🏁 IEP 目標（評量規格定稿 v1 第七節；第 4 階段，2026-10-08）──────────────────────
// 每位學生自己一份目標清單：localStorage mt_iep_goals_{學生id}＝[目標…]（全部學生／訪客不設目標）。
// 目標：{ id, iepText, text, setupText, units, combine, versions, start, due, events, observe, confirmed, created }
//   iepText＝寫進 IEP 的句子（主句）；text＝系統評量敘述（教材裡怎麼練、系統判斷什麼）；舊目標只有 text
//   setupText＝練習時設定頁該怎麼選（老師寫的一行字，例「普通模式・數數範圍 1-10」）；單元設定頁選了學生就顯示（js/iep-reminder.js）
//   versions＝評量條件的變更紀錄 [{ vid, from, metric, pct, qn, minSessions, diff, steps, hintSrc }]：改條件＝加一版、不覆寫舊版
//   events＝舊版存下的達標事件（2026-10-12 起不再寫入、不顯示：🏅 一律照目前的條件用 EvalCore.goalAchievementsNow 即時重算）
//   observe＝老師觀察紀錄；confirmed＝老師確認 IEP 目標已達成。**「符合系統條件」≠「IEP 目標已達成」，兩者分開顯示**
// 計算一律呼叫 js/eval-core.js（由 js/learning-tracker.js 自動載入），這裡只管資料與畫面。
// 依賴 teacher.html 的全域：esc、UNITS、SERIES、loadScenarioList、loadCustomNames、cfgBtnState、isOneStudent、
//   iepName、_allRecs、stuKey、dbAllInterrupted、loadData。
// 測試：node tests/_e2e_iep_goals.js
const IepGoals = (() => {
  const KEY = (sid) => `mt_iep_goals_${sid}`;
  const load = (sid) => { try { const a = JSON.parse(localStorage.getItem(KEY(sid)) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const store = (sid, list) => localStorage.setItem(KEY(sid), JSON.stringify(list));

  const METRIC = {
    firstTry:   { name: '無錯答對率', tip: '沒答錯，也沒用提示（系統預設）' },
    noHint:     { name: '無提示答對率', tip: '沒用提示；答錯後自己改對也算' },
    completion: { name: '答對率（含提示）', tip: '用提示後答對也算' },
    tolerant:   { name: '設定答對率', tip: '無錯答對率再放寬幾步：一題裡沒有一次就對的步驟在容錯以內就算對（2026-10-11）' },
  };
  // 指標的完整寫法：設定答對率帶容錯步數（同 teacher.html critLabel）
  const metricTxt = (v) => METRIC[v.metric].name + (v.metric === 'tolerant' ? `（可錯 ${v.tol || 1} 步）` : '');
  const DIFF_TXT = { '': '各難度分開判定', easy: '簡單', normal: '普通', hard: '困難' };
  // ⚡ 快速套用的範本（js/iep-goal-templates.js）：單元代號查表；生活情境對話（'場景|情境'）依場所所屬的部分
  //   找 dialogue_p1～p7（部分＝js/home-catalog.js，與 IEP 勾選分頁同一份），找不到（老師自訂情境）退回通用的 'dialogue'
  const LEVEL_ORDER = ['起步', '進展', '獨立'];
  const tplKey = (k) => {
    if (!k || !k.includes('|')) return k;
    const part = (window.HOME_CATALOG?.scenarios || []).find(x => x.id === k.split('|')[0])?.part;
    return part && (window.IEP_GOAL_TEMPLATES || {})['dialogue_p' + part] ? 'dialogue_p' + part : 'dialogue';
  };
  const templatesFor = (k) => {
    const list = (window.IEP_GOAL_TEMPLATES || {})[tplKey(k)] || [];
    return list.slice().sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
  };
  const unitRef = (k) => (window.IEP_GOAL_UNIT_REF || {})[tplKey(k)] || null;
  // 建議代碼：生活管理分初階（起步／進展）與進階（獨立）兩組，取法在 js/iep-goal-templates.js IEP_UNIT_CODES
  const refCodes = (k) => {
    const key = tplKey(k), r = unitRef(k), f = window.IEP_UNIT_CODES;
    if (!r || !f) return '';
    const list = (st) => { const c = f(key, st); return c ? [...c.perf, ...c.content].join('、') : ''; };
    if (!r.sA) return list('sP') ? `　建議代碼：${list('sP')}` : '';
    return `　建議代碼　初階（起步／進展）：${list('sP')}　進階（獨立）：${list('sA')}`;
  };
  // 目標的主句（2026-10-08 範本 v2）：iepText＝寫進 IEP 的句子（照學生需要寫，會延伸到實物與真實情境），
  //   text＝這個目標在教材裡怎麼練、系統判斷什麼（「系統評量」）。舊目標只有 text → 主句就是 text。
  //   設定頁提醒（js/iep-reminder.js）用同一條規則。
  const goalTitle = (g) => g.iepText || g.text || '';
  // 評量期間一句話（start／due＝評量開始／評量結束，js/eval-core.js 只算這段期間的練習）
  const periodTxt = (g) => g.start && g.due ? `評量期間 ${g.start}～${g.due}` : g.start ? `評量期間 ${g.start} 起` : g.due ? `評量到 ${g.due} 為止` : '';
  const sysLine = (g) => g.iepText && g.text ? g.text : '';
  // 練習設定的顯示：不寫題數（2026-10-09 使用者定），舊目標存的「・10 題」顯示時拿掉；設定頁提醒（js/iep-reminder.js）同一條規則
  const setupShow = (s) => String(s || '').replace(/・\s*\d+\s*題/g, '').trim();
  const HINT_TXT = { self: '手動按下提示', auto: '錯誤三次提示' };
  const DEF = () => ({ ...window.EvalCore.SYSTEM_DEFAULT });
  // 每一題 容錯程度（2026-10-11 使用者定，同 📏 系統精熟標準）：判定唯一在 EvalCore.tolAllowed
  const TOL_OPTS = [[1, '可錯 1 步'], [2, '可錯 2 步']];   // 只在評量指標選「設定答對率」時出現
  const TOL_TIP = '一題裡「沒有一次就對」的步驟在幾步以內，仍算這一題答對（只影響精熟判定，題目本身的結果照實記錄）。一題至少要對六成步驟：1～2 步的題一律要一次就對、3～4 步最多可錯 1 步';

  let _who = null, _editing = null, _recs = [], _scen = null;
  // 全部學生（2026-10-08 使用者定）：➕ 新增與 ⚡ 快速套用一次套用到每一位學生（已經有相同目標的學生略過）；
  //   📋 列出與 🗂 卡片先列學生（S1、S2…），點了才顯示那位的內容（_stu），之後的修改／刪除／觀察都作用在那位
  let _stu = null;
  const isAll = (who) => who === '__all__';
  const sid = () => isOneStudent(_who) ? _who : _stu;
  // 全部學生＝學習歷程「👤 學生資料」下拉選單列出的每一位（同一份清單，不另外讀名冊）
  const allStudents = () => [...document.querySelectorAll('#stu-filter option')].filter(o => isOneStudent(o.value)).map(o => ({ id: o.value, name: o.textContent.trim() }));
  // 套用給哪些學生（2026-10-08 使用者定：➕ 新增與 ⚡ 快速套用可勾選 S1、S2…）：全部學生預設全勾、單一學生預設只勾他自己
  function targetsHtml() {
    const studs = allStudents(), def = isAll(_who) ? null : _who;
    return `<div class="g-row g-targets"><span>套用給</span>
      <label class="g-tg-all"><input type="checkbox" data-tgall${!def ? ' checked' : ''}> 全選</label>
      ${studs.map(s => `<label><input type="checkbox" data-tg="${esc(s.id)}"${!def || s.id === def ? ' checked' : ''}> ${esc(s.name)}</label>`).join('')}</div>`;
  }
  const targetsOf = (root) => [...root.querySelectorAll('input[data-tg]:checked')].map(i => i.dataset.tg);
  // 只勾了目前這一位（單一學生時的預設）＝照原本單一學生的流程；其他情況＝逐位建立、相同目標略過
  const onlySelf = (ids) => !isAll(_who) && ids.length === 1 && ids[0] === _who;
  function syncTargets(root) {
    if (!root) return;
    const n = targetsOf(root).length, a = root.querySelector('input[data-tgall]');
    if (a) a.checked = n > 0 && n === root.querySelectorAll('input[data-tg]').length;
    const note = root.querySelector('.g-all-note');
    if (note) note.innerHTML = n > 1 || isAll(_who)
      ? `👥 替勾選的 <b>${n}</b> 位學生各建立一個；已有相同目標者略過。`
      : '👤 只替這位學生建立，可在下方加選其他學生。';
  }
  // 「相同目標」＝同一個主要單元＋同一句目標（IEP 目標句或系統評量句其一相同）
  const sameGoal = (x, k, iepText, text) => (x.units || [])[0] === k && ((!!iepText && x.iepText === iepText) || (!!text && x.text === text));
  // 檢視（2026-10-08 使用者定：「➕ 新增」旁再兩個）：'cards' 目標卡片｜'quick' ⚡ 快速套用（依 IEP 學習單元一次建立）｜'list' 📋 列出已撰寫的目標
  let _view = 'cards', _backView = 'cards', _preUnit = null, _preTpl = null, _quickExtra = [];
  const box = () => document.getElementById('goal-edit');
  const fmtD = (ts) => new Date(ts).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
  // 「目前」＝今天；紀錄比今天還新（S1～S5 模擬資料到 10/15）就算到最後一筆，真實資料不受影響
  const asOfNow = () => Math.max(Date.now(), ..._recs.map(r => r.ts || 0));
  const curV = (g) => window.EvalCore.versionAt(g.versions, Date.now());

  // 單元名稱（主課程、冒險、對話「場景|情境」）
  function unitName(k) {
    if (!k.includes('|')) return iepName({ k });
    const [sc, si] = k.split('|');
    const s = (_scen || []).find(x => x.id === sc), t = s && s.situations.find(y => y.id === si);
    if (s && t) return `${s.name}・${t.name}`;
    const cn = loadCustomNames(), c = cn.customs.get(sc);
    return c ? `${cn.scenes.get(c.parentId)?.name || '自訂場景'}・${c.name}` : k;
  }
  // 一句話摘要（基本設定只要選單元，其餘帶預設，這句就是給老師確認的）
  function summary(units, combine, v) {
    const names = units.map(unitName).join('、') || '（還沒選單元）';
    const parts = [`${metricTxt(v)} ≥ ${v.pct}%`, `最近 ${v.qn} 題`, `至少 ${v.minSessions} 次完整練習`, DIFF_TXT[v.diff || '']];
    if (v.steps && v.steps.length) parts.push('只看「' + v.steps.map(s => window.EvalCore.STEP_NAMES[s] || s).join('、') + '」步驟');
    if (v.metric === 'completion' && v.hintSrc && v.hintSrc.length) parts.push('提示只承認' + v.hintSrc.map(h => HINT_TXT[h]).join('、'));
    if (units.length > 1) parts.push(combine === 'pooled' ? '各單元合併計算' : '每個單元都要達到');
    return `${names}：${parts.join('，')}。`;
  }

  async function studentRecords(who) {
    const recs = (typeof _allRecs !== 'undefined' ? _allRecs : []).filter(r => stuKey(r) === who);   // _allRecs 是 teacher.html 的頂層 let，不在 window 上
    let ints = [];
    try { ints = (await dbAllInterrupted()).filter(r => stuKey(r) === who); } catch (e) {}
    return recs.concat(ints);
  }
  // 🏅 達標紀錄：照目標目前的條件即時重算（2026-10-12 使用者定，全站統一；改條件＝跟著重算）
  const achNow = (g) => window.EvalCore.goalAchievementsNow(g, _recs);

  // 目前狀態一句話（含難度，GPT 2026-10-08：不同難度的精熟不能看起來一樣）
  function statusHtml(g) {
    const res = window.EvalCore.evaluateGoal(g, _recs, { asOf: asOfNow() });
    const v = res.crit;
    const diffLine = (label, per) => {
      const ds = Object.entries(per.perDiff).filter(([, x]) => x.window.den > 0);   // 只列有作答的難度
      if (!ds.length) return `<li>${label}：尚無這個 IEP 精熟標準要看的作答紀錄${v.steps && v.steps.length ? '（指定步驟尚未練習）' : ''}</li>`;
      return ds.map(([d, x]) => {
        const val = x.window.value == null ? '—' : Math.round(x.window.value) + '%';
        const need = !x.enough ? `已累積 ${x.window.den}/${v.qn} 題，暫不判定` : x.need.sessions ? `完整練習 ${x.sessions}/${v.minSessions} 次` : '';
        return `<li>${label}・${DIFF_TXT[d]}：最近 ${x.window.den} 題 ${metricTxt(v)} ${val}（${x.window.num}/${x.window.den}）` +
          `${need ? `<span class="g-need">　${need}</span>` : ''}${x.met ? '　<b class="g-ok">✅ 符合</b>' : ''}</li>`;
      }).join('');
    };
    const lines = res.combine === 'pooled' ? diffLine('合併計算', res.pooled) : (g.units || []).map(k => diffLine(esc(unitName(k)), res.perUnit[k])).join('');
    return `<div class="g-status ${res.met ? 'met' : ''}"><b>${res.met ? '✅ IEP 已精熟' : '⬜ IEP 尚未精熟'}</b><ul>${lines}</ul></div>`;
  }

  function cardHtml(g) {
    const v = curV(g);
    const ev = achNow(g).map(e => `<li>🏅 ${fmtD(e.ts)} 達到 IEP 精熟標準（${metricTxt(e.criteria)} ≥ ${e.criteria.pct}%・最近 ${e.criteria.qn} 題` +
      `${e.criteria.diff ? '・' + DIFF_TXT[e.criteria.diff] : ''}）</li>`).join('');
    const obs = (g.observe || []).map((o, i) => `<li>${esc(o.date)}　<b>${esc(o.result)}</b>　${esc(o.note || '')} <button type="button" class="g-link" data-act="obs-del" data-i="${i}" aria-label="刪除這筆觀察">✕</button></li>`).join('');
    const conf = g.confirmed
      ? `<div class="g-confirm done">👩‍🏫 老師已確認達成（${esc(g.confirmed.date)}）${g.confirmed.note ? '：' + esc(g.confirmed.note) : ''} <button type="button" class="g-link" data-act="unconfirm">取消確認</button></div>`
      : `<details class="g-confirm"><summary>👩‍🏫 老師確認達成…</summary>
          <div class="g-row"><label>日期 <input type="date" data-f="cdate" value="${new Date().toISOString().slice(0, 10)}"></label>
          <label class="g-grow">備註 <input type="text" data-f="cnote" placeholder="例：課堂實際購物也能獨立完成"></label>
          <button type="button" class="t-btn t-btn-primary" data-act="confirm">確認達成</button></div></details>`;
    return `<div class="g-card" data-id="${esc(g.id)}">
      <div class="g-head"><b class="g-text">${esc(goalTitle(g))}</b>
        <span class="g-btns"><button type="button" class="t-btn t-btn-secondary" data-act="edit">✏️ 修改</button>
        <button type="button" class="t-btn t-btn-danger" data-act="del">🗑️ 刪除</button></span></div>
      ${sysLine(g) ? `<div class="g-note">🖥️ 系統評量：${esc(sysLine(g))}</div>` : ''}
      ${g.observeTip ? `<div class="g-note">👀 建議另外觀察：${esc(g.observeTip)}</div>` : ''}
      <div class="g-sum">🏁 IEP 精熟標準：${esc(summary(g.units || [], g.combine, v))}${periodTxt(g) ? `　${esc(periodTxt(g))}` : ''}${(g.versions || []).length > 1 ? `　（條件改過 ${g.versions.length - 1} 次）` : ''}${v && v.from > 0 ? `　依 ${fmtD(v.from)} 設定的標準計算` : ''}</div>
      ${setupShow(g.setupText) ? `<div class="g-note">🛠️ 練習設定：${esc(setupShow(g.setupText))}</div>` : ''}
      ${statusHtml(g)}
      ${ev ? `<ul class="g-ev">${ev}</ul>` : ''}
      <p class="g-note">「IEP 已精熟」是系統依作答紀錄判定，仍需老師依課堂觀察確認是否達成 IEP 目標。</p>
      ${conf}
      <details class="g-obs"${obs ? ' open' : ''}><summary>📝 觀察紀錄${(g.observe || []).length ? `（${g.observe.length}）` : ''}</summary>
        ${obs ? `<ul>${obs}</ul>` : ''}
        <div class="g-row"><label>日期 <input type="date" data-f="odate" value="${new Date().toISOString().slice(0, 10)}"></label>
        <label>結果 <select data-f="ores"><option>達成</option><option>部分達成</option><option>未達成</option></select></label>
        <label class="g-grow">說明 <input type="text" data-f="onote" placeholder="例：在口語提示下完成 4/5 次"></label>
        <button type="button" class="t-btn t-btn-secondary" data-act="obs-add">＋ 加入</button></div>
      </details>
    </div>`;
  }

  // ── ⚡ 快速套用：這位學生的 IEP 學習單元（＋老師另外加的單元）每列選一個層級，一次建立；也可以「✏️ 自訂」單一單元 ──
  function quickUnits() {
    const iep = (typeof iepUnits === 'function' ? iepUnits(_who) : []).map(x => x.k);
    return [...new Set([...iep, ..._quickExtra])];
  }
  // 建議層級（2026-10-08 使用者定：點「⚡ 快速套用」就已經選好，老師不用再選）：依這個單元最近 10 題的表現
  //   還沒練／不到 5 題／只有輔助點擊＝起步；無錯答對率 ≥ 80%＝獨立；無提示答對率 ≥ 70%＝進展；其餘＝起步
  //   這個單元已經有目標＝不建立（避免重複）
  // 建議規則（唯一定義；判斷本身在下面的 suggestLevel，改規則兩處一起改）。2026-10-09 使用者定：
  //   滑鼠移到「全部改成」的按鈕，只顯示那一級的規則（不加「系統建議「X」：」開頭，2026-10-09 使用者定）；「依建議」顯示整套怎麼選（看最近 10 題）
  const SUGGEST_TIPS = {
    '起步': '還沒練習過、練習不到 5 題，或沒達到進展、獨立的標準',
    '進展': '無提示答對率 ≥ 70%（無錯答對率還沒到 80%）',
    '獨立': '無錯答對率 ≥ 80%',
    '*': ['依學生這個單元最近 10 題的表現選：', '無錯答對率 ≥ 80% → 獨立', '無提示答對率 ≥ 70% → 進展',
      '還沒練習過、不到 5 題或其他 → 起步', '這個單元已經有目標 → 不建立'].join('\n'),
  };
  function suggestLevel(k, list, recs = _recs) {
    const has = list.filter(g => (g.units || []).includes(k)).length;
    if (has) return { lv: '', why: `此單元已有 ${has} 個目標` };
    const items = window.EvalCore.itemsOfRecords(recs.filter(r => window.EvalCore.keyOf(r) === k))
      .filter(q => window.EvalCore.COUNTED.has(q.state)).slice(-10);
    if (items.length < 5) return { lv: '起步', why: items.length ? `只練了 ${items.length} 題` : '還沒有練習紀錄' };
    const m = window.EvalCore.metrics(items), ft = Math.round(m.firstTry), nh = Math.round(m.noHint);
    if (ft >= 80) return { lv: '獨立', why: `最近 ${items.length} 題無錯答對率 ${ft}%` };
    if (nh >= 70) return { lv: '進展', why: `最近 ${items.length} 題無提示答對率 ${nh}%` };
    return { lv: '起步', why: `最近 ${items.length} 題無提示答對率 ${nh}%` };
  }
  // 每列標題旁那一句（2026-10-09 使用者確認，三種情況各說各的，「建議」不重複）：
  //   單一學生＝💡 系統建議「獨立」：最近 10 題無錯答對率 90%（老師改了層級，仍看得出系統原本建議哪一級）
  //   全部學生・依各學生建議＝💡 每位學生依自己最近的表現選層級；此單元已有目標的學生略過
  //   全部學生・固定層級＝👥 每位學生都套用「進展」；已有相同目標的學生略過（固定層級沒用到建議，略過規則也不同）
  function rowNote(lv, sug) {
    if (isAll(_who)) {
      if (lv === '*') return '💡 每位學生依自己最近的表現選層級；此單元已有目標的學生略過';
      return lv ? `👥 每位學生都套用「${lv}」；已有相同目標的學生略過` : '';
    }
    if (!sug) return '';
    return sug.lv ? `💡 系統建議「${sug.lv}」：${sug.why}` : `💡 ${sug.why}，預設不建立`;
  }
  // 一列：預先選好的目標＋可換層級的下拉＋✏️ 自訂
  // lv＝'*'（只有全部學生）＝依各學生建議：建立時每位學生各自算 suggestLevel；sug＝單一學生的建議（全部學生＝null）
  function quickRowHtml(k, lv, sug) {
    const tpls = templatesFor(k), t = tpls.find(x => x.level === lv), each = lv === '*' && tpls.length > 0;
    const note = rowNote(lv, sug);
    const sel = `<select data-f="qlv" aria-label="${esc(unitName(k))} 的層級">${isAll(_who) && tpls.length ? `<option value="*"${each ? ' selected' : ''}>依各學生建議</option>` : ''}${LEVEL_ORDER.filter(l => tpls.some(x => x.level === l)).map(l =>
      `<option value="${l}"${l === lv ? ' selected' : ''}>${l}</option>`).join('')}<option value=""${!t && !each ? ' selected' : ''}>不建立</option></select>`;
    const head = `<div class="g-q-head"><b>${esc(unitName(k))}</b>${sel}${note ? `<span class="g-note">${esc(note)}</span>` : ''}
        <button type="button" class="g-link" data-act="quick-custom" title="打開完整表單，針對這個單元另外設定${each ? '' : '（已套用目前選的層級）'}">✏️ 自訂</button></div>`;
    if (each) return `<div class="g-q-row" data-k="${esc(k)}">
      ${head}
      <div class="g-q-goal g-note">${LEVEL_ORDER.filter(l => tpls.some(x => x.level === l)).map(l => `<span class="g-lv g-lv-${LEVEL_ORDER.indexOf(l)}">${l}</span> ${esc((tpls.find(x => x.level === l).iep || tpls.find(x => x.level === l).text))}`).join('<br>')}</div>
    </div>`;
    return `<div class="g-q-row${t ? '' : ' g-q-skip'}" data-k="${esc(k)}">
      ${head}
      ${t ? `<div class="g-q-goal"><span class="g-lv g-lv-${LEVEL_ORDER.indexOf(t.level)}">${esc(t.level)}</span> <b>${esc(t.iep || t.text)}</b>
          ${t.iep ? `<div class="g-note">🖥️ 系統評量：${esc(t.text)}${setupShow(t.setupText) ? `　🛠️ ${esc(setupShow(t.setupText))}` : ''}</div>` : ''}
          <div class="g-note">${esc(summary([k], 'each', { ...DEF(), ...t }).replace(/^[^：]*：/, ''))}</div>
          ${t.observe ? `<div class="g-note">👀 建議另外觀察：${esc(t.observe)}</div>` : ''}</div>`
        : tpls.length ? '<div class="g-note">不建立此單元的目標。</div>' : '<div class="g-note">沒有範本，請按「✏️ 自訂」。</div>'}
    </div>`;
  }
  function quickHtml(list) {
    const units = quickUnits(), all = isAll(_who);
    const rows = units.map(k => { if (all) return quickRowHtml(k, '*', null); const s0 = suggestLevel(k, list); return quickRowHtml(k, s0.lv, s0); }).join('');
    // 「套用給」放最上面、說明精簡（2026-10-11 使用者定，比照 🎯 IEP 學習單元）
    return `<div class="g-quick">
      ${units.length ? `<div class="g-tg-box"><p class="g-note g-all-note"></p>${targetsHtml()}</div>` : ''}
      <p class="g-note">${all ? '每位學生依自己最近的表現選層級，也可用「全部改成」統一指定。' : '已依最近表現選好建議層級，可用下拉調整或按「✏️ 自訂」。'}</p>
      ${units.length ? `<div class="g-row"><span>全部改成</span>${LEVEL_ORDER.map(lv => `<button type="button" class="t-btn t-btn-secondary" data-act="quick-all" data-lv="${lv}" title="${esc(SUGGEST_TIPS[lv])}">${lv}</button>`).join('')}
        <button type="button" class="t-btn t-btn-secondary" data-act="quick-all" data-lv="*" title="${esc(SUGGEST_TIPS['*'])}">依建議</button></div>
        <div class="g-row g-period"><label>評量開始 <input type="date" data-f="quick-start"></label>
          <label>評量結束 <input type="date" data-f="quick-due"></label>
          <span class="g-note">未填＝不限；只採計評量期間內（含開始、結束日）的練習，其他紀錄仍保留。</span></div>
        ${rows}` : `<p class="g-note">${all ? '全班預設' : '這位學生'}尚未設定 IEP 學習單元，請先到「① 選擇單元」勾選並儲存，或在下方加入單元。</p>`}
      <div class="g-row"><span>加入其他單元</span><select data-f="quick-more">${unitOptions('')}</select>
        <button type="button" class="t-btn t-btn-secondary" data-act="quick-add">＋ 加入</button></div>
    </div>`;
  }
  // 「⚡ 套用」鈕上的數字＝目前選了幾個
  const quickCount = (b) => { const n = b.querySelector('.g-q-n'); if (n) n.textContent = String(quickPicked(b).length); };
  // 依範本建立一個目標（快速套用用；條件＝範本，第一版從評量開始日生效）
  function goalFromTemplate(k, t, start, due) {
    const id = 'g' + Date.now() + Math.floor(Math.random() * 1000);
    return { id, iepText: t.iep || '', text: t.text, setupText: t.setupText || '', units: [k], combine: 'each', start: start || '', due: due || '', observeTip: t.observe || '',
      versions: [{ vid: id + '-v1', from: start ? +new Date(start) : 0, metric: t.metric, pct: t.pct, qn: t.qn, minSessions: t.minSessions,
        diff: t.diff || null, minDiff: 'easy', steps: t.steps || null, hintSrc: t.hintSrc || null }],
      events: [], observe: [], confirmed: null, created: Date.now() };
  }
  // t＝'*'＝依各學生建議（建立時才決定）
  function quickPicked(b) {
    return [...b.querySelectorAll('.g-q-row')].map(row => {
      const lv = row.querySelector('[data-f="qlv"]').value;
      if (lv === '*') return { k: row.dataset.k, t: '*' };
      const t = lv ? templatesFor(row.dataset.k).find(x => x.level === lv) : null;
      return t ? { k: row.dataset.k, t } : null;
    }).filter(Boolean);
  }
  // 勾選學生的快速套用（含全部學生）：每位學生各自決定層級（'*'）、略過已有相同目標的
  async function quickCreateFor(ids, picked, start, due) {
    let made = 0, skipped = 0;
    for (const id of ids) {
      const list = load(id), recs = await studentRecords(id);
      picked.forEach(p => {
        const t = p.t === '*' ? templatesFor(p.k).find(x => x.level === suggestLevel(p.k, list, recs).lv) : p.t;
        if (!t || list.some(x => sameGoal(x, p.k, t.iep, t.text))) { skipped++; return; }
        list.push(goalFromTemplate(p.k, t, start, due)); made++;
      });
      store(id, list);
    }
    return { made, skipped, n: ids.length };
  }

  // ── 📋 列出已撰寫的 IEP 目標：依單元分組，一列一個目標；可修改、刪除，或替這個單元再新增 ──
  function listHtml(list) {
    if (!list.length) return '<p class="g-note">尚無 IEP 目標。請按「➕ 新增目標」或「⚡ 快速套用目標」建立。</p>';
    const iep = (typeof iepUnits === 'function' ? iepUnits(sid()) : []).map(x => x.k);
    const keys = [...new Set([...iep.filter(k => list.some(g => (g.units || [])[0] === k)), ...list.map(g => (g.units || [])[0])])];
    const asOf = asOfNow();
    return keys.map(k => {
      const gs = list.filter(g => (g.units || [])[0] === k);
      const rows = gs.map(g => {
        const v = curV(g), res = window.EvalCore.evaluateGoal(g, _recs, { asOf });
        const more = (g.units || []).slice(1).map(unitName);
        return `<tr data-id="${esc(g.id)}"><td><b>${esc(goalTitle(g))}</b>${sysLine(g) ? `<div class="g-note">🖥️ 系統評量：${esc(sysLine(g))}</div>` : ''}${setupShow(g.setupText) ? `<div class="g-note">🛠️ ${esc(setupShow(g.setupText))}</div>` : ''}${more.length ? `<div class="g-note">另含：${esc(more.join('、'))}</div>` : ''}</td>
          <td class="g-note">${esc(summary([], g.combine, v).replace(/^[^：]*：/, ''))}</td>
          <td>${res.met ? '<b class="g-ok">✅ 符合</b>' : '⬜ 未符合'}${(a => a.length ? `<div class="g-note">🏅 ${fmtD(a[a.length - 1].ts)}</div>` : '')(achNow(g))}</td>
          <td>${g.confirmed ? `<b class="g-ok">👩‍🏫 ${esc(g.confirmed.date)}</b>` : '—'}</td>
          <td class="g-nowrap"><button type="button" class="t-btn t-btn-secondary" data-act="edit">✏️ 修改</button>
            <button type="button" class="t-btn t-btn-danger" data-act="del">🗑️</button></td></tr>`;
      }).join('');
      return `<div class="g-l-unit" data-k="${esc(k)}"><div class="g-q-head"><b>${esc(unitName(k))}</b>${iep.includes(k) ? '<span class="g-note">　🎯 IEP</span>' : ''}</div>
        <div class="table-scroll"><table class="g-l-table"><tr><th>IEP 目標</th><th>🏁 IEP 精熟標準</th><th>系統紀錄</th><th>老師確認</th><th></th></tr>${rows}</table></div></div>`;
    }).join('');
  }

  // ── 新增／修改表單（基本＋進階）──
  function unitOptions(sel) {
    const opt = (k, n) => `<option value="${esc(k)}"${k === sel ? ' selected' : ''}>${esc(n)}</option>`;
    let h = '<option value="">請選擇單元或情境</option>';
    SERIES.forEach(({ key, label }) => { h += `<optgroup label="${esc(label.replace(/^第.部分：/, ''))}">` + UNITS[key].map(([u, n]) => opt(u, key === 'ADV' ? '一日金錢冒險' : n)).join('') + '</optgroup>'; });
    (_scen || []).forEach(sc => { h += `<optgroup label="💬 ${esc(sc.name)}">` + sc.situations.map(t => opt(`${sc.id}|${t.id}`, `${sc.name}・${t.name}`)).join('') + '</optgroup>'; });
    return h;
  }
  function formHtml(g) {
    const v = g ? curV(g) : DEF();
    const units = g ? g.units.slice() : _preUnit ? [_preUnit] : [];
    const sel = (f, vals, cur) => `<select data-f="${f}">${vals.map(([val, t]) => `<option value="${val}"${String(val) === String(cur ?? '') ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
    return `<div class="g-form" data-units='${esc(JSON.stringify(units))}'>
      <b>${g ? '✏️ 修改 IEP 目標' : '➕ 新增 IEP 目標'}</b>
      ${!g ? `<p class="g-note g-all-note"></p>${targetsHtml()}` : ''}
      <label class="g-block">IEP 目標（寫進 IEP 的句子，會顯示在學習歷程與報告）
        <textarea data-f="iep" rows="2" placeholder="例：能在超商購物時算出應找回的錢，並當場核對">${esc(g ? g.iepText || '' : '')}</textarea></label>
      <label class="g-block">系統評量（教材裡練什麼、系統判斷什麼）
        <textarea data-f="text" rows="2" placeholder="例：能在普通模式自行完成 100 元以內的找零">${esc(g ? g.text : '')}</textarea></label>
      <label class="g-block">對應的單元或情境
        <select data-f="unit">${unitOptions(units[0] || '')}</select></label>
      <label class="g-block">練習設定（會顯示在單元設定頁）
        <input type="text" data-f="setup" maxlength="80" placeholder="例：普通模式・數數範圍 1-10" value="${esc(g?.setupText || '')}"></label>
      <div class="g-row g-period"><label>評量開始 <input type="date" data-f="start" value="${esc(g?.start || '')}"></label>
        <label>評量結束 <input type="date" data-f="due" value="${esc(g?.due || '')}"></label>
        <span class="g-note">未填＝不限；只採計評量期間內（含開始、結束日）的練習，其他紀錄仍保留。</span></div>
      <div class="g-sumlive" aria-live="polite"></div>
      <details class="g-adv"><summary>⚙️ 進階設定（可保留預設值）</summary>
        <div class="g-row"><span>評量指標</span>${Object.entries(METRIC).map(([k, m]) =>
          `<label title="${esc(m.tip)}"><input type="radio" name="g-metric" value="${k}"${v.metric === k ? ' checked' : ''}> ${m.name}</label>`).join('')}</div>
        <div class="g-row">
          <label>達成門檻 ${sel('pct', [50, 60, 70, 75, 80, 85, 90, 95, 100].map(x => [x, x + '%']), v.pct)}</label>
          <label>最近幾題 ${sel('qn', [5, 10, 15, 20, 30].map(x => [x, x + ' 題']), v.qn)}</label>
          <label>至少幾次完整練習 ${sel('minSessions', [1, 2, 3, 4, 5].map(x => [x, x + ' 次']), v.minSessions)}</label>
          <label>難度 ${sel('diff', [['', '各難度分開判定'], ['easy', '只看簡單'], ['normal', '只看普通'], ['hard', '只看困難']], v.diff || '')}</label>
        </div>
        <div class="g-row g-tolrow"${v.metric === 'tolerant' ? '' : ' hidden'}><label title="${esc(TOL_TIP)}">每一題 容錯程度 ${sel('tol', TOL_OPTS, v.tol || 1)}</label>
          <span class="g-note">步數少的題目會自動少容許一些</span></div>
        <div class="g-row g-more"><span>其他單元</span><select data-f="more">${unitOptions('')}</select>
          <button type="button" class="t-btn t-btn-secondary" data-act="unit-add">＋ 加入</button><span class="g-chips"></span></div>
        <div class="g-row g-combine"><span>多個單元時</span>
          <label><input type="radio" name="g-combine" value="each"${(g?.combine || 'each') === 'each' ? ' checked' : ''}> 每個單元都要達到</label>
          <label><input type="radio" name="g-combine" value="pooled"${g?.combine === 'pooled' ? ' checked' : ''}> 合併計算</label></div>
        <div class="g-row g-steps"></div>
        <div class="g-row g-hint"><span>答對率（含提示）只採計</span>${Object.entries(HINT_TXT).map(([k, t]) =>
          `<label><input type="checkbox" data-hint="${k}"${!v.hintSrc || v.hintSrc.includes(k) ? ' checked' : ''}> ${t}</label>`).join('')}</div>
        <p class="g-note">系統只判斷記錄得到的作答。口語提示、肢體協助、真實情境請記在「📝 觀察紀錄」，由老師「確認達成」。</p>
      </details>
      <div class="g-row"><span class="g-applied g-ok" role="status"></span></div>
      <div class="g-tpl" hidden></div>
    </div>`;
  }
  // 從表單讀出目前的單元與條件
  function readForm(f) {
    const extra = JSON.parse(f.dataset.units || '[]').slice(1);
    const first = f.querySelector('[data-f="unit"]').value;
    const units = [...new Set([first, ...extra].filter(Boolean))];
    const metric = (f.querySelector('input[name="g-metric"]:checked') || {}).value || 'firstTry';
    const hints = [...f.querySelectorAll('input[data-hint]:checked')].map(i => i.dataset.hint);
    const steps = [...f.querySelectorAll('input[data-step]:checked')].map(i => i.dataset.step);
    const crit = {
      metric, pct: +f.querySelector('[data-f="pct"]').value, qn: +f.querySelector('[data-f="qn"]').value,
      minSessions: +f.querySelector('[data-f="minSessions"]').value, diff: f.querySelector('[data-f="diff"]').value || null,
      minDiff: 'easy', steps: steps.length ? steps : null, ...(metric === 'tolerant' ? { tol: +f.querySelector('[data-f="tol"]').value || 1 } : {}),
      hintSrc: metric === 'completion' && hints.length < 2 ? hints : null,
    };
    const combine = (f.querySelector('input[name="g-combine"]:checked') || {}).value || 'each';
    return { units, crit, combine, text: f.querySelector('[data-f="text"]').value.trim(),
      iepText: f.querySelector('[data-f="iep"]').value.trim(),
      setupText: setupShow(f.querySelector('[data-f="setup"]').value),
      start: f.querySelector('[data-f="start"]').value, due: f.querySelector('[data-f="due"]').value };
  }
  // 表單互動：摘要即時更新、其他單元的小標籤、步驟選項依單元出現、提示來源只在完成率時可選
  function syncForm(f) {
    // 容錯程度老師沒動過＝跟著單元類型（對話可錯 1 步、24 單元不容錯），換單元就跟著換
    f.querySelector('.g-tolrow').hidden = (f.querySelector('input[name="g-metric"]:checked') || {}).value !== 'tolerant';   // 容錯只給設定答對率
    const r = readForm(f);
    f.dataset.units = JSON.stringify(r.units);
    f.querySelector('.g-chips').innerHTML = r.units.slice(1).map(k => `<span class="g-chip">${esc(unitName(k))} <button type="button" class="g-link" data-act="unit-del" data-k="${esc(k)}" aria-label="移除">✕</button></span>`).join('');
    f.querySelector('.g-combine').hidden = r.units.length < 2;
    const steps = [...new Set(r.units.flatMap(k => (window.EvalCore.UNIT_STEPS[k]) || []))];
    const stepBox = f.querySelector('.g-steps');
    const on = new Set(f.dataset.pendSteps ? JSON.parse(f.dataset.pendSteps) : (r.crit.steps || []));
    delete f.dataset.pendSteps;
    stepBox.hidden = !steps.length;
    stepBox.innerHTML = steps.length ? '<span>只看這些步驟（不勾＝看整題）</span>' + steps.map(s =>
      `<label><input type="checkbox" data-step="${s}"${on.has(s) ? ' checked' : ''}> ${window.EvalCore.STEP_NAMES[s] || s}</label>`).join('') : '';
    f.querySelectorAll('input[data-hint]').forEach(i => { i.disabled = r.crit.metric !== 'completion'; });
    f.querySelector('.g-hint').classList.toggle('off', r.crit.metric !== 'completion');
    f.querySelector('.g-sumlive').textContent = '📋 ' + summary(r.units, r.combine, { ...DEF(), ...readForm(f).crit });
    // ⚡ 快速套用：只依第一個單元列範本；換單元才重畫（避免打字時一直重畫）
    const box = f.querySelector('.g-tpl'), first = r.units[0] || '';
    if (box.dataset.k !== first) {
      box.dataset.k = first;
      const list = templatesFor(first);
      box.hidden = !list.length;
      const ref = unitRef(first);
      box.innerHTML = list.length ? `<div class="g-tpl-head">⚡ 目標範本<span class="g-note">　按「套用」填入目標、系統評量與 IEP 精熟標準，可再修改</span></div>` +
        (ref ? `<div class="g-note g-tpl-ref">📘 學年目標參考：${esc(ref.annual)}${esc(refCodes(first))}</div>` : '') +
        list.map((t, i) => `<div class="g-tpl-item"><span class="g-lv g-lv-${LEVEL_ORDER.indexOf(t.level)}">${esc(t.level)}</span>
          <div class="g-tpl-body"><b>${esc(t.iep || t.text)}</b>
          ${t.iep ? `<div class="g-note">🖥️ 系統評量：${esc(t.text)}</div>` : ''}
          ${setupShow(t.setupText) ? `<div class="g-note">🛠️ 練習設定：${esc(setupShow(t.setupText))}</div>` : ''}
          <div class="g-note">${esc(summary([first], 'each', { ...DEF(), ...t }).replace(/^[^：]*：/, ''))}</div>
          ${t.observe ? `<div class="g-note">👀 建議另外觀察：${esc(t.observe)}</div>` : ''}</div>
          <button type="button" class="t-btn t-btn-primary" data-act="tpl-apply" data-i="${i}">⚡ 套用</button></div>`).join('') : '';
    }
  }
  const sameCrit = (a, b) => ['metric', 'pct', 'qn', 'minSessions', 'diff', 'tol'].every(k => (a[k] ?? null) === (b[k] ?? null)) &&
    JSON.stringify(a.steps || null) === JSON.stringify(b.steps || null) && JSON.stringify(a.hintSrc || null) === JSON.stringify(b.hintSrc || null);

  function saveForm(f) {
    const r = readForm(f);
    const err = box().querySelector('.g-top .g-err');   // 訊息在標題列的「💾 儲存目標」旁
    if (!r.text && !r.iepText) { err.textContent = '請寫 IEP 目標或系統評量敘述'; return; }
    if (!r.units.length) { err.textContent = '請選對應的單元或情境'; return; }
    if (r.start && r.due && r.due < r.start) { err.textContent = '評量結束不能早於評量開始'; return; }
    const newGoal = (id) => ({ id, iepText: r.iepText, text: r.text, setupText: r.setupText, units: r.units, combine: r.combine, start: r.start || '', due: r.due || '', observeTip: f.dataset.observeTip || '',
      versions: [{ vid: id + '-v1', from: r.start ? +new Date(r.start) : 0, ...r.crit }], events: [], observe: [], confirmed: null, created: Date.now() });
    const targets = _editing === 'new' ? targetsOf(f) : [];
    if (_editing === 'new' && !targets.length) { err.textContent = '請至少勾選一位學生'; return; }
    if (_editing === 'new' && !onlySelf(targets)) {
      // 勾選的學生（含全部學生）：每位各建一個，已有相同目標的略過
      let made = 0, skipped = 0;
      targets.forEach((id, i) => {
        const l = load(id);
        if (l.some(x => sameGoal(x, r.units[0], r.iepText, r.text))) { skipped++; return; }
        l.push(newGoal('g' + Date.now() + '_' + i)); store(id, l); made++;
      });
      _preUnit = null;   // 儲存後不關閉（2026-10-11 使用者定）：留在新增畫面，可以接著建立下一個
      flash(`✓ 已替 ${made} 位學生建立${skipped ? `；略過 ${skipped} 位（已有相同目標）` : ''}`);
      loadData();
      return;
    }
    const list = load(sid());
    if (_editing === 'new') {
      // 第一版從評量開始日生效（沒填＝從頭）：建立當下就看得出以前的練習是否已經符合
      if (list.some(x => sameGoal(x, r.units[0], r.iepText, r.text))) { err.textContent = '已有相同目標，不再建立'; return; }
      const ng = newGoal('g' + Date.now());
      list.push(ng);
      _editing = ng.id;   // 儲存後不關閉：留在剛建立的這個目標（再按儲存＝修改它，不會重複建立）
    } else {
      const g = list.find(x => x.id === _editing);
      if (!g) return;
      Object.assign(g, { iepText: r.iepText, text: r.text, setupText: r.setupText, units: r.units, combine: r.combine, start: r.start || '', due: r.due || '' });
      if (f.dataset.observeTip !== undefined) g.observeTip = f.dataset.observeTip;
      // 條件改了＝加一版（從現在起生效），舊版與它的達標事件保留（規格 6-2、6-3）
      if (!sameCrit(curV(g), r.crit)) g.versions.push({ vid: `${g.id}-v${g.versions.length + 1}`, from: Date.now(), ...r.crit });
    }
    store(sid(), list);
    _preUnit = null;   // 儲存後不關閉（2026-10-11 使用者定），按「取消」或換分頁才離開
    flash('✓ 已儲存');
    loadData();   // 重算學習歷程（IEP 標籤等）並重畫這個面板
  }

  let _flash = '';
  // 只清自己那一則：連續操作時，上一則的計時器不可以把新訊息清掉（2026-10-08 測試抓到）
  function flash(t) { _flash = t; setTimeout(() => { if (_flash !== t) return; _flash = ''; box()?.querySelectorAll('.g-saved').forEach(el => { el.textContent = ''; }); }, 3000); }

  async function render() {
    const b = box();
    if (!b || b.hidden) return;
    const who = document.getElementById('stu-filter').value;
    // 換學生才清掉編輯中的狀態；第一次畫（_who 還是 null）不算換——否則打開後第一次按「➕ 新增」會被清掉、畫成目標卡片
    // 換學生：➕ 新增表單留著（換成新學生的空白表單，2026-10-08 使用者定：不要跳到別的分頁）；修改中的目標屬於舊學生，關掉
    if (_who !== null && who !== _who) { if (_editing !== 'new') _editing = null; _quickExtra = []; _preUnit = null; _stu = null; }
    _who = who;
    const all = isAll(who);
    if (!isOneStudent(who) && !all) {
      b.innerHTML = '<div><strong>🏁 IEP 目標</strong>　<span class="g-note">訪客無法設定 IEP 目標。請在上方「👤 學生資料」選一位學生或「全部學生」。</span></div>';
      return;
    }
    // js/eval-core.js 由 learning-tracker.js 非同步載入，最多等 5 秒
    for (let i = 0; i < 50 && !window.EvalCore; i++) await new Promise(r => setTimeout(r, 100));
    if (!window.EvalCore) { b.innerHTML = '<p class="g-note">評量核心載入失敗，請重新整理頁面。</p>'; return; }
    if (!_scen) { try { _scen = await loadScenarioList(); } catch (e) { _scen = []; } }
    const studs = all ? allStudents() : [];
    if (all && _stu && !studs.some(s => s.id === _stu)) _stu = null;
    const cur = sid();   // 這次要顯示誰的目標（全部學生且還沒點學生＝沒有）
    _recs = cur ? await studentRecords(cur) : [];
    const list = cur ? load(cur) : [];
    const name = all ? (studs.find(s => s.id === _stu)?.name || '') : (document.querySelector('#stu-filter option:checked')?.textContent || '');
    // 刪除這位學生的全部 IEP 目標（2026-10-08 使用者定；練習紀錄不動）
    const delAll = cur && list.length ? `<button type="button" class="t-btn t-btn-danger" data-act="del-all">🗑️ 刪除全部目標</button>` : '';
    // 標題＋按鈕＋儲存訊息水平置中同一列，說明放下一列（2026-10-11 使用者定，學習歷程總覽的設定畫面統一；原本標題靠左、說明靠右）
    //   快速套用的「⚡ 套用」也放在標題列
    const quickOn = _view === 'quick' && !_editing && quickUnits().length;
    // 新增／修改目標：「取消」「💾 儲存目標」也在標題列（2026-10-11 使用者定）
    const formOn = _editing === 'new' || (_editing && list.some(g => g.id === _editing));
    const formBtns = formOn ? '<button type="button" class="t-btn t-btn-secondary" data-act="cancel">取消</button><button type="button" class="t-btn t-btn-primary" data-act="save">💾 儲存目標</button><span class="g-err" role="alert"></span>' : '';
    const top = `<div class="g-top pnl-head"><strong>🏁 ${all ? `全部學生（${studs.length} 位）` : esc(name)} 的 IEP 目標${all ? '' : `（${list.length}）`}</strong>
        <span class="g-top-r">${formBtns}${quickOn ? '<button type="button" class="t-btn t-btn-primary" data-act="quick-create">⚡ 套用（建立 <span class="g-q-n"></span> 個目標）</button><span class="g-err" role="alert"></span>' : ''}
        <span class="g-saved t-saved" role="status">${_flash}</span>${all ? '' : delAll}</span></div>
      <div class="pnl-desc">${all ? '可勾選多位學生新增或套用；查看目標請先選一位學生。'
          : '有 IEP 目標的單元，學習歷程的精熟進度與答對率改看目標自己的「🏁 IEP 精熟標準」。'}</div>`;
    // 全部學生的「📋 列出／🗂 卡片／修改」：先列學生，點了才顯示（2026-10-08 使用者定：不要一次顯示太多）
    const chips = () => `<div class="g-stu-chips" role="tablist" aria-label="選擇學生">${studs.map(s => {
      const n = load(s.id).length;
      return `<button type="button" class="t-btn ${s.id === _stu ? 't-btn-primary' : 't-btn-secondary'}" data-act="pick-stu" data-sid="${esc(s.id)}" aria-pressed="${s.id === _stu}">${esc(s.name)}<span class="g-chip-n">${n}</span></button>`;
    }).join('') || '<span class="g-note">學生資料裡還沒有學生。</span>'}</div>`;
    const stuHead = () => _stu ? `<div class="g-stu-head"><span><b>${esc(name)}</b> 的 IEP 目標（${list.length}）</span><span class="g-top-r">${delAll}</span></div>` : '';
    const empty = '<p class="g-note">尚無 IEP 目標。請按「➕ 新增目標」或「⚡ 快速套用目標」建立。</p>';
    let body;
    if (_editing === 'new') body = formHtml(null);
    else if (_editing) body = (all ? chips() + stuHead() : '') + list.map(g => g.id === _editing ? formHtml(g) : '').join('');
    else if (_view === 'quick') body = quickHtml(list);
    else if (all && !_stu) body = chips() + '<p class="g-note">👆 請選一位學生查看目標。</p>';
    else if (_view === 'list') body = (all ? chips() + stuHead() : '') + listHtml(list);
    else body = (all ? chips() + stuHead() : '') + (list.map(cardHtml).join('') || empty);
    b.innerHTML = top + body;
    quickCount(b);
    b.querySelectorAll('.g-form, .g-quick').forEach(syncTargets);
    if (typeof syncIepHub === 'function') syncIepHub();   // 上方分頁（teacher.html）亮目前這一頁
    const f = b.querySelector('.g-form');
    if (f) {
      syncForm(f);
      if (_preTpl) { applyTemplate(f, _preTpl); _preTpl = null; }
      f.querySelector('[data-f="iep"]').focus();   // IEP 目標是主句，游標先放這
      f.scrollIntoView({ block: 'nearest' });
    }
  }

  function onClick(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn || !box().contains(btn)) return;
    const act = btn.dataset.act;
    const card = btn.closest('[data-id]'), f = btn.closest('.g-form') || box().querySelector('.g-form');   // 儲存鈕在標題列（表單外）
    const list = load(sid());
    const g = card && list.find(x => x.id === card.dataset.id);
    const b = box();
    if (act === 'pick-stu') { _stu = btn.dataset.sid; _editing = null; render(); return; }
    if (act === 'del-all') {
      const who = sid(), nm = isAll(_who) ? (allStudents().find(s => s.id === who)?.name || '') : (document.querySelector('#stu-filter option:checked')?.textContent || '');
      if (!who || !list.length) return;
      if (!confirm(`確定要刪除 ${nm} 的全部 ${list.length} 個 IEP 目標嗎？\n相關觀察紀錄與老師確認也會刪除；學生練習紀錄仍保留。`)) return;
      store(who, []); _editing = null; flash(`✓ 已刪除 ${nm} 的全部 IEP 目標`); loadData(); return;
    }
    if (act === 'new') { if (!_editing) _backView = _view; _preUnit = null; _preTpl = null; _editing = 'new'; render(); }
    else if (act === 'edit') { _backView = _view; _editing = g.id; render(); }
    else if (act === 'cancel') { _editing = null; _view = _backView; _preUnit = null; render(); }
    else if (act === 'view-quick' || act === 'view-list' || act === 'view-cards') { _editing = null; _preUnit = null; _preTpl = null; _view = act.slice(5); render(); }
    else if (act === 'quick-all') {
      const list2 = load(sid()), all = isAll(_who);
      b.querySelectorAll('.g-q-row').forEach(row => {
        const k = row.dataset.k, sug = all ? null : suggestLevel(k, list2);
        const lv = btn.dataset.lv === '*' ? (all ? '*' : sug.lv) : btn.dataset.lv;
        row.outerHTML = quickRowHtml(k, lv, sug);
      });
      quickCount(b);
    }
    else if (act === 'quick-add') {
      const k = b.querySelector('[data-f="quick-more"]').value;
      if (k && !quickUnits().includes(k)) { _quickExtra.push(k); render(); }
    } else if (act === 'quick-custom') {
      const k = btn.closest('[data-k]').dataset.k;
      const lv = btn.closest('.g-q-row')?.querySelector('[data-f="qlv"]')?.value;
      _preTpl = lv ? templatesFor(k).find(x => x.level === lv) || null : null;
      _backView = _view; _preUnit = k; _editing = 'new'; render();
    } else if (act === 'quick-create') {
      const picked = quickPicked(b);
      if (!picked.length) { b.querySelector('.g-top .g-err').textContent = '沒有要建立的目標，請至少一個單元選擇層級'; return; }
      const start = b.querySelector('[data-f="quick-start"]').value, due = b.querySelector('[data-f="quick-due"]').value;
      if (start && due && due < start) { b.querySelector('.g-top .g-err').textContent = '評量結束不能早於評量開始'; return; }
      const ids = targetsOf(b.querySelector('.g-quick'));
      if (!ids.length) { b.querySelector('.g-top .g-err').textContent = '請至少勾選一位學生'; return; }
      if (!onlySelf(ids)) {
        btn.disabled = true;
        quickCreateFor(ids, picked, start, due).then(r => { flash(`✓ 已替 ${r.n} 位學生建立 ${r.made} 個目標${r.skipped ? `；略過 ${r.skipped} 個（相同目標或此單元已有目標）` : ''}`); loadData(); });   // 留在快速套用，上方顯示結果（2026-10-09 使用者定）
        return;
      }
      const dup = picked.filter(p => list.some(x => sameGoal(x, p.k, p.t.iep, p.t.text)));
      const add = picked.filter(p => !dup.includes(p));
      add.forEach(p => list.push(goalFromTemplate(p.k, p.t, start, due)));
      store(sid(), list);
      flash(`✓ 已建立 ${add.length} 個目標${dup.length ? `；略過 ${dup.length} 個相同目標` : ''}`);
      loadData();   // 留在快速套用，上方顯示「✓ 已建立…」（2026-10-09 使用者定：不要跳到目標清單）
    }
    else if (act === 'save') saveForm(f);
    else if (act === 'tpl-apply') applyTemplate(f, templatesFor(f.querySelector('.g-tpl').dataset.k)[+btn.dataset.i]);
    else if (act === 'unit-add') {
      const k = f.querySelector('[data-f="more"]').value;
      if (k) { const u = JSON.parse(f.dataset.units || '[]'); if (!u.includes(k)) { if (!u.length) f.querySelector('[data-f="unit"]').value = k; else u.push(k); f.dataset.units = JSON.stringify(u); } }
      syncForm(f);
    } else if (act === 'unit-del') {
      f.dataset.units = JSON.stringify(JSON.parse(f.dataset.units || '[]').filter((k, i) => i === 0 || k !== btn.dataset.k));
      syncForm(f);
    } else if (act === 'del') {
      if (!confirm(`確定要刪除這個 IEP 目標嗎？\n「${goalTitle(g)}」\n（學生的練習紀錄不會刪除）`)) return;
      store(sid(), list.filter(x => x !== g)); flash('✓ 目標已刪除'); loadData();
    } else if (act === 'confirm') {
      g.confirmed = { date: card.querySelector('[data-f="cdate"]').value, note: card.querySelector('[data-f="cnote"]').value.trim() };
      store(sid(), list); flash('✓ 已確認達成'); render();
    } else if (act === 'unconfirm') {
      g.confirmed = null; store(sid(), list); render();
    } else if (act === 'obs-add') {
      const note = card.querySelector('[data-f="onote"]').value.trim();
      g.observe = (g.observe || []).concat([{ date: card.querySelector('[data-f="odate"]').value, result: card.querySelector('[data-f="ores"]').value, note }]);
      store(sid(), list); render();
    } else if (act === 'obs-del') {
      g.observe.splice(+btn.dataset.i, 1); store(sid(), list); render();
    }
  }
  // ⚡ 套用範本：填目標敘述與評量條件（指標、門檻、題數、練習次數、難度、步驟、提示來源）；條件跟系統預設不同就打開進階設定讓老師看得到
  function applyTemplate(f, t) {
    if (!t) return;
    f.querySelector('[data-f="iep"]').value = t.iep || '';
    f.querySelector('[data-f="text"]').value = t.text;
    f.querySelector('[data-f="setup"]').value = t.setupText || '';
    const radio = f.querySelector(`input[name="g-metric"][value="${t.metric}"]`); if (radio) radio.checked = true;
    f.querySelector('[data-f="pct"]').value = String(t.pct);
    f.querySelector('[data-f="qn"]').value = String(t.qn);
    f.querySelector('[data-f="minSessions"]').value = String(t.minSessions);
    f.querySelector('[data-f="diff"]').value = t.diff || '';
    f.querySelectorAll('input[data-hint]').forEach(i => { i.checked = !t.hintSrc || t.hintSrc.includes(i.dataset.hint); });
    f.dataset.pendSteps = JSON.stringify(t.steps || []);
    f.querySelector('[data-f="tol"]').value = String(t.tol || 1);
    f.dataset.observeTip = t.observe || '';
    const d = DEF();
    if (['metric', 'pct', 'qn', 'minSessions'].some(k => t[k] !== d[k]) || t.diff || (t.steps && t.steps.length) || t.hintSrc) f.querySelector('.g-adv').open = true;
    syncForm(f);
    const msg = box().querySelector('.g-top .g-err');   // 錯誤訊息在標題列（2026-10-11）
    if (msg) msg.textContent = ''; f.querySelector('.g-applied').textContent = `✓ 已套用「${t.level}」，可再修改`;
    f.querySelector(t.iep ? '[data-f="iep"]' : '[data-f="text"]').focus();
  }
  function onChange(e) {
    // 套用給哪些學生：全選＝全部勾／全部取消；個別勾選後同步全選框與說明
    if (e.target.matches && e.target.matches('input[data-tgall], input[data-tg]')) {
      const root = e.target.closest('.g-form, .g-quick');
      if (e.target.matches('[data-tgall]')) root.querySelectorAll('input[data-tg]').forEach(i => { i.checked = e.target.checked; });
      syncTargets(root);
      return;
    }
    if (e.target.matches && e.target.matches('[data-f="qlv"]') && e.type === 'change') {
      const row = e.target.closest('.g-q-row'), k = row.dataset.k;
      row.outerHTML = quickRowHtml(k, e.target.value, isAll(_who) ? null : suggestLevel(k, load(sid())));
      quickCount(box());
      return;
    }
    const f = e.target.closest('.g-form');
    if (f) syncForm(f);
  }

  // 由 teacher.html 的「🎯 IEP 學習單元與目標」分頁切換（showIepHub）：new＝新增表單、quick／list／cards＝三種檢視
  function show(view) {
    const b = box();
    b.hidden = false;
    // 先對齊目前的學生：收起期間換過學生（例：在 ① IEP 學習單元時改選全部學生）的話，在這裡清，
    //   否則 render() 會把它當成換學生、把下面要打開的「➕ 新增」清掉
    const w = document.getElementById('stu-filter')?.value ?? null;
    if (w !== _who) { if (_editing !== 'new') _editing = null; _quickExtra = []; _stu = null; _who = w; }
    if (view === 'new') { if (!_editing) _backView = _view; _editing = 'new'; }
    else { _editing = null; _view = view; }
    _preUnit = null; _preTpl = null;
    render();
  }
  // view：收起時記下所在的檢視（⚡ 快速套用的第 ① 步收起 IEP 目標畫面，但從那裡按新增再取消要回到快速套用）
  function hide(view) { const b = box(); if (!b) return; b.hidden = true; b.innerHTML = ''; _editing = null; if (view) _view = view; }
  const current = () => _editing === 'new' ? 'new' : _editing ? _backView : _view;
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
    const b = box();
    if (b) { b.addEventListener('click', onClick); b.addEventListener('change', onChange); b.addEventListener('input', onChange); }
  });

  // 這位學生 IEP 目標用到的單元（學習歷程的 🎯 IEP 標籤、篩選與 IEP 學習單元合併）
  const unitsOf = (who) => isOneStudent(who) ? [...new Set(load(who).flatMap(g => g.units || []))] : [];
  return { show, hide, current, render, load, unitsOf, summary, goalTitle, sysLine, templatesFor, KEY };   // templatesFor：測試用（對話依所屬部分找範本）
})();
window.IepGoals = IepGoals;
