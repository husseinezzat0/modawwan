// Rebuild rich text in an inert document using an explicit allowlist.
export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const allowed = new Set('P DIV SPAN BR H1 H2 H3 H4 H5 H6 STRONG B EM I U S STRIKE UL OL LI BLOCKQUOTE PRE CODE TABLE THEAD TBODY TFOOT TR TH TD A HR INPUT FONT'.split(' '));
  const blocked = new Set('SCRIPT STYLE IFRAME OBJECT EMBED SVG MATH TEMPLATE FORM IMG VIDEO AUDIO LINK META BASE'.split(' '));
  const clean = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (blocked.has(child.tagName)) { child.remove(); continue; }
      clean(child);
      if (!allowed.has(child.tagName)) { child.replaceWith(...child.childNodes); continue; }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value;
        const safe = name === 'dir' && ['rtl', 'ltr', 'auto'].includes(value)
          || name === 'href' && child.tagName === 'A' && /^(https?:\/\/|mailto:|#)/i.test(value)
          || name === 'data-note-id' && value.length < 256
          || name === 'class' && value === 'internal-note-link'
          || ['colspan', 'rowspan'].includes(name) && /^\d{1,2}$/.test(value)
          || child.tagName === 'INPUT' && (name === 'type' && value === 'checkbox' || ['checked', 'disabled'].includes(name));
        if (name === 'style') {
          const styles = child as HTMLElement;
          for (const property of Array.from(styles.style)) {
            if (!/^(color|background(-color)?|font-size|font-weight|font-style|font-family|text-align|text-decoration|direction|border(-[a-z-]+)?|padding(-[a-z-]+)?|margin(-[a-z-]+)?|width|max-width|line-height|display|gap|align-items|cursor)$/.test(property)
              || /url|expression|image|@|\\/i.test(styles.style.getPropertyValue(property))) styles.style.removeProperty(property);
          }
        } else if (!safe) child.removeAttribute(attr.name);
      }
      if (child.tagName === 'INPUT') { child.setAttribute('type', 'checkbox'); child.setAttribute('disabled', ''); }
    }
  };
  clean(doc.body);
  return doc.body.innerHTML;
}
