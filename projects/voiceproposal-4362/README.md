# وویس‌پروپوزال (VoiceProposal) - مولد آنی پیش‌فاکتور و شرح خدمات فریلنسری با پیام صوتی

> 🚀 Autonomously Architected, Designed, Coded & Verified by **B2.st 6-Agent & 10-Debugger Studio v9.0**

## 📐 Architecture
معماری ماژولار و Serverless پروژه VoiceProposal بر پایه Next.js 14 App Router مستقر روی Vercel طراحی شده است. فلوی عملیاتی شامل دریافت استریم صوتی WebM از طریق Server Action، ارسال مستقیم به Groq Cloud جهت استخراج متن توسط Whisper-large-v3 با تاخیر زیر ۱ ثانیه، و سپس پردازش معنایی به وسیله Groq Llama-3-70b با متد انطباق ساختار Zod به فرمت JSON ساخت‌یافته حقوقی (قرارداد، جدول مبالغ، فازبندی، فورس‌ماژور) است. متادیتا و کش پردازش‌ها در Supabase ذخیره شده و تولید سند نهایی PDF به صورت صفر-هزینه سرور در مرورگر کلاینت با @react-pdf/renderer صورت می‌پذیرد. دیزاین سیستم متکی بر شیشه‌گرایی (Glassmorphism) تیره، گرادیان عمیق مش (#090D16 و #6D28D9) و انیمیشن‌های مبتنی بر Web Audio API پیاده‌سازی می‌شود.

## 🗂️ Folder Structure
```text
projects/voiceproposal-4362/
├── .env.example
├── config/supabase-schema.sql
├── docs/ARCHITECTURE.md
├── docs/architecture-pipeline.md
├── package.json
├── public/index.html
├── src/app/actions/generate-proposal.ts
├── src/app/api/transcribe/route.ts
├── src/app/globals.css
├── src/app/layout.tsx
├── src/app/page.tsx
├── src/components/AudioRecorder.tsx
├── src/components/AudioVisualizer.tsx
├── src/components/GlassCard.tsx
├── src/components/Header.tsx
├── src/hooks/useAudioRecorder.ts
├── src/lib/groq.ts
├── src/lib/schemas/proposal.ts
├── src/lib/supabase.ts
├── src/next.config.mjs
├── src/postcss.config.mjs
├── src/tailwind.config.ts
├── src/tsconfig.json
├── src/types/audio.ts
├── src/types/database.ts
├── tests/AudioRecorder.test.tsx
├── tests/proposal-pipeline.test.ts
```
