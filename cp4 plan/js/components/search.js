const Search = (() => {
  let activeIndex = -1;
  let flatItems = [];

  function appIsLocked() {
    if (!window.App?.isUnlocked) return false;
    return !window.App.isUnlocked();
  }

  function gatherData(query) {
    const q = query.toLowerCase();
    const sections = Store.sections.get();
    const templates = Store.templates.getAll();
    const doomNotes = Store.doomNotes.get();

    const groups = {
      Notes: Store.notes.getAll()
        .filter((n) => `${n.title || ""} ${n.content || ""}`.toLowerCase().includes(q))
        .slice(0, 8)
        .map((n) => ({
          id: n.id,
          label: `${n.title || "Untitled"}`,
          tab: "notes",
          action: () => window.App?.navigate("notes")
        })),

      Mistakes: Store.mistakes.getAll()
        .filter((m) => `${m.title || ""} ${m.note || ""}`.toLowerCase().includes(q))
        .slice(0, 8)
        .map((m) => ({
          id: m.id,
          label: `${m.title} (x${m.frequency || 1})`,
          tab: "notes",
          action: () => window.App?.navigate("notes", { notesTab: "mistakes" })
        })),

      Sections: Object.entries(sections)
        .filter(([k]) => k.toLowerCase().includes(q))
        .slice(0, 10)
        .map(([k, v]) => ({
          id: k,
          label: `${k} ${v.read ? "(read)" : "(unread)"}`,
          tab: "weekplan",
          action: () => window.App?.navigate("weekplan", { focusSection: k })
        })),

      Templates: Object.entries(templates)
        .filter(([, v]) => `${v.name || ""} ${v.notes || ""}`.toLowerCase().includes(q))
        .slice(0, 10)
        .map(([k, v]) => ({
          id: k,
          label: `${v.name} ${v.battleTested ? "(tested)" : ""}`,
          tab: "notes",
          action: () => window.App?.navigate("notes", { notesTab: "templates", templateKey: k })
        })),

      "DOOM Notes": doomNotes.toLowerCase().includes(q)
        ? [{
            id: "doom",
            label: `DOOM NOTES match: \"${query}\"`,
            tab: "notes",
            action: () => {
              window.App?.navigate("notes");
              setTimeout(() => window.DoomNotes?.openAndFind(query), 80);
            }
          }]
        : []
    };

    return Object.entries(groups)
      .filter(([, items]) => items.length)
      .map(([name, items]) => ({ name, items }));
  }

  function closeResults() {
    const box = document.getElementById("search-results");
    if (!box) return;
    box.classList.remove("show");
    box.innerHTML = "";
    activeIndex = -1;
    flatItems = [];
  }

  function renderResults(groups) {
    const box = document.getElementById("search-results");
    if (!box) return;

    if (!groups.length) {
      closeResults();
      return;
    }

    flatItems = [];

    box.innerHTML = groups
      .map((g) => {
        const items = g.items
          .map((i) => {
            flatItems.push(i);
            return `<button class="search-item" type="button" data-id="${i.id}">${Utils.escapeHtml(i.label)}</button>`;
          })
          .join("");
        return `<section class="search-group"><div class="search-group-title">${Utils.escapeHtml(g.name)}</div>${items}</section>`;
      })
      .join("");

    box.classList.add("show");

    box.querySelectorAll(".search-item").forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        flatItems[idx]?.action?.();
        closeResults();
      });
    });
  }

  function updateActiveItem() {
    const items = [...document.querySelectorAll(".search-item")];
    items.forEach((n) => n.classList.remove("active"));
    if (activeIndex >= 0 && items[activeIndex]) {
      items[activeIndex].classList.add("active");
      items[activeIndex].scrollIntoView({ block: "nearest" });
    }
  }

  function init() {
    const input = document.getElementById("global-search");
    const box = document.getElementById("search-results");
    if (!input || !box) return;

    const debounced = Utils.debounce(() => {
      if (appIsLocked()) {
        closeResults();
        return;
      }

      const q = input.value.trim();
      if (!q) {
        closeResults();
        return;
      }
      renderResults(gatherData(q));
    }, 200);

    input.addEventListener("input", debounced);

    input.addEventListener("keydown", (e) => {
      if (appIsLocked()) {
        closeResults();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(flatItems.length - 1, activeIndex + 1);
        updateActiveItem();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(0, activeIndex - 1);
        updateActiveItem();
      }
      if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        flatItems[activeIndex]?.action?.();
        closeResults();
      }
      if (e.key === "Escape") {
        closeResults();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (appIsLocked()) {
        closeResults();
        return;
      }

      if (e.key === "/" && !Utils.isTypingTarget(document.activeElement)) {
        e.preventDefault();
        input.focus();
      }
      if (e.key === "Escape") {
        closeResults();
      }
    });

    document.addEventListener("click", (e) => {
      if (!box.contains(e.target) && e.target !== input) {
        closeResults();
      }
    });
  }

  return { init, closeResults };
})();

window.Search = Search;
