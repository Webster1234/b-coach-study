/* 圖解庫＋動畫控制＋放大燈箱 (B Coach Study)
 * - enhance(box): 把 .lesson-figure 裡的動畫 SVG 改成 inline（才能暫停／播放），加放大按鈕
 * - prefers-reduced-motion：動畫停在「動作最大」那一格
 * - 離開畫面的動畫自動暫停（省電）
 * - openGallery(): 依部位分組的圖解庫
 */
(function () {
  "use strict";
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var svgCache = {};
  var uid = 0;
  var registry = null;
  var KIND_LABEL = { anim: "動畫", anatomy: "真實解剖", diagram: "示意圖" };
  var REGION_ICON = { "平面": "🧭", "肩": "💪", "肘前臂": "🦾", "脊柱核心": "🧍", "髖": "🍑", "膝踝": "🦵", "訓練科學": "📊" };
  var galleryState = { kind: "all" };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function loadRegistry() {
    if (registry) return Promise.resolve(registry);
    return fetch("data/figures.json?v=20261009c").then(function (r) { return r.json(); }).then(function (j) {
      registry = j; return j;
    });
  }
  function figById(id) {
    if (!registry || !id) return null;
    for (var i = 0; i < registry.figures.length; i++) if (registry.figures[i].id === id) return registry.figures[i];
    return null;
  }
  function figBySrc(src) {
    if (!registry || !src) return null;
    for (var i = 0; i < registry.figures.length; i++) if (registry.figures[i].src === src) return registry.figures[i];
    return null;
  }

  function fetchSvg(src) {
    if (!svgCache[src]) {
      svgCache[src] = fetch(src).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status + " " + src);
        return r.text();
      });
    }
    return svgCache[src];
  }

  /** 每個 inline 複本都要有唯一 id，避免多張同圖時 marker/clipPath 互相打架 */
  function uniquify(text) {
    var n = ++uid;
    return text.replace(/(id="|url\(#|href="#|aria-labelledby=")([^"\)]+)/g, function (m, a, b) {
      return a + b + "__u" + n;
    });
  }

  function svgPeak(svg) {
    var p = parseFloat(svg.getAttribute("data-peak"));
    return isFinite(p) ? p : 0;
  }

  function setPlaying(svg, btn, play) {
    if (!svg || typeof svg.pauseAnimations !== "function") return;
    if (play) {
      svg.unpauseAnimations();
      svg.__userPaused = false;
    } else {
      svg.pauseAnimations();
      svg.__userPaused = true;
    }
    if (btn) {
      btn.textContent = play ? "⏸ 暫停" : "▶ 播放";
      btn.setAttribute("aria-pressed", play ? "false" : "true");
    }
  }

  var io = null;
  function observe(svg) {
    if (!("IntersectionObserver" in window)) return;
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var s = en.target;
          if (s.__userPaused) return;
          try {
            if (en.isIntersecting) s.unpauseAnimations();
            else s.pauseAnimations();
          } catch (e) {}
        });
      }, { threshold: 0.05 });
    }
    io.observe(svg);
  }

  /** 把 media 容器裡的 <img> 換成 inline SVG 動畫，接上播放鍵 */
  function inlineAnim(media, src, btn) {
    return fetchSvg(src).then(function (text) {
      var wrap = document.createElement("div");
      wrap.innerHTML = uniquify(text);
      var svg = wrap.querySelector("svg");
      if (!svg) return null;
      svg.setAttribute("focusable", "false");
      svg.classList.add("fig-inline");
      media.innerHTML = "";
      media.appendChild(svg);
      if (REDUCED) {
        try { svg.pauseAnimations(); svg.setCurrentTime(svgPeak(svg)); } catch (e) {}
        svg.__userPaused = true;
        if (btn) { btn.textContent = "▶ 播放"; btn.setAttribute("aria-pressed", "true"); }
      } else {
        observe(svg);
      }
      if (btn) {
        btn.hidden = false;
        btn.onclick = function (ev) {
          ev.stopPropagation();
          setPlaying(svg, btn, !!svg.__userPaused);
        };
      }
      return svg;
    }).catch(function (err) {
      console.warn("[figures] inline failed, keep <img>:", err && err.message);
      return null;
    });
  }

  /** 動畫捲到附近才下載＋inline（省流量、加快開課文） */
  var lazyIo = null;
  function lazyAnim(fig, media, src, play) {
    if (!("IntersectionObserver" in window)) { inlineAnim(media, src, play); return; }
    if (!lazyIo) {
      lazyIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          lazyIo.unobserve(en.target);
          var d = en.target.__lazy;
          if (d) inlineAnim(d.media, d.src, d.play);
        });
      }, { rootMargin: "400px 0px" });
    }
    fig.__lazy = { media: media, src: src, play: play };
    lazyIo.observe(fig);
  }

  /** 讓 renderFigures 產生的 figure 動起來＋可放大 */
  function enhance(box) {
    if (!box) return;
    var figs = box.querySelectorAll("figure.lesson-figure");
    loadRegistry().catch(function () {}).then(function () {
      Array.prototype.forEach.call(figs, function (fig) {
        if (fig.__enhanced) return;
        fig.__enhanced = true;
        var src = fig.getAttribute("data-src");
        var kind = fig.getAttribute("data-kind");
        var media = fig.querySelector(".fig-media");
        var play = fig.querySelector(".fig-play");
        var zoom = fig.querySelector(".fig-zoom");
        if (kind === "anim" && media) lazyAnim(fig, media, src, play);
        var open = function () {
          var meta = figById(fig.getAttribute("data-fig")) || figBySrc(src);
          openLightbox({
            src: src,
            kind: kind,
            title: meta ? meta.title : "",
            caption: meta ? meta.caption : fig.getAttribute("data-cap") || "",
            credit: meta ? meta.credit : fig.getAttribute("data-credit") || "",
            lessons: meta ? meta.lessons : [],
            terms: meta ? meta.terms : [],
          });
        };
        if (zoom) zoom.onclick = function (ev) { ev.stopPropagation(); open(); };
        if (media) {
          media.style.cursor = "zoom-in";
          media.addEventListener("click", open);
        }
      });
    });
  }

  /* ---------------- 燈箱 ---------------- */
  var lb = null;
  var lbZoom = 1;
  var lastFocus = null;
  function buildLightbox() {
    lb = document.createElement("div");
    lb.className = "fig-lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "放大圖解");
    lb.hidden = true;
    lb.innerHTML =
      '<div class="lb-bar">' +
      '<button type="button" class="lb-btn lb-close" aria-label="關閉">✕ 關閉</button>' +
      '<span class="lb-zooms">' +
      '<button type="button" class="lb-btn" data-z="1">100%</button>' +
      '<button type="button" class="lb-btn" data-z="1.5">150%</button>' +
      '<button type="button" class="lb-btn" data-z="2">200%</button>' +
      '<button type="button" class="lb-btn" data-z="3">300%</button>' +
      "</span>" +
      '<button type="button" class="lb-btn lb-play" hidden>⏸ 暫停</button>' +
      "</div>" +
      '<div class="lb-scroll"><div class="lb-stage"></div></div>' +
      '<div class="lb-info"><p class="lb-title"></p><p class="lb-cap"></p><p class="lb-credit"></p><div class="lb-links"></div>' +
      '<p class="lb-hint">提示：雙指可縮放、拖曳；點兩下切換 100%／200%。</p></div>';
    document.body.appendChild(lb);
    lb.querySelector(".lb-close").addEventListener("click", closeLightbox);
    Array.prototype.forEach.call(lb.querySelectorAll("[data-z]"), function (b) {
      b.addEventListener("click", function () { setZoom(parseFloat(b.getAttribute("data-z"))); });
    });
    var stage = lb.querySelector(".lb-stage");
    var lastTap = 0;
    stage.addEventListener("dblclick", function (e) { e.preventDefault(); setZoom(lbZoom > 1 ? 1 : 2); });
    stage.addEventListener("touchend", function (e) {
      if (e.touches && e.touches.length) return;
      var now = Date.now();
      if (now - lastTap < 300) { e.preventDefault(); setZoom(lbZoom > 1 ? 1 : 2); lastTap = 0; }
      else lastTap = now;
    });
    document.addEventListener("keydown", function (e) {
      if (!lb.hidden && e.key === "Escape") closeLightbox();
    });
  }
  function setZoom(z) {
    lbZoom = z;
    var stage = lb.querySelector(".lb-stage");
    stage.style.width = z * 100 + "%";
    Array.prototype.forEach.call(lb.querySelectorAll("[data-z]"), function (b) {
      b.classList.toggle("active", parseFloat(b.getAttribute("data-z")) === z);
    });
  }
  function lessonTitle(id) {
    var api = window.BCoach;
    var les = api && api.getLesson ? api.getLesson(id) : null;
    return les ? les.title : id;
  }
  function termTitle(id) {
    var api = window.BCoach;
    var t = api && api.getTerm ? api.getTerm(id) : null;
    return t ? t.term : null;
  }
  function openLightbox(o) {
    if (!lb) buildLightbox();
    lastFocus = document.activeElement;
    var stage = lb.querySelector(".lb-stage");
    var play = lb.querySelector(".lb-play");
    play.hidden = true;
    stage.innerHTML = '<img src="' + esc(o.src) + '" alt="' + esc(o.title || o.caption) + '" />';
    if (o.kind === "anim") inlineAnim(stage, o.src, play);
    lb.querySelector(".lb-title").textContent = (o.kind ? "【" + (KIND_LABEL[o.kind] || "") + "】" : "") + (o.title || "");
    lb.querySelector(".lb-cap").textContent = o.caption || "";
    lb.querySelector(".lb-credit").textContent = o.credit ? "圖源／授權：" + o.credit : "";
    var links = lb.querySelector(".lb-links");
    var html = "";
    (o.lessons || []).forEach(function (id) {
      html += '<button type="button" class="lb-link" data-lesson="' + esc(id) + '">📖 ' + esc(id) + " " + esc(lessonTitle(id)) + "</button>";
    });
    (o.terms || []).slice(0, 6).forEach(function (id) {
      var tt = termTitle(id);
      if (tt) html += '<button type="button" class="lb-link term" data-term="' + esc(id) + '">📘 ' + esc(tt) + "</button>";
    });
    links.innerHTML = html ? '<p class="lb-links-h">相關課文／名詞</p>' + html : "";
    Array.prototype.forEach.call(links.querySelectorAll("[data-lesson]"), function (b) {
      b.addEventListener("click", function () {
        closeLightbox();
        if (window.BCoach) window.BCoach.openLesson(b.getAttribute("data-lesson"), "figures");
        window.scrollTo(0, 0);
      });
    });
    Array.prototype.forEach.call(links.querySelectorAll("[data-term]"), function (b) {
      b.addEventListener("click", function () {
        closeLightbox();
        if (window.BCoach) window.BCoach.openTerm(b.getAttribute("data-term"), "figures");
        window.scrollTo(0, 0);
      });
    });
    setZoom(1);
    lb.hidden = false;
    document.body.classList.add("lb-open");
    lb.querySelector(".lb-scroll").scrollTop = 0;
    lb.scrollTop = 0;
    lb.querySelector(".lb-close").focus();
  }
  function closeLightbox() {
    if (!lb) return;
    lb.hidden = true;
    lb.querySelector(".lb-stage").innerHTML = "";
    document.body.classList.remove("lb-open");
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }

  /* ---------------- 圖解庫 ---------------- */
  function figureCard(f) {
    var kind = f.kind;
    return (
      '<figure class="lesson-figure gallery-card fig-kind-' + esc(kind) + '" data-src="' + esc(f.src) + '" data-kind="' + esc(kind) + '" data-fig="' + esc(f.id) + '">' +
      '<div class="fig-media"><img src="' + esc(f.src) + '" alt="' + esc(f.title) + '" loading="lazy" /></div>' +
      '<figcaption><span class="fig-kind">' + esc(KIND_LABEL[kind] || "") + "</span> " + esc(f.title) +
      (f.lessons && f.lessons.length ? '<span class="gc-lessons">' + esc(f.lessons.slice(0, 4).join("・")) + "</span>" : "") +
      "</figcaption>" +
      '<div class="fig-tools"><button type="button" class="fig-btn fig-zoom">🔍 放大</button>' +
      (kind === "anim" ? '<button type="button" class="fig-btn fig-play" hidden>⏸ 暫停</button>' : "") +
      "</div></figure>"
    );
  }
  function renderGallery() {
    var root = document.getElementById("figures-gallery");
    var chips = document.getElementById("figures-kind-chips");
    if (!root || !registry) return;
    var counts = { all: registry.figures.length, anim: 0, anatomy: 0, diagram: 0 };
    registry.figures.forEach(function (f) { counts[f.kind] = (counts[f.kind] || 0) + 1; });
    if (chips) {
      chips.innerHTML = [["all", "全部"], ["anim", "🎞️ 動畫"], ["anatomy", "🦴 真實解剖"], ["diagram", "📐 示意圖"]]
        .map(function (k) {
          return '<button type="button" class="chip' + (galleryState.kind === k[0] ? " active" : "") + '" data-kind="' + k[0] + '">' + k[1] + " " + counts[k[0]] + "</button>";
        }).join("");
      Array.prototype.forEach.call(chips.querySelectorAll(".chip"), function (c) {
        c.addEventListener("click", function () { galleryState.kind = c.getAttribute("data-kind"); renderGallery(); });
      });
    }
    var regions = (registry.meta && registry.meta.regions) || [];
    var html = "";
    regions.forEach(function (rg) {
      var list = registry.figures.filter(function (f) {
        return f.region === rg && (galleryState.kind === "all" || f.kind === galleryState.kind);
      });
      if (!list.length) return;
      html += '<section class="gallery-group"><h3 class="gallery-h">' + (REGION_ICON[rg] || "") + " " + esc(rg) +
        ' <span class="muted">' + list.length + " 張</span></h3><div class=\"gallery-grid\">" + list.map(figureCard).join("") + "</div></section>";
    });
    root.innerHTML = html || '<p class="muted">沒有符合的圖。</p>';
    enhance(root);
  }
  function openGallery() {
    var api = window.BCoach;
    loadRegistry().then(function () {
      renderGallery();
      if (api) api.showView("figures");
      window.scrollTo(0, 0);
    }).catch(function (err) {
      console.error(err);
      alert("圖解庫載入失敗，請重新整理。");
    });
  }

  window.BCFig = { enhance: enhance, openGallery: openGallery, openLightbox: openLightbox, reducedMotion: REDUCED };
})();
