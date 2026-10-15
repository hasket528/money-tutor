/* ═══════════════════════════════════════════════════════════════════
   FILE: emoji-library.js - 金錢學習系統統一 Emoji 圖示庫
   VERSION: 1.0.0
   PURPOSE: 集中管理所有單元使用的 emoji 圖示，確保一致性並易於維護
   ═══════════════════════════════════════════════════════════════════ */

const EmojiLibrary = {

    /* ═══════════════════════════════════════════════════════════════════
       🔢 數字與計算相關 Emoji
       使用單元: F6 數的合成與分解, F2-F5 基礎單元
       ═══════════════════════════════════════════════════════════════════ */
    numbers: {
        // 基本形狀與顏色（F6 使用）
        shapes: ['🔴', '🟢', '🔵', '🟡', '🟣', '🟤', '⭐', '❤️', '💎', '🔷'],

        // 數字 emoji
        digits: ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],

        // 運算符號
        operators: ['➕', '➖', '✖️', '➗', '🟰', '💯'],

        // 其他數學符號
        symbols: ['🔢', '#️⃣', '*️⃣']
    },

    /* ═══════════════════════════════════════════════════════════════════
       🍎 食物與飲料 Emoji
       使用單元: F1 物件對應, A1 販賣機, A4 模擬購物
       ═══════════════════════════════════════════════════════════════════ */
    food: {
        // 水果
        fruits: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍑', '🍒', '🥝', '🍈', '🍐', '🥭', '🍍'],

        // 蔬菜
        vegetables: ['🥕', '🥦', '🌽', '🥒', '🍅', '🥬', '🧄', '🧅', '🌶️', '🥔', '🍆'],

        // 速食
        fastFood: ['🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙'],

        // 飲料
        drinks: ['🥤', '🧃', '🧋', '☕', '🍵', '🥛', '🧊'],

        // 甜點
        sweets: ['🍰', '🎂', '🧁', '🍪', '🍩', '🍫', '🍬', '🍭', '🍮', '🍯', '🍦', '🍧'],

        // 亞洲食物
        asian: ['🍜', '🍱', '🍙', '🍚', '🍛', '🍝', '🥟', '🥠', '🥡', '🍢', '🍣', '🥘']
    },

    /* ═══════════════════════════════════════════════════════════════════
       🐾 動物 Emoji
       使用單元: F1 物件對應
       ═══════════════════════════════════════════════════════════════════ */
    animals: {
        // 哺乳動物
        mammals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸'],

        // 鳥類
        birds: ['🐔', '🐧', '🐦', '🐤', '🐣', '🦆', '🦅', '🦉', '🦚', '🦜'],

        // 水生動物
        aquatic: ['🐟', '🐠', '🐡', '🦈', '🐙', '🦑', '🦞', '🦀', '🐚', '🐬', '🐳', '🦭'],

        // 昆蟲
        insects: ['🐛', '🦋', '🐌', '🐞', '🐝', '🦗', '🕷️', '🪲']
    },

    /* ═══════════════════════════════════════════════════════════════════
       💰 金錢相關 Emoji
       使用單元: C1-C6 金錢概念單元, A1-A6 應用單元
       ═══════════════════════════════════════════════════════════════════ */
    money: {
        // 硬幣與紙鈔
        coins: ['🪙', '💰', '💴', '💵', '💶', '💷', '💸'],

        // 金融相關
        finance: ['💳', '🏦', '💹', '📊', '📈', '📉', '💱', '🏧'],

        // 購物相關
        shopping: ['🛒', '🛍️', '💳', '🏪', '🏬', '🧾'],

        // 金額等級提示（用於教學）
        denominations: {
            1: '🪙',    // 1元
            5: '🥉',    // 5元
            10: '🥈',   // 10元
            50: '🏅',   // 50元
            100: '💵',  // 100元
            500: '💴',  // 500元
            1000: '💰' // 1000元
        }
    },

    /* ═══════════════════════════════════════════════════════════════════
       🎨 顏色與形狀 Emoji
       使用單元: F1 物件對應, F6 數的合成與分解
       ═══════════════════════════════════════════════════════════════════ */
    colors: {
        // 圓形
        circles: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪'],

        // 心形（不同顏色）
        hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💗', '💖', '💕'],

        // 星星
        stars: ['⭐', '🌟', '✨', '💫', '🌠'],

        // 幾何形狀
        geometric: ['🔶', '🔷', '🔸', '🔹', '💠', '◆', '◇', '▪️', '▫️']
    },

    /* ═══════════════════════════════════════════════════════════════════
       🏪 商店與服務 Emoji
       使用單元: A2 理髮店, A3 麥當勞, A5 ATM, A6 火車票
       ═══════════════════════════════════════════════════════════════════ */
    services: {
        // 商店類型
        stores: ['🏪', '🏬', '🏢', '🏦', '🏛️', '💈', '🍔', '☕'],

        // 交通
        transport: ['🚗', '🚕', '🚙', '🚌', '🚎', '🚄', '🚅', '🚆', '🚇', '🚂', '✈️', '🚢'],

        // 票券
        tickets: ['🎫', '🎟️', '🧾']
    },

    /* ═══════════════════════════════════════════════════════════════════
       🎮 活動與遊戲 Emoji
       使用單元: 通用裝飾
       ═══════════════════════════════════════════════════════════════════ */
    activities: {
        // 運動
        sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🎯'],

        // 遊戲
        games: ['🎮', '🎲', '🃏', '🧩', '🎰', '🎪', '🎭'],

        // 玩具
        toys: ['🧸', '🚂', '⚽', '🎈', '🎯', '🎪', '🎭', '🪀', '🎨', '🖍️'],

        // 音樂
        music: ['🎵', '🎶', '🎤', '🎧', '🎸', '🎹', '🎺', '🎻', '🥁']
    },

    /* ═══════════════════════════════════════════════════════════════════
       ✅ 狀態與提示 Emoji
       使用單元: 所有單元的反饋提示
       ═══════════════════════════════════════════════════════════════════ */
    status: {
        // 正面反饋
        positive: ['✅', '✓', '👍', '🎉', '🎊', '🥳', '😊', '😃', '💯', '🌟', '⭐'],

        // 負面反饋
        negative: ['❌', '✗', '👎', '😢', '😞', '💔'],

        // 提示與警告
        hints: ['💡', '💭', '❓', '❔', '⚠️', '⚡', '🔔', '📢'],

        // 進度與等待
        progress: ['⏳', '⌛', '🔄', '♻️', '⏱️', '⏰']
    },

    /* ═══════════════════════════════════════════════════════════════════
       🎨 裝飾與特殊 Emoji
       使用單元: 通用裝飾
       ═══════════════════════════════════════════════════════════════════ */
    decorations: {
        // 慶祝
        celebration: ['🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🎆', '🎇', '✨'],

        // 天氣與自然
        nature: ['☀️', '⭐', '🌙', '⛅', '🌈', '🌸', '🌺', '🌻', '🌹', '🌷'],

        // 特效與能量
        effects: ['✨', '💫', '⭐', '🌟', '💎', '🔥', '⚡', '🌈', '💥', '⚡'],

        // 表情
        emojis: ['😊', '😃', '😄', '😁', '🥰', '😍', '🤗', '😎', '🤓', '🧐']
    },

    /* ═══════════════════════════════════════════════════════════════════
       🛠️ 工具函數
       ═══════════════════════════════════════════════════════════════════ */

    /**
     * 從指定分類隨機取得一個 emoji
     * @param {string} category - 分類名稱 (如 'food', 'animals')
     * @param {string} subcategory - 子分類名稱 (如 'fruits', 'mammals')
     * @returns {string} 隨機選擇的 emoji
     */
    getRandom(category, subcategory) {
        const items = this[category]?.[subcategory];
        if (!items || items.length === 0) {
            console.warn(`EmojiLibrary: 找不到分類 ${category}.${subcategory}`);
            return '❓';
        }
        return items[Math.floor(Math.random() * items.length)];
    },

    /**
     * 從指定分類隨機取得多個不重複的 emoji
     * @param {string} category - 分類名稱
     * @param {string} subcategory - 子分類名稱
     * @param {number} count - 要取得的數量
     * @returns {Array<string>} emoji 陣列
     */
    getRandomMultiple(category, subcategory, count) {
        const items = this[category]?.[subcategory];
        if (!items || items.length === 0) {
            console.warn(`EmojiLibrary: 找不到分類 ${category}.${subcategory}`);
            return [];
        }

        // 如果要求的數量超過可用數量，返回所有項目
        if (count >= items.length) {
            return [...items].sort(() => Math.random() - 0.5);
        }

        // 洗牌並取前 N 個
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },

    /**
     * 取得整個子分類的所有 emoji
     * @param {string} category - 分類名稱
     * @param {string} subcategory - 子分類名稱
     * @returns {Array<string>} emoji 陣列
     */
    getAll(category, subcategory) {
        const items = this[category]?.[subcategory];
        if (!items) {
            console.warn(`EmojiLibrary: 找不到分類 ${category}.${subcategory}`);
            return [];
        }
        return [...items]; // 返回副本，避免外部修改
    },

    /**
     * 列出所有可用的分類
     * @returns {Object} 分類列表
     */
    listCategories() {
        const categories = {};
        for (const category in this) {
            if (typeof this[category] === 'object' && !Array.isArray(this[category])) {
                categories[category] = Object.keys(this[category]);
            }
        }
        return categories;
    },

    /**
     * 取得 emoji 庫的統計資訊
     * @returns {Object} 統計資訊
     */
    getStats() {
        let totalEmojis = 0;
        let totalCategories = 0;
        let totalSubcategories = 0;

        for (const category in this) {
            if (typeof this[category] === 'object' && !Array.isArray(this[category])) {
                totalCategories++;
                for (const subcategory in this[category]) {
                    if (Array.isArray(this[category][subcategory])) {
                        totalSubcategories++;
                        totalEmojis += this[category][subcategory].length;
                    }
                }
            }
        }

        return {
            總分類數: totalCategories,
            總子分類數: totalSubcategories,
            '總 Emoji 數': totalEmojis
        };
    }
};

/* ═══════════════════════════════════════════════════════════════════
   使用範例
   ═══════════════════════════════════════════════════════════════════

   // 1. 直接取得整個陣列
   const icons = EmojiLibrary.numbers.shapes;

   // 2. 隨機取得一個
   const randomFruit = EmojiLibrary.getRandom('food', 'fruits');

   // 3. 隨機取得多個
   const animals = EmojiLibrary.getRandomMultiple('animals', 'mammals', 5);

   // 4. 取得所有項目
   const allHearts = EmojiLibrary.getAll('colors', 'hearts');

   // 5. 查看可用分類
   console.log(EmojiLibrary.listCategories());

   // 6. 查看統計資訊
   console.log(EmojiLibrary.getStats());

   ═══════════════════════════════════════════════════════════════════ */

// 開發環境：顯示載入訊息
if (typeof console !== 'undefined') {
    console.log('📚 EmojiLibrary 已載入');
    const stats = EmojiLibrary.getStats();
    console.log(`   包含 ${stats.總分類數} 個分類，${stats.總子分類數} 個子分類，共 ${stats['總 Emoji 數']} 個 emoji`);
}
