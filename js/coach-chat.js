/* B Coach Study — 站內教練聊天（純前端檢索，無外部 LLM） */
(function () {
  "use strict";

  const SUGGESTIONS = [
    "HRR 怎麼算？",
    "FITT-VP 是什麼？",
    "肌肥大做幾下？",
    "三大能量系統差在哪？",
    "肩帶跟肩關節差在哪？",
    "後縮是什麼？",
    "內轉外轉怎麼做？",
    "側平舉怎麼做？",
    "肩峰在哪？",
  ];

  /** 同義／別名擴展：查詢命中這些詞時一併搜尋 */
  const SYNONYMS = {
    髖: ["髖關節", "髖屈", "髖伸", "臀"],
    髖關節: ["髖", "髖屈", "髖伸"],
    縫匠: ["縫匠肌", "sartorius", "盤腿", "最長肌", "鵝足"],
    縫匠肌: ["縫匠", "sartorius", "盤腿", "最長肌"],
    股直: ["股直肌", "rectus", "雙關節", "股四"],
    股直肌: ["股直", "rectus", "雙關節", "股四頭"],
    股四: ["股四頭", "股直肌", "vastus"],
    股四頭: ["股四", "股直肌"],
    tfl: ["闊筋膜張肌", "髂脛束", "ITB", "ITBS"],
    闊筋膜張肌: ["TFL", "髂脛束", "ITBS"],
    itb: ["髂脛束", "TFL", "ITBS", "外側膝"],
    itbs: ["髂脛束", "TFL", "ITB", "外側膝痛"],
    髂脛束: ["ITB", "ITBS", "TFL"],
    梨狀: ["梨狀肌", "坐骨神經", "紅旗", "椎間盤"],
    梨狀肌: ["梨狀", "坐骨神經", "紅旗"],
    臀中: ["臀中肌", "外展", "骨盆穩定", "挺度"],
    臀中肌: ["臀中", "外展", "挺度"],
    臀大: ["臀大肌", "維度", "髖伸"],
    臀大肌: ["臀大", "維度", "髖伸"],
    q角: ["Q角", "Q 角", "膝蓋", "骨盆"],
    "q 角": ["Q角", "Q角", "膝蓋"],
    "q角": ["Q角", "Q 角"],
    平面: ["矢狀", "額狀", "水平", "橫切"],
    矢狀: ["矢狀面", "前後", "屈伸"],
    矢狀面: ["矢狀", "前後"],
    額狀: ["額狀面", "冠狀", "外展內收"],
    額狀面: ["額狀", "冠狀面"],
    水平面: ["水平", "橫切面", "旋轉"],
    sits: ["旋轉肌群", "棘上", "棘下", "小圓", "肩胛下"],
    旋轉肌群: ["SITS", "棘上", "棘下"],
    核心: ["腹橫", "多裂", "豎脊", "脊椎"],
    髂腰: ["髂腰肌", "腰大肌", "髖屈"],
    髂腰肌: ["髂腰", "腰大肌", "髖屈"],
    鵝足: ["縫匠", "半腱", "股薄"],
    下交叉: ["下交叉症候群", "髖屈肌", "股直"],
    上交叉: ["上交叉症候群", "胸小", "斜方"],
    內旋: ["internal rotation", "medial rotation", "內轉"],
    外旋: ["external rotation", "lateral rotation", "外轉"],
    屈曲: ["屈", "flexion"],
    伸展: ["伸", "extension"],
    外展: ["abduction"],
    內收: ["adduction"],

    旋前: ["pronation", "倒水", "掌心朝下", "旋前圓", "旋前方"],
    旋後: ["supination", "托碗", "掌心朝上", "旋後肌"],
    背屈: ["dorsiflexion", "勾腳尖", "腳尖抬頭", "脛骨前", "足背屈"],
    跖屈: ["plantarflexion", "踮腳", "腳尖點地", "蹠屈", "腓腸", "比目魚"],
    蹠屈: ["plantarflexion", "跖屈", "踮腳", "腳尖點地"],
    肩帶: ["肩胛", "斜方", "前鋸", "菱形", "提肩胛", "上轉", "下轉", "後縮", "前引", "上提", "下壓", "L20"],
    肩關節: ["盂肱", "肱骨", "三角肌", "棘上", "水平內收", "盂窩", "肩峰", "屈曲", "外展", "內轉", "L20"],
    上提: ["聳肩", "elevation", "肩帶上提", "提肩", "L20"],
    聳肩: ["上提", "提肩", "肩帶上提"],
    下壓: ["沉肩", "depression", "肩帶下壓", "L20"],
    沉肩: ["下壓", "肩帶下壓"],
    後縮: ["夾背", "肩帶內收", "retraction", "菱形", "斜方中", "L20"],
    夾背: ["後縮", "肩帶內收", "retraction"],
    前引: ["擁抱前伸", "肩帶外展", "protraction", "前鋸", "L20"],
    擁抱: ["前引", "肩帶外展"],
    上轉: ["上旋", "舉手開門", "upward rotation", "L20"],
    下轉: ["下旋", "放下關門", "downward rotation", "L20"],
    舉手開門: ["上轉", "上旋"],
    放下關門: ["下轉", "下旋"],
    L20: ["肩帶", "肩關節", "後縮", "前引", "上轉", "超細講"],
    超細講: ["L20", "肩帶", "肩關節"],
    內轉: ["內旋", "internal rotation", "medial rotation"],
    外轉: ["外旋", "external rotation", "lateral rotation"],
    水平內收: ["夾胸", "horizontal adduction", "胸大"],
    水平外展: ["反向飛鳥", "horizontal abduction", "三角後"],
    側屈: ["側彎", "腰方肌", "lateral flexion"],
    六條外轉: ["六條外轉肌", "閉孔", "孖肌", "梨狀", "股方", "外轉六兄弟"],
    六條外轉肌: ["閉孔內", "閉孔外", "上孖", "下孖", "梨狀", "股方"],
    對講義: ["講義動作", "關節動作", "L17"],
    講義: ["對講義", "關節動作對照"],

    側平舉: ["側舉", "lateral raise", "肩外展", "中三角", "棘上", "L18"],
    側舉: ["側平舉", "lateral raise", "肩外展"],
    前平舉: ["前舉", "front raise", "肩屈曲", "前三角", "L18"],
    肩推: ["過頭推", "overhead press", "OHP", "垂直推", "L18"],
    過頭推: ["肩推", "OHP"],
    臥推: ["槓鈴臥推", "胸推", "bench press", "水平推", "L18"],
    夾胸: ["飛鳥", "chest fly", "水平內收", "L18"],
    划船: ["row", "坐姿划船", "水平拉", "夾背", "L18"],
    下拉: ["滑輪下拉", "lat pulldown", "引體", "引體向上", "垂直拉", "L18"],
    引體: ["引體向上", "下拉", "滑輪下拉"],
    彎舉: ["二頭彎舉", "curl", "肘屈", "L18"],
    二頭彎舉: ["彎舉", "curl"],
    三頭伸展: ["三頭下壓", "過頭三頭", "肘伸", "L18"],
    深蹲: ["squat", "徒手深蹲", "L18"],
    硬舉: ["deadlift", "髖鉸鏈", "鉸鏈", "L18"],
    弓步: ["分腿蹲", "lunge", "L18"],
    臀橋: ["橋式", "glute bridge", "L18"],
    腿推: ["腿部推舉", "leg press", "L18"],
    反向飛鳥: ["後束飛鳥", "reverse fly", "水平外展", "L18"],
    提踵: ["踮腳", "calf raise", "蹠屈", "L18"],
    常見動作: ["怎麼做", "動作教學", "L18", "側平舉"],
    動作教學: ["常見動作", "怎麼做", "L18"],
    L18: ["常見動作", "側平舉", "動作教學"],

    肩胛棘: ["肩胛骨棘", "spine of scapula", "橫脊", "背後橫杠", "L19"],
    肩胛骨棘: ["肩胛棘", "橫脊"],
    盂窩: ["關節盂", "glenoid", "淺碗", "盂肱", "L19"],
    關節盂: ["盂窩", "glenoid", "淺碗"],
    喙突: ["coracoid", "鳥嘴", "烏喙突", "胸小", "L19"],
    肩峰: ["acromion", "屋簷", "帽簷", "肩峰下", "L19"],
    肩峰下: ["夾擠", "喙肩弓", "棘上", "肩峰"],
    喙肩弓: ["coracoacromial", "拱門", "肩峰", "喙突", "夾擠"],
    肩胛骨: ["肩胛", "scapula", "肩胛棘", "盂窩", "喙突", "肩峰", "L19"],
    鎖骨: ["clavicle", "衣架", "肩鎖", "胸鎖", "L19"],
    肩鎖: ["AC", "肩鎖關節", "肩峰", "鎖骨"],
    肩鎖關節: ["AC", "肩鎖", "acromioclavicular"],
    胸鎖: ["SC", "胸鎖關節", "鎖骨"],
    胸鎖關節: ["SC", "胸鎖", "sternoclavicular"],
    盂唇: ["labrum", "杯緣", "盂窩"],
    肱骨頭: ["humeral head", "球頭", "盂窩"],
    觸診: ["怎麼摸", "摸得到", "L19", "肩峰", "喙突"],
    怎麼摸: ["觸診", "L19", "肩峰", "喙突", "肩胛棘"],
    屋簷: ["肩峰", "acromion"],
    鳥嘴: ["喙突", "coracoid"],
    淺碗: ["盂窩", "關節盂"],
    橫脊: ["肩胛棘", "背後橫杠"],
    L19: ["肩膀骨頭", "肩峰", "喙突", "盂窩", "肩胛棘", "觸診"],
    肩膀骨頭: ["L19", "肩峰", "喙突", "摸得到"],

    // ── L21–L24 WG 肌能訓練＋FITT-VP ──
    "1rm": ["1RM", "%1RM", "只能舉起 1 下", "RM", "L21"],
    rm: ["1RM", "%1RM", "最大反覆次數", "RM（最大反覆次數）"],
    "%1rm": ["1RM", "負荷設定", "L21"],
    最大反覆: ["1RM", "RM"],
    負荷: ["負荷設定", "%1RM", "1RM", "L21"],
    負荷設定: ["%1RM", "1–6", "7–12", "12–15", "L21"],
    做幾下: ["負荷設定", "1–6 力", "7–12 大", "12–15 耐", "%1RM", "L21"],
    幾下: ["負荷設定", "%1RM", "L21"],
    肌肥大: ["7–12", "肌肥大", "hypertrophy", "負荷設定", "L21"],
    增肌: ["肌肥大", "7–12", "L21"],
    肌耐力: ["12–15", "肌耐力", "L21"],
    肌力: ["1–6", "肌力", "1RM", "L21"],
    機械張力: ["低速度、高重量", "張力", "L21"],
    代謝壓力: ["乳酸", "代謝", "L21"],
    神經適應: ["神經學效能", "運動單位", "徵召", "L21"],
    神經學效能: ["神經適應", "運動單位"],
    運動單位: ["神經適應", "徵召"],
    七因素: ["7 因素", "影響肌力", "L21"],
    "7因素": ["7 因素", "影響肌力", "訓練強度", "身體比例", "激素水準"],
    阻力訓練優點: ["阻力訓練 5 大優點", "力、骨、防、糖、瘦"],
    體適能: ["健康體適能", "競技體適能", "心力耐柔組", "L22"],
    健康體適能: ["心力耐柔組", "身體組成", "L22"],
    競技體適能: ["敏協平、速爆反", "爆發力", "反應時間", "L22"],
    能量系統: ["磷酸肌酸", "糖解", "有氧系統", "磷快、糖中、氧慢久", "L22"],
    三大能量: ["能量系統", "磷酸肌酸", "糖解", "有氧"],
    磷酸肌酸: ["ATP-CP", "ATP-PC", "100m", "能量系統"],
    "atp-cp": ["磷酸肌酸", "ATP-PC"],
    "atp-pc": ["磷酸肌酸", "ATP-CP"],
    atp: ["ATP", "磷酸肌酸", "能量系統"],
    糖解: ["醣解", "肝醣", "血糖", "乳酸", "400m"],
    醣解: ["糖解", "肝醣", "乳酸"],
    肝醣: ["糖解", "肌醣"],
    乳酸: ["糖解", "無氧閾值", "代謝壓力"],
    有氧: ["有氧系統", "有氧 vs 無氧"],
    無氧: ["有氧 vs 無氧", "磷酸肌酸", "糖解"],
    心率: ["MHR", "HRR", "RHR", "THR", "心率區間", "L23"],
    心跳: ["心率", "bpm"],
    mhr: ["最大心率", "220−年齡", "220 − 年齡", "L23"],
    最大心率: ["MHR", "220 − 年齡", "心率區間"],
    hrr: ["儲備心率", "可動用心率", "MHR − RHR", "L23"],
    儲備心率: ["HRR", "可動用心率", "MHR − RHR"],
    變大: ["肌肥大", "7–12", "L21"],
    爆發力: ["競技體適能", "爆發力"],
    rhr: ["安靜心率", "Resting"],
    安靜心率: ["RHR", "Resting"],
    thr: ["目標心率", "Karvonen", "先減、再乘、最後加回"],
    目標心率: ["THR", "Karvonen", "HRR × 強度% ＋ RHR"],
    karvonen: ["儲備心率法", "目標心率", "HRR", "THR"],
    怎麼算: ["計算", "公式", "Karvonen", "%1RM"],
    計算: ["計算題", "Karvonen", "220 − 年齡", "1RM × 百分比"],
    公式: ["Karvonen", "220 − 年齡", "HRR", "計算題"],
    "220": ["最大心率", "MHR", "220 − 年齡"],
    心率區間: ["有氧耐力", "有氧動力", "最大效能", "速度", "%MHR"],
    無氧閾值: ["最大效能", "85–95%", "乳酸"],
    最大攝氧量: ["VO2max", "攝氧量", "速度區"],
    vo2max: ["最大攝氧量", "攝氧量"],
    間歇: ["間歇訓練", "HIIT", "速度區"],
    需求分析: ["客戶需求", "傷病史", "體適能水準與訓練經驗", "L24"],
    傷病史: ["需求分析"],
    運動處方: ["FITT-VP", "需求分析", "L24"],
    fittvp: ["FITT-VP", "頻率", "強度", "總量", "進展", "L24"],
    "fitt-vp": ["FITT-VP", "幾次、多用力、多久、練什麼、總共、怎麼加", "L24"],
    fitt: ["FITT-VP", "頻率", "強度", "類型", "L24"],
    頻率: ["FITT-VP", "頻率（F）", "每週"],
    總量: ["總量（V）", "組 × 次 × 重量", "150 分鐘", "1000 大卡"],
    進展: ["進展／進階（P）", "4～6 週", "48 小時"],
    進階: ["進展／進階（P）", "FITT-VP"],
    類型: ["類型／模式（T）", "FITT-VP"],
    模式: ["類型／模式（T）", "FITT-VP"],
    "150分鐘": ["每週 1000 大卡或 150 分鐘", "心肺"],
    大卡: ["1000 大卡", "kcal"],
    "48小時": ["同一肌群", "阻力", "48 小時"],
    休息多久: ["48 小時", "同一肌群", "恢復"],
    多久練一次: ["頻率", "每週 2–3 次", "48 小時"],
    伸展多久: ["靜態伸展", "10–30 秒", "30–60 秒", "60 秒"],
    撐多久: ["靜態伸展", "伸展多久", "10–30 秒", "30–60 秒"],
    撐幾秒: ["靜態伸展", "伸展多久", "10–30 秒"],
    靜態伸展: ["10–30 秒", "老年人 30–60 秒", "每個部位 60 秒"],
    柔軟度: ["靜態伸展", "10–30 秒", "FITT-VP"],
    神經動作: ["神經動作訓練", "平衡", "協調"],
    肌能訓練: ["肌力", "能量系統", "L21", "L22"],

    辭典: ["名詞", "名詞小辭典", "glossary"],
  };

  let api = null;
  let open = false;
  let els = {};

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[？?！!。，,、．.：:；;（）()【】\[\]「」『』""'']/g, "");
  }

  /** 問句常見虛詞 n-gram：不拿來比對，避免雜訊 */
  const ZH_STOP = new Set([
    "什麼", "是什", "是什麼", "麼是", "怎麼", "怎麼做", "怎麼算", "麼做", "麼算", "麼辦", "怎麼辦",
    "有哪", "哪些", "有哪些", "哪一", "一種", "哪一種", "在哪", "要練", "練多", "多少", "要練多",
    "一下", "可以", "請問", "我不", "不懂", "的是", "是不", "不是", "屬於", "於哪", "差在", "在哪裡",
    "為什", "為什麼", "麼會", "嗎",
  ]);

  /** 中英混合切詞：連續中文 1～3 字 n-gram + 英文／數字詞 */
  function tokenize(query) {
    const raw = String(query || "").trim();
    if (!raw) return [];
    const tokens = new Set();
    const lower = raw.toLowerCase();
    // English / alphanumeric words
    (lower.match(/[a-z0-9]+/g) || []).forEach((w) => {
      if (w.length >= 2) tokens.add(w);
    });
    // Chinese runs
    // 只留中日韓漢字連續段（舊版 \W 會把中文全部當成符號刪掉，導致純中文問句切不出詞）
    const zh = raw.replace(/[^\u3400-\u9fff\uf900-\ufaff]+/g, " ");
    zh.split(/\s+/).forEach((run) => {
      if (!run) return;
      if (run.length <= 4) tokens.add(run);
      for (let n = 2; n <= 3; n++) {
        for (let i = 0; i + n <= run.length; i++) {
          const g = run.slice(i, i + n);
          if (!ZH_STOP.has(g)) tokens.add(g);
        }
      }
      // also single chars for rare terms if run short
      if (run.length <= 3) {
        for (const ch of run) tokens.add(ch);
      }
    });
    // full normalized query
    const nq = normalize(raw);
    if (nq.length >= 2) tokens.add(nq);

    // synonym expansion
    const expanded = new Set(tokens);
    tokens.forEach((t) => {
      const key = t.toLowerCase();
      const syns = SYNONYMS[key] || SYNONYMS[t];
      if (syns) syns.forEach((s) => expanded.add(normalize(s) || s.toLowerCase()));
    });
    // also check original query against synonym keys
    Object.keys(SYNONYMS).forEach((k) => {
      if (nq.includes(normalize(k)) || lower.includes(k.toLowerCase())) {
        SYNONYMS[k].forEach((s) => expanded.add(normalize(s) || s.toLowerCase()));
        expanded.add(normalize(k) || k.toLowerCase());
      }
    });

    return [...expanded].filter((t) => t && t.length >= 1);
  }

  function scoreText(blob, tokens, weight) {
    if (!blob || !tokens.length) return 0;
    const b = normalize(blob);
    const bLower = String(blob).toLowerCase();
    let score = 0;
    tokens.forEach((t) => {
      if (!t) return;
      const tn = normalize(t);
      if (tn.length >= 2 && b.includes(tn)) {
        // longer matches worth more
        score += weight * (1 + Math.min(3, tn.length) * 0.35);
        // title-ish exact-ish bonus if short blob
        if (b.length < 40 && b.includes(tn)) score += weight * 0.5;
      } else if (t.length >= 2 && bLower.includes(t.toLowerCase())) {
        score += weight * 0.8;
      }
    });
    return score;
  }

  function getState() {
    return api && typeof api.getState === "function" ? api.getState() : null;
  }

  function search(query) {
    const st = getState();
    if (!st) return [];
    const tokens = tokenize(query);
    if (!tokens.length) return [];

    const hits = [];

    (st.cards || []).forEach((c) => {
      let s = 0;
      s += scoreText(c.q, tokens, 3.2);
      s += scoreText(c.a, tokens, 2.2);
      s += scoreText(c.plain, tokens, 2.8);
      s += scoreText((c.tags || []).join(" "), tokens, 2.4);
      s += scoreText(c.chapter, tokens, 1.2);
      s += scoreText(c.mnemonic, tokens, 1.8);
      if (c.highYield) s *= 1.08;
      if (s > 0) {
        hits.push({
          kind: "card",
          id: c.id,
          score: s,
          title: c.q,
          plain: c.plain || "",
          answer: c.a || "",
          chapter: c.chapter || "",
          mnemonicId: c.mnemonicId || null,
          mnemonic: c.mnemonic || "",
          lessonId: null,
        });
      }
    });

    (st.lessons || []).forEach((l) => {
      let s = 0;
      s += scoreText(l.title, tokens, 4.5);
      s += scoreText(l.summary, tokens, 3.2);
      s += scoreText((l.body || []).join("\n"), tokens, 2.6);
      s += scoreText((l.keywords || []).join(" "), tokens, 3.0);
      s += scoreText((l.pitfalls || []).join(" "), tokens, 2.4);
      s += scoreText((l.tags || []).join(" "), tokens, 2.0);
      if (l.highYield) s *= 1.1;
      if (s > 0) {
        hits.push({
          kind: "lesson",
          id: l.id,
          score: s + 1.5, // prefer lessons slightly for teaching
          title: l.title,
          summary: l.summary || "",
          body: l.body || [],
          pitfalls: l.pitfalls || [],
          mnemonicIds: l.mnemonicIds || [],
          keywords: l.keywords || [],
        });
      }
    });

    (st.mnemonics || []).forEach((m) => {
      let s = 0;
      s += scoreText(m.title, tokens, 4.2);
      s += scoreText(m.trick, tokens, 3.5);
      s += scoreText(m.detail, tokens, 2.8);
      s += scoreText((m.tags || []).join(" "), tokens, 2.6);
      if (m.highYield) s *= 1.12;
      if (s > 0) {
        hits.push({
          kind: "mnemonic",
          id: m.id,
          score: s + 0.8,
          title: m.title,
          trick: m.trick || "",
          detail: m.detail || "",
          tags: m.tags || [],
        });
      }
    });

    (st.glossary || []).forEach((g) => {
      let s = 0;
      s += scoreText(g.term, tokens, 8.5); // HIGH: prefer glossary for "X是什麼"
      s += scoreText((g.aliases || []).join(" "), tokens, 6.5);
      s += scoreText(g.oneLiner, tokens, 3.5);
      s += scoreText((g.explain || []).join("\n"), tokens, 2.8);
      s += scoreText(g.example, tokens, 2.2);
      s += scoreText(g.category, tokens, 1.5);
      // definition-style query bonus
      const nq = normalize(query);
      if (
        nq.includes("是什麼") ||
        nq.includes("什麼是") ||
        nq.includes("意思") ||
        nq.includes("解釋") ||
        nq.includes("差在") ||
        nq.includes("跟") ||
        nq.includes("和")
      ) {
        if (normalize(g.term) && nq.includes(normalize(g.term))) s += 12;
        (g.aliases || []).forEach((a) => {
          const na = normalize(a);
          if (na.length >= 2 && nq.includes(na)) s += 8;
        });
      }
      // exact term contained in query
      const nt = normalize(g.term);
      if (nt.length >= 2 && nq.includes(nt)) s += 10;
      if (g.highYield) s *= 1.08;
      if (s > 0) {
        hits.push({
          kind: "glossary",
          id: g.id,
          score: s + 3.5, // boost over cards/lessons for noun questions
          title: g.term,
          oneLiner: g.oneLiner || "",
          explain: g.explain || [],
          example: g.example || "",
          aliases: g.aliases || [],
          relatedIds: g.relatedIds || [],
          lessonIds: g.lessonIds || [],
          mnemonicIds: g.mnemonicIds || [],
          category: g.category || "",
        });
      }
    });

    (st.examFocus || []).forEach((e) => {
      let s = 0;
      s += scoreText(e.title, tokens, 3.8);
      s += scoreText(e.why, tokens, 2.6);
      s += scoreText((e.topics || []).join(" "), tokens, 2.8);
      s += scoreText((e.pitfalls || []).join(" "), tokens, 2.2);
      if (e.priority === "高") s *= 1.1;
      if (s > 0) {
        hits.push({
          kind: "exam",
          id: e.id,
          score: s + 0.5,
          title: e.title,
          why: e.why || "",
          pitfalls: e.pitfalls || [],
          lessonIds: e.lessonIds || [],
          mnemonicIds: e.mnemonicIds || [],
          priority: e.priority || "",
        });
      }
    });

    hits.sort((a, b) => b.score - a.score);
    // diversify: best overall, then best of other kinds (if score decent)
    const out = [];
    const seen = new Set();
    const push = (h) => {
      if (!h) return;
      const key = h.kind + ":" + h.id;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(h);
    };
    if (hits[0]) push(hits[0]);
    ["glossary", "lesson", "mnemonic", "exam", "card"].forEach((kind) => {
      if (out.length >= 5) return;
      const h = hits.find((x) => x.kind === kind && x.score >= 8);
      push(h);
    });
    for (const h of hits) {
      if (out.length >= 5) break;
      push(h);
    }
    return out;
  }

  function pickBest(hits) {
    // drop weak noise (common bigrams / short token collisions)
    hits = (hits || []).filter((h) => h.score >= 8);
    if (!hits.length) return { strong: false, hits: [] };
    const top = hits[0];
    const strong = top.score >= 12;
    return { strong: strong, hits: hits };
  }

  function shortParagraphs(texts, max) {
    const paras = [];
    for (const t of texts) {
      if (!t) continue;
      const clean = String(t).trim();
      if (!clean) continue;
      paras.push(clean);
      if (paras.length >= max) break;
    }
    return paras;
  }

  function buildAnswer(query, result) {
    const { strong, hits } = result;
    if (!hits.length) {
      return {
        html:
          "<p>站內資料裡還沒找到很準的答案～</p>" +
          "<p>你可以去「📘 名詞小辭典」、「💡 速記法」或「📖 先看觀念」搜尋關鍵字，或換個說法再問我（例如肌肉名、動作、平面）。</p>" +
          "<p class='coach-hint'>更難／開放的問題，也可以回 Grok Bot 找 <strong>健身🏋️</strong> 問喔。</p>",
        links: [
          { kind: "view", view: "glossary", label: "打開名詞小辭典" },
          { kind: "view", view: "mnemonics", label: "打開速記法" },
          { kind: "view", view: "lessons", label: "打開先看觀念" },
        ],
      };
    }

    if (!strong) {
      const closest = hits.slice(0, 3);
      return {
        html:
          "<p>站內資料沒找到很準的對應，這些比較接近，點進去看看：</p>",
        links: closest.map((h) => ({
          kind: h.kind,
          id: h.id,
          label:
            (h.kind === "glossary"
              ? "📘 "
              : h.kind === "lesson"
              ? "📖 "
              : h.kind === "mnemonic"
              ? "💡 "
              : h.kind === "exam"
              ? "🎯 "
              : "🃏 ") + (h.title.length > 28 ? h.title.slice(0, 28) + "…" : h.title),
        })),
        footer:
          "<p class='coach-hint'>也可以去速記法／先看觀念搜尋，或回 Grok Bot 找健身🏋️。</p>",
      };
    }

    // Strong hit — synthesize from top 1–2 related
    const primary = hits[0];
    const parts = [];
    const links = [];
    const pitfalls = [];
    let mnemonicLine = "";

    if (primary.kind === "glossary") {
      parts.push(
        "<p><strong>" +
          escapeHtml(primary.title) +
          "</strong>" +
          (primary.category
            ? ' <span class="coach-muted">（' +
              escapeHtml(primary.category) +
              "）</span>"
            : "") +
          "</p>"
      );
      if (primary.oneLiner) {
        parts.push("<p>" + escapeHtml(primary.oneLiner) + "</p>");
      }
      shortParagraphs(primary.explain, 3).forEach((p) => {
        parts.push("<p>" + escapeHtml(p) + "</p>");
      });
      if (primary.example) {
        parts.push(
          "<p class='coach-mnemonic'>例子：" +
            escapeHtml(primary.example) +
            "</p>"
        );
      }
      links.push({
        kind: "glossary",
        id: primary.id,
        label: "📘 打開名詞：" + primary.title,
      });
      (primary.relatedIds || []).slice(0, 2).forEach((rid) => {
        const rt = api.getTerm && api.getTerm(rid);
        if (rt)
          links.push({
            kind: "glossary",
            id: rid,
            label: "📘 " + rt.term,
          });
      });
      (primary.lessonIds || []).slice(0, 1).forEach((lid) => {
        const les = api.getLesson && api.getLesson(lid);
        if (les)
          links.push({
            kind: "lesson",
            id: lid,
            label: "📖 " + les.title,
          });
      });
      (primary.mnemonicIds || []).slice(0, 1).forEach((mid) => {
        const m = api.getMnemonic && api.getMnemonic(mid);
        if (m) {
          mnemonicLine = m.trick;
          links.push({
            kind: "mnemonic",
            id: mid,
            label: "💡 " + m.title,
          });
        }
      });
    } else if (primary.kind === "lesson") {
      parts.push(
        "<p><strong>" +
          escapeHtml(primary.title) +
          "</strong> —— " +
          escapeHtml(primary.summary || "來看這課的重點：") +
          "</p>"
      );
      shortParagraphs(primary.body, 2).forEach((p) => {
        parts.push("<p>" + escapeHtml(p) + "</p>");
      });
      (primary.pitfalls || []).slice(0, 2).forEach((x) => pitfalls.push(x));
      links.push({
        kind: "lesson",
        id: primary.id,
        label: "📖 打開課文：" + primary.title,
      });
      (primary.mnemonicIds || []).slice(0, 2).forEach((mid) => {
        const m = api.getMnemonic && api.getMnemonic(mid);
        if (m) {
          if (!mnemonicLine) mnemonicLine = m.trick;
          links.push({
            kind: "mnemonic",
            id: mid,
            label: "💡 " + m.title,
          });
        }
      });
    } else if (primary.kind === "mnemonic") {
      parts.push(
        "<p><strong>" +
          escapeHtml(primary.title) +
          "</strong></p>"
      );
      parts.push(
        "<p>💡 <em>" + escapeHtml(primary.trick) + "</em></p>"
      );
      if (primary.detail) {
        parts.push("<p>" + escapeHtml(primary.detail) + "</p>");
      }
      mnemonicLine = ""; // already shown as trick
      links.push({
        kind: "mnemonic",
        id: primary.id,
        label: "💡 打開速記：" + primary.title,
      });
      const relLes = hits.find((h) => h.kind === "lesson");
      if (relLes) {
        links.push({
          kind: "lesson",
          id: relLes.id,
          label: "📖 " + relLes.title,
        });
        // only pull pitfalls when lesson is a strong match (avoid unrelated tips)
        if (relLes.score >= 40) {
          (relLes.pitfalls || []).slice(0, 2).forEach((x) => {
            if (pitfalls.length < 2) pitfalls.push(x);
          });
        }
      }
    } else if (primary.kind === "exam") {
      parts.push(
        "<p><strong>" +
          escapeHtml(primary.title) +
          "</strong>" +
          (primary.priority ? "（" + escapeHtml(primary.priority) + "優先）" : "") +
          "</p>"
      );
      if (primary.why) parts.push("<p>" + escapeHtml(primary.why) + "</p>");
      (primary.pitfalls || []).slice(0, 2).forEach((x) => pitfalls.push(x));
      links.push({
        kind: "exam",
        id: primary.id,
        label: "🎯 打開必背：" + primary.title,
      });
      (primary.lessonIds || []).slice(0, 1).forEach((lid) => {
        const les = api.getLesson && api.getLesson(lid);
        if (les)
          links.push({
            kind: "lesson",
            id: lid,
            label: "📖 " + les.title,
          });
      });
      (primary.mnemonicIds || []).slice(0, 1).forEach((mid) => {
        const m = api.getMnemonic && api.getMnemonic(mid);
        if (m) {
          mnemonicLine = m.trick;
          links.push({
            kind: "mnemonic",
            id: mid,
            label: "💡 " + m.title,
          });
        }
      });
    } else if (primary.kind === "card") {
      const lead =
        primary.plain ||
        primary.answer ||
        "這張卡的重點如下：";
      parts.push("<p>" + escapeHtml(lead) + "</p>");
      if (primary.answer && primary.plain && primary.answer !== primary.plain) {
        parts.push(
          "<p class='coach-muted'>卡片答案：" +
            escapeHtml(primary.answer) +
            "</p>"
        );
      }
      if (primary.mnemonic) mnemonicLine = primary.mnemonic;
      if (primary.mnemonicId) {
        links.push({
          kind: "mnemonic",
          id: primary.mnemonicId,
          label: "💡 相關速記",
        });
      }
      // link related lesson if any hit in top
      const relatedLesson = hits.find((h) => h.kind === "lesson");
      if (relatedLesson) {
        links.push({
          kind: "lesson",
          id: relatedLesson.id,
          label: "📖 " + relatedLesson.title,
        });
        if (relatedLesson.score >= 40) {
          (relatedLesson.pitfalls || []).slice(0, 2).forEach((x) => {
            if (pitfalls.length < 2) pitfalls.push(x);
          });
        }
      }
      const relatedMn = hits.find(
        (h) => h.kind === "mnemonic" && h.id !== primary.mnemonicId
      );
      if (relatedMn && links.length < 3) {
        if (!mnemonicLine) mnemonicLine = relatedMn.trick;
        links.push({
          kind: "mnemonic",
          id: relatedMn.id,
          label: "💡 " + relatedMn.title,
        });
      }
    }

    // secondary mnemonic tip only when primary was not already a mnemonic
    if (primary.kind !== "mnemonic") {
      const secondary = hits.find(
        (h) => h !== primary && h.kind === "mnemonic" && !mnemonicLine
      );
      if (secondary && secondary.trick) mnemonicLine = secondary.trick;
    }

    if (mnemonicLine) {
      parts.push(
        "<p class='coach-mnemonic'>💡 " + escapeHtml(mnemonicLine) + "</p>"
      );
    }
    if (pitfalls.length) {
      parts.push(
        "<p class='coach-pitfall'>⚠️ 小心：" +
          escapeHtml(pitfalls.slice(0, 2).join("；")) +
          "</p>"
      );
    }

    // dedupe links
    const seenL = new Set();
    const uniqLinks = [];
    links.forEach((l) => {
      const k = l.kind + ":" + (l.id || l.view || l.label);
      if (seenL.has(k)) return;
      seenL.add(k);
      uniqLinks.push(l);
    });

    return {
      html: parts.join("") || "<p>找到相關內容，請點下面連結看完整說明。</p>",
      links: uniqLinks.slice(0, 4),
    };
  }

  function appendMessage(role, html, links, footerHtml) {
    const list = els.messages;
    const div = document.createElement("div");
    div.className = "coach-msg coach-msg-" + role;
    const bubble = document.createElement("div");
    bubble.className = "coach-bubble";
    bubble.innerHTML = html;
    div.appendChild(bubble);

    if (links && links.length) {
      const row = document.createElement("div");
      row.className = "coach-link-row";
      links.forEach((lnk) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "coach-link-btn";
        btn.textContent = lnk.label;
        btn.addEventListener("click", () => {
          followLink(lnk);
        });
        row.appendChild(btn);
      });
      div.appendChild(row);
    }
    if (footerHtml) {
      const foot = document.createElement("div");
      foot.className = "coach-bubble-foot";
      foot.innerHTML = footerHtml;
      div.appendChild(foot);
    }
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
  }

  function followLink(lnk) {
    if (!api) return;
    setOpen(false);
    if (lnk.kind === "glossary" && api.openTerm) api.openTerm(lnk.id, "glossary");
    else if (lnk.kind === "lesson" && api.openLesson) api.openLesson(lnk.id, "home");
    else if (lnk.kind === "mnemonic" && api.openMnemonic)
      api.openMnemonic(lnk.id, "mnemonics");
    else if (lnk.kind === "exam" && api.openExamFocus) api.openExamFocus(lnk.id);
    else if (lnk.kind === "view" && api.showView) {
      if (lnk.view === "mnemonics" && api.openMnemonicsList) {
        api.openMnemonicsList();
      } else if (lnk.view === "lessons" && api.openLessonsList) {
        api.openLessonsList();
      } else if (lnk.view === "glossary" && api.openGlossaryList) {
        api.openGlossaryList();
      } else {
        api.showView(lnk.view);
      }
    }
  }

  function handleSend(text) {
    const q = String(text || "").trim();
    if (!q) return;
    appendMessage("user", "<p>" + escapeHtml(q) + "</p>");
    els.input.value = "";
    autoResize();

    const hits = search(q);
    const result = pickBest(hits);
    const ans = buildAnswer(q, result);
    appendMessage("bot", ans.html, ans.links, ans.footer || "");
  }

  function setOpen(v) {
    open = !!v;
    els.panel.classList.toggle("open", open);
    els.fab.classList.toggle("hidden-fab", open);
    els.fab.setAttribute("aria-expanded", open ? "true" : "false");
    els.panel.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      setTimeout(() => els.input && els.input.focus(), 200);
    }
  }

  function autoResize() {
    const ta = els.input;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(120, ta.scrollHeight) + "px";
  }

  function bindUi() {
    els.fab = document.getElementById("coach-fab");
    els.panel = document.getElementById("coach-panel");
    els.messages = document.getElementById("coach-messages");
    els.input = document.getElementById("coach-input");
    els.send = document.getElementById("coach-send");
    els.close = document.getElementById("coach-close");
    els.chips = document.getElementById("coach-chips");
    if (!els.fab || !els.panel) return;

    els.fab.addEventListener("click", () => setOpen(true));
    els.close.addEventListener("click", () => setOpen(false));
    els.send.addEventListener("click", () => handleSend(els.input.value));
    els.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend(els.input.value);
      }
    });
    els.input.addEventListener("input", autoResize);

    // Escape closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    });

    if (els.chips) {
      els.chips.innerHTML = "";
      SUGGESTIONS.forEach((s) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "coach-chip";
        b.textContent = s;
        b.addEventListener("click", () => {
          handleSend(s);
        });
        els.chips.appendChild(b);
      });
    }

    // welcome
    if (els.messages && !els.messages.children.length) {
      appendMessage(
        "bot",
        "<p>嗨！我是<strong>站內教練</strong>🏋️，會用本站<strong>名詞小辭典</strong>、課文、卡片、速記來回答。</p>" +
          "<p>不懂的詞直接問，例如「內旋是什麼？」「矢狀面」。</p>"
      );
    }
  }

  function initCoachChat(apiObj) {
    api = apiObj || window.BCoach || null;
    bindUi();
  }

  // Expose
  window.initCoachChat = initCoachChat;
  window.BCoachChat = {
    init: initCoachChat,
    search,
    handleSend,
    open: function (prefill) {
      setOpen(true);
      if (prefill && els.input) { els.input.value = prefill; autoResize(); }
    },
    ask: function (q) {
      setOpen(true);
      handleSend(q);
    },
  };

  // If BCoach already ready (rare), init; else app.js will call
  if (window.BCoach && window.BCoach.ready) {
    initCoachChat(window.BCoach);
  }
})();
