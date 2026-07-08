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
    { key: 'egg',   name: '神祕金蛋',   img: 'images/common/pet_stage0_egg.png',   need: 0,   desc: '閃著金光的神祕蛋，裡面似乎有東西在動。用金幣餵食就能注入滿滿能量，快要孵化囉！' },
    { key: 'baby',  name: '小金豬',     img: 'images/common/pet_stage1_baby.png',  need: 20,  desc: '剛出生的小金豬，圓滾滾又愛吃。肚子上有個投幣孔，餵食金幣就會開心地一天天長大。' },
    { key: 'young', name: '金豬少年',   img: 'images/common/pet_stage2_young.png', need: 80,  desc: '長大一些的金豬少年，活潑好動。存越多、餵越多力氣越大，是勤儉存錢的好夥伴。' },
    { key: 'super', name: '黃金飛天豬', img: 'images/common/pet_stage3_super.png', need: 180, gems: 3, desc: '進化完成的黃金飛天豬，背上長出小翅膀！象徵滿滿的儲蓄成果，帶著好運自在飛翔。' },
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
    { key: 'crystalfox',     name: '水晶狐', stages: ['🥚', '💎', '🦊', '🌟'],   stageNames: ['晶芽卵', '幼晶狐', '水晶狐', '琉璃狐靈'],   stageDesc: ['沉睡在紫水晶裡的神祕蛋，表面透出微微藍光。能吸收周圍的光能，慢慢累積純淨的水晶力量。', '剛破殼的水晶狐寶寶，身體半透明會折射柔光。好奇又愛乾淨，能發出微光照亮黑暗的小角落。', '身披水晶絨毛的靈狐，尾端鑲著寶石。能操控光的折射，遇到危險會用炫目光芒讓對手看不清。', '進化到極致的水晶狐靈，三條寶石尾巴閃耀純淨能量。能召喚水晶結界保護同伴，是守護光明的高貴靈獸。'], needs: [0, 3, 8, 15],  gems: 0 }, // 第一隻免費
    { key: 'emberpup',       name: '火焰獸', stages: ['🥚', '🔥', '🐕', '🦁'],   stageNames: ['熾焰卵', '火苗獸', '火焰獸', '烈炎獅王'],   stageDesc: ['裂縫透出橘紅火光的火焰蛋，摸起來溫溫的。內部燃燒著永不熄滅的小火苗，正孕育火之力量。', '渾身毛茸茸的小火獸，尾巴是一撮跳動的火焰。個性活潑好動，開心時全身會冒出溫暖的火花。', '鬃毛化為烈焰的火獸，奔跑時留下火焰足跡。能吐出灼熱火球，體溫越高代表越有精神。', '披著熔金鎧甲的火焰獅王，鬃毛是熊熊烈焰。能掀起火焰風暴，勇敢又重情義，是火之領袖。'], needs: [0, 3, 8, 15],  gems: 1 },
    { key: 'aquaserp',       name: '碧水靈', stages: ['🥚', '💧', '🐍', '🐉'],   stageNames: ['露珠卵', '水滴靈', '碧水靈', '碧海蛟龍'],   stageDesc: ['像一顆巨大露珠的透明蛋，裡面有水波盪漾。能淨化周圍的水，蘊藏著溫柔的水之靈氣。', '圓滾滾的果凍狀水精靈，身體晶瑩剔透。喜歡在水邊玩耍，能變出小水泡逗人開心。', '身形修長的水蛇靈，游動時像流水般柔順。能操控水流、治癒小傷口，個性溫和又體貼。', '進化成的碧海蛟龍，鱗片如海水般透亮。能呼喚潮汐與雨水，守護海洋與河川的平靜。'], needs: [0, 4, 10, 18], gems: 2 },
    { key: 'leafling',       name: '森靈鹿', stages: ['🥚', '🌱', '🌿', '🦌'],   stageNames: ['苔芽卵', '嫩芽鹿', '森靈鹿', '翠森守護鹿'], stageDesc: ['裹著青苔與嫩葉的種子蛋，散發清新草香。能吸收陽光與雨水，慢慢孕育森林的生命力。', '頭頂冒出小嫩芽的幼鹿，走路蹦蹦跳跳。所到之處會長出小花小草，是帶來生機的小精靈。', '鹿角如枝葉般茂盛的森靈，身上長著青苔與花朵。能讓植物快速生長，是森林裡溫柔的守護者。', '鹿角化為開花大樹的守護鹿，周圍飛舞螢火與花瓣。能喚醒整片森林的力量，庇護所有小動物。'], needs: [0, 4, 10, 18], gems: 2 },
    { key: 'cloudwhale',     name: '雲鯨',   stages: ['🥚', '☁️', '🐳', '🐋'],   stageNames: ['雲絮卵', '雲朵獸', '雲鯨', '蒼穹雲鯨'],     stageDesc: ['軟綿綿像雲朵的蛋，飄浮在半空中。能吸收空氣中的水氣，越飄越輕、越長越大。', '胖嘟嘟的小雲獸，身體軟到可以捏。愛睡覺又愛發呆，飄過的地方會下起毛毛細雨。', '悠游天空的雲之鯨，身上有柔和的極光紋路。能載著夥伴在雲海翱翔，帶來晴朗好天氣。', '巨大的蒼穹雲鯨，鰭上點綴著星光。能自由掌控雲與風，遨遊無邊天空，沉穩而溫柔。'], needs: [0, 5, 12, 22], gems: 3 },
    { key: 'shadowcat',      name: '暗影貓', stages: ['🥚', '🌑', '🐈', '🐈‍⬛'], stageNames: ['暗紋卵', '影靈貓', '暗影貓', '幻影魅貓'],   stageDesc: ['浮動著紫黑霧氣的神祕蛋，表面有淡淡眼紋。能融入陰影隱身，悄悄累積暗影之力。', '半透明的影子小貓，眼睛像彎月牙發光。頑皮愛捉迷藏，能鑽進影子裡瞬間躲起來。', '身形俐落的影靈貓，尾巴拖著煙霧。能在陰影間穿梭移動，行動無聲無息，神祕又機靈。', '由影子與星光構成的魅貓，額前有月之印記。能分身成好幾個幻影迷惑對手，優雅而神祕。'], needs: [0, 5, 12, 22], gems: 3 },
    { key: 'gearcub',        name: '機械獸', stages: ['🥚', '🔩', '⚙️', '🤖'],   stageNames: ['齒輪卵', '發條獸', '機械獸', '鋼鐵守衛'],   stageDesc: ['布滿螺栓與齒輪的金屬蛋，接縫透出藍光。內部的發條正上緊，蓄積機械動力。', '圓滾滾的發條小獸，背上有一把轉動的鑰匙。動作有點笨拙但很努力，會發出可愛的滴答聲。', '齒輪咬合精密的機械獸，眼睛是發光鏡片。力氣很大能搬重物，還能噴蒸汽幫自己降溫。', '披著鋼鐵裝甲的守衛，胸口有藍色能量核心。能展開護盾保護大家，忠誠可靠、堅守崗位。'], needs: [0, 5, 12, 22], gems: 3 },
    { key: 'prismbird',      name: '虹光鳥', stages: ['🥚', '🦋', '🐦', '🦚'],   stageNames: ['虹彩卵', '稜光雛', '虹光鳥', '七彩鳳凰'],   stageDesc: ['表面泛著油彩般七彩光澤的蛋。能把光線折射成彩虹，孕育著繽紛的光之力量。', '圓胖的虹光雛鳥，翅膀剛長出小小水晶羽。一拍翅膀就灑下彩虹亮粉，天真又愛漂亮。', '羽毛會反射彩虹的靈鳥，飛過留下七彩軌跡。能釋放炫目虹光，讓看到的人都心情變好。', '展開七彩光羽的鳳凰，尾羽拖著彩虹火焰。能綻放絢麗的光之風暴，是帶來希望的祥瑞之鳥。'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'frostbun',       name: '霜雪兔', stages: ['🥚', '❄️', '🐰', '🦌'],   stageNames: ['霜花卵', '雪絨兔', '霜雪兔', '冰晶霜鹿'],   stageDesc: ['覆著細緻雪花紋的淡藍色蛋，摸起來冰冰涼涼。能降低周圍溫度，凝結出美麗的霜花。', '毛茸茸的雪白小兔，耳朵尖端結著薄霜。個性溫和怕熱，蹦跳時會揚起細雪。', '披著冰藍絨毛的雪兔，頭上長出小小冰角。能吹出冰霜凍住地面，跑起來像滑冰一樣快。', '頂著透明冰角的高貴霜鹿，身披霜甲。能召喚純淨的冰雪結界，冷靜而優雅地守護冬季。'], needs: [0, 6, 14, 25], gems: 4 },
    { key: 'magmahorn',      name: '熔岩獸', stages: ['🥚', '🪨', '🐗', '🌋'],   stageNames: ['熔核卵', '岩漿獸', '熔岩獸', '火山巨獸'],   stageDesc: ['裂縫透出岩漿光芒的黑色岩石蛋，沉甸甸的。內部熔核滾燙，正累積大地與火的力量。', '圓墩墩的小岩獸，身上裂縫流著熾熱岩漿。憨厚又力氣大，生氣時會冒出小火花。', '身覆黑曜岩甲的熔岩獸，體內岩漿翻騰。能踏碎岩石、噴出岩漿，穩重又充滿爆發力。', '如移動火山般的巨獸，背脊流淌熔岩之河。能引發火山噴發撼動大地，威猛卻守護著山林。'], needs: [0, 6, 14, 25], gems: 4 },
    { key: 'stormouse',      name: '雷光鼠', stages: ['🥚', '⚡', '🐭', '🌩️'],   stageNames: ['電花卵', '電光鼠', '雷光鼠', '雷霆風暴獸'], stageDesc: ['不時劈啪冒出電花的蛋，摸了會麻麻的。內部蓄著滿滿電力，正等待釋放的一刻。', '毛茸茸的黃色小鼠，臉頰帶著靜電。活潑好動跑得飛快，緊張時全身會啪滋放電。', '身手敏捷的雷之鼠，尾巴像閃電。能放出電擊，速度快到留下殘影，機靈又充滿活力。', '披著雷電鬃毛的風暴獸，眼神銳利。能召喚雷霆風暴、瞬間移動，是雷電的化身。'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'lunartapir',     name: '夢貘',   stages: ['🥚', '🌙', '🐴', '🦄'],   stageNames: ['星塵卵', '夢幻貘', '夢貘', '月光守護獸'],   stageDesc: ['灑滿星塵、透著月光的靛藍色蛋。能收集夢境的碎片，孕育出溫柔的夢之力量。', '胖嘟嘟的夢之小貘，身上有星星斑點。愛睡覺又愛作夢，會吐出漂亮的夢泡泡。', '披著星空絨毛的夢貘，額前有月牙印記。能吃掉惡夢帶來好眠，個性安靜又療癒。', '沐浴月光的守護獸，鬃毛流轉著星河。能編織美夢守護睡眠，寧靜而神聖。'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'starfawn',       name: '星塵獸', stages: ['🥚', '⭐', '🦌', '✨'],   stageNames: ['星光卵', '星塵幼鹿', '星塵獸', '彗星星鹿'], stageDesc: ['閃著點點星光、畫著星座線的深藍色蛋。能吸收星空能量，孕育璀璨的星之力量。', '深藍身體綴滿星點的小鹿，鹿角冒著星芒。天真好奇，跳躍時會灑下閃亮星塵。', '身披星空紋路的靈鹿，奔跑時拖著星塵。能操控星光，在夜裡發出溫柔的光芒。', '拖著彗星光尾的星鹿，鹿角綻放星河。能劃過夜空召喚流星，優雅而璀璨。'], needs: [0, 7, 16, 28], gems: 5 },
    { key: 'mushroomsprite', name: '菇菇精', stages: ['🥚', '🍄', '🌱', '🌳'],   stageNames: ['孢子卵', '小菇精', '菇菇精', '巨蕈守護者'], stageDesc: ['像小香菇般的紅白斑點蛋，會飄出孢子。能在潮濕處生長，孕育森林的菌類生命。', '頂著紅白菇傘的小精靈，圓滾滾的很可愛。愛在雨後蹦出來，身邊會飄著發光孢子。', '戴著發光大菇傘的菇精，披著苔蘚小斗篷。能釋放治癒孢子，個性溫和又神祕。', '化為巨大蕈木的守護者，菇傘散發柔光。能庇護森林裡的小生物，古老而慈祥。'], needs: [0, 7, 16, 28], gems: 6 },
    { key: 'voidkit',        name: '虛空貓', stages: ['🥚', '🌌', '🐱', '🐈'],   stageNames: ['星幻卵', '虛空幼貓', '虛空貓', '宇宙星靈'], stageDesc: ['漆黑中旋轉著小星雲的神祕蛋。蘊藏宇宙的奧祕，孕育深邃的虛空之力。', '毛色如夜空、綴著星點的小貓，眼睛發著紫光。神出鬼沒又好奇，尾巴拖著星雲。', '身藏星河的靈貓，身上有星座紋路。能穿越虛空移動，神祕莫測又優雅。', '身體流轉整片星河的宇宙靈貓，繞著星環。能操控空間與星辰，超然而神聖。'], needs: [0, 8, 18, 32], gems: 7 },
    // 第二批新增 5 隻（不同主題）
    { key: 'candypup',       name: '棉花糖獸', stages: ['🥚', '🍬', '🍭', '🎂'], stageNames: ['糖霜卵', '棉花糖幼犬', '棉花糖獸', '甜心糖果王'], stageDesc: ['裹著粉白糖霜、閃著糖粒的蛋，甜甜香香。能吸收甜蜜能量，孕育軟綿綿的糖果之力。', '粉藍相間、軟綿綿的棉花糖小狗。愛撒嬌又貪吃，摸起來像雲朵一樣鬆軟。', '披著棉花糖鬃毛的甜點獸，身上有糖果斑點。能變出棉花糖分享給大家，療癒又可愛。', '戴著糖果王冠的甜點之王，身披焦糖光澤。能召喚甜點盛宴，帶給大家幸福的甜蜜。'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'sandsphinx',     name: '沙獅獸',   stages: ['🥚', '🐾', '🦁', '🗿'], stageNames: ['沙紋卵', '沙獅幼獸', '沙獅獸', '黃金獅身獸'], stageDesc: ['刻著古老象形紋的金沙色蛋，透著暖光。能匯聚沙漠熱能，孕育大地的守護之力。', '金沙般毛色的小獅子，圓耳朵毛茸茸。愛在沙地打滾，身邊會揚起閃亮的沙粒。', '鬃毛如流沙的沙之獅，額前鑲著寶石。能操控沙塵、守衛領地，威風又充滿自信。', '戴著頭飾的黃金獅身獸，散發遠古氣息。能召喚沙暴與寶石結界，是沙漠的高貴守護者。'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'windgriff',      name: '風翼獸',   stages: ['🥚', '🐦', '🪶', '🦅'], stageNames: ['微風卵', '風翼雛', '風翼獸', '疾風獅鷲'], stageDesc: ['淡綠色、飄著細小羽毛的蛋，輕飄飄的。能感應氣流，孕育自由的風之力量。', '淡綠絨毛的小獅鷲雛鳥，翅膀還小小的。好奇愛探險，乘著微風就能飄浮起來。', '羽翼漸豐的風之獅鷲，滑翔時捲起葉子。能駕馭氣流快速飛行，靈巧又自由奔放。', '翅膀捲動疾風的獅鷲王，眼神銳利。能掀起旋風翱翔天際，是自由不羈的天空霸主。'], needs: [0, 6, 14, 25], gems: 6 },
    { key: 'honeybee',       name: '蜜糖蜂',   stages: ['🥚', '🐝', '🍯', '👑'], stageNames: ['蜜巢卵', '小蜜蜂', '蜜糖蜂', '蜂巢守護王'], stageDesc: ['布滿蜂巢紋、泛著琥珀光的蛋，微微透出蜜光。能收集花蜜精華，孕育甜蜜的力量。', '圓滾滾、黃黑相間的小蜜蜂，翅膀薄薄的。勤勞又愛甜食，總是抱著一滴蜂蜜。', '身覆絨毛的蜜蜂獸，背著蜜罐飛舞。能釀造甜美蜂蜜分享給夥伴，勤奮又貼心。', '戴著蜂巢王冠的守護王，身披金色紋甲。能號召蜂群、守護花園，是勤勞團結的領袖。'], needs: [0, 7, 16, 28], gems: 7 },
    { key: 'inkocto',        name: '墨靈章',   stages: ['🥚', '🐙', '🖋️', '🌀'], stageNames: ['墨滴卵', '墨靈幼章', '墨靈章', '墨海章魚王'], stageDesc: ['靛黑中暈染著墨紋的蛋，滴著墨光。能吸收水中墨氣，孕育神祕的墨之力量。', '圓圓的小墨章魚，觸手捲捲的很可愛。頑皮愛惡作劇，緊張時會噴出小墨團躲起來。', '身形靈動的墨章魚，觸手泛著青光。能揮灑墨水作畫，也能噴墨遁走，聰明又靈巧。', '觸手如書法般優雅的章魚王，周身墨韻流轉。能操控墨海書寫符文，深沉而神祕。'], needs: [0, 8, 18, 32], gems: 8 },
    // 第三批新增 5 隻（不同主題）
    { key: 'yarnkit',        name: '毛線獸',   stages: ['🥚', '🧶', '🧦', '🧸'], stageNames: ['線團卵', '毛線幼貓', '毛線獸', '織夢守護者'], stageDesc: ['像纏繞粉彩毛線團的蛋，軟軟的還垂著線頭。能收集溫暖心意，孕育柔軟的毛線之力。', '毛線織成的小貓，眼睛是可愛的鈕扣。愛玩線球又愛撒嬌，滾來滾去像個小絨球。', '一身拼布毛線的獸，圍著小圍巾。能織出溫暖的毛線護大家，柔軟又貼心。', '披著華麗拼布的守護者，帶著毛線與棒針。能編織夢想與溫暖，守護每個人的好心情。'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'paperfold',      name: '摺紙獸',   stages: ['🥚', '📄', '🦢', '🐉'], stageNames: ['摺紙卵', '摺紙幼獸', '摺紙獸', '摺紙飛龍'], stageDesc: ['用白紅色紙張精巧摺成的蛋，帶著俐落摺痕。能收集創意，孕育靈巧的摺紙之力。', '小巧的摺紙小獸，身上有可愛摺線。輕盈好動，一陣風就能飄起來，還會摺出小紙鶴。', '摺工繁複的摺紙獸，身邊飛舞著紙鶴。能變化各種摺紙造型，靈巧又充滿巧思。', '由白紅金紙摺成的優雅飛龍，翼與尾如流水。能召喚紙鶴群飛舞，精緻而華麗。'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'musicnote',      name: '音符靈',   stages: ['🥚', '🎵', '🎶', '🎼'], stageNames: ['樂音卵', '小音符', '音符靈', '和聲守護者'], stageDesc: ['畫著五線譜與金色譜號、透著微光的蛋。能收集美妙旋律，孕育動聽的音樂之力。', '發著光、像音符的小精靈，揮著小小的手。開心時會蹦出可愛音符，活潑又愛唱歌。', '身纏樂譜與光之音符的靈體，戴著小耳機。能奏出療癒旋律，讓聽到的人放鬆微笑。', '被金色樂章環繞的守護者，頭戴音符之冠。能指揮壯麗的和聲，用音樂溫暖每顆心。'], needs: [0, 6, 14, 25], gems: 6 },
    { key: 'lantern',        name: '燈籠靈',   stages: ['🥚', '🏮', '✨', '🎑'], stageNames: ['微光卵', '燈籠幼靈', '燈籠靈', '光明守護燈'], stageDesc: ['像小紙燈籠般、內部透著暖光的蛋。能在黑暗中點亮微光，孕育溫暖的光明之力。', '圓圓的小燈籠精靈，肚子裡有跳動的小火苗。膽小怕黑，身邊總繞著幾隻螢火蟲。', '掛著流蘇的燈籠靈，散發柔和暖光。能在夜裡照亮道路、驅走害怕，溫柔又可靠。', '金絲雕花的節慶大燈籠守護者，光芒溫暖。能點亮整片黑夜、指引方向，安詳而慈祥。'], needs: [0, 7, 16, 28], gems: 6 },
    { key: 'fossildino',     name: '化石龍',   stages: ['🥚', '🦕', '🦴', '🦖'], stageNames: ['化石卵', '幼化石獸', '化石龍', '遠古骨龍'], stageDesc: ['嵌著琥珀、裂縫透出微光的石化蛋。封存著遠古記憶，孕育古老的大地之力。', '沙棕色的小恐龍寶寶，背上有小小骨板。好奇又活潑，笨拙地邁著小短腿探險。', '身覆骨甲、鑲著琥珀的化石龍，威風凜凜。能以厚重身軀衝撞，堅硬又充滿遠古氣勢。', '披著古老骨甲、琥珀核發光的遠古骨龍。能喚醒沉睡的大地之力，強大而威嚴。'], needs: [0, 7, 16, 28], gems: 7 },
    // 第四批新增 5 隻（不同主題）
    { key: 'bubbletea',      name: '珍奶獸',   stages: ['🥚', '🧋', '🧋', '👑'], stageNames: ['珍珠卵', '珍奶幼獸', '珍奶獸', '珍珠奶蓋王'], stageDesc: ['像密封珍奶杯的蛋，奶茶色還點著珍珠。能吸收香甜奶茶香，孕育Q彈的珍奶之力。', '奶茶色軟嫩的小珍奶獸，肚子裡有珍珠。愛喝甜甜的東西，頭上插著一根小吸管。', '身體像香濃奶茶的珍奶獸，珍珠在肚裡滾動。能變出珍奶請客，Q彈又療癒。', '戴著珍珠王冠、身披焦糖奶蓋的珍奶王，拿著吸管權杖。能召喚珍奶盛宴，甜蜜又氣派。'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'cactus',         name: '仙人掌獸', stages: ['🥚', '🌵', '🌵', '🌸'], stageNames: ['沙芽卵', '仙人掌苗', '仙人掌獸', '沙漠花冠獸'], stageDesc: ['圓圓的沙綠色蛋，頂上開著一朵小花。能耐旱儲水，孕育堅韌的沙漠生命力。', '圓滾滾的小仙人掌，軟軟的刺配著粉紅小花。堅強又樂觀，曬曬太陽就精神飽滿。', '一節節的仙人掌獸，開著更多花。能儲存水分、在酷熱中生存，堅韌又充滿活力。', '高聳如仙人掌塔的守護獸，頂著盛開花冠。能在沙漠中湧出綠洲，溫暖又充滿生機。'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'balloon',        name: '氣球獸',   stages: ['🥚', '🎈', '🎈', '🎉'], stageNames: ['氣球卵', '氣球幼獸', '氣球獸', '派對氣球王'], stageDesc: ['像亮亮派對氣球的蛋，紅紅的還打著結。能充滿輕盈空氣，孕育飄飄的氣球之力。', '紅色氣球扭成的小狗，亮亮的圓眼睛。輕飄飄的愛飄浮，開心時會啵啵彈跳。', '五彩氣球扭成的氣球獸，戴著派對帽。能變出各種氣球造型，帶來歡樂的派對氣氛。', '彩虹氣球雕成的派對之王，周圍飄著彩帶與紙花。能掀起盛大派對，歡樂又熱鬧。'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'firefly',        name: '螢火獸',   stages: ['🥚', '🐛', '✨', '🪲'], stageNames: ['螢光卵', '螢火幼蟲', '螢火獸', '流螢守護者'], stageDesc: ['深綠色、內部透出溫暖金光跳動的蛋。能在夜裡發光，孕育柔和的螢火之力。', '圓圓的深綠小蟲，尾巴亮著金光。有點怕生，在夜晚會一閃一閃地發亮。', '亮著花紋、尾巴像小燈籠的螢火獸。能在黑夜綻放柔光指引方向，溫柔又寧靜。', '散發璀璨金光的螢火守護者，翅膀晶瑩，繞著點點流螢。能點亮整個夜晚，安詳而夢幻。'], needs: [0, 7, 16, 28], gems: 6 },
    { key: 'snail',          name: '蝸牛獸',   stages: ['🥚', '🐌', '🐌', '💎'], stageNames: ['螺紋卵', '幼蝸牛', '蝸牛獸', '珠寶蝸牛王'], stageDesc: ['有著珍珠螺紋、泛著金光的蛋。能慢慢累積能量，孕育溫吞而堅韌的力量。', '藍身金殼的小蝸牛，觸角圓圓的。慢吞吞又悠哉，身後總拖著晶亮的露珠。', '背著華麗寶石殼的蝸牛獸，慢慢前行。殼能防禦攻擊，沉穩又不慌不忙。', '背著鑲滿寶石黃金螺殼的蝸牛王，散發光暈。能以堅殼守護一切，優雅而尊貴。'], needs: [0, 7, 16, 28], gems: 7 },
    // 第五批新增 5 隻（不同主題）
    { key: 'acorn',          name: '橡實獸',   stages: ['🥚', '🌰', '🌰', '🌳'], stageNames: ['橡實卵', '橡實幼獸', '橡實獸', '橡樹守護者'], stageDesc: ['像橡實般、頂著小帽的棕色蛋。能吸收陽光雨露，孕育堅實的森林之力。', '圓滾滾的小橡實獸，頂著小帽子。害羞又乖巧，愛躲在落葉堆裡曬太陽。', '披著葉冠、揮著小樹枝手的橡實獸。能讓橡樹快速生長，穩重又充滿生機。', '頭頂發芽小橡樹的守護者，冠著橡葉與橡實。能喚醒整片橡樹林，古老而慈祥。'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'teacup',         name: '茶靈',     stages: ['🥚', '🍵', '🍵', '🫖'], stageNames: ['茶芽卵', '小茶靈', '茶靈', '茶壺守護者'], stageDesc: ['畫著茶葉花紋、飄著細細蒸氣的瓷蛋。能凝聚茶香，孕育溫潤的茶之靈氣。', '琥珀茶色、坐在小茶杯裡的茶精靈，頭上冒著蒸氣。溫溫的很療癒，愛窩著發呆。', '戴著茶杯帽、拖著蒸氣鬃毛的茶靈。能泡出安神的香茶，溫和又寧靜。', '頂著華麗茶壺冠、身如流動茶湯的守護者，繞著茶香蒸氣。能沏出療癒之茶，優雅而安詳。'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'kite',           name: '風箏獸',   stages: ['🥚', '🪁', '🪁', '🐉'], stageNames: ['紙鳶卵', '風箏幼獸', '風箏獸', '天空龍箏'], stageDesc: ['菱形、畫著彩色風箏花紋的蛋，垂著小尾帶。能乘風飄浮，孕育自由的天空之力。', '小小的菱形風箏獸，拖著彩帶尾巴。乘著微風就能飄，開心又愛在天上打轉。', '彩色風箏身、拖著長彩帶的風箏獸。能駕馭風飛得又高又遠，自由又充滿活力。', '化為華麗龍形風箏的天空守護者，彩帶如虹。能乘風翱翔天際，自由而繽紛。'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'coral',          name: '珊瑚獸',   stages: ['🥚', '🪸', '🪸', '🐚'], stageNames: ['珊瑚卵', '珊瑚幼靈', '珊瑚獸', '珊瑚礁守護者'], stageDesc: ['畫著珊瑚枝紋、冒著小泡泡的粉彩蛋。能淨化海水，孕育繽紛的海洋之力。', '粉橘珊瑚身的小海靈，帶著小小魚鰭。愛在海裡玩耍，身邊飄著閃亮泡泡。', '身長珊瑚枝與海葵的珊瑚獸，色彩鮮豔。能孕育海底的生命，溫柔又充滿生機。', '由發光彩虹珊瑚構成的守護者，戴著珍珠冠。能守護整片珊瑚礁，寧靜而神聖。'], needs: [0, 7, 16, 28], gems: 6 },
    { key: 'umbrella',       name: '雨傘獸',   stages: ['🥚', '☂️', '☔', '🌈'], stageNames: ['雨滴卵', '雨傘幼獸', '雨傘獸', '彩虹雨傘王'], stageDesc: ['像收起小傘的深藍圓蛋，畫著雨滴紋。能凝聚水氣，孕育溫柔的雨之力量。', '頂著小傘帽的藍色小獸，圓圓的很可愛。喜歡下雨天，在細雨中蹦蹦跳跳。', '撐著大傘帽、揮著小手的雨傘獸。能呼喚及時雨、擋風遮雨，溫柔又貼心。', '撐著華麗大傘的雨之守護者，繞著雨滴與小彩虹。能在雨後掛起彩虹，安詳而溫暖。'], needs: [0, 7, 16, 28], gems: 6 },
    // 第六批新增 5 隻（不同主題）
    { key: 'soapbubble',     name: '泡泡獸',   stages: ['🥚', '🫧', '🫧', '🌈'], stageNames: ['泡泡卵', '泡泡幼靈', '泡泡獸', '虹彩泡泡王'], stageDesc: ['閃著虹彩薄膜、飄著小泡泡的透明蛋。能反射七彩光，孕育輕盈的泡泡之力。', '圓圓透明、泛著虹光的泡泡精靈。輕飄飄的很脆弱，開心時會啵地冒出小泡泡。', '身體像大肥皂泡、映著彩虹的泡泡獸。能吹出大大小小的泡泡，夢幻又療癒。', '由無數發光泡泡聚成的守護者，戴著閃亮泡泡冠。能召喚繽紛泡泡海，如夢似幻。'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'plush',          name: '玩偶獸',   stages: ['🥚', '🧸', '🧸', '👑'], stageNames: ['布偶卵', '小布偶', '玩偶獸', '拼布守護者'], stageDesc: ['像縫線布偶的蛋，米色布料還縫著小鈕扣。能收集擁抱的溫暖，孕育柔軟的布偶之力。', '拼布做成的小泰迪熊，鈕扣眼睛與縫線笑容。軟綿綿超好抱，總是笑咪咪的。', '一身拼布、繫著蝴蝶結的玩偶獸。能給人暖暖的擁抱，撫慰難過的心情。', '披著華麗拼布斗篷與冠的守護者，飄著棉花與鈕扣。能用溫暖守護大家，柔軟又可靠。'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'maple',          name: '楓葉獸',   stages: ['🥚', '🍁', '🍁', '🦌'], stageNames: ['楓葉卵', '楓葉幼鹿', '楓葉獸', '秋楓守護鹿'], stageDesc: ['畫著紅橙楓葉紋、暖色調的蛋，頂著一片楓葉。能吸收秋陽，孕育溫暖的秋之力量。', '披著紅橙楓葉的小鹿，尾巴是一片楓葉。乖巧安靜，走過會飄落幾片楓葉。', '身覆層層楓葉、頂著枝角的楓葉獸。能讓落葉翩翩起舞，溫暖又詩意。', '鹿角燃著紅金楓葉的守護鹿，飄著楓葉與暖光。能喚起整片楓林，寧靜而優雅。'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'book',           name: '書靈',     stages: ['🥚', '📖', '📚', '🦉'], stageNames: ['書頁卵', '小書靈', '書靈', '魔導典守護者'], stageDesc: ['像小皮革書、鑲著金邊與書籤的蛋。能收集知識，孕育智慧的書之力量。', '翻開的小書精靈，飄出發光的字母。好奇又愛學習，喜歡分享知道的小知識。', '書頁如翅膀展開的書靈，戴著小眼鏡。能讓文字發光、解答疑問，聰明又博學。', '魔導巨典化成的守護者，發光書頁如翼，繞著符文與羽毛筆。能施展知識的魔法，睿智而莊嚴。'], needs: [0, 7, 16, 28], gems: 6 },
    { key: 'bell',           name: '鈴鐺獸',   stages: ['🥚', '🔔', '🔔', '🎐'], stageNames: ['鈴鐺卵', '小鈴鐺', '鈴鐺獸', '神殿聖鐘獸'], stageDesc: ['金黃亮亮、像小鈴鐺的蛋，繫著小緞帶。能收集清脆聲響，孕育響亮的鈴之力。', '圓圓的金色小鈴鐺，繫著緞帶。一動就叮鈴響，開朗又愛蹦跳，帶來好心情。', '刻著花紋的金鈴鐺獸，揮手就響起清音。能敲出悅耳鈴聲、驅走煩惱，開朗又活潑。', '化為華麗神殿大鐘的守護者，繫著紅金緞帶。能敲響祈福聖鐘迴盪四方，莊嚴而祥和。'], needs: [0, 7, 16, 28], gems: 6 },
    // 第七批新增 5 隻（不同主題；朝 50 隻目標）
    { key: 'marble',         name: '彈珠獸',   stages: ['🥚', '🔮', '🔮', '💠'], stageNames: ['彈珠卵', '彈珠幼靈', '彈珠獸', '琉璃彈珠王'], stageDesc: ['玻璃質感、內部旋轉著彩色絲帶的蛋。能折射繽紛的光，孕育晶亮的玻璃之力。', '透明玻璃身、核心旋著彩色漩渦的小精靈。愛滾來滾去，身上會反射漂亮的光。', '玻璃身泛著鮮豔漩渦、帶著晶面的彈珠獸。能折射光線變出彩虹，晶亮又靈動。', '身藏彩色星河、晶面發光的彈珠王，戴著彈珠冠。能召喚繽紛光芒，晶瑩而華貴。'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'dandelion',      name: '蒲公英獸', stages: ['🥚', '🌱', '🌼', '🌬️'], stageNames: ['絨絮卵', '蒲公英苗', '蒲公英獸', '風之花冠獸'], stageDesc: ['像蒲公英絨球的蛋，白絨絨還飄著小種子。能乘風傳播，孕育自由的種子力量。', '白絨絨球身、有著綠莖的蒲公英小精靈。溫柔又輕盈，隨風就會飄起小種子。', '頂著黃花冠、長著葉翼的蒲公英獸。能乘風撒下種子帶來生機，溫柔又自由。', '頂著發光大絨球與金花的守護者，飄著發亮種子。能乘風散播希望，優雅而溫柔。'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'puzzle',         name: '拼圖獸',   stages: ['🥚', '🧩', '🧩', '👑'], stageNames: ['拼圖卵', '拼圖幼獸', '拼圖獸', '智慧拼圖王'], stageDesc: ['由彩色拼圖片組成的蛋，有幾片微微凸起。能拼湊創意，孕育靈巧的智慧之力。', '彩色拼圖片拼成的小獸，身邊飄著一片拼圖。好奇又愛動腦，喜歡拼拼湊湊。', '拼片整齊嵌合、色彩繽紛的拼圖獸。能重組身體變化造型，聰明又靈活。', '由精巧彩虹拼片組成、戴著金片冠的拼圖王，拼片環繞飛舞。能拼出萬物，睿智而巧妙。'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'compass',        name: '羅盤獸',   stages: ['🥚', '🧭', '🧭', '⭐'], stageNames: ['羅盤卵', '羅盤幼獸', '羅盤獸', '領航守護者'], stageDesc: ['刻著羅盤玫瑰、指針微微發光的黃銅蛋。能感應方向，孕育指引的探險之力。', '黃銅身、羅盤面轉呀轉的小獸，有著小指針尾巴。愛冒險又好奇，總想找出新方向。', '黃銅玻璃身、羅盤玫瑰發光、帶著小翅膀的羅盤獸。能指引正確方向，勇敢又可靠。', '羅盤核心閃耀、披著地圖卷軸披風的守護者，繞著方位符文。能領航指路，睿智而勇敢。'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'paint',          name: '調色盤獸', stages: ['🥚', '🎨', '🎨', '🌈'], stageNames: ['顏料卵', '調色盤幼獸', '調色盤獸', '繽紛藝術王'], stageDesc: ['潑灑著繽紛顏料、頂著小畫筆的蛋。能調和色彩，孕育創意的藝術之力。', '調色盤身、點著彩色顏料的小獸，有著畫筆尾巴。愛塗鴉又有創意，身邊飄著顏料點。', '調色盤身、滴著鮮豔顏料、揮著畫筆手的調色盤獸。能揮灑色彩作畫，繽紛又充滿創意。', '身流動著彩虹顏料、戴著畫筆冠的藝術之王，色彩緞帶飛舞。能為世界上色，繽紛而華麗。'], needs: [0, 7, 16, 28], gems: 6 },
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
