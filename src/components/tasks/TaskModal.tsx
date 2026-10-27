import { useDialog } from '../common/useDialog';
import React, { useState } from 'react';
import { Task, TaskPriority } from '../../types';
import { AppIcon } from '../common/AppIcon';
import { CustomSelect } from '../common/CustomSelect';
import { useLanguage } from '../../i18n/LanguageContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    category: string;
    due_date: string | null;
  }) => Promise<void>;
  task?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
}) => {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [category, setCategory] = useState(task?.category || (isEn ? 'Work' : 'عمل'));
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogRef = useDialog(isOpen, onClose);
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        priority,
        category: category.trim() || (isEn ? 'General' : 'عام'),
        due_date: dueDate || null,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = isEn
    ? ['Work', 'Personal', 'Study', 'Projects', 'Health', 'Finance', 'General']
    : ['عمل', 'شخصي', 'دراسة', 'مشاريع', 'صحة', 'مالية', 'عام'];

  const priorityOptions = [
    { value: 'urgent', label: isEn ? 'Urgent' : 'عاجل ومهم', dot: 'var(--color-danger)' },
    { value: 'high', label: isEn ? 'High' : 'عالي الأهمية', dot: 'var(--color-warning)' },
    { value: 'medium', label: isEn ? 'Medium' : 'متوسط', dot: 'var(--color-info)' },
    { value: 'low', label: isEn ? 'Low' : 'منخفض', dot: 'var(--color-success)' },
  ];

  const categoryOptions = categories.map((c) => ({ value: c, label: c }));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={language === 'ar' ? 'تحرير البيانات' : 'Edit details'}
        tabIndex={-1}
        className="animate-scale-in"
        style={{
          backgroundColor: 'var(--bg-modal)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          width: '90%',
          maxWidth: '500px',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AppIcon name="task" size={20} color="var(--color-primary)" />
            <span>{task ? t('taskEditTitle') : t('taskAddTitle')}</span>
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '4px' }}>
            <AppIcon name="close" size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px' }}>
              {t('taskTitleLabel')}
            </label>
            <input
              autoFocus
              type="text"
              placeholder={t('taskTitlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', height: '38px' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px' }}>
              {t('taskDescLabel')}
            </label>
            <textarea
              rows={3}
              placeholder={t('taskDescPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Priority & Category Grid with CustomSelect */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Priority */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px' }}>
                {t('taskPriority')}
              </label>
              <CustomSelect
                options={priorityOptions}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px' }}>
                {t('taskCategory')}
              </label>
              <CustomSelect
                options={categoryOptions}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: '6px' }}>
              {t('taskDueDate')}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ width: '100%', height: '38px' }}
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
              }}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              {isSubmitting ? t('taskSaving') : task ? t('save') : t('taskSaveBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
