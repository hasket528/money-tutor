/* G6 硬幣翻翻樂 — 遊戲邏輯
 * 翻開硬幣找相同面額，答對得分，答錯扣命
 * 完成整盤換新盤面，連續挑戰
 */

// ── 硬幣規格 ──────────────────────────────────────────
const MEM_COINS = [
  { value: 1,   outer: '#9BAABB', inner: '#C8D4E0', text: '#334',    imgFront: '../../images/money/1_yuan_front.png',   imgBack: '../../images/money/1_yuan_back.png' },
  { value: 5,   outer: '#8A9BAC', inner: '#B0BEC8', text: '#223',    imgFront: '../../images/money/5_yuan_front.png',   imgBack: '../../images/money/5_yuan_back.png' },
  { value: 10,  outer: '#B8922E', inner: '#E8C050', text: '#5C3A00', imgFront: '../../images/money/10_yuan_front.png',  imgBack: '../../images/money/10_yuan_back.png' },
  { value: 50,  outer: '#C8A828', inner: '#F0D050', text: '#5C3A00', imgFront: '../../images/money/50_yuan_front.png',  imgBack: '../../images/money/50_yuan_back.png' },
  { value: 100, outer: '#DAA520', inner: '#B83228', text: '#fff',    imgFront: '../../images/money/100_yuan_front.png', imgBack: '../../images/money/100_yuan_back.png' },
  { value: 500, outer: '#A87820', inner: '#FFD040', text: '#fff',    imgFront: '../../images/money/500_yuan_front.png', imgBack: '../../images/money/500_yuan_back.png' },
];

// ── 主題資料（每組最多 10 個圖示，難度最多用到 10 組）──────
const MEM_THEMES = [
  { id: 'coins',     label: '硬幣',  icon: '🪙', items: null },  // 使用 MEM_COINS
  { id: 'animals',   label: '動物',  icon: '🐼', items: ['🐼','🦊','🐸','🐧','🦁','🐱','🐶','🐨','🐯','🦋'] },
  { id: 'transport', label: '交通',  icon: '🚗', items: ['🚗','🚌','🚂','✈️','🚀','🛺','🚕','⛵','🛸','🚁'] },
  { id: 'food',      label: '美食',  icon: '🍕', items: ['🍕','🍔','🍦','🍩','🍜','🍎','🍊','🍓','🍇','🍣'] },
  { id: 'faces',     label: '表情',  icon: '😄', items: ['😄','😎','🤩','😜','🥳','😍','🤗','😂','🥰','😆'] },
  { id: 'sports',    label: '運動',  icon: '⚽', items: ['⚽','🏀','🎾','⛳','🏊','🥊','🎯','🤸','🎳','🏄'] },
];

// ── 難度設定 ──────────────────────────────────────────
const DIFF_CONFIG_MEM = {
  easy:   { cols: 3, rows: 4, timeSeconds: 90  },  // 12 牌 = 6 組
  normal: { cols: 4, rows: 4, timeSeconds: 120 },  // 16 牌 = 8 組
  hard:   { cols: 4, rows: 5, timeSeconds: 150 },  // 20 牌 = 10 組
};

// ── MemoryGame ────────────────────────────────────────
class MemoryGame {
  constructor() {
    this.engine     = null;
    this.ui         = new GameUI();
    this.difficulty = 'normal';
    this.theme      = 'coins';
    this.gameMode   = 'hearts';  // 'free' | 'hearts' | 'time'
    this.cards      = [];
    this.flipped    = [];
    this.canFlip    = true;
    this.mismatches = 0;
    this.matches    = 0;
    this.totalPairs = 0;
    this._lastScale = 0;
    this._timeTimer = null;
  }

  init() {
    this._showDifficultySelect();
  }

  // ── 難度選擇 ─────────────────────────────────────

  _showDifficultySelect() {
    const overlay = document.createElement('div');
    overlay.className = 'gue-difficulty-overlay';
    overlay.innerHTML = `
      <div class="gue-difficulty-card">
        <a href="../index.html" class="gue-back-link">← 遊戲選單</a>
        <div class="gue-difficulty-title">🪙 硬幣翻翻樂</div>
        <div class="gue-difficulty-sub">翻開硬幣，找出相同面額的兩枚！<br>配對成功得分，答錯扣愛心。</div>
        <button class="gue-diff-btn gue-diff-easy"   data-diff="easy">
          簡單 <span class="gue-diff-badge">3×4 格・6 組硬幣</span>
        </button>
        <button class="gue-diff-btn gue-diff-normal" data-diff="normal">
          普通 <span class="gue-diff-badge">4×4 格・8 組硬幣</span>
        </button>
        <button class="gue-diff-btn gue-diff-hard"   data-diff="hard">
          困難 <span class="gue-diff-badge">4×5 格・10 組硬幣</span>
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelectorAll('[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.difficulty = btn.dataset.diff;
        overlay.remove();
        this._showThemeSelect(); // 難度選完後選主題
      });
    });
  }

  // ── 主題選擇 ─────────────────────────────────────

  _showThemeSelect() {
    const overlay = document.createElement('div');
    overlay.className = 'gue-difficulty-overlay';
    overlay.innerHTML = `
      <div class="gue-difficulty-card">
        <button class="gue-back-link" data-back>← 返回</button>
        <div class="gue-difficulty-title">選擇主題</div>
        <div class="gue-difficulty-sub">選擇翻牌顯示的圖示</div>
        <div class="mem-theme-grid">
          ${MEM_THEMES.map(t => `
            <button class="mem-theme-btn" data-theme="${t.id}">
              <span class="mem-tb-icon">${t.icon}</span>
              <span class="mem-tb-label">${t.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.theme = btn.dataset.theme;
        overlay.remove();
        this._showGameModeSelect();
      });
    });
    overlay.querySelector('[data-back]').addEventListener('click', () => { overlay.remove(); this._showDifficultySelect(); });
  }

  // ── 遊戲規則選擇 ─────────────────────────────────

  _showGameModeSelect() {
    const { timeSeconds } = DIFF_CONFIG_MEM[this.difficulty];
    const overlay = document.createElement('div');
    overlay.className = 'gue-difficulty-overlay';
    overlay.innerHTML = `
      <div class="gue-difficulty-card">
        <button class="gue-back-link" data-back>← 返回</button>
        <div class="gue-difficulty-title">遊戲規則</div>
        <div class="gue-difficulty-sub">選擇挑戰模式</div>
        <button class="gue-diff-btn gue-diff-easy" data-mode="free">
          🆓 無限制 <span class="gue-diff-badge">輕鬆配對，不扣愛心</span>
        </button>
        <button class="gue-diff-btn gue-diff-normal" data-mode="hearts">
          ❤️ 愛心模式 <span class="gue-diff-badge">答錯 3 次扣一顆愛心</span>
        </button>
        <button class="gue-diff-btn gue-diff-hard" data-mode="time">
          ⏱️ 限時模式 <span class="gue-diff-badge">倒數 ${timeSeconds} 秒</span>
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.gameMode = btn.dataset.mode;
        overlay.remove();
        this._start();
      });
    });
    overlay.querySelector('[data-back]').addEventListener('click', () => { overlay.remove(); this._showThemeSelect(); });
  }

  // ── 遊戲啟動 ─────────────────────────────────────

  _start() {
    const isHearts = this.gameMode === 'hearts';

    window.gameAudio = new GameAudio().preload(
      ...GameAudio.COMMON, 'g6-card-flip', 'g6-match-found', 'g6-card-shuffle'
    );
    this.ui.renderHUD(isHearts ? 3 : 0);
    if (!isHearts) {
      const livesEl = document.getElementById('gue-lives');
      if (livesEl) livesEl.style.display = 'none';
    }

    this.engine = new GameEngine({
      gameId: 'g6',
      maxLives: isHearts ? 3 : 0,
      difficulty: this.difficulty,
    });
    this.canFlip = true;

    this.engine.on('score', ({ total, combo }) => {
      this.ui.updateScore(total);
      if (combo >= 3) this.ui.showCombo(combo);
      const lvl = this.engine.getScaleLevel();
      if (lvl > this._lastScale) { this._lastScale = lvl; this._showLevelUp(lvl); }
    });
    if (isHearts) {
      this.engine.on('lifeLost', ({ lives }) => {
        window.gameAudio?.play('life-lost');
        this.ui.updateLives(lives, 3);
        this.ui.showMissEffect();
      });
    }
    this.engine.on('gameOver', result => {
      window.gameAudio?.play(result.isNewRecord ? 'new-highscore' : 'game-over-common');
      if (this._timeTimer) { clearInterval(this._timeTimer); this._hideTimerDisplay(); }
      this.engine.destroy();
      setTimeout(() => {
        this.ui.showResultScreen({ ...result, gameTitle: '硬幣翻翻樂', gameId: 'g6' });
      }, 500);
    });

    this._buildBoardWithPreview(); // 第一盤：先預覽 5 秒
  }

  // ── 首盤預覽：先全部翻開 5 秒，再蓋回 ────────────────

  _buildBoardWithPreview() {
    this._buildBoard();
    this.canFlip = false;

    // 全部翻開讓玩家記憶
    this.cards.forEach(card => {
      card.el.classList.add('mem-flipped');
      card.flipped = true;
    });

    this._showPreviewBanner(5, () => {
      this.engine.startGlobalTimer();
      this.cards.forEach(card => {
        card.flipped = false;
        card.el.classList.remove('mem-flipped');
      });
      if (this.gameMode === 'time') this._startTimeTimer();
      this.canFlip = true;
    });
  }

  // ── 預覽計時橫幅 ──────────────────────────────────

  _showPreviewBanner(seconds, onComplete) {
    const banner = document.createElement('div');
    banner.className = 'mem-preview-banner';
    banner.innerHTML = `
      <div class="mem-prev-content">
        <span>👀 記住位置！</span>
        <span id="mem-prev-count" class="mem-prev-num">${seconds}</span>
        <span>秒</span>
      </div>
      <div class="mem-prev-bar-wrap">
        <div id="mem-prev-bar" class="mem-prev-bar"></div>
      </div>
    `;
    document.body.appendChild(banner);

    const barEl  = banner.querySelector('#mem-prev-bar');
    const countEl = banner.querySelector('#mem-prev-count');
    let remaining = seconds;

    // 初始化進度條
    if (barEl) { barEl.style.transition = 'none'; barEl.style.width = '100%'; }
    setTimeout(() => {
      if (barEl) barEl.style.transition = `width ${seconds}s linear`;
      if (barEl) barEl.style.width = '0%';
    }, 30);

    const iv = setInterval(() => {
      remaining--;
      if (countEl) countEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(iv);
        banner.classList.add('mem-prev-fade-out');
        setTimeout(() => { banner.remove(); onComplete(); }, 380);
      }
    }, 1000);
  }

  // ── 盤面建構 ──────────────────────────────────────

  _buildBoard() {
    if (this.engine.isGameOver()) return;

    const cfg = DIFF_CONFIG_MEM[this.difficulty];
    const numPairs = (cfg.cols * cfg.rows) / 2;
    this.totalPairs = numPairs;
    const isNewBoard = this.matches > 0; // 在重置前記錄，才能正確判斷是否為換盤
    this.matches    = 0;
    this.mismatches = 0;
    this.flipped    = [];
    this.canFlip    = true;

    // 生成成對清單（用索引 0~numPairs-1，所有主題統一用法）
    const pairs = [];
    for (let i = 0; i < numPairs; i++) pairs.push(i, i);
    // Fisher-Yates 洗牌
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    // 硬幣主題：前 MEM_COINS.length 組固定正面，超出後固定反面
    // 確保同幣值出現在兩個不同配對時（normal/hard 模式），外觀永遠不同
    const pairFaces = {};
    for (let i = 0; i < numPairs; i++) {
      pairFaces[i] = i < MEM_COINS.length ? 'front' : 'back';
    }

    // 更新 DOM
    const grid = document.getElementById('mem-grid');
    grid.style.gridTemplateColumns = `repeat(${cfg.cols}, 1fr)`;
    grid.innerHTML = '';
    if (isNewBoard) window.gameAudio?.play('g6-card-shuffle'); // 非第一盤才播
    this.cards = [];

    pairs.forEach((val, idx) => {
      const card = { el: document.createElement('div'), value: val, matched: false, flipped: false, idx };

      card.el.className = 'mem-card';
      card.el.innerHTML = this._cardHTML(val, pairFaces[val]);

      card.el.addEventListener('click', () => this._onFlip(idx));
      card.el.addEventListener('touchstart', e => { e.preventDefault(); this._onFlip(idx); }, { passive: false });

      grid.appendChild(card.el);
      this.cards.push(card);
    });

    this._updateStatBar();
  }

  // ── 卡牌正面 HTML（依主題產生）───────────────────────

  _cardHTML(val, face = 'front') {
    const themeData = MEM_THEMES.find(t => t.id === this.theme);
    if (!themeData || !themeData.items) {
      // 硬幣主題：使用真實金錢圖示
      const def = MEM_COINS[val % MEM_COINS.length];
      const src = face === 'back' ? def.imgBack : def.imgFront;
      return `
        <div class="mem-card-inner">
          <div class="mem-back"><div class="mem-back-icon">🪙</div></div>
          <div class="mem-front">
            <img class="mem-coin-img" src="${src}" alt="${def.value}元">
          </div>
        </div>
      `;
    }
    // Emoji 主題
    const emoji = themeData.items[val % themeData.items.length];
    return `
      <div class="mem-card-inner">
        <div class="mem-back"><div class="mem-back-icon">${themeData.icon}</div></div>
        <div class="mem-front">
          <div class="mem-emoji-face">${emoji}</div>
        </div>
      </div>
    `;
  }

  // ── 翻牌邏輯 ──────────────────────────────────────

  _onFlip(idx) {
    if (!this.canFlip || this.engine.isGameOver()) return;
    const card = this.cards[idx];
    if (card.matched || card.flipped) return;
    if (this.flipped.length >= 2) return;

    card.flipped = true;
    card.el.classList.add('mem-flipped');
    window.gameAudio?.play('g6-card-flip');
    this.flipped.push(card);

    if (this.flipped.length === 2) {
      this.canFlip = false;
      const [a, b] = this.flipped;
      if (a.value === b.value) {
        this._onMatch(a, b);
      } else {
        this._onMismatch(a, b);
      }
    }
  }

  // ── 配對成功 ──────────────────────────────────────

  _onMatch(a, b) {
    a.matched = b.matched = true;
    window.gameAudio?.play('g6-match-found');
    this.matches++;

    setTimeout(() => {
      a.el.classList.add('mem-matched');
      b.el.classList.add('mem-matched');
    }, 160);

    const rA = a.el.getBoundingClientRect();
    const rB = b.el.getBoundingClientRect();
    const cx = (rA.left + rA.right + rB.left + rB.right) / 4;
    const cy = (rA.top  + rA.bottom + rB.top  + rB.bottom) / 4;

    const points = this.engine.addScore(200);
    this.ui.showScorePopup(cx, cy - 22, points);
    this.ui.showHitEffect(cx, cy);

    this.flipped  = [];
    this.canFlip  = true;
    this._updateStatBar();

    if (this.matches === this.totalPairs) {
      setTimeout(() => this._onBoardComplete(), 400);
    }
  }

  // ── 配對失敗 ──────────────────────────────────────

  _onMismatch(a, b) {
    this.mismatches++;
    this.engine.resetCombo();

    a.el.classList.add('mem-wrong');
    b.el.classList.add('mem-wrong');
    this._updateStatBar();

    setTimeout(() => {
      a.el.classList.remove('mem-wrong', 'mem-flipped');
      b.el.classList.remove('mem-wrong', 'mem-flipped');
      a.flipped = b.flipped = false;
      this.flipped  = [];
      this.canFlip  = true;

      // 每答錯 3 次扣一條命（僅愛心模式）
      if (this.gameMode === 'hearts' && this.mismatches % 3 === 0 && !this.engine.isGameOver()) {
        this.engine.loseLife();
      }
    }, 950);
  }

  // ── 清盤 ──────────────────────────────────────────

  _onBoardComplete() {
    if (this.engine.isGameOver()) return;
    this.engine.addScore(500); // 清盤獎勵

    const flash = document.createElement('div');
    flash.className = 'mem-clear-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 550);

    setTimeout(() => this._buildBoard(), 750);
  }

  // ── 統計列更新 ────────────────────────────────────

  _updateStatBar() {
    const pairsEl = document.getElementById('mem-pairs-left');
    const missEl  = document.getElementById('mem-miss-count');
    if (pairsEl) pairsEl.textContent = `${this.totalPairs - this.matches} 組剩餘`;
    if (missEl)  missEl.textContent  = `${this.mismatches} 次錯誤`;
  }

  // ── 限時模式計時器 ────────────────────────────────

  _startTimeTimer() {
    const { timeSeconds } = DIFF_CONFIG_MEM[this.difficulty];
    let remaining = timeSeconds;
    this._updateTimerDisplay(remaining);
    this._timeTimer = setInterval(() => {
      if (this.engine.isGameOver()) { clearInterval(this._timeTimer); this._hideTimerDisplay(); return; }
      remaining--;
      this._updateTimerDisplay(remaining);
      if (remaining <= 0) {
        clearInterval(this._timeTimer);
        this._hideTimerDisplay();
        this.engine.loseLife(); // maxLives=0 → 觸發 gameOver
      }
    }, 1000);
  }

  _updateTimerDisplay(secs) {
    const el = document.getElementById('mem-time-left');
    if (el) { el.textContent = `⏱ ${secs} 秒`; el.style.display = ''; }
  }

  _hideTimerDisplay() {
    const el = document.getElementById('mem-time-left');
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  }

  _showLevelUp(lvl) {
    const labels = ['','記憶提升！','速度加快！','超厲害！','記憶天才！'];
    const flash = document.createElement('div');
    flash.className = 'level-up-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
    const text = document.createElement('div');
    text.className = 'level-up-text';
    text.textContent = `⚡ ${labels[lvl] || '繼續加油！'}`;
    document.body.appendChild(text);
    setTimeout(() => text.remove(), 1200);
  }
}

// ── 啟動 ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const game = new MemoryGame();
  game.init();
});
