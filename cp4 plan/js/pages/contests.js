const ContestsPage = (() => {
  let initialized = false;

  function parseContestProblems(text) {
    return String(text || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [id, status = "unsolved", editorialRead = "false"] = line.split("|").map((x) => x.trim());
        return {
          id,
          status,
          editorialRead: editorialRead === "true"
        };
      });
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

  function searchContests(list, searchText) {
    if (!searchText) return list;
    
    const query = searchText.trim();
    if (!query) return list;
    
    // Search across multiple fields with scoring
    const scored = list.map(c => {
      const nameMatch = fuzzyMatch(c.name || "", query);
      const platformMatch = fuzzyMatch(c.platform || "", query);
      const problemIds = (c.problems || []).map(p => p.id).join(" ");
      const problemsMatch = fuzzyMatch(problemIds, query);
      
      // Weight different fields
      const totalScore = 
        nameMatch.score * 3 +         // Contest name is most important
        platformMatch.score * 2 +     // Platform is important
        problemsMatch.score * 1.5;    // Problem IDs moderately important
      
      const matches = nameMatch.matches || platformMatch.matches || problemsMatch.matches;
      
      return { contest: c, score: totalScore, matches };
    });
    
    // Filter and sort by score
    return scored
      .filter(item => item.matches)
      .sort((a, b) => b.score - a.score)
      .map(item => item.contest);
  }

  function sortContests(list, sortBy) {
    const arr = [...list];
    
    if (sortBy === "oldest") {
      arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === "score_desc") {
      arr.sort((a, b) => {
        const scoreA = parseContestScore(a.score);
        const scoreB = parseContestScore(b.score);
        return scoreB - scoreA;
      });
    } else if (sortBy === "rank_asc") {
      arr.sort((a, b) => {
        const rankA = a.rank || Infinity;
        const rankB = b.rank || Infinity;
        return rankA - rankB;
      });
    } else { // newest (default)
      arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    return arr;
  }

  function parseContestScore(scoreStr) {
    if (!scoreStr) return 0;
    const match = String(scoreStr).match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  function getUpsolveQueue() {
    const queue = [];
    Store.contests.getAll().forEach((c) => {
      (c.problems || []).forEach((p) => {
        if (p.status !== "solved" && p.status !== "upsolved") {
          queue.push({ contestId: c.id, contestName: c.name, ...p });
        }
      });
    });
    return queue;
  }

  function renderUpsolveQueue() {
    const root = document.getElementById("upsolve-queue");
    if (!root) return;
    const queue = getUpsolveQueue();

    if (!queue.length) {
      root.innerHTML = '<div class="empty-state">Upsolve queue is empty. Great work.</div>';
      return;
    }

    root.innerHTML = queue
      .map(
        (q) => `
      <article class="upsolve-item" data-contest-id="${q.contestId}" data-problem-id="${Utils.escapeHtml(q.id)}">
        <div class="row-wrap space-between">
          <strong>${Utils.escapeHtml(q.id)} - ${Utils.escapeHtml(q.contestName)}</strong>
          <div class="row-wrap">
            <span class="badge warning">${Utils.escapeHtml(q.status)}</span>
            <button class="btn btn-xs" data-q-action="upsolved" type="button">Mark Upsolved</button>
          </div>
        </div>
      </article>
    `
      )
      .join("");
  }

  function renderContests() {
    const searchText = document.getElementById("contest-search-text")?.value || "";
    const sortBy = document.getElementById("contest-sort")?.value || "newest";
    
    // Apply search first, then sort
    let list = Store.contests.getAll();
    list = searchContests(list, searchText);
    list = sortContests(list, sortBy);
    
    document.getElementById("contest-count").textContent = `${list.length} contest(s)`;
    const root = document.getElementById("contests-list");
    if (!root) return;

    if (!list.length) {
      const hasSearch = searchText.trim().length > 0;
      root.innerHTML = hasSearch 
        ? '<div class="empty-state">No contests match your search.</div>'
        : '<div class="empty-state">No contests logged yet.</div>';
      return;
    }

    root.innerHTML = list
      .map(
        (c) => `
      <article class="contest-card" data-id="${c.id}">
        <div class="row-wrap space-between">
          <div>
            <h4>${Utils.escapeHtml(c.name)}</h4>
            <small class="muted">${Utils.formatDate(c.date)} | ${Utils.escapeHtml(c.platform || "-")}</small>
          </div>
          <div class="row-wrap">
            <span class="badge">Score ${Utils.escapeHtml(c.score || "-")}</span>
            <span class="badge">Rank ${c.rank || "-"}</span>
            <button class="btn btn-xs btn-danger" data-action="delete" type="button">Delete</button>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead><tr><th>Problem</th><th>Status</th><th>Editorial</th><th>Actions</th></tr></thead>
            <tbody>
              ${(c.problems || [])
                .map(
                  (p) => `
                <tr data-problem-id="${Utils.escapeHtml(p.id)}">
                  <td>${Utils.escapeHtml(p.id)}</td>
                  <td>
                    <select class="input" data-field="status" style="max-width:130px">
                      <option value="solved" ${p.status === "solved" ? "selected" : ""}>solved</option>
                      <option value="attempted" ${p.status === "attempted" ? "selected" : ""}>attempted</option>
                      <option value="unsolved" ${p.status === "unsolved" ? "selected" : ""}>unsolved</option>
                      <option value="upsolved" ${p.status === "upsolved" ? "selected" : ""}>upsolved</option>
                    </select>
                  </td>
                  <td><label><input type="checkbox" data-field="editorialRead" ${p.editorialRead ? "checked" : ""}> Read</label></td>
                  <td><button class="btn btn-xs" data-action="save-problem" type="button">Save</button></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </article>
    `
      )
      .join("");
  }

  function render() {
    renderUpsolveQueue();
    renderContests();
  }

  function bindAccordion() {
    const acc = document.getElementById("contest-add-accordion");
    if (!acc) return;
    acc.querySelector(".accordion-header")?.addEventListener("click", () => {
      acc.classList.toggle("show");
      // Initialize date input when accordion opens
      if (acc.classList.contains("show")) {
        Utils.initializeDateInput("contest-date");
      }
    });
  }

  function bindForm() {
    document.getElementById("contest-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const contest = {
        id: Utils.generateId(),
        name: document.getElementById("contest-name").value.trim(),
        date: document.getElementById("contest-date").value,
        platform: document.getElementById("contest-platform").value.trim(),
        rank: Number(document.getElementById("contest-rank").value || 0) || null,
        score: document.getElementById("contest-score").value.trim(),
        problems: parseContestProblems(document.getElementById("contest-problems").value),
        createdAt: new Date().toISOString()
      };

      if (!contest.name || !contest.date) {
        window.showToast?.("Contest name and date are required", "error");
        return;
      }

      Store.contests.add(contest);
      e.currentTarget.reset();
      window.showToast?.("Contest added", "success");
      render();
    });
  }

  function bindActions() {
    // Search and sort event listeners
    ["contest-search-text", "contest-sort"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", renderContests);
      document.getElementById(id)?.addEventListener("change", renderContests);
    });

    document.getElementById("upsolve-queue")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-q-action]");
      if (!btn) return;
      const item = e.target.closest("[data-contest-id]");
      const contestId = item?.getAttribute("data-contest-id");
      const problemId = item?.getAttribute("data-problem-id");
      if (!contestId || !problemId) return;

      Store.contests.update(contestId, (c) => ({
        problems: (c.problems || []).map((p) =>
          p.id === problemId ? { ...p, status: "upsolved" } : p
        )
      }));

      const existing = Store.problems
        .getAll()
        .find((p) => p.title === problemId || p.link === `${contestId}:${problemId}`);
      if (!existing) {
        Store.problems.add({
          id: Utils.generateId(),
          title: problemId,
          platform: "contest-upsolve",
          link: `${contestId}:${problemId}`,
          tags: ["upsolve"],
          status: "upsolved",
          solveMethod: "editorial",
          personalRating: 3,
          keyInsight: "",
          wrongApproaches: "",
          code: "",
          week: null,
          bookRef: "",
          createdAt: new Date().toISOString(),
          solvedAt: new Date().toISOString()
        });
      }

      render();
      window.showToast?.("Marked as upsolved", "success");
    });

    document.getElementById("contests-list")?.addEventListener("click", (e) => {
      const card = e.target.closest(".contest-card");
      if (!card) return;
      const contestId = card.getAttribute("data-id");
      const action = e.target.getAttribute("data-action");

      if (action === "delete") {
        Store.contests.delete(contestId);
        render();
        return;
      }

      if (action === "save-problem") {
        const tr = e.target.closest("tr[data-problem-id]");
        const pid = tr?.getAttribute("data-problem-id");
        if (!pid) return;
        const status = tr.querySelector('[data-field="status"]').value;
        const editorialRead = tr.querySelector('[data-field="editorialRead"]').checked;

        Store.contests.update(contestId, (c) => ({
          problems: (c.problems || []).map((p) => (p.id === pid ? { ...p, status, editorialRead } : p))
        }));

        window.showToast?.("Contest problem updated", "success", 1200);
        renderUpsolveQueue();
      }
    });
  }

  function init() {
    initialized = true;
    bindAccordion();
    bindForm();
    bindActions();
    render();
  }

  return {
    init,
    onShow: render,
    isInitialized: () => initialized
  };
})();

window.ContestsPage = ContestsPage;
