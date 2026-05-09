const Toast = (() => {
  const maxVisible = 3;
  let queue = [];

  function iconByType(type) {
    if (type === "success") return "OK";
    if (type === "error") return "ERR";
    if (type === "warning") return "WARN";
    return "INFO";
  }

  function showToast(msg, type = "info", duration = 2500) {
    const id = Utils.generateId();
    queue.push({ id, msg, type, duration });
    render();
  }

  function removeToast(id) {
    queue = queue.filter((t) => t.id !== id);
    render();
  }

  function render() {
    const root = document.getElementById("toast-container");
    if (!root) return;

    const visible = queue.slice(0, maxVisible);
    root.innerHTML = visible
      .map(
        (t) => `
      <div class="toast ${t.type}" data-id="${t.id}">
        <span><strong>${iconByType(t.type)}</strong> ${Utils.escapeHtml(t.msg)}</span>
        <button class="btn btn-xs" type="button" data-close="${t.id}">x</button>
      </div>`
      )
      .join("");

    visible.forEach((t) => {
      setTimeout(() => removeToast(t.id), t.duration);
    });

    root.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => removeToast(btn.getAttribute("data-close")));
    });
  }

  return { showToast };
})();

window.showToast = Toast.showToast;
