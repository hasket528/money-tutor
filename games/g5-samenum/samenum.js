/* G5 數字消消樂 — 遊戲邏輯
 * 點擊相鄰同數字群組 → 消除 → 重力 → 補牌
 * 計時結束遊戲，群組越大得分越高
 */

// ── 常數 ──────────────────────────────────────────────
const SN_COLS = 6;
const SN_ROWS = 8;

const DIFF_CONFIG_SN = {
  easy:   { numValues: 3, timeSeconds: 90 },
  normal: { numValues: 4, timeSeconds: 60 },
  hard:   { numValues: 5, timeSeconds: 45 },
};

// ── 主題資料（每種主題最多 5 個，按難度取前 N 個）────────
const SN_THEMES = [
  { id: 'numbers', label: '數字',  icon: '🔢', items: null },
  { id: 'food',    label: '食物',  icon: '🍕', items: ['🍕','🍔','🍦','🍩','🍜'] },
  { id: 'animals', label: '動物',  icon: '🐼', items: ['🐼','🦊','🐸','🐧','🦁'] },
  { id: 'faces',   label: '表情',  icon: '😄', items: ['😄','😎','🤩','😜','🥳'] },
  { id: 'sports',  label: '運動',  icon: '⚽', items: ['⚽','🏀','🎾','🏆','🎯'] },
  { id: 'nature',  label: '自然',  icon: '🌸', items: ['🌸','🌻','🌈','🌊','🍀'] },
];

// ── SameNumGame ───────────────────────────────────────
class SameNumGame {
  constructor() {
    this.engine       = null;
    this.ui           = new GameUI();
    this.difficulty   = 'normal';
    this.theme        = 'numbers'; // 預設主題
    this.grid         = [];
    this.cells        = [];
    this.isRunning    = false;
    this.isAnimating  = false;
    this.timerInterval = null;
    this.timeLeft     = 0;
    this._lastElimMs  = 0;
    this._streak      = 0;
    this._lastScale   = 0;
    this._hovered     = new Set();
  }

  init() {
    this.ui.renderHUD(0); // 此遊戲無生命值，只用計時
    this._showDifficultySelect();
  }

  // ── 難度選擇 ─────────────────────────────────────

  _showDifficultySelect() {
    const overlay = document.createElement('div');
    overlay.className = 'gue-difficulty-overlay';
    overlay.innerHTML = `
      <div class="gue-difficulty-card">
        <a href="../index.html" class="gue-back-link">← 遊戲選單</a>
        <div class="gue-difficulty-title">🔢 數字消消樂</div>
        <div class="gue-difficulty-sub">至少 3 個相鄰同數字才能消除，<br>連消越快，倍率越高！</div>
        <button class="gue-diff-btn gue-diff-easy"   data-diff="easy">
          簡單 <span class="gue-diff-badge">3 種數字・90 秒</span>
        </button>
        <button class="gue-diff-btn gue-diff-normal" data-diff="normal">
          普通 <span class="gue-diff-badge">4 種數字・60 秒</span>
        </button>
        <button class="gue-diff-btn gue-diff-hard"   data-diff="hard">
          困難 <span class="gue-diff-badge">5 種數字・45 秒</span>
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
        <div class="gue-difficulty-sub">格子要顯示的圖示</div>
        <div class="sn-theme-grid">
          ${SN_THEMES.map(t => `
            <button class="sn-theme-btn" data-theme="${t.id}">
              <span class="sn-tb-icon">${t.icon}</span>
              <span class="sn-tb-label">${t.label}</span>
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
        // 在倒數開始前初始化音效，讓倒數 3/2/1/Go 能正常播放
        window.gameAudio = new GameAudio().preload(
          ...GameAudio.COMMON, 'g5-group-pop', 'g5-reject', 'g5-timer-danger'
        );
        this.ui.showCountdown(() => this._start());
      });
    });
    overlay.querySelector('[data-back]').addEventListener('click', () => { overlay.remove(); this._showDifficultySelect(); });
  }

  // ── 遊戲啟動 ─────────────────────────────────────

  _start() {
    this.engine = new GameEngine({
      gameId: 'g5',
      maxLives: 0,
      difficulty: this.difficulty,
    });
    this.engine.startGlobalTimer();
    this.isRunning = true;

    this.engine.on('score', ({ total, combo }) => {
      this.ui.updateScore(total);
      if (combo >= 3) this.ui.showCombo(combo);
      const lvl = this.engine.getScaleLevel();
      if (lvl > this._lastScale) { this._lastScale = lvl; this._showLevelUp(lvl); }
    });
    this.engine.on('gameOver', result => {
      window.gameAudio?.play(result.isNewRecord ? 'new-highscore' : 'game-over-common');
      this._stop();
      setTimeout(() => {
        this.ui.showResultScreen({ ...result, gameTitle: '數字消消樂', gameId: 'g5' });
      }, 400);
    });

    this._initGrid();
    this._buildDOM();
    this._startTimer();
  }

  // ── 網格初始化 ────────────────────────────────────

  _initGrid() {
    const n = DIFF_CONFIG_SN[this.difficulty].numValues;
    this.grid = Array.from({ length: SN_ROWS }, () =>
      Array.from({ length: SN_COLS }, () => Math.floor(Math.random() * n) + 1)
    );
  }

  // ── DOM 建構 ──────────────────────────────────────

  _buildDOM() {
    const container = document.getElementById('sn-grid');
    container.innerHTML = '';
    this.cells = [];
    for (let r = 0; r < SN_ROWS; r++) {
      this.cells[r] = [];
      for (let c = 0; c < SN_COLS; c++) {
        const cell = document.createElement('div');
        this._applyStyle(cell, this.grid[r][c]);
        cell.addEventListener('click', () => this._onTap(r, c));
        cell.addEventListener('touchstart', e => { e.preventDefault(); this._onTap(r, c); }, { passive: false });
        cell.addEventListener('mouseenter', () => this._preview(r, c));
        cell.addEventListener('mouseleave', () => this._clearPreview());
        container.appendChild(cell);
        this.cells[r][c] = cell;
      }
    }
  }

  _applyStyle(el, val) {
    if (!val) {
      el.className = 'sn-cell sn-empty';
      el.textContent = '';
      return;
    }
    const themeData = SN_THEMES.find(t => t.id === this.theme);
    if (themeData && themeData.items) {
      el.className = `sn-cell sn-v${val} sn-emoji-tile`;
      el.textContent = themeData.items[val - 1] || val;
    } else {
      el.className = `sn-cell sn-v${val}`;
      el.textContent = val;
    }
  }

  // ── 點擊處理 ──────────────────────────────────────

  _onTap(r, c) {
    if (!this.isRunning || this.isAnimating || this.engine.isGameOver()) return;
    if (!this.grid[r][c]) return;

    const group = this._flood(r, c);
    if (group.length < 3) {
      const cell = this.cells[r][c];
      window.gameAudio?.play('g5-reject');
      cell.classList.add('sn-reject');
      setTimeout(() => cell.classList.remove('sn-reject'), 300);
      return;
    }
    this._eliminate(group);
  }

  // ── BFS 連通區域 ──────────────────────────────────

  _flood(r, c) {
    const val = this.grid[r][c];
    if (!val) return [];
    const seen = new Set(), result = [];
    const q = [[r, c]];
    while (q.length) {
      const [cr, cc] = q.shift();
      const k = `${cr},${cc}`;
      if (seen.has(k)) continue;
      if (cr < 0 || cr >= SN_ROWS || cc < 0 || cc >= SN_COLS) continue;
      if (this.grid[cr][cc] !== val) continue;
      seen.add(k);
      result.push([cr, cc]);
      q.push([cr-1,cc],[cr+1,cc],[cr,cc-1],[cr,cc+1]);
    }
    return result;
  }

  // ── 消除 ──────────────────────────────────────────

  _eliminate(group) {
    this.isAnimating = true;
    this._clearPreview();

    // 連消判斷
    const now = Date.now();
    this._streak = (now - this._lastElimMs < 1300) ? this._streak + 1 : 0;
    this._lastElimMs = now;
    const mult = Math.min(3, 1 + Math.floor(this._streak / 2));

    const n = group.length;
    const pts = Math.round(n * n * 10 * mult);

    // 計算視覺中心
    let cx = 0, cy = 0;
    group.forEach(([r, c]) => {
      const rect = this.cells[r][c].getBoundingClientRect();
      cx += rect.left + rect.width / 2;
      cy += rect.top  + rect.height / 2;
      this.grid[r][c] = 0;
      this.cells[r][c].classList.add('sn-popping');
    });
    cx /= n; cy /= n;

    const points = this.engine.addScore(pts);
    window.gameAudio?.play('g5-group-pop');
    this.ui.showScorePopup(cx, cy - 18, points);
    if (n >= 5) this.ui.showHitEffect(cx, cy);

    // 連消提示
    if (this._streak >= 2) {
      const label = document.createElement('div');
      label.className = 'sn-combo-label';
      label.textContent = `🔥 ×${mult}`;
      label.style.left = `${cx}px`;
      label.style.top  = `${cy - 52}px`;
      document.body.appendChild(label);
      setTimeout(() => label.remove(), 820);
    }

    setTimeout(() => {
      group.forEach(([r, c]) => this.cells[r][c].classList.remove('sn-popping'));
      this._applyGravity();
      this._refill();
      this._rerender();
      setTimeout(() => {
        this.isAnimating = false;
        if (!this._hasValidMove()) this._newBoard();
      }, 55);
    }, 340);
  }

  // ── 重力 + 補牌 ───────────────────────────────────

  _applyGravity() {
    for (let c = 0; c < SN_COLS; c++) {
      let w = SN_ROWS - 1;
      for (let r = SN_ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c]) {
          this.grid[w][c] = this.grid[r][c];
          if (w !== r) this.grid[r][c] = 0;
          w--;
        }
      }
    }
  }

  _refill() {
    const n = DIFF_CONFIG_SN[this.difficulty].numValues;
    for (let r = 0; r < SN_ROWS; r++)
      for (let c = 0; c < SN_COLS; c++)
        if (!this.grid[r][c])
          this.grid[r][c] = Math.floor(Math.random() * n) + 1;
  }

  _rerender() {
    for (let r = 0; r < SN_ROWS; r++)
      for (let c = 0; c < SN_COLS; c++)
        this._applyStyle(this.cells[r][c], this.grid[r][c]);
  }

  // ── 無有效步驟 → 換新盤面 ────────────────────────

  _hasValidMove() {
    for (let r = 0; r < SN_ROWS; r++)
      for (let c = 0; c < SN_COLS; c++)
        if (this.grid[r][c] && this._flood(r, c).length >= 3) return true;
    return false;
  }

  _newBoard() {
    this.engine.addScore(300);
    const flash = document.createElement('div');
    flash.className = 'sn-clear-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
    setTimeout(() => { this._initGrid(); this._rerender(); }, 320);
  }

  // ── 懸停預覽 ──────────────────────────────────────

  _preview(r, c) {
    if (!this.isRunning || this.isAnimating) return;
    const group = this._flood(r, c);
    this._clearPreview();
    if (group.length >= 3) {
      group.forEach(([gr, gc]) => {
        this.cells[gr][gc].classList.add('sn-hover');
        this._hovered.add(`${gr},${gc}`);
      });
    }
  }

  _clearPreview() {
    this._hovered.forEach(k => {
      const [r, c] = k.split(',').map(Number);
      this.cells[r]?.[c]?.classList.remove('sn-hover');
    });
    this._hovered.clear();
  }

  // ── 計時器 ────────────────────────────────────────

  _startTimer() {
    const { timeSeconds } = DIFF_CONFIG_SN[this.difficulty];
    this.timeLeft = timeSeconds;
    const fill = document.getElementById('sn-timer-fill');

    const tick = () => {
      const ratio = this.timeLeft / timeSeconds;
      if (fill) {
        fill.style.width = `${ratio * 100}%`;
        fill.classList.toggle('sn-danger', ratio < 0.25);
      }
      this.ui.updateTimer(ratio);
    };
    tick();

    this.timerInterval = setInterval(() => {
      if (!this.isRunning) return;
      this.timeLeft--;
      tick();
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        // maxLives=0 → lives 已為 0 → loseLife() 直接觸發 gameOver
        this.engine.loseLife();
      }
    }, 1000);
  }

  _stop() {
    this.isRunning = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.engine.destroy();
  }

  _showLevelUp(lvl) {
    const labels = ['','越來越快！','連消加倍！','超快速！','極限狀態！'];
    const flash = document.createElement('div');
    flash.className = 'level-up-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
    const text = document.createElement('div');
    text.className = 'level-up-text';
    text.textContent = `⚡ ${labels[lvl] || '難度提升！'}`;
    document.body.appendChild(text);
    setTimeout(() => text.remove(), 1200);
  }
}

// ── 啟動 ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const game = new SameNumGame();
  game.init();
});
