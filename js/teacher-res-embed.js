// 教師資源（教師指南／單元教案包）嵌在學習歷程總覽裡顯示時的模式（2026-10-09 使用者定：
// 點 teacher.html「教師資源」的按鈕，內容在學習歷程總覽頁面裡顯示，不跳頁）。
// 網址帶 ?embed=1 才生效：藏掉導覽列與浮動列印鈕；頁內 # 連結改成捲動外層頁面；
// 指向另一份教師資源的連結交給外層 showTeacherRes() 切換，其他連結整頁開啟。
// 放在 <head>，導覽列畫出來之前就加上 class，才不會先閃一下。
(function () {
  if (!/[?&]embed=1(&|$)/.test(location.search)) return;
  document.documentElement.classList.add('mt-embed');
  const st = document.createElement('style');
  st.textContent = '.mt-embed .site-nav,.mt-embed .print-btn{display:none!important}.mt-embed body{background:transparent!important}.mt-embed [id]{scroll-margin-top:200px}';   // 200px＝讓過學習歷程總覽的固定標題列
  document.head.appendChild(st);
  const KIND = { 'teacher-guide.html': 'guide', 'lesson-plans.html': 'plans' };
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href.startsWith('#')) {
      const el = document.getElementById(href.slice(1));
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      return;
    }
    const m = href.match(/^(teacher-guide\.html|lesson-plans\.html)(#.*)?$/);
    let p = null;
    try { p = window.parent !== window && window.parent.showTeacherRes; } catch (_) {}
    if (m && p) { e.preventDefault(); p(KIND[m[1]], m[2] || ''); return; }
    a.target = '_top';
  });
})();
