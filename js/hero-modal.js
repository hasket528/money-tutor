/**
 * hero-modal.js — 角色彈窗（金好聊／金隊長）的**唯一定義處**
 *
 * 🔴 為什麼要有這一支（2026-09-16 使用者實測回報）：同一個角色卡，在站台主頁與對話模組首頁
 *    各有一份自己寫的彈窗——主頁的金好聊是 660px、角色圖 300px、有動作卡與 ✕；對話模組那個是
 *    640px、角色圖 64px、沒有動作卡。老師從主頁點自訂場景進對話模組、按「上一頁」停在對話首頁，
 *    再點金好聊就得到「比較小的那個」，以為畫面壞了。
 *    **兩邊各寫一份，只要有人改其中一邊就會再漂移** → 改成兩頁載入同一支，結構上不可能不一致。
 *
 * 分工：
 *   這支負責**畫面與互動**（版型、深色、關閉、學生語音列、試聽小彈窗）——只有一份。
 *   呼叫端注入**本來就不同的東西**：學生清單從哪來、怎麼播語音、主頁額外要塞什麼內容。
 *
 * 用法：
 *   HeroModal.configure({ students, getStudentIdx, setStudentIdx, playStudentDemo,
 *                         playHeroIntro, stopVoice, heroImage, heroText });
 *   HeroModal.open('chatdog', { action: { title, desc, emoji, onClick } });   // 主頁
 *   HeroModal.open('chatdog');                                               // 對話模組（沒有動作卡）
 *   HeroModal.open('captain', { extra: <HTMLElement>, pick: {...} });        // 金隊長（主頁再塞基地內容）
 *
 * ⚠️ 樣式在 css/hero-modal.css，**不要在頁面裡另外覆寫版型**（那就是第二份定義）。
 */
(function (global) {
  'use strict';

  // 角色層級的設定（兩頁各自注入自己的實作）
  const cfg = {
    playHeroIntro: () => {},
    stopVoice: () => {},
    heroImage: () => '',
    heroText: () => '',
  };
  // 目前這次開啟用的挑選器（金好聊＝學生語音、金隊長＝名冊，資料不同但版型同一份）
  let picker = null;

  let els = null;          // { overlay, card, ... } 建好就重複使用
  let studentEls = null;
  let openHero = null;     // 目前開著的是誰

  function configure(opts) { Object.assign(cfg, opts || {}); }

  // ── 元素建構（第一次開啟時才建；兩頁的 DOM 由同一段程式產生）────────────
  function build() {
    if (els) return els;
    const overlay = document.createElement('div');
    overlay.className = 'hm-overlay';
    overlay.id = 'hero-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="hm-card" id="hero-modal-card">
        <button type="button" class="hm-close" aria-label="關閉">✕</button>
        <div class="hm-head">
          <div class="hm-avatar"><img alt=""></div>
          <div class="hm-bubble" role="button" tabindex="0" title="點我再聽一次"></div>
        </div>
        <div class="hm-slot-action"></div>
        <div class="hm-pick">
          <div class="hm-pick-title"></div>
          <p class="hm-pick-note"></p>
          <div class="hm-pick-row" role="group"></div>
        </div>
        <div class="hm-extra"></div>
      </div>
      <div class="hm-stash" hidden></div>`;
    document.body.appendChild(overlay);

    els = {
      overlay,
      card:   overlay.querySelector('.hm-card'),
      img:    overlay.querySelector('.hm-avatar img'),
      bubble: overlay.querySelector('.hm-bubble'),
      action: overlay.querySelector('.hm-slot-action'),
      pick:   overlay.querySelector('.hm-pick'),
      pickTitle: overlay.querySelector('.hm-pick-title'),
      pickNote:  overlay.querySelector('.hm-pick-note'),
      pickRow:   overlay.querySelector('.hm-pick-row'),
      extra:  overlay.querySelector('.hm-extra'),
      stash:  overlay.querySelector('.hm-stash'),
    };

    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    els.card.querySelector('.hm-close').addEventListener('click', close);
    // 點泡泡＝再聽一次（學生按不到 🔊 時的退路，也符合「點角色就會講話」的直覺）
    const replay = () => cfg.playHeroIntro(openHero);
    els.bubble.addEventListener('click', replay);
    els.bubble.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replay(); }
    });
    return els;
  }

  function buildStudent() {
    if (studentEls) return studentEls;
    const overlay = document.createElement('div');
    overlay.className = 'hm-overlay hm-overlay--student';
    overlay.id = 'hero-student-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="hm-card hm-student-card">
        <button type="button" class="hm-close" aria-label="關閉">✕</button>
        <img alt="">
        <div class="hm-student-name"></div>
        <div class="hm-student-line"></div>
        <div class="hm-student-actions">
          <button type="button" class="hm-btn hm-replay">🔊 再聽一次</button>
          <button type="button" class="hm-btn hm-btn--primary hm-ok">用這個聲音</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    studentEls = {
      overlay,
      img:  overlay.querySelector('img'),
      name: overlay.querySelector('.hm-student-name'),
      line: overlay.querySelector('.hm-student-line'),
      idx:  0,
    };
    const closeStudent = () => { cfg.stopVoice(); overlay.classList.remove('open'); };
    overlay.addEventListener('click', e => { if (e.target === overlay) closeStudent(); });
    overlay.querySelector('.hm-close').addEventListener('click', closeStudent);
    overlay.querySelector('.hm-ok').addEventListener('click', closeStudent);
    overlay.querySelector('.hm-replay').addEventListener('click', () => picker && picker.play && picker.play(studentEls.idx));
    return studentEls;
  }

  // ── 頭像挑選列（金好聊＝學生語音、金隊長＝名冊）──────────────────
  function renderPick() {
    if (!picker) return;
    const row = els.pickRow;
    row.innerHTML = '';
    const list = picker.items || [];
    const cur = typeof picker.current === 'function' ? picker.current() : picker.current;
    list.forEach((s, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hm-pick-item' + (i === cur ? ' on' : '');
      btn.setAttribute('aria-pressed', String(i === cur));
      btn.title = s.name || '';
      const face = s.image
        ? `<img src="${s.image}" alt="">`
        : `<span class="hm-pick-emoji" style="background:${s.color || '#e2e8f0'}">${s.emoji || '🙂'}</span>`;
      btn.innerHTML = face + '<span class="hm-pick-name"></span>';
      // ⚠️ 學生名稱可能是老師打的字 → textContent，不進 HTML 字串
      btn.querySelector('.hm-pick-name').textContent = s.name || '';
      const im = btn.querySelector('img');
      if (im) im.addEventListener('error', () => {
        im.replaceWith(Object.assign(document.createElement('span'),
          { className: 'hm-pick-emoji', textContent: s.emoji || '🙂' }));
      });
      btn.addEventListener('click', () => {
        picker.onPick && picker.onPick(i, s);
        // 金好聊：點頭像要能**聽到**那個聲音（四個學生的差別就在聲音）→ 開試聽小彈窗；
        // 金隊長：選的是「這次練習是誰」，沒有東西可試聽 → 選了就直接收起來（closeOnPick）。
        if (picker.closeOnPick) { close(); return; }
        renderPick();
        if (picker.preview) openStudentPreview(i);
      });
      row.appendChild(btn);
    });
  }

  function openStudentPreview(i) {
    const s = picker && (picker.items || [])[i];
    if (!s) return;
    const el = buildStudent();
    el.idx = i;
    if (s.image) { el.img.src = s.image; el.img.style.display = ''; } else { el.img.style.display = 'none'; }
    el.img.alt = s.name || '';
    el.name.textContent = s.name || '';
    el.line.textContent = s.demoText || `「你好，我是${s.name}，我要點餐。」`;
    el.overlay.classList.add('open');
    picker.play && picker.play(i);
  }

  // ── 開關 ────────────────────────────────────────
  /**
   * @param {'chatdog'|'captain'} hero
   * @param {{action?: {emoji, title, desc, onClick}, extra?: HTMLElement,
   *          pickTitle?: string, pickNote?: string, hidePick?: boolean}} [opts]
   */
  function open(hero, opts) {
    const o = opts || {};
    build();
    openHero = hero;
    els.overlay.classList.toggle('hm-captain', hero === 'captain' || hero === 'grandma');
    // ⚠️ 金婆婆的角色圖**不另外縮小**：五個角色彈窗的角色圖一律同尺寸（使用者指定，2026-09-16）
    els.img.src = cfg.heroImage(hero) || '';
    els.img.alt = hero === 'captain' ? '金隊長' : hero === 'grandma' ? '金婆婆' : '金好聊';
    els.bubble.textContent = cfg.heroText(hero) || '';

    // 動作卡（主頁才有；對話模組已經在模組裡，不需要再導一次）
    els.action.innerHTML = '';
    if (o.action) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hm-action';
      b.innerHTML = `<span style="font-size:2rem">${o.action.emoji || '🛒'}</span>
        <span class="hm-action-title"></span><span class="hm-action-desc"></span>`;
      b.querySelector('.hm-action-title').textContent = o.action.title || '';
      b.querySelector('.hm-action-desc').textContent = o.action.desc || '';
      b.addEventListener('click', () => { close(); o.action.onClick && o.action.onClick(); });
      els.action.appendChild(b);
    }

    // 頭像挑選區（沒傳 picker 就整區隱藏）
    picker = o.picker || null;
    els.pick.hidden = !picker;
    if (picker) {
      els.pickTitle.textContent = picker.title || '';
      els.pickNote.textContent = picker.note || '';
      els.pickNote.hidden = !picker.note;
      renderPick();
    }

    // 呼叫端的額外內容（主頁成長基地：建立學生、任務、備份…）
    // 🔴 那是**呼叫端的節點**，不是元件的：換角色時收進隱藏的暫存區，不可以 innerHTML='' 清掉。
    //    清掉＝節點脫離文件，呼叫端下次 getElementById 找不到 → 先開過金好聊，
    //    再開金隊長／金婆婆就只剩角色圖、沒有輸入欄（2026-09-16 使用者回報「有時是較小的視窗」）。
    while (els.extra.firstChild) els.stash.appendChild(els.extra.firstChild);
    if (o.extra) els.extra.appendChild(o.extra);

    els.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    // 讓點擊音效先響完再開口（與全站一致的 300ms）；這段時間內被關掉就不要再出聲
    setTimeout(() => { if (els.overlay.classList.contains('open')) cfg.playHeroIntro(hero); }, 300);
  }

  function close() {
    cfg.stopVoice();
    if (studentEls) studentEls.overlay.classList.remove('open');
    if (els) els.overlay.classList.remove('open');
    document.body.style.overflow = '';
    openHero = null;
  }

  function isOpen() { return !!(els && els.overlay.classList.contains('open')); }

  /** 開著的時候換泡泡文字（金婆婆切「新增／修改」分頁時會換一句話） */
  function setBubble(text) { if (els) els.bubble.textContent = text || ''; }

  global.HeroModal = { configure, open, close, isOpen, setBubble, openStudentPreview, renderPick };
})(window);
