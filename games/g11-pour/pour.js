/* G11 汽水倒倒樂
 * 按住按鈕倒汽水，精準停在目標線！
 * 5 回合 × 3 杯，追求最高分。
 */

const SODA_TYPES = [
  { name: '可樂',    c1: '#5C1A00', c2: '#A03A0A', foam: '#D4A55A', stream: 'rgba(130,50,10,0.9)'    },
  { name: '橘子汽水', c1: '#C04000', c2: '#FF7800', foam: '#FFE0A0', stream: 'rgba(220,90,0,0.9)'    },
  { name: '草莓汽水', c1: '#A00020', c2: '#E82050', foam: '#FFB0C0', stream: 'rgba(200,10,40,0.9)'   },
  { name: '藍莓汽水', c1: '#1A1A90', c2: '#2840C0', foam: '#9090FF', stream: 'rgba(30,50,180,0.9)'   },
  { name: '檸檬汽水', c1: '#7A9000', c2: '#BEDE00', foam: '#F0FFB0', stream: 'rgba(150,190,0,0.9)'   },
  { name: '葡萄汽水', c1: '#3A0060', c2: '#7020A0', foam: '#D0A0FF', stream: 'rgba(80,10,150,0.9)'   },
];

const DIFF_CFG = {
  easy:   { baseRate: 0.36, label: '簡單' },  // fill % per second
  normal: { baseRate: 0.60, label: '普通' },
  hard:   { baseRate: 1.00, label: '困難' },
};

const CUPS_PER_ROUND = 3;
const TOTAL_ROUNDS   = 5;

class PourGame {
  constructor() {
    this.engine       = null;
    this.ui           = new GameUI();
    this.diff         = 'normal';

    this.soda         = null;
    this.cups         = [];
    this.currentCup   = 0;
    this.currentRound = 0;

    this.pouring      = false;
    this._rafId       = null;
    this._lastTs      = null;
    this._roundScore  = 0;
    this._blocked     = false;
    this._cupCenterX  = 0;   // current active cup X, updated by _positionBottle
  }

  init() { this._showSetup(); }

  // ── Setup ──────────────────────────────────────────

  _showSetup() {
    const ov = document.createElement('div');
    ov.className = 'gue-difficulty-overlay';
    ov.innerHTML = `
      <div class="gue-difficulty-card">
        <a href="../index.html" class="gue-back-link">← 遊戲選單</a>
        <div class="gue-difficulty-title">🥤 汽水倒倒樂</div>
        <div class="gue-difficulty-sub">按住按鈕倒汽水，精準停在目標線！<br>5 回合 × 3 杯，追求高分！</div>
        <button class="gue-diff-btn gue-diff-easy"   data-diff="easy">
          簡單 <span class="gue-diff-badge">慢速流量</span>
        </button>
        <button class="gue-diff-btn gue-diff-normal" data-diff="normal">
          普通 <span class="gue-diff-badge">中速流量</span>
        </button>
        <button class="gue-diff-btn gue-diff-hard"   data-diff="hard">
          困難 <span class="gue-diff-badge">快速流量</span>
        </button>
      </div>
    `;
    document.body.appendChild(ov);
    ov.querySelectorAll('[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.diff = btn.dataset.diff;
        ov.remove();
        this._startGame();
      });
    });
  }

  // ── Start game ──────────────────────────────────────

  _startGame() {
    this.engine = new GameEngine({ gameId: 'g11', maxLives: 99, difficulty: this.diff });
    this.engine.startGlobalTimer();

    // Custom HUD (no lives)
    const hud = document.createElement('div');
    hud.id = 'gue-hud';
    hud.innerHTML = `
      <div class="gue-hud-left">
        <a href="../index.html" class="gue-back-btn" title="返回選單">‹</a>
      </div>
      <div class="gue-hud-center">
        <div class="gue-score-wrap">
          <div class="gue-score-label">分數</div>
          <div id="gue-score">0</div>
        </div>
      </div>
      <div class="gue-hud-right">
        <div id="pour-round-hud" style="font-size:0.8rem;color:rgba(255,255,255,0.45)">
          回合 0/${TOTAL_ROUNDS}
        </div>
      </div>
    `;
    document.body.prepend(hud);
    this.engine.on('score', ({ total }) => {
      const el = document.getElementById('gue-score');
      if (el) el.textContent = total.toLocaleString();
    });

    this.ui.showCountdown(() => this._startRound());
  }

  // ── Round ──────────────────────────────────────────

  _startRound() {
    this.currentRound++;
    this._roundScore = 0;
    this.currentCup  = 0;
    this._blocked    = false;

    const roundHud = document.getElementById('pour-round-hud');
    if (roundHud) roundHud.textContent = `回合 ${this.currentRound}/${TOTAL_ROUNDS}`;

    // Pick soda
    this.soda = SODA_TYPES[Math.floor(Math.random() * SODA_TYPES.length)];
    const stage = document.getElementById('pour-stage');
    stage.style.setProperty('--soda-c1',     this.soda.c1);
    stage.style.setProperty('--soda-c2',     this.soda.c2);
    stage.style.setProperty('--soda-foam',   this.soda.foam);
    stage.style.setProperty('--soda-stream', this.soda.stream);

    document.getElementById('pour-soda-label').textContent = `${this.soda.name} 🥤`;
    document.getElementById('pour-round-label').textContent = `第 ${this.currentRound} 回合`;

    // Rebuild cups
    this._buildCups();

    // Rebuild pitcher SVG with current soda color
    this._buildBottle();

    // Activate first cup (with small delay for DOM layout)
    setTimeout(() => this._activateCup(0), 30);
  }

  // ── Build bottle (once at _startGame) ───────────────

  _buildBottle() {
    const container = document.getElementById('pour-bottle-container');
    if (!container) return;

    // Flat-design pitcher SVG (upright, spout at top-left).
    // CSS rotates -50deg CCW when pouring → spout swings to lower-left into cup.
    // Transform-origin at 58% 62% (lower-right body = held end).
    const c2 = this.soda ? this.soda.c2 : '#2840C0';
    container.innerHTML = `
      <svg viewBox="0 0 78 78" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="jc">
            <path d="M8,20 L70,20 L64,74 L14,74 Z"/>
          </clipPath>
        </defs>

        <!-- ── Pitcher: handle on LEFT, pours from RIGHT when tilted CW ── -->
        <!-- Default: upright, handle on left. Pouring: +50deg CW → right lid-edge falls into cup center -->

        <!-- Handle: LEFT side C-curve (extends to negative x, visible via overflow:visible) -->
        <path d="M8,30 C -12,30 -12,58 8,58"
              fill="none" stroke="${c2}" stroke-width="3.2" stroke-linecap="round"/>

        <!-- Body: clean trapezoid, wider at top -->
        <path d="M8,20 L70,20 L64,74 L14,74 Z"
              fill="#A8D8F0" stroke="${c2}" stroke-width="2.5" stroke-linejoin="round"/>

        <!-- Lid / top band (flat) -->
        <rect x="6" y="10" width="66" height="12" rx="4"
              fill="#BEE5F8" stroke="${c2}" stroke-width="2.5"/>

        <!-- White highlight stripe on lid -->
        <rect x="20" y="13" width="28" height="5" rx="2.5"
              fill="rgba(255,255,255,0.88)"/>

        <!-- Liquid fill (lower body) -->
        <path d="M8,48 L70,48 L64,74 L14,74 Z"
              fill="${c2}" opacity="0.90" clip-path="url(#jc)"/>

        <!-- Right inner sheen (pour side) -->
        <rect x="58" y="22" width="5" height="46" rx="2"
              fill="rgba(255,255,255,0.18)" clip-path="url(#jc)"/>
      </svg>
    `;
  }

  // ── Build cups ──────────────────────────────────────

  _buildCups() {
    const row = document.getElementById('pour-cups-row');
    row.innerHTML = '';
    this.cups = [];

    for (let i = 0; i < CUPS_PER_ROUND; i++) {
      const target = Math.round((0.60 + Math.random() * 0.28) * 100) / 100;

      const slot = document.createElement('div');
      slot.className = 'pour-cup-slot';
      slot.id = `pour-cup-slot-${i}`;
      slot.innerHTML = `
        <div class="pour-cup-glass" id="pour-glass-${i}">
          <div class="pour-liquid"      id="pour-liquid-${i}"></div>
          <div class="pour-foam"        id="pour-foam-${i}"></div>
          <div class="pour-target-line" id="pour-target-${i}"
               style="bottom:${target * 100}%"></div>
          <div class="pour-fill-label"  id="pour-fill-label-${i}">0%</div>
        </div>
        <div class="pour-cup-label">
          <span class="pour-cup-num">杯 ${i + 1}</span>
          <span class="pour-cup-target-pct">目標 ${Math.round(target * 100)}%</span>
        </div>
        <div class="pour-score-popup" id="pour-score-popup-${i}"></div>
      `;
      row.appendChild(slot);

      this._spawnBubbles(slot.querySelector('.pour-liquid'), 10);

      this.cups.push({
        fill:     0,
        target,
        done:     false,
        el:       slot,
        glassEl:  slot.querySelector('.pour-cup-glass'),
        liquidEl: slot.querySelector('.pour-liquid'),
        foamEl:   slot.querySelector('.pour-foam'),
        fillLbl:  slot.querySelector('.pour-fill-label'),
        scoreEl:  slot.querySelector('.pour-score-popup'),
      });
    }
  }

  _spawnBubbles(container, count) {
    for (let i = 0; i < count; i++) {
      const b = document.createElement('div');
      b.className = 'pour-bubble';
      const s = 3 + Math.random() * 5;
      b.style.width  = s + 'px';
      b.style.height = s + 'px';
      b.style.left   = `${8 + Math.random() * 84}%`;
      b.style.bottom = `${Math.random() * 25}%`;
      b.style.setProperty('--dur',   `${0.9 + Math.random() * 1.4}s`);
      b.style.setProperty('--delay', `${Math.random() * 2.5}s`);
      container.appendChild(b);
    }
  }

  // ── Activate cup ────────────────────────────────────

  _activateCup(idx) {
    this.cups.forEach((c, i) =>
      c.el.classList.toggle('pour-cup-active', i === idx)
    );

    const btn = document.getElementById('pour-btn');
    if (btn) {
      btn.disabled = false;
      document.getElementById('pour-btn-text').textContent = '按住倒入';
    }

    this._setHint(`第 ${idx + 1} 杯 — 目標 ${Math.round(this.cups[idx].target * 100)}%，感覺好了就放手！`);
    this._positionBottle(idx);
  }

  _positionBottle(idx) {
    const container = document.getElementById('pour-bottle-container');
    const slot      = document.getElementById(`pour-cup-slot-${idx}`);
    if (!container || !slot) return;

    // Get positions relative to #pour-stage (shared coordinate space with cups)
    const stageRect = document.getElementById('pour-stage').getBoundingClientRect();
    const slotRect  = slot.getBoundingClientRect();

    const cupGlassTop = slotRect.top  - stageRect.top;   // cup glass top in stage
    const cupCenterX  = slotRect.left - stageRect.left + slotRect.width / 2;

    // Two positions:
    //  STATIC (upright, not pouring): pitcher clearly LEFT of cup → H_OFFSET_STATIC = -55
    //  POUR   (tilted, pouring):      correct pour geometry     → H_OFFSET_POUR   = +16
    //
    // When pouring starts (_onPourStart), left transitions to POUR position.
    // When pouring stops (_onPourStop), left transitions back to STATIC position.
    // CSS transition animates the slide smoothly.
    //
    // Vertical: containerTop = cupGlassTop - 135 (39px gap between pitcher bottom and cup top)
    const STATIC_OFFSET = -72;  // pitcher center 72px LEFT of cup
    const containerTop  = cupGlassTop - 135;

    this._cupCenterX = cupCenterX; // save for onPourStart / onPourStop

    container.style.left    = `${cupCenterX + STATIC_OFFSET}px`;
    container.style.top     = `${Math.max(0, containerTop)}px`;
    container.style.opacity = '1';
  }

  // ── Pour controls ────────────────────────────────────

  onPourStart() {
    if (this._blocked) return;
    if (!this.cups[this.currentCup] || this.cups[this.currentCup].done) return;
    const btn = document.getElementById('pour-btn');
    if (btn && btn.disabled) return;

    this.pouring = true;
    this._lastTs = null;

    // Slide pitcher to pour-geometry position
    const container = document.getElementById('pour-bottle-container');
    if (container) container.style.left = `${this._cupCenterX + 16}px`;

    window.gameAudio?.play('g11-pour-water');  // 倒水開始音

    document.getElementById('pour-stage')?.classList.add('is-pouring');
    btn?.classList.add('is-holding');
    document.getElementById('pour-btn-text').textContent = '倒入中…';

    this._rafId = requestAnimationFrame(ts => this._gameLoop(ts));
  }

  onPourStop() {
    if (!this.pouring) return;
    this.pouring = false;

    // Slide pitcher back to static (left) position
    const containerEl = document.getElementById('pour-bottle-container');
    if (containerEl) containerEl.style.left = `${this._cupCenterX - 72}px`;

    document.getElementById('pour-stage')?.classList.remove('is-pouring');
    const btn = document.getElementById('pour-btn');
    btn?.classList.remove('is-holding');
    cancelAnimationFrame(this._rafId);

    if (!this._blocked) this._finalizeCup();
  }

  // ── Game loop (rAF) ──────────────────────────────────

  _gameLoop(ts) {
    if (!this.pouring) return;
    if (!this._lastTs) this._lastTs = ts;

    const dt = Math.min((ts - this._lastTs) / 1000, 0.05);
    this._lastTs = ts;

    const cup  = this.cups[this.currentCup];
    const rate = this._flowRate(cup.fill);
    cup.fill   = Math.min(cup.fill + rate * dt, 1.0);

    // Update liquid & fill label
    cup.liquidEl.style.height = `${cup.fill * 100}%`;
    cup.fillLbl.textContent   = `${Math.round(cup.fill * 100)}%`;

    // Foam above 80%
    if (cup.fill >= 0.80) {
      cup.foamEl.classList.add('pour-foam-visible');
      cup.foamEl.style.height = `${Math.min((cup.fill - 0.80) / 0.20 * 14, 14)}px`;
    }

    // Auto-stop on overflow
    if (cup.fill >= 1.0) {
      this.pouring  = false;
      this._blocked = true;
      const overflowContainer = document.getElementById('pour-bottle-container');
      if (overflowContainer) overflowContainer.style.left = `${this._cupCenterX - 72}px`;
      document.getElementById('pour-stage')?.classList.remove('is-pouring');
      const btn = document.getElementById('pour-btn');
      btn?.classList.remove('is-holding');
      cup.el.classList.add('pour-overflow-anim');
      this.ui.showMissEffect();
      window.gameAudio?.play('g11-overflow');  // 溢出音效
      setTimeout(() => { this._blocked = false; this._finalizeCup(); }, 620);
      return;
    }

    this._rafId = requestAnimationFrame(ts => this._gameLoop(ts));
  }

  // Non-linear: slow start → ramp → danger zone
  _flowRate(fill) {
    const lvl  = this.engine.getScaleLevel();
    const base = DIFF_CFG[this.diff].baseRate * (1 + lvl * 0.12);
    if (fill < 0.25) return base * 0.65;
    if (fill < 0.55) return base * 1.15;
    if (fill < 0.80) return base * 1.00;
    return base * 1.50; // near rim: accelerates!
  }

  // ── Finalize cup ────────────────────────────────────

  _finalizeCup() {
    const cup   = this.cups[this.currentCup];
    cup.done    = true;

    const score = this._calcScore(cup.fill, cup.target);
    this._roundScore += Math.max(score, 0);

    // Update fill label to final %
    cup.fillLbl.textContent = `${Math.round(cup.fill * 100)}%`;

    // Engine
    if (score > 50) {
      this.engine.addScore(score);
      this.ui.showCombo(this.engine.combo);
    } else {
      this.engine.resetCombo();
    }

    this._showCupScore(this.currentCup, score);
    this._setHint(this._scoreMessage(score));

    // 音效：依分數給予不同回饋
    if (score >= 95) {
      window.gameAudio?.play('g11-fill-perfect');  // 完美
    } else if (score >= 0) {
      window.gameAudio?.play('g11-cup-done');       // 完成（非滿分）
    }
    // 溢出已在 _gameLoop 觸發，這裡不重複

    const btn = document.getElementById('pour-btn');
    if (btn) {
      btn.disabled = true;
      document.getElementById('pour-btn-text').textContent = '按住倒入';
    }

    setTimeout(() => {
      const next = this.currentCup + 1;
      if (next < CUPS_PER_ROUND) {
        this.currentCup = next;
        this._activateCup(next);
      } else {
        this._endRound();
      }
    }, 1700);
  }

  // Precision curve
  _calcScore(fill, target) {
    if (fill >= 1.0) return -50;
    const err = Math.abs(fill - target);
    if (err <= 0.01)  return 100;
    if (err <= 0.05)  return Math.round(100 - (err - 0.01) / 0.04 * 30);  // 100→70
    if (err <= 0.10)  return Math.round(70  - (err - 0.05) / 0.05 * 30);  // 70→40
    if (err <= 0.20)  return Math.round(40  - (err - 0.10) / 0.10 * 30);  // 40→10
    return Math.max(0, Math.round(10 - (err - 0.20) / 0.10 * 10));
  }

  _scoreMessage(score) {
    if (score >= 95) return '🎯 完美！精準度滿分！';
    if (score >= 70) return '👍 不錯！很接近目標！';
    if (score >= 40) return '😅 還差一點，繼續加油！';
    if (score < 0)   return '💦 溢出了！小心控制！';
    return '😬 差太多了，再練習！';
  }

  _showCupScore(idx, score) {
    const cup        = this.cups[idx];
    const isPerfect  = score >= 95;
    const isGood     = score >= 70;
    const isOk       = score >= 40;

    // Color-code cup slot (via class on slot, targets ::after border)
    cup.el.classList.remove('glass-perfect', 'glass-good', 'glass-ok', 'glass-bad');
    cup.el.classList.add(isPerfect ? 'glass-perfect' : isGood ? 'glass-good' : isOk ? 'glass-ok' : 'glass-bad');

    // Score popup
    const popup = cup.scoreEl;
    popup.textContent = score >= 0 ? `+${score}` : score;
    popup.className   = `pour-score-popup score-visible ${
      isPerfect ? 'score-perfect' : isGood ? 'score-good' : isOk ? 'score-ok' : 'score-bad'
    }`;
  }

  // ── End round ───────────────────────────────────────

  _endRound() {
    const btn = document.getElementById('pour-btn');
    if (btn) btn.disabled = true;
    this._setHint(`本回合 ${this._roundScore} 分${this.currentRound < TOTAL_ROUNDS ? '，下一回合更快！' : ''}`);

    if (this.currentRound >= TOTAL_ROUNDS) {
      setTimeout(() => this._endGame(), 2000);
    } else {
      setTimeout(() => this._startRound(), 2400);
    }
  }

  // ── End game ────────────────────────────────────────

  _endGame() {
    cancelAnimationFrame(this._rafId);
    const result = this.engine.getResult();
    this.engine.destroy();
    this.ui.showResultScreen({ ...result, gameTitle: '汽水倒倒樂', gameId: 'g11' });
  }

  // ── Helpers ─────────────────────────────────────────

  _setHint(text) {
    const el = document.getElementById('pour-hint');
    if (el) el.textContent = text;
  }
}

// ── Entry point ──────────────────────────────────────
const pourGame = new PourGame();

document.addEventListener('DOMContentLoaded', () => {
  window.gameAudio = new GameAudio().preload(
    ...GameAudio.COMMON,
    'g11-pour-water',
    'g11-soda-fizz',
    'g11-overflow',
    'g11-fill-perfect',
    'g11-cup-done'
  );

  // Build SVG bottle once
  pourGame._buildBottle();

  const btn = document.getElementById('pour-btn');
  if (btn) {
    btn.addEventListener('mousedown',  e => { e.preventDefault(); pourGame.onPourStart(); });
    btn.addEventListener('touchstart', e => { e.preventDefault(); pourGame.onPourStart(); }, { passive: false });
    document.addEventListener('mouseup',     () => pourGame.onPourStop());
    document.addEventListener('touchend',    () => pourGame.onPourStop());
    document.addEventListener('touchcancel', () => pourGame.onPourStop());
  }

  pourGame.init();
});
