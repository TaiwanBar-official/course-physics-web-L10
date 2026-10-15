# 《圖解操作理化課》L10 摩擦力實驗

國中摩擦力模擬實驗網頁。純靜態網站（HTML + CSS + JavaScript），不需要安裝或編譯，可直接部署在 GitHub Pages。

---

## 一、檔案結構

```
friction-lab/
├── index.html              網頁骨架
├── css/style.css           外觀與手機／電腦排版
├── js/
│   ├── config.js           ★ 所有可調整的數值與文字（平常只需要改這個）
│   ├── physics.js          物理計算（推不動／即將滑動／滑動）
│   ├── animation.js        模擬動畫與力箭頭
│   ├── graph.js            推力－摩擦力折線圖
│   ├── main.js             按鈕操作與流程控制
│   └── vendor/chart.umd.min.js   圖表函式庫 Chart.js 4.5.1（已內建，不需網路）
└── assets/images/          PNG 圖片（目前為佔位圖）
```

## 二、在自己電腦上測試

直接用瀏覽器打開 `index.html`（雙擊即可），不需要架設伺服器。

## 三、部署到 GitHub Pages

1. 登入 GitHub，點右上角「＋」→「New repository」。
2. 輸入名稱（例如 `friction-lab`），選擇 **Public**，按「Create repository」。
3. 在新的 repository 頁面點「uploading an existing file」。
4. 打開電腦上的 `friction-lab` 資料夾，**把裡面所有檔案與資料夾**（不是外層資料夾本身）一起拖進上傳區。
   確認清單裡有 `index.html` 在最外層，以及 `css`、`js`、`assets` 三個資料夾。
5. 按頁面下方「Commit changes」。
6. 點上方「Settings」→ 左側「Pages」。
7. 在「Build and deployment」→「Source」選「Deploy from a branch」；
   「Branch」選 `main`，資料夾選 `/ (root)`，按「Save」。
8. 等 1～2 分鐘後重新整理此頁，上方會出現網址，格式為：
   `https://你的帳號.github.io/friction-lab/`

之後要更新檔案時，進到 repository 點「Add file」→「Upload files」，上傳同名檔案就會覆蓋，約 1 分鐘後網站自動更新。
若手機上看到的還是舊版，請重新整理或清除瀏覽器快取。

## 四、替換正式圖片

把正式 PNG 放進 `assets/images/`，**檔名與佔位圖相同**即可直接覆蓋：

| 檔名 | 內容 |
|---|---|
| `person_push.png` | 用力推但沒走動的靜止圖 |
| `person_walk_1.png` ～ `person_walk_4.png` | 走路推箱的連續幀 |
| `box_1.png`、`box_2.png`、`box_3.png` | 小、中、大箱子（輕 → 重） |
| `ground_1.png`、`ground_2.png`、`ground_3.png` | 粗糙、普通、平滑的地板（規格見下方） |

地板圖片規格（與人物、箱子不同）：
- 是一條**橫向長條圖**，建議 **800 × 100 px**（寬度可自訂，高寬比固定即可），不需要透明背景。
- 會自動縮放到與地面同高，並**左右重複鋪排**、推動時往後捲動，所以**左右兩端要能無縫接合**。
- 若某種地板想改回內建的 CSS 材質，在 `config.js` 的 `surfaces` 中把該項的 `ground` 改成 `''`。

圖片規格：
- 全部 **800 × 500 px、透明背景**，畫布大小一致。
- 人物與箱子直接畫在最終位置，**地面線預設在 y = 450 px**（可在 config 的 `groundY` 修改），人手與箱子的接觸點目前在 x = 400 px 附近。
- 畫面上方 100 px 在網頁上會被裁掉（可在 config 的 `cropTop` 調整），重要內容請畫在 y = 100 以下。

替換後，請在 `config.js` 確認兩件事：
- `personWalk`：走路圖如果不是 4 張，增減這個清單。
- `boxes` 的 `center`：改成正式圖片中**箱子中心點的座標**，力箭頭會從這裡畫出。

## 五、常見調整（都在 `js/config.js`）

| 想改的東西 | 位置 |
|---|---|
| 三種質量 | `masses` |
| 接觸面名稱、係數 | `surfaces` |
| 動摩擦力比例 | `kineticRatio` |
| 推力範圍、間距、初始值 | `force` |
| 紀錄上限 | `maxRecords` |
| 動畫秒數、速度、箭頭長度 | `animation` |
| 地面線高度（地板厚度） | `images.groundY` |
| 結果文字、提示文字 | `messages` |
| 折線顏色、點形狀、刻度按鈕 | `chart` |
| 操作教學內容 | `tutorial` |
| 頁尾文字 | `footer` |

注意：若修改了接觸面的 `name`，`chart.colors` 中對應的名稱也要一起修改。
