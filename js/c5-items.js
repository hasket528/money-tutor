/**
 * c5-items.js — C5 足額付款的商品清單（單元與作業單共用，唯一來源）
 *
 * 2026-09-24 使用者定「學習單跟單元同步」：原本作業單 worksheet/units/c5-worksheet.js 自己抄一份
 * 每類 3～4 種的清單，單元擴充到每類 6～7 種後兩邊就對不上了 → 抽成這一份，兩邊都讀它。
 * 比照 js/a4-shared-products.js 的做法（html/c5_sufficient_payment.html 與 worksheet/index.html 都要引入）。
 *
 * 欄位：id／name／img／emoji／priceRange
 *   img 沒有「/」＝images/c5/<img>.png；有「/」＝images/<img>.png（借用 B5／B6／A4 的圖）→ 一律用 imgPath() 組路徑
 *   priceRange＝這樣東西合理的價格；單元與作業單出題都會再夾在該位數的範圍內
 * DIGIT_TYPES：幾位數的題目用哪幾類（單元的 getAvailableItemTypes 與作業單共用同一個對照）
 */
window.C5Items = window.C5Items || {
    purchaseItems: {
        // 1位數 (1-9元) 物品
        candy: [
            { id: 'candy_lollipop', name: '棒棒糖', img: 'icon-c5-lollipop', emoji: '🍭', priceRange: [2, 8] },
            { id: 'candy_gum', name: '口香糖', img: 'icon-c5-gum', emoji: '🍬', priceRange: [3, 9] },
            { id: 'candy_chocolate', name: '巧克力', img: 'icon-c5-chocolate', emoji: '🍫', priceRange: [4, 9] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'candy_marshmallow', name: '棉花糖', img: 'b5/icon-b5-hw-marshmallow', emoji: '🍡', priceRange: [3, 9] },
            { id: 'candy_jelly', name: '果凍', img: 'b5/icon-b5-hw-jelly', emoji: '🍮', priceRange: [4, 9] }
        ],
        sticker: [
            { id: 'sticker_star', name: '星星貼紙', img: 'icon-c5-star-sticker', emoji: '⭐', priceRange: [1, 6] },
            { id: 'sticker_heart', name: '愛心貼紙', img: 'icon-c5-heart-sticker', emoji: '💖', priceRange: [2, 8] },
            { id: 'sticker_animal', name: '動物貼紙', img: 'icon-c5-animal-sticker', emoji: '🐱', priceRange: [3, 9] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'sticker_set', name: '貼紙組', img: 'b6/icon-b6-sticker-set', emoji: '🏷️', priceRange: [3, 9] },
            { id: 'sticker_postcard', name: '明信片', img: 'b6/icon-b6-postcard', emoji: '📮', priceRange: [3, 9] },
            { id: 'sticker_bookmark', name: '書籤', img: 'b6/icon-b6-bookmark', emoji: '🔖', priceRange: [2, 8] }
        ],
        eraser: [
            { id: 'eraser_elephant', name: '大象造形橡皮擦', img: 'icon-c5-elephant-eraser', emoji: '🐘', priceRange: [2, 7] },
            { id: 'eraser_car', name: '汽車造形橡皮擦', img: 'icon-c5-car-eraser', emoji: '🚗', priceRange: [4, 9] },
            { id: 'eraser_rainbow', name: '彩虹造形橡皮擦', img: 'icon-c5-rainbow-eraser', emoji: '🌈', priceRange: [3, 9] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'eraser_plain', name: '橡皮擦', img: 'a4/icon-a4-eraser-shop', emoji: '🧽', priceRange: [2, 8] },
            { id: 'eraser_pencil', name: '鉛筆', img: 'a4/icon-a4-pencil-shop', emoji: '✏️', priceRange: [3, 9] },
            { id: 'eraser_ruler', name: '尺', img: 'a4/icon-a4-ruler-shop', emoji: '📏', priceRange: [4, 9] }
        ],
        
        // 2位數 (10-99元) 物品
        snack: [
            { id: 'snack_cookie', name: '餅乾', img: 'icon-c5-cookie', emoji: '🍪', priceRange: [15, 85] },
            { id: 'snack_chips', name: '洋芋片', img: 'icon-c5-chips', emoji: '🥔', priceRange: [20, 90] },
            { id: 'snack_crackers', name: '蘇打餅', img: 'icon-c5-crackers', emoji: '🫓', priceRange: [12, 75] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'snack_donut', name: '甜甜圈', img: 'b6/icon-b6-donut', emoji: '🍩', priceRange: [25, 45] },
            { id: 'snack_pudding', name: '布丁', img: 'b6/icon-b6-pudding', emoji: '🍮', priceRange: [15, 35] },
            { id: 'snack_muffin', name: '馬芬蛋糕', img: 'b6/icon-b6-muffin', emoji: '🧁', priceRange: [30, 55] },
            { id: 'snack_rice_ball', name: '飯糰', img: 'a4/icon-a4-rice-ball-shop', emoji: '🍙', priceRange: [25, 45] }
        ],
        pen: [
            { id: 'pen_ballpoint', name: '原子筆', img: 'icon-c5-ballpoint-pen', emoji: '✏️', priceRange: [10, 60] },
            { id: 'pen_whiteboard', name: '白板筆', img: 'icon-c5-whiteboard-marker', emoji: '🖊️', priceRange: [25, 95] },
            { id: 'pen_colored', name: '彩色筆', img: 'icon-c5-colored-pen', emoji: '🎨', priceRange: [30, 85] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'pen_correction_tape', name: '修正帶', img: 'a4/icon-a4-correction-tape-shop', emoji: '📝', priceRange: [20, 60] },
            { id: 'pen_glue', name: '膠水', img: 'a4/icon-a4-glue-shop', emoji: '🧴', priceRange: [15, 40] },
            { id: 'pen_scissors', name: '剪刀', img: 'a4/icon-a4-scissors-shop', emoji: '✂️', priceRange: [30, 80] }
        ],
        notebook: [
            { id: 'drink_cup', name: '杯子', img: 'icon-c5-cup', emoji: '🥤', priceRange: [30, 150] },
            { id: 'notebook_spiral', name: '線圈筆記本', img: 'icon-c5-spiral-notebook', emoji: '🗒️', priceRange: [20, 85] },
            { id: 'notebook_diary', name: '日記本', img: 'icon-c5-diary', emoji: '📔', priceRange: [25, 95] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'notebook_plain', name: '筆記本', img: 'a4/icon-a4-notebook-shop', emoji: '📓', priceRange: [20, 60] },
            { id: 'notebook_folder', name: '資料夾', img: 'a4/icon-a4-folder-shop', emoji: '📁', priceRange: [15, 45] },
            { id: 'notebook_card', name: '卡片', img: 'a4/icon-a4-greeting-card-shop', emoji: '💌', priceRange: [20, 60] }
        ],
        fruit: [
            { id: 'fruit_apple', name: '蘋果', img: 'icon-c5-apple', emoji: '🍎', priceRange: [12, 45] },
            { id: 'fruit_banana', name: '香蕉', img: 'icon-c5-banana', emoji: '🍌', priceRange: [10, 35] },
            { id: 'fruit_orange', name: '橘子', img: 'icon-c5-orange', emoji: '🍊', priceRange: [15, 50] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'fruit_guava', name: '芭樂', img: 'b6/icon-b6-guava', emoji: '🍐', priceRange: [20, 45] },
            { id: 'fruit_mango', name: '芒果', img: 'b6/icon-b6-mango', emoji: '🥭', priceRange: [30, 80] },
            { id: 'fruit_grape', name: '葡萄', img: 'b6/icon-b6-grape', emoji: '🍇', priceRange: [40, 90] },
            { id: 'fruit_peach', name: '水蜜桃', img: 'b6/icon-b6-peach', emoji: '🍑', priceRange: [30, 70] }
        ],
        
        // 3位數 (100-999元) 物品
        toy: [
            { id: 'toy_car', name: '玩具車', img: 'icon-c5-toy-car', emoji: '🚗', priceRange: [120, 850] },
            { id: 'toy_doll', name: '娃娃', img: 'icon-c5-doll', emoji: '🪆', priceRange: [150, 600] },
            { id: 'toy_robot', name: '機器人', img: 'icon-c5-robot', emoji: '🤖', priceRange: [200, 900] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'toy_blocks', name: '積木', img: 'a4/icon-a4-building-blocks-shop', emoji: '🧱', priceRange: [200, 800] },
            { id: 'toy_puzzle', name: '拼圖', img: 'a4/icon-a4-puzzle-shop', emoji: '🧩', priceRange: [150, 500] },
            { id: 'toy_plush', name: '絨毛玩偶', img: 'b6/icon-b6-plush-toy', emoji: '🧸', priceRange: [200, 600] },
            { id: 'toy_yoyo', name: '溜溜球', img: 'a4/icon-a4-yo-yo-shop', emoji: '🪀', priceRange: [100, 300] }
        ],
        book: [
            { id: 'book_story', name: '故事書', img: 'icon-c5-story-book', emoji: '📚', priceRange: [100, 400] },
            { id: 'book_comic', name: '漫畫書', img: 'icon-c5-comic-book', emoji: '📖', priceRange: [150, 500] },
            { id: 'food_pizza', name: '比薩', img: 'icon-c5-pizza', emoji: '🍕', priceRange: [150, 500] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'book_picture', name: '繪本', img: 'a4/icon-a4-picture-book-shop', emoji: '📖', priceRange: [150, 450] },
            { id: 'book_dictionary', name: '字典', img: 'a4/icon-a4-dictionary-shop', emoji: '📕', priceRange: [200, 600] },
            { id: 'book_magazine', name: '雜誌', img: 'a4/icon-a4-magazine-shop', emoji: '📰', priceRange: [100, 300] }
        ],
        lunch: [
            { id: 'lunch_bento', name: '便當', img: 'icon-c5-bento', emoji: '🍱', priceRange: [80, 300] },
            { id: 'lunch_club_sandwich', name: '總匯三明治', img: 'icon-c5-club-sandwich', emoji: '🥪', priceRange: [80, 250] },
            { id: 'lunch_beef_noodle', name: '牛肉麵', img: 'icon-c5-beef-noodle', emoji: '🍜', priceRange: [120, 400] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'lunch_chicken_bento', name: '雞腿便當', img: 'b6/icon-b6-chicken-leg-bento', emoji: '🍱', priceRange: [90, 150] },
            { id: 'lunch_pork_bento', name: '排骨便當', img: 'b6/icon-b6-pork-chop-bento', emoji: '🍱', priceRange: [85, 140] },
            { id: 'lunch_fried_rice', name: '炒飯', img: 'b6/icon-b6-fried-rice', emoji: '🍛', priceRange: [80, 150] }
        ],
        stationery_set: [
            { id: 'stationery_pencil_case', name: '筆盒', img: 'icon-c5-pencil-case', emoji: '📝', priceRange: [120, 500] },
            { id: 'food_nuts', name: '堅果', img: 'icon-c5-nuts', emoji: '🥜', priceRange: [80, 350] },
            { id: 'stationery_calculator', name: '計算機', img: 'icon-c5-calculator', emoji: '🔢', priceRange: [150, 600] }
        ],
        
        // 4位數 (1000-9999元) 物品
        electronics: [
            { id: 'electronics_phone', name: '手機', img: 'icon-c5-phone', emoji: '📱', priceRange: [3000, 9000] },
            { id: 'electronics_tablet', name: '平板', img: 'icon-c5-tablet', emoji: '📲', priceRange: [2500, 8000] },
            { id: 'electronics_headphones', name: '耳機', img: 'icon-c5-headphones', emoji: '🎧', priceRange: [1000, 5000] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'electronics_keyboard', name: '鍵盤', img: 'a4/icon-a4-keyboard-shop', emoji: '⌨️', priceRange: [1000, 3000] },
            { id: 'electronics_ereader', name: '電子書閱讀器', img: 'a4/icon-a4-ereader-shop', emoji: '📱', priceRange: [2500, 6000] },
            { id: 'electronics_dashcam', name: '行車記錄器', img: 'a4/icon-a4-dashcam-shop', emoji: '📷', priceRange: [1500, 5000] }
        ],
        clothing: [
            { id: 'clothing_shirt', name: '上衣', img: 'icon-c5-shirt', emoji: '👕', priceRange: [1000, 3000] },
            { id: 'clothing_pants', name: '褲子', img: 'icon-c5-pants', emoji: '👖', priceRange: [1000, 4000] },
            { id: 'clothing_jacket', name: '外套', img: 'icon-c5-jacket', emoji: '🧥', priceRange: [1500, 6000] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'clothing_jeans', name: '牛仔褲', img: 'a4/icon-a4-jeans-shop', emoji: '👖', priceRange: [1000, 3000] },
            { id: 'clothing_sneakers', name: '運動鞋', img: 'a4/icon-a4-sneakers-shop', emoji: '👟', priceRange: [1500, 4000] },
            { id: 'clothing_scarf', name: '圍巾', img: 'a4/icon-a4-scarf-shop', emoji: '🧣', priceRange: [1000, 2500] }
        ],
        sports: [
            { id: 'sports_skateboard', name: '滑板', img: 'icon-c5-skateboard', emoji: '🛹', priceRange: [2000, 8000] },
            { id: 'sports_speaker', name: '藍芽喇叭', img: 'icon-c5-bluetooth-speaker', emoji: '🔊', priceRange: [1000, 5000] },
            { id: 'sports_basketball_shoes', name: '籃球鞋', img: 'icon-c5-basketball-shoes', emoji: '👟', priceRange: [2000, 8000] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'sports_yoga_mat', name: '瑜珈墊', img: 'a4/icon-a4-yoga-mat-shop', emoji: '🧘', priceRange: [1000, 2500] },
            { id: 'sports_dumbbell', name: '啞鈴', img: 'a4/icon-a4-dumbbell-shop', emoji: '🏋️', priceRange: [1000, 3000] },
            { id: 'sports_running_shoes', name: '慢跑鞋', img: 'a4/icon-a4-running-shoes-shop', emoji: '👟', priceRange: [2000, 5000] }
        ],
        game: [
            { id: 'sports_bicycle', name: '腳踏車', img: 'icon-c5-bicycle', emoji: '🚲', priceRange: [3000, 12000] },
            { id: 'game_rc_car', name: '搖控汽車', img: 'icon-c5-rc-car', emoji: '🚗', priceRange: [1000, 3000] },
            { id: 'tech_smartwatch', name: '智慧手錶', img: 'icon-c5-smartwatch', emoji: '⌚', priceRange: [3000, 12000] },
            // 2026-09-24 借用 B5／B6／A4 現成商品圖擴充（img 含資料夾＝images/ 底下的相對路徑）
            { id: 'game_handheld', name: '掌上遊戲機', img: 'a4/icon-a4-handheld-console-shop', emoji: '🎮', priceRange: [3000, 9000] }
        ],

        // 自訂金額物品
        custom_item: [
            { id: 'custom_gift', name: '神秘禮物', img: 'icon-c5-mystery-gift', emoji: '🎁', priceRange: [1, 9999] },
            { id: 'custom_treasure', name: '寶物', img: 'icon-c5-treasure', emoji: '💎', priceRange: [1, 9999] },
            { id: 'custom_magic', name: '魔法物品', img: 'icon-c5-magic-item', emoji: '✨', priceRange: [1, 9999] }
        ]
    },

    DIGIT_TYPES: {
        1: ['candy', 'sticker', 'eraser'],
        2: ['snack', 'pen', 'notebook', 'fruit'],
        3: ['toy', 'book', 'lunch', 'stationery_set'],
        4: ['electronics', 'clothing', 'sports', 'game']
    },

    /** 圖檔路徑（base＝從呼叫頁到 images/ 的相對路徑，預設 ../images/） */
    imgPath(item, base = '../images/') {
        if (!item || !item.img) return null;
        return item.img.includes('/') ? `${base}${item.img}.png` : `${base}c5/${item.img}.png`;
    }
};
