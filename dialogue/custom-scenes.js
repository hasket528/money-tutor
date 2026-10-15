/**
 * custom-scenes.js — 老師自訂的「場景」與「情境」資料層（**唯一定義處**）
 *
 * 🔴 為什麼要獨立成一支：**站台主頁（index.html）與對話模組（dialogue/script.js）都要建立場景**
 *    ——主頁的「⭐ 自訂」分頁可以就地開彈窗建立，對話模組首頁也可以。
 *    id 怎麼產生、顏色怎麼配、預設場景叫什麼、舊資料怎麼遷移，這些規則只能有一份；
 *    兩邊各寫一次必然漂移（見專案 CLAUDE.md 的單一真相紀律）。
 *    畫面（彈窗長怎樣）各自寫沒關係，**規則一律呼叫這裡**。
 *
 * 結構（2026-09-16 起）：⭐ 自訂分部列「場景卡」，情境條列在場景底下。
 *   場景＝入口容器（名稱／圖示／顏色，沒有步驟）→ localStorage `shoppingPractice_customScenes`
 *   情境＝實際要練的對話 → localStorage `shoppingPractice_custom`，用 `parentId`
 *        指向**自訂場景或內建場所**（沿用既有的「做法二」，練習時仍是情境自己）。
 */
(function (global) {
  'use strict';

  const CUSTOM_KEY = 'shoppingPractice_custom';
  const SCENE_KEY  = 'shoppingPractice_customScenes';

  // 自訂情境的圖示一律用 ⭐（與首頁「⭐ 自訂」分部同一個符號，代表「老師自己做的」）。
  // 2026-09-15 使用者定案：拿掉編輯器的圖示欄位——原本要自己打 emoji，多數老師不知道怎麼打，
  // 欄位裡的「🍽️」其實只是灰色範例字，沒填時各頁卻顯示 💬 或 ⭐，三邊都不一樣。
  const CUSTOM_ICON = '⭐';

  const DEFAULT_ID   = 'cscene_default';
  const DEFAULT_NAME = '我的場景';

  // 建立場景時可點選的圖示：老師多半不知道怎麼打 emoji，給一排點的
  //（自訂**情境**本身仍一律 ⭐，見 CUSTOM_ICON 的說明）
  const SCENE_ICONS = ['⭐', '🏫', '🏠', '🏥', '🏦', '🏪', '🍜', '🚌', '🏬', '📚', '⚽', '🎨'];

  // 自訂場景的自動配色：挑一個「別的場景沒用過」的顏色。12 色都用完才依序產生新色相，
  // 所以不會重複。情境掛在場景／場所底下 → 自己不存顏色，沿用父層的。
  // 主題色是練習頁標題列的底色、上面放白字 → 一律用 700 階的深色（白字對比 ≥ 4.5）。
  const PALETTE = [
    { color: '#15803D', bg: '#DCFCE7', accent: '#166534' },
    { color: '#1D4ED8', bg: '#DBEAFE', accent: '#1E40AF' },
    { color: '#BE185D', bg: '#FCE7F3', accent: '#9D174D' },
    { color: '#6D28D9', bg: '#EDE9FE', accent: '#5B21B6' },
    { color: '#B45309', bg: '#FEF3C7', accent: '#92400E' },
    { color: '#0F766E', bg: '#CCFBF1', accent: '#115E59' },
    { color: '#B91C1C', bg: '#FEE2E2', accent: '#991B1B' },
    { color: '#4338CA', bg: '#E0E7FF', accent: '#3730A3' },
    { color: '#0369A1', bg: '#E0F2FE', accent: '#075985' },
    { color: '#A21CAF', bg: '#FAE8FF', accent: '#86198F' },
    { color: '#4D7C0F', bg: '#ECFCCB', accent: '#3F6212' },
    { color: '#C2410C', bg: '#FFEDD5', accent: '#9A3412' },
  ];

  /** 從調色盤挑一個「清單裡其他人沒用過」的顏色 */
  function pickTheme(items, id) {
    const list = items || [];
    const others = new Set(list.filter(s => s && s.id !== id && s.theme && s.theme.color).map(s => s.theme.color));
    const mine = (list.find(s => s && s.id === id) || {}).theme;
    if (mine && mine.color && !others.has(mine.color)) return mine;   // 已經有自己的顏色、沒撞色 → 不換（學生認得的顏色不要亂變）
    const free = PALETTE.find(t => !others.has(t.color));
    if (free) return free;
    for (let i = 0; ; i++) {                                          // 12 色用完：黃金角轉色相，產生新顏色
      const h = Math.round((i * 137.508 + 15) % 360);
      const t = { color: `hsl(${h}, 70%, 32%)`, bg: `hsl(${h}, 80%, 94%)`, accent: `hsl(${h}, 70%, 26%)` };
      if (!others.has(t.color)) return t;
    }
  }

  // ── 情境（自訂對話本身）──────────────────────────────
  function loadCustoms() {
    try {
      const arr = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
      return Array.isArray(arr) ? arr.map(sc => (sc && typeof sc === 'object' ? { ...sc, icon: CUSTOM_ICON } : sc)) : [];
    } catch (e) { return []; }
  }

  function saveCustoms(arr) {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(arr));
  }

  // ── 場景（入口容器）────────────────────────────────
  function loadScenes() {
    try {
      const arr = JSON.parse(localStorage.getItem(SCENE_KEY) || '[]');
      return Array.isArray(arr) ? arr.filter(s => s && typeof s === 'object' && s.id) : [];
    } catch (e) { return []; }
  }

  function saveScenes(arr) {
    localStorage.setItem(SCENE_KEY, JSON.stringify(arr));
  }

  function getScene(id) {
    return id ? (loadScenes().find(s => s.id === id) || null) : null;
  }

  /** 自訂場景 → 與內建場所同形狀的物件（startScenario／getParentScenario 都吃這個形狀） */
  function sceneAsScenario(scene) {
    if (!scene) return null;
    return {
      id:    scene.id,
      name:  scene.name || DEFAULT_NAME,
      icon:  scene.icon || CUSTOM_ICON,
      theme: scene.theme || PALETTE[0],
      isCustomScene: true,   // ⚠️ 不是 isCustom——那個旗標的意思是「這是一則自訂情境」
    };
  }

  /** 場景本身沒有東西可練，卡片上的數字是「底下有幾個情境」 */
  function countSituations(sceneId) {
    return loadCustoms().filter(sc => sc && sc.parentId === sceneId).length;
  }

  /** 至少要有一個場景可放情境，回傳它的 id（匯入孤兒、老師沒選場景時都走這支） */
  function ensureDefault() {
    const scenes = loadScenes();
    if (scenes.length) return scenes.some(s => s.id === DEFAULT_ID) ? DEFAULT_ID : scenes[0].id;
    saveScenes([{ id: DEFAULT_ID, name: DEFAULT_NAME, icon: CUSTOM_ICON,
                  theme: pickTheme([], DEFAULT_ID), createdAt: Date.now() }]);
    return DEFAULT_ID;
  }

  /**
   * 舊資料遷移：把「沒有掛場所」的自訂情境收進預設場景（2026-09-16 改版，使用者定案）。
   * ⚠️ 冪等——每次啟動都跑一次，沒有孤兒就什麼都不做；老師自己建的場景不會被動到。
   */
  function migrate() {
    if (!loadCustoms().some(sc => sc && !sc.parentId)) return;
    const sceneId = ensureDefault();
    saveCustoms(loadCustoms().map(sc => (sc && !sc.parentId ? { ...sc, parentId: sceneId, theme: null } : sc)));
  }

  /** 建立場景（名稱必填）→ 回傳新場景；名稱空白回傳 null，由呼叫端顯示訊息 */
  function create(name, icon) {
    const n = String(name || '').trim();
    if (!n) return null;
    const scenes = loadScenes();
    const id = 'cscene_' + Date.now().toString(36);
    const scene = { id, name: n, icon: icon || CUSTOM_ICON, theme: pickTheme(scenes, id), createdAt: Date.now() };
    scenes.push(scene);
    saveScenes(scenes);
    return scene;
  }

  /** 改名／換圖示（顏色不動——學生認得的顏色不要亂變） */
  function rename(id, name, icon) {
    const n = String(name || '').trim();
    if (!n) return false;
    const scenes = loadScenes();
    const i = scenes.findIndex(s => s.id === id);
    if (i < 0) return false;
    scenes[i] = { ...scenes[i], name: n, icon: icon || scenes[i].icon || CUSTOM_ICON };
    saveScenes(scenes);
    return true;
  }

  /**
   * 刪除場景，連同底下的情境（留著會變成點不到的孤兒——⭐ 自訂分部只列場景）。
   * ⚠️ 這裡只動資料，**不問使用者、也不清錄音**：confirm 是 UI 的事、
   *    錄音存在 IndexedDB 只有對話模組碰得到 → 回傳被刪掉的情境讓呼叫端自己收尾。
   */
  function remove(id) {
    const scene = getScene(id);
    if (!scene) return null;
    const kids = loadCustoms().filter(sc => sc && sc.parentId === id);
    saveScenes(loadScenes().filter(s => s.id !== id));
    if (kids.length) saveCustoms(loadCustoms().filter(sc => !(sc && sc.parentId === id)));
    return { scene, removed: kids };
  }

  global.CustomScenes = {
    CUSTOM_KEY, SCENE_KEY, ICON: CUSTOM_ICON, PALETTE, SCENE_ICONS, DEFAULT_ID, DEFAULT_NAME,
    pickTheme, loadCustoms, saveCustoms,
    loadScenes, saveScenes, getScene, sceneAsScenario, countSituations,
    ensureDefault, migrate, create, rename, remove,
  };
})(window);
