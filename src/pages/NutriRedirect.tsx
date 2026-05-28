import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const PHONE = "5521998984153";

const NutriRedirect = () => {
  const [params] = useSearchParams();
  useEffect(() => {
    const nome = (params.get("n") || "").trim();
    const msg = nome
      ? `Oi Nutri! Sou ${nome} e gostaria de falar com o Nutri para acompanhamento da consultoria.`
      : `Oi Nutri! Gostaria de falar com o Nutri para acompanhamento da consultoria.`;
    const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
    window.location.replace(url);
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground">Abrindo Fale com o Nutri…</p>
    </div>
  );
};

export default NutriRedirect;