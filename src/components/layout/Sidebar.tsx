import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useDatabase } from '../../context/DatabaseContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { NavView } from '../../types';
import { AppIcon } from '../common/AppIcon';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, selectedFolderId, setSelectedFolderId, sidebarCollapsed, toggleSidebar } = useNavigation();
  const { folders, notes, trashNotes, tasks, createFolder, updateFolder, deleteFolder } = useDatabase();
  const { language, t } = useLanguage();

  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#f59e0b');
  const [activeMenuFolderId, setActiveMenuFolderId] = useState<string | null>(null);

  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const cancelRename = useRef(false);
  useEffect(() => {
    if (!activeMenuFolderId) return;
    const menu = document.querySelector<HTMLElement>('[data-folder-menu]');
    menu?.querySelector<HTMLButtonElement>('button')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setActiveMenuFolderId(null); }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && menu?.contains(document.activeElement)) {
        event.preventDefault(); const buttons = Array.from(menu.querySelectorAll('button')); const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
      }
    };
    const outside = (event: Event) => { if (!(event.target as Element)?.closest('[data-folder-menu], [data-folder-menu-trigger]')) setActiveMenuFolderId(null); };
    document.addEventListener('keydown', keydown); document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', outside); };
  }, [activeMenuFolderId]);

  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#ef4444'];

  const pendingTasksCount = tasks.filter((t) => !t.is_completed).length;
  const activeNotesCount = notes.filter((n) => !n.is_deleted).length;
  const trashCount = trashNotes.length;

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim(), 'folder', newFolderColor);
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const navItems: { view: NavView; label: string; icon: any; badge?: number | string }[] = [
    { view: 'notes', label: t('navNotes'), icon: 'note', badge: activeNotesCount },
    { view: 'tasks', label: t('navTasks'), icon: 'task', badge: pendingTasksCount },
    { view: 'finance', label: t('navFinance'), icon: 'wallet' },
    { view: 'trash', label: t('navTrash'), icon: 'trash', badge: trashCount > 0 ? trashCount : undefined },
    { view: 'settings', label: t('navSettings'), icon: 'settings' },
  ];

  if (sidebarCollapsed) {
    return (
      <aside
        style={{
          width: '56px',
          backgroundColor: 'var(--bg-sidebar)',
          borderInlineEnd: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'var(--space-3) 0',
          gap: 'var(--space-2)',
          zIndex: 40,
        }}
      >
        <button
          onClick={toggleSidebar}
          title={`${t('expandSidebar')} (Ctrl + B)`}
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          <AppIcon name={language === 'ar' ? 'doubleChevronLeft' : 'doubleChevronRight'} size={16} />
        </button>

        <div style={{ width: '80%', height: 1, backgroundColor: 'var(--border-subtle)', margin: '8px 0' }} />

        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => {
                setCurrentView(item.view);
                if (item.view === 'notes') setSelectedFolderId(null);
              }}
              title={item.label}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                position: 'relative',
              }}
            >
              <AppIcon name={item.icon} size={18} />
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    insetInlineEnd: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                  }}
                />
              )}
            </button>
          );
        })}
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-sidebar)',
        borderInlineEnd: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        zIndex: 40,
      }}
    >
      {/* Top Header & Navigation Items */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: 'var(--space-3)', overflowY: 'auto' }}>
        {/* Collapse button header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            {language === 'ar' ? 'التنقل الرئيسي' : 'MAIN NAVIGATION'}
          </span>
          <button
            onClick={toggleSidebar}
            title={`${t('collapseSidebar')} (Ctrl + B)`}
            style={{
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
            }}
          >
            <AppIcon name={language === 'ar' ? 'doubleChevronRight' : 'doubleChevronLeft'} size={15} />
          </button>
        </div>

        {/* Main Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: 'var(--space-4)' }}>
          {navItems.map((item) => {
            const isActive = currentView === item.view && (item.view !== 'notes' || selectedFolderId === null);
            return (
              <button
                key={item.view}
                onClick={() => {
                  setCurrentView(item.view);
                  if (item.view === 'notes') setSelectedFolderId(null);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-main)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 'var(--text-sm)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AppIcon name={item.icon} size={17} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      padding: '1px 7px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isActive ? 'var(--color-primary)' : 'var(--bg-app)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 700,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Folders Section */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
              {t('folders')}
            </span>
            <button
              onClick={() => setIsAddingFolder(true)}
              title={t('newFolder')}
              style={{
                padding: '3px 6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <AppIcon name="plus" size={13} />
              <span>{t('create')}</span>
            </button>
          </div>

          {/* New Folder Form */}
          {isAddingFolder && (
            <form
              onSubmit={handleAddFolder}
              className="animate-fade-in"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: '8px',
                marginBottom: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <input
                autoFocus
                type="text"
                placeholder={language === 'ar' ? 'اسم المجلد...' : 'Folder name...'}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                style={{ width: '100%', fontSize: 'var(--text-xs)', padding: '5px 8px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {colors.map((c) => (
                    <span
                      key={c}
                      onClick={() => setNewFolderColor(c)}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: c,
                        cursor: 'pointer',
                        border: newFolderColor === c ? '2px solid var(--text-main)' : 'none',
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddingFolder(false)}
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    style={{
                      fontSize: 'var(--text-xs)',
                      background: 'var(--color-primary)',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                    }}
                  >
                    {t('save')}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Folder Tree List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {folders.map((folder) => {
              const isActive = currentView === 'notes' && selectedFolderId === folder.id;
              const folderNotesCount = notes.filter((n) => n.folder_id === folder.id && !n.is_deleted).length;

              return (
                <div
                  key={folder.id}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--text-main)',
                    fontSize: 'var(--text-sm)',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                  }}
                  onClick={() => {
                    setCurrentView('notes');
                    setSelectedFolderId(folder.id);
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ color: folder.color }}>
                      <AppIcon name="folder" size={16} />
                    </span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {folder.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {folderNotesCount}
                    </span>
                    <button
                      data-folder-menu-trigger
                      aria-label={language === 'ar' ? 'خيارات المجلد' : 'Folder actions'}
                      aria-haspopup="menu"
                      aria-expanded={activeMenuFolderId === folder.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuFolderId(activeMenuFolderId === folder.id ? null : folder.id);
                      }}
                      style={{ padding: '2px', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)' }}
                    >
                      <AppIcon name="moreVertical" size={14} />
                    </button>
                  </div>

                  {/* Folder Options Menu */}
                  {activeMenuFolderId === folder.id && (
                    <div
                      role="menu"
                      data-folder-menu
                      aria-label={language === 'ar' ? 'خيارات المجلد' : 'Folder actions'}
                      className="animate-scale-in"
                      style={{
                        position: 'absolute',
                        insetInlineEnd: '10px',
                        top: '32px',
                        backgroundColor: 'var(--bg-modal)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        padding: '4px',
                        zIndex: 60,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        minWidth: '110px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={async () => {
                          cancelRename.current = false; setRenameDraft(folder.name); setRenamingFolderId(folder.id);
                          setActiveMenuFolderId(null);
                        }}
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '4px 8px',
                          fontSize: 'var(--text-xs)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <AppIcon name="edit" size={12} />
                        <span>{language === 'ar' ? 'تعديل الاسم' : 'Rename folder'}</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(t('deleteFolderConfirm').replace('{name}', folder.name))) {
                            await deleteFolder(folder.id);
                          }
                          setActiveMenuFolderId(null);
                        }}
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '4px 8px',
                          fontSize: 'var(--text-xs)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--color-danger)',
                        }}
                      >
                        <AppIcon name="trash" size={12} />
                        <span>{language === 'ar' ? 'حذف المجلد' : 'Delete folder'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </aside>
  );
};
