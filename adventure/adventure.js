'use strict';

// ── 預錄語音對照（最終文字 → audio/adv/{檔名}.mp3）───────────────
// 只放「固定不變」的句子；命中就播預錄好音質（Edge 神經語音），缺檔/失敗自動退回即時 TTS。
// 含隨機數字的句子不放這裡、一律即時。mp3 由 voicegen 產生後即自動生效，程式不必再改。
const ADV_HELLO = {   // 選角時的第一人稱自我介紹（各角色用自己的聲音）
    boy:  '我是小翔！我最喜歡冒險了！',
    girl: '我是小花！我喜歡逛文具店。',
    kid:  '我是小睿，我會小心用錢。',
    teen: '我是小凱！今天想吃點好料的！',
};
const ADV_YAY = {   // 答對時的角色歡呼（各角色聲；接在數字報讀前，取代原本的「答對了！」開頭）
    boy:  '我做到了！',
    girl: '答對了，太好了！',
    kid:  '嗯，算對了！',
    teen: '耶，我算對了！',
};
const ADV_AUDIO_MAP = {
    // 開場・答錯鼓勵（旁白 曉臻）
    '一日金錢冒險！選好角色，和我一起學習用錢吧！': 'adv_intro',
    '開始冒險！':              'adv_start',
    '不對喔，再數一次！':       'adv_retry_count',
    '再算算！':                'adv_retry_calc',
    '再看看！':                'adv_retry_look',
    '再想想，這樣安全嗎？':     'adv_retry_safe',
    // 角色自我介紹（各角色聲）
    [ADV_HELLO.boy]:  'adv_hello_boy',
    [ADV_HELLO.girl]: 'adv_hello_girl',
    [ADV_HELLO.kid]:  'adv_hello_kid',
    [ADV_HELLO.teen]: 'adv_hello_teen',
    // 答對歡呼（各角色聲）
    [ADV_YAY.boy]:  'adv_yay_boy',
    [ADV_YAY.girl]: 'adv_yay_girl',
    [ADV_YAY.kid]:  'adv_yay_kid',
    [ADV_YAY.teen]: 'adv_yay_teen',
};

// ── 語音 ──────────────────────────────────────────────────────
const AdvSpeech = (() => {
    let _voices   = [];      // 目前可用的所有語音
    let _fallback = null;    // 主後備語音（挑一把最好的中文；沒有專屬語音時用它）
    let _ready    = false;
    let _pending  = null;

    // 各說話者偏好的語音（名稱關鍵字，中英皆列）。Edge 瀏覽器＋聯網時 speechSynthesis 會列出
    // 「Microsoft XXX Online (Natural)」這批神經語音＝與對話練習學生同款，可即時合成、隨機數字照唸；
    // 匹配得到就給角色綁「真的不同人聲」，匹配不到才退回下方 PROFILES 的音高/語速變調。
    const VOICE_PREFS = {
        narrator: ['Xiaoxiao', '晓晓', 'Yunjian', '云健', 'HsiaoChen', '曉臻', '晓臻'],  // 旁白：沉穩
        retry:    ['Xiaoxiao', '晓晓', 'Yunjian', '云健', 'HsiaoChen', '曉臻', '晓臻'],  // 鼓勵：同旁白，語氣柔
        boy:      ['Yunxi', '云希', 'Yunyang', '云扬', 'YunJhe', '雲哲', '云哲'],        // 小翔：年輕男
        teen:     ['YunJhe', '雲哲', '云哲', 'Yunjian', '云健', 'Yunxi', '云希'],        // 小凱：成熟男
        girl:     ['HsiaoChen', '曉臻', '晓臻', 'Xiaoyi', '晓伊', 'Xiaoxiao', '晓晓'],   // 小花：清亮女
        kid:      ['HsiaoYu', '曉雨', '晓雨', 'Xiaoyi', '晓伊', 'HsiaoChen', '晓臻'],     // 小睿：溫和女
    };
    // 音高/語速：主要靠上面不同語音做出真人聲差異；只有單一語音的裝置，靠這裡的變調保底區分角色。
    const PROFILES = {
        narrator: { pitch: 1.0,  rate: 0.9  },  // 旁白・題目：沉穩說故事
        retry:    { pitch: 1.05, rate: 0.95 },  // 答錯鼓勵：溫和不責備
        boy:      { pitch: 0.95, rate: 1.0  },  // 小翔・活潑少年
        teen:     { pitch: 0.8,  rate: 1.0  },  // 小凱・低沉大男孩
        girl:     { pitch: 1.3,  rate: 1.05 },  // 小花・清亮女生
        kid:      { pitch: 1.15, rate: 0.95 },  // 小睿・細心稍高
    };

    const _load = () => {
        const vs = window.speechSynthesis?.getVoices() || [];
        if (!vs.length) return;
        _voices = vs;
        _fallback = vs.find(v => v.name.startsWith('Microsoft Yating')) ||
                    vs.find(v => /microsoft/i.test(v.name) && /online/i.test(v.name) && v.lang.startsWith('zh')) ||
                    vs.find(v => /google/i.test(v.name) && v.lang.startsWith('zh')) ||
                    vs.find(v => v.name.startsWith('Microsoft Hanhan')) ||
                    vs.find(v => v.name === 'Google 國語（臺灣）') ||
                    vs.find(v => v.lang === 'zh-TW') ||
                    vs.find(v => v.lang && v.lang.startsWith('zh')) ||
                    null;
        _ready = true;
        if (_pending) { const p = _pending; _pending = null; p(); }
    };
    if (window.speechSynthesis) {
        _load();
        speechSynthesis.addEventListener('voiceschanged', _load);
        // 手機解鎖：首次使用者手勢時用一句靜音語音喚醒 speechSynthesis，
        // 否則之後「過場自動播」等非手勢時機的即時旁白會被行動瀏覽器 autoplay 擋掉、不發聲。
        const _unlock = () => {
            try { const u = new SpeechSynthesisUtterance('。'); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
            document.removeEventListener('pointerdown', _unlock, true);
        };
        document.addEventListener('pointerdown', _unlock, true);
    }

    // 依說話者挑專屬語音：先找偏好清單裡實際存在的語音，找不到用主後備語音。
    const _voiceFor = (who) => {
        const prefs = VOICE_PREFS[who];
        if (prefs) {
            for (const kw of prefs) {
                const v = _voices.find(x => x.name.includes(kw));
                if (v) return v;
            }
        }
        return _fallback;
    };

    let _audio   = null;   // 目前播放中的預錄音檔（供 cancel 停止）
    let _fbTimer = null;   // 兜底計時器：部分瀏覽器 onend/onended 不穩，靠它保證流程一定往下走
    const _clearFb = () => { if (_fbTimer) { clearTimeout(_fbTimer); _fbTimer = null; } };

    // 即時 TTS（缺預錄檔時的後備＋所有含數字的句子）。
    // 不等 voices 載入就先發聲（沒載好就用瀏覽器預設聲），並加兜底計時器確保 cb 一定被呼叫——
    // 否則 voiceschanged 沒觸發時會整個卡住（即時語音不播、推進關卡的回呼也不觸發）。
    const _tts = (text, cb, who) => {
        const prof = PROFILES[who] || PROFILES.narrator;
        let done = false;
        const fire = () => { if (done) return; done = true; _clearFb(); if (cb) cb(); };
        try {
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            const v = _voiceFor(who);   // _voices 可能還是空，v=null 就用瀏覽器預設聲
            u.lang  = v?.lang || 'zh-TW';
            u.rate  = prof.rate;
            u.pitch = prof.pitch;
            if (v) u.voice = v;
            u.onend = fire;
            u.onerror = fire;
            speechSynthesis.speak(u);
        } catch (e) { /* 發聲失敗也要推進 */ }
        _clearFb();
        _fbTimer = setTimeout(fire, 1200 + (text ? String(text).length * 180 : 0));
    };

    return {
        // who：'narrator'（預設，旁白/題目）｜'retry'（答錯鼓勵）｜角色 id（boy/girl/kid/teen）。
        speak(text, cb, who) {
            if (!window.speechSynthesis) { cb?.(); return; }
            who = who || 'narrator';
            // 預錄檔名：先查內建固定句表，再查外部自動產生的第二期表（含角色名的題目/安全關 × 4 角色）
            const key = ADV_AUDIO_MAP[text] || (window.ADV_AUDIO_MAP2 && window.ADV_AUDIO_MAP2[text]);
            if (key) {   // 有預錄 mp3 → 優先播；缺檔/失敗/沒觸發事件都退回即時 TTS 或推進
                this.cancel();
                const a = new Audio('audio/adv/' + key + '.mp3');
                _audio = a;
                let done = false;
                const finish = (needTts) => {
                    if (done) return; done = true;
                    _clearFb();
                    if (_audio === a) _audio = null;
                    if (needTts) _tts(text, cb, who);   // 缺檔/播放失敗 → 即時補念並推進
                    else if (cb) cb();
                };
                a.onended = () => finish(false);
                a.onerror = () => finish(true);
                a.play().catch(() => finish(true));
                _clearFb();
                _fbTimer = setTimeout(() => finish(false), 8000);   // 兜底：事件都沒來也推進
                return;
            }
            _tts(text, cb, who);
        },
        cancel() {
            _clearFb();
            if (_audio) { _audio.onended = _audio.onerror = null; try { _audio.pause(); } catch {} _audio = null; }
            window.speechSynthesis?.cancel();
            _pending = null;
        }
    };
})();

// 角色化過場短語：讓四位主角在同一段故事裡有不同反應（純文字，不影響任何數值/計分）
const ADV_QUIRK = {
    start:   { boy:'一拿到錢就迫不及待想出門，', girl:'開心地把錢收進最喜歡的錢包，',   kid:'把錢仔細數了一遍才收好，',     teen:'腦中已經開始盤算要吃什麼，' },
    shop:    { boy:'期待著裡面有新奇的零食，', girl:'想著順便看看有沒有可愛的文具，',     kid:'提醒自己要看清楚每樣的價格，', teen:'滿腦子都是最想吃的那一排，' },
    compare: { boy:'覺得找便宜的很像尋寶，',       girl:'細心地一家一家看過去，',         kid:'最愛比價，馬上認真算了起來，', teen:'想著省下的錢可以多買點吃的，' },
    save:    { boy:'越看越喜歡它',       girl:'還在筆記本上把它畫了下來',   kid:'認真想了想要花多少錢',       teen:'心裡盤算了一下價格' },
};

// ── 計時器 ────────────────────────────────────────────────────
const AdvTimer = {
    _ids: [],
    set(fn, ms) { const id = setTimeout(fn, ms); this._ids.push(id); return id; },
    clearAll() { this._ids.forEach(clearTimeout); this._ids = []; }
};

// ── 主遊戲 ────────────────────────────────────────────────────
const Adventure = {

    // ── 角色 ───────────────────────────────────────────────────
    CHARACTERS: [
        { id:'boy',  emoji:'👦', img:'images/adv-xiaoxiang.png', name:'小翔', desc:'喜歡冒險的青少年',   budgetRange:[100,150,200], quirk:'一看到新東西就躍躍欲試' },
        { id:'girl', emoji:'👧', img:'images/adv-xiaohua.png',   name:'小花', desc:'愛買文具的認真女生', budgetRange:[150,200],     quirk:'邊逛邊看有沒有喜歡的文具' },
        { id:'kid',  emoji:'🧒', img:'images/adv-xiaorui.png',   name:'小睿', desc:'節儉又細心的青少年', budgetRange:[80,100],      quirk:'仔細比了每樣的價格再決定' },
        { id:'teen', emoji:'🧑', img:'images/adv-xiaokai.png',   name:'小凱', desc:'愛吃美食的大男孩',   budgetRange:[200,250],     quirk:'眼睛直接飄向最貴那排' },
    ],

    // 角色頭像 HTML：有圖片就顯示圖片（載入失敗自動退回 Emoji），沒設 img 則直接用 Emoji
    _charFace(c) {
        if (!c) return '';
        return c.img
            ? `<img src="${c.img}" class="adv-avatar-img" alt="${c.name}" onerror="this.outerHTML='${c.emoji}'">`
            : c.emoji;
    },

    // ── 各地點主色（依關卡切換，讓「一路走過六個地點」有換場景的視覺感）──
    // m=主accent d=深色標題 b=邊框 g1/g2=背景漸層。第 1 關＝預設暖黃（同 :root）。
    LOC_THEME: {
        1: { m:'#d97706', d:'#92400e', b:'#fbbf24', g1:'#fef3c7', g2:'#fcd34d' }, // 🌅 早晨・暖黃
        2: { m:'#0284c7', d:'#075985', b:'#38bdf8', g1:'#e0f2fe', g2:'#7dd3fc' }, // 🏧 ATM・科技藍
        3: { m:'#0d9488', d:'#0f766e', b:'#5eead4', g1:'#ccfbf1', g2:'#99f6e4' }, // 🍱 超商・清新青
        4: { m:'#7c3aed', d:'#5b21b6', b:'#a78bfa', g1:'#ede9fe', g2:'#ddd6fe' }, // 💸 找零・紫
        5: { m:'#ea580c', d:'#9a3412', b:'#fb923c', g1:'#ffedd5', g2:'#fed7aa' }, // 🏷️ 比價・橘
        6: { m:'#4f46e5', d:'#3730a3', b:'#a5b4fc', g1:'#e0e7ff', g2:'#c7d2fe' }, // 🛡️ 安全・靛藍
        7: { m:'#db2777', d:'#9d174d', b:'#f472b6', g1:'#fce7f3', g2:'#fbcfe8' }, // 🐷 存錢・粉
    },
    _applyTheme(levelId) {
        const t = this.LOC_THEME[levelId] || this.LOC_THEME[1];
        const r = document.documentElement.style;
        r.setProperty('--loc-main',   t.m);
        r.setProperty('--loc-deep',   t.d);
        r.setProperty('--loc-border', t.b);
        r.setProperty('--loc-bg1',    t.g1);
        r.setProperty('--loc-bg2',    t.g2);
    },

    // ── 情境音效（沉浸換場＋各地點特色音；缺檔/被瀏覽器擋則靜默，不影響流程）──
    _sfx(id) {
        const el = document.getElementById(id);
        if (el) { try { el.currentTime = 0; el.play().catch(() => {}); } catch {} }
    },

    // 答對：先播角色歡呼（預錄好音質、各角色聲），接著念數字報讀（即時，因含隨機數字）
    _cheer(char, tail, cb) {
        const id = (char || this.CHARACTERS[0]).id;
        AdvSpeech.speak(ADV_YAY[id], () => AdvSpeech.speak(tail, cb, id), id);
    },

    // ── 目前學生（決定學習歷程記給誰；與 reward / dialogue / 金隊長基地共用 sp_currentStudent）──
    _loadRoster()  { try { return JSON.parse(localStorage.getItem('rewardSystemStudents') || '[]'); } catch { return []; } },
    _getCurStudent() { try { return JSON.parse(localStorage.getItem('sp_currentStudent') || 'null'); } catch { return null; } },
    _setCurStudent(stu) {
        if (stu) localStorage.setItem('sp_currentStudent', JSON.stringify({ id: stu.id, name: stu.name }));
        else localStorage.removeItem('sp_currentStudent');
        this._renderStudentBar();
    },
    _renderStudentBar() {
        const bar = document.getElementById('adv-student-bar');
        if (!bar) return;
        const cur = this._getCurStudent();
        bar.classList.toggle('guest', !cur);
        bar.innerHTML = cur
            ? `📋 學習記錄給：<span style="color:var(--loc-main)">${cur.name}</span> <button class="adv-stu-change" id="adv-stu-change">更換</button>`
            : `⚠️ 未選學生（記為訪客，老師看不到）<button class="adv-stu-change" id="adv-stu-change">選擇</button>`;
        bar.onclick = () => this._openStudentPicker();
    },
    _openStudentPicker() {
        const modal = document.getElementById('adv-stu-modal');
        const list  = document.getElementById('adv-stu-list');
        if (!modal || !list) return;
        const roster = this._loadRoster();
        const cur    = this._getCurStudent();
        if (!roster.length) {
            list.innerHTML = `<p style="color:#78350f;font-size:0.92rem;text-align:center;line-height:1.7">尚未建立學生名冊——<br>請先到主頁，找金婆婆新增學生，<br>或先以訪客身分練習。</p>`;
        } else {
            list.innerHTML = roster.map(s => `
              <button class="adv-stu-item ${cur && String(cur.id)===String(s.id) ? 'current' : ''}" data-id="${s.id}">
                <span class="adv-stu-avatar">${s.photo ? `<img src="${s.photo}" alt="">` : '🧑'}</span>
                <span>${s.name}</span>
              </button>`).join('')
              + `<button class="adv-stu-item" data-id="__guest__"><span class="adv-stu-avatar">👤</span><span style="color:#78350f">訪客（不記錄）</span></button>`;
            list.querySelectorAll('.adv-stu-item').forEach(el => el.addEventListener('click', () => {
                const id = el.dataset.id;
                if (id === '__guest__') this._setCurStudent(null);
                else { const s = roster.find(x => String(x.id) === String(id)); if (s) this._setCurStudent(s); }
                modal.hidden = true;
            }));
        }
        modal.hidden = false;
    },

    // ── 關卡（scene 為接受角色名的函數）────────────────────────
    LEVELS: [
        { id:1, title:'數一數零用錢',   skill:'C2', icon:'💰', mapLabel:'數錢',
          scene: n => `媽媽出門前，給了${n}一些零錢。` },
        { id:2, title:'去 ATM 領錢',    skill:'A5', icon:'🏧', isAtm:true, mapLabel:'ATM',
          scene: n => `${n}零錢不太夠用，決定去附近的 ATM 領錢。` },
        { id:3, title:'便利商店買餐點',  skill:'C5', icon:'🍱', mapLabel:'選餐',
          scene: n => `${n}肚子餓了，走進便利商店。` },
        { id:4, title:'結帳找零錢',     skill:'C6', icon:'💸', mapLabel:'找零',
          scene: n => `${n}拿出鈔票去付帳。` },
        { id:5, title:'路邊比一比',     skill:'B4', icon:'🏷️', mapLabel:'比價',
          scene: n => `${n}走在路上，看到四家店賣同樣的東西！` },
        { id:6, title:'回家路上要小心', skill:'安全', icon:'🛡️', mapLabel:'安全',
          scene: n => `${n}走在回家的路上，遇到了一些狀況⋯` },
        { id:7, title:'存錢買物品',     skill:'B3', icon:'🐷', mapLabel:'存錢',
          scene: n => `${n}看上了一個物品，決定每天存錢！` },
    ],

    // ── 過場文字（text 接受 char 與 storyLog）─────────────────
    TRANSITIONS: {
        1: { icon:'🌅', text: (c)       => `今天是週六早上，媽媽出門前給了${c.name}一些零用錢，說可以自己去外面逛逛！${ADV_QUIRK.start[c.id] || ''}先來數數看有多少錢吧！` },
        2: { icon:'💰', text: (c, log)  => `${c.name}把零用錢數好了！想去外面玩，這些錢好像還不太夠用，決定去附近的 ATM 再領一些錢！` },
        3: { icon:'✅', text: (c, log)  => `提款成功！${c.name}口袋裡的錢變多了！走著走著，肚子咕嚕叫了起來，${ADV_QUIRK.shop[c.id] || ''}走進了一家便利商店⋯` },
        4: { icon:'🛒', text: (c, log)  => `${c.name}挑好了想買的東西！拿著商品走向收銀台，付了錢之後，來看看能找回多少零錢⋯` },
        5: { icon:'💸', text: (c, log)  => `找回零錢了，${c.name}把錢收好繼續往前走。突然看到路邊四家店都在賣同一樣東西，價格卻不一樣！${c.name}${ADV_QUIRK.compare[c.id] || ''}準備找出最便宜的一家。` },
        6: { icon:'🏷️', text: (c, log) => `找到最便宜的那一家了！${c.name}把「多比較不吃虧」這個祕訣記在心裡，收好錢往家的方向走。傍晚的路上，卻遇到幾個要小心的狀況⋯` },
        7: { icon:'🛡️', text: (c)      => `${c.name}遇到狀況都做出聰明又安全的選擇，平安回到家！休息時看到了一樣超想買的東西，${c.name}${ADV_QUIRK.save[c.id] || ''}，決定開始存錢⋯` },
    },

    // ── 便利商店餐點（L3）────────────────────────────────────
    MEAL_TYPES: [
        {
            label:'早餐', scene: n => `${n}肚子餓了，走進便利商店買早餐。`,
            items:[
                { name:'三明治', price:35, img:'../images/c6/icon-c6-club-sandwich.png', icon:'🥪' },
                { name:'漢堡',   price:45, img:'../images/c6/icon-c6-hamburger.png',     icon:'🍔' },
                { name:'便當',   price:55, img:'../images/c6/icon-c6-bento.png',         icon:'🍱' },
                { name:'薯條',   price:30, img:'../images/c6/icon-c6-fries.png',         icon:'🍟' },
                { name:'餅乾',   price:20, img:'../images/c6/icon-c6-cookie.png',        icon:'🍪' },
                { name:'飲料',   price:25, img:'../images/c6/icon-c6-drink.png',         icon:'🥤' },
                { name:'巧克力', price:35, img:'../images/c6/icon-c6-chocolate.png',     icon:'🍫' },
                { name:'香蕉',   price:15, img:'../images/c6/icon-c6-banana.png',        icon:'🍌' },
            ]
        },
        {
            label:'午餐', scene: n => `到了中午，${n}走進便利商店挑午餐。`,
            items:[
                { name:'牛肉麵', price:65, img:'../images/c6/icon-c6-beef-noodle.png',   icon:'🍜' },
                { name:'披薩',   price:75, img:'../images/c6/icon-c6-pizza.png',         icon:'🍕' },
                { name:'便當',   price:55, img:'../images/c6/icon-c6-bento.png',         icon:'🍱' },
                { name:'薯條',   price:30, img:'../images/c6/icon-c6-fries.png',         icon:'🍟' },
                { name:'橘子',   price:20, img:'../images/c6/icon-c6-orange.png',        icon:'🍊' },
                { name:'飲料',   price:25, img:'../images/c6/icon-c6-drink.png',         icon:'🥤' },
                { name:'堅果',   price:40, img:'../images/c6/icon-c6-nuts.png',          icon:'🥜' },
                { name:'餅乾',   price:20, img:'../images/c6/icon-c6-crackers.png',      icon:'🍘' },
            ]
        },
        {
            label:'晚餐', scene: n => `傍晚了，${n}走進便利商店選晚餐。`,
            items:[
                { name:'牛肉麵', price:65, img:'../images/c6/icon-c6-beef-noodle.png',   icon:'🍜' },
                { name:'便當',   price:75, img:'../images/c6/icon-c6-bento.png',         icon:'🍱' },
                { name:'披薩',   price:70, img:'../images/c6/icon-c6-pizza.png',         icon:'🍕' },
                { name:'香蕉',   price:15, img:'../images/c6/icon-c6-banana.png',        icon:'🍌' },
                { name:'橘子',   price:20, img:'../images/c6/icon-c6-orange.png',        icon:'🍊' },
                { name:'飲料',   price:25, img:'../images/c6/icon-c6-drink.png',         icon:'🥤' },
                { name:'薯片',   price:30, img:'../images/c6/icon-c6-chips.png',         icon:'🥔' },
                { name:'堅果',   price:40, img:'../images/c6/icon-c6-nuts.png',          icon:'🥜' },
            ]
        },
    ],

    DATA: {
        L1: [
            { coins:[100,50,10,5,5,1,1],   answer:172 },
            { coins:[50,50,10,10,5,1],      answer:126 },
            { coins:[100,10,10,5,1,1,1],    answer:128 },
            { coins:[50,50,50,5,5],         answer:160 },
            { coins:[100,50,50,10,5,1],     answer:216 },
            { coins:[50,10,10,5,5,1,1],     answer:82  },
            { coins:[100,100,50,10,5],      answer:265 },
            { coins:[50,50,10,5,1,1],       answer:117 },
            { coins:[50,10,5,5,1,1],         answer:72  },
            { coins:[100,50,10,10,5],        answer:175 },
            { coins:[50,50,50,10,1,1],       answer:162 },
            { coins:[100,10,5,1,1,1],        answer:118 },
            { coins:[100,100,50,5,5],        answer:260 },
            { coins:[50,50,10,10,1],         answer:121 },
            { coins:[100,50,5,5,1],          answer:161 },
            { coins:[100,100,10,10,5,1],     answer:226 },
            { coins:[50,10,10,5,1],          answer:76  },
            { coins:[100,50,50,10,10],       answer:220 },
            { coins:[50,50,10,5,5,1,1],      answer:122 },
            { coins:[100,10,5,5,1,1,1],      answer:123 },
        ],
        L5: [
            { name:'鉛筆盒', img:'../images/b4/icon-b4-pencil-case.png', icon:'✏️',
              stores:[{name:'百貨公司',price:120},{name:'文具店',price:85},{name:'生活百貨',price:65},{name:'超市',price:90}] },
            { name:'雨傘', img:'../images/b4/icon-b4-umbrella.png', icon:'☂️',
              stores:[{name:'便利商店',price:180},{name:'百貨公司',price:250},{name:'生活百貨',price:140},{name:'藥局',price:160}] },
            { name:'保溫瓶', img:'../images/b4/icon-b4-thermos.png', icon:'🫙',
              stores:[{name:'超市',price:300},{name:'百貨公司',price:450},{name:'生活百貨',price:280},{name:'文具店',price:320}] },
            { name:'巧克力', img:'../images/c6/icon-c6-chocolate.png', icon:'🍫',
              stores:[{name:'便利商店',price:55},{name:'超市',price:42},{name:'藥局',price:48},{name:'量販店',price:38}] },
            { name:'書包', img:'../images/b4/icon-b4-backpack.png', icon:'🎒',
              stores:[{name:'百貨公司',price:580},{name:'文具店',price:420},{name:'量販店',price:380},{name:'網路商店',price:350}] },
            { name:'水壺', img:'../images/b4/icon-b4-water-bottle.png', icon:'🫗',
              stores:[{name:'超市',price:180},{name:'百貨公司',price:260},{name:'便利商店',price:220},{name:'藥局',price:195}] },
            { name:'便當盒', img:'../images/b4/icon-b4-lunchbox.png', icon:'🍱',
              stores:[{name:'生活百貨',price:120},{name:'百貨公司',price:180},{name:'量販店',price:95},{name:'超市',price:110}] },
            { name:'色鉛筆', img:'../images/b4/icon-b4-colored-pencil.png', icon:'🖍️',
              stores:[{name:'文具店',price:85},{name:'書店',price:95},{name:'量販店',price:72},{name:'便利商店',price:110}] },
            { name:'玩具車', img:'../images/b4/icon-b4-toy-car.png', icon:'🚗',
              stores:[{name:'玩具店',price:280},{name:'百貨公司',price:350},{name:'量販店',price:240},{name:'超市',price:260}] },
            { name:'筆記本', img:'../images/b4/icon-b4-notebook.png', icon:'📔',
              stores:[{name:'書店',price:65},{name:'文具店',price:55},{name:'便利商店',price:72},{name:'量販店',price:48}] },
        ],
        L6: [
            { daily:15, goal:60,  item:'橡皮擦', img:'../images/c6/icon-c6-cute-eraser.png', icon:'🍬', answer:4  },
            { daily:25, goal:100, item:'鉛筆',   img:'../images/c6/icon-c6-pencil.png',       icon:'✏️', answer:4  },
            { daily:30, goal:150, item:'漫畫書', img:'../images/c6/icon-c6-comic-book.png',   icon:'📚', answer:5  },
            { daily:15, goal:90,  item:'日記本', img:'../images/c6/icon-c6-diary.png',        icon:'📔', answer:6  },
            { daily:25, goal:75,  item:'色鉛筆', img:'../images/c6/icon-c6-colored-pen.png',  icon:'🖍️', answer:3  },
            { daily:30, goal:120, item:'尺',     img:'../images/c6/icon-c6-ruler.png',        icon:'📏', answer:4  },
            { daily:15, goal:75,  item:'玩具車', img:'../images/c6/icon-c6-toy-car.png',      icon:'🚗', answer:5  },
            { daily:20, goal:80,  item:'筆記本', img:'../images/c6/icon-c6-notebook.png',     icon:'📓', answer:4  },
            { daily:25, goal:125, item:'積木',   img:'../images/c6/icon-c6-blocks.png',       icon:'🧱', answer:5  },
            { daily:30, goal:90,  item:'故事書', img:'../images/c6/icon-c6-story-book.png',   icon:'📖', answer:3  },
            { daily:20, goal:120, item:'遙控車', img:'../images/c6/icon-c6-rc-car.png',       icon:'🚙', answer:6  },
            { daily:35, goal:140, item:'計算機', img:'../images/c6/icon-c6-calculator.png',   icon:'🧮', answer:4  },
            { daily:20, goal:100, item:'鉛筆盒', img:'../images/b4/icon-b4-pencil-case.png',  icon:'✏️', answer:5  },
            { daily:40, goal:160, item:'保溫瓶', img:'../images/b4/icon-b4-thermos.png',      icon:'🫙', answer:4  },
        ],
        // 關卡 6：金錢安全情境（回家路上）。options 標 safe，正解＝safe:true；每題三選一，隨機出題。
        SAFETY: [
            { icon:'🔑', tag:'保護密碼', hint:'密碼要保密', safeSpeak:'密碼絕對不能告訴別人！',
              scene: n => `一個陌生人靠近${n}，說「告訴我你的提款卡密碼，我幫你去領錢」。`,
              question:'這時候應該怎麼做？',
              options:[
                { text:'不可以，密碼不能告訴別人，快步離開', safe:true,  fb:'密碼只有自己知道' },
                { text:'把密碼告訴他',                     safe:false, fb:'密碼給別人，錢會被領走' },
                { text:'帶他一起去 ATM',                   safe:false, fb:'不要和陌生人去 ATM' },
              ] },
            { icon:'📱', tag:'不點可疑連結', hint:'中獎訊息是假的', safeSpeak:'不明的中獎訊息不要點！',
              scene: n => `${n}的手機收到簡訊：「恭喜中獎十萬元！快點連結領獎」。`,
              question:'這時候應該怎麼做？',
              options:[
                { text:'不點連結，拿給爸媽或老師看', safe:true,  fb:'可疑訊息先問大人' },
                { text:'馬上點連結、填自己的資料',   safe:false, fb:'點了會被騙個資和錢' },
                { text:'回撥電話給那個號碼',         safe:false, fb:'不要聯絡陌生號碼' },
              ] },
            { icon:'👛', tag:'拾金不昧', hint:'撿到錢要送警察', safeSpeak:'撿到錢要交給警察招領！',
              scene: n => `${n}在路邊撿到一個錢包，裡面有不少錢。`,
              question:'這時候應該怎麼做？',
              options:[
                { text:'交給警察或附近商店招領', safe:true,  fb:'拾金不昧是好品德' },
                { text:'把錢拿走自己用',         safe:false, fb:'撿到的錢不是自己的' },
                { text:'丟在原地不管它',         safe:false, fb:'應該幫忙送還失主' },
              ] },
            { icon:'📞', tag:'退費是詐騙', hint:'退費不用去 ATM', safeSpeak:'叫你去 ATM 退費的都是詐騙！',
              scene: n => `${n}接到電話：「你的網購訂單有問題要退費，請去 ATM 照我說的按」。`,
              question:'這時候應該怎麼做？',
              options:[
                { text:'掛掉電話，問家人或打官方客服電話', safe:true,  fb:'真的退費不會叫你去 ATM' },
                { text:'照對方說的去 ATM 操作',           safe:false, fb:'這樣會把錢轉給詐騙集團' },
                { text:'把銀行帳號和密碼告訴他',           safe:false, fb:'帳號密碼不能給別人' },
              ] },
            { icon:'🏧', tag:'ATM 自保', hint:'不讓陌生人靠近', safeSpeak:'在 ATM 不要讓陌生人靠近！',
              scene: n => `${n}正要用路邊的 ATM，一個陌生人說「我來教你領錢」，想靠得很近。`,
              question:'這時候應該怎麼做？',
              options:[
                { text:'婉拒他，請他離開或找店員幫忙', safe:true,  fb:'操作 ATM 要保持距離' },
                { text:'讓他靠過來幫忙操作',           safe:false, fb:'陌生人可能偷看或偷卡' },
                { text:'把提款卡交給他',               safe:false, fb:'卡片不能交給別人' },
              ] },
        ],
    },

    _l3Result: null,
    _storyLog: {},
    state: { level:0, score:0, mistakes:0, startTime:null, char:null, easy:false, levelMiss:{} },
    _easyMode: false,   // 設定頁選的難度（開始遊戲時複製到 state.easy）

    // ── init ────────────────────────────────────────────────────
    init() {
        const p = new URLSearchParams(location.search);
        const resume = parseInt(p.get('resume') || '0');
        if (resume > 0) {
            const saved = JSON.parse(sessionStorage.getItem('adv_state') || 'null');
            if (saved) {
                Object.assign(this.state, saved);
                if (saved.charId) {
                    this.state.char = this.CHARACTERS.find(c => c.id === saved.charId) || this.CHARACTERS[0];
                }
                if (saved.storyLog) this._storyLog = saved.storyLog;
                if (saved.atmTarget) this._storyLog.l2Amount = saved.atmTarget;
            }
            this.state.char = this.state.char || this.CHARACTERS[0];
            this.state.score++;
            this.state.level = resume;
            sessionStorage.removeItem('adv_state');
            history.replaceState(null, '', location.pathname);
            this._renderLevel();
        } else {
            this.showSettings();
        }
    },

    // ── 設定頁（含選角）────────────────────────────────────────
    showSettings() {
        AdvTimer.clearAll(); AdvSpeech.cancel();
        this._applyTheme(1);   // 設定頁回到預設暖黃
        { const nav = document.querySelector('.site-nav'); if (nav) nav.style.display = ''; }   // 首頁顯示導覽列
        Object.assign(this.state, { level:0, score:0, mistakes:0, startTime:null, char:null, levelMiss:{} });
        this._l3Result = null;
        this._storyLog = {};

        const charGrid = this.CHARACTERS.map((c, i) => `
            <div class="adv-char-opt ${i===0?'selected':''}" data-id="${c.id}" tabindex="0" role="button" aria-label="${c.name}">
                <div class="adv-co-circle">${this._charFace(c)}</div>
                <div class="adv-co-name">${c.name}</div>
            </div>`).join('');

        document.getElementById('app').innerHTML = `
<div class="adv-settings">
  <div class="adv-settings-card">
    <div class="adv-logo">🗺️</div>
    <h1 class="adv-title">一日金錢冒險</h1>
    <p class="adv-sub">選擇喜歡的角色 體驗有趣的金錢故事！</p>
    <div class="adv-student-bar" id="adv-student-bar"></div>
    <div class="adv-section-lbl">選擇角色</div>
    <div class="adv-char-grid">${charGrid}</div>
    <div class="adv-section-lbl">今天的冒險</div>
    <div class="adv-preview">
      ${this.LEVELS.map((l,i)=>`
      <div class="adv-chip">
        <span class="adv-chip-num">${i+1}</span>
        <span class="adv-chip-icon">${l.icon}</span>
        <span class="adv-chip-title">${l.title}</span>
      </div>`).join('')}
    </div>
    <div class="adv-section-lbl">難度</div>
    <div class="adv-diff-row" id="adv-diff-row">
      <button class="adv-diff-btn ${this._easyMode ? '' : 'active'}" data-easy="0">😊 普通</button>
      <button class="adv-diff-btn ${this._easyMode ? 'active' : ''}" data-easy="1">🌱 簡單（計算機常開）</button>
    </div>
    <div class="adv-btn-row" style="justify-content:center">
      <button class="adv-start-btn" id="adv-start" style="flex:0 1 auto; min-width:240px">開始冒險！</button>
    </div>
  </div>
  <div class="adv-char-modal" id="adv-char-modal" hidden role="dialog" aria-modal="true">
    <div class="adv-cm-backdrop" id="adv-cm-backdrop"></div>
    <div class="adv-cm-card">
      <button class="adv-cm-close" id="adv-cm-close" aria-label="關閉">✕</button>
      <div class="adv-cm-circle" id="adv-cm-avatar"></div>
      <div class="adv-cm-name" id="adv-cm-name"></div>
      <div class="adv-cm-desc" id="adv-cm-desc"></div>
      <button class="adv-start-btn" id="adv-cm-select">選這位角色</button>
    </div>
  </div>
  <div class="adv-char-modal" id="adv-stu-modal" hidden role="dialog" aria-modal="true">
    <div class="adv-cm-backdrop" id="adv-stu-backdrop"></div>
    <div class="adv-cm-card" style="max-width:340px;text-align:left">
      <button class="adv-cm-close" id="adv-stu-close" aria-label="關閉">✕</button>
      <div class="adv-cm-name" style="text-align:center;margin-bottom:14px">選擇學生（記錄學習歷程）</div>
      <div id="adv-stu-list" style="display:flex;flex-direction:column;gap:8px;max-height:56vh;overflow-y:auto"></div>
      <p style="font-size:0.74rem;color:#78350f;margin:12px 0 0;text-align:center">新增學生，請至主頁，找金婆婆。</p>
    </div>
  </div>
</div>`;

        this._renderStudentBar();
        {
            const stuModal = document.getElementById('adv-stu-modal');
            const hide = () => { stuModal.hidden = true; };
            document.getElementById('adv-stu-close').addEventListener('click', hide);
            document.getElementById('adv-stu-backdrop').addEventListener('click', hide);
        }

        // 點角色圓圈 → 出現詳情彈窗；彈窗「選這位」才套用選取
        const self = this;
        const charModal = document.getElementById('adv-char-modal');
        let _popupId = null;
        const openCharModal = (c) => {
            _popupId = c.id;
            document.getElementById('adv-cm-avatar').innerHTML = self._charFace(c);
            document.getElementById('adv-cm-name').textContent = c.name;
            document.getElementById('adv-cm-desc').textContent = c.desc;
            charModal.hidden = false;
            AdvSpeech.speak(ADV_HELLO[c.id] || `${c.name}，${c.desc}`, null, c.id);
        };
        const closeCharModal = () => { charModal.hidden = true; _popupId = null; };
        document.querySelectorAll('.adv-char-opt').forEach(el => {
            const c = self.CHARACTERS.find(x => x.id === el.dataset.id);
            const open = () => { openCharModal(c); window.gameAudio?.play('game-btn-click'); };
            el.addEventListener('click', open);
            el.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
            });
        });
        document.getElementById('adv-cm-close').addEventListener('click', closeCharModal);
        document.getElementById('adv-cm-backdrop').addEventListener('click', closeCharModal);
        document.getElementById('adv-cm-select').addEventListener('click', () => {
            if (_popupId) {
                document.querySelectorAll('.adv-char-opt').forEach(e =>
                    e.classList.toggle('selected', e.dataset.id === _popupId));
            }
            closeCharModal();
            window.gameAudio?.play('game-btn-click');
        });

        // 難度切換：普通／簡單（簡單＝計算機預設展開，並記錄 difficulty 給教師歷程）
        document.querySelectorAll('.adv-diff-btn').forEach(btn => btn.addEventListener('click', () => {
            this._easyMode = btn.dataset.easy === '1';
            document.querySelectorAll('.adv-diff-btn').forEach(b =>
                b.classList.toggle('active', b === btn));
            window.gameAudio?.play('game-btn-click');
        }));

        document.getElementById('adv-start').addEventListener('click', () => {
            const sel = document.querySelector('.adv-char-opt.selected');
            const charId = sel?.dataset.id || 'boy';
            this.state.char = this.CHARACTERS.find(c => c.id === charId) || this.CHARACTERS[0];
            AdvSpeech.speak('開始冒險！');
            AdvTimer.set(() => this._startGame(), 700);
        });
        AdvSpeech.speak('一日金錢冒險！選好角色，和我一起學習用錢吧！');
    },

    _startGame() {
        { const nav = document.querySelector('.site-nav'); if (nav) nav.style.display = 'none'; }   // 進入練習隱藏導覽列
        this.state.level    = 1;
        this.state.score    = 0;
        this.state.mistakes = 0;
        this.state.levelMiss = {};   // 每關錯誤數（供結算「統整診斷」）
        this.state.easy     = !!this._easyMode;   // 簡單模式：計算機常開＋歷程記 difficulty=easy
        this.state.startTime = Date.now();
        this._renderLevel();
    },

    // ── 旅程地圖 + 標題列 helpers ───────────────────────────────
    _mapHTML() {
        const n = this.state.level;
        const steps = [
            { icon:'🏠', label:'出發' },
            ...this.LEVELS.map(l => ({ icon: l.icon, label: l.mapLabel })),
            { icon:'🏆', label:'完成' },
        ];
        let html = '<div class="adv-journey-map">';
        steps.forEach((s, i) => {
            if (i > 0) html += `<div class="adv-jm-line${i <= n ? ' done' : ''}"></div>`;
            const cls = i === 0 ? 'done' : i < n ? 'done' : i === n ? 'current' : 'future';
            const dot = (i > 0 && i < n) ? '✓' : s.icon;
            html += `<div class="adv-jm-node ${cls}"><div class="adv-jm-dot">${dot}</div><div class="adv-jm-lbl">${s.label}</div></div>`;
        });
        return html + '</div>';
    },

    _topbarHTML(hasBack = true) {
        const char = this.state.char || this.CHARACTERS[0];
        const back = hasBack
            ? '<button class="adv-back-btn" id="adv-back">← 返回</button>'
            : '<div style="width:56px;flex-shrink:0;"></div>';
        return `<div class="adv-topbar">${back}${this._mapHTML()}<div class="adv-char-badge" title="${char.name}">${this._charFace(char)}</div></div>`;
    },

    // ── 關卡路由 ────────────────────────────────────────────────
    _renderLevel() {
        AdvTimer.clearAll(); AdvSpeech.cancel();
        const n = this.state.level;
        this._applyTheme(n);   // 過場與本關共用該地點主色
        const t = this.TRANSITIONS[n];
        if (t) {
            this._showTransition(t, () => this._doRenderLevel(n));
        } else {
            this._doRenderLevel(n);
        }
    },

    _doRenderLevel(n) {
        if      (n === 1) this._level1();
        else if (n === 2) this._levelAtm();
        else if (n === 3) this._level3();
        else if (n === 4) this._level4();
        else if (n === 5) this._level5();
        else if (n === 6) this._levelSafety();
        else if (n === 7) this._level6();
        else              this._victory();
    },

    _showTransition({ icon, text }, cb) {
        const char = this.state.char || this.CHARACTERS[0];
        const textStr = text(char, this._storyLog);
        document.getElementById('app').innerHTML = `
<div class="adv-transition">
  <div class="adv-trans-card">
    <div class="adv-trans-body">
      <div class="adv-trans-char">${this._charFace(char)}</div>
      <div class="adv-trans-info">
        <div class="adv-trans-icon">${icon}</div>
        <p class="adv-trans-text">${textStr}</p>
      </div>
    </div>
    <button class="adv-trans-btn" id="adv-trans-next">繼續 →</button>
  </div>
</div>`;
        let gone = false;
        const proceed = () => {
            if (gone) return;
            gone = true;
            AdvTimer.clearAll();
            AdvSpeech.cancel();
            cb();
        };
        document.getElementById('adv-trans-next').addEventListener('click', proceed);
        this._sfx('adv-sfx-warp');
        AdvSpeech.speak(textStr);   // 只自動播語音、停在本頁；前進交給「繼續」按鈕，不自動跳頁
    },

    // ── 共用框架（多選題關卡用）────────────────────────────────
    _frame(contentHTML, question, choices) {
        const lv    = this.LEVELS[this.state.level - 1];
        const total = this.LEVELS.length;
        const char  = this.state.char || this.CHARACTERS[0];

        document.getElementById('app').innerHTML = `
<div class="adv-game">
  ${this._topbarHTML()}
  <div class="adv-card">
    <div class="adv-card-hdr">
      <span class="adv-card-icon">${lv.icon}</span>
      <div class="adv-card-info">
        <div class="adv-card-title">${lv.title}</div>
        <div class="adv-card-scene">${lv.scene(char.name)}</div>
      </div>
      <button class="adv-replay-btn" id="adv-replay">🔊</button>
    </div>
    <div class="adv-content">${contentHTML}</div>
    <div class="adv-question">${question}</div>
    <div class="adv-choices${choices.length === 2 ? ' adv-choices-2' : ''}" id="adv-choices">
      ${choices.map((c,i)=>`<button class="adv-choice-btn" data-i="${i}">${c.label}</button>`).join('')}
    </div>
    <div class="adv-feedback" id="adv-fb"></div>
  </div>
</div>`;

        document.getElementById('adv-back').addEventListener('click', () => {
            if (confirm('確定返回設定頁？進度將不保留。')) this.showSettings();
        });
        document.querySelectorAll('.adv-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.i);
                this._onChoice(choices[idx], idx, choices, btn);
            });
        });
        return choices;
    },

    _lock() { document.querySelectorAll('.adv-choice-btn').forEach(b => b.disabled = true); },

    _correct(btn, speech) {
        this._lock();
        btn.classList.add('adv-ok');
        const fb = document.getElementById('adv-fb');
        if (fb) { fb.textContent = '✅ 答對了！'; fb.className = 'adv-feedback adv-fb-ok'; }
        this.state.score++;
        document.getElementById('correct-sound')?.play();
        if (typeof confetti === 'function') {
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
        }
        AdvSpeech.speak(speech, () => AdvTimer.set(() => {
            this.state.level++;
            this._renderLevel();
        }, 500), (this.state.char || this.CHARACTERS[0]).id);
    },

    _wrong(btn, correctBtn, speech, hint) {
        this._lock();
        btn.classList.add('adv-ng');
        if (correctBtn) correctBtn.classList.add('adv-ok');
        this._miss();
        document.getElementById('error-sound')?.play();
        const fb = document.getElementById('adv-fb');
        if (fb) {
            fb.innerHTML = `❌ 再想想！${hint ? `<span class="adv-hint"> ${hint}</span>` : ''}`;
            fb.className = 'adv-feedback adv-fb-ng';
        }
        AdvSpeech.speak(speech, () => AdvTimer.set(() => {
            document.querySelectorAll('.adv-choice-btn').forEach(b => {
                b.disabled = false;
                b.classList.remove('adv-ok', 'adv-ng');
            });
            if (fb) { fb.textContent = ''; fb.className = 'adv-feedback'; }
        }, 800), 'retry');
    },

    _makeChoices(answer, dists) {
        const pool = [...new Set(dists.filter(d => d > 0 && d !== answer))].slice(0, 3);
        let off = 1;
        while (pool.length < 3) {
            const v = answer + off * (answer > 10 ? 5 : 1);
            if (!pool.includes(v) && v > 0) pool.push(v);
            off++;
        }
        return [answer, ...pool]
            .sort(() => Math.random() - 0.5)
            .map(v => ({ label: String(v), value: v }));
    },

    _btn(idx) { return document.querySelector(`.adv-choice-btn[data-i="${idx}"]`); },

    _walletToDisplay(amount) {
        const denoms = [500, 100, 50, 10, 5, 1];
        const result = [];
        let rem = amount;
        for (const d of denoms) {
            const cnt = Math.floor(rem / d);
            if (cnt > 0) {
                for (let i = 0; i < Math.min(cnt, 4); i++) result.push(d);
                rem -= d * cnt;
            }
        }
        return result;
    },

    // 記一次答錯：累加全域 mistakes 與「當前關」錯誤數（供結算的統整診斷用）
    _miss() {
        this.state.mistakes++;
        const L = this.state.level;
        this.state.levelMiss[L] = (this.state.levelMiss[L] || 0) + 1;
    },

    _getPerf(score, elapsed) {
        const fast = elapsed <= 240;
        if (score >= 8 && fast) return { icon:'🌟', label:'金錢天才' };
        if (score >= 8)         return { icon:'🏆', label:'完美通關' };
        if (score >= 6 && fast) return { icon:'⚡', label:'快手玩家' };
        if (score >= 6)         return { icon:'⭐', label:'認真完成' };
        return { icon:'💪', label:'繼續練習' };
    },

    _buildRecap(char) {
        const log = this._storyLog;
        if (!Object.keys(log).length) return '';
        const items = [];
        if (log.l1Amount) {
            items.push({ icon:'💰', html:`數了媽媽給的零用錢，共有 <strong>${log.l1Amount}</strong> 元`, plain:`數了媽媽給的零用錢，共有${log.l1Amount}元` });
        }
        if (log.l2Amount) {
            const pocket = (log.l1Amount || 0) + log.l2Amount;
            items.push({ icon:'🏧', html:`去 ATM 領了 <strong>${log.l2Amount}</strong> 元，口袋共有 <strong>${pocket}</strong> 元`, plain:`去ATM領了${log.l2Amount}元，口袋共有${pocket}元` });
        }
        if (log.l3Items) {
            items.push({ icon:'🍱', html:`走進便利商店買了${log.l3Items}，共花 <strong>${log.l3Spent}</strong> 元`, plain:`走進便利商店買了${log.l3Items}，共花${log.l3Spent}元` });
        }
        if (log.l4Change !== undefined) {
            items.push(log.l4Change > 0
                ? { icon:'💸', html:`結帳找回 <strong>${log.l4Change}</strong> 元零錢`,   plain:`結帳找回${log.l4Change}元零錢` }
                : { icon:'💸', html:`結帳剛好用完，不用找零！`, plain:`結帳剛好用完，不用找零` });
        }
        if (log.l5Store) {
            items.push({ icon:'🏷️', html:`發現在 <strong>${log.l5Store}</strong> 買${log.l5Item}最便宜！`, plain:`發現在${log.l5Store}買${log.l5Item}最便宜` });
        }
        if (log.lSafeTag) {
            items.push({ icon:'🛡️', html:`回家路上遇到狀況，做出安全的選擇（<strong>${log.lSafeTag}</strong>）`, plain:`回家路上遇到狀況，做出安全的選擇，${log.lSafeTag}` });
        }
        if (log.l6Item) {
            items.push({ icon:'🐷', html:`決定每天存錢，再 <strong>${log.l6Days}</strong> 天就能買到${log.l6Item}！`, plain:`決定每天存錢，再${log.l6Days}天就能買到${log.l6Item}` });
        }
        if (!items.length) return '';
        this._recapText = `${char.name}今天的故事。` + items.map(i => i.plain).join('。') + '。';
        return `
        <div style="width:100%;background:rgba(255,255,255,0.7);border:2px solid #fbbf24;border-radius:16px;padding:14px 18px;margin-bottom:16px;text-align:left;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <div style="font-size:0.85rem;font-weight:800;color:#b45309;">📖 ${char.name}今天的故事</div>
            <button id="adv-recap-speak" style="background:none;border:1.5px solid #fbbf24;border-radius:8px;padding:3px 8px;cursor:pointer;font-size:1rem;" title="朗讀故事">🔊</button>
          </div>
          ${items.map(i => `<div style="display:flex;align-items:baseline;gap:6px;font-size:0.88rem;color:#78350f;padding:5px 0;border-bottom:1px dashed #fde68a;line-height:1.6;"><span>${i.icon}</span><span>${i.html}</span></div>`).join('')}
        </div>`;
    },

    // 金錢圖片：隨機正面或反面
    _moneyImg(value, size) {
        const face = Math.random() < 0.5 ? 'front' : 'back';
        return `<img src="../images/money/${value}_yuan_${face}.png" alt="${value}元"
            style="width:${size};height:${size};object-fit:contain;"
            onerror="this.outerHTML='<span class=adv-fallback-coin>${value}</span>'">`;
    },

    // ── 數字鍵盤彈窗 ──────────────────────────────────────────
    _advNumpadOpen(currentVal, onConfirm) {
        document.getElementById('adv-np-overlay')?.remove();
        const ov = document.createElement('div');
        ov.id = 'adv-np-overlay';
        ov.className = 'adv-np-overlay';
        let val = String(currentVal || '');
        ov.innerHTML = `
            <div class="adv-np-popup">
                <button class="adv-np-close">✕</button>
                <div class="adv-np-disp">${val || '0'}</div>
                <div class="adv-np-grid">
                    ${[7,8,9,4,5,6,1,2,3,'←',0,'清除'].map(k=>
                        `<button class="adv-np-key" data-k="${k}">${k}</button>`
                    ).join('')}
                </div>
                <button class="adv-np-ok-btn">確認</button>
            </div>`;
        document.body.appendChild(ov);
        const disp = ov.querySelector('.adv-np-disp');
        const close = () => ov.remove();
        ov.querySelector('.adv-np-close').addEventListener('click', close);
        ov.addEventListener('click', e => { if (e.target === ov) close(); });
        ov.querySelectorAll('.adv-np-key').forEach(btn => {
            btn.addEventListener('click', () => {
                const k = btn.dataset.k;
                if (k === '←') { val = val.slice(0,-1); }
                else if (k === '清除') { val = ''; }
                else { if (val.length < 5) val += k; }
                disp.textContent = val || '0';
            });
        });
        ov.querySelector('.adv-np-ok-btn').addEventListener('click', () => { ov.remove(); onConfirm(val); });
    },

    // ── 計算機 HTML ───────────────────────────────────────────
    _advCalcHTML() {
        return `
            <div class="adv-calc" id="adv-calc" style="display:${this.state.easy ? 'block' : 'none'};">
                <div class="adv-calc-expr" id="adv-calc-expr"></div>
                <div class="adv-calc-disp" id="adv-calc-disp">0</div>
                <div class="adv-calc-grid">
                    <button class="adv-cb" data-v="7">7</button>
                    <button class="adv-cb" data-v="8">8</button>
                    <button class="adv-cb" data-v="9">9</button>
                    <button class="adv-cb op" data-v="÷">÷</button>
                    <button class="adv-cb" data-v="4">4</button>
                    <button class="adv-cb" data-v="5">5</button>
                    <button class="adv-cb" data-v="6">6</button>
                    <button class="adv-cb op" data-v="×">×</button>
                    <button class="adv-cb" data-v="1">1</button>
                    <button class="adv-cb" data-v="2">2</button>
                    <button class="adv-cb" data-v="3">3</button>
                    <button class="adv-cb op" data-v="-">−</button>
                    <button class="adv-cb" data-v="0">0</button>
                    <button class="adv-cb sp" data-v="C">C</button>
                    <button class="adv-cb eq" data-v="=">=</button>
                    <button class="adv-cb op" data-v="+">+</button>
                </div>
            </div>`;
    },

    _advCalcBind() {
        const calcEl = document.getElementById('adv-calc');
        const toggle = document.getElementById('adv-calc-toggle');
        if (!calcEl || !toggle) return;
        toggle.addEventListener('click', () => {
            calcEl.style.display = calcEl.style.display !== 'none' ? 'none' : 'block';
        });
        const dEl = document.getElementById('adv-calc-disp');
        const eEl = document.getElementById('adv-calc-expr');
        let S = { v:'0', prev:null, op:null, wait:false, expr:'' };
        const upd = () => { dEl.textContent = S.v; eEl.textContent = S.expr; };
        const ops = { '+': (a,b)=>a+b, '-': (a,b)=>a-b, '×': (a,b)=>a*b, '÷': (a,b)=>b?a/b:0 };
        calcEl.querySelectorAll('.adv-cb').forEach(btn => {
            btn.addEventListener('click', () => {
                const v = btn.dataset.v;
                if (v === 'C') { S = { v:'0', prev:null, op:null, wait:false, expr:'' }; }
                else if (v === '←') { S.v = S.v.length > 1 ? S.v.slice(0,-1) : '0'; }
                else if ('0123456789.'.includes(v)) {
                    if (v === '.' && S.v.includes('.')) {}
                    else S.v = (S.wait || S.v === '0') ? v : S.v + v;
                    S.wait = false;
                } else if (v === '=') {
                    if (S.op && S.prev !== null) {
                        const r = ops[S.op]?.(S.prev, parseFloat(S.v)) ?? parseFloat(S.v);
                        S.v = String(Number.isInteger(r) ? r : parseFloat(r.toFixed(4)));
                        S.prev = null; S.op = null; S.expr = ''; S.wait = true;
                    }
                } else {
                    S.prev = parseFloat(S.v); S.op = v;
                    S.expr = `${S.v} ${v}`; S.wait = true;
                }
                upd();
            });
        });
    },

    // ── 關卡 1：數零錢 ─────────────────────────────────────────
    _level1() {
        const d    = this.DATA.L1[Math.floor(Math.random() * this.DATA.L1.length)];
        const lv   = this.LEVELS[0];
        const char = this.state.char || this.CHARACTERS[0];

        const coinsHTML = d.coins.map(c =>
            this._moneyImg(c, c >= 100 ? '88px' : '48px')
        ).join('');

        document.getElementById('app').innerHTML = `
<div class="adv-game">
  ${this._topbarHTML()}
  <div class="adv-card">
    <div class="adv-card-hdr">
      <span class="adv-card-icon">${lv.icon}</span>
      <div class="adv-card-info">
        <div class="adv-card-title">${lv.title}</div>
        <div class="adv-card-scene">${lv.scene(char.name)}</div>
      </div>
      <button class="adv-replay-btn" id="adv-replay">🔊</button>
    </div>
    <div class="adv-content">
      <div class="adv-coins">${coinsHTML}</div>
    </div>
    <div class="adv-question">這些零錢加起來是多少元？</div>
    <div class="adv-formula-row" style="justify-content:center;">
      <div class="adv-ans-display" id="adv-ans-display">點擊輸入金額</div>
      <span class="adv-fml-unit">元</span>
    </div>
    <div class="adv-feedback" id="adv-fb"></div>
    <button class="adv-confirm-btn" id="adv-confirm" disabled>確認答案</button>
  </div>
</div>`;

        let entered = '', submitted = false;
        const display    = document.getElementById('adv-ans-display');
        const confirmBtn = document.getElementById('adv-confirm');

        display.addEventListener('click', () => {
            if (submitted) return;
            this._advNumpadOpen(entered, val => {
                entered = val;
                display.textContent = val || '點擊輸入金額';
                display.classList.remove('adv-input-ok', 'adv-input-ng');
                confirmBtn.disabled = !val;
            });
        });

        confirmBtn.addEventListener('click', () => {
            if (submitted || !entered) return;
            const val = parseInt(entered, 10);
            const fb  = document.getElementById('adv-fb');
            if (val === d.answer) {
                submitted = true;
                this._storyLog.l1Amount = d.answer;
                display.textContent = entered;
                display.classList.add('adv-input-ok');
                if (fb) { fb.textContent = '✅ 答對了！'; fb.className = 'adv-feedback adv-fb-ok'; }
                this.state.score++;
                document.getElementById('correct-sound')?.play();
                if (typeof confetti === 'function') confetti({ particleCount:60, spread:70, origin:{y:0.6}, zIndex:9999 });
                this._cheer(char, `共有${d.answer}元！`, () => AdvTimer.set(() => {
                    this.state.level++;
                    this._renderLevel();
                }, 500));
            } else {
                this._miss();
                document.getElementById('error-sound')?.play();
                display.classList.add('adv-input-ng');
                if (fb) { fb.innerHTML = '❌ 再算算！<span class="adv-hint"> 把每一枚硬幣加起來</span>'; fb.className = 'adv-feedback adv-fb-ng'; }
                AdvSpeech.speak('不對喔，再數一次！', () => AdvTimer.set(() => {
                    entered = '';
                    display.textContent = '點擊輸入金額';
                    display.classList.remove('adv-input-ok', 'adv-input-ng');
                    confirmBtn.disabled = true;
                    if (fb) { fb.textContent = ''; fb.className = 'adv-feedback'; }
                }, 800), 'retry');
            }
        });

        document.getElementById('adv-back').addEventListener('click', () => {
            if (confirm('確定返回設定頁？進度將不保留。')) this.showSettings();
        });
        document.getElementById('adv-replay')?.addEventListener('click', () =>
            AdvSpeech.speak('這些零錢加起來是多少元？'));
        AdvTimer.set(() => AdvSpeech.speak(`${lv.scene(char.name)}這些零錢加起來是多少元？`), 300);
    },

    // ── 關卡 2：ATM ────────────────────────────────────────────
    _levelAtm() {
        const lv    = this.LEVELS[1];
        const total = this.LEVELS.length;
        const char  = this.state.char || this.CHARACTERS[0];
        const _hun  = [1,2,3,4,5,6,7,8,9];
        const atmTarget = _hun[Math.floor(Math.random() * _hun.length)] * 100;
        const atmUrl = `../html/a5_atm_simulator.html?adv=1&diff=hard&resume=3&target=${atmTarget}`;

        document.getElementById('app').innerHTML = `
<div class="adv-game">
  ${this._topbarHTML(false)}
  <div class="adv-card">
    <div class="adv-card-hdr">
      <span class="adv-card-icon">${lv.icon}</span>
      <div class="adv-card-info">
        <div class="adv-card-title">${lv.title}</div>
        <div class="adv-card-scene">${lv.scene(char.name)}</div>
      </div>
      <button class="adv-replay-btn" id="adv-replay">🔊</button>
    </div>
    <div class="adv-content" style="text-align:center;padding:18px 0 10px;">
      <div style="font-size:72px;line-height:1;margin-bottom:14px;">🏧</div>
      <div style="font-size:0.95rem;color:#78350f;line-height:1.7;margin-bottom:14px;">
        ${char.name}走到附近的 ATM 前，<br>需要完成一次<strong>提款任務</strong>才能繼續！
      </div>
      <div style="background:rgba(255,255,255,0.85);border:3px solid #d97706;border-radius:16px;padding:14px 20px;display:inline-block;">
        <div style="font-size:0.85rem;color:#78350f;margin-bottom:4px;">🎯 本次任務</div>
        <div style="font-size:1.8rem;font-weight:900;color:#d97706;">提領 ${atmTarget} 元</div>
      </div>
    </div>
    <div style="text-align:center;margin-top:6px;">
      <a href="${atmUrl}" id="adv-atm-go" class="adv-start-btn" style="display:inline-block;text-decoration:none;font-size:1.05rem;">
        🏧 前往 ATM 提款
      </a>
    </div>
    <div class="adv-feedback" id="adv-fb" style="margin-top:10px;"></div>
  </div>
</div>`;

        document.getElementById('adv-atm-go').addEventListener('click', () => {
            AdvSpeech.cancel();
            sessionStorage.setItem('adv_state', JSON.stringify({
                level:     this.state.level,
                score:     this.state.score,
                mistakes:  this.state.mistakes,
                startTime: this.state.startTime,
                charId:    char.id,
                storyLog:  this._storyLog,
                levelMiss: this.state.levelMiss,
                atmTarget: atmTarget,
            }));
        });
        document.getElementById('adv-replay')?.addEventListener('click', () =>
            AdvSpeech.speak(lv.scene(char.name)));
        this._sfx('adv-sfx-keypad');
        AdvTimer.set(() => AdvSpeech.speak(`${lv.scene(char.name)}請完成提款任務！`), 300);
    },

    // ── 關卡 3：便利商店選購 ────────────────────────────────────
    _level3() {
        const lv    = this.LEVELS[2];
        const total = this.LEVELS.length;
        const char  = this.state.char || this.CHARACTERS[0];
        const budgetRange = char.budgetRange;
        const budget = budgetRange[Math.floor(Math.random() * budgetRange.length)];
        const meal   = this.MEAL_TYPES[Math.floor(Math.random() * this.MEAL_TYPES.length)];
        const items  = meal.items;
        this._l3Result = null;
        let selected = [];

        const renderItems = () => {
            const spent = selected.reduce((s, i) => s + items[i].price, 0);
            document.getElementById('adv-l3-spent').textContent   = spent;
            document.getElementById('adv-l3-remain').textContent  = budget - spent;
            document.querySelectorAll('.adv-l3-item').forEach(el => {
                const i = parseInt(el.dataset.i);
                const inCart = selected.includes(i);
                el.classList.toggle('adv-l3-selected', inCart);
                el.querySelector('.adv-l3-toggle').textContent = inCart ? '−移除' : '+選取';
            });
        };

        document.getElementById('app').innerHTML = `
<div class="adv-game">
  ${this._topbarHTML()}
  <div class="adv-card adv-l3-wide">
    <div class="adv-card-hdr">
      <span class="adv-card-icon">${lv.icon}</span>
      <div class="adv-card-info">
        <div class="adv-card-title">便利商店買${meal.label}</div>
        <div class="adv-card-scene">${meal.scene(char.name)}${char.quirk ? `（${char.quirk}）` : ''}</div>
      </div>
      <button class="adv-replay-btn" id="adv-replay">🔊</button>
    </div>
    <div class="adv-content">
      <div class="adv-l3-budget-bar">
        <span>💰 預算 <strong>${budget}</strong> 元</span>
        <span>已選 <strong id="adv-l3-spent">0</strong> 元</span>
        <span>剩餘 <strong id="adv-l3-remain">${budget}</strong> 元</span>
      </div>
      <div class="adv-l3-grid">
        ${items.map((it, i) => `
        <div class="adv-l3-item" data-i="${i}">
          <img src="${it.img}" class="adv-l3-img" onerror="this.outerHTML='<span class=adv-l3-emoji>${it.icon}</span>'" alt="${it.name}">
          <div class="adv-l3-name">${it.name}</div>
          <div class="adv-l3-price">${it.price} 元</div>
          <button class="adv-l3-toggle" data-i="${i}">+選取</button>
        </div>`).join('')}
      </div>
    </div>
    <div class="adv-feedback" id="adv-fb"></div>
    <div style="display:flex;justify-content:center;margin-top:12px;">
      <button class="adv-start-btn" id="adv-l3-confirm" style="max-width:200px;width:100%;">結帳 →</button>
    </div>
  </div>
</div>`;

        document.querySelectorAll('.adv-l3-item').forEach(el => {
            el.addEventListener('click', e => {
                if (e.target.closest('.adv-l3-toggle')) return;
                const i = parseInt(el.dataset.i);
                AdvSpeech.speak(`${items[i].name}，${items[i].price}元`, null, char.id);
            });
        });

        document.querySelectorAll('.adv-l3-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const i     = parseInt(btn.dataset.i);
                const spent = selected.reduce((s, j) => s + items[j].price, 0);
                if (selected.includes(i)) {
                    selected = selected.filter(j => j !== i);
                    AdvSpeech.speak(`移除${items[i].name}`, null, char.id);
                } else {
                    if (spent + items[i].price > budget) {
                        const fb = document.getElementById('adv-fb');
                        if (fb) { fb.textContent = '⚠️ 超出預算囉！'; fb.className = 'adv-feedback adv-fb-ng'; }
                        AdvTimer.set(() => { const fb2 = document.getElementById('adv-fb'); if (fb2) { fb2.textContent=''; fb2.className='adv-feedback'; } }, 1200);
                        return;
                    }
                    selected.push(i);
                    this._sfx('adv-sfx-select');
                    AdvSpeech.speak(`選擇${items[i].name}，${items[i].price}元`, null, char.id);
                }
                renderItems();
            });
        });

        document.getElementById('adv-l3-confirm').addEventListener('click', () => {
            if (selected.length === 0) {
                const fb = document.getElementById('adv-fb');
                if (fb) { fb.textContent = `請至少選一樣${meal.label}！`; fb.className = 'adv-feedback adv-fb-ng'; }
                return;
            }
            const spent     = selected.reduce((s, i) => s + items[i].price, 0);
            const itemNames = selected.map(i => items[i].name).join('、');
            this._l3Result  = { budget, spent, paid: budget, change: budget - spent, mealLabel: meal.label };
            this._storyLog.l3Items = itemNames;
            this._storyLog.l3Spent = spent;
            this._storyLog.l3Meal  = meal.label;
            this.state.score++;
            document.getElementById('correct-sound')?.play();
            if (typeof confetti === 'function') confetti({ particleCount:60, spread:70, origin:{y:0.6}, zIndex:9999 });
            const fb = document.getElementById('adv-fb');
            if (fb) {
                const coinsHTML = this._walletToDisplay(spent).map(c => this._moneyImg(c, c >= 100 ? '44px' : '34px')).join('');
                fb.innerHTML = `✅ 共花 <strong>${spent}</strong> 元<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-top:6px;">${coinsHTML}</div>`;
                fb.className = 'adv-feedback adv-fb-ok';
            }
            this._sfx('adv-sfx-cash');
            this._cheer(char, `${char.name}選了${itemNames}，共花${spent}元！`, () =>
                AdvTimer.set(() => { this.state.level++; this._renderLevel(); }, 500));
        });

        document.getElementById('adv-back').addEventListener('click', () => {
            if (confirm('確定返回設定頁？進度將不保留。')) this.showSettings();
        });
        document.getElementById('adv-replay')?.addEventListener('click', () =>
            AdvSpeech.speak(`${char.name}有${budget}元，請幫${char.name}選${meal.label}！`));
        AdvTimer.set(() => AdvSpeech.speak(`${meal.scene(char.name)}${char.name}有${budget}元預算，幫${char.name}選想要的${meal.label}吧！`), 300);
    },

    // ── 關卡 4：結帳找零 ────────────────────────────────────────
    _level4() {
        const r         = this._l3Result || { budget:100, spent:68, paid:100, change:32, mealLabel:'早餐' };
        const paid      = r.paid, price = r.spent, change = r.change, mealLabel = r.mealLabel || '餐點';
        const lv        = this.LEVELS[3];
        const total     = this.LEVELS.length;
        const char      = this.state.char || this.CHARACTERS[0];
        let entered = '', submitted = false;

        document.getElementById('app').innerHTML = `
<div class="adv-game">
  ${this._topbarHTML()}
  <div class="adv-card">
    <div class="adv-card-hdr">
      <span class="adv-card-icon">${lv.icon}</span>
      <div class="adv-card-info">
        <div class="adv-card-title">${lv.title}</div>
        <div class="adv-card-scene">${lv.scene(char.name)}</div>
      </div>
      <button class="adv-replay-btn" id="adv-replay">🔊</button>
    </div>
    <div class="adv-content">
      <div class="adv-change">
        <div class="adv-cw-row"><span class="adv-cw-lbl">${mealLabel}合計</span><span class="adv-cw-price">${price} 元</span></div>
        <div class="adv-cw-row"><span class="adv-cw-lbl">付了多少錢</span><span class="adv-cw-paid">${paid} 元</span></div>
      </div>
    </div>
    <div class="adv-question">付了 ${paid} 元，${mealLabel}要 ${price} 元，應找回多少錢？</div>
    <div class="adv-formula-row">
      <span class="adv-fml-text">${paid} − ${price} =</span>
      <div class="adv-ans-display" id="adv-ans-display">?</div>
      <span class="adv-fml-unit">元</span>
    </div>
    <div class="adv-feedback" id="adv-fb"></div>
    <button class="adv-confirm-btn" id="adv-confirm" disabled>確認答案</button>
  </div>
  <div class="adv-calc-section">
    <button class="adv-calc-toggle-btn" id="adv-calc-toggle">🧮 計算機</button>
    ${this._advCalcHTML()}
  </div>
</div>`;

        const display    = document.getElementById('adv-ans-display');
        const confirmBtn = document.getElementById('adv-confirm');
        display.addEventListener('click', () => {
            if (submitted) return;
            this._advNumpadOpen(entered, val => {
                entered = val;
                display.textContent = val ? val + ' 元' : '?';
                display.classList.remove('adv-input-ok','adv-input-ng');
                confirmBtn.disabled = !val;
            });
        });
        confirmBtn.addEventListener('click', () => {
            if (submitted || !entered) return;
            const val = parseInt(entered, 10);
            const fb  = document.getElementById('adv-fb');
            if (val === change) {
                submitted = true;
                this._storyLog.l4Change = change;
                display.textContent = entered + ' 元'; display.classList.add('adv-input-ok');
                if (fb) { fb.textContent = '✅ 答對了！'; fb.className = 'adv-feedback adv-fb-ok'; }
                this.state.score++;
                document.getElementById('correct-sound')?.play();
                if (typeof confetti === 'function') confetti({ particleCount:60, spread:70, origin:{y:0.6}, zIndex:9999 });
                this._sfx('adv-sfx-cash');
                this._cheer(char, `${paid}減${price}，找回${change}元！`, () =>
                    AdvTimer.set(() => { this.state.level++; this._renderLevel(); }, 500));
            } else {
                this._miss();
                document.getElementById('error-sound')?.play();
                display.classList.add('adv-input-ng');
                if (fb) { fb.innerHTML = `❌ 再算算！<span class="adv-hint"> ${paid} − ${price} = ？</span>`; fb.className = 'adv-feedback adv-fb-ng'; }
                AdvSpeech.speak('再算算！', () => AdvTimer.set(() => {
                    entered = ''; display.textContent = '?';
                    display.classList.remove('adv-input-ok','adv-input-ng');
                    confirmBtn.disabled = true;
                    if (fb) { fb.textContent = ''; fb.className = 'adv-feedback'; }
                }, 800), 'retry');
            }
        });
        this._advCalcBind();
        document.getElementById('adv-back').addEventListener('click', () => {
            if (confirm('確定返回設定頁？進度將不保留。')) this.showSettings();
        });
        document.getElementById('adv-replay')?.addEventListener('click', () =>
            AdvSpeech.speak(`付了${paid}元，${mealLabel}要${price}元，應找回多少錢？`));
        AdvTimer.set(() => AdvSpeech.speak(`${lv.scene(char.name)}付了${paid}元，${mealLabel}要${price}元，應找回多少錢？`), 300);
    },

    // ── 關卡 5：比價 ────────────────────────────────────────────
    _level5() {
        const d       = this.DATA.L5[Math.floor(Math.random() * this.DATA.L5.length)];
        const stores  = [...d.stores].sort(() => Math.random() - 0.5);
        const cheapest  = stores.reduce((a, b) => a.price < b.price ? a : b);
        const expensive = stores.reduce((a, b) => a.price > b.price ? a : b);
        const diff      = expensive.price - cheapest.price;
        const char      = this.state.char || this.CHARACTERS[0];
        this._level5Phase = 1;

        const storesHTML = `<div class="adv-multi-grid">
            ${stores.map(s=>`<div class="adv-ms-store"><div class="adv-ms-name">${s.name}</div><div class="adv-ms-price">${s.price} 元</div></div>`).join('')}
        </div>`;

        const content = `
<div class="adv-cmp-center">
  <img src="${d.img}" class="adv-cmp-img" onerror="this.outerHTML='<span style=font-size:56px>${d.icon}</span>'" alt="${d.name}">
  <div class="adv-cmp-name">${d.name}</div>
</div>
${storesHTML}`;

        const choicesP1 = stores.map((s, i) => ({ label: s.name, value: i }));
        const correctI  = stores.findIndex(s => s.name === cheapest.name);

        this._frame(content, `${d.name} 在哪家商店比較便宜？`, choicesP1);
        this._onChoice = (c, idx, _, btn) => {
            if (this._level5Phase === 1) {
                if (idx === correctI) {
                    this._storyLog.l5Item  = d.name;
                    this._storyLog.l5Store = cheapest.name;
                    this.state.score++;   // 比價 Phase1（選對最便宜的店）計 1 分；與 MAX_SCORE=7 及最高徽章門檻對齊
                    this._lock();
                    btn.classList.add('adv-ok');
                    const fb = document.getElementById('adv-fb');
                    if (fb) { fb.textContent = `✅ 對！${cheapest.name}最便宜！`; fb.className = 'adv-feedback adv-fb-ok'; }
                    document.getElementById('correct-sound')?.play();
                    if (typeof confetti === 'function') confetti({ particleCount:60, spread:70, origin:{y:0.6}, zIndex:9999 });
                    this._cheer(char, `${cheapest.name}只要${cheapest.price}元！`, () =>
                        AdvTimer.set(() => this._level5Phase2(d, stores, cheapest, diff), 600));
                } else {
                    this._wrong(btn, null, '再看看！', '比比看哪個數字比較小');
                }
            }
        };
        document.getElementById('adv-replay')?.addEventListener('click', () =>
            AdvSpeech.speak(`${d.name}在哪家商店比較便宜？`));
        AdvTimer.set(() => AdvSpeech.speak(`${this.LEVELS[4].scene(char.name)}${d.name}在哪家商店比較便宜？`), 300);
    },

    _level5Phase2(d, stores, cheapest, diff) {
        this._level5Phase = 2;
        const expensive = stores.reduce((a, b) => a.price > b.price ? a : b);
        let entered = '', submitted = false;

        const qEl      = document.querySelector('.adv-question');
        const choicesEl = document.getElementById('adv-choices');
        const fb       = document.getElementById('adv-fb');
        if (qEl) qEl.textContent = `在 ${cheapest.name} 買，總共便宜了多少錢？`;
        if (fb) { fb.textContent = ''; fb.className = 'adv-feedback'; }

        if (choicesEl) {
            choicesEl.className = 'adv-l5p2-area';
            choicesEl.innerHTML = `
                <div class="adv-formula-info">
                    最貴的${expensive.name} <strong>${expensive.price}</strong> 元 −
                    ${cheapest.name} <strong>${cheapest.price}</strong> 元 =
                </div>
                <div class="adv-formula-row" style="margin-top:8px;">
                    <div class="adv-ans-display" id="adv-ans-display">?</div>
                    <span class="adv-fml-unit">元</span>
                </div>
                <button class="adv-confirm-btn" id="adv-confirm" disabled>確認答案</button>`;

            const display    = document.getElementById('adv-ans-display');
            const confirmBtn = document.getElementById('adv-confirm');
            display.addEventListener('click', () => {
                if (submitted) return;
                this._advNumpadOpen(entered, val => {
                    entered = val;
                    display.textContent = val || '?';
                    display.classList.remove('adv-input-ok','adv-input-ng');
                    confirmBtn.disabled = !val;
                });
            });
            confirmBtn.addEventListener('click', () => {
                if (submitted || !entered) return;
                const val = parseInt(entered, 10);
                if (val === diff) {
                    submitted = true;
                    display.textContent = entered; display.classList.add('adv-input-ok');
                    if (fb) { fb.textContent = '✅ 答對了！'; fb.className = 'adv-feedback adv-fb-ok'; }
                    this._correct(confirmBtn, `答對了！便宜了${diff}元！`);
                } else {
                    this._miss();
                    document.getElementById('error-sound')?.play();
                    display.classList.add('adv-input-ng');
                    if (fb) { fb.innerHTML = `❌ 再算算！<span class="adv-hint"> ${expensive.price} − ${cheapest.price} = ？</span>`; fb.className = 'adv-feedback adv-fb-ng'; }
                    AdvSpeech.speak('再算算！', () => AdvTimer.set(() => {
                        entered = ''; display.textContent = '?';
                        display.classList.remove('adv-input-ok','adv-input-ng');
                        confirmBtn.disabled = true;
                        if (fb) { fb.textContent=''; fb.className='adv-feedback'; }
                    }, 800), 'retry');
                }
            });
        }

        const gameEl = document.querySelector('.adv-game');
        if (gameEl && !document.getElementById('adv-calc')) {
            const calcSec = document.createElement('div');
            calcSec.className = 'adv-calc-section';
            calcSec.innerHTML = `<button class="adv-calc-toggle-btn" id="adv-calc-toggle">🧮 計算機</button>${this._advCalcHTML()}`;
            gameEl.appendChild(calcSec);
            this._advCalcBind();
        }

        const oldReplay = document.getElementById('adv-replay');
        if (oldReplay) {
            const newReplay = oldReplay.cloneNode(true);
            oldReplay.replaceWith(newReplay);
            newReplay.addEventListener('click', () =>
                AdvSpeech.speak(`在${cheapest.name}買，總共便宜了多少錢？`));
        }
        AdvSpeech.speak(`在${cheapest.name}買，總共便宜了多少錢？`);
    },

    // ── 關卡 6：回家路上・金錢安全（情境判斷）──────────────────
    _levelSafety() {
        const d    = this.DATA.SAFETY[Math.floor(Math.random() * this.DATA.SAFETY.length)];
        const char = this.state.char || this.CHARACTERS[0];

        // 選項洗牌（正解＝safe:true，位置隨機）
        const opts = [...d.options]
            .sort(() => Math.random() - 0.5)
            .map(o => ({ label: o.text, safe: o.safe, fb: o.fb }));

        const content = `
<div class="adv-cmp-center">
  <div style="font-size:56px;line-height:1;margin-bottom:8px;">${d.icon}</div>
  <div style="font-size:0.98rem;color:var(--loc-deep);line-height:1.7;text-align:center;max-width:460px;font-weight:600;">${d.scene(char.name)}</div>
</div>`;

        this._frame(content, d.question, opts);
        // 安全題選項文字較長，改單欄呈現
        const choicesEl = document.getElementById('adv-choices');
        if (choicesEl) choicesEl.style.gridTemplateColumns = '1fr';

        this._onChoice = (c, idx, all, btn) => {
            if (c.safe) {
                this._storyLog.lSafeTag = d.tag;
                this._lock();
                btn.classList.add('adv-ok');
                const fb = document.getElementById('adv-fb');
                if (fb) { fb.innerHTML = `✅ 做得好！${c.fb ? `<span class="adv-hint"> ${c.fb}</span>` : ''}`; fb.className = 'adv-feedback adv-fb-ok'; }
                this.state.score++;
                document.getElementById('correct-sound')?.play();
                if (typeof confetti === 'function') confetti({ particleCount:60, spread:70, origin:{y:0.6}, zIndex:9999 });
                AdvSpeech.speak(`做得好！${d.safeSpeak}`, () =>
                    AdvTimer.set(() => { this.state.level++; this._renderLevel(); }, 700), char.id);
            } else {
                const safeIdx = all.findIndex(o => o.safe);
                this._wrong(btn, safeIdx >= 0 ? this._btn(safeIdx) : null, '再想想，這樣安全嗎？', c.fb || d.hint);
            }
        };

        document.getElementById('adv-replay')?.addEventListener('click', () =>
            AdvSpeech.speak(`${d.scene(char.name)} ${d.question}`));
        AdvTimer.set(() => AdvSpeech.speak(`${d.scene(char.name)} ${d.question}`), 300);
    },

    // ── 關卡 7：存錢 ────────────────────────────────────────────
    _level6() {
        const d    = this.DATA.L6[Math.floor(Math.random() * this.DATA.L6.length)];
        const lv   = this.LEVELS[5];
        const char = this.state.char || this.CHARACTERS[0];
        let entered = '', submitted = false;

        document.getElementById('app').innerHTML = `
<div class="adv-game">
  ${this._topbarHTML()}
  <div class="adv-card">
    <div class="adv-card-hdr">
      <span class="adv-card-icon">${lv.icon}</span>
      <div class="adv-card-info">
        <div class="adv-card-title">${lv.title}</div>
        <div class="adv-card-scene">${lv.scene(char.name)}</div>
      </div>
      <button class="adv-replay-btn" id="adv-replay">🔊</button>
    </div>
    <div class="adv-content">
      <div class="adv-save">
        <div class="adv-sv-item">
          <img src="${d.img}" class="adv-item-img" onerror="this.outerHTML='<span style=font-size:56px>${d.icon}</span>'" alt="${d.item}">
          <div class="adv-sv-name">${d.item}</div>
          <div class="adv-sv-price">需要 ${d.goal} 元</div>
        </div>
        <div class="adv-sv-daily">💰 每天存 <strong>${d.daily}</strong> 元</div>
      </div>
    </div>
    <div class="adv-question">每天存 ${d.daily} 元，存到 ${d.goal} 元要幾天？</div>
    <div class="adv-formula-row">
      <span class="adv-fml-text">${d.goal} ÷ ${d.daily} =</span>
      <div class="adv-ans-display" id="adv-ans-display">?</div>
      <span class="adv-fml-unit">天</span>
    </div>
    <div class="adv-feedback" id="adv-fb"></div>
    <button class="adv-confirm-btn" id="adv-confirm" disabled>確認答案</button>
  </div>
  <div class="adv-calc-section">
    <button class="adv-calc-toggle-btn" id="adv-calc-toggle">🧮 計算機</button>
    ${this._advCalcHTML()}
  </div>
</div>`;

        const display    = document.getElementById('adv-ans-display');
        const confirmBtn = document.getElementById('adv-confirm');
        display.addEventListener('click', () => {
            if (submitted) return;
            this._advNumpadOpen(entered, val => {
                entered = val;
                display.textContent = val || '?';
                display.classList.remove('adv-input-ok','adv-input-ng');
                confirmBtn.disabled = !val;
            });
        });
        confirmBtn.addEventListener('click', () => {
            if (submitted || !entered) return;
            const val = parseInt(entered, 10);
            const fb  = document.getElementById('adv-fb');
            if (val === d.answer) {
                submitted = true;
                this._storyLog.l6Item = d.item;
                this._storyLog.l6Days = d.answer;
                display.textContent = entered; display.classList.add('adv-input-ok');
                if (fb) { fb.textContent = '✅ 答對了！'; fb.className = 'adv-feedback adv-fb-ok'; }
                this.state.score++;
                document.getElementById('correct-sound')?.play();
                if (typeof confetti === 'function') confetti({ particleCount:60, spread:70, origin:{y:0.6}, zIndex:9999 });
                this._sfx('adv-sfx-drop');
                this._cheer(char, `每天存${d.daily}元，${d.answer}天就能存到${d.goal}元！`, () =>
                    AdvTimer.set(() => { this.state.level++; this._renderLevel(); }, 500));
            } else {
                this._miss();
                document.getElementById('error-sound')?.play();
                display.classList.add('adv-input-ng');
                if (fb) { fb.innerHTML = `❌ 再算算！<span class="adv-hint"> ${d.goal} ÷ ${d.daily} = ？</span>`; fb.className = 'adv-feedback adv-fb-ng'; }
                AdvSpeech.speak('再算算！', () => AdvTimer.set(() => {
                    entered = ''; display.textContent = '?';
                    display.classList.remove('adv-input-ok','adv-input-ng');
                    confirmBtn.disabled = true;
                    if (fb) { fb.textContent = ''; fb.className = 'adv-feedback'; }
                }, 800), 'retry');
            }
        });
        this._advCalcBind();
        document.getElementById('adv-back').addEventListener('click', () => {
            if (confirm('確定返回設定頁？進度將不保留。')) this.showSettings();
        });
        document.getElementById('adv-replay')?.addEventListener('click', () =>
            AdvSpeech.speak(`每天存${d.daily}元，${d.goal}元要幾天？`));
        AdvTimer.set(() => AdvSpeech.speak(`${lv.scene(char.name)}每天存${d.daily}元，${d.goal}元的${d.item}要幾天才能存到？`), 300);
    },

    // ── 勝利畫面 ────────────────────────────────────────────────
    // 統整診斷：把七關對錯攤成「七項金錢技能」檢核，弱項（該關答錯過）給出練習對應單元的連結。
    _buildDiagnosis() {
        const SKILL_UNIT = {
            'C2':   { name:'數錢',     url:'../html/c2_money_counting.html' },
            'A5':   { name:'ATM 提款', url:'../html/a5_atm_simulator.html' },
            'C5':   { name:'算夠不夠', url:'../html/c5_sufficient_payment.html' },
            'C6':   { name:'找零',     url:'../html/c6_making_change.html' },
            'B4':   { name:'比價',     url:'../html/b4_sale_comparison.html' },
            '安全': { name:'金錢安全', url:'../dialogue/index.html' },
            'B3':   { name:'存錢',     url:'../html/b3_savings_plan.html' },
        };
        const diag = this.LEVELS.map(lv => {
            const miss = this.state.levelMiss[lv.id] || 0;
            return { icon: lv.icon, label: lv.mapLabel, skill: lv.skill, miss, ok: miss === 0 };
        });
        const weak = diag.filter(d => !d.ok);
        const cells = diag.map(d => `
            <div class="adv-diag-cell ${d.ok ? 'ok' : 'weak'}">
              <span class="adv-diag-ic">${d.icon}</span>
              <span class="adv-diag-nm">${d.label}</span>
              <span class="adv-diag-mk">${d.ok ? '✅' : '🔶'}</span>
            </div>`).join('');
        const weakHTML = weak.length
            ? `<div class="adv-diag-weak"><div class="adv-diag-wt">💪 這幾項再練一下會更棒：</div>${
                weak.map(d => { const u = SKILL_UNIT[d.skill]; return `<a class="adv-diag-link" href="${u.url}">${d.icon} 去練「${u.name}」　→</a>`; }).join('')
              }</div>`
            : `<div class="adv-diag-allok">🌟 七項金錢技能全部一次過關，太厲害了！</div>`;
        return `<div class="adv-diag"><div class="adv-diag-title">🎯 今天的七項金錢技能</div><div class="adv-diag-grid">${cells}</div>${weakHTML}</div>`;
    },

    _victory() {
        AdvTimer.clearAll();
        this._applyTheme(1);   // 慶祝畫面回到暖黃
        const elapsed  = Math.floor((Date.now() - this.state.startTime) / 1000);
        const mins     = Math.floor(elapsed / 60), secs = elapsed % 60;
        const perfect  = this.state.mistakes === 0;
        const MAX_SCORE = 8;
        const char     = this.state.char || this.CHARACTERS[0];
        const perf     = this._getPerf(this.state.score, elapsed);
        const timeStr  = (mins > 0 ? mins + '分' : '') + secs + '秒';
        const recapHTML = this._buildRecap(char);
        const diagHTML  = this._buildDiagnosis();

        // 寫入學習歷程（教師「學習歷程總覽」可見；studentId 由 tracker 自動帶目前學生）＝IEP／成效佐證
        try {
            window.LearningTracker?.save({
                unit: 'adventure', unitName: '🗺️ 一日金錢冒險（六關統整應用）', series: 'A',
                score: this.state.score, total: MAX_SCORE, difficulty: this.state.easy ? 'easy' : 'normal',
                durationSec: elapsed,
            });
        } catch (e) {}

        document.getElementById('app').innerHTML = `
<div class="adv-victory">
  <div class="adv-settings-card adv-v-card-wrap">
    <div class="adv-v-trophy">${this._charFace(char)}</div>
    <h1 class="adv-v-title">🎉 冒險完成！🎉</h1>
    <p class="adv-v-sub">${perfect ? `${char.name}零失誤！真是金錢小達人！` : `完成所有關卡，共答錯 ${this.state.mistakes} 次`}</p>
    <div class="adv-v-stats">
      <div class="adv-v-th">通關數</div>
      <div class="adv-v-th">完成時間</div>
      <div class="adv-v-th">表現</div>
      <div class="adv-v-td"><div class="adv-v-ico">⭐</div><div class="adv-v-val">${this.state.score}/${MAX_SCORE}</div></div>
      <div class="adv-v-td"><div class="adv-v-ico">⏱️</div><div class="adv-v-val">${timeStr}</div></div>
      <div class="adv-v-td"><div class="adv-v-ico">${perf.icon}</div><div class="adv-v-val">${perf.label}</div></div>
    </div>
    ${diagHTML}
    ${recapHTML}
    <button class="adv-v-btn adv-v-reward" id="adv-reward" style="width:100%;margin-bottom:10px">🎁 開啟獎勵</button>
    <div class="adv-btn-row">
      <a href="../index.html" class="adv-start-btn adv-home-btn">🏠 返回首頁</a>
      <button class="adv-start-btn" id="adv-replay2">🔄 再玩一次</button>
    </div>
  </div>
</div>`;

        document.getElementById('adv-reward').addEventListener('click', () => {
            if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
            else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
        });
        document.getElementById('adv-replay2').addEventListener('click', () => this.showSettings());
        document.getElementById('adv-recap-speak')?.addEventListener('click', () => {
            if (this._recapText) AdvSpeech.speak(this._recapText);
        });

        document.getElementById('success-sound')?.play();
        if (typeof confetti === 'function') {
            confetti({ particleCount:100, spread:70, origin:{y:0.6}, zIndex:9999 });
            AdvTimer.set(() => confetti({ particleCount:50, angle:60,  spread:55, origin:{x:0}, zIndex:9999 }), 400);
            AdvTimer.set(() => confetti({ particleCount:50, angle:120, spread:55, origin:{x:1}, zIndex:9999 }), 700);
        }
        AdvSpeech.speak(perf.label === '金錢天才' ? `哇！${char.name}是金錢天才！超厲害！` :
                        perf.label === '完美通關' ? `太棒了！${char.name}完美通關！` :
                        perf.label === '快手玩家' ? `${char.name}答得又快又好！` :
                        `冒險完成！${char.name}真棒！`, null, char.id);
    },
};

Adventure.init();
