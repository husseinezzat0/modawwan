import { escapeHtml } from '../../utils/formatters';
import React from 'react';
import { AppIcon } from '../common/AppIcon';
import { useLanguage } from '../../i18n/LanguageContext';
import { NOTION_TEMPLATES } from './NotionBlocks';
import { useDatabase } from '../../context/DatabaseContext';

export interface SlashMenuProps {
  position: { top: number; left: number } | null;
  onClose: () => void;
  onInsertHtml: (html: string) => void;
  onNavigateToNote?: (noteId: string) => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({ position, onClose, onInsertHtml, onNavigateToNote }) => {
  const { language, t } = useLanguage();
  const { notes, activeNote } = useDatabase();
  const [selectedTab, setSelectedTab] = React.useState<'blocks' | 'templates' | 'links'>('blocks');

  if (!position) return null;

  const blocks = [
    {
      id: 'h1',
      title: t('blockH1'),
      desc: language === 'ar' ? 'عنوان عريض رئيسي للصفحة' : 'Large section heading',
      icon: 'bold',
      html: `<h2>عنوان رئيسي</h2><p><br></p>`,
    },
    {
      id: 'h2',
      title: t('blockH2'),
      desc: language === 'ar' ? 'عنوان فرعي متوسط' : 'Medium subsection heading',
      icon: 'bold',
      html: `<h3>عنوان فرعي</h3><p><br></p>`,
    },
    {
      id: 'todo',
      title: t('blockTodo'),
      desc: language === 'ar' ? 'مربع اختيار تفاعلي للمهام' : 'Interactive task checklist',
      icon: 'tick',
      html: `<div style="display:flex;align-items:center;gap:8px;margin:6px 0;"><input type="checkbox" /> <span>مهمة جديدة...</span></div><p><br></p>`,
    },
    {
      id: 'bullet',
      title: t('blockBullet'),
      desc: language === 'ar' ? 'قائمة نقاط تعدادية' : 'Simple bulleted list',
      icon: 'list',
      html: `<ul><li>عنصر القائمة الأول</li><li>عنصر القائمة الثاني</li></ul><p><br></p>`,
    },
    {
      id: 'number',
      title: t('blockNumber'),
      desc: language === 'ar' ? 'قائمة مرقمة بالتسلسل' : 'Numbered sequential list',
      icon: 'listOrdered',
      html: `<ol><li>الخطوة الأولى</li><li>الخطوة الثانية</li></ol><p><br></p>`,
    },
    {
      id: 'callout',
      title: t('blockCallout'),
      desc: language === 'ar' ? 'صندوق تنبيه ولفت انتباه' : 'Highlighted callout box',
      icon: 'help',
      html: `<div style="background:var(--color-primary-light);border-inline-start:4px solid var(--color-primary);padding:12px 16px;border-radius:6px;margin:12px 0;">💡 <strong>تنبيه:</strong> اكتب الملاحظة المهمة هنا...</div><p><br></p>`,
    },
    {
      id: 'quote',
      title: t('blockQuote'),
      desc: language === 'ar' ? 'اقتباس مميز أو فكرة رئيسية' : 'Capture a quotation',
      icon: 'quote',
      html: `<blockquote style="border-inline-start:3px solid var(--color-primary);padding-inline-start:12px;margin:12px 0;font-style:italic;color:var(--text-secondary);">«اقتباس ملهم هنا...»</blockquote><p><br></p>`,
    },
    {
      id: 'code',
      title: t('blockCode'),
      desc: language === 'ar' ? 'كتلة شفرة برمجية منسقة' : 'Code snippet with monospace font',
      icon: 'code',
      html: `<pre style="background:var(--bg-input);border:1px solid var(--border-strong);padding:12px;border-radius:6px;font-family:var(--font-mono);direction:ltr;text-align:left;"><code>// your code here</code></pre><p><br></p>`,
    },
    {
      id: 'table',
      title: t('blockTable'),
      desc: language === 'ar' ? 'جدول بيانات منظم' : 'Simple 3-column table',
      icon: 'table',
      html: `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;"><tr style="background:var(--bg-input);"><th style="border:1px solid var(--border-subtle);padding:8px;">العنصر</th><th style="border:1px solid var(--border-subtle);padding:8px;">التفاصيل</th><th style="border:1px solid var(--border-subtle);padding:8px;">الحالة</th></tr><tr><td style="border:1px solid var(--border-subtle);padding:8px;">1</td><td style="border:1px solid var(--border-subtle);padding:8px;">بيان...</td><td style="border:1px solid var(--border-subtle);padding:8px;">مكتمل</td></tr></table><p><br></p>`,
    },
    {
      id: 'divider',
      title: t('blockDivider'),
      desc: language === 'ar' ? 'خط فاصل بصري بين الأقسام' : 'Visually separate content',
      icon: 'moreHorizontal',
      html: `<hr style="border:none;border-top:1px solid var(--border-subtle);margin:20px 0;" /><p><br></p>`,
    },
  ];

  const otherNotes = notes.filter((n) => !n.is_deleted && n.id !== activeNote?.id);

  return (
    <div
      className="animate-scale-in"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: '320px',
        maxHeight: '380px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-sidebar)',
          padding: '4px',
          gap: '4px',
        }}
      >
        <button
          onClick={() => setSelectedTab('blocks')}
          style={{
            flex: 1,
            padding: '5px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            backgroundColor: selectedTab === 'blocks' ? 'var(--bg-card)' : 'transparent',
            color: selectedTab === 'blocks' ? 'var(--color-primary)' : 'var(--text-muted)',
            boxShadow: selectedTab === 'blocks' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          {language === 'ar' ? 'المكعبات' : 'Blocks'}
        </button>

        <button
          onClick={() => setSelectedTab('templates')}
          style={{
            flex: 1,
            padding: '5px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            backgroundColor: selectedTab === 'templates' ? 'var(--bg-card)' : 'transparent',
            color: selectedTab === 'templates' ? 'var(--color-primary)' : 'var(--text-muted)',
            boxShadow: selectedTab === 'templates' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          {t('templates')}
        </button>

        <button
          onClick={() => setSelectedTab('links')}
          style={{
            flex: 1,
            padding: '5px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            backgroundColor: selectedTab === 'links' ? 'var(--bg-card)' : 'transparent',
            color: selectedTab === 'links' ? 'var(--color-primary)' : 'var(--text-muted)',
            boxShadow: selectedTab === 'links' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          {language === 'ar' ? 'ربط صفحة' : 'Link Page'}
        </button>
      </div>

      {/* Items list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {selectedTab === 'blocks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {blocks.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  onInsertHtml(b.html);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'start',
                  width: '100%',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: 'var(--text-main)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-input)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                  }}
                >
                  <AppIcon name={b.icon as any} size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>{b.title}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{b.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedTab === 'templates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {NOTION_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => {
                  onInsertHtml(tmpl.getHtml(language));
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'start',
                  width: '100%',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: 'var(--text-main)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                  }}
                >
                  <AppIcon name={tmpl.icon as any} size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>{t(tmpl.titleKey)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t(tmpl.descKey)}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedTab === 'links' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {otherNotes.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                {language === 'ar' ? 'لا توجد صفحات أخرى متاحة للربط' : 'No other pages available to link'}
              </div>
            ) : (
              otherNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    const linkHtml = `<span class="internal-note-link" data-note-id="${escapeHtml(note.id)}" style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:var(--color-primary-light);color:var(--color-primary);border-radius:4px;font-weight:700;text-decoration:none;cursor:pointer;">${escapeHtml(note.title || (language === 'ar' ? 'صفحة بدون عنوان' : 'Untitled Page'))}</span> `;
                    onInsertHtml(linkHtml);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'start',
                    width: '100%',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: 'var(--text-main)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <AppIcon name="note" size={14} color="var(--color-primary)" />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{note.title || t('untitledNote')}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
