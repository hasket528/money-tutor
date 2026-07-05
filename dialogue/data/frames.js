// 跨情境共用句框庫（P4）
// 讓同一句框（如「我要 ___」）在不同場景長得一模一樣，幫助學生把句型當成
// 「可搬移的工具」來類化。步驟用 frame_ref 指向此處的 id，slots 仍由步驟各自提供。
//
// 用法（scenarios.js 步驟內）：
//   { id:"purchase", ...,
//     frame_ref:"want_item",
//     slots:{ item:{ answer:"餅乾", choices:[{text:"餅乾",emoji:"🍪"}, ...] } } }
//
// grows_to：指向「更長一階」的句框，供進階學生逐步擴展句型（句框成長）。

window.FRAME_LIBRARY = window.FRAME_LIBRARY || {
  greeting:     { template: "{greet}" },
  goodbye:      { template: "{bye}" },
  want_item:    { template: "我要 {item}",          grows_to: "want_two" },
  want_two:     { template: "我要 {item} 和 {item2}" },
  ask_price:    { template: "請問 {item} 多少錢？" },
  ask_location: { template: "請問 {item} 在哪裡？" },
  ask_way:      { template: "請問 {place} 怎麼走？" },
  find_item:    { template: "我想找 {item}" },
  wear_size:    { template: "我穿 {size} 號" },
  like_color:   { template: "我喜歡 {color} 的" },
  pay_with:     { template: "{pay}" },
};
