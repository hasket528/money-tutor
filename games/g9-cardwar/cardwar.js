'use strict';

const SUITS    = ['♠', '♥', '♦', '♣'];
const RANKS    = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RED_SUITS = new Set(['♥', '♦']);
const POOL_SIZE = 6;

let G = {};

// ─── State ────────────────────────────────────────────────────────────────────
function resetState({ mode, aceHigh, totalRounds, flipFirst }) {
  G = {
    mode,         // 'cpu' | 'pvp'
    aceHigh,
    totalRounds,
    flipFirst,    // 'player' | 'cpu'  (who selects first, cpu mode only)
    round: 0,
    score: [0, 0],
    deck: shuffle(makeDeck()),
    cursor: 0,
    pool: [],
    side1Pick: null,  // player / p1 chosen card index
    side2Pick: null,  // cpu   / p2 chosen card index
    locked: false,
    picker: null,     // 'player' | 'cpu' | 'p1' | 'p2'
  };
}

// ─── Deck ─────────────────────────────────────────────────────────────────────
function makeDeck() { return SUITS.flatMap(s => RANKS.map(r => ({ s, r }))); }

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCard() {
  if (G.cursor + POOL_SIZE * 2 > G.deck.length) { G.deck = shuffle(makeDeck()); G.cursor = 0; }
  return G.deck[G.cursor++];
}

function cardValue(card) {
  if (card.r === 'A') return G.aceHigh ? 14 : 1;
  return { J: 11, Q: 12, K: 13 }[card.r] ?? +card.r;
}

function side1Name() { return G.mode === 'cpu' ? '玩家' : '玩家 1'; }
function side2Name() { return G.mode === 'cpu' ? '電腦' : '玩家 2'; }

// ─── Card HTML ────────────────────────────────────────────────────────────────
function cardHTML(card, idx) {
  const redCls = RED_SUITS.has(card.s) ? ' red' : '';
  return `
    <div class="crd-wrap">
      <div class="crd" data-idx="${idx}">
        <div class="crd-face crd-back"></div>
        <div class="crd-face crd-front${redCls}">
          <div class="crd-corner crd-tl">
            <div class="crd-r">${card.r}</div>
            <div class="crd-s">${card.s}</div>
          </div>
          <div class="crd-big">${card.s}</div>
          <div class="crd-corner crd-br">
            <div class="crd-r">${card.r}</div>
            <div class="crd-s">${card.s}</div>
          </div>
        </div>
      </div>
    </div>`;
}

// ─── Setup ────────────────────────────────────────────────────────────────────
let _cwMode = 'cpu';

function _cwOv(html) {
  const ov = document.createElement('div');
  ov.className = 'gue-difficulty-overlay';
  ov.id = 'cw-setup-ov';
  ov.innerHTML = `<div class="gue-difficulty-card">${html}</div>`;
  document.body.appendChild(ov);
  return ov;
}

function renderSetup() {
  document.getElementById('app').innerHTML = '';
  const ex = document.getElementById('cw-setup-ov');
  if (ex) ex.remove();
  window.gameAudio = new GameAudio().preload(
    ...GameAudio.COMMON, 'g9-card-select', 'g9-card-flip', 'win-round'
  );
  _cwShowModeCard();
}

function _cwShowModeCard() {
  const ov = _cwOv(`
    <a href="../index.html" class="cw-back-link">← 遊戲選單</a>
    <div class="gue-difficulty-title">🃏 比大小</div>
    <div class="gue-difficulty-sub">翻牌對決，誰的牌大誰就贏！</div>
    <button class="gue-diff-btn gue-diff-easy" data-mode="cpu">
      🤖 玩家 vs 電腦 <span class="gue-diff-badge">與電腦翻牌比大小</span>
    </button>
    <button class="gue-diff-btn gue-diff-normal" data-mode="pvp">
      👥 雙人對戰 <span class="gue-diff-badge">兩位玩家輪流選牌</span>
    </button>
  `);
  ov.querySelectorAll('[data-mode]').forEach(btn =>
    btn.addEventListener('click', () => {
      _cwMode = btn.dataset.mode;
      ov.remove();
      _cwShowSettingsCard();
    })
  );
}

function _cwShowSettingsCard() {
  const isCpu = _cwMode === 'cpu';
  const flipSection = isCpu ? `
    <div class="cw-opt-group">
      <div class="cw-opt-label">翻牌順序</div>
      <div class="cw-opt-row">
        <button class="cw-opt-btn cw-green active" data-flip="player">👤 玩家先翻</button>
        <button class="cw-opt-btn cw-red"          data-flip="cpu">🤖 電腦先翻</button>
      </div>
    </div>` : '';

  const ov = _cwOv(`
    <button class="cw-back-link" data-back>← 返回</button>
    <div class="gue-difficulty-title">${isCpu ? '🤖 玩家 vs 電腦' : '👥 雙人對戰'}</div>
    <div class="gue-difficulty-sub">調整遊戲設定</div>
    ${flipSection}
    <div class="cw-opt-group">
      <div class="cw-opt-label">⚔️ 局數</div>
      <div class="cw-opt-row">
        <button class="cw-opt-btn cw-gold-dark"        data-rounds="5">🃏 5 局</button>
        <button class="cw-opt-btn cw-gold-mid  active" data-rounds="10">🃏 10 局</button>
        <button class="cw-opt-btn cw-gold-light"       data-rounds="15">🃏 15 局</button>
      </div>
    </div>
    <div class="cw-opt-group">
      <div class="cw-opt-label">🂡 A 牌規則</div>
      <div class="cw-opt-row">
        <button class="cw-opt-btn cw-green active" data-ace="low">A 最小（1點）</button>
        <button class="cw-opt-btn cw-red"          data-ace="high">A 最大（超越 K）</button>
      </div>
    </div>
    <button class="cw-start-btn" id="cw-start-btn">🚀 開始！</button>
  `);

  ['[data-flip]', '[data-rounds]', '[data-ace]'].forEach(sel => {
    ov.querySelectorAll(sel).forEach(btn =>
      btn.addEventListener('click', () => {
        ov.querySelectorAll(sel).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      })
    );
  });

  ov.querySelector('[data-back]').addEventListener('click', () => { ov.remove(); _cwShowModeCard(); });
  document.getElementById('cw-start-btn').addEventListener('click', () => {
    const flipFirst   = ov.querySelector('[data-flip].active')?.dataset.flip ?? 'player';
    const totalRounds = +(ov.querySelector('[data-rounds].active').dataset.rounds);
    const aceHigh     = ov.querySelector('[data-ace].active').dataset.ace === 'high';
    ov.remove();
    resetState({ mode: _cwMode, aceHigh, totalRounds, flipFirst });
    startRound();
  });
}

// ─── Round ────────────────────────────────────────────────────────────────────
function startRound() {
  G.round++;
  G.pool      = Array.from({ length: POOL_SIZE }, drawCard);
  G.side1Pick = null;
  G.side2Pick = null;
  G.locked    = false;

  if (G.mode === 'cpu') {
    G.picker = G.flipFirst === 'cpu' ? 'cpu' : 'player';
  } else {
    G.picker = 'p1';
  }

  renderRound();

  if (G.mode === 'cpu' && G.flipFirst === 'cpu') {
    G.locked = true;
    setTimeout(cpuAutoSelect, 900);
  }
}

function pickerMsg() {
  if (G.picker === 'cpu') return '🤖 電腦選牌中…';
  if (G.picker === 'p2')  return `🫵 ${side2Name()} 請選牌`;
  return `🫵 ${side1Name()} 請選牌`;
}

function renderRound() {
  const isLast = G.round === G.totalRounds;
  document.getElementById('app').innerHTML = `
    <div class="game-screen">
      <div class="game-hdr">
        <button class="back-sm" onclick="renderSetup()">‹</button>
        <div class="hdr-center">
          <div class="round-lbl">第 ${G.round} 局 / ${G.totalRounds} 局</div>
          <div class="score-row">
            <span class="s-p1">${side1Name()} <span class="s-num">${G.score[0]}</span></span>
            <span class="s-sep">—</span>
            <span class="s-p2"><span class="s-num">${G.score[1]}</span> ${side2Name()}</span>
          </div>
        </div>
        <div class="hdr-spacer"></div>
      </div>

      <div class="turn-bar" id="turn-bar">${pickerMsg()}</div>

      <div class="pool-grid" id="pool-grid">
        ${G.pool.map((c, i) => cardHTML(c, i)).join('')}
      </div>

      <div class="result-strip" id="result-strip" style="display:none"></div>

      <button class="next-btn" id="next-btn" style="display:none">
        ${isLast ? '查看結果 🏆' : '下一局 →'}
      </button>
    </div>`;

  document.getElementById('pool-grid').addEventListener('click', e => {
    const wrap = e.target.closest('.crd-wrap');
    if (!wrap) return;
    const crd = wrap.querySelector('.crd');
    if (crd) onCardClick(+crd.dataset.idx);
  });
}

function onCardClick(idx) {
  if (G.locked) return;
  const crd = document.querySelector(`.crd[data-idx="${idx}"]`);
  if (!crd || crd.classList.contains('sel-p1') || crd.classList.contains('sel-p2')) return;

  if (G.mode === 'cpu') {
    if (G.picker !== 'player') return;
    window.gameAudio?.play('g9-card-select');
    G.side1Pick = idx;
    G.locked    = true;
    selectCard(idx, 'sel-p1', side1Name(), 'lbl-p1');
    if (G.side2Pick !== null) {
      // 電腦已先選牌（flipFirst === 'cpu'），直接翻牌
      setTurnBar('🃏 翻牌！');
      setTimeout(flipBoth, 500);
    } else {
      G.picker = 'cpu';
      setTurnBar(pickerMsg());
      setTimeout(cpuAutoSelect, 800);
    }
  } else {
    if (G.picker === 'p1') {
      window.gameAudio?.play('g9-card-select');
      G.side1Pick = idx;
      G.picker    = 'p2';
      selectCard(idx, 'sel-p1', side1Name(), 'lbl-p1');
      setTurnBar(pickerMsg());
    } else if (G.picker === 'p2') {
      window.gameAudio?.play('g9-card-select');
      G.side2Pick = idx;
      G.locked    = true;
      selectCard(idx, 'sel-p2', side2Name(), 'lbl-p2');
      setTurnBar('🃏 翻牌！');
      setTimeout(flipBoth, 500);
    }
  }
}

function cpuAutoSelect() {
  const used      = [G.side1Pick, G.side2Pick].filter(x => x !== null);
  const available = G.pool.map((_, i) => i).filter(i => !used.includes(i));
  const idx       = available[(Math.random() * available.length) | 0];

  G.side2Pick = idx;
  selectCard(idx, 'sel-p2', side2Name(), 'lbl-p2');

  if (G.flipFirst === 'cpu') {
    G.picker = 'player';
    G.locked = false;
    setTurnBar(pickerMsg());
  } else {
    setTurnBar('🃏 翻牌！');
    setTimeout(flipBoth, 500);
  }
}

function selectCard(idx, selCls, labelText, labelCls) {
  const crd = document.querySelector(`.crd[data-idx="${idx}"]`);
  if (!crd) return;
  crd.classList.add(selCls);
  const label = document.createElement('div');
  label.className = `pick-label ${labelCls}`;
  label.textContent = labelText;
  crd.parentElement.appendChild(label);
}

function setTurnBar(msg) {
  const el = document.getElementById('turn-bar');
  if (el) el.textContent = msg;
}

function addCardBadge(idx, text, cls) {
  const wrap = document.querySelector(`.crd[data-idx="${idx}"]`)?.parentElement;
  if (!wrap) return;
  const badge = document.createElement('div');
  badge.className = `card-badge ${cls}`;
  badge.textContent = text;
  wrap.appendChild(badge);
}

// ─── Simultaneous Flip ────────────────────────────────────────────────────────
function flipBoth() {
  if (G.side1Pick === null || G.side2Pick === null) return;
  window.gameAudio?.play('g9-card-flip');
  // Flip both cards at the exact same moment
  document.querySelector(`.crd[data-idx="${G.side1Pick}"]`)?.classList.add('flipped');
  document.querySelector(`.crd[data-idx="${G.side2Pick}"]`)?.classList.add('flipped');
  // Wait for flip animation (550ms) then apply winner/loser scale
  setTimeout(resolveRound, 660);
}

// ─── Resolve ──────────────────────────────────────────────────────────────────
function resolveRound() {
  const c1 = G.pool[G.side1Pick];
  const c2 = G.pool[G.side2Pick];
  const v1 = cardValue(c1);
  const v2 = cardValue(c2);

  const el1 = document.querySelector(`.crd[data-idx="${G.side1Pick}"]`);
  const el2 = document.querySelector(`.crd[data-idx="${G.side2Pick}"]`);

  let stripCls, msg;
  if (v1 > v2) {
    G.score[0]++;
    window.gameAudio?.play('win-round');
    stripCls = 'rs-p1';
    msg = `🎉 ${side1Name()} 贏了！（${c1.r}${c1.s} > ${c2.r}${c2.s}）`;
    el1?.classList.add('winner');
    el2?.classList.add('loser');
    addCardBadge(G.side1Pick, '大', 'badge-winner');
    addCardBadge(G.side2Pick, '小', 'badge-loser');
  } else if (v2 > v1) {
    G.score[1]++;
    window.gameAudio?.play('win-round');
    stripCls = 'rs-p2';
    msg = `⚡ ${side2Name()} 贏了！（${c2.r}${c2.s} > ${c1.r}${c1.s}）`;
    el2?.classList.add('winner');
    el1?.classList.add('loser');
    addCardBadge(G.side2Pick, '大', 'badge-winner');
    addCardBadge(G.side1Pick, '小', 'badge-loser');
  } else {
    stripCls = 'rs-tie';
    msg = `🤝 平手！（${c1.r}${c1.s} = ${c2.r}${c2.s}）`;
    el1?.classList.add('tie-card');
    el2?.classList.add('tie-card');
    addCardBadge(G.side1Pick, '＝', 'badge-tie');
    addCardBadge(G.side2Pick, '＝', 'badge-tie');
  }

  G.pool.forEach((_, i) => {
    if (i !== G.side1Pick && i !== G.side2Pick)
      document.querySelector(`.crd[data-idx="${i}"]`)?.classList.add('dimmed');
  });

  const bar = document.getElementById('turn-bar');
  if (bar) bar.style.display = 'none';

  const strip = document.getElementById('result-strip');
  strip.textContent   = msg;
  strip.className     = `result-strip ${stripCls}`;
  strip.style.display = '';

  const nextBtn = document.getElementById('next-btn');
  nextBtn.style.display = '';

  nextBtn.addEventListener('click', () => {
    if (G.round < G.totalRounds) startRound();
    else renderFinalResult();
  }, { once: true });
}

// ─── Final Result ─────────────────────────────────────────────────────────────
function renderFinalResult() {
  const [s1, s2] = G.score;
  let trophy, titleText, winCls, subText;
  if (s1 > s2) {
    trophy = '🏆'; titleText = `${side1Name()} 獲勝！`; winCls = 'win-p1';
    subText = `${s1} 勝 vs ${s2} 勝（共 ${G.totalRounds} 局）`;
  } else if (s2 > s1) {
    trophy = '🏆'; titleText = `${side2Name()} 獲勝！`; winCls = 'win-p2';
    subText = `${s2} 勝 vs ${s1} 勝（共 ${G.totalRounds} 局）`;
  } else {
    trophy = '🤝'; titleText = '勢均力敵，平局！'; winCls = 'win-tie';
    subText = `各贏 ${s1} 局（共 ${G.totalRounds} 局）`;
  }

  document.getElementById('app').innerHTML = `
    <div class="result-screen">
      <div class="res-trophy">${trophy}</div>
      <div class="res-title ${winCls}">${titleText}</div>
      <div class="res-sub">${subText}</div>
      <div class="res-score-row">
        <div class="res-score-card p1">
          <div class="res-sc-name">${side1Name()}</div>
          <div class="res-sc-val">${s1}</div>
          <div class="res-sc-label">勝</div>
        </div>
        <div class="res-score-sep">:</div>
        <div class="res-score-card p2">
          <div class="res-sc-name">${side2Name()}</div>
          <div class="res-sc-val">${s2}</div>
          <div class="res-sc-label">勝</div>
        </div>
      </div>
      <div class="res-rule-note">A 牌規則：${G.aceHigh ? 'A 最大（14點）' : 'A 最小（1點）'}</div>
      <div class="res-btns">
        <button class="res-btn-replay" id="replay-btn">再玩一次</button>
        <button class="res-btn-home"   id="home-btn">返回選單</button>
      </div>
    </div>`;

  document.getElementById('replay-btn').addEventListener('click', renderSetup);
  document.getElementById('home-btn').addEventListener('click', () => { location.href = '../index.html'; });
}

document.addEventListener('DOMContentLoaded', renderSetup);
