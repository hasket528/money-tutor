/**
 * 單元結算的鼓勵語 —— 由**金隊長**唸（預錄，音色 Zephyr，與成長基地同一個聲音）。
 *
 * 為什麼要有這支：各單元結算時本來是用瀏覽器的即時語音唸鼓勵語，
 * 機械音沒有角色感。金隊長本來就是「記錄你的努力、看你進步」的角色，
 * 結算畫面正是他的場合——所以不另立新角色（站台已有五位，再多會分散學生的辨識）。
 *
 * ⚠️ **含題數的那句不預錄**：原本 80 分以上會唸「很棒喔，答對了 8 題！」，
 *    題數會變，整句錄不起來（同 adventure 的教訓：動態數字不能全預錄）。
 *    預錄改成不帶數字的「很棒喔！答對了大部分的題目！」——題數畫面上本來就看得到。
 *
 * ⚠️ **一定要留後備**：缺檔、手機擋自動播放、或呼叫端沒給對 accuracy，
 *    都要能退回單元原本的唸法，不能讓結算變成靜音。
 *
 * 用法（單元裡原本是 `Game.Speech.speak(msg)`）：
 *     ResultVoice.speak(accuracy, () => Game.Speech.speak(msg));
 */
window.ResultVoice = (() => {
  const BASE = 'audio/chatbot/';       // 單元頁在 html/ 底下，實際路徑由 _prefix() 補
  const LINES = [
    { min: 100, file: 'captain_result_perfect' },   // 太厲害了，全部答對了！
    { min: 80,  file: 'captain_result_great'   },   // 很棒喔！答對了大部分的題目！
    { min: 60,  file: 'captain_result_good'    },   // 不錯喔，繼續加油！
    { min: 0,   file: 'captain_result_try'     },   // 要再加油喔，多練習幾次！
  ];

  let _audio = null;

  // 單元 html 在 /html/ 底下，站台根目錄在上一層；其他頁（assessment.html）就在根目錄
  function _prefix() {
    return location.pathname.includes('/html/') ? '../' : '';
  }

  // 播完／被打斷都要卸載，否則 Android 通知欄的媒體卡會留到分頁關閉（2026-08-19 的教訓）
  function _release(a) {
    if (!a) return;
    a.onended = a.onerror = null;
    try { a.pause(); a.src = ''; a.load(); } catch (_) {}
  }

  function stop() {
    if (_audio) { _release(_audio); _audio = null; }
  }

  /**
   * @param {number} accuracy  正確率（0–100）
   * @param {Function} fallback 沒有預錄可播時的退路（通常是單元原本的即時語音）
   */
  function speak(accuracy, fallback) {
    const pct = Number(accuracy);
    const line = LINES.find(l => pct >= l.min) || LINES[LINES.length - 1];
    stop();

    const exts = ['mp3', 'wav'];
    let i = 0;
    const tryNext = () => {
      if (i >= exts.length) { try { fallback && fallback(); } catch (_) {} return; }
      const a = new Audio(`${_prefix()}${BASE}${line.file}.${exts[i++]}`);
      _audio = a;
      let advanced = false;
      const fail = () => { if (advanced) return; advanced = true; _release(a); tryNext(); };
      a.onerror = fail;
      a.onended = () => { if (_audio === a) _audio = null; _release(a); };
      a.play().catch(fail);      // 手機擋自動播放時也走 fallback
    };
    tryNext();
  }

  return { speak, stop, LINES };
})();
