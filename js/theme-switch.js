/**
 * theme-switch.js
 * 全站統一深色/淺色模式開關（取代 js/theme-system.js）。
 *
 * 三態：'system'（跟隨瀏覽器/系統偏好，預設）／'light'（強制淺色）／'dark'（強制深色）。
 * 儲存：localStorage['mt_theme']，值只有 'light'/'dark'；不存在＝system。
 *
 * 設計重點：system 狀態完全交給 CSS 的 @media (prefers-color-scheme: dark) 處理，
 * JS 不監聽系統偏好變化、不用手動幫它切值——這正是舊版 js/theme-system.js 那個「深色回不去」
 * bug 的成因（它在 change 事件裡手動呼叫 setTheme('vibrant', false)，'vibrant' 是不存在的主題名，
 * 呼叫靜默失敗，深色狀態卡住且被永久寫進 localStorage）。CSS media query 本身就是響應式的，
 * 拿掉這段手動邏輯，這整類 bug 就不可能發生。
 *
 * 全站 CSS 統一寫法（每個模組的深色樣式都照這個套，定義在 CLAUDE.md「深色模式規則」一節）：
 *   :root { --x: 淺色值; }
 *   @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --x: 深色值; } }
 *   [data-theme="dark"] { --x: 深色值; }
 *   .foo { background: var(--x); }   // 元件規則只寫一次
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'mt_theme';

    // 舊系統遺留的壞掉的 key：內含一個永遠回不去淺色的 bug，載入新程式碼時一併清掉，
    // 讓卡在深色的裝置自動恢復成「跟隨系統」。
    var LEGACY_KEYS = ['money-tutor-theme', 'money-tutor-theme-manual',
        'theme-switcher-minimized', 'theme-switcher-position'];

    function cleanupLegacy() {
        try {
            LEGACY_KEYS.forEach(function (k) { localStorage.removeItem(k); });
        } catch (e) { /* ignore */ }
    }

    function getStored() {
        try {
            var v = localStorage.getItem(STORAGE_KEY);
            return (v === 'light' || v === 'dark') ? v : null;
        } catch (e) { return null; }
    }

    function get() {
        return getStored() || 'system';
    }

    function apply(mode) {
        if (mode === 'light' || mode === 'dark') {
            document.documentElement.setAttribute('data-theme', mode);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    function set(mode) {
        if (mode !== 'light' && mode !== 'dark' && mode !== 'system') return;
        try {
            if (mode === 'system') localStorage.removeItem(STORAGE_KEY);
            else localStorage.setItem(STORAGE_KEY, mode);
        } catch (e) { /* ignore */ }
        apply(mode);
        updateButtons();
    }

    function cycle() {
        var order = ['system', 'light', 'dark'];
        var next = order[(order.indexOf(get()) + 1) % order.length];
        set(next);
    }

    var LABELS = {
        system: { icon: '🖥️', text: '自動', title: '主題：跟隨系統，點擊切換為強制淺色' },
        light:  { icon: '☀️', text: '淺色', title: '主題：強制淺色，點擊切換為強制深色' },
        dark:   { icon: '🌙', text: '深色', title: '主題：強制深色，點擊切換為跟隨系統' }
    };

    function updateButtons() {
        var mode = get();
        var info = LABELS[mode];
        document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
            btn.textContent = info.icon + ' ' + info.text;
            btn.title = info.title;
            btn.setAttribute('aria-label', info.title);
        });
    }

    function bindButtons() {
        document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
            if (btn.dataset.mtBound) return;
            btn.dataset.mtBound = '1';
            btn.addEventListener('click', cycle);
        });
        updateButtons();
    }

    // 跨分頁同步（沿用全站慣例，例如 sp_currentStudent 也是這樣同步）
    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY) {
            apply(get());
            updateButtons();
        }
    });

    cleanupLegacy();
    apply(get());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindButtons);
    } else {
        bindButtons();
    }

    // refresh：之後才動態插進 DOM 的切換鈕（js/nav-auth.js 的 mtUnitNav）要再綁一次、填上目前的字
    window.MTTheme = { get: get, set: set, cycle: cycle, refresh: bindButtons };
})();
