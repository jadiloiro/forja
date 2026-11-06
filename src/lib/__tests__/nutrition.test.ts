import { FOODS } from '../../data/foods';
import { computeTargets, dayTotals, gastoDiario, macrosFor, normalize, searchFoods, sumMacros, tmb } from '../nutrition';
import { DayLog, Food } from '../nutritionTypes';
import { Profile } from '../trainingTypes';

const perfil: Profile = {
  nome: 'Teste',
  sexo: 'M',
  idade: 30,
  alturaCm: 180,
  pesoKg: 80,
  nivel: 'intermediario',
  objetivo: 'hipertrofia',
  diasSemana: 4,
  duracaoMin: 60,
  atividade: 'moderado',
  prioridades: [],
};

function food(id: string, nome: string, patch: Partial<Food> = {}): Food {
  return { id, nome, cat: 'teste', kcal: 100, p: 10, c: 20, g: 5, f: 0, ...patch };
}

describe('gasto energético', () => {
  test('tmb usa Mifflin-St Jeor, por sexo', () => {
    expect(tmb(perfil)).toBe(1780);
    expect(tmb({ ...perfil, sexo: 'F' })).toBe(1614);
  });

  test('gastoDiario soma atividade do dia a dia e treinos', () => {
    expect(gastoDiario(perfil)).toBeCloseTo(1780 * 1.55 + (4 * 60 * 5) / 7, 5);
  });

  test('quanto mais ativo, maior o gasto', () => {
    const gastos = (['sedentario', 'leve', 'moderado', 'alto', 'muito_alto'] as const).map((atividade) => gastoDiario({ ...perfil, atividade }));
    expect([...gastos].sort((a, b) => a - b)).toEqual(gastos);
  });
});

describe('computeTargets', () => {
  test('hipertrofia: superávit de 10%', () => {
    expect(computeTargets(perfil)).toEqual({
      kcal: 3220,
      p: 160,
      c: 445,
      g: 89,
      aguaMl: 2800,
      manual: false,
      tmb: 1780,
      gasto: 2930,
      ajuste: 0.1,
    });
  });

  test('emagrecimento: déficit de 20% e mais proteína', () => {
    expect(computeTargets({ ...perfil, objetivo: 'emagrecimento' })).toMatchObject({ kcal: 2340, p: 176, ajuste: -0.2 });
  });

  test('manutenção: sem ajuste', () => {
    expect(computeTargets({ ...perfil, objetivo: 'manutencao' })).toMatchObject({ kcal: 2930, p: 144, ajuste: 0 });
  });

  test('carboidrato nunca fica negativo', () => {
    const t = computeTargets({ ...perfil, objetivo: 'emagrecimento', pesoKg: 200, alturaCm: 150, idade: 80, sexo: 'F', atividade: 'sedentario', diasSemana: 2, duracaoMin: 30 });
    expect(t.c).toBeGreaterThanOrEqual(0);
  });

  test('os macros fecham com as calorias, com folga do arredondamento', () => {
    const t = computeTargets(perfil);
    expect(Math.abs(t.p * 4 + t.c * 4 + t.g * 9 - t.kcal)).toBeLessThan(10);
  });

  test.todo('não fica abaixo do piso calórico sem avisar (entra com o M007)');
});

describe('macros do diário', () => {
  test('macrosFor calcula pela porção em gramas', () => {
    expect(macrosFor(food('a', 'A'), 150)).toEqual({ kcal: 150, p: 15, c: 30, g: 7.5 });
  });

  test('sumMacros soma a lista e aceita lista vazia', () => {
    expect(sumMacros([])).toEqual({ kcal: 0, p: 0, c: 0, g: 0 });
    expect(sumMacros([{ kcal: 1, p: 2, c: 3, g: 4 }, { kcal: 10, p: 20, c: 30, g: 40 }])).toEqual({ kcal: 11, p: 22, c: 33, g: 44 });
  });

  test('dayTotals usa os valores guardados em cada registro', () => {
    const log: DayLog = {
      aguaMl: 0,
      entries: [{ id: '1', foodId: 'x', gramas: 200, refeicao: 'almoco', snapshot: { nome: 'X', kcal: 100, p: 10, c: 20, g: 5 } }],
    };
    expect(dayTotals(log)).toEqual({ kcal: 200, p: 20, c: 40, g: 10 });
    expect(dayTotals(undefined)).toEqual({ kcal: 0, p: 0, c: 0, g: 0 });
  });
});

describe('busca de alimentos', () => {
  const lista = [food('1', 'Frango, peito, grelhado'), food('2', 'Peito de peru'), food('3', 'Açúcar refinado'), food('4', 'Pão de queijo')];

  test('normalize tira acentos e baixa a caixa', () => {
    expect(normalize('AÇÚCAR Pão')).toBe('acucar pao');
  });

  test('ignora acentos e maiúsculas', () => {
    expect(searchFoods(lista, 'acucar').map((f) => f.id)).toEqual(['3']);
    expect(searchFoods(lista, 'PÃO').map((f) => f.id)).toEqual(['4']);
  });

  test('exige todos os termos, em qualquer ordem', () => {
    expect(searchFoods(lista, 'grelhado frango').map((f) => f.id)).toEqual(['1']);
    expect(searchFoods(lista, 'frango, queijo')).toEqual([]);
  });

  test('prioriza nome que começa com o termo', () => {
    expect(searchFoods(lista, 'peito').map((f) => f.id)).toEqual(['2', '1']);
  });

  test('prioriza alimento personalizado', () => {
    const comCustom = [food('1', 'Whey sabor baunilha'), food('2', 'Whey sabor chocolate meio amargo', { custom: true })];
    expect(searchFoods(comCustom, 'whey')[0].id).toBe('2');
  });

  test('busca vazia não devolve nada', () => {
    expect(searchFoods(lista, '   ')).toEqual([]);
  });

  test('respeita o limite', () => {
    expect(searchFoods(lista, 'o', 2)).toHaveLength(2);
  });

  test('encontra alimentos comuns na base TACO', () => {
    expect(searchFoods(FOODS, 'arroz').length).toBeGreaterThan(0);
    expect(searchFoods(FOODS, 'feijao').length).toBeGreaterThan(0);
  });
});
