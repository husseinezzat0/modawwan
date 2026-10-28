import { useEffect, useRef } from 'react';

export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []).filter(element => element.getClientRects().length);
    const autoFocusTarget = ref.current?.querySelector<HTMLElement>('[autofocus]:not(:disabled), input:not([type=hidden]):not(:disabled), textarea:not(:disabled)');
    const initialTarget = (document.activeElement && ref.current?.contains(document.activeElement) && document.activeElement !== ref.current)
      ? (document.activeElement as HTMLElement)
      : (autoFocusTarget || focusable()[0] || ref.current);
    initialTarget?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector('.custom-select-popup')) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current(); }
      if (event.key === 'Tab') {
        const elements = focusable(); const first = elements[0]; const last = elements[elements.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || !ref.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !ref.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus(); };
  }, [open]);
  return ref;
}
