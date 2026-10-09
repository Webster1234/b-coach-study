/**
 * Simplified SM-2 spaced repetition.
 * Grades: again | hard | good | easy
 */
(function (global) {
  const MIN_EF = 1.3;

  function defaultCard() {
    return {
      repetitions: 0,
      easiness: 2.5,
      interval: 0,
      due: 0, // timestamp ms
      lapses: 0,
    };
  }

  /** @param {object} state previous SM2 state
   *  @param {'again'|'hard'|'good'|'easy'} grade
   *  @param {number} [now]
   */
  function review(state, grade, now) {
    now = now || Date.now();
    const s = Object.assign(defaultCard(), state || {});
    let { repetitions, easiness, interval, lapses } = s;

    const q = { again: 0, hard: 3, good: 4, easy: 5 }[grade];
    if (q === undefined) throw new Error("bad grade: " + grade);

    if (q < 3) {
      // Again
      repetitions = 0;
      interval = 0; // due again soon (same session / <10 min conceptually → we use 10 min)
      lapses = (lapses || 0) + 1;
      easiness = Math.max(MIN_EF, easiness - 0.2);
      return {
        repetitions,
        easiness,
        interval,
        due: now + 10 * 60 * 1000,
        lapses,
        lastGrade: grade,
        lastReviewed: now,
      };
    }

    // Update EF (SM-2)
    easiness = easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easiness < MIN_EF) easiness = MIN_EF;

    if (repetitions === 0) {
      interval = grade === "easy" ? 4 : grade === "hard" ? 1 : 1;
    } else if (repetitions === 1) {
      interval = grade === "easy" ? 7 : grade === "hard" ? 3 : 6;
    } else {
      let mult = easiness;
      if (grade === "hard") mult = Math.max(1.2, easiness - 0.15);
      if (grade === "easy") mult = easiness + 0.15;
      interval = Math.round(interval * mult);
    }
    repetitions += 1;

    return {
      repetitions,
      easiness: Math.round(easiness * 100) / 100,
      interval,
      due: now + interval * 24 * 60 * 60 * 1000,
      lapses: lapses || 0,
      lastGrade: grade,
      lastReviewed: now,
    };
  }

  function isDue(state, now) {
    now = now || Date.now();
    if (!state || !state.due) return true; // new card
    return state.due <= now;
  }

  global.SM2 = { review, isDue, defaultCard };
})(window);
