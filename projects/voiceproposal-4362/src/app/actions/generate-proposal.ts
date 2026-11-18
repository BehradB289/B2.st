"use server";

import { transcribeAudioWithWhisper, generateStructuredProposal } from "@/lib/groq";
import { 
  calculateAudioBufferHash, 
  getCachedProposalByAudioHash, 
  saveProposalRecord 
} from "@/lib/supabase";
import { Proposal } from "@/lib/schemas/proposal";

export interface GenerateProposalActionResult {
  success: boolean;
  proposalId?: string;
  data?: Proposal;
  rawTranscription?: string;
  cached?: boolean;
  metrics?: {
    transcriptionDurationSec?: number;
    totalExecutionTimeMs: number;
    audioSizeBytes: number;
  };
  error?: string;
  code?: string;
}

const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024; // سقف ۲۵ مگابایت استاندارد Whisper
const SUPPORTED_AUDIO_TYPES = [
  "audio/webm",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp3",
  "audio/mpeg",
  "audio/m4a",
  "audio/mp4",
  "audio/ogg",
  "audio/opus",
];

/**
 * Server Action اصلی پروژه VoiceProposal:
 * دریافت فایل صوتی WebM/WAV از فرانت‌اند، بررسی کش دیتابیس Supabase،
 * پیاده‌سازی صوت با Groq Whisper، پردازش حقوقی با Llama-3-70b و ذخیره‌سازی نهایی.
 */
export async function generateProposalAction(
  formData: FormData
): Promise<GenerateProposalActionResult> {
  const executionStartTime = Date.now();

  try {
    const audioEntry = formData.get("audio");
    const forceRefresh = formData.get("forceRefresh") === "true";
    const customInstructions = formData.get("customInstructions")?.toString();
    const contractorName = formData.get("contractorName")?.toString();
    const clientName = formData.get("clientName")?.toString();
    const currency = (formData.get("currency")?.toString() as "IRT" | "IRR" | "USD" | "EUR") || "IRT";
    const userId = formData.get("userId")?.toString() || null;

    if (!audioEntry || !(audioEntry instanceof Blob)) {
      return {
        success: false,
        error: "فایل صوتی معتبر ارسال نشده است.",
        code: "MISSING_AUDIO_FILE",
      };
    }

    const audioFile = audioEntry as File;
    const audioSizeBytes = audioFile.size;

    // بررسی اندازه فایل
    if (audioSizeBytes > MAX_AUDIO_SIZE_BYTES) {
      return {
        success: false,
        error: `حجم فایل صوتی بیش از حد مجاز است. حداکثر ۲۵ مگابایت مجاز است، حجم فعلی: ${(audioSizeBytes / (1024 * 1024)).toFixed(2)} مگابایت`,
        code: "PAYLOAD_TOO_LARGE",
      };
    }

    // تبدیل فایل به ArrayBuffer جهت هش‌گذاری و اعتبارسنجی
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // تولید هش SHA-256 فایل صوتی برای Deduplication و Cache Hit
    const audioHash = calculateAudioBufferHash(audioBuffer);

    // بررسی کش سوپابیس در صورتی که کاربر درخواست پردازش اجباری مجدد نداده باشد
    if (!forceRefresh) {
      const cached = await getCachedProposalByAudioHash(audioHash);
      if (cached) {
        const totalTime = Date.now() - executionStartTime;
        console.info(`[VoiceProposal Cache Hit] پیش‌فاکتور از کش بازیابی شد. ProposalID: ${cached.id}`);

        return {
          success: true,
          proposalId: cached.id,
          data: cached.structuredData,
          rawTranscription: cached.rawTranscription,
          cached: true,
          metrics: {
            totalExecutionTimeMs: totalTime,
            audioSizeBytes,
          },
        };
      }
    }

    // ۱. استخراج متن از صوت با Whisper-large-v3 در Groq Cloud
    const whisperResult = await transcribeAudioWithWhisper(audioFile, "fa");
    const rawTranscription = whisperResult.text;

    if (!rawTranscription || rawTranscription.length < 5) {
      return {
        success: false,
        error: "صدای ارسالی فاقد محتوای گفتاری واضح و قابل تشخیص بود. لطفاً مجدداً و شمرده صحبت کنید.",
        code: "EMPTY_TRANSCRIPTION",
      };
    }

    // ۲. پردازش معنایی و استخراج اسکیمای حقوقی با Llama-3-70b
    const structuredProposal = await generateStructuredProposal(rawTranscription, {
      contractorName,
      clientName,
      currency,
      customInstructions,
    });

    const totalExecutionTimeMs = Date.now() - executionStartTime;

    // ۳. ذخیره‌سازی داده در جدول proposals سوپابیس
    const savedRecord = await saveProposalRecord({
      audioHash,
      rawTranscription,
      structuredData: structuredProposal,
      processingTimeMs: totalExecutionTimeMs,
      audioDurationSeconds: whisperResult.duration || undefined,
      userId,
      status: "draft",
    });

    console.info(`[VoiceProposal Complete] رکورد جدید ایجاد شد. ID: ${savedRecord.id} | زمان کل: ${totalExecutionTimeMs}ms`);

    return {
      success: true,
      proposalId: savedRecord.id,
      data: structuredProposal,
      rawTranscription,
      cached: false,
      metrics: {
        transcriptionDurationSec: whisperResult.duration,
        totalExecutionTimeMs,
        audioSizeBytes,
      },
    };
  } catch (error: unknown) {
    console.error("[generateProposalAction Exception]:", error);
    const errorMessage = error instanceof Error ? error.message : "خطای غیرمنتظره در پردازش هوش مصنوعی";

    return {
      success: false,
      error: errorMessage,
      code: "INTERNAL_PIPELINE_ERROR",
    };
  }
}