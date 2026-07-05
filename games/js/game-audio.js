/**
 * GameAudio — 小遊戲共用音效管理器
 * 用法：
 *   window.gameAudio = new GameAudio();
 *   window.gameAudio.preload('g1-bubble-pop', 'life-lost', ...);
 *   window.gameAudio.play('g1-bubble-pop');
 */
class GameAudio {
  constructor() {
    this._pool  = {};   // key → HTMLAudioElement (原型)
    this._base  = '../../audio/games/';
  }

  preload(...keys) {
    keys.flat().forEach(k => {
      if (this._pool[k]) return;
      const a = new Audio(this._base + k + '.mp3');
      a.preload = 'auto';
      this._pool[k] = a;
    });
    return this;
  }

  play(key, vol = 1) {
    const src = this._pool[key];
    if (!src) return;
    try {
      const a = src.cloneNode();
      a.volume = Math.max(0, Math.min(1, vol));
      a.play().catch(() => {});
    } catch (_) {}
  }

  // 播放音效，結束後執行 cb（失敗也會執行）
  playThen(key, cb, vol = 1) {
    const src = this._pool[key];
    if (!src) { cb?.(); return; }
    try {
      const a = src.cloneNode();
      a.volume = Math.max(0, Math.min(1, vol));
      a.addEventListener('ended', () => cb?.(), { once: true });
      a.addEventListener('error', () => cb?.(), { once: true });
      a.play().catch(() => cb?.());
    } catch (_) { cb?.(); }
  }
}

// ── 常用音效清單（所有遊戲共用）─────────────────────────
GameAudio.COMMON = [
  'countdown-1', 'countdown-2', 'countdown-3', 'countdown-go',
  'life-lost', 'game-over-common', 'new-highscore',
  'win-round', 'level-up',
];
