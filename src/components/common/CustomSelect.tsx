import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon } from './AppIcon';
import { IconName } from './iconsMap';
export interface SelectOption { value: string; label: string; dot?: string; disabled?: boolean; }
export interface CustomSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[]; leadingIcon?: IconName; error?: boolean; selectSize?: 'sm' | 'md' | 'lg'; wrapperStyle?: React.CSSProperties;
}
export const CustomSelect: React.FC<CustomSelectProps> = ({ options, children, leadingIcon, error, selectSize = 'md', wrapperStyle, style, className = '', disabled, value, defaultValue, id, ...rest }) => {
  const uid = useId(); const controlId = id || `select-${uid}`; const listId = `${controlId}-list`;
  const button = useRef<HTMLButtonElement>(null); const native = useRef<HTMLSelectElement>(null); const popup = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null); const typeahead = useRef({ text: '', at: 0 });
  const [open, setOpen] = useState(false); const [query, setQuery] = useState(''); const [active, setActive] = useState(0);
  const [internal, setInternal] = useState(String(defaultValue ?? ''));
  const [position, setPosition] = useState<React.CSSProperties>({});
  const items = useMemo(() => {
    if (options) return options;
    const result: SelectOption[] = [];
    const visit = (nodes: React.ReactNode) => React.Children.forEach(nodes, node => {
      if (!React.isValidElement<{ value?: string; children?: React.ReactNode; disabled?: boolean }>(node)) return;
      if (node.type === 'option') result.push({ value: String(node.props.value ?? node.props.children ?? ''), label: String(node.props.children ?? ''), disabled: node.props.disabled });
      else visit(node.props.children);
    });
    visit(children); return result;
  }, [options, children]);
  const selected = String(value ?? (internal || (defaultValue === undefined ? items[0]?.value : '')) ?? '');
  const selectedOption = items.find(item => item.value === selected);
  const filtered = items.filter(item => item.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const close = (focus = false) => { setOpen(false); setQuery(''); if (focus) button.current?.focus(); };
  const show = (last = false) => {
    if (disabled) return;
    setQuery(''); setActive(last ? items.length - 1 : Math.max(0, items.findIndex(item => item.value === selected))); setOpen(true);
  };
  const choose = (index: number) => {
    const item = filtered[index]; if (!item || item.disabled) return;
    setInternal(item.value);
    if (native.current) {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(native.current, item.value);
      native.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
    close(true);
  };
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = button.current!.getBoundingClientRect();
      const below = innerHeight - rect.bottom - 12; const above = rect.top - 12;
      const upwards = below < 220 && above > below; const height = Math.max(40, Math.min(300, upwards ? above : below));
      const width = Math.min(Math.max(rect.width, 180), innerWidth - 16);
      const rtl = getComputedStyle(button.current!).direction === 'rtl';
      const left = Math.max(8, Math.min(rtl ? rect.right - width : rect.left, innerWidth - width - 8));
      setPosition({ position: 'fixed', left, width, maxHeight: height, ...(upwards ? { bottom: innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }), direction: rtl ? 'rtl' : 'ltr' });
    };
    place();
    const dismiss = (event: Event) => { if (!popup.current?.contains(event.target as Node) && !button.current?.contains(event.target as Node)) close(); };
    const scroll = (event: Event) => { if (!popup.current?.contains(event.target as Node)) place(); };
    document.addEventListener('pointerdown', dismiss); document.addEventListener('focusin', dismiss); window.addEventListener('resize', place); window.addEventListener('scroll', scroll, true);
    if (items.length >= 8) search.current?.focus(); else popup.current?.querySelector<HTMLElement>('[role=listbox]')?.focus();
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('focusin', dismiss); window.removeEventListener('resize', place); window.removeEventListener('scroll', scroll, true); };
  }, [open, items.length]);
  useEffect(() => { if (disabled) close(); }, [disabled]);
  useEffect(() => { if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' }); }, [active, open, listId]);
  const keydown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (event.key === 'Tab') { close(true); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const step = event.key === 'ArrowUp' ? -1 : 1;
      let next = event.key === 'Home' ? 0 : event.key === 'End' ? filtered.length - 1 : (active + step + filtered.length) % filtered.length;
      for (let count = 0; count < filtered.length && filtered[next]?.disabled; count++) next = (next + step + filtered.length) % filtered.length;
      setActive(next);
    } else if (event.key === 'Enter' || event.key === ' ' && event.target !== search.current) { event.preventDefault(); choose(active); }
    else if (event.key.length === 1 && items.length < 8) {
      const now = Date.now(); typeahead.current.text = (now - typeahead.current.at < 700 ? typeahead.current.text : '') + event.key.toLocaleLowerCase(); typeahead.current.at = now;
      const index = filtered.findIndex(item => !item.disabled && item.label.toLocaleLowerCase().startsWith(typeahead.current.text)); if (index >= 0) setActive(index);
    }
  };
  return <div className={`app-select-container ${className}`} style={{ width: '100%', minWidth: 0, ...wrapperStyle }}>
    <select {...rest} hidden ref={native} value={selected} disabled={disabled} onChange={rest.onChange} tabIndex={-1} aria-hidden="true" onInvalid={event => { event.preventDefault(); button.current?.focus(); }}>
      {items.map(item => <option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>)}
    </select>
    <button ref={button} id={controlId} type="button" role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-activedescendant={open ? `${listId}-${active}` : undefined} aria-label={rest['aria-label'] || rest.title || selectedOption?.label} aria-labelledby={rest['aria-labelledby']} aria-invalid={error || undefined} aria-required={rest.required} disabled={disabled}
      className={`app-custom-select custom-select-trigger ${error ? 'is-error' : ''}`} style={{ height: selectSize === 'sm' ? 30 : selectSize === 'lg' ? 44 : 38, ...style }}
      onClick={() => open ? close() : show()} onKeyDown={event => { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); show(event.key === 'ArrowUp'); } }}>
      {leadingIcon && <AppIcon name={leadingIcon} size={16} />}
      {selectedOption?.dot && <span className="custom-select-dot" style={{ backgroundColor: selectedOption.dot }} aria-hidden="true" />}
      <span className="custom-select-value">{selectedOption?.label || '\u00a0'}</span><AppIcon name="arrowDown" size={14} />
    </button>
    {open && createPortal(<div ref={popup} className="custom-select-popup" style={position} onKeyDown={keydown}>
      {items.length >= 8 && <input ref={search} className="custom-select-search" aria-label={document.documentElement.lang === 'ar' ? 'بحث الخيارات' : 'Search options'} aria-controls={listId} aria-activedescendant={`${listId}-${active}`} placeholder={document.documentElement.lang === 'ar' ? 'بحث…' : 'Search…'} value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} />}
      <div role="listbox" id={listId} tabIndex={-1} aria-label={rest['aria-label'] || rest.title || 'Options'} aria-activedescendant={`${listId}-${active}`} className="custom-select-options">
        {filtered.map((item, index) => <div key={item.value} id={`${listId}-${index}`} role="option" aria-selected={item.value === selected} aria-disabled={item.disabled || undefined} className={`custom-select-option ${index === active ? 'is-active' : ''}`} onPointerMove={() => !item.disabled && setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            {item.dot && <span className="custom-select-dot" style={{ backgroundColor: item.dot }} aria-hidden="true" />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
          </span>
          {item.value === selected && <AppIcon name="tick" size={16} />}
        </div>)}
        {!filtered.length && <div className="custom-select-empty" role="status">{document.documentElement.lang === 'ar' ? 'لا توجد نتائج' : 'No results'}</div>}
      </div>
    </div>, document.body)}
  </div>;
};
export default CustomSelect;
