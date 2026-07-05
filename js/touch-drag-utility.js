// =================================================================
// FILE: js/touch-drag-utility.js
// PURPOSE: Universal touch screen drag support for all units
// =================================================================

/**
 * TouchDragUtility - Universal touch screen drag and drop support
 * 
 * This utility provides consistent touch screen support across all units
 * while maintaining compatibility with existing mouse drag implementations.
 * 
 * Features:
 * - Touch to drag conversion
 * - Visual feedback during drag
 * - Drop zone detection
 * - Event delegation for dynamic elements
 * - Compatible with existing drag handlers
 */
class TouchDragUtility {
    constructor() {
        this.currentDrag = null;
        this.dropZones = new Map();
        this.dragStartHandlers = new Map();
        this.dropHandlers = new Map();
        this.dragEndHandlers = new Map();
        
        // Touch drag state
        this.touchState = {
            isDragging: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            element: null,
            clone: null,
            startContainer: null
        };
        
        // Debug settings
        this.debug = {
            enabled: true, // 保留debug模式開啟，方便調試
            logPrefix: '[TouchDragUtility]'
        };
        
        this.init();
    }
    
    // 除錯日誌方法
    log(message, data = null) {
        if (!this.debug.enabled) return;
        const timestamp = new Date().toLocaleTimeString();
        console.log(`${this.debug.logPrefix} ${timestamp}: ${message}`, data || '');
    }
    
    init() {
        // Add global touch event listeners
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Add global style for drag clone
        this.addDragStyles();
    }
    
    addDragStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .touch-drag-clone {
                position: fixed !important;
                z-index: 10000 !important;
                pointer-events: none !important;
                opacity: 0.8 !important;
                transform: scale(1.1) !important;
                transition: none !important;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3) !important;
                will-change: transform, left, top !important;
            }

            .touch-drag-clone * {
                pointer-events: none !important;
            }

            /* 🆕 金錢項目拖曳時只顯示去背圖片 */
            .touch-drag-clone.money-item,
            .touch-drag-clone.change-money,
            .touch-drag-clone.change-money-item,
            .touch-drag-clone.payment-money-item,
            .touch-drag-clone.payment-money,
            .touch-drag-clone.placed-money {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                min-width: auto !important;
                min-height: auto !important;
                width: auto !important;
                height: auto !important;
            }

            /* B3 拖曳金幣：去背、只顯示圖片 */
            .touch-drag-clone.b3-drag-coin {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
            }
            .touch-drag-clone.b3-drag-coin img {
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)) !important;
                transform: scale(1.15) !important;
            }

            /* F6 拖曳 Emoji / 圖示：去背、只顯示內容 */
            .touch-drag-clone.draggable-emoji {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                min-width: auto !important;
                min-height: auto !important;
                width: auto !important;
                height: auto !important;
            }
            .touch-drag-clone.draggable-emoji img {
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)) !important;
                transform: scale(1.15) !important;
            }

            /* 當 clone 本身是 <img>（金錢圖示/自訂圖示的直接複製）：
               移除方框陰影，改用 drop-shadow 跟著圖形輪廓
               （!important 才能覆蓋 .touch-drag-clone 的 box-shadow !important）*/
            img.touch-drag-clone {
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                background: transparent !important;
                outline: none !important;
                filter: drop-shadow(0 4px 10px rgba(0,0,0,0.35)) !important;
            }

            /* 當 clone 本身是 <span>（emoji 文字）：同樣移除方框陰影 */
            span.touch-drag-clone {
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
            }

            /* 金錢項目拖曳時圖片添加陰影效果 */
            .touch-drag-clone.money-item img,
            .touch-drag-clone.change-money img,
            .touch-drag-clone.change-money-item img,
            .touch-drag-clone.payment-money-item img,
            .touch-drag-clone.payment-money img,
            .touch-drag-clone.placed-money img {
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)) !important;
                transform: scale(1.15) !important;
            }

            /* 隱藏金錢項目拖曳時的金額文字 */
            .touch-drag-clone.money-item .money-value,
            .touch-drag-clone.change-money .money-value,
            .touch-drag-clone.change-money-item .money-value,
            .touch-drag-clone.payment-money-item .money-value,
            .touch-drag-clone.payment-money .money-value,
            .touch-drag-clone.placed-money .money-value {
                display: none !important;
            }

            .touch-dragging {
                opacity: 0.5;
            }

            .touch-drop-zone-hover {
                background-color: rgba(0, 255, 0, 0.1);
                border-color: #00ff00 !important;
                transform: scale(1.02);
                transition: all 0.2s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Register a draggable element or container
     * @param {HTMLElement} container - Container element for event delegation
     * @param {string} draggableSelector - CSS selector for draggable elements
     * @param {Object} handlers - Event handlers
     * @param {Function} handlers.onDragStart - Called when drag starts
     * @param {Function} handlers.onDrop - Called when dropped on valid zone
     * @param {Function} handlers.onDragEnd - Called when drag ends
     */
    registerDraggable(container, draggableSelector, handlers) {
        const containerId = this.getElementId(container);
        if (!containerId) return;
        
        this.dragStartHandlers.set(containerId, {
            container,
            selector: draggableSelector,
            handler: handlers.onDragStart || (() => {})
        });
        
        this.dropHandlers.set(containerId, handlers.onDrop || (() => {}));
        this.dragEndHandlers.set(containerId, handlers.onDragEnd || (() => {}));
    }
    
    /**
     * Register a drop zone
     * @param {HTMLElement} element - Drop zone element
     * @param {Function} validator - Function to validate if drop is allowed
     */
    registerDropZone(element, validator = () => true) {
        const id = this.getElementId(element);
        if (id) {
            this.dropZones.set(id, { element, validator });
        }
    }
    
    /**
     * Unregister all handlers for a container
     * @param {HTMLElement} container 
     */
    unregisterDraggable(container) {
        const containerId = this.getElementId(container);
        if (containerId) {
            this.dragStartHandlers.delete(containerId);
            this.dropHandlers.delete(containerId);
            this.dragEndHandlers.delete(containerId);
        }
        
        // 🔧 [性能優化] 清理多餘的數據屬性
        if (container.dataset.touchDragId) {
            delete container.dataset.touchDragId;
        }
    }
    
    /**
     * 🔧 [新增] 清理所有註冊的處理器，用於遊戲結束時提高性能
     */
    cleanupAll() {
        this.dragStartHandlers.clear();
        this.dropHandlers.clear();
        this.dragEndHandlers.clear();
        this.dropZones.clear();
        
        // 如果有正在進行的拖拽，清理它
        if (this.touchState.isDragging) {
            this.cleanupDrag();
        }
    }
    
    /**
     * Unregister a drop zone
     * @param {HTMLElement} element 
     */
    unregisterDropZone(element) {
        const id = this.getElementId(element);
        if (id) {
            this.dropZones.delete(id);
        }
    }
    
    getElementId(element) {
        if (!element || !element.dataset) {
            console.warn('⚠️ TouchDragUtility: Invalid element passed to getElementId', element);
            return null;
        }
        if (!element.dataset.touchDragId) {
            element.dataset.touchDragId = 'td_' + Math.random().toString(36).substr(2, 9);
        }
        return element.dataset.touchDragId;
    }
    
    handleTouchStart(event) {
        // 🔧 [性能優化] 最優先檢查：如果沒有註冊容器，立即返回，不干擾滾動
        if (this.dragStartHandlers.size === 0) {
            return; // 不記錄log，最大化性能
        }

        // 🔧 [防止重複touchstart] 如果已經在拖曳中，忽略新的touchstart
        if (this.touchState.isDragging) {
            this.log('❌ 已在拖曳中，忽略新的touchstart事件');
            return;
        }

        // 🔧 [性能優化] 快速檢查是否可能是拖拽元素
        // 🔧 [A6 觸控修復 v2.3] 使用 let 以便在子元素 pointer-events:none 時重新指向父元素
        const _DRAG_SEL = '.draggable-item, .money-item, .counting-item, .change-money, .change-money-item, .normal-change-money, .payment-money-item, .payment-money, .placed-money, .source-item, .placement-slot, .placed-item, .number-item, .payment-target, .change-money.draggable, .draggable-emoji, .easy-change-money, .b3-drag-coin, .b3-ndrag-denom';
        let target = event.target;

        this.log('👆 touchstart事件觸發', {
            target: target.className,
            tagName: target.tagName,
            registeredHandlers: this.dragStartHandlers.size,
            touches: event.touches.length
        });

        // 快速檢查：如果元素已經被放置且不可拖拽，直接返回
        // 🔧 [A6 觸控修復] 子元素（如 img）可能設了 pointer-events:none，應往上找可拖曳父元素
        if (target.style && target.style.pointerEvents === 'none') {
            const draggableParent = target.parentElement?.closest(_DRAG_SEL);
            if (!draggableParent) {
                this.log('❌ 元素pointer-events為none且無可拖曳父元素，忽略touchstart');
                return;
            }
            target = draggableParent; // 以可拖曳父元素作為有效目標
        }

        // 🔧 [性能優化] 使用更精確的拖拽元素檢查，避免不必要的查找
        // 擴展快速檢查選擇器以包含所有單元的拖曳元素類別
        const quickCheck = target.closest(_DRAG_SEL)
            || target.parentElement?.closest(_DRAG_SEL); // 🔧 [A6 觸控修復] 邊界情況備援
        if (!quickCheck) {
            this.log('❌ 元素不符合快速檢查條件，忽略touchstart');
            return;
        }
        // 若 closest 找到的是祖先而非 target 本身，更新 target
        if (quickCheck !== target) { target = quickCheck; }

        // Check if touch started on a draggable element
        const draggableInfo = this.findDraggableElement(target);
        if (!draggableInfo) {
            this.log('❌ 找不到可拖曳元素資訊');
            return;
        }
        
        const { element, containerId } = draggableInfo;
        const dragStartInfo = this.dragStartHandlers.get(containerId);
        
        this.log('✅ 找到可拖曳元素', {
            element: element.className,
            containerId,
            hasHandler: !!dragStartInfo
        });
        
        // Prevent default touch behavior
        event.preventDefault();
        
        // Call original drag start handler
        const result = dragStartInfo.handler(element, event);
        if (result === false) {
            this.log('❌ 拖曳處理器取消了拖曳操作');
            return;
        }
        
        // Initialize touch drag state
        const touch = event.touches[0];
        const rect = element.getBoundingClientRect();
        
        this.touchState = {
            isDragging: true,
            touchIdentifier: touch.identifier,  // 🔧 [多指觸控修復] 記錄啟動拖曳的手指ID
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY,
            element: element,
            clone: null,
            startContainer: element.parentElement,
            containerId: containerId,
            offsetX: touch.clientX - rect.left,
            offsetY: touch.clientY - rect.top
        };
        
        this.log('🎯 初始化拖曳狀態', {
            startX: this.touchState.startX,
            startY: this.touchState.startY,
            elementClass: element.className,
            parentClass: element.parentElement?.className
        });
        
        // Add dragging class to original element
        element.classList.add('touch-dragging');
        
        // Create visual clone after a small delay to avoid interfering with touch
        setTimeout(() => {
            // 🔧 [防止重複clone] 確保只有在仍在拖曳且沒有clone時才建立
            if (this.touchState.isDragging && !this.touchState.clone) {
                this.log('🎨 建立拖曳視覺複製');
                this.createDragClone();
            }
        }, 50);
    }
    
    handleTouchMove(event) {
        if (!this.touchState.isDragging) return;

        event.preventDefault();

        // 🔧 [多指觸控修復] 只追蹤啟動拖曳的手指
        const touch = (this.touchState.touchIdentifier !== undefined
            ? Array.from(event.touches).find(t => t.identifier === this.touchState.touchIdentifier)
            : null) || event.touches[0];
        this.touchState.currentX = touch.clientX;
        this.touchState.currentY = touch.clientY;
        
        // 偶爾記錄移動狀態（避免過多log）
        if (Math.random() < 0.05) { // 約5%機率記錄
            this.log('👉 touchmove拖曳中', {
                currentX: touch.clientX,
                currentY: touch.clientY,
                hasClone: !!this.touchState.clone
            });
        }
        
        // Update clone position
        if (this.touchState.clone) {
            this.touchState.clone.style.left = (touch.clientX - this.touchState.offsetX) + 'px';
            this.touchState.clone.style.top = (touch.clientY - this.touchState.offsetY) + 'px';
        }
        
        // Check drop zones
        this.updateDropZoneHover(touch.clientX, touch.clientY);
    }
    
    handleTouchEnd(event) {
        if (!this.touchState.isDragging) return;

        // 🔧 [多指觸控修復] 只回應啟動拖曳的手指，忽略其他手指的 touchend
        let touch;
        if (this.touchState.touchIdentifier !== undefined) {
            touch = Array.from(event.changedTouches).find(
                t => t.identifier === this.touchState.touchIdentifier
            );
            if (!touch) {
                this.log('⚠️ 非拖曳手指的touchend，已忽略（防止多指觸控誤觸）');
                return; // 其他手指抬起，繼續等待拖曳手指抬起
            }
        } else {
            touch = event.changedTouches[0];
        }

        event.preventDefault();
        this.log('🏁 touchend拖曳結束', {
            endX: touch.clientX,
            endY: touch.clientY,
            startX: this.touchState.startX,
            startY: this.touchState.startY,
            element: this.touchState.element?.className
        });
        
        const dropZone = this.findDropZoneAt(touch.clientX, touch.clientY);
        
        this.log('🎯 檢查放置目標', {
            hasDropZone: !!dropZone,
            dropZoneClass: dropZone?.className,
            containerId: this.touchState.containerId
        });
        
        // 新增：詳細的放置框類型檢測（針對F3）
        if (dropZone && this.touchState.element) {
            const itemInfo = {
                itemClass: this.touchState.element.className,
                itemId: this.touchState.element.dataset?.id || this.touchState.element.dataset?.index,
                dropZoneClass: dropZone.className
            };
            
            if (dropZone.classList.contains('placement-slot')) {
                this.log('📦 TouchDrag：檢測到小放置槽', itemInfo);
            } else if (dropZone.classList.contains('placement-area')) {
                this.log('📦 TouchDrag：檢測到主放置區域', itemInfo);
            } else if (dropZone.classList.contains('item-source-area')) {
                this.log('📦 TouchDrag：檢測到物品來源區', itemInfo);
            } else if (dropZone.classList.contains('drop-zone')) {
                this.log('📦 TouchDrag：檢測到一般放置區', itemInfo);
            } else {
                this.log('📦 TouchDrag：檢測到未知放置區域', itemInfo);
            }
        }
        
        // Call drop handler if valid drop zone found
        if (dropZone && this.touchState.containerId) {
            const dropHandler = this.dropHandlers.get(this.touchState.containerId);
            if (dropHandler) {
                this.log('✅ 執行放置處理器');
                // Create a synthetic drop event
                const syntheticEvent = this.createSyntheticDropEvent(event, dropZone);
                dropHandler(this.touchState.element, dropZone, syntheticEvent);
            } else {
                this.log('❌ 找不到放置處理器');
            }
        } else {
            this.log('❌ 無效的放置目標或容器ID');
        }
        
        // Call drag end handler
        if (this.touchState.containerId) {
            const dragEndHandler = this.dragEndHandlers.get(this.touchState.containerId);
            if (dragEndHandler) {
                this.log('🔚 執行拖曳結束處理器');
                dragEndHandler(this.touchState.element, event);
            }
        }
        
        // Clean up
        this.log('🧹 清理拖曳狀態');
        this.cleanupDrag();
    }
    
    createDragClone() {
        const element = this.touchState.element;
        const rect = element.getBoundingClientRect();

        // 🆕 如果拖曳的是含有圖片的金錢元素，只顯示去背圖片
        const img = element.querySelector('img');
        let clone;
        if (img) {
            clone = img.cloneNode(true);
            clone.classList.add('touch-drag-clone');
            const imgRect = img.getBoundingClientRect();
            clone.style.position = 'fixed';
            clone.style.left = (rect.left + (rect.width - imgRect.width) / 2) + 'px';
            clone.style.top = (rect.top + (rect.height - imgRect.height) / 2) + 'px';
            clone.style.width = imgRect.width * 1.2 + 'px';
            clone.style.height = imgRect.height * 1.2 + 'px';
            clone.style.objectFit = 'contain';
            clone.style.background = 'transparent';
            clone.style.border = 'none';
            clone.style.boxShadow = 'none';
            clone.style.borderRadius = '0';
        } else {
            // 🆕 嘗試取得 emoji/文字內容，建立去背圖形（適用 F 系列圖示）
            const emojiEl = element.querySelector('.emoji-icon') || null;
            const emojiText = emojiEl ? emojiEl.textContent.trim() : element.textContent.trim();

            if (emojiText) {
                clone = document.createElement('span');
                clone.classList.add('touch-drag-clone');
                clone.textContent = emojiText;
                clone.style.position = 'fixed';
                clone.style.left = rect.left + 'px';
                clone.style.top = rect.top + 'px';
                clone.style.fontSize = window.getComputedStyle(element).fontSize;
                clone.style.lineHeight = '1';
                clone.style.background = 'transparent';
                clone.style.border = 'none';
                clone.style.boxShadow = 'none';
                clone.style.padding = '0';
                clone.style.transform = 'scale(1)';
                clone.style.transformOrigin = 'top left';
                clone.style.filter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))';
            } else {
                clone = element.cloneNode(true);
                clone.classList.add('touch-drag-clone');
                clone.style.position = 'fixed';
                clone.style.left = rect.left + 'px';
                clone.style.top = rect.top + 'px';
                clone.style.width = rect.width + 'px';
                clone.style.height = rect.height + 'px';
            }
        }

        clone.style.zIndex = '10000';  // 🔧 提高z-index確保不被遮擋
        clone.style.pointerEvents = 'none';

        // 🔧 確保克隆元素及其所有子元素的pointer-events都是none
        clone.querySelectorAll('*').forEach(child => {
            child.style.pointerEvents = 'none';
        });

        document.body.appendChild(clone);
        this.touchState.clone = clone;

        this.log('✅ 克隆元素已創建', {
            position: `${clone.style.left}, ${clone.style.top}`,
            size: `${clone.style.width} × ${clone.style.height}`,
            zIndex: clone.style.zIndex,
            classList: clone.className,
            imageOnly: !!img,
            emojiOnly: !img && !!element.textContent.trim()
        });
    }
    
    findDraggableElement(target) {
        // 🔧 [手機端修復] 如果沒有註冊的拖拽容器，安靜地返回null
        if (this.dragStartHandlers.size === 0) {
            return null;
        }
        
        // 🔧 [性能優化] 快速預檢查：如果目標元素明顯不是拖拽元素，直接返回
        const quickCheck = target.closest('.draggable-item, .money-item, .counting-item, .change-money, .change-money-item, .normal-change-money, .payment-money-item, .payment-money, .wallet-money, .placed-money, .source-item, .placement-slot, .placed-item, .number-item, .payment-target, .change-money.draggable, .draggable-emoji, .easy-change-money, .b3-drag-coin, .b3-ndrag-denom');
        if (!quickCheck) {
            return null;
        }
        
        // Check all registered draggable containers
        for (const [containerId, info] of this.dragStartHandlers) {
            const { container, selector } = info;

            // 🔧 [調試] 記錄詳細匹配過程
            const isInContainer = container.contains(target);
            this.log(`🔍 檢查容器 ${containerId}:`, {
                selector: selector,
                isInContainer: isInContainer,
                targetClass: target.className,
                targetTag: target.tagName
            });

            // Check if target matches the draggable selector within this container
            if (isInContainer) {

                // First try: target itself matches
                const matchesDirectly = target.matches && target.matches(selector);
                this.log(`  → 第一次嘗試（直接匹配）: ${matchesDirectly}`);
                if (matchesDirectly) {
                    return { element: target, containerId };
                }

                // Second try: find closest matching ancestor
                const draggableElement = target.closest(selector);
                this.log(`  → 第二次嘗試（closest）:`, draggableElement ? draggableElement.className : 'null');
                if (draggableElement && container.contains(draggableElement)) {
                    return { element: draggableElement, containerId };
                }

                // Third try: check if target is inside a draggable element
                const parentDraggable = target.parentElement?.closest(selector);
                this.log(`  → 第三次嘗試（parent.closest）:`, parentDraggable ? parentDraggable.className : 'null');
                if (parentDraggable && container.contains(parentDraggable)) {
                    return { element: parentDraggable, containerId };
                }
            }
        }
        
        return null;
    }
    
    findDropZoneAt(x, y) {
        // Temporarily hide the clone to check elements underneath
        const originalDisplay = this.touchState.clone ? this.touchState.clone.style.display : null;
        if (this.touchState.clone) {
            this.touchState.clone.style.display = 'none';
        }

        const elementAtPoint = document.elementFromPoint(x, y);

        // Restore clone display
        if (this.touchState.clone && originalDisplay !== null) {
            this.touchState.clone.style.display = originalDisplay;
        }

        if (!elementAtPoint) return null;

        // 🔧 [觸控優化] 收集所有匹配的drop zones，然後返回最具體的（最內層的）
        let matchedDropZones = [];

        for (const [id, info] of this.dropZones) {
            const { element, validator } = info;
            if (element.contains(elementAtPoint) || element === elementAtPoint) {
                if (validator(this.touchState.element, element)) {
                    matchedDropZones.push(element);
                }
            }
        }

        // 如果有多個匹配，返回最內層的（最具體的）drop zone
        if (matchedDropZones.length > 0) {
            // 按 DOM 層級深度排序，最深的（最具體的）在前
            matchedDropZones.sort((a, b) => {
                if (a.contains(b)) return 1;  // b 更具體
                if (b.contains(a)) return -1; // a 更具體
                return 0; // 同級
            });
            return matchedDropZones[0];
        }

        return null;
    }
    
    updateDropZoneHover(x, y) {
        // Remove previous hover states
        document.querySelectorAll('.touch-drop-zone-hover').forEach(el => {
            el.classList.remove('touch-drop-zone-hover');
        });
        
        // Add hover state to current drop zone
        const dropZone = this.findDropZoneAt(x, y);
        if (dropZone) {
            dropZone.classList.add('touch-drop-zone-hover');
        }
    }
    
    createSyntheticDropEvent(originalEvent, dropZone) {
        // 🔧 [修復A1找零頁面] 智能確定實際的目標元素
        let actualTarget = dropZone;

        // 如果dropZone是容器，嘗試找到具體的目標子元素
        if (dropZone && originalEvent && originalEvent.touches && originalEvent.touches.length > 0) {
            const touch = originalEvent.touches[0] || originalEvent.changedTouches[0];
            if (touch) {
                // 隱藏拖拽複製以檢查下方元素
                const originalCloneDisplay = this.touchState.clone ? this.touchState.clone.style.display : null;
                if (this.touchState.clone) {
                    this.touchState.clone.style.display = 'none';
                }

                const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);

                // 恢復拖拽複製顯示
                if (this.touchState.clone && originalCloneDisplay !== null) {
                    this.touchState.clone.style.display = originalCloneDisplay;
                }

                // 如果找到更具體的目標元素且它在dropZone內，使用它作為目標
                if (elementAtPoint && (dropZone.contains(elementAtPoint) || dropZone === elementAtPoint)) {
                    // 優先使用具有特定類的元素
                    const specificTarget = elementAtPoint.closest('.change-target, .hint-item, .placement-slot, .drop-zone');
                    if (specificTarget && dropZone.contains(specificTarget)) {
                        actualTarget = specificTarget;
                        this.log('🎯 找到具體目標元素:', actualTarget.className);
                    } else if (elementAtPoint !== dropZone) {
                        actualTarget = elementAtPoint;
                        this.log('🎯 使用指針下方元素作為目標:', actualTarget.className);
                    }
                }
            }
        }

        // Create a synthetic event that mimics a drop event
        return {
            target: actualTarget,
            preventDefault: () => {},
            stopPropagation: () => {},
            dataTransfer: {
                getData: () => this.touchState.element.dataset.value || '',
                setData: () => {}
            },
            originalEvent: originalEvent,
            syntheticTouchDrop: true
        };
    }
    
    cleanupDrag() {
        // Remove classes
        if (this.touchState.element) {
            this.touchState.element.classList.remove('touch-dragging');
        }

        // 🔧 [修復殘影問題] 清理所有可能的拖曳複製元素
        // 移除當前clone
        if (this.touchState.clone) {
            this.touchState.clone.remove();
        }

        // 🔧 [安全清理] 移除任何遺留的拖曳複製元素
        document.querySelectorAll('.touch-drag-clone').forEach(cloneElement => {
            if (cloneElement.parentNode) {
                cloneElement.remove();
                this.log('🧹 清理遺留的拖曳複製元素');
            }
        });

        // Remove hover states
        document.querySelectorAll('.touch-drop-zone-hover').forEach(el => {
            el.classList.remove('touch-drop-zone-hover');
        });

        // Reset state
        this.touchState = {
            isDragging: false,
            touchIdentifier: undefined,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            element: null,
            clone: null,
            startContainer: null,
            containerId: null,
            offsetX: 0,
            offsetY: 0
        };
    }
}

// Create global instance
try {
    window.TouchDragUtility = window.TouchDragUtility || new TouchDragUtility();
    
    // 🔧 [性能優化] 只在首次載入時記錄，避免重複日誌
    if (!window.TouchDragUtility.isLogged) {
        console.log('🎯 TouchDragUtility 已載入並實例化');
        window.TouchDragUtility.isLogged = true;
    }
} catch (error) {
    console.error('❌ TouchDragUtility 初始化失敗:', error);
    window.TouchDragUtility = null;
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TouchDragUtility;
}