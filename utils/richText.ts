const ALLOWED_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DIV', 'EM', 'H1', 'H2', 'H3', 'H4',
  'H5', 'H6', 'I', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRONG', 'U', 'UL'
]);

const ALLOWED_STYLE_PROPS = new Set([
  'background-color',
  'color',
  'font-style',
  'font-weight',
  'text-align',
  'text-decoration',
]);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const plainTextToRichText = (value = '') => {
  const blocks = value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) return '';

  return blocks
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
};

export const normalizeRichText = (value = '') => {
  const hasHtmlTag = /<\/?[a-z][\s\S]*>/i.test(value);
  return hasHtmlTag ? value : plainTextToRichText(value);
};

const sanitizeStyle = (style: string) => {
  const output: string[] = [];

  style.split(';').forEach((rule) => {
    const [rawProp, ...rawValue] = rule.split(':');
    const prop = rawProp?.trim().toLowerCase();
    const value = rawValue.join(':').trim();

    if (!prop || !value || !ALLOWED_STYLE_PROPS.has(prop)) return;
    if (/url|expression|javascript|data:/i.test(value)) return;
    output.push(`${prop}: ${value}`);
  });

  return output.join('; ');
};

export const sanitizeRichText = (value = '') => {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return normalizeRichText(value);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(normalizeRichText(value), 'text/html');

  const cleanNode = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        return;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) return;

      const element = child as HTMLElement;
      if (!ALLOWED_TAGS.has(element.tagName)) {
        element.replaceWith(...Array.from(element.childNodes));
        return;
      }

      Array.from(element.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value;

        if (element.tagName === 'A' && name === 'href') {
          if (/^(https?:|mailto:|tel:|#)/i.test(value)) return;
        }

        if (element.tagName === 'A' && ['target', 'rel'].includes(name)) return;

        if (name === 'style') {
          const cleanStyle = sanitizeStyle(value);
          if (cleanStyle) {
            element.setAttribute('style', cleanStyle);
          } else {
            element.removeAttribute('style');
          }
          return;
        }

        element.removeAttribute(attr.name);
      });

      if (element.tagName === 'A') {
        element.setAttribute('target', '_blank');
        element.setAttribute('rel', 'noopener noreferrer');
      }

      cleanNode(element);
    });
  };

  cleanNode(doc.body);
  return doc.body.innerHTML;
};

export const richTextToPlainText = (value = '') => {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(normalizeRichText(value), 'text/html');
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
};
