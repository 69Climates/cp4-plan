const KEYS = {
  settings: "cp4_settings",
  sections: "cp4_sections",
  dayMeta: "cp4_day_meta",
  weekData: "cp4_week_data",
  problems: "cp4_problems",
  contests: "cp4_contests",
  notes: "cp4_notes",
  quickCaptures: "cp4_quick_captures",
  templates: "cp4_templates",
  mistakes: "cp4_mistakes",
  pomodoroLog: "cp4_pomodoro_log",
  studySessions: "cp4_study_sessions",
  doomNotes: "cp4_doom_notes",
  habits: "cp4_habits",
  habitCompletions: "cp4_habit_completions",
  lastModified: "cp4_last_modified"
};

const Store = {
  _get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? null;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      Store.handleStorageError(error, 'read', key);
      return null;
    }
  },

  _set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      Store.handleStorageError(error, 'write', key);
      throw error; // Re-throw so callers know the operation failed
    }
  },
  
  // Storage error handling (Subtask 19.3)
  handleStorageError(error, operation, key) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      // Storage quota exceeded
      if (window.showToast) {
        window.showToast(
          "Storage quota exceeded. Please free up space by deleting old data or clearing browser cache.",
          "error",
          6000
        );
      } else {
        alert(
          "Storage quota exceeded!\n\n" +
          "Your browser's storage is full. To continue:\n" +
          "1. Delete old habits or completion history\n" +
          "2. Clear browser cache and data\n" +
          "3. Export your data first to avoid losing it"
        );
      }
    } else if (error.name === 'SecurityError') {
      // Storage access denied (private browsing, etc.)
      if (window.showToast) {
        window.showToast(
          "Storage access denied. Private browsing mode may prevent data persistence.",
          "error",
          5000
        );
      }
    } else {
      // Generic storage error
      if (window.showToast) {
        window.showToast(
          `Storage error: ${error.message}. Your data may not be saved.`,
          "error",
          4000
        );
      }
    }
  },
  
  validateStoredData(key, validator) {
    try {
      const data = Store._get(key);
      if (!data) return null;
      
      // If validator function provided, use it
      if (validator && typeof validator === 'function') {
        return validator(data) ? data : null;
      }
      
      // Basic validation: check if it's an object or array
      if (typeof data === 'object') {
        return data;
      }
      
      return null;
    } catch (error) {
      console.error(`Error validating stored data (${key}):`, error);
      return null;
    }
  },
  
  // Check available storage space
  checkStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate().then(estimate => {
        const percentUsed = (estimate.usage / estimate.quota) * 100;
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          percentUsed: percentUsed.toFixed(2),
          available: estimate.quota - estimate.usage
        };
      });
    }
    return Promise.resolve(null);
  },

  // Track last modified item (for week plan "Continue learning" badge)
  _trackLastModified(type, key) {
    const timestamp = Date.now();
    const lastModified = {
      type,      // 'section', 'day', or 'week'
      key,       // e.g., 'w1d1s1', 'w1d1', 'w1'
      timestamp
    };
    Store._set(KEYS.lastModified, lastModified);
  },

  // Get the most recently modified item
  getLastModified() {
    return Store._get(KEYS.lastModified) ?? null;
  },

  settings: {
    get() {
      return Store._get(KEYS.settings) ?? {};
    },

    set(obj) {
      Store._set(KEYS.settings, obj);
    },

    update(fn) {
      const cur = Store.settings.get();
      Store.settings.set(fn(cur));
    }
  },

  sections: {
    get() {
      return Store._get(KEYS.sections) ?? {};
    },

    getOne(key) {
      return Store.sections.get()[key] ?? null;
    },

    setOne(key, obj) {
      const all = Store.sections.get();
      all[key] = { ...(all[key] ?? {}), ...obj };
      Store._set(KEYS.sections, all);
      
      // Track last modified timestamp
      Store._trackLastModified('section', key);
    },

    setAll(obj) {
      Store._set(KEYS.sections, obj);
    }
  },

  dayMeta: {
    get() {
      return Store._get(KEYS.dayMeta) ?? {};
    },

    getDay(wdKey) {
      return Store.dayMeta.get()[wdKey] ?? {};
    },

    setDay(wdKey, obj) {
      const all = Store.dayMeta.get();
      all[wdKey] = { ...(all[wdKey] ?? {}), ...obj };
      Store._set(KEYS.dayMeta, all);
      
      // Track last modified timestamp
      Store._trackLastModified('day', wdKey);
    }
  },

  weekData: {
    get() {
      return Store._get(KEYS.weekData) ?? {};
    },

    getWeek(w) {
      return Store.weekData.get()[`w${w}`] ?? {};
    },

    setWeek(w, obj) {
      const all = Store.weekData.get();
      all[`w${w}`] = { ...(all[`w${w}`] ?? {}), ...obj };
      Store._set(KEYS.weekData, all);
      
      // Track last modified timestamp
      Store._trackLastModified('week', `w${w}`);
    }
  },

  problems: {
    getAll() {
      return Store._get(KEYS.problems) ?? [];
    },

    getById(id) {
      return Store.problems.getAll().find((p) => p.id === id);
    },

    add(p) {
      const all = Store.problems.getAll();
      all.unshift(p);
      Store._set(KEYS.problems, all);
    },

    update(id, ch) {
      const all = Store.problems.getAll().map((p) =>
        p.id === id ? { ...p, ...(typeof ch === "function" ? ch(p) : ch) } : p
      );
      Store._set(KEYS.problems, all);
    },

    delete(id) {
      Store._set(
        KEYS.problems,
        Store.problems.getAll().filter((p) => p.id !== id)
      );
    }
  },

  contests: {
    getAll() {
      return Store._get(KEYS.contests) ?? [];
    },

    getById(id) {
      return Store.contests.getAll().find((c) => c.id === id);
    },

    add(c) {
      const all = Store.contests.getAll();
      all.unshift(c);
      Store._set(KEYS.contests, all);
    },

    update(id, ch) {
      const all = Store.contests.getAll().map((c) =>
        c.id === id ? { ...c, ...(typeof ch === "function" ? ch(c) : ch) } : c
      );
      Store._set(KEYS.contests, all);
    },

    delete(id) {
      Store._set(
        KEYS.contests,
        Store.contests.getAll().filter((c) => c.id !== id)
      );
    }
  },

  notes: {
    getAll() {
      return Store._get(KEYS.notes) ?? [];
    },

    add(n) {
      const all = Store.notes.getAll();
      all.unshift(n);
      Store._set(KEYS.notes, all);
    },

    update(id, ch) {
      Store._set(
        KEYS.notes,
        Store.notes
          .getAll()
          .map((n) => (n.id === id ? { ...n, ...(typeof ch === "function" ? ch(n) : ch) } : n))
      );
    },

    delete(id) {
      Store._set(
        KEYS.notes,
        Store.notes.getAll().filter((n) => n.id !== id)
      );
    }
  },

  quickCaptures: {
    getAll() {
      return Store._get(KEYS.quickCaptures) ?? [];
    },

    add(text) {
      const all = Store.quickCaptures.getAll();
      all.unshift({
        id: Utils.generateId(),
        text,
        timestamp: new Date().toISOString(),
        isReviewed: false
      });
      Store._set(KEYS.quickCaptures, all);
    },

    markReviewed(id) {
      Store._set(
        KEYS.quickCaptures,
        Store.quickCaptures
          .getAll()
          .map((c) => (c.id === id ? { ...c, isReviewed: true } : c))
      );
    },

    delete(id) {
      Store._set(
        KEYS.quickCaptures,
        Store.quickCaptures.getAll().filter((c) => c.id !== id)
      );
    }
  },

  templates: {
    getAll() {
      return Store._get(KEYS.templates) ?? {};
    },

    update(key, obj) {
      const all = Store.templates.getAll();
      all[key] = {
        ...(all[key] ?? {}),
        ...obj,
        updatedAt: new Date().toISOString()
      };
      Store._set(KEYS.templates, all);
    }
  },

  mistakes: {
    getAll() {
      return Store._get(KEYS.mistakes) ?? [];
    },

    add(m) {
      const all = Store.mistakes.getAll();
      all.unshift(m);
      Store._set(KEYS.mistakes, all);
    },

    update(id, ch) {
      Store._set(
        KEYS.mistakes,
        Store.mistakes.getAll().map((m) =>
          m.id === id ? { ...m, ...(typeof ch === "function" ? ch(m) : ch) } : m
        )
      );
    },

    delete(id) {
      Store._set(
        KEYS.mistakes,
        Store.mistakes.getAll().filter((m) => m.id !== id)
      );
    },

    increment(id) {
      Store.mistakes.update(id, (m) => ({
        frequency: (m.frequency ?? 1) + 1,
        lastOccurred: new Date().toISOString().split("T")[0]
      }));
    }
  },

  pomodoroLog: {
    getAll() {
      return Store._get(KEYS.pomodoroLog) ?? [];
    },

    add(s) {
      const all = Store.pomodoroLog.getAll();
      all.unshift(s);
      Store._set(KEYS.pomodoroLog, all);
    },

    getToday() {
      const today = Utils.getTodayKey();
      return Store.pomodoroLog.getAll().filter((s) => s.date === today);
    }
  },

  studySessions: {
    getAll() {
      return Store._get(KEYS.studySessions) ?? [];
    },

    add(s) {
      const all = Store.studySessions.getAll();
      all.unshift(s);
      Store._set(KEYS.studySessions, all);
    },

    getToday() {
      const today = Utils.getTodayKey();
      return Store.studySessions.getAll().filter((s) => s.date === today);
    }
  },

  doomNotes: {
    get() {
      return Store._get(KEYS.doomNotes) ?? "";
    },

    set(text) {
      Store._set(KEYS.doomNotes, text);
    }
  },

  habits: {
    getAll() {
      const habits = Store._get(KEYS.habits) ?? [];
      
      // Validate and filter corrupted data (Subtask 19.3)
      if (!Array.isArray(habits)) {
        console.error("Habits data is corrupted (not an array)");
        return [];
      }
      
      return habits.filter(habit => {
        // Basic validation: must have required fields
        if (!habit || typeof habit !== 'object') return false;
        if (!habit.id || !habit.name) return false;
        if (!habit.frequency || typeof habit.frequency !== 'object') return false;
        
        return true;
      });
    },

    getById(id) {
      return Store.habits.getAll().find(h => h.id === id);
    },

    getActive() {
      return Store.habits.getAll()
        .filter(h => !h.archived)
        .sort((a, b) => a.displayOrder - b.displayOrder);
    },

    getArchived() {
      return Store.habits.getAll()
        .filter(h => h.archived)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    add(habit) {
      const all = Store.habits.getAll();
      const maxOrder = Math.max(0, ...all.map(h => h.displayOrder || 0));
      const newHabit = {
        ...habit,
        id: Utils.generateId(),
        displayOrder: maxOrder + 1,
        archived: false,
        createdAt: new Date().toISOString()
      };
      all.push(newHabit);
      Store._set(KEYS.habits, all);
      return newHabit;
    },

    update(id, changes) {
      const all = Store.habits.getAll().map(h =>
        h.id === id ? { ...h, ...changes } : h
      );
      Store._set(KEYS.habits, all);
    },

    delete(id) {
      // Delete habit and all completions
      Store._set(KEYS.habits,
        Store.habits.getAll().filter(h => h.id !== id)
      );
      Store.habitCompletions.deleteByHabitId(id);
    },

    reorder(habitIds) {
      const all = Store.habits.getAll();
      habitIds.forEach((id, index) => {
        const habit = all.find(h => h.id === id);
        if (habit) habit.displayOrder = index;
      });
      Store._set(KEYS.habits, all);
    },

    // Completion methods
    getCompletions(habitId, startDate, endDate) {
      return Store.habitCompletions.getAll()
        .filter(c => {
          if (c.habitId !== habitId) return false;
          if (startDate && c.date < startDate) return false;
          if (endDate && c.date > endDate) return false;
          return true;
        });
    },

    isCompleted(habitId, date) {
      return Store.habitCompletions.getAll()
        .some(c => c.habitId === habitId && c.date === date);
    },

    addCompletion(habitId, date, notes = "") {
      const completion = {
        id: Utils.generateId(),
        habitId,
        date,
        completedAt: new Date().toISOString(),
        notes
      };
      const all = Store.habitCompletions.getAll();
      all.push(completion);
      Store._set(KEYS.habitCompletions, all);
      return completion;
    },

    deleteCompletion(habitId, date) {
      Store._set(KEYS.habitCompletions,
        Store.habitCompletions.getAll()
          .filter(c => !(c.habitId === habitId && c.date === date))
      );
    },

    updateCompletionNotes(habitId, date, notes) {
      const all = Store.habitCompletions.getAll().map(c =>
        (c.habitId === habitId && c.date === date)
          ? { ...c, notes }
          : c
      );
      Store._set(KEYS.habitCompletions, all);
    }
  },

  habitCompletions: {
    getAll() {
      const completions = Store._get(KEYS.habitCompletions) ?? [];
      
      // Validate and filter corrupted data (Subtask 19.3)
      if (!Array.isArray(completions)) {
        console.error("Habit completions data is corrupted (not an array)");
        return [];
      }
      
      return completions.filter(completion => {
        // Basic validation: must have required fields
        if (!completion || typeof completion !== 'object') return false;
        if (!completion.id || !completion.habitId || !completion.date) return false;
        
        return true;
      });
    },

    getByDate(date) {
      return Store.habitCompletions.getAll()
        .filter(c => c.date === date);
    },

    getByHabitId(habitId) {
      return Store.habitCompletions.getAll()
        .filter(c => c.habitId === habitId)
        .sort((a, b) => b.date.localeCompare(a.date));
    },

    deleteByHabitId(habitId) {
      Store._set(KEYS.habitCompletions,
        Store.habitCompletions.getAll()
          .filter(c => c.habitId !== habitId)
      );
    }
  },

  exportAll() {
    const data = {};
    Object.values(KEYS).forEach((k) => {
      data[k] = Store._get(k);
    });
    return JSON.stringify(data, null, 2);
  },

  importAll(jsonStr) {
    const data = JSON.parse(jsonStr);
    Object.entries(data).forEach(([k, v]) => {
      localStorage.setItem(k, JSON.stringify(v));
    });
  },

  resetAll() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  }
};
