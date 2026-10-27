/* G10 硬幣躲貓貓
 * 記住哪個杯子藏著東西，洗牌後猜出來！
 * 模式：一般挑戰（生命值）／限時挑戰（倒數 60 秒）
 * 難度：2 / 3 / 4 個杯子
 */

const CUP_ITEMS = [
  '🪙','💎','⭐','🎁','🍎','🍬','🏅','🐣',
  '🌈','🎀','🦊','🍩','🎯','🐠','🍓','🎪',
  '🌸','🦄','💫','🎵',
];

const DIFF_CFG = {
  easy:   { cups: 2, swaps: 4,  swapMs: 650, revealMs: 2000, pts: 100, lives: 5, taBonus: 3, taPenalty: 4 },
  normal: { cups: 3, swaps: 7,  swapMs: 460, revealMs: 1500, pts: 150, lives: 3, taBonus: 2, taPenalty: 3 },
  hard:   { cups: 4, swaps: 11, swapMs: 310, revealMs: 1200, pts: 200, lives: 3, taBonus: 2, taPenalty: 4 },
};

class CupGame {
  constructor() {
    this.engine        = null;
    this.ui            = new GameUI();
    this.diff          = 'easy';
    this.mode          = 'standard'; // 'standard' | 'timeattack'

    // Cup & slot state
    this.cups    = [];   // [{ id, hasItem, el, _handler }]
    this.slots   = [];   // slots[slotIdx] = cupId at that slot
    this.cupSlot = [];   // cupSlot[cupId] = current slot index

    this.phase         = 'idle';
    this._shuffleTid   = null;
    this._timeTid      = null;
    this._guessHandled = false;
    this.timeLeft      = 60;
    this.currentEmoji  = '';
    this.round         = 0;
  }

  init() { this._showSetup(); }

  // ── Setup screen ────────────────────────────────────

  _showSetup() {
    const ov = document.createElement('div');
    ov.className = 'gue-difficulty-overlay';
    ov.innerHTML = `
      <div class="gue-difficulty-card">
        <a href="../index.html" class="gue-back-link">← 遊戲選單</a>
        <div class="gue-difficulty-title">🏺 硬幣躲貓貓</div>
        <div class="gue-difficulty-sub">記住藏在哪個杯子裡<br>洗牌結束後，猜出來！</div>

        <div class="cup-setup-section-label">難度</div>
        <div class="cup-diff-group">
          <button class="cup-diff-opt cup-diff-opt-active" data-diff="easy">
            <span class="cup-opt-icon">🟢</span>
            <span class="cup-opt-label">簡單</span>
            <span class="cup-opt-desc">2 杯・慢速</span>
          </button>
          <button class="cup-diff-opt" data-diff="normal">
            <span class="cup-opt-icon">🟡</span>
            <span class="cup-opt-label">普通</span>
            <span class="cup-opt-desc">3 杯・中速</span>
          </button>
          <button class="cup-diff-opt" data-diff="hard">
            <span class="cup-opt-icon">🔴</span>
            <span class="cup-opt-label">困難</span>
            <span class="cup-opt-desc">4 杯・快速</span>
          </button>
        </div>

        <div class="cup-setup-section-label">模式</div>
        <div class="cup-mode-group">
          <button class="cup-mode-opt cup-mode-opt-active" data-mode="standard">
            <span class="cup-mode-icon">❤️</span>
            <div class="cup-mode-info">
              <div class="cup-mode-name">一般挑戰</div>
              <div class="cup-mode-desc">有生命值・越玩洗牌越快</div>
            </div>
          </button>
          <button class="cup-mode-opt" data-mode="timeattack">
            <span class="cup-mode-icon">⏱️</span>
            <div class="cup-mode-info">
              <div class="cup-mode-name">限時挑戰</div>
              <div class="cup-mode-desc">倒數 60 秒・答對加時・答錯扣時</div>
            </div>
          </button>
        </div>

        <button id="cup-start-btn" class="cup-start-btn">開始遊戲 🚀</button>
      </div>
    `;
    document.body.appendChild(ov);

    ov.querySelectorAll('[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        ov.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('cup-diff-opt-active'));
        btn.classList.add('cup-diff-opt-active');
        this.diff = btn.dataset.diff;
      });
    });

    ov.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        ov.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('cup-mode-opt-active'));
        btn.classList.add('cup-mode-opt-active');
        this.mode = btn.dataset.mode;
      });
    });

    ov.querySelector('#cup-start-btn').addEventListener('click', () => {
      ov.remove();
      this._startGame();
    });
  }

  // ── Game start ──────────────────────────────────────

  _startGame() {
    const cfg = DIFF_CFG[this.diff];
    const maxLives = this.mode === 'standard' ? cfg.lives : 99;
    this.engine = new GameEngine({ gameId: 'g10', maxLives, difficulty: this.diff });
    this.ui.renderHUD(this.mode === 'standard' ? cfg.lives : 0);
    this.ui.updateScore(0);

    this.engine.on('score',    ({ total }) => this.ui.updateScore(total));
    this.engine.on('lifeLost', ({ lives }) => {
      if (this.mode === 'standard') this.ui.updateLives(lives, cfg.lives);
    });
    this.engine.on('gameOver', result => this._endGame(result));

    if (this.mode === 'timeattack') {
      this.timeLeft = 60;
      this._injectTimerBar();
    }

    this.engine.startGlobalTimer();
    this.ui.showCountdown(() => {
      if (this.mode === 'timeattack') this._runTimer();
      this._startRound();
    });
  }

  // ── Time attack timer ────────────────────────────────

  _injectTimerBar() {
    const el = document.createElement('div');
    el.id = 'cup-timer-wrap';
    el.innerHTML = `
      <div id="cup-timer-bar-track">
        <div id="cup-timer-bar"></div>
      </div>
      <div id="cup-timer-label">60s</div>
    `;
    document.getElementById('cup-stage').prepend(el);
  }

  _runTimer() {
    const tick = () => {
      if (this.engine.isGameOver()) return;
      this.timeLeft = Math.max(0, this.timeLeft - 0.1);
      const bar   = document.getElementById('cup-timer-bar');
      const label = document.getElementById('cup-timer-label');
      if (bar) {
        bar.style.width = (this.timeLeft / 60 * 100) + '%';
        if (this.timeLeft < 10) bar.style.background = 'linear-gradient(90deg,#ef4444,#dc2626)';
        else bar.style.background = '';
      }
      if (label) {
        label.textContent = Math.ceil(this.timeLeft) + 's';
        label.classList.toggle('cup-timer-danger', this.timeLeft < 10);
      }
      if (this.timeLeft <= 0) { this._forceEnd(); return; }
      this._timeTid = setTimeout(tick, 100);
    };
    this._timeTid = setTimeout(tick, 100);
  }

  _forceEnd() {
    clearTimeout(this._shuffleTid);
    clearTimeout(this._timeTid);
    this._endGame(this.engine.getResult());
  }

  // ── Round ────────────────────────────────────────────

  _startRound() {
    if (this.engine.isGameOver()) return;
    if (this.mode === 'timeattack' && this.timeLeft <= 0) return;
    this.round++;
    this._setInfo(`第 ${this.round} 回合`);

    const cfg = DIFF_CFG[this.diff];
    this.currentEmoji = CUP_ITEMS[Math.floor(Math.random() * CUP_ITEMS.length)];
    this._buildArena(cfg.cups);

    const hiddenId = Math.floor(Math.random() * cfg.cups);
    this.cups.forEach((c, i) => { c.hasItem = i === hiddenId; });

    this._setPhase(`記住 ${this.currentEmoji} 在哪！`);
    setTimeout(() => this._revealPhase(hiddenId), 250);
  }

  _buildArena(n) {
    const arena = document.getElementById('cup-arena');
    arena.innerHTML = '';
    arena.dataset.cups = n;
    this.cups    = [];
    this.slots   = Array.from({ length: n }, (_, i) => i);
    this.cupSlot = Array.from({ length: n }, (_, i) => i);

    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'cup-wrap';
      el.dataset.id = i;
      el.innerHTML = `
        <div class="cup-item"></div>
        <div class="cup-shell">
          <div class="cup-rim"></div>
          <div class="cup-body"></div>
        </div>
      `;
      el.style.left = `${((i + 0.5) / n) * 100}%`;
      arena.appendChild(el);
      this.cups.push({ id: i, hasItem: false, el, _handler: null });
    }
  }

  // ── Reveal phase ─────────────────────────────────────

  _revealPhase(hiddenId) {
    this.phase = 'reveal';
    const cup = this.cups[hiddenId];
    cup.el.querySelector('.cup-item').textContent = this.currentEmoji;
    cup.el.classList.add('cup-has-item', 'cup-lifted');

    setTimeout(() => {
      cup.el.classList.remove('cup-lifted');
      this._setPhase('跟好了！👀');
      setTimeout(() => this._shufflePhase(), 550);
    }, DIFF_CFG[this.diff].revealMs);
  }

  // ── Shuffle phase ────────────────────────────────────

  _shufflePhase() {
    if (this.engine.isGameOver()) return;
    if (this.mode === 'timeattack' && this.timeLeft <= 0) return;
    this.phase = 'shuffle';

    const cfg   = DIFF_CFG[this.diff];
    const lvl   = this.engine.getScaleLevel();
    const total = cfg.swaps + lvl * 2;
    const ms    = Math.max(190, cfg.swapMs - lvl * 40);
    const moves = this._genMoves(this.cups.length, total);
    let idx = 0;

    const next = () => {
      if (this.engine.isGameOver()) return;
      if (this.mode === 'timeattack' && this.timeLeft <= 0) return;
      if (idx >= moves.length) {
        setTimeout(() => this._guessPhase(), 380);
        return;
      }
      const [a, b] = moves[idx++];
      this._swap(a, b, ms);
      this._shuffleTid = setTimeout(next, ms + 80);
    };
    next();
  }

  // Generate shuffle moves (slot-based)
  _genMoves(n, count) {
    const out = [];
    let la = -1, lb = -1;
    for (let i = 0; i < count; i++) {
      let a, b, t = 0;
      do {
        a = Math.floor(Math.random() * n);
        b = Math.floor(Math.random() * n);
        t++;
        if (t > 30) break;
      } while (
        a === b ||
        (a === la && b === lb) ||
        (n > 2 && a === lb && b === la)   // no immediate reversal for 3+ cups
      );
      if (a !== b) { out.push([a, b]); la = a; lb = b; }
    }
    return out;
  }

  // Swap cups currently at slot sA and slot sB, animate with CSS transition
  _swap(sA, sB, ms) {
    const cA = this.slots[sA], cB = this.slots[sB];
    this.slots[sA] = cB;   this.slots[sB] = cA;
    this.cupSlot[cA] = sB; this.cupSlot[cB] = sA;

    const n   = this.cups.length;
    const pct = s => `${((s + 0.5) / n) * 100}%`;
    const tr  = `left ${ms}ms cubic-bezier(.4,0,.2,1)`;
    const eA  = this.cups[cA].el, eB = this.cups[cB].el;
    eA.style.transition = tr;
    eB.style.transition = tr;
    eA.style.left = pct(sB);
    eB.style.left = pct(sA);
  }

  // ── Guess phase ──────────────────────────────────────

  _guessPhase() {
    if (this.engine.isGameOver()) return;
    if (this.mode === 'timeattack' && this.timeLeft <= 0) return;
    this.phase = 'guess';
    this._guessHandled = false;
    this._setPhase('猜猜看！點一個杯子 👇');

    this.cups.forEach(c => {
      c.el.classList.add('cup-guessable');
      c._handler = () => this._onGuess(c.id);
      c.el.addEventListener('click', c._handler);
    });
  }

  _onGuess(id) {
    if (this.phase !== 'guess' || this._guessHandled) return;
    this._guessHandled = true;
    this.phase = 'result';

    // Remove all listeners and guessable style
    this.cups.forEach(c => {
      c.el.removeEventListener('click', c._handler);
      c.el.classList.remove('cup-guessable');
    });

    const cfg = DIFF_CFG[this.diff];
    const ok  = this.cups[id].hasItem;

    // Lift the clicked cup
    this.cups[id].el.classList.add('cup-lifted');

    if (ok) {
      const r   = this.cups[id].el.getBoundingClientRect();
      const cx  = r.left + r.width / 2;
      const cy  = r.top  + r.height * 0.3;
      const pts = this.engine.addScore(cfg.pts);
      this.ui.showScorePopup(cx, cy, pts);
      this.ui.showHitEffect(cx, r.top + r.height / 2);
      this.ui.showCombo(this.engine.combo);
      this._setPhase('✅ 猜對了！');
      if (this.mode === 'timeattack') this._tweakTime(cfg.taBonus, true);
      window.gameAudio?.play('win-round');
    } else {
      this._setPhase('❌ 猜錯了！');
      // Reveal correct cup 350ms later
      const correct = this.cups.find(c => c.hasItem);
      if (correct) setTimeout(() => correct.el.classList.add('cup-lifted'), 350);
      if (this.mode === 'standard') {
        this.engine.loseLife();
        this.ui.showMissEffect();
      } else {
        this.ui.showMissEffect();
        this._tweakTime(-cfg.taPenalty, false);
      }
      window.gameAudio?.play('life-lost');
    }

    if (!this.engine.isGameOver() && !(this.mode === 'timeattack' && this.timeLeft <= 0)) {
      setTimeout(() => this._startRound(), 1850);
    }
  }

  _tweakTime(delta, positive) {
    this.timeLeft = Math.max(0, Math.min(60, this.timeLeft + delta));
    const bar = document.getElementById('cup-timer-bar');
    if (bar) {
      bar.style.background = positive
        ? 'linear-gradient(90deg,#4ade80,#86efac)'
        : 'linear-gradient(90deg,#ef4444,#f87171)';
      setTimeout(() => { if (bar) bar.style.background = ''; }, 480);
    }
    if (this.timeLeft <= 0) this._forceEnd();
  }

  // ── Game end ─────────────────────────────────────────

  _endGame(result) {
    clearTimeout(this._shuffleTid);
    clearTimeout(this._timeTid);
    this._guessHandled = true;  // 防止結果畫面出現前的殘留點擊
    this.engine.destroy();
    this._setPhase('遊戲結束！');
    setTimeout(() => {
      this.ui.showResultScreen({
        ...result,
        gameTitle: '硬幣躲貓貓',
        gameId: 'g10',
      });
    }, 600);
  }

  // ── Helpers ──────────────────────────────────────────

  _setPhase(text) {
    const el = document.getElementById('cup-phase-text');
    if (el) el.textContent = text;
  }

  _setInfo(text) {
    const el = document.getElementById('cup-info');
    if (el) el.textContent = text;
  }
}

const game = new CupGame();
document.addEventListener('DOMContentLoaded', () => {
  window.gameAudio = new GameAudio().preload(...GameAudio.COMMON);
  game.init();
});
