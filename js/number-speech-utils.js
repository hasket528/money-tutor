/**
 * 數字語音轉換工具模組
 * 用於將數字轉換為適合語音播放的中文讀法
 *
 * 包含三種模式：
 * 1. convertToPureNumberSpeech - 純數字模式（F系列用）
 * 2. convertToTraditionalCurrency - 金額模式（C/A系列用）
 * 3. convertToQuantitySpeech - 數量模式（帶單位）
 */

const NumberSpeechUtils = {
    // 數字轉換對照表
    numberMap: {
        '0': '零', '1': '壹', '2': '貳', '3': '參', '4': '肆',
        '5': '伍', '6': '六', '7': '七', '8': '八', '9': '九'
    },

    /**
     * 純數字模式（F系列用）
     * 數字「2」在所有位置都唸「貳」
     * 例：2→貳、20→貳拾、22→貳拾貳
     *
     * @param {number} number - 要轉換的數字
     * @returns {string} - 中文讀法
     */
    convertToPureNumberSpeech(number) {
        const numberMap = this.numberMap;

        // 特殊情況處理
        const specialCases = {
            0: '零',
            1: '壹',
            2: '貳',
            3: '參',
            4: '肆',
            5: '伍',
            6: '六',
            7: '七',
            8: '八',
            9: '九',
            10: '拾',
            11: '拾壹',
            12: '拾貳',
            13: '拾參',
            14: '拾肆',
            15: '拾伍',
            16: '拾六',
            17: '拾七',
            18: '拾八',
            19: '拾九',
            20: '貳拾',
            21: '貳拾壹',
            22: '貳拾貳',
            30: '參拾',
            40: '肆拾',
            50: '伍拾',
            100: '壹佰'
        };

        if (specialCases[number] !== undefined) {
            return specialCases[number];
        }

        // 通用轉換算法
        const numStr = number.toString();
        let result = '';
        const length = numStr.length;
        let needZero = false;

        for (let i = 0; i < length; i++) {
            const digit = numStr[i];
            const position = length - i - 1;

            if (digit === '0') {
                if (position > 0 && !needZero) {
                    const hasNonZeroAfter = numStr.slice(i + 1).split('').some(d => d !== '0');
                    if (hasNonZeroAfter && result.length > 0) {
                        needZero = true;
                    }
                }
            } else {
                if (needZero) {
                    result += '零';
                    needZero = false;
                }

                // 純數字模式：所有位置的2都唸「貳」
                result += numberMap[digit] || digit;

                // 添加單位
                if (position === 4) result += '萬';
                else if (position === 3) result += '仟';
                else if (position === 2) result += '佰';
                else if (position === 1) result += '拾';
            }
        }

        return result;
    },

    /**
     * 金額模式（C/A系列用）
     * 單獨2 → 兩元
     * 複合數字個位2 → 貳（如：12→拾貳元、32→參拾貳元）
     * 十位2 → 貳拾
     * 百位以上2 → 兩
     * 例：2→兩元、12→拾貳元、20→貳拾元、22→貳拾貳元、200→兩佰元、202→兩佰零貳元
     *
     * @param {number} amount - 金額數字
     * @returns {string} - 中文金額讀法（含「元」）
     */
    convertToTraditionalCurrency(amount) {
        const numberMap = this.numberMap;

        // 特殊情況處理 - 常見金額組合
        const specialCases = {
            0: '零元',
            1: '壹元',
            2: '兩元',
            5: '伍元',
            10: '拾元',
            11: '十一元',
            12: '十二元',
            13: '十三元',
            14: '十四元',
            15: '十五元',
            16: '十六元',
            17: '十七元',
            18: '十八元',
            19: '十九元',
            20: '貳拾元',
            21: '貳拾壹元',
            22: '貳拾貳元',
            25: '貳拾伍元',
            50: '伍拾元',
            100: '壹佰元',
            101: '壹佰零壹元',
            102: '壹佰零貳元',
            103: '壹佰零參元',
            104: '壹佰零肆元',
            105: '壹佰零伍元',
            106: '壹佰零六元',
            107: '壹佰零七元',
            108: '壹佰零八元',
            109: '壹佰零九元',
            110: '壹佰壹拾元',
            115: '壹佰壹拾伍元',
            120: '壹佰貳拾元',
            125: '壹佰貳拾伍元',
            150: '壹佰伍拾元',
            200: '兩佰元',
            201: '兩佰零壹元',
            202: '兩佰零貳元',
            205: '兩佰零伍元',
            210: '兩佰壹拾元',
            212: '兩佰壹拾貳元',
            220: '兩佰貳拾元',
            222: '兩佰貳拾貳元',
            250: '兩佰伍拾元',
            300: '參佰元',
            305: '參佰零伍元',
            500: '伍佰元',
            505: '伍佰零伍元',
            510: '伍佰壹拾元',
            550: '伍佰伍拾元',
            600: '六佰元',
            650: '六佰伍拾元',
            700: '七佰元',
            750: '七佰伍拾元',
            800: '八佰元',
            850: '八佰伍拾元',
            900: '九佰元',
            950: '九佰伍拾元',
            1000: '壹仟元',
            1001: '壹仟零壹元',
            1002: '壹仟零貳元',
            1005: '壹仟零伍元',
            1010: '壹仟零壹拾元',
            1050: '壹仟零伍拾元',
            1100: '壹仟壹佰元',
            1105: '壹仟壹佰零伍元',
            1500: '壹仟伍佰元',
            2000: '兩仟元',
            2002: '兩仟零貳元',
            2005: '兩仟零伍元',
            2020: '兩仟零貳拾元',
            2050: '兩仟零伍拾元',
            2100: '兩仟壹佰元',
            2105: '兩仟壹佰零伍元',
            2200: '兩仟兩佰元',
            2500: '兩仟伍佰元',
            3000: '參仟元',
            3005: '參仟零伍元',
            5000: '伍仟元',
            10000: '壹萬元',
            20000: '兩萬元'
        };

        if (specialCases[amount]) {
            return specialCases[amount];
        }

        // 通用轉換算法處理複雜數字
        const amountStr = amount.toString();
        let result = '';
        const length = amountStr.length;
        let needZero = false;

        for (let i = 0; i < length; i++) {
            const digit = amountStr[i];
            const position = length - i - 1;

            if (digit === '0') {
                if (position > 0 && !needZero) {
                    const hasNonZeroAfter = amountStr.slice(i + 1).split('').some(d => d !== '0');
                    if (hasNonZeroAfter && result.length > 0) {
                        needZero = true;
                    }
                }
            } else {
                if (needZero) {
                    result += '零';
                    needZero = false;
                }

                // 數字2的特殊處理規則：
                // 百位以上用「兩」，十位用「貳」，個位用「貳」（複合數字中）
                // 注意：單獨的「2元」已在 specialCases 處理為「兩元」
                if (digit === '2') {
                    if (position >= 2) { // 百位以上用「兩」
                        result += '兩';
                    } else if (position === 1) { // 十位用「貳」
                        result += '貳';
                    } else { // 個位用「貳」（複合數字中）
                        result += '貳';
                    }
                } else {
                    result += numberMap[digit] || digit;
                }

                // 添加單位
                if (position === 4) result += '萬';
                else if (position === 3) result += '仟';
                else if (position === 2) result += '佰';
                else if (position === 1) result += '拾';
            }
        }

        return result + '元';
    },

    /**
     * 數量模式（帶單位）
     * 只有單獨「2」+ 單位 → 兩 + 單位
     * 複合數字中的 2 → 貳
     * 例：2個→兩個、20題→貳拾題、22個→貳拾貳個、12個→拾貳個
     *
     * @param {number} number - 數量數字
     * @param {string} unit - 單位（如：個、題、次）
     * @returns {string} - 中文數量讀法（含單位）
     */
    convertToQuantitySpeech(number, unit) {
        const numberMap = this.numberMap;

        // 特殊情況：單獨的2用「兩」
        if (number === 2) {
            return '兩' + unit;
        }

        // 其他情況使用純數字模式
        const numStr = number.toString();
        let result = '';
        const length = numStr.length;
        let needZero = false;

        for (let i = 0; i < length; i++) {
            const digit = numStr[i];
            const position = length - i - 1;

            if (digit === '0') {
                if (position > 0 && !needZero) {
                    const hasNonZeroAfter = numStr.slice(i + 1).split('').some(d => d !== '0');
                    if (hasNonZeroAfter && result.length > 0) {
                        needZero = true;
                    }
                }
            } else {
                if (needZero) {
                    result += '零';
                    needZero = false;
                }

                // 數量模式：所有位置的2都用「貳」（除了單獨的2已在上面處理）
                result += numberMap[digit] || digit;

                // 添加單位
                if (position === 4) result += '萬';
                else if (position === 3) result += '仟';
                else if (position === 2) result += '佰';
                else if (position === 1) result += '拾';
            }
        }

        return result + unit;
    },

    /**
     * 金額模式（不含元）- 用於模板已有「元」的情況
     * 規則同 convertToTraditionalCurrency，但不附加「元」
     *
     * @param {number} amount - 金額數字
     * @returns {string} - 中文金額讀法（不含「元」）
     */
    convertToChineseNumber(amount) {
        const result = this.convertToTraditionalCurrency(amount);
        // 移除結尾的「元」
        return result.replace(/元$/, '');
    }
};

// 為了方便使用，也導出獨立函數
function convertToPureNumberSpeech(number) {
    return NumberSpeechUtils.convertToPureNumberSpeech(number);
}

function convertToTraditionalCurrency(amount) {
    return NumberSpeechUtils.convertToTraditionalCurrency(amount);
}

function convertToQuantitySpeech(number, unit) {
    return NumberSpeechUtils.convertToQuantitySpeech(number, unit);
}

function convertToChineseNumber(amount) {
    return NumberSpeechUtils.convertToChineseNumber(amount);
}
