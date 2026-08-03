// sanitize.js
// Restricts note content HTML down to the small set of tags this app's
// rich text toolbar can actually produce (bold/italic/underline and
// bullet/numbered lists) before it's handed off to be saved. This keeps
// what ends up in localStorage predictable — only supported formatting
// survives — and guards against stray markup (e.g. pasted content)
// ending up baked into a note.

const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "UL", "OL", "LI", "BR", "DIV"]);

/** Tags that are dropped entirely, along with their contents. */
const STRIP_ENTIRELY = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META"]);

/**
 * Returns a version of `html` containing only allowed formatting tags.
 * Any other element is either removed outright (scripts, embeds, etc.)
 * or "unwrapped" — replaced by its own children/text so the content
 * itself isn't lost, just the unsupported wrapper around it. All
 * attributes are stripped from surviving elements.
 *
 * @param {string} html
 * @returns {string}
 */
export function sanitizeRichText(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  stripUnsupportedNodes(template.content);
  return template.innerHTML;
}

function stripUnsupportedNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  const toRemove = [];
  const toUnwrap = [];

  let node;
  while ((node = walker.nextNode())) {
    if (STRIP_ENTIRELY.has(node.tagName)) {
      toRemove.push(node);
    } else if (!ALLOWED_TAGS.has(node.tagName)) {
      toUnwrap.push(node);
    } else {
      // Allowed tag — still strip attributes (no href/src/style/on* etc.)
      Array.from(node.attributes).forEach((attr) => node.removeAttribute(attr.name));
    }
  }

  toRemove.forEach((node) => node.remove());
  toUnwrap.forEach((node) => {
    const parent = node.parentNode;
    if (!parent) return;
    while (node.firstChild) parent.insertBefore(node.firstChild, node);
    parent.removeChild(node);
  });
}
