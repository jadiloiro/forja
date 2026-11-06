import { FOODS } from '../../data/foods';
import {
  generateMealPlan,
  MealPlan,
  planEntries,
  planOnTarget,
  planTotals,
  POOL_FOOD_IDS,
  portionHint,
  removeItem,
  setItemGrams,
  swapItem,
  swapOptions,
} from '../mealPlanner';
import { computeTargets, macrosFor, normalize } from '../nutrition';
import { Objetivo, Profile, Ritmo, Sexo } from '../trainingTypes';

const perfil: Profile = {
  nome: 'Teste',
  sexo: 'M',
  idade: 35,
  alturaCm: 175,
  pesoKg: 80,
  nivel: 'intermediario',
  objetivo: 'emagrecimento',
  diasSemana: 4,
  duracaoMin: 60,
  atividade: 'leve',
  prioridades: [],
};

const META = { kcal: 2200, p: 170, c: 220, g: 70 };
const itens = (plan: MealPlan) => plan.flatMap((m) => m.itens);
const nomes = (plan: MealPlan) => itens(plan).map((i) => normalize(i.food.nome));

const OBJETIVOS: Objetivo[] = ['emagrecimento', 'hipertrofia', 'forca', 'manutencao'];
const RITMOS: (Ritmo | undefined)[] = [undefined, 'leve', 'moderado', 'acelerado'];
const SEXOS: Sexo[] = ['M', 'F'];
const PESOS: [number, number][] = [
  [55, 160],
  [70, 165],
  [85, 178],
  [110, 175],
  [130, 180],
];

const PERFIS: Profile[] = OBJETIVOS.flatMap((objetivo) =>
  RITMOS.flatMap((ritmo) => SEXOS.flatMap((sexo) => PESOS.map(([pesoKg, alturaCm]) => ({ ...perfil, objetivo, ritmo, sexo, pesoKg, alturaCm })))),
);

describe('catálogo do planejador', () => {
  test('todo alimento existe na base', () => {
    const ids = new Set(FOODS.map((f) => f.id));
    for (const id of POOL_FOOD_IDS) expect(ids.has(id)).toBe(true);
  });
});

describe('generateMealPlan', () => {
  test.each([false, true])('critério do card: fica a ±5%% de calorias e proteína em todos os perfis (GLP-1: %s)', (glp1) => {
    for (const p of PERFIS) {
      const targets = computeTargets(p);
      for (let seed = 1; seed <= 8; seed++) {
        const plan = generateMealPlan({ targets, glp1 }, seed);
        const total = planTotals(plan);
        const ok = planOnTarget(total, targets);
        if (!ok.kcal || !ok.p) throw new Error(`${p.objetivo} ${p.ritmo} ${p.sexo} ${p.pesoKg} kg seed ${seed}: ${Math.round(total.kcal)}/${targets.kcal} kcal, ${Math.round(total.p)}/${targets.p} g`);
      }
    }
  });

  test('carboidrato e gordura também ficam perto da meta', () => {
    const targets = computeTargets({ ...perfil, ritmo: 'moderado' });
    const total = planTotals(generateMealPlan({ targets }, 3));
    expect(Math.abs(total.c - targets.c) / targets.c).toBeLessThan(0.2);
    expect(Math.abs(total.g - targets.g) / targets.g).toBeLessThan(0.25);
  });

  test('fruta não vira uma refeição à parte', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const i of itens(generateMealPlan({ targets: { kcal: 3400, p: 180, c: 480, g: 90 }, glp1: true }, seed))) {
        if (i.pool === 'fruta') expect(i.gramas).toBeLessThanOrEqual(220);
      }
    }
  });

  test('toda quantidade respeita um mínimo e fica em números redondos', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const i of itens(generateMealPlan({ targets: META }, seed))) {
        expect(i.gramas).toBeGreaterThan(0);
        expect(Number.isInteger(i.gramas)).toBe(true);
      }
    }
  });

  test('a mesma semente dá o mesmo cardápio, e sementes diferentes variam', () => {
    const ids = (seed: number) => nomes(generateMealPlan({ targets: META }, seed)).join();
    expect(ids(5)).toBe(ids(5));
    expect(new Set([1, 2, 3, 4, 5, 6, 7, 8].map(ids)).size).toBeGreaterThan(4);
  });

  test('segue o padrão brasileiro: quatro refeições, com arroz ou similar, leguminosa e proteína no almoço', () => {
    const plan = generateMealPlan({ targets: META }, 1);
    expect(plan.map((m) => m.refeicao)).toEqual(['cafe', 'almoco', 'lanche_tarde', 'jantar']);
    const almoco = plan.find((m) => m.refeicao === 'almoco')!;
    expect(almoco.itens.map((i) => i.pool)).toEqual(expect.arrayContaining(['proteinaPrato', 'carboPrato', 'leguminosa', 'vegetal']));
  });

  test('o almoço é a maior refeição', () => {
    const plan = generateMealPlan({ targets: META }, 2);
    const kcal = (k: string) => planTotals(plan.filter((m) => m.refeicao === k)).kcal;
    expect(kcal('almoco')).toBeGreaterThan(kcal('lanche_tarde'));
    expect(kcal('almoco')).toBeGreaterThan(kcal('cafe'));
  });

  test('não repete a mesma proteína no almoço e no jantar', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const plan = generateMealPlan({ targets: META }, seed);
      const proteina = (k: string) => plan.find((m) => m.refeicao === k)!.itens.find((i) => i.papel === 'proteina')!.food.id;
      expect(proteina('almoco')).not.toBe(proteina('jantar'));
    }
  });
});

describe('com GLP-1 ou tirzepatida', () => {
  const targets = computeTargets({ ...perfil, ritmo: 'moderado', medicamentos: [{ nome: 'Mounjaro', atalho: 'tirzepatida' }] });

  test('faz refeições menores e mais frequentes', () => {
    const glp1 = generateMealPlan({ targets, glp1: true }, 1);
    const normal = generateMealPlan({ targets }, 1);
    expect(glp1).toHaveLength(6);
    const maior = (plan: MealPlan) => Math.max(...plan.map((m) => planTotals([m]).kcal));
    expect(maior(glp1)).toBeLessThan(maior(normal));
  });

  test('tem proteína em todas as refeições', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const m of generateMealPlan({ targets, glp1: true }, seed)) {
        expect(m.itens.some((i) => i.papel === 'proteina')).toBe(true);
        expect(planTotals([m]).p).toBeGreaterThan(5);
      }
    }
  });

  test('só usa opções leves: sem leguminosas, oleaginosas ou carne vermelha', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const plan = generateMealPlan({ targets, glp1: true }, seed);
      expect(itens(plan).map((i) => i.pool)).not.toEqual(expect.arrayContaining(['leguminosa']));
      expect(itens(plan).map((i) => i.pool)).not.toEqual(expect.arrayContaining(['gorduraLanche']));
      expect(nomes(plan).some((n) => n.includes('bovina'))).toBe(false);
    }
  });

  test('se as exclusões tirarem as opções leves, usa as outras em vez de deixar sem proteína', () => {
    const plan = generateMealPlan({ targets, glp1: true, excluidos: ['frango', 'peixe', 'ovo'] }, 1);
    for (const m of plan.filter((x) => x.refeicao === 'almoco' || x.refeicao === 'jantar')) {
      expect(m.itens.some((i) => i.papel === 'proteina')).toBe(true);
    }
  });
});

describe('alimentos excluídos', () => {
  test.each([
    ['peixe', ['merluza', 'corvina', 'sardinha']],
    ['peixes', ['merluza', 'corvina', 'sardinha']],
    ['Leite', ['iogurte', 'ricota', 'queijo, minas', 'whey']],
    ['lactose', ['iogurte', 'ricota', 'queijo, minas', 'whey']],
    ['ovos', ['ovo']],
    ['carne vermelha', ['bovina']],
    ['glúten', ['pao', 'aveia']],
    ['castanha', ['castanha', 'amendoa']],
  ])('"%s" nunca aparece', (termo, proibidos) => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const nome of nomes(generateMealPlan({ targets: META, excluidos: [termo] }, seed))) {
        for (const p of proibidos) expect(nome).not.toContain(p);
      }
    }
  });

  test('o termo é procurado no nome, sem diferenciar maiúsculas e acentos', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(nomes(generateMealPlan({ targets: META, excluidos: ['  BRÓCOLIS '] }, seed)).some((n) => n.includes('brocolis'))).toBe(false);
    }
  });

  test('termo em branco não exclui nada', () => {
    expect(nomes(generateMealPlan({ targets: META, excluidos: ['', '   '] }, 1))).toEqual(nomes(generateMealPlan({ targets: META }, 1)));
  });

  test('com várias exclusões, ainda fica a ±5%', () => {
    const excluidos = ['peixe', 'carne vermelha', 'leite'];
    for (let seed = 1; seed <= 20; seed++) {
      const ok = planOnTarget(planTotals(generateMealPlan({ targets: META, excluidos }, seed)), META);
      expect(ok).toEqual({ kcal: true, p: true });
    }
  });

  test('meta impossível de alcançar é informada, não escondida', () => {
    const excluidos = ['frango', 'carne', 'peixe', 'ovo', 'leite', 'tofu', 'soja'];
    const alta = { kcal: 3000, p: 250, c: 300, g: 80 };
    expect(planOnTarget(planTotals(generateMealPlan({ targets: alta, excluidos }, 1)), alta).p).toBe(false);
  });

  test('excluir tudo de um grupo só tira aquele item da refeição', () => {
    const plan = generateMealPlan({ targets: META, excluidos: ['azeite'] }, 1);
    expect(plan.find((m) => m.refeicao === 'almoco')!.itens.some((i) => i.pool === 'gorduraPrato')).toBe(false);
  });
});

describe('edição do cardápio', () => {
  const base = generateMealPlan({ targets: META }, 1);
  const achar = (plan: MealPlan, pool: string) => itens(plan).find((i) => i.pool === pool)!;

  test('trocar proteína mantém a proteína aproximada e não muda o resto', () => {
    const item = achar(base, 'proteinaPrato');
    const outro = swapOptions(base, item.key, {})[0];
    const novo = swapItem(base, item.key, outro.id);
    const trocado = itens(novo).find((i) => i.key === item.key)!;

    expect(trocado.food.id).toBe(outro.id);
    const p = (i: typeof item) => macrosFor(i.food, i.gramas).p;
    expect(Math.abs(p(trocado) - p(item))).toBeLessThanOrEqual(Math.max(8, p(item) * 0.25));
    expect(itens(novo).filter((i) => i.key !== item.key)).toEqual(itens(base).filter((i) => i.key !== item.key));
  });

  test('trocar carboidrato mantém o carboidrato aproximado', () => {
    const item = achar(base, 'carboPrato');
    const outro = swapOptions(base, item.key, {})[0];
    const trocado = itens(swapItem(base, item.key, outro.id)).find((i) => i.key === item.key)!;
    expect(Math.abs(macrosFor(trocado.food, trocado.gramas).c - macrosFor(item.food, item.gramas).c)).toBeLessThan(10);
  });

  test('trocar não altera o cardápio original', () => {
    const antes = JSON.stringify(base);
    const item = achar(base, 'vegetal');
    swapItem(base, item.key, swapOptions(base, item.key, {})[0].id);
    expect(JSON.stringify(base)).toBe(antes);
  });

  test('as opções são do mesmo grupo, sem excluídos nem o que já está na refeição', () => {
    const item = achar(base, 'proteinaPrato');
    const opcoes = swapOptions(base, item.key, { excluidos: ['peixe'] });
    const ids = opcoes.map((f) => f.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).not.toContain(item.food.id);
    for (const f of opcoes) expect(normalize(f.nome)).not.toMatch(/merluza|corvina|sardinha/);
  });

  test('item desconhecido não tem opções, e trocar por alimento fora do grupo não muda nada', () => {
    expect(swapOptions(base, 'nao_existe', {})).toEqual([]);
    const item = achar(base, 'vegetal');
    expect(itens(swapItem(base, item.key, 'nao_existe')).find((i) => i.key === item.key)).toEqual(item);
    expect(itens(swapItem(base, item.key, 'x1')).find((i) => i.key === item.key)).toEqual(item);
  });

  test('ajustar a quantidade muda os totais', () => {
    const item = achar(base, 'carboPrato');
    const novo = setItemGrams(base, item.key, item.gramas + 100);
    expect(planTotals(novo).kcal).toBeCloseTo(planTotals(base).kcal + item.food.kcal, 5);
  });

  test('quantidade zerada ou inválida é ignorada', () => {
    const item = achar(base, 'carboPrato');
    expect(setItemGrams(base, item.key, 0)).toBe(base);
    expect(setItemGrams(base, item.key, Number.NaN)).toBe(base);
  });

  test('remover tira o item, e a refeição vazia some', () => {
    const item = achar(base, 'carboPrato');
    expect(itens(removeItem(base, item.key)).some((i) => i.key === item.key)).toBe(false);
    const ceia: MealPlan = [{ refeicao: 'ceia', nome: 'Ceia', itens: [item] }];
    expect(removeItem(ceia, item.key)).toEqual([]);
  });
});

describe('planEntries', () => {
  test('gera registros do diário com os mesmos totais do cardápio', () => {
    const plan = generateMealPlan({ targets: META }, 4);
    const entries = planEntries(plan);
    expect(entries).toHaveLength(itens(plan).length);
    const kcal = entries.reduce((a, e) => a + macrosFor(e.snapshot, e.gramas).kcal, 0);
    expect(kcal).toBeCloseTo(planTotals(plan).kcal, 5);
    expect(new Set(entries.map((e) => e.refeicao))).toEqual(new Set(plan.map((m) => m.refeicao)));
  });
});

describe('planOnTarget', () => {
  test('aceita até 5% de diferença, nos dois sentidos', () => {
    const meta = { kcal: 2000, p: 100, c: 0, g: 0 };
    expect(planOnTarget({ kcal: 2100, p: 95, c: 0, g: 0 }, meta)).toEqual({ kcal: true, p: true });
    expect(planOnTarget({ kcal: 2101, p: 94, c: 0, g: 0 }, meta)).toEqual({ kcal: false, p: false });
  });

  test('meta zerada não reprova', () => {
    expect(planOnTarget({ kcal: 100, p: 1, c: 0, g: 0 }, { kcal: 0, p: 0, c: 0, g: 0 })).toEqual({ kcal: true, p: true });
  });
});

describe('portionHint', () => {
  const food = (nome: string, g: number) => ({ id: 'a', nome: 'A', cat: '', kcal: 0, p: 0, c: 0, g: 0, f: 0, porcoes: [{ nome, g }] });

  test.each([
    ['1 colher de servir', 45, 90, '≈ 2 colheres de servir'],
    ['1 colher de servir', 45, 45, '≈ 1 colher de servir'],
    ['1 colher de servir', 45, 68, '≈ 1,5 colher de servir'],
    ['1 unidade', 50, 100, '≈ 2 unidades'],
    ['1 fatia', 25, 75, '≈ 3 fatias'],
    ['1 pão', 50, 100, '≈ 2 pães'],
    ['1 filé médio', 100, 200, '≈ 2 filés médios'],
    ['1 unidade média', 150, 300, '≈ 2 unidades médias'],
    ['1 pedaço médio', 135, 270, '≈ 2 pedaços médios'],
    ['1 scoop (30 g)', 30, 60, '≈ 2 scoops (30 g)'],
    ['1 copo (200 ml)', 206, 412, '≈ 2 copos (200 ml)'],
    ['1 concha', 86, 172, '≈ 2 conchas'],
  ])('%s de %i g, %i g: %s', (nome, g, gramas, texto) => {
    expect(portionHint(food(nome, g), gramas)).toBe(texto);
  });

  test('toda medida caseira do planejador fica em um plural correto', () => {
    const errados = /\b(pãos|colhers|unidades média|filés médio|pedaços médio)\b/;
    for (const f of FOODS.filter((x) => POOL_FOOD_IDS.includes(x.id))) {
      for (const p of f.porcoes ?? []) expect(portionHint({ ...f, porcoes: [p] }, p.g * 3) ?? '').not.toMatch(errados);
    }
  });

  test('alimento sem medida caseira, ou quantidade pequena demais, não tem dica', () => {
    expect(portionHint({ ...food('x', 1), porcoes: undefined }, 100)).toBeUndefined();
    expect(portionHint(food('1 unidade', 100), 10)).toBeUndefined();
  });
});
