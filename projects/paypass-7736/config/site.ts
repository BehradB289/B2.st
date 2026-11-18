export const siteConfig = {
  name: "پی‌پاس | PayPass",
  description: "میکرومانتایز آنی و فروش تک‌محتوایی لوکس با یک لینک",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://paypass.b2.st",
  platformFeeRate: 0.05, // 5% Platform Fee
  minPrice: 1000, // Tomans
  gateway: {
    sandbox: process.env.PAYMENT_SANDBOX === "true",
    merchantId: process.env.ZARINPAL_MERCHANT_ID || "00000000-0000-0000-0000-000000000000",
  },
};