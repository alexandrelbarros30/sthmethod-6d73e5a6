import React from "react";

export interface StudentInfoHeaderProps {
  name?: string;
  age?: number;
  weight?: number;
  height?: number;
  objective?: string;
  startDate?: string;
  hydration?: string;
  totalEnergy?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

const StudentInfoHeader: React.FC<{ info: StudentInfoHeaderProps }> = ({ info }) => {
  const hasInfo = info.name || info.age || info.weight || info.height || info.objective;
  const hasMacros = info.totalEnergy || info.protein || info.carbs || info.fat || info.hydration;
  if (!hasInfo && !hasMacros) return null;

  return (
    <div className="mb-4 pb-3 border-b border-border">
      {/* Title */}
      <div className="text-center mb-3">
        <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-foreground font-display">
          STH METHOD
        </h2>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs font-body justify-center sm:justify-start">
        {info.name && <InfoRow label="Nome" value={info.name} />}
        {info.age != null && <InfoRow label="Idade" value={`${info.age} anos`} />}
        {info.weight && <InfoRow label="Peso" value={`${info.weight} kg`} />}
        {info.height && <InfoRow label="Altura" value={`${info.height} cm`} />}
        {info.objective && <InfoRow label="Objetivo" value={info.objective} />}
        {info.startDate && <InfoRow label="Início" value={info.startDate} />}
        {info.hydration && <InfoRow label="Hidratação" value={info.hydration} />}
      </div>

      {/* Macros summary */}
      {hasMacros && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {info.totalEnergy != null && (
            <MacroBadge label="Energia" value={`${info.totalEnergy} kcal`} colorClass="bg-orange-500/15 text-orange-600 border-orange-500/20" />
          )}
          {info.protein != null && (
            <MacroBadge label="Proteína" value={`~${info.protein}g`} accent />
          )}
          {info.carbs != null && (
            <MacroBadge label="Carbos" value={`~${info.carbs}g`} colorClass="bg-blue-500/15 text-blue-600 border-blue-500/20" />
          )}
          {info.fat != null && (
            <MacroBadge label="Lipídios" value={`~${info.fat}g`} colorClass="bg-yellow-500/15 text-yellow-700 border-yellow-500/20" />
          )}
          {info.hydration && (
            <MacroBadge label="Água" value={info.hydration} colorClass="bg-cyan-500/15 text-cyan-600 border-cyan-500/20" />
          )}
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <span className="text-foreground whitespace-nowrap">
    <span className="font-semibold">{label}:</span>{" "}
    <span className="text-muted-foreground">{value}</span>
  </span>
);

const MacroBadge = ({
  label,
  value,
  accent,
  colorClass,
}: {
  label: string;
  value: string;
  accent?: boolean;
  colorClass?: string;
}) => (
  <div
    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium border ${
      colorClass
        ? colorClass
        : accent
        ? "bg-primary/15 text-primary border-primary/20"
        : "bg-muted text-muted-foreground border-border"
    }`}
  >
    <span className="block text-[9px] sm:text-[10px] uppercase tracking-wider opacity-70">{label}</span>
    <span className="font-bold text-xs sm:text-sm">{value}</span>
  </div>
);

export default StudentInfoHeader;
