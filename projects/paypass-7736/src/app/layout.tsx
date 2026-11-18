import type { Metadata } from "next";
import "./globals.css";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { Navbar } from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "PayPass • پی‌پاس - میکرومانتایز آنی و فروش تک‌محتوایی",
  description: "پلتفرم فروش فوری پرامپت، لینک و کدهای اختصاصی با معماری AES-256 و کارت‌های شیشه‌ای لوکس استودیو B2.st",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="relative min-h-screen bg-[#090D16] text-zinc-100 antialiased selection:bg-brand-cyan/20 selection:text-brand-cyan">
        {/* Dynamic Studio Luxury Ambient Lighting */}
        <AmbientBackground />

        {/* Global Floating Glass Navbar */}
        <Navbar />

        {/* Page Main Content Area */}
        <div className="relative z-10 flex flex-col justify-between min-h-[calc(100vh-80px)]">
          <main className="flex-1">{children}</main>

          {/* Minimalist Studio Footer */}
          <footer className="w-full py-6 text-center text-xs text-zinc-500 border-t border-white/[0.04]">
            <div className="flex items-center justify-center gap-2">
              <span>طراحی و معماری شده در</span>
              <a 
                href="https://b2.st" 
                target="_blank" 
                rel="noreferrer"
                className="font-semibold text-zinc-300 hover:text-brand-cyan transition-colors"
              >
                B2.st Studio
              </a>
              <span>• پی‌پاس (PayPass) ۲۰۲۵</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}