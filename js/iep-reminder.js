/**
 * iep-reminder.js — 單元設定頁的「🏁 這位學生的 IEP 目標」提醒（2026-10-08 使用者定）
 *
 * 老師在設定頁選好學生，下方就列出他在「這個單元」的 IEP 目標與「練習時的設定」；沒有目標就寫「尚未建立目標」
 * （目標裡老師寫的 setupText，例「普通模式・數數範圍 1-10」），老師照著選就好。
 * 只顯示、不替老師按設定。
 *
 * 資料（teacher.html 寫的，這裡只讀）：
 *   目標＝localStorage mt_iep_goals_{學生id}（格式見 js/iep-goals.js 檔頭）
 *   IEP 學習單元＝mt_iep_units_{學生id}，沒有個別的就用 mt_iep_units_default（[{ k, n }]）
 * 單元代號：24 單元＝檔名開頭（f1、c6…）、一日金錢冒險＝adventure、生活情境＝「場景|情境」（由呼叫端傳）。
 *
 * API：IepReminder.render(容器, 單元代號?)  不給代號就從網址推（html/f1_….html → f1）
 * 由 js/student-picker.js 自動載入並接在學生列下方；一日金錢冒險自己有學生列，直接呼叫。
 * 測試：node tests/_e2e_iep_reminder.js
 */
(function () {
    'use strict';
    var STYLE_ID = 'iep-reminder-style';
    var DIFF_TXT = { easy: '簡單', normal: '普通', hard: '困難' };

    function readJSON(key, fb) {
        try { var v = JSON.parse(localStorage.getItem(key) || 'null'); return v == null ? fb : v; } catch (e) { return fb; }
    }
    function currentStudent() { return readJSON('sp_currentStudent', null); }

    function unitFromPage() {
        var p = decodeURIComponent(location.pathname);
        var m = p.match(/\/html\/([abcf][1-6])_[^/]*\.html$/i);
        if (m) return m[1].toLowerCase();
        if (/\/adventure\//.test(p)) return 'adventure';
        return null;
    }

    // 某時間點有效的條件版本（同 js/eval-core.js versionAt；這裡不等它載入，只為了讀出難度）
    function currentVersion(g) {
        var vs = (g.versions || []).slice().sort(function (a, b) { return (a.from || 0) - (b.from || 0); });
        var v = vs[0] || {}, now = Date.now();
        vs.forEach(function (x) { if ((x.from || 0) <= now) v = x; });
        return v;
    }

    function goalsFor(sid, unit) {
        var list = readJSON('mt_iep_goals_' + sid, []);
        if (!Array.isArray(list)) return [];
        return list.filter(function (g) { return (g.units || []).indexOf(unit) >= 0; });
    }

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var s = document.createElement('style');
        s.id = STYLE_ID;
        // 深色兩塊逐字對應，只差外層 gate（CLAUDE.md 深色模式規則）
        var DARK = [
            ['.iep-rm', 'background:#1E293B;border-color:#7C3AED;color:#E2E8F0;'],
            ['.iep-rm-title', 'color:#C4B5FD;'],
            ['.iep-rm-goal', 'background:#0F172A;border-color:#334155;'],
            ['.iep-rm-text', 'color:#F1F5F9;'],
            ['.iep-rm-setup', 'background:#3B0764;color:#F3E8FF;'],
            ['.iep-rm-sub', 'color:#94A3B8;'],
            ['.iep-rm-done', 'color:#86EFAC;'],
            ['.iep-rm-todo', 'color:#94A3B8;']
        ];
        var gated = function (gate) { return DARK.map(function (r) { return gate + ' ' + r[0] + '{' + r[1] + '}'; }).join(''); };
        s.textContent =
            '.iep-rm{margin:-6px 0 16px;padding:10px 14px;border:2px solid #A78BFA;border-radius:14px;' +
            'background:#F5F3FF;color:#1F2937;text-align:left;font-size:0.95em;line-height:1.5;}' +
            '.iep-rm[hidden]{display:none!important;}' +
            '.iep-rm-title{font-weight:800;color:#5B21B6;margin-bottom:6px;}' +
            '.iep-rm-goal{background:#fff;border:1px solid #DDD6FE;border-radius:10px;padding:8px 10px;margin-top:6px;}' +
            '.iep-rm-text{font-weight:700;color:#1F2937;}' +
            '.iep-rm-setup{display:inline-block;margin-top:4px;padding:3px 10px;border-radius:8px;' +
            'background:#EDE9FE;color:#4C1D95;font-weight:700;}' +
            '.iep-rm-sub{font-size:0.88em;color:#4B5563;margin-top:3px;}' +
            '.iep-rm-line{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:4px;}' +
            '.iep-rm-line .iep-rm-setup{margin-top:0;}' +
            '.iep-rm-done{font-weight:700;color:#15803D;}' +
            '.iep-rm-todo{color:#4B5563;}' +
            '.iep-rm-st{display:inline-flex;gap:10px;flex-wrap:wrap;}.iep-rm-st[hidden]{display:none!important;}' +
            '@media (prefers-color-scheme: dark){' + gated(':root:not([data-theme="light"])') + '}' +
            gated('[data-theme="dark"]');
        document.head.appendChild(s);
    }

    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    function render(container, unit) {
        if (!container) return;
        unit = unit || unitFromPage();
        container.innerHTML = '';
        var stu = currentStudent();
        container.hidden = true;
        if (!unit || !stu || stu.id == null) return;
        var goals = goalsFor(stu.id, unit);
        injectStyle();

        var box = el('div', 'iep-rm');
        box.setAttribute('role', 'note');
        // 選了學生就一定顯示（2026-10-09 使用者定，24 單元、冒險、生活情境都一樣）：有目標列目標；
        // 沒有目標一律同一句「🎯 ○○ 的 IEP 學習單元（尚未建立目標）」（不分是不是 IEP 學習單元，使用者定文字要相同）
        box.appendChild(el('div', 'iep-rm-title', goals.length
            ? '🏁 ' + (stu.name || '這位學生') + ' 的 IEP 目標'
            : '🎯 ' + (stu.name || '這位學生') + ' 的 IEP 學習單元（尚未建立目標）'));

        // 精簡版（2026-10-09 使用者定：原本太長）：每個目標兩行——主句＋「🛠️ 怎麼設定　狀態」。
        //   系統評量句、評量期間只在學習歷程看；設定頁只回答「這位學生要練什麼、怎麼設」
        // 還沒達成的排前面
        var stRows = [];
        goals.slice().sort(function (a, b) { return (a.confirmed ? 1 : 0) - (b.confirmed ? 1 : 0); }).forEach(function (g) {
            var v = currentVersion(g);
            var row = el('div', 'iep-rm-goal');
            // 主句＝IEP 目標（iepText），舊目標只有 text；規則同 js/iep-goals.js goalTitle（這裡不載入那支）
            row.appendChild(el('div', 'iep-rm-text', g.iepText || g.text || ''));
            // 怎麼設定：老師寫的 setupText；沒寫就只說難度（評量條件指定的）
            // 不寫題數：同 js/iep-goals.js setupShow
            var setup = String(g.setupText || '').replace(/・\s*\d+\s*題/g, '').trim() || (v.diff && DIFF_TXT[v.diff] ? DIFF_TXT[v.diff] + '模式' : '');
            var line = el('div', 'iep-rm-line');
            if (setup) line.appendChild(el('span', 'iep-rm-setup', '🛠️ ' + setup));
            // 狀態（2026-10-09 使用者定，由左至右）：系統精熟標準／IEP 精熟標準／老師確認達成，三個固定列、✅／⬜ 表示達到沒。
            //   先用存好的資料畫（IEP 達標事件、老師確認），讀到練習紀錄後再補上系統精熟與目前符合的 IEP 條件
            var st = el('span', 'iep-rm-st');
            line.appendChild(st);
            stRows.push({ g: g, st: st, line: line, row: row });
            paintStatus(st, { iep: false, teacher: !!g.confirmed });   // IEP 達標要讀到練習紀錄才知道（照目前的條件重算，2026-10-12）
            row.appendChild(line);
            box.appendChild(row);
        });
        container.appendChild(box);
        container.hidden = false;
        // 讀練習紀錄補判定；畫面在等待中被重畫（換學生）就作廢
        var token = container._iepRmToken = {};
        fillStatus(stu.id, unit, stRows, function () { return container._iepRmToken === token; });
    }

    // 三個固定都列、✅ 達到／⬜ 還沒（2026-10-09 使用者定：看得出卡在哪一關）
    var ST_LABELS = [['sys', '系統已精熟'], ['iep', 'IEP 已精熟'], ['teacher', '老師確認達成']];   // 2026-10-12 用語統一：狀態＝已精熟、條件＝精熟標準
    function paintStatus(st, s) {
        st.innerHTML = '';
        ST_LABELS.forEach(function (x) { st.appendChild(el('span', s[x[0]] ? 'iep-rm-done' : 'iep-rm-todo', (s[x[0]] ? '✅ ' : '⬜ ') + x[1])); });
    }
    // EvalCore 由 learning-tracker.js 非同步載入，最多等 3 秒
    function whenCore(cb, n) {
        if (window.EvalCore && window.LearningTracker && window.LearningTracker.studentRecords) return cb();
        if ((n || 0) > 30) return;
        setTimeout(function () { whenCore(cb, (n || 0) + 1); }, 100);
    }
    // 📏 系統精熟：老師為這位學生設的精熟標準版本（個別 → 全班預設 → 系統預設，同 teacher.html masteryVersions），
    //   目前符合或曾經達到（🏅）都算「已達」；判定一律交給 EvalCore，不在這裡另寫規則
    function fillStatus(sid, unit, rows, alive) {
        if (!rows.length) return;
        whenCore(function () {
            window.LearningTracker.studentRecords(sid).then(function (recs) {
                if (!alive()) return;
                var C = window.EvalCore;
                var vs = readJSON('mt_mastery_v_' + sid, null);
                if (!Array.isArray(vs) || !vs.length) vs = readJSON('mt_mastery_v_default', null);
                if (!Array.isArray(vs) || !vs.length) vs = [C.SYSTEM_DEFAULT];
                var mine = recs.filter(function (r) { return C.keyOf(r) === unit; });
                var sys = false;
                if (mine.length) {
                    var items = C.itemsOfRecords(mine), crit = C.versionAt(vs, Date.now());
                    var diffs = C.DIFFS.slice(Math.max(0, C.DIFFS.indexOf(crit.minDiff || 'easy')));
                    sys = C.evaluateUnit(mine, vs).met || diffs.some(function (d) {
                        var sub = items.filter(function (q) { return q.diff === d; });
                        return sub.length && C.achievementsNow(sub, crit).length > 0;   // 照目前的標準重算（2026-10-12）
                    });
                }
                rows.forEach(function (x) {
                    var iep = C.goalAchievementsNow(x.g, recs).length > 0 || C.evaluateGoal(x.g, recs, { asOf: Date.now() }).met;
                    paintStatus(x.st, { sys: sys, iep: iep, teacher: !!x.g.confirmed });
                });
            }).catch(function () {});
        });
    }

    window.IepReminder = { render: render, unitFromPage: unitFromPage };
})();
