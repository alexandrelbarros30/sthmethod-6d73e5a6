import { Link } from "react-router-dom";
import meadLogo from "@/assets/mead-logo.png.asset.json";

export default function CasShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] antialiased">
      <header className="border-b border-[#e6e6e8] bg-white/70 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/cas" className="flex items-center gap-2.5">
            <img src={meadLogo.url} alt="MEAD" className="h-10 w-auto object-contain" />
            <span className="text-[11px] tracking-[0.22em] font-semibold text-[#86868b]">· CAS</span>
          </Link>
          <Link to="/cas" className="text-[12px] text-[#6e6e73] hover:text-[#1d1d1f]">Voltar ao núcleo</Link>
        </div>
      </header>
      <main className="max-w-md mx-auto px-6 py-12">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 -m-12 rounded-full bg-gradient-to-b from-white to-[#e8e8ed] blur-3xl opacity-80" aria-hidden />
            <img
              src={meadLogo.url}
              alt="MEAD · Assistente de Aprendizagem"
              className="relative h-44 md:h-52 w-auto object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.15)]"
            />
          </div>
          <div className="text-[10px] tracking-[0.32em] font-semibold text-[#86868b] uppercase mb-3">
            MEAD · Assistente de Aprendizagem
          </div>
          <h1 className="text-[32px] font-semibold tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] text-[#6e6e73] max-w-sm">{subtitle}</p>}
        </div>
        <div className="rounded-2xl bg-white border border-[#e6e6e8] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-[13px] text-[#6e6e73]">{footer}</div>}
      </main>
    </div>
  );
}

export const fieldCls = "w-full h-11 rounded-xl border border-[#d2d2d7] bg-white px-3 text-[15px] text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition";
export const labelCls = "block text-[12px] font-medium tracking-[0.08em] uppercase text-[#6e6e73] mb-1.5";
export const btnPrimaryCls = "w-full h-11 rounded-xl bg-[#1d1d1f] text-white text-[15px] font-medium hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed";
export const linkCls = "text-[#0071e3] hover:underline";