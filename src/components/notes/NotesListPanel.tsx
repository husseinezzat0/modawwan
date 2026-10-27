import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useNavigation } from '../../context/NavigationContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatDateArabic, stripHtml } from '../../utils/formatters';
import { Note } from '../../types';
import { AppIcon } from '../common/AppIcon';

export const NotesListPanel: React.FC = () => {
  const { notes, activeNote, setActiveNote, createNote, deleteNote, togglePinNote, toggleFavoriteNote, folders } = useDatabase();
  const { selectedFolderId, searchQuery } = useNavigation();
  const { language, t } = useLanguage();

  // Filter notes by folder, trash, and search
  const visibleNotes = notes.filter((n) => {
    if (n.is_deleted) return false;
    if (selectedFolderId && n.folder_id !== selectedFolderId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const plainContent = stripHtml(n.content_html || n.content).toLowerCase();
      return n.title.toLowerCase().includes(q) || plainContent.includes(q);
    }
    return true;
  });

  const pinnedNotes = visibleNotes.filter((n) => n.is_pinned);
  const unpinnedNotes = visibleNotes.filter((n) => !n.is_pinned);

  const currentFolder = folders.find((f) => f.id === selectedFolderId);

  const handleCreateNote = async () => {
    await createNote(selectedFolderId);
  };

  const renderNoteCard = (note: Note) => {
    const isActive = activeNote?.id === note.id;
    const noteFolder = folders.find((f) => f.id === note.folder_id);
    const plainText = stripHtml(note.content_html || note.content);
    const previewSnippet = plainText.slice(0, 75).trim() || (language === 'ar' ? 'لا يوجد نص إضافي...' : 'No additional text...');

    return (
      <div
        key={note.id}
        onClick={() => setActiveNote(note)}
        style={{
          padding: '10px 14px',
          margin: '3px 8px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: isActive ? 'var(--bg-card-hover)' : 'transparent',
          border: isActive ? '1px solid var(--border-strong)' : '1px solid transparent',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* Title & Actions Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
          <h4
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--text-main)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '190px',
            }}
          >
            {note.title || t('untitledNote')}
          </h4>

          {/* Quick Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePinNote(note.id);
              }}
              title={note.is_pinned ? (language === 'ar' ? 'إلغاء التثبيت' : 'Unpin note') : (language === 'ar' ? 'تثبيت الملاحظة' : 'Pin note')}
              style={{
                padding: '2px',
                color: note.is_pinned ? 'var(--color-primary)' : 'var(--text-muted)',
                opacity: note.is_pinned ? 1 : 0.45,
              }}
            >
              <AppIcon name={note.is_pinned ? 'pinSolid' : 'pin'} size={13} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteNote(note.id);
              }}
              title={note.is_favorite ? (language === 'ar' ? 'إزالة من المفضلة' : 'Remove favorite') : (language === 'ar' ? 'إضافة إلى المفضلة' : 'Add favorite')}
              style={{
                padding: '2px',
                color: note.is_favorite ? '#eab308' : 'var(--text-muted)',
                opacity: note.is_favorite ? 1 : 0.45,
              }}
            >
              <AppIcon name={note.is_favorite ? 'starSolid' : 'star'} size={13} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNote(note.id);
              }}
              title={language === 'ar' ? 'نقل إلى سلة المحذوفات' : 'Move to trash'}
              style={{
                padding: '2px',
                color: 'var(--text-muted)',
                opacity: 0.4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <AppIcon name="trash" size={13} />
            </button>
          </div>
        </div>

        {/* Content Preview Snippet */}
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.45,
            marginBottom: '6px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {previewSnippet}
        </p>

        {/* Bottom Meta (Date & Folder tag) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>{formatDateArabic(note.updated_at)}</span>

          {noteFolder && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: 'var(--bg-app)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-sm)',
                color: noteFolder.color || 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              <AppIcon name="folder" size={11} color="currentColor" />
              <span>{noteFolder.name}</span>
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: 'var(--notes-list-width)',
        backgroundColor: 'var(--bg-panel)',
        borderInlineEnd: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Panel Top Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-main)' }}>
            {currentFolder ? currentFolder.name : t('allNotes')}
          </h3>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {visibleNotes.length} {language === 'ar' ? 'ملاحظة' : 'notes'}
          </span>
        </div>

        <button
          onClick={handleCreateNote}
          title={`${t('newNote')} (Ctrl + N)`}
          style={{
            background: 'var(--color-primary)',
            color: '#ffffff',
            padding: '5px 12px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: 'var(--text-xs)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <AppIcon name="plus" size={13} />
          <span>{t('create')}</span>
        </button>
      </div>

      {/* Notes List Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {visibleNotes.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--bg-sidebar)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <AppIcon name="note" size={24} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {t('noNotesFound')}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                {language === 'ar' ? 'انقر على "جديدة" للبدء في تدوين أفكارك فوراً' : 'Click "Create" to start writing your notes'}
              </p>
            </div>
            <button
              onClick={handleCreateNote}
              style={{
                marginTop: '8px',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <AppIcon name="plus" size={13} />
              <span>{t('newNote')}</span>
            </button>
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedNotes.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    padding: '4px 16px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <AppIcon name="pinSolid" size={12} color="var(--color-primary)" />
                  <span>{t('pinned')}</span>
                </div>
                {pinnedNotes.map(renderNoteCard)}
              </div>
            )}

            {/* Other Notes Section */}
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <div
                    style={{
                      padding: '4px 16px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>{t('navNotes')}</span>
                  </div>
                )}
                {unpinnedNotes.map(renderNoteCard)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
