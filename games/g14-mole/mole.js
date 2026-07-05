'use strict';

// ── 硬幣面額 ──────────────────────────────────────────────
const COINS = [
  { value:  1, label: '$1',  bg: '#A8A8A8', text: '#222', pts:  50 },
  { value:  5, label: '$5',  bg: '#CD853F', text: '#fff', pts: 100 },
  { value: 10, label: '$10', bg: '#DAA520', text: '#fff', pts: 150 },
  { value: 50, label: '$50', bg: '#FF8C00', text: '#fff', pts: 300 },
];

// ── 遊戲模式 ──────────────────────────────────────────────
const MODE_CONFIG = {
  free: {
    label: '亂打模式',
    emoji: '🔨',
    desc:  '盡情亂打！打越多分越高',
    sub:   '面額越大分越高：$50 最值錢',
  },
  target: {
    label: '指定面額',
    emoji: '🎯',
    desc:  '只打指定面額，打錯扣命',
    sub:   '指定面額打完後，立刻換新目標',
  },
};

// ── 難度設定 ──────────────────────────────────────────────
const DIFF_CONFIG = {
  easy:   { label: '簡單', emoji: '🌱', hint: '1 隻同時出現',  lifetime: 2500, spawnMs: 1800, maxActive: 1 },
  normal: { label: '普通', emoji: '⚡', hint: '最多 2 隻同時', lifetime: 1800, spawnMs: 1300, maxActive: 2 },
  hard:   { label: '困難', emoji: '🔥', hint: '最多 3 隻同時', lifetime: 1100, spawnMs:  900, maxActive: 3 },
};

const GAME_SECS  = 60;
const HOLE_COUNT = 9;

// ══════════════════════════════════════════════════════════
class MoleGame {

  constructor() {
    this.engine   = null;
    this.ui       = null;
    this.mode     = 'free';   // 'free' | 'target'
    this.diff     = null;
    this.holes    = [];
    this.target   = null;
    this._targetHasAppeared = false;
    this.timeLeft = GAME_SECS;
    this._spawnTimer  = null;
    this._countTimer  = null;
    this._ended       = false;
    this._endResult   = null;
  }

  // ── 初始化 ─────────────────────────────────────────────

  init() {
    window.gameAudio = new GameAudio().preload(
      ...GameAudio.COMMON,
      'g2-coin-collect', 'g2-wrong-tap', 'game-btn-click'
    );
    this._buildSetup();
  }

  // ── 設定畫面 ───────────────────────────────────────────

  _buildSetup() {
    this._buildModeGrid();
    this._buildDiffGrid();
  }

  _buildModeGrid() {
    const grid = document.getElementById('ml-mode-grid');
    grid.innerHTML = '';
    Object.entries(MODE_CONFIG).forEach(([key, cfg]) => {
      const card = document.createElement('div');
      card.className = `ml-mode-card${key === this.mode ? ' ml-mode-selected' : ''}`;
      card.dataset.mode = key;
      card.innerHTML = `
        <div class="ml-mode-emoji">${cfg.emoji}</div>
        <div class="ml-mode-name">${cfg.label}</div>
        <div class="ml-mode-desc">${cfg.desc}</div>
        <div class="ml-mode-sub">${cfg.sub}</div>
      `;
      card.addEventListener('click', () => {
        window.gameAudio?.play('game-btn-click');
        this.mode = key;
        grid.querySelectorAll('.ml-mode-card').forEach(c =>
          c.classList.toggle('ml-mode-selected', c.dataset.mode === key)
        );
      });
      grid.appendChild(card);
    });
  }

  _buildDiffGrid() {
    const grid = document.getElementById('ml-diff-grid');
    grid.innerHTML = '';
    Object.entries(DIFF_CONFIG).forEach(([key, cfg]) => {
      const card = document.createElement('div');
      card.className = 'ml-diff-card';
      card.innerHTML = `
        <div class="ml-diff-emoji">${cfg.emoji}</div>
        <div class="ml-diff-name">${cfg.label}</div>
        <div class="ml-diff-hint">${cfg.hint}</div>
      `;
      card.addEventListener('click', () => {
        window.gameAudio?.play('game-btn-click');
        this.diff = key;
        this._enterGame();
      });
      grid.appendChild(card);
    });
  }

  // ── 進入遊戲 ────────────────────────────────────────────

  _enterGame() {
    document.getElementById('ml-setup').classList.add('hidden');
    document.getElementById('ml-game').classList.remove('hidden');

    const maxLives = this.mode === 'target' ? 3 : 0;
    this.engine = new GameEngine({ gameId: 'g14', maxLives, difficulty: this.diff });
    this.ui     = new GameUI();
    this.ui.renderHUD(maxLives);

    this._buildGrid();
    this._setupTargetBar();

    this.engine.on('score', ({ total, combo }) => {
      this.ui.updateScore(total);
      this.ui.showCombo(combo);
    });
    this.engine.on('lifeLost', ({ lives }) => {
      this.ui.updateLives(lives, 3);
      this.ui.showMissEffect();
      window.gameAudio?.play('life-lost');
    });
    this.engine.on('gameOver', result => {
      this._endResult = result;
      this._end();
    });

    this.ui.showCountdown(() => this._start());
  }

  // ── 目標列初始化 ────────────────────────────────────────

  _setupTargetBar() {
    const bar      = document.getElementById('ml-target-bar');
    const label    = document.getElementById('ml-target-label');
    const coinEl   = document.getElementById('ml-target-coin');
    const sep      = bar.querySelector('.ml-timer-sep');

    if (this.mode === 'free') {
      label.textContent = '盡情打！';
      coinEl.classList.add('hidden');
      sep.classList.add('hidden');
    } else {
      label.textContent = '打這個！';
      coinEl.classList.remove('hidden');
      sep.classList.remove('hidden');
      this._pickTarget();
      this._updateTargetCoin(false);
    }
  }

  // ── 建立地洞 ────────────────────────────────────────────

  _buildGrid() {
    const grid = document.getElementById('ml-grid');
    grid.innerHTML = '';
    this.holes = [];

    for (let i = 0; i < HOLE_COUNT; i++) {
      const holeEl = document.createElement('div');
      holeEl.className = 'ml-hole';

      const moleEl = document.createElement('div');
      moleEl.className = 'ml-mole';
      holeEl.appendChild(moleEl);
      grid.appendChild(holeEl);

      const h = { el: holeEl, moleEl, coinIdx: -1, active: false, timer: null };
      this.holes.push(h);

      const doHit = e => { e.preventDefault(); this._onHit(i); };
      holeEl.addEventListener('click', doHit);
      holeEl.addEventListener('touchstart', doHit, { passive: false });
    }
  }

  // ── 開始遊戲 ────────────────────────────────────────────

  _start() {
    this.timeLeft = GAME_SECS;
    this._updateTimerDisplay();
    this.engine.startGlobalTimer();

    const cfg = DIFF_CONFIG[this.diff];

    const spawnLoop = () => {
      if (this._ended) return;
      this._spawnMole();
      const jitter = (Math.random() - 0.5) * 300;
      this._spawnTimer = setTimeout(spawnLoop, cfg.spawnMs + jitter);
    };
    this._spawnTimer = setTimeout(spawnLoop, 500);

    this._countTimer = setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 1);
      this._updateTimerDisplay();
      if (this.timeLeft === 0) this._end();
    }, 1000);
  }

  // ── 地鼠出現 ────────────────────────────────────────────

  _spawnMole() {
    const cfg = DIFF_CONFIG[this.diff];
    if (this.holes.filter(h => h.active).length >= cfg.maxActive) return;

    const idle = this.holes.filter(h => !h.active);
    if (!idle.length) return;

    const h = idle[Math.floor(Math.random() * idle.length)];
    const coinIdx = Math.floor(Math.random() * COINS.length);
    const coin = COINS[coinIdx];

    h.coinIdx = coinIdx;
    h.active  = true;

    // 記錄目標面額出現過
    if (this.mode === 'target' && coin.value === this.target?.value) {
      this._targetHasAppeared = true;
    }

    h.moleEl.innerHTML = `
      <div class="ml-mole-body">
        <div class="ml-mole-face">🐹</div>
        <div class="ml-mole-coin" style="background:${coin.bg};color:${coin.text}">${coin.label}</div>
      </div>
    `;
    h.moleEl.className = 'ml-mole ml-mole-up';

    h.timer = setTimeout(() => {
      if (h.active) {
        this.engine.resetCombo();
        this._hideMole(h);
        if (this.mode === 'target' && !this._ended) this._checkTargetExhausted();
      }
    }, cfg.lifetime);
  }

  _hideMole(h) {
    h.active = false;
    clearTimeout(h.timer);
    h.moleEl.className = 'ml-mole ml-mole-down';
    setTimeout(() => {
      if (!h.active) {
        h.moleEl.className = 'ml-mole';
        h.moleEl.innerHTML = '';
      }
    }, 280);
  }

  // ── 點擊地鼠 ────────────────────────────────────────────

  _onHit(idx) {
    if (this._ended || this.engine.isGameOver()) return;
    const h = this.holes[idx];
    if (!h.active) return;

    const coin = COINS[h.coinIdx];
    const rect = h.el.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;

    if (this.mode === 'free') {
      // 亂打模式：所有地鼠都得分，面額越大分越高
      window.gameAudio?.play('g2-coin-collect');
      this.ui.showHitEffect(cx, cy);
      this.engine.addScore(coin.pts);

    } else {
      // 指定面額模式：打對得分，打錯扣命
      const correct = coin.value === this.target.value;
      if (correct) {
        window.gameAudio?.play('g2-coin-collect');
        this.ui.showHitEffect(cx, cy);
        this.engine.addScore(100);
        this._hideMole(h);
        if (!this._ended) this._checkTargetExhausted();
        return;
      } else {
        window.gameAudio?.play('g2-wrong-tap');
        this.engine.loseLife();
      }
    }

    this._hideMole(h);
  }

  // ── 目標面額耗盡 → 立即換新目標 ────────────────────────

  _checkTargetExhausted() {
    if (!this._targetHasAppeared) return;
    const stillActive = this.holes.some(
      h => h.active && COINS[h.coinIdx].value === this.target.value
    );
    if (!stillActive) {
      this._pickTarget();
      this._updateTargetCoin(true);
    }
  }

  // ── 目標面額 ────────────────────────────────────────────

  _pickTarget() {
    const prev = this.target;
    let next;
    do {
      next = COINS[Math.floor(Math.random() * COINS.length)];
    } while (COINS.length > 1 && next === prev);
    this.target = next;
    this._targetHasAppeared = false;
  }

  _updateTargetCoin(flash) {
    const coinEl = document.getElementById('ml-target-coin');
    coinEl.textContent = this.target.label;
    coinEl.style.background = this.target.bg;
    coinEl.style.color = this.target.text;
    if (flash) {
      const bar = document.getElementById('ml-target-bar');
      bar.classList.remove('ml-target-flash');
      void bar.offsetWidth;
      bar.classList.add('ml-target-flash');
      clearTimeout(this._flashTimer);
      this._flashTimer = setTimeout(() => bar.classList.remove('ml-target-flash'), 600);
    }
  }

  _updateTimerDisplay() {
    const el = document.getElementById('ml-timer');
    if (!el) return;
    el.textContent = this.timeLeft;
    el.classList.toggle('ml-timer-danger', this.timeLeft <= 10);
  }

  // ── 遊戲結束 ────────────────────────────────────────────

  _end() {
    if (this._ended) return;
    this._ended = true;

    clearTimeout(this._spawnTimer);
    clearInterval(this._countTimer);
    this.holes.forEach(h => { if (h.active) this._hideMole(h); });

    const result = this._endResult ?? this.engine.getResult();
    this.engine.destroy();
    const sfxKey = result.isNewRecord ? 'new-highscore'
                 : result.score > 0   ? 'win-round'
                 :                      'game-over-common';

    setTimeout(() => {
      window.gameAudio?.playThen(sfxKey, () => {});
      this.ui.showResultScreen({
        score:       result.score,
        maxCombo:    result.maxCombo,
        elapsed:     result.elapsed,
        highScore:   result.highScore,
        isNewRecord: result.isNewRecord,
        gameTitle:   '🪙 打地鼠賺金幣',
        gameId:      'g14',
      });
    }, 600);
  }
}

// ── 啟動 ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => new MoleGame().init());
