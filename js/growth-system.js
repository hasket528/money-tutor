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
        const req = indexedDB.open('shopping-practice', 3);   // 版本與 dialogue/db.js、learning-tracker.js 一致
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
          if (!db.objectStoreNames.contains('interrupted')) {
            db.createObjectStore('interrupted', { keyPath: 'id' });
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

  // ── 教師可調整的經濟設定（2026-07-25 統一制）──────────────────
  // 預設：所有寵物階段門檻 0/20/40/60（餵金幣長大）、25 金幣換 1 寶石、最後階段需 3 寶石、
  // 解鎖收集寵物 15 金幣、餵一次花 5 金幣＋成長 5。
  // 練習領金幣改由「單元獎勵設定」決定（見下方 unitRewardCfg），不在這裡。
  // 教師在「學習歷程總覽 → 成就及寵物設定」可覆寫，存於 localStorage['mt_growth_cfg']。
  const CFG_DEFAULTS = {
    stageNeeds: [0, 20, 40, 60], finalGems: 3, coinsPerGem: 25,
    unlockCoins: 15, feedCost: 5, feedGain: 5,
  };
  function cfg() {
    try {
      const c = Object.assign({}, CFG_DEFAULTS, JSON.parse(localStorage.getItem('mt_growth_cfg') || '{}'));
      if (!Array.isArray(c.stageNeeds) || c.stageNeeds.length !== 4) c.stageNeeds = CFG_DEFAULTS.stageNeeds.slice();
      return c;
    } catch { return Object.assign({}, CFG_DEFAULTS); }
  }
  function saveCfg(patch) {
    const c = Object.assign(cfg(), patch || {});
    localStorage.setItem('mt_growth_cfg', JSON.stringify(c));
    return c;
  }

  // ── 寶石 ──（可用＝無錯通過總數 ＋ 金幣兌換 − 已花費）
  function gemsStore(stuId) {
    try { return JSON.parse(localStorage.getItem(`mt_gems_${stuId}`) || '{}') || {}; } catch { return {}; }
  }
  function saveGemsStore(stuId, s) { localStorage.setItem(`mt_gems_${stuId}`, JSON.stringify(s)); }
  function gemsSpent(stuId)  { return gemsStore(stuId).spent  || 0; }
  function gemsBought(stuId) { return gemsStore(stuId).bought || 0; }
  function gemsTotal(records, stuId) {
    return myRecords(records, stuId).filter(r => isMainRec(r) && r.flawless).length;
  }
  function gemsAvailable(records, stuId) {
    return Math.max(0, gemsTotal(records, stuId) + gemsBought(stuId) - gemsSpent(stuId));
  }
  function spendGems(records, stuId, n) {
    if (gemsAvailable(records, stuId) < n) return false;
    const s = gemsStore(stuId); s.spent = (s.spent || 0) + n; saveGemsStore(stuId, s);
    return true;
  }
  function addGems(stuId, n) {   // 金幣兌換而得的寶石（金幣扣除由 reward 端處理）
    const s = gemsStore(stuId); s.bought = (s.bought || 0) + n; saveGemsStore(stuId, s);
  }

  // ── 寵物介紹（60 種 × 4 階段：金錢豬＋CREATURES）──
  // 名稱與介紹的唯一來源在角色插畫接手專案（寵物重繪/寵物介紹），下面這區由 report/tools/sync_pet_intro.js 產生。
  // 畫面顯示介紹＝stageDesc[階段]；朗讀＝stageSpeech[階段]（已含名稱，不要再自己加名字）。
  // 2026-10-09 使用者定：介紹以外觀、個性、能力與成長故事為主，不硬帶理財說教（金錢豬本身相關可保留）。
  // PET-INTRO-AUTO:BEGIN（由 report/tools/sync_pet_intro.js 從角色插畫接手專案 寵物重繪/寵物介紹/教材匯入資料.json 產生，勿手改）
  const PET_INTRO = {
    goldpig: {"n":["神祕金蛋","小金豬","金豬少年","黃金飛天豬"],"d":["暖金色的蛋坐在紅絨布墊上，細細的星紋閃著光。用遊戲金幣餵食，就能為裡面的小生命補充能量。一起期待牠孵化吧！","圓滾滾的小金豬坐得穩穩的，背上有個小小投幣孔。每次存下一點遊戲金幣，牠就開心地陪你記錄進步。","繫上綠領巾的金豬少年，雙手捧著一枚金幣。牠喜歡和你訂下小目標，一點一點存，慢慢靠近想完成的事。","黃金飛天豬戴著小皇冠，拍動白色翅膀飛起來了！身旁的金幣記錄著累積的努力。牠最想和你分享達成目標的喜悅。"]},
    crystalfox: {"n":["晶芽蛋","幼晶狐","水晶狐","琉璃狐靈"],"d":["紫水晶裡藏著一顆安靜的蛋，透出淡淡藍光。小生命正慢慢收集光的力量，等待和你見面的日子。","小水晶狐睜著好奇的眼睛，身上透著柔柔的光。牠喜歡觀察新事物，陪你把每個小發現記在心裡。","水晶狐披著晶亮的毛，寶石尾巴輕輕搖動。牠能讓光線轉個彎，變出漂亮光彩，探索時也比以前更有自信。","三條寶石尾巴亮了起來，琉璃狐靈正張開守護的光。牠會先看清周圍再行動，也陪你在做決定前多想一想。"]},
    emberpup: {"n":["熾焰蛋","火苗獸","火焰獸","烈炎獅王"],"d":["蛋殼的細縫裡透出橘紅色亮光，小火苗正在裡面成長。安靜等一等，就能認識這位熱情的新夥伴。","毛茸茸的小火苗獸，尾巴像一團跳動的火。牠總是精神滿滿，喜歡陪你開始一天的小任務。","火焰獸長出亮亮的火焰鬃毛，腳步更有力量了。牠正練習控制火光，把滿滿的活力用在幫助夥伴。","烈炎獅王挺起胸口，金色護甲映著溫暖火光。牠勇敢守護夥伴，也懂得先停下來想一想，再決定怎麼做。"]},
    aquaserp: {"n":["露珠蛋","水滴靈","碧水靈","碧海蛟龍"],"d":["這顆蛋像一滴大露珠，裡面有輕輕搖動的水波。溫柔的水之力量，正陪著小生命慢慢甦醒。","透明的小水滴靈圓滾滾的，像會微笑的水珠。牠愛變出小水泡，把發現新事物的快樂分享給你。","碧水靈有柔順的身體，游動時像一道清澈水流。牠能引導水的方向，細心照顧一起探索的夥伴。","碧海蛟龍抬起頭，海水般的鱗片透著亮光。牠用沉穩的力量守護河川與海洋，邀你一起珍惜每一滴水。"]},
    leafling: {"n":["苔芽蛋","嫩芽鹿","森靈鹿","翠森守護鹿"],"d":["青苔和嫩葉包住小小的蛋，像森林送來的禮物。陽光與雨水慢慢帶來能量，新的生命正在發芽。","嫩芽鹿頭上冒出小綠芽，走路一蹦一跳。牠喜歡找尋新長出的花草，陪你發現每天一點點的成長。","森靈鹿的枝葉鹿角更茂盛了，身上點綴著花朵。牠能幫助植物生長，也會耐心照顧還很小的嫩芽。","翠森守護鹿的鹿角像一棵開花的樹，為森林帶來生機。牠守護小動物，走過的地方都會冒出新芽。"]},
    cloudwhale: {"n":["雲絮蛋","雲朵獸","雲鯨","蒼穹雲鯨"],"d":["軟綿綿的雲絮蛋輕輕飄著，像一小團白雲。空氣中的水氣慢慢聚在一起，裡面的生命也正在長大。","胖嘟嘟的小雲獸喜歡悠閒地飄來飄去。牠愛休息，也愛看天空，總能找到讓心情放輕鬆的方法。","雲鯨展開鰭，在天空中慢慢游動。身上的柔光像彩色波紋，牠想帶夥伴一起看看更遠的世界。","厚實巨大的蒼穹雲鯨，舒展鰭和尾巴飛過雲海。牠沉穩地引導風與雲，陪你照自己的步調前進。"]},
    shadowcat: {"n":["暗紋蛋","影靈貓","暗影貓","幻影魅貓"],"d":["深色蛋殼上浮著淡淡紋路，周圍繞著紫色薄霧。小小的影子力量正在休息，等著展開神祕的冒險。","影靈貓的眼睛亮亮的，身影輕得像一片影子。牠最愛玩捉迷藏，常常躲好又忍不住探出頭來。","暗影貓輕輕踏步，尾巴帶著柔柔的霧。牠會留意周圍的變化，再選一條安心的路繼續探索。","幻影魅貓額前有月亮印記，星光在深色身影裡閃動。牠能變出有趣的影子分身，帶著夥伴一起動腦找線索。"]},
    gearcub: {"n":["齒輪蛋","發條獸","機械獸","鋼鐵守衛"],"d":["金屬蛋上有齒輪和螺栓，接縫透出微微藍光。裡面的機械正在準備啟動，一位認真的小夥伴快醒來了。","圓圓的發條獸背著小鑰匙，走起路來滴答滴答。雖然動作還有些生疏，牠每天都願意再練習一次。","機械獸的齒輪轉得更穩，結實的四肢也更有力了。牠喜歡動手解決問題，讓每個零件都發揮用處。","鋼鐵守衛的眼睛亮起光，胸前的藍色核心穩穩發亮。厚實裝甲守護著夥伴，牠也很會修理，能讓停下來的齒輪重新轉動。"]},
    prismbird: {"n":["虹彩蛋","稜光雛","虹光鳥","七彩鳳凰"],"d":["虹彩蛋表面映著七彩光澤，換個方向就有新的顏色。光的力量正在蛋裡相遇，準備帶來一場繽紛的驚喜。","圓胖的稜光雛長出小小水晶羽毛，拍翅膀時亮晶晶的。牠好奇地看看四周，很想和你認識各種顏色。","虹光鳥展開翅膀，飛過時留下柔美的彩色光影。牠學會用光彩表達心情，把好心情送給身旁的夥伴。","七彩鳳凰舒展光羽，長長的尾羽像流動的彩虹。牠帶著希望飛向天空，灑下的光點會變成一道道小彩虹。"]},
    frostbun: {"n":["霜花蛋","雪絨兔","霜雪兔","冰晶霜鹿"],"d":["淡藍色的霜花蛋上，結著細細的雪花紋。冰雪的力量安靜地聚集，像冬天藏起來的一份驚喜。","雪絨兔披著白白的毛，耳尖點著薄霜。牠輕輕跳過細雪，喜歡和夥伴待在涼爽安靜的地方。","霜雪兔長出小冰角，冰藍色的毛亮亮的。牠練習靈巧地移動，也學會先看好方向，再踏出下一步。","透明冰角和霜甲，讓冰晶霜鹿顯得沉穩又優雅。牠張開冰雪守護的力量，做事冷靜，也願意耐心等待。"]},
    magmahorn: {"n":["熔核蛋","岩漿獸","熔岩獸","火山巨獸"],"d":["黑色岩石蛋沉甸甸的，裂縫透出橘紅光。大地的力量藏在裡面，正慢慢累積甦醒的能量。","圓墩墩的岩漿獸踏著小步，身上的裂紋亮亮的。牠雖然力氣大，卻是個喜歡陪伴夥伴的憨厚小傢伙。","熔岩獸穿著厚厚的岩石護甲，站得又穩又有力。牠正練習控制體內的熱能，讓力量用得剛剛好。","火山巨獸的背上流動著熔岩般的光，身體像一座可靠的小山。牠把強大的力量用來守護家園，照顧身旁的生命。"]},
    stormouse: {"n":["電花蛋","電光鼠","雷光鼠","雷霆風暴獸"],"d":["電花蛋旁偶爾閃出小小亮光，像星點跳了一下。小生命正在裡面積蓄電力，準備迎接新的冒險。","黃色的小電光鼠跑跑跳跳，臉頰帶著小電光。牠對什麼都很好奇，喜歡陪你試試新的學習任務。","雷光鼠的閃電尾巴一亮，就精神十足地向前跑。牠越來越會掌握速度，知道什麼時候前進、什麼時候停下來。","雷霆風暴獸目光堅定，雷電在鬃毛間流動。牠能從容引導風暴，用穩定的姿態守護同行的夥伴。"]},
    lunartapir: {"n":["星塵蛋","夢幻貘","夢貘","月光守護獸"],"d":["靛藍色的星塵蛋，像收著一小片月光。夢的碎片慢慢聚在裡面，等著變成溫柔的新生命。","夢幻貘圓胖的身上有小星點，喜歡安靜地打盹。牠會在夢境裡變出漂亮泡泡，邀你一起想像有趣的故事。","夢貘披著星空般的毛，額前亮著小月牙。在牠的魔法故事裡，惡夢會慢慢散去，留下安心的陪伴。","月光守護獸的鬃毛像流動的星河，神情安靜而溫柔。牠編織美夢，也陪你在努力之後，好好休息一下。"]},
    starfawn: {"n":["星光蛋","星塵幼鹿","星塵獸","彗星星鹿"],"d":["深藍色的星光蛋畫著細細星座線，像小小的夜空。每一點星光都在聚集力量，等待新生命甦醒。","星塵幼鹿身上有亮亮星點，小鹿角也冒著微光。牠好奇地蹦跳，想知道每一顆星星藏著什麼故事。","星塵獸奔跑時帶起一道星光，身上的星空紋路清楚又漂亮。牠學會照亮前方，陪夥伴一步一步前進。","彗星星鹿拖著明亮的光尾，鹿角映出燦爛星光。牠陪你望向遠方，也把大目標拆成今天能走的一小步。"]},
    mushroomsprite: {"n":["孢子蛋","小菇精","菇菇精","巨蕈守護者"],"d":["紅白斑點的孢子蛋，像森林裡的小蘑菇。細小的光點在旁邊飄動，一位森林夥伴正在裡面成長。","小菇精頂著紅白菇傘，圓滾滾地探出身子。牠喜歡雨後的森林，總能在角落發現新的小驚喜。","菇菇精戴著發光的大菇傘，披上柔柔的苔蘚斗篷。牠用溫暖的光陪伴小動物，讓大家安心地聚在一起。","巨蕈守護者展開寬大的菇傘，像替森林撐起一把傘。牠把照顧夥伴放在心上，也邀你珍惜大家共享的地方。"]},
    voidkit: {"n":["星幻蛋","虛空幼貓","虛空貓","宇宙星靈"],"d":["漆黑的星幻蛋裡，旋轉著小小星雲。遙遠天空的祕密藏在其中，等待好奇的生命慢慢醒來。","虛空幼貓的毛像夜空，紫色眼睛亮晶晶。牠拖著星雲般的尾巴，喜歡探頭看看沒去過的角落。","虛空貓身上流動著星河，腳步輕巧又安靜。牠能在奇幻空間裡穿梭，每次出發都帶著新的好奇。","宇宙星靈身旁環繞星光，像把夜空帶到了身邊。牠用沉穩的目光探索遠方，遇到未知也願意先問清楚。"]},
    candypup: {"n":["糖霜蛋","棉花糖幼犬","棉花糖獸","甜心糖果王"],"d":["粉白糖霜包住小小的蛋，表面點著晶亮糖粒。甜蜜的香氣慢慢聚集，柔軟的小生命正在成長。","棉花糖幼犬的粉藍身體軟綿綿的，像一團小雲。牠喜歡親近夥伴，用可愛的模樣帶來好心情。","棉花糖獸長出蓬鬆的鬃毛，身上點著糖果色花紋。牠最愛變出棉花糖，再和大家一起分享甜蜜。","甜心糖果王戴著糖果王冠，熱情地準備甜點聚會。牠一開心，身邊就飄出繽紛糖果，讓聚會更熱鬧。"]},
    sandsphinx: {"n":["沙紋蛋","沙獅幼獸","沙獅獸","黃金獅身獸"],"d":["金沙色的蛋刻著古老花紋，透出柔和暖光。沙漠的力量安靜藏在裡面，等待小小守護者甦醒。","沙獅幼獸有沙金色的毛和圓耳朵，喜歡在沙地打滾。牠拍拍身上的沙，又開心地去找下一個發現。","沙獅獸的鬃毛像流動的金沙，額前寶石閃著光。牠更有自信了，能引導沙粒，也會留意夥伴是否跟上。","黃金獅身獸戴著莊重頭飾，安穩地守望沙漠。牠能喚起溫暖的金沙，替迷路的旅人指出回家的路。"]},
    windgriff: {"n":["微風蛋","風翼雛","風翼獸","疾風獅鷲"],"d":["淡綠色的微風蛋旁飄著小羽毛，輕盈得像一陣風。天空的力量正在裡面聚集，等著展開第一場冒險。","風翼雛長著淡綠色絨毛，小翅膀正努力拍動。牠喜歡試著乘風飄起，一次比一次更熟練。","風翼獸的羽翼長得更完整，滑翔時輕輕帶起葉子。牠會觀察風的方向，找到適合自己的前進方式。","疾風獅鷲舒展有力的雙翼，穩穩駕馭天空的氣流。牠出發前會看好方向，陪你先做好計畫再行動。"]},
    honeybee: {"n":["蜜巢蛋","小蜜蜂","蜜糖蜂","蜂巢守護王"],"d":["琥珀色的蜜巢蛋上，有整齊的蜂巢花紋。甜甜的能量一點點聚集，勤勞的小生命正在裡面長大。","黃黑相間的小蜜蜂，拍著薄薄的翅膀飛來了。牠珍惜每次找到的花蜜，開心地完成今天的小任務。","蜜糖蜂背著蜜罐，在花間忙碌地飛舞。牠每天收集一點，慢慢釀成蜂蜜，就像把小小的努力累積起來。","蜂巢守護王戴著蜂巢王冠，照顧花園和夥伴。牠懂得分工合作，讓大家的努力一起變成豐富的收穫。"]},
    inkocto: {"n":["墨滴蛋","墨靈幼章","墨靈章","墨海章魚王"],"d":["深色的墨滴蛋裡，暈開柔柔的墨紋。小生命正收集畫畫的靈感，等待把故事慢慢畫出來。","墨靈幼章有圓圓的頭和捲捲的觸手，模樣很逗趣。牠有點害羞，熟悉之後就愛和夥伴一起玩。","墨靈章靈巧地揮動觸手，把墨水變成一幅幅圖畫。牠喜歡先想好要畫什麼，再慢慢完成自己的作品。","墨海章魚王揮動長長的觸手，墨線像漂亮的書法。牠能同時畫好幾幅畫，讓墨水裡的故事一個個活起來。"]},
    yarnkit: {"n":["線團蛋","毛線幼貓","毛線獸","織夢守護者"],"d":["粉彩毛線繞成一顆柔軟的蛋，旁邊垂著小線頭。溫暖的心意藏在裡面，正慢慢織出新的生命。","毛線幼貓有可愛的鈕扣眼睛，身體像小小毛線球。牠喜歡玩耍，也喜歡窩在夥伴旁邊。","毛線獸圍著小圍巾，身上的拼布各有不同花樣。牠會把零散毛線織在一起，做成實用又溫暖的小東西。","織夢守護者帶著毛線和棒針，仔細織出柔軟的作品。牠織出的毛毯暖暖的，能把好夢輕輕包起來。"]},
    paperfold: {"n":["摺紙蛋","摺紙幼獸","摺紙獸","摺紙飛龍"],"d":["白色和紅色紙張摺成小小的蛋，摺線整整齊齊。創意正在裡面悄悄成長，準備展開新的模樣。","摺紙幼獸的身體有清楚摺線，走起路來輕輕巧巧。牠喜歡把一張紙變出新花樣，每次嘗試都有驚喜。","摺紙獸身旁飛著小紙鶴，摺紙的本領更熟練了。牠會先想好步驟，再把平平的紙變成立體作品。","摺紙飛龍展開紙翼，紅白金色的摺痕映著柔光。牠用一張張紙創造精彩世界，陪你發現創意也能帶來快樂。"]},
    musicnote: {"n":["樂音蛋","小音符","音符靈","和聲守護者"],"d":["樂音蛋上畫著樂譜和金色記號，透出一點微光。美妙的旋律正在裡面聚集，等待第一聲招呼。","小音符揮著小手，像一個會跳舞的音樂記號。牠開心時就輕輕歌唱，邀你跟著節奏動一動。","戴著耳機的音符靈，身旁繞著明亮的音符。牠學會把不同聲音排在一起，奏出讓人放鬆的旋律。","和聲守護者戴著音符之冠，從容地指揮樂章。牠會聽見每位夥伴的聲音，讓大家一起完成動聽的合作。"]},
    lantern: {"n":["微光蛋","燈籠幼靈","燈籠靈","光明守護燈"],"d":["小燈籠般的微光蛋，肚子裡透著柔柔暖光。新生命正慢慢醒來，準備照亮身旁的一小片地方。","圓圓的燈籠幼靈亮起微光，像在輕聲打招呼。牠還有點怕黑，喜歡和夥伴靠近一些、一起前進。","燈籠靈搖動流蘇，送出穩定而柔和的光。牠比以前更勇敢，能陪夥伴看清腳下的路。","金紅色的光明守護燈，帶著沉穩溫柔的微笑。華麗燈身散發暖光，牠耐心守候，讓迷惘的夥伴找到方向。"]},
    fossildino: {"n":["化石蛋","幼化石獸","化石龍","遠古骨龍"],"d":["石頭般的化石蛋裡，藏著亮亮的琥珀。遠古的故事正慢慢甦醒，一位特別的夥伴快要出現了。","幼化石獸背上有小骨板，踏著短腿東看看、西看看。牠對古老的石頭很好奇，喜歡慢慢找出線索。","化石龍的骨甲更厚實，琥珀在身上閃著光。牠站得穩、也更有力量，能陪夥伴一起探索未知的地方。","遠古骨龍舒展身體，骨甲和琥珀透出古老的光。牠擁有沉穩的智慧，知道看似普通的老東西，也可能藏著珍貴故事。"]},
    bubbletea: {"n":["珍珠蛋","珍奶幼獸","珍奶獸","珍珠奶蓋王"],"d":["奶茶色的珍珠蛋像一杯小飲料，裡面點著圓圓珍珠。甜蜜的小生命正在休息，等著和你打招呼。","珍奶幼獸的身體軟軟的，肚子裡有圓滾滾珍珠。牠帶著小吸管，好奇地看看這個新世界。","珍奶獸的珍珠輕輕滾動，笑起來充滿活力。牠喜歡分享，也會先問問夥伴喜歡什麼口味。","珍珠奶蓋王戴著王冠、拿著吸管權杖，準備招待夥伴。牠揮動權杖，就能讓珍珠一顆顆跳起舞來。"]},
    cactus: {"n":["沙芽蛋","仙人掌苗","仙人掌獸","沙漠花冠獸"],"d":["沙綠色的小蛋頂著一朵花，安靜地等候陽光。裡面藏著儲存水分的本領，正在孕育堅強的新生命。","仙人掌苗圓滾滾的，小花開得很有精神。牠懂得慢慢存下水分，陪你看見一點點累積的力量。","仙人掌獸長得更結實，身上開出更多小花。牠把平時存好的水留著，需要時再好好運用。","沙漠花冠獸頂著盛開的花冠，為乾燥大地帶來生機。牠走過的沙地會開出小花，模樣堅強又溫柔。"]},
    balloon: {"n":["氣球蛋","氣球幼獸","氣球獸","派對氣球王"],"d":["紅紅的氣球蛋打著小結，表面映著柔亮的光。輕盈的力量慢慢充滿，像一場歡樂聚會的開場。","紅色氣球組成的小狗，輕輕一跳就像要飄起來。牠喜歡逗夥伴開心，把平常的一天變得有趣。","氣球獸戴上派對帽，身體多了繽紛顏色。牠學會變出不同造型，讓每位夥伴都有參與的樂趣。","派對氣球王帶著彩帶和紙花，熱情地迎接大家。牠能變出各種氣球造型，讓每場派對都充滿笑聲。"]},
    firefly: {"n":["螢光蛋","螢火幼蟲","螢火獸","流螢守護者"],"d":["深綠色的螢光蛋裡，金色微光一閃一閃。小生命正在累積光亮，準備送出溫柔的第一聲問候。","螢火幼蟲的尾巴亮著小金光，圓圓的身體很可愛。牠雖然有點怕生，仍努力向新夥伴打招呼。","螢火獸的尾巴像小燈籠，夜裡的光更穩定了。牠會留意身旁的夥伴，用柔光陪大家一起前進。","流螢守護者展開晶亮翅膀，身邊聚起點點微光。每一道小光都能幫上忙，就像每一份努力都有它的價值。"]},
    snail: {"n":["螺紋蛋","幼蝸牛","蝸牛獸","珠寶蝸牛王"],"d":["螺紋蛋上有珍珠般的紋路，映著淡淡金光。牠不急著醒來，正在用自己的速度慢慢累積力量。","藍色的小蝸牛背著金色殼，圓觸角向前探了探。牠走得慢，卻很認真，每天都願意再前進一點。","蝸牛獸背著漂亮的寶石殼，穩穩走在自己的路上。牠不和別人比快，知道持續累積也能慢慢接近目標。","珠寶蝸牛王背著厚實金殼，寶石映出柔和的光。牠珍惜一路累積的成果，也願意耐心守護同行的夥伴。"]},
    acorn: {"n":["橡實蛋","橡實幼獸","橡實獸","橡樹守護者"],"d":["棕色的橡實蛋戴著小帽，像剛從樹上落下的禮物。陽光和雨露慢慢帶來能量，森林的新生命正在裡面成長。","橡實幼獸頂著小帽子，圓圓的身體有些害羞。牠喜歡躲在葉子旁，等熟悉了才開心地探出頭。","橡實獸戴著綠葉冠，伸出小樹枝般的手。牠學會照顧嫩芽，耐心等待小小的橡樹一天一天長大。","橡樹守護者頭上長出小樹，橡葉和橡實圍在身旁。牠知道成長需要時間，陪你把今天的小努力慢慢累積。"]},
    teacup: {"n":["茶芽蛋","小茶靈","茶靈","茶壺守護者"],"d":["瓷蛋上畫著綠色茶葉，細細蒸氣輕輕升起。溫暖的茶香藏在裡面，等待一位安靜的小精靈甦醒。","琥珀色的小茶靈坐在茶杯裡，懶洋洋地看著四周。牠喜歡安靜的陪伴，和你一起享受片刻的放鬆。","茶靈穿著葉紋小袍，輕巧地伸出手腳。牠能托起小茶珠、引導蒸氣，是個活潑又溫和的少年精靈。","茶壺守護者戴著小茶壺冠，雙手從容地引導茶珠與蒸氣。牠用溫暖的心款待夥伴，懂得照顧每一位來訪的朋友。"]},
    kite: {"n":["紙鳶蛋","風箏幼獸","風箏獸","天空龍箏"],"d":["彩色的紙鳶蛋有菱形外表，下面垂著小尾帶。微風輕輕吹過，裡面的天空力量也慢慢醒來。","小小風箏獸拖著彩帶尾巴，開心地迎著微風。牠正在練習保持平衡，每次飄起來都覺得很新鮮。","風箏獸的眼神更專注，彩帶隨著氣流輕輕擺動。牠學會用手引導風，帶著自信去探索更遠的地方。","天空龍箏展開有力的身體，引導氣流形成守護的弧線。牠沉穩地迎向風，照顧一起飛行的夥伴。"]},
    coral: {"n":["珊瑚蛋","珊瑚幼靈","珊瑚獸","珊瑚礁守護者"],"d":["粉彩色的珊瑚蛋上，有像小樹枝的珊瑚紋。幾顆泡泡輕輕升起，海洋的小生命正在裡面成長。","粉橘色的珊瑚幼靈擺動小魚鰭，身旁飄著泡泡。牠喜歡看看海裡的鄰居，和大家一起玩耍。","珊瑚獸身上長出更多繽紛的珊瑚枝，模樣更豐富了。牠細心照顧海底夥伴，讓大家都有安心相處的地方。","珊瑚礁守護者戴著珍珠冠，身體散發柔和的彩光。牠珍惜海洋裡的每個生命，邀你一起愛護共同的家。"]},
    umbrella: {"n":["雨滴蛋","雨傘幼獸","雨傘獸","彩虹雨傘王"],"d":["深藍色的雨滴蛋像一把收起的小傘，布面有雨滴紋。水氣一點點凝聚，雨之力量正在安靜成長。","雨傘幼獸頂著小傘帽，伸手托起一顆小水珠。牠剛學會凝聚水氣，正開心地和你分享新本領。","雨傘獸專注地伸出手，讓幾顆雨滴沿著弧線前進。牠正在練習引導水流，一次比一次更穩定。","彩虹雨傘王舉起彩虹傘，讓魔力沿著傘杆流向傘面。牠用另一隻手引導水流，張開溫柔的風雨守護屏障。"]},
    soapbubble: {"n":["泡泡蛋","泡泡幼靈","泡泡獸","虹彩泡泡王"],"d":["透明的泡泡蛋映著淡淡彩光，身旁浮著小泡泡。輕盈的力量藏在薄薄的光裡，等待新生命甦醒。","圓圓的泡泡幼靈輕輕飄著，透明身體映出彩虹色。牠開心時會冒出小泡泡，像在向你招手。","泡泡獸吹出大大小小的泡泡，專心看著它們飄動。牠學會調整力道，讓每顆泡泡都有自己的模樣。","虹彩泡泡王戴著亮亮的泡泡冠，帶來一片繽紛泡泡。牠邀大家一起欣賞，也懂得為每位夥伴留出舒服的空間。"]},
    plush: {"n":["布偶蛋","小布偶","玩偶獸","拼布守護者"],"d":["米色布料縫成小小的蛋，縫線和鈕扣整整齊齊。溫暖的心意藏在裡面，準備長成柔軟的新夥伴。","小布偶有鈕扣眼睛和縫線笑容，像一隻好抱的小熊。牠總是笑咪咪的，喜歡陪你分享一天的心情。","玩偶獸繫著蝴蝶結，身上的拼布充滿不同花樣。牠會張開手送上暖暖擁抱，安靜聽夥伴說話。","拼布守護者披著柔軟斗篷，用溫暖陪伴大家。牠身上每塊拼布都藏著一段回憶，也會細心縫好夥伴的小破洞。"]},
    maple: {"n":["楓葉蛋","楓葉幼鹿","楓葉獸","秋楓守護鹿"],"d":["暖色的楓葉蛋頂著小楓葉，像收著一點秋日陽光。新的森林夥伴，正在裡面慢慢累積力量。","楓葉幼鹿披著紅橙色葉子，尾巴像一片小楓葉。牠輕輕踏步，喜歡安靜地看看季節的變化。","楓葉獸長出枝角，身上的葉片一層又一層。牠能讓落葉隨風起舞，把秋天的顏色分享給夥伴。","秋楓守護鹿的鹿角綻放紅金葉色，神情安穩又溫柔。牠懂得在不同季節做好準備，也陪你留意生活中的變化。"]},
    book: {"n":["書頁蛋","小書靈","書靈","魔導典守護者"],"d":["棕色皮革和奶油色書頁，合成一顆金邊書頁蛋。紅書籤輕輕垂著，新的故事正等著被翻開。","小書靈攤開書頁，好奇地望著發光字母。牠喜歡問問題，也喜歡把剛學會的小知識分享給你。","書靈展開一層層書頁翅膀，紅書籤隨風飄動。牠的目光更專注，會陪你找資料，把不懂的地方問清楚。","厚實的魔導典守護者拿起羽毛筆，舒展書頁雙翼。牠用知識守護夥伴，寫下的文字會化成閃亮的魔法光。"]},
    bell: {"n":["鈴鐺蛋","小鈴鐺","鈴鐺獸","神殿聖鐘獸"],"d":["亮亮的鈴鐺蛋繫著小緞帶，像藏著一聲輕輕的問候。清脆的聲音正在裡面聚集，等待新夥伴甦醒。","小鈴鐺一動就叮鈴叮鈴，圓圓的模樣很有精神。牠愛蹦跳、愛打招呼，總能帶來好心情。","鈴鐺獸身上的花紋更清楚，揮手就響起悅耳鈴聲。牠學會掌握節奏，提醒大家一起開始下一項任務。","神殿聖鐘獸繫著紅金緞帶，送出沉穩而溫暖的鐘聲。牠陪你記得重要約定，安排好時間，也安排好今天要做的事。"]},
    marble: {"n":["彈珠蛋","彈珠幼靈","彈珠獸","琉璃彈珠王"],"d":["透明玻璃蛋裡，彩色旋帶慢慢轉動。青藍、金橙和紫色相遇，像把一個小小彩虹藏在裡面。","彈珠幼靈有圓圓玻璃身體和短手短腳，笑容亮亮的。牠好奇地看看四周，身上的彩光也跟著變換。","彈珠獸長出結實四肢，胸前有一顆彩色彈珠核心。牠開始穿上小水晶護甲，練習穩穩站好、掌握自己的力量。","琉璃彈珠王戴著五珠皇冠，胸口的彩色旋流清楚閃耀。寬厚水晶護甲守護著夥伴，目光沉穩而自信。"]},
    dandelion: {"n":["絨絮蛋","蒲公英苗","蒲公英獸","風之花冠獸"],"d":["白絨絨的絨絮蛋像一顆蒲公英球，旁邊飄著小種子。微風帶來新的力量，生命正等著慢慢發芽。","蒲公英苗有白白的絨球和細綠莖，模樣輕盈可愛。牠好奇地看著種子飄動，想知道風會帶來什麼故事。","蒲公英獸頂著黃花，展開綠色葉翼，露出自信的微笑。牠學會引導種子乘風出發，準備探索更遠的地方。","風之花冠獸舒展手腳，像輕盈的自然精靈。牠讓發亮的種子隨風飄送，把新生命與希望分享給更多地方。"]},
    puzzle: {"n":["拼圖蛋","拼圖幼獸","拼圖獸","智慧拼圖王"],"d":["彩色拼片組成一顆特別的蛋，每一塊都有自己的位置。小小的巧思正在裡面聚集，等待拼出新的生命。","拼圖幼獸好奇地看著身旁的小拼片，喜歡試試不同位置。拼錯也沒關係，牠總願意換個方法再試一次。","拼圖獸身上的拼片更整齊，動作也更靈活了。牠會先觀察形狀，再一步一步把問題拼完整。","智慧拼圖王從容地排列彩色拼片，組出新的圖案。牠陪你把難題拆成小塊，再一片一片拼出答案。"]},
    compass: {"n":["羅盤蛋","羅盤幼獸","羅盤獸","領航守護者"],"d":["黃銅色的羅盤蛋裡有小指針，正輕輕指向遠方。探索的力量正在醒來，準備陪你找到新的方向。","羅盤幼獸有圓圓的機械小臉，胸前裝著小羅盤。牠搖著指針尾巴，好奇地想知道下一站在哪裡。","羅盤獸的四肢更結實，肩背長出小金屬翅膀。牠看著胸前的羅盤，帶著專注眼神選好前進方向。","領航守護者披著地圖披風，胸前的羅盤穩穩指引方向。牠先確認目的地再出發，帶著夥伴走過陌生的旅程。"]},
    paint: {"n":["顏料蛋","調色盤幼獸","調色盤獸","繽紛藝術王"],"d":["繽紛顏料點在小蛋上，像一幅還沒完成的畫。小畫筆準備好了，創作的靈感正慢慢醒來。","調色盤幼獸身上有彩色顏料點，還帶著畫筆尾巴。牠喜歡試試新顏色，每一次小塗鴉都是新發現。","調色盤獸揮動畫筆，把心裡的想像畫出來。牠開始學會調色，讓不同顏色在畫面裡好好相處。","繽紛藝術王戴著畫筆皇冠，從容地引導流動色彩。牠一揮筆，四周就染上明亮的顏色，像走進一幅大畫。"]},
    top: {"n":["陀螺蛋","陀螺幼獸","陀螺獸","旋風陀螺王"],"d":["陀螺形的小蛋畫著彩色旋紋，像在等待第一圈轉動。平衡的力量正在裡面慢慢聚集。","陀螺幼獸圓圓的，轉了幾圈又晃了一下。牠喜歡練習，願意慢慢找到讓自己站穩的方法。","陀螺獸旋轉得更穩，彩帶跟著身體輕輕飛揚。牠學會控制速度，也知道玩累了可以停下來休息。","旋風陀螺王戴著皇冠，厚實陀盤轉出有力的光尾。牠自信地迎接挑戰，重視公平，也懂得欣賞夥伴的努力。"]},
    key: {"n":["鑰匙蛋","鑰匙幼獸","鑰匙獸","解鎖守護者"],"d":["金色鑰匙形的小蛋刻著花紋，透出一點亮光。解開祕密的力量正慢慢甦醒，等待新的探索。","鑰匙幼獸有圓耳朵和小鼻子，尾巴帶著鑰匙形狀。牠是好奇的小鼠夥伴，喜歡留意藏在角落的線索。","鑰匙獸的身形更靈巧，背上有小小金色護甲。牠動動鬍鬚、看看機關，耐心找出適合的開鎖方法。","解鎖守護者戴著鑰匙皇冠，站姿穩健又可靠。牠能打開各種神祕的門，也細心守護大家託付的寶物。"]},
    hourglass: {"n":["流沙蛋","沙漏幼靈","沙漏獸","時光守護者"],"d":["玻璃蛋裡的金色細沙，從上方慢慢流向下方。這顆流沙蛋安靜地記錄時間，等待小生命甦醒。","沙漏幼靈抬起圓圓的機械小臉，胸口的細沙輕輕流動。牠好奇地學著等待，發現很多事情都需要一點時間。","沙漏獸的齒輪關節更結實，胸前沙漏穩穩放在框架裡。牠做事專注，喜歡先排好順序，再一件一件完成。","時光守護者戴著古銅頭盔，胸前沙漏和肩上時鐘一起記錄時間。牠能讓細沙停一停，陪你把重要的事一件件排好。"]},
    magnet: {"n":["磁能蛋","磁鐵幼獸","磁鐵獸","磁力守護者"],"d":["紅色的磁能蛋，正把周圍的磁鐵和小鐵片慢慢吸過來。小小的磁力正在聚集，新的機械生命快醒來了。","磁鐵幼獸伸出短短手腳，好奇地看著鐵片靠過來。牠剛學會使用磁力，常為自己的小發現開心不已。","磁鐵獸長出結實關節和小夾爪，站得更穩了。牠正練習讓鐵片沿著磁力移動，把散亂的小東西整理好。","磁力守護者有厚實裝甲和大型磁鐵雙爪，胸前核心明亮醒目。牠從容地引導金屬零件，讓每樣材料找到合適的位置。"]},
    mirror: {"n":["鏡面蛋","鏡靈幼獸","鏡靈","明鏡守護者"],"d":["橢圓金框包住銀藍色鏡面，柔光輕輕映在上面。鏡面蛋安靜地等待，一位清澈的小精靈快要甦醒。","鏡靈幼獸伸出短短手腳，鏡面浮著好奇的微笑。牠喜歡看看新夥伴，也喜歡發現彼此不同的模樣。","鏡靈伸出手，從鏡面引出一道柔和光弧。牠的眼神更專注，正在學習把光的力量用得更穩。","明鏡守護者的鏡面映著星空，雙掌連起溫柔的光之屏障。牠能看見事物真正的樣子，也會映出夥伴最好的笑容。"]},
    feather: {"n":["羽絨蛋","羽毛幼鳥","羽毛獸","翎羽守護者"],"d":["白金色羽絨包住柔軟的小蛋，隨著微風輕輕晃動。天空的力量正在休息，等待第一次展翅。","羽毛幼鳥拍著小小翅膀，白金羽毛柔柔地飄起。牠溫和又好奇，每天都努力多練習一點。","羽毛獸長出更完整的羽冠和羽毛，能自在乘風滑翔。牠留意氣流的變化，學著用適合的力道飛行。","翎羽守護者舒展白金長羽，從容地飛向天空。牠把柔和的祝福帶給夥伴，也願意放慢腳步陪大家同行。"]},
    pudding: {"n":["布丁蛋","布丁幼獸","布丁獸","焦糖布丁王"],"d":["小小的布丁蛋淋著焦糖，輕輕一晃就彈彈的。甜甜的力量正在裡面成長，等待送出第一個微笑。","焦糖色的布丁幼獸軟嫩圓潤，走起來搖搖晃晃。牠愛玩，也愛和夥伴一起分享快樂的小時光。","布丁獸頂著櫻桃，身上的焦糖映出溫潤亮光。牠學會變出小布丁，開心地邀請夥伴一起品嚐。","焦糖布丁王托起焦糖罐，琥珀色飄帶帶出一份份甜點。牠熱情又從容，邀請大家一起享受甜蜜時光。"]},
    windmill: {"n":["風車蛋","風車幼獸","風車獸","疾風車王"],"d":["彩色風葉連著木質軸柄，組成等待甦醒的風車蛋。微風一吹，新的力量就準備慢慢轉動。","木質的小風車幼獸，頭頂有繽紛風葉。牠一感覺到風，就開心地轉起風車，像在向你打招呼。","風車獸的身體更結實，背後風葉隨著手勢轉動。牠學會引導氣流，把風的力量用來幫忙。","疾風車王昂首站穩，背後四片大風帆清楚展開。牠伸手引導疾風，懂得善用身邊的力量，守護一起前進的夥伴。"]},
    cushion: {"n":["絨枕蛋","抱枕幼獸","抱枕獸","夢枕守護者"],"d":["淡紫和奶油色布料，包成一顆蓬鬆的絨枕蛋。月亮、星星和柔軟流蘇，陪著小生命安靜休息。","抱枕幼獸像一個圓角小抱枕，短短手腳軟綿綿。牠帶著想睡的微笑，最喜歡安靜陪在夥伴身邊。","長長的抱枕獸安穩趴著，身上繡著月亮和星星，耳尖垂著小流蘇。牠瞇著眼微笑，像在邀你一起放鬆休息。","夢枕守護者長成厚實又蓬鬆的大抱枕獸，身旁像展開柔軟棉被。牠彎起尾巴留出依偎的地方，用溫柔陪伴守護美夢。"]},
    dice: {"n":["骰子蛋","骰子幼獸","骰子獸","幸運骰王"],"d":["圓潤的骰子蛋上有清楚的小點點，安靜等著遊戲開始。新的小夥伴正在裡面成長，準備帶來有趣的驚喜。","骰子幼獸滾一圈、翻個身，就開心地笑了。牠喜歡和大家輪流玩，看看這一回會出現幾個點。","骰子獸的點點亮了起來，動作也更靈巧。牠喜歡新的挑戰，知道結果有時不同，仍願意開心地再試一次。","幸運骰王戴著皇冠，帶著自信的微笑迎接挑戰。牠喜歡遊戲的驚喜，不管擲出幾點，都能開心地和大家一起玩。"]},
    candle: {"n":["燭芯蛋","燭火幼靈","燭火獸","聖燭守護者"],"d":["象牙白的燭芯蛋頂著小火苗，蠟滴柔柔地凝在身旁。暖金色的光安靜亮著，等待新的生命甦醒。","短胖的燭火幼靈伸出小手小腳，露出親切微笑。頭上的火苗穩穩發亮，像一位溫暖的新朋友。","燭火獸托起小小燭光，和頭頂的火苗輕輕呼應。牠的眼神更沉穩，正學會引導光，陪夥伴看清前方。","聖燭守護者穩穩托著燭座，三道火焰各自散發暖光。牠帶著安心的微笑，用溫柔而可靠的力量守護大家。"]},
    anchor: {"n":["鐵錨蛋","小錨獸","錨獸","深海錨王"],"d":["藍金色的鐵錨蛋繫著繩索，像一件安穩的海上寶物。沉著的力量正在裡面累積，等待新夥伴醒來。","藍色的小錨獸拖著繩尾，努力把自己站穩。牠個子雖小，卻很勇敢，喜歡陪夥伴一起認識海洋。","錨獸的身體更厚實，帶著小魚鰭，站姿穩定。牠學會在風浪裡保持平衡，讓同行的夥伴多一份安心。","深海錨王戴著船長冠，粗繩和厚實身體帶來可靠的力量。風浪再大，牠也能穩穩停住，讓大家的船安心靠岸。"]},
    cookie: {"n":["餅乾蛋","餅乾幼獸","餅乾獸","黃金餅乾王"],"d":["圓圓的餅乾蛋點著巧克力豆，帶著暖暖烘焙色澤。甜點的力量正在裡面成長，等待一位香甜的新夥伴。","餅乾幼獸身上有巧克力豆點點，笑起來圓圓可愛。牠喜歡熱鬧的點心時間，和夥伴一起分享小快樂。","餅乾獸多了細緻糖霜，烘焙的本領也更熟練。牠會先準備好材料，再烤出剛剛好的餅乾和大家分享。","黃金餅乾王展開雙手，暖金光帶召喚出餅乾和小蛋糕。牠從容地準備點心盛宴，讓每位夥伴都吃得開心。"]},
    crayon: {"n":["蠟筆蛋","蠟筆幼獸","蠟筆獸","繽紛蠟筆王"],"d":["彩色蠟筆聚成一顆特別的蛋，筆尖像小小彩虹。豐富的想像正在裡面成長，準備畫出新的故事。","蠟筆幼獸頂著尖尖筆頭，身上有明亮的顏色。牠愛在畫紙上試試線條，每一道塗鴉都是快樂的開始。","蠟筆獸揮動彩色蠟筆，把想像變成一幅幅小畫。牠練習選色和上色，也記得收好用過的畫具。","繽紛蠟筆王自信地揮筆，筆跡變成彩虹、花朵和笑臉。牠讓簡單線條充滿生命力，邀你用手邊的顏色創造快樂。"]},
  };
  // PET-INTRO-AUTO:END
  const introSpeech = (n, d) => n.map((x, i) => x + '。' + d[i]);   // 朗讀文字＝名稱。介紹（唯一組法）

  // ── 寵物（金錢豬：蛋→小金豬→金豬少年→黃金飛天豬）──
  // 名稱/圖/敘述固定；門檻(need)與最終寶石數(gems)由設定注入 → petStages() 取得完整階段。
  const PET_STAGE_META = ['egg', 'baby', 'young', 'super'].map((key, i) => ({
    key, name: PET_INTRO.goldpig.n[i], img: 'images/common/pet_stage' + i + '_' + key + '.png',
    desc: PET_INTRO.goldpig.d[i], speech: introSpeech(PET_INTRO.goldpig.n, PET_INTRO.goldpig.d)[i],
  }));
  function petStages() {
    const c = cfg();
    return PET_STAGE_META.map((s, i) => ({ ...s, need: c.stageNeeds[i], gems: i === 3 ? c.finalGems : 0 }));
  }

  function petData(stuId) {
    try { return JSON.parse(localStorage.getItem(`mt_pet_${stuId}`) || '{"growth":0,"evolved":false}'); }
    catch { return { growth: 0, evolved: false }; }
  }
  function savePet(stuId, pet) { localStorage.setItem(`mt_pet_${stuId}`, JSON.stringify(pet)); }
  function petStage(pet) {
    const st = petStages();
    if (pet.growth >= st[3].need && pet.evolved) return 3;
    if (pet.growth >= st[2].need) return 2;
    if (pet.growth >= st[1].need) return 1;
    return 0;
  }

  // ── 寶物櫃（寶石兌換）──
  // 依價格排列（畫面照這個順序）。id 是學生已兌換清單 mt_treasures_{id} 存的值，不可改。
  // desc＝寶物的一句話（滑過寶物、兌換成功時顯示）；2026-10-07 新增 7 件（使用者定名稱與描述，價格由 Claude 暫訂）
  const TREASURES = [
    { id: 'cup',     icon: '🏆', name: '小金盃',     gems: 1, desc: '為每一次完成練習乾杯。' },
    { id: 'star',    icon: '🌟', name: '閃亮星星',   gems: 1, desc: '把努力變成一顆閃亮的星星。' },
    { id: 'crown',   icon: '👑', name: '金皇冠',     gems: 2, desc: '今天的你，就是自己的小國王。' },
    { id: 'medal',   icon: '🏅', name: '黃金獎牌',   gems: 2, desc: '紀念認真練習的自己。' },
    { id: 'wand',    icon: '🪄', name: '星光魔杖',   gems: 2, desc: '揮一揮，灑出漂亮的星光。' },
    { id: 'chest',   icon: '🎁', name: '神祕寶箱',   gems: 3, desc: '裡面裝著你一路累積的驚喜。' },
    { id: 'shield',  icon: '🛡️', name: '勇氣盾牌',   gems: 3, desc: '遇到困難，也有勇氣再試一次。' },
    { id: 'crystal', icon: '💎', name: '七彩水晶',   gems: 3, desc: '收藏七彩光芒的美麗水晶。' },
    { id: 'castle',  icon: '🏰', name: '夢想城堡',   gems: 4, desc: '一點一滴累積自己的夢想。' },
    { id: 'orb',     icon: '🔮', name: '星願水晶球', gems: 5, desc: '收藏你對未來的小小願望。' },
  ];
  // 寶物與徽章的圖片（2026-10-07 起；角色插畫接手專案交付，report/tools/integrate_character_art.py 整合）：
  // 路徑由代號決定，這裡是唯一定義；畫面一律用 img，載不到才退回 icon（emoji）
  TREASURES.forEach(t => { t.img = `images/treasures/treasure_${t.id}.png`; });
  BADGES.forEach(b => { b.img = `images/badges/badge_${b.id}.png`; });
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
    // 第七批新增 5 隻（不同主題；朝 50 隻目標）
    { key: 'marble',         name: '彈珠獸',   stages: ['🥚', '🔮', '🔮', '💠'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'dandelion',      name: '蒲公英獸', stages: ['🥚', '🌱', '🌼', '🌬️'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'puzzle',         name: '拼圖獸',   stages: ['🥚', '🧩', '🧩', '👑'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'compass',        name: '羅盤獸',   stages: ['🥚', '🧭', '🧭', '⭐'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'paint',          name: '調色盤獸', stages: ['🥚', '🎨', '🎨', '🌈'], needs: [0, 7, 16, 28], gems: 6 },
    // 第八批新增 5 隻（達成 50 隻目標）
    { key: 'top',            name: '陀螺獸',   stages: ['🥚', '🌀', '🌀', '👑'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'key',            name: '鑰匙獸',   stages: ['🥚', '🔑', '🗝️', '👑'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'hourglass',      name: '沙漏獸',   stages: ['🥚', '⏳', '⏳', '⏰'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'magnet',         name: '磁鐵獸',   stages: ['🥚', '🧲', '🧲', '⚡'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'mirror',         name: '鏡靈',     stages: ['🥚', '🪞', '🪞', '✨'], needs: [0, 7, 16, 28], gems: 6 },
    // 第九批新增 5 隻（朝 60 隻，含金蛋）
    { key: 'feather',        name: '羽毛獸',   stages: ['🥚', '🪶', '🕊️', '👑'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'pudding',        name: '布丁獸',   stages: ['🥚', '🍮', '🍮', '👑'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'windmill',       name: '風車獸',   stages: ['🥚', '🌀', '💨', '🌬️'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'cushion',        name: '抱枕獸',   stages: ['🥚', '🛏️', '🧸', '👑'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'dice',           name: '骰子獸',   stages: ['🥚', '🎲', '🎲', '👑'], needs: [0, 7, 16, 28], gems: 6 },
    // 第十批新增 4 隻（達成 60 隻，含金蛋）
    { key: 'candle',         name: '燭火獸',   stages: ['🥚', '🕯️', '🕯️', '🔥'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'anchor',         name: '錨獸',     stages: ['🥚', '⚓', '⚓', '🌊'], needs: [0, 6, 14, 25], gems: 5 },
    { key: 'cookie',         name: '餅乾獸',   stages: ['🥚', '🍪', '🍪', '👑'], needs: [0, 5, 12, 22], gems: 4 },
    { key: 'crayon',         name: '蠟筆獸',   stages: ['🥚', '🖍️', '🖍️', '🌈'], needs: [0, 7, 16, 28], gems: 6 },
  ];
  CREATURES.forEach(c => {   // 階段名稱／介紹／朗讀文字掛到每隻寵物上（舊的 c.stageNames 用法不變）
    const p = PET_INTRO[c.key];
    c.stageNames = p.n; c.stageDesc = p.d; c.stageSpeech = introSpeech(p.n, p.d);
  });
  function petsData(stuId) {
    try { return JSON.parse(localStorage.getItem(`mt_pets_${stuId}`) || '{}'); } catch { return {}; }
  }
  function savePets(stuId, d) { localStorage.setItem(`mt_pets_${stuId}`, JSON.stringify(d)); }
  function mainRecordCount(records, stuId) { return myRecords(records, stuId).filter(isMainRec).length; }
  // 解鎖一隻（統一制：花「金幣」解鎖；金幣扣除由 reward 端處理，這裡只標記解鎖）
  function unlockCreature(stuId, key) {
    const c = CREATURES.find(x => x.key === key);
    if (!c) return false;
    const d = petsData(stuId);
    if (d[key] && d[key].unlocked) return false;
    d[key] = { unlocked: true, fed: 0, evolved: false };
    savePets(stuId, d);
    return true;
  }
  // 某隻目前進化階段（-1=未解鎖）＋成長值＋下一階門檻。統一制：改「餵金幣」長大、門檻讀設定、
  // 最終階段(3)同存錢豬須另花寶石(evolved 旗標)才算進化完成。
  function creatureState(records, stuId, key) {
    const c = CREATURES.find(x => x.key === key);
    const d = petsData(stuId)[key];
    const needs = cfg().stageNeeds;
    if (!c) return { stage: -1, grown: 0, next: null };
    if (!d || !d.unlocked) return { stage: -1, grown: 0, next: needs[1] };
    const grown = d.fed || 0;   // 統一制：成長值＝已餵金幣量（練習可先領成金幣再餵）
    let stage;
    if (grown >= needs[3] && d.evolved) stage = 3;
    else if (grown >= needs[2]) stage = 2;
    else if (grown >= needs[1]) stage = 1;
    else stage = 0;
    const next = stage < needs.length - 1 ? needs[stage + 1] : null;
    return { stage, grown, next };
  }

  // 餵食收集寵物（花金幣→加成長；成長由 reward 端扣金幣後呼叫）
  function feedCreature(stuId, key) {
    const data = petsData(stuId);
    const d = data[key];
    if (!d || !d.unlocked) return false;
    d.fed = (d.fed || 0) + cfg().feedGain;
    savePets(stuId, data);
    return true;
  }
  // 收集寵物最終進化（花寶石；成長須已達最終門檻）
  function evolveCreature(records, stuId, key) {
    const data = petsData(stuId);
    const d = data[key];
    const needs = cfg().stageNeeds;
    if (!d || !d.unlocked || (d.fed || 0) < needs[3] || d.evolved) return false;
    if (!spendGems(records, stuId, cfg().finalGems)) return false;
    d.evolved = true;
    savePets(stuId, data);
    return true;
  }

  // ── 單元獎勵：每完成一次單元練習可領金幣（2026-10-05 使用者定）──────────────
  // 唯一設定在 teacher.html「🎁 單元獎勵設定」＝localStorage['mt_unit_rewards_cfg']
  //   { v:2, enabled:true, units:{ a1:5, …, adventure:5, dialogue:5 } }；沒設定＝開啟、每個單元 5 金幣。
  // v 不是 2 的舊設定（2026-07 那版：預設關閉、點數進優良表現獎勵板的待發獎勵）意思不同，一律視為沒設定。
  // 金幣進「成就與寵物」頁（mt_coins_{id}），學生按領取才入帳；優良表現獎勵板的分數只由老師手動給。
  // 領取制：記已領筆數（mt_practice_claimed_{id}），依時間排序後，超過已領筆數的紀錄才算未領，不重複發。
  const UNIT_REWARD_DEFAULT = 5;
  function unitRewardCfg() {
    try {
      const c = JSON.parse(localStorage.getItem('mt_unit_rewards_cfg') || 'null');
      if (c && c.v === 2) return { enabled: c.enabled !== false, units: c.units || {} };
    } catch {}
    return { enabled: true, units: {} };
  }
  // 金隊長任務（每日任務＋老師指派任務，每完成一項）的金幣：同一份設定的 units.quest，沒設定＝10；
  // 取消啟用單元獎勵＝連任務也不給（2026-10-05 使用者定：兩者一致、由同一處設定）
  const QUEST_REWARD_DEFAULT = 10;
  function questCoins(c = unitRewardCfg()) {
    if (!c.enabled) return 0;
    const v = c.units.quest;
    return v == null ? QUEST_REWARD_DEFAULT : Math.max(0, parseInt(v, 10) || 0);
  }
  // 紀錄 → 單元獎勵設定的鍵：24 單元＝a1…f6、一日金錢冒險＝adventure、生活情境對話＝dialogue
  function rewardKeyOf(r) { return isMainRec(r) || r.situationId === 'adventure' ? r.situationId : 'dialogue'; }
  // 前測／後測（assessment.html 存成 situationId 'assess'）不是單元練習，不給金幣
  const isAssess = r => r.situationId === 'assess';
  function coinsForRecord(r, c = unitRewardCfg()) {
    if (!c.enabled || isAssess(r)) return 0;
    const v = c.units[rewardKeyOf(r)];
    return v == null ? UNIT_REWARD_DEFAULT : Math.max(0, parseInt(v, 10) || 0);
  }
  function practiceClaimed(stuId) {
    try { return parseInt(localStorage.getItem(`mt_practice_claimed_${stuId}`) || '0', 10) || 0; } catch { return 0; }
  }
  function unclaimedRecords(records, stuId) {
    return myRecords(records, stuId).sort((a, b) => (a.ts || 0) - (b.ts || 0)).slice(practiceClaimed(stuId));
  }
  function unclaimedPractices(records, stuId) { return unclaimedRecords(records, stuId).filter(r => !isAssess(r)).length; }
  function unclaimedCoins(records, stuId) {
    const c = unitRewardCfg();
    return unclaimedRecords(records, stuId).reduce((n, r) => n + coinsForRecord(r, c), 0);
  }
  // 回傳「應發放的金幣數」；實際加金幣由 reward 端處理（與成就與寵物頁同一份金幣）
  function claimPracticeCoins(records, stuId) {
    if (unclaimedPractices(records, stuId) <= 0) return 0;
    const coins = unclaimedCoins(records, stuId);
    localStorage.setItem(`mt_practice_claimed_${stuId}`, String(myRecords(records, stuId).length));
    return coins;
  }

  function questMeta(stuId) {
    try { return JSON.parse(localStorage.getItem(`mt_quests_${stuId}`) || 'null'); } catch { return null; }
  }

  return {
    CREATURES, petsData, savePets, unlockCreature, creatureState, feedCreature, evolveCreature,
    addGems,
    get GEM_COIN_COST() { return cfg().coinsPerGem; },
    cfg, saveCfg, CFG_DEFAULTS,
    unclaimedPractices, unclaimedCoins, claimPracticeCoins, unitRewardCfg, coinsForRecord, UNIT_REWARD_DEFAULT, questCoins, QUEST_REWARD_DEFAULT,
    readAllRecords, isMainRec, myRecords,
    BADGES, badgeStore, computeBadges,
    gemsTotal, gemsSpent, gemsAvailable, spendGems,
    get PET_STAGES() { return petStages(); },
    get FEED_COST() { return cfg().feedCost; },
    get FEED_GAIN() { return cfg().feedGain; },
    petData, savePet, petStage,
    TREASURES, treasures, buyTreasure,
    questMeta,
  };
})();
