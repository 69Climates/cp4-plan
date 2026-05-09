const ProblemsPage = (() => {
  let initialized = false;
  const TAG_SUGGESTIONS = [
    "2-sat",
    "binary search",
    "bitmasks",
    "brute force",
    "chinese remainder theorem",
    "combinatorics",
    "communication",
    "constructive algorithms",
    "data structures",
    "dfs and similar",
    "divide and conquer",
    "dp",
    "dsu",
    "expression parsing",
    "fft",
    "flows",
    "games",
    "geometry",
    "graph matchings",
    "graphs",
    "greedy",
    "hashing",
    "implementation",
    "interactive",
    "math",
    "matrices",
    "meet-in-the-middle",
    "number theory",
    "probabilities",
    "schedules",
    "shortest paths",
    "sortings",
    "string suffix structures",
    "strings",
    "ternary search",
    "trees",
    "two pointers"
  ];

  function parseTags(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return String(raw)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  function isSolvedProblem(problem) {
    const status = String(problem?.status || "").toLowerCase();
    return ["solved", "upsolved"].includes(status) || !!problem?.solvedAt;
  }

  function getSolvedProblems(list) {
    return (list || []).filter(isSolvedProblem);
  }

  function openQuickAddModal() {
    Modal.openModal("modal-quick-add");
    setTimeout(() => document.getElementById("qa-title")?.focus(), 80);
  }

  function setInlineFormOpen(open) {
    const form = document.getElementById("problem-quick-bar");
    const btn = document.getElementById("problem-inline-toggle");
    if (!form || !btn) return;

    form.classList.toggle("collapsed", !open);
    btn.textContent = open ? "Hide Form" : "Show Form";
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function saveProblem(data) {
    const p = {
      id: Utils.generateId(),
      title: data.title,
      platform: data.platform || "",
      link: data.link || "",
      tags: parseTags(data.tags),
      status: data.status || "solved",
      solveMethod: data.solveMethod || "solo",
      personalRating: Number(data.personalRating || 3),
      keyInsight: data.keyInsight || "",
      wrongApproaches: data.wrongApproaches || "",
      code: data.code || "",
      week: Number(data.week || 0) || null,
      bookRef: data.bookRef || "",
      createdAt: new Date().toISOString(),
      solvedAt: ["solved", "upsolved"].includes(data.status) ? new Date().toISOString() : null
    };

    Store.problems.add(p);
    window.showToast?.("Problem added", "success");
    render();
  }

  function readProblemForm(prefix) {
    const get = (suffix) => document.getElementById(`${prefix}-${suffix}`);
    return {
      title: get("title")?.value.trim() || "",
      platform: get("platform")?.value.trim() || "",
      link: get("link")?.value.trim() || "",
      tags: get("tags")?.value.trim() || "",
      status: get("status")?.value || "solved",
      solveMethod: get("method")?.value || "solo",
      personalRating: get("rating")?.value || "3",
      week: get("week")?.value || "",
      bookRef: get("book-ref")?.value.trim() || "",
      keyInsight: get("insight")?.value || "",
      wrongApproaches: get("wrong")?.value || ""
    };
  }

  function fromQuickBar(form) {
    const data = readProblemForm("pqb");
    if (!data.title) {
      window.showToast?.("Title is required", "error");
      return;
    }
    saveProblem(data);
    form.reset();
  }

  function getTagSearchParts(raw) {
    const text = String(raw || "");
    const lastComma = text.lastIndexOf(",");
    if (lastComma === -1) {
      return {
        prefix: "",
        token: text.trim().toLowerCase()
      };
    }

    return {
      prefix: text.slice(0, lastComma + 1),
      token: text.slice(lastComma + 1).trim().toLowerCase()
    };
  }

  function getTagCandidates(raw) {
    const { prefix, token } = getTagSearchParts(raw);
    const used = new Set(parseTags(prefix).map((tag) => tag.toLowerCase()));

    return TAG_SUGGESTIONS.filter((tag) => {
      const lower = tag.toLowerCase();
      if (used.has(lower)) return false;
      if (!token) return true;
      return lower.includes(token);
    }).slice(0, 8);
  }

  function hideTagSuggestions(listNode) {
    if (!listNode) return;
    listNode.classList.remove("show");
    listNode.innerHTML = "";
    delete listNode.dataset.activeIndex;
  }

  function setTagInputValue(inputNode, selectedTag) {
    const raw = String(inputNode.value || "");
    const lastComma = raw.lastIndexOf(",");
    const prefix = lastComma === -1 ? "" : `${raw.slice(0, lastComma + 1).trimEnd()} `;
    inputNode.value = `${prefix}${selectedTag}, `;
  }

  function getSuggestionButtons(listNode) {
    return Array.from(listNode.querySelectorAll(".tag-suggest-item"));
  }

  function setActiveSuggestion(listNode, index, shouldScroll = true) {
    const buttons = getSuggestionButtons(listNode);
    if (!buttons.length) return;

    const bounded = Math.max(0, Math.min(index, buttons.length - 1));
    listNode.dataset.activeIndex = String(bounded);
    buttons.forEach((btn, i) => {
      btn.classList.toggle("is-active", i === bounded);
      if (i === bounded && shouldScroll) {
        btn.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function selectTagSuggestion(inputNode, listNode, selectedTag) {
    setTagInputValue(inputNode, selectedTag);
    hideTagSuggestions(listNode);
    inputNode.focus();
  }

  function showTagSuggestions(inputNode, listNode) {
    if (!inputNode || !listNode) return;
    const candidates = getTagCandidates(inputNode.value);
    if (!candidates.length) {
      hideTagSuggestions(listNode);
      return;
    }

    listNode.innerHTML = candidates
      .map((tag) => `<button class="tag-suggest-item" type="button" data-tag="${Utils.escapeHtml(tag)}">${Utils.escapeHtml(tag)}</button>`)
      .join("");
    listNode.classList.add("show");
    setActiveSuggestion(listNode, 0, false);
  }

  function bindTagSuggestions(inputId, listId) {
    const inputNode = document.getElementById(inputId);
    const listNode = document.getElementById(listId);
    if (!inputNode || !listNode || listNode.dataset.bound === "1") return;

    listNode.dataset.bound = "1";

    inputNode.addEventListener("input", () => showTagSuggestions(inputNode, listNode));
    inputNode.addEventListener("focus", () => showTagSuggestions(inputNode, listNode));
    inputNode.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hideTagSuggestions(listNode);
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!listNode.classList.contains("show")) {
          showTagSuggestions(inputNode, listNode);
        }

        const buttons = getSuggestionButtons(listNode);
        if (!buttons.length) return;

        const cur = Number(listNode.dataset.activeIndex ?? 0);
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const next = (cur + delta + buttons.length) % buttons.length;
        setActiveSuggestion(listNode, next);
        return;
      }

      if (e.key === "Enter" && listNode.classList.contains("show")) {
        const buttons = getSuggestionButtons(listNode);
        if (!buttons.length) return;

        e.preventDefault();
        const cur = Number(listNode.dataset.activeIndex ?? 0);
        const active = buttons[Math.max(0, Math.min(cur, buttons.length - 1))];
        if (active) {
          selectTagSuggestion(inputNode, listNode, active.getAttribute("data-tag"));
        }
      }
    });
    inputNode.addEventListener("blur", () => {
      setTimeout(() => hideTagSuggestions(listNode), 120);
    });

    listNode.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });

    listNode.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tag]");
      if (!btn) return;
      selectTagSuggestion(inputNode, listNode, btn.getAttribute("data-tag"));
    });

    listNode.addEventListener("mousemove", (e) => {
      const btn = e.target.closest(".tag-suggest-item");
      if (!btn) return;
      const buttons = getSuggestionButtons(listNode);
      const idx = buttons.indexOf(btn);
      if (idx >= 0) setActiveSuggestion(listNode, idx, false);
    });
  }

  function sortProblems(list, sortBy) {
    const arr = [...list];
    if (sortBy === "oldest") arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === "rating_desc") arr.sort((a, b) => (b.personalRating || 0) - (a.personalRating || 0));
    if (sortBy === "rating_asc") arr.sort((a, b) => (a.personalRating || 0) - (b.personalRating || 0));
    if (sortBy === "newest") arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return arr;
  }


  function fuzzyMatch(text, query) {
    if (!query) return { score: 1, matches: true };
    
    text = text.toLowerCase();
    query = query.toLowerCase();
    
    // Exact match gets highest score
    if (text.includes(query)) {
      return { score: 100, matches: true };
    }
    
    // Fuzzy matching: check if all characters in query appear in order in text
    let textIndex = 0;
    let queryIndex = 0;
    let matchedIndices = [];
    
    while (textIndex < text.length && queryIndex < query.length) {
      if (text[textIndex] === query[queryIndex]) {
        matchedIndices.push(textIndex);
        queryIndex++;
      }
      textIndex++;
    }
    
    // All query characters must be found
    if (queryIndex !== query.length) {
      return { score: 0, matches: false };
    }
    
    // Calculate score based on how close together the matches are
    let totalDistance = 0;
    for (let i = 1; i < matchedIndices.length; i++) {
      totalDistance += matchedIndices[i] - matchedIndices[i - 1];
    }
    
    // Closer matches get higher scores (max 50 for fuzzy)
    const avgDistance = matchedIndices.length > 1 ? totalDistance / (matchedIndices.length - 1) : 1;
    const score = Math.max(1, 50 - avgDistance);
    
    return { score, matches: true };
  }

  function searchProblems(list, searchText) {
    if (!searchText) return list;
    
    const query = searchText.trim();
    if (!query) return list;
    
    // Search across multiple fields with scoring
    const scored = list.map(p => {
      const titleMatch = fuzzyMatch(p.title || "", query);
      const platformMatch = fuzzyMatch(p.platform || "", query);
      const tagsMatch = fuzzyMatch((p.tags || []).join(" "), query);
      const insightMatch = fuzzyMatch(p.keyInsight || "", query);
      const wrongMatch = fuzzyMatch(p.wrongApproaches || "", query);
      const bookRefMatch = fuzzyMatch(p.bookRef || "", query);
      
      // Weight different fields
      const totalScore = 
        titleMatch.score * 3 +        // Title is most important
        platformMatch.score * 2 +     // Platform is important
        tagsMatch.score * 2.5 +       // Tags are very important
        insightMatch.score * 1.5 +    // Insights are moderately important
        wrongMatch.score * 1 +        // Wrong approaches less important
        bookRefMatch.score * 1.5;     // Book reference moderately important
      
      const matches = titleMatch.matches || platformMatch.matches || 
                     tagsMatch.matches || insightMatch.matches || 
                     wrongMatch.matches || bookRefMatch.matches;
      
      return { problem: p, score: totalScore, matches };
    });
    
    // Filter and sort by score
    return scored
      .filter(item => item.matches)
      .sort((a, b) => b.score - a.score)
      .map(item => item.problem);
  }

  function applyFilter(list) {
    const text = (document.getElementById("problem-search-text")?.value || "").trim();
    const status = document.getElementById("problem-filter-status")?.value || "all";

    // First apply search with fuzzy matching
    let filtered = searchProblems(list, text);
    
    // Then apply status filter
    if (status !== "all") {
      filtered = filtered.filter(p => p.status === status);
    }
    
    return filtered;
  }

  function renderList() {
    const sortBy = document.getElementById("problem-sort")?.value || "newest";
    const list = sortProblems(applyFilter(Store.problems.getAll()), sortBy);

    document.getElementById("problem-count").textContent = `${list.length} problem(s)`;

    const root = document.getElementById("problem-list");
    if (!root) return;
    if (!list.length) {
      root.innerHTML = '<div class="empty-state">No problems match current filters.</div>';
      return;
    }

    root.innerHTML = list
      .map(
        (p) => `
      <article class="problem-row" data-id="${p.id}">
        <div class="problem-head">
          <div><strong>${Utils.escapeHtml(p.title)}</strong><br><small class="muted">${Utils.escapeHtml(p.platform || "-")}</small></div>
          <div>${(p.tags || []).map((t) => `<span class=\"chip\">${Utils.escapeHtml(t)}</span>`).join(" ")}</div>
          <div><span class="badge">${Utils.escapeHtml(p.status || "-")}</span></div>
          <div><span class="badge">R${p.personalRating || 0}</span></div>
          <div class="row-wrap">
            <button class="btn btn-xs" data-action="toggle" type="button">Expand</button>
            <button class="btn btn-xs" data-action="solved" type="button">Solved</button>
            <button class="btn btn-xs btn-danger" data-action="delete" type="button">Del</button>
          </div>
        </div>

        <div class="problem-expand">
          <div class="grid-2">
            <label><span>Solve Method</span>
              <select class="input" data-edit="solveMethod">
                <option value="solo" ${p.solveMethod === "solo" ? "selected" : ""}>solo</option>
                <option value="hint" ${p.solveMethod === "hint" ? "selected" : ""}>hint</option>
                <option value="editorial" ${p.solveMethod === "editorial" ? "selected" : ""}>editorial</option>
                <option value="team" ${p.solveMethod === "team" ? "selected" : ""}>team</option>
              </select>
            </label>
            <label><span>Status</span>
              <select class="input" data-edit="status">
                <option value="solved" ${p.status === "solved" ? "selected" : ""}>solved</option>
                <option value="upsolved" ${p.status === "upsolved" ? "selected" : ""}>upsolved</option>
                <option value="attempted" ${p.status === "attempted" ? "selected" : ""}>attempted</option>
                <option value="unsolved" ${p.status === "unsolved" ? "selected" : ""}>unsolved</option>
              </select>
            </label>
          </div>
          <label><span>Key Insight</span><textarea class="input" rows="2" data-edit="keyInsight">${Utils.escapeHtml(p.keyInsight || "")}</textarea></label>
          <label><span>Wrong Approaches</span><textarea class="input" rows="2" data-edit="wrongApproaches">${Utils.escapeHtml(p.wrongApproaches || "")}</textarea></label>
          <label><span>Code</span><textarea class="input" rows="5" data-edit="code">${Utils.escapeHtml(p.code || "")}</textarea></label>
          <div class="grid-2">
            <label><span>Week</span><input class="input" type="number" min="1" max="14" value="${p.week || ""}" data-edit="week"></label>
            <label><span>Book Ref</span><input class="input" value="${Utils.escapeHtml(p.bookRef || "")}" data-edit="bookRef"></label>
          </div>
          <div class="row-wrap">
            ${p.link ? `<a class=\"btn btn-xs\" href=\"${Utils.escapeHtml(p.link)}\" target=\"_blank\" rel=\"noreferrer\">Open Link</a>` : ""}
            <button class="btn btn-xs btn-primary" data-action="save" type="button">Save</button>
          </div>
        </div>
      </article>
    `
      )
      .join("");
  }

  function getHeatmapRoot() {
    return document.getElementById("problems-cf-heatmap") || document.getElementById("problems-tag-heatmap");
  }

  function renderProblemsHeatmap() {
    const root = getHeatmapRoot();
    if (!root) return;

    const card = root.closest("article");
    const heading = card?.querySelector("h3");
    if (heading) heading.textContent = "Problems Heatmap";

    const legacyWeekBtn = document.getElementById("tag-mode-week");
    const legacyAllBtn = document.getElementById("tag-mode-all");
    if (legacyWeekBtn) legacyWeekBtn.style.display = "none";
    if (legacyAllBtn) legacyAllBtn.style.display = "none";

    const solved = getSolvedProblems(Store.problems.getAll());

    Heatmap.render(root.id, {
      problems: solved,
      dayMeta: {},
      mode: "codeforces",
      accountCreationYear: 2026
    });

    const note = document.getElementById("problems-heatmap-note") || document.getElementById("tag-heatmap-note");
    if (!note) return;

    note.textContent = solved.length
      ? "Codeforces-style contribution view of solved problems since account creation year 2026."
      : "No solved problems yet. Solve one problem to start your grid.";
  }

  function ensureHeatmapAboveFilters() {
    const heatmapCard = getHeatmapRoot()?.closest("article");
    const filterCard = document.getElementById("problem-search-text")?.closest("article");
    if (!heatmapCard || !filterCard) return;

    const parent = filterCard.parentElement;
    if (!parent || heatmapCard.parentElement !== parent) return;

    if (heatmapCard.nextElementSibling !== filterCard) {
      parent.insertBefore(heatmapCard, filterCard);
    }
  }

  function render(options = {}) {
    ensureHeatmapAboveFilters();
    renderProblemsHeatmap();
    renderList();
  }

  function bindEvents() {
    document.getElementById("problem-quick-bar")?.addEventListener("submit", (e) => {
      e.preventDefault();
      fromQuickBar(e.currentTarget);
    });

    document.getElementById("problem-open-modal")?.addEventListener("click", openQuickAddModal);
    document.getElementById("problem-inline-toggle")?.addEventListener("click", () => {
      const form = document.getElementById("problem-quick-bar");
      const isOpen = form ? !form.classList.contains("collapsed") : false;
      setInlineFormOpen(!isOpen);
    });
    bindTagSuggestions("pqb-tags", "pqb-tag-suggestions");
    bindTagSuggestions("qa-tags", "qa-tag-suggestions");

    document.getElementById("quick-add-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = readProblemForm("qa");
      if (!data.title) {
        window.showToast?.("Title is required", "error");
        return;
      }
      saveProblem(data);
      e.currentTarget.reset();
      Modal.closeModal("modal-quick-add");
    });

    document.getElementById("quick-add-form")?.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        e.currentTarget.requestSubmit();
      }
    });

    ["problem-search-text", "problem-filter-status", "problem-sort"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", renderList);
      document.getElementById(id)?.addEventListener("change", renderList);
    });

    document.getElementById("problem-list")?.addEventListener("click", (e) => {
      const row = e.target.closest(".problem-row");
      if (!row) return;
      const id = row.getAttribute("data-id");
      const action = e.target.getAttribute("data-action");
      if (!action) return;

      if (action === "toggle") row.classList.toggle("show");
      if (action === "delete") {
        Store.problems.delete(id);
        render();
      }
      if (action === "solved") {
        Store.problems.update(id, { status: "solved", solvedAt: new Date().toISOString() });
        render();
      }
      if (action === "save") {
        const patch = {};
        row.querySelectorAll("[data-edit]").forEach((el) => {
          const key = el.getAttribute("data-edit");
          patch[key] = el.type === "number" ? Number(el.value || 0) : el.value;
        });
        Store.problems.update(id, patch);
        window.showToast?.("Problem updated", "success");
        render();
      }
    });
  }

  function init() {
    initialized = true;
    bindEvents();
    setInlineFormOpen(false);
    render();
  }

  function onShow(options = {}) {
    render(options);
    if (options.focusProblem) {
      const row = document.querySelector(`.problem-row[data-id=\"${options.focusProblem}\"]`);
      if (row) {
        row.classList.add("show");
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  return {
    init,
    onShow,
    openQuickAddModal,
    isInitialized: () => initialized
  };
})();

window.ProblemsPage = ProblemsPage;
