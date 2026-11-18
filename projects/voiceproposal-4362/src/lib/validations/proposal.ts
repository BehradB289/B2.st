/**
 * VoiceProposal - استودیو B2.st
 * اسکیماهای اعتبارسنجی جامع حقوقی و مالی مبتنی بر Zod
 */
import { z } from 'zod';

export const CurrencySchema = z.enum(['TOMAN', 'IRR', 'USD', 'USDT']);
export type Currency = z.infer<typeof CurrencySchema>;

export const PartySchema = z.object({
  name: z.string().min(2, { message: 'نام طرف قرارداد حداقل باید ۲ کاراکتر باشد' }),
  company: z.string().optional().default('شخص حقیقی'),
  nationalIdOrRegNo: z.string().optional(),
  phone: z.string().regex(/^(\+98|0)?9\d{9}$/, {
    message: 'شماره تلفن همراه معتبر نمی‌باشد',
  }).optional().or(z.literal('')),
  email: z.string().email({ message: 'آدرس ایمیل معتبر نمی‌باشد' }).optional().or(z.literal('')),
  address: z.string().optional(),
});
export type Party = z.infer<typeof PartySchema>;

export const ProposalItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  title: z.string().min(2, { message: 'شرح ردیف خدمت الزامی است' }),
  description: z.string().optional().default(''),
  quantity: z.number().positive({ message: 'تعداد یا حجم کار باید مقداری مثبت باشد' }).default(1),
  unit: z.string().default('مورد'),
  unitPrice: z.number().nonnegative({ message: 'قیمت واحد نمی‌تواند منفی باشد' }),
  discount: z.number().nonnegative().default(0),
  totalPrice: z.number().nonnegative(),
}).refine(
  (data) => {
    const expected = Math.max(0, data.quantity * data.unitPrice - data.discount);
    return Math.abs(data.totalPrice - expected) < 1; // تطبیق محاسباتی با تلورانس اعشار
  },
  {
    message: 'مبلغ کل ردیف با حاصلضرب تعداد در قیمت واحد منهای تخفیف همخوانی ندارد',
    path: ['totalPrice'],
  }
);
export type ProposalItem = z.infer<typeof ProposalItemSchema>;

export const MilestoneSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  title: z.string().min(2, { message: 'عنوان فاز پروژه الزامی است' }),
  deliverables: z.array(z.string()).min(1, { message: 'حداقل یک مورد تحویلی برای فاز الزامی است' }),
  percentage: z.number().min(1).max(100, { message: 'درصد فاز باید بین ۱ تا ۱۰۰ باشد' }),
  amount: z.number().nonnegative(),
  durationDays: z.number().positive({ message: 'مدت زمان فاز باید حداقل یک روز باشد' }),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

export const LegalClausesSchema = z.object({
  confidentiality: z.string().default(
    'کلیه اطلاعات دریافتی از طرفین محرمانه تلقی شده و تا ۲ سال پس از اتمام پروژه غیرقابل افشا است.'
  ),
  ipRights: z.string().default(
    'مالکیت مادی و معنوی سورس‌کد و محتوای تولیدشده، پس از تسویه کامل حساب، منحصراً به کارفرما منتقل خواهد شد.'
  ),
  forceMajeure: z.string().default(
    'در شرایط فورس‌ماژور (قطع سراسری اینترنت، زلزله، جنگ و بحران‌های خارج از اراده طرفین)، تعهدات طرفین تا زمان رفع مانع به حالت تعلیق درمی‌آید.'
  ),
  disputeResolution: z.string().default(
    'در صورت بروز اختلاف، موضوع از طریق مذاکره و در صورت عدم توافق از طریق داوری نظام صنفی رایانه‌ای حل و فصل خواهد شد.'
  ),
  additionalNotes: z.string().optional(),
});
export type LegalClauses = z.infer<typeof LegalClausesSchema>;

export const ProposalSchema = z.object({
  proposalNumber: z.string().min(3),
  issueDate: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, { message: 'فرمت تاریخ صدور باید YYYY/MM/DD باشد' }),
  validityDays: z.number().int().positive().default(14),
  title: z.string().min(3, { message: 'عنوان پروژه یا پیش‌فاکتور الزامی است' }),
  summary: z.string().min(10, { message: 'خلاصه شرح خدمات باید حداقل ۱۰ کاراکتر باشد' }),
  currency: CurrencySchema.default('TOMAN'),

  freelancer: PartySchema,
  client: PartySchema,

  items: z.array(ProposalItemSchema).min(1, { message: 'حداقل یک ردیف در جدول مالی باید وجود داشته باشد' }),
  milestones: z.array(MilestoneSchema).min(1, { message: 'حداقل یک مایل‌استون پرداختی و اجرایی الزامی است' }),

  subtotalAmount: z.number().nonnegative(),
  taxPercentage: z.number().min(0).max(100).default(0),
  taxAmount: z.number().nonnegative().default(0),
  totalDiscount: z.number().nonnegative().default(0),
  finalTotalAmount: z.number().positive({ message: 'مبلغ نهایی پیش‌فاکتور باید بزرگتر از صفر باشد' }),

  legalClauses: LegalClausesSchema.default({}),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']).default('DRAFT'),
}).refine(
  (data) => {
    // اعتبارسنجی ۱: جمع اقلام جدول مالی با subtotalAmount
    const calculatedSubtotal = data.items.reduce((acc, item) => acc + item.totalPrice, 0);
    return Math.abs(calculatedSubtotal - data.subtotalAmount) < 1;
  },
  {
    message: 'جمع مبالغ اقلام با زیرمجموع مالی پیش‌فاکتور (subtotalAmount) همخوانی ندارد',
    path: ['subtotalAmount'],
  }
).refine(
  (data) => {
    // اعتبارسنجی ۲: راستی‌آزمایی جمع نهایی مالیات و تخفیف
    const expectedFinal = Math.max(0, data.subtotalAmount + data.taxAmount - data.totalDiscount);
    return Math.abs(expectedFinal - data.finalTotalAmount) < 1;
  },
  {
    message: 'مبلغ نهایی با فرمول (زیرمجموع + مالیات - تخفیف کل) تطابق ندارد',
    path: ['finalTotalAmount'],
  }
).refine(
  (data) => {
    // اعتبارسنجی ۳: مجموع درصدهای فازها دقیقاً ۱۰۰٪ باشد
    const totalPercentage = data.milestones.reduce((acc, m) => acc + m.percentage, 0);
    return Math.abs(totalPercentage - 100) < 0.1;
  },
  {
    message: 'مجموع درصدهای مایل‌استون‌های پروژه باید دقیقاً برابر با ۱۰۰ درصد باشد',
    path: ['milestones'],
  }
).refine(
  (data) => {
    // اعتبارسنجی ۴: مجموع مبالغ فازها با مبلغ کل تطابق داشته باشد
    const totalMilestonesAmount = data.milestones.reduce((acc, m) => acc + m.amount, 0);
    return Math.abs(totalMilestonesAmount - data.finalTotalAmount) < 1;
  },
  {
    message: 'مجموع مبالغ ریالی/ارزی مایل‌استون‌ها باید برابر با مبلغ نهایی کل باشد',
    path: ['milestones'],
  }
);

export type Proposal = z.infer<typeof ProposalSchema>;