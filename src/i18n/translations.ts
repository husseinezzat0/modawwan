export type Language = 'ar' | 'en';

export interface TranslationDictionary {
  // App General
  appName: string;
  appTagline: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  create: string;
  search: string;
  filter: string;
  all: string;
  actions: string;
  close: string;
  back: string;
  loading: string;
  success: string;
  error: string;
  confirm: string;
  warning: string;
  empty: string;
  pinned: string;
  unpin: string;
  pin: string;
  restore: string;
  permanentDelete: string;

  // Navigation
  navNotes: string;
  navTasks: string;
  navFinance: string;
  navTrash: string;
  navSettings: string;
  navShortcuts: string;
  newNote: string;
  newTask: string;
  newTransaction: string;
  newFolder: string;
  allNotes: string;
  favorites: string;
  folders: string;
  collapseSidebar: string;
  expandSidebar: string;

  // Notes & Editor
  searchNotesPlaceholder: string;
  noNotesFound: string;
  selectNoteToRead: string;
  untitledNote: string;
  noteContentPlaceholder: string;
  folderLabel: string;
  noFolder: string;
  wordsCount: string;
  charsCount: string;
  lastUpdated: string;
  exportMarkdown: string;
  exportHtml: string;
  templates: string;
  chooseTemplate: string;
  templateMeeting: string;
  templateMeetingDesc: string;
  templateProject: string;
  templateProjectDesc: string;
  templateJournal: string;
  templateJournalDesc: string;
  templateBudget: string;
  templateBudgetDesc: string;
  slashHint: string;
  blockText: string;
  blockH1: string;
  blockH2: string;
  blockH3: string;
  blockBullet: string;
  blockNumber: string;
  blockTodo: string;
  blockQuote: string;
  blockCode: string;
  blockCallout: string;
  blockDivider: string;
  blockTable: string;
  subPages: string;
  addSubPage: string;
  internalLinks: string;
  linkToPage: string;

  // Tasks
  searchTasksPlaceholder: string;
  taskListView: string;
  taskKanbanView: string;
  taskCalendarView: string;
  taskTodoCol: string;
  taskInProgressCol: string;
  taskDoneCol: string;
  taskTotal: string;
  taskPending: string;
  taskCompleted: string;
  taskCompletionRate: string;
  taskPriority: string;
  taskCategory: string;
  taskDueDate: string;
  taskUrgent: string;
  taskHigh: string;
  taskMedium: string;
  taskLow: string;
  taskAddTitle: string;
  taskEditTitle: string;

  // Finance
  searchFinancePlaceholder: string;
  financeTotalIncome: string;
  financeTotalExpense: string;
  financeNetBalance: string;
  financeSavingsRate: string;
  financeAddTransaction: string;
  financeIncome: string;
  financeExpense: string;
  financeCategory: string;
  financeAmount: string;
  financeDate: string;
  financeDescription: string;
  currencySAR: string;

  // Settings
  settingsTitle: string;
  settingsSubtitle: string;
  dbCardTitle: string;
  dbCardStatus: string;
  dbCardDesc: string;
  backupCardTitle: string;
  backupCardSubtitle: string;
  backupCardDesc: string;
  exportBackupBtn: string;
  restoreBackupBtn: string;
  appearanceTitle: string;
  appearanceSubtitle: string;
  appearanceDesc: string;
  lightMode: string;
  darkMode: string;
  languageTitle: string;
  languageSubtitle: string;
  languageDesc: string;
  languageArabic: string;
  languageEnglish: string;
  securityTitle: string;
  securitySubtitle: string;
  securityDesc: string;
  updatesTitle: string;
  updatesSubtitle: string;
  currentVersion: string;
  latestVersion: string;
  checkForUpdates: string;
  autoCheckUpdates: string;
  updateStatus: string;
  updateAvailable: string;
  noUpdateAvailable: string;
  downloadNow: string;
  downloadProgress: string;
  releaseNotes: string;
  lastChecked: string;
  installRestart: string;
  openRelease: string;
  portableUpdateNote: string;
  updateChecking: string;
  updateError: string;
  updateTrustNote: string;

  viewUpdate: string;
  dismissUpdate: string;

  // Trash
  trashTitle: string;
  trashSubtitle: string;
  trashEmptyMsg: string;
  emptyTrashBtn: string;
  restoreAllBtn: string;

  // Modal Specific
  taskTitleLabel: string;
  taskTitlePlaceholder: string;
  taskDescLabel: string;
  taskDescPlaceholder: string;
  taskSaveBtn: string;
  taskSaving: string;
  financeEditTitle: string;
  financeAddTitle: string;
  financeDescLabel: string;
  financeDescPlaceholderIncome: string;
  financeDescPlaceholderExpense: string;
  financeAmountLabel: string;
  financeSubtext: string;
  financeNotesLabel: string;
  financeNotesPlaceholder: string;
  financeSaveIncome: string;
  financeSaveExpense: string;
  financeSaveEdit: string;
  financeSaving: string;

  // Shortcuts
  shortcutsTitle: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  ar: {
    appName: 'مُدَوَّن',
    appTagline: 'تطبيق التدوين والإنتاجية وإدارة المهام والمالية',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    create: 'إنشاء',
    search: 'بحث...',
    filter: 'تصفية',
    all: 'الكل',
    actions: 'الإجراءات',
    close: 'إغلاق',
    back: 'رجوع',
    loading: 'جاري التحميل...',
    success: 'تمت العملية بنجاح',
    error: 'حدث خطأ ما',
    confirm: 'تأكيد',
    warning: 'تنبيه',
    empty: 'لا توجد بيانات',
    pinned: 'المثبتة',
    unpin: 'إلغاء التثبيت',
    pin: 'تثبيت الملاحظة',
    restore: 'استعادة',
    permanentDelete: 'حذف نهائي',

    navNotes: 'الملاحظات',
    navTasks: 'المهام',
    navFinance: 'الإدارة المالية',
    navTrash: 'سلة المهملات',
    navSettings: 'الإعدادات والنسخ',
    navShortcuts: 'اختصارات لوحة المفاتيح',
    newNote: 'ملاحظة جديدة',
    newTask: 'مهمة جديدة',
    newTransaction: 'معاملة جديدة',
    newFolder: 'مجلد جديد',
    allNotes: 'جميع الملاحظات',
    favorites: 'المفضلة والمثبتة',
    folders: 'المجلدات والتصنيفات',
    collapseSidebar: 'طي القائمة الجانبية',
    expandSidebar: 'إظهار القائمة الجانبية',

    searchNotesPlaceholder: 'ابحث في العناوين والمحتوى...',
    noNotesFound: 'لا توجد ملاحظات مطابقة',
    selectNoteToRead: 'اختر ملاحظة من القائمة للبدء أو أنشئ ملاحظة جديدة',
    untitledNote: 'ملاحظة بدون عنوان',
    noteContentPlaceholder: 'اكتب هنا بحرية، أو اكتب / لإدراج عناصر ومكعبات جديدة...',
    folderLabel: 'المجلد',
    noFolder: 'بدون مجلد',
    wordsCount: 'كلمة',
    charsCount: 'حرف',
    lastUpdated: 'آخر تعديل',
    exportMarkdown: 'تصدير كـ Markdown',
    exportHtml: 'تصدير كـ HTML',
    templates: 'القوالب الجاهزة',
    chooseTemplate: 'إدراج قالب جاهز',
    templateMeeting: 'اجتماع عمل',
    templateMeetingDesc: 'أجندة، حضور، قرارات، ومهام تنفيذية',
    templateProject: 'خطة مشروع',
    templateProjectDesc: 'الأهداف، المراحل، ونطاق العمل',
    templateJournal: 'يوميات ومراجعة',
    templateJournalDesc: 'إنجازات اليوم، التحديات، وخطة الغد',
    templateBudget: 'ميزانية مالية',
    templateBudgetDesc: 'جدول الدخل، المصروفات، وأهداف الادخار',
    slashHint: 'اكتب / لإدراج مكعبات',
    blockText: 'نص عادي',
    blockH1: 'عنوان رئيسي H1',
    blockH2: 'عنوان فرعي H2',
    blockH3: 'عنوان قسم H3',
    blockBullet: 'قائمة نقطية',
    blockNumber: 'قائمة مرقمة',
    blockTodo: 'قائمة مهام تفاعلية',
    blockQuote: 'اقتباس مميز',
    blockCode: 'كتلة كود برمجية',
    blockCallout: 'صندوق تنبيه ولفت انتباه',
    blockDivider: 'خط فاصل أفقي',
    blockTable: 'جدول بيانات',
    subPages: 'صفحات فرعية مرتبطة',
    addSubPage: 'إضافة صفحة فرعية',
    internalLinks: 'روابط داخلية بين الصفحات',
    linkToPage: 'ربط بصفحة أخرى',

    searchTasksPlaceholder: 'بحث في المهام...',
    taskListView: 'قائمة المهام',
    taskKanbanView: 'لوحة كانبان (Kanban)',
    taskCalendarView: 'عرض التقويم (Calendar)',
    taskTodoCol: 'قيد الانتظار',
    taskInProgressCol: 'قيد التنفيذ',
    taskDoneCol: 'مكتملة',
    taskTotal: 'إجمالي المهام',
    taskPending: 'المتبقية',
    taskCompleted: 'المكتملة',
    taskCompletionRate: 'نسبة الإنجاز',
    taskPriority: 'الأولوية',
    taskCategory: 'التصنيف',
    taskDueDate: 'تاريخ الاستحقاق',
    taskUrgent: 'عاجل جداً',
    taskHigh: 'مرتفعة',
    taskMedium: 'متوسطة',
    taskLow: 'منخفضة',
    taskAddTitle: 'إضافة مهمة جديدة',
    taskEditTitle: 'تعديل المهمة',

    searchFinancePlaceholder: 'بحث في المعاملات...',
    financeTotalIncome: 'إجمالي الدخل',
    financeTotalExpense: 'إجمالي المصروفات',
    financeNetBalance: 'الرصيد الصافي',
    financeSavingsRate: 'معدل الادخار',
    financeAddTransaction: 'إضافة معاملة جديدة',
    financeIncome: 'دخل وارد',
    financeExpense: 'مصروف خارج',
    financeCategory: 'التصنيف',
    financeAmount: 'المبلغ',
    financeDate: 'التاريخ',
    financeDescription: 'البيان والتفاصيل',
    currencySAR: 'ر.س',

    settingsTitle: 'النسخ الاحتياطي وإدارة البيانات',
    settingsSubtitle: 'بياناتك ملكك ومخزنة محلياً بالكامل على جهازك دون أي اتصال بخوادم خارجية',
    dbCardTitle: 'قاعدة بيانات SQLite المحلية',
    dbCardStatus: 'متصلة ونشطة 100%',
    dbCardDesc: 'تُحفظ جميع السجلات تلقائياً في ملف قاعدة بيانات SQLite معزول في مسار بيانات المستخدم (AppData) بنظام Windows، مما يضمن بقاء بياناتك بالكامل حتى عند تحديث التطبيق.',
    backupCardTitle: 'النسخ الاحتياطي والاستعادة',
    backupCardSubtitle: 'تصدير واستيراد بصيغة JSON آمنة',
    backupCardDesc: 'يمكنك حفظ نسخة احتياطية من جميع ملاحظاتك ومهامك وسجلاتك المالية في ملف محلي أو نقلها إلى جهاز آخر في أي وقت.',
    exportBackupBtn: 'تصدير نسخة احتياطية',
    restoreBackupBtn: 'استعادة نسخة',
    appearanceTitle: 'المظهر والعرض',
    appearanceSubtitle: 'تخصيص نمط الواجهة',
    appearanceDesc: 'اختر النمط المريح لعينيك أثناء العمل والتدوين:',
    lightMode: 'الوضع النهاري (فاتح)',
    darkMode: 'الوضع الليلي (داكن)',
    languageTitle: 'لغة الواجهة والاتجاه',
    languageSubtitle: 'تبديل فوري بين العربية والإنجليزية',
    languageDesc: 'اختر اللغة المناسبة مع دعم تلقائي للاتجاه (RTL / LTR) لجميع الشاشات دون الحاجة لإعادة التشغيل:',
    languageArabic: 'العربية (RTL)',
    languageEnglish: 'English (LTR)',
    securityTitle: 'الخصوصية والعمل دون إنترنت',
    securitySubtitle: 'آمن ومحلي 100%',
    securityDesc: 'تطبيق مُدَوَّن مبني ليعمل دون أي اتصال بخوادم سحابية خارجية. جميع ملاحظاتك ومهامك وحساباتك المالية لا تغادر جهازك أبداً.',

    updatesTitle: 'التحديثات', updatesSubtitle: 'تحقق من الإصدارات الجديدة وتحكم في تنزيلها',
    currentVersion: 'الإصدار الحالي', latestVersion: 'أحدث إصدار متاح', checkForUpdates: 'التحقق من وجود تحديثات',
    autoCheckUpdates: 'التحقق تلقائيًا من التحديثات', updateStatus: 'حالة التحديث', updateAvailable: 'يتوفر إصدار جديد',
    noUpdateAvailable: 'لديك أحدث إصدار مستقر', downloadNow: 'تنزيل الآن', downloadProgress: 'تقدم التنزيل',
    releaseNotes: 'ملاحظات الإصدار', lastChecked: 'آخر تحقق', installRestart: 'التثبيت وإعادة التشغيل',
    openRelease: 'فتح صفحة الإصدار', portableUpdateNote: 'النسخة المحمولة تعرض التحديثات وتفتح صفحة تنزيلها؛ يلزم استبدال الملف يدويًا.',
    updateChecking: 'جارٍ التحقق من التحديثات…', updateError: 'تعذر إكمال التحديث',
    updateTrustNote: 'تُنزل التحديثات من إصدارات GitHub الرسمية. يتطلب التنزيل التلقائي ناشرًا موثقًا. قد يعرض Windows تحذير SmartScreen، ولن يُثبّت أي تحديث دون موافقتك.',

    viewUpdate: 'عرض التحديث', dismissUpdate: 'إخفاء إشعار التحديث',
    trashTitle: 'سلة المهملات',
    trashSubtitle: 'الملاحظات المحذوفة مؤقتاً',
    trashEmptyMsg: 'سلة المهملات فارغة',
    emptyTrashBtn: 'إفراغ السلة نهائياً',
    restoreAllBtn: 'استعادة الكل',

    // Modal Specific
    taskTitleLabel: 'عنوان المهمة *',
    taskTitlePlaceholder: 'مثال: إكمال تقرير المشروع الفصلي...',
    taskDescLabel: 'تفاصيل إضافية (اختياري)',
    taskDescPlaceholder: 'اكتب ملاحظات أو خطوات إضافية للمهمة...',
    taskSaveBtn: 'إنشاء المهمة',
    taskSaving: 'جاري الحفظ...',
    financeEditTitle: 'تعديل المعاملة المالية',
    financeAddTitle: 'تسجيل معاملة مالية جديدة',
    financeDescLabel: 'وصف المعاملة *',
    financeDescPlaceholderIncome: 'مثال: راتب شهري، دفعة عمل حر...',
    financeDescPlaceholderExpense: 'مثال: مشتريات البقالة، إيجار...',
    financeAmountLabel: 'المبلغ (ر.س) *',
    financeSubtext: 'الحسابات مخزنة بوحدات الهللة لتجنب أخطاء الفاصلة العائمة',
    financeNotesLabel: 'ملاحظات إضافية (اختياري)',
    financeNotesPlaceholder: 'اكتب ملاحظات حول الفاتورة أو طريقة الدفع...',
    financeSaveIncome: 'تسجيل الدخل',
    financeSaveExpense: 'تسجيل المصروف',
    financeSaveEdit: 'حفظ التعديلات',
    financeSaving: 'جاري الحفظ...',

    shortcutsTitle: 'اختصارات لوحة المفاتيح',
  },
  en: {
    appName: 'Modawwan',
    appTagline: 'Productivity, Notes, Tasks & Finance Desktop Workspace',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search...',
    filter: 'Filter',
    all: 'All',
    actions: 'Actions',
    close: 'Close',
    back: 'Back',
    loading: 'Loading...',
    success: 'Operation completed successfully',
    error: 'An error occurred',
    confirm: 'Confirm',
    warning: 'Warning',
    empty: 'No data available',
    pinned: 'Pinned',
    unpin: 'Unpin note',
    pin: 'Pin note',
    restore: 'Restore',
    permanentDelete: 'Delete permanently',

    navNotes: 'Notes',
    navTasks: 'Tasks',
    navFinance: 'Finance',
    navTrash: 'Trash',
    navSettings: 'Settings & Backup',
    navShortcuts: 'Keyboard Shortcuts',
    newNote: 'New Note',
    newTask: 'New Task',
    newTransaction: 'New Transaction',
    newFolder: 'New Folder',
    allNotes: 'All Notes',
    favorites: 'Favorites & Pinned',
    folders: 'Folders & Categories',
    collapseSidebar: 'Collapse Sidebar',
    expandSidebar: 'Expand Sidebar',

    searchNotesPlaceholder: 'Search titles and content...',
    noNotesFound: 'No matching notes found',
    selectNoteToRead: 'Select a note from the list or create a new one',
    untitledNote: 'Untitled Note',
    noteContentPlaceholder: 'Write freely, or type / to insert blocks and templates...',
    folderLabel: 'Folder',
    noFolder: 'No folder',
    wordsCount: 'words',
    charsCount: 'chars',
    lastUpdated: 'Updated',
    exportMarkdown: 'Export as Markdown',
    exportHtml: 'Export as HTML',
    templates: 'Templates',
    chooseTemplate: 'Insert Template',
    templateMeeting: 'Meeting Notes',
    templateMeetingDesc: 'Agenda, attendees, decisions, and action items',
    templateProject: 'Project Plan',
    templateProjectDesc: 'Goals, milestones, and scope of work',
    templateJournal: 'Daily Journal',
    templateJournalDesc: 'Today wins, challenges, and plan for tomorrow',
    templateBudget: 'Weekly Budget',
    templateBudgetDesc: 'Income, expenses, and savings targets',
    slashHint: 'Type / for commands',
    blockText: 'Plain Text',
    blockH1: 'Heading 1',
    blockH2: 'Heading 2',
    blockH3: 'Heading 3',
    blockBullet: 'Bulleted List',
    blockNumber: 'Numbered List',
    blockTodo: 'To-do Checklist',
    blockQuote: 'Blockquote',
    blockCode: 'Code Block',
    blockCallout: 'Callout Box',
    blockDivider: 'Divider',
    blockTable: 'Table',
    subPages: 'Linked Sub-pages',
    addSubPage: 'Add Sub-page',
    internalLinks: 'Internal Page Links',
    linkToPage: 'Link to another page',

    searchTasksPlaceholder: 'Search tasks...',
    taskListView: 'List View',
    taskKanbanView: 'Kanban Board',
    taskCalendarView: 'Calendar View',
    taskTodoCol: 'To Do',
    taskInProgressCol: 'In Progress',
    taskDoneCol: 'Completed',
    taskTotal: 'Total Tasks',
    taskPending: 'Pending',
    taskCompleted: 'Completed',
    taskCompletionRate: 'Completion Rate',
    taskPriority: 'Priority',
    taskCategory: 'Category',
    taskDueDate: 'Due Date',
    taskUrgent: 'Urgent',
    taskHigh: 'High',
    taskMedium: 'Medium',
    taskLow: 'Low',
    taskAddTitle: 'Add New Task',
    taskEditTitle: 'Edit Task',

    searchFinancePlaceholder: 'Search transactions...',
    financeTotalIncome: 'Total Income',
    financeTotalExpense: 'Total Expenses',
    financeNetBalance: 'Net Balance',
    financeSavingsRate: 'Savings Rate',
    financeAddTransaction: 'Add Transaction',
    financeIncome: 'Income',
    financeExpense: 'Expense',
    financeCategory: 'Category',
    financeAmount: 'Amount',
    financeDate: 'Date',
    financeDescription: 'Description & Notes',
    currencySAR: 'SAR',

    settingsTitle: 'Backup & Data Management',
    settingsSubtitle: 'Your data is 100% locally stored on your machine without external cloud dependencies',
    dbCardTitle: 'Local SQLite Database',
    dbCardStatus: 'Connected & Active 100%',
    dbCardDesc: 'All records are saved automatically in an isolated SQLite database file inside Windows AppData, ensuring your data persists across app updates.',
    backupCardTitle: 'Backup & Restore',
    backupCardSubtitle: 'Safe JSON Export & Import',
    backupCardDesc: 'Save a backup copy of all your notes, tasks, and finance records to a local file or move it to another computer anytime.',
    exportBackupBtn: 'Export Backup',
    restoreBackupBtn: 'Restore Backup',
    appearanceTitle: 'Appearance & Display',
    appearanceSubtitle: 'Customize Workspace Theme',
    appearanceDesc: 'Choose your comfortable theme for reading and writing:',
    lightMode: 'Day Mode (Light)',
    darkMode: 'Night Mode (Dark)',
    languageTitle: 'Language & Direction',
    languageSubtitle: 'Instant toggle between Arabic & English',
    languageDesc: 'Select your preferred language with automatic RTL/LTR direction switching across all views without requiring app restart:',
    languageArabic: 'العربية (RTL)',
    languageEnglish: 'English (LTR)',
    securityTitle: 'Privacy & Offline Work',
    securitySubtitle: '100% Safe & Private',
    securityDesc: 'Modawwan is built to operate without connecting to external cloud servers. All your notes, tasks, and financials never leave your machine.',


    updatesTitle: 'Updates', updatesSubtitle: 'Check for new versions and control downloads',
    currentVersion: 'Current version', latestVersion: 'Latest available version', checkForUpdates: 'Check for updates',
    autoCheckUpdates: 'Automatically check for updates', updateStatus: 'Update status', updateAvailable: 'A new version is available',
    noUpdateAvailable: 'You are up to date', downloadNow: 'Download now', downloadProgress: 'Download progress',
    releaseNotes: 'Release notes', lastChecked: 'Last checked', installRestart: 'Install & Restart',
    openRelease: 'Open release page', portableUpdateNote: 'Portable builds show updates and open the download page; replace the executable manually.',
    updateChecking: 'Checking for updates…', updateError: 'Could not complete the update',
    updateTrustNote: 'Updates come from official GitHub Releases. Automatic downloads require a trusted signing publisher. Windows may show a SmartScreen warning, and updates are never installed without your approval.',
    viewUpdate: 'View update', dismissUpdate: 'Dismiss update notice',
    trashTitle: 'Trash',
    trashSubtitle: 'Temporarily deleted notes',
    trashEmptyMsg: 'Trash is empty',
    emptyTrashBtn: 'Empty Trash Permanently',
    restoreAllBtn: 'Restore All',

    // Modal Specific
    taskTitleLabel: 'Task Title *',
    taskTitlePlaceholder: 'e.g. Complete quarterly project report...',
    taskDescLabel: 'Additional Details (optional)',
    taskDescPlaceholder: 'Write notes or execution steps...',
    taskSaveBtn: 'Create Task',
    taskSaving: 'Saving...',
    financeEditTitle: 'Edit Financial Transaction',
    financeAddTitle: 'Record New Transaction',
    financeDescLabel: 'Description *',
    financeDescPlaceholderIncome: 'e.g. Monthly salary, freelance payment...',
    financeDescPlaceholderExpense: 'e.g. Groceries, rent, subscription...',
    financeAmountLabel: 'Amount (SAR) *',
    financeSubtext: 'Calculations stored in cents to prevent floating point inaccuracies',
    financeNotesLabel: 'Additional Notes (optional)',
    financeNotesPlaceholder: 'Invoice details, payment method, etc...',
    financeSaveIncome: 'Record Income',
    financeSaveExpense: 'Record Expense',
    financeSaveEdit: 'Save Changes',
    financeSaving: 'Saving...',

    shortcutsTitle: 'Keyboard Shortcuts',
  },
};
