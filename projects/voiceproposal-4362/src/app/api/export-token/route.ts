import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/server';
import { signExportToken } from '@/lib/jwt';
import type { ExportTier, ExportTokenResponse } from '@/types/export';

const RequestSchema = z.object({
  proposalId: z.string().min(1, 'Proposal ID is required'),
  fingerprint: z.string().min(8, 'Valid device fingerprint is required'),
  customLogoUrl: z.string().url().optional().nullable(),
  removeWatermarkRequested: z.boolean().default(false),
  transactionId: z.string().uuid().optional().nullable(),
});

const PAY_PER_EXPORT_FEE = 490000; // 49,000 Tomans in IRR
const MAX_FREE_EXPORTS = 3;

export async function POST(req: NextRequest): Promise<NextResponse<ExportTokenResponse>> {
  try {
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    const {
      proposalId,
      fingerprint,
      customLogoUrl,
      removeWatermarkRequested,
      transactionId,
    } = parseResult.data;

    // Optional Supabase user resolution from auth headers
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (userData?.user) {
        userId = userData.user.id;
      }
    }

    // 1. Check if paid transaction exists or was verified
    if (transactionId) {
      const { data: transaction, error: txError } = await supabaseAdmin
        .from('export_transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('proposal_id', proposalId)
        .eq('status', 'completed')
        .single();

      if (!txError && transaction) {
        const token = await signExportToken({
          sub: userId || fingerprint,
          proposalId,
          tier: 'pay_per_export',
          watermarkDisabled: true,
          customLogoAllowed: true,
          customLogoUrl: customLogoUrl || null,
        });

        return NextResponse.json({
          success: true,
          token,
          quotaRemaining: 0,
        });
      }
    }

    // 2. Premium features requested (watermark removal or custom logo) without valid payment
    const wantsPremium = removeWatermarkRequested || Boolean(customLogoUrl);
    if (wantsPremium) {
      return NextResponse.json(
        {
          success: false,
          requiresPayment: true,
          pricing: {
            amount: PAY_PER_EXPORT_FEE,
            currency: 'IRR',
            description: 'ارتقاء پیش‌فاکتور: حذف دائمی برچسب VoiceProposal و درج لوگوی اختصاصی فریلنسر',
          },
          error: 'برای صدور بدون واترمارک و درج لوگوی اختصاصی، ارتقاء به پلن Pay-per-Export ضروری است.',
        },
        { status: 402 }
      );
    }

    // 3. Free Quota Tracking Check (3 free exports per fingerprint/user)
    const { data: quotaRecord } = await supabaseAdmin
      .from('user_export_quotas')
      .select('*')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    const usedCount = quotaRecord?.free_exports_used ?? 0;

    if (usedCount >= MAX_FREE_EXPORTS) {
      return NextResponse.json(
        {
          success: false,
          requiresPayment: true,
          quotaRemaining: 0,
          pricing: {
            amount: PAY_PER_EXPORT_FEE,
            currency: 'IRR',
            description: 'سقف ۳ خروجی رایگان شما تکمیل شده است. صدور با کیفیت استودیویی و پشتیبانی حقوقی کامل',
          },
          error: 'سقف ۳ خروجی رایگان شما تکمیل شده است. لطفاً برای خروجی جدید پرداخت نمایید.',
        },
        { status: 402 }
      );
    }

    // 4. Increment the usage counter
    if (quotaRecord) {
      await supabaseAdmin
        .from('user_export_quotas')
        .update({
          free_exports_used: usedCount + 1,
          updated_at: new Date().toISOString(),
          ...(userId ? { user_id: userId } : {}),
        })
        .eq('id', quotaRecord.id);
    } else {
      await supabaseAdmin.from('user_export_quotas').insert({
        fingerprint,
        user_id: userId,
        free_exports_used: 1,
        max_free_exports: MAX_FREE_EXPORTS,
      });
    }

    const quotaRemaining = Math.max(0, MAX_FREE_EXPORTS - (usedCount + 1));

    // 5. Issue Free Tier Token with Active Watermark
    const token = await signExportToken({
      sub: userId || fingerprint,
      proposalId,
      tier: 'free' as ExportTier,
      watermarkDisabled: false,
      customLogoAllowed: false,
      customLogoUrl: null,
    });

    return NextResponse.json({
      success: true,
      token,
      quotaRemaining,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown internal server error';
    console.error('[Export-Token-Route] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}