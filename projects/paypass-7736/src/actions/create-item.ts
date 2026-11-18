"use server";

import { z } from "zod";
import { encryptContent } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { generateSlug } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const createItemSchema = z.object({
  title: z.string().min(3, "عنوان محتوا حداقل باید ۳ حرف باشد"),
  description: z.string().optional().default(""),
  price: z.coerce.number().min(siteConfig.minPrice, `حداقل مبلغ ${siteConfig.minPrice} تومان است`),
  payoutTarget: z.string().min(5, "شماره شبا یا مقصد واریز نامعتبر است"),
  secretContent: z.string().min(1, "محتوای قفل شده نباید خالی باشد"),
});

export interface CreateItemResult {
  success: boolean;
  message?: string;
  slug?: string;
  url?: string;
}

export async function createItemAction(formData: FormData): Promise<CreateItemResult> {
  try {
    const rawData = {
      title: formData.get("title"),
      description: formData.get("description") || "",
      price: formData.get("price"),
      payoutTarget: formData.get("payoutTarget"),
      secretContent: formData.get("secretContent"),
    };

    const validated = createItemSchema.parse(rawData);

    // 1. Encrypt payload with AES-256-GCM
    const { ciphertext, iv, authTag } = encryptContent(validated.secretContent);
    const slug = generateSlug(7);

    // 2. Persist in database
    const { error } = await supabaseAdmin.from("items").insert({
      slug,
      title: validated.title,
      description: validated.description,
      price: validated.price,
      encrypted_content: ciphertext,
      iv,
      auth_tag: authTag,
      creator_payout_target: validated.payoutTarget,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return { success: false, message: "خطا در ثبت پایگاه داده رخ داده است." };
    }

    const publicUrl = `${siteConfig.url}/i/${slug}`;
    return {
      success: true,
      slug,
      url: publicUrl,
    };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { success: false, message: err.errors[0]?.message || "ورودی نامعتبر است" };
    }
    return { success: false, message: err?.message || "خطای ناشناخته رخ داد" };
  }
}