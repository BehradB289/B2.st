"use server";

import { z } from "zod";
import { supabaseAdmin, ItemRecord } from "@/lib/supabase";
import { siteConfig } from "@/config/site";
import crypto from "crypto";

const checkoutSchema = z.object({
  slug: z.string().min(1, "شناسه محتوا اجباری است"),
  customerIdentifier: z.string().min(5, "ایمیل یا شماره موبایل معتبر وارد کنید"),
});

export interface CheckoutResult {
  success: boolean;
  message?: string;
  redirectUrl?: string;
}

export async function createCheckoutSession(
  slug: string,
  customerIdentifier: string
): Promise<CheckoutResult> {
  try {
    const validated = checkoutSchema.parse({ slug, customerIdentifier });

    // 1. Fetch Item details
    const { data: item, error: itemError } = await supabaseAdmin
      .from("items")
      .select("*")
      .eq("slug", validated.slug)
      .single<ItemRecord>();

    if (itemError || !item) {
      return { success: false, message: "محتوای درخواستی یافت نشد یا حذف شده است." };
    }

    // 2. Compute 5% platform fee & 95% creator share
    const amount = item.price;
    const platformFee = Math.round(amount * siteConfig.platformFeeRate);
    const creatorShare = amount - platformFee;

    // 3. Generate internal payment tracking token
    const paymentToken = "PAYPASS_" + crypto.randomBytes(16).toString("hex");

    // 4. Save initial Order in Pending state
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        item_id: item.id,
        amount,
        platform_fee: platformFee,
        creator_share: creatorShare,
        customer_identifier: validated.customerIdentifier,
        status: "pending",
        payment_token: paymentToken,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return { success: false, message: "خطا در برپایی سشن پرداخت." };
    }

    // 5. Connect to Gateway (Mocked gateway URL with direct verify callback)
    const callbackUrl = `${siteConfig.url}/payment/verify?orderId=${order.id}&token=${paymentToken}`;

    return {
      success: true,
      redirectUrl: callbackUrl,
    };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { success: false, message: err.errors[0]?.message };
    }
    return { success: false, message: err?.message || "خطای ناشناخته در اتصال به درگاه" };
  }
}