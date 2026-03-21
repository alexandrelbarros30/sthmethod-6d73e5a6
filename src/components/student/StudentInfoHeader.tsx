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
  const hasMacros = info.totalEnergy || info.protein || info.carbs || info.fat;
  if (!hasInfo && !hasMacros) return null;

  return (
    <div className="mb-6 pb-4 border-b border-border">
      {/* Title */}
      <div className="text-center mb-4">
        <h2 className="text-base font-bold tracking-[0.2em] uppercase text-foreground font-display">
          STH METHOD
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm font-body">
        {info.name && <InfoRow label="Nome" value={info.name} />}
        {info.age && <InfoRow label="Idade" value={`${info.age} anos`} />}
        {info.weight && <InfoRow label="Peso" value={`${info.weight} kg`} />}
        {info.height && <InfoRow label="Altura" value={`${info.height} cm`} />}
        {info.objective && <InfoRow label="Objetivo" value={info.objective} />}
        {info.startDate && <InfoRow label="Data de Início" value={info.startDate} />}
        {info.hydration && <InfoRow label="Hidratação" value={info.hydration} />}
      </div>

      {/* Macros summary */}
      {hasMacros && (
        <div className="mt-4 flex flex-wrap gap-3">
          {info.totalEnergy && (
            <MacroBadge label="Energia" value={`${info.totalEnergy} kcal`} />
          )}
          {info.protein && (
            <MacroBadge label="Proteína" value={`~${info.protein}g`} accent />
          )}
          {info.carbs && (
            <MacroBadge label="Carboidratos" value={`~${info.carbs}g`} />
          )}
          {info.fat && (
            <MacroBadge label="Lipídios" value={`~${info.fat}g`} />
          )}
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <p className="text-foreground">
    <span className="font-semibold">{label}:</span>{" "}
    <span className="text-muted-foreground">{value}</span>
  </p>
);

const MacroBadge = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <div
    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
      accent
        ? "bg-primary/15 text-primary border border-primary/20"
        : "bg-muted text-muted-foreground border border-border"
    }`}
  >
    <span className="block text-[10px] uppercase tracking-wider opacity-70">{label}</span>
    <span className="font-bold text-sm">{value}</span>
  </div>
);

export default StudentInfoHeader;
