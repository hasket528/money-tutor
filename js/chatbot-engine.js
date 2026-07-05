/**
 * chatbot-engine.js — 金錢小助手聊天機器人引擎
 *
 * 離線規則型，依 window.TutorContext 提供情境化對話。
 * 支援：選項樹點擊、文字輸入關鍵字比對、語音朗讀、麵包屑導航。
 */
(function () {
    'use strict';

    // ================================================================
    // 🔧 Feature Flag
    //    true   = 正式啟用（2026-04-30 全站啟用）
    //    若需停用：改回 false
    // ================================================================
    const CHATBOT_ENABLED = true;
    // ================================================================

    if (!CHATBOT_ENABLED) return;

    // ── 常數 ──────────────────────────────────────────────────────
    const MASCOT_IMG = '../images/common/money_doctor.png'; // 錢博士
    // 預錄語音存放目錄（相對各單元 HTML；檔名見 voicegen/lists/*.csv）
    const AUDIO_BASE = '../audio/chatbot/';
    /** 答錯 N 次後，自動顯示徽章邀請學生提問 */
    const BADGE_ERROR_THRESHOLD = 3;

    // ── 引擎狀態 ──────────────────────────────────────────────────
    const State = {
        isOpen:         false,
        voiceEnabled:   true,
        hasGreeted:     false,
        currentNode:    '',
        breadcrumb:     [],
        voices:         [],
        lastContextKey: '',
        shownCards:     new Set(),
        cardMode:       false,
        lastSpeak:      null,   // { text, type } 供 🔊 重播用
        currentCardUnit: '',    // 目前知識卡的來源單元/系列 key（標籤與「再看一個」用）
        currentCardId:   '',    // 目前知識卡 id（避免「再看一個」立即重複）
    };

    // ── 單元標籤對照表（Fix 2：知識卡顯示主題標籤）────────────────
    const UNIT_LABELS = {
        a1: '🥤 A1 販賣機',      a2: '💇 A2 理髮廳',    a3: '🍔 A3 麥當勞',
        a4: '🛒 A4 超市購物',    a5: '🏧 A5 ATM',        a6: '🚂 A6 火車票',
        b1: '💰 B1 今天帶多少錢', b2: '📔 B2 零用錢日記', b3: '🐷 B3 存錢計畫',
        b4: '🏷️ B4 特賣比一比', b5: '🎉 B5 生日派對',   b6: '🥬 B6 菜市場',
        b:  '📒 B 系列 預算規劃',
        c1: '🪙 C1 認識錢幣',    c2: '🔢 C2 數錢',       c3: '🔄 C3 換錢',
        c4: '💳 C4 付款',        c5: '✅ C5 夠不夠',     c6: '💸 C6 找零',
        c:  '💴 C 系列 貨幣認知',
        f1: '1️⃣ F1 一對一對應', f2: '🎵 F2 唱數',       f3: '🔢 F3 數字認讀',
        f4: '📊 F4 數字排序',    f5: '⚖️ F5 量比較',    f6: '🧩 F6 數的組成',
        f:  '🔢 F 系列 數學基礎',
    };

    // ── 對話樹 ────────────────────────────────────────────────────
    // 內容以 chatbot-content.js 為主；此處保留 fallback（chatbot-content.js 未載入時使用）
    // ─────────────────────────────────────────────────────────────
    const DIALOG_FALLBACK = {

        // ════════════════════════════════════════════════════════
        // 全域節點（所有單元通用）
        // ════════════════════════════════════════════════════════

        'global-root': {
            text: '你好！我是金博士 🪙\n我可以幫你解決哪種問題？',
            options: [
                { label: '🎮 怎麼玩這個遊戲？',   next: 'global-rules' },
                { label: '😕 我不會，太難了',      next: 'global-stuck' },
                { label: '💰 金錢知識問題',        next: 'global-money' },
                { label: '💡 我需要提示',          next: 'global-hint-redirect' },
            ],
        },

        'global-rules': {
            text: '每個遊戲都有 💡提示 按鈕，\n點一下可以得到步驟提示喔！\n\n不確定規則的話，可以回設定頁再看一次說明。',
            options: [
                { label: '👍 我懂了！',    reply: '太棒了！加油，你一定可以的！💪' },
                { label: '⬅️ 回主選單',   next: 'global-root' },
            ],
        },

        'global-stuck': {
            text: '沒關係！遇到困難是正常的 😊\n我們一起來想想看！\n\n你是卡在哪一步？',
            options: [
                { label: '💰 不知道要付多少錢',     next: 'global-money-calc' },
                { label: '🔢 找零算不出來',         next: 'global-money-change' },
                { label: '❓ 不知道下一步要做什麼', next: 'global-next-step' },
                { label: '⬅️ 回主選單',             next: 'global-root' },
            ],
        },

        'global-money': {
            text: '你想了解哪方面的金錢知識？',
            options: [
                { label: '🪙 硬幣和紙鈔有哪些？',  next: 'global-money-coins' },
                { label: '📝 怎麼算要付多少？',     next: 'global-money-calc' },
                { label: '💸 找零怎麼算？',         next: 'global-money-change' },
                { label: '✅ 錢夠不夠怎麼判斷？',   next: 'global-money-enough' },
                { label: '⬅️ 回主選單',             next: 'global-root' },
            ],
        },

        'global-money-coins': {
            text: '台灣常用的錢有這幾種：\n\n🪙 硬幣：1元、5元、10元、50元\n💴 紙鈔：100元、500元、1000元\n\n數字越大，面額越大喔！',
            options: [
                { label: '📝 怎麼算要付多少？',  next: 'global-money-calc' },
                { label: '👍 我懂了！',  reply: '很好！記住面額，付錢就更容易了 💪' },
                { label: '⬅️ 回主選單', next: 'global-root' },
            ],
        },

        'global-money-calc': {
            text: '付錢的步驟：\n\n1️⃣ 先看商品的價格\n2️⃣ 從大面額的錢開始拿\n3️⃣ 一張一張加起來\n4️⃣ 加到「夠了」就可以付！',
            options: [
                { label: '💸 那找零怎麼算？',  next: 'global-money-change' },
                { label: '👍 我懂了！',  reply: '很好！先從大面額的開始，就不會選太多 😊' },
                { label: '⬅️ 回主選單', next: 'global-root' },
            ],
        },

        'global-money-change': {
            text: '找零的算法：\n\n💰 你付的錢 → 50元\n🏷️ 商品價格 → 35元\n\n找零 ＝ 50 － 35 ＝ 15元 ✅\n\n「你付的錢」減掉「商品價格」就是找零！',
            options: [
                { label: '✅ 錢夠不夠怎麼判斷？', next: 'global-money-enough' },
                { label: '👍 我懂了！',  reply: '很好！找零就是「付的」減「價格」，記住這個公式 💪' },
                { label: '⬅️ 回主選單', next: 'global-root' },
            ],
        },

        'global-money-enough': {
            text: '判斷錢夠不夠：\n\n你的錢 ≥ 商品價格 → ✅ 夠了！\n你的錢 ＜ 商品價格 → ❌ 不夠！\n\n例如：手上 30元，商品 25元 → 夠了！\n例如：手上 20元，商品 25元 → 不夠！',
            options: [
                { label: '👍 我懂了！',  reply: '很好！手上的錢大於等於價格就夠了 😊' },
                { label: '⬅️ 回主選單', next: 'global-root' },
            ],
        },

        'global-next-step': {
            text: '不知道下一步？\n\n試試點畫面上的 💡提示 按鈕，\n它會幫你找到下一步要做什麼喔！',
            options: [
                { label: '💰 付錢相關問題',  next: 'global-money-calc' },
                { label: '💸 找零相關問題',  next: 'global-money-change' },
                { label: '⬅️ 回主選單',     next: 'global-root' },
            ],
        },

        'global-hint-redirect': {
            text: '需要提示的話，點畫面上的提示按鈕！\n它會直接告訴你現在要做什麼步驟，\n或者你想問我具體的問題嗎？',
            options: [
                { label: '💰 付錢怎麼做？',  next: 'global-money-calc' },
                { label: '💸 找零怎麼算？',  next: 'global-money-change' },
                { label: '⬅️ 回主選單',     next: 'global-root' },
            ],
        },

        // ════════════════════════════════════════════════════════
        // A 系列通用節點
        // ════════════════════════════════════════════════════════

        'a-root': {
            text: '你在練習購物 🛍️\n遇到什麼問題了？',
            options: [
                { label: '🏷️ 不知道商品多少錢',  next: 'a-price-help' },
                { label: '💰 不知道要付多少',     next: 'global-money-calc' },
                { label: '💸 找零算不出來',       next: 'global-money-change' },
                { label: '❓ 其他問題',           next: 'global-root' },
            ],
        },

        'a-price-help': {
            text: '商品的價格通常顯示在\n商品圖片的下方或旁邊 🏷️\n\n找到價格後，再決定要付多少錢喔！',
            options: [
                { label: '💰 那要付多少錢？', next: 'global-money-calc' },
                { label: '👍 我找到了！', reply: '太好了！找到價格是第一步，繼續加油！💪' },
                { label: '⬅️ 回主選單',    next: 'a-root' },
            ],
        },

        // ════════════════════════════════════════════════════════
        // A1 販賣機專屬節點
        // ════════════════════════════════════════════════════════

        'a1-root': {
            text: '你在練習使用販賣機 🥤\n遇到什麼問題了？',
            options: [
                { label: '🥤 怎麼選商品？',    next: 'a1-select-item' },
                { label: '💰 怎麼投硬幣？',    next: 'a1-insert-coin' },
                { label: '🔢 要投多少才夠？',  next: 'a1-how-much' },
                { label: '💸 找零在哪裡拿？',  next: 'a1-change-location' },
            ],
        },

        'a1-selectItem-root': {
            text: (ctx) => {
                const d = ctx.getLiveData?.() || {};
                if (d.itemName) {
                    return `這題要買的是「${d.itemName}」🥤\n價格是 ${d.price} 元，\n找到它點一下就可以選喔！\n\n遇到什麼問題嗎？`;
                }
                return '現在要選一個你想買的商品 🥤\n找到喜歡的，點一下就可以選喔！\n\n遇到什麼問題嗎？';
            },
            options: [
                { label: '🥤 怎麼選商品？',    next: 'a1-select-item' },
                { label: '🏷️ 價格在哪裡看？', next: 'a1-where-price' },
                { label: '⬅️ 其他問題',        next: 'a1-root' },
            ],
        },

        'a1-payment-root': {
            text: (ctx) => {
                const d = ctx.getLiveData?.() || {};
                const item  = d.itemName ? `「${d.itemName}」` : '商品';
                const price = d.price  != null ? `${d.price} 元` : '？元';
                const ins   = d.inserted != null ? d.inserted : 0;
                const need  = d.price  != null ? Math.max(0, d.price - ins) : null;

                let t = `現在要買 ${item} 💰\n價格是 ${price}！\n\n`;
                if (need !== null && need > 0) {
                    t += `你已投入 ${ins} 元，還差 ${need} 元 💡\n`;
                } else if (need === 0) {
                    t += `你已投入足夠的金額 ✅\n請按確認購買！\n`;
                } else {
                    t += '把硬幣投入販賣機，湊夠金額就可以買了！\n';
                }
                t += '\n遇到什麼問題嗎？';
                return t;
            },
            options: [
                { label: '💰 怎麼投硬幣？',    next: 'a1-insert-coin' },
                { label: '🔢 要投多少才夠？',  next: 'a1-how-much' },
                { label: '💡 再給我一個提示',  next: 'global-hint-redirect' },
                { label: '⬅️ 其他問題',        next: 'a1-root' },
            ],
        },

        'a1-change-root': {
            text: (ctx) => {
                const d = ctx.getLiveData?.() || {};
                const item   = d.itemName ? `「${d.itemName}」` : '商品';
                const ins    = d.inserted != null ? `${d.inserted} 元` : null;
                const price  = d.price    != null ? `${d.price} 元`    : null;
                const change = d.change   != null && d.change > 0 ? d.change : null;

                let t = `付完錢了！${change ? `\n找零 ${change} 元 💸` : ''}\n\n`;
                if (ins && price) {
                    t += `你付了 ${ins}，商品 ${price}，\n`;
                }
                t += `找零 ＝ 你投的錢 － 商品價格\n`;
                if (change) t += `也就是 ${change} 元，記得拿取物口拿回來喔！\n`;
                t += '\n有什麼問題嗎？';
                return t;
            },
            options: [
                { label: '💸 怎麼算找零？',    next: 'global-money-change' },
                { label: '🪙 找零在哪裡拿？',  next: 'a1-change-location' },
                { label: '⬅️ 其他問題',        next: 'a1-root' },
            ],
        },

        'a1-select-item': {
            text: '選商品的步驟：\n\n1️⃣ 看看販賣機裡有什麼商品\n2️⃣ 找到你想買的那一個\n3️⃣ 點一下商品圖片\n4️⃣ 商品就被選起來了！',
            options: [
                { label: '🏷️ 價格在哪裡看？', next: 'a1-where-price' },
                { label: '👍 我會了！', reply: '很好！選好商品後，下一步就是投硬幣付錢 💰' },
                { label: '⬅️ 回主選單',        next: 'a1-root' },
            ],
        },

        'a1-where-price': {
            text: '商品的價格顯示在\n每個商品圖片的下方 🏷️\n\n例如寫著「35元」就是這個商品\n要花 35 元才能買到喔！',
            options: [
                { label: '💰 那要怎麼付錢？', next: 'a1-insert-coin' },
                { label: '👍 我找到了！', reply: '太好了！記住價格，投幣時才知道要投多少 😊' },
                { label: '⬅️ 回主選單',       next: 'a1-root' },
            ],
        },

        'a1-insert-coin': {
            text: '投硬幣的步驟：\n\n1️⃣ 看商品的價格（例如 35元）\n2️⃣ 點擊錢包裡的硬幣\n3️⃣ 硬幣會自動投入販賣機\n4️⃣ 投到「夠了」就完成！\n\n小技巧：先選大面額的硬幣 😊',
            options: [
                { label: '🔢 要投多少才夠？', next: 'a1-how-much' },
                { label: '👍 我懂了！', reply: '很好！點硬幣投入，湊到夠了就可以付款 💪' },
                { label: '⬅️ 回主選單',       next: 'a1-root' },
            ],
        },

        'a1-how-much': {
            text: '要投多少錢？\n\n投入總金額 ≥ 商品價格 就夠了！\n\n例如：商品 35元\n→ 投 10＋10＋10＋5 ＝ 35元 ✅\n→ 或直接投一枚 50元也可以！\n\n投太多沒關係，多的會找回來 😊',
            options: [
                { label: '💸 多的錢怎麼找回來？', next: 'a1-change-location' },
                { label: '👍 我懂了！', reply: '很好！投入 ≥ 價格就可以，多的會找零給你 💪' },
                { label: '⬅️ 回主選單',           next: 'a1-root' },
            ],
        },

        'a1-change-location': {
            text: '找零就是多投的錢找回來 💸\n\n找零 ＝ 你投的錢 － 商品價格\n\n例如：投了 50元，商品 35元\n→ 找零 ＝ 50 － 35 ＝ 15元\n\n找回來的硬幣會出現在販賣機下方的取物口喔！',
            options: [
                { label: '🔢 找零怎麼計算？', next: 'global-money-change' },
                { label: '👍 我知道了！', reply: '太好了！找到找零就完成這次購物了 🎉' },
                { label: '⬅️ 回主選單',     next: 'a1-root' },
            ],
        },

        // ════════════════════════════════════════════════════════
        // B 系列通用節點
        // ════════════════════════════════════════════════════════

        'b-root': {
            text: '你在練習預算規劃 📒\n遇到什麼問題了？',
            options: [
                { label: '💰 不知道怎麼計算金額', next: 'global-money-calc' },
                { label: '📝 不懂題目要做什麼',   next: 'global-next-step' },
                { label: '😕 太難了不會',          next: 'global-stuck' },
                { label: '❓ 其他問題',            next: 'global-root' },
            ],
        },

        // ════════════════════════════════════════════════════════
        // C 系列通用節點
        // ════════════════════════════════════════════════════════

        'c-root': {
            text: '你在練習認識金錢 💴\n遇到什麼問題了？',
            options: [
                { label: '🪙 硬幣怎麼認？',   next: 'global-money-coins' },
                { label: '🔢 怎麼數錢？',      next: 'c-count-help' },
                { label: '💸 找零怎麼算？',   next: 'global-money-change' },
                { label: '❓ 其他問題',        next: 'global-root' },
            ],
        },

        'c-count-help': {
            text: '數錢的技巧：\n\n1️⃣ 先把錢按面額分類\n2️⃣ 從最大面額開始數\n3️⃣ 一枚一枚加起來\n4️⃣ 最後的總數就是答案！',
            options: [
                { label: '👍 我懂了！',  reply: '很好！從大面額開始數，比較不容易搞混 💪' },
                { label: '⬅️ 回主選單', next: 'c-root' },
            ],
        },

        // ════════════════════════════════════════════════════════
        // F 系列通用節點
        // ════════════════════════════════════════════════════════

        'f-root': {
            text: '你在練習數學基礎 🔢\n遇到什麼問題了？',
            options: [
                { label: '🔢 不知道怎麼數',   next: 'f-count-help' },
                { label: '📐 比大小怎麼比？', next: 'f-compare-help' },
                { label: '😕 太難了不會',      next: 'global-stuck' },
                { label: '❓ 其他問題',        next: 'global-root' },
            ],
        },

        'f-count-help': {
            text: '數數的技巧：\n\n一個一個數，不要跳過任何一個 😊\n用手指著每個物品，數一個指一個\n\n1, 2, 3, 4, 5... 慢慢來不用急！',
            options: [
                { label: '👍 我懂了！',  reply: '很好！慢慢數，一定會數對的 💪' },
                { label: '⬅️ 回主選單', next: 'f-root' },
            ],
        },

        'f-compare-help': {
            text: '比大小的方法：\n\n數字大的 ＝ 比較多 ✅\n數字小的 ＝ 比較少 ✅\n\n例如：5 ＞ 3（5大於3，5比較多）\n例如：2 ＜ 7（2小於7，2比較少）',
            options: [
                { label: '👍 我懂了！',  reply: '很好！數字越大代表越多，記住這個規則 😊' },
                { label: '⬅️ 回主選單', next: 'f-root' },
            ],
        },

    }; // end DIALOG_FALLBACK

    // ── 關鍵字規則 fallback ───────────────────────────────────────
    const KEYWORD_RULES_FALLBACK = [
        { keywords: ['怎麼玩', '規則', '說明', '怎麼操作', '玩法'],  next: 'global-rules' },
        { keywords: ['不會', '太難', '好難', '不懂', '幫幫我'],      next: 'global-stuck' },
        { keywords: ['提示', '不知道下一步', '卡住', '卡關'],        next: 'global-hint-redirect' },
        { keywords: ['硬幣', '面額', '幾元', '哪些錢', '紙鈔'],      next: 'global-money-coins' },
        { keywords: ['付錢', '要付多少', '要多少錢', '怎麼付'],      next: 'global-money-calc' },
        { keywords: ['找零', '找回來', '多的錢', '零錢'],            next: 'global-money-change' },
        { keywords: ['夠不夠', '夠了嗎', '有沒有夠', '夠買嗎'],     next: 'global-money-enough' },
        { keywords: ['投幣', '投硬幣', '怎麼投', '丟硬幣'],         next: 'a1-insert-coin' },
        { keywords: ['選商品', '怎麼選', '選飲料', '選什麼'],       next: 'a1-select-item' },
        { keywords: ['謝謝', '好了', '懂了', '會了', 'OK', 'ok'],   reply: '太棒了！繼續加油，你做得很好 💪🌟' },
        { keywords: ['答案', '直接告訴我', '告訴我答案', '偷看'],
          reply: '我不直接給答案喔 😊\n試試點 💡提示 按鈕，\n它會一步一步帶你做！' },
        { keywords: ['你是誰', '你叫什麼', '你好', '哈囉'],
          reply: '我是金博士 🪙\n專門幫你學習使用金錢的好朋友！\n有問題隨時問我喔 😊' },
    ];

    // chatbot-content.js 優先；未載入時使用 fallback
    const _content = window.ChatbotContent || {};
    const DIALOG        = Object.assign({}, DIALOG_FALLBACK,        _content.DIALOG        || {});
    const KEYWORD_RULES = (_content.KEYWORD_RULES && _content.KEYWORD_RULES.length)
                          ? _content.KEYWORD_RULES
                          : KEYWORD_RULES_FALLBACK;

    // ── 預錄語音檔對照（原始台詞 → 檔名）────────────────────────────
    // 與 voicegen/extract_voice.js 的 filename 規則一致，直接由內容庫反推。
    // speak() 先試 audio/chatbot/{檔名}.mp3→.wav，找不到才用瀏覽器即時 TTS。
    const VOICE_FILES = (function buildVoiceFileMap() {
        const map = new Map();
        const put = (text, file) => { if (text && !map.has(text)) map.set(text, file); };
        const cards = _content.KNOWLEDGE_CARDS || {};
        for (const unit in cards) {
            (cards[unit] || []).forEach(card => put(card.text, 'kb_' + card.id.replace(/-/g, '_')));
        }
        const safety = _content.SAFETY_INTERCEPTION_CARDS || {};
        for (const id in safety) {
            put(safety[id].text, 'safety_' + id.replace(/^safety-/, '').replace(/-/g, '_'));
        }
        for (const nodeId in DIALOG) {
            const node = DIALOG[nodeId];
            if (typeof node.text === 'string') put(node.text, 'qa_' + nodeId.replace(/-/g, '_'));
            (node.options || []).forEach((opt, i) => {
                if (opt.reply) put(opt.reply, 'qa_' + nodeId.replace(/-/g, '_') + '_reply' + (i + 1));
            });
        }
        (KEYWORD_RULES || []).forEach((r, i) => { if (r.reply) put(r.reply, 'kw_reply_' + (i + 1)); });
        // 引擎硬編碼保底句
        put('我沒有完全聽懂 😅\n讓我給你幾個選項，看看哪個能幫到你：', 'eng_input_fallback');
        put('好的！請立刻告訴老師或家長！他們會幫助你的！', 'eng_safety_help');
        put('很好！記住這個安全守則喔！', 'eng_safety_ok');
        put('抱歉，我還在學習這個問題 😊\n可以試試 💡提示 按鈕喔！', 'eng_node_fallback');
        return map;
    })();

    // ── 預錄音檔播放（.mp3 → .wav → TTS 依序後備）────────────────
    let _chatbotAudio = null;
    let _chatbotAudioToken = null;

    function stopChatbotAudio() {
        _chatbotAudioToken = null;              // 使進行中的後備鏈失效
        if (_chatbotAudio) {
            try { _chatbotAudio.pause(); } catch (e) {}
            _chatbotAudio = null;
        }
    }

    // 依序嘗試副檔名；全部失敗才呼叫 onFail（即時 TTS）
    function playChatbotAudio(file, onFail) {
        const exts = ['mp3', 'wav'];
        let i = 0;
        const token = {};
        _chatbotAudioToken = token;
        const tryNext = () => {
            if (_chatbotAudioToken !== token) return;   // 已被新的 speak 取代
            if (i >= exts.length) { onFail && onFail(); return; }
            const audio = new Audio(AUDIO_BASE + file + '.' + exts[i++]);
            _chatbotAudio = audio;
            let advanced = false;                        // 防 onerror + play.catch 雙觸發
            const fail = () => { if (advanced) return; advanced = true; tryNext(); };
            audio.onerror = fail;
            audio.onended = () => { if (_chatbotAudioToken === token) _chatbotAudio = null; };
            audio.play().catch(fail);
        };
        tryNext();
    }

    // ── 語音 ──────────────────────────────────────────────────────
    function loadVoices() {
        if (window.speechSynthesis) {
            State.voices = speechSynthesis.getVoices();
        }
    }

    if (window.speechSynthesis) {
        loadVoices();
        speechSynthesis.addEventListener('voiceschanged', loadVoices);
    }

    // ── 語音文字清理 ─────────────────────────────────────────────
    function cleanForSpeech(text) {
        const digitNames = '零一二三四五六七八九';
        return text
            // 移除所有 Emoji（含 ZWJ 序列，如 👨‍👩‍👧）
            .replace(/\p{Extended_Pictographic}[️⃣]?(‍\p{Extended_Pictographic}[️⃣]?)*/gu, '')
            // 清理殘餘的 Variation Selector／Combining Enclosing Keycap／ZWJ
            .replace(/[️⃣‍]/gu, '')
            // 斜線改為停頓（「50g / 30元」→「50g，30元」）
            .replace(/\s*\/\s*/g, '，')
            // 箭頭改為停頓（「警察 → 110」）
            .replace(/→/g, '，')
            // 數字序列逐字讀（110→一一零，119→一一九）
            .replace(/\d+/g, n => n.split('').map(d => digitNames[+d]).join(''))
            // 換行改為停頓
            .replace(/\n/g, '，');
    }

    // 主入口：先播預錄音檔（若有對應檔名），找不到才用瀏覽器即時 TTS
    function speak(text, type = 'normal') {
        if (!State.voiceEnabled) return;
        State.lastSpeak = { text, type };
        stopChatbotAudio();
        if (window.speechSynthesis) speechSynthesis.cancel();
        const file = VOICE_FILES.get(text);
        if (file) { playChatbotAudio(file, () => speakTTS(text, type)); return; }
        speakTTS(text, type);
    }

    // type: 'normal'=0.8 / 'safety'=0.75（嚴肅）/ 'praise'=0.85（鼓勵上揚）
    function speakTTS(text, type = 'normal') {
        if (!window.speechSynthesis) return;
        const spokenText = cleanForSpeech(text);
        speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(spokenText);
        utt.lang = 'zh-TW';
        const rateMap = { normal: 0.8, safety: 0.75, praise: 0.85 };
        utt.rate = rateMap[type] || 0.8;
        // 金博士語音優先順序：微軟 Online → Google → 系統語音
        // YunJian（云健）需同時比對英文/中文名稱
        // 金博士語音：微軟 Online → Yating（Chrome 備用）→ Google → 其他
        const _msOnline = State.voices.filter(v => /microsoft/i.test(v.name) && /online/i.test(v.name) && v.lang.startsWith('zh'));
        const _msSys    = State.voices.filter(v => /microsoft/i.test(v.name) && !/online/i.test(v.name) && v.lang.startsWith('zh'));
        const _google   = State.voices.filter(v => /google/i.test(v.name) && v.lang.startsWith('zh'));
        const preferred =
            _msOnline.find(v => /yunjian|云健/i.test(v.name)) ||
            _msOnline.find(v => /yunxi|云希|yunyang|云扬/i.test(v.name)) ||
            _msOnline[0] ||
            _msSys.find(v => /yating/i.test(v.name)) ||
            _google[0]   ||
            _msSys[0]    ||
            State.voices.find(v => v.lang === 'zh-TW') ||
            State.voices.find(v => v.lang.startsWith('zh'));
        if (preferred) utt.voice = preferred;
        speechSynthesis.speak(utt);
    }

    // ── 上下文感知根節點選擇 ──────────────────────────────────────
    function getRootNode() {
        const ctx = window.TutorContext || {};

        // 1. unit + phase 完整比對
        if (ctx.unit && ctx.phase) {
            const key = `${ctx.unit}-${ctx.phase}-root`;
            if (DIALOG[key]) return key;
        }
        // 2. unit 比對
        if (ctx.unit) {
            const key = `${ctx.unit}-root`;
            if (DIALOG[key]) return key;
        }
        // 3. 系列比對（a/b/c/f）
        if (ctx.unit) {
            const seriesKey = `${ctx.unit[0]}-root`;
            if (DIALOG[seriesKey]) return seriesKey;
        }
        // 4. 全域根
        return 'global-root';
    }

    // ── DOM 工具 ──────────────────────────────────────────────────
    function getEl(id) { return document.getElementById(id); }

    function scrollMessages() {
        const el = getEl('chatbot-messages');
        if (el) el.scrollTop = el.scrollHeight;
    }

    // ── 訊息渲染 ──────────────────────────────────────────────────
    function addMessage(role, text) {
        const msgs = getEl('chatbot-messages');
        if (!msgs) return;
        const div = document.createElement('div');
        div.className = `chatbot-msg ${role}`;
        // 安全轉義 HTML，再還原 <br>
        const safe = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
        if (role === 'bot') {
            const cardClass  = arguments[2] || '';
            const unitLabel  = arguments[3] || ''; // 單元標籤（僅顯示，不朗讀）
            const labelHTML  = unitLabel
                ? `<div class="chatbot-card-unit-label">${unitLabel}</div>`
                : '';
            div.innerHTML = `
                <div class="chatbot-bubble ${cardClass}">${labelHTML}${safe}</div>`;
        } else {
            div.innerHTML = `<div class="chatbot-bubble">${safe}</div>`;
        }
        msgs.appendChild(div);
        scrollMessages();
    }

    // ── 節點渲染 ──────────────────────────────────────────────────
    function renderNode(nodeId) {
        const node = DIALOG[nodeId];
        if (!node) {
            addMessage('bot', '抱歉，我還在學習這個問題 😊\n可以試試 💡提示 按鈕喔！');
            renderReturnOptions();
            return;
        }
        State.currentNode = nodeId;
        // text 支援函數型（接收 TutorContext 回傳動態字串）或靜態字串
        const ctx = window.TutorContext || {};
        const text = typeof node.text === 'function' ? node.text(ctx) : node.text;
        addMessage('bot', text);
        speak(text);
        renderOptions(node.options || []);
        updateBreadcrumb();
    }

    function renderOptions(options) {
        const optsEl = getEl('chatbot-options');
        if (!optsEl) return;
        optsEl.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chatbot-opt-btn';
            btn.textContent = opt.label;
            btn.addEventListener('click', () => handleOption(opt));
            optsEl.appendChild(btn);
        });
        appendBackToCardsBtn(optsEl);
    }

    function renderReturnOptions() {
        const optsEl = getEl('chatbot-options');
        if (!optsEl) return;
        optsEl.innerHTML = '';
        const btn = document.createElement('button');
        btn.className = 'chatbot-opt-btn';
        btn.textContent = '🔄 再問一個問題';
        btn.addEventListener('click', () => {
            State.breadcrumb = [];
            renderNode(getRootNode());
        });
        optsEl.appendChild(btn);
        appendBackToCardsBtn(optsEl);
    }

    /** Q&A 模式底部：固定加「回知識卡片」出口（有單元時才顯示）*/
    function appendBackToCardsBtn(optsEl) {
        const ctx = window.TutorContext || {};
        if (!ctx.unit) return;
        const sep = document.createElement('div');
        sep.className = 'chatbot-opt-separator';
        optsEl.appendChild(sep);
        const btn = document.createElement('button');
        btn.className = 'chatbot-opt-btn chatbot-back-card-btn';
        btn.textContent = '📚 回知識卡片';
        btn.addEventListener('click', () => {
            State.cardMode = true;
            State.breadcrumb = [];
            const card = pickCard(ctx.unit);
            if (card) renderCard(card);
        });
        optsEl.appendChild(btn);
    }

    // ── 選項點擊處理 ──────────────────────────────────────────────
    function handleOption(opt) {
        addMessage('user', opt.label);

        if (opt.reply) {
            // 終端回覆：顯示話術後回到「再問一個問題」
            addMessage('bot', opt.reply);
            speak(opt.reply);
            const optsEl = getEl('chatbot-options');
            if (optsEl) optsEl.innerHTML = '';
            renderReturnOptions();
            return;
        }

        if (opt.next) {
            // 記錄麵包屑（避免重複）
            const currentNode = DIALOG[State.currentNode];
            if (currentNode && State.currentNode !== opt.next) {
                const crumbLabel = State.currentNode === 'global-root'
                    ? '主選單'
                    : currentNode.text.split('\n')[0]
                        .replace(/\p{Extended_Pictographic}[️⃣]?(‍\p{Extended_Pictographic}[️⃣]?)*/gu, '')
                        .replace(/[️⃣‍]/gu, '')
                        .trim().slice(0, 12) + '…';
                State.breadcrumb.push({ label: crumbLabel, nodeId: State.currentNode });
            }
            renderNode(opt.next);
        }
    }

    // ── 麵包屑導航 ────────────────────────────────────────────────
    function updateBreadcrumb() {
        const el = getEl('chatbot-breadcrumb');
        if (!el) return;
        if (State.breadcrumb.length === 0) { el.innerHTML = ''; return; }
        el.innerHTML = State.breadcrumb.map((crumb, i) =>
            `<span class="chatbot-crumb" data-node="${crumb.nodeId}">${crumb.label}</span>` +
            (i < State.breadcrumb.length - 1 ? '<span class="chatbot-crumb-sep"> › </span>' : '')
        ).join('');
        el.querySelectorAll('.chatbot-crumb').forEach(span => {
            span.addEventListener('click', () => {
                const nodeId = span.dataset.node;
                const idx = State.breadcrumb.findIndex(c => c.nodeId === nodeId);
                State.breadcrumb = State.breadcrumb.slice(0, idx);
                renderNode(nodeId);
            });
        });
    }

    // ── 知識卡片系統 ─────────────────────────────────────────────

    /** 依單元挑一張知識卡：優先未看過、且不會是目前正在顯示的那張 */
    function pickCard(unit) {
        const content = window.ChatbotContent;
        if (!content) return null;
        const cards = content.KNOWLEDGE_CARDS;
        // 優先查完整 unit key（a1,a2...），其次查系列 key（b,c,f）
        const series = unit ? unit[0] : '';
        const key  = cards[unit] ? unit : (cards[series] ? series : null);
        const pool = key ? cards[key] : [];
        if (!pool.length) return null;

        // 未看過、且不是目前這張
        let candidates = pool.filter(c => !State.shownCards.has(c.id) && c.id !== State.currentCardId);
        if (!candidates.length) {
            // 都看過了 → 重置（安全卡保留），再排除目前這張避免立即重複
            pool.forEach(c => { if (c.weight !== 'high') State.shownCards.delete(c.id); });
            candidates = pool.filter(c => c.id !== State.currentCardId);
            if (!candidates.length) candidates = pool.slice(); // 池內只有一張才允許重複
        }
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        State.shownCards.add(pick.id);
        pick._unit = key; // 記住來源單元，供標籤使用
        return pick;
    }

    /** 渲染三個標準知識卡操作按鈕 */
    function renderCardButtons() {
        const optsEl = getEl('chatbot-options');
        if (!optsEl) return;
        optsEl.innerHTML = '';
        const ctx   = window.TutorContext || {};
        const cards = (window.ChatbotContent || {}).KNOWLEDGE_CARDS || {};
        // 本頁測驗對應的原主題 key（unit 優先，其次系列）
        const homeKey = ctx.unit ? (cards[ctx.unit] ? ctx.unit : (cards[ctx.unit[0]] ? ctx.unit[0] : '')) : '';
        const btns = [];
        // 已切到別的主題時才顯示「回原主題」（回到本頁測驗的單元）
        if (homeKey && State.currentCardUnit && State.currentCardUnit !== homeKey) {
            btns.push({ label: '↩️ 回原主題', action: 'home-topic' });
        }
        btns.push({ label: '📖 再看一個', action: 'next-card' });
        btns.push({ label: '🔄 換個主題', action: 'change-topic' });
        btns.push({ label: '🙋 我有問題', action: 'go-qa' });
        btns.forEach(b => {
            const btn = document.createElement('button');
            btn.className = 'chatbot-opt-btn';
            btn.textContent = b.label;
            btn.addEventListener('click', () => handleCardAction(b.action));
            optsEl.appendChild(btn);
        });
    }

    /** 處理知識卡按鈕動作 */
    function handleCardAction(action) {
        const ctx = window.TutorContext || {};
        if (action === 'next-card') {
            // 延續目前正在看的主題（換過主題後也繼續同主題）
            const card = pickCard(State.currentCardUnit || ctx.unit);
            if (card) renderCard(card);
            else renderNode(getRootNode());
        } else if (action === 'change-topic') {
            // 跳到「目前主題」以外的其他單元/系列
            const allKeys = Object.keys((window.ChatbotContent || {}).KNOWLEDGE_CARDS || {});
            const cur = State.currentCardUnit || ctx.unit || '';
            const otherKeys = allKeys.filter(k => k !== cur && k !== cur[0]);
            if (!otherKeys.length) return;
            const key = otherKeys[Math.floor(Math.random() * otherKeys.length)];
            const card = pickCard(key);      // 走 pickCard → 會標記正確來源單元
            if (card) renderCard(card);
        } else if (action === 'home-topic') {
            // 回到本頁測驗的原單元主題
            const card = pickCard(ctx.unit);
            if (card) renderCard(card);
            else renderNode(getRootNode());
        } else if (action === 'go-qa') {
            State.cardMode = false;
            State.breadcrumb = [];
            renderNode(getRootNode());
        }
    }

    /** 渲染一張知識卡（一般） */
    function renderCard(card) {
        State.cardMode = true;
        const ctx       = window.TutorContext || {};
        // 標籤依卡片「真正的來源單元」（pickCard 標記於 _unit），而非目前頁面單元
        const unitKey   = card._unit || card.unit || ctx.unit || '';
        State.currentCardUnit = unitKey;
        State.currentCardId   = card.id;
        const unitLabel = UNIT_LABELS[unitKey] || UNIT_LABELS[unitKey[0]] || '';
        const icon      = card.icon || '🪙';
        addMessage('bot', `${icon}\n${card.text}`, 'chatbot-knowledge-card', unitLabel);
        speak(card.text, 'normal');
        renderCardButtons();
    }

    /** 渲染安全攔截卡（紅框） */
    function renderSafetyCard(cardId) {
        const content = window.ChatbotContent;
        if (!content) return;
        const card = content.SAFETY_INTERCEPTION_CARDS[cardId];
        if (!card) return;
        State.cardMode = true;

        addMessage('bot', `${card.icon} 安全提醒！\n\n${card.text}`, 'chatbot-safety-card');
        speak(card.text, 'safety');

        const optsEl = getEl('chatbot-options');
        if (!optsEl) return;
        optsEl.innerHTML = '';

        if (card.helpButton) {
            const helpBtn = document.createElement('button');
            helpBtn.className = 'chatbot-opt-btn chatbot-help-btn';
            helpBtn.textContent = '📞 告訴老師或家長';
            helpBtn.addEventListener('click', () => {
                addMessage('bot', '好的！遇到這種情況\n請立刻告訴老師或家長！\n他們會幫助你的 💪', 'chatbot-knowledge-card');
                speak('好的！請立刻告訴老師或家長！他們會幫助你的！', 'praise');
                renderCardButtons();
            });
            optsEl.appendChild(helpBtn);
        }

        const okBtn = document.createElement('button');
        okBtn.className = 'chatbot-opt-btn';
        okBtn.textContent = '✅ 我知道了';
        okBtn.addEventListener('click', () => {
            speak('很好！記住這個安全守則喔！', 'praise');
            renderCardButtons();
        });
        optsEl.appendChild(okBtn);
    }

    /** 檢查輸入文字是否包含風險關鍵字，若是則顯示安全卡並回傳 true */
    function checkRiskKeywords(text) {
        const content = window.ChatbotContent;
        if (!content) return false;
        const lower = text.toLowerCase();
        for (const group of content.RISK_GROUPS) {
            if (group.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
                renderSafetyCard(group.id);
                return true;
            }
        }
        return false;
    }

    // ── 文字輸入處理 ──────────────────────────────────────────────
    function handleTextInput(text) {
        const trimmed = (text || '').trim();
        if (!trimmed) return;
        addMessage('user', trimmed);
        const inputEl = getEl('chatbot-input');
        if (inputEl) inputEl.value = '';

        // ── 風險關鍵字攔截（最高優先）────────────────────────────
        if (checkRiskKeywords(trimmed)) return;

        const lower = trimmed.toLowerCase();
        let matched = null;
        for (const rule of KEYWORD_RULES) {
            if (rule.keywords.some(kw => lower.includes(kw))) {
                matched = rule;
                break;
            }
        }

        if (matched) {
            if (matched.reply) {
                addMessage('bot', matched.reply);
                speak(matched.reply);
                const optsEl = getEl('chatbot-options');
                if (optsEl) optsEl.innerHTML = '';
                renderReturnOptions();
            } else if (matched.next) {
                State.breadcrumb = [];
                renderNode(matched.next);
            }
        } else {
            // 無匹配 → 保底回覆 + 回根節點選單
            const fallback = '我沒有完全聽懂 😅\n讓我給你幾個選項，看看哪個能幫到你：';
            addMessage('bot', fallback);
            speak(fallback);
            const optsEl = getEl('chatbot-options');
            if (optsEl) optsEl.innerHTML = '';
            State.breadcrumb = [];
            // 稍微延遲讓學生看到回覆後再渲染選項
            setTimeout(() => renderNode(getRootNode()), 600);
        }
    }

    // ── 徽章 ──────────────────────────────────────────────────────
    function setBadge(count) {
        const badge = getEl('chatbot-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = String(count);
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        // 同步標題列按鈕的徽章
        const tbBadge = document.querySelector('.chatbot-tb-badge');
        if (tbBadge) {
            if (count > 0) {
                tbBadge.textContent = String(count);
                tbBadge.classList.remove('hidden');
            } else {
                tbBadge.classList.add('hidden');
            }
        }
    }

    // ── 標題列模式：金博士移入遊戲標題列左側（文字/圖片右側）────
    // 左側區塊選擇器（涵蓋所有單元的標題列左側）
    const TB_LEFT_SEL = '.title-bar-left, .atm-title-bar-left, .b-header-left';

    function syncChatbotToTitleBar() {
        const fab = document.getElementById('chatbot-fab');
        if (!fab) return;

        const tbLeft = document.querySelector(TB_LEFT_SEL);
        let existingBtn = document.getElementById('chatbot-tb-btn');

        if (tbLeft) {
            // 遊戲模式：FAB 隱藏，金博士移入標題列左側末尾
            fab.style.display = 'none';

            if (!existingBtn || !tbLeft.contains(existingBtn)) {
                if (existingBtn) existingBtn.remove();
                const btn = document.createElement('div');
                btn.id       = 'chatbot-tb-btn';
                btn.className = 'chatbot-tb-btn';
                btn.title    = '金博士';
                btn.setAttribute('role', 'button');
                btn.setAttribute('tabindex', '0');
                btn.setAttribute('aria-label', '開啟金博士');
                btn.innerHTML = `<img src="${MASCOT_IMG}" alt="金博士"><span class="chatbot-tb-badge hidden"></span>`;
                btn.addEventListener('click', toggle);
                btn.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') toggle();
                });
                tbLeft.appendChild(btn); // 附加在左側區塊的最後（文字/圖片右側）
                existingBtn = btn;
            }

            // 同步徽章狀態
            const fabBadge = document.getElementById('chatbot-badge');
            const tbBadge  = existingBtn.querySelector('.chatbot-tb-badge');
            if (fabBadge && tbBadge) {
                tbBadge.textContent = fabBadge.textContent;
                tbBadge.classList.toggle('hidden', fabBadge.classList.contains('hidden'));
            }
        } else {
            // 設定頁面或完成畫面：金博士完全隱藏
            fab.style.display = 'none';
            if (existingBtn) existingBtn.remove();
            // 若視窗開著則關閉
            if (State.isOpen) toggle();
        }
    }

    function setupTitleBarObserver() {
        let debounce = null;
        const obs = new MutationObserver(() => {
            clearTimeout(debounce);
            debounce = setTimeout(syncChatbotToTitleBar, 200);
        });
        obs.observe(document.body, { childList: true, subtree: true });
        syncChatbotToTitleBar(); // 頁面載入時立即執行
    }

    // ── 視窗開關 ──────────────────────────────────────────────────
    function toggle() {
        State.isOpen = !State.isOpen;
        const win = getEl('chatbot-window');
        if (!win) return;

        if (State.isOpen) {
            win.classList.remove('hidden');
            setBadge(0);
            const ctx = window.TutorContext || {};
            const contextKey = `${ctx.unit || ''}-${ctx.phase || ''}-${ctx.screen || ''}`;

            if (!State.hasGreeted) {
                State.hasGreeted = true;
                State.lastContextKey = contextKey;
                // 有單元→知識卡開場；無單元→傳統 Q&A
                const card = ctx.unit ? pickCard(ctx.unit) : null;
                if (card) renderCard(card);
                else renderNode(getRootNode());

            } else if (contextKey !== State.lastContextKey) {
                // 情境切換 → 新知識卡（或 Q&A 根節點）
                State.lastContextKey = contextKey;
                State.breadcrumb = [];
                const card = ctx.unit ? pickCard(ctx.unit) : null;
                if (card) renderCard(card);
                else renderNode(getRootNode());

            } else if (State.cardMode) {
                // 情境未變且在知識卡模式 → 重播當前卡語音
                if (State.lastSpeak) {
                    speak(State.lastSpeak.text, State.lastSpeak.type);
                } else {
                    const msgs = getEl('chatbot-messages');
                    const lastBubble = msgs?.querySelector('.chatbot-msg.bot:last-child .chatbot-bubble');
                    if (lastBubble) speak(lastBubble.innerText || lastBubble.textContent);
                }

            } else {
                // 情境未變且在 Q&A 模式 → 重播當前節點語音
                const node = DIALOG[State.currentNode];
                const ctx2 = window.TutorContext || {};
                if (node) {
                    const t = typeof node.text === 'function' ? node.text(ctx2) : node.text;
                    speak(t);
                }
            }
            // 聚焦輸入框（桌機）
            const inp = getEl('chatbot-input');
            if (inp && window.innerWidth > 480) inp.focus();
        } else {
            win.classList.add('hidden');
            // 關閉視窗時停止語音（含預錄音檔）
            stopChatbotAudio();
            if (window.speechSynthesis) speechSynthesis.cancel();
        }
    }

    // ── 重新朗讀當前內容 ──────────────────────────────────────────
    function replayVoice() {
        // 確保語音已開啟
        State.voiceEnabled = true;
        // 優先重播上一句（含預錄音檔比對）
        if (State.lastSpeak) { speak(State.lastSpeak.text, State.lastSpeak.type); return; }
        if (!window.speechSynthesis) return;
        if (State.cardMode) {
            // 知識卡模式：重播最後一條 bot 訊息
            const msgs = getEl('chatbot-messages');
            const lastBubble = msgs?.querySelector('.chatbot-msg.bot:last-child .chatbot-bubble');
            if (lastBubble) speak(lastBubble.innerText || lastBubble.textContent);
        } else {
            // Q&A 模式：重播當前節點語音
            const node = DIALOG[State.currentNode];
            const ctx = window.TutorContext || {};
            if (node) {
                const t = typeof node.text === 'function' ? node.text(ctx) : node.text;
                speak(t);
            }
        }
    }

    // ── 注入 UI 至 <body> ─────────────────────────────────────────
    function injectUI() {
        if (document.getElementById('chatbot-container')) return; // 防重複注入

        const container = document.createElement('div');
        container.id = 'chatbot-container';
        container.innerHTML = `
            <div id="chatbot-fab" title="金博士：點我提問！" role="button" tabindex="0" aria-label="開啟金博士">
                <img src="${MASCOT_IMG}" alt="金博士">
                <span id="chatbot-badge" class="hidden" aria-label="有新訊息"></span>
            </div>
            <div id="chatbot-window" class="hidden" role="dialog" aria-label="金博士對話視窗">
                <div id="chatbot-header">
                    <img src="${MASCOT_IMG}" class="chatbot-header-mascot" alt="金博士">
                    <span class="chatbot-title">金博士</span>
                    <button id="chatbot-voice-btn" title="重新朗讀" aria-label="重新朗讀知識卡片內容">🔊</button>
                    <button id="chatbot-close-btn" title="關閉" aria-label="關閉對話視窗">✕</button>
                </div>
                <div id="chatbot-messages" aria-live="polite"></div>
                <div id="chatbot-options"></div>
                <div id="chatbot-breadcrumb" aria-label="對話路徑"></div>
                <div id="chatbot-input-area">
                    <input type="text" id="chatbot-input"
                           placeholder="輸入問題..." maxlength="60"
                           autocomplete="off" aria-label="輸入你的問題">
                    <button id="chatbot-send-btn" aria-label="送出">送出</button>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // ── 事件綁定 ─────────────────────────────────────────────
        getEl('chatbot-fab').addEventListener('click', toggle);
        getEl('chatbot-fab').addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
        getEl('chatbot-close-btn').addEventListener('click', toggle);
        getEl('chatbot-voice-btn').addEventListener('click', replayVoice);
        getEl('chatbot-send-btn').addEventListener('click', () => {
            handleTextInput(getEl('chatbot-input').value);
        });
        getEl('chatbot-input').addEventListener('keydown', e => {
            if (e.key === 'Enter') handleTextInput(e.target.value);
        });
    }

    // ── 監聽 TutorContext 更新（主動提醒）────────────────────────
    window.addEventListener('tutor:contextUpdated', (e) => {
        const ctx = e.detail || {};
        // 答錯 N 次時，若視窗未開啟則顯示徽章
        if (!State.isOpen && ctx.errorCount >= BADGE_ERROR_THRESHOLD) {
            setBadge(1);
        }
    });

    // ── 輔助點擊模式偵測：有 #click-exec-overlay 時隱藏整個聊天機器人 ──
    // 輔助點擊已提供逐步引導，chatbot 不需同時出現
    function setupAssistClickObserver() {
        function updateFabByOverlay() {
            const overlay = document.getElementById('click-exec-overlay');
            const container = document.getElementById('chatbot-container');
            if (!container) return;
            if (overlay) {
                // 輔助點擊啟動 → 若視窗開啟先關閉，再隱藏整個 FAB
                if (State.isOpen) toggle();
                container.style.display = 'none';
            } else {
                container.style.display = '';
            }
        }
        const observer = new MutationObserver(updateFabByOverlay);
        observer.observe(document.body, { childList: true });
        updateFabByOverlay(); // 頁面載入時初始檢查
    }

    // ── 小金探點擊彈窗 ───────────────────────────────────────────
    const _DTV_IMG      = 'hint_detective.png';
    const _DTV_TXT_HTML = '遇到困難了嗎？點我旁邊的 💡 <strong>提示鈕</strong>，我會給你一個解題線索喔！';
    const _DTV_TXT_SPK  = '遇到困難了嗎？點我旁邊的提示鈕，我會給你一個解題線索喔！';

    function _dtvSpeak(text) {
        // 小金探提示：先試預錄音檔，找不到才即時 TTS
        stopChatbotAudio();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        playChatbotAudio('detective_hint', () => _dtvSpeakTTS(text));
    }

    function _dtvSpeakTTS(text) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = 'zh-TW';
        utt.rate = 0.85;
        const vs = window.speechSynthesis.getVoices();
        const pick = fn => vs.find(fn);
        utt.voice =
            pick(v => /yating/i.test(v.name)) ||
            pick(v => /hanhan/i.test(v.name)) ||
            pick(v => /google/i.test(v.name) && v.lang.startsWith('zh')) ||
            pick(v => v.lang === 'zh-TW') ||
            pick(v => v.lang.startsWith('zh')) || null;
        window.speechSynthesis.speak(utt);
    }

    function _dtvHasHintBtn(imgEl) {
        const check = el => el && [...el.querySelectorAll('button')].some(b =>
            /hint/i.test(b.className + ' ' + b.id) || b.textContent.includes('提示')
        );
        return check(imgEl.parentElement) || check(imgEl.parentElement?.parentElement);
    }

    function _dtvShowPopup(imgEl) {
        document.querySelector('.dtv-popup')?.remove();
        const popup = document.createElement('div');
        popup.className = 'dtv-popup';
        popup.innerHTML = `
            <img class="dtv-popup-avatar" src="${imgEl.src}" alt="小金探">
            <div class="dtv-popup-text">${_DTV_TXT_HTML}</div>`;
        document.body.appendChild(popup);

        // 以父容器（含小金探＋提示鈕的那層 div）為錨，彈窗置於其正下方
        const anchor = imgEl.parentElement || imgEl;
        const aRect  = anchor.getBoundingClientRect();
        const pw = 280;
        const ph = 130; // 估算彈窗高度
        let left = aRect.left + window.scrollX;
        if (left + pw > window.innerWidth + window.scrollX - 8)
            left = window.innerWidth + window.scrollX - pw - 8;
        if (left < window.scrollX + 8) left = window.scrollX + 8;
        // 優先顯示在下方；下方空間不足時改上方
        let top = aRect.bottom + window.scrollY + 8;
        if (aRect.bottom + ph + 8 > window.innerHeight)
            top = aRect.top + window.scrollY - ph - 8;
        if (top < window.scrollY + 8) top = window.scrollY + 8;
        popup.style.top  = top + 'px';
        popup.style.left = left + 'px';

        _dtvSpeak(_DTV_TXT_SPK);

        const dismiss = () => {
            popup.classList.add('dtv-popup-out');
            setTimeout(() => popup.remove(), 250);
            document.removeEventListener('click', outside, true);
        };
        const outside = e => { if (!popup.contains(e.target) && e.target !== imgEl) dismiss(); };
        const timer = setTimeout(dismiss, 4000);
        popup.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
        setTimeout(() => document.addEventListener('click', outside, true), 80);
    }

    function setupDetectiveClickHint() {
        const bound = new WeakSet();
        function bindAll() {
            document.querySelectorAll(`img[src*="${_DTV_IMG}"]`).forEach(img => {
                if (bound.has(img) || !_dtvHasHintBtn(img)) return;
                bound.add(img);
                img.style.cursor = 'pointer';
                img.addEventListener('click', e => { e.stopPropagation(); _dtvShowPopup(img); });
            });
        }
        bindAll();
        new MutationObserver(bindAll).observe(document.body, { childList: true, subtree: true });
    }

    // ── 初始化 ────────────────────────────────────────────────────
    if (document.body) {
        injectUI();
        setupAssistClickObserver();
        setupTitleBarObserver();
        setupDetectiveClickHint();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            injectUI();
            setupAssistClickObserver();
            setupTitleBarObserver();
            setupDetectiveClickHint();
        });
    }

    // ── 頁面離開時停止語音（切換頁面不殘留語音）────────────────
    window.addEventListener('beforeunload', () => {
        stopChatbotAudio();
        if (window.speechSynthesis) speechSynthesis.cancel();
    });
    window.addEventListener('pagehide', () => {
        stopChatbotAudio();
        if (window.speechSynthesis) speechSynthesis.cancel();
    });

    // ── 公開 API（供各單元手動呼叫，選用）────────────────────────
    window.ChatBot = {
        toggle,
        getRootNode,
        /** 立即停止語音（含預錄音檔；供單元頁面內部切換畫面時呼叫） */
        cancelSpeech() { stopChatbotAudio(); if (window.speechSynthesis) speechSynthesis.cancel(); },
        /** 更新 TutorContext 的快捷方式 */
        updateContext(patch) {
            if (window.TutorContext) window.TutorContext.update(patch);
        },
    };

})();
