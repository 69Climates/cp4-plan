const Modal = (() => {
  const stack = [];

  function ensureBackdrop() {
    return document.getElementById("modal-backdrop");
  }

  function showBackdrop() {
    const backdrop = ensureBackdrop();
    if (backdrop) backdrop.classList.add("show");
  }

  function hideBackdropIfNeeded() {
    const hasOpen = !!document.querySelector(".modal.show");
    const backdrop = ensureBackdrop();
    if (backdrop && !hasOpen) backdrop.classList.remove("show");
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (!modal.classList.contains("show")) {
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
      stack.push(id);
      showBackdrop();
      
      // Initialize any date inputs in the modal with today's date
      setTimeout(() => {
        const dateInputs = modal.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
          if (!input.value && window.Utils) {
            input.value = window.Utils.getTodayDateString();
          }
        });
      }, 50);
    }
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (modal.dataset.locked === "true") return;
    
    // Reset any forms inside the modal
    const forms = modal.querySelectorAll('form');
    forms.forEach(form => form.reset());
    
    // Clear any error messages
    const errorMessages = modal.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.textContent = '');
    
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    const idx = stack.lastIndexOf(id);
    if (idx >= 0) stack.splice(idx, 1);
    hideBackdropIfNeeded();
  }

  function closeTopModal() {
    if (!stack.length) return false;
    const topId = stack[stack.length - 1];
    const top = document.getElementById(topId);
    if (top?.dataset.locked === "true") return false;
    if (top?.dataset.noBackdropClose === "true") return false; // Don't close if marked
    closeModal(topId);
    return true;
  }

  function closeAllModals() {
    [...document.querySelectorAll(".modal.show")].forEach((m) => {
      m.classList.remove("show");
      m.setAttribute("aria-hidden", "true");
    });
    stack.length = 0;
    hideBackdropIfNeeded();
  }

  function showConfirm(message, onConfirm, onCancel = () => {}) {
    const title = document.getElementById("generic-title");
    const body = document.getElementById("generic-body");
    const okBtn = document.getElementById("generic-ok");
    if (!title || !body || !okBtn) return;

    title.textContent = "Confirm";
    body.innerHTML = `<p>${Utils.escapeHtml(message)}</p>
      <div class="row-wrap" style="margin-top:10px">
        <button id="generic-cancel" class="btn" type="button">Cancel</button>
        <button id="generic-confirm" class="btn btn-primary" type="button">Confirm</button>
      </div>`;

    okBtn.style.display = "none";
    openModal("modal-generic");

    body.querySelector("#generic-cancel")?.addEventListener(
      "click",
      () => {
        closeModal("modal-generic");
        okBtn.style.display = "inline-flex";
        onCancel();
      },
      { once: true }
    );

    body.querySelector("#generic-confirm")?.addEventListener(
      "click",
      () => {
        closeModal("modal-generic");
        okBtn.style.display = "inline-flex";
        onConfirm();
      },
      { once: true }
    );
  }

  function init() {
    document.getElementById("modal-backdrop")?.addEventListener("click", closeTopModal);

    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target !== modal) return;
        if (modal.dataset.noBackdropClose === "true") return; // Don't close if marked
        closeModal(modal.id);
      });
    });

    document.getElementById("generic-ok")?.addEventListener("click", () => closeModal("modal-generic"));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // ESC key should always close, even for no-backdrop-close modals
        if (!stack.length) return;
        const topId = stack[stack.length - 1];
        const top = document.getElementById(topId);
        if (top?.dataset.locked === "true") return;
        closeModal(topId);
      }
    });
  }

  return {
    init,
    openModal,
    closeModal,
    closeAllModals,
    closeTopModal,
    showConfirm,
    getOpenStack: () => [...stack]
  };
})();

window.Modal = Modal;
