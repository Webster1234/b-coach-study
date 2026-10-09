/* B Coach Study — 新手體驗層：第一次導覽、字體大小、設定、全站搜尋（2026-10-09） */
(function () {
  "use strict";
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var api = function () { return window.BCoach || null; };
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // —— 字體大小 ——
  var FS = { s: "小", m: "中", l: "大", xl: "特大" };
  function applyFont(k) {
    if (!FS[k]) k = "m";
    document.documentElement.setAttribute("data-fs", k);
  }
  applyFont(window.BCSStorage ? BCSStorage.getUX().fontSize : "m");

  // —— 通用底部面板 ——
  var sheetOpen = false;
  var sheetReturn = null;
  function openSheet(html, cls) {
    var sh = $("#sheet");
    sheetReturn = document.activeElement;
    sh.className = "sheet " + (cls || "");
    sh.innerHTML = html;
    sh.hidden = false;
    $("#sheet-backdrop").hidden = false;
    requestAnimationFrame(function () { sh.classList.add("open"); });
    sheetOpen = true;
    var f = sh.querySelector("[autofocus], .btn.primary, button");
    if (f) setTimeout(function () { f.focus(); }, 60);
    return sh;
  }
  function closeSheet() {
    if (!sheetOpen) return false;
    var sh = $("#sheet");
    sh.classList.remove("open");
    sh.hidden = true;
    $("#sheet-backdrop").hidden = true;
    sheetOpen = false;
    if (sheetReturn && sheetReturn.focus) try { sheetReturn.focus({ preventScroll: true }); } catch (e) {}
    return true;
  }

  // —— 第一次導覽（3 步）——
  var OB = [
    { icon: "🌱", title: "完全沒學過也看得懂", body: "這個站專門給新手：每一課都先給你 <b>⭐ 一句話重點</b>，再用白話、生活例子和圖慢慢講。<br><br>看到 <span class=\"ob-demo\">底線的詞</span> 點一下，就會跳出白話解釋＋小圖，不會離開這一頁。" },
    { icon: "⏱️", title: "建議每天 15 分鐘", body: "<ol class=\"ob-list\"><li>首頁按 <b>▶ 繼續學習</b>，會自動接到上次讀到的地方</li><li>讀完按 <b>✅ 我懂了</b> 做 3～6 題小測驗</li><li>有空再到 <b>✏️ 練習</b> 翻 10 張卡</li></ol>總共 7 個單元、24 關，由簡單到困難。" },
    { icon: "🏋️", title: "看不懂就問", body: "<ul class=\"ob-list\"><li>底線的詞 → 點一下看解釋</li><li>課文最後按 <b>🤔 還不懂</b> → 給你名詞、動畫、問教練</li><li>右下角 <b>🏋️ 問教練</b> → 用自己的話問</li><li>上方 <b>🔍</b> 搜尋全站、<b>Aa</b> 調字體大小</li></ul>" },
  ];
  function openOnboarding(step) {
    step = step || 0;
    var o = OB[step];
    var dots = OB.map(function (_, i) { return '<i class="' + (i === step ? "on" : "") + '"></i>'; }).join("");
    var last = step === OB.length - 1;
    var sh = openSheet(
      '<div class="ob"><div class="ob-step">第 ' + (step + 1) + " / " + OB.length + ' 步</div><div class="ob-icon">' + o.icon + "</div><h3>" + o.title + '</h3><div class="ob-body">' + o.body + "</div>" +
      '<div class="ob-dots">' + dots + "</div>" +
      '<div class="ob-actions"><button type="button" class="btn ghost" data-ob="skip">' + (last ? "先逛逛" : "略過") + "</button>" +
      '<button type="button" class="btn primary" data-ob="next">' + (last ? "▶ 開始第一關" : "下一步 ›") + "</button></div></div>",
      "sheet-ob"
    );
    sh.querySelector('[data-ob="skip"]').onclick = function () { finishOb(false); };
    sh.querySelector('[data-ob="next"]').onclick = function () {
      if (last) finishOb(true);
      else openOnboarding(step + 1);
    };
  }
  function finishOb(start) {
    BCSStorage.setUX({ onboarded: true });
    closeSheet();
    if (start && api()) api().continueLearning();
  }

  // —— 設定（字體／主題／說明）——
  function openSettings() {
    var ux = BCSStorage.getUX();
    var theme = document.documentElement.getAttribute("data-theme") || "dark";
    var fsBtns = Object.keys(FS).map(function (k) {
      return '<button type="button" class="seg' + (ux.fontSize === k ? " on" : "") + '" data-fs="' + k + '" style="font-size:' + { s: 14, m: 16, l: 18, xl: 20 }[k] + 'px">' + FS[k] + "</button>";
    }).join("");
    var sh = openSheet(
      '<div class="settings"><div class="sheet-head"><h3>顯示設定</h3><button type="button" class="icon-btn" data-close aria-label="關閉">✕</button></div>' +
      '<div class="set-row"><div class="set-label">字體大小</div><div class="seg-row">' + fsBtns + "</div></div>" +
      '<p class="set-preview">預覽：肩關節外展＝手臂往兩側抬起（側平舉）。</p>' +
      '<div class="set-row"><div class="set-label">顏色</div><div class="seg-row"><button type="button" class="seg' + (theme === "dark" ? " on" : "") + '" data-theme-set="dark">🌙 深色</button><button type="button" class="seg' + (theme === "light" ? " on" : "") + '" data-theme-set="light">☀️ 淺色</button></div></div>' +
      '<div class="set-links"><button type="button" class="btn" data-act="ob">📖 重看使用說明</button><button type="button" class="btn ghost" data-act="fs">⛶ 全螢幕</button></div>' +
      '<p class="muted small">進度只存在這台裝置的瀏覽器（localStorage），換手機或清除瀏覽資料會不見。</p></div>',
      "sheet-settings"
    );
    sh.querySelector("[data-close]").onclick = closeSheet;
    $$("[data-fs]", sh).forEach(function (b) {
      b.onclick = function () {
        var k = b.getAttribute("data-fs");
        BCSStorage.setUX({ fontSize: k });
        applyFont(k);
        $$("[data-fs]", sh).forEach(function (x) { x.classList.toggle("on", x === b); });
      };
    });
    $$("[data-theme-set]", sh).forEach(function (b) {
      b.onclick = function () {
        if (api()) api().applyTheme(b.getAttribute("data-theme-set"));
        $$("[data-theme-set]", sh).forEach(function (x) { x.classList.toggle("on", x === b); });
      };
    });
    sh.querySelector('[data-act="ob"]').onclick = function () { openOnboarding(0); };
    sh.querySelector('[data-act="fs"]').onclick = function () {
      closeSheet();
      if (!document.fullscreenElement) { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); }
      else if (document.exitFullscreen) document.exitFullscreen();
    };
  }

  // —— 全站搜尋 ——
  var SUGGEST = ["內旋", "側平舉", "矢狀面", "肩峰", "旋轉肌袖", "心率", "1RM", "FITT-VP"];
  function norm(s) { return String(s || "").toLowerCase().replace(/\s+/g, ""); }
  function hl(text, q, max) {
    var t = String(text || "");
    var i = norm(t).indexOf(q);
    // norm 去空白後位置可能偏移：改用簡單 indexOf
    var j = t.toLowerCase().indexOf(q);
    var start = j >= 0 ? Math.max(0, j - 14) : 0;
    var snip = t.slice(start, start + (max || 70));
    var out = esc(snip);
    if (j >= 0) {
      var re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
      out = out.replace(re, function (m) { return "<mark>" + m + "</mark>"; });
    }
    return (start > 0 ? "…" : "") + out + (t.length > start + (max || 70) ? "…" : "");
  }
  function doSearch(raw) {
    var box = $("#search-results");
    var q = String(raw || "").trim().toLowerCase();
    if (!q) { box.innerHTML = '<p class="muted">輸入你看不懂的詞，或點上面的例子。</p>'; return; }
    var st = api().getState();
    var groups = [];
    var les = st.lessons.filter(function (l) {
      return norm(l.title + l.summary + (l.keyPoint || "") + (l.keywords || []).join(" ") + (l.body || []).join(" ")).indexOf(norm(q)) >= 0;
    }).slice(0, 8).map(function (l) {
      var bodyHit = (l.body || []).find(function (p) { return p.toLowerCase().indexOf(q) >= 0; }) || l.keyPoint || l.summary;
      return '<button type="button" class="sr-item" data-sr-lesson="' + l.id + '"><span class="sr-k">📖 課文</span><b>' + esc(l.title) + "</b><span>" + hl(bodyHit, q, 70) + "</span></button>";
    });
    if (les.length) groups.push(["課文", les]);
    var gl = st.glossary.filter(function (t) {
      return norm(t.term + " " + (t.aliases || []).join(" ") + " " + t.oneLiner).indexOf(norm(q)) >= 0;
    }).sort(function (a, b) {
      var ea = norm(a.term).indexOf(norm(q)) === 0 ? 0 : 1, eb = norm(b.term).indexOf(norm(q)) === 0 ? 0 : 1;
      return ea - eb;
    }).slice(0, 10).map(function (t) {
      return '<button type="button" class="sr-item" data-term-id="' + t.id + '"><span class="sr-k">📘 名詞</span><b>' + esc(t.term) + "</b><span>" + esc(t.oneLiner || "") + "</span></button>";
    });
    if (gl.length) groups.unshift(["名詞（點一下看解釋）", gl]);
    var mn = st.mnemonics.filter(function (m) {
      return norm(m.title + m.trick + (m.tags || []).join(" ")).indexOf(norm(q)) >= 0;
    }).slice(0, 6).map(function (m) {
      return '<button type="button" class="sr-item" data-sr-mn="' + m.id + '"><span class="sr-k">💡 速記</span><b>' + esc(m.title) + "</b><span>" + esc(m.trick) + "</span></button>";
    });
    if (mn.length) groups.push(["速記口訣", mn]);
    var cards = st.cards.filter(function (c) {
      return (c.level || "exam") === "basic" && norm(c.q + " " + c.a).indexOf(norm(q)) >= 0;
    }).slice(0, 8).map(function (c) {
      return '<details class="sr-card"><summary><span class="sr-k">🃏 卡片</span>' + esc(c.q) + '</summary><p>' + esc(String(c.a).split(/\n（白話）/)[0]) + (c.plain ? '<br><span class="muted">白話：' + esc(c.plain) + "</span>" : "") + "</p></details>";
    });
    if (cards.length) groups.push(["卡片（點一下看答案）", cards]);
    if (!groups.length) {
      box.innerHTML = '<p class="muted">找不到「' + esc(raw) + '」。換個說法，或直接 <button type="button" class="text-link" id="sr-ask">問教練</button>。</p>';
      var a = $("#sr-ask");
      if (a) a.onclick = function () { if (window.BCoachChat) window.BCoachChat.ask(raw); };
      return;
    }
    box.innerHTML = groups.map(function (g) {
      return '<section class="sr-group"><div class="section-label">' + g[0] + "（" + g[1].length + '）</div><div class="sr-list">' + g[1].join("") + "</div></section>";
    }).join("");
    $$("[data-sr-lesson]", box).forEach(function (b) {
      b.onclick = function () { api().openLesson(b.getAttribute("data-sr-lesson"), "lessons", { focus: raw }); };
    });
    $$("[data-sr-mn]", box).forEach(function (b) {
      b.onclick = function () { api().openMnemonic(b.getAttribute("data-sr-mn"), "mnemonics"); };
    });
  }
  var searchBound = false;
  function openSearch() {
    var inp = $("#global-search");
    if (!searchBound) {
      searchBound = true;
      var t = 0;
      inp.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { doSearch(inp.value); }, 160); });
      $("#search-suggest").innerHTML = SUGGEST.map(function (w) { return '<button type="button" class="chip" data-sg="' + esc(w) + '">' + esc(w) + "</button>"; }).join("");
      $$("[data-sg]").forEach(function (b) { b.onclick = function () { inp.value = b.getAttribute("data-sg"); doSearch(inp.value); }; });
    }
    doSearch(inp.value);
    setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 80);
  }

  var readyDone = false;
  function onReady() {
    if (readyDone) return;
    readyDone = true;
    $("#btn-settings").addEventListener("click", openSettings);
    $("#btn-search").addEventListener("click", function () { api().go("search"); });
    $("#btn-open-onboarding").addEventListener("click", function () { openOnboarding(0); });
    $("#sheet-backdrop").addEventListener("click", closeSheet);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });
    var ux = BCSStorage.getUX();
    var hasProgress = (BCSStorage.getPathProgress().completedSteps || []).length > 0;
    if (!ux.onboarded && !hasProgress && !/[?&]noob=1/.test(location.search)) setTimeout(function () { openOnboarding(0); }, 400);
  }

  window.BCUX = { onReady: onReady, openSearch: openSearch, closeSheet: closeSheet, openOnboarding: openOnboarding, openSettings: openSettings, applyFont: applyFont };
  if (window.BCoach && window.BCoach.ready && window.BCoach.go) onReady();
})();
