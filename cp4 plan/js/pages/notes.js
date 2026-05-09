const NotesPage = (() => {
  let initialized = false;

  function switchTab(tab) {
    document.querySelectorAll(".notes-tab-btn").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-notes-tab") === tab);
    });

    document.querySelectorAll(".notes-panel").forEach((p) => {
      p.classList.toggle("show", p.id === `notes-tab-${tab}`);
    });
  }

  function renderQuickNotes() {
    const root = document.getElementById("quick-notes-list");
    const notes = Store.notes.getAll();
    if (!root) return;

    if (!notes.length) {
      root.innerHTML = '<div class="empty-state">No quick notes yet.</div>';
      return;
    }

    root.innerHTML = notes
      .map(
        (n) => `
      <article class="card card-muted" data-note-id="${n.id}">
        <div class="row-wrap space-between">
          <strong>${Utils.escapeHtml(n.title || "Untitled")}</strong>
          <div class="row-wrap">
            <button class="btn btn-xs" data-note-action="edit" type="button">Edit</button>
            <button class="btn btn-xs btn-danger" data-note-action="delete" type="button">Delete</button>
          </div>
        </div>
        <textarea class="input" rows="3" data-note-field="content">${Utils.escapeHtml(n.content || "")}</textarea>
      </article>
    `
      )
      .join("");
  }

  function renderMistakes() {
    const root = document.getElementById("mistake-list");
    const mistakes = Store.mistakes.getAll();
    if (!root) return;

    if (!mistakes.length) {
      root.innerHTML = '<div class="empty-state">No mistakes logged yet.</div>';
      return;
    }

    root.innerHTML = mistakes
      .map(
        (m) => `
      <article class="card card-muted" data-mid="${m.id}">
        <div class="row-wrap space-between">
          <strong>${Utils.escapeHtml(m.title)}</strong>
          <div class="row-wrap">
            <span class="badge warning">x${m.frequency || 1}</span>
            <button class="btn btn-xs" data-m-action="plus" type="button">+1 Again</button>
            <button class="btn btn-xs btn-danger" data-m-action="delete" type="button">Delete</button>
          </div>
        </div>
        <small class="muted">Last: ${Utils.escapeHtml(m.lastOccurred || "-")}</small>
        <textarea class="input" rows="2" data-m-field="note">${Utils.escapeHtml(m.note || "")}</textarea>
      </article>
    `
      )
      .join("");

    root.insertAdjacentHTML(
      "afterbegin",
      `<div class="card"><strong>Pre-Contest Review:</strong><div class="chips">${mistakes
        .sort((a, b) => (b.frequency || 1) - (a.frequency || 1))
        .slice(0, 6)
        .map((m) => `<span class=\"chip\">${Utils.escapeHtml(m.title)} (x${m.frequency || 1})</span>`)
        .join("")}</div></div>`
    );
  }

  function renderTemplates(options = {}) {
    const root = document.getElementById("template-list");
    const templates = Store.templates.getAll();
    if (!root) return;

    const keys = Object.keys(templates).sort((a, b) => templates[a].name.localeCompare(templates[b].name));

    root.innerHTML = keys
      .map((k) => {
        const t = templates[k];
        const highlighted = options.templateKey === k ? "style=\"outline:1px solid var(--primary)\"" : "";
        const isOpen = options.templateKey === k;
        return `
          <article class="template-slot ${isOpen ? "open" : ""}" data-template-key="${k}" ${highlighted}>
            <button class="template-header" type="button">
              <div class="row-wrap space-between">
                <strong>${Utils.escapeHtml(t.name)}</strong>
                <span class="badge ${t.battleTested ? "success" : "warning"}">${t.battleTested ? "battle-tested" : "untested"}</span>
              </div>
            </button>
            <div class="template-body">
              <div class="grid-2">
                <label><span>Language</span>
                  <select class="input" data-t-field="language">
                    <option value="cpp" ${t.language === "cpp" ? "selected" : ""}>C++</option>
                    <option value="python" ${t.language === "python" ? "selected" : ""}>Python</option>
                    <option value="java" ${t.language === "java" ? "selected" : ""}>Java</option>
                    <option value="js" ${t.language === "js" ? "selected" : ""}>JavaScript</option>
                  </select>
                </label>
                <label><span>Tested On</span><input class="input" data-t-field="testedOn" value="${Utils.escapeHtml(t.testedOn || "")}"></label>
              </div>
              <label><input type="checkbox" data-t-field="battleTested" ${t.battleTested ? "checked" : ""}> Battle-tested</label>
              <label><span>Notes</span><textarea class="input" rows="2" data-t-field="notes">${Utils.escapeHtml(t.notes || "")}</textarea></label>
              <label><span>Code</span><textarea class="input" rows="6" data-t-field="code">${Utils.escapeHtml(t.code || "")}</textarea></label>
              <div class="row-wrap"><button class="btn btn-xs btn-primary" data-t-action="save" type="button">Save Slot</button></div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderCaptures() {
    const root = document.getElementById("capture-list");
    const captures = Store.quickCaptures.getAll();
    if (!root) return;

    const pending = captures.filter((c) => !c.isReviewed).length;
    document.getElementById("capture-count-badge").textContent = String(pending);

    if (!captures.length) {
      root.innerHTML = '<div class="empty-state">No quick captures yet. Press Space anywhere to add one.</div>';
      return;
    }

    root.innerHTML = captures
      .map(
        (c) => `
      <article class="card card-muted" data-capture-id="${c.id}">
        <div class="row-wrap space-between">
          <small>${Utils.formatDate(c.timestamp)}</small>
          <div class="row-wrap">
            <span class="badge ${c.isReviewed ? "success" : "warning"}">${c.isReviewed ? "reviewed" : "inbox"}</span>
            <button class="btn btn-xs" data-c-action="review" type="button">Mark Reviewed</button>
            <button class="btn btn-xs btn-danger" data-c-action="delete" type="button">Delete</button>
          </div>
        </div>
        <p>${Utils.escapeHtml(c.text)}</p>
      </article>
    `
      )
      .join("");
  }

  function render(options = {}) {
    renderQuickNotes();
    renderMistakes();
    renderTemplates(options);
    renderCaptures();
  }

  function bindSubtabs() {
    document.querySelectorAll(".notes-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.getAttribute("data-notes-tab")));
    });
  }

  function bindForms() {
    document.getElementById("quick-note-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("quick-note-title").value.trim();
      if (!title) return;
      Store.notes.add({
        id: Utils.generateId(),
        title,
        content: "",
        createdAt: new Date().toISOString()
      });
      e.currentTarget.reset();
      renderQuickNotes();
      window.showToast?.("Quick note added", "success");
    });

    document.getElementById("mistake-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("mistake-title").value.trim();
      if (!title) return;
      Store.mistakes.add({
        id: Utils.generateId(),
        title,
        note: "",
        frequency: 1,
        lastOccurred: Utils.getTodayKey(),
        createdAt: new Date().toISOString()
      });
      e.currentTarget.reset();
      renderMistakes();
      window.showToast?.("Mistake logged", "success");
    });
  }

  function bindListActions() {
    document.getElementById("quick-notes-list")?.addEventListener("click", (e) => {
      const note = e.target.closest("[data-note-id]");
      if (!note) return;
      const id = note.getAttribute("data-note-id");
      const action = e.target.getAttribute("data-note-action");
      if (!action) return;

      if (action === "delete") {
        Store.notes.delete(id);
        renderQuickNotes();
      }

      if (action === "edit") {
        const content = note.querySelector("[data-note-field='content']")?.value || "";
        Store.notes.update(id, { content });
        window.showToast?.("Note updated", "success", 1200);
      }
    });

    document.getElementById("mistake-list")?.addEventListener("click", (e) => {
      const row = e.target.closest("[data-mid]");
      if (!row) return;
      const id = row.getAttribute("data-mid");
      const action = e.target.getAttribute("data-m-action");
      if (!action) return;

      if (action === "plus") {
        Store.mistakes.increment(id);
        renderMistakes();
      }

      if (action === "delete") {
        Store.mistakes.delete(id);
        renderMistakes();
      }
    });

    document.getElementById("mistake-list")?.addEventListener("input", (e) => {
      const row = e.target.closest("[data-mid]");
      if (!row || !e.target.hasAttribute("data-m-field")) return;
      const id = row.getAttribute("data-mid");
      Store.mistakes.update(id, { note: e.target.value });
    });

    const templateList = document.getElementById("template-list");
    
    // Handle expand/collapse
    templateList?.addEventListener("click", (e) => {
      const header = e.target.closest(".template-header");
      if (header) {
        const slot = header.parentElement;
        // Toggle the clicked slot without affecting others
        slot.classList.toggle("open");
        return;
      }

      // Handle save action
      const slot = e.target.closest("[data-template-key]");
      if (!slot) return;
      if (e.target.getAttribute("data-t-action") !== "save") return;
      const key = slot.getAttribute("data-template-key");

      const patch = {};
      slot.querySelectorAll("[data-t-field]").forEach((el) => {
        const field = el.getAttribute("data-t-field");
        patch[field] = el.type === "checkbox" ? el.checked : el.value;
      });
      Store.templates.update(key, patch);
      window.showToast?.("Template saved", "success", 1200);
      renderTemplates({ templateKey: key });
    });

    document.getElementById("capture-list")?.addEventListener("click", (e) => {
      const row = e.target.closest("[data-capture-id]");
      if (!row) return;
      const id = row.getAttribute("data-capture-id");
      const action = e.target.getAttribute("data-c-action");
      if (action === "review") {
        Store.quickCaptures.markReviewed(id);
        renderCaptures();
      }
      if (action === "delete") {
        Store.quickCaptures.delete(id);
        renderCaptures();
      }
    });
  }

  function init(options = {}) {
    initialized = true;
    bindSubtabs();
    bindForms();
    bindListActions();
    document.getElementById("open-doom-notes")?.addEventListener("click", () => DoomNotes.open());
    render(options);
    if (options.notesTab) switchTab(options.notesTab);
  }

  function onShow(options = {}) {
    render(options);
    if (options.notesTab) switchTab(options.notesTab);
  }

  return {
    init,
    onShow,
    isInitialized: () => initialized
  };
})();

window.NotesPage = NotesPage;
