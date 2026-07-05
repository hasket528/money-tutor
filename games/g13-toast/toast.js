'use strict';

/* ══════════════════════════════════════════════════════════
   G13 吐司大作戰 — 上往下捲動 + 神秘門版
   ══════════════════════════════════════════════════════════
   流程：
   1. 選角色 → 遊戲畫面（顯示「開始」鈕）
   2. 按開始 → 門從上方落下（approach）
   3. 門到達吐司旁 → 強制選左或右（mystery：不標喜歡/討厭）
   4. 選門後 → 食物從上方一排排落下（food_zone）
   5. 人臉落下 → 送餐畫面 → 結果畫面（此時才揭曉好惡）
   ══════════════════════════════════════════════════════════ */

// ── 角色 ──────────────────────────────────────────────────
const CHARS = [
  {
    id: 'kid', emoji: '👦', name: '小明', desc: '愛吃零食的小孩',
    likes:    ['🍕','🍔','🍟','🍦','🍩','🍬','🧁','🫐'],
    dislikes: ['🥦','🥕','🧅','🫑','🥒','🥗','🍄','🥬'],
  },
  {
    id: 'grandma', emoji: '👵', name: '奶奶', desc: '注重健康的奶奶',
    likes:    ['🥕','🥦','🥗','🫑','🥒','🍄','🥬','🫐'],
    dislikes: ['🍕','🍔','🍩','🍬','🍟','🧁','🍦','🌶️'],
  },
  {
    id: 'chef', emoji: '👨‍🍳', name: '主廚', desc: '熱愛食材的廚師',
    likes:    ['🥩','🧀','🥚','🌮','🍖','🍳','🦐','🥓'],
    dislikes: ['🍬','🍭','🍩','🧁','🍦','🍟','🍫','🥤'],
  },
  {
    id: 'cat', emoji: '🐱', name: '貓咪', desc: '挑食的小貓咪',
    likes:    ['🐟','🍣','🥛','🥚','🍗','🦐','🧀','🥩'],
    dislikes: ['🥦','🥗','🍬','🍕','🥒','🧅','🍵','🥕'],
  },
  {
    id: 'athlete', emoji: '🏃', name: '運動員', desc: '注重蛋白質的選手',
    likes:    ['🥩','🍗','🥚','🦐','🥦','🫐','🧀','🥕'],
    dislikes: ['🍬','🍭','🍩','🧁','🍫','🍟','🍦','🍕'],
  },
  {
    id: 'ninja', emoji: '🥷', name: '忍者', desc: '神秘的武道高手',
    likes:    ['🍣','🐟','🦐','🥚','🍄','🥒','🥗','🥬'],
    dislikes: ['🍔','🍟','🍕','🌶️','🧅','🍩','🍬','🥤'],
  },
  {
    id: 'baby', emoji: '👶', name: '小寶寶', desc: '挑食的小寶貝',
    likes:    ['🥛','🥕','🥦','🥚','🫐','🧀','🥬','🍄'],
    dislikes: ['🌶️','🧅','🍕','🍔','🍫','🥩','🍟','🧁'],
  },
  {
    id: 'wizard', emoji: '🧙', name: '魔法師', desc: '口味奇特的魔法師',
    likes:    ['🍄','🫑','🥗','🥒','🫐','🧅','🥬','🌶️'],
    dislikes: ['🍔','🍟','🍕','🍬','🍭','🍩','🧁','🍦'],
  },
];

// ── 食物名稱對照 ─────────────────────────────────────────
const FOOD_NAMES = {
  '🍕':'披薩','🍔':'漢堡','🍟':'薯條','🍦':'冰淇淋','🍩':'甜甜圈',
  '🍬':'糖果','🧁':'杯子蛋糕','🫐':'藍莓','🥦':'花椰菜','🥕':'胡蘿蔔',
  '🧅':'洋蔥','🫑':'青椒','🥒':'小黃瓜','🥗':'沙拉','🍄':'香菇',
  '🥬':'生菜','🌶️':'辣椒','🥩':'牛排','🧀':'起司','🥚':'雞蛋',
  '🌮':'塔可','🍖':'豬腳','🍳':'荷包蛋','🦐':'蝦子','🥓':'培根',
  '🍭':'棒棒糖','🍫':'巧克力','🥤':'飲料','🐟':'魚','🍣':'壽司',
  '🥛':'牛奶','🍗':'雞腿','🍵':'茶',
};

// ── 常數 ──────────────────────────────────────────────────
const SCROLL_SPEED    = 120;   // px/秒
const GATE_H          = 120;   // 門高度（px）
const FOOD_ROW_SPACE  = 70;    // 食物排間距（px）
const FOOD_ROWS       = 10;
const FOOD_COLS       = 5;
const FACE_H          = 140;

// 食物格 X 位置（佔版面百分比）
const LEFT_XS  = Array.from({length: FOOD_COLS}, (_, i) => (i + 0.5) / FOOD_COLS * 0.47);
const RIGHT_XS = Array.from({length: FOOD_COLS}, (_, i) => 0.53 + (i + 0.5) / FOOD_COLS * 0.47);

const HIT_R_X = 34;
const HIT_R_Y = 32;

// ── 工具 ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ══════════════════════════════════════════════════════════
class ToastGame {

  constructor() {
    this.char         = null;
    this.state        = 'setup';   // setup|idle|approach|food_zone|face|delivery|result
    this.leftIsLiked  = true;      // 隨機：左門是否為喜歡的食物
    this.likedFood    = '';
    this.dislikedFood = '';
    this.chosen       = null;      // 'left' | 'right'

    this.collected    = 0;
    this.likedCount   = 0;
    this.lastTs       = null;
    this.frameId      = null;
    this._deliveryTimer = null;
    this._countTimer    = null;
    this._previewTimer  = null;
    this.mode           = 1;       // 1=輔助模式  2=記憶挑戰

    this.swX          = 0;
    this.isDragging   = false;
    this.dragLastX    = 0;

    this.gateEl       = null;
    this.gateY        = 0;
    this.foods        = [];        // { el, y, xPct, eaten }
    this.faceEl       = null;
    this.faceY        = 0;
  }

  // ── 設定畫面 ───────────────────────────────────────────

  init() {
    window.gameAudio = new GameAudio().preload(
      ...GameAudio.COMMON,
      'g2-coin-collect', 'g2-wrong-tap', 'g7-eat', 'g9-card-select'
    );
    this._buildModeSelector();
    this._buildCharCards();
  }

  _buildModeSelector() {
    const existing = $('ts-mode-selector');
    if (existing) existing.remove();

    const sel = document.createElement('div');
    sel.id = 'ts-mode-selector';
    sel.innerHTML = `
      <button class="ts-mode-btn ${this.mode === 1 ? 'active' : ''}" data-mode="1">模式一：輔助模式</button>
      <button class="ts-mode-btn ${this.mode === 2 ? 'active' : ''}" data-mode="2">模式二：記憶挑戰</button>
    `;
    sel.querySelectorAll('.ts-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.gameAudio?.play('game-btn-click');
        this.mode = parseInt(btn.dataset.mode);
        sel.querySelectorAll('.ts-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
        this._buildCharCards();
      });
    });

    const setupBody = document.querySelector('.ts-setup-body');
    setupBody.insertBefore(sel, $('ts-char-grid'));
  }

  _buildCharCards() {
    const grid = $('ts-char-grid');
    grid.innerHTML = '';
    CHARS.forEach(ch => {
      const card = document.createElement('div');
      card.className = 'ts-char-card';
      const prefHtml = this.mode === 1
        ? `<div class="ts-pref-row"><span>❤️</span>
             <span class="ts-pref-foods">${ch.likes.slice(0,4).join('')}</span></div>
           <div class="ts-pref-row"><span>💔</span>
             <span class="ts-pref-foods">${ch.dislikes.slice(0,4).join('')}</span></div>`
        : `<div class="ts-mystery-badge">❓ 記憶挑戰</div>`;
      card.innerHTML = `
        <div class="ts-char-emoji">${ch.emoji}</div>
        <div class="ts-char-name">${ch.name}</div>
        <div class="ts-char-desc">${ch.desc}</div>
        ${prefHtml}
      `;
      card.addEventListener('click', () => {
        window.gameAudio?.play('game-btn-click');
        this.char = ch;
        if (this.mode === 2) {
          this._showPreviewScreen();
        } else {
          this._showGameScreen();
        }
      });
      grid.appendChild(card);
    });
  }

  // ── 遊戲畫面（idle，等待開始）──────────────────────────

  _showPreviewScreen() {
    clearTimeout(this._previewTimer);
    $('ts-setup').classList.add('hidden');
    $('ts-preview').classList.remove('hidden');

    $('ts-preview-char').textContent  = this.char.emoji;
    $('ts-preview-name').textContent  = this.char.name + ' 喜歡吃：';
    $('ts-preview-foods').textContent = this.char.likes.slice(0, 6).join('  ');

    $('ts-preview-back').onclick = () => {
      clearTimeout(this._previewTimer);
      $('ts-preview').classList.add('hidden');
      $('ts-setup').classList.remove('hidden');
    };

    let count = 3;
    const timerEl = $('ts-preview-timer');
    const setCount = n => {
      timerEl.textContent = n;
      timerEl.classList.remove('tick');
      void timerEl.offsetWidth; // reflow 強制重啟動畫
      timerEl.classList.add('tick');
    };
    setCount(count);

    const tick = () => {
      count--;
      if (count <= 0) {
        $('ts-preview').classList.add('hidden');
        this._showGameScreen();
      } else {
        setCount(count);
        this._previewTimer = setTimeout(tick, 1000);
      }
    };
    this._previewTimer = setTimeout(tick, 1000);
  }

  _showGameScreen() {
    this.state = 'idle';
    cancelAnimationFrame(this.frameId);
    clearTimeout(this._deliveryTimer);
    clearTimeout(this._previewTimer);
    clearInterval(this._countTimer);
    speechSynthesis.cancel();

    $('ts-setup').classList.add('hidden');
    $('ts-preview').classList.add('hidden');
    $('ts-result').classList.add('hidden');
    $('ts-game').classList.remove('hidden');

    // HUD
    $('ts-hud-char').textContent  = this.char.emoji;
    $('ts-hud-likes').textContent = this.mode === 1 ? '❤️ ' + this.char.likes.slice(0,3).join('') : '';
    $('ts-collect-count').textContent = '0';

    // 清空世界
    $('ts-world').innerHTML = '';
    $('ts-fillings').textContent = '';
    $('ts-inactive-mask').className = 'hidden';
    $('ts-divider').classList.remove('hidden');
    $('ts-gate-hint').classList.add('hidden');
    $('ts-drag-hint').classList.add('hidden');

    // 吐司置中
    const playW = $('ts-play-area').clientWidth;
    this.swX = playW / 2;
    $('ts-sandwich').style.left = `${this.swX}px`;
    $('ts-sandwich').style.transition = '';

    this._bindDrag();
    this._showStartBtn();
  }

  _showStartBtn() {
    let btn = $('ts-start-btn');
    if (!btn) {
      btn = document.createElement('div');
      btn.id = 'ts-start-btn';
      btn.innerHTML = `<button class="ts-start-button">▶ 開始</button>`;
      $('ts-play-area').appendChild(btn);
    }
    btn.classList.remove('hidden');
    const startBtn = btn.querySelector('button');
    const doStart = () => {
      window.gameAudio?.play('game-btn-click');
      btn.classList.add('hidden');
      this._startGame();
    };
    startBtn.onclick = doStart;
    startBtn.addEventListener('touchstart', e => {
      e.preventDefault(); e.stopPropagation(); doStart();
    }, { passive: false });
  }

  // ── 開始遊玩 ───────────────────────────────────────────

  _startGame() {
    cancelAnimationFrame(this.frameId);

    this.chosen    = null;
    this.collected = 0;
    this.likedCount = 0;
    this.foods     = [];
    this.gateEl    = null;
    this.faceEl    = null;
    this.lastTs    = null;

    // 隨機決定左門是喜歡或討厭
    this.leftIsLiked  = Math.random() < 0.5;
    this.likedFood    = rnd(this.char.likes);
    this.dislikedFood = rnd(this.char.dislikes);

    $('ts-collect-count').textContent = '0';
    $('ts-world').innerHTML = '';

    // 建立門（從畫面上方開始落下）
    this._buildGate();

    this.state = 'approach';
    this.frameId = requestAnimationFrame(ts => this._loop(ts));
  }

  // ── 建立門（神秘門，不顯示喜歡/討厭）─────────────────

  _buildGate() {
    const worldEl = $('ts-world');
    const gate = document.createElement('div');
    gate.className = 'ts-gate-row';

    gate.innerHTML = `
      <div class="ts-gate-door ts-gate-mystery" id="ts-gate-left">
        <div class="ts-gate-food">❓</div>
        <div class="ts-gate-label">← 選這邊</div>
      </div>
      <div class="ts-gate-sep"></div>
      <div class="ts-gate-door ts-gate-mystery" id="ts-gate-right">
        <div class="ts-gate-food">❓</div>
        <div class="ts-gate-label">選這邊 →</div>
      </div>
    `;

    this.gateY = -GATE_H - 20;
    gate.style.top    = `${this.gateY}px`;
    gate.style.height = `${GATE_H}px`;
    worldEl.appendChild(gate);
    this.gateEl = gate;
  }

  // ── 建立食物（只建選定側）──────────────────────────────

  _buildFoodItems() {
    const worldEl = $('ts-world');
    const xArr    = this.chosen === 'left' ? LEFT_XS : RIGHT_XS;
    const isLiked = this.leftIsLiked === (this.chosen === 'left');
    const food    = isLiked ? this.likedFood : this.dislikedFood;

    for (let row = 0; row < FOOD_ROWS; row++) {
      const startY = -(GATE_H + 60 + row * FOOD_ROW_SPACE);

      xArr.forEach(xPct => {
        const el = document.createElement('div');
        el.className = 'ts-food';
        el.textContent = food;
        el.style.top  = `${startY}px`;
        el.style.left = `${xPct * 100}%`;
        worldEl.appendChild(el);
        this.foods.push({ el, y: startY, xPct, eaten: false, liked: isLiked });
      });
    }
  }

  // ── 建立人臉 ───────────────────────────────────────────

  _buildFace() {
    const worldEl = $('ts-world');
    const face = document.createElement('div');
    face.className = 'ts-face-row';
    face.innerHTML = `
      <div class="ts-face-emoji">${this.char.emoji}</div>
      <div class="ts-face-mouth">👄</div>
    `;
    this.faceY = -(FACE_H + 30);
    face.style.top = `${this.faceY}px`;
    worldEl.appendChild(face);
    this.faceEl = face;
  }

  // ── 拖曳綁定 ───────────────────────────────────────────

  _bindDrag() {
    const area = $('ts-play-area');
    area.onmousedown = e => { e.preventDefault(); this._dStart(e.clientX); };
    document.onmousemove = e => { if (this.isDragging) this._dMove(e.clientX); };
    document.onmouseup   = () => { if (this.isDragging) this._dStop(); };

    // 移除前一局殘留的 touch listeners，避免多局累積
    if (this._onTouchStart) {
      area.removeEventListener('touchstart', this._onTouchStart, { passive: false });
      document.removeEventListener('touchmove', this._onTouchMove, { passive: false });
      document.removeEventListener('touchend', this._onTouchEnd);
    }

    this._onTouchStart = e => { e.preventDefault(); this._dStart(e.touches[0].clientX); };
    this._onTouchMove  = e => { if (this.isDragging) { e.preventDefault(); this._dMove(e.touches[0].clientX); } };
    this._onTouchEnd   = () => { if (this.isDragging) this._dStop(); };

    area.addEventListener('touchstart', this._onTouchStart, { passive: false });
    document.addEventListener('touchmove', this._onTouchMove, { passive: false });
    document.addEventListener('touchend', this._onTouchEnd);
  }

  _dStart(x) {
    this.isDragging = true;
    this.dragLastX  = x;
  }

  _dMove(x) {
    if (this.state === 'idle') return;

    const dx    = x - this.dragLastX;
    this.dragLastX = x;
    const playW = $('ts-play-area').clientWidth;

    // 只在 food_zone 階段限制在選定側；food 全部過後（face 狀態）可自由移動
    let minX = 10, maxX = playW - 10;
    if (this.state === 'food_zone') {
      if (this.chosen === 'left')  maxX = playW * 0.47;
      if (this.chosen === 'right') minX = playW * 0.53;
    }

    this.swX = Math.max(minX, Math.min(maxX, this.swX + dx));
    $('ts-sandwich').style.left = `${this.swX}px`;
  }

  _dStop() { this.isDragging = false; }

  // ── 選門確認 ───────────────────────────────────────────


  _commitGate(side) {
    if (this.chosen !== null) return;  // 防止重複觸發
    this.chosen = side;
    this.state  = 'food_zone';

    window.gameAudio?.play('g9-card-select');

    if (this.gateEl) { this.gateEl.remove(); this.gateEl = null; }

    $('ts-gate-hint').classList.add('hidden');
    $('ts-drag-hint').classList.remove('hidden');

    // 遮住未選側
    const inactive = side === 'left' ? 'right' : 'left';
    const mask = $('ts-inactive-mask');
    mask.className = inactive;
    mask.classList.remove('hidden');

    // 鎖定吐司在選定側範圍
    const playW = $('ts-play-area').clientWidth;
    if (side === 'left')  this.swX = Math.min(this.swX, playW * 0.45);
    if (side === 'right') this.swX = Math.max(this.swX, playW * 0.55);
    $('ts-sandwich').style.left = `${this.swX}px`;

    this._buildFoodItems();
  }

  // ── 主循環 ─────────────────────────────────────────────

  _loop(ts) {
    if (this.state === 'delivery' || this.state === 'result' ||
        this.state === 'idle'     || this.state === 'setup')  return;

    if (!this.lastTs) this.lastTs = ts;
    const dt = Math.min(ts - this.lastTs, 50);
    this.lastTs = ts;

    if (this.state === 'approach')  this._updateApproach(dt);
    else if (this.state === 'food_zone') this._updateFoodZone(dt);
    else if (this.state === 'face')      this._updateFace(dt);

    // delivery 狀態在 _updateFace 內設定，不再排下一幀
    if (this.state !== 'delivery') {
      this.frameId = requestAnimationFrame(ts => this._loop(ts));
    }
  }

  // ── 門落下（approach）──────────────────────────────────

  _updateApproach(dt) {
    const playRect = $('ts-play-area').getBoundingClientRect();
    const swRect   = $('ts-sandwich').getBoundingClientRect();
    const toastTop = swRect.top - playRect.top;
    const stopY    = toastTop - GATE_H;

    // 吐司接近門時，高亮顯示目前靠向哪一側
    const distToStop = stopY - this.gateY;
    if (this.gateEl && distToStop < 200) {
      const isLeft = this.swX <= playRect.width * 0.5;
      const ld = $('ts-gate-left');
      const rd = $('ts-gate-right');
      ld?.classList.toggle('ts-gate-hover',  isLeft);
      rd?.classList.toggle('ts-gate-hover', !isLeft);
    }

    if (this.gateY >= stopY) {
      this.gateY = stopY;
      this.gateEl.style.top = `${this.gateY}px`;
      this._commitGate(this.swX <= playRect.width * 0.5 ? 'left' : 'right');
    } else {
      this.gateY += SCROLL_SPEED * dt / 1000;
      this.gateEl.style.top = `${this.gateY}px`;
    }
  }

  // ── 食物落下（food_zone）───────────────────────────────

  _updateFoodZone(dt) {
    const playH = $('ts-play-area').clientHeight;
    let allPassed = this.foods.length > 0;

    this.foods.forEach(item => {
      if (item.eaten) return;
      item.y += SCROLL_SPEED * dt / 1000;
      item.el.style.top = `${item.y}px`;
      if (item.y < playH + 50) allPassed = false;
    });

    this._checkCollisions();

    if (allPassed) {
      this.state = 'face';
      $('ts-divider').classList.add('hidden');
      $('ts-inactive-mask').className = 'hidden';
      this._buildFace();
    }
  }

  // ── 人臉落下（face）────────────────────────────────────

  _updateFace(dt) {
    const playRect = $('ts-play-area').getBoundingClientRect();
    const swRect   = $('ts-sandwich').getBoundingClientRect();
    const toastTop = swRect.top - playRect.top;

    this.faceY += SCROLL_SPEED * dt / 1000;
    this.faceEl.style.top = `${this.faceY}px`;

    if (this.faceY + FACE_H / 2 >= toastTop) {
      this._startDelivery();
    }
  }

  // ── 碰撞偵測 ───────────────────────────────────────────

  _checkCollisions() {
    const playRect = $('ts-play-area').getBoundingClientRect();
    if (!playRect.width || !playRect.height) return;

    const sw   = $('ts-sandwich');
    const swR  = sw.getBoundingClientRect();
    const swCX = swR.left + swR.width  / 2;
    const swCY = swR.top  + swR.height / 2;

    this.foods.forEach(item => {
      if (item.eaten) return;
      const foodScreenX = playRect.left + item.xPct * playRect.width;
      const foodScreenY = playRect.top  + item.y + 14; // 14 = 近似 emoji 中心
      const dx = Math.abs(foodScreenX - swCX);
      const dy = Math.abs(foodScreenY - swCY);
      if (dx < HIT_R_X && dy < HIT_R_Y) this._eatFood(item);
    });
  }

  _eatFood(item) {
    item.eaten = true;
    item.el.classList.add('eaten');

    this.collected++;
    $('ts-collect-count').textContent = this.collected;

    const isLiked = item.liked;
    if (isLiked) this.likedCount++;

    if (this.mode === 1) {
      window.gameAudio?.play(isLiked ? 'g2-coin-collect' : 'g2-wrong-tap');
      const fb = document.createElement('div');
      fb.className   = `ts-feedback ${isLiked ? 'good' : 'bad'}`;
      fb.textContent = isLiked ? '+1' : '-1';
      document.body.appendChild(fb);
      setTimeout(() => fb.remove(), 1100);
    } else {
      window.gameAudio?.play('g2-coin-collect');
    }

    const span = document.createElement('span');
    span.className   = 'ts-new-filling';
    span.textContent = item.el.textContent;
    $('ts-fillings').appendChild(span);

    setTimeout(() => item.el.remove(), 220);
  }

  // ── 送餐結束 → 直接顯示結果 ──────────────────────────────

  _startDelivery() {
    cancelAnimationFrame(this.frameId);
    this.state = 'delivery';
    window.gameAudio?.play('g7-eat');
    this._deliveryTimer = setTimeout(() => this._showResult(), 600);
  }

  // ── 結果畫面（此時才揭曉好惡）─────────────────────────

  _showResult() {
    this.state = 'result';
    $('ts-result').classList.remove('hidden'); // 疊加在遊戲畫面上（position:fixed overlay）

    const dislikedCount = this.collected - this.likedCount;
    const score = this.likedCount - dislikedCount;

    // 角色
    $('tr-char').textContent = this.char.emoji;

    // 反應文字（score=0 且 collected>0 表示喜惡相抵）
    const reaction =
      score >= 20                      ? '😁 超！級！好！吃！'    :
      score >= 10                      ? '😊 好吃耶！太棒了！'    :
      score >= 5                       ? '😊 還不錯！'            :
      score >= 1                       ? '😐 還行啦⋯'            :
      score === 0 && this.collected > 0 ? '😏 喜惡相抵，剛好平衡！' :
      score === 0                      ? '😑 什麼都沒吃到'        :
      score >= -5                      ? '😖 有點難吃⋯'          :
      score >= -15                     ? '🤢 難吃死了！'          :
                                         '☠️ 快送急診！';
    $('tr-reaction').textContent = reaction;

    // 得分 class（先設，count-up 開始前）
    const scoreEl = $('tr-score');
    scoreEl.className = `ts-rc-score ${score > 0 ? 'pos' : score < 0 ? 'neg' : 'zer'}`;
    scoreEl.textContent = '0';

    // 得分 count-up 動畫（儲存 ref 以便重播時清除）
    clearInterval(this._countTimer);
    if (score !== 0) {
      const dir   = score > 0 ? 1 : -1;
      const steps = Math.abs(score);
      const delay = Math.max(18, Math.min(70, 700 / steps));
      let cur = 0;
      this._countTimer = setInterval(() => {
        cur += dir;
        scoreEl.textContent = cur > 0 ? `+${cur}` : `${cur}`;
        if (cur === score) clearInterval(this._countTimer);
      }, delay);
    }

    // 食物統計條
    const total = Math.max(1, this.likedCount + dislikedCount);
    const likedPct    = (this.likedCount / total * 100).toFixed(1);
    const dislikePct  = (dislikedCount   / total * 100).toFixed(1);
    $('tr-foods').innerHTML = `
      <div class="ts-rc-food-row">
        <span class="ts-rc-food-label">❤️ ${this.likedFood}</span>
        <div class="ts-rc-food-bar">
          <div class="ts-rc-food-fill liked-fill" style="width:${likedPct}%"></div>
        </div>
        <span class="ts-rc-food-count" style="color:var(--good)">×${this.likedCount}</span>
      </div>
      <div class="ts-rc-food-row">
        <span class="ts-rc-food-label">💔 ${this.dislikedFood}</span>
        <div class="ts-rc-food-bar">
          <div class="ts-rc-food-fill disliked-fill" style="width:${dislikePct}%"></div>
        </div>
        <span class="ts-rc-food-count" style="color:var(--bad)">×${dislikedCount}</span>
      </div>
    `;

    // 細節文字
    $('tr-detail').textContent =
      `${this.char.name} 的心情：喜歡 +${this.likedCount} 分 / 討厭 -${dislikedCount} 分`;

    // 彩帶（正分）
    if (score > 0 && typeof confetti === 'function') {
      setTimeout(() => confetti({
        particleCount: 90, spread: 70,
        origin: { y: 0.45 }, zIndex: 400,
        colors: ['#FFB347','#2ed573','#fff','#FF8C42'],
      }), 350);
    }

    // 音效結束後再播語音
    const sfxKey = score >= 0 ? 'new-highscore' : 'game-over-common';
    if (window.gameAudio) {
      window.gameAudio.playThen(sfxKey, () => this._speakResult(score, this.likedCount, dislikedCount));
    } else {
      this._speakResult(score, this.likedCount, dislikedCount);
    }

    $('tr-replay').onclick = () => {
      window.gameAudio?.play('game-btn-click');
      clearInterval(this._countTimer);
      speechSynthesis.cancel();
      $('ts-result').classList.add('hidden');
      $('ts-setup').classList.remove('hidden');
    };
    $('tr-menu').onclick = () => {
      clearInterval(this._countTimer);
      speechSynthesis.cancel();
      location.href = '../index.html';
    };
  }

  // ── 語音播報結果 ───────────────────────────────────────

  _speakResult(score, likedCount, dislikedCount) {
    speechSynthesis.cancel();

    const likedName    = FOOD_NAMES[this.likedFood]    || '喜歡的食物';
    const dislikedName = FOOD_NAMES[this.dislikedFood] || '討厭的食物';
    const absScore     = Math.abs(score);

    let text;
    if (score >= 20) {
      text = `哇！超級好吃！全都是${likedName}，這些都是我最愛吃的！總共加了${score}分！`;
    } else if (score >= 10) {
      text = `太棒了！好吃耶！夾到好多${likedName}，總共加了${score}分！`;
    } else if (score >= 5) {
      text = `還不錯！夾到${likedCount}個${likedName}，加了${score}分！`;
    } else if (score >= 1) {
      text = `還行啦，夾到${likedCount}個${likedName}，不過也夾到${dislikedCount}個${dislikedName}，加了${score}分。`;
    } else if (score === 0 && this.collected > 0) {
      text = `哎，${likedName}跟${dislikedName}夾到一樣多，剛好相抵，零分！`;
    } else if (score === 0) {
      text = `一個都沒夾到，什麼都沒吃到！`;
    } else if (score >= -5) {
      text = `哎呀，有點難吃耶！夾到${dislikedCount}個${dislikedName}，我不喜歡這個，扣了${absScore}分。`;
    } else if (score >= -15) {
      text = `噁！全都是${dislikedName}！這些都是我不喜歡吃的，好難吃喔！扣了${absScore}分！`;
    } else {
      text = `哇這也太慘了！全是${dislikedName}，我最討厭這個了！快送急診！扣了${absScore}分！`;
    }

    const speak = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-TW';
      u.rate = 0.88;
      const voices = speechSynthesis.getVoices();
      const yating = voices.find(v => v.name.includes('Yating') || v.name.includes('雅婷'));
      if (yating) u.voice = yating;
      speechSynthesis.speak(u);
    };

    if (speechSynthesis.getVoices().length > 0) {
      speak();
    } else {
      speechSynthesis.addEventListener('voiceschanged', () => speak(), { once: true });
    }
  }
}

// ── 啟動 ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  new ToastGame().init();
});
