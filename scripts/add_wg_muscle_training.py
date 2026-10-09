#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""整合 WG《肌能訓練》影片＋學員 FITT-VP 表（L21–L24）。可重複執行（先移除同 id 再加入）。"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.dirname(HERE)
D = os.path.join(ROOT, "data")
from wgmt_content_lessons import LESSONS, VIDEO, VIDEO_TITLE
from wgmt_content_cards import CARDS, MNEMONICS
from wgmt_content_glossary import TERMS, CAT

def load(n):
    with open(os.path.join(D, n), encoding="utf-8") as f:
        return json.load(f)

def save(n, obj):
    p = os.path.join(D, n)
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")
    json.load(open(tmp, encoding="utf-8"))
    os.replace(tmp, p)

VNAME = VIDEO_TITLE + " " + VIDEO
TODAY = "2026-10-08"

# ── lessons ──
L = load("lessons.json")
new_ids = {l["id"] for l in LESSONS}
L["lessons"] = [l for l in L["lessons"] if l["id"] not in new_ids]
idx = next(i for i, l in enumerate(L["lessons"]) if l["id"] == "L08") + 1
L["lessons"][idx:idx] = LESSONS
steps = [s for s in L["path"]["steps"] if s.get("lessonId") not in new_ids]
si = next(i for i, s in enumerate(steps) if s["lessonId"] == "L08") + 1
steps[si:si] = [
    {"id": "s8b", "lessonId": "L21", "title": "肌力・肌肥大・肌耐力與負荷設定"},
    {"id": "s8c", "lessonId": "L22", "title": "體適能要素與三大能量系統"},
    {"id": "s8d", "lessonId": "L23", "title": "心率區間與計算（MHR／HRR）"},
    {"id": "s8e", "lessonId": "L24", "title": "需求分析與 FITT-VP"},
]
L["path"]["steps"] = steps
m = L["meta"]
m["lessonCount"] = len(L["lessons"]); m["pathStepCount"] = len(steps); m["updated"] = TODAY
m["wgMuscleTrainingVideo"] = VNAME
m["l21to24Note"] = "L21–L24 對 WG《肌能訓練》影片＋學員提供 FITT-VP 表（ACSM 式）；公式計算標〔補充〕；課文可含 tables（文字版表格）"
save("lessons.json", L)

# ── cards ──
C = load("cards.json")
chap = {ch["id"]: ch["fullTitle"] for ch in C["chapters"]}
cids = {c["id"] for c in CARDS}
C["cards"] = [c for c in C["cards"] if c["id"] not in cids]
for c in CARDS:
    c = dict(c)
    c["chapter"] = chap[c["chapterId"]]
    # 欄位順序對齊既有卡片
    ordered = {k: c[k] for k in ["id", "chapterId", "chapter", "type", "q", "a", "tags", "level", "plain", "highYield"] if k in c}
    for k in ("mnemonicId",):
        if k in c:
            ordered[k] = c[k]
    C["cards"].append(ordered)
mn_trick = {x["id"]: x["trick"] for x in MNEMONICS}
for c in C["cards"]:
    if c["id"] in cids and c.get("mnemonicId") in mn_trick:
        c["mnemonic"] = mn_trick[c["mnemonicId"]]
# 修正舊卡 ch17-q2（原答案空白）
for c in C["cards"]:
    if c["id"] == "ch17-q2":
        c["a"] = "① 磷酸肌酸（ATP-CP）：燃料磷酸肌酸｜無氧｜最快｜100m 衝刺\n② 糖解：燃料肝醣、血糖｜無氧（乳酸）／有氧｜其次｜400m\n③ 有氧：燃料醣、脂、蛋白質｜有氧｜最慢但最久｜1000m 以上、慢跑\n（依 WG《肌能訓練》影片）"
        c["plain"] = "磷快、糖中、氧慢久：100m／400m／慢跑。"
        tags = c.get("tags") or []
        if "WG 肌能訓練影片" not in tags:
            tags.append("WG 肌能訓練影片")
        c["tags"] = tags
cm = C["meta"]
cm["cardCount"] = len(C["cards"])
cm["basicCount"] = sum(1 for c in C["cards"] if c.get("level") == "basic")
cm["examCount"] = sum(1 for c in C["cards"] if c.get("level") == "exam")
cm["highYieldCount"] = sum(1 for c in C["cards"] if c.get("highYield"))
cm["chapterCount"] = len(C["chapters"])
cm["updated"] = TODAY
cm["wgMuscleTrainingVideo"] = VNAME
cm["fittVpTableNote"] = "學員提供 FITT-VP 表（Google Drive 圖片，ACSM 式）→ 卡片 tag「FITT-VP 表」"
note = "；含 WG 肌能訓練影片＋FITT-VP 表（L21–L24，tag「WG 肌能訓練影片」／「FITT-VP 表」，含計算卡）"
if note not in cm.get("note", ""):
    cm["note"] = cm.get("note", "") + note
save("cards.json", C)

# ── mnemonics ──
M = load("mnemonics.json")
mids = {x["id"] for x in MNEMONICS}
M["mnemonics"] = [x for x in M["mnemonics"] if x["id"] not in mids] + MNEMONICS
mm = M["meta"]
mm["count"] = len(M["mnemonics"]); mm["highYieldCount"] = sum(1 for x in M["mnemonics"] if x.get("highYield"))
mm["updated"] = TODAY; mm["wgMuscleTrainingVideo"] = VNAME
mm["fittVpNote"] = "含 L21–L24 肌能訓練／能量系統／心率計算（補充公式）／FITT-VP 表速記"
save("mnemonics.json", M)

# ── glossary ──
G = load("glossary.json")
tids = {t["id"] for t in TERMS}
existing = {t["id"] for t in G["terms"] if t["id"] not in tids}
clash = existing & tids
assert not clash, clash
proprio = next((t["id"] for t in G["terms"] if t["term"] == "本體感覺"), None)
terms = []
for t in TERMS:
    t = dict(t)
    if t["id"] == "term-neuromotor" and proprio:
        t["relatedIds"] = t["relatedIds"] + [proprio]
    terms.append(t)
G["terms"] = [t for t in G["terms"] if t["id"] not in tids] + terms
# 修正舊資料：L20 新增的 16 個名詞 explain 是字串（會讓辭典頁與問教練搜尋報錯）→ 轉成陣列
for _t in G["terms"]:
    if isinstance(_t.get("explain"), str):
        _t["explain"] = [_t["explain"]]
all_ids = {t["id"] for t in G["terms"]}
for t in terms:
    bad = [r for r in t["relatedIds"] if r not in all_ids]
    assert not bad, (t["id"], bad)
gm = G["meta"]
if CAT not in gm["categories"]:
    gm["categories"].append(CAT)
gm["count"] = len(G["terms"]); gm["highYieldCount"] = sum(1 for t in G["terms"] if t.get("highYield"))
gm["updated"] = TODAY
gm["wgMuscleTrainingNote"] = "訓練科學類：1RM、%1RM、HRR／MHR／RHR／THR、Karvonen（補充公式）、能量系統、FITT-VP 等（對 L21–L24）"
save("glossary.json", G)

# ── exam focus ──
E = load("exam-focus.json")
VSRC = {"title": VIDEO_TITLE, "url": VIDEO}
BSRC = {"title": "中華健身運動B級指導員考照心得", "url": "https://vocus.cc/article/65e875dbfd897800013a9af2"}
MSRC = {"title": "C級新手入門學習心得（Medium）", "url": "https://medium.com/blacksecurity/c-level-exercise-0fbc222bf7f1"}
ASRC = {"title": "中級體適能指導員考試心得（運科竹）", "url": "https://vocus.cc/article/6502c66afd89780001f44d00"}
EF = [
    {"id": "ef-wg-load-table", "title": "負荷設定表：%1RM ↔ 次數（1–6 力／7–12 大／12–15 耐）",
     "why": "WG《肌能訓練》影片整張列出 %1RM、反覆次數、自覺強度、效益；B 級心得也點名肌肥大／肌耐力／爆發力參數要分清。先會 1RM、%1RM 換算（重量＝1RM×%），再背三段次數。",
     "priority": "高", "topics": ["負荷設定", "1RM", "訓練法", "計算題"], "lessonIds": ["L21"],
     "mnemonicIds": ["mn-wgmt-rep-zones", "mn-wgmt-1rm", "mn-rep-zone", "mn-wgmt-mech-slow-heavy"],
     "pitfalls": ["1RM 誤當一組做到累", "%1RM 用除的", "肌肥大／肌耐力次數記反"], "sources": [VSRC, BSRC]},
    {"id": "ef-wg-energy", "title": "三大能量系統（WG 影片版：燃料／有氧無氧／快慢／例子）",
     "why": "影片用表格對照磷酸肌酸、糖解、有氧；心得也說能量系統是必記基礎。記「磷快、糖中、氧慢久」＋100m／400m／1000m+，再記肝醣偏無氧、血糖偏有氧。",
     "priority": "高", "topics": ["能量系統", "生理"], "lessonIds": ["L22", "L07"],
     "mnemonicIds": ["mn-wgmt-energy", "mn-energy", "mn-energy-work-rest"],
     "pitfalls": ["磷酸肌酸跟有氧快慢記反", "以為糖解只有無氧"], "sources": [VSRC, MSRC]},
    {"id": "ef-wg-hr-calc", "title": "心率名詞＋計算（MHR／HRR／RHR／THR）",
     "why": "WG 教官說 MHR、HRR、RHR、THR「可能跟後續計算題有關」。影片給定義（HRR＝MHR−RHR），常見公式為補充：MHR≈220−年齡、Karvonen THR＝HRR×%＋RHR。FITT-VP 表心肺強度也用 %HRR。",
     "priority": "高", "topics": ["心率", "計算題", "運動處方"], "lessonIds": ["L23", "L24"],
     "mnemonicIds": ["mn-wgmt-hr-names", "mn-wgmt-karvonen", "mn-wgmt-zones5", "mn-karvonen", "mn-mhr"],
     "pitfalls": ["Karvonen 忘記加回 RHR", "%HRR 題用 MHR×%", "HRR／RHR 名稱記反"], "sources": [VSRC]},
    {"id": "ef-wg-fittvp", "title": "FITT-VP 運動處方表（心肺／阻力／柔軟度數字）",
     "why": "影片教 FITT-VP 六字母＋客戶範例；學員提供的 FITT-VP 表（ACSM 式）每格數字都可能出題：心肺 150 分或 1000 大卡、中 40～<60% HRR、阻力 2–3 次與 48 小時、伸展 10–30 秒（老人 30–60）、每部位 60 秒。",
     "priority": "高", "topics": ["運動處方", "FITT-VP", "心肺", "阻力", "柔軟度"], "lessonIds": ["L24", "L23"],
     "mnemonicIds": ["mn-wgmt-fittvp", "mn-wgmt-cardio-150", "mn-wgmt-res-48", "mn-wgmt-flex-time"],
     "pitfalls": ["第二個 T 影片叫模式、表叫類型，以為是兩件事", "心肺總量記錯", "伸展拉到痛"], "sources": [VSRC, ASRC]},
    {"id": "ef-wg-needs", "title": "需求分析三點（上課前先問診）",
     "why": "WG 教官強調上課前非常重要：① 客戶需求 ② 傷病史 ③ 體適能水準與訓練經驗。之後才用 FITT-VP 開處方。",
     "priority": "高", "topics": ["需求分析", "運動處方", "教學"], "lessonIds": ["L24"],
     "mnemonicIds": ["mn-wgmt-needs3", "mn-wgmt-fittvp"],
     "pitfalls": ["沒問傷病史就排課", "新手與老手同一份課表"], "sources": [VSRC]},
    {"id": "ef-wg-7factors", "title": "影響肌力、肌肥大 7 因素＋阻力訓練 5 優點",
     "why": "影片逐項講：訓練強度、身體比例、激素水準、神經學效能（神經適應）、機械張力、代謝壓力、身體恢復率；阻力訓練優點 5 點。名詞多，容易出「下列何者不是」。",
     "priority": "中", "topics": ["訓練科學", "阻力訓練"], "lessonIds": ["L21"],
     "mnemonicIds": ["mn-wgmt-7factors", "mn-wgmt-neural-first", "mn-wgmt-benefits5", "mn-wgmt-mech-slow-heavy"],
     "pitfalls": ["新手變強就以為肌肉已長大", "激素只記睪固酮、漏生長激素"], "sources": [VSRC]},
]
efids = {x["id"] for x in EF}
E["items"] = [x for x in E["items"] if x["id"] not in efids] + EF
def add_unique(lst, vals):
    for v in vals:
        if v not in lst:
            lst.append(v)
for it in E["items"]:
    if it["id"] == "ef-energy":
        add_unique(it["lessonIds"], ["L22"]); add_unique(it["mnemonicIds"], ["mn-wgmt-energy"])
    if it["id"] == "ef-training-zones":
        add_unique(it["lessonIds"], ["L21"]); add_unique(it["mnemonicIds"], ["mn-wgmt-rep-zones"])
    if it["id"] == "ef-fitness-components":
        add_unique(it["lessonIds"], ["L22", "L24"]); add_unique(it["mnemonicIds"], ["mn-wgmt-health5", "mn-wgmt-sport6", "mn-wgmt-fittvp"])
    if it.get("priority") == "high":  # 舊資料筆誤：篩選只認「高／中」
        it["priority"] = "高"
if not any(s.get("url") == VIDEO for s in E["sources"]):
    E["sources"].append({"title": VIDEO_TITLE, "url": VIDEO, "note": "負荷設定表、能量系統、心率區間與名詞（可能考計算）、需求分析、FITT-VP"})
E["meta"]["itemCount"] = len(E["items"]); E["meta"]["sourceCount"] = len(E["sources"]); E["meta"]["updated"] = TODAY
save("exam-focus.json", E)

# ── 交叉檢查 ──
lesson_ids = {l["id"] for l in L["lessons"]}
mn_ids = {x["id"] for x in M["mnemonics"]}
for l in LESSONS:
    miss = [x for x in l["mnemonicIds"] if x not in mn_ids]
    assert not miss, (l["id"], miss)
    for f in l.get("figures", []):
        assert os.path.exists(os.path.join(ROOT, f["src"])), f["src"]
for t in TERMS:
    assert all(x in lesson_ids for x in t["lessonIds"]), t["id"]
    assert all(x in mn_ids for x in t["mnemonicIds"]), t["id"]
    if t.get("diagram"):
        assert os.path.exists(os.path.join(ROOT, t["diagram"]["src"])), t["diagram"]
for c in CARDS:
    assert c.get("mnemonicId") is None or c["mnemonicId"] in mn_ids, c["id"]
for x in EF:
    assert all(i in lesson_ids for i in x["lessonIds"]) and all(i in mn_ids for i in x["mnemonicIds"]), x["id"]
for x in MNEMONICS:
    assert all(i in lesson_ids for i in x.get("lessonIds", [])), x["id"]
print("lessons", len(L["lessons"]), "steps", len(steps))
print("cards", len(C["cards"]), "(+%d new)" % len(CARDS), "mnemonics", len(M["mnemonics"]), "(+%d)" % len(MNEMONICS))
print("glossary", len(G["terms"]), "(+%d)" % len(TERMS), "exam-focus", len(E["items"]), "(+%d)" % len(EF))
