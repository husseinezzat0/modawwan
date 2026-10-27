import { categoryKey, categoryLabel } from '../../i18n/translations';
import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useDatabase } from '../../context/DatabaseContext';
import { useNavigation } from '../../context/NavigationContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Task, TaskPriority } from '../../types';
import { formatRelativeDate } from '../../utils/formatters';
import { SvgDonutChart, DonutSlice } from '../common/SvgDonutChart';
import { TaskModal } from './TaskModal';
import { AppIcon } from '../common/AppIcon';
import { CustomSelect } from '../common/CustomSelect';

export const TasksView: React.FC = () => {
  const { tasks, taskStats, createTask, updateTask, toggleTaskCompletion, deleteTask } = useDatabase();
  const { searchQuery } = useNavigation();
  const { language, t } = useLanguage();

  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (selectedCategory !== 'all') {
      setSelectedCategory((prev) => categoryLabel(prev, language));
    }
  }, [language]);

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Trigger confetti burst on completion
  const handleToggleTask = async (task: Task) => {
    const willBeCompleted = !task.is_completed;
    if (willBeCompleted) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'],
        });
      } catch {}
    }
    await toggleTaskCompletion(task.id);
  };

  const handleSaveTask = async (data: any) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'pending' && t.is_completed) return false;
    if (activeTab === 'completed' && !t.is_completed) return false;
    if (selectedCategory !== 'all' && categoryKey(t.category) !== categoryKey(selectedCategory)) return false;
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Prepare chart data for completion status
  const completionSlices: DonutSlice[] = taskStats
    ? [
        { label: language === 'ar' ? 'مكتملة' : 'Completed', value: taskStats.completed, color: 'var(--color-success)' },
        { label: language === 'ar' ? 'قيد الإنجاز' : 'Pending', value: taskStats.pending, color: 'var(--color-primary)' },
      ]
    : [];

  const categoryColors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6'];
  const categorySlices: DonutSlice[] =
    taskStats?.categories.map((c, idx) => ({
      label: categoryLabel(c.category, language),
      value: c.count,
      color: categoryColors[idx % categoryColors.length],
    })) || [];

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="badge badge-urgent">{t('taskUrgent')}</span>;
      case 'high':
        return <span className="badge badge-high">{t('taskHigh')}</span>;
      case 'medium':
        return <span className="badge badge-medium">{t('taskMedium')}</span>;
      case 'low':
        return <span className="badge badge-low">{t('taskLow')}</span>;
    }
  };

  const categories = language === 'ar'
    ? ['all', 'عمل', 'شخصي', 'دراسة', 'مشاريع', 'صحة', 'مالية', 'عام']
    : ['all', 'Work', 'Personal', 'Study', 'Projects', 'Health', 'Finance', 'General'];

  const categoryOptions = categories.map((c) => ({
    value: c === 'all' ? 'all' : (categoryKey(c) === categoryKey(selectedCategory) ? selectedCategory : c),
    label: c === 'all' ? (language === 'ar' ? 'جميع التصنيفات' : 'All Categories') : categoryLabel(c, language),
  }));
  if (selectedCategory !== 'all' && !categoryOptions.some((o) => categoryKey(o.value) === categoryKey(selectedCategory))) {
    categoryOptions.push({ value: selectedCategory, label: categoryLabel(selectedCategory, language) });
  }

  const priorityOptions = [
    { value: 'all', label: language === 'ar' ? 'جميع الأولويات' : 'All Priorities' },
    { value: 'urgent', label: t('taskUrgent'), dot: 'var(--color-danger)' },
    { value: 'high', label: t('taskHigh'), dot: 'var(--color-warning)' },
    { value: 'medium', label: t('taskMedium'), dot: 'var(--color-info)' },
    { value: 'low', label: t('taskLow'), dot: 'var(--color-success)' },
  ];

  // Calendar helpers
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentCalendarDate(new Date(year, month + 1, 1));

  const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthLabel = language === 'ar' ? `${monthNamesAr[month]} ${year}` : `${monthNamesEn[month]} ${year}`;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-app)',
        padding: '28px 36px',
        overflowY: 'auto',
      }}
    >
      {/* Header & View Mode Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AppIcon name="task" size={26} color="var(--color-primary)" />
            <span>{t('navTasks')}</span>
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('appTagline')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Mode Toggle: List, Kanban, Calendar */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
              gap: '2px',
            }}
          >
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                backgroundColor: viewMode === 'list' ? 'var(--color-primary-light)' : 'transparent',
                color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t('taskListView')}
            </button>

            <button
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                backgroundColor: viewMode === 'kanban' ? 'var(--color-primary-light)' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--color-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t('taskKanbanView')}
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                backgroundColor: viewMode === 'calendar' ? 'var(--color-primary-light)' : 'transparent',
                color: viewMode === 'calendar' ? 'var(--color-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t('taskCalendarView')}
            </button>
          </div>

          <button
            data-new-task
          onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: 'var(--text-sm)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="plus" size={15} color="#ffffff" />
            <span>{t('newTask')}</span>
          </button>
        </div>
      </div>

      {/* Statistics Dashboard Cards */}
      {taskStats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* Card 1: Completion Rate & Donut */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                {t('taskCompletionRate')}
              </span>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {taskStats.completionRate}%
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {taskStats.completed} / {taskStats.total} {language === 'ar' ? 'مهمة' : 'tasks'}
              </span>
            </div>
            <SvgDonutChart
              slices={completionSlices}
              size={85}
              thickness={12}
              centerLabel={`${taskStats.completionRate}%`}
            />
          </div>

          {/* Card 2: Pending Tasks */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
              {t('taskPending')}
            </span>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
              {taskStats.pending}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {taskStats.urgent > 0 && (
                <span className="badge badge-urgent">
                  {taskStats.urgent} {t('taskUrgent')}
                </span>
              )}
              {taskStats.high > 0 && (
                <span className="badge badge-high">
                  {taskStats.high} {t('taskHigh')}
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Categories Breakdown Chart */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                {language === 'ar' ? 'توزيع التصنيفات' : 'Categories Breakdown'}
              </span>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {taskStats.categories.length} {language === 'ar' ? 'تصنيفات' : 'Categories'}
              </div>
            </div>
            <SvgDonutChart
              slices={categorySlices}
              size={85}
              thickness={12}
              centerLabel={`${taskStats.total}`}
              centerSublabel={language === 'ar' ? 'مهمة' : 'Tasks'}
            />
          </div>
        </div>
      )}

      {/* Filters Bar with CustomSelect */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
        }}
      >
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: t('all') },
            { id: 'pending', label: t('taskPending') },
            { id: 'completed', label: t('taskCompleted') },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dropdown Filters with CustomSelect */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '150px' }}>
            <CustomSelect
              selectSize="sm"
              options={categoryOptions}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            />
          </div>

          <div style={{ width: '150px' }}>
            <CustomSelect
              selectSize="sm"
              options={priorityOptions}
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: Standard List View */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTasks.length === 0 ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <AppIcon name="tick" size={36} color="var(--text-muted)" />
              <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {language === 'ar' ? 'لا توجد مهام مطابقة' : 'No tasks match current filter'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isCompleted = task.is_completed === 1;

              return (
                <div
                  key={task.id}
                  className="animate-fade-in"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                    opacity: isCompleted ? 0.75 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                    <button
                      onClick={() => handleToggleTask(task)}
                      title={isCompleted ? 'Reopen' : 'Complete'}
                      style={{
                        padding: 0,
                        marginTop: '2px',
                        cursor: 'pointer',
                        background: 'transparent',
                        border: 'none',
                      }}
                    >
                      {isCompleted ? (
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-success)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                          }}
                        >
                          <AppIcon name="tick" size={13} color="#ffffff" />
                        </span>
                      ) : (
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 'var(--radius-sm)',
                            border: '2px solid var(--border-strong)',
                            display: 'inline-block',
                            backgroundColor: 'var(--bg-input)',
                          }}
                        />
                      )}
                    </button>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: 'var(--text-base)',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                          }}
                        >
                          {task.title}
                        </span>
                        {getPriorityBadge(task.priority)}
                        <span
                          style={{
                            fontSize: 'var(--text-xs)',
                            backgroundColor: 'var(--bg-app)',
                            color: 'var(--text-secondary)',
                            padding: '1px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 600,
                          }}
                        >
                          {categoryLabel(task.category, language)}
                        </span>
                      </div>

                      {task.description && (
                        <p
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-secondary)',
                            marginTop: '4px',
                            lineHeight: 1.4,
                          }}
                        >
                          {task.description}
                        </p>
                      )}

                      {task.due_date && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            marginTop: '6px',
                          }}
                        >
                          <AppIcon name="calendar" size={11} color="var(--text-muted)" />
                          <span>
                            {t('taskDueDate')}: {formatRelativeDate(task.due_date)} ({task.due_date})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                      title={t('edit')}
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      <AppIcon name="edit" size={14} />
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      title={t('delete')}
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                      }}
                    >
                      <AppIcon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: Notion-Style Kanban Board */}
      {viewMode === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'start' }}>
          {/* Column 1: To Do */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#9ca3af' }} />
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-main)' }}>{t('taskTodoCol')}</h3>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'var(--bg-input)', padding: '2px 8px', borderRadius: '12px' }}>
                {filteredTasks.filter((t) => !t.is_completed && t.priority !== 'urgent').length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredTasks
                .filter((t) => !t.is_completed && t.priority !== 'urgent')
                .map((task) => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{categoryLabel(task.category, language)}</span>
                      {getPriorityBadge(task.priority)}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-main)' }}>{task.title}</div>
                    {task.due_date && (
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AppIcon name="calendar" size={11} />
                        {task.due_date}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
                      <button
                        onClick={() => handleToggleTask(task)}
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {language === 'ar' ? 'إكمال' : 'Complete'}
                          <AppIcon name="tick" size={11} />
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-main)' }}>{t('taskInProgressCol')}</h3>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'var(--bg-input)', padding: '2px 8px', borderRadius: '12px' }}>
                {filteredTasks.filter((t) => !t.is_completed && t.priority === 'urgent').length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredTasks
                .filter((t) => !t.is_completed && t.priority === 'urgent')
                .map((task) => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--color-primary)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{categoryLabel(task.category, language)}</span>
                      {getPriorityBadge(task.priority)}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-main)' }}>{task.title}</div>
                    {task.due_date && (
                      <div style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AppIcon name="clock" size={11} />
                        {task.due_date}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
                      <button
                        onClick={() => handleToggleTask(task)}
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: 'var(--color-success)',
                          color: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {language === 'ar' ? 'إكمال' : 'Complete'}
                          <AppIcon name="tick" size={11} />
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-main)' }}>{t('taskDoneCol')}</h3>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'var(--bg-input)', padding: '2px 8px', borderRadius: '12px' }}>
                {filteredTasks.filter((t) => t.is_completed).length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredTasks
                .filter((t) => t.is_completed)
                .map((task) => (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      opacity: 0.8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{categoryLabel(task.category, language)}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AppIcon name="tick" size={11} /> {t('taskCompleted')}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-main)', textDecoration: 'line-through' }}>{task.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
                      <button
                        onClick={() => handleToggleTask(task)}
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: 'transparent',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {language === 'ar' ? 'إعادة فتح' : 'Reopen'}
                          <AppIcon name="restore" size={11} />
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Interactive Calendar View */}
      {viewMode === 'calendar' && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Calendar Header with Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-main)' }}>
              {monthLabel}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                aria-label={language === 'ar' ? 'الشهر السابق' : 'Previous month'}
                onClick={prevMonth}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                <AppIcon name={language === 'ar' ? 'arrowRight' : 'arrowLeft'} size={16} />
              </button>
              <button
                aria-label={language === 'ar' ? 'الشهر التالي' : 'Next month'}
                onClick={nextMonth}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                <AppIcon name={language === 'ar' ? 'arrowLeft' : 'arrowRight'} size={16} />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '8px' }}>
            {(language === 'ar'
              ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
              : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            ).map((dayName, idx) => (
              <div key={idx} style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--text-muted)', padding: '6px' }}>
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {/* Empty offset days */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ height: '90px', borderRadius: 'var(--radius-md)', opacity: 0.2 }} />
            ))}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNumber = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
              const dayTasks = tasks.filter((t) => t.due_date === dateStr);
              const isToday = new Date().toDateString() === new Date(year, month, dayNumber).toDateString();

              return (
                <div
                  key={dayNumber}
                  style={{
                    height: '90px',
                    borderRadius: 'var(--radius-md)',
                    border: isToday ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    backgroundColor: isToday ? 'var(--color-primary-light)' : 'var(--bg-input)',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: isToday ? 'var(--color-primary)' : 'var(--text-main)' }}>
                      {dayNumber}
                    </span>
                    {dayTasks.length > 0 && (
                      <span style={{ fontSize: '10px', backgroundColor: 'var(--color-primary)', color: '#ffffff', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        title={t.title}
                        onClick={() => {
                          setEditingTask(t);
                          setIsModalOpen(true);
                        }}
                        style={{
                          fontSize: '10px',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          backgroundColor: t.is_completed ? 'var(--color-success-bg)' : 'var(--bg-card)',
                          color: t.is_completed ? 'var(--color-success)' : 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </div>
  );
};
