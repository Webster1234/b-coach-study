(function (global) {
  const KEYS = {
    theme: "bcs_theme",
    srs: "bcs_srs_v1",
    wrong: "bcs_wrong_v1",
    quizStats: "bcs_quiz_stats_v1",
    path: "bcs_path_v1",
    ux: "bcs_ux_v1",
  };

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  const Storage = {
    getTheme() {
      return localStorage.getItem(KEYS.theme) || "dark";
    },
    setTheme(t) {
      localStorage.setItem(KEYS.theme, t);
    },

    /** @returns {Record<string, object>} cardId -> SM2 state */
    getSRS() {
      return load(KEYS.srs, {});
    },
    setSRS(map) {
      save(KEYS.srs, map);
    },
    updateSRSCard(cardId, state) {
      const map = Storage.getSRS();
      map[cardId] = state;
      Storage.setSRS(map);
    },
    resetSRS() {
      localStorage.removeItem(KEYS.srs);
    },

    /** wrong book: array of question snapshots */
    getWrong() {
      return load(KEYS.wrong, []);
    },
    setWrong(list) {
      save(KEYS.wrong, list);
    },
    addWrong(item) {
      const list = Storage.getWrong();
      const idx = list.findIndex((x) => x.id === item.id);
      if (idx >= 0) list.splice(idx, 1);
      list.unshift({ ...item, missedAt: Date.now() });
      Storage.setWrong(list.slice(0, 200));
    },
    removeWrong(id) {
      Storage.setWrong(Storage.getWrong().filter((x) => x.id !== id));
    },
    clearWrong() {
      localStorage.removeItem(KEYS.wrong);
    },

    /**
     * Guided path progress:
     * { pathId, completedSteps: string[], currentStepId, updatedAt }
     */
    getPathProgress() {
      return load(KEYS.path, {
        pathId: "beginner-v1",
        completedSteps: [],
        currentStepId: null,
        updatedAt: null,
      });
    },
    setPathProgress(p) {
      save(KEYS.path, { ...p, updatedAt: Date.now() });
    },
    markPathStepDone(stepId) {
      const p = Storage.getPathProgress();
      if (!p.completedSteps.includes(stepId)) p.completedSteps.push(stepId);
      Storage.setPathProgress(p);
      return p;
    },
    resetPathProgress() {
      localStorage.removeItem(KEYS.path);
    },

    /** UX 狀態（2026-10-09）：{ onboarded, fontSize, readLessons:{id:ts}, feedback:{id:'ok'|'confused'}, last:{lessonId, scroll, at}, activity:{'YYYY-MM-DD': n} } */
    getUX() {
      const u = load(KEYS.ux, {});
      return Object.assign({ onboarded: false, fontSize: "m", readLessons: {}, feedback: {}, last: null, activity: {} }, u || {});
    },
    setUX(patch) {
      const u = Object.assign(Storage.getUX(), patch || {});
      try { save(KEYS.ux, u); } catch (_) {}
      return u;
    },
    todayKey() {
      const d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    },
    bumpActivity(n) {
      const u = Storage.getUX();
      const k = Storage.todayKey();
      u.activity[k] = (u.activity[k] || 0) + (n || 1);
      // 只留最近 60 天
      const keys = Object.keys(u.activity).sort();
      while (keys.length > 60) delete u.activity[keys.shift()];
      Storage.setUX({ activity: u.activity });
    },
    todayCount() {
      return Storage.getUX().activity[Storage.todayKey()] || 0;
    },
    markLessonRead(id) {
      const u = Storage.getUX();
      if (!u.readLessons[id]) {
        u.readLessons[id] = Date.now();
        Storage.setUX({ readLessons: u.readLessons });
        Storage.bumpActivity(1);
      }
    },
  };

  global.BCSStorage = Storage;
})(window);
