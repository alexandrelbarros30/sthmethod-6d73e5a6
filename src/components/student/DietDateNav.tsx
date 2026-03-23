import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, subDays, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DietDateNavProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const DietDateNav = ({ selectedDate, onDateChange }: DietDateNavProps) => {
  const date = parseISO(selectedDate);
  const today = isToday(date);

  const goPrev = () => onDateChange(subDays(date, 1).toISOString().split("T")[0]);
  const goNext = () => onDateChange(addDays(date, 1).toISOString().split("T")[0]);
  const goToday = () => onDateChange(new Date().toISOString().split("T")[0]);

  const label = today
    ? "Hoje"
    : format(date, "EEEE", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase());

  const dateStr = format(date, "dd 'de' MMM", { locale: ptBR });

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev}>
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <button
        onClick={!today ? goToday : undefined}
        className={cn(
          "flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors",
          !today && "hover:bg-muted/50 cursor-pointer",
          today && "cursor-default"
        )}
      >
        <span className={cn(
          "text-sm font-bold tracking-tight flex items-center gap-1.5",
          today ? "text-primary" : "text-foreground"
        )}>
          <CalendarDays className="w-3.5 h-3.5" />
          {label}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{dateStr}</span>
      </button>

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext} disabled={today}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default DietDateNav;
