/**
 * GameUI — 小遊戲共用 UI 元件
 * HUD、倒數開場、Combo 動畫、得分飛出、粒子爆炸、結束畫面
 */
class GameUI {
  constructor() {
    this._particleColors = [
      '#FFD700', '#FF6B35', '#FF4757',
      '#2ed573', '#A55EEA', '#45B7D1',
      '#FF8B8B', '#7bed9f',
    ];

    this._gradeMap = {
      g1: { S: '數字天才', A: '數字達人', B: '數字學徒', C: '繼續練習' },
      g2: { S: '錢幣大師', A: '錢幣達人', B: '錢幣學徒', C: '繼續練習' },
      g3: { S: '結帳之王', A: '結帳達人', B: '結帳學徒', C: '繼續練習' },
      g4: { S: '找零高手', A: '找零達人', B: '找零學徒', C: '繼續練習' },
      g5: { S: '消消之王', A: '消消達人', B: '消消學徒', C: '繼續練習' },
      g6: { S: '記憶天才', A: '記憶達人', B: '記憶學徒', C: '繼續練習' },
      g7:  { S: '蛇王傳說', A: '數字達蛇', B: '蛇途學徒', C: '繼續練習' },
      g10: { S: '火眼金睛', A: '目不轉睛', B: '眼疾手快', C: '眼花撩亂' },
      g11: { S: '倒酒大師', A: '精準高手', B: '手感不穩', C: '灑了好多' },
      g12: { S: '猜拳之神', A: '讀心高手', B: '拳法學徒', C: '繼續練習' },
      g13: { S: '吐司大廚', A: '美食達人', B: '食物學徒', C: '再試一次' },
      g14: { S: '金幣大亨', A: '打鼠高手', B: '打鼠學徒', C: '再練練吧' },
    };
  }

  // ── HUD ──────────────────────────────────────────

  renderHUD(maxLives) {
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
        <div id="gue-lives"></div>
      </div>
    `;
    document.body.prepend(hud);
    this.updateLives(maxLives, maxLives);
  }

  updateScore(score) {
    const el = document.getElementById('gue-score');
    if (el) el.textContent = Number(score).toLocaleString();
  }

  updateLives(lives, max) {
    const el = document.getElementById('gue-lives');
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < max; i++) {
      const span = document.createElement('span');
      span.className = `gue-heart ${i < lives ? 'gue-heart-full' : 'gue-heart-empty'}`;
      span.textContent = i < lives ? '❤️' : '🖤';
      el.appendChild(span);
    }
  }

  updateTimer(ratio) {
    const el = document.getElementById('gue-timer-bar');
    if (!el) return;
    el.style.width = `${Math.max(0, ratio * 100)}%`;
    el.classList.toggle('gue-timer-danger', ratio < 0.3);
  }

  // ── 倒數開場 ─────────────────────────────────────

  showCountdown(callback) {
    const overlay = document.createElement('div');
    overlay.className = 'gue-countdown-overlay';
    document.body.appendChild(overlay);

    const steps = [
      { text: '3', cls: '', snd: 'countdown-3' },
      { text: '2', cls: '', snd: 'countdown-2' },
      { text: '1', cls: '', snd: 'countdown-1' },
      { text: 'Go!', cls: 'go', snd: 'countdown-go' },
    ];
    let i = 0;

    const showStep = () => {
      const { text, cls, snd } = steps[i];
      window.gameAudio?.play(snd);
      overlay.innerHTML = `<span class="gue-countdown-num ${cls}">${text}</span>`;
      i++;
      if (i < steps.length) {
        setTimeout(showStep, 720);
      } else {
        setTimeout(() => {
          overlay.remove();
          if (callback) callback();
        }, 480);
      }
    };

    showStep();
  }

  // ── Combo 動畫 ────────────────────────────────────

  showCombo(combo) {
    const multiplier = combo >= 10 ? 4 : combo >= 6 ? 3 : combo >= 3 ? 2 : 1;
    if (multiplier < 2) return;
    const el = document.createElement('div');
    el.className = 'gue-combo-popup';
    el.textContent = `COMBO ×${multiplier}！`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  // ── 得分飛出 ──────────────────────────────────────

  showScorePopup(x, y, points) {
    const el = document.createElement('div');
    el.className = 'gue-score-popup';
    el.textContent = `+${points}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }

  // ── 粒子爆炸 ──────────────────────────────────────

  showHitEffect(x, y) {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'gue-particle';
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 45 + Math.random() * 35;
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      p.style.background = this._particleColors[i % this._particleColors.length];
      const size = 6 + Math.random() * 6;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 650);
    }
  }

  // ── 答錯震動 ──────────────────────────────────────

  showMissEffect() {
    const body = document.body;
    body.classList.remove('gue-shake', 'gue-flash-red');
    void body.offsetWidth; // reflow 重啟動畫
    body.classList.add('gue-shake', 'gue-flash-red');
    setTimeout(() => body.classList.remove('gue-shake', 'gue-flash-red'), 500);
  }

  // ── 結束畫面 ──────────────────────────────────────

  showResultScreen({ score, maxCombo, elapsed, highScore, isNewRecord, gameTitle, gameId }) {
    const titles = this._gradeMap[gameId] || this._gradeMap.g1;

    let grade, title;
    if (score >= 2000)      { grade = 'S'; title = titles.S; }
    else if (score >= 1000) { grade = 'A'; title = titles.A; }
    else if (score >= 500)  { grade = 'B'; title = titles.B; }
    else                    { grade = 'C'; title = titles.C; }

    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

    const overlay = document.createElement('div');
    overlay.className = 'gue-result-overlay';
    overlay.innerHTML = `
      <div class="gue-result-card">
        ${isNewRecord ? '<div class="gue-new-record">🏆 新紀錄！</div>' : ''}
        <div class="gue-result-title">${gameTitle}</div>
        <div class="gue-result-grade grade-${grade.toLowerCase()}">${grade}</div>
        <div class="gue-result-badge">${title}</div>
        <div class="gue-result-score">${Number(score).toLocaleString()}</div>
        <div class="gue-result-highscore" id="gue-hs-display">最高紀錄：${Number(highScore).toLocaleString()}</div>
        <div class="gue-result-stats">
          <div class="gue-stat">
            <div class="gue-stat-val">${maxCombo}</div>
            <div class="gue-stat-label">最長連擊</div>
          </div>
          <div class="gue-stat">
            <div class="gue-stat-val">${timeStr}</div>
            <div class="gue-stat-label">遊戲時間</div>
          </div>
        </div>
        <div class="gue-result-btns">
          <button class="gue-btn-replay" id="gue-replay-btn">再玩一次</button>
          <button class="gue-btn-home"   id="gue-home-btn">返回選單</button>
        </div>
        <button class="gue-btn-clear-hs" id="gue-clear-hs-btn">清除最高分</button>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('gue-replay-btn')
      .addEventListener('click', () => location.reload());
    document.getElementById('gue-home-btn')
      .addEventListener('click', () => { location.href = '../index.html'; });
    document.getElementById('gue-clear-hs-btn')
      .addEventListener('click', () => {
        localStorage.removeItem(`miniGame_${gameId}_highScore`);
        const hs = document.getElementById('gue-hs-display');
        if (hs) hs.textContent = '最高紀錄：0';
        const btn = document.getElementById('gue-clear-hs-btn');
        if (btn) { btn.textContent = '✓ 已清除'; btn.disabled = true; }
      });
  }
}
