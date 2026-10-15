// 內嵌模式的「返回選單」轉接（站台主頁用 iframe 開遊戲時載入，網址帶 ?embed=1）。
//
// 為什麼要獨立一支：多數遊戲的返回鈕在共用的 games/js/game-ui.js 裡處理，
// 但 g8-tictactoe / g9-cardwar 沒有用那支共用 UI，只有自己的 `<a href="../index.html">`。
// 在 iframe 裡點下去會把遊戲換成 games 選單頁（外層主頁還在，畫面很怪），
// 所以這裡統一攔截、改成通知外層主頁關掉 iframe。
(function () {
  if (window.__gueEmbedBack) return;          // game-ui.js 也有同一套，先到先得
  if (new URLSearchParams(location.search).get('embed') !== '1') return;
  window.__gueEmbedBack = true;

  const back = () => { try { parent.postMessage({ type: 'mt-game-back' }, '*'); } catch (e) {} };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('a[href="../index.html"], .gue-back-link, .gue-back-btn, .g8-back-link, .cw-back-link, #home-btn');
    if (!el) return;
    e.preventDefault();
    back();
  }, true);
})();
