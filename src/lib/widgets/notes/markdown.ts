import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(source: string): string {
  const normalized = preProcess(source);
  const raw = marked.parse(normalized, { async: false }) as string;
  const sanitized = DOMPurify.sanitize(raw, {
    ADD_ATTR: ["target", "rel"],
  });
  return postProcess(sanitized);
}

// GFM task lists require a list marker (`- [ ]`), but users often write bare
// `[ ]` at the start of a line (Obsidian-style). Convert those to `- [ ]`
// so marked renders them as interactive checkboxes.
function preProcess(source: string): string {
  return source.replace(/^([ \t]*)\[( |x|X)\]/gm, "$1- [$2]");
}

// Re-enable GFM task checkboxes (marked emits them `disabled`) and force all
// anchors to open in a new tab with the usual noopener/noreferrer hardening.
function postProcess(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(`<div id="notes-root">${html}</div>`, "text/html");
  const root = doc.getElementById("notes-root");
  if (!root) return html;

  for (const cb of root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) {
    cb.removeAttribute("disabled");
    cb.classList.add("notes-task-checkbox");
  }

  for (const a of root.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  }

  return root.innerHTML;
}

// Flip the Nth task-list marker in source markdown. Handles both standard
// GFM (`- [ ]`) and bare Obsidian-style (`[ ]`) task markers.
export function toggleTaskAt(source: string, index: number): string {
  const re = /^([ \t]*(?:(?:[-*+]|\d+\.)[ \t]+)?)\[( |x|X)\]/gm;
  let i = 0;
  return source.replace(re, (match, prefix: string, mark: string) => {
    if (i++ !== index) return match;
    const next = mark === " " ? "x" : " ";
    return `${prefix}[${next}]`;
  });
}
