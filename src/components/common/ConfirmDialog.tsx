import React from 'react';
import { useDialog } from './useDialog';
import { AppIcon } from './AppIcon';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, title, message, confirmLabel, cancelLabel, danger, onConfirm, onClose }) => {
  const ref = useDialog(open, onClose);
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(3px)',
      }}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="app-dialog"
        data-confirm-dialog="true"
        style={{
          backgroundColor: 'var(--bg-modal, var(--bg-card))',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          width: 'min(420px, calc(100vw - 48px))',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span
            style={{
              width: 34, height: 34, borderRadius: 'var(--radius-md)',
              backgroundColor: danger ? 'var(--color-danger-bg)' : 'var(--color-primary-light)',
              color: danger ? 'var(--color-danger)' : 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <AppIcon name="help" size={18} />
          </span>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{title}</h3>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 18px' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button data-dialog-cancel="true" onClick={onClose}>{cancelLabel}</button>
          <button
            data-dialog-confirm="true"
            onClick={onConfirm}
            style={{
              backgroundColor: danger ? 'var(--color-danger)' : 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
