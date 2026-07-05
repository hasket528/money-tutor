/**
 * chatbot-context.js — 聊天機器人上下文橋接層
 *
 * 提供 window.TutorContext，讓各單元可更新目前遊戲狀態。
 * 聊天機器人讀取此狀態以給出情境化回覆。
 *
 * 各單元在以下 4 個時機呼叫 TutorContext.update()：
 *   1. 遊戲開始（init / renderWelcomeScreen 後）
 *   2. 題目切換（同時呼叫 TutorContext.reset()）
 *   3. 答錯（errorCount++）
 *   4. 提示按鈕被按（hintLevel++）
 */
(function () {
    'use strict';

    /** 各單元中文名稱對照表 */
    const UNIT_NAMES = {
        a1: '販賣機',   a2: '理髮廳',   a3: '麥當勞',
        a4: '超市購物', a5: 'ATM',      a6: '火車票',
        b1: '今天帶多少錢', b2: '零用錢日記', b3: '存錢計畫',
        b4: '特賣比一比',  b5: '生日派對',  b6: '菜市場',
        c1: '認識錢幣', c2: '數錢',  c3: '換錢',
        c4: '付款',     c5: '夠不夠', c6: '找零',
        f1: '一對一對應', f2: '唱數',     f3: '數字認讀',
        f4: '數字排序',   f5: '量比較',   f6: '數的組成',
    };

    window.TutorContext = {
        unit:          '',          // 'a1' ~ 'f6'
        unitName:      '',          // 顯示用中文名稱
        screen:        'welcome',   // 'welcome' | 'settings' | 'game' | 'result'
        phase:         '',          // 各單元自訂階段，如 'selectItem' | 'payment' | 'change'
        step:          '',          // 更細步驟，如 'insertCoin' | 'confirmPay'
        difficulty:    '',          // 'easy' | 'normal' | 'hard'
        questionIndex: 0,
        totalQuestions: 0,
        errorCount:    0,
        hintLevel:     0,           // 0=未提示 / 1=第1層 / 2=第2層 / 3=完整答案
        lastHintTime:  0,

        /**
         * 即時遊戲數據 getter（由各單元在 startGame 時掛載）
         * 回傳物件欄位依單元而定，例如：
         *   { itemName, price, inserted, change, wallet }  ← A1
         *   { serviceName, price, inserted, wallet }       ← A2
         *   { totalPrice, wallet, orderItems }             ← A3
         * showSettings 時應設回 null 清除殘值
         */
        getLiveData: null,

        /**
         * 合併更新狀態並觸發 tutor:contextUpdated 事件
         * @param {Object} patch - 要更新的欄位
         */
        update(patch) {
            Object.assign(this, patch);
            window.dispatchEvent(new CustomEvent('tutor:contextUpdated', {
                detail: { ...this },
            }));
        },

        /**
         * 切換新題目時重置題目相關狀態（保留 unit / difficulty）
         */
        reset() {
            this.update({
                phase:        '',
                step:         '',
                errorCount:   0,
                hintLevel:    0,
                lastHintTime: 0,
            });
        },
    };

    // ── 自動從 URL 路徑偵測單元 ───────────────────────────────
    const m = location.pathname.match(/\/html\/([a-f]\d)_/i);
    if (m) {
        const unit = m[1].toLowerCase();
        TutorContext.unit     = unit;
        TutorContext.unitName = UNIT_NAMES[unit] || '';
    }

})();
