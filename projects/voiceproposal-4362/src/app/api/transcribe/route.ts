import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Endpoint skeleton for Groq Cloud Whisper-large-v3 transcription
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json(
        { error: 'فایل صوتی یافت نشد' },
        { status: 400 }
      );
    }

    // Pass directly to Groq Whisper API endpoint with standard bearer auth
    return NextResponse.json({
      success: true,
      message: 'فایل صوتی آماده پردازش در Groq LPU',
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در برقراری ارتباط با سرویس رونویسی' },
      { status: 500 }
    );
  }
}