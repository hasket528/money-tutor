# images/adv-items/（已退場）

2026-09-23 起《一日金錢冒險》的商品圖改放在**專屬資料夾 `adventure/images/items/`**，本資料夾不再被任何頁面引用。

## 為什麼退場

這裡留下的 8 張是**卡通線稿**（當初生圖提示詞指定「cute children's illustration」），
跟冒險模式其他寫實商品照放在一起風格不一致（使用者回報「鬧鐘好像不是真實的圖片」）。

## 現在該用什麼

| 這裡的舊檔 | 換成 `adventure/images/items/` | 來源 |
|---|---|---|
| `adv-alarm-clock.png` | `adv-alarm-clock.png` | 2026-09-23 新生成寫實商品照 |
| `adv-desk-lamp.png` | `adv-desk-lamp.png` | 同上 |
| `adv-food-container.png` | `adv-food-container.png` | 同上 |
| `adv-comic-set.png` | `adv-comic-set.png` | 同上 |
| `adv-coat.png` | `adv-jacket.png` | 複製自 `images/a4/icon-a4-jacket-shop.png` |
| `adv-tablet.png` | `adv-tablet.png` | 複製自 `images/a4/icon-a4-tablet-shop.png` |
| `adv-heart-sticker.png`、`adv-marker.png` | —（本來就沒有被引用） | — |

原本這裡的 5 張寫實圖（三角飯糰、茶葉蛋、地瓜、微波便當、微波義大利麵）已用 `git mv` 搬到新資料夾。

⚠️ 新增冒險模式的商品圖一律放 `adventure/images/items/`，並用寫實商品照（透明背景、物品約佔畫面 92%，與 A4 同風格）。
