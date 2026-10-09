#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Parse WorldGym flashcard markdown into cards.json"""
import re
import json
from pathlib import Path

SRC = Path("/workspace/WorldGym_解剖體力學_速記卡.md")
OUT = Path("/workspace/b-coach-study/data/cards.json")

text = SRC.read_text(encoding="utf-8")

# Split into sections by ## headers
section_re = re.compile(r"^## (.+)$", re.M)
parts = section_re.split(text)
# parts[0] = preamble, then alternating title, body
sections = []
for i in range(1, len(parts), 2):
    title = parts[i].strip()
    body = parts[i + 1] if i + 1 < len(parts) else ""
    # skip 附錄 summary as its own chapter of cards - we'll make one review card
    sections.append((title, body))

CHAPTER_ICONS = {
    "1": "🧭", "2": "🫁", "3": "🦴", "4": "💪", "5": "🏋️",
    "6": "🦾", "7": "🧘", "8": "🦵", "9": "🦶", "10": "💀",
    "11": "⚖️", "12": "🔗", "13": "📋", "14": "🧬", "15": "⚡",
    "16": "📊", "17": "❤️", "18": "📅", "19": "👥", "20": "⬆️",
    "21": "⬇️", "22": "🥗", "23": "🌬️", "24": "🏋️‍♂️", "25": "🏦",
    "26": "📝",
}

def chapter_meta(title):
    m = re.match(r"^(\d+)\.\s*(.+)$", title)
    if m:
        num, name = m.group(1), m.group(2)
        return {
            "id": f"ch{num}",
            "num": int(num),
            "title": name,
            "fullTitle": title,
            "icon": CHAPTER_ICONS.get(num, "📖"),
        }
    # 附
    return {
        "id": "appendix",
        "num": 99,
        "title": title.replace("附：", "").replace("附:", ""),
        "fullTitle": title,
        "icon": "⭐",
    }

def strip_md(s):
    s = s.strip()
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"\*(.+?)\*", r"\1", s)
    return s.strip()

def parse_table(lines):
    """Parse markdown table into list of dicts. Returns (headers, rows) or None."""
    rows = []
    headers = None
    for line in lines:
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        # skip separator
        if all(re.match(r"^:?-+:?$", c) for c in cells):
            continue
        if headers is None:
            headers = cells
        else:
            rows.append(cells)
    if not headers or not rows:
        return None
    return headers, rows

def muscle_table_to_cards(headers, rows, chapter, sub=None, card_id_start=0):
    cards = []
    # expect 肌肉 | 起點 | 止點 | 主要動作  or similar
    h_lower = [h.lower() for h in headers]
    is_muscle = any("肌肉" in h for h in headers) or any("動作" in h and i == 0 for i, h in enumerate(headers))
    
    for i, row in enumerate(rows):
        while len(row) < len(headers):
            row.append("")
        data = dict(zip(headers, row))
        
        if "肌肉" in headers:
            name = strip_md(data.get("肌肉", ""))
            origin = strip_md(data.get("起點", data.get("備註", "")))
            insert = strip_md(data.get("止點", ""))
            action = strip_md(data.get("主要動作", data.get("備註", "")))
            # 股四頭 has 備註 instead of 止點/動作
            if "備註" in headers and "止點" not in headers:
                note = strip_md(data.get("備註", ""))
                q = f"{name} 的起點／備註？"
                a_parts = [f"起點：{origin}"]
                if note:
                    a_parts.append(f"備註：{note}")
                a = "｜".join(a_parts)
            elif "止點" in headers and "主要動作" in headers:
                q = f"{name}：起點／止點／主要動作？"
                a = f"起點：{origin}\n止點：{insert}\n主要動作：{action}"
            elif "止點" in headers and "備註" in headers:
                note = strip_md(data.get("備註", ""))
                q = f"{name}：起點／止點／備註？"
                a = f"起點：{origin}\n止點：{insert}"
                if note:
                    a += f"\n備註：{note}"
            else:
                q = f"{name}？"
                a = "｜".join(f"{k}：{strip_md(v)}" for k, v in data.items() if k != "肌肉" and v)
            
            prefix = f"{sub} · " if sub else ""
            cards.append({
                "id": f"{chapter['id']}-m{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "muscle",
                "q": prefix + q,
                "a": a,
                "tags": [name] + ([sub] if sub else []),
            })
        elif "動作" in headers and ("主動肌" in headers or "主動肌" in "".join(headers)):
            # exercise cards
            move = strip_md(data.get("動作", data.get("器材", "")))
            prime = strip_md(data.get("主動肌", ""))
            assist = strip_md(data.get("協助肌", ""))
            safety = strip_md(data.get("安全提示", ""))
            joint = strip_md(data.get("主要關節動作", ""))
            q = f"{move}：主動肌／協助肌／安全提示？"
            a_parts = [f"主動肌：{prime}", f"協助肌：{assist}"]
            if joint:
                a_parts.append(f"關節動作：{joint}")
            if safety:
                a_parts.append(f"安全：{safety}")
            cards.append({
                "id": f"{chapter['id']}-ex{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "exercise",
                "q": q,
                "a": "\n".join(a_parts),
                "tags": [move],
            })
        elif "器材" in headers:
            move = strip_md(data.get("器材", ""))
            prime = strip_md(data.get("主動肌", ""))
            assist = strip_md(data.get("協助肌", ""))
            safety = strip_md(data.get("安全提示", ""))
            joint = strip_md(data.get("主要關節動作", ""))
            q = f"{move}：主動肌／協助肌／安全提示？"
            a_parts = [f"主動肌：{prime}", f"協助肌：{assist}"]
            if joint:
                a_parts.append(f"關節動作：{joint}")
            if safety:
                a_parts.append(f"安全：{safety}")
            cards.append({
                "id": f"{chapter['id']}-ex{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "exercise",
                "q": q,
                "a": "\n".join(a_parts),
                "tags": [move],
            })
        elif "部位" in headers or "動作（平面）" in headers:
            # action-muscle mapping - merge incomplete first cells
            region = strip_md(data.get("部位", ""))
            action = strip_md(data.get("動作（平面）", ""))
            muscles = strip_md(data.get("主要肌肉", ""))
            if not region and not action:
                continue
            label = f"{region} {action}".strip() if region else action
            if not label:
                continue
            cards.append({
                "id": f"{chapter['id']}-act{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "action",
                "q": f"{label} 的主要肌肉？",
                "a": muscles,
                "tags": [region] if region else [],
            })
        elif "目標" in headers:
            goal = strip_md(data.get("目標", ""))
            cards.append({
                "id": f"{chapter['id']}-goal{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "qa",
                "q": f"訓練目標「{goal}」的 %1RM／次數／組數／休息？",
                "a": f"%1RM：{strip_md(data.get('%1RM',''))}｜反覆：{strip_md(data.get('反覆次數',''))}｜組數：{strip_md(data.get('組數',''))}｜休息：{strip_md(data.get('休息',''))}",
                "tags": [goal],
            })
        elif "系統" in headers and "時間" in headers:
            sysname = strip_md(data.get("系統", ""))
            cards.append({
                "id": f"{chapter['id']}-energy{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "qa",
                "q": f"{sysname}：時間／燃料／例子？",
                "a": f"時間：{strip_md(data.get('時間',''))}｜燃料：{strip_md(data.get('燃料',''))}｜例子：{strip_md(data.get('例子',''))}",
                "tags": [sysname],
            })
        elif "族群" in headers:
            group = strip_md(data.get("族群", ""))
            note = strip_md(data.get("注意 / 運動處方重點", data.get("注意／運動處方重點", "")))
            if not note:
                # try second column
                for k, v in data.items():
                    if k != "族群":
                        note = strip_md(v)
                        break
            cards.append({
                "id": f"{chapter['id']}-pop{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "qa",
                "q": f"特殊族群「{group}」注意事項？",
                "a": note,
                "tags": [group],
            })
        elif "分類" in headers:
            cat = strip_md(data.get("分類", ""))
            subc = strip_md(data.get("次分類", ""))
            ex = strip_md(data.get("例子", ""))
            label = f"{cat}／{subc}" if cat else subc
            if not label.strip("/"):
                # fill forward from previous - handled later
                pass
            cards.append({
                "id": f"{chapter['id']}-mode{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "qa",
                "q": f"動作模式「{label}」例子？",
                "a": ex,
                "tags": [cat, subc],
            })
        elif "類別" in headers and "每日份量" in headers:
            cat = strip_md(data.get("類別", ""))
            amt = strip_md(data.get("每日份量", ""))
            cards.append({
                "id": f"{chapter['id']}-food{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "qa",
                "q": f"飲食指南「{cat}」每日份量？",
                "a": amt,
                "tags": [cat],
            })
        elif "營養素" in headers:
            nut = strip_md(data.get("營養素", ""))
            cal = strip_md(data.get("熱量", ""))
            pct = strip_md(data.get("佔總熱量", ""))
            cards.append({
                "id": f"{chapter['id']}-macro{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "qa",
                "q": f"{nut}：熱量／佔總熱量比例？",
                "a": f"{cal}｜{pct}",
                "tags": [nut],
            })
        elif "維生素" in headers:
            vit = strip_md(data.get("維生素", ""))
            func = strip_md(data.get("主要功能", ""))
            defic = strip_md(data.get("缺乏症", ""))
            cards.append({
                "id": f"{chapter['id']}-vit{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "qa",
                "q": f"維生素 {vit}：功能／缺乏症？",
                "a": f"功能：{func}\n缺乏：{defic}",
                "tags": [vit],
            })
        elif "飲食法" in headers:
            diet = strip_md(data.get("飲食法", ""))
            principle = strip_md(data.get("原則", ""))
            conclusion = strip_md(data.get("結論／副作用", ""))
            cards.append({
                "id": f"{chapter['id']}-diet{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "qa",
                "q": f"{diet}：原則／結論與副作用？",
                "a": f"原則：{principle}\n結論／副作用：{conclusion}",
                "tags": [diet],
            })
        elif "緊（短）" in "".join(headers) or any("緊" in h for h in headers):
            tight = strip_md(row[0]) if row else ""
            weak = strip_md(row[1]) if len(row) > 1 else ""
            cards.append({
                "id": f"{chapter['id']}-cross{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "qa",
                "q": f"交叉症候群：緊「{tight}」對應弱肌？",
                "a": f"緊（伸展）：{tight}\n弱（強化）：{weak}",
                "tags": ["交叉症候群"],
            })
        elif "肌梭" in "".join(headers) or (headers[0] == "" or headers[0] == " "):
            # comparison table like 肌梭 vs GTO or Type I/IIa/IIx
            row_label = strip_md(row[0]) if row else ""
            if not row_label:
                continue
            # Build Q from row label comparing columns
            answers = []
            for j, h in enumerate(headers[1:], 1):
                if j < len(row):
                    answers.append(f"{strip_md(h)}：{strip_md(row[j])}")
            cards.append({
                "id": f"{chapter['id']}-cmp{card_id_start + i}",
                "chapterId": chapter["id"],
                "chapter": chapter["fullTitle"],
                "type": "qa",
                "q": f"{row_label}（對照表）？",
                "a": "｜".join(answers),
                "tags": [row_label],
            })
        else:
            # generic: first col as Q topic, rest as A
            topic = strip_md(row[0]) if row else ""
            if not topic:
                continue
            answers = []
            for j, h in enumerate(headers[1:], 1):
                if j < len(row) and row[j].strip():
                    answers.append(f"{strip_md(h)}：{strip_md(row[j])}")
            if answers:
                cards.append({
                    "id": f"{chapter['id']}-t{card_id_start + i}",
                    "chapterId": chapter["id"],
                    "chapter": chapter["fullTitle"],
                    "type": "qa",
                    "q": f"{topic}？",
                    "a": "｜".join(answers),
                    "tags": [topic],
                })
    return cards

def fill_forward_region(cards):
    """For action tables where 部位 is blank, inherit previous region into q."""
    # Already handled in parsing if we track region - skip for now
    return cards

all_cards = []
chapters = []
card_counter = 0

for title, body in sections:
    ch = chapter_meta(title)
    chapters.append(ch)
    
    # For appendix, create one summary card from bullet list
    if ch["id"] == "appendix":
        bullets = re.findall(r"^- (.+)$", body, re.M)
        if bullets:
            all_cards.append({
                "id": "appendix-summary",
                "chapterId": "appendix",
                "chapter": ch["fullTitle"],
                "type": "qa",
                "q": "考前 30 秒總複習重點？",
                "a": "\n".join(strip_md(b) for b in bullets),
                "tags": ["總複習"],
            })
        continue
    
    lines = body.split("\n")
    i = 0
    current_sub = None
    local_idx = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Subheading like **髖屈／臀** or **旋轉肌袖 SITS**
        sub_m = re.match(r"^\*\*([^*]+)\*\*\s*$", line.strip())
        if sub_m and not line.strip().startswith("**Q") and not line.strip().startswith("**易混") and not line.strip().startswith("**口訣") and "：" not in sub_m.group(1)[:20]:
            # Could be subsection title
            sub_text = sub_m.group(1).strip()
            if not sub_text.startswith("Q") and len(sub_text) < 40:
                current_sub = sub_text
                i += 1
                continue
        
        # Q/A blocks: **Q...** followed by A：...
        qa_m = re.match(r"^\*\*(Q\d*\s*.+?)\*\*\s*(.*)$", line.strip())
        if qa_m:
            q_raw = qa_m.group(1).strip()
            # Normalize Q title
            q_title = re.sub(r"^Q\d*\s*", "", q_raw).strip()
            if q_title.endswith("？") or q_title.endswith("?"):
                q_text = q_title
            else:
                q_text = q_title + ("？" if not q_title.endswith("？") else "")
            
            # Collect answer: rest of line after **, then following lines until next **Q, table, ---, or ##
            ans_parts = []
            rest = qa_m.group(2).strip()
            if rest:
                ans_parts.append(rest)
            
            j = i + 1
            while j < len(lines):
                nl = lines[j]
                nls = nl.strip()
                if nls.startswith("**Q") or nls.startswith("|") or nls == "---" or nls.startswith("## "):
                    break
                if nls.startswith("**易混點**") or nls.startswith("**口訣**") or nls.startswith("**腰大肌") or nls.startswith("**%1RM") or nls.startswith("**心率") or nls.startswith("**Omega") or nls.startswith("**通則**") or nls.startswith("**交叉") or nls.startswith("**訓練原則**") or nls.startswith("**原則**") or nls.startswith("**易混點**"):
                    # tip lines - attach to answer or separate tip card
                    tip = strip_md(nls)
                    ans_parts.append(tip)
                    j += 1
                    continue
                if re.match(r"^\*\*[^*]+\*\*\s*$", nls) and not nls.startswith("**Q"):
                    # next subsection
                    break
                if nls.startswith("**") and "：" in nls[:30]:
                    # another labeled tip
                    ans_parts.append(strip_md(nls))
                    j += 1
                    continue
                if nls == "":
                    # blank - peek ahead
                    if j + 1 < len(lines) and (lines[j+1].strip().startswith("**Q") or lines[j+1].strip().startswith("|") or lines[j+1].strip().startswith("**") and not lines[j+1].strip().startswith("**例")):
                        j += 1
                        break
                    j += 1
                    continue
                ans_parts.append(nl.rstrip())
                j += 1
            
            a_text = "\n".join(ans_parts).strip()
            # Clean A： prefix
            a_text = re.sub(r"^A[：:]\s*", "", a_text)
            a_text = strip_md(a_text) if "\n" not in a_text else "\n".join(
                strip_md(x) if not x.startswith("-") and not x.startswith("|") else x
                for x in a_text.split("\n")
            )
            # Better: only strip bold markers
            a_text = re.sub(r"\*\*(.+?)\*\*", r"\1", a_text)
            a_text = re.sub(r"^A[：:]\s*", "", a_text.strip())
            
            all_cards.append({
                "id": f"{ch['id']}-q{local_idx}",
                "chapterId": ch["id"],
                "chapter": ch["fullTitle"],
                "type": "qa",
                "q": q_text,
                "a": a_text,
                "tags": [current_sub] if current_sub else [],
            })
            local_idx += 1
            i = j
            continue
        
        # Table block
        if line.strip().startswith("|"):
            table_lines = []
            j = i
            while j < len(lines) and (lines[j].strip().startswith("|") or lines[j].strip() == ""):
                if lines[j].strip().startswith("|"):
                    table_lines.append(lines[j])
                elif table_lines and j + 1 < len(lines) and not lines[j+1].strip().startswith("|"):
                    break
                j += 1
            parsed = parse_table(table_lines)
            if parsed:
                headers, rows = parsed
                # Fill forward empty first cells for 部位 tables
                if "部位" in headers:
                    last_region = ""
                    for row in rows:
                        if row[0].strip():
                            last_region = row[0]
                        else:
                            row[0] = last_region
                if "分類" in headers:
                    last_cat = ""
                    for row in rows:
                        if row[0].strip():
                            last_cat = row[0]
                        else:
                            row[0] = last_cat
                
                new_cards = muscle_table_to_cards(headers, rows, ch, current_sub, local_idx)
                all_cards.extend(new_cards)
                local_idx += len(new_cards)
            i = j
            continue
        
        # Standalone 易混點 / 口訣 as tip cards
        tip_m = re.match(r"^\*\*(易混點|口訣|通則|交叉記法|訓練原則|原則|腰大肌手寫備註|%1RM[^*]*|心率區間[^*]*|Omega[^*]*)\*\*[：:]?\s*(.*)$", line.strip())
        if tip_m:
            tip_label = tip_m.group(1)
            tip_rest = tip_m.group(2) or ""
            tip_body = tip_rest
            j = i + 1
            while j < len(lines):
                nls = lines[j].strip()
                if nls.startswith("**") or nls.startswith("|") or nls == "---" or nls.startswith("##"):
                    break
                if nls:
                    tip_body += ("\n" if tip_body else "") + nls
                j += 1
            tip_body = re.sub(r"\*\*(.+?)\*\*", r"\1", tip_body).strip()
            if tip_body:
                all_cards.append({
                    "id": f"{ch['id']}-tip{local_idx}",
                    "chapterId": ch["id"],
                    "chapter": ch["fullTitle"],
                    "type": "tip",
                    "q": f"【{tip_label}】{ch['title']}",
                    "a": tip_body,
                    "tags": [tip_label],
                })
                local_idx += 1
            i = j
            continue
        
        i += 1

# Deduplicate by id (safety)
seen = set()
unique = []
for c in all_cards:
    if c["id"] in seen:
        c["id"] = c["id"] + "-dup" + str(len(unique))
    seen.add(c["id"])
    # Clean empty tags
    c["tags"] = [t for t in c["tags"] if t]
    unique.append(c)

result = {
    "meta": {
        "title": "World Gym B 級教練｜解剖體力學速記",
        "source": "WorldGym_解剖體力學_速記卡.md",
        "cardCount": len(unique),
        "chapterCount": len(chapters),
    },
    "chapters": chapters,
    "cards": unique,
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {len(unique)} cards, {len(chapters)} chapters → {OUT}")
# Chapter breakdown
from collections import Counter
cnt = Counter(c["chapterId"] for c in unique)
for ch in chapters:
    print(f"  {ch['id']}: {cnt.get(ch['id'], 0)} cards — {ch['title']}")
