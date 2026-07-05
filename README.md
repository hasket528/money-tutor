# 金錢小達人（Money Tutor）

特殊教育金錢教學互動教材：涵蓋生活應用（A 系列）、預算規劃（B 系列）、貨幣認知（C 系列）、數學基礎（F 系列）共 24 個單元，並內建：

- 🕵️ **小金探的遊戲室** — 趣味小遊戲
- 🦉 **金博士的金錢冒險** — 故事情境挑戰
- 🐕 **金好聊的購物練習** — 購物對話練習（語音／選項／打字三模式，支援離線 PWA）
- 🎁 **獎勵系統** — 全站共用的學生獎勵計分
- 📝 **作業單系統** — 可列印／下載 PDF 的練習卷

## 線上使用

直接開啟 GitHub Pages 網址即可，無需安裝任何軟體。
建議使用 **Edge 或 Chrome** 瀏覽器（語音功能以 Microsoft 雅婷語音效果最佳）。

> 學生名冊與獎勵分數儲存在瀏覽器本機（localStorage / IndexedDB），
> 不會上傳到任何伺服器；同一台電腦的主站、購物練習、獎勵系統自動共用。

## 部署到 GitHub Pages（給維護者）

1. 在 GitHub 建立新的公開 repository（例如 `money-tutor`）
2. 將本資料夾全部內容上傳到 repository 根目錄
3. 到 repo 的 **Settings → Pages**，Source 選 **Deploy from a branch**，
   Branch 選 **main / (root)**，儲存
4. 等待 1–2 分鐘，網站網址為 `https://<帳號>.github.io/money-tutor/`

## 本機預覽（開發者）

因瀏覽器安全限制（PWA、音訊、localStorage 同源共用），請以 HTTP 伺服器開啟，不要直接雙擊 HTML：

```
cd 本資料夾
python -m http.server 8000
```

再以瀏覽器開啟 <http://localhost:8000/>。
