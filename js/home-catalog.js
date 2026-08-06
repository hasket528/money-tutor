// ⚠️ 自動產生，請勿手改——改了下次重生就會被蓋掉。
// 重生：node tools/gen_home_catalog.js（deploy.ps1 步驟 C 會自動跑）
// 來源：dialogue/data/scenarios.js（場所）、dialogue/script.js（SCENARIO_PART 分部）、
//       dialogue/index.html（分部標籤）、adventure/adventure.js（LEVELS 關卡）
window.HOME_CATALOG = {
  "parts": [
    {
      "id": 1,
      "label": "第一部分・基礎買賣"
    },
    {
      "id": 2,
      "label": "第二部分・點餐客製"
    },
    {
      "id": 3,
      "label": "第三部分・生活應對"
    },
    {
      "id": 4,
      "label": "第四部分・金錢安全"
    },
    {
      "id": 5,
      "label": "第五部分・交通出行"
    },
    {
      "id": 6,
      "label": "第六部分・休閒娛樂"
    },
    {
      "id": 7,
      "label": "第七部分・職場初體驗"
    }
  ],
  "scenarios": [
    {
      "id": "convenience_store",
      "name": "便利商店",
      "icon": "🏪",
      "color": "#16A34A",
      "part": 1,
      "situations": 6,
      "scene": "dialogue/images/scenes/convenience_store.webp",
      "clerk": {
        "name": "小美",
        "role": "便利商店",
        "image": "dialogue/images/clerk-yating.jpg",
        "intro": "你好！我是便利商店的店員小美。在這裡你可以練習詢問商品在哪裡、結帳付款，還有找零錯誤時怎麼說。點卡片就可以開始練習囉！"
      }
    },
    {
      "id": "breakfast_shop",
      "name": "早餐店",
      "icon": "🍳",
      "color": "#D97706",
      "part": 2,
      "situations": 7,
      "scene": "dialogue/images/scenes/breakfast_shop.webp",
      "clerk": {
        "name": "阿香",
        "role": "早餐店",
        "image": "dialogue/images/clerk-xiaoxiao.png",
        "intro": "早安！我是早餐店的店員。在這裡你可以練習點餐、詢問今日招牌，還有等太久時怎麼有禮貌地開口問。"
      }
    },
    {
      "id": "supermarket",
      "name": "超市",
      "icon": "🛒",
      "color": "#7C3AED",
      "part": 1,
      "situations": 6,
      "scene": "dialogue/images/scenes/supermarket.webp",
      "clerk": {
        "name": "阿芬",
        "role": "超市",
        "image": "dialogue/images/clerk-xiaozheng.jpg",
        "intro": "你好！我是超市的服務人員阿芬。在這裡你可以練習找商品、請人幫忙秤重，還有錢不夠或商品有問題時怎麼應對。"
      }
    },
    {
      "id": "night_market",
      "name": "夜市攤販",
      "icon": "🧋",
      "color": "#DC2626",
      "part": 2,
      "situations": 5,
      "scene": "dialogue/images/scenes/night_market.webp",
      "clerk": {
        "name": "阿財",
        "role": "夜市",
        "image": "dialogue/images/clerk-yunxi.jpg",
        "intro": "嗨！我是夜市的攤販。在這裡你可以練習點飲料、詢問價格，甚至試試看跟老闆議價喔！"
      }
    },
    {
      "id": "pharmacy",
      "name": "藥局",
      "icon": "💊",
      "color": "#0891B2",
      "part": 3,
      "situations": 5,
      "scene": "dialogue/images/scenes/pharmacy.webp",
      "clerk": {
        "name": "淑惠",
        "role": "藥局",
        "image": "dialogue/images/clerk-xiaoyi.jpg",
        "intro": "你好！我是藥局的藥師。在這裡你可以練習說明症狀、詢問藥的用法，還有藥缺貨時怎麼應對。"
      }
    },
    {
      "id": "clothing_store",
      "name": "服飾店",
      "icon": "👗",
      "color": "#DB2777",
      "part": 1,
      "situations": 5,
      "scene": "dialogue/images/scenes/clothing_store.webp",
      "clerk": {
        "name": "小雅",
        "role": "服飾店",
        "image": "dialogue/images/clerk-xiaoyu.jpg",
        "intro": "你好！我是服飾店的店員小雅。在這裡你可以練習詢問尺寸、要求試穿，還有想退換貨時怎麼說。"
      }
    },
    {
      "id": "fast_food",
      "name": "速食店",
      "icon": "🍔",
      "color": "#EA580C",
      "part": 2,
      "situations": 5,
      "scene": "dialogue/images/scenes/fast_food.webp",
      "clerk": {
        "name": "阿豪",
        "role": "速食店",
        "image": "dialogue/images/clerk-zhiwei.jpg",
        "intro": "嗨！我是速食店的服務員。在這裡你可以練習點餐、客製化你的餐點，還有餐點等太久時怎麼開口問。"
      }
    },
    {
      "id": "stationery_store",
      "name": "文具店",
      "icon": "✏️",
      "color": "#4F46E5",
      "part": 1,
      "situations": 6,
      "scene": "dialogue/images/scenes/stationery_store.webp",
      "clerk": {
        "name": "阿宏",
        "role": "文具店",
        "image": "dialogue/images/clerk-yunzhe.jpg",
        "intro": "你好！我是文具店的店員阿宏。在這裡你可以練習找文具、詢問特賣活動，還有遇到找零問題時怎麼說。"
      }
    },
    {
      "id": "phone_reservation",
      "name": "電話預約",
      "icon": "📞",
      "color": "#0891B2",
      "part": 3,
      "situations": 3,
      "scene": "dialogue/images/scenes/phone_reservation.webp",
      "clerk": {
        "name": "小晴",
        "role": "電話客服",
        "image": "dialogue/images/clerk-phone.png",
        "intro": "你好！在這裡你可以練習打電話預約——包括診所掛號、髮廊剪髮和餐廳訂位。說話要清楚，讓對方聽得懂喔！"
      }
    },
    {
      "id": "ask_directions",
      "name": "問路",
      "icon": "🗺️",
      "color": "#16A34A",
      "part": 3,
      "situations": 3,
      "scene": "dialogue/images/scenes/ask_directions.webp",
      "clerk": {
        "name": "小芸",
        "role": "熱心路人",
        "image": "dialogue/images/clerk-directions.png",
        "intro": "你好！在這裡你可以練習在外面問路——問捷運站、公車站，還有迷路時怎麼跟路人求助。「不好意思」要先說！"
      }
    },
    {
      "id": "bakery",
      "name": "麵包店",
      "icon": "🍞",
      "color": "#A16207",
      "part": 1,
      "situations": 4,
      "scene": "dialogue/images/scenes/bakery.webp",
      "clerk": {
        "name": "阿柔",
        "role": "麵包店",
        "image": "dialogue/images/clerk-bakery.png",
        "intro": "你好！我是麵包店的老闆阿柔。在這裡你可以練習詢問麵包口味、購買點心，還有麵包賣完時怎麼辦。剛出爐的麵包最香囉！"
      }
    },
    {
      "id": "beauty_store",
      "name": "美妝雜貨店",
      "icon": "💄",
      "color": "#C026D3",
      "part": 1,
      "situations": 4,
      "scene": "dialogue/images/scenes/beauty_store.webp",
      "clerk": {
        "name": "萱萱",
        "role": "美妝雜貨店",
        "image": "dialogue/images/clerk-beauty.png",
        "intro": "你好！我是美妝雜貨店的店員萱萱。在這裡你可以練習找保養品、請店員推薦商品，還有詢問特價活動怎麼說。"
      }
    },
    {
      "id": "drink_shop",
      "name": "手搖飲料店",
      "icon": "🧋",
      "color": "#0D9488",
      "part": 2,
      "situations": 4,
      "scene": "dialogue/images/scenes/drink_shop.webp",
      "clerk": {
        "name": "小茜",
        "role": "手搖飲料店",
        "image": "dialogue/images/clerk-drink.png",
        "intro": "你好！我是手搖飲料店的店員小茜。在這裡你可以練習點飲料、說出甜度冰塊，還有點錯了要怎麼禮貌地更正。"
      }
    },
    {
      "id": "lunchbox_shop",
      "name": "便當店",
      "icon": "🍱",
      "color": "#9A3412",
      "part": 2,
      "situations": 4,
      "scene": "dialogue/images/scenes/lunchbox_shop.webp",
      "clerk": {
        "name": "老王",
        "role": "便當店",
        "image": "dialogue/images/clerk-lunchbox.png",
        "intro": "你好！我是便當店的老闆老王。在這裡你可以練習點便當、詢問今日特餐，還有等太久時怎麼有禮貌地開口問。"
      }
    },
    {
      "id": "coffee_shop",
      "name": "咖啡店",
      "icon": "☕",
      "color": "#78350F",
      "part": 2,
      "situations": 4,
      "scene": "dialogue/images/scenes/coffee_shop.webp",
      "clerk": {
        "name": "阿澄",
        "role": "咖啡店",
        "image": "dialogue/images/clerk-coffee.png",
        "intro": "你好！我是咖啡店的店員阿澄。在這裡你可以練習點咖啡、詢問座位插座，還有點錯口味時怎麼更正。"
      }
    },
    {
      "id": "post_office",
      "name": "郵局櫃臺",
      "icon": "📮",
      "color": "#1D4ED8",
      "part": 3,
      "situations": 4,
      "scene": "dialogue/images/scenes/post_office.webp",
      "clerk": {
        "name": "阿珍",
        "role": "郵局櫃臺",
        "image": "dialogue/images/clerk-postoffice.png",
        "intro": "你好！我是郵局櫃檯人員阿珍。在這裡你可以練習寄包裹、買郵票，還有詢問多久會送到怎麼說。"
      }
    },
    {
      "id": "library",
      "name": "圖書館",
      "icon": "📚",
      "color": "#155E75",
      "part": 3,
      "situations": 4,
      "scene": "dialogue/images/scenes/library.webp",
      "clerk": {
        "name": "靜姐",
        "role": "圖書館",
        "image": "dialogue/images/clerk-library.png",
        "intro": "你好！我是圖書館的館員靜姐。在這裡你可以練習借書、辦借書證，還有還書逾期時怎麼禮貌地應對。"
      }
    },
    {
      "id": "police_station",
      "name": "警察局",
      "icon": "🚓",
      "color": "#1E3A8A",
      "part": 3,
      "situations": 4,
      "scene": "dialogue/images/scenes/police_station.webp",
      "clerk": {
        "name": "阿凱",
        "role": "警察局",
        "image": "dialogue/images/clerk-police.png",
        "intro": "你好！我是警察局的警員阿凱。在這裡你可以練習報案、遺失物招領，還有遇到危險時怎麼向警察求助。"
      }
    },
    {
      "id": "anti_scam",
      "name": "接到詐騙電話",
      "icon": "📱",
      "color": "#DC2626",
      "part": 4,
      "situations": 4,
      "scene": "dialogue/images/scenes/anti_scam.webp",
      "clerk": {
        "name": "阿威",
        "role": "反詐騙宣導員",
        "image": "dialogue/images/clerk-antiscam.jpg",
        "intro": "你好！我是反詐騙宣導員阿威。在這裡你可以練習接到詐騙電話怎麼保護自己，像是中獎詐騙、假客服、借提款卡、買點數。記住四步：不給錢、不給資料、掛電話、告訴大人！"
      }
    },
    {
      "id": "classmate_borrow",
      "name": "同學借錢",
      "icon": "🤝",
      "color": "#0891B2",
      "part": 4,
      "situations": 3,
      "scene": "dialogue/images/scenes/classmate_borrow.webp",
      "clerk": {
        "name": "小傑",
        "role": "同班同學",
        "image": "dialogue/images/clerk-classmate.jpg",
        "intro": "嗨！我是你的同學小傑。在這裡你可以練習同學跟你借錢時怎麼辦，包括怎麼好好拒絕、怎麼說清楚理由、請他去找老師幫忙，還有借出去的錢怎麼開口要回來。"
      }
    },
    {
      "id": "online_scam",
      "name": "網路詐騙",
      "icon": "💻",
      "color": "#EA580C",
      "part": 4,
      "situations": 2,
      "scene": "dialogue/images/scenes/online_scam.webp",
      "clerk": {
        "name": "阿睿",
        "role": "網路安全老師",
        "image": "dialogue/images/clerk-onlinescam.jpg",
        "intro": "你好！我是網路安全老師阿睿。在這裡你可以練習在網路上遇到陌生人要你花錢時怎麼保護自己，像是假網拍叫你先匯款、中獎簡訊叫你點連結。記住：不先匯款、不點陌生連結、不給帳號密碼！"
      }
    },
    {
      "id": "self_protect",
      "name": "保護自己的錢",
      "icon": "🛡️",
      "color": "#0D9488",
      "part": 4,
      "situations": 2,
      "scene": "dialogue/images/scenes/self_protect.webp",
      "clerk": {
        "name": "安安",
        "role": "金錢安全老師",
        "image": "dialogue/images/clerk-selfprotect.jpg",
        "intro": "你好！我是金錢安全老師安安。在這裡你可以練習怎麼主動保護自己的錢，像是被人勒索要錢怎麼辦、錢和密碼怎麼保管好、撿到別人的錢怎麼處理。"
      }
    },
    {
      "id": "job_scam",
      "name": "打工陷阱",
      "icon": "💼",
      "color": "#D97706",
      "part": 4,
      "situations": 3,
      "scene": "dialogue/images/scenes/job_scam.webp",
      "clerk": {
        "name": "阿全",
        "role": "打工防詐老師",
        "image": "dialogue/images/clerk-jobguard.jpg",
        "intro": "你好！我是打工防詐老師阿全。在這裡你可以練習找打工時怎麼保護自己，像是有人要你先繳保證金、押證件，或說有太好賺的工作。記住三不：不先繳錢、不押證件、不借帳戶！"
      }
    },
    {
      "id": "privacy_protect",
      "name": "保護個人資料",
      "icon": "🔐",
      "color": "#4F46E5",
      "part": 4,
      "situations": 3,
      "scene": "dialogue/images/scenes/privacy_protect.webp",
      "clerk": {
        "name": "小薇",
        "role": "資安老師",
        "image": "dialogue/images/clerk-privacy.jpg",
        "intro": "你好！我是資安老師小薇。在這裡你可以練習保護個人資料，像是驗證碼不唸給別人、問卷個資不亂填、帳號密碼不外借。記住：個資就像家裡的鑰匙，不能隨便交出去！"
      }
    },
    {
      "id": "take_bus",
      "name": "搭公車",
      "icon": "🚌",
      "color": "#059669",
      "part": 5,
      "situations": 3,
      "scene": "dialogue/images/scenes/take_bus.webp",
      "clerk": {
        "name": "阿源",
        "role": "公車",
        "image": "dialogue/images/clerk-takebus.jpg",
        "intro": "你好！我是公車司機阿源。在這裡你可以練習搭公車，包括先確認路線、上車刷卡或投現，還有零錢不夠、坐過站時怎麼開口求助。"
      }
    },
    {
      "id": "mrt_station",
      "name": "捷運站",
      "icon": "🚇",
      "color": "#0284C7",
      "part": 5,
      "situations": 3,
      "scene": "dialogue/images/scenes/mrt_station.webp",
      "clerk": {
        "name": "阿潔",
        "role": "捷運站",
        "image": "dialogue/images/clerk-mrtstaff.jpg",
        "intro": "你好！我是捷運站務員阿潔。在這裡你可以練習搭捷運，包括不會買票請人教、卡片刷不過去要加值、搭錯方向怎麼問。有問題找站務員就對了！"
      }
    },
    {
      "id": "train_ticket",
      "name": "火車站售票口",
      "icon": "🚆",
      "color": "#B45309",
      "part": 5,
      "situations": 3,
      "scene": "dialogue/images/scenes/train_ticket.webp",
      "clerk": {
        "name": "惠姐",
        "role": "火車站售票口",
        "image": "dialogue/images/clerk-trainticket.jpg",
        "intro": "你好！我是火車站售票口的惠姐。在這裡你可以練習到售票口買票，包括說清楚目的地和車種、付錢確認找零、問月台，還有趕不上車、車票不見時怎麼辦。"
      }
    },
    {
      "id": "taxi",
      "name": "搭計程車",
      "icon": "🚕",
      "color": "#CA8A04",
      "part": 5,
      "situations": 3,
      "scene": "dialogue/images/scenes/taxi.webp",
      "clerk": {
        "name": "陳伯",
        "role": "計程車",
        "image": "dialogue/images/clerk-taxi.jpg",
        "intro": "你好！我是計程車司機陳伯。在這裡你可以練習搭計程車，包括上車前先問價錢確認預算、說清楚目的地、下車付錢確認找零，不舒服也要開口說。"
      }
    },
    {
      "id": "easycard_service",
      "name": "悠遊卡服務台",
      "icon": "💳",
      "color": "#7C3AED",
      "part": 5,
      "situations": 3,
      "scene": "dialogue/images/scenes/easycard_service.webp",
      "clerk": {
        "name": "小昀",
        "role": "悠遊卡服務台",
        "image": "dialogue/images/clerk-easycard.jpg",
        "intro": "你好！我是悠遊卡服務台的小昀。在這裡你可以練習加值後確認餘額、卡片掉了趕快掛失、辦學生卡要帶什麼。"
      }
    },
    {
      "id": "ride_manner",
      "name": "車廂禮儀與求助",
      "icon": "🚈",
      "color": "#DB2777",
      "part": 5,
      "situations": 3,
      "scene": "dialogue/images/scenes/ride_manner.webp",
      "clerk": {
        "name": "車長",
        "role": "車廂禮儀",
        "image": "dialogue/images/clerk-ridemanner.jpg",
        "intro": "你好，我是車長，在這裡你可以練習車廂裡的禮儀與求助——像是讓座給需要的人、有禮貌請人幫忙，還有陌生人跟你要錢時怎麼拒絕、找站務員"
      }
    },
    {
      "id": "cinema",
      "name": "電影院",
      "icon": "🎬",
      "color": "#6D28D9",
      "part": 6,
      "situations": 3,
      "scene": "dialogue/images/scenes/cinema.webp",
      "clerk": {
        "name": "阿哲",
        "role": "電影院",
        "image": "dialogue/images/clerk-cinema.jpg",
        "intro": "你好！我是電影院服務員阿哲。在這裡你可以練習買電影票，包括選場次、用學生證買優惠票、加購前想想預算，遲到了也知道怎麼辦。"
      }
    },
    {
      "id": "ktv",
      "name": "KTV",
      "icon": "🎤",
      "color": "#E11D48",
      "part": 6,
      "situations": 3,
      "scene": "dialogue/images/scenes/ktv.webp",
      "clerk": {
        "name": "小雅",
        "role": "KTV",
        "image": "dialogue/images/clerk-ktv.jpg",
        "intro": "歡迎光臨！我是 KTV 服務員小雅。在這裡你可以練習問清楚計費、算總價大家分攤、時間到照預算收手，還有點歌機不會用怎麼請人教。"
      }
    },
    {
      "id": "swimming_pool",
      "name": "游泳池",
      "icon": "🏊",
      "color": "#0891B2",
      "part": 6,
      "situations": 3,
      "scene": "dialogue/images/scenes/swimming_pool.webp",
      "clerk": {
        "name": "小藍",
        "role": "游泳池",
        "image": "dialogue/images/clerk-pool.jpg",
        "intro": "你好！我是游泳池的救生員小藍。在這裡你可以練習買學生票、租置物櫃認識押金、東西不見了到服務台找回來。"
      }
    },
    {
      "id": "amusement_park",
      "name": "遊樂園",
      "icon": "🎡",
      "color": "#EA580C",
      "part": 6,
      "situations": 3,
      "scene": "dialogue/images/scenes/amusement_park.webp",
      "clerk": {
        "name": "小樂",
        "role": "遊樂園",
        "image": "dialogue/images/clerk-park.jpg",
        "intro": "歡迎光臨，我是遊樂園的工作人員小樂，在這裡你可以練習算一算哪種票划算、問設施安全限制，還有和朋友走散時找工作人員、在原地等。"
      }
    },
    {
      "id": "arcade",
      "name": "電子遊樂場",
      "icon": "🕹️",
      "color": "#9333EA",
      "part": 6,
      "situations": 3,
      "scene": "dialogue/images/scenes/arcade.webp",
      "clerk": {
        "name": "阿翔",
        "role": "電子遊樂場",
        "image": "dialogue/images/clerk-arcade.jpg",
        "intro": "歡迎光臨！我是遊樂場的店員阿翔。在這裡你可以練習換代幣控制預算、夾娃娃先設上限說到做到，機台吃錢不拍不踢找店員。"
      }
    },
    {
      "id": "comic_store",
      "name": "漫畫店",
      "icon": "📚",
      "color": "#16A34A",
      "part": 6,
      "situations": 3,
      "scene": "dialogue/images/scenes/comic_store.webp",
      "clerk": {
        "name": "小昕",
        "role": "漫畫店",
        "image": "dialogue/images/clerk-comic.jpg",
        "intro": "歡迎光臨！我是漫畫店的店員小昕。在這裡你可以練習租書認識押金和逾期費、遲還了誠實道歉，還有分辨辦會員留哪些資料合理、哪些絕對不能給。"
      }
    },
    {
      "id": "job_interview",
      "name": "打工面試",
      "icon": "🤝",
      "color": "#2563EB",
      "part": 7,
      "situations": 3,
      "scene": "dialogue/images/scenes/job_interview.webp",
      "clerk": {
        "name": "阿宏店長",
        "role": "打工面試",
        "image": "dialogue/images/clerk-jobinterview.jpg",
        "intro": "你好！我是阿宏店長。在這裡你可以練習打工面試，包括自我介紹、誠實回答問題，還有問清楚時薪和發薪日；遇到要先繳錢的，記得先回家問大人喔！"
      }
    },
    {
      "id": "first_day",
      "name": "第一天報到",
      "icon": "📋",
      "color": "#0D9488",
      "part": 7,
      "situations": 3,
      "scene": "dialogue/images/scenes/first_day.webp",
      "clerk": {
        "name": "志豪",
        "role": "第一天上班",
        "image": "dialogue/images/clerk-firstday.jpg",
        "intro": "嗨！我是帶你的學長志豪。在這裡你可以練習第一天報到，包括主動打招呼、聽工作說明複誦重點、問清楚制服和置物。"
      }
    },
    {
      "id": "ask_at_work",
      "name": "不懂就問",
      "icon": "🙋",
      "color": "#F59E0B",
      "part": 7,
      "situations": 3,
      "scene": "dialogue/images/scenes/ask_at_work.webp",
      "clerk": {
        "name": "陳師傅",
        "role": "工作中求助",
        "image": "dialogue/images/clerk-senior.jpg",
        "intro": "你好！我是你的資深同事陳師傅。在這裡你可以練習工作中最重要的能力，像是聽不懂就問、做錯了主動承認、不會操作請人示範。"
      }
    },
    {
      "id": "call_leave",
      "name": "打電話請假",
      "icon": "📞",
      "color": "#DC2626",
      "part": 7,
      "situations": 3,
      "scene": "dialogue/images/scenes/call_leave.webp",
      "clerk": {
        "name": "林店長",
        "role": "電話請假",
        "image": "dialogue/images/clerk-callleave.jpg",
        "intro": "你好！我是店裡的林店長。在這裡你可以練習打電話請假，包括生病提早說、臨時有事誠心道歉配合補班、要遲到先通知。"
      }
    },
    {
      "id": "get_paid",
      "name": "領薪水",
      "icon": "💵",
      "color": "#65A30D",
      "part": 7,
      "situations": 3,
      "scene": "dialogue/images/scenes/get_paid.webp",
      "clerk": {
        "name": "秀琴阿姨",
        "role": "領薪水",
        "image": "dialogue/images/clerk-payday.jpg",
        "intro": "你好！我是公司的會計秀琴阿姨。在這裡你可以練習領薪水，包括時薪乘時數自己算一次、當面點清楚、發現算錯有禮貌反映，最後別忘了先存一部分。"
      }
    },
    {
      "id": "serve_customer",
      "name": "接待客人",
      "icon": "👥",
      "color": "#4F46E5",
      "part": 7,
      "situations": 3,
      "scene": "dialogue/images/scenes/serve_customer.webp",
      "clerk": {
        "name": "客人",
        "role": "接待客人",
        "image": "dialogue/images/clerk-customer.jpg",
        "intro": "這次換你當店員囉！在這裡你可以練習接待客人，像是說歡迎光臨和謝謝光臨、被客人問倒了找懂的人、客人不高興先道歉再請主管。"
      }
    }
  ],
  "levels": [
    {
      "id": 1,
      "title": "數一數零用錢",
      "skill": "C2",
      "icon": "💰"
    },
    {
      "id": 2,
      "title": "去 ATM 領錢",
      "skill": "A5",
      "icon": "🏧"
    },
    {
      "id": 3,
      "title": "出門買東西",
      "skill": "C5",
      "icon": "🍱"
    },
    {
      "id": 4,
      "title": "結帳找零錢",
      "skill": "C6",
      "icon": "💸"
    },
    {
      "id": 5,
      "title": "路邊比一比",
      "skill": "B4",
      "icon": "🏷️"
    },
    {
      "id": 6,
      "title": "回家路上要小心",
      "skill": "安全",
      "icon": "🛡️"
    },
    {
      "id": 7,
      "title": "存錢買物品",
      "skill": "B3",
      "icon": "🐷"
    }
  ],
  "students": [
    {
      "name": "小明",
      "emoji": "👦",
      "color": "#DBEAFE",
      "gender": "male",
      "voiceKeyword": "雲哲",
      "image": "dialogue/images/xiaoming.png",
      "demoClips": [
        "dialogue/audio/student/stu_xiaoming_7eca689f.mp3",
        "dialogue/audio/student/stu_xiaoming_4a16ae34.mp3"
      ],
      "demoText": "你好，我是小明，我要點餐。"
    },
    {
      "name": "小玲",
      "emoji": "👧",
      "color": "#FCE7F3",
      "gender": "female",
      "voiceKeyword": "Yating",
      "image": "dialogue/images/xiaoling.png",
      "demoClips": [
        "dialogue/audio/student/stu_xiaoling_7eca689f.mp3",
        "dialogue/audio/student/stu_xiaoling_4a16ae34.mp3"
      ],
      "demoText": "你好，我是小玲，我要點餐。"
    },
    {
      "name": "小婷",
      "emoji": "👩",
      "color": "#EDE9FE",
      "gender": "female",
      "voiceKeyword": "曉臻",
      "image": "dialogue/images/xiaoting.png",
      "demoClips": [
        "dialogue/audio/student/stu_xiaoting_7eca689f.mp3",
        "dialogue/audio/student/stu_xiaoting_4a16ae34.mp3"
      ],
      "demoText": "你好，我是小婷，我要點餐。"
    },
    {
      "name": "小恩",
      "emoji": "🧑",
      "color": "#FEF3C7",
      "gender": "neutral",
      "voiceKeyword": "曉雨",
      "image": "dialogue/images/xiaoen.png",
      "demoClips": [
        "dialogue/audio/student/stu_xiaoen_7eca689f.mp3",
        "dialogue/audio/student/stu_xiaoen_4a16ae34.mp3"
      ],
      "demoText": "你好，我是小恩，我要點餐。"
    }
  ],
  "advChars": [
    {
      "id": "boy",
      "emoji": "👦",
      "image": "adventure/images/adv-xiaoxiang.png",
      "name": "小翔",
      "desc": "喜歡冒險的青少年"
    },
    {
      "id": "girl",
      "emoji": "👧",
      "image": "adventure/images/adv-xiaohua.png",
      "name": "小花",
      "desc": "愛買文具的認真女生"
    },
    {
      "id": "kid",
      "emoji": "👧",
      "image": "adventure/images/adv-xiaorui.png",
      "name": "小芮",
      "desc": "節儉又細心的女生"
    },
    {
      "id": "teen",
      "emoji": "🧑",
      "image": "adventure/images/adv-xiaokai.png",
      "name": "小凱",
      "desc": "愛吃美食的大男孩"
    }
  ],
  "games": [
    {
      "id": "g1",
      "url": "games/g1-bubble/index.html",
      "emoji": "🫧",
      "name": "數字泡泡",
      "desc": "點破目標數字泡泡！或依序接龍挑戰速度與記憶！"
    },
    {
      "id": "g2",
      "url": "games/g2-coin/index.html",
      "emoji": "🪙",
      "name": "錢幣接接樂",
      "desc": "接住正確的硬幣，剛好湊到目標金額！"
    },
    {
      "id": "g3",
      "url": "games/g3-checkout/index.html",
      "emoji": "🛒",
      "name": "超市閃電結帳",
      "desc": "看商品價格，心算總價，搶先選出正確答案！"
    },
    {
      "id": "g4",
      "url": "games/g4-change/index.html",
      "emoji": "💸",
      "name": "快速找零",
      "desc": "看商品和付款金額，選出正確的找零組合！"
    },
    {
      "id": "g5",
      "url": "games/g5-samenum/index.html",
      "emoji": "🔢",
      "name": "數字消消樂",
      "desc": "點擊相鄰同數字一起消除，群組越大分越高！"
    },
    {
      "id": "g6",
      "url": "games/g6-memory/index.html",
      "emoji": "🪙",
      "name": "硬幣翻翻樂",
      "desc": "翻開硬幣，找出面額相同的一對！"
    },
    {
      "id": "g7",
      "url": "games/g7-snake/index.html",
      "emoji": "🐍",
      "name": "貪食蛇數字闖關",
      "desc": "操控蛇吃數字！三種模式：自由、指定、順序闖關。"
    },
    {
      "id": "g9",
      "url": "games/g9-cardwar/index.html",
      "emoji": "🃏",
      "name": "比大小",
      "desc": "從牌堆翻出一張牌，看誰的點數高就贏！挑戰電腦或雙人對決。"
    },
    {
      "id": "g12",
      "url": "games/g12-rps/index.html",
      "emoji": "✊",
      "name": "猜拳大戰",
      "desc": "石頭剪刀布！選 3/5/7 局制，挑戰電腦（三種難度）或雙人對決。"
    },
    {
      "id": "g10",
      "url": "games/g10-cup/index.html",
      "emoji": "🏺",
      "name": "硬幣躲貓貓",
      "desc": "看清楚東西藏在哪個杯子，洗牌後猜出它在哪！"
    },
    {
      "id": "g14",
      "url": "games/g14-mole/index.html",
      "emoji": "🐹",
      "name": "打地鼠賺金幣",
      "desc": "地鼠冒出來了！亂打賺分或挑戰指定面額，連擊越多分越高！"
    },
    {
      "id": "g13",
      "url": "games/g13-toast/index.html",
      "emoji": "🍽️",
      "name": "美味餐點大作戰",
      "desc": "拖曳盤子穿過左右兩道門，接住食物！選對服務對象喜歡的食物，得分越高越好！"
    },
    {
      "id": "g11",
      "url": "games/g11-pour/index.html",
      "emoji": "🥤",
      "name": "汽水倒倒樂",
      "desc": "按住按鈕倒汽水，精準停在目標線，別讓它溢出來！"
    }
  ]
};
