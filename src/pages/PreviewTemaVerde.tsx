import { ArrowLeft, Plus, Calendar, Dumbbell, BookOpen, User, Check, MoreVertical } from "lucide-react";

const STH_GREEN = "hsl(150 95% 45%)";
const STH_GREEN_SOFT = "hsl(150 95% 45% / 0.15)";

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div
    className="min-h-[640px] w-full max-w-[420px] mx-auto rounded-[32px] overflow-hidden relative text-white shadow-2xl"
    style={{
      background:
        "radial-gradient(120% 80% at 50% 0%, #0a3a2e 0%, #062018 45%, #02100c 80%, #000 100%)",
    }}
  >
    {children}
  </div>
);

const TabBar = () => (
  <div className="absolute bottom-0 left-0 right-0 px-6 pt-3 pb-6 flex justify-between items-center bg-black/40 backdrop-blur-md border-t border-white/5">
    {[
      { icon: Dumbbell, label: "Início", active: true },
      { icon: Calendar, label: "Agenda" },
      { icon: BookOpen, label: "Biblioteca" },
      { icon: User, label: "Perfil" },
    ].map(({ icon: Icon, label, active }) => (
      <div key={label} className="flex flex-col items-center gap-1">
        <Icon size={22} style={{ color: active ? STH_GREEN : "rgba(255,255,255,0.5)" }} />
        <span className="text-[11px]" style={{ color: active ? STH_GREEN : "rgba(255,255,255,0.5)" }}>
          {label}
        </span>
      </div>
    ))}
  </div>
);

const WorkoutCard = ({ letter, title, count = 0 }: { letter: string; title: string; count?: number }) => (
  <div className="rounded-2xl p-5 mb-4 border border-white/5" style={{ background: "rgba(255,255,255,0.04)" }}>
    <h3 className="font-bold text-[17px] mb-5">
      {letter}. {title}
    </h3>
    <div className="flex items-center justify-between">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-full border"
        style={{ borderColor: "rgba(255,255,255,0.15)" }}
      >
        <Check size={14} className="text-white/70" />
        <span className="text-[13px] text-white/70">Histórico</span>
        <span className="text-[12px] text-white/50 border border-white/15 rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      </div>
      <button
        className="px-5 py-2.5 rounded-full font-bold text-[13px] tracking-wide text-black"
        style={{ background: STH_GREEN, boxShadow: `0 0 24px ${STH_GREEN_SOFT}` }}
      >
        VER TREINO
      </button>
    </div>
  </div>
);

const PreviewTemaVerde = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white py-10 px-4">
      <div className="max-w-5xl mx-auto mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Preview · Tema STH Verde Neon</h1>
        <p className="text-white/60 text-sm">
          Espelho do estilo da referência (gradiente profundo + cards flutuantes), trocando o azul ciano pelo verde STH.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Tela 1 — Lista de treinos */}
        <PageShell>
          <div className="flex items-center justify-between px-5 pt-12 pb-4">
            <div className="flex items-center gap-3">
              <ArrowLeft size={22} />
              <span className="font-semibold tracking-wide">VOLTAR</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15">
              <Plus size={16} />
              <Calendar size={16} />
            </div>
          </div>

          <div className="px-5 pb-28 overflow-hidden">
            <WorkoutCard letter="B" title="Corrida Intervalada — HIIT" />
            <WorkoutCard letter="C" title="Deltóides e Peitorais" />
            <WorkoutCard letter="D" title="Panturrilhas e Isquiotibiais" />
            <WorkoutCard letter="E" title="Braços e Costas" />
          </div>

          <TabBar />
        </PageShell>

        {/* Tela 2 — Home com programas */}
        <PageShell>
          <div className="flex items-center justify-center pt-12 pb-4 gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black"
              style={{ background: STH_GREEN, color: "#000" }}
            >
              STH
            </div>
            <span className="font-bold tracking-[0.2em] text-[15px]">METHOD</span>
          </div>

          <div className="flex items-center gap-4 px-5 py-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: STH_GREEN, background: "#000" }}
            >
              <span className="font-black text-sm" style={{ color: STH_GREEN }}>
                STH
              </span>
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-[17px] leading-tight">Profissional Responsável</h2>
              <p className="text-white/60 text-sm">STH METHOD</p>
            </div>
            <MoreVertical size={20} className="text-white/60" />
          </div>

          <div className="px-5 pb-28 flex gap-3 overflow-hidden">
            {[
              { title: "TREINO HIPERTROFIA", tag: "força · ganho de massa" },
              { title: "RECOMP STH", tag: "definição · força" },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-2xl overflow-hidden border border-white/10 flex-1 min-w-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.6) 100%)",
                  aspectRatio: "3 / 4",
                }}
              >
                <div className="h-full flex flex-col justify-end p-3">
                  <div className="text-[12px] font-black tracking-wide leading-tight">{p.title}</div>
                  <div
                    className="mt-2 text-[10px] font-semibold py-1 px-2 rounded text-center text-black"
                    style={{ background: STH_GREEN }}
                  >
                    {p.tag}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <TabBar />
        </PageShell>
      </div>

      <div className="max-w-5xl mx-auto mt-12 grid sm:grid-cols-3 gap-4">
        {[
          { label: "Background", value: "Gradiente radial verde profundo → preto" },
          { label: "Acento (CTA / ícones ativos)", value: "STH Green · hsl(150 95% 45%)" },
          { label: "Cards", value: "rgba(255,255,255,0.04) + borda sutil" },
        ].map((i) => (
          <div key={i.label} className="rounded-xl p-4 border border-white/10 bg-white/5">
            <div className="text-[11px] uppercase tracking-wider text-white/50 mb-1">{i.label}</div>
            <div className="text-sm">{i.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewTemaVerde;