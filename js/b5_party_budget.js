// =============================================================
// FILE: js/b5_party_budget.js — B5 生日派對預算
// =============================================================
'use strict';

// ── 所有可選商品 ─────────────────────────────────────────────
const B5_ALL_ITEMS = [
    // ── 食物飲料（10種）──
    { id: 'cake',        name: '生日蛋糕',   price: 380, priceRange:[350,500], icon: '🎂', imageUrl: '../images/b5/icon-b5-birthday-cake.png' },
    { id: 'drink',       name: '果汁飲料',   price: 120, priceRange:[80,150],  icon: '🧃', imageUrl: '../images/b5/icon-b5-juice-drink.png' },
    { id: 'candy',       name: '糖果禮包',   price: 90,  priceRange:[65,120],  icon: '🍬', imageUrl: '../images/b5/icon-b5-candy-bag.png' },
    { id: 'bd_cupcake',  name: '杯子蛋糕',   price: 150, priceRange:[110,200], icon: '🧁', imageUrl: '../images/b5/icon-b5-bd-cupcake.png' },
    { id: 'bd_soda',     name: '汽水',       price: 60,  priceRange:[40,85],   icon: '🥤', imageUrl: '../images/b5/icon-b5-bd-soda.png' },
    { id: 'bd_popcorn',  name: '爆米花',     price: 50,  priceRange:[30,70],   icon: '🍿', imageUrl: '../images/b5/icon-b5-bd-popcorn.png' },
    { id: 'bd_cookie',   name: '造型餅乾',   price: 55,  priceRange:[35,75],   icon: '🍪', imageUrl: '../images/b5/icon-b5-bd-cookie.png' },
    { id: 'bd_choco',    name: '巧克力',     price: 65,  priceRange:[45,90],   icon: '🍫', imageUrl: '../images/b5/icon-b5-bd-chocolate.png' },
    { id: 'bd_lollipop', name: '棒棒糖',     price: 35,  priceRange:[20,50],   icon: '🍭', imageUrl: '../images/b5/icon-b5-bd-lollipop.png' },
    { id: 'bd_fruit',    name: '水果拼盤',   price: 130, priceRange:[90,170],  icon: '🍓', imageUrl: '../images/b5/icon-b5-bd-fruit-plate.png' },
    // ── 裝飾道具（10種）──
    { id: 'balloon',     name: '彩色氣球',   price: 50,  priceRange:[30,65],   icon: '🎈', imageUrl: '../images/b5/icon-b5-balloon.png' },
    { id: 'candle',      name: '生日蠟燭',   price: 30,  priceRange:[20,45],   icon: '🕯️', imageUrl: '../images/b5/icon-b5-birthday-candle.png' },
    { id: 'ribbon',      name: '彩帶裝飾',   price: 65,  priceRange:[45,85],   icon: '🎊', imageUrl: '../images/b5/icon-b5-ribbon.png' },
    { id: 'hat',         name: '派對帽',     price: 80,  priceRange:[50,100],  icon: '🎉', imageUrl: '../images/b5/icon-b5-party-hat.png' },
    { id: 'banner',      name: '生日橫幅',   price: 70,  priceRange:[50,95],   icon: '🏷️', imageUrl: '../images/b5/icon-b5-birthday-banner.png' },
    { id: 'lights',      name: '彩色串燈',   price: 90,  priceRange:[75,130],  icon: '💡', imageUrl: '../images/b5/icon-b5-string-lights.png' },
    { id: 'sticker',     name: '主題貼紙',   price: 40,  priceRange:[25,55],   icon: '🌟', imageUrl: '../images/b5/icon-b5-theme-sticker.png' },
    { id: 'tablecloth',  name: '派對桌巾',   price: 75,  priceRange:[50,95],   icon: '🎪', imageUrl: '../images/b5/icon-b5-party-tablecloth.png' },
    { id: 'bd_flag',     name: '派對旗子',   price: 55,  priceRange:[35,75],   icon: '🎏', imageUrl: '../images/b5/icon-b5-bd-party-flag.png' },
    { id: 'bd_confetti', name: '彩色紙花',   price: 30,  priceRange:[20,45],   icon: '🎉', imageUrl: '../images/b5/icon-b5-bd-confetti.png' },
    // ── 遊戲活動（10種）──
    { id: 'popper',       name: '彩帶拉炮',   price: 55,  priceRange:[35,75],   icon: '🎆', imageUrl: '../images/b5/icon-b5-party-popper.png' },
    { id: 'gift',         name: '小禮物',     price: 200, priceRange:[150,300], icon: '🎁', imageUrl: '../images/b5/icon-b5-gift.png' },
    { id: 'wand',         name: '魔法棒',     price: 45,  priceRange:[30,65],   icon: '🪄', imageUrl: '../images/b5/icon-b5-magic-wand.png' },
    { id: 'dice',         name: '遊戲骰子',   price: 85,  priceRange:[60,120],  icon: '🎲', imageUrl: '../images/b5/icon-b5-game-dice.png' },
    { id: 'funglasses',   name: '造型眼鏡',   price: 40,  priceRange:[25,55],   icon: '🕶️', imageUrl: '../images/b5/icon-b5-fun-glasses.png' },
    { id: 'bdcake',       name: '派對吹捲',   price: 40,  priceRange:[25,55],   icon: '🎉', imageUrl: '../images/b5/icon-b5-bd-party-blower.png' },
    { id: 'squishy',      name: '造型捏捏樂', price: 60,  priceRange:[40,80],   icon: '🎊', imageUrl: '../images/b5/icon-b5-squishy-toy.png' },
    { id: 'bubbleguns',   name: '泡泡槍',     price: 75,  priceRange:[50,100],  icon: '🫧', imageUrl: '../images/b5/icon-b5-bd-bubble-gun.png' },
    { id: 'playingcards', name: '撲克牌',     price: 90,  priceRange:[65,120],  icon: '🃏', imageUrl: '../images/b5/icon-b5-playing-cards.png' },
    { id: 'bd_ball',      name: '玩具球',     price: 60,  priceRange:[40,85],   icon: '⚽', imageUrl: '../images/b5/icon-b5-bd-ball.png' },
];

const ITEMS_PER_PAGE = 5; // 舊版分頁（已棄用）

// ── 商品類別對照 ────────────────────────────────────────────────
const B5_ITEM_CATEGORIES = {
    // 生日派對 食物（10）
    cake:'food', drink:'food', candy:'food', bd_cupcake:'food', bd_soda:'food', bd_popcorn:'food',
    bd_cookie:'food', bd_choco:'food', bd_lollipop:'food', bd_fruit:'food',
    // 生日派對 裝飾（10）
    balloon:'decor', candle:'decor', ribbon:'decor', hat:'decor', banner:'decor',
    lights:'decor', sticker:'decor', tablecloth:'decor', bd_flag:'decor', bd_confetti:'decor',
    // 生日派對 遊戲活動（10）
    popper:'activity', gift:'activity', wand:'activity',
    dice:'activity', funglasses:'activity', bdcake:'activity', squishy:'activity',
    bubbleguns:'activity', playingcards:'activity', bd_ball:'activity',
    // 萬聖節 食物（10）
    hw_mummy_hotdog:'food', treat:'food', hw_chocolate:'food', hw_cookie:'food', hw_popcorn:'food',
    hw_cake:'food', hw_drink:'food', hw_jelly:'food', hw_bread:'food', hw_marshmallow:'food',
    // 萬聖節 裝飾（10）
    pumpkin:'decor', witch_hat:'decor', spider:'decor', skull:'decor', hw_bat:'decor',
    hw_gravestone:'decor', hw_ghost_deco:'decor', hw_cauldron:'decor', hw_banner:'decor', hw_lights:'decor',
    // 萬聖節 遊戲活動（10）
    candy_bag:'activity', glow:'activity', ghost:'activity', fangs:'activity', hw_mask:'activity',
    hw_dice:'activity', hw_funglasses:'activity', hw_squishy:'activity', hw_bubbleguns:'activity', hw_playingcards:'activity',
    // 春日野餐 食物（10）
    sandwich:'food', fruit:'food', juice:'food', cookies:'food', pc_onigiri:'food',
    pc_cake:'food', pc_tea:'food', pc_bread:'food', pc_cheese:'food', pc_grapes:'food',
    // 春日野餐 裝飾（9）
    blanket:'decor', sunhat:'decor', pc_flowers:'decor',
    pc_basket:'decor', pc_tablecloth:'decor', pc_bell:'decor', pc_straw_hat:'decor', pc_sticker:'decor', pc_wreath:'decor',
    // 春日野餐 遊戲活動（10）
    frisbee:'activity', bubble:'activity', kite:'activity', pc_badminton:'activity', pc_rope:'activity',
    pc_dice:'activity', pc_funglasses:'activity', pc_ball:'activity', pc_dart:'activity', pc_playingcards:'activity',
};
const B5_CATEGORY_META = {
    food:     { name: '食物飲料', icon: '🍱' },
    decor:    { name: '裝飾道具', icon: '🎊' },
    activity: { name: '遊戲活動', icon: '🎯' },
};

// ── 關卡設定（依難度，每關隨機從主題商品中抽取 N 樣作為指定採購目標）─
const B5_ROUND_CONFIG = {
    easy:   { countRange: [2, 3] },
    normal: { countRange: [3, 4] },
    hard:   { countRange: [4, 6] },
};

// ── 舊版情境資料（已棄用，保留供回溯參考）──────────────────────
const _B5_SCENARIOS_DEPRECATED = {
    easy: [
        // 簡單：預算約70%，提示模式引導選購，每類5種（食5+裝5+活5=15種）
        // 食物: cake+drink+candy+plate+cup=690 / 裝飾: balloon+candle+ribbon+hat+banner=295 / 活動: photo+popper+gift+game+wand=570 → 共1555
        { budget:1100, availableIds:['cake','drink','candy','plate','cup','balloon','candle','ribbon','hat','banner','photo','popper','gift','game','wand'] },
        // 食物: cake+drink+candy+plate+napkin=670 / 裝飾: balloon+candle+ribbon+sticker+lights=275 / 活動: photo+popper+gift+game+wand=570 → 共1515
        { budget:1060, availableIds:['cake','drink','candy','plate','napkin','balloon','candle','ribbon','sticker','lights','photo','popper','gift','game','wand'] },
        // 食物: cake+drink+candy+cup+napkin=700 / 裝飾: balloon+ribbon+hat+banner+tablecloth=335 / 活動: photo+popper+speaker+game+wand=650 → 共1685
        { budget:1180, availableIds:['cake','drink','candy','cup','napkin','balloon','ribbon','hat','banner','tablecloth','photo','popper','speaker','game','wand'] },
        // 食物: cake+drink+plate+cup+napkin=635 / 裝飾: candle+ribbon+hat+lights+sticker=305 / 活動: popper+gift+speaker+game+wand=700 → 共1640
        { budget:1150, availableIds:['cake','drink','plate','cup','napkin','candle','ribbon','hat','lights','sticker','popper','gift','speaker','game','wand'] },
        // 食物: cake+drink+candy+plate+cup=690 / 裝飾: balloon+hat+banner+lights+tablecloth=365 / 活動: photo+popper+gift+game+wand=570 → 共1625
        { budget:1140, availableIds:['cake','drink','candy','plate','cup','balloon','hat','banner','lights','tablecloth','photo','popper','gift','game','wand'] },
        // 食物: cake+drink+candy+plate+napkin=670 / 裝飾: candle+ribbon+banner+sticker+tablecloth=280 / 活動: photo+popper+gift+speaker+wand=730 → 共1680
        { budget:1180, availableIds:['cake','drink','candy','plate','napkin','candle','ribbon','banner','sticker','tablecloth','photo','popper','gift','speaker','wand'] },
        // 食物: cake+drink+candy+cup+napkin=700 / 裝飾: balloon+hat+ribbon+lights+tablecloth=360 / 活動: photo+popper+speaker+game+wand=650 → 共1710
        { budget:1200, availableIds:['cake','drink','candy','cup','napkin','balloon','hat','ribbon','lights','tablecloth','photo','popper','speaker','game','wand'] },
        // 食物: cake+drink+plate+cup+napkin=635 / 裝飾: balloon+candle+ribbon+hat+banner=295 / 活動: photo+popper+gift+speaker+wand=730 → 共1660
        { budget:1160, availableIds:['cake','drink','plate','cup','napkin','balloon','candle','ribbon','hat','banner','photo','popper','gift','speaker','wand'] },
        // 食物: cake+drink+candy+plate+cup=690 / 裝飾: candle+hat+banner+lights+tablecloth=345 / 活動: photo+popper+gift+game+wand=570 → 共1605
        { budget:1120, availableIds:['cake','drink','candy','plate','cup','candle','hat','banner','lights','tablecloth','photo','popper','gift','game','wand'] },
        // 食物: cake+drink+candy+plate+napkin=670 / 裝飾: balloon+candle+ribbon+hat+banner=295 / 活動: popper+gift+speaker+game+wand=700 → 共1665
        { budget:1170, availableIds:['cake','drink','candy','plate','napkin','balloon','candle','ribbon','hat','banner','popper','gift','speaker','game','wand'] },
        // 食物: cake+drink+candy+cup+napkin=700 / 裝飾: balloon+candle+ribbon+sticker+lights=275 / 活動: photo+gift+speaker+game+wand=795 → 共1770
        { budget:1240, availableIds:['cake','drink','candy','cup','napkin','balloon','candle','ribbon','sticker','lights','photo','gift','speaker','game','wand'] },
        // 食物: cake+drink+plate+cup+napkin=635 / 裝飾: balloon+ribbon+hat+banner+tablecloth=335 / 活動: photo+popper+gift+game+wand=570 → 共1540
        { budget:1080, availableIds:['cake','drink','plate','cup','napkin','balloon','ribbon','hat','banner','tablecloth','photo','popper','gift','game','wand'] },
        // 食物: cake+drink+candy+plate+cup=690 / 裝飾: candle+ribbon+hat+lights+sticker=305 / 活動: photo+popper+gift+game+wand=570 → 共1565
        { budget:1100, availableIds:['cake','drink','candy','plate','cup','candle','ribbon','hat','lights','sticker','photo','popper','gift','game','wand'] },
        // 食物: cake+drink+candy+plate+napkin=670 / 裝飾: balloon+hat+ribbon+lights+tablecloth=360 / 活動: photo+popper+speaker+game+wand=650 → 共1680
        { budget:1180, availableIds:['cake','drink','candy','plate','napkin','balloon','hat','ribbon','lights','tablecloth','photo','popper','speaker','game','wand'] },
        // 食物: cake+drink+candy+cup+napkin=700 / 裝飾: candle+ribbon+banner+sticker+tablecloth=280 / 活動: photo+popper+gift+game+wand=570 → 共1550
        { budget:1090, availableIds:['cake','drink','candy','cup','napkin','candle','ribbon','banner','sticker','tablecloth','photo','popper','gift','game','wand'] },
        // 食物: cake+drink+plate+cup+napkin=635 / 裝飾: balloon+hat+banner+lights+tablecloth=365 / 活動: photo+popper+gift+game+wand=570 → 共1570
        { budget:1100, availableIds:['cake','drink','plate','cup','napkin','balloon','hat','banner','lights','tablecloth','photo','popper','gift','game','wand'] },
    ],
    normal: [
        // 普通：預算約為總額58%，需思考取捨
        { budget: 900, availableIds:['cake','drink','candy','plate','cup','balloon','candle','ribbon','hat','banner','photo','popper','gift','game','wand'] },
        { budget: 980, availableIds:['cake','drink','candy','plate','napkin','balloon','candle','ribbon','sticker','lights','photo','popper','gift','speaker','wand'] },
        { budget: 980, availableIds:['cake','drink','candy','cup','napkin','balloon','ribbon','hat','banner','tablecloth','photo','popper','speaker','game','wand'] },
        { budget: 960, availableIds:['cake','drink','plate','cup','napkin','candle','ribbon','hat','lights','sticker','popper','gift','speaker','game','wand'] },
        { budget: 950, availableIds:['cake','drink','candy','plate','cup','balloon','hat','banner','lights','tablecloth','photo','popper','gift','game','wand'] },
        { budget: 980, availableIds:['cake','drink','candy','plate','napkin','candle','ribbon','banner','sticker','tablecloth','photo','popper','gift','speaker','wand'] },
        { budget: 950, availableIds:['cake','drink','candy','cup','napkin','balloon','hat','ribbon','lights','tablecloth','photo','popper','speaker','game','wand'] },
        { budget: 970, availableIds:['cake','drink','plate','cup','napkin','balloon','candle','ribbon','hat','banner','photo','popper','gift','speaker','wand'] },
        { budget:1000, availableIds:['cake','drink','candy','plate','cup','candle','hat','banner','lights','tablecloth','photo','popper','gift','speaker','game'] },
        { budget: 960, availableIds:['cake','drink','candy','plate','napkin','balloon','candle','ribbon','hat','banner','popper','gift','speaker','game','wand'] },
        { budget: 900, availableIds:['cake','drink','candy','cup','napkin','balloon','candle','ribbon','sticker','lights','photo','popper','gift','game','wand'] },
        { budget: 980, availableIds:['cake','drink','plate','cup','napkin','balloon','ribbon','hat','banner','tablecloth','photo','popper','gift','game','wand'] },
        { budget: 950, availableIds:['cake','drink','candy','plate','cup','candle','ribbon','hat','lights','sticker','photo','popper','gift','game','wand'] },
        { budget:1050, availableIds:['cake','drink','candy','plate','napkin','balloon','hat','ribbon','lights','tablecloth','photo','popper','gift','speaker','wand'] },
        { budget: 900, availableIds:['cake','drink','candy','cup','napkin','candle','ribbon','banner','sticker','tablecloth','photo','popper','gift','game','wand'] },
        { budget:1000, availableIds:['cake','drink','plate','cup','napkin','balloon','hat','banner','lights','tablecloth','popper','gift','speaker','game','wand'] },
    ],
    hard: [
        // 困難：預算約為總額46~48%，需精算組合
        { budget: 720, availableIds:['cake','drink','candy','plate','cup','balloon','candle','ribbon','hat','banner','photo','popper','gift','game','wand'] },
        { budget: 800, availableIds:['cake','drink','candy','plate','napkin','balloon','candle','ribbon','sticker','lights','photo','popper','gift','speaker','wand'] },
        { budget: 800, availableIds:['cake','drink','candy','cup','napkin','balloon','ribbon','hat','banner','tablecloth','photo','popper','speaker','game','wand'] },
        { budget: 780, availableIds:['cake','drink','plate','cup','napkin','candle','ribbon','hat','lights','sticker','popper','gift','speaker','game','wand'] },
        { budget: 900, availableIds:['cake','drink','candy','plate','cup','balloon','hat','banner','lights','tablecloth','photo','popper','gift','speaker','game'] },
        { budget: 800, availableIds:['cake','drink','candy','plate','napkin','candle','ribbon','banner','sticker','tablecloth','photo','popper','gift','speaker','wand'] },
        { budget: 760, availableIds:['cake','drink','candy','cup','napkin','balloon','hat','ribbon','lights','tablecloth','photo','popper','speaker','game','wand'] },
        { budget: 770, availableIds:['cake','drink','plate','cup','napkin','balloon','candle','ribbon','hat','banner','photo','popper','gift','game','wand'] },
        { budget: 820, availableIds:['cake','drink','candy','plate','cup','candle','hat','banner','lights','tablecloth','photo','popper','gift','speaker','game'] },
        { budget: 780, availableIds:['cake','drink','candy','plate','napkin','balloon','candle','ribbon','hat','banner','popper','gift','speaker','game','wand'] },
        { budget: 860, availableIds:['cake','drink','candy','cup','napkin','balloon','candle','ribbon','sticker','lights','photo','gift','speaker','game','wand'] },
        { budget: 870, availableIds:['cake','drink','candy','cup','napkin','balloon','ribbon','hat','banner','tablecloth','photo','gift','speaker','game','wand'] },
    ],
};

// ── 派對主題資料（除 birthday 外的額外主題）────────────────────────
// scenarios 已廢棄，改用 B5_ROUND_CONFIG 動態生成每關目標商品
const B5_THEMES = {
    birthday: {
        name: '生日派對', icon: '🎂',
        allItems: B5_ALL_ITEMS,
    },
    halloween: {
        name: '萬聖節派對', icon: '🎃',
        allItems: [
            { id:'pumpkin',     name:'南瓜燈',      price:150, priceRange:[120,200], icon:'🎃', imageUrl:'../images/b5/icon-b5-hw-pumpkin.png' },
            { id:'hw_mummy_hotdog', name:'木乃伊熱狗捲', price:65, priceRange:[45,90], icon:'🌭', imageUrl:'../images/b5/icon-b5-hw-mummy-hotdog.png' },
            { id:'candy_bag',   name:'糖果袋',       price:80,  priceRange:[60,110],  icon:'🍬', imageUrl:'../images/b5/icon-b5-hw-candy-bag.png' },
            { id:'witch_hat',   name:'巫師帽',       price:60,  priceRange:[45,85],   icon:'🧙', imageUrl:'../images/b5/icon-b5-hw-witch-hat.png' },
            { id:'spider',      name:'蜘蛛網裝飾',   price:45,  priceRange:[30,65],   icon:'🕸️', imageUrl:'../images/b5/icon-b5-hw-spider-web.png' },
            { id:'skull',       name:'骷髏擺件',     price:70,  priceRange:[50,95],   icon:'💀', imageUrl:'../images/b5/icon-b5-hw-skull.png' },
            { id:'glow',        name:'螢光棒',       price:25,  priceRange:[15,40],   icon:'🌟', imageUrl:'../images/b5/icon-b5-hw-glow-stick.png' },
            { id:'ghost',       name:'鬼臉面具',     price:90,  priceRange:[65,120],  icon:'😱', imageUrl:'../images/b5/icon-b5-hw-ghost-mask.png' },
            { id:'treat',       name:'萬聖節糖果',   price:40,  priceRange:[25,55],   icon:'🛍️', imageUrl:'../images/b5/icon-b5-hw-treat-bag.png' },
            { id:'fangs',       name:'吸血鬼牙齒',   price:30,  priceRange:[20,45],   icon:'🦷', imageUrl:'../images/b5/icon-b5-hw-vampire-fangs.png' },
            { id:'hw_bat',         name:'蝙蝠裝飾',     price:40,  priceRange:[25,55],   icon:'🦇', imageUrl:'../images/b5/icon-b5-hw-bat.png' },
            { id:'hw_mask',        name:'恐怖面具',     price:65,  priceRange:[45,90],   icon:'😈', imageUrl:'../images/b5/icon-b5-hw-horror-mask.png' },
            { id:'hw_chocolate',   name:'萬聖節巧克力', price:35,  priceRange:[25,50],   icon:'🍫', imageUrl:'../images/b5/icon-b5-hw-chocolate.png' },
            { id:'hw_cookie',      name:'鬼臉餅乾',     price:30,  priceRange:[20,45],   icon:'🍪', imageUrl:'../images/b5/icon-b5-hw-ghost-cookie.png' },
            { id:'hw_popcorn',     name:'鬼怪爆米花',   price:40,  priceRange:[25,55],   icon:'🍿', imageUrl:'../images/b5/icon-b5-hw-ghost-popcorn.png' },
            // ── 食物飲料（新增5種補到10）──
            { id:'hw_cake',        name:'南瓜蛋糕',     price:280, priceRange:[220,360], icon:'🎃', imageUrl:'../images/b5/icon-b5-hw-cake.png' },
            { id:'hw_drink',       name:'魔女飲料',     price:50,  priceRange:[35,70],   icon:'🧃', imageUrl:'../images/b5/icon-b5-hw-drink.png' },
            { id:'hw_jelly',       name:'眼球果凍',     price:40,  priceRange:[25,55],   icon:'🍮', imageUrl:'../images/b5/icon-b5-hw-jelly.png' },
            { id:'hw_bread',       name:'骷髏麵包',     price:65,  priceRange:[45,90],   icon:'🍞', imageUrl:'../images/b5/icon-b5-hw-bread.png' },
            { id:'hw_marshmallow', name:'鬼臉棉花糖',   price:35,  priceRange:[20,50],   icon:'☁️', imageUrl:'../images/b5/icon-b5-hw-marshmallow.png' },
            // ── 裝飾道具（新增5種補到10）──
            { id:'hw_gravestone',  name:'墓碑擺件',     price:80,  priceRange:[55,110],  icon:'🪦', imageUrl:'../images/b5/icon-b5-hw-gravestone.png' },
            { id:'hw_ghost_deco',  name:'幽靈吊飾',     price:45,  priceRange:[30,65],   icon:'👻', imageUrl:'../images/b5/icon-b5-hw-ghost-deco.png' },
            { id:'hw_cauldron',    name:'巫師鍋裝飾',   price:120, priceRange:[90,160],  icon:'🪄', imageUrl:'../images/b5/icon-b5-hw-cauldron.png' },
            { id:'hw_banner',      name:'萬聖節橫幅',   price:60,  priceRange:[40,85],   icon:'🏷️', imageUrl:'../images/b5/icon-b5-hw-banner.png' },
            { id:'hw_lights',      name:'橘色串燈',     price:70,  priceRange:[50,95],   icon:'🔦', imageUrl:'../images/b5/icon-b5-hw-lights.png' },
            // ── 遊戲活動（10種，圖片為萬聖節主題專屬，後續補圖）──
            { id:'hw_dice',        name:'遊戲骰子',     price:85,  priceRange:[60,120],  icon:'🎲', imageUrl:'../images/b5/icon-b5-hw-game-dice.png' },
            { id:'hw_funglasses',  name:'造型眼鏡',     price:40,  priceRange:[25,55],   icon:'🕶️', imageUrl:'../images/b5/icon-b5-hw-fun-glasses.png' },
            { id:'hw_squishy',     name:'造型捏捏樂',   price:60,  priceRange:[40,80],   icon:'🎊', imageUrl:'../images/b5/icon-b5-hw-squishy-toy.png' },
            { id:'hw_bubbleguns',  name:'泡泡槍',       price:75,  priceRange:[50,100],  icon:'🫧', imageUrl:'../images/b5/icon-b5-hw-bubble-gun.png' },
            { id:'hw_playingcards',name:'撲克牌',       price:90,  priceRange:[65,120],  icon:'🃏', imageUrl:'../images/b5/icon-b5-hw-playing-cards.png' },
        ],
    },
    picnic: {
        name: '春日野餐', icon: '🌸',
        allItems: [
            { id:'sandwich',    name:'三明治',    price:120, priceRange:[90,150],  icon:'🥪', imageUrl:'../images/b5/icon-b5-pc-sandwich.png' },
            { id:'blanket',     name:'野餐墊',    price:180, priceRange:[150,250], icon:'🧺', imageUrl:'../images/b5/icon-b5-pc-picnic-blanket.png' },
            { id:'fruit',       name:'水果盒',    price:95,  priceRange:[75,130],  icon:'🍓', imageUrl:'../images/b5/icon-b5-pc-fruit-box.png' },
            { id:'juice',       name:'果汁飲料',  price:60,  priceRange:[45,85],   icon:'🧃', imageUrl:'../images/b5/icon-b5-pc-juice.png' },
            { id:'cookies',     name:'餅乾點心',  price:75,  priceRange:[55,100],  icon:'🍪', imageUrl:'../images/b5/icon-b5-pc-cookies.png' },
            { id:'sunhat',      name:'遮陽帽',    price:150, priceRange:[120,200], icon:'👒', imageUrl:'../images/b5/icon-b5-pc-sun-hat.png' },
            { id:'frisbee',     name:'飛盤',      price:85,  priceRange:[65,120],  icon:'🥏', imageUrl:'../images/b5/icon-b5-pc-frisbee.png' },
            { id:'bubble',      name:'泡泡水',    price:30,  priceRange:[20,45],   icon:'🫧', imageUrl:'../images/b5/icon-b5-pc-bubble-wand.png' },
            { id:'balloon',     name:'彩色汽球',  price:50,  priceRange:[35,65],   icon:'🎈', imageUrl:'../images/b5/icon-b5-pc-balloon.png' },
            { id:'kite',        name:'風箏',      price:160, priceRange:[130,220], icon:'🪁', imageUrl:'../images/b5/icon-b5-pc-kite.png' },
            { id:'pc_onigiri',  name:'飯糰',      price:45,  priceRange:[30,60],   icon:'🍙', imageUrl:'../images/b5/icon-b5-pc-onigiri.png' },
            { id:'pc_flowers',  name:'野花束',    price:55,  priceRange:[40,75],   icon:'🌺', imageUrl:'../images/b5/icon-b5-pc-wildflowers.png' },
            { id:'pc_badminton',   name:'羽毛球組',   price:75,  priceRange:[55,100],  icon:'🏸', imageUrl:'../images/b5/icon-b5-pc-badminton.png' },
            { id:'pc_rope',        name:'跳繩',       price:50,  priceRange:[35,70],   icon:'🪢', imageUrl:'../images/b5/icon-b5-pc-jump-rope.png' },
            // ── 食物飲料（新增5種補到10）──
            { id:'pc_cake',        name:'野餐蛋糕',   price:200, priceRange:[150,270], icon:'🎂', imageUrl:'../images/b5/icon-b5-pc-cake.png' },
            { id:'pc_tea',         name:'野餐茶飲',   price:45,  priceRange:[30,65],   icon:'🍵', imageUrl:'../images/b5/icon-b5-pc-tea.png' },
            { id:'pc_bread',       name:'法式麵包',   price:80,  priceRange:[55,110],  icon:'🥖', imageUrl:'../images/b5/icon-b5-pc-bread.png' },
            { id:'pc_cheese',      name:'起司片',     price:75,  priceRange:[50,100],  icon:'🧀', imageUrl:'../images/b5/icon-b5-pc-cheese.png' },
            { id:'pc_grapes',      name:'葡萄串',     price:65,  priceRange:[45,90],   icon:'🍇', imageUrl:'../images/b5/icon-b5-pc-grapes.png' },
            // ── 裝飾道具（新增6種補到10）──
            { id:'pc_basket',      name:'野餐籃',           price:180, priceRange:[140,240], icon:'🧺', imageUrl:'../images/b5/icon-b5-pc-basket.png' },
            { id:'pc_tablecloth',  name:'野餐桌巾',         price:90,  priceRange:[65,120],  icon:'🎪', imageUrl:'../images/b5/icon-b5-pc-tablecloth.png' },
            { id:'pc_bell',        name:'風鈴',             price:75,  priceRange:[50,100],  icon:'🔔', imageUrl:'../images/b5/icon-b5-pc-bell.png' },
            { id:'pc_straw_hat',   name:'保冷袋',           price:120, priceRange:[85,160],  icon:'🧊', imageUrl:'../images/b5/icon-b5-pc-cooler-bag.png' },
            { id:'pc_sticker',     name:'風格掛布',         price:80,  priceRange:[60,110],  icon:'🪆', imageUrl:'../images/b5/icon-b5-pc-style-banner.png' },
            { id:'pc_wreath',      name:'花環',             price:85,  priceRange:[60,115],  icon:'💐', imageUrl:'../images/b5/icon-b5-pc-wreath.png' },
            // ── 遊戲活動（10種）──
            { id:'pc_dice',        name:'遊戲骰子',         price:85,  priceRange:[60,120],  icon:'🎲', imageUrl:'../images/b5/icon-b5-pc-game-dice.png' },
            { id:'pc_funglasses',  name:'造型眼鏡',         price:40,  priceRange:[25,55],   icon:'🕶️', imageUrl:'../images/b5/icon-b5-pc-fun-glasses.png' },
            { id:'pc_ball',        name:'球',               price:55,  priceRange:[35,80],   icon:'⚽', imageUrl:'../images/b5/icon-b5-pc-ball.png' },
            { id:'pc_dart',        name:'魔鬼氈飛鏢靶',     price:95,  priceRange:[65,130],  icon:'🎯', imageUrl:'../images/b5/icon-b5-pc-dart-board.png' },
            { id:'pc_playingcards',name:'撲克牌',           price:90,  priceRange:[65,120],  icon:'🃏', imageUrl:'../images/b5/icon-b5-pc-playing-cards.png' },
        ],
    },
};

// ── Game 物件 ────────────────────────────────────────────────────
// 金額語音轉換（安全版：若 number-speech-utils.js 未載入則退回原始格式）
const toTWD = v => typeof convertToTraditionalCurrency === 'function' ? convertToTraditionalCurrency(v) : `${v}元`;
// 數量語音：2 讀作「兩」，避免 TTS 唸成「貳」
const toCountSpeech = n => n === 2 ? '兩' : String(n);

// 商品圖示 HTML（有圖片用 img，無圖片 fallback 為 emoji）
function b5IconHTML(item) {
    if (!item || !item.imageUrl) return `<span class="b5-icon-emoji">${item ? item.icon : ''}</span>`;
    const esc = (item.icon || '').replace(/'/g, "\\'");
    return `<img src="${item.imageUrl}" alt="" draggable="false" class="b5-icon-img" onerror="this.outerHTML='${esc}'">`;
}

let Game;

document.addEventListener('DOMContentLoaded', () => {
    Game = {

        // ── 1. Debug ──────────────────────────────────────────
        Debug: {
            FLAGS: { all: false, init: false, speech: false, question: false, error: true },
            log(cat, ...a)  { if (this.FLAGS.all || this.FLAGS[cat]) console.log(`[B5-${cat}]`, ...a); },
            warn(cat, ...a) { if (this.FLAGS.all || this.FLAGS[cat]) console.warn(`[B5-${cat}]`, ...a); },
            error(...a)     { console.error('[B5-ERROR]', ...a); },
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
            settings: { difficulty: null, rounds: null, clickMode: 'off', partyTheme: null, customItemsEnabled: false, magicItems: [] },
            game: {
                currentRound: 0,
                totalRounds: 5,
                correctCount: 0,
                streak: 0,
                rounds: [],       // array of { targetItems, budget, themeKey, roundPrices }
                startTime: null,
                // current round state
                selectedIds: new Set(),
                targetIds: new Set(),    // ids of items to buy this round
                targetItems: [],         // item objects (with round prices) to buy
                budget: 0,
                items: [],
                submitted: false,
                successfulRoundItems: [],
                roundStats: [],
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
            if (document.getElementById('b5-global-animations')) return;
            const style = document.createElement('style');
            style.id = 'b5-global-animations';
            style.textContent = `
                @keyframes b5CardSelect {
                    0%   { transform: scale(1); }
                    50%  { transform: scale(1.06); }
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
            g.rounds       = [];
            g.startTime    = null;
            g.selectedIds  = new Set();
            g.targetIds    = new Set();
            g.targetItems  = [];
            g.budget       = 0;
            g.items        = [];
            g.submitted    = false;
            g.successfulRoundItems = [];
            g.roundStats           = [];
            g.roundItemsList       = [];
            this.state.isEndingGame = false;
            this.state.isProcessing  = false;
            Game.Debug.log('init', '🔄 [B5] 遊戲狀態已重置');
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
                        <h1>單元B5：派對活動採購</h1>
                    </div>
                    <div class="game-settings">
                        <div class="b-setting-group">
                            <label style="font-size:13px;color:#6b7280;text-align:left;display:block;">
                                🛒 找出並購買清單上的指定商品辦派對！<br>
                                簡單：逐步提示引導；普通：看清單自行選購；困難：記住清單精準採購
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
                        <div class="b-setting-group" id="b5-custom-items-group-wrap">
                            <div id="b5-custom-items-toggle-row" style="display:none;">
                                <label style="font-size:13px;color:#374151;font-weight:600;">✨ 魔法商品</label>
                                <div class="b-btn-group" id="b5-custom-items-group" style="margin-top:4px;">
                                    <button class="b-sel-btn active" data-custom="off">關閉</button>
                                    <button class="b-sel-btn" data-custom="on">開啟</button>
                                </div>
                                <div style="margin-top:4px;font-size:12px;color:#6b7280;">開啟後可新增自訂商品，普通/困難模式有效，每類別限 1 項（食物／裝飾／遊戲），共最多 3 項・每件上限 500 元。</div>
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
                            <label class="b-setting-label">🎪 派對主題</label>
                            <div class="b-btn-group" id="theme-group">
                                <button class="b-sel-btn" data-theme="random">隨機 🎲</button>
                                <button class="b-sel-btn" data-theme="birthday">生日派對 🎂</button>
                                <button class="b-sel-btn" data-theme="halloween">萬聖節 🎃</button>
                                <button class="b-sel-btn" data-theme="picnic">春日野餐 🌸</button>
                            </div>
                            <div style="margin-top:4px;font-size:12px;color:#6b7280;">
                                每個主題有不同的必買商品和預算挑戰！
                            </div>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">題數：</label>
                            <div class="b-btn-group" id="rounds-group">
                                <button class="b-sel-btn" data-val="1">1題</button>
                                <button class="b-sel-btn" data-val="3">3題</button>
                                <button class="b-sel-btn" data-val="5">5題</button>
                                <button class="b-sel-btn" data-val="8">8題</button>
                                <button class="b-sel-btn" id="b5-custom-rounds-btn">自訂選項</button>
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
            easy:   '簡單：提示動畫逐一引導，照著指示點選指定商品',
            normal: '普通：先看採購清單，自行找到並點選所有指定商品，錯3次出現提示',
            hard:   '困難：記住採購清單後自行找商品，提示鈕可重看清單',
        },

        _bindSettingsEvents() {
            Game.EventManager.removeByCategory('settings');

            document.querySelectorAll('#theme-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#theme-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.partyTheme = btn.dataset.theme;
                    this._checkCanStart();
                }, {}, 'settings');
            });

            document.querySelectorAll('#diff-group .b-sel-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#diff-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.difficulty = btn.dataset.val;
                    const desc = document.getElementById('diff-desc');
                    if (desc) { desc.textContent = this._diffDescriptions[btn.dataset.val]; desc.classList.add('show'); }
                    const assistGroup = document.getElementById('assist-click-group');
                    const customToggle = document.getElementById('b5-custom-items-toggle-row');
                    if (assistGroup) {
                        if (btn.dataset.val === 'easy') {
                            assistGroup.style.display = '';
                            if (customToggle) customToggle.style.display = 'none';
                            this.state.settings.customItemsEnabled = false;
                            document.querySelectorAll('#b5-custom-items-group [data-custom]').forEach(b => b.classList.toggle('active', b.dataset.custom === 'off'));
                            const panel = document.getElementById('b5-magic-panel');
                            if (panel) panel.style.display = 'none';
                        } else {
                            assistGroup.style.display = 'none';
                            this.state.settings.clickMode = 'off';
                            if (customToggle) customToggle.style.display = '';
                        }
                    }
                    this._checkCanStart();
                }, {}, 'settings');
            });

            document.querySelectorAll('#rounds-group .b-sel-btn:not(#b5-custom-rounds-btn)').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#rounds-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.rounds = parseInt(btn.dataset.val);
                    this._checkCanStart();
                }, {}, 'settings');
            });

            // 自訂關卡數
            const b5CustomRoundsBtn = document.getElementById('b5-custom-rounds-btn');
            if (b5CustomRoundsBtn) {
                Game.EventManager.on(b5CustomRoundsBtn, 'click', () => {
                    this._showSettingsCountNumpad('題數', (n) => {
                        document.querySelectorAll('#rounds-group .b-sel-btn').forEach(b => b.classList.remove('active'));
                        b5CustomRoundsBtn.classList.add('active');
                        b5CustomRoundsBtn.textContent = `${n}題`;
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
                const params = new URLSearchParams({ unit: 'b5' });
                window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
            }, {}, 'settings');

            document.querySelectorAll('#b5-custom-items-group [data-custom]').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#b5-custom-items-group [data-custom]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.customItemsEnabled = btn.dataset.custom === 'on';
                    const panel = document.getElementById('b5-magic-panel');
                    if (panel) {
                        panel.style.display = this.state.settings.customItemsEnabled ? '' : 'none';
                        if (this.state.settings.customItemsEnabled) this._bindMagicItemsPanel();
                    }
                }, {}, 'settings');
            });
            if (this.state.settings.customItemsEnabled) {
                const panel = document.getElementById('b5-magic-panel');
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
            if (btn) btn.disabled = !s.difficulty || !s.rounds || !s.partyTheme;
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

        // 隨機生成本關價格（priceRange 取整到最近5元）
        _randomPrice(item) {
            if (!item.priceRange) return item.price;
            const [min, max] = item.priceRange;
            const steps = Math.round((max - min) / 5);
            return min + Math.floor(Math.random() * (steps + 1)) * 5;
        },

        // 動態生成一關資料：隨機選 N 件商品作為目標，預算=目標價格總和
        _generateRound(diff, themeKey) {
            const theme = B5_THEMES[themeKey] || B5_THEMES.birthday;
            const [minC, maxC] = B5_ROUND_CONFIG[diff].countRange;
            const totalCount = minC + Math.floor(Math.random() * (maxC - minC + 1));

            // 為本關所有商品隨機化價格
            const roundPrices = {};
            theme.allItems.forEach(item => {
                roundPrices[item.id] = this._randomPrice(item);
            });

            // 魔法商品（普通/困難模式）永遠列為必買目標，使用固定價格
            const magicItems = (diff !== 'easy') ? (this.state.settings.magicItems || []) : [];
            const magicTargets = magicItems.map(mi => ({ ...mi }));

            // 剩餘名額由一般商品隨機補齊
            const regularCount = Math.max(0, totalCount - magicTargets.length);
            const shuffled = [...theme.allItems].sort(() => Math.random() - 0.5);
            const regularTargets = shuffled.slice(0, regularCount).map(item => ({
                ...item,
                price: roundPrices[item.id],
            }));

            const targetItems = [...magicTargets, ...regularTargets];
            const targetSum   = targetItems.reduce((s, i) => s + i.price, 0);
            // 預算 = 大於目標總和的最小標準鈔票面額，確保找零 > 0
            const stdDenoms = [100, 500, 1000, 2000, 5000];
            const budget = stdDenoms.find(d => d > targetSum) || Math.ceil((targetSum + 100) / 100) * 100;
            return { targetItems, budget, themeKey, roundPrices };
        },

        startGame() {
            Game.EventManager.removeByCategory('settings');
            Game.TimerManager.clearAll();

            const s = this.state.settings;
            const g = this.state.game;
            g.currentRound = 0;
            g.totalRounds  = s.rounds;
            g.correctCount = 0;
            g.streak       = 0;
            g.startTime    = Date.now();

            // 預先生成所有關卡資料
            const themeKeys = ['birthday', 'halloween', 'picnic'];
            g.rounds = [];
            for (let i = 0; i < s.rounds; i++) {
                const themeKey = s.partyTheme === 'random'
                    ? themeKeys[Math.floor(Math.random() * themeKeys.length)]
                    : (s.partyTheme || 'birthday');
                g.rounds.push(this._generateRound(s.difficulty, themeKey));
            }

            this.state.isEndingGame = false;
            this.state.isProcessing  = false;

            this.showWelcomeScreen();
        },

        // ── 歡迎畫面（B6 showWelcomeScreen pattern：2頁式，設定後先顯示再進遊戲）─
        showWelcomeScreen() {
            const app = document.getElementById('app');
            const g   = this.state.game;
            const s   = this.state.settings;

            // 取得當前關卡資料（currentRound 已在關卡結束時遞增）
            const round0    = g.rounds[g.currentRound];
            const themeData = B5_THEMES[round0.themeKey] || B5_THEMES.birthday;
            const items     = round0.targetItems; // 本關指定採購商品

            let currentPage = 1;

            const renderPage = (page) => {
                if (page === 1) {
                    // ── 第1頁：派對主題歡迎 ──────────────────────────────────
                    const _b5ThemeImgMap = { birthday: '001', halloween: '002', picnic: '003' };
                    const _b5ThemeImgNum = _b5ThemeImgMap[round0.themeKey] || '001';
                    const _b5ThemeImgSrc = `../images/b5/${_b5ThemeImgNum}.png`;

                    app.innerHTML = `
                        <style>
                            .b5-wc-container {
                                display:flex;flex-direction:column;justify-content:center;
                                align-items:center;min-height:100vh;
                                background:linear-gradient(135deg,#ede9fe 0%,#c4b5fd 100%);
                                padding:20px;
                            }
                            .b5-wc-box {
                                background:linear-gradient(135deg,#faf5ff 0%,#ede9fe 100%);
                                border:3px solid #a78bfa;border-radius:24px;
                                padding:50px 20px;text-align:center;
                                max-width:560px;width:100%;
                            }
                            .b5-wc-icon { font-size:80px;margin-bottom:16px;line-height:1; }
                            .b5-wc-title {
                                font-size:30px;font-weight:800;color:#4c1d95;
                                margin-bottom:8px;
                            }
                            .b5-wc-sub {
                                font-size:17px;color:#6d28d9;margin-bottom:24px;
                            }
                            .b5-wc-unit-img {
                                width:min(480px,72vw);height:min(480px,72vw);
                                object-fit:contain;border-radius:16px;
                            }
                            @media(max-width:480px){
                                .b5-wc-box{padding:32px 12px;}
                                .b5-wc-icon{font-size:60px;}
                                .b5-wc-title{font-size:22px;}
                            }
                        </style>
                        <div class="b5-wc-container">
                            <div class="b5-wc-box">
                                <div class="b5-wc-icon">${themeData.icon}</div>
                                <h1 class="b5-wc-title">今天要舉辦${themeData.name}！</h1>
                                <p class="b5-wc-sub">在預算金額內完成採購！</p>
                                <img src="${_b5ThemeImgSrc}" alt="${themeData.name}"
                                     class="b5-wc-unit-img" onerror="this.style.display='none'">
                            </div>
                        </div>`;

                    Game.Speech.speak(`今天要舉辦${themeData.name}，在預算金額內完成採購！`, () => {
                        Game.TimerManager.setTimeout(() => {
                            this.renderRound();
                            Game.TimerManager.setTimeout(() => {
                                this._showRoundIntroCard(g.currentRound + 1, round0.budget, null);
                            }, 200, 'screenTransition');
                        }, 500, 'screenTransition');
                    });

                } else if (page === 2) {
                    // ── 第2頁：預算金額 + 採購清單 + 開始按鈕 ──────────────────
                    const budget = round0.budget;
                    const face = Math.random() < 0.5 ? 'back' : 'front';
                    const isBill = budget >= 100;
                    const billHtml = `<img src="../images/money/${budget}_yuan_${face}.png" alt="${budget}元"
                        style="width:${isBill ? '140px' : '100px'};height:auto;object-fit:contain;
                        filter:drop-shadow(0 4px 12px rgba(0,0,0,0.18));" onerror="this.style.display='none'">`;

                    const itemsListHTML = items.map(item => `
                        <div class="b5-wc2-item-row">
                            <span class="b5-wc2-item-icon">${b5IconHTML(item)}</span>
                            <span class="b5-wc2-item-name">${item.name}</span>
                            <span class="b5-wc2-item-price">${item.price} 元</span>
                        </div>`).join('');

                    app.innerHTML = `
                        <style>
                            .b5-wc-container {
                                display:flex;flex-direction:column;justify-content:center;
                                align-items:center;min-height:100vh;
                                background:linear-gradient(135deg,#ede9fe 0%,#c4b5fd 100%);
                                padding:20px;
                            }
                            .b5-wc2-box {
                                background:linear-gradient(135deg,#faf5ff 0%,#ede9fe 100%);
                                border:3px solid #a78bfa;border-radius:24px;
                                padding:40px 50px;text-align:center;
                                max-width:540px;width:100%;
                            }
                            .b5-wc2-label {
                                font-size:20px;font-weight:700;color:#5b21b6;margin-bottom:6px;
                            }
                            .b5-wc2-budget {
                                font-size:52px;font-weight:900;color:#d97706;
                                margin:12px 0 8px;letter-spacing:1px;
                            }
                            .b5-wc2-bill-wrap {
                                margin:16px 0 20px;
                                display:flex;justify-content:center;align-items:center;
                            }
                            .b5-wc2-divider {
                                border:none;border-top:2px dashed #c4b5fd;margin:0 0 16px;
                            }
                            .b5-wc2-list-label {
                                font-size:18px;font-weight:700;color:#5b21b6;margin-bottom:12px;
                            }
                            .b5-wc2-items-list {
                                display:flex;flex-direction:column;gap:10px;margin-bottom:24px;
                            }
                            .b5-wc2-item-row {
                                display:flex;align-items:center;gap:12px;
                                background:rgba(255,255,255,0.7);
                                border:2px solid #c4b5fd;border-radius:14px;
                                padding:10px 16px;
                            }
                            .b5-wc2-item-icon { flex-shrink:0; }
                            .b5-wc2-item-icon .b5-icon-img {
                                width:128px;height:128px;object-fit:contain;display:block;
                            }
                            .b5-wc2-item-icon .b5-icon-emoji {
                                font-size:96px;line-height:128px;display:block;width:128px;height:128px;
                                text-align:center;
                            }
                            .b5-wc2-item-name {
                                flex:1;font-size:18px;font-weight:700;color:#4c1d95;text-align:left;
                            }
                            .b5-wc2-item-price {
                                font-size:18px;font-weight:700;color:#d97706;white-space:nowrap;
                            }
                            .b5-wc2-start-btn {
                                background:linear-gradient(135deg,#7c3aed,#6d28d9);
                                color:#fff;border:none;border-radius:16px;
                                padding:14px 40px;font-size:20px;font-weight:700;
                                cursor:pointer;
                                box-shadow:0 4px 12px rgba(124,58,237,0.4);
                                transition:transform 0.15s,box-shadow 0.15s;
                            }
                            .b5-wc2-start-btn:hover {
                                transform:translateY(-2px);
                                box-shadow:0 6px 18px rgba(124,58,237,0.5);
                            }
                            @media(max-width:480px){
                                .b5-wc2-box{padding:28px 16px;}
                                .b5-wc2-budget{font-size:40px;}
                                .b5-wc2-start-btn{font-size:17px;padding:12px 28px;}
                                .b5-wc2-item-icon .b5-icon-img { width:72px;height:72px; }
                                .b5-wc2-item-icon .b5-icon-emoji { font-size:60px;line-height:72px;width:72px;height:72px; }
                                .b5-wc2-item-name{font-size:15px;}
                                .b5-wc2-item-price{font-size:15px;}
                            }
                        </style>
                        <div class="b5-wc-container">
                            <div class="b5-wc2-box">
                                <div class="b5-wc2-label">💰 今天帶了多少錢？</div>
                                <div class="b5-wc2-budget">${budget} 元</div>
                                <div class="b5-wc2-bill-wrap">${billHtml}</div>
                                <hr class="b5-wc2-divider">
                                <div class="b5-wc2-list-label">🛒 採購清單</div>
                                <div class="b5-wc2-items-list">${itemsListHTML}</div>
                                <button class="b5-wc2-start-btn" id="b5-wc2-start-btn">出發採購！ 🎉</button>
                            </div>
                        </div>`;

                    const itemsSpeech = items.map(i => `${i.name}${toTWD(i.price)}`).join('，');
                    Game.Speech.speak(`今天帶了${toTWD(budget)}去採購！採購清單：${itemsSpeech}`);

                    const startBtn = document.getElementById('b5-wc2-start-btn');
                    if (startBtn) {
                        Game.EventManager.on(startBtn, 'click', () => {
                            window.speechSynthesis.cancel();
                            this.renderRound();
                        }, {}, 'welcome');
                    }
                }
            };

            renderPage(1);

            if (s.clickMode === 'on') {
                Game.TimerManager.setTimeout(() => AssistClick.activate(), 400, 'ui');
            }
        },

        // ── 10. 關卡渲染 ──────────────────────────────────────
        renderRound() {
            Game.TimerManager.clearAll();
            window.speechSynthesis.cancel();
            Game.EventManager.removeByCategory('gameUI');
            this.state.isProcessing = false;
            AssistClick.deactivate();

            const g         = this.state.game;
            const roundData = g.rounds[g.currentRound];
            const themeData = B5_THEMES[roundData.themeKey] || B5_THEMES.birthday;

            // 設定本關資料
            g.budget      = roundData.budget;
            g.targetItems = roundData.targetItems;
            g.targetIds   = new Set(roundData.targetItems.map(i => i.id));
            // 所有主題商品（含隨機價格），作為商品網格的顯示資料
            g.items = themeData.allItems.map(item => ({
                ...item,
                price: roundData.roundPrices[item.id] || item.price,
            }));
            // 注入魔法商品（普通/困難模式）
            const diff = this.state.settings.difficulty;
            if (diff !== 'easy') {
                const magic = this.state.settings.magicItems || [];
                g.items = [...g.items, ...magic.map(mi => ({ ...mi }))];
            }

            g.selectedIds    = new Set();
            g.submitted      = false;
            g.roundErrors    = 0;
            g.activeCategory = null;
            g.p1HintMode     = false;
            g.p1HintItems    = [];
            g.p1ErrorCount   = 0;

            const app = document.getElementById('app');
            app.innerHTML = this._renderRoundHTML();
            this._bindRoundEvents();
            this._updateTotalBar();

            if (diff === 'easy') {
                Game.TimerManager.setTimeout(() => this._b5P1ActivateHintMode(), 100, 'ui');
            }

            if (this.state.settings.clickMode === 'on') {
                Game.TimerManager.setTimeout(() => AssistClick.activate(), 400, 'ui');
            }
        },

        _showRoundIntroCard(roundNum, budget, afterClose) {
            // B1 afterClose pattern — 顯示採購清單，普通/困難模式用彈窗
            const existing = document.getElementById('b5-round-intro');
            if (existing) existing.remove();
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            const themeData = B5_THEMES[(g.rounds[g.currentRound] || {}).themeKey || 'birthday'] || B5_THEMES.birthday;

            // 建立採購清單 HTML
            const targets = g.targetItems || [];
            const listHTML = targets.map(item => `
                <div class="b5-ri-item-row">
                    <span class="b5-ri-item-icon">${b5IconHTML(item)}</span>
                    <span class="b5-ri-item-name">${item.name}</span>
                    <span class="b5-ri-item-price">${item.price} 元</span>
                </div>`).join('');

            const card = document.createElement('div');
            card.id = 'b5-round-intro';
            card.className = 'b5-round-intro';
            card.innerHTML = `
                <div class="b5-ri-inner">
                    <div class="b5-ri-list-title">🛒 今天要買的商品</div>
                    <div class="b5-ri-list">${listHTML}</div>
                    ${diff === 'hard' ? '<div class="b5-ri-hint">記住採購清單，準備好再出發！</div>' : ''}
                    <button class="b5-ri-start-btn" id="b5-ri-cancel">出發採購！ 🎉</button>
                </div>`;
            document.body.appendChild(card);

            let closed = false;
            const dismiss = () => {
                if (closed) return;
                closed = true;
                window.speechSynthesis.cancel();
                if (document.body.contains(card)) {
                    card.classList.add('b5-ri-fade');
                    Game.TimerManager.setTimeout(() => {
                        if (card.parentNode) card.remove();
                        afterClose?.();
                    }, 300, 'turnTransition');
                }
            };
            // 播放採購清單語音：整句一次朗讀，避免逐項分段造成停頓
            const itemsSpeech = targets.map(i => `${i.name}${toTWD(i.price)}`).join('，');
            Game.Speech.speak(`今天要買的商品，${itemsSpeech}`);
            // 取消按鈕
            document.getElementById('b5-ri-cancel')?.addEventListener('click', dismiss, { once: true });
            // 困難模式：10秒後自動關閉讓玩家記住；其他模式不自動關閉（由玩家手動關）
            if (diff === 'hard') {
                Game.TimerManager.setTimeout(dismiss, 10000, 'turnTransition');
            }
        },

        // ── 簡單模式：目標商品逐項朗讀（取代 _speakMustItemsOneByOne）───
        _speakTargetItemsOneByOne() {
            const g = this.state.game;
            const targets = g.targetItems || [];
            if (!targets.length) return;
            let idx = 0;
            const speakNext = () => {
                if (idx >= targets.length) {
                    Game.TimerManager.setTimeout(() => {
                        Game.Speech.speak(`共${toCountSpeech(targets.length)}樣商品，一起去找吧！`);
                    }, 300, 'speech');
                    return;
                }
                const item = targets[idx++];
                Game.Speech.speak(`${item.name}，${toTWD(item.price)}`, () => {
                    Game.TimerManager.setTimeout(speakNext, 350, 'speech');
                });
            };
            speakNext();
        },

        // 舊版相容（保留符號以防外部呼叫）
        _speakMustItemsOneByOne() { this._speakTargetItemsOneByOne(); },

        _renderRoundHTML() {
            const g        = this.state.game;
            const pct      = Math.round((g.currentRound / g.totalRounds) * 100);
            const diffLabel = { easy: '簡單模式', normal: '普通模式', hard: '困難模式' }[this.state.settings.difficulty] || '';
            const _p1ThemeKey  = (g.rounds[g.currentRound] || {}).themeKey || this.state.settings.partyTheme;
            const _p1ThemeData = B5_THEMES[_p1ThemeKey] || B5_THEMES.birthday;
            const themeIcon = _p1ThemeData.icon;

            // 初始化類別（取第一個可用類別）
            const cats = this._getAvailableCategories();
            if (!g.activeCategory || !cats.includes(g.activeCategory)) {
                g.activeCategory = cats[0] || null;
            }
            const activeCat = g.activeCategory;

            return `
            <div class="b-header">
                <div class="b-header-left">
                    <span class="b-header-unit">${themeIcon} ${_p1ThemeData.name}</span>
                </div>
                <div class="b-header-center">步驟一：選購商品</div>
                <div class="b-header-right">
                    <span class="b-progress">第 ${g.currentRound + 1} 關 / 共 ${g.totalRounds} 關</span>
                    <button class="b-reward-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                    <button class="b-back-btn" onclick="Game.showSettings()">返回設定</button>
                </div>
            </div>
            <div class="game-container b5-game-container">
                <!-- 任務卡（B6 b6-task-card pattern） -->
                <div class="b5-task-card">
                    <div class="b5-task-hdr">
                        <div class="b5-task-hdr-left">
                            <div class="b5-task-hdr-text">
                                <div class="b5-task-title">🛒 採購任務<button class="b-inline-replay" id="replay-speech-btn" title="重播語音">🔊</button></div>
                            </div>
                        </div>
                        <div class="b5-task-hdr-right">
                            <img src="../images/common/hint_detective.png" class="b5-task-mascot" onerror="this.style.display='none'" alt="">
                            <button class="b5-p1-hint-btn" id="b5-p1-hint-btn">💡 提示</button>
                        </div>
                    </div>
                    ${this._renderTargetChecklist(g)}
                </div>
                ${this._renderB5BudgetCard(g)}
                <div class="b5-shopping-layout">
                    <div class="b5-cat-list" id="b5-cat-list">${this._renderB5CatList(cats, activeCat)}</div>
                    <div class="b5-cat-panel" id="b5-cat-panel">${this._renderB5CatPanel(activeCat)}</div>
                    <div class="b5-right-panel" id="b5-right-panel">${this._renderB5RightPanel(g)}</div>
                </div>
                <div id="b5-result-area"></div>
            </div>`;
        },

        // ── 目標商品清單（任務卡內，128×128 圖片卡片橫排）─────────────────
        _renderTargetChecklist(g) {
            const diff    = this.state.settings.difficulty;
            const targets = g.targetItems || [];
            if (!targets.length) return '';
            if (diff === 'hard') {
                const selCount = targets.filter(t => g.selectedIds.has(t.id)).length;
                return `<div class="b5-tc-hard-summary">共 ${targets.length} 樣商品｜已選 <span id="b5-tc-sel-count">${selCount}</span> / ${targets.length}</div>`;
            }
            return `<div class="b5-target-checklist" id="b5-target-checklist">
                ${targets.map(item => {
                    const done = g.selectedIds.has(item.id);
                    return `<div class="b5-tc-card${done ? ' done' : ''}" data-tc-id="${item.id}">
                        ${done ? '<span class="b5-tc-check-mark">✅</span>' : ''}
                        <span class="b5-tc-img">${b5IconHTML(item)}</span>
                        <span class="b5-tc-name">${item.name}</span>
                        <span class="b5-tc-price">${item.price}元</span>
                    </div>`;
                }).join('')}
            </div>`;
        },

        _updateTargetChecklist(g) {
            const diff    = this.state.settings.difficulty;
            const targets = g.targetItems || [];
            if (diff === 'hard') {
                const selCount = targets.filter(t => g.selectedIds.has(t.id)).length;
                const el = document.getElementById('b5-tc-sel-count');
                if (el) el.textContent = selCount;
                return;
            }
            targets.forEach(item => {
                const done = g.selectedIds.has(item.id);
                const card = document.querySelector(`.b5-tc-card[data-tc-id="${item.id}"]`);
                if (!card) return;
                card.classList.toggle('done', done);
                let mark = card.querySelector('.b5-tc-check-mark');
                if (done && !mark) {
                    mark = document.createElement('span');
                    mark.className = 'b5-tc-check-mark';
                    mark.textContent = '✅';
                    card.insertBefore(mark, card.firstChild);
                } else if (!done && mark) {
                    mark.remove();
                }
            });
        },

        // ── B1-style 金錢圖示（貪婪分解面額，桌面逐枚 / 手機分組×N）────
        _renderB5MoneyIcons(amount) {
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
            // 手機版：分組 ×N
            const mobileHTML = groups.map(grp => {
                const isBill = grp.denom >= 100;
                const w = isBill ? 34 : 24;
                const badge = grp.count > 1 ? `<span class="b5-mic-count">×${grp.count}</span>` : '';
                return `<span class="b5-mic-item">
                    <img src="../images/money/${grp.denom}_yuan_${rf()}.png" alt="${grp.denom}元"
                         style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;"
                         onerror="this.style.display='none'" draggable="false">${badge}
                </span>`;
            }).join('');
            // 桌面版：逐枚（最多10枚）
            const coins = [];
            for (const grp of groups) {
                for (let i = 0; i < grp.count && coins.length < 10; i++) coins.push(grp.denom);
            }
            const desktopHTML = coins.map(d => {
                const isBill = d >= 100;
                const w = isBill ? 68 : 44;
                return `<img src="../images/money/${d}_yuan_${rf()}.png" alt="${d}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;flex-shrink:0;border-radius:${isBill ? '4px' : '50%'}"
                     onerror="this.style.display='none'" draggable="false">`;
            }).join('');
            return `<span class="b5-mic-desktop">${desktopHTML}</span><span class="b5-mic-mobile">${mobileHTML}</span>`;
        },

        // ── 3欄佈局輔助函數 ──────────────────────────────────────

        _getAvailableCategories() {
            const g = this.state.game;
            const catSet = new Set(g.items.map(i => B5_ITEM_CATEGORIES[i.id] || i.categoryKey).filter(Boolean));
            return Object.keys(B5_CATEGORY_META).filter(c => catSet.has(c));
        },

        _renderB5CatList(cats, activeCat) {
            const g = this.state.game;
            return cats.map(cat => {
                const meta           = B5_CATEGORY_META[cat];
                const catItems       = g.items.filter(i => (B5_ITEM_CATEGORIES[i.id] || i.categoryKey) === cat);
                const catTargetItems = catItems.filter(i => (g.targetIds || new Set()).has(i.id));
                const selCount       = catTargetItems.filter(i => g.selectedIds.has(i.id)).length;
                const isActive       = cat === activeCat;
                const badgeHTML      = catTargetItems.length > 0
                    ? `<span class="b5-cat-tab-badge">${selCount}/${catTargetItems.length}</span>`
                    : '';
                return `<div class="b5-cat-tab${isActive ? ' active' : ''}" data-cat="${cat}">
                    <span class="b5-cat-tab-icon">${meta.icon}</span>
                    <span class="b5-cat-tab-name">${meta.name}</span>
                    ${badgeHTML}
                </div>`;
            }).join('');
        },

        _renderB5CatPanel(activeCat) {
            const meta = activeCat ? B5_CATEGORY_META[activeCat] : null;
            const title = meta ? `${meta.icon} ${meta.name}` : '請選擇類別';
            const itemsHTML = activeCat ? this._renderB5CategoryItems(activeCat)
                : '<div class="b5-cp-hint">← 從左側選擇類別</div>';
            return `
            <div class="b5-cp-header">
                <span class="b5-cp-cat-name" id="b5-cp-cat-name">${title}</span>
            </div>
            <div class="b5-items-grid" id="b5-items-grid">${itemsHTML}</div>`;
        },

        _renderB5CategoryItems(cat) {
            const g = this.state.game;
            const diff = this.state.settings.difficulty;
            const items = g.items.filter(i => (B5_ITEM_CATEGORIES[i.id] || i.categoryKey) === cat);
            if (!items.length) return '<div class="b5-cp-hint">此類別無商品</div>';
            return items.map(item => {
                const isSelected = g.selectedIds.has(item.id);
                const isTarget   = (g.targetIds || new Set()).has(item.id);
                // 僅簡單模式顯示「指定」標示（普通/困難模式讓學生自行記憶）
                const showTarget = isTarget && diff === 'easy';
                return `<div class="b5-item-card${isSelected ? ' selected' : ''}${showTarget ? ' b5-item-target' : ''}" data-id="${item.id}">
                    ${showTarget ? '<span class="b5-target-badge">指定</span>' : ''}
                    <span class="b5-item-icon">${b5IconHTML(item)}</span>
                    <span class="b5-item-name">${item.name}</span>
                    <span class="b5-item-price" data-price="${item.price}">${item.price} 元</span>
                    ${isSelected ? '<span class="b5-check-mark">✅</span>' : ''}
                </div>`;
            }).join('');
        },

        _renderB5BudgetCard(g) {
            const total     = this._getTotal();
            const selCount  = g.selectedIds.size;
            const totalCount = (g.targetIds || new Set()).size;
            const pct        = totalCount > 0 ? Math.min(Math.round(selCount / totalCount * 100), 100) : 0;
            const meterCls   = pct >= 100 ? ' ok' : pct > 0 ? ' ok' : '';
            return `
            <div class="b5-budget-standalone-card" id="b5-budget-standalone-card">
                <div class="b5-rp-budget-row">
                    <span class="b5-rp-label">採購進度</span>
                    <span class="b5-rp-budget-val" id="b5-sel-progress">${selCount} / ${totalCount} 樣</span>
                </div>
                <div class="b5-budget-meter">
                    <div class="b5-budget-meter-fill${meterCls}" id="b5-budget-meter-fill" style="width:${pct}%"></div>
                    <span class="b5-meter-label" id="b5-meter-label">${pct}%</span>
                </div>
                <div class="b5-rp-spent-row">
                    <span>已選 <b id="b5-total-amount">${total}</b> 元</span>
                    <span>合計 <b>${g.budget}</b> 元</span>
                </div>
            </div>`;
        },

        _renderB5RightPanel(g) {
            const total = this._getTotal();
            const canConfirm = g.selectedIds.size > 0 && g.selectedIds.size === (g.targetIds || new Set()).size;
            const selectedItems = g.items.filter(i => g.selectedIds.has(i.id));
            const cartHTML = selectedItems.length
                ? selectedItems.map(i =>
                    `<div class="b5-cart-item" data-id="${i.id}">
                        <span class="b5-ci-name">${i.icon} ${i.name}</span>
                        <span class="b5-ci-price">${i.price}元</span>
                        <button class="b5-ci-remove" data-id="${i.id}" title="取消">✕</button>
                    </div>`).join('')
                : '<div class="b5-cart-empty">尚未選購任何商品</div>';
            return `
            <div class="b5-cart-header">🛒 購物清單</div>
            <div class="b5-cart-items" id="b5-cart-items">${cartHTML}</div>
            <button class="b5-confirm-btn${canConfirm ? ' ready' : ''}" id="b5-confirm-btn" ${canConfirm ? '' : 'disabled'}>確認購買</button>`;
        },

        _switchB5Category(cat) {
            const g = this.state.game;
            g.activeCategory = cat;
            document.querySelectorAll('.b5-cat-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.cat === cat);
            });
            const meta = B5_CATEGORY_META[cat];
            const nameEl = document.getElementById('b5-cp-cat-name');
            if (nameEl && meta) nameEl.textContent = `${meta.icon} ${meta.name}`;
            const grid = document.getElementById('b5-items-grid');
            if (grid) grid.innerHTML = this._renderB5CategoryItems(cat);
            this._updateTotalBar(); // refresh affordable highlights
            this.audio.play('click');
        },

        _updateCartPanel() {
            const g        = this.state.game;
            const total    = this._getTotal();
            const selCount = g.selectedIds.size;
            const totalCount = (g.targetIds || new Set()).size;
            const pct      = totalCount > 0 ? Math.min(Math.round(selCount / totalCount * 100), 100) : 0;

            const fillEl = document.getElementById('b5-budget-meter-fill');
            if (fillEl) { fillEl.style.width = pct + '%'; fillEl.className = 'b5-budget-meter-fill ok'; }
            const labelEl = document.getElementById('b5-meter-label');
            if (labelEl) labelEl.textContent = pct + '%';
            const progEl = document.getElementById('b5-sel-progress');
            if (progEl) progEl.textContent = `${selCount} / ${totalCount} 樣`;
            const totalEl = document.getElementById('b5-total-amount');
            if (totalEl) totalEl.textContent = total;

            const cartEl = document.getElementById('b5-cart-items');
            if (cartEl) {
                const sel = g.items.filter(i => g.selectedIds.has(i.id));
                cartEl.innerHTML = sel.length
                    ? sel.map(i =>
                        `<div class="b5-cart-item" data-id="${i.id}">
                            <span class="b5-ci-name">${i.icon} ${i.name}</span>
                            <span class="b5-ci-price">${i.price}元</span>
                            <button class="b5-ci-remove" data-id="${i.id}" title="取消">✕</button>
                        </div>`).join('')
                    : '<div class="b5-cart-empty">尚未選購任何商品</div>';
            }

            const canConfirm = g.selectedIds.size > 0 && g.selectedIds.size === (g.targetIds || new Set()).size;
            const btn = document.getElementById('b5-confirm-btn');
            if (btn) { btn.disabled = !canConfirm; btn.classList.toggle('ready', canConfirm); }
        },

        _updateCatBadges() {
            const g    = this.state.game;
            const cats = this._getAvailableCategories();
            cats.forEach(cat => {
                const catItems       = g.items.filter(i => (B5_ITEM_CATEGORIES[i.id] || i.categoryKey) === cat);
                const catTargetItems = catItems.filter(i => (g.targetIds || new Set()).has(i.id));
                const selCount       = catTargetItems.filter(i => g.selectedIds.has(i.id)).length;
                const tab  = document.querySelector(`.b5-cat-tab[data-cat="${cat}"]`);
                if (!tab) return;
                let badge = tab.querySelector('.b5-cat-tab-badge');
                if (catTargetItems.length > 0) {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'b5-cat-tab-badge';
                        tab.appendChild(badge);
                    }
                    badge.textContent = `${selCount}/${catTargetItems.length}`;
                } else if (badge) {
                    badge.remove();
                }
            });
        },

        _renderMagicItemsPanel() {
            const items  = this.state.settings.magicItems || [];
            const catMeta = B5_CATEGORY_META;
            const listHTML = items.map((mi, idx) => `
                <div class="b5-mp-item-row" data-mp-idx="${idx}">
                    <span class="b5-mp-item-icon">${b5IconHTML(mi)}</span>
                    <span class="b5-mp-item-cat">${catMeta[mi.categoryKey]?.icon || '✨'}</span>
                    <span class="b5-mp-item-name">${mi.name}</span>
                    <button class="b5-mp-item-price" data-mp-price-idx="${idx}">${mi.price}元</button>
                    <button class="b5-mp-del-btn" data-mp-del="${idx}">✕</button>
                </div>`).join('');
            return `
            <div id="b5-magic-panel" style="display:${this.state.settings.customItemsEnabled ? '' : 'none'};margin-top:10px;">
                <div id="b5-mp-list">${listHTML}</div>
                <div class="b5-mp-add-box">
                    <div class="b5-mp-row">
                        <span class="b5-mp-label">類別：</span>
                        <button class="b5-mp-cat-btn active" data-mp-cat="food">🍱 食物</button>
                        <button class="b5-mp-cat-btn" data-mp-cat="decor">🎊 裝飾</button>
                        <button class="b5-mp-cat-btn" data-mp-cat="activity">🎯 遊戲</button>
                    </div>
                    <div class="b5-mp-row">
                        <input type="file" id="b5-mp-file" accept="image/*" style="display:none">
                        <button class="b5-mp-upload-btn" id="b5-mp-upload-btn" title="上傳圖片（選填）">📷</button>
                        <img id="b5-mp-preview" class="b5-mp-img-preview" style="display:none" alt="">
                        <input type="text" id="b5-mp-name" class="b5-cip-input" placeholder="名稱（最多6字）" maxlength="6" style="flex:1;">
                        <button class="b5-cip-input b5-cip-price-inp b5-mp-price-btn" id="b5-mp-price-btn" type="button">金額</button>
                        <button class="b5-cip-add-btn" id="b5-mp-add-btn">＋</button>
                    </div>
                </div>
            </div>`;
        },

        _bindMagicItemsPanel() {
            const s = this.state.settings;
            if (!s.magicItems) s.magicItems = [];
            const uploadBtn0 = document.getElementById('b5-mp-upload-btn');
            if (!uploadBtn0 || uploadBtn0._b5MpBound) return;
            uploadBtn0._b5MpBound = true;
            let pendingImageUrl = null;
            let selectedPrice   = 0;
            let selectedCat = document.querySelector('.b5-mp-cat-btn.active')?.dataset.mpCat || 'food';

            // 金額數字鍵盤
            const priceBtn = document.getElementById('b5-mp-price-btn');
            if (priceBtn) {
                Game.EventManager.on(priceBtn, 'click', () => {
                    this._showMpPriceNumpad(selectedPrice, (n) => {
                        selectedPrice = n;
                        priceBtn.textContent = `${n} 元`;
                        priceBtn.classList.add('b5-mp-price-btn--set');
                    });
                }, {}, 'settings');
            }

            // 類別選擇
            document.querySelectorAll('.b5-mp-cat-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('.b5-mp-cat-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedCat = btn.dataset.mpCat;
                }, {}, 'settings');
            });

            // 圖片上傳
            const fileInput = document.getElementById('b5-mp-file');
            const uploadBtn = document.getElementById('b5-mp-upload-btn');
            const preview   = document.getElementById('b5-mp-preview');
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

            // 新增按鈕
            const addBtn = document.getElementById('b5-mp-add-btn');
            if (addBtn) {
                Game.EventManager.on(addBtn, 'click', () => {
                    const catNames = { food:'食物', decor:'裝飾', activity:'遊戲' };
                    if (s.magicItems.some(mi => mi.categoryKey === selectedCat)) {
                        alert(`「${catNames[selectedCat] || selectedCat}」類別已有 1 項魔法商品\n每類別限 1 項，共最多 3 項`);
                        return;
                    }
                    const name = document.getElementById('b5-mp-name')?.value.trim();
                    if (!name) { alert('請輸入商品名稱'); return; }
                    if (!selectedPrice || selectedPrice < 1) { alert('請輸入金額'); return; }
                    if (selectedPrice > 500) { alert('每件魔法商品上限為 500 元\n（3 件合計最多 1,500 元）'); return; }
                    const item = {
                        id: `magic-b5-${Date.now()}`,
                        name,
                        price: selectedPrice,
                        icon: '✨',
                        imageUrl: pendingImageUrl || null,
                        categoryKey: selectedCat,
                        isCustom: true,
                    };
                    s.magicItems.push(item);
                    pendingImageUrl = null;
                    selectedPrice = 0;
                    if (preview) { preview.src = ''; preview.style.display = 'none'; }
                    document.getElementById('b5-mp-name').value = '';
                    const pb = document.getElementById('b5-mp-price-btn');
                    if (pb) { pb.textContent = '金額'; pb.classList.remove('b5-mp-price-btn--set'); }
                    if (fileInput) fileInput.value = '';
                    this._refreshMagicItemsList();
                }, {}, 'settings');
            }

            // 刪除（委派於清單容器）
            const list = document.getElementById('b5-mp-list');
            if (list) {
                Game.EventManager.on(list, 'click', (e) => {
                    const priceBtn = e.target.closest('[data-mp-price-idx]');
                    if (priceBtn) {
                        const idx = parseInt(priceBtn.dataset.mpPriceIdx);
                        this._showMpPriceNumpad(s.magicItems[idx].price, (n) => {
                            s.magicItems[idx].price = n;
                            this._refreshMagicItemsList();
                        });
                        return;
                    }
                    const delBtn = e.target.closest('[data-mp-del]');
                    if (!delBtn) return;
                    const idx = parseInt(delBtn.dataset.mpDel);
                    s.magicItems.splice(idx, 1);
                    this._refreshMagicItemsList();
                }, {}, 'settings');
            }
        },

        _refreshMagicItemsList() {
            const list = document.getElementById('b5-mp-list');
            if (!list) return;
            const items   = this.state.settings.magicItems || [];
            const catMeta = B5_CATEGORY_META;
            list.innerHTML = items.map((mi, idx) => `
                <div class="b5-mp-item-row" data-mp-idx="${idx}">
                    <span class="b5-mp-item-icon">${b5IconHTML(mi)}</span>
                    <span class="b5-mp-item-cat">${catMeta[mi.categoryKey]?.icon || '✨'}</span>
                    <span class="b5-mp-item-name">${mi.name}</span>
                    <button class="b5-mp-item-price" data-mp-price-idx="${idx}">${mi.price}元</button>
                    <button class="b5-mp-del-btn" data-mp-del="${idx}">✕</button>
                </div>`).join('');
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

        _bindRoundEvents() {
            const g = this.state.game;

            // ① 類別標籤點擊（委派於 b5-cat-list）
            const catList = document.getElementById('b5-cat-list');
            if (catList) {
                Game.EventManager.on(catList, 'click', (e) => {
                    const tab = e.target.closest('.b5-cat-tab');
                    if (!tab || tab.dataset.cat === g.activeCategory) return;
                    this._switchB5Category(tab.dataset.cat);
                }, {}, 'gameUI');
            }

            // ② 商品卡片點擊（委派於 b5-cat-panel — 切換類別後 grid 重繪，但 panel 不變）
            const catPanel = document.getElementById('b5-cat-panel');
            if (catPanel) {
                Game.EventManager.on(catPanel, 'click', (e) => {
                    if (g.submitted) return;
                    const card = e.target.closest('.b5-item-card');
                    if (!card) return;
                    const id   = card.dataset.id;
                    const item = g.items.find(i => i.id === id);
                    if (!item) return;

                    const diff = this.state.settings.difficulty;

                    if (g.selectedIds.has(id)) {
                        // 簡單/提示模式：已選的目標商品不可取消
                        if (g.p1HintMode) {
                            this.audio.play('error');
                            this._b5P1ShowWrongTip('提示商品不可以取消', '');
                            Game.Speech.speak('提示商品不可以取消');
                            return;
                        }
                        g.selectedIds.delete(id);
                        card.classList.remove('selected');
                        this.audio.play('click');
                        Game.Speech.speak(`取消${item.name}`);
                        this._updateTotalBar();
                        this._updateTargetChecklist(g);
                        return;
                    }

                    // 新模型：只能選目標商品，選到非目標商品 → 錯誤
                    if (!g.targetIds.has(id)) {
                        this.audio.play('error');
                        this._b5P1ShowWrongTip('❌ 不對喔！這不在採購清單上', '請仔細看看清單');
                        Game.Speech.speak(`不對喔，${item.name}不在採購清單上`);
                        // 普通模式：3次錯誤自動提示
                        if (diff === 'normal' && !g.p1HintMode) {
                            g.p1ErrorCount = (g.p1ErrorCount || 0) + 1;
                            if (g.p1ErrorCount >= 3) {
                                g.p1ErrorCount = 0;
                                Game.TimerManager.setTimeout(() => this._b5P1ShowHint(), 900, 'ui');
                            }
                        }
                        return;
                    }

                    // 提示模式守衛（簡單模式：只能點下一個提示商品）
                    if (diff === 'easy' && g.p1HintMode) {
                        const nextHint = (g.p1HintItems || []).find(hid => !g.selectedIds.has(hid));
                        if (nextHint && id !== nextHint) {
                            this.audio.play('error');
                            this._b5P1ShowWrongTip('請跟著提示順序選', '找到橘色「點這裡」的商品');
                            Game.Speech.speak('不對喔，請按照提示選商品');
                            return;
                        }
                    }

                    // 加入選取
                    g.selectedIds.add(id);
                    card.classList.add('selected');
                    this.audio.play('correct');
                    this._showItemFlyout(item);
                    this._updateTotalBar();
                    this._updateTargetChecklist(g);

                    if (diff === 'easy' && g.p1HintMode) {
                        // 簡單模式：語音播完後才進行下一步
                        if (g.selectedIds.size === g.targetIds.size) {
                            // 最後一個商品：語音完成後顯示確認提示
                            this.state.isProcessing = true;
                            Game.Speech.speak(`${item.name}，${toTWD(item.price)}`, () => {
                                document.getElementById('b5-confirm-btn')?.classList.add('b5-hint-here');
                                Game.Speech.speak('所有商品選購完成，可以確認購買了！', () => {
                                    this.state.isProcessing = false;
                                    AssistClick.buildQueue();
                                });
                            });
                        } else {
                            // 還有下一個提示商品
                            const nextHintId = (g.p1HintItems || []).find(hid => !g.selectedIds.has(hid));
                            const nextCat = nextHintId ? B5_ITEM_CATEGORIES[nextHintId] : null;
                            if (nextCat && nextCat !== g.activeCategory) {
                                // 下一個在不同類別：切換類別並朗讀類別名稱
                                this.state.isProcessing = true;
                                Game.Speech.speak(`${item.name}，${toTWD(item.price)}`, () => {
                                    this._switchB5Category(nextCat);
                                    const meta = B5_CATEGORY_META[nextCat];
                                    Game.Speech.speak(meta ? meta.name : '', () => {
                                        this.state.isProcessing = false;
                                        AssistClick.buildQueue();
                                    });
                                });
                            } else {
                                // 同類別：語音完成後高亮下一個提示商品
                                this.state.isProcessing = true;
                                Game.Speech.speak(`${item.name}，${toTWD(item.price)}`, () => {
                                    this.state.isProcessing = false;
                                    AssistClick.buildQueue();
                                });
                            }
                        }
                    } else {
                        // 普通/困難模式
                        if (g.selectedIds.size === g.targetIds.size) {
                            // 最後一個：唸完商品名稱後，再唸完成語音才解鎖
                            this.state.isProcessing = true;
                            Game.Speech.speak(`${item.name}，${toTWD(item.price)}`, () => {
                                document.getElementById('b5-confirm-btn')?.classList.add('b5-hint-here');
                                Game.Speech.speak('所有商品選購完成，可以確認購買了！', () => {
                                    this.state.isProcessing = false;
                                    AssistClick.buildQueue();
                                });
                            });
                        } else if (diff === 'normal' && g.p1HintMode) {
                            // 普通提示模式：選中提示商品後退出提示模式，讓錯誤計數重新累積
                            g.p1HintMode   = false;
                            g.p1ErrorCount = 0;
                            this._b5P1UpdateHintHighlights();
                            Game.Speech.speak(`${item.name}，${toTWD(item.price)}`);
                        } else {
                            Game.Speech.speak(`${item.name}，${toTWD(item.price)}`);
                        }
                    }
                }, {}, 'gameUI');
            }

            // ③ 購物清單「✕」取消（委派於 b5-right-panel）
            const rightPanel = document.getElementById('b5-right-panel');
            if (rightPanel) {
                Game.EventManager.on(rightPanel, 'click', (e) => {
                    if (g.submitted) return;
                    const removeBtn = e.target.closest('.b5-ci-remove');
                    if (!removeBtn) return;
                    e.stopPropagation();
                    const id = removeBtn.dataset.id;
                    // 提示模式：已選商品不可取消
                    if (g.p1HintMode) {
                        this.audio.play('error');
                        this._b5P1ShowWrongTip('提示商品不可以取消', '');
                        Game.Speech.speak('提示商品不可以取消');
                        return;
                    }
                    const item = g.items.find(i => i.id === id);
                    g.selectedIds.delete(id);
                    if (item) Game.Speech.speak(`取消${item.name}`);
                    this.audio.play('click');
                    this._updateTotalBar();
                    this._updateTargetChecklist(g);
                    const card = document.querySelector(`.b5-item-card[data-id="${id}"]`);
                    if (card) card.classList.remove('selected');
                }, {}, 'gameUI');
            }

            // ④ 確認購買按鈕
            const confirmBtn = document.getElementById('b5-confirm-btn');
            if (confirmBtn) {
                Game.EventManager.on(confirmBtn, 'click', () => {
                    if (g.submitted) return;
                    // 所有目標商品已選完：切斷語音、解除 isProcessing，直接進行結帳
                    if (g.selectedIds.size === g.targetIds.size && g.selectedIds.size > 0) {
                        window.speechSynthesis.cancel();
                        this.state.isProcessing = false;
                    }
                    this._handleConfirm();
                }, {}, 'gameUI');
            }

            // ⑤ 提示按鈕（B6 _b6P1ShowHint pattern）
            const hintBtn = document.getElementById('b5-p1-hint-btn');
            if (hintBtn) {
                Game.EventManager.on(hintBtn, 'click', () => {
                    this._b5P1ShowHint();
                }, {}, 'gameUI');
            }

            // ⑥ 語音重播
            const replayBtn = document.getElementById('replay-speech-btn');
            if (replayBtn) {
                Game.EventManager.on(replayBtn, 'click', () => {
                    const g2 = this.state.game;
                    const nameList = (g2.targetItems || []).map(i => i.name).join('、');
                    Game.Speech.speak(`採購任務，今天要買${nameList}`);
                }, {}, 'gameUI');
            }

        },

        // ── 預算提示鈕（B1 _showCoinHint pattern）────────────────
        _showBudgetHint() {
            const g = this.state.game;
            if (g.submitted) return;
            const remaining = g.budget - this._getTotal();
            const affordable = g.items.filter(i =>
                !g.selectedIds.has(i.id) && i.price <= remaining
            );
            // 高亮可選商品
            document.querySelectorAll('.b5-item-card:not(.selected)').forEach(card => {
                const id = card.dataset.id;
                if (affordable.some(a => a.id === id)) {
                    card.classList.add('b5-hint-glow');
                    Game.TimerManager.setTimeout(
                        () => card.classList.remove('b5-hint-glow'), 2500, 'ui'
                    );
                }
            });
            if (affordable.length === 0) {
                Game.Speech.speak(`還剩${toTWD(remaining)}，沒有可以加選的商品了`);
            } else {
                const nameWithPrice = affordable.map(i => `${i.name}${toTWD(i.price)}`).join('或');
                Game.Speech.speak(`還剩${toTWD(remaining)}，可以加選${nameWithPrice}`);
            }
        },

        // ── 困難模式提示彈窗：重新顯示購物清單，已購項目淡化 ────
        _showHardModeHintModal() {
            const g = this.state.game;
            const targets = g.targetItems || [];
            const existing = document.getElementById('b5-hard-hint-modal');
            if (existing) existing.remove();

            // 按類別分組（food → decor → activity）
            const catOrder = ['food', 'decor', 'activity'];
            const byCategory = {};
            catOrder.forEach(c => { byCategory[c] = []; });
            targets.forEach(item => {
                const cat = B5_ITEM_CATEGORIES[item.id] || 'activity';
                (byCategory[cat] = byCategory[cat] || []).push(item);
            });

            const categoriesHTML = catOrder.map(cat => {
                const items = byCategory[cat];
                if (!items.length) return '';
                const meta = B5_CATEGORY_META[cat];
                const itemsHTML = items.map(item => {
                    const done = g.selectedIds.has(item.id);
                    const speechText = `${item.name}，${toTWD(item.price)}`;
                    return `<div class="b5-hmcat-item${done ? ' b5-hmcat-item-done' : ''}">
                        ${done ? '<span class="b5-hmcat-check">✓</span>' : ''}
                        <span class="b5-hmcat-img">${b5IconHTML(item)}</span>
                        <div class="b5-hmcat-info">
                            <div class="b5-hmcat-name">${item.name}</div>
                            <div class="b5-hmcat-price">${item.price}元</div>
                        </div>
                        <button class="b5-hmcat-speak-btn" data-speech="${speechText}" title="播放語音">🔊</button>
                    </div>`;
                }).join('');
                return `<div class="b5-hmcat-section">
                    <div class="b5-hmcat-hdr">
                        <span class="b5-hmcat-hdr-icon">${meta.icon}</span>
                        <span class="b5-hmcat-hdr-name">${meta.name}</span>
                    </div>
                    <div class="b5-hmcat-items">${itemsHTML}</div>
                </div>`;
            }).join('');

            const selCount = [...g.selectedIds].filter(id => g.targetIds.has(id)).length;
            const themeIcon = (B5_THEMES[g.rounds?.[g.currentRound]?.themeKey] || B5_THEMES.birthday).icon;

            const overlay = document.createElement('div');
            overlay.id = 'b5-hard-hint-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:10200;';
            overlay.innerHTML = `
                <div class="b5-hmcat-modal">
                    <div class="b5-hmcat-modal-hdr">
                        <span class="b5-hmcat-modal-icon">${themeIcon}</span>
                        <h3 class="b5-hmcat-modal-title">困難模式 — 採購清單</h3>
                        <p class="b5-hmcat-modal-desc">請記住並購買以下所有商品</p>
                        <div class="b5-hmcat-modal-progress">已選 ${selCount} / ${targets.length} 樣</div>
                    </div>
                    <div class="b5-hmcat-modal-body">${categoriesHTML}</div>
                    <button class="b5-hmcat-close-btn" id="b5-hmcat-close">我記住了，開始購物！</button>
                </div>`;
            document.body.appendChild(overlay);

            overlay.querySelectorAll('.b5-hmcat-speak-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', e => {
                    e.stopPropagation();
                    Game.Speech.speak(btn.dataset.speech || '');
                }, {}, 'gameUI');
            });
            const close = () => { window.speechSynthesis.cancel(); overlay.remove(); };
            Game.EventManager.on(document.getElementById('b5-hmcat-close'), 'click', close, {}, 'gameUI');
            Game.EventManager.on(overlay, 'click', e => { if (e.target === overlay) close(); }, {}, 'gameUI');
        },

        // ── B5 Phase 1 提示系統（B6 _b6P1ShowHint pattern）───────────
        _b5P1ShowHint() {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            if (diff === 'hard') {
                // 困難模式：不重置已選，直接顯示採購清單彈窗（已購項目淡化）
                this._showHardModeHintModal();
                return;
            }
            // 普通模式：播放提示語音
            if (diff === 'normal') {
                Game.Speech.speak('請依提示，採購指定的物品');
            }
            // 保留已正確採購的商品，只對尚未採購的商品給予引導
            this._switchB5Category(g.activeCategory);
            this._b5P1ActivateHintMode();
        },

        _b5P1GenerateHintItems() {
            const g = this.state.game;
            return [...(g.targetIds || new Set())];
        },

        _b5P1UpdateHintHighlights() {
            const g = this.state.game;
            document.querySelectorAll('.b5-item-card').forEach(c => c.classList.remove('b5-hint-here'));
            if (!g || !g.p1HintMode) return;
            const diff = this.state.settings.difficulty;
            if (diff === 'hard') return;
            const hintIds = g.p1HintItems || [];
            const unselected = hintIds.filter(id => !g.selectedIds.has(id));
            const toHighlight = diff !== 'hard' ? unselected.slice(0, 1) : unselected;
            toHighlight.forEach(id => {
                const card = document.querySelector(`.b5-item-card[data-id="${id}"]`);
                if (card) card.classList.add('b5-hint-here');
            });
        },

        _b5P1ActivateHintMode() {
            const g = this.state.game;
            g.p1HintMode = true;
            if (!g.p1HintItems || g.p1HintItems.length === 0) {
                g.p1HintItems = this._b5P1GenerateHintItems();
            }
            // 自動切換到第一個提示商品的類別
            const firstId = g.p1HintItems.find(hid => !g.selectedIds.has(hid));
            if (firstId) {
                const mi  = (this.state.settings.magicItems || []).find(m => m.id === firstId);
                const cat = B5_ITEM_CATEGORIES[firstId] || mi?.categoryKey;
                if (cat && cat !== g.activeCategory) this._switchB5Category(cat);
            }
            this._b5P1UpdateHintHighlights();
        },

        _b5P1ShowWrongTip(msg, hint) {
            const tipId = 'b5-wrong-tip';
            let tip = document.getElementById(tipId);
            if (!tip) { tip = document.createElement('div'); tip.id = tipId; document.body.appendChild(tip); }
            tip.className = 'b5-wrong-tip';
            tip.innerHTML = `<div class="b5-wt-msg">${msg}</div>${hint ? `<div class="b5-wt-hint">${hint}</div>` : ''}`;
            Game.TimerManager.clearByCategory('wrongTip');
            Game.TimerManager.setTimeout(() => { if (document.body.contains(tip)) tip.remove(); }, 2400, 'wrongTip');
        },

        _getTotal() {
            const g = this.state.game;
            return g.items
                .filter(item => g.selectedIds.has(item.id))
                .reduce((sum, item) => sum + item.price, 0);
        },

        // ── 商品選取彈窗（白底設計：圖片256×256 + 名稱 + 金額，彈窗期間封鎖點擊）──
        _showItemFlyout(item) {
            document.querySelector('.b5-item-flyout')?.remove();
            document.querySelector('.b5-flyout-blocker')?.remove();
            // 透明阻擋層：彈窗期間防止點到下方商品
            const blocker = document.createElement('div');
            blocker.className = 'b5-flyout-blocker';
            document.body.appendChild(blocker);
            const flyout = document.createElement('div');
            flyout.className = 'b5-item-flyout';
            flyout.innerHTML = `
                <div class="b5-if-img">${b5IconHTML(item)}</div>
                <div class="b5-if-name">${item.name}</div>
                <div class="b5-if-price">✅ +${item.price} 元</div>`;
            document.body.appendChild(flyout);
            Game.TimerManager.setTimeout(() => {
                flyout.classList.add('b5-if-fade');
                if (document.body.contains(blocker)) blocker.remove();
                Game.TimerManager.setTimeout(() => { if (flyout.parentNode) flyout.remove(); }, 400, 'ui');
            }, 1800, 'ui');
        },

        _updateTotalBar() {
            this._updateCartPanel();
            this._updateCatBadges();
            // 可負擔商品高亮（目前可見商品卡片）
            const g          = this.state.game;
            const total      = this._getTotal();
            const remBudget  = g.budget - total;
            document.querySelectorAll('.b5-item-card').forEach(card => {
                const item = g.items.find(i => i.id === card.dataset.id);
                if (!item) return;
                const isSelected = g.selectedIds.has(item.id);
                card.classList.toggle('b5-affordable', !isSelected && item.price <= remBudget);
            });
            this._b5P1UpdateHintHighlights();
        },

        _showCenterFeedback(icon, text = '') {
            document.querySelector('.b-center-feedback')?.remove();
            const overlay = document.createElement('div');
            overlay.className = 'b-center-feedback';
            overlay.innerHTML = `<span class="b-cf-icon">${icon}</span>${text ? `<span class="b-cf-text">${text}</span>` : ''}`;
            document.body.appendChild(overlay);
            Game.TimerManager.setTimeout(() => overlay.remove(), 1200, 'ui');
        },

        // ── 11. 確認購買 ──────────────────────────────────────
        _handleConfirm() {
            if (this.state.isProcessing) return;
            this.state.isProcessing = true;

            const g     = this.state.game;
            g.submitted = true;
            const total = this._getTotal();

            // 新模型：只要選了所有目標商品就正確（目標商品才可被選，所以 size 相等即正確）
            const allTargetSelected = g.selectedIds.size === g.targetIds.size;
            const isCorrect = allTargetSelected && g.selectedIds.size > 0;

            document.querySelectorAll('.b5-item-card').forEach(c => c.classList.add('disabled'));
            const btn = document.getElementById('b5-confirm-btn');
            if (btn) btn.disabled = true;

            const resultArea = document.getElementById('b5-result-area');
            if (resultArea) {
                if (isCorrect) {
                    resultArea.innerHTML = '';
                } else {
                    const missing = [...g.targetIds].filter(id => !g.selectedIds.has(id));
                    const missingItems = missing.map(id => g.items.find(i => i.id === id)).filter(Boolean);
                    const missingHTML = missingItems.map(i =>
                        `<div class="b5-bd-row"><span>${i.icon} ${i.name}</span><span>${i.price}元</span></div>`
                    ).join('');
                    resultArea.innerHTML = missingItems.length > 0 ? `
                        <div class="b5-breakdown">
                            <div class="b5-bd-title">📋 還沒選到的商品</div>
                            ${missingHTML}
                        </div>` : '';
                }
            }

            if (isCorrect) {
                g.correctCount++;
                g.streak = (g.streak || 0) + 1;
                // 記錄各關預算使用（B6 receipts pattern）
                g.roundStats.push({ roundNum: g.currentRound + 1, budget: g.budget, spent: total });
                // 記錄本關選購物品（per-round list for review page navigation）
                const roundItemObjects = g.items.filter(i => g.selectedIds.has(i.id)).map(i => ({ icon: i.icon, name: i.name, price: i.price }));
                const roundTotal = roundItemObjects.reduce((s, i) => s + i.price, 0);
                if (!g.roundItemsList) g.roundItemsList = [];
                g.roundItemsList.push({ roundNum: g.currentRound + 1, items: roundItemObjects, total: roundTotal, themeKey: (g.rounds[g.currentRound] || {}).themeKey || 'birthday' });
                g.items.filter(i => g.selectedIds.has(i.id)).forEach(i => {
                    if (!g.successfulRoundItems.includes(`${i.icon} ${i.name}`))
                        g.successfulRoundItems.push(`${i.icon} ${i.name}`);
                });
                this.audio.play('correct');
                this._showCenterFeedback('🎊', '太棒了，派對辦起來！');
                Game.Speech.speak(`太棒了！${toCountSpeech(g.targetItems.length)}樣商品都選好了，前往結帳！`, () => {
                    Game.TimerManager.setTimeout(() => {
                        const selectedItems = g.items.filter(i => g.selectedIds.has(i.id));
                        this._renderB5Phase2(selectedItems, total);
                    }, 300, 'turnTransition');
                });
            } else {
                g.streak = 0;
                g.roundErrors = (g.roundErrors || 0) + 1;
                this.audio.play('error');
                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                this._showCenterFeedback('❌', '還有商品沒選到！');
                Game.Speech.speak(`不對喔，記得要選所有指定的商品喔！請再試一次！`);
                if (g.roundErrors >= 3) {
                    Game.TimerManager.setTimeout(() => this._b5P1ShowHint(), 800, 'ui');
                }
            }

            // 錯誤 → 重試/跳過按鈕（正確路徑已由語音 callback 驅動）
            if (!isCorrect) Game.TimerManager.setTimeout(() => {
                const resultArea2 = document.getElementById('b5-result-area');
                if (resultArea2) {
                    const retryBtn = document.createElement('button');
                    retryBtn.className = 'b5-next-btn';
                    retryBtn.textContent = '🔄 再試一次';
                    retryBtn.style.background = '#6366f1';
                    Game.EventManager.on(retryBtn, 'click', () => this.renderRound(), {}, 'gameUI');
                    resultArea2.appendChild(retryBtn);
                    const skipBtn = document.createElement('button');
                    skipBtn.className = 'b5-next-btn';
                    skipBtn.textContent = '下一關 →';
                    skipBtn.style.cssText = 'background:#9ca3af;margin-top:8px;';
                    Game.EventManager.on(skipBtn, 'click', () => this.nextRound(), {}, 'gameUI');
                    resultArea2.appendChild(skipBtn);
                }
            }, 1400, 'turnTransition');
        },

        // ════════════════════════════════════════════════════════
        // ── 12. B5 Phase 2：付款操作（B6 pattern）─────────────────
        // ════════════════════════════════════════════════════════
        _renderB5Phase2(selectedItems, total) {
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');
            this.state.isProcessing = false;
            const g = this.state.game;
            g.p2Wallet     = [];
            g.p2UidCtr     = 0;
            g.p2ErrorCount = 0;
            g.p2Total      = total;
            g.p2TrayFaces  = {};
            g.p2ShowHint   = false;
            g.p2HintSlots  = [];

            // 錢包：單張標準鈔票（等於 budget 面額），拖曳付款後必有找零
            const diff      = this.state.settings.difficulty;
            const trayFaces = { [g.budget]: Math.random() < 0.5 ? 'back' : 'front' };
            const budgetCoins = [g.budget]; // 單張鈔票
            g.p2BudgetFaces = trayFaces;
            g.p2BudgetCoins = budgetCoins;
            g.p2TrayFaces   = trayFaces;

            const diffLabel = { easy: '簡單模式', normal: '普通模式', hard: '困難模式' }[diff] || '';
            const themeKey  = (g.rounds[g.currentRound] || {}).themeKey || this.state.settings.partyTheme;
            const themeData = B5_THEMES[themeKey] || B5_THEMES.birthday;
            const app = document.getElementById('app');
            app.innerHTML = `
            <div class="b-header">
                <div class="b-header-left">
                    <span class="b-header-unit">${themeData.icon} ${themeData.name}</span>
                </div>
                <div class="b-header-center">步驟二：付款</div>
                <div class="b-header-right">
                    <span class="b-progress">第 ${g.currentRound + 1} 關 / 共 ${g.totalRounds} 關</span>
                    <button class="b-reward-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                    <button class="b-back-btn" onclick="Game.showSettings()">返回設定</button>
                </div>
            </div>
            <div class="game-container">
                ${this._renderB5P2RefCard(selectedItems, total, themeData)}
                ${this._renderB5P2WalletArea(total)}
                ${diff !== 'easy' ? `<button class="b5-confirm-btn b5-p2-confirm-wrap" id="b5-p2-confirm-btn" disabled>✅ 確認付款</button>` : ''}
                ${this._renderB5P2CoinTray()}
            </div>`;

            this._bindB5P2Events(total);
            this._b5P2SetupDragDrop();

            Game.TimerManager.setTimeout(() => {
                Game.Speech.speak(`共消費${toTWD(total)}，請拖曳正確的金錢圖示付款。`);
            }, 300, 'speech');

            if (diff === 'easy') {
                this._b5P2AutoSetGhostSlots();
                this._b5P2UpdateWalletDisplay();
                this._b5P2UpdatePayTrayHints();
            }

            if (this.state.settings.clickMode === 'on') {
                Game.TimerManager.setTimeout(() => AssistClick.activate(), 500, 'ui');
            }
        },

        _renderB5P2RefCard(selectedItems, total, themeData) {
            const allItems = [...selectedItems];
            const itemsHTML = allItems.map(it =>
                `<div class="b5p2-ref-item">
                    <span class="b5p2-ri-img">${b5IconHTML(it)}</span>
                    <span class="b5p2-ri-name">${it.name}</span>
                    <span class="b5p2-ri-price">${it.price}元</span>
                </div>`
            ).join('');
            return `
            <div class="b5p2-ref-card">
                <div class="b5p2-ref-header">
                    <span class="b5p2-ref-spacer"></span>
                    <div class="b5p2-ref-center">
                        <span class="b5p2-ref-icon">${themeData.icon}</span>
                        <span class="b5p2-ref-title">${themeData.name}</span>
                    </div>
                    <span class="b5-p2-hint-wrap">
                        <img src="../images/common/hint_detective.png" alt="" class="b5-task-mascot" onerror="this.style.display='none'">
                        <button class="b5-p1-hint-btn" id="b5-p2-hint-btn">💡 提示</button>
                    </span>
                </div>
                <div class="b5p2-ref-items-grid">${itemsHTML}</div>
                <div class="b5p2-ref-total-bar">合計 <strong class="b5p2-ref-total-num">${total}</strong> 元</div>
            </div>`;
        },

        _renderB5P2WalletArea(total) {
            return `
            <div class="b5p2-wallet-area" id="b5p2-wallet-area">
                <div class="b5p2-wallet-coins-label">需要付款 <span class="b5p2-wallet-need">${total} 元</span></div>
                <div class="b5p2-wallet-header">
                    <div class="b5p2-wallet-placed-row">
                        <span class="b5p2-wallet-placed-lbl">已放</span>
                        <span class="b5p2-wallet-total-val" id="b5p2-wallet-total">0 元</span>
                        <span class="b5p2-wallet-sep">/</span>
                        <span class="b5p2-wallet-goal">${total} 元</span>
                    </div>
                </div>
                <div class="b5p2-progress-wrap">
                    <div class="b5p2-progress" id="b5p2-progress">
                        <div class="b5p2-progress-fill" id="b5p2-progress-fill"></div>
                    </div>
                </div>
                <div class="b5p2-my-money-label">💳 付款區</div>
                <div class="b5p2-wallet-coins b5p2-drop-zone" id="b5p2-wallet-coins">
                    <span class="b5p2-wallet-empty">把錢幣拖曳到這裡 👈</span>
                </div>
            </div>`;
        },

        _renderB5P2CoinTray() {
            const g = this.state.game;
            const budgetCoins = g.p2BudgetCoins || [];
            const trayFaces   = g.p2BudgetFaces  || {};
            let _trayUidCtr   = 0;
            const coinsHtml = budgetCoins.map(d => {
                const trayUid = 'tc' + (++_trayUidCtr);
                const isBill  = d >= 100;
                const face    = trayFaces[d] || 'front';
                return `
                <div class="b5p2-coin-drag" draggable="true" data-denom="${d}" data-tray-uid="${trayUid}" data-face="${face}" title="${d}元">
                    <img src="../images/money/${d}_yuan_${face}.png" alt="${d}元"
                         class="${isBill ? 'banknote-img' : 'coin-img'}" draggable="false"
                         onerror="this.style.display='none'">
                    <span class="b1-denom-label">${d}元</span>
                </div>`;
            }).join('');
            return `
            <div class="b5p2-tray">
                <div class="b5p2-tray-title"><img src="../images/common/icons_wallet.png" class="b5p2-tray-wallet-icon" onerror="this.style.display='none'"> 我的錢包</div>
                <div class="b5p2-tray-coins" id="b5p2-tray-coins">${coinsHtml}</div>
            </div>`;
        },

        _bindB5P2Events(total) {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;

            // 確認付款按鈕
            const confirmBtn = document.getElementById('b5-p2-confirm-btn');
            if (confirmBtn) {
                Game.EventManager.on(confirmBtn, 'click', () => {
                    if (this.state.isProcessing) return;
                    this._b5P2HandleConfirm(total);
                }, {}, 'gameUI');
            }

            // 移除幣（委派）＋ 拖回托盤
            const walletCoinsEl = document.getElementById('b5p2-wallet-coins');
            if (walletCoinsEl) {
                Game.EventManager.on(walletCoinsEl, 'click', e => {
                    const btn = e.target.closest('.b5p2-wc-remove');
                    if (btn) { this.audio.play('click'); this._b5P2RemoveCoin(btn.dataset.uid); }
                }, {}, 'gameUI');
                Game.EventManager.on(walletCoinsEl, 'dragstart', e => {
                    const coinEl = e.target.closest('.b5p2-wc-removable');
                    if (!coinEl) return;
                    const _uid = coinEl.dataset.uid;
                    e.dataTransfer.setData('text/plain', `remove:${_uid}`);
                    coinEl.classList.add('b5p2-dragging');
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
                    e.target.closest('.b5p2-wc-removable')?.classList.remove('b5p2-dragging');
                }, {}, 'gameUI');
            }

            // 提示按鈕
            const hintBtn = document.getElementById('b5-p2-hint-btn');
            if (hintBtn) {
                Game.EventManager.on(hintBtn, 'click', () => {
                    this.audio.play('click');
                    if (diff === 'easy') {
                        // 先把付款區的金錢還回托盤，再切換到提示模式
                        (g.p2Wallet || []).forEach(coin => {
                            if (coin.trayUid) {
                                const tEl = document.querySelector(`.b5p2-coin-drag[data-tray-uid="${coin.trayUid}"]`);
                                if (tEl) { delete tEl.dataset.inUse; tEl.style.display = ''; }
                            }
                        });
                        g.p2Wallet   = [];
                        g.p2UidCtr   = 0;
                        g.p2ShowHint = true;
                        this._b5P2AutoSetGhostSlots();
                        this._b5P2UpdateWalletDisplay();
                        this._b5P2UpdatePayTrayHints();
                        Game.Speech.speak('請按照提示放入正確的金錢');
                    } else {
                        this._showB5HardModeHintModal(total);
                    }
                }, {}, 'gameUI');
            }

            // 托盤接受從錢包拖回的幣
            const tray = document.getElementById('b5p2-tray-coins');
            if (tray) {
                Game.EventManager.on(tray, 'dragover', e => e.preventDefault(), {}, 'gameUI');
                Game.EventManager.on(tray, 'drop', e => {
                    e.preventDefault();
                    const data = e.dataTransfer.getData('text/plain');
                    if (data.startsWith('remove:')) this._b5P2RemoveCoin(data.replace('remove:', ''));
                }, {}, 'gameUI');
            }
        },

        _b5P2SetupDragDrop() {
            const walletCoins = document.getElementById('b5p2-wallet-coins');
            if (!walletCoins) return;

            // Desktop：拖曳盤 → 錢包
            document.querySelectorAll('.b5p2-coin-drag').forEach(dragEl => {
                const denom   = parseInt(dragEl.dataset.denom);
                const trayUid = dragEl.dataset.trayUid;
                const face    = dragEl.dataset.face;
                Game.EventManager.on(dragEl, 'dragstart', e => {
                    if (dragEl.dataset.inUse === 'true') { e.preventDefault(); return; }
                    e.dataTransfer.setData('text/plain', `tray:${trayUid}:${denom}:${face}`);
                    e.dataTransfer.effectAllowed = 'move';
                    dragEl.classList.add('b5p2-dragging');
                    const _isBill = denom >= 100;
                    const _imgW   = _isBill ? 100 : 60;
                    const _ghost  = document.createElement('div');
                    _ghost.style.cssText = 'position:absolute;left:-9999px;top:-9999px;background:rgba(255,255,255,0.95);border-radius:12px;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.25);pointer-events:none;';
                    _ghost.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" style="width:${_imgW}px;height:auto;display:block;" draggable="false">`;
                    document.body.appendChild(_ghost);
                    e.dataTransfer.setDragImage(_ghost, Math.round(_imgW / 2) + 8, 40);
                    setTimeout(() => _ghost.remove(), 0);
                }, {}, 'gameUI');
                Game.EventManager.on(dragEl, 'dragend', () => dragEl.classList.remove('b5p2-dragging'), {}, 'gameUI');
            });

            Game.EventManager.on(walletCoins, 'dragover', e => {
                e.preventDefault();
                walletCoins.classList.add('b5p2-drop-active');
            }, {}, 'gameUI');
            Game.EventManager.on(walletCoins, 'dragleave', e => {
                if (!walletCoins.contains(e.relatedTarget)) walletCoins.classList.remove('b5p2-drop-active');
            }, {}, 'gameUI');
            Game.EventManager.on(walletCoins, 'drop', e => {
                e.preventDefault();
                walletCoins.classList.remove('b5p2-drop-active');
                const data = e.dataTransfer.getData('text/plain');
                if (data.startsWith('remove:')) {
                    this._b5P2RemoveCoin(data.replace('remove:', ''));
                } else if (data.startsWith('tray:')) {
                    const parts = data.split(':');
                    const tUid = parts[1], d = parseInt(parts[2]), f = parts[3];
                    const tEl = document.querySelector(`.b5p2-coin-drag[data-tray-uid="${tUid}"]`);
                    if (tEl) { tEl.dataset.inUse = 'true'; tEl.style.display = 'none'; }
                    this._b5P2AddCoin(d, { face: f, trayUid: tUid });
                }
            }, {}, 'gameUI');

            // Touch drag：拖曳盤 → 錢包
            document.querySelectorAll('.b5p2-coin-drag').forEach(dragEl => {
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
                    const wc = document.getElementById('b5p2-wallet-coins');
                    if (wc) {
                        const r = wc.getBoundingClientRect();
                        wc.classList.toggle('b5p2-drop-active',
                            t.clientX >= r.left && t.clientX <= r.right &&
                            t.clientY >= r.top  && t.clientY <= r.bottom);
                    }
                }, { passive: false }, 'gameUI');
                Game.EventManager.on(dragEl, 'touchend', e => {
                    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
                    const t = e.changedTouches[0];
                    const wc = document.getElementById('b5p2-wallet-coins');
                    if (wc) {
                        const r = wc.getBoundingClientRect();
                        wc.classList.remove('b5p2-drop-active');
                        if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
                            dragEl.dataset.inUse = 'true';
                            dragEl.style.display = 'none';
                            this._b5P2AddCoin(denom, { face, trayUid });
                        }
                    }
                }, { passive: true }, 'gameUI');
            });

            // Touch drag：錢包 → 拖回托盤（普通/困難模式的 .b5p2-wc-removable）
            const trayEl = document.getElementById('b5p2-tray-coins');
            Game.EventManager.on(walletCoins, 'touchstart', e => {
                const coinEl = e.target.closest('.b5p2-wc-removable');
                if (!coinEl) return;
                coinEl._touchDragUid = coinEl.dataset.uid;
                document.getElementById('b5p2-wallet-touch-ghost')?.remove();
                const t = e.touches[0];
                const cd = (this.state.game.p2Wallet || []).find(c => String(c.uid) === String(coinEl.dataset.uid));
                const isBill = cd?.denom >= 100, imgW = isBill ? 100 : 60, offset = Math.round(imgW / 2) + 8;
                const ghost = document.createElement('div');
                ghost.id = 'b5p2-wallet-touch-ghost';
                ghost.dataset.offset = String(offset);
                ghost.style.cssText = `position:fixed;z-index:9999;pointer-events:none;background:rgba(255,255,255,0.95);border-radius:12px;padding:8px;box-shadow:0 4px 16px rgba(0,0,0,0.3);transform:scale(1.05);left:${t.clientX - offset}px;top:${t.clientY - offset}px;`;
                ghost.innerHTML = cd ? `<img src="../images/money/${cd.denom}_yuan_${cd.face}.png" style="width:${imgW}px;height:auto;display:block;" draggable="false">` : '';
                document.body.appendChild(ghost);
            }, { passive: true }, 'gameUI');
            Game.EventManager.on(walletCoins, 'touchmove', e => {
                const ghost = document.getElementById('b5p2-wallet-touch-ghost');
                if (!ghost) return;
                e.preventDefault();
                const t = e.touches[0];
                const offset = parseInt(ghost.dataset.offset) || 30;
                ghost.style.left = (t.clientX - offset) + 'px';
                ghost.style.top  = (t.clientY - offset) + 'px';
                if (trayEl) {
                    const r = trayEl.getBoundingClientRect();
                    trayEl.classList.toggle('b5p2-drop-active', t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom);
                }
            }, { passive: false }, 'gameUI');
            Game.EventManager.on(walletCoins, 'touchend', e => {
                const ghost = document.getElementById('b5p2-wallet-touch-ghost');
                if (!ghost) return;
                const t = e.changedTouches[0];
                ghost.remove();
                if (trayEl) {
                    const r = trayEl.getBoundingClientRect();
                    trayEl.classList.remove('b5p2-drop-active');
                    if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
                        const coin = e.target.closest('.b5p2-wc-removable') || walletCoins.querySelector('[data-uid="' + (walletCoins._touchDragUid || '') + '"]');
                        const uid = coin?._touchDragUid || coin?.dataset?.uid;
                        if (uid) { this.audio.play('click'); this._b5P2RemoveCoin(uid); }
                    }
                }
            }, { passive: true }, 'gameUI');
        },

        _b5P2AddCoin(denom, opts = {}) {
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
                const slotEl = document.querySelector(`[data-b5p2-hint-idx="${slotIdx}"]`);
                if (slotEl) slotEl.classList.remove('b5p2-ghost-slot');
                this._b5P2UpdateStatusOnly();
                if (diff === 'easy') this._b5P2UpdatePayTrayHints();
            } else {
                this.audio.play('coin');
                const uid = ++g.p2UidCtr;
                g.p2Wallet.push({ denom, uid, isBill: denom >= 100, face, trayUid });
                const coinsEl = document.getElementById('b5p2-wallet-coins');
                if (coinsEl) {
                    coinsEl.querySelector('.b5p2-wallet-empty')?.remove();
                    const canRemove = diff !== 'easy';
                    const isBill = denom >= 100;
                    const imgStyle = isBill ? 'width:100px;height:auto;display:block;' : 'width:60px;height:60px;display:block;';
                    const div = document.createElement('div');
                    div.className = 'b5p2-wallet-coin b5p2-coin-new' + (canRemove ? ' b5p2-wc-removable' : '');
                    if (canRemove) { div.setAttribute('draggable', 'true'); div.dataset.uid = String(uid); }
                    div.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                         style="${imgStyle}" onerror="this.style.display='none'" draggable="false">
                    ${canRemove ? `<button class="b5p2-wc-remove" data-uid="${uid}" title="移除">✕</button>` : ''}`;
                    coinsEl.appendChild(div);
                }
                this._b5P2UpdateStatusOnly();
            }
            // 簡單/普通模式：播累加金額，播完後再執行下一個動作
            if (diff !== 'hard') {
                const walletNow = this._b5P2GetWalletTotal();
                const req = g.p2Total;
                const allFilled = g.p2ShowHint && g.p2HintSlots?.length && g.p2HintSlots.every(s => s.filled);
                const nowEnough = walletNow >= req;
                Game.TimerManager.setTimeout(() => {
                    Game.Speech.speak(toTWD(walletNow), () => {
                        if (diff === 'easy' && (allFilled || (!g.p2ShowHint && nowEnough)) && !this.state.isProcessing) {
                            Game.TimerManager.setTimeout(() => this._b5P2HandleConfirm(g.p2Total), 300, 'ui');
                        } else if (diff === 'normal' && nowEnough) {
                            const msg = walletNow === req ? '剛好！可以確認付款了！' : '金額足夠，可以確認付款了！';
                            Game.TimerManager.setTimeout(() => Game.Speech.speak(msg), 100, 'ui');
                        }
                    });
                }, 80, 'ui');
            }
        },

        _b5P2RemoveCoin(uid) {
            const g = this.state.game;
            const coinIdx = g.p2Wallet.findIndex(c => String(c.uid) === String(uid));
            const coin = coinIdx !== -1 ? g.p2Wallet[coinIdx] : null;
            // 恢復托盤元素顯示
            if (coin?.trayUid) {
                const tEl = document.querySelector(`.b5p2-coin-drag[data-tray-uid="${coin.trayUid}"]`);
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
                this._b5P2UpdateWalletDisplay();
            } else {
                g.p2Wallet = g.p2Wallet.filter(c => String(c.uid) !== String(uid));
                document.querySelector(`.b5p2-wc-removable[data-uid="${uid}"]`)?.remove();
                const coinsEl = document.getElementById('b5p2-wallet-coins');
                if (coinsEl && g.p2Wallet.length === 0)
                    coinsEl.innerHTML = '<span class="b5p2-wallet-empty">把錢幣拖曳到這裡 👈</span>';
                this._b5P2UpdateStatusOnly();
            }
        },

        _b5P2GetWalletTotal() {
            return this.state.game.p2Wallet.reduce((s, c) => s + c.denom, 0);
        },

        // 只更新數字/進度條/確認按鈕，不重繪幣元素（避免全區閃爍）
        _b5P2UpdateStatusOnly() {
            const g      = this.state.game;
            const total  = this._b5P2GetWalletTotal();
            const req    = g.p2Total;
            const enough = total >= req;

            const totalEl = document.getElementById('b5p2-wallet-total');
            if (totalEl) {
                totalEl.textContent = total + ' 元';
                totalEl.className = 'b5p2-wallet-total-val' + (enough ? ' enough' : total > 0 ? ' not-enough' : '');
            }
            const fillEl = document.getElementById('b5p2-progress-fill');
            if (fillEl && req > 0) {
                const pct = Math.min(Math.round(total / req * 100), 100);
                fillEl.style.width = pct + '%';
                fillEl.className = 'b5p2-progress-fill' + (enough ? ' full' : pct >= 70 ? ' near' : '');
            }
            const confirmBtn = document.getElementById('b5-p2-confirm-btn');
            if (confirmBtn) {
                confirmBtn.disabled = !enough;
                confirmBtn.classList.toggle('ready', enough);
            }
        },

        _b5P2UpdateWalletDisplay() {
            const g      = this.state.game;
            const total  = this._b5P2GetWalletTotal();
            const req    = g.p2Total;
            const enough = total >= req;
            const diff   = this.state.settings.difficulty;

            const totalEl = document.getElementById('b5p2-wallet-total');
            if (totalEl) {
                totalEl.textContent = total + ' 元';
                totalEl.className = 'b5p2-wallet-total-val' + (enough ? ' enough' : total > 0 ? ' not-enough' : '');
            }
            const fillEl = document.getElementById('b5p2-progress-fill');
            if (fillEl && req > 0) {
                const pct = Math.min(Math.round(total / req * 100), 100);
                fillEl.style.width = pct + '%';
                fillEl.className = 'b5p2-progress-fill' + (enough ? ' full' : pct >= 70 ? ' near' : '');
            }
            const confirmBtn = document.getElementById('b5-p2-confirm-btn');
            if (confirmBtn) {
                confirmBtn.disabled = !enough;
                confirmBtn.classList.toggle('ready', enough);
            }
            const coinsEl = document.getElementById('b5p2-wallet-coins');
            if (!coinsEl) return;
            if (g.p2ShowHint && g.p2HintSlots?.length) {
                coinsEl.innerHTML = g.p2HintSlots.map((slot, idx) => {
                    if (!slot.filled) {
                        const isBill = slot.denom >= 100;
                        const imgStyle = isBill ? 'width:100px;height:auto;display:block;' : 'width:60px;height:60px;display:block;';
                        const face = slot.face || 'front';
                        return `<div class="b5p2-wallet-coin b5p2-ghost-slot" data-b5p2-hint-idx="${idx}">
                            <img src="../images/money/${slot.denom}_yuan_${face}.png" alt="${slot.denom}元"
                                 style="${imgStyle}" onerror="this.style.display='none'" draggable="false"></div>`;
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
                    const imgStyle = isBill ? 'width:100px;height:auto;display:block;' : 'width:60px;height:60px;display:block;';
                    return `<div class="b5p2-wallet-coin" data-b5p2-hint-idx="${idx}">
                        <img src="../images/money/${coin.denom}_yuan_${coin.face}.png" alt="${coin.denom}元"
                             style="${imgStyle}" onerror="this.style.display='none'" draggable="false"></div>`;
                }).join('');
            } else if (g.p2Wallet.length === 0) {
                coinsEl.innerHTML = '<span class="b5p2-wallet-empty">把錢幣拖曳到這裡 👈</span>';
            } else {
                const canRemove = diff !== 'easy';
                coinsEl.innerHTML = g.p2Wallet.map(coin => {
                    const isBill = coin.denom >= 100;
                    const imgStyle = isBill ? 'width:100px;height:auto;display:block;' : 'width:60px;height:60px;display:block;';
                    const cls = 'b5p2-wallet-coin' + (canRemove ? ' b5p2-wc-removable' : '');
                    const extra = canRemove ? `draggable="true" data-uid="${coin.uid}"` : '';
                    const removeBtn = canRemove ? `<button class="b5p2-wc-remove" data-uid="${coin.uid}" title="移除">✕</button>` : '';
                    return `<div class="${cls}" ${extra}>
                        <img src="../images/money/${coin.denom}_yuan_${coin.face}.png" alt="${coin.denom}元"
                             style="${imgStyle}" onerror="this.style.display='none'" draggable="false">
                        ${removeBtn}</div>`;
                }).join('');
            }
        },

        _b5P2AutoSetGhostSlots() {
            const g     = this.state.game;
            const total = g.p2Total;

            // 取得托盤中實際可用的金幣（未被拖走的）
            const available = [];
            document.querySelectorAll('.b5p2-coin-drag').forEach(el => {
                if (el.dataset.inUse !== 'true' && el.style.display !== 'none') {
                    available.push({ denom: parseInt(el.dataset.denom), face: el.dataset.face || 'front' });
                }
            });

            const optimal = this._b5P2FindOptimalPayment(available, total);
            g.p2HintSlots = optimal.map(c => ({ denom: c.denom, filled: false, face: c.face }));
            g.p2ShowHint  = true;
        },

        // ── 最小超額子集搜尋（B6 pattern）───────────────────────
        _b5P2FindOptimalPayment(coins, total) {
            const n = coins.length;
            if (n === 0) return [];
            if (n > 22) {
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
            if (bestMask === -1) return coins;
            const result = [];
            for (let i = 0; i < n; i++) { if (bestMask & (1 << i)) result.push(coins[i]); }
            return result.sort((a, b) => b.denom - a.denom);
        },

        _b5P2HandleConfirm(total) {
            if (this.state.isProcessing) return;
            this.state.isProcessing = true;
            const g      = this.state.game;
            const wTotal = this._b5P2GetWalletTotal();
            if (wTotal < total) {
                this.state.isProcessing = false;
                this.audio.play('error');
                g.p2ErrorCount = (g.p2ErrorCount || 0) + 1;
                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                this._showCenterFeedback('❌', '付太少了！');
                Game.Speech.speak(`付太少了，還差${toTWD(total - wTotal)}，請再拖入金錢`);
                const walletArea = document.getElementById('b5p2-wallet-area');
                if (walletArea) {
                    walletArea.style.animation = 'b5p2Shake 0.4s ease';
                    Game.TimerManager.setTimeout(() => { walletArea.style.animation = ''; }, 500, 'ui');
                }
                // 普通/困難模式：退回所有金錢（恢復托盤 + 清空付款區）
                const diff = this.state.settings.difficulty;
                if (diff === 'normal' || diff === 'hard') {
                    (g.p2Wallet || []).forEach(coin => {
                        if (coin.trayUid) {
                            const tEl = document.querySelector(`.b5p2-coin-drag[data-tray-uid="${coin.trayUid}"]`);
                            if (tEl) { tEl.dataset.inUse = 'false'; tEl.style.display = ''; }
                        }
                    });
                    g.p2Wallet = [];
                    const coinsEl = document.getElementById('b5p2-wallet-coins');
                    if (coinsEl) coinsEl.innerHTML = '<span class="b5p2-wallet-empty">把錢幣拖曳到這裡 👈</span>';
                    this._b5P2UpdateStatusOnly();
                }
                // 普通模式：3次付款錯誤自動提示
                if (this.state.settings.difficulty === 'normal' && g.p2ErrorCount >= 3) {
                    g.p2ErrorCount = 0;
                    Game.TimerManager.setTimeout(() => this._showB5HardModeHintModal(total), 900, 'ui');
                }
                return;
            }
            // 付款成功 → 進入找零階段（語音播完 + 最短等待雙條件）
            const change = wTotal - total;
            this.audio.play('correct');
            this._showCenterFeedback('✅', '付款成功！');
            g.paidAmount = wTotal;
            const speechText = change === 0
                ? `剛好${toTWD(wTotal)}，精準付款！`
                : `付了${toTWD(wTotal)}，需要找您${toTWD(change)}`;
            let _speechDone = false, _timerDone = false;
            const _proceed = () => {
                if (!_speechDone || !_timerDone) return;
                this.state.isProcessing = false;
                this._b5P2ShowChangeReturn(wTotal, total, change);
            };
            Game.Speech.speak(speechText, () => { _speechDone = true; _proceed(); });
            Game.TimerManager.setTimeout(() => { _timerDone = true; _proceed(); }, 1500, 'turnTransition');
        },

        // ── 找零拖回階段（B6 重設計 pattern）────────────────────────────
        _b5P2ShowChangeReturn(paid, total, change) {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            Game.TimerManager.clearAll();
            Game.EventManager.removeByCategory('gameUI');

            document.querySelector('.b-center-feedback')?.remove();

            // 剛好付款（不需找零）→ 直接進下一關
            if (change === 0) {
                this._b5P2ShowResult(paid, 0);
                return;
            }

            // 重置狀態
            g.changeErrorCount = 0;
            g.changePlaced     = [];
            g.changeGhostMode  = false;
            g.changeHintSlots  = [];
            g.changeTotal      = change;

            // 貪婪最佳解（ghost slot 提示用，先算以確保托盤包含所需面額）
            const _allDenoms = [1000, 500, 100, 50, 10, 5, 1];
            const greedySolution = {};
            let remSol = change;
            for (const d of _allDenoms) {
                const cnt = Math.floor(remSol / d);
                if (cnt > 0) { greedySolution[d] = cnt; remSol -= cnt * d; }
            }
            g.changeGreedySolution = greedySolution;

            // 面額托盤：包含貪婪解用到的所有面額（避免 ghost slot 顯示托盤沒有的面額）
            let trayDenoms;
            if (change < 100)       { trayDenoms = [50, 10, 5, 1]; }
            else if (change < 1000) { trayDenoms = [500, 100, 50, 10, 5, 1]; }
            else                    { trayDenoms = [1000, 500, 100, 50, 10, 5, 1]; }
            // 確保貪婪解用到的面額都在托盤中
            Object.keys(greedySolution).map(Number).forEach(d => {
                if (!trayDenoms.includes(d)) trayDenoms = [d, ...trayDenoms].sort((a, b) => b - a);
            });

            const trayFaces = {};
            trayDenoms.forEach(d => { trayFaces[d] = Math.random() < 0.5 ? 'back' : 'front'; });
            g.changeTrayFaces = trayFaces;

            // （貪婪最佳解已在上方計算完畢，已存入 g.changeGreedySolution）

            const themeKey  = (g.rounds[g.currentRound] || {}).themeKey || this.state.settings.partyTheme;
            const themeData = B5_THEMES[themeKey] || B5_THEMES.birthday;
            const diffLabel = { easy: '簡單模式', normal: '普通模式', hard: '困難模式' }[diff] || '';

            // 面額托盤 HTML（可重複拖曳）
            const trayHtml = trayDenoms.map(d => {
                const isBill = d >= 100;
                return `<div class="b5c-denom-card" draggable="true" data-denom="${d}" data-face="${trayFaces[d]}" title="${d}元">
                    <img src="../images/money/${d}_yuan_${trayFaces[d]}.png" alt="${d}元"
                         class="${isBill ? 'banknote-img' : 'coin-img'}" draggable="false" onerror="this.style.display='none'">
                    <span class="b1-denom-label">${d}元</span>
                </div>`;
            }).join('');

            // 錢包剩餘金額（付款後）
            const walletRemaining = (g.budget || 0) - paid;
            g.changeWalletBase = walletRemaining;
            const _wDenoms = [1000, 500, 100, 50, 10, 5, 1];
            const walletCoinsArr = [];
            let _rem = walletRemaining;
            for (const d of _wDenoms) {
                const cnt = Math.floor(_rem / d);
                for (let i = 0; i < cnt; i++) walletCoinsArr.push(d);
                _rem -= cnt * d;
            }
            const walletStaticHtml = walletCoinsArr.map(d => {
                const isBill = d >= 100;
                const face   = Math.random() < 0.5 ? 'back' : 'front';
                const w      = isBill ? 80 : 52;
                return `<div class="b5c-wc-static">
                    <img src="../images/money/${d}_yuan_${face}.png" alt="${d}元"
                         style="width:${w}px;height:${isBill ? 'auto' : w+'px'};display:block;" draggable="false" onerror="this.style.display='none'">
                    <span class="b1-denom-label">${d}元</span>
                </div>`;
            }).join('');

            const app = document.getElementById('app');
            app.innerHTML = `
            <div class="b-header">
                <div class="b-header-left">
                    <span class="b-header-unit">${themeData.icon} ${themeData.name}</span>
                </div>
                <div class="b-header-center">步驟三：找零</div>
                <div class="b-header-right">
                    <span class="b-progress">第 ${g.currentRound + 1} 關 / 共 ${g.totalRounds} 關</span>
                    <button class="b-reward-btn" onclick="if(typeof RewardLauncher!=='undefined'){RewardLauncher.open();}else{window.open('../reward/index.html','RewardSystem','width=1200,height=800');}">🎁 獎勵</button>
                    <button class="b-back-btn" onclick="Game.showSettings()">返回設定</button>
                </div>
            </div>
            <div class="game-container">
                <div class="b5p2-ref-card">
                    <div class="b5p2-ref-header">
                        <span class="b5p2-ref-spacer"></span>
                        <div class="b5p2-ref-center">
                            <span class="b5p2-ref-icon">${themeData.icon}</span>
                            <span class="b5p2-ref-title">${themeData.name}</span>
                        </div>
                        <span class="b5-p2-hint-wrap">
                            <img src="../images/common/hint_detective.png" alt="" class="b5-task-mascot" onerror="this.style.display='none'">
                            <button class="b5-p1-hint-btn" id="b5c-hint-btn">💡 提示</button>
                        </span>
                    </div>
                    <div class="b5c-change-info-bar">
                        您付了 <strong>${paid}</strong> 元，需找零 <strong class="b5c-need-num">${change}</strong> 元
                    </div>
                </div>
                <div class="b5p2-tray">
                    <div class="b5p2-tray-title">💰 找零面額（可重複拖曳）</div>
                    <div class="b5c-tray-coins" id="b5c-tray-coins">${trayHtml}</div>
                </div>
                <div class="b5p2-wallet-area b5c-change-area">
                    <div class="b5c-change-title b5c-change-title-bar">
                        <div style="flex:1;"></div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            💼 我的錢包
                            <span class="b5c-wallet-info${diff === 'hard' ? ' b6c-hidden' : ''}" id="b5c-wallet-info"><span id="b5c-wallet-balance">${walletRemaining}</span>元（已找回<span id="b5c-placed-total">0</span>/${change} 元）</span>
                        </div>
                        <div style="flex:1;display:flex;justify-content:flex-end;">
                            <button class="b5c-wallet-toggle-btn" id="b5c-wallet-toggle">▼ 收合</button>
                        </div>
                    </div>
                    <div class="b5c-wallet-split">
                        <div class="b5c-wallet-split-left" id="b5c-wallet-left" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                            ${walletStaticHtml || '<span class="b5p2-wallet-empty" style="font-size:12px;">（餘額為0）</span>'}
                        </div>
                        <div class="b5c-wallet-split-right b5p2-drop-zone b5c-drop-zone" id="b5c-wallet-zone">
                            <div id="b5c-wallet-coins" style="display:flex;flex-wrap:wrap;gap:10px;width:100%;align-items:center;justify-content:center;min-height:60px;">
                                <span class="b5p2-wallet-empty">把找零金錢拖曳到這裡</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="b5c-confirm-btn" id="b5c-confirm-btn" disabled>✅ 確認找零</button>
            </div>`;

            // 簡單模式：立即顯示 ghost slots（不等語音播完）
            if (diff === 'easy') this._b5P2ShowChangeGhostSlots(change);
            Game.Speech.speak(`找您${toTWD(change)}，請把找回的金錢，拖曳到我的錢包`);
            this._b5P2SetupChangeInteraction(change, paid);

            if (this.state.settings.clickMode === 'on') {
                Game.TimerManager.setTimeout(() => AssistClick.activate(), 500, 'ui');
            }
        },

        _b5P2SetupChangeInteraction(change, paid) {
            const g          = this.state.game;
            const diff       = this.state.settings.difficulty;
            const trayEl     = document.getElementById('b5c-tray-coins');
            const walletZone = document.getElementById('b5c-wallet-zone');
            const confirmBtn = document.getElementById('b5c-confirm-btn');
            const hintBtn    = document.getElementById('b5c-hint-btn');
            if (!trayEl || !walletZone) return;

            // ── 展開/收起付款後餘額（左側錢包面板）──────────────────
            const walletToggleBtn = document.getElementById('b5c-wallet-toggle');
            const walletLeftPanel = document.getElementById('b5c-wallet-left');
            if (walletToggleBtn && walletLeftPanel) {
                Game.EventManager.on(walletToggleBtn, 'click', () => {
                    const isOpen = walletLeftPanel.style.display !== 'none';
                    walletLeftPanel.style.display = isOpen ? 'none' : 'flex';
                    walletToggleBtn.textContent = isOpen ? '▶ 展開' : '▼ 收合';
                }, {}, 'gameUI');
            }

            // 放置一枚金幣到錢包
            const handleDrop = (denom) => {
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
                this._b5P2UpdateChangeDisplay(change);
                this._b5P2RenderWalletCoins(change);
                if (g.changeGhostMode) this._b5P2UpdateChangeTrayHints();
                const runningTotal = (g.changePlaced || []).reduce((s, p) => s + p.denom, 0);
                Game.Speech.speak(`找回${toTWD(runningTotal)}`);
            };

            // Desktop drag-from-tray
            trayEl.querySelectorAll('.b5c-denom-card').forEach(card => {
                const denom = parseInt(card.dataset.denom);
                const face  = card.dataset.face || 'front';
                Game.EventManager.on(card, 'dragstart', e => {
                    e.dataTransfer.setData('text/plain', `chdenom:${denom}`);
                    card.classList.add('b5p2-dragging');
                    const _isBill = denom >= 100, _imgW = _isBill ? 100 : 60;
                    const _ghost = document.createElement('div');
                    _ghost.style.cssText = 'position:absolute;left:-9999px;top:-9999px;background:rgba(255,255,255,0.95);border-radius:12px;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.25);pointer-events:none;';
                    _ghost.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" style="width:${_imgW}px;height:auto;display:block;" draggable="false">`;
                    document.body.appendChild(_ghost);
                    e.dataTransfer.setDragImage(_ghost, Math.round(_imgW / 2) + 8, 40);
                    setTimeout(() => _ghost.remove(), 0);
                }, {}, 'gameUI');
                Game.EventManager.on(card, 'dragend', () => card.classList.remove('b5p2-dragging'), {}, 'gameUI');
            });
            Game.EventManager.on(walletZone, 'dragover', e => { e.preventDefault(); walletZone.classList.add('b6p2-drop-active'); }, {}, 'gameUI');
            Game.EventManager.on(walletZone, 'dragleave', e => { if (!walletZone.contains(e.relatedTarget)) walletZone.classList.remove('b6p2-drop-active'); }, {}, 'gameUI');
            Game.EventManager.on(walletZone, 'drop', e => {
                e.preventDefault(); walletZone.classList.remove('b6p2-drop-active');
                const d = e.dataTransfer.getData('text/plain');
                if (d.startsWith('chdenom:')) handleDrop(parseInt(d.replace('chdenom:', '')));
            }, {}, 'gameUI');
            // 防呆：b5c-wallet-coins 層加 dragover（僅 preventDefault）
            const walletCoinsInner = document.getElementById('b5c-wallet-coins');
            if (walletCoinsInner) {
                Game.EventManager.on(walletCoinsInner, 'dragover', e => { e.preventDefault(); walletZone.classList.add('b6p2-drop-active'); }, {}, 'gameUI');
            }

            // Touch drag-from-tray
            trayEl.querySelectorAll('.b5c-denom-card').forEach(card => {
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

            // 移除錢包中的金幣（× 按鈕，簡單模式禁用）
            const walletCoinsEl = document.getElementById('b5c-wallet-coins');
            if (walletCoinsEl && diff !== 'easy') {
                Game.EventManager.on(walletCoinsEl, 'click', e => {
                    const btn = e.target.closest('.b5c-wc-remove');
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
                    this._b5P2UpdateChangeDisplay(change);
                    this._b5P2RenderWalletCoins(change);
                }, {}, 'gameUI');
            }

            // 確認找零按鈕
            if (confirmBtn) {
                Game.EventManager.on(confirmBtn, 'click', () => {
                    if (this.state.isProcessing) return;
                    this.state.isProcessing = true;
                    this._b5P2ConfirmChange(change, paid);
                }, {}, 'gameUI');
            }

            // 提示按鈕
            if (hintBtn) {
                Game.EventManager.on(hintBtn, 'click', () => {
                    if (this.state.isProcessing) return;
                    this.audio.play('click');
                    if (diff === 'hard') {
                        const walletInfo = document.getElementById('b5c-wallet-info');
                        if (walletInfo) walletInfo.classList.remove('b6c-hidden');
                        this._b5P2ShowChangeHintModal(change);
                    } else {
                        this._b5P2ShowChangeGhostSlots(change);
                    }
                }, {}, 'gameUI');
            }

            // 錢包幣拖回面額區（拖出 wallet zone 即移除，簡單模式禁用）
            let _draggingWalletUid = null;
            if (walletCoinsEl && diff !== 'easy') {
                Game.EventManager.on(walletCoinsEl, 'dragstart', e => {
                    const item = e.target.closest('.b5c-wc-item[data-uid]');
                    if (!item) return;
                    _draggingWalletUid = item.dataset.uid;
                    e.dataTransfer.setData('text/plain', `b5cuid:${_draggingWalletUid}`);
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
                        this._b5P2UpdateChangeDisplay(change);
                        this._b5P2RenderWalletCoins(change);
                    }
                }, {}, 'gameUI');
            }

            // Touch 拖回：錢包幣觸控拖出 wallet zone 即移除（簡單模式禁用）
            if (walletCoinsEl && diff !== 'easy') {
                let _touchWalletUid = null;
                let _touchGhostEl   = null;
                Game.EventManager.on(walletCoinsEl, 'touchstart', e => {
                    const item = e.target.closest('.b5c-wc-item[data-uid]');
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
                    _touchGhostEl.style.top  = (t.clientY - offset) + 'px';
                }, { passive: false }, 'gameUI');
                Game.EventManager.on(walletCoinsEl, 'touchend', e => {
                    if (_touchGhostEl) { _touchGhostEl.remove(); _touchGhostEl = null; }
                    if (!_touchWalletUid) return;
                    const uid = _touchWalletUid;
                    _touchWalletUid = null;
                    const t   = e.changedTouches[0];
                    const zone = document.getElementById('b5c-wallet-zone');
                    const r    = zone?.getBoundingClientRect();
                    const inside = r && t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;
                    if (!inside) {
                        if (g.changeGhostMode) {
                            const slotIdx = (g.changeHintSlots || []).findIndex(s => s.uid === uid);
                            if (slotIdx !== -1) { g.changeHintSlots[slotIdx].filled = false; g.changeHintSlots[slotIdx].uid = null; }
                        }
                        g.changePlaced = (g.changePlaced || []).filter(p => p.uid !== uid);
                        this.audio.play('click');
                        this._b5P2UpdateChangeDisplay(change);
                        this._b5P2RenderWalletCoins(change);
                    }
                }, { passive: true }, 'gameUI');
            }
        },

        _b5P2UpdateChangeDisplay(change) {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            const placedTotal = (g.changePlaced || []).reduce((s, p) => s + p.denom, 0);
            const exact  = placedTotal === change;
            const totalEl = document.getElementById('b5c-placed-total');
            if (totalEl) totalEl.textContent = placedTotal;
            const balanceEl = document.getElementById('b5c-wallet-balance');
            if (balanceEl) balanceEl.textContent = (g.changeWalletBase || 0) + placedTotal;
            const confirmBtn = document.getElementById('b5c-confirm-btn');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.classList.toggle('ready', exact);
                if (diff === 'easy') confirmBtn.classList.toggle('b6-product-here-hint', exact);
            }
        },

        _b5P2RenderWalletCoins(change) {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            const walletCoinsEl = document.getElementById('b5c-wallet-coins');
            if (!walletCoinsEl) return;

            const _makeFilledSlot = (denom, face, uid, slotIdx) => {
                const isBill = denom >= 100;
                const w = isBill ? 80 : 52;
                const div = document.createElement('div');
                div.className = 'b5c-wc-item';
                if (diff !== 'easy') {
                    div.draggable = true;
                    div.dataset.uid = uid || '';
                }
                div.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;" draggable="false" onerror="this.style.display='none'">
                    <span class="b1-denom-label">${denom}元</span>
                    ${diff !== 'easy' ? `<button class="b5c-wc-remove" data-uid="${uid || ''}"${slotIdx != null ? ` data-slot-idx="${slotIdx}"` : ''} title="移除">×</button>` : ''}`;
                return div;
            };
            const _makeGhostSlot = (denom, face) => {
                const isBill = denom >= 100;
                const w = isBill ? 80 : 52;
                const div = document.createElement('div');
                div.className = 'b5c-ghost-slot';
                div.dataset.denom = denom;
                div.innerHTML = `<img src="../images/money/${denom}_yuan_${face}.png" alt="${denom}元"
                     style="width:${w}px;height:${isBill ? 'auto' : w + 'px'};display:block;opacity:0.3;" draggable="false" onerror="this.style.display='none'">
                    <span class="b1-denom-label" style="opacity:0.3;">${denom}元</span>`;
                return div;
            };

            // Ghost slot 模式：DOM diff 避免重繪
            if (g.changeGhostMode && g.changeHintSlots?.length > 0) {
                if (g.changeHintSlots.every(s => s.filled) && diff !== 'easy') {
                    g.changeGhostMode = false;
                } else {
                    const kids = Array.from(walletCoinsEl.children);
                    if (kids.length !== g.changeHintSlots.length) {
                        walletCoinsEl.innerHTML = '';
                        g.changeHintSlots.forEach((slot, idx) => {
                            walletCoinsEl.appendChild(
                                slot.filled
                                    ? _makeFilledSlot(slot.denom, slot.face, slot.uid, idx)
                                    : _makeGhostSlot(slot.denom, slot.face)
                            );
                        });
                    } else {
                        g.changeHintSlots.forEach((slot, idx) => {
                            const el = kids[idx];
                            const curFilled = el.classList.contains('b5c-wc-item');
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

            // 一般模式：DOM diff，只增刪變化的金幣
            if (!g.changePlaced || g.changePlaced.length === 0) {
                walletCoinsEl.innerHTML = '<span class="b6p2-wallet-empty">把找零金錢拖曳到這裡</span>';
                return;
            }
            const emptyEl = walletCoinsEl.querySelector('.b6p2-wallet-empty');
            if (emptyEl) emptyEl.remove();

            const existingMap = {};
            walletCoinsEl.querySelectorAll('.b5c-wc-item').forEach(el => {
                existingMap[el.dataset.uid] = el;
            });
            const desiredUids = new Set(g.changePlaced.map(p => p.uid));

            Object.entries(existingMap).forEach(([uid, el]) => {
                if (!desiredUids.has(uid)) el.remove();
            });
            g.changePlaced.forEach(p => {
                if (existingMap[p.uid]) return;
                walletCoinsEl.appendChild(_makeFilledSlot(p.denom, p.face, p.uid, null));
            });
        },

        _b5P2AddChangeCoin(denom) {
            const g    = this.state.game;
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
            this._b5P2UpdateChangeDisplay(totalChange);
            this._b5P2RenderWalletCoins(totalChange);
        },

        _b5P2ConfirmChange(change, paid) {
            const g    = this.state.game;
            const diff = this.state.settings.difficulty;
            const placedTotal = (g.changePlaced || []).reduce((s, p) => s + p.denom, 0);

            if (placedTotal !== change) {
                this.state.isProcessing = false;
                this.audio.play('error');
                g.changeErrorCount = (g.changeErrorCount || 0) + 1;
                const b5ChangeDir = placedTotal > change ? '太多了' : '太少了';
                window.LearningTracker?.logWrong?.();   // 學習紀錄：錯誤嘗試
                this._showCenterFeedback('❌', `找零算${b5ChangeDir}！`);
                Game.Speech.speak(`不對喔，找零算${b5ChangeDir}，請再試一次`);
                const walletZone = document.getElementById('b5c-wallet-zone');
                if (walletZone) {
                    walletZone.style.animation = 'b5p2Shake 0.4s ease';
                    Game.TimerManager.setTimeout(() => { walletZone.style.animation = ''; }, 500, 'ui');
                }
                if (diff === 'easy' && g.changeGhostMode) {
                    // 簡單模式 ghost slot 錯誤：保留 ghost slot 結構，只重置填入狀態
                    g.changePlaced = [];
                    g.changeHintSlots = g.changeHintSlots.map(s => ({ ...s, filled: false, uid: null }));
                    this._b5P2UpdateChangeDisplay(change);
                    this._b5P2RenderWalletCoins(change);
                    this._b5P2UpdateChangeTrayHints();
                } else if (diff !== 'hard') {
                    // 普通模式：清空找零區
                    g.changePlaced    = [];
                    g.changeGhostMode = false;
                    g.changeHintSlots = [];
                    this._b5P2UpdateChangeDisplay(change);
                    this._b5P2RenderWalletCoins(change);
                }
                // 普通模式：3次錯誤自動顯示 ghost slots
                if (diff === 'normal' && g.changeErrorCount >= 3) {
                    g.changeErrorCount = 0;
                    Game.TimerManager.setTimeout(() => this._b5P2ShowChangeGhostSlots(change), 900, 'ui');
                }
                return;
            }

            // 找零正確
            document.getElementById('correct-sound')?.play();
            if (typeof confetti === 'function') {
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, zIndex: 1001 });
            }
            this._showCenterFeedback('🎉', '找零完成！');
            Game.Speech.speak(`找零完成！`, () => {
                this.state.isProcessing = false;
                this._b5P2ShowResult(g.paidAmount || paid, change);
            });
        },

        _b5P2ShowChangeGhostSlots(change) {
            const g = this.state.game;
            g.changePlaced    = [];
            g.changeGhostMode = true;
            const solution = g.changeGreedySolution || {};
            const slots = [];
            Object.entries(solution).sort(([a], [b]) => b - a).forEach(([d, cnt]) => {
                const denom = parseInt(d);
                const face  = g.changeTrayFaces?.[denom] || 'front';
                for (let i = 0; i < cnt; i++) slots.push({ denom, face, filled: false, uid: null });
            });
            g.changeHintSlots = slots;
            this._b5P2UpdateChangeDisplay(change);
            this._b5P2RenderWalletCoins(change);
            this._b5P2UpdateChangeTrayHints();
            const parts = Object.entries(solution).sort(([a], [b]) => b - a).map(([d, cnt]) => `${cnt}個${d}元`);
            Game.Speech.speak(`可以用${parts.join('，')}`);
        },

        // 付款托盤「點這裡」依序提示（每次只高亮下一個）
        _b5P2UpdatePayTrayHints() {
            const g = this.state.game;
            document.querySelectorAll('.b5p2-coin-drag').forEach(el => el.classList.remove('b6-product-here-hint'));
            if (this.state.settings.difficulty !== 'easy') return;
            const nextSlot = (g.p2HintSlots || []).find(s => !s.filled);
            if (!nextSlot) return;
            const coinEl = Array.from(document.querySelectorAll('.b5p2-coin-drag')).find(el =>
                el.dataset.inUse !== 'true' && el.style.display !== 'none' &&
                parseInt(el.dataset.denom) === nextSlot.denom
            );
            if (coinEl) coinEl.classList.add('b6-product-here-hint');
        },

        // 找零托盤「點這裡」依序提示（每次只高亮下一個）
        _b5P2UpdateChangeTrayHints() {
            const g = this.state.game;
            document.querySelectorAll('.b5c-denom-card').forEach(el => el.classList.remove('b6-product-here-hint'));
            if (!g.changeGhostMode) return;
            const nextSlot = (g.changeHintSlots || []).find(s => !s.filled);
            if (!nextSlot) return;
            const coinEl = Array.from(document.querySelectorAll('.b5c-denom-card')).find(el =>
                parseInt(el.dataset.denom) === nextSlot.denom
            );
            if (coinEl) coinEl.classList.add('b6-product-here-hint');
        },

        _b5P2ShowChangeHintModal(change) {
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

            const existing = document.getElementById('b5c-hint-modal');
            if (existing) existing.remove();
            const overlay = document.createElement('div');
            overlay.id = 'b5c-hint-modal';
            overlay.className = 'b6-hint-modal-overlay';
            overlay.innerHTML = `
                <div class="b6-hint-modal" style="max-width:420px;width:92%;text-align:left;">
                    <div class="b6-hm-header" style="text-align:center;font-size:20px;padding-bottom:4px;">💡 找零提示</div>
                    <div style="text-align:center;font-size:14px;color:#6b7280;margin-bottom:14px;">建議的找零方式：</div>
                    <div style="padding:0 4px;">${hintListHTML}</div>
                    <div style="display:flex;gap:10px;justify-content:center;margin-top:4px;">
                        <button class="b6-hm-replay-btn" id="b5c-hm-replay">🔊 再播一次</button>
                        <button class="b6-hm-confirm-btn" id="b5c-hm-close">我知道了</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            Game.Speech.speak(speechText);

            const closeModal = () => overlay.remove();
            Game.EventManager.on(document.getElementById('b5c-hm-close'), 'click', closeModal, {}, 'gameUI');
            Game.EventManager.on(document.getElementById('b5c-hm-replay'), 'click', () => {
                this.audio.play('click');
                Game.Speech.speak(speechText);
            }, {}, 'gameUI');
            Game.EventManager.on(overlay, 'click', e => { if (e.target === overlay) closeModal(); }, {}, 'gameUI');
        },

        // ── 付款後顯示結果（直接導航，無下一關按鈕）─────────────────────────
        _b5P2ShowResult(paid, change) {
            const g = this.state.game;
            g.currentRound++;
            Game.TimerManager.setTimeout(() => {
                if (g.currentRound >= g.totalRounds) {
                    this.showResults();
                } else {
                    this.showWelcomeScreen();
                }
            }, 400, 'turnTransition');
        },

        // ── 付款提示彈窗（A4 style：列表 + 確認後托盤打勾）───────
        _showB5HardModeHintModal(total) {
            // 以托盤實際可用硬幣計算最佳組合（最小超額付款）
            const available = [];
            document.querySelectorAll('.b5p2-coin-drag').forEach(el => {
                if (el.dataset.inUse !== 'true' && el.style.display !== 'none') {
                    available.push({ denom: parseInt(el.dataset.denom), face: el.dataset.face || 'front' });
                }
            });
            const optimal = this._b5P2FindOptimalPayment(available, total);
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
            this._b5P2LastHintSpeech = speechText;
            this._b5P2LastHintDenoms = denomCounts;

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

            const existing = document.getElementById('b5-hard-hint-modal');
            if (existing) existing.remove();
            const overlay = document.createElement('div');
            overlay.id = 'b5-hard-hint-modal';
            overlay.className = 'b6-hint-modal-overlay';
            overlay.innerHTML = `
                <div class="b6-hint-modal" style="max-width:420px;width:92%;text-align:left;">
                    <div class="b6-hm-header" style="text-align:center;font-size:20px;padding-bottom:4px;">💡 付款提示</div>
                    <div style="text-align:center;font-size:14px;color:#6b7280;margin-bottom:14px;">建議的付款方式：</div>
                    <div style="padding:0 4px;">${hintListHTML}</div>
                    <div style="display:flex;gap:10px;justify-content:center;margin-top:4px;">
                        <button class="b6-hm-replay-btn" id="b5-hm-replay">🔊 再播一次</button>
                        <button class="b6-hm-confirm-btn" id="b5-hm-close">我知道了</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            Game.Speech.speak(speechText);

            const closeAndApply = () => {
                overlay.remove();
                this._b5P2ApplyTrayTicks(this._b5P2LastHintDenoms || {});
            };
            Game.EventManager.on(document.getElementById('b5-hm-close'), 'click', closeAndApply, {}, 'gameUI');
            Game.EventManager.on(document.getElementById('b5-hm-replay'), 'click', () => {
                this.audio.play('click');
                Game.Speech.speak(this._b5P2LastHintSpeech || '');
            }, {}, 'gameUI');
            Game.EventManager.on(overlay, 'click', e => { if (e.target === overlay) closeAndApply(); }, {}, 'gameUI');
        },

        // ── 托盤打勾提示（確認提示後套用）───────────────────────
        _b5P2ApplyTrayTicks(denomCounts) {
            document.querySelectorAll('.b5p2-coin-drag.b5p2-tray-tick').forEach(el => el.classList.remove('b5p2-tray-tick'));
            Object.entries(denomCounts).forEach(([d, cnt]) => {
                const denom = parseInt(d);
                let needed  = cnt;
                document.querySelectorAll(`.b5p2-coin-drag[data-denom="${denom}"]`).forEach(el => {
                    if (needed > 0 && el.dataset.inUse !== 'true' && el.style.display !== 'none' && !el.classList.contains('b5p2-tray-tick')) {
                        el.classList.add('b5p2-tray-tick');
                        needed--;
                    }
                });
            });
        },

        // ── 13. 下一關 ────────────────────────────────────────
        nextRound() {
            this.state.game.currentRound++;
            if (this.state.game.currentRound >= this.state.game.totalRounds) {
                this.showResults();
            } else {
                this._showRoundTransition(this.state.game.currentRound + 1, () => this.renderRound());
            }
        },


        _showRoundTransition(roundNum, callback) {
            const existing = document.getElementById('b5-round-transition');
            if (existing) existing.remove();
            const card = document.createElement('div');
            card.id = 'b5-round-transition';
            card.className = 'b5-round-transition';
            card.innerHTML = `
                <div class="b5-rt-inner">
                    <div class="b5-rt-label">準備好了嗎？</div>
                    <div class="b5-rt-icon">🎂</div>
                </div>`;
            document.body.appendChild(card);
            Game.Speech.speak(`準備好了嗎`);
            Game.TimerManager.setTimeout(() => {
                card.classList.add('b5-rt-fade');
                Game.TimerManager.setTimeout(() => {
                    if (document.body.contains(card)) card.remove();
                    callback();
                }, 300, 'turnTransition');
            }, 1100, 'turnTransition');
        },

        // ── 12. 完成畫面 ──────────────────────────────────────
        showResults() {
            if (this.state.isEndingGame) return;
            this.state.isEndingGame = true;

            Game.TimerManager.clearByCategory('turnTransition');
            Game.EventManager.removeByCategory('gameUI');

            const g        = this.state.game;
            const elapsed  = g.startTime ? (Date.now() - g.startTime) : 0;
            const mins     = Math.floor(elapsed / 60000);
            const secs     = Math.floor((elapsed % 60000) / 1000);
            const accuracy = g.totalRounds > 0
                ? Math.round((g.correctCount / g.totalRounds) * 100) : 0;

            // 學習紀錄
            window.LearningTracker?.save({ unit: 'b5', unitName: 'B5 派對活動採購', series: 'B',
                score: g.correctCount, total: g.totalRounds, difficulty: this.state.settings?.difficulty,
                durationSec: Math.floor(elapsed / 1000) });

            let badge, badgeColor, medalIcon;
            if (accuracy === 100)    { badge = '完美 🥇'; badgeColor = '#f59e0b'; medalIcon = '🥇'; }
            else if (accuracy >= 90) { badge = '優異 🥇'; badgeColor = '#f59e0b'; medalIcon = '🥇'; }
            else if (accuracy >= 70) { badge = '良好 🥈'; badgeColor = '#10b981'; medalIcon = '🥈'; }
            else if (accuracy >= 50) { badge = '努力 🥉'; badgeColor = '#6366f1'; medalIcon = '🥉'; }
            else                     { badge = '練習 ⭐'; badgeColor = '#94a3b8'; medalIcon = '⭐'; }

            // 各關預算使用統計（F5 量比較 pattern）
            // 派對物品回顧
            const themeForResult = this.state.settings.partyTheme === 'random'
                ? { icon: '🎲', name: '隨機派對' }
                : (B5_THEMES[this.state.settings.partyTheme] || B5_THEMES.birthday);

            // 每題採購物品 + 預算統計導覽
            const roundItemsList = g.roundItemsList || [];
            const totalRoundsCount = roundItemsList.length;
            let b5RicIdx = 0;

            const _b5RicImgMap = { birthday: '001', halloween: '002', picnic: '003' };
            const _perRoundHTML = (idx) => {
                if (!totalRoundsCount) return '';
                const entry = roundItemsList[Math.min(idx, totalRoundsCount - 1)];
                const stats = (g.roundStats || [])[idx];
                const hasMultiple = totalRoundsCount > 1;

                const roundThemeKey = entry.themeKey || 'birthday';
                const _b5ThemeBanner = {
                    birthday: { bg: 'linear-gradient(135deg, #f953c6 0%, #b91d73 50%, #7b2ff7 100%)', emojis: '🎂 🎈 🎁 🎉', label: '生日派對' },
                    halloween: { bg: 'linear-gradient(135deg, #f7971e 0%, #e85d04 50%, #4a0e8f 100%)', emojis: '🎃 👻 🕷️ 🦇', label: '萬聖節派對' },
                    picnic: { bg: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 50%, #f7b733 100%)', emojis: '🧺 🌻 🥪 🌿', label: '野餐派對' },
                };
                const _banner = _b5ThemeBanner[roundThemeKey] || _b5ThemeBanner.birthday;
                const themeImgHTML = `<div style="width:100%;height:120px;border-radius:12px 12px 0 0;background:${_banner.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;">
                    <div style="font-size:28px;letter-spacing:6px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${_banner.emojis}</div>
                    <div style="font-size:18px;font-weight:900;color:#fff;letter-spacing:3px;text-shadow:0 2px 8px rgba(0,0,0,0.4);">${_banner.label}</div>
                </div>`;

                const navHTML = `<div class="b5-ric-nav">
                    ${hasMultiple ? `<button class="b5-ric-nav-btn" id="b5-ric-prev" ${idx === 0 ? 'disabled' : ''}>◀</button>` : '<span></span>'}
                    <span class="b5-ric-nav-label">第 ${entry.roundNum} 題採購物品</span>
                    ${hasMultiple ? `<button class="b5-ric-nav-btn" id="b5-ric-next" ${idx >= totalRoundsCount - 1 ? 'disabled' : ''}>▶</button>` : '<span></span>'}
                </div>`;

                const cards = (entry.items || []).map(item => {
                    if (typeof item === 'object') {
                        return `<div class="b5-review-item-card">
                            <span class="b5-ric-img">${b5IconHTML(item)}</span>
                            <span class="b5-ric-name">${item.name}</span>
                            <span class="b5-ric-price">${item.price}元</span>
                        </div>`;
                    }
                    const sp = item.indexOf(' ');
                    return `<div class="b5-review-item-card">
                        <span class="b5-ric-img b5-ric-emoji">${item.slice(0, sp)}</span>
                        <span class="b5-ric-name">${item.slice(sp + 1)}</span>
                    </div>`;
                }).join('');
                const tableTotal = entry.total ?? (entry.items || []).reduce((s, i) => s + (typeof i === 'object' ? i.price : 0), 0);
                const tableHTML = `
                <div class="b5-review-items-grid">${cards}</div>
                <div class="b5-review-total-bar">💰 合計 <strong>${tableTotal}</strong> 元</div>`;

                const statsHTML = stats ? `<div class="b5-per-round-stats">
                    <div class="b5-prs-item"><span class="b5-prs-label">本題預算</span><span class="b5-prs-val">${stats.budget}元</span></div>
                    <div class="b5-prs-item"><span class="b5-prs-label">實際花費</span><span class="b5-prs-val b5-prs-spent">${stats.spent}元</span></div>
                    <div class="b5-prs-item"><span class="b5-prs-label">剩餘金額</span><span class="b5-prs-val ${stats.budget - stats.spent >= 0 ? 'b5-prs-saved' : 'b5-prs-over'}">${stats.budget - stats.spent}元</span></div>
                </div>` : '';

                return themeImgHTML + navHTML + tableHTML + statsHTML;
            };

            const _updateSummaryBtn = () => {
                const btn = document.getElementById('b5-view-summary-btn');
                if (btn) btn.style.display = (b5RicIdx >= totalRoundsCount - 1) ? '' : 'none';
            };
            const _bindRicNav = () => {
                document.getElementById('b5-ric-prev')?.addEventListener('click', () => {
                    if (b5RicIdx > 0) {
                        b5RicIdx--;
                        document.getElementById('b5-round-items-card').innerHTML = _perRoundHTML(b5RicIdx);
                        _bindRicNav(); _updateSummaryBtn();
                    }
                });
                document.getElementById('b5-ric-next')?.addEventListener('click', () => {
                    if (b5RicIdx < totalRoundsCount - 1) {
                        b5RicIdx++;
                        document.getElementById('b5-round-items-card').innerHTML = _perRoundHTML(b5RicIdx);
                        _bindRicNav(); _updateSummaryBtn();
                    }
                });
            };

            const app = document.getElementById('app');
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            app.style.overflow = 'auto'; app.style.height = 'auto'; app.style.minHeight = '100vh';

            // ── 第一頁：派對回顧 ──
            app.innerHTML = `
<div class="b-review-wrapper">
    <div class="b-review-screen">
        <div class="b-review-header">
            <div class="b-review-emoji">${themeForResult.icon}</div>
            <h1 class="b-review-title">派對回顧</h1>
            <p class="b-review-subtitle">看看這次的採購記錄！</p>
        </div>
        <div class="b5-review-big-card">
            ${totalRoundsCount > 0 ? `<div class="b5-round-items-card" id="b5-round-items-card">${_perRoundHTML(0)}</div>` : ''}
        </div>
        <button id="b5-view-summary-btn" class="b-review-next-btn" style="${totalRoundsCount > 1 ? 'display:none' : ''}">
            📊 查看測驗總結
        </button>
    </div>
</div>`;

            _bindRicNav();

            Game.TimerManager.setTimeout(() => {
                this.audio.play('correct');
            }, 100, 'confetti');
            Game.TimerManager.setTimeout(() => {
                Game.Speech.speak('完成了！來看看派對回顧吧！');
            }, 600, 'speech');

            if (this.state.settings.clickMode === 'on') {
                Game.TimerManager.setTimeout(() => AssistClick.activate(), 400, 'ui');
            }

            Game.EventManager.on(document.getElementById('b5-view-summary-btn'), 'click', () => {
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
                <h1 class="b-res-title">🎉 派對規劃大師 🎉</h1>
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
                    <div class="b-res-label">成功關卡</div>
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
                    <div class="b-res-ach-item">✅ 在預算內規劃購物</div>
                    <div class="b-res-ach-item">✅ 分辨必買與選購商品</div>
                    <div class="b-res-ach-item">✅ 控制花費不超出預算</div>
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
                    if (accuracy === 100)    msg = '太厲害了，全部答對了！';
                    else if (accuracy >= 80) msg = `很棒喔，答對了${g.correctCount}關！`;
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
    const AssistClick = {
        _overlay: null, _handler: null, _touchHandler: null,
        _queue: [], _enabled: false,
        _lastHighlighted: null, _observer: null,

        activate() {
            if (this._overlay) return;
            this._overlay = document.createElement('div');
            this._overlay.id = 'b5-assist-overlay';
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
            if (Game.state.isProcessing) return;
            // b5-round-transition 是非互動動畫，直接跳過
            if (document.getElementById('b5-round-transition')) return;
            // 提示彈窗（z-index 10200，高於輔助遮罩）開啟時使用者需自行關閉，跳過 buildQueue 避免在彈窗下方誤標記高亮
            if (document.getElementById('b5-hard-hint-modal') || document.getElementById('b5c-hint-modal')) return;

            // 派對回顧頁：偵測「查看測驗總結」按鈕
            const viewSummaryBtn = document.getElementById('b5-view-summary-btn');
            if (viewSummaryBtn && viewSummaryBtn.style.display !== 'none') {
                this._clearHighlight();
                this._queue = [{ el: viewSummaryBtn, action: () => viewSummaryBtn.click() }];
                this._highlight(this._queue[0].el);
                return;
            }

            this._clearHighlight();
            this._queue = [];

            // b5-round-intro 有關閉按鈕 → 高亮並排隊點擊
            const roundIntroEl = document.getElementById('b5-round-intro');
            if (roundIntroEl) {
                const closeBtn = document.getElementById('b5-ri-cancel');
                if (closeBtn) {
                    this._highlight(closeBtn);
                    this._queue = [{ el: closeBtn, action: () => closeBtn.click() }];
                }
                return;
            }

            const g = Game.state.game;
            if (!g) return;

            // 歡迎畫面第2頁：偵測「開始挑選！」按鈕
            const wcStartBtn = document.getElementById('b5-wc2-start-btn');
            if (wcStartBtn) {
                this._highlight(wcStartBtn);
                this._queue = [{ el: wcStartBtn, action: () => wcStartBtn.click() }];
                return;
            }

            // Phase 2 找零階段（b5c）
            if (document.getElementById('b5c-wallet-zone')) {
                const nextBtn = document.querySelector('.b5-next-btn');
                if (nextBtn) {
                    this._highlight(nextBtn);
                    this._queue = [{ el: nextBtn, action: () => nextBtn.click() }];
                    return;
                }
                const changeConfirm = document.getElementById('b5c-confirm-btn');
                if (changeConfirm && changeConfirm.classList.contains('ready')) {
                    this._highlight(changeConfirm);
                    this._queue = [{ el: changeConfirm, action: () => changeConfirm.click() }];
                    return;
                }
                const sol = g.changeGreedySolution || {};
                const placed = g.changePlaced || [];
                const placedCounts = {};
                placed.forEach(p => { placedCounts[p.denom] = (placedCounts[p.denom] || 0) + 1; });
                const nextDenom = Object.keys(sol).map(Number).sort((a, b) => b - a)
                    .find(d => (placedCounts[d] || 0) < sol[d]);
                if (nextDenom) {
                    const card = document.querySelector(`.b5c-denom-card[data-denom="${nextDenom}"]`);
                    if (card) {
                        this._highlight(card);
                        this._queue = [{ el: card, action: () => Game._b5P2AddChangeCoin(nextDenom) }];
                    }
                }
                return;
            }

            // Phase 2 付款畫面（b5p2）
            if (document.getElementById('b5p2-wallet-coins')) {
                const p2Confirm = document.getElementById('b5-p2-confirm-btn');
                if (p2Confirm && !p2Confirm.disabled) {
                    this._highlight(p2Confirm);
                    this._queue = [{ el: p2Confirm, action: () => p2Confirm.click() }];
                    return;
                }
                if (g.p2ShowHint && g.p2HintSlots?.length) {
                    const nextSlot = g.p2HintSlots.find(s => !s.filled);
                    if (nextSlot) {
                        const trayEl = document.querySelector(`.b5p2-coin-drag[data-denom="${nextSlot.denom}"]`);
                        if (trayEl) {
                            this._highlight(trayEl);
                            this._queue = [{ el: trayEl, action: () => Game._b5P2AddCoin(nextSlot.denom) }];
                        }
                    }
                }
                return;
            }

            // 下一關 / 再試一次按鈕（送出後）
            if (g.submitted) {
                const nextBtn = document.querySelector('.b5-next-btn');
                if (nextBtn) {
                    this._highlight(nextBtn);
                    this._queue = [{ el: nextBtn, action: () => nextBtn.click() }];
                }
                return;
            }

            // 確認購買按鈕已可按
            const confirmBtn = document.getElementById('b5-confirm-btn');
            if (confirmBtn && !confirmBtn.disabled) {
                this._highlight(confirmBtn);
                this._queue = [{ el: confirmBtn, action: () => confirmBtn.click() }];
                return;
            }

            // 提示模式（p1HintMode）：按提示商品順序引導
            if (g.p1HintMode) {
                const nextHintId = (g.p1HintItems || []).find(id => !g.selectedIds.has(id));
                if (nextHintId) {
                    // 若提示商品不在當前類別 → 系統自動切換（不需使用者點擊標籤）
                    const hintCat = B5_ITEM_CATEGORIES[nextHintId];
                    if (hintCat && hintCat !== g.activeCategory) {
                        Game._switchB5Category(hintCat);
                    }
                    // 切換後直接找到商品卡並高亮
                    const hintCard = document.querySelector(`.b5-item-card[data-id="${nextHintId}"]`);
                    if (hintCard) {
                        this._highlight(hintCard);
                        this._queue = [{ el: hintCard, action: () => hintCard.click() }];
                    }
                    return;
                }
                // 所有提示商品已選 → 高亮確認按鈕
                const readyBtn = document.getElementById('b5-confirm-btn');
                if (readyBtn && !readyBtn.disabled) {
                    this._highlight(readyBtn);
                    this._queue = [{ el: readyBtn, action: () => readyBtn.click() }];
                }
                return;
            }

            // 尋找當前類別中第一個買得起且未選的商品
            const total     = g.items.filter(i => g.selectedIds.has(i.id)).reduce((s, i) => s + i.price, 0);
            const remaining = g.budget - total;
            const card = [...document.querySelectorAll('.b5-item-card:not(.selected):not(.disabled)')]
                .find(c => {
                    const item = g.items.find(i => i.id === c.dataset.id);
                    return item && item.price <= remaining;
                });
            if (card) {
                this._highlight(card);
                this._queue = [{ el: card, action: () => card.click() }];
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
