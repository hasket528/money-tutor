/* js/emoji-font.js — 全站 emoji 一律用專案內建的 Twemoji 彩色字型畫（2026-10-05 使用者定）
 *
 * 為什麼：emoji 是各台電腦的「系統字型」畫的。Windows 10 的字型舊，較新的 emoji（🪙🧮🧭🧩🧋🪪…約 70 種）
 * 會變方框或別的圖；組合 emoji（👩‍🏫🧑‍💼🐈‍⬛）會被拆成兩個。換成我們自己帶的字型，所有電腦看到的都一樣。
 *
 * 怎麼做（不必改各頁的 CSS）：
 *   ① 宣告字型 'MT Emoji'，unicode-range 只含「預設就是彩色 emoji」的字元——中文、英數、
 *      以及 ✔ ❤ ⚠ ☀ 這類預設黑白的符號都不在範圍內，所以只有 emoji 會換字型，其他字完全不受影響。
 *   ② 把 'MT Emoji' 加到每一條 font-family 的最前面（同源樣式表＋之後動態加進來的 <style>），
 *      表單元件（button/input…）另給一條最低優先的預設，讓沒寫字型的按鈕裡的 emoji 也用得到。
 *   ③ 用 file:// 開檔時 Chrome 不讓網頁讀另一個本機字型檔 → 改載 fonts/twemoji-data.js（data URI）。
 *
 * 字型：fonts/twemoji.woff2＝npm twemoji-colr-font 15.0.3（字型 OFL-1.1；圖案 Twemoji © Twitter, CC-BY 4.0，
 * 已登記在 credits.html）。COLR 格式，iPad Safari／Chrome／Edge／Firefox 都支援。
 * 新增頁面：在 <head> 引入本檔（路徑依目錄深度調整）即可；要停用整個功能，把各頁這一行拿掉就好。
 */
(function () {
  if (window.__mtEmojiFont) return;
  window.__mtEmojiFont = true;
  var FAMILY = 'MT Emoji';
  var RANGE = 'U+200D,U+231A-231B,U+23E9-23EC,U+23F0,U+23F3,U+25FD-25FE,U+2614-2615,U+2648-2653,U+267F,U+2693,U+26A1,U+26AA-26AB,U+26BD-26BE,U+26C4-26C5,U+26CE,U+26D4,U+26EA,U+26F2-26F3,U+26F5,U+26FA,U+26FD,U+2705,U+270A-270B,U+2728,U+274C,U+274E,U+2753-2755,U+2757,U+2795-2797,U+27B0,U+27BF,U+2B1B-2B1C,U+2B50,U+2B55,U+FE0F,U+1F004,U+1F0CF,U+1F170-1F171,U+1F17E-1F17F,U+1F18E,U+1F191-1F19A,U+1F1E6-1F1FF,U+1F201-1F202,U+1F21A,U+1F22F,U+1F232-1F23A,U+1F250-1F251,U+1F300-1F321,U+1F324-1F393,U+1F396-1F397,U+1F399-1F39B,U+1F39E-1F3F0,U+1F3F3-1F3F5,U+1F3F7-1F4FD,U+1F4FF-1F53D,U+1F549-1F54E,U+1F550-1F567,U+1F56F-1F570,U+1F573-1F57A,U+1F587,U+1F58A-1F58D,U+1F590,U+1F595-1F596,U+1F5A4-1F5A5,U+1F5A8,U+1F5B1-1F5B2,U+1F5BC,U+1F5C2-1F5C4,U+1F5D1-1F5D3,U+1F5DC-1F5DE,U+1F5E1,U+1F5E3,U+1F5E8,U+1F5EF,U+1F5F3,U+1F5FA-1F64F,U+1F680-1F6C5,U+1F6CB-1F6D2,U+1F6D5-1F6D7,U+1F6DC-1F6E5,U+1F6E9,U+1F6EB-1F6EC,U+1F6F0,U+1F6F3-1F6FC,U+1F7E0-1F7EB,U+1F7F0,U+1F90C-1F93A,U+1F93C-1F945,U+1F947-1F9FF,U+1FA70-1FA7C,U+1FA80-1FA88,U+1FA90-1FABD,U+1FABF-1FAC5,U+1FACE-1FADB,U+1FAE0-1FAE8,U+1FAF0-1FAF8,U+E0062-E0063,U+E0065,U+E0067,U+E006C,U+E006E,U+E0073-E0074,U+E0077,U+E007F';
  var me = document.currentScript && document.currentScript.src;
  var base = me ? me.replace(/js\/emoji-font\.js(\?.*)?$/, '') : '';

  function addFace(src) {
    var st = document.createElement('style');
    st.id = 'mt-emoji-font';
    st.textContent = "@font-face{font-family:'" + FAMILY + "';src:" + src + ";unicode-range:" + RANGE + ";font-display:block}" +
      ":where(button,input,select,textarea,optgroup){font-family:'" + FAMILY + "',system-ui,sans-serif}";
    (document.head || document.documentElement).insertBefore(st, (document.head || document.documentElement).firstChild);
  }
  if (location.protocol === 'file:') {
    var s = document.createElement('script');
    s.src = base + 'fonts/twemoji-data.js';
    s.onload = function () { if (window.MT_EMOJI_FONT_DATA) addFace("url(" + window.MT_EMOJI_FONT_DATA + ") format('woff2')"); };
    document.head.appendChild(s);
  } else {
    addFace("url('" + base + "fonts/twemoji.woff2') format('woff2')");
  }

  // ② 把 'MT Emoji' 接到每條 font-family 最前面
  var SKIP = /^(inherit|initial|unset|revert|revert-layer)$/i;
  var done = new WeakSet();
  function patchRules(rules) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.cssRules && !r.style) { patchRules(r.cssRules); continue; }   // @media／@supports／@layer
      if (!r.style || done.has(r)) continue;
      done.add(r);
      var ff = r.style.getPropertyValue('font-family');
      if (!ff || SKIP.test(ff.trim()) || ff.indexOf(FAMILY) >= 0) continue;
      r.style.setProperty('font-family', "'" + FAMILY + "', " + ff, r.style.getPropertyPriority('font-family'));
    }
  }
  function patchSheet(sheet) {
    try { if (sheet.cssRules) patchRules(sheet.cssRules); } catch (e) { /* 跨網域樣式表（Google Fonts）讀不到，略過 */ }
  }
  function patchAll() { for (var i = 0; i < document.styleSheets.length; i++) patchSheet(document.styleSheets[i]); }
  // 樣式表陸續載入：<link> 載完、動態加的 <style>（各單元 injectGlobalAnimationStyles 等）都要補
  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    (window.requestAnimationFrame || setTimeout)(function () { queued = false; patchAll(); });
  }
  patchAll();
  document.addEventListener('DOMContentLoaded', patchAll);
  window.addEventListener('load', patchAll);
  document.addEventListener('load', function (e) { if (e.target && e.target.tagName === 'LINK') schedule(); }, true);
  try {
    // 各單元常用 innerHTML 一次塞進整塊畫面、<style> 包在裡面 → 新增節點本身或它底下有 <style>／<link> 都要補。
    // 只看 childList（不看文字內容變化：分數、計時器每秒都在改字，沒必要每次都檢查）。
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var a = muts[i].addedNodes;
        for (var j = 0; j < a.length; j++) {
          var n = a[j];
          if (n.nodeType !== 1) continue;
          if (n.nodeName === 'STYLE' || n.nodeName === 'LINK' || (n.querySelector && n.querySelector('style,link[rel~="stylesheet"]'))) { schedule(); return; }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
