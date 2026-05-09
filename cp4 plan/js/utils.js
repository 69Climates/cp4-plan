const Utils = {
  // Habit tracking constants
  HABIT_CATEGORIES: ["Study", "Health", "Practice", "Personal", "Work"],

  HABIT_COLORS: {
    blue: "#5f9fb0",
    green: "#5f9f7c",
    yellow: "#b99a63",
    red: "#b06b73",
    purple: "#9f7cb0",
    orange: "#b08f5f",
    pink: "#b07c9f",
    gray: "#949494"
  },

  HABIT_ICONS: [
    "📚", "💪", "🏃", "🧘", "🎯", "✍️", "🎨", "🎵",
    "💻", "📖", "🌱", "☕", "🌙", "⭐", "🔥", "✨"
  ],

  ERROR_MESSAGES: {
    nameRequired: "Name is required",
    nameEmpty: "Name cannot be empty or whitespace only",
    nameTooLong: "Name cannot exceed 100 characters",
    descriptionTooLong: "Description cannot exceed 500 characters",
    frequencyRequired: "Frequency is required and must be an object",
    weekdaysArray: "Weekdays must be an array",
    weekdaysEmpty: "At least one weekday must be selected",
    weekdaysInvalid: "Weekdays must be integers between 0 and 6",
    intervalPositive: "Custom interval must be a positive integer",
    frequencyTypeInvalid: "Frequency type must be 'daily', 'weekdays', or 'custom'",
    colorRequired: "Color is required",
    colorInvalid: "Color must be a valid hex code (#RRGGBB or #RGB) or predefined color name",
    iconRequired: "Icon is required",
    iconInvalid: "Icon must be from the predefined icon set",
    timeRequired: "Time is required",
    timeInvalid: "Time must be in HH:MM format (00:00 to 23:59)",
    notesTooLong: "Notes cannot exceed 500 characters"
  },

  generateId() {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now();
  },

  getTodayKey() {
    return new Date().toISOString().split("T")[0];
  },

  getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  initializeDateInput(inputId) {
    const input = document.getElementById(inputId);
    if (input && !input.value) {
      input.value = this.getTodayDateString();
    }
  },

  initializeAllDateInputs() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
      if (!input.value) {
        input.value = this.getTodayDateString();
      }
    });
  },

  formatDate(iso) {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  },

  formatTime(minutes) {
    if (!minutes) return "0min";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  },

  isTypingTarget(el) {
    if (!el) return false;
    const tag = (el.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
  },

  getPlanProgress(startDate, totalWeeks = 14) {
    if (!startDate) {
      return {
        state: "unset",
        week: null,
        day: null,
        diffDays: null,
        totalDays: totalWeeks * 7
      };
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((now - start) / 86400000);
    const totalDays = totalWeeks * 7;

    if (diffDays < 0) {
      return {
        state: "not-started",
        week: 1,
        day: 1,
        diffDays,
        daysUntilStart: Math.abs(diffDays),
        totalDays
      };
    }

    if (diffDays >= totalDays) {
      return {
        state: "beyond",
        week: totalWeeks,
        day: 7,
        diffDays,
        daysBeyond: diffDays - totalDays + 1,
        totalDays
      };
    }

    return {
      state: "active",
      week: Math.floor(diffDays / 7) + 1,
      day: (diffDays % 7) + 1,
      diffDays,
      totalDays
    };
  },

  getCurrentWeekAndDay(startDate) {
    const progress = Utils.getPlanProgress(startDate, 14);
    if (!progress || progress.state === "unset") return null;
    return { week: progress.week, day: progress.day };
  },

  getWeekDayKey(week, day) {
    return `w${week}d${day}`;
  },

  parseWeekDayKey(wdKey) {
    const m = /w(\d+)d(\d+)/.exec(wdKey || "");
    if (!m) return null;
    return { week: Number(m[1]), day: Number(m[2]) };
  },

  getDateFromWeekDayKey(startDate, wdKey) {
    const parsed = Utils.parseWeekDayKey(wdKey);
    if (!startDate || !parsed) return null;
    const d = new Date(startDate);
    d.setDate(d.getDate() + (parsed.week - 1) * 7 + (parsed.day - 1));
    return d.toISOString().split("T")[0];
  },

  findWeekDayKeyByDate(startDate, dateKey) {
    if (!startDate || !dateKey) return null;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const target = new Date(dateKey);
    target.setHours(0, 0, 0, 0);
    const diff = Math.floor((target - start) / 86400000);
    if (diff < 0 || diff >= 98) return null;
    const week = Math.floor(diff / 7) + 1;
    const day = (diff % 7) + 1;
    return Utils.getWeekDayKey(week, day);
  },

  calculateStreak(problems) {
    const dates = new Set(
      (problems || [])
        .filter((p) => p.status === "solved" || p.status === "upsolved")
        .map((p) => p.solvedAt?.split("T")[0])
        .filter(Boolean)
    );
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i += 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (dates.has(key)) streak += 1;
      else if (i > 0) break;
    }
    return streak;
  },

  calculatePace(startDate, sectionsData, totalSections) {
    if (!startDate) return null;
    const wd = Utils.getCurrentWeekAndDay(startDate);
    if (!wd) return null;
    const { week, day } = wd;
    
    // Calculate sections expected based on actual weekly plan
    let sectionsExpected = 0;
    if (window.SEED_DATA && window.SEED_DATA.weeks) {
      // Sum up all sections from completed weeks + current week's progress
      for (let w = 1; w < week; w++) {
        const weekData = window.SEED_DATA.weeks.find(wk => wk.weekNum === w);
        if (weekData) {
          const weekSections = weekData.days.flatMap(d => d.sections);
          sectionsExpected += weekSections.length;
        }
      }
      
      // Add proportional sections from current week based on day
      const currentWeekData = window.SEED_DATA.weeks.find(wk => wk.weekNum === week);
      if (currentWeekData) {
        const weekSections = currentWeekData.days.flatMap(d => d.sections);
        sectionsExpected += Math.round((day / 7) * weekSections.length);
      }
    } else {
      // Fallback to linear calculation if SEED_DATA not available
      const daysElapsed = (week - 1) * 7 + day;
      const totalDays = 14 * 7;
      sectionsExpected = Math.round((daysElapsed / totalDays) * totalSections);
    }
    
    const sectionsDone = Object.values(sectionsData || {}).filter((s) => s?.read).length;
    const diff = sectionsDone - sectionsExpected;
    const start = new Date(startDate);
    const projectedFinish = new Date(start);
    projectedFinish.setDate(projectedFinish.getDate() + 98);
    const onTrack = diff > 2 ? "ahead" : diff < -2 ? "behind" : "on-track";
    return {
      currentWeek: week,
      currentDay: day,
      sectionsDone,
      sectionsExpected,
      totalSections,
      daysAhead: diff,
      projectedFinishDate: projectedFinish.toISOString().split("T")[0],
      onTrack
    };
  },

  calculateBookCompletion(sectionsData, totalSections) {
    if (!totalSections) return 0;
    const done = Object.values(sectionsData || {}).filter((s) => s?.read).length;
    return Math.round((done / totalSections) * 100);
  },

  calculateWeekGrade(weekNum, sectionsData, weekSeedData, problems, startDate, dayMeta = {}) {
    const weekSections = (weekSeedData?.days || []).flatMap((d) => (d.sections || []).map((s) => s.key));
    const done = weekSections.filter((k) => sectionsData[k]?.read).length;
    const pct = weekSections.length > 0 ? (done / weekSections.length) * 100 : 0;

    let bonus = 0;
    if (startDate) {
      const weekDateKeys = new Set();
      for (let day = 1; day <= 7; day += 1) {
        weekDateKeys.add(Utils.getDateFromWeekDayKey(startDate, `w${weekNum}d${day}`));
      }

      const solvedInWeek = (problems || []).filter((p) => {
        const d = p.solvedAt?.split("T")[0];
        return d && weekDateKeys.has(d);
      }).length;

      const timeInWeek = Object.entries(dayMeta)
        .filter(([k]) => k.startsWith(`w${weekNum}d`))
        .reduce((sum, [, v]) => sum + (v?.timeMinutes || 0), 0);

      if (solvedInWeek >= 7) bonus += 5;
      if (timeInWeek >= 7 * 60) bonus += 5;
    }

    const score = Math.min(100, pct + bonus);
    if (score >= 90) return "A";
    if (score >= 75) return "B";
    if (score >= 60) return "C";
    return "D";
  },

  getTagWeaknesses(problems) {
    const tagMap = {};
    (problems || []).forEach((p) => {
      (p.tags || []).forEach((tag) => {
        if (!tagMap[tag]) tagMap[tag] = { count: 0, solo: 0 };
        tagMap[tag].count += 1;
        if (p.solveMethod === "solo") tagMap[tag].solo += 1;
      });
    });

    return Object.entries(tagMap)
      .map(([tag, d]) => ({
        tag,
        count: d.count,
        soloRate: d.count > 0 ? Math.round((d.solo / d.count) * 100) : 0
      }))
      .filter((t) => t.count < 3)
      .sort((a, b) => a.count - b.count);
  },

  getDeadDays(startDate, problems, dayMeta) {
    if (!startDate) return [];
    const activeDates = new Set(
      [
        ...(problems || []).map((p) => p.solvedAt?.split("T")[0]),
        ...Object.entries(dayMeta || {})
          .filter(([, v]) => (v.timeMinutes || 0) > 0)
          .map(([k]) => Utils.getDateFromWeekDayKey(startDate, k))
      ].filter(Boolean)
    );

    const dead = [];
    const today = new Date();
    const start = new Date(startDate);
    for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      if (!activeDates.has(key)) dead.push(key);
    }
    return dead;
  },

  debounce(fn, delay) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  },

  getTotalTimeTodayMinutes() {
    const pomo = Store.pomodoroLog
      .getToday()
      .filter((s) => s.type === "focus" && s.status === "completed")
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    const study = Store.studySessions
      .getToday()
      .reduce((sum, s) => sum + (s.actualMinutes || 0), 0);

    return pomo + study;
  },

  escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  },

  // Habit validation functions
  validateHabitName(name) {
    if (!name || typeof name !== "string") {
      return { valid: false, error: "Name is required" };
    }
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: "Name cannot be empty or whitespace only" };
    }
    if (trimmed.length > 100) {
      return { valid: false, error: "Name cannot exceed 100 characters" };
    }
    return { valid: true };
  },

  validateDescription(description) {
    if (description === null || description === undefined || description === "") {
      return { valid: true }; // Optional field
    }
    if (typeof description !== "string") {
      return { valid: false, error: "Description must be a string" };
    }
    if (description.length > 500) {
      return { valid: false, error: "Description cannot exceed 500 characters" };
    }
    return { valid: true };
  },

  validateFrequency(frequency) {
    if (!frequency || typeof frequency !== "object") {
      return { valid: false, error: "Frequency is required and must be an object" };
    }

    const { type, weekdays, interval } = frequency;

    if (type === "daily") {
      return { valid: true };
    }

    if (type === "weekdays") {
      if (!Array.isArray(weekdays)) {
        return { valid: false, error: "Weekdays must be an array" };
      }
      if (weekdays.length === 0) {
        return { valid: false, error: "At least one weekday must be selected" };
      }
      if (!weekdays.every(d => Number.isInteger(d) && d >= 0 && d <= 6)) {
        return { valid: false, error: "Weekdays must be integers between 0 and 6" };
      }
      return { valid: true };
    }

    if (type === "custom") {
      if (!Number.isInteger(interval) || interval <= 0) {
        return { valid: false, error: "Custom interval must be a positive integer" };
      }
      return { valid: true };
    }

    return { valid: false, error: "Frequency type must be 'daily', 'weekdays', or 'custom'" };
  },

  validateColor(color) {
    if (!color || typeof color !== "string") {
      return { valid: false, error: "Color is required" };
    }

    // Check if it's a predefined color name
    if (Utils.HABIT_COLORS[color]) {
      return { valid: true };
    }

    // Check if it's a valid hex code (#RRGGBB or #RGB)
    const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    if (hexPattern.test(color)) {
      return { valid: true };
    }

    return { valid: false, error: "Color must be a valid hex code (#RRGGBB or #RGB) or predefined color name" };
  },

  validateIcon(icon) {
    if (!icon || typeof icon !== "string") {
      return { valid: false, error: "Icon is required" };
    }

    if (Utils.HABIT_ICONS.includes(icon)) {
      return { valid: true };
    }

    return { valid: false, error: "Icon must be from the predefined icon set" };
  },

  validateTime(time) {
    if (!time || typeof time !== "string") {
      return { valid: false, error: "Time is required" };
    }

    const timePattern = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timePattern.test(time)) {
      return { valid: false, error: "Time must be in HH:MM format (00:00 to 23:59)" };
    }

    return { valid: true };
  },

  validateNotes(notes) {
    if (notes === null || notes === undefined || notes === "") {
      return { valid: true }; // Optional field
    }
    if (typeof notes !== "string") {
      return { valid: false, error: "Notes must be a string" };
    }
    if (notes.length > 500) {
      return { valid: false, error: "Notes cannot exceed 500 characters" };
    }
    return { valid: true };
  }
};
