const isArabic = () => typeof document === 'undefined' || document.documentElement.lang === 'ar';
const locale = () => isArabic() ? 'ar-SA' : 'en-US';
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}-${timestamp}-${randomStr}` : `${timestamp}-${randomStr}`;
}

export function formatCurrency(amountCents: number, currency: string = 'ر.س'): string {
  const value = amountCents / 100;
  const formatted = new Intl.NumberFormat(locale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ${currency === 'ر.س' && !isArabic() ? 'SAR' : currency}`;
}

export function formatCurrencyPlain(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

export function parseCurrencyToCents(amountStr: string | number): number {
  if (typeof amountStr === 'number') {
    return Math.round(amountStr * 100);
  }
  const clean = amountStr.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
}

export function formatDateArabic(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      return `${isArabic() ? 'اليوم' : 'Today'} ${date.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (isYesterday) {
      return `${isArabic() ? 'أمس' : 'Yesterday'} ${date.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })}`;
    }

    return new Intl.DateTimeFormat(locale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return isArabic() ? 'اليوم' : 'Today';
  if (diffDays === 1) return isArabic() ? 'غداً' : 'Tomorrow';
  if (diffDays === -1) return isArabic() ? 'أمس' : 'Yesterday';
  if (diffDays < -1) return isArabic() ? `متأخر ${Math.abs(diffDays)} يوم` : `${Math.abs(diffDays)} days overdue`;
  if (diffDays > 1) return isArabic() ? `باقٍ ${diffDays} يوم` : `In ${diffDays} days`;
  return dateStr;
}

export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const BLOCK = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TR', 'BLOCKQUOTE', 'PRE', 'BR', 'TABLE']);
  // Block boundaries must produce a space so adjacent blocks never glue together
  // (e.g. "Inert HTML testBlocked file link" in note previews).
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as Element;
    const joined = Array.from(el.childNodes).map(walk).join('');
    return BLOCK.has(el.tagName) ? ` ${joined} ` : joined;
  };
  return walk(doc.body).replace(/\s+/g, ' ').trim();
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}
