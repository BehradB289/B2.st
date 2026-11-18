/**
 * VoiceProposal - استودیو B2.st
 * پایپ‌لاین هوش مصنوعی: تبدیل صوت به متن (Whisper) و استخراج سند حقوقی با Zod (Llama-3)
 */
import { GroqClientManager } from './client';
import { ProposalSchema, Proposal, Party } from '../validations/proposal';

export class VoiceProcessingError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number = 400) {
    super(message);
    this.name = 'VoiceProcessingError';
  }
}

export interface PipelineOptions {
  freelancerProfile?: Partial<Party>;
  defaultCurrency?: 'TOMAN' | 'IRR' | 'USD' | 'USDT';
  currentPersianDate?: string;
}

/**
 * فاز ۱: استخراج متن صوت دریافتی با Groq Whisper-large-v3
 */
export async function transcribeAudioBuffer(
  audioBuffer: Buffer | Uint8Array,
  mimeType: string = 'audio/webm'
): Promise<string> {
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new VoiceProcessingError('بافر صوتی ارسال‌شده خالی یا نامعتبر است', 'EMPTY_AUDIO_BUFFER', 400);
  }

  // محدودیت حداقل حجم صوت برای جلوگیری از نویز یا کلیک تصادفی
  if (audioBuffer.length < 512) {
    throw new VoiceProcessingError('طول پیام صوتی بسیار کوتاه یا بدون داده صوتی است', 'AUDIO_TOO_SHORT', 400);
  }

  const groq = GroqClientManager.getInstance();

  try {
    // شبیه‌سازی ایجاد آبجکت File مطابق با استانداردهای Fetch API در محیط Node.js
    const audioBlob = new Blob([audioBuffer], { type: mimeType });
    const audioFile = new File([audioBlob], 'voice-input.webm', { type: mimeType });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: 'fa',
      temperature: 0.0,
      response_format: 'verbose_json',
    });

    const transcriptText = transcription.text?.trim() || '';

    if (!transcriptText || transcriptText.length < 5) {
      throw new VoiceProcessingError(
        'پیام صوتی مفهوم نبود یا صدای معناداری در فایل شناسایی نشد',
        'NO_SPEECH_DETECTED',
        422
      );
    }

    return transcriptText;
  } catch (error: unknown) {
    if (error instanceof VoiceProcessingError) {
      throw error;
    }
    const err = error as Error;
    throw new VoiceProcessingError(
      `خطای پردازش تبدیل گفتار به متن: ${err.message || 'عدم پاسخگویی سرویس هوش مصنوعی'}`,
      'TRANSCRIPTION_FAILED',
      502
    );
  }
}

/**
 * فاز ۲ و ۳: استخراج هوشمند موجودیت‌های حقوقی و مالی از طریق Llama-3-70b و تطبیق ساختار با Zod
 */
export async function extractProposalFromTranscript(
  transcript: string,
  options: PipelineOptions = {}
): Promise<Proposal> {
  if (!transcript || transcript.trim().length < 10) {
    throw new VoiceProcessingError(
      'متن ترانسکریپت کافی نیست. لطفاً شرح پروژه و نیازمندی‌ها را به طور کامل بیان کنید.',
      'INSUFFICIENT_TRANSCRIPT',
      400
    );
  }

  const groq = GroqClientManager.getInstance();
  const currentDate = options.currentPersianDate || '1403/09/01';
  const defaultCurrency = options.defaultCurrency || 'TOMAN';

  const systemPrompt = `شما یک دستیار ارشد حقوقی، مالی و قراردادنویسی فریلنسری هستید.
وظیفه شما استخراج دقیق قرارداد و پیش‌فاکتور از پیام صوتی یک فریلنسر ایرانی به یک ساختار JSON تمیز، دقیق و بدون خطا است.

قوانین ریاضی و ساختاری الزامی:
۱. تمام خروجی باید صرفاً یک آبجکت JSON معتبر باشد و هیچ توضیح اضافی قبل یا بعد از آن درج نشود.
۲. مبالغ باید اعداد بدون کاما و به واحد ارزی "${defaultCurrency}" باشند.
۳. در جدول اقلام (items)، مبلغ کل هر ردیف (totalPrice) باید دقیقاً برابر باشد با: (quantity * unitPrice) - discount.
۴. مقدار subtotalAmount باید دقیقاً برابر با جمع totalPrice تمام آیتم‌ها باشد.
۵. مقدار finalTotalAmount باید دقیقاً برابر باشد با: subtotalAmount + taxAmount - totalDiscount.
۶. مجموع درصد تمام مایل‌استون‌ها (milestones.percentage) باید دقیقاً برابر با ۱۰۰ باشد.
۷. مجموع مبلغ تمام مایل‌استون‌ها (milestones.amount) باید دقیقاً برابر با finalTotalAmount باشد.
۸. فازبندی‌ها باید منطقی باشند (مثلاً: ۳۰٪ پیش‌پرداخت، ۴۰٪ تحویل نسخه اولیه یا MVP، ۳۰٪ تسویه نهایی).
۹. اطلاعات کارفرما و مجری اگر در صوت بیان نشده باشد، مقادیر منطقی پیش‌فرض قرار دهید.

تاریخ امروز: ${currentDate}
فرمت پیشنهادی شماره پیش‌فاکتور: VP-${Date.now().toString().slice(-6)}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `متن صوت فریلنسر:\n"""\n${transcript}\n"""\n\nپیش‌فاکتور و شرح خدمات کامل را در قالب فرمت JSON استخراج کن.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const rawResponse = chatCompletion.choices[0]?.message?.content;
    if (!rawResponse) {
      throw new VoiceProcessingError('پاسخی از مدل Llama-3 دریافت نشد', 'EMPTY_LLM_RESPONSE', 502);
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawResponse);
    } catch {
      throw new VoiceProcessingError('ساختار بازگشتی از هوش مصنوعی فرمت معتبر JSON نیست', 'INVALID_JSON_RESPONSE', 502);
    }

    // اگر کاربر پروفایل پیش‌فرض فریلنسر ارسال کرده، ادغام شود
    if (typeof parsedJson === 'object' && parsedJson !== null && options.freelancerProfile) {
      const p = parsedJson as Record<string, unknown>;
      p.freelancer = {
        ...(p.freelancer as object),
        ...options.freelancerProfile,
      };
    }

    // اعتبارسنجی سخت‌گیرانه Zod
    const validationResult = ProposalSchema.safeParse(parsedJson);

    if (!validationResult.success) {
      const issueDetails = validationResult.error.issues
        .map((issue) => `[${issue.path.join('.')}: ${issue.message}]`)
        .join(', ');

      throw new VoiceProcessingError(
        `داده‌های استخراج‌شده با الزامات قانونی و مالی تطابق ندارد: ${issueDetails}`,
        'ZOD_VALIDATION_FAILED',
        422
      );
    }

    return validationResult.data;
  } catch (error: unknown) {
    if (error instanceof VoiceProcessingError) {
      throw error;
    }
    const err = error as Error;
    throw new VoiceProcessingError(
      `خطای پردازش شناختی Llama-3: ${err.message}`,
      'LLM_PIPELINE_ERROR',
      500
    );
  }
}

/**
 * پایپ‌لاین کامل صوتی سرورلس
 */
export async function runVoiceProposalPipeline(
  audioBuffer: Buffer | Uint8Array,
  options?: PipelineOptions
): Promise<{ transcript: string; proposal: Proposal }> {
  const transcript = await transcribeAudioBuffer(audioBuffer);
  const proposal = await extractProposalFromTranscript(transcript, options);

  return {
    transcript,
    proposal,
  };
}