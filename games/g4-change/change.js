/* G4 快速找零 — 遊戲邏輯 */

// ── 商品資料庫 ─────────────────────────────────────────
const PRODUCTS = [
  { name: '麵包',   emoji: '🍞' },
  { name: '牛奶',   emoji: '🥛' },
  { name: '蘋果',   emoji: '🍎' },
  { name: '餅乾',   emoji: '🍪' },
  { name: '果汁',   emoji: '🧃' },
  { name: '冰淇淋', emoji: '🍦' },
  { name: '薯片',   emoji: '🥔' },
  { name: '飯糰',   emoji: '🍙' },
  { name: '水',     emoji: '💧' },
  { name: '泡麵',   emoji: '🍜' },
];

// ── 硬幣規格 ──────────────────────────────────────────
const COINS = [
  { value: 1,   size: 48, outer: '#9BAABB', inner: '#C8D4E0', text: '#334',    glow: 'rgba(180,200,220,0.7)' },
  { value: 5,   size: 52, outer: '#8A9BAC', inner: '#B0BEC8', text: '#223',    glow: 'rgba(160,185,200,0.7)' },
  { value: 10,  size: 58, outer: '#B8922E', inner: '#E8C050', text: '#5C3A00', glow: 'rgba(232,192,80,0.7)' },
  { value: 50,  size: 62, outer: '#C8A828', inner: '#F0D050', text: '#5C3A00', glow: 'rgba(240,208,80,0.7)' },
  { value: 100, size: 68, outer: '#DAA520', inner: '#B83228', text: '#fff',    glow: 'rgba(218,165,32,0.7)' },
  { value: 500, size: 74, outer: '#A87820', inner: '#FFD040', text: '#fff',    glow: 'rgba(255,208,64,0.7)' },
];

// ── 難度設定 ──────────────────────────────────────────
const DIFF_CONFIG = {
  easy: {
    coinValues:   [1, 5, 10],
    itemCount:    1,
    itemPrices:   [10, 15, 20, 25, 30],
    paidStep:     10,
    timeSeconds:  15,
    minCoinBonus: 100,
  },
  normal: {
    coinValues:   [1, 5, 10, 50],
    itemCount:    2,
    itemPrices:   [10, 15, 20, 25, 30, 35, 40],
    paidStep:     50,
    timeSeconds:  12,
    minCoinBonus: 100,
  },
  hard: {
    coinValues:   [5, 10, 50, 100],
    itemCount:    3,
    itemPrices:   [20, 25, 30, 35, 40, 45, 50],
    paidStep:     100,
    timeSeconds:  10,
    minCoinBonus: 100,
  },
};

// ── ChangeGame ────────────────────────────────────────

class ChangeGame {
  constructor() {
    this.engine      = null;
    this.ui          = new GameUI();
    this.difficulty  = 'normal';
    this.isRunning   = false;
    this.isAnswering = false;
    this.change      = 0;       // 正確找零金額
    this.selected    = {};      // { coinValue: count }
    this.selectedSum = 0;
    this._lastScale  = 0;
  }

  init() {
    this.ui.renderHUD(3);
    this._showDifficultySelect();
  }

  // ── 難度選擇 ─────────────────────────────────────

  _showDifficultySelect() {
    const overlay = document.createElement('div');
    overlay.className = 'gue-difficulty-overlay';
    overlay.innerHTML = `
      <div class="gue-difficulty-card">
        <a href="../index.html" class="gue-back-link">← 遊戲選單</a>
        <div class="gue-difficulty-title">💸 快速找零</div>
        <div class="gue-difficulty-sub">看購買的商品和付款金額，<br>用硬幣組出正確的找零！</div>
        <button class="gue-diff-btn gue-diff-easy"   data-diff="easy">
          簡單 <span class="gue-diff-badge">1 件商品・1、5、10 元</span>
        </button>
        <button class="gue-diff-btn gue-diff-normal" data-diff="normal">
          普通 <span class="gue-diff-badge">2 件商品・最高 50 元</span>
        </button>
        <button class="gue-diff-btn gue-diff-hard"   data-diff="hard">
          困難 <span class="gue-diff-badge">3 件商品・最高 100 元</span>
        </button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.difficulty = btn.dataset.diff;
        overlay.remove();
        // 在倒數開始前初始化音效，讓倒數 3/2/1/Go 能正常播放
        window.gameAudio = new GameAudio().preload(
          ...GameAudio.COMMON, 'g4-coin-add', 'g4-coin-count', 'g4-wrong-change'
        );
        this.ui.showCountdown(() => this._start());
      });
    });
  }

  // ── 遊戲啟動 ─────────────────────────────────────

  _start() {
    this.engine = new GameEngine({
      gameId: 'g4',
      maxLives: 3,
      difficulty: this.difficulty,
    });
    this.engine.startGlobalTimer();
    this.isRunning = true;

    this._setupEngineListeners();

    // 確認按鈕綁定（此時遊戲已啟動，instance 確定可用）
    const confirmBtn = document.getElementById('confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this._onConfirm());
      confirmBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        this._onConfirm();
      }, { passive: false });
    }

    this._nextQuestion();
  }

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
      window.gameAudio?.play('life-lost');
      this.ui.updateLives(lives, 3);
      this.ui.showMissEffect();
    });

    this.engine.on('gameOver', result => {
      window.gameAudio?.play(result.isNewRecord ? 'new-highscore' : 'game-over-common');
      this.isRunning = false;
      this.engine.destroy();
      setTimeout(() => {
        this.ui.showResultScreen({
          ...result,
          gameTitle: '快速找零',
          gameId: 'g4',
        });
      }, 400);
    });
  }

  // ── 出題 ─────────────────────────────────────────

  _nextQuestion() {
    if (!this.isRunning || this.engine.isGameOver()) return;

    const cfg = DIFF_CONFIG[this.difficulty];

    // 隨機挑選商品（不重複）並指派價格
    const shuffled = [...PRODUCTS].sort(() => Math.random() - 0.5);
    const items = shuffled.slice(0, cfg.itemCount).map((p, i) => ({
      ...p,
      price: cfg.itemPrices[Math.floor(Math.random() * cfg.itemPrices.length)],
      delay: i * 0.08,
    }));

    const price = items.reduce((s, item) => s + item.price, 0);
    // 付款金額（大於 price 的 paidStep 整數倍）
    const paid = Math.ceil((price + 1) / cfg.paidStep) * cfg.paidStep;

    this.change = paid - price;
    this.selected = {};
    this.selectedSum = 0;
    this.isAnswering = true;

    document.getElementById('paid-display').textContent      = paid;
    document.getElementById('price-sum-display').textContent = price;
    document.getElementById('change-display').textContent    = '??';

    this._renderItems(items);
    this._renderCoinPanel(cfg.coinValues);
    this._updateSelectedUI();
    this._updateConfirmBtn();
    this._startQuestionTimer(cfg.timeSeconds);
  }

  // ── 商品展示 ─────────────────────────────────────

  _renderItems(items) {
    const panel = document.getElementById('items-display');
    if (!panel) return;
    panel.innerHTML = '';
    items.forEach((item, idx) => {
      if (idx > 0) {
        const plus = document.createElement('div');
        plus.className = 'item-plus';
        plus.textContent = '+';
        panel.appendChild(plus);
      }
      const card = document.createElement('div');
      card.className = 'item-card';
      card.style.animationDelay = `${item.delay}s`;
      card.innerHTML = `
        <div class="item-emoji">${item.emoji}</div>
        <div class="item-price">${item.price} 元</div>
      `;
      panel.appendChild(card);
    });
  }

  // ── 硬幣選盤 ──────────────────────────────────────

  _renderCoinPanel(coinValues) {
    const panel = document.getElementById('coin-panel');
    panel.innerHTML = '';

    const available = COINS.filter(c => coinValues.includes(c.value));
    available.forEach(coinDef => {
      const { value, outer, inner, text, glow } = coinDef;
      const btn = document.createElement('button');
      // 尺寸改由 CSS class 控制（方便 RWD 響應式調整）
      btn.className = `change-coin change-coin-v${value}`;
      btn.style.cssText = `--outer: ${outer}; --inner: ${inner}; --text: ${text}; --glow: ${glow};`;
      btn.dataset.value = value;
      btn.innerHTML = `
        <span class="c-label">${value}</span>
        <span class="c-unit">元</span>
        <span class="c-count" data-n="0">0</span>
      `;

      btn.addEventListener('click', () => this._onCoinClick(value, btn));
      btn.addEventListener('contextmenu', e => {
        e.preventDefault();
        this._onCoinRightClick(value, btn);
      });
      // 長按取消（行動裝置）
      let holdTimer;
      btn.addEventListener('touchstart', () => {
        holdTimer = setTimeout(() => this._onCoinRightClick(value, btn), 500);
      }, { passive: true });
      btn.addEventListener('touchend',    () => clearTimeout(holdTimer));
      btn.addEventListener('touchcancel', () => clearTimeout(holdTimer));

      panel.appendChild(btn);
    });
  }

  _onCoinClick(value, btn) {
    if (!this.isAnswering || this.engine.isGameOver()) return;
    if (this.selectedSum + value > this.change) return; // 超出 → 不讓選

    this.selected[value] = (this.selected[value] || 0) + 1;
    this.selectedSum += value;
    window.gameAudio?.play('g4-coin-add');
    btn.classList.add('selected');
    this._updateCoinCount(value);
    this._updateSelectedUI();
    this._updateConfirmBtn();
  }

  _onCoinRightClick(value, btn) {
    if (!this.isAnswering) return;
    if (!this.selected[value] || this.selected[value] === 0) return;
    this.selected[value]--;
    this.selectedSum -= value;
    if (this.selected[value] === 0) btn.classList.remove('selected');
    this._updateCoinCount(value);
    this._updateSelectedUI();
    this._updateConfirmBtn();
  }

  _updateCoinCount(value) {
    const btn = document.querySelector(`.change-coin[data-value="${value}"]`);
    if (!btn) return;
    const badge = btn.querySelector('.c-count');
    const n = this.selected[value] || 0;
    badge.textContent = n;
    badge.dataset.n = n;
    badge.style.display = n > 0 ? 'flex' : 'none';
  }

  // ── 確認找零 ──────────────────────────────────────

  _updateConfirmBtn() {
    const btn = document.getElementById('confirm-btn');
    btn.disabled = (this.selectedSum !== this.change);
  }

  _onConfirm() {
    if (!this.isAnswering || this.engine.isGameOver()) return;
    if (this.selectedSum !== this.change) return;
    this.isAnswering = false;
    this.engine.stopQuestionTimer();

    // 顯示正確找零
    document.getElementById('change-display').textContent = this.change;

    // 計算是否用了最少硬幣（貪心算法比較）
    const minCoins = this._minCoinCount(this.change, DIFF_CONFIG[this.difficulty].coinValues);
    const usedCoins = Object.values(this.selected).reduce((s, n) => s + n, 0);

    let basePoints = 100;
    const cfg = DIFF_CONFIG[this.difficulty];

    if (usedCoins <= minCoins) {
      basePoints += cfg.minCoinBonus;
      const el = document.createElement('div');
      el.className = 'min-coin-bonus';
      el.textContent = `🪙 最少硬幣 +${cfg.minCoinBonus}`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 900);
    }

    const points = this.engine.addScore(basePoints);
    window.gameAudio?.play('g4-coin-count');
    const panel = document.getElementById('coin-panel');
    const rect  = panel.getBoundingClientRect();
    this.ui.showScorePopup(rect.left + rect.width / 2, rect.top, points);
    this.ui.showHitEffect(rect.left + rect.width / 2, rect.top + rect.height / 2);

    setTimeout(() => this._nextQuestion(), 650);
  }

  // ── 最少硬幣（貪心） ─────────────────────────────

  _minCoinCount(amount, coinValues) {
    const sorted = [...coinValues].sort((a, b) => b - a);
    let remaining = amount;
    let count = 0;
    for (const val of sorted) {
      const n = Math.floor(remaining / val);
      count += n;
      remaining -= n * val;
    }
    return count;
  }

  // ── UI 更新 ───────────────────────────────────────

  _updateSelectedUI() {
    const sumEl  = document.getElementById('selected-sum');
    const barEl  = document.getElementById('selected-progress');

    if (sumEl) {
      sumEl.textContent = this.selectedSum;
      const ratio = this.change > 0 ? this.selectedSum / this.change : 0;
      if (ratio === 0)      sumEl.style.color = '#fff';
      else if (ratio < 0.6) sumEl.style.color = '#FFD700';
      else if (ratio < 1)   sumEl.style.color = '#FF6B35';
      else                  sumEl.style.color = '#2ed573';
    }
    if (barEl) {
      const ratio = this.change > 0 ? this.selectedSum / this.change : 0;
      barEl.style.width = `${Math.min(100, ratio * 100)}%`;
      barEl.style.background = ratio >= 1
        ? 'linear-gradient(90deg, #2ed573, #17c550)'
        : ratio > 0.7
          ? 'linear-gradient(90deg, #FF6B35, #FFD700)'
          : 'linear-gradient(90deg, #2ed573, #7bed9f)';
    }
  }

  // ── 計時器 ────────────────────────────────────────

  _startQuestionTimer(seconds) {
    this.engine.startQuestionTimer(
      seconds,
      (ratio) => {
        const fill = document.getElementById('question-timer-fill');
        if (fill) {
          fill.style.width = `${ratio * 100}%`;
          fill.classList.toggle('danger', ratio < 0.3);
        }
      },
      () => {
        if (!this.isAnswering) return;
        this.isAnswering = false;
        // 顯示正確答案
        document.getElementById('change-display').textContent = this.change;
        window.gameAudio?.play('g4-wrong-change');
        this.engine.resetCombo();
        this.engine.loseLife();
        if (!this.engine.isGameOver()) {
          setTimeout(() => this._nextQuestion(), 800);
        }
      }
    );
  }

  // ── 關卡提升 ──────────────────────────────────────

  _showLevelUp(level) {
    const labels = ['', '速度提升！', '金額變大！', '超快速！', '極限挑戰！'];
    const flash = document.createElement('div');
    flash.className = 'level-up-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
    const text = document.createElement('div');
    text.className = 'level-up-text';
    text.textContent = `⚡ ${labels[level] || '難度提升！'}`;
    document.body.appendChild(text);
    setTimeout(() => text.remove(), 1200);
  }
}

// ── 啟動 ──────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  const game = new ChangeGame();
  game.init();
});
