import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Sparkles, ChevronRight } from "lucide-react";
import { getLatestTrend } from "@/data/latest-trends";

const STORAGE_KEY = "sth_dismissed_trend_id";

const NewTrendNotification = () => {
  const trend = getLatestTrend();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed !== trend.id) setVisible(true);
  }, [trend.id]);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.setItem(STORAGE_KEY, trend.id);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Link
      to={trend.path}
      className="block mb-5 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3 pr-2">
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative">
          <img src={trend.img} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold tracking-[0.22em] uppercase text-primary flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" strokeWidth={2.5} /> Nova tendência publicada
          </p>
          <p className="text-[12px] font-medium text-foreground tracking-tight truncate mt-0.5">
            {trend.title}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-foreground/40 shrink-0" strokeWidth={2} />
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/10 transition-colors shrink-0"
          aria-label="Fechar"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
      </div>
    </Link>
  );
};

export default NewTrendNotification;