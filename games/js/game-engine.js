/**
 * GameEngine — 小遊戲共用核心
 * 分數（Combo 倍率）、生命值、計時器、難度、localStorage 最高分
 */
class GameEngine {
  constructor({ gameId, maxLives = 3, difficulty = 'normal' }) {
    this.gameId = gameId;
    this.maxLives = maxLives;
    this.difficulty = difficulty;

    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lives = maxLives;
    this.correctCount = 0;

    this._questionTimer = null;
    this._globalStart = null;
    this._listeners = {};
    this._gameOver = false;
  }

  // ── 分數 & Combo ──────────────────────────────────

  addScore(basePoints) {
    if (this._gameOver) return 0;
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.correctCount++;
    const multiplier = this._comboMultiplier();
    const points = Math.round(basePoints * multiplier);
    this.score += points;
    this._emit('score', { points, total: this.score, combo: this.combo, multiplier });
    return points;
  }

  resetCombo() {
    if (this.combo === 0) return;
    this.combo = 0;
    this._emit('comboReset');
  }

  _comboMultiplier() {
    if (this.combo >= 10) return 4;
    if (this.combo >= 6)  return 3;
    if (this.combo >= 3)  return 2;
    return 1;
  }

  // ── 生命值 ────────────────────────────────────────

  loseLife() {
    if (this._gameOver) return;
    this.lives = Math.max(0, this.lives - 1);
    this.resetCombo();
    this._emit('lifeLost', { lives: this.lives });
    if (this.lives === 0) {
      this._gameOver = true;
      this._emit('gameOver', this._buildResult());
    }
  }

  isGameOver() {
    return this._gameOver;
  }

  // ── 每題計時器 ────────────────────────────────────

  startQuestionTimer(seconds, onTick, onExpire) {
    this.stopQuestionTimer();
    const endTime = Date.now() + seconds * 1000;
    this._questionTimer = setInterval(() => {
      const remaining = Math.max(0, (endTime - Date.now()) / 1000);
      const ratio = remaining / seconds;
      if (onTick) onTick(ratio, remaining);
      if (remaining <= 0) {
        this.stopQuestionTimer();
        if (onExpire) onExpire();
      }
    }, 80);
  }

  stopQuestionTimer() {
    if (this._questionTimer) {
      clearInterval(this._questionTimer);
      this._questionTimer = null;
    }
  }

  // ── 全局計時器 ────────────────────────────────────

  startGlobalTimer() {
    this._globalStart = Date.now();
  }

  getElapsedSeconds() {
    if (!this._globalStart) return 0;
    return Math.floor((Date.now() - this._globalStart) / 1000);
  }

  // ── 自動爬坡等級（分數門檻）──────────────────────

  getScaleLevel() {
    if (this.score >= 2000) return 4;
    if (this.score >= 1000) return 3;
    if (this.score >= 500)  return 2;
    if (this.score >= 200)  return 1;
    return 0;
  }

  // ── localStorage 最高分 ───────────────────────────

  getHighScore() {
    return parseInt(localStorage.getItem(`miniGame_${this.gameId}_highScore`) || '0');
  }

  saveHighScore() {
    const prev = this.getHighScore();
    if (this.score > prev) {
      localStorage.setItem(`miniGame_${this.gameId}_highScore`, String(this.score));
      return true;
    }
    return false;
  }

  // ── 遊戲結果 ──────────────────────────────────────

  _buildResult() {
    const elapsed = this.getElapsedSeconds();
    const isNewRecord = this.saveHighScore();
    return {
      score: this.score,
      maxCombo: this.maxCombo,
      correctCount: this.correctCount,
      elapsed,
      highScore: this.getHighScore(),
      isNewRecord,
    };
  }

  getResult() {
    return this._buildResult();
  }

  // ── 事件系統 ──────────────────────────────────────

  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(cb => cb(data));
    // 小遊戲不寫學習紀錄（2026-07-23 使用者定案）：遊戲室定位是放鬆，不混入 IEP/學習證據。
    // 舊寫入還有兩個資料品質問題（incorrectCount 從未累計→正確率恆 100%、教師端無 games 區塊），
    // 故整段移除；最高分仍存 localStorage（miniGame_*_highScore）供遊戲內顯示。
  }

  destroy() {
    this.stopQuestionTimer();
    this._listeners = {};
  }
}
