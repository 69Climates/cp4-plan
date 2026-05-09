const DoomNotes = (() => {
  let isPreview = false;
  let mono = true;
  let saveDebounced = null;
  let searchCursor = -1;
  let activeTerm = "";
  let initialized = false;

  function getEditor() {
    return document.getElementById("doom-editor");
  }

  function getPreview() {
    return document.getElementById("doom-preview");
  }

  function parseInline(text) {
    return text
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  }

  function normalizeMarkdown(md) {
    return String(md || "")
      .replace(/\r\n?/g, "\n")
      // Allow ATX headings typed without a space: "##Heading" -> "## Heading"
      .replace(/^(#{1,6})([^#\s])/gm, "$1 $2");
  }

  function renderMarkdownFallback(mdEscaped) {
    const codeBlocks = [];

    let withBlocks = mdEscaped.replace(/```([^\n`]*)\n?([\s\S]*?)```/g, (_, lang, block) => {
      const key = `__CODE_BLOCK_${codeBlocks.length}__`;
      const cleanLang = (lang || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
      codeBlocks.push(`<pre><code${cleanLang ? ` class="language-${cleanLang}"` : ""}>${block}</code></pre>`);
      return key;
    });

    const lines = withBlocks.split("\n");
    const out = [];
    let listType = "";

    function closeList() {
      if (listType) {
        out.push(`</${listType}>`);
        listType = "";
      }
    }

    lines.forEach((line) => {
      const heading = /^(#{1,6})\s+(.+)$/.exec(line);
      if (heading) {
        closeList();
        const level = heading[1].length;
        out.push(`<h${level}>${parseInline(heading[2])}</h${level}>`);
        return;
      }

      if (/^\s*[-*]\s+/.test(line)) {
        if (listType !== "ul") {
          closeList();
          out.push("<ul>");
          listType = "ul";
        }

        const content = line.replace(/^\s*[-*]\s+/, "");
        const cb = /^\[(x|\s)\]\s+/i.exec(content);
        if (cb) {
          const checked = cb[1].toLowerCase() === "x";
          out.push(`<li><input type=\"checkbox\" ${checked ? "checked" : ""} disabled> ${parseInline(content.replace(/^\[(x|\s)\]\s+/i, ""))}</li>`);
        } else {
          out.push(`<li>${parseInline(content)}</li>`);
        }
        return;
      }

      if (/^\s*\d+[.)]\s+/.test(line)) {
        if (listType !== "ol") {
          closeList();
          out.push("<ol>");
          listType = "ol";
        }
        out.push(`<li>${parseInline(line.replace(/^\s*\d+[.)]\s+/, ""))}</li>`);
        return;
      }

      closeList();

      if (!line.trim()) {
        out.push("<br>");
      } else {
        out.push(`<p>${parseInline(line)}</p>`);
      }
    });

    closeList();

    let html = out.join("\n");
    codeBlocks.forEach((b, i) => {
      html = html.replace(`__CODE_BLOCK_${i}__`, b);
    });

    return html;
  }

  function renderMarkdown(md) {
    const source = normalizeMarkdown(md);
    if (window.marked?.parse) {
      const parsed = window.marked.parse(source, {
        gfm: true,
        breaks: true
      });
      if (window.DOMPurify?.sanitize) {
        return window.DOMPurify.sanitize(parsed);
      }
      return parsed;
    }
    return renderMarkdownFallback(Utils.escapeHtml(source));
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function buildStyledHtmlExport(renderedHtml, todayKey) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CP4 DOOM Notes Export</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f4ef;
      --sheet: #fffdf7;
      --text: #141414;
      --muted: #666666;
      --border: #d9d4c9;
      --accent: #262626;
      --code-bg: #f2efe6;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: "Source Serif 4", "Source Serif Pro", Georgia, serif;
      line-height: 1.65;
      padding: 28px 16px;
    }

    .sheet {
      max-width: 900px;
      margin: 0 auto;
      background: var(--sheet);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px 22px 30px;
    }

    .sheet-head {
      border-bottom: 1px solid var(--border);
      margin-bottom: 18px;
      padding-bottom: 12px;
    }

    .sheet-head h1 {
      margin: 0;
      font-size: 1.25rem;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .sheet-head p {
      margin: 0.25rem 0 0;
      color: var(--muted);
      font-size: 0.95rem;
    }

    .content h1,
    .content h2,
    .content h3,
    .content h4,
    .content h5,
    .content h6 {
      margin: 1rem 0 0.5rem;
      line-height: 1.3;
      font-weight: 650;
      color: var(--accent);
    }

    .content h1 { font-size: 1.8rem; }
    .content h2 { font-size: 1.45rem; }
    .content h3 { font-size: 1.2rem; }
    .content h4 { font-size: 1.05rem; }
    .content h5,
    .content h6 { font-size: 0.96rem; }

    .content p {
      margin: 0.6rem 0;
    }

    .content ul,
    .content ol {
      margin: 0.6rem 0;
      padding-left: 1.2rem;
    }

    .content blockquote {
      margin: 0.8rem 0;
      padding: 0.4rem 0.8rem;
      border-left: 3px solid var(--border);
      color: var(--muted);
      background: #faf7ef;
    }

    .content pre,
    .content code {
      border: 1px solid var(--border);
      background: var(--code-bg);
      border-radius: 4px;
    }

    .content code {
      padding: 0.08rem 0.3rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }

    .content pre {
      padding: 10px;
      overflow: auto;
      white-space: pre;
    }

    .content pre code {
      border: 0;
      padding: 0;
      background: transparent;
      display: block;
      white-space: pre;
    }

    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.8rem 0;
    }

    .content th,
    .content td {
      border: 1px solid var(--border);
      padding: 6px 8px;
      text-align: left;
    }

    .content th {
      background: #f3f0e8;
    }
  </style>
</head>
<body>
  <main class="sheet">
    <header class="sheet-head">
      <h1>CP4 DOOM Notes</h1>
      <p>Exported on ${todayKey}</p>
    </header>
    <article class="content">
      ${renderedHtml || "<p></p>"}
    </article>
  </main>
</body>
</html>`;
  }

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function clearPreviewHighlights(preview) {
    preview.querySelectorAll("mark.doom-hit").forEach((mark) => {
      mark.replaceWith(document.createTextNode(mark.textContent || ""));
    });
    preview.normalize();
  }

  function highlightPreviewTerm(preview, term) {
    clearPreviewHighlights(preview);

    const query = term.trim();
    if (!query) return 0;

    const re = new RegExp(escapeRegExp(query), "gi");
    const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT);
    const targets = [];

    let node = walker.nextNode();
    while (node) {
      if (node.nodeValue?.trim()) {
        targets.push(node);
      }
      node = walker.nextNode();
    }

    let hitCount = 0;
    targets.forEach((textNode) => {
      const text = textNode.nodeValue || "";
      re.lastIndex = 0;
      let match = re.exec(text);
      if (!match) return;

      const frag = document.createDocumentFragment();
      let cursor = 0;

      while (match) {
        const idx = match.index;
        const val = match[0];
        if (idx > cursor) {
          frag.appendChild(document.createTextNode(text.slice(cursor, idx)));
        }

        const mark = document.createElement("mark");
        mark.className = "doom-hit";
        mark.textContent = val;
        frag.appendChild(mark);
        hitCount += 1;

        cursor = idx + val.length;
        match = re.exec(text);
      }

      if (cursor < text.length) {
        frag.appendChild(document.createTextNode(text.slice(cursor)));
      }

      textNode.replaceWith(frag);
    });

    return hitCount;
  }

  function focusPreviewMatch(direction = 1) {
    const preview = getPreview();
    if (!preview) return;

    const hits = Array.from(preview.querySelectorAll("mark.doom-hit"));
    if (!hits.length) {
      searchCursor = -1;
      return;
    }

    if (direction >= 0) {
      searchCursor = (searchCursor + 1) % hits.length;
    } else {
      searchCursor = (searchCursor - 1 + hits.length) % hits.length;
    }

    hits.forEach((el, idx) => el.classList.toggle("active", idx === searchCursor));
    hits[searchCursor].scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function saveNow() {
    const editor = getEditor();
    if (!editor) return;
    Store.doomNotes.set(editor.value);
    window.showToast?.("DOOM NOTES saved", "success", 1200);
  }

  function updateCount() {
    const editor = getEditor();
    const text = editor?.value || "";
    const words = (text.trim().match(/\S+/g) || []).length;
    document.getElementById("doom-word-count").textContent = `${words} words`;
    document.getElementById("doom-char-count").textContent = `${text.length} chars`;
  }

  function renderPreview() {
    const editor = getEditor();
    const preview = getPreview();
    if (!editor || !preview) return;
    preview.innerHTML = renderMarkdown(editor.value);
    highlightPreviewTerm(preview, activeTerm);
  }

  function togglePreview() {
    isPreview = !isPreview;
    const editor = getEditor();
    const preview = getPreview();
    if (!editor || !preview) return;
    if (isPreview) {
      renderPreview();
      searchCursor = -1;
      if (activeTerm.trim()) {
        focusPreviewMatch(1);
      }
      editor.style.display = "none";
      preview.style.display = "block";
    } else {
      editor.style.display = "block";
      preview.style.display = "none";
    }
  }

  function findInEditor(term, direction = 1) {
    const editor = getEditor();
    if (!editor || !term.trim()) return;

    const text = editor.value.toLowerCase();
    const t = term.toLowerCase();

    if (direction > 0) {
      const startFrom = Math.max(0, editor.selectionEnd);
      const idx = text.indexOf(t, startFrom);
      if (idx >= 0) {
        editor.focus();
        editor.setSelectionRange(idx, idx + t.length);
        searchCursor = idx;
        return;
      }
      const wrap = text.indexOf(t, 0);
      if (wrap >= 0) {
        editor.focus();
        editor.setSelectionRange(wrap, wrap + t.length);
        searchCursor = wrap;
      }
    } else {
      const startFrom = editor.selectionStart - 1;
      const idx = startFrom >= 0 ? text.lastIndexOf(t, startFrom) : -1;
      if (idx >= 0) {
        editor.focus();
        editor.setSelectionRange(idx, idx + t.length);
        searchCursor = idx;
        return;
      }
      const wrap = text.lastIndexOf(t);
      if (wrap >= 0) {
        editor.focus();
        editor.setSelectionRange(wrap, wrap + t.length);
        searchCursor = wrap;
      }
    }
  }

  function doSearch(direction = 1) {
    const input = document.getElementById("doom-search-input");
    if (!input) return;
    activeTerm = input.value.trim();

    if (isPreview) {
      renderPreview();
      if (activeTerm) {
        focusPreviewMatch(direction);
      }
    } else {
      findInEditor(activeTerm, direction);
    }
  }

  function openAndFind(term = "") {
    ensureInit();
    Modal.openModal("modal-doom-notes");
    const input = document.getElementById("doom-search-input");
    if (input && term) {
      input.value = term;
      activeTerm = term;
      doSearch(1);
    }
  }

  function ensureInit() {
    if (!initialized) init();
  }

  function init() {
    if (initialized) return;

    const editor = getEditor();
    const preview = getPreview();
    if (!editor || !preview) return;
    initialized = true;

    if (window.marked?.setOptions) {
      window.marked.setOptions({
        gfm: true,
        breaks: true
      });
    }

    editor.value = Store.doomNotes.get() || "";
    updateCount();
    renderPreview();

    saveDebounced = Utils.debounce(() => {
      Store.doomNotes.set(editor.value);
    }, 10000);

    editor.addEventListener("input", () => {
      updateCount();
      saveDebounced();
      if (isPreview) renderPreview();
    });

    document.getElementById("doom-preview-toggle")?.addEventListener("click", togglePreview);

    document.getElementById("doom-copy")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(editor.value);
        window.showToast?.("Copied DOOM NOTES", "success");
      } catch {
        window.showToast?.("Clipboard failed", "error");
      }
    });

    document.getElementById("doom-download")?.addEventListener("click", () => {
      const todayKey = Utils.getTodayKey();
      const baseName = `cp4-doom-notes-${todayKey}`;

      const textBlob = new Blob([editor.value], { type: "text/plain;charset=utf-8" });
      downloadBlob(textBlob, `${baseName}.txt`);

      const renderedHtml = renderMarkdown(editor.value);
      const styledHtml = buildStyledHtmlExport(renderedHtml, todayKey);
      const htmlBlob = new Blob([styledHtml], { type: "text/html;charset=utf-8" });
      downloadBlob(htmlBlob, `${baseName}.html`);

      window.showToast?.("Downloaded .txt and .html", "success");
    });

    document.getElementById("doom-search-next")?.addEventListener("click", () => doSearch(1));
    document.getElementById("doom-search-prev")?.addEventListener("click", () => doSearch(-1));

    document.getElementById("doom-search-input")?.addEventListener("input", () => {
      activeTerm = document.getElementById("doom-search-input").value.trim();
      searchCursor = -1;
      if (isPreview) renderPreview();
    });

    document.getElementById("doom-mono-toggle")?.addEventListener("click", () => {
      mono = !mono;
      editor.classList.toggle("mono-off", !mono);
    });

    document.getElementById("doom-full-toggle")?.addEventListener("click", async () => {
      const card = document.querySelector("#modal-doom-notes .modal-card");
      if (!card) return;
      if (!document.fullscreenElement) {
        await card.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        Store.doomNotes.set(editor.value);
      }
    });

    window.addEventListener("beforeunload", () => Store.doomNotes.set(editor.value));
  }

  return {
    init,
    open: () => {
      ensureInit();
      Modal.openModal("modal-doom-notes");
    },
    openAndFind,
    saveNow: () => {
      ensureInit();
      saveNow();
    }
  };
})();

window.DoomNotes = DoomNotes;
