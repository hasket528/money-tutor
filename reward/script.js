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

                    // 呼叫壓縮函式 (寬度 300px, 品質 0.7)
                    selectedPhotoDataUrl = await compressImage(file, 300, 0.7);

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

    function applyZoom() {
        document.body.style.transform = `scale(${currentZoom / 100})`;
        document.body.style.transformOrigin = 'top center';
        // 調整 body 高度以適應縮放後的內容
        document.body.style.height = `${100 / (currentZoom / 100)}%`;
        // 儲存縮放比例到 localStorage
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
                <img src="${student.photo || DEFAULT_AVATAR}" alt="${student.name || '學生照片'}" class="student-photo" style="cursor: pointer;" title="點擊放大">
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
        studentPhoto.addEventListener('click', () => showPhotoZoom(student));

        studentsContainer.appendChild(studentRow);
    }

    // --- 照片放大顯示 ---
    function showPhotoZoom(student) {
        const overlay = document.createElement('div');
        overlay.className = 'photo-zoom-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;

        const nameLabel = student.name ? `<div style="color: white; font-size: 24px; margin-bottom: 15px; font-weight: bold;">${student.name}</div>` : '';

        overlay.innerHTML = `
            ${nameLabel}
            <img src="${student.photo || DEFAULT_AVATAR}" alt="${student.name || '學生照片'}" style="
                max-width: 90%;
                max-height: 80%;
                border-radius: 10px;
                box-shadow: 0 0 30px rgba(255,255,255,0.3);
            ">
            <div style="color: white; font-size: 14px; margin-top: 15px;">點擊任意處關閉</div>
        `;

        overlay.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        document.body.appendChild(overlay);
    }

     // Handle Change Photo Input（使用壓縮）
     async function handleChangePhoto(e, student) {
         const file = e.target.files[0];
         if (file && file.type.startsWith('image/')) {
             try {
                 // 呼叫壓縮函式
                 const compressedPhoto = await compressImage(file, 300, 0.7);

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
    const CREATURE_PAGE_SIZE = 8;                // 圖鑑每頁隻數

    async function openGrowthPage(student) {
        if (typeof GrowthSystem === 'undefined') { alert('成長系統載入失敗，請重新整理頁面'); return; }
        _gpStudent = student;
        _gpRecords = await GrowthSystem.readAllRecords();
        renderGrowthPage();
        document.getElementById('growth-overlay').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    window.closeGrowthPage = function () {
        document.getElementById('growth-overlay').classList.remove('open');
        document.body.style.overflow = '';
        refreshDisplay(!!document.querySelector('.rank-number'));   // 金幣可能已變動
    };

    function gpMsg(t) { document.getElementById('gp-msg').textContent = t || ''; }

    // 收集寵物圖鑑：5 隻原創生物，用寶石解鎖，解鎖後隨主課程練習成長進化
    function renderCreatures() {
        const G = GrowthSystem, stu = _gpStudent;
        const host = document.getElementById('gp-creatures');
        const nav  = document.getElementById('gp-creatures-nav');
        if (!host || !G.CREATURES) return;
        const gems = G.gemsAvailable(_gpRecords, stu.id);
        const all  = G.CREATURES;
        const pageSize = window.matchMedia('(min-width: 768px)').matches ? 10 : 6;  // 桌面端 10、窄螢幕 6（依版面調整）
        const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
        if (_creaturePage >= totalPages) _creaturePage = totalPages - 1;
        if (_creaturePage < 0) _creaturePage = 0;
        const start = _creaturePage * pageSize;
        const pageItems = all.slice(start, start + pageSize);
        host.innerHTML = '';
        pageItems.forEach(c => {
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
                sub = c.gems > 0 ? `🔒 ${c.gems} 💎 解鎖` : '🔒 免費解鎖';
                const can = c.gems === 0 || gems >= c.gems;
                btn = `<button class="gp-crt-btn" data-key="${c.key}" ${can ? '' : 'disabled'}>解鎖</button>`;
            } else if (st.next != null) {
                sub = `再練 ${Math.max(0, st.next - st.grown)} 次進化`;
            } else {
                sub = '🎉 已完全進化';
            }
            el.innerHTML = `${visual}
                <div class="gp-crt-name">${c.name}</div>
                <div class="gp-crt-sub">${sub}</div>${btn}`;
            host.appendChild(el);
        });
        host.querySelectorAll('.gp-crt-btn').forEach(b => {
            b.addEventListener('click', () => {
                const ok = G.unlockCreature(_gpRecords, stu.id, b.dataset.key);
                const msg = document.getElementById('gp-creatures-msg');
                if (ok) {
                    try { playSound('bonus'); } catch (e) {}
                    if (msg) msg.textContent = '🎉 解鎖成功！繼續練習牠就會長大進化！';
                    renderGrowthPage();
                } else if (msg) {
                    msg.textContent = '寶石不夠——在單元拿到 🌟 無錯通過就能獲得寶石！';
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

    // 成就與寵物頁的「金幣」獨立於計分板分數，另存 mt_coins_{id}；由「🔄 轉換成金幣」注入
    function getCoins(stuId) { return parseInt(localStorage.getItem('mt_coins_' + stuId) || '0', 10) || 0; }
    function setCoins(stuId, v) { localStorage.setItem('mt_coins_' + stuId, String(Math.max(0, v | 0))); }

    // 進化演出：閃光動畫＋音效，動畫結束後才切換到新階段圖並 pop-in
    function playEvolveEffect(cb) {
        const im = document.getElementById('gp-pet-img');
        try { playSound('bonus'); } catch (e) {}
        if (im) { im.classList.remove('gp-evolving'); void im.offsetWidth; im.classList.add('gp-evolving'); }
        setTimeout(cb, 700);
    }
    function popPetImg() {
        const im = document.getElementById('gp-pet-img');
        if (!im) return;
        im.classList.remove('gp-evolving');                 // 移除閃光，動畫後浮遊(gpPetBob)才能恢復
        im.classList.remove('gp-popped'); void im.offsetWidth; im.classList.add('gp-popped');
        setTimeout(() => im.classList.remove('gp-popped'), 560);
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

        // ── 我的存錢寵物：◀▶ 切換（存錢豬 + 已解鎖收集寵物）；下方切換「已達階段」──
        const unlockedPets = (G.CREATURES || []).filter(cc => G.creatureState(_gpRecords, stu.id, cc.key).stage >= 0);
        const pets = [{ type: 'pig' }].concat(unlockedPets.map(cc => ({ type: 'creature', c: cc })));
        if (_savePetIdx == null || _savePetIdx < 0 || _savePetIdx >= pets.length) _savePetIdx = 0;
        const curPet = pets[_savePetIdx];

        const imgEl     = document.getElementById('gp-pet-img');
        const nameEl    = document.getElementById('gp-pet-name');
        const bar       = document.getElementById('gp-bar');
        const label     = document.getElementById('gp-bar-label');
        const feedBtn   = document.getElementById('gp-feed-btn');
        const evolveBtn = document.getElementById('gp-evolve-btn');
        const stageEl   = document.getElementById('gp-pet-stage');
        const petPrev   = document.getElementById('gp-pet-prev');
        const petNext   = document.getElementById('gp-pet-next');
        petPrev.disabled = petNext.disabled = pets.length <= 1;
        petPrev.onclick = () => { _savePetIdx = (_savePetIdx - 1 + pets.length) % pets.length; _savePetStage = null; renderGrowthPage(); };
        petNext.onclick = () => { _savePetIdx = (_savePetIdx + 1) % pets.length; _savePetStage = null; renderGrowthPage(); };

        // 階段切換列（只到已達階段；imgFor(vs) 回傳該階段圖片路徑）
        const renderStageSwitch = (maxStage, imgFor) => {
            if (_savePetStage == null || _savePetStage > maxStage || _savePetStage < 0) _savePetStage = maxStage;
            const vs = _savePetStage;
            imgEl.src = imgFor(vs);
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
            nameEl.textContent = stage.name;
            renderStageSwitch(stageIdx, (vs) => '../' + G.PET_STAGES[vs].img);
            feedBtn.hidden = false;
            if (!next) {
                bar.style.width = '100%';
                label.textContent = '🎉 已是最終型態，繼續保持好表現！';
                evolveBtn.hidden = true; feedBtn.disabled = true;
            } else if (next.gems && pet.growth >= next.need) {
                bar.style.width = '100%';
                label.textContent = `成長值滿了！用 ${next.gems} 顆 💎 進化成「${next.name}」`;
                evolveBtn.hidden = false; evolveBtn.disabled = gems < next.gems; feedBtn.disabled = true;
            } else {
                const base = stage.need, target = next.need;
                const pct = Math.max(3, Math.min(100, Math.round((pet.growth - base) / (target - base) * 100)));
                bar.style.width = pct + '%';
                label.textContent = `成長值 ${pet.growth} / ${target}`;
                evolveBtn.hidden = true; feedBtn.disabled = getCoins(stu.id) < G.FEED_COST;
            }
            feedBtn.onclick = () => {
                if (getCoins(stu.id) < G.FEED_COST) { gpMsg('金幣不夠——請到「優良表現獎勵板」把分數「🔄 轉換成金幣」！'); return; }
                const before = G.petStage(G.petData(stu.id));
                setCoins(stu.id, getCoins(stu.id) - G.FEED_COST);
                const p = G.petData(stu.id); p.growth += G.FEED_GAIN; G.savePet(stu.id, p);
                const after = G.petStage(p);
                if (after > before) {   // 餵食後跨到下一階段 → 進化動畫＋音效
                    playEvolveEffect(() => { _savePetStage = null; gpMsg('🎉 進化了！長大到「' + G.PET_STAGES[after].name + '」！'); renderGrowthPage(); popPetImg(); });
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
                playEvolveEffect(() => { _savePetStage = null; gpMsg(`✨ 進化成功！「${nxt.name}」誕生！`); renderGrowthPage(); popPetImg(); });
            };
        } else {
            const c  = curPet.c;
            const st = G.creatureState(_gpRecords, stu.id, c.key);
            nameEl.textContent = c.name;
            feedBtn.hidden = true; evolveBtn.hidden = true;
            renderStageSwitch(st.stage, (vs) => `../images/pets/pet_${c.key}_s${vs}.png`);
            if (st.next != null) {
                bar.style.width = Math.max(6, Math.min(100, Math.round((st.grown / Math.max(1, st.next)) * 100))) + '%';
                label.textContent = `再練 ${Math.max(0, st.next - st.grown)} 次就會進化`;
            } else {
                bar.style.width = '100%';
                label.textContent = '🎉 已完全進化！';
            }
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
            chip.innerHTML = `<div class="ic">${b.icon}</div><div class="nm">${b.name}</div>`;
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
            chip.innerHTML = `<div class="ic">${t.icon}</div><div class="nm">${t.name}</div>` +
                (has ? `<div class="nm" style="color:#16a34a">已擁有</div>`
                     : `<button class="buy" ${gems < t.gems ? 'disabled' : ''}>💎×${t.gems} 兌換</button>`);
            if (!has) {
                chip.querySelector('.buy')?.addEventListener('click', () => {
                    if (G.buyTreasure(_gpRecords, stu.id, t.id)) {
                        try { playSound('bonus'); } catch (e) {}
                        gpMsg(`🎁 兌換成功！獲得「${t.icon} ${t.name}」`);
                        renderGrowthPage();
                    } else {
                        gpMsg('寶石不夠——拿到 🌟 無錯通過就能獲得寶石！');
                    }
                });
            }
            tHost.appendChild(chip);
        });

        // ── 今日任務（唯讀） ──
        const qHost = document.getElementById('gp-quests');
        const qm = G.questMeta(stu.id);
        const tk = (d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)(new Date());
        if (qm && qm.date === tk && Array.isArray(qm.quests)) {
            qHost.innerHTML = '';
            qm.quests.forEach(q => {
                const line = document.createElement('div');
                line.className = 'gp-quest-line';
                const st = q.claimed ? '✅ 已領獎' : q.done ? '🪙 可領獎' : '⬜ 進行中';
                line.innerHTML = `<span>${q.icon}</span><span style="flex:1">${q.desc}</span><b>${st}</b>`;
                qHost.appendChild(line);
            });
        } else {
            qHost.innerHTML = '<div class="gp-quest-line">今天還沒領任務——到主頁點「金隊長」出任務！</div>';
        }
    }

}); // End of DOMContentLoaded