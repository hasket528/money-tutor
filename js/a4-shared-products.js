/**
 * A4 超市購物 - 共用商品資料
 *
 * 此檔案為遊戲端 (a4_simulated_shopping.js) 和作業單端 (a4-worksheet.js) 的共用資料來源
 * 修改此檔案會同時影響兩邊的商品資料
 *
 * 欄位說明：
 * - id: 商品唯一識別碼（遊戲端使用）
 * - name: 商品名稱
 * - price: 基本價格（作業單端使用）
 * - price_min/price_max: 動態價格範圍（遊戲端使用）
 * - category: 商品分類（遊戲端使用）
 * - emoji: 表情符號
 * - icon: 圖示檔名（遊戲端使用，位於 images/a4/）
 * - description: 商品描述/單位（遊戲端使用）
 */

const A4_SHARED_PRODUCTS = {
    // 便利商店
    convenience: [
        { id: 1, name: '蘋果', price: 25, price_min: 20, price_max: 40, category: 'food', emoji: '🍎', icon: 'icon-a4-apple-shop.png', description: '蘋果/顆' },
        { id: 2, name: '餅乾', price: 35, price_min: 25, price_max: 55, category: 'food', emoji: '🍪', icon: 'icon-a4-cookies-shop.png', description: '餅乾/包' },
        { id: 3, name: '飲料', price: 30, price_min: 25, price_max: 50, category: 'food', emoji: '🥤', icon: 'icon-a4-drink-shop.png', description: '飲料/瓶' },
        { id: 4, name: '洋芋片', price: 35, price_min: 30, price_max: 55, category: 'food', emoji: '🍟', icon: 'icon-a4-potato-chips-shop.png', description: '洋芋片/包' },
        { id: 5, name: '麵包', price: 30, price_min: 25, price_max: 50, category: 'food', emoji: '🍞', icon: 'icon-a4-bread-shop.png', description: '麵包/個' },
        { id: 101, name: '泡麵', price: 50, price_min: 40, price_max: 75, category: 'food', emoji: '🍜', icon: 'icon-a4-instant-noodles-shop.png', description: '泡麵/碗' },
        { id: 102, name: '口香糖', price: 40, price_min: 35, price_max: 60, category: 'food', emoji: '🍬', icon: 'icon-a4-chewing-gum-shop.png', description: '口香糖/包' },
        { id: 103, name: '咖啡', price: 65, price_min: 50, price_max: 90, category: 'food', emoji: '☕', icon: 'icon-a4-coffee-shop.png', description: '咖啡/杯' },
        { id: 104, name: '巧克力', price: 45, price_min: 35, price_max: 70, category: 'food', emoji: '🍫', icon: 'icon-a4-chocolate-shop.png', description: '巧克力/包' },
        { id: 105, name: '衛生紙', price: 20, price_min: 15, price_max: 35, category: 'daily', emoji: '🧻', icon: 'icon-a4-tissue-paper-shop.png', description: '衛生紙/包' }
    ],

    // 菜市場
    market: [
        { id: 6, name: '香蕉', price: 50, price_min: 40, price_max: 80, category: 'food', emoji: '🍌', icon: 'icon-a4-banana-shop.png', description: '香蕉/串' },
        { id: 7, name: '胡蘿蔔', price: 70, price_min: 50, price_max: 110, category: 'food', emoji: '🥕', icon: 'icon-a4-carrot-shop.png', description: '胡蘿蔔/6根' },
        { id: 8, name: '蔥', price: 30, price_min: 20, price_max: 50, category: 'food', emoji: '🧅', icon: 'icon-a4-green-onion-shop.png', description: '蔥/把' },
        { id: 9, name: '蛋', price: 75, price_min: 55, price_max: 110, category: 'food', emoji: '🥚', icon: 'icon-a4-egg-shop.png', description: '蛋/盒' },
        { id: 10, name: '魚', price: 120, price_min: 80, price_max: 200, category: 'food', emoji: '🐟', icon: 'icon-a4-fish-shop.png', description: '魚/份' },
        { id: 106, name: '蘋果', price: 25, price_min: 20, price_max: 40, category: 'food', emoji: '🍎', icon: 'icon-a4-apple-shop.png', description: '蘋果/顆' },
        { id: 107, name: '白菜', price: 60, price_min: 40, price_max: 100, category: 'food', emoji: '🥬', icon: 'icon-a4-cabbage-shop.png', description: '白菜/顆' },
        { id: 108, name: '蕃茄', price: 60, price_min: 40, price_max: 100, category: 'food', emoji: '🍅', icon: 'icon-a4-tomato-shop.png', description: '蕃茄/2顆' },
        { id: 109, name: '豬肉', price: 110, price_min: 70, price_max: 180, category: 'food', emoji: '🥩', icon: 'icon-a4-pork-shop.png', description: '豬肉/份' },
        { id: 110, name: '雞肉', price: 100, price_min: 65, price_max: 160, category: 'food', emoji: '🍗', icon: 'icon-a4-chicken-shop.png', description: '雞肉/份' }
    ],

    // 早餐店
    breakfast: [
        { id: 11, name: '三明治', price: 35, price_min: 30, price_max: 55, category: 'food', emoji: '🥪', icon: 'icon-a4-sandwich-shop.png', description: '三明治/個' },
        { id: 12, name: '豆漿', price: 20, price_min: 15, price_max: 35, category: 'food', emoji: '🥛', icon: 'icon-a4-soy-milk-shop.png', description: '豆漿/杯' },
        { id: 13, name: '蛋餅', price: 35, price_min: 30, price_max: 55, category: 'food', emoji: '🥞', icon: 'icon-a4-egg-pancake-shop.png', description: '蛋餅/份' },
        { id: 14, name: '吐司', price: 20, price_min: 15, price_max: 35, category: 'food', emoji: '🍞', icon: 'icon-a4-toast-shop.png', description: '吐司/片' },
        { id: 15, name: '紅茶', price: 20, price_min: 15, price_max: 35, category: 'food', emoji: '🧋', icon: 'icon-a4-black-tea-shop.png', description: '紅茶/杯' },
        { id: 111, name: '漢堡', price: 60, price_min: 45, price_max: 90, category: 'food', emoji: '🍔', icon: 'icon-a4-hamburger-shop.png', description: '漢堡/個' },
        { id: 112, name: '奶茶', price: 30, price_min: 25, price_max: 50, category: 'food', emoji: '🥤', icon: 'icon-a4-milk-tea-shop.png', description: '奶茶/杯' },
        { id: 113, name: '蘿蔔糕', price: 35, price_min: 25, price_max: 55, category: 'food', emoji: '🥘', icon: 'icon-a4-radish-cake-shop.png', description: '蘿蔔糕/份' },
        { id: 114, name: '飯糰', price: 45, price_min: 35, price_max: 65, category: 'food', emoji: '🍙', icon: 'icon-a4-rice-ball-shop.png', description: '飯糰/個' },
        { id: 115, name: '柳橙汁', price: 35, price_min: 25, price_max: 55, category: 'food', emoji: '🧃', icon: 'icon-a4-juice-shop.png', description: '柳橙汁/杯' }
    ],

    // 美式速食店
    mcdonalds: [
        { id: 16, name: '漢堡', price: 80, price_min: 80, price_max: 120, category: 'food', emoji: '🍔', icon: 'icon-a4-hamburger-shop.png', description: '漢堡/個' },
        { id: 17, name: '薯條', price: 40, price_min: 40, price_max: 60, category: 'food', emoji: '🍟', icon: 'icon-a4-french-fries-shop.png', description: '薯條/份' },
        { id: 18, name: '可樂', price: 30, price_min: 30, price_max: 45, category: 'food', emoji: '🥤', icon: 'icon-a4-cola-shop.png', description: '可樂/杯' },
        { id: 19, name: '雞塊', price: 60, price_min: 60, price_max: 100, category: 'food', emoji: '🍗', icon: 'icon-a4-chicken-nuggets-shop.png', description: '雞塊/份' },
        { id: 20, name: '蘋果派', price: 30, price_min: 30, price_max: 45, category: 'food', emoji: '🥧', icon: 'icon-a4-apple-pie-shop.png', description: '蘋果派/個' },
        { id: 116, name: '冰淇淋', price: 15, price_min: 15, price_max: 30, category: 'food', emoji: '🍦', icon: 'icon-a4-ice-cream-shop.png', description: '冰淇淋/支' },
        { id: 117, name: '炸雞翅', price: 45, price_min: 45, price_max: 70, category: 'food', emoji: '🍗', icon: 'icon-a4-fried-chicken-wings-shop.png', description: '炸雞翅/份' },
        { id: 118, name: '蔬菜沙拉', price: 40, price_min: 40, price_max: 65, category: 'food', emoji: '🥗', icon: 'icon-a4-vegetable-salad-shop.png', description: '蔬菜沙拉/盒' },
        { id: 120, name: '巧克力聖代', price: 35, price_min: 35, price_max: 55, category: 'food', emoji: '🍨', icon: 'icon-a4-chocolate-sundae-shop.png', description: '巧克力聖代/杯' }
    ],

    // 超級市場
    pxmart: [
        { id: 21, name: '洗髮精', price: 150, price_min: 150, price_max: 250, category: 'daily', emoji: '🧴', icon: 'icon-a4-shampoo-shop.png', description: '洗髮精/瓶' },
        { id: 22, name: '牙膏', price: 60, price_min: 60, price_max: 120, category: 'daily', emoji: '🦷', icon: 'icon-a4-toothpaste-shop.png', description: '牙膏/條' },
        { id: 23, name: '衛生紙', price: 120, price_min: 120, price_max: 200, category: 'daily', emoji: '🧻', icon: 'icon-a4-box-of-tissues-shop.png', description: '衛生紙/袋' },
        { id: 24, name: '洗衣粉', price: 100, price_min: 100, price_max: 180, category: 'daily', emoji: '🧽', icon: 'icon-a4-laundry-detergent-shop.png', description: '洗衣粉/包' },
        { id: 25, name: '餅乾', price: 80, price_min: 80, price_max: 150, category: 'food', emoji: '🍪', icon: 'icon-a4-family-pack-cookies-shop.png', description: '餅乾/大包' },
        { id: 121, name: '牛奶', price: 80, price_min: 80, price_max: 95, category: 'food', emoji: '🥛', icon: 'icon-a4-milk-shop.png', description: '牛奶/瓶' },
        { id: 122, name: '土司', price: 45, price_min: 45, price_max: 70, category: 'food', emoji: '🍞', icon: 'icon-a4-loaf-of-toast-shop.png', description: '土司/袋' },
        { id: 123, name: '沐浴乳', price: 150, price_min: 150, price_max: 250, category: 'daily', emoji: '🧴', icon: 'icon-a4-body-wash-shop.png', description: '沐浴乳/瓶' },
        { id: 124, name: '洗碗精', price: 80, price_min: 80, price_max: 120, category: 'daily', emoji: '🧽', icon: 'icon-a4-dish-soap-shop.png', description: '洗碗精/瓶' },
        { id: 125, name: '泡麵', price: 100, price_min: 100, price_max: 200, category: 'food', emoji: '🍜', icon: 'icon-a4-case-of-instant-noodles-shop.png', description: '泡麵/箱' }
    ],

    // 服飾店
    clothing: [
        { id: 126, name: 'T恤', price: 290, price_min: 290, price_max: 590, category: 'clothing', emoji: '👕', icon: 'icon-a4-t-shirt-shop.png', description: 'T恤/件' },
        { id: 127, name: '牛仔褲', price: 590, price_min: 590, price_max: 1200, category: 'clothing', emoji: '👖', icon: 'icon-a4-jeans-shop.png', description: '牛仔褲/條' },
        { id: 128, name: '運動鞋', price: 800, price_min: 800, price_max: 2500, category: 'clothing', emoji: '👟', icon: 'icon-a4-sneakers-shop.png', description: '運動鞋/雙' },
        { id: 129, name: '帽子', price: 200, price_min: 200, price_max: 500, category: 'clothing', emoji: '🧢', icon: 'icon-a4-hat-shop.png', description: '帽子/頂' },
        { id: 130, name: '襪子', price: 50, price_min: 50, price_max: 150, category: 'clothing', emoji: '🧦', icon: 'icon-a4-socks-shop.png', description: '襪子/雙' },
        { id: 131, name: '外套', price: 800, price_min: 800, price_max: 2000, category: 'clothing', emoji: '🧥', icon: 'icon-a4-jacket-shop.png', description: '外套/件' },
        { id: 132, name: '裙子', price: 390, price_min: 390, price_max: 890, category: 'clothing', emoji: '👗', icon: 'icon-a4-skirt-shop.png', description: '裙子/條' },
        { id: 133, name: '圍巾', price: 200, price_min: 200, price_max: 500, category: 'clothing', emoji: '🧣', icon: 'icon-a4-scarf-shop.png', description: '圍巾/條' },
        { id: 134, name: '手套', price: 150, price_min: 150, price_max: 300, category: 'clothing', emoji: '🧤', icon: 'icon-a4-gloves-shop.png', description: '手套/雙' },
        { id: 135, name: '內褲', price: 100, price_min: 100, price_max: 300, category: 'clothing', emoji: '👙', icon: 'icon-a4-underpants-shop.png', description: '內褲/件' }
    ],

    // 3C用品店
    electronics: [
        { id: 136, name: '耳機', price: 2000, price_min: 1000, price_max: 3000, category: 'electronics', emoji: '🎧', icon: 'icon-a4-headphones-shop.png', description: '耳機/副' },
        { id: 137, name: '手機', price: 5000, price_min: 2000, price_max: 9000, category: 'electronics', emoji: '📱', icon: 'icon-a4-smartphone-shop.png', description: '手機/支' },
        { id: 138, name: '平板電腦', price: 5000, price_min: 2500, price_max: 9000, category: 'electronics', emoji: '🖥️', icon: 'icon-a4-tablet-shop.png', description: '平板電腦/台' },
        { id: 139, name: '智慧手錶', price: 3000, price_min: 1500, price_max: 6500, category: 'electronics', emoji: '⌚', icon: 'icon-a4-smartwatch-shop.png', description: '智慧手錶/支' },
        { id: 140, name: '電動牙刷', price: 1500, price_min: 800, price_max: 4000, category: 'electronics', emoji: '🪥', icon: 'icon-a4-electric-toothbrush-shop.png', description: '電動牙刷/支' },
        { id: 141, name: '無線藍牙喇叭', price: 2500, price_min: 1500, price_max: 6000, category: 'electronics', emoji: '🔊', icon: 'icon-a4-bluetooth-speaker-shop.png', description: '無線藍牙喇叭/個' },
        { id: 142, name: '掌上遊戲機', price: 7000, price_min: 3000, price_max: 9500, category: 'electronics', emoji: '🎮', icon: 'icon-a4-handheld-console-shop.png', description: '掌上遊戲機/台' },
        { id: 143, name: '網路攝影機', price: 1500, price_min: 800, price_max: 3500, category: 'electronics', emoji: '📷', icon: 'icon-a4-webcam-shop.png', description: '網路攝影機/個' },
        { id: 144, name: '電子書閱讀器', price: 3000, price_min: 1500, price_max: 5500, category: 'electronics', emoji: '📚', icon: 'icon-a4-ereader-shop.png', description: '電子書閱讀器/台' },
        { id: 145, name: '電動刮鬍刀', price: 2000, price_min: 800, price_max: 5000, category: 'electronics', emoji: '🪒', icon: 'icon-a4-electric-shaver-shop.png', description: '電動刮鬍刀/支' },
        { id: 200, name: '行車紀錄器', price: 2500, price_min: 1000, price_max: 6000, category: 'electronics', emoji: '📹', icon: 'icon-a4-dashcam-shop.png', description: '行車紀錄器/個' }
    ],

    // 書局
    bookstore: [
        { id: 146, name: '小說', price: 250, price_min: 180, price_max: 450, category: 'books', emoji: '📚', icon: 'icon-a4-novel-shop.png', description: '小說/本' },
        { id: 147, name: '字典', price: 380, price_min: 280, price_max: 500, category: 'books', emoji: '📖', icon: 'icon-a4-dictionary-shop.png', description: '字典/本' },
        { id: 148, name: '漫畫', price: 100, price_min: 60, price_max: 150, category: 'books', emoji: '📘', icon: 'icon-a4-comic-book-shop.png', description: '漫畫/本' },
        { id: 149, name: '雜誌', price: 120, price_min: 80, price_max: 220, category: 'books', emoji: '📰', icon: 'icon-a4-magazine-shop.png', description: '雜誌/本' },
        { id: 150, name: '食譜', price: 280, price_min: 180, price_max: 480, category: 'books', emoji: '🥘', icon: 'icon-a4-cookbook-shop.png', description: '食譜/本' },
        { id: 151, name: '繪本', price: 200, price_min: 120, price_max: 380, category: 'books', emoji: '🖼️', icon: 'icon-a4-picture-book-shop.png', description: '繪本/本' },
        { id: 152, name: '旅遊書', price: 320, price_min: 200, price_max: 500, category: 'books', emoji: '✈️', icon: 'icon-a4-travel-guide-shop.png', description: '旅遊書/本' },
        { id: 153, name: '參考書', price: 200, price_min: 120, price_max: 480, category: 'books', emoji: '📕', icon: 'icon-a4-reference-book-shop.png', description: '參考書/本' },
        { id: 154, name: '書籤', price: 20, price_min: 15, price_max: 50, category: 'books', emoji: '🔖', icon: 'icon-a4-bookmark-shop.png', description: '書籤/張' },
        { id: 155, name: '賀卡', price: 50, price_min: 30, price_max: 100, category: 'books', emoji: '💌', icon: 'icon-a4-greeting-card-shop.png', description: '賀卡/張' }
    ],

    // 玩具店
    toystore: [
        { id: 156, name: '玩具車', price: 150, price_min: 80, price_max: 350, category: 'toys', emoji: '🚗', icon: 'icon-a4-toy-car-shop.png', description: '玩具車/台' },
        { id: 157, name: '娃娃', price: 250, price_min: 120, price_max: 480, category: 'toys', emoji: '🧸', icon: 'icon-a4-doll-shop.png', description: '娃娃/個' },
        { id: 158, name: '積木', price: 300, price_min: 150, price_max: 500, category: 'toys', emoji: '🧱', icon: 'icon-a4-building-blocks-shop.png', description: '積木/盒' },
        { id: 159, name: '拼圖', price: 180, price_min: 80, price_max: 380, category: 'toys', emoji: '🧩', icon: 'icon-a4-puzzle-shop.png', description: '拼圖/盒' },
        { id: 160, name: '球', price: 80, price_min: 50, price_max: 200, category: 'toys', emoji: '⚽', icon: 'icon-a4-ball-shop.png', description: '球/顆' },
        { id: 161, name: '飛機', price: 180, price_min: 80, price_max: 380, category: 'toys', emoji: '✈️', icon: 'icon-a4-toy-plane-shop.png', description: '飛機/台' },
        { id: 162, name: '機器人', price: 350, price_min: 180, price_max: 500, category: 'toys', emoji: '🤖', icon: 'icon-a4-robot-shop.png', description: '機器人/個' },
        { id: 163, name: '玩具槍', price: 120, price_min: 60, price_max: 280, category: 'toys', emoji: '🔫', icon: 'icon-a4-toy-gun-shop.png', description: '玩具槍/把' },
        { id: 164, name: '彈珠', price: 50, price_min: 30, price_max: 90, category: 'toys', emoji: '🔮', icon: 'icon-a4-marbles-shop.png', description: '彈珠/袋' },
        { id: 165, name: '溜溜球', price: 80, price_min: 50, price_max: 150, category: 'toys', emoji: '🪀', icon: 'icon-a4-yo-yo-shop.png', description: '溜溜球/個' }
    ],

    // 文具店
    stationery: [
        { id: 166, name: '鉛筆', price: 10, price_min: 10, price_max: 20, category: 'stationery', emoji: '✏️', icon: 'icon-a4-pencil-shop.png', description: '鉛筆/支' },
        { id: 167, name: '原子筆', price: 15, price_min: 15, price_max: 35, category: 'stationery', emoji: '🖊️', icon: 'icon-a4-ballpoint-pen-shop.png', description: '原子筆/支' },
        { id: 168, name: '橡皮擦', price: 10, price_min: 10, price_max: 30, category: 'stationery', emoji: '🧽', icon: 'icon-a4-eraser-shop.png', description: '橡皮擦/個' },
        { id: 169, name: '尺', price: 15, price_min: 15, price_max: 40, category: 'stationery', emoji: '📏', icon: 'icon-a4-ruler-shop.png', description: '尺/把' },
        { id: 170, name: '筆記本', price: 30, price_min: 30, price_max: 60, category: 'stationery', emoji: '📓', icon: 'icon-a4-notebook-shop.png', description: '筆記本/本' },
        { id: 171, name: '膠水', price: 20, price_min: 20, price_max: 40, category: 'stationery', emoji: '🧴', icon: 'icon-a4-glue-shop.png', description: '膠水/瓶' },
        { id: 172, name: '剪刀', price: 40, price_min: 40, price_max: 80, category: 'stationery', emoji: '✂️', icon: 'icon-a4-scissors-shop.png', description: '剪刀/把' },
        { id: 173, name: '彩色筆', price: 90, price_min: 60, price_max: 150, category: 'stationery', emoji: '🖍️', icon: 'icon-a4-colored-pens-shop.png', description: '彩色筆/盒' },
        { id: 174, name: '計算機', price: 150, price_min: 100, price_max: 280, category: 'stationery', emoji: '🧮', icon: 'icon-a4-calculator-shop.png', description: '計算機/台' },
        { id: 175, name: '資料夾', price: 20, price_min: 20, price_max: 50, category: 'stationery', emoji: '📁', icon: 'icon-a4-folder-shop.png', description: '資料夾/個' }
    ],

    // 美妝店
    cosmetics: [
        { id: 176, name: '口紅', price: 250, price_min: 150, price_max: 450, category: 'cosmetics', emoji: '💄', icon: 'icon-a4-lipstick-shop.png', description: '口紅/支' },
        { id: 177, name: '粉底液', price: 350, price_min: 200, price_max: 500, category: 'cosmetics', emoji: '🧴', icon: 'icon-a4-foundation-shop.png', description: '粉底液/瓶' },
        { id: 178, name: '睫毛膏', price: 200, price_min: 100, price_max: 400, category: 'cosmetics', emoji: '👁️', icon: 'icon-a4-mascara-shop.png', description: '睫毛膏/支' },
        { id: 179, name: '眼影', price: 300, price_min: 150, price_max: 500, category: 'cosmetics', emoji: '🎨', icon: 'icon-a4-eyeshadow-shop.png', description: '眼影/盒' },
        { id: 180, name: '面膜', price: 150, price_min: 80, price_max: 280, category: 'cosmetics', emoji: '😷', icon: 'icon-a4-face-mask-shop.png', description: '面膜/包' },
        { id: 181, name: '洗面乳', price: 100, price_min: 60, price_max: 200, category: 'cosmetics', emoji: '🧴', icon: 'icon-a4-facial-cleanser-shop.png', description: '洗面乳/條' },
        { id: 182, name: '乳液', price: 200, price_min: 100, price_max: 450, category: 'cosmetics', emoji: '🧴', icon: 'icon-a4-lotion-shop.png', description: '乳液/瓶' },
        { id: 183, name: '香水', price: 400, price_min: 200, price_max: 500, category: 'cosmetics', emoji: '🌸', icon: 'icon-a4-perfume-shop.png', description: '香水/瓶' },
        { id: 184, name: '指甲油', price: 100, price_min: 60, price_max: 250, category: 'cosmetics', emoji: '💅', icon: 'icon-a4-nail-polish-shop.png', description: '指甲油/瓶' },
        { id: 185, name: '化妝棉', price: 40, price_min: 30, price_max: 80, category: 'cosmetics', emoji: '🤍', icon: 'icon-a4-cotton-pads-shop.png', description: '化妝棉/盒' }
    ],

    // 運動用品店
    sports: [
        { id: 186, name: '籃球', price: 400, price_min: 400, price_max: 1000, category: 'sports', emoji: '🏀', icon: 'icon-a4-basketball-shop.png', description: '籃球/顆' },
        { id: 187, name: '足球', price: 400, price_min: 400, price_max: 1000, category: 'sports', emoji: '⚽', icon: 'icon-a4-soccer-ball-shop.png', description: '足球/顆' },
        { id: 188, name: '羽毛球拍', price: 600, price_min: 600, price_max: 2000, category: 'sports', emoji: '🏸', icon: 'icon-a4-badminton-racket-shop.png', description: '羽毛球拍/支' },
        { id: 189, name: '網球', price: 50, price_min: 50, price_max: 150, category: 'sports', emoji: '🎾', icon: 'icon-a4-tennis-ball-shop.png', description: '網球/顆' },
        { id: 190, name: '泳鏡', price: 200, price_min: 200, price_max: 600, category: 'sports', emoji: '🥽', icon: 'icon-a4-swimming-goggles-shop.png', description: '泳鏡/副' },
        { id: 191, name: '慢步鞋', price: 1200, price_min: 1200, price_max: 3000, category: 'sports', emoji: '👟', icon: 'icon-a4-running-shoes-shop.png', description: '慢步鞋/雙' },
        { id: 192, name: '瑜珈墊', price: 300, price_min: 300, price_max: 800, category: 'sports', emoji: '🧘', icon: 'icon-a4-yoga-mat-shop.png', description: '瑜珈墊/個' },
        { id: 193, name: '啞鈴', price: 200, price_min: 200, price_max: 600, category: 'sports', emoji: '🏋️', icon: 'icon-a4-dumbbell-shop.png', description: '啞鈴/個' },
        { id: 194, name: '護膝', price: 250, price_min: 250, price_max: 500, category: 'sports', emoji: '🦵', icon: 'icon-a4-knee-pad-shop.png', description: '護膝/個' },
        { id: 195, name: '水壺', price: 150, price_min: 150, price_max: 500, category: 'sports', emoji: '🥤', icon: 'icon-a4-water-bottle-shop.png', description: '水壺/個' }
    ]
};

// 為不同環境提供導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = A4_SHARED_PRODUCTS;
}
