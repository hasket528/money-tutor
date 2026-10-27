'use strict';

/* ══════════════════════════════════════════════════════════
   G12 猜拳大戰 — 遊戲邏輯
   ══════════════════════════════════════════════════════════ */

// ── 常數 ──────────────────────────────────────────────────
const MOVES = ['rock', 'paper', 'scissors'];
const BEATS = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

// ── 遊戲狀態 ──────────────────────────────────────────────
const G = {
  mode:       null,   // 'pvc' | 'pvp'
  difficulty: null,   // 'easy' | 'normal' | 'hard'
  maxRounds:  3,
  scores:     [0, 0],
  round:      0,      // 已完成局數
  history:    [],     // [{ p1, p2, winner }]
  state:      'setup',
  p1Move:     null,
  p2Move:     null,
  playerMoveHistory: [],  // hard 模式用
  streak:     [0, 0], // [p1 streak, p2 streak]
};

// 勝局門檻
function winsNeeded() { return Math.ceil(G.maxRounds / 2); }

// ── 音效 ──────────────────────────────────────────────────
function initAudio() {
  window.gameAudio = new GameAudio().preload(
    ...GameAudio.COMMON,
    'win-round', 'life-lost', 'game-btn-click',
    'g9-card-flip', 'g9-card-select'
  );
}

// ── DOM 工具 ──────────────────────────────────────────────
const $ = id => document.getElementById(id);

function showEl(id)  { $(id)?.classList.remove('hidden'); }
function hideEl(id)  { $(id)?.classList.add('hidden'); }
function setText(id, txt) { const el = $(id); if (el) el.textContent = txt; }

// ── 手勢 emoji ──────────────────────────────────────────────
const MOVE_EMOJI = { rock: '✊', paper: '✋', scissors: '✌️' };

// ── 設定畫面 ──────────────────────────────────────────────
function initSetup() {
  // 模式選擇
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.gameAudio?.play('game-btn-click');
      G.mode = btn.dataset.mode;
      document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      if (G.mode === 'pvc') {
        showEl('step-diff');
      } else {
        hideEl('step-diff');
        G.difficulty = null;
        showEl('step-rounds');
      }
    });
  });

  // 難度選擇
  document.querySelectorAll('[data-diff]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.gameAudio?.play('game-btn-click');
      G.difficulty = btn.dataset.diff;
      document.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      showEl('step-rounds');
    });
  });

  // 局數選擇 → 啟動遊戲
  document.querySelectorAll('[data-rounds]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.gameAudio?.play('game-btn-click');
      G.maxRounds = +btn.dataset.rounds;
      document.querySelectorAll('[data-rounds]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      setTimeout(startGame, 300);
    });
  });
}

// ── 遊戲啟動 ──────────────────────────────────────────────
function startGame() {
  G.scores = [0, 0];
  G.round  = 0;
  G.history = [];
  G.playerMoveHistory = [];
  G.streak = [0, 0];
  G.state  = 'playing';

  hideEl('rps-setup');
  showEl('rps-game');

  // 更新 HUD 名稱
  setText('hud-name-2', G.mode === 'pvc' ? '電腦' : '玩家 2');
  setText('side-name-right', G.mode === 'pvc' ? '電腦' : '玩家 2');

  renderHistory();
  startRound();
}

// ── 開始一局 ──────────────────────────────────────────────
function startRound() {
  G.p1Move = null;
  G.p2Move = null;

  setText('hud-round', `第 ${G.round + 1} 局`);
  updateScoreHUD();

  // 重置手勢顯示（清掉前一局 emoji）
  resetHandDisplay('hand-left');
  resetHandDisplay('hand-right');
  hideEl('result-tag-left');
  hideEl('result-tag-right');

  // 重置中間區域
  showEl('center-vs');
  hideEl('center-countdown');
  hideEl('center-result');
  hideEl('rps-next-btn');

  // 清除所有動畫與狀態 class
  const hw1 = $('hand-left');
  const hw2 = $('hand-right');
  if (hw1) hw1.className = 'hand-wrap';
  if (hw2) hw2.className = 'hand-wrap';
  // 清除前一局留下的 emoji
  hw1?.querySelector('.rps-hand')?.remove();
  hw2?.querySelector('.rps-hand')?.remove();

  // 恢復問號
  toggleQuestion('hand-left',  true);
  toggleQuestion('hand-right', true);

  if (G.mode === 'pvc') {
    promptPlayer(1);
  } else {
    promptPlayer(1);  // PvP：先讓 P1 出拳
  }
}

function toggleQuestion(wrapId, show) {
  const wrap = $(wrapId);
  if (!wrap) return;
  const q = wrap.querySelector('.hand-question');
  if (q) q.style.display = show ? '' : 'none';
}

function resetHandDisplay(wrapId) {
  $(wrapId)?.querySelector('.rps-hand')?.remove();
}

// ── 提示玩家出拳 ───────────────────────────────────────────
function promptPlayer(playerNum) {
  G.state = `p${playerNum}-select`;
  const name = playerNum === 1 ? '玩家 1' : (G.mode === 'pvp' ? '玩家 2' : '電腦');
  setText('choice-prompt', `${name} 請出拳！`);
  showEl('rps-choices');

  // 啟用按鈕
  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.disabled = false;
    btn.onclick  = () => onChoiceMade(playerNum, btn.dataset.move);
  });
}

// ── 玩家做出選擇 ───────────────────────────────────────────
function onChoiceMade(playerNum, move) {
  window.gameAudio?.play('g9-card-select');
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
  hideEl('rps-choices');

  if (playerNum === 1) {
    G.p1Move = move;
    if (G.mode === 'pvc') {
      // 電腦思考
      G.playerMoveHistory.push(move);
      G.p2Move = computerChoice();
      startCountdown();
    } else {
      // PvP：遮住 P1 的選擇，讓 P2 出拳
      showCover(2);
    }
  } else {
    // PvP P2 出拳完成
    G.p2Move = move;
    hideCover();
    startCountdown();
  }
}

// ── PvP 遮擋 ──────────────────────────────────────────────
function showCover(nextPlayer) {
  const name = nextPlayer === 2 ? '玩家 2' : '玩家 1';
  setText('cover-msg', `換 ${name} 出拳`);
  showEl('rps-cover');
  $('cover-ready-btn').onclick = () => {
    hideCover();
    promptPlayer(nextPlayer);
  };
}

function hideCover() {
  hideEl('rps-cover');
}

// ── 電腦 AI ───────────────────────────────────────────────
function computerChoice() {
  const rand = () => MOVES[Math.floor(Math.random() * 3)];
  const counter = m => ({ rock: 'paper', paper: 'scissors', scissors: 'rock' }[m]);

  if (G.difficulty === 'easy') {
    return rand();
  }

  if (G.difficulty === 'normal') {
    const hist = G.playerMoveHistory;
    if (hist.length > 0 && Math.random() < 0.35) {
      return counter(hist[hist.length - 1]);
    }
    return rand();
  }

  // hard：分析玩家最常出的拳，反制它
  const hist = G.playerMoveHistory;
  if (hist.length < 3) return rand();
  if (Math.random() < 0.15) return rand(); // 15% 隨機，避免太可預測

  const freq = { rock: 0, paper: 0, scissors: 0 };
  hist.slice(-8).forEach(m => freq[m]++); // 取最近 8 次
  const topMove = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  return counter(topMove);
}

// ── 倒數動畫 ──────────────────────────────────────────────
function startCountdown() {
  G.state = 'countdown';
  hideEl('center-vs');
  showEl('center-countdown');

  // 兩側手勢開始抖動
  const hw1 = $('hand-left');
  const hw2 = $('hand-right');
  if (hw1) hw1.classList.add('pumping');
  if (hw2) hw2.classList.add('pumping');

  const steps = ['3', '2', '1', 'GO!'];
  const snds   = ['countdown-3', 'countdown-2', 'countdown-1', 'countdown-go'];
  let i = 0;

  const cd = $('center-countdown');
  const tick = () => {
    if (!cd) return;
    window.gameAudio?.play(snds[i]);
    cd.textContent = steps[i];
    // 觸發 pop 動畫重播
    cd.style.animation = 'none';
    void cd.offsetWidth;
    cd.style.animation = '';
    i++;
    if (i < steps.length) {
      setTimeout(tick, 700);
    } else {
      setTimeout(revealMoves, 500);
    }
  };
  tick();
}

// ── 揭曉雙方出拳 ───────────────────────────────────────────
function revealMoves() {
  window.gameAudio?.play('g9-card-flip');

  const hw1 = $('hand-left');
  const hw2 = $('hand-right');
  hw1?.classList.remove('pumping');
  hw2?.classList.remove('pumping');

  toggleQuestion('hand-left',  false);
  toggleQuestion('hand-right', false);

  // 插入 emoji 手勢（dirClass = 'facing-right' | 'facing-left' | ''）
  function setEmoji(wrapId, move, dirClass = '') {
    const wrap = $(wrapId);
    if (!wrap) return;
    wrap.querySelector('.rps-hand')?.remove();
    const el = document.createElement('div');
    el.className   = dirClass ? `rps-hand ${dirClass}` : 'rps-hand';
    el.textContent = MOVE_EMOJI[move];
    wrap.appendChild(el);
  }
  setEmoji('hand-left',  G.p1Move, 'facing-right');  // P1 rotate(90deg) → 朝右
  setEmoji('hand-right', G.p2Move, 'facing-left');   // P2 rotate(-90deg) → 朝左

  hw1?.classList.add('revealing');
  hw2?.classList.add('revealing');
  setTimeout(() => {
    hw1?.classList.remove('revealing');
    hw2?.classList.remove('revealing');
    hideEl('center-countdown');
    resolveRound();
  }, 500);
}

// ── 判斷勝負 ──────────────────────────────────────────────
function resolveRound() {
  const p1 = G.p1Move, p2 = G.p2Move;
  let winner = 'tie';
  if (BEATS[p1] === p2) winner = 'p1';
  else if (BEATS[p2] === p1) winner = 'p2';

  G.history.push({ p1, p2, winner });
  G.round++;

  const resultEl = $('center-result');
  if (resultEl) {
    resultEl.className = 'hidden';
    if (winner === 'tie') {
      resultEl.textContent = '平手！';
      resultEl.className   = 'tie';
    } else {
      const winnerName = winner === 'p1'
        ? '玩家 1'
        : (G.mode === 'pvc' ? '電腦' : '玩家 2');
      resultEl.textContent = `${winnerName}\n勝！`;
      resultEl.className   = winner === 'p1' ? 'win' : 'lose';
    }
    showEl('center-result');
  }

  // 手勢動畫
  const hw1 = $('hand-left');
  const hw2 = $('hand-right');
  if (winner === 'p1') {
    hw1?.classList.add('win-bounce', 'win-state');
    hw2?.classList.add('lose-shake', 'lose-state');
  } else if (winner === 'p2') {
    hw2?.classList.add('win-bounce', 'win-state');
    hw1?.classList.add('lose-shake', 'lose-state');
  } else {
    document.body.classList.add('tie-flash');
    setTimeout(() => document.body.classList.remove('tie-flash'), 700);
  }

  // 標籤
  if (winner !== 'tie') {
    const tag1 = $('result-tag-left');
    const tag2 = $('result-tag-right');
    if (tag1) { tag1.textContent = winner === 'p1' ? '勝' : '敗'; tag1.className = `round-result-tag ${winner === 'p1' ? 'win' : 'lose'}`; showEl('result-tag-left'); }
    if (tag2) { tag2.textContent = winner === 'p2' ? '勝' : '敗'; tag2.className = `round-result-tag ${winner === 'p2' ? 'win' : 'lose'}`; showEl('result-tag-right'); }
  } else {
    const tag1 = $('result-tag-left');
    const tag2 = $('result-tag-right');
    if (tag1) { tag1.textContent = '平'; tag1.className = 'round-result-tag tie'; showEl('result-tag-left'); }
    if (tag2) { tag2.textContent = '平'; tag2.className = 'round-result-tag tie'; showEl('result-tag-right'); }
  }

  // 更新分數
  if (winner === 'p1') {
    G.scores[0]++;
    G.streak[0]++;
    G.streak[1] = 0;
    window.gameAudio?.play('win-round');
  } else if (winner === 'p2') {
    G.scores[1]++;
    G.streak[1]++;
    G.streak[0] = 0;
    window.gameAudio?.play('life-lost');
  }

  // 連勝提示（3 連勝以上，平手不算）
  if (winner !== 'tie') {
    const maxStreak = Math.max(...G.streak);
    if (maxStreak >= 3) {
      const streakWinner = G.streak[0] >= 3 ? '玩家 1' : (G.mode === 'pvc' ? '電腦' : '玩家 2');
      showStreakBanner(`🔥 ${streakWinner} ${maxStreak} 連勝！`);
    }
  }

  updateScoreHUD();
  renderHistory();

  // 判斷遊戲是否結束
  const needed = winsNeeded();
  if (G.scores[0] >= needed || G.scores[1] >= needed) {
    setTimeout(showGameEnd, 1400);
  } else {
    showEl('rps-next-btn');
  }
}

// ── 連勝橫幅 ──────────────────────────────────────────────
function showStreakBanner(msg) {
  const el = document.createElement('div');
  el.className  = 'streak-banner';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// ── 更新 HUD 分數 ──────────────────────────────────────────
function updateScoreHUD() {
  setText('hud-score-1', G.scores[0]);
  setText('hud-score-2', G.scores[1]);
}

// ── 局數記錄點 ─────────────────────────────────────────────
function renderHistory() {
  const el = $('rps-history');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < G.maxRounds; i++) {
    const dot = document.createElement('div');
    dot.className = 'history-dot';
    if (G.history[i]) {
      const w = G.history[i].winner;
      dot.classList.add(w === 'p1' ? 'p1' : w === 'p2' ? 'p2' : 'tie');
    }
    el.appendChild(dot);
  }
}

// ── 顯示最終結果 ───────────────────────────────────────────
function showGameEnd() {
  const p1wins = G.scores[0], p2wins = G.scores[1];
  const p2name = G.mode === 'pvc' ? '電腦' : '玩家 2';

  let trophy = '🏆', winnerText = '';
  if (p1wins > p2wins) {
    trophy = '🥇';
    winnerText = '玩家 1 獲勝！';
    window.gameAudio?.play('new-highscore');
  } else if (p2wins > p1wins) {
    trophy = G.mode === 'pvc' ? '🤖' : '🥇';
    winnerText = `${p2name} 獲勝！`;
    window.gameAudio?.play('game-over-common');
  } else {
    trophy = '🤝';
    winnerText = '平手！';
  }

  setText('end-trophy', trophy);
  setText('end-winner', winnerText);
  setText('end-score', `${p1wins} — ${p2wins}`);

  // 每局記錄
  const hist = $('end-history');
  if (hist) {
    hist.innerHTML = G.history.map(h =>
      `<div class="history-dot ${h.winner === 'p1' ? 'p1' : h.winner === 'p2' ? 'p2' : 'tie'}"></div>`
    ).join('');
  }

  showEl('rps-end');

  $('end-rematch-btn').onclick = () => {
    window.gameAudio?.play('game-btn-click');
    hideEl('rps-end');
    startGame();
  };
  $('end-menu-btn').onclick = () => {
    location.href = '../index.html';
  };
}

// ── 下一局 ────────────────────────────────────────────────
$('rps-next-btn')?.addEventListener('click', () => {
  window.gameAudio?.play('game-btn-click');
  hideEl('rps-next-btn');
  startRound();
});

// ── 遮擋就緒按鈕 ──────────────────────────────────────────
$('cover-ready-btn')?.addEventListener('click', () => {
  window.gameAudio?.play('game-btn-click');
});

// ══ 啟動 ══════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  initAudio();
  initSetup();
});
