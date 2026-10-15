/* =====================================================================
 * config.js — 所有可調整的數值與文字都在這個檔案
 * ---------------------------------------------------------------------
 * 修改後存檔、重新整理網頁即可生效，不需要動其他檔案。
 * 注意：每一行結尾的逗號與引號要保留，否則網頁會無法執行。
 * ===================================================================== */
const CONFIG = {

  /* ---------- 網站標題與頁尾 ---------- */
  title: ' 超科學空間：摩擦力',
  footer: '頁尾資訊（作者／學校／授權）之後補上',

  /* ---------- 控制變因：箱子質量（固定三個，單位 kg） ----------
   * 順序對應箱子圖片 box_1.png、box_2.png、box_3.png（輕 → 重）
   */
  masses: [1, 3, 5],

  /* ---------- 控制變因：接觸面 ----------
   * muS     ：最大靜摩擦係數（畫面上不會顯示）
   * ground  ：地板圖片（左右可無縫接合的長條圖，推動時會水平捲動）
   *           留空 '' 則改用內建的 CSS 材質（texture）
   * texture ：沒有地板圖片時使用的內建材質，可用 'rough'、'normal'、'smooth'
   */
  surfaces: [
    { name: '粗糙', muS: 0.7, ground: 'assets/images/ground_1.png', texture: 'rough' },
    { name: '普通', muS: 0.4, ground: 'assets/images/ground_2.png', texture: 'normal' },
    { name: '平滑', muS: 0.1, ground: 'assets/images/ground_3.png', texture: 'smooth' },
  ],

  kineticRatio: 0.8,   // 動摩擦力 = 最大靜摩擦力 × 0.8
  g: 10,               // 重力加速度 (m/s²)

  /* ---------- 操控變因：推力 (N) ---------- */
  force: { min: 0, max: 40, step: 1, initial: 10 },

  /* ---------- 實驗紀錄 ---------- */
  maxRecords: 100,

  /* ---------- 動畫 ---------- */
  animation: {
    seconds: 3,              // 每次播放幾秒
    visualAccelScale: 45,    // 畫面加速度的放大倍率（只影響視覺速度）
    stridePx: 45,            // 背景每捲動多少（圖片座標 px）換下一張走路圖
    arrowPxPerNewton: 5,     // 力箭頭：每 1 N 的長度（圖片座標 px）
    cropTop: 100,            // 圖片上方要裁掉的高度（px），讓手機畫面不會太高
  },

  /* ---------- 圖片 ----------
   * 所有圖片都是 800 × 500 px、透明背景，疊在一起即對齊。
   * 走路圖可以是 3～5 張，增減這個陣列即可。
   * center：箱子中心在圖片中的座標 [x, y]，力箭頭從這裡畫出。
   *        換成正式圖片後，請依箱子實際位置修改。
   */
  images: {
    groundY: 398,   // ★ 地面線高度：人物與箱子圖片中「腳底／箱底」的 y 座標（px，從圖片上緣往下算）
    personPush: 'assets/images/person_push.png',
    personidle: 'assets/images/person_idle.png',
    personWalk: [
      'assets/images/person_walk_1.png',
      'assets/images/person_walk_2.png',
      'assets/images/person_walk_3.png',
      'assets/images/person_walk_4.png',
    ],
    boxes: [
      { src: 'assets/images/box_1.png', center: [455, 405] },
      { src: 'assets/images/box_2.png', center: [475, 388] },
      { src: 'assets/images/box_3.png', center: [495, 368] },
    ],
  },

  /* ---------- 結果文字 ---------- */
  messages: {
    static:    '推不動！箱子靜止不動',
    critical:  '箱子快要動了！',
    sliding:   '推動了！箱子開始滑動',
    limit:     '紀錄已達 100 筆上限，請按「重置實驗」後再繼續',
    chartLink: '已記錄 ↓ 查看圖表',
    chartEmpty: '按下「開始推」後，結果會畫在這裡',
    resetConfirm: '確定要清除全部紀錄，從頭開始實驗嗎？',
  },

  /* ---------- 折線圖 ----------
   * colors：每種接觸面依序對應三種質量（輕 → 重）的顏色
   * pointShapes：三種質量的點形狀（輕 → 重）
   *   style 可用 'circle'、'triangle'、'rect'、'rectRot'、'star'
   *   filled 為 true 是實心，false 是空心
   * ranges：刻度切換按鈕（橫軸與縱軸同步，單位 N）
   */
  chart: {
    colors: {
      '粗糙': ['#F0997B', '#D85A30', '#993C1D'],
      '普通': ['#85B7EB', '#378ADD', '#0C447C'],
      '平滑': ['#5DCAA5', '#1D9E75', '#085041'],
    },
    pointShapes: [
      { style: 'circle',   radius: 4, filled: true },
      { style: 'triangle', radius: 7, filled: false },
      { style: 'rect',     radius: 9, filled: false },
    ],
    ranges: [40, 20, 10, 5],
  },

  /* ---------- 操作教學（說明視窗，每一項是一頁） ---------- */
  tutorial: [
    { title: '1. 設定控制變因', text: '先選擇箱子的質量和接觸面。同一組實驗中，這兩項要保持不變。' },
    { title: '2. 調整操控變因', text: '用滑桿或「−」「＋」按鈕設定推力大小，然後按「開始推」。' },
    { title: '3. 觀察結果',     text: '推動時，藍色箭頭是推力，橘色箭頭是摩擦力，箭頭越長代表力越大。觀察箱子有沒有被推動，比較兩個力的大小。' },
    { title: '4. 分析圖表',     text: '每次的推力與摩擦力會畫在折線圖上。換一組質量或接觸面，就會畫出另一條線。數值太小看不清楚時，可以切換刻度放大。' },
  ],
};
