/**
 * 小金探點擊彈窗（全站共用，唯一定義處）
 *
 * 畫面上任何「小金探圖（hint_detective*.png）旁邊有提示鈕」的地方，點小金探 →
 * 圖下方跳出小彈窗「遇到困難了嗎？點我旁邊的 💡 提示鈕…」＋播預錄語音（audio/chatbot/detective_hint）。
 * 點提示鈕才是看提示——小金探只負責告訴學生「提示鈕在這裡」。
 *
 * 使用處：24 單元（由 js/chatbot-engine.js 載入本檔）、生活情境對話 dialogue/index.html（直接引用）。
 * 2026-09-27 從 chatbot-engine.js 抽出來：對話模組也要同一個行為（使用者定），不可以各寫一份。
 * 樣式在 css/detective-hint.css（本檔自己掛上，呼叫端不用另外引用）。
 *
 * 按提示鈕時小金探的話會被停掉：那是全站「同一時間只有一個語音」規則（js/audio-unlocker.js）做的，
 * 提示一開口小金探就停——這裡不另外寫（2026-09-24 使用者定：不是只針對小金探）
 */
(function () {
    if (window.DetectiveHint) return;   // 同一頁載入兩次（chatbot-engine 動態載入＋頁面自己引用）只跑一次

    // 路徑一律以本檔位置為準：24 單元在 html/、對話在 dialogue/，頁面相對路徑不同
    const SELF = (document.currentScript && document.currentScript.src) || '';
    const BASE = SELF ? new URL('..', SELF).href : '../';
    const AUDIO_BASE = BASE + 'audio/chatbot/';

    const IMG_RE   = /hint_detective/;
    const TXT_HTML = '遇到困難了嗎？點我旁邊的 💡 <strong>提示鈕</strong>，我會給你一個解題線索喔！';
    const TXT_SPK  = '遇到困難了嗎？點我旁邊的提示鈕，我會給你一個解題線索喔！';

    if (!document.querySelector('link[data-detective-hint]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = BASE + 'css/detective-hint.css';
        link.dataset.detectiveHint = '';
        document.head.appendChild(link);
    }

    // 預錄音檔 .mp3 → .wav → 即時 TTS
    let _audio = null, _token = null;
    function stop() {
        _token = null;
        if (_audio) { try { _audio.pause(); } catch (e) {} _audio = null; }
    }
    function speak() {
        stop();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        const exts = ['mp3', 'wav'];
        let i = 0;
        const token = {};
        _token = token;
        const tryNext = () => {
            if (_token !== token) return;
            if (i >= exts.length) { speakTTS(TXT_SPK); return; }
            const audio = new Audio(AUDIO_BASE + 'detective_hint.' + exts[i++]);
            _audio = audio;
            let advanced = false;   // 防 onerror + play.catch 雙觸發
            const fail = () => { if (advanced) return; advanced = true; tryNext(); };
            audio.onerror = fail;
            audio.onended = () => { if (_token === token) _audio = null; };
            audio.play().catch(fail);
        };
        tryNext();
    }
    function speakTTS(text) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'zh-TW';
        utt.rate = 0.85;
        const vs = window.speechSynthesis.getVoices();
        const pick = fn => vs.find(fn);
        utt.voice =
            pick(v => /yating/i.test(v.name)) ||
            pick(v => /hanhan/i.test(v.name)) ||
            pick(v => /google/i.test(v.name) && v.lang.startsWith('zh')) ||
            pick(v => v.lang === 'zh-TW') ||
            pick(v => v.lang.startsWith('zh')) || null;
        window.speechSynthesis.speak(utt);
    }

    function hasHintBtn(imgEl) {
        // 提示鈕不一定是 <button>：F2 困難模式的提示框是 div#hint-box
        const check = el => el && [...el.querySelectorAll('button, #hint-box, [class*="hint-btn"]')].some(b =>
            /hint/i.test(b.className + ' ' + b.id) || b.textContent.includes('提示')
        );
        return check(imgEl.parentElement) || check(imgEl.parentElement?.parentElement);
    }

    function show(imgEl) {
        document.querySelector('.dtv-popup')?.remove();
        const popup = document.createElement('div');
        popup.className = 'dtv-popup';
        popup.innerHTML = `
            <img class="dtv-popup-avatar" src="${imgEl.src}" alt="小金探">
            <div class="dtv-popup-text">${TXT_HTML}</div>`;
        document.body.appendChild(popup);

        // 以小金探圖示本身為錨，彈窗置於圖示正下方、水平對齊圖示中心（2026-09-24 使用者定）。
        // 原本錨在父容器：父容器常是整條標題列（F1 的 .header-with-hint），彈窗就跑到整列最左邊、離小金探很遠
        const aRect = imgEl.getBoundingClientRect();
        const pw = popup.offsetWidth || 280;
        const ph = popup.offsetHeight || 130;
        let left = aRect.left + aRect.width / 2 - pw / 2 + window.scrollX;
        if (left + pw > window.innerWidth + window.scrollX - 8)
            left = window.innerWidth + window.scrollX - pw - 8;
        if (left < window.scrollX + 8) left = window.scrollX + 8;
        // 優先顯示在下方；下方空間不足時改上方
        let top = aRect.bottom + window.scrollY + 8;
        if (aRect.bottom + ph + 8 > window.innerHeight)
            top = aRect.top + window.scrollY - ph - 8;
        if (top < window.scrollY + 8) top = window.scrollY + 8;
        popup.style.top  = top + 'px';
        popup.style.left = left + 'px';

        speak();

        // 學生自己關掉（點彈窗／點外面）＝語音一起停；4 秒自動收起時語音已唸完，不必停（2026-10-10 使用者定）
        const dismiss = (byUser) => {
            if (byUser === true) { stop(); try { window.speechSynthesis?.cancel(); } catch (e) {} }
            popup.classList.add('dtv-popup-out');
            setTimeout(() => popup.remove(), 250);
            document.removeEventListener('click', outside, true);
        };
        const outside = e => { if (!popup.contains(e.target) && e.target !== imgEl) { clearTimeout(timer); dismiss(true); } };
        const timer = setTimeout(dismiss, 4000);
        popup.addEventListener('click', () => { clearTimeout(timer); dismiss(true); });
        setTimeout(() => document.addEventListener('click', outside, true), 80);
    }

    // 自動綁定：頁面上（含之後才畫出來的）小金探圖，旁邊有提示鈕的才綁
    function bindAll(bound) {
        document.querySelectorAll('img').forEach(img => {
            if (bound.has(img) || !IMG_RE.test(img.getAttribute('src') || '') || !hasHintBtn(img)) return;
            bound.add(img);
            img.style.cursor = 'pointer';
            img.addEventListener('click', e => { e.stopPropagation(); show(img); });
        });
    }
    function init() {
        const bound = new WeakSet();
        bindAll(bound);
        new MutationObserver(() => bindAll(bound)).observe(document.body, { childList: true, subtree: true });
    }

    window.DetectiveHint = { show, stop };

    // 2026-10-06 起小金探改成標題列上的圓形頭像、提示鈕不再顯示：js/title-heroes.js（也負責金博士、金好聊進標題列）。
    // 由本檔順帶載入——24 單元（chatbot-engine.js 載入本檔）與生活情境對話都會拿到，呼叫端不用另外掛。
    if (!window.TitleHeroes && !document.querySelector('script[data-title-heroes]')) {
        const th = document.createElement('script');
        th.src = BASE + 'js/title-heroes.js';
        th.dataset.titleHeroes = '';
        (document.head || document.documentElement).appendChild(th);
    }
    if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('beforeunload', stop);
})();
