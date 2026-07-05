/* G3 超市閃電結帳 — 遊戲邏輯 */

// ── 商品資料庫 ─────────────────────────────────────────
const PRODUCTS = [
  { name: '麵包',   emoji: '🍞',  prices: { easy: [10,15,20], normal: [15,20,25,35], hard: [28,35,45,58] } },
  { name: '牛奶',   emoji: '🥛',  prices: { easy: [20,25,30], normal: [30,35,45],    hard: [38,52,65] } },
  { name: '蘋果',   emoji: '🍎',  prices: { easy: [5,10,15],  normal: [12,18,25],    hard: [22,35,48] } },
  { name: '餅乾',   emoji: '🍪',  prices: { easy: [10,15],    normal: [20,25,35],    hard: [32,45,55] } },
  { name: '果汁',   emoji: '🧃',  prices: { easy: [15,20,25], normal: [25,30,40],    hard: [35,48,60] } },
  { name: '冰淇淋', emoji: '🍦',  prices: { easy: [15,20],    normal: [20,30,40],    hard: [35,50,65] } },
  { name: '薯片',   emoji: '🥔',  prices: { easy: [10,20],    normal: [25,35],       hard: [38,52] } },
  { name: '飯糰',   emoji: '🍙',  prices: { easy: [15,20,25], normal: [20,28,35],    hard: [32,45] } },
  { name: '巧克力', emoji: '🍫',  prices: { easy: [20,25],    normal: [30,40,50],    hard: [45,60,75] } },
  { name: '水',     emoji: '💧',  prices: { easy: [5,10],     normal: [10,15,20],    hard: [18,25,35] } },
  { name: '泡麵',   emoji: '🍜',  prices: { easy: [10,15,20], normal: [20,25,35],    hard: [28,42,55] } },
  { name: '優格',   emoji: '🥣',  prices: { easy: [15,20,25], normal: [25,35,45],    hard: [35,52,65] } },
];

// ── 難度設定 ──────────────────────────────────────────
const DIFF_CONFIG = {
  easy: {
    itemCount:   2,          // 每題商品數
    timeSeconds: 12,         // 每題時間
    optionRange: 15,         // 錯誤選項的偏移最大值
    speedBonus:  50,         // 5 秒內答對的速答加分
    speedThreshold: 5,
  },
  normal: {
    itemCount:   3,
    timeSeconds: 10,
    optionRange: 25,
    speedBonus:  50,
    speedThreshold: 4,
  },
  hard: {
    itemCount:   4,
    timeSeconds: 8,
    optionRange: 40,
    speedBonus:  50,
    speedThreshold: 3,
  },
};

// ── CheckoutGame ──────────────────────────────────────

class CheckoutGame {
  constructor() {
    this.engine      = null;
    this.ui          = new GameUI();
    this.difficulty  = 'normal';
    this.isRunning   = false;
    this.isAnswering = false;
    this.correctAnswer = 0;
    this.questionStart = 0;
    this._lastScale  = 0;
  }

  init() {
    this.ui.renderHUD(3);
    // 預載語音清單（iOS 需要在互動事件前呼叫一次）
    if (window.speechSynthesis) window.speechSynthesis.getVoices();
    this._showDifficultySelect();
  }

  // ── 語音播報 ─────────────────────────────────────

  _speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'zh-TW';
    utt.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => v.name.includes('Yating') || v.name.includes('雅婷')) ||
                 voices.find(v => v.lang && v.lang.startsWith('zh'));
    if (pref) utt.voice = pref;
    window.speechSynthesis.speak(utt);
  }

  // ── 難度選擇 ─────────────────────────────────────

  _showDifficultySelect() {
    const overlay = document.createElement('div');
    overlay.className = 'gue-difficulty-overlay';
    overlay.innerHTML = `
      <div class="gue-difficulty-card">
        <a href="../index.html" class="gue-back-link">← 遊戲選單</a>
        <div class="gue-difficulty-title">🛒 超市閃電結帳</div>
        <div class="gue-difficulty-sub">看商品價格，心算總價，<br>選出正確答案！</div>
        <button class="gue-diff-btn gue-diff-easy"   data-diff="easy">
          簡單 <span class="gue-diff-badge">2 件商品・12 秒</span>
        </button>
        <button class="gue-diff-btn gue-diff-normal" data-diff="normal">
          普通 <span class="gue-diff-badge">3 件商品・10 秒</span>
        </button>
        <button class="gue-diff-btn gue-diff-hard"   data-diff="hard">
          困難 <span class="gue-diff-badge">4 件商品・8 秒</span>
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
          ...GameAudio.COMMON, 'g3-item-scan', 'g3-cash-register', 'g3-wrong-total'
        );
        this.ui.showCountdown(() => this._start());
      });
    });
  }

  // ── 遊戲啟動 ─────────────────────────────────────

  _start() {
    this.engine = new GameEngine({
      gameId: 'g3',
      maxLives: 3,
      difficulty: this.difficulty,
    });
    this.engine.startGlobalTimer();
    this.isRunning = true;

    this._setupEngineListeners();
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
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      this.isRunning = false;
      this.engine.destroy();
      setTimeout(() => {
        this.ui.showResultScreen({
          ...result,
          gameTitle: '超市閃電結帳',
          gameId: 'g3',
        });
      }, 400);
    });
  }

  // ── 出題 ─────────────────────────────────────────

  _nextQuestion() {
    if (!this.isRunning || this.engine.isGameOver()) return;

    const cfg = DIFF_CONFIG[this.difficulty];
    // 難度爬坡：高等級多偷加一件商品機率
    const extraItem = this.engine.getScaleLevel() >= 3 && Math.random() < 0.4 ? 1 : 0;
    const count = cfg.itemCount + extraItem;

    // 隨機挑選商品（不重複）
    const shuffled = [...PRODUCTS].sort(() => Math.random() - 0.5);
    const items = shuffled.slice(0, count).map(p => {
      const priceList = p.prices[this.difficulty];
      const price = priceList[Math.floor(Math.random() * priceList.length)];
      return { ...p, price };
    });

    this.correctAnswer = items.reduce((s, i) => s + i.price, 0);
    this.questionStart = Date.now();
    this.isAnswering   = true;

    window.gameAudio?.play('g3-item-scan');
    this._renderQuestion(items);
    this._renderOptions(this.correctAnswer, cfg.optionRange);
    this._startQuestionTimer(cfg.timeSeconds);
    this._speakQuestion(items);
  }

  _speakQuestion(items) {
    const parts = items.map(i => `${i.name}${i.price}元`);
    const text = parts.join('，') + '，總共多少元？';
    setTimeout(() => this._speak(text), 150);
  }

  _renderQuestion(items) {
    const panel = document.getElementById('items-display');
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
      card.innerHTML = `
        <div class="item-emoji">${item.emoji}</div>
        <div class="item-price">${item.price} 元</div>
      `;
      panel.appendChild(card);
    });
  }

  _renderOptions(correct, range) {
    const panel = document.getElementById('options-panel');
    panel.innerHTML = '';

    // 產生 3 個不重複的錯誤選項
    const wrongs = new Set();
    while (wrongs.size < 3) {
      const offset = (Math.floor(Math.random() * (range / 5)) + 1) * 5
        * (Math.random() < 0.5 ? 1 : -1);
      const val = correct + offset;
      if (val > 0 && val !== correct && !wrongs.has(val)) {
        wrongs.add(val);
      }
    }

    // 混入正確答案並洗牌
    const opts = [...wrongs, correct].sort(() => Math.random() - 0.5);

    opts.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = val;
      btn.dataset.value = val;
      btn.addEventListener('click', () => this._onAnswer(val, btn));
      btn.addEventListener('touchstart', e => {
        e.preventDefault();
        this._onAnswer(val, btn);
      }, { passive: false });
      panel.appendChild(btn);
    });
  }

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
        this.engine.resetCombo();
        this.engine.loseLife();
        if (!this.engine.isGameOver()) {
          this._speak(`時間到，是${this.correctAnswer}元`);
          setTimeout(() => this._nextQuestion(), 900);
        }
      }
    );
  }

  // ── 答題處理 ──────────────────────────────────────

  _onAnswer(value, btn) {
    if (!this.isAnswering || this.engine.isGameOver()) return;
    this.isAnswering = false;
    this.engine.stopQuestionTimer();

    const isCorrect = (value === this.correctAnswer);
    btn.classList.add(isCorrect ? 'correct' : 'wrong');

    // 標記正確答案（如果答錯）
    if (!isCorrect) {
      document.querySelectorAll('.option-btn').forEach(b => {
        if (parseInt(b.dataset.value) === this.correctAnswer) {
          b.classList.add('correct');
        }
      });
    }

    if (isCorrect) {
      const elapsed = (Date.now() - this.questionStart) / 1000;
      const cfg = DIFF_CONFIG[this.difficulty];
      let basePoints = 100;

      if (elapsed < cfg.speedThreshold) {
        basePoints += cfg.speedBonus;
        const el = document.createElement('div');
        el.className = 'speed-bonus';
        el.textContent = `⚡ 速答 +${cfg.speedBonus}`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 900);
      }

      this._speak('答對了！');
      window.gameAudio?.play('g3-cash-register');
      const points = this.engine.addScore(basePoints);
      const rect = btn.getBoundingClientRect();
      this.ui.showScorePopup(rect.left + rect.width / 2, rect.top, points);
      this.ui.showHitEffect(rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else {
      window.gameAudio?.play('g3-wrong-total');
      this.engine.resetCombo();
      this.engine.loseLife();
      if (!this.engine.isGameOver()) {
        this._speak(`答錯了，是${this.correctAnswer}元`);
      }
    }

    if (!this.engine.isGameOver()) {
      setTimeout(() => this._nextQuestion(), isCorrect ? 600 : 900);
    }
  }

  // ── 關卡提升 ──────────────────────────────────────

  _showLevelUp(level) {
    const labels = ['', '速度提升！', '商品增加！', '超快速！', '極限挑戰！'];
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
  const game = new CheckoutGame();
  game.init();
});
