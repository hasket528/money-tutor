/**
 * student-roster.js — 學生名冊的新增／修改／刪除（資料層唯一定義處，2026-10-07）
 *
 * 主頁金婆婆彈窗與 teacher.html「👥 管理學生」共用這一份；畫面各自畫，規則只寫在這裡：
 *   - 名冊 localStorage['rewardSystemStudents']（與獎勵板、對話模組共用），最多 MAX 位、不可同名
 *   - 新增／刪除要同步獎勵板的顯示清單 rewardSystemDisplayed
 *   - 學生的唯一識別是 id，姓名只是顯示用 → 改名不會弄丟學習歷程；
 *     但 sp_currentStudent 存了 {id,name} 快照，改名時要一起更新
 *   - 刪除只動名冊（學習紀錄與成長資料不刪）；刪的是目前學生 → 退回訪客
 *
 * API（失敗一律回 { ok:false, error:'給老師看的訊息' }）：
 *   StudentRoster.load() / current() / setCurrent(stu|null)
 *   StudentRoster.add({ name, photo })            → { ok, stu }
 *   StudentRoster.update(id, { name, photo })     → { ok, stu, oldName }（photo：undefined＝不動、null＝移除）
 *   StudentRoster.remove(id)                      → { ok, stu }
 *   StudentRoster.compressPhoto(file, done)       // done(dataUrl)
 * 名冊有變動時發 document 事件 'mt-roster-change'。
 */
(function () {
    'use strict';
    var ROSTER_KEY  = 'rewardSystemStudents';
    var CURRENT_KEY = 'sp_currentStudent';
    var DISP_KEY    = 'rewardSystemDisplayed';
    var MAX = 15;

    function load() {
        try { return JSON.parse(localStorage.getItem(ROSTER_KEY) || '[]'); }
        catch (e) { return []; }
    }
    function current() {
        try { return JSON.parse(localStorage.getItem(CURRENT_KEY) || 'null'); }
        catch (e) { return null; }
    }
    function setCurrent(stu) {
        if (stu) localStorage.setItem(CURRENT_KEY, JSON.stringify({ id: stu.id, name: stu.name }));
        else localStorage.removeItem(CURRENT_KEY);
    }
    function changed() {
        try { document.dispatchEvent(new CustomEvent('mt-roster-change')); } catch (e) {}
    }
    var same = function (a, b) { return String(a) === String(b); };

    function editDisplayed(fn) {
        try {
            var disp = JSON.parse(localStorage.getItem(DISP_KEY) || 'null');
            if (Array.isArray(disp)) localStorage.setItem(DISP_KEY, JSON.stringify(fn(disp)));
        } catch (e) {}
    }

    function add(o) {
        var name = String((o && o.name) || '').trim();
        if (!name) return { ok: false, error: '⚠️ 請輸入學生名字' };
        var roster = load();
        if (roster.length >= MAX) return { ok: false, error: '學生名冊最多 ' + MAX + ' 位，請先刪除不用的學生。' };
        if (roster.some(function (s) { return s.name === name; })) return { ok: false, error: '已有同名學生，請改用不同名字。' };
        var stu = { id: Date.now() + Math.random(), name: name, photo: (o && o.photo) || null, score: 0 };
        roster.push(stu);
        localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
        editDisplayed(function (d) { d.push(String(stu.id)); return d; });
        changed();
        return { ok: true, stu: stu };
    }

    function update(id, o) {
        var roster = load();
        var stu = roster.find(function (s) { return same(s.id, id); });
        if (!stu) return { ok: false, error: '⚠️ 請先選擇要修改的學生' };
        var name = String((o && o.name) || '').trim();
        if (!name) return { ok: false, error: '⚠️ 名字不能空白' };
        // 不可改成別人已在用的名字（同名會讓老師在下拉選單裡分不出是誰）
        if (roster.some(function (s) { return !same(s.id, id) && s.name === name; })) {
            return { ok: false, error: '⚠️ 「' + name + '」已經有人用了，請換一個名字' };
        }
        var oldName = stu.name;
        stu.name = name;
        if (o.photo !== undefined) stu.photo = o.photo;
        localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
        var cur = current();
        if (cur && same(cur.id, stu.id) && cur.name !== stu.name) setCurrent(stu);
        changed();
        return { ok: true, stu: stu, oldName: oldName };
    }

    function remove(id) {
        var roster = load();
        var stu = roster.find(function (s) { return same(s.id, id); });
        if (!stu) return { ok: false, error: '⚠️ 請先選擇要刪除的學生' };
        localStorage.setItem(ROSTER_KEY, JSON.stringify(roster.filter(function (s) { return !same(s.id, id); })));
        editDisplayed(function (d) { return d.filter(function (x) { return !same(x, id); }); });
        // 刪的是目前學生 → 退回訪客（否則之後的學習紀錄會記在已不存在的學生名下）
        var cur = current();
        if (cur && same(cur.id, id)) setCurrent(null);
        changed();
        return { ok: true, stu: stu };
    }

    // 照片壓縮（600px / JPEG 0.92）
    // ⚠️ 原本 300px/0.7：獎勵板點頭像放大顯示（showPhotoZoom，最大 90vw/80vh）會被拉伸到
    // 遠超過原始像素，糊得很明顯（2026-09-11 老師回報）。品質選 0.92 而非 1.0：0.92→1.0 檔案要再
    // +100% 以上、畫質差異很小；15 位學生上限下 0.92 總大小約 2MB 出頭，1.0 會逼近部分瀏覽器
    // localStorage 5MB 額度（還要跟金幣/寵物/任務等其他資料共用空間）。
    function compressPhoto(file, done) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                var max = 600, w = img.width, h = img.height;
                if (w > h && w > max) { h = h * max / w; w = max; }
                else if (h > max) { w = w * max / h; h = max; }
                var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
                cv.getContext('2d').drawImage(img, 0, 0, w, h);
                done(cv.toDataURL('image/jpeg', 0.92));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    window.StudentRoster = { MAX: MAX, load: load, current: current, setCurrent: setCurrent,
        add: add, update: update, remove: remove, compressPhoto: compressPhoto };
})();
