import { describe, it, expect } from "vitest";
import { ProposalSchema, sanitizeAndValidateProposal } from "../src/lib/schemas/proposal";
import { calculateAudioBufferHash } from "../src/lib/supabase";

describe("VoiceProposal Pipeline & Schemas", () => {
  it("باید نمونه داده معتبر پروپوزال را بدون خطا با اسکیمای Zod اعتبارسنجی کند", () => {
    const validProposalData = {
      title: "طراحی و توسعه پلتفرم هوشمند فروشگاهی B2",
      executiveSummary: "پیاده‌سازی فروشگاه آنلاین با Next.js 14 و اتصال به درگاه پرداخت و پنل مدیریت سفارشات فریلنسری.",
      client: {
        name: "شرکت سپهر پردازش",
        company: "سپهر سیستم",
        contact: "09123456789",
      },
      contractor: {
        name: "استودیو B2.st",
        company: "B2 Studio",
        title: "معمار ارشد نرم‌افزار",
      },
      metadata: {
        proposalNumber: "VP-2025-001",
        issueDate: "1403/11/01",
        validityDays: 10,
        estimatedTotalDurationDays: 30,
      },
      scopeOfWork: [
        {
          id: "item-1",
          title: "طراحی رابط کاربری فیگما",
          description: "طراحی دیزاین سیستم کامل تیره با استایل Glassmorphism و پروتوتایپ صفحات اصلی",
          quantity: 1,
          unitPrice: 20000000,
          totalPrice: 20000000,
          category: "طراحی UI/UX",
        },
        {
          id: "item-2",
          title: "کدنویسی فرانت‌اند با Next.js",
          description: "توسعه کامپوننت‌های ریسپانسیو و تعامل با APIهای سرورلس",
          quantity: 1,
          unitPrice: 45000000,
          totalPrice: 45000000,
          category: "توسعه فرانت‌اند",
        },
      ],
      phases: [
        {
          phaseNumber: 1,
          name: "فاز طراحی و تایید پروتوتایپ",
          durationDays: 10,
          deliverables: ["فایل فیگما", "دیزاین توکن‌ها"],
          paymentPercentage: 30,
          paymentAmount: 19500000,
        },
        {
          phaseNumber: 2,
          name: "فاز کدنویسی و اتصال به دیتابیس",
          durationDays: 20,
          deliverables: ["سورس‌کد پروژه", "استقرار نسخه تستی Vercel"],
          paymentPercentage: 70,
          paymentAmount: 45500000,
        },
      ],
      financials: {
        currency: "IRT" as const,
        subtotal: 65000000,
        discount: 0,
        tax: 0,
        totalAmount: 65000000,
        upfrontPercentage: 30,
        upfrontAmount: 19500000,
        remainingAmount: 45500000,
        paymentMethod: "شماره شبا رسمی استودیو",
      },
      legalTerms: {
        contractType: "قرارداد پیمانکاری توسعه نرم‌افزار",
        terminationClauses: [
          "طرفین حق فسخ یک‌طرفه با اخطار کتبی ۷ روزه را خواهند داشت.",
          "در صورت فسخ از سوی کارفرما، هزینه ساعات و فازهای تکمیل شده محاسبه و کسر خواهد شد.",
        ],
        forceMajeureClause: "حوادث غیرمترقبه، زلزله، جنگ و قطعی سراسری زیرساخت اینترنت به منزله فورس‌ماژور تلقی می‌شود.",
        revisionPolicy: {
          freeRevisionsCount: 2,
          outOfScopeHourlyRate: 750000,
          terms: "دو مرحله اصلاحات در دامنه پروژه رایگان و فراتر از آن با نرخ ساعتی محاسبه خواهد شد.",
        },
        intellectualPropertyClause: "انتقال مالکیت مادی سورس‌کد پس از تسویه حساب نهایی ۱۰۰٪ قرارداد صورت می‌گیرد.",
        confidentialityClause: "اطلاعات تجاری و دیتابیس کارفرما کاملاً محرمانه تلقی شده و به هیچ شخص ثالثی واگذار نمی‌شود.",
        disputeResolution: "حل اختلاف مسالمت‌آمیز از طریق داوری تخصصی نظام صنفی رایانه‌ای.",
      },
    };

    const validation = sanitizeAndValidateProposal(validProposalData);
    expect(validation.success).toBe(true);
    if (validation.success) {
      expect(validation.data.financials.totalAmount).toBe(65000000);
      expect(validation.data.phases.length).toBe(2);
      expect(validation.data.scopeOfWork.length).toBe(2);
    }
  });

  it("باید در صورت ناقص بودن بندهای الزامی یا منفی بودن مبالغ، خطا صادر کند", () => {
    const invalidData = {
      title: "پروژه تست ناقص",
      // بدون خلاصه اجرایی و بدون اقلام خدمات
      financials: {
        totalAmount: -1000, // مبلغ منفی
      },
    };

    const result = ProposalSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("باید هش SHA-256 فایل صوتی را به صورت قطعی و همسان تولید کند", () => {
    const sampleBuffer = Buffer.from("B2_VOICE_SAMPLE_AUDIO_STREAM_DATA");
    const hash1 = calculateAudioBufferHash(sampleBuffer);
    const hash2 = calculateAudioBufferHash(sampleBuffer);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // طول رشته هش SHA-256 در فرمت هگزادسیمال
  });
});