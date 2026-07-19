// Aplica a janela de liberação (start_date / end_date / visible) a uma query
// de student_workout_assignments ou student_program_assignments — mesma
// lógica de agendamento usada nas dietas.
export const todayISO = () => new Date().toISOString().slice(0, 10);

export function applyAssignmentWindow<T extends { eq: any; or: any }>(query: T): T {
  const today = todayISO();
  return query
    .eq("visible", true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`);
}

export function isWithinWindow(row: { start_date?: string | null; end_date?: string | null; visible?: boolean | null }): boolean {
  if (row.visible === false) return false;
  const t = todayISO();
  if (row.start_date && row.start_date > t) return false;
  if (row.end_date && row.end_date < t) return false;
  return true;
}