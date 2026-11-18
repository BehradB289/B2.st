import type { Metadata } from "next";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import "./globals.css";

export const metadata: Metadata = {
  title: "پی‌پاس | پلتفرم میکرومانتایز لوکس استودیو B2.st",
  description: "فروش تک‌محتوایی فوری و فوق‌سریع با رمزنگاری سرور‌ساید AES-256 و کسر خودکار ۵٪ کارمزد پلتفرم.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
      </head>
      <body className="min-h-screen bg-paypass-bg text-white relative selection:bg-paypass-cyan selection:text-black">
        <AmbientGlow />
        <header className="border-b border-white/[0.06] backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-paypass-cyan to-paypass-violet flex items-center justify-center font-black text-black text-sm">
                P
              </span>
              <span className="font-bold text-lg tracking-wider text-white">
                Pay<span className="text-paypass-cyan">Pass</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-mono">
                B2.st Studio
              </span>
              <span className="hidden sm:inline-block text-emerald-400">● زیرساخت فعال</span>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-12">
          {children}
        </main>

        <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-white/40">
          <p>© {new Date().getFullYear()} پی‌پاس (PayPass) - توسعه‌یافته در استودیو لوکس B2.st</p>
        </footer>
      </body>
    </html>
  );
}