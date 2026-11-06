import { FOODS } from '../data/foods';
import { macrosFor, normalize, sumMacros } from './nutrition';
import { Food, FoodEntry, Macros, MealKey, MEALS } from './nutritionTypes';

type Papel = 'proteina' | 'carbo' | 'gordura' | 'fixo';

interface Opcao {
  id: string;
  /** Faixa em gramas: mínimo, máximo e passo do ajuste. */
  min: number;
  max: number;
  passo: number;
  /** Fácil digestão: as opções usadas com GLP-1 ou tirzepatida. */
  leve?: boolean;
  /** Outros nomes pelos quais o alimento pode ser excluído (ex.: iogurte também é "leite"). */
  tags?: string[];
}

const LEITE = ['leite', 'lactose', 'laticinio'];
const GLUTEN = ['gluten', 'trigo'];
const PEIXE = ['peixe', 'pescado', 'frutos do mar'];
const CASTANHA = ['castanha', 'oleaginosa', 'nozes'];

/** Grupos de alimentos que podem ocupar cada vaga de uma refeição. Um alimento só é trocado por outro do mesmo grupo. */
const POOLS = {
  proteinaPrato: [
    { id: 't410', min: 60, max: 280, passo: 10, leve: true, tags: ['ave', 'carne branca'] }, // frango grelhado
    { id: 't377', min: 60, max: 260, passo: 10, tags: ['boi', 'carne vermelha'] }, // patinho
    { id: 't351', min: 60, max: 260, passo: 10, tags: ['boi', 'carne vermelha'] }, // coxão mole
    { id: 't301', min: 80, max: 320, passo: 10, leve: true, tags: PEIXE }, // merluza
    { id: 't294', min: 80, max: 320, passo: 10, leve: true, tags: PEIXE }, // corvina
    { id: 't318', min: 60, max: 240, passo: 10, tags: PEIXE }, // sardinha assada
    { id: 't488', min: 50, max: 250, passo: 50, leve: true }, // ovo cozido
    { id: 't584', min: 100, max: 400, passo: 20, tags: ['soja'] }, // tofu
  ],
  proteinaCafe: [
    { id: 't488', min: 50, max: 200, passo: 50, leve: true }, // ovo cozido
    { id: 't449', min: 120, max: 400, passo: 10, leve: true, tags: LEITE }, // iogurte desnatado
    { id: 't469', min: 30, max: 160, passo: 10, leve: true, tags: LEITE }, // ricota
    { id: 't461', min: 30, max: 90, passo: 10, tags: LEITE }, // queijo minas
  ],
  proteinaLanche: [
    { id: 'x1', min: 15, max: 60, passo: 5, leve: true, tags: [...LEITE, 'suplemento'] }, // whey
    { id: 't449', min: 120, max: 400, passo: 10, leve: true, tags: LEITE }, // iogurte desnatado
    { id: 't469', min: 30, max: 160, passo: 10, leve: true, tags: LEITE }, // ricota
    { id: 't488', min: 50, max: 150, passo: 50, leve: true }, // ovo cozido
    { id: 't486', min: 30, max: 240, passo: 30, leve: true, tags: ['ovo'] }, // clara
  ],
  carboPrato: [
    { id: 't3', min: 45, max: 420, passo: 5, leve: true }, // arroz
    { id: 't1', min: 45, max: 420, passo: 5 }, // arroz integral
    { id: 't88', min: 60, max: 500, passo: 10, leve: true }, // batata-doce
    { id: 't91', min: 80, max: 600, passo: 10, leve: true }, // batata inglesa
    { id: 't129', min: 50, max: 400, passo: 10 }, // mandioca
  ],
  carboCafe: [
    { id: 't53', min: 25, max: 175, passo: 5, leve: true, tags: GLUTEN }, // pão francês
    { id: 't52', min: 25, max: 175, passo: 5, tags: GLUTEN }, // pão integral
    { id: 't7', min: 15, max: 110, passo: 5, leve: true, tags: GLUTEN }, // aveia
    { id: 't533', min: 50, max: 350, passo: 10, leve: true }, // cuscuz de milho
    { id: 'x4', min: 30, max: 170, passo: 10, leve: true }, // tapioca
  ],
  leguminosa: [
    { id: 't561', min: 40, max: 172, passo: 5 }, // feijão carioca
    { id: 't567', min: 40, max: 172, passo: 5 }, // feijão preto
    { id: 't577', min: 40, max: 172, passo: 5 }, // lentilha
  ],
  vegetal: [
    { id: 't100', min: 40, max: 200, passo: 10 }, // brócolis
    { id: 't109', min: 40, max: 200, passo: 10, leve: true }, // cenoura
    { id: 't70', min: 40, max: 200, passo: 10, leve: true }, // abobrinha
    { id: 't112', min: 40, max: 200, passo: 10, leve: true }, // chuchu
    { id: 't97', min: 40, max: 200, passo: 10, leve: true }, // beterraba
    { id: 't157', min: 40, max: 200, passo: 10 }, // tomate
    { id: 't78', min: 20, max: 120, passo: 10 }, // alface
  ],
  fruta: [
    { id: 't179', min: 50, max: 180, passo: 10, leve: true }, // banana
    { id: 't222', min: 60, max: 200, passo: 10, leve: true }, // maçã
    { id: 't236', min: 80, max: 220, passo: 10, leve: true }, // melão
    { id: 't239', min: 80, max: 220, passo: 10, leve: true }, // morango
    { id: 't214', min: 80, max: 220, passo: 10 }, // laranja
    { id: 't164', min: 80, max: 220, passo: 10 }, // abacaxi
  ],
  gorduraPrato: [{ id: 't260', min: 3, max: 40, passo: 1, leve: true }], // azeite
  gorduraLanche: [
    { id: 't589', min: 5, max: 40, passo: 5, tags: CASTANHA }, // castanha-do-brasil
    { id: 't587', min: 5, max: 40, passo: 5, tags: CASTANHA }, // amêndoa
    { id: 'x3', min: 5, max: 45, passo: 5, tags: ['amendoim'] }, // pasta de amendoim
  ],
} satisfies Record<string, Opcao[]>;

type PoolKey = keyof typeof POOLS;

interface Vaga {
  pool: PoolKey;
  papel: Papel;
  /** Quantidade inicial das vagas que não entram no ajuste, em gramas. */
  gramas?: number;
  /** Fica de fora para quem usa GLP-1: pesa mais em porções pequenas. */
  semGlp1?: boolean;
}

const PRATO: Vaga[] = [
  { pool: 'proteinaPrato', papel: 'proteina' },
  { pool: 'carboPrato', papel: 'carbo' },
  { pool: 'leguminosa', papel: 'fixo', gramas: 86, semGlp1: true },
  { pool: 'vegetal', papel: 'fixo', gramas: 100 },
  { pool: 'gorduraPrato', papel: 'gordura' },
];
const CAFE: Vaga[] = [
  { pool: 'proteinaCafe', papel: 'proteina' },
  { pool: 'carboCafe', papel: 'carbo' },
  { pool: 'fruta', papel: 'fixo', gramas: 100 },
];
const LANCHE: Vaga[] = [
  { pool: 'proteinaLanche', papel: 'proteina' },
  { pool: 'fruta', papel: 'carbo' },
  { pool: 'gorduraLanche', papel: 'gordura', semGlp1: true },
];
const CEIA: Vaga[] = [
  { pool: 'proteinaLanche', papel: 'proteina' },
  { pool: 'fruta', papel: 'carbo' },
];

const MODELOS: Record<MealKey, Vaga[]> = { cafe: CAFE, lanche_manha: LANCHE, almoco: PRATO, lanche_tarde: LANCHE, jantar: PRATO, ceia: CEIA };

/** Parte do dia que cabe a cada refeição. Com GLP-1, refeições menores e mais frequentes. */
const DIVISAO_PADRAO: Partial<Record<MealKey, number>> = { cafe: 0.25, almoco: 0.35, lanche_tarde: 0.15, jantar: 0.25 };
const DIVISAO_GLP1: Partial<Record<MealKey, number>> = { cafe: 0.2, lanche_manha: 0.1, almoco: 0.25, lanche_tarde: 0.15, jantar: 0.2, ceia: 0.1 };

export interface PlanInput {
  targets: Macros;
  glp1?: boolean;
  /** O que a pessoa não come, em texto livre (ex.: "peixe", "leite"). */
  excluidos?: string[];
}

export interface PlanItem {
  /** Identifica o item no cardápio. */
  key: string;
  food: Food;
  gramas: number;
  pool: PoolKey;
  papel: Papel;
}

export interface PlannedMeal {
  refeicao: MealKey;
  nome: string;
  itens: PlanItem[];
}

export type MealPlan = PlannedMeal[];

const FOOD_BY_ID = new Map(FOODS.map((f) => [f.id, f]));

export const POOL_FOOD_IDS: string[] = Object.values(POOLS).flatMap((pool: Opcao[]) => pool.map((o) => o.id));

function excludedTerms(excluidos: string[] = []): string[] {
  // Sem o "s" final, "ovos" também encontra "ovo" e "peixes" encontra "peixe".
  return excluidos.map((t) => normalize(t.trim())).filter(Boolean).map((t) => (t.length > 3 ? t.replace(/s$/, '') : t));
}

function isExcluded(o: Opcao, termos: string[]): boolean {
  const alvo = normalize(`${FOOD_BY_ID.get(o.id)?.nome ?? ''} ${(o.tags ?? []).join(' ')}`);
  return termos.some((t) => alvo.includes(t));
}

/** Opções permitidas no grupo. Com GLP-1, prefere as leves, mas usa as outras se as exclusões não deixarem nenhuma. */
function optionsFor(pool: PoolKey, input: PlanInput): Opcao[] {
  const termos = excludedTerms(input.excluidos);
  const livres = (POOLS[pool] as Opcao[]).filter((o) => FOOD_BY_ID.has(o.id) && !isExcluded(o, termos));
  if (!input.glp1) return livres;
  const leves = livres.filter((o) => o.leve);
  return leves.length ? leves : livres;
}

function optionOf(item: PlanItem): Opcao {
  return (POOLS[item.pool] as Opcao[]).find((o) => o.id === item.food.id)!;
}

/** Gerador simples com semente: o mesmo cardápio para a mesma semente, o que também permite testar. */
function random(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (n: number, o: Opcao) => Math.min(o.max, Math.max(o.min, n));
const round = (n: number, o: Opcao) => clamp(Math.round(n / o.passo) * o.passo, o);
const macros = (i: PlanItem) => macrosFor(i.food, i.gramas);

export function planTotals(plan: MealPlan): Macros {
  return sumMacros(plan.flatMap((m) => m.itens.map(macros)));
}

/** Ajusta os itens de um papel para que a refeição chegue ao alvo daquele nutriente. */
function fit(itens: PlanItem[], papel: Papel, alvo: number, nutriente: keyof Macros) {
  const grupo = itens.filter((i) => i.papel === papel);
  if (!grupo.length) return;
  const resto = sumMacros(itens.filter((i) => i.papel !== papel).map(macros))[nutriente];
  const porGrama = grupo.reduce((a, i) => a + i.food[nutriente] / 100, 0);
  if (porGrama <= 0) return;
  const gramas = Math.max(0, alvo - resto) / porGrama;
  for (const i of grupo) i.gramas = clamp(gramas, optionOf(i));
}

/** Corrige o que sobrou depois de arredondar, um passo por vez, até ficar perto da meta do dia. */
function nudge(plan: MealPlan, targets: Macros) {
  const itens = plan.flatMap((m) => m.itens);
  const room = (i: PlanItem, dir: 1 | -1) => {
    const o = optionOf(i);
    return dir > 0 ? i.gramas + o.passo <= o.max : i.gramas - o.passo >= o.min;
  };
  const step = (papeis: Papel[], dir: 1 | -1): boolean => {
    for (const papel of papeis) {
      const opcoes = itens.filter((i) => i.papel === papel && room(i, dir));
      if (!opcoes.length) continue;
      // Move o item mais longe do limite, para não concentrar tudo em uma refeição.
      const uso = (i: PlanItem) => i.gramas / optionOf(i).max;
      const alvo = opcoes.reduce((a, b) => ((dir > 0 ? uso(b) < uso(a) : uso(b) > uso(a)) ? b : a));
      alvo.gramas += dir * optionOf(alvo).passo;
      return true;
    }
    return false;
  };

  const FOLGA = 0.02;
  // Limite: o passo de um ovo pode ser maior que a folga, e a proteína ficaria oscilando sem nunca acertar.
  let ajustesProteina = 60;
  for (let n = 0; n < 500; n++) {
    const t = planTotals(plan);
    const erroP = targets.p - t.p;
    const erroKcal = targets.kcal - t.kcal;
    if (Math.abs(erroP) > targets.p * FOLGA && ajustesProteina > 0) {
      ajustesProteina--;
      if (step(['proteina'], erroP > 0 ? 1 : -1)) continue;
    }
    if (Math.abs(erroKcal) <= targets.kcal * FOLGA) return;
    const moved = step(['carbo', 'gordura', 'fixo'], erroKcal > 0 ? 1 : -1);
    if (!moved) return;
  }
}

/**
 * O sorteio pode juntar alimentos que não alcançam a meta nem na porção máxima, como tofu e iogurte
 * para quem precisa de muita proteína. Troca os mais fracos por opções mais densas do mesmo grupo.
 */
function ensureCapacity(plan: MealPlan, input: PlanInput, papel: Papel, nutriente: 'p' | 'c', necessario: number) {
  const capacidade = (id: string, o: Opcao) => (o.max * FOOD_BY_ID.get(id)![nutriente]) / 100;
  for (let n = 0; n < 12; n++) {
    const itens = plan.flatMap((m) => m.itens.filter((i) => i.papel === papel).map((item) => ({ item, meal: m })));
    if (itens.reduce((a, { item }) => a + capacidade(item.food.id, optionOf(item)), 0) >= necessario) return;

    let melhor: { item: PlanItem; opcao: Opcao; ganho: number } | undefined;
    for (const { item, meal } of itens) {
      const naRefeicao = new Set(meal.itens.map((i) => i.food.id));
      for (const opcao of optionsFor(item.pool, input)) {
        if (naRefeicao.has(opcao.id)) continue;
        const ganho = capacidade(opcao.id, opcao) - capacidade(item.food.id, optionOf(item));
        if (ganho > (melhor?.ganho ?? 0)) melhor = { item, opcao, ganho };
      }
    }
    if (!melhor) return;
    melhor.item.food = FOOD_BY_ID.get(melhor.opcao.id)!;
    melhor.item.gramas = melhor.opcao.min;
  }
}

export function generateMealPlan(input: PlanInput, seed = 1): MealPlan {
  const rand = random(seed);
  const divisao = input.glp1 ? DIVISAO_GLP1 : DIVISAO_PADRAO;
  const usados = new Set<string>();

  const plan: MealPlan = MEALS.filter((m) => divisao[m.key]).map((m) => ({
    refeicao: m.key,
    nome: m.nome,
    itens: MODELOS[m.key]
      .filter((v) => !(input.glp1 && v.semGlp1))
      .flatMap((v, idx): PlanItem[] => {
        const todas = optionsFor(v.pool, input);
        if (!todas.length) return [];
        // Varia entre as refeições enquanto houver alternativa.
        const novas = todas.filter((o) => !usados.has(o.id));
        const lista = novas.length ? novas : todas;
        const o = lista[Math.floor(rand() * lista.length)];
        usados.add(o.id);
        return [{ key: `${m.key}-${idx}`, food: FOOD_BY_ID.get(o.id)!, gramas: v.gramas ? clamp(v.gramas * (divisao[m.key]! / 0.25), o) : o.min, pool: v.pool, papel: v.papel }];
      }),
  }));

  ensureCapacity(plan, input, 'proteina', 'p', input.targets.p * 1.25);
  ensureCapacity(plan, input, 'carbo', 'c', input.targets.c * 1.25);

  // O ajuste de um papel muda o que falta para os outros, por isso algumas passadas.
  for (let passada = 0; passada < 5; passada++) {
    for (const m of plan) {
      const parte = divisao[m.refeicao]!;
      fit(m.itens, 'proteina', input.targets.p * parte, 'p');
      fit(m.itens, 'gordura', input.targets.g * parte, 'g');
      fit(m.itens, 'carbo', input.targets.kcal * parte, 'kcal');
    }
  }
  for (const i of plan.flatMap((m) => m.itens)) i.gramas = round(i.gramas, optionOf(i));
  nudge(plan, input.targets);
  return plan;
}

const within = (valor: number, meta: number) => meta <= 0 || Math.abs(valor - meta) / meta <= 0.05;

/** Se o cardápio ficou a ±5% das calorias e da proteína da meta. */
export function planOnTarget(totals: Macros, targets: Macros): { kcal: boolean; p: boolean } {
  return { kcal: within(totals.kcal, targets.kcal), p: within(totals.p, targets.p) };
}

/** Alimentos que podem substituir o item: mesmo grupo, sem os excluídos nem os que já estão na refeição. */
export function swapOptions(plan: MealPlan, key: string, input: Pick<PlanInput, 'excluidos'>): Food[] {
  const meal = plan.find((m) => m.itens.some((i) => i.key === key));
  const item = meal?.itens.find((i) => i.key === key);
  if (!meal || !item) return [];
  const naRefeicao = new Set(meal.itens.map((i) => i.food.id));
  // Aqui não filtra por "leve": quem troca escolhe de propósito.
  return optionsFor(item.pool, { targets: { kcal: 0, p: 0, c: 0, g: 0 }, excluidos: input.excluidos })
    .filter((o) => !naRefeicao.has(o.id))
    .map((o) => FOOD_BY_ID.get(o.id)!);
}

function mapItem(plan: MealPlan, key: string, fn: (i: PlanItem) => PlanItem): MealPlan {
  return plan.map((m) => (m.itens.some((i) => i.key === key) ? { ...m, itens: m.itens.map((i) => (i.key === key ? fn(i) : i)) } : m));
}

/** Troca o alimento por uma quantidade equivalente no que importa para aquele item. */
export function swapItem(plan: MealPlan, key: string, foodId: string): MealPlan {
  return mapItem(plan, key, (i) => {
    const novo = FOOD_BY_ID.get(foodId);
    const o = (POOLS[i.pool] as Opcao[]).find((x) => x.id === foodId);
    if (!novo || !o) return i;
    const nutriente: keyof Macros = i.papel === 'proteina' ? 'p' : i.papel === 'carbo' ? 'c' : 'kcal';
    const atual = macros(i)[nutriente];
    const gramas = novo[nutriente] > 0 ? (atual / novo[nutriente]) * 100 : o.min;
    return { ...i, food: novo, gramas: round(gramas, o) };
  });
}

export function setItemGrams(plan: MealPlan, key: string, gramas: number): MealPlan {
  return gramas > 0 ? mapItem(plan, key, (i) => ({ ...i, gramas: Math.round(gramas) })) : plan;
}

export function removeItem(plan: MealPlan, key: string): MealPlan {
  return plan.map((m) => ({ ...m, itens: m.itens.filter((i) => i.key !== key) })).filter((m) => m.itens.length);
}

/** Registros do diário equivalentes ao cardápio. */
export function planEntries(plan: MealPlan): Omit<FoodEntry, 'id'>[] {
  return plan.flatMap((m) =>
    m.itens.map((i) => ({
      foodId: i.food.id,
      gramas: i.gramas,
      refeicao: m.refeicao,
      snapshot: { nome: i.food.nome, kcal: i.food.kcal, p: i.food.p, c: i.food.c, g: i.food.g },
    })),
  );
}

/** Tradução da quantidade para medida caseira, quando o alimento tem uma (ex.: "≈ 2 colheres de servir"). */
export function portionHint(food: Food, gramas: number): string | undefined {
  const p = food.porcoes?.[0];
  if (!p) return undefined;
  const qtd = Math.round((gramas / p.g) * 2) / 2;
  if (qtd <= 0) return undefined;
  const texto = String(qtd).replace('.', ',');
  const nome = p.nome.replace(/^1 /, '');
  if (qtd < 2) return `≈ ${texto} ${nome}`;
  // Vão para o plural o substantivo e o adjetivo que o acompanha: "colher de servir" vira "colheres de servir", "unidade média" vira "unidades médias".
  const [primeira, ...resto] = nome.split(' ');
  const plural = primeira === 'pão' ? 'pães' : primeira.endsWith('r') ? `${primeira}es` : `${primeira}s`;
  const seguintes = resto.map((p) => (p === 'média' || p === 'médio' ? `${p}s` : p));
  return `≈ ${texto} ${[plural, ...seguintes].join(' ')}`;
}
