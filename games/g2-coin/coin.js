/* G2 錢幣接接樂 — 遊戲邏輯 */

// ── 硬幣規格（含 200 元、1000 元）────────────────────────
// weight 決定隨機出現機率（越大越常出現）
const COIN_TYPES = [
  { value: 1,    size: 52, outer: '#9BAABB', inner: '#C8D4E0', text: '#334',    weight: 4 },
  { value: 5,    size: 56, outer: '#8A9BAC', inner: '#B0BEC8', text: '#223',    weight: 4 },
  { value: 10,   size: 62, outer: '#B8922E', inner: '#E8C050', text: '#5C3A00', weight: 3 },
  { value: 50,   size: 66, outer: '#C8A828', inner: '#F0D050', text: '#5C3A00', weight: 2 },
  { value: 100,  size: 72, outer: '#DAA520', inner: '#B83228', text: '#fff',    weight: 2 },
  { value: 200,  size: 75, outer: '#B8702A', inner: '#E09050', text: '#fff',    weight: 1 },
  { value: 500,  size: 78, outer: '#A87820', inner: '#FFD040', text: '#fff',    weight: 1 },
  { value: 1000, size: 82, outer: '#7B5EA7', inner: '#B09CC0', text: '#fff',    weight: 1 },
];

const COIN_MAP = Object.fromEntries(COIN_TYPES.map(c => [c.value, c]));

const COIN_IMG = {
  1:    { f: '../../images/money/1_yuan_front.png',    b: '../../images/money/1_yuan_back.png' },
  5:    { f: '../../images/money/5_yuan_front.png',    b: '../../images/money/5_yuan_back.png' },
  10:   { f: '../../images/money/10_yuan_front.png',   b: '../../images/money/10_yuan_back.png' },
  50:   { f: '../../images/money/50_yuan_front.png',   b: '../../images/money/50_yuan_back.png' },
  100:  { f: '../../images/money/100_yuan_front.png',  b: '../../images/money/100_yuan_back.png' },
  200:  { f: '../../images/money/200_yuan_front.png',  b: '../../images/money/200_yuan_back.png' },
  500:  { f: '../../images/money/500_yuan_front.png',  b: '../../images/money/500_yuan_back.png' },
  1000: { f: '../../images/money/1000_yuan_front.png', b: '../../images/money/1000_yuan_back.png' },
};

// ── 難度設定 ──────────────────────────────────────────
const DIFF_CONFIG = {
  easy: {
    coinValues:    [1, 5, 10, 50],
    targetRange:   [5, 60],
    targetStep:    1,
    spawnInterval: 2200,
    baseSpeed:     65,
    timeSeconds:   120,
  },
  normal: {
    coinValues:    [1, 5, 10, 50, 100, 200],
    targetRange:   [20, 300],
    targetStep:    5,
    spawnInterval: 1800,
    baseSpeed:     95,
    timeSeconds:   90,
  },
  hard: {
    coinValues:    [1, 5, 10, 50, 100, 200, 500, 1000],
    targetRange:   [100, 1500],
    targetStep:    10,
    spawnInterval: 1500,
    baseSpeed:     130,
    timeSeconds:   60,
  },
};

// ── 點擊模式難度設定 ──────────────────────────────────
const DIFF_CONFIG_TAP_COIN = {
  easy:   { coinValues: [1, 5, 10, 50],                      spawnInterval: 1900, baseSpeed: 62,  timeSeconds: 90, targetDurRange: [4000, 8000], guaranteeCount: 2 },
  normal: { coinValues: [1, 5, 10, 50, 100, 200],             spawnInterval: 1500, baseSpeed: 90,  timeSeconds: 60, targetDurRange: [3000, 6000], guaranteeCount: 2 },
  hard:   { coinValues: [1, 5, 10, 50, 100, 200, 500, 1000], spawnInterval: 1200, baseSpeed: 118, timeSeconds: 45, targetDurRange: [2000, 4500], guaranteeCount: 1 },
};

const SCALE_SPEED_BONUS = 15;
const MARGIN = 16;

// ── CoinGame ──────────────────────────────────────────

class CoinGame {
  constructor() {
    this.engine          = null;
    this.ui              = new GameUI();
    this.coins           = [];      // { id, el, value, y, speed, size, isGuarantee }
    this.wallet          = 0;
    this.collected       = [];
    this.target          = 0;
    this.difficulty      = 'normal';
    this.mode            = 'sum';  // 'sum' | 'tap'
    this._tapGameTimer   = null;
    this._sumGameTimer   = null;
    this._timeUp         = false;
    this.spawnTimer      = null;
    this.rafId           = null;
    this.lastTime        = 0;
    this.gameArea        = null;
    this.isRunning       = false;
    this._lastScale      = 0;
    this._idCounter      = 0;
    this._guaranteeQueue = [];
  }

  init() {
    this.gameArea = document.getElementById('game-area');
    this.ui.renderHUD(3);
    this._showModeSelect();
  }

  // ── 模式選擇 ─────────────────────────────────────

  _showModeSelect() {
    const overlay = document.createElement('div');
    overlay.className = 'gue-difficulty-overlay';
    overlay.innerHTML = `
      <div class="gue-difficulty-card">
        <a href="../index.html" class="gue-back-link">← 遊戲選單</a>
        <div class="gue-difficulty-title">🪙 錢幣接接樂</div>
        <div class="gue-difficulty-sub">選擇遊戲模式</div>
        <button class="gue-diff-btn gue-diff-normal" data-mode="sum">
          💰 湊額模式 <span class="gue-diff-badge">湊到目標金額</span>
        </button>
        <button class="gue-diff-btn gue-diff-easy" data-mode="tap">
          🎯 點擊模式 <span class="gue-diff-badge">找出指定幣值</span>
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.mode = btn.dataset.mode;
        overlay.remove();
        this._showDifficultySelect();
      });
    });
  }

  // ── 難度選擇 ─────────────────────────────────────

  _showDifficultySelect() {
    const isTap = this.mode === 'tap';
    const overlay = document.createElement('div');
    overlay.className = 'gue-difficulty-overlay';
    overlay.innerHTML = `
      <div class="gue-difficulty-card">
        <button class="gue-back-link" data-back>← 返回</button>
        <div class="gue-difficulty-title">${isTap ? '🎯 點擊模式' : '💰 湊額模式'}</div>
        <div class="gue-difficulty-sub">${isTap
          ? '看到目標幣值的硬幣，馬上點擊！'
          : '點擊硬幣收集，<br>剛好湊到目標金額！'}</div>
        <button class="gue-diff-btn gue-diff-easy"   data-diff="easy">
          簡單 <span class="gue-diff-badge">1~50 元・${isTap ? '90' : '120'} 秒</span>
        </button>
        <button class="gue-diff-btn gue-diff-normal" data-diff="normal">
          普通 <span class="gue-diff-badge">1~200 元・${isTap ? '60' : '90'} 秒</span>
        </button>
        <button class="gue-diff-btn gue-diff-hard"   data-diff="hard">
          困難 <span class="gue-diff-badge">1~1000 元・${isTap ? '45' : '60'} 秒</span>
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelectorAll('[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.difficulty = btn.dataset.diff;
        overlay.remove();
        this._showStyleSelect();
      });
    });
    overlay.querySelector('[data-back]').addEventListener('click', () => { overlay.remove(); this._showModeSelect(); });
  }

  // ── 顯示樣式選擇 ──────────────────────────────────

  _showStyleSelect() {
    const overlay = document.createElement('div');
    overlay.className = 'gue-difficulty-overlay';
    overlay.innerHTML = `
      <div class="gue-difficulty-card">
        <button class="gue-back-link" data-back>← 返回</button>
        <div class="gue-difficulty-title">顯示樣式</div>
        <div class="gue-difficulty-sub">選擇硬幣的顯示方式</div>
        <button class="gue-diff-btn gue-diff-easy" data-style="number">
          🔢 數字樣式 <span class="gue-diff-badge">彩色圓形硬幣</span>
        </button>
        <button class="gue-diff-btn gue-diff-normal" data-style="image">
          🪙 真實圖示 <span class="gue-diff-badge">實際幣鈔圖片</span>
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelectorAll('[data-style]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.coinStyle = btn.dataset.style;
        overlay.remove();
        // 在倒數開始前初始化音效，讓倒數 3/2/1/Go 能正常播放
        window.gameAudio = new GameAudio().preload(
          ...GameAudio.COMMON, 'g2-coin-collect', 'g2-wrong-tap', 'g2-timer-warning'
        );
        this.ui.showCountdown(() => this._start());
      });
    });
    overlay.querySelector('[data-back]').addEventListener('click', () => { overlay.remove(); this._showDifficultySelect(); });
  }

  // ── 遊戲啟動 ─────────────────────────────────────

  _start() {
    const isTap = this.mode === 'tap';
    this.engine = new GameEngine({
      gameId: 'g2',
      maxLives: isTap ? 0 : 3,
      difficulty: this.difficulty,
    });
    this.engine.startGlobalTimer();
    this.isRunning = true;

    this._timeUp = false;
    this._setupEngineListeners();
    if (isTap) {
      this._setupTapModeUI();
      this._startTapGameTimer();
    } else {
      this._startSumModeTimer();
    }
    this._generateTarget();
    this._startSpawning();

    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(ts => this._loop(ts));

    const hint = document.getElementById('hint-text');
    if (hint) setTimeout(() => hint.remove(), 5500);
  }

  // ── Engine 監聽 ───────────────────────────────────

  _setupEngineListeners() {
    this.engine.on('score', ({ total, combo }) => {
      this.ui.updateScore(total);
      if (combo >= 3) this.ui.showCombo(combo);

      const newScale = this.engine.getScaleLevel();
      if (newScale > this._lastScale) {
        this._lastScale = newScale;
        this._showLevelUp(newScale);
      }
    });

    this.engine.on('lifeLost', ({ lives }) => {
      if (this.mode === 'tap') return;
      if (this._timeUp) return;   // 時間到觸發的連續扣血不顯示效果
      window.gameAudio?.play('life-lost');
      this.ui.updateLives(lives, 3);
      this.ui.showMissEffect();
    });

    this.engine.on('gameOver', result => {
      window.gameAudio?.play(result.isNewRecord ? 'new-highscore' : 'game-over-common');
      this._stop();
      setTimeout(() => {
        this.ui.showResultScreen({
          ...result,
          gameTitle: '錢幣接接樂',
          gameId: 'g2',
        });
      }, 450);
    });
  }

  // ── 目標金額 ──────────────────────────────────────

  _generateTarget() {
    if (this.mode === 'tap') {
      const cfg = DIFF_CONFIG_TAP_COIN[this.difficulty];
      // 隨機選一個不重複的幣值作為目標
      let newTarget;
      do {
        newTarget = cfg.coinValues[Math.floor(Math.random() * cfg.coinValues.length)];
      } while (newTarget === this.target && cfg.coinValues.length > 1);
      this.target = newTarget;

      const targetEl = document.getElementById('target-display');
      if (targetEl) targetEl.textContent = this.target;
      this._animateTapTargetChange();

      // 保障幣：guaranteeCount 顆目標幣值必定出現
      this._guaranteeQueue = Array(cfg.guaranteeCount).fill(this.target);

      // 計時條倒數 → 時間到自動換目標（不扣命）
      const [durMin, durMax] = cfg.targetDurRange;
      const durSec = (durMin + Math.random() * (durMax - durMin)) / 1000;
      this.engine.startQuestionTimer(
        durSec,
        (ratio) => {
          const fill = document.getElementById('target-timer-fill');
          if (fill) { fill.style.width = `${ratio * 100}%`; fill.classList.toggle('danger', ratio < 0.3); }
        },
        () => { if (this.isRunning && !this.engine.isGameOver()) this._generateTarget(); }
      );
      return;
    }

    // 湊額模式
    const cfg = DIFF_CONFIG[this.difficulty];
    const [min, max] = cfg.targetRange;
    const step = cfg.targetStep;
    const scaleBonus = (this.engine ? this.engine.getScaleLevel() : 0) * (step * 2);
    const range = Math.floor((max - min) / step);
    this.target = min + Math.floor(Math.random() * range) * step + scaleBonus;
    this._resetWallet();
    this._guaranteeQueue = this._makeGuaranteeCoins(this.target);
  }

  // ── 點擊模式 UI 設置 ──────────────────────────────

  _setupTapModeUI() {
    const panel = document.getElementById('target-panel');
    if (panel) panel.classList.add('mode-tap');
    const firstLabel = document.querySelector('#target-row .tp-label');
    if (firstLabel) firstLabel.textContent = '找';
    const arrow = document.querySelector('#target-row .tp-arrow');
    if (arrow) arrow.style.display = 'none';
    ['wallet-label', 'wallet-display', 'wallet-unit'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const bar = document.getElementById('wallet-bar');
    if (bar) bar.style.display = 'none';
    const livesEl = document.getElementById('gue-lives');
    if (livesEl) livesEl.innerHTML = '';
  }

  // ── 點擊模式：目標切換彈跳動畫 ──────────────────────

  _animateTapTargetChange() {
    const el = document.getElementById('target-display');
    if (!el) return;
    el.classList.remove('tap-target-new');
    void el.offsetWidth;
    el.classList.add('tap-target-new');
    setTimeout(() => el.classList.remove('tap-target-new'), 380);
  }

  // ── 點擊模式：全域 60 秒計時器 ──────────────────────

  _startTapGameTimer() {
    const { timeSeconds } = DIFF_CONFIG_TAP_COIN[this.difficulty];
    let remaining = timeSeconds;
    this.ui.updateTimer(1.0);
    this._tapGameTimer = setInterval(() => {
      if (!this.isRunning || this.engine.isGameOver()) { clearInterval(this._tapGameTimer); return; }
      remaining--;
      this.ui.updateTimer(remaining / timeSeconds);
      if (remaining <= 0) {
        clearInterval(this._tapGameTimer);
        this.isRunning = false;
        this.engine.loseLife(); // maxLives=0 → 觸發 gameOver
      }
    }, 1000);
  }

  // ── 湊額模式：全域倒數計時 ───────────────────────────

  _startSumModeTimer() {
    const { timeSeconds } = DIFF_CONFIG[this.difficulty];
    let remaining = timeSeconds;
    this.ui.updateTimer(1.0);
    this._sumGameTimer = setInterval(() => {
      if (!this.isRunning || this.engine.isGameOver()) { clearInterval(this._sumGameTimer); return; }
      remaining--;
      this.ui.updateTimer(remaining / timeSeconds);
      if (remaining <= 0) {
        clearInterval(this._sumGameTimer);
        this._timeUp = true;
        this.isRunning = false;
        // 時間到：連續扣血觸發 gameOver
        for (let i = 0; i < 3; i++) {
          if (!this.engine.isGameOver()) this.engine.loseLife();
        }
      }
    }, 1000);
  }

  // ── 保障幣隊列：用貪心分解目標金額，確保這些面額的硬幣必定出現 ──

  _makeGuaranteeCoins(amount) {
    const values = [...DIFF_CONFIG[this.difficulty].coinValues].sort((a, b) => b - a);
    const result = [];
    let rem = amount;
    for (const v of values) {
      while (rem >= v) { result.push(v); rem -= v; }
    }
    // 洗牌，避免保障幣全部連續出現
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  _resetWallet() {
    this.wallet = 0;
    this.collected = [];
    this.coins.forEach(c => {
      c.collected = false;
      c.el.classList.remove('collected');
    });
    this._updateWalletUI();
  }

  // ── 硬幣產生 ──────────────────────────────────────

  _pickCoinType() {
    const values = this.mode === 'tap'
      ? DIFF_CONFIG_TAP_COIN[this.difficulty].coinValues
      : DIFF_CONFIG[this.difficulty].coinValues;
    return this._pickCoinTypeFromValues(values);
  }

  _pickCoinTypeFromValues(values) {
    const available = COIN_TYPES.filter(c => values.includes(c.value));
    const total = available.reduce((s, c) => s + c.weight, 0);
    let rand = Math.random() * total;
    for (const coin of available) {
      rand -= coin.weight;
      if (rand <= 0) return coin;
    }
    return available[available.length - 1];
  }

  _spawnCoin() {
    if (!this.isRunning || this.engine.isGameOver()) return;

    const cfg = this.mode === 'tap'
      ? DIFF_CONFIG_TAP_COIN[this.difficulty]
      : DIFF_CONFIG[this.difficulty];
    // 優先從保障隊列取出面額，確保目標可達成
    let type, isGuarantee = false;
    if (this._guaranteeQueue.length > 0) {
      const v = this._guaranteeQueue.shift();
      type = COIN_TYPES.find(c => c.value === v) || this._pickCoinType();
      isGuarantee = true;
    } else {
      type = this._pickCoinType();
    }
    const { value, size: baseSize, outer, inner, text } = type;
    const isImageMode = this.coinStyle === 'image';
    const isBill = value >= 100;

    // 圖示模式放大 1.3×；數字模式紙鈔寬 1.6× 呈現長方形
    const dispH = isImageMode ? Math.round(baseSize * 1.3) : baseSize;
    const dispW = isImageMode ? Math.round(baseSize * 1.3)
                : (isBill ? Math.round(baseSize * 1.6) : baseSize);

    const areaW = this.gameArea.clientWidth;
    const x = Math.random() * (areaW - dispW - MARGIN * 2) + MARGIN;
    const startY = -(dispH + 10);
    const speed = cfg.baseSpeed + this.engine.getScaleLevel() * SCALE_SPEED_BONUS;

    const id = ++this._idCounter;
    const el = document.createElement('div');
    el.className = 'coin';
    if (!isImageMode && isBill) el.classList.add('coin-bill');

    el.style.cssText = `
      left: ${x}px;
      top: 0;
      width: ${dispW}px;
      height: ${dispH}px;
      transform: translateY(${startY}px);
      --outer: ${outer};
      --inner: ${inner};
      --text: ${text};
      --size: ${dispH}px;
    `;
    if (isImageMode) {
      el.classList.add('coin-img-mode');
      const faces = COIN_IMG[value];
      const src = Math.random() < 0.5 ? faces.f : faces.b;
      el.innerHTML = `<img class="coin-img" src="${src}" alt="${value}元" draggable="false">`;
    } else {
      el.innerHTML = `
        <div class="coin-inner">
          <span class="coin-label">${value}</span>
          <span class="coin-unit">元</span>
        </div>
      `;
    }
    el.dataset.id = id;

    const onTap = e => {
      e.preventDefault();
      this._onCoinTap(id);
    };
    el.addEventListener('click', onTap);
    el.addEventListener('touchstart', onTap, { passive: false });

    this.gameArea.appendChild(el);
    this.coins.push({ id, el, value, y: startY, speed, size: dispH, isGuarantee });
  }

  // ── 硬幣點擊 ──────────────────────────────────────

  _onCoinTap(id) {
    if (!this.isRunning || this.engine.isGameOver()) return;
    const coin = this.coins.find(c => c.id === id);
    if (!coin || coin.removed || coin.collected) return;

    // ── 點擊模式 ─────────────────────────────────────
    if (this.mode === 'tap') {
      if (coin.value === this.target) {
        this._onTapHit(coin);
      } else {
        coin.el.style.setProperty('--cy', `${coin.y}px`);
        coin.el.classList.add('reject');
        setTimeout(() => { if (!coin.removed) coin.el.classList.remove('reject'); }, 400);
      }
      return;
    }

    // ── 湊額模式 ─────────────────────────────────────
    // 目標已達成，等待 _generateTarget 切換新目標，期間忽略點擊
    if (this.wallet === this.target) return;

    const newSum = this.wallet + coin.value;

    if (newSum > this.target) {
      this._overshoot(coin);
    } else {
      this._collectCoin(coin);
      if (this.wallet === this.target) {
        this._onTargetReached();
      }
    }
  }

  _collectCoin(coin) {
    coin.collected = true;
    this.wallet += coin.value;
    this.collected.push(coin.id);

    // 記錄目前 y 位置供 CSS 動畫用
    coin.el.style.setProperty('--cy', `${coin.y}px`);
    coin.el.classList.add('collected');
    this._updateWalletUI();

    setTimeout(() => {
      coin.removed = true;
      coin.el.remove();
      this.coins = this.coins.filter(c => c.id !== coin.id);
      this.collected = this.collected.filter(id => id !== coin.id);
    }, 320);
  }

  // ── 點擊模式：點中目標幣值（目標由計時器自動切換）──────

  _onTapHit(coin) {
    coin.removed = true;
    coin.collected = true;
    const rect = coin.el.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    coin.el.style.setProperty('--cy', `${coin.y}px`);
    coin.el.classList.add('collected');
    setTimeout(() => {
      coin.el.remove();
      this.coins = this.coins.filter(c => c.id !== coin.id);
    }, 320);
    window.gameAudio?.play('g2-coin-collect');
    const points = this.engine.addScore(100);
    this.ui.showScorePopup(cx, cy - 20, points);
    this.ui.showHitEffect(cx, cy);
  }

  // ── 達成目標 ──────────────────────────────────────

  _onTargetReached() {
    const cx = this.gameArea.clientWidth  / 2;
    const cy = this.gameArea.clientHeight / 2;

    window.gameAudio?.play('g2-coin-collect');
    const basePoints = 100;
    const points = this.engine.addScore(basePoints);
    this.ui.showScorePopup(cx, cy - 40, points);
    this.ui.showHitEffect(cx, cy);

    setTimeout(() => {
      if (!this.engine.isGameOver()) this._generateTarget();
    }, 350);
  }

  // ── 超出目標 ──────────────────────────────────────

  _overshoot(tappedCoin) {
    // 已收集的硬幣全部拒絕動畫
    [...this.collected].forEach(colId => {
      const c = this.coins.find(c => c.id === colId);
      if (c && !c.removed) {
        c.collected = false;
        c.el.style.setProperty('--cy', `${c.y}px`);
        c.el.classList.remove('collected');
        c.el.classList.add('reject');
        setTimeout(() => {
          if (!c.removed) c.el.classList.remove('reject');
        }, 400);
      }
    });

    // 點到的硬幣也拒絕
    tappedCoin.el.style.setProperty('--cy', `${tappedCoin.y}px`);
    tappedCoin.el.classList.add('reject');
    setTimeout(() => {
      if (!tappedCoin.removed) tappedCoin.el.classList.remove('reject');
    }, 400);

    this.wallet = 0;
    this.collected = [];
    this._updateWalletUI();
    window.gameAudio?.play('g2-wrong-tap');
    this.engine.loseLife();
    // 超標後重建保障隊列，確保仍可達成目標
    this._guaranteeQueue = this._makeGuaranteeCoins(this.target);
  }

  // ── 更新錢包 UI ───────────────────────────────────

  _updateWalletUI() {
    const walletEl = document.getElementById('wallet-display');
    const targetEl = document.getElementById('target-display');
    const barEl    = document.getElementById('wallet-progress');

    if (targetEl) targetEl.textContent = this.target;
    if (walletEl) {
      walletEl.textContent = this.wallet;
      const ratio = this.target > 0 ? this.wallet / this.target : 0;
      if (ratio === 0)      walletEl.style.color = '#fff';
      else if (ratio < 0.6) walletEl.style.color = '#FFD700';
      else if (ratio < 1)   walletEl.style.color = '#FF6B35';
      else                  walletEl.style.color = '#2ed573';
    }
    if (barEl) {
      const ratio = this.target > 0 ? this.wallet / this.target : 0;
      barEl.style.width = `${Math.min(100, ratio * 100)}%`;
      if (ratio >= 1)       barEl.style.background = 'linear-gradient(90deg, #2ed573, #17c550)';
      else if (ratio > 0.7) barEl.style.background = 'linear-gradient(90deg, #FF6B35, #FFD700)';
      else                  barEl.style.background = 'linear-gradient(90deg, #FFD700, #FF8C00)';
    }
  }

  // ── 難度爬坡提示 ──────────────────────────────────

  _showLevelUp(level) {
    const labels = ['', '速度提升！', '速度提升！', '超快速！', '極限速度！'];
    const flash = document.createElement('div');
    flash.className = 'level-up-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);

    const text = document.createElement('div');
    text.className = 'level-up-text';
    text.textContent = `⚡ ${labels[level] || '速度提升！'}`;
    document.body.appendChild(text);
    setTimeout(() => text.remove(), 1200);
  }

  // ── 硬幣產生排程 ──────────────────────────────────

  _startSpawning() {
    const cfg = this.mode === 'tap' ? DIFF_CONFIG_TAP_COIN[this.difficulty] : DIFF_CONFIG[this.difficulty];
    this._spawnCoin();
    this.spawnTimer = setInterval(() => {
      if (!this.isRunning || this.engine.isGameOver()) return;
      if (this.engine.getScaleLevel() >= 2 && Math.random() < 0.3) {
        this._spawnCoin();
      }
      this._spawnCoin();
    }, cfg.spawnInterval);
  }

  // ── RAF 主循環 ────────────────────────────────────

  _loop(timestamp) {
    if (!this.isRunning) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    const areaH = this.gameArea.clientHeight;

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      if (c.removed) continue;

      c.y += c.speed * dt;                             // 往下掉
      c.el.style.transform = `translateY(${c.y}px)`;

      if (c.y > areaH + c.size + 10) {                // 掉出底部
        c.removed = true;
        c.el.remove();
        this.coins.splice(i, 1);

        if (!c.collected) {
          if (this.mode === 'tap') {
            // 點擊模式：逃跑不扣命；保障幣重新排隊
            if (c.isGuarantee) this._guaranteeQueue.push(c.value);
          } else {
            // 湊額模式：智慧扣命
            const wouldOvershoot = (this.wallet + c.value) > this.target;
            if (c.isGuarantee && !wouldOvershoot) {
              this._guaranteeQueue.push(c.value);
            } else if (!wouldOvershoot) {
              this.engine.loseLife();
            }
          }
        } else {
          // 收集中的硬幣（動畫完成）→ 清掉即可
          this.collected = this.collected.filter(id => id !== c.id);
        }
      }
    }

    this.rafId = requestAnimationFrame(ts => this._loop(ts));
  }

  // ── 停止遊戲 ──────────────────────────────────────

  _stop() {
    this.isRunning = false;
    if (this.spawnTimer)     clearInterval(this.spawnTimer);
    if (this.rafId)          cancelAnimationFrame(this.rafId);
    if (this._tapGameTimer)  clearInterval(this._tapGameTimer);
    if (this._sumGameTimer)  clearInterval(this._sumGameTimer);
    this.engine.destroy();
  }
}

// ── 啟動 ──────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  const game = new CoinGame();
  game.init();
});
