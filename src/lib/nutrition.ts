import { DayLog, Food, Macros, NutritionTargets } from './nutritionTypes';
import { Atividade, Profile } from './trainingTypes';

const FATOR: Record<Atividade, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  alto: 1.725,
  muito_alto: 1.9,
};

/** Taxa metabólica basal (Mifflin-St Jeor) */
export function tmb(p: Pick<Profile, 'sexo' | 'pesoKg' | 'alturaCm' | 'idade'>): number {
  const base = 10 * p.pesoKg + 6.25 * p.alturaCm - 5 * p.idade;
  return p.sexo === 'M' ? base + 5 : base - 161;
}

/**
 * Gasto diário: TMB × fator do dia a dia + gasto aproximado dos treinos
 * (≈ 5 kcal/min de musculação distribuído pela semana).
 */
export function gastoDiario(p: Profile): number {
  const treino = (p.diasSemana * p.duracaoMin * 5) / 7;
  return tmb(p) * FATOR[p.atividade] + treino;
}

export interface TargetBreakdown extends NutritionTargets {
  tmb: number;
  gasto: number;
  ajuste: number;
}

export function computeTargets(p: Profile): TargetBreakdown {
  const gasto = gastoDiario(p);
  const ajuste = {
    hipertrofia: 0.1, // superávit leve
    forca: 0.1,
    emagrecimento: -0.2, // déficit moderado
    manutencao: 0,
  }[p.objetivo];
  const kcal = Math.round((gasto * (1 + ajuste)) / 10) * 10;
  const protPorKg = p.objetivo === 'emagrecimento' ? 2.2 : p.objetivo === 'manutencao' ? 1.8 : 2.0;
  const proteina = Math.round(p.pesoKg * protPorKg);
  const gordura = Math.round(Math.max(p.pesoKg * 0.8, (kcal * 0.25) / 9));
  const carbo = Math.max(0, Math.round((kcal - proteina * 4 - gordura * 9) / 4));
  return {
    kcal,
    p: proteina,
    c: carbo,
    g: gordura,
    aguaMl: Math.round((p.pesoKg * 35) / 50) * 50,
    manual: false,
    tmb: Math.round(tmb(p)),
    gasto: Math.round(gasto),
    ajuste,
  };
}

export function macrosFor(food: Pick<Food, 'kcal' | 'p' | 'c' | 'g'>, gramas: number): Macros {
  const f = gramas / 100;
  return { kcal: food.kcal * f, p: food.p * f, c: food.c * f, g: food.g * f };
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce((a, b) => ({ kcal: a.kcal + b.kcal, p: a.p + b.p, c: a.c + b.c, g: a.g + b.g }), { kcal: 0, p: 0, c: 0, g: 0 });
}

export function dayTotals(log: DayLog | undefined): Macros {
  if (!log) return { kcal: 0, p: 0, c: 0, g: 0 };
  return sumMacros(log.entries.map((e) => macrosFor(e.snapshot, e.gramas)));
}

/** Remove acentos e baixa caixa para busca */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function searchFoods(foods: Food[], q: string, limit = 60): Food[] {
  const terms = normalize(q).split(/[\s,]+/).filter(Boolean);
  if (!terms.length) return [];
  const scored: { f: Food; s: number }[] = [];
  for (const f of foods) {
    const n = normalize(f.nome);
    if (!terms.every((t) => n.includes(t))) continue;
    // Prioriza nomes que começam com o termo e nomes mais curtos.
    const s = (n.startsWith(terms[0]) ? 0 : 100) + n.length + (f.custom ? -50 : 0);
    scored.push({ f, s });
  }
  return scored.sort((a, b) => a.s - b.s).slice(0, limit).map((x) => x.f);
}
