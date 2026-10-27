import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatDateArabic, stripHtml } from '../../utils/formatters';
import { AppIcon } from '../common/AppIcon';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const TrashView: React.FC = () => {
  const { trashNotes, restoreNote, deleteNote, emptyTrash } = useDatabase();
  const { language, t } = useLanguage();
  const [pending, setPending] = useState<{ type: 'empty' } | { type: 'permanent'; noteTitle: string; noteId: string } | null>(null);

  const deletedNotes = trashNotes;

  const confirmLabels = {
    title: language === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm permanent delete',
    confirm: language === 'ar' ? 'حذف نهائي' : 'Delete permanently',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
  };

  const message = !pending ? '' : pending.type === 'empty'
    ? language === 'ar'
      ? 'سيتم حذف جميع العناصر داخل سلة المحذوفات نهائيًا. لا يمكن التراجع عن هذا الإجراء.'
      : 'All notes in the trash will be permanently deleted. This cannot be undone.'
    : language === 'ar'
      ? `سيتم حذف "${pending.noteTitle}" نهائيًا مع أي صفحات فرعية مرتبطة بها. لا يمكن التراجع.`
      : `"${pending.noteTitle}" will be permanently deleted together with any of its sub-pages. This cannot be undone.`;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-app)',
        padding: '24px 32px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AppIcon name="trash" size={24} color="var(--color-danger)" />
            <span>{t('trashTitle')}</span>
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('trashSubtitle')}
          </p>
        </div>

        {deletedNotes.length > 0 && (
          <button
            onClick={() => setPending({ type: 'empty' })}
            style={{
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              border: '1px solid var(--color-danger)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: 'var(--text-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AppIcon name="trash" size={14} />
            <span>{t('emptyTrashBtn')}</span>
          </button>
        )}
      </div>

      {/* Content */}
      {deletedNotes.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: 'var(--text-muted)',
            marginTop: '60px',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="trash" size={26} color="var(--text-muted)" />
          </div>
          <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {t('trashEmptyMsg')}
          </p>
          <p style={{ fontSize: 'var(--text-xs)' }}>
            {language === 'ar' ? 'لم تقم بحذف أي ملاحظة مؤخراً' : 'You have not deleted any notes recently'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {deletedNotes.map((note) => {
            const plainText = stripHtml(note.content_html || note.content);
            const snippet = plainText.slice(0, 100).trim() || (language === 'ar' ? 'بدون محتوى...' : 'No content...');

            return (
              <div
                key={note.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    {note.title || t('untitledNote')}
                  </h4>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '12px',
                    }}
                  >
                    {snippet}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {language === 'ar'
                      ? formatDateArabic(note.deleted_at || note.updated_at)
                      : new Date(note.deleted_at || note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => restoreNote(note.id)}
                      title={t('restore')}
                      style={{
                        padding: '4px 8px',
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
                      <AppIcon name="restore" size={13} />
                      <span>{t('restore')}</span>
                    </button>

                    <button
                      onClick={() => setPending({ type: 'permanent', noteTitle: note.title || (language === 'ar' ? 'بدون عنوان' : 'Untitled'), noteId: note.id })}
                      title={t('permanentDelete')}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-danger-bg)',
                        color: 'var(--color-danger)',
                        fontSize: 'var(--text-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <AppIcon name="trash" size={13} />
                      <span>{t('delete')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        title={confirmLabels.title}
        message={message}
        confirmLabel={confirmLabels.confirm}
        cancelLabel={confirmLabels.cancel}
        danger
        onConfirm={async () => {
          if (!pending) return;
          if (pending.type === 'empty') await emptyTrash();
          else await deleteNote(pending.noteId, true);
          setPending(null);
        }}
        onClose={() => setPending(null)}
      />
    </div>
  );
};
