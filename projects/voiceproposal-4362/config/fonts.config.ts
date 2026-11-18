/**
 * VoiceProposal - PDF Fonts Configuration
 * استودیو B2.st - پیکربندی پایدار و کش‌پذیر فونت فارسی برای رندرینگ کلاینت
 */
import { Font } from '@react-pdf/renderer';

export const VAZIRMATN_FONT_FAMILY = 'Vazirmatn';

/**
 * رجیستر کردن فونت وزیرمتن برای React-PDF با پشتیبانی کامل از گلیف‌های فارسی،
 * اعداد یونیکد، و اوزان استاندارد (معمولی، ضخیم و نیمه‌ضخیم).
 */
export function registerPersianFonts(): void {
  // جلوگیری از ثبت مجدد در صورت لود در کلاینت
  const registeredFonts = (Font as unknown as { getRegisteredFontFamilies?: () => string[] })
    .getRegisteredFontFamilies?.() || [];

  if (registeredFonts.includes(VAZIRMATN_FONT_FAMILY)) {
    return;
  }

  Font.register({
    family: VAZIRMATN_FONT_FAMILY,
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Regular.woff',
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Medium.woff',
        fontWeight: 500,
        fontStyle: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Bold.woff',
        fontWeight: 'bold',
        fontStyle: 'normal',
      },
    ],
  });

  // غیرفعال‌سازی خطای فاصله‌گذاری کلمات در متون راست‌به‌چپ React-PDF
  Font.registerHyphenationCallback((word) => [word]);
}