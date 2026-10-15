/**
 * title-heroes.js — 測驗頁標題列上的三個角色頭像（2026-10-06 使用者定，24 單元＋生活情境對話）
 *
 *   金博士（#chatbot-fab）：標題列左邊那組（圖示／第幾題／標題字）的右邊
 *   金好聊（對話模組 #btn-tips-fab）：同上，對話練習頁標題列左邊那組的右邊
 *   小金探：標題列右邊那組（第幾題／返回設定）的左邊；原本內容卡上的「小金探＋💡提示鈕」不再顯示
 *
 * 點小金探 → 彈窗「遇到困難了嗎？點我旁邊的提示鈕，我會給你一個解題線索喔！」，右上角 ✕：
 *   點 💡 ＝ 看提示（替學生按下原本那顆提示鈕：各單元的提示邏輯、語音、計次、金額字顯示全照舊）
 *   點 ✕ 或點彈窗以外 ＝ 關掉、不給提示（讓學生再想一下）
 *
 * 做法（不改各單元模板）：
 *   - 標題列每一題都會被整個重畫 → 頭像本身不放進標題列，只在標題列裡塞一個「佔位格」（.th-slot），
 *     頭像用 position:fixed 疊在佔位格上；佔位格被重畫掉就再補一個。金博士的 FAB 因此永遠不離開 body，
 *     chatbot-engine.js 綁好的事件不會失效。
 *   - 原本的小金探圖與提示鈕加上 .dtv-moved（看不見、不佔位，但還在 DOM 裡、還能被 .click()）。
 *     小金探頭像只在「原本那顆提示鈕此刻應該看得到」時出現（例如簡單模式本來就沒有提示鈕＝不出現）。
 *   - 找不到標題列（設定頁、結算頁、少數沒有標題列的畫面）：金博士回到原本左下角；
 *     小金探頭像改放在右上角。
 * 由 js/detective-hint.js 載入（24 單元經 chatbot-engine.js、對話模組直接引用），呼叫端不用另外掛。
 */
(function () {
    'use strict';
    if (window.TitleHeroes) return;

    const SELF = (document.currentScript && document.currentScript.src) || '';
    const BASE = SELF ? new URL('..', SELF).href : '../';
    // 2026-10-07 使用者試聽後選定：用小金探原本的錄音（7 月那批，和其他小金探語音同一次生成）
    const AUDIO_STEM = BASE + 'audio/chatbot/detective_hint';
    const SPEAK_TXT = '遇到困難了嗎？點我旁邊的提示鈕，我會給你一個解題線索喔！';
    const DTV_IMG = BASE + 'images/common/hint_detective.png';
    const SIZE = 58;   // 頭像浮在標題列上一層（2026-10-06 使用者定：放大、對齊同一位置、不影響標題列高度）
    const SIZE_S = 44;   // 手機寬（≤600px）的頭像尺寸，見 css 的 @media
    const sizeNow = () => (window.matchMedia && matchMedia('(max-width:600px)').matches ? SIZE_S : SIZE);

    const BAR_SEL = '.title-bar, .kiosk-title-bar, .b-header, .mcdonalds-title-bar, .atm-title-bar, .app-header';
    const css = `
.th-slot{display:inline-block;flex:0 0 ${SIZE}px;width:${SIZE}px;height:1px;margin:0 6px;vertical-align:middle;pointer-events:none}
body.th-doc-in-bar #chatbot-fab{width:${SIZE}px!important;height:${SIZE}px!important;padding:4px!important;border-width:3px!important;bottom:auto!important;right:auto!important;box-shadow:0 2px 10px rgba(0,0,0,.28)!important}
body.th-doc-in-bar #chatbot-window{top:${SIZE + 24}px;bottom:auto}
#btn-tips-fab.th-in-bar{position:fixed!important;z-index:500!important;right:auto!important;bottom:auto!important;width:${SIZE}px!important;height:${SIZE}px!important;border-radius:50%!important;background:#fff!important;border:3px solid #fff!important;padding:4px!important;margin:0!important;box-shadow:0 2px 10px rgba(0,0,0,.28)!important}
#th-dtv{position:fixed;z-index:500;width:${SIZE}px;height:${SIZE}px;padding:4px;border-radius:50%;background:#fff;border:3px solid #F59E0B;box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer;touch-action:manipulation;display:none;align-items:center;justify-content:center}
#th-dtv img{width:100%;height:100%;object-fit:contain;pointer-events:none;display:block}
#th-dtv:active{transform:none!important;filter:brightness(.92)}
#th-dtv.th-on{display:flex}
.dtv-moved{position:absolute!important;visibility:hidden!important;pointer-events:none!important;width:0!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important}
.th-pop{position:fixed;z-index:10600;width:min(320px,calc(100vw - 24px));background:#fff;border-radius:18px;box-shadow:0 10px 32px rgba(0,0,0,.28);border:3px solid #F59E0B;padding:16px 18px 18px;text-align:center;color:#333;animation:thPopIn .18s ease-out}
.th-pop-x{position:absolute;top:6px;right:8px;width:34px;height:34px;border:none;border-radius:50%;background:#f3f4f6;color:#444;font-size:18px;line-height:34px;cursor:pointer;padding:0;touch-action:manipulation}
.th-pop-x:active{transform:none!important;background:#e5e7eb}
.th-pop-head{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 30px 8px}
.th-pop-head img{width:75px;height:75px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,.2))}   /* 同金博士百科標頭（#chatbot-header .chatbot-header-mascot 75×75） */
.th-pop-text{font-size:1.15rem;font-weight:700;line-height:1.6}
.th-pop-bulb{display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;margin:12px auto 0;border:none;border-radius:50%;background:linear-gradient(135deg,#FFE066,#FFB300);box-shadow:0 4px 12px rgba(255,160,0,.45);font-size:34px;cursor:pointer;touch-action:manipulation;color:#333}
.th-pop-bulb:active{transform:none!important;filter:brightness(.92)}
/* 手機寬（≤600px）縮成 44px（觸控下限）：58px 兩顆加上標題列原有按鈕，390px 寬的手機會把 🏠 擠出畫面（2026-10-10） */
@media (max-width:600px){.th-slot{flex-basis:${SIZE_S}px;width:${SIZE_S}px;margin:0 3px}body.th-doc-in-bar #chatbot-fab,#btn-tips-fab.th-in-bar,#th-dtv{width:${SIZE_S}px!important;height:${SIZE_S}px!important;padding:3px!important}}
@keyframes thPopIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .th-pop{background:#2d2d44;color:#f1f1f1}:root:not([data-theme="light"]) .th-pop-x{background:#3d3d5c;color:#eee}:root:not([data-theme="light"]) #th-dtv{background:#2d2d44}}
[data-theme="dark"] .th-pop{background:#2d2d44;color:#f1f1f1}
[data-theme="dark"] .th-pop-x{background:#3d3d5c;color:#eee}
[data-theme="dark"] #th-dtv{background:#2d2d44}
`;
    const st = document.createElement('style');
    st.id = 'title-heroes-style';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);

    // ── 標題列與左右兩組 ────────────────────────────────────────
    function visible(el) { return !!(el && el.getClientRects().length); }
    function findBar() {
        let best = null;
        document.querySelectorAll(BAR_SEL).forEach(b => {
            if (!visible(b) || b.closest('.th-pop')) return;
            const r = b.getBoundingClientRect();
            if (r.top > 80 || r.height < 30 || r.width < 300) return;
            if (!best || r.top < best.getBoundingClientRect().top) best = b;
        });
        return best;
    }
    function group(bar, side) {
        const re = side === 'left' ? /(^|[-\s])left\b/ : /(^|[-\s])right\b/;
        const kids = [...bar.children].filter(k => !k.classList.contains('th-slot'));
        return kids.find(k => re.test(k.className || '')) || (side === 'left' ? kids[0] : kids[kids.length - 1]) || bar;
    }
    function ensureSlot(container, cls, atStart) {
        let s = container.querySelector(':scope > .' + cls);
        if (!s) {
            s = document.createElement('span');
            s.className = 'th-slot ' + cls;
            s.setAttribute('aria-hidden', 'true');
            if (atStart) container.insertBefore(s, container.firstChild); else container.appendChild(s);
        }
        return s;
    }
    function dropSlots(cls) { document.querySelectorAll('.' + cls).forEach(s => s.remove()); }
    // 頭像疊在佔位格上：水平對齊佔位格、垂直置中在整條標題列（佔位格只有 1px 高，不撐高標題列）。
    // 疊上去之後再量一次修正——祖先有 transform／backdrop-filter 時 position:fixed 的基準不是視窗
    function place(el, slot, bar) {
        const r = slot.getBoundingClientRect();
        const b = (bar || slot).getBoundingClientRect();
        const sz = sizeNow();
        const x = Math.round(r.left + r.width / 2 - sz / 2);
        const y = Math.max(Math.round(b.top) + 2, Math.round(b.top + b.height / 2 - sz / 2));   // 標題列比頭像矮時往下凸，不切到上緣
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        const a = el.getBoundingClientRect();
        if (Math.abs(a.left - x) > 1 || Math.abs(a.top - y) > 1) {
            el.style.left = (x + x - a.left) + 'px';
            el.style.top = (y + y - a.top) + 'px';
        }
    }

    // ── 小金探：找「小金探圖＋提示鈕」那一組 ────────────────────
    function hintBtnNear(img) {
        const look = el => el && [...el.querySelectorAll('button, #hint-box, [class*="hint-btn"]')].find(b =>
            b !== img && (/hint/i.test(b.className + ' ' + b.id) || (b.textContent || '').includes('提示')));
        return look(img.parentElement) || look(img.parentElement && img.parentElement.parentElement);
    }
    // 現在是不是簡單模式（2026-10-06 使用者定：簡單模式一律沒有小金探）。
    // 各單元的全域物件與欄位名不同（Game／McDonald／ATM／BarberKiosk／VendingMachine／MoneyExchange3；
    // state.settings／gameSettings／settings），逐一試；讀不到就當不是簡單模式（照原本有沒有提示鈕決定）
    function isEasy() {
        const objs = [];
        try { if (typeof Game !== 'undefined') objs.push(Game); } catch (e) {}
        ['Game', 'McDonald', 'ATM', 'BarberKiosk', 'VendingMachine', 'MoneyExchange3'].forEach(k => { if (window[k]) objs.push(window[k]); });
        for (const o of objs) {
            const d = (o && ((o.state && o.state.settings && o.state.settings.difficulty) ||
                (o.gameSettings && o.gameSettings.difficulty) || (o.settings && o.settings.difficulty))) || '';
            if (d) return d === 'easy';
        }
        return false;
    }
    function activePair() {
        const imgs = document.querySelectorAll('img[src*="hint_detective"]');
        for (const img of imgs) {
            // 彈窗裡的小金探（例：對話模組「小金探偷偷告訴你」）不是內容卡那組，搬了會連彈窗的 ✕ 一起藏掉
            if (img.closest('.th-pop, #th-dtv, .dtv-popup, [role="dialog"]')) continue;
            const btn = hintBtnNear(img);
            if (!btn) continue;
            img.classList.add('dtv-moved');
            btn.classList.add('dtv-moved');
            // 已加 .dtv-moved（只隱形、不改 display）→ getClientRects 仍反映單元自己有沒有把它藏起來
            if (visible(btn) && visible(img.parentElement) && !isEasy()) return { img, btn };
        }
        return null;
    }

    let dtvBtn = null, curPair = null;
    function ensureDtvBtn() {
        if (dtvBtn && dtvBtn.isConnected) return dtvBtn;
        dtvBtn = document.createElement('button');
        dtvBtn.id = 'th-dtv';
        dtvBtn.type = 'button';
        dtvBtn.title = '小金探：需要提示嗎？';
        dtvBtn.setAttribute('aria-label', '小金探：需要提示嗎？');
        dtvBtn.innerHTML = `<img src="${DTV_IMG}" alt="">`;
        dtvBtn.addEventListener('click', e => { e.stopPropagation(); openPop(); });
        document.body.appendChild(dtvBtn);
        return dtvBtn;
    }

    // ── 彈窗 ────────────────────────────────────────────────
    let pop = null, outside = null;
    function closePop() {
        stopVoice();
        if (pop) { pop.remove(); pop = null; }
        if (outside) { document.removeEventListener('pointerdown', outside, true); outside = null; }
    }
    function openPop() {
        closePop();
        const pair = curPair;
        pop = document.createElement('div');
        pop.className = 'th-pop';
        pop.setAttribute('role', 'dialog');
        pop.innerHTML = `
            <button type="button" class="th-pop-x" aria-label="關閉">✕</button>
            <div class="th-pop-head"><img src="${DTV_IMG}" alt="小金探"></div>
            <div class="th-pop-text">遇到困難了嗎？<br>點我旁邊的提示鈕，我會給你一個解題線索喔！</div>
            <button type="button" class="th-pop-bulb" aria-label="看提示">💡</button>`;
        document.body.appendChild(pop);
        const r = dtvBtn.getBoundingClientRect();
        const pw = pop.offsetWidth;
        let left = Math.min(window.innerWidth - pw - 12, Math.max(12, r.left + r.width / 2 - pw / 2));
        pop.style.left = left + 'px';
        pop.style.top = Math.min(window.innerHeight - pop.offsetHeight - 12, r.bottom + 10) + 'px';
        pop.querySelector('.th-pop-x').addEventListener('click', e => { e.stopPropagation(); closePop(); });
        pop.querySelector('.th-pop-bulb').addEventListener('click', e => {
            e.stopPropagation();
            closePop();
            const p = (pair && pair.btn.isConnected) ? pair : activePair();
            if (p) p.btn.click();   // 跟學生按原本那顆提示鈕完全一樣
        });
        outside = e => { if (pop && !pop.contains(e.target) && !dtvBtn.contains(e.target)) closePop(); };
        setTimeout(() => { if (pop) document.addEventListener('pointerdown', outside, true); }, 50);
        speak();
    }

    // 預錄 mp3 → wav → 即時語音
    let audio = null, token = null;
    // 關掉彈窗（✕、點外面、按 💡）時小金探的話一律停掉——預錄檔與即時語音都要停（2026-10-06 使用者定）
    let ttsOn = false;
    function stopVoice() {
        token = null;
        if (audio) { try { audio.pause(); } catch (e) {} audio = null; }
        if (ttsOn && window.speechSynthesis) { window.speechSynthesis.cancel(); }
        ttsOn = false;
    }
    function speak() {
        stopVoice();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        const exts = ['mp3', 'wav'];
        let i = 0;
        const t = {};
        token = t;
        const next = () => {
            if (token !== t) return;
            if (i >= exts.length) { tts(); return; }
            const a = new Audio(AUDIO_STEM + '.' + exts[i++]);
            audio = a;
            let done = false;
            const fail = () => { if (done) return; done = true; next(); };
            a.onerror = fail;
            a.onended = () => { if (token === t) audio = null; };
            a.play().catch(fail);
        };
        next();
    }
    function tts() {
        if (!window.speechSynthesis) return;
        const u = new SpeechSynthesisUtterance(SPEAK_TXT);
        u.lang = 'zh-TW';
        u.rate = 0.85;
        const vs = window.speechSynthesis.getVoices();
        u.voice = vs.find(v => /yating|hanhan/i.test(v.name)) || vs.find(v => v.lang === 'zh-TW') ||
            vs.find(v => (v.lang || '').startsWith('zh')) || null;
        u.onend = u.onerror = () => { ttsOn = false; };
        ttsOn = true;
        window.speechSynthesis.speak(u);
    }

    // ── 每一輪：補佔位格、把頭像疊上去 ────────────────────────────
    function update() {
        const bar = findBar();
        const fab = document.getElementById('chatbot-fab');
        const tips = document.getElementById('btn-tips-fab');

        // 金好聊（對話練習頁）：同金博士，浮在標題列左邊那組的右邊（按鈕本身不搬，事件照舊）
        if (tips) {
            if (bar && bar.closest('#screen-practice') && bar.contains(tips)) {
                tips.classList.add('th-in-bar');
                place(tips, ensureSlot(group(bar, 'left'), 'th-slot-chat', false), bar);
            } else if (tips.classList.contains('th-in-bar')) {
                tips.classList.remove('th-in-bar');
                tips.style.left = tips.style.top = '';
                dropSlots('th-slot-chat');
            }
        }

        // 金博士
        if (fab && bar) {
            const slot = ensureSlot(group(bar, 'left'), 'th-slot-doc', false);
            document.body.classList.add('th-doc-in-bar');
            place(fab, slot, bar);
        } else {
            dropSlots('th-slot-doc');
            if (document.body.classList.contains('th-doc-in-bar')) {
                document.body.classList.remove('th-doc-in-bar');
                if (fab) { fab.style.left = ''; fab.style.top = ''; }
            }
        }

        // 小金探
        curPair = activePair();
        const d = ensureDtvBtn();
        if (curPair) {
            d.classList.add('th-on');
            if (bar) {
                place(d, ensureSlot(group(bar, 'right'), 'th-slot-dtv', true), bar);
            } else {
                dropSlots('th-slot-dtv');
                d.style.left = (window.innerWidth - sizeNow() - 14) + 'px';
                d.style.top = '12px';
            }
        } else {
            d.classList.remove('th-on');
            dropSlots('th-slot-dtv');
            if (pop) closePop();
        }
    }

    let queued = false;
    function queue() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; update(); });
    }
    function boot() {
        update();
        new MutationObserver(muts => {
            // 自己畫的佔位格／頭像／彈窗不觸發，避免無限迴圈
            if (muts.every(m => [...m.addedNodes, ...m.removedNodes].every(n =>
                n.nodeType === 1 && (n.classList.contains('th-slot') || n.id === 'th-dtv' || n.classList.contains('th-pop'))))) return;
            queue();
        }).observe(document.body, { childList: true, subtree: true });
        window.addEventListener('resize', queue);
        window.addEventListener('scroll', queue, true);
        setInterval(queue, 700);   // 標題字變長變短、動畫結束後位置會移
    }

    window.TitleHeroes = { update, open: openPop, close: closePop };
    if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
