/**
 * VoiceProposal - داده‌های ماک استاندارد برای تست‌های پایپ‌لاین و رندرینگ PDF
 */
import { Proposal } from '../../src/lib/validations/proposal';

export const mockWebDevelopmentProposal: Proposal = {
  proposalNumber: 'VP-982415',
  issueDate: '1403/09/15',
  validityDays: 10,
  title: 'توسعه پلتفرم وب‌سایت شرکتی با معماری Next.js 14',
  summary: 'طراحی، پیاده‌سازی و استقرار پنل کاربری، فرانت‌اند تعاملی و یکپارچه‌سازی وب‌سرویس‌ها با تضمین سرعت و سئو',
  currency: 'TOMAN',
  freelancer: {
    name: 'سهراب کاظمی',
    company: 'استودیو خلاق نرم‌افزار',
    phone: '09121234567',
    email: 'sohrab@b2.st',
  },
  client: {
    name: 'آقای مهندس رضایی',
    company: 'هلدینگ بازرگانی پارس آریا',
    phone: '09127654321',
    email: 'rezaei@parsarya.ir',
  },
  items: [
    {
      id: 'item-1',
      title: 'پیاده‌سازی رابط کاربری با Tailwind CSS و طراحی ریسپانسیو',
      description: 'کدنویسی تمیز تمام صفحات بر اساس طرح فیگما',
      quantity: 1,
      unit: 'پروژه',
      unitPrice: 15000000,
      discount: 0,
      totalPrice: 15000000,
    },
    {
      id: 'item-2',
      title: 'پیاده‌سازی ماژول مدیریت احراز هویت و پایگاه داده Supabase',
      description: 'شامل سیستم نقش‌ها، توکن‌های امنیتی و تست نفوذ اولیه',
      quantity: 1,
      unit: 'پروژه',
      unitPrice: 20000000,
      discount: 2000000,
      totalPrice: 18000000,
    },
    {
      id: 'item-3',
      title: 'تست‌های جامع و استقرار سرورلس روی سرور Vercel',
      description: 'پیکربندی CI/CD و بهینه‌سازی لود زیر ۱ ثانیه',
      quantity: 1,
      unit: 'سرویس',
      unitPrice: 7000000,
      discount: 0,
      totalPrice: 7000000,
    },
  ],
  subtotalAmount: 40000000,
  taxPercentage: 0,
  taxAmount: 0,
  totalDiscount: 0,
  finalTotalAmount: 40000000,
  milestones: [
    {
      id: 'ms-1',
      title: 'پیش‌پرداخت جهت آغاز فاز تحلیل و معماری',
      percentage: 30,
      amount: 12000000,
      durationDays: 3,
      deliverables: ['معماری پایگاه داده', 'پیکربندی اولیه ریپازیتوری'],
    },
    {
      id: 'ms-2',
      title: 'تحویل نسخه نمایشی و تست فرانت‌اند',
      percentage: 40,
      amount: 16000000,
      durationDays: 14,
      deliverables: ['نسخه آزمایشی روی دامنه تست', 'اتصال به APIها'],
    },
    {
      id: 'ms-3',
      title: 'تحویل نهایی، تست و استقرار در پروداکشن',
      percentage: 30,
      amount: 12000000,
      durationDays: 7,
      deliverables: ['تحویل سورس‌کد کامل', 'دسترسی دپلوی دائم'],
    },
  ],
  legalClauses: {
    confidentiality: 'کلیه سورس‌ها و متون استراتژی تجاری به مدت دو سال کاملاً محرمانه است.',
    ipRights: 'تمامی حقوق سورس پس از تسویه فاز نهایی تماماً به هلدینگ پارس آریا تفویض می‌شود.',
    forceMajeure: 'در صورت قطعی گسترده بستر اینترنت بین‌الملل، زمان‌بندی تمدید می‌گردد.',
    disputeResolution: 'داوری سازمان نظام صنفی رایانه‌ای تهران مرجع نهایی خواهد بود.',
    additionalNotes: 'پشتیبانی فنی رایگان به مدت ۳۰ روز کاری پس از استقرار نهایی ارائه خواهد شد.',
  },
  status: 'SENT',
};

export const mockPersianTranscriptSample = `
سلام مهندس وقت بخیر. طبق صحبتی که داشتیم پیش‌فاکتور پروژه بازطراحی وب‌سایت شرکت هلدینگ پارس آریا رو آماده کردم.
هزینه طراحی و پیاده‌سازی رابط کاربری با نکست و تیلویند ۱۵ میلیون تومنه.
بخش پایگاه داده و احراز هویت با سوپابیس ۲۰ میلیون تومنه که دو میلیون تخفیف دادم و ۱۸ میلیون حساب کردم.
استقرار روی ورسل و تست‌های نهایی هم ۷ میلیون تومنه.
جمع کل پروژه میشه ۴۰ میلیون تومان بدون مالیات.
فازبندی هم ۳۰ درصد پیش‌پرداخت یعنی ۱۲ تومن برای شروع، ۴۰ درصد معادل ۱۶ تومن پس از دیدن دمو، و ۳۰ درصد الباقی یعنی ۱۲ میلیون بعد از تحویل سورس نهایی.
مدت زمان کار هم کلاً ۲۴ روز کاری هست.
`;