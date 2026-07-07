// =============================================================
// FILE: js/b1_daily_budget.js — B1 今天帶多少錢
// 建立日期：2026-03-14
// =============================================================
'use strict';

// ── 場景資料庫（含 category 欄位供類別篩選）──────────────────────
// 類別：school（學校）| food（飲食）| outdoor（戶外）| entertainment（娛樂）| shopping（購物）
// 每個 item 以 min/max 定義價格區間，由 _generateQuestions 隨機取值（5元倍數）
const B1_SCENARIOS = {
    easy: [
        { icon:'🏫', label:'去學校',    cat:'school',        imageFile:'icon-b1-easy-go-to-school.png',              items:[{ name:'午餐費',   min:40,  max:65  }, { name:'公車票',  min:15, max:30 }] },
        { icon:'🏪', label:'去超商',    cat:'shopping',      imageFile:'icon-b1-easy-go-to-convenience-store.png',   items:[{ name:'飲料費',   min:25,  max:40  }, { name:'零食費',  min:15, max:30 }] },
        { icon:'📚', label:'圖書館',    cat:'school',        imageFile:'icon-b1-easy-library.png',                   items:[{ name:'影印費',   min:5,   max:20  }, { name:'文具費',  min:5,  max:15 }] },
        { icon:'🎭', label:'看表演',    cat:'entertainment', imageFile:'icon-b1-easy-watch-performance.png',         items:[{ name:'表演票',   min:80,  max:150 }, { name:'零食費',  min:15, max:25 }] },
        { icon:'🏊', label:'游泳課',    cat:'outdoor',       imageFile:'icon-b1-easy-swimming-class.png',            items:[{ name:'入場費',   min:60,  max:100 }, { name:'飲料費',  min:10, max:20 }] },
        { icon:'🎨', label:'美術課',    cat:'school',        imageFile:'icon-b1-easy-art-class.png',                 items:[{ name:'材料費',   min:25,  max:50  }, { name:'鉛筆費',  min:10, max:20 }] },
        { icon:'🚌', label:'搭公車',    cat:'school',        imageFile:'icon-b1-easy-take-bus.png',                  items:[{ name:'公車票',   min:15,  max:30  }, { name:'飲料費',  min:10, max:20 }] },
        { icon:'🌿', label:'逛公園',    cat:'outdoor',       imageFile:'icon-b1-easy-visit-park.png',                items:[{ name:'停車費',   min:15,  max:30  }, { name:'飲料費',  min:10, max:20 }] },
        { icon:'☕', label:'買早餐',    cat:'food',          imageFile:'icon-b1-easy-buy-breakfast.png',             items:[{ name:'早餐費',   min:25,  max:55  }, { name:'飲料費',  min:10, max:20 }] },
        { icon:'🎬', label:'看電影',    cat:'entertainment', imageFile:'icon-b1-easy-watch-movie.png',               items:[{ name:'電影票',   min:100, max:160 }, { name:'爆米花',  min:25, max:45 }] },
        { icon:'🍜', label:'吃點心',    cat:'food',          imageFile:'icon-b1-easy-buy-snack.png',                 items:[{ name:'點心費',   min:30,  max:60  }, { name:'飲料費',  min:10, max:20 }] },
        { icon:'🛒', label:'買文具',    cat:'shopping',      imageFile:'icon-b1-easy-buy-stationery.png',            items:[{ name:'文具費',   min:40,  max:75  }, { name:'橡皮擦',  min:5,  max:10 }] },
        { icon:'⛺', label:'踏青',      cat:'outdoor',       imageFile:'icon-b1-easy-outing.png',                    items:[{ name:'門票費',   min:50,  max:80  }, { name:'飲料費',  min:10, max:20 }] },
        { icon:'🍦', label:'買冰淇淋',  cat:'food',          imageFile:'icon-b1-hard-eat-ice-cream.png',             items:[{ name:'冰淇淋費', min:20,  max:50  }, { name:'飲料費',  min:10, max:20 }] },
        { icon:'🎮', label:'電玩體驗',  cat:'entertainment', imageFile:'icon-b1-easy-arcade-game.png',               items:[{ name:'遊戲費',   min:30,  max:60  }, { name:'零食費',  min:10, max:20 }] },
        { icon:'🌸', label:'賞花展',    cat:'outdoor',       imageFile:'icon-b1-easy-flower-show.png',               items:[{ name:'門票費',   min:50,  max:100 }, { name:'零食費',  min:10, max:20 }] },
        // ── 國高中生常見場景 ──
        { icon:'🧋', label:'買手搖飲',  cat:'food',          imageFile:'icon-b1-easy-buy-bubble-tea.png',            items:[{ name:'飲料費',   min:40,  max:70  }, { name:'零食費',  min:15, max:30 }] }, // TODO: 圖片待新增（目前 onerror 自動顯示 🧋 emoji）
        { icon:'📓', label:'買筆記本',  cat:'shopping',      imageFile:'icon-b1-easy-buy-stationery.png',            items:[{ name:'筆記本費', min:25,  max:45  }, { name:'鉛筆費',  min:10, max:20 }] },
        { icon:'🍳', label:'早餐店',    cat:'food',          imageFile:'icon-b1-easy-buy-breakfast.png',             items:[{ name:'早餐費',   min:35,  max:60  }, { name:'公車票',  min:15, max:30 }] },
        { icon:'🎮', label:'買遊戲點數', cat:'entertainment', imageFile:'icon-b1-easy-arcade-game.png',              items:[{ name:'點數費',   min:50,  max:100 }, { name:'零食費',  min:10, max:20 }] },
        { icon:'🏀', label:'打球',      cat:'outdoor',       imageFile:'icon-b1-easy-swimming-class.png',            items:[{ name:'飲料費',   min:20,  max:35  }, { name:'零食費',  min:10, max:20 }] },
        { icon:'📱', label:'買手機貼紙', cat:'shopping',     imageFile:'icon-b1-easy-buy-stationery.png',            items:[{ name:'貼紙費',   min:20,  max:40  }, { name:'飲料費',  min:10, max:20 }] },
        { icon:'🌙', label:'逛夜市',    cat:'food',          imageFile:'icon-b1-easy-outing.png',                    items:[{ name:'小吃費',   min:40,  max:80  }, { name:'飲料費',  min:15, max:30 }] },
        { icon:'📝', label:'繳班費',    cat:'school',        imageFile:'icon-b1-easy-go-to-school.png',              items:[{ name:'班費',     min:50,  max:100 }, { name:'飲料費',  min:10, max:20 }] },
    ],
    normal: [
        { icon:'🏫', label:'上學日',    cat:'school',        imageFile:'icon-b1-normal-school-day.png',              items:[{ name:'午餐費',  min:50,  max:85  }, { name:'公車票',  min:15,  max:35  }, { name:'文具費',  min:10,  max:25  }] },
        { icon:'🎨', label:'才藝課',    cat:'school',        imageFile:'icon-b1-normal-talent-class.png',            items:[{ name:'課程費',  min:120, max:220 }, { name:'材料費',  min:40,  max:80  }, { name:'飲料費',  min:15,  max:30  }] },
        { icon:'🏥', label:'看醫生',    cat:'school',        imageFile:'icon-b1-normal-see-doctor.png',              items:[{ name:'掛號費',  min:100, max:200 }, { name:'藥費',    min:60,  max:130 }, { name:'公車票',  min:15,  max:30  }] },
        { icon:'🎬', label:'看電影',    cat:'entertainment', imageFile:'icon-b1-normal-watch-movie.png',             items:[{ name:'電影票',  min:200, max:330 }, { name:'爆米花',  min:60,  max:120 }, { name:'飲料費',  min:25,  max:45  }] },
        { icon:'🚂', label:'搭火車',    cat:'outdoor',       imageFile:'icon-b1-normal-take-train.png',              items:[{ name:'火車票',  min:180, max:360 }, { name:'便當費',  min:60,  max:110 }, { name:'飲料費',  min:20,  max:40  }] },
        { icon:'🏊', label:'去游泳',    cat:'outdoor',       imageFile:'icon-b1-normal-go-swimming.png',             items:[{ name:'入場費',  min:70,  max:130 }, { name:'飲料費',  min:20,  max:45  }, { name:'零食費',  min:15,  max:30  }] },
        { icon:'📖', label:'買參考書',  cat:'shopping',      imageFile:'icon-b1-normal-buy-books.png',               items:[{ name:'參考書費', min:150, max:260 }, { name:'文具費',  min:20,  max:50  }, { name:'飲料費',  min:15,  max:30  }] },
        { icon:'🌄', label:'爬山',      cat:'outdoor',       imageFile:'icon-b1-normal-mountain-climbing.png',       items:[{ name:'門票費',  min:80,  max:160 }, { name:'食物費',  min:80,  max:160 }, { name:'飲料費',  min:20,  max:40  }] },
        { icon:'🍜', label:'吃午飯',    cat:'food',          imageFile:'icon-b1-normal-have-lunch.png',              items:[{ name:'午餐費',  min:70,  max:130 }, { name:'飲料費',  min:25,  max:50  }, { name:'甜點費',  min:30,  max:60  }] },
        { icon:'🏫', label:'補習班',    cat:'school',        imageFile:'icon-b1-normal-cram-school.png',             items:[{ name:'課程費',  min:150, max:300 }, { name:'文具費',  min:20,  max:55  }, { name:'飲料費',  min:15,  max:30  }] },
        { icon:'🍰', label:'下午茶',    cat:'food',          imageFile:'icon-b1-normal-afternoon-tea.png',           items:[{ name:'飲料費',  min:45,  max:80  }, { name:'點心費',  min:50,  max:95  }, { name:'甜點費',  min:30,  max:60  }] },
        { icon:'🎡', label:'遊樂場',    cat:'entertainment', imageFile:'icon-b1-normal-playground.png',              items:[{ name:'入場費',  min:120, max:210 }, { name:'零食費',  min:45,  max:85  }, { name:'飲料費',  min:20,  max:40  }] },
        { icon:'🍣', label:'吃壽司',    cat:'food',          imageFile:'icon-b1-hard-eat-sushi.png',                 items:[{ name:'壽司費',  min:150, max:300 }, { name:'飲料費',  min:25,  max:50  }, { name:'甜點費',  min:30,  max:60  }] },
        { icon:'🥐', label:'買麵包',    cat:'food',          imageFile:'icon-b1-hard-buy-bread.png',                 items:[{ name:'麵包費',  min:40,  max:75  }, { name:'咖啡費',  min:45,  max:80  }, { name:'果汁費',  min:20,  max:40  }] },
        { icon:'💇', label:'去剪髮',    cat:'shopping',      imageFile:'icon-b1-hard-get-haircut.png',               items:[{ name:'剪髮費',  min:150, max:300 }, { name:'洗髮費',  min:50,  max:100 }, { name:'飲料費',  min:20,  max:40  }] },
        { icon:'🏋️', label:'健身房',   cat:'outdoor',       imageFile:'icon-b1-hard-gym.png',                       items:[{ name:'入場費',  min:150, max:300 }, { name:'運動飲料', min:25,  max:50  }, { name:'毛巾費',  min:20,  max:40  }] },
        { icon:'🎳', label:'去打保齡球', cat:'entertainment', imageFile:'icon-b1-hard-play-bowling.png',             items:[{ name:'場地費',  min:120, max:210 }, { name:'租鞋費',  min:40,  max:70  }, { name:'飲料費',  min:20,  max:40  }] },
        { icon:'🐠', label:'水族館',    cat:'outdoor',       imageFile:'icon-b1-normal-aquarium.png',                items:[{ name:'門票費',  min:150, max:280 }, { name:'紀念品',  min:50,  max:100 }, { name:'飲料費',  min:20,  max:40  }] },
        { icon:'⛺', label:'踏青',      cat:'outdoor',       imageFile:'icon-b1-normal-outing.png',                  items:[{ name:'門票費',  min:80,  max:150 }, { name:'飲料費',  min:20,  max:45  }, { name:'零食費',  min:25,  max:50  }] },
        // ── 國高中生常見場景 ──
        { icon:'🧋', label:'珍奶聚會',  cat:'food',          imageFile:'icon-b1-normal-afternoon-tea.png',           items:[{ name:'飲料費',  min:50,  max:85  }, { name:'點心費',  min:45,  max:80  }, { name:'甜點費',  min:30,  max:60  }] },
        { icon:'🎧', label:'買耳機',    cat:'shopping',      imageFile:'icon-b1-hard-buy-phone-case.png',            items:[{ name:'耳機費',  min:250, max:420 }, { name:'耳機套',  min:25,  max:50  }, { name:'飲料費',  min:20,  max:40  }] },
        { icon:'🏀', label:'打籃球',    cat:'outdoor',       imageFile:'icon-b1-hard-gym.png',                       items:[{ name:'場地費',  min:80,  max:150 }, { name:'飲料費',  min:30,  max:60  }, { name:'零食費',  min:15,  max:30  }] },
        { icon:'🌙', label:'夜市出遊',  cat:'food',          imageFile:'icon-b1-normal-outing.png',                  items:[{ name:'小吃費',  min:80,  max:150 }, { name:'夾娃娃費', min:40,  max:80  }, { name:'飲料費',  min:20,  max:40  }] },
        { icon:'👟', label:'買運動服',  cat:'shopping',      imageFile:'icon-b1-hard-big-shopping.png',              items:[{ name:'運動衣費', min:150, max:280 }, { name:'運動褲費', min:120, max:220 }, { name:'飲料費',  min:20,  max:40  }] },
        { icon:'🎮', label:'逛電玩店',  cat:'entertainment', imageFile:'icon-b1-normal-playground.png',              items:[{ name:'二手遊戲', min:150, max:280 }, { name:'飲料費',  min:25,  max:50  }, { name:'零食費',  min:20,  max:40  }] },
        { icon:'🍱', label:'訂外賣',    cat:'food',          imageFile:'icon-b1-normal-have-lunch.png',              items:[{ name:'餐費',    min:80,  max:150 }, { name:'外送費',  min:30,  max:60  }, { name:'飲料費',  min:20,  max:40  }] },
        { icon:'📱', label:'買手機殼',  cat:'shopping',      imageFile:'icon-b1-hard-buy-phone-case.png',            items:[{ name:'手機殼',  min:100, max:200 }, { name:'保護貼',  min:30,  max:60  }, { name:'充電線',  min:30,  max:60  }] },
        { icon:'🏫', label:'社團活動',  cat:'school',        imageFile:'icon-b1-normal-talent-class.png',            items:[{ name:'社費',    min:100, max:180 }, { name:'材料費',  min:50,  max:100 }, { name:'飲料費',  min:15,  max:30  }] },
    ],
    hard: [
        { icon:'🛒', label:'大採購',    cat:'shopping',      imageFile:'icon-b1-hard-big-shopping.png',              items:[{ name:'衣服費',  min:280, max:480 }, { name:'鞋子費',  min:380, max:620 }, { name:'書費',    min:150, max:230 }] },
        { icon:'🎂', label:'買禮物',    cat:'shopping',      imageFile:'icon-b1-hard-buy-gift.png',                  items:[{ name:'禮物費',  min:200, max:400 }, { name:'蛋糕費',  min:350, max:520 }, { name:'卡片費',  min:25,  max:55  }] },
        { icon:'🌿', label:'出遊',      cat:'outdoor',       imageFile:'icon-b1-normal-trip.png',                    items:[{ name:'公車票',  min:15,  max:35  }, { name:'冰淇淋費', min:35,  max:65  }, { name:'門票費',  min:80,  max:160 }, { name:'飲料費',  min:25,  max:50  }] },
        { icon:'🏕️', label:'露營',     cat:'outdoor',       imageFile:'icon-b1-normal-camping.png',                 items:[{ name:'食材費',  min:280, max:440 }, { name:'裝備費',  min:150, max:300 }, { name:'入場費',  min:120, max:210 }] },
        { icon:'🎡', label:'遊樂園',    cat:'entertainment', imageFile:'icon-b1-hard-amusement-park.png',            items:[{ name:'門票費',  min:450, max:720 }, { name:'餐費',    min:200, max:340 }, { name:'紀念品費', min:150, max:260 }] },
        { icon:'🌍', label:'校外教學',  cat:'school',        imageFile:'icon-b1-hard-field-trip.png',                items:[{ name:'交通費',  min:60,  max:130 }, { name:'午餐費',  min:90,  max:160 }, { name:'門票費',  min:150, max:300 }, { name:'零用錢',  min:80,  max:160 }] },
        { icon:'🎓', label:'畢業典禮',  cat:'school',        imageFile:'icon-b1-hard-graduation-ceremony.png',       items:[{ name:'服裝費',  min:380, max:580 }, { name:'花束費',  min:200, max:400 }, { name:'聚餐費',  min:280, max:450 }] },
        { icon:'🏖️', label:'去海邊',   cat:'outdoor',       imageFile:'icon-b1-hard-go-to-beach.png',               items:[{ name:'防曬乳',  min:150, max:260 }, { name:'餐費',    min:250, max:400 }, { name:'停車費',  min:80,  max:160 }, { name:'飲料費',  min:50,  max:90  }] },
        { icon:'🍱', label:'聚餐',      cat:'food',          imageFile:'icon-b1-hard-banquet.png',                   items:[{ name:'餐費',    min:380, max:580 }, { name:'飲料費',  min:100, max:180 }, { name:'甜點費',  min:120, max:210 }] },
        { icon:'🏫', label:'暑期課程',  cat:'school',        imageFile:'icon-b1-hard-summer-course.png',             items:[{ name:'課程費',  min:400, max:680 }, { name:'教材費',  min:150, max:260 }, { name:'午餐費',  min:80,  max:160 }] },
        { icon:'🛍️', label:'換季採購',  cat:'shopping',      imageFile:'icon-b1-hard-seasonal-shopping.png',         items:[{ name:'外套費',  min:550, max:850 }, { name:'褲子費',  min:280, max:450 }, { name:'包包費',  min:350, max:580 }] },
        { icon:'🎤', label:'KTV 歡唱',  cat:'entertainment', imageFile:'icon-b1-hard-sing-ktv.png',                  items:[{ name:'包廂費',  min:320, max:530 }, { name:'飲料費',  min:100, max:190 }, { name:'小食費',  min:60,  max:130 }] },
        { icon:'🎳', label:'去打保齡球', cat:'entertainment', imageFile:'icon-b1-hard-play-bowling.png',             items:[{ name:'場地費',  min:120, max:210 }, { name:'租鞋費',  min:40,  max:75  }, { name:'飲料費',  min:25,  max:50  }] },
        { icon:'📱', label:'買手機殼',  cat:'shopping',      imageFile:'icon-b1-hard-buy-phone-case.png',            items:[{ name:'手機殼',  min:150, max:260 }, { name:'保護貼',  min:40,  max:75  }, { name:'充電線',  min:80,  max:160 }] },
        { icon:'🎻', label:'音樂課',    cat:'school',        imageFile:'icon-b1-hard-music-class.png',               items:[{ name:'課程費',  min:320, max:530 }, { name:'樂器耗材', min:60,  max:130 }, { name:'教材費',  min:80,  max:160 }] },
        { icon:'🍕', label:'吃披薩',    cat:'food',          imageFile:'icon-b1-hard-eat-pizza.png',                 items:[{ name:'披薩費',  min:280, max:440 }, { name:'飲料費',  min:50,  max:90  }, { name:'甜點費',  min:60,  max:110 }] },
        { icon:'🏋️', label:'健身房',   cat:'outdoor',       imageFile:'icon-b1-hard-gym.png',                       items:[{ name:'月費',    min:280, max:460 }, { name:'運動飲料', min:25,  max:50  }, { name:'毛巾費',  min:30,  max:60  }] },
        { icon:'🐠', label:'海生館',    cat:'outdoor',       imageFile:'icon-b1-hard-marine-museum.png',             items:[{ name:'門票費',  min:300, max:480 }, { name:'紀念品費', min:100, max:200 }, { name:'餐費',    min:150, max:280 }] },
        { icon:'🕹️', label:'夾娃娃機', cat:'entertainment', imageFile:'icon-b1-hard-claw-machine.png',              items:[{ name:'遊戲幣費', min:150, max:280 }, { name:'飲料費',  min:25,  max:50  }, { name:'零食費',  min:40,  max:80  }] },
        { icon:'🏥', label:'看醫生',    cat:'school',        imageFile:'icon-b1-hard-see-doctor.png',                items:[{ name:'掛號費',  min:150, max:300 }, { name:'檢查費',  min:200, max:400 }, { name:'藥費',    min:120, max:250 }] },
        { icon:'🚂', label:'搭火車出遊', cat:'outdoor',      imageFile:'icon-b1-hard-take-train.png',                items:[{ name:'火車票',  min:350, max:680 }, { name:'便當費',  min:80,  max:150 }, { name:'飲料費',  min:35,  max:65  }, { name:'紀念品費', min:100, max:200 }] },
        // ── 國高中生常見場景 ──
        { icon:'🎪', label:'動漫展',    cat:'entertainment', imageFile:'icon-b1-hard-visit-toy-exhibition.png',      items:[{ name:'門票費',  min:250, max:420 }, { name:'周邊費',  min:300, max:550 }, { name:'餐費',    min:100, max:180 }] },
        { icon:'👟', label:'買球鞋',    cat:'shopping',      imageFile:'icon-b1-hard-big-shopping.png',              items:[{ name:'球鞋費',  min:700, max:1200}, { name:'鞋墊費',  min:80,  max:160 }, { name:'運動襪',  min:50,  max:100 }] },
        { icon:'🎮', label:'同學聚會',  cat:'entertainment', imageFile:'icon-b1-hard-sing-ktv.png',                  items:[{ name:'餐費',    min:250, max:420 }, { name:'KTV費',  min:180, max:320 }, { name:'交通費',  min:50,  max:100 }] },
        { icon:'📚', label:'補習班月費', cat:'school',       imageFile:'icon-b1-hard-summer-course.png',             items:[{ name:'補習費',  min:500, max:850 }, { name:'教材費',  min:120, max:230 }, { name:'文具費',  min:60,  max:120 }] },
        { icon:'🎸', label:'音樂社演出', cat:'school',       imageFile:'icon-b1-hard-music-class.png',               items:[{ name:'表演服費', min:280, max:460 }, { name:'道具費',  min:100, max:200 }, { name:'餐費',    min:120, max:220 }, { name:'交通費',  min:50,  max:100 }] },
        { icon:'🌙', label:'夜市班遊',  cat:'food',          imageFile:'icon-b1-hard-banquet.png',                   items:[{ name:'小吃費',  min:180, max:320 }, { name:'遊戲費',  min:120, max:220 }, { name:'飲料費',  min:80,  max:160 }, { name:'交通費',  min:50,  max:100 }] },
        { icon:'🎧', label:'買3C配件',  cat:'shopping',      imageFile:'icon-b1-hard-buy-phone-case.png',            items:[{ name:'耳機費',  min:500, max:850 }, { name:'充電器費', min:150, max:280 }, { name:'手機殼費', min:80,  max:160 }] },
        { icon:'🏃', label:'校際運動會', cat:'school',       imageFile:'icon-b1-hard-gym.png',                       items:[{ name:'報名費',  min:100, max:200 }, { name:'服裝費',  min:180, max:320 }, { name:'餐費',    min:120, max:200 }, { name:'飲料費',  min:50,  max:100 }] },
    ]
};

const DENOM_BY_DIFF = {
    easy:   [1, 5, 10, 50],
    normal: [1, 5, 10, 50, 100, 500],
    hard:   [1, 5, 10, 50, 100, 500, 1000]
};

// ── 金額語音轉換（安全版）──────────────────────────────────────
const toTWD = v => typeof convertToTraditionalCurrency === 'function'
    ? convertToTraditionalCurrency(v) : `${v}元`;

// ── 場景標籤去除重複「去」前綴（避免「今天要去：去游泳」）────────
const fmtLabel = label => label.replace(/^去/, '');

// ── 主遊戲物件 ─────────────────────────────────────────────────
let Game;

document.addEventListener('DOMContentLoaded', () => {
    Game = {

        // ── Debug ──────────────────────────────────────────────
        Debug: {
            FLAGS: { all:false, init:false, speech:false, audio:false,
                     ui:false, question:false, state:false, wallet:false, error:true },
            log(cat, ...a)  { if (this.FLAGS.all || this.FLAGS[cat]) console.log(`[B1-${cat}]`, ...a); },
            warn(cat, ...a) { if (this.FLAGS.all || this.FLAGS[cat]) console.warn(`[B1-${cat}]`, ...a); },
            error(...a)     { console.error('[B1-ERROR]', ...a); }
        },

        // ── TimerManager ───────────────────────────────────────
        TimerManager: {
            timers: new Map(), timerIdCounter: 0,
            setTimeout(callback, delay, category = 'default') {
                const id = ++this.timerIdCounter;
                const timerId = window.setTimeout(() => { this.timers.delete(id); callback(); }, delay);
                this.timers.set(id, { timerId, category });
                return id;
            },
            clearTimeout(id) {
                const t = this.timers.get(id);
                if (t) { window.clearTimeout(t.timerId); this.timers.delete(id); }
            },
            clearAll() { this.timers.forEach(t => window.clearTimeout(t.timerId)); this.timers.clear(); },
            clearByCategory(cat) {
                this.timers.forEach((t, id) => {
                    if (t.category === cat) { window.clearTimeout(t.timerId); this.timers.delete(id); }
                });
            }
        },

        // ── EventManager ───────────────────────────────────────
        EventManager: {
            listeners: [],
            on(el, type, fn, opts = {}, cat = 'default') {
                if (!el) return -1;
                el.addEventListener(type, fn, opts);
                return this.listeners.push({ element: el, type, handler: fn, options: opts, category: cat }) - 1;
            },
            removeAll() {
                this.listeners.forEach(l => {
                    try { l?.element?.removeEventListener(l.type, l.handler, l.options); } catch(e) {}
                });
                this.listeners = [];
            },
            removeByCategory(cat) {
                this.listeners.forEach((l, i) => {
                    if (l?.category === cat) {
                        try { l?.element?.removeEventListener(l.type, l.handler, l.options); } catch(e) {}
                        this.listeners[i] = null;
                    }
                });
            }
        },

        // ── Audio ──────────────────────────────────────────────
        audio: {
            sounds: {},
            init() {
                ['correct', 'success', 'error', 'click', 'coin', 'keypad'].forEach(name => {
                    const el = document.getElementById(`${name}-sound`);
                    if (el) this.sounds[name] = el;
                });
            },
            play(name) {
                const s = this.sounds[name];
                if (!s) return;
                try { s.currentTime = 0; s.play().catch(() => {}); } catch(e) {}
            }
        },

        // ── Speech ─────────────────────────────────────────────
        Speech: {
            cachedVoice: null,
            _loadVoice() {
                if (!window.speechSynthesis) return;
                const voices = window.speechSynthesis.getVoices();
                if (voices.length === 0) {
                    Game.TimerManager.setTimeout(() => Game.Speech._loadVoice(), 500, 'speech');
                    return;
                }
                this.cachedVoice =
                    voices.find(v => v.name.startsWith('Microsoft Yating')) ||
                    voices.find(v => v.name.startsWith('Microsoft Hanhan')) ||
                    voices.find(v => v.name === 'Google 國語（臺灣）') ||
                    voices.find(v => v.lang === 'zh-TW') ||
                    voices.find(v => v.lang.startsWith('zh')) ||
                    voices[0] ||
                    null;
            },
            speak(text, callback) {
                if (!window.speechSynthesis) { callback?.(); return; }
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                u.lang = this.cachedVoice?.lang || 'zh-TW'; u.rate = 1.0;
                if (this.cachedVoice) u.voice = this.cachedVoice;

                let callbackExecuted = false;
                const safeCallback = () => {
                    if (callbackExecuted) return;
                    callbackExecuted = true;
                    callback?.();
                };

                u.onend   = safeCallback;
                u.onerror = (e) => { if (e.error !== 'interrupted') Game.Debug.warn('speech', '語音錯誤', e.error); safeCallback(); };
                Game.TimerManager.setTimeout(safeCallback, 10000, 'speech');
                try {
                    window.speechSynthesis.speak(u);
                } catch(e) {
                    Game.Debug.warn('speech', '語音播放失敗', e);
                    safeCallback();
                }
            }
        },

        // ── State ──────────────────────────────────────────────
        state: {
            settings: { difficulty: null, questionCount: null, retryMode: 'retry', clickMode: 'off', sceneCategory: null, timerEnabled: false, customItemsEnabled: false },
            quiz: {
                currentQuestion: 0,
                totalQuestions: 10,
                correctCount: 0,
                streak: 0,
                questions: [],
                startTime: null,
                denomStats: {},
                solvedSchedules: []
            },
            wallet: [],       // [{denom, uid, isBanknote}]
            uidCounter: 0,
            isEndingGame: false,
            isProcessing: false,
            _documentEventsBound: false
        },

        // ── Init ───────────────────────────────────────────────
        init() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeAll();
            this.injectGlobalAnimationStyles();
            this.audio.init();
            Game.Speech._loadVoice();
            if (window.speechSynthesis?.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = () => Game.Speech._loadVoice();
            }
            this.showSettings();
            Game.Debug.log('init', 'B1 初始化完成');
        },

        injectGlobalAnimationStyles() {
            if (document.getElementById('b1-global-animations')) return;
            const s = document.createElement('style');
            s.id = 'b1-global-animations';
            s.textContent = `
                @keyframes b1CoinIn {
                    0%  { transform: translateY(-20px) scale(0.5); opacity:0; }
                    70% { transform: translateY(4px) scale(1.1); }
                    100%{ transform: translateY(0) scale(1); opacity:1; }
                }
                @keyframes b1Pop {
                    0%  { transform: scale(0.5); opacity:0; }
                    60% { transform: scale(1.2); }
                    100%{ transform: scale(1); opacity:1; }
                }
                @keyframes b1Shake {
                    0%,100% { transform:translateX(0); }
                    25%     { transform:translateX(-8px); }
                    75%     { transform:translateX(8px); }
                }
            `;
            document.head.appendChild(s);
        },

        resetGameState() {
            const q = this.state.quiz;
            q.currentQuestion = 0;
            q.totalQuestions  = this.state.settings.questionCount;
            q.correctCount    = 0;
            q.streak          = 0;
            q.questions       = [];
            q.startTime       = null;
            q.denomStats      = {};
            q.solvedSchedules = [];
            this.state.wallet        = [];
            this.state.uidCounter    = 0;
            this.state.isEndingGame = false;
            this.state.isProcessing  = false;
            Game.Debug.log('init', '🔄 [B1] 遊戲狀態已重置');
        },

        // ── Settings ───────────────────────────────────────────
        showSettings() {
            window.speechSynthesis.cancel();
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            this.resetGameState();

            const app = document.getElementById('app');
            app.style.cssText = '';
            document.body.style.overflow = '';

            app.innerHTML = `
            <div class="unit-welcome">
                <div class="welcome-content">
                    <div class="settings-title-row">
                        <img src="../images/common/hint_detective.png" alt="金錢小助手"
                             class="settings-mascot-img" onerror="this.style.display='none'">
                        <h1>單元B1：今天帶多少錢</h1>
                    </div>
                    <div class="game-settings">
                        <div class="b-setting-group">
                            <label style="font-size:13px;color:#6b7280;text-align:left;display:block;">
                                ✨ 看行程清單，準備好正確的錢幣，出發！<br>
                                簡單：2項費用；普通：3項費用；困難：3~4項費用，需自行加總
                            </label>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">🎯 難度選擇</label>
                            <div class="b-btn-group">
                                <button class="b-sel-btn b-diff-easy"   data-diff="easy">簡單</button>
                                <button class="b-sel-btn b-diff-normal" data-diff="normal">普通</button>
                                <button class="b-sel-btn b-diff-hard"   data-diff="hard">困難</button>
                            </div>
                            <div class="b-diff-desc" id="diff-desc"></div>
                        </div>
                        <div class="b-setting-group" id="assist-click-group" style="display:none;">
                            <label class="b-setting-label">🤖 輔助點擊</label>
                            <div class="b-btn-group" id="assist-group">
                                <button class="b-sel-btn${this.state.settings.clickMode === 'on' ? ' active' : ''}" data-assist="on">✓ 啟用</button>
                                <button class="b-sel-btn${this.state.settings.clickMode !== 'on' ? ' active' : ''}" data-assist="off">✗ 停用</button>
                            </div>
                            <div style="margin-top:4px;font-size:12px;color:#6b7280;">
                                啟用後，只要偵測到點擊便會自動執行下一個步驟
                            </div>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">🗂️ 場景類別</label>
                            <div class="b-btn-group" id="cat-group" style="flex-wrap:wrap;">
                                <button class="b-sel-btn" data-cat="all">隨機 🎲</button>
                                <button class="b-sel-btn" data-cat="school">學校 🏫</button>
                                <button class="b-sel-btn" data-cat="food">飲食 🍜</button>
                                <button class="b-sel-btn" data-cat="outdoor">戶外 🌿</button>
                                <button class="b-sel-btn" data-cat="entertainment">娛樂 🎭</button>
                                <button class="b-sel-btn" data-cat="shopping">購物 🛒</button>
                            </div>
                            <div style="margin-top:4px;font-size:12px;color:#6b7280;">
                                選擇特定類別可以專注練習該情境的金額計算
                            </div>
                            <div id="custom-items-toggle-row" style="display:none;margin-top:10px;">
                                <label style="font-size:13px;color:#374151;font-weight:600;">🛠️ 自訂項目</label>
                                <div class="b-btn-group" id="custom-items-group" style="margin-top:4px;">
                                    <button class="b-sel-btn active" data-custom="off">關閉</button>
                                    <button class="b-sel-btn" data-custom="on">開啟</button>
                                </div>
                                <div style="margin-top:4px;font-size:12px;color:#6b7280;">
                                    開啟後，可在測驗頁面新增或刪除項目，系統將依自訂項目計算所需金額
                                </div>
                            </div>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">📋 題目數量</label>
                            <div class="b-btn-group" id="count-group">
                                <button class="b-sel-btn" data-count="1">1題</button>
                                <button class="b-sel-btn" data-count="5">5題</button>
                                <button class="b-sel-btn" data-count="10">10題</button>
                                <button class="b-sel-btn" data-count="15">15題</button>
                                <button class="b-sel-btn" data-count="20">20題</button>
                                <button class="b-sel-btn" id="b1-custom-count-btn">自訂選項</button>
                            </div>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">🎁 獎勵系統</label>
                            <div class="b-btn-group">
                                <a href="#" id="settings-reward-link" class="b-sel-btn active"
                                   style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">
                                    開啟獎勵系統
                                </a>
                            </div>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">📝 作業單</label>
                            <div class="b-btn-group">
                                <a href="#" id="settings-worksheet-link" class="b-sel-btn active"
                                   style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">
                                    產生作業單
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="game-buttons">
                        <button class="back-btn" onclick="Game.backToMenu()">返回主選單</button>
                        <button class="start-btn" id="start-btn" disabled>▶ 開始練習</button>
                    </div>
                </div>
            </div>`;

            this._bindSettingsEvents();
        },

        _diffDescriptions: {
            easy:   '簡單：每次會有2項費用，視覺提示下，拖曳放置完成。',
            normal: '普通：每次會有3項費用，作答方式為選擇題及依提示準備正確的錢幣。',
            hard:   '困難：每次會有3~4項費用，自行輸入正確金額。'
        },

        _bindSettingsEvents() {
            Game.EventManager.removeByCategory('settings');
            // 場景類別
            document.querySelectorAll('#cat-group [data-cat]').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#cat-group [data-cat]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.sceneCategory = btn.dataset.cat;
                    this._checkCanStart();
                }, {}, 'settings');
            });

            // 難度
            document.querySelectorAll('[data-diff]').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.difficulty = btn.dataset.diff;
                    const desc = document.getElementById('diff-desc');
                    if (desc) {
                        desc.textContent = this._diffDescriptions[btn.dataset.diff];
                        desc.classList.add('show');
                    }
                    // 輔助點擊：只有簡單模式才顯示
                    const assistGroup  = document.getElementById('assist-click-group');
                    const customRow    = document.getElementById('custom-items-toggle-row');
                    if (btn.dataset.diff === 'easy') {
                        if (assistGroup) assistGroup.style.display = '';
                        // 簡單模式：隱藏自訂項目，重設為關閉
                        if (customRow) customRow.style.display = 'none';
                        this.state.settings.customItemsEnabled = false;
                        document.querySelectorAll('#custom-items-group [data-custom]').forEach(b => {
                            b.classList.toggle('active', b.dataset.custom === 'off');
                        });
                    } else {
                        if (assistGroup) assistGroup.style.display = 'none';
                        this.state.settings.clickMode = 'off';
                        // 普通/困難：顯示自訂項目切換列
                        if (customRow) customRow.style.display = '';
                    }
                    this._checkCanStart();
                }, {}, 'settings');
            });

            // 題數
            document.querySelectorAll('[data-count]').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('[data-count]').forEach(b => b.classList.remove('active'));
                    document.getElementById('b1-custom-count-btn')?.classList.remove('active');
                    btn.classList.add('active');
                    this.state.settings.questionCount = parseInt(btn.dataset.count);
                    this._checkCanStart();
                }, {}, 'settings');
            });

            // 自訂題數
            const b1CustomCountBtn = document.getElementById('b1-custom-count-btn');
            if (b1CustomCountBtn) {
                Game.EventManager.on(b1CustomCountBtn, 'click', () => {
                    this._showSettingsCountNumpad('題數', (n) => {
                        document.querySelectorAll('[data-count]').forEach(b => b.classList.remove('active'));
                        b1CustomCountBtn.classList.add('active');
                        b1CustomCountBtn.textContent = `${n}題`;
                        this.state.settings.questionCount = n;
                        this._checkCanStart();
                    });
                }, {}, 'settings');
            }

            Game.EventManager.on(document.getElementById('settings-reward-link'), 'click', (e) => {
                e.preventDefault();
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'settings');

            // 作業單
            Game.EventManager.on(document.getElementById('settings-worksheet-link'), 'click', (e) => {
                e.preventDefault();
                const params = new URLSearchParams({ unit: 'b1' });
                window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
            }, {}, 'settings');


            document.querySelectorAll('#assist-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#assist-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.clickMode = btn.dataset.assist;
                    this._checkCanStart();
                }, {}, 'settings');
            });

            // 自訂項目切換
            document.querySelectorAll('#custom-items-group [data-custom]').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#custom-items-group [data-custom]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.customItemsEnabled = btn.dataset.custom === 'on';
                }, {}, 'settings');
            });

            // 開始
            Game.EventManager.on(document.getElementById('start-btn'), 'click', () => {
                this.startGame();
            }, {}, 'settings');
        },

        _checkCanStart() {
            const s   = this.state.settings;
            const btn = document.getElementById('start-btn');
            if (btn) btn.disabled = !s.difficulty || !s.questionCount || !s.sceneCategory;
        },

        _showSettingsCountNumpad(label, onConfirm) {
            document.getElementById('b-snp-overlay')?.remove();
            let val = '';
            const overlay = document.createElement('div');
            overlay.id = 'b-snp-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10200;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = `
                <div style="background:#fff;border-radius:16px;padding:20px 24px;width:260px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
                    <div style="font-size:14px;font-weight:700;color:#374151;margin-bottom:10px;">自訂${label}</div>
                    <div id="b-snp-disp" style="font-size:2rem;font-weight:bold;text-align:center;padding:10px;background:#f3f4f6;border-radius:10px;margin-bottom:12px;">---</div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;">
                        ${[1,2,3,4,5,6,7,8,9,'⌫',0,'取消'].map(k => `<button style="padding:12px;font-size:1.1rem;border:2px solid #e5e7eb;border-radius:8px;background:#f9fafb;cursor:pointer;font-weight:600;" data-snpk="${k}">${k}</button>`).join('')}
                    </div>
                    <button id="b-snp-cancel" style="width:100%;padding:8px;border:none;background:#f9fafb;border-radius:8px;cursor:pointer;font-size:1.1rem;font-weight:700;color:#374151;border:2px solid #e5e7eb;">確定</button>
                </div>`;
            document.body.appendChild(overlay);
            const disp = overlay.querySelector('#b-snp-disp');
            const update = () => { disp.textContent = val || '---'; };
            overlay.querySelectorAll('[data-snpk]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const k = btn.dataset.snpk;
                    if (k === '取消') { overlay.remove(); return; }
                    this.audio.play('keypad');
                    if (k === '⌫') { val = val.slice(0, -1); }
                    else {
                        const next = val + k;
                        if (parseInt(next) <= 99) val = next;
                    }
                    update();
                });
            });
            overlay.querySelector('#b-snp-cancel').addEventListener('click', () => {
                const n = parseInt(val);
                if (n >= 1 && n <= 99) { overlay.remove(); onConfirm(n); return; }
                disp.style.color = '#ef4444';
                setTimeout(() => { disp.style.color = ''; update(); }, 500);
                val = ''; update();
            });
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        },

        // ── Start Game ─────────────────────────────────────────
        startGame() {
            Game.EventManager.removeByCategory('settings');
            Game.TimerManager.clearAll();

            const s = this.state.settings;
            const q = this.state.quiz;
            q.currentQuestion = 0;
            q.totalQuestions  = s.questionCount;
            q.correctCount    = 0;
            q.streak          = 0;
            q.startTime       = Date.now();
            window.LearningTracker?.resetWrong?.();   // 學習紀錄：錯誤/逐題計數歸零
            q.questions       = this._generateQuestions(q.totalQuestions);

            this.state.wallet        = [];
            this.state.uidCounter    = 0;
            this.state.isEndingGame = false;
            this.state.isProcessing  = false;

            Game.Debug.log('init', `開始遊戲 diff=${s.difficulty} count=${q.totalQuestions}`);
            // 立即清空設定頁，讓彈窗出現在乾淨背景上
            const app = document.getElementById('app');
            if (app) app.innerHTML = '';
            this.renderQuestion();
        },

        _generateQuestions(count) {
            const diff = this.state.settings.difficulty;
            const cat  = this.state.settings.sceneCategory;
            const allScenarios = B1_SCENARIOS[diff] || B1_SCENARIOS.easy;
            // 依類別篩選（'all' 不篩選）
            const filtered = (cat && cat !== 'all')
                ? allScenarios.filter(s => s.cat === cat)
                : allScenarios;
            const basePool = filtered.length > 0 ? filtered : allScenarios;
            const pool     = [...basePool];
            const result   = [];

            // 隨機取 min~max 範圍內的金額，四捨五入至 5 元倍數
            const randCost = (min, max) => Math.round((min + Math.random() * (max - min)) / 5) * 5 || 5;

            for (let i = 0; i < count; i++) {
                if (pool.length === 0) pool.push(...basePool);
                const idx = Math.floor(Math.random() * pool.length);
                const scenario = pool.splice(idx, 1)[0];
                // 依 min/max 隨機化各項金額（舊格式 cost 直接保留作相容）
                const items = scenario.items.map(it =>
                    it.min != null
                        ? { name: it.name, cost: randCost(it.min, it.max) }
                        : { name: it.name, cost: it.cost }
                );
                const total = items.reduce((s, it) => s + it.cost, 0);
                result.push({ icon: scenario.icon, label: scenario.label, cat: scenario.cat, imageFile: scenario.imageFile || null, items, total });
            }
            Game.Debug.log('question', `產生題目 ${result.length} 題（類別：${cat}）`);
            return result;
        },

        // ── 場景圖示 HTML（有圖片用圖片，否則 emoji）────────────────
        _sceneIcon(q, cls = '') {
            if (q.imageFile) {
                return `<img src="../images/b1/${q.imageFile}" alt="${q.label}" class="b1-scene-img${cls ? ' ' + cls : ''}" onerror="this.outerHTML='${q.icon}'">`;
            }
            return q.icon;
        },

        // ── 自訂項目合併 helpers ────────────────────────────────
        _getEffectiveItems(curr) {
            const q = this.state.quiz;
            const base   = curr.items.filter(it => !it._deleted);
            const custom = (q.customItems || []).filter(it => !it._deleted);
            return [...base, ...custom];
        },

        _getEffectiveTotal(curr) {
            return this._getEffectiveItems(curr).reduce((s, it) => s + it.cost, 0);
        },

        // ── Render Question ────────────────────────────────────
        renderQuestion() {
            Game.TimerManager.clearAll();
            window.speechSynthesis.cancel();
            Game.EventManager.removeAll();
            AssistClick.deactivate();
            this.state.isProcessing = false;
            this.state.wallet = [];
            const q = this.state.quiz;
            q.errorCount = 0;
            q.showHint   = false;
            q.hintSlots  = [];
            q.hardTotalInput = '';
            q.walletRevealed = false;
            q.customItems    = [];
            q.easyCoinsClicked = {};
            q.easyRunningTotal = 0;
            q.easyEventTotals = {};
            q.activeInputEl = null;
            q.phase = 1;
            // 先顯示場景彈窗（只含目的地），關閉後再渲染 Phase 1
            const curr = q.questions[q.currentQuestion];
            // 重設自訂項目刪除旗標
            if (curr && curr.items) curr.items.forEach(it => { it._deleted = false; });
            // 清空目前頁面內容，確保前一頁（Phase 2）先消失再顯示任務彈窗
            const appEl = document.getElementById('app');
            if (appEl) appEl.innerHTML = '';
            this._showTaskModal(curr, () => this._renderPhase1());
        },

        // ── Phase 1：行程確認（看清單 / 計算總額）──────────────────
        _renderPhase1() {
            Game.TimerManager.clearByCategory('gameUI');
            Game.EventManager.removeByCategory('gameUI');

            const q    = this.state.quiz;
            const curr = q.questions[q.currentQuestion];
            const diff = this.state.settings.difficulty;
            const isHard = diff === 'hard';
            const isEasy = diff === 'easy';
            const app  = document.getElementById('app');
            const useCustom = this.state.settings.customItemsEnabled && diff !== 'easy';

            // 初始化逐項揭露狀態
            q.easyRevealedUpTo = 0;
            q.itemsCorrect = [];
            q.customItemsPendingCount = 0;
            q.phase = 1;

            // showTotal：normal/hard 均不顯示總計（逐項輸入後自動算出）
            const showTotal  = false;
            // showHintBtn：普通/困難均顯示提示鈕
            const showHintBtn = !isEasy;

            app.innerHTML = `
            ${this._renderHeader()}
            <div class="b-game-wrap">
                <div class="b1-card-outer-wrap">
                    ${this._renderScheduleCard(curr, showTotal, { showItemAmounts: true, showHintBtn, useCustom })}
                    ${isHard ? `
                    <div class="b1-calc-side-col">
                        <button class="b1-calc-toggle-btn" id="b1-calc-toggle">🧮 開啟計算機</button>
                        <div class="b1-calc-panel" id="b1-calc-panel" style="display:none;">
                            ${this._getCalculatorHTML()}
                        </div>
                    </div>` : ''}
                </div>
            </div>`;

            this._bindPhase1Events(curr, diff);

            // 彈窗關閉後朗讀費用明細（同步存入 lastSpeechText 供重播按鈕使用）
            Game.TimerManager.setTimeout(() => {
                const lbl = fmtLabel(curr.label);
                const effectiveItems = this._getEffectiveItems(curr);
                const names = effectiveItems.map(it => it.name).join('、');
                let speechText;
                if (isEasy) {
                    speechText = `今天去${lbl}，第一項：${effectiveItems[0]?.name || names}，請點擊金錢圖示。`;
                } else if (diff === 'normal') {
                    speechText = `今天去${lbl}，要準備${names}，每一項是多少元？請點選正確金額。`;
                } else if (isHard) {
                    speechText = `今天去${lbl}，要準備${names}，每一項是多少元？請輸入正確金額。`;
                }
                if (speechText) {
                    this.state.quiz.lastSpeechText = speechText;
                    Game.Speech.speak(speechText);
                }
            }, 300, 'speech');

            if (this.state.settings.timerEnabled) {
                Game.TimerManager.setTimeout(() => this._startRouteTimer(curr), 2200, 'countdown');
            }
        },

        // ── Phase 2：準備錢幣（放置金錢）───────────────────────────
        _renderPhase2(curr, diff) {
            Game.TimerManager.clearByCategory('gameUI');
            Game.EventManager.removeByCategory('gameUI');
            this.state.quiz.phase = 2;

            const isEasy = diff === 'easy';
            const effectiveTotal = this._getEffectiveTotal(curr);
            const app = document.getElementById('app');
            app.innerHTML = `
            ${this._renderHeader()}
            <div class="b-game-wrap">
                ${this._renderPhase2RefCard(curr)}
                ${this._renderWalletArea(effectiveTotal)}
                ${!isEasy ? `<div style="display:flex;justify-content:center;margin:8px 0;">
                    <button class="b1-confirm-btn" id="confirm-btn" ${diff === 'hard' ? '' : 'disabled'}>✅ 準備好了，出發！</button>
                </div>` : ''}
                ${this._renderCoinTray(diff)}
            </div>`;

            this._bindPhase2Events(curr);

            if (diff === 'easy') {
                this._autoSetGhostSlots(curr);
            }

            Game.Speech.speak(`請準備${toTWD(effectiveTotal)}`);
        },

        // ── 靜默設定 ghost slots（簡單模式自動提示）──────────────
        _autoSetGhostSlots(curr) {
            const denoms  = DENOM_BY_DIFF[this.state.settings.difficulty] || DENOM_BY_DIFF.easy;
            const optimal = this._calcOptimalCoins(this._getEffectiveTotal(curr), denoms);
            const q = this.state.quiz;
            q.showHint   = true;
            q.hintSlots  = optimal.map(d => ({ denom: d, filled: false, face: q.trayFaces?.[d] || 'front' }));
            this._updateWalletDisplay();
            this._b1UpdateTrayHint();
        },

        _b1UpdateTrayHint() {
            document.querySelectorAll('.b1-coin-draggable').forEach(el => el.classList.remove('b1-tray-here-hint'));
            if (this.state.settings.difficulty !== 'easy') return;
            const q = this.state.quiz;
            const nextSlot = q.hintSlots?.find(s => !s.filled);
            if (!nextSlot) return;
            const coinEl = document.querySelector(`.b1-coin-draggable[data-denom="${nextSlot.denom}"]`);
            if (coinEl) coinEl.classList.add('b1-tray-here-hint');
        },

        // ── Phase 2 迷你參考卡 ──────────────────────────────────────
        _renderPhase2RefCard(curr) {
            const diff = this.state.settings.difficulty;
            const effectiveItems = this._getEffectiveItems(curr);
            const effectiveTotal = this._getEffectiveTotal(curr);
            const showHint = diff === 'normal' || diff === 'hard';
            const hintWrap = showHint
                ? `<div class="b1-pr-hint-wrap b1-pr-hint-abs">
                       <img src="../images/common/hint_detective.png" alt="" class="b1-hint-mascot" onerror="this.style.display='none'">
                       <button class="b1-hint-btn" id="hint-btn" title="提示">💡 提示</button>
                   </div>`
                : '';
            const imgBlock = curr.imageFile
                ? `<div class="b1-scene-img-center b1-icon-zoom-trigger" id="b1-scene-icon-trigger"><img src="../images/b1/${curr.imageFile}" alt="${curr.label}" class="b1-scene-img-lg" onerror="this.parentElement.remove()"></div>`
                : `<div class="b1-scene-img-center b1-icon-zoom-trigger" id="b1-scene-icon-trigger"><span style="font-size:64px">${curr.icon}</span></div>`;
            const itemsList = effectiveItems.map(it =>
                `<div class="b1-pr-item-row">${it.name} ${it.cost}元</div>`
            ).join('');
            return `
            <div class="b1-phase2-ref" style="position:relative">
                ${hintWrap}
                <div class="b1-pr-hdr">
                    ${imgBlock}
                    <div class="b1-pr-text">
                        <div class="b1-pr-label">今天要去：${fmtLabel(curr.label)}</div>
                        <div class="b1-pr-items-list">${itemsList}</div>
                    </div>
                </div>
                <div class="b1-pr-total-row">
                    <div class="b1-pr-total">${effectiveTotal} 元</div>
                </div>
            </div>`;
        },

        // ── 普通/困難模式：總計輸入鍵盤 ─────────────────────────────
        _renderTotalInput(isHard, useCustom) {
            return `
            <div class="b1-hard-total-area" id="b1-hard-total-area">
                <div class="b1-ht-top-row">
                    <div class="b1-ht-label">把每項金額加起來，總共需要幾元？</div>
                </div>
                <div class="b1-ht-total-row">
                    <span class="b1-ht-total-label">總計</span>
                    <div class="b1-ht-display" id="b1-ht-display">___</div>
                    <span class="b1-ht-total-label">元</span>
                </div>
                <div class="b1-ht-numpad" id="b1-ht-numpad">
                    <button class="b1-ht-digit" data-digit="1">1</button>
                    <button class="b1-ht-digit" data-digit="2">2</button>
                    <button class="b1-ht-digit" data-digit="3">3</button>
                    <button class="b1-ht-digit" data-digit="4">4</button>
                    <button class="b1-ht-digit" data-digit="5">5</button>
                    <button class="b1-ht-digit" data-digit="6">6</button>
                    <button class="b1-ht-digit" data-digit="7">7</button>
                    <button class="b1-ht-digit" data-digit="8">8</button>
                    <button class="b1-ht-digit" data-digit="9">9</button>
                    <button class="b1-ht-digit b1-ht-back" data-digit="back">⌫</button>
                    <button class="b1-ht-digit" data-digit="0">0</button>
                    <button class="b1-ht-confirm" id="b1-ht-confirm">✓ 確認</button>
                </div>
                <div class="b1-ht-error" id="b1-ht-error" style="display:none"></div>
            </div>`;
        },

        // ── 自訂項目面板 HTML ──────────────────────────────────────
        _renderCustomItemsPanel(curr) {
            const rows = curr.items.map((it, i) => `
                <div class="b1-cip-row" id="b1-cip-base-${i}">
                    <span class="b1-cip-name">${it.name}</span>
                    <span class="b1-cip-cost">${it.cost}元</span>
                    <button class="b1-cip-del-btn" data-base-idx="${i}" title="刪除">✕</button>
                </div>`).join('');
            return `
            <div class="b1-custom-items-panel" id="b1-custom-panel">
                <div class="b1-cip-header">🛠️ 自訂行程項目</div>
                <div id="b1-cip-base-list">${rows}</div>
                <div id="b1-cip-custom-list"></div>
                <div class="b1-cip-add-row">
                    <input type="text" id="b1-cip-name-input" placeholder="項目名稱" maxlength="8"
                           class="b1-cip-input">
                    <input type="number" id="b1-cip-cost-input" placeholder="金額" min="1" max="9999"
                           class="b1-cip-input b1-cip-cost-inp">
                    <button class="b1-cip-add-btn" id="b1-cip-add-btn">＋ 新增</button>
                </div>
            </div>`;
        },

        // ── 即時更新自訂合計預覽 ──────────────────────────────────
        _updateCustomTotalPreview(curr) {
            const total = this._getEffectiveTotal(curr);
            // 同步更新 schedule card 的 total strip
            const strip = document.querySelector('.b1-ts-amount');
            if (strip) strip.textContent = `${total} 元`;
        },

        _getCalculatorHTML() {
            return `
            <div class="b1-calculator">
                <div class="b1-calc-display" id="b1-calc-display">0</div>
                <div class="b1-calc-buttons">
                    <button class="b1-calc-btn b1-calc-num" data-v="7">7</button>
                    <button class="b1-calc-btn b1-calc-num" data-v="8">8</button>
                    <button class="b1-calc-btn b1-calc-num" data-v="9">9</button>
                    <button class="b1-calc-btn b1-calc-op" data-v="C">C</button>
                    <button class="b1-calc-btn b1-calc-num" data-v="4">4</button>
                    <button class="b1-calc-btn b1-calc-num" data-v="5">5</button>
                    <button class="b1-calc-btn b1-calc-num" data-v="6">6</button>
                    <button class="b1-calc-btn b1-calc-op" data-v="+">+</button>
                    <button class="b1-calc-btn b1-calc-num" data-v="1">1</button>
                    <button class="b1-calc-btn b1-calc-num" data-v="2">2</button>
                    <button class="b1-calc-btn b1-calc-num" data-v="3">3</button>
                    <button class="b1-calc-btn b1-calc-op" data-v="-">-</button>
                    <button class="b1-calc-btn b1-calc-num" data-v="0">0</button>
                    <button class="b1-calc-btn b1-calc-op" data-v="⌫">⌫</button>
                    <button class="b1-calc-btn b1-calc-eq" data-v="=">=</button>
                    <button class="b1-calc-btn b1-calc-op" data-v="×">×</button>
                </div>
            </div>`;
        },

        _bindCalculator() {
            const panel   = document.getElementById('b1-calc-panel');
            const toggle  = document.getElementById('b1-calc-toggle');
            const display = document.getElementById('b1-calc-display');
            if (!panel || !toggle || !display) return;

            let calcVal = '0', calcOp = null, calcPrev = null, calcFresh = false;
            const updateDisp = () => { display.textContent = calcVal; };

            toggle.addEventListener('click', () => {
                const open = panel.style.display === 'none';
                panel.style.display = open ? '' : 'none';
                toggle.textContent = open ? '🧮 關閉計算機' : '🧮 開啟計算機';
            });

            panel.querySelectorAll('.b1-calc-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const v = btn.dataset.v;
                    this.audio.play('keypad');
                    if (v === 'C') { calcVal = '0'; calcOp = null; calcPrev = null; calcFresh = false; }
                    else if (v === '⌫') { calcVal = calcVal.length > 1 ? calcVal.slice(0, -1) : '0'; }
                    else if (['+', '-', '×'].includes(v)) {
                        // 連續運算：若已有待計算結果，先算出來再接下一步
                        if (calcOp && calcPrev !== null && !calcFresh) {
                            const cur = parseFloat(calcVal);
                            const res = calcOp === '+' ? calcPrev + cur : calcOp === '-' ? calcPrev - cur : calcPrev * cur;
                            calcVal = String(Math.round(res * 1000) / 1000);
                            updateDisp();
                        }
                        calcPrev = parseFloat(calcVal); calcOp = v; calcFresh = true;
                    } else if (v === '=') {
                        if (calcOp && calcPrev !== null) {
                            const cur = parseFloat(calcVal);
                            const res = calcOp === '+' ? calcPrev + cur : calcOp === '-' ? calcPrev - cur : calcPrev * cur;
                            calcVal = String(Math.round(res * 1000) / 1000);
                            calcOp = null; calcPrev = null;
                        }
                    } else {
                        calcVal = (calcFresh || calcVal === '0') ? v : calcVal + v;
                        calcFresh = false;
                    }
                    updateDisp();
                });
            });
        },

        // ── 簡單模式：3個金額選項 ─────────────────────────────────
        _renderChoiceButtons(curr) {
            const choices = this._generateChoices(curr.total);
            return `
            <div class="b1-choice-area">
                <div class="b1-choice-label">這次出門，總共需要帶多少錢？</div>
                <div class="b1-choice-btns">
                    ${choices.map(amt => `
                    <button class="b1-choice-btn" data-amount="${amt}">
                        <span class="b1-choice-amount">${amt} 元</span>
                        <span class="b1-choice-icons">${this._renderMoneyIconsGrouped(amt)}</span>
                    </button>
                    `).join('')}
                </div>
            </div>`;
        },

        _renderMoneyIconsGrouped(amount, maxCoins = 12) {
            const rf = () => Math.random() < 0.5 ? 'back' : 'front';
            const denoms = [1000, 500, 100, 50, 10, 5, 1];
            let rem = amount;
            const groups = [];
            for (const d of denoms) {
                if (rem <= 0) break;
                const count = Math.floor(rem / d);
                if (count > 0) { groups.push({ denom: d, count }); rem -= count * d; }
                if (groups.length >= 4) break;
            }
            if (groups.length === 0) return '';

            // 手機版：分組 ×N（同 _renderItemMoneyIcons mobile）
            const mobileHTML = groups.map(g => {
                const isBill = g.denom >= 100;
                const w = isBill ? 34 : 24;
                const countBadge = g.count > 1 ? `<span class="b1-mic-count">×${g.count}</span>` : '';
                return `<span class="b1-mic-item">
                    <img src="../images/money/${g.denom}_yuan_${rf(g.denom)}.png" alt="${g.denom}元"
                         style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};${isBill ? 'border-radius:3px' : 'border-radius:50%'};display:block;"
                         onerror="this.style.display='none'" draggable="false">${countBadge}
                </span>`;
            }).join('');

            // 桌面版：逐枚（同 _renderItemMoneyIcons desktop）
            const items = [];
            for (const g of groups) {
                for (let i = 0; i < g.count && items.length < maxCoins; i++) items.push(g.denom);
            }
            const desktopHTML = items.map(d => {
                const isBill = d >= 100;
                const w = isBill ? 72 : 50;
                return `<img src="../images/money/${d}_yuan_${rf(d)}.png" alt="${d}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};${isBill ? 'border-radius:4px' : 'border-radius:50%'};display:block;flex-shrink:0;"
                     onerror="this.style.display='none'" draggable="false">`;
            }).join('');

            return `<span class="b1-mic-desktop">${desktopHTML}</span><span class="b1-mic-mobile">${mobileHTML}</span>`;
        },

        // ── 行程項目金錢圖示（桌面逐枚、手機×N）─────────────────────
        _renderItemMoneyIcons(amount, maxGroups = 4) {
            const rf = () => Math.random() < 0.5 ? 'back' : 'front';
            const denoms = [1000, 500, 100, 50, 10, 5, 1];
            let rem = amount;
            const groups = [];
            for (const d of denoms) {
                if (rem <= 0) break;
                const count = Math.floor(rem / d);
                if (count > 0) { groups.push({ denom: d, count }); rem -= count * d; }
                if (groups.length >= maxGroups) break;
            }
            if (groups.length === 0) return '';

            // 手機版：分組 ×N
            const mobileHTML = groups.map(g => {
                const isBill = g.denom >= 100;
                const w = isBill ? 34 : 24;
                const countBadge = g.count > 1 ? `<span class="b1-mic-count">×${g.count}</span>` : '';
                return `<span class="b1-mic-item">
                    <img src="../images/money/${g.denom}_yuan_${rf(g.denom)}.png" alt="${g.denom}元"
                         style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};${isBill ? 'border-radius:3px' : 'border-radius:50%'};display:block;"
                         onerror="this.style.display='none'" draggable="false">${countBadge}
                </span>`;
            }).join('');

            // 桌面版：逐枚（最多10枚），紙鈔加 b1-mi-bill、硬幣加 b1-mi-coin 類別
            const items = [];
            for (const g of groups) {
                for (let i = 0; i < g.count && items.length < 10; i++) items.push(g.denom);
            }
            const desktopHTML = items.map(d => {
                const isBill = d >= 100;
                const w = isBill ? 72 : 50;
                return `<img src="../images/money/${d}_yuan_${rf(d)}.png" alt="${d}元" class="${isBill ? 'b1-mi-bill' : 'b1-mi-coin'}"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};${isBill ? 'border-radius:4px' : 'border-radius:50%'};display:block;flex-shrink:0;"
                     onerror="this.style.display='none'" draggable="false">`;
            }).join('');

            return `<span class="b1-mic-desktop">${desktopHTML}</span><span class="b1-mic-mobile">${mobileHTML}</span>`;
        },

        // ── Easy 模式：可點擊金幣（行程項目）─────────────────────────
        _renderB1ClickableCoins(amount, itemIdx) {
            const rf = () => Math.random() < 0.5 ? 'back' : 'front';
            const denoms = [1000, 500, 100, 50, 10, 5, 1];
            let rem = amount;
            const items = [];
            for (const d of denoms) {
                if (rem <= 0) break;
                const cnt = Math.floor(rem / d);
                for (let i = 0; i < cnt; i++) items.push({ denom: d, coinIdx: items.length, face: rf(d) });
                rem -= cnt * d;
            }

            // 手機版：分組 ×N（靜態）
            const groups = [];
            let rem2 = amount;
            for (const d of denoms) {
                if (rem2 <= 0) break;
                const cnt = Math.floor(rem2 / d);
                if (cnt > 0) groups.push({ denom: d, count: cnt, face: rf(d) });
                rem2 -= cnt * d;
                if (groups.length >= 4) break;
            }
            const mobileHTML = groups.map(g => {
                const isBill = g.denom >= 100;
                const w = isBill ? 34 : 24;
                const badge = g.count > 1 ? `<span class="b1-mic-count">×${g.count}</span>` : '';
                return `<span class="b1-mic-item">
                    <img src="../images/money/${g.denom}_yuan_${g.face}.png" alt="${g.denom}元"
                         style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};${isBill ? 'border-radius:3px' : 'border-radius:50%'};display:block;"
                         onerror="this.style.display='none'" draggable="false">${badge}
                </span>`;
            }).join('');

            // 桌面版：逐枚可點擊按鈕
            const desktopHTML = items.map(item => {
                const isBill = item.denom >= 100;
                const w = isBill ? 72 : 50;
                return `<button class="b1-coin-clickable"
                    data-item-idx="${itemIdx}" data-coin-idx="${item.coinIdx}" data-denom="${item.denom}"
                    aria-label="${item.denom}元"
                    style="${isBill ? 'border-radius:4px' : 'border-radius:50%'}">
                    <img src="../images/money/${item.denom}_yuan_${item.face}.png" alt="${item.denom}元"
                         style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};${isBill ? 'border-radius:4px' : 'border-radius:50%'};display:block;pointer-events:none;"
                         onerror="this.style.display='none'" draggable="false">
                </button>`;
            }).join('');

            return `<span class="b1-mic-desktop">${desktopHTML}</span><span class="b1-mic-mobile">${mobileHTML}</span>`;
        },

        _generateChoices(correct) {
            const candidates = new Set([correct]);
            const offsets = [10, 20, 15, 30, 25, 5, 40, 50];
            let i = 0;
            while (candidates.size < 3 && i < offsets.length * 2) {
                const sign = i % 2 === 0 ? 1 : -1;
                const c = correct + sign * offsets[Math.floor(i / 2)];
                if (c > 0) candidates.add(c);
                i++;
            }
            return [...candidates].sort(() => Math.random() - 0.5);
        },

        // 困難模式逐項朗讀（含各項金額）
        _speakItemsOneByOneHard(curr) {
            const items = curr.items;
            let idx = 0;
            const next = () => {
                if (idx < items.length) {
                    const it = items[idx++];
                    Game.Speech.speak(`${it.name}，${toTWD(it.cost)}`);
                    Game.TimerManager.setTimeout(next, 1000, 'speech');
                }
            };
            next();
        },

        // ── 圖示放大彈窗 ──────────────────────────────────────────
        _showIconZoomModal(curr) {
            document.getElementById('b1-icon-zoom-modal')?.remove();
            const modal = document.createElement('div');
            modal.id = 'b1-icon-zoom-modal';
            modal.className = 'b1-icon-zoom-overlay';
            const content = curr.imageFile
                ? `<img src="../images/b1/${curr.imageFile}" alt="${curr.label}" class="b1-zoom-img" onerror="this.style.display='none'">`
                : `<span class="b1-zoom-emoji">${curr.icon}</span>`;
            modal.innerHTML = `
                <div class="b1-icon-zoom-box">
                    ${content}
                    <div class="b1-zoom-label">今天去：${fmtLabel(curr.label)}</div>
                    <div class="b1-zoom-tap">點任意處關閉</div>
                </div>`;
            document.body.appendChild(modal);
            modal.addEventListener('click', () => modal.remove());
        },

        // ── Phase 1 事件繫結 ──────────────────────────────────────
        _bindPhase1Events(curr, diff) {
            const isHard = diff === 'hard';

            Game.EventManager.on(document.getElementById('back-to-settings'), 'click', () => {
                this.showSettings();
            }, {}, 'gameUI');

            Game.EventManager.on(document.getElementById('replay-speech-btn'), 'click', () => {
                const text = this.state.quiz.lastSpeechText;
                if (text) Game.Speech.speak(text);
            }, {}, 'gameUI');

            Game.EventManager.on(document.getElementById('reward-btn-game'), 'click', () => {
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'gameUI');

            // 圖示點擊放大
            const iconTrigger = document.getElementById('b1-scene-icon-trigger');
            if (iconTrigger) {
                Game.EventManager.on(iconTrigger, 'click', () => this._showIconZoomModal(curr), {}, 'gameUI');
            }

            // 提示鈕（行程卡右側，普通/困難顯示）
            const hintBtn = document.getElementById('hint-btn');
            if (hintBtn) {
                Game.EventManager.on(hintBtn, 'click', () => {
                    // 普通/困難：在未答對的 ？框上方顯示金額數字提示
                    this._showPhase1AmountHints(curr);
                }, {}, 'gameUI');
            }
            if (diff === 'easy') {
                // 簡單模式：綁定可點擊金幣，逐項揭露後自動進入 Phase 2
                this._bindB1EasyModeCoins(curr);
                if (this.state.settings.clickMode === 'on') {
                    Game.TimerManager.setTimeout(() => AssistClick.activate(curr), 600, 'ui');
                }
            } else if (diff === 'normal') {
                // 普通模式：逐項點選金額（3選1 中央彈窗）
                this._bindB1NormalItemChoices(curr);
                if (this.state.settings.customItemsEnabled) this._bindCustomItemsPanel(curr);
            } else {
                // 困難模式：逐項輸入金額（中央數字鍵盤彈窗）
                this._bindB1HardItemBoxes(curr);
                this._bindCalculator();
                if (this.state.settings.customItemsEnabled) this._bindCustomItemsPanel(curr);
            }
        },

        // ── Easy 模式：行程項目金幣點擊綁定（逐項揭露）─────────────
        _bindB1EasyModeCoins(curr) {
            const q = this.state.quiz;
            const items = this._getEffectiveItems(curr);

            // 計算每個項目的硬幣總數
            const totalCoinsPerItem = items.map(it => {
                const denoms = [1000, 500, 100, 50, 10, 5, 1];
                let rem = it.cost, cnt = 0;
                for (const d of denoms) { if (rem <= 0) break; const n = Math.floor(rem / d); cnt += n; rem -= n * d; }
                return cnt;
            });
            items.forEach((_, i) => { q.easyCoinsClicked[i] = 0; q.easyEventTotals[i] = 0; });

            document.querySelectorAll('.b1-coin-clickable').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    if (btn.classList.contains('b1-coin-clicked') || btn.disabled) return;
                    const itemIdx = parseInt(btn.dataset.itemIdx);
                    // Guard: 只允許點擊當前已揭露項目
                    if (itemIdx > q.easyRevealedUpTo) return;
                    const denom = parseInt(btn.dataset.denom);

                    btn.classList.add('b1-coin-clicked');
                    btn.disabled = true;
                    const bck = document.createElement('span');
                    bck.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#10b981;color:white;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;z-index:2;pointer-events:none;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,0.3);';
                    bck.textContent = '✓';
                    btn.appendChild(bck);
                    q.easyCoinsClicked[itemIdx] = (q.easyCoinsClicked[itemIdx] || 0) + 1;
                    q.easyRunningTotal += denom;
                    q.easyEventTotals[itemIdx] = (q.easyEventTotals[itemIdx] || 0) + denom;

                    // 隨著點擊更新該項目的金額顯示
                    const costEl = document.getElementById(`b1-item-cost-${itemIdx}`);
                    if (costEl) costEl.textContent = `${q.easyEventTotals[itemIdx]} 元`;

                    this.audio.play('click');

                    // 該項目所有金幣點完 → 語音播完後再揭露下一項
                    if (q.easyCoinsClicked[itemIdx] >= totalCoinsPerItem[itemIdx]) {
                        if (costEl) costEl.classList.add('b1-item-cost-revealed');
                        // 等語音播完才揭露下一項（Change 3）
                        Game.Speech.speak(`${q.easyEventTotals[itemIdx]}元`, () => {
                            this._revealNextB1Item(itemIdx + 1, curr, items, totalCoinsPerItem);
                        });
                    } else {
                        Game.Speech.speak(`${q.easyEventTotals[itemIdx]}元`);
                    }
                }, {}, 'gameUI');
            });
        },

        // ── Easy 模式：揭露下一個行程項目（或完成）────────────────
        _revealNextB1Item(idx, curr, items, totalCoinsPerItem) {
            const q = this.state.quiz;
            if (idx < items.length) {
                // 揭露第 idx 個項目
                const el = document.getElementById(`b1-cip-base-${idx}`);
                if (el) {
                    el.classList.remove('b1-item-seq-hidden');
                    el.style.animationDelay = ''; // 清除初始渲染的 stagger delay，防止揭露動畫延遲閃爍
                    el.classList.add('b1-item-seq-reveal');
                }
                q.easyRevealedUpTo = idx;
                Game.TimerManager.setTimeout(() => {
                    Game.Speech.speak(`${items[idx].name}，請點擊金錢圖示`);
                }, 200, 'speech');
            } else {
                // 全部完成 → 揭露總計，煙火，播完整總計語音，再進 Phase 2（Change 4）
                const diff = this.state.settings.difficulty;
                const effectiveTotal = this._getEffectiveTotal(curr);
                const totalAmtEl = document.getElementById('b1-easy-total-amt');
                if (totalAmtEl) totalAmtEl.textContent = `${effectiveTotal} 元`;
                this.audio.play('correct');
                this._fireConfetti();
                Game.TimerManager.setTimeout(() => {
                    Game.Speech.speak(`太棒了！總共需要帶${toTWD(effectiveTotal)}，出發囉！`, () => {
                        Game.TimerManager.setTimeout(() => {
                            this._renderPhase2(curr, diff);
                        }, 400, 'ui');
                    });
                }, 300, 'ui');
            }
        },

        // ── Normal 模式：逐項金額選擇（3選1 中央彈窗）──────────────
        _bindB1NormalItemChoices(curr) {
            const q = this.state.quiz;
            const items = this._getEffectiveItems(curr);
            q.itemsCorrect = new Array(items.length).fill(false);

            document.querySelectorAll('.b1-item-box-btn').forEach(box => {
                Game.EventManager.on(box, 'click', () => {
                    if (box.classList.contains('b1-item-cost-revealed')) return;
                    const itemIdx = parseInt(box.dataset.itemIdx);
                    const correct = parseInt(box.dataset.cost);
                    this._showB1NormalChoices(itemIdx, correct, curr, items);
                }, {}, 'gameUI');
            });
        },

        _showB1NormalChoices(itemIdx, correct, curr, items) {
            const existing = document.getElementById('b1-nchoice-modal-overlay');
            if (existing) existing.remove();
            const choices = this._generateChoices(correct).sort(() => Math.random() - 0.5);
            const overlay = document.createElement('div');
            overlay.id = 'b1-nchoice-modal-overlay';
            overlay.className = 'b1-nchoice-modal-overlay';
            overlay.innerHTML = `
                <div class="b1-nchoice-modal">
                    <div class="b1-nchoice-title">📌 ${items[itemIdx].name} 需要幾元？</div>
                    <div class="b1-nchoice-btns">
                        ${choices.map(amt => `
                        <button class="b1-nchoice-btn" data-amount="${amt}">
                            ${amt} 元
                        </button>`).join('')}
                    </div>
                </div>`;
            document.body.appendChild(overlay);

            overlay.querySelectorAll('.b1-nchoice-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const chosen = parseInt(btn.dataset.amount);
                    window.LearningTracker?.logStep?.(`Phase1：算商品價格`, chosen === correct);
                    if (chosen === correct) {
                        overlay.remove();
                        this.audio.play('correct');
                        const box = document.getElementById(`b1-item-cost-${itemIdx}`);
                        if (box) {
                            box.textContent = `${correct} 元`;
                            box.classList.add('b1-item-cost-revealed');
                            box.disabled = true;
                        }
                        // 金錢圖示保留顯示（答對後仍可見）
                        const q = this.state.quiz;
                        q.itemsCorrect[itemIdx] = true;
                        Game.Speech.speak(`${correct}元，答對了！`, () => {
                            this._checkB1AllItemsCorrect(curr, items);
                        });
                    } else {
                        window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                        this.audio.play('error');
                        btn.classList.add('b1-nchoice-wrong');
                        Game.TimerManager.setTimeout(() => btn.classList.remove('b1-nchoice-wrong'), 600, 'ui');
                        Game.Speech.speak('不對喔，請再試一次');
                    }
                });
            });

            // 點外部關閉
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) { window.speechSynthesis.cancel(); overlay.remove(); }
            });
        },

        // ── Hard 模式：逐項金額輸入（中央數字鍵盤彈窗）─────────────
        _bindB1HardItemBoxes(curr) {
            const q = this.state.quiz;
            const items = this._getEffectiveItems(curr);
            q.itemsCorrect = new Array(items.length).fill(false);

            document.querySelectorAll('.b1-item-box-btn:not(#b1-total-box-btn)').forEach(box => {
                Game.EventManager.on(box, 'click', () => {
                    if (box.classList.contains('b1-item-cost-revealed')) return;
                    const itemIdx = parseInt(box.dataset.itemIdx);
                    const correct = parseInt(box.dataset.cost);
                    this._showB1HardNumpad(itemIdx, correct, curr, items);
                }, {}, 'gameUI');
            });

            // 總計問號框（初始 disabled，所有費用項目答對後啟用）
            const totalBtn = document.getElementById('b1-total-box-btn');
            if (totalBtn) {
                Game.EventManager.on(totalBtn, 'click', () => {
                    if (totalBtn.disabled || totalBtn.classList.contains('b1-item-cost-revealed')) return;
                    this._showB1TotalNumpad(curr);
                }, {}, 'gameUI');
            }
        },

        _showB1HardNumpad(itemIdx, correct, curr, items) {
            const existing = document.getElementById('b1-ht-modal-overlay');
            if (existing) existing.remove();
            const overlay = document.createElement('div');
            overlay.id = 'b1-ht-modal-overlay';
            overlay.className = 'b1-ht-modal-overlay';
            let inputVal = '';
            overlay.innerHTML = `
                <div class="b1-ht-modal" style="position:relative;">
                    <button id="b1-ht-modal-close-btn" style="position:absolute;top:8px;right:8px;background:none;border:none;font-size:1.2rem;cursor:pointer;color:#9ca3af;line-height:1;padding:0;">✕</button>
                    <div class="b1-ht-modal-title">📌 ${items[itemIdx].name} 需要幾元？</div>
                    <div class="b1-ht-modal-display" id="b1-ht-modal-display">___</div>
                    <div class="b1-ht-modal-numpad">
                        ${[1,2,3,4,5,6,7,8,9,'back',0,'ok'].map(k => {
                            if (k === 'back') return `<button class="b1-ht-modal-key b1-ht-modal-back" data-k="back">⌫</button>`;
                            if (k === 'ok') return `<button class="b1-ht-modal-key b1-ht-modal-ok" data-k="ok">✓</button>`;
                            return `<button class="b1-ht-modal-key" data-k="${k}">${k}</button>`;
                        }).join('')}
                    </div>
                    <div class="b1-ht-modal-error" id="b1-ht-modal-error" style="display:none"></div>
                </div>`;
            document.body.appendChild(overlay);
            document.getElementById('b1-ht-modal-close-btn')?.addEventListener('click', () => overlay.remove());

            const dispEl = document.getElementById('b1-ht-modal-display');
            const errEl  = document.getElementById('b1-ht-modal-error');
            const updateDisp = () => { if (dispEl) dispEl.textContent = inputVal || '___'; };

            overlay.querySelectorAll('.b1-ht-modal-key').forEach(key => {
                key.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const k = key.dataset.k;
                    if (k === 'back') {
                        inputVal = inputVal.slice(0, -1);
                        this.audio.play('click');
                    } else if (k === 'ok') {
                        const entered = parseInt(inputVal, 10);
                        if (!inputVal || isNaN(entered)) return;
                        window.LearningTracker?.logStep?.(`Phase1：算商品價格`, entered === correct);
                        if (entered === correct) {
                            overlay.remove();
                            this.audio.play('correct');
                            const box = document.getElementById(`b1-item-cost-${itemIdx}`);
                            if (box) {
                                box.textContent = `${correct} 元`;
                                box.classList.add('b1-item-cost-revealed');
                                box.disabled = true;
                            }
                            const q = this.state.quiz;
                            q.itemsCorrect[itemIdx] = true;
                            Game.Speech.speak(`${correct}元，答對了！`, () => {
                                this._checkB1AllItemsCorrect(curr, items);
                            });
                        } else {
                            window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                            this.audio.play('error');
                            inputVal = '';
                            updateDisp();
                            const isOver = entered > correct;
                            const errMsg = isOver ? '算多了，再想想看！' : '算少了，再想想看！';
                            if (errEl) { errEl.textContent = `❌ ${errMsg}`; errEl.style.display = ''; }
                            Game.Speech.speak(`不對喔，${errMsg}`);
                        }
                    } else {
                        const next = inputVal + k;
                        if (parseInt(next, 10) <= 99999) { inputVal = next; this.audio.play('click'); }
                    }
                    updateDisp();
                });
            });

            // 點外部關閉
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });

            // 播語音提示
            Game.Speech.speak(`${items[itemIdx].name}，需要幾元？`);
        },

        // ── 困難模式：總計問號框彈窗（中央數字鍵盤）────────────────
        _showB1TotalNumpad(curr) {
            const existing = document.getElementById('b1-total-np-overlay');
            if (existing) existing.remove();
            const correctTotal = this._getEffectiveTotal(curr);
            const diff = this.state.settings.difficulty;
            const overlay = document.createElement('div');
            overlay.id = 'b1-total-np-overlay';
            overlay.className = 'b1-ht-modal-overlay';
            let inputVal = '';
            overlay.innerHTML = `
                <div class="b1-ht-modal" style="position:relative;">
                    <button id="b1-tnp-close-btn" style="position:absolute;top:8px;right:8px;background:none;border:none;font-size:1.2rem;cursor:pointer;color:#9ca3af;line-height:1;padding:0;">✕</button>
                    <div class="b1-ht-modal-title">📊 總計金額是多少元？</div>
                    <div class="b1-ht-modal-display" id="b1-tnp-display">___</div>
                    <div class="b1-ht-modal-numpad">
                        ${[1,2,3,4,5,6,7,8,9,'back',0,'ok'].map(k => {
                            if (k === 'back') return `<button class="b1-ht-modal-key b1-ht-modal-back" data-k="back">⌫</button>`;
                            if (k === 'ok') return `<button class="b1-ht-modal-key b1-ht-modal-ok" data-k="ok">✓</button>`;
                            return `<button class="b1-ht-modal-key" data-k="${k}">${k}</button>`;
                        }).join('')}
                    </div>
                    <div class="b1-ht-modal-error" id="b1-tnp-error" style="display:none"></div>
                </div>`;
            document.body.appendChild(overlay);
            document.getElementById('b1-tnp-close-btn')?.addEventListener('click', () => overlay.remove());

            const dispEl = document.getElementById('b1-tnp-display');
            const errEl  = document.getElementById('b1-tnp-error');
            const updateDisp = () => { if (dispEl) dispEl.textContent = inputVal || '___'; };
            const q = this.state.quiz;

            overlay.querySelectorAll('.b1-ht-modal-key').forEach(key => {
                key.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const k = key.dataset.k;
                    if (k === 'back') {
                        inputVal = inputVal.slice(0, -1);
                        this.audio.play('click');
                    } else if (k === 'ok') {
                        const entered = parseInt(inputVal, 10);
                        if (!inputVal || isNaN(entered)) return;
                        window.LearningTracker?.logStep?.(`Phase1：算總金額`, entered === correctTotal);
                        if (entered === correctTotal) {
                            overlay.remove();
                            this.audio.play('correct');
                            const totalBtn = document.getElementById('b1-total-box-btn');
                            if (totalBtn) {
                                totalBtn.textContent = `${correctTotal} 元`;
                                totalBtn.classList.add('b1-item-cost-revealed');
                                totalBtn.disabled = true;
                            }
                            // 算式答案揭露
                            const ansEl = document.querySelector('#b1-total-formula .b1-tf-ans');
                            if (ansEl) { ansEl.textContent = String(correctTotal); ansEl.style.color = '#16a34a'; }
                            this._fireConfetti();
                            Game.Speech.speak(`答對了！總共${toTWD(correctTotal)}，出發囉！`, () => {
                                this._renderPhase2(curr, diff);
                            });
                        } else {
                            window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                            this.audio.play('error');
                            inputVal = '';
                            updateDisp();
                            q.errorCount = (q.errorCount || 0) + 1;
                            const isOver = entered > correctTotal;
                            const errMsg = isOver ? '算多了，再想想看！' : '算少了，再想想看！';
                            if (errEl) { errEl.textContent = `❌ ${errMsg}`; errEl.style.display = ''; }
                            Game.Speech.speak(`不對喔，${errMsg}`);
                        }
                    } else {
                        const next = inputVal + k;
                        if (parseInt(next, 10) <= 99999) { inputVal = next; this.audio.play('click'); }
                    }
                    updateDisp();
                });
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });

            Game.Speech.speak('請計算所有費用的總計金額。');
        },

        // ── 檢查所有項目是否已答對（普通/困難）────────────────────
        _checkB1AllItemsCorrect(curr, items) {
            const q = this.state.quiz;
            if (!q.itemsCorrect.every(Boolean)) return;
            if ((q.customItemsPendingCount || 0) > 0) return;
            const effectiveTotal = this._getEffectiveTotal(curr);
            const totalAmtEl = document.getElementById('b1-easy-total-amt');
            if (totalAmtEl) totalAmtEl.textContent = `${effectiveTotal} 元`;
            const diff = this.state.settings.difficulty;
            this.audio.play('correct');

            if (diff === 'hard') {
                // 困難模式：啟用總計問號框 + 顯示算式，讓學生點擊後輸入
                Game.TimerManager.setTimeout(() => {
                    const totalBtn = document.getElementById('b1-total-box-btn');
                    if (totalBtn) {
                        totalBtn.disabled = false;
                        totalBtn.classList.add('b1-total-box-ready');
                        totalBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                    this._showB1TotalFormula(curr);
                    Game.Speech.speak('每項金額都填好了！請點擊總計的問號，輸入全部金額的總和。');
                }, 400, 'ui');
            } else {
                Game.TimerManager.setTimeout(() => {
                    Game.Speech.speak(`總共需要帶${toTWD(effectiveTotal)}，出發囉！`, () => {
                        this._renderPhase2(curr, diff);
                    });
                }, 400, 'ui');
            }
        },

        // ── 自訂項目：數字鍵盤彈窗（答題用）────────────────────────
        _showB1CustomItemNumpad(btn, cost, curr) {
            const q = this.state.quiz;
            document.getElementById('b1-cip-numpad-overlay')?.remove();
            let inputVal = '';
            const overlay = document.createElement('div');
            overlay.id = 'b1-cip-numpad-overlay';
            overlay.className = 'b1-nchoice-modal-overlay';
            overlay.innerHTML = `
                <div class="b1-nchoice-modal" style="width:300px;max-width:92vw;padding:20px 16px;box-sizing:border-box;">
                    <div class="b1-nchoice-title">📌 這個項目需要幾元？</div>
                    <div id="b1-cip-np-disp" style="font-size:1.5rem;font-weight:bold;text-align:center;padding:8px 10px;background:#f3f4f6;border-radius:10px;margin:0 0 10px;">___</div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%;box-sizing:border-box;">
                        ${[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k => `<button class="b1-nchoice-btn" data-cipnp="${k}" style="padding:10px 4px;font-size:1.1rem;min-width:0;display:block;width:100%;">${k}</button>`).join('')}
                    </div>
                    <div id="b1-cip-np-err" style="color:#ef4444;font-size:13px;text-align:center;margin-top:4px;display:none;"></div>
                </div>`;
            document.body.appendChild(overlay);
            const disp = overlay.querySelector('#b1-cip-np-disp');
            const errEl = overlay.querySelector('#b1-cip-np-err');
            const updateDisp = () => { disp.textContent = inputVal || '___'; };
            overlay.querySelectorAll('[data-cipnp]').forEach(npBtn => {
                npBtn.addEventListener('click', () => {
                    const k = npBtn.dataset.cipnp;
                    if (k === '⌫') { inputVal = inputVal.slice(0, -1); }
                    else if (k === '✓') {
                        const entered = parseInt(inputVal);
                        window.LearningTracker?.logStep?.(`Phase1：算商品價格`, entered === cost);
                        if (entered === cost) {
                            overlay.remove();
                            this.audio.play('correct');
                            btn.textContent = `${cost} 元`;
                            btn.classList.add('b1-item-cost-revealed');
                            btn.disabled = true;
                            q.customItemsPendingCount = Math.max(0, (q.customItemsPendingCount || 0) - 1);
                            Game.Speech.speak(`${cost}元，答對了！`, () => {
                                this._checkB1AllItemsCorrect(curr, this._getEffectiveItems(curr));
                            });
                        } else {
                            window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                            this.audio.play('error');
                            inputVal = '';
                            const isOver = entered > cost;
                            errEl.textContent = `❌ ${isOver ? '算多了' : '算少了'}，再想想看！`;
                            errEl.style.display = '';
                            Game.TimerManager.setTimeout(() => { errEl.style.display = 'none'; }, 1500, 'ui');
                            Game.Speech.speak(`不對喔，${isOver ? '算多了' : '算少了'}，再想想看`);
                        }
                        updateDisp();
                        return;
                    } else {
                        errEl.style.display = 'none';
                        const next = inputVal + k;
                        if (parseInt(next, 10) <= 99999) inputVal = next;
                    }
                    this.audio.play('keypad');
                    updateDisp();
                });
            });
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
            Game.Speech.speak('這個項目需要幾元？');
        },

        // ── 自訂項目：普通模式 3選1 彈窗（答題用）──────────────────
        _showB1CustomItemChoices(btn, cost, curr) {
            document.getElementById('b1-cip-choices-overlay')?.remove();
            const choices = this._generateChoices(cost).sort(() => Math.random() - 0.5);
            const overlay = document.createElement('div');
            overlay.id = 'b1-cip-choices-overlay';
            overlay.className = 'b1-nchoice-modal-overlay';
            overlay.innerHTML = `
                <div class="b1-nchoice-modal">
                    <div class="b1-nchoice-title">📌 這個項目需要幾元？</div>
                    <div class="b1-nchoice-btns">
                        ${choices.map(amt => `<button class="b1-nchoice-btn" data-amount="${amt}">${amt} 元</button>`).join('')}
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            const q = this.state.quiz;
            overlay.querySelectorAll('.b1-nchoice-btn').forEach(choiceBtn => {
                choiceBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const chosen = parseInt(choiceBtn.dataset.amount);
                    window.LearningTracker?.logStep?.(`Phase1：算商品價格`, chosen === cost);
                    if (chosen === cost) {
                        overlay.remove();
                        this.audio.play('correct');
                        btn.textContent = `${cost} 元`;
                        btn.classList.add('b1-item-cost-revealed');
                        btn.disabled = true;
                        q.customItemsPendingCount = Math.max(0, (q.customItemsPendingCount || 0) - 1);
                        Game.Speech.speak(`${cost}元，答對了！`, () => {
                            this._checkB1AllItemsCorrect(curr, this._getEffectiveItems(curr));
                        });
                    } else {
                        window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                        this.audio.play('error');
                        choiceBtn.classList.add('b1-nchoice-wrong');
                        Game.TimerManager.setTimeout(() => choiceBtn.classList.remove('b1-nchoice-wrong'), 600, 'ui');
                        Game.Speech.speak('不對喔，請再試一次');
                    }
                });
            });
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        },

        // ── 新增自訂項目時「金額」欄位的數字鍵盤彈窗 ──────────────────
        _showB1AddCostNumpad(onConfirm) {
            document.getElementById('b1-add-cost-numpad-overlay')?.remove();
            let inputVal = '';
            const overlay = document.createElement('div');
            overlay.id = 'b1-add-cost-numpad-overlay';
            overlay.className = 'b1-nchoice-modal-overlay';
            overlay.innerHTML = `
                <div class="b1-nchoice-modal" style="width:300px;max-width:92vw;padding:20px 16px;box-sizing:border-box;">
                    <div class="b1-nchoice-title">💰 請輸入金額（元）</div>
                    <div id="b1-add-cost-disp" style="font-size:1.5rem;font-weight:bold;text-align:center;padding:8px 10px;background:#f3f4f6;border-radius:10px;margin:0 0 10px;">___</div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%;box-sizing:border-box;">
                        ${[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k => `<button class="b1-nchoice-btn" data-addcost="${k}" style="padding:10px 4px;font-size:1.1rem;min-width:0;display:block;width:100%;">${k}</button>`).join('')}
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            const disp = overlay.querySelector('#b1-add-cost-disp');
            const update = () => { disp.textContent = inputVal || '___'; };
            overlay.querySelectorAll('[data-addcost]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const k = btn.dataset.addcost;
                    if (k === '⌫') { inputVal = inputVal.slice(0, -1); }
                    else if (k === '✓') {
                        const val = parseInt(inputVal);
                        if (val >= 1) {
                            overlay.remove();
                            onConfirm(val);
                        } else {
                            disp.style.color = '#ef4444';
                            Game.TimerManager.setTimeout(() => { disp.style.color = ''; }, 500, 'ui');
                        }
                        return;
                    } else {
                        const next = inputVal + k;
                        if (parseInt(next, 10) <= 99999) inputVal = next;
                    }
                    this.audio.play('keypad');
                    update();
                });
            });
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        },

        // ── 自訂項目面板事件繫結 ──────────────────────────────────
        _bindCustomItemsPanel(curr) {
            const diff = this.state.settings.difficulty;
            // 刪除/還原原有項目（✕ 按鈕現在直接在 b1-schedule-item 裡）
            document.querySelectorAll('[data-base-idx]').forEach(delBtn => {
                Game.EventManager.on(delBtn, 'click', () => {
                    const idx = parseInt(delBtn.dataset.baseIdx);
                    curr.items[idx]._deleted = !curr.items[idx]._deleted;
                    const row = document.getElementById(`b1-cip-base-${idx}`);
                    if (row) row.classList.toggle('b1-cip-deleted', !!curr.items[idx]._deleted);
                    this._updateCustomTotalPreview(curr);
                    this.audio.play('click');
                }, {}, 'gameUI');
            });

            // 攔截「金額」輸入框：改用數字鍵盤彈窗，避免原生鍵盤
            const costInputEl = document.getElementById('b1-cip-cost-input');
            if (costInputEl) {
                Game.EventManager.on(costInputEl, 'click', (e) => {
                    e.preventDefault();
                    costInputEl.blur();
                    this._showB1AddCostNumpad(val => { costInputEl.value = val; });
                }, {}, 'gameUI');
                Game.EventManager.on(costInputEl, 'focus', () => { costInputEl.blur(); }, {}, 'gameUI');
            }

            // 新增項目
            const addBtn = document.getElementById('b1-cip-add-btn');
            if (addBtn) {
                Game.EventManager.on(addBtn, 'click', () => {
                    const nameEl = document.getElementById('b1-cip-name-input');
                    const costEl = document.getElementById('b1-cip-cost-input');
                    const name = nameEl ? nameEl.value.trim() : '';
                    const cost = costEl ? parseInt(costEl.value) : 0;
                    if (!name || !cost || cost < 1) return;
                    const q = this.state.quiz;
                    q.customItems.push({ name, cost });
                    const customIdx = q.customItems.length - 1;
                    const list = document.getElementById('b1-cip-custom-list');
                    if (list) {
                        q.customItemsPendingCount = (q.customItemsPendingCount || 0) + 1;
                        const moneyIconsHtml = this._renderMoneyIconsGrouped(cost);
                        const row = document.createElement('div');
                        row.className = 'b1-schedule-item b1-cip-custom-row b1-item-enter';
                        row.id = `b1-cip-custom-${customIdx}`;
                        row.innerHTML = `
                            <div class="b1-item-top">
                                <span class="b1-item-name">📌 ${name}</span>
                                <button class="b1-cip-del-btn" data-custom-idx="${customIdx}">✕</button>
                            </div>
                            <div class="b1-item-bottom">
                                <div class="b1-item-money-icons b1-item-icons-static">${moneyIconsHtml}</div>
                                <button class="b1-cip-cost-btn" id="b1-cip-cost-btn-${customIdx}">？元</button>
                            </div>`;
                        list.appendChild(row);
                        // 綁定 ? 框（普通→3選1，困難→數字鍵盤）
                        const costBtn = row.querySelector('.b1-cip-cost-btn');
                        if (costBtn) {
                            Game.EventManager.on(costBtn, 'click', () => {
                                if (costBtn.classList.contains('b1-item-cost-revealed')) return;
                                if (diff === 'normal') {
                                    this._showB1CustomItemChoices(costBtn, cost, curr);
                                } else {
                                    this._showB1CustomItemNumpad(costBtn, cost, curr);
                                }
                            }, {}, 'gameUI');
                        }
                        // 刪除自訂項目
                        const delBtn2 = row.querySelector('[data-custom-idx]');
                        if (delBtn2) {
                            Game.EventManager.on(delBtn2, 'click', () => {
                                const ci = parseInt(delBtn2.dataset.customIdx);
                                q.customItems[ci]._deleted = true;
                                // 若 ? 框未答對，減少待答計數
                                const cb = document.getElementById(`b1-cip-cost-btn-${ci}`);
                                if (cb && !cb.classList.contains('b1-item-cost-revealed')) {
                                    q.customItemsPendingCount = Math.max(0, (q.customItemsPendingCount || 0) - 1);
                                    this._checkB1AllItemsCorrect(curr, this._getEffectiveItems(curr));
                                }
                                row.remove();
                                this._updateCustomTotalPreview(curr);
                                this.audio.play('click');
                            }, {}, 'gameUI');
                        }
                    }
                    if (nameEl) nameEl.value = '';
                    if (costEl) costEl.value = '';
                    this._updateCustomTotalPreview(curr);
                    this.audio.play('click');
                }, {}, 'gameUI');
            }
        },

        _bindTotalNumpad(curr, diff) {
            const q = this.state.quiz;
            const display   = document.getElementById('b1-ht-display');
            const errorEl   = document.getElementById('b1-ht-error');

            const updateDisplay = () => {
                if (display) display.textContent = q.hardTotalInput || '___';
            };

            document.querySelectorAll('.b1-ht-digit').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    const d = btn.dataset.digit;
                    if (d === 'back') {
                        q.hardTotalInput = (q.hardTotalInput || '').slice(0, -1);
                    } else {
                        const next = (q.hardTotalInput || '') + d;
                        if (parseInt(next, 10) <= 99999) q.hardTotalInput = next;
                    }
                    this.audio.play('keypad');
                    updateDisplay();
                }, {}, 'gameUI');
            });

            const confirmBtn = document.getElementById('b1-ht-confirm');
            if (confirmBtn) {
                Game.EventManager.on(confirmBtn, 'click', () => {
                    const entered = parseInt(q.hardTotalInput, 10);
                    if (!q.hardTotalInput || isNaN(entered)) return;
                    const correctTotal = this._getEffectiveTotal(curr);
                    if (entered === correctTotal) {
                        // 正確！語音播完後自動進入 Phase 2
                        this.audio.play('correct');
                        if (errorEl) errorEl.style.display = 'none';
                        this._showFeedback('✅', '算對了！');
                        if (display) { display.textContent = correctTotal; display.classList.add('b1-ht-correct'); }
                        confirmBtn.disabled = true;
                        document.querySelectorAll('.b1-ht-digit').forEach(b => { b.disabled = true; });
                        Game.Speech.speak(`答對了！總共${toTWD(correctTotal)}`, () => {
                            this._renderPhase2(curr, diff);
                        });
                    } else {
                        // 錯誤
                        window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                        this.audio.play('error');
                        q.errorCount = (q.errorCount || 0) + 1;
                        const isOver = entered > correctTotal;
                        const errMsg = isOver ? `算多了，再算算看！` : `算少了，再算算看！`;
                        if (errorEl) {
                            errorEl.textContent = `❌ ${errMsg}`;
                            errorEl.style.display = '';
                        }
                        Game.Speech.speak(`不對喔，${errMsg}`);
                        q.hardTotalInput = '';
                        updateDisplay();
                        // 3次錯誤後自動提示
                        if (q.errorCount >= 3) {
                            Game.TimerManager.setTimeout(() => {
                                const effectiveItems = this._getEffectiveItems(curr);
                                const parts = effectiveItems.map(it => `${it.name}${toTWD(it.cost)}`).join('，');
                                Game.Speech.speak(`${parts}，加起來是${toTWD(correctTotal)}`);
                                if (errorEl) {
                                    errorEl.textContent = `💡 提示：${effectiveItems.map(it => `${it.cost}`).join(' + ')} = ${correctTotal}`;
                                    errorEl.style.display = '';
                                    errorEl.classList.add('b1-ht-hint');
                                }
                            }, 600, 'ui');
                        }
                    }
                }, {}, 'gameUI');
            }

        },

        // ── Phase 2 事件繫結 ──────────────────────────────────────
        _bindPhase2Events(curr) {
            this._setupDragDrop();

            // 圖示點擊放大
            const iconTrigger = document.getElementById('b1-scene-icon-trigger');
            if (iconTrigger) {
                Game.EventManager.on(iconTrigger, 'click', () => this._showIconZoomModal(curr), {}, 'gameUI');
            }

            Game.EventManager.on(document.getElementById('confirm-btn'), 'click', () => {
                this.handleConfirm(this._getEffectiveTotal(curr));
            }, {}, 'gameUI');

            // 普通/困難：✕ 按鈕移除錢包幣
            const walletCoinsEl = document.getElementById('wallet-coins');
            if (walletCoinsEl) {
                Game.EventManager.on(walletCoinsEl, 'click', (e) => {
                    const btn = e.target.closest('.b1-wc-remove');
                    if (!btn) return;
                    const uid = parseInt(btn.dataset.uid);
                    if (!isNaN(uid)) this.removeCoin(uid);
                }, {}, 'gameUI');

                // 普通/困難：從錢包拖回拖曳盤
                Game.EventManager.on(walletCoinsEl, 'dragstart', (e) => {
                    const coinEl = e.target.closest('.b1-wc-removable');
                    if (!coinEl) return;
                    const uid = parseInt(coinEl.dataset.uid);
                    if (isNaN(uid)) return;
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', 'remove:' + uid);
                    coinEl.classList.add('b1-dragging');
                }, {}, 'gameUI');
                Game.EventManager.on(walletCoinsEl, 'dragend', (e) => {
                    const coinEl = e.target.closest('.b1-wc-removable');
                    if (coinEl) coinEl.classList.remove('b1-dragging');
                }, {}, 'gameUI');
            }

            // 拖曳盤接收「移回」事件
            const tray = document.querySelector('.b1-coin-tray');
            if (tray) {
                Game.EventManager.on(tray, 'dragover', (e) => {
                    if (e.dataTransfer.getData && e.dataTransfer.types.includes('text/plain')) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                    }
                }, {}, 'gameUI');
                Game.EventManager.on(tray, 'drop', (e) => {
                    e.preventDefault();
                    const data = e.dataTransfer.getData('text/plain');
                    if (data && data.startsWith('remove:')) {
                        const uid = parseInt(data.slice(7));
                        if (!isNaN(uid)) this.removeCoin(uid);
                    }
                }, {}, 'gameUI');
            }

            Game.EventManager.on(document.getElementById('back-to-settings'), 'click', () => {
                this.showSettings();
            }, {}, 'gameUI');

            // 提示鈕（在迷你參考卡右側，普通/困難模式）
            const hintBtn = document.getElementById('hint-btn');
            if (hintBtn) {
                Game.EventManager.on(hintBtn, 'click', () => {
                    // 普通/困難：揭露已放金額
                    const hintDiff = this.state.settings.difficulty;
                    if (hintDiff === 'hard' || hintDiff === 'normal') {
                        this.state.quiz.walletRevealed = true;
                        this._updateWalletDisplay();
                    }
                    this._showCoinHint();
                }, {}, 'gameUI');
            }

            Game.EventManager.on(document.getElementById('reward-btn-game'), 'click', () => {
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'gameUI');

            if (this.state.settings.clickMode === 'on') {
                Game.TimerManager.setTimeout(() => AssistClick.activate(curr), 600, 'ui');
            }
        },

        // 逐項朗讀費用（C2 逐項朗讀 pattern，Round 42）
        _speakItemsOneByOne(q) {
            const items = q.items;
            let idx = 0;
            const next = () => {
                if (idx < items.length) {
                    const it = items[idx++];
                    Game.Speech.speak(`${it.name}，${toTWD(it.cost)}`);
                    Game.TimerManager.setTimeout(next, 950, 'speech');
                } else {
                    Game.TimerManager.setTimeout(
                        () => Game.Speech.speak(`總共${toTWD(q.total)}`),
                        500, 'speech'
                    );
                }
            };
            next();
        },

        _renderHeader() {
            const q = this.state.quiz;
            const phase = q.phase || 1;
            const stepLabel = phase === 2 ? '步驟二：準備錢幣' : '步驟一：確認行程費用';
            const catLabels = { all:'全部', school:'學校 🏫', food:'飲食 🍜', outdoor:'戶外 🌿', entertainment:'娛樂 🎭', shopping:'購物 🛒' };
            const catLabel  = catLabels[this.state.settings.sceneCategory] || '';
            const centerText = catLabel && catLabel !== '全部' ? `${stepLabel} · ${catLabel}` : stepLabel;
            return `
            <div class="b-header">
                <div class="b-header-left">
                    <span class="b-header-unit">💰 今天帶多少錢</span>
                </div>
                <div class="b-header-center">${centerText}</div>
                <div class="b-header-right">
                    <span class="b-progress">第 ${q.currentQuestion + 1} 題 / 共 ${q.totalQuestions} 題</span>
                    <button class="b-reward-btn" id="reward-btn-game">🎁 獎勵</button>
                    <button class="b-back-btn" id="back-to-settings">返回設定</button>
                </div>
            </div>`;
        },

        _renderScheduleCard(q, showTotal, opts = {}) {
            const showItemAmounts = opts.showItemAmounts !== false; // default true
            const showHintBtn     = opts.showHintBtn    !== false; // default true
            const useCustom       = opts.useCustom      === true;
            const isHard     = this.state.settings.difficulty === 'hard';
            const isEasyMode = this.state.settings.difficulty === 'easy';
            // 刪除類別 emoji 徽章（Change 6）
            const catBadge = '';
            const itemsHtml = q.items.map((it, idx) => {
                const showAmt = showItemAmounts;
                // pctBar only for easy mode (since normal/hard use box-btn)
                const pctBar = showAmt && isEasyMode && q.total > 0
                    ? `<div class="b1-item-pct-bar-wrap"><div class="b1-item-pct-bar" style="width:${Math.round(it.cost / q.total * 100)}%"></div></div>`
                    : '';
                const delBtn = useCustom
                    ? `<button class="b1-cip-del-btn b1-item-del-btn" data-base-idx="${idx}" title="刪除">✕</button>`
                    : '';
                // Easy: clickable coins; Normal/Hard: static icons (revealable)
                let moneyIconsHtml = '';
                if (isEasyMode && showAmt) {
                    moneyIconsHtml = `<div class="b1-item-money-icons">${this._renderB1ClickableCoins(it.cost, idx)}</div>`;
                } else if (!isEasyMode && showAmt) {
                    moneyIconsHtml = `<div class="b1-item-money-icons b1-item-icons-static" id="b1-item-icons-${idx}">${this._renderItemMoneyIcons(it.cost)}</div>`;
                }
                // Easy sequential: items after idx 0 start hidden
                const seqHidden = isEasyMode && idx > 0 ? ' b1-item-seq-hidden' : '';
                // Cost display
                let costHtml;
                if (isEasyMode) {
                    costHtml = `<span class="b1-item-cost" id="b1-item-cost-${idx}">？元</span>`;
                } else {
                    // Normal/Hard: clickable box to open choice/numpad modal
                    costHtml = `<button class="b1-item-box-btn" id="b1-item-cost-${idx}" data-item-idx="${idx}" data-cost="${it.cost}">？元</button>`;
                }
                return `
                <div class="b1-schedule-item b1-item-enter${seqHidden}" id="b1-cip-base-${idx}" data-seq-idx="${idx}" style="animation-delay:${idx * 140 + 200}ms">
                    <div class="b1-item-top">
                        <span class="b1-item-name">📌 ${it.name}${catBadge}</span>
                        ${delBtn}
                    </div>
                    <div class="b1-item-bottom">
                        ${moneyIconsHtml}
                        ${costHtml}
                    </div>
                    ${pctBar}
                </div>`;
            }).join('');

            const totalTag = showTotal
                ? `<span class="b1-total-tag">${q.total} 元</span>`
                : '';

            // 提示按鈕（絕對定位於卡片右上角，non-easy 模式）
            const hintWrap = (showHintBtn && !isEasyMode)
                ? `<div class="b1-schedule-hint-wrap" id="b1-hint-wrap">
                       <img src="../images/common/hint_detective.png" alt="" class="b1-hint-mascot" onerror="this.style.display='none'">
                       <button class="b1-hint-btn" id="hint-btn" title="提示">💡 提示</button>
                   </div>`
                : '';

            const catColorMap = { school: 'b1-cat-school', food: 'b1-cat-food', outdoor: 'b1-cat-outdoor', entertainment: 'b1-cat-entertainment', shopping: 'b1-cat-shopping' };
            const catClass = catColorMap[q.cat] || '';

            // 自訂項目：新增清單在 total strip 上方，輸入列在 total strip 下方
            const customListAbove  = useCustom ? `<div id="b1-cip-custom-list"></div>` : '';
            const customAddBelow   = useCustom ? `
                <div class="b1-cip-add-row b1-cip-add-row-inline">
                    <input type="text" id="b1-cip-name-input" placeholder="項目名稱" maxlength="8" class="b1-cip-input">
                    <input type="number" id="b1-cip-cost-input" placeholder="金額" min="1" max="9999" class="b1-cip-input b1-cip-cost-inp">
                    <button class="b1-cip-add-btn" id="b1-cip-add-btn">＋ 新增</button>
                </div>` : '';

            // 圖示或 emoji（文字左側、圖示右側）
            const imgContent = q.imageFile
                ? `<img src="../images/b1/${q.imageFile}" alt="${q.label}" class="b1-scene-img-lg" onerror="this.style.display='none'">`
                : `<span class="b1-schedule-icon">${q.icon}</span>`;

            // 副標（普通/困難顯示）
            const subtitleRow = !isEasyMode ? `
                <div class="b1-sch-hdr-row2">
                    <span class="b1-sch-hdr-subtitle">需要帶這些錢${isHard ? `&nbsp;${totalTag}` : ''}</span>
                </div>` : '';

            return `
            <div class="b1-schedule-card ${catClass}${useCustom ? ' b1-custom-mode' : ''}">
                ${hintWrap}
                <div class="b1-sch-hdr">
                    <div class="b1-sch-hdr-img b1-icon-zoom-trigger" id="b1-scene-icon-trigger">${imgContent}</div>
                    <div class="b1-sch-hdr-text">
                        <div class="b1-sch-hdr-row1">
                            <span class="b1-schedule-label">今天要去：${fmtLabel(q.label)}</span>
                            <button class="b-inline-replay" id="replay-speech-btn" title="重播語音">🔊</button>
                        </div>
                        ${subtitleRow}
                    </div>
                </div>
                <div class="b1-schedule-items">${itemsHtml}</div>
                ${customListAbove}
                <div class="b1-total-strip">
                    <span class="b1-ts-label">總計金額</span>
                    ${isHard
                        ? `<button class="b1-item-box-btn" id="b1-total-box-btn" disabled>？元</button>`
                        : `<span class="b1-ts-amount" id="b1-easy-total-amt">${showTotal ? `${q.total} 元` : '??? 元'}</span>`
                    }
                </div>
                ${customAddBelow}
            </div>`;
        },

        _renderWalletArea(requiredTotal) {
            return `
            <div class="b1-wallet-area" id="wallet-area">
                <div class="b1-wallet-header">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="b1-wallet-title">👛 我的錢包</span>
                    </div>
                    <div class="b1-wallet-total-wrap">
                        <span class="b1-wallet-total-label">已放</span>
                        <span class="b1-wallet-total-val" id="wallet-total">${this.state.settings.difficulty === 'easy' ? '0 元' : '??? 元'}</span>
                        <span class="b1-wallet-sep">/</span>
                        <span class="b1-wallet-goal-tag">需要 ${requiredTotal} 元</span>
                    </div>
                </div>
                <div class="b1-wallet-progress-wrap">
                    <div class="b1-wallet-progress" id="b1-wallet-progress"><div class="b1-wallet-progress-fill" id="b1-wallet-progress-fill"></div></div>
                </div>
                <div class="b1-wallet-coins b1-drop-zone" id="wallet-coins">
                    <span class="b1-wallet-empty">把錢幣拖曳到這裡 👈</span>
                </div>
                <div class="b1-denom-summary" id="b1-denom-summary" style="display:none"></div>
            </div>`;
        },

        _renderCoinTray(diff) {
            const denoms = DENOM_BY_DIFF[diff] || DENOM_BY_DIFF.easy;
            // 為每個面額決定正/反面（1/5/10元隨機；紙鈔固定正面）並存入 trayFaces 供 ghost slot 對應
            const trayFaces = {};
            denoms.forEach(d => { trayFaces[d] = Math.random() < 0.5 ? 'back' : 'front'; });
            this.state.quiz.trayFaces = trayFaces;
            const coinsHtml = denoms.map(d => {
                const isBanknote = d >= 100;
                const face = trayFaces[d];
                const imgSrc = `../images/money/${d}_yuan_${face}.png`;
                const imgClass = isBanknote ? 'banknote-img' : 'coin-img';
                return `
                <div class="b1-coin-draggable" draggable="true" data-denom="${d}" title="${d}元 — 拖曳放入錢包">
                    <img src="${imgSrc}" alt="${d}元" class="${imgClass}" draggable="false"
                         onerror="this.style.display='none'">
                    <span class="b1-denom-label">${d}元</span>
                </div>`;
            }).join('');

            return `
            <div class="b1-coin-tray">
                <div class="b1-tray-title">💰 拖曳錢幣放入錢包（可重複拖曳）</div>
                <div class="b1-tray-coins" id="coin-tray">${coinsHtml}</div>
            </div>`;
        },

        // ── _bindQuestionEvents 已被 _bindPhase1Events / _bindPhase2Events 取代 ──

        // ── Wallet Operations ──────────────────────────────────
        addCoin(denom) {
            const q = this.state.quiz;
            // Ghost slot 模式：只允許放入對應 ghost slot 的面額（B3 _handleNormalDrop pattern）
            if (q.showHint && q.hintSlots?.length) {
                const slotIdx = q.hintSlots.findIndex(s => s.denom === denom && !s.filled);
                if (slotIdx === -1) {
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    window.LearningTracker?.logStep?.(`Phase2：投入正確面額`, false);
                    this.audio.play('error');
                    return; // 拒絕不符合 ghost slot 的面額
                }
                q.hintSlots[slotIdx].filled = true;
                this.audio.play('coin');
                const uid = ++this.state.uidCounter;
                const face = q.trayFaces?.[denom] || 'front';
                this.state.wallet.push({ denom, uid, isBanknote: denom >= 100, face });
                q.denomStats[denom] = (q.denomStats[denom] || 0) + 1;
                Game.Debug.log('wallet', `加入 ${denom}元（ghost slot ${slotIdx}），合計 ${this._getWalletTotal()}`);
                // 直接移除 ghost class，CSS transition opacity:0.35→1（B3 pattern）
                const slotEl = document.querySelector(`[data-hint-idx="${slotIdx}"]`);
                if (slotEl) slotEl.classList.remove('b1-wallet-ghost-slot');
                // 更新確認按鈕與進度條（不全量重繪 coinsEl）
                this._updateWalletStatusOnly();
                this._b1UpdateTrayHint();
                // 簡單模式：所有 ghost slot 填滿後自動確認
                if (this.state.settings.difficulty === 'easy' && q.hintSlots.every(s => s.filled) && !this.state.isProcessing) {
                    const currQ = this.state.quiz.questions[this.state.quiz.currentQuestion];
                    const req = currQ ? this._getEffectiveTotal(currQ) : 0;
                    Game.TimerManager.setTimeout(() => this.handleConfirm(req), 600, 'ui');
                }
                // 放幣語音：簡單/普通模式播錢包總計，困難模式靜音
                if (this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'easy') {
                    const walletNow = this._getWalletTotal();
                    Game.TimerManager.setTimeout(() => Game.Speech.speak(toTWD(walletNow)), 80, 'ui');
                }
                // 浮動標籤
                const coinArea2 = document.getElementById('wallet-coins') || document.getElementById('wallet-area');
                if (coinArea2) {
                    const rect2 = coinArea2.getBoundingClientRect();
                    const popup2 = document.createElement('div');
                    popup2.className = 'b1-coin-popup';
                    popup2.textContent = `+${denom}元`;
                    popup2.style.cssText = `position:fixed;left:${rect2.left + rect2.width/2}px;top:${rect2.top + 10}px;`;
                    document.body.appendChild(popup2);
                    Game.TimerManager.setTimeout(() => { if (popup2.parentNode) popup2.remove(); }, 900, 'ui');
                }
                return;
            }
            this.audio.play('coin');
            const uid = ++this.state.uidCounter;
            const face2 = q.trayFaces?.[denom] || 'front';
            this.state.wallet.push({ denom, uid, isBanknote: denom >= 100, face: face2 });
            q.denomStats[denom] = (q.denomStats[denom] || 0) + 1;
            Game.Debug.log('wallet', `加入 ${denom}元，合計 ${this._getWalletTotal()}`);
            this._updateWalletDisplay();
            // 放幣語音：簡單/普通模式播錢包總計，困難模式靜音
            if (this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'easy') {
                const walletNow = this._getWalletTotal();
                Game.TimerManager.setTimeout(() => Game.Speech.speak(toTWD(walletNow)), 80, 'ui');
            }
            // 硬幣浮動標籤（A4 price popup pattern）
            const coinArea = document.querySelector('.b1-coin-tray') || document.getElementById('wallet-coins') || document.getElementById('wallet-area');
            if (coinArea) {
                const rect = coinArea.getBoundingClientRect();
                const popup = document.createElement('div');
                popup.className = 'b1-coin-popup';
                popup.textContent = `+${denom}元`;
                popup.style.cssText = `position:fixed;left:${rect.left + rect.width/2}px;top:${rect.top + 10}px;`;
                document.body.appendChild(popup);
                Game.TimerManager.setTimeout(() => { if (popup.parentNode) popup.remove(); }, 900, 'ui');
            }
        },

        removeCoin(uid) {
            this.audio.play('click');
            this.state.wallet = this.state.wallet.filter(c => c.uid !== uid);
            Game.Debug.log('wallet', `移除 uid=${uid}，合計 ${this._getWalletTotal()}`);
            this._updateWalletDisplay();
        },

        _getWalletTotal() {
            return this.state.wallet.reduce((s, c) => s + c.denom, 0);
        },

        _updateWalletDisplay() {
            const total      = this._getWalletTotal();
            const currQ2     = this.state.quiz.questions[this.state.quiz.currentQuestion];
            const required   = currQ2 ? this._getEffectiveTotal(currQ2) : 0;
            const enough     = total >= required;
            const diff       = this.state.settings.difficulty;
            const isHard     = diff === 'hard';
            const isNormal   = diff === 'normal';
            const q2         = this.state.quiz;
            const hideTotal  = (isHard || isNormal) && !q2.walletRevealed;

            // 更新合計顯示（普通/困難模式按提示後才顯示）
            const totalEl = document.getElementById('wallet-total');
            if (totalEl) {
                if (hideTotal) {
                    totalEl.textContent = '??? 元';
                    totalEl.className = 'b1-wallet-total-val';
                } else {
                    totalEl.textContent = `${total} 元`;
                    const wasEnough = totalEl.classList.contains('enough');
                    totalEl.className = 'b1-wallet-total-val ' + (enough ? 'enough' : (total > 0 ? 'not-enough' : ''));
                    if (enough && !wasEnough && total > 0 && !isHard && !isNormal) {
                        totalEl.classList.add('b1-total-pop');
                        Game.TimerManager.setTimeout(() => totalEl.classList.remove('b1-total-pop'), 500, 'ui');
                    }
                }
            }
            // 更新進度條（普通/困難模式且未揭露時隱藏）
            const fillEl = document.getElementById('b1-wallet-progress-fill');
            const progressWrap = document.getElementById('b1-wallet-progress');
            if (progressWrap) progressWrap.style.display = (isHard || hideTotal) ? 'none' : '';
            if (fillEl && required > 0 && !isHard && !hideTotal) {
                const pct = Math.min(100, Math.round((total / required) * 100));
                fillEl.style.width = pct + '%';
                fillEl.className = 'b1-wallet-progress-fill' + (enough ? ' full' : (pct >= 70 ? ' near' : ''));
            }

            // 更新錢包幣列
            const coinsEl = document.getElementById('wallet-coins');
            if (coinsEl) {
                const q = this.state.quiz;
                if (q.showHint && q.hintSlots?.length) {
                    // Ghost slot 模式（B3 b3-nplaced-ghost-slot pattern）：
                    // 先依已放置硬幣逐一填充 hintSlots，再渲染（已填=正常顯示，未填=淡化）
                    const tmpSlots = q.hintSlots.map(s => ({ ...s, filled: false }));
                    this.state.wallet.forEach(coin => {
                        const idx = tmpSlots.findIndex(s => s.denom === coin.denom && !s.filled);
                        if (idx >= 0) tmpSlots[idx].filled = true;
                    });
                    coinsEl.innerHTML = tmpSlots.map((slot, idx) => {
                        const isBanknote = slot.denom >= 100;
                        const imgW = isBanknote ? '100px' : '60px';
                        const imgH = isBanknote ? 'auto'  : '60px';
                        const ghostClass = slot.filled ? '' : ' b1-wallet-ghost-slot';
                        const slotFace = slot.face || this.state.quiz.trayFaces?.[slot.denom] || 'front';
                        return `<div class="b1-wallet-coin${ghostClass}" data-hint-idx="${idx}">
                            <img src="../images/money/${slot.denom}_yuan_${slotFace}.png" alt="${slot.denom}元"
                                 style="width:${imgW};height:${imgH};object-fit:contain;"
                                 draggable="false" onerror="this.style.display='none'">
                        </div>`;
                    }).join('');
                } else if (this.state.wallet.length === 0) {
                    coinsEl.innerHTML = '<span class="b1-wallet-empty">把錢幣拖曳到這裡 👈</span>';
                } else {
                    const removable = this.state.settings.difficulty === 'normal' || this.state.settings.difficulty === 'hard';
                    coinsEl.innerHTML = this.state.wallet.map(coin => {
                        const coinFace = coin.face || 'front';
                        const imgSrc   = `../images/money/${coin.denom}_yuan_${coinFace}.png`;
                        const imgClass = coin.isBanknote ? 'banknote-img' : 'coin-img';
                        const imgW     = coin.isBanknote ? '100px' : '60px';
                        const imgH     = coin.isBanknote ? 'auto'  : '60px';
                        const removableAttrs = removable ? `draggable="true" data-denom="${coin.denom}" class="b1-wallet-coin b1-wc-removable"` : `class="b1-wallet-coin"`;
                        const removeBtn = removable ? `<button class="b1-wc-remove" data-uid="${coin.uid}" title="拖回">✕</button>` : '';
                        return `
                        <div ${removableAttrs} data-uid="${coin.uid}">
                            <img src="${imgSrc}" alt="${coin.denom}元" class="${imgClass}"
                                 style="width:${imgW};height:${imgH};object-fit:contain;"
                                 onerror="this.style.display='none'" draggable="false">
                            ${removeBtn}
                        </div>`;
                    }).join('');
                }
            }

            // 確認按鈕狀態（困難模式隨時可點，不受金額控制）
            const confirmBtn = document.getElementById('confirm-btn');
            if (confirmBtn && !isHard) {
                const wasSufficient = !confirmBtn.disabled;
                confirmBtn.disabled = !enough;
                if (enough && !wasSufficient && total > 0) {
                    if (total === required) {
                        this._showExactMatchToast();
                        Game.Speech.speak('剛好！不需要找零，可以出發了！');
                    } else {
                        Game.Speech.speak('金額足夠，可以出發了！');
                    }
                }
                // 行程卡綠光（剛好符合時）
                const card = document.querySelector('.b1-schedule-card');
                if (card) card.classList.toggle('exact-match', total === required && total > 0);
            }
            // 簡單模式（無 ghost slot）：湊到精確金額後自動確認
            // 注意：簡單模式不渲染 confirm-btn，需移出按鈕檢查區塊才能正常執行
            if (this.state.settings.difficulty === 'easy' && !this.state.quiz.showHint && total >= required && required > 0) {
                Game.TimerManager.setTimeout(() => this.handleConfirm(required), 700, 'ui');
            }

            // 面額計數摘要已隱藏（不顯示）
            const denomSummaryEl = document.getElementById('b1-denom-summary');
            if (denomSummaryEl) denomSummaryEl.style.display = 'none';

            // 簡單模式：動態淡化超出剩餘所需的錢幣
            if (this.state.settings.difficulty === 'easy') {
                const remaining = Math.max(0, required - total);
                document.querySelectorAll('.b1-coin-draggable').forEach(el => {
                    const d = parseInt(el.dataset.denom);
                    el.classList.toggle('b1-coin-faded', total > 0 && remaining > 0 && d > remaining);
                });
            }
        },

        // ── Ghost slot 模式下的狀態更新（不重繪 coinsEl）────────
        // 只更新確認按鈕、進度條、面額摘要；coinsEl 已由 ghost class 移除處理
        _updateWalletStatusOnly() {
            const total    = this._getWalletTotal();
            const currQ    = this.state.quiz.questions[this.state.quiz.currentQuestion];
            const required = currQ ? this._getEffectiveTotal(currQ) : 0;
            const enough   = total >= required;

            // 合計顯示
            const totalEl = document.getElementById('wallet-total');
            if (totalEl) {
                totalEl.textContent = `${total} 元`;
                const wasEnough = totalEl.classList.contains('enough');
                totalEl.className = 'b1-wallet-total-val ' + (enough ? 'enough' : (total > 0 ? 'not-enough' : ''));
                if (enough && !wasEnough && total > 0) {
                    totalEl.classList.add('b1-total-pop');
                    Game.TimerManager.setTimeout(() => totalEl.classList.remove('b1-total-pop'), 500, 'ui');
                }
            }
            // 進度條
            const fillEl = document.getElementById('b1-wallet-progress-fill');
            if (fillEl && required > 0) {
                const pct = Math.min(100, Math.round((total / required) * 100));
                fillEl.style.width = pct + '%';
                fillEl.className = 'b1-wallet-progress-fill' + (enough ? ' full' : (pct >= 70 ? ' near' : ''));
            }
            // 確認按鈕
            const confirmBtn = document.getElementById('confirm-btn');
            const wasSufficient = confirmBtn && !confirmBtn.disabled;
            if (confirmBtn) {
                confirmBtn.disabled = !enough;
                if (enough && !wasSufficient && total > 0) {
                    if (total === required) {
                        this._showExactMatchToast();
                        Game.Speech.speak('剛好！不需要找零，可以出發了！');
                    } else {
                        Game.Speech.speak('金額足夠，可以出發了！');
                    }
                }
                const card = document.querySelector('.b1-schedule-card');
                if (card) card.classList.toggle('exact-match', total === required && total > 0);
            }
            // 面額摘要已隱藏（不顯示）
            const denomSummaryEl2 = document.getElementById('b1-denom-summary');
            if (denomSummaryEl2) denomSummaryEl2.style.display = 'none';
        },

        // ── 費用明細提示（B2 breakdown pattern）────────────────
        _showScheduleBreakdown(question) {
            if (!question) return;
            const existing = document.getElementById('b1-breakdown');
            if (existing) return; // 防重複
            const div = document.createElement('div');
            div.id = 'b1-breakdown';
            div.className = 'b1-breakdown';
            const rows = question.items.map(it =>
                `<div class="b1-bd-row"><span class="b1-bd-name">📌 ${it.name}</span><span class="b1-bd-cost">${it.cost} 元</span></div>`
            ).join('');
            div.innerHTML = `<div class="b1-bd-title">💡 費用明細</div>${rows}<div class="b1-bd-total">合計 ${question.total} 元</div>`;
            const walletArea = document.getElementById('wallet-area');
            if (walletArea) walletArea.before(div);
            else document.querySelector('.b-game-wrap')?.appendChild(div);
            Game.TimerManager.setTimeout(() => {
                div.classList.add('b1-bd-fade');
                Game.TimerManager.setTimeout(() => { if (div.parentNode) div.remove(); }, 400, 'ui');
            }, 4000, 'ui');
        },

        // ── 剛好浮動提示 ────────────────────────────────────────
        _showExactMatchToast() {
            const existing = document.getElementById('b1-exact-toast');
            if (existing) existing.remove();
            const toast = document.createElement('div');
            toast.id = 'b1-exact-toast';
            toast.className = 'b1-exact-toast';
            toast.textContent = '✅ 答對！金額正確';
            document.body.appendChild(toast);
            Game.TimerManager.setTimeout(() => {
                toast.classList.add('b1-toast-fade');
                Game.TimerManager.setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400, 'ui');
            }, 1400, 'ui');
        },

        // ── 找零說明動畫（B6 _showChangeFormula pattern）────────
        _showChangeTip(paid, required, change) {
            const prev = document.getElementById('b1-change-tip');
            if (prev) prev.remove();
            const tip = document.createElement('div');
            tip.id = 'b1-change-tip';
            tip.className = 'b1-change-tip';
            tip.innerHTML = `
                <div class="b1-ct-title">💱 找零計算</div>
                <div class="b1-ct-row">
                    <span class="b1-ct-item">${paid}元</span>
                    <span class="b1-ct-op">−</span>
                    <span class="b1-ct-item">${required}元</span>
                    <span class="b1-ct-op">=</span>
                    <span class="b1-ct-ans">找回 ${change} 元</span>
                </div>`;
            document.body.appendChild(tip);
            Game.TimerManager.setTimeout(() => {
                tip.classList.add('b1-ct-fade');
                Game.TimerManager.setTimeout(() => { if (tip.parentNode) tip.remove(); }, 400, 'ui');
            }, 2200, 'ui');
        },

        // ── 行程卡倒數計時器（Round 44）──────────────────────────
        _startRouteTimer(question) {
            const diff = this.state.settings.difficulty;
            const secs = diff === 'easy' ? 30 : diff === 'normal' ? 20 : 15;
            let remaining = secs;
            const el = document.getElementById('b1-route-timer');
            if (!el) return;
            const update = () => {
                if (!el.isConnected) return;
                el.textContent = `⏱ ${remaining}s`;
                el.classList.toggle('b1-rt-urgent', remaining <= 5);
            };
            update();
            const tick = () => {
                if (!el.isConnected) return;
                remaining--;
                update();
                if (remaining <= 0) {
                    el.textContent = '⏱ 0s';
                    this.audio.play('error');
                    Game.Speech.speak('時間到！來看看答案吧！');
                    Game.TimerManager.setTimeout(() => {
                        this._showScheduleBreakdown(question);
                    }, 600, 'countdown');
                    return;
                }
                Game.TimerManager.setTimeout(tick, 1000, 'countdown');
            };
            Game.TimerManager.setTimeout(tick, 1000, 'countdown');
        },

        // ── Confirm ────────────────────────────────────────────
        handleConfirm(requiredTotal) {
            if (this.state.isProcessing) return;
            this.state.isProcessing = true;

            const walletTotal = this._getWalletTotal();
            const diff        = this.state.settings.difficulty;
            const isCorrect   = diff === 'easy' ? walletTotal >= requiredTotal : walletTotal === requiredTotal;

            Game.Debug.log('state', `確認：錢包${walletTotal} 需要${requiredTotal} 正確=${isCorrect}`);
            window.LearningTracker?.logStep?.(`Phase2：付款(需${requiredTotal}元)`, isCorrect);

            if (isCorrect) {
                Game.TimerManager.clearByCategory('countdown'); // 停止倒數計時器
                this.audio.play('correct');
                this._showFeedback('✅', '答對了！');
                const diff = walletTotal - requiredTotal;
                let msg = `答對了！你準備了${toTWD(walletTotal)}`;
                if (diff > 0) msg += `，找回${toTWD(diff)}`;
                Game.Speech.speak(msg, () => {
                    // 語音播完後再進入下一題
                    Game.TimerManager.setTimeout(() => this.nextQuestion(), 400, 'turnTransition');
                });
                this.state.quiz.correctCount++;
                this.state.quiz.streak = (this.state.quiz.streak || 0) + 1;
                this.state.quiz.solvedSchedules.push(this.state.quiz.questions[this.state.quiz.currentQuestion]);
                // 找零說明動畫（Round 25）
                if (diff > 0) {
                    Game.TimerManager.setTimeout(() => this._showChangeTip(walletTotal, requiredTotal, diff), 300, 'ui');
                }
                return; // nextQuestion 已由 speech callback 處理
            } else {
                this.state.quiz.streak = 0;
                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                this.audio.play('error');
                this.state.quiz.errorCount = (this.state.quiz.errorCount || 0) + 1;
                this._showFeedback('❌', '再試一次！');
                if (diff === 'normal' || diff === 'hard') {
                    // 普通/困難：清空錢包 + 方向提示
                    const isOver = walletTotal > requiredTotal;
                    const errSpeech = isOver
                        ? `拿了太多的錢，請再試一次`
                        : `拿了太少的錢，請再試一次`;
                    Game.Speech.speak(errSpeech);
                    this.state.wallet = [];
                    this.state.quiz.showHint = false;
                    this.state.quiz.hintSlots = [];
                } else {
                    Game.Speech.speak(`不對喔，你付的錢太少，請再試一次`);
                }
                this.state.isProcessing = false;
                const walletArea = document.getElementById('wallet-area');
                if (walletArea) {
                    walletArea.style.animation = 'b1Shake 0.4s ease';
                    Game.TimerManager.setTimeout(() => {
                        walletArea.style.animation = '';
                        this._updateWalletDisplay();
                    }, 500, 'ui');
                }
                // 普通模式：3次錯誤後自動顯示 ghost slot 提示
                if (this.state.settings.difficulty === 'normal' && this.state.quiz.errorCount >= 3) {
                    Game.TimerManager.setTimeout(() => this._showCoinHint(), 700, 'ui');
                }
                return;
            }

            Game.TimerManager.setTimeout(() => {
                this.nextQuestion();
            }, 1400, 'turnTransition');
        },

        _showFeedback(icon, text = '') {
            document.querySelector('.b-center-feedback')?.remove();
            const overlay = document.createElement('div');
            overlay.className = 'b-center-feedback';
            overlay.innerHTML = `<span class="b-cf-icon">${icon}</span>${text ? `<span class="b-cf-text">${text}</span>` : ''}`;
            document.body.appendChild(overlay);
            Game.TimerManager.setTimeout(() => overlay.remove(), 1200, 'ui');
        },

        // ── Drag & Drop ────────────────────────────────────────
        _setupDragDrop() {
            const walletCoins = document.getElementById('wallet-coins');
            if (!walletCoins) return;

            // Desktop HTML5 drag
            document.querySelectorAll('.b1-coin-draggable').forEach(dragEl => {
                Game.EventManager.on(dragEl, 'dragstart', (e) => {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/plain', dragEl.dataset.denom);
                    dragEl.classList.add('b1-dragging');
                    if (e.dataTransfer.setDragImage) {
                        try {
                            const denom    = parseInt(dragEl.dataset.denom);
                            const isBill   = denom >= 100;
                            const imgW     = isBill ? 100 : 60;
                            const offset   = Math.round(imgW / 2) + 8;
                            const imgEl    = dragEl.querySelector('img');
                            const ghost    = document.createElement('div');
                            ghost.style.cssText = 'position:absolute;left:-9999px;top:-9999px;background:rgba(255,255,255,0.95);border-radius:12px;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.25);pointer-events:none;';
                            ghost.innerHTML = `<img src="${imgEl?.src || ''}" style="width:${imgW}px;height:auto;display:block;" draggable="false">`;
                            document.body.appendChild(ghost);
                            e.dataTransfer.setDragImage(ghost, offset, 40);
                            setTimeout(() => ghost.remove(), 0);
                        } catch(ex) {}
                    }
                }, {}, 'gameUI');
                Game.EventManager.on(dragEl, 'dragend', () => {
                    dragEl.classList.remove('b1-dragging');
                }, {}, 'gameUI');
            });

            Game.EventManager.on(walletCoins, 'dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                walletCoins.classList.add('b1-drop-active');
            }, {}, 'gameUI');
            Game.EventManager.on(walletCoins, 'dragleave', (e) => {
                if (!walletCoins.contains(e.relatedTarget)) {
                    walletCoins.classList.remove('b1-drop-active');
                }
            }, {}, 'gameUI');
            Game.EventManager.on(walletCoins, 'drop', (e) => {
                e.preventDefault();
                walletCoins.classList.remove('b1-drop-active');
                const denom = parseInt(e.dataTransfer.getData('text/plain'));
                if (denom && !isNaN(denom)) this.addCoin(denom);
            }, {}, 'gameUI');

            // Touch drag
            this._setupTouchDrag();
        },

        _setupTouchDrag() {
            let touchDenom = null;
            let ghost      = null;
            const self     = this;

            document.querySelectorAll('.b1-coin-draggable').forEach(dragEl => {
                Game.EventManager.on(dragEl, 'touchstart', (e) => {
                    if (e.touches.length > 1) return;
                    touchDenom = parseInt(dragEl.dataset.denom);
                    const t      = e.touches[0];
                    const isBill = touchDenom >= 100;
                    const imgW   = isBill ? 100 : 60;
                    const offset = Math.round(imgW / 2) + 8;
                    const imgEl  = dragEl.querySelector('img');
                    if (ghost) { ghost.remove(); ghost = null; }
                    ghost = document.createElement('div');
                    ghost.style.cssText = `position:fixed;z-index:9999;pointer-events:none;` +
                        `background:rgba(255,255,255,0.95);border-radius:12px;padding:8px;` +
                        `box-shadow:0 4px 16px rgba(0,0,0,0.3);transform:scale(1.05);` +
                        `left:${t.clientX - offset}px;top:${t.clientY - offset}px;`;
                    ghost.innerHTML = `<img src="${imgEl?.src || ''}" style="width:${imgW}px;height:auto;display:block;" draggable="false">`;
                    document.body.appendChild(ghost);
                }, { passive: true }, 'gameUI');

                Game.EventManager.on(dragEl, 'touchmove', (e) => {
                    if (!ghost || touchDenom === null) return;
                    e.preventDefault();
                    const t      = e.touches[0];
                    const isBill = touchDenom >= 100;
                    const imgW   = isBill ? 100 : 60;
                    const offset = Math.round(imgW / 2) + 8;
                    ghost.style.left = (t.clientX - offset) + 'px';
                    ghost.style.top  = (t.clientY - offset) + 'px';
                    const wc = document.getElementById('wallet-coins');
                    if (wc) {
                        const r = wc.getBoundingClientRect();
                        wc.classList.toggle('b1-drop-active',
                            t.clientX >= r.left && t.clientX <= r.right &&
                            t.clientY >= r.top  && t.clientY <= r.bottom);
                    }
                }, { passive: false }, 'gameUI');

                Game.EventManager.on(dragEl, 'touchend', (e) => {
                    if (!ghost || touchDenom === null) return;
                    const t  = e.changedTouches[0];
                    const wc = document.getElementById('wallet-coins');
                    if (wc) {
                        const r = wc.getBoundingClientRect();
                        if (t.clientX >= r.left && t.clientX <= r.right &&
                            t.clientY >= r.top  && t.clientY <= r.bottom) {
                            self.addCoin(touchDenom);
                        }
                        wc.classList.remove('b1-drop-active');
                    }
                    ghost.remove(); ghost = null; touchDenom = null;
                }, { passive: true }, 'gameUI');
            });
        },

        // ── 開題任務說明彈窗（C4 instruction modal 模式）──────────
        // 場景彈窗：顯示目的地圖示＋名稱＋行程項目，語音念完後自動關閉
        _showTaskModal(curr, afterClose) {
            const existing = document.getElementById('b1-task-modal');
            if (existing) existing.remove();
            const s = this.state.settings;
            const diffLabel = { easy: '簡單', normal: '普通', hard: '困難' }[s.difficulty] || '';
            const itemNames = curr.items.map(it => it.name).join('・');
            const modal = document.createElement('div');
            modal.id = 'b1-task-modal';
            modal.className = 'b1-task-modal';
            modal.innerHTML = `
                <div class="b1-task-modal-inner">
                    <div class="b1-task-modal-title">📅 今日行程</div>
                    <div class="b1-task-modal-meta">${diffLabel}模式 · 共 ${s.questionCount} 題</div>
                    <div class="b1-task-modal-icon">${this._sceneIcon(curr, 'b1-task-modal-img')}</div>
                    <div class="b1-task-modal-dest">今天要去</div>
                    <div class="b1-task-modal-label">${fmtLabel(curr.label)}</div>
                    <div class="b1-task-modal-items">${itemNames}</div>
                    <div class="b1-task-modal-tap">點任意處繼續</div>
                </div>`;
            document.body.appendChild(modal);
            let closed = false;
            const closeModal = () => {
                if (closed) return;
                closed = true;
                window.speechSynthesis.cancel();
                if (document.body.contains(modal)) modal.remove();
                afterClose?.();
            };
            modal.addEventListener('click', closeModal);
            // 語音：「今天要去[場景]，準備出發！」，播完後自動關閉
            Game.TimerManager.setTimeout(() => {
                const lbl = fmtLabel(curr.label);
                Game.Speech.speak(`今天要去${lbl}，準備出發！`, closeModal);
            }, 300, 'ui');
        },

        // ── Hint ───────────────────────────────────────────────
        _calcOptimalCoins(amount, denoms) {
            const sorted = [...denoms].sort((a, b) => b - a);
            const result = [];
            let rem = amount;
            for (const d of sorted) {
                while (rem >= d) { result.push(d); rem -= d; }
            }
            return result;
        },

        // ── 困難模式：總計算式（顯示在總計列下方）───────────────────
        _showB1TotalFormula(curr) {
            document.getElementById('b1-total-formula')?.remove();
            const items = this._getEffectiveItems(curr);
            const expr = items.map(it => String(it.cost)).join(' + ');
            const totalStrip = document.querySelector('.b1-total-strip');
            if (!totalStrip) return;
            const div = document.createElement('div');
            div.id = 'b1-total-formula';
            div.className = 'b1-total-formula';
            div.innerHTML = `<span class="b1-tf-expr">${expr}</span><span class="b1-tf-eq"> = </span><span class="b1-tf-ans">？？？</span>`;
            totalStrip.insertAdjacentElement('afterend', div);
        },

        // ── Phase 1 提示：在未答對的 ？框上方顯示正確金額數字 ──────
        _showPhase1AmountHints(curr) {
            window.speechSynthesis.cancel();
            Game.TimerManager.clearByCategory('hintTip');
            document.querySelectorAll('.b-cost-hint-tip').forEach(el => el.remove());
            let shown = 0;
            document.querySelectorAll(
                '.b1-item-box-btn:not(.b1-item-cost-revealed):not(#b1-total-box-btn), .b1-cip-cost-btn:not(.b1-item-cost-revealed)'
            ).forEach(btn => {
                const cost = parseInt(btn.dataset.cost);
                if (isNaN(cost)) return;
                const tip = document.createElement('span');
                tip.className = 'b-cost-hint-tip';
                tip.textContent = `${cost} 元`;
                btn.appendChild(tip);
                shown++;
            });
            // 困難模式：總計問號框已啟用時也顯示數字提示
            const totalBtn = document.getElementById('b1-total-box-btn');
            if (totalBtn && !totalBtn.disabled && !totalBtn.classList.contains('b1-item-cost-revealed')) {
                const correctTotal = this._getEffectiveTotal(curr);
                const tip = document.createElement('span');
                tip.className = 'b-cost-hint-tip';
                tip.textContent = `${correctTotal} 元`;
                totalBtn.appendChild(tip);
                shown++;
            }
            if (shown === 0) return;
            // 4.7 秒後淡出，0.3 秒後移除（共 5 秒）
            Game.TimerManager.setTimeout(() => {
                document.querySelectorAll('.b-cost-hint-tip').forEach(el => el.classList.add('fading'));
                Game.TimerManager.setTimeout(() => {
                    document.querySelectorAll('.b-cost-hint-tip').forEach(el => el.remove());
                }, 300, 'hintTip');
            }, 4700, 'hintTip');
        },

        _showCoinHint() {
            const curr = this.state.quiz.questions[this.state.quiz.currentQuestion];
            if (!curr) return;
            const denoms  = DENOM_BY_DIFF[this.state.settings.difficulty] || DENOM_BY_DIFF.easy;
            const optimal = this._calcOptimalCoins(this._getEffectiveTotal(curr), denoms);

            document.querySelectorAll('.b1-coin-draggable').forEach(el => el.classList.remove('b1-coin-hint'));

            const countMap = {};
            optimal.forEach(d => { countMap[d] = (countMap[d] || 0) + 1; });
            Object.keys(countMap).forEach(d => {
                document.querySelectorAll(`.b1-coin-draggable[data-denom="${d}"]`).forEach(el => {
                    el.classList.add('b1-coin-hint');
                });
            });

            // 語音：「可以用N個X元，M個Y元」
            const parts = Object.entries(countMap)
                .sort((a, b) => b[0] - a[0])
                .map(([d, c]) => `${c}個${parseInt(d)}元`);
            Game.Speech.speak(`可以用${parts.join('，')}`);

            // Ghost slots（在 Phase 2 wallet 中顯示）
            const q = this.state.quiz;
            q.showHint = true;
            q.hintSlots = optimal.map(d => ({ denom: d, filled: false, face: q.trayFaces?.[d] || 'front' }));
            const placed = [...this.state.wallet];
            placed.forEach(coin => {
                const idx = q.hintSlots.findIndex(s => s.denom === coin.denom && !s.filled);
                if (idx >= 0) q.hintSlots[idx].filled = true;
            });
            this._updateWalletDisplay();

            // 顯示 B3 風格提示彈窗
            this._showHintModal(optimal, countMap, parts);

            Game.TimerManager.setTimeout(() => {
                document.querySelectorAll('.b1-coin-draggable').forEach(el => el.classList.remove('b1-coin-hint'));
            }, 6000, 'ui');
        },

        // ── B3 風格提示彈窗（金錢圖示 + 語音）──
        _showHintModal(optimal, countMap, parts) {
            const prev = document.getElementById('b1-hint-modal-overlay');
            if (prev) prev.remove();

            const total = optimal.reduce((s, d) => s + d, 0);

            const denomsHtml = Object.entries(countMap)
                .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                .map(([d, c]) => {
                    const dn = parseInt(d);
                    const isBanknote = dn >= 100;
                    const imgSize = isBanknote ? '80px' : '48px';
                    const imgsHtml = Array(c).fill(0).map(() =>
                        `<img src="../images/money/${d}_yuan_front.png"
                              style="width:${imgSize};height:${imgSize};object-fit:contain;${isBanknote ? 'border-radius:4px;' : 'border-radius:50%;'}"
                              onerror="this.style.display='none'">`
                    ).join('');
                    return `
                    <div class="b1-hm-group">
                        <div class="b1-hm-imgs">${imgsHtml}</div>
                        <div class="b1-hm-count">${d}元 × ${c}</div>
                    </div>`;
                }).join('');

            const overlay = document.createElement('div');
            overlay.id = 'b1-hint-modal-overlay';
            overlay.className = 'b1-hint-modal-overlay';
            overlay.innerHTML = `
                <div class="b1-hint-modal">
                    <div class="b1-hm-title">💡 建議帶法</div>
                    <div class="b1-hm-body">${denomsHtml}</div>
                    <div class="b1-hm-total">合計：${total} 元</div>
                    <button class="b1-hm-close" id="b1-hm-close">✓ 我知道了</button>
                </div>`;
            document.body.appendChild(overlay);

            const close = () => { if (overlay.parentNode) overlay.remove(); };
            document.getElementById('b1-hm-close')?.addEventListener('click', close);
            overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
            Game.TimerManager.setTimeout(close, 8000, 'ui');
        },

        // ── Next Question / Results ────────────────────────────
        nextQuestion() {
            const q = this.state.quiz;
            q.currentQuestion++;
            if (q.currentQuestion >= q.totalQuestions) {
                this.showResults();
            } else {
                this.renderQuestion();
            }
        },

        showResults() {
            // ── 完成畫面守衛 ──
            if (this.state.isEndingGame) return;
            this.state.isEndingGame = true;

            AssistClick.deactivate();
            Game.TimerManager.clearByCategory('turnTransition');
            Game.EventManager.removeByCategory('gameUI');

            const _reactivateForSummary = this.state.settings.clickMode === 'on';

            const q       = this.state.quiz;
            const endTime = Date.now();
            const elapsed = q.startTime ? (endTime - q.startTime) : 0;
            const mins    = Math.floor(elapsed / 60000);
            const secs    = Math.floor((elapsed % 60000) / 1000);
            const accuracy = q.totalQuestions > 0
                ? Math.round((q.correctCount / q.totalQuestions) * 100) : 0;

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'b1', unitName: 'B1 今天帶多少錢', series: 'B',
                score: q.correctCount, total: q.totalQuestions, difficulty: this.state.settings?.difficulty,
                durationSec: Math.floor(elapsed / 1000) });

            let badge, badgeColor;
            if (accuracy === 100)    { badge = '完美 🥇'; badgeColor = '#f59e0b'; }
            else if (accuracy >= 90) { badge = '優異 🥇'; badgeColor = '#f59e0b'; }
            else if (accuracy >= 70) { badge = '良好 🥈'; badgeColor = '#10b981'; }
            else if (accuracy >= 50) { badge = '努力 🥉'; badgeColor = '#6366f1'; }
            else                     { badge = '練習 ⭐'; badgeColor = '#94a3b8'; }

            // 行程費用清單（最貴/最便宜標記，翻頁式 ◀/▶）
            const scheduleCardHTML = (() => {
                if (!q.solvedSchedules || q.solvedSchedules.length === 0) return '';
                const maxTotal = Math.max(...q.solvedSchedules.map(s => s.total));
                const minTotal = Math.min(...q.solvedSchedules.map(s => s.total));
                // 金錢圖示（實際數量，紙鈔68px，硬幣44px，隨機正反面）
                const mkMoneyIcons44 = (amt) => {
                    const rf = () => Math.random() < 0.5 ? 'back' : 'front';
                    const banknotes = new Set([100, 500, 1000]);
                    const denoms = [1000, 500, 100, 50, 10, 5, 1];
                    let rem = amt; const imgs = [];
                    for (const d of denoms) {
                        if (rem <= 0) break;
                        const cnt = Math.floor(rem / d);
                        for (let i = 0; i < cnt; i++) imgs.push({ d, face: rf() });
                        rem -= cnt * d;
                    }
                    return imgs.map(({ d, face }) => {
                        const size = banknotes.has(d) ? '68px' : '44px';
                        return `<img src="../images/money/${d}_yuan_${face}.png" alt="${d}元"
                            style="width:${size};height:${size};object-fit:contain;margin:2px 2px;" onerror="this.style.display='none'" draggable="false">`;
                    }).join('');
                };
                const rowsArr = q.solvedSchedules.map(s => {
                    const tag = s.total === maxTotal && q.solvedSchedules.length > 1
                        ? `<span class="b1-sch-tag most-exp">最貴 💸</span>`
                        : s.total === minTotal && q.solvedSchedules.length > 1
                        ? `<span class="b1-sch-tag cheapest">最便宜 💚</span>`
                        : '';
                    const itemRows = s.items.map(it => `
                        <div class="b1-sch-item-row" style="margin-bottom:10px;">
                            <span style="font-size:16px;font-weight:600;">📌 ${it.name}：${it.cost}元</span>
                            <div style="display:flex;flex-wrap:wrap;align-items:center;margin-top:4px;">${mkMoneyIcons44(it.cost)}</div>
                        </div>`
                    ).join('');
                    return `
                    <div class="b1-schedule-row b1-sch-row-v">
                        <div class="b1-sch-icon-center">${this._sceneIcon(s)}</div>
                        <div class="b1-sch-detail">
                            <span class="b1-sch-label" style="font-size:18px;">${s.label}${tag ? '&nbsp;' + tag : ''}</span>
                            <div class="b1-sch-items-list">
                                ${itemRows}
                                <div class="b1-sch-item-total" style="font-size:17px;font-weight:700;margin-top:8px;border-top:1px solid #fde68a;padding-top:6px;">
                                    合計：${s.total}元
                                    <div style="display:flex;flex-wrap:wrap;align-items:center;margin-top:4px;">${mkMoneyIcons44(s.total)}</div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                });
                const total = rowsArr.length;
                this._b1ScheduleNavRows = rowsArr;
                this._b1ScheduleNavIdx  = 0;
                const navHTML = total > 1 ? `
                    <div class="b-ds-nav">
                        <button class="b-ds-nav-btn" id="b1-sch-prev">◀</button>
                        <span class="b-ds-nav-label" id="b1-sch-nav-label">1 / ${total}</span>
                        <button class="b-ds-nav-btn" id="b1-sch-next">▶</button>
                    </div>` : '';
                return `
                <div class="b-review-card" id="b1-res-schedules-card">
                    <h3 class="b-review-card-header">
                        <span>🗓️ 預定的行程</span>
                        ${navHTML}
                    </h3>
                    <div id="b1-sch-rows-container">${rowsArr[0] || ''}</div>
                </div>`;
            })();

            // 面額使用統計
            const denomEntries = Object.entries(q.denomStats).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
            const denomCardHTML = denomEntries.length > 0 ? `
            <div class="b-review-card">
                <h3>💰 我的錢包的金額</h3>
                <div class="b1-stat-grid">
                    ${denomEntries.map(([d, c]) => `
                    <div class="b1-stat-item">
                        <img src="../images/money/${d}_yuan_front.png" alt="${d}元"
                             style="width:44px;height:44px;object-fit:contain;" onerror="this.style.display='none'">
                        <div class="b1-stat-denom">${d}元</div>
                        <div class="b1-stat-count">× ${c}</div>
                    </div>`).join('')}
                </div>
            </div>` : '';

            const app = document.getElementById('app');
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            app.style.overflow  = 'auto';
            app.style.height    = 'auto';
            app.style.minHeight = '100vh';

            // ── 第一頁：測驗回顧 ──
            const diffLabelR = { easy: '簡單模式', normal: '普通模式', hard: '困難模式' }[this.state.settings.difficulty] || '';
            const catLabelsR = { all:'全部', school:'學校 🏫', food:'飲食 🍜', outdoor:'戶外 🌿', entertainment:'娛樂 🎭', shopping:'購物 🛒' };
            const catLabelR  = catLabelsR[this.state.settings.sceneCategory] || '';
            const centerTextR = catLabelR && catLabelR !== '全部' ? `${diffLabelR} · ${catLabelR}` : diffLabelR;
            app.innerHTML = `
<div class="b-header">
    <div class="b-header-left"><span class="b-header-unit">💰 今天帶多少錢</span></div>
    <div class="b-header-center">${centerTextR}</div>
    <div class="b-header-right">
        <span class="b-progress">第 ${q.totalQuestions} 題 / 共 ${q.totalQuestions} 題</span>
        <button class="b-reward-btn" id="b1-review-reward-btn">🎁 獎勵</button>
        <button class="b-back-btn" id="b1-review-back-btn">返回設定</button>
    </div>
</div>
<div class="b-review-wrapper">
    <div class="b-review-screen">
        ${scheduleCardHTML}
        ${denomCardHTML}
        <button id="b1-view-summary-btn" class="b-review-next-btn">
            📊 查看測驗總結
        </button>
    </div>
</div>`;

            Game.TimerManager.setTimeout(() => {
                document.getElementById('success-sound')?.play();
            }, 100, 'confetti');
            Game.TimerManager.setTimeout(() => {
                Game.Speech.speak('完成了！來看看今日行程總覽吧！');
            }, 600, 'speech');

            // 簡單輔助點擊：重啟以高亮「查看測驗總結」按鈕
            if (_reactivateForSummary) {
                Game.TimerManager.setTimeout(() => AssistClick.activate(null), 400, 'ui');
            }

            Game.EventManager.on(document.getElementById('b1-review-reward-btn'), 'click', () => {
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'gameUI');
            Game.EventManager.on(document.getElementById('b1-review-back-btn'), 'click', () => this.showSettings(), {}, 'gameUI');

            // 行程翻頁按鈕
            if (this._b1ScheduleNavRows && this._b1ScheduleNavRows.length > 1) {
                const navRows = this._b1ScheduleNavRows;
                let navIdx = 0;
                const showSchEntry = (i) => {
                    navIdx = (i + navRows.length) % navRows.length;
                    const c = document.getElementById('b1-sch-rows-container');
                    const lbl = document.getElementById('b1-sch-nav-label');
                    if (c) c.innerHTML = navRows[navIdx];
                    if (lbl) lbl.textContent = `${navIdx + 1} / ${navRows.length}`;
                };
                const prevBtn = document.getElementById('b1-sch-prev');
                const nextBtn = document.getElementById('b1-sch-next');
                if (prevBtn) Game.EventManager.on(prevBtn, 'click', () => showSchEntry(navIdx - 1), {}, 'gameUI');
                if (nextBtn) Game.EventManager.on(nextBtn, 'click', () => showSchEntry(navIdx + 1), {}, 'gameUI');
            }

            Game.EventManager.on(document.getElementById('b1-view-summary-btn'), 'click', () => {
                AssistClick.deactivate();
                Game.EventManager.removeByCategory('gameUI');

                // ── 第二頁：測驗總結 ──
                app.innerHTML = `
<div class="b-res-wrapper">
    <div class="b-res-screen">
        <div class="b-res-header">
            <div class="b-res-trophy">🏆</div>
            <div class="b-res-title-row">
                <img src="../images/common/hint_detective.png"
                     class="b-res-mascot" alt="金錢小助手" onerror="this.style.display='none'">
                <h1 class="b-res-title">🎉 帶錢小達人 🎉</h1>
                <span class="b-res-mascot-spacer"></span>
            </div>
        </div>
        <div class="b-res-reward-wrap">
            <a href="#" id="endgame-reward-link" class="b-res-reward-link">
                🎁 開啟獎勵系統
            </a>
        </div>
        <div class="b-res-container">
            <div class="b-res-grid">
                <div class="b-res-card b-res-card-1">
                    <div class="b-res-icon">✅</div>
                    <div class="b-res-label">答對題數</div>
                    <div class="b-res-value">${q.correctCount}/${q.totalQuestions}</div>
                </div>
                <div class="b-res-card b-res-card-2">
                    <div class="b-res-icon">📊</div>
                    <div class="b-res-label">正確率</div>
                    <div class="b-res-value">${accuracy}%</div>
                </div>
                <div class="b-res-card b-res-card-3">
                    <div class="b-res-icon">⏱️</div>
                    <div class="b-res-label">完成時間</div>
                    <div class="b-res-value">${mins > 0 ? mins + '分' : ''}${secs}秒</div>
                </div>
            </div>
            <div class="b-res-perf-section">
                <h3>📊 表現評價</h3>
                <div class="b-res-perf-badge">${badge}</div>
            </div>
            <div class="b-res-achievements">
                <h3>🏆 學習成果</h3>
                <div class="b-res-ach-list">
                    <div class="b-res-ach-item">✅ 計算出行所需費用</div>
                    <div class="b-res-ach-item">✅ 選擇正確面額錢幣</div>
                    <div class="b-res-ach-item">✅ 累計總金額達到目標</div>
                    ${(() => {
                        const catNames = { school:'學校活動', food:'飲食消費', outdoor:'戶外活動', entertainment:'娛樂活動', shopping:'購物消費' };
                        const sc = this.state.settings.sceneCategory;
                        return sc && sc !== 'all' ? `<div class="b-res-ach-item">✅ 專注練習：${catNames[sc] || sc}場景</div>` : '';
                    })()}
                </div>
            </div>
            <div class="b-res-btns">
                <button id="play-again-btn" class="b-res-play-btn">
                    <span class="btn-icon">🔄</span><span class="btn-text">再玩一次</span>
                </button>
                <button id="back-settings-btn" class="b-res-back-btn">
                    <span class="btn-icon">⚙️</span><span class="btn-text">返回設定</span>
                </button>
            </div>
        </div>
    </div>
</div>`;

                Game.EventManager.on(document.getElementById('play-again-btn'), 'click',
                    () => this.startGame(), {}, 'gameUI');
                Game.EventManager.on(document.getElementById('back-settings-btn'), 'click',
                    () => this.showSettings(), {}, 'gameUI');
                Game.EventManager.on(document.getElementById('endgame-reward-link'), 'click', (e) => {
                    e.preventDefault();
                    if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                    else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                }, {}, 'gameUI');

                document.getElementById('success-sound')?.play();
                this._fireConfetti();
                Game.TimerManager.setTimeout(() => {
                    let msg;
                    if (accuracy === 100)    msg = '太厲害了，全部答對了！';
                    else if (accuracy >= 80) msg = `很棒喔，答對了${q.correctCount}題！`;
                    else if (accuracy >= 60) msg = '不錯喔，繼續加油！';
                    else                     msg = '要再加油喔，多練習幾次！';
                    Game.Speech.speak(msg);
                }, 300, 'speech');
            }, {}, 'gameUI');

            Game.Debug.log('state', `遊戲結束 正確=${q.correctCount}/${q.totalQuestions}`);
        },

        // ── Confetti（遞迴版，不用 setInterval）──────────────────
        _fireConfetti() {
            if (typeof confetti !== 'function') return;
            const duration = 3000;
            const end      = Date.now() + duration;
            const defaults = { startVelocity:30, spread:360, ticks:60, zIndex:1001 };
            const rand     = (a, b) => Math.random() * (b - a) + a;
            const fire     = () => {
                const t = end - Date.now();
                if (t <= 0) return;
                const n = 50 * (t / duration);
                confetti({ ...defaults, particleCount: n, origin: { x: rand(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount: n, origin: { x: rand(0.7, 0.9), y: Math.random() - 0.2 } });
                Game.TimerManager.setTimeout(fire, 250, 'confetti');
            };
            fire();
        },

        // ── Helpers ────────────────────────────────────────────
        backToMenu() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeAll();
            window.location.href = '../index.html#part3';
        }

    };  // end Game

    // 👆 輔助點擊模式（AssistClick）— 獨立區塊
    // ============================================================
    const AssistClick = {
        _overlay: null, _handler: null, _touchHandler: null,
        _enabled: false, _lastHighlighted: null, _observer: null,
        _curr: null,

        activate(curr) {
            if (this._overlay) return;
            this._curr = curr;
            const tbEl = document.querySelector('.b-header');
            const tbBottom = tbEl ? Math.round(tbEl.getBoundingClientRect().bottom) : 60;
            this._overlay = document.createElement('div');
            this._overlay.id = 'b1-assist-overlay';
            this._overlay.style.cssText = `position:fixed;top:${tbBottom}px;left:0;right:0;bottom:0;z-index:10100;pointer-events:all;touch-action:none;background:transparent;cursor:pointer;`;
            document.body.appendChild(this._overlay);
            this._handler      = (e) => { e.stopPropagation(); this._executeStep(); };
            this._touchHandler = (e) => { e.preventDefault(); e.stopPropagation(); this._executeStep(); };
            this._overlay.addEventListener('click',    this._handler);
            this._overlay.addEventListener('touchend', this._touchHandler, { passive: false });
            this._enabled = true;
            this._startObserver();
            this.buildQueue();
        },

        deactivate() {
            if (this._overlay) {
                this._overlay.removeEventListener('click',    this._handler);
                this._overlay.removeEventListener('touchend', this._touchHandler);
                this._overlay.remove();
                this._overlay = null;
            }
            if (this._observer) { this._observer.disconnect(); this._observer = null; }
            this._clearHighlight();
            this._enabled = false; this._curr = null;
            this._handler = null; this._touchHandler = null;
        },

        buildQueue() {
            if (!this._enabled) return;
            this._clearHighlight();

            // 結果頁：優先偵測「查看測驗總結」按鈕
            const viewSummaryBtn = document.getElementById('b1-view-summary-btn');
            if (viewSummaryBtn) {
                this._highlight(viewSummaryBtn, () => viewSummaryBtn.click());
                return;
            }

            const curr = this._curr;
            if (!curr) return;

            // Phase 1：簡單模式逐項點擊金幣
            const phase = Game.state.quiz.phase || 2;
            if (phase === 1 && Game.state.settings.difficulty === 'easy') {
                const rev = Game.state.quiz.easyRevealedUpTo ?? 0;
                const coin = document.querySelector(
                    `.b1-coin-clickable[data-item-idx="${rev}"]:not(.b1-coin-clicked):not([disabled])`
                );
                if (coin) this._highlight(coin, () => coin.click());
                return;
            }

            // 計算錢包中已有金額
            const walletTotal = Game.state.wallet.reduce((s, c) => s + c.denom, 0);
            const remaining   = Game._getEffectiveTotal(curr) - walletTotal;

            if (remaining <= 0) {
                if (Game.state.settings.difficulty === 'easy') {
                    return; // 等待 auto-confirm 計時器；保持 overlay 存在以便下一題繼續引導
                }
                // 普通/困難モード → 高亮確認按鈕
                const btn = document.getElementById('confirm-btn');
                if (btn && !btn.disabled) this._highlight(btn, () => btn.click());
            } else {
                // 計算下一個最優硬幣
                const diff   = Game.state.settings.difficulty;
                const denoms = (typeof DENOM_BY_DIFF !== 'undefined')
                    ? (DENOM_BY_DIFF[diff] || DENOM_BY_DIFF.easy)
                    : [1, 5, 10, 50];
                const sorted = [...denoms].sort((a, b) => b - a);
                let nextDenom = sorted[0];
                for (const d of sorted) {
                    if (d <= remaining) { nextDenom = d; break; }
                }
                const el = document.querySelector(`.b1-coin-draggable[data-denom="${nextDenom}"]`);
                if (el) this._highlight(el, () => Game.addCoin(nextDenom));
            }
        },

        _executeStep() {
            if (!this._enabled) return;
            const fn = this._pendingAction;
            this._clearHighlight();
            this._pendingAction = null;
            if (fn) fn();
            // 重建下一步（同步執行後 wallet 已更新）
            Game.TimerManager.setTimeout(() => { if (this._enabled) this.buildQueue(); }, 120, 'ui');
        },

        _pendingAction: null,

        _startObserver() {
            const app = document.getElementById('app');
            if (!app) return;
            let t = null;
            this._observer = new MutationObserver(() => {
                if (!this._enabled) return;
                if (t) window.clearTimeout(t);
                t = window.setTimeout(() => { if (this._enabled) this.buildQueue(); }, 300);
            });
            this._observer.observe(app, { childList: true, subtree: true, attributes: true });
        },

        _highlight(el, action) {
            this._clearHighlight();
            if (!el) return;
            el.classList.add('assist-click-hint');
            this._lastHighlighted = el;
            this._pendingAction   = action || null;
        },

        _clearHighlight() {
            if (this._lastHighlighted) {
                this._lastHighlighted.classList.remove('assist-click-hint');
                this._lastHighlighted = null;
            }
            document.querySelectorAll('.assist-click-hint').forEach(e => e.classList.remove('assist-click-hint'));
            this._pendingAction = null;
        }
    };

    Game.init();
});
