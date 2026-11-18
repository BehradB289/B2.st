import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VoiceProposal | B2.st Studio',
  description: 'مولد آنی پیش‌فاکتور و شرح خدمات فریلنسری با پیام صوتی مبتنی بر هوش مصنوعی',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="dark-mesh-background min-h-screen text-slate-100 antialiased selection:bg-purple-500/30 selection:text-purple-200">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Ambient Blurred Mesh Spheres */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-mesh-purple/30 rounded-full blur-[100px] animate-mesh-float" />
          <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-mesh-cyan/20 rounded-full blur-[120px] animate-mesh-float [animation-delay:4s]" />
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}