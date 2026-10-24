export interface Portion {
  nome: string;
  g: number;
}

/** Valores por 100 g */
export interface Food {
  id: string;
  nome: string;
  cat: string;
  kcal: number;
  p: number;
  c: number;
  g: number;
  f: number;
  porcoes?: Portion[];
  custom?: boolean;
}

export type MealKey = 'cafe' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar' | 'ceia';

export const MEALS: { key: MealKey; nome: string }[] = [
  { key: 'cafe', nome: 'Café da manhã' },
  { key: 'lanche_manha', nome: 'Lanche da manhã' },
  { key: 'almoco', nome: 'Almoço' },
  { key: 'lanche_tarde', nome: 'Lanche da tarde / pré-treino' },
  { key: 'jantar', nome: 'Jantar' },
  { key: 'ceia', nome: 'Ceia' },
];

export interface FoodEntry {
  id: string;
  foodId: string;
  gramas: number;
  refeicao: MealKey;
  /** guarda nome e valores no momento do registro, caso o alimento personalizado seja apagado */
  snapshot: Pick<Food, 'nome' | 'kcal' | 'p' | 'c' | 'g'>;
}

export interface DayLog {
  entries: FoodEntry[];
  aguaMl: number;
}

export interface Macros {
  kcal: number;
  p: number;
  c: number;
  g: number;
}

export interface NutritionTargets extends Macros {
  aguaMl: number;
  /** true quando o usuário definiu as metas manualmente */
  manual: boolean;
}
