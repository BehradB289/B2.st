import React from "react";
import { notFound } from "next/navigation";
import { getPublicItemAction } from "@/actions/paypass";
import { BuyerUnlockView } from "@/components/buyer/BuyerUnlockView";
import type { Metadata } from "next";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const res = await getPublicItemAction(params.slug);
  if (!res.success || !res.data) {
    return {
      title: "آیتم یافت نشد | PayPass",
    };
  }

  return {
    title: `${res.data.title} | پی‌پاس`,
    description: res.data.description || "آنلاک آنی محتوای محافظت شده با پی‌پاس",
  };
}

export default async function BuyerPage({ params }: PageProps) {
  const res = await getPublicItemAction(params.slug);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <main className="w-full flex items-center justify-center min-h-[calc(100vh-120px)]">
      <BuyerUnlockView item={res.data} />
    </main>
  );
}