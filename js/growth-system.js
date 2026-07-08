// ─── 學生成長系統（徽章／寶石／寵物／寶物）────────────────
// 主頁金隊長與 reward 學生成長頁共用。純邏輯＋localStorage/IndexedDB，不碰 DOM。
// 資料鍵：mt_badges_{id}（徽章）、mt_gems_{id}（寶石花費）、mt_pet_{id}（寵物）、mt_treasures_{id}（寶物）
// 寶石規則：每一筆 🌟 無錯通過的主課程紀錄＝1 顆寶石；可用寶石＝總數 − 已花費（進化/兌換）。

window.GrowthSystem = (() => {
  const UNIT_SERIES = {
    F: ['f1','f2','f3','f4','f5','f6'], C: ['c1','c2','c3','c4','c5','c6'],
    B: ['b1','b2','b3','b4','b5','b6'], A: ['a1','a2','a3','a4','a5','a6'],
  };
  const ALL_UNITS = Object.values(UNIT_SERIES).flat();
  const isMainRec = (r) => r.source === 'main' || ALL_UNITS.includes(r.situationId);

  function dayKeyOf(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ── 學習紀錄（版本/stores 須與 dialogue/db.js、learning-tracker.js 一致）──
  function readAllRecords() {
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open('shopping-practice', 2);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('records')) {
            const store = db.createObjectStore('records', { keyPath: 'id', autoIncrement: true });
            store.createIndex('ts', 'ts', { unique: false });
            store.createIndex('scenarioId', 'scenarioId', { unique: false });
          }
          if (!db.objectStoreNames.contains('custom_audio')) {
            db.createObjectStore('custom_audio', { keyPath: 'key' });
          }
        };
        req.onsuccess = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('records')) { db.close(); resolve([]); return; }
          const q = db.transaction('records', 'readonly').objectStore('records').getAll();
          q.onsuccess = () => { db.close(); resolve(q.result || []); };
          q.onerror = () => { db.close(); resolve([]); };
        };
        req.onerror = () => resolve([]);
        req.onblocked = () => resolve([]);
      } catch { resolve([]); }
    });
  }

  const myRecords = (records, stuId) => records.filter(r => String(r.studentId) === String(stuId));

  // ── 徽章 ──
  const BADGES = [
    { id: 'first_step', icon: '🔰', name: '初次上路',    test: (my) => my.length >= 1 },
    { id: 'flawless_1', icon: '🌟', name: '無錯新星',    test: (my) => my.some(r => r.flawless) },
    { id: 'streak_3',   icon: '🔥', name: '連續3天練習', test: (my) => {
        const days = [...new Set(my.map(r => dayKeyOf(r.ts)))].sort();
        for (let i = 0; i + 2 < days.length; i++) {
          if ((new Date(days[i + 2]) - new Date(days[i])) / 86400000 === 2) return true;
        }
        return false;
      } },
    { id: 'quest_10', icon: '🚀', name: '任務達人×10', test: (my, meta) => (meta?.totalClaimed || 0) >= 10 },
    { id: 'talk_5',   icon: '💬', name: '聊天高手×5',  test: (my) => my.filter(r => !isMainRec(r)).length >= 5 },
    { id: 'series_F', icon: '🧮', name: 'F系列制霸', test: (my) => UNIT_SERIES.F.every(u => my.some(r => r.situationId === u)) },
    { id: 'series_C', icon: '🪙', name: 'C系列制霸', test: (my) => UNIT_SERIES.C.every(u => my.some(r => r.situationId === u)) },
    { id: 'series_B', icon: '📒', name: 'B系列制霸', test: (my) => UNIT_SERIES.B.every(u => my.some(r => r.situationId === u)) },
    { id: 'series_A', icon: '🏪', name: 'A系列制霸', test: (my) => UNIT_SERIES.A.every(u => my.some(r => r.situationId === u)) },
    { id: 'rich_100', icon: '💰', name: '百元富翁', test: (my, meta, stu) => (stu?.score || 0) >= 100 },
  ];

  function badgeStore(stuId) {
    try { return JSON.parse(localStorage.getItem(`mt_badges_${stuId}`) || '{}'); } catch { return {}; }
  }

  // 判定＋落盤；回傳 { earned, newBadges[] }
  function computeBadges(stuId, records, questMeta, stu) {
    const my = myRecords(records, stuId);
    const earned = badgeStore(stuId);
    const fresh = [];
    BADGES.forEach(b => {
      try {
        if (!earned[b.id] && b.test(my, questMeta, stu)) {
          earned[b.id] = Date.now();
          fresh.push(b);
        }
      } catch {}
    });
    localStorage.setItem(`mt_badges_${stuId}`, JSON.stringify(earned));
    return { earned, fresh };
  }

  // ── 寶石 ──
  function gemsSpent(stuId) {
    try { return (JSON.parse(localStorage.getItem(`mt_gems_${stuId}`) || '{}').spent) || 0; } catch { return 0; }
  }
  function gemsTotal(records, stuId) {
    return myRecords(records, stuId).filter(r => isMainRec(r) && r.flawless).length;
  }
  function gemsAvailable(records, stuId) {
    return Math.max(0, gemsTotal(records, stuId) - gemsSpent(stuId));
  }
  function spendGems(records, stuId, n) {
    if (gemsAvailable(records, stuId) < n) return false;
    localStorage.setItem(`mt_gems_${stuId}`, JSON.stringify({ spent: gemsSpent(stuId) + n }));
    return true;
  }

  // ── 寵物（金錢豬：蛋→小金豬→金豬少年→黃金飛天豬）──
  const PET_STAGES = [
    { key: 'egg',   name: '神祕金蛋',   img: 'images/common/pet_stage0_egg.png',   need: 0 },
    { key: 'baby',  name: '小金豬',     img: 'images/common/pet_stage1_baby.png',  need: 20 },
    { key: 'young', name: '金豬少年',   img: 'images/common/pet_stage2_young.png', need: 80 },
    { key: 'super', name: '黃金飛天豬', img: 'images/common/pet_stage3_super.png', need: 180, gems: 3 },
  ];
  const FEED_COST = 5;   // 餵一次花 5 金幣
  const FEED_GAIN = 5;   // 成長 +5

  function petData(stuId) {
    try { return JSON.parse(localStorage.getItem(`mt_pet_${stuId}`) || '{"growth":0,"evolved":false}'); }
    catch { return { growth: 0, evolved: false }; }
  }
  function savePet(stuId, pet) { localStorage.setItem(`mt_pet_${stuId}`, JSON.stringify(pet)); }
  function petStage(pet) {
    if (pet.growth >= PET_STAGES[3].need && pet.evolved) return 3;
    if (pet.growth >= PET_STAGES[2].need) return 2;
    if (pet.growth >= PET_STAGES[1].need) return 1;
    return 0;
  }

  // ── 寶物櫃（寶石兌換）──
  const TREASURES = [
    { id: 'cup',   icon: '🏆', name: '小金盃',   gems: 1 },
    { id: 'crown', icon: '👑', name: '金皇冠',   gems: 2 },
    { id: 'chest', icon: '🎁', name: '神祕寶箱', gems: 3 },
  ];
  function treasures(stuId) {
    try { return JSON.parse(localStorage.getItem(`mt_treasures_${stuId}`) || '[]'); } catch { return []; }
  }
  function buyTreasure(records, stuId, tid) {
    const t = TREASURES.find(x => x.id === tid);
    const owned = treasures(stuId);
    if (!t || owned.includes(tid)) return false;
    if (!spendGems(records, stuId, t.gems)) return false;
    owned.push(tid);
    localStorage.setItem(`mt_treasures_${stuId}`, JSON.stringify(owned));
    return true;
  }

  // ── 收集寵物（5 隻原創金錢生物；emoji 呈現，用寶石解鎖，解鎖後隨「主課程學習紀錄」成長進化）──
  //   needs = 解鎖後新增的主課程紀錄數門檻；達到才進化到該階段。資料鍵 mt_pets_{id}。
  const CREATURES = [
    // 15 隻原創奇幻生物（元素主題；蛋為純蛋、進化有驚喜）。4 階段：蛋→幼體→成長→最終。
    // key 對應 images/pets/pet_{key}_s{0,1,2,3}.png
    { key: 'crystalfox',     name: '水晶狐', stages: ['🥚', '💎', '🦊', '🌟'],   needs: [0, 3, 8, 15],  gems: 0 }, // 第一隻免費
    { key: 'emberpup',       name: '火焰獸', stages: ['🥚', '🔥', '🐕', '🦁'],   needs: [0, 3, 8, 15],  gems: 1 },
    { key: 'aquaserp',       name: '碧水靈', stages: ['🥚', '💧', '🐍', '🐉'],   needs: [0, 4, 10, 18], gems: 2 },
    { key: 'leafling',       name: '森靈鹿', stages: ['🥚', '🌱', '🌿', '🦌'],   needs: [0, 4, 10, 18], gems: 2 },
    { key: 'cloudwhale',     name: '雲鯨',   stages: ['🥚', '☁️', '🐳', '🐋'],   needs: [0, 5, 12, 22], gems: 3 },
    { key: 'shadowcat',      name: '暗影貓', stages: ['🥚', '🌑', '🐈', '🐈‍⬛'], needs: [0, 5, 12, 22], gems: 3 },
    { key: 'gearcub',        name: '機械獸', stages: ['🥚', '🔩', '⚙️', '🤖'],   needs: [0, 5, 12, 22], gems: 3 },
    { key: 'prismbird',      name: '虹光鳥', stages: ['🥚', '🦋', '🐦', '🦚'],   needs: [0, 5, 12, 22], gems: 4 },
    { key: 'frostbun',       name: '霜雪兔', stages: ['🥚', '❄️', '🐰', '🦌'],   needs: [0, 6, 14, 25], gems: 4 },
    { key: 'magmahorn',      name: '熔岩獸', stages: ['🥚', '🪨', '🐗', '🌋'],   needs: [0, 6, 14, 25], gems: 4 },
    { key: 'stormouse',      name: '雷光鼠', stages: ['🥚', '⚡', '🐭', '🌩️'],   needs: [0, 6, 14, 25], gems: 5 },
    { key: 'lunartapir',     name: '夢貘',   stages: ['🥚', '🌙', '🐴', '🦄'],   needs: [0, 6, 14, 25], gems: 5 },
    { key: 'starfawn',       name: '星塵獸', stages: ['🥚', '⭐', '🦌', '✨'],   needs: [0, 7, 16, 28], gems: 5 },
    { key: 'mushroomsprite', name: '菇菇精', stages: ['🥚', '🍄', '🌱', '🌳'],   needs: [0, 7, 16, 28], gems: 6 },
    { key: 'voidkit',        name: '虛空貓', stages: ['🥚', '🌌', '🐱', '🐈'],   needs: [0, 8, 18, 32], gems: 7 },
    // 第二批新增 5 隻（不同主題）
    { key: 'candypup',       name: '棉花糖獸', stages: ['🥚', '🍬', '🍭', '🎂'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'sandsphinx',     name: '沙獅獸',   stages: ['🥚', '🐾', '🦁', '🗿'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'windgriff',      name: '風翼獸',   stages: ['🥚', '🐦', '🪶', '🦅'], needs: [0, 6, 14, 25], gems: 6 },
    { key: 'honeybee',       name: '蜜糖蜂',   stages: ['🥚', '🐝', '🍯', '👑'], needs: [0, 7, 16, 28], gems: 7 },
    { key: 'inkocto',        name: '墨靈章',   stages: ['🥚', '🐙', '🖋️', '🌀'], needs: [0, 8, 18, 32], gems: 8 },
    // 第三批新增 5 隻（不同主題）
    { key: 'yarnkit',        name: '毛線獸',   stages: ['🥚', '🧶', '🧦', '🧸'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'paperfold',      name: '摺紙獸',   stages: ['🥚', '📄', '🦢', '🐉'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'musicnote',      name: '音符靈',   stages: ['🥚', '🎵', '🎶', '🎼'], needs: [0, 6, 14, 25], gems: 6 },
    { key: 'lantern',        name: '燈籠靈',   stages: ['🥚', '🏮', '✨', '🎑'], needs: [0, 7, 16, 28], gems: 6 },
    { key: 'fossildino',     name: '化石龍',   stages: ['🥚', '🦕', '🦴', '🦖'], needs: [0, 7, 16, 28], gems: 7 },
    // 第四批新增 5 隻（不同主題）
    { key: 'bubbletea',      name: '珍奶獸',   stages: ['🥚', '🧋', '🧋', '👑'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'cactus',         name: '仙人掌獸', stages: ['🥚', '🌵', '🌵', '🌸'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'balloon',        name: '氣球獸',   stages: ['🥚', '🎈', '🎈', '🎉'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'firefly',        name: '螢火獸',   stages: ['🥚', '🐛', '✨', '🪲'], needs: [0, 7, 16, 28], gems: 6 },
    { key: 'snail',          name: '蝸牛獸',   stages: ['🥚', '🐌', '🐌', '💎'], needs: [0, 7, 16, 28], gems: 7 },
    // 第五批新增 5 隻（不同主題）
    { key: 'acorn',          name: '橡實獸',   stages: ['🥚', '🌰', '🌰', '🌳'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'teacup',         name: '茶靈',     stages: ['🥚', '🍵', '🍵', '🫖'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'kite',           name: '風箏獸',   stages: ['🥚', '🪁', '🪁', '🐉'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'coral',          name: '珊瑚獸',   stages: ['🥚', '🪸', '🪸', '🐚'], needs: [0, 7, 16, 28], gems: 6 },
    { key: 'umbrella',       name: '雨傘獸',   stages: ['🥚', '☂️', '☔', '🌈'], needs: [0, 7, 16, 28], gems: 6 },
    // 第六批新增 5 隻（不同主題）
    { key: 'soapbubble',     name: '泡泡獸',   stages: ['🥚', '🫧', '🫧', '🌈'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'plush',          name: '玩偶獸',   stages: ['🥚', '🧸', '🧸', '👑'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'maple',          name: '楓葉獸',   stages: ['🥚', '🍁', '🍁', '🦌'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'book',           name: '書靈',     stages: ['🥚', '📖', '📚', '🦉'], needs: [0, 7, 16, 28], gems: 6 },
    { key: 'bell',           name: '鈴鐺獸',   stages: ['🥚', '🔔', '🔔', '🎐'], needs: [0, 7, 16, 28], gems: 6 },
  ];
  function petsData(stuId) {
    try { return JSON.parse(localStorage.getItem(`mt_pets_${stuId}`) || '{}'); } catch { return {}; }
  }
  function savePets(stuId, d) { localStorage.setItem(`mt_pets_${stuId}`, JSON.stringify(d)); }
  function mainRecordCount(records, stuId) { return myRecords(records, stuId).filter(isMainRec).length; }
  // 解鎖一隻（花寶石；記錄解鎖當下的主課程紀錄數當成長起點）
  function unlockCreature(records, stuId, key) {
    const c = CREATURES.find(x => x.key === key);
    if (!c) return false;
    const d = petsData(stuId);
    if (d[key] && d[key].unlocked) return false;
    if (c.gems > 0 && !spendGems(records, stuId, c.gems)) return false;
    d[key] = { unlocked: true, at: mainRecordCount(records, stuId) };
    savePets(stuId, d);
    return true;
  }
  // 某隻目前進化階段（-1=未解鎖）＋還差幾筆到下一階
  function creatureState(records, stuId, key) {
    const c = CREATURES.find(x => x.key === key);
    const d = petsData(stuId)[key];
    if (!c) return { stage: -1, grown: 0, next: null };
    if (!d || !d.unlocked) return { stage: -1, grown: 0, next: c.needs[1] };
    const grown = Math.max(0, mainRecordCount(records, stuId) - (d.at || 0));
    let stage = 0;
    for (let i = 0; i < c.needs.length; i++) if (grown >= c.needs[i]) stage = i;
    const next = stage < c.needs.length - 1 ? c.needs[stage + 1] : null;
    return { stage, grown, next };
  }

  function questMeta(stuId) {
    try { return JSON.parse(localStorage.getItem(`mt_quests_${stuId}`) || 'null'); } catch { return null; }
  }

  return {
    CREATURES, petsData, savePets, unlockCreature, creatureState,
    readAllRecords, isMainRec, myRecords,
    BADGES, badgeStore, computeBadges,
    gemsTotal, gemsSpent, gemsAvailable, spendGems,
    PET_STAGES, FEED_COST, FEED_GAIN, petData, savePet, petStage,
    TREASURES, treasures, buyTreasure,
    questMeta,
  };
})();
