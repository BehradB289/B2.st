import Groq from "groq-sdk";
import { Proposal, ProposalSchema } from "./schemas/proposal";

/**
 * ارزیابی و ایجاد نمونه کلاینت Groq Cloud
 */
const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  console.warn("⚠️ هشدار: متغیر GROQ_API_KEY در محیط سرور یافت نشد. فراخوانی‌های هوش مصنوعی با خطا مواجه خواهند شد.");
}

export const groq = new Groq({
  apiKey: groqApiKey || "",
});

/**
 * پرامپت راهنمای اختصاصی Whisper برای افزایش دقت کلمات تخصصی نرم‌افزاری و اصطلاحات قراردادی به زبان فارسی و انگلیسی
 */
const WHISPER_DOMAIN_PROMPT = 
  "پیش‌فاکتور، پروپوزال، فریلنسر، کارفرما، استودیو B2.st، مبلغ، تومان، ریال، فازبندی، پیش‌پرداخت، ددلاین، " +
  "شرایط فسخ، فورس‌ماژور، نکست‌جی‌اس، تایپ‌اسکریپت، ری‌اکت، پایتون، فیگما، UI/UX، بک‌اند، دیتابیس Supabase، داکر.";

/**
 * تبدیل صوت ورودی (فایل WebM یا بافر صوتی) به متن دقیق با Groq Whisper-large-v3 با تاخیر زیر ۱ ثانیه
 */
export async function transcribeAudioWithWhisper(
  audioFile: File,
  language: string = "fa"
): Promise<{ text: string; duration?: number }> {
  try {
    const startTime = Date.now();

    // فراخوانی مستقیم متد Transcriptions از Groq SDK
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      language: language === "auto" ? undefined : language,
      response_format: "verbose_json",
      temperature: 0.0,
      prompt: WHISPER_DOMAIN_PROMPT,
    });

    const elapsedMs = Date.now() - startTime;
    console.info(`[Groq Whisper] صوت با موفقیت پیاده‌سازی شد. زمان پردازش: ${elapsedMs}ms`);

    return {
      text: transcription.text.trim(),
      duration: (transcription as { duration?: number }).duration,
    };
  } catch (error: unknown) {
    console.error("[Groq Whisper Error]:", error);
    const message = error instanceof Error ? error.message : "خطای نامشخص در تبدیل صوت به متن";
    throw new Error(`خطا در استخراج متن صوتی با Groq Whisper: ${message}`);
  }
}

/**
 * پرامپت مهندسی شده حقوقی-قراردادی برای Llama-3-70b
 */
const LEGAL_PROPOSAL_SYSTEM_PROMPT = `تو مشاور و وکیل حقوقی ارشد قراردادهای فناوری اطلاعات و استودیو B2.st هستی.
وظیفه تو این است که شرح صوتی شفاهی و خام یک فریلنسر یا مذاکره تلفنی با کارفرما را تحلیل کنی و آن را به یک پروپوزال رسمی، استاندارد، بدون ابهام و کاملاً ساختاریافته تبدیل کنی.

قوانین سخت‌گیرانه تولید داده:
۱. خروجی باید الزاماً و بدون استثنا یک JSON معتبر سازگار با اسکیمای درخواستی باشد. هیچ متن اضافی قبل یا بعد از JSON نباید تولید شود.
۲. تمام اعداد، ارقام و مبالغ باید به عدد خام (Integer/Float) تبدیل شوند (مثلاً 'پنجاه میلیون تومان' -> 50000000). واحد پیش‌فرض IRT (تومان) است مگر اینکه در صوت مشخصاً ارز دیگری ذکر شود.
۳. در محاسبات مالی:
   - مجموع unitPrice * quantity اقلام باید با subtotal همخوانی داشته باشد.
   - totalAmount = subtotal - discount + tax
   - upfrontAmount = totalAmount * (upfrontPercentage / 100)
   - remainingAmount = totalAmount - upfrontAmount
   - مجموع درصدهای فازها و پرداخت‌های فازبندی باید دقیق و منطقی باشد.
۴. شرایط حقوقی (legalTerms):
   - شرایط فسخ (terminationClauses): باید به وضوح بندهای اعلام کتبی، کسر هزینه‌های کار انجام‌شده، و سقف روز اعلام فسخ را درج کند.
   - فورس‌ماژور (forceMajeureClause): بلایای طبیعی، قطعی سراسری زیرساخت اینترنت خارج از کنترل مجری، جنگ و تصمیمات حاکمیتی را پوشش دهد.
   - بازبینی و ادیت (revisionPolicy): تعیین ۲ مرحله بازبینی در چارچوب پروژه، و هرگونه درخواست خارج از اسکوپ (Scope Creep) با توافق متمم یا نرخ ساعتی.
   - مالکیت معنوی (intellectualPropertyClause): انتقال کامل کلیه حقوق مادی اثر پس از تسویه حساب کامل ۱۰۰٪ مالی صورت می‌گیرد. حق نمایش اثر به عنوان نمونه‌کار برای مجری محفوظ است.
   - حفظ محرمانگی (confidentialityClause): اطلاعات و داده‌های محرمانه کارفرما افشا نخواهد شد.
۵. اگر نام کارفرما یا مجری در صوت صراحتاً گفته نشده بود، از عناوین محترمانه مثل "کارفرمای محترم" و برای مجری "استودیو B2.st" استفاده کن.
۶. تاریخ صدور را تاریخ روز (به فرمت YYYY-MM-DD یا شمسی) و ددلاین‌ها را بر اساس روزهای تقویمی تخمین بزن.
۷. لحن کلی پروپوزال باید کاملاً فاخر، رسمی، فنی و حقوقی باشد.`;

export interface ProposalGenerationContext {
  contractorName?: string;
  clientName?: string;
  currency?: "IRT" | "IRR" | "USD" | "EUR";
  customInstructions?: string;
}

/**
 * پردازش متن ترنسکریپت شده با Groq Llama-3-70b و تبدیل به مدل داده حقوقی Zod
 */
export async function generateStructuredProposal(
  transcription: string,
  context?: ProposalGenerationContext
): Promise<Proposal> {
  if (!transcription || transcription.trim().length < 5) {
    throw new Error("متن پیاده‌سازی شده برای استخراج پروپوزال کافی نیست.");
  }

  const modelName = process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile";

  const userPrompt = `
متن صحبت صوتی ضبط شده فریلنسر/مذاکره:
"""
${transcription}
"""

اطلاعات تکمیلی کانتکست (در صورت وجود):
- نام مجری پیشنهادی: ${context?.contractorName || "استودیو B2.st"}
- نام کارفرما (در صورت اطلاع): ${context?.clientName || "نامشخص در صوت"}
- ارز مدنظر: ${context?.currency || "IRT (تومان)"}
- دستورات تکمیلی: ${context?.customInstructions || "هیچ"}

لطفاً این مکالمه را دقیقاً طبق قواعد ساختاری JSON حقوقی خروجی بده:
- title: عنوان پروژه
- executiveSummary: خلاصه اهداف و شرح نیاز
- client: { name, company, contact }
- contractor: { name, company, title }
- metadata: { proposalNumber, issueDate, validityDays, estimatedTotalDurationDays }
- scopeOfWork: آرایه‌ای از { id, title, description, quantity, unitPrice, totalPrice, category }
- phases: آرایه‌ای از { phaseNumber, name, durationDays, deliverables, paymentPercentage, paymentAmount }
- financials: { currency, subtotal, discount, tax, totalAmount, upfrontPercentage, upfrontAmount, remainingAmount, paymentMethod }
- legalTerms: { contractType, terminationClauses, forceMajeureClause, revisionPolicy, intellectualPropertyClause, confidentialityClause, disputeResolution }
- notes: نکات تکمیلی
`.trim();

  try {
    const startTime = Date.now();

    const completion = await groq.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: LEGAL_PROPOSAL_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // کمترین نوسان برای ثبات و خروجی ساختاریافته
      max_tokens: 4096,
    });

    const elapsedMs = Date.now() - startTime;
    const rawContent = completion.choices[0]?.message?.content;

    if (!rawContent) {
      throw new Error("هیچ پاسخی از Groq Llama دریافت نشد.");
    }

    console.info(`[Groq Llama-3] داده‌های ساختاریافته تولید شد. زمان پردازش: ${elapsedMs}ms`);

    const parsedJson = JSON.parse(rawContent);

    // اعتبارسنجی دقیق داده‌ها با Zod
    const validation = ProposalSchema.safeParse(parsedJson);

    if (!validation.success) {
      console.warn("[Proposal Schema Validation Warning]: خطای عدم تطابق با اسکیما، تلاش برای ترمیم خودکار...", validation.error.format());
      return await autoCorrectProposalWithGroq(rawContent, validation.error.message, modelName);
    }

    return validation.data;
  } catch (error: unknown) {
    console.error("[Groq Proposal Generation Error]:", error);
    const message = error instanceof Error ? error.message : "خطا در پردازش هوش مصنوعی";
    throw new Error(`خطای تولید پروپوزال ساختاریافته: ${message}`);
  }
}

/**
 * مکانیزم ترمیم خودکار خطاهای Zod در یک چرخه سبک بازگشتی به مدل
 */
async function autoCorrectProposalWithGroq(
  invalidJsonStr: string,
  zodErrorMessage: string,
  modelName: string
): Promise<Proposal> {
  const repairPrompt = `JSON تولید شده قبلی اعتبارسنجی اسکیما را رد نکرد.
خطاهای شناسایی شده:
${zodErrorMessage}

داده خام قبلی:
${invalidJsonStr}

لطفاً دقیقاً JSON تصحیح شده و سازگار کامل با فیلدهای مورد نیاز را به فرمت JSON خالص بازگردان. تمام فیلدهای ناقص، نامعتبر یا عددی را اصلاح کن.`;

  const repairCompletion = await groq.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: "تو کارشناس اصلاح ساختار داده‌های JSON و سازگاری با Zod Schema هستی. فقط JSON معتبر برگردان." },
      { role: "user", content: repairPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.0,
  });

  const repairedContent = repairCompletion.choices[0]?.message?.content;
  if (!repairedContent) {
    throw new Error("ترمیم خودکار ساختار داده موفقیت‌آمیز نبود.");
  }

  const repairedJson = JSON.parse(repairedContent);
  return ProposalSchema.parse(repairedJson);
}