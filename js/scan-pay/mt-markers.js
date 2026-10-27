/**
 * mt-markers.js — 面額 ↔ 掃描標記 ID 的**唯一**對應表
 *
 * 標記格式：AprilTag 16h5（4×4 內容 ＋ 1 圈黑框 = 6×6 模組）
 *
 * ── 為什麼不是 QR ──────────────────────────────────────────────────
 * QR version 1 是 21×21 模組、可裝 136 bits，而我們要表達的只有 9 種面額
 * （3.2 bits）。過規格的代價是：同樣的紙面尺寸下每個模組只有 QR 的 1/3.5 寬，
 * 逼得抽幀解析度必須開到 1280×720，fps 就拉不上去（見 scan-pay.js 的註解）。
 * 換成 6×6 後 640×480 就夠用，像素量剩三分之一，fps 才有往上拉的空間。
 * 完整推導見 doc/開發計畫/開發計畫_掃描付款_QR教具卡.md。
 *
 * ── 這 9 個 ID 不是隨便挑的 ────────────────────────────────────────
 * 16h5 字典有 30 個碼，官方保證的最小 Hamming 距離（tau）只有 5。
 * `_gen_markers.py` 窮舉所有 9 取組合，挑出「含四個旋轉後彼此距離最遠」的一組：
 *   · 子集最小距離 = 6（優於整本字典的 5）
 *   · 每個碼自身旋轉後的最小距離 ≥ 6 → 沒有旋轉對稱，方向一定判得出來
 * 誤判成一個「別的面額」在特教情境的代價很高，這一步是花在刀口上的。
 *
 * ⚠️ 改這張表 = 已經印出去的卡片全部作廢。非必要不要動。
 *
 * 相依：svg() 需要先載入 vendor/aruco/{cv.js, aruco.js, apriltag_16h5.js}；
 *       只查對應表的話零相依。
 */
(function (global) {
  'use strict';

  var DICT_NAME = 'APRILTAG_16h5';

  // 由 _gen_markers.py 產出，改動請重跑該腳本
  var MAP = [
    { value: 1,    id: 0  },
    { value: 5,    id: 2  },
    { value: 10,   id: 4  },
    { value: 50,   id: 7  },
    { value: 100,  id: 8  },
    { value: 200,  id: 11 },
    { value: 500,  id: 12 },
    { value: 1000, id: 14 },
    { value: 2000, id: 15 }
  ];

  var byValue = {}, byId = {};
  MAP.forEach(function (m) { byValue[m.value] = m.id; byId[m.id] = m.value; });

  var _dict = null;
  function dict() {
    if (!_dict) {
      if (!global.AR) throw new Error('mt-markers: 需要先載入 vendor/aruco/aruco.js 與字典檔');
      _dict = new global.AR.Dictionary(DICT_NAME);
    }
    return _dict;
  }

  global.MTMarkers = {
    DICT: DICT_NAME,

    /** 黑色標記本體的模組數（4×4 內容 ＋ 上下左右各 1 圈黑框） */
    MODULES: 6,

    /** generateSVG 的 viewBox 是 8×8（本體外還有 1 模組白色靜區）
     *  → 版面上的實際佔位 = 本體邊長 × BOX_RATIO */
    BOX_RATIO: 8 / 6,

    /** 傳給 AR.Detector 的 maxHammingDistance 預設值。
     *  aruco.js 的判定是 `distance < tau`，所以 3 代表「容許 2 個 bit 出錯」。
     *  子集最小距離是 6，受損 2 bit 的碼離原碼 2、離任何別的碼 ≥ 4，
     *  絕不會被認成另一個面額。 */
    TAU: 3,

    /** [{ value, id }]，依面額由小到大 */
    list: function () { return MAP.slice(); },

    /** 面額 → 標記 ID；沒有這個面額回 null */
    idOf: function (value) {
      var id = byValue[value];
      return id === undefined ? null : id;
    },

    /** 標記 ID → 面額；不是我們用的 ID 回 null（等於多一層拒絕機制，
     *  掃到字典裡其他 21 個沒用到的碼會被擋在這裡） */
    valueOf: function (id) {
      var v = byId[id];
      return v === undefined ? null : v;
    },

    /** 面額 → 標記的 SVG 字串（viewBox 0 0 8 8） */
    svg: function (value) {
      var id = this.idOf(value);
      if (id === null) throw new Error('mt-markers: 沒有 ' + value + ' 元的標記');
      // crispEdges：列印與縮放時不要抗鋸齒，模組邊界要是硬邊
      return dict().generateSVG(id).replace('<svg ', '<svg shape-rendering="crispEdges" ');
    },

    /** 面額 → data URI，可直接塞進 <img src> */
    dataURI: function (value) {
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(this.svg(value));
    }
  };
})(typeof window !== 'undefined' ? window : this);
