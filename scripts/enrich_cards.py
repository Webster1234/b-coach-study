#!/usr/bin/env python3
"""Enrich cards.json with plain/level; split muscle origin cards. Idempotent."""
from __future__ import annotations
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CARDS_PATH = ROOT / "data" / "cards.json"
DICT_PATH = Path(__file__).with_name("enrich_dicts.json")
NL = chr(10)
BASIC_CHAPTERS = set("ch1 ch2 ch3 ch4 ch5 ch6 ch7 ch8 ch9 ch10 ch11 ch12 ch14 ch15 ch17 ch22 ch23".split())
BASIC_ID_EXTRA = set("ch13-act0 ch13-act1 ch13-act7 ch13-act8 ch13-act9 ch13-act10 ch13-act13 ch13-act15 ch13-act16 ch13-act19 ch13-act20".split())
_d = json.loads(DICT_PATH.read_text(encoding="utf-8"))
MUSCLE_PLAIN, PLAIN_BY_ID, Q_REWRITE = _d["MUSCLE_PLAIN"], _d["PLAIN_BY_ID"], _d["Q_REWRITE"]

def extract_muscle_name(q):
    q = re.sub(r"^旋轉肌袖 SITS ·\s*", "", q)
    q = re.sub(r"^旋轉肌袖（SITS）·\s*", "", q)
    q = re.sub(r"^髖屈／臀 ·\s*", "", q)
    q = re.sub(r"：.*$", "", q)
    q = re.sub(r"\s*的起點.*$", "", q)
    q = re.sub(r"\s*\([^)]*\)$", "", q)
    q = re.sub(r"\s+[SITT]\b", "", q)
    return q.strip()

def extract_action(a):
    for line in a.split(NL):
        line = line.strip()
        if line.startswith("主要動作："):
            return line.replace("主要動作：", "").strip()
        m = re.search(r"備註：(.+)$", line)
        if m:
            return m.group(1).strip()
    lines = [x.strip() for x in a.split(NL) if x.strip()]
    return lines[-1] if lines else a[:80]

def muscle_plain(name, action):
    for key, val in MUSCLE_PLAIN.items():
        if key in name:
            return val
    if action:
        return name + "主要功能可以先記：" + action + "。詳細起止點等進階再背。"
    return name + "先記位置與主要動作，起止點等考試再補強。"

def generic_plain(card):
    if card["id"] in PLAIN_BY_ID:
        return PLAIN_BY_ID[card["id"]]
    a = card["a"]
    if card["type"] == "tip":
        return "這是易混／口訣卡：先抓住一句對照，再回頭看正式定義。"
    if card["type"] == "action":
        return "先想這個動作在哪個平面，再對應主力肌群。"
    if card["type"] == "exercise":
        return "先想推／拉／蹲／鉸鏈哪個模式，再對主力肌與常見錯誤。"
    one = a.replace(NL, " ").strip()
    if len(one) > 90:
        one = one[:88] + "…"
    return "白話重點：" + one

def decide_level(card):
    if card["id"] in BASIC_ID_EXTRA:
        return "basic"
    if card["chapterId"] in BASIC_CHAPTERS:
        if card["chapterId"] == "ch22":
            if card["id"].startswith("ch22-vit") and card["id"] not in {"ch22-vit13", "ch22-vit14", "ch22-vit16", "ch22-vit24"}:
                return "exam"
            if card["id"].startswith("ch22-diet") or card["id"].startswith("ch22-food"):
                return "exam"
            return "basic"
        if card["chapterId"] == "ch14" and card["id"].startswith("ch14-cmp"):
            return "exam"
        return "basic"
    return "exam"

def soften_sits_q(q):
    return q.replace("旋轉肌袖 SITS · ", "旋轉肌袖（SITS）· ")

def split_muscle_card(card):
    name = extract_muscle_name(card["q"])
    action = extract_action(card["a"])
    plain = muscle_plain(name, action)
    display = name
    if any(x in name for x in ("棘上", "棘下", "小圓", "肩胛下")):
        display = name + "（旋轉肌袖）"
    basic = {
        "id": card["id"] + "-fn",
        "chapterId": card["chapterId"],
        "chapter": card["chapter"],
        "type": "muscle",
        "q": display + "大概在哪？主要做什麼？",
        "a": (action if action else card["a"].split(NL)[0]) + NL + "（白話）" + plain,
        "plain": plain,
        "level": "basic",
        "tags": list(card.get("tags") or []) + ["功能", "新手"],
        "pairId": card["id"],
    }
    exam_q = soften_sits_q(card["q"])
    if "起點" not in exam_q:
        exam_q = display + "：起點／止點／主要動作？（進階）"
    exam = dict(card)
    exam["q"] = exam_q
    exam["a"] = card["a"] + NL + "（白話）" + plain
    exam["plain"] = plain
    exam["level"] = "exam"
    exam["tags"] = list(card.get("tags") or []) + ["起止點"]
    exam["pairId"] = basic["id"]
    return [basic, exam]

def enrich():
    data = json.loads(CARDS_PATH.read_text(encoding="utf-8"))
    if any(c["id"].endswith("-fn") for c in data["cards"]):
        print("already enriched, skip")
        return
    new_cards = []
    basic_n = exam_n = split_n = 0
    for card in data["cards"]:
        if card.get("type") == "muscle" and ("起點" in card["q"] or "止點" in card["q"]):
            pair = split_muscle_card(card)
            new_cards.extend(pair)
            basic_n += 1; exam_n += 1; split_n += 1
            continue
        c = dict(card)
        c["level"] = decide_level(c)
        c["plain"] = generic_plain(c)
        if c["id"] in Q_REWRITE and c["level"] == "basic":
            c["q"] = Q_REWRITE[c["id"]]
        if c.get("plain") and "（白話）" not in c["a"]:
            c["a"] = c["a"] + NL + "（白話）" + c["plain"]
        c["q"] = soften_sits_q(c["q"])
        basic_n += c["level"] == "basic"
        exam_n += c["level"] != "basic"
        new_cards.append(c)
    data["cards"] = new_cards
    data["meta"]["cardCount"] = len(new_cards)
    data["meta"]["basicCount"] = basic_n
    data["meta"]["examCount"] = exam_n
    data["meta"]["note"] = "含 level(basic/exam) 與 plain；肌群拆成功能卡+起止點卡。"
    CARDS_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + NL, encoding="utf-8")
    print("cards:", len(new_cards), "basic:", basic_n, "exam:", exam_n, "splits:", split_n)

if __name__ == "__main__":
    enrich()
