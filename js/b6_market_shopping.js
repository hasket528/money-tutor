// =============================================================
// FILE: js/b6_market_shopping.js — B6 菜市場買菜
// =============================================================
'use strict';

// ── 市場攤位資料 ─────────────────────────────────────────────
const B6_STALLS = {
    vegetable: {
        name: '蔬菜攤', icon: '🥦',
        items: [
            { id: 'cabbage',    name: '高麗菜', price: 30,  unit: '顆', icon: '🥬', imageUrl: '../images/b6/icon-b6-cabbage.png' },
            { id: 'tomato',     name: '番茄',   price: 45,  unit: '斤', icon: '🍅', imageUrl: '../images/b6/icon-b6-tomato.png' },
            { id: 'scallion',   name: '青蔥',   price: 20,  unit: '把', icon: '🌿', imageUrl: '../images/b6/icon-b6-scallion.png' },
            { id: 'sweetpot',   name: '地瓜',   price: 35,  unit: '斤', icon: '🍠', imageUrl: '../images/b6/icon-b6-sweet-potato.png' },
            { id: 'spinach',    name: '菠菜',   price: 25,  unit: '把', icon: '🥗', imageUrl: '../images/b6/icon-b6-spinach.png' },
            { id: 'carrot',     name: '紅蘿蔔', price: 40,  unit: '斤', icon: '🥕', imageUrl: '../images/b6/icon-b6-carrot.png' },
            { id: 'corn',       name: '玉米',   price: 15,  unit: '根', icon: '🌽', imageUrl: '../images/b6/icon-b6-corn.png' },
            { id: 'cucumber',   name: '小黃瓜', price: 20,  unit: '條', icon: '🥒', imageUrl: '../images/b6/icon-b6-cucumber.png' },
            { id: 'broccoli',   name: '花椰菜', price: 45,  unit: '顆', icon: '🥦', imageUrl: '../images/b6/icon-b6-broccoli.png' },
            { id: 'pumpkin',    name: '南瓜',   price: 55,  unit: '顆', icon: '🎃', imageUrl: '../images/b6/icon-b6-pumpkin.png' },
            { id: 'daikon',     name: '白蘿蔔', price: 30,  unit: '條', icon: '🥬', imageUrl: '../images/b6/icon-b6-daikon.png' },
            { id: 'pakchoi',    name: '青江菜', price: 15,  unit: '把', icon: '🌱', imageUrl: '../images/b6/icon-b6-pakchoi.png' },
        ],
    },
    fruit: {
        name: '水果攤', icon: '🍎',
        items: [
            { id: 'apple',      name: '蘋果',   price: 50,  unit: '斤', icon: '🍎', imageUrl: '../images/b6/icon-b6-apple.png' },
            { id: 'banana',     name: '香蕉',   price: 25,  unit: '把', icon: '🍌', imageUrl: '../images/b6/icon-b6-banana.png' },
            { id: 'grape',      name: '葡萄',   price: 80,  unit: '串', icon: '🍇', imageUrl: '../images/b6/icon-b6-grape.png' },
            { id: 'orange',     name: '柳橙',   price: 40,  unit: '斤', icon: '🍊', imageUrl: '../images/b6/icon-b6-orange.png' },
            { id: 'melon',      name: '哈密瓜', price: 120, unit: '顆', icon: '🍈', imageUrl: '../images/b6/icon-b6-melon.png' },
            { id: 'mango',      name: '芒果',   price: 60,  unit: '斤', icon: '🥭', imageUrl: '../images/b6/icon-b6-mango.png' },
            { id: 'watermelon', name: '西瓜',   price: 80,  unit: '片', icon: '🍉', imageUrl: '../images/b6/icon-b6-watermelon.png' },
            { id: 'pineapple',  name: '鳳梨',   price: 70,  unit: '顆', icon: '🍍', imageUrl: '../images/b6/icon-b6-pineapple.png' },
            { id: 'strawberry', name: '草莓',   price: 100, unit: '盒', icon: '🍓', imageUrl: '../images/b6/icon-b6-strawberry.png' },
            { id: 'peach',      name: '桃子',   price: 55,  unit: '顆', icon: '🍑', imageUrl: '../images/b6/icon-b6-peach.png' },
            { id: 'papaya',     name: '木瓜',   price: 45,  unit: '顆', icon: '🧡', imageUrl: '../images/b6/icon-b6-papaya.png' },
            { id: 'guava',      name: '芭樂',   price: 35,  unit: '顆', icon: '🍏', imageUrl: '../images/b6/icon-b6-guava.png' },
        ],
    },
    grocery: {
        name: '雜貨攤', icon: '🛒',
        items: [
            { id: 'egg',        name: '雞蛋',   price: 65,  unit: '盒', icon: '🥚', imageUrl: '../images/b6/icon-b6-egg.png' },
            { id: 'tofu',       name: '豆腐',   price: 25,  unit: '塊', icon: '🫙', imageUrl: '../images/b6/icon-b6-tofu.png' },
            { id: 'soy',        name: '醬油',   price: 45,  unit: '瓶', icon: '🍶', imageUrl: '../images/b6/icon-b6-soy-sauce.png' },
            { id: 'rice',       name: '白米',   price: 90,  unit: '包', icon: '🌾', imageUrl: '../images/b6/icon-b6-rice.png' },
            { id: 'noodle',     name: '麵條',   price: 35,  unit: '包', icon: '🍜', imageUrl: '../images/b6/icon-b6-noodle.png' },
            { id: 'salt',       name: '食鹽',   price: 20,  unit: '包', icon: '🧂', imageUrl: '../images/b6/icon-b6-salt.png' },
            { id: 'sugar',      name: '砂糖',   price: 30,  unit: '包', icon: '🍬', imageUrl: '../images/b6/icon-b6-sugar.png' },
            { id: 'miso',       name: '味噌',   price: 40,  unit: '包', icon: '🟡', imageUrl: '../images/b6/icon-b6-miso.png' },
            { id: 'oil',        name: '沙拉油', price: 75,  unit: '瓶', icon: '🫙', imageUrl: '../images/b6/icon-b6-cooking-oil.png' },
            { id: 'canned',     name: '罐頭',   price: 35,  unit: '罐', icon: '🥫', imageUrl: '../images/b6/icon-b6-canned-food.png' },
            { id: 'soap',       name: '洗碗精', price: 45,  unit: '瓶', icon: '🧴', imageUrl: '../images/b6/icon-b6-dish-soap.png' },
            { id: 'tissue',     name: '衛生紙', price: 50,  unit: '包', icon: '🧻', imageUrl: '../images/b6/icon-b6-tissue.png' },
        ],
    },
};

// ── 購物清單任務（依難度）── 新格式：指定各攤位選幾樣，不指定具體商品 ──
// budget = 上限；stalls = [{stall, count}] 表示在該攤位自由選 count 樣
const B6_MISSIONS = {
    easy: [
        { budget:  80, stalls: [{ stall:'vegetable', count:1 }, { stall:'grocery',   count:1 }] },
        { budget: 100, stalls: [{ stall:'fruit',     count:1 }, { stall:'vegetable', count:1 }] },
        { budget:  60, stalls: [{ stall:'vegetable', count:2 }] },
        { budget:  80, stalls: [{ stall:'grocery',   count:1 }, { stall:'fruit',     count:1 }] },
        { budget: 100, stalls: [{ stall:'fruit',     count:1 }, { stall:'grocery',   count:1 }] },
        { budget:  70, stalls: [{ stall:'vegetable', count:1 }, { stall:'fruit',     count:1 }] },
        { budget:  80, stalls: [{ stall:'grocery',   count:2 }] },
        { budget: 100, stalls: [{ stall:'vegetable', count:1 }, { stall:'fruit',     count:1 }, { stall:'grocery', count:1 }] },
    ],
    normal: [
        { budget: 120, stalls: [{ stall:'vegetable', count:2 }, { stall:'grocery',   count:1 }] },
        { budget: 150, stalls: [{ stall:'fruit',     count:1 }, { stall:'grocery',   count:2 }] },
        { budget: 130, stalls: [{ stall:'vegetable', count:2 }, { stall:'fruit',     count:1 }] },
        { budget: 180, stalls: [{ stall:'fruit',     count:2 }, { stall:'grocery',   count:1 }] },
        { budget: 140, stalls: [{ stall:'vegetable', count:1 }, { stall:'fruit',     count:1 }, { stall:'grocery', count:1 }] },
        { budget: 110, stalls: [{ stall:'vegetable', count:3 }] },
        { budget: 160, stalls: [{ stall:'fruit',     count:1 }, { stall:'vegetable', count:2 }, { stall:'grocery', count:1 }] },
        { budget: 170, stalls: [{ stall:'grocery',   count:2 }, { stall:'fruit',     count:1 }] },
    ],
    hard: [
        { budget: 200, stalls: [{ stall:'vegetable', count:2 }, { stall:'fruit',     count:1 }, { stall:'grocery', count:2 }] },
        { budget: 180, stalls: [{ stall:'vegetable', count:3 }, { stall:'grocery',   count:2 }] },
        { budget: 220, stalls: [{ stall:'fruit',     count:2 }, { stall:'vegetable', count:2 }, { stall:'grocery', count:1 }] },
        { budget: 250, stalls: [{ stall:'grocery',   count:3 }, { stall:'fruit',     count:2 }] },
        { budget: 200, stalls: [{ stall:'vegetable', count:3 }, { stall:'fruit',     count:1 }, { stall:'grocery', count:1 }] },
        { budget: 230, stalls: [{ stall:'fruit',     count:2 }, { stall:'grocery',   count:2 }, { stall:'vegetable', count:1 }] },
        { budget: 260, stalls: [{ stall:'vegetable', count:2 }, { stall:'fruit',     count:2 }, { stall:'grocery', count:2 }] },
        { budget: 200, stalls: [{ stall:'vegetable', count:4 }, { stall:'grocery',   count:2 }] },
    ],
};

// ── 市場類型（B5_THEMES pattern）────────────────────────────
const B6_MARKETS = {
    traditional: {
        name: '傳統市場', icon: '🏪',
        stalls: B6_STALLS,
        missions: B6_MISSIONS,
    },
    supermarket: {
        name: '超市購物', icon: '🛒',
        stalls: {
            bakery: {
                name: '烘焙區', icon: '🥖',
                items: [
                    { id: 'bread',      name: '麵包',   price: 30,  unit: '個', icon: '🍞', imageUrl: '../images/b6/icon-b6-bread.png' },
                    { id: 'croissant',  name: '可頌',   price: 45,  unit: '個', icon: '🥐', imageUrl: '../images/b6/icon-b6-croissant.png' },
                    { id: 'toast',      name: '吐司',   price: 35,  unit: '條', icon: '🍞', imageUrl: '../images/b6/icon-b6-toast.png' },
                    { id: 'muffin',     name: '馬芬',   price: 25,  unit: '個', icon: '🧁', imageUrl: '../images/b6/icon-b6-muffin.png' },
                    { id: 'bun',        name: '小餐包', price: 20,  unit: '包', icon: '🥖', imageUrl: '../images/b6/icon-b6-dinner-bun.png' },
                    { id: 'cake_slice', name: '蛋糕',   price: 60,  unit: '片', icon: '🎂', imageUrl: '../images/b6/icon-b6-cake-slice.png' },
                    { id: 'bagel',      name: '貝果',   price: 40,  unit: '個', icon: '🥯', imageUrl: '../images/b6/icon-b6-bagel.png' },
                    { id: 'waffle',     name: '鬆餅',   price: 50,  unit: '片', icon: '🧇', imageUrl: '../images/b6/icon-b6-waffle.png' },
                    { id: 'donut',      name: '甜甜圈', price: 30,  unit: '個', icon: '🍩', imageUrl: '../images/b6/icon-b6-donut.png' },
                    { id: 'cookie',     name: '餅乾',   price: 45,  unit: '包', icon: '🍪', imageUrl: '../images/b6/icon-b6-cookie.png' },
                    { id: 'brownie',    name: '布朗尼', price: 35,  unit: '塊', icon: '🍫', imageUrl: '../images/b6/icon-b6-brownie.png' },
                    { id: 'eclair',     name: '閃電泡芙', price: 55, unit: '個', icon: '🥧', imageUrl: '../images/b6/icon-b6-eclair.png' },
                ],
            },
            dairy: {
                name: '乳品區', icon: '🥛',
                items: [
                    { id: 'milk',       name: '牛奶',   price: 50,  unit: '瓶', icon: '🥛', imageUrl: '../images/b6/icon-b6-milk.png' },
                    { id: 'yogurt',     name: '優格',   price: 40,  unit: '杯', icon: '🫙', imageUrl: '../images/b6/icon-b6-yogurt.png' },
                    { id: 'cheese',     name: '起司',   price: 80,  unit: '片', icon: '🧀', imageUrl: '../images/b6/icon-b6-cheese.png' },
                    { id: 'butter',     name: '奶粉',   price: 65,  unit: '盒', icon: '🥛', imageUrl: '../images/b6/icon-b6-milk-powder.png' },
                    { id: 'cream',      name: '鮮奶油', price: 45,  unit: '瓶', icon: '🫙', imageUrl: '../images/b6/icon-b6-whipping-cream.png' },
                    { id: 'sm_egg',     name: '雞蛋',   price: 55,  unit: '盒', icon: '🥚', imageUrl: '../images/b6/icon-b6-egg.png' },
                    { id: 'soy_milk',   name: '豆漿',   price: 35,  unit: '瓶', icon: '🥛', imageUrl: '../images/b6/icon-b6-soy-milk.png' },
                    { id: 'oat_milk',   name: '燕麥奶', price: 60,  unit: '瓶', icon: '🌾', imageUrl: '../images/b6/icon-b6-oat-milk.png' },
                    { id: 'pudding',    name: '布丁',   price: 25,  unit: '個', icon: '🍮', imageUrl: '../images/b6/icon-b6-pudding.png' },
                    { id: 'ice_coffee', name: '咖啡凍', price: 30,  unit: '杯', icon: '☕', imageUrl: '../images/b6/icon-b6-coffee-jelly.png' },
                    { id: 'milk_tea_b', name: '奶茶',   price: 45,  unit: '瓶', icon: '🍵', imageUrl: '../images/b6/icon-b6-milk-tea.png' },
                    { id: 'custard',    name: '優酪乳', price: 55,  unit: '個', icon: '🥛', imageUrl: '../images/b6/icon-b6-custard-yogurt.png' },
                ],
            },
            frozen: {
                name: '冷凍區', icon: '🧊',
                items: [
                    { id: 'dumpling',   name: '水餃',   price: 75,  unit: '包', icon: '🥟', imageUrl: '../images/b6/icon-b6-dumpling.png' },
                    { id: 'sausage',    name: '薯餅',   price: 60,  unit: '包', icon: '🌭', imageUrl: '../images/b6/icon-b6-hash-brown.png' },
                    { id: 'ice_cream',  name: '冰淇淋', price: 45,  unit: '支', icon: '🍦', imageUrl: '../images/b6/icon-b6-ice-cream.png' },
                    { id: 'nugget',     name: '雞塊',   price: 80,  unit: '包', icon: '🍗', imageUrl: '../images/b6/icon-b6-chicken-nugget.png' },
                    { id: 'fish_ball',  name: '魚丸',   price: 50,  unit: '包', icon: '🫙', imageUrl: '../images/b6/icon-b6-fish-ball.png' },
                    { id: 'edamame',    name: '毛豆',   price: 35,  unit: '包', icon: '🫘', imageUrl: '../images/b6/icon-b6-edamame.png' },
                    { id: 'wonton',     name: '餛飩',   price: 65,  unit: '包', icon: '🥟', imageUrl: '../images/b6/icon-b6-wonton.png' },
                    { id: 'shrimp',     name: '蝦仁',   price: 90,  unit: '包', icon: '🦐', imageUrl: '../images/b6/icon-b6-shrimp.png' },
                    { id: 'pizza',      name: '披薩',   price: 55,  unit: '片', icon: '🍕', imageUrl: '../images/b6/icon-b6-pizza.png' },
                    { id: 'corn_dog',   name: '熱狗',   price: 40,  unit: '條', icon: '🌽', imageUrl: '../images/b6/icon-b6-corn-dog.png' },
                    { id: 'pork_bun',   name: '炒飯',   price: 50,  unit: '個', icon: '🥙', imageUrl: '../images/b6/icon-b6-fried-rice.png' },
                    { id: 'spring_roll',name: '貢丸',   price: 35,  unit: '條', icon: '🌯', imageUrl: '../images/b6/icon-b6-fish-cake-ball.png' },
                ],
            },
        },
        missions: {
            easy: [
                { budget:  80, stalls: [{ stall:'bakery', count:1 }, { stall:'dairy',  count:1 }] },
                { budget: 100, stalls: [{ stall:'frozen', count:1 }, { stall:'bakery', count:1 }] },
                { budget:  80, stalls: [{ stall:'bakery', count:2 }] },
                { budget: 100, stalls: [{ stall:'dairy',  count:1 }, { stall:'bakery', count:1 }] },
                { budget: 100, stalls: [{ stall:'dairy',  count:2 }] },
                { budget: 100, stalls: [{ stall:'frozen', count:1 }, { stall:'dairy',  count:1 }] },
                { budget: 100, stalls: [{ stall:'bakery', count:1 }, { stall:'dairy',  count:1 }, { stall:'frozen', count:1 }] },
                { budget: 100, stalls: [{ stall:'frozen', count:2 }] },
            ],
            normal: [
                { budget: 150, stalls: [{ stall:'bakery', count:2 }, { stall:'dairy',  count:1 }] },
                { budget: 180, stalls: [{ stall:'dairy',  count:1 }, { stall:'frozen', count:2 }] },
                { budget: 160, stalls: [{ stall:'bakery', count:2 }, { stall:'frozen', count:1 }] },
                { budget: 200, stalls: [{ stall:'dairy',  count:2 }, { stall:'bakery', count:1 }] },
                { budget: 170, stalls: [{ stall:'bakery', count:1 }, { stall:'dairy',  count:1 }, { stall:'frozen', count:1 }] },
                { budget: 130, stalls: [{ stall:'bakery', count:3 }] },
                { budget: 190, stalls: [{ stall:'frozen', count:1 }, { stall:'bakery', count:2 }, { stall:'dairy',  count:1 }] },
                { budget: 200, stalls: [{ stall:'dairy',  count:2 }, { stall:'frozen', count:1 }] },
            ],
            hard: [
                { budget: 250, stalls: [{ stall:'bakery', count:2 }, { stall:'dairy',  count:1 }, { stall:'frozen', count:2 }] },
                { budget: 220, stalls: [{ stall:'bakery', count:3 }, { stall:'dairy',  count:2 }] },
                { budget: 280, stalls: [{ stall:'dairy',  count:2 }, { stall:'frozen', count:2 }, { stall:'bakery', count:1 }] },
                { budget: 300, stalls: [{ stall:'frozen', count:3 }, { stall:'dairy',  count:2 }] },
                { budget: 240, stalls: [{ stall:'bakery', count:3 }, { stall:'frozen', count:1 }, { stall:'dairy',  count:1 }] },
                { budget: 260, stalls: [{ stall:'dairy',  count:2 }, { stall:'frozen', count:2 }, { stall:'bakery', count:1 }] },
                { budget: 280, stalls: [{ stall:'bakery', count:2 }, { stall:'dairy',  count:2 }, { stall:'frozen', count:2 }] },
                { budget: 230, stalls: [{ stall:'bakery', count:4 }, { stall:'dairy',  count:2 }] },
            ],
        },
    },
    nightmarket: {
        name: '夜市美食', icon: '🏮',
        stalls: {
            snack: {
                name: '小吃攤', icon: '🍜',
                items: [
                    { id: 'oysternoodle',  name: '蚵仔麵線', price: 50,  unit: '碗', icon: '🍜', imageUrl: '../images/b6/icon-b6-oyster-noodle.png' },
                    { id: 'beefnoodle',    name: '牛肉麵',   price: 80,  unit: '碗', icon: '🍲', imageUrl: '../images/b6/icon-b6-beef-noodle.png' },
                    { id: 'pancake',       name: '蔥抓餅',   price: 35,  unit: '份', icon: '🥞', imageUrl: '../images/b6/icon-b6-scallion-pancake.png' },
                    { id: 'popcorn_chk',   name: '鹹酥雞',   price: 60,  unit: '份', icon: '🍗', imageUrl: '../images/b6/icon-b6-popcorn-chicken.png' },
                    { id: 'stinky_tofu',   name: '臭豆腐',   price: 45,  unit: '份', icon: '🫙', imageUrl: '../images/b6/icon-b6-stinky-tofu.png' },
                    { id: 'takoyaki',      name: '章魚燒',   price: 50,  unit: '份', icon: '🐙', imageUrl: '../images/b6/icon-b6-takoyaki.png' },
                    { id: 'chicken_chop',  name: '雞排',     price: 65,  unit: '份', icon: '🍖', imageUrl: '../images/b6/icon-b6-chicken-chop.png' },
                    { id: 'oyster_omelet', name: '蚵仔煎',   price: 60,  unit: '份', icon: '🍳', imageUrl: '../images/b6/icon-b6-oyster-omelet.png' },
                    { id: 'sweet_potato_ball', name: '地瓜球', price: 30, unit: '份', icon: '🟠', imageUrl: '../images/b6/icon-b6-sweet-potato-ball.png' },
                    { id: 'fishball_soup', name: '魚丸湯',   price: 40,  unit: '碗', icon: '🍥', imageUrl: '../images/b6/icon-b6-fishball-soup.png' },
                    { id: 'scallion_egg',  name: '蔥油餅',   price: 35,  unit: '份', icon: '🥚', imageUrl: '../images/b6/icon-b6-scallion-egg-pancake.png' },
                    { id: 'pork_pepper',   name: '胡椒餅',   price: 45,  unit: '個', icon: '🫔', imageUrl: '../images/b6/icon-b6-pork-pepper-bun.png' },
                ],
            },
            drink: {
                name: '飲料攤', icon: '🧋',
                items: [
                    { id: 'bubble_tea',  name: '珍珠奶茶', price: 55, unit: '杯', icon: '🧋', imageUrl: '../images/b6/icon-b6-bubble-tea.png' },
                    { id: 'lemon_tea',   name: '檸檬茶',   price: 40, unit: '杯', icon: '🍋', imageUrl: '../images/b6/icon-b6-lemon-tea.png' },
                    { id: 'sugarcane',   name: '甘蔗汁',   price: 30, unit: '杯', icon: '🌿', imageUrl: '../images/b6/icon-b6-sugarcane-juice.png' },
                    { id: 'milk_tea',    name: '奶茶',     price: 45, unit: '杯', icon: '🍵', imageUrl: '../images/b6/icon-b6-milk-tea.png' },
                    { id: 'smoothie',    name: '西瓜汁',   price: 50, unit: '杯', icon: '🍹', imageUrl: '../images/b6/icon-b6-watermelon-juice.png' },
                    { id: 'soymilk',     name: '烏龍茶',   price: 35, unit: '碗', icon: '🥛', imageUrl: '../images/b6/icon-b6-oolong-tea.png' },
                    { id: 'papaya_milk', name: '木瓜牛奶', price: 50, unit: '杯', icon: '🥛', imageUrl: '../images/b6/icon-b6-papaya-milk.png' },
                    { id: 'iced_tea',    name: '紅茶',     price: 30, unit: '杯', icon: '🍶', imageUrl: '../images/b6/icon-b6-iced-black-tea.png' },
                    { id: 'taro_milk',   name: '芋頭牛奶', price: 55, unit: '杯', icon: '🫗', imageUrl: '../images/b6/icon-b6-taro-milk.png' },
                    { id: 'winter_melon',name: '冬瓜茶',   price: 25, unit: '杯', icon: '🍵', imageUrl: '../images/b6/icon-b6-winter-melon-tea.png' },
                    { id: 'mango_ice',   name: '芒果冰',   price: 60, unit: '杯', icon: '🥭', imageUrl: '../images/b6/icon-b6-mango-shaved-ice.png' },
                    { id: 'plum_juice',  name: '梅子汁',   price: 30, unit: '杯', icon: '🫙', imageUrl: '../images/b6/icon-b6-plum-juice.png' },
                ],
            },
            souvenir: {
                name: '紀念品攤', icon: '🎁',
                items: [
                    { id: 'phone_case',  name: '手機殼',   price: 80,  unit: '個', icon: '📱', imageUrl: '../images/b6/icon-b6-phone-case.png' },
                    { id: 'keychain',    name: '鑰匙圈',   price: 45,  unit: '個', icon: '🔑', imageUrl: '../images/b6/icon-b6-keychain.png' },
                    { id: 'hairpin',     name: '髮夾',     price: 30,  unit: '個', icon: '💎', imageUrl: '../images/b6/icon-b6-hairpin.png' },
                    { id: 'bookmark',    name: '書籤',     price: 20,  unit: '個', icon: '📖', imageUrl: '../images/b6/icon-b6-bookmark.png' },
                    { id: 'magnet',      name: '冰箱磁鐵', price: 35,  unit: '個', icon: '🧲', imageUrl: '../images/b6/icon-b6-fridge-magnet.png' },
                    { id: 'wristband',   name: '手環',     price: 60,  unit: '個', icon: '🪬', imageUrl: '../images/b6/icon-b6-wristband.png' },
                    { id: 'postcard',    name: '明信片',   price: 25,  unit: '張', icon: '📮', imageUrl: '../images/b6/icon-b6-postcard.png' },
                    { id: 'sticker',     name: '貼紙組',   price: 20,  unit: '包', icon: '🌟', imageUrl: '../images/b6/icon-b6-sticker-set.png' },
                    { id: 'charm',       name: '吊飾',     price: 55,  unit: '個', icon: '🔮', imageUrl: '../images/b6/icon-b6-charm.png' },
                    { id: 'plush',       name: '可愛布偶', price: 90,  unit: '個', icon: '🧸', imageUrl: '../images/b6/icon-b6-plush-toy.png' },
                    { id: 'badge_pin',   name: '徽章',     price: 30,  unit: '個', icon: '🏅', imageUrl: '../images/b6/icon-b6-badge-pin.png' },
                    { id: 'fan',         name: '摺扇',     price: 50,  unit: '把', icon: '🪭', imageUrl: '../images/b6/icon-b6-folding-fan.png' },
                    { id: 'lanyard',     name: '掛繩',     price: 40,  unit: '條', icon: '🎀', imageUrl: '../images/b6/icon-b6-lanyard.png' },
                    { id: 'tote_bag',    name: '帆布袋',   price: 75,  unit: '個', icon: '👜', imageUrl: '../images/b6/icon-b6-tote-bag.png' },
                ],
            },
        },
        missions: {
            easy: [
                { budget:  80, stalls: [{ stall:'drink',    count:1 }, { stall:'souvenir', count:1 }] },
                { budget:  80, stalls: [{ stall:'snack',    count:1 }, { stall:'drink',    count:1 }] },
                { budget: 100, stalls: [{ stall:'souvenir', count:2 }] },
                { budget:  80, stalls: [{ stall:'snack',    count:1 }, { stall:'souvenir', count:1 }] },
                { budget: 100, stalls: [{ stall:'drink',    count:2 }] },
                { budget: 100, stalls: [{ stall:'snack',    count:1 }, { stall:'drink',    count:1 }] },
                { budget: 120, stalls: [{ stall:'snack',    count:1 }, { stall:'drink',    count:1 }, { stall:'souvenir', count:1 }] },
                { budget:  70, stalls: [{ stall:'souvenir', count:1 }, { stall:'drink',    count:1 }] },
            ],
            normal: [
                { budget: 150, stalls: [{ stall:'snack',    count:1 }, { stall:'drink',    count:2 }] },
                { budget: 180, stalls: [{ stall:'souvenir', count:2 }, { stall:'drink',    count:1 }] },
                { budget: 160, stalls: [{ stall:'snack',    count:2 }, { stall:'drink',    count:1 }] },
                { budget: 200, stalls: [{ stall:'snack',    count:1 }, { stall:'souvenir', count:2 }] },
                { budget: 170, stalls: [{ stall:'snack',    count:1 }, { stall:'drink',    count:1 }, { stall:'souvenir', count:1 }] },
                { budget: 140, stalls: [{ stall:'snack',    count:3 }] },
                { budget: 190, stalls: [{ stall:'drink',    count:2 }, { stall:'snack',    count:1 }, { stall:'souvenir', count:1 }] },
                { budget: 200, stalls: [{ stall:'souvenir', count:2 }, { stall:'snack',    count:1 }] },
            ],
            hard: [
                { budget: 250, stalls: [{ stall:'snack',    count:2 }, { stall:'drink',    count:1 }, { stall:'souvenir', count:2 }] },
                { budget: 220, stalls: [{ stall:'snack',    count:3 }, { stall:'souvenir', count:2 }] },
                { budget: 280, stalls: [{ stall:'souvenir', count:2 }, { stall:'drink',    count:2 }, { stall:'snack',    count:1 }] },
                { budget: 300, stalls: [{ stall:'drink',    count:3 }, { stall:'souvenir', count:3 }] },
                { budget: 240, stalls: [{ stall:'snack',    count:3 }, { stall:'drink',    count:1 }, { stall:'souvenir', count:1 }] },
                { budget: 260, stalls: [{ stall:'souvenir', count:3 }, { stall:'snack',    count:2 }] },
                { budget: 280, stalls: [{ stall:'snack',    count:2 }, { stall:'drink',    count:2 }, { stall:'souvenir', count:2 }] },
                { budget: 230, stalls: [{ stall:'drink',    count:4 }, { stall:'souvenir', count:2 }] },
            ],
        },
    },
};

// ── 付款面額 ────────────────────────────────────────────────
const B6_BILLS = [
    { value: 1000, label: '千元',   color: '#7c3aed' },
    { value: 500,  label: '五百',   color: '#b45309' },
    { value: 100,  label: '百元',   color: '#1d4ed8' },
    { value: 50,   label: '五十',   color: '#0369a1' },
    { value: 10,   label: '十元',   color: '#047857' },
    { value: 5,    label: '五元',   color: '#b91c1c' },
    { value: 1,    label: '一元',   color: '#374151' },
];

// ── 市場類型動態切換（startGame 時設定）─────────────────────────
let _currentStalls   = B6_STALLS;
let _currentMissions = B6_MISSIONS;

// ── Game 物件 ────────────────────────────────────────────────────
// 金額語音轉換（安全版：若 number-speech-utils.js 未載入則退回原始格式）
const toTWD = v => typeof convertToTraditionalCurrency === 'function' ? convertToTraditionalCurrency(v) : `${v}元`;
// 數量語音：2 讀作「兩」，避免 TTS 唸成「貳」
const toCountSpeech = n => n === 2 ? '兩' : String(n);
const b6IconHTML = item => {
    if (item.imageUrl) {
        const esc = (item.icon || '🛒').replace(/'/g, "\\'");
        return `<img src="${item.imageUrl}" alt="${item.name}" draggable="false" class="b6-icon-img" onerror="this.outerHTML='${esc}'">`;
    }
    return item.icon || '🛒';
};

let Game;

document.addEventListener('DOMContentLoaded', () => {
    Game = {

        // ── 1. Debug ──────────────────────────────────────────
        Debug: {
            FLAGS: { all: false, init: false, speech: false, question: false, payment: false, error: true },
            log(cat, ...a)  { if (this.FLAGS.all || this.FLAGS[cat]) console.log(`[B6-${cat}]`, ...a); },
            warn(cat, ...a) { if (this.FLAGS.all || this.FLAGS[cat]) console.warn(`[B6-${cat}]`, ...a); },
            error(...a)     { console.error('[B6-ERROR]', ...a); },
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
            settings: { difficulty: null, rounds: null, clickMode: 'off', marketType: null, customItemsEnabled: false, magicItems: [] },
            game: {
                currentRound: 0,
                totalRounds: 5,
                correctCount: 0,
                streak: 0,
                missions: [],
                startTime: null,
                // current round state
                mission: null,
                collectedIds: new Set(),  // Set<itemId> 快速查詢
                selectedItems: [],        // [{stall, id}] 玩家自由選擇的商品
                activeStall: Object.keys(_currentStalls)[0],
                phase: 'shopping', // 'shopping' | 'payment' | 'change'
                paidAmount: 0,
                receipts: [],
                stallStats: {},   // { stallKey: totalSpent }
                exactPayments: 0, // 精準付款次數
            },
            isEndingGame: false,
            isProcessing: false,
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
            if (document.getElementById('b6-global-animations')) return;
            const style = document.createElement('style');
            style.id = 'b6-global-animations';
            style.textContent = `
                @keyframes b6Collect {
                    0%   { transform: scale(1); }
                    40%  { transform: scale(1.15); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        },

        resetGameState() {
            const g = this.state.game;
            g.currentRound = 0;
            g.totalRounds  = this.state.settings.rounds;
            g.correctCount = 0;
            g.streak       = 0;
            g.missions     = [];
            g.startTime    = null;
            g.mission      = null;
            g.collectedIds = new Set();
            g.selectedItems = [];
            g.activeStall  = 'vegetable';
            g.phase        = 'shopping';
            g.paidAmount   = 0;
            g.receipts     = [];
            g.stallStats     = {};
            g.exactPayments  = 0;
            this.state.isEndingGame = false;
            this.state.isProcessing  = false;
            Game.Debug.log('init', '🔄 [B6] 遊戲狀態已重置');
        },

        // ── 7. 設定頁 ─────────────────────────────────────────
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
                        <h1>單元B6：菜市場買菜</h1>
                    </div>
                    <div class="game-settings">
                        <div class="b-setting-group">
                            <label style="font-size:13px;color:#6b7280;text-align:left;display:block;">
                                ✨ 依照購物清單在市場各攤位買菜，然後付款找零
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
                        <div class="b-setting-group" id="b6-custom-items-wrap" style="display:none;">
                            <div id="b6-custom-items-toggle-row">
                                <label style="font-size:13px;color:#374151;font-weight:600;">✨ 魔法商品</label>
                                <div class="b-btn-group" id="b6-custom-items-group" style="margin-top:4px;">
                                    <button class="b-sel-btn active" data-custom="off">關閉</button>
                                    <button class="b-sel-btn" data-custom="on">開啟</button>
                                </div>
                                <div style="margin-top:4px;font-size:12px;color:#6b7280;">開啟後可新增自訂商品，普通/困難模式有效，每攤位限 1 項（蔬菜攤／水果攤／雜貨攤），共最多 3 項・每件上限 500 元。</div>
                            </div>
                            ${this._renderMagicItemsPanel()}
                        </div>
                        <div class="b-setting-group" id="assist-click-group" style="display:none;">
                            <label class="b-setting-label">🤖 輔助點擊：</label>
                            <div class="b-btn-group" id="assist-group">
                                <button class="b-sel-btn${this.state.settings.clickMode === 'on' ? ' active' : ''}" data-assist="on">✓ 啟用</button>
                                <button class="b-sel-btn${this.state.settings.clickMode !== 'on' ? ' active' : ''}" data-assist="off">✗ 停用</button>
                            </div>
                            <div style="margin-top:4px;font-size:12px;color:#6b7280;">
                                啟用後，只要偵測到點擊便會自動執行下一個步驟
                            </div>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">🏪 市場類型：</label>
                            <div class="b-btn-group" id="market-group">
                                <button class="b-sel-btn" data-market="random">隨機 🎲</button>
                                <button class="b-sel-btn" data-market="traditional">🏪 傳統市場</button>
                                <button class="b-sel-btn" data-market="supermarket">🛒 超市</button>
                                <button class="b-sel-btn" data-market="nightmarket">🏮 夜市</button>
                            </div>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">🔢 題數：</label>
                            <div class="b-btn-group" id="rounds-group">
                                <button class="b-sel-btn" data-val="1">1題</button>
                                <button class="b-sel-btn" data-val="3">3題</button>
                                <button class="b-sel-btn" data-val="5">5題</button>
                                <button class="b-sel-btn" data-val="10">10題</button>
                                <button class="b-sel-btn" id="b6-custom-rounds-btn">自訂</button>
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
            easy:   '簡單：購買 1–3 樣商品，1–2 個攤位，預算 60–100 元，有購物提示引導',
            normal: '普通：購買 2–4 樣商品，1–3 個攤位，預算 110–180 元，答錯 3 次自動提示',
            hard:   '困難：購買 4–6 樣商品，2–3 個攤位，預算 180–260 元，自由選購無引導',
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
                    const assistGroup  = document.getElementById('assist-click-group');
                    const customWrap   = document.getElementById('b6-custom-items-wrap');
                    if (assistGroup) {
                        if (btn.dataset.val === 'easy') {
                            assistGroup.style.display = '';
                            if (customWrap) customWrap.style.display = 'none';
                            this.state.settings.customItemsEnabled = false;
                            document.querySelectorAll('#b6-custom-items-group [data-custom]').forEach(b => b.classList.toggle('active', b.dataset.custom === 'off'));
                            const panel = document.getElementById('b6-magic-panel');
                            if (panel) panel.style.display = 'none';
                        } else {
                            assistGroup.style.display = 'none';
                            this.state.settings.clickMode = 'off';
                            if (customWrap) customWrap.style.display = '';
                        }
                    }
                    this._checkCanStart();
                }, {}, 'settings');
            });

            document.querySelectorAll('#rounds-group .b-sel-btn:not(#b6-custom-rounds-btn)').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#rounds-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.rounds = parseInt(btn.dataset.val);
                    this._checkCanStart();
                }, {}, 'settings');
            });

            const b6CustomRoundsBtn = document.getElementById('b6-custom-rounds-btn');
            if (b6CustomRoundsBtn) {
                Game.EventManager.on(b6CustomRoundsBtn, 'click', () => {
                    this._showSettingsCountNumpad('題數', (n) => {
                        document.querySelectorAll('#rounds-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                        b6CustomRoundsBtn.classList.add('active');
                        b6CustomRoundsBtn.textContent = `${n}題`;
                        this.state.settings.rounds = n;
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

            // 作業單
            Game.EventManager.on(document.getElementById('settings-worksheet-link'), 'click', (e) => {
                e.preventDefault();
                const params = new URLSearchParams({ unit: 'b6' });
                window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
            }, {}, 'settings');

            document.querySelectorAll('#market-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#market-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.marketType = btn.dataset.market;
                    // 市場類型改變時清空魔法商品（攤位鍵不同），重建攤位按鈕
                    this.state.settings.magicItems = [];
                    const panel = document.getElementById('b6-magic-panel');
                    if (panel && this.state.settings.customItemsEnabled) {
                        panel.outerHTML = this._renderMagicItemsPanel();
                        this._bindMagicItemsPanel();
                    }
                    this._checkCanStart();
                }, {}, 'settings');
            });

            document.querySelectorAll('#b6-custom-items-group [data-custom]').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#b6-custom-items-group [data-custom]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.customItemsEnabled = btn.dataset.custom === 'on';
                    const panel = document.getElementById('b6-magic-panel');
                    if (panel) {
                        panel.style.display = this.state.settings.customItemsEnabled ? '' : 'none';
                        if (this.state.settings.customItemsEnabled) this._bindMagicItemsPanel();
                    }
                }, {}, 'settings');
            });
            if (this.state.settings.customItemsEnabled) {
                const panel = document.getElementById('b6-magic-panel');
                if (panel) { panel.style.display = ''; this._bindMagicItemsPanel(); }
            }

            document.querySelectorAll('#assist-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#assist-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.clickMode = btn.dataset.assist;
                    this._checkCanStart();
                }, {}, 'settings');
            });

            Game.EventManager.on(document.getElementById('start-btn'), 'click', () => this.startGame(), {}, 'settings');
        },

        _checkCanStart() {
            const btn = document.getElementById('start-btn');
            const s = this.state.settings;
            if (btn) btn.disabled = !s.difficulty || !s.rounds || !s.marketType;
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

        // ── 8. 遊戲開始 ───────────────────────────────────────
        startGame() {
            Game.EventManager.removeByCategory('settings');
            Game.TimerManager.clearAll();

            // 設定當前市場類型（隨機模式：在 _pickMissions 逐關隨機）
            const mktKey = this.state.settings.marketType;
            if (mktKey === 'random') {
                // 隨機模式延遲到 _pickMissions 時再決定；先用傳統市場作預設
                _currentStalls   = B6_MARKETS.traditional.stalls;
                _currentMissions = B6_MARKETS.traditional.missions;
            } else {
                const mkt = B6_MARKETS[mktKey] || B6_MARKETS.traditional;
                _currentStalls   = mkt.stalls;
                _currentMissions = mkt.missions;
            }

            const s = this.state.settings;
            const g = this.state.game;
            g.currentRound = 0;
            g.totalRounds  = s.rounds;
            g.correctCount = 0;
            g.streak       = 0;
            g.startTime    = Date.now();
            g.missions     = this._pickMissions(s.rounds, s.difficulty);
            g.receipts     = [];
            g.stallStats   = {};
            g.exactPayments = 0;

            this.state.isEndingGame = false;
            this.state.isProcessing  = false;

            // 清除 showResults() 殘留的 overflow/height 行內樣式，防止閃爍
            const appEl = document.getElementById('app');
            if (appEl) {
                appEl.style.overflow = '';
                appEl.style.height   = '';
                appEl.style.minHeight = '';
            }
            document.body.style.overflow = '';

            this.showWelcomeScreen();
        },

        // ── 歡迎畫面（A2 pattern：2頁式，設定完成後先顯示再進遊戲）──────
        showWelcomeScreen() {
            const app = document.getElementById('app');
            const g   = this.state.game;
            const s   = this.state.settings;

            // 取得第一關任務及對應市場資料
            const mission = g.missions[0];
            const mktKey  = (mission && mission._mktKey) || s.marketType;
            const mkt     = (mktKey !== 'random' ? B6_MARKETS[mktKey] : null) || B6_MARKETS.traditional;

            // 確保 _currentStalls 已指向本關攤位
            if (mission && mission._mktKey && B6_MARKETS[mission._mktKey]) {
                _currentStalls = B6_MARKETS[mission._mktKey].stalls;
            }

            let currentPage = 1;

            const renderPage = (page) => {
                if (page === 1) {
                    // ── 第1頁：市場歡迎 ──────────────────────────────────
                    const _b6MktImgMap = {
                        traditional: '../images/b4/icon-b4-store-traditional-market.png',
                        supermarket:  '../images/b4/icon-b4-store-supermarket.png',
                        nightmarket:  '../images/b4/icon-b4-store-nightmarket.png',
                    };
                    const _b6MktImgSrc = _b6MktImgMap[mktKey] || _b6MktImgMap.traditional;

                    app.innerHTML = `
                        <style>
                            .b6-wc-container {
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                                padding: 20px;
                            }
                            .b6-wc-box {
                                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                                border: 3px solid #86efac;
                                border-radius: 24px;
                                padding: 50px 60px;
                                text-align: center;
                                max-width: 580px;
                                width: 100%;
                            }
                            .b6-wc-icon { font-size: 80px; margin-bottom: 16px; line-height: 1; }
                            .b6-wc-title {
                                font-size: 32px;
                                font-weight: 700;
                                color: #065f46;
                                margin-bottom: 20px;
                            }
                            .b6-wc-unit-img {
                                width: min(480px, 72vw);
                                height: min(480px, 72vw);
                                object-fit: contain;
                                border-radius: 16px;
                            }
                            .b6-wc-unit-emoji-fallback {
                                display: none;
                                font-size: 100px;
                                line-height: 1;
                            }
                        </style>
                        <div class="b6-wc-container">
                            <div class="b6-wc-box">
                                <h1 class="b6-wc-title">歡迎來到${mkt.name}！</h1>
                                <img src="${_b6MktImgSrc}" alt="${mkt.name}"
                                     class="b6-wc-unit-img"
                                     onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
                                <div class="b6-wc-unit-emoji-fallback">${mkt.icon}</div>
                            </div>
                        </div>`;

                    Game.Speech.speak(`歡迎來到${mkt.name}！`, () => {
                        Game.TimerManager.setTimeout(() => {
                            currentPage = 2;
                            renderPage(2);
                        }, 500, 'screenTransition');
                    });

                } else if (page === 2) {
                    // ── 第2頁：預算顯示 + 採購任務 ──────────────────────
                    const denomMap = {
                        easy:   [100, 50, 10, 5, 1],
                        normal: [500, 100, 50, 10, 5, 1],
                        hard:   [1000, 500, 100, 50, 10, 5, 1]
                    };
                    const denoms    = denomMap[s.difficulty] || denomMap.easy;
                    const budgetCoins = [];
                    let rem = mission.budget;
                    for (const d of denoms) { while (rem >= d) { budgetCoins.push(d); rem -= d; } }

                    const budgetIconsHtml = budgetCoins.map(d => {
                        const isBill = d >= 100;
                        const face   = Math.random() < 0.5 ? 'back' : 'front';
                        return `<img src="../images/money/${d}_yuan_${face}.png" alt="${d}元"
                            style="width:${isBill ? '72px' : '44px'};height:${isBill ? 'auto' : '44px'};object-fit:contain;"
                            onerror="this.style.display='none'">`;
                    }).join('');

                    const stallsHTML = (mission.stalls || []).map(({ stall, count }) => {
                        const stallInfo = _currentStalls[stall];
                        if (!stallInfo) return '';
                        return `<div class="b6-wc2-stall">${stallInfo.icon} ${stallInfo.name} <strong>× ${count}</strong> 樣</div>`;
                    }).filter(Boolean).join('');
                    const stallsSpeech = (mission.stalls || []).map(({ stall, count }) => {
                        const stallInfo = _currentStalls[stall];
                        return stallInfo ? `${stallInfo.name}買${toCountSpeech(count)}樣` : '';
                    }).filter(Boolean).join('，');

                    app.innerHTML = `
                        <style>
                            .b6-wc-container {
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                                padding: 20px;
                            }
                            .b6-wc2-box {
                                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                                border: 3px solid #86efac;
                                border-radius: 24px;
                                padding: 40px 50px;
                                text-align: center;
                                max-width: 600px;
                                width: 100%;
                            }
                            .b6-wc2-label {
                                font-size: 22px;
                                font-weight: 600;
                                color: #065f46;
                                margin-bottom: 6px;
                            }
                            .b6-wc2-budget {
                                font-size: 44px;
                                font-weight: 800;
                                color: #d97706;
                                margin-bottom: 16px;
                            }
                            .b6-wc2-icons {
                                display: flex;
                                flex-wrap: wrap;
                                justify-content: center;
                                gap: 6px;
                                margin-bottom: 24px;
                            }
                            .b6-wc2-divider {
                                border: none;
                                border-top: 2px dashed #86efac;
                                margin: 0 0 20px;
                            }
                            .b6-wc2-stalls-label {
                                font-size: 18px;
                                font-weight: 600;
                                color: #065f46;
                                margin-bottom: 12px;
                            }
                            .b6-wc2-stalls {
                                display: flex;
                                flex-wrap: wrap;
                                justify-content: center;
                                gap: 10px;
                                margin-bottom: 28px;
                            }
                            .b6-wc2-stall {
                                background: rgba(255,255,255,0.7);
                                border: 2px solid #86efac;
                                border-radius: 12px;
                                padding: 8px 18px;
                                font-size: 17px;
                                color: #065f46;
                            }
                            .b6-wc2-start-btn {
                                background: linear-gradient(135deg, #10b981, #059669);
                                color: #fff;
                                border: none;
                                border-radius: 16px;
                                padding: 14px 40px;
                                font-size: 20px;
                                font-weight: 700;
                                cursor: pointer;
                                box-shadow: 0 4px 12px rgba(16,185,129,0.4);
                                transition: transform 0.15s, box-shadow 0.15s;
                            }
                            .b6-wc2-start-btn:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 6px 18px rgba(16,185,129,0.5);
                            }
                        </style>
                        <div class="b6-wc-container">
                            <div class="b6-wc2-box">
                                <div class="b6-wc2-label">💰 今日預算</div>
                                <div class="b6-wc2-budget">${mission.budget} 元</div>
                                <div class="b6-wc2-icons">${budgetIconsHtml}</div>
                                <hr class="b6-wc2-divider">
                                <div class="b6-wc2-stalls-label">🛒 採購任務</div>
                                <div class="b6-wc2-stalls">${stallsHTML}</div>
                                <button class="b6-wc2-start-btn" id="b6-wc2-start-btn">開始購物 🛍️</button>
                            </div>
                        </div>`;

                    // 播放完整語音：今日預算XX元，攤位需求
                    Game.Speech.speak(`今日預算${mission.budget}元，${stallsSpeech}`);

                    // 綁定「開始購物」按鈕：點擊後播語音再進入遊戲（disabled 防止重複點擊）
                    const startBtn = document.getElementById('b6-wc2-start-btn');
                    if (startBtn) {
                        Game.EventManager.on(startBtn, 'click', () => {
                            if (startBtn.disabled) return;
                            startBtn.disabled = true;
                            window.speechSynthesis.cancel();
                            Game.Speech.speak('開始購物', () => {
                                g._skipIntroModal = true;
                                this.renderRound();
                            });
                        }, {}, 'welcome');
                    }

                    // 輔助點擊模式：page2 已有按鈕才啟動 overlay
                    if (s.clickMode === 'on') {
                        Game.TimerManager.setTimeout(() => AssistClick.activate(), 400, 'ui');
                    }
                }
            };

            renderPage(1);
        },

        _pickMissions(count, diff) {
            const mktKey  = this.state.settings.marketType;
            const mktKeys = ['traditional', 'supermarket', 'nightmarket'];
            if (mktKey === 'random') {
                const result = [];
                for (let i = 0; i < count; i++) {
                    const rKey = mktKeys[Math.floor(Math.random() * mktKeys.length)];
                    const pool = B6_MARKETS[rKey].missions[diff].slice().sort(() => Math.random() - 0.5);
                    result.push({ ...pool[0], _mktKey: rKey });
                }
                return result;
            }
            const pool = _currentMissions[diff].slice().sort(() => Math.random() - 0.5);
            const result = [];
            for (let i = 0; i < count; i++) {
                result.push(pool[i % pool.length]);
            }
            return result;
        },

        // ── 9. 關卡初始化 ─────────────────────────────────────
        renderRound() {
            Game.TimerManager.clearAll();
            window.speechSynthesis.cancel();
            Game.EventManager.removeByCategory('gameUI');
            this.state.isProcessing = false;
            AssistClick.deactivate();

            const g       = this.state.game;
            g.mission     = g.missions[g.currentRound];
            // 隨機模式：依本關 _mktKey 切換攤位資料
            if (g.mission._mktKey && B6_MARKETS[g.mission._mktKey]) {
                _currentStalls = B6_MARKETS[g.mission._mktKey].stalls;
            }
            g.collectedIds  = new Set();
            g.selectedItems = [];          // [{stall, id}] 本關自由選擇的商品
            g.activeStall = Object.keys(_currentStalls)[0];
            g.phase       = 'shopping';
            g.paidAmount  = 0;
            // 注入魔法商品到對應攤位（普通/困難模式）
            const _diff = this.state.settings.difficulty;
            if (_diff !== 'easy') {
                const magic = this.state.settings.magicItems || [];
                if (magic.length > 0) {
                    _currentStalls = JSON.parse(JSON.stringify(_currentStalls));
                    magic.forEach(mi => {
                        if (_currentStalls[mi.stallKey]) {
                            _currentStalls[mi.stallKey].items.push({ ...mi });
                        }
                    });
                }
            }
            g.p1HintMode   = false;  // 提示模式旗標
            g.p1HintItems  = [];     // [{stall, id}] 提示建議商品
            g.p1ErrorCount = 0;      // 普通模式錯誤計數（3次自動提示）
            // Phase 2 狀態重置（防止中途返回設定再重來時殘留上一關狀態）
            g.p2Wallet      = [];
            g.p2UidCtr      = 0;
            g.p2ErrorCount  = 0;
            g.p2ShowHint    = false;
            g.p2HintSlots   = [];
            g.changeErrorCount = 0;
            g.changePlaced     = [];
            g.changeGhostMode  = false;
            g.changeHintSlots  = [];

            this._renderShoppingUI();
            if (g._skipIntroModal) {
                // 從歡迎畫面進入，略過彈窗，直接觸發後續邏輯
                g._skipIntroModal = false;
                if (this.state.settings.difficulty === 'easy') {
                    this._b6P1ActivateHintMode();
                }
            } else {
                this._showMissionIntroModal(g.mission, g.currentRound + 1, () => {
                    Game.Speech.speak('開始購物');
                    if (this.state.settings.difficulty === 'easy') {
                        this._b6P1ActivateHintMode();
                    }
                });
            }

            if (this.state.settings.clickMode === 'on') {
                Game.TimerManager.setTimeout(() => AssistClick.activate(), 400, 'ui');
            }
        },

        // ── 關卡開場任務說明彈窗（B1 _showTaskModal afterClose pattern）──
        _showMissionIntroModal(mission, roundNum, afterClose) {
            const existing = document.getElementById('b6-mission-intro');
            if (existing) existing.remove();

            // 從 mission.stalls 建立攤位需求 HTML 與語音文字
            const stallsHTML = (mission.stalls || []).map(({ stall, count }) => {
                const stallInfo = _currentStalls[stall];
                if (!stallInfo) return '';
                return `<span class="b6-mi-item">${stallInfo.icon} ${stallInfo.name} <strong>× ${count}</strong> 樣</span>`;
            }).filter(Boolean).join('');
            const stallsText = (mission.stalls || []).map(({ stall, count }) => {
                const stallInfo = _currentStalls[stall];
                return stallInfo ? `${stallInfo.name}買${toCountSpeech(count)}樣` : '';
            }).filter(Boolean).join('，');

            const mktKey = mission._mktKey || this.state.settings.marketType;
            const mkt = B6_MARKETS[mktKey] || B6_MARKETS.traditional;
            const mktLabel = `${mkt.icon} ${mkt.name}`;
            const isFirstRound = roundNum === 1;
            const roundTitle = mktLabel;

            // ── 預算金錢圖示：貪婪分解 + 隨機正反面 ──
            const _miDenomMap = {
                easy:   [100, 50, 10, 5, 1],
                normal: [500, 100, 50, 10, 5, 1],
                hard:   [1000, 500, 100, 50, 10, 5, 1]
            };
            const _miDiff = this.state.settings.difficulty;
            const _miAllDenoms = _miDenomMap[_miDiff] || _miDenomMap.easy;
            // 為所有面額生成正反面（ghost slot 一致性）
            const _miBudgetFaces = {};
            _miAllDenoms.forEach(d => { _miBudgetFaces[d] = Math.random() < 0.5 ? 'back' : 'front'; });
            // 貪婪分解預算
            const _miBudgetCoins = [];
            let _miRem = mission.budget;
            for (const d of _miAllDenoms) { while (_miRem >= d) { _miBudgetCoins.push(d); _miRem -= d; } }
            // 存至 game state 供第二頁拖曳盤使用
            this.state.game.p2BudgetFaces = _miBudgetFaces;
            this.state.game.p2BudgetCoins = _miBudgetCoins;
            // 產生圖示 HTML（尺寸同拖曳盤）
            const _miBudgetIconsHtml = _miBudgetCoins.map(d => {
                const isBill = d >= 100;
                const w = isBill ? '72px' : '44px';
                return `<img src="../images/money/${d}_yuan_${_miBudgetFaces[d]}.png" alt="${d}元"
                    style="width:${w};height:${isBill ? 'auto' : w};object-fit:contain;"
                    onerror="this.style.display='none'">`;
            }).join('');

            const modal = document.createElement('div');
            modal.id = 'b6-mission-intro';
            modal.className = 'b6-mission-intro';
            modal.innerHTML = `
                <div class="b6-mi-card">
                    <button class="b6-mi-close-btn" id="b6-mi-close-btn">✕</button>
                    <div class="b6-mi-round">${roundTitle}</div>
                    <div class="b6-mi-title">🛒 今天的採購任務</div>
                    <div class="b6-mi-items">${stallsHTML}</div>
                    <div class="b6-mi-budget">預算：<b>${mission.budget}</b> 元</div>
                    <div class="b6-mi-budget-icons">${_miBudgetIconsHtml}</div>
                    <div class="b6-mi-hint" style="font-size:12px;color:#6b7280;margin-top:4px;">在預算內，從指定攤位各選指定數量的商品</div>
                    <button class="b6-mi-dismiss-btn" id="b6-mi-dismiss-btn">關閉</button>
                </div>`;
            document.body.appendChild(modal);
            const welcomePrefix = isFirstRound ? `歡迎來到${mkt.name}！` : '';
            let closed = false;
            const dismiss = () => {
                if (closed) return;
                closed = true;
                window.speechSynthesis.cancel();
                if (modal.parentNode) {
                    modal.classList.add('b6-mi-fade');
                    Game.TimerManager.setTimeout(() => {
                        if (modal.parentNode) modal.remove();
                        afterClose?.();
                    }, 350, 'ui');
                }
            };

            // 播放一段語音（攤位+預算），播完後彈窗保持開啟，等待使用者點「關閉」
            Game.Speech.speak(`${welcomePrefix}${stallsText}，預算${mission.budget}元。`);

            // ✕ 關閉按鈕（右上角小圓鈕）
            const closeBtn = document.getElementById('b6-mi-close-btn');
            if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); dismiss(); }, { once: true });
            // 「關閉」文字按鈕（彈窗底部）
            const dismissBtn = document.getElementById('b6-mi-dismiss-btn');
            if (dismissBtn) dismissBtn.addEventListener('click', (e) => { e.stopPropagation(); dismiss(); }, { once: true });
        },

        // ── 簡單模式：攤位需求逐攤朗讀（B1 _speakItemsOneByOne pattern）─
        _speakMissionItemsOneByOne(mission) {
            const reqs = (mission.stalls || []).map(({ stall, count }) => {
                const stallInfo = _currentStalls[stall];
                return stallInfo ? { name: stallInfo.name, count } : null;
            }).filter(Boolean);
            if (!reqs.length) return;
            const totalCount = reqs.reduce((s, r) => s + r.count, 0);
            // 數字 2 在量詞前唸「兩」，避免 TTS 讀成「貳」

            let idx = 0;
            const speakNext = () => {
                if (idx >= reqs.length) {
                    Game.TimerManager.setTimeout(() => {
                        Game.Speech.speak(`共要選${toCountSpeech(totalCount)}樣商品，準備出發！`);
                    }, 300, 'speech');
                    return;
                }
                const req = reqs[idx++];
                Game.Speech.speak(`${req.name}，選${toCountSpeech(req.count)}樣`, () => {
                    Game.TimerManager.setTimeout(speakNext, 80, 'speech');
                });
            };
            speakNext();
        },

        // ── 第一頁提示入口（依難度路由）────────────────────────
        _b6P1ShowHint() {
            window.speechSynthesis.cancel();
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            if (diff === 'hard') {
                // 困難模式：不重置已選商品，直接顯示建議彈窗
                this._b6P1ShowHardHintModal();
                return;
            }
            // 簡單/普通模式：重置已選商品後啟動提示模式
            g.selectedItems = [];
            this._updateShoppingUIPartial();
            this._b6P1ActivateHintMode();
        },

        // ── 預算進度條資訊 ────────────────────────────────────
        _b6BudgetBarInfo(total, budget) {
            const ratio = budget > 0 ? total / budget : 0;
            const pct   = Math.min(Math.round(ratio * 100), 100);
            let label, emoji, color;
            if (total === 0)       { label = '準備購物';       emoji = '🛒'; color = '#10b981'; }
            else if (ratio < 0.25) { label = '還有很多錢';     emoji = '💰'; color = '#10b981'; }
            else if (ratio < 0.5)  { label = '花掉四分之一';   emoji = '🪙'; color = '#22c55e'; }
            else if (ratio < 0.55) { label = '花掉一半';       emoji = '💸'; color = '#f59e0b'; }
            else if (ratio < 0.75) { label = '錢剩下一半';     emoji = '💸'; color = '#f59e0b'; }
            else if (ratio < 0.9)  { label = '錢剩下四分之一'; emoji = '⚠️'; color = '#f97316'; }
            else if (ratio < 1.0)  { label = '錢快花完了';     emoji = '🔴'; color = '#ef4444'; }
            else                   { label = '超出預算了';     emoji = '🚨'; color = '#dc2626'; }
            return { pct, label, emoji, color };
        },

        // ── 貪婪法生成建議購買清單 ───────────────────────────
        _b6P1GenerateHintItems() {
            const g = this.state.game;
            let remaining = g.mission.budget;
            const result = [];
            for (const req of (g.mission.stalls || [])) {
                const stallItems = (_currentStalls[req.stall]?.items || [])
                    .slice()
                    .sort((a, b) => a.price - b.price);
                let picked = 0;
                for (const item of stallItems) {
                    if (picked >= req.count) break;
                    if (item.price <= remaining) {
                        result.push({ stall: req.stall, id: item.id });
                        remaining -= item.price;
                        picked++;
                    }
                }
            }
            return result;
        },

        // ── 更新「點這裡」高亮（當前攤位的提示商品 + 導航按鈕）──
        _b6P1UpdateHintHighlights() {
            const g = this.state.game;
            // 先移除所有既有高亮
            document.querySelectorAll('.b6-product-btn').forEach(btn => {
                btn.classList.remove('b6-product-here-hint');
            });
            document.getElementById('b6-stall-prev')?.classList.remove('b6-product-here-hint');
            document.getElementById('b6-stall-next')?.classList.remove('b6-product-here-hint');
            if (!g.p1HintMode) return;
            // 困難模式：只用彈窗提示，不在商品卡顯示「點這裡」
            if (this.state.settings.difficulty === 'hard') return;

            const diff = this.state.settings.difficulty;
            const hintItems = g.p1HintItems || [];
            // 僅處理當前攤位、且尚未選取的提示商品
            const unselected = hintItems.filter(h =>
                h.stall === g.activeStall &&
                !(g.selectedItems || []).some(si => si.stall === h.stall && si.id === h.id)
            );
            // 簡單/普通模式：每次只高亮一個；困難模式：不高亮
            const toHighlight = diff !== 'hard' ? unselected.slice(0, 1) : unselected;
            toHighlight.forEach(h => {
                const btn = document.querySelector(`.b6-product-btn[data-item-id="${h.id}"]`);
                if (btn) btn.classList.add('b6-product-here-hint');
            });

            // 簡單/普通模式：當前攤位的提示商品都選完，但其他攤位還有未選的提示商品 → 高亮導航按鈕
            if (diff !== 'hard' && toHighlight.length === 0) {
                const remainingInOtherStalls = hintItems.filter(h =>
                    !(g.selectedItems || []).some(si => si.stall === h.stall && si.id === h.id)
                );
                if (remainingInOtherStalls.length > 0) {
                    const _stallKeys = Object.keys(_currentStalls || {});
                    const curIdx = _stallKeys.indexOf(g.activeStall);
                    const nextIdx = _stallKeys.indexOf(remainingInOtherStalls[0].stall);
                    const navBtn = document.getElementById(nextIdx > curIdx ? 'b6-stall-next' : 'b6-stall-prev');
                    if (navBtn && !navBtn.disabled) navBtn.classList.add('b6-product-here-hint');
                }
            }
        },

        // ── 啟動提示模式（生成 + 高亮）─────────────────────────
        _b6P1ActivateHintMode() {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            g.p1HintMode = true;
            if (!g.p1HintItems || g.p1HintItems.length === 0) {
                g.p1HintItems = this._b6P1GenerateHintItems();
            }
            // 簡單模式：自動切換到第一個提示商品所在的攤位並只播攤位名
            if (diff === 'easy' && g.p1HintItems.length > 0) {
                const firstHint = g.p1HintItems.find(h =>
                    !(g.selectedItems || []).some(si => si.stall === h.stall && si.id === h.id)
                );
                if (firstHint) {
                    if (firstHint.stall !== g.activeStall) {
                        g.activeStall = firstHint.stall;
                        this._b6RefreshPanel?.(); // 更新面板 + 提示高亮
                    } else {
                        this._b6P1UpdateHintHighlights();
                    }
                    const stallName = (_currentStalls[firstHint.stall] || {}).name || '';
                    if (stallName) Game.Speech.speak(stallName);
                    return;
                }
            }
            this._b6P1UpdateHintHighlights();
        },

        // ── 困難模式提示彈窗（顯示建議清單，不重置已選、不限制自由選購）──
        _b6P1ShowHardHintModal() {
            const g = this.state.game;
            const newHintItems = this._b6P1GenerateHintItems();
            g.p1HintItems = newHintItems;

            const existing = document.getElementById('b6-p1-hard-hint-overlay');
            if (existing) existing.remove();

            // 按攤位分組（依任務攤位順序）
            const stallOrder = [...new Set(newHintItems.map(h => h.stall))];
            const stallsHTML = stallOrder.map(stall => {
                const stallInfo = _currentStalls[stall];
                if (!stallInfo) return '';
                const items = newHintItems
                    .filter(h => h.stall === stall)
                    .map(h => (stallInfo.items || []).find(i => i.id === h.id))
                    .filter(Boolean);
                if (!items.length) return '';
                const itemsHTML = items.map(item => {
                    const alreadySel = (g.selectedItems || []).some(si => si.stall === stall && si.id === item.id);
                    const speechText = `${stallInfo.name}，${item.name}，${item.price}元`;
                    return `<div class="b6-p1hh-cat-item${alreadySel ? ' b6-p1hh-cat-item-done' : ''}">
                        ${alreadySel ? '<span class="b6-p1hh-cat-check">✓</span>' : ''}
                        <span class="b6-p1hh-cat-img">${b6IconHTML(item)}</span>
                        <div class="b6-p1hh-cat-info">
                            <div class="b6-p1hh-cat-name">${item.name}</div>
                            <div class="b6-p1hh-cat-price">${item.price} 元</div>
                        </div>
                        <button class="b6-p1hh-cat-speak-btn" data-speech="${speechText}" title="播放語音">🔊</button>
                    </div>`;
                }).join('');
                return `<div class="b6-p1hh-cat-section">
                    <div class="b6-p1hh-cat-hdr">
                        <span class="b6-p1hh-cat-hdr-icon">${stallInfo.icon || '🛒'}</span>
                        <span class="b6-p1hh-cat-hdr-name">${stallInfo.name}</span>
                    </div>
                    <div class="b6-p1hh-cat-items">${itemsHTML}</div>
                </div>`;
            }).join('');

            const totalSuggested = newHintItems.reduce((s, h) => {
                const item = (_currentStalls[h.stall]?.items || []).find(i => i.id === h.id);
                return s + (item?.price || 0);
            }, 0);

            const overlay = document.createElement('div');
            overlay.id = 'b6-p1-hard-hint-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:10200;';
            overlay.innerHTML = `
                <div class="b6-p1hh-cat-modal">
                    <div class="b6-p1hh-cat-modal-hdr">
                        <span class="b6-p1hh-cat-modal-icon">🛒</span>
                        <h3 class="b6-p1hh-cat-modal-title">困難模式 — 購物清單</h3>
                        <p class="b6-p1hh-cat-modal-desc">以下是一組符合預算的購買參考方案</p>
                        <div class="b6-p1hh-cat-modal-budget">預算 ${g.mission.budget} 元｜建議合計 <strong>${totalSuggested}</strong> 元</div>
                    </div>
                    <div class="b6-p1hh-cat-modal-body">${stallsHTML}</div>
                    <button class="b6-p1hh-cat-close-btn" id="b6-p1hh-cat-close">我知道了，開始購物！</button>
                </div>`;
            document.body.appendChild(overlay);

            overlay.querySelectorAll('.b6-p1hh-cat-speak-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    Game.Speech.speak(btn.dataset.speech || '');
                });
            });

            const dismiss = () => { window.speechSynthesis.cancel(); overlay.remove(); };
            const closeBtn = document.getElementById('b6-p1hh-cat-close');
            if (closeBtn) closeBtn.addEventListener('click', dismiss, { once: true });
            overlay.addEventListener('click', e => { if (e.target === overlay) dismiss(); });
        },

        // ── 10. 購物畫面 ──────────────────────────────────────
        _renderShoppingUI() {
            const g       = this.state.game;
            const mission = g.mission;
            const total   = this._calcMissionTotal();
            const budget  = mission.budget;
            const budgetOver = total > budget;
            const diff    = this.state.settings.difficulty;

            // 任務卡：顯示每個攤位的選購進度
            const stallReqsHTML = (mission.stalls || []).map(({ stall, count }) => {
                const stallInfo = _currentStalls[stall];
                if (!stallInfo) return '';
                const selected = (g.selectedItems || []).filter(i => i.stall === stall);
                const done = selected.length >= count;
                const active = stall === g.activeStall;
                // 列出已選商品名稱
                const selectedNames = selected.map(si => {
                    const item = stallInfo.items.find(i => i.id === si.id);
                    return item ? `<span class="b6-sr-sel-item">${b6IconHTML(item)} ${item.name}</span>` : '';
                }).join('');
                return `
                <div class="b6-stall-req${done ? ' done' : ''}${active ? ' active' : ''}" data-req-stall="${stall}">
                    <span class="b6-sr-icon">${stallInfo.icon}</span>
                    <span class="b6-sr-name">${stallInfo.name}</span>
                    <span class="b6-sr-prog">${selected.length}/${count}${done ? ' ✅' : ''}</span>
                    ${selectedNames ? `<div class="b6-sr-items">${selectedNames}</div>` : ''}
                </div>`;
            }).join('');

            const stallKeys = Object.keys(_currentStalls);
            const stallIdx  = stallKeys.indexOf(g.activeStall);
            const isFirst   = stallIdx <= 0;
            const isLast    = stallIdx >= stallKeys.length - 1;

            // 攤位點狀進度指示
            const stallDotsHTML = stallKeys.map((k) => {
                const req = (mission.stalls || []).find(r => r.stall === k);
                const hasReq = !!req;
                const selCount = (g.selectedItems || []).filter(i => i.stall === k).length;
                const done = hasReq && selCount >= req.count;
                const active = k === g.activeStall;
                return `<span class="b6-snav-dot${active ? ' active' : ''}${done ? ' done' : ''}${hasReq && !done ? ' has-items' : ''}" title="${_currentStalls[k].name}"></span>`;
            }).join('');

            // 商品網格：已選商品可點選取消；超出預算的商品標示警告
            const activeStallReq = (mission.stalls || []).find(r => r.stall === g.activeStall);
            const activeQuota = activeStallReq ? activeStallReq.count : 0;
            const activeSelCount = (g.selectedItems || []).filter(i => i.stall === g.activeStall).length;
            const stallQuotaFull = activeSelCount >= activeQuota;

            const stallItems = _currentStalls[g.activeStall].items;
            const productsHTML = stallItems.map(item => {
                const isSelected = (g.selectedItems || []).some(si => si.stall === g.activeStall && si.id === item.id);
                const wouldExceed = !isSelected && (total + item.price) > budget;
                const isQuotaFull = !isSelected && stallQuotaFull;
                let extraClass = '';
                if (isSelected)     extraClass = 'selected';
                else if (wouldExceed) extraClass = 'over-budget';
                else if (isQuotaFull) extraClass = 'quota-full';
                return `
                <button class="b6-product-btn${extraClass ? ' ' + extraClass : ''}"
                        data-item-id="${item.id}" data-stall="${g.activeStall}" data-price="${item.price}">
                    <span class="b6-product-icon">${b6IconHTML(item)}</span>
                    <span class="b6-product-name">${item.name}</span>
                    <span class="b6-product-price">${item.price} 元</span>
                    <span class="b6-product-unit">/ ${item.unit}</span>
                    ${isSelected ? '<span class="b6-product-collected-mark">✅</span>' : ''}
                    ${wouldExceed ? '<span class="b6-product-over-mark">💸</span>' : ''}
                </button>`;
            }).join('');

            const missionDone = this._isMissionComplete();
            const totalRequired = this._getTotalRequired();
            const selectedCount = (g.selectedItems || []).length;
            const mktKey = this.state.settings.marketType;
            const mktInfo = mktKey === 'random' ? { icon: '🎲', name: '隨機市場' } : (B6_MARKETS[mktKey] || { icon: '🛒', name: '菜市場' });

            // 已選商品清單（右側結帳卡）
            const selectedItemsHTML = (g.selectedItems || []).length > 0
                ? (g.selectedItems || []).map(({ stall, id }) => {
                    const item = (_currentStalls[stall]?.items || []).find(i => i.id === id);
                    if (!item) return '';
                    return `<div class="b6-cart-item">
                        <span class="b6-ci-icon">${b6IconHTML(item)}</span>
                        <span class="b6-ci-name">${item.name}</span>
                        <span class="b6-ci-price">${item.price} 元</span>
                    </div>`;
                }).join('')
                : `<div class="b6-cart-empty">尚未選購商品</div>`;

            const app = document.getElementById('app');
            app.style.opacity = '0';
            app.innerHTML = `
            <div class="b-header">
                <div class="b-header-left">
                    <span class="b-header-unit">${mktInfo.icon} ${mktInfo.name}</span>
                </div>
                <div class="b-header-center">步驟一：採購商品</div>
                <div class="b-header-right">
                    <span class="b-progress">第 ${g.currentRound + 1} 關 / 共 ${g.totalRounds} 關</span>
                    <button class="b-reward-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                    <button class="b-back-btn" onclick="Game.showSettings()">返回設定</button>
                </div>
            </div>
            <div class="game-container">

                <!-- 任務卡（標題 + 預算） -->
                <div class="b6-task-card">
                    <div class="b6-task-hdr">
                        <div class="b6-task-hdr-left">
                            <div class="b6-task-hdr-text">
                                <div class="b6-task-title">📋 今天的採購任務<button class="b6-replay-btn" id="replay-speech-btn" title="重播語音">🔊</button></div>
                                <div class="b6-task-budget">預算 <strong class="${budgetOver ? 'b6-budget-over' : ''}">${budget} 元</strong>${budgetOver ? `<span class="b6-budget-warning"> ⚠️ 超出！</span>` : ''}</div>
                            </div>
                        </div>
                        <div class="b6-task-hdr-right">
                            <img src="../images/common/hint_detective.png" class="b6-task-mascot" onerror="this.style.display='none'" alt="">
                            <button class="b6-p1-hint-btn" id="b6-p1-hint-btn">💡 提示</button>
                        </div>
                    </div>
                    ${this._renderB6StallChecklist(g)}
                    ${diff !== 'hard' ? (() => {
                        const { pct, label, emoji, color } = this._b6BudgetBarInfo(total, budget);
                        return `<div class="b6-budget-bar-wrap" id="b6-budget-bar-wrap">
                            <div class="b6-budget-bar-track">
                                <div class="b6-budget-bar-fill" id="b6-budget-bar-fill" style="width:${pct}%;background-color:${color};"></div>
                            </div>
                            <div class="b6-budget-bar-label" id="b6-budget-bar-label">${emoji} ${label}</div>
                        </div>`;
                    })() : ''}
                </div>

                <!-- 三欄容器：左（攤位進度卡）+ 中（市場卡）+ 右（結帳卡）-->
                <div class="b6-market-checkout-row">

                    <!-- 左側：攤位進度卡 -->
                    <div class="b6-stall-card">
                        <div class="b6-sc-header">🗒️ 採購進度</div>
                        <div class="b6-task-stall-reqs">
                            ${stallReqsHTML}
                        </div>
                    </div>

                    <!-- 中間：市場卡（左右按鈕切換攤位） -->
                    <div class="b6-market-card">
                        <div class="b6-stall-nav">
                            <button class="b6-snav-btn" id="b6-stall-prev" ${isFirst ? 'disabled' : ''}>◀</button>
                            <div class="b6-snav-center">
                                <div class="b6-snav-label">${_currentStalls[g.activeStall].icon} ${_currentStalls[g.activeStall].name}${activeQuota > 0 ? `<span class="b6-snav-quota"> (${activeSelCount}/${activeQuota})</span>` : ''}</div>
                                <div class="b6-snav-dots">${stallDotsHTML}</div>
                            </div>
                            <button class="b6-snav-btn" id="b6-stall-next" ${isLast ? 'disabled' : ''}>▶</button>
                        </div>
                        <div class="b6-stall-panel">
                            <div class="b6-products-grid">${productsHTML}</div>
                        </div>
                    </div>

                    <!-- 右側：結帳卡 -->
                    <div class="b6-checkout-strip">
                        <div class="b6-cstrip-row1">
                            <span class="b6-cstrip-count">🛒 <strong>${selectedCount}</strong> / ${totalRequired} 件</span>
                            <span class="b6-cstrip-total${budgetOver ? ' over' : ''}">小計：<span class="b6-basket-total">${total}</span> 元</span>
                        </div>
                        <div class="b6-cart-items" id="b6-cart-items">
                            ${selectedItemsHTML}
                        </div>
                        <button class="b6-checkout-btn" id="b6-checkout-btn" ${missionDone ? '' : 'disabled'}>
                            前往結帳 →
                        </button>
                    </div>

                </div><!-- /.b6-market-checkout-row -->
            </div>`;

            this._bindShoppingEvents();

            // 淡入消除閃爍
            requestAnimationFrame(() => {
                app.style.transition = 'opacity 0.18s ease';
                app.style.opacity    = '1';
                Game.TimerManager.setTimeout(() => {
                    app.style.transition = '';
                    app.style.opacity    = '';
                }, 200, 'ui');
            });
        },

        _renderB6StallChecklist(g) {
            const diff   = this.state.settings.difficulty;
            const stalls = g.mission?.stalls || [];
            if (!stalls.length) return '';
            if (diff === 'hard') {
                const total    = stalls.reduce((s, r) => s + r.count, 0);
                const selCount = (g.selectedItems || []).length;
                return `<div class="b6-sc-hard-summary">共需 ${total} 樣商品｜已選 <span id="b6-sc-sel-count">${selCount}</span> / ${total}</div>`;
            }
            return `<div class="b6-stall-checklist" id="b6-stall-checklist">
                ${stalls.map(({ stall, count }) => {
                    const stallInfo = _currentStalls[stall];
                    if (!stallInfo) return '';
                    const selCount = (g.selectedItems || []).filter(i => i.stall === stall).length;
                    const done = selCount >= count;
                    return `<div class="b6-scc-card${done ? ' done' : ''}" data-scc-stall="${stall}">
                        ${done ? '<span class="b6-scc-check">✅</span>' : ''}
                        <span class="b6-scc-icon">${stallInfo.icon}</span>
                        <span class="b6-scc-name">${stallInfo.name}</span>
                        <span class="b6-scc-req">買 ${count} 樣</span>
                        <span class="b6-scc-prog">${selCount}/${count}</span>
                    </div>`;
                }).join('')}
            </div>`;
        },

        _b6MagicMinBudget(mktKey) {
            const mkt = mktKey ? B6_MARKETS[mktKey] : null;
            if (!mkt) return 9999;
            const budgets = [
                ...(mkt.missions.normal || []),
                ...(mkt.missions.hard   || []),
            ].map(m => m.budget);
            return budgets.length ? Math.min(...budgets) : 9999;
        },

        _renderMagicItemsPanel() {
            const s       = this.state.settings;
            const items   = s.magicItems || [];
            const mktKey  = s.marketType && s.marketType !== 'random' ? s.marketType : null;
            const stalls  = mktKey ? B6_MARKETS[mktKey]?.stalls : null;
            const minBudget = mktKey ? this._b6MagicMinBudget(mktKey) : null;

            const listHTML = items.map((mi, idx) => {
                const stallInfo = stalls?.[mi.stallKey];
                return `
                <div class="b6-mp-item-row" data-mp-idx="${idx}">
                    <span class="b6-mp-item-icon">${b6IconHTML(mi)}</span>
                    <span class="b6-mp-item-stall">${stallInfo?.icon || '✨'}</span>
                    <span class="b6-mp-item-name">${mi.name}</span>
                    <button class="b6-mp-item-price" data-mp-price-idx="${idx}">${mi.price}元</button>
                    <button class="b6-mp-del-btn" data-mp-del="${idx}">✕</button>
                </div>`;
            }).join('');

            const stallBtnsHTML = stalls
                ? Object.entries(stalls).map(([key, info], i) =>
                    `<button class="b6-mp-stall-btn${i === 0 ? ' active' : ''}" data-mp-stall="${key}">${info.icon} ${info.name}</button>`
                  ).join('')
                : '';

            return `
            <div id="b6-magic-panel" style="display:${s.customItemsEnabled ? '' : 'none'};margin-top:10px;">
                <div id="b6-mp-list">${listHTML}</div>
                ${stalls ? `
                <div class="b6-mp-add-box">
                    <div class="b6-mp-row" id="b6-mp-stall-row">
                        <span class="b6-mp-label">攤位：</span>
                        ${stallBtnsHTML}
                    </div>
                    <div class="b6-mp-row">
                        <input type="file" id="b6-mp-file" accept="image/*" style="display:none">
                        <button class="b6-mp-upload-btn" id="b6-mp-upload-btn" title="上傳圖片（選填）">📷</button>
                        <img id="b6-mp-preview" class="b6-mp-img-preview" style="display:none" alt="">
                        <input type="text" id="b6-mp-name" class="b6-cip-input" placeholder="名稱（最多6字）" maxlength="6" style="flex:1;">
                        <button class="b6-cip-input b6-cip-price-inp b6-mp-price-btn" id="b6-mp-price-btn" type="button">金額</button>
                        <div class="b6-mp-unit-wrap"><button class="b6-cip-input b6-mp-unit-btn" id="b6-mp-unit-btn" type="button">個</button></div>
                        <button class="b6-cip-add-btn" id="b6-mp-add-btn">＋</button>
                    </div>
                    ${minBudget ? `<div style="font-size:11px;color:#6b7280;margin-top:2px;">💡 此市場任務最低預算 <strong style="color:#059669;">${minBudget} 元</strong>，建議金額不超過此值</div>` : ''}
                </div>` : `<div style="margin-top:6px;color:#d97706;font-size:12px;">⚠️ 請先選擇固定市場類型（非隨機）才能新增魔法商品</div>`}
            </div>`;
        },

        _bindMagicItemsPanel() {
            const s = this.state.settings;
            if (!s.magicItems) s.magicItems = [];
            const mktKey = s.marketType && s.marketType !== 'random' ? s.marketType : null;
            const stalls = mktKey ? B6_MARKETS[mktKey]?.stalls : null;
            if (!stalls) return;

            const uploadBtn0 = document.getElementById('b6-mp-upload-btn');
            if (!uploadBtn0 || uploadBtn0._b6MpBound) return;
            uploadBtn0._b6MpBound = true;
            let pendingImageUrl = null;
            let selectedPrice   = 0;
            let selectedUnit    = '個';
            let selectedStall   = document.querySelector('.b6-mp-stall-btn.active')?.dataset.mpStall
                                  || Object.keys(stalls)[0];

            // 金額數字鍵盤
            const priceBtn = document.getElementById('b6-mp-price-btn');
            if (priceBtn) {
                Game.EventManager.on(priceBtn, 'click', () => {
                    this._showMpPriceNumpad(selectedPrice, (n) => {
                        selectedPrice = n;
                        priceBtn.textContent = `${n} 元`;
                        priceBtn.classList.add('b6-mp-price-btn--set');
                    });
                }, {}, 'settings');
            }

            // 單位下拉選單
            const unitBtn = document.getElementById('b6-mp-unit-btn');
            if (unitBtn) {
                Game.EventManager.on(unitBtn, 'click', (e) => {
                    e.stopPropagation();
                    this._showUnitDropdown(unitBtn, (unit) => {
                        selectedUnit = unit;
                        unitBtn.textContent = unit;
                    });
                }, {}, 'settings');
            }

            document.querySelectorAll('.b6-mp-stall-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('.b6-mp-stall-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedStall = btn.dataset.mpStall;
                }, {}, 'settings');
            });

            const fileInput = document.getElementById('b6-mp-file');
            const uploadBtn = document.getElementById('b6-mp-upload-btn');
            const preview   = document.getElementById('b6-mp-preview');
            if (uploadBtn && fileInput) {
                Game.EventManager.on(uploadBtn, 'click', () => fileInput.click(), {}, 'settings');
                Game.EventManager.on(fileInput, 'change', () => {
                    const file = fileInput.files?.[0];
                    if (!file) return;
                    this._compressMagicImage(file, (url) => {
                        pendingImageUrl = url;
                        if (preview) { preview.src = url; preview.style.display = ''; }
                    });
                }, {}, 'settings');
            }

            const addBtn = document.getElementById('b6-mp-add-btn');
            if (addBtn) {
                Game.EventManager.on(addBtn, 'click', () => {
                    if (s.magicItems.some(mi => mi.stallKey === selectedStall)) {
                        const stallName = stalls[selectedStall]?.name || selectedStall;
                        alert(`「${stallName}」已有 1 項魔法商品\n每攤位限 1 項，共最多 3 項`);
                        return;
                    }
                    const name = document.getElementById('b6-mp-name')?.value.trim();
                    if (!name) { alert('請輸入商品名稱'); return; }
                    if (!selectedPrice || selectedPrice < 1) { alert('請輸入金額'); return; }
                    if (selectedPrice > 500) { alert('每件魔法商品上限為 500 元\n（3 件合計最多 1,500 元）'); return; }
                    const minBudget = this._b6MagicMinBudget(mktKey);
                    if (selectedPrice > minBudget) {
                        alert(`金額 ${selectedPrice} 元超過此市場最低任務預算（${minBudget} 元），\n建議調低金額，避免學生無法選購。`);
                        return;
                    }
                    s.magicItems.push({
                        id: `magic-b6-${Date.now()}`,
                        name, price: selectedPrice, unit: selectedUnit,
                        icon: '✨',
                        imageUrl: pendingImageUrl || null,
                        stallKey: selectedStall,
                        isCustom: true,
                    });
                    pendingImageUrl = null;
                    selectedPrice = 0;
                    selectedUnit = '個';
                    if (preview) { preview.src = ''; preview.style.display = 'none'; }
                    document.getElementById('b6-mp-name').value = '';
                    const pb = document.getElementById('b6-mp-price-btn');
                    if (pb) { pb.textContent = '金額'; pb.classList.remove('b6-mp-price-btn--set'); }
                    const ub = document.getElementById('b6-mp-unit-btn');
                    if (ub) ub.textContent = '個';
                    if (fileInput) fileInput.value = '';
                    this._refreshB6MagicItemsList();
                }, {}, 'settings');
            }

            const list = document.getElementById('b6-mp-list');
            if (list) {
                Game.EventManager.on(list, 'click', (e) => {
                    const priceBtn = e.target.closest('[data-mp-price-idx]');
                    if (priceBtn) {
                        const idx = parseInt(priceBtn.dataset.mpPriceIdx);
                        this._showMpPriceNumpad(s.magicItems[idx].price, (n) => {
                            const minBudget = this._b6MagicMinBudget(mktKey);
                            if (n > minBudget) {
                                alert(`金額 ${n} 元超過此市場最低任務預算（${minBudget} 元），請調低金額。`);
                                return;
                            }
                            s.magicItems[idx].price = n;
                            this._refreshB6MagicItemsList();
                        });
                        return;
                    }
                    const delBtn = e.target.closest('[data-mp-del]');
                    if (!delBtn) return;
                    s.magicItems.splice(parseInt(delBtn.dataset.mpDel), 1);
                    this._refreshB6MagicItemsList();
                }, {}, 'settings');
            }
        },

        _refreshB6MagicItemsList() {
            const list   = document.getElementById('b6-mp-list');
            if (!list) return;
            const s      = this.state.settings;
            const mktKey = s.marketType && s.marketType !== 'random' ? s.marketType : null;
            const stalls = mktKey ? B6_MARKETS[mktKey]?.stalls : null;
            list.innerHTML = (s.magicItems || []).map((mi, idx) => {
                const stallInfo = stalls?.[mi.stallKey];
                return `
                <div class="b6-mp-item-row" data-mp-idx="${idx}">
                    <span class="b6-mp-item-icon">${b6IconHTML(mi)}</span>
                    <span class="b6-mp-item-stall">${stallInfo?.icon || '✨'}</span>
                    <span class="b6-mp-item-name">${mi.name}</span>
                    <button class="b6-mp-item-price" data-mp-price-idx="${idx}">${mi.price}元</button>
                    <button class="b6-mp-del-btn" data-mp-del="${idx}">✕</button>
                </div>`;
            }).join('');
        },

        _showMpPriceNumpad(currentPrice, onConfirm) {
            document.getElementById('b-mp-price-numpad')?.remove();
            let val = currentPrice > 0 ? String(currentPrice) : '';
            const overlay = document.createElement('div');
            overlay.id = 'b-mp-price-numpad';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10200;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = `
                <div style="background:#fff;border-radius:16px;padding:20px 24px;width:260px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
                    <div style="font-size:14px;font-weight:700;color:#374151;margin-bottom:4px;">💰 輸入金額</div>
                    <div style="font-size:11px;color:#d97706;margin-bottom:8px;">上限 500 元（每件不超過 500 元）</div>
                    <div id="b-mppnp-disp" style="font-size:2rem;font-weight:bold;text-align:center;padding:10px;background:#f3f4f6;border-radius:10px;margin-bottom:12px;">${currentPrice > 0 ? currentPrice : '---'}</div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;">
                        ${[1,2,3,4,5,6,7,8,9,'⌫',0,'取消'].map(k => `<button style="padding:12px;font-size:1.1rem;border:2px solid #e5e7eb;border-radius:8px;background:#f9fafb;cursor:pointer;font-weight:600;" data-mppnpk="${k}">${k}</button>`).join('')}
                    </div>
                    <button id="b-mppnp-cancel" style="width:100%;padding:8px;border:none;background:#f3f4f6;border-radius:8px;cursor:pointer;font-size:14px;color:#6b7280;">確定</button>
                </div>`;
            document.body.appendChild(overlay);
            const disp = overlay.querySelector('#b-mppnp-disp');
            const update = () => { disp.textContent = val || '---'; };
            overlay.querySelectorAll('[data-mppnpk]').forEach(npBtn => {
                npBtn.addEventListener('click', () => {
                    const k = npBtn.dataset.mppnpk;
                    if (k === '取消') { overlay.remove(); return; }
                    this.audio.play('keypad');
                    if (k === '⌫') { val = val.slice(0, -1); }
                    else {
                        const next = val + k;
                        if (parseInt(next) <= 500) val = next;
                    }
                    update();
                });
            });
            overlay.querySelector('#b-mppnp-cancel').addEventListener('click', () => {
                const n = parseInt(val);
                if (n >= 1 && n <= 500) { overlay.remove(); onConfirm(n); return; }
                disp.textContent = n > 500 ? '上限 500 元' : '請輸入 1~500';
                disp.style.color = '#ef4444';
                setTimeout(() => { disp.style.color = ''; update(); }, 800);
                val = ''; update();
            });
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        },

        _showUnitDropdown(anchor, onSelect) {
            document.getElementById('b6-mp-unit-dropdown')?.remove();
            const units = ['個','顆','條','包','支','組','斤','把','片','袋','罐','瓶','盒','串','塊'];
            const drop = document.createElement('div');
            drop.id = 'b6-mp-unit-dropdown';
            drop.style.cssText = 'position:absolute;top:calc(100% + 4px);left:0;background:#fff;border:1.5px solid #d1d5db;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.15);z-index:10100;display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:8px;min-width:220px;';
            drop.innerHTML = units.map(u =>
                `<button style="padding:7px 4px;border:1.5px solid #e5e7eb;border-radius:6px;background:#f9fafb;cursor:pointer;font-size:14px;font-weight:600;color:#374151;" data-unit="${u}">${u}</button>`
            ).join('');
            const wrap = anchor.closest('.b6-mp-unit-wrap') || anchor.parentElement;
            wrap.style.position = 'relative';
            wrap.appendChild(drop);
            drop.querySelectorAll('[data-unit]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    btn.style.background = '#d1fae5';
                    setTimeout(() => {
                        onSelect(btn.dataset.unit);
                        drop.remove();
                    }, 120);
                });
            });
            const close = (e) => {
                if (!drop.contains(e.target) && e.target !== anchor) {
                    drop.remove();
                    document.removeEventListener('click', close);
                }
            };
            setTimeout(() => document.addEventListener('click', close), 0);
        },

        _compressMagicImage(file, cb) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const size   = 200;
                    const scale  = Math.min(size / img.width, size / img.height, 1);
                    const canvas = document.createElement('canvas');
                    canvas.width  = Math.round(img.width  * scale);
                    canvas.height = Math.round(img.height * scale);
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    cb(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },

        _bindShoppingEvents() {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;

            // 攤位左右切換
            const _stallKeys = Object.keys(_currentStalls);

            // ── 攤位商品格局部更新（不重建整頁，只換商品面板）──
            const _refreshStallPanel = this._b6RefreshPanel = () => {
                const mission = g.mission;
                const total   = this._calcMissionTotal();
                const budget  = mission.budget;
                const activeStallReq = (mission.stalls || []).find(r => r.stall === g.activeStall);
                const activeQuota    = activeStallReq ? activeStallReq.count : 0;
                const activeSelCount = (g.selectedItems || []).filter(i => i.stall === g.activeStall).length;
                const stallQuotaFull = activeSelCount >= activeQuota;
                const stallItems     = _currentStalls[g.activeStall].items;
                const productsHTML = stallItems.map(item => {
                    const isSelected  = (g.selectedItems || []).some(si => si.stall === g.activeStall && si.id === item.id);
                    const wouldExceed = !isSelected && (total + item.price) > budget;
                    const isQuotaFull = !isSelected && stallQuotaFull;
                    let extraClass = '';
                    if (isSelected)      extraClass = 'selected';
                    else if (wouldExceed) extraClass = 'over-budget';
                    else if (isQuotaFull) extraClass = 'quota-full';
                    return `<button class="b6-product-btn${extraClass ? ' ' + extraClass : ''}"
                        data-item-id="${item.id}" data-stall="${g.activeStall}" data-price="${item.price}">
                        <span class="b6-product-icon">${b6IconHTML(item)}</span>
                        <span class="b6-product-name">${item.name}</span>
                        <span class="b6-product-price">${item.price} 元</span>
                        <span class="b6-product-unit">/ ${item.unit}</span>
                        ${isSelected  ? '<span class="b6-product-collected-mark">✅</span>' : ''}
                        ${wouldExceed ? '<span class="b6-product-over-mark">💸</span>' : ''}
                    </button>`;
                }).join('');
                const panelEl = document.querySelector('.b6-stall-panel');
                if (panelEl) panelEl.innerHTML = `<div class="b6-products-grid">${productsHTML}</div>`;
                // 更新導航按鈕狀態
                const stallIdx = _stallKeys.indexOf(g.activeStall);
                const prevBtn = document.getElementById('b6-stall-prev');
                const nextBtn = document.getElementById('b6-stall-next');
                if (prevBtn) prevBtn.disabled = stallIdx <= 0;
                if (nextBtn) nextBtn.disabled = stallIdx >= _stallKeys.length - 1;
                // 重新綁定新商品的點擊事件
                _bindProductBtns();
                // 更新導航標籤、dots、任務卡、結帳列
                this._updateShoppingUIPartial();
                // 提示高亮（攤位切換後重新標記）
                this._b6P1UpdateHintHighlights();
            };

            const _switchStall = (newKey) => {
                if (g.activeStall === newKey) return;
                // 顯示離開攤位的小計
                const leavingStall = g.activeStall;
                const selectedHere = (g.selectedItems || []).filter(i => i.stall === leavingStall);
                if (selectedHere.length > 0) {
                    const subtotal = selectedHere.reduce((s, si) => {
                        const found = (_currentStalls[leavingStall]?.items || []).find(p => p.id === si.id);
                        return s + (found?.price || 0);
                    }, 0);
                    this._showStallSubtotal(_currentStalls[leavingStall].name, subtotal);
                }
                this.audio.play('click');
                g.activeStall = newKey;
                // 切換至已完成攤位提示
                const destReq = (g.mission.stalls || []).find(r => r.stall === newKey);
                const destSelCount = (g.selectedItems || []).filter(i => i.stall === newKey).length;
                if (destReq && destSelCount >= destReq.count) {
                    const toast = document.createElement('div');
                    toast.className = 'b6-stall-done-toast';
                    toast.textContent = `✅ ${_currentStalls[newKey]?.name || ''} 已選購完畢！`;
                    document.body.appendChild(toast);
                    Game.TimerManager.setTimeout(() => { toast.classList.add('b6-sdt-fade'); }, 1000, 'ui');
                    Game.TimerManager.setTimeout(() => { if (document.body.contains(toast)) toast.remove(); }, 1600, 'ui');
                }
                // 攤位語音引導
                const stallInfo = _currentStalls[newKey];
                const remaining = destReq ? (destReq.count - destSelCount) : 0;
                const remStr = remaining === 2 ? '兩' : String(remaining);
                let stallSpeech;
                if (remaining > 0) {
                    stallSpeech = `${stallInfo.name}，還要買${remStr}樣`;
                } else if (destReq) {
                    stallSpeech = `${stallInfo.name}的物品已經採購完成`;
                } else {
                    stallSpeech = `今天${stallInfo.name}不用買`;
                }
                Game.Speech.speak(stallSpeech);
                // 只替換商品面板，不重建整頁
                _refreshStallPanel();
            };

            // 供外部（_b6P1ActivateHintMode）呼叫攤位切換
            g._switchStall = _switchStall;

            const prevBtn = document.getElementById('b6-stall-prev');
            const nextBtn = document.getElementById('b6-stall-next');
            if (prevBtn) {
                Game.EventManager.on(prevBtn, 'click', () => {
                    const idx = _stallKeys.indexOf(g.activeStall);
                    if (idx > 0) _switchStall(_stallKeys[idx - 1]);
                }, {}, 'gameUI');
            }
            if (nextBtn) {
                Game.EventManager.on(nextBtn, 'click', () => {
                    const idx = _stallKeys.indexOf(g.activeStall);
                    if (idx < _stallKeys.length - 1) _switchStall(_stallKeys[idx + 1]);
                }, {}, 'gameUI');
            }

            // 商品點擊（切換選取/取消，含配額與預算檢查）
            // 抽成具名函數，攤位切換時可重新綁定新商品
            const _bindProductBtns = () => {
            document.querySelectorAll('.b6-product-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    if (document.getElementById('b6-mission-intro')) return;
                    if (this.state.isProcessing) return;
                    const itemId = btn.dataset.itemId;
                    const stall  = btn.dataset.stall;
                    const price  = parseInt(btn.dataset.price) || 0;
                    const itemData = (_currentStalls[stall]?.items || []).find(i => i.id === itemId);
                    const itemName = itemData?.name || '這個商品';

                    const existingIdx = (g.selectedItems || []).findIndex(si => si.stall === stall && si.id === itemId);
                    const isSelected = existingIdx !== -1;

                    if (isSelected) {
                        // 簡單模式提示商品：不可取消選取
                        if (this.state.settings.difficulty === 'easy' && g.p1HintMode) {
                            const isHintItem = (g.p1HintItems || []).some(h => h.stall === stall && h.id === itemId);
                            if (isHintItem) {
                                this.audio.play('error');
                                const tipId = 'b6-wrong-tip';
                                let tip = document.getElementById(tipId);
                                if (!tip) { tip = document.createElement('div'); tip.id = tipId; document.body.appendChild(tip); }
                                tip.className = 'b6-wrong-tip';
                                tip.innerHTML = `<div class="b6-wt-msg">❌ 提示商品不可取消</div>`;
                                Game.Speech.speak('提示商品不可以取消');
                                Game.TimerManager.clearByCategory('wrongTip');
                                Game.TimerManager.setTimeout(() => { tip?.remove(); }, 2000, 'wrongTip');
                                return;
                            }
                        }
                        // 取消選取
                        g.selectedItems.splice(existingIdx, 1);
                        this.audio.play('click');
                        Game.Speech.speak(`取消選取${itemName}`);
                        this._updateShoppingUIPartial();
                        return;
                    }

                    // 檢查此攤位的配額
                    const stallReq = (g.mission.stalls || []).find(r => r.stall === stall);
                    if (!stallReq) {
                        // 此攤位本關不需要購買
                        this.audio.play('error');
                        const tipId = 'b6-wrong-tip';
                        let tip = document.getElementById(tipId);
                        if (!tip) { tip = document.createElement('div'); tip.id = tipId; document.body.appendChild(tip); }
                        tip.className = 'b6-wrong-tip';
                        tip.innerHTML = `<div class="b6-wt-msg">❌ 這個攤位今天不在採購計畫中</div>`;
                        Game.Speech.speak(`這個攤位今天不需要買東西`);
                        Game.TimerManager.clearByCategory('wrongTip');
                        Game.TimerManager.setTimeout(() => { tip?.remove(); }, 2400, 'wrongTip');
                        // 普通模式：3次錯誤自動提示
                        if (diff === 'normal' && !g.p1HintMode) {
                            g.p1ErrorCount = (g.p1ErrorCount || 0) + 1;
                            if (g.p1ErrorCount >= 3) {
                                g.p1ErrorCount = 0;
                                Game.TimerManager.setTimeout(() => this._b6P1ShowHint(), 900, 'ui');
                            }
                        }
                        return;
                    }
                    const stallSelCount = (g.selectedItems || []).filter(i => i.stall === stall).length;
                    if (stallSelCount >= stallReq.count) {
                        // 配額已滿：提示要換其他商品或取消其中一個
                        this.audio.play('error');
                        const tipId = 'b6-wrong-tip';
                        let tip = document.getElementById(tipId);
                        if (!tip) { tip = document.createElement('div'); tip.id = tipId; document.body.appendChild(tip); }
                        tip.className = 'b6-wrong-tip';
                        tip.innerHTML = `<div class="b6-wt-msg">這個攤位只需要選 ${stallReq.count} 樣</div><div class="b6-wt-hint">點已選的商品可以取消</div>`;
                        Game.Speech.speak(`${_currentStalls[stall]?.name || ''}只需要選${toCountSpeech(stallReq.count)}樣，點已選的商品可以取消`);
                        Game.TimerManager.clearByCategory('wrongTip');
                        Game.TimerManager.setTimeout(() => { tip?.remove(); }, 2400, 'wrongTip');
                        return;
                    }

                    // 檢查預算
                    const currentTotal = this._calcMissionTotal();
                    if (currentTotal + price > g.mission.budget) {
                        this.audio.play('error');
                        const over = (currentTotal + price) - g.mission.budget;
                        const tipId = 'b6-wrong-tip';
                        let tip = document.getElementById(tipId);
                        if (!tip) { tip = document.createElement('div'); tip.id = tipId; document.body.appendChild(tip); }
                        tip.className = 'b6-wrong-tip';
                        tip.innerHTML = `<div class="b6-wt-msg">⚠️ 超出預算 ${over} 元！</div><div class="b6-wt-hint">換一個便宜一點的商品</div>`;
                        Game.Speech.speak(`${itemName}${price}元，超出預算${over}元，請換一個便宜一點的`);
                        Game.TimerManager.clearByCategory('wrongTip');
                        Game.TimerManager.setTimeout(() => { tip?.remove(); }, 2800, 'wrongTip');
                        // 普通模式：3次錯誤自動提示
                        if (diff === 'normal' && !g.p1HintMode) {
                            g.p1ErrorCount = (g.p1ErrorCount || 0) + 1;
                            if (g.p1ErrorCount >= 3) {
                                g.p1ErrorCount = 0;
                                Game.TimerManager.setTimeout(() => this._b6P1ShowHint(), 900, 'ui');
                            }
                        }
                        return;
                    }

                    // 提示模式守衛：easy/normal 限制只能選建議商品；困難模式自由選購
                    if (g.p1HintMode && diff !== 'hard') {
                        const isHintItem = (g.p1HintItems || []).some(h => h.stall === stall && h.id === itemId);
                        if (!isHintItem) {
                            this.audio.play('error');
                            const tipId = 'b6-wrong-tip';
                            let tip = document.getElementById(tipId);
                            if (!tip) { tip = document.createElement('div'); tip.id = tipId; document.body.appendChild(tip); }
                            tip.className = 'b6-wrong-tip';
                            tip.innerHTML = `<div class="b6-wt-msg">❌ 請選擇提示的商品</div><div class="b6-wt-hint">看看橘色「點這裡」提示</div>`;
                            Game.Speech.speak('不對喔，請選擇提示的商品');
                            Game.TimerManager.clearByCategory('wrongTip');
                            Game.TimerManager.setTimeout(() => { tip?.remove(); }, 2400, 'wrongTip');
                            return;
                        }
                    }

                    // 加入選取
                    if (!g.selectedItems) g.selectedItems = [];
                    g.selectedItems.push({ stall, id: itemId });
                    g.collectedIds.add(itemId); // 向後相容（結果頁使用）
                    this.audio.play('correct');

                    const isMissionDone = this._isMissionComplete();
                    const doUIUpdate = (suppressCompletion = false) => {
                        // 合併動畫：商品名稱+價格+進度 同一個置中元素
                        if (itemData) this._showItemCollectFlash(itemData, g.selectedItems.length, this._getTotalRequired());
                        this._updateShoppingUIPartial(suppressCompletion ? { suppressCompletion: true } : {});
                    };

                    if (diff === 'easy' && g.p1HintMode) {
                        // 簡單提示模式：商品語音 → 攤位切換語音 串接
                        this.state.isProcessing = true;
                        if (isMissionDone) {
                            doUIUpdate(true);
                            Game.Speech.speak(`${itemName}，${price}元`, () => {
                                document.getElementById('b6-checkout-btn')?.classList.add('b6-product-here-hint');
                                this._showAllCollectedFlash();
                                Game.Speech.speak('所有商品選購完成，可以去結帳了！', () => {
                                    this.state.isProcessing = false;
                                    AssistClick.buildQueue();
                                });
                            });
                        } else {
                            doUIUpdate();
                            const nextHint = (g.p1HintItems || []).find(h =>
                                !(g.selectedItems || []).some(si => si.stall === h.stall && si.id === h.id)
                            );
                            const nextStall = nextHint?.stall;
                            Game.Speech.speak(`${itemName}，${price}元`, () => {
                                if (nextStall && nextStall !== g.activeStall && this._b6RefreshPanel) {
                                    g.activeStall = nextStall;
                                    this._b6RefreshPanel();
                                    const stallName = (_currentStalls[nextStall] || {}).name || '';
                                    Game.Speech.speak(stallName, () => {
                                        this.state.isProcessing = false;
                                        AssistClick.buildQueue();
                                    });
                                } else {
                                    this._b6P1UpdateHintHighlights();
                                    this.state.isProcessing = false;
                                    AssistClick.buildQueue();
                                }
                            });
                        }
                    } else if (isMissionDone) {
                        // 立即更新 UI（壓制完成語音），待商品名語音播完再播完成提示
                        doUIUpdate(true);
                        Game.Speech.speak(`${itemName}，${price}元`, () => {
                            Game.Speech.speak('所有商品選購完成，可以去結帳了！');
                            this._showAllCollectedFlash();
                            if (this.state.settings.difficulty === 'easy') {
                                document.getElementById('b6-checkout-btn')?.classList.add('b6-product-here-hint');
                            }
                        });
                    } else if (g.p1HintMode && diff === 'normal') {
                        // 普通提示模式：選中提示商品後退出提示模式，讓錯誤計數重新累積
                        g.p1HintMode   = false;
                        g.p1ErrorCount = 0;
                        doUIUpdate();
                        this._b6P1UpdateHintHighlights();
                        Game.Speech.speak(`${itemName}，${price}元`);
                    } else {
                        Game.Speech.speak(`${itemName}，${price}元`);
                        doUIUpdate();
                    }
                }, {}, 'gameUI');
            });
            }; // end _bindProductBtns
            _bindProductBtns();

            // 結帳按鈕
            const checkoutBtn = document.getElementById('b6-checkout-btn');
            Game.EventManager.on(checkoutBtn, 'click', () => {
                if (this.state.isProcessing) return;
                this._showCheckoutConfirm(g, () => {
                    g.phase = 'payment';
                    g.paidAmount = 0;
                    this._renderPaymentUI();
                });
            }, {}, 'gameUI');
            // 語音重播
            const replayBtn = document.getElementById('replay-speech-btn');
            if (replayBtn) {
                Game.EventManager.on(replayBtn, 'click', () => {
                    this.audio.play('click');
                    const mission = this.state.game.mission;
                    const replayText = (mission.stalls || []).map(({ stall, count }) => {
                        const stallInfo = _currentStalls[stall];
                        return stallInfo ? `${stallInfo.name}買${toCountSpeech(count)}樣` : '';
                    }).filter(Boolean).join('，');
                    Game.Speech.speak(`${replayText}，預算${mission.budget}元，請開始購物。`);
                }, {}, 'gameUI');
            }
            const p1HintBtn = document.getElementById('b6-p1-hint-btn');
            if (p1HintBtn) {
                Game.EventManager.on(p1HintBtn, 'click', () => {
                    this.audio.play('click');
                    this._b6P1ShowHint();
                }, {}, 'gameUI');
            }
        },

        // ── 局部更新購物 UI（不全重繪，只更新任務卡/結帳列/商品狀態）──
        _updateShoppingUIPartial(opts = {}) {
            const g      = this.state.game;
            const mission = g.mission;
            const total  = this._calcMissionTotal();
            const budget = mission.budget;
            const budgetOver = total > budget;
            const missionDone = this._isMissionComplete();
            const totalRequired = this._getTotalRequired();
            const selectedCount = (g.selectedItems || []).length;

            // 更新預算顯示
            const budgetEl = document.querySelector('.b6-task-budget');
            if (budgetEl) {
                budgetEl.innerHTML = `預算 <strong class="${budgetOver ? 'b6-budget-over' : ''}">${budget} 元</strong>${budgetOver ? `<span class="b6-budget-warning"> ⚠️ 超出！</span>` : ''}`;
            }

            // 更新預算進度條（簡單／普通模式）
            const barFill = document.getElementById('b6-budget-bar-fill');
            const barLabel = document.getElementById('b6-budget-bar-label');
            if (barFill && barLabel) {
                const { pct, label, emoji, color } = this._b6BudgetBarInfo(total, budget);
                barFill.style.width = pct + '%';
                barFill.style.backgroundColor = color;
                barLabel.textContent = emoji + ' ' + label;
            }

            // 更新任務卡頂部攤位清單（b6-stall-checklist）
            const diff = this.state.settings.difficulty;
            if (diff === 'hard') {
                const el = document.getElementById('b6-sc-sel-count');
                if (el) el.textContent = (g.selectedItems || []).length;
            } else {
                (mission.stalls || []).forEach(({ stall, count }) => {
                    const sccEl = document.querySelector(`.b6-scc-card[data-scc-stall="${stall}"]`);
                    if (!sccEl) return;
                    const selCount = (g.selectedItems || []).filter(i => i.stall === stall).length;
                    const done = selCount >= count;
                    sccEl.classList.toggle('done', done);
                    let mark = sccEl.querySelector('.b6-scc-check');
                    if (done && !mark) {
                        mark = document.createElement('span');
                        mark.className = 'b6-scc-check';
                        mark.textContent = '✅';
                        sccEl.insertBefore(mark, sccEl.firstChild);
                    } else if (!done && mark) {
                        mark.remove();
                    }
                    const prog = sccEl.querySelector('.b6-scc-prog');
                    if (prog) prog.textContent = `${selCount}/${count}`;
                });
            }

            // 更新攤位需求列（左側進度卡）
            (mission.stalls || []).forEach(({ stall, count }) => {
                const reqEl = document.querySelector(`.b6-stall-req[data-req-stall="${stall}"]`);
                if (!reqEl) return;
                const selected = (g.selectedItems || []).filter(i => i.stall === stall);
                const done = selected.length >= count;
                reqEl.classList.toggle('done', done);
                reqEl.classList.toggle('active', stall === g.activeStall);
                const progEl = reqEl.querySelector('.b6-sr-prog');
                if (progEl) progEl.textContent = `${selected.length}/${count}${done ? ' ✅' : ''}`;
                // 更新已選商品名稱
                const stallInfo = _currentStalls[stall];
                const selectedNames = selected.map(si => {
                    const item = stallInfo?.items.find(i => i.id === si.id);
                    return item ? `<span class="b6-sr-sel-item">${b6IconHTML(item)} ${item.name}</span>` : '';
                }).join('');
                let itemsEl = reqEl.querySelector('.b6-sr-items');
                if (selectedNames) {
                    if (!itemsEl) { itemsEl = document.createElement('div'); itemsEl.className = 'b6-sr-items'; reqEl.appendChild(itemsEl); }
                    itemsEl.innerHTML = selectedNames;
                } else if (itemsEl) {
                    itemsEl.remove();
                }
            });

            // 更新攤位標題配額顯示
            const navLabelEl = document.querySelector('.b6-snav-label');
            if (navLabelEl) {
                const activeReq = (mission.stalls || []).find(r => r.stall === g.activeStall);
                const activeSelCount = (g.selectedItems || []).filter(i => i.stall === g.activeStall).length;
                const activeQuota = activeReq ? activeReq.count : 0;
                const stallInfo = _currentStalls[g.activeStall];
                navLabelEl.innerHTML = `${stallInfo?.icon || ''} ${stallInfo?.name || ''}${activeQuota > 0 ? `<span class="b6-snav-quota"> (${activeSelCount}/${activeQuota})</span>` : ''}`;
            }

            // 更新每個商品按鈕的狀態
            const activeStallReq = (mission.stalls || []).find(r => r.stall === g.activeStall);
            const activeQuota = activeStallReq ? activeStallReq.count : 0;
            const activeSelCount = (g.selectedItems || []).filter(i => i.stall === g.activeStall).length;
            const stallQuotaFull = activeSelCount >= activeQuota;
            document.querySelectorAll('.b6-product-btn').forEach(btn => {
                const itemId = btn.dataset.itemId;
                const stall  = btn.dataset.stall;
                const price  = parseInt(btn.dataset.price) || 0;
                const isSelected = (g.selectedItems || []).some(si => si.stall === stall && si.id === itemId);
                const wouldExceed = !isSelected && (total + price) > budget;
                const isQuotaFull = !isSelected && stallQuotaFull;
                btn.className = 'b6-product-btn' + (isSelected ? ' selected' : wouldExceed ? ' over-budget' : isQuotaFull ? ' quota-full' : '');
                let mark = btn.querySelector('.b6-product-collected-mark');
                let overMark = btn.querySelector('.b6-product-over-mark');
                if (isSelected && !mark) {
                    mark = document.createElement('span'); mark.className = 'b6-product-collected-mark'; mark.textContent = '✅';
                    btn.appendChild(mark);
                } else if (!isSelected && mark) mark.remove();
                if (wouldExceed && !overMark) {
                    overMark = document.createElement('span'); overMark.className = 'b6-product-over-mark'; overMark.textContent = '⚠️';
                    btn.appendChild(overMark);
                } else if (!wouldExceed && overMark) overMark.remove();
            });

            // 更新 nav dots
            const stallKeys = Object.keys(_currentStalls);
            const dots = document.querySelectorAll('.b6-snav-dot');
            stallKeys.forEach((k, i) => {
                const dot = dots[i];
                if (!dot) return;
                const req = (mission.stalls || []).find(r => r.stall === k);
                const hasReq = !!req;
                const selCount = (g.selectedItems || []).filter(si => si.stall === k).length;
                const done = hasReq && selCount >= req.count;
                dot.classList.toggle('done', done);
                dot.classList.toggle('has-items', hasReq && !done);
            });

            // 更新結帳列
            const basketEl = document.querySelector('.b6-basket-total');
            if (basketEl) basketEl.textContent = total;
            const cstripCountEl = document.querySelector('.b6-cstrip-count');
            if (cstripCountEl) cstripCountEl.innerHTML = `🛒 <strong>${selectedCount}</strong> / ${totalRequired} 件`;
            const cstripTotalEl = document.querySelector('.b6-cstrip-total');
            if (cstripTotalEl) cstripTotalEl.classList.toggle('over', budgetOver);

            // 更新已選商品清單（右側結帳卡）
            const cartItemsEl = document.getElementById('b6-cart-items');
            if (cartItemsEl) {
                cartItemsEl.innerHTML = (g.selectedItems || []).length > 0
                    ? (g.selectedItems || []).map(({ stall, id }) => {
                        const item = (_currentStalls[stall]?.items || []).find(i => i.id === id);
                        if (!item) return '';
                        return `<div class="b6-cart-item">
                            <span class="b6-ci-icon">${b6IconHTML(item)}</span>
                            <span class="b6-ci-name">${item.name}</span>
                            <span class="b6-ci-price">${item.price} 元</span>
                        </div>`;
                    }).join('')
                    : `<div class="b6-cart-empty">尚未選購商品</div>`;
            }

            // 結帳按鈕
            const checkoutBtn = document.getElementById('b6-checkout-btn');
            if (checkoutBtn) {
                const wasDone = !checkoutBtn.disabled;
                checkoutBtn.disabled = !missionDone;
                if (missionDone && !wasDone && !opts.suppressCompletion) {
                    Game.Speech.speak('所有商品選購完成，可以去結帳了！');
                    this._showAllCollectedFlash();
                    // 簡單模式：結帳按鈕顯示「點這裡」提示
                    if (this.state.settings.difficulty === 'easy') {
                        checkoutBtn.classList.add('b6-product-here-hint');
                    }
                }
                // 非完成狀態時移除提示
                if (!missionDone) checkoutBtn.classList.remove('b6-product-here-hint');
            }

            // 浮動購物籃徽章
            this._updateCartBadge(selectedCount, totalRequired);

            // 提示高亮：商品狀態更新後重新標記（商品被選取後移至下一個）
            this._b6P1UpdateHintHighlights();
        },

        // ── 結帳前確認清單（B1 _showTaskModal pattern）──────────
        _showCheckoutConfirm(g, callback) {
            const existing = document.getElementById('b6-checkout-confirm');
            if (existing) { existing.remove(); callback(); return; }
            const items = (g.selectedItems || []).map(({ stall, id }) => {
                const item = (_currentStalls[stall]?.items || []).find(i => i.id === id);
                return item ? { stall, id, ...item } : null;
            }).filter(Boolean);
            const total = items.reduce((sum, item) => sum + item.price, 0);
            const itemRows = items.map(item => {
                return `<div class="b6-cc-row"><span>${b6IconHTML(item)} ${item.name}</span><span>${item.price} 元</span></div>`;
            }).join('');
            const modal = document.createElement('div');
            modal.id = 'b6-checkout-confirm';
            modal.style.cssText = 'position:fixed;inset:0;z-index:10200;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:16px;';
            modal.innerHTML = `
                <div class="b6-checkout-card">
                    <div class="b6-cc-title">🛒 結帳清單</div>
                    <div class="b6-cc-items">
                        ${itemRows}
                        <div class="b6-cc-sep"></div>
                        <div class="b6-cc-row b6-cc-total"><span>合計</span><span>${total} 元</span></div>
                        <div class="b6-cc-row b6-cc-budget"><span>預算</span><span>${g.mission.budget} 元</span></div>
                    </div>
                    <button class="b6-cc-btn" id="b6-cc-go">✓ 去付款</button>
                </div>`;
            document.body.appendChild(modal);
            Game.Speech.speak(`合計${total}元，預算${g.mission.budget}元，確認去付款！`);
            const go = () => { if (modal.parentNode) modal.remove(); callback(); };
            Game.EventManager.on(document.getElementById('b6-cc-go'), 'click', go, {}, 'gameUI');
            const autoT = Game.TimerManager.setTimeout(go, 5000, 'ui');
            // 點擊背景也關閉
            modal.addEventListener('click', (e) => {
                if (e.target === modal) { Game.TimerManager.clearTimeout(autoT); go(); }
            });
        },

        // ── 收集進度動畫（Round 27）──────────────────────────────
        // ── 商品選購合併動畫（商品名稱+價格+進度，置中顯示）────────
        _showItemCollectFlash(item, collected, needed) {
            document.getElementById('b6-col-progress')?.remove();
            document.querySelector('.b6-collect-flash')?.remove();
            document.querySelector('.b6-flyout-blocker')?.remove();
            // 透明阻擋層：彈窗期間防止點到下方商品
            const blocker = document.createElement('div');
            blocker.className = 'b6-flyout-blocker';
            document.body.appendChild(blocker);
            const isAll = collected >= needed;
            const el = document.createElement('div');
            el.id = 'b6-col-progress';
            el.className = `b6-collect-flash${isAll ? ' all-done' : ''}`;
            el.innerHTML = `
                <div class="b6-cf-item">
                    <span class="b6-cf-icon">${b6IconHTML(item)}</span>
                    <span class="b6-cf-name">${item.name}</span>
                </div>
                <div class="b6-cf-price">+${item.price}元</div>
                <div class="b6-cf-progress">
                    <span class="b6-cf-plus">+1</span>
                    <span class="b6-cf-count">${collected}/${needed}</span>
                </div>`;
            document.body.appendChild(el);
            Game.TimerManager.setTimeout(() => {
                el.classList.add('b6-cf-fade');
                if (document.body.contains(blocker)) blocker.remove();
                Game.TimerManager.setTimeout(() => { if (el.parentNode) el.remove(); }, 400, 'ui');
            }, 1400, 'ui');
        },

        // ── 舊 _showCollectionProgress 保留為空 stub（不再使用）───
        _showCollectionProgress(collected, needed) {},

        // ── 全部收集完成中央閃光（Round 38）─────────────────────
        _showAllCollectedFlash() {
            const existing = document.getElementById('b6-all-done-flash');
            if (existing) existing.remove();
            const el = document.createElement('div');
            el.id = 'b6-all-done-flash';
            el.className = 'b6-all-done-flash';
            el.textContent = '🎉 全部選購完成！';
            document.body.appendChild(el);
            Game.TimerManager.setTimeout(() => { if (document.body.contains(el)) el.remove(); }, 1500, 'ui');
        },

        // ── 攤位小計提示（Round 25）──────────────────────────────
        _showStallSubtotal(stallName, subtotal) {
            const prev = document.getElementById('b6-stall-subtotal');
            if (prev) prev.remove();
            const tip = document.createElement('div');
            tip.id = 'b6-stall-subtotal';
            tip.className = 'b6-stall-subtotal';
            tip.innerHTML = `<span class="b6-ss-name">${stallName}</span><span class="b6-ss-total">共 ${subtotal} 元</span>`;
            document.body.appendChild(tip);
            Game.TimerManager.setTimeout(() => {
                tip.classList.add('b6-ss-fade');
                Game.TimerManager.setTimeout(() => { if (tip.parentNode) tip.remove(); }, 400, 'ui');
            }, 1800, 'ui');
        },

        _showCenterFeedback(icon, text = '') {
            document.querySelector('.b-center-feedback')?.remove();
            const overlay = document.createElement('div');
            overlay.className = 'b-center-feedback';
            overlay.innerHTML = `<span class="b-cf-icon">${icon}</span>${text ? `<span class="b-cf-text">${text}</span>` : ''}`;
            document.body.appendChild(overlay);
            Game.TimerManager.setTimeout(() => overlay.remove(), 1200, 'ui');
        },

        // ── 商品收據飛出（已整合至 _showItemCollectFlash，保留空 stub）──
        _showItemReceiptFlyout(anchor, item) {},

        // ── 浮動購物籃計數徽章（已移除，改由結帳列顯示）────────────
        _updateCartBadge(collected, needed) { },

        // ── 找到商品彈出價格動畫（A4 transaction tag pattern）────────
        _showPricePopup(anchor, price) {
            const rect = anchor.getBoundingClientRect();
            const tag  = document.createElement('div');
            tag.className = 'b6-price-popup';
            tag.textContent = `+${price} 元`;
            tag.style.left = Math.min(rect.right + 4, window.innerWidth - 80) + 'px';
            tag.style.top  = (rect.top + rect.height / 2 - 12) + 'px';
            document.body.appendChild(tag);
            Game.TimerManager.setTimeout(() => tag.remove(), 1100, 'ui');
        },

        _calcMissionTotal() {
            const g = this.state.game;
            return (g.selectedItems || []).reduce((sum, { stall, id }) => {
                const item = (_currentStalls[stall]?.items || []).find(i => i.id === id);
                return sum + (item ? item.price : 0);
            }, 0);
        },

        // 所有攤位配額都達到且總額不超過預算
        _isMissionComplete() {
            const g = this.state.game;
            const mission = g.mission;
            if (!mission?.stalls) return false;
            for (const req of mission.stalls) {
                const cnt = (g.selectedItems || []).filter(i => i.stall === req.stall).length;
                if (cnt < req.count) return false;
            }
            return this._calcMissionTotal() <= mission.budget;
        },

        // 本關所有攤位需要選取的總件數
        _getTotalRequired() {
            const mission = this.state.game.mission;
            if (!mission?.stalls) return 0;
            return mission.stalls.reduce((sum, req) => sum + req.count, 0);
        },

        // ── 11. 付款畫面（B1/B5 Phase 2 拖曳付款模式）───────────
        _renderPaymentUI() {
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            document.getElementById('b6-cart-badge')?.remove();
            document.getElementById('b6-col-progress')?.remove();
            document.getElementById('b6-all-done-flash')?.remove();
            document.getElementById('b6-stall-subtotal')?.remove();
            document.getElementById('b6-wrong-tip')?.remove();

            const g     = this.state.game;
            const total = this._calcMissionTotal();
            const diff  = this.state.settings.difficulty;

            // 初始化 Phase 2 錢包狀態
            g.p2Wallet    = [];
            g.p2UidCtr    = 0;
            g.p2ErrorCount = 0;
            g.p2Total     = total;
            g.p2TrayFaces = {};
            g.p2ShowHint  = false;
            g.p2HintSlots = [];
            g.paidAmount  = 0;

            const mktKey   = g.mission._mktKey || this.state.settings.marketType;
            const mkt      = B6_MARKETS[mktKey] || B6_MARKETS.traditional;
            const diffLabel = { easy: '簡單模式', normal: '普通模式', hard: '困難模式' }[diff] || '';

            const app = document.getElementById('app');
            app.innerHTML = `
            <div class="b-header">
                <div class="b-header-left">
                    <span class="b-header-unit">${mkt.icon} ${mkt.name}</span>
                </div>
                <div class="b-header-center">步驟二：付款</div>
                <div class="b-header-right">
                    <span class="b-progress">第 ${g.currentRound + 1} 關 / 共 ${g.totalRounds} 關</span>
                    <button class="b-reward-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                    <button class="b-back-btn" onclick="Game.showSettings()">返回設定</button>
                </div>
            </div>
            <div class="game-container">
                ${this._renderB6P2RefCard(g.mission, total, mkt)}
                ${this._renderB6P2WalletArea(total, diff)}
                ${diff !== 'easy' ? `<button class="b6c-confirm-btn-main" id="b6-p2-confirm-btn" disabled>確認付款</button>` : ''}
                ${this._renderB6P2CoinTray(diff)}
            </div>`;

            Game.TimerManager.setTimeout(() => {
                Game.Speech.speak(`共消費${toTWD(total)}，請拿出正確的金額。`);
            }, 300, 'speech');

            this._bindB6P2Events(total);
            this._b6P2SetupDragDrop();

            // 簡單模式：立即顯示淡化金錢圖示（ghost slots）+ 托盤提示
            if (diff === 'easy') {
                this._b6P2AutoSetGhostSlots();
                this._b6P2UpdateWalletDisplay();
                this._b6P2UpdateTrayHints();
            }

            // 進入第二頁自動啟動輔助點擊
            if (this.state.settings.clickMode === 'on') {
                Game.TimerManager.setTimeout(() => AssistClick.activate(), 500, 'ui');
            }
        },

        _b6RefFormulaHtml(items, total) {
            const parts = items.map(item =>
                `<span class="b6c-rf-item"><span class="b6c-rf-item-icon">${b6IconHTML(item)}</span><span class="b6c-rf-item-label">${item.name}&nbsp;<strong>${item.price}元</strong></span></span>`
            );
            const tokens = parts.flatMap((p, i) => i < parts.length - 1 ? [p, '<span class="b6c-rf-sep">+</span>'] : [p]);
            tokens.push(`<span class="b6c-rf-eq">= 合計</span>`);
            tokens.push(`<span class="b6c-rf-total">${total}元</span>`);
            return `<div class="b6c-ref-formula">${tokens.join('')}</div>`;
        },

        _renderB6P2RefCard(mission, total, mkt) {
            const g = this.state.game;
            const allItems = [];
            (g.selectedItems || []).forEach(({ stall, id }) => {
                const item = (_currentStalls[stall]?.items || []).find(i => i.id === id);
                if (item) allItems.push({ icon: item.icon || '', imageUrl: item.imageUrl, name: item.name, price: item.price });
            });
            return `
            <div class="b6p2-ref-card">
                <div class="b6p2-ref-header">
                    <span class="b6p2-ref-icon">${mkt.icon}</span>
                    <span class="b6p2-ref-title">${mkt.name}</span>
                    <span class="b6-p2-hint-wrap">
                        <img src="../images/common/hint_detective.png" alt="" class="b6-task-mascot" onerror="this.style.display='none'">
                        <button class="b-hint-btn" id="b6-p2-hint-btn">💡 提示</button>
                    </span>
                </div>
                ${this._b6RefFormulaHtml(allItems, total)}
            </div>`;
        },

        _renderB6P2WalletArea(total, diff) {
            return `
            <div class="b6p2-payment-header">
                <div class="b6p2-wallet-coins-label">需要付款 <span class="b6p2-wallet-need">${total} 元</span></div>
            </div>
            <div class="b6p2-wallet-area" id="b6p2-wallet-area">
                <div class="b6p2-my-money-label">💳 付款區 <span class="b6p2-pay-status">已付 <span class="b6p2-wallet-total-val" id="b6p2-wallet-total">0 元</span> / ${total} 元</span></div>
                <div class="b6p2-wallet-coins b6p2-drop-zone" id="b6p2-wallet-coins">
                    <span class="b6p2-wallet-empty">把金錢卡片拖曳到這裡</span>
                </div>
            </div>`;
        },

        _renderB6P2CoinTray(diff) {
            const g = this.state.game;
            const denomMap = {
                easy:   [100, 50, 10, 5, 1],
                normal: [500, 100, 50, 10, 5, 1],
                hard:   [1000, 500, 100, 50, 10, 5, 1]
            };
            const allDenoms = denomMap[diff] || denomMap.easy;

            // 使用 intro modal 預先產生的面向；若無則重新產生（fallback）
            let trayFaces = g.p2BudgetFaces;
            let budgetCoins = g.p2BudgetCoins;
            if (!trayFaces || !budgetCoins) {
                trayFaces = {};
                allDenoms.forEach(d => { trayFaces[d] = Math.random() < 0.5 ? 'back' : 'front'; });
                budgetCoins = [];
                let rem = g.mission?.budget || 0;
                for (const d of allDenoms) { while (rem >= d) { budgetCoins.push(d); rem -= d; } }
            }
            // p2TrayFaces 涵蓋所有面額，供 ghost slot 使用
            this.state.game.p2TrayFaces = trayFaces;

            let _trayUidCtr = 0;
            const coinsHtml = budgetCoins.map(d => {
                const trayUid = 'tc' + (++_trayUidCtr);
                const isBill = d >= 100;
                return `
                <div class="b6p2-coin-drag" draggable="true" data-denom="${d}" data-tray-uid="${trayUid}" data-face="${trayFaces[d]}" title="${d}元">
                    <img src="../images/money/${d}_yuan_${trayFaces[d]}.png" alt="${d}元"
                         class="${isBill ? 'banknote-img' : 'coin-img'}" draggable="false"
                         onerror="this.style.display='none'">
                    <span class="b1-denom-label">${d}元</span>
                </div>`;
            }).join('');
            return `
            <div class="b6p2-tray">
                <div class="b6p2-tray-title"><img src="../images/common/icons_wallet.png" class="b6p2-tray-wallet-icon" onerror="this.style.display='none'"> 我的錢包</div>
                <div class="b6p2-tray-coins" id="b6p2-tray-coins">${coinsHtml}</div>
            </div>`;
        },

        _bindB6P2Events(total) {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;

            // 確認付款按鈕（普通/困難）
            const confirmBtn = document.getElementById('b6-p2-confirm-btn');
            if (confirmBtn) {
                Game.EventManager.on(confirmBtn, 'click', () => {
                    if (this.state.isProcessing) return;
                    this._b6P2HandleConfirm(total);
                }, {}, 'gameUI');
            }

            // 移除幣（委派）＋ 拖回托盤
            const walletCoinsEl = document.getElementById('b6p2-wallet-coins');
            if (walletCoinsEl) {
                Game.EventManager.on(walletCoinsEl, 'click', e => {
                    const btn = e.target.closest('.b6p2-wc-remove');
                    if (btn) { this.audio.play('click'); this._b6P2RemoveCoin(btn.dataset.uid); }
                }, {}, 'gameUI');
                Game.EventManager.on(walletCoinsEl, 'dragstart', e => {
                    const coinEl = e.target.closest('.b6p2-wc-removable');
                    if (!coinEl) return;
                    const _uid = coinEl.dataset.uid;
                    e.dataTransfer.setData('text/plain', `remove:${_uid}`);
                    coinEl.classList.add('b6p2-dragging');
                    const _cd = (this.state.game.p2Wallet || []).find(c => String(c.uid) === String(_uid));
                    if (_cd) {
                        const _isBill = _cd.denom >= 100, _imgW = _isBill ? 100 : 60;
                        const _ghost = document.createElement('div');
                        _ghost.style.cssText = 'position:absolute;left:-9999px;top:-9999px;background:rgba(255,255,255,0.95);border-radius:12px;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.25);pointer-events:none;';
                        _ghost.innerHTML = `<img src="../images/money/${_cd.denom}_yuan_${_cd.face}.png" style="width:${_imgW}px;height:auto;display:block;" draggable="false">`;
                        document.body.appendChild(_ghost);
                        e.dataTransfer.setDragImage(_ghost, Math.round(_imgW / 2) + 8, 40);
                        setTimeout(() => _ghost.remove(), 0);
                    }
                }, {}, 'gameUI');
                Game.EventManager.on(walletCoinsEl, 'dragend', e => {
                    e.target.closest('.b6p2-wc-removable')?.classList.remove('b6p2-dragging');
                }, {}, 'gameUI');
            }

            // 提示按鈕
            const hintBtn = document.getElementById('b6-p2-hint-btn');
            if (hintBtn) {
                Game.EventManager.on(hintBtn, 'click', () => {
                    this.audio.play('click');
                    if (diff === 'easy') {
                        // 先把付款區的金錢還回托盤，再切換到提示模式
                        (g.p2Wallet || []).forEach(coin => {
                            if (coin.trayUid) {
                                const tEl = document.querySelector(`.b6p2-coin-drag[data-tray-uid="${coin.trayUid}"]`);
                                if (tEl) { delete tEl.dataset.inUse; tEl.style.display = ''; }
                            }
                        });
                        g.p2Wallet   = [];
                        g.p2UidCtr   = 0;
                        g.p2ShowHint = true;
                        this._b6P2AutoSetGhostSlots();
                        this._b6P2UpdateWalletDisplay();
                        Game.Speech.speak('請按照提示放入正確的金錢');
                    } else {
                        // 普通 / 困難模式：A3 彈窗提示
                        this._showHardModeHintModal(total);
                    }
                }, {}, 'gameUI');
            }

            // 托盤接受從錢包拖回的幣
            const tray = document.getElementById('b6p2-tray-coins');
            if (tray) {
                Game.EventManager.on(tray, 'dragover', e => e.preventDefault(), {}, 'gameUI');
                Game.EventManager.on(tray, 'drop', e => {
                    e.preventDefault();
                    const data = e.dataTransfer.getData('text/plain');
                    if (data.startsWith('remove:')) this._b6P2RemoveCoin(data.replace('remove:', ''));
                }, {}, 'gameUI');
            }
        },

        _b6P2SetupDragDrop() {
            const walletCoins = document.getElementById('b6p2-wallet-coins');
            if (!walletCoins) return;

            // Desktop：拖曳盤 → 錢包
            document.querySelectorAll('.b6p2-coin-drag').forEach(dragEl => {
                const denom   = parseInt(dragEl.dataset.denom);
                const trayUid = dragEl.dataset.trayUid;
                const face    = dragEl.dataset.face;
                Game.EventManager.on(dragEl, 'dragstart', e => {
                    if (dragEl.dataset.inUse === 'true') { e.preventDefault(); return; }
                    e.dataTransfer.setData('text/plain', `tray:${trayUid}:${denom}:${face}`);
                    e.dataTransfer.effectAllowed = 'move';
                    dragEl.classList.add('b6p2-dragging');
                    const _isBill = denom >= 100;
                    const _imgW   = _isBill ? 100 : 60;
                    const _ghost  = document.createElement('div');
                    _ghost.style.cssText = 'position:absolute;left:-9999px;top:-9999px;background:rgba(255,255,255,0.95);border-radius:12px;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.25);pointer-events:none;';
                    _ghost.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" style="width:${_imgW}px;height:auto;display:block;" draggable="false">`;
                    document.body.appendChild(_ghost);
                    e.dataTransfer.setDragImage(_ghost, Math.round(_imgW / 2) + 8, 40);
                    setTimeout(() => _ghost.remove(), 0);
                }, {}, 'gameUI');
                Game.EventManager.on(dragEl, 'dragend', () => dragEl.classList.remove('b6p2-dragging'), {}, 'gameUI');
            });

            Game.EventManager.on(walletCoins, 'dragover', e => {
                e.preventDefault();
                walletCoins.classList.add('b6p2-drop-active');
            }, {}, 'gameUI');
            Game.EventManager.on(walletCoins, 'dragleave', e => {
                if (!walletCoins.contains(e.relatedTarget)) walletCoins.classList.remove('b6p2-drop-active');
            }, {}, 'gameUI');
            Game.EventManager.on(walletCoins, 'drop', e => {
                e.preventDefault();
                walletCoins.classList.remove('b6p2-drop-active');
                const data = e.dataTransfer.getData('text/plain');
                if (data.startsWith('remove:')) {
                    this._b6P2RemoveCoin(data.replace('remove:', ''));
                } else if (data.startsWith('tray:')) {
                    const parts = data.split(':');
                    const tUid = parts[1], d = parseInt(parts[2]), f = parts[3];
                    const tEl = document.querySelector(`.b6p2-coin-drag[data-tray-uid="${tUid}"]`);
                    if (tEl) { tEl.dataset.inUse = 'true'; tEl.style.display = 'none'; }
                    this._b6P2AddCoin(d, { face: f, trayUid: tUid });
                }
            }, {}, 'gameUI');

            // Touch drag：拖曳盤 → 錢包
            document.querySelectorAll('.b6p2-coin-drag').forEach(dragEl => {
                const denom   = parseInt(dragEl.dataset.denom);
                const trayUid = dragEl.dataset.trayUid;
                const face    = dragEl.dataset.face;
                const isBill  = denom >= 100;
                const imgW    = isBill ? 100 : 60;
                const offset  = Math.round(imgW / 2) + 8;
                let ghostEl = null;
                Game.EventManager.on(dragEl, 'touchstart', e => {
                    if (dragEl.dataset.inUse === 'true') return;
                    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
                    const t = e.touches[0];
                    ghostEl = document.createElement('div');
                    ghostEl.style.cssText = `position:fixed;z-index:9999;pointer-events:none;background:rgba(255,255,255,0.95);border-radius:12px;padding:8px;box-shadow:0 4px 16px rgba(0,0,0,0.3);transform:scale(1.05);left:${t.clientX - offset}px;top:${t.clientY - offset}px;`;
                    ghostEl.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" style="width:${imgW}px;height:auto;display:block;" draggable="false">`;
                    document.body.appendChild(ghostEl);
                }, { passive: true }, 'gameUI');
                Game.EventManager.on(dragEl, 'touchmove', e => {
                    e.preventDefault();
                    const t = e.touches[0];
                    if (ghostEl) { ghostEl.style.left = (t.clientX - offset) + 'px'; ghostEl.style.top = (t.clientY - offset) + 'px'; }
                    const wc = document.getElementById('b6p2-wallet-coins');
                    if (wc) {
                        const r = wc.getBoundingClientRect();
                        wc.classList.toggle('b6p2-drop-active', t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom);
                    }
                }, { passive: false }, 'gameUI');
                Game.EventManager.on(dragEl, 'touchend', e => {
                    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
                    const t = e.changedTouches[0];
                    const wc = document.getElementById('b6p2-wallet-coins');
                    if (wc) {
                        const r = wc.getBoundingClientRect();
                        wc.classList.remove('b6p2-drop-active');
                        if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
                            dragEl.dataset.inUse = 'true';
                            dragEl.style.display = 'none';
                            this._b6P2AddCoin(denom, { face, trayUid });
                        }
                    }
                }, { passive: true }, 'gameUI');
            });

            // Touch drag：錢包 → 拖回托盤（普通/困難模式的 .b6p2-wc-removable）
            const trayEl = document.getElementById('b6p2-tray-coins');
            Game.EventManager.on(walletCoins, 'touchstart', e => {
                const coinEl = e.target.closest('.b6p2-wc-removable');
                if (!coinEl) return;
                coinEl._touchDragUid = coinEl.dataset.uid;
                document.getElementById('b6p2-wallet-touch-ghost')?.remove();
                const t = e.touches[0];
                const cd = (this.state.game.p2Wallet || []).find(c => String(c.uid) === String(coinEl.dataset.uid));
                const isBill = cd?.denom >= 100, imgW = isBill ? 100 : 60, offset = Math.round(imgW / 2) + 8;
                const ghost = document.createElement('div');
                ghost.id = 'b6p2-wallet-touch-ghost';
                ghost.dataset.offset = String(offset);
                ghost.style.cssText = `position:fixed;z-index:9999;pointer-events:none;background:rgba(255,255,255,0.95);border-radius:12px;padding:8px;box-shadow:0 4px 16px rgba(0,0,0,0.3);transform:scale(1.05);left:${t.clientX - offset}px;top:${t.clientY - offset}px;`;
                ghost.innerHTML = cd ? `<img src="../images/money/${cd.denom}_yuan_${cd.face}.png" style="width:${imgW}px;height:auto;display:block;" draggable="false">` : '';
                document.body.appendChild(ghost);
            }, { passive: true }, 'gameUI');
            Game.EventManager.on(walletCoins, 'touchmove', e => {
                const ghost = document.getElementById('b6p2-wallet-touch-ghost');
                if (!ghost) return;
                e.preventDefault();
                const t = e.touches[0];
                const offset = parseInt(ghost.dataset.offset) || 30;
                ghost.style.left = (t.clientX - offset) + 'px';
                ghost.style.top  = (t.clientY - offset) + 'px';
                if (trayEl) {
                    const r = trayEl.getBoundingClientRect();
                    trayEl.classList.toggle('b6p2-drop-active', t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom);
                }
            }, { passive: false }, 'gameUI');
            Game.EventManager.on(walletCoins, 'touchend', e => {
                const ghost = document.getElementById('b6p2-wallet-touch-ghost');
                if (!ghost) return;
                const t = e.changedTouches[0];
                ghost.remove();
                if (trayEl) {
                    const r = trayEl.getBoundingClientRect();
                    trayEl.classList.remove('b6p2-drop-active');
                    if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
                        const coin = e.target.closest('.b6p2-wc-removable') || walletCoins.querySelector('[data-uid="' + (walletCoins._touchDragUid || '') + '"]');
                        const uid = coin?._touchDragUid || coin?.dataset?.uid;
                        if (uid) { this.audio.play('click'); this._b6P2RemoveCoin(uid); }
                    }
                }
            }, { passive: true }, 'gameUI');
        },

        _b6P2AddCoin(denom, opts = {}) {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            const face    = opts.face    || g.p2TrayFaces?.[denom] || 'front';
            const trayUid = opts.trayUid || null;
            if (g.p2ShowHint && g.p2HintSlots?.length) {
                const slotIdx = g.p2HintSlots.findIndex(s => s.denom === denom && !s.filled);
                if (slotIdx === -1) { this.audio.play('error'); return; }
                g.p2HintSlots[slotIdx].filled = true;
                this.audio.play('coin');
                const uid = ++g.p2UidCtr;
                g.p2Wallet.push({ denom, uid, isBill: denom >= 100, face, trayUid });
                const slotEl = document.querySelector(`[data-b6p2-hint-idx="${slotIdx}"]`);
                if (slotEl) slotEl.classList.remove('b6p2-ghost-slot');
                this._b6P2UpdateStatusOnly();
                if (diff === 'easy') this._b6P2UpdateTrayHints();
                // auto-confirm moved to speech callback below
            } else {
                this.audio.play('coin');
                const uid = ++g.p2UidCtr;
                g.p2Wallet.push({ denom, uid, isBill: denom >= 100, face, trayUid });
                const coinsEl = document.getElementById('b6p2-wallet-coins');
                if (coinsEl) {
                    coinsEl.querySelector('.b6p2-wallet-empty')?.remove();
                    const canRemove = diff !== 'easy';
                    const isBill = denom >= 100;
                    const w = isBill ? 100 : 60;
                    const div = document.createElement('div');
                    div.className = 'b6p2-wallet-coin b6p2-coin-new' + (canRemove ? ' b6p2-wc-removable' : '');
                    if (canRemove) { div.setAttribute('draggable', 'true'); div.dataset.uid = String(uid); }
                    div.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                         style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;"
                         onerror="this.style.display='none'" draggable="false">
                    ${canRemove ? `<button class="b6p2-wc-remove" data-uid="${uid}" title="移除">✕</button>` : ''}`;
                    coinsEl.appendChild(div);
                }
                this._b6P2UpdateStatusOnly();
            }
            // 簡單/普通模式：播累加金額，播完後再執行下一個動作
            if (diff !== 'hard') {
                const walletNow = this._b6P2GetWalletTotal();
                const req = g.p2Total;
                const allFilled = g.p2ShowHint && g.p2HintSlots?.length && g.p2HintSlots.every(s => s.filled);
                const nowEnough = walletNow >= req;
                Game.TimerManager.setTimeout(() => {
                    Game.Speech.speak(toTWD(walletNow), () => {
                        if (diff === 'easy' && (allFilled || (!g.p2ShowHint && nowEnough)) && !this.state.isProcessing) {
                            // 簡單模式：所有 ghost slot 填完，或自由模式金額足夠 → 自動確認
                            Game.TimerManager.setTimeout(() => this._b6P2HandleConfirm(g.p2Total), 300, 'ui');
                        } else if (diff === 'normal' && nowEnough) {
                            // 普通模式：金額足夠 → 播提示語音（按鈕已由 _b6P2UpdateStatusOnly 啟用）
                            const msg = walletNow === req ? '剛好！可以確認付款了！' : '金額足夠，可以確認付款了！';
                            Game.TimerManager.setTimeout(() => Game.Speech.speak(msg), 100, 'ui');
                        }
                    });
                }, 80, 'ui');
            }
        },

        _b6P2RemoveCoin(uid) {
            const g = this.state.game;
            // 找到要移除的幣（取得 trayUid 以恢復托盤元素）
            const coinIdx = g.p2Wallet.findIndex(c => String(c.uid) === String(uid));
            const coin = coinIdx !== -1 ? g.p2Wallet[coinIdx] : null;
            // 恢復托盤元素顯示
            if (coin?.trayUid) {
                const tEl = document.querySelector(`.b6p2-coin-drag[data-tray-uid="${coin.trayUid}"]`);
                if (tEl) { delete tEl.dataset.inUse; tEl.style.display = ''; }
            }
            if (g.p2ShowHint && g.p2HintSlots?.length) {
                if (coinIdx !== -1) {
                    let filledSoFar = 0;
                    for (let i = 0; i < g.p2HintSlots.length; i++) {
                        if (g.p2HintSlots[i].filled && g.p2HintSlots[i].denom === coin.denom && filledSoFar === coinIdx) {
                            g.p2HintSlots[i].filled = false; break;
                        }
                        if (g.p2HintSlots[i].filled) filledSoFar++;
                    }
                    g.p2Wallet.splice(coinIdx, 1);
                }
                this._b6P2UpdateWalletDisplay();
            } else {
                g.p2Wallet = g.p2Wallet.filter(c => String(c.uid) !== String(uid));
                document.querySelector(`.b6p2-wc-removable[data-uid="${uid}"]`)?.remove();
                const coinsEl = document.getElementById('b6p2-wallet-coins');
                if (coinsEl && g.p2Wallet.length === 0)
                    coinsEl.innerHTML = '<span class="b6p2-wallet-empty">把金錢卡片拖曳到這裡</span>';
                this._b6P2UpdateStatusOnly();
            }
        },

        _b6P2GetWalletTotal() {
            return this.state.game.p2Wallet.reduce((s, c) => s + c.denom, 0);
        },

        _b6P2UpdateStatusOnly() {
            const g      = this.state.game;
            const diff   = this.state.settings.difficulty;
            const total  = this._b6P2GetWalletTotal();
            const req    = g.p2Total;
            const btnOk  = diff === 'hard' ? (total > 0) : (total >= req);
            const enough = total >= req;
            const totalEl = document.getElementById('b6p2-wallet-total');
            if (totalEl) {
                totalEl.textContent = total + ' 元';
                totalEl.className = 'b6p2-wallet-total-val' + (enough ? ' enough' : total > 0 ? ' not-enough' : '');
            }
            const confirmBtn = document.getElementById('b6-p2-confirm-btn');
            if (confirmBtn) {
                confirmBtn.disabled = !btnOk;
                confirmBtn.classList.toggle('ready', btnOk);
                confirmBtn.textContent = btnOk ? '✅ 確認付款' : '確認付款';
            }
        },

        _b6P2UpdateWalletDisplay() {
            const g      = this.state.game;
            const diff   = this.state.settings.difficulty;
            const total  = this._b6P2GetWalletTotal();
            const req    = g.p2Total;
            const enough = total >= req;
            const btnOk  = diff === 'hard' ? (total > 0) : enough;
            const totalEl = document.getElementById('b6p2-wallet-total');
            if (totalEl) {
                totalEl.textContent = total + ' 元';
                totalEl.className = 'b6p2-wallet-total-val' + (enough ? ' enough' : total > 0 ? ' not-enough' : '');
            }
            const confirmBtn = document.getElementById('b6-p2-confirm-btn');
            if (confirmBtn) {
                confirmBtn.disabled = !btnOk;
                confirmBtn.classList.toggle('ready', btnOk);
                confirmBtn.textContent = btnOk ? '✅ 確認付款' : '確認付款';
            }
            const coinsEl = document.getElementById('b6p2-wallet-coins');
            if (!coinsEl) return;
            if (g.p2ShowHint && g.p2HintSlots?.length) {
                coinsEl.innerHTML = g.p2HintSlots.map((slot, idx) => {
                    if (!slot.filled) {
                        const isBill = slot.denom >= 100;
                        const w = isBill ? 100 : 60;
                        return `<div class="b6p2-wallet-coin b6p2-ghost-slot" data-b6p2-hint-idx="${idx}">
                            <img src="../images/money/${slot.denom}_yuan_${slot.face || 'front'}.png" alt="${slot.denom}元"
                                 style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;"
                                 onerror="this.style.display='none'" draggable="false"></div>`;
                    }
                    let filledCount = 0;
                    let coin = null;
                    for (let i = 0; i <= idx; i++) {
                        if (g.p2HintSlots[i].filled) {
                            if (i === idx) { coin = g.p2Wallet[filledCount]; break; }
                            filledCount++;
                        }
                    }
                    if (!coin) return '';
                    const isBill = coin.denom >= 100;
                    const w = isBill ? 100 : 60;
                    return `<div class="b6p2-wallet-coin" data-b6p2-hint-idx="${idx}">
                        <img src="../images/money/${coin.denom}_yuan_${coin.face}.png" alt="${coin.denom}元"
                             style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;"
                             onerror="this.style.display='none'" draggable="false"></div>`;
                }).join('');
            } else if (g.p2Wallet.length === 0) {
                coinsEl.innerHTML = '<span class="b6p2-wallet-empty">把錢幣拖曳到這裡 👈</span>';
            } else {
                const canRemove = diff !== 'easy';
                coinsEl.innerHTML = g.p2Wallet.map(coin => {
                    const isBill = coin.denom >= 100;
                    const w = isBill ? 100 : 60;
                    const cls = 'b6p2-wallet-coin' + (canRemove ? ' b6p2-wc-removable' : '');
                    const extra = canRemove ? `draggable="true" data-uid="${coin.uid}"` : '';
                    const removeBtn = canRemove ? `<button class="b6p2-wc-remove" data-uid="${coin.uid}" title="移除">✕</button>` : '';
                    return `<div class="${cls}" ${extra}>
                        <img src="../images/money/${coin.denom}_yuan_${coin.face}.png" alt="${coin.denom}元"
                             style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;"
                             onerror="this.style.display='none'" draggable="false">
                        ${removeBtn}</div>`;
                }).join('');
            }
        },

        _b6P2AutoSetGhostSlots() {
            const g     = this.state.game;
            const total = g.p2Total;

            // 取得托盤中實際可用的金幣（未被拖走的）
            const available = [];
            document.querySelectorAll('.b6p2-coin-drag').forEach(el => {
                if (el.dataset.inUse !== 'true' && el.style.display !== 'none') {
                    available.push({ denom: parseInt(el.dataset.denom), face: el.dataset.face || 'front' });
                }
            });

            // 找出最小超額付款組合（2^n 子集搜尋，n 通常 ≤ 8）
            const optimal = this._b6P2FindOptimalPayment(available, total);
            g.p2HintSlots = optimal.map(c => ({ denom: c.denom, filled: false, face: c.face }));
            g.p2ShowHint  = true;
        },

        // 簡單模式：在付款托盤幣上依序顯示「點這裡」提示（每次只高亮下一個）
        _b6P2UpdateTrayHints() {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            document.querySelectorAll('.b6p2-coin-drag').forEach(el => {
                el.classList.remove('b6-product-here-hint');
            });
            if (diff !== 'easy') return;
            const nextSlot = (g.p2HintSlots || []).find(s => !s.filled);
            if (!nextSlot) return;
            const coinEl = Array.from(document.querySelectorAll('.b6p2-coin-drag')).find(el =>
                el.dataset.inUse !== 'true' && el.style.display !== 'none' &&
                parseInt(el.dataset.denom) === nextSlot.denom
            );
            if (coinEl) coinEl.classList.add('b6-product-here-hint');
        },

        // ── 最小超額子集搜尋 ─────────────────────────────────────
        _b6P2FindOptimalPayment(coins, total) {
            const n = coins.length;
            if (n === 0) return [];
            if (n > 22) {
                // 超大集合：退化貪婪（實際不會發生）
                return coins.slice().sort((a,b) => b.denom - a.denom).reduce((acc, c) => {
                    const s = acc.reduce((t,x)=>t+x.denom,0);
                    if (s < total) acc.push(c);
                    return acc;
                }, []);
            }
            let bestMask = -1, bestSum = Infinity;
            for (let mask = 1; mask < (1 << n); mask++) {
                let sum = 0;
                for (let i = 0; i < n; i++) { if (mask & (1 << i)) sum += coins[i].denom; }
                if (sum >= total && sum < bestSum) { bestSum = sum; bestMask = mask; }
            }
            if (bestMask === -1) return coins; // 不應發生（預算 ≥ 總額）
            const result = [];
            for (let i = 0; i < n; i++) { if (bestMask & (1 << i)) result.push(coins[i]); }
            return result.sort((a, b) => b.denom - a.denom);
        },

        _b6P2HandleConfirm(total) {
            if (this.state.isProcessing) return;
            this.state.isProcessing = true;
            const g      = this.state.game;
            const diff   = this.state.settings.difficulty;
            const wTotal = this._b6P2GetWalletTotal();

            // 付款不足
            if (wTotal < total) {
                this.state.isProcessing = false;
                this.audio.play('error');
                g.p2ErrorCount = (g.p2ErrorCount || 0) + 1;
                this._showCenterFeedback('❌', '付太少了！');
                Game.Speech.speak(`付太少了，還差${toTWD(total - wTotal)}，請再拖入金錢`);
                const walletArea = document.getElementById('b6p2-wallet-area');
                if (walletArea) {
                    walletArea.style.animation = 'b6p2Shake 0.4s ease';
                    Game.TimerManager.setTimeout(() => { walletArea.style.animation = ''; }, 500, 'ui');
                }
                // 普通/困難模式：退回所有金錢（恢復托盤 + 清空付款區）
                if (diff === 'normal' || diff === 'hard') {
                    (g.p2Wallet || []).forEach(coin => {
                        if (coin.trayUid) {
                            const tEl = document.querySelector(`.b6p2-coin-drag[data-tray-uid="${coin.trayUid}"]`);
                            if (tEl) { tEl.dataset.inUse = 'false'; tEl.style.display = ''; }
                        }
                    });
                    g.p2Wallet = [];
                    const coinsEl = document.getElementById('b6p2-wallet-coins');
                    if (coinsEl) coinsEl.innerHTML = '<span class="b6p2-wallet-empty">把金錢卡片拖曳到這裡</span>';
                    this._b6P2UpdateStatusOnly();
                }
                // 普通模式：3次付款錯誤自動提示
                if (diff === 'normal' && g.p2ErrorCount >= 3) {
                    g.p2ErrorCount = 0;
                    Game.TimerManager.setTimeout(() => this._showHardModeHintModal(total), 900, 'ui');
                }
                return;
            }
            // 付款成功
            const change = wTotal - total;
            this.audio.play('correct');
            this._showCenterFeedback('✅', '付款成功！');
            g.paidAmount = wTotal;
            if (change === 0) {
                // 剛好付清：語音播完後直接進入結果（suppressSpeech=true 避免結果頁重複播音）
                Game.Speech.speak(`剛好${toTWD(wTotal)}，買菜成功！`, () => {
                    Game.TimerManager.setTimeout(() => {
                        this.state.isProcessing = false;
                        this._showChangeResult(wTotal, 0, true);
                    }, 400, 'turnTransition');
                });
            } else {
                // 超付：進入找零拖回階段
                Game.Speech.speak(`付了${toTWD(wTotal)}`, () => {
                    Game.TimerManager.setTimeout(() => {
                        this.state.isProcessing = false;
                        this._b6P2ShowChangeReturn(wTotal, total, change);
                    }, 400, 'turnTransition');
                });
            }
        },

        // ── 找零階段：重新設計（可重複拖曳面額盤 + 確認找零按鈕）──
        _b6P2ShowChangeReturn(paid, total, change) {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');

            // 清除付款頁殘留的中央回饋（TimerManager.clearAll 取消了移除 timer）
            document.querySelector('.b-center-feedback')?.remove();

            // 重置狀態
            g.changeErrorCount = 0;
            g.changePlaced     = [];
            g.changeGhostMode  = false;
            g.changeHintSlots  = [];
            g.changeTotal      = change;

            // 貪婪最佳解（先算以確保托盤包含所需面額，ghost slot 提示用）
            const _allDenoms = [1000, 500, 100, 50, 10, 5, 1];
            const greedySolution = {};
            let remSol = change;
            for (const d of _allDenoms) {
                const cnt = Math.floor(remSol / d);
                if (cnt > 0) { greedySolution[d] = cnt; remSol -= cnt * d; }
            }
            g.changeGreedySolution = greedySolution;

            // ── 決定托盤顯示的面額（包含貪婪解用到的面額）──────────────
            let trayDenoms;
            if (change < 100)       { trayDenoms = [50, 10, 5, 1]; }
            else if (change < 1000) { trayDenoms = [500, 100, 50, 10, 5, 1]; }
            else                    { trayDenoms = [1000, 500, 100, 50, 10, 5, 1]; }
            Object.keys(greedySolution).map(Number).forEach(d => {
                if (!trayDenoms.includes(d)) trayDenoms = [d, ...trayDenoms].sort((a, b) => b - a);
            });

            // 各面額隨機正反面（一次產生，全程使用）
            const trayFaces = {};
            trayDenoms.forEach(d => { trayFaces[d] = Math.random() < 0.5 ? 'back' : 'front'; });
            g.changeTrayFaces = trayFaces;

            // ── 市場與難度標籤 ──────────────────────────────────────
            const mktKey   = g.mission._mktKey || this.state.settings.marketType;
            const mkt      = B6_MARKETS[mktKey] || B6_MARKETS.traditional;
            const diffLabel = { easy: '簡單模式', normal: '普通模式', hard: '困難模式' }[diff] || '';

            // ── 面額托盤 HTML（可重複拖曳）──────────────────────────
            const trayHtml = trayDenoms.map(d => {
                const isBill = d >= 100;
                return `<div class="b6c-denom-card" draggable="true" data-denom="${d}" data-face="${trayFaces[d]}" title="${d}元">
                    <img src="../images/money/${d}_yuan_${trayFaces[d]}.png" alt="${d}元"
                         class="${isBill ? 'banknote-img' : 'coin-img'}" draggable="false" onerror="this.style.display='none'">
                    <span class="b1-denom-label">${d}元</span>
                </div>`;
            }).join('');

            // ── 錢包剩餘金額（付款後）───────────────────────────────
            const walletRemaining = g.mission.budget - paid;
            g.changeWalletBase = walletRemaining;

            // ── 靜態錢包圖示：貪婪分解剩餘金額 ─────────────────────
            const _wDenoms = [1000, 500, 100, 50, 10, 5, 1];
            const walletCoins = [];
            let _rem = walletRemaining;
            for (const d of _wDenoms) {
                const cnt = Math.floor(_rem / d);
                for (let i = 0; i < cnt; i++) walletCoins.push(d);
                _rem -= cnt * d;
            }
            const walletStaticHtml = walletCoins.map(d => {
                const isBill = d >= 100;
                const face   = Math.random() < 0.5 ? 'back' : 'front';
                const w      = isBill ? 80 : 52;
                return `<div class="b6c-wc-static">
                    <img src="../images/money/${d}_yuan_${face}.png" alt="${d}元"
                         style="width:${w}px;height:${isBill ? 'auto' : w+'px'};display:block;" draggable="false" onerror="this.style.display='none'">
                    <span class="b1-denom-label">${d}元</span>
                </div>`;
            }).join('');

            // ── 收據清單（與付款頁相同）─────────────────────────────
            const _changeAllItems = [];
            (g.selectedItems || []).forEach(({ stall, id }) => {
                const item = (_currentStalls[stall]?.items || []).find(i => i.id === id);
                if (item) _changeAllItems.push({ icon: item.icon || '', imageUrl: item.imageUrl, name: item.name, price: item.price });
            });

            // ── 建構完整頁面 ─────────────────────────────────────────
            const app = document.getElementById('app');
            app.innerHTML = `
            <div class="b-header">
                <div class="b-header-left">
                    <img src="../images/common/hint_detective.png" alt="" class="b-header-mascot" onerror="this.style.display='none'">
                    <span class="b-header-unit">${mkt.icon} ${mkt.name}</span>
                </div>
                <div class="b-header-center">步驟三：找零</div>
                <div class="b-header-right">
                    <span class="b-progress">第 ${g.currentRound + 1} 關 / 共 ${g.totalRounds} 關</span>
                    <button class="b-reward-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                    <button class="b-back-btn" onclick="Game.showSettings()">返回設定</button>
                </div>
            </div>
            <div class="game-container">
                <div class="b6p2-ref-card b6c-compact-card">
                    <div class="b6p2-ref-header">
                        <span class="b6p2-ref-icon">${mkt.icon}</span>
                        <span class="b6p2-ref-title">${mkt.name}</span>
                        <span class="b6-p2-hint-wrap">
                            <img src="../images/common/hint_detective.png" alt="" class="b6-task-mascot" onerror="this.style.display='none'">
                            <button class="b-hint-btn" id="b6c-hint-btn">💡 提示</button>
                        </span>
                    </div>
                    <div class="b6c-change-need-big">需找零 <strong class="b6c-need-num">${change}</strong> 元</div>
                </div>
                <div class="b6p2-tray">
                    <div class="b6p2-tray-title">💰 找零面額（可重複拖曳）</div>
                    <div class="b6c-tray-coins" id="b6c-tray-coins">${trayHtml}</div>
                </div>
                <div class="b6p2-wallet-area b6c-change-area">
                    <div class="b6c-change-title b6c-change-title-bar">
                        <div style="flex:1;"></div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            💼 我的錢包
                            <span class="b6c-wallet-info${diff === 'hard' ? ' b6c-hidden' : ''}" id="b6c-wallet-info"><span id="b6c-wallet-balance">${walletRemaining}</span>元（已找回<span id="b6c-placed-total">0</span>/${change} 元）</span>
                        </div>
                        <div style="flex:1;display:flex;justify-content:flex-end;">
                            <button class="b6c-wallet-toggle-btn" id="b6c-wallet-toggle">▼ 收合</button>
                        </div>
                    </div>
                    <div class="b6c-wallet-split">
                        <div class="b6c-wallet-split-left" id="b6c-wallet-left" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                            ${walletStaticHtml || '<span class="b6p2-wallet-empty" style="font-size:12px;">（餘額為0）</span>'}
                        </div>
                        <div class="b6c-wallet-split-right b6p2-drop-zone b6c-drop-zone" id="b6c-wallet-zone">
                            <div id="b6c-wallet-coins" style="display:flex;flex-wrap:wrap;gap:10px;width:100%;align-items:center;justify-content:center;min-height:60px;">
                                <span class="b6p2-wallet-empty">把找零金錢拖曳到這裡</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="b6c-confirm-btn-main" id="b6c-confirm-btn" disabled>✅ 確認找零</button>
            </div>`;

            // 簡單模式：立即顯示 ghost slots（不等語音播完）
            if (diff === 'easy') this._b6P2ShowChangeGhostSlots(change);
            Game.Speech.speak(`找您${toTWD(change)}，請把找回的金錢，拖曳到我的錢包`);
            this._b6P2SetupChangeInteraction(change, paid);
        },

        _b6P2SetupChangeInteraction(change, paid) {
            const g          = this.state.game;
            const diff       = this.state.settings.difficulty;
            const trayEl     = document.getElementById('b6c-tray-coins');
            const walletZone = document.getElementById('b6c-wallet-zone');
            const confirmBtn = document.getElementById('b6c-confirm-btn');
            const hintBtn    = document.getElementById('b6c-hint-btn');
            if (!trayEl || !walletZone) return;

            // ── 展開/收起付款後餘額（左側錢包面板）──────────────────
            const walletToggleBtn  = document.getElementById('b6c-wallet-toggle');
            const walletLeftPanel  = document.getElementById('b6c-wallet-left');
            if (walletToggleBtn && walletLeftPanel) {
                Game.EventManager.on(walletToggleBtn, 'click', () => {
                    const isOpen = walletLeftPanel.style.display !== 'none';
                    walletLeftPanel.style.display = isOpen ? 'none' : 'flex';
                    walletToggleBtn.textContent = isOpen ? '▶ 展開' : '▼ 收合';
                }, {}, 'gameUI');
            }

            // ── 放置一枚金幣到錢包 ──────────────────────────────────
            const handleDrop = (denom) => {
                const face = g.changeTrayFaces?.[denom] || 'front';
                const uid  = 'ch' + Date.now() + Math.floor(Math.random() * 10000);

                if (g.changeGhostMode) {
                    // Ghost slot 模式：只接受對應面額
                    const slotIdx = (g.changeHintSlots || []).findIndex(s => s.denom === denom && !s.filled);
                    if (slotIdx === -1) { this.audio.play('error'); return; }
                    this.audio.play('coin');
                    g.changeHintSlots[slotIdx].filled = true;
                    g.changeHintSlots[slotIdx].uid = uid;
                    g.changePlaced.push({ denom, uid, face });
                } else {
                    this.audio.play('coin');
                    g.changePlaced.push({ denom, uid, face });
                }
                this._b6P2UpdateChangeDisplay(change);
                this._b6P2RenderWalletCoins(change);
                if (g.changeGhostMode) this._b6P2UpdateChangeTrayHints();
                // 放置後播放累加金額語音
                const runningTotal = (g.changePlaced || []).reduce((s, p) => s + p.denom, 0);
                Game.Speech.speak(`找回${toTWD(runningTotal)}`);
            };

            // ── Desktop drag-from-tray ──────────────────────────────
            trayEl.querySelectorAll('.b6c-denom-card').forEach(card => {
                const denom = parseInt(card.dataset.denom);
                const face  = card.dataset.face || 'front';
                Game.EventManager.on(card, 'dragstart', e => {
                    e.dataTransfer.setData('text/plain', `chdenom:${denom}`);
                    card.classList.add('b6p2-dragging');
                    const _isBill = denom >= 100;
                    const _imgW   = _isBill ? 100 : 60;
                    const _ghost  = document.createElement('div');
                    _ghost.style.cssText = 'position:absolute;left:-9999px;top:-9999px;background:rgba(255,255,255,0.95);border-radius:12px;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.25);pointer-events:none;';
                    _ghost.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" style="width:${_imgW}px;height:auto;display:block;" draggable="false">`;
                    document.body.appendChild(_ghost);
                    e.dataTransfer.setDragImage(_ghost, Math.round(_imgW / 2) + 8, 40);
                    setTimeout(() => _ghost.remove(), 0);
                }, {}, 'gameUI');
                Game.EventManager.on(card, 'dragend', () => card.classList.remove('b6p2-dragging'), {}, 'gameUI');
            });
            Game.EventManager.on(walletZone, 'dragover', e => { e.preventDefault(); walletZone.classList.add('b6p2-drop-active'); }, {}, 'gameUI');
            Game.EventManager.on(walletZone, 'dragleave', e => { if (!walletZone.contains(e.relatedTarget)) walletZone.classList.remove('b6p2-drop-active'); }, {}, 'gameUI');
            Game.EventManager.on(walletZone, 'drop', e => {
                e.preventDefault(); walletZone.classList.remove('b6p2-drop-active');
                const d = e.dataTransfer.getData('text/plain');
                if (d.startsWith('chdenom:')) handleDrop(parseInt(d.replace('chdenom:', '')));
            }, {}, 'gameUI');
            // 防呆：對 walletCoins 層加 dragover（僅 preventDefault，不加 drop）
            // ghost slot 有 pointer-events:none 時事件穿透至此層，需明確 preventDefault 讓瀏覽器允許 drop
            // drop 事件繼續冒泡由 walletZone 的 drop handler 統一處理，避免重複觸發
            const walletCoinsInner = document.getElementById('b6c-wallet-coins');
            if (walletCoinsInner) {
                Game.EventManager.on(walletCoinsInner, 'dragover', e => { e.preventDefault(); walletZone.classList.add('b6p2-drop-active'); }, {}, 'gameUI');
            }

            // ── Touch drag-from-tray ────────────────────────────────
            trayEl.querySelectorAll('.b6c-denom-card').forEach(card => {
                const denom  = parseInt(card.dataset.denom);
                const face   = card.dataset.face || 'front';
                const isBill = denom >= 100;
                const imgW   = isBill ? 100 : 60;
                const offset = Math.round(imgW / 2) + 8;
                let ghostEl = null;
                Game.EventManager.on(card, 'touchstart', e => {
                    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
                    const t = e.touches[0];
                    ghostEl = document.createElement('div');
                    ghostEl.style.cssText = `position:fixed;z-index:9999;pointer-events:none;background:rgba(255,255,255,0.95);border-radius:12px;padding:8px;box-shadow:0 4px 16px rgba(0,0,0,0.3);transform:scale(1.05);left:${t.clientX - offset}px;top:${t.clientY - offset}px;`;
                    ghostEl.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" style="width:${imgW}px;height:auto;display:block;" draggable="false">`;
                    document.body.appendChild(ghostEl);
                }, { passive: true }, 'gameUI');
                Game.EventManager.on(card, 'touchmove', e => {
                    e.preventDefault();
                    const t = e.touches[0];
                    if (ghostEl) { ghostEl.style.left = (t.clientX - offset) + 'px'; ghostEl.style.top = (t.clientY - offset) + 'px'; }
                    const r = walletZone.getBoundingClientRect();
                    walletZone.classList.toggle('b6p2-drop-active',
                        t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom);
                }, { passive: false }, 'gameUI');
                Game.EventManager.on(card, 'touchend', e => {
                    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
                    walletZone.classList.remove('b6p2-drop-active');
                    const t = e.changedTouches[0];
                    const r = walletZone.getBoundingClientRect();
                    if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) handleDrop(denom);
                }, { passive: true }, 'gameUI');
            });

            // ── 移除錢包中的金幣（點 × 按鈕，簡單模式禁用）──────────
            const walletCoinsEl = document.getElementById('b6c-wallet-coins');
            if (walletCoinsEl && diff !== 'easy') {
                Game.EventManager.on(walletCoinsEl, 'click', e => {
                    const btn = e.target.closest('.b6c-wc-remove');
                    if (!btn) return;
                    this.audio.play('click');
                    if (g.changeGhostMode) {
                        const slotIdx = parseInt(btn.dataset.slotIdx);
                        if (!isNaN(slotIdx) && g.changeHintSlots[slotIdx]) {
                            const uid = g.changeHintSlots[slotIdx].uid;
                            g.changeHintSlots[slotIdx].filled = false;
                            g.changeHintSlots[slotIdx].uid = null;
                            g.changePlaced = g.changePlaced.filter(p => p.uid !== uid);
                        }
                    } else {
                        const uid = btn.dataset.uid;
                        g.changePlaced = g.changePlaced.filter(p => p.uid !== uid);
                    }
                    this._b6P2UpdateChangeDisplay(change);
                    this._b6P2RenderWalletCoins(change);
                }, {}, 'gameUI');
            }

            // ── 確認找零按鈕 ────────────────────────────────────────
            if (confirmBtn) {
                Game.EventManager.on(confirmBtn, 'click', () => {
                    if (this.state.isProcessing) return;
                    this.state.isProcessing = true;
                    this._b6P2ConfirmChange(change, paid);
                }, {}, 'gameUI');
            }

            // ── 提示按鈕 ────────────────────────────────────────────
            if (hintBtn) {
                Game.EventManager.on(hintBtn, 'click', () => {
                    if (this.state.isProcessing) return;
                    this.audio.play('click');
                    if (diff === 'hard') {
                        // 困難模式：揭露錢包餘額資訊
                        const walletInfo = document.getElementById('b6c-wallet-info');
                        if (walletInfo) walletInfo.classList.remove('b6c-hidden');
                        this._b6P2ShowChangeHintModal(change);
                    } else {
                        this._b6P2ShowChangeGhostSlots(change);
                    }
                }, {}, 'gameUI');
            }

            // ── 錢包幣拖回找零面額區（拖出 wallet zone 即移除，簡單模式禁用）──
            let _draggingWalletUid = null;
            if (walletCoinsEl && diff !== 'easy') {
                Game.EventManager.on(walletCoinsEl, 'dragstart', e => {
                    const item = e.target.closest('.b6c-wc-item[data-uid]');
                    if (!item) return;
                    _draggingWalletUid = item.dataset.uid;
                    e.dataTransfer.setData('text/plain', `b6cuid:${_draggingWalletUid}`);
                    e.dataTransfer.effectAllowed = 'move';
                    const _cd = (this.state.game.changePlaced || []).find(c => c.uid === _draggingWalletUid);
                    if (_cd) {
                        const _isBill = _cd.denom >= 100, _imgW = _isBill ? 100 : 60;
                        const _ghost = document.createElement('div');
                        _ghost.style.cssText = 'position:absolute;left:-9999px;top:-9999px;background:rgba(255,255,255,0.95);border-radius:12px;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.25);pointer-events:none;';
                        _ghost.innerHTML = `<img src="../images/money/${_cd.denom}_yuan_${_cd.face}.png" style="width:${_imgW}px;height:auto;display:block;" draggable="false">`;
                        document.body.appendChild(_ghost);
                        e.dataTransfer.setDragImage(_ghost, Math.round(_imgW / 2) + 8, 40);
                        setTimeout(() => _ghost.remove(), 0);
                    }
                }, {}, 'gameUI');
            }
            if (diff !== 'easy') {
                Game.EventManager.on(document, 'dragend', e => {
                    if (!_draggingWalletUid) return;
                    const uid = _draggingWalletUid;
                    _draggingWalletUid = null;
                    if (e.dataTransfer.dropEffect === 'none') {
                        if (g.changeGhostMode) {
                            const slotIdx = (g.changeHintSlots || []).findIndex(s => s.uid === uid);
                            if (slotIdx !== -1) { g.changeHintSlots[slotIdx].filled = false; g.changeHintSlots[slotIdx].uid = null; }
                        }
                        g.changePlaced = (g.changePlaced || []).filter(p => p.uid !== uid);
                        this.audio.play('click');
                        this._b6P2UpdateChangeDisplay(change);
                        this._b6P2RenderWalletCoins(change);
                    }
                }, {}, 'gameUI');
            }

            // ── Touch 拖回：錢包幣觸控拖出 wallet zone 即移除（簡單模式禁用）──
            if (walletCoinsEl && diff !== 'easy') {
                let _touchWalletUid = null;
                let _touchGhostEl   = null;
                Game.EventManager.on(walletCoinsEl, 'touchstart', e => {
                    const item = e.target.closest('.b6c-wc-item[data-uid]');
                    if (!item) return;
                    _touchWalletUid = item.dataset.uid;
                    if (_touchGhostEl) { _touchGhostEl.remove(); _touchGhostEl = null; }
                    const t = e.touches[0];
                    const cd = (this.state.game.changePlaced || []).find(c => c.uid === _touchWalletUid);
                    const isBill = cd?.denom >= 100, imgW = isBill ? 100 : 60, offset = Math.round(imgW / 2) + 8;
                    _touchGhostEl = document.createElement('div');
                    _touchGhostEl.dataset.offset = String(offset);
                    _touchGhostEl.style.cssText = `position:fixed;z-index:9999;pointer-events:none;background:rgba(255,255,255,0.95);border-radius:12px;padding:8px;box-shadow:0 4px 16px rgba(0,0,0,0.3);transform:scale(1.05);left:${t.clientX - offset}px;top:${t.clientY - offset}px;`;
                    _touchGhostEl.innerHTML = cd ? `<img src="../images/money/${cd.denom}_yuan_${cd.face}.png" style="width:${imgW}px;height:auto;display:block;" draggable="false">` : '';
                    document.body.appendChild(_touchGhostEl);
                }, { passive: true }, 'gameUI');
                Game.EventManager.on(walletCoinsEl, 'touchmove', e => {
                    if (!_touchGhostEl) return;
                    e.preventDefault();
                    const t = e.touches[0];
                    const offset = parseInt(_touchGhostEl.dataset.offset) || 30;
                    _touchGhostEl.style.left = (t.clientX - offset) + 'px';
                    _touchGhostEl.style.top  = (t.clientY - 40) + 'px';
                }, { passive: false }, 'gameUI');
                Game.EventManager.on(walletCoinsEl, 'touchend', e => {
                    if (_touchGhostEl) { _touchGhostEl.remove(); _touchGhostEl = null; }
                    if (!_touchWalletUid) return;
                    const uid = _touchWalletUid;
                    _touchWalletUid = null;
                    const t   = e.changedTouches[0];
                    const zone = document.getElementById('b6c-wallet-zone');
                    const r    = zone?.getBoundingClientRect();
                    const inside = r && t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;
                    if (!inside) {
                        if (g.changeGhostMode) {
                            const slotIdx = (g.changeHintSlots || []).findIndex(s => s.uid === uid);
                            if (slotIdx !== -1) { g.changeHintSlots[slotIdx].filled = false; g.changeHintSlots[slotIdx].uid = null; }
                        }
                        g.changePlaced = (g.changePlaced || []).filter(p => p.uid !== uid);
                        this.audio.play('click');
                        this._b6P2UpdateChangeDisplay(change);
                        this._b6P2RenderWalletCoins(change);
                    }
                }, { passive: true }, 'gameUI');
            }
        },

        _b6P2UpdateChangeDisplay(change) {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            const placedTotal = (g.changePlaced || []).reduce((s, p) => s + p.denom, 0);
            const pct    = change > 0 ? Math.min(Math.round(placedTotal / change * 100), 100) : 0;
            const exact  = placedTotal === change;
            // 已找回進度（整合至錢包標題，hard 模式隱藏但仍更新數值）
            const totalEl = document.getElementById('b6c-placed-total');
            if (totalEl) totalEl.textContent = placedTotal;
            // 錢包餘額 = 付款後剩餘 + 已找回
            const balanceEl = document.getElementById('b6c-wallet-balance');
            if (balanceEl) balanceEl.textContent = (g.changeWalletBase || 0) + placedTotal;
            const confirmBtn = document.getElementById('b6c-confirm-btn');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.classList.toggle('ready', exact);
                // 簡單模式：金額正確時在確認鈕顯示「點這裡」
                if (diff === 'easy') confirmBtn.classList.toggle('b6-product-here-hint', exact);
            }
        },

        _b6P2RenderWalletCoins(change) {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            const walletCoinsEl = document.getElementById('b6c-wallet-coins');
            if (!walletCoinsEl) return;

            const _makeFilledSlot = (denom, face, uid, slotIdx) => {
                const isBill = denom >= 100;
                const w = isBill ? 80 : 52;
                const div = document.createElement('div');
                div.className = 'b6c-wc-item';
                // 簡單模式：不可拖曳也不顯示移除按鈕
                if (diff !== 'easy') {
                    div.draggable = true;
                    div.dataset.uid = uid || '';
                }
                div.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;" draggable="false" onerror="this.style.display='none'">
                    <span class="b1-denom-label">${denom}元</span>
                    ${diff !== 'easy' ? `<button class="b6c-wc-remove" data-uid="${uid || ''}"${slotIdx != null ? ` data-slot-idx="${slotIdx}"` : ''} title="移除">×</button>` : ''}`;
                return div;
            };
            const _makeGhostSlot = (denom, face) => {
                const isBill = denom >= 100;
                const w = isBill ? 80 : 52;
                const div = document.createElement('div');
                div.className = 'b6c-ghost-slot';
                div.dataset.denom = denom;
                div.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;opacity:0.3;" draggable="false" onerror="this.style.display='none'">
                    <span class="b1-denom-label" style="opacity:0.3;">${denom}元</span>`;
                return div;
            };

            // Ghost slot 模式：只替換狀態改變的格子
            if (g.changeGhostMode && g.changeHintSlots?.length > 0) {
                if (g.changeHintSlots.every(s => s.filled) && diff !== 'easy') {
                    g.changeGhostMode = false;
                    // 清除殘留的 ghost slot，避免和後續普通模式 append 的 filled slot 並存
                    walletCoinsEl.querySelectorAll('.b6c-ghost-slot').forEach(el => el.remove());
                    // fall through to normal mode render
                } else {
                    const kids = Array.from(walletCoinsEl.children);
                    if (kids.length !== g.changeHintSlots.length) {
                        // 首次建立：直接填入
                        walletCoinsEl.innerHTML = '';
                        g.changeHintSlots.forEach((slot, idx) => {
                            walletCoinsEl.appendChild(
                                slot.filled
                                    ? _makeFilledSlot(slot.denom, slot.face, slot.uid, idx)
                                    : _makeGhostSlot(slot.denom, slot.face)
                            );
                        });
                    } else {
                        // DOM diff：只更新狀態改變的格子（避免整體重繪動畫）
                        g.changeHintSlots.forEach((slot, idx) => {
                            const el = kids[idx];
                            const curFilled = el.classList.contains('b6c-wc-item');
                            if (slot.filled === curFilled) return;
                            walletCoinsEl.replaceChild(
                                slot.filled
                                    ? _makeFilledSlot(slot.denom, slot.face, slot.uid, idx)
                                    : _makeGhostSlot(slot.denom, slot.face),
                                el
                            );
                        });
                    }
                    return;
                }
            }

            // 一般模式：DOM diff，只增刪變化的金幣，不觸動已存在的元素
            if (!g.changePlaced || g.changePlaced.length === 0) {
                walletCoinsEl.innerHTML = '<span class="b6p2-wallet-empty">把找零金錢拖曳到這裡</span>';
                return;
            }
            const emptyEl = walletCoinsEl.querySelector('.b6p2-wallet-empty');
            if (emptyEl) emptyEl.remove();

            const existingMap = {};
            walletCoinsEl.querySelectorAll('.b6c-wc-item').forEach(el => {
                existingMap[el.dataset.uid] = el;
            });
            const desiredUids = new Set(g.changePlaced.map(p => p.uid));

            // 移除已不存在的
            Object.entries(existingMap).forEach(([uid, el]) => {
                if (!desiredUids.has(uid)) el.remove();
            });
            // 新增尚未存在的（追加至末尾，保持既有元素不動）
            g.changePlaced.forEach(p => {
                if (existingMap[p.uid]) return;
                walletCoinsEl.appendChild(_makeFilledSlot(p.denom, p.face, p.uid, null));
            });
        },

        // 輔助點擊：直接加入找零金幣（不需拖曳）
        _b6P2AddChangeCoin(denom) {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            const face = g.changeTrayFaces?.[denom] || 'front';
            const uid  = 'ch' + Date.now() + Math.floor(Math.random() * 10000);
            if (g.changeGhostMode) {
                const slotIdx = (g.changeHintSlots || []).findIndex(s => s.denom === denom && !s.filled);
                if (slotIdx === -1) { this.audio.play('error'); return; }
                this.audio.play('coin');
                g.changeHintSlots[slotIdx].filled = true;
                g.changeHintSlots[slotIdx].uid = uid;
                g.changePlaced.push({ denom, uid, face });
            } else {
                this.audio.play('coin');
                g.changePlaced.push({ denom, uid, face });
            }
            const totalChange = g.changeTotal || 0;
            this._b6P2UpdateChangeDisplay(totalChange);
            this._b6P2RenderWalletCoins(totalChange);

            if (diff !== 'easy') {
                const runningTotal = (g.changePlaced || []).reduce((s, p) => s + p.denom, 0);
                const isLast = runningTotal >= totalChange && totalChange > 0;
                if (isLast) {
                    this.state.isProcessing = true;
                    Game.Speech.speak(`找回${toTWD(runningTotal)}`, () => {
                        this.state.isProcessing = false;
                        AssistClick.buildQueue();
                    });
                } else {
                    Game.Speech.speak(`找回${toTWD(runningTotal)}`);
                }
            }
        },

        _b6P2ConfirmChange(change, paid) {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            const placedTotal = (g.changePlaced || []).reduce((s, p) => s + p.denom, 0);

            if (placedTotal !== change) {
                this.state.isProcessing = false;
                this.audio.play('error');
                g.changeErrorCount = (g.changeErrorCount || 0) + 1;
                const b6ChangeDir = placedTotal > change ? '太多了' : '太少了';
                this._showCenterFeedback('❌', `找零算${b6ChangeDir}！`);
                Game.Speech.speak(`不對喔，找零算${b6ChangeDir}，請再試一次`);
                const walletZone = document.getElementById('b6c-wallet-zone');
                if (walletZone) {
                    walletZone.style.animation = 'b6p2Shake 0.4s ease';
                    Game.TimerManager.setTimeout(() => { walletZone.style.animation = ''; }, 500, 'ui');
                }
                if (diff === 'easy' && g.changeGhostMode) {
                    // 簡單模式 ghost slot 錯誤：保留 ghost slot 結構，只重置填入狀態
                    g.changePlaced = [];
                    g.changeHintSlots = g.changeHintSlots.map(s => ({ ...s, filled: false, uid: null }));
                    this._b6P2UpdateChangeDisplay(change);
                    this._b6P2RenderWalletCoins(change);
                    this._b6P2UpdateChangeTrayHints();
                } else if (diff !== 'hard') {
                    // 普通模式：清空找零區
                    g.changePlaced    = [];
                    g.changeGhostMode = false;
                    g.changeHintSlots = [];
                    this._b6P2UpdateChangeDisplay(change);
                    this._b6P2RenderWalletCoins(change);
                }
                // 普通模式：3次錯誤自動顯示 ghost slots
                if (diff === 'normal' && g.changeErrorCount >= 3) {
                    g.changeErrorCount = 0;
                    Game.TimerManager.setTimeout(() => this._b6P2ShowChangeGhostSlots(change), 900, 'ui');
                }
                return;
            }

            // 找零正確
            this.audio.play('correct');
            this._fireConfetti();
            this._showCenterFeedback('🎉', '找零完成！');
            Game.Speech.speak(`找回${toTWD(change)}，找零完成！`, () => {
                this.state.isProcessing = false;
                this._showChangeResult(paid, change);
            });
        },

        _b6P2ShowChangeGhostSlots(change) {
            const g = this.state.game;
            // 清空錢包，進入 ghost 模式
            g.changePlaced    = [];
            g.changeGhostMode = true;
            // 根據貪婪最佳解建立 slots
            const solution = g.changeGreedySolution || {};
            const slots = [];
            Object.entries(solution).sort(([a], [b]) => b - a).forEach(([d, cnt]) => {
                const denom = parseInt(d);
                const face  = g.changeTrayFaces?.[denom] || 'front';
                for (let i = 0; i < cnt; i++) slots.push({ denom, face, filled: false, uid: null });
            });
            g.changeHintSlots = slots;
            this._b6P2UpdateChangeDisplay(change);
            this._b6P2RenderWalletCoins(change);
            this._b6P2UpdateChangeTrayHints();
            // 語音提示
            const parts = Object.entries(solution).sort(([a], [b]) => b - a).map(([d, cnt]) => `${cnt}個${d}元`);
            Game.Speech.speak(`可以用${parts.join('，')}`);
        },

        // 找零面額托盤的「點這裡」提示（ghost 模式下按未填 slot 標記對應面額卡）
        _b6P2UpdateChangeTrayHints() {
            const g = this.state.game;
            document.querySelectorAll('.b6c-denom-card').forEach(el => {
                el.classList.remove('b6-product-here-hint');
            });
            if (!g.changeGhostMode) return;
            const needed = {};
            (g.changeHintSlots || []).filter(s => !s.filled).forEach(s => {
                needed[s.denom] = (needed[s.denom] || 0) + 1;
            });
            // 每個面額只需標記一張卡（面額卡可重複使用，不需計數）
            document.querySelectorAll('.b6c-denom-card').forEach(el => {
                const d = parseInt(el.dataset.denom);
                if (needed[d]) el.classList.add('b6-product-here-hint');
            });
        },

        _b6P2ShowChangeHintModal(change) {
            const g        = this.state.game;
            const solution = g.changeGreedySolution || {};
            const parts    = Object.entries(solution).sort(([a], [b]) => b - a).map(([d, cnt]) => `${cnt}個${d}元`);
            const speechText = `找零${toTWD(change)}，可以用${parts.join('，')}`;

            let hintListHTML = '';
            Object.entries(solution).sort(([a], [b]) => b - a).forEach(([d, cnt]) => {
                const denom  = parseInt(d);
                const face   = g.changeTrayFaces?.[denom] || 'front';
                const isBill = denom >= 100;
                const imgStyle = isBill ? 'width:80px;height:auto;max-height:50px;' : 'width:50px;height:50px;';
                hintListHTML += `
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:10px 14px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
                    <img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                         style="${imgStyle}object-fit:contain;" onerror="this.style.display='none'" draggable="false">
                    <span style="font-size:18px;font-weight:700;color:#1f2937;">${denom}元</span>
                    <span style="color:#9ca3af;font-size:16px;">×</span>
                    <span style="font-size:18px;font-weight:700;color:#059669;">${cnt} 個</span>
                </div>`;
            });

            const existing = document.getElementById('b6c-hint-modal');
            if (existing) existing.remove();
            const overlay = document.createElement('div');
            overlay.id = 'b6c-hint-modal';
            overlay.className = 'b6-hint-modal-overlay';
            overlay.innerHTML = `
                <div class="b6-hint-modal" style="max-width:420px;width:92%;text-align:left;">
                    <div class="b6-hm-header" style="text-align:center;font-size:20px;padding-bottom:4px;">💡 找零提示</div>
                    <div style="text-align:center;font-size:14px;color:#6b7280;margin-bottom:14px;">建議的找零方式：</div>
                    <div style="padding:0 4px;">${hintListHTML}</div>
                    <div style="display:flex;gap:10px;justify-content:center;margin-top:4px;">
                        <button class="b6-hm-replay-btn" id="b6c-hm-replay">🔊 再播一次</button>
                        <button class="b6-hm-confirm-btn" id="b6c-hm-close">我知道了</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            Game.Speech.speak(speechText);

            const closeModal = () => overlay.remove();
            Game.EventManager.on(document.getElementById('b6c-hm-close'), 'click', closeModal, {}, 'gameUI');
            Game.EventManager.on(document.getElementById('b6c-hm-replay'), 'click', () => {
                this.audio.play('click');
                Game.Speech.speak(speechText);
            }, {}, 'gameUI');
            Game.EventManager.on(overlay, 'click', e => { if (e.target === overlay) closeModal(); }, {}, 'gameUI');
        },

        // ── 付款提示（保留，困難模式彈窗仍使用）─────────────────
        _showPaymentHint(total) {
            // legacy — no longer called by new UI; kept for assist-click compatibility
            const used = {};
            let rem = total;
            [1000,500,100,50,10,5,1].forEach(d => { const c = Math.floor(rem/d); if(c) { used[d]=c; rem-=c*d; } });
            const parts = Object.entries(used).sort(([a],[b])=>b-a).map(([d,c])=>`${c}個${d}元`);
            Game.Speech.speak(`可以用${parts.join('，')}`);
        },

        // ── 付款提示彈窗（A4 style：列表 + 確認後托盤打勾）───────
        _showHardModeHintModal(total) {
            // 以托盤實際可用硬幣計算最佳組合（最小超額付款）
            const available = [];
            document.querySelectorAll('.b6p2-coin-drag').forEach(el => {
                if (el.dataset.inUse !== 'true' && el.style.display !== 'none') {
                    available.push({ denom: parseInt(el.dataset.denom), face: el.dataset.face || 'front' });
                }
            });
            const optimal = this._b6P2FindOptimalPayment(available, total);
            const denomCounts = {};
            optimal.forEach(({ denom }) => { denomCounts[denom] = (denomCounts[denom] || 0) + 1; });
            // Fallback：可用硬幣不足時退化為全面額貪婪解
            if (optimal.length === 0) {
                const ALL_BILLS = [1000, 500, 100, 50, 10, 5, 1];
                let rem = total;
                ALL_BILLS.forEach(d => { if (rem >= d) { denomCounts[d] = Math.floor(rem / d); rem %= d; } });
            }
            const parts = Object.entries(denomCounts).sort(([a],[b])=>b-a).map(([d,cnt])=>`${cnt}個${d}元`);
            const speechText = `需付${toTWD(total)}，可以用${parts.join('，')}`;
            this._b6P2LastHintSpeech  = speechText;
            this._b6P2LastHintDenoms  = denomCounts;

            // 建立彈窗列表 HTML（A4 style）
            let hintListHTML = '';
            Object.entries(denomCounts).sort(([a],[b])=>b-a).forEach(([d, cnt]) => {
                const denom = parseInt(d);
                const face  = this.state.game.p2TrayFaces?.[denom] || 'front';
                const isBill = denom >= 100;
                const imgStyle = isBill ? 'width:80px;height:auto;max-height:50px;' : 'width:50px;height:50px;';
                hintListHTML += `
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:10px 14px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
                        <img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                             style="${imgStyle}object-fit:contain;" onerror="this.style.display='none'" draggable="false">
                        <span style="font-size:18px;font-weight:700;color:#1f2937;">${denom}元</span>
                        <span style="color:#9ca3af;font-size:16px;">×</span>
                        <span style="font-size:18px;font-weight:700;color:#059669;">${cnt} 個</span>
                    </div>`;
            });

            const existing = document.getElementById('b6-hard-hint-modal');
            if (existing) existing.remove();
            const overlay = document.createElement('div');
            overlay.id = 'b6-hard-hint-modal';
            overlay.className = 'b6-hint-modal-overlay';
            overlay.innerHTML = `
                <div class="b6-hint-modal" style="max-width:420px;width:92%;text-align:left;">
                    <div class="b6-hm-header" style="text-align:center;font-size:20px;padding-bottom:4px;">💡 付款提示</div>
                    <div style="text-align:center;font-size:14px;color:#6b7280;margin-bottom:14px;">建議的付款方式：</div>
                    <div style="padding:0 4px;">${hintListHTML}</div>
                    <div style="display:flex;gap:10px;justify-content:center;margin-top:4px;">
                        <button class="b6-hm-replay-btn" id="b6-hm-replay">🔊 再播一次</button>
                        <button class="b6-hm-confirm-btn" id="b6-hm-close">我知道了</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            Game.Speech.speak(speechText);

            const closeAndApply = () => {
                overlay.remove();
                this._b6P2ApplyTrayTicks(this._b6P2LastHintDenoms || {});
            };
            Game.EventManager.on(document.getElementById('b6-hm-close'), 'click', closeAndApply, {}, 'gameUI');
            Game.EventManager.on(document.getElementById('b6-hm-replay'), 'click', () => {
                this.audio.play('click');
                Game.Speech.speak(this._b6P2LastHintSpeech || '');
            }, {}, 'gameUI');
            Game.EventManager.on(overlay, 'click', e => { if (e.target === overlay) closeAndApply(); }, {}, 'gameUI');
        },

        // ── 托盤打勾提示（確認提示後套用）───────────────────────
        _b6P2ApplyTrayTicks(denomCounts) {
            // 清除舊打勾
            document.querySelectorAll('.b6p2-coin-drag.b6p2-tray-tick').forEach(el => el.classList.remove('b6p2-tray-tick'));
            // 依面額數量打勾（跳過已用出的硬幣）
            Object.entries(denomCounts).forEach(([d, cnt]) => {
                const denom = parseInt(d);
                let needed  = cnt;
                document.querySelectorAll(`.b6p2-coin-drag[data-denom="${denom}"]`).forEach(el => {
                    if (needed > 0 && el.dataset.inUse !== 'true' && el.style.display !== 'none' && !el.classList.contains('b6p2-tray-tick')) {
                        el.classList.add('b6p2-tray-tick');
                        needed--;
                    }
                });
            });
        },

        // ── 12. 找零畫面 ──────────────────────────────────────
        _showChange(paid, total) {
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');

            const change = paid - total;

            // 困難模式：三選一找零驗算
            if (this.state.settings.difficulty === 'hard') {
                this._showChangeQuiz(paid, total, change);
                return;
            }

            // 簡單 / 普通模式：直接顯示找零結果
            this._showChangeResult(paid, change);
        },

        _showChangeQuiz(paid, total, change) {
            this._changeQuizErrors = 0; // 重置計數（Round 34）
            const g = this.state.game;

            Game.Speech.speak(`你付了${toTWD(paid)}，買菜共花了${toTWD(total)}元，應該找回多少元？`);

            // 產生干擾項（±5~30，避免出現負數或 0）
            const offsets = [5, 10, 15, 20, 25, 30];
            const decoys = [];
            for (const d of offsets) {
                if (change - d > 0 && !decoys.includes(change - d)) { decoys.push(change - d); break; }
            }
            for (const d of offsets) {
                if (change + d !== change && !decoys.includes(change + d)) { decoys.push(change + d); break; }
            }
            const options = [change, ...decoys].sort(() => Math.random() - 0.5);

            const optionsHTML = options.map(v => `
                <button class="b6-change-opt" data-value="${v}">${v} 元</button>
            `).join('');

            const app = document.getElementById('app');
            app.innerHTML = `
            <div class="b-header">
                <div class="b-header-left"><img src="../images/common/hint_detective.png" alt="" class="b-header-mascot" onerror="this.style.display='none'"><span class="b-header-unit">🛒 菜市場買菜</span></div>
                <div class="b-header-center">步驟三：找零</div>
                <div class="b-header-right">
                    <span class="b-progress">第 ${g.currentRound + 1} 關 / 共 ${g.totalRounds} 關</span>
                    <button class="b-reward-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                    <button class="b-back-btn" onclick="Game.showSettings()">返回設定</button>
                </div>
            </div>
            <div class="game-container">
                <div class="b6-change-section">
                    <div class="b6-change-icon">🤔</div>
                    <div class="b6-change-text">付了 <strong>${paid}</strong> 元，買菜花了 <strong>${total}</strong> 元</div>
                    <div class="b6-change-question">應該找回多少元？</div>
                    <button class="b6-calc-toggle" id="b6-calc-toggle">🧮 幫我算一算</button>
                    <div class="b6-calc-panel" id="b6-calc-panel">
                        <div class="b6-cp-row">
                            <span class="b6-cp-label">付了</span>
                            <span class="b6-cp-num">${paid}</span>
                            <span class="b6-cp-unit">元</span>
                        </div>
                        <div class="b6-cp-row b6-cp-sub">
                            <span class="b6-cp-op">−</span>
                            <span class="b6-cp-label">花了</span>
                            <span class="b6-cp-num">${total}</span>
                            <span class="b6-cp-unit">元</span>
                        </div>
                        <div class="b6-cp-divider"></div>
                        <div class="b6-cp-row b6-cp-ans">
                            <span class="b6-cp-op">=</span>
                            <span class="b6-cp-label">找零</span>
                            <span class="b6-cp-num b6-cp-q">？</span>
                            <span class="b6-cp-unit">元</span>
                        </div>
                    </div>
                    <div class="b6-change-opts" id="b6-change-opts">${optionsHTML}</div>
                </div>
            </div>`;

            document.querySelectorAll('.b6-change-opt').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    const selected = parseInt(btn.dataset.value);
                    if (selected === change) {
                        // 答對
                        document.querySelectorAll('.b6-change-opt').forEach(b => b.disabled = true);
                        btn.classList.add('b6-change-opt-correct');
                        this.audio.play('correct');
                        this._showCenterFeedback('✅', `找回 ${change} 元！`);
                        Game.Speech.speak(`對了！找回${toTWD(change)}，買菜成功！`, () => {
                            Game.TimerManager.setTimeout(() => {
                                this._showChangeResult(paid, change);
                            }, 800, 'turnTransition');
                        });
                    } else {
                        // 答錯：漸進提示（Round 34）
                        this._changeQuizErrors = (this._changeQuizErrors || 0) + 1;
                        btn.classList.add('b6-change-opt-wrong');
                        this.audio.play('error');
                        if (this._changeQuizErrors === 1) {
                            // 第1次：只顯示算式 (付-商品=?)
                            this._showChangeRangeHint(paid, total);
                        } else {
                            this._showChangeFormula(paid, total, change);
                        }
                        const retryMode = this.state.settings.retryMode;
                        if (retryMode === 'retry') {
                            btn.disabled = true;
                            const b6ChangeDir = selected > change ? '太多了' : '太少了';
                            Game.Speech.speak(`不對喔，找零算${b6ChangeDir}，請再試一次`);
                        } else {
                            document.querySelectorAll('.b6-change-opt').forEach(b => {
                                b.disabled = true;
                                if (parseInt(b.dataset.value) === change) b.classList.add('b6-change-opt-correct');
                            });
                            Game.Speech.speak(`正確答案是找回${toTWD(change)}`, () => {
                                Game.TimerManager.setTimeout(() => {
                                    this._showChangeResult(paid, change);
                                }, 1400, 'turnTransition');
                            });
                        }
                    }
                }, {}, 'gameUI');
            });
            // 幫我算一算 toggle（C6 計算機模式）
            const calcToggle = document.getElementById('b6-calc-toggle');
            const calcPanel  = document.getElementById('b6-calc-panel');
            if (calcToggle && calcPanel) {
                Game.EventManager.on(calcToggle, 'click', () => {
                    const shown = calcPanel.classList.toggle('visible');
                    calcToggle.textContent = shown ? '🙈 收起計算' : '🧮 幫我算一算';
                }, {}, 'gameUI');
            }
        },

        // ── 找零第1次錯誤：顯示算式架構（Range hint, Round 34）─
        _showChangeRangeHint(paid, total) {
            if (document.querySelector('.b6-change-range-hint')) return;
            const hint = document.createElement('div');
            hint.className = 'b6-change-range-hint';
            hint.innerHTML = `💡 提示：付 <strong>${paid}</strong> 元 − 商品 <strong>${total}</strong> 元 = <strong>？</strong> 元`;
            const opts = document.querySelector('.b6-change-opts');
            if (opts) opts.insertAdjacentElement('beforebegin', hint);
        },

        _showChangeFormula(paid, total, change) {
            const existing = document.getElementById('b6-change-formula');
            if (existing) return;
            const hint = document.createElement('div');
            hint.id = 'b6-change-formula';
            hint.className = 'b6-change-formula';
            hint.innerHTML = `
                <span class="b6-cf-item">${paid}元</span>
                <span class="b6-cf-op">−</span>
                <span class="b6-cf-item">${total}元</span>
                <span class="b6-cf-op">=</span>
                <span class="b6-cf-ans">${change}元</span>`;
            const optsEl = document.getElementById('b6-change-opts');
            if (optsEl) optsEl.insertAdjacentElement('afterend', hint);
        },

        // ── 付款找零計算過程逐行動畫（Round 44）──────────────────
        _animateChangeCalc(paid, total, change) {
            document.getElementById('b6-change-calc-anim')?.remove();
            const box = document.createElement('div');
            box.id = 'b6-change-calc-anim';
            box.className = 'b6-change-calc-anim';
            const lines = [
                { text: `💰 付了 ${paid} 元`, cls: 'b6-cc-paid' },
                { text: `🛒 商品 ${total} 元`, cls: 'b6-cc-total' },
                { text: `💵 找零 = ${paid} − ${total} = <strong>${change}</strong> 元`, cls: 'b6-cc-result' },
            ];
            lines.forEach((ln, i) => {
                const el = document.createElement('div');
                el.className = `b6-cc-line ${ln.cls}`;
                el.innerHTML = ln.text;
                el.style.animationDelay = `${i * 400}ms`;
                box.appendChild(el);
            });
            // Insert after change-section or as body overlay
            const anchor = document.querySelector('.b6-change-section');
            if (anchor) anchor.insertAdjacentElement('afterend', box);
            else document.body.appendChild(box);
            Game.TimerManager.setTimeout(() => {
                box.classList.add('b6-cca-fade');
                Game.TimerManager.setTimeout(() => { if (box.parentNode) box.remove(); }, 500, 'ui');
            }, 2800, 'ui');
        },

        _showChangeResult(paid, change, skipSpeech = false) {
            const g = this.state.game;

            // 儲存本關收據（A3/A4 交易摘要模式）
            const total = this._calcMissionTotal();
            const items = (g.selectedItems || []).map(({ stall, id }) => {
                const item = (_currentStalls[stall]?.items || []).find(i => i.id === id);
                if (item) g.stallStats[stall] = (g.stallStats[stall] || 0) + item.price;
                return item ? { name: item.name, price: item.price, icon: item.icon || '🛒', imageUrl: item.imageUrl } : null;
            }).filter(Boolean);
            g.receipts.push({ items, total, paid, change });

            // 易/普通模式結果語音（困難模式語音已在 _showChangeQuiz 播出；skipSpeech=true 時跳過以免重複）
            if (this.state.settings.difficulty !== 'hard' && !skipSpeech) {
                Game.Speech.speak(change === 0
                    ? `剛好${toTWD(paid)}，買菜成功！`
                    : `付了${toTWD(paid)}，找回${toTWD(change)}，買菜成功！`);
            }

            g.correctCount++;
            if (change === 0) g.exactPayments = (g.exactPayments || 0) + 1; // 精準付款計數（Round 33）
            g.streak = (g.streak || 0) + 1;

            const app = document.getElementById('app');
            const isFinalRound = (g.currentRound + 1) >= g.totalRounds;

            // ── 全關卡統一：買菜成功頁（含採購清單 + 攤位分析）──
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            app.style.overflow = 'auto'; app.style.height = 'auto'; app.style.minHeight = '100vh';

            const effHTML = '';

            // 金錢圖示 helper（攤位消費分析用）
            const b6MkStallMoneyIcons = (amount) => {
                const denoms = [1000, 500, 100, 50, 10, 5, 1];
                let rem = amount; const parts = [];
                for (const d of denoms) { const n = Math.floor(rem / d); if (n > 0) { parts.push({ d, n }); rem -= d * n; } }
                return parts.map(({ d, n }) => {
                    const isBill = d >= 100; const w = isBill ? 56 : 36;
                    const face = Math.random() < 0.5 ? 'front' : 'back';
                    return `<span class="b6-stall-money-icon"><img src="../images/money/${d}_yuan_${face}.png" style="width:${w}px;height:${isBill ? 'auto' : w + 'px'}" onerror="this.style.display='none'">${n > 1 ? `<span class="b6-stall-money-x">×${n}</span>` : ''}</span>`;
                }).join('');
            };

            // 採購清單（逐項 + 導航，從最新一題開始）
            const receipts = g.receipts;
            const totalReceipts = receipts.length;
            const startRcptIdx = totalReceipts - 1;
            const renderReceiptContent = (idx) => {
                const r = receipts[idx];
                const itemRows = r.items.map(it => `
                    <div class="b6-rcpt-item-row">
                        <span class="b6-rcpt-item-icon">${b6IconHTML(it)}</span>
                        <span class="b6-rcpt-item-name">${it.name}</span>
                        <span class="b6-rcpt-item-price">${it.price}元</span>
                    </div>`).join('');
                return `<div class="b6-rcpt-items-grid">${itemRows}</div>
                    <div class="b6-rcpt-divider"></div>
                    <div class="b6-rcpt-sum-row">
                        <span class="b6-rcpt-sum-label">付款</span>
                        <span class="b6-rcpt-sum-val">${r.paid}元</span>
                    </div>
                    <div class="b6-rcpt-sum-row${r.change === 0 ? ' b6-rcpt-exact' : ''}">
                        <span class="b6-rcpt-sum-label">找零</span>
                        <span class="b6-rcpt-sum-val">${r.change}元</span>
                    </div>`;
            };
            const receiptCardHTML = totalReceipts > 0 ? `
            <div class="b-review-card">
                <div class="b6-rcpt-header">
                    <h3 class="b6-rcpt-title">🧾採購清單</h3>
                    ${totalReceipts > 1 ? `<div class="b6-rcpt-nav">
                        <button class="b6-rcpt-arrow" id="b6-rcpt-prev">◀</button>
                        <span class="b6-rcpt-page" id="b6-rcpt-page">第 ${totalReceipts} 題 / 共 ${totalReceipts} 題</span>
                        <button class="b6-rcpt-arrow" id="b6-rcpt-next" disabled>▶</button>
                    </div>` : `<span class="b6-rcpt-single-page">第 1 題</span>`}
                </div>
                <div id="b6-rcpt-content">${renderReceiptContent(startRcptIdx)}</div>
            </div>` : '';

            // 攤位消費金額（可折疊）
            const stallCardHTML = (() => {
                const stats = g.stallStats;
                if (!stats || Object.keys(stats).length === 0) return '';
                const entries = Object.keys(_currentStalls)
                    .filter(k => stats[k])
                    .map(k => ({ name: _currentStalls[k].name, icon: _currentStalls[k].icon, total: stats[k] }));
                if (!entries.length) return '';
                const grandTotal = entries.reduce((s, e) => s + e.total, 0);
                return `
                <div class="b-review-card">
                    <h3>🏪 攤位消費金額</h3>
                    <div class="b6-stall-bars">
                        ${entries.map(e => {
                            const pct = Math.round(e.total / grandTotal * 100);
                            return `
                            <div class="b6-stall-collapsible">
                                <div class="b6-stall-hdr-row">
                                    <span class="b6-stall-icon">${e.icon}</span>
                                    <span class="b6-stall-name">${e.name}</span>
                                    <span class="b6-stall-total">${e.total}元</span>
                                    <button class="b6-stall-expand-btn">展開 ▼</button>
                                </div>
                                <div class="b6-stall-detail" style="display:none">
                                    <div class="b6-stall-money-icons-row">${b6MkStallMoneyIcons(e.total)}</div>
                                    <div class="b6-stall-bar-wrap">
                                        <div class="b6-stall-track"><div class="b6-stall-fill" style="width:${pct}%"></div></div>
                                    </div>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            })();

            const nextBtnHTML = isFinalRound
                ? `<button id="b6-view-summary-btn" class="b-review-next-btn">📊 查看測驗總結</button>`
                : `<button id="b6-next-btn" class="b-review-next-btn">下一關 →</button>`;

            app.innerHTML = `
            <div class="b-review-wrapper">
                <div class="b6-results-outer-card">
                    <div class="b-review-header">
                        <div class="b-review-emoji">🎉</div>
                        <h1 class="b-review-title">買菜成功！</h1>
                        <p class="b-review-subtitle">${change === 0
                            ? `剛好 ${paid} 元，不需找零`
                            : `付了 ${paid} 元，找回 ${change} 元`}</p>
                    </div>
                    ${receiptCardHTML}
                    ${stallCardHTML}
                    ${effHTML}
                    ${nextBtnHTML}
                </div>
            </div>`;

            Game.TimerManager.setTimeout(() => document.getElementById('correct-sound')?.play(), 100, 'confetti');

            // 收據導航（從最新題開始）
            if (totalReceipts > 1) {
                let rcptIdx = startRcptIdx;
                const updateReceipt = () => {
                    document.getElementById('b6-rcpt-content').innerHTML = renderReceiptContent(rcptIdx);
                    document.getElementById('b6-rcpt-page').textContent = `第 ${rcptIdx + 1} 題 / 共 ${totalReceipts} 題`;
                    document.getElementById('b6-rcpt-prev').disabled = rcptIdx === 0;
                    document.getElementById('b6-rcpt-next').disabled = rcptIdx === totalReceipts - 1;
                };
                Game.EventManager.on(document.getElementById('b6-rcpt-prev'), 'click', () => { if (rcptIdx > 0) { rcptIdx--; updateReceipt(); } }, {}, 'gameUI');
                Game.EventManager.on(document.getElementById('b6-rcpt-next'), 'click', () => { if (rcptIdx < totalReceipts - 1) { rcptIdx++; updateReceipt(); } }, {}, 'gameUI');
            }

            // 攤位展開/收起
            document.querySelectorAll('.b6-stall-expand-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    const detail = btn.closest('.b6-stall-collapsible')?.querySelector('.b6-stall-detail');
                    if (!detail) return;
                    const isOpen = detail.style.display !== 'none';
                    detail.style.display = isOpen ? 'none' : 'block';
                    btn.textContent = isOpen ? '展開 ▼' : '收起 ▲';
                }, {}, 'gameUI');
            });

            if (isFinalRound) {
                Game.EventManager.on(document.getElementById('b6-view-summary-btn'), 'click', () => {
                    this.nextRound();
                }, {}, 'gameUI');
            } else {
                Game.EventManager.on(document.getElementById('b6-next-btn'), 'click', () => {
                    this._showRoundCompleteCard(g.currentRound + 1, items, total, paid, change, () => this.nextRound());
                }, {}, 'gameUI');
            }
        },

        // ── 13. 下一關 ────────────────────────────────────────
        // 關卡完成轉場卡（B5 _showRoundTransition pattern）
        _showRoundCompleteCard(roundNum, items, total, paid, change, callback) {
            const prev = document.getElementById('b6-round-complete');
            if (prev) prev.remove();
            const card = document.createElement('div');
            card.id = 'b6-round-complete';
            card.className = 'b6-round-complete';
            card.innerHTML = `
                <div class="b6-rc-inner">
                    <div class="b6-rc-badge">第 ${roundNum} 關完成！</div>
                    <div class="b6-rc-emoji">🎉</div>
                    <div class="b6-rc-items">${items.map(it => it.name).join('・')}</div>
                    <div class="b6-rc-amounts">共 ${total} 元｜付 ${paid} 元｜找零 ${change} 元</div>
                    <div class="b6-rc-hint">點任意處繼續</div>
                </div>`;
            document.body.appendChild(card);
            const advance = () => {
                if (!card.parentNode) return;
                card.classList.add('b6-rc-fade');
                Game.TimerManager.setTimeout(() => {
                    if (card.parentNode) card.remove();
                    callback();
                }, 300, 'turnTransition');
            };
            card.addEventListener('click', advance, { once: true });
            Game.TimerManager.setTimeout(advance, 1500, 'turnTransition');
        },

        nextRound() {
            this.state.game.currentRound++;
            if (this.state.game.currentRound >= this.state.game.totalRounds) {
                this.showResults();
            } else {
                this.renderRound();
            }
        },

        // ── 14. 完成畫面（測驗總結）──────────────────────────────
        showResults() {
            if (this.state.isEndingGame) return;
            this.state.isEndingGame = true;

            AssistClick.deactivate();
            Game.TimerManager.clearByCategory('turnTransition');
            Game.EventManager.removeByCategory('gameUI');

            const g        = this.state.game;
            const elapsed  = g.startTime ? (Date.now() - g.startTime) : 0;
            const mins     = Math.floor(elapsed / 60000);
            const secs     = Math.floor((elapsed % 60000) / 1000);
            const accuracy = g.totalRounds > 0
                ? Math.round((g.correctCount / g.totalRounds) * 100) : 0;

            let badge;
            if (accuracy === 100)    badge = '完美 🥇';
            else if (accuracy >= 90) badge = '優異 🥇';
            else if (accuracy >= 70) badge = '良好 🥈';
            else if (accuracy >= 50) badge = '努力 🥉';
            else                     badge = '練習 ⭐';

            const app = document.getElementById('app');
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            app.style.overflow = 'auto'; app.style.height = 'auto'; app.style.minHeight = '100vh';

            app.innerHTML = `
<div class="b-res-wrapper">
    <div class="b-res-screen">
        <div class="b-res-header">
            <div class="b-res-trophy">🏆</div>
            <div class="b-res-title-row">
                <img src="../images/common/hint_detective.png"
                     class="b-res-mascot" alt="金錢小助手" onerror="this.style.display='none'">
                <h1 class="b-res-title">🎉 採購達人 🎉</h1>
                <span class="b-res-mascot-spacer"></span>
            </div>
        </div>
        <div class="b-res-reward-wrap">
            <a href="#" id="endgame-reward-link" class="b-res-reward-link">🎁 開啟獎勵系統</a>
        </div>
        <div class="b-res-container">
            ${(() => {
                const mkt = this.state.settings.marketType;
                if (!mkt) return '';
                const mktLabels = { traditional: { name: '傳統市場', icon: '🏪' }, supermarket: { name: '超級市場', icon: '🏬' }, nightmarket: { name: '夜市', icon: '🌙' }, random: { name: '隨機市場', icon: '🎲' } };
                const info = mktLabels[mkt] || mktLabels.traditional;
                return `<div class="b6-mkt-banner">${info.icon} 本次練習：${info.name}</div>`;
            })()}
            <div class="b-res-grid">
                <div class="b-res-card b-res-card-1">
                    <div class="b-res-icon">✅</div>
                    <div class="b-res-label">完成題數</div>
                    <div class="b-res-value">${g.correctCount}/${g.totalRounds}</div>
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
                    <div class="b-res-ach-item">✅ 找到指定商品的攤位</div>
                    <div class="b-res-ach-item">✅ 計算總消費金額</div>
                    <div class="b-res-ach-item">✅ 選擇正確付款金額與找零</div>
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

            this._fireConfetti();
            Game.TimerManager.setTimeout(() => document.getElementById('success-sound')?.play(), 100, 'confetti');
            Game.TimerManager.setTimeout(() => {
                let msg;
                if (accuracy === 100)    msg = '太厲害了，全部完成了！';
                else if (accuracy >= 80) msg = `很棒喔，完成了${g.correctCount}關！`;
                else if (accuracy >= 60) msg = '不錯喔，繼續加油！';
                else                     msg = '要再加油喔，多練習幾次！';
                Game.Speech.speak(msg);
            }, 300, 'speech');

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
    const AssistClick = {
        _overlay: null, _handler: null, _touchHandler: null,
        _queue: [], _enabled: false,
        _lastHighlighted: null, _observer: null,

        activate() {
            if (this._overlay) return;
            this._overlay = document.createElement('div');
            this._overlay.id = 'b6-assist-overlay';
            const tbEl = document.querySelector('.b-header');
            const tbBottom = tbEl ? Math.round(tbEl.getBoundingClientRect().bottom) : 60;
            this._overlay.style.cssText = `position:fixed;top:${tbBottom}px;left:0;right:0;bottom:0;z-index:10100;pointer-events:all;touch-action:none;background:transparent;cursor:pointer;`;
            document.body.appendChild(this._overlay);
            this._handler = (e) => { e.stopPropagation(); this._executeStep(); };
            this._touchHandler = (e) => { e.preventDefault(); e.stopPropagation(); this._executeStep(); };
            this._overlay.addEventListener('click', this._handler);
            this._overlay.addEventListener('touchend', this._touchHandler, { passive: false });
            this._enabled = true;
            this._startObserver();
            this.buildQueue();
        },

        deactivate() {
            if (this._overlay) {
                this._overlay.removeEventListener('click', this._handler);
                this._overlay.removeEventListener('touchend', this._touchHandler);
                this._overlay.remove(); this._overlay = null;
            }
            if (this._observer) { this._observer.disconnect(); this._observer = null; }
            this._clearHighlight();
            this._queue = []; this._enabled = false;
        },

        buildQueue() {
            if (!this._enabled) return;
            // 歡迎畫面第2頁：點「開始購物」按鈕（已 disabled 表示已點，不重複 highlight）
            const wcStartBtn = document.getElementById('b6-wc2-start-btn');
            if (wcStartBtn && !wcStartBtn.disabled) {
                this._highlight(wcStartBtn);
                this._queue = [{ el: wcStartBtn, action: () => wcStartBtn.click() }];
                return;
            }
            // Wait for round complete card to dismiss
            if (document.getElementById('b6-round-complete')) return;
            // intro modal：優先點底部「關閉」鈕，fallback 為右上角 ✕
            const miDismiss = document.getElementById('b6-mi-dismiss-btn') || document.getElementById('b6-mi-close-btn');
            if (miDismiss) {
                // 若 modal 正在淡出（b6-mi-fade），清空 queue 讓 MutationObserver 在移除後重新 buildQueue
                const modal = document.getElementById('b6-mission-intro');
                if (modal && modal.classList.contains('b6-mi-fade')) {
                    this._clearHighlight();
                    this._queue = [];
                    return;
                }
                this._highlight(miDismiss);
                this._queue = [{ el: miDismiss, action: () => miDismiss.click() }];
                return;
            }
            this._clearHighlight();
            this._queue = [];

            const g = Game.state.game;
            if (!g || !g.mission) return;

            // Change quiz phase: click correct change option
            const changeOpts = document.querySelectorAll('.b6-change-opt:not([disabled])');
            if (changeOpts.length > 0) {
                const total = Game._calcMissionTotal();
                const correctChange = g.paidAmount - total;
                const correctOpt = document.querySelector(`.b6-change-opt[data-value="${correctChange}"]`);
                if (correctOpt && !correctOpt.disabled) {
                    this._highlight(correctOpt);
                    this._queue = [{ el: correctOpt, action: () => correctOpt.click() }];
                }
                return;
            }

            // 最後一關結果頁：查看測驗總結
            const viewSummaryBtn = document.getElementById('b6-view-summary-btn');
            if (viewSummaryBtn) {
                this._highlight(viewSummaryBtn);
                this._queue = [{ el: viewSummaryBtn, action: () => viewSummaryBtn.click() }];
                return;
            }

            // Result next-round button
            const nextBtn = document.getElementById('b6-next-btn');
            if (nextBtn) {
                this._highlight(nextBtn);
                this._queue = [{ el: nextBtn, action: () => nextBtn.click() }];
                return;
            }

            // 付款/找零處理中 → 清空 queue，避免重複觸發舊按鈕
            if (Game.state.isProcessing) {
                this._clearHighlight();
                this._queue = [];
                return;
            }

            // Phase 2 找零拖曳階段（b6c）
            if (document.getElementById('b6c-wallet-zone')) {
                const changeConfirm = document.getElementById('b6c-confirm-btn');
                if (changeConfirm && changeConfirm.classList.contains('ready')) {
                    this._highlight(changeConfirm);
                    this._queue = [{ el: changeConfirm, action: () => changeConfirm.click() }];
                    return;
                }
                // 貪婪面額：拖入下一枚正確零錢
                const sol = g.changeGreedySolution || {};
                const placed = g.changePlaced || [];
                const placedCounts = {};
                placed.forEach(p => { placedCounts[p.denom] = (placedCounts[p.denom] || 0) + 1; });
                const nextDenom = Object.keys(sol).map(Number).sort((a, b) => b - a)
                    .find(d => (placedCounts[d] || 0) < sol[d]);
                if (nextDenom) {
                    const card = document.querySelector(`.b6c-denom-card[data-denom="${nextDenom}"]`);
                    if (card) {
                        this._highlight(card);
                        this._queue = [{ el: card, action: () => Game._b6P2AddChangeCoin(nextDenom) }];
                    }
                }
                return;
            }

            // Phase 2 拖曳付款畫面（b6p2）
            if (document.getElementById('b6p2-wallet-coins')) {
                const p2Confirm = document.getElementById('b6-p2-confirm-btn');
                if (p2Confirm && !p2Confirm.disabled) {
                    this._highlight(p2Confirm);
                    this._queue = [{ el: p2Confirm, action: () => p2Confirm.click() }];
                    return;
                }
                if (g.p2ShowHint && g.p2HintSlots?.length) {
                    const nextSlot = g.p2HintSlots.find(s => !s.filled);
                    if (nextSlot) {
                        const trayEl = document.querySelector(`.b6p2-coin-drag[data-denom="${nextSlot.denom}"]`);
                        if (trayEl) {
                            this._highlight(trayEl);
                            this._queue = [{ el: trayEl, action: () => Game._b6P2AddCoin(nextSlot.denom) }];
                        }
                    }
                }
                return;
            }

            // Payment phase
            if (g.phase === 'payment') {
                const payBtn = document.getElementById('b6-pay-btn');
                if (payBtn && !payBtn.disabled) {
                    this._highlight(payBtn);
                    this._queue = [{ el: payBtn, action: () => payBtn.click() }];
                } else {
                    const total = Game._calcMissionTotal();
                    const remaining = total - g.paidAmount;
                    if (remaining > 0) {
                        // Greedy: largest bill ≤ remaining (B6_BILLS already sorted large→small)
                        let nextBill = B6_BILLS.find(b => b.value <= remaining) || B6_BILLS[B6_BILLS.length - 1];
                        const billBtn = document.querySelector(`.b6-bill-btn[data-value="${nextBill.value}"]`);
                        if (billBtn) {
                            this._highlight(billBtn);
                            this._queue = [{ el: billBtn, action: () => billBtn.click() }];
                        }
                    }
                }
                return;
            }

            // Shopping phase: find a stall with unmet quota, navigate, click cheapest valid item
            // 確認清單彈窗已開啟 → 點「去付款」
            const ccGo = document.getElementById('b6-cc-go');
            if (ccGo) {
                this._highlight(ccGo);
                this._queue = [{ el: ccGo, action: () => ccGo.click() }];
                return;
            }
            // All done → checkout
            const checkoutBtn = document.getElementById('b6-checkout-btn');
            if (checkoutBtn && !checkoutBtn.disabled) {
                this._highlight(checkoutBtn);
                this._queue = [{ el: checkoutBtn, action: () => checkoutBtn.click() }];
                return;
            }

            // Find first stall with unmet quota
            const mission = g.mission;
            const budget  = mission.budget;
            const currentTotal = Game._calcMissionTotal();
            const unmetReq = (mission.stalls || []).find(req => {
                const cnt = (g.selectedItems || []).filter(i => i.stall === req.stall).length;
                return cnt < req.count;
            });
            if (!unmetReq) return;

            // Navigate to that stall if not already there
            if (unmetReq.stall !== g.activeStall) {
                const _sk  = Object.keys(_currentStalls);
                const curI = _sk.indexOf(g.activeStall);
                const tgtI = _sk.indexOf(unmetReq.stall);
                const navBtn = document.getElementById(tgtI > curI ? 'b6-stall-next' : 'b6-stall-prev');
                if (navBtn && !navBtn.disabled) {
                    this._highlight(navBtn);
                    this._queue = [{ el: navBtn, action: () => navBtn.click() }];
                }
                return;
            }

            // Find the item to click in this stall
            const alreadySelected = new Set((g.selectedItems || []).filter(i => i.stall === g.activeStall).map(i => i.id));
            const stallItems = _currentStalls[g.activeStall]?.items || [];

            // In hint mode (easy/normal), only click hint items to avoid the guard rejection
            let pick;
            if (g.p1HintMode && Game.state.settings.difficulty !== 'hard') {
                const hintForStall = (g.p1HintItems || []).filter(h =>
                    h.stall === g.activeStall && !alreadySelected.has(h.id)
                );
                // easy mode shows 1 hint item at a time; normal shows all — pick the first unselected
                pick = stallItems.find(item => hintForStall.some(h => h.id === item.id));
            } else {
                pick = stallItems
                    .filter(item => !alreadySelected.has(item.id) && (currentTotal + item.price) <= budget)
                    .sort((a, b) => a.price - b.price)[0];
            }
            if (pick) {
                const productBtn2 = document.querySelector(`.b6-product-btn[data-item-id="${pick.id}"]`);
                if (productBtn2) {
                    this._highlight(productBtn2);
                    this._queue = [{ el: productBtn2, action: () => productBtn2.click() }];
                }
            }
        },

        _executeStep() {
            if (!this._enabled || this._queue.length === 0) return;
            const step = this._queue.shift();
            this._clearHighlight();
            if (step?.action) step.action();
            Game.TimerManager.setTimeout(() => { if (this._enabled) this.buildQueue(); }, 150, 'ui');
        },

        _startObserver() {
            if (!this._enabled) return;
            let t = null;
            const trigger = () => {
                if (!this._enabled) return;
                if (t) window.clearTimeout(t);
                t = window.setTimeout(() => {
                    if (this._enabled && this._queue.length === 0) this.buildQueue();
                }, 400);
            };
            this._observer = new MutationObserver(trigger);
            const app = document.getElementById('app');
            if (app) this._observer.observe(app, { childList: true, subtree: true });
            this._observer.observe(document.body, { childList: true });
        },

        _highlight(el) {
            this._clearHighlight();
            if (!el) return;
            el.classList.add('assist-click-hint');
            this._lastHighlighted = el;
        },

        _clearHighlight() {
            if (this._lastHighlighted) { this._lastHighlighted.classList.remove('assist-click-hint'); this._lastHighlighted = null; }
            document.querySelectorAll('.assist-click-hint').forEach(e => e.classList.remove('assist-click-hint'));
        },
    };

    Game.init();
});
