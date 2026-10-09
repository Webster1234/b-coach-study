/* B Coach Study — vanilla SPA (beginner-friendly) */
(function () {
  "use strict";

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const state = {
    cardsData: null,
    examData: null,
    lessonsData: null,
    mnemonicsData: null,
    examFocusData: null,
    glossaryData: null,
    mnemonicFilterChapter: "__all__",
    mnemonicSearch: "",
    glossaryFilterCategory: "__all__",
    glossarySearch: "",
    currentTermId: null,
    afterGlossary: null,
    examFocusPriority: "all",
    currentExamFocusId: null,
    view: "home",
    deck: [],
    index: 0,
    flipped: false,
    mode: "study",
    selectedChapters: new Set(["__all__"]),
    studyLevel: "basic",
    srsLevel: "basic",
    quizSource: "exam",
    quizMode: "practice",
    quizList: [],
    quizIndex: 0,
    quizScore: 0,
    quizAnswered: false,
    fromWrong: false,
    hintShown: false,
    // guided path / lesson
    currentLessonId: null,
    pathStepId: null,
    afterLesson: null, // 'path' | 'lessons' | null
    pathQuiz: false,
  };

  const TITLES = {
    home: "B 級教練複習站",
    path: "學習路徑",
    practice: "練習",
    search: "搜尋全站",
    lessons: "全部課文",
    lesson: "課文",
    mnemonics: "速記口訣",
    mnemonic: "速記詳情",
    glossary: "名詞辭典",
    "glossary-term": "名詞解釋",
    "exam-focus": "考過的人這樣說",
    "exam-focus-detail": "必背重點",
    chapters: "依章節翻卡",
    "study-setup": "翻卡複習",
    "srs-setup": "間隔重複",
    "quiz-setup": "選擇題練習",
    "quiz-result": "結果",
    wrong: "錯題本",
    figures: "圖解庫",
  };
  const TAB_OF = {
    home: "home", path: "path", lesson: "path", practice: "practice", "study-setup": "practice", card: "practice",
    "srs-setup": "practice", "quiz-setup": "practice", quiz: "practice", "quiz-result": "practice", wrong: "practice",
    mnemonics: "practice", mnemonic: "practice", "exam-focus": "practice", "exam-focus-detail": "practice",
    chapters: "practice", lessons: "practice", figures: "figures", glossary: "glossary", "glossary-term": "glossary",
  };
  const nav = { stack: [], cur: null, restoring: false };
  function navKey(e) {
    return e ? e.view + "|" + (e.view === "lesson" ? e.lessonId : e.view === "glossary-term" ? e.termId : e.view === "mnemonic" ? e.mnemonicId : e.view === "exam-focus-detail" ? e.efId : "") : "";
  }
  function navSnap(id) {
    return { view: id, lessonId: state.currentLessonId, termId: state.currentTermId, mnemonicId: state.currentMnemonicId, efId: state.currentExamFocusId, afterLesson: state.afterLesson, y: 0 };
  }

  function showView(id, opts) {
    opts = opts || {};
    const snap = navSnap(id);
    if (!nav.restoring && nav.cur && navKey(nav.cur) !== navKey(snap)) {
      nav.cur.y = window.scrollY;
      if (id === "home") {
        nav.stack = [];
      } else {
        nav.stack.push(nav.cur);
        if (nav.stack.length > 60) nav.stack.shift();
        try { history.pushState({ bcs: nav.stack.length }, ""); } catch (_) {}
      }
    }
    nav.cur = snap;
    $$(".view").forEach((v) => v.classList.remove("active"));
    const el = document.getElementById("view-" + id);
    if (el) el.classList.add("active");
    state.view = id;
    document.body.setAttribute("data-view", id);
    const titles = Object.assign({}, TITLES, {
      card: state.mode === "srs" ? "間隔重複" : "翻卡複習",
      quiz: state.pathQuiz ? "本課小測驗" : state.quizMode === "practice" ? "選擇題練習" : "正式計分考",
    });
    $("#topbar-title").textContent = titles[id] || "B 級教練複習站";
    const back = $("#btn-back");
    if (back) back.hidden = id === "home";
    const tab = TAB_OF[id] || "";
    $$("#bottom-nav [data-tab]").forEach((b) => {
      const on = b.getAttribute("data-tab") === tab;
      b.classList.toggle("active", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    const rp = $("#read-progress");
    if (rp) rp.hidden = id !== "lesson";
    if (!nav.restoring && !opts.keepScroll) window.scrollTo(0, 0);
  }

  function navRestore(e) {
    nav.restoring = true;
    try {
      state.afterLesson = e.afterLesson || state.afterLesson;
      switch (e.view) {
        case "lesson": openLesson(e.lessonId, e.afterLesson || "path"); break;
        case "glossary-term": openTerm(e.termId, "glossary"); break;
        case "mnemonic": openMnemonic(e.mnemonicId, "mnemonics"); break;
        case "exam-focus-detail": openExamFocus(e.efId); break;
        case "home": showView("home"); updateHomeStats(); break;
        case "path": renderPath(); showView("path"); break;
        case "practice": renderPractice(); showView("practice"); break;
        case "glossary": renderGlossaryCategoryChips(); renderGlossaryList(); showView("glossary"); break;
        case "mnemonics": renderMnemonicChapterChips(); renderMnemonicsList(); showView("mnemonics"); break;
        case "lessons": renderLessonList(); showView("lessons"); break;
        case "exam-focus": renderExamFocusList(); showView("exam-focus"); break;
        case "chapters": renderChapters(); showView("chapters"); break;
        case "wrong": renderWrong(); showView("wrong"); break;
        case "srs-setup": refreshSRSSetup(); showView("srs-setup"); break;
        case "figures": if (window.BCFig) window.BCFig.openGallery(); else showView("figures"); break;
        default: showView(e.view);
      }
    } finally {
      nav.restoring = false;
    }
    nav.cur = e;
    const y = e.y || 0;
    requestAnimationFrame(() => setTimeout(() => window.scrollTo(0, y), 30));
  }

  function navBack() {
    if (closeOverlays()) return;
    const e = nav.stack.pop();
    if (!e) {
      showView("home");
      updateHomeStats();
      return;
    }
    navRestore(e);
  }

  function closeOverlays() {
    let closed = false;
    const pop = $("#gpop");
    if (pop && !pop.hidden) { hideTermPop(); closed = true; }
    if (window.BCUX && window.BCUX.closeSheet && window.BCUX.closeSheet()) closed = true;
    const lb = document.querySelector(".fig-lightbox.open");
    if (lb) { const c = lb.querySelector(".lb-close"); if (c) c.click(); closed = true; }
    const cp = $("#coach-panel");
    if (cp && cp.classList.contains("open")) { const c = $("#coach-close"); if (c) c.click(); closed = true; }
    return closed;
  }

  function toast(msg, ms) {
    let t = $("#ux-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "ux-toast";
      t.className = "ux-toast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), ms || 2800);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute(
      "data-theme",
      theme === "light" ? "light" : "dark"
    );
    BCSStorage.setTheme(theme === "light" ? "light" : "dark");
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function loadData() {
    const [cards, exam, lessons, mnemonics, examFocus, glossary] = await Promise.all([
      fetch("data/cards.json?v=20261009b").then((r) => r.json()),
      fetch("data/exam-questions.json?v=20261009b").then((r) => r.json()),
      fetch("data/lessons.json?v=20261009b").then((r) => r.json()),
      fetch("data/mnemonics.json?v=20261009b").then((r) => r.json()),
      fetch("data/exam-focus.json?v=20261009b").then((r) => r.json()),
      fetch("data/glossary.json?v=20261009b").then((r) => r.json()),
    ]);
    state.cardsData = cards;
    state.examData = exam;
    state.lessonsData = lessons;
    state.mnemonicsData = mnemonics;
    state.examFocusData = examFocus;
    state.glossaryData = glossary;
  }

  function filterCards(selected, level, learnedOnly) {
    let all = state.cardsData.cards.slice();
    if (learnedOnly) {
      const lc = learnedChapterIds();
      all = all.filter((c) => lc.has(c.chapterId));
    }
    if (selected && !selected.has("__all__") && selected.size > 0) {
      all = all.filter((c) => selected.has(c.chapterId));
    }
    if (level === "basic") {
      all = all.filter((c) => (c.level || "exam") === "basic");
    }
    return all;
  }

  // —— 學習進度 helpers ——
  function pathSteps() {
    return (state.lessonsData && state.lessonsData.path && state.lessonsData.path.steps) || [];
  }
  function pathUnits() {
    return (state.lessonsData && state.lessonsData.path && state.lessonsData.path.units) || [];
  }
  function stepByLesson(lessonId) {
    return pathSteps().find((s) => s.lessonId === lessonId) || null;
  }
  function unitOfStep(stepId) {
    const us = pathUnits();
    const i = us.findIndex((u) => (u.steps || []).includes(stepId));
    return i >= 0 ? { unit: us[i], index: i } : null;
  }
  function doneSet() {
    return new Set(BCSStorage.getPathProgress().completedSteps || []);
  }
  function learnedLessonIds() {
    const set = new Set(Object.keys(BCSStorage.getUX().readLessons || {}));
    const done = doneSet();
    pathSteps().forEach((st) => { if (done.has(st.id)) set.add(st.lessonId); });
    return set;
  }
  function learnedChapterIds() {
    const out = new Set();
    learnedLessonIds().forEach((lid) => {
      const les = getLesson(lid);
      (les && les.chapterIds || []).forEach((c) => out.add(c));
    });
    return out;
  }
  function readMinutes(les) {
    const n = (les.body || []).join("").length + (les.keyPoint || "").length;
    return Math.max(2, Math.round(n / 330));
  }

  function resumeTarget() {
    const done = doneSet();
    const ux = BCSStorage.getUX();
    const last = ux.last;
    if (last && last.lessonId && getLesson(last.lessonId)) {
      const st = stepByLesson(last.lessonId);
      if (st && !done.has(st.id)) {
        return { lessonId: last.lessonId, stepId: st.id, scroll: last.scroll || 0, kind: "resume" };
      }
    }
    const next = nextPathStep();
    if (next) return { lessonId: next.lessonId, stepId: next.id, scroll: 0, kind: done.size ? "next" : "first" };
    return null;
  }

  function continueLearning() {
    const t = resumeTarget();
    if (!t) {
      renderPractice();
      showView("practice");
      toast("全部關卡都完成了！來練習區刷題吧 🎉");
      return;
    }
    state.pathStepId = t.stepId;
    openLesson(t.lessonId, "path", { scrollPct: t.kind === "resume" ? t.scroll : 0 });
  }

  function updateHomeStats() {
    const steps = pathSteps();
    const done = doneSet();
    const total = steps.length;
    const n = steps.filter((s) => done.has(s.id)).length;
    const pct = total ? Math.round((n / total) * 100) : 0;
    const ring = $("#home-ring");
    if (ring) ring.style.setProperty("--p", pct);
    if ($("#home-pct")) $("#home-pct").textContent = pct + "%";
    if ($("#home-done")) $("#home-done").textContent = n;
    if ($("#home-total")) $("#home-total").textContent = total;
    if ($("#home-today")) $("#home-today").textContent = BCSStorage.todayCount();
    const t = resumeTarget();
    const kicker = $("#continue-kicker");
    const desc = $("#continue-desc");
    if (kicker && desc) {
      if (!t) {
        kicker.textContent = "全部 " + total + " 關都完成了 🎉";
        desc.textContent = "去練習區刷題、複習錯題";
      } else {
        const st = pathSteps().find((x) => x.id === t.stepId);
        const idx = pathSteps().indexOf(st) + 1;
        const u = unitOfStep(t.stepId);
        kicker.textContent =
          (t.kind === "resume" ? "上次讀到這裡" + (t.scroll > 0.05 ? "（約 " + Math.round(t.scroll * 100) + "%）" : "") :
            t.kind === "first" ? "從第一關開始" : "下一關") +
          (u ? " · 單元 " + (u.index + 1) + "「" + u.unit.title + "」" : "");
        desc.textContent = "第 " + idx + " 關：" + (st ? st.title : "");
      }
    }
    const hi = $("#home-hi");
    if (hi) {
      const today = BCSStorage.todayCount();
      hi.textContent = n === 0 && today === 0 ? "歡迎！完全沒學過也沒關係，從第一關慢慢來 🌱" : today ? "今天已經完成 " + today + " 項，很棒！繼續保持 💪" : "歡迎回來！今天也前進一點點 💪";
    }
  }

  function updatePathCta() {
    updateHomeStats();
  }

  function renderPractice() {
    const w = BCSStorage.getWrong().length;
    const wb = $("#pc-wrong-count");
    if (wb) wb.textContent = w ? w + " 題" : "";
    const srs = BCSStorage.getSRS();
    let due = 0;
    const now = Date.now();
    Object.values(srs).forEach((st) => { if (SM2.isDue(st, now)) due++; });
    const db = $("#pc-due-count");
    if (db) db.textContent = due ? "今天 " + due + " 張" : "";
  }

  function renderChapterChips(containerId, selectedSet) {
    const box = document.getElementById(containerId);
    const chapters = state.cardsData.chapters;
    box.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className =
      "chip all-chip" + (selectedSet.has("__all__") ? " active" : "");
    allBtn.textContent = "全部";
    allBtn.addEventListener("click", () => {
      selectedSet.clear();
      selectedSet.add("__all__");
      renderChapterChips(containerId, selectedSet);
    });
    box.appendChild(allBtn);

    chapters.forEach((ch) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (selectedSet.has(ch.id) ? " active" : "");
      btn.textContent = `${ch.icon || ""} ${
        ch.num != null && ch.num < 99 ? ch.num + "." : ""
      } ${ch.title}`.replace(/\s+/g, " ").trim();
      btn.title = ch.fullTitle;
      btn.addEventListener("click", () => {
        selectedSet.delete("__all__");
        if (selectedSet.has(ch.id)) selectedSet.delete(ch.id);
        else selectedSet.add(ch.id);
        if (selectedSet.size === 0) selectedSet.add("__all__");
        renderChapterChips(containerId, selectedSet);
      });
      box.appendChild(btn);
    });
  }

  function bindLevelChips(containerId, key) {
    $$(`#${containerId} .chip`).forEach((chip) => {
      chip.addEventListener("click", () => {
        $$(`#${containerId} .chip`).forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        state[key] = chip.getAttribute("data-level");
        if (key === "srsLevel") refreshSRSSetup();
      });
    });
  }

  function renderChapters() {
    const grid = $("#chapter-grid");
    const counts = {};
    state.cardsData.cards.forEach((c) => {
      counts[c.chapterId] = (counts[c.chapterId] || 0) + 1;
    });
    grid.innerHTML = "";
    state.cardsData.chapters.forEach((ch) => {
      const lesson = state.lessonsData.lessons.find((l) =>
        (l.chapterIds || []).includes(ch.id)
      );
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chapter-card";
      btn.innerHTML = `
        <div class="ch-icon">${ch.icon || "📖"}</div>
        <div class="ch-title">${escapeHtml(ch.fullTitle)}</div>
        <div class="ch-count">${counts[ch.id] || 0} 張卡${
        lesson ? " · 有課文" : ""
      }</div>`;
      btn.addEventListener("click", () => {
        if (lesson) {
          openLesson(lesson.id, "chapters");
        } else {
          state.selectedChapters = new Set([ch.id]);
          state.studyLevel = "basic";
          state.studyLearnedOnly = false;
          startStudy(false);
        }
      });
      grid.appendChild(btn);
    });
  }

  // —— Lessons & Path ——
  function getLesson(id) {
    return state.lessonsData.lessons.find((l) => l.id === id);
  }

  function getMnemonic(id) {
    if (!id || !state.mnemonicsData) return null;
    return state.mnemonicsData.mnemonics.find((m) => m.id === id) || null;
  }

  function chapterTitle(chapterId) {
    const ch = state.cardsData.chapters.find((c) => c.id === chapterId);
    return ch ? ch.title : chapterId || "";
  }

  function renderMnemonicInline(containerId, ids) {
    const box = document.getElementById(containerId);
    if (!box) return;
    box.innerHTML = "";
    (ids || []).forEach((mid) => {
      const m = getMnemonic(mid);
      if (!m) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "mnemonic-inline" + (m.highYield ? " high-yield" : "");
      btn.innerHTML = `<span class="mi-label">${
        m.highYield ? "🔥" : "💡"
      } 速記 · ${escapeHtml(
        m.title
      )}</span><span class="mi-trick">${escapeHtml(m.trick)}</span>`;
      btn.addEventListener("click", () => openMnemonic(m.id, state.view));
      box.appendChild(btn);
    });
  }

  function openMnemonic(id, backTo) {
    const m = getMnemonic(id);
    if (!m) return;
    state.afterLesson = backTo || "mnemonics";
    state.currentMnemonicId = id;
    $("#mnemonic-title").textContent = m.title;
    $("#mnemonic-badge").textContent =
      (m.highYield ? "🔥 考過常提 · " : "💡 速記 · ") +
      chapterTitle(m.chapterId);
    $("#mnemonic-trick").textContent = m.trick;
    $("#mnemonic-detail").innerHTML = `<p>${escapeHtml(m.detail)}</p>`;
    $("#mnemonic-tags").innerHTML = (m.tags || [])
      .map((t) => `<span class="keyword-chip">${escapeHtml(t)}</span>`)
      .join("");
    showView("mnemonic");
  }

  function renderMnemonicsList() {
    const q = (state.mnemonicSearch || "").trim().toLowerCase();
    const ch = state.mnemonicFilterChapter;
    const list = state.mnemonicsData.mnemonics.filter((m) => {
      if (ch && ch !== "__all__" && m.chapterId !== ch) return false;
      if (!q) return true;
      const blob = (
        m.title +
        " " +
        m.trick +
        " " +
        m.detail +
        " " +
        (m.tags || []).join(" ")
      ).toLowerCase();
      return blob.includes(q);
    });
    const box = $("#mnemonic-list");
    box.innerHTML = "";
    if (!list.length) {
      box.innerHTML =
        '<p class="muted" style="padding:8px">沒有符合的速記，試試別的關鍵字。</p>';
      return;
    }
    list.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mnemonic-card" + (m.highYield ? " high-yield" : "");
      const hy =
        m.highYield
          ? '<span class="hy-badge">考過常提</span> '
          : "";
      btn.innerHTML = `<span class="mc-title">${hy}${escapeHtml(
        m.title
      )}</span><span class="mc-trick">${escapeHtml(
        m.trick
      )}</span><span class="mc-meta">${escapeHtml(
        chapterTitle(m.chapterId)
      )} · ${(m.tags || []).map(escapeHtml).join("、")}</span>`;
      btn.addEventListener("click", () => openMnemonic(m.id, "mnemonics"));
      box.appendChild(btn);
    });
  }

  function renderMnemonicChapterChips() {
    const box = $("#mnemonic-chapter-chips");
    if (!box) return;
    const used = new Set(
      state.mnemonicsData.mnemonics.map((m) => m.chapterId)
    );
    box.innerHTML = "";
    const all = document.createElement("button");
    all.type = "button";
    all.className =
      "chip all-chip" +
      (state.mnemonicFilterChapter === "__all__" ? " active" : "");
    all.textContent = "全部";
    all.addEventListener("click", () => {
      state.mnemonicFilterChapter = "__all__";
      renderMnemonicChapterChips();
      renderMnemonicsList();
    });
    box.appendChild(all);
    state.cardsData.chapters.forEach((ch) => {
      if (!used.has(ch.id)) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "chip" + (state.mnemonicFilterChapter === ch.id ? " active" : "");
      btn.textContent = `${ch.icon || ""} ${ch.title}`.trim();
      btn.addEventListener("click", () => {
        state.mnemonicFilterChapter = ch.id;
        renderMnemonicChapterChips();
        renderMnemonicsList();
      });
      box.appendChild(btn);
    });
  }


  function getTerm(id) {
    const list = (state.glossaryData && state.glossaryData.terms) || [];
    return list.find((t) => t.id === id) || null;
  }

  function glossaryMatchHay(term) {
    return (
      term.term +
      " " +
      (term.aliases || []).join(" ") +
      " " +
      (term.oneLiner || "") +
      " " +
      (term.category || "")
    ).toLowerCase();
  }

  function filteredGlossaryTerms() {
    let list = ((state.glossaryData && state.glossaryData.terms) || []).slice();
    if (state.glossaryFilterCategory && state.glossaryFilterCategory !== "__all__") {
      list = list.filter((t) => t.category === state.glossaryFilterCategory);
    }
    const q = (state.glossarySearch || "").trim().toLowerCase().replace(/\s+/g, "");
    if (q) {
      list = list.filter((t) => {
        const hay = glossaryMatchHay(t).replace(/\s+/g, "");
        return hay.includes(q) || (t.aliases || []).some((a) =>
          String(a).toLowerCase().replace(/\s+/g, "").includes(q)
        );
      });
    }
    return list;
  }

  function renderGlossaryCategoryChips() {
    const box = $("#glossary-category-chips");
    if (!box) return;
    const cats = (state.glossaryData && state.glossaryData.meta && state.glossaryData.meta.categories) || [
      "方位平面", "動作", "骨骼關節", "肌肉概念", "常見考點", "其他",
    ];
    box.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "chip" + (state.glossaryFilterCategory === "__all__" ? " active" : "");
    allBtn.textContent = "全部";
    allBtn.addEventListener("click", () => {
      state.glossaryFilterCategory = "__all__";
      renderGlossaryCategoryChips();
      renderGlossaryList();
    });
    box.appendChild(allBtn);
    cats.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (state.glossaryFilterCategory === cat ? " active" : "");
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        state.glossaryFilterCategory = cat;
        renderGlossaryCategoryChips();
        renderGlossaryList();
      });
      box.appendChild(btn);
    });
  }

  function renderGlossaryList() {
    const box = $("#glossary-list");
    if (!box) return;
    box.innerHTML = "";
    const list = filteredGlossaryTerms();
    const note = $("#glossary-count-note");
    if (note) {
      const total = (state.glossaryData && state.glossaryData.terms || []).length;
      note.textContent = "顯示 " + list.length + " / " + total + " 個名詞";
    }
    if (!list.length) {
      box.innerHTML = '<p class="muted">沒有符合的名詞，換個關鍵字試試。</p>';
      return;
    }
    list.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "glossary-card" + (t.highYield ? " high-yield" : "");
      const hy = t.highYield ? ' <span class="hy-badge">考過常提</span>' : "";
      const alias = (t.aliases || []).slice(0, 2).join(" · ");
      btn.innerHTML =
        '<span class="gc-cat">' + escapeHtml(t.category || "") + "</span>" +
        '<span class="gc-title">' + escapeHtml(t.term) + hy + "</span>" +
        (alias ? '<span class="gc-alias">' + escapeHtml(alias) + "</span>" : "") +
        '<span class="gc-line">' + escapeHtml(t.oneLiner || "") + "</span>";
      btn.addEventListener("click", () => openTerm(t.id, "glossary"));
      box.appendChild(btn);
    });
  }

  function openTerm(termId, backTo) {
    const t = getTerm(termId);
    if (!t) return;
    state.currentTermId = termId;
    state.afterGlossary = backTo || "glossary";
    const badge = $("#glossary-term-badge");
    if (badge) {
      badge.textContent = t.highYield
        ? "📘 名詞 · 考過常提 · " + (t.category || "")
        : "📘 名詞 · " + (t.category || "");
    }
    $("#glossary-term-title").textContent = t.term;
    const al = $("#glossary-term-aliases");
    if (al) {
      al.textContent = (t.aliases || []).length
        ? "也叫：" + (t.aliases || []).join("、")
        : "";
    }
    $("#glossary-term-oneliner").textContent = t.oneLiner || "";
    renderFigures(
      "glossary-term-figure",
      t.figures && t.figures.length ? t.figures : t.diagram ? [t.diagram] : []
    );
    const exp = $("#glossary-term-explain");
    exp.innerHTML = (t.explain || [])
      .map((p) => "<p>" + escapeHtml(p) + "</p>")
      .join("");
    const exBox = $("#glossary-term-example-box");
    const ex = $("#glossary-term-example");
    if (t.example) {
      ex.textContent = t.example;
      exBox.classList.remove("hidden");
    } else {
      ex.textContent = "";
      exBox.classList.add("hidden");
    }
    const rel = $("#glossary-term-related");
    rel.innerHTML = "";
    (t.relatedIds || []).forEach((rid) => {
      const rt = getTerm(rid);
      if (!rt) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "link-chip";
      b.textContent = rt.term;
      b.addEventListener("click", () => openTerm(rid, state.afterGlossary || "glossary"));
      rel.appendChild(b);
    });
    if (!rel.children.length) {
      rel.innerHTML = '<span class="muted">—</span>';
    }
    const lesBox = $("#glossary-term-lessons");
    lesBox.innerHTML = "";
    (t.lessonIds || []).forEach((lid) => {
      const les = getLesson(lid);
      if (!les) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "link-chip";
      b.textContent = "📖 " + les.title;
      b.addEventListener("click", () => openLesson(lid, "glossary-term"));
      lesBox.appendChild(b);
    });
    if (!lesBox.children.length) {
      lesBox.innerHTML = '<span class="muted">—</span>';
    }
    renderMnemonicInline("glossary-term-mnemonics", t.mnemonicIds || []);
    showView("glossary-term");
  }

  /** Build lookup: longer terms first for linking (cached) */
  let _glossIdx = null;
  function glossaryLinkIndex() {
    if (_glossIdx) return _glossIdx;
    const list = (state.glossaryData && state.glossaryData.terms) || [];
    const entries = [];
    const STOP = new Set(["上", "下", "前", "後", "例子", "主要", "旋轉"]);
    list.forEach((t) => {
      const keys = [t.term].concat(t.aliases || []);
      // 「上提（肩帶）」這類詞也用括號前的短名比對
      const base = String(t.term || "").replace(/（.*?）|\(.*?\)/g, "").trim();
      if (base && base !== t.term) keys.push(base);
      keys.forEach((a) => {
        const k = String(a || "").trim();
        if (k.length >= 2 && !STOP.has(k)) entries.push({ key: k, low: k.toLowerCase(), id: t.id, len: k.length });
      });
    });
    entries.sort((a, b) => b.len - a.len);
    // first-char bucket for speed
    const byFirst = new Map();
    entries.forEach((e) => {
      const c = e.low[0];
      if (!byFirst.has(c)) byFirst.set(c, []);
      byFirst.get(c).push(e);
    });
    _glossIdx = { entries, byFirst };
    return _glossIdx;
  }

  /** 把純文字轉成 HTML；名詞第一次出現時變成可點的「名詞小卡」按鈕。seen：同一頁共用，避免同詞重複畫底線。*/
  function linkifyGlossaryHtml(rawText, seen) {
    const text = String(rawText || "");
    if (!text) return "";
    const idx = glossaryLinkIndex();
    const low = text.toLowerCase();
    let i = 0;
    let out = "";
    while (i < text.length) {
      let hit = null;
      const bucket = idx.byFirst.get(low[i]);
      if (bucket) {
        for (const e of bucket) {
          if (low.startsWith(e.low, i)) {
            // 英文詞避免黏在別的英文字中間
            if (/^[a-z0-9%]/i.test(e.key)) {
              const prev = text[i - 1] || "";
              const nxt = text[i + e.len] || "";
              if (/[a-z0-9]/i.test(prev) || /[a-z0-9]/i.test(nxt)) continue;
            }
            hit = e;
            break;
          }
        }
      }
      if (hit) {
        const piece = escapeHtml(text.slice(i, i + hit.len));
        if (seen && seen.has(hit.id)) {
          out += piece;
        } else {
          if (seen) seen.add(hit.id);
          out += '<button type="button" class="gloss-inline" data-term-id="' + escapeHtml(hit.id) + '">' + piece + "</button>";
        }
        i += hit.len;
      } else {
        out += escapeHtml(text[i]);
        i += 1;
      }
    }
    return out;
  }

  function findTermsInText(blob, limit) {
    const text = String(blob || "").toLowerCase();
    const { entries } = glossaryLinkIndex();
    const found = [];
    const seen = new Set();
    for (const e of entries) {
      if (seen.has(e.id)) continue;
      if (text.includes(e.low)) {
        seen.add(e.id);
        const t = getTerm(e.id);
        if (t) found.push(t);
        if (found.length >= (limit || 8)) break;
      }
    }
    return found;
  }
  function termByName(name) {
    const list = (state.glossaryData && state.glossaryData.terms) || [];
    return list.find((t) => t.term === name) || list.find((t) => (t.aliases || []).includes(name)) || null;
  }
  function termFigure(t) {
    if (!t) return null;
    const f = (t.figures && t.figures[0]) || t.diagram || null;
    return f && f.src ? f : null;
  }

  // —— 名詞小卡（popover，不換頁）——
  let popTermId = null;
  let popReturnFocus = null;
  function showTermPop(id) {
    const t = getTerm(id);
    if (!t) return;
    popTermId = id;
    popReturnFocus = document.activeElement;
    $("#gpop-cat").textContent = "📘 " + (t.category || "名詞") + (t.highYield ? " · 考過常提" : "");
    $("#gpop-title").textContent = t.term + ((t.aliases || []).length ? "（" + t.aliases.slice(0, 2).join("、") + "）" : "");
    $("#gpop-line").textContent = t.oneLiner || (t.explain || [])[0] || "";
    const f = termFigure(t);
    const fig = $("#gpop-fig");
    fig.innerHTML = f ? '<img src="' + escapeHtml(f.src) + '" alt="' + escapeHtml(f.caption || t.term) + '" loading="lazy" />' : "";
    fig.hidden = !f;
    const ex = $("#gpop-ex");
    ex.textContent = t.example ? "例子：" + t.example : "";
    ex.hidden = !t.example;
    $("#gpop").hidden = false;
    $("#gpop-backdrop").hidden = false;
    requestAnimationFrame(() => $("#gpop").classList.add("open"));
    setTimeout(() => $("#gpop-ok").focus(), 50);
  }
  function hideTermPop() {
    const p = $("#gpop");
    if (!p || p.hidden) return;
    p.classList.remove("open");
    p.hidden = true;
    $("#gpop-backdrop").hidden = true;
    if (popReturnFocus && popReturnFocus.focus) try { popReturnFocus.focus({ preventScroll: true }); } catch (_) {}
  }

  function renderLessonGlossaryChips(les) {
    const label = $("#lesson-gloss-label");
    const box = $("#lesson-glossary-chips");
    if (!box) return;
    box.innerHTML = "";
    const pre = new Set((les.prereqTerms || []).map((n) => (termByName(n) || {}).id));
    const seen = new Set();
    const fromKw = [];
    (les.keywords || []).forEach((kw) => {
      findTermsInText(kw, 2).forEach((t) => {
        if (!seen.has(t.id) && !pre.has(t.id)) { seen.add(t.id); fromKw.push(t); }
      });
    });
    const all = fromKw.slice(0, 12);
    if (!all.length) {
      if (label) label.classList.add("hidden");
      return;
    }
    if (label) label.classList.remove("hidden");
    box.innerHTML = all.map((t) => '<button type="button" class="link-chip gloss-chip" data-term-id="' + escapeHtml(t.id) + '">📘 ' + escapeHtml(t.term) + "</button>").join("");
  }

  function renderLessonList() {
    const box = $("#lesson-list");
    box.innerHTML = "";
    const learned = learnedLessonIds();
    const order = pathSteps().map((s) => s.lessonId);
    const lessons = state.lessonsData.lessons.slice().sort((a, b) => {
      const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
    lessons.forEach((les, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lesson-card" + (les.highYield ? " high-yield" : "") + (learned.has(les.id) ? " done" : "");
      const hy = les.highYield ? ' <span class="hy-badge">考過常提</span>' : "";
      btn.innerHTML = `<span class="lc-icon">${learned.has(les.id) ? "✅" : les.icon || "📖"}</span>
        <span class="lc-title">${i + 1}. ${escapeHtml(les.title)}${hy}</span>
        <span class="lc-sum">${escapeHtml(les.keyPoint || les.summary || "")}</span>`;
      btn.addEventListener("click", () => openLesson(les.id, "lessons"));
      box.appendChild(btn);
    });
  }

  const KIND_LABEL = { anim: "動畫", anatomy: "真實解剖", diagram: "圖解" };
  function figureHtml(f) {
    const src = escapeHtml(f.src);
    const kind = f.kind || (/\/anim\//.test(f.src) ? "anim" : /\/anatomy\//.test(f.src) ? "anatomy" : "diagram");
    const cap = escapeHtml(f.caption || "圖解");
    const credit = f.credit ? escapeHtml(f.credit) : "";
    return (
      '<figure class="lesson-figure fig-kind-' + kind + '" data-src="' + src + '" data-kind="' + kind + '"' +
      (f.figId ? ' data-fig="' + escapeHtml(f.figId) + '"' : "") +
      ' data-cap="' + cap + '" data-credit="' + credit + '">' +
      '<div class="fig-media"><img src="' + src + '" alt="' + cap + '" loading="lazy" decoding="async" /></div>' +
      '<div class="fig-tools"><button type="button" class="fig-btn fig-zoom">🔍 放大看</button>' +
      (kind === "anim" ? '<button type="button" class="fig-btn fig-play" hidden>⏸ 暫停</button>' : "") +
      "</div>" +
      "<figcaption><strong>" + (KIND_LABEL[kind] || "圖解") + "</strong> · " + cap +
      (credit ? '<small class="fig-credit">圖源：' + credit + "</small>" : "") +
      "</figcaption></figure>"
    );
  }

  function renderFigures(containerId, figures) {
    const box = $("#" + containerId);
    if (!box) return;
    const list = Array.isArray(figures) ? figures.filter((f) => f && f.src) : [];
    if (!list.length) {
      box.innerHTML = "";
      box.hidden = true;
      box.classList.add("hidden");
      return;
    }
    box.hidden = false;
    box.classList.remove("hidden");
    box.innerHTML = list.map(figureHtml).join("");
    if (window.BCFig && typeof window.BCFig.enhance === "function") window.BCFig.enhance(box);
  }

  function tableHtml(t) {
    const headers = t.headers || [];
    const head = headers.map((h, i) => '<th scope="col"' + (i === 0 ? ' class="lt-first"' : "") + ">" + escapeHtml(h) + "</th>").join("");
    const rows = t.rows.map((r) => "<tr>" + r.map((cell, i) =>
      i === 0 ? '<th scope="row" class="lt-first">' + escapeHtml(cell) + "</th>"
        : '<td data-label="' + escapeHtml(headers[i] || "") + '">' + (cell ? escapeHtml(cell) : '<span class="muted">—</span>') + "</td>").join("") + "</tr>").join("");
    const cap = escapeHtml(t.caption || "表格");
    return '<section class="lesson-table-wrap"><div class="lesson-table-cap">📊 ' + cap + '</div><div class="lesson-table-scroll"><table class="lesson-table" aria-label="' + cap + '">' +
      (head ? "<thead><tr>" + head + "</tr></thead>" : "") + "<tbody>" + rows + "</tbody></table></div>" +
      (t.note ? '<p class="lesson-table-note">' + escapeHtml(t.note) + "</p>" : "") + "</section>";
  }

  /** 課文文字版表格（無障礙／可縮放）*/
  function renderLessonTables(containerId, tables) {
    const box = $("#" + containerId);
    if (!box) return;
    const list = Array.isArray(tables) ? tables.filter((t) => t && Array.isArray(t.rows)) : [];
    box.hidden = !list.length;
    box.innerHTML = list.map(tableHtml).join("");
  }

  // —— 課文切塊：把長段落變成「小標題＋標籤列＋短句」——
  const ROW_LABELS = {
    "一句白話": "💬 白話", "白話怎麼做": "📝 怎麼做", "白話位置": "📍 在哪裡", "白話": "💬 白話",
    "生活示範": "🏠 生活示範", "生活例子": "🏠 生活例子", "例子": "🏠 例子", "例": "🏠 例子",
    "生活比喻": "🧩 比喻", "比喻": "🧩 比喻", "形狀": "🧩 形狀像", "照鏡子": "🪞 照鏡子", "怎麼摸": "👆 怎麼摸",
    "跟肌／動作": "🔗 跟肌肉／動作", "主要": "🧭 關節／平面／動作", "主力肌": "💪 主力肌", "主力": "💪 主力肌",
    "易混": "⚠️ 別搞混", "易錯": "⚠️ 常見錯誤", "變體注意": "🔧 小技巧", "口訣": "💡 口訣", "記住": "💡 記住",
    "算法": "🧮 算法", "重點": "⭐ 重點", "答": "✅ 答案", "影片的說法": "🎬 影片說", "燃料": "⛽ 燃料", "速度": "🏎️ 速度",
    "圖": "",
  };
  const ROW_RE = new RegExp("(^|[。；！？\\s])(" + Object.keys(ROW_LABELS).sort((a, b) => b.length - a.length).join("|") + ")：", "g");
  const INTRO_TAGS = /這課在講什麼|給完全|為什麼你會卡|對講義|給新手/;

  function cleanLessonText(t) {
    return String(t || "")
      .replace(/[（(]?\s*(→\s*)?(每個動作的照鏡子步驟見\s*L\d+；\s*)?圖見?\s*[：:]?\s*[A-Za-z][\w\-]*(\.svg)?(\s*[①-⑳])?\s*[)）]?[。；]?/g, "")
      .replace(/→\s*圖\s*[A-Za-z][\w\-]*\.svg[。]?/g, "")
      .replace(/\s*[A-Za-z][\w\-]*\.svg/g, "")
      .replace(/\s+$/, "");
  }

  function lessonRefLabel(id) {
    const st = stepByLesson(id);
    const les = getLesson(id);
    return st ? st.title : les ? les.title.replace(/（.*?）/g, "") : id;
  }
  function textToHtml(text, seen) {
    // 先把 L17 這類課號換成占位，再做名詞連結
    const refs = [];
    const t = String(text).replace(/\bL(\d{2})\b/g, (m) => {
      if (!getLesson(m)) return m;
      refs.push(m);
      return "\u0001" + (refs.length - 1) + "\u0002";
    });
    let html = linkifyGlossaryHtml(t, seen);
    html = html.replace(/\u0001(\d+)\u0002/g, (m, n) => {
      const id = refs[+n];
      return '<button type="button" class="lesson-ref" data-lesson="' + id + '">《' + escapeHtml(lessonRefLabel(id)) + "》</button>";
    });
    // ①②③ 步驟換行
    html = html.replace(/(\S)\s*([①-⑨])/g, "$1<br>$2");
    return html;
  }
  function sentencesHtml(text, seen) {
    const t = String(text).trim();
    if (t.length <= 110) return "<p>" + textToHtml(t, seen) + "</p>";
    const parts = t.match(/[^。！？]+[。！？]?[」』）)]?/g) || [t];
    const chunks = [];
    let cur = "";
    parts.forEach((x) => {
      if (cur && (cur + x).length > 80) { chunks.push(cur); cur = x; } else cur += x;
    });
    if (cur.trim()) chunks.push(cur);
    return chunks.map((c) => "<p>" + textToHtml(c.trim(), seen) + "</p>").join("");
  }
  function rowsHtml(text, seen) {
    const marks = [];
    let m;
    ROW_RE.lastIndex = 0;
    while ((m = ROW_RE.exec(text))) marks.push({ at: m.index + m[1].length, label: m[2], start: m.index + m[0].length });
    if (marks.length < 2) return sentencesHtml(text, seen);
    let html = "";
    const lead = text.slice(0, marks[0].at).trim();
    if (lead) html += sentencesHtml(lead, seen);
    html += '<dl class="lrows">';
    marks.forEach((mk, i) => {
      const end = i + 1 < marks.length ? marks[i + 1].at : text.length;
      const val = text.slice(mk.start, end).trim().replace(/[。；]$/, "");
      const lab = ROW_LABELS[mk.label];
      if (!lab || !val) return; // 「圖：」列改成就近放圖
      const cls = /易混|易錯/.test(mk.label) ? " warn" : /主力/.test(mk.label) ? " muscle" : /白話/.test(mk.label) ? " plain" : "";
      html += '<div class="lrow' + cls + '"><dt>' + lab + "</dt><dd>" + textToHtml(val, seen) + "</dd></div>";
    });
    return html + "</dl>";
  }

  function parseLessonSections(les) {
    const secs = [];
    (les.body || []).forEach((raw) => {
      const p = cleanLessonText(raw);
      if (!p) return;
      let m = p.match(/^[═━─=]{3,}\s*(.+?)\s*[═━─=]{3,}$/);
      if (m) { secs.push({ kind: "group", title: m[1].replace(/圖[:：].*$/, "").trim(), text: "" }); return; }
      m = p.match(/^【([^】〕]{1,40})[】〕]\s*([\s\S]*)$/);
      if (m) { secs.push({ kind: "card", title: m[1].trim(), text: m[2] }); return; }
      m = p.match(/^〔([^〕]{1,20})〕\s*([\s\S]*)$/);
      if (m && INTRO_TAGS.test(m[1])) { secs.push({ kind: "intro", title: m[1], text: m[2] }); return; }
      secs.push({ kind: "p", title: "", text: p });
    });
    return secs;
  }

  function capTokens(cap) {
    const head = String(cap || "").split("｜")[0];
    return head.split(/[\s／/、：:（）()＋+＝=≠·・,，]+|vs/).map((x) => x.trim()).filter((x) => x.length >= 2);
  }
  function placeByScore(secs, items, getCap, rawBodies) {
    // 回傳 { placed: Map(secIndex -> [item]), rest: [item] }
    const placed = new Map();
    const rest = [];
    const secTerms = secs.map((s) => new Set(findTermsInText(s.title + " " + s.text, 40).map((t) => t.id)));
    items.forEach((it) => {
      const toks = capTokens(getCap(it));
      const capTerms = findTermsInText(getCap(it), 20).map((t) => t.id);
      const base = it.src ? String(it.src).split("/").pop().replace(/\.svg$/, "") : "";
      let best = -1, bestScore = 0;
      secs.forEach((s, i) => {
        if (s.kind === "group") return;
        let sc = 0;
        toks.forEach((tk) => {
          if (s.title.includes(tk)) sc += 2;
          else if (s.text.includes(tk)) sc += 1;
        });
        if (base && rawBodies[i] && rawBodies[i].includes(base.replace(/^anim-|^os-|^bp3d-/, ""))) sc += 3;
        capTerms.forEach((id) => { if (secTerms[i].has(id)) sc += 1; });
        if (sc > bestScore) { bestScore = sc; best = i; }
      });
      if (best >= 0 && bestScore >= 2) {
        if (!placed.has(best)) placed.set(best, []);
        placed.get(best).push(it);
      } else rest.push(it);
    });
    return { placed, rest };
  }

  let lessonSecEls = [];
  function openLesson(lessonId, backTo, opts) {
    const les = getLesson(lessonId);
    if (!les) return;
    opts = opts || {};
    state.currentLessonId = lessonId;
    state.afterLesson = backTo || state.afterLesson || "lessons";
    const st = stepByLesson(lessonId);
    if (st) state.pathStepId = st.id;
    const steps = pathSteps();
    const u = st ? unitOfStep(st.id) : null;
    $("#lesson-badge").textContent = (les.icon || "📖") + " " +
      (u ? "單元 " + (u.index + 1) + "・" + u.unit.title : "觀念課文") + (les.highYield ? " · 考過常提" : "");
    $("#lesson-title").textContent = les.title;
    const done = doneSet();
    $("#lesson-meta").textContent =
      (st ? "第 " + (steps.indexOf(st) + 1) + " / " + steps.length + " 關・" : "") +
      "約 " + readMinutes(les) + " 分鐘讀完" + (st && done.has(st.id) ? "・✅ 已完成" : "");
    // 一句話重點
    const kpBox = $("#lesson-keypoint");
    $("#lesson-keypoint-text").textContent = les.keyPoint || les.summary || "";
    kpBox.classList.toggle("hidden", !(les.keyPoint || les.summary));
    // 先懂這些詞
    const pre = (les.prereqTerms || []).map(termByName).filter(Boolean);
    $("#lesson-prereq").classList.toggle("hidden", !pre.length);
    $("#lesson-prereq-chips").innerHTML = pre.map((t) =>
      '<button type="button" class="link-chip gloss-chip prereq-chip" data-term-id="' + escapeHtml(t.id) + '"><b>' + escapeHtml(t.term) + "</b><small>" + escapeHtml((t.oneLiner || "").slice(0, 40)) + "</small></button>").join("");

    // 內文切塊
    const secs = parseLessonSections(les);
    const rawBodies = secs.map((s) => s.title + " " + s.text);
    // 舊內文提到的 svg 檔名也拿來配對
    (les.body || []).forEach((raw) => {
      const fn = String(raw).match(/([a-z][\w-]*)\.svg|girdle-6|joint-8/g);
      if (!fn) return;
      const clean = cleanLessonText(raw);
      const i = secs.findIndex((s) => clean.includes(s.text.slice(0, 20)) && s.text);
      if (i >= 0) rawBodies[i] += " " + fn.join(" ").replace(/girdle-6/g, "shoulder-girdle-6").replace(/joint-8/g, "shoulder-joint-8");
    });
    const figs = (les.figures || (les.figure ? [les.figure] : [])).filter((f) => f && f.src);
    const figPlace = placeByScore(secs, figs, (f) => f.caption, rawBodies);
    const tabs = (les.tables || []).filter((t) => t && Array.isArray(t.rows));
    const tabPlace = placeByScore(secs, tabs, (t) => t.caption, rawBodies);
    // 沒配到的第一張圖放在第一段後面（先看圖）
    if (figPlace.rest.length && secs.length) {
      const first = figPlace.rest.shift();
      const k = secs.findIndex((s) => s.kind !== "group");
      if (!figPlace.placed.has(k)) figPlace.placed.set(k, []);
      figPlace.placed.get(k).unshift(first);
    }
    const seen = new Set();
    let html = "";
    let cardNo = 0;
    const toc = [];
    secs.forEach((s, i) => {
      const sid = "ls-" + i;
      if (s.kind === "group") {
        html += '<h3 class="lesson-group" id="' + sid + '">' + escapeHtml(s.title) + "</h3>";
        toc.push({ sid, title: s.title, group: true });
      } else {
        const cls = s.kind === "intro" ? "lesson-chunk intro" : "lesson-chunk";
        let head = "";
        if (s.kind === "card") {
          cardNo++;
          head = '<h4 class="chunk-title">' + escapeHtml(s.title) + "</h4>";
          toc.push({ sid, title: s.title });
        } else if (s.kind === "intro") {
          head = '<div class="chunk-tag">👋 ' + escapeHtml(s.title) + "</div>";
        }
        html += '<section class="' + cls + '" id="' + sid + '" data-sec="' + i + '">' + head + rowsHtml(s.text, seen) + "</section>";
      }
      (figPlace.placed.get(i) || []).forEach((f) => { html += '<div class="inline-fig">' + figureHtml(f) + "</div>"; });
      (tabPlace.placed.get(i) || []).forEach((t) => { html += tableHtml(t); });
    });
    const body = $("#lesson-body");
    body.innerHTML = html;
    lessonSecEls = $$(".lesson-chunk, .lesson-group", body);
    if (window.BCFig && window.BCFig.enhance) window.BCFig.enhance(body);
    renderLessonTables("lesson-tables", tabPlace.rest);
    renderFigures("lesson-figures", figPlace.rest);
    if (figPlace.rest.length) {
      $("#lesson-figures").insertAdjacentHTML("afterbegin", '<div class="section-label">更多圖解</div>');
    }
    // 目錄
    const tocBox = $("#lesson-toc");
    const tocItems = toc.filter((x) => !x.group);
    if (tocItems.length >= 5) {
      tocBox.classList.remove("hidden");
      tocBox.innerHTML = '<details><summary>📑 本課目錄（' + tocItems.length + ' 段・點一下直接跳過去）</summary><div class="toc-list">' +
        toc.map((x) => '<button type="button" class="toc-item' + (x.group ? " grp" : "") + '" data-jump="' + x.sid + '">' + escapeHtml(x.title) + "</button>").join("") + "</div></details>";
    } else {
      tocBox.classList.add("hidden");
      tocBox.innerHTML = "";
    }
    // 舊關鍵詞列隱藏（改用名詞小卡）
    $("#lesson-keywords").innerHTML = "";
    renderLessonGlossaryChips(les);
    const pit = $("#lesson-pitfalls");
    if (pit) {
      const list = les.pitfalls || [];
      if (list.length) {
        pit.classList.remove("hidden");
        pit.innerHTML = '<div class="mnemonic-label">⚠️ 新手最常搞錯</div><ul>' + list.map((x) => "<li>" + textToHtml(cleanLessonText(x), seen) + "</li>").join("") + "</ul>";
      } else {
        pit.classList.add("hidden");
        pit.innerHTML = "";
      }
    }
    renderMnemonicInline("lesson-mnemonics", (les.mnemonicIds || []).slice(0, 4));
    // 結尾
    $("#lesson-confused-help").classList.add("hidden");
    $("#lesson-confused-help").innerHTML = "";
    const hasQuiz = les.quiz && les.quiz.length;
    $("#btn-lesson-ok").textContent = hasQuiz ? "✅ 我懂了，做小測驗（" + les.quiz.length + " 題）" : "✅ 我懂了，下一課";
    // 上一課／下一課
    const order = steps.length ? steps.map((x) => x.lessonId) : state.lessonsData.lessons.map((l) => l.id);
    const k = order.indexOf(lessonId);
    const prevId = k > 0 ? order[k - 1] : null;
    const nextId = k >= 0 && k < order.length - 1 ? order[k + 1] : null;
    const bp = $("#btn-lesson-prev"), bn = $("#btn-lesson-next");
    bp.disabled = !prevId; bn.disabled = !nextId;
    bp.textContent = prevId ? "‹ 上一課：" + lessonRefLabel(prevId) : "‹ 上一課";
    bn.textContent = nextId ? "下一課：" + lessonRefLabel(nextId) + " ›" : "下一課 ›";
    bp.dataset.lesson = prevId || "";
    bn.dataset.lesson = nextId || "";
    showView("lesson");
    const prevLast = BCSStorage.getUX().last;
    const keep = prevLast && prevLast.lessonId === lessonId ? prevLast.scroll || 0 : 0;
    BCSStorage.setUX({ last: { lessonId, scroll: opts.scrollPct || keep, at: Date.now() } });
    _rpT = Date.now();
    updateReadProgress();
    if (opts.scrollPct) {
      setTimeout(() => {
        const v = $("#view-lesson");
        const top = v.offsetTop, h = v.offsetHeight - innerHeight;
        window.scrollTo(0, top + Math.max(0, h) * opts.scrollPct);
        toast("已回到上次讀到的位置");
      }, 120);
    }
    if (opts.focus) setTimeout(() => focusLessonSection(opts.focus), 150);
  }

  function focusLessonSection(text) {
    const want = findTermsInText(text, 8).map((t) => [t.term].concat(t.aliases || []));
    const words = String(text).split(/[\s，。、：；？！（）()「」]+/).filter((w) => w.length >= 2 && w.length <= 8);
    let best = null, bestSc = 0;
    lessonSecEls.forEach((el) => {
      if (!el.classList.contains("lesson-chunk")) return;
      const tx = el.textContent;
      let sc = 0;
      want.forEach((names) => { if (names.some((n) => tx.includes(n))) sc += 2; });
      words.forEach((w) => { if (tx.includes(w)) sc += 1; });
      if (sc > bestSc) { bestSc = sc; best = el; }
    });
    if (!best) return;
    const y = best.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
    best.classList.remove("flash");
    void best.offsetWidth;
    best.classList.add("flash");
    toast("👉 就是這一段");
  }

  let _rpT = 0;
  let _rpTimer = 0;
  function updateReadProgress() {
    if (state.view !== "lesson") return;
    const v = $("#view-lesson");
    const h = v.offsetHeight - innerHeight;
    const pct = h > 0 ? Math.min(1, Math.max(0, (window.scrollY - v.offsetTop) / h)) : 1;
    const fill = $("#read-progress-fill");
    if (fill) fill.style.width = Math.round(pct * 100) + "%";
    clearTimeout(_rpTimer);
    const lid = state.currentLessonId;
    _rpTimer = setTimeout(() => {
      if (state.view !== "lesson" || state.currentLessonId !== lid || !lid) return;
      BCSStorage.setUX({ last: { lessonId: lid, scroll: pct > 0.97 ? 0 : pct, at: Date.now() } });
      if (pct > 0.85) BCSStorage.markLessonRead(lid);
    }, 500);
  }

  function lessonConfused() {
    const les = getLesson(state.currentLessonId);
    if (!les) return;
    const fb = BCSStorage.getUX().feedback || {};
    fb[les.id] = "confused";
    BCSStorage.setUX({ feedback: fb });
    const box = $("#lesson-confused-help");
    const terms = (les.prereqTerms || []).map(termByName).filter(Boolean);
    findTermsInText((les.keywords || []).join(" "), 10).forEach((t) => { if (!terms.includes(t)) terms.push(t); });
    const anims = $$("#lesson-body figure.lesson-figure, #lesson-figures figure.lesson-figure").slice(0, 4);
    box.innerHTML =
      '<p class="confused-lead">沒關係！換個方式再來一次 👇</p>' +
      '<div class="confused-step"><b>① 先把這些詞弄懂</b>（點一下看白話＋圖）<div class="link-chip-row">' +
      terms.slice(0, 10).map((t) => '<button type="button" class="link-chip gloss-chip" data-term-id="' + escapeHtml(t.id) + '">📘 ' + escapeHtml(t.term) + "</button>").join("") + "</div></div>" +
      (anims.length ? '<div class="confused-step"><b>② 看圖／動畫</b><div class="link-chip-row">' +
        anims.map((f, i) => '<button type="button" class="link-chip" data-fig-jump="' + i + '">🎞️ ' + escapeHtml((f.getAttribute("data-cap") || "圖").split("｜")[0].slice(0, 22)) + "</button>").join("") + "</div></div>" : "") +
      '<div class="confused-step"><b>' + (anims.length ? "③" : "②") + ' 直接問教練</b><p class="muted small">會用站內課文、辭典回答你；問題可以改成你自己的話。</p>' +
      '<button type="button" class="btn primary" id="btn-ask-coach-lesson">🏋️ 問教練「' + escapeHtml(les.title.replace(/（.*?）/g, "")) + "」</button></div>" +
      '<div class="confused-step"><b>' + (anims.length ? "④" : "③") + ' 回到最上面重看一句話重點</b><button type="button" class="btn ghost" id="btn-lesson-top">⬆ 回到重點</button></div>';
    box.classList.remove("hidden");
    $$("[data-fig-jump]", box).forEach((b) => b.addEventListener("click", () => {
      const f = anims[+b.getAttribute("data-fig-jump")];
      if (f) { f.scrollIntoView({ behavior: "smooth", block: "center" }); f.classList.remove("flash"); void f.offsetWidth; f.classList.add("flash"); }
    }));
    $("#btn-ask-coach-lesson").addEventListener("click", () => {
      if (window.BCoachChat && window.BCoachChat.ask) window.BCoachChat.ask(les.title.replace(/（.*?）/g, "") + " 是在講什麼？");
    });
    $("#btn-lesson-top").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function lessonOk() {
    const les = getLesson(state.currentLessonId);
    if (!les) return;
    const fb = BCSStorage.getUX().feedback || {};
    fb[les.id] = "ok";
    BCSStorage.setUX({ feedback: fb });
    BCSStorage.markLessonRead(les.id);
    if (les.quiz && les.quiz.length) startLessonPractice();
    else {
      const st = stepByLesson(les.id);
      if (st) BCSStorage.markPathStepDone(st.id);
      const nx = $("#btn-lesson-next").dataset.lesson;
      if (nx) openLesson(nx, "path"); else { renderPath(); showView("path"); }
    }
  }

  function nextPathStep() {
    const steps = pathSteps();
    const done = doneSet();
    return steps.find((s) => !done.has(s.id)) || null;
  }

  function renderPath() {
    const steps = pathSteps();
    const done = doneSet();
    const next = nextPathStep();
    const n = steps.filter((s) => done.has(s.id)).length;
    $("#path-progress-summary").innerHTML =
      '<div class="pps-bar"><i style="width:' + (steps.length ? (n / steps.length) * 100 : 0) + '%"></i></div>' +
      "已完成 <strong>" + n + "</strong> / " + steps.length + " 關" +
      (next ? "・下一關：" + escapeHtml(next.title) : "・全部完成，太棒了！🎉");
    const unitsBox = $("#path-units");
    const units = pathUnits();
    const learned = learnedLessonIds();
    const stepHtml = (step) => {
      const i = steps.indexOf(step);
      const les = getLesson(step.lessonId) || {};
      const isDone = done.has(step.id);
      const isCur = next && next.id === step.id;
      const read = !isDone && learned.has(step.lessonId);
      return '<button type="button" class="path-step' + (isDone ? " done" : "") + (isCur ? " current" : "") + '" data-step="' + step.id + '">' +
        '<span class="path-step-num">' + (isDone ? "✓" : i + 1) + "</span>" +
        '<span class="path-step-main"><span class="path-step-title">' + escapeHtml(step.title) + "</span>" +
        '<span class="path-step-sub">' + escapeHtml((les.keyPoint || "").slice(0, 34)) + ((les.keyPoint || "").length > 34 ? "…" : "") + "</span></span>" +
        '<span class="path-step-meta">' + (isDone ? "已完成" : isCur ? "▶ 下一關" : read ? "讀過・未測驗" : "約 " + readMinutes(les) + " 分") + "</span></button>";
    };
    if (units.length) {
      unitsBox.innerHTML = units.map((u, ui) => {
        const ss = (u.steps || []).map((id) => steps.find((s) => s.id === id)).filter(Boolean);
        const d = ss.filter((s) => done.has(s.id)).length;
        const hasCur = next && ss.includes(next);
        const allDone = d === ss.length;
        return '<details class="path-unit' + (allDone ? " done" : "") + (hasCur ? " current" : "") + '"' + (hasCur || (!next && ui === 0) ? " open" : "") + ">" +
          '<summary><span class="pu-icon">' + (allDone ? "✅" : u.icon || "📘") + '</span><span class="pu-main"><span class="pu-title">單元 ' + (ui + 1) + "・" + escapeHtml(u.title) + "</span>" +
          '<span class="pu-desc">' + escapeHtml(u.desc || "") + '</span><span class="pu-bar"><i style="width:' + (ss.length ? (d / ss.length) * 100 : 0) + '%"></i></span></span>' +
          '<span class="pu-count">' + d + "/" + ss.length + "</span></summary>" +
          '<div class="path-steps">' + ss.map(stepHtml).join("") + "</div></details>";
      }).join("");
    } else {
      unitsBox.innerHTML = '<div class="path-steps">' + steps.map(stepHtml).join("") + "</div>";
    }
    $$("[data-step]", unitsBox).forEach((b) => b.addEventListener("click", () => startPathStep(b.getAttribute("data-step"))));
    $("#btn-path-continue").textContent = next ? "▶ 繼續：" + next.title : "全部完成 · 去練習區";
  }

  function startPathStep(stepId) {
    const step = pathSteps().find((s) => s.id === stepId);
    if (!step) return;
    state.pathStepId = stepId;
    openLesson(step.lessonId, "path");
  }

  function startLessonPractice() {
    const les = getLesson(state.currentLessonId);
    if (!les || !les.quiz || !les.quiz.length) {
      toast("這課沒有小測驗，直接看下一課吧！");
      return;
    }
    const st = stepByLesson(les.id);
    state.pathQuiz = !!st;
    if (st) state.pathStepId = st.id;
    state.quizMode = "practice";
    const lessonMns = les.mnemonicIds || [];
    state.quizList = les.quiz.map((q, i) => ({
      id: les.id + "-q" + i,
      q: q.q,
      options: q.options.slice(),
      answer: q.answer,
      explain: q.explain,
      hint: q.hint || "",
      chapter: les.title,
      source: "lesson",
      lessonId: les.id,
      mnemonicId: lessonMns[i % Math.max(lessonMns.length, 1)] || lessonMns[0] || null,
    }));
    state.quizIndex = 0;
    state.quizScore = 0;
    state.quizAnswered = false;
    showView("quiz");
    renderQuiz();
  }

  function startLessonCards() {
    const les = getLesson(state.currentLessonId);
    if (!les) return;
    state.selectedChapters = new Set(les.chapterIds || []);
    state.studyLevel = "basic";
    state.mode = "study";
    state.studyLearnedOnly = false;
    startStudy(true);
  }

  // —— Study / SRS ——
  function startStudy(doShuffle) {
    state.mode = "study";
    const lo = !!state.studyLearnedOnly;
    let deck = filterCards(state.selectedChapters, state.studyLevel, lo);
    if (doShuffle) deck = shuffle(deck);
    if (!deck.length) {
      toast(lo ? "你還沒讀完任何一課，先去學習路徑讀第一關，或取消「只出我學過的課」。" : "這個篩選沒有卡片，換成「全部」或其他章節試試。", 4200);
      return;
    }
    state.cardsSeen = 0;
    state.deck = deck;
    state.index = 0;
    state.flipped = false;
    $("#study-nav").classList.remove("hidden");
    $("#srs-nav").classList.add("hidden");
    showView("card");
    renderCard();
  }

  function startSRS() {
    state.mode = "srs";
    const limit = Math.max(
      5,
      Math.min(100, parseInt($("#srs-limit").value, 10) || 20)
    );
    const pool = filterCards(state.selectedChapters, state.srsLevel, !!($("#srs-learned") || {}).checked);
    const srs = BCSStorage.getSRS();
    const now = Date.now();
    const due = [];
    const fresh = [];
    pool.forEach((c) => {
      const st = srs[c.id];
      if (!st) fresh.push(c);
      else if (SM2.isDue(st, now)) due.push(c);
    });
    let deck = shuffle(due).concat(shuffle(fresh));
    deck = deck.slice(0, limit);
    if (!deck.length) {
      toast("目前沒有要複習的卡片 👍（可以取消「只排我學過的課」或換章節）", 4000);
      return;
    }
    state.deck = deck;
    state.index = 0;
    state.flipped = false;
    $("#study-nav").classList.add("hidden");
    $("#srs-nav").classList.remove("hidden");
    $$("#srs-nav .btn").forEach((b) => (b.disabled = true));
    showView("card");
    renderCard();
  }

  function renderCard() {
    const card = state.deck[state.index];
    if (!card) return;
    $("#card-q").textContent = card.q;
    // Split formal answer vs plain line if present
    const parts = String(card.a || "").split(/\n（白話）/);
    $("#card-a").textContent = parts[0];
    const plainEl = $("#card-plain");
    const plain = card.plain || parts[1] || "";
    if (plain) {
      plainEl.textContent = "白話：" + plain;
      plainEl.style.display = "";
    } else {
      plainEl.textContent = "";
      plainEl.style.display = "none";
    }
    const mnBox = $("#card-mnemonic");
    const mnText = $("#card-mnemonic-text");
    const mn =
      getMnemonic(card.mnemonicId) ||
      (card.mnemonic ? { trick: card.mnemonic } : null);
    if (mn && mn.trick) {
      mnText.textContent = mn.trick;
      mnBox.classList.remove("hidden");
    } else {
      mnText.textContent = "";
      mnBox.classList.add("hidden");
    }
    const lv = card.level === "basic" ? "基礎" : "考試向";
    $("#card-chapter-badge").textContent = `${card.chapter || ""} · ${lv} · ${
      state.index + 1
    }/${state.deck.length}`;
    const pct = ((state.index + 1) / state.deck.length) * 100;
    $("#card-progress-fill").style.width = pct + "%";
    $("#card-progress-text").textContent = `${state.index + 1} / ${
      state.deck.length
    }`;
    const glossHints = $("#card-gloss-hints");
    if (glossHints) {
      const blob = (card.q || "") + " " + (card.a || "") + " " + (card.plain || "");
      const hits = findTermsInText(blob, 4);
      if (hits.length) {
        glossHints.classList.remove("hidden");
        glossHints.innerHTML =
          '<span class="card-gloss-label">看不懂？點名詞</span>' +
          hits
            .map(
              (t) =>
                '<button type="button" class="card-gloss-btn" data-term-id="' +
                escapeHtml(t.id) +
                '">' +
                escapeHtml(t.term) +
                "</button>"
            )
            .join("");

      } else {
        glossHints.classList.add("hidden");
        glossHints.innerHTML = "";
      }
    }
    const fc = $("#flashcard");
    fc.classList.toggle("flipped", state.flipped);
    if (state.mode === "srs") {
      $$("#srs-nav .btn").forEach((b) => (b.disabled = !state.flipped));
    }
  }

  function flipCard() {
    state.flipped = !state.flipped;
    $("#flashcard").classList.toggle("flipped", state.flipped);
    if (state.mode === "srs") {
      $$("#srs-nav .btn").forEach((b) => (b.disabled = !state.flipped));
    }
  }

  function studyNav(delta) {
    const next = state.index + delta;
    if (next >= state.deck.length) {
      BCSStorage.bumpActivity(1);
      toast("這一疊翻完了！🎉 可以回練習區換別的。");
      return;
    }
    if (next < 0) return;
    if (delta > 0) {
      state.cardsSeen = (state.cardsSeen || 0) + 1;
      if (state.cardsSeen % 10 === 0) BCSStorage.bumpActivity(1);
    }
    state.index = next;
    state.flipped = false;
    renderCard();
  }

  function srsGrade(grade) {
    const card = state.deck[state.index];
    if (!card || !state.flipped) return;
    const prev = BCSStorage.getSRS()[card.id];
    const next = SM2.review(prev, grade);
    BCSStorage.updateSRSCard(card.id, next);
    if (state.index + 1 >= state.deck.length) {
      BCSStorage.bumpActivity(1);
      toast("本輪複習完成！進度已存好 👍");
      renderPractice();
      showView("practice");
      return;
    }
    state.index += 1;
    state.flipped = false;
    renderCard();
  }

  function refreshSRSSetup() {
    const srs = BCSStorage.getSRS();
    const now = Date.now();
    let due = 0;
    let fresh = 0;
    const pool = filterCards(state.selectedChapters, state.srsLevel, !!($("#srs-learned") || {}).checked);
    pool.forEach((c) => {
      const st = srs[c.id];
      if (!st) fresh++;
      else if (SM2.isDue(st, now)) due++;
    });
    $("#srs-due-count").textContent = due;
    $("#srs-new-count").textContent = fresh;
  }

  // —— Quiz ——
  function guessMnemonicId(text) {
    const t = String(text || "");
    const rules = [
      [/矢狀|冠狀|額狀|水平面|外展|屈曲/, "mn-planes"],
      [/旋轉肌袖|SITS|棘上|棘下|肩胛下/, "mn-sits"],
      [/肌梭|GTO|高基氏/, "mn-spindle-gto"],
      [/上交叉/, "mn-upper-cross"],
      [/下交叉|骨盆前傾/, "mn-lower-cross"],
      [/ATP|能量系統|醣解|有氧系統/, "mn-energy"],
      [/槓桿/, "mn-lever"],
      [/220|最大心率/, "mn-mhr"],
      [/kcal|醣類|蛋白質|脂肪/, "mn-macro-kcal"],
      [/深蹲|臀大|股四/, "mn-hip-squat"],
      [/向心|離心|等長/, "mn-contraction"],
    ];
    for (const [re, id] of rules) {
      if (re.test(t)) return id;
    }
    return null;
  }

  const EXAM_CAT_LESSONS = { anatomy: ["L01", "L02"], physio: ["L07", "L22"], prescription: ["L24", "L23"], nutrition: ["L09"], special: [] };
  function questionLessons(q) {
    if (q.lessonId) return [q.lessonId];
    if (q._lessons) return q._lessons;
    const blob = q.q + " " + (q.options ? q.options[q.answer] : "") + " " + (q.explain || "");
    const ids = [];
    findTermsInText(blob, 6).forEach((t) => (t.lessonIds || []).forEach((l) => { if (!ids.includes(l) && getLesson(l)) ids.push(l); }));
    (EXAM_CAT_LESSONS[q.chapterId] || []).forEach((l) => { if (!ids.includes(l)) ids.push(l); });
    q._lessons = ids;
    return ids;
  }
  function questionLearned(q, learned) {
    const ls = questionLessons(q);
    if (!ls.length) return learned.size >= pathSteps().length; // 沒對應課文（特殊族群等）→ 全部學完才出
    // 主要對應課（第一個）要學過
    return learned.has(ls[0]) || ls.filter((l) => learned.has(l)).length >= 2;
  }

  function buildQuizFromExam(count, random, learnedOnly) {
    let src = state.examData.questions;
    if (learnedOnly) {
      const learned = learnedLessonIds();
      src = src.filter((q) => questionLearned(q, learned));
    }
    let list = src.map((q) => ({
      id: q.id,
      q: q.q,
      options: q.options.slice(),
      answer: q.answer,
      explain: q.explain,
      hint: q.hint || hintFromExplain(q.explain),
      chapter: q.chapter || q.chapterId,
      chapterId: q.chapterId,
      source: "exam",
      mnemonicId: guessMnemonicId(q.q + " " + (q.explain || "")),
    }));
    if (random) list = shuffle(list);
    return list.slice(0, Math.min(count, list.length));
  }

  function hintFromExplain(explain) {
    if (!explain) return "先排除明顯無關的選項，再想動作平面或主力肌。";
    const s = String(explain);
    return s.length > 36 ? s.slice(0, 34) + "…" : s;
  }

  function buildQuizFromCards(count, random, learnedOnly) {
    const lc = learnedOnly ? learnedChapterIds() : null;
    let pool = state.cardsData.cards.filter(
      (c) =>
        c.a &&
        c.a.length < 280 &&
        c.type !== "tip" &&
        (c.level || "exam") === "basic" &&
        (!lc || lc.has(c.chapterId))
    );
    if (random) pool = shuffle(pool);
    pool = pool.slice(0, Math.min(count * 3, pool.length));
    const result = [];
    for (const c of pool) {
      if (result.length >= count) break;
      const ans = String(c.a).split(/\n（白話）/)[0];
      const same = state.cardsData.cards.filter(
        (x) =>
          x.chapterId === c.chapterId &&
          x.id !== c.id &&
          x.a &&
          (x.level || "exam") === "basic"
      );
      let distractors = shuffle(same)
        .slice(0, 3)
        .map((x) => String(x.a).split(/\n（白話）/)[0]);
      if (distractors.length < 3) {
        const others = shuffle(
          state.cardsData.cards.filter((x) => x.id !== c.id && x.a)
        );
        while (distractors.length < 3 && others.length) {
          distractors.push(String(others.pop().a).split(/\n（白話）/)[0]);
        }
      }
      if (distractors.length < 3) continue;
      const options = shuffle([ans, ...distractors.slice(0, 3)]);
      const answer = options.indexOf(ans);
      result.push({
        id: "auto-" + c.id,
        q: c.q,
        options,
        answer,
        explain: (c.plain || ans),
        hint: "想想這塊肌／觀念的生活例子。",
        chapter: c.chapter,
        chapterId: c.chapterId,
        source: "cards",
        mnemonicId: c.mnemonicId || null,
        mnemonic: c.mnemonic || "",
      });
    }
    return result;
  }

  function startQuiz() {
    const count = Math.max(
      5,
      Math.min(50, parseInt($("#quiz-count").value, 10) || 10)
    );
    const random = $("#quiz-random").checked;
    let list;
    state.pathQuiz = false;
    if (state.fromWrong) {
      list = BCSStorage.getWrong().map((w) => ({
        id: w.id,
        q: w.q,
        options: w.options.slice(),
        answer: w.answer,
        explain: w.explain,
        hint: w.hint || hintFromExplain(w.explain),
        chapter: w.chapter,
        source: w.source || "exam",
      }));
      if (random) list = shuffle(list);
      list = list.slice(0, Math.min(count, list.length));
      state.fromWrong = false;
      state.quizMode = "practice";
    } else {
      const lo = !!($("#quiz-learned") || {}).checked;
      list = state.quizSource === "cards" ? buildQuizFromCards(count, random, lo) : buildQuizFromExam(count, random, lo);
      if (!list.length && lo) {
        toast("你學過的課還沒有對應題目。先去學習路徑多讀幾關，或取消「只出我學過的課」。", 4500);
        return;
      }
    }
    if (!list.length) {
      toast("目前沒有可用題目");
      return;
    }
    state.quizList = list;
    state.quizIndex = 0;
    state.quizScore = 0;
    state.quizAnswered = false;
    showView("quiz");
    renderQuiz();
  }

  function renderQuiz() {
    const item = state.quizList[state.quizIndex];
    const total = state.quizList.length;
    const n = state.quizIndex + 1;
    $("#quiz-progress-fill").style.width = (n / total) * 100 + "%";
    $("#quiz-progress-text").textContent = `${n} / ${total}`;
    const practice = state.quizMode === "practice" || state.pathQuiz;
    $("#quiz-mode-tag").textContent = practice
      ? "練習模式・底線的詞可以點・答錯會告訴你為什麼"
      : "正式計分・模擬考試";
    $("#quiz-q").innerHTML = linkifyGlossaryHtml(item.q, new Set());
    const box = $("#quiz-options");
    box.innerHTML = "";
    state.quizAnswered = false;
    state.hintShown = false;
    $("#btn-quiz-next").disabled = true;
    $("#btn-quiz-next").textContent =
      state.quizIndex + 1 >= total
        ? state.pathQuiz
          ? "完成本關"
          : "看結果"
        : "下一題";
    $("#quiz-explain").classList.add("hidden");
    $("#quiz-explain").innerHTML = "";
    $("#quiz-mnemonic").classList.add("hidden");
    $("#quiz-mnemonic-text").textContent = "";
    const hintBtn = $("#btn-quiz-hint");
    const hintText = $("#quiz-hint-text");
    hintText.classList.add("hidden");
    hintText.textContent = "";
    if (practice && item.hint) {
      hintBtn.classList.remove("hidden");
      hintBtn.disabled = false;
    } else {
      hintBtn.classList.add("hidden");
    }

    item.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn";
      btn.textContent = `${"ABCD"[i]}. ${opt}`;
      btn.addEventListener("click", () => onPickOption(i, btn));
      box.appendChild(btn);
    });
  }

  function onPickOption(i, btn) {
    if (state.quizAnswered) return;
    state.quizAnswered = true;
    const item = state.quizList[state.quizIndex];
    const practice = state.quizMode === "practice" || state.pathQuiz;
    const buttons = $$("#quiz-options .option-btn");
    buttons.forEach((b, idx) => {
      b.disabled = true;
      if (idx === item.answer) b.classList.add("correct");
    });
    if (i === item.answer) {
      state.quizScore += 1;
      btn.classList.add("correct");
    } else {
      btn.classList.add("wrong");
      if (!state.pathQuiz) {
        BCSStorage.addWrong({
          id: item.id,
          q: item.q,
          options: item.options,
          answer: item.answer,
          explain: item.explain,
          hint: item.hint,
          chapter: item.chapter,
          source: item.source,
        });
      }
    }
    const exp = $("#quiz-explain");
    exp.classList.remove("hidden");
    const ok = i === item.answer;
    const seen = new Set();
    let ex = '<div class="ex-head ' + (ok ? "ok" : "bad") + '">' + (ok ? "✅ 答對了！" : "❌ 沒關係，看懂就好") + "</div>" +
      '<p class="ex-answer">正確答案：<b>' + "ABCD"[item.answer] + ". " + escapeHtml(item.options[item.answer]) + "</b></p>" +
      (item.explain ? '<p class="ex-text"><b>💬 為什麼：</b>' + linkifyGlossaryHtml(item.explain, seen) + "</p>" : "");
    if (!ok) {
      const blob = item.q + " " + item.options[item.answer] + " " + (item.explain || "");
      const t = findTermsInText(blob, 6).find((x) => termFigure(x));
      const f = termFigure(t);
      if (f) ex += '<figure class="ex-fig"><img src="' + escapeHtml(f.src) + '" alt="' + escapeHtml(f.caption || t.term) + '" loading="lazy" /><figcaption>📘 ' + escapeHtml(t.term) + "：" + escapeHtml(t.oneLiner || "") + "</figcaption></figure>";
    }
    const lids = questionLessons(item);
    if (lids.length && getLesson(lids[0])) {
      ex += '<button type="button" class="btn ghost ex-lesson" data-ex-lesson="' + escapeHtml(lids[0]) + '">📖 回課文看這段：《' + escapeHtml(lessonRefLabel(lids[0])) + "》</button>";
    }
    ex += '<button type="button" class="btn ghost ex-lesson" data-ex-ask>🏋️ 還是不懂？問教練這題</button>';
    exp.innerHTML = ex;
    const ask = exp.querySelector("[data-ex-ask]");
    if (ask) ask.addEventListener("click", () => {
      const t = findTermsInText(item.q + " " + item.options[item.answer], 1)[0];
      if (window.BCoachChat && window.BCoachChat.ask) window.BCoachChat.ask(t ? t.term + " 是什麼？" : item.q);
    });
    const exb = exp.querySelector("[data-ex-lesson]");
    if (exb) exb.addEventListener("click", () => openLesson(exb.getAttribute("data-ex-lesson"), "quiz", { focus: item.q + " " + item.options[item.answer] + " " + (item.explain || "") }));
    const qm = $("#quiz-mnemonic");
    const qt = $("#quiz-mnemonic-text");
    const mn =
      getMnemonic(item.mnemonicId) ||
      (item.mnemonic ? { trick: item.mnemonic } : null);
    if (mn && mn.trick) {
      qt.textContent = mn.trick;
      qm.classList.remove("hidden");
    } else {
      qt.textContent = "";
      qm.classList.add("hidden");
    }
    $("#btn-quiz-hint").classList.add("hidden");
    $("#btn-quiz-next").disabled = false;
    if (!ok) setTimeout(() => exp.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
  }

  function quizNext() {
    if (!state.quizAnswered) return;
    if (state.quizIndex + 1 >= state.quizList.length) {
      const total = state.quizList.length;
      const score = state.quizScore;
      const pct = Math.round((score / total) * 100);
      BCSStorage.bumpActivity(1);
      const nb = $("#btn-quiz-nextstep");
      if (state.pathQuiz && state.pathStepId) {
        BCSStorage.markPathStepDone(state.pathStepId);
        if (state.currentLessonId) BCSStorage.markLessonRead(state.currentLessonId);
        state.pathQuiz = false;
        state.resultIsPath = true;
        $("#result-score").textContent = pct + "%";
        $("#result-title").textContent = pct >= 60 ? "本關完成！🎉" : "本關完成，再複習一下會更穩";
        const nx = nextPathStep();
        $("#result-detail").textContent =
          `答對 ${score} / ${total}。` + (pct < 60 ? "建議回課文看「一句話重點」和名詞，再前進。" : "進度已存好。") ;
        if (nx) { nb.textContent = "▶ 下一關：" + nx.title; nb.dataset.step = nx.id; nb.classList.remove("hidden"); }
        else { nb.classList.add("hidden"); }
        $("#btn-quiz-retry").textContent = "📖 回這課再看一次";
        $("#btn-quiz-wrong").classList.add("hidden");
        $("#btn-quiz-home").textContent = "🗺️ 回學習路徑";
        showView("quiz-result");
        updateHomeStats();
        return;
      }
      state.resultIsPath = false;
      nb.classList.add("hidden");
      $("#btn-quiz-retry").textContent = "再練一次";
      $("#btn-quiz-wrong").classList.remove("hidden");
      $("#btn-quiz-home").textContent = "回首頁";
      $("#result-score").textContent = pct + "%";
      $("#result-title").textContent =
        state.quizMode === "practice" ? "練習結束" : "測驗結束";
      $("#result-detail").textContent =
        state.quizMode === "practice"
          ? `答對 ${score} / ${total}。練習模式錯題仍會進錯題本方便複習。`
          : `答對 ${score} / ${total} 題。錯題已寫入錯題本。`;
      showView("quiz-result");
      updateHomeStats();
      return;
    }
    state.quizIndex += 1;
    renderQuiz();
  }

  function renderWrong() {
    const list = BCSStorage.getWrong();
    const ul = $("#wrong-list");
    ul.innerHTML = "";
    $("#btn-wrong-quiz").disabled = list.length === 0;
    if (!list.length) {
      ul.innerHTML =
        '<li class="muted" style="padding:12px">目前沒有錯題。</li>';
      return;
    }
    list.forEach((w) => {
      const li = document.createElement("li");
      li.className = "wrong-item";
      li.innerHTML = `<div class="wq">${escapeHtml(w.q)}</div>
        <div class="wa">正解：${escapeHtml(
          "ABCD"[w.answer] + ". " + (w.options[w.answer] || "")
        )}
${escapeHtml(w.explain || "")}</div>`;
      ul.appendChild(li);
    });
  }

  function getExamFocusItem(id) {
    if (!state.examFocusData) return null;
    return state.examFocusData.items.find((x) => x.id === id) || null;
  }

  function renderExamFocusList() {
    const box = $("#exam-focus-list");
    if (!box || !state.examFocusData) return;
    const pri = state.examFocusPriority || "all";
    let items = state.examFocusData.items.slice();
    if (pri === "高" || pri === "中") {
      items = items.filter((x) => x.priority === pri);
    }
    // 高先、再中
    items.sort((a, b) => {
      const rank = { 高: 0, 中: 1 };
      return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
    });
    box.innerHTML = "";
    if (!items.length) {
      box.innerHTML = '<p class="muted" style="padding:8px">這個優先度沒有項目。</p>';
      return;
    }
    items.forEach((it) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "exam-focus-card" + (it.priority === "高" ? " pri-high" : " pri-mid");
      btn.innerHTML = `<span class="ef-pri">${escapeHtml(
        it.priority
      )}優先</span>
        <span class="ef-title">${escapeHtml(it.title)}</span>
        <span class="ef-why">${escapeHtml(it.why)}</span>
        <span class="ef-meta">課文 ${
          (it.lessonIds || []).length
        } · 速記 ${(it.mnemonicIds || []).length}</span>`;
      btn.addEventListener("click", () => openExamFocus(it.id));
      box.appendChild(btn);
    });
    const note = $("#exam-focus-source-note");
    if (note) {
      const n = (state.examFocusData.sources || []).length;
      note.textContent =
        "參考 " +
        n +
        " 篇公開心得／課綱頁（詳見各則來源與 data/sources.md）。內容為改寫摘要，非考古題原文。";
    }
  }

  function openExamFocus(id) {
    const it = getExamFocusItem(id);
    if (!it) return;
    state.currentExamFocusId = id;
    $("#ef-badge").textContent =
      "🎯 " + (it.priority === "高" ? "高優先必背" : "中優先補強");
    $("#ef-title").textContent = it.title;
    $("#ef-why").textContent = it.why || "";
    const pit = $("#ef-pitfalls");
    if (pit) {
      const list = it.pitfalls || [];
      if (list.length) {
        pit.classList.remove("hidden");
        pit.innerHTML =
          '<div class="mnemonic-label">⚠️ 易錯提醒</div><ul>' +
          list.map((x) => `<li>${escapeHtml(x)}</li>`).join("") +
          "</ul>";
      } else {
        pit.classList.add("hidden");
        pit.innerHTML = "";
      }
    }
    const lesBox = $("#ef-lessons");
    lesBox.innerHTML = "";
    (it.lessonIds || []).forEach((lid) => {
      const les = getLesson(lid);
      if (!les) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "link-chip";
      b.textContent = (les.icon || "📖") + " " + les.title;
      b.addEventListener("click", () => openLesson(lid, "exam-focus-detail"));
      lesBox.appendChild(b);
    });
    if (!lesBox.children.length) {
      lesBox.innerHTML = '<p class="muted">尚無對應課文連結</p>';
    }
    renderMnemonicInline("ef-mnemonics", it.mnemonicIds || []);
    const src = $("#ef-sources");
    src.innerHTML = "";
    (it.sources || []).forEach((s) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = s.title || s.url;
      li.appendChild(a);
      src.appendChild(li);
    });
    showView("exam-focus-detail");
  }


  function go(go) {
        if (go === "home") {
          showView("home");
          updateHomeStats();
        } else if (go === "practice") {
          renderPractice();
          showView("practice");
        } else if (go === "search") {
          showView("search");
          if (window.BCUX && window.BCUX.openSearch) window.BCUX.openSearch();
        } else if (go === "path") {
          renderPath();
          showView("path");
        } else if (go === "lessons") {
          renderLessonList();
          showView("lessons");
        } else if (go === "glossary") {
          state.glossaryFilterCategory = "__all__";
          state.glossarySearch = "";
          const gsearch = $("#glossary-search");
          if (gsearch) gsearch.value = "";
          renderGlossaryCategoryChips();
          renderGlossaryList();
          showView("glossary");
        } else if (go === "mnemonics") {
          state.mnemonicFilterChapter = "__all__";
          state.mnemonicSearch = "";
          const search = $("#mnemonic-search");
          if (search) search.value = "";
          renderMnemonicChapterChips();
          renderMnemonicsList();
          showView("mnemonics");
        } else if (go === "study") {
          state.selectedChapters = new Set(["__all__"]);
          state.studyLevel = "basic";
          $$("#study-level-chips .chip").forEach((c) =>
            c.classList.toggle("active", c.getAttribute("data-level") === "basic")
          );
          renderChapterChips("study-chapter-chips", state.selectedChapters);
          updateLearnedNotes();
          showView("study-setup");
        } else if (go === "srs") {
          state.selectedChapters = new Set(["__all__"]);
          state.srsLevel = "basic";
          $$("#srs-level-chips .chip").forEach((c) =>
            c.classList.toggle("active", c.getAttribute("data-level") === "basic")
          );
          renderChapterChips("srs-chapter-chips", state.selectedChapters);
          refreshSRSSetup();
          showView("srs-setup");
        } else if (go === "quiz") {
          state.quizMode = "practice";
          $$("#quiz-mode-chips .chip").forEach((c) =>
            c.classList.toggle("active", c.getAttribute("data-qmode") === "practice")
          );
          updateLearnedNotes();
          showView("quiz-setup");
        } else if (go === "wrong") {
          renderWrong();
          showView("wrong");
        } else if (go === "exam-focus") {
          state.examFocusPriority = "all";
          $$("#exam-focus-priority-chips .chip").forEach((c) =>
            c.classList.toggle("active", c.getAttribute("data-priority") === "all")
          );
          renderExamFocusList();
          showView("exam-focus");
        } else if (go === "chapters") {
          renderChapters();
          showView("chapters");
        } else if (go === "figures") {
          if (window.BCFig) window.BCFig.openGallery();
        }
  }

  function updateLearnedNotes() {
    const learned = learnedLessonIds();
    const n = learned.size;
    const msg = n
      ? "你已讀過 " + n + " 課，只會出這些課的內容。"
      : "你還沒讀完任何一課。建議先去學習路徑讀第一關；或取消勾選、全部都練。";
    ["#study-learned-note", "#quiz-learned-note"].forEach((sel) => { const el = $(sel); if (el) el.textContent = msg; });
    if (!n) {
      ["#study-learned", "#quiz-learned", "#srs-learned"].forEach((sel) => { const el = $(sel); if (el) el.checked = false; });
    }
  }

  function bind() {
    $("#btn-home").addEventListener("click", () => {
      showView("home");
      updateHomeStats();
    });
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) document.body.classList.remove("is-fs");
    });

    document.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-go]");
      if (btn) go(btn.getAttribute("data-go"));
    });
    $$("#bottom-nav [data-tab]").forEach((b) => b.addEventListener("click", () => go(b.getAttribute("data-tab"))));
    $("#btn-back").addEventListener("click", () => {
      if (nav.stack.length) history.back();
      else navBack();
    });
    window.addEventListener("popstate", () => {
      if (closeOverlays()) {
        try { history.pushState({ bcs: nav.stack.length }, ""); } catch (_) {}
        return;
      }
      navBack();
    });
    $("#btn-continue").addEventListener("click", continueLearning);
    // 名詞小卡：課文、題目、卡片、晶片都用同一個（capture，避免觸發翻卡）
    document.addEventListener("click", (ev) => {
      const el = ev.target.closest("[data-term-id]");
      if (el && !el.closest("#coach-panel") && !el.closest("#gpop")) {
        ev.preventDefault();
        ev.stopPropagation();
        showTermPop(el.getAttribute("data-term-id"));
        return;
      }
      const lr = ev.target.closest(".lesson-ref[data-lesson]");
      if (lr) {
        ev.preventDefault();
        ev.stopPropagation();
        openLesson(lr.getAttribute("data-lesson"), state.view === "lesson" ? state.afterLesson : "lessons");
        return;
      }
      const tj = ev.target.closest("[data-jump]");
      if (tj) {
        const el2 = document.getElementById(tj.getAttribute("data-jump"));
        if (el2) window.scrollTo({ top: el2.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" });
      }
    }, true);
    $("#gpop-ok").addEventListener("click", hideTermPop);
    $("#gpop-close").addEventListener("click", hideTermPop);
    $("#gpop-backdrop").addEventListener("click", hideTermPop);
    $("#gpop-more").addEventListener("click", () => {
      const id = popTermId;
      hideTermPop();
      if (id) openTerm(id, state.view);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#gpop").hidden) hideTermPop();
    });
    let _scrollRaf = 0;
    let _lastY = 0;
    window.addEventListener("scroll", () => {
      if (_scrollRaf) return;
      _scrollRaf = requestAnimationFrame(() => {
        _scrollRaf = 0;
        updateReadProgress();
        const y = window.scrollY;
        const nearEnd = y + innerHeight > document.documentElement.scrollHeight - 140;
        if (y > _lastY + 6 && y > 160 && !nearEnd) document.body.classList.add("fab-tuck");
        else if (y < _lastY - 6 || y < 160 || nearEnd) document.body.classList.remove("fab-tuck");
        _lastY = y;
      });
    }, { passive: true });
    $("#btn-lesson-ok").addEventListener("click", lessonOk);
    $("#btn-lesson-confused").addEventListener("click", lessonConfused);
    $("#btn-lesson-prev").addEventListener("click", () => { const id = $("#btn-lesson-prev").dataset.lesson; if (id) openLesson(id, state.afterLesson); });
    $("#btn-lesson-next").addEventListener("click", () => { const id = $("#btn-lesson-next").dataset.lesson; if (id) openLesson(id, state.afterLesson); });
    ["#btn-glossary-back", "#btn-mnemonic-back", "#btn-ef-back"].forEach((sel) => {
      const b = $(sel);
      if (b) { b.textContent = "‹ 返回上一頁"; }
    });

    bindLevelChips("study-level-chips", "studyLevel");
    bindLevelChips("srs-level-chips", "srsLevel");
    const srsL = $("#srs-learned");
    if (srsL) srsL.addEventListener("change", refreshSRSSetup);

    $$("#quiz-mode-chips .chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        $$("#quiz-mode-chips .chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        state.quizMode = chip.getAttribute("data-qmode");
      });
    });

    $("#btn-path-continue").addEventListener("click", () => {
      const next = nextPathStep();
      if (!next) {
        showView("home");
        updateHomeStats();
        return;
      }
      startPathStep(next.id);
    });
    $("#btn-path-reset").addEventListener("click", () => {
      if (confirm("重設新手引導進度？")) {
        BCSStorage.resetPathProgress();
        renderPath();
        updateHomeStats();
      }
    });

    const mnSearch = $("#mnemonic-search");
    if (mnSearch) {
      mnSearch.addEventListener("input", () => {
        state.mnemonicSearch = mnSearch.value || "";
        renderMnemonicsList();
      });
    }
    const glSearch = $("#glossary-search");
    if (glSearch) {
      glSearch.addEventListener("input", () => {
        state.glossarySearch = glSearch.value || "";
        renderGlossaryList();
      });
    }
    const btnGlBack = $("#btn-glossary-back");
    if (btnGlBack) {
      btnGlBack.addEventListener("click", () => {
        if (state.afterGlossary === "figures" && window.BCFig) {
          window.BCFig.openGallery();
          return;
        }
        if (state.afterGlossary === "lesson" && state.currentLessonId) {
          openLesson(state.currentLessonId, state.afterLesson || "lessons");
          return;
        }
        if (state.afterGlossary === "card") {
          showView("card");
          renderCard();
          return;
        }
        if (state.afterGlossary === "glossary-term") {
          renderGlossaryCategoryChips();
          renderGlossaryList();
          showView("glossary");
          return;
        }
        renderGlossaryCategoryChips();
        renderGlossaryList();
        showView("glossary");
      });
    }
    $("#btn-mnemonic-back").addEventListener("click", () => {
      if (state.afterLesson === "lesson" && state.currentLessonId) {
        openLesson(state.currentLessonId, "lessons");
        return;
      }
      if (state.afterLesson === "path" && state.currentLessonId) {
        openLesson(state.currentLessonId, "path");
        return;
      }
      if (state.afterLesson === "exam-focus-detail") {
        if (state.currentExamFocusId) openExamFocus(state.currentExamFocusId);
        else {
          renderExamFocusList();
          showView("exam-focus");
        }
        return;
      }
      renderMnemonicChapterChips();
      renderMnemonicsList();
      showView("mnemonics");
    });

    $("#btn-lesson-practice").addEventListener("click", startLessonPractice);
    $("#btn-lesson-cards").addEventListener("click", startLessonCards);
    $("#btn-lesson-back").addEventListener("click", () => {
      if (state.afterLesson === "figures" && window.BCFig) {
        window.BCFig.openGallery();
      } else if (state.afterLesson === "path") {
        renderPath();
        showView("path");
      } else if (state.afterLesson === "chapters") {
        renderChapters();
        showView("chapters");
      } else if (state.afterLesson === "exam-focus-detail") {
        if (state.currentExamFocusId) openExamFocus(state.currentExamFocusId);
        else {
          renderExamFocusList();
          showView("exam-focus");
        }
      } else if (state.afterLesson === "glossary-term" && state.currentTermId) {
        openTerm(state.currentTermId, "glossary");
      } else {
        renderLessonList();
        showView("lessons");
      }
    });

    $("#btn-start-study").addEventListener("click", () => {
      state.studyLearnedOnly = !!$("#study-learned").checked;
      startStudy($("#study-shuffle").checked);
    });
    $("#btn-start-srs").addEventListener("click", startSRS);
    $("#btn-reset-srs").addEventListener("click", () => {
      if (confirm("確定重設所有間隔重複進度？")) {
        BCSStorage.resetSRS();
        refreshSRSSetup();
        updateHomeStats();
      }
    });

    $("#flashcard").addEventListener("click", flipCard);
    $("#btn-flip").addEventListener("click", flipCard);
    $("#btn-prev").addEventListener("click", () => studyNav(-1));
    $("#btn-next").addEventListener("click", () => studyNav(1));
    $$("#srs-nav [data-grade]").forEach((b) => {
      b.addEventListener("click", () => srsGrade(b.getAttribute("data-grade")));
    });

    document.addEventListener("keydown", (e) => {
      if (state.view !== "card") return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flipCard();
      } else if (e.key === "ArrowRight" && state.mode === "study") studyNav(1);
      else if (e.key === "ArrowLeft" && state.mode === "study") studyNav(-1);
      else if (state.mode === "srs" && state.flipped) {
        const map = { 1: "again", 2: "hard", 3: "good", 4: "easy" };
        if (map[e.key]) srsGrade(map[e.key]);
      }
    });

    $$("#quiz-source-chips .chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        $$("#quiz-source-chips .chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        state.quizSource = chip.getAttribute("data-source");
        if (state.quizSource === "exam") {
          $("#quiz-count").value = Math.min(
            45,
            state.examData?.meta?.count || 45
          );
          $("#quiz-count").max = state.examData?.meta?.count || 45;
        } else {
          $("#quiz-count").value = 10;
          $("#quiz-count").max = 50;
        }
      });
    });

    const efChips = $("#exam-focus-priority-chips");
    if (efChips) {
      $$("#exam-focus-priority-chips .chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          $$("#exam-focus-priority-chips .chip").forEach((c) =>
            c.classList.remove("active")
          );
          chip.classList.add("active");
          state.examFocusPriority = chip.getAttribute("data-priority") || "all";
          renderExamFocusList();
        });
      });
    }
    const btnEfBack = $("#btn-ef-back");
    if (btnEfBack) {
      btnEfBack.addEventListener("click", () => {
        renderExamFocusList();
        showView("exam-focus");
      });
    }

    $("#btn-start-quiz").addEventListener("click", startQuiz);
    $("#btn-quiz-next").addEventListener("click", quizNext);
    $("#btn-quiz-hint").addEventListener("click", () => {
      if (state.quizAnswered || state.hintShown) return;
      const item = state.quizList[state.quizIndex];
      state.hintShown = true;
      const ht = $("#quiz-hint-text");
      ht.textContent = "提示：" + (item.hint || "再想一下動作平面或主力肌。");
      ht.classList.remove("hidden");
      $("#btn-quiz-hint").disabled = true;
    });
    $("#btn-quiz-retry").addEventListener("click", () => {
      if (state.resultIsPath && state.currentLessonId) {
        openLesson(state.currentLessonId, "path");
        return;
      }
      showView("quiz-setup");
    });
    $("#btn-quiz-nextstep").addEventListener("click", () => {
      const sid = $("#btn-quiz-nextstep").dataset.step;
      if (sid) startPathStep(sid);
    });
    $("#btn-quiz-home").addEventListener("click", () => {
      if (state.resultIsPath) { renderPath(); showView("path"); return; }
      showView("home");
      updateHomeStats();
    });
    $("#btn-quiz-wrong").addEventListener("click", () => {
      renderWrong();
      showView("wrong");
    });
    $("#btn-wrong-quiz").addEventListener("click", () => {
      state.fromWrong = true;
      state.quizSource = "exam";
      state.quizMode = "practice";
      $("#quiz-count").value = Math.min(20, BCSStorage.getWrong().length || 10);
      startQuiz();
    });
    $("#btn-clear-wrong").addEventListener("click", () => {
      if (confirm("清空錯題本？")) {
        BCSStorage.clearWrong();
        renderWrong();
        updateHomeStats();
      }
    });
    // 統一「返回」：都回上一頁（跟手機返回鍵一致）
    ["#btn-glossary-back", "#btn-mnemonic-back", "#btn-ef-back", "#btn-lesson-back"].forEach((sel) => {
      const b = $(sel);
      if (!b) return;
      const c = b.cloneNode(true);
      b.parentNode.replaceChild(c, b);
      c.addEventListener("click", () => $("#btn-back").click());
    });
  }

  function exposeCoachApi() {
    window.BCoach = {
      ready: true,
      getState: function () {
        return {
          cards: (state.cardsData && state.cardsData.cards) || [],
          lessons: (state.lessonsData && state.lessonsData.lessons) || [],
          mnemonics: (state.mnemonicsData && state.mnemonicsData.mnemonics) || [],
          examFocus: (state.examFocusData && state.examFocusData.items) || [],
          glossary: (state.glossaryData && state.glossaryData.terms) || [],
          chapters: (state.cardsData && state.cardsData.chapters) || [],
        };
      },
      getLesson: getLesson,
      getMnemonic: getMnemonic,
      getExamFocusItem: getExamFocusItem,
      getTerm: getTerm,
      openLesson: openLesson,
      openMnemonic: openMnemonic,
      openExamFocus: openExamFocus,
      openTerm: openTerm,
      showView: showView,
      openMnemonicsList: function () {
        renderMnemonicChapterChips();
        renderMnemonicsList();
        showView("mnemonics");
      },
      openLessonsList: function () {
        renderLessonList();
        showView("lessons");
      },
      openGlossaryList: function () {
        renderGlossaryCategoryChips();
        renderGlossaryList();
        showView("glossary");
      },
      escapeHtml: escapeHtml,
      go: go,
      back: navBack,
      continueLearning: continueLearning,
      showTermPop: showTermPop,
      applyTheme: applyTheme,
      toast: toast,
      learnedLessonIds: learnedLessonIds,
      pathSteps: pathSteps,
      linkify: linkifyGlossaryHtml,
      updateHomeStats: updateHomeStats,
    };
    if (typeof window.initCoachChat === "function") {
      window.initCoachChat(window.BCoach);
    }
  }

  async function init() {
    applyTheme(BCSStorage.getTheme());
    bind();
    try {
      await loadData();
    } catch (err) {
      console.error(err);
      alert("無法載入資料，請用本機 HTTP server 開啟（見 README）。");
      return;
    }
    $("#quiz-count").value = 10;
    $("#quiz-count").max = state.examData.meta.count || 45;
    updateHomeStats();
    showView("home");
    try { history.replaceState({ bcs: 0 }, ""); } catch (_) {}
    exposeCoachApi();
    if (window.BCUX && window.BCUX.onReady) window.BCUX.onReady();
  }

  init();
})();
