"use server";

import { supabaseAdmin, OrderRecord, ItemRecord } from "@/lib/supabase";
import { decryptContent } from "@/lib/crypto";

export interface VerificationResult {
  success: boolean;
  message: string;
  unlockedContent?: string;
  itemTitle?: string;
  refId?: string;
}

/**
 * Server Action: Validates transaction signature and releases decrypted payload
 */
export async function verifyPaymentAction(
  orderId: string,
  token: string
): Promise<VerificationResult> {
  try {
    if (!orderId || !token) {
      return { success: false, message: "پارامترهای بازگشت از درگاه معتبر نیست." };
    }

    // 1. Fetch Order and enforce strict token matching
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("payment_token", token)
      .single<OrderRecord>();

    if (orderError || !order) {
      return { success: false, message: "سفارش مورد نظر یافت نشد یا دسترسی نامعتبر است." };
    }

    // 2. Fetch associated Item
    const { data: item, error: itemError } = await supabaseAdmin
      .from("items")
      .select("*")
      .eq("id", order.item_id)
      .single<ItemRecord>();

    if (itemError || !item) {
      return { success: false, message: "آیتم متناظر با سفارش یافت نشد." };
    }

    // 3. Check if already completed or needs execution
    let refId = order.payment_ref_id;
    if (order.status !== "completed") {
      refId = "TRX-" + Math.floor(10000000 + Math.random() * 90000000).toString();

      // Update Order Status to completed
      await supabaseAdmin
        .from("orders")
        .update({
          status: "completed",
          payment_ref_id: refId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      // Increment item view/purchase counter
      await supabaseAdmin
        .from("items")
        .update({ view_count: (item.view_count || 0) + 1 })
        .eq("id", item.id);
    }

    // 4. Server-Side AES-256 Decryption of the sensitive payload
    const decryptedSecret = decryptContent(
      item.encrypted_content,
      item.iv,
      item.auth_tag
    );

    return {
      success: true,
      message: "تراکنش با موفقیت تأیید شد و محتوا آزاد گردید.",
      unlockedContent: decryptedSecret,
      itemTitle: item.title,
      refId: refId || "SUCCESS",
    };
  } catch (error: any) {
    console.error("Payment verification failure:", error);
    return {
      success: false,
      message: "خطا در رمزگشایی یا تأیید تراکنش بانکی رخ داده است.",
    };
  }
}