/* worksheet-generator.js - 作業單核心引擎 */

// 單元註冊表
const WorksheetRegistry = {
    _units: {},

    register(id, config) {
        this._units[id] = config;
    },

    has(id) {
        return id in this._units;
    },

    get(id) {
        return this._units[id];
    }
};

// 中文數字序號
const CHINESE_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十'];

// Seeded PRNG (Mulberry32)
function createSeededRandom(seed) {
    let t = seed | 0;
    return function() {
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// 工具函數
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function pickRandom(arr, n) {
    const shuffled = shuffle(arr);
    return shuffled.slice(0, Math.min(n, shuffled.length));
}

function coinTag(value) {
    if (value >= 100) {
        return `<span class="coin-tag note">${value}元</span>`;
    }
    return `<span class="coin-tag">${value}元</span>`;
}

function blankLine(wide) {
    return `<span class="blank-line${wide ? ' wide' : ''}"></span>`;
}

function coinImg(value) {
    return `<img src="../images/money/${value}_yuan_front.png" class="coin-img${value >= 100 ? ' note-img' : ''}" alt="${value}元">`;
}

function coinImgFront(value) {
    return `<img src="../images/money/${value}_yuan_front.png" class="coin-img${value >= 100 ? ' note-img' : ''}" alt="${value}元正面">`;
}

function coinImgBack(value) {
    return `<img src="../images/money/${value}_yuan_back.png" class="coin-img${value >= 100 ? ' note-img' : ''}" alt="${value}元反面">`;
}

function coinImgRandom(value) {
    const side = Math.random() < 0.5 ? 'front' : 'back';
    return `<img src="../images/money/${value}_yuan_${side}.png" class="coin-img${value >= 100 ? ' note-img' : ''}" alt="${value}元">`;
}

function coinQuantifier(value) {
    return value >= 100 ? '張' : '個';
}

function coinSymbol(value) {
    if (value >= 100) {
        return `<span class="coin-symbol note-symbol">${value}</span>`;
    }
    return `<span class="coin-symbol">${value}</span>`;
}

function walletToCoins(amount) {
    const denoms = [1000, 500, 100, 50, 10, 5, 1];
    const result = [];
    let remaining = amount;
    for (const d of denoms) {
        while (remaining >= d) {
            result.push(d);
            remaining -= d;
        }
    }
    return result;
}

// 主產生器類別
class WorksheetGenerator {
    constructor(unitId, options) {
        this.unitId = unitId;
        this.options = options;
        this.showAnswers = false;
        this.lastQuestions = [];
    }

    generate() {
        const config = WorksheetRegistry.get(this.unitId);
        if (!config) return '<p>找不到單元</p>';

        const count = parseInt(this.options.count) || config.defaultCount || 10;

        // 產生2頁，第2頁避免與第1頁重複
        const questions1 = config.generate({ ...this.options, count, _showAnswers: this.showAnswers });
        const usedValues = new Set(questions1.map(q => q._key || q.prompt));
        const questions2 = config.generate({ ...this.options, count, _showAnswers: this.showAnswers, _usedValues: usedValues });
        this.lastQuestions = questions1;

        return this.renderPage(config, questions1) + this.renderPage(config, questions2);
    }

    renderPage(config, questions) {
        let html = `<div class="worksheet-page" data-unit="${this.unitId}">`;

        // 標題（含姓名日期在分隔線上方）
        html += `<div class="worksheet-header">
            <h1 class="unit-title"><span class="unit-icon">${config.icon}</span> ${config.dynamicName ? config.dynamicName(this.options) : config.name} — ${this.showAnswers ? '答案卷' : '作業單'}</h1>
            ${config.subtitle ? `<div class="worksheet-subtitle">${config.subtitle(this.options)}</div>` : ''}
            <div class="worksheet-info">
                <div class="info-field">姓名：<span class="info-line"></span></div>
                <div class="info-field">日期：<span class="info-line date-line"></span>/<span class="info-line date-line"></span>/<span class="info-line date-line"></span></div>
            </div>
        </div>`;

        // 題目
        questions.forEach((q, i) => {
            html += `<div class="question-block">`;
            html += `<div class="question-number">${CHINESE_NUMBERS[i]}、${q.prompt}</div>`;
            if (q.visual) {
                html += `<div class="question-visual">${q.visual}</div>`;
            }
            if (q.answerArea) {
                html += `<div class="question-answer">${q.answerArea}</div>`;
            }
            if (this.showAnswers && q.answerDisplay) {
                html += `<div class="question-answer"><span class="answer-text">答案：${q.answerDisplay}</span></div>`;
            }
            html += `</div>`;
        });

        // 頁尾
        html += `<div class="worksheet-footer">金錢小達人作業單</div>`;
        html += `</div>`;

        return html;
    }
}
