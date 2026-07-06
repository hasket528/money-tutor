// =============================================================
// FILE: js/b2_allowance_diary.js — B2 零用錢日記
// =============================================================
'use strict';

// ── 日記範本資料庫 ────────────────────────────────────────────
const B2_TEMPLATES = {
    easy: [
        { startAmount: 100, events: [
            { type: 'income',  name: '媽媽給零用錢', amount: 50,  icon: '💰' },
            { type: 'expense', name: '買飲料',       amount: 30,  icon: '🧋' },
        ]},  // 答案：120
        { startAmount: 50, events: [
            { type: 'income',  name: '幫忙洗碗',     amount: 20,  icon: '🍽️' },
            { type: 'expense', name: '買糖果',       amount: 15,  icon: '🍬' },
        ]},  // 答案：55
        { startAmount: 200, events: [
            { type: 'expense', name: '買文具',       amount: 80,  icon: '✏️' },
            { type: 'income',  name: '爸爸獎勵',     amount: 50,  icon: '🌟' },
        ]},  // 答案：170
        { startAmount: 80, events: [
            { type: 'income',  name: '過年紅包',     amount: 100, icon: '🧧' },
            { type: 'expense', name: '買玩具',       amount: 120, icon: '🎮' },
        ]},  // 答案：60
        { startAmount: 150, events: [
            { type: 'expense', name: '買早餐',       amount: 40,  icon: '🥐' },
            { type: 'income',  name: '幫忙買菜',     amount: 20,  icon: '🛒' },
        ]},  // 答案：130
        { startAmount: 60, events: [
            { type: 'income',  name: '阿嬤零用錢',   amount: 50,  icon: '💝' },
            { type: 'expense', name: '買貼紙',       amount: 25,  icon: '🌸' },
        ]},  // 答案：85
        { startAmount: 300, events: [
            { type: 'expense', name: '買書',         amount: 150, icon: '📚' },
            { type: 'expense', name: '買點心',       amount: 30,  icon: '🍪' },
        ]},  // 答案：120
        { startAmount: 120, events: [
            { type: 'income',  name: '幫忙打掃',     amount: 30,  icon: '🧹' },
            { type: 'expense', name: '買冰淇淋',     amount: 45,  icon: '🍦' },
        ]},  // 答案：105
        { startAmount: 70, events: [
            { type: 'income',  name: '阿姨送禮',     amount: 30,  icon: '🎁' },
            { type: 'expense', name: '買糖果',       amount: 20,  icon: '🍬' },
        ]},  // 答案：80
        { startAmount: 90, events: [
            { type: 'expense', name: '買零食',       amount: 25,  icon: '🍿' },
            { type: 'income',  name: '爸爸給',       amount: 35,  icon: '👨' },
        ]},  // 答案：100
        { startAmount: 250, events: [
            { type: 'expense', name: '買漫畫書',     amount: 60,  icon: '📔' },
            { type: 'income',  name: '幫忙整理',     amount: 40,  icon: '🗂️' },
        ]},  // 答案：230
        { startAmount: 35, events: [
            { type: 'income',  name: '媽媽零用錢',   amount: 80,  icon: '💰' },
            { type: 'expense', name: '買飲料',       amount: 45,  icon: '🧃' },
        ]},  // 答案：70
    ],
    normal: [
        { startAmount: 200, events: [
            { type: 'income',  name: '爸爸給零用錢', amount: 100, icon: '💰' },
            { type: 'expense', name: '買文具',       amount: 45,  icon: '✏️' },
            { type: 'expense', name: '買零食',       amount: 35,  icon: '🍿' },
            { type: 'income',  name: '幫忙家事',     amount: 20,  icon: '🧹' },
        ]},  // 答案：240
        { startAmount: 150, events: [
            { type: 'income',  name: '生日紅包',     amount: 200, icon: '🧧' },
            { type: 'expense', name: '買玩具',       amount: 120, icon: '🎮' },
            { type: 'expense', name: '看電影',       amount: 80,  icon: '🎬' },
            { type: 'expense', name: '買飲料',       amount: 35,  icon: '🧋' },
        ]},  // 答案：115
        { startAmount: 300, events: [
            { type: 'expense', name: '買運動鞋',     amount: 180, icon: '👟' },
            { type: 'income',  name: '幫鄰居送報',   amount: 50,  icon: '📰' },
            { type: 'expense', name: '買午餐',       amount: 60,  icon: '🍱' },
            { type: 'income',  name: '媽媽零用錢',   amount: 100, icon: '💝' },
        ]},  // 答案：210
        { startAmount: 500, events: [
            { type: 'expense', name: '買書包',       amount: 350, icon: '🎒' },
            { type: 'income',  name: '爺爺紅包',     amount: 100, icon: '🧧' },
            { type: 'expense', name: '買文具',       amount: 75,  icon: '✏️' },
            { type: 'income',  name: '節省獎勵',     amount: 50,  icon: '🌟' },
        ]},  // 答案：225
        { startAmount: 100, events: [
            { type: 'income',  name: '媽媽零用錢',   amount: 150, icon: '💰' },
            { type: 'expense', name: '買零食',       amount: 45,  icon: '🍬' },
            { type: 'income',  name: '幫忙澆花',     amount: 20,  icon: '🌱' },
            { type: 'expense', name: '買飲料',       amount: 30,  icon: '🧋' },
        ]},  // 答案：195
        { startAmount: 250, events: [
            { type: 'expense', name: '買故事書',     amount: 90,  icon: '📖' },
            { type: 'expense', name: '買彩色筆',     amount: 65,  icon: '🖍️' },
            { type: 'income',  name: '幫忙洗車',     amount: 80,  icon: '🚗' },
            { type: 'expense', name: '買冰淇淋',     amount: 40,  icon: '🍦' },
        ]},  // 答案：135
        { startAmount: 400, events: [
            { type: 'income',  name: '爸媽雙倍獎勵', amount: 200, icon: '🎉' },
            { type: 'expense', name: '買玩具組',     amount: 280, icon: '🧩' },
            { type: 'expense', name: '買點心',       amount: 55,  icon: '🍪' },
            { type: 'income',  name: '幫忙掃地',     amount: 30,  icon: '🧹' },
        ]},  // 答案：295
        { startAmount: 180, events: [
            { type: 'income',  name: '老師獎勵',     amount: 50,  icon: '📝' },
            { type: 'expense', name: '買午餐',       amount: 65,  icon: '🍜' },
            { type: 'income',  name: '姐姐給',       amount: 30,  icon: '💕' },
            { type: 'expense', name: '坐公車',       amount: 20,  icon: '🚌' },
        ]},  // 答案：175
        { startAmount: 350, events: [
            { type: 'expense', name: '買水彩組',     amount: 90,  icon: '🎨' },
            { type: 'income',  name: '幫忙鄰居',     amount: 50,  icon: '🏡' },
            { type: 'expense', name: '買飲料',       amount: 30,  icon: '🧃' },
            { type: 'income',  name: '媽媽獎勵',     amount: 100, icon: '💝' },
        ]},  // 答案：380
        { startAmount: 120, events: [
            { type: 'income',  name: '生日禮金',     amount: 150, icon: '🎂' },
            { type: 'expense', name: '買玩具',       amount: 95,  icon: '🎲' },
            { type: 'income',  name: '幫忙家事',     amount: 20,  icon: '🧹' },
            { type: 'expense', name: '看電影',       amount: 70,  icon: '🎬' },
        ]},  // 答案：125
        { startAmount: 450, events: [
            { type: 'expense', name: '買書包',       amount: 220, icon: '🎒' },
            { type: 'income',  name: '爸媽給零用錢', amount: 200, icon: '💰' },
            { type: 'expense', name: '買零食',       amount: 55,  icon: '🍬' },
            { type: 'income',  name: '回收獎勵',     amount: 30,  icon: '♻️' },
        ]},  // 答案：405
        { startAmount: 250, events: [
            { type: 'income',  name: '暑期工讀',     amount: 300, icon: '💼' },
            { type: 'expense', name: '買球鞋',       amount: 180, icon: '👟' },
            { type: 'expense', name: '買書',         amount: 75,  icon: '📚' },
            { type: 'income',  name: '存款利息',     amount: 20,  icon: '🏦' },
        ]},  // 答案：315
    ],
    hard: [
        { startAmount: 500, events: [
            { type: 'income',  name: '媽媽零用錢',   amount: 300, icon: '💰' },
            { type: 'expense', name: '買運動服',     amount: 280, icon: '👕' },
            { type: 'income',  name: '幫忙搬家具',   amount: 100, icon: '🛋️' },
            { type: 'expense', name: '買書',         amount: 145, icon: '📚' },
            { type: 'expense', name: '看表演',       amount: 200, icon: '🎭' },
            { type: 'income',  name: '過年紅包',     amount: 500, icon: '🧧' },
        ]},  // 答案：775
        { startAmount: 800, events: [
            { type: 'expense', name: '買腳踏車配件', amount: 350, icon: '🚴' },
            { type: 'income',  name: '比賽獎金',     amount: 200, icon: '🏆' },
            { type: 'expense', name: '買運動鞋',     amount: 480, icon: '👟' },
            { type: 'income',  name: '爺爺奶奶紅包', amount: 600, icon: '🧧' },
            { type: 'expense', name: '買生日禮物',   amount: 250, icon: '🎁' },
            { type: 'expense', name: '吃大餐',       amount: 185, icon: '🍽️' },
        ]},  // 答案：335
        { startAmount: 1000, events: [
            { type: 'income',  name: '暑期打工',     amount: 500, icon: '💼' },
            { type: 'expense', name: '買智慧手錶',   amount: 890, icon: '⌚' },
            { type: 'income',  name: '幫忙補習',     amount: 300, icon: '📖' },
            { type: 'expense', name: '買球鞋',       amount: 395, icon: '👟' },
            { type: 'income',  name: '獎學金',       amount: 200, icon: '🎓' },
            { type: 'expense', name: '買文具組',     amount: 120, icon: '✏️' },
        ]},  // 答案：595
        { startAmount: 300, events: [
            { type: 'income',  name: '爸爸月零用錢', amount: 600, icon: '💰' },
            { type: 'expense', name: '買科學玩具',   amount: 450, icon: '🔬' },
            { type: 'expense', name: '補習費',       amount: 200, icon: '📝' },
            { type: 'income',  name: '鄰居除草費',   amount: 150, icon: '🌿' },
            { type: 'expense', name: '買零食飲料',   amount: 85,  icon: '🍿' },
            { type: 'income',  name: '回收獎勵',     amount: 40,  icon: '♻️' },
        ]},  // 答案：355
        { startAmount: 600, events: [
            { type: 'expense', name: '買樂器',       amount: 380, icon: '🎸' },
            { type: 'income',  name: '表演收入',     amount: 250, icon: '🎤' },
            { type: 'expense', name: '買樂譜',       amount: 95,  icon: '🎵' },
            { type: 'income',  name: '爸媽獎勵',     amount: 300, icon: '🌟' },
            { type: 'expense', name: '買書',         amount: 180, icon: '📚' },
            { type: 'expense', name: '吃冰淇淋',     amount: 60,  icon: '🍦' },
        ]},  // 答案：435
        { startAmount: 750, events: [
            { type: 'income',  name: '春節紅包',     amount: 800, icon: '🧧' },
            { type: 'expense', name: '買遊戲',       amount: 560, icon: '🎮' },
            { type: 'income',  name: '幫忙照顧寵物', amount: 120, icon: '🐶' },
            { type: 'expense', name: '買零食',       amount: 75,  icon: '🍬' },
            { type: 'income',  name: '幫忙送貨',     amount: 200, icon: '📦' },
            { type: 'expense', name: '看電影',       amount: 160, icon: '🎬' },
        ]},  // 答案：1075
        { startAmount: 400, events: [
            { type: 'income',  name: '幫忙家教',     amount: 350, icon: '📚' },
            { type: 'expense', name: '買腳踏車',     amount: 680, icon: '🚲' },
            { type: 'income',  name: '媽媽補貼',     amount: 500, icon: '💝' },
            { type: 'expense', name: '電影加餐廳',   amount: 220, icon: '🍕' },
            { type: 'income',  name: '叔叔生日紅包', amount: 300, icon: '🎂' },
            { type: 'expense', name: '買衣服',       amount: 180, icon: '👗' },
        ]},  // 答案：470
        { startAmount: 1200, events: [
            { type: 'expense', name: '買平板電腦',   amount: 880, icon: '💻' },
            { type: 'income',  name: '過年紅包',     amount: 600, icon: '🧧' },
            { type: 'expense', name: '買書包',       amount: 350, icon: '🎒' },
            { type: 'income',  name: '幫忙翻譯',     amount: 200, icon: '🌍' },
            { type: 'expense', name: '買文具',       amount: 95,  icon: '✏️' },
            { type: 'income',  name: '節省獎金',     amount: 100, icon: '🌟' },
        ]},  // 答案：775
        { startAmount: 250, events: [
            { type: 'income',  name: '阿公零用錢',   amount: 400, icon: '👴' },
            { type: 'expense', name: '買球鞋',       amount: 320, icon: '👟' },
            { type: 'income',  name: '幫忙洗車',     amount: 80,  icon: '🚗' },
            { type: 'expense', name: '買手機殼',     amount: 45,  icon: '📱' },
            { type: 'income',  name: '賣舊玩具',     amount: 120, icon: '🧸' },
            { type: 'expense', name: '買飲料',       amount: 35,  icon: '🧃' },
        ]},  // 答案：450
        { startAmount: 900, events: [
            { type: 'expense', name: '暑期夏令營',   amount: 550, icon: '⛺' },
            { type: 'income',  name: '比賽獎金',     amount: 300, icon: '🏅' },
            { type: 'expense', name: '買新手機',     amount: 720, icon: '📱' },
            { type: 'income',  name: '爸爸獎勵',     amount: 400, icon: '👨' },
            { type: 'expense', name: '買衣服',       amount: 180, icon: '👗' },
            { type: 'income',  name: '幫忙家務',     amount: 50,  icon: '🏠' },
        ]},  // 答案：200
        { startAmount: 650, events: [
            { type: 'income',  name: '生日紅包',     amount: 500, icon: '🎂' },
            { type: 'expense', name: '買電動遊戲機', amount: 980, icon: '🎮' },
            { type: 'income',  name: '賣舊書',       amount: 120, icon: '📚' },
            { type: 'expense', name: '買零食',       amount: 65,  icon: '🍿' },
            { type: 'income',  name: '幫忙鄰居',     amount: 80,  icon: '🏡' },
            { type: 'expense', name: '買手環',       amount: 95,  icon: '⌚' },
        ]},  // 答案：210
        { startAmount: 2000, events: [
            { type: 'expense', name: '暑期旅遊費',   amount: 1200, icon: '✈️' },
            { type: 'income',  name: '打工收入',     amount: 800,  icon: '💼' },
            { type: 'expense', name: '買相機',       amount: 650,  icon: '📸' },
            { type: 'income',  name: '叔叔紅包',     amount: 400,  icon: '🧧' },
            { type: 'expense', name: '買衣服鞋子',   amount: 380,  icon: '👗' },
            { type: 'income',  name: '退費',         amount: 120,  icon: '💵' },
        ]},  // 答案：1090
    ],
};

// ── 面額分組（B1 DENOM_BY_DIFF pattern）─────────────────────────
const B2_DENOM_BY_DIFF = {
    easy:   [1, 5, 10, 50],
    normal: [1, 5, 10, 50, 100, 500],
    hard:   [1, 5, 10, 50, 100, 500, 1000]
};

// ── 日記主題（B5 partyTheme pattern）──────────────────────────
const B2_THEMES = {
    school: {
        name: '學校週記', icon: '🏫',
        templates: {
            easy: [
                { startAmount: 80,  events: [{ type:'income', name:'媽媽給零用錢', amount:50,  icon:'💰'}, { type:'expense', name:'買文具',    amount:30, icon:'✏️'}]},  // 100
                { startAmount: 60,  events: [{ type:'expense',name:'買便當',       amount:40,  icon:'🍱'}, { type:'income',  name:'幫忙打掃', amount:20, icon:'🧹'}]},  // 40
                { startAmount: 120, events: [{ type:'income', name:'考試滿分獎勵', amount:30,  icon:'🌟'}, { type:'expense', name:'買橡皮擦', amount:15, icon:'✏️'}]},  // 135
                { startAmount: 50,  events: [{ type:'income', name:'爸爸零用錢',   amount:100, icon:'💰'}, { type:'expense', name:'買書包配件', amount:45, icon:'🎒'}]},  // 105
                { startAmount: 100, events: [{ type:'expense',name:'買手搖飲',     amount:50,  icon:'🧋'}, { type:'income',  name:'幫同學帶便當', amount:20, icon:'🏃'}]},  // 70
                { startAmount: 90,  events: [{ type:'income', name:'阿嬤零用錢',   amount:40,  icon:'💝'}, { type:'expense', name:'買貼紙',    amount:20, icon:'🌸'}]},  // 110
                { startAmount: 150, events: [{ type:'expense',name:'社團費',       amount:60,  icon:'🎨'}, { type:'income',  name:'節省獎勵',  amount:25, icon:'🏅'}]},  // 115
                { startAmount: 70,  events: [{ type:'income', name:'作業優良獎',   amount:50,  icon:'🏆'}, { type:'expense', name:'買點心',    amount:35, icon:'🍪'}]},  // 85
                { startAmount: 100, events: [{ type:'expense',name:'悠遊卡加值',   amount:50,  icon:'🚌'}, { type:'income',  name:'媽媽補貼',  amount:80, icon:'💰'}]},  // 130
                { startAmount: 80,  events: [{ type:'income', name:'幫忙跑腿',     amount:30,  icon:'🏃'}, { type:'expense', name:'買鉛筆盒',  amount:40, icon:'✏️'}]},  // 70
            ],
            normal: [
                { startAmount: 200, events: [{ type:'income', name:'爸爸零用錢',   amount:100, icon:'💰'}, { type:'expense', name:'買文具',     amount:45, icon:'✏️'}, { type:'expense', name:'買便當',      amount:55, icon:'🍱'}, { type:'income', name:'幫忙家事',   amount:20, icon:'🧹'}]},  // 220
                { startAmount: 150, events: [{ type:'income', name:'期末獎勵',     amount:200, icon:'🏆'}, { type:'expense', name:'買參考書',   amount:120, icon:'📚'}, { type:'expense', name:'買文具',      amount:60, icon:'✏️'}, { type:'expense', name:'買手搖飲',  amount:30, icon:'🧋'}]},  // 140
                { startAmount: 300, events: [{ type:'expense',name:'買書包',       amount:350, icon:'🎒'}, { type:'income',  name:'媽媽補貼',   amount:200, icon:'💝'}, { type:'expense', name:'買早餐',      amount:40, icon:'🥐'}, { type:'income', name:'考試進步獎', amount:80, icon:'🌟'}]},  // 190
                { startAmount: 500, events: [{ type:'expense',name:'補習費',       amount:350, icon:'🏫'}, { type:'income',  name:'成績進步獎', amount:100, icon:'🌟'}, { type:'expense', name:'班費',        amount:50, icon:'📋'}, { type:'income', name:'節省零用錢', amount:50, icon:'💵'}]},  // 250
                { startAmount: 180, events: [{ type:'income', name:'幫同學帶便當', amount:30,  icon:'🍱'}, { type:'expense', name:'買練習卷',   amount:60,  icon:'📄'}, { type:'income',  name:'媽媽零用錢', amount:150, icon:'💰'}, { type:'expense', name:'買零食',    amount:40, icon:'🍬'}]},  // 260
                { startAmount: 250, events: [{ type:'expense',name:'買計算機',     amount:200, icon:'🔢'}, { type:'income',  name:'媽媽零用錢', amount:150, icon:'💰'}, { type:'expense', name:'買鉛筆袋',   amount:35, icon:'✏️'}, { type:'expense', name:'買手搖飲', amount:45, icon:'🥤'}]},  // 120
                { startAmount: 200, events: [{ type:'expense',name:'社團活動費',   amount:120, icon:'🎭'}, { type:'income',  name:'爸爸嘉獎',   amount:100, icon:'👨'}, { type:'expense', name:'買體育服',   amount:150, icon:'👟'}, { type:'income', name:'幫忙掃地',   amount:20, icon:'🧹'}]},  // 50
                { startAmount: 300, events: [{ type:'income', name:'壓歲錢',       amount:200, icon:'🧧'}, { type:'expense', name:'買參考書',   amount:180, icon:'📚'}, { type:'income',  name:'爸爸嘉獎',   amount:80,  icon:'👨'}, { type:'expense', name:'買手搖飲', amount:50, icon:'🧋'}]},  // 350
            ],
            hard: [
                { startAmount: 600,  events: [{ type:'expense',name:'買教科書組',  amount:400, icon:'📘'}, { type:'income',  name:'打工薪資',   amount:700, icon:'💼'}, { type:'expense', name:'買制服',      amount:600, icon:'👔'}, { type:'income', name:'考試獎勵',   amount:150, icon:'🏅'}, { type:'expense', name:'悠遊卡加值', amount:200, icon:'🚌'}]},  // 250
                { startAmount: 800,  events: [{ type:'income', name:'課輔獎助學金', amount:500, icon:'🎓'}, { type:'expense', name:'買無線耳機', amount:800, icon:'🎧'}, { type:'income',  name:'期末考獎勵', amount:200, icon:'🌟'}, { type:'expense', name:'買文具組',   amount:95, icon:'✏️'}, { type:'income', name:'節省零用錢', amount:80, icon:'💵'}]},  // 685
                { startAmount: 1000, events: [{ type:'expense',name:'語言補習費',  amount:900, icon:'🗣️'}, { type:'income',  name:'打工薪資',   amount:700, icon:'💼'}, { type:'expense', name:'買參考書組', amount:250, icon:'📚'}, { type:'income', name:'媽媽獎勵',   amount:250, icon:'💝'}, { type:'expense', name:'班遊費',     amount:300, icon:'🚌'}]},  // 500
                { startAmount: 600,  events: [{ type:'income', name:'英語競賽獎金', amount:500, icon:'🏆'}, { type:'expense', name:'補習費',     amount:600, icon:'🏫'}, { type:'income',  name:'爸爸補貼',   amount:500, icon:'👨'}, { type:'expense', name:'買球鞋',     amount:800, icon:'👟'}, { type:'income', name:'節約獎勵',   amount:100, icon:'💰'}]},  // 300
                { startAmount: 500,  events: [{ type:'expense',name:'暑期才藝課',  amount:600, icon:'🎵'}, { type:'income',  name:'打工薪資',   amount:800, icon:'💼'}, { type:'expense', name:'買教科書',   amount:350, icon:'📚'}, { type:'income', name:'考試滿分獎', amount:200, icon:'🌟'}, { type:'expense', name:'買手機殼',   amount:150, icon:'📱'}]},  // 400
            ],
        },
    },
    holiday: {
        name: '假期日記', icon: '🎉',
        templates: {
            easy: [
                { startAmount: 100, events: [{ type:'income', name:'過年紅包',    amount:200, icon:'🧧'}, { type:'expense', name:'買遊戲點數', amount:150, icon:'🎮'}]},  // 150
                { startAmount: 80,  events: [{ type:'expense',name:'看電影',      amount:60,  icon:'🎬'}, { type:'income',  name:'壓歲錢',    amount:50,  icon:'🎊'}]},  // 70
                { startAmount: 200, events: [{ type:'income', name:'阿姨紅包',    amount:100, icon:'💝'}, { type:'expense', name:'買零食飲料', amount:45,  icon:'🍬'}]},  // 255
                { startAmount: 50,  events: [{ type:'income', name:'中秋紅包',    amount:100, icon:'🎑'}, { type:'expense', name:'買月餅',     amount:60,  icon:'🥮'}]},  // 90
                { startAmount: 150, events: [{ type:'expense',name:'遊樂園票',    amount:100, icon:'🎡'}, { type:'income',  name:'幫忙家事',  amount:40,  icon:'🧹'}]},  // 90
                { startAmount: 120, events: [{ type:'income', name:'聖誕紅包',    amount:80,  icon:'🎄'}, { type:'expense', name:'買交換禮物', amount:65,  icon:'🎁'}]},  // 135
                { startAmount: 80,  events: [{ type:'expense',name:'逛夜市',      amount:50,  icon:'🌙'}, { type:'income',  name:'爺爺獎勵',  amount:60,  icon:'👴'}]},  // 90
                { startAmount: 200, events: [{ type:'expense',name:'買漫畫',      amount:90,  icon:'📚'}, { type:'income',  name:'叔叔紅包',  amount:120, icon:'🧧'}]},  // 230
                { startAmount: 100, events: [{ type:'income', name:'端午紅包',    amount:80,  icon:'🎋'}, { type:'expense', name:'買手搖飲',   amount:45,  icon:'🧋'}]},  // 135
                { startAmount: 70,  events: [{ type:'expense',name:'買冰淇淋',    amount:35,  icon:'🍦'}, { type:'income',  name:'假期幫忙獎', amount:50,  icon:'🏅'}]},  // 85
            ],
            normal: [
                { startAmount: 200, events: [{ type:'income', name:'過年紅包',    amount:500, icon:'🧧'}, { type:'expense', name:'買衣服',     amount:220, icon:'👕'}, { type:'expense', name:'看電影',   amount:80,  icon:'🎬'}, { type:'expense', name:'買零食',   amount:45,  icon:'🍿'}]},  // 355
                { startAmount: 150, events: [{ type:'income', name:'生日禮金',    amount:300, icon:'🎂'}, { type:'expense', name:'買遊樂園票', amount:150, icon:'🎡'}, { type:'expense', name:'買紀念品', amount:85,  icon:'🎠'}, { type:'expense', name:'買飲料',   amount:40,  icon:'🧋'}]},  // 175
                { startAmount: 300, events: [{ type:'expense',name:'聖誕購物',    amount:180, icon:'🎄'}, { type:'income',  name:'爺爺紅包',  amount:200, icon:'👴'}, { type:'expense', name:'買裝飾品', amount:65,  icon:'✨'}, { type:'income', name:'幫忙家事', amount:50,  icon:'🧹'}]},  // 305
                { startAmount: 500, events: [{ type:'expense',name:'暑期夏令營',  amount:350, icon:'⛺'}, { type:'income',  name:'壓歲錢',    amount:300, icon:'🎊'}, { type:'expense', name:'買泳鏡泳帽', amount:120, icon:'🏊'}, { type:'income', name:'叔叔補貼', amount:100, icon:'👨'}]},  // 430
                { startAmount: 100, events: [{ type:'income', name:'中秋紅包',    amount:200, icon:'🎑'}, { type:'expense', name:'買月餅盒',  amount:90,  icon:'🥮'}, { type:'income', name:'幫忙採購', amount:30, icon:'🛒'}, { type:'expense', name:'買燈籠',   amount:50,  icon:'🏮'}]},  // 190
                { startAmount: 250, events: [{ type:'expense',name:'跨年煙火活動', amount:120, icon:'🎆'}, { type:'income', name:'阿姨紅包',  amount:150, icon:'💝'}, { type:'expense', name:'買飲料零食', amount:65, icon:'🥤'}, { type:'expense', name:'買帽子',   amount:45,  icon:'🎩'}]},  // 170
                { startAmount: 200, events: [{ type:'income', name:'生日禮金',    amount:300, icon:'🎂'}, { type:'expense', name:'唱KTV',     amount:150, icon:'🎤'}, { type:'expense', name:'買衣服',   amount:120, icon:'👕'}, { type:'income', name:'爸媽補貼', amount:50,  icon:'💰'}]},  // 280
                { startAmount: 300, events: [{ type:'income', name:'暑假打工薪資', amount:400, icon:'💼'}, { type:'expense', name:'買球鞋',    amount:500, icon:'👟'}, { type:'income', name:'阿嬤紅包', amount:200, icon:'👵'}, { type:'expense', name:'逛夜市',   amount:80,  icon:'🌙'}]},  // 320
            ],
            hard: [
                { startAmount: 600,  events: [{ type:'income', name:'過年紅包合計', amount:800, icon:'🧧'}, { type:'expense', name:'買電玩遊戲', amount:680, icon:'🎮'}, { type:'expense', name:'春節旅遊',   amount:350, icon:'🚌'}, { type:'income', name:'爺爺另外給', amount:200, icon:'👴'}, { type:'expense', name:'買紀念品', amount:120, icon:'🎁'}]},  // 450
                { startAmount: 800,  events: [{ type:'expense',name:'暑假旅遊零花', amount:1200, icon:'✈️'}, { type:'income', name:'打工收入',   amount:600, icon:'💼'}, { type:'expense', name:'買伴手禮',   amount:280, icon:'🎀'}, { type:'income', name:'叔叔補助', amount:400, icon:'👨'}, { type:'expense', name:'逛夜市',    amount:150, icon:'🌙'}]},  // 170
                { startAmount: 1000, events: [{ type:'income', name:'生日禮金合計', amount:700, icon:'🎂'}, { type:'expense', name:'買二手Switch', amount:980, icon:'🎮'}, { type:'income', name:'爸媽補貼',   amount:400, icon:'💰'}, { type:'expense', name:'買生日蛋糕', amount:200, icon:'🎂'}, { type:'expense', name:'買新衣服',  amount:150, icon:'👗'}]},  // 770
                { startAmount: 500,  events: [{ type:'expense',name:'聖誕購物節',   amount:450, icon:'🎄'}, { type:'income',  name:'聖誕紅包',   amount:300, icon:'🎅'}, { type:'expense', name:'買裝飾品',   amount:180, icon:'✨'}, { type:'income', name:'義賣義工',  amount:120, icon:'💚'}, { type:'expense', name:'買聖誕禮',  amount:95,  icon:'🎁'}]},  // 195
                { startAmount: 400,  events: [{ type:'income', name:'暑假打工月薪', amount:800, icon:'💼'}, { type:'expense', name:'音樂節門票', amount:600, icon:'🎵'}, { type:'income',  name:'阿姨補貼',   amount:300, icon:'💝'}, { type:'expense', name:'買夏季服裝', amount:450, icon:'👕'}, { type:'income', name:'節省獎勵',  amount:100, icon:'🏅'}]},  // 550
            ],
        },
    },
    family: {
        name: '家庭日記', icon: '👨‍👩‍👧',
        templates: {
            easy: [
                { startAmount: 100, events: [{ type:'income', name:'媽媽零用錢',   amount:50,  icon:'💰'}, { type:'expense', name:'買早餐',     amount:30, icon:'🥐'}]},  // 120
                { startAmount: 60,  events: [{ type:'income', name:'幫忙洗碗',     amount:20,  icon:'🍽️'}, { type:'expense', name:'買點心',     amount:15, icon:'🍪'}]},  // 65
                { startAmount: 150, events: [{ type:'expense',name:'幫媽媽採買',   amount:50,  icon:'🛒'}, { type:'income',  name:'爸爸獎勵',  amount:30, icon:'👨'}]},  // 130
                { startAmount: 80,  events: [{ type:'income', name:'幫忙打掃',     amount:30,  icon:'🧹'}, { type:'expense', name:'買衛生紙',   amount:20, icon:'🧻'}]},  // 90
                { startAmount: 200, events: [{ type:'expense',name:'買洗碗精',     amount:40,  icon:'🧴'}, { type:'income',  name:'媽媽感謝',  amount:50, icon:'💝'}]},  // 210
                { startAmount: 70,  events: [{ type:'income', name:'幫忙倒垃圾',   amount:15,  icon:'🗑️'}, { type:'expense', name:'買水果',     amount:35, icon:'🍎'}]},  // 50
                { startAmount: 120, events: [{ type:'income', name:'幫做家常菜',   amount:40,  icon:'🍳'}, { type:'expense', name:'買食材',     amount:55, icon:'🥦'}]},  // 105
                { startAmount: 90,  events: [{ type:'expense',name:'買家用品',     amount:25,  icon:'🏠'}, { type:'income',  name:'阿嬤零用錢', amount:60, icon:'👵'}]},  // 125
                { startAmount: 100, events: [{ type:'income', name:'幫忙整理房間', amount:30,  icon:'🛏️'}, { type:'expense', name:'買家用零食', amount:25, icon:'🍬'}]},  // 105
                { startAmount: 80,  events: [{ type:'expense',name:'幫媽媽代買物', amount:40,  icon:'🛒'}, { type:'income',  name:'爸爸感謝金', amount:50, icon:'👨'}]},  // 90
            ],
            normal: [
                { startAmount: 200, events: [{ type:'income', name:'爸爸零用錢',   amount:100, icon:'💰'}, { type:'expense', name:'買菜',       amount:80, icon:'🥦'}, { type:'income', name:'幫忙買菜', amount:20, icon:'🛒'}, { type:'expense', name:'買調味料',   amount:35, icon:'🧂'}]},  // 205
                { startAmount: 300, events: [{ type:'expense',name:'家庭聚餐費',   amount:200, icon:'🍜'}, { type:'income',  name:'奶奶紅包',  amount:150, icon:'💝'}, { type:'expense', name:'買甜點',  amount:60, icon:'🎂'}, { type:'expense', name:'買飲料',     amount:40, icon:'🧃'}]},  // 150
                { startAmount: 150, events: [{ type:'income', name:'幫忙家務',     amount:80,  icon:'🧹'}, { type:'expense', name:'買清潔劑',  amount:45, icon:'🧴'}, { type:'income', name:'媽媽感謝金', amount:50, icon:'💰'}, { type:'expense', name:'買零食',     amount:30, icon:'🍬'}]},  // 205
                { startAmount: 400, events: [{ type:'expense',name:'買廚具組',     amount:250, icon:'🍳'}, { type:'income',  name:'叔叔給的', amount:200, icon:'👨'}, { type:'expense', name:'買食材',  amount:90, icon:'🥕'}, { type:'income', name:'幫忙採購獎', amount:60, icon:'🌟'}]},  // 320
                { startAmount: 100, events: [{ type:'income', name:'媽媽零用錢',   amount:150, icon:'💰'}, { type:'expense', name:'買菜',       amount:60, icon:'🥬'}, { type:'expense', name:'買水果',  amount:45, icon:'🍊'}, { type:'income', name:'爸爸嘉獎',   amount:30, icon:'👨'}]},  // 175
                { startAmount: 250, events: [{ type:'expense',name:'家庭旅遊費',   amount:180, icon:'🚌'}, { type:'income',  name:'阿公零用', amount:150, icon:'👴'}, { type:'expense', name:'買零食',  amount:40, icon:'🍿'}, { type:'income', name:'幫忙整理',   amount:25, icon:'🗂️'}]},  // 205
                { startAmount: 200, events: [{ type:'income', name:'辦生日聚會獎', amount:100, icon:'🎂'}, { type:'expense', name:'買蛋糕材料', amount:130, icon:'🎂'}, { type:'income', name:'爺爺贈金', amount:150, icon:'👴'}, { type:'expense', name:'買飲料',    amount:50, icon:'🧃'}]},  // 270
                { startAmount: 150, events: [{ type:'expense',name:'幫媽媽繳電費', amount:100, icon:'⚡'}, { type:'income',  name:'家務獎勵', amount:80,  icon:'🧹'}, { type:'income', name:'阿嬤給零用', amount:120, icon:'👵'}, { type:'expense', name:'買家用零食', amount:40, icon:'🍬'}]},  // 210
            ],
            hard: [
                { startAmount: 500,  events: [{ type:'income', name:'爸爸給生活費', amount:800, icon:'👨'}, { type:'expense', name:'全家聚餐費',   amount:450, icon:'🍜'}, { type:'expense', name:'買媽媽禮物', amount:380, icon:'🎁'}, { type:'income', name:'媽媽零用錢', amount:200, icon:'💰'}, { type:'expense', name:'買家用日常品', amount:120, icon:'🧴'}]},  // 550
                { startAmount: 800,  events: [{ type:'income', name:'年終家庭獎金', amount:500, icon:'💵'}, { type:'expense', name:'全家出遊費',   amount:650, icon:'🚌'}, { type:'income',  name:'舊物義賣',   amount:200, icon:'♻️'}, { type:'expense', name:'買伴手禮', amount:180, icon:'🎁'}, { type:'expense', name:'景點門票費', amount:90, icon:'🎟️'}]},  // 580
                { startAmount: 1000, events: [{ type:'expense',name:'全家旅遊費',   amount:800, icon:'✈️'}, { type:'income',  name:'打工薪資',   amount:350, icon:'💼'}, { type:'expense', name:'買旅行用品', amount:200, icon:'🧳'}, { type:'income', name:'爺爺補貼',  amount:300, icon:'👴'}, { type:'expense', name:'景點紀念品', amount:150, icon:'🗺️'}]},  // 500
                { startAmount: 400,  events: [{ type:'income', name:'家庭分工獎勵', amount:500, icon:'🏡'}, { type:'expense', name:'全家外食費',   amount:380, icon:'🍜'}, { type:'income',  name:'奶奶給零用', amount:200, icon:'👵'}, { type:'expense', name:'買清潔用品組', amount:80, icon:'🧼'}, { type:'income', name:'爸爸補貼',  amount:100, icon:'👨'}]},  // 740
                { startAmount: 500,  events: [{ type:'income', name:'春節打工薪資', amount:700, icon:'💼'}, { type:'expense', name:'全家旅遊零花', amount:600, icon:'🚌'}, { type:'income',  name:'阿公阿嬤補貼', amount:400, icon:'👴'}, { type:'expense', name:'家庭聚餐費', amount:200, icon:'🍜'}, { type:'expense', name:'添購日用品', amount:100, icon:'🛒'}]},  // 700
            ],
        },
    },
};

// ── 金額語音轉換（安全版）──────────────────────────────────────
const toTWD = v => typeof convertToTraditionalCurrency === 'function'
    ? convertToTraditionalCurrency(v) : `${v}元`;

// ── Game 物件 ────────────────────────────────────────────────────
let Game;

document.addEventListener('DOMContentLoaded', () => {
    Game = {

        // ── 1. Debug ──────────────────────────────────────────
        Debug: {
            FLAGS: { all: false, init: false, speech: false, question: false, error: true },
            log(cat, ...a)  { if (this.FLAGS.all || this.FLAGS[cat]) console.log(`[B2-${cat}]`, ...a); },
            warn(cat, ...a) { if (this.FLAGS.all || this.FLAGS[cat]) console.warn(`[B2-${cat}]`, ...a); },
            error(...a)     { console.error('[B2-ERROR]', ...a); },
        },

        // ── 2. TimerManager ───────────────────────────────────
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
            },
        },

        // ── 3. EventManager ───────────────────────────────────
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
                        try { l.element?.removeEventListener(l.type, l.handler, l.options); } catch(e) {}
                        this.listeners[i] = null;
                    }
                });
            },
        },

        // ── 4. Audio ──────────────────────────────────────────
        audio: {
            sounds: {},
            init() {
                ['correct', 'success', 'error', 'click', 'keypad'].forEach(name => {
                    const el = document.getElementById(`${name}-sound`);
                    if (el) this.sounds[name] = el;
                });
            },
            play(name) {
                const s = this.sounds[name];
                if (!s) return;
                try { s.currentTime = 0; s.play().catch(() => {}); } catch(e) {}
            },
        },

        // ── 5. Speech ─────────────────────────────────────────
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
                const safeCallback = () => { if (callbackExecuted) return; callbackExecuted = true; callback?.(); };
                u.onend = safeCallback;
                u.onerror = (e) => { if (e.error !== 'interrupted') Game.Debug.warn('speech', '語音錯誤', e.error); safeCallback(); };
                Game.TimerManager.setTimeout(safeCallback, 10000, 'speech');
                try {
                    window.speechSynthesis.speak(u);
                } catch(e) {
                    Game.Debug.warn('speech', '語音播放失敗', e);
                    safeCallback();
                }
            },
        },

        // ── 6. State ──────────────────────────────────────────
        state: {
            settings: { difficulty: null, questionCount: null, retryMode: 'retry', clickMode: 'off', diaryTheme: null, customItemsEnabled: false },
            quiz: {
                currentQuestion: 0,
                totalQuestions: 10,
                correctCount: 0,
                errorCount: 0,
                streak: 0,
                questions: [],
                answeredHistory: [],
                startTime: null,
                currentInput: '',
                showHint: false,
                hintSlots: [],
                walletRevealed: false,
                p2ErrorCount: 0,
            },
            isEndingGame: false,
            isProcessing: false,
            wallet: [],
            uidCounter: 0,
        },

        // ── 7. Init ───────────────────────────────────────────
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
        },

        injectGlobalAnimationStyles() {
            if (document.getElementById('b2-global-animations')) return;
            const style = document.createElement('style');
            style.id = 'b2-global-animations';
            style.textContent = `
                @keyframes b2RowIn {
                    from { opacity: 0; transform: translateX(-12px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes b2CoinIn {
                    0%   { opacity: 0; transform: translateY(-18px) scale(0.5); }
                    65%  { transform: translateY(4px) scale(1.1); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes b2P2FadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        },

        resetGameState() {
            const q = this.state.quiz;
            q.currentQuestion  = 0;
            q.totalQuestions   = this.state.settings.questionCount;
            q.correctCount     = 0;
            q.streak           = 0;
            q.questions        = [];
            q.answeredHistory  = [];
            q.startTime        = null;
            q.currentInput     = '';
            this.state.isEndingGame = false;
            this.state.isProcessing  = false;
            Game.Debug.log('init', '🔄 [B2] 遊戲狀態已重置');
        },

        // ── 8. 設定頁 ─────────────────────────────────────────
        showSettings() {
            window.speechSynthesis.cancel();
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            this.resetGameState();
            document.getElementById('app').innerHTML = this._renderSettingsHTML();
            this._bindSettingsEvents();
        },

        _renderSettingsHTML() {
            return `
            <div class="unit-welcome">
                <div class="welcome-content">
                    <div class="settings-title-row">
                        <img src="../images/common/hint_detective.png" alt="金錢小助手"
                             class="settings-mascot-img" onerror="this.style.display='none'">
                        <h1>單元B2：零用錢日記</h1>
                    </div>
                    <div class="game-settings">
                        <div class="b-setting-group">
                            <label style="font-size:13px;color:#6b7280;text-align:left;display:block;">
                                ✨ 看每週的收入和支出，計算最後剩下多少錢<br>
                                簡單：2個事件，點擊/拖曳；普通：4個事件，選擇題；困難：5個事件，數字輸入
                            </label>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">難度：</label>
                            <div class="b-btn-group" id="diff-group">
                                <button class="b-sel-btn b-diff-easy"   data-val="easy">簡單</button>
                                <button class="b-sel-btn b-diff-normal" data-val="normal">普通</button>
                                <button class="b-sel-btn b-diff-hard"   data-val="hard">困難</button>
                            </div>
                            <div class="b-diff-desc" id="diff-desc"></div>
                        </div>
                        <div class="b-setting-group" id="assist-click-group" style="display:none;">
                            <label class="b-setting-label">🤖 輔助點擊：</label>
                            <div class="b-btn-group" id="assist-group">
                                <button class="b-sel-btn${this.state.settings.clickMode === 'on' ? ' active' : ''}" data-val="on">✓ 啟用</button>
                                <button class="b-sel-btn${this.state.settings.clickMode !== 'on' ? ' active' : ''}" data-val="off">✗ 停用</button>
                            </div>
                            <div style="margin-top:4px;font-size:12px;color:#6b7280;">
                                啟用後，只要偵測到點擊便會自動執行下一個步驟
                            </div>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">📓 日記主題：</label>
                            <div class="b-btn-group" id="theme-group">
                                <button class="b-sel-btn" data-theme="random">隨機 🎲</button>
                                <button class="b-sel-btn" data-theme="school">🏫 學校</button>
                                <button class="b-sel-btn" data-theme="holiday">🎉 假期</button>
                                <button class="b-sel-btn" data-theme="family">👨‍👩‍👧 家庭</button>
                            </div>
                            <div id="b2-custom-events-toggle-row" style="display:none;margin-top:8px;">
                                <label style="font-size:13px;color:#374151;font-weight:600;">🛠️ 自訂事件</label>
                                <div class="b-btn-group" id="b2-custom-events-group" style="margin-top:4px;">
                                    <button class="b-sel-btn active" data-custom="off">關閉</button>
                                    <button class="b-sel-btn" data-custom="on">開啟</button>
                                </div>
                                <div style="margin-top:4px;font-size:12px;color:#6b7280;">開啟後，可新增或刪除收支事件，系統將依自訂事件計算答案</div>
                            </div>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">題數：</label>
                            <div class="b-btn-group" id="count-group">
                                <button class="b-sel-btn" data-val="1">1題</button>
                                <button class="b-sel-btn" data-val="5">5題</button>
                                <button class="b-sel-btn" data-val="10">10題</button>
                                <button class="b-sel-btn" data-val="15">15題</button>
                                <button class="b-sel-btn" data-val="20">20題</button>
                                <button class="b-sel-btn" id="b2-custom-count-btn">自訂選項</button>
                            </div>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">🎁 獎勵系統：</label>
                            <div class="b-btn-group">
                                <a href="#" id="settings-reward-link" class="b-sel-btn active"
                                   style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">
                                    開啟獎勵系統
                                </a>
                            </div>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">📝 作業單：</label>
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
        },

        _diffDescriptions: {
            easy:   '簡單：每次會有2個事件（含收入/支出混合），視覺提示下點擊或拖曳金錢圖示完成。',
            normal: '普通：每次會有4個事件，作答方式為選擇題。',
            hard:   '困難：每次會有5個事件，輸入正確金額。',
        },

        _bindSettingsEvents() {
            Game.EventManager.removeByCategory('settings');
            document.querySelectorAll('#diff-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#diff-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.difficulty = btn.dataset.val;
                    const desc = document.getElementById('diff-desc');
                    if (desc) { desc.textContent = this._diffDescriptions[btn.dataset.val]; desc.classList.add('show'); }
                    const assistGroup = document.getElementById('assist-click-group');
                    const customRow = document.getElementById('b2-custom-events-toggle-row');
                    if (btn.dataset.val === 'easy') {
                        if (assistGroup) assistGroup.style.display = '';
                        if (customRow) customRow.style.display = 'none';
                        this.state.settings.customItemsEnabled = false;
                        document.querySelectorAll('#b2-custom-events-group [data-custom]').forEach(b => b.classList.toggle('active', b.dataset.custom === 'off'));
                    } else {
                        if (assistGroup) assistGroup.style.display = 'none';
                        this.state.settings.clickMode = 'off';
                        if (customRow) customRow.style.display = '';
                    }
                    this._checkCanStart();
                }, {}, 'settings');
            });

            document.querySelectorAll('#count-group .b-sel-btn:not(#b2-custom-count-btn)').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#count-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.questionCount = parseInt(btn.dataset.val);
                    this._checkCanStart();
                }, {}, 'settings');
            });

            // 自訂題數
            const b2CustomCountBtn = document.getElementById('b2-custom-count-btn');
            if (b2CustomCountBtn) {
                Game.EventManager.on(b2CustomCountBtn, 'click', () => {
                    this._showSettingsCountNumpad('題數', (n) => {
                        document.querySelectorAll('#count-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                        b2CustomCountBtn.classList.add('active');
                        b2CustomCountBtn.textContent = `${n}題`;
                        this.state.settings.questionCount = n;
                        this._checkCanStart();
                    });
                }, {}, 'settings');
            }

            const rewardLink = document.getElementById('settings-reward-link');
            Game.EventManager.on(rewardLink, 'click', (e) => {
                e.preventDefault();
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'settings');

            document.querySelectorAll('#theme-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#theme-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.diaryTheme = btn.dataset.theme;
                    this._checkCanStart();
                }, {}, 'settings');
            });

            document.querySelectorAll('#b2-custom-events-group [data-custom]').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#b2-custom-events-group [data-custom]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.customItemsEnabled = btn.dataset.custom === 'on';
                }, {}, 'settings');
            });

            document.querySelectorAll('#assist-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#assist-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.clickMode = btn.dataset.val;
                    this._checkCanStart();
                }, {}, 'settings');
            });

            // 作業單
            Game.EventManager.on(document.getElementById('settings-worksheet-link'), 'click', (e) => {
                e.preventDefault();
                const params = new URLSearchParams({ unit: 'b2' });
                window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
            }, {}, 'settings');

            Game.EventManager.on(document.getElementById('start-btn'), 'click', () => this.startGame(), {}, 'settings');
        },

        _checkCanStart() {
            const btn = document.getElementById('start-btn');
            const s = this.state.settings;
            if (btn) btn.disabled = !s.difficulty || !s.questionCount || !s.diaryTheme;
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

        // ── 9. 遊戲開始 ───────────────────────────────────────
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
            q.questions       = this._generateQuestions(s.questionCount);
            q.currentInput    = '';

            this.state.isEndingGame = false;
            this.state.isProcessing  = false;

            // 設定頁消失後，renderQuestion 渲染題目頁，再由 _showTaskIntroModal 顯示彈窗
            this.renderQuestion();
        },

        // ── 10. 題目產生 ──────────────────────────────────────
        _generateQuestions(count) {
            const diff    = this.state.settings.difficulty;
            const theme   = this.state.settings.diaryTheme;
            let templates;
            if (theme === 'random') {
                // 隨機模式：每題從三主題各自隨機抽取
                const keys = ['school', 'holiday', 'family'];
                const merged = keys.flatMap(k => (B2_THEMES[k].templates[diff] || []).map(t => ({ ...t, _theme: k })));
                templates = merged.sort(() => Math.random() - 0.5);
            } else {
                const themeData = B2_THEMES[theme];
                const basePool  = themeData ? themeData.templates[diff] : B2_TEMPLATES[diff];
                templates = (basePool && basePool.length > 0 ? basePool : B2_TEMPLATES[diff]).slice().sort(() => Math.random() - 0.5);
            }

            // 金額浮動（±15%，四捨五入至5元，最小5元）
            const randVariant = (base) => {
                const step = 5;
                const v  = Math.max(step, Math.round(base * 0.15 / step) * step);
                const lo = Math.max(step, base - v);
                const hi = base + v;
                return Math.round((lo + Math.random() * (hi - lo)) / step) * step || step;
            };

            const result = [];
            for (let i = 0; i < count; i++) {
                const tmpl = templates[i % templates.length];
                // 嘗試浮動金額
                const startAmountR = randVariant(tmpl.startAmount);
                const eventsR = tmpl.events.map(e => ({ ...e, amount: randVariant(e.amount) }));
                let answerR = startAmountR;
                eventsR.forEach(e => { answerR += e.type === 'income' ? e.amount : -e.amount; });
                // 答案若為負值或過小，退回原始金額（保留題目可玩性）
                const useVariant = answerR >= 5;
                const startAmount = useVariant ? startAmountR : tmpl.startAmount;
                const events      = useVariant ? eventsR : tmpl.events.map(e => ({ ...e }));
                const answer      = useVariant ? answerR  : this._calcAnswer(tmpl);
                const choices = diff === 'easy' ? this._generateChoices(answer) : null;
                result.push({ ...tmpl, startAmount, events, answer, choices });
            }
            return result;
        },

        _calcAnswer(tmpl) {
            let balance = tmpl.startAmount;
            tmpl.events.forEach(e => {
                balance += e.type === 'income' ? e.amount : -e.amount;
            });
            return balance;
        },

        _getEffectiveEvents(question) {
            const base   = question.events.filter(e => !e._deleted);
            const custom = (this.state.quiz.customEvents || []).filter(e => !e._deleted);
            return [...base, ...custom];
        },

        _getEffectiveAnswer(question) {
            let balance = question.startAmount;
            this._getEffectiveEvents(question).forEach(e => {
                balance += e.type === 'income' ? e.amount : -e.amount;
            });
            return balance;
        },

        _generateChoices(correct) {
            // Generate distractors far enough apart to be meaningfully different
            const opts = new Set([correct]);
            const deltas = [20, 30, 50, 40, 60, 25, 35, 45];
            let di = 0;
            while (opts.size < 3 && di < deltas.length * 2) {
                const delta = deltas[di % deltas.length];
                const candidate = di % 2 === 0 ? correct + delta : Math.max(0, correct - delta);
                if (candidate !== correct) opts.add(candidate);
                di++;
            }
            return Array.from(opts).sort(() => Math.random() - 0.5);
        },

        // ── 11. 題目渲染 ──────────────────────────────────────
        renderQuestion() {
            Game.TimerManager.clearAll();
            window.speechSynthesis.cancel();
            Game.EventManager.removeByCategory('gameUI');
            AssistClick.deactivate();
            this.state.isProcessing  = false;
            this.state.quiz.currentInput = '';
            // 重置 Phase 1/2 狀態
            this.state.wallet = [];
            this.state.uidCounter = 0;
            this.state.quiz.showHint = false;
            this.state.quiz.hintSlots = [];
            this.state.quiz.walletRevealed = false;
            this.state.quiz.p2ErrorCount = 0;
            this.state.quiz.hardTotalInput = '';
            this.state.quiz.errorCount = 0;
            this.state.quiz.easyCoinsClicked = {};
            this.state.quiz.easyRunningTotal = 0;
            this.state.quiz.easyEventTotals = {};
            this.state.quiz.easyCoinsbound = false;
            this.state.quiz.easyRevealedUpTo = 0;
            this.state.quiz.animateSequentialCancelled = false;
            this.state.quiz.hintSequential = false;
            this.state.quiz.activeInputEl = null;
            this.state.quiz.walletPhaseActive = false;
            this.state.quiz.p2RequiredTotal = 0;

            const q   = this.state.quiz;
            // 重置自訂事件狀態
            q.customEvents = [];
            const currQ = q.questions[q.currentQuestion];
            if (currQ) currQ.events.forEach(e => { e._deleted = false; });

            const app = document.getElementById('app');
            app.innerHTML = this._renderQuestionHTML(q.questions[q.currentQuestion]);
            this._bindQuestionEvents(q.questions[q.currentQuestion]);

            // 語音引導
            const currentQ = this.state.quiz.questions[this.state.quiz.currentQuestion];
            const diff = this.state.settings.difficulty;

            const introSpeech = `請計算每筆收入和支出，算出最後的金額。`;
            const speechMap = { easy: introSpeech, normal: introSpeech, hard: introSpeech };
            this.state.quiz.lastSpeechText = speechMap[diff];

            // 完整鏈式順序：起始彈窗語音 → 關閉彈窗 → 主題語音 → Easy逐項動畫 or 輔助點擊
            this._showTaskIntroModal(currentQ, () => {
                Game.TimerManager.setTimeout(() => {
                    Game.Speech.speak(speechMap[diff], () => {
                        // 主題語音結束後才啟動 Easy 動畫或輔助點擊，避免語音互相中斷
                        if (diff === 'easy') {
                            this._animateEasyEntriesSequential(currentQ);
                            // 簡單模式永遠啟動輔助點擊提示動畫
                            Game.TimerManager.setTimeout(() => AssistClick.activate(currentQ), 600, 'ui');
                        } else if (this.state.settings.clickMode === 'on') {
                            Game.TimerManager.setTimeout(() => AssistClick.activate(currentQ), 300, 'ui');
                        }

                    });
                }, 200, 'speech');
            });
        },

        _renderQuestionHTML(question) {
            const diff = this.state.settings.difficulty;
            const q    = this.state.quiz;
            const pct  = Math.round((q.currentQuestion / q.totalQuestions) * 100);
            const useCustom = this.state.settings.customItemsEnabled && diff !== 'easy';
            const isHard = diff === 'hard';
            const isNormal = diff === 'normal';
            const isNormalOrHard = isNormal || isHard;

            const effectiveAnswer = this._getEffectiveAnswer(question);

            // 事件列：依難度使用不同元件
            let runningAmt = question.startAmount;
            const eventsHTML = question.events.map((e, idx) => {
                runningAmt = e.type === 'income' ? runningAmt + e.amount : runningAmt - e.amount;
                const hiddenStyle = diff === 'easy' ? 'style="display:none"' : `style="animation-delay:${0.05 * (idx + 1)}s"`;
                const delBtn = useCustom ? `<button class="b2-cep-del-btn" data-base-idx="${idx}" title="刪除">✕</button>` : '';
                const runningValHtml = '';

                let moneyIconsHtml, amountHtml;
                if (diff === 'easy') {
                    moneyIconsHtml = this._renderB2ClickableCoins(e.amount, idx);
                    amountHtml = `<span class="b2-event-amount-easy" id="b2-easy-amt-${idx}">？ 元</span>`;
                } else {
                    moneyIconsHtml = this._renderMoneyIconsGrouped(e.amount);
                    amountHtml = `<div class="b2-cost-input" data-idx="${idx}" data-correct="${e.amount}" id="b2-cost-input-${idx}" tabindex="-1">？ 元</div>`;
                }

                return `
                <div class="b2-event-row ${e.type}" ${hiddenStyle} id="b2-base-event-${idx}">
                    <div class="b2-event-top">
                        <span class="b2-type-badge ${e.type}">${e.type === 'income' ? '收入 📥' : '支出 📤'}</span>
                        <span class="b2-event-icon">${e.icon}</span>
                        <span class="b2-event-name">${e.name}</span>
                        ${runningValHtml}
                        ${delBtn}
                    </div>
                    <div class="b2-event-bottom">
                        <div class="b2-event-money-icons">${moneyIconsHtml}</div>
                        ${amountHtml}
                    </div>
                </div>`;
            }).join('');
            const customPanelHTML = useCustom ? this._renderCustomEventsPanel() : '';

            // 總計列：普通/困難均改為輸入框
            const totalStripHTML = isNormalOrHard ? `
                <div class="b2-total-strip">
                    <span class="b2-ts-label">💰 最後剩下</span>
                    <div class="b2-cost-input b2-total-input" data-idx="total" data-correct="${effectiveAnswer}" id="b2-total-input" tabindex="-1">？ 元</div>
                </div>` : '';

            const themeText = (() => { const t = B2_THEMES[this.state.settings.diaryTheme]; return t ? ` · ${t.icon}${t.name}` : ''; })();
            const diffLabel = { easy: '簡單模式', normal: '普通模式', hard: '困難模式' }[diff] || '';

            // 日記卡片
            const diaryCard = `
                <div class="b2-diary" data-diff="${diff}">
                    <div class="b2-diary-header">
                        <span class="b2-diary-icon">📒</span>
                        <span class="b2-diary-title">本週零用錢記錄</span>
                        <button class="b-inline-replay" id="replay-speech-btn" title="重播語音">🔊</button>
                        <span class="b2-hint-wrap" style="display:inline-flex;align-items:center;gap:4px;margin-left:auto;">
                            <img src="../images/common/hint_detective.png" alt="" class="b2-hint-mascot" onerror="this.style.display='none'">
                            <button class="b2-hint-btn" id="b2-hint-btn" title="提示">💡 提示</button>
                        </span>
                    </div>
                    <div class="b2-start-row">
                        <div class="b2-start-top">
                            <span class="b2-start-label">💼 開始有</span>
                        </div>
                        <div class="b2-start-bottom">
                            <div class="b2-start-money-icons" id="b2-start-money-icons">${this._renderMoneyIconsGrouped(question.startAmount)}</div>
                            <span class="b2-start-amount" id="b2-start-amount">${question.startAmount} 元</span>
                        </div>
                    </div>
                    ${eventsHTML}
                    ${diff === 'easy' ? '<div id="b2-easy-total-row" style="display:none" class="b2-easy-total-row"></div>' : ''}
                    <div id="b2-cep-custom-list"></div>
                    ${customPanelHTML}
                    ${isNormalOrHard ? totalStripHTML : ''}
                </div>`;

            // 題目下方互動區（依難度）
            let interactiveArea = '';
            if (diff === 'easy') {
                interactiveArea = ''; // 簡單模式：點擊金幣即可，無需獨立區塊
            } else if (isNormal) {
                interactiveArea = '';
            } else {
                interactiveArea = ''; // hard：數字鍵盤改為點擊 ? 框時的中央彈窗
            }

            return `
            <div class="b-header">
                <div class="b-header-left"><span class="b-header-unit">📒 零用錢日記</span></div>
                <div class="b-header-center">步驟一：計算花費${themeText}</div>
                <div class="b-header-right">
                    <span class="b-progress">第 ${q.currentQuestion + 1} 題 / 共 ${q.totalQuestions} 題</span>
                    <button class="b-reward-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                    <button class="b-back-btn" onclick="Game.showSettings()">返回設定</button>
                </div>
            </div>
            <div class="b-game-wrap">
                ${isNormalOrHard ? `
                <div class="b2-card-outer-wrap">
                    ${diaryCard}
                    ${isHard ? `
                    <div class="b2-calc-side-col">
                        <button class="b2-calc-toggle-btn" id="b2-calc-toggle">🧮 開啟計算機</button>
                        <div class="b2-calc-panel" id="b2-calc-panel" style="display:none;">
                            ${this._getB2CalculatorHTML()}
                        </div>
                    </div>` : ''}
                </div>
                ${interactiveArea}` : diaryCard}
                ${diff === 'easy' ? interactiveArea : ''}
            </div>`;
        },

        _renderChoicesHTML(question) {
            const btns = question.choices.map(c => `
                <button class="b2-choice-btn" data-val="${c}">
                    <span class="b2-choice-amount">${c} 元</span>
                    <span class="b2-choice-icons">${this._renderChoiceMoneyIcons(c)}</span>
                </button>`).join('');
            return `<div class="b2-choices">${btns}</div>`;
        },

        // ── 可點擊金幣（Easy 模式 Phase 1）────────────────────────
        _renderB2ClickableCoins(amount, eventIdx) {
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

            // 逐枚可點擊按鈕（手機/桌面統一顯示個別圖示）
            const html = items.map(item => {
                const isBill = item.denom >= 100;
                const w = isBill ? 68 : 44;
                return `<button class="b2-coin-clickable${isBill ? ' b2-banknote-btn' : ''}"
                    data-event-idx="${eventIdx}" data-coin-idx="${item.coinIdx}" data-denom="${item.denom}"
                    aria-label="${item.denom}元" style="position:relative;overflow:visible;">
                    <img src="../images/money/${item.denom}_yuan_${item.face}.png" alt="${item.denom}元"
                         style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};${isBill ? 'border-radius:4px' : 'border-radius:50%'};display:block;pointer-events:none;"
                         onerror="this.style.display='none'" draggable="false">
                </button>`;
            }).join('');

            return `<span class="b2-mic-wrap">${html}</span>`;
        },

        // ── 共用數字鍵盤（困難模式 Phase 1）──────────────────────────
        _renderB2SharedNumpad() {
            return `
            <div class="b2-hard-total-area" id="b2-hard-total-area">
                <div class="b2-ht-active-hint" id="b2-ht-active-hint">
                    <span>點選上方輸入框開始輸入</span>
                </div>
                <div class="b2-ht-numpad" id="b2-ht-numpad">
                    <button class="b2-ht-digit" data-digit="1">1</button>
                    <button class="b2-ht-digit" data-digit="2">2</button>
                    <button class="b2-ht-digit" data-digit="3">3</button>
                    <button class="b2-ht-digit" data-digit="4">4</button>
                    <button class="b2-ht-digit" data-digit="5">5</button>
                    <button class="b2-ht-digit" data-digit="6">6</button>
                    <button class="b2-ht-digit" data-digit="7">7</button>
                    <button class="b2-ht-digit" data-digit="8">8</button>
                    <button class="b2-ht-digit" data-digit="9">9</button>
                    <button class="b2-ht-digit b2-ht-back" data-digit="back">⌫</button>
                    <button class="b2-ht-digit" data-digit="0">0</button>
                    <button class="b2-ht-confirm" id="b2-ht-confirm">✓ 確認</button>
                </div>
                <div class="b2-ht-error" id="b2-ht-error" style="display:none"></div>
            </div>`;
        },

        _renderChoiceMoneyIcons(amount) {
            const rf = () => Math.random() < 0.5 ? 'back' : 'front';
            const denoms = [1000, 500, 100, 50, 10, 5, 1];
            let rem = amount;
            const items = [];
            for (const d of denoms) {
                if (rem <= 0) break;
                const cnt = Math.floor(rem / d);
                for (let i = 0; i < cnt && items.length < 12; i++) items.push(d);
                rem -= cnt * d;
            }
            if (items.length === 0) return '';

            // 逐枚顯示（手機/桌面統一，紙鈔大於硬幣）
            const html = items.map(d => {
                const isBill = d >= 100;
                const w = isBill ? 40 : 28;
                return `<img src="../images/money/${d}_yuan_${rf()}.png" alt="${d}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};${isBill ? 'border-radius:3px' : 'border-radius:50%'};display:block;flex-shrink:0;"
                     onerror="this.style.display='none'" draggable="false">`;
            }).join('');

            return `<span class="b2-cic-wrap">${html}</span>`;
        },

        _renderB2TotalInput(isHard) {
            return `
            <div class="b2-hard-total-area" id="b2-hard-total-area">
                <div class="b2-ht-top-row">
                    <div class="b2-ht-label">${isHard ? '計算各筆收支，最後剩下幾元？' : '把各筆收支算一算，最後剩下幾元？'}</div>
                </div>
                <div class="b2-ht-total-row">
                    <span class="b2-ht-total-label">剩下</span>
                    <div class="b2-ht-display" id="b2-ht-display">___</div>
                    <span class="b2-ht-total-label">元</span>
                </div>
                <div class="b2-ht-numpad" id="b2-ht-numpad">
                    <button class="b2-ht-digit" data-digit="1">1</button>
                    <button class="b2-ht-digit" data-digit="2">2</button>
                    <button class="b2-ht-digit" data-digit="3">3</button>
                    <button class="b2-ht-digit" data-digit="4">4</button>
                    <button class="b2-ht-digit" data-digit="5">5</button>
                    <button class="b2-ht-digit" data-digit="6">6</button>
                    <button class="b2-ht-digit" data-digit="7">7</button>
                    <button class="b2-ht-digit" data-digit="8">8</button>
                    <button class="b2-ht-digit" data-digit="9">9</button>
                    <button class="b2-ht-digit b2-ht-back" data-digit="back">⌫</button>
                    <button class="b2-ht-digit" data-digit="0">0</button>
                    <button class="b2-ht-confirm" id="b2-ht-confirm">✓ 確認</button>
                </div>
                <div class="b2-ht-error" id="b2-ht-error" style="display:none"></div>
            </div>`;
        },

        _getB2CalculatorHTML() {
            return `
            <div class="b2-calculator">
                <div class="b2-calc-display" id="b2-calc-display">0</div>
                <div class="b2-calc-buttons">
                    <button class="b2-calc-btn b2-calc-num" data-v="7">7</button>
                    <button class="b2-calc-btn b2-calc-num" data-v="8">8</button>
                    <button class="b2-calc-btn b2-calc-num" data-v="9">9</button>
                    <button class="b2-calc-btn b2-calc-op"  data-v="C">C</button>
                    <button class="b2-calc-btn b2-calc-num" data-v="4">4</button>
                    <button class="b2-calc-btn b2-calc-num" data-v="5">5</button>
                    <button class="b2-calc-btn b2-calc-num" data-v="6">6</button>
                    <button class="b2-calc-btn b2-calc-op"  data-v="+">+</button>
                    <button class="b2-calc-btn b2-calc-num" data-v="1">1</button>
                    <button class="b2-calc-btn b2-calc-num" data-v="2">2</button>
                    <button class="b2-calc-btn b2-calc-num" data-v="3">3</button>
                    <button class="b2-calc-btn b2-calc-op"  data-v="-">-</button>
                    <button class="b2-calc-btn b2-calc-num" data-v="0">0</button>
                    <button class="b2-calc-btn b2-calc-op"  data-v="⌫">⌫</button>
                    <button class="b2-calc-btn b2-calc-eq"  data-v="=" style="grid-column:span 2">=</button>
                </div>
            </div>`;
        },

        _renderNumpadHTML() {
            // 保留供舊路徑呼叫（不應再被 normal/hard 使用）
            const digits = [7, 8, 9, 4, 5, 6, 1, 2, 3];
            const diff = this.state.settings.difficulty;
            return `
            <div class="b2-numpad-section">
                <div class="b2-input-display" id="b2-input-display">
                    <span id="b2-input-value">＿</span><span class="b2-unit-hint">元</span>
                    ${diff === 'hard' ? `<button class="b2-replay-btn" id="b2-replay-btn" title="重聽題目">🔊</button>` : ''}
                </div>
                <div class="b2-input-preview" id="b2-input-preview"></div>
                <div class="b2-numpad">
                    ${digits.map(n => `<button class="b2-numpad-btn" data-digit="${n}">${n}</button>`).join('')}
                    <button class="b2-numpad-btn btn-del" data-action="del">⌫</button>
                    <button class="b2-numpad-btn" data-digit="0">0</button>
                    <button class="b2-numpad-btn btn-ok" data-action="ok">確認</button>
                </div>
            </div>`;
        },

        _renderCustomEventsPanel() {
            return `
            <div class="b2-custom-events-panel" id="b2-cep-panel">
                <div class="b2-cep-header">📋 自訂收支事件</div>
                <div class="b2-cep-add-row">
                    <select class="b2-cep-input b2-cep-type-sel" id="b2-cep-type-sel">
                        <option value="income">📥 收入</option>
                        <option value="expense">📤 支出</option>
                    </select>
                    <input type="text" id="b2-cep-name-input" placeholder="事件名稱" maxlength="8" class="b2-cep-input">
                    <input type="number" id="b2-cep-amt-input" placeholder="金額" min="1" max="9999" class="b2-cep-input b2-cep-amt-inp">
                    <button class="b2-cep-add-btn" id="b2-cep-add-btn">＋ 新增</button>
                </div>
            </div>`;
        },

        // ── 金額→金幣圖示（逐枚顯示，紙鈔大於硬幣，手機/桌面統一）──
        _renderMoneyIconsGrouped(amount) {
            const rf = () => Math.random() < 0.5 ? 'back' : 'front';
            const denoms = [1000, 500, 100, 50, 10, 5, 1];
            let rem = amount;
            const items = [];
            for (const d of denoms) {
                if (rem <= 0) break;
                const cnt = Math.floor(rem / d);
                for (let i = 0; i < cnt && items.length < 12; i++) items.push(d);
                rem -= cnt * d;
            }
            if (items.length === 0) return '';

            const html = items.map(d => {
                const isBill = d >= 100;
                const w = isBill ? 68 : 44;
                return `<img src="../images/money/${d}_yuan_${rf()}.png" alt="${d}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};${isBill ? 'border-radius:4px' : 'border-radius:50%'};display:block;flex-shrink:0;"
                     onerror="this.style.display='none'" draggable="false">`;
            }).join('');

            return `<span class="b2-mic-wrap">${html}</span>`;
        },

        // ── 自訂事件數字鍵盤（普通模式用，取代3選1彈窗）───────────────
        _showB2CustomEventNumpad(inputEl, correct, evType, evName, question) {
            const q = this.state.quiz;
            const isIncome = evType === 'income';
            document.getElementById('b2-cep-numpad-overlay')?.remove();
            let inputVal = '';
            const overlay = document.createElement('div');
            overlay.id = 'b2-cep-numpad-overlay';
            overlay.className = 'b2-nchoice-modal-overlay';
            overlay.innerHTML = `
                <div class="b2-nchoice-modal" style="width:300px;max-width:92vw;padding:20px 16px;box-sizing:border-box;">
                    <div class="b2-nchoice-modal-title" style="margin-bottom:10px;">${isIncome ? '📥 收入' : '📤 支出'}金額是多少？</div>
                    <div id="b2-cep-np-disp" style="font-size:1.5rem;font-weight:bold;text-align:center;padding:8px 10px;background:#f3f4f6;border-radius:10px;margin:0 0 10px;">___</div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%;box-sizing:border-box;">
                        ${[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k => `<button class="b2-nchoice-btn ${isIncome ? 'income' : 'expense'}" data-cepnp="${k}" style="padding:10px 4px;font-size:1.1rem;min-width:0;">${k}</button>`).join('')}
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            inputEl.classList.add('b2-input-active');
            const disp = overlay.querySelector('#b2-cep-np-disp');
            const updateDisp = () => { disp.textContent = inputVal || '___'; };
            overlay.querySelectorAll('[data-cepnp]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const k = btn.dataset.cepnp;
                    if (k === '⌫') { inputVal = inputVal.slice(0, -1); }
                    else if (k === '✓') {
                        const entered = parseInt(inputVal);
                        if (entered === correct) {
                            this.audio.play('correct');
                            const prefix = isIncome ? '+' : '-';
                            inputEl.textContent = `${prefix}${correct} 元`;
                            inputEl.classList.remove('b2-input-active');
                            inputEl.classList.add('b2-input-correct');
                            if (!isIncome) inputEl.classList.add('b2-input-correct-expense');
                            overlay.remove();
                            q.activeInputEl = null;
                            const verb = isIncome ? `增加${correct}元` : `花掉${correct}元`;
                            const evSpeech = evName ? `${evName}，${verb}` : verb;
                            if (this._checkB2EventInputsCorrect()) {
                                Game.Speech.speak(evSpeech, () => {
                                    this._b2AutoFillTotalAndProceed(question, this._getEffectiveAnswer(question));
                                });
                            } else {
                                Game.Speech.speak(evSpeech);
                            }
                        } else {
                            this.audio.play('error');
                            disp.style.color = '#ef4444';
                            Game.TimerManager.setTimeout(() => { disp.style.color = ''; }, 600, 'ui');
                            inputVal = '';
                            Game.Speech.speak('不對喔，再試一次');
                        }
                        updateDisp();
                        return;
                    } else {
                        const next = inputVal + k;
                        if (parseInt(next, 10) <= 99999) inputVal = next;
                    }
                    this.audio.play('keypad');
                    updateDisp();
                });
            });
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    inputEl.classList.remove('b2-input-active');
                    q.activeInputEl = null;
                }
            });
        },

        // ── 新增自訂事件時「金額」欄位的數字鍵盤彈窗 ──────────────────
        _showB2AddAmtNumpad(onConfirm) {
            document.getElementById('b2-add-amt-numpad-overlay')?.remove();
            let inputVal = '';
            const overlay = document.createElement('div');
            overlay.id = 'b2-add-amt-numpad-overlay';
            overlay.className = 'b2-nchoice-modal-overlay';
            overlay.innerHTML = `
                <div class="b2-nchoice-modal" style="width:300px;max-width:92vw;padding:20px 16px;box-sizing:border-box;">
                    <div class="b2-nchoice-modal-title" style="margin-bottom:10px;">💰 請輸入金額（元）</div>
                    <div id="b2-add-amt-disp" style="font-size:1.5rem;font-weight:bold;text-align:center;padding:8px 10px;background:#f3f4f6;border-radius:10px;margin:0 0 10px;">___</div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%;box-sizing:border-box;">
                        ${[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k => `<button class="b2-nchoice-btn income" data-addamt="${k}" style="padding:10px 4px;font-size:1.1rem;min-width:0;">${k}</button>`).join('')}
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            const disp = overlay.querySelector('#b2-add-amt-disp');
            const update = () => { disp.textContent = inputVal || '___'; };
            overlay.querySelectorAll('[data-addamt]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const k = btn.dataset.addamt;
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

        _bindCustomEventsPanel(question) {
            // 刪除原有事件
            document.querySelectorAll('#b2-base-event-0, #b2-base-event-1, #b2-base-event-2, #b2-base-event-3').forEach(row => {
                const delBtn = row?.querySelector('[data-base-idx]');
                if (!delBtn) return;
                Game.EventManager.on(delBtn, 'click', () => {
                    const idx = parseInt(delBtn.dataset.baseIdx);
                    question.events[idx]._deleted = !question.events[idx]._deleted;
                    row.classList.toggle('b2-cep-deleted', !!question.events[idx]._deleted);
                    this._updateCustomAnswerPreview(question);
                }, {}, 'gameUI');
            });
            // 新增事件
            // 攔截「金額」輸入框：改用數字鍵盤彈窗，避免原生鍵盤
            const amtInputEl = document.getElementById('b2-cep-amt-input');
            if (amtInputEl) {
                Game.EventManager.on(amtInputEl, 'click', (e) => {
                    e.preventDefault();
                    amtInputEl.blur();
                    this._showB2AddAmtNumpad(val => { amtInputEl.value = val; });
                }, {}, 'gameUI');
                Game.EventManager.on(amtInputEl, 'focus', () => { amtInputEl.blur(); }, {}, 'gameUI');
            }

            const addBtn = document.getElementById('b2-cep-add-btn');
            if (!addBtn) return;
            Game.EventManager.on(addBtn, 'click', () => {
                const typeEl = document.getElementById('b2-cep-type-sel');
                const nameEl = document.getElementById('b2-cep-name-input');
                const amtEl  = document.getElementById('b2-cep-amt-input');
                const type   = typeEl?.value || 'income';
                const name   = nameEl?.value.trim();
                const amount = parseInt(amtEl?.value);
                if (!name || !amount || amount < 1) return;
                const q = this.state.quiz;
                const newEvent = { type, name, amount, icon: type === 'income' ? '💰' : '💸', _deleted: false };
                q.customEvents.push(newEvent);
                const ci = q.customEvents.length - 1;
                const diff2 = this.state.settings.difficulty;
                const isHard2 = diff2 === 'hard';
                const list = document.getElementById('b2-cep-custom-list');
                const row = document.createElement('div');
                row.className = `b2-event-row ${type} b2-cep-custom-row`;
                row.id = `b2-custom-event-${ci}`;
                const moneyIconsHtml2 = this._renderMoneyIconsGrouped(amount);
                row.innerHTML = `
                    <div class="b2-event-top">
                        <span class="b2-type-badge ${type}">${type === 'income' ? '收入 📥' : '支出 📤'}</span>
                        <span class="b2-event-icon">${newEvent.icon}</span>
                        <span class="b2-event-name">${name}</span>
                        <button class="b2-cep-del-btn" data-custom-idx="${ci}">✕</button>
                    </div>
                    <div class="b2-event-bottom">
                        <div class="b2-event-money-icons">${moneyIconsHtml2}</div>
                        <div class="b2-cost-input b2-cep-cost-input" data-idx="custom-${ci}" data-correct="${amount}">？ 元</div>
                    </div>`;
                list.appendChild(row);
                // 綁定 ? 輸入框（普通→3選1，困難→數字鍵盤）
                const costInput = row.querySelector('.b2-cep-cost-input');
                if (costInput) {
                    Game.EventManager.on(costInput, 'click', () => {
                        if (costInput.classList.contains('b2-input-correct')) return;
                        if (isHard2) {
                            if (q._openNumpadModal) q._openNumpadModal(costInput);
                            else this._showB2CustomEventNumpad(costInput, amount, type, name, question);
                        } else {
                            this._showB2NormalChoices(costInput, amount, type, question, this._getEffectiveAnswer(question));
                        }
                    }, {}, 'gameUI');
                }
                const delBtn2 = row.querySelector('[data-custom-idx]');
                Game.EventManager.on(delBtn2, 'click', () => {
                    q.customEvents[ci]._deleted = true;
                    row.remove();
                    this._updateCustomAnswerPreview(question);
                }, {}, 'gameUI');
                if (nameEl) nameEl.value = '';
                if (amtEl) amtEl.value = '';
                this._updateCustomAnswerPreview(question);
                this.audio.play('click');
            }, {}, 'gameUI');
        },

        _updateCustomAnswerPreview(question) {
            const ans = this._getEffectiveAnswer(question);
            const totalInput = document.getElementById('b2-total-input');
            if (totalInput) totalInput.dataset.correct = ans;
            const prev = document.getElementById('b2-input-preview');
            const val = parseInt(this.state.quiz.currentInput);
            if (prev && !isNaN(val)) {
                const diff2 = val - ans;
                const cls   = diff2 === 0 ? 'exact' : diff2 > 0 ? 'over' : 'under';
                const label = diff2 === 0 ? '✓ 剛好！' : diff2 > 0 ? `多了 ${diff2} 元` : `少了 ${-diff2} 元`;
                prev.className = 'b2-input-preview ' + cls;
                prev.textContent = label;
            } else if (prev) {
                prev.className = 'b2-input-preview';
                prev.textContent = '';
            }
        },

        // ── 12. 事件綁定 ──────────────────────────────────────
        _bindQuestionEvents(question) {
            const diff = this.state.settings.difficulty;
            const isHard = diff === 'hard';

            if (diff === 'easy') {
                // 簡單模式：金幣點擊（動畫結束後 _animateEasyEntriesSequential 會觸發 activate）
                // 綁定在動畫結束後由 _bindB2EasyModeCoins 執行
            } else if (diff === 'normal') {
                this._bindB2NormalModeInputs(question);
            } else {
                // 困難模式：共用鍵盤
                this._bindB2HardModeNumpad(question);
                // 計算機切換
                const calcToggle = document.getElementById('b2-calc-toggle');
                const calcPanel  = document.getElementById('b2-calc-panel');
                if (calcToggle && calcPanel) {
                    Game.EventManager.on(calcToggle, 'click', () => {
                        const open = calcPanel.style.display === 'none';
                        calcPanel.style.display = open ? '' : 'none';
                        calcToggle.textContent  = open ? '🧮 關閉計算機' : '🧮 開啟計算機';
                    }, {}, 'gameUI');
                    this._bindB2Calculator();
                }
            }

            // 語音重播
            const replayBtn = document.getElementById('replay-speech-btn');
            if (replayBtn) {
                Game.EventManager.on(replayBtn, 'click', () => {
                    const text = this.state.quiz.lastSpeechText;
                    if (text) Game.Speech.speak(text);
                }, {}, 'gameUI');
            }
            // 提示按鈕
            const b2HintBtn = document.getElementById('b2-hint-btn');
            if (b2HintBtn) {
                Game.EventManager.on(b2HintBtn, 'click', () => {
                    if (diff === 'easy') {
                        // 強制顯示所有隱藏的事件列
                        const allRows = document.querySelectorAll('.b2-event-row');
                        allRows.forEach(row => {
                            if (row.style.display === 'none') {
                                row.style.display = '';
                                row.style.animation = 'b2FadeIn 0.35s ease';
                            }
                        });
                        // 更新 revealedUpTo 允許點擊所有列
                        this.state.quiz.easyRevealedUpTo = allRows.length - 1;
                        // 取消逐項動畫（防止稍後再觸發 _bindB2EasyModeCoins）
                        this.state.quiz.animateSequentialCancelled = true;
                        // 綁定金幣點擊（含防重複守衛）
                        this._bindB2EasyModeCoins(question);
                        // 啟動循序提示模式
                        this.state.quiz.hintSequential = true;
                        this._advanceSequentialHint(question);
                    } else {
                        // 普通/困難：在未答對的 ？框上方顯示金額數字提示
                        this._showDiaryAmountHints(question);
                    }
                }, {}, 'gameUI');
            }
            // 自訂事件面板
            if (this.state.settings.customItemsEnabled && diff !== 'easy') {
                this._bindCustomEventsPanel(question);
            }
        },

        // ── B2 B1-style 總計輸入數字鍵盤 ─────────────────────────
        _bindB2TotalNumpad(question) {
            const q = this.state.quiz;
            const display = document.getElementById('b2-ht-display');
            const errorEl = document.getElementById('b2-ht-error');
            const isHard  = this.state.settings.difficulty === 'hard';

            const updateDisplay = () => {
                if (display) display.textContent = q.hardTotalInput || '___';
            };

            document.querySelectorAll('.b2-ht-digit').forEach(btn => {
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

            const confirmBtn = document.getElementById('b2-ht-confirm');
            if (confirmBtn) {
                Game.EventManager.on(confirmBtn, 'click', () => {
                    const entered = parseInt(q.hardTotalInput, 10);
                    if (!q.hardTotalInput || isNaN(entered)) return;
                    const correctTotal = this._getEffectiveAnswer(question);
                    if (entered === correctTotal) {
                        this.audio.play('correct');
                        if (errorEl) errorEl.style.display = 'none';
                        if (display) { display.textContent = correctTotal; display.classList.add('b2-ht-correct'); }
                        confirmBtn.disabled = true;
                        document.querySelectorAll('.b2-ht-digit').forEach(b => { b.disabled = true; });
                        // 困難模式揭露總計
                        if (isHard) {
                            const tsAmt = document.querySelector('.b2-ts-amount');
                            if (tsAmt) tsAmt.textContent = `${correctTotal} 元`;
                        }
                        Game.Speech.speak(`答對了！剩下${toTWD(correctTotal)}`, () => {
                            this._renderPhase2(question, correctTotal);
                        });
                    } else {
                        this.audio.play('error');
                        q.errorCount = (q.errorCount || 0) + 1;
                        const isOver = entered > correctTotal;
                        const errMsg = isOver ? '算多了，再算算看！' : '算少了，再算算看！';
                        if (errorEl) {
                            errorEl.textContent = `❌ ${errMsg}`;
                            errorEl.style.display = '';
                            errorEl.classList.remove('b2-ht-hint');
                        }
                        Game.Speech.speak(`不對喔，${errMsg}`);
                        q.hardTotalInput = '';
                        updateDisplay();
                        if (q.errorCount >= 3) {
                            Game.TimerManager.setTimeout(() => {
                                if (isHard) {
                                    this._showHardModeHintModal(question);
                                } else {
                                    const effEvents = this._getEffectiveEvents(question);
                                    const parts = effEvents.map(e => `${e.name}${toTWD(e.amount)}`).join('，');
                                    Game.Speech.speak(`${parts}，加起來剩下${toTWD(correctTotal)}`);
                                    if (errorEl) {
                                        const formula = effEvents.map(e => `${e.type === 'income' ? '+' : '-'}${e.amount}`).join(' ');
                                        errorEl.textContent = `💡 ${question.startAmount} ${formula} = ${correctTotal}`;
                                        errorEl.style.display = '';
                                        errorEl.classList.add('b2-ht-hint');
                                    }
                                }
                            }, 600, 'ui');
                        }
                    }
                }, {}, 'gameUI');
            }
        },

        // ── Easy 模式：金幣點擊綁定 ──────────────────────────────
        _bindB2EasyModeCoins(question) {
            const q = this.state.quiz;
            // 防重複綁定守衛
            if (q.easyCoinsbound) return;
            q.easyCoinsbound = true;

            const effEvents = this._getEffectiveEvents(question);

            // 計算每個事件的硬幣總數
            const totalCoinsPerEvent = effEvents.map(e => {
                const denoms = [1000, 500, 100, 50, 10, 5, 1];
                let rem = e.amount, cnt = 0;
                for (const d of denoms) { if (rem <= 0) break; const n = Math.floor(rem / d); cnt += n; rem -= n * d; }
                return cnt;
            });
            effEvents.forEach((_, i) => { q.easyCoinsClicked[i] = 0; q.easyEventTotals[i] = 0; });

            document.querySelectorAll('.b2-coin-clickable').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    if (btn.classList.contains('b2-coin-clicked') || btn.disabled) return;
                    const evIdx = parseInt(btn.dataset.eventIdx);
                    // 僅允許點擊已顯示列
                    if (evIdx > q.easyRevealedUpTo) return;
                    const denom = parseInt(btn.dataset.denom);

                    btn.classList.add('b2-coin-clicked');
                    btn.classList.remove('assist-click-hint');
                    btn.disabled = true;
                    btn.style.outline = '2.5px solid #10b981';
                    btn.style.outlineOffset = '2px';
                    const bck = document.createElement('span');
                    bck.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#10b981;color:white;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;z-index:2;pointer-events:none;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,0.3);';
                    bck.textContent = '✓';
                    btn.appendChild(bck);
                    q.easyCoinsClicked[evIdx]++;
                    q.easyRunningTotal += denom;
                    q.easyEventTotals[evIdx] = (q.easyEventTotals[evIdx] || 0) + denom;

                    // 事件列點擊彈跳動畫
                    const evRow = btn.closest('.b2-event-row');
                    if (evRow) {
                        evRow.classList.add('b2-row-bounce');
                        Game.TimerManager.setTimeout(() => evRow.classList.remove('b2-row-bounce'), 300, 'ui');
                    }

                    this.audio.play('click');

                    const isEventComplete = q.easyCoinsClicked[evIdx] >= totalCoinsPerEvent[evIdx];

                    // 立即顯示該項目的累計金額（第一點即出現）
                    const amtEl = document.getElementById(`b2-easy-amt-${evIdx}`);
                    if (amtEl) {
                        if (isEventComplete) {
                            const ev = effEvents[evIdx];
                            amtEl.textContent = `${ev.type === 'income' ? '+' : '-'}${ev.amount} 元`;
                            amtEl.classList.add('b2-amt-done', ev.type);
                        } else {
                            amtEl.textContent = `${q.easyEventTotals[evIdx]} 元`;
                        }
                    }

                    const allDone = effEvents.every((_, i) => q.easyCoinsClicked[i] >= totalCoinsPerEvent[i]);

                    if (isEventComplete) {
                        const ev = effEvents[evIdx];
                        const afterAmtSpeech = () => {
                            if (allDone) {
                                // 所有項目完成：顯示總計列，再進 Phase 2（語音由 _proceedB2FromPhase1 統一播放）
                                const effectiveAnswer = this._getEffectiveAnswer(question);
                                const totalRow = document.getElementById('b2-easy-total-row');
                                if (totalRow) {
                                    totalRow.style.display = '';
                                    totalRow.style.animation = 'b2FadeIn 0.4s ease';
                                    totalRow.innerHTML = `
                                        <span class="b2-easy-total-icon">💰</span>
                                        <span class="b2-easy-total-label">最後剩下</span>
                                        <span class="b2-easy-total-val">${effectiveAnswer} 元</span>`;
                                }
                                Game.TimerManager.setTimeout(() => {
                                    this._proceedB2FromPhase1(question, effectiveAnswer);
                                }, 400, 'ui');
                            } else {
                                // 顯示下一列
                                const nextIdx = evIdx + 1;
                                Game.TimerManager.setTimeout(() => {
                                    this._revealNextEasyRow(question, nextIdx);
                                }, 300, 'ui');
                            }
                        };
                        Game.Speech.speak(`${q.easyEventTotals[evIdx]}元`, q.hintSequential ? () => {
                            Game.TimerManager.setTimeout(() => this._advanceSequentialHint(question), 300, 'ui');
                        } : afterAmtSpeech);
                    } else {
                        Game.Speech.speak(`${q.easyEventTotals[evIdx]}元`);
                    }
                }, {}, 'gameUI');
            });
        },

        // ── 普通模式：點擊輸入→3選擇 ────────────────────────────
        _bindB2NormalModeInputs(question) {
            const q = this.state.quiz;
            const effEvents = this._getEffectiveEvents(question);
            const effectiveAnswer = this._getEffectiveAnswer(question);

            effEvents.forEach((e, idx) => {
                const input = document.getElementById(`b2-cost-input-${idx}`);
                if (!input) return;
                Game.EventManager.on(input, 'click', () => {
                    if (input.classList.contains('b2-input-correct')) return;
                    this._showB2NormalChoices(input, e.amount, e.type, question, effectiveAnswer);
                }, {}, 'gameUI');
            });
        },

        _showB2NormalChoices(inputEl, correct, evType, question, effectiveAnswer) {
            const q = this.state.quiz;
            q.activeInputEl = inputEl;

            // 高亮活躍輸入框
            document.querySelectorAll('.b2-cost-input').forEach(el => el.classList.remove('b2-input-active'));
            inputEl.classList.add('b2-input-active');

            const choices = this._generateB2NumChoices(correct);
            const isIncome = evType === 'income';

            // 建立中央彈窗
            document.getElementById('b2-nchoice-modal')?.remove();
            const overlay = document.createElement('div');
            overlay.id = 'b2-nchoice-modal';
            overlay.className = 'b2-nchoice-modal-overlay';
            overlay.innerHTML = `
                <div class="b2-nchoice-modal">
                    <div class="b2-nchoice-modal-title">${isIncome ? '📥 收入' : '📤 支出'}金額是多少？</div>
                    <div class="b2-nchoice-modal-btns">
                        ${choices.map(c => `<button class="b2-nchoice-btn ${isIncome ? 'income' : 'expense'}" data-val="${c}">${c} 元</button>`).join('')}
                    </div>
                </div>`;
            document.body.appendChild(overlay);

            overlay.querySelectorAll('.b2-nchoice-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    const chosen = parseInt(btn.dataset.val);
                    if (chosen === correct) {
                        this.audio.play('correct');
                        const prefix = isIncome ? '+' : '-';
                        inputEl.textContent = `${prefix}${correct} 元`;
                        inputEl.classList.remove('b2-input-active');
                        inputEl.classList.add('b2-input-correct');
                        if (!isIncome) inputEl.classList.add('b2-input-correct-expense');
                        overlay.remove();
                        q.activeInputEl = null;

                        // 播放事件語音（NAME花掉/增加AMOUNt元）
                        const eIdx = parseInt(inputEl.dataset.idx);
                        const ev = this._getEffectiveEvents(question)[eIdx];
                        const verb = isIncome ? `增加${correct}元` : `花掉${correct}元`;
                        const evSpeech = ev ? `${ev.name}，${verb}` : verb;

                        // 所有事件輸入完成 → 語音完成後再進下一頁（動態重算，包含自訂事件）
                        if (this._checkB2EventInputsCorrect()) {
                            Game.Speech.speak(evSpeech, () => {
                                this._b2AutoFillTotalAndProceed(question, this._getEffectiveAnswer(question));
                            });
                        } else {
                            Game.Speech.speak(evSpeech);
                        }
                    } else {
                        this.audio.play('error');
                        btn.style.cssText += 'background:#fee2e2;border-color:#fca5a5;';
                        btn.disabled = true;
                        Game.Speech.speak('不對喔，再想想看');
                    }
                }, {}, 'gameUI');
            });

            // 點選彈窗外部關閉
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    inputEl.classList.remove('b2-input-active');
                    q.activeInputEl = null;
                }
            });
        },

        // ── 困難模式：點擊 ? 框 → 中央數字鍵盤彈窗 ───────────────
        _bindB2HardModeNumpad(question) {
            const q = this.state.quiz;
            const effEvents = this._getEffectiveEvents(question);
            const effectiveAnswer = this._getEffectiveAnswer(question);

            const openNumpadModal = (inputEl) => {
                if (inputEl.classList.contains('b2-input-correct')) return;
                document.querySelectorAll('.b2-cost-input').forEach(el => el.classList.remove('b2-input-active'));
                inputEl.classList.add('b2-input-active');
                q.activeInputEl = inputEl;
                q.hardTotalInput = '';
                const rawIdx = inputEl.dataset.idx;
                const numIdx = parseInt(rawIdx);
                const label = rawIdx === 'total' ? '最後剩下多少元？'
                    : !isNaN(numIdx) ? `第${numIdx + 1}筆金額是多少元？`
                    : `此筆金額是多少元？`;

                document.getElementById('b2-ht-modal')?.remove();
                const overlay = document.createElement('div');
                overlay.id = 'b2-ht-modal';
                overlay.className = 'b2-ht-modal-overlay';
                overlay.innerHTML = `
                    <div class="b2-ht-modal">
                        <button class="b2-ht-modal-close-btn" id="b2-ht-modal-close-btn" title="關閉">✕</button>
                        <div class="b2-ht-modal-title">${label}</div>
                        <div class="b2-ht-modal-display" id="b2-ht-modal-display">＿＿＿</div>
                        <div class="b2-ht-modal-numpad">
                            ${[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k =>
                                `<button class="b2-ht-modal-btn${k==='✓'?' b2-ht-modal-confirm':k==='⌫'?' b2-ht-modal-back':''}" data-k="${k}">${k}</button>`
                            ).join('')}
                        </div>
                        <div class="b2-ht-modal-error" id="b2-ht-modal-error" style="display:none"></div>
                    </div>`;
                document.body.appendChild(overlay);

                const display = document.getElementById('b2-ht-modal-display');
                const errorEl = document.getElementById('b2-ht-modal-error');
                const closeModal = () => {
                    window.speechSynthesis.cancel();
                    overlay.remove();
                    inputEl.classList.remove('b2-input-active');
                    q.activeInputEl = null;
                    q.hardTotalInput = '';
                };

                overlay.querySelectorAll('.b2-ht-modal-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const k = btn.dataset.k;
                        if (k === '✓') {
                            const entered = parseInt(q.hardTotalInput, 10);
                            if (!q.hardTotalInput || isNaN(entered)) return;
                            const correct = parseInt(inputEl.dataset.correct);
                            if (entered === correct) {
                                this.audio.play('correct');
                                const eIdx = inputEl.dataset.idx;
                                let displayText = `${correct} 元`;
                                let isExpenseEntry = false;
                                if (eIdx !== 'total') {
                                    const ev = effEvents[parseInt(eIdx)];
                                    if (ev) {
                                        if (ev.type === 'income') {
                                            displayText = `+${correct} 元`;
                                        } else {
                                            displayText = `-${correct} 元`;
                                            isExpenseEntry = true;
                                        }
                                    }
                                }
                                inputEl.textContent = displayText;
                                inputEl.classList.remove('b2-input-active');
                                inputEl.classList.add('b2-input-correct');
                                if (isExpenseEntry) inputEl.classList.add('b2-input-correct-expense');
                                overlay.remove();
                                q.activeInputEl = null;
                                q.hardTotalInput = '';
                                // 總計欄答對：揭露算式答案
                                if (eIdx === 'total') {
                                    const ansEl = document.querySelector('#b2-total-formula .b1-tf-ans');
                                    if (ansEl) { ansEl.textContent = String(correct); ansEl.style.color = '#16a34a'; }
                                }

                                // 播放事件語音（非 total 欄位才播）
                                if (eIdx !== 'total') {
                                    const evForSpeech = effEvents[parseInt(eIdx)];
                                    if (evForSpeech) {
                                        const verb = evForSpeech.type === 'income' ? `增加${correct}元` : `花掉${correct}元`;
                                        Game.Speech.speak(`${evForSpeech.name}，${verb}`);
                                    }
                                    // 所有事件項目填完後顯示算式
                                    if (this._checkB2EventInputsCorrect()) {
                                        this._showB2TotalFormula(question);
                                    }
                                }

                                if (this._checkB2AllInputsCorrect()) {
                                    Game.TimerManager.setTimeout(() => {
                                        this._proceedB2FromPhase1(question, this._getEffectiveAnswer(question));
                                    }, 500, 'ui');
                                }
                            } else {
                                this.audio.play('error');
                                q.errorCount = (q.errorCount || 0) + 1;
                                const isOver = entered > correct;
                                const errMsg = isOver ? '算多了，再算算看！' : '算少了，再算算看！';
                                errorEl.textContent = `❌ ${errMsg}`;
                                errorEl.style.display = '';
                                Game.Speech.speak(`不對喔，${errMsg}`);
                                q.hardTotalInput = '';
                                display.textContent = '＿＿＿';
                            }
                        } else if (k === '⌫') {
                            q.hardTotalInput = (q.hardTotalInput || '').slice(0, -1);
                            display.textContent = q.hardTotalInput || '＿＿＿';
                            this.audio.play('keypad');
                        } else {
                            const next = (q.hardTotalInput || '') + k;
                            if (parseInt(next, 10) <= 99999) q.hardTotalInput = next;
                            display.textContent = q.hardTotalInput || '＿＿＿';
                            this.audio.play('keypad');
                        }
                    });
                });

                document.getElementById('b2-ht-modal-close-btn')?.addEventListener('click', closeModal);
                // 點遮罩外部關閉
                overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
            };
            // 供自訂事件動態綁定使用（_bindCustomEventsPanel 中的 q._openNumpadModal）
            q._openNumpadModal = openNumpadModal;

            effEvents.forEach((_, idx) => {
                const input = document.getElementById(`b2-cost-input-${idx}`);
                if (input) Game.EventManager.on(input, 'click', () => openNumpadModal(input), {}, 'gameUI');
            });
            const totalInput = document.getElementById('b2-total-input');
            if (totalInput) Game.EventManager.on(totalInput, 'click', () => openNumpadModal(totalInput), {}, 'gameUI');
        },

        // ── 輔助函數 ──────────────────────────────────────────────
        _generateB2NumChoices(correct) {
            const choices = new Set([correct]);
            const range = Math.max(50, Math.round(correct * 0.2));
            let attempts = 0;
            while (choices.size < 3 && attempts < 40) {
                const offset = (Math.floor(Math.random() * range) + 1) * (Math.random() < 0.5 ? 1 : -1);
                const c = correct + offset;
                if (c > 0 && !choices.has(c)) choices.add(c);
                attempts++;
            }
            let extra = 1;
            while (choices.size < 3) { choices.add(correct + extra * 10); extra++; }
            return [...choices].sort(() => Math.random() - 0.5);
        },

        _checkB2AllInputsCorrect() {
            const all = document.querySelectorAll('.b2-cost-input');
            return all.length > 0 && [...all].every(el => el.classList.contains('b2-input-correct'));
        },

        // 只檢查事件欄位（排除總計），供普通模式自動填入總計用
        _checkB2EventInputsCorrect() {
            const eventInputs = document.querySelectorAll('.b2-cost-input:not([data-idx="total"])');
            return eventInputs.length > 0 && [...eventInputs].every(el => el.classList.contains('b2-input-correct'));
        },

        // 普通模式：自動顯示總計 → 進第2頁（語音由 _proceedB2FromPhase1 統一播放）
        _b2AutoFillTotalAndProceed(question, effectiveAnswer) {
            if (this.state.settings.difficulty === 'hard') return;
            const totalInput = document.getElementById('b2-total-input');
            if (totalInput) {
                totalInput.textContent = `${effectiveAnswer} 元`;
                totalInput.classList.add('b2-input-correct', 'b2-total-auto-fill');
            }
            Game.TimerManager.setTimeout(() => {
                this._proceedB2FromPhase1(question, effectiveAnswer);
            }, 400, 'ui');
        },

        _proceedB2FromPhase1(question, effectiveAnswer) {
            // 記錄答題歷史（三難度統一在此記錄）
            const q = this.state.quiz;
            if (!q.answeredHistory.some(h => h._qIdx === q.currentQuestion)) {
                q.correctCount++;
                q.answeredHistory.push({
                    startAmount: question.startAmount,
                    events: this._getEffectiveEvents(question),
                    answer: effectiveAnswer,
                    correct: true,
                    _theme: question._theme,
                    _qIdx: q.currentQuestion,
                });
            }
            this.audio.play('correct');
            this._fireConfetti();
            Game.Speech.speak(`最後剩下${effectiveAnswer}元`, () => {
                Game.TimerManager.setTimeout(() => {
                    this._renderPhase2(question, effectiveAnswer);
                }, 300, 'turnTransition');
            });
        },

        // ── B2 計算機邏輯（B1 _bindCalculatorEvents pattern）──────
        _bindB2Calculator() {
            let calcVal = '0', calcOp = null, calcFirst = null, calcFresh = true;
            const display = document.getElementById('b2-calc-display');
            const update  = () => { if (display) display.textContent = calcVal; };
            document.querySelectorAll('.b2-calc-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    const v = btn.dataset.v;
                    this.audio.play('keypad');
                    if (v >= '0' && v <= '9') {
                        calcVal = calcFresh || calcVal === '0' ? v : (calcVal.length < 8 ? calcVal + v : calcVal);
                        calcFresh = false;
                    } else if (v === 'C') {
                        calcVal = '0'; calcOp = null; calcFirst = null; calcFresh = true;
                    } else if (v === '⌫') {
                        calcVal = calcVal.length > 1 ? calcVal.slice(0, -1) : '0';
                    } else if (v === '+' || v === '-') {
                        if (calcOp && !calcFresh) {
                            calcFirst = calcOp === '+' ? parseFloat(calcFirst) + parseFloat(calcVal) : parseFloat(calcFirst) - parseFloat(calcVal);
                            calcVal = String(calcFirst);
                        } else {
                            calcFirst = parseFloat(calcVal);
                        }
                        calcOp = v; calcFresh = true;
                    } else if (v === '=') {
                        if (calcOp && calcFirst !== null) {
                            const result = calcOp === '+' ? parseFloat(calcFirst) + parseFloat(calcVal) : parseFloat(calcFirst) - parseFloat(calcVal);
                            calcVal = String(Math.round(result * 100) / 100);
                        }
                        calcOp = null; calcFirst = null; calcFresh = true;
                    }
                    update();
                }, {}, 'gameUI');
            });
        },

        _updateInputDisplay() {
            const el = document.getElementById('b2-input-value');
            if (el) el.textContent = this.state.quiz.currentInput || '＿';
            // 即時餘額預覽（Round 31）
            const previewEl = document.getElementById('b2-input-preview');
            if (previewEl) {
                const q   = this.state.quiz.questions[this.state.quiz.currentQuestion];
                const val = parseInt(this.state.quiz.currentInput);
                const ans = q ? this._getEffectiveAnswer(q) : null;
                if (q && !isNaN(val) && ans !== null) {
                    const diff  = val - ans;
                    const cls   = diff === 0 ? 'exact' : diff > 0 ? 'over' : 'under';
                    const label = diff === 0 ? '✓ 剛好！' : diff > 0 ? `多了 ${diff} 元` : `少了 ${-diff} 元`;
                    previewEl.className = 'b2-input-preview ' + cls;
                    previewEl.textContent = label;
                } else {
                    previewEl.className = 'b2-input-preview';
                    previewEl.textContent = '';
                }
            }
        },

        _showCenterFeedback(icon, text = '') {
            document.querySelector('.b-center-feedback')?.remove();
            const overlay = document.createElement('div');
            overlay.className = 'b-center-feedback';
            overlay.innerHTML = `<span class="b-cf-icon">${icon}</span>${text ? `<span class="b-cf-text">${text}</span>` : ''}`;
            document.body.appendChild(overlay);
            Game.TimerManager.setTimeout(() => overlay.remove(), 1200, 'ui');
        },

        // ── 13. 答題處理 ──────────────────────────────────────
        _handleChoiceAnswer(chosen, question) {
            if (this.state.isProcessing) return;
            this.state.isProcessing = true;

            const effectiveAnswer = this._getEffectiveAnswer(question);
            const isCorrect = chosen === effectiveAnswer;

            document.querySelectorAll('.b2-choice-btn').forEach(btn => {
                btn.disabled = true;
                const v = parseInt(btn.dataset.val);
                if (v === effectiveAnswer) btn.classList.add('correct');
                else if (v === chosen && !isCorrect) btn.classList.add('wrong');
            });

            // 答題動畫（Round 33）
            const qCard = document.querySelector('.b2-question-card') || document.querySelector('#b2-question-card');
            if (qCard) {
                qCard.classList.add(isCorrect ? 'b2-answer-correct' : 'b2-answer-wrong');
                Game.TimerManager.setTimeout(() => qCard.classList.remove('b2-answer-correct', 'b2-answer-wrong'), 600, 'ui');
            }

            if (isCorrect) {
                this.state.quiz.correctCount++;
                this.state.quiz.answeredHistory.push({ startAmount: question.startAmount, events: question.events, answer: effectiveAnswer, correct: true, _theme: question._theme });
                this.state.quiz.streak = (this.state.quiz.streak || 0) + 1;

                this.audio.play('correct');
                this._showCenterFeedback('✅', '答對了！');
                this._showNetTrend(question);
                this._showFinancialTip(question);
                // 語音播完後進入第2頁（金錢圖示）
                Game.Speech.speak(`答對了！剩下${toTWD(effectiveAnswer)}`, () => {
                    Game.TimerManager.setTimeout(() => this._renderPhase2(question, effectiveAnswer), 400, 'turnTransition');
                });
            } else {
                this.state.quiz.streak = 0;
                this.audio.play('error');
                if (this.state.settings.retryMode === 'retry') {
                    this.state.quiz.errorCount++;
                    const willShowHint = this.state.quiz.errorCount >= 3;
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this._showCenterFeedback('❌', '再試一次！');
                    const b2EasyErrDir = chosen > effectiveAnswer ? '太多了' : '太少了';
                    Game.Speech.speak(`不對喔，算${b2EasyErrDir}，請再試一次`);
                    if (willShowHint) this._showCalcBreakdown(question);
                    Game.TimerManager.setTimeout(() => {
                        this.state.isProcessing = false;
                        document.querySelectorAll('.b2-choice-btn').forEach(btn => {
                            btn.disabled = false;
                            btn.classList.remove('wrong');
                        });
                    }, 1600, 'turnTransition');
                } else {
                    this.state.quiz.answeredHistory.push({ startAmount: question.startAmount, events: question.events, answer: effectiveAnswer, correct: false, _theme: question._theme });
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this._showCenterFeedback('❌', '答錯了！');
                    // 告知正確答案後進入第2頁
                    Game.Speech.speak(`正確答案是${toTWD(effectiveAnswer)}`, () => {
                        Game.TimerManager.setTimeout(() => this._renderPhase2(question, effectiveAnswer), 400, 'turnTransition');
                    });
                }
            }
        },

        // ── Easy 模式逐項動畫（語音回調鏈）────────────────────────
        _animateEasyEntriesSequential(question) {
            const entries = Array.from(document.querySelectorAll('.b2-event-row'));
            if (entries.length === 0) {
                this._bindB2EasyModeCoins(question);
                return;
            }

            // 只顯示第一列，播放名稱語音，其餘由金幣點擊驅動
            const revealRow = (idx) => {
                if (idx >= entries.length) {
                    this._bindB2EasyModeCoins(question);
                    return;
                }
                this.state.quiz.easyRevealedUpTo = idx;
                const row = entries[idx];
                const ev  = (this._getEffectiveEvents(question))[idx] || question.events[idx];
                row.style.display = '';
                row.style.animation = 'b2FadeIn 0.35s ease';
                Game.Speech.speak(ev.name);
                if (idx === 0) {
                    // 首列顯示後立即啟動金幣點擊（不等語音結束）
                    this._bindB2EasyModeCoins(question);
                }
            };

            Game.TimerManager.setTimeout(() => revealRow(0), 200, 'ui');
        },

        // 顯示下一事件列（供 _bindB2EasyModeCoins 呼叫）
        _revealNextEasyRow(question, idx) {
            const entries = Array.from(document.querySelectorAll('.b2-event-row'));
            if (idx >= entries.length) return;
            this.state.quiz.easyRevealedUpTo = idx;
            const row = entries[idx];
            const ev  = (this._getEffectiveEvents(question))[idx] || question.events[idx];
            row.style.display = '';
            row.style.animation = 'b2FadeIn 0.35s ease';
            Game.TimerManager.setTimeout(() => {
                Game.Speech.speak(ev.name);
            }, 150, 'ui');
            // 輔助點擊：_startObserver 只監聽 childList，無法偵測 style.display 的屬性變更。
            // 新列顯示後主動重建 queue，讓 AssistClick 繼續高亮下一列的金幣。
            // 注意：簡單模式永遠啟動 AssistClick，不能以 clickMode 為條件判斷
            if (AssistClick._enabled) {
                Game.TimerManager.setTimeout(() => AssistClick.buildQueue(question), 250, 'ui');
            }
        },

        // ── 循序提示：逐項顯示提示動畫 ─────────────────────────────
        _advanceSequentialHint(question) {
            const q = this.state.quiz;
            const effEvents = this._getEffectiveEvents(question);
            const denoms = [1000, 500, 100, 50, 10, 5, 1];
            const totalCoinsPerEvent = effEvents.map(e => {
                let rem = e.amount, cnt = 0;
                for (const d of denoms) { if (rem <= 0) break; const n = Math.floor(rem / d); cnt += n; rem -= n * d; }
                return cnt;
            });

            // 移除所有現有提示動畫
            document.querySelectorAll('.b2-coin-clickable.assist-click-hint')
                .forEach(c => c.classList.remove('assist-click-hint'));

            // 找下一個未完成的事件
            const nextIdx = effEvents.findIndex((_, i) => (q.easyCoinsClicked[i] || 0) < totalCoinsPerEvent[i]);
            if (nextIdx === -1) { q.hintSequential = false; return; }

            // 對該事件的未點擊金幣加提示動畫
            document.querySelectorAll(`.b2-coin-clickable:not(.b2-coin-clicked)[data-event-idx="${nextIdx}"]`)
                .forEach(c => c.classList.add('assist-click-hint'));

            // 播放提示語音
            const ev = effEvents[nextIdx];
            const verb = ev.type === 'income' ? '收入' : '支出';
            Game.Speech.speak(`第${nextIdx + 1}項，${ev.name}，${verb}${ev.amount}元，請點擊金錢圖示`);
        },

        // ── 開題起始金額彈窗（B1 _showTaskModal pattern）─────────
        _showTaskIntroModal(question, afterClose) {
            document.getElementById('b2-task-intro-modal')?.remove();
            const moneyIcons = this._renderMoneyIconsGrouped(question.startAmount);
            const s = this.state.settings;
            const diffLabel = { easy: '簡單', normal: '普通', hard: '困難' }[s.difficulty] || '';
            const modal = document.createElement('div');
            modal.id = 'b2-task-intro-modal';
            modal.className = 'b2-task-intro-modal';
            modal.innerHTML = `
                <div class="b2-task-intro-inner">
                    <div class="b2-task-intro-title">零用錢日記</div>
                    <div class="b2-task-intro-meta">${diffLabel}模式 · 共 ${s.questionCount} 題</div>
                    <div class="b2-task-intro-desc">計算每筆收支，算出最後的金額</div>
                    <div class="b2-task-intro-divider"></div>
                    <div class="b2-task-intro-icon">📒</div>
                    <div class="b2-task-intro-label">一開始有</div>
                    <div class="b2-task-intro-amount">${question.startAmount} 元</div>
                    <div class="b2-task-intro-money">${moneyIcons}</div>
                    <div class="b2-task-intro-tap">點任意處繼續</div>
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
            Game.TimerManager.setTimeout(() => {
                Game.Speech.speak(`本週零用錢記錄，一開始有${question.startAmount}元`, closeModal);
            }, 300, 'ui');
            modal.addEventListener('click', closeModal);
        },

        // ── 類別圖示動畫導引（Round 44）──────────────────────────
        _showThemeGuide() {
            document.getElementById('b2-theme-guide')?.remove();
            const themeKey = this.state.settings.diaryTheme;
            const themeData = {
                school:  { icon: '📚', phrase: '學校週記：留意收入和支出' },
                holiday: { icon: '🌴', phrase: '假日時光：算算假期花費' },
                family:  { icon: '👨‍👩‍👧', phrase: '家庭生活：記錄每筆零用錢' },
            };
            const td = themeData[themeKey];
            if (!td) return; // 不顯示於隨機/未設定模式
            const bar = document.createElement('div');
            bar.id = 'b2-theme-guide';
            bar.className = 'b2-theme-guide';
            bar.innerHTML = `<span class="b2-tg-icon">${td.icon}</span><span class="b2-tg-phrase">${td.phrase}</span>`;
            const app = document.getElementById('app');
            if (app) app.insertAdjacentElement('afterbegin', bar);
            Game.TimerManager.setTimeout(() => {
                bar.classList.add('b2-tg-fade');
                Game.TimerManager.setTimeout(() => { if (bar.parentNode) bar.remove(); }, 500, 'ui');
            }, 2000, 'ui');
        },

        // ── 普通/困難 Phase 1 提示：在未答對的 ？框上方顯示正確金額數字 ──
        _showDiaryAmountHints(question) {
            window.speechSynthesis.cancel();
            Game.TimerManager.clearByCategory('hintTip');
            document.querySelectorAll('.b-cost-hint-tip').forEach(el => el.remove());
            const isHard = this.state.settings.difficulty === 'hard';
            const allEventsDone = isHard && this._checkB2EventInputsCorrect();
            let shown = 0;

            if (isHard && allEventsDone) {
                // 所有費用項目已填完：僅在總計 ？框顯示數字提示
                const totalEl = document.getElementById('b2-total-input');
                if (totalEl && !totalEl.classList.contains('b2-input-correct')) {
                    const correct = parseInt(totalEl.dataset.correct);
                    if (!isNaN(correct)) {
                        const tip = document.createElement('span');
                        tip.className = 'b-cost-hint-tip';
                        tip.textContent = `${correct} 元`;
                        totalEl.appendChild(tip);
                        shown++;
                    }
                }
            } else {
                // 費用項目尚未全部填完：只在各費用 ？框顯示提示（排除總計框）
                document.querySelectorAll('.b2-cost-input:not(.b2-input-correct):not([data-idx="total"])').forEach(el => {
                    const correct = parseInt(el.dataset.correct);
                    if (isNaN(correct)) return;
                    const tip = document.createElement('span');
                    tip.className = 'b-cost-hint-tip';
                    tip.textContent = `${correct} 元`;
                    el.appendChild(tip);
                    shown++;
                });
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

        // ── 計算過程提示（答錯後顯示逐步算式）─────────────────
        _showCalcBreakdown(question) {
            document.querySelector('.b2-calc-breakdown')?.remove(); // 先移除舊的，確保反映最新自訂事件
            const section = document.querySelector('.b2-numpad-section');
            if (!section) return;
            const effEvents = this._getEffectiveEvents(question);
            const effAnswer = this._getEffectiveAnswer(question);
            let cur = question.startAmount;
            const steps = effEvents.map(e => {
                cur = e.type === 'income' ? cur + e.amount : cur - e.amount;
                const op = e.type === 'income' ? '＋' : '－';
                return `<div class="b2-bd-row">
                    <span class="b2-bd-op ${e.type}">${op}</span>
                    <span class="b2-bd-name">${e.name}</span>
                    <span class="b2-bd-val">${e.amount} 元</span>
                </div>`;
            }).join('');
            const box = document.createElement('div');
            box.className = 'b2-calc-breakdown';
            box.innerHTML = `
                <div class="b2-bd-title">💡 計算過程</div>
                <div class="b2-bd-row b2-bd-start">
                    <span class="b2-bd-op">起</span>
                    <span class="b2-bd-name">開始有</span>
                    <span class="b2-bd-val">${question.startAmount} 元</span>
                </div>
                ${steps}
                <div class="b2-bd-row b2-bd-result">
                    <span class="b2-bd-op">＝</span>
                    <span class="b2-bd-name">結果</span>
                    <span class="b2-bd-val">${effAnswer} 元</span>
                </div>`;
            section.appendChild(box);
        },

        _handleNumpadAnswer(question) {
            if (this.state.isProcessing) return;
            const input = parseInt(this.state.quiz.currentInput);
            if (isNaN(input) || input < 0) return;
            this.state.isProcessing = true;

            const effectiveAnswer = this._getEffectiveAnswer(question);
            const isCorrect = input === effectiveAnswer;

            const displayEl = document.getElementById('b2-input-display');
            if (displayEl) displayEl.style.background = isCorrect ? '#064e3b' : '#7f1d1d';

            document.querySelectorAll('.b2-numpad-btn').forEach(btn => btn.disabled = true);

            if (isCorrect) {
                this.state.quiz.correctCount++;
                this.state.quiz.answeredHistory.push({ startAmount: question.startAmount, events: this._getEffectiveEvents(question), answer: effectiveAnswer, correct: true, _theme: question._theme });
                this.state.quiz.streak = (this.state.quiz.streak || 0) + 1;

                this.audio.play('correct');
                this._showCenterFeedback('✅', '答對了！');
                this._showNetTrend(question);
                this._showFinancialTip(question);
                // 語音播完後進入第2頁（金錢圖示）
                Game.Speech.speak(`答對了！剩下${toTWD(effectiveAnswer)}`, () => {
                    Game.TimerManager.setTimeout(() => this._renderPhase2(question, effectiveAnswer), 400, 'turnTransition');
                });
            } else {
                this.state.quiz.streak = 0;
                this.audio.play('error');
                // 漸進提示（Round 34）：第1次錯→範圍提示，第2次以上→算式；困難→彈窗（B3/B5/B6 pattern）
                this.state.quiz.errorCount = (this.state.quiz.errorCount || 0) + 1;
                const isDiffHard = this.state.settings.difficulty === 'hard';
                if (this.state.quiz.errorCount === 1 && !isDiffHard) {
                    const lo = Math.min(question.startAmount, effectiveAnswer);
                    const hi = Math.max(question.startAmount, effectiveAnswer);
                    this._showRangeHint(lo, hi);
                } else if (isDiffHard) {
                    if (this.state.quiz.errorCount >= 2) {
                        Game.TimerManager.setTimeout(() => this._showHardModeHintModal(question), 800, 'ui');
                    }
                } else {
                    this._showCalcBreakdown(question); // 答錯即顯示計算過程
                }
                // 錯誤辨識語音（Round 33）
                const userVal = parseInt(this.state.quiz.currentInput);
                const diff33 = !isNaN(userVal) ? userVal - effectiveAnswer : 0;
                const errSpeech = !isNaN(userVal) && diff33 !== 0
                    ? (diff33 > 0 ? `不對喔，算太多了，請再試一次` : `不對喔，算太少了，請再試一次`)
                    : `不對喔，請再試一次`;
                if (this.state.settings.retryMode === 'retry') {
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this._showCenterFeedback('❌', '再試一次！');
                    Game.Speech.speak(errSpeech);
                    Game.TimerManager.setTimeout(() => {
                        this.state.isProcessing = false;
                        this.state.quiz.currentInput = '';
                        this._updateInputDisplay();
                        const displayEl = document.getElementById('b2-input-display');
                        if (displayEl) displayEl.style.background = '';
                        document.querySelectorAll('.b2-numpad-btn').forEach(btn => btn.disabled = false);
                    }, 1800, 'turnTransition');
                } else {
                    this.state.quiz.answeredHistory.push({ startAmount: question.startAmount, events: this._getEffectiveEvents(question), answer: effectiveAnswer, correct: false, _theme: question._theme });
                    window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                    this._showCenterFeedback('❌', '答錯了！');
                    // 告知正確答案後進入第2頁
                    Game.Speech.speak(`正確答案是${toTWD(effectiveAnswer)}`, () => {
                        Game.TimerManager.setTimeout(() => this._renderPhase2(question, effectiveAnswer), 400, 'turnTransition');
                    });
                }
            }
        },

        // ── 第2頁：簡單模式展示 / 普通・困難模式拖曳錢包（B1 pattern）──
        _renderPhase2(question, effectiveAnswer) {
            Game.TimerManager.clearByCategory('turnTransition');
            Game.EventManager.removeByCategory('gameUI');
            this._renderB2WalletPhase(question, effectiveAnswer);
        },

        // ── (舊) 簡單模式靜態金錢圖示展示（已由 _renderB2WalletPhase 取代，保留備查）──
        _renderPhase2_easyStatic_UNUSED(question, effectiveAnswer) {
            const diff = this.state.settings.difficulty;

            // ── 簡單模式：靜態金錢圖示展示 ──
            const q    = this.state.quiz;
            const pct  = Math.round((q.currentQuestion / q.totalQuestions) * 100);
            const isLast = (q.currentQuestion + 1) >= q.totalQuestions;

            const denoms = [1000, 500, 100, 50, 10, 5, 1];
            let rem = effectiveAnswer;
            const groups = [];
            for (const d of denoms) {
                if (rem <= 0) break;
                const count = Math.floor(rem / d);
                if (count > 0) { groups.push({ denom: d, count }); rem -= count * d; }
            }
            const totalCoins = groups.reduce((s, g) => s + g.count, 0);
            let coinsHTML = '';
            if (totalCoins <= 10) {
                let animIdx = 0;
                for (const g of groups) {
                    for (let i = 0; i < g.count; i++) {
                        const isBill = g.denom >= 100;
                        const w = isBill ? '80px' : '56px';
                        coinsHTML += `
                        <div class="b2-p2-coin" style="animation-delay:${animIdx * 150}ms">
                            <img src="../images/money/${g.denom}_yuan_front.png" alt="${g.denom}元"
                                 style="width:${w};${isBill ? 'border-radius:6px' : 'border-radius:50%'}"
                                 onerror="this.style.display='none'" draggable="false">
                            <span class="b2-p2-coin-label">${g.denom}</span>
                        </div>`;
                        animIdx++;
                    }
                }
            } else {
                groups.forEach((g, i) => {
                    const isBill = g.denom >= 100;
                    const w = isBill ? '80px' : '56px';
                    coinsHTML += `
                    <div class="b2-p2-coin" style="animation-delay:${i * 180}ms">
                        <img src="../images/money/${g.denom}_yuan_front.png" alt="${g.denom}元"
                             style="width:${w};${isBill ? 'border-radius:6px' : 'border-radius:50%'}"
                             onerror="this.style.display='none'" draggable="false">
                        <span class="b2-p2-coin-label">${g.denom}元 ×${g.count}</span>
                    </div>`;
                });
            }

            const themeInfo = B2_THEMES[this.state.settings.diaryTheme];
            const diffLabel = { easy: '簡單模式', normal: '普通模式', hard: '困難模式' }[diff] || '';
            const centerText = diffLabel + (themeInfo ? ` · ${themeInfo.icon}${themeInfo.name}` : '');
            const app = document.getElementById('app');
            app.innerHTML = `
            <div class="b-header">
                <div class="b-header-left"><span class="b-header-unit">📒 零用錢日記</span></div>
                <div class="b-header-center">${centerText}</div>
                <div class="b-header-right">
                    <span class="b-progress">第 ${q.currentQuestion + 1} 題 / 共 ${q.totalQuestions} 題</span>
                    <button class="b-reward-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                    <button class="b-back-btn" onclick="Game.showSettings()">返回設定</button>
                </div>
            </div>
            <div class="game-container">
                <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
                <div class="progress-text">${q.currentQuestion + 1} / ${q.totalQuestions}</div>
                <div class="b2-phase2-card">
                    <div class="b2-p2-header">
                        <span class="b2-p2-icon">💰</span>
                        <span class="b2-p2-title">最後剩下</span>
                    </div>
                    <div class="b2-p2-amount">${effectiveAnswer} 元</div>
                    <div class="b2-p2-subtitle">換成錢幣看起來像這樣 👇</div>
                    <div class="b2-p2-coins-wrap">
                        ${groups.length > 0 ? coinsHTML : '<span style="color:#9ca3af;font-size:14px;">（無需找零）</span>'}
                    </div>
                    <button class="b2-p2-next-btn" id="b2-p2-next-btn">
                        ${isLast ? '🏆 查看結果' : '下一題 ▶'}
                    </button>
                </div>
            </div>`;
            Game.Speech.speak(`剩下${toTWD(effectiveAnswer)}`);
            let advanced = false;
            const advance = () => {
                if (advanced) return;
                advanced = true;
                Game.TimerManager.clearByCategory('p2auto');
                this.nextQuestion();
            };
            Game.EventManager.on(document.getElementById('b2-p2-next-btn'), 'click', advance, {}, 'gameUI');
            Game.TimerManager.setTimeout(advance, 5000, 'p2auto');
        },

        // ── Phase 2 錢包拖曳（三難度）──────────────────────────────
        _renderB2WalletPhase(question, effectiveAnswer) {
            const q    = this.state.quiz;
            const diff = this.state.settings.difficulty;
            const isEasy = diff === 'easy';
            // 簡單模式：停用 AssistClick 覆蓋層，讓使用者能真正拖曳（輔助點擊模式除外）
            if (isEasy && this.state.settings.clickMode !== 'on') AssistClick.deactivate();
            const pct  = Math.round((q.currentQuestion / q.totalQuestions) * 100);

            // 重置錢包
            this.state.wallet = [];
            this.state.uidCounter = 0;
            q.showHint = false;
            q.hintSlots = [];
            q.walletRevealed = false;
            q.p2ErrorCount = 0;
            q.walletPhaseActive = true;
            q.p2RequiredTotal = effectiveAnswer;

            const themeInfo = B2_THEMES[this.state.settings.diaryTheme];
            const p2CenterText = '步驟二：準備錢包' + (themeInfo ? ` · ${themeInfo.icon}${themeInfo.name}` : '');

            const app = document.getElementById('app');
            app.innerHTML = `
            <div class="b-header">
                <div class="b-header-left"><span class="b-header-unit">📒 零用錢日記</span></div>
                <div class="b-header-center">${p2CenterText}</div>
                <div class="b-header-right">
                    <span class="b-progress">第 ${q.currentQuestion + 1} 題 / 共 ${q.totalQuestions} 題</span>
                    <button class="b-reward-btn" id="b2-reward-btn-p2">🎁 獎勵</button>
                    <button class="b-back-btn" id="b2-back-btn-p2">返回設定</button>
                </div>
            </div>
            <div class="b-game-wrap">
                ${this._renderB2Phase2RefCard(question, effectiveAnswer)}
                ${this._renderB2WalletArea(effectiveAnswer)}
                ${isEasy ? '' : `
                <div style="display:flex;justify-content:center;margin:8px 0;">
                    <button class="b2-wallet-confirm-btn" id="b2-wallet-confirm-btn" ${diff === 'hard' ? '' : 'disabled'}>✅ 準備好了！</button>
                </div>`}
                ${this._renderB2CoinTray(diff)}
            </div>`;

            this._bindB2WalletPhaseEvents(question, effectiveAnswer);
            Game.Speech.speak(`最後剩下${toTWD(effectiveAnswer)}，請拿出正確的金額`);

            // 簡單模式：自動顯示 ghost slot 提示（靜默，無語音/彈窗）
            if (isEasy) {
                Game.TimerManager.setTimeout(() => this._b2AutoSetGhostSlots(effectiveAnswer), 300, 'ui');
            }
        },

        // ── 靜默設定 ghost slots（簡單模式自動提示）────────────────
        _b2AutoSetGhostSlots(effectiveAnswer) {
            const diff   = this.state.settings.difficulty;
            const denoms = B2_DENOM_BY_DIFF[diff] || B2_DENOM_BY_DIFF.easy;
            const optimal = this._b2CalcOptimalCoins(effectiveAnswer, denoms);
            const q = this.state.quiz;
            q.showHint  = true;
            q.hintSlots = optimal.map(d => ({ denom: d, filled: false, face: q.trayFaces?.[d] || 'front' }));
            this._updateB2WalletDisplay(effectiveAnswer);
            if (diff === 'easy') this._b2UpdateDragHints(effectiveAnswer);
        },

        // ── 簡單模式 Phase 2 拖曳提示：高亮下一枚需拖曳的面額 + 放置區 ──
        _b2UpdateDragHints(requiredTotal) {
            document.querySelectorAll('.b2-coin-draggable').forEach(el => el.classList.remove('b2-coin-drag-hint'));
            const walletEl = document.getElementById('b2-wallet-coins');
            if (walletEl) walletEl.classList.remove('b2-drop-zone-hint');
            if (this.state.settings.difficulty !== 'easy') return;
            const q = this.state.quiz;
            if (!q.walletPhaseActive) return;
            const nextSlot = q.hintSlots?.find(s => !s.filled);
            if (!nextSlot) return;
            const coinEl = document.querySelector(`.b2-coin-draggable[data-denom="${nextSlot.denom}"]`);
            if (coinEl) coinEl.classList.add('b2-coin-drag-hint');
            if (walletEl) walletEl.classList.add('b2-drop-zone-hint');
        },

        _renderB2Phase2RefCard(question, effectiveAnswer) {
            const diff = this.state.settings.difficulty;
            const isHard = diff === 'hard';
            return `
            <div class="b2-ref-card b2-ref-card-simple">
                <div class="b2-ref-simple-row">
                    <span class="b2-ref-answer-label">💰 最後剩下</span>
                    <span class="b2-ref-answer-val" id="b2-ref-answer-val">
                        ${effectiveAnswer} 元
                    </span>
                    <div class="b2-ref-hint-wrap b2-ref-hint-inline">
                        <img src="../images/common/hint_detective.png" alt="" class="b2-ref-hint-mascot" onerror="this.style.display='none'">
                        <button class="b2-ref-hint-btn" id="b2-wallet-hint-btn" title="提示">💡 提示</button>
                    </div>
                </div>
            </div>`;
        },

        _renderB2WalletArea(requiredTotal) {
            const diff = this.state.settings.difficulty;
            const isHard = diff === 'hard';
            const isNormal = diff === 'normal';
            return `
            <div class="b2-wallet-area" id="b2-wallet-area">
                <div class="b2-wallet-header">
                    <span class="b2-wallet-title">👛 我的零用錢</span>
                    <div class="b2-wallet-total-wrap">
                        <span class="b2-wallet-total-label">已放</span>
                        <span class="b2-wallet-total-val" id="b2-wallet-total">${(isHard || isNormal) ? '??? 元' : '0 元'}</span>
                        <span class="b2-wallet-sep">/</span>
                        <span class="b2-wallet-goal-tag">需要 ${requiredTotal} 元</span>
                    </div>
                </div>
                <div class="b2-wallet-progress-wrap">
                    <div class="b2-wallet-progress" id="b2-wallet-progress">
                        <div class="b2-wallet-progress-fill" id="b2-wallet-progress-fill"></div>
                    </div>
                </div>
                <div class="b2-wallet-coins b2-drop-zone" id="b2-wallet-coins">
                    <span class="b2-wallet-empty">把錢幣拖曳到這裡 👈</span>
                </div>
            </div>`;
        },

        _renderB2CoinTray(diff) {
            const denoms = B2_DENOM_BY_DIFF[diff] || B2_DENOM_BY_DIFF.normal;
            // 為每個面額決定正/反面（1/5/10元隨機；紙鈔固定正面）並存入 trayFaces 供 ghost slot 對應
            const trayFaces = {};
            denoms.forEach(d => { trayFaces[d] = Math.random() < 0.5 ? 'back' : 'front'; });
            this.state.quiz.trayFaces = trayFaces;
            const coinsHtml = denoms.map(d => {
                const isBanknote = d >= 100;
                const face = trayFaces[d];
                const imgClass = isBanknote ? 'banknote-img' : 'coin-img';
                return `
                <div class="b2-coin-draggable" draggable="true" data-denom="${d}" title="${d}元 — 拖曳放入零用錢">
                    <img src="../images/money/${d}_yuan_${face}.png" alt="${d}元" class="${imgClass}" draggable="false"
                         onerror="this.style.display='none'">
                    <span class="b2-denom-label">${d}元</span>
                </div>`;
            }).join('');
            return `
            <div class="b2-coin-tray">
                <div class="b2-tray-title">💰 拖曳錢幣放入零用錢（可重複拖曳）</div>
                <div class="b2-tray-coins" id="b2-coin-tray">${coinsHtml}</div>
            </div>`;
        },

        _bindB2WalletPhaseEvents(question, effectiveAnswer) {
            this._setupB2DragDrop(effectiveAnswer);

            // 從錢包移除
            const walletCoinsEl = document.getElementById('b2-wallet-coins');
            if (walletCoinsEl) {
                Game.EventManager.on(walletCoinsEl, 'click', (e) => {
                    const btn = e.target.closest('.b2-wc-remove');
                    if (!btn) return;
                    const uid = parseInt(btn.dataset.uid);
                    if (!isNaN(uid)) this._b2RemoveCoin(uid, effectiveAnswer);
                }, {}, 'gameUI');
                Game.EventManager.on(walletCoinsEl, 'dragstart', (e) => {
                    const coinEl = e.target.closest('.b2-wc-removable');
                    if (!coinEl) return;
                    const uid = parseInt(coinEl.dataset.uid);
                    if (isNaN(uid)) return;
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', 'remove:' + uid);
                    coinEl.classList.add('b2-dragging');
                }, {}, 'gameUI');
                Game.EventManager.on(walletCoinsEl, 'dragend', (e) => {
                    const coinEl = e.target.closest('.b2-wc-removable');
                    if (coinEl) coinEl.classList.remove('b2-dragging');
                }, {}, 'gameUI');
            }
            const tray = document.querySelector('.b2-coin-tray');
            if (tray) {
                Game.EventManager.on(tray, 'dragover', (e) => {
                    if (e.dataTransfer.types.includes('text/plain')) {
                        e.preventDefault(); e.dataTransfer.dropEffect = 'move';
                    }
                }, {}, 'gameUI');
                Game.EventManager.on(tray, 'drop', (e) => {
                    e.preventDefault();
                    const data = e.dataTransfer.getData('text/plain');
                    if (data && data.startsWith('remove:')) {
                        const uid = parseInt(data.slice(7));
                        if (!isNaN(uid)) this._b2RemoveCoin(uid, effectiveAnswer);
                    }
                }, {}, 'gameUI');
            }

            // 確認按鈕
            Game.EventManager.on(document.getElementById('b2-wallet-confirm-btn'), 'click', () => {
                this._handleB2WalletConfirm(effectiveAnswer, question);
            }, {}, 'gameUI');

            // 提示按鈕
            Game.EventManager.on(document.getElementById('b2-wallet-hint-btn'), 'click', () => {
                const diff = this.state.settings.difficulty;
                if (diff === 'hard' || diff === 'normal') {
                    this.state.quiz.walletRevealed = true;
                }
                if (diff !== 'easy') {
                    // 普通/困難：清空已放金幣再顯示提示
                    this.state.wallet = [];
                    this.state.uidCounter = 0;
                    this._updateB2WalletDisplay(effectiveAnswer);
                }
                this._showB2CoinHint(effectiveAnswer);
            }, {}, 'gameUI');

            // 標題列按鈕
            Game.EventManager.on(document.getElementById('b2-reward-btn-p2'), 'click', () => {
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'gameUI');
            Game.EventManager.on(document.getElementById('b2-back-btn-p2'), 'click', () => {
                this.showSettings();
            }, {}, 'gameUI');
        },

        // ── B2 Wallet Operations ───────────────────────────────────
        _b2AddCoin(denom, requiredTotal) {
            const q = this.state.quiz;
            const isHardNotRevealed = this.state.settings.difficulty === 'hard' && !q.walletRevealed;
            if (q.showHint && q.hintSlots?.length) {
                const slotIdx = q.hintSlots.findIndex(s => s.denom === denom && !s.filled);
                if (slotIdx === -1) { this.audio.play('error'); return; }
                q.hintSlots[slotIdx].filled = true;
                this.audio.play('coin');
                const uid = ++this.state.uidCounter;
                const face = q.trayFaces?.[denom] || 'front';
                this.state.wallet.push({ denom, uid, isBanknote: denom >= 100, face });
                const slotEl = document.querySelector(`[data-b2-hint-idx="${slotIdx}"]`);
                if (slotEl) slotEl.classList.remove('b2-wallet-ghost-slot');
                this._updateB2WalletStatusOnly(requiredTotal);
                if (this.state.settings.difficulty === 'easy') this._b2UpdateDragHints(requiredTotal);
                const walletNow1 = this._getB2WalletTotal();
                const isEasyLastSlot = this.state.settings.difficulty === 'easy' && q.hintSlots.every(s => s.filled);
                if (!isHardNotRevealed) {
                    if (isEasyLastSlot) {
                        this.state.isProcessing = true;
                        Game.Speech.speak(toTWD(walletNow1), () => {
                            this.state.isProcessing = false;
                            this._handleB2WalletConfirm(requiredTotal, null);
                        });
                    } else {
                        Game.TimerManager.setTimeout(() => Game.Speech.speak(toTWD(walletNow1)), 80, 'ui');
                    }
                } else if (isEasyLastSlot) {
                    Game.TimerManager.setTimeout(() => this._handleB2WalletConfirm(requiredTotal, null), 400, 'ui');
                }
            } else {
                if (isHardNotRevealed) {
                    // 困難模式未按提示前：只播放 drop 音效，不播語音
                    try { const s = document.getElementById('drop-sound'); if (s) { s.currentTime = 0; s.play().catch(() => {}); } } catch(e) {}
                } else {
                    this.audio.play('coin');
                }
                const uid = ++this.state.uidCounter;
                const face2 = q.trayFaces?.[denom] || 'front';
                this.state.wallet.push({ denom, uid, isBanknote: denom >= 100, face: face2 });
                this._updateB2WalletDisplay(requiredTotal);
                if (!isHardNotRevealed) {
                    const walletNow2 = this._getB2WalletTotal();
                    Game.TimerManager.setTimeout(() => Game.Speech.speak(toTWD(walletNow2)), 80, 'ui');
                }
            }
            // 浮動標籤
            const wc = document.getElementById('b2-wallet-coins');
            if (wc) {
                const rect = wc.getBoundingClientRect();
                const popup = document.createElement('div');
                popup.className = 'b2-coin-popup';
                popup.textContent = `+${denom}元`;
                popup.style.cssText = `position:fixed;left:${rect.left + rect.width/2}px;top:${rect.top + 10}px;`;
                document.body.appendChild(popup);
                Game.TimerManager.setTimeout(() => { if (popup.parentNode) popup.remove(); }, 900, 'ui');
            }
        },

        _b2RemoveCoin(uid, requiredTotal) {
            this.audio.play('click');
            this.state.wallet = this.state.wallet.filter(c => c.uid !== uid);
            this._updateB2WalletDisplay(requiredTotal);
        },

        _getB2WalletTotal() {
            return this.state.wallet.reduce((s, c) => s + c.denom, 0);
        },

        _updateB2WalletDisplay(requiredTotal) {
            const total  = this._getB2WalletTotal();
            const enough = total >= requiredTotal;
            const diff   = this.state.settings.difficulty;
            const isHard = diff === 'hard';
            const isNormal = diff === 'normal';
            const q = this.state.quiz;
            const hideTotal = (isHard || isNormal) && !q.walletRevealed;

            const totalEl = document.getElementById('b2-wallet-total');
            if (totalEl) {
                if (hideTotal) {
                    totalEl.textContent = '??? 元';
                    totalEl.className = 'b2-wallet-total-val';
                } else {
                    totalEl.textContent = `${total} 元`;
                    const wasEnough = totalEl.classList.contains('enough');
                    totalEl.className = 'b2-wallet-total-val ' + (enough ? 'enough' : (total > 0 ? 'not-enough' : ''));
                    if (enough && !wasEnough && total > 0 && !isHard && !isNormal) {
                        totalEl.classList.add('b2-total-pop');
                        Game.TimerManager.setTimeout(() => totalEl.classList.remove('b2-total-pop'), 500, 'ui');
                    }
                }
            }
            const fillEl = document.getElementById('b2-wallet-progress-fill');
            const progressWrap = document.getElementById('b2-wallet-progress');
            if (progressWrap) progressWrap.style.display = (isHard || hideTotal) ? 'none' : '';
            if (fillEl && requiredTotal > 0 && !isHard && !hideTotal) {
                const pct = Math.min(100, Math.round((total / requiredTotal) * 100));
                fillEl.style.width = pct + '%';
                fillEl.className = 'b2-wallet-progress-fill' + (enough ? ' full' : (pct >= 70 ? ' near' : ''));
            }

            // 錢包幣列
            const coinsEl = document.getElementById('b2-wallet-coins');
            if (!coinsEl) return;
            if (q.showHint && q.hintSlots?.length) {
                const tmpSlots = q.hintSlots.map(s => ({ ...s, filled: false }));
                this.state.wallet.forEach(coin => {
                    const idx = tmpSlots.findIndex(s => s.denom === coin.denom && !s.filled);
                    if (idx >= 0) tmpSlots[idx].filled = true;
                });
                coinsEl.innerHTML = tmpSlots.map((slot, idx) => {
                    const isBanknote = slot.denom >= 100;
                    const imgW = isBanknote ? '100px' : '60px';
                    const imgH = isBanknote ? 'auto'  : '60px';
                    const ghostClass = slot.filled ? '' : ' b2-wallet-ghost-slot';
                    const slotFace = slot.face || this.state.quiz.trayFaces?.[slot.denom] || 'front';
                    return `<div class="b2-wallet-coin${ghostClass}" data-b2-hint-idx="${idx}">
                        <img src="../images/money/${slot.denom}_yuan_${slotFace}.png" alt="${slot.denom}元"
                             style="width:${imgW};height:${imgH};object-fit:contain;"
                             draggable="false" onerror="this.style.display:'none'">
                    </div>`;
                }).join('');
            } else if (this.state.wallet.length === 0) {
                coinsEl.innerHTML = '<span class="b2-wallet-empty">把錢幣拖曳到這裡 👈</span>';
            } else {
                coinsEl.innerHTML = this.state.wallet.map(coin => {
                    const imgW = coin.isBanknote ? '100px' : '60px';
                    const imgH = coin.isBanknote ? 'auto'  : '60px';
                    const coinFace = coin.face || 'front';
                    return `
                    <div class="b2-wallet-coin b2-wc-removable" draggable="true" data-uid="${coin.uid}">
                        <img src="../images/money/${coin.denom}_yuan_${coinFace}.png" alt="${coin.denom}元"
                             style="width:${imgW};height:${imgH};object-fit:contain;"
                             onerror="this.style.display:'none'" draggable="false">
                        <button class="b2-wc-remove" data-uid="${coin.uid}" title="拖回">✕</button>
                    </div>`;
                }).join('');
            }

            // 確認按鈕狀態（普通模式：正好夠才啟用；困難：一直啟用）
            const confirmBtn = document.getElementById('b2-wallet-confirm-btn');
            if (confirmBtn && !isHard) {
                confirmBtn.disabled = !enough;
                confirmBtn.classList.toggle('b2-confirm-ready', enough);
            }
        },

        _updateB2WalletStatusOnly(requiredTotal) {
            const total  = this._getB2WalletTotal();
            const enough = total >= requiredTotal;
            const diff   = this.state.settings.difficulty;
            const isHard = diff === 'hard';
            const isNormal = diff === 'normal';
            const q = this.state.quiz;
            const hideTotal = (isHard || isNormal) && !q.walletRevealed;
            const totalEl = document.getElementById('b2-wallet-total');
            if (totalEl && !hideTotal) {
                totalEl.textContent = `${total} 元`;
                totalEl.className = 'b2-wallet-total-val ' + (enough ? 'enough' : (total > 0 ? 'not-enough' : ''));
            }
            const fillEl = document.getElementById('b2-wallet-progress-fill');
            if (fillEl && requiredTotal > 0 && !isHard && !hideTotal) {
                const pct = Math.min(100, Math.round((total / requiredTotal) * 100));
                fillEl.style.width = pct + '%';
                fillEl.className = 'b2-wallet-progress-fill' + (enough ? ' full' : (pct >= 70 ? ' near' : ''));
            }
            const confirmBtn = document.getElementById('b2-wallet-confirm-btn');
            if (confirmBtn && !isHard) {
                confirmBtn.disabled = !enough;
                confirmBtn.classList.toggle('b2-confirm-ready', enough);
            }
        },

        _handleB2WalletConfirm(requiredTotal, question) {
            const total = this._getB2WalletTotal();
            const isHard = this.state.settings.difficulty === 'hard';
            if (total === requiredTotal) {
                this.audio.play('correct');
                Game.Speech.speak(`答對了！${toTWD(requiredTotal)}`, () => {
                    Game.TimerManager.setTimeout(() => this.nextQuestion(), 400, 'turnTransition');
                });
            } else {
                this.audio.play('error');
                this.state.quiz.p2ErrorCount = (this.state.quiz.p2ErrorCount || 0) + 1;
                const dir = total > requiredTotal ? '太多了' : '還不夠';
                const speech = `不對喔，${dir}，請再試一試`;
                // 困難模式：揭露答案後顯示提示
                if (isHard) {
                    this.state.quiz.walletRevealed = true;
                    const valEl = document.getElementById('b2-ref-answer-val');
                    if (valEl) valEl.textContent = `${requiredTotal} 元`;
                }
                if (this.state.quiz.p2ErrorCount >= 3) {
                    Game.Speech.speak(speech, () => {
                        Game.TimerManager.setTimeout(() => this._showB2CoinHint(requiredTotal), 500, 'ui');
                    });
                } else {
                    Game.Speech.speak(speech);
                }
                this._updateB2WalletDisplay(requiredTotal);
            }
        },

        // ── B2 Drag & Drop ─────────────────────────────────────────
        _setupB2DragDrop(requiredTotal) {
            const walletCoins = document.getElementById('b2-wallet-coins');
            if (!walletCoins) return;
            document.querySelectorAll('.b2-coin-draggable').forEach(dragEl => {
                Game.EventManager.on(dragEl, 'dragstart', (e) => {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/plain', dragEl.dataset.denom);
                    dragEl.classList.add('b2-dragging');
                    if (e.dataTransfer.setDragImage) {
                        try {
                            const img = dragEl.querySelector('img');
                            const ghost = document.createElement('img');
                            ghost.src = img ? img.src : '';
                            ghost.style.cssText = 'position:fixed;top:-200px;left:-200px;width:56px;height:56px;object-fit:contain;';
                            document.body.appendChild(ghost);
                            e.dataTransfer.setDragImage(ghost, 28, 28);
                            Game.TimerManager.setTimeout(() => ghost.remove(), 100, 'ui');
                        } catch(ex) {}
                    }
                }, {}, 'gameUI');
                Game.EventManager.on(dragEl, 'dragend', () => {
                    dragEl.classList.remove('b2-dragging');
                }, {}, 'gameUI');
            });
            Game.EventManager.on(walletCoins, 'dragover', (e) => {
                e.preventDefault(); e.dataTransfer.dropEffect = 'copy';
                walletCoins.classList.add('b2-drop-active');
            }, {}, 'gameUI');
            Game.EventManager.on(walletCoins, 'dragleave', (e) => {
                if (!walletCoins.contains(e.relatedTarget)) walletCoins.classList.remove('b2-drop-active');
            }, {}, 'gameUI');
            Game.EventManager.on(walletCoins, 'drop', (e) => {
                e.preventDefault();
                walletCoins.classList.remove('b2-drop-active');
                const denom = parseInt(e.dataTransfer.getData('text/plain'));
                if (denom && !isNaN(denom)) this._b2AddCoin(denom, requiredTotal);
            }, {}, 'gameUI');
            this._setupB2TouchDrag(requiredTotal);
        },

        _setupB2TouchDrag(requiredTotal) {
            let touchDenom = null, ghost = null;
            const self = this;
            document.querySelectorAll('.b2-coin-draggable').forEach(dragEl => {
                Game.EventManager.on(dragEl, 'touchstart', (e) => {
                    if (e.touches.length > 1) return;
                    touchDenom = parseInt(dragEl.dataset.denom);
                    const rect = dragEl.getBoundingClientRect();
                    ghost = dragEl.cloneNode(true);
                    ghost.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;opacity:0.85;pointer-events:none;z-index:9999;transform:scale(1.15);transition:none;`;
                    document.body.appendChild(ghost);
                }, { passive: true }, 'gameUI');
                Game.EventManager.on(dragEl, 'touchmove', (e) => {
                    if (!ghost) return;
                    e.preventDefault();
                    const t = e.touches[0];
                    ghost.style.left = (t.clientX - ghost.offsetWidth / 2) + 'px';
                    ghost.style.top  = (t.clientY - ghost.offsetHeight / 2) + 'px';
                    const wc = document.getElementById('b2-wallet-coins');
                    if (wc) {
                        const r = wc.getBoundingClientRect();
                        wc.classList.toggle('b2-drop-active',
                            t.clientX >= r.left && t.clientX <= r.right &&
                            t.clientY >= r.top  && t.clientY <= r.bottom);
                    }
                }, { passive: false }, 'gameUI');
                Game.EventManager.on(dragEl, 'touchend', (e) => {
                    if (!ghost || touchDenom === null) return;
                    const t = e.changedTouches[0];
                    const wc = document.getElementById('b2-wallet-coins');
                    if (wc) {
                        const r = wc.getBoundingClientRect();
                        if (t.clientX >= r.left && t.clientX <= r.right &&
                            t.clientY >= r.top  && t.clientY <= r.bottom) {
                            self._b2AddCoin(touchDenom, requiredTotal);
                        }
                        wc.classList.remove('b2-drop-active');
                    }
                    ghost.remove(); ghost = null; touchDenom = null;
                }, { passive: true }, 'gameUI');
            });
        },

        // ── B2 Hint ─────────────────────────────────────────────────
        _b2CalcOptimalCoins(amount, denoms) {
            const sorted = [...denoms].sort((a, b) => b - a);
            const result = [];
            let rem = amount;
            for (const d of sorted) { while (rem >= d) { result.push(d); rem -= d; } }
            return result;
        },

        _showB2CoinHint(requiredTotal) {
            const diff    = this.state.settings.difficulty;
            const denoms  = B2_DENOM_BY_DIFF[diff] || B2_DENOM_BY_DIFF.normal;
            const optimal = this._b2CalcOptimalCoins(requiredTotal, denoms);

            document.querySelectorAll('.b2-coin-draggable').forEach(el => el.classList.remove('b2-coin-hint'));
            const countMap = {};
            optimal.forEach(d => { countMap[d] = (countMap[d] || 0) + 1; });
            Object.keys(countMap).forEach(d => {
                document.querySelectorAll(`.b2-coin-draggable[data-denom="${d}"]`).forEach(el => el.classList.add('b2-coin-hint'));
            });
            const parts = Object.entries(countMap).sort((a, b) => b[0] - a[0]).map(([d, c]) => `${c}個${parseInt(d)}元`);
            Game.Speech.speak(`可以用${parts.join('，')}`);

            const q = this.state.quiz;
            q.showHint  = true;
            q.hintSlots = optimal.map(d => ({ denom: d, filled: false, face: q.trayFaces?.[d] || 'front' }));
            const placed = [...this.state.wallet];
            placed.forEach(coin => {
                const idx = q.hintSlots.findIndex(s => s.denom === coin.denom && !s.filled);
                if (idx >= 0) q.hintSlots[idx].filled = true;
            });
            this._updateB2WalletDisplay(requiredTotal);
            this._showB2HintModal(optimal, countMap, parts, requiredTotal);
            Game.TimerManager.setTimeout(() => {
                document.querySelectorAll('.b2-coin-draggable').forEach(el => el.classList.remove('b2-coin-hint'));
            }, 6000, 'ui');
        },

        _showB2HintModal(optimal, countMap, parts, total) {
            const prev = document.getElementById('b2-hint-modal-overlay');
            if (prev) prev.remove();
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
                    <div class="b2-hm-group">
                        <div class="b2-hm-imgs">${imgsHtml}</div>
                        <div class="b2-hm-count">${d}元 × ${c}</div>
                    </div>`;
                }).join('');
            const overlay = document.createElement('div');
            overlay.id = 'b2-hint-modal-overlay';
            overlay.className = 'b2-hint-modal-overlay';
            overlay.innerHTML = `
                <div class="b2-hint-modal">
                    <div class="b2-hm-title">💡 建議金額組合</div>
                    <div class="b2-hm-body">${denomsHtml}</div>
                    <div class="b2-hm-total">合計：${total} 元</div>
                    <button class="b2-hm-close" id="b2-hm-close">✓ 我知道了</button>
                </div>`;
            document.body.appendChild(overlay);
            const close = () => { if (overlay.parentNode) overlay.remove(); };
            document.getElementById('b2-hm-close')?.addEventListener('click', close);
            overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
            Game.TimerManager.setTimeout(close, 8000, 'ui');
        },

        // ── 收支趨勢指示（Round 26）───────────────────────────
        _showNetTrend(question) {
            const net = question.answer - question.startAmount;
            if (net === 0) return; // 完全平衡，不顯示
            const prev = document.getElementById('b2-net-trend');
            if (prev) prev.remove();
            const isUp = net > 0;
            const sign = isUp ? '+' : '';
            const trend = document.createElement('div');
            trend.id = 'b2-net-trend';
            trend.className = `b2-net-trend ${isUp ? 'up' : 'down'}`;
            trend.innerHTML = `<span class="b2-nt-arrow">${isUp ? '↑' : '↓'}</span><span>${isUp ? '本週盈餘' : '本週赤字'} ${sign}${net} 元</span>`;
            document.body.appendChild(trend);
            Game.TimerManager.setTimeout(() => {
                trend.classList.add('b2-nt-fade');
                Game.TimerManager.setTimeout(() => { if (trend.parentNode) trend.remove(); }, 400, 'ui');
            }, 1400, 'ui');
        },

        // ── 困難模式：總計算式（顯示在總計列下方）───────────────────
        _showB2TotalFormula(question) {
            document.getElementById('b2-total-formula')?.remove();
            const effEvents = this._getEffectiveEvents(question);
            let expr = String(question.startAmount);
            effEvents.forEach(e => {
                expr += e.type === 'income' ? ` + ${e.amount}` : ` − ${e.amount}`;
            });
            const totalStrip = document.querySelector('.b2-total-strip');
            if (!totalStrip) return;
            const div = document.createElement('div');
            div.id = 'b2-total-formula';
            div.className = 'b2-total-formula';
            div.innerHTML = `<span class="b1-tf-expr">${expr}</span><span class="b1-tf-eq"> = </span><span class="b1-tf-ans">？？？</span>`;
            totalStrip.insertAdjacentElement('afterend', div);
        },

        // ── 困難模式提示彈窗（B3/B5/B6 _showHardModeHintModal pattern）──
        _showHardModeHintModal(question) {
            document.getElementById('b2-hard-hint-modal')?.remove();
            const effEvents = this._getEffectiveEvents(question);
            const effAnswer = this._getEffectiveAnswer(question);
            let cur = question.startAmount;
            const steps = effEvents.map(e => {
                const prev = cur;
                cur = e.type === 'income' ? cur + e.amount : cur - e.amount;
                const op = e.type === 'income' ? '＋' : '－';
                return `<div class="b2-hm-row">
                    <span class="b2-hm-op ${e.type}">${op}${e.amount}元</span>
                    <span class="b2-hm-name">${e.name}</span>
                    <span class="b2-hm-result">${cur}元</span>
                </div>`;
            }).join('');

            const overlay = document.createElement('div');
            overlay.id = 'b2-hard-hint-modal';
            overlay.className = 'b2-hm-overlay';
            overlay.innerHTML = `
                <div class="b2-hm-modal">
                    <div class="b2-hm-header">💡 計算步驟</div>
                    <div class="b2-hm-start-row">
                        <span class="b2-hm-op neutral">起</span>
                        <span class="b2-hm-name">開始有</span>
                        <span class="b2-hm-result">${question.startAmount}元</span>
                    </div>
                    ${steps}
                    <div class="b2-hm-answer-row">
                        <span class="b2-hm-op neutral">＝</span>
                        <span class="b2-hm-name">最後餘額</span>
                        <span class="b2-hm-result b2-hm-answer">${effAnswer}元</span>
                    </div>
                    <button class="b2-hm-close-btn" id="b2-hm-close-btn">✕ 關閉</button>
                </div>`;
            document.body.appendChild(overlay);

            // 語音：逐步說明計算過程
            const parts = effEvents.map(e => {
                const verb = e.type === 'income' ? '加上' : '減去';
                return `${e.name}${verb}${e.amount}元`;
            });
            Game.Speech.speak(`從${question.startAmount}元開始，${parts.join('，')}，最後剩下${effAnswer}元`);

            const closeHM = () => { window.speechSynthesis.cancel(); document.getElementById('b2-hard-hint-modal')?.remove(); };
            Game.EventManager.on(document.getElementById('b2-hm-close-btn'), 'click', closeHM, {}, 'gameUI');
            overlay.addEventListener('click', e => { if (e.target === overlay) closeHM(); });
        },

        // ── 範圍提示（Round 34：第1次錯誤時）────────────────────
        _showRangeHint(lo, hi) {
            const container = document.querySelector('.b2-numpad-section');
            if (!container || document.querySelector('.b2-range-hint')) return;
            const hint = document.createElement('div');
            hint.className = 'b2-range-hint';
            hint.innerHTML = `💡 提示：答案介於 <strong>${lo}</strong> 元 ~ <strong>${hi}</strong> 元 之間`;
            container.appendChild(hint);
        },

        // ── 理財建議卡（Round 32）────────────────────────────────
        _showFinancialTip(question) {
            const net = question.answer - question.startAmount;
            const tips = net > 0
                ? ['收入大於支出，可以把多出來的錢存起來！', '有盈餘真好！記得把剩餘的錢放進撲滿。']
                : net < 0
                ? ['支出超過收入要小心喔，記得控制花費。', '赤字時，思考哪些費用可以減少。']
                : ['收支剛好平衡，繼續保持！'];
            const tip = tips[Math.floor(Math.random() * tips.length)];
            const prev = document.getElementById('b2-fin-tip');
            if (prev) prev.remove();
            const card = document.createElement('div');
            card.id = 'b2-fin-tip';
            card.className = 'b2-fin-tip';
            card.innerHTML = `<span class="b2-ft-icon">💡</span><span class="b2-ft-text">${tip}</span>`;
            const app = document.getElementById('app');
            if (app) app.appendChild(card);
            Game.TimerManager.setTimeout(() => { if (card.parentNode) card.remove(); }, 1400, 'ui');
        },

        // ── 14. 下一題 ────────────────────────────────────────
        nextQuestion() {
            this.state.quiz.errorCount = 0;
            this.state.quiz.currentQuestion++;
            if (this.state.quiz.currentQuestion >= this.state.quiz.totalQuestions) {
                this.showResults();
            } else {
                this.renderQuestion();
            }
        },

        // ── 15. 完成畫面 ──────────────────────────────────────
        showResults() {
            if (this.state.isEndingGame) return;
            this.state.isEndingGame = true;

            AssistClick.deactivate();
            Game.TimerManager.clearByCategory('turnTransition');
            Game.EventManager.removeByCategory('gameUI');

            const _reactivateForSummary = this.state.settings.clickMode === 'on';

            const q        = this.state.quiz;
            const elapsed  = q.startTime ? (Date.now() - q.startTime) : 0;
            const mins     = Math.floor(elapsed / 60000);
            const secs     = Math.floor((elapsed % 60000) / 1000);
            const accuracy = q.totalQuestions > 0
                ? Math.round((q.correctCount / q.totalQuestions) * 100) : 0;

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'b2', unitName: 'B2 零用錢日記', series: 'B',
                score: q.correctCount, total: q.totalQuestions, difficulty: this.state.settings?.difficulty,
                durationSec: Math.floor(elapsed / 1000) });

            let badge, badgeColor;
            if (accuracy === 100)    { badge = '完美 🥇'; badgeColor = '#f59e0b'; }
            else if (accuracy >= 90) { badge = '優異 🥇'; badgeColor = '#f59e0b'; }
            else if (accuracy >= 70) { badge = '良好 🥈'; badgeColor = '#10b981'; }
            else if (accuracy >= 50) { badge = '努力 🥉'; badgeColor = '#6366f1'; }
            else                     { badge = '練習 ⭐'; badgeColor = '#94a3b8'; }

            // 日記清單（B1 行程卡風格）
            const diaryScheduleCardHTML = (() => {
                const hist = q.answeredHistory;
                if (!hist || hist.length === 0) return '';
                const theme = this.state.settings.diaryTheme;
                const themeInfo = B2_THEMES[theme];
                const themeTitle = themeInfo ? `${themeInfo.icon} ${themeInfo.name}日記清單` : '📋 日記清單';
                const mkMoneyIcons = (amt) => {
                    const rf = () => Math.random() < 0.5 ? 'back' : 'front';
                    const denoms = [1000, 500, 100, 50, 10, 5, 1];
                    let rem = amt; const imgs = [];
                    for (const d of denoms) {
                        if (rem <= 0) break;
                        const cnt = Math.floor(rem / d);
                        for (let i = 0; i < cnt; i++) imgs.push({ d, face: rf() });
                        rem -= cnt * d;
                    }
                    return imgs.map(({ d, face }) => {
                        const isBill = d >= 100;
                        const w = isBill ? 68 : 44;
                        return `<img src="../images/money/${d}_yuan_${face}.png" alt="${d}元"
                            style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};${isBill ? 'border-radius:4px' : 'border-radius:50%'};margin:2px 2px;" onerror="this.style.display='none'" draggable="false">`;
                    }).join('');
                };
                const mkItemRow = (cls, label, amtLabel, amtCls, amt) =>
                    `<div class="b2-ds-item-row ${cls}">
                        <div class="b2-ds-item-label-row">
                            <span class="b2-ds-item-name">${label}</span>
                            <span class="b2-ds-amt ${amtCls}">${amtLabel}</span>
                        </div>
                        <div class="b2-ds-money-icons">${mkMoneyIcons(amt)}</div>
                    </div>`;
                const rowsArr = hist.map((h, i) => {
                    const entryTheme = B2_THEMES[h._theme || theme];
                    const entryIcon = entryTheme ? entryTheme.icon : '📒';
                    const eventsHtml = h.events.map(e =>
                        mkItemRow(e.type,
                            `${e.icon || (e.type === 'income' ? '📥' : '📤')} ${e.name}`,
                            `${e.type === 'income' ? '+' : '-'}${e.amount}元`,
                            e.type, e.amount)
                    ).join('');
                    const resultTag = h.correct !== false
                        ? `<span class="b2-ds-tag correct">✅</span>`
                        : `<span class="b2-ds-tag wrong">❌</span>`;
                    return `<div class="b2-ds-row">
                        <div class="b2-ds-icon">${entryIcon}</div>
                        <div class="b2-ds-detail">
                            <div class="b2-ds-label" style="font-size:16px;">第 ${i + 1} 題 ${resultTag}</div>
                            <div class="b2-ds-items">
                                ${mkItemRow('start', '💼 開始', `${h.startAmount}元`, 'start', h.startAmount)}
                                ${eventsHtml}
                                <div class="b2-ds-item-total">
                                    <div class="b2-ds-item-label-row">
                                        <span class="b2-ds-item-name">結餘</span>
                                        <span class="b2-ds-amt total">${h.answer}元</span>
                                    </div>
                                    <div class="b2-ds-money-icons">${mkMoneyIcons(h.answer)}</div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                });
                const total = rowsArr.length;
                const navHTML = total > 1 ? `
                    <div class="b2-ds-nav">
                        <button class="b2-ds-nav-btn" id="b2-ds-prev">◀</button>
                        <span class="b2-ds-nav-label" id="b2-ds-nav-label">1 / ${total}</span>
                        <button class="b2-ds-nav-btn" id="b2-ds-next">▶</button>
                    </div>` : '';
                // Store rowsArr for post-render nav binding
                this._b2DiaryNavRows = rowsArr;
                this._b2DiaryNavIdx  = 0;
                return `
                <div class="b-review-card" id="b2-diary-schedule-card">
                    <h3 class="b2-ds-header-row">
                        <span>${themeTitle}</span>
                        ${navHTML}
                    </h3>
                    <div class="b2-ds-rows" id="b2-ds-rows-container">${rowsArr[0] || ''}</div>
                </div>`;
            })();

            // 本期收支總計
            const totalCardHTML = (() => {
                const hist = q.answeredHistory;
                if (!hist || hist.length === 0) return '';
                let totalIncome = 0, totalExpense = 0;
                hist.forEach(h => {
                    h.events.forEach(e => {
                        if (e.type === 'income')  totalIncome  += e.amount;
                        else                       totalExpense += e.amount;
                    });
                });
                const net = totalIncome - totalExpense;
                // 收支平衡評語（Round 40）
                let balanceComment, balanceClass;
                if (totalIncome === 0 && totalExpense === 0) { balanceComment = ''; balanceClass = ''; }
                else if (net > totalIncome * 0.3)  { balanceComment = '💚 理財優等生！收入遠大於支出'; balanceClass = 'b2-bal-great'; }
                else if (net >= 0)                 { balanceComment = '😊 收支平衡，繼續保持！'; balanceClass = 'b2-bal-ok'; }
                else if (-net < totalExpense * 0.2){ balanceComment = '⚠️ 略有赤字，要多注意支出！'; balanceClass = 'b2-bal-warn'; }
                else                               { balanceComment = '😰 赤字偏高，可以減少一些支出！'; balanceClass = 'b2-bal-bad'; }
                const commentHTML = balanceComment
                    ? `<div class="b2-balance-comment ${balanceClass}">${balanceComment}</div>`
                    : '';
                return `
                <div class="b-review-card">
                    <h3 class="b2-ds-header-row" style="cursor:pointer;" id="b2-income-total-hdr">
                        <span>💰 本期收支總計</span>
                        <button class="b2-ds-nav-btn b2-collapse-toggle" id="b2-income-total-toggle" aria-expanded="false" style="font-size:14px;padding:2px 8px;">▼</button>
                    </h3>
                    <div id="b2-income-total-body" style="display:none;">
                        <div class="b2-totals-row">
                            <div class="b2-total-item income">
                                <span class="b2-total-label">總收入</span>
                                <span class="b2-total-val">＋${totalIncome}元</span>
                            </div>
                            <div class="b2-total-item expense">
                                <span class="b2-total-label">總支出</span>
                                <span class="b2-total-val">－${totalExpense}元</span>
                            </div>
                            <div class="b2-total-item net ${net >= 0 ? 'positive' : 'negative'}">
                                <span class="b2-total-label">淨餘額</span>
                                <span class="b2-total-val">${net >= 0 ? '＋' : ''}${net}元</span>
                            </div>
                        </div>
                        ${commentHTML}
                    </div>
                </div>`;
            })();

            // 最大收支記錄
            const maxCardHTML = (() => {
                const hist = q.answeredHistory;
                if (!hist || hist.length === 0) return '';
                let maxIncome = null, maxExpense = null;
                hist.forEach(h => h.events.forEach(e => {
                    if (e.type === 'income'  && (!maxIncome  || e.amount > maxIncome.amount))  maxIncome  = e;
                    if (e.type === 'expense' && (!maxExpense || e.amount > maxExpense.amount)) maxExpense = e;
                }));
                if (!maxIncome && !maxExpense) return '';
                return `
                <div class="b-review-card">
                    <h3 class="b2-ds-header-row" style="cursor:pointer;" id="b2-max-record-hdr">
                        <span>📌 本期最大記錄</span>
                        <button class="b2-ds-nav-btn b2-collapse-toggle" id="b2-max-record-toggle" aria-expanded="false" style="font-size:14px;padding:2px 8px;">▼</button>
                    </h3>
                    <div id="b2-max-record-body" style="display:none;">
                        <div class="b2-max-row">
                            ${maxIncome ? `<div class="b2-max-item income">
                                <span class="b2-max-icon">${maxIncome.icon || '💰'}</span>
                                <span class="b2-max-label">最大收入</span>
                                <span class="b2-max-name">${maxIncome.name}</span>
                                <span class="b2-max-val">＋${maxIncome.amount}元</span>
                            </div>` : ''}
                            ${maxExpense ? `<div class="b2-max-item expense">
                                <span class="b2-max-icon">${maxExpense.icon || '💸'}</span>
                                <span class="b2-max-label">最大支出</span>
                                <span class="b2-max-name">${maxExpense.name}</span>
                                <span class="b2-max-val">－${maxExpense.amount}元</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>`;
            })();

            // 記帳日記回顧（每題日記卡片）
            const historyCardHTML = (() => {
                const hist = q.answeredHistory;
                if (!hist || hist.length === 0) return '';
                const cards = hist.map((h, i) => {
                    const eventsHtml = h.events.map(e =>
                        `<div class="b2-rc-event-row ${e.type}">
                            <span class="b2-rc-badge ${e.type}">${e.type === 'income' ? '📥' : '📤'}</span>
                            <span class="b2-rc-event-name">${e.name}</span>
                            <span class="b2-rc-event-amt ${e.type}">${e.type === 'income' ? '+' : '-'}${e.amount}元</span>
                        </div>`
                    ).join('');
                    const resultTag = h.correct !== false
                        ? `<span class="b2-rc-result-tag correct">✅ 答對</span>`
                        : `<span class="b2-rc-result-tag wrong">❌ 答錯</span>`;
                    return `
                    <div class="b2-rc-diary-card">
                        <div class="b2-rc-card-header">
                            <span class="b2-rc-no">第 ${i + 1} 題</span>
                            ${resultTag}
                        </div>
                        <div class="b2-rc-start">💼 開始有 <strong>${h.startAmount} 元</strong></div>
                        ${eventsHtml}
                        <div class="b2-rc-answer">💰 最後剩下 <strong>${h.answer} 元</strong></div>
                    </div>`;
                }).join('');
                const themeTitle = (() => { const t = B2_THEMES[this.state.settings.diaryTheme]; return t ? `${t.icon} ${t.name}回顧` : '📒 記帳日記回顧'; })();
                return `
                <div class="b-review-card">
                    <h3>${themeTitle}</h3>
                    <div class="b2-rc-cards-list">${cards}</div>
                </div>`;
            })();

            const app = document.getElementById('app');
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            app.style.overflow = 'auto'; app.style.height = 'auto'; app.style.minHeight = '100vh';

            // ── 收支明細表格（header 下方） ──
            const summaryTableHTML = (() => {
                const hist = q.answeredHistory;
                if (!hist || hist.length === 0) return '';
                const incomeItems = [], expenseItems = [];
                hist.forEach(h => h.events.forEach(e => {
                    if (e.type === 'income') incomeItems.push(e);
                    else expenseItems.push(e);
                }));
                const maxLen = Math.max(incomeItems.length, expenseItems.length);
                if (maxLen === 0) return '';
                const rows = Array.from({ length: maxLen }, (_, i) => {
                    const inc = incomeItems[i];
                    const exp = expenseItems[i];
                    return `<tr>
                        <td class="b2-st-income-cell">${inc ? `<span class="b2-st-icon">${inc.icon||'💰'}</span><span class="b2-st-name">${inc.name}</span><span class="b2-st-amt income">+${inc.amount}元</span>` : ''}</td>
                        <td class="b2-st-expense-cell">${exp ? `<span class="b2-st-icon">${exp.icon||'💸'}</span><span class="b2-st-name">${exp.name}</span><span class="b2-st-amt expense">-${exp.amount}元</span>` : ''}</td>
                    </tr>`;
                }).join('');
                return `
                <div class="b2-summary-table-wrap">
                    <table class="b2-summary-table">
                        <thead>
                            <tr>
                                <th class="b2-st-th income">📥 收入</th>
                                <th class="b2-st-th expense">📤 支出</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>`;
            })();

            // ── 第一頁：測驗回顧 ──
            const themeInfo = B2_THEMES[this.state.settings.diaryTheme];
            app.innerHTML = `
<div class="b-header">
    <div class="b-header-left"><span class="b-header-unit">📒 零用錢日記</span></div>
    <div class="b-header-center">測驗結果</div>
    <div class="b-header-right">
        <span class="b-progress">第 ${q.totalQuestions} 題 / 共 ${q.totalQuestions} 題</span>
        <button class="b-reward-btn" id="b2-review-reward-btn">🎁 獎勵</button>
        <button class="b-back-btn" id="b2-review-back-btn">返回設定</button>
    </div>
</div>
<div class="b-review-wrapper">
    <div class="b-review-screen">
        ${diaryScheduleCardHTML}
        ${totalCardHTML}
        ${maxCardHTML}
        <button id="b2-view-summary-btn" class="b-review-next-btn">
            📊 查看測驗總結
        </button>
    </div>
</div>`;

            // 收支總計 / 最大記錄 折疊切換
            const bindCollapse = (toggleId, bodyId) => {
                const btn = document.getElementById(toggleId);
                const body = document.getElementById(bodyId);
                if (!btn || !body) return;
                Game.EventManager.on(btn, 'click', (e) => {
                    e.stopPropagation();
                    const expanded = btn.getAttribute('aria-expanded') === 'true';
                    btn.setAttribute('aria-expanded', String(!expanded));
                    btn.textContent = expanded ? '▼' : '▲';
                    body.style.display = expanded ? 'none' : '';
                }, {}, 'gameUI');
            };
            bindCollapse('b2-income-total-toggle', 'b2-income-total-body');
            bindCollapse('b2-max-record-toggle', 'b2-max-record-body');

            // 日記導覽按鈕事件綁定
            if (this._b2DiaryNavRows && this._b2DiaryNavRows.length > 1) {
                const navRows = this._b2DiaryNavRows;
                let navIdx = 0;
                const showEntry = (i) => {
                    navIdx = (i + navRows.length) % navRows.length;
                    const c = document.getElementById('b2-ds-rows-container');
                    const lbl = document.getElementById('b2-ds-nav-label');
                    if (c) c.innerHTML = navRows[navIdx];
                    if (lbl) lbl.textContent = `${navIdx + 1} / ${navRows.length}`;
                };
                const prevBtn = document.getElementById('b2-ds-prev');
                const nextBtn = document.getElementById('b2-ds-next');
                if (prevBtn) Game.EventManager.on(prevBtn, 'click', () => showEntry(navIdx - 1), {}, 'gameUI');
                if (nextBtn) Game.EventManager.on(nextBtn, 'click', () => showEntry(navIdx + 1), {}, 'gameUI');
            }

            // 標題列按鈕
            Game.EventManager.on(document.getElementById('b2-review-reward-btn'), 'click', () => {
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'gameUI');
            Game.EventManager.on(document.getElementById('b2-review-back-btn'), 'click', () => this.showSettings(), {}, 'gameUI');

            Game.TimerManager.setTimeout(() => {
                document.getElementById('success-sound')?.play();
            }, 100, 'confetti');
            Game.TimerManager.setTimeout(() => {
                Game.Speech.speak('完成了！來看看記帳回顧吧！');
            }, 600, 'speech');

            // 簡單輔助點擊：重啟以高亮「查看測驗總結」按鈕
            if (_reactivateForSummary) {
                Game.TimerManager.setTimeout(() => AssistClick.activate(null), 400, 'ui');
            }

            Game.EventManager.on(document.getElementById('b2-view-summary-btn'), 'click', () => {
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
                <h1 class="b-res-title">🎉 記帳達人 🎉</h1>
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
                    <div class="b-res-ach-item">✅ 分辨收入與支出</div>
                    <div class="b-res-ach-item">✅ 計算收支後的餘額</div>
                    <div class="b-res-ach-item">✅ 閱讀記帳日記格式</div>
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
        },

        _fireConfetti() {
            if (typeof confetti !== 'function') return;
            const duration = 3000, end = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1001 };
            const rand = (a, b) => Math.random() * (b - a) + a;
            const fire = () => {
                const t = end - Date.now();
                if (t <= 0) return;
                const n = 50 * (t / duration);
                confetti({ ...defaults, particleCount: n, origin: { x: rand(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount: n, origin: { x: rand(0.7, 0.9), y: Math.random() - 0.2 } });
                Game.TimerManager.setTimeout(fire, 250, 'confetti');
            };
            fire();
        },

        backToMenu() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeAll();
            window.location.href = '../index.html#part3';
        },
    };

    // 👆 輔助點擊模式（AssistClick）— 獨立區塊
    // ============================================================
    const AssistClick = {
        _overlay: null, _handler: null, _touchHandler: null,
        _queue: [], _enabled: false,
        _lastHighlighted: null, _observer: null,

        activate(question) {
            if (this._overlay) return;
            this._overlay = document.createElement('div');
            this._overlay.id = 'b2-assist-overlay';
            const tbEl = document.querySelector('.b-header');
            const tbBottom = tbEl ? Math.round(tbEl.getBoundingClientRect().bottom) : 60;
            this._overlay.style.cssText = `position:fixed;top:${tbBottom}px;left:0;right:0;bottom:0;z-index:10100;pointer-events:all;touch-action:none;background:transparent;cursor:pointer;`;
            document.body.appendChild(this._overlay);
            this._handler      = (e) => { e.stopPropagation(); this._executeStep(); };
            this._touchHandler = (e) => { e.preventDefault(); e.stopPropagation(); this._executeStep(); };
            this._overlay.addEventListener('click',    this._handler);
            this._overlay.addEventListener('touchend', this._touchHandler, { passive: false });
            this._enabled = true;
            this._startObserver();
            this.buildQueue(question);
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
            this._queue = []; this._enabled = false;
            this._handler = null; this._touchHandler = null;
        },

        buildQueue(question) {
            if (!this._enabled) return;
            this._clearHighlight();
            this._queue = [];

            // 結果頁：優先偵測「查看測驗總結」按鈕
            const viewSummaryBtn = document.getElementById('b2-view-summary-btn');
            if (viewSummaryBtn) {
                this._queue = [{ el: viewSummaryBtn, action: () => viewSummaryBtn.click() }];
                this._highlight(this._queue[0].el);
                return;
            }

            const diff = Game.state.settings.difficulty;
            const q    = question || Game.state.quiz.questions[Game.state.quiz.currentQuestion];
            if (!q) return;

            // Phase 2 錢包付款（所有難度）
            const qState = Game.state.quiz;
            if (qState.walletPhaseActive) {
                // 所有難度：先放入所有硬幣，再點確認（簡單模式輔助點擊同樣適用）
                const requiredTotal = qState.p2RequiredTotal || 0;
                const walletTotal   = Game._getB2WalletTotal ? Game._getB2WalletTotal() :
                    (Game.state.wallet || []).reduce((s, c) => s + c.denom, 0);
                const remaining = requiredTotal - walletTotal;

                if (remaining > 0) {
                    // 還有未放的面額 → 引導放幣
                    if (qState.showHint && qState.hintSlots?.length) {
                        const nextSlot = qState.hintSlots.find(s => !s.filled);
                        if (nextSlot) {
                            const coinEl = document.querySelector(`.b2-coin-draggable[data-denom="${nextSlot.denom}"]`);
                            if (coinEl) {
                                this._queue = [{ el: coinEl, action: () => Game._b2AddCoin(nextSlot.denom, requiredTotal) }];
                                this._highlight(coinEl);
                            }
                        }
                    } else {
                        const B2_DENOMS = [1000, 500, 100, 50, 10, 5, 1];
                        const nextDenom = B2_DENOMS.find(d => d <= remaining) || B2_DENOMS[0];
                        const coinEl = document.querySelector(`.b2-coin-draggable[data-denom="${nextDenom}"]`);
                        if (coinEl) {
                            this._queue = [{ el: coinEl, action: () => Game._b2AddCoin(nextDenom, requiredTotal) }];
                            this._highlight(coinEl);
                        }
                    }
                } else {
                    // 金額足夠 → 高亮確認按鈕
                    const confirmBtn2 = document.getElementById('b2-wallet-confirm-btn');
                    if (confirmBtn2 && !confirmBtn2.disabled) {
                        this._queue = [{ el: confirmBtn2, action: () => confirmBtn2.click() }];
                        this._highlight(this._queue[0].el);
                    }
                }
                return;
            }

            if (diff === 'easy') {
                // Phase 1：依序點擊各事件的金幣按鈕
                // 只取「已顯示列」的金幣；隱藏列的 click 會被 _bindB2EasyModeCoins 的
                // `evIdx > easyRevealedUpTo` guard 無聲拒絕，必須排除以免佔住 queue
                const revealedUpTo = qState.easyRevealedUpTo ?? 0;
                const coins = Array.from(document.querySelectorAll('.b2-coin-clickable:not(.b2-coin-clicked):not(:disabled)'))
                    .filter(btn => parseInt(btn.dataset.eventIdx) <= revealedUpTo);
                this._queue = coins.map(btn => ({ el: btn, action: () => btn.click() }));
            } else if (diff === 'normal') {
                // Normal：點擊各輸入框 → 正確選項 → 總計輸入框 → 正確選項
                const steps = [];
                const effEvents = Game._getEffectiveEvents ? Game._getEffectiveEvents(q) : q.events;
                const effAnswer = Game._getEffectiveAnswer ? Game._getEffectiveAnswer(q) : (q.answer || 0);

                const addInputStep = (inputId, correctVal) => {
                    const input = document.getElementById(inputId);
                    if (!input || input.classList.contains('b2-input-correct')) return;
                    steps.push({ el: input, action: () => {
                        input.click();
                        Game.TimerManager.setTimeout(() => {
                            const btn = document.querySelector(`.b2-nchoice-btn[data-val="${correctVal}"]`);
                            if (btn) btn.click();
                        }, 200, 'ui');
                    }});
                };

                (effEvents || q.events).forEach((e, i) => addInputStep(`b2-cost-input-${i}`, e.amount));
                addInputStep('b2-total-input', effAnswer);
                this._queue = steps;
            } else {
                // Hard：點擊輸入框（啟動） → 逐位數 → 確認，循環所有輸入框
                const steps = [];
                const effEvents = Game._getEffectiveEvents ? Game._getEffectiveEvents(q) : q.events;
                const effAnswer = Game._getEffectiveAnswer ? Game._getEffectiveAnswer(q) : (q.answer || 0);

                const addHardInputStep = (inputId, correctVal) => {
                    const input = document.getElementById(inputId);
                    if (!input || input.classList.contains('b2-input-correct')) return;
                    steps.push({ el: input, action: () => {
                        input.click();
                        const digits = String(correctVal).split('');
                        let delay = 150;
                        digits.forEach(d => {
                            Game.TimerManager.setTimeout(() => {
                                document.querySelector(`.b2-ht-digit[data-digit="${d}"]`)?.click();
                            }, delay, 'ui');
                            delay += 120;
                        });
                        Game.TimerManager.setTimeout(() => {
                            document.getElementById('b2-ht-confirm')?.click();
                        }, delay + 100, 'ui');
                    }});
                };

                (effEvents || q.events).forEach((e, i) => addHardInputStep(`b2-cost-input-${i}`, e.amount));
                addHardInputStep('b2-total-input', effAnswer);
                this._queue = steps;
            }

            if (this._queue.length > 0) this._highlight(this._queue[0].el);
        },

        _executeStep() {
            if (!this._enabled || this._queue.length === 0) return;
            const step = this._queue.shift();
            this._clearHighlight();
            if (step?.action) step.action();
            // 高亮下一步
            Game.TimerManager.setTimeout(() => {
                if (this._enabled && this._queue.length > 0) this._highlight(this._queue[0].el);
            }, 120, 'ui');
        },

        _startObserver() {
            const app = document.getElementById('app');
            if (!app) return;
            let t = null;
            this._observer = new MutationObserver(() => {
                if (!this._enabled || this._queue.length > 0) return;
                if (t) window.clearTimeout(t);
                t = window.setTimeout(() => { if (this._enabled) this.buildQueue(); }, 400);
            });
            this._observer.observe(app, { childList: true, subtree: true });
        },

        _highlight(el) {
            this._clearHighlight();
            if (!el) return;
            el.classList.add('assist-click-hint');
            this._lastHighlighted = el;
        },

        _clearHighlight() {
            if (this._lastHighlighted) {
                this._lastHighlighted.classList.remove('assist-click-hint');
                this._lastHighlighted = null;
            }
            document.querySelectorAll('.assist-click-hint').forEach(e => e.classList.remove('assist-click-hint'));
        }
    };

    Game.init();
});
