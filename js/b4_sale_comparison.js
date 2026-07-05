// =============================================================
// FILE: js/b4_sale_comparison.js — B4 特賣比一比
// 建立日期：2026-03-14
// =============================================================
'use strict';

// ── 商品資料（20組）─────────────────────────────────────────────
// optA 永遠比 optB 貴；顯示時隨機左右交換（swapped 旗標）
const B4_ITEMS = [
    { cat:'stationery', name:'鉛筆盒',       icon:'✏️',  imageUrl:'../images/b4/icon-b4-pencil-case.png',    optA:{ store:'文具店',  storeIcon:'🏪', price:85  }, optB:{ store:'超市',   storeIcon:'🛒', price:65  } },
    { cat:'food',       name:'蘋果（1斤）',  icon:'🍎',  imageUrl:'../images/c6/icon-c6-apple.png',          optA:{ store:'超市',   storeIcon:'🛒', price:45  }, optB:{ store:'傳統市場', storeIcon:'🥬', price:35  } },
    { cat:'stationery', name:'原子筆',       icon:'🖊️', imageUrl:'../images/c6/icon-c6-ballpoint-pen.png',  optA:{ store:'文具店', storeIcon:'🏪', price:15  }, optB:{ store:'生活百貨', storeIcon:'🧺', price:12  } },
    { cat:'food',       name:'礦泉水',       icon:'💧',  imageUrl:'../images/b4/icon-b4-mineral-water.png', optA:{ store:'便利商店',   storeIcon:'🏪', price:20  }, optB:{ store:'量販店', storeIcon:'🏬', price:13  } },
    { cat:'daily',      name:'洗髮精',       icon:'🧴',  imageUrl:'../images/a4/icon-a4-shampoo-shop.png',   optA:{ store:'藥妝店', storeIcon:'💊', price:189 }, optB:{ store:'量販店', storeIcon:'🏬', price:149 } },
    { cat:'food',       name:'巧克力',       icon:'🍫',  imageUrl:'../images/c6/icon-c6-chocolate.png',      optA:{ store:'便利商店',   storeIcon:'🏪', price:55  }, optB:{ store:'超市',   storeIcon:'🛒', price:42  } },
    { cat:'daily',      name:'毛巾',         icon:'🧣',  imageUrl:'../images/b4/icon-b4-towel.png',          optA:{ store:'百貨公司',   storeIcon:'🏢', price:250 }, optB:{ store:'生活百貨', storeIcon:'🧺', price:180 } },
    { cat:'stationery', name:'故事書',       icon:'📖',  imageUrl:'../images/c6/icon-c6-story-book.png',     optA:{ store:'書店',   storeIcon:'📚', price:280 }, optB:{ store:'二手店', storeIcon:'♻️', price:150 } },
    { cat:'food',       name:'牛奶（1公升）',icon:'🥛',  imageUrl:'../images/a4/icon-a4-milk-shop.png',      optA:{ store:'便利商店',   storeIcon:'🏪', price:65  }, optB:{ store:'超市',   storeIcon:'🛒', price:55  } },
    { cat:'daily',      name:'面紙（一包）', icon:'🧻',  imageUrl:'../images/a4/icon-a4-box-of-tissues-shop.png', optA:{ store:'便利商店', storeIcon:'🏪', price:39  }, optB:{ store:'量販店', storeIcon:'🏬', price:25  } },
    { cat:'clothing',   name:'雨傘',         icon:'☂️',  imageUrl:'../images/b4/icon-b4-umbrella.png',        optA:{ store:'百貨公司',   storeIcon:'🏢', price:480 }, optB:{ store:'夜市',   storeIcon:'🌙', price:150 } },
    { cat:'food',       name:'餅乾（一盒）', icon:'🍪',  imageUrl:'../images/c6/icon-c6-cookie.png',         optA:{ store:'便利商店',   storeIcon:'🏪', price:45  }, optB:{ store:'超市',   storeIcon:'🛒', price:35  } },
    { cat:'daily',      name:'牙刷',         icon:'🪥',  imageUrl:'../images/b4/icon-b4-toothbrush.png', optA:{ store:'藥局',   storeIcon:'💊', price:39  }, optB:{ store:'量販店', storeIcon:'🏬', price:29  } },
    { cat:'stationery', name:'色鉛筆',       icon:'🖍️', imageUrl:'../images/c6/icon-c6-colored-pen.png',    optA:{ store:'文具店', storeIcon:'🏪', price:120 }, optB:{ store:'生活百貨', storeIcon:'🧺', price:89  } },
    { cat:'food',       name:'果汁（1瓶）',  icon:'🧃',  imageUrl:'../images/a4/icon-a4-juice-shop.png',     optA:{ store:'便利商店',   storeIcon:'🏪', price:35  }, optB:{ store:'超市',   storeIcon:'🛒', price:25  } },
    { cat:'daily',      name:'電池（4顆）',  icon:'🔋',  imageUrl:'../images/a4/icon-a4-battery-shop.png',   optA:{ store:'便利商店',   storeIcon:'🏪', price:85  }, optB:{ store:'量販店', storeIcon:'🏬', price:59  } },
    { cat:'daily',      name:'洗碗精',       icon:'🧼',  imageUrl:'../images/a4/icon-a4-dish-soap-shop.png', optA:{ store:'超市',   storeIcon:'🛒', price:59  }, optB:{ store:'量販店', storeIcon:'🏬', price:45  } },
    { cat:'clothing',   name:'運動鞋',       icon:'👟',  imageUrl:'../images/c6/icon-c6-basketball-shoes.png', optA:{ store:'體育用品店', storeIcon:'⚽', price:1200}, optB:{ store:'生活百貨', storeIcon:'🧺', price:880 } },
    { cat:'clothing',   name:'拖鞋',         icon:'🩴',  imageUrl:'../images/b4/icon-b4-slippers.png',        optA:{ store:'百貨公司',   storeIcon:'🏢', price:390 }, optB:{ store:'夜市',   storeIcon:'🌙', price:120 } },
    { cat:'clothing',   name:'手套',         icon:'🧤',  imageUrl:'../images/a4/icon-a4-gloves-shop.png',    optA:{ store:'百貨公司',   storeIcon:'🏢', price:320 }, optB:{ store:'生活百貨', storeIcon:'🧺', price:180 } },
    { cat:'daily',      name:'洗手乳',       icon:'🧴',  imageUrl:'../images/a4/icon-a4-body-wash-shop.png', optA:{ store:'藥局',   storeIcon:'💊', price:55  }, optB:{ store:'量販店', storeIcon:'🏬', price:39  } },
    { cat:'food',       name:'奶茶',         icon:'🧋',  imageUrl:'../images/a4/icon-a4-milk-tea-shop.png',  optA:{ store:'手搖店', storeIcon:'🥤', price:60  }, optB:{ store:'便利商店',   storeIcon:'🏪', price:50  } },
    { cat:'daily',      name:'運動水壺',     icon:'🍶',  imageUrl:'../images/a4/icon-a4-water-bottle-shop.png', optA:{ store:'體育用品店', storeIcon:'⚽', price:350 }, optB:{ store:'生活百貨', storeIcon:'🧺', price:260 } },
    { cat:'clothing',   name:'帽子',         icon:'🧢',  imageUrl:'../images/a4/icon-a4-hat-shop.png',       optA:{ store:'百貨公司',   storeIcon:'🏢', price:580 }, optB:{ store:'網購',   storeIcon:'💻', price:420 } },
    { cat:'daily',      name:'便當盒',       icon:'🍱',  imageUrl:'../images/c6/icon-c6-bento.png',          optA:{ store:'百貨公司',   storeIcon:'🏢', price:285 }, optB:{ store:'量販店', storeIcon:'🏬', price:199 } },
    { cat:'stationery', name:'筆記本（3本）',icon:'📓',  imageUrl:'../images/c6/icon-c6-notebook.png',       optA:{ store:'文具店', storeIcon:'🏪', price:95  }, optB:{ store:'量販店', storeIcon:'🏬', price:69  } },
    { cat:'food',       name:'口香糖',       icon:'🍬',  imageUrl:'../images/c6/icon-c6-gum.png',            optA:{ store:'便利商店',   storeIcon:'🏪', price:35  }, optB:{ store:'超市',   storeIcon:'🛒', price:25  } },
    { cat:'daily',      name:'浴巾',         icon:'🛁',  imageUrl:'../images/b4/icon-b4-towel.png',          optA:{ store:'百貨公司',   storeIcon:'🏢', price:480 }, optB:{ store:'量販店', storeIcon:'🏬', price:320 } },
    { cat:'food',       name:'醬油（一瓶）', icon:'🫙',  imageUrl:'../images/b4/icon-b4-soy-sauce.png',      optA:{ store:'便利商店',   storeIcon:'🏪', price:89  }, optB:{ store:'量販店', storeIcon:'🏬', price:65  } },
    { cat:'daily',      name:'洗衣精',       icon:'🧺',  imageUrl:'../images/a4/icon-a4-laundry-detergent-shop.png', optA:{ store:'超市', storeIcon:'🛒', price:159 }, optB:{ store:'量販店', storeIcon:'🏬', price:119 } },
    // 追加 10 組（2026-03-29）
    { cat:'stationery', name:'橡皮擦（2個）',icon:'📎',  imageUrl:'../images/c6/icon-c6-eraser.png',         optA:{ store:'文具店', storeIcon:'🏪', price:25  }, optB:{ store:'生活百貨', storeIcon:'🧺', price:18  } },
    { cat:'food',       name:'果凍（一盒）', icon:'🍮',  imageUrl:'../images/b4/icon-b4-jelly-cup.png',      optA:{ store:'便利商店',   storeIcon:'🏪', price:55  }, optB:{ store:'量販店', storeIcon:'🏬', price:38  } },
    { cat:'food',       name:'麵包',         icon:'🍞',  imageUrl:'../images/a4/icon-a4-bread-shop.png',      optA:{ store:'咖啡廳', storeIcon:'☕', price:60  }, optB:{ store:'麵包店', storeIcon:'🥐', price:45  } },
    { cat:'food',       name:'鮪魚罐頭',     icon:'🐟',  imageUrl:'../images/b4/icon-b4-tuna-can.png',       optA:{ store:'便利商店',   storeIcon:'🏪', price:45  }, optB:{ store:'量販店', storeIcon:'🏬', price:32  } },
    { cat:'clothing',   name:'雨衣',         icon:'🌧️', imageUrl:'../images/b4/icon-b4-raincoat.png', optA:{ store:'百貨公司',   storeIcon:'🏢', price:280 }, optB:{ store:'夜市',   storeIcon:'🌙', price:150 } },
    { cat:'stationery', name:'剪刀',         icon:'✂️', imageUrl:'../images/c6/icon-c6-scissors.png',        optA:{ store:'文具店', storeIcon:'🏪', price:35  }, optB:{ store:'生活百貨', storeIcon:'🧺', price:25  } },
    { cat:'food',       name:'洋芋片（大包）',icon:'🥔', imageUrl:'../images/b4/icon-b4-potato-chips.png',  optA:{ store:'便利商店',   storeIcon:'🏪', price:49  }, optB:{ store:'量販店', storeIcon:'🏬', price:35  } },
    { cat:'daily',      name:'眼藥水',       icon:'💊',  imageUrl:'../images/b4/icon-b4-eye-drops.png',      optA:{ store:'藥局',   storeIcon:'💊', price:89  }, optB:{ store:'網購',   storeIcon:'💻', price:65  } },
    { cat:'daily',      name:'保溫瓶',       icon:'🫙',  imageUrl:'../images/b4/icon-b4-thermos.png',         optA:{ store:'百貨公司', storeIcon:'🏢', price:650 }, optB:{ store:'量販店', storeIcon:'🏬', price:480 } },
    { cat:'food',       name:'零食禮盒',     icon:'🎁',  imageUrl:'../images/b4/icon-b4-snack-gift.png',     optA:{ store:'百貨公司',   storeIcon:'🏢', price:380 }, optB:{ store:'量販店', storeIcon:'🏬', price:260 } },
];

// ── 三商店比一比題庫（15 組，每組 3 家店，參照 F4 排序設計）──────────────
// stores[0]最貴、stores[1]中間、stores[2]最便宜（生成時再隨機打亂）
const B4_TRIPLE_ITEMS = [
    { cat:'stationery', name:'鉛筆盒',       icon:'✏️',  imageUrl:'../images/b4/icon-b4-pencil-case.png',    stores:[{ store:'百貨公司',   storeIcon:'🏢', price:120 },{ store:'文具店', storeIcon:'🏪', price:85  },{ store:'生活百貨', storeIcon:'🧺', price:65  }] },
    { cat:'food',       name:'礦泉水',       icon:'💧',  imageUrl:'../images/b4/icon-b4-mineral-water.png', stores:[{ store:'高級餐廳',storeIcon:'🍽️', price:50  },{ store:'便利商店',   storeIcon:'🏪', price:25  },{ store:'量販店', storeIcon:'🏬', price:13  }] },
    { cat:'food',       name:'巧克力',       icon:'🍫',  imageUrl:'../images/c6/icon-c6-chocolate.png',      stores:[{ store:'百貨公司', storeIcon:'🏢', price:120 },{ store:'便利商店',   storeIcon:'🏪', price:55  },{ store:'超市',   storeIcon:'🛒', price:42  }] },
    { cat:'daily',      name:'洗髮精',       icon:'🧴',  imageUrl:'../images/a4/icon-a4-shampoo-shop.png',   stores:[{ store:'百貨公司',   storeIcon:'🏢', price:280 },{ store:'藥妝店', storeIcon:'💊', price:189 },{ store:'量販店', storeIcon:'🏬', price:149 }] },
    { cat:'stationery', name:'故事書',       icon:'📖',  imageUrl:'../images/c6/icon-c6-story-book.png',     stores:[{ store:'書店',   storeIcon:'📚', price:320 },{ store:'網購', storeIcon:'💻', price:280 },{ store:'二手店', storeIcon:'♻️', price:150 }] },
    { cat:'food',       name:'牛奶（1公升）',icon:'🥛',  imageUrl:'../images/a4/icon-a4-milk-shop.png',      stores:[{ store:'便利商店',   storeIcon:'🏪', price:80  },{ store:'超市',   storeIcon:'🛒', price:65  },{ store:'量販店', storeIcon:'🏬', price:50  }] },
    { cat:'stationery', name:'色鉛筆',       icon:'🖍️', imageUrl:'../images/c6/icon-c6-colored-pen.png',    stores:[{ store:'百貨公司',   storeIcon:'🏢', price:180 },{ store:'文具店', storeIcon:'🏪', price:120 },{ store:'生活百貨', storeIcon:'🧺', price:89  }] },
    { cat:'food',       name:'果汁（1瓶）',  icon:'🧃',  imageUrl:'../images/a4/icon-a4-juice-shop.png',     stores:[{ store:'百貨公司', storeIcon:'🏢', price:80  },{ store:'便利商店',   storeIcon:'🏪', price:35  },{ store:'超市',   storeIcon:'🛒', price:25  }] },
    { cat:'daily',      name:'電池（4顆）',  icon:'🔋',  imageUrl:'../images/a4/icon-a4-battery-shop.png',   stores:[{ store:'便利商店',   storeIcon:'🏪', price:120 },{ store:'藥局',   storeIcon:'💊', price:85  },{ store:'量販店', storeIcon:'🏬', price:59  }] },
    { cat:'daily',      name:'毛巾',         icon:'🧣',  imageUrl:'../images/b4/icon-b4-towel.png',          stores:[{ store:'百貨公司',   storeIcon:'🏢', price:350 },{ store:'超市',   storeIcon:'🛒', price:250 },{ store:'生活百貨', storeIcon:'🧺', price:180 }] },
    { cat:'stationery', name:'筆記本（3本）',icon:'📓',  imageUrl:'../images/c6/icon-c6-notebook.png',       stores:[{ store:'超市', storeIcon:'🛒', price:150 },{ store:'文具店', storeIcon:'🏪', price:95  },{ store:'量販店', storeIcon:'🏬', price:69  }] },
    { cat:'daily',      name:'洗手乳',       icon:'🧴',  imageUrl:'../images/a4/icon-a4-body-wash-shop.png', stores:[{ store:'百貨公司',   storeIcon:'🏢', price:120 },{ store:'藥局',   storeIcon:'💊', price:79  },{ store:'量販店', storeIcon:'🏬', price:55  }] },
    { cat:'food',       name:'奶茶',         icon:'🧋',  imageUrl:'../images/a4/icon-a4-milk-tea-shop.png',  stores:[{ store:'咖啡廳', storeIcon:'☕', price:150 },{ store:'手搖店', storeIcon:'🥤', price:60  },{ store:'便利商店',   storeIcon:'🏪', price:45  }] },
    { cat:'clothing',   name:'運動鞋',       icon:'👟',  imageUrl:'../images/c6/icon-c6-basketball-shoes.png', stores:[{ store:'百貨公司', storeIcon:'🏢', price:1580},{ store:'體育用品店', storeIcon:'⚽', price:1200},{ store:'生活百貨', storeIcon:'🧺', price:880 }] },
    { cat:'daily',      name:'洗碗精',       icon:'🧼',  imageUrl:'../images/a4/icon-a4-dish-soap-shop.png', stores:[{ store:'便利商店',   storeIcon:'🏪', price:89  },{ store:'超市',   storeIcon:'🛒', price:59  },{ store:'量販店', storeIcon:'🏬', price:45  }] },
    // 追加 5 組（2026-03-29）
    { cat:'stationery', name:'橡皮擦（2個）',icon:'📎',  imageUrl:'../images/c6/icon-c6-eraser.png',         stores:[{ store:'超市', storeIcon:'🛒', price:45  },{ store:'文具店', storeIcon:'🏪', price:25  },{ store:'生活百貨', storeIcon:'🧺', price:18  }] },
    { cat:'food',       name:'果凍（一盒）', icon:'🍮',  imageUrl:'../images/b4/icon-b4-jelly-cup.png',      stores:[{ store:'便利商店',   storeIcon:'🏪', price:75  },{ store:'超市',   storeIcon:'🛒', price:55  },{ store:'量販店', storeIcon:'🏬', price:38  }] },
    { cat:'food',       name:'麵包',         icon:'🍞',  imageUrl:'../images/a4/icon-a4-bread-shop.png',      stores:[{ store:'咖啡廳',   storeIcon:'☕', price:80  },{ store:'便利商店', storeIcon:'🏪', price:55  },{ store:'麵包店', storeIcon:'🥐', price:45  }] },
    { cat:'clothing',   name:'雨衣',         icon:'🌧️', imageUrl:'../images/b4/icon-b4-raincoat.png', stores:[{ store:'百貨公司',   storeIcon:'🏢', price:480 },{ store:'超市',   storeIcon:'🛒', price:280 },{ store:'夜市',   storeIcon:'🌙', price:150 }] },
    { cat:'food',       name:'洋芋片（大包）',icon:'🥔', imageUrl:'../images/b4/icon-b4-potato-chips.png',  stores:[{ store:'便利商店',   storeIcon:'🏪', price:79  },{ store:'超市',   storeIcon:'🛒', price:49  },{ store:'量販店', storeIcon:'🏬', price:35  }] },
];


// ── 輔助函數 ────────────────────────────────────────────────────
const toTWD = v => typeof convertToTraditionalCurrency === 'function' ? convertToTraditionalCurrency(v) : `${v}元`;

// 商品圖示 HTML：有 imageUrl 用圖片，否則用 emoji 備用
function b4IconHTML(item) {
    if (item && item.imageUrl) {
        const esc = (item.icon || '').replace(/'/g, '&#39;');
        return `<img src="${item.imageUrl}" alt="${item.name}" draggable="false" class="b4-icon-img" data-b4zoom="${item.imageUrl}" data-b4name="${item.name}" onerror="this.outerHTML='${esc}'">`;
    }
    return (item && item.icon) || '';
}

// ── 商店圖示：有圖用圖，否則 emoji 備用 ─────────────────────────
const B4_STORE_IMAGES = {
    '便利商店': '../images/b4/icon-b4-store-convenience.png',
    '超市':     '../images/b4/icon-b4-store-supermarket.png',
    '量販店':   '../images/b4/icon-b4-store-wholesale.png',
    '生活百貨': '../images/b4/icon-b4-store-variety.png',
    '文具店':   '../images/b4/icon-b4-store-stationery.png',
    '書店':     '../images/b4/icon-b4-store-bookstore.png',
    '二手店':   '../images/b4/icon-b4-store-secondhand.png',
    '百貨公司': '../images/b4/icon-b4-store-department.png',
    '傳統市場': '../images/b4/icon-b4-store-traditional-market.png',
    '夜市':     '../images/b4/icon-b4-store-nightmarket.png',
    '藥妝店':   '../images/b4/icon-b4-store-pharmacy.png',
    '藥局':     '../images/b4/icon-b4-store-drugstore.png',
    '體育用品店':'../images/b4/icon-b4-store-sports.png',
    '手搖店':   '../images/b4/icon-b4-store-drinkshop.png',
    '咖啡廳':   '../images/b4/icon-b4-store-cafe.png',
    '麵包店':   '../images/b4/icon-b4-store-bakery.png',
    '網購':     '../images/b4/icon-b4-store-online.png',
    '高級餐廳': '../images/b4/icon-b4-store-restaurant.png',
};
const B4_STORES = [
    { store: '便利商店', storeIcon: '🏪' }, { store: '超市',     storeIcon: '🛒' },
    { store: '量販店',   storeIcon: '🏬' }, { store: '生活百貨', storeIcon: '🧺' },
    { store: '文具店',   storeIcon: '🏪' }, { store: '書店',     storeIcon: '📚' },
    { store: '二手店',   storeIcon: '♻️' }, { store: '百貨公司', storeIcon: '🏢' },
    { store: '傳統市場', storeIcon: '🥬' }, { store: '夜市',     storeIcon: '🌙' },
    { store: '藥妝店',   storeIcon: '💊' }, { store: '藥局',     storeIcon: '💊' },
    { store: '體育用品店', storeIcon: '⚽' }, { store: '手搖店', storeIcon: '🥤' },
    { store: '咖啡廳',   storeIcon: '☕' }, { store: '麵包店',   storeIcon: '🥐' },
    { store: '網購',     storeIcon: '💻' }, { store: '高級餐廳', storeIcon: '🍽️' },
];

function b4StoreIconHTML(storeName, storeEmoji) {
    const url = B4_STORE_IMAGES[storeName];
    if (url) {
        const esc = (storeEmoji || '').replace(/'/g, '&#39;');
        return `<img src="${url}" alt="${storeName}" draggable="false" class="b4-store-icon-img" data-b4zoom="${url}" data-b4name="${storeName}" onerror="this.outerHTML='${esc}'">`;
    }
    return storeEmoji || '';
}

// ── 金錢圖示渲染（貪婪分解，每枚各顯示一張圖）────────────────
const B4_DENOMS = [1000, 500, 100, 50, 10, 5, 1];
// 較小圖示版（用於差額頁價格條，配合 flex-wrap:nowrap）
function b4PriceCoinsBar(price) {
    let rem = price;
    const coins = [];
    for (const d of B4_DENOMS) {
        const n = Math.floor(rem / d);
        for (let i = 0; i < n; i++) coins.push(d);
        rem -= d * n;
    }
    return coins.map(d => {
        const isBill = d >= 100;
        const w  = isBill ? '60px' : '44px';
        const h  = isBill ? 'auto' : '44px';
        const br = isBill ? '4px'  : '50%';
        return `<img src="../images/money/${d}_yuan_front.png" style="width:${w};height:${h};border-radius:${br};flex-shrink:0;" draggable="false" onerror="this.style.display='none'">`;
    }).join('');
}
// 差額算式提示表格：[貴商店] - [便宜商店] = [差額]
function b4DiffFormula(expStore, expPrice, cheapStore, cheapPrice, diff, unit, hideResult = false) {
    const u = unit || '元';
    const diffCell = hideResult
        ? `<div class="b4-dff-price b4-dff-diff b4-dff-unknown">？？？</div>`
        : `<div class="b4-dff-price b4-dff-diff">${diff} ${u}</div>`;
    return `
    <div class="b4-diff-formula">
        <div class="b4-dff-hd">${expStore}</div>
        <div class="b4-dff-op-hd"></div>
        <div class="b4-dff-hd">${cheapStore}</div>
        <div class="b4-dff-op-hd"></div>
        <div class="b4-dff-hd b4-dff-result-hd">便宜</div>
        <div class="b4-dff-price b4-dff-exp">${expPrice} ${u}</div>
        <div class="b4-dff-op">－</div>
        <div class="b4-dff-price b4-dff-cheap">${cheapPrice} ${u}</div>
        <div class="b4-dff-op">＝</div>
        ${diffCell}
    </div>`;
}
function b4PriceCoins(price) {
    let rem = price;
    const coins = [];
    for (const d of B4_DENOMS) {
        const n = Math.floor(rem / d);
        for (let i = 0; i < n; i++) coins.push(d);
        rem -= d * n;
    }
    return coins.map(d => {
        const isBill = d >= 100;
        const w  = isBill ? '100px' : '60px';
        const h  = isBill ? '48.91px' : '60px';
        const br = isBill ? '4px'   : '50%';
        return `<img src="../images/money/${d}_yuan_front.png" style="width:${w};height:${h};border-radius:${br};vertical-align:middle;object-fit:cover;" draggable="false" onerror="this.style.display='none'">`;
    }).join('');
}

// ── 主遊戲物件 ─────────────────────────────────────────────────
let Game;

document.addEventListener('DOMContentLoaded', () => {
    Game = {

        // ── Debug ──────────────────────────────────────────────
        Debug: {
            FLAGS: { all:false, init:false, speech:false, audio:false,
                     ui:false, question:false, state:false, error:true },
            log(cat, ...a)  { if (this.FLAGS.all || this.FLAGS[cat]) console.log(`[B4-${cat}]`, ...a); },
            warn(cat, ...a) { if (this.FLAGS.all || this.FLAGS[cat]) console.warn(`[B4-${cat}]`, ...a); },
            error(...a)     { console.error('[B4-ERROR]', ...a); }
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
                ['correct', 'success', 'error', 'click', 'keypad'].forEach(name => {
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
            settings: { difficulty: null, questionCount: null, compareStores: null, clickMode: 'off', itemCat: 'all', customItemsEnabled: false, magicItems: [] },
            quiz: {
                currentQuestion: 0,
                totalQuestions: 10,
                correctCount: 0,
                totalSaved: 0,
                selectErrorCount: 0,
                diffErrorCount: 0,
                streak: 0,
                questions: [],
                comparisonHistory: [],
                startTime: null
            },
            phase: 'select',    // 'select' | 'diff' | 'tripleRank'
            numpadValue: '',
            tripleClickOrder: [],   // 三商店排序點擊順序（hard mode）
            isEndingGame: false,
            isProcessing: false
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
        },

        injectGlobalAnimationStyles() {
            if (document.getElementById('b4-global-animations')) return;
            const s = document.createElement('style');
            s.id = 'b4-global-animations';
            s.textContent = `
                @keyframes b4SlideUp {
                    from { opacity:0; transform:translateY(20px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                /* 三商店比一比：等寬三欄滿版 */
                .b4-triple-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    align-items: stretch;
                }
                .b4-triple-card {
                    position: relative; padding-bottom: 36px;
                }
                .b4-price-hidden { color: #94a3b8; font-size: 1.1em; }
                .b4-rank-badge {
                    position: absolute; top: -10px; right: -10px;
                    font-size: 1.5em; display: none;
                    align-items: center; justify-content: center;
                }
                .b4-triple-clicked { border: 3px solid #f59e0b !important; }
                .b4-rank-hint {
                    font-size: 13px; color: #6b7280; margin-top: 6px;
                }
                .b4-pbar-mid {
                    background: linear-gradient(90deg, #f59e0b, #fbbf24);
                }
            `;
            document.head.appendChild(s);
        },

        resetGameState() {
            const q = this.state.quiz;
            q.currentQuestion     = 0;
            q.totalQuestions      = this.state.settings.questionCount;
            q.correctCount        = 0;
            q.totalSaved          = 0;
            q.streak              = 0;
            q.questions           = [];
            q.comparisonHistory   = [];
            q.startTime           = null;
            q.selectErrorCount    = 0;
            this.state.phase            = 'select';
            this.state.numpadValue      = '';
            this.state.tripleClickOrder = [];
            this.state.isEndingGame     = false;
            this.state.isProcessing     = false;
            Game.Debug.log('init', '🔄 [B4] 遊戲狀態已重置');
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
                        <h1>單元B4：特賣比一比</h1>
                    </div>
                    <div class="game-settings">
                        <div class="b-setting-group">
                            <label style="font-size:13px;color:#6b7280;text-align:left;display:block;">
                                ✨ 比較商店價格，找出最划算的選擇！<br>
                                兩家店：簡單選最便宜；三家店：由便宜到貴依序排列（F4 排序應用）
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
                            <div style="margin-top:6px;font-size:12px;color:#6b7280;line-height:1.5;">
                                啟用後，只要偵測到點擊便會自動執行下一個步驟
                            </div>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">🏪 比較方式</label>
                            <div class="b-btn-group">
                                <button class="b-sel-btn" data-stores="two">兩家店</button>
                                <button class="b-sel-btn" data-stores="triple">三家店排序 🎲</button>
                            </div>
                            <div style="margin-top:6px;font-size:12px;color:#6b7280;line-height:1.5;">
                                兩家店：比較兩間商店價格 ｜ 三家店：三間商店由便宜到貴排序
                            </div>
                        </div>
                        <div class="b-setting-group" id="b4-custom-items-group-wrap">
                            <div id="b4-custom-items-toggle-row" style="display:none;">
                                <label style="font-size:13px;color:#374151;font-weight:600;">✨ 魔法商品</label>
                                <div class="b-btn-group" id="b4-custom-items-group" style="margin-top:4px;">
                                    <button class="b-sel-btn active" data-custom="off">✗ 關閉</button>
                                    <button class="b-sel-btn" data-custom="on">✓ 開啟</button>
                                </div>
                                ${this._renderMagicItemsPanel()}
                            </div>
                        </div>
                        <div class="b-setting-group">
                            <label class="b-setting-label">🏷️ 商品類別</label>
                            <div class="b-btn-group" id="cat-group">
                                <button class="b-sel-btn active" data-cat="all">隨機</button>
                                <button class="b-sel-btn" data-cat="food">食品飲料</button>
                                <button class="b-sel-btn" data-cat="stationery">文具書籍</button>
                                <button class="b-sel-btn" data-cat="daily">生活用品</button>
                                <button class="b-sel-btn" data-cat="clothing">服飾配件</button>
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
                                <button class="b-sel-btn" id="b4-custom-count-btn">自訂</button>
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
            easy:   '簡單：依提示點擊金額圖示，自動完成作答。',
            normal: '普通：有金額數字的提示，輸入正確的答案。',
            hard:   '困難：自行判斷金額，輸入正確的答案。'
        },

        _bindSettingsEvents() {
            Game.EventManager.removeByCategory('settings');

            document.querySelectorAll('[data-diff]').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.difficulty = btn.dataset.diff;
                    const desc = document.getElementById('diff-desc');
                    if (desc) { desc.textContent = this._diffDescriptions[btn.dataset.diff]; desc.classList.add('show'); }
                    const assistGroup = document.getElementById('assist-click-group');
                    const modeGroup   = document.getElementById('mode-settings-group');
                    if (btn.dataset.diff === 'easy') {
                        if (assistGroup) assistGroup.style.display = '';
                        if (modeGroup && this.state.settings.clickMode === 'on') modeGroup.style.display = 'none';
                    } else {
                        if (assistGroup) assistGroup.style.display = 'none';
                        this.state.settings.clickMode = 'off';
                        if (modeGroup) modeGroup.style.display = '';
                    }
                    this._checkCanStart();
                }, {}, 'settings');
            });

            document.querySelectorAll('[data-count]').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('[data-count]').forEach(b => b.classList.remove('active'));
                    document.getElementById('b4-custom-count-btn')?.classList.remove('active');
                    btn.classList.add('active');
                    this.state.settings.questionCount = parseInt(btn.dataset.count);
                    this._checkCanStart();
                }, {}, 'settings');
            });
            const b4CustomCountBtn = document.getElementById('b4-custom-count-btn');
            if (b4CustomCountBtn) {
                Game.EventManager.on(b4CustomCountBtn, 'click', () => {
                    this._showSettingsCountNumpad('題數', (n) => {
                        document.querySelectorAll('[data-count]').forEach(b => b.classList.remove('active'));
                        b4CustomCountBtn.classList.add('active');
                        b4CustomCountBtn.textContent = `${n}題`;
                        this.state.settings.questionCount = n;
                        this._checkCanStart();
                    });
                }, {}, 'settings');
            }

            document.querySelectorAll('[data-stores]').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    const prevMode = this.state.settings.compareStores;
                    document.querySelectorAll('[data-stores]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.compareStores = btn.dataset.stores;
                    // 切換兩家/三家時清空魔法商品（格式不相容）
                    const toggleRow = document.getElementById('b4-custom-items-toggle-row');
                    if (toggleRow) toggleRow.style.display = '';
                    const modeChanged = prevMode && prevMode !== btn.dataset.stores;
                    if (modeChanged && this.state.settings.magicItems?.length > 0) {
                        this.state.settings.magicItems = [];
                        document.querySelectorAll('#b4-custom-items-group [data-custom]').forEach(b =>
                            b.classList.toggle('active', b.dataset.custom === 'off'));
                        this.state.settings.customItemsEnabled = false;
                    }
                    // 若已開啟且格式改變，重繪面板
                    if (this.state.settings.customItemsEnabled) {
                        const panel = document.getElementById('b4-magic-panel');
                        if (panel) { panel.outerHTML = this._renderMagicItemsPanel(); this._bindMagicItemsPanel(); }
                    }
                    this._checkCanStart();
                }, {}, 'settings');
            });

            // 魔法商品 toggle
            document.querySelectorAll('#b4-custom-items-group [data-custom]').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#b4-custom-items-group [data-custom]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.customItemsEnabled = btn.dataset.custom === 'on';
                    const panel = document.getElementById('b4-magic-panel');
                    if (panel) {
                        panel.style.display = this.state.settings.customItemsEnabled ? '' : 'none';
                        if (this.state.settings.customItemsEnabled) this._bindMagicItemsPanel();
                    }
                }, {}, 'settings');
            });
            if (this.state.settings.customItemsEnabled) {
                const panel = document.getElementById('b4-magic-panel');
                if (panel) { panel.style.display = ''; this._bindMagicItemsPanel(); }
            }

            document.querySelectorAll('#cat-group [data-cat]').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('#cat-group [data-cat]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.itemCat = btn.dataset.cat;
                }, {}, 'settings');
            });



            document.querySelectorAll('[data-assist]').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    document.querySelectorAll('[data-assist]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.settings.clickMode = btn.dataset.assist;
                    const modeGroup = document.getElementById('mode-settings-group');
                    if (modeGroup) {
                        modeGroup.style.display = (this.state.settings.difficulty === 'easy' && btn.dataset.assist === 'on') ? 'none' : '';
                    }
                    this._checkCanStart();
                }, {}, 'settings');
            });

            Game.EventManager.on(document.getElementById('settings-reward-link'), 'click', (e) => {
                e.preventDefault();
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'settings');

            // 作業單
            Game.EventManager.on(document.getElementById('settings-worksheet-link'), 'click', (e) => {
                e.preventDefault();
                const params = new URLSearchParams({ unit: 'b4' });
                window.open('../worksheet/index.html?' + params.toString(), 'Worksheet', 'width=900,height=700');
            }, {}, 'settings');

            Game.EventManager.on(document.getElementById('start-btn'), 'click', () => {
                this.startGame();
            }, {}, 'settings');
        },

        // ── 魔法商品 ────────────────────────────────────────────
        _renderMagicItemsPanel() {
            const s = this.state.settings;
            const storeCount = s.compareStores === 'triple' ? 3 : 2;
            const items = s.magicItems || [];
            const listHTML = items.map((mi, idx) => `
                <div class="b4-mp-item-row" data-mp-idx="${idx}">
                    <span class="b4-mp-item-icon">${b4IconHTML(mi)}</span>
                    <span class="b4-mp-item-name">${mi.name}</span>
                    ${mi.stores.map(st => `<span class="b4-mp-item-store">${st.storeIcon} ${st.price}元</span>`).join('')}
                    <button class="b4-mp-del-btn" data-mp-del="${idx}">✕</button>
                </div>`).join('');
            const storeFields = Array.from({ length: storeCount }, (_, i) => `
                <div class="b4-mp-store-row">
                    <span class="b4-mp-store-label">店${i + 1}：</span>
                    <div class="b4-mp-store-wrap"><button class="b4-cip-input b4-mp-store-btn" id="b4-mp-store-${i}-btn" type="button">選擇商店</button></div>
                    <button class="b4-cip-input b4-cip-price-inp b4-mp-price-btn" id="b4-mp-price-${i}-btn" type="button">金額</button>
                </div>`).join('');
            return `
            <div id="b4-magic-panel" style="display:${s.customItemsEnabled ? '' : 'none'};margin-top:10px;">
                <div style="font-size:11px;color:#6b7280;margin-bottom:6px;">最多 5 個魔法商品（每次遊戲保證出現一題）</div>
                <div id="b4-mp-list">${listHTML}</div>
                <div class="b4-mp-add-box">
                    <div class="b4-mp-row">
                        <input type="file" id="b4-mp-file" accept="image/*" style="display:none">
                        <button class="b4-mp-upload-btn" id="b4-mp-upload-btn" title="上傳圖片（選填）">📷</button>
                        <img id="b4-mp-preview" class="b4-mp-img-preview" style="display:none" alt="">
                        <input type="text" id="b4-mp-name" class="b4-cip-input" placeholder="商品名稱（最多6字）" maxlength="6" style="flex:1;">
                    </div>
                    ${storeFields}
                    <div style="display:flex;justify-content:flex-end;margin-top:4px;">
                        <button class="b4-cip-add-btn" id="b4-mp-add-btn">＋ 新增</button>
                    </div>
                </div>
            </div>`;
        },

        _bindMagicItemsPanel() {
            const s = this.state.settings;
            if (!s.magicItems) s.magicItems = [];
            const uploadBtn0 = document.getElementById('b4-mp-upload-btn');
            if (!uploadBtn0 || uploadBtn0._b4MpBound) return;
            uploadBtn0._b4MpBound = true;
            const storeCount = s.compareStores === 'triple' ? 3 : 2;
            let pendingImageUrl = null;
            const selectedStores = Array(storeCount).fill(null);
            const selectedPrices = Array(storeCount).fill(0);

            // 圖片上傳
            const fileInput = document.getElementById('b4-mp-file');
            const preview   = document.getElementById('b4-mp-preview');
            if (uploadBtn0 && fileInput) {
                Game.EventManager.on(uploadBtn0, 'click', () => fileInput.click(), {}, 'settings');
                Game.EventManager.on(fileInput, 'change', () => {
                    const file = fileInput.files?.[0];
                    if (!file) return;
                    this._compressMagicImage(file, (url) => {
                        pendingImageUrl = url;
                        if (preview) { preview.src = url; preview.style.display = ''; }
                    });
                }, {}, 'settings');
            }

            // 各店：商店下拉 + 金額 numpad
            for (let i = 0; i < storeCount; i++) {
                const storeBtn = document.getElementById(`b4-mp-store-${i}-btn`);
                const priceBtn = document.getElementById(`b4-mp-price-${i}-btn`);
                if (storeBtn) {
                    Game.EventManager.on(storeBtn, 'click', (e) => {
                        e.stopPropagation();
                        this._showStoreDropdown(storeBtn, selectedStores, i, (store) => {
                            selectedStores[i] = store;
                            storeBtn.textContent = `${store.storeIcon} ${store.store}`;
                            storeBtn.classList.add('b4-mp-store-btn--set');
                        });
                    }, {}, 'settings');
                }
                if (priceBtn) {
                    Game.EventManager.on(priceBtn, 'click', () => {
                        this._showMpPriceNumpad(selectedPrices[i], (n) => {
                            selectedPrices[i] = n;
                            priceBtn.textContent = `${n} 元`;
                            priceBtn.classList.add('b4-mp-price-btn--set');
                        });
                    }, {}, 'settings');
                }
            }

            // 新增按鈕
            const addBtn = document.getElementById('b4-mp-add-btn');
            if (addBtn) {
                Game.EventManager.on(addBtn, 'click', () => {
                    if (s.magicItems.length >= 5) { alert('最多新增 5 個魔法商品'); return; }
                    const name = document.getElementById('b4-mp-name')?.value.trim();
                    if (!name) { alert('請輸入商品名稱'); return; }
                    for (let i = 0; i < storeCount; i++) {
                        if (!selectedStores[i]) { alert(`請選擇店 ${i + 1} 的商店`); return; }
                        if (!selectedPrices[i] || selectedPrices[i] < 1) { alert(`請輸入店 ${i + 1} 的金額`); return; }
                    }
                    const storeNames = selectedStores.slice(0, storeCount).map(st => st.store);
                    if (new Set(storeNames).size < storeCount) { alert('請選擇不同的商店'); return; }
                    const prices = selectedPrices.slice(0, storeCount);
                    if (new Set(prices).size < storeCount) { alert('各店金額不可相同'); return; }
                    s.magicItems.push({
                        id: `magic-b4-${Date.now()}`,
                        name,
                        icon: '✨',
                        imageUrl: pendingImageUrl || null,
                        stores: selectedStores.slice(0, storeCount).map((st, i) => ({
                            store: st.store, storeIcon: st.storeIcon, price: selectedPrices[i]
                        })),
                        storeCount,
                        isCustom: true,
                    });
                    pendingImageUrl = null;
                    selectedStores.fill(null);
                    selectedPrices.fill(0);
                    document.getElementById('b4-mp-name').value = '';
                    if (preview) { preview.src = ''; preview.style.display = 'none'; }
                    if (fileInput) fileInput.value = '';
                    for (let i = 0; i < storeCount; i++) {
                        const sb = document.getElementById(`b4-mp-store-${i}-btn`);
                        if (sb) { sb.textContent = '選擇商店'; sb.classList.remove('b4-mp-store-btn--set'); }
                        const pb = document.getElementById(`b4-mp-price-${i}-btn`);
                        if (pb) { pb.textContent = '金額'; pb.classList.remove('b4-mp-price-btn--set'); }
                    }
                    this._refreshB4MagicItemsList();
                }, {}, 'settings');
            }

            // 刪除（委派）
            const list = document.getElementById('b4-mp-list');
            if (list) {
                Game.EventManager.on(list, 'click', (e) => {
                    const btn = e.target.closest('[data-mp-del]');
                    if (!btn) return;
                    s.magicItems.splice(parseInt(btn.dataset.mpDel), 1);
                    this._refreshB4MagicItemsList();
                }, {}, 'settings');
            }
        },

        _refreshB4MagicItemsList() {
            const list = document.getElementById('b4-mp-list');
            if (!list) return;
            const items = this.state.settings.magicItems || [];
            list.innerHTML = items.map((mi, idx) => `
                <div class="b4-mp-item-row" data-mp-idx="${idx}">
                    <span class="b4-mp-item-icon">${b4IconHTML(mi)}</span>
                    <span class="b4-mp-item-name">${mi.name}</span>
                    ${mi.stores.map(st => `<span class="b4-mp-item-store">${st.storeIcon} ${st.price}元</span>`).join('')}
                    <button class="b4-mp-del-btn" data-mp-del="${idx}">✕</button>
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
                    <div style="font-size:14px;font-weight:700;color:#374151;margin-bottom:10px;">💰 輸入金額</div>
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
                        if (parseInt(next) <= 9999) val = next;
                    }
                    update();
                });
            });
            overlay.querySelector('#b-mppnp-cancel').addEventListener('click', () => {
                const n = parseInt(val);
                if (n >= 1 && n <= 9999) { overlay.remove(); onConfirm(n); return; }
                disp.style.color = '#ef4444';
                setTimeout(() => { disp.style.color = ''; update(); }, 500);
                val = ''; update();
            });
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        },

        _showStoreDropdown(anchor, selectedStores, currentIdx, onSelect) {
            document.getElementById('b4-mp-store-dropdown')?.remove();
            const usedStores = new Set(
                selectedStores.filter((st, i) => st !== null && i !== currentIdx).map(st => st.store)
            );
            const available = B4_STORES.filter(st => !usedStores.has(st.store));
            const drop = document.createElement('div');
            drop.id = 'b4-mp-store-dropdown';
            drop.style.cssText = 'position:absolute;top:calc(100% + 4px);left:0;background:#fff;border:1.5px solid #d1d5db;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.15);z-index:10100;padding:8px;display:flex;flex-wrap:wrap;gap:4px;max-width:280px;min-width:200px;';
            drop.innerHTML = available.map(st =>
                `<button style="padding:5px 8px;border:1.5px solid #e5e7eb;border-radius:6px;background:#f9fafb;cursor:pointer;font-size:13px;white-space:nowrap;" data-sname="${st.store}" data-sicon="${st.storeIcon}">${st.storeIcon} ${st.store}</button>`
            ).join('');
            const wrap = anchor.closest('.b4-mp-store-wrap') || anchor.parentElement;
            wrap.style.position = 'relative';
            wrap.appendChild(drop);
            drop.querySelectorAll('[data-sname]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onSelect({ store: btn.dataset.sname, storeIcon: btn.dataset.sicon });
                    drop.remove();
                });
            });
            const close = (e) => {
                if (!drop.contains(e.target) && e.target !== anchor) {
                    drop.remove(); document.removeEventListener('click', close);
                }
            };
            setTimeout(() => document.addEventListener('click', close), 0);
        },

        _compressMagicImage(file, cb) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const size = 200;
                    const scale = Math.min(size / img.width, size / img.height, 1);
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

        _checkCanStart() {
            const btn = document.getElementById('start-btn');
            const s = this.state.settings;
            if (btn) btn.disabled = !s.difficulty || !s.questionCount || !s.compareStores;
        },

        // ── Start Game ─────────────────────────────────────────
        startGame() {
            Game.EventManager.removeByCategory('settings');
            Game.TimerManager.clearAll();

            const s = this.state.settings;
            const q = this.state.quiz;
            q.currentQuestion   = 0;
            q.totalQuestions    = s.questionCount;
            q.correctCount      = 0;
            q.totalSaved        = 0;
            q.streak            = 0;
            q.comparisonHistory = [];
            q.startTime         = Date.now();
            q.questions         = this._generateQuestions(q.totalQuestions);

            this.state.phase         = 'select';
            this.state.numpadValue   = '';
            this.state.isEndingGame = false;
            this.state.isProcessing  = false;
            this.state._skipFirstIntroModal = false;

            this.showWelcomeScreen();
        },

        // ── 歡迎畫面（進入測驗前顯示第一題商品）─────────────────────
        showWelcomeScreen() {
            const app = document.getElementById('app');
            const q = this.state.quiz;
            const firstItem = q.questions[0];
            const randomText = `比價一下，看看${firstItem.name}在哪一家商店更划算`;

            app.innerHTML = `
                <style>
                    .b4-wc-container {
                        display:flex;flex-direction:column;justify-content:center;
                        align-items:center;min-height:100vh;
                        background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);
                        padding:20px;
                    }
                    .b4-wc-box {
                        background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);
                        border:3px solid #fbbf24;border-radius:24px;
                        padding:48px 60px;text-align:center;
                        max-width:480px;width:100%;
                        box-shadow:0 8px 32px rgba(0,0,0,0.12);
                    }
                    .b4-wc-badge {
                        font-size:24px;font-weight:800;color:#b45309;margin-bottom:10px;
                    }
                    .b4-wc-desc {
                        font-size:18px;color:#78350f;margin-bottom:24px;
                    }
                    .b4-wc-icon {
                        margin:0 auto 20px;
                        width:128px;height:128px;
                        display:flex;align-items:center;justify-content:center;
                    }
                    .b4-wc-icon .b4-icon-img {
                        width:128px;height:128px;object-fit:contain;
                    }
                    .b4-wc-name {
                        font-size:24px;font-weight:900;color:#92400e;margin-bottom:28px;
                    }
                    .b4-wc-start-btn {
                        background:linear-gradient(135deg,#d97706,#b45309);
                        color:#fff;border:none;border-radius:16px;
                        padding:14px 40px;font-size:20px;font-weight:700;
                        cursor:pointer;
                        box-shadow:0 4px 12px rgba(217,119,6,0.4);
                        transition:transform 0.15s,box-shadow 0.15s;
                    }
                    .b4-wc-start-btn:hover {
                        transform:translateY(-2px);
                        box-shadow:0 6px 18px rgba(217,119,6,0.5);
                    }
                    @media(max-width:480px){
                        .b4-wc-box{padding:32px 20px;}
                        .b4-wc-badge{font-size:20px;}
                        .b4-wc-icon,.b4-wc-icon .b4-icon-img{width:96px;height:96px;}
                        .b4-wc-start-btn{font-size:17px;padding:12px 28px;}
                    }
                </style>
                <div class="b4-wc-container">
                    <div class="b4-wc-box">
                        <div class="b4-wc-badge">🆚 今日比較商品</div>
                        <div class="b4-wc-desc">${randomText}</div>
                        <div class="b4-wc-icon">${b4IconHTML(firstItem)}</div>
                        <div class="b4-wc-name">${firstItem.name}</div>
                        <button class="b4-wc-start-btn" id="b4-wc-start-btn">開始比較！ 🏷️</button>
                    </div>
                </div>`;

            Game.Speech.speak(randomText);
            this.state._skipFirstIntroModal = true;

            const startBtn = document.getElementById('b4-wc-start-btn');
            if (startBtn) {
                Game.EventManager.on(startBtn, 'click', () => {
                    window.speechSynthesis.cancel();
                    this.renderQuestion();
                }, {}, 'welcome');
            }
        },

        _generateQuestions(count) {
            const compareStores = this.state.settings.compareStores;
            const itemCat = this.state.settings.itemCat || 'all';
            const isTriple = compareStores === 'triple';
            const basePool = isTriple ? B4_TRIPLE_ITEMS : B4_ITEMS;
            const filtered = itemCat !== 'all' ? basePool.filter(i => i.cat === itemCat) : basePool;
            const catPool  = filtered.length >= 2 ? filtered : basePool;
            const pool     = [...catPool];
            const result   = [];
            for (let i = 0; i < count; i++) {
                if (pool.length === 0) pool.push(...catPool);
                const idx  = Math.floor(Math.random() * pool.length);
                const item = pool.splice(idx, 1)[0];

                if (isTriple) {
                    // 隨機打亂三家店的顯示順序
                    const shuffled = [...item.stores].sort(() => Math.random() - 0.5);
                    // 由便宜到貴排序（cheapest = index 0）
                    const sortedAsc = [...item.stores].sort((a, b) => a.price - b.price);
                    // 在打亂陣列中找各排名的位置
                    const cheapestIdx  = shuffled.findIndex(s => s.price === sortedAsc[0].price);
                    const middleIdx    = shuffled.findIndex(s => s.price === sortedAsc[1].price);
                    const mostExpIdx   = shuffled.findIndex(s => s.price === sortedAsc[2].price);
                    const diff = sortedAsc[2].price - sortedAsc[0].price; // 最貴 - 最便宜
                    result.push({ ...item, stores: shuffled, sortedAsc, cheapestIdx, middleIdx, mostExpIdx, diff, isTriple: true });
                } else {
                    // 價格動態變化（普通/困難模式 ±10%/±20%，C5 PriceStrategy pattern）
                    let finalItem = item;
                    const difficulty = this.state.settings.difficulty;
                    if (difficulty === 'normal' || difficulty === 'hard') {
                        const pct = difficulty === 'hard' ? 0.20 : 0.10;
                        let priceA = Math.round(item.optA.price * (1 + (Math.random() * 2 - 1) * pct) / 5) * 5;
                        let priceB = Math.round(item.optB.price * (1 + (Math.random() * 2 - 1) * pct) / 5) * 5;
                        priceA = Math.max(priceA, 5);
                        priceB = Math.max(priceB, 5);
                        // 確保 optA 仍較貴（若隨機使 A ≤ B，則不套用變化）
                        if (priceA > priceB) {
                            finalItem = { ...item, optA: { ...item.optA, price: priceA }, optB: { ...item.optB, price: priceB } };
                        }
                    }
                    // 隨機決定左右交換
                    const swapped = Math.random() < 0.5;
                    const diff    = finalItem.optA.price - finalItem.optB.price; // optB 永遠便宜
                    result.push({ ...finalItem, swapped, diff, isTriple: false });
                }
            }

            // 注入魔法商品（每次遊戲保證出現一題）
            {
                const magic = (this.state.settings.magicItems || [])
                    .filter(mi => isTriple ? mi.storeCount === 3 : mi.storeCount === 2);
                if (magic.length > 0) {
                    const chosen = magic[Math.floor(Math.random() * magic.length)];
                    let magicQ;
                    if (isTriple) {
                        const sortedAsc = [...chosen.stores].sort((a, b) => a.price - b.price);
                        const shuffled  = [...chosen.stores].sort(() => Math.random() - 0.5);
                        const cheapestIdx = shuffled.findIndex(s => s.price === sortedAsc[0].price);
                        const middleIdx   = shuffled.findIndex(s => s.price === sortedAsc[1].price);
                        const mostExpIdx  = shuffled.findIndex(s => s.price === sortedAsc[2].price);
                        const diff = sortedAsc[2].price - sortedAsc[0].price;
                        magicQ = { ...chosen, stores: shuffled, sortedAsc, cheapestIdx, middleIdx, mostExpIdx, diff, isTriple: true };
                    } else {
                        const sortedDesc = [...chosen.stores].sort((a, b) => b.price - a.price);
                        const optA = sortedDesc[0];
                        const optB = sortedDesc[1];
                        const swapped = Math.random() < 0.5;
                        const diff = optA.price - optB.price;
                        magicQ = { ...chosen, optA, optB, swapped, diff, isTriple: false };
                    }
                    const replaceIdx = Math.floor(Math.random() * result.length);
                    result[replaceIdx] = magicQ;
                }
            }

            return result;
        },

        // ── Render Question ────────────────────────────────────
        renderQuestion() {
            Game.TimerManager.clearAll();
            window.speechSynthesis.cancel();
            Game.EventManager.removeByCategory('gameUI');
            AssistClick.deactivate();
            this.state.isProcessing    = false;
            this.state.phase           = 'select';
            this.state.numpadValue     = '';
            this.state.tripleClickOrder = [];

            const q    = this.state.quiz;
            const curr = q.questions[q.currentQuestion];
            const diff = this.state.settings.difficulty;
            const app  = document.getElementById('app');

            // 三商店模式路由
            if (curr.isTriple) {
                this._renderTripleQuestion(curr, diff, app);
                return;
            }

            // 決定左右
            const left  = curr.swapped ? curr.optB : curr.optA;
            const right = curr.swapped ? curr.optA : curr.optB;
            // 正確答案：便宜的是 optB；若 swapped，便宜在左（left=optB）
            const correctSide = curr.swapped ? 'left' : 'right';

            const questionLabel = `哪個地方比較便宜？`;

            app.innerHTML = `
            ${this._renderHeader()}
            <div class="b-game-wrap">
                <div class="b4-item-hero" style="position:relative;">
                    <span class="b4-item-icon">${b4IconHTML(curr)}</span>
                    <div class="b4-item-name">${curr.name}</div>
                    <div class="b4-question-label">
                        ${questionLabel}
                        <button class="b-inline-replay" id="replay-speech-btn" title="重播語音">🔊</button>
                    </div>
                    ${diff === 'easy' ? `<div class="b4-easy-coin-hint">✋ 點擊金幣計算金額</div>` : ''}
                    ${diff !== 'easy' ? `<div class="b4-hero-hint-wrap" id="b4-hero-hint-wrap">
                        <img src="../images/common/hint_detective.png" alt="" class="b4-hint-mascot" onerror="this.style.display='none'">
                        <button class="b4-hero-hint-btn" id="b4-hero-hint-btn">💡 提示</button>
                    </div>` : ''}
                </div>
                <div class="b4-compare-grid" id="compare-grid">
                    ${this._renderOptionCard('left', left, curr.optB.price, correctSide)}
                    <div class="b4-vs-divider">VS</div>
                    ${this._renderOptionCard('right', right, curr.optB.price, correctSide)}
                </div>
                <div id="diff-section"></div>
            </div>`;

            this._bindSelectEvents(curr, correctSide, left, right);
            this._bindIconClicks(curr);

            // 依難度揭露卡片
            if (diff === 'easy') {
                this._setupEasyModeCoins(curr, left, right, correctSide);
                if (this.state.settings.clickMode === 'on') {
                    Game.TimerManager.setTimeout(() => AssistClick.activate(curr, correctSide), 300, 'ui');
                }
            } else if (diff === 'normal') {
                this._setupNormalModeCoins(curr, left, right, correctSide);
            } else {
                // hard: 金幣靜態顯示，價格以可點擊輸入框隱藏
                ['left', 'right'].forEach(s => {
                    const priceEl = document.querySelector(`#card-${s} .b4-price`);
                    if (priceEl) {
                        priceEl.classList.remove('b4-price-hidden');
                        priceEl.innerHTML = `<button class="b4-price-input-btn" id="b4-pic-${s}" disabled><span class="b4-pic-val">？？？</span><span class="b4-pic-hint">📝</span></button>`;
                    }
                });
                this._revealCoinsOnly(left, right);
            }

            // 語音引導（afterClose pattern）
            let speechText;
            {
                const s1 = left.store, p1 = left.price;
                const s2 = right.store, p2 = right.price;
                const intro = p1 === p2
                    ? `${s1}跟${s2}都是${p1}元`
                    : `${s1}${toTWD(p1)}，${s2}${toTWD(p2)}`;
                const speechMap = {
                    easy:   `${intro}，請問哪一個商店賣的比較便宜？`,
                    normal: `${intro}，請問哪一個商店賣的比較便宜？`,
                    hard:   `${s1}跟${s2}，請問哪一個商店賣的比較便宜？`,
                };
                speechText = speechMap[diff] || `哪個地方比較便宜？`;
            }
            this.state.quiz.lastSpeechText = `${curr.name}，${speechText}`;
            this._showItemIntroModal(curr, () => {
                if (diff === 'hard') {
                    // 困難：播完語音後在商店卡片中輸入金額
                    Game.Speech.speak(speechText, () => {
                        this._activateHardCardInputs(curr, left, right, correctSide);
                    });
                } else {
                    Game.Speech.speak(speechText);
                    // easy/normal 依賴金幣點擊推進
                }
            });

        },

        // ── 困難記憶倒數（Round 38）─────────────────────────────
        _startMemoryCountdown() {
            const existing = document.getElementById('b4-memory-bar');
            if (existing) existing.remove();
            let sec = 3;
            const bar = document.createElement('div');
            bar.id = 'b4-memory-bar';
            bar.className = 'b4-memory-bar';
            bar.innerHTML = `<span>⏱</span><span>記住價格！還有 <strong id="b4-mem-sec">3</strong> 秒</span><div class="b4-mem-track"><div class="b4-mem-fill" id="b4-mem-fill" style="width:100%"></div></div>`;
            const app = document.getElementById('app');
            if (app) app.insertAdjacentElement('afterbegin', bar);
            else return;

            const tick = () => {
                sec--;
                const secEl = document.getElementById('b4-mem-sec');
                const fill  = document.getElementById('b4-mem-fill');
                if (secEl) secEl.textContent = sec;
                if (fill)  fill.style.width = `${Math.round((sec / 3) * 100)}%`;
                if (sec <= 0) {
                    if (document.body.contains(bar)) bar.remove();
                    // 模糊所有價格
                    document.querySelectorAll('.b4-price').forEach(el => el.classList.add('b4-mem-blur'));
                    const hero = document.querySelector('.b4-item-hero');
                    if (hero) {
                        const hint = document.createElement('div');
                        hint.className = 'b4-mem-challenge';
                        hint.textContent = '🤔 靠記憶回答！';
                        hero.appendChild(hint);
                        Game.TimerManager.setTimeout(() => { if (document.body.contains(hint)) hint.remove(); }, 2200, 'ui');
                    }
                    // 語音重聽按鈕（Round 45）
                    const curr45 = this.state.quiz.currentQuestion < this.state.quiz.questions.length
                        ? this.state.quiz.questions[this.state.quiz.currentQuestion] : null;
                    if (curr45) {
                        const replayBtn = document.createElement('button');
                        replayBtn.id = 'b4-mem-replay';
                        replayBtn.className = 'b4-mem-replay-btn';
                        replayBtn.textContent = '🔊 重聽價格';
                        const buildSpeech = c => {
                            if (c.isTriple) return c.stores.map(s => `${s.store}${s.price}元`).join('，');
                            return `${c.optA.store}${c.optA.price}元，${c.optB.store}${c.optB.price}元`;
                        };
                        Game.EventManager.on(replayBtn, 'click', () => {
                            Game.Speech.speak(buildSpeech(curr45));
                            replayBtn.disabled = true;
                            Game.TimerManager.setTimeout(() => { replayBtn.disabled = false; }, 2000, 'ui');
                        }, {}, 'gameUI');
                        const app = document.getElementById('app');
                        if (app) app.insertAdjacentElement('afterbegin', replayBtn);
                    }
                } else {
                    Game.TimerManager.setTimeout(tick, 1000, 'ui');
                }
            };
            Game.TimerManager.setTimeout(tick, 1000, 'ui');
        },

        _showItemIntroModal(curr, afterClose) {
            // 歡迎畫面已顯示第一題商品，跳過第一次彈窗
            if (this.state._skipFirstIntroModal) {
                this.state._skipFirstIntroModal = false;
                afterClose?.();
                return;
            }
            const existing = document.getElementById('b4-item-intro-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'b4-item-intro-modal';
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(5px);animation:b4IntroOverlayIn 0.3s ease-out;';
            modal.innerHTML = `
                <div class="b4-intro-card" onclick="event.stopPropagation()">
                    <div class="b4-intro-header">
                        <span class="b4-intro-title">🆚 今日比較商品</span>
                        <button class="b4-intro-close-x" id="b4-intro-close-x">✕</button>
                    </div>
                    <div class="b4-intro-body">
                        <div class="b4-intro-icon">${b4IconHTML(curr)}</div>
                        <div class="b4-intro-name">${curr.name}</div>
                    </div>
                    <div class="b4-intro-footer">
                        <button class="b4-intro-start-btn" id="b4-intro-start-btn">開始比較！</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);

            let closed = false;
            const closeModal = () => {
                if (closed) return;
                closed = true;
                window.speechSynthesis.cancel();
                if (modal.parentNode) modal.remove();
                afterClose?.();
            };
            Game.TimerManager.setTimeout(() => {
                Game.Speech.speak(curr.name);
            }, 300, 'ui');
            modal.querySelector('#b4-intro-start-btn').addEventListener('click', closeModal);
            modal.querySelector('#b4-intro-close-x').addEventListener('click', closeModal);
        },

        _renderHeader() {
            const q = this.state.quiz;
            const diffLabel = { easy: '簡單模式', normal: '普通模式', hard: '困難模式' }[this.state.settings.difficulty] || '';
            const catLabels = { all:'全部', food:'食品飲料', stationery:'文具書籍', daily:'生活用品', clothing:'服飾配件' };
            const catLabel  = catLabels[this.state.settings.itemCat || 'all'];
            const stepLabel = { select:'第 1 步：找出較便宜的價格', tripleRank:'第 1 步：找出較便宜的價格', diff:'第 2 步：算出差額' }[this.state.phase] || '';
            const centerTxt = stepLabel || (catLabel !== '全部' ? `${diffLabel}・${catLabel}` : diffLabel);
            return `
            <div class="b-header">
                <div class="b-header-left">
                    <span class="b-header-unit">🏷️ 特賣比一比</span>
                </div>
                <div class="b-header-center">${centerTxt}</div>
                <div class="b-header-right">
                    <span class="b-progress">第 ${q.currentQuestion + 1} 題 / 共 ${q.totalQuestions} 題</span>
                    ${q.totalSaved > 0 ? `<span class="b4-savings-tally">💰 已省 ${q.totalSaved} 元</span>` : ''}
                    <button class="b-reward-btn" id="reward-btn-g">🎁 獎勵</button>
                    <button class="b-back-btn" id="back-to-settings">返回設定</button>
                </div>
            </div>`;
        },

        _renderOptionCard(side, opt, cheaperPer, correctSide, extraHTML = '') {
            return `
            <div class="b4-option-card" id="card-${side}" data-side="${side}" data-price="${opt.price}">
                <div class="b4-store-label">商店</div>
                <div class="b4-store-icon">${b4StoreIconHTML(opt.store, opt.storeIcon)}</div>
                <div class="b4-store-name">${opt.store}</div>
                <div class="b4-price b4-price-hidden">? <span class="b4-price-unit">元</span></div>
                <div class="b4-price-coins b4-price-coins-hidden"></div>
                ${extraHTML}
            </div>`;
        },

        // ── 簡單模式：逐枚點擊金幣後自動比較 ─────────────────────
        _getCoinsArray(price) {
            let rem = price;
            const arr = [];
            for (const d of B4_DENOMS) {
                const n = Math.floor(rem / d);
                for (let i = 0; i < n; i++) arr.push(d);
                rem -= d * n;
            }
            return arr;
        },

        _setupEasyModeCoins(curr, left, right, correctSide) {
            const coinsData = {
                left:  { opt: left,  coins: this._getCoinsArray(left.price),  clickedCount: 0, done: false },
                right: { opt: right, coins: this._getCoinsArray(right.price), clickedCount: 0, done: false }
            };

            ['left', 'right'].forEach(side => {
                const card    = document.getElementById(`card-${side}`);
                const coinsEl = card?.querySelector('.b4-price-coins');
                const priceEl = card?.querySelector('.b4-price');
                if (!coinsEl) return;

                const data = coinsData[side];
                let runningTotal = 0;

                coinsEl.classList.remove('b4-price-coins-hidden');
                coinsEl.innerHTML = data.coins.map((d, i) => {
                    const isBill = d >= 100;
                    const w  = isBill ? '100px' : '60px';
                    const h  = isBill ? '48.91px' : '60px';
                    const br = isBill ? '4px' : '50%';
                    return `<span class="b4-coin-wrap" style="position:relative;display:inline-block;border-radius:${br};vertical-align:middle;">
                        <img src="../images/money/${d}_yuan_front.png"
                            data-cidx="${i}" data-cval="${d}" data-cside="${side}"
                            class="b4-easy-coin"
                            style="width:${w};height:${h};border-radius:${br};vertical-align:middle;object-fit:cover;cursor:pointer;transition:opacity 0.2s;"
                            draggable="false" onerror="this.style.display='none'">
                    </span>`;
                }).join('');

                if (priceEl) {
                    priceEl.classList.remove('b4-price-hidden');
                    priceEl.innerHTML = `0 <span class="b4-price-unit">元</span>`;
                }

                coinsEl.querySelectorAll('.b4-easy-coin').forEach(img => {
                    Game.EventManager.on(img, 'click', () => {
                        if (img.dataset.clicked || data.done) return;
                        img.dataset.clicked = '1';
                        img.style.opacity = '0.5';
                        const wrap = img.parentElement;
                        if (wrap?.classList.contains('b4-coin-wrap')) {
                            wrap.style.outline = '2.5px solid #10b981';
                            wrap.style.outlineOffset = '2px';
                            const ck = document.createElement('span');
                            ck.className = 'b4-coin-check';
                            ck.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#10b981;color:white;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;z-index:2;pointer-events:none;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,0.3);';
                            ck.textContent = '✓';
                            wrap.appendChild(ck);
                        }
                        runningTotal += parseInt(img.dataset.cval);
                        data.clickedCount++;
                        if (priceEl) priceEl.innerHTML = `${runningTotal} <span class="b4-price-unit">元</span>`;

                        const isLast = data.clickedCount >= data.coins.length;
                        if (isLast) {
                            data.done = true;
                            if (card) card.style.outline = '3px solid #10b981';
                            Game.Speech.speak(`${runningTotal}元`, () => {
                                const other = side === 'left' ? 'right' : 'left';
                                if (coinsData[other].done) {
                                    this._handleEasyBothSidesDone(curr, correctSide, left, right);
                                }
                            });
                        } else {
                            Game.Speech.speak(`${runningTotal}元`);
                        }
                    }, {}, 'gameUI');
                });
            });

            this.state._easyCoinsDone = coinsData;
        },

        _handleEasyBothSidesDone(curr, correctSide, left, right) {
            if (this.state.isProcessing) return;
            this.state.isProcessing = true;
            this._clearSelectHintTimer();

            // Reveal actual prices
            this._revealCardPrices(left, right);

            const correctCard = document.getElementById(`card-${correctSide}`);
            const wrongSide   = correctSide === 'left' ? 'right' : 'left';
            const wrongCard   = document.getElementById(`card-${wrongSide}`);

            this.audio.play('correct');

            const delta = Math.abs(left.price - right.price);
            if (correctCard) {
                correctCard.classList.add('selected-correct', 'b4-card-glow');
                const savingsTag = delta > 0 ? `<div class="b4-card-savings-amount">省了 ${delta} 元</div>` : '';
                correctCard.innerHTML += `<div class="b4-result-mark correct">✓</div>
                    ${savingsTag}
                    <div class="b4-cheaper-tag">比較便宜！</div>`;
            }
            if (wrongCard) {
                wrongCard.classList.add('selected-wrong');
                wrongCard.innerHTML += `<div class="b4-exp-delta">比較貴</div>`;
            }

            this.state.quiz.correctCount++;

            const cheapSide = correctSide === 'left' ? left : right;
            const priceSpeech = `${cheapSide.store}，${cheapSide.price}元，比較便宜！`;
            Game.Speech.speak(priceSpeech, () => {
                this.state.isProcessing = false;
                this.state.phase = 'diff';
                this.state.currentDiffItem = curr;
                this._renderDiffSection(curr, 'easy');
            });
        },

        // ── 普通模式：點幣後輸入較便宜價格 ──────────────────────────
        _setupNormalModeCoins(curr, left, right, correctSide, startHidden = false) {
            const coinsData = {
                left:  { opt: left,  coins: this._getCoinsArray(left.price),  clickedCount: 0, done: false },
                right: { opt: right, coins: this._getCoinsArray(right.price), clickedCount: 0, done: false }
            };

            ['left', 'right'].forEach(side => {
                const card = document.getElementById(`card-${side}`);
                const coinsEl = card?.querySelector('.b4-price-coins');
                const priceEl = card?.querySelector('.b4-price');
                if (!coinsEl) return;

                const data = coinsData[side];
                let runningTotal = 0;

                coinsEl.classList.remove('b4-price-coins-hidden');
                coinsEl.innerHTML = data.coins.map((d, i) => {
                    const isBill = d >= 100;
                    const w  = isBill ? '100px' : '60px';
                    const h  = isBill ? '48.91px' : '60px';
                    const br = isBill ? '4px' : '50%';
                    return `<span class="b4-coin-wrap" style="position:relative;display:inline-block;border-radius:${br};vertical-align:middle;">
                        <img src="../images/money/${d}_yuan_front.png"
                            data-cidx="${i}" data-cval="${d}" data-cside="${side}"
                            class="b4-easy-coin"
                            style="width:${w};height:${h};border-radius:${br};vertical-align:middle;object-fit:cover;cursor:pointer;transition:opacity 0.2s;"
                            draggable="false" onerror="this.style.display='none'">
                    </span>`;
                }).join('');

                if (priceEl) {
                    priceEl.classList.remove('b4-price-hidden');
                    priceEl.innerHTML = startHidden
                        ? `<span class="b4-price-unknown">？？？</span>`
                        : `0 <span class="b4-price-unit">元</span>`;
                }

                coinsEl.querySelectorAll('.b4-easy-coin').forEach(img => {
                    Game.EventManager.on(img, 'click', () => {
                        if (img.dataset.clicked || data.done) return;
                        img.dataset.clicked = '1';
                        img.style.opacity = '0.5';
                        const wrap = img.parentElement;
                        if (wrap?.classList.contains('b4-coin-wrap')) {
                            wrap.style.outline = '2.5px solid #10b981';
                            wrap.style.outlineOffset = '2px';
                            const ck = document.createElement('span');
                            ck.className = 'b4-coin-check';
                            ck.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#10b981;color:white;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;z-index:2;pointer-events:none;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,0.3);';
                            ck.textContent = '✓';
                            wrap.appendChild(ck);
                        }

                        runningTotal += parseInt(img.dataset.cval);
                        data.clickedCount++;
                        if (priceEl) priceEl.innerHTML = `${runningTotal} <span class="b4-price-unit">元</span>`;

                        const isLast = data.clickedCount >= data.coins.length;
                        if (isLast) {
                            data.done = true;
                            if (card) card.style.outline = '3px solid #10b981';
                            Game.Speech.speak(`${runningTotal}元`, () => {
                                const other = side === 'left' ? 'right' : 'left';
                                if (coinsData[other].done) {
                                    this._showPriceInputSection(curr, left, right, correctSide);
                                }
                            });
                        } else {
                            Game.Speech.speak(`${runningTotal}元`);
                        }
                    }, {}, 'gameUI');
                });
            });
        },

        _showPriceInputSection(curr, left, right, correctSide) {
            const diff       = this.state.settings.difficulty;
            const cheapOpt   = correctSide === 'left' ? left : right;
            const expOpt     = correctSide === 'left' ? right : left;
            const cheapPrice = cheapOpt.price;

            const section = document.getElementById('diff-section');
            if (!section) return;

            const unit       = '元';
            const cheapLabel = '請輸入較便宜的商品價格';

            // 困難模式：先輸入較貴的價格（Box 1），正確後再輸入較便宜（Box 2）
            if (diff === 'hard') {
                const expLabel = `請輸入 ${expOpt.store} 的商品價格`;

                section.innerHTML = `
                <div class="b4-pi-card" id="b4-pi-box1">
                    <div class="b4-pi-label">${expLabel}</div>
                    <div class="b4-input-display b4-pi-input-box" id="b4-pi-display-1" style="cursor:pointer;" title="點我輸入">
                        <span id="b4-pi-val-1">？</span><span class="b4-unit-text"> ${unit}</span>
                    </div>
                    <div class="b4-pi-tap-hint">👆 點擊輸入</div>
                </div>
                <div class="b4-pi-card" id="b4-pi-box2" style="display:none;">
                    <div class="b4-pi-label">${cheapLabel}</div>
                    <div class="b4-input-display b4-pi-input-box" id="b4-pi-display-2" style="cursor:pointer;" title="點我輸入">
                        <span id="b4-pi-val-2">？</span><span class="b4-unit-text"> ${unit}</span>
                    </div>
                    <div class="b4-pi-tap-hint">👆 點擊輸入</div>
                </div>`;

                let piVal1 = '', piVal2 = '';

                Game.Speech.speak(expLabel);

                // ─── Box 2 numpad (cheap price) ───────────────────────────
                const openBox2 = () => {
                    const prev = document.getElementById('b4-pi-modal');
                    if (prev) prev.remove();
                    const overlay = document.createElement('div');
                    overlay.id = 'b4-pi-modal';
                    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);';
                    overlay.innerHTML = `
                    <div class="b4-pi-modal-card">
                        <button class="b4-modal-close-x" id="b4-pi-m-x">✕</button>
                        <div class="b4-pi-modal-title">${cheapLabel}</div>
                        <div class="b4-input-display" id="b4-pi-m-display">
                            <span id="b4-pi-m-val">${piVal2 || '0'}</span><span class="b4-unit-text"> ${unit}</span>
                        </div>
                        <div class="b4-numpad">
                            ${[7,8,9,4,5,6,1,2,3].map(n => `<button class="b4-numpad-btn" data-pinum="${n}">${n}</button>`).join('')}
                            <button class="b4-numpad-btn btn-del" id="b4-pi-m-del">⌫</button>
                            <button class="b4-numpad-btn" data-pinum="0">0</button>
                            <button class="b4-numpad-btn btn-ok" id="b4-pi-m-ok">✓</button>
                        </div>
                    </div>`;
                    document.body.appendChild(overlay);
                    const updateM2 = () => { const el = document.getElementById('b4-pi-m-val'); if (el) el.textContent = piVal2 || '0'; const v2 = document.getElementById('b4-pi-val-2'); if (v2) v2.textContent = piVal2 || '？'; };
                    overlay.querySelectorAll('[data-pinum]').forEach(btn => { btn.addEventListener('click', e => { e.stopPropagation(); if (piVal2.length >= 5) return; piVal2 += btn.dataset.pinum; updateM2(); }); });
                    document.getElementById('b4-pi-m-del').addEventListener('click', e => { e.stopPropagation(); piVal2 = piVal2.slice(0, -1); updateM2(); });
                    document.getElementById('b4-pi-m-x').addEventListener('click', e => { e.stopPropagation(); overlay.remove(); });
                    document.getElementById('b4-pi-m-ok').addEventListener('click', e => {
                        e.stopPropagation();
                        if (this.state.isProcessing) return;
                        const entered = parseInt(piVal2) || 0;
                        if (entered === 0) return;
                        this.state.isProcessing = true;
                        overlay.remove();
                        const v2el = document.getElementById('b4-pi-val-2');
                        if (v2el) v2el.textContent = entered;
                        const isCorrect = (entered === cheapPrice);
                        if (isCorrect) {
                            this.audio.play('correct');
                            this._showCenterFeedback('✅', '答對了！');
                            this.state.quiz.streak = (this.state.quiz.streak || 0) + 1;
                            this._revealCardPrices(left, right);
                            const correctCard = document.getElementById(`card-${correctSide}`);
                            const delta2 = Math.abs(left.price - right.price);
                            if (correctCard) {
                                correctCard.classList.add('selected-correct', 'b4-card-glow');
                                const savingsTag2 = (delta2 > 0) ? `<div class="b4-card-savings-amount">省了 ${delta2} 元</div>` : '';
                                correctCard.innerHTML += `<div class="b4-result-mark correct">✓</div>${savingsTag2}<div class="b4-cheaper-tag">比較便宜！</div>`;
                            }
                            const wrongSide = correctSide === 'left' ? 'right' : 'left';
                            const wrongCard = document.getElementById(`card-${wrongSide}`);
                            if (wrongCard) { wrongCard.classList.add('selected-wrong'); wrongCard.innerHTML += `<div class="b4-exp-delta">比較貴</div>`; }
                            const speech = `答對了！${cheapOpt.store}${cheapPrice}元，比較便宜`;
                            Game.Speech.speak(speech, () => {
                                this.state.isProcessing = false;
                                this.state.phase = 'diff';
                                this.state.currentDiffItem = curr;
                                this._renderDiffSection(curr, diff);
                            });
                        } else {
                            this.audio.play('error');
                            const errSpeech = (entered === expOpt.price)
                                ? `不對喔，${expOpt.store}是${expOpt.price}元，請輸入比較便宜的那家`
                                : `不對喔，請再想想哪家比較便宜`;
                            Game.Speech.speak(errSpeech, () => {
                                Game.TimerManager.setTimeout(() => {
                                    this.state.isProcessing = false;
                                    piVal2 = '';
                                    const v2r = document.getElementById('b4-pi-val-2');
                                    if (v2r) v2r.textContent = '？';
                                }, 400, 'ui');
                            });
                        }
                    });
                };

                // ─── Box 1 numpad (expensive store price) ─────────────────
                const openBox1 = () => {
                    const prev = document.getElementById('b4-pi-modal');
                    if (prev) prev.remove();
                    const overlay = document.createElement('div');
                    overlay.id = 'b4-pi-modal';
                    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);';
                    overlay.innerHTML = `
                    <div class="b4-pi-modal-card">
                        <button class="b4-modal-close-x" id="b4-pi-m-x">✕</button>
                        <div class="b4-pi-modal-title">${expLabel}</div>
                        <div class="b4-input-display" id="b4-pi-m-display">
                            <span id="b4-pi-m-val">${piVal1 || '0'}</span><span class="b4-unit-text"> ${unit}</span>
                        </div>
                        <div class="b4-numpad">
                            ${[7,8,9,4,5,6,1,2,3].map(n => `<button class="b4-numpad-btn" data-pinum="${n}">${n}</button>`).join('')}
                            <button class="b4-numpad-btn btn-del" id="b4-pi-m-del">⌫</button>
                            <button class="b4-numpad-btn" data-pinum="0">0</button>
                            <button class="b4-numpad-btn btn-ok" id="b4-pi-m-ok">✓</button>
                        </div>
                    </div>`;
                    document.body.appendChild(overlay);
                    const updateM1 = () => { const el = document.getElementById('b4-pi-m-val'); if (el) el.textContent = piVal1 || '0'; const v1 = document.getElementById('b4-pi-val-1'); if (v1) v1.textContent = piVal1 || '？'; };
                    overlay.querySelectorAll('[data-pinum]').forEach(btn => { btn.addEventListener('click', e => { e.stopPropagation(); if (piVal1.length >= 5) return; piVal1 += btn.dataset.pinum; updateM1(); }); });
                    document.getElementById('b4-pi-m-del').addEventListener('click', e => { e.stopPropagation(); piVal1 = piVal1.slice(0, -1); updateM1(); });
                    document.getElementById('b4-pi-m-x').addEventListener('click', e => { e.stopPropagation(); overlay.remove(); });
                    document.getElementById('b4-pi-m-ok').addEventListener('click', e => {
                        e.stopPropagation();
                        if (this.state.isProcessing) return;
                        const entered = parseInt(piVal1) || 0;
                        if (entered === 0) return;
                        this.state.isProcessing = true;
                        overlay.remove();
                        const v1el = document.getElementById('b4-pi-val-1');
                        if (v1el) v1el.textContent = entered;
                        if (entered === expOpt.price) {
                            this.audio.play('correct');
                            this._showCenterFeedback('✅', '答對了！');
                            Game.TimerManager.setTimeout(() => {
                                this.state.isProcessing = false;
                                const box2 = document.getElementById('b4-pi-box2');
                                if (box2) box2.style.display = '';
                                Game.Speech.speak(cheapLabel);
                                Game.EventManager.on(document.getElementById('b4-pi-display-2'), 'click', openBox2, {}, 'gameUI');
                            }, 500, 'ui');
                        } else {
                            this.audio.play('error');
                            Game.Speech.speak('不對喔，請再想想', () => {
                                Game.TimerManager.setTimeout(() => {
                                    this.state.isProcessing = false;
                                    piVal1 = '';
                                    const v1r = document.getElementById('b4-pi-val-1');
                                    if (v1r) v1r.textContent = '？';
                                }, 400, 'ui');
                            });
                        }
                    });
                };

                Game.EventManager.on(document.getElementById('b4-pi-display-1'), 'click', openBox1, {}, 'gameUI');
                return;
            }

            // 普通模式：單一輸入框（較便宜的價格）
            const label = cheapLabel;
            section.innerHTML = `
            <div class="b4-pi-card">
                <div class="b4-pi-label">${label}</div>
                <div class="b4-input-display b4-pi-input-box" id="b4-pi-display" style="cursor:pointer;" title="點我輸入">
                    <span id="b4-pi-val">？</span><span class="b4-unit-text"> ${unit}</span>
                </div>
                <div class="b4-pi-tap-hint">👆 點擊輸入</div>
            </div>`;

            let piValue = '';
            const updateDisplay = () => { const el = document.getElementById('b4-pi-val'); if (el) el.textContent = piValue || '？'; };

            Game.Speech.speak(label);

            const openNumpad = () => {
                const prev = document.getElementById('b4-pi-modal');
                if (prev) prev.remove();
                const overlay = document.createElement('div');
                overlay.id = 'b4-pi-modal';
                overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);';
                overlay.innerHTML = `
                <div class="b4-pi-modal-card">
                    <button class="b4-modal-close-x" id="b4-pi-m-x">✕</button>
                    <div class="b4-pi-modal-title">${label}</div>
                    <div class="b4-input-display" id="b4-pi-m-display">
                        <span id="b4-pi-m-val">${piValue || '0'}</span><span class="b4-unit-text"> ${unit}</span>
                    </div>
                    <div class="b4-numpad">
                        ${[7,8,9,4,5,6,1,2,3].map(n => `<button class="b4-numpad-btn" data-pinum="${n}">${n}</button>`).join('')}
                        <button class="b4-numpad-btn btn-del" id="b4-pi-m-del">⌫</button>
                        <button class="b4-numpad-btn" data-pinum="0">0</button>
                        <button class="b4-numpad-btn btn-ok" id="b4-pi-m-ok">✓</button>
                    </div>
                </div>`;
                document.body.appendChild(overlay);
                const updateM = () => { const el = document.getElementById('b4-pi-m-val'); if (el) el.textContent = piValue || '0'; };
                overlay.querySelectorAll('[data-pinum]').forEach(btn => { btn.addEventListener('click', e => { e.stopPropagation(); if (piValue.length >= 5) return; piValue += btn.dataset.pinum; updateM(); updateDisplay(); }); });
                document.getElementById('b4-pi-m-del').addEventListener('click', e => { e.stopPropagation(); piValue = piValue.slice(0, -1); updateM(); updateDisplay(); });
                document.getElementById('b4-pi-m-x').addEventListener('click', e => { e.stopPropagation(); overlay.remove(); });
                document.getElementById('b4-pi-m-ok').addEventListener('click', e => {
                    e.stopPropagation();
                    if (this.state.isProcessing) return;
                    const entered = parseInt(piValue) || 0;
                    if (entered === 0) return;
                    this.state.isProcessing = true;
                    overlay.remove();
                    const display = document.getElementById('b4-pi-display');
                    if (display) display.querySelector('#b4-pi-val').textContent = entered;
                    const isCorrect = (entered === cheapPrice);
                    if (isCorrect) {
                        this.audio.play('correct');
                        this._showCenterFeedback('✅', '答對了！');
                        this.state.quiz.streak = (this.state.quiz.streak || 0) + 1;
                        this._revealCardPrices(left, right);
                        const correctCard = document.getElementById(`card-${correctSide}`);
                        const delta2 = Math.abs(left.price - right.price);
                        if (correctCard) {
                            correctCard.classList.add('selected-correct', 'b4-card-glow');
                            const savingsTag2 = (delta2 > 0) ? `<div class="b4-card-savings-amount">省了 ${delta2} 元</div>` : '';
                            correctCard.innerHTML += `<div class="b4-result-mark correct">✓</div>${savingsTag2}<div class="b4-cheaper-tag">比較便宜！</div>`;
                        }
                        const wrongSide = correctSide === 'left' ? 'right' : 'left';
                        const wrongCard = document.getElementById(`card-${wrongSide}`);
                        if (wrongCard) { wrongCard.classList.add('selected-wrong'); wrongCard.innerHTML += `<div class="b4-exp-delta">比較貴</div>`; }
                        const speech = `答對了！${cheapOpt.store}${cheapPrice}元，比較便宜`;
                        Game.Speech.speak(speech, () => {
                            this.state.isProcessing = false;
                            this.state.phase = 'diff';
                            this.state.currentDiffItem = curr;
                            this._renderDiffSection(curr, diff);
                        });
                    } else {
                        this.audio.play('error');
                        const isExpPrice = (entered === expOpt.price);
                        const errSpeech = isExpPrice
                            ? `不對喔，${expOpt.store}是${expOpt.price}元，請輸入比較便宜的那家`
                            : `不對喔，請再想想哪家比較便宜`;
                        Game.Speech.speak(errSpeech, () => {
                            Game.TimerManager.setTimeout(() => {
                                this.state.isProcessing = false;
                                piValue = '';
                                updateDisplay();
                            }, 400, 'ui');
                        });
                    }
                });
            };

            Game.EventManager.on(document.getElementById('b4-pi-display'), 'click', openNumpad, {}, 'gameUI');
        },

        // ── 揭露卡片價格 helpers ────────────────────────────────
        _revealCardPrices(left, right) {
            ['left', 'right'].forEach(s => {
                const card = document.getElementById(`card-${s}`);
                if (!card) return;
                const opt = s === 'left' ? left : right;
                const priceEl = card.querySelector('.b4-price');
                if (priceEl) {
                    priceEl.classList.remove('b4-price-hidden');
                    priceEl.innerHTML = `${opt.price} <span class="b4-price-unit">元</span>`;
                }
                const coinsEl = card.querySelector('.b4-price-coins');
                if (coinsEl) {
                    coinsEl.classList.remove('b4-price-coins-hidden');
                    coinsEl.innerHTML = b4PriceCoins(opt.price);
                }
            });
        },

        _revealTripleCardPrices(curr) {
            curr.stores.forEach((store, i) => {
                const card = document.getElementById(`tcard-${i}`);
                if (!card) return;
                const priceEl = card.querySelector('.b4-price');
                if (priceEl) {
                    priceEl.classList.remove('b4-price-hidden');
                    priceEl.innerHTML = `${store.price} <span class="b4-price-unit">元</span>`;
                }
                const coinsEl = card.querySelector('.b4-price-coins');
                if (coinsEl) {
                    coinsEl.classList.remove('b4-price-coins-hidden');
                    coinsEl.innerHTML = b4PriceCoins(store.price);
                }
            });
        },

        // ── 僅揭露金錢圖示，價格文字保留「? 元」────────────────────
        _revealCoinsOnly(left, right) {
            ['left', 'right'].forEach(s => {
                const card = document.getElementById(`card-${s}`);
                if (!card) return;
                const opt = s === 'left' ? left : right;
                const coinsEl = card.querySelector('.b4-price-coins');
                if (coinsEl) {
                    coinsEl.classList.remove('b4-price-coins-hidden');
                    coinsEl.innerHTML = b4PriceCoins(opt.price);
                }
            });
        },

        _revealTripleCoinsOnly(curr) {
            curr.stores.forEach((store, i) => {
                const card = document.getElementById(`tcard-${i}`);
                if (!card) return;
                const coinsEl = card.querySelector('.b4-price-coins');
                if (coinsEl) {
                    coinsEl.classList.remove('b4-price-coins-hidden');
                    coinsEl.innerHTML = b4PriceCoins(store.price);
                }
            });
        },

        _bindSelectEvents(curr, correctSide, left, right) {
            const diff = this.state.settings.difficulty;
            // 全模式改為逐枚點幣，商品卡片本身不可直接點選

            // hero 提示鈕
            const heroHintBtn = document.getElementById('b4-hero-hint-btn');
            if (heroHintBtn) {
                Game.EventManager.on(heroHintBtn, 'click', () => {
                    if (this.state.phase === 'select') {
                        // 揭露兩張卡片的價格+金幣，再高亮正確卡
                        this._revealCardPrices(left, right);
                        const hintCard = document.getElementById(`card-${correctSide}`);
                        if (hintCard) {
                            hintCard.classList.add('b4-select-hint');
                            Game.TimerManager.setTimeout(() => hintCard.classList.remove('b4-select-hint'), 2400, 'ui');
                        }
                        const cheapName = correctSide === 'left' ? left.store : right.store;
                        if (diff === 'hard') {
                            Game.Speech.speak(`提示：${cheapName}比較便宜`, () => {
                                this.state._hardCardHintFill?.();
                            });
                        } else if (diff === 'normal') {
                            // 揭露價格後金幣監聽器已被銷毀，語音結束後直接進入輸入階段
                            Game.Speech.speak(`提示：${cheapName}比較便宜`, () => {
                                this._showPriceInputSection(curr, left, right, correctSide);
                            });
                        } else {
                            Game.Speech.speak(`提示：${cheapName}比較便宜`);
                        }
                    } else {
                        // diff 階段：顯示算式 + 語音
                        this._showDiffFormulaHint();
                        const item = this.state.currentDiffItem || curr;
                        const hintSpeech = `${item.optA.store}${item.optA.price}元，${item.optB.store}${item.optB.price}元，兩者差多少元？`;
                        Game.Speech.speak(hintSpeech);
                    }
                }, {}, 'gameUI');
            }

            // 導覽
            Game.EventManager.on(document.getElementById('back-to-settings'), 'click', () => {
                this.showSettings();
            }, {}, 'gameUI');
            Game.EventManager.on(document.getElementById('reward-btn-g'), 'click', () => {
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'gameUI');
            // 語音重播
            const replayBtn = document.getElementById('replay-speech-btn');
            if (replayBtn) {
                Game.EventManager.on(replayBtn, 'click', () => {
                    const text = this.state.quiz.lastSpeechText;
                    if (text) Game.Speech.speak(text);
                }, {}, 'gameUI');
            }
        },

        // ── Select Phase Handler ────────────────────────────────
        handleSelectClick(isCorrect, curr, correctSide, left, right) {
            this._clearSelectHintTimer();
            const diff = this.state.settings.difficulty;
            // 點擊時揭露兩張卡片的價格
            this._revealCardPrices(left, right);

            // 視覺回饋
            const correctCard = document.getElementById(`card-${correctSide}`);
            const wrongSide   = correctSide === 'left' ? 'right' : 'left';
            const wrongCard   = document.getElementById(`card-${wrongSide}`);

            if (isCorrect) {
                this.audio.play('correct');
                this._showCenterFeedback('✅', '答對了！');
                const delta = Math.abs((left.price || 0) - (right.price || 0));
                if (correctCard) {
                    correctCard.classList.add('selected-correct', 'b4-card-glow');
                    const savingsTag = (delta > 0)
                        ? `<div class="b4-card-savings-amount">省了 ${delta} 元</div>` : '';
                    correctCard.innerHTML += `<div class="b4-result-mark correct">✓</div>
                        ${savingsTag}
                        <div class="b4-cheaper-tag">比較便宜！</div>`;
                }
                // 貴的那張只顯示「比較貴」（不含金額）
                if (wrongCard) {
                    wrongCard.classList.add('selected-wrong');
                    wrongCard.innerHTML += `<div class="b4-exp-delta">比較貴</div>`;
                }
                if (diff === 'easy') {
                    // 簡單：直接下一題
                    this.state.quiz.correctCount++;
                    const cheapSide = correctSide === 'left' ? left : right;
                    const expSide   = correctSide === 'left' ? right : left;
                    // 即時數字語音（Round 37：F4 instant feedback pattern）
                    const priceSpeech = `${cheapSide.store}，${cheapSide.price}元，比較便宜！`;
                    this._showChampionBadge(cheapSide.store); // 冠軍徽章（Round 31）
                    this._showThinkingSteps(curr); // 比價思路步驟卡（Round 44）
                    Game.Speech.speak(priceSpeech, () => {
                        this.state.isProcessing = false;
                        this.state.phase = 'diff';
                        this.state.currentDiffItem = curr;
                        this._renderDiffSection(curr, 'easy');
                    });
                } else {
                    // 普通/困難：語音播完後進入差額頁
                    const cheapSideNH = correctSide === 'left' ? left : right;
                    const nhSpeech = `答對了！${cheapSideNH.store}比較便宜`;
                    Game.Speech.speak(nhSpeech, () => {
                        this.state.isProcessing = false;
                        this.state.phase = 'diff';
                        this.state.currentDiffItem = curr;
                        this._renderDiffSection(curr, diff);
                    });
                }
            } else {
                this.state.quiz.streak = 0;
                this.audio.play('error');
                if (wrongCard)   wrongCard.classList.add('selected-wrong');
                if (correctCard) {
                    correctCard.classList.add('reveal-correct');
                    const revealTag = '這個才便宜';
                    correctCard.innerHTML += `<div class="b4-cheaper-tag">${revealTag}</div>`;
                }
                this.state.quiz.selectErrorCount++;
                    // 普通模式第 3 次錯誤：揭露金額數字
                    if (diff === 'normal' && this.state.quiz.selectErrorCount >= 3) {
                        this._revealCardPrices(left, right);
                    }
                    this._showCenterFeedback('❌', '再試一次！');
                    Game.Speech.speak('這邊比較貴喔，再看看另一邊');
                    Game.TimerManager.setTimeout(() => {
                        this.state.isProcessing = false;
                        ['left','right'].forEach(s => {
                            const c = document.getElementById(`card-${s}`);
                            if (c) c.classList.remove('selected-wrong', 'reveal-correct', 'selected-correct');
                            const marks = c?.querySelectorAll('.b4-result-mark,.b4-cheaper-tag');
                            marks?.forEach(m => m.remove());
                        });
                    }, 1500, 'turnTransition');
            }
        },

        // ── 三商店比一比 ────────────────────────────────────────────
        _renderTripleQuestion(curr, diff, app) {
            const questionLabel = diff === 'easy'
                ? '哪家商店最便宜？'
                : '從最便宜到最貴，依序輸入各家商品金額';

            const cardsHTML = curr.stores.map((store, idx) => {
                let priceDisplay;
                if (diff === 'hard') {
                    priceDisplay = `<div class="b4-price" data-price="${store.price}"><button class="b4-price-input-btn" id="b4-tpic-${idx}" disabled><span class="b4-pic-val">？？？</span><span class="b4-pic-hint">📝</span></button></div>
                       <div class="b4-price-coins b4-price-coins-hidden"></div>`;
                } else {
                    priceDisplay = `<div class="b4-price b4-price-hidden" data-price="${store.price}">? <span class="b4-price-unit">元</span></div>
                       <div class="b4-price-coins b4-price-coins-hidden"></div>`;
                }
                return `
                <div class="b4-option-card b4-triple-card" id="tcard-${idx}" data-idx="${idx}">
                    <div class="b4-store-label">商店</div>
                    <div class="b4-store-icon">${b4StoreIconHTML(store.store, store.storeIcon)}</div>
                    <div class="b4-store-name">${store.store}</div>
                    ${priceDisplay}
                </div>`;
            }).join('');

            app.innerHTML = `
            ${this._renderHeader()}
            <div class="b-game-wrap">
                <div class="b4-item-hero" style="position:relative;">
                    <span class="b4-item-icon">${b4IconHTML(curr)}</span>
                    <div class="b4-item-name">${curr.name}</div>
                    <div class="b4-question-label">
                        ${questionLabel}
                        <button class="b-inline-replay" id="replay-speech-btn" title="重播語音">🔊</button>
                    </div>
                    ${diff === 'easy' ? `<div class="b4-easy-coin-hint">✋ 點擊金幣計算金額</div>` : `<div class="b4-hero-hint-wrap" id="b4-hero-hint-wrap">
                        <img src="../images/common/hint_detective.png" alt="" class="b4-hint-mascot" onerror="this.style.display='none'">
                        <button class="b4-hero-hint-btn" id="b4-hero-hint-btn">💡 提示</button>
                    </div>`}
                </div>
                <div class="b4-triple-grid" id="triple-grid">
                    ${cardsHTML}
                </div>
                <div id="diff-section"></div>
            </div>`;

            this._bindTripleEvents(curr, diff);
            this._bindIconClicks(curr);

            // 依難度揭露卡片
            if (diff === 'easy') {
                this._setupTripleEasyCoins(curr);
                if (this.state.settings.clickMode === 'on') {
                    Game.TimerManager.setTimeout(() => AssistClick.activate(curr, null), 300, 'ui');
                }
            } else if (diff === 'normal') {
                // 普通：金幣可點擊（同二商店 normal 模式）
                this._setupTripleNormalCoins(curr);
            } else {
                // 困難：金幣靜態顯示
                this._revealTripleCoinsOnly(curr);
            }

            // 語音引導（afterClose pattern）
            const storeNames = curr.stores.map(s => s.store).join('、');
            const prices = curr.stores.map(s => `${s.store}${toTWD(s.price)}`).join('，');
            const tripleText = diff === 'easy'
                ? `${prices}，哪家最便宜？`
                : `在${storeNames}，哪一家比較便宜？從最便宜到最貴依序輸入金額。`;
            this.state.quiz.lastSpeechText = `${curr.name}，${tripleText}`;
            this._showItemIntroModal(curr, () => {
                if (diff === 'hard') {
                    this._activateTripleHardCardInputs(curr);
                } else {
                    Game.Speech.speak(tripleText);
                }
            });
        },

        _bindTripleEvents(curr, diff) {
            // hero 提示鈕（三商店 select 頁）
            const heroHintBtn = document.getElementById('b4-hero-hint-btn');
            if (heroHintBtn) {
                Game.EventManager.on(heroHintBtn, 'click', () => {
                    // 揭露所有金額並高亮最便宜
                    this._revealTripleCardPrices(curr);
                    const hintCard = document.getElementById(`tcard-${curr.cheapestIdx}`);
                    if (hintCard) {
                        hintCard.classList.add('b4-select-hint');
                        Game.TimerManager.setTimeout(() => hintCard.classList.remove('b4-select-hint'), 2400, 'ui');
                    }
                    Game.Speech.speak(`提示：${curr.stores[curr.cheapestIdx].store}最便宜`);
                    if (diff === 'normal') {
                        // 普通模式：若輸入框已存在就填入答案，否則先顯示輸入框再填答案
                        Game.TimerManager.setTimeout(() => {
                            if (document.getElementById('b4-tpi-box1')) {
                                this.state._tripleHintFill?.();
                            } else {
                                this._showTriplePriceInputSection(curr, diff);
                                Game.TimerManager.setTimeout(() => {
                                    this.state._tripleHintFill?.();
                                }, 200, 'ui');
                            }
                        }, 800, 'ui');
                    } else if (diff === 'hard') {
                        // 困難模式：自動填入當前待輸入的卡片
                        Game.TimerManager.setTimeout(() => {
                            this.state._tripleHardCardHintFill?.();
                        }, 800, 'ui');
                    }
                }, {}, 'gameUI');
            }

            // 簡單/普通/困難模式卡片本身不可點選（改用金幣點擊或輸入框）

            // 導覽
            const backBtn = document.getElementById('back-to-settings');
            if (backBtn) Game.EventManager.on(backBtn, 'click', () => this.showSettings(), {}, 'gameUI');
            const rewardBtn = document.getElementById('reward-btn-g');
            if (rewardBtn) Game.EventManager.on(rewardBtn, 'click', () => {
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'gameUI');
            const replayBtn = document.getElementById('replay-speech-btn');
            if (replayBtn) Game.EventManager.on(replayBtn, 'click', () => {
                const text = this.state.quiz.lastSpeechText;
                if (text) Game.Speech.speak(text);
            }, {}, 'gameUI');

        },

        // ── 三商店普通模式：點幣後輸入三個金額 ────────────────────────
        _setupTripleNormalCoins(curr) {
            const storesData = curr.stores.map((store, idx) => ({
                store, idx,
                coins: this._getCoinsArray(store.price),
                clickedCount: 0,
                done: false
            }));

            storesData.forEach(data => {
                const card = document.getElementById(`tcard-${data.idx}`);
                const coinsEl = card?.querySelector('.b4-price-coins');
                const priceEl = card?.querySelector('.b4-price');
                if (!coinsEl) return;

                coinsEl.classList.remove('b4-price-coins-hidden');
                coinsEl.innerHTML = data.coins.map((d, i) => {
                    const isBill = d >= 100;
                    const w  = isBill ? '100px' : '60px';
                    const h  = isBill ? '48.91px' : '60px';
                    const br = isBill ? '4px' : '50%';
                    return `<span class="b4-coin-wrap" style="position:relative;display:inline-block;border-radius:${br};vertical-align:middle;">
                        <img src="../images/money/${d}_yuan_front.png"
                            data-cidx="${i}" data-cval="${d}" data-tidx="${data.idx}"
                            class="b4-easy-coin"
                            style="width:${w};height:${h};border-radius:${br};vertical-align:middle;object-fit:cover;cursor:pointer;transition:opacity 0.2s;"
                            draggable="false" onerror="this.style.display='none'">
                    </span>`;
                }).join('');

                if (priceEl) {
                    priceEl.classList.remove('b4-price-hidden');
                    priceEl.innerHTML = `0 <span class="b4-price-unit">元</span>`;
                }

                let runningTotal = 0;
                coinsEl.querySelectorAll('.b4-easy-coin').forEach(img => {
                    Game.EventManager.on(img, 'click', () => {
                        if (img.dataset.clicked || data.done) return;
                        img.dataset.clicked = '1';
                        img.style.opacity = '0.5';
                        const wrap = img.parentElement;
                        if (wrap?.classList.contains('b4-coin-wrap')) {
                            wrap.style.outline = '2.5px solid #10b981';
                            wrap.style.outlineOffset = '2px';
                            const ck = document.createElement('span');
                            ck.className = 'b4-coin-check';
                            ck.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#10b981;color:white;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;z-index:2;pointer-events:none;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,0.3);';
                            ck.textContent = '✓';
                            wrap.appendChild(ck);
                        }

                        runningTotal += parseInt(img.dataset.cval);
                        data.clickedCount++;
                        if (priceEl) priceEl.innerHTML = `${runningTotal} <span class="b4-price-unit">元</span>`;

                        const isLast = data.clickedCount >= data.coins.length;
                        if (isLast) {
                            data.done = true;
                            if (card) card.style.outline = '3px solid #10b981';
                            Game.Speech.speak(`${data.store.store}${runningTotal}元`, () => {
                                const allDone = storesData.every(d => d.done);
                                if (allDone) {
                                    Game.Speech.speak('請輸入最貴和最便宜的商品金額', () => {
                                        this._showTriplePriceInputSection(curr, this.state.settings.difficulty);
                                    });
                                }
                            });
                        } else {
                            Game.Speech.speak(`${runningTotal}元`);
                        }
                    }, {}, 'gameUI');
                });
            });
        },

        // ── 三商店簡單模式：點擊金幣計算金額後自動比較 ─────────────────
        _setupTripleEasyCoins(curr) {
            const storesData = curr.stores.map((store, idx) => ({
                store, idx,
                coins: this._getCoinsArray(store.price),
                clickedCount: 0, done: false
            }));

            storesData.forEach(data => {
                const card    = document.getElementById(`tcard-${data.idx}`);
                const coinsEl = card?.querySelector('.b4-price-coins');
                const priceEl = card?.querySelector('.b4-price');
                if (!coinsEl) return;

                coinsEl.classList.remove('b4-price-coins-hidden');
                coinsEl.innerHTML = data.coins.map((d, i) => {
                    const isBill = d >= 100;
                    const w  = isBill ? '100px' : '60px';
                    const h  = isBill ? '48.91px' : '60px';
                    const br = isBill ? '4px' : '50%';
                    return `<span class="b4-coin-wrap" style="position:relative;display:inline-block;border-radius:${br};vertical-align:middle;">
                        <img src="../images/money/${d}_yuan_front.png"
                            data-cidx="${i}" data-cval="${d}" data-tidx="${data.idx}"
                            class="b4-easy-coin"
                            style="width:${w};height:${h};border-radius:${br};vertical-align:middle;object-fit:cover;cursor:pointer;transition:opacity 0.2s;"
                            draggable="false" onerror="this.style.display='none'">
                    </span>`;
                }).join('');

                if (priceEl) {
                    priceEl.classList.remove('b4-price-hidden');
                    priceEl.innerHTML = `0 <span class="b4-price-unit">元</span>`;
                }

                let runningTotal = 0;
                coinsEl.querySelectorAll('.b4-easy-coin').forEach(img => {
                    Game.EventManager.on(img, 'click', () => {
                        if (img.dataset.clicked || data.done) return;
                        img.dataset.clicked = '1';
                        img.style.opacity = '0.5';
                        const wrap = img.parentElement;
                        if (wrap?.classList.contains('b4-coin-wrap')) {
                            wrap.style.outline = '2.5px solid #10b981';
                            wrap.style.outlineOffset = '2px';
                            const ck = document.createElement('span');
                            ck.className = 'b4-coin-check';
                            ck.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#10b981;color:white;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;z-index:2;pointer-events:none;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,0.3);';
                            ck.textContent = '✓';
                            wrap.appendChild(ck);
                        }
                        runningTotal += parseInt(img.dataset.cval);
                        data.clickedCount++;
                        if (priceEl) priceEl.innerHTML = `${runningTotal} <span class="b4-price-unit">元</span>`;

                        const isLast = data.clickedCount >= data.coins.length;
                        if (isLast) {
                            data.done = true;
                            if (card) card.style.outline = '3px solid #10b981';
                            Game.Speech.speak(`${runningTotal}元`, () => {
                                if (storesData.every(s => s.done)) {
                                    this._handleTripleEasyAllDone(curr);
                                }
                            });
                        } else {
                            Game.Speech.speak(`${runningTotal}元`);
                        }
                    }, {}, 'gameUI');
                });
            });
        },

        _handleTripleEasyAllDone(curr) {
            if (this.state.isProcessing) return;
            this.state.isProcessing = true;
            this._clearSelectHintTimer();

            this._revealTripleCardPrices(curr);
            const correctCard = document.getElementById(`tcard-${curr.cheapestIdx}`);
            if (correctCard) {
                correctCard.classList.add('selected-correct', 'b4-card-glow');
                correctCard.innerHTML += `<div class="b4-result-mark correct">✓</div>
                    <div class="b4-cheaper-tag">最便宜！</div>`;
            }
            curr.stores.forEach((_, i) => {
                if (i !== curr.cheapestIdx) {
                    const c = document.getElementById(`tcard-${i}`);
                    if (c) c.classList.add('selected-wrong');
                }
            });

            this.audio.play('correct');
            // correctCount 在 handleDiffAnswer 才計（避免雙重計分）
            const cheapest = curr.stores[curr.cheapestIdx];
            Game.Speech.speak(`${cheapest.store}最便宜！`, () => {
                Game.TimerManager.setTimeout(() => {
                    this.state.isProcessing = false;
                    this.state.phase = 'diff';
                    this.state.currentDiffItem = { ...curr, optA: curr.sortedAsc[2], optB: curr.sortedAsc[0] };
                    this._renderTripleDiffSection(curr, 'easy');
                }, 400, 'turnTransition');
            });
        },

        // ── 三商店：顯示兩個循序輸入框（最貴→最便宜）────────────────────
        _showTriplePriceInputSection(curr, diff) {
            const sortedPrices = curr.sortedAsc.map(s => s.price); // [cheapest, middle, most expensive]
            const expStore   = curr.sortedAsc[2]; // most expensive
            const cheapStore = curr.sortedAsc[0]; // cheapest
            const expPrice   = sortedPrices[2];
            const cheapPrice = sortedPrices[0];

            const section = document.getElementById('diff-section');
            if (!section) return;

            const expLabel   = `請輸入 ${expStore.store} 的商品價格（最貴）`;
            const cheapLabel = `請輸入 ${cheapStore.store} 的商品價格（最便宜）`;

            section.innerHTML = `
            <div class="b4-pi-card" id="b4-tpi-box1">
                <div class="b4-pi-label">${expLabel}</div>
                <div class="b4-input-display b4-pi-input-box" id="b4-tpi-display-1" style="cursor:pointer;" title="點我輸入">
                    <span id="b4-tpi-val-1">？</span><span class="b4-unit-text"> 元</span>
                </div>
                <div class="b4-pi-tap-hint">👆 點擊輸入</div>
            </div>
            <div class="b4-pi-card" id="b4-tpi-box2" style="display:none;">
                <div class="b4-pi-label">${cheapLabel}</div>
                <div class="b4-input-display b4-pi-input-box" id="b4-tpi-display-2" style="cursor:pointer;" title="點我輸入">
                    <span id="b4-tpi-val-2">？</span><span class="b4-unit-text"> 元</span>
                </div>
                <div class="b4-pi-tap-hint">👆 點擊輸入</div>
            </div>`;

            let tpiVal1 = '', tpiVal2 = '';

            // 提示鈕：橙色顯示兩個正確答案，3秒後消失
            const fillHint = () => {
                const showHint = (id, price) => {
                    const box = document.getElementById(id.replace('-val-', 'box'));
                    if (box) box.style.display = '';
                    const valEl = document.getElementById(id);
                    const dispEl = document.getElementById(id.replace('-val-', '-display-'));
                    if (valEl) { valEl.textContent = price; valEl.style.color = '#f59e0b'; }
                    if (dispEl) { dispEl.style.borderColor = '#f59e0b'; dispEl.style.background = '#fffbeb'; }
                };
                showHint('b4-tpi-val-1', expPrice);
                showHint('b4-tpi-val-2', cheapPrice);
                const box2 = document.getElementById('b4-tpi-box2');
                if (box2) box2.style.display = '';
                Game.TimerManager.setTimeout(() => {
                    ['1','2'].forEach(n => {
                        const valEl = document.getElementById(`b4-tpi-val-${n}`);
                        const dispEl = document.getElementById(`b4-tpi-display-${n}`);
                        if (valEl) { valEl.textContent = '？'; valEl.style.color = ''; }
                        if (dispEl) { dispEl.style.borderColor = ''; dispEl.style.background = ''; }
                    });
                }, 3000, 'ui');
            };
            this.state._tripleHintFill = fillHint;

            // ─── 進入 diff 段共用邏輯 ─────────────────────────────────
            const proceedToDiff = () => {
                this.audio.play('correct');
                this._showCenterFeedback('✅', '答對了！');
                this._revealTripleCardPrices(curr);
                curr.stores.forEach((store, i) => {
                    const card = document.getElementById(`tcard-${i}`);
                    if (!card) return;
                    if (i === curr.cheapestIdx) {
                        card.classList.add('selected-correct', 'b4-card-glow');
                        card.innerHTML += `<div class="b4-cheaper-tag">最便宜！</div>`;
                    } else if (i === curr.mostExpIdx) {
                        card.classList.add('selected-wrong');
                        card.innerHTML += `<div class="b4-exp-delta">最貴</div>`;
                    }
                });
                Game.Speech.speak(`答對了！${cheapStore.store}${cheapPrice}元最便宜`, () => {
                    this.state.isProcessing = false;
                    this.state.phase = 'diff';
                    this.state.currentDiffItem = { ...curr, optA: curr.sortedAsc[2], optB: curr.sortedAsc[0] };
                    this._renderTripleDiffSection(curr, diff);
                });
            };

            // ─── Box 2 numpad (cheapest price) ───────────────────────
            const openBox2 = () => {
                const prev = document.getElementById('b4-tpi-modal');
                if (prev) prev.remove();
                const overlay = document.createElement('div');
                overlay.id = 'b4-tpi-modal';
                overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);';
                overlay.innerHTML = `
                <div class="b4-pi-modal-card">
                    <button class="b4-modal-close-x" id="b4-tpi-m-x">✕</button>
                    <div class="b4-pi-modal-title">${cheapLabel}</div>
                    <div class="b4-input-display" id="b4-tpi-m-display">
                        <span id="b4-tpi-m-val">${tpiVal2 || '0'}</span><span class="b4-unit-text"> 元</span>
                    </div>
                    <div class="b4-numpad">
                        ${[7,8,9,4,5,6,1,2,3].map(n => `<button class="b4-numpad-btn" data-tpinum="${n}">${n}</button>`).join('')}
                        <button class="b4-numpad-btn btn-del" id="b4-tpi-m-del">⌫</button>
                        <button class="b4-numpad-btn" data-tpinum="0">0</button>
                        <button class="b4-numpad-btn btn-ok" id="b4-tpi-m-ok">✓</button>
                    </div>
                </div>`;
                document.body.appendChild(overlay);
                const updateM2 = () => { const el = document.getElementById('b4-tpi-m-val'); if (el) el.textContent = tpiVal2 || '0'; const v = document.getElementById('b4-tpi-val-2'); if (v) v.textContent = tpiVal2 || '？'; };
                overlay.querySelectorAll('[data-tpinum]').forEach(btn => { btn.addEventListener('click', e => { e.stopPropagation(); if (tpiVal2.length >= 5) return; tpiVal2 += btn.dataset.tpinum; updateM2(); }); });
                document.getElementById('b4-tpi-m-del').addEventListener('click', e => { e.stopPropagation(); tpiVal2 = tpiVal2.slice(0, -1); updateM2(); });
                document.getElementById('b4-tpi-m-x').addEventListener('click', e => { e.stopPropagation(); overlay.remove(); });
                document.getElementById('b4-tpi-m-ok').addEventListener('click', e => {
                    e.stopPropagation();
                    if (this.state.isProcessing) return;
                    const entered = parseInt(tpiVal2) || 0;
                    if (entered === 0) return;
                    this.state.isProcessing = true;
                    overlay.remove();
                    const v2 = document.getElementById('b4-tpi-val-2');
                    if (v2) v2.textContent = entered;
                    if (entered === cheapPrice) {
                        proceedToDiff();
                    } else {
                        this.audio.play('error');
                        const errMsg = (entered === expPrice)
                            ? `不對喔，${expStore.store}是最貴的，請輸入最便宜的`
                            : `不對喔，${cheapStore.store}是${cheapPrice}元，請再試一次`;
                        Game.Speech.speak(errMsg, () => {
                            Game.TimerManager.setTimeout(() => {
                                this.state.isProcessing = false;
                                tpiVal2 = '';
                                const v2r = document.getElementById('b4-tpi-val-2');
                                if (v2r) v2r.textContent = '？';
                            }, 400, 'ui');
                        });
                    }
                });
            };

            // ─── Box 1 numpad (most expensive price) ─────────────────
            const openBox1 = () => {
                const prev = document.getElementById('b4-tpi-modal');
                if (prev) prev.remove();
                const overlay = document.createElement('div');
                overlay.id = 'b4-tpi-modal';
                overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);';
                overlay.innerHTML = `
                <div class="b4-pi-modal-card">
                    <button class="b4-modal-close-x" id="b4-tpi-m-x">✕</button>
                    <div class="b4-pi-modal-title">${expLabel}</div>
                    <div class="b4-input-display" id="b4-tpi-m-display">
                        <span id="b4-tpi-m-val">${tpiVal1 || '0'}</span><span class="b4-unit-text"> 元</span>
                    </div>
                    <div class="b4-numpad">
                        ${[7,8,9,4,5,6,1,2,3].map(n => `<button class="b4-numpad-btn" data-tpinum="${n}">${n}</button>`).join('')}
                        <button class="b4-numpad-btn btn-del" id="b4-tpi-m-del">⌫</button>
                        <button class="b4-numpad-btn" data-tpinum="0">0</button>
                        <button class="b4-numpad-btn btn-ok" id="b4-tpi-m-ok">✓</button>
                    </div>
                </div>`;
                document.body.appendChild(overlay);
                const updateM1 = () => { const el = document.getElementById('b4-tpi-m-val'); if (el) el.textContent = tpiVal1 || '0'; const v = document.getElementById('b4-tpi-val-1'); if (v) v.textContent = tpiVal1 || '？'; };
                overlay.querySelectorAll('[data-tpinum]').forEach(btn => { btn.addEventListener('click', e => { e.stopPropagation(); if (tpiVal1.length >= 5) return; tpiVal1 += btn.dataset.tpinum; updateM1(); }); });
                document.getElementById('b4-tpi-m-del').addEventListener('click', e => { e.stopPropagation(); tpiVal1 = tpiVal1.slice(0, -1); updateM1(); });
                document.getElementById('b4-tpi-m-x').addEventListener('click', e => { e.stopPropagation(); overlay.remove(); });
                document.getElementById('b4-tpi-m-ok').addEventListener('click', e => {
                    e.stopPropagation();
                    if (this.state.isProcessing) return;
                    const entered = parseInt(tpiVal1) || 0;
                    if (entered === 0) return;
                    this.state.isProcessing = true;
                    overlay.remove();
                    const v1 = document.getElementById('b4-tpi-val-1');
                    if (v1) v1.textContent = entered;
                    if (entered === expPrice) {
                        this.audio.play('correct');
                        this._showCenterFeedback('✅', '答對了！');
                        Game.TimerManager.setTimeout(() => {
                            this.state.isProcessing = false;
                            const box2 = document.getElementById('b4-tpi-box2');
                            if (box2) box2.style.display = '';
                            Game.Speech.speak(cheapLabel);
                            Game.EventManager.on(document.getElementById('b4-tpi-display-2'), 'click', openBox2, {}, 'gameUI');
                        }, 500, 'ui');
                    } else {
                        this.audio.play('error');
                        const errMsg = (entered === cheapPrice)
                            ? `不對喔，${cheapStore.store}是最便宜的，請輸入最貴的`
                            : `不對喔，請再想想哪家最貴`;
                        Game.Speech.speak(errMsg, () => {
                            Game.TimerManager.setTimeout(() => {
                                this.state.isProcessing = false;
                                tpiVal1 = '';
                                const v1r = document.getElementById('b4-tpi-val-1');
                                if (v1r) v1r.textContent = '？';
                            }, 400, 'ui');
                        });
                    }
                });
            };

            Game.EventManager.on(document.getElementById('b4-tpi-display-1'), 'click', openBox1, {}, 'gameUI');
        },

        // easy/normal 模式：點選最便宜的那家
        _handleTripleSelectClick(isCorrect, clickedIdx, curr, diff) {
            this._revealTripleCardPrices(curr);
            const correctCard = document.getElementById(`tcard-${curr.cheapestIdx}`);
            const clickedCard = document.getElementById(`tcard-${clickedIdx}`);

            if (isCorrect) {
                this.audio.play('correct');
                this._showCenterFeedback('✅', '答對了！');
                if (correctCard) {
                    correctCard.classList.add('selected-correct');
                    correctCard.innerHTML += `<div class="b4-result-mark correct">✓</div>
                        <div class="b4-cheaper-tag">最便宜！</div>`;
                }
                if (diff === 'easy') {
                    // correctCount 在 handleDiffAnswer 才計（避免雙重計分）
                    Game.Speech.speak(`答對了！${curr.stores[curr.cheapestIdx].store}最便宜`, () => {
                        Game.TimerManager.setTimeout(() => {
                            this.state.isProcessing = false;
                            this.state.phase = 'diff';
                            this.state.currentDiffItem = { ...curr, optA: curr.sortedAsc[2], optB: curr.sortedAsc[0] };
                            this._renderTripleDiffSection(curr, 'easy');
                        }, 400, 'turnTransition');
                    });
                } else {
                    // normal：再問差額（最貴 - 最便宜）
                    Game.TimerManager.setTimeout(() => {
                        this.state.isProcessing = false;
                        this.state.phase = 'diff';
                        this.state.currentDiffItem = {
                            ...curr,
                            optA: curr.sortedAsc[2], // 最貴
                            optB: curr.sortedAsc[0], // 最便宜
                        };
                        this._renderTripleDiffSection(curr, diff);
                    }, 700, 'turnTransition');
                }
            } else {
                this.audio.play('error');
                if (clickedCard) clickedCard.classList.add('selected-wrong');
                if (correctCard) {
                    correctCard.classList.add('reveal-correct');
                    correctCard.innerHTML += `<div class="b4-cheaper-tag">這家才最便宜</div>`;
                }
                this.state.quiz.selectErrorCount++;
                    // 普通模式第 3 次錯誤：揭露金額數字
                    if (diff === 'normal' && this.state.quiz.selectErrorCount >= 3) {
                        this._revealTripleCardPrices(curr);
                    }
                    this._showCenterFeedback('❌', '再試一次！');
                    Game.Speech.speak('不對喔，請再比較看看');
                    Game.TimerManager.setTimeout(() => {
                        this.state.isProcessing = false;
                        curr.stores.forEach((_, i) => {
                            const c = document.getElementById(`tcard-${i}`);
                            if (c) c.classList.remove('selected-wrong', 'reveal-correct', 'selected-correct');
                            c?.querySelectorAll('.b4-result-mark,.b4-cheaper-tag')?.forEach(m => m.remove());
                        });
                    }, 1500, 'turnTransition');
            }
        },

        // hard 模式：依序點選（便宜→中間→最貴，F4 排序 pattern）
        _handleTripleRankClick(clickedIdx, curr, diff) {
            const order = this.state.tripleClickOrder;
            if (order.includes(clickedIdx)) return; // 已點過

            order.push(clickedIdx);
            const rankNum = order.length;
            const badge = document.getElementById(`badge-${clickedIdx}`);
            if (badge) {
                badge.textContent = rankNum === 1 ? '1️⃣' : rankNum === 2 ? '2️⃣' : '3️⃣';
                badge.style.display = 'flex';
            }
            const card = document.getElementById(`tcard-${clickedIdx}`);
            if (card) card.classList.add('b4-triple-clicked');

            Game.Speech.speak(`第${rankNum}個`);

            if (order.length === 3) {
                // 驗證：order[0]=cheapest, order[1]=middle, order[2]=mostExp
                this.state.isProcessing = true;
                this._revealTripleCardPrices(curr);
                const isCorrect = (order[0] === curr.cheapestIdx && order[1] === curr.middleIdx && order[2] === curr.mostExpIdx);

                Game.TimerManager.setTimeout(() => {
                    if (isCorrect) {
                        this.audio.play('correct');
                        this._showCenterFeedback('✅', '排序正確！');
                        // 顯示正確價格（原本隱藏）
                        curr.stores.forEach((store, i) => {
                            const priceEl = document.querySelector(`#tcard-${i} .b4-price-hidden`);
                            if (priceEl) {
                                priceEl.classList.remove('b4-price-hidden');
                                priceEl.innerHTML = `${store.price} <span class="b4-price-unit">元</span>`;
                            }
                            const coinsEl = document.querySelector(`#tcard-${i} .b4-price-coins-hidden`);
                            if (coinsEl) { coinsEl.classList.remove('b4-price-coins-hidden'); coinsEl.innerHTML = b4PriceCoins(store.price); }
                            document.getElementById(`tcard-${i}`)?.classList.add('selected-correct');
                        });
                        this.state.quiz.correctCount++;
                        this.state.quiz.totalSaved += curr.diff;
                        this.state.quiz.comparisonHistory.push({
                            name: curr.name, icon: curr.icon, imageUrl: curr.imageUrl, isTriple: true,
                            cheapStore: curr.sortedAsc[0].store, cheapPrice: curr.sortedAsc[0].price,
                            expStore: curr.sortedAsc[2].store,   expPrice:  curr.sortedAsc[2].price,
                            saved: curr.diff
                        });
                        this._showSavingsToast(curr.diff);
                        this._showPodiumAnimation(curr);
                        Game.Speech.speak(`排序正確！從${curr.sortedAsc[0].store}${toTWD(curr.sortedAsc[0].price)}到${curr.sortedAsc[2].store}${toTWD(curr.sortedAsc[2].price)}`, () => {
                            Game.TimerManager.setTimeout(() => this.nextQuestion(), 400, 'turnTransition');
                        });
                    } else {
                        this.audio.play('error');
                        // 顯示正確排序
                        curr.stores.forEach((store, i) => {
                            const card = document.getElementById(`tcard-${i}`);
                            const priceEl = card?.querySelector('.b4-price-hidden');
                            if (priceEl) {
                                priceEl.classList.remove('b4-price-hidden');
                                priceEl.innerHTML = `${store.price} <span class="b4-price-unit">元</span>`;
                            }
                            const coinsEl = card?.querySelector('.b4-price-coins-hidden');
                            if (coinsEl) { coinsEl.classList.remove('b4-price-coins-hidden'); coinsEl.innerHTML = b4PriceCoins(store.price); }
                        });
                        const correctOrder = [curr.cheapestIdx, curr.middleIdx, curr.mostExpIdx];
                        correctOrder.forEach((ci, rank) => {
                            const c = document.getElementById(`tcard-${ci}`);
                            if (c) c.classList.add('reveal-correct');
                            const b = document.getElementById(`badge-${ci}`);
                            if (b) b.textContent = rank === 0 ? '1️⃣' : rank === 1 ? '2️⃣' : '3️⃣';
                        });
                        this._showCenterFeedback('❌', '答錯了！');
                        Game.Speech.speak('不對喔，請看看正確的排序，再試一次！');
                            Game.TimerManager.setTimeout(() => {
                                this.state.isProcessing = false;
                                this.state.tripleClickOrder = [];
                                curr.stores.forEach((store, i) => {
                                    const c = document.getElementById(`tcard-${i}`);
                                    if (c) c.classList.remove('selected-wrong','reveal-correct','selected-correct','b4-triple-clicked');
                                    const priceEl = c?.querySelector('.b4-price');
                                    if (priceEl) {
                                        priceEl.classList.add('b4-price-hidden');
                                        priceEl.innerHTML = `? <span class="b4-price-unit">元</span>`;
                                    }
                                    const coinsEl = c?.querySelector('.b4-price-coins');
                                    if (coinsEl && diff !== 'hard') { coinsEl.classList.add('b4-price-coins-hidden'); coinsEl.innerHTML = ''; }
                                    const b = document.getElementById(`badge-${i}`);
                                    if (b) { b.textContent = ''; b.style.display = 'none'; }
                                });
                            }, 2200, 'turnTransition');
                    }
                }, 400, 'turnTransition');
            }
        },

        // 三商店差額頁（最貴 - 最便宜，同二商店 diff pattern）
        _renderTripleDiffSection(curr, diff) {
            Game.EventManager.removeByCategory('diffUI');
            Game.EventManager.removeByCategory('gameUI');

            const correctDiff    = curr.diff;
            const tripleExpOpt   = curr.sortedAsc[2];
            const tripleCheapOpt = curr.sortedAsc[0];
            const diffUnit       = '元';

            const formulaHTML = b4DiffFormula(
                `${tripleExpOpt.storeIcon} ${tripleExpOpt.store}`, tripleExpOpt.price,
                `${tripleCheapOpt.storeIcon} ${tripleCheapOpt.store}`, tripleCheapOpt.price,
                correctDiff);

            const maxP = curr.sortedAsc[2].price;
            const barsHTML = `
            <div class="b4-price-bars">
                ${curr.sortedAsc.map(s => {
                    const pct = Math.round(s.price / maxP * 100);
                    const colorClass = s.price === maxP ? 'b4-pbar-high' : s.price === curr.sortedAsc[0].price ? 'b4-pbar-low' : 'b4-pbar-mid';
                    return `<div class="b4-pbar-row">
                        <div class="b4-pbar-store-hd">
                            <span class="b4-pbar-store-icon-lg">${s.storeIcon}</span>
                            <span class="b4-pbar-store-name-lg">${s.store}</span>
                        </div>
                        <div class="b4-pbar-money-row">
                            <div class="b4-pbar-coins">${b4PriceCoinsBar(s.price)}</div>
                            <span class="b4-pbar-price">${s.price} 元</span>
                        </div>
                        <div class="b4-pbar-track"><div class="b4-pbar-fill ${colorClass}" style="width:${pct}%"></div></div>
                    </div>`;
                }).join('')}
            </div>`;

            const hintWrap = `<div class="b4-hero-hint-wrap" id="b4-hero-hint-wrap">
                <img src="../images/common/hint_detective.png" alt="" class="b4-hint-mascot" onerror="this.style.display='none'">
                <button class="b4-hero-hint-btn" id="b4-hero-hint-btn">💡 提示</button>
            </div>`;

            const refCardHTML = `
            <div class="b4-ref-card-wrap">
                <div class="b4-diff-ref-card">
                    <span class="b4-diff-ref-icon">${b4IconHTML(curr)}</span>
                    <div class="b4-diff-ref-info">
                        <span class="b4-diff-ref-name">${curr.name}</span>
                    </div>
                </div>
                <div class="b4-diff-ref-cheap">✅ ${curr.sortedAsc[0].storeIcon} ${curr.sortedAsc[0].store} 最便宜</div>
            </div>`;

            // 三商店折疊長條圖（普通/困難差額頁用）— 預設隱藏，按鈕展開
            const collapsibleBarsHTML = `
            <button class="b4-tsp-toggle" id="b4-tsp-toggle">📋 查看各家價格</button>
            <div id="b4-tsp-panel" style="display:none;">${barsHTML}</div>`;

            const app = document.getElementById('app');

            if (diff === 'easy') {
                // 簡單：拖曳金幣到「便宜了多少錢」區（同二商店 easy diff 拖曳模式）
                const diffCoins = this._getCoinsArray(correctDiff);
                const trayHtml = diffCoins.map((d, i) => {
                    const isBill = d >= 100;
                    const w = isBill ? 80 : 52;
                    return `<div class="b4-diff-denom-card" draggable="true" data-cidx="${i}" data-cval="${d}" title="${d}元">
                        <img src="../images/money/${d}_yuan_front.png" alt="${d}元"
                             class="${isBill ? 'banknote-img' : 'coin-img'}"
                             style="width:${w}px;height:${isBill ? 'auto' : w+'px'};display:block;"
                             draggable="false" onerror="this.style.display='none'">
                        <span class="b1-denom-label">${d}元</span>
                    </div>`;
                }).join('');

                app.innerHTML = `
                ${this._renderHeader()}
                <div class="b-game-wrap">
                    <div class="b4-item-hero" style="position:relative;">${refCardHTML}</div>
                    <div class="b4-diff-section">
                        <div class="b4-diff-zone-card">
                            <div class="b4-diff-zone-title">💰 總共便宜是多少錢？</div>
                            <div class="b4-easy-drop-zone b4-diff-drop-zone" id="b4-diff-drop-zone">
                                <div id="b4-diff-placed-coins" style="display:flex;flex-wrap:wrap;gap:8px;width:100%;align-items:flex-end;min-height:60px;justify-content:center;">
                                    <span class="b4-diff-zone-hint">拖曳正確的金額數字</span>
                                </div>
                            </div>
                            <div id="b4-diff-total" style="text-align:center;font-size:18px;font-weight:700;color:#16a34a;margin-top:8px;min-height:24px;"></div>
                        </div>
                        <div class="b4-diff-tray-card">
                            <div class="b4-diff-tray-label">👆 拖曳金幣到上方</div>
                            <div class="b4-diff-tray" id="b4-diff-tray">${trayHtml}</div>
                        </div>
                    </div>
                </div>`;

                const hintSlots = diffCoins.map(d => ({ denom: d, filled: false }));

                const renderDropZone = () => {
                    const zone = document.getElementById('b4-diff-placed-coins');
                    if (!zone) return;
                    zone.innerHTML = '';
                    hintSlots.forEach(slot => {
                        const isBill = slot.denom >= 100;
                        const w = isBill ? 80 : 52;
                        const div = document.createElement('div');
                        div.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;';
                        if (slot.filled) {
                            div.innerHTML = `<img src="../images/money/${slot.denom}_yuan_front.png" alt="${slot.denom}元"
                                style="width:${w}px;height:${isBill ? 'auto' : w+'px'};" draggable="false" onerror="this.style.display='none'">
                                <span class="b1-denom-label">${slot.denom}元</span>`;
                        } else {
                            div.innerHTML = `<img src="../images/money/${slot.denom}_yuan_front.png" alt="${slot.denom}元"
                                style="width:${w}px;height:${isBill ? 'auto' : w+'px'};opacity:0.3;" draggable="false" onerror="this.style.display='none'">
                                <span class="b1-denom-label" style="opacity:0.3;">${slot.denom}元</span>`;
                        }
                        zone.appendChild(div);
                    });
                };
                renderDropZone();

                const updateTrayHintsT = () => {
                    const needed = {};
                    hintSlots.filter(s => !s.filled).forEach(s => { needed[s.denom] = (needed[s.denom] || 0) + 1; });
                    document.querySelectorAll('.b4-diff-denom-card').forEach(card => {
                        card.classList.toggle('b4-diff-here-hint', !!needed[parseInt(card.dataset.cval)]);
                    });
                };
                updateTrayHintsT();

                const handleDropT = (coinIdx) => {
                    const card = document.querySelector(`.b4-diff-denom-card[data-cidx="${coinIdx}"]:not([data-placed])`);
                    if (!card || this.state.isProcessing) return;
                    const denom = parseInt(card.dataset.cval);
                    const slotIdx = hintSlots.findIndex(s => s.denom === denom && !s.filled);
                    if (slotIdx === -1) { this.audio.play('error'); return; }
                    card.dataset.placed = '1';
                    card.style.opacity = '0.4';
                    card.draggable = false;
                    hintSlots[slotIdx].filled = true;
                    renderDropZone();
                    updateTrayHintsT();
                    this.audio.play('coin');
                    const runningTotal = hintSlots.filter(s => s.filled).reduce((sum, s) => sum + s.denom, 0);
                    const totalEl = document.getElementById('b4-diff-total');
                    if (totalEl) totalEl.textContent = `${runningTotal} 元`;

                    if (hintSlots.every(s => s.filled)) {
                        this.state.isProcessing = true;
                        Game.Speech.speak(`${runningTotal}元`, () => {
                            this.state.isProcessing = false;
                            Game.TimerManager.setTimeout(() => {
                                if (this.state.isProcessing) return;
                                this.state.isProcessing = true;
                                this.audio.play('correct');
                                this.state.quiz.totalSaved += correctDiff;
                                this.state.quiz.comparisonHistory.push({
                                    name: curr.name, icon: curr.icon, imageUrl: curr.imageUrl, cat: curr.cat || 'other',
                                    cheapStore: tripleCheapOpt.store, cheapPrice: tripleCheapOpt.price,
                                    expStore:   tripleExpOpt.store,   expPrice:   tripleExpOpt.price,
                                    saved: correctDiff
                                });
                                this._showSavingsToast(correctDiff);
                                Game.Speech.speak(`${tripleCheapOpt.store}便宜了${correctDiff}元`, () => {
                                    Game.TimerManager.setTimeout(() => this.nextQuestion(), 400, 'turnTransition');
                                });
                            }, 300, 'ui');
                        });
                    } else {
                        Game.Speech.speak(`${runningTotal}元`);
                    }
                };
                this.state._diffHandleDrop = handleDropT;

                const trayElT = document.getElementById('b4-diff-tray');
                const dropZoneElT = document.getElementById('b4-diff-drop-zone');

                // Desktop drag
                trayElT?.querySelectorAll('.b4-diff-denom-card').forEach(card => {
                    Game.EventManager.on(card, 'dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', `b4diff:${card.dataset.cidx}`);
                        card.classList.add('b4-coin-dragging');
                    }, {}, 'diffUI');
                    Game.EventManager.on(card, 'dragend', () => card.classList.remove('b4-coin-dragging'), {}, 'diffUI');
                });
                if (dropZoneElT) {
                    Game.EventManager.on(dropZoneElT, 'dragover', (e) => { e.preventDefault(); dropZoneElT.classList.add('b4-drop-active'); }, {}, 'diffUI');
                    Game.EventManager.on(dropZoneElT, 'dragleave', () => dropZoneElT.classList.remove('b4-drop-active'), {}, 'diffUI');
                    Game.EventManager.on(dropZoneElT, 'drop', (e) => {
                        e.preventDefault(); dropZoneElT.classList.remove('b4-drop-active');
                        const d = e.dataTransfer.getData('text/plain');
                        if (d.startsWith('b4diff:')) handleDropT(parseInt(d.replace('b4diff:', '')));
                    }, {}, 'diffUI');
                }

                // Touch drag
                trayElT?.querySelectorAll('.b4-diff-denom-card').forEach(card => {
                    let ghostElT = null;
                    Game.EventManager.on(card, 'touchstart', (e) => {
                        if (card.dataset.placed) return;
                        const t = e.touches[0];
                        ghostElT = card.cloneNode(true);
                        ghostElT.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.8;transform:scale(1.05);left:${t.clientX - 35}px;top:${t.clientY - 50}px;`;
                        document.body.appendChild(ghostElT);
                    }, { passive: true }, 'diffUI');
                    Game.EventManager.on(card, 'touchmove', (e) => {
                        if (!ghostElT) return;
                        e.preventDefault();
                        const t = e.touches[0];
                        ghostElT.style.left = (t.clientX - 35) + 'px';
                        ghostElT.style.top  = (t.clientY - 50) + 'px';
                        if (dropZoneElT) {
                            const r = dropZoneElT.getBoundingClientRect();
                            dropZoneElT.classList.toggle('b4-drop-active',
                                t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom);
                        }
                    }, { passive: false }, 'diffUI');
                    Game.EventManager.on(card, 'touchend', (e) => {
                        if (ghostElT) { ghostElT.remove(); ghostElT = null; }
                        if (dropZoneElT) dropZoneElT.classList.remove('b4-drop-active');
                        if (card.dataset.placed) return;
                        const t = e.changedTouches[0];
                        const r = dropZoneElT?.getBoundingClientRect();
                        if (r && t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
                            handleDropT(parseInt(card.dataset.cidx));
                        }
                    }, { passive: true }, 'diffUI');
                });

                const backBtnTE = document.getElementById('back-to-settings');
                if (backBtnTE) Game.EventManager.on(backBtnTE, 'click', () => this.showSettings(), {}, 'diffUI');
                const rewardBtnTE = document.getElementById('reward-btn-g');
                if (rewardBtnTE) Game.EventManager.on(rewardBtnTE, 'click', () => {
                    if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                    else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                }, {}, 'diffUI');
                Game.Speech.speak(`${tripleExpOpt.store}${tripleExpOpt.price}元，${tripleCheapOpt.store}${tripleCheapOpt.price}元，${tripleCheapOpt.store}便宜了多少元？請放置正確的金額`);
                return;

            } else if (diff === 'normal') {
                // 普通：同二商店 normal — 遮蔽選項 → handleDiffAnswer
                const options = this._getDiffOptions(correctDiff);
                app.innerHTML = `
                ${this._renderHeader()}
                <div class="b-game-wrap">
                    <div class="b4-item-hero" style="position:relative;">
                        ${refCardHTML}
                        ${hintWrap}
                    </div>
                    <div class="b4-diff-section b4-diff-normal-card">
                        ${collapsibleBarsHTML}
                        ${formulaHTML}
                        <div class="b4-diff-question b4-diff-question-below">
                            便宜了${correctDiff}元
                            <div class="b4-diff-sub">點選正確的差額</div>
                        </div>
                    </div>
                    <div class="b4-diff-section b4-diff-options-card">
                        <div class="b4-diff-options">
                            ${options.map(val => `
                            <button class="b4-diff-opt b4-diff-opt-masked" data-val="${val}">
                                <div class="b4-diff-opt-coins">${b4PriceCoins(val)}</div>
                                <span class="b4-diff-opt-label">？？？</span>
                            </button>`).join('')}
                        </div>
                    </div>
                </div>`;

                // 點擊選項（正確：永久顯示；錯誤：顯示金額並保留選項）
                document.querySelectorAll('.b4-diff-opt').forEach(btn => {
                    Game.EventManager.on(btn, 'click', () => {
                        if (this.state.isProcessing) return;
                        this.state.isProcessing = true;
                        const chosen    = parseInt(btn.dataset.val);
                        const isCorrect = (chosen === correctDiff);
                        const label = btn.querySelector('.b4-diff-opt-label');
                        if (label) { label.textContent = `${chosen} ${diffUnit}`; label.style.visibility = 'visible'; }
                        btn.classList.remove('b4-diff-opt-masked');
                        btn.classList.add(isCorrect ? 'correct-ans' : 'wrong-ans');
                        if (isCorrect) {
                            this.handleDiffAnswer(true, correctDiff);
                        } else {
                            this.audio.play('error');
                            this._showCenterFeedback('❌', '再試一次！');
                            this.state.quiz.diffErrorCount = (this.state.quiz.diffErrorCount || 0) + 1;
                            const revealNow = this.state.quiz.diffErrorCount >= 3;
                            if (revealNow) {
                                this._showDiffFormulaHint();
                                Game.Speech.speak(`不對喔，差額是${correctDiff}元，請再試一次`);
                            } else {
                                Game.Speech.speak(`不對喔，再想想看`);
                            }
                            Game.TimerManager.setTimeout(() => {
                                this.state.isProcessing = false;
                                if (revealNow) {
                                    const correctBtn = document.querySelector(`.b4-diff-opt[data-val="${correctDiff}"]`);
                                    if (correctBtn) {
                                        const cl = correctBtn.querySelector('.b4-diff-opt-label');
                                        if (cl) { cl.textContent = `${correctDiff} ${diffUnit}`; cl.style.visibility = 'visible'; }
                                        correctBtn.classList.remove('b4-diff-opt-masked');
                                        correctBtn.classList.add('b4-select-hint');
                                        Game.TimerManager.setTimeout(() => correctBtn.classList.remove('b4-select-hint'), 2400, 'ui');
                                    }
                                }
                            }, 1500, 'ui');
                        }
                    }, {}, 'diffUI');
                });

                // 提示鈕
                const heroHintBtnN = document.getElementById('b4-hero-hint-btn');
                if (heroHintBtnN) {
                    Game.EventManager.on(heroHintBtnN, 'click', () => {
                        this._revealNormalDiffOptions(options, correctDiff, diffUnit);
                        const correctBtn = document.querySelector(`.b4-diff-opt[data-val="${correctDiff}"]`);
                        if (correctBtn) {
                            correctBtn.classList.add('b4-select-hint');
                            Game.TimerManager.setTimeout(() => correctBtn.classList.remove('b4-select-hint'), 2400, 'ui');
                        }
                        Game.Speech.speak('請依提示選擇正確的答案');
                    }, {}, 'diffUI');
                }

                Game.Speech.speak(`${tripleExpOpt.store}${tripleExpOpt.price}元，${tripleCheapOpt.store}${tripleCheapOpt.price}元，便宜了${correctDiff}元，請選擇正確的答案`);

            } else {
                // 困難：點擊？？？輸入差額，答對後顯示拖曳放幣區
                const hardFormulaHTML = b4DiffFormula(
                    `${tripleExpOpt.storeIcon} ${tripleExpOpt.store}`, tripleExpOpt.price,
                    `${tripleCheapOpt.storeIcon} ${tripleCheapOpt.store}`, tripleCheapOpt.price,
                    correctDiff, null, true);
                app.innerHTML = `
                ${this._renderHeader()}
                <div class="b-game-wrap">
                    <div class="b4-item-hero" style="position:relative;">
                        ${refCardHTML}
                        ${hintWrap}
                    </div>
                    <div class="b4-diff-section b4-diff-normal-card" id="b4-hard-diff-card">
                        <div class="b4-tsp-toggle-row">
                            <button class="b4-tsp-toggle" id="b4-tsp-toggle">📋 查看各家價格</button>
                        </div>
                        <div id="b4-tsp-panel" style="display:none;">${barsHTML}</div>
                        <div class="b4-formula-calc-row">
                            ${hardFormulaHTML}
                            <button id="b4-calc-toggle" class="b4-calc-toggle-inline b4-calc-toggle-side" title="計算機">🧮</button>
                        </div>
                    </div>
                    <div id="b4-calc-panel" class="b4-calc-panel-float" style="display:none;">
                        ${this._getB4CalculatorHTML()}
                    </div>
                    <div id="b4-hd-drag-section" style="display:none;">
                        ${this._renderHardDiffDragHTML()}
                    </div>
                </div>`;
                this._bindB4Calculator();
                Game.TimerManager.setTimeout(() => {
                    const unknownCell = document.querySelector('.b4-dff-unknown');
                    if (unknownCell) {
                        Game.EventManager.on(unknownCell, 'click', () => {
                            if (this.state.isProcessing) return;
                            this._showHardDiffNumpadModal(correctDiff, diffUnit, () => {
                                Game.Speech.speak('請拿出正確的金額', () => {
                                    const dragSection = document.getElementById('b4-hd-drag-section');
                                    if (dragSection) dragSection.style.display = '';
                                    this._bindHardDiffDragDrop(correctDiff, diffUnit);
                                });
                            });
                        }, {}, 'diffUI');
                    }
                }, 50, 'ui');

                // 提示鈕
                const heroHintBtnH = document.getElementById('b4-hero-hint-btn');
                if (heroHintBtnH) {
                    Game.EventManager.on(heroHintBtnH, 'click', () => {
                        this._showHardDiffFormulaHint(
                            { ...curr, optA: tripleExpOpt, optB: tripleCheapOpt },
                            tripleExpOpt, tripleCheapOpt, correctDiff, diffUnit
                        );
                        this.state._hdSpeakOnDrop = true;
                        const hdTot = document.getElementById('b4-hd-wallet-total');
                        if (hdTot) hdTot.style.visibility = 'visible';
                    }, {}, 'diffUI');
                }

                Game.Speech.speak(`${tripleExpOpt.store}${tripleExpOpt.price}元，${tripleCheapOpt.store}${tripleCheapOpt.price}元，點擊問號框輸入正確的差額`);
            }

            // 三商店參考面板折疊按鈕
            const tspToggle = document.getElementById('b4-tsp-toggle');
            const tspPanel  = document.getElementById('b4-tsp-panel');
            if (tspToggle && tspPanel) {
                Game.EventManager.on(tspToggle, 'click', () => {
                    const open = tspPanel.style.display === 'none';
                    tspPanel.style.display = open ? '' : 'none';
                    tspToggle.classList.toggle('b4-tsp-open', open);
                }, {}, 'diffUI');
            }

            // 導覽按鈕（共用）
            const backBtn = document.getElementById('back-to-settings');
            if (backBtn) Game.EventManager.on(backBtn, 'click', () => this.showSettings(), {}, 'diffUI');
            const rewardBtn = document.getElementById('reward-btn-g');
            if (rewardBtn) Game.EventManager.on(rewardBtn, 'click', () => {
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'diffUI');
        },

        // ── Diff Phase ─────────────────────────────────────────
        // ── 視覺價差比例條（F5 量比較 pattern）─────────────────────
        _renderPriceBars(curr) {
            const maxP = Math.max(curr.optA.price, curr.optB.price);
            const pctA = Math.round(curr.optA.price / maxP * 100);
            const pctB = Math.round(curr.optB.price / maxP * 100);
            // 加上差距百分比標籤（Round 36）
            const diffPct = maxP > 0 ? Math.round((maxP - Math.min(curr.optA.price, curr.optB.price)) / maxP * 100) : 0;
            const mkRow = (opt, pct, cls) => `
            <div class="b4-pbar-row">
                <div class="b4-pbar-store-hd">
                    <span class="b4-pbar-store-icon-lg">${opt.storeIcon}</span>
                    <span class="b4-pbar-store-name-lg">${opt.store}</span>
                </div>
                <div class="b4-pbar-money-row">
                    <div class="b4-pbar-coins">${b4PriceCoinsBar(opt.price)}</div>
                    <span class="b4-pbar-price">${opt.price} 元</span>
                </div>
                <div class="b4-pbar-track">
                    <div class="b4-pbar-fill ${cls}" style="width:${pct}%"></div>
                </div>
            </div>`;
            return `
            <div class="b4-price-bars">
                ${mkRow(curr.optA, pctA, 'b4-pbar-high')}
                ${mkRow(curr.optB, pctB, 'b4-pbar-low')}
                ${diffPct > 0 ? `<div class="b4-pbar-diff-pct">便宜了 ${diffPct}%</div>` : ''}
            </div>`;
        },

        _renderDiffSection(curr, diff) {
            Game.EventManager.removeByCategory('diffUI');
            Game.EventManager.removeByCategory('gameUI');

            const correctDiff = curr.diff;
            const barsHTML    = this._renderPriceBars(curr);
            const diffQuestion = `便宜了多少元？`;
            const diffUnit     = `元`;
            const hintWrap = `<div class="b4-hero-hint-wrap" id="b4-hero-hint-wrap">
                <img src="../images/common/hint_detective.png" alt="" class="b4-hint-mascot" onerror="this.style.display='none'">
                <button class="b4-hero-hint-btn" id="b4-hero-hint-btn">💡 提示</button>
            </div>`;

            const cheapOpt = curr.optA.price < curr.optB.price ? curr.optA : curr.optB;
            const expOpt   = curr.optA.price >= curr.optB.price ? curr.optA : curr.optB;
            const formulaHTML = b4DiffFormula(`${expOpt.storeIcon} ${expOpt.store}`, expOpt.price, `${cheapOpt.storeIcon} ${cheapOpt.store}`, cheapOpt.price, correctDiff);

            const refCardHTML = `
            <div class="b4-ref-card-wrap">
                <div class="b4-diff-ref-card">
                    <span class="b4-diff-ref-icon">${b4IconHTML(curr)}</span>
                    <div class="b4-diff-ref-info">
                        <span class="b4-diff-ref-name">${curr.name}</span>
                    </div>
                </div>
                <div class="b4-diff-ref-cheap">✅ ${cheapOpt.storeIcon} ${cheapOpt.store} 比較便宜</div>
            </div>`;

            // 兩商店折疊長條圖（預設隱藏）
            const collapsibleBarsHTML = `
            <button class="b4-tsp-toggle" id="b4-tsp-toggle">📋 查看各家價格</button>
            <div id="b4-tsp-panel" style="display:none;">${barsHTML}</div>`;

            const app = document.getElementById('app');

            if (diff === 'easy') {
                // 簡單：拖曳金幣到「便宜了多少錢」區（B1 wallet pattern）
                {
                    const diffCoins = this._getCoinsArray(correctDiff);
                    const trayHtml = diffCoins.map((d, i) => {
                        const isBill = d >= 100;
                        const w = isBill ? 80 : 52;
                        return `<div class="b4-diff-denom-card" draggable="true" data-cidx="${i}" data-cval="${d}" title="${d}元">
                            <img src="../images/money/${d}_yuan_front.png" alt="${d}元"
                                 class="${isBill ? 'banknote-img' : 'coin-img'}"
                                 style="width:${w}px;height:${isBill ? 'auto' : w+'px'};display:block;"
                                 draggable="false" onerror="this.style.display='none'">
                            <span class="b1-denom-label">${d}元</span>
                        </div>`;
                    }).join('');

                    app.innerHTML = `
                    ${this._renderHeader()}
                    <div class="b-game-wrap">
                        <div class="b4-item-hero" style="position:relative;">${refCardHTML}</div>
                        <div class="b4-diff-section">
                            <div class="b4-diff-zone-card">
                                <div class="b4-diff-zone-title">💰 總共便宜是多少錢？</div>
                                <div class="b4-easy-drop-zone b4-diff-drop-zone" id="b4-diff-drop-zone">
                                    <div id="b4-diff-placed-coins" style="display:flex;flex-wrap:wrap;gap:8px;width:100%;align-items:flex-end;min-height:60px;justify-content:center;">
                                        <span class="b4-diff-zone-hint">拖曳正確的金額數字</span>
                                    </div>
                                </div>
                                <div id="b4-diff-total" style="text-align:center;font-size:18px;font-weight:700;color:#16a34a;margin-top:8px;min-height:24px;"></div>
                            </div>
                            <div class="b4-diff-tray-card">
                                <div class="b4-diff-tray-label">👆 拖曳金幣到上方</div>
                                <div class="b4-diff-tray" id="b4-diff-tray">${trayHtml}</div>
                            </div>
                        </div>
                    </div>`;

                    const hintSlots = diffCoins.map(d => ({ denom: d, filled: false }));

                    const renderDropZone = () => {
                        const zone = document.getElementById('b4-diff-placed-coins');
                        if (!zone) return;
                        zone.innerHTML = '';
                        hintSlots.forEach(slot => {
                            const isBill = slot.denom >= 100;
                            const w = isBill ? 80 : 52;
                            const div = document.createElement('div');
                            div.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;';
                            if (slot.filled) {
                                div.innerHTML = `<img src="../images/money/${slot.denom}_yuan_front.png" alt="${slot.denom}元"
                                    style="width:${w}px;height:${isBill ? 'auto' : w+'px'};" draggable="false" onerror="this.style.display='none'">
                                    <span class="b1-denom-label">${slot.denom}元</span>`;
                            } else {
                                div.innerHTML = `<img src="../images/money/${slot.denom}_yuan_front.png" alt="${slot.denom}元"
                                    style="width:${w}px;height:${isBill ? 'auto' : w+'px'};opacity:0.3;" draggable="false" onerror="this.style.display='none'">
                                    <span class="b1-denom-label" style="opacity:0.3;">${slot.denom}元</span>`;
                            }
                            zone.appendChild(div);
                        });
                    };
                    renderDropZone();

                    const updateTrayHints = () => {
                        const needed = {};
                        hintSlots.filter(s => !s.filled).forEach(s => { needed[s.denom] = (needed[s.denom] || 0) + 1; });
                        document.querySelectorAll('.b4-diff-denom-card').forEach(card => {
                            card.classList.toggle('b4-diff-here-hint', !!needed[parseInt(card.dataset.cval)]);
                        });
                    };
                    updateTrayHints();

                    const handleDrop = (coinIdx) => {
                        const card = document.querySelector(`.b4-diff-denom-card[data-cidx="${coinIdx}"]:not([data-placed])`);
                        if (!card || this.state.isProcessing) return;
                        const denom = parseInt(card.dataset.cval);
                        const slotIdx = hintSlots.findIndex(s => s.denom === denom && !s.filled);
                        if (slotIdx === -1) { this.audio.play('error'); return; }
                        card.dataset.placed = '1';
                        card.style.display = 'none';
                        card.draggable = false;
                        hintSlots[slotIdx].filled = true;
                        renderDropZone();
                        updateTrayHints();
                        this.audio.play('coin');
                        const runningTotal = hintSlots.filter(s => s.filled).reduce((sum, s) => sum + s.denom, 0);
                        const totalEl = document.getElementById('b4-diff-total');
                        if (totalEl) totalEl.textContent = `${runningTotal} ${diffUnit}`;

                        if (hintSlots.every(s => s.filled)) {
                            this.state.isProcessing = true;
                            Game.Speech.speak(`${runningTotal}元`, () => {
                                this.state.isProcessing = false;
                                Game.TimerManager.setTimeout(() => {
                                    if (this.state.isProcessing) return;
                                    this.state.isProcessing = true;
                                    this.audio.play('correct');
                                    this.state.quiz.totalSaved += correctDiff;
                                    const ci = this.state.currentDiffItem;
                                    if (ci) this.state.quiz.comparisonHistory.push({
                                        name: ci.name, icon: ci.icon, imageUrl: ci.imageUrl, cat: ci.cat || 'other',
                                        cheapStore: cheapOpt.store, cheapPrice: cheapOpt.price,
                                        expStore: expOpt.store, expPrice: expOpt.price,
                                        saved: correctDiff
                                    });
                                    Game.Speech.speak(`便宜了${correctDiff}元`, () => {
                                        Game.TimerManager.setTimeout(() => this.nextQuestion(), 800, 'turnTransition');
                                    });
                                }, 300, 'ui');
                            });
                        } else {
                            Game.Speech.speak(`${runningTotal}元`);
                        }
                    };

                    this.state._diffHandleDrop = handleDrop;

                    const trayEl2 = document.getElementById('b4-diff-tray');
                    const dropZoneEl = document.getElementById('b4-diff-drop-zone');

                    // Desktop drag
                    trayEl2?.querySelectorAll('.b4-diff-denom-card').forEach(card => {
                        Game.EventManager.on(card, 'dragstart', (e) => {
                            e.dataTransfer.setData('text/plain', `b4diff:${card.dataset.cidx}`);
                            card.classList.add('b4-coin-dragging');
                        }, {}, 'diffUI');
                        Game.EventManager.on(card, 'dragend', () => card.classList.remove('b4-coin-dragging'), {}, 'diffUI');
                    });
                    if (dropZoneEl) {
                        Game.EventManager.on(dropZoneEl, 'dragover', (e) => { e.preventDefault(); dropZoneEl.classList.add('b4-drop-active'); }, {}, 'diffUI');
                        Game.EventManager.on(dropZoneEl, 'dragleave', () => dropZoneEl.classList.remove('b4-drop-active'), {}, 'diffUI');
                        Game.EventManager.on(dropZoneEl, 'drop', (e) => {
                            e.preventDefault(); dropZoneEl.classList.remove('b4-drop-active');
                            const d = e.dataTransfer.getData('text/plain');
                            if (d.startsWith('b4diff:')) handleDrop(parseInt(d.replace('b4diff:', '')));
                        }, {}, 'diffUI');
                    }

                    // Touch drag
                    trayEl2?.querySelectorAll('.b4-diff-denom-card').forEach(card => {
                        let ghostEl = null;
                        Game.EventManager.on(card, 'touchstart', (e) => {
                            if (card.dataset.placed) return;
                            const t = e.touches[0];
                            ghostEl = card.cloneNode(true);
                            ghostEl.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.8;transform:scale(1.05);left:${t.clientX - 35}px;top:${t.clientY - 50}px;`;
                            document.body.appendChild(ghostEl);
                        }, { passive: true }, 'diffUI');
                        Game.EventManager.on(card, 'touchmove', (e) => {
                            if (!ghostEl) return;
                            e.preventDefault();
                            const t = e.touches[0];
                            ghostEl.style.left = (t.clientX - 35) + 'px';
                            ghostEl.style.top  = (t.clientY - 50) + 'px';
                            if (dropZoneEl) {
                                const r = dropZoneEl.getBoundingClientRect();
                                dropZoneEl.classList.toggle('b4-drop-active',
                                    t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom);
                            }
                        }, { passive: false }, 'diffUI');
                        Game.EventManager.on(card, 'touchend', (e) => {
                            if (ghostEl) { ghostEl.remove(); ghostEl = null; }
                            if (dropZoneEl) dropZoneEl.classList.remove('b4-drop-active');
                            if (card.dataset.placed) return;
                            const t = e.changedTouches[0];
                            const r = dropZoneEl?.getBoundingClientRect();
                            if (r && t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
                                handleDrop(parseInt(card.dataset.cidx));
                            }
                        }, { passive: true }, 'diffUI');
                    });

                    // 進入頁面語音
                    Game.Speech.speak(`${curr.name}，${expOpt.store}${expOpt.price}元，${cheapOpt.store}${cheapOpt.price}元，便宜了多少元？請放置正確的金額`);
                }  // end easy drag-drop block

                const backBtnE = document.getElementById('back-to-settings');
                if (backBtnE) Game.EventManager.on(backBtnE, 'click', () => this.showSettings(), {}, 'diffUI');
                const rewardBtnE = document.getElementById('reward-btn-g');
                if (rewardBtnE) Game.EventManager.on(rewardBtnE, 'click', () => {
                    if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                    else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
                }, {}, 'diffUI');
                return;

            } else if (diff === 'normal') {
                const options = this._getDiffOptions(correctDiff);
                app.innerHTML = `
                ${this._renderHeader()}
                <div class="b-game-wrap">
                    <div class="b4-item-hero" style="position:relative;">
                        ${refCardHTML}
                        ${hintWrap}
                    </div>
                    <div class="b4-diff-section b4-diff-normal-card">
                        ${collapsibleBarsHTML}
                        ${formulaHTML}
                        <div class="b4-diff-question b4-diff-question-below">
                            ${diffQuestion}
                            <div class="b4-diff-sub">點選正確的差額</div>
                        </div>
                    </div>
                    <div class="b4-diff-section b4-diff-options-card">
                        <div class="b4-diff-options">
                            ${options.map(val => `
                            <button class="b4-diff-opt b4-diff-opt-masked" data-val="${val}">
                                <div class="b4-diff-opt-coins">${b4PriceCoins(val)}</div>
                                <span class="b4-diff-opt-label">？？？</span>
                            </button>`).join('')}
                        </div>
                    </div>
                </div>`;

                // 選項按鈕事件（點擊錯誤：顯示金額並保留選項；點擊正確：揭露所有並前進）
                document.querySelectorAll('.b4-diff-opt').forEach(btn => {
                    Game.EventManager.on(btn, 'click', () => {
                        if (this.state.isProcessing) return;
                        this.state.isProcessing = true;
                        const chosen    = parseInt(btn.dataset.val);
                        const isCorrect = (chosen === correctDiff);
                        if (isCorrect) {
                            // 正確：揭露所有選項，標記正確，前進
                            this._revealNormalDiffOptions(options, correctDiff, diffUnit);
                            btn.classList.add('correct-ans');
                            this.handleDiffAnswer(true, correctDiff);
                        } else {
                            // 錯誤：顯示被點選金額，選項保留不消失
                            const label = btn.querySelector('.b4-diff-opt-label');
                            if (label) { label.textContent = `${chosen} ${diffUnit}`; label.style.visibility = 'visible'; }
                            btn.classList.remove('b4-diff-opt-masked');
                            btn.classList.add('wrong-ans');
                            this.audio.play('error');
                            this._showCenterFeedback('❌', '再試一次！');
                            this.state.quiz.diffErrorCount = (this.state.quiz.diffErrorCount || 0) + 1;
                            const revealNow = this.state.quiz.diffErrorCount >= 3;
                            if (revealNow) {
                                this._showDiffFormulaHint();
                                Game.Speech.speak(`不對喔，差額是${correctDiff}元，請再試一次`);
                            } else {
                                Game.Speech.speak(`不對喔，再想想看`);
                            }
                            Game.TimerManager.setTimeout(() => {
                                this.state.isProcessing = false;
                                if (revealNow) {
                                    const correctBtn = document.querySelector(`.b4-diff-opt[data-val="${correctDiff}"]`);
                                    if (correctBtn) {
                                        const cl = correctBtn.querySelector('.b4-diff-opt-label');
                                        if (cl) { cl.textContent = `${correctDiff} ${diffUnit}`; cl.style.visibility = 'visible'; }
                                        correctBtn.classList.remove('b4-diff-opt-masked');
                                        correctBtn.classList.add('b4-select-hint');
                                        Game.TimerManager.setTimeout(() => correctBtn.classList.remove('b4-select-hint'), 2400, 'ui');
                                    }
                                }
                            }, 1500, 'ui');
                        }
                    }, {}, 'diffUI');
                });

            } else {
                // 困難：點擊？？？輸入差額，答對後顯示拖曳放幣區
                const hardFormulaHTML = b4DiffFormula(`${expOpt.storeIcon} ${expOpt.store}`, expOpt.price, `${cheapOpt.storeIcon} ${cheapOpt.store}`, cheapOpt.price, correctDiff, null, true);
                app.innerHTML = `
                ${this._renderHeader()}
                <div class="b-game-wrap">
                    <div class="b4-item-hero" style="position:relative;">
                        ${refCardHTML}
                        ${hintWrap}
                    </div>
                    <div class="b4-diff-section b4-diff-normal-card" id="b4-hard-diff-card">
                        <div class="b4-tsp-toggle-row">
                            <button class="b4-tsp-toggle" id="b4-tsp-toggle">📋 查看各家價格</button>
                        </div>
                        <div id="b4-tsp-panel" style="display:none;">${barsHTML}</div>
                        <div class="b4-formula-calc-row">
                            ${hardFormulaHTML}
                            <button id="b4-calc-toggle" class="b4-calc-toggle-inline b4-calc-toggle-side" title="計算機">🧮</button>
                        </div>
                    </div>
                    <div id="b4-calc-panel" class="b4-calc-panel-float" style="display:none;">
                        ${this._getB4CalculatorHTML()}
                    </div>
                    <div id="b4-hd-drag-section" style="display:none;">
                        ${this._renderHardDiffDragHTML()}
                    </div>
                </div>`;
                this._bindB4Calculator();
                Game.TimerManager.setTimeout(() => {
                    const unknownCell = document.querySelector('.b4-dff-unknown');
                    if (unknownCell) {
                        Game.EventManager.on(unknownCell, 'click', () => {
                            if (this.state.isProcessing) return;
                            this._showHardDiffNumpadModal(correctDiff, diffUnit, () => {
                                Game.Speech.speak('請拿出正確的金額', () => {
                                    const dragSection = document.getElementById('b4-hd-drag-section');
                                    if (dragSection) dragSection.style.display = '';
                                    this._bindHardDiffDragDrop(correctDiff, diffUnit);
                                });
                            });
                        }, {}, 'diffUI');
                    }
                }, 50, 'ui');
            }

            // 兩商店折疊長條圖（三模式共用）
            const tspToggle2 = document.getElementById('b4-tsp-toggle');
            const tspPanel2  = document.getElementById('b4-tsp-panel');
            if (tspToggle2 && tspPanel2) {
                Game.EventManager.on(tspToggle2, 'click', () => {
                    const open = tspPanel2.style.display === 'none';
                    tspPanel2.style.display = open ? '' : 'none';
                    tspToggle2.classList.toggle('b4-tsp-open', open);
                }, {}, 'diffUI');
            }

            // 提示鈕（diff 頁面）
            const heroHintBtn = document.getElementById('b4-hero-hint-btn');
            if (heroHintBtn) {
                Game.EventManager.on(heroHintBtn, 'click', () => {
                    if (diff === 'hard') {
                        this._showHardDiffFormulaHint(curr, expOpt, cheapOpt, correctDiff, diffUnit);
                        this.state._hdSpeakOnDrop = true;
                        const hdTot = document.getElementById('b4-hd-wallet-total');
                        if (hdTot) hdTot.style.visibility = 'visible';
                    } else if (diff === 'normal') {
                        // 普通：揭露所有選項金額 + 高亮正確 + 語音
                        const options = this._getDiffOptions(correctDiff);
                        this._revealNormalDiffOptions(options, correctDiff, diffUnit);
                        const correctBtn = document.querySelector(`.b4-diff-opt[data-val="${correctDiff}"]`);
                        if (correctBtn) {
                            correctBtn.classList.add('b4-select-hint');
                            Game.TimerManager.setTimeout(() => correctBtn.classList.remove('b4-select-hint'), 2400, 'ui');
                        }
                        Game.Speech.speak('請依提示選擇正確的答案');
                    } else {
                        this._showDiffFormulaHint();
                        const hintSpeech = `${expOpt.store}${expOpt.price}元，${cheapOpt.store}${cheapOpt.price}元，兩者差多少元？`;
                        Game.Speech.speak(hintSpeech);
                    }
                }, {}, 'diffUI');
            }

            // 導覽按鈕
            const backBtn = document.getElementById('back-to-settings');
            if (backBtn) Game.EventManager.on(backBtn, 'click', () => this.showSettings(), {}, 'diffUI');
            const rewardBtn = document.getElementById('reward-btn-g');
            if (rewardBtn) Game.EventManager.on(rewardBtn, 'click', () => {
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'diffUI');

            // 語音
            let diffSpeech;
            if (diff === 'easy') {
                diffSpeech = `${curr.name}，${expOpt.store}${expOpt.price}元，${cheapOpt.store}${cheapOpt.price}元，請選擇正確的答案`;
            } else if (diff === 'normal') {
                diffSpeech = `${curr.name}，${expOpt.store}${expOpt.price}元，${cheapOpt.store}${cheapOpt.price}元，${cheapOpt.store}便宜了${correctDiff}元，請選擇正確的答案`;
            } else {
                diffSpeech = `${expOpt.store}${expOpt.price}元，${cheapOpt.store}${cheapOpt.price}元，點擊問號框輸入正確的差額`;
            }
            Game.Speech.speak(diffSpeech);
        },

        // ── 商品/商店圖示點擊放大播音 ──────────────────────────────
        _bindIconClicks(curr) {
            // 商品圖示
            const iconWrap = document.querySelector('.b4-item-icon');
            if (iconWrap) {
                iconWrap.style.cursor = 'pointer';
                Game.EventManager.on(iconWrap, 'click', () => {
                    Game.Speech.speak(curr.name);
                    const imgEl = iconWrap.querySelector('img');
                    this._showB4ZoomModal(imgEl ? imgEl.src : null, curr.icon, curr.name);
                }, {}, 'gameUI');
            }
            // 商店圖示
            document.querySelectorAll('.b4-store-icon').forEach(el => {
                const card = el.closest('[id^="card-"],[id^="tcard-"]');
                const storeName = card?.querySelector('.b4-store-name')?.textContent?.trim();
                if (!storeName) return;
                el.style.cursor = 'pointer';
                const imgEl = el.querySelector('img');
                Game.EventManager.on(el, 'click', (e) => {
                    e.stopPropagation();
                    Game.Speech.speak(storeName);
                    document.getElementById('b4-store-zoom-overlay')?.remove();
                    const zOverlay = document.createElement('div');
                    zOverlay.id = 'b4-store-zoom-overlay';
                    zOverlay.innerHTML = `<div class="b4-szoom-card"><img src="${imgEl ? imgEl.src : ''}" alt="${storeName}" class="b4-szoom-img"><div class="b4-szoom-name">${storeName}</div></div>`;
                    zOverlay.addEventListener('click', () => zOverlay.remove());
                    document.body.appendChild(zOverlay);
                }, {}, 'gameUI');
            });
        },

        _showB4ZoomModal(imageUrl, fallbackEmoji, name) {
            document.getElementById('b4-zoom-modal')?.remove();
            const overlay = document.createElement('div');
            overlay.id = 'b4-zoom-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10300;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);cursor:pointer;';
            const imgHtml = imageUrl
                ? `<img src="${imageUrl}" alt="${name}" style="max-width:220px;max-height:220px;object-fit:contain;display:block;margin:0 auto 12px;" onerror="this.style.display='none'">`
                : `<div style="font-size:72px;text-align:center;margin-bottom:12px;">${fallbackEmoji || ''}</div>`;
            overlay.innerHTML = `<div style="background:#fff;border-radius:20px;padding:24px 28px;text-align:center;max-width:80vw;box-shadow:0 8px 32px rgba(0,0,0,0.3);">${imgHtml}<div style="font-size:20px;font-weight:700;color:#1f2937;">${name}</div><div style="font-size:13px;color:#6b7280;margin-top:4px;">點任意處關閉</div></div>`;
            document.body.appendChild(overlay);
            overlay.addEventListener('click', () => overlay.remove());
        },

        // ── 商店卡片價格輸入彈窗（hard mode page 1）────────────────────
        _openCardPriceNumpad(title, correctPrice, unit, onCorrect) {
            const prev = document.getElementById('b4-cpi-modal');
            if (prev) prev.remove();
            let val = '';
            const overlay = document.createElement('div');
            overlay.id = 'b4-cpi-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);';
            overlay.innerHTML = `
            <div class="b4-pi-modal-card" onclick="event.stopPropagation()">
                <button class="b4-modal-close-x" id="b4-cpi-x">✕</button>
                <div class="b4-pi-modal-title">${title}</div>
                <div class="b4-input-display" id="b4-cpi-display">
                    <span id="b4-cpi-val">0</span><span class="b4-unit-text"> ${unit}</span>
                </div>
                <div class="b4-numpad">
                    ${[7,8,9,4,5,6,1,2,3].map(n => `<button class="b4-numpad-btn" data-cpin="${n}">${n}</button>`).join('')}
                    <button class="b4-numpad-btn btn-del" id="b4-cpi-del">⌫</button>
                    <button class="b4-numpad-btn" data-cpin="0">0</button>
                    <button class="b4-numpad-btn btn-ok" id="b4-cpi-ok">✓</button>
                </div>
            </div>`;
            document.body.appendChild(overlay);
            const updateDisp = () => { const el = document.getElementById('b4-cpi-val'); if (el) el.textContent = val || '0'; };
            overlay.querySelectorAll('[data-cpin]').forEach(btn => { btn.addEventListener('click', e => { e.stopPropagation(); if (val.length >= 5) return; val += btn.dataset.cpin; updateDisp(); }); });
            document.getElementById('b4-cpi-del')?.addEventListener('click', e => { e.stopPropagation(); val = val.slice(0, -1); updateDisp(); });
            document.getElementById('b4-cpi-x')?.addEventListener('click', e => { e.stopPropagation(); overlay.remove(); });
            document.getElementById('b4-cpi-ok')?.addEventListener('click', e => {
                e.stopPropagation();
                if (this.state.isProcessing) return;
                const entered = parseInt(val) || 0;
                if (entered === 0) return;
                this.state.isProcessing = true;
                overlay.remove();
                if (entered === correctPrice) {
                    this.audio.play('correct');
                    this._showCenterFeedback('✅', '答對了！');
                    Game.TimerManager.setTimeout(() => { this.state.isProcessing = false; onCorrect(); }, 500, 'ui');
                } else {
                    this.audio.play('error');
                    Game.Speech.speak('不對喔，請再想想', () => {
                        Game.TimerManager.setTimeout(() => { this.state.isProcessing = false; val = ''; }, 400, 'ui');
                    });
                }
            });
        },

        // ── 困難第一頁：在商店卡片中平行輸入價格（2-store）────────────
        _activateHardCardInputs(curr, left, right, correctSide) {
            const cheapOpt  = correctSide === 'left' ? left : right;
            const cheapSide = correctSide;
            const unit      = '元';
            const section   = document.getElementById('diff-section');

            const setPrompt = (html) => {
                if (section) section.innerHTML = `<div class="b4-pi-prompt-below">👆 ${html}</div>`;
            };

            const filled = { left: false, right: false };

            const checkAllFilled = () => {
                if (!filled.left || !filled.right) return;
                this.state._hardCardHintFill = null;
                const title = `${curr.name}最便宜的價格是多少？`;
                const promptText = `請輸入${curr.name}最便宜的價格是多少錢`;

                if (section) section.innerHTML = `
                <div class="b4-pi-card">
                    <div class="b4-pi-label">${title}</div>
                    <div class="b4-input-display b4-pi-input-box" id="b4-pic-cheap-display" style="cursor:pointer;" title="點我輸入">
                        <span id="b4-pic-cheap-val">？</span><span class="b4-unit-text"> ${unit}</span>
                    </div>
                    <div class="b4-pi-tap-hint">👆 點擊輸入</div>
                </div>`;

                Game.Speech.speak(promptText);

                const onCheapCorrect = () => {
                    if (section) section.innerHTML = '';
                    this._revealCardPrices(left, right);
                    const correctCard = document.getElementById(`card-${cheapSide}`);
                    const delta = Math.abs(left.price - right.price);
                    if (correctCard) {
                        correctCard.classList.add('selected-correct', 'b4-card-glow');
                        const savingsTag = (delta > 0) ? `<div class="b4-card-savings-amount">省了 ${delta} 元</div>` : '';
                        correctCard.innerHTML += `<div class="b4-result-mark correct">✓</div>${savingsTag}<div class="b4-cheaper-tag">比較便宜！</div>`;
                    }
                    const wrongSide = correctSide === 'left' ? 'right' : 'left';
                    const wrongCard = document.getElementById(`card-${wrongSide}`);
                    if (wrongCard) { wrongCard.classList.add('selected-wrong'); wrongCard.innerHTML += `<div class="b4-exp-delta">比較貴</div>`; }
                    const speech = `答對了！${cheapOpt.store}${cheapOpt.price}元，比較便宜`;
                    Game.Speech.speak(speech, () => {
                        this.state.phase = 'diff';
                        this.state.currentDiffItem = curr;
                        this._renderDiffSection(curr, 'hard');
                    });
                };

                const cheapDisplayBox = document.getElementById('b4-pic-cheap-display');
                if (cheapDisplayBox) {
                    Game.EventManager.on(cheapDisplayBox, 'click', () => {
                        this._openCardPriceNumpad(title, cheapOpt.price, unit, onCheapCorrect);
                    }, {}, 'gameUI');
                }
            };

            const activateCard = (side, opt, price) => {
                const btn = document.getElementById(`b4-pic-${side}`);
                if (!btn) return;
                btn.disabled = false;
                btn.classList.add('b4-pic-active');
                const openNumpad = () => {
                    if (this.state.isProcessing) return;
                    const title = `請輸入 ${opt.store} 的商品價格`;
                    this._openCardPriceNumpad(title, price, unit, () => {
                        const priceEl = document.querySelector(`#card-${side} .b4-price`);
                        if (priceEl) priceEl.innerHTML = `${price} <span class="b4-price-unit">元</span>`;
                        btn.disabled = true;
                        btn.classList.remove('b4-pic-active');
                        filled[side] = true;
                        Game.Speech.speak(`答對，${price}元`, () => { checkAllFilled(); });
                    });
                };
                Game.EventManager.on(btn, 'click', openNumpad, {}, 'gameUI');
            };

            // Hint: fill all unfilled cards then proceed
            this.state._hardCardHintFill = () => {
                ['left', 'right'].forEach(side => {
                    if (!filled[side]) {
                        const opt = side === 'left' ? left : right;
                        const priceEl = document.querySelector(`#card-${side} .b4-price`);
                        if (priceEl) priceEl.innerHTML = `${opt.price} <span class="b4-price-unit">元</span>`;
                        const btn = document.getElementById(`b4-pic-${side}`);
                        if (btn) { btn.disabled = true; btn.classList.remove('b4-pic-active'); }
                        filled[side] = true;
                    }
                });
                checkAllFilled();
            };

            // Activate both cards at once
            activateCard('left', left, left.price);
            activateCard('right', right, right.price);
            setPrompt('請點擊各商店的價格框，輸入商品金額');
            Game.Speech.speak('請輸入各商店的商品價格');
        },

        // ── 困難第一頁：在商店卡片中平行輸入價格（3-store）────────────
        _activateTripleHardCardInputs(curr) {
            const cheapStore = curr.sortedAsc[0];
            const section    = document.getElementById('diff-section');

            const setPrompt = (html) => {
                if (section) section.innerHTML = `<div class="b4-pi-prompt-below">👆 ${html}</div>`;
            };

            const filled = {};
            curr.stores.forEach((_, i) => { filled[i] = false; });

            const checkAllFilled = () => {
                if (!curr.stores.every((_, i) => filled[i])) return;
                this.state._tripleHardCardHintFill = null;
                const tTitle = `請輸入${curr.name}最便宜的價格`;
                const tPromptText = `請輸入${curr.name}最便宜的價格`;

                if (section) section.innerHTML = `
                <div class="b4-pi-card">
                    <div class="b4-pi-label">${tTitle}</div>
                    <div class="b4-input-display b4-pi-input-box" id="b4-tpic-cheap-display" style="cursor:pointer;" title="點我輸入">
                        <span id="b4-tpic-cheap-val">？</span><span class="b4-unit-text"> 元</span>
                    </div>
                    <div class="b4-pi-tap-hint">👆 點擊輸入</div>
                </div>`;

                Game.Speech.speak(tPromptText);

                const onTripleCheapCorrect = () => {
                    if (section) section.innerHTML = '';
                    this._revealTripleCardPrices(curr);
                    const cheapIdx2 = curr.stores.findIndex(s => s === cheapStore);
                    const cheapCard = document.getElementById(`tcard-${cheapIdx2}`);
                    if (cheapCard) {
                        cheapCard.classList.add('selected-correct', 'b4-card-glow');
                        cheapCard.innerHTML += `<div class="b4-result-mark correct">✓</div><div class="b4-cheaper-tag">最便宜！</div>`;
                    }
                    Game.Speech.speak(`答對了！${cheapStore.store}${cheapStore.price}元，最便宜`, () => {
                        this.state.phase = 'diff';
                        this.state.currentDiffItem = { ...curr, optA: curr.sortedAsc[2], optB: curr.sortedAsc[0] };
                        this._renderTripleDiffSection(curr, 'hard');
                    });
                };

                const tCheapDisplayBox = document.getElementById('b4-tpic-cheap-display');
                if (tCheapDisplayBox) {
                    Game.EventManager.on(tCheapDisplayBox, 'click', () => {
                        this._openCardPriceNumpad(tTitle, cheapStore.price, '元', onTripleCheapCorrect);
                    }, {}, 'gameUI');
                }
            };

            const activateCard = (idx, store, price) => {
                const btn = document.getElementById(`b4-tpic-${idx}`);
                if (!btn) return;
                btn.disabled = false;
                btn.classList.add('b4-pic-active');
                const openNumpad = () => {
                    if (this.state.isProcessing) return;
                    this._openCardPriceNumpad(`請輸入 ${store.store} 的商品價格`, price, '元', () => {
                        const priceEl = document.querySelector(`#tcard-${idx} .b4-price`);
                        if (priceEl) priceEl.innerHTML = `${price} <span class="b4-price-unit">元</span>`;
                        btn.disabled = true;
                        btn.classList.remove('b4-pic-active');
                        filled[idx] = true;
                        Game.Speech.speak(`答對，${price}元`, () => { checkAllFilled(); });
                    });
                };
                Game.EventManager.on(btn, 'click', openNumpad, {}, 'gameUI');
            };

            // Hint: fill all unfilled cards then proceed
            this.state._tripleHardCardHintFill = () => {
                curr.stores.forEach((store, idx) => {
                    if (!filled[idx]) {
                        const priceEl = document.querySelector(`#tcard-${idx} .b4-price`);
                        if (priceEl) priceEl.innerHTML = `${store.price} <span class="b4-price-unit">元</span>`;
                        const btn = document.getElementById(`b4-tpic-${idx}`);
                        if (btn) { btn.disabled = true; btn.classList.remove('b4-pic-active'); }
                        filled[idx] = true;
                    }
                });
                checkAllFilled();
            };

            // Activate all cards at once
            curr.stores.forEach((store, idx) => activateCard(idx, store, store.price));
            setPrompt('請點擊各商店的價格框，輸入商品金額');
            Game.Speech.speak(`請輸入各商店${curr.name}的商品價格`);
        },

        _updateNumpadDisplay() {
            const el = document.getElementById('numpad-val');
            if (el) el.textContent = this.state.numpadValue || '0';
        },

        // ── 困難模式差額拖曳區 HTML ──────────────────────────────────
        _renderHardDiffDragHTML() {
            const trayDenoms = [1, 5, 10, 50, 100, 500];
            const trayHtml = trayDenoms.map(d => {
                const isBill = d >= 100;
                const w = isBill ? 80 : 52;
                const face = Math.random() < 0.5 ? 'back' : 'front';
                return `<div class="b4-hd-coin-drag" draggable="true" data-denom="${d}" title="${d}元">
                    <img src="../images/money/${d}_yuan_${face}.png" alt="${d}元"
                         class="${isBill ? 'banknote-img' : 'coin-img'}"
                         style="width:${w}px;height:${isBill ? 'auto' : w+'px'};"
                         draggable="false" onerror="this.style.display='none'">
                    <span class="b1-denom-label">${d}元</span>
                </div>`;
            }).join('');
            return `
            <div class="b4-hd-wallet-area" id="b4-hd-wallet-area">
                <div class="b4-hd-wallet-header">
                    <span class="b4-hd-header-spacer"></span>
                    <span class="b4-hd-wallet-title">便宜了多少元</span>
                    <span class="b4-hd-wallet-total" id="b4-hd-wallet-total" style="visibility:hidden;">已放 0 元</span>
                </div>
                <div class="b4-hd-drop-zone" id="b4-hd-drop-zone">
                    <div id="b4-hd-placed-coins" style="display:flex;flex-wrap:wrap;gap:8px;width:100%;align-items:flex-end;min-height:60px;justify-content:center;">
                        <span class="b4-diff-zone-hint">把代表差額的錢幣拖曳到這裡</span>
                    </div>
                </div>
                <div style="display:flex;justify-content:center;gap:12px;margin-top:10px;">
                    <button class="b4-hd-clear-btn" id="b4-hd-clear-btn">🗑️ 清空</button>
                    <button class="b4-hd-confirm-btn" id="b4-hd-confirm-btn">✅ 確認差額</button>
                </div>
            </div>
            <div class="b4-hd-tray-card" id="b4-hd-tray-card">
                <div class="b4-diff-tray-label">💰 金錢拖曳區（可重複拖曳）</div>
                <div class="b4-hd-tray-coins">${trayHtml}</div>
            </div>`;
        },

        // ── 困難模式差額拖曳事件綁定 ─────────────────────────────────
        _bindHardDiffDragDrop(correctDiff, diffUnit) {
            const hdWallet = [];
            let hdUid = 0;
            this.state._hdSpeakOnDrop = false;

            const removeByUid = (uid) => {
                if (this.state.isProcessing) return;
                const idx = hdWallet.findIndex(c => c.uid === uid);
                if (idx !== -1) { hdWallet.splice(idx, 1); updateHdDisplay(); this.audio.play('coin'); }
            };

            const updateHdDisplay = () => {
                const total = hdWallet.reduce((s, c) => s + c.denom, 0);
                const totalEl = document.getElementById('b4-hd-wallet-total');
                if (totalEl) {
                    totalEl.textContent = `已放 ${total} 元`;
                    if (this.state._hdSpeakOnDrop) totalEl.style.visibility = 'visible';
                }
                const placed = document.getElementById('b4-hd-placed-coins');
                if (!placed) return;
                if (hdWallet.length === 0) {
                    placed.innerHTML = '<span class="b4-diff-zone-hint">把代表差額的錢幣拖曳到這裡</span>';
                    return;
                }
                placed.innerHTML = '';
                hdWallet.forEach(coin => {
                    const isBill = coin.denom >= 100;
                    const w = isBill ? 80 : 52;
                    const div = document.createElement('div');
                    div.className = 'b4-hd-placed-coin';
                    div.dataset.uid = String(coin.uid);
                    div.dataset.denom = String(coin.denom);
                    div.draggable = true;
                    div.innerHTML = `
                        <button class="b4-hd-remove-x" data-uid="${coin.uid}">✕</button>
                        <img src="../images/money/${coin.denom}_yuan_front.png" alt="${coin.denom}元"
                            style="width:${w}px;height:${isBill ? 'auto' : w+'px'};" draggable="false" onerror="this.style.display='none'">
                        <span class="b1-denom-label">${coin.denom}元</span>`;
                    // × button
                    div.querySelector('.b4-hd-remove-x').addEventListener('click', (e) => {
                        e.stopPropagation();
                        removeByUid(coin.uid);
                    });
                    // desktop drag-back to tray
                    div.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', `b4hd-placed:${coin.uid}`);
                        div.classList.add('b4-coin-dragging');
                    });
                    div.addEventListener('dragend', () => div.classList.remove('b4-coin-dragging'));
                    // touch drag-back to tray
                    let placedGhost = null;
                    div.addEventListener('touchstart', (e) => {
                        const t = e.touches[0];
                        placedGhost = div.cloneNode(true);
                        placedGhost.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.8;transform:scale(1.05);left:${t.clientX-35}px;top:${t.clientY-50}px;`;
                        document.body.appendChild(placedGhost);
                    }, { passive: true });
                    div.addEventListener('touchmove', (e) => {
                        if (!placedGhost) return;
                        e.preventDefault();
                        const t = e.touches[0];
                        placedGhost.style.left = (t.clientX - 35) + 'px';
                        placedGhost.style.top  = (t.clientY - 50) + 'px';
                        const tray = document.getElementById('b4-hd-tray-card');
                        if (tray) {
                            const r = tray.getBoundingClientRect();
                            tray.classList.toggle('b4-drop-active',
                                t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom);
                        }
                    }, { passive: false });
                    div.addEventListener('touchend', (e) => {
                        if (placedGhost) { placedGhost.remove(); placedGhost = null; }
                        const tray = document.getElementById('b4-hd-tray-card');
                        if (tray) tray.classList.remove('b4-drop-active');
                        const t = e.changedTouches[0];
                        const r = tray?.getBoundingClientRect();
                        if (r && t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
                            removeByUid(coin.uid);
                        }
                    }, { passive: true });
                    placed.appendChild(div);
                });
            };

            const addHdCoin = (denom) => {
                if (this.state.isProcessing) return;
                hdWallet.push({ denom, uid: ++hdUid });
                this.audio.play('coin');
                const total = hdWallet.reduce((s, c) => s + c.denom, 0);
                if (this.state._hdSpeakOnDrop) Game.Speech.speak(toTWD(total));
                updateHdDisplay();
            };

            const confirmHd = () => {
                if (this.state.isProcessing) return;
                const total = hdWallet.reduce((s, c) => s + c.denom, 0);
                if (total === 0) { Game.Speech.speak('請先放入金錢'); return; }
                this.state.isProcessing = true;
                this.state.numpadValue = String(total);
                if (total === correctDiff) {
                    const diffCard = document.getElementById('b4-hard-diff-card');
                    if (diffCard) {
                        const unknownEl = diffCard.querySelector('.b4-dff-unknown');
                        if (unknownEl) {
                            unknownEl.textContent = `${correctDiff} ${diffUnit}`;
                            unknownEl.classList.remove('b4-dff-unknown');
                            unknownEl.style.color = '#16a34a';
                            unknownEl.style.fontWeight = '700';
                        }
                    }
                    this.handleDiffAnswer(true, correctDiff);
                } else {
                    this.handleDiffAnswer(false, correctDiff);
                    Game.TimerManager.setTimeout(() => {
                        hdWallet.length = 0;
                        updateHdDisplay();
                    }, 1800, 'ui');
                }
            };

            const dropZoneEl = document.getElementById('b4-hd-drop-zone');
            const trayCardEl = document.getElementById('b4-hd-tray-card');

            // desktop drag from tray to wallet zone
            document.querySelectorAll('.b4-hd-coin-drag').forEach(card => {
                Game.EventManager.on(card, 'dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', `b4hd:${card.dataset.denom}`);
                    card.classList.add('b4-coin-dragging');
                }, {}, 'diffUI');
                Game.EventManager.on(card, 'dragend', () => card.classList.remove('b4-coin-dragging'), {}, 'diffUI');
            });
            if (dropZoneEl) {
                Game.EventManager.on(dropZoneEl, 'dragover', (e) => { e.preventDefault(); dropZoneEl.classList.add('b4-drop-active'); }, {}, 'diffUI');
                Game.EventManager.on(dropZoneEl, 'dragleave', () => dropZoneEl.classList.remove('b4-drop-active'), {}, 'diffUI');
                Game.EventManager.on(dropZoneEl, 'drop', (e) => {
                    e.preventDefault(); dropZoneEl.classList.remove('b4-drop-active');
                    const d = e.dataTransfer.getData('text/plain');
                    if (d.startsWith('b4hd:')) addHdCoin(parseInt(d.replace('b4hd:', '')));
                }, {}, 'diffUI');
            }
            // desktop drag-back from wallet zone to tray
            if (trayCardEl) {
                Game.EventManager.on(trayCardEl, 'dragover', (e) => { e.preventDefault(); trayCardEl.classList.add('b4-drop-active'); }, {}, 'diffUI');
                Game.EventManager.on(trayCardEl, 'dragleave', () => trayCardEl.classList.remove('b4-drop-active'), {}, 'diffUI');
                Game.EventManager.on(trayCardEl, 'drop', (e) => {
                    e.preventDefault(); trayCardEl.classList.remove('b4-drop-active');
                    const d = e.dataTransfer.getData('text/plain');
                    if (d.startsWith('b4hd-placed:')) removeByUid(parseInt(d.replace('b4hd-placed:', '')));
                }, {}, 'diffUI');
            }

            // touch drag
            document.querySelectorAll('.b4-hd-coin-drag').forEach(card => {
                let ghostEl = null;
                Game.EventManager.on(card, 'touchstart', (e) => {
                    const t = e.touches[0];
                    ghostEl = card.cloneNode(true);
                    ghostEl.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:0.8;transform:scale(1.05);left:${t.clientX - 35}px;top:${t.clientY - 50}px;`;
                    document.body.appendChild(ghostEl);
                }, { passive: true }, 'diffUI');
                Game.EventManager.on(card, 'touchmove', (e) => {
                    if (!ghostEl) return;
                    e.preventDefault();
                    const t = e.touches[0];
                    ghostEl.style.left = (t.clientX - 35) + 'px';
                    ghostEl.style.top  = (t.clientY - 50) + 'px';
                    if (dropZoneEl) {
                        const r = dropZoneEl.getBoundingClientRect();
                        dropZoneEl.classList.toggle('b4-drop-active',
                            t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom);
                    }
                }, { passive: false }, 'diffUI');
                Game.EventManager.on(card, 'touchend', (e) => {
                    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
                    if (dropZoneEl) dropZoneEl.classList.remove('b4-drop-active');
                    const t = e.changedTouches[0];
                    const r = dropZoneEl?.getBoundingClientRect();
                    if (r && t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
                        addHdCoin(parseInt(card.dataset.denom));
                    }
                }, { passive: true }, 'diffUI');
            });

            const confirmBtn = document.getElementById('b4-hd-confirm-btn');
            const clearBtn = document.getElementById('b4-hd-clear-btn');
            if (confirmBtn) Game.EventManager.on(confirmBtn, 'click', confirmHd, {}, 'diffUI');
            if (clearBtn) Game.EventManager.on(clearBtn, 'click', () => {
                if (this.state.isProcessing) return;
                hdWallet.length = 0;
                updateHdDisplay();
                this.audio.play('coin');
            }, {}, 'diffUI');
        },

        // 普通模式差額選項：揭露所有金額（coins 已在 HTML 中，只需更新 label visibility）
        _revealNormalDiffOptions(options, correctDiff, diffUnit) {
            document.querySelectorAll('.b4-diff-opt').forEach(btn => {
                const val = parseInt(btn.dataset.val);
                const label = btn.querySelector('.b4-diff-opt-label');
                if (label) { label.textContent = `${val} ${diffUnit}`; label.style.visibility = 'visible'; }
            });
        },

        // 困難模式差額：彈窗數字輸入器
        _showHardDiffNumpadModal(correctDiff, diffUnit, onCorrect) {
            const prev = document.getElementById('b4-hard-np-modal');
            if (prev) prev.remove();

            const overlay = document.createElement('div');
            overlay.id = 'b4-hard-np-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);';
            overlay.innerHTML = `
            <div class="b4-hnp-card">
                <button class="b4-modal-close-x" id="b4-hnp-x">✕</button>
                <div class="b4-hnp-title">便宜了多少${diffUnit}？</div>
                <div class="b4-input-display" id="b4-hnp-display">
                    <span id="b4-hnp-val">0</span><span class="b4-unit-text"> ${diffUnit}</span>
                </div>
                <div class="b4-numpad">
                    ${[7,8,9,4,5,6,1,2,3].map(n => `<button class="b4-numpad-btn" data-hnp="${n}">${n}</button>`).join('')}
                    <button class="b4-numpad-btn btn-del" id="b4-hnp-del">⌫</button>
                    <button class="b4-numpad-btn" data-hnp="0">0</button>
                    <button class="b4-numpad-btn btn-ok" id="b4-hnp-ok">✓</button>
                </div>
            </div>`;
            document.body.appendChild(overlay);

            let val = '';
            const updateDisp = () => {
                const el = document.getElementById('b4-hnp-val');
                if (el) el.textContent = val || '0';
            };

            overlay.querySelectorAll('[data-hnp]').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    if (val.length >= 5) return;
                    val += btn.dataset.hnp;
                    updateDisp();
                });
            });
            document.getElementById('b4-hnp-del').addEventListener('click', e => {
                e.stopPropagation();
                val = val.slice(0, -1);
                updateDisp();
            });
            document.getElementById('b4-hnp-ok').addEventListener('click', e => {
                e.stopPropagation();
                if (this.state.isProcessing) return;
                const entered = parseInt(val) || 0;
                if (entered === 0) return;
                this.state.isProcessing = true;
                const display = document.getElementById('b4-hnp-display');
                const isCorrect = (entered === correctDiff);
                if (display) { display.style.background = isCorrect ? '#059669' : '#dc2626'; display.style.color = '#fff'; }
                if (isCorrect) {
                    // 更新算式中的 ？？？ 為正確答案
                    const unknownCell = document.querySelector('.b4-dff-unknown');
                    if (unknownCell) {
                        unknownCell.classList.remove('b4-dff-unknown');
                        unknownCell.textContent = `${correctDiff} 元`;
                        unknownCell.style.color = '#059669';
                    }
                    this.audio.play('correct');
                    if (typeof confetti === 'function') {
                        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
                    }
                }
                Game.TimerManager.setTimeout(() => {
                    overlay.remove();
                    if (isCorrect) {
                        this.state.isProcessing = false;
                        if (onCorrect) {
                            Game.Speech.speak(`答對，便宜了${correctDiff}元`, onCorrect);
                        } else {
                            Game.Speech.speak(`答對，便宜了${correctDiff}元，請選擇正確的答案。`, () => {
                                this._showHardDiffMoneyOptions(correctDiff, diffUnit);
                            });
                        }
                    } else {
                        this.handleDiffAnswer(false, correctDiff);
                    }
                }, 600, 'ui');
            });
            document.getElementById('b4-hnp-x').addEventListener('click', () => { window.speechSynthesis.cancel(); overlay.remove(); });
        },

        // 困難模式第二頁：答對後顯示三個金錢圖示選項
        _showHardDiffMoneyOptions(correctDiff, diffUnit) {
            const curr = this.state.currentDiffItem;
            if (!curr) return;
            const options = this._getDiffOptions(correctDiff);

            // 移除已有選項卡（防重複）
            document.querySelector('.b4-diff-options-card')?.remove();

            const card = document.createElement('div');
            card.className = 'b4-diff-section b4-diff-options-card';
            card.innerHTML = `
                <div class="b4-diff-options">
                    ${options.map(val => `
                    <button class="b4-diff-opt b4-diff-opt-masked" data-val="${val}">
                        <div class="b4-diff-opt-coins">${b4PriceCoins(val)}</div>
                        <span class="b4-diff-opt-label">？？？</span>
                    </button>`).join('')}
                </div>`;

            const outer = document.querySelector('.b4-diff-hard-outer');
            if (outer) outer.appendChild(card);
            else document.querySelector('.b-game-wrap')?.appendChild(card);

            // 點擊錯誤：顯示金額 1.5s 後按鈕消失；點擊正確：直接前進
            card.querySelectorAll('.b4-diff-opt').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    if (this.state.isProcessing) return;
                    this.state.isProcessing = true;
                    const chosen = parseInt(btn.dataset.val);
                    const isCorrect = (chosen === correctDiff);
                    const label = btn.querySelector('.b4-diff-opt-label');
                    if (label) { label.textContent = `${chosen} ${diffUnit}`; label.style.visibility = 'visible'; }
                    btn.classList.remove('b4-diff-opt-masked');
                    btn.classList.add(isCorrect ? 'correct-ans' : 'wrong-ans');
                    if (isCorrect) {
                        if (typeof confetti === 'function') {
                            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
                        }
                        this.handleDiffAnswer(true, correctDiff);
                    } else {
                        this.audio.play('error');
                        this._showCenterFeedback('❌', '再試一次！');
                        this.state.quiz.diffErrorCount = (this.state.quiz.diffErrorCount || 0) + 1;
                        const revealNow = this.state.quiz.diffErrorCount >= 3;
                        if (revealNow) {
                            this._showDiffFormulaHint();
                            Game.Speech.speak(`不對喔，差額是${correctDiff}元，請再試一次`);
                        } else {
                            Game.Speech.speak(`不對喔，再想想看`);
                        }
                        Game.TimerManager.setTimeout(() => {
                            btn.remove();
                            this.state.isProcessing = false;
                            if (revealNow) {
                                const correctBtn = card.querySelector(`.b4-diff-opt[data-val="${correctDiff}"]`);
                                if (correctBtn) {
                                    const cl = correctBtn.querySelector('.b4-diff-opt-label');
                                    if (cl) { cl.textContent = `${correctDiff} ${diffUnit}`; cl.style.visibility = 'visible'; }
                                    correctBtn.classList.remove('b4-diff-opt-masked');
                                    correctBtn.classList.add('b4-select-hint');
                                    Game.TimerManager.setTimeout(() => correctBtn.classList.remove('b4-select-hint'), 2400, 'ui');
                                }
                            }
                        }, 1500, 'ui');
                    }
                }, {}, 'diffUI');
            });

            Game.Speech.speak('請選擇正確的金錢選項');
        },

        // 困難模式差額：算式提示彈窗
        _showHardDiffFormulaHint(curr, expOpt, cheapOpt, correctDiff, diffUnit) {
            const prev = document.getElementById('b4-hard-formula-hint');
            if (prev) prev.remove();

            const expPrice   = expOpt.price;
            const cheapPrice = cheapOpt.price;
            const expStore   = expOpt.store;
            const cheapStore = cheapOpt.store;

            const overlay = document.createElement('div');
            overlay.id = 'b4-hard-formula-hint';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);cursor:pointer;';
            overlay.innerHTML = `
            <div class="b4-hfh-card">
                <div class="b4-hfh-title">💡 算式提示</div>
                <div class="b4-hfh-formula">
                    <span class="b4-hfh-store">${expStore}</span>
                    <span class="b4-hfh-num">${expPrice}元</span>
                    <span class="b4-hfh-op">－</span>
                    <span class="b4-hfh-store">${cheapStore}</span>
                    <span class="b4-hfh-num">${cheapPrice}元</span>
                    <span class="b4-hfh-op">＝</span>
                    <span class="b4-hfh-ans">${correctDiff} ${diffUnit}</span>
                </div>
                <div class="b4-hfh-close">點任意處關閉</div>
            </div>`;
            document.body.appendChild(overlay);

            const speech = `${expStore}${expPrice}元，減去${cheapStore}${cheapPrice}元，等於${correctDiff}${diffUnit}`;
            Game.Speech.speak(speech);

            overlay.addEventListener('click', () => { window.speechSynthesis.cancel(); overlay.remove(); });
        },

        _getDiffOptions(correct) {
            const opts = new Set([correct]);
            const variations = [10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 100];
            for (const v of variations) {
                if (opts.size >= 3) break;
                const candidate = correct + (Math.random() < 0.5 ? v : -v);
                if (candidate > 0 && candidate !== correct) opts.add(candidate);
            }
            // 補足到3個
            let extra = 10;
            while (opts.size < 3) { opts.add(correct + extra); extra += 5; }
            return [...opts].sort(() => Math.random() - 0.5);
        },

        // ── Diff Correct 算式閃現（Round 28）────────────────────
        _showDiffCalcFlash(highPrice, lowPrice, diff) {
            const prev = document.getElementById('b4-calc-flash');
            if (prev) prev.remove();
            const flash = document.createElement('div');
            flash.id = 'b4-calc-flash';
            flash.className = 'b4-calc-flash';
            flash.innerHTML = `
                <span class="b4-cf-num">${highPrice}</span>
                <span class="b4-cf-op">−</span>
                <span class="b4-cf-num">${lowPrice}</span>
                <span class="b4-cf-op">=</span>
                <span class="b4-cf-ans">${diff} 元</span>`;
            document.body.appendChild(flash);
            Game.TimerManager.setTimeout(() => {
                flash.classList.add('b4-cf-fade');
                Game.TimerManager.setTimeout(() => { if (flash.parentNode) flash.remove(); }, 400, 'ui');
            }, 1400, 'ui');
        },

        // ── Select 階段計時提示（清除函數）──────────────────────
        _clearSelectHintTimer() {
            if (this._selectHintTimer) {
                // TimerManager handles clearing, just reset the ref
                this._selectHintTimer = null;
            }
        },

        // ── Diff Formula Hint ───────────────────────────────────
        _showDiffFormulaHint() {
            const item = this.state.currentDiffItem;
            if (!item) return;
            if (document.querySelector('.b4-diff-hint-formula')) return; // 防重複
            const section = document.querySelector('.b4-diff-section');
            if (!section) return;
            const hint = document.createElement('div');
            hint.className = 'b4-diff-hint-formula';
            hint.innerHTML = `<span class="b4-hint-label">💡 算式提示：</span>`
                + `${item.optA.price} <span class="b4-hint-op">−</span> ${item.optB.price}`
                + ` <span class="b4-hint-op">=</span> <span class="b4-hint-blank">？</span> 元`;
            const anchor = section.querySelector('.b4-diff-options') || section.querySelector('.b4-numpad');
            if (anchor) section.insertBefore(hint, anchor);
            else section.appendChild(hint);
        },

        // ── 三商店獎台動畫（F4 排序 pattern）────────────────────
        _showPodiumAnimation(curr) {
            const prev = document.getElementById('b4-podium-overlay');
            if (prev) prev.remove();
            const sorted = curr.sortedAsc; // [cheapest, middle, mostExp]
            // 獎台視覺：左=2nd，中=1st（最高），右=3rd
            const cols = [
                { store: sorted[1].store, price: sorted[1].price, rank: '🥈', height: '70px', label: '第2名', cls: 'silver' },
                { store: sorted[0].store, price: sorted[0].price, rank: '🥇', height: '96px', label: '最便宜', cls: 'gold' },
                { store: sorted[2].store, price: sorted[2].price, rank: '🥉', height: '50px', label: '第3名', cls: 'bronze' },
            ];
            const overlay = document.createElement('div');
            overlay.id = 'b4-podium-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:10150;display:flex;align-items:flex-end;justify-content:center;padding-bottom:60px;pointer-events:none;';
            overlay.innerHTML = `<div class="b4-podium-wrap">
                ${cols.map((col, i) => `
                <div class="b4-podium-col ${col.cls}" style="animation-delay:${i*0.12}s">
                    <div class="b4-podium-rank">${col.rank}</div>
                    <div class="b4-podium-store">${col.store}</div>
                    <div class="b4-podium-price">${col.price}元</div>
                    <div class="b4-podium-block ${col.cls}" style="height:${col.height}">
                        <span class="b4-podium-lbl">${col.label}</span>
                    </div>
                </div>`).join('')}
            </div>`;
            document.body.appendChild(overlay);
            // 語音播報排名（Round 43）
            const cheapest = sorted[0];
            Game.TimerManager.setTimeout(() => {
                Game.Speech.speak(`第一名，${cheapest.store}，${cheapest.price}元，最便宜！`);
            }, 350, 'speech');
            Game.TimerManager.setTimeout(() => {
                overlay.style.transition = 'opacity 0.4s';
                overlay.style.opacity = '0';
                Game.TimerManager.setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 400, 'ui');
            }, 1600, 'ui');
        },

        // ── Diff Answer Handler ─────────────────────────────────
        // 省錢 toast（A4 _showPricePopup pattern）
        // ── 學習要點提示（Round 32）──────────────────────────────
        _showSubtractionTip(highPrice, lowPrice, diff) {
            const prev = document.getElementById('b4-sub-tip');
            if (prev) prev.remove();
            const tip = document.createElement('div');
            tip.id = 'b4-sub-tip';
            tip.className = 'b4-sub-tip';
            tip.innerHTML = `<span class="b4-st-label">📐 減法算式：</span>`
                + `<span class="b4-st-hi">${highPrice}</span>`
                + `<span class="b4-st-op"> − </span>`
                + `<span class="b4-st-lo">${lowPrice}</span>`
                + `<span class="b4-st-op"> = </span>`
                + `<span class="b4-st-diff">${diff} 元</span>`;
            document.body.appendChild(tip);
            Game.TimerManager.setTimeout(() => { tip.classList.add('b4-tip-fade'); Game.TimerManager.setTimeout(() => tip.remove(), 400, 'ui'); }, 1200, 'ui');
        },

        // ── 冠軍徽章（Round 31）──────────────────────────────────
        // ── 比價思路步驟卡（Round 44）────────────────────────────
        _showThinkingSteps(curr) {
            document.getElementById('b4-thinking-card')?.remove();
            if (curr.isTriple) return; // 僅兩商店模式
            const a = curr.optA, b = curr.optB;
            const cheaperStore = a.price <= b.price ? a.store : b.store;
            const cheaper  = a.price <= b.price ? a.price : b.price;
            const pricierStore = a.price <= b.price ? b.store : a.store;
            const pricier  = a.price <= b.price ? b.price : a.price;
            const op = pricier > cheaper ? '>' : '=';
            const card = document.createElement('div');
            card.id = 'b4-thinking-card';
            card.className = 'b4-thinking-card';
            card.innerHTML = `
                <div class="b4-tc-title">🤔 比較思路</div>
                <div class="b4-tc-step b4-tc-step1">1️⃣ 看 ${a.store}：<strong>${a.price}元</strong></div>
                <div class="b4-tc-step b4-tc-step2">2️⃣ 看 ${b.store}：<strong>${b.price}元</strong></div>
                <div class="b4-tc-conclude">${pricier}元 ${op} ${cheaper}元，所以 <strong>${cheaperStore}</strong> 比較便宜 ✅</div>`;
            document.body.appendChild(card);
            Game.TimerManager.setTimeout(() => {
                card.classList.add('b4-tc-fade');
                Game.TimerManager.setTimeout(() => { if (card.parentNode) card.remove(); }, 400, 'ui');
            }, 2000, 'ui');
        },

        _showChampionBadge(storeName) {
            const prev = document.getElementById('b4-champion-badge');
            if (prev) prev.remove();
            const badge = document.createElement('div');
            badge.id = 'b4-champion-badge';
            badge.className = 'b4-champion-badge';
            badge.innerHTML = `<span class="b4-champ-icon">🥇</span><span class="b4-champ-text">${storeName}最便宜！</span>`;
            document.body.appendChild(badge);
            Game.TimerManager.setTimeout(() => badge.remove(), 1600, 'ui');
        },

        _showSavingsToast(amount) {
            const prev = document.getElementById('b4-savings-toast');
            if (prev) prev.remove();
            const toast = document.createElement('div');
            toast.id = 'b4-savings-toast';
            toast.className = 'b4-savings-toast';
            const ci3 = this.state.currentDiffItem;
            {
                const highPrice = ci3 ? (ci3.optA?.price || 0) : 0;
                const pct = highPrice > 0 ? Math.round((amount / highPrice) * 100) : 0;
                toast.textContent = pct > 0 ? `💰 省了 ${amount} 元（省 ${pct}%）！` : `💰 省了 ${amount} 元！`;
            }
            document.body.appendChild(toast);
            Game.TimerManager.setTimeout(() => {
                toast.classList.add('b4-toast-fade');
                Game.TimerManager.setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400, 'ui');
            }, 1100, 'ui');
        },

        handleDiffAnswer(isCorrect, correctDiff) {
            if (isCorrect) {
                this.audio.play('correct');
                // 在算式卡（第2個框）顯示答案文字，取代浮動彈窗
                const diffCard = document.querySelector('.b4-diff-normal-card');
                if (diffCard) {
                    diffCard.querySelector('.b4-diff-answer-reveal')?.remove();
                    const reveal = document.createElement('div');
                    reveal.className = 'b4-diff-answer-reveal';
                    const ci0 = this.state.currentDiffItem;
                    reveal.textContent = `便宜了 ${correctDiff} 元`;
                    diffCard.appendChild(reveal);
                }
                this.state.quiz.correctCount++;
                this.state.quiz.totalSaved += correctDiff;
                const ci = this.state.currentDiffItem;
                if (ci) {
                    this.state.quiz.comparisonHistory.push({
                        name: ci.name, icon: ci.icon, imageUrl: ci.imageUrl, cat: ci.cat || 'other',
                        cheapStore: ci.optB.store, cheapPrice: ci.optB.price,
                        expStore: ci.optA.store,   expPrice:  ci.optA.price,
                        saved: correctDiff
                    });
                }
                const ci2 = this.state.currentDiffItem;
                const diffSpeech = `答對了！便宜了${toTWD(correctDiff)}`;
                Game.Speech.speak(diffSpeech, () => {
                    Game.TimerManager.setTimeout(() => this.nextQuestion(), 400, 'turnTransition');
                });
            } else {
                this.state.quiz.streak = 0;
                this.state.quiz.diffErrorCount = (this.state.quiz.diffErrorCount || 0) + 1;
                this.audio.play('error');
                const ciW = this.state.currentDiffItem;
                const diff = this.state.settings.difficulty;
                // 普通模式：3次後自動揭露答案；困難模式：只有提示鈕才揭露
                const revealAnswer = diff !== 'hard' && this.state.quiz.diffErrorCount >= 3;
                if (revealAnswer) {
                    this._showDiffFormulaHint(); // 普通模式第3次後顯示算式
                }
                const diffWrongSpeechBase = `差額是${toTWD(correctDiff)}`;
                {
                    this._showCenterFeedback('❌', '再試一次！');
                    if (revealAnswer) {
                        // 普通模式第3次：說出答案，並保留正確選項高亮
                        Game.Speech.speak(`不對喔，${diffWrongSpeechBase}，請再試一次`);
                    } else {
                        // 第1~2次（或困難模式全部次數）：只給方向提示
                        const ciWDir = ciW && this.state.numpadValue
                            ? parseInt(this.state.numpadValue) > correctDiff ? '多了' : '少了'
                            : null;
                        const dirHint = ciWDir ? `算${ciWDir}，` : '';
                        Game.Speech.speak(`不對喔，${dirHint}再想想看`);
                    }
                    Game.TimerManager.setTimeout(() => {
                        this.state.isProcessing = false;
                        // 普通模式 3 次後保留正確答案高亮，困難模式全部清除
                        document.querySelectorAll('.b4-diff-opt').forEach(b => {
                            const isCorrectOpt = parseInt(b.dataset.val) === correctDiff;
                            if (revealAnswer && isCorrectOpt) {
                                b.classList.add('correct-ans'); // 保留高亮
                            } else {
                                b.classList.remove('wrong-ans', 'correct-ans');
                            }
                            b.disabled = revealAnswer && isCorrectOpt; // 正確選項保持不可點
                        });
                        // Reset numpad display
                        const display = document.getElementById('numpad-display');
                        if (display) {
                            display.style.background = '';
                            display.style.color = '';
                        }
                        this.state.numpadValue = '';
                        this._updateNumpadDisplay();
                    }, 1600, 'turnTransition');
                }
            }
        },

        // ── Next / Results ─────────────────────────────────────
        nextQuestion() {
            const q = this.state.quiz;
            q.selectErrorCount = 0;
            q.diffErrorCount = 0;
            this.state.tripleClickOrder = [];
            q.currentQuestion++;
            if (q.currentQuestion >= q.totalQuestions) {
                // 顯示完成彈窗，關閉後再進成績頁
                this._showCompletionModal(() => {
                    if (q.comparisonHistory && q.comparisonHistory.length > 0) {
                        this.showSavingsList();
                    } else {
                        this.showResults();
                    }
                });
            } else {
                this.renderQuestion();
            }
        },

        // ── 完成所有測驗彈窗 ──────────────────────────────────────
        _showCompletionModal(onContinue) {
            const prev = document.getElementById('b4-completion-modal');
            if (prev) prev.remove();

            const overlay = document.createElement('div');
            overlay.id = 'b4-completion-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10300;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
            overlay.innerHTML = `
            <div style="background:linear-gradient(135deg,#fef9c3,#fde68a);border-radius:24px;padding:36px 32px 28px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.25);max-width:320px;width:90%;animation:b4CmIn 0.4s cubic-bezier(0.34,1.56,0.64,1);">
                <div style="font-size:3.5rem;line-height:1;margin-bottom:12px;">🏆</div>
                <div style="font-size:1.5rem;font-weight:900;color:#92400e;margin-bottom:24px;">恭喜你完成所有測驗！</div>
                <button id="b4-cm-continue-btn" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;border-radius:14px;padding:14px 36px;font-size:1.1rem;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(217,119,6,0.4);">
                    查看省錢清單 →
                </button>
            </div>`;
            document.body.appendChild(overlay);

            // 音效 + 煙火（一次）
            this.audio.play('correct');
            if (typeof confetti === 'function') {
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
            }
            Game.Speech.speak('恭喜你完成所有測驗');

            document.getElementById('b4-cm-continue-btn').addEventListener('click', () => {
                window.speechSynthesis.cancel();
                overlay.remove();
                onContinue?.();
            });

            // 輔助點擊：提升 overlay z-index 使其覆蓋完成彈窗，並重建 queue
            if (this.state.settings.clickMode === 'on' && AssistClick._enabled) {
                Game.TimerManager.setTimeout(() => {
                    if (AssistClick._overlay) AssistClick._overlay.style.zIndex = '10400';
                    AssistClick.buildQueue();
                }, 200, 'ui');
            }
        },

        // ── 省錢清單（測驗結束後先顯示，再進總結頁）──────────────
        showSavingsList() {
            AssistClick.deactivate();
            Game.TimerManager.clearByCategory('turnTransition');
            Game.EventManager.removeByCategory('gameUI');
            Game.EventManager.removeByCategory('diffUI');

            const _reactivateForSummary = this.state.settings.clickMode === 'on';

            const q      = this.state.quiz;
            const hist   = q.comparisonHistory || [];

            const app = document.getElementById('app');
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            app.style.overflow  = 'auto';
            app.style.height    = 'auto';
            app.style.minHeight = '100vh';

            // ── 依省錢排序，取出最划算 ──
            const sorted = [...hist].sort((a, b) => b.saved - a.saved);
            const best   = sorted[0];
            const medalMap = new Map();
            sorted.slice(0, 3).forEach((h, rank) => {
                const idx = hist.indexOf(h);
                medalMap.set(idx, ['🥇', '🥈', '🥉'][rank]);
            });

            // ── 單張卡片渲染函數 ──
            const renderCard = (i) => {
                if (!hist[i]) return '<div class="b4-sl-empty">這次沒有比價記錄</div>';
                const h = hist[i];
                const medal = medalMap.get(i) || '';
                const expLabel   = `${h.expPrice}元`;
                const cheapLabel = `${h.cheapPrice}元`;
                const savedLabel = `省 ${h.saved} 元`;
                const catColor  = { food:'#f0fdf4', stationery:'#eff6ff', daily:'#fdf4ff', clothing:'#fff7ed', other:'#f9fafb' }[h.cat] || '#f9fafb';
                const catBorder = { food:'#86efac', stationery:'#93c5fd', daily:'#d8b4fe', clothing:'#fdba74', other:'#e5e7eb' }[h.cat] || '#e5e7eb';
                return `
                <div class="b4-sl-card2${medal === '🥇' ? ' b4-sl-card2-gold' : ''}">
                    ${medal ? `<div class="b4-sl2-medal-badge">${medal}</div>` : ''}
                    <div class="b4-sl2-top" style="background:${catColor};border-color:${catBorder};">
                        <span class="b4-sl2-icon">${b4IconHTML(h)}</span>
                        <span class="b4-sl2-name">${h.name}</span>
                    </div>
                    <div class="b4-sl2-body">
                        <div class="b4-sl2-formula">
                            <div class="b4-sl2-store-block b4-sl2-exp">
                                <span class="b4-sl2-store-name">${h.expStore}</span>
                                <span class="b4-sl2-price">${expLabel}</span>
                            </div>
                            <span class="b4-sl2-op">－</span>
                            <div class="b4-sl2-store-block b4-sl2-cheap">
                                <span class="b4-sl2-store-name">${h.cheapStore}</span>
                                <span class="b4-sl2-price">${cheapLabel}</span>
                            </div>
                            <span class="b4-sl2-op">＝</span>
                            <div class="b4-sl2-store-block b4-sl2-saved">
                                <span class="b4-sl2-saved-txt">${savedLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            };

            const diffLabel = { easy: '簡單', normal: '普通', hard: '困難' }[this.state.settings.difficulty] || '';

            app.innerHTML = `
<div class="b-header">
    <div class="b-header-left"><span class="b-header-unit">🏷️ 特賣比一比</span></div>
    <div class="b-header-center">${diffLabel}模式 · 省錢清單</div>
    <div class="b-header-right">
        <button class="b-reward-btn" id="b4-sl-reward-btn">🎁 獎勵</button>
        <button class="b-back-btn" id="b4-sl-back-btn">返回設定</button>
    </div>
</div>
<div class="b4-sl-page">
    <div class="b4-sl-frame">
        <div class="b4-sl-summary-card">
            <div class="b4-sl-sc-trophy">💰</div>
            <div class="b4-sl-sc-title">省錢清單</div>
            ${q.totalSaved > 0 ? `<div class="b4-sl-sc-total">總共省了 ${q.totalSaved} 元</div>` : ''}
            ${best ? `<div class="b4-sl-sc-best">🌟 最划算：${best.icon}${best.name}（${best.cheapStore}）省 ${best.saved} 元</div>` : ''}
        </div>

        ${hist.length > 0 ? `
        <div class="b4-sl-nav-bar">
            <button class="b4-sl-nav-btn" id="b4-sl-prev-btn" disabled>← 上一題</button>
            <span class="b4-sl-nav-info" id="b4-sl-nav-info">第 1 / ${hist.length} 題</span>
            <button class="b4-sl-nav-btn" id="b4-sl-nav-next-btn" ${hist.length <= 1 ? 'disabled' : ''}>下一題 →</button>
        </div>
        <div class="b4-sl-cards2" id="b4-sl-card-display">
            ${renderCard(0)}
        </div>
        ` : '<div class="b4-sl-empty">這次沒有比價記錄</div>'}
    </div>

    <div class="b4-sl-actions">
        <button class="b4-sl-next-btn" id="b4-sl-next-btn">
            查看完整成績 →
        </button>
    </div>
</div>`;

            // 建立省錢語音文字
            const buildSLSpeech = (h) => {
                if (!h) return '';
                return `${h.name}，${h.expStore}${h.expPrice}元，${h.cheapStore}${h.cheapPrice}元，省了${h.saved}元`;
            };

            // 卡片切換導覽
            if (hist.length > 1) {
                let cardIdx = 0;
                const display    = document.getElementById('b4-sl-card-display');
                const navInfo    = document.getElementById('b4-sl-nav-info');
                const prevBtn    = document.getElementById('b4-sl-prev-btn');
                const navNextBtn = document.getElementById('b4-sl-nav-next-btn');

                const updateNav = () => {
                    display.innerHTML   = renderCard(cardIdx);
                    navInfo.textContent = `第 ${cardIdx + 1} / ${hist.length} 題`;
                    prevBtn.disabled    = cardIdx === 0;
                    navNextBtn.disabled = cardIdx === hist.length - 1;
                    Game.Speech.speak(buildSLSpeech(hist[cardIdx]));
                };

                Game.EventManager.on(prevBtn, 'click', () => { cardIdx--; updateNav(); }, {}, 'gameUI');
                Game.EventManager.on(navNextBtn, 'click', () => { cardIdx++; updateNav(); }, {}, 'gameUI');
            }

            Game.EventManager.on(document.getElementById('b4-sl-next-btn'), 'click', () => {
                this.showResults();
            }, {}, 'gameUI');
            Game.EventManager.on(document.getElementById('b4-sl-reward-btn'), 'click', () => {
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'gameUI');
            Game.EventManager.on(document.getElementById('b4-sl-back-btn'), 'click', () => {
                this.showSettings();
            }, {}, 'gameUI');

            // 播放第一題語音（延遲讓頁面先渲染完）
            if (hist.length > 0) {
                Game.TimerManager.setTimeout(() => {
                    Game.Speech.speak(buildSLSpeech(hist[0]));
                }, 400, 'speech');
            }

            // 簡單輔助點擊：重啟以高亮「查看完整成績」按鈕
            if (_reactivateForSummary) {
                Game.TimerManager.setTimeout(() => AssistClick.activate(null), 400, 'ui');
            }
        },

        showResults() {
            // ── 完成畫面守衛 ──
            if (this.state.isEndingGame) return;
            this.state.isEndingGame = true;

            AssistClick.deactivate();
            Game.TimerManager.clearByCategory('turnTransition');
            Game.EventManager.removeByCategory('gameUI');
            Game.EventManager.removeByCategory('diffUI');

            const q       = this.state.quiz;
            const endTime = Date.now();
            const elapsed = q.startTime ? (endTime - q.startTime) : 0;
            const mins    = Math.floor(elapsed / 60000);
            const secs    = Math.floor((elapsed % 60000) / 1000);
            const accuracy = q.totalQuestions > 0
                ? Math.round((q.correctCount / q.totalQuestions) * 100) : 0;

            let badge, badgeColor;
            if (accuracy === 100)    { badge = '完美 🥇'; badgeColor = '#f59e0b'; }
            else if (accuracy >= 90) { badge = '優異 🥇'; badgeColor = '#f59e0b'; }
            else if (accuracy >= 70) { badge = '良好 🥈'; badgeColor = '#10b981'; }
            else if (accuracy >= 50) { badge = '努力 🥉'; badgeColor = '#6366f1'; }
            else                     { badge = '練習 ⭐'; badgeColor = '#94a3b8'; }

            const app = document.getElementById('app');
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            app.style.overflow  = 'auto';
            app.style.height    = 'auto';
            app.style.minHeight = '100vh';

            app.innerHTML = `
<div class="b-res-wrapper">
    <div class="b-res-screen">
        <div class="b-res-header">
            <div class="b-res-trophy">🏆</div>
            <div class="b-res-title-row">
                <img src="../images/common/hint_detective.png"
                     class="b-res-mascot" alt="金錢小助手" onerror="this.style.display='none'">
                <h1 class="b-res-title">🎉 比價達人 🎉</h1>
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
                    <div class="b-res-ach-item">✅ 比較不同商店的價格</div>
                    <div class="b-res-ach-item">✅ 找出最划算的選擇</div>
                    ${this.state.settings.compareStores === 'triple'
                        ? `<div class="b-res-ach-item">✅ 將三家商店由便宜到貴排序（F4 排序技能應用）</div>`
                        : `<div class="b-res-ach-item">✅ 計算兩價格的差額</div>`}
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

            Game.EventManager.on(document.getElementById('play-again-btn'),    'click', () => this.startGame(),    {}, 'gameUI');
            Game.EventManager.on(document.getElementById('back-settings-btn'), 'click', () => this.showSettings(), {}, 'gameUI');
            Game.EventManager.on(document.getElementById('endgame-reward-link'), 'click', (e) => {
                e.preventDefault();
                if (typeof RewardLauncher !== 'undefined') RewardLauncher.open();
                else window.open('../reward/index.html', 'RewardSystem', 'width=1200,height=800');
            }, {}, 'gameUI');

            Game.TimerManager.setTimeout(() => {
                document.getElementById('success-sound')?.play();
                this._fireConfetti();
            }, 100, 'confetti');

            // 完成語音
            Game.TimerManager.setTimeout(() => {
                const accuracy = q.totalQuestions > 0
                    ? Math.round((q.correctCount / q.totalQuestions) * 100) : 0;
                let msg;
                const cntWord = n => n === 2 ? '兩' : n;
                if (accuracy === 100)    msg = '太厲害了，全部答對了！';
                else if (accuracy >= 80) msg = `很棒喔，答對了${cntWord(q.correctCount)}題！`;
                else if (accuracy >= 60) msg = '不錯喔，繼續加油！';
                else                     msg = '要再加油喔，多練習幾次！';
                Game.Speech.speak(msg);
            }, 800, 'speech');
        },

        // ── 計算機（困難模式差額頁）────────────────────────────────
        _getB4CalculatorHTML() {
            return `
            <div class="b4-calculator">
                <div class="b4-calc-display" id="b4-calc-display">0</div>
                <div class="b4-calc-buttons">
                    <button class="b4-calc-btn b4-calc-num" data-v="7">7</button>
                    <button class="b4-calc-btn b4-calc-num" data-v="8">8</button>
                    <button class="b4-calc-btn b4-calc-num" data-v="9">9</button>
                    <button class="b4-calc-btn b4-calc-op"  data-v="C">C</button>
                    <button class="b4-calc-btn b4-calc-num" data-v="4">4</button>
                    <button class="b4-calc-btn b4-calc-num" data-v="5">5</button>
                    <button class="b4-calc-btn b4-calc-num" data-v="6">6</button>
                    <button class="b4-calc-btn b4-calc-op"  data-v="+">+</button>
                    <button class="b4-calc-btn b4-calc-num" data-v="1">1</button>
                    <button class="b4-calc-btn b4-calc-num" data-v="2">2</button>
                    <button class="b4-calc-btn b4-calc-num" data-v="3">3</button>
                    <button class="b4-calc-btn b4-calc-op"  data-v="-">−</button>
                    <button class="b4-calc-btn b4-calc-num" data-v="0">0</button>
                    <button class="b4-calc-btn b4-calc-op"  data-v="⌫">⌫</button>
                    <button class="b4-calc-btn b4-calc-eq"  data-v="=">=</button>
                    <button class="b4-calc-btn b4-calc-op"  data-v="×">×</button>
                </div>
            </div>`;
        },

        _bindB4Calculator() {
            const panel   = document.getElementById('b4-calc-panel');
            const toggle  = document.getElementById('b4-calc-toggle');
            const display = document.getElementById('b4-calc-display');
            if (!panel || !toggle || !display) return;

            let calcVal = '0', calcOp = null, calcPrev = null, calcFresh = false;
            const updateDisp = () => { display.textContent = calcVal; };

            Game.EventManager.on(toggle, 'click', () => {
                const open = panel.style.display === 'none';
                panel.style.display = open ? '' : 'none';
                toggle.classList.toggle('b4-calc-open', open);
                toggle.title = open ? '關閉計算機' : '計算機';
            }, {}, 'diffUI');

            panel.querySelectorAll('.b4-calc-btn').forEach(btn => {
                Game.EventManager.on(btn, 'click', () => {
                    const v = btn.dataset.v;
                    if (v === 'C') { calcVal = '0'; calcOp = null; calcPrev = null; calcFresh = false; }
                    else if (v === '⌫') { calcVal = calcVal.length > 1 ? calcVal.slice(0, -1) : '0'; }
                    else if (['+', '−', '-', '×'].includes(v)) {
                        if (calcOp && calcPrev !== null && !calcFresh) {
                            const cur = parseFloat(calcVal);
                            const res = calcOp === '+' ? calcPrev + cur : (calcOp === '−' || calcOp === '-') ? calcPrev - cur : calcPrev * cur;
                            calcVal = String(Math.round(res * 1000) / 1000);
                            updateDisp();
                        }
                        calcPrev = parseFloat(calcVal); calcOp = v; calcFresh = true;
                    } else if (v === '=') {
                        if (calcOp && calcPrev !== null) {
                            const cur = parseFloat(calcVal);
                            const res = calcOp === '+' ? calcPrev + cur : (calcOp === '−' || calcOp === '-') ? calcPrev - cur : calcPrev * cur;
                            calcVal = String(Math.round(res * 1000) / 1000);
                            calcOp = null; calcPrev = null;
                        }
                    } else {
                        calcVal = (calcFresh || calcVal === '0') ? v : calcVal + v;
                        calcFresh = false;
                    }
                    updateDisp();
                }, {}, 'diffUI');
            });
        },

        // ── Confetti（遞迴版）────────────────────────────────────
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
        _showCenterFeedback(icon, text = '') {
            document.querySelector('.b-center-feedback')?.remove();
            const overlay = document.createElement('div');
            overlay.className = 'b-center-feedback';
            overlay.innerHTML = `<span class="b-cf-icon">${icon}</span>${text ? `<span class="b-cf-text">${text}</span>` : ''}`;
            document.body.appendChild(overlay);
            Game.TimerManager.setTimeout(() => overlay.remove(), 1200, 'ui');
        },

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
        _queue: [], _enabled: false,
        _lastHighlighted: null, _observer: null,
        _curr: null, _correctSide: null,

        activate(curr, correctSide) {
            if (this._overlay) return;
            this._curr        = curr;
            this._correctSide = correctSide;
            this._overlay = document.createElement('div');
            this._overlay.id = 'b4-assist-overlay';
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
            this._queue = []; this._enabled = false;
            this._curr = null; this._correctSide = null;
            this._handler = null; this._touchHandler = null;
        },

        buildQueue() {
            if (!this._enabled) return;

            // 商品介紹彈窗（z-index 10200）開啟中 → 提升 overlay 至 10400，高亮「開始比較」按鈕
            const introModal = document.getElementById('b4-item-intro-modal');
            if (introModal) {
                if (this._overlay) this._overlay.style.zIndex = '10400';
                const startBtn = document.getElementById('b4-intro-start-btn');
                if (startBtn) {
                    this._clearHighlight();
                    this._queue = [{ el: startBtn, action: () => startBtn.click() }];
                    this._highlight(startBtn);
                }
                return;
            }
            // 彈窗關閉後恢復 overlay z-index
            if (this._overlay) this._overlay.style.zIndex = '10100';

            // 完成彈窗／省錢清單頁：優先偵測，不受 isProcessing 限制
            // （isProcessing 在最後一題答對後仍為 true，若晚於此檢查會導致完成彈窗無法被高亮）
            const cmBtn = document.getElementById('b4-cm-continue-btn');
            if (cmBtn) {
                if (this._overlay) this._overlay.style.zIndex = '10400';
                this._clearHighlight();
                this._queue = [{ el: cmBtn, action: () => cmBtn.click() }];
                this._highlight(this._queue[0].el);
                return;
            }
            const slNextBtn = document.getElementById('b4-sl-next-btn');
            if (slNextBtn) {
                this._clearHighlight();
                this._queue = [{ el: slNextBtn, action: () => slNextBtn.click() }];
                this._highlight(this._queue[0].el);
                return;
            }

            // 處理中（答案回饋、語音播放）時跳過，避免重複高亮已點擊的元件
            if (Game.state.isProcessing) return;
            this._clearHighlight();
            this._queue = [];

            const curr        = this._curr;
            const correctSide = this._correctSide;
            const diff        = Game.state.settings.difficulty;
            const phase       = Game.state.phase;

            if (!curr) return;

            if (curr.isTriple) {
                // ── 三商店模式 ────────────────────────────────
                if (diff === 'hard') {
                    // hard：依已點順序決定下一個目標（cheapest→middle→mostExp）
                    const rankOrder = [curr.cheapestIdx, curr.middleIdx, curr.mostExpIdx];
                    const done      = Game.state.tripleClickOrder.length;
                    if (done >= rankOrder.length) return;
                    const nextIdx = rankOrder[done];
                    const card = document.getElementById(`tcard-${nextIdx}`);
                    if (card && !card.classList.contains('ranked')) {
                        this._queue = [{ el: card, action: () => card.click() }];
                    }
                } else if (diff === 'easy') {
                    // 簡單：逐枚點幣（select 和 diff 階段均用點幣）
                    if (phase === 'select') {
                        const coins = Array.from(document.querySelectorAll('.b4-easy-coin:not([data-clicked])'));
                        this._queue = coins.map(coin => ({ el: coin, action: () => coin.click() }));
                    } else if (phase === 'diff') {
                        // 拖曳模式：找下一個未放置的面額卡直接呼叫 handleDrop
                        const nextCard = document.querySelector('.b4-diff-denom-card:not([data-placed])');
                        if (nextCard && Game.state._diffHandleDrop) {
                            const cidx = parseInt(nextCard.dataset.cidx);
                            this._queue = [{ el: nextCard, action: () => Game.state._diffHandleDrop(cidx) }];
                        }
                    }
                } else {
                    // normal：點最便宜卡（輸入框模式，待幣點完後自動出現）
                    if (phase === 'select') {
                        const coins = Array.from(document.querySelectorAll('.b4-easy-coin:not([data-clicked]):not([data-placed])'));
                        if (coins.length > 0) {
                            this._queue = coins.map(coin => ({ el: coin, action: () => coin.click() }));
                        }
                    } else if (phase === 'diff') {
                        const correctDiff = curr.diff;
                        if (diff === 'easy') {
                            // 簡單：三商店單一差額按鈕
                            const btn = document.getElementById('b4-easy-tdiff-btn');
                            if (btn) this._queue = [{ el: btn, action: () => btn.click() }];
                        } else {
                            // normal/hard 三商店差額選項
                            const opt = document.querySelector(`.b4-diff-opt[data-val="${correctDiff}"]`);
                            if (opt && !opt.disabled) {
                                this._queue = [{ el: opt, action: () => opt.click() }];
                            }
                        }
                    }
                }
            } else {
                // ── 兩家店模式 ────────────────────────────────
                if (phase === 'select') {
                    if (diff === 'easy') {
                        // 簡單：逐枚點幣
                        const coins = Array.from(document.querySelectorAll('.b4-easy-coin:not([data-clicked])'));
                        this._queue = coins.map(coin => ({ el: coin, action: () => coin.click() }));
                    } else {
                        const card = document.getElementById(`card-${correctSide}`);
                        if (card && !card.classList.contains('selected-correct')) {
                            this._queue = [{ el: card, action: () => card.click() }];
                        }
                    }
                } else if (phase === 'diff') {
                    const correctDiff = curr.diff;
                    if (diff === 'easy') {
                        // 拖曳模式，直接呼叫 handleDrop
                        const nextCard = document.querySelector('.b4-diff-denom-card:not([data-placed])');
                        if (nextCard && Game.state._diffHandleDrop) {
                            const cidx = parseInt(nextCard.dataset.cidx);
                            this._queue = [{ el: nextCard, action: () => Game.state._diffHandleDrop(cidx) }];
                        }
                    } else if (diff === 'normal') {
                        const opt = document.querySelector(`.b4-diff-opt[data-val="${correctDiff}"]`);
                        if (opt && !opt.disabled) {
                            this._queue = [{ el: opt, action: () => opt.click() }];
                        }
                    } else {
                        // hard：逐位數 + 確認
                        const steps = [];
                        const digits = String(correctDiff).split('');
                        for (const d of digits) {
                            const btn = document.querySelector(`[data-num="${d}"]`);
                            if (btn) steps.push({ el: btn, action: () => btn.click() });
                        }
                        const okBtn = document.getElementById('btn-ok');
                        if (okBtn) steps.push({ el: okBtn, action: () => okBtn.click() });
                        this._queue = steps;
                    }
                }
            }

            if (this._queue.length > 0) this._highlight(this._queue[0].el);
        },

        _executeStep() {
            if (!this._enabled || this._queue.length === 0) return;
            const step = this._queue.shift();
            this._clearHighlight();
            if (step?.action) step.action();
            Game.TimerManager.setTimeout(() => {
                if (!this._enabled) return;
                if (this._queue.length > 0) {
                    this._highlight(this._queue[0].el);
                } else {
                    this.buildQueue();
                }
            }, 400, 'ui');
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

    // ── 商店圖示放大檢視 ───────────────────────────────────────────
    document.addEventListener('click', e => {
        const img = e.target.closest('[data-b4zoom]');
        if (!img) return;
        e.stopPropagation();
        const existing = document.getElementById('b4-store-zoom-overlay');
        if (existing) { existing.remove(); return; }
        const overlay = document.createElement('div');
        overlay.id = 'b4-store-zoom-overlay';
        overlay.innerHTML = `
            <div class="b4-szoom-card">
                <img src="${img.dataset.b4zoom}" alt="${img.dataset.b4name}" class="b4-szoom-img">
                <div class="b4-szoom-name">${img.dataset.b4name}</div>
            </div>`;
        overlay.addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
    });
});
