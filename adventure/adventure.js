'use strict';

// ── 語音 ──────────────────────────────────────────────────────
const AdvSpeech = (() => {
    let _voice = null;
    let _ready = false;
    let _pending = null;
    const _load = () => {
        const vs = window.speechSynthesis?.getVoices() || [];
        if (!vs.length) return;
        _voice = vs.find(v => v.name.startsWith('Microsoft Yating')) ||
                 vs.find(v => /microsoft/i.test(v.name) && /online/i.test(v.name) && v.lang.startsWith('zh')) ||
                 vs.find(v => /google/i.test(v.name) && v.lang.startsWith('zh')) ||
                 vs.find(v => v.name.startsWith('Microsoft Hanhan')) ||
                 vs.find(v => v.name === 'Google 國語（臺灣）') ||
                 vs.find(v => v.lang === 'zh-TW') ||
                 null;
        _ready = true;
        if (_pending) { const p = _pending; _pending = null; p(); }
    };
    if (window.speechSynthesis) {
        _load();
        speechSynthesis.addEventListener('voiceschanged', _load);
    }
    return {
        speak(text, cb) {
            if (!window.speechSynthesis) { cb?.(); return; }
            const _do = () => {
                speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                u.lang = 'zh-TW'; u.rate = 0.9;
                if (_voice) u.voice = _voice;
                if (cb) u.onend = cb;
                speechSynthesis.speak(u);
            };
            if (_ready) { _do(); } else { _pending = _do; }
        },
        cancel() { window.speechSynthesis?.cancel(); _pending = null; }
    };
})();

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
        { id:6, title:'存錢買物品',     skill:'B3', icon:'🐷', mapLabel:'存錢',
          scene: n => `${n}看上了一個物品，決定每天存錢！` },
    ],

    // ── 過場文字（text 接受 char 與 storyLog）─────────────────
    TRANSITIONS: {
        1: { icon:'🌅', text: (c)       => `今天是週六早上，媽媽出門前給了${c.name}一些零用錢，說可以自己去外面逛逛！先來數數看有多少錢吧！` },
        2: { icon:'💰', text: (c, log)  => `${c.name}數好了，共有 ${log.l1Amount} 元零錢。不過想去外面玩，好像還不太夠用，決定去附近的 ATM 再領一些錢！` },
        3: { icon:'✅', text: (c, log)  => `提款成功！加上原本的 ${log.l1Amount} 元，${c.name}口袋裡現在共有 ${(log.l1Amount||0)+(log.l2Amount||0)} 元！走著走著，肚子咕嚕叫了起來，走進了一家便利商店⋯` },
        4: { icon:'🛒', text: (c, log)  => `${c.name}選了${log.l3Items}，共花 ${log.l3Spent} 元！拿著商品走向收銀台，付了錢之後，看看能找回多少零錢⋯` },
        5: { icon:'💸', text: (c, log)  => `找回了 ${log.l4Change} 元零錢，${c.name}把錢收好繼續往前走。突然看到路邊四家店都在賣同一樣東西，價格卻不一樣！` },
        6: { icon:'🏷️', text: (c, log) => `原來在${log.l5Store}買${log.l5Item}最便宜！${c.name}把這個秘訣記在心裡。傍晚回家路上，看到了一樣超想買的東西，決定開始存錢⋯` },
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
    },

    _l3Result: null,
    _storyLog: {},
    state: { level:0, score:0, mistakes:0, startTime:null, char:null },

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
        { const nav = document.querySelector('.site-nav'); if (nav) nav.style.display = ''; }   // 首頁顯示導覽列
        Object.assign(this.state, { level:0, score:0, mistakes:0, startTime:null, char:null });
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
</div>`;

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
            AdvSpeech.speak(`${c.name}，${c.desc}`);
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
        else if (n === 6) this._level6();
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
        AdvSpeech.speak(textStr, () => AdvTimer.set(proceed, 800));
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
        }, 500));
    },

    _wrong(btn, correctBtn, speech, hint) {
        this._lock();
        btn.classList.add('adv-ng');
        if (correctBtn) correctBtn.classList.add('adv-ok');
        this.state.mistakes++;
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
        }, 800));
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

    _getPerf(score, elapsed) {
        const fast = elapsed <= 180;
        if (score >= 7 && fast) return { icon:'🌟', label:'金錢天才' };
        if (score >= 7)         return { icon:'🏆', label:'完美通關' };
        if (score >= 5 && fast) return { icon:'⚡', label:'快手玩家' };
        if (score >= 5)         return { icon:'⭐', label:'認真完成' };
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
            <div class="adv-calc" id="adv-calc" style="display:none;">
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
                AdvSpeech.speak(`答對了！共有${d.answer}元！`, () => AdvTimer.set(() => {
                    this.state.level++;
                    this._renderLevel();
                }, 500));
            } else {
                this.state.mistakes++;
                document.getElementById('error-sound')?.play();
                display.classList.add('adv-input-ng');
                if (fb) { fb.innerHTML = '❌ 再算算！<span class="adv-hint"> 把每一枚硬幣加起來</span>'; fb.className = 'adv-feedback adv-fb-ng'; }
                AdvSpeech.speak('不對喔，再數一次！', () => AdvTimer.set(() => {
                    entered = '';
                    display.textContent = '點擊輸入金額';
                    display.classList.remove('adv-input-ok', 'adv-input-ng');
                    confirmBtn.disabled = true;
                    if (fb) { fb.textContent = ''; fb.className = 'adv-feedback'; }
                }, 800));
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
                atmTarget: atmTarget,
            }));
        });
        document.getElementById('adv-replay')?.addEventListener('click', () =>
            AdvSpeech.speak(lv.scene(char.name)));
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
                AdvSpeech.speak(`${items[i].name}，${items[i].price}元`);
            });
        });

        document.querySelectorAll('.adv-l3-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const i     = parseInt(btn.dataset.i);
                const spent = selected.reduce((s, j) => s + items[j].price, 0);
                if (selected.includes(i)) {
                    selected = selected.filter(j => j !== i);
                    AdvSpeech.speak(`移除${items[i].name}`);
                } else {
                    if (spent + items[i].price > budget) {
                        const fb = document.getElementById('adv-fb');
                        if (fb) { fb.textContent = '⚠️ 超出預算囉！'; fb.className = 'adv-feedback adv-fb-ng'; }
                        AdvTimer.set(() => { const fb2 = document.getElementById('adv-fb'); if (fb2) { fb2.textContent=''; fb2.className='adv-feedback'; } }, 1200);
                        return;
                    }
                    selected.push(i);
                    AdvSpeech.speak(`選擇${items[i].name}，${items[i].price}元`);
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
            AdvSpeech.speak(`太棒了！${char.name}選了${itemNames}，共花${spent}元！`, () =>
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
                AdvSpeech.speak(`答對了！${paid}減${price}，找回${change}元！`, () =>
                    AdvTimer.set(() => { this.state.level++; this._renderLevel(); }, 500));
            } else {
                this.state.mistakes++;
                document.getElementById('error-sound')?.play();
                display.classList.add('adv-input-ng');
                if (fb) { fb.innerHTML = `❌ 再算算！<span class="adv-hint"> ${paid} − ${price} = ？</span>`; fb.className = 'adv-feedback adv-fb-ng'; }
                AdvSpeech.speak('再算算！', () => AdvTimer.set(() => {
                    entered = ''; display.textContent = '?';
                    display.classList.remove('adv-input-ok','adv-input-ng');
                    confirmBtn.disabled = true;
                    if (fb) { fb.textContent = ''; fb.className = 'adv-feedback'; }
                }, 800));
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
                    this._lock();
                    btn.classList.add('adv-ok');
                    const fb = document.getElementById('adv-fb');
                    if (fb) { fb.textContent = `✅ 對！${cheapest.name}最便宜！`; fb.className = 'adv-feedback adv-fb-ok'; }
                    document.getElementById('correct-sound')?.play();
                    if (typeof confetti === 'function') confetti({ particleCount:60, spread:70, origin:{y:0.6}, zIndex:9999 });
                    AdvSpeech.speak(`答對了！${cheapest.name}只要${cheapest.price}元！`, () =>
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
                    this.state.mistakes++;
                    document.getElementById('error-sound')?.play();
                    display.classList.add('adv-input-ng');
                    if (fb) { fb.innerHTML = `❌ 再算算！<span class="adv-hint"> ${expensive.price} − ${cheapest.price} = ？</span>`; fb.className = 'adv-feedback adv-fb-ng'; }
                    AdvSpeech.speak('再算算！', () => AdvTimer.set(() => {
                        entered = ''; display.textContent = '?';
                        display.classList.remove('adv-input-ok','adv-input-ng');
                        confirmBtn.disabled = true;
                        if (fb) { fb.textContent=''; fb.className='adv-feedback'; }
                    }, 800));
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

    // ── 關卡 6：存錢 ────────────────────────────────────────────
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
                AdvSpeech.speak(`答對了！每天存${d.daily}元，${d.answer}天就能存到${d.goal}元！`, () =>
                    AdvTimer.set(() => { this.state.level++; this._renderLevel(); }, 500));
            } else {
                this.state.mistakes++;
                document.getElementById('error-sound')?.play();
                display.classList.add('adv-input-ng');
                if (fb) { fb.innerHTML = `❌ 再算算！<span class="adv-hint"> ${d.goal} ÷ ${d.daily} = ？</span>`; fb.className = 'adv-feedback adv-fb-ng'; }
                AdvSpeech.speak('再算算！', () => AdvTimer.set(() => {
                    entered = ''; display.textContent = '?';
                    display.classList.remove('adv-input-ok','adv-input-ng');
                    confirmBtn.disabled = true;
                    if (fb) { fb.textContent = ''; fb.className = 'adv-feedback'; }
                }, 800));
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
    _victory() {
        AdvTimer.clearAll();
        const elapsed  = Math.floor((Date.now() - this.state.startTime) / 1000);
        const mins     = Math.floor(elapsed / 60), secs = elapsed % 60;
        const perfect  = this.state.mistakes === 0;
        const MAX_SCORE = 7;
        const char     = this.state.char || this.CHARACTERS[0];
        const perf     = this._getPerf(this.state.score, elapsed);
        const timeStr  = (mins > 0 ? mins + '分' : '') + secs + '秒';
        const recapHTML = this._buildRecap(char);

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
                        `冒險完成！${char.name}真棒！`);
    },
};

Adventure.init();
