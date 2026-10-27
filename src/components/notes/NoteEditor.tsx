import React, { useRef, useEffect, useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { RichToolbar } from './RichToolbar';
import { SlashMenu } from './SlashMenu';
import { formatDateArabic, stripHtml } from '../../utils/formatters';
import { AppIcon } from '../common/AppIcon';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { usePreferences } from '../../context/PreferencesContext';
import { CustomSelect } from '../common/CustomSelect';

export const NoteEditor: React.FC<{ isFullscreen: boolean; setIsFullscreen: (value: boolean) => void }> = ({ isFullscreen, setIsFullscreen }) => {
  const { notes, activeNote, setActiveNote, updateActiveNote, createNote, deleteNote, togglePinNote, toggleFavoriteNote, folders } = useDatabase();
  const { preferences } = usePreferences();
  const { language, t } = useLanguage();

  const editorRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState('');
  const [slashMenuPos, setSlashMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Sync title & content when activeNote changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title || '');
      if (editorRef.current && editorRef.current.innerHTML !== activeNote.content_html) {
        editorRef.current.innerHTML = sanitizeHtml(activeNote.content_html || '');
      }
    }
    setSlashMenuPos(null);
  }, [activeNote?.id]);

  // Click listener for internal note links inside content
  useEffect(() => {
    const handleEditorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.internal-note-link');
      if (target) {
        e.preventDefault();
        const targetId = target.getAttribute('data-note-id');
        if (targetId) {
          const targetNote = notes.find((n) => n.id === targetId && !n.is_deleted);
          if (targetNote) {
            setActiveNote(targetNote);
          }
        }
      }
    };

    const el = editorRef.current;
    if (el) {
      el.addEventListener('click', handleEditorClick);
      return () => el.removeEventListener('click', handleEditorClick);
    }
  }, [notes, setActiveNote]);

  if (!activeNote) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
          color: 'var(--text-muted)',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
          }}
        >
          <AppIcon name="note" size={32} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {t('selectNoteToRead')}
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', marginTop: '4px' }}>
            {t('appTagline')}
          </p>
        </div>
      </div>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    updateActiveNote({ title: val });
  };

  const handleContentInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText;
      updateActiveNote({ content_html: html, content: text });
    }
  };

  const executeCommand = (command: string, value: string = '') => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (command === 'formatBlock') {
      document.execCommand(command, false, `<${value}>`);
    } else {
      document.execCommand(command, false, command === 'insertHTML' ? sanitizeHtml(value) : value);
    }
    handleContentInput();
  };

  const handleInsertHtml = (html: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertHTML', false, sanitizeHtml(html));
    handleContentInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '/') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        const editorRect = editorRef.current?.getBoundingClientRect();
        if (editorRect) {
          setSlashMenuPos({
            top: Math.max(10, rect.bottom - editorRect.top + 20),
            left: Math.max(10, rect.left - editorRect.left),
          });
        }
      }
    } else if (e.key === 'Escape') {
      setSlashMenuPos(null);
    }
  };

  const handleOpenSlashMenuBtn = () => {
    setSlashMenuPos({ top: 60, left: 40 });
  };

  const plainText = stripHtml(activeNote.content_html || activeNote.content);
  const wordsCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const charsCount = plainText.length;

  // Sub-pages / Nested pages (notes having activeNote.id as parent_id)
  const subPages = notes.filter((n) => n.parent_id === activeNote.id && !n.is_deleted);

  // Backlinks: notes that link to this note via title or note ID
  const backlinks = notes.filter((n) => {
    if (n.id === activeNote.id || n.is_deleted) return false;
    const content = n.content_html || n.content;
    return content.includes(activeNote.id) || (activeNote.title && content.includes(activeNote.title));
  });

  const handleCreateSubPage = async () => {
    const sub = await createNote(activeNote.folder_id, activeNote.id);
    setActiveNote(sub);
  };

  const handleExportMarkdown = () => {
    const mdContent = `# ${activeNote.title}\n\n${plainText}`;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const folderOptions = [
    { value: '', label: t('noFolder') },
    ...folders.map((f) => ({ value: f.id, label: f.name })),
  ];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-app)',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Note Header Meta Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)',
        }}
      >
        {/* Left side in LTR / Right side in RTL: Folder selector & time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '170px' }}>
            <CustomSelect
              selectSize="sm"
              leadingIcon="folder"
              options={folderOptions}
              value={activeNote.folder_id || ''}
              onChange={(e) => updateActiveNote({ folder_id: e.target.value || null })}
            />
          </div>

          <span style={{ width: 1, height: 14, backgroundColor: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            <AppIcon name="clock" size={13} />
            <span>
              {t('lastUpdated')}:{' '}
              {language === 'ar'
                ? formatDateArabic(activeNote.updated_at)
                : new Date(activeNote.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => togglePinNote(activeNote.id)}
            title={activeNote.is_pinned ? t('unpin') : t('pin')}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              color: activeNote.is_pinned ? 'var(--color-primary)' : 'var(--text-secondary)',
              backgroundColor: activeNote.is_pinned ? 'var(--color-primary-light)' : 'transparent',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <AppIcon name={activeNote.is_pinned ? 'pinSolid' : 'pin'} size={14} />
            <span>{activeNote.is_pinned ? t('pinned') : t('pin')}</span>
          </button>

          <button
            onClick={() => toggleFavoriteNote(activeNote.id)}
            title={activeNote.is_favorite ? 'Favorite' : 'Add to favorites'}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              color: activeNote.is_favorite ? '#eab308' : 'var(--text-secondary)',
              backgroundColor: activeNote.is_favorite ? 'rgba(234, 179, 8, 0.12)' : 'transparent',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <AppIcon name={activeNote.is_favorite ? 'starSolid' : 'star'} size={14} />
            <span>{activeNote.is_favorite ? (language === 'ar' ? 'مفضلة' : 'Favorited') : (language === 'ar' ? 'تفضيل' : 'Favorite')}</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            title={t('exportMarkdown')}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="download" size={13} />
            <span>{language === 'ar' ? 'تصدير' : 'Export'}</span>
          </button>

          <button
            onClick={() => window.print()}
            title={language === 'ar' ? 'طباعة الملاحظة' : 'Print Note'}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="printer" size={15} />
          </button>

          <button
            onClick={() => deleteNote(activeNote.id)}
            title={t('delete')}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-danger)',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="trash" size={15} />
          </button>
        </div>
      </div>

      {/* Rich Formatting Toolbar with Slash & Template Triggers */}
      <RichToolbar
        onCommand={executeCommand}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onOpenSlashMenu={handleOpenSlashMenuBtn}
        onOpenTemplates={handleOpenSlashMenuBtn}
      />

      {/* Note Body Area (Scrollable Workspace) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isFullscreen ? '24px clamp(16px, 4vw, 48px)' : '24px 36px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={() => setSlashMenuPos(null)}
      >
        {/* Title Input */}
        <input
          type="text"
          dir="auto"
          placeholder={t('untitledNote')}
          value={title}
          onChange={handleTitleChange}
          style={{
            width: '100%',
            fontSize: 'var(--text-2xl)',
            fontWeight: 800,
            color: 'var(--text-main)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: '4px 0 12px 0',
            marginBottom: '12px',
            borderBottom: '1px solid var(--border-subtle)',
            boxShadow: 'none',
          }}
        />

        {/* Content Editable Area */}
        <div
          ref={editorRef}
          spellCheck={preferences.spellcheck}
          onPaste={event => {
            event.preventDefault();
            const html = event.clipboardData.getData('text/html');
            if (html) handleInsertHtml(html);
            else { document.execCommand('insertText', false, event.clipboardData.getData('text/plain')); handleContentInput(); }
          }}
          onDrop={event => event.preventDefault()}
          dir="auto"
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentInput}
          onKeyDown={handleKeyDown}
          className="note-content-editable"
          style={{
            flex: '1 0 auto',
            minHeight: '260px',
            outline: 'none',
            fontSize: `${preferences.editorSize}px`,
            fontFamily: preferences.editorFont === 'serif' ? 'Georgia, serif' : preferences.editorFont === 'monospace' ? 'Consolas, monospace' : preferences.editorFont === 'cairo' ? "'Cairo', sans-serif" : preferences.editorFont === 'inter' ? "'Inter', sans-serif" : 'inherit',
            lineHeight: 1.85,
            color: 'var(--text-main)',
          }}
          data-placeholder={t('noteContentPlaceholder')}
        />

        {/* Slash Command Menu Popup */}
        {slashMenuPos && (
          <SlashMenu
            position={slashMenuPos}
            onClose={() => setSlashMenuPos(null)}
            onInsertHtml={handleInsertHtml}
            onNavigateToNote={(id) => {
              const target = notes.find((n) => n.id === id);
              if (target) setActiveNote(target);
            }}
          />
        )}

        {/* Nested Sub-pages Section */}
        <div
          style={{
            marginTop: '32px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {t('subPages')} ({subPages.length})
            </span>
            <button
              onClick={handleCreateSubPage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--color-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <AppIcon name="plus" size={13} />
              <span>{t('addSubPage')}</span>
            </button>
          </div>

          {subPages.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {subPages.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setActiveNote(sub)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <AppIcon name="note" size={14} color="var(--color-primary)" />
                  <span>{sub.title || t('untitledNote')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Backlinks & References Section */}
        {backlinks.length > 0 && (
          <div
            style={{
              marginTop: '20px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              {language === 'ar' ? 'صفحات تشير إلى هذه الملاحظة (Backlinks):' : 'Linked References (Backlinks):'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {backlinks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setActiveNote(b)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <AppIcon name="link" size={12} />
                  <span>{b.title || t('untitledNote')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 24px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>
            {wordsCount} {t('wordsCount')}
          </span>
          <span>•</span>
          <span>
            {charsCount} {t('charsCount')}
          </span>
        </div>

      </footer>
    </div>
  );
};
