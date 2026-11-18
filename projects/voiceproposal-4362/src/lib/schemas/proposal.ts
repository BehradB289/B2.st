import { z } from "zod";

/**
 * ارزهای پشتیبانی شده در پروپوزال‌ها
 */
export const CurrencyEnum = z.enum(["IRT", "IRR", "USD", "EUR"]);
export type Currency = z.infer<typeof CurrencyEnum>;

/**
 * اسکیمای واحد برای هر بند از اقلام خدمات و شرح وظایف (Deliverables / Scope Items)
 */
export const DeliverableItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  title: z.string().min(2, "عنوان خدمت باید حداقل ۲ کاراکتر باشد"),
  description: z.string().min(5, "توضیحات خدمت باید شفاف و حداقل ۵ کاراکتر باشد"),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().nonnegative("مبلغ واحد نمی‌تواند منفی باشد"),
  totalPrice: z.number().nonnegative("مبلغ کل نمی‌تواند منفی باشد"),
  category: z.string().default("عمومی"),
});
export type DeliverableItem = z.infer<typeof DeliverableItemSchema>;

/**
 * اسکیمای فازبندی زمانی و مایل‌استون‌های پروژه (Milestones & Phases)
 */
export const ProjectPhaseSchema = z.object({
  phaseNumber: z.number().int().positive("شماره فاز باید عدد مثبت باشد"),
  name: z.string().min(2, "نام فاز پروژه الزامی است"),
  description: z.string().optional(),
  durationDays: z.number().int().positive("مدت زمان فاز باید حداقل ۱ روز باشد"),
  deliverables: z.array(z.string()).min(1, "هر فاز باید حداقل دارای یک خروجی مشخص باشد"),
  paymentPercentage: z.number().min(0).max(100, "درصد پرداخت فاز باید بین ۰ تا ۱۰۰ باشد"),
  paymentAmount: z.number().nonnegative("مبلغ مرحله نمی‌تواند منفی باشد"),
});
export type ProjectPhase = z.infer<typeof ProjectPhaseSchema>;

/**
 * اسکیمای محاسبات مالی، پیش‌پرداخت، تخفیف و اقساط
 */
export const FinancialSummarySchema = z.object({
  currency: CurrencyEnum.default("IRT"),
  subtotal: z.number().nonnegative("مجموع ناخالص نباید منفی باشد"),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  totalAmount: z.number().positive("مبلغ کل قرارداد باید بزرگتر از صفر باشد"),
  upfrontPercentage: z.number().min(0).max(100, "درصد پیش‌پرداخت باید بین ۰ تا ۱۰۰ باشد"),
  upfrontAmount: z.number().nonnegative("مبلغ پیش‌پرداخت نباید منفی باشد"),
  remainingAmount: z.number().nonnegative("مبلغ باقیمانده نباید منفی باشد"),
  paymentMethod: z.string().default("انتقال به شماره شبای رسمی مجری"),
});
export type FinancialSummary = z.infer<typeof FinancialSummarySchema>;

/**
 * شرایط حقوقی، فسخ قرارداد، فورس‌ماژور، بازبینی‌ها و مالکیت معنوی
 */
export const LegalTermsSchema = z.object({
  contractType: z.string().default("قرارداد پیمانکاری و فریلنسری توسعه نرم‌افزار و طراحی"),
  terminationClauses: z.array(z.string()).min(1, "حداقل یک بند برای شرایط فسخ الزامی است"),
  forceMajeureClause: z.string().min(10, "بند فورس‌ماژور الزامی و باید حقوقی باشد"),
  revisionPolicy: z.object({
    freeRevisionsCount: z.number().int().nonnegative().default(2),
    outOfScopeHourlyRate: z.number().nonnegative().optional(),
    terms: z.string().default("تغییرات اساسی فراتر از شرح خدمات مشمول توافق و فاکتور الحاقی جداگانه است."),
  }),
  intellectualPropertyClause: z.string().min(10, "بند مالکیت معنوی و انتقال سورس‌کد الزامی است"),
  confidentialityClause: z.string().min(10, "بند حفظ محرمانگی اطلاعات کارفرما الزامی است"),
  disputeResolution: z.string().default("در صورت بروز اختلاف، موضوع از طریق مذاکره مسالمت‌آمیز و در صورت لزوم داوری مرضی‌الطرفین حل‌وفصل خواهد شد."),
});
export type LegalTerms = z.infer<typeof LegalTermsSchema>;

/**
 * مشخصات هویتی طرفین قرارداد (کارفرما و مجری)
 */
export const PartyInfoSchema = z.object({
  name: z.string().min(2, "نام طرف قرارداد الزامی است"),
  company: z.string().optional(),
  title: z.string().optional(),
  contact: z.string().optional(),
  nationalIdOrRegNumber: z.string().optional(),
});
export type PartyInfo = z.infer<typeof PartyInfoSchema>;

/**
 * متادیتای پروپوزال و وضعیت زمان‌بندی
 */
export const ProposalMetadataSchema = z.object({
  proposalNumber: z.string().min(1),
  issueDate: z.string(), // ISO یا تقویم شمسی
  validityDays: z.number().int().positive().default(7),
  estimatedTotalDurationDays: z.number().int().positive(),
  estimatedStartDate: z.string().optional(),
  estimatedEndDate: z.string().optional(),
});
export type ProposalMetadata = z.infer<typeof ProposalMetadataSchema>;

/**
 * اسکیمای اصلی و نهایی ساختاریافته پروپوزال حقوقی-مالی VoiceProposal
 */
export const ProposalSchema = z.object({
  title: z.string().min(3, "عنوان پروژه الزامی است"),
  executiveSummary: z.string().min(15, "خلاصه اجرایی پروژه باید تشریح شود"),
  client: PartyInfoSchema,
  contractor: PartyInfoSchema.default({
    name: "استودیو B2.st",
    company: "B2 Studio",
    title: "توسعه‌دهنده ارشد و معمار نرم‌افزار",
  }),
  metadata: ProposalMetadataSchema,
  scopeOfWork: z.array(DeliverableItemSchema).min(1, "حداقل یک ردیف خدمت باید وجود داشته باشد"),
  phases: z.array(ProjectPhaseSchema).min(1, "حداقل یک فاز اجرایی الزامی است"),
  financials: FinancialSummarySchema,
  legalTerms: LegalTermsSchema,
  notes: z.string().optional(),
});

export type Proposal = z.infer<typeof ProposalSchema>;

/**
 * تابع اعتبارسنجی کمکی با تصحیح خودکار ریاضی مبالغ در صورت خطای اندک مدل هوش مصنوعی
 */
export function sanitizeAndValidateProposal(rawJson: unknown): { success: true; data: Proposal } | { success: false; errors: z.ZodError } {
  const parseResult = ProposalSchema.safeParse(rawJson);
  
  if (parseResult.success) {
    return { success: true, data: parseResult.data };
  }

  return { success: false, errors: parseResult.error };
}