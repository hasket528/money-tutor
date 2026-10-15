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
 * ⚠️ **A 系列走 `speakDone()` 不走 `speak()`**：A 系列是自選任務、沒有「正確率」這回事
 *    （做完就是做完，`score === total` 恆真），套四段式會永遠唸「全部答對了」。
 *    原句「完成挑戰！共完成 5 題，用時 3 分 20 秒」帶題數與時間，同樣整句錄不起來，
 *    預錄改成不帶數字的「完成挑戰！你做到了，很棒喔！」——題數與用時畫面上是大字卡。
 *
 * 🔊 **結算音效也依正確率分四段**（2026-10-02 使用者定）：分段只定義在下面的 `LINES`
 *    （`min` 同時決定鼓勵語與音效），音效檔在站根 `audio/units/result/`，來源記在
 *    `report/speech/SFX_Source_Log.csv`。單元結算時呼叫 `playSfx(accuracy)` 取代原本的
 *    `success-sound.play()`；缺檔時退回 `audio/units/success.mp3`。
 *    A 系列沒有正確率，結算照舊播 success.mp3（不要硬套四段，會永遠拿到 100 分那段）。
 *
 * ⚠️ **會先等結算音效播完再開口**（見 `_afterSfx`）——所以呼叫要排在音效之後。
 *    `playSfx()` 播的音效由這支自己追蹤、等它的 `ended`；單元自己 `play()` 的音效
 *    只能靠「頁面上有沒有正在播的 <audio> 元素」偵測，`new Audio()` 建的不在頁面上、偵測不到
 *    ——這就是音效要交給 `playSfx()` 播的原因（否則鼓勵語會跟音效疊在一起）。
 *
 * 用法（單元裡原本是 `Game.Speech.speak(msg)`）：
 *     ResultVoice.playSfx(accuracy);                                // 取代 success-sound.play()
 *     ResultVoice.speak(accuracy, () => Game.Speech.speak(msg));   // B/C/F 系列
 *     ResultVoice.speakDone(() => this.speech.speak(msg));         // A 系列
 *     ResultVoice.afterSfx(() => …);                               // 別的角色要接在音效後面講（對話模組）
 */
window.ResultVoice = (() => {
  const BASE = 'audio/chatbot/';       // 單元頁在 html/ 底下，實際路徑由 _prefix() 補
  const SFX_DIR = 'audio/units/result/';
  const SFX_FALLBACK = 'audio/units/success.mp3';
  const LINES = [
    { min: 100, file: 'captain_result_perfect', sfx: 'result_perfect' },   // 太厲害了，全部答對了！
    { min: 80,  file: 'captain_result_great',   sfx: 'result_great'   },   // 很棒喔！答對了大部分的題目！
    { min: 60,  file: 'captain_result_good',    sfx: 'result_good'    },   // 不錯喔，繼續加油！
    { min: 0,   file: 'captain_result_try',     sfx: 'result_try'     },   // 要再加油喔，多練習幾次！
  ];
  const DONE = 'captain_result_done';                // 完成挑戰！你做到了，很棒喔！（A 系列用）

  let _audio = null;
  let _waitTimer = null;   // 等成功音效播完的計時器（stop 要清掉，否則下一局開頭會冒出上一局的鼓勵語）
  let _sfx = null;         // playSfx() 正在播的結算音效
  let _sfxWaiters = [];    // 等 _sfx 播完才要做的事

  // 單元 html 在 /html/、對話模組在 /dialogue/，站台根目錄都在上一層；其他頁（assessment.html）就在根目錄
  function _prefix() {
    return /\/(html|dialogue)\//.test(location.pathname) ? '../' : '';
  }

  function _lineFor(accuracy) {
    const pct = Number(accuracy);
    return LINES.find(l => pct >= l.min) || LINES[LINES.length - 1];
  }

  // 播完／被打斷都要卸載，否則 Android 通知欄的媒體卡會留到分頁關閉（2026-08-19 的教訓）
  function _release(a) {
    if (!a) return;
    a.onended = a.onerror = null;
    try { a.pause(); a.src = ''; a.load(); } catch (_) {}
  }

  function _stopVoice() {
    if (_waitTimer) { clearTimeout(_waitTimer); _waitTimer = null; }
    if (_audio) { _release(_audio); _audio = null; }
  }

  function _stopSfx() {
    _sfxWaiters = [];
    if (_sfx) { _release(_sfx); _sfx = null; }
  }

  function stop() {
    _stopVoice();
    _stopSfx();
  }

  /**
   * 依正確率播結算音效（四段，見 LINES）。檔案缺了退回 success.mp3；被手機擋掉就安靜結束，
   * 等著它的鼓勵語照樣開口。
   * @param {number} accuracy 正確率（0–100）
   */
  function playSfx(accuracy) {
    _stopSfx();
    const srcs = [`${_prefix()}${SFX_DIR}${_lineFor(accuracy).sfx}.mp3`, `${_prefix()}${SFX_FALLBACK}`];
    let i = 0;
    const tryNext = () => {
      if (i >= srcs.length) { _sfxDone(null); return; }
      const a = new Audio(srcs[i++]);
      _sfx = a;
      let advanced = false;
      const fail = () => {
        if (advanced || _sfx !== a) return;
        advanced = true; _release(a); tryNext();
      };
      a.onerror = fail;
      a.onended = () => _sfxDone(a);
      a.play().catch(err => {
        // 被手機擋（NotAllowedError）＝換檔也一樣會被擋，直接收尾；其餘（缺檔）換下一個
        if (err && err.name === 'NotAllowedError') { if (_sfx === a) _sfxDone(a); }
        else fail();
      });
    };
    tryNext();
  }

  function _sfxDone(a) {
    if (a && _sfx !== a) return;
    if (a) _release(a);
    _sfx = null;
    const ws = _sfxWaiters; _sfxWaiters = [];
    ws.forEach(cb => { try { cb(); } catch (_) {} });
  }

  /**
   * 等結算的成功音效播完再開口——兩個一起響會蓋掉鼓勵語，特教學生更聽不清楚。
   *
   * ⚠️ **不能用固定延遲**：音效被瀏覽器擋掉或缺檔時就會白等一段安靜。
   *    改成先讓出 150ms 給 `play()` 生效，再看頁面上有沒有真的在播的 <audio>：
   *    有就等它的 `ended`，沒有就直接開口。
   * ⚠️ 因此**呼叫端一定要排在音效 `play()` 之後**（A6 原本排在前面，已調位）。
   * `playSfx()` 播的音效不必偵測：直接排進 `_sfxWaiters` 等它播完（被擋／缺檔也會通知）。
   */
  function _afterSfx(cb) {
    if (_waitTimer) { clearTimeout(_waitTimer); _waitTimer = null; }
    // 先讓出 150ms 再判斷：C3／F1 是先叫鼓勵語、同一輪稍後才播音效，馬上判斷會以為沒音效
    _waitTimer = setTimeout(() => {
      _waitTimer = null;
      let done = false;
      const go = () => {
        if (done) return;
        done = true;
        if (_waitTimer) { clearTimeout(_waitTimer); _waitTimer = null; }
        if (sfx) sfx.removeEventListener('ended', go);
        cb();
      };
      let sfx = null;
      if (_sfx) {                          // playSfx() 播的：等它播完（被擋／缺檔也會通知）
        _sfxWaiters.push(go);
        _waitTimer = setTimeout(go, 12000);  // 兜底：目前最長的音效 4 秒，ended 沒來也要開口
        return;
      }
      sfx = Array.prototype.slice.call(document.querySelectorAll('audio'))
        .find(a => !a.paused && !a.ended && a.currentTime > 0);
      if (!sfx) { cb(); return; }          // 音效沒播（被擋／缺檔）→ 不必等
      sfx.addEventListener('ended', go);
      _waitTimer = setTimeout(go, 4000);   // 兜底：ended 沒來也要開口
    }, 150);
  }

  /**
   * @param {number} accuracy  正確率（0–100）
   * @param {Function} fallback 沒有預錄可播時的退路（通常是單元原本的即時語音）
   */
  function speak(accuracy, fallback) {
    _play(_lineFor(accuracy).file, fallback);
  }

  /**
   * A 系列專用：自選任務沒有「正確率」（做完就是做完），只播一句完成語。
   * @param {Function} fallback 沒有預錄可播時的退路
   */
  function speakDone(fallback) {
    _play(DONE, fallback);
  }

  function _play(file, fallback) {
    _stopVoice();     // 不停音效——鼓勵語本來就要等它播完
    _afterSfx(() => _playNow(file, fallback));
  }

  function _playNow(file, fallback) {
    const exts = ['mp3', 'wav'];
    let i = 0;
    const tryNext = () => {
      if (i >= exts.length) { try { fallback && fallback(); } catch (_) {} return; }
      const a = new Audio(`${_prefix()}${BASE}${file}.${exts[i++]}`);
      _audio = a;
      let advanced = false;
      const fail = () => { if (advanced) return; advanced = true; _release(a); tryNext(); };
      a.onerror = fail;
      a.onended = () => { if (_audio === a) _audio = null; _release(a); };
      a.play().catch(fail);      // 手機擋自動播放時也走 fallback
    };
    tryNext();
  }

  return { speak, speakDone, playSfx, afterSfx: _afterSfx, stop, LINES };
})();
