// Builds a rich student context string for AI prompts.
// Pulls profile, subscription, latest weight, current diet/training/protocol summaries.

export async function buildStudentContext(admin: any, userId: string): Promise<string> {
  if (!userId) return '';
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: profile },
    { data: sub },
    { data: weight },
    { data: diet },
    { data: training },
    { data: protocol },
  ] = await Promise.all([
    admin.from('profiles').select('full_name, objective, weight, height, age, gender, neat_level, phone').eq('user_id', userId).maybeSingle(),
    admin.from('subscriptions').select('status, end_date, plan_id').eq('user_id', userId).order('end_date', { ascending: false }).limit(1).maybeSingle(),
    admin.from('weight_logs').select('weight, waist_cm, hip_cm, logged_at').eq('user_id', userId).order('logged_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('student_diets').select('total_calories, total_protein, total_carbs, total_fat, water_goal_ml, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('student_trainings').select('name, frequency, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('student_protocols').select('name, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!profile) return '';

  const lines: string[] = ['=== DOSSIÊ DO ALUNO ==='];
  lines.push(`Nome: ${profile.full_name || '—'}`);
  if (profile.objective) lines.push(`Objetivo: ${profile.objective}`);
  const bio: string[] = [];
  if (profile.weight) bio.push(`${profile.weight}kg`);
  if (profile.height) bio.push(`${profile.height}cm`);
  if (profile.age) bio.push(`${profile.age}a`);
  if (profile.gender) bio.push(profile.gender);
  if (bio.length) lines.push(`Biometria: ${bio.join(' · ')}`);
  if (profile.neat_level) lines.push(`NEAT: ${profile.neat_level}`);

  if (sub) {
    const isActive = sub.status === 'active' && sub.end_date && sub.end_date >= today;
    lines.push(`Assinatura: ${sub.status} · vigência até ${sub.end_date || '—'} · ${isActive ? 'ATIVA' : 'INATIVA/VENCIDA'}`);
  } else {
    lines.push('Assinatura: nenhuma');
  }

  if (weight) {
    lines.push(`Última pesagem: ${weight.weight}kg em ${weight.logged_at?.slice(0, 10)}${weight.waist_cm ? ` · cintura ${weight.waist_cm}cm` : ''}`);
  }

  if (diet) {
    lines.push(`Dieta atual: ${diet.total_calories || '—'} kcal · P${diet.total_protein || '—'} C${diet.total_carbs || '—'} G${diet.total_fat || '—'} · água ${diet.water_goal_ml || '—'}ml`);
  }
  if (training) {
    lines.push(`Treino atual: ${training.name || '—'}${training.frequency ? ` · ${training.frequency}x/sem` : ''}`);
  }
  if (protocol) {
    lines.push(`Protocolo atual: ${protocol.name || '—'}`);
  }

  return lines.join('\n') + '\n';
}

export async function findStudentByPhone(admin: any, phone: string): Promise<string | null> {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 8) return null;
  const alt = digits.startsWith('55') ? digits.slice(2) : '55' + digits;
  const { data } = await admin
    .from('profiles')
    .select('user_id, phone')
    .or(`phone.eq.${digits},phone.eq.${alt}`)
    .limit(1);
  return data?.[0]?.user_id || null;
}