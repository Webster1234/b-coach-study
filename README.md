# B Coach Study｜World Gym／B 級教練複習站

純前端、可離線開啟的繁體中文複習網站（需以本機 HTTP 提供靜態檔，因 `fetch` 讀 JSON）。

涵蓋：**白話課文＋新手引導路徑**、**解剖體力學速記卡**、**B 級／中級模擬選擇題（45 題）**。

## 新手怎麼用

1. 打開首頁，點最大的按鈕 **「🌱 新手從這開始」**
2. 依序走引導關卡（目前依 path 關卡數，含講義動作對照）：每關先讀白話課文（生活比喻＋關鍵詞）→ 再做 3～5 題超簡單小練習
3. 進度存在本機 `localStorage`，下次會接著未完成關卡
4. 走完引導後，再使用「正式刷題」「間隔重複」或「章節一覽」補強考試向內容（起止點等）

其他入口：
- **先看觀念**：單獨開某一課課文
- **關節動作對照（L17）**：講義 p.73–74 每個動作白話＋例子＋主力肌＋易混點（標〔對講義〕）
- **訓練科學（L21–L24）**：World Gym《肌能訓練》https://youtu.be/bitXk8tqgMI ＋ 學員提供 FITT-VP 表（ACSM 式，`assets/fitt-vp-table.jpg`）。L21 負荷設定（1RM／%1RM、1–6／7–12／12–15）、L22 體適能要素與三大能量系統、L23 心率區間與 MHR／HRR／RHR／THR（含計算題；公式標〔補充〕）、L24 需求分析與 FITT-VP（圖＋每格文字版表格）。卡片 tag「WG 肌能訓練影片」／「FITT-VP 表」
- **名詞小辭典**：給零基礎的白話名詞解釋（內旋／外旋／旋前／背屈等，`data/glossary.json`）；課文可點名詞、問教練優先查辭典
- **速記法**：口訣／聯想／對照表（可搜尋、依章節）；課文與翻卡背面會顯示「💡 速記」
- **考過的人這樣說**：公開心得整理的高／中優先必背重點（`data/exam-focus.json`），可連到課文與速記；標有「考過常提」
- **小練習翻卡**：預設只抽 `basic` 基礎卡（功能／白話問法）
- **正式刷題**：可選「小練習」（可看提示、答錯立刻解析）或「正式計分考」
- **問教練**（右下角🏋️）：站內教練聊天，用名詞小辭典／課文／卡片／速記回答；可選 ⚙️ 貼上自己的免費 Gemini 金鑰改用 AI 回答（見下方「問教練 AI 設定」）

## 功能一覽

1. **新手引導路徑**：固定順序（含「骨骼與標記」），課文 → 小練習  
2. **觀念課文**：`data/lessons.json`  
3. **學習翻卡**：可篩章節、可只抽基礎卡；背面含正式答案＋白話  
4. **間隔重複**：簡易 SM-2，進度存本機  
5. **測驗**：45 題模擬選擇題或由基礎卡出題；練習／計分兩模式、錯題本  
6. **章節一覽**：有對應課文的章節會先開課文  
7. **名詞小辭典**：搜尋／分類瀏覽；課文內可點名詞
8. **問教練**：右下角浮動按鈕，站內檢索回答（辭典優先）；選用自備 Gemini 金鑰的 AI 回答  
9. **課文表格**：`lessons.json` 課文可帶 `tables:[{caption,headers,rows,note}]`，顯示為可讀文字版表格（手機自動改直式），給圖片表格做無障礙對照  

## 路徑

```
/workspace/b-coach-study/
  index.html
  css/style.css
  js/app.js · coach-chat.js · sm2.js · storage.js
  data/cards.json          # 含 level / plain；肌群拆成功能卡 + 起止點卡
  data/exam-questions.json # 45 題模擬選擇題（改寫非 verbatim）
  data/lessons.json        # 課文 + 引導路徑
  data/mnemonics.json      # 速記法口訣
  data/glossary.json       # 名詞小辭典（新手白話）
  data/exam-focus.json     # 考過的人建議著重（心得綜合）
  data/sources.md          # 公開參考來源
  scripts/enrich_cards.py  # 批次補 plain／level（已套用則跳過）
  scripts/add_wg_muscle_training.py  # 整合 WG 肌能訓練＋FITT-VP（L21–L24，可重跑）；內容在 scripts/wgmt_content_*.py
  assets/fitt-vp-table.jpg # 學員提供 FITT-VP 表圖片
  assets/diagrams/         # 舊版標示 SVG（含 load-zones／energy-systems／hr-zones）
  assets/anatomy/          # 真實解剖圖＋中文標註（OpenStax／BodyParts3D）
  assets/anim/             # 關節動作 SVG 動畫＋3D 三平面
  README.md
```

## 如何開啟

```bash
python3 -m http.server 8080 --directory /workspace/b-coach-study
```

瀏覽器：http://127.0.0.1:8080/  
> 請勿直接用 `file://` 開 HTML（部分瀏覽器會擋 `fetch` JSON）。

## 資料說明

- 卡片 `level`: `"basic"`｜`"exam"`；新手路徑與預設翻卡只抽 basic  
- 肌群原「起點／止點」卡已拆成：功能卡（basic）＋起止點卡（exam）  
- 模擬題依公開簡章範圍與專業常識**改寫**，非官方原題逐字重製  
- 骨骼關卡／速記整合 World Gym《解剖學－骨骼》（標籤：WG 骨骼影片）；肩關節肌肉關卡整合《解剖學－肩關節(盂肱關節) 相關肌肉》https://youtu.be/peNIQZLRVCU（標籤：WG 肩關節影片）；肩帶關卡整合《解剖學－肩關節(肩帶) 相關肌肉》https://youtu.be/X3W2T2ytnqk（標籤：WG 肩帶影片）；肘腕關卡整合《解剖學－肘關節、腕關節 相關肌肉》https://youtu.be/_GxbODgJwa4（標籤：WG 肘腕影片）；脊椎核心關卡整合《解剖學－脊椎 相關肌肉》https://youtu.be/QY4qsNtBnX8（標籤：WG 脊椎影片）；髖關節關卡整合《解剖學－髖關節 相關肌肉》https://youtu.be/qwO0Q0W4k54（標籤：WG 髖關節影片）；**L17 關節動作對照**對齊學科講義 p.73–74「四. 關節動作與肌肉」（標籤：對講義／講義動作）  

## 重跑解析（可選）

```bash
python3 /workspace/b-coach-study/parse_cards.py
python3 /workspace/b-coach-study/parse_exam.py
# 若重新 parse 卡片後需再補新手欄位：
python3 /workspace/b-coach-study/scripts/enrich_cards.py
```

## 成功標準自檢

- [x] 首頁明顯「新手從這開始」  
- [x] 引導關：先課文再小練習  
- [x] 基礎卡白話／level；進階內容仍保留  
- [x] 速記法列表＋課文／翻卡／解析顯示  
- [x] 考過的人這樣說／必背重點（高中優先）
- [x] 名詞小辭典（新手白話・可點課文名詞）  
- [x] 練習模式可看提示、答錯看解析  
- [x] 進度可保存（路徑、SRS、錯題本 → localStorage）

## 參考來源

公開網頁清單與一句說明見 [`data/sources.md`](data/sources.md)（含考照心得來源）。速記／課文／必背重點為概念改寫，非 verbatim 轉貼；模擬題非官方考古原文。


## 圖解庫（2026-10-08 新增）
- 首頁「🖼️ 圖解庫」：依部位分組（平面／肩／肘前臂／脊柱核心／髖／膝踝／訓練科學），可依類型篩選（動畫／真實解剖／示意圖），點圖會開啟可縮放的燈箱（100–300%、雙指縮放、點兩下切換）。
- `assets/anatomy/`：17 張真實解剖圖，加中文標註（15 張 OpenStax，CC BY 4.0；2 張 BodyParts3D 肩胛骨，CC BY-SA 2.1 JP）。授權與署名見 `data/sources.md`，每張圖說下方也有小字署名。
- `assets/anim/`：18 個 SVG 動畫（17 個關節動作＋3D 三平面）。淡灰＝起始姿勢、彩色箭頭＝動作方向，並標關節・平面・主力肌。有 ⏸／▶ 鍵；系統開啟「減少動態效果」時，動畫會停在動作最大的那一格；捲出畫面的動畫會自動暫停。
- `data/figures.json`：圖片清單。執行 `python3 scripts/add_figures.py` 會重建清單，並把圖掛到課文（`figures`）和名詞（`figures`，最多 3 張新圖）。
- `js/figures.js`：讓動畫可以 inline 播放／暫停，提供燈箱和圖解庫。

## 圖解（標示 SVG）
`assets/diagrams/`：肩峰／喙突／盂窩／肩胛棘、三平面、肩帶 vs 肩關節、**肩帶六動作**、**肩關節八動作**、肘前臂、髖、脊柱核心、膝踝、側平舉、推拉、深蹲。課文 `figures` 與辭典 `diagram` 會顯示；L20／L19 等關打開即可看到。

## L18 常見動作怎麼做（新手）
側平舉、前平舉、肩推、臥推、夾胸、划船、下拉／引體、彎舉、三頭、深蹲、硬舉、弓步、臀橋、腿推、反向飛鳥、提踵：白話步驟＋關節／平面／動作名＋主力肌＋易錯。路徑步驟 s2h；辭典分類「訓練動作」。

## L19 肩膀骨頭摸得到哪（新手觸診）
肩胛棘（背後橫脊）、盂窩（外側淺碗）、喙突（前方鳥嘴）、肩峰（外側屋簷）：每個有白話位置、怎麼自己摸、形狀比喻、肌／動作連結、易混。並含鎖骨、喙肩弓、肩鎖／胸鎖、盂唇。路徑在 L11 之後（s1c）；辭典＋卡片＋速記＋問教練同義詞已接上。


## L20 肩帶 vs 肩關節動作（超細講）

給完全看不懂「上提下壓後縮前引上轉下轉／屈伸外展水平內外轉」的人：每個動作＝白話＋無器材生活示範＋照鏡子＋易混＋主力肌＋圖（`shoulder-girdle-6.svg`、`shoulder-joint-8.svg`）。新手路徑接在 L13 肩帶肌肉後面。

## 新手 UX 改版（2026-10-09）
- 首頁：「▶ 繼續學習」接回上次讀到的課與捲動位置、進度環、今天學了幾項、15 分鐘建議；第一次來有 3 步導覽（設定 Aa 可重看）。
- 底部選單：首頁／學習路徑／練習／圖解／辭典；上方 ‹ 返回（支援手機返回鍵）、🔍 全站搜尋、Aa（字體小/中/大/特大、深淺色）。
- 學習路徑：`lessons.json` → `path.units`（7 單元，先易後難）；步驟 id 不變，舊進度相容。重跑：`python3 scripts/add_ux_fields.py`（也寫入每課 `keyPoint`、`prereqTerms`）。
- 課文：一句話重點、先懂這些詞、目錄、長段自動切塊＋標籤列、圖放在對應段落後、我懂了／還不懂、上一課／下一課、閱讀進度條。
- 名詞：點底線詞跳出小卡（不換頁），同一詞只標第一次。
- 練習：答錯顯示原因＋圖＋「回課文看這段」；「只出我學過的課」篩選。
- 新增 localStorage `bcs_ux_v1`（導覽、字體、讀過的課、上次位置、每日活動）；原有 key 不變。
- 新檔：`js/ux.js`（導覽、設定、搜尋）。稽核報告：`/workspace/figwork/ux-audit.md`。

## 問教練 AI 設定（選用・自備 Gemini 金鑰，2026-10-09c）
- 問教練右上 **⚙️** → 「AI 設定」：貼上 Gemini API 金鑰 →「儲存」→「測試」。開關「用 AI 回答」可隨時關閉；可選模型（預設 `gemini-2.5-flash`，404 時自動改用 `gemini-2.0-flash` → `gemini-1.5-flash`）。
- 免費金鑰：<https://aistudio.google.com/apikey>（Google 帳號登入 → Create API key → 複製 AIza 開頭那串）。
- 流程（RAG）：先用站內檢索（辭典／課文／卡片／速記／考過的人說）取前 6 段、約 3500 字內，連同最近 6 則對話送到 Gemini `generateContent`；回答用安全 markdown 顯示（先 escape，只支援粗體／條列／換行），下方保留站內相關連結與「AI 回答，可能有錯，考試以講義為準」。
- 課文「🤔 還不懂 → 問教練」會附上該課內容；練習解析「問教練這題」會附上題目、選項、正確答案、解析。
- 金鑰錯誤（400/403）、額度用完（429）、斷網、逾時（25 秒）、安全阻擋時，顯示中文提示並**自動改用站內回答**。沒有金鑰＝跟以前一樣的站內回答。
- **隱私**：網站與 repo 內**沒有任何金鑰**。金鑰只存在使用者自己瀏覽器的 `localStorage`（`bcs_gemini_key`；另有 `bcs_gemini_model`、`bcs_ai_on`），以 `x-goog-api-key` 標頭直接傳給 `generativelanguage.googleapis.com`，不經本站伺服器、不寫入 console。不要在公用電腦儲存；按「清除」即刪除。免費版提問可能被 Google 用於改善模型，勿輸入個資。
- 程式：`js/coach-chat.js`（`buildGeminiRequest`、`callGemini`、`renderSafeMarkdown`；測試入口 `BCoachChat._ai`）。
