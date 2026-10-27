import React from 'react';
import { AppIcon } from '../common/AppIcon';
import { IconName } from '../common/iconsMap';
import { useLanguage } from '../../i18n/LanguageContext';

interface RichToolbarProps {
  onCommand: (command: string, value?: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onOpenSlashMenu?: () => void;
  onOpenTemplates?: () => void;
}

export const RichToolbar: React.FC<RichToolbarProps> = ({
  onCommand,
  isFullscreen,
  onToggleFullscreen,
  onOpenSlashMenu,
  onOpenTemplates,
}) => {
  const { language, t } = useLanguage();

  const formatButtons: {
    cmd?: string;
    val?: string;
    icon?: IconName;
    text?: string;
    title?: string;
    type?: string;
  }[] = [
    { cmd: 'bold', icon: 'bold', title: language === 'ar' ? 'عريض (Ctrl + B)' : 'Bold (Ctrl + B)' },
    { cmd: 'italic', icon: 'italic', title: language === 'ar' ? 'مائل (Ctrl + I)' : 'Italic (Ctrl + I)' },
    { cmd: 'underline', icon: 'underline', title: language === 'ar' ? 'تسطير (Ctrl + U)' : 'Underline (Ctrl + U)' },
    { cmd: 'strikeThrough', icon: 'strikethrough', title: language === 'ar' ? 'يتوسطه خط' : 'Strikethrough' },
    { type: 'separator' },
    { cmd: 'formatBlock', val: 'h1', text: 'H1', title: t('blockH1') },
    { cmd: 'formatBlock', val: 'h2', text: 'H2', title: t('blockH2') },
    { cmd: 'formatBlock', val: 'h3', text: 'H3', title: t('blockH3') },
    { type: 'separator' },
    { cmd: 'insertUnorderedList', icon: 'list', title: t('blockBullet') },
    { cmd: 'insertOrderedList', icon: 'listOrdered', title: t('blockNumber') },
    { cmd: 'formatBlock', val: 'blockquote', icon: 'quote', title: t('blockQuote') },
    { cmd: 'formatBlock', val: 'pre', icon: 'code', title: t('blockCode') },
    { type: 'separator' },
    { cmd: 'removeFormat', icon: 'restore', title: language === 'ar' ? 'مسح التنسيق' : 'Clear formatting' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        padding: '5px var(--space-4)',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-app)',
        flexWrap: 'wrap',
      }}
    >
      {/* Insert Block / Slash Command Button */}
      {onOpenSlashMenu && (
        <button
          type="button"
          onClick={onOpenSlashMenu}
          title={language === 'ar' ? 'إدراج مكعب أو عنصر جديد (/)' : 'Insert block or command (/)'}
          style={{
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
          }}
        >
          <AppIcon name="plus" size={13} />
          <span>{language === 'ar' ? 'إدراج مكعب' : 'Insert Block'}</span>
        </button>
      )}

      {/* Templates Button */}
      {onOpenTemplates && (
        <button
          type="button"
          onClick={onOpenTemplates}
          title={t('chooseTemplate')}
          style={{
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
          }}
        >
          <AppIcon name="note" size={13} color="var(--color-primary)" />
          <span>{t('templates')}</span>
        </button>
      )}

      <div
        style={{
          width: 1,
          height: 16,
          backgroundColor: 'var(--border-subtle)',
          margin: '0 4px',
        }}
      />

      {formatButtons.map((btn, idx) => {
        if (btn.type === 'separator') {
          return (
            <div
              key={idx}
              style={{
                width: 1,
                height: 16,
                backgroundColor: 'var(--border-subtle)',
                margin: '0 4px',
              }}
            />
          );
        }

        return (
          <button
            key={idx}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onCommand(btn.cmd!, btn.val);
            }}
            title={btn.title}
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
              fontWeight: btn.text ? 800 : 400,
              fontSize: btn.text ? '11px' : 'inherit',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {btn.icon ? <AppIcon name={btn.icon} size={15} /> : btn.text}
          </button>
        );
      })}

      {/* Insert Simple Table */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          const tableHtml = `
            <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
              <thead>
                <tr style="background:var(--bg-input);">
                  <th style="border:1px solid var(--border-subtle);padding:8px;">${language === 'ar' ? 'العمود 1' : 'Column 1'}</th>
                  <th style="border:1px solid var(--border-subtle);padding:8px;">${language === 'ar' ? 'العمود 2' : 'Column 2'}</th>
                  <th style="border:1px solid var(--border-subtle);padding:8px;">${language === 'ar' ? 'العمود 3' : 'Column 3'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border:1px solid var(--border-subtle);padding:8px;">...</td>
                  <td style="border:1px solid var(--border-subtle);padding:8px;">...</td>
                  <td style="border:1px solid var(--border-subtle);padding:8px;">...</td>
                </tr>
              </tbody>
            </table>
            <p><br></p>
          `;
          onCommand('insertHTML', tableHtml);
        }}
        title={t('blockTable')}
        style={{
          width: 28,
          height: 28,
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <AppIcon name="table" size={15} />
      </button>

      {/* Fullscreen Toggle */}
      {onToggleFullscreen && (
        <div style={{ marginInlineStart: 'auto' }}>
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? (language === 'ar' ? 'الخروج من ملء الشاشة' : 'Exit Fullscreen') : (language === 'ar' ? 'ملء شاشة المحرر' : 'Fullscreen Editor')}
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <AppIcon name={isFullscreen ? 'minimize' : 'maximize'} size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
