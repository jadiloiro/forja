import { DayLog, Food, Macros, NutritionTargets } from './nutritionTypes';
import { Atividade, Profile, Ritmo, RITMO_LABEL } from './trainingTypes';

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
  /** Como cada número foi calculado. */
  explicacao: string[];
  /** O que limitou o cálculo ou merece atenção. */
  avisos: string[];
  /** Lembretes para quem usa GLP-1 ou tirzepatida. */
  lembretes: string[];
}

/** Perda por semana, como fração do peso atual. */
const RITMO_PERDA: Record<Ritmo, number> = { leve: 0.005, moderado: 0.0075, acelerado: 0.01 };
/** Superávit sobre o gasto diário. */
const RITMO_GANHO: Record<Ritmo, number> = { leve: 0.05, moderado: 0.1, acelerado: 0.15 };
const PERDA_MAXIMA = RITMO_PERDA.acelerado;
const DEFICIT_PADRAO = -0.2;
const SUPERAVIT_PADRAO = 0.1;
const KCAL_POR_KG = 7700;

const decimal = (n: number, casas = 1) => n.toFixed(casas).replace('.', ',');

export function imc(p: Pick<Profile, 'pesoKg' | 'alturaCm'>): number {
  return p.pesoKg / (p.alturaCm / 100) ** 2;
}

const GLP1 = /tirzepatida|mounjaro|zepbound|semaglutida|ozempic|wegovy|rybelsus|liraglutida|saxenda|victoza|dulaglutida|trulicity/;

/** Marcado pelo atalho ou digitado como "Outro". */
export function usesGlp1(p: Pick<Profile, 'medicamentos'>): boolean {
  return (p.medicamentos ?? []).some((m) => m.atalho || GLP1.test(normalize(m.nome)));
}

/** Com IMC alto, proteína e gordura sobre o peso atual dariam números irreais. */
function referenceWeight(p: Profile): { kg: number; descricao: string } {
  if (imc(p) <= 30) return { kg: p.pesoKg, descricao: 'seu peso atual' };
  if (p.pesoMetaKg && p.pesoMetaKg < p.pesoKg) return { kg: p.pesoMetaKg, descricao: 'sua meta de peso, porque o IMC está acima de 30' };
  return { kg: 25 * (p.alturaCm / 100) ** 2, descricao: 'o peso equivalente a IMC 25, porque o IMC está acima de 30' };
}

/** Fração do peso a perder por semana: pelo ritmo escolhido ou, sem ele, pela meta e pelo prazo. */
function weeklyLoss(p: Profile, meta: number | undefined): number | undefined {
  if (p.ritmo) return RITMO_PERDA[p.ritmo];
  if (meta && p.prazoSemanas) return Math.min(PERDA_MAXIMA, (p.pesoKg - meta) / p.prazoSemanas / p.pesoKg);
  return undefined;
}

export function computeTargets(p: Profile): TargetBreakdown {
  const gasto = gastoDiario(p);
  const basal = tmb(p);
  const perdendo = p.objetivo === 'emagrecimento';
  const ganhando = p.objetivo === 'hipertrofia' || p.objetivo === 'forca';
  const metaAbaixo = p.pesoMetaKg && p.pesoMetaKg < p.pesoKg ? p.pesoMetaKg : undefined;
  const perda = perdendo ? weeklyLoss(p, metaAbaixo) : undefined;

  const explicacao = [`Metabolismo basal de ${Math.round(basal)} kcal e gasto diário estimado de ${Math.round(gasto)} kcal.`];
  const avisos: string[] = [];

  let alvo = gasto;
  if (perda !== undefined) {
    const deficit = (p.pesoKg * perda * KCAL_POR_KG) / 7;
    alvo = gasto - deficit;
    const origem = p.ritmo ? `Ritmo ${RITMO_LABEL[p.ritmo].toLowerCase()}` : 'Pela sua meta e prazo';
    explicacao.push(`${origem}: perder cerca de ${decimal(p.pesoKg * perda)} kg por semana (${decimal(perda * 100, 2)}% do peso), um déficit de ${Math.round(deficit)} kcal por dia.`);
  } else if (perdendo) {
    alvo = gasto * (1 + DEFICIT_PADRAO);
    explicacao.push('Déficit padrão de 20%. Escolha um ritmo no Perfil para ajustar.');
  } else if (ganhando) {
    const superavit = p.ritmo ? RITMO_GANHO[p.ritmo] : SUPERAVIT_PADRAO;
    alvo = gasto * (1 + superavit);
    explicacao.push(`${p.ritmo ? `Ritmo ${RITMO_LABEL[p.ritmo].toLowerCase()}: superávit` : 'Superávit padrão'} de ${Math.round(superavit * 100)}% sobre o gasto.`);
  } else {
    explicacao.push('Calorias iguais ao gasto, para manter o peso.');
  }

  let kcal = Math.round(alvo / 10) * 10;
  if (kcal < basal) {
    const piso = Math.ceil(basal / 10) * 10;
    avisos.push(`O cálculo daria ${kcal} kcal, abaixo do metabolismo basal. A meta ficou em ${piso} kcal, então a perda será mais lenta que o calculado.`);
    kcal = piso;
  }

  if (perdendo && metaAbaixo) {
    const kgPorSemana = ((gasto - kcal) * 7) / KCAL_POR_KG;
    if (kgPorSemana > 0) {
      const semanas = Math.ceil((p.pesoKg - metaAbaixo) / kgPorSemana);
      explicacao.push(`Nesse ritmo, chegar a ${decimal(metaAbaixo)} kg leva cerca de ${semanas} semanas.`);
      if (p.prazoSemanas && p.prazoSemanas < semanas) avisos.push(`Seu prazo de ${p.prazoSemanas} semanas é mais curto que essa estimativa. A meta de calorias não acelera além do limite de ${decimal(PERDA_MAXIMA * 100, 0)}% do peso por semana nem abaixo do metabolismo basal.`);
    }
  }
  if (perdendo && p.pesoMetaKg && !metaAbaixo) avisos.push('Seu peso já está na meta ou abaixo dela. Vale rever a meta ou mudar o objetivo para manter o peso.');
  if (p.pesoMetaKg && imc({ pesoKg: p.pesoMetaKg, alturaCm: p.alturaCm }) < 18.5) avisos.push('Sua meta de peso corresponde a um IMC abaixo de 18,5. Converse com um profissional de saúde sobre ela.');

  const glp1 = usesGlp1(p);
  const lembretes: string[] = [];
  if (glp1) {
    lembretes.push('Priorize a proteína em cada refeição, para ajudar a preservar a massa muscular.');
    lembretes.push('Beba água ao longo do dia e inclua alimentos ricos em fibras.');
    lembretes.push('Refeições menores podem ser mais fáceis de manter quando o apetite está baixo.');
    avisos.push('Estas metas são uma estimativa. Alinhe-as com o médico ou nutricionista que acompanha o seu tratamento.');
  }

  const base = p.objetivo === 'emagrecimento' ? 2.2 : p.objetivo === 'manutencao' ? 1.8 : 2.0;
  const protPorKg = glp1 ? Math.max(base, 2.2) : base;
  const referencia = referenceWeight(p);
  const proteina = Math.round(referencia.kg * protPorKg);
  const gordura = Math.round(Math.max(referencia.kg * 0.8, (kcal * 0.25) / 9));
  const carbo = Math.max(0, Math.round((kcal - proteina * 4 - gordura * 9) / 4));
  explicacao.push(`Proteína de ${decimal(protPorKg)} g por kg sobre ${decimal(referencia.kg)} kg (${referencia.descricao}). Gordura de pelo menos 25% das calorias, e o carboidrato completa o restante.`);

  return {
    kcal,
    p: proteina,
    c: carbo,
    g: gordura,
    aguaMl: Math.round((p.pesoKg * 35) / 50) * 50,
    manual: false,
    tmb: Math.round(basal),
    gasto: Math.round(gasto),
    // "|| 0": sem isso, o arredondamento de quem mantém o peso daria -0.
    ajuste: Math.round((kcal / gasto - 1) * 100) / 100 || 0,
    explicacao,
    avisos,
    lembretes,
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
