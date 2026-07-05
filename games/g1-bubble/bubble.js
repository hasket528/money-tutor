/* G1 數字泡泡 — 遊戲邏輯
 * 點擊模式：泡泡由小變大冒出，時間到自動破裂。
 *           玩家需在目標泡泡破裂前點擊，錯過扣命。
 * 依序接龍：依 1→2→3… 順序點擊在場泡泡。
 * 亂序接龍：依頂部列隨機順序點擊在場泡泡。
 */

// ── 常數 ──────────────────────────────────────────────

const BUBBLE_COLORS = [
  { bg: '#4ECDC4', glow: 'rgba(78,205,196,0.7)' },
  { bg: '#45B7D1', glow: 'rgba(69,183,209,0.7)' },
  { bg: '#96CEB4', glow: 'rgba(150,206,180,0.7)' },
  { bg: '#A55EEA', glow: 'rgba(165,94,234,0.7)' },
  { bg: '#FF8B8B', glow: 'rgba(255,139,139,0.7)' },
  { bg: '#F7DC6F', glow: 'rgba(247,220,111,0.7)', textDark: true },
  { bg: '#FF6B9D', glow: 'rgba(255,107,157,0.7)' },
  { bg: '#26de81', glow: 'rgba(38,222,129,0.7)' },
];

// 點擊模式：泡泡有存活時間，時間到自動破裂
const DIFF_TAP = {
  easy:   { numRange:[1,8],  spawnMs:2000, lifeMs:5500, maxOnScreen:6  },
  normal: { numRange:[1,15], spawnMs:1400, lifeMs:3800, maxOnScreen:8  },
  hard:   { numRange:[1,30], spawnMs:950,  lifeMs:2400, maxOnScreen:10 },
};

// 接龍模式（依序 / 亂序共用）
const DIFF_CHAIN = {
  easy:   { startTime:12, minTime:4, speedFactor:0.93, poolMax:60  },
  normal: { startTime:8,  minTime:3, speedFactor:0.90, poolMax:100 },
  hard:   { startTime:6,  minTime:2, speedFactor:0.87, poolMax:150 },
};

const BUBBLE_SIZE = 64;
const MARGIN      = 14;
const CHAIN_INIT  = 10;

// ── BubbleGame ────────────────────────────────────────

class BubbleGame {
  constructor() {
    this.engine     = null;
    this.ui         = new GameUI();
    this.bubbles    = [];   // { id, el, value, bX, bY, removed, burstTimer }
    this.target     = 0;
    this.difficulty = 'normal';
    this.mode       = 'tap'; // 'tap' | 'chain-asc' | 'chain-rnd'
    this.gameArea   = null;
    this.isRunning  = false;
    this._lastScale = 0;
    this._idCounter = 0;

    // 點擊模式
    this._spawnTimer    = null;
    this._guaranteeNext = false; // 下一顆強制為目標值

    // 接龍模式
    this.chainTarget    = 1;
    this.chainPool      = [];
    this.chainSequence  = [];
    this.chainCompleted = 0;
    this.chainTimeLimit = 8;
  }

  // ── 初始化 ─────────────────────────────────────────

  init() {
    this.gameArea = document.getElementById('game-area');
    this.ui.renderHUD(3);
    this._showModeSelect();
  }

  // ── 模式 / 難度選單 ───────────────────────────────

  _showModeSelect() {
    const ov = this._mkOv(`
      <a href="../index.html" class="gue-back-link">← 遊戲選單</a>
      <div class="gue-difficulty-title">🫧 數字泡泡</div>
      <div class="gue-difficulty-sub">選擇遊戲模式</div>
      <button class="gue-diff-btn gue-diff-easy"   data-mode="tap">
        🎯 點擊模式 <span class="gue-diff-badge">在泡泡破掉前點擊！</span>
      </button>
      <button class="gue-diff-btn gue-diff-normal" data-mode="chain-asc">
        🔢 依序接龍 <span class="gue-diff-badge">1 → 2 → 3 → …</span>
      </button>
      <button class="gue-diff-btn gue-diff-hard"   data-mode="chain-rnd">
        🔀 亂序接龍 <span class="gue-diff-badge">隨機順序挑戰！</span>
      </button>
    `);
    ov.querySelectorAll('[data-mode]').forEach(btn =>
      btn.addEventListener('click', () => { this.mode = btn.dataset.mode; ov.remove(); this._showDiffSelect(); })
    );
  }

  _showDiffSelect() {
    const isTap = this.mode === 'tap';
    const titles = { tap:'🎯 點擊模式', 'chain-asc':'🔢 依序接龍', 'chain-rnd':'🔀 亂序接龍' };
    const subs   = {
      tap: '在目標泡泡破掉之前，點擊它！',
      'chain-asc': '從 1 開始，依序點擊！',
      'chain-rnd': '依照頂部顯示的隨機順序點擊！',
    };
    const ov = this._mkOv(`
      <button class="gue-back-link" data-back>← 返回</button>
      <div class="gue-difficulty-title">${titles[this.mode]}</div>
      <div class="gue-difficulty-sub">${subs[this.mode]}</div>
      <button class="gue-diff-btn gue-diff-easy"   data-diff="easy">
        簡單 <span class="gue-diff-badge">${isTap ? '泡泡存活 5.5 秒' : '每題 12 秒'}</span>
      </button>
      <button class="gue-diff-btn gue-diff-normal" data-diff="normal">
        普通 <span class="gue-diff-badge">${isTap ? '泡泡存活 3.8 秒' : '每題 8 秒'}</span>
      </button>
      <button class="gue-diff-btn gue-diff-hard"   data-diff="hard">
        困難 <span class="gue-diff-badge">${isTap ? '泡泡存活 2.4 秒' : '每題 6 秒'}</span>
      </button>
    `);
    ov.querySelectorAll('[data-diff]').forEach(btn =>
      btn.addEventListener('click', () => {
        this.difficulty = btn.dataset.diff;
        ov.remove();
        // 在倒數開始前初始化音效，讓倒數 3/2/1/Go 能正常播放
        window.gameAudio = new GameAudio().preload(
          ...GameAudio.COMMON, 'g1-bubble-pop', 'g1-bubble-wrong', 'g1-bubble-expire', 'g1-combo'
        );
        this.ui.showCountdown(() => this._start());
      })
    );
    ov.querySelector('[data-back]').addEventListener('click', () => { ov.remove(); this._showModeSelect(); });
  }

  _mkOv(inner) {
    const ov = document.createElement('div');
    ov.className = 'gue-difficulty-overlay';
    ov.innerHTML = `<div class="gue-difficulty-card">${inner}</div>`;
    document.body.appendChild(ov);
    return ov;
  }

  // ── 遊戲啟動 ─────────────────────────────────────

  _start() {
    const isChain = this.mode !== 'tap';
    this.engine = new GameEngine({
      gameId:   'g1',
      maxLives: 3,   // 點擊模式與接龍模式都有 3 條命
      difficulty: this.difficulty,
    });
    this.engine.startGlobalTimer();
    this.isRunning = true;

    this.engine.on('score', ({ total, combo }) => {
      this.ui.updateScore(total);
      if (combo >= 3) this.ui.showCombo(combo);
      if (combo >= 3) window.gameAudio?.play('g1-combo');
      const lvl = this.engine.getScaleLevel();
      if (lvl > this._lastScale) { this._lastScale = lvl; this._lvlBanner(); }
    });

    this.engine.on('lifeLost', ({ lives }) => {
      window.gameAudio?.play('life-lost');
      this.ui.updateLives(lives, 3);
      this.ui.showMissEffect();
    });

    this.engine.on('gameOver', result => {
      window.gameAudio?.play(result.isNewRecord ? 'new-highscore' : 'game-over-common');
      this._stop();
      setTimeout(() => this.ui.showResultScreen({ ...result, gameTitle: '數字泡泡', gameId: 'g1' }), 450);
    });

    // 顯示 UI（接龍才需要號碼列）
    if (isChain) {
      document.getElementById('target-panel').style.display     = 'none';
      document.getElementById('chain-bar').style.display        = 'flex';
      document.getElementById('chain-timer-wrap').style.display = 'block';
    }

    // 啟動
    const hintEl = document.getElementById('hint-text');
    if (isChain) {
      if (hintEl) { hintEl.textContent = this.mode === 'chain-rnd' ? '按照上方順序點擊！' : '從 1 開始，依序點擊！'; setTimeout(() => hintEl.remove(), 5000); }
      this._initChain();
    } else {
      if (hintEl) { hintEl.textContent = '在目標泡泡破掉前點擊！'; setTimeout(() => hintEl.remove(), 5000); }
      this._initTap();
    }
  }

  // ── 點擊模式 ──────────────────────────────────────

  _initTap() {
    this._setNewTarget();
    this._guaranteeNext = true; // 第一顆泡泡保證是目標值
    document.getElementById('target-timer-track')?.style.setProperty('display', 'none');

    const cfg = DIFF_TAP[this.difficulty];
    this._spawnTimer = setInterval(() => {
      if (!this.isRunning || this.engine.isGameOver()) { clearInterval(this._spawnTimer); return; }
      const onScreen = this.bubbles.filter(b => !b.removed).length;
      if (onScreen >= cfg.maxOnScreen) return;

      let value;
      if (this._guaranteeNext) {
        value = this.target;
        this._guaranteeNext = false;
      } else {
        const [mn, mx] = cfg.numRange;
        value = mn + Math.floor(Math.random() * (mx - mn + 1));
      }
      this._spawnLiving(value);
    }, cfg.spawnMs);
  }

  _setNewTarget() {
    const [mn, mx] = DIFF_TAP[this.difficulty].numRange;
    let t;
    do { t = mn + Math.floor(Math.random() * (mx - mn + 1)); }
    while (t === this.target && mx > mn);
    this.target = t;

    const el = document.getElementById('target-display');
    if (el) { el.textContent = t; el.classList.remove('tap-target-new'); void el.offsetWidth; el.classList.add('tap-target-new'); }
    this._guaranteeNext = true; // 確保目標值的泡泡即將出現
  }

  /**
   * 產生一顆「會生長→自動破裂」的泡泡
   * CSS bbl-swell 動畫結束時觸發 animationend → _autoBurst
   */
  _spawnLiving(value) {
    if (!this.isRunning || this.engine.isGameOver()) return;
    const pos = this._findPos(68);
    const col = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const id  = ++this._idCounter;
    const { lifeMs } = DIFF_TAP[this.difficulty];

    const el = document.createElement('div');
    el.className = 'bubble bubble-growing';
    el.style.left = `${pos.x}px`;
    el.style.top  = `${pos.y}px`;
    el.style.setProperty('--bubble-bg',   col.bg);
    el.style.setProperty('--bubble-glow', col.glow);
    el.style.setProperty('--lifespan',    `${lifeMs}ms`);
    if (col.textDark) el.style.color = 'rgba(0,0,0,0.75)';
    el.textContent = value;
    el.dataset.id  = id;

    // 動畫結束 → 自動破裂（與 CSS 精確同步）
    const burstFn = () => this._autoBurst(id);
    el.addEventListener('animationend', burstFn, { once: true });
    // 安全備用計時器（animationend 有時在背景分頁不觸發）
    const burstTimer = setTimeout(burstFn, lifeMs + 120);

    const onTap = e => { e.preventDefault(); this._onTap(id); };
    el.addEventListener('click', onTap);
    el.addEventListener('touchstart', onTap, { passive: false });

    this.gameArea.appendChild(el);
    this.bubbles.push({ id, el, value, bX: pos.x, bY: pos.y, removed: false, burstTimer, burstFn });
  }

  /** 自動破裂（時間到，未被點擊）*/
  _autoBurst(id) {
    const b = this.bubbles.find(b => b.id === id);
    if (!b || b.removed) return;

    const wasTarget = (b.value === this.target);
    b.removed = true;
    b.el.classList.remove('bubble-growing');
    b.el.classList.add('bubble-auto-burst');
    clearTimeout(b.burstTimer);
    setTimeout(() => b.el.remove(), 380);
    this.bubbles = this.bubbles.filter(x => !x.removed);

    if (wasTarget && this.isRunning && !this.engine.isGameOver()) {
      // 目標泡泡破了 → 扣命，保持同一目標，下一顆保證出現
      window.gameAudio?.play('g1-bubble-expire');
      this.engine.loseLife();
      if (!this.engine.isGameOver()) this._guaranteeNext = true;
    }
  }

  // ── 接龍模式 ──────────────────────────────────────

  _initChain() {
    const cfg = DIFF_CHAIN[this.difficulty];
    this.chainCompleted  = 0;
    this.chainTimeLimit  = cfg.startTime;

    if (this.mode === 'chain-rnd') {
      this.chainSequence = Array.from({ length: cfg.poolMax }, (_, i) => i + 1);
      for (let i = this.chainSequence.length-1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i+1));
        [this.chainSequence[i], this.chainSequence[j]] = [this.chainSequence[j], this.chainSequence[i]];
      }
      this.chainPool   = this.chainSequence.slice(CHAIN_INIT);
      this.chainTarget = this.chainSequence[0];
      this._spawnGrid(this.chainSequence.slice(0, CHAIN_INIT), 90);
    } else {
      this.chainTarget = 1;
      this.chainPool   = Array.from({ length: cfg.poolMax - CHAIN_INIT }, (_, i) => CHAIN_INIT + 1 + i);
      this._spawnGrid(Array.from({ length: CHAIN_INIT }, (_, i) => i + 1), 90);
    }

    this._renderChainBar();
    this._startChainTimer();
  }

  _renderChainBar() {
    const bar = document.getElementById('chain-bar');
    if (!bar) return;
    bar.innerHTML = '';

    if (this.mode === 'chain-rnd') {
      const start = this.chainCompleted;
      const end   = Math.min(start + 12, this.chainSequence.length);
      for (let i = start; i < end; i++) {
        const chip = document.createElement('div');
        chip.className = `chain-chip ${i === start ? 'chain-next' : 'chain-pending'}`;
        chip.textContent = this.chainSequence[i];
        bar.appendChild(chip);
      }
    } else {
      const active = this.bubbles.filter(b => !b.removed).map(b => b.value).sort((a,b)=>a-b);
      active.forEach(n => {
        const chip = document.createElement('div');
        chip.className = `chain-chip ${n === this.chainTarget ? 'chain-next' : 'chain-pending'}`;
        chip.textContent = n;
        bar.appendChild(chip);
      });
    }
  }

  _startChainTimer() {
    if (!this.isRunning || this.engine.isGameOver()) return;
    const fill = document.getElementById('chain-timer-fill');
    this.engine.startQuestionTimer(
      this.chainTimeLimit,
      (ratio) => {
        if (fill) { fill.style.width = `${ratio*100}%`; fill.classList.toggle('danger', ratio < 0.28); }
      },
      () => {
        if (!this.isRunning || this.engine.isGameOver()) return;
        this.engine.resetCombo();
        this.engine.loseLife();
        if (!this.engine.isGameOver()) this._startChainTimer();
      }
    );
    this._highlightTarget();
  }

  _highlightTarget() {
    this.bubbles.forEach(b => {
      if (b.removed) return;
      b.value === this.chainTarget ? b.el.classList.add('chain-target') : b.el.classList.remove('chain-target');
    });
  }

  _onChainHit(bubble) {
    this.engine.stopQuestionTimer();
    bubble.removed = true;
    bubble.el.classList.add('exploding');
    const rect = bubble.el.getBoundingClientRect();
    const cx = rect.left + BUBBLE_SIZE/2, cy = rect.top + BUBBLE_SIZE/2;
    setTimeout(() => bubble.el.remove(), 420);
    this.bubbles = this.bubbles.filter(b => !b.removed);

    this.chainCompleted++;
    const pts = this.engine.addScore(100 + this.chainCompleted * 3);
    this.ui.showScorePopup(cx, cy - 24, pts);
    this.ui.showHitEffect(cx, cy);

    const cfg = DIFF_CHAIN[this.difficulty];
    this.chainTimeLimit = Math.max(cfg.minTime, this.chainTimeLimit * cfg.speedFactor);
    this.chainTarget = (this.mode === 'chain-rnd')
      ? (this.chainSequence[this.chainCompleted] ?? null)
      : this.chainTarget + 1;

    if (this.chainPool.length > 0) {
      const next = this.chainPool.shift();
      setTimeout(() => {
        if (!this.isRunning || this.engine.isGameOver()) return;
        this._spawn(next, true);
        this._renderChainBar();
      }, 230);
    }

    this._renderChainBar();

    if (this.engine.isGameOver()) return;

    // 亂序接龍：序列耗盡
    if (this.chainTarget === null) {
      this._endChainComplete();
      return;
    }

    // 依序接龍：泡泡與池子都清空
    if (this.chainPool.length === 0 && this.bubbles.filter(b => !b.removed).length === 0) {
      this._endChainComplete();
      return;
    }

    setTimeout(() => this._startChainTimer(), 100);
  }

  _endChainComplete() {
    window.gameAudio?.play('new-highscore');
    this._stop();
    setTimeout(() => this.ui.showResultScreen({ ...this.engine.getResult(), gameTitle: '數字泡泡', gameId: 'g1' }), 450);
  }

  // ── 泡泡（共用工具）────────────────────────────────

  /**
   * 格狀均勻分佈：把 values 中的泡泡分配到各格區域
   * 用於接龍模式初始化、點擊模式（不使用，點擊模式用 _spawnLiving）
   */
  _spawnGrid(values, topOff) {
    const W = this.gameArea.clientWidth  || 380;
    const H = this.gameArea.clientHeight || 520;
    const n = values.length;
    const availW = W - MARGIN * 2;
    const availH = H - topOff - MARGIN * 2;

    const aspect = availW / Math.max(1, availH);
    let cols = Math.max(2, Math.round(Math.sqrt(n * aspect)));
    let rows = Math.ceil(n / cols);
    while (cols * rows < n) cols++;

    const cellW = availW / cols;
    const cellH = availH / rows;

    const idxs = Array.from({ length: cols * rows }, (_, i) => i);
    for (let i = idxs.length-1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }

    values.forEach((val, vi) => {
      const cell = idxs[vi % idxs.length];
      const col  = cell % cols, row = Math.floor(cell / cols);
      const mg   = 6;
      const x = MARGIN + col * cellW + mg + Math.random() * Math.max(0, cellW - BUBBLE_SIZE - mg*2);
      const y = topOff + MARGIN + row * cellH + mg + Math.random() * Math.max(0, cellH - BUBBLE_SIZE - mg*2);
      this._spawn(val, false, {
        x: Math.max(MARGIN, Math.min(W - BUBBLE_SIZE - MARGIN, x)),
        y: Math.max(topOff + MARGIN, Math.min(H - BUBBLE_SIZE - MARGIN, y)),
      });
    });
  }

  /** 接龍模式：靜態泡泡（不自動消失）*/
  _spawn(value, isNew = false, pos = null) {
    if (!this.isRunning || this.engine.isGameOver()) return;
    const p = pos || this._findPos(90);
    const col = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const id  = ++this._idCounter;

    const el = document.createElement('div');
    el.className = `bubble bubble-static${isNew ? ' bubble-new' : ''}`;
    el.style.left = `${p.x}px`;
    el.style.top  = `${p.y}px`;
    el.style.setProperty('--bubble-bg',   col.bg);
    el.style.setProperty('--bubble-glow', col.glow);
    el.style.setProperty('--float-delay', `${(Math.random() * 2.2).toFixed(1)}s`);
    if (col.textDark) el.style.color = 'rgba(0,0,0,0.75)';
    el.textContent = value;
    el.dataset.id  = id;

    const onTap = e => { e.preventDefault(); this._onTap(id); };
    el.addEventListener('click', onTap);
    el.addEventListener('touchstart', onTap, { passive: false });

    this.gameArea.appendChild(el);
    this.bubbles.push({ id, el, value, bX: p.x, bY: p.y, removed: false });
  }

  /** 在現有泡泡不重疊的位置產生（接龍補充、點擊模式）*/
  _findPos(topOff = 90) {
    const W = this.gameArea.clientWidth  || 380;
    const H = this.gameArea.clientHeight || 520;
    const mg = MARGIN, sz = BUBBLE_SIZE;

    for (let t = 0; t < 25; t++) {
      const x = mg + Math.random() * (W - sz - mg * 2);
      const y = topOff + mg + Math.random() * (H - sz - topOff - mg * 2);
      const ok = !this.bubbles.some(b => !b.removed && Math.hypot(b.bX - x, b.bY - y) < sz + 10);
      if (ok) return { x, y };
    }
    return { x: mg + Math.random() * (W - sz - mg*2), y: topOff + mg + Math.random() * (H - sz - topOff - mg*2) };
  }

  _clearAll() {
    this.bubbles.forEach(b => {
      b.removed = true;
      if (b.burstTimer) clearTimeout(b.burstTimer);
      b.el.remove();
    });
    this.bubbles = [];
  }

  // ── 點擊處理 ─────────────────────────────────────

  _onTap(id) {
    if (!this.isRunning || this.engine.isGameOver()) return;
    const b = this.bubbles.find(b => b.id === id);
    if (!b || b.removed) return;

    if (this.mode === 'tap') {
      if (b.value === this.target) {
        // ✅ 答對：取消自動破裂，爆炸，換新目標
        clearTimeout(b.burstTimer);
        b.el.removeEventListener('animationend', b.burstFn);
        b.removed = true;
        b.el.classList.remove('bubble-growing');
        window.gameAudio?.play('g1-bubble-pop');
        b.el.classList.add('exploding');
        setTimeout(() => b.el.remove(), 420);
        this.bubbles = this.bubbles.filter(x => !x.removed);

        const rect = b.el.getBoundingClientRect();
        const pts  = this.engine.addScore(100);
        this.ui.showScorePopup(rect.left + BUBBLE_SIZE/2, rect.top, pts);
        this.ui.showHitEffect(rect.left + BUBBLE_SIZE/2, rect.top + BUBBLE_SIZE/2);

        this._setNewTarget();
      } else {
        // ❌ 點錯：搖晃，不扣命
        window.gameAudio?.play('g1-bubble-wrong');
        b.el.classList.add('reject-shake');
        setTimeout(() => b.el.classList.remove('reject-shake'), 340);
      }
      return;
    }

    // 接龍模式
    if (b.value === this.chainTarget) {
      this._onChainHit(b);
    } else {
      b.el.classList.add('reject-shake');
      setTimeout(() => { if (!b.removed) b.el.classList.remove('reject-shake'); }, 340);
    }
  }

  // ── 工具 ─────────────────────────────────────────

  _lvlBanner() {
    const f = document.createElement('div'); f.className='level-up-flash'; document.body.appendChild(f); setTimeout(()=>f.remove(),600);
    const t = document.createElement('div'); t.className='level-up-text'; t.textContent='⚡ 速度提升！'; document.body.appendChild(t); setTimeout(()=>t.remove(),1200);
  }

  _stop() {
    this.isRunning = false;
    if (this._spawnTimer) clearInterval(this._spawnTimer);
    // 清除所有待破裂計時器，防止 game-over 後仍扣命
    this.bubbles.forEach(b => { b.removed = true; if (b.burstTimer) clearTimeout(b.burstTimer); });
    this.engine.destroy();
  }
}

// ── 啟動 ──────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  const game = new BubbleGame();
  game.init();
});
