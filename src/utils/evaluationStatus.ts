export function getEvaluationStatus(
  role: 'Membro' | 'Diretor' | string,
  lastEvalDateStr: string | null
): 'pending' | 'up-to-date' {
  if (!lastEvalDateStr) return 'pending';
  
  const now = new Date();
  const lastDate = new Date(lastEvalDateStr);

  if (role === 'Diretor') {
    // Evita a mutação criando um novo objeto Date
    const monday = new Date(now);
    const day = monday.getDay();
    monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    
    return lastDate >= monday ? 'up-to-date' : 'pending';
  }

  // Usa Math.floor para evitar bug de arredondamento
  const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / 86_400_000); // 86.400.000 ms = 1 dia
  return diffDays < 15 ? 'up-to-date' : 'pending';
}

export function getCycleStartDate(role: 'Membro' | 'Diretor' | string): Date {
  const now = new Date();
  if (role === 'Diretor' || role === 'Gestor') {
    const monday = new Date(now);
    const day = monday.getDay();
    monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
  return new Date(now.getTime() - 15 * 86_400_000);
}