#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re, json
from pathlib import Path

text = Path("/workspace/b-coach-exam-sources.md").read_text(encoding="utf-8")
# Only section 五 questions
start = text.find("## 五、模擬題草稿")
end = text.find("## 六、")
chunk = text[start:end] if start >= 0 else text

# Map section headers to chapterIds (loosely)
SECTION_CH = {
    "A.": "ch1",
    "B.": "ch17",
    "C.": "ch22",
    "D.": "ch19",
    "E.": "ch18",
}

current_section = "ch1"
questions = []

# Pattern for each question block
# **N.（適用）題目**
# A. ...　B. ...　C. ...　D. ...
# **答案：X**
# **解析：**...

q_blocks = re.split(r"\n(?=\*\*\d+\.)", chunk)
for block in q_blocks:
    # track section
    sec_m = re.search(r"### ([A-E])\.", block)
    if sec_m:
        current_section = SECTION_CH.get(sec_m.group(1) + ".", current_section)

    m = re.match(
        r"\*\*(\d+)\.（([^）]+)）(.+?)\*\*\s*\n"
        r"A\.\s*(.+?)　B\.\s*(.+?)　C\.\s*(.+?)　D\.\s*(.+?)\s*\n"
        r"\*\*答案：([A-D])\*\*\s*\n"
        r"\*\*解析：\*\*(.+?)(?:\n\n|\Z)",
        block.strip(),
        re.S,
    )
    if not m:
        # try alternate: options may use fullwidth spaces or newlines
        m2 = re.search(
            r"\*\*(\d+)\.（([^）]+)）(.+?)\*\*\s*\n"
            r"A\.\s*(.+?)\s+B\.\s*(.+?)\s+C\.\s*(.+?)\s+D\.\s*(.+?)\s*\n"
            r"\*\*答案：([A-D])\*\*\s*\n"
            r"\*\*解析：\*\*\s*(.+)",
            block.strip(),
            re.S,
        )
        if not m2:
            continue
        m = m2

    num = int(m.group(1))
    scope = m.group(2).strip()
    qtext = m.group(3).strip()
    opts = [m.group(i).strip() for i in range(4, 8)]
    # clean trailing spaces from options (may include next line junk)
    opts = [re.sub(r"\s+", " ", o).strip() for o in opts]
    ans_letter = m.group(8)
    explain = m.group(9).strip()
    explain = re.sub(r"\n###.*", "", explain, flags=re.S).strip()
    answer = "ABCD".index(ans_letter)

    # Infer chapter from content keywords lightly
    chapter_id = current_section
    tags = [scope]

    questions.append({
        "id": f"eq{num:02d}",
        "chapterId": chapter_id,
        "scope": scope,
        "q": qtext,
        "options": opts,
        "answer": answer,
        "explain": explain,
        "tags": tags,
    })

# Fix section assignment by re-scanning with line-based approach for accuracy
questions = []
current_section = "anatomy"
SECTION_MAP = {
    "A. 功能解剖": ("anatomy", "功能解剖與生物力學"),
    "B. 運動生理": ("physio", "運動生理與訓練法"),
    "C. 營養": ("nutrition", "營養與體重控制"),
    "D. 特殊族群": ("special", "特殊族群與病理危險因子"),
    "E. 健康評估": ("prescription", "健康評估、處方、教學流程與安全"),
}
current_ch = "anatomy"
current_title = "功能解剖與生物力學"

lines = chunk.splitlines()
i = 0
while i < len(lines):
    line = lines[i]
    for key, (cid, title) in SECTION_MAP.items():
        if line.startswith("### ") and key in line:
            current_ch = cid
            current_title = title
    m = re.match(r"\*\*(\d+)\.（([^）]+)）(.+)\*\*\s*$", line.strip())
    if m:
        num = int(m.group(1))
        scope = m.group(2)
        qtext = m.group(3).strip()
        # next non-empty should be options
        j = i + 1
        while j < len(lines) and not lines[j].strip():
            j += 1
        opt_line = lines[j].strip() if j < len(lines) else ""
        om = re.match(r"A\.\s*(.+?)　B\.\s*(.+?)　C\.\s*(.+?)　D\.\s*(.+)$", opt_line)
        if not om:
            om = re.match(r"A\.\s*(.+?)\s{1,}B\.\s*(.+?)\s{1,}C\.\s*(.+?)\s{1,}D\.\s*(.+)$", opt_line)
        if not om:
            i += 1
            continue
        opts = [om.group(k).strip() for k in range(1, 5)]
        j += 1
        while j < len(lines) and not lines[j].strip().startswith("**答案"):
            j += 1
        ans_m = re.search(r"\*\*答案：([A-D])\*\*", lines[j] if j < len(lines) else "")
        answer = "ABCD".index(ans_m.group(1)) if ans_m else 0
        j += 1
        while j < len(lines) and not lines[j].strip().startswith("**解析"):
            j += 1
        explain = ""
        if j < len(lines):
            explain = re.sub(r"^\*\*解析：\*\*\s*", "", lines[j].strip())
        questions.append({
            "id": f"eq{num:02d}",
            "chapterId": current_ch,
            "chapter": current_title,
            "scope": scope,
            "q": qtext,
            "options": opts,
            "answer": answer,
            "explain": explain,
            "tags": [scope, current_title],
        })
        i = j + 1
        continue
    i += 1

out = {
    "meta": {
        "title": "B 級／中級體適能｜模擬選擇題",
        "source": "b-coach-exam-sources.md",
        "note": "依公開簡章範圍與專業常識改寫，非官方原題逐字重製。之後可直接往 questions 陣列擴充。",
        "count": len(questions),
    },
    "sections": [
        {"id": "anatomy", "title": "功能解剖與生物力學"},
        {"id": "physio", "title": "運動生理與訓練法"},
        {"id": "nutrition", "title": "營養與體重控制"},
        {"id": "special", "title": "特殊族群與病理危險因子"},
        {"id": "prescription", "title": "健康評估、處方、教學流程與安全"},
    ],
    "questions": questions,
}

path = Path("/workspace/b-coach-study/data/exam-questions.json")
path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {len(questions)} questions")
for q in questions[:2]:
    print(q["id"], q["q"][:40], "→", "ABCD"[q["answer"]], q["options"])
print("...")
print(questions[-1]["id"], questions[-1]["q"][:50])
# verify all 1-45
nums = [int(q["id"][2:]) for q in questions]
print("nums:", nums)
missing = [n for n in range(1, 46) if n not in nums]
print("missing:", missing)
