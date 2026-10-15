/* G7 貪食蛇數字闖關
 * 三種模式：自由 / 指定數字 / 順序闖關
 * Canvas 2D 渲染，Google 蛇風格
 */

// ── 常數 ──────────────────────────────────────────────

const FOOD_PAL = [
  { bg: '#FF6B6B', glow: 'rgba(255,107,107,0.9)' },
  { bg: '#4ECDC4', glow: 'rgba(78,205,196,0.9)'  },
  { bg: '#FFD700', glow: 'rgba(255,215,0,0.9)'   },
  { bg: '#A55EEA', glow: 'rgba(165,94,234,0.9)'  },
  { bg: '#45B7D1', glow: 'rgba(69,183,209,0.9)'  },
  { bg: '#2ed573', glow: 'rgba(46,213,115,0.9)'  },
  { bg: '#FF8B35', glow: 'rgba(255,139,53,0.9)'  },
  { bg: '#FF6B9D', glow: 'rgba(255,107,157,0.9)' },
];

const DIFF_CFG = {
  easy:   { tickMs: 210, numMin: 1, numMax: 10,  foodN: 4, seqLen: 8  },
  normal: { tickMs: 150, numMin: 1, numMax: 20,  foodN: 5, seqLen: 12 },
  hard:   { tickMs: 100, numMin: 1, numMax: 30,  foodN: 6, seqLen: 16 },
};

const lerp = (a, b, t) => a + (b - a) * t;

// ── SnakeGame ──────────────────────────────────────────

class SnakeGame {
  constructor() {
    this.engine    = null;
    this.ui        = new GameUI();
    this.mode      = 'free';
    this.diff      = 'normal';

    this.canvas = null;
    this.ctx    = null;
    this.CELL   = 28;
    this.COLS   = 20;
    this.ROWS   = 14;

    this.snake   = [];
    this.dir     = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.growing = 0;
    this.foods   = [];

    this._raf      = null;
    this._prevTs   = 0;
    this._accum    = 0;
    this._flash    = 0;
    this._lastLvl  = 0;
    this._keyFn    = null;

    // Mode state
    this.target   = 0;
    this.seqNext  = 1;
    this.seqTotal = 0;
    this.seqDone  = 0;

    this.isRunning = false;
  }

  // ── 初始化 ─────────────────────────────────────────

  init() {
    this.canvas = document.getElementById('snake-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this.ui.renderHUD(3);
    this._resize();

    // 轉向 / 視窗縮放時重算 canvas（只在未遊戲中更新）
    window.addEventListener('resize', () => {
      if (!this.isRunning) this._resize();
    });

    this._showModeSelect();
  }

  _resize() {
    const dpad = document.getElementById('dpad');
    const area = document.getElementById('game-area');
    const W    = window.innerWidth;

    // ── D-pad 可見性：觸控裝置（Surface、iPad、觸控筆電）也顯示 ──
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const showDpad = hasTouch || (W < 1100);
    if (dpad) dpad.style.display = showDpad ? 'grid' : 'none';

    const dpadH = showDpad ? 180 : 0;

    // ── 實際可用空間（clientWidth 觸發 reflow 取得正確值）──
    const availW = area.clientWidth  || W;
    const availH = (area.clientHeight || (window.innerHeight - 64)) - dpadH;
    if (availW <= 0 || availH <= 0) return;

    // ── 目標格數（桌面更多欄列 → 更寬廣的遊戲場地）──
    let tCols, tRows;
    if      (W >= 1400) { tCols = 30; tRows = 20; }
    else if (W >= 1200) { tCols = 26; tRows = 18; }
    else if (W >= 900)  { tCols = 22; tRows = 16; }
    else if (W >= 768)  { tCols = 20; tRows = 14; }
    else                { tCols = 18; tRows = 12; }

    // ── 格子大小：寬、高都要塞得進去，取小者 ──
    const byW = Math.floor(availW / tCols);
    const byH = Math.floor(availH / tRows);
    let cell  = Math.min(byW, byH);

    // 各螢幕格子範圍：確保數字清晰可讀且不會太大
    if      (W >= 1200) cell = Math.max(28, Math.min(58, cell));
    else if (W >= 768)  cell = Math.max(22, Math.min(46, cell));
    else                cell = Math.max(16, Math.min(30, cell));

    this.CELL = cell;
    this.COLS = Math.floor(availW / cell);
    this.ROWS = Math.floor(availH / cell);

    this.canvas.width  = this.COLS * this.CELL;
    this.canvas.height = this.ROWS * this.CELL;
  }

  // ── 選單 ─────────────────────────────────────────

  _showModeSelect() {
    const ov = this._overlay(`
      <a href="../index.html" class="gue-back-link">← 遊戲選單</a>
      <div class="gue-difficulty-title">🐍 貪食蛇數字闖關</div>
      <div class="gue-difficulty-sub">選擇遊戲模式</div>
      <button class="gue-diff-btn gue-diff-easy"   data-mode="free">
        🎮 自由模式 <span class="gue-diff-badge">吃任意數字</span>
      </button>
      <button class="gue-diff-btn gue-diff-normal" data-mode="target">
        🎯 指定數字 <span class="gue-diff-badge">只能吃目標數字</span>
      </button>
      <button class="gue-diff-btn gue-diff-hard"   data-mode="sequence">
        🔢 順序闖關 <span class="gue-diff-badge">依序吃 1→2→3…</span>
      </button>
    `);
    ov.querySelectorAll('[data-mode]').forEach(btn =>
      btn.addEventListener('click', () => {
        this.mode = btn.dataset.mode;
        ov.remove();
        this._showDiffSelect();
      })
    );
  }

  _showDiffSelect() {
    const titles = { free: '🎮 自由模式', target: '🎯 指定數字', sequence: '🔢 順序闖關' };
    const ov = this._overlay(`
      <button class="gue-back-link" data-back>← 返回</button>
      <div class="gue-difficulty-title">${titles[this.mode]}</div>
      <div class="gue-difficulty-sub">選擇難度</div>
      <button class="gue-diff-btn gue-diff-easy"   data-diff="easy">
        簡單 <span class="gue-diff-badge">數字 1–10・慢速</span>
      </button>
      <button class="gue-diff-btn gue-diff-normal" data-diff="normal">
        普通 <span class="gue-diff-badge">數字 1–20・中速</span>
      </button>
      <button class="gue-diff-btn gue-diff-hard"   data-diff="hard">
        困難 <span class="gue-diff-badge">數字 1–30・快速</span>
      </button>
    `);
    ov.querySelectorAll('[data-diff]').forEach(btn =>
      btn.addEventListener('click', () => {
        this.diff = btn.dataset.diff;
        ov.remove();
        // 在倒數開始前初始化音效，讓倒數 3/2/1/Go 能正常播放
        window.gameAudio = new GameAudio().preload(
          ...GameAudio.COMMON, 'g7-eat'
        );
        this.ui.showCountdown(() => this._start());
      })
    );
    ov.querySelector('[data-back]').addEventListener('click', () => { ov.remove(); this._showModeSelect(); });
  }

  _overlay(inner) {
    const ov = document.createElement('div');
    ov.className = 'gue-difficulty-overlay';
    ov.innerHTML = `<div class="gue-difficulty-card">${inner}</div>`;
    document.body.appendChild(ov);
    return ov;
  }

  // ── 遊戲啟動 ─────────────────────────────────────

  _start() {
    this.engine = new GameEngine({ gameId: 'g7', maxLives: 3, difficulty: this.diff });
    this.engine.startGlobalTimer();
    this.isRunning = true;

    this.engine.on('score', ({ total, combo }) => {
      this.ui.updateScore(total);
      if (combo >= 3) this.ui.showCombo(combo);
      const lvl = this.engine.getScaleLevel();
      if (lvl > this._lastLvl) {
        this._lastLvl = lvl;
        this._levelBanner('⚡ 速度提升！');
      }
    });

    this.engine.on('lifeLost', ({ lives }) => {
      window.gameAudio?.play('life-lost');
      this.ui.updateLives(lives, 3);
      this.ui.showMissEffect();
      this._flash = 430;
    });

    this.engine.on('gameOver', result => {
      window.gameAudio?.play(result.isNewRecord ? 'new-highscore' : 'game-over-common');
      this._stop(); // 取消 RAF 循環並移除鍵盤監聽
      setTimeout(() => this.ui.showResultScreen({ ...result, gameTitle: '貪食蛇', gameId: 'g7' }), 500);
    });

    // 初始化模式
    const cfg = DIFF_CFG[this.diff];
    if (this.mode === 'target') {
      this.target = this._rnd();
    } else if (this.mode === 'sequence') {
      this.seqNext = 1; this.seqTotal = cfg.seqLen; this.seqDone = 0;
    }

    this._spawnSnake();
    this._spawnFoods();
    this._controls();

    this._prevTs = performance.now();
    this._accum  = 0;
    this._raf    = requestAnimationFrame(ts => this._loop(ts));
  }

  _rnd() {
    const c = DIFF_CFG[this.diff];
    return Math.floor(Math.random() * (c.numMax - c.numMin + 1)) + c.numMin;
  }

  // ── 蛇 & 食物 ────────────────────────────────────

  _spawnSnake() {
    const cx = Math.floor(this.COLS / 2), cy = Math.floor(this.ROWS / 2);
    this.snake = [{ x: cx, y: cy }, { x: cx-1, y: cy }, { x: cx-2, y: cy }];
    this.dir = this.nextDir = { x: 1, y: 0 };
    this.growing = 0;
  }

  _spawnFoods() {
    this.foods = [];
    const n = DIFF_CFG[this.diff].foodN;
    for (let i = 0; i < n; i++) this._spawnOne();
  }

  _spawnOne() {
    const pos = this._freeCell();
    if (!pos) return;

    let value;
    if (this.mode === 'target') {
      value = this.foods.some(f => f.value === this.target) && Math.random() > 0.35
        ? this._rnd() : this.target;
    } else if (this.mode === 'sequence') {
      value = (!this.foods.some(f => f.value === this.seqNext) && this.seqNext <= this.seqTotal)
        ? this.seqNext : this._rnd();
    } else {
      value = this._rnd();
    }

    const p = FOOD_PAL[value % FOOD_PAL.length];
    this.foods.push({ x: pos.x, y: pos.y, value, color: p.bg, glow: p.glow, phase: Math.random() * Math.PI * 2 });
  }

  _freeCell() {
    const taken = new Set([
      ...this.snake.map(s => `${s.x},${s.y}`),
      ...this.foods.map(f => `${f.x},${f.y}`),
    ]);
    const free = [];
    for (let x = 0; x < this.COLS; x++)
      for (let y = 0; y < this.ROWS; y++)
        if (!taken.has(`${x},${y}`)) free.push({ x, y });
    return free.length ? free[Math.floor(Math.random() * free.length)] : null;
  }

  // ── 控制 ─────────────────────────────────────────

  _controls() {
    const DM = {
      ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
      w:[0,-1], s:[0,1], a:[-1,0], d:[1,0],
      W:[0,-1], S:[0,1], A:[-1,0], D:[1,0],
    };
    this._keyFn = e => {
      if (DM[e.key]) { e.preventDefault(); this._setDir(...DM[e.key]); }
    };
    document.addEventListener('keydown', this._keyFn);

    // D-pad
    [['d-up',0,-1],['d-down',0,1],['d-left',-1,0],['d-right',1,0]].forEach(([id,dx,dy]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const fn = e => { e.preventDefault(); this._setDir(dx, dy); };
      el.addEventListener('click', fn);
      el.addEventListener('touchstart', fn, { passive: false });
    });

    // 滑動手勢
    let tx = 0, ty = 0;
    this.canvas.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    this.canvas.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
      if (Math.abs(dx) > Math.abs(dy)) this._setDir(dx > 0 ? 1 : -1, 0);
      else this._setDir(0, dy > 0 ? 1 : -1);
    }, { passive: true });
  }

  _setDir(dx, dy) {
    if (dx === -this.dir.x && dy === -this.dir.y) return;
    this.nextDir = { x: dx, y: dy };
  }

  // ── 主循環 ───────────────────────────────────────

  _loop(ts) {
    if (!this.isRunning) return;
    const dt = Math.min(ts - this._prevTs, 120);
    this._prevTs = ts;
    this._accum += dt;
    if (this._flash > 0) this._flash -= dt;

    const tickMs = Math.max(68, Math.round(
      DIFF_CFG[this.diff].tickMs * (1 - Math.min(0.45, (this.snake.length - 3) / 55))
    ));
    if (this._accum >= tickMs) {
      this._accum -= tickMs;
      this._step();
    }
    this._render();
    this._raf = requestAnimationFrame(ts => this._loop(ts));
  }

  // ── 每步移動 ─────────────────────────────────────

  _step() {
    if (this.engine.isGameOver()) return;
    this.dir = this.nextDir;
    const h = this.snake[0];
    const nx = h.x + this.dir.x, ny = h.y + this.dir.y;

    // 碰壁
    if (nx < 0 || nx >= this.COLS || ny < 0 || ny >= this.ROWS) {
      this.engine.loseLife();
      if (!this.engine.isGameOver()) this._spawnSnake();
      return;
    }
    // 自撞
    if (this.snake.some(s => s.x === nx && s.y === ny)) {
      this.engine.loseLife();
      if (!this.engine.isGameOver()) this._spawnSnake();
      return;
    }

    this.snake.unshift({ x: nx, y: ny });
    if (this.growing > 0) { this.growing--; } else { this.snake.pop(); }

    const fi = this.foods.findIndex(f => f.x === nx && f.y === ny);
    if (fi !== -1) this._eat(fi);
  }

  // ── 吃食物 ───────────────────────────────────────

  _eat(fi) {
    const food = this.foods.splice(fi, 1)[0];
    const rect = this.canvas.getBoundingClientRect();
    const C = this.CELL;
    window.gameAudio?.play('g7-eat');

    if (this.mode === 'free') {
      const pts = this.engine.addScore(food.value * 10);
      this.ui.showScorePopup(rect.left + food.x * C + C/2, rect.top + food.y * C, pts);
      this.growing++;

    } else if (this.mode === 'target') {
      if (food.value === this.target) {
        const pts = this.engine.addScore(200);
        this.ui.showScorePopup(rect.left + food.x * C + C/2, rect.top + food.y * C, pts);
        this.ui.showHitEffect(rect.left + food.x * C + C/2, rect.top + food.y * C + C/2);
        this.growing++;
        // 確保新目標與舊目標不同，避免面板看似無更新
        let t;
        do { t = this._rnd(); } while (t === this.target);
        this.target = t;
      } else {
        this.engine.resetCombo();
        this.engine.loseLife();
        if (!this.engine.isGameOver()) this.snake.splice(Math.max(3, this.snake.length - 2));
      }

    } else if (this.mode === 'sequence') {
      if (food.value === this.seqNext) {
        const pts = this.engine.addScore(150);
        this.ui.showScorePopup(rect.left + food.x * C + C/2, rect.top + food.y * C, pts);
        this.ui.showHitEffect(rect.left + food.x * C + C/2, rect.top + food.y * C + C/2);
        this.growing++;
        this.seqNext++;
        this.seqDone++;
        if (this.seqNext > this.seqTotal) {
          this.engine.addScore(500);
          this._levelBanner('🎉 順序完成！+500');
          const f = document.createElement('div'); f.className = 'sn-clear-flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 500);
          this.seqNext = 1; this.seqDone = 0;
          this.foods = []; this._spawnFoods();
          return;
        }
      } else {
        this.engine.resetCombo();
        this.engine.loseLife();
        this.seqNext = 1; this.seqDone = 0;
        if (!this.engine.isGameOver()) this.snake.splice(Math.max(3, this.snake.length - 2));
      }
    }

    this._spawnOne();
  }

  // ── 渲染 ─────────────────────────────────────────

  _render() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height, C = this.CELL;

    // 背景
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, W, H);

    // 格線
    ctx.strokeStyle = 'rgba(255,255,255,0.042)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= this.COLS; x++) { ctx.beginPath(); ctx.moveTo(x*C,0); ctx.lineTo(x*C,H); ctx.stroke(); }
    for (let y = 0; y <= this.ROWS; y++) { ctx.beginPath(); ctx.moveTo(0,y*C); ctx.lineTo(W,y*C); ctx.stroke(); }

    // 死亡閃光
    if (this._flash > 0) {
      ctx.fillStyle = `rgba(255,71,87,${(this._flash/430)*0.36})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 食物
    const now = Date.now();
    this.foods.forEach(food => {
      const isTarget =
        (this.mode === 'target'   && food.value === this.target) ||
        (this.mode === 'sequence' && food.value === this.seqNext);
      const cx = food.x * C + C/2;
      const cy = food.y * C + C/2 + Math.sin(now / 380 + food.phase) * 2.2;
      const r  = C * 0.38;

      ctx.save();
      ctx.shadowColor = food.glow;
      ctx.shadowBlur  = isTarget ? 22 : 10;
      ctx.fillStyle   = food.color;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();

      // 光澤
      ctx.shadowBlur = 0;
      const shine = ctx.createRadialGradient(cx-r*0.3, cy-r*0.38, 0, cx, cy, r);
      shine.addColorStop(0, 'rgba(255,255,255,0.38)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();

      // 數字
      const fs = food.value >= 100 ? C*0.28 : food.value >= 10 ? C*0.34 : C*0.42;
      ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
      ctx.font = `900 ${fs}px 'Microsoft JhengHei',sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(food.value, cx, cy);

      // 脈動目標圓框
      if (isTarget) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255,255,255,${0.55 + 0.45 * Math.sin(now / 230)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI*2); ctx.stroke();
      }
      ctx.restore();
    });

    // 蛇體（從尾到頭）
    ctx.save();
    for (let i = this.snake.length - 1; i >= 1; i--) {
      const s = this.snake[i];
      const t = i / Math.max(1, this.snake.length - 1);
      const hue = lerp(145, 192, t), sat = lerp(82, 68, t), lit = lerp(52, 38, t);
      const rad = (C / 2 - 1.5) * (1 - t * 0.32);
      ctx.fillStyle = `hsl(${hue},${sat}%,${lit}%)`;
      ctx.shadowColor = `hsla(${hue},${sat}%,${lit}%,0.3)`;
      ctx.shadowBlur  = 5;
      ctx.beginPath(); ctx.arc(s.x*C+C/2, s.y*C+C/2, rad, 0, Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 蛇頭
    if (this.snake.length > 0) {
      const h = this.snake[0];
      ctx.fillStyle = '#3ddc57';
      ctx.shadowColor = 'rgba(61,220,87,0.65)'; ctx.shadowBlur = 14;
      this._rr(h.x*C+1, h.y*C+1, C-2, C-2, C*0.3);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 眼睛（兩顆）
      const dx = this.dir.x, dy = this.dir.y;
      const px = dy, py = -dx;
      const hcx = h.x*C+C/2, hcy = h.y*C+C/2;
      for (const sign of [1, -1]) {
        const ex = hcx + dx*C*0.22 + px*C*0.21*sign;
        const ey = hcy + dy*C*0.22 + py*C*0.21*sign;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ex, ey, C*0.135, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(ex + dx*C*0.045, ey + dy*C*0.045, C*0.072, 0, Math.PI*2); ctx.fill();
      }
    }
    ctx.restore();

    // 模式 HUD
    this._hud();
  }

  // ── HUD 覆蓋（指定/順序模式）───────────────────

  _hud() {
    if (this.mode === 'free') return;
    const ctx = this.ctx;
    const W = this.canvas.width, C = this.CELL;

    if (this.mode === 'target') {
      const label = `吃  ${this.target}`;
      ctx.font = `bold ${C*0.46}px 'Microsoft JhengHei',sans-serif`;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(0,0,0,0.68)';
      this._rr(W/2 - tw/2 - 16, 5, tw+32, 26, 9); ctx.fill();
      const p = FOOD_PAL[this.target % FOOD_PAL.length];
      ctx.fillStyle = p.bg; ctx.shadowColor = p.glow; ctx.shadowBlur = 10;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, W/2, 18);
      ctx.shadowBlur = 0;

    } else if (this.mode === 'sequence') {
      const left = this.seqTotal - this.seqDone;
      const label = this.seqNext <= this.seqTotal
        ? `下一個：${this.seqNext}   剩 ${left} 個`
        : '🎉 完成！';
      ctx.font = `bold ${C*0.4}px 'Microsoft JhengHei',sans-serif`;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(0,0,0,0.68)';
      this._rr(W/2 - tw/2 - 14, 5, tw+28, 26, 9); ctx.fill();
      ctx.fillStyle = '#4ECDC4'; ctx.shadowColor = 'rgba(78,205,196,0.7)'; ctx.shadowBlur = 8;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, W/2, 18);
      ctx.shadowBlur = 0;
    }
  }

  // ── 圓角矩形路徑 ────────────────────────────────

  _rr(x, y, w, h, r) {
    r = Math.min(r, w/2, h/2);
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y,   x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x,   y+h, r);
    ctx.arcTo(x,   y+h, x,   y,   r);
    ctx.arcTo(x,   y,   x+w, y,   r);
    ctx.closePath();
  }

  // ── 通知橫幅 ─────────────────────────────────────

  _levelBanner(text) {
    const f = document.createElement('div'); f.className = 'level-up-flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 600);
    const t = document.createElement('div'); t.className = 'level-up-text'; t.textContent = text; document.body.appendChild(t); setTimeout(() => t.remove(), 1400);
  }

  // ── 停止 ─────────────────────────────────────────

  _stop() {
    this.isRunning = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._keyFn) document.removeEventListener('keydown', this._keyFn);
    this.engine.destroy();
  }
}

// ── 啟動 ──────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  const game = new SnakeGame();
  game.init();
});
