// =================================================================
// FILE: js/showcase.js
// DESC: 學生的「⭐ 展示」（2026-10-07 使用者定，激勵用）：學生從自己擁有的寵物／徽章／寶物挑一個，
//       顯示在測驗頁標題列的學生頭像旁（js/student-badge.js）與優良表現獎勵板的照片角落（reward/script.js）。
//       挑選在「🌟 成就與寵物」頁（reward/script.js renderGrowthPage）。
//
// 資料：localStorage mt_showcase_{學生id} = { type, key, name, icon?, img? }
//   type：'pig'（存錢寵物）｜'creature'（收集寵物）｜'badge'｜'treasure'；key＝那一項的代號
//   name／icon（emoji）／img（從站台根目錄起算的圖片路徑）是「快照」：單元頁沒有載入 growth-system.js，
//   直接讀快照就能畫。寵物會進化 → 成就與寵物頁每次重畫都用 refresh 重算快照（進化只會在那一頁發生）。
//
// API：MTShowcase.get(id) / set(id, item|null) / el(id, cls) → 畫好的元素或 null / url(path) / label(item)
//      MTShowcase.studentModal(stu)：點學生頭像的彈窗（測驗頁標題列 js/student-badge.js 與獎勵板照片共用，2026-10-07）
//      MTShowcase.fx(stage, target, type, {lite})：點寵物／寶物／徽章的特效（唯一定義，2026-10-08 使用者定「要有質感」）
//        寵物＝漸層愛心往上飄＋金色閃光；寶物＝光澤掃過物品本體＋光暈＋四芒星輪流閃；徽章＝金色光環擴散＋四芒星散開＋光澤
//        stage＝position 不是 static 的容器；target＝那張圖（或 emoji）。lite＝寵物閒置時的小動作，粒子少一點
// =================================================================
(function () {
    'use strict';
    if (window.MTShowcase) return;
    // 站台根目錄：本檔在 js/ 底下 → 往上一層（單元頁在 html/、獎勵板在 reward/，路徑都從這裡算）
    const ROOT = (function () {
        try { return new URL('../', document.currentScript.src).href; } catch (e) { return ''; }
    })();
    const KEY = (id) => 'mt_showcase_' + id;
    // 點展示品的音效，依種類不同（2026-10-07 使用者定）。換音效＝把新檔存成同一個檔名覆蓋，並更新 report/speech/SFX_Source_Log.csv
    // open＝打開放大彈窗（學生彈窗、寵物／寶物／徽章 🔍）的音效（2026-10-07 使用者定）
    const SOUNDS = { pet: 'audio/reward/pet_click.mp3', badge: 'audio/reward/badge_click.mp3', treasure: 'audio/reward/treasure_click.mp3',
                     open: 'audio/reward/zoom_open.mp3' };
    function playOpen() { try { const a = new Audio(url(SOUNDS.open)); a.volume = 0.9; a.play().catch(() => {}); } catch (e) {} }
    const soundOf = (sc) => SOUNDS[sc && (sc.type === 'badge' || sc.type === 'treasure') ? sc.type : 'pet'];

    function get(id) {
        if (id == null) return null;
        try { const v = JSON.parse(localStorage.getItem(KEY(id)) || 'null'); return v && v.type && v.name ? v : null; }
        catch (e) { return null; }
    }
    function set(id, item) {
        if (id == null) return;
        if (item) localStorage.setItem(KEY(id), JSON.stringify(item));
        else localStorage.removeItem(KEY(id));
        try { document.dispatchEvent(new CustomEvent('mt-showcase-change', { detail: { id: String(id) } })); } catch (e) {}
    }
    const same = (a, b) => !!a && !!b && a.type === b.type && a.key === b.key;
    const url = (p) => (ROOT ? new URL(p, ROOT).href : p);

    function injectStyle() {
        if (document.getElementById('mt-showcase-style')) return;
        const st = document.createElement('style');
        st.id = 'mt-showcase-style';
        st.textContent = `
            .mt-sc { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
                     border-radius: 50%; background: radial-gradient(circle, #fffbeb 55%, #fde68a);
                     border: 2.5px solid #f59e0b; box-shadow: 0 2px 6px rgba(0,0,0,.25); overflow: hidden;
                     user-select: none; line-height: 1; }
            .mt-sc img { width: 88%; height: 88%; object-fit: contain; display: block; }
            .mt-sc.sc-head { width: 40px; height: 40px; font-size: 22px; margin-left: 4px; animation: mtScGlow 2.4s ease-in-out infinite; }
            .mt-sc.sc-corner { position: absolute; right: -10px; bottom: -10px; width: 46px; height: 46px; font-size: 26px; z-index: 1; }
            .mt-sc.sc-big { width: 96px; height: 96px; font-size: 56px; }
            .mt-sc.sc-pick { width: 58px; height: 58px; font-size: 32px; }   /* 選擇測驗學生視窗：頭像旁 */
            @keyframes mtScGlow { 0%,100% { box-shadow: 0 2px 6px rgba(0,0,0,.25); } 50% { box-shadow: 0 0 12px 3px rgba(251,191,36,.85); } }
            @media (prefers-reduced-motion: reduce) { .mt-sc.sc-head { animation: none; } }

            /* 點學生頭像的彈窗：全黑半透明底、點任意處關閉。
               有展示品時＝學生照片與展示品並列（展示品在右、同樣大小、文字在圖上方），點展示品有互動效果 */
            .sbm-overlay { position: fixed; inset: 0; z-index: 10200; background: rgba(0,0,0,.85);
                           display: flex; flex-direction: column; align-items: center; justify-content: center;
                           cursor: pointer; padding: 16px; box-sizing: border-box; }
            .sbm-row { display: flex; align-items: flex-end; justify-content: center; gap: min(4vw, 32px); max-width: 100%; }
            .sbm-col { display: flex; flex-direction: column; align-items: center; min-width: 0; }
            .sbm-name { color: #fff; font-size: 24px; font-weight: 900; margin-bottom: 15px; text-align: center; }
            .sbm-sc-label { color: #fde68a; }
            .sbm-overlay img.sbm-photo { max-width: 90vw; max-height: 80vh; border-radius: 10px;
                                         box-shadow: 0 0 30px rgba(255,255,255,.3); display: block; }
            .sbm-avatar { width: min(60vw, 420px); height: min(60vw, 420px); background: linear-gradient(135deg, #fde68a, #f59e0b);
                          border-radius: 10px; box-shadow: 0 0 30px rgba(255,255,255,.3);
                          display: flex; align-items: center; justify-content: center; font-size: min(30vw, 220px); line-height: 1; }
            /* 並列時兩格同樣大小 */
            .sbm-row.two { --sbm-s: min(42vw, 62vh, 400px); }
            .sbm-row.two .sbm-name { font-size: clamp(15px, 4vw, 24px); }
            .sbm-row.two img.sbm-photo, .sbm-row.two .sbm-avatar, .sbm-row.two .sbm-sc-box {
                width: var(--sbm-s); height: var(--sbm-s); max-width: none; max-height: none; object-fit: contain; }
            .sbm-row.two .sbm-avatar { font-size: calc(var(--sbm-s) * .55); }
            .sbm-sc-box { position: relative; border-radius: 10px; box-shadow: 0 0 30px rgba(253,224,107,.45);
                          background: radial-gradient(circle, #fffbeb 55%, #fde68a); display: flex; align-items: center; justify-content: center;
                          cursor: pointer; font-size: calc(var(--sbm-s, 200px) * .55); line-height: 1; }
            .sbm-sc-box .sbm-sc-pic { width: 86%; height: 86%; object-fit: contain; display: block; animation: mtScBob 3.4s ease-in-out infinite; }
            .sbm-sc-box .sbm-sc-emo { display: inline-block; animation: mtScBob 3.4s ease-in-out infinite; }
            .sbm-sc-box .mt-sc-react { animation: mtScReact .6s ease-in-out !important; }
            @keyframes mtScBob { 0%,100% { transform: translateY(0) rotate(-1.5deg); } 50% { transform: translateY(-8px) rotate(1.5deg) scale(1.02); } }
            @keyframes mtScReact { 0% { transform: scale(1); } 30% { transform: scale(1.12) rotate(-6deg); } 60% { transform: scale(.95) rotate(5deg); } 100% { transform: scale(1); } }
            .sbm-hint { color: #fff; font-size: 14px; margin-top: 15px; }

            /* ── 互動特效（fx）：全部用漸層畫，不用 emoji，任何裝置都清楚 ── */
            .mtfx-layer { position: absolute; inset: 0; pointer-events: none; overflow: visible; z-index: 6; }
            .mtfx-layer.under { z-index: 0; }   /* 光暈放在物品後面，只亮邊緣，不把物品洗白 */
            /* 四芒星：外層負責發光（drop-shadow 不能跟 clip-path 放同一層，會被裁掉），內層是星形 */
            .mtfx-spark { position: absolute; width: var(--s); height: var(--s); margin: calc(var(--s) / -2) 0 0 calc(var(--s) / -2);
                          filter: drop-shadow(0 0 3px rgba(255, 220, 120, .95)) drop-shadow(0 0 7px rgba(255, 196, 64, .55)); opacity: 0; }
            .mtfx-spark::before { content: ''; position: absolute; inset: 0;
                                  background: radial-gradient(circle, #fff 0 16%, #fff3c4 30%, #fcd34d 55%, #f59e0b 80%);
                                  clip-path: polygon(50% 0, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0 50%, 40% 40%); }
            .mtfx-spark.burst { animation: mtfxBurst var(--d, 1.1s) cubic-bezier(.2, .7, .3, 1) var(--delay, 0s) forwards; }
            .mtfx-spark.twinkle { animation: mtfxTwinkle var(--d, .9s) ease-in-out var(--delay, 0s) forwards; }
            @keyframes mtfxBurst { 0% { opacity: 0; transform: translate(0, 0) scale(.2) rotate(0deg); }
                                   18% { opacity: 1; transform: translate(calc(var(--dx) * .35), calc(var(--dy) * .35)) scale(1) rotate(30deg); }
                                   100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(.3) rotate(110deg); } }
            @keyframes mtfxTwinkle { 0% { opacity: 0; transform: scale(0) rotate(0deg); } 45% { opacity: 1; transform: scale(1) rotate(45deg); }
                                     100% { opacity: 0; transform: scale(0) rotate(90deg); } }
            /* 愛心：漸層＋高光的 SVG，往上飄、左右輕擺 */
            .mtfx-heart { position: absolute; width: var(--s); height: calc(var(--s) * .92); margin: calc(var(--s) / -2) 0 0 calc(var(--s) / -2);
                          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 22'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23ffa6c1'/%3E%3Cstop offset='1' stop-color='%23e5466f'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M12 21s-8.6-5.3-10.6-10.4C.1 6.9 2.5 2.6 6.5 2.6c2.4 0 4 1.3 5.5 3.3 1.5-2 3.1-3.3 5.5-3.3 4 0 6.4 4.3 5.1 8C20.6 15.7 12 21 12 21z' fill='url(%23g)'/%3E%3Cellipse cx='7.3' cy='7.6' rx='2.6' ry='1.5' fill='white' opacity='.6' transform='rotate(-35 7.3 7.6)'/%3E%3C/svg%3E") center / contain no-repeat;
                          filter: drop-shadow(0 2px 4px rgba(229, 70, 111, .35)); opacity: 0;
                          animation: mtfxHeart var(--d, 1.6s) cubic-bezier(.25, .6, .35, 1) var(--delay, 0s) forwards; }
            @keyframes mtfxHeart { 0% { opacity: 0; transform: translate(0, 0) scale(.3) rotate(0deg); }
                                   15% { opacity: 1; transform: translate(calc(var(--sx) * .3), -18px) scale(1) rotate(calc(var(--r) * .5)); }
                                   55% { transform: translate(calc(var(--sx) * -.4), calc(var(--rise) * .6)) scale(1) rotate(calc(var(--r) * -.4)); }
                                   100% { opacity: 0; transform: translate(var(--sx), var(--rise)) scale(.75) rotate(var(--r)); } }
            /* 光環（徽章） */
            .mtfx-ring { position: absolute; border-radius: 50%; border: 2.5px solid rgba(253, 224, 120, .95);
                         box-shadow: 0 0 12px rgba(253, 200, 80, .8), inset 0 0 10px rgba(255, 240, 190, .7);
                         opacity: 0; animation: mtfxRing .9s ease-out forwards; }
            @keyframes mtfxRing { 0% { opacity: .95; transform: scale(.35); } 100% { opacity: 0; transform: scale(1.55); } }
            /* 光暈（寶物、徽章）：物品後方一團柔和金光 */
            .mtfx-halo { position: absolute; border-radius: 50%; opacity: 0;
                         background: radial-gradient(circle, rgba(255, 228, 140, .9), rgba(255, 200, 90, .45) 42%, rgba(255, 200, 90, 0) 70%);
                         animation: mtfxHalo 1.2s ease-out forwards; }
            @keyframes mtfxHalo { 0% { opacity: 0; transform: scale(.6); } 30% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0; transform: scale(1.25); } }
            /* 光澤掃過：只掃在物品本體上（用圖片本身當遮罩，透明的地方不會有光條） */
            .mtfx-gloss { position: absolute; opacity: .95;
                          background: linear-gradient(105deg, rgba(255,255,255,0) 35%, rgba(255,255,255,.85) 48%, rgba(255,248,220,.9) 50%, rgba(255,255,255,0) 63%) no-repeat;
                          background-size: 250% 100%; background-position: 130% 0;
                          -webkit-mask: var(--m) center / contain no-repeat; mask: var(--m) center / contain no-repeat;
                          mix-blend-mode: screen; animation: mtfxGloss .85s ease-in-out .05s forwards; }
            @keyframes mtfxGloss { to { background-position: -30% 0; } }
            @media (prefers-reduced-motion: reduce) { .mtfx-gloss, .mtfx-ring { display: none; } }
            @media (prefers-reduced-motion: reduce) { .sbm-sc-box .sbm-sc-pic, .sbm-sc-box .sbm-sc-emo { animation: none; } }
        `;
        document.head.appendChild(st);
    }

    function el(id, cls) {
        const sc = get(id);
        if (!sc) return null;
        injectStyle();
        const d = document.createElement('span');
        d.className = 'mt-sc ' + (cls || '');
        d.title = '展示中：' + sc.name;
        d.setAttribute('aria-label', '展示中：' + sc.name);
        if (sc.img) {
            const im = document.createElement('img');
            im.src = url(sc.img); im.alt = sc.name;
            im.onerror = () => { im.remove(); d.textContent = sc.icon || '⭐'; };
            d.appendChild(im);
        } else {
            d.textContent = sc.icon || '⭐';
        }
        return d;
    }

    // 文字標籤依種類（2026-10-07 使用者定）
    const label = (sc) => (sc.type === 'badge' ? '我的徽章' : sc.type === 'treasure' ? '我的寶物' : '我的寵物');

    // ── 互動特效（唯一定義）：寵物／寶物／徽章各一種，見檔頭 ──
    const RM = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    function fx(stage, target, type, o) {
        if (!stage || !target) return;
        o = o || {};
        injectStyle();
        type = type === 'badge' || type === 'treasure' ? type : 'pet';
        const sr = stage.getBoundingClientRect(), tr = target.getBoundingClientRect();
        if (!tr.width) return;
        const cx = tr.left - sr.left + tr.width / 2, cy = tr.top - sr.top + tr.height / 2;
        const size = Math.min(tr.width, tr.height), few = RM() || o.lite;
        const layer = document.createElement('div'); layer.className = 'mtfx-layer';
        const under = document.createElement('div'); under.className = 'mtfx-layer under';
        // 物品要疊在光暈上面：沒有定位的就暫時給 relative＋z-index 1（不改版面）
        if (getComputedStyle(target).position === 'static') { target.style.position = 'relative'; target.style.zIndex = '1'; }
        const put = (cls, x, y, vars, host) => {
            const e = document.createElement('span'); e.className = cls;
            e.style.left = x + 'px'; e.style.top = y + 'px';
            Object.entries(vars || {}).forEach(([k, v]) => e.style.setProperty(k, v));
            (host || layer).appendChild(e); return e;
        };
        const rr = (a, b) => a + Math.random() * (b - a);
        const box = (cls) => { const e = put(cls, tr.left - sr.left, tr.top - sr.top); e.style.width = tr.width + 'px'; e.style.height = tr.height + 'px'; return e; };
        // 光澤：只有圖片才做（用圖片當遮罩）
        const gloss = () => { if (target.tagName === 'IMG' && target.currentSrc) box('mtfx-gloss').style.setProperty('--m', `url("${target.currentSrc}")`); };
        const halo = () => { const d = size * 1.25, e = put('mtfx-halo', cx - d / 2, cy - d / 2, null, under); e.style.width = e.style.height = d + 'px'; };
        if (type === 'pet') {
            const n = few ? 3 : 6;
            // 從兩側輪流冒出、往上飄過頭頂（不從臉中間冒，才不會遮住寵物的臉）
            for (let i = 0; i < n; i++) put('mtfx-heart', cx + (i % 2 ? 1 : -1) * size * rr(.28, .42), cy - size * rr(.05, .2), {
                '--s': rr(20, 32).toFixed(0) + 'px', '--rise': (-rr(size * .55, size * .85)).toFixed(0) + 'px',
                '--sx': rr(-28, 28).toFixed(0) + 'px', '--r': rr(-25, 25).toFixed(0) + 'deg',
                '--d': rr(1.3, 1.9).toFixed(2) + 's', '--delay': (i * .09 + rr(0, .08)).toFixed(2) + 's' });
            for (let i = 0; i < (few ? 2 : 5); i++) {
                const a = rr(0, Math.PI * 2), d = size * rr(.45, .65);
                put('mtfx-spark burst', cx, cy - size * .05, { '--s': rr(10, 16).toFixed(0) + 'px', '--dx': (Math.cos(a) * d).toFixed(0) + 'px',
                    '--dy': (Math.sin(a) * d * .8 - 10).toFixed(0) + 'px', '--d': rr(.9, 1.2).toFixed(2) + 's', '--delay': rr(0, .15).toFixed(2) + 's' });
            }
        } else if (type === 'treasure') {
            halo(); gloss();
            for (let i = 0; i < (few ? 4 : 9); i++) {   // 四芒星在物品周圍輪流閃
                const a = rr(0, Math.PI * 2), d = size * rr(.25, .55);
                put('mtfx-spark twinkle', cx + Math.cos(a) * d, cy + Math.sin(a) * d * .9, { '--s': rr(12, 22).toFixed(0) + 'px',
                    '--d': rr(.7, 1).toFixed(2) + 's', '--delay': (i * .1 + rr(0, .1)).toFixed(2) + 's' });
            }
        } else {   // badge
            halo(); gloss();
            const d0 = size * .8, ring = put('mtfx-ring', cx - d0 / 2, cy - d0 / 2); ring.style.width = ring.style.height = d0 + 'px';
            const n = few ? 5 : 10;
            for (let i = 0; i < n; i++) {
                const a = (Math.PI * 2 * i) / n + rr(-.15, .15), d = size * rr(.55, .75);
                put('mtfx-spark burst', cx, cy, { '--s': rr(11, 18).toFixed(0) + 'px', '--dx': (Math.cos(a) * d).toFixed(0) + 'px',
                    '--dy': (Math.sin(a) * d).toFixed(0) + 'px', '--d': rr(.9, 1.15).toFixed(2) + 's', '--delay': rr(.05, .18).toFixed(2) + 's' });
            }
        }
        stage.insertBefore(under, stage.firstChild);
        stage.appendChild(layer);
        setTimeout(() => { layer.remove(); under.remove(); }, 2300);
    }

    // 點展示品：彈跳＋特效＋音效（同成就與寵物頁點寵物；特效與音效依種類）
    function react(box, pic, sc) {
        pic.classList.remove('mt-sc-react'); void pic.offsetWidth; pic.classList.add('mt-sc-react');
        setTimeout(() => pic.classList.remove('mt-sc-react'), 640);
        fx(box, pic, sc && sc.type);
        try { const a = new Audio(url(soundOf(sc))); a.volume = 0.9; a.play().catch(() => {}); } catch (e) {}
    }

    // 學生資訊彈窗（唯一定義；測驗頁與獎勵板共用）：有照片→原始比例；沒照片→👤 佔位。點任意處關閉。
    function studentModal(stu) {
        if (!stu) return;
        injectStyle();
        document.querySelector('.sbm-overlay')?.remove();
        const sc = get(stu.id);
        const ov = document.createElement('div');
        ov.className = 'sbm-overlay';
        ov.setAttribute('role', 'dialog');
        ov.setAttribute('aria-label', '學生資訊：' + (stu.name || ''));
        ov.innerHTML = '<div class="sbm-row' + (sc ? ' two' : '') + '">' +
            '<div class="sbm-col"><div class="sbm-name"></div>' + (stu.photo ? '<img class="sbm-photo" alt="">' : '<div class="sbm-avatar">👤</div>') + '</div>' +
            (sc ? '<div class="sbm-col"><div class="sbm-name sbm-sc-label"></div><div class="sbm-sc-box" title="點一下跟牠玩"></div></div>' : '') +
            '</div><div class="sbm-hint">點擊任意處關閉</div>';
        if (stu.photo) ov.querySelector('.sbm-photo').src = stu.photo;
        ov.querySelector('.sbm-name').textContent = stu.name || '';
        if (sc) {
            ov.querySelector('.sbm-sc-label').textContent = '⭐ ' + label(sc) + '：' + sc.name;
            const box = ov.querySelector('.sbm-sc-box');
            let pic;
            if (sc.img) {
                pic = document.createElement('img'); pic.className = 'sbm-sc-pic'; pic.alt = sc.name; pic.src = url(sc.img);
            } else {
                pic = document.createElement('span'); pic.className = 'sbm-sc-emo'; pic.textContent = sc.icon || '⭐';
            }
            box.appendChild(pic);
            box.addEventListener('click', (e) => { e.stopPropagation(); react(box, pic, sc); });
        }
        ov.addEventListener('click', () => ov.remove());
        document.body.appendChild(ov);
        playOpen();
    }

    window.MTShowcase = { get, set, same, el, url, label, studentModal, SOUNDS, playOpen, fx };
})();
