const WeekplanPage = (() => {
  let initialized = false;

  function understandingSelect(value) {
    return `
      <select data-field="understanding" class="input" style="max-width:130px">
        <option value="">U/P/C</option>
        <option value="understood" ${value === "understood" ? "selected" : ""}>U</option>
        <option value="partial" ${value === "partial" ? "selected" : ""}>P</option>
        <option value="confused" ${value === "confused" ? "selected" : ""}>C</option>
      </select>
    `;
  }

  function difficultySelect(value) {
    return `
      <select data-field="difficulty" class="input" style="max-width:130px">
        <option value="">E/M/H</option>
        <option value="easy" ${value === "easy" ? "selected" : ""}>E</option>
        <option value="medium" ${value === "medium" ? "selected" : ""}>M</option>
        <option value="hard" ${value === "hard" ? "selected" : ""}>H</option>
      </select>
    `;
  }

  function dayStatusDot(status) {
    if (status === "good") return "good";
    if (status === "bad") return "bad";
    return "mid";
  }

  function formatLastUpdatedItem() {
    const lastModified = Store.getLastModified();
    
    // Default to W1D1 if no modifications exist
    if (!lastModified || !lastModified.key) {
      return "W1D1: Competitive Programming + Competitions Overview";
    }

    const { type, key } = lastModified;

    // Parse the key to extract week and day information
    if (type === 'section') {
      // Section key format: "w1d1_1.1" or "w1d1s1"
      const match = key.match(/w(\d+)d(\d+)/);
      if (match) {
        const weekNum = parseInt(match[1], 10);
        const dayNum = parseInt(match[2], 10);
        
        // Find the week and day in SEED_DATA
        const week = SEED_DATA.weeks.find(w => w.weekNum === weekNum);
        if (week) {
          const day = week.days.find(d => d.dayNum === dayNum);
          if (day) {
            // Find the specific section
            const section = day.sections.find(s => s.key === key);
            if (section) {
              return `W${weekNum}D${dayNum} Section: ${section.title}`;
            }
            // If section not found, just return day info
            return `W${weekNum}D${dayNum}: ${day.topic}`;
          }
        }
      }
    } else if (type === 'day') {
      // Day key format: "w1d1"
      const match = key.match(/w(\d+)d(\d+)/);
      if (match) {
        const weekNum = parseInt(match[1], 10);
        const dayNum = parseInt(match[2], 10);
        
        // Find the week and day in SEED_DATA
        const week = SEED_DATA.weeks.find(w => w.weekNum === weekNum);
        if (week) {
          const day = week.days.find(d => d.dayNum === dayNum);
          if (day) {
            return `W${weekNum}D${dayNum}: ${day.topic}`;
          }
        }
      }
    } else if (type === 'week') {
      // Week key format: "w1"
      const match = key.match(/w(\d+)/);
      if (match) {
        const weekNum = parseInt(match[1], 10);
        
        // Find the week in SEED_DATA
        const week = SEED_DATA.weeks.find(w => w.weekNum === weekNum);
        if (week) {
          return `W${weekNum}: ${week.title}`;
        }
      }
    }

    // Fallback to default if parsing fails
    return "W1D1: Competitive Programming + Competitions Overview";
  }

  function renderWeekCards(focusSection = "") {
    const root = document.getElementById("week-cards");
    const sections = Store.sections.get();
    const dayMetaAll = Store.dayMeta.get();
    const weekDataAll = Store.weekData.get();

    const currentBadge = document.getElementById("weekplan-current");
    if (currentBadge) {
      currentBadge.classList.remove("success", "warning", "danger");
      const lastUpdatedItem = formatLastUpdatedItem();
      currentBadge.textContent = `Continue learning ${lastUpdatedItem}`;
    }

    const html = [];

    SEED_DATA.weeks.forEach((week) => {
      const isOpen = false;
      const weekData = weekDataAll[`w${week.weekNum}`] || { checklist: {} };

      html.push(`
        <article class="week-card ${isOpen ? "open" : ""}" data-week="${week.weekNum}">
          <button class="week-header" type="button">
            <strong>Week ${week.weekNum}: ${Utils.escapeHtml(week.title)}</strong>
            <small class="muted">${Utils.escapeHtml(week.officialPlan)}</small>
          </button>
          <div class="week-body">
            ${week.days
              .map((day) => {
                const wdKey = Utils.getWeekDayKey(week.weekNum, day.dayNum);
                const dm = dayMetaAll[wdKey] || {};
                return `
                  <div class="day-card" data-wdkey="${wdKey}">
                    <div class="row-wrap space-between">
                      <h4>Day ${day.dayNum}: ${Utils.escapeHtml(day.topic)}</h4>
                      <span class="status-dot ${dayStatusDot(dm.status)}"></span>
                    </div>
                    <small class="muted">${Utils.escapeHtml(day.chapterRef || "")}</small>

                    <div class="form-grid">
                      ${day.sections
                        .map((sec) => {
                          const st = sections[sec.key] || {};
                          const focus = focusSection === sec.key ? "style=\"outline:1px solid var(--primary)\"" : "";
                          return `
                            <div class="section-row" data-section="${sec.key}" ${focus}>
                              <div class="row-wrap">
                                <label><input type="checkbox" data-field="read" ${st.read ? "checked" : ""}> Read</label>
                                <strong>${Utils.escapeHtml(sec.title)}</strong>
                              </div>
                              <div class="section-meta">
                                ${understandingSelect(st.understanding)}
                                ${difficultySelect(st.difficulty)}
                                <label><input type="checkbox" data-field="implemented" ${st.implemented ? "checked" : ""}> Impl</label>
                                <label><input type="checkbox" data-field="reread" ${st.reread ? "checked" : ""}> Reread</label>
                              </div>
                            </div>
                          `;
                        })
                        .join("")}
                    </div>

                    <div class="grid-2">
                      <label><span>Problems +/-</span><input data-day-field="problemsDelta" class="input" type="number" value="${dm.problemsDelta ?? 0}"></label>
                      <label><span>Time (min)</span><input data-day-field="timeMinutes" class="input" type="number" min="0" value="${dm.timeMinutes ?? 0}"></label>
                      <label><span>Estimate</span><input data-day-field="estimate" class="input" value="${Utils.escapeHtml(dm.estimate || "")}"></label>
                      <label>
                        <span>Status</span>
                        <select data-day-field="status" class="input">
                          <option value="mid" ${dm.status === "mid" ? "selected" : ""}>Mid</option>
                          <option value="good" ${dm.status === "good" ? "selected" : ""}>Good</option>
                          <option value="bad" ${dm.status === "bad" ? "selected" : ""}>Bad</option>
                        </select>
                      </label>
                    </div>
                    <label><span>Day Notes</span><textarea data-day-field="notes" class="input" rows="2">${Utils.escapeHtml(dm.notes || "")}</textarea></label>
                  </div>
                `;
              })
              .join("")}

            <hr>
            <h4>Chapter Summary</h4>
            <textarea data-week-summary="${week.weekNum}" class="input" rows="3">${Utils.escapeHtml(weekData.summary || "")}</textarea>

            <h4>Pre-exam Checklist</h4>
            <div class="form-grid">
              ${week.checklist
                .map((item, i) => {
                  const key = `item${i}`;
                  const checked = !!weekData.checklist?.[key];
                  return `<label><input type="checkbox" data-week-check="${week.weekNum}" data-check-key="${key}" ${checked ? "checked" : ""}> ${Utils.escapeHtml(item)}</label>`;
                })
                .join("")}
            </div>
          </div>
        </article>
      `);

      if (week.weekNum === 6) {
        html.push('<div class="break-banner">MID-SEMESTER BREAK - Revise weak areas. Clear upsolve queue. Rest.</div>');
      }
      if (week.weekNum === 14) {
        html.push('<div class="break-banner">FINAL Checkout</div>');
      }
    });

    root.innerHTML = html.join("");
  }

  function bindEvents() {
    const root = document.getElementById("week-cards");
    if (!root) return;
    if (root.dataset.bound === "1") return;
    root.dataset.bound = "1";

    root.addEventListener("click", (e) => {
      const head = e.target.closest(".week-header");
      if (!head) return;

      const card = head.parentElement;
      const wasOpen = card.classList.contains("open");

      root.querySelectorAll(".week-card.open").forEach((node) => {
        node.classList.remove("open");
      });

      if (!wasOpen) {
        card.classList.add("open");
      }
    });

    root.addEventListener("change", (e) => {
      const sectionRow = e.target.closest(".section-row");
      if (sectionRow) {
        const key = sectionRow.getAttribute("data-section");
        const field = e.target.getAttribute("data-field");
        if (!key || !field) return;
        const current = Store.sections.getOne(key) || {};
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value || null;
        Store.sections.setOne(key, { ...current, [field]: value });
        return;
      }

      const dayCard = e.target.closest(".day-card");
      if (dayCard && e.target.hasAttribute("data-day-field")) {
        const wdKey = dayCard.getAttribute("data-wdkey");
        const field = e.target.getAttribute("data-day-field");
        const cur = Store.dayMeta.getDay(wdKey);
        let value = e.target.value;
        if (e.target.type === "number") value = Number(value || 0);
        Store.dayMeta.setDay(wdKey, { ...cur, [field]: value });
        return;
      }

      if (e.target.hasAttribute("data-week-check")) {
        const weekNum = e.target.getAttribute("data-week-check");
        const checkKey = e.target.getAttribute("data-check-key");
        const cur = Store.weekData.getWeek(weekNum);
        Store.weekData.setWeek(weekNum, {
          ...cur,
          checklist: {
            ...(cur.checklist || {}),
            [checkKey]: e.target.checked
          }
        });
      }
    });

    root.addEventListener("input", (e) => {
      if (!e.target.hasAttribute("data-week-summary")) return;
      const weekNum = e.target.getAttribute("data-week-summary");
      const cur = Store.weekData.getWeek(weekNum);
      Store.weekData.setWeek(weekNum, { ...cur, summary: e.target.value });
    });
  }

  function init(options = {}) {
    initialized = true;
    renderWeekCards(options.focusSection || "");
    bindEvents();
  }

  function onShow(options = {}) {
    renderWeekCards(options.focusSection || "");
    bindEvents();
  }

  return {
    init,
    onShow,
    isInitialized: () => initialized
  };
})();

window.WeekplanPage = WeekplanPage;
