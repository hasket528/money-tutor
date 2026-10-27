// 無照片時的預設頭像（人形剪影，避免 <img src=null> 破圖）
const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23dbe4f0'/><circle cx='50' cy='38' r='18' fill='%239bb0cc'/><path d='M18 86c0-18 14-28 32-28s32 10 32 28z' fill='%239bb0cc'/></svg>";

/**
 * 圖片壓縮函式
 * @param {File} file - 原始圖片檔案
 * @param {number} maxWidth - 最大寬度 (預設 300px，對頭像來說很足夠)
 * @param {number} quality - 圖片品質 0~1 (預設 0.7)
 * @returns {Promise<string>} - 回傳壓縮後的 Base64 字串
 */
function compressImage(file, maxWidth = 300, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                // 計算縮放後的尺寸
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                // 建立 Canvas 繪製圖片
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 輸出壓縮後的 Base64 (強制轉為 jpeg 以便壓縮)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // --- References ---
    const addStudentBtn = document.getElementById('addStudentBtn');
    const iconUploadInput = document.getElementById('iconUploadInput');
    const soundUploadInput = document.getElementById('soundUploadInput');
    const studentsContainer = document.getElementById('studentsContainer');
    const rankButton = document.getElementById('rankButton');
    const bonusSoundSelect = document.getElementById('bonusSoundSelect');
    const bonusIconSelect = document.getElementById('bonusIconSelect');
    const resetButton = document.getElementById('resetButton');
    const clearAllButton = document.getElementById('clearAllButton');
    const previewImage = document.getElementById('bonusIconPreview');
    const previewContainer = document.querySelector('.bonus-icon-preview-container');

    let students = []; // Array to hold student objects { id, photo, score, name }（主列表，最多 15 名）
    let displayedStudentIds = new Set(); // 目前顯示在欄位上的學生 ID（Set of string）
    let uploadedIconCount = 0; // 上傳的自訂圖示計數
    let uploadedSoundCount = 0; // 上傳的自訂音效計數
    let uploadedIcons = []; // 儲存上傳的圖示 { name, dataUrl }（最多 5 個）
    let uploadedSounds = []; // 儲存上傳的音效 { name, dataUrl }
    const deductionSound = new Audio('sound/deduction.mp3'); // Sound for deduction

    // --- 顯示新增學生照片對話框 ---
    function showAddStudentDialog() {
        if (students.length >= 15) {
            alert('最多只能新增 15 位學生！');
            return;
        }
        const overlay = document.createElement('div');
        overlay.className = 'student-selector-overlay';
        overlay.innerHTML = `
            <div class="student-selector-dialog" style="max-width: 400px;">
                <h3>新增學生</h3>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">學生名稱：</label>
                    <input type="text" id="studentNameInput" placeholder="請輸入學生名稱"
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; box-sizing: border-box;">
                </div>

                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">照片（選填，可不放）：</label>
                    <input type="file" id="studentPhotoInput" accept="image/*" style="display: none;">
                    <div id="photoPreviewArea" style="width: 150px; height: 150px; border: 2px dashed #ccc; border-radius: 10px;
                         display: flex; align-items: center; justify-content: center; cursor: pointer; margin: 0 auto;
                         background: #f9f9f9; overflow: hidden;">
                        <span style="color: #999; text-align: center;">點擊選擇照片<br>👆<br><small>（可略過）</small></span>
                    </div>
                    <button type="button" id="removePhotoBtn" style="display: none; margin: 8px auto 0; padding: 4px 12px; border: 1px solid #ddd; border-radius: 5px; background: #fff; cursor: pointer;">✕ 移除照片</button>
                </div>
                <p style="margin: 0 0 16px; color: #888; font-size: 13px; text-align: center;">姓名<b>必填</b>；照片可放可不放，不放會用預設頭像。</p>

                <div class="student-selector-buttons" style="margin-top: 20px;">
                    <button class="confirm-btn" id="confirmAddStudent">確認新增</button>
                    <button class="cancel-btn">取消</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const nameInput = overlay.querySelector('#studentNameInput');
        const photoInput = overlay.querySelector('#studentPhotoInput');
        const previewArea = overlay.querySelector('#photoPreviewArea');
        const removePhotoBtn = overlay.querySelector('#removePhotoBtn');
        const PREVIEW_PLACEHOLDER = '<span style="color: #999; text-align: center;">點擊選擇照片<br>👆<br><small>（可略過）</small></span>';
        let selectedPhotoDataUrl = null;

        // 點擊預覽區域觸發檔案選擇
        previewArea.addEventListener('click', () => photoInput.click());

        // 移除已選照片（改回不放照片，用預設頭像）
        removePhotoBtn.addEventListener('click', () => {
            selectedPhotoDataUrl = null;
            previewArea.innerHTML = PREVIEW_PLACEHOLDER;
            removePhotoBtn.style.display = 'none';
            photoInput.value = '';
        });

        // 照片選擇後預覽（使用壓縮）
        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                try {
                    // 顯示「處理中...」的提示
                    previewArea.innerHTML = '<span style="color: gray;">壓縮處理中...</span>';

                    // 呼叫壓縮函式（寬度 600px, 品質 0.92——與 index.html 的 compressPhoto 對齊，
                    // 點頭像放大顯示 showPhotoZoom 最大 90vw/80vh，300px 會被拉伸到明顯模糊；
                    // 品質選 0.92 不選 1.0，理由見 compressPhoto 旁的實測註解）
                    selectedPhotoDataUrl = await compressImage(file, 600, 0.92);

                    // 顯示壓縮後的圖片
                    previewArea.innerHTML = `<img src="${selectedPhotoDataUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
                    removePhotoBtn.style.display = 'block';
                } catch (err) {
                    console.error("圖片壓縮失敗", err);
                    alert("圖片處理失敗，請重試");
                    previewArea.innerHTML = '<span style="color: #999; text-align: center;">點擊選擇照片</span>';
                }
            }
        });

        // 確認新增
        overlay.querySelector('#confirmAddStudent').addEventListener('click', () => {
            const name = nameInput.value.trim();

            if (!name) {
                alert('請輸入學生姓名！（照片可放可不放）');
                return;
            }

            const student = {
                id: Date.now() + Math.random(),
                name: name,                    // 姓名必填
                photo: selectedPhotoDataUrl,   // 可為 null（不放照片會用預設頭像）
                score: 0
            };

            students.push(student);
            displayedStudentIds.add(String(student.id));
            saveToLocalStorage();
            refreshDisplay(!!document.querySelector('.rank-number'));
            document.body.removeChild(overlay);
            console.log(`✅ 已新增學生：${name}`);
        });

        // 取消
        overlay.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        // 自動聚焦名稱輸入框
        setTimeout(() => nameInput.focus(), 100);
    }

    // --- localStorage 持久化功能 ---
    const STORAGE_KEY = 'rewardSystemStudents';

    function saveToLocalStorage() {
        try {
            // 儲存學生資料（包含照片和分數）
            localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
            // 儲存目前顯示中的學生 ID
            localStorage.setItem('rewardSystemDisplayed', JSON.stringify([...displayedStudentIds]));
            // 儲存自訂加分圖示
            localStorage.setItem('rewardSystemIcons', JSON.stringify(uploadedIcons));
            // 儲存目前選取的加分圖示
            localStorage.setItem('rewardSystemSelectedIcon', bonusIconSelect.value);
            // 儲存自訂加分音效
            localStorage.setItem('rewardSystemSounds', JSON.stringify(uploadedSounds));
            console.log('💾 學生資料已儲存到 localStorage');
        } catch (e) {
            console.error('儲存資料失敗:', e);
            // localStorage 可能已滿，特別是儲存大量圖片時
            if (e.name === 'QuotaExceededError') {
                alert('儲存空間已滿！建議減少學生照片數量或清除部分資料。');
            }
        }
    }

    function loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                students = JSON.parse(saved);
                console.log(`📂 已從 localStorage 載入 ${students.length} 位學生資料`);
            }
            // 載入顯示中學生 ID（向後相容：若無記錄則顯示所有學生）
            const savedDisplayed = localStorage.getItem('rewardSystemDisplayed');
            if (savedDisplayed) {
                displayedStudentIds = new Set(JSON.parse(savedDisplayed));
            } else {
                students.forEach(s => displayedStudentIds.add(String(s.id)));
            }
            // 載入自訂加分圖示並重建下拉選單
            const savedIcons = localStorage.getItem('rewardSystemIcons');
            if (savedIcons) {
                uploadedIcons = JSON.parse(savedIcons);
                uploadedIconCount = uploadedIcons.length;
                uploadedIcons.forEach(icon => {
                    const option = document.createElement('option');
                    option.value = icon.dataUrl;
                    option.textContent = `📤 ${icon.name}`;
                    option.setAttribute('data-icon-name', icon.name);
                    bonusIconSelect.appendChild(option);
                });
                console.log(`📂 已從 localStorage 載入 ${uploadedIcons.length} 個自訂圖示`);
            }
            // 還原上次選取的加分圖示
            const savedSelectedIcon = localStorage.getItem('rewardSystemSelectedIcon');
            if (savedSelectedIcon) {
                bonusIconSelect.value = savedSelectedIcon;
                updateBonusIconPreview(savedSelectedIcon);
            }
            updateIconDeleteBtnVisibility();
            // 載入自訂加分音效並重建下拉選單
            const savedSounds = localStorage.getItem('rewardSystemSounds');
            if (savedSounds) {
                uploadedSounds = JSON.parse(savedSounds);
                uploadedSoundCount = uploadedSounds.length;
                uploadedSounds.forEach(sound => {
                    const option = document.createElement('option');
                    option.value = sound.dataUrl;
                    option.textContent = `📤 ${sound.name}`;
                    option.setAttribute('data-sound-name', sound.name);
                    bonusSoundSelect.appendChild(option);
                });
                console.log(`📂 已從 localStorage 載入 ${uploadedSounds.length} 個自訂音效`);
            }
            return !!saved;
        } catch (e) {
            console.error('載入資料失敗:', e);
        }
        return false;
    }

    // --- 跨頁面通訊功能 ---
    function processPendingRewards() {
        try {
            const pendingRewards = JSON.parse(localStorage.getItem('pendingRewards') || '[]');
            if (pendingRewards.length > 0 && students.length > 0) {
                console.log(`🎁 發現 ${pendingRewards.length} 筆待處理獎勵`);

                // 計算總分和來源統計
                const totalPoints = pendingRewards.reduce((sum, r) => sum + r.points, 0);

                // 按來源分組統計
                const sourceStats = {};
                pendingRewards.forEach(r => {
                    const source = r.source || '未知來源';
                    if (!sourceStats[source]) {
                        sourceStats[source] = { count: 0, points: 0 };
                    }
                    sourceStats[source].count++;
                    sourceStats[source].points += r.points;
                });

                // 格式化顯示
                const statsText = Object.entries(sourceStats)
                    .map(([source, stat]) => `${source}: ${stat.count} 題 (+${stat.points} 分)`)
                    .join('\n');

                if (confirm(`📝 待發放的獎勵：\n\n${statsText}\n\n🎯 總計: ${totalPoints} 分\n\n是否要發放給學生？`)) {
                    // 顯示學生選擇對話框
                    showStudentSelector(totalPoints, pendingRewards);
                }

                // 清除待處理獎勵
                localStorage.removeItem('pendingRewards');
            }
        } catch (e) {
            console.error('處理待處理獎勵失敗:', e);
        }
    }

    function showStudentSelector(points, rewards) {
        // 建立學生選擇對話框
        const overlay = document.createElement('div');
        overlay.className = 'student-selector-overlay';
        overlay.innerHTML = `
            <div class="student-selector-dialog">
                <h3>選擇要加分的學生</h3>
                <p>總分數: <strong>${points > 0 ? '+' : ''}${points}</strong></p>
                <div class="student-selector-list">
                    ${students.map((s, i) => `
                        <label class="student-selector-item">
                            <input type="checkbox" value="${s.id}">
                            <img src="${s.photo || DEFAULT_AVATAR}" alt="${s.name || '學生 ' + (i + 1)}">
                            <span>${s.name ? s.name + ' - ' : ''}分數: ${s.score}</span>
                        </label>
                    `).join('')}
                </div>
                <div class="student-selector-buttons">
                    <button class="select-all-btn">全選</button>
                    <button class="confirm-btn">確認加分</button>
                    <button class="cancel-btn">取消</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 事件處理
        overlay.querySelector('.select-all-btn').addEventListener('click', () => {
            overlay.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        });

        overlay.querySelector('.confirm-btn').addEventListener('click', () => {
            const selectedIds = Array.from(overlay.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => parseFloat(cb.value));

            if (selectedIds.length === 0) {
                alert('請至少選擇一位學生！');
                return;
            }

            // 為選中的學生加分
            students.forEach(student => {
                if (selectedIds.includes(student.id)) {
                    student.score += points;
                    if (student.score < 0) student.score = 0;
                }
            });

            // 播放音效
            if (points > 0) {
                playSound(true);
            } else {
                playSound(false);
            }

            // 更新顯示並儲存
            refreshDisplay(!!document.querySelector('.rank-number'));
            saveToLocalStorage();

            // 移除對話框
            document.body.removeChild(overlay);

            console.log(`🎉 已為 ${selectedIds.length} 位學生加 ${points} 分`);
        });

        overlay.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    }

    // 監聽來自其他頁面的訊息
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'REWARD_UPDATE') {
            console.log('📨 收到獎勵更新訊息:', event.data);
            processPendingRewards();
        }
    });

    // 定期檢查待處理獎勵（每5秒）
    setInterval(() => {
        const pendingRewards = JSON.parse(localStorage.getItem('pendingRewards') || '[]');
        if (pendingRewards.length > 0 && students.length > 0) {
            processPendingRewards();
        }
    }, 5000);

    // --- Helper Function to Update Preview ---
    function updateBonusIconPreview(src) {
        console.log("updateBonusIconPreview called with src:", src);
        if (previewContainer && previewImage) {
            if (src && src.trim() !== '') {
                // 判斷是 emoji（純文字）還是圖片路徑
                const isEmoji = !src.includes('/') && !src.startsWith('data:');
                if (isEmoji) {
                    // 隱藏 img 元素，顯示 emoji 文字
                    previewImage.style.display = 'none';
                    // 檢查是否已有 emoji 預覽元素
                    let emojiPreview = previewContainer.querySelector('.emoji-preview');
                    if (!emojiPreview) {
                        emojiPreview = document.createElement('span');
                        emojiPreview.className = 'emoji-preview';
                        emojiPreview.style.fontSize = '30px';
                        previewContainer.appendChild(emojiPreview);
                    }
                    emojiPreview.textContent = src;
                    emojiPreview.style.display = 'inline';
                } else {
                    // 顯示圖片，隱藏 emoji
                    previewImage.src = src;
                    previewImage.style.display = 'inline';
                    const emojiPreview = previewContainer.querySelector('.emoji-preview');
                    if (emojiPreview) {
                        emojiPreview.style.display = 'none';
                    }
                }
                previewContainer.classList.add('has-content'); // Use class for visibility
                console.log("Preview showing. Added 'has-content' class.");
            } else {
                previewImage.src = '';
                previewImage.style.display = 'none';
                const emojiPreview = previewContainer.querySelector('.emoji-preview');
                if (emojiPreview) {
                    emojiPreview.style.display = 'none';
                }
                previewContainer.classList.remove('has-content'); // Use class for visibility
                console.log("Preview hidden. Removed 'has-content' class.");
            }
        } else {
            console.error("Preview container or image element not found!");
        }
    }

    // --- Event Listeners ---

    // 新增學生照片按鈕
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            showAddStudentDialog();
        });
    }

    // 上傳加分圖示
    if (iconUploadInput) {
        iconUploadInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                if (uploadedIcons.length >= 5) {
                    alert('最多只能上傳 5 個自訂加分圖示！');
                    e.target.value = null;
                    return;
                }
                uploadedIconCount++;
                const iconName = `自訂圖示${String(uploadedIconCount).padStart(2, '0')}`;
                const dataUrl = await compressImage(file, 200, 0.8);

                // 儲存到陣列
                uploadedIcons.push({ name: iconName, dataUrl: dataUrl });

                // 新增到下拉選單
                const option = document.createElement('option');
                option.value = dataUrl;
                option.textContent = `📤 ${iconName}`;
                option.setAttribute('data-icon-name', iconName);
                bonusIconSelect.appendChild(option);

                // 選擇新上傳的圖示
                bonusIconSelect.value = dataUrl;
                updateBonusIconPreview(dataUrl);
                refreshDisplay(!!document.querySelector('.rank-number'));
                saveToLocalStorage();

                console.log(`✅ 已上傳 ${iconName}`);
            } else if (file) {
                alert('請只上傳圖片文件！');
            }
            e.target.value = null;
        });
    }

    // 上傳加分音效
    const MAX_SOUND_SIZE = 300 * 1024; // 300KB
    if (soundUploadInput) {
        soundUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('audio/')) {
                // 限制只能上傳 1 個自訂音效
                if (uploadedSounds.length >= 1) {
                    alert('只能上傳 1 個自訂加分音效！\n請先刪除現有的自訂音效再上傳新的。');
                    e.target.value = null;
                    return;
                }
                // 限制檔案大小 300KB
                if (file.size > MAX_SOUND_SIZE) {
                    const sizeMB = (file.size / 1024).toFixed(0);
                    alert(`檔案太大（${sizeMB}KB）！\n最大限制 300KB，建議使用 100KB 以內的短音效（3秒以內最佳）。`);
                    e.target.value = null;
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e_reader) => {
                    uploadedSoundCount++;
                    const soundName = `自訂音效`;
                    const dataUrl = e_reader.target.result;

                    // 儲存到陣列
                    uploadedSounds.push({ name: soundName, dataUrl: dataUrl });

                    // 新增到下拉選單
                    const option = document.createElement('option');
                    option.value = dataUrl;
                    option.textContent = `📤 ${soundName}`;
                    option.setAttribute('data-sound-name', soundName);
                    bonusSoundSelect.appendChild(option);

                    // 選擇新上傳的音效
                    bonusSoundSelect.value = dataUrl;

                    // 播放一次確認
                    const testSound = new Audio(dataUrl);
                    testSound.play().catch(err => console.log('播放測試音效失敗:', err));

                    saveToLocalStorage();
                    console.log(`✅ 已上傳 ${soundName}（${(file.size / 1024).toFixed(0)}KB）`);
                };
                reader.readAsDataURL(file);
            } else if (file) {
                alert('請只上傳音效文件 (如 MP3, WAV, OGG)！');
            }
            e.target.value = null;
        });
    }

    // 學生選擇下拉選單
    const studentSelectDropdown = document.getElementById('studentSelectDropdown');
    if (studentSelectDropdown) {
        studentSelectDropdown.addEventListener('change', () => {
            const selectedId = studentSelectDropdown.value;
            if (!selectedId) return;
            if (displayedStudentIds.has(selectedId)) {
                // 已顯示：滾動到並高亮
                const row = studentsContainer.querySelector(`[data-student-id="${selectedId}"]`);
                if (row) {
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    row.style.transition = 'box-shadow 0.4s';
                    row.style.boxShadow = '0 0 0 4px #28a745';
                    setTimeout(() => { row.style.boxShadow = ''; }, 2000);
                }
            } else {
                // 未顯示：加入欄位
                displayedStudentIds.add(selectedId);
                saveToLocalStorage();
                refreshDisplay(!!document.querySelector('.rank-number'));
                setTimeout(() => {
                    const row = studentsContainer.querySelector(`[data-student-id="${selectedId}"]`);
                    if (row) {
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        row.style.transition = 'box-shadow 0.4s';
                        row.style.boxShadow = '0 0 0 4px #28a745';
                        setTimeout(() => { row.style.boxShadow = ''; }, 2000);
                    }
                }, 100);
            }
        });
    }

    // 永久刪除學生按鈕
    const studentDeleteBtn = document.getElementById('studentDeleteBtn');
    if (studentDeleteBtn) {
        studentDeleteBtn.addEventListener('click', () => {
            const selectedId = studentSelectDropdown ? studentSelectDropdown.value : '';
            if (!selectedId) { alert('請先從下拉選單選擇要刪除的學生！'); return; }
            const student = students.find(s => String(s.id) === selectedId);
            if (!student) return;
            const name = student.name || `學生`;
            if (confirm(`確定要永久刪除「${name}」的資料嗎？\n此操作無法復原，且無法從下拉選單復原。`)) {
                students = students.filter(s => String(s.id) !== selectedId);
                displayedStudentIds.delete(selectedId);
                if (studentSelectDropdown) studentSelectDropdown.value = '';
                saveToLocalStorage();
                refreshDisplay(!!document.querySelector('.rank-number'));
            }
        });
    }

    // 刪除自訂加分圖示按鈕
    // 依選取類型顯示/隱藏圖示刪除鈕
    function updateIconDeleteBtnVisibility() {
        const btn = document.getElementById('iconDeleteBtn');
        if (!btn) return;
        const selectedOpt = bonusIconSelect.options[bonusIconSelect.selectedIndex];
        const isCustom = selectedOpt && selectedOpt.getAttribute('data-icon-name');
        // 用 visibility 而非 display，確保按鈕始終佔位，不影響版面
        btn.style.visibility = isCustom ? 'visible' : 'hidden';
    }

    const iconDeleteBtn = document.getElementById('iconDeleteBtn');
    if (iconDeleteBtn) {
        iconDeleteBtn.addEventListener('click', () => {
            const selectedOpt = bonusIconSelect.options[bonusIconSelect.selectedIndex];
            const iconName = selectedOpt ? selectedOpt.getAttribute('data-icon-name') : null;
            if (!iconName) {
                alert('只能刪除自訂上傳的圖示（內建 emoji 無法刪除）！');
                return;
            }
            if (confirm(`確定要刪除「${iconName}」嗎？`)) {
                uploadedIcons = uploadedIcons.filter(i => i.name !== iconName);
                uploadedIconCount = uploadedIcons.length;
                // 移除 select 中對應的 option
                if (selectedOpt) bonusIconSelect.removeChild(selectedOpt);
                // 重置為第一個選項
                bonusIconSelect.selectedIndex = 0;
                const newVal = bonusIconSelect.value;
                updateBonusIconPreview(newVal);
                updateIconDeleteBtnVisibility();
                localStorage.setItem('rewardSystemSelectedIcon', newVal);
                saveToLocalStorage();
                refreshDisplay(!!document.querySelector('.rank-number'));
            }
        });
    }

    // Bonus Icon Dropdown Selection
    bonusIconSelect.addEventListener('change', () => {
        const selectedValue = bonusIconSelect.value;
        console.log("已選擇圖示:", selectedValue);
        updateBonusIconPreview(selectedValue);
        updateIconDeleteBtnVisibility();
        localStorage.setItem('rewardSystemSelectedIcon', selectedValue);
        refreshDisplay(!!document.querySelector('.rank-number'));
    });

    // Bonus Sound Dropdown Selection
    bonusSoundSelect.addEventListener('change', () => {
        console.log("已選擇音效:", bonusSoundSelect.value);
    });

    // 刪除自訂加分音效按鈕
    const soundDeleteBtn = document.getElementById('soundDeleteBtn');
    if (soundDeleteBtn) {
        soundDeleteBtn.addEventListener('click', () => {
            const selectedValue = bonusSoundSelect.value;
            if (!selectedValue.startsWith('data:')) {
                alert('只能刪除自訂上傳的音效（內建音效無法刪除）！');
                return;
            }
            const selectedOpt = bonusSoundSelect.options[bonusSoundSelect.selectedIndex];
            const soundName = selectedOpt ? (selectedOpt.getAttribute('data-sound-name') || '此音效') : '此音效';
            if (confirm(`確定要刪除「${soundName}」嗎？`)) {
                uploadedSounds = [];
                uploadedSoundCount = 0;
                // 移除 select 中對應的 option
                if (selectedOpt) bonusSoundSelect.removeChild(selectedOpt);
                // 重置為第一個選項
                bonusSoundSelect.selectedIndex = 0;
                saveToLocalStorage();
            }
        });
    }

    // === 音效預聽按鈕 ===
    const previewSoundBtn = document.getElementById('previewSoundBtn');
    if (previewSoundBtn) {
        previewSoundBtn.addEventListener('click', () => {
            const soundPath = bonusSoundSelect.value;
            if (soundPath) {
                const previewAudio = new Audio(soundPath);
                previewAudio.play().catch(err => {
                    console.error('播放音效失敗:', err);
                });
            }
        });
    }

    // === 視窗縮放控制 ===
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const container = document.querySelector('.container');
    let currentZoom = 100; // 預設縮放比例 100%
    const ZOOM_STEP = 10; // 每次縮放 10%
    const MIN_ZOOM = 50;  // 最小縮放 50%
    const MAX_ZOOM = 150; // 最大縮放 150%

    // 從 localStorage 載入上次縮放設定
    const savedZoom = parseInt(localStorage.getItem('rewardSystemZoom') || '100');
    if (savedZoom >= MIN_ZOOM && savedZoom <= MAX_ZOOM) {
        currentZoom = savedZoom;
    }

    // ⚠️ 縮放不可做在 document.body 上、也不可用 transform: scale()：
    // CSS 規定只要元素有 transform（哪怕數值是 scale(1) 等於沒縮放），它就會變成子孫
    // position:fixed 元素的新定位基準，不再是瀏覽器真正的視窗。「成就與寵物」彈窗
    // （#growth-overlay，position:fixed; inset:0，設計上要蓋滿整個視窗）一旦 body 被縮放，
    // 就會被框在縮小/位移後的 body 方框裡，出現「畫面只占一半、捲軸拉不出真正視窗」
    // （2026-09-10 老師回報；zoom 比例存在 localStorage 且刻意不隨「清除所有資料」重置，
    // 才會某些裝置一直卡住、某些正常）。改用 CSS 的 zoom 屬性（不會產生新定位基準）
    // 只套在 .container，#growth-overlay 是它的兄弟節點、完全不受影響。
    function applyZoom() {
        if (container) container.style.zoom = currentZoom / 100;
        localStorage.setItem('rewardSystemZoom', currentZoom);
    }

    // 頁面載入時套用已儲存的縮放比例
    applyZoom();

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            if (currentZoom < MAX_ZOOM) {
                currentZoom += ZOOM_STEP;
                applyZoom();
                console.log(`視窗放大至 ${currentZoom}%`);
            }
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            if (currentZoom > MIN_ZOOM) {
                currentZoom -= ZOOM_STEP;
                applyZoom();
                console.log(`視窗縮小至 ${currentZoom}%`);
            }
        });
    }

    // Rank Button
    if (rankButton) {
        rankButton.addEventListener('click', () => updateRankings());
    } else { console.error("找不到 ID 為 'rankButton' 的按鈕。"); }

    // Reset Button (只清除分數)
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('確定要清除所有學生的分數紀錄嗎？此操作無法復原。')) {
                students.forEach(student => { student.score = 0; });
                saveToLocalStorage(); // 儲存到 localStorage
                refreshDisplay(false);
                alert('所有分數已清除！');
            }
        });
    } else { console.error("找不到 ID 為 'resetButton' 的按鈕。"); }

    // Clear All Button (清除所有資料，包含學生、自訂圖示、自訂音效)
    if (clearAllButton) {
        clearAllButton.addEventListener('click', () => {
            if (confirm('確定要清除所有資料嗎？包含學生照片、分數、自訂加分圖示與自訂加分音效，此操作無法復原。')) {
                // 清除學生資料
                students = [];
                displayedStudentIds.clear();

                // 清除上傳的加分圖示（移除下拉選單中的自訂項目）
                uploadedIcons = [];
                uploadedIconCount = 0;
                Array.from(bonusIconSelect.options)
                    .filter(opt => opt.getAttribute('data-icon-name'))
                    .forEach(opt => opt.remove());
                bonusIconSelect.selectedIndex = 0;
                updateBonusIconPreview(bonusIconSelect.value);
                updateIconDeleteBtnVisibility();

                // 清除上傳的加分音效（移除下拉選單中的自訂項目）
                uploadedSounds = [];
                uploadedSoundCount = 0;
                Array.from(bonusSoundSelect.options)
                    .filter(opt => opt.getAttribute('data-sound-name'))
                    .forEach(opt => opt.remove());
                bonusSoundSelect.selectedIndex = 0;

                // 清除所有相關 localStorage
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem('pendingRewards');
                localStorage.removeItem('rewardSystemDisplayed');
                localStorage.removeItem('rewardSystemIcons');
                localStorage.removeItem('rewardSystemSounds');
                localStorage.removeItem('rewardSystemSelectedIcon');

                refreshDisplay(false);
                alert('所有資料已清除！');
            }
        });
    }


    // --- Core Functions ---

    // Refresh the entire student display area
    function refreshDisplay(showRanks = false) {
        studentsContainer.innerHTML = '';
        let scoreForRank = -Infinity;
        let rankDisplayCount = 0;

        // 只顯示在 displayedStudentIds 中的學生
        let visibleStudents = students.filter(s => displayedStudentIds.has(String(s.id)));

        if (showRanks && visibleStudents.length > 0) {
            visibleStudents.sort((a, b) => b.score - a.score);
            scoreForRank = visibleStudents[0].score;
        } else if (showRanks && visibleStudents.length === 0) {
            showRanks = false;
        }

        visibleStudents.forEach((student, index) => {
            let rankToShow = null;
            if (showRanks) {
                if (index === 0) {
                    rankToShow = 1;
                    scoreForRank = student.score;
                    rankDisplayCount = 1;
                } else {
                    if (student.score < scoreForRank) {
                        rankToShow = index + 1;
                        scoreForRank = student.score;
                        rankDisplayCount = rankToShow;
                    } else {
                        rankToShow = rankDisplayCount;
                    }
                }
            }
            displayStudent(student, rankToShow);
        });
        updateStudentDropdown();
    }

    // 更新學生選擇下拉選單
    function updateStudentDropdown() {
        const dropdown = document.getElementById('studentSelectDropdown');
        if (!dropdown) return;
        const currentVal = dropdown.value;
        dropdown.innerHTML = '<option value="">── 選擇學生 ──</option>';
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = String(student.id);
            const isDisplayed = displayedStudentIds.has(String(student.id));
            option.textContent = (isDisplayed ? '✓ ' : '＋ ') + (student.name || `學生`);
            dropdown.appendChild(option);
        });
        // 保持原本的選取（若該學生仍存在）
        if (currentVal && students.find(s => String(s.id) === currentVal)) {
            dropdown.value = currentVal;
        }
    }

    // Create and display a single student's row
    function displayStudent(student, rank) {
        const studentRow = document.createElement('div');
        studentRow.className = 'student-row';
        studentRow.setAttribute('data-student-id', student.id);

        const rankDisplay = rank !== null ? `<div class="rank-number">${rank}</div>` : '';

        // Use the currently selected value from the icon dropdown
        // This works for both default paths and the custom Data URL (if selected)
        const currentIconSrc = bonusIconSelect.value;

        let iconsHtml = '';
        if (currentIconSrc && student.score > 0) {
            // Ensure we don't try to create icons if the source is empty (e.g., initial state)
            if (currentIconSrc.trim() !== '') {
                // 判斷是 emoji（純文字）還是圖片路徑
                const isEmoji = !currentIconSrc.includes('/') && !currentIconSrc.startsWith('data:');
                if (isEmoji) {
                    iconsHtml = Array(student.score).fill(0).map(() => `<span class="emoji-icon">${currentIconSrc}</span>`).join('');
                } else {
                    iconsHtml = Array(student.score).fill(0).map(() => `<img src="${currentIconSrc}" alt="加分圖示">`).join('');
                }
            }
        }

        // 顯示學生名稱（若有）
        const nameDisplay = student.name ? `<div class="student-name" style="font-weight: bold; font-size: 16px; margin-top: 5px; text-align: center;">${student.name}</div>` : '';

        studentRow.innerHTML = `
            ${rankDisplay}
            <div class="photo-section">
                <div class="sc-photo-wrap"><img src="${student.photo || DEFAULT_AVATAR}" alt="${student.name || '學生照片'}" class="student-photo" style="cursor: pointer;" title="點擊放大"></div>
                ${nameDisplay}
                <div class="button-group">
                    <button class="add-point-btn" data-id="${student.id}">加分</button>
                    <button class="subtract-point-btn" data-id="${student.id}">扣分</button>
                    <button class="convert-coins-btn" data-id="${student.id}" style="background-color:#f0b429;color:#4a2b00;">🔄 轉換成金幣</button>
                </div>
            </div>
            <div class="student-info">
                <div class="score-section">
                    <div class="student-score" data-student-id="${student.id}">分數：${student.score}</div>
                    <div class="action-buttons">
                        <button class="move-up-btn" data-id="${student.id}" title="上移">⬆️</button>
                        <button class="move-down-btn" data-id="${student.id}" title="下移">⬇️</button>
                        <input type="file" class="change-photo-input" data-id="${student.id}" accept="image/*" style="display: none;">
                        <button class="change-photo-btn" data-id="${student.id}">更改照片</button>
                        <button class="delete-btn" data-id="${student.id}">清空</button>
                    </div>
                </div>
                <div class="icon-display">
                    ${iconsHtml}
                </div>
            </div>
        `;

        // Add event listeners for buttons within the row
        const addPointBtn = studentRow.querySelector('.add-point-btn');
        const subtractPointBtn = studentRow.querySelector('.subtract-point-btn');
        const moveUpBtn = studentRow.querySelector('.move-up-btn');
        const moveDownBtn = studentRow.querySelector('.move-down-btn');
        const changePhotoBtn = studentRow.querySelector('.change-photo-btn');
        const changePhotoInput = studentRow.querySelector('.change-photo-input');
        const deleteBtn = studentRow.querySelector('.delete-btn');

        addPointBtn.addEventListener('click', () => updateScore(student, 1));
        studentRow.querySelector('.convert-coins-btn').addEventListener('click', () => {
            if (student.score <= 0) { alert('目前沒有可轉換的分數（先用加分按鈕累積分數）'); return; }
            if (!confirm(`要把「${student.name || '此學生'}」目前的 ${student.score} 分，轉換成「成就與寵物頁」的金幣嗎？\n（轉換後計分板分數歸 0，金幣可用來餵養寵物）`)) return;
            setCoins(student.id, getCoins(student.id) + student.score);
            student.score = 0;
            saveToLocalStorage();
            refreshDisplay(!!document.querySelector('.rank-number'));
            try { playSound('bonus'); } catch (e) {}
            alert(`✅ 已轉換！「${student.name || '此學生'}」現在有 ${getCoins(student.id)} 金幣可餵養寵物。`);
        });
        subtractPointBtn.addEventListener('click', () => {
             if (student.score > 0) updateScore(student, -1);
        });
        moveUpBtn.addEventListener('click', () => moveStudent(student, -1));
        moveDownBtn.addEventListener('click', () => moveStudent(student, 1));
        changePhotoBtn.addEventListener('click', () => changePhotoInput.click());
        changePhotoInput.addEventListener('change', (e) => handleChangePhoto(e, student));
        deleteBtn.addEventListener('click', () => handleClearStudentFromDisplay(student));

        // 點擊照片放大顯示
        const studentPhoto = studentRow.querySelector('.student-photo');
        // ⭐ 學生在「成就與寵物」挑的展示品，放在照片右下角
        const scEl = window.MTShowcase && MTShowcase.el(student.id, 'sc-corner');
        if (scEl) studentRow.querySelector('.sc-photo-wrap').appendChild(scEl);
        studentPhoto.addEventListener('click', () => showPhotoZoom(student));

        studentsContainer.appendChild(studentRow);
    }

    // --- 照片放大顯示 ---
    // 點學生照片：與測驗頁點學生頭像同一個彈窗（js/showcase.js studentModal，2026-10-07 使用者定統一大小與樣式；
    // 有 ⭐ 展示品時照片與展示品並列）
    function showPhotoZoom(student) {
        if (window.MTShowcase) MTShowcase.studentModal(student);
    }

     // Handle Change Photo Input（使用壓縮）
     async function handleChangePhoto(e, student) {
         const file = e.target.files[0];
         if (file && file.type.startsWith('image/')) {
             try {
                 // 呼叫壓縮函式（600px/0.92，理由同上方新增學生的壓縮呼叫點）
                 const compressedPhoto = await compressImage(file, 600, 0.92);

                 student.photo = compressedPhoto;
                 saveToLocalStorage(); // 儲存到 localStorage
                 refreshDisplay(!!document.querySelector('.rank-number'));

             } catch (err) {
                 console.error("圖片壓縮失敗", err);
                 alert("圖片處理失敗，請重試");
             }
         } else if (file) {
             alert('請只上傳圖片文件！');
         }
         e.target.value = null;
     }

     // Handle Delete Student Button
    // 清空（從欄位移除，下拉選單保留）
    function handleClearStudentFromDisplay(student) {
        displayedStudentIds.delete(String(student.id));
        // 若下拉選單正好選著這位學生，先重設為空，
        // 否則 updateStudentDropdown 會復原選取值，導致 change 事件不再觸發
        const dropdown = document.getElementById('studentSelectDropdown');
        if (dropdown && dropdown.value === String(student.id)) {
            dropdown.value = '';
        }
        saveToLocalStorage();
        if (document.querySelector('.rank-number')) {
            updateRankings();
        } else {
            refreshDisplay(false);
        }
    }

    // 永久刪除（從主列表移除，內部用）
    function handleDeleteStudent(student) {
        students = students.filter(s => s.id !== student.id);
        displayedStudentIds.delete(String(student.id));
        saveToLocalStorage();
        if (document.querySelector('.rank-number')) {
            updateRankings();
        } else {
            refreshDisplay(false);
        }
    }

    // 移動學生順序（上下排序）
    function moveStudent(student, direction) {
        const index = students.findIndex(s => s.id === student.id);
        const newIndex = index + direction;

        if (newIndex >= 0 && newIndex < students.length) {
            // 交換位置
            [students[index], students[newIndex]] = [students[newIndex], students[index]];
            saveToLocalStorage();
            refreshDisplay(false); // 不顯示排名，保持手動順序
        }
    }

    // Play Bonus or Deduction Sound
    function playSound(isBonus) {
        let sound;

        if (isBonus) {
             const soundPath = bonusSoundSelect.value;
             if (soundPath && soundPath.trim() !== '') {
                  sound = new Audio(soundPath);
             } else {
                 console.log("未選擇加分音效或音效來源無效");
                 return;
             }
        } else { // Deduction sound
             sound = deductionSound.cloneNode(); // Clone to allow overlapping plays
        }

        sound.play().catch(error => {
            console.error('播放音效失敗:', error, '路徑:', sound ? sound.src : 'N/A');
        });
    }

    // Update a student's score and refresh display
    function updateScore(student, increment) {
        const newScore = student.score + increment;
        if (newScore >= 0) {
             student.score = newScore;
             playSound(increment > 0); // Play sound (bonus or deduction based on selection)
             saveToLocalStorage(); // 儲存到 localStorage
             refreshDisplay(!!document.querySelector('.rank-number'));
        } else {
            console.log("分數不能低於0");
        }
    }

    // Trigger a display refresh with ranks enabled
     function updateRankings() {
        refreshDisplay(true);
    }

     // --- Initial Load ---
     console.log("DOM Loaded. Initializing.");

     // 初始化加分圖示預覽
     updateBonusIconPreview(bonusIconSelect.value);
     updateIconDeleteBtnVisibility();

     // 從 localStorage 載入學生資料
     loadFromLocalStorage();

     // Initial display of students (without ranks)
     refreshDisplay(false);

     // 延遲檢查待處理獎勵（給使用者一點時間看到介面）
     setTimeout(() => {
         processPendingRewards();
     }, 1000);

     // 從導覽列「🌟 成就與寵物」（?page=growth）進來 → 自動開啟成就與寵物頁
     if (new URLSearchParams(location.search).get('page') === 'growth') {
         const roster = JSON.parse(localStorage.getItem('rewardSystemStudents') || '[]');
         // 優先開啟主頁「金隊長」選好的目前學生，避免預設開到別的學生看到 0 金幣
         const cur = JSON.parse(localStorage.getItem('sp_currentStudent') || 'null');
         const target = (cur && roster.find(s => String(s.id) === String(cur.id))) || roster[0];
         if (target) setTimeout(() => openGrowthPage(target), 150);
         else setTimeout(() => alert('目前還沒有學生～請先在「主頁 → 金婆婆」建立學生。'), 300);
     }

    // ─── 學生成長頁（徽章/寶石/寵物/寶物；共用邏輯在 ../js/growth-system.js）───
    // 重要：所有金幣增減都走閉包內的 students 陣列＋saveToLocalStorage()，
    // 與計分板同一份資料，避免 localStorage 直寫互相覆蓋。
    let _gpStudent = null, _gpRecords = [];
    let _creaturePage = 0;                       // 寵物圖鑑分頁
    let _myPetKey = null, _myPetStage = null;    // (舊)我的寵物切換
    let _savePetIdx = 0, _savePetStage = null;   // 我的存錢寵物：0=存錢豬，其後=已解鎖寵物；_savePetStage=檢視階段
    let _previewKey = null;                      // 未解鎖寵物的「預覽」（點圖鑑灰階卡片可看，不會真的解鎖）
    const CREATURE_PAGE_SIZE = 8;                // 圖鑑每頁隻數

    async function openGrowthPage(student) {
        if (typeof GrowthSystem === 'undefined') { alert('成長系統載入失敗，請重新整理頁面'); return; }
        _gpStudent = student;
        _gpRecords = await GrowthSystem.readAllRecords();
        renderGrowthPage();
        setupPetFx();   // 綁定寵物互動特效(僅一次)
        document.getElementById('growth-overlay').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    window.closeGrowthPage = function () {
        document.getElementById('growth-overlay').classList.remove('open');
        document.body.style.overflow = '';
        stopPetSpeech();   // 關掉成就與寵物頁＝寵物介紹不要繼續唸
        refreshDisplay(!!document.querySelector('.rank-number'));   // 金幣可能已變動
    };

    // 寵物區下方的訊息屬於「當時那一隻」：換成別隻（◀▶、點圖鑑、預覽）就清掉（2026-10-07 使用者回報：
    // 火苗獸進化的訊息切回神祕金蛋還留著）。新訊息在下一次畫面重繪時認定歸誰。
    let _msgPet = null, _msgPending = false;
    function gpMsg(t) { document.getElementById('gp-msg').textContent = t || ''; _msgPending = !!t; }

    // 用金幣兌換寶石（GEM_COIN_COST 金幣 → 1 寶石）
    window.gpBuyGem = function () {
        const stu = _gpStudent; if (!stu) return;
        const cost = GrowthSystem.GEM_COIN_COST;
        if (getCoins(stu.id) < cost) { gpMsg(`金幣不夠（需 ${cost} 🪙）——到「優良表現獎勵板」把分數「🔄 轉換成金幣」！`); return; }
        setCoins(stu.id, getCoins(stu.id) - cost);
        GrowthSystem.addGems(stu.id, 1);
        try { playSound('bonus'); } catch (e) {}
        gpMsg('✨ 兌換成功！獲得 1 顆 💎 寶石');
        renderGrowthPage();
    };

    // 捲動讓「我的存錢寵物」露出於導覽列下方（用受控 scrollTo，不會卡住無法往上滑）
    function scrollPetIntoView() {
        const ov = document.getElementById('growth-overlay');
        const box = document.querySelector('.gp-pet');
        if (!ov || !box) return;
        const top = box.getBoundingClientRect().top - ov.getBoundingClientRect().top + ov.scrollTop - 64;
        ov.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    // 收集寵物圖鑑：5 隻原創生物，用寶石解鎖，解鎖後隨主課程練習成長進化
    function renderCreatures() {
        const G = GrowthSystem, stu = _gpStudent;
        const host = document.getElementById('gp-creatures');
        const nav  = document.getElementById('gp-creatures-nav');
        if (!host || !G.CREATURES) return;
        const gems = G.gemsAvailable(_gpRecords, stu.id);
        const all  = [{ __pig: true }].concat(G.CREATURES);   // 第一個放存錢寵物(神祕金蛋)
        const pageSize = window.matchMedia('(min-width: 768px)').matches ? 10 : 6;  // 桌面端 10、窄螢幕 6（依版面調整）
        const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
        if (_creaturePage >= totalPages) _creaturePage = totalPages - 1;
        if (_creaturePage < 0) _creaturePage = 0;
        const start = _creaturePage * pageSize;
        const pageItems = all.slice(start, start + pageSize);
        host.innerHTML = '';
        pageItems.forEach(c => {
            if (c.__pig) {   // 存錢寵物(神祕金蛋)卡：點了在「我的存錢寵物」顯示
                const pet = G.petData(stu.id), pstage = G.petStage(pet);
                const pel = document.createElement('div');
                pel.className = 'gp-crt'; pel.style.cursor = 'pointer';
                pel.title = '存錢寵物・點我在「我的存錢寵物」顯示';
                pel.innerHTML = `<div class="gp-crt-emoji"><img class="gp-crt-img" src="../${G.PET_STAGES[pstage].img}" alt="存錢寵物"></div>
                    <div class="gp-crt-name">${G.PET_STAGES[pstage].name}</div>
                    <div class="gp-crt-sub">🐷 存錢寵物</div>`;
                pel.addEventListener('click', () => {
                    _previewKey = null; _savePetIdx = 0; _savePetStage = null; renderGrowthPage();
                    scrollPetIntoView();
                    speakPetDesc(true);   // 點寵物＝顯示並朗讀「目前階段」的介紹
                });
                host.appendChild(pel);
                return;
            }
            const st = G.creatureState(_gpRecords, stu.id, c.key);
            const locked = st.stage < 0;
            const el = document.createElement('div');
            el.className = 'gp-crt' + (locked ? ' locked' : '');
            // 圖片優先，載入失敗自動退回 emoji
            const emo = c.stages[st.stage];
            const visual = locked
                ? `<div class="gp-crt-emoji"><img class="gp-crt-img gp-crt-locked-img" src="../images/pets/pet_${c.key}_s0.png" alt="未解鎖" onerror="this.replaceWith(document.createTextNode('❓'))"></div>`
                : `<div class="gp-crt-emoji"><img class="gp-crt-img" src="../images/pets/pet_${c.key}_s${st.stage}.png" alt="${c.name}" onerror="this.replaceWith(document.createTextNode('${emo}'))"></div>`;
            let sub = '', btn = '';
            if (locked) {
                const uc = G.cfg().unlockCoins;
                sub = `🔒 ${uc} 金幣 解鎖`;
                const can = getCoins(stu.id) >= uc;
                btn = `<button class="gp-crt-btn" data-key="${c.key}" ${can ? '' : 'disabled'}>解鎖</button>`;
            } else if (st.stage >= 3) {
                sub = '🎉 已完全進化';
            } else {
                const cdd = G.petsData(stu.id)[c.key] || {};
                const finalNeed = G.PET_STAGES[3].need;
                if ((cdd.fed || 0) >= finalNeed && !cdd.evolved) sub = '✨ 可用寶石進化';
                else { const cn = Math.max(0, Math.ceil((st.next - st.grown) / G.FEED_GAIN) * G.FEED_COST); sub = `再 ${cn} 金幣進化`; }
            }
            el.innerHTML = `${visual}
                <div class="gp-crt-name">${(c.stageNames && c.stageNames[locked ? 0 : st.stage]) || c.name}</div>
                <div class="gp-crt-sub">${sub}</div>${btn}`;
            // 不論有沒有解鎖都可點：方便老師跟學生介紹「還可以換到什麼」；未解鎖只是在上方
            // 「我的存錢寵物」預覽（_previewKey），不會真的解鎖——真正解鎖仍要按下面的「解鎖」
            // 鈕扣金幣（2026-09-10 由「只有已解鎖才可點」放寬；解鎖鈕自己的 click 見下方
            // querySelectorAll('.gp-crt-btn')，用 closest 排除避免同一下觸發兩件事）
            el.style.cursor = 'pointer';
            el.title = locked ? '點我在「我的存錢寵物」預覽這隻（尚未解鎖）' : '點我在「我的存錢寵物」顯示這隻';
            el.addEventListener('click', (e) => {
                if (e.target.closest('.gp-crt-btn')) return;
                if (locked) {
                    _previewKey = c.key;
                    _savePetStage = 0;
                } else {
                    const unlocked = G.CREATURES.filter(cc => G.creatureState(_gpRecords, stu.id, cc.key).stage >= 0);
                    const idx = unlocked.findIndex(cc => cc.key === c.key);
                    if (idx < 0) return;
                    _previewKey = null;
                    _savePetIdx = idx + 1;   // pets[0]=存錢豬，其後依序為已解鎖寵物
                    _savePetStage = null;
                }
                renderGrowthPage();
                scrollPetIntoView();
                speakPetDesc(true);   // 點寵物＝顯示並朗讀「目前階段」的介紹（未解鎖＝蛋）
            });
            host.appendChild(el);
        });
        host.querySelectorAll('.gp-crt-btn').forEach(b => {
            b.addEventListener('click', () => {
                const uc = G.cfg().unlockCoins;
                const msg = document.getElementById('gp-creatures-msg');
                if (getCoins(stu.id) < uc) { if (msg) msg.textContent = `金幣不夠——解鎖要 ${uc} 金幣（可把單元獎勵領成金幣）！`; return; }
                const ok = G.unlockCreature(stu.id, b.dataset.key);
                if (ok) {
                    setCoins(stu.id, getCoins(stu.id) - uc);
                    if (msg) msg.textContent = '🎉 解鎖成功！餵金幣牠就會長大進化！';
                    renderGrowthPage();
                    playUnlockEffect(b.dataset.key);   // 🔓 解鎖動畫（音效在動畫裡播）
                }
            });
        });
        // 分頁控制
        if (nav) {
            nav.innerHTML =
                `<button class="gp-page-btn" id="gp-crt-prev" ${_creaturePage === 0 ? 'disabled' : ''}>◀</button>` +
                `<span class="gp-page-info">第 ${_creaturePage + 1} / ${totalPages} 頁</span>` +
                `<button class="gp-page-btn" id="gp-crt-next" ${_creaturePage >= totalPages - 1 ? 'disabled' : ''}>▶</button>`;
            const prev = nav.querySelector('#gp-crt-prev'), next = nav.querySelector('#gp-crt-next');
            if (prev) prev.onclick = () => { if (_creaturePage > 0) { _creaturePage--; renderCreatures(); } };
            if (next) next.onclick = () => { if (_creaturePage < totalPages - 1) { _creaturePage++; renderCreatures(); } };
        }
    }

    // 我的寵物：在已解鎖的寵物間左右切換；下方切換「已到達」的階段（未進化的階段不可看）
    function renderMyPet() {
        const G = GrowthSystem, stu = _gpStudent;
        const host = document.getElementById('gp-mypet');
        if (!host || !G.CREATURES) return;
        const unlocked = G.CREATURES.filter(c => G.creatureState(_gpRecords, stu.id, c.key).stage >= 0);
        if (unlocked.length === 0) {
            host.innerHTML = '<div class="gp-mypet-empty">還沒有解鎖的寵物～到下方「寵物圖鑑」用 💎 解鎖第一隻吧！</div>';
            return;
        }
        if (!_myPetKey || !unlocked.some(c => c.key === _myPetKey)) { _myPetKey = unlocked[0].key; _myPetStage = null; }
        const idx = unlocked.findIndex(c => c.key === _myPetKey);
        const c   = unlocked[idx];
        const st  = G.creatureState(_gpRecords, stu.id, c.key);
        const maxStage = st.stage;                         // 已到達的最高階段
        if (_myPetStage == null || _myPetStage > maxStage || _myPetStage < 0) _myPetStage = maxStage;
        const vs  = _myPetStage;
        const emo = c.stages[vs];
        host.innerHTML =
            `<div class="gp-mypet-row">
                <button class="gp-page-btn" id="gp-mp-prev" ${unlocked.length <= 1 ? 'disabled' : ''}>◀</button>
                <div class="gp-mypet-main">
                    <img class="gp-mypet-img" src="../images/pets/pet_${c.key}_s${vs}.png" alt="${c.name}" onerror="this.replaceWith(document.createTextNode('${emo}'))">
                    <div class="gp-mypet-name">${c.name}（${idx + 1}/${unlocked.length}）</div>
                </div>
                <button class="gp-page-btn" id="gp-mp-next" ${unlocked.length <= 1 ? 'disabled' : ''}>▶</button>
            </div>
            <div class="gp-mypet-stage">
                <button class="gp-page-btn gp-sm" id="gp-mp-sprev" ${vs <= 0 ? 'disabled' : ''}>◀</button>
                <span class="gp-mypet-stage-label">階段 ${vs + 1} / ${maxStage + 1}${maxStage <= 0 ? '（尚未進化）' : ''}</span>
                <button class="gp-page-btn gp-sm" id="gp-mp-snext" ${vs >= maxStage ? 'disabled' : ''}>▶</button>
            </div>`;
        const q = id => host.querySelector(id);
        q('#gp-mp-prev').onclick = () => { _myPetKey = unlocked[(idx - 1 + unlocked.length) % unlocked.length].key; _myPetStage = null; renderMyPet(); };
        q('#gp-mp-next').onclick = () => { _myPetKey = unlocked[(idx + 1) % unlocked.length].key; _myPetStage = null; renderMyPet(); };
        q('#gp-mp-sprev').onclick = () => { if (vs > 0) { _myPetStage = vs - 1; renderMyPet(); } };
        q('#gp-mp-snext').onclick = () => { if (vs < maxStage) { _myPetStage = vs + 1; renderMyPet(); } };
    }

    // 中文語音朗讀（寵物介紹詞／名稱）
    function _pickZhVoice() {   // 高品質中文音色優先序：Google 台灣國語→其他 Google 中文→雅婷→…
        const vs = speechSynthesis.getVoices();
        return vs.find(v => /google/i.test(v.name) && v.lang === 'zh-TW') ||
               vs.find(v => /google/i.test(v.name) && v.lang && v.lang.startsWith('zh')) ||
               vs.find(v => /google/i.test(v.name) && /(國語|中文|mandarin|chinese)/i.test(v.name)) ||
               vs.find(v => /yating/i.test(v.name)) ||
               vs.find(v => /microsoft/i.test(v.name) && /online/i.test(v.name) && v.lang && v.lang.startsWith('zh')) ||
               vs.find(v => v.lang === 'zh-TW') || vs.find(v => v.lang && v.lang.startsWith('zh')) || null;
    }
    // 寵物介紹朗讀中 → 🔊 鈕變 ⏹（再按一下＝停止）；唸完、被打斷、換寵物／階段、關頁都要回到 🔊
    let _petSpeechSeq = 0;
    function setSpeakBtn(on) {
        const b = document.querySelector('.gp-desc-speak');
        if (!b) return;
        b.classList.toggle('speaking', on);
        b.textContent = on ? '⏹' : '🔊';
        b.title = b.ariaLabel = on ? '停止朗讀' : '朗讀介紹詞';
    }
    function stopPetSpeech() {
        _petSpeechSeq++;
        try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
        setSpeakBtn(false);
    }
    function speakText(text) {
        if (!text || !window.speechSynthesis) return;
        const seq = ++_petSpeechSeq;
        const doSpeak = () => {
            if (seq !== _petSpeechSeq) return;   // 等語音清單時已被停止或換成別段
            try {
                if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
                // 讀音修正：「骰子獸」的「骰子」臺灣語音唸 ㄊㄡˊ˙ㄗ（像「頭子」）→ 改唸「繺子」，畫面文字不變（2026-10-09 使用者定，同 B5）
                const u = new SpeechSynthesisUtterance(String(text).replace(/骰子/g, '繺子'));
                u.lang = 'zh-TW'; u.rate = 0.95;
                const v = _pickZhVoice();
                if (v) u.voice = v;   // 沒挑到＝只給 lang，交給 js/audio-unlocker.js 守門員當下挑中文聲
                const done = () => { if (seq === _petSpeechSeq) setSpeakBtn(false); };
                u.onend = done; u.onerror = done;
                speechSynthesis.speak(u);
                setSpeakBtn(true);
            } catch (e) { setSpeakBtn(false); }
        };
        // 🔴 語音清單是空的也要當下就唸（2026-10-10 手機點寵物沒聲音）：手機 getVoices() 常是空的，
        // voiceschanged 很晚才來或根本不來；等它＝脫離點擊手勢，手機會擋掉、整頁靜音（同 tests/_e2e_no_voice_list.js 那次）
        doSpeak();
    }
    try { if (window.speechSynthesis) speechSynthesis.getVoices(); } catch (e) {}   // 提早觸發音色載入
    // 🔍 放大看寵物（2026-10-07 使用者定）：名稱旁的按鈕開彈窗，圖跟著目前顯示的階段；點寵物一樣有互動效果
    // 放大彈窗：寵物（名稱旁 🔍）、徽章與寶物（格子右上角 🔍）共用；gray＝未取得、sound＝點圖的音效（依種類）
    window.openItemZoom = function (src, name, o) {
        o = o || {};
        const z = document.getElementById('gp-zoom'), zi = document.getElementById('gp-zoom-img'), ze = document.getElementById('gp-zoom-emoji');
        if (!z || !zi) return;
        zi.hidden = !src; if (src) zi.src = src;
        if (ze) { ze.hidden = !!src; ze.textContent = src ? '' : (o.icon || ''); }
        zi.classList.toggle('gp-pet-preview', !!o.gray);
        // 底下的提示字：還沒兌換＝沒有互動效果，提示也要說清楚（2026-10-09 使用者定）
        const tip = z.querySelector('.gp-zoom-tip');
        if (tip) tip.textContent = o.gray ? '還沒兌換，無法跟它玩！' : '點一下圖，跟它玩！';
        zi.dataset.sound = o.sound || '';
        zi.dataset.type = o.type || 'pet';   // 點放大圖的特效種類
        document.getElementById('gp-zoom-name').textContent = name || '';
        z.hidden = false;
        window.MTShowcase?.playOpen();   // 打開放大彈窗的音效（同學生彈窗）
        if (src) petReact(false, zi);
    };
    window.openPetZoom = function () {
        const src = document.getElementById('gp-pet-img');
        if (!src) return;
        window.openItemZoom(src.src, (document.getElementById('gp-pet-name')?.textContent || '').trim(),
            { gray: src.classList.contains('gp-pet-preview') });
    };
    window.closePetZoom = function () { const z = document.getElementById('gp-zoom'); if (z) z.hidden = true; };
    // 朗讀畫面上那一階段的介紹（朗讀文字已含名稱＝GrowthSystem 的 stageSpeech／speech，不要再自己加名字）
    // 喇叭鈕：沒在唸＝開始、唸到一半＝停止；restart＝點寵物時一律從頭唸
    function petSpeechNow() { const el = document.getElementById('gp-pet-desc'); return (el && el.dataset.speech) || ''; }
    window.speakPetDesc = function (restart) {
        if (!restart && document.querySelector('.gp-desc-speak.speaking')) { stopPetSpeech(); return; }
        const t = petSpeechNow();
        if (t) speakText(t); else stopPetSpeech();
    };

    // 成就與寵物頁的「金幣」獨立於計分板分數，另存 mt_coins_{id}；由「🔄 轉換成金幣」注入
    function getCoins(stuId) { return parseInt(localStorage.getItem('mt_coins_' + stuId) || '0', 10) || 0; }
    function setCoins(stuId, v) { localStorage.setItem('mt_coins_' + stuId, String(Math.max(0, v | 0))); }

    // 🔓 解鎖寵物動畫（2026-10-10 使用者定）：🔒 晃動 → 彈開 → 蛋從光裡跳出＋星星 →「解鎖了○○！」；
    // 按「太棒了！」或點外面關閉，關閉後上方「我的存錢寵物」切到這隻並朗讀介紹。樣式在 reward/index.html「解鎖寵物動畫」
    function playUnlockEffect(key) {
        const G = GrowthSystem;
        const c = G.CREATURES.find(x => x.key === key);
        if (!c) return;
        const name = (c.stageNames && c.stageNames[0]) || c.name;
        const ov = document.createElement('div');
        ov.className = 'gp-unlock';
        ov.innerHTML = `<div class="gp-unlock-card" role="dialog" aria-modal="true" aria-label="解鎖寵物">
            <div class="gp-unlock-stage"><span class="gp-unlock-lock" aria-hidden="true">🔒</span>
              <img class="gp-unlock-pet" src="../images/pets/pet_${key}_s0.png" alt="${name}"></div>
            <div class="gp-unlock-title">🎉 解鎖了「${name}」！</div>
            <div class="gp-unlock-sub">餵金幣牠就會長大進化！</div>
            <button type="button" class="gp-unlock-ok">太棒了！</button></div>`;
        // 掛在成長頁外框裡：卡片底色等變數（--gp-card-bg…）定義在 #growth-overlay，掛 body 會讀不到（變透明）
        (document.getElementById('growth-overlay') || document.body).appendChild(ov);
        const T = [];
        const at = (ms, fn) => T.push(setTimeout(fn, ms));
        const stage = ov.querySelector('.gp-unlock-stage'), lock = ov.querySelector('.gp-unlock-lock');
        const pet = ov.querySelector('.gp-unlock-pet');
        pet.onerror = () => { const sp = document.createElement('span'); sp.className = pet.className; sp.style.fontSize = '110px'; sp.textContent = c.stages[0]; pet.replaceWith(sp); };
        at(900, () => { lock.textContent = '🔓'; lock.classList.add('open'); });
        at(1150, () => {
            try { playSound('bonus'); } catch (e) {}
            const mk = cls => { const el = document.createElement('div'); el.className = cls; stage.appendChild(el); void el.offsetWidth; el.classList.add('go'); };
            mk('gp-evo-glow'); mk('gp-evo-ring');
            const glyphs = ['✨', '⭐', '🌟', '💫'], N = 14;
            for (let i = 0; i < N; i++) {
                const s = document.createElement('div'); s.className = 'gp-evo-star'; s.textContent = glyphs[i % glyphs.length];
                const ang = (Math.PI * 2 * i) / N + Math.random() * 0.5, dist = 80 + Math.random() * 50;
                s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(0) + 'px');
                s.style.setProperty('--dy', (Math.sin(ang) * dist).toFixed(0) + 'px');
                s.style.animationDelay = (Math.random() * 0.3).toFixed(2) + 's';
                stage.appendChild(s); void s.offsetWidth; s.classList.add('go');
            }
            const p2 = ov.querySelector('.gp-unlock-pet'); if (p2) p2.classList.add('go');
        });
        at(1700, () => ov.querySelectorAll('.gp-unlock-title, .gp-unlock-sub, .gp-unlock-ok').forEach(el => el.classList.add('go')));
        at(1750, () => ov.querySelector('.gp-unlock-ok').focus());
        let closed = false;
        const close = () => {
            if (closed) return; closed = true;
            T.forEach(clearTimeout);
            ov.remove();
            // 關閉後上方「我的存錢寵物」切到剛解鎖的這隻（pets[0]＝存錢豬，其後依序為已解鎖寵物；同圖鑑卡片的點法）
            const stu = _gpStudent;
            if (!stu) return;
            const unlocked = G.CREATURES.filter(cc => G.creatureState(_gpRecords, stu.id, cc.key).stage >= 0);
            const idx = unlocked.findIndex(cc => cc.key === key);
            if (idx < 0) return;
            _previewKey = null; _savePetIdx = idx + 1; _savePetStage = null;
            renderGrowthPage(); scrollPetIntoView(); speakPetDesc(true);
        };
        ov.querySelector('.gp-unlock-ok').addEventListener('click', close);
        ov.addEventListener('click', e => { if (e.target === ov) close(); });
        ov.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }

    // 經典剪影進化（不刺眼發光）：舊姿→柔和金色剪影(縮放旋轉)→換新階段圖→淡入全彩＋柔和光環。約 2.4 秒。
    function playEvolveEffect(cb) {
        const im = document.getElementById('gp-pet-img');
        try { const a = new Audio('../audio/reward/pet_evolve.mp3'); a.volume = 0.9; a.play().catch(() => {}); } catch (e) {}   // 進化變聲音效
        if (!im) { setTimeout(cb, 100); return; }
        const main = im.closest('.gp-pet-main') || im.parentElement;
        const fx = [];
        // 用 CSS/DOM 粒子（本質透明、跨瀏覽器；透明 WebM 在此環境無法保留 alpha 故不採用）
        if (main) {
            const mk = (cls) => { const el = document.createElement('div'); el.className = cls; main.appendChild(el); void el.offsetWidth; el.classList.add('go'); fx.push(el); return el; };
            mk('gp-evo-glow');    // 柔和放射光
            mk('gp-evo-ring');    // 柔和光環
            mk('gp-evo-smoke');   // 柔和煙霧
            const glyphs = ['✨', '⭐', '🌟', '✨', '💫'];   // 星塵（14 顆隨機方向散開）
            const N = 14;
            for (let i = 0; i < N; i++) {
                const s = document.createElement('div'); s.className = 'gp-evo-star'; s.textContent = glyphs[i % glyphs.length];
                const ang = (Math.PI * 2 * i) / N + Math.random() * 0.5, dist = 72 + Math.random() * 58;
                s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(0) + 'px');
                s.style.setProperty('--dy', (Math.sin(ang) * dist - 10).toFixed(0) + 'px');
                s.style.animationDelay = (Math.random() * 0.4).toFixed(2) + 's';
                main.appendChild(s); void s.offsetWidth; s.classList.add('go'); fx.push(s);
            }
        }
        im.classList.remove('gp-evo-in', 'gp-evo-out'); void im.offsetWidth; im.classList.add('gp-evo-out');
        setTimeout(function () {
            cb();   // 換成新階段圖（同一個 img 元素）
            const im2 = document.getElementById('gp-pet-img');
            if (im2) { im2.classList.remove('gp-evo-out'); void im2.offsetWidth; im2.classList.add('gp-evo-in'); }
            setTimeout(function () {
                if (im2) im2.classList.remove('gp-evo-in'); fx.forEach(el => el.remove());
                speakPetDesc(true);   // 變身完＋音效播完 → 唸新階段的介紹（朗讀文字已含名稱）
            }, 1400);
        }, 1100);
    }

    // 寵物互動特效：點擊彈跳＋特效＋音效、偶爾開心小動作、傾斜跟隨滑鼠/觸控（皆柔和）
    // 特效依種類（寵物＝愛心、寶物＝光澤閃爍、徽章＝光環），唯一定義在 js/showcase.js 的 MTShowcase.fx
    let _petFxBound = false;
    function petReact(withSound, im) {
        im = im || document.getElementById('gp-pet-img');
        if (!im) return;
        // 還沒兌換的寵物／徽章／寶物（灰階預覽 gp-pet-preview）：可以點、可以看、可以朗讀，但沒有互動效果
        // （彈跳、特效、點擊音效、偶爾的小動作；2026-10-09 使用者定）
        if (im.classList.contains('gp-pet-preview')) return;
        im.classList.remove('gp-pet-react'); void im.offsetWidth; im.classList.add('gp-pet-react');
        setTimeout(() => im.classList.remove('gp-pet-react'), 640);
        const main = im.closest('.gp-pet-main, .gp-zoom-stage');
        if (main && window.MTShowcase) MTShowcase.fx(main, im, im.dataset.type || 'pet', { lite: !withSound });
        if (withSound) { try { const a = new Audio(im.dataset.sound || '../audio/reward/pet_click.mp3'); a.volume = 0.9; a.play().catch(() => {}); } catch (e) {} }
    }
    function setupPetFx() {
        if (_petFxBound) return; _petFxBound = true;
        const box = document.querySelector('.gp-pet');
        const im = document.getElementById('gp-pet-img');
        // 點寵物大圖：互動特效＋朗讀目前顯示階段的介紹（要唸就不播點擊音效，免得疊在語音上）
        if (im) im.addEventListener('click', () => {
            if (petSpeechNow()) { petReact(false); speakPetDesc(true); } else petReact(true);
        });
        const zi = document.getElementById('gp-zoom-img');
        if (zi) zi.addEventListener('click', () => petReact(true, zi));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.getElementById('gp-zoom')?.hidden) closePetZoom(); });
        if (box) {
            const tilt = (cx, cy) => {
                const f = document.querySelector('.gp-pet-frame'); if (!f) return;
                if (document.getElementById('gp-pet-img')?.classList.contains('gp-pet-preview')) { f.style.transform = ''; return; }   // 未兌換：不跟著傾斜
                const r = f.getBoundingClientRect();
                const px = (cx - r.left) / r.width - 0.5, py = (cy - r.top) / r.height - 0.5;
                f.style.transform = `perspective(520px) rotateY(${(px * 14).toFixed(1)}deg) rotateX(${(-py * 14).toFixed(1)}deg)`;
            };
            const reset = () => { const f = document.querySelector('.gp-pet-frame'); if (f) f.style.transform = ''; };
            box.addEventListener('mousemove', e => tilt(e.clientX, e.clientY));
            box.addEventListener('mouseleave', reset);
            box.addEventListener('touchmove', e => { if (e.touches[0]) tilt(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
            box.addEventListener('touchend', reset);
        }
        setInterval(() => {
            const ov = document.getElementById('growth-overlay');
            if (ov && ov.classList.contains('open') && Math.random() < 0.7) petReact(false);
        }, 6000);
    }

    // 寵物進度條（2026-10-07 使用者定）：數字與進度條都只算「這一階段」——進化後從 0 開始；
    // 餵到門檻那一下先顯示「N / N」＋進度條到底，停一下才播進化動畫（否則一跨門檻就換成下一階段的 0，滿格永遠看不到）
    function setPetBar(cur, span, tail) {
        const bar = document.getElementById('gp-bar'), label = document.getElementById('gp-bar-label');
        cur = Math.max(0, Math.min(cur, span));
        if (bar) bar.style.width = (span > 0 ? Math.round(cur / span * 100) : 100) + '%';
        if (label) label.textContent = `成長 ${cur} / ${span}` + (tail || '');
    }
    function fullBarThenEvolve(span, done) {
        const fb = document.getElementById('gp-feed-btn'); if (fb) fb.disabled = true;
        setPetBar(span, span);
        try { playSound('bonus'); } catch (e) {}
        setTimeout(() => playEvolveEffect(() => {
            // 歸零那一下不要倒著動畫回去，直接從 0 開始
            const bar = document.getElementById('gp-bar');
            if (bar) { bar.style.transition = 'none'; }
            done();
            if (bar) { void bar.offsetWidth; bar.style.transition = ''; }
        }), 750);
    }

    // ⭐ 展示品（2026-10-07）：ref＝{ type, key } → 目前的快照（名稱／圖）；不再擁有就回 null
    // 寵物會進化，所以每次畫成就與寵物頁都重算一次存著的快照（單元頁與獎勵板只讀快照，見 js/showcase.js）
    function showcaseSnap(stuId, ref) {
        const G = GrowthSystem;
        if (!ref) return null;
        if (ref.type === 'pig') {
            const st = G.PET_STAGES[G.petStage(G.petData(stuId))];
            return { type: 'pig', key: 'pig', name: st.name, img: st.img };
        }
        if (ref.type === 'creature') {
            const c = G.CREATURES.find(x => x.key === ref.key);
            const st = c && G.creatureState(_gpRecords, stuId, c.key);
            if (!st || st.stage < 0) return null;
            return { type: 'creature', key: c.key, name: (c.stageNames && c.stageNames[st.stage]) || c.name,
                     icon: c.stages[st.stage], img: `images/pets/pet_${c.key}_s${st.stage}.png` };
        }
        if (ref.type === 'badge') {
            const b = G.BADGES.find(x => x.id === ref.key);
            return b && G.badgeStore(stuId)[b.id] ? { type: 'badge', key: b.id, name: b.name, icon: b.icon, img: b.img } : null;
        }
        if (ref.type === 'treasure') {
            const t = G.TREASURES.find(x => x.id === ref.key);
            return t && G.treasures(stuId).includes(t.id) ? { type: 'treasure', key: t.id, name: t.name, icon: t.icon, img: t.img } : null;
        }
        return null;
    }
    function refreshShowcase(stuId) {
        if (!window.MTShowcase) return;
        const cur = MTShowcase.get(stuId);
        if (!cur) return;
        const now = showcaseSnap(stuId, cur);
        if (JSON.stringify(now) !== JSON.stringify(cur)) MTShowcase.set(stuId, now);
    }
    // 點一下＝設為展示；已經是展示中再點＝取消
    // 展示的訊息寫在被點的那一區：寵物＝寵物區下方、徽章＝徽章牆下方、寶物＝寶物櫃下方（2026-10-07 使用者定）
    let _scMsgTimer = null;
    function scMsg(type, text) {
        ['gp-badges-msg', 'gp-treasures-msg'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = ''; });
        clearTimeout(_scMsgTimer);
        if (type === 'badge' || type === 'treasure') {
            const el = document.getElementById(type === 'badge' ? 'gp-badges-msg' : 'gp-treasures-msg');
            if (el) { el.textContent = text; _scMsgTimer = setTimeout(() => { if (el.textContent === text) el.textContent = ''; }, 5000); }
        } else {
            gpMsg(text);
        }
    }
    function toggleShowcase(stuId, ref) {
        if (!window.MTShowcase) return;
        const cur = MTShowcase.get(stuId);
        if (MTShowcase.same(cur, ref)) { MTShowcase.set(stuId, null); scMsg(ref.type, '已取消展示'); }
        else {
            const snap = showcaseSnap(stuId, ref);
            if (!snap) return;
            MTShowcase.set(stuId, snap);
            try { playSound('bonus'); } catch (e) {}
            scMsg(ref.type, `⭐ 「${snap.name}」已設為展示！測驗頁和獎勵板的頭像旁都看得到`);
            renderGrowthPage();
            // 剛設為展示的那一項放一次特效（畫面重畫後才找得到新的元素）
            const chip = ref.type === 'badge' || ref.type === 'treasure'
                ? document.querySelector(`#gp-${ref.type === 'badge' ? 'badges' : 'treasures'} .gp-chip.gp-showcased`) : null;
            const pic = chip ? (chip.querySelector('.gp-ic-img') || chip.querySelector('.ic')) : document.getElementById('gp-pet-img');
            const stage = chip || document.querySelector('.gp-pet-main');
            if (pic && stage) MTShowcase.fx(stage, pic, ref.type === 'creature' ? 'pet' : ref.type);
            return;
        }
        renderGrowthPage();
    }
    function renderShowcaseLine(stuId) {
        const line = document.getElementById('gp-sc-line');
        if (!line || !window.MTShowcase) return;
        line.innerHTML = '';
        const sc = MTShowcase.get(stuId);
        if (!sc) { line.textContent = '⭐ 還沒有展示品——在下面挑一隻寵物、一個徽章或寶物吧！'; return; }
        line.append('⭐ 我的展示：', MTShowcase.el(stuId, ''), sc.name);
        const x = document.createElement('button');
        x.type = 'button'; x.textContent = '取消展示';
        x.onclick = () => { MTShowcase.set(stuId, null); scMsg(sc.type, '已取消展示'); renderGrowthPage(); };
        line.appendChild(x);
    }

    // 寶物／徽章的圖示：圖片（GrowthSystem 定的 img），載不到才退回 emoji；右上角 🔍 放大（2026-10-07）
    function chipIcon(item) {
        const safe = String(item.icon || '').replace(/'/g, '');
        return item.img
            ? `<div class="ic"><img class="gp-ic-img" src="../${item.img}" alt="" onerror="this.replaceWith(document.createTextNode('${safe}'))"></div>`
            : `<div class="ic">${item.icon}</div>`;
    }
    function addChipZoom(chip, item, type, owned) {
        const z = document.createElement('button');
        z.type = 'button'; z.className = 'gp-chip-zoom'; z.textContent = '🔍';
        z.title = '放大看'; z.setAttribute('aria-label', '放大看' + item.name);
        z.addEventListener('click', (e) => {
            e.stopPropagation();   // 不要同時觸發「設為展示」
            window.openItemZoom(item.img ? '../' + item.img : '', item.name + (owned ? '' : '（尚未取得）'),
                { gray: !owned, icon: item.icon, type, sound: window.MTShowcase ? MTShowcase.url(MTShowcase.SOUNDS[type]) : '' });
        });
        chip.appendChild(z);
    }

    function renderGrowthPage() {
        const stu = _gpStudent;
        const G   = GrowthSystem;

        document.getElementById('gp-photo').src = stu.photo || DEFAULT_AVATAR;
        document.getElementById('gp-name').textContent = stu.name || '學生';
        // 學生切換下拉（可切換不同學生的成就與寵物頁）
        const sw = document.getElementById('gp-student-switch');
        if (sw) {
            const roster = JSON.parse(localStorage.getItem('rewardSystemStudents') || '[]');
            sw.innerHTML = '';
            roster.forEach(s => {
                const o = document.createElement('option');
                o.value = String(s.id); o.textContent = s.name || '未命名';
                if (String(s.id) === String(stu.id)) o.selected = true;
                sw.appendChild(o);
            });
            sw.onchange = () => { const s = roster.find(x => String(x.id) === sw.value); if (s) openGrowthPage(s); };
        }
        document.getElementById('gp-coins').textContent = getCoins(stu.id);
        const gems = G.gemsAvailable(_gpRecords, stu.id);
        document.getElementById('gp-gems').textContent = gems;
        document.getElementById('gp-practices').textContent = G.myRecords(_gpRecords, stu.id).length;
        const buyGemBtn = document.getElementById('gp-buy-gem');
        if (buyGemBtn) {
            buyGemBtn.disabled = getCoins(stu.id) < G.GEM_COIN_COST;
            const bgt = document.getElementById('gp-buy-gem-text');
            if (bgt) bgt.textContent = `🪙 ${G.GEM_COIN_COST} 金幣 → 💎 1 寶石`;
        }
        // 單元獎勵領金幣（每完成一次單元練習可領的金幣數由老師在 teacher.html「🎁 單元獎勵設定」設定，
        // 預設每個單元 5 金幣；計算在 js/growth-system.js 的 unclaimedCoins；領取制、不重複）
        const claimBtn = document.getElementById('gp-claim-practice');
        if (claimBtn) {
            const un = G.unclaimedPractices(_gpRecords, stu.id);
            const coinsReady = G.unclaimedCoins(_gpRecords, stu.id);
            const totalPractices = G.myRecords(_gpRecords, stu.id).length;
            claimBtn.disabled = un <= 0 || coinsReady <= 0;
            // ⚠️ 這顆按鈕只代表「單元獎勵」這個管道，跟優良表現獎勵板的分數是否已轉換成金幣
            // 完全無關（那是另一條路徑，見上方 getCoins 註解）。幾種文字分開講，避免「從沒
            // 練習過」跟「練習過、但金幣已經領完」被同一句話混在一起：
            let claimText;
            if (un > 0 && coinsReady > 0) {
                claimText = `已練習完 ${un} 個單元 → 可領 ${coinsReady} 🪙`;
            } else if (un > 0) {
                claimText = `已練習完 ${un} 個單元（老師目前沒有設定單元獎勵）`;
            } else if (totalPractices === 0) {
                claimText = '目前沒有練習任何單元，沒有金幣可領取';
            } else {
                claimText = '再去完成單元練習就可以領取金幣';   // 2026-10-07 使用者定：改成鼓勵下一步（原「✓ 已練習過的單元都領過金幣了」）
            }
            const ct = document.getElementById('gp-claim-text');
            if (ct) ct.textContent = claimText;
            claimBtn.onclick = () => {
                const coins = G.claimPracticeCoins(_gpRecords, stu.id);
                if (coins > 0) {
                    setCoins(stu.id, getCoins(stu.id) + coins);
                    try { playSound('bonus'); } catch (e) {}
                    gpMsg(`🪙 領取了 ${coins} 金幣！可以拿去餵寵物或換寶石囉！`);
                    renderGrowthPage();
                }
            };
        }

        // ── 我的存錢寵物：◀▶ 切換（存錢豬 + 已解鎖收集寵物）；下方切換「已達階段」──
        // 未解鎖的寵物也能從下方圖鑑點進來「預覽」（_previewKey，方便老師介紹「還可以換到什麼」）；
        // 預覽不是清單裡的一格，離開預覽用 ◀▶ 或改點別張卡片，不會動到真正的解鎖狀態
        const unlockedPets = (G.CREATURES || []).filter(cc => G.creatureState(_gpRecords, stu.id, cc.key).stage >= 0);
        const pets = [{ type: 'pig' }].concat(unlockedPets.map(cc => ({ type: 'creature', c: cc })));
        if (_savePetIdx == null || _savePetIdx < 0 || _savePetIdx >= pets.length) _savePetIdx = 0;
        const previewCreature = _previewKey ? G.CREATURES.find(cc => cc.key === _previewKey) : null;
        if (_previewKey && !previewCreature) _previewKey = null;   // 資料異常保底（key 對不到任何寵物）
        const curPet = previewCreature ? { type: 'preview', c: previewCreature } : pets[_savePetIdx];
        const petKey = curPet.type === 'pig' ? 'pig' : curPet.c.key + (curPet.type === 'preview' ? ':preview' : '');
        refreshShowcase(stu.id);
        renderShowcaseLine(stu.id);
        const scBtn = document.getElementById('gp-sc-pet');
        if (scBtn) {
            const ref = curPet.type === 'pig' ? { type: 'pig', key: 'pig' } : curPet.type === 'creature' ? { type: 'creature', key: curPet.c.key } : null;
            scBtn.hidden = !ref || !window.MTShowcase;
            if (ref && window.MTShowcase) {
                const on = MTShowcase.same(MTShowcase.get(stu.id), ref);
                scBtn.classList.toggle('on', on);
                scBtn.textContent = on ? '⭐ 展示中（點一下取消）' : '⭐ 設為展示';
                scBtn.onclick = () => toggleShowcase(stu.id, ref);
            }
        }
        if (_msgPending) { _msgPet = petKey; _msgPending = false; }
        else if (_msgPet !== petKey) { document.getElementById('gp-msg').textContent = ''; _msgPet = petKey; }

        const imgEl     = document.getElementById('gp-pet-img');
        imgEl.classList.toggle('gp-pet-preview', curPet.type === 'preview');
        const nameEl    = document.getElementById('gp-pet-name');
        const bar       = document.getElementById('gp-bar');
        const label     = document.getElementById('gp-bar-label');
        const feedBtn   = document.getElementById('gp-feed-btn');
        const evolveBtn = document.getElementById('gp-evolve-btn');
        const stageEl   = document.getElementById('gp-pet-stage');
        const petPrev   = document.getElementById('gp-pet-prev');
        const petNext   = document.getElementById('gp-pet-next');
        petPrev.disabled = petNext.disabled = pets.length <= 1;
        petPrev.onclick = () => { _previewKey = null; _savePetIdx = (_savePetIdx - 1 + pets.length) % pets.length; _savePetStage = null; renderGrowthPage(); };
        petNext.onclick = () => { _previewKey = null; _savePetIdx = (_savePetIdx + 1) % pets.length; _savePetStage = null; renderGrowthPage(); };

        // 階段切換列（只到已達階段；imgFor(vs) 回傳該階段圖片路徑）
        const descEl = document.getElementById('gp-pet-desc');
        // 換了顯示的介紹（換寵物／階段）就停掉還在唸的上一段；朗讀文字存在 data-speech
        const setPetDesc = (desc, speech) => {
            if (!descEl) return;
            if ((descEl.dataset.speech || '') !== (speech || '')) stopPetSpeech();
            descEl.textContent = desc || '';
            descEl.dataset.speech = speech || '';
        };
        const renderStageSwitch = (maxStage, imgFor, nameFor, descFor, speechFor) => {
            if (_savePetStage == null || _savePetStage > maxStage || _savePetStage < 0) _savePetStage = maxStage;
            const vs = _savePetStage;
            imgEl.src = imgFor(vs);
            if (nameFor) nameEl.textContent = nameFor(vs);   // 名字跟著檢視的階段變（各階段不同名）
            setPetDesc(descFor && descFor(vs), speechFor && speechFor(vs));   // 該階段介紹詞（外觀/個性/能力）
            stageEl.innerHTML =
                `<button class="gp-page-btn gp-sm" id="gp-ps-prev" ${vs <= 0 ? 'disabled' : ''}>◀</button>` +
                `<span class="gp-pet-stage-label">切換進化階段（階段 ${vs + 1}）</span>` +
                `<button class="gp-page-btn gp-sm" id="gp-ps-next" ${vs >= maxStage ? 'disabled' : ''}>▶</button>`;
            const sp = stageEl.querySelector('#gp-ps-prev'), sn = stageEl.querySelector('#gp-ps-next');
            if (sp) sp.onclick = () => { if (vs > 0) { _savePetStage = vs - 1; renderGrowthPage(); } };
            if (sn) sn.onclick = () => { if (vs < maxStage) { _savePetStage = vs + 1; renderGrowthPage(); } };
        };

        if (curPet.type === 'pig') {
            const pet      = G.petData(stu.id);
            const stageIdx = G.petStage(pet);
            const stage    = G.PET_STAGES[stageIdx];
            const next     = G.PET_STAGES[stageIdx + 1];
            renderStageSwitch(stageIdx, (vs) => '../' + G.PET_STAGES[vs].img, (vs) => G.PET_STAGES[vs].name, (vs) => G.PET_STAGES[vs].desc, (vs) => G.PET_STAGES[vs].speech);
            if (!next) {
                feedBtn.hidden = true; evolveBtn.hidden = true;
                bar.style.width = '100%';
                label.textContent = '🎉 已是最終型態，繼續保持好表現！';
            } else if (next.gems && pet.growth >= next.need) {
                // 成長已滿、需寶石進化 → 隱藏餵食鈕，只留「✨寶石進化」鈕
                feedBtn.hidden = true;
                evolveBtn.hidden = false; evolveBtn.disabled = gems < next.gems;
                evolveBtn.textContent = `✨ 寶石進化（花 ${next.gems} 💎）`;
                bar.style.width = '100%';
                const span = next.need - stage.need;
                setPetBar(span, span, `（用 ${next.gems} 顆 💎 進化成「${next.name}」）`);
            } else {
                feedBtn.hidden = false; evolveBtn.hidden = true;
                const base = stage.need, target = next.need;
                const coinsNeed = Math.max(0, Math.ceil((target - pet.growth) / G.FEED_GAIN) * G.FEED_COST);
                setPetBar(pet.growth - base, target - base, `（再 ${coinsNeed} 金幣進化）`);
                feedBtn.disabled = getCoins(stu.id) < G.FEED_COST;
            }
            feedBtn.onclick = () => {
                if (getCoins(stu.id) < G.FEED_COST) { gpMsg('金幣不夠——請到「優良表現獎勵板」把分數「🔄 轉換成金幣」！'); return; }
                const before = G.petStage(G.petData(stu.id));
                setCoins(stu.id, getCoins(stu.id) - G.FEED_COST);
                const p = G.petData(stu.id); p.growth += G.FEED_GAIN; G.savePet(stu.id, p);
                const after = G.petStage(p);
                if (after > before) {   // 餵食後跨到下一階段 → 進度條先補滿，再進化動畫＋音效
                    fullBarThenEvolve(G.PET_STAGES[before + 1].need - G.PET_STAGES[before].need,
                        () => { _savePetStage = null; gpMsg('🎉 進化了！長大到「' + G.PET_STAGES[after].name + '」！'); renderGrowthPage(); });
                } else {
                    try { playSound('bonus'); } catch (e) {}
                    gpMsg('🍎 好好吃！成長值 +' + G.FEED_GAIN);
                    renderGrowthPage();
                }
            };
            evolveBtn.onclick = () => {
                const p = G.petData(stu.id);
                const nxt = G.PET_STAGES[G.petStage(p) + 1];
                if (!nxt?.gems) return;
                if (!G.spendGems(_gpRecords, stu.id, nxt.gems)) { gpMsg('寶石不夠——在單元拿到 🌟 無錯通過就能獲得寶石！'); return; }
                p.evolved = true; G.savePet(stu.id, p);
                playEvolveEffect(() => { _savePetStage = null; gpMsg(`✨ 進化成功！「${nxt.name}」誕生！`); renderGrowthPage(); });
            };
        } else if (curPet.type === 'creature') {
            const c  = curPet.c;
            const st = G.creatureState(_gpRecords, stu.id, c.key);
            const cd = G.petsData(stu.id)[c.key] || {};
            const finalNeed = G.PET_STAGES[3].need, finalGems = G.PET_STAGES[3].gems;
            renderStageSwitch(st.stage, (vs) => `../images/pets/pet_${c.key}_s${vs}.png`, (vs) => c.stageNames[vs], (vs) => c.stageDesc[vs], (vs) => c.stageSpeech[vs]);
            if (st.stage >= 3) {
                feedBtn.hidden = true; evolveBtn.hidden = true;
                bar.style.width = '100%';
                label.textContent = '🎉 已完全進化！';
            } else if ((cd.fed || 0) >= finalNeed && !cd.evolved) {
                // 成長已滿、需寶石進化 → 隱藏餵食鈕，只留「✨寶石進化」鈕
                feedBtn.hidden = true;
                evolveBtn.hidden = false; evolveBtn.disabled = gems < finalGems;
                evolveBtn.textContent = `✨ 寶石進化（花 ${finalGems} 💎）`;
                bar.style.width = '100%';
                const span = finalNeed - G.PET_STAGES[2].need;
                setPetBar(span, span, `（用 ${finalGems} 顆 💎 進化）`);
            } else {
                feedBtn.hidden = false; evolveBtn.hidden = true;
                const base = G.PET_STAGES[st.stage].need;
                const coinsNeed = Math.max(0, Math.ceil((st.next - st.grown) / G.FEED_GAIN) * G.FEED_COST);
                setPetBar(st.grown - base, st.next - base, `（再 ${coinsNeed} 金幣進化）`);
                feedBtn.disabled = getCoins(stu.id) < G.FEED_COST;
            }
            feedBtn.onclick = () => {
                if (getCoins(stu.id) < G.FEED_COST) { gpMsg('金幣不夠——把單元獎勵領成金幣、或到獎勵板把分數轉金幣！'); return; }
                const before = G.creatureState(_gpRecords, stu.id, c.key).stage;
                setCoins(stu.id, getCoins(stu.id) - G.FEED_COST);
                G.feedCreature(stu.id, c.key);
                const after = G.creatureState(_gpRecords, stu.id, c.key).stage;
                if (after > before) {   // 餵食後跨階 → 進度條先補滿，再進化動畫＋音效
                    fullBarThenEvolve(G.PET_STAGES[before + 1].need - G.PET_STAGES[before].need,
                        () => { _savePetStage = null; gpMsg('🎉 進化了！長大到「' + ((c.stageNames && c.stageNames[after]) || c.name) + '」！'); renderGrowthPage(); });
                } else {
                    try { playSound('bonus'); } catch (e) {}
                    gpMsg('🍎 好好吃！成長 +' + G.FEED_GAIN);
                    renderGrowthPage();
                }
            };
            evolveBtn.onclick = () => {
                if (!G.evolveCreature(_gpRecords, stu.id, c.key)) { gpMsg('寶石不夠——在單元拿到 🌟 無錯通過就能獲得寶石！'); return; }
                playEvolveEffect(() => { _savePetStage = null; gpMsg('✨ 進化成功！'); renderGrowthPage(); });
            };
        } else {
            // 預覽尚未解鎖的寵物（curPet.type === 'preview'）：只看得到第 0 階段(蛋)，
            // 沒有成長資料可顯示；把「餵食」鈕隱藏、借用「進化」鈕位置放「解鎖」，
            // 方便老師直接在這裡跟學生介紹並當場解鎖，不用切回下方圖鑑找小按鈕
            const c  = curPet.c;
            const uc = G.cfg().unlockCoins;
            _savePetStage = 0;
            imgEl.src = `../images/pets/pet_${c.key}_s0.png`;
            nameEl.textContent = (c.stageNames && c.stageNames[0]) || c.name;
            setPetDesc(c.stageDesc[0], c.stageSpeech[0]);
            stageEl.innerHTML = '<span class="gp-pet-stage-label">🔒 尚未解鎖・預覽中</span>';
            bar.style.width = '0%';
            label.textContent = `解鎖需要 ${uc} 金幣（解鎖後就能餵金幣讓牠長大）`;
            feedBtn.hidden = true;
            evolveBtn.hidden = false;
            evolveBtn.textContent = `🔒 花 ${uc} 金幣解鎖`;
            evolveBtn.disabled = getCoins(stu.id) < uc;
            evolveBtn.onclick = () => {
                if (getCoins(stu.id) < uc) { gpMsg('金幣不夠——把單元獎勵領成金幣、或到「優良表現獎勵板」把分數轉金幣！'); return; }
                if (!G.unlockCreature(stu.id, c.key)) return;
                setCoins(stu.id, getCoins(stu.id) - uc);
                const unlockedNow = G.CREATURES.filter(cc => G.creatureState(_gpRecords, stu.id, cc.key).stage >= 0);
                const idx = unlockedNow.findIndex(cc => cc.key === c.key);
                _previewKey = null;
                _savePetIdx = idx >= 0 ? idx + 1 : 0;
                _savePetStage = null;
                gpMsg('🎉 解鎖成功！餵金幣牠就會長大進化！');
                renderGrowthPage();
                playUnlockEffect(c.key);   // 🔓 解鎖動畫（與圖鑑卡片的「解鎖」鈕同一套；音效在動畫裡播）
            };
        }

        // ── 收集寵物圖鑑（分頁）──
        renderCreatures();

        // ── 徽章牆 ──
        const { fresh } = G.computeBadges(stu.id, _gpRecords, G.questMeta(stu.id), stu);
        const earned = G.badgeStore(stu.id);
        const bHost = document.getElementById('gp-badges');
        bHost.innerHTML = '';
        G.BADGES.forEach(b => {
            const chip = document.createElement('div');
            chip.className = 'gp-chip' + (earned[b.id] ? '' : ' locked');
            chip.title = earned[b.id] ? `獲得於 ${new Date(earned[b.id]).toLocaleDateString('zh-TW')}` : '尚未解鎖';
            chip.innerHTML = `${chipIcon(b)}<div class="nm">${b.name}</div>`;
            addChipZoom(chip, b, 'badge', !!earned[b.id]);
            if (earned[b.id] && window.MTShowcase) {
                const ref = { type: 'badge', key: b.id };
                chip.classList.add('gp-pick');
                chip.classList.toggle('gp-showcased', MTShowcase.same(MTShowcase.get(stu.id), ref));
                chip.title += '・點一下設為展示';
                chip.addEventListener('click', () => toggleShowcase(stu.id, ref));
            }
            bHost.appendChild(chip);
        });
        if (fresh.length) gpMsg(`🏅 解鎖新徽章「${fresh[0].icon} ${fresh[0].name}」！`);

        // ── 寶物櫃 ──
        const owned = G.treasures(stu.id);
        const tHost = document.getElementById('gp-treasures');
        tHost.innerHTML = '';
        G.TREASURES.forEach(t => {
            const has = owned.includes(t.id);
            const chip = document.createElement('div');
            chip.className = 'gp-chip' + (has ? '' : ' locked');
            chip.title = t.desc || '';
            chip.innerHTML = `${chipIcon(t)}<div class="nm">${t.name}</div>` +
                (has ? `<div class="nm gp-owned">已擁有</div>`
                     : `<button class="buy" ${gems < t.gems ? 'disabled' : ''}>💎×${t.gems} 兌換</button>`);
            addChipZoom(chip, t, 'treasure', has);
            if (has && window.MTShowcase) {
                const ref = { type: 'treasure', key: t.id };
                chip.classList.add('gp-pick');
                chip.classList.toggle('gp-showcased', MTShowcase.same(MTShowcase.get(stu.id), ref));
                chip.title = (t.desc ? t.desc + '\n' : '') + '點一下設為展示';
                chip.addEventListener('click', () => toggleShowcase(stu.id, ref));
            }
            if (!has) {
                chip.querySelector('.buy')?.addEventListener('click', () => {
                    if (G.buyTreasure(_gpRecords, stu.id, t.id)) {
                        try { playSound('bonus'); } catch (e) {}
                        scMsg('treasure', `🎁 兌換成功！獲得「${t.icon} ${t.name}」` + (t.desc ? `——${t.desc}` : ''));
                        renderGrowthPage();
                    } else {
                        scMsg('treasure', '寶石不夠——拿到 🌟 無錯通過就能獲得寶石！');
                    }
                });
            }
            tHost.appendChild(chip);
        });

        // ── 今日任務（唯讀） ──
        const qHost = document.getElementById('gp-quests');
        const qm = G.questMeta(stu.id);
        const tk = (d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)(new Date());
        const qTitle = document.getElementById('gp-quests-title');
        if (qm && qm.date === tk && Array.isArray(qm.quests)) {
            if (qTitle) qTitle.textContent = '🚀 今日任務';
            qHost.innerHTML = '';
            qm.quests.forEach(q => {
                const line = document.createElement('div');
                line.className = 'gp-quest-line';
                const st = q.claimed ? '✅ 已領獎' : q.done ? '🪙 可領獎' : '⬜ 未完成';
                const qc = G.questCoins ? G.questCoins() : 0;   // 每個任務的獎勵＝老師設定（同主頁金隊長）
                line.innerHTML = `<span>${q.icon}</span><span style="flex:1">${q.desc}</span>${qc > 0 ? `<span class="gp-quest-coin">${qc}🪙</span>` : ''}<b>${st}</b>`;
                qHost.appendChild(line);
            });
        } else {
            // 還沒領任務：只留一行標題（2026-10-10 使用者定）
            qHost.innerHTML = '';
            if (qTitle) qTitle.textContent = '🚀 今天還沒完成「金隊長」任務！';
        }
    }

}); // End of DOMContentLoaded