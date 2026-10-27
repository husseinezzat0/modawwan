export interface TemplateItem {
  id: string;
  titleKey: 'templateMeeting' | 'templateProject' | 'templateJournal' | 'templateBudget';
  descKey: 'templateMeetingDesc' | 'templateProjectDesc' | 'templateJournalDesc' | 'templateBudgetDesc';
  icon: string;
  getHtml: (lang: 'ar' | 'en') => string;
}

export const NOTION_TEMPLATES: TemplateItem[] = [
  {
    id: 'meeting',
    titleKey: 'templateMeeting',
    descKey: 'templateMeetingDesc',
    icon: 'note',
    getHtml: (lang) => {
      if (lang === 'ar') {
        return `
<h2>📋 محضر اجتماع عمل</h2>
<div style="background:var(--color-primary-light);border-right:4px solid var(--color-primary);padding:10px 14px;border-radius:6px;margin:12px 0;">
  <strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')} | <strong>المنسق:</strong> الإدارة | <strong>الهدف:</strong> مراجعة خطة العمل الأسبوعية
</div>
<h3>👥 الحضور</h3>
<ul>
  <li>عضو الفريق 1 (مدير المشروع)</li>
  <li>عضو الفريق 2 (مطور الواجهات)</li>
  <li>عضو الفريق 3 (مسؤول الجودة)</li>
</ul>
<h3>🎯 جدول الأعمال</h3>
<ol>
  <li>مراجعة مخرجات المرحلة السابقة</li>
  <li>تحديد الأولويات والمواعيد النهائية</li>
  <li>مناقشة التحديات والحلول التقنية</li>
</ol>
<h3>✅ القرارات والمهام التنفيذية</h3>
<div style="display:flex;align-items:center;gap:8px;margin:6px 0;"><input type="checkbox" /> <span>إكمال اختبارات النشر والتأكد من توافق الواجهات</span></div>
<div style="display:flex;align-items:center;gap:8px;margin:6px 0;"><input type="checkbox" /> <span>تحديث التوثيق الفني ومشاركة النسخة التجريبية</span></div>
<p><br></p>
`;
      }
      return `
<h2>📋 Business Meeting Notes</h2>
<div style="background:var(--color-primary-light);border-left:4px solid var(--color-primary);padding:10px 14px;border-radius:6px;margin:12px 0;">
  <strong>Date:</strong> ${new Date().toLocaleDateString('en-US')} | <strong>Facilitator:</strong> Management | <strong>Goal:</strong> Weekly sprint alignment
</div>
<h3>👥 Attendees</h3>
<ul>
  <li>Team Member 1 (Project Lead)</li>
  <li>Team Member 2 (UI Engineer)</li>
  <li>Team Member 3 (QA Lead)</li>
</ul>
<h3>🎯 Agenda</h3>
<ol>
  <li>Review milestones and previous action items</li>
  <li>Set immediate deliverables and deadlines</li>
  <li>Discuss technical hurdles and solutions</li>
</ol>
<h3>✅ Action Items</h3>
<div style="display:flex;align-items:center;gap:8px;margin:6px 0;"><input type="checkbox" /> <span>Finalize packaging and visual regression testing</span></div>
<div style="display:flex;align-items:center;gap:8px;margin:6px 0;"><input type="checkbox" /> <span>Prepare release documentation and user guide</span></div>
<p><br></p>
`;
    },
  },
  {
    id: 'project',
    titleKey: 'templateProject',
    descKey: 'templateProjectDesc',
    icon: 'task',
    getHtml: (lang) => {
      if (lang === 'ar') {
        return `
<h2>🚀 ميثاق وخطة المشروع</h2>
<p><strong>اسم المشروع:</strong> تطوير منصة الإنتاجية المتكاملة</p>
<div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:8px;padding:14px;margin:12px 0;">
  <h4 style="margin-top:0;">🎯 الأهداف الرئيسية</h4>
  <ul>
    <li>بناء واجهة مستخدم فائقة الجمال متوافقة مع معايير macOS وWindows</li>
    <li>توفير قاعدة بيانات محلية آمنة بنسبة 100% دون خوادم وسيطة</li>
    <li>دعم كامل ومتقن للغتين العربية والإنجليزية مع توجيه RTL/LTR</li>
  </ul>
</div>
<h3>📊 جدول المراحل الزمنية (Milestones)</h3>
<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
  <thead>
    <tr style="background:var(--bg-input);">
      <th style="border:1px solid var(--border-subtle);padding:8px;text-align:right;">المرحلة</th>
      <th style="border:1px solid var(--border-subtle);padding:8px;text-align:right;">المخرج المطلوب</th>
      <th style="border:1px solid var(--border-subtle);padding:8px;text-align:right;">الحالة</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid var(--border-subtle);padding:8px;">1. التأسيس وتوحيد الأيقونات</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;">مكتبة كود المنصات وتوحيد القوائم</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;color:var(--color-success);">مكتملة ✅</td>
    </tr>
    <tr>
      <td style="border:1px solid var(--border-subtle);padding:8px;">2. نظام اللغات والتدوين المتقدم</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;">i18n + Slash Commands + كانبان</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;color:var(--color-primary);">قيد التنفيذ 🚀</td>
    </tr>
  </tbody>
</table>
<p><br></p>
`;
      }
      return `
<h2>🚀 Project Scope & Roadmap</h2>
<p><strong>Project Name:</strong> Modern Desktop Productivity Workspace</p>
<div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:8px;padding:14px;margin:12px 0;">
  <h4 style="margin-top:0;">🎯 Primary Objectives</h4>
  <ul>
    <li>Deliver a pixel-perfect macOS & Windows desktop experience</li>
    <li>Guarantee 100% local-first data privacy on SQLite</li>
    <li>Provide comprehensive bilingual support (Arabic & English with seamless RTL/LTR)</li>
  </ul>
</div>
<h3>📊 Milestones Table</h3>
<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
  <thead>
    <tr style="background:var(--bg-input);">
      <th style="border:1px solid var(--border-subtle);padding:8px;text-align:left;">Milestone</th>
      <th style="border:1px solid var(--border-subtle);padding:8px;text-align:left;">Deliverable</th>
      <th style="border:1px solid var(--border-subtle);padding:8px;text-align:left;">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid var(--border-subtle);padding:8px;">1. Core Architecture & Icons</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;">Interface icons & dropdown alignment</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;color:var(--color-success);">Done ✅</td>
    </tr>
    <tr>
      <td style="border:1px solid var(--border-subtle);padding:8px;">2. Bilingual & Notion Engine</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;">i18n + Slash commands + Kanban</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;color:var(--color-primary);">Active 🚀</td>
    </tr>
  </tbody>
</table>
<p><br></p>
`;
    },
  },
  {
    id: 'journal',
    titleKey: 'templateJournal',
    descKey: 'templateJournalDesc',
    icon: 'star',
    getHtml: (lang) => {
      if (lang === 'ar') {
        return `
<h2>📔 يوميات ومراجعة الإنجاز اليومي</h2>
<p><em>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</em></p>
<div style="background:var(--color-warning-bg);border-right:4px solid var(--color-warning);padding:10px 14px;border-radius:6px;margin:12px 0;">
  🌟 <strong>حكمة اليوم:</strong> «الاستمرارية والانضباط يصنعان الفارق دائماً».
</div>
<h3>🏆 أهم 3 إنجازات تحققت اليوم:</h3>
<ol>
  <li>إنجاز أولوية العمل رقم 1 بتركيز عالٍ</li>
  <li>ممارسة النشاط البدني لمدة 30 دقيقة</li>
  <li>قراءة 15 صفحة من كتاب في تطوير الذات</li>
</ol>
<h3>💡 التحديات والدروس المستفادة:</h3>
<ul>
  <li>كيفية إدارة الوقت بكفاءة وتجنب المشتتات الرقمية</li>
</ul>
<h3>🎯 أهم خطط الغد:</h3>
<div style="display:flex;align-items:center;gap:8px;margin:6px 0;"><input type="checkbox" /> <span>بدء المهمة الصباحية مبكراً</span></div>
<p><br></p>
`;
      }
      return `
<h2>📔 Daily Reflection & Journal</h2>
<p><em>Date: ${new Date().toLocaleDateString('en-US')}</em></p>
<div style="background:var(--color-warning-bg);border-left:4px solid var(--color-warning);padding:10px 14px;border-radius:6px;margin:12px 0;">
  🌟 <strong>Quote of the Day:</strong> "Consistency and focus compound into extraordinary results."
</div>
<h3>🏆 Top 3 Wins of the Day:</h3>
<ol>
  <li>Completed key milestone with high precision</li>
  <li>30 minutes of physical workout</li>
  <li>Read 15 pages of personal development</li>
</ol>
<h3>💡 Lessons Learned:</h3>
<ul>
  <li>Managing high-leverage priorities and reducing screen distractions</li>
</ul>
<h3>🎯 Focus for Tomorrow:</h3>
<div style="display:flex;align-items:center;gap:8px;margin:6px 0;"><input type="checkbox" /> <span>Tackle top project goal in the morning</span></div>
<p><br></p>
`;
    },
  },
  {
    id: 'budget',
    titleKey: 'templateBudget',
    descKey: 'templateBudgetDesc',
    icon: 'wallet',
    getHtml: (lang) => {
      if (lang === 'ar') {
        return `
<h2>💰 الميزانية والتخطيط المالي</h2>
<div style="background:var(--color-success-bg);border-right:4px solid var(--color-success);padding:10px 14px;border-radius:6px;margin:12px 0;">
  🎯 <strong>الهدف الشهري:</strong> الحفاظ على معدل ادخار لا يقل عن 25% من إجمالي الدخل.
</div>
<h3>💵 توزيع الدخل والمصروفات</h3>
<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
  <thead>
    <tr style="background:var(--bg-input);">
      <th style="border:1px solid var(--border-subtle);padding:8px;text-align:right;">البند والتصنيف</th>
      <th style="border:1px solid var(--border-subtle);padding:8px;text-align:right;">المبلغ المقدر</th>
      <th style="border:1px solid var(--border-subtle);padding:8px;text-align:right;">المبلغ الفعلي</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid var(--border-subtle);padding:8px;">الدخل الشهري (راتب / أعمال)</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;">15,000 ر.س</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;color:var(--color-success);font-weight:700;">15,000 ر.س</td>
    </tr>
    <tr>
      <td style="border:1px solid var(--border-subtle);padding:8px;">الالتزامات الأساسية (سكن / فواتير)</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;">4,500 ر.س</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;">4,300 ر.س</td>
    </tr>
    <tr>
      <td style="border:1px solid var(--border-subtle);padding:8px;">الادخار والاستثمار</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;">3,750 ر.س</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;color:var(--color-primary);font-weight:700;">4,000 ر.س</td>
    </tr>
  </tbody>
</table>
<p><br></p>
`;
      }
      return `
<h2>💰 Budget & Financial Planning</h2>
<div style="background:var(--color-success-bg);border-left:4px solid var(--color-success);padding:10px 14px;border-radius:6px;margin:12px 0;">
  🎯 <strong>Monthly Target:</strong> Maintain a minimum 25% net savings rate.
</div>
<h3>💵 Income & Expense Allocation</h3>
<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
  <thead>
    <tr style="background:var(--bg-input);">
      <th style="border:1px solid var(--border-subtle);padding:8px;text-align:left;">Category</th>
      <th style="border:1px solid var(--border-subtle);padding:8px;text-align:left;">Budgeted</th>
      <th style="border:1px solid var(--border-subtle);padding:8px;text-align:left;">Actual</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid var(--border-subtle);padding:8px;">Primary Income / Salary</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;">15,000 SAR</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;color:var(--color-success);font-weight:700;">15,000 SAR</td>
    </tr>
    <tr>
      <td style="border:1px solid var(--border-subtle);padding:8px;">Fixed Expenses (Housing / Bills)</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;">4,500 SAR</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;">4,300 SAR</td>
    </tr>
    <tr>
      <td style="border:1px solid var(--border-subtle);padding:8px;">Savings & Investments</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;">3,750 SAR</td>
      <td style="border:1px solid var(--border-subtle);padding:8px;color:var(--color-primary);font-weight:700;">4,000 SAR</td>
    </tr>
  </tbody>
</table>
<p><br></p>
`;
    },
  },
];
