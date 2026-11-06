import { FOODS } from '../../data/foods';
import { computeTargets, dayTotals, gastoDiario, imc, macrosFor, normalize, searchFoods, sumMacros, tmb, usesGlp1 } from '../nutrition';
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
    expect(computeTargets(perfil)).toMatchObject({
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

  describe('ritmo de emagrecimento', () => {
    const perder: Profile = { ...perfil, objetivo: 'emagrecimento' };

    test.each([
      ['leve', 0.005],
      ['moderado', 0.0075],
      ['acelerado', 0.01],
    ] as const)('%s: déficit equivale à fração do peso por semana', (ritmo, fracao) => {
      const t = computeTargets({ ...perder, ritmo });
      const deficitDiario = (80 * fracao * 7700) / 7;
      expect(Math.abs(gastoDiario(perder) - deficitDiario - t.kcal)).toBeLessThanOrEqual(5);
      expect(t.explicacao.join(' ')).toContain(`Ritmo ${ritmo}`);
    });

    test('ritmo mais rápido dá menos calorias', () => {
      const kcal = (['leve', 'moderado', 'acelerado'] as const).map((ritmo) => computeTargets({ ...perder, ritmo }).kcal);
      expect([...kcal].sort((a, b) => b - a)).toEqual(kcal);
      expect(new Set(kcal).size).toBe(3);
    });

    test('sem ritmo, usa a meta e o prazo', () => {
      const t = computeTargets({ ...perder, pesoMetaKg: 76, prazoSemanas: 10 });
      // 4 kg em 10 semanas: 0,4 kg por semana.
      expect(Math.abs(gastoDiario(perder) - (0.4 * 7700) / 7 - t.kcal)).toBeLessThanOrEqual(5);
      expect(t.explicacao.join(' ')).toContain('Pela sua meta e prazo');
    });

    test('prazo curto demais não passa do limite e avisa', () => {
      const curto = computeTargets({ ...perder, pesoMetaKg: 60, prazoSemanas: 4 });
      expect(curto.kcal).toBe(computeTargets({ ...perder, ritmo: 'acelerado' }).kcal);
      expect(curto.avisos.join(' ')).toContain('prazo de 4 semanas');
    });

    test('o ritmo escolhido vale mais que o prazo', () => {
      expect(computeTargets({ ...perder, ritmo: 'leve', pesoMetaKg: 60, prazoSemanas: 4 }).kcal).toBe(computeTargets({ ...perder, ritmo: 'leve' }).kcal);
    });

    test('estima as semanas até a meta', () => {
      const t = computeTargets({ ...perder, ritmo: 'moderado', pesoMetaKg: 74 });
      // 6 kg a 0,6 kg por semana, com folga do arredondamento das calorias.
      expect(t.explicacao.join(' ')).toMatch(/chegar a 74,0 kg leva cerca de 1[01] semanas/);
      expect(t.avisos).toEqual([]);
    });

    test('sem ritmo, meta ou prazo, continua o déficit de 20%', () => {
      expect(computeTargets({ ...perder, pesoMetaKg: 70 })).toMatchObject({ kcal: 2340, ajuste: -0.2 });
    });

    test('meta acima do peso atual não vira ganho de peso e avisa', () => {
      const t = computeTargets({ ...perder, pesoMetaKg: 90, prazoSemanas: 10 });
      expect(t.kcal).toBe(2340);
      expect(t.avisos.join(' ')).toContain('na meta ou abaixo');
    });

    test('meta com IMC abaixo de 18,5 avisa', () => {
      expect(computeTargets({ ...perder, pesoMetaKg: 55 }).avisos.join(' ')).toContain('IMC abaixo de 18,5');
      expect(computeTargets({ ...perder, pesoMetaKg: 65 }).avisos).toEqual([]);
    });

    test('o ritmo não muda quem quer manter o peso', () => {
      expect(computeTargets({ ...perfil, objetivo: 'manutencao', ritmo: 'acelerado' }).kcal).toBe(2930);
    });
  });

  describe('ritmo de ganho', () => {
    test.each([
      ['leve', 0.05],
      ['moderado', 0.1],
      ['acelerado', 0.15],
    ] as const)('%s: superávit proporcional ao gasto', (ritmo, superavit) => {
      const t = computeTargets({ ...perfil, ritmo });
      expect(t.ajuste).toBeCloseTo(superavit, 2);
      expect(t.explicacao.join(' ')).toContain(`Ritmo ${ritmo}`);
    });
  });

  describe('piso calórico', () => {
    const baixoGasto: Profile = { ...perfil, objetivo: 'emagrecimento', atividade: 'sedentario', diasSemana: 2, duracaoMin: 40, pesoKg: 120, alturaCm: 170, ritmo: 'acelerado' };

    test('não fica abaixo do metabolismo basal, e avisa', () => {
      const t = computeTargets(baixoGasto);
      const semPiso = Math.round((gastoDiario(baixoGasto) - (120 * 0.01 * 7700) / 7) / 10) * 10;
      expect(semPiso).toBeLessThan(t.tmb);
      expect(t.kcal).toBeGreaterThanOrEqual(tmb(baixoGasto));
      expect(t.avisos.join(' ')).toContain('abaixo do metabolismo basal');
      expect(t.avisos.join(' ')).toContain(String(semPiso));
    });

    test('a estimativa de semanas usa as calorias com o piso', () => {
      const comPiso = computeTargets({ ...baixoGasto, pesoMetaKg: 100 });
      const kgPorSemana = ((gastoDiario(baixoGasto) - comPiso.kcal) * 7) / 7700;
      expect(kgPorSemana).toBeLessThan(120 * 0.01);
      expect(comPiso.explicacao.join(' ')).toContain(`chegar a 100,0 kg leva cerca de ${Math.ceil(20 / kgPorSemana)} semanas`);
    });

    test('quem está acima do piso não recebe o aviso', () => {
      expect(computeTargets({ ...perfil, objetivo: 'emagrecimento', ritmo: 'leve' }).avisos).toEqual([]);
    });

    test.each(['leve', 'moderado', 'acelerado', undefined] as const)('nunca fica abaixo do basal, ritmo %s', (ritmo) => {
      for (const pesoKg of [40, 60, 80, 120, 180, 250]) {
        for (const alturaCm of [150, 170, 195]) {
          for (const sexo of ['M', 'F'] as const) {
            const p: Profile = { ...perfil, objetivo: 'emagrecimento', atividade: 'sedentario', diasSemana: 2, duracaoMin: 40, pesoKg, alturaCm, sexo, ritmo };
            expect(computeTargets(p).kcal).toBeGreaterThanOrEqual(tmb(p));
          }
        }
      }
    });
  });

  describe('proteína com IMC alto', () => {
    const alto: Profile = { ...perfil, objetivo: 'emagrecimento', pesoKg: 130, alturaCm: 175 };

    test('com IMC até 30, usa o peso atual, mesmo com meta', () => {
      expect(imc(perfil)).toBeLessThan(30);
      expect(computeTargets({ ...perfil, objetivo: 'emagrecimento', pesoMetaKg: 70 }).p).toBe(176);
    });

    test('com IMC acima de 30, usa a meta de peso', () => {
      const t = computeTargets({ ...alto, pesoMetaKg: 85 });
      expect(t.p).toBe(Math.round(85 * 2.2));
      expect(t.explicacao.join(' ')).toContain('sua meta de peso');
    });

    test('sem meta, usa o peso equivalente a IMC 25', () => {
      const t = computeTargets(alto);
      expect(t.p).toBe(Math.round(25 * 1.75 ** 2 * 2.2));
      expect(t.explicacao.join(' ')).toContain('IMC 25');
    });

    test('meta acima do peso atual é ignorada na referência', () => {
      expect(computeTargets({ ...alto, pesoMetaKg: 140 }).p).toBe(computeTargets(alto).p);
    });

    test('a gordura também usa a referência, sem exceder as calorias', () => {
      const t = computeTargets({ ...alto, pesoMetaKg: 85 });
      expect(t.g).toBeLessThan(130 * 0.8);
      expect(t.c).toBeGreaterThan(0);
    });
  });

  describe('GLP-1 e tirzepatida', () => {
    const perder: Profile = { ...perfil, objetivo: 'emagrecimento', ritmo: 'moderado' };
    const comMounjaro: Profile = { ...perder, medicamentos: [{ nome: 'Tirzepatida (Mounjaro)', atalho: 'tirzepatida' }] };

    test('critério do card: reflete o ritmo, proteína alta, explica e mostra o aviso', () => {
      const t = computeTargets(comMounjaro);
      expect(t.kcal).toBe(computeTargets(perder).kcal);
      expect(t.p).toBe(176);
      expect(t.explicacao.join(' ')).toContain('Ritmo moderado');
      expect(t.avisos.join(' ')).toContain('médico ou nutricionista');
      expect(t.lembretes.join(' ')).toContain('água');
      expect(t.lembretes.join(' ')).toContain('fibras');
      expect(t.lembretes.join(' ')).toContain('Refeições menores');
    });

    test('nada orienta sobre dose ou uso do medicamento', () => {
      const t = computeTargets({ ...comMounjaro, medicamentos: [{ nome: 'Mounjaro', dose: '5 mg', frequencia: 'Semanal', atalho: 'tirzepatida' }] });
      const texto = [...t.explicacao, ...t.avisos, ...t.lembretes].join(' ').toLowerCase();
      expect(texto).not.toMatch(/dose|aplica|mg\b|semanal/);
    });

    test('sobe a proteína de quem não está emagrecendo', () => {
      expect(computeTargets({ ...perfil, objetivo: 'manutencao' }).p).toBe(144);
      expect(computeTargets({ ...perfil, objetivo: 'manutencao', medicamentos: comMounjaro.medicamentos }).p).toBe(176);
    });

    test('sem medicamento, não há lembretes nem aviso', () => {
      const t = computeTargets(perder);
      expect(t.lembretes).toEqual([]);
      expect(t.avisos).toEqual([]);
    });

    test.each(['Mounjaro', 'mounjaro 5mg', 'Ozempic', 'WEGOVY', 'Semaglutida', 'Liraglutida', 'Saxenda', 'Trulicity'])('reconhece %s digitado à mão', (nome) => {
      expect(usesGlp1({ medicamentos: [{ nome }] })).toBe(true);
    });

    test.each([['outro medicamento', [{ nome: 'Losartana' }]], ['lista vazia', []], ['sem o campo', undefined]] as const)('não marca com %s', (_n, medicamentos) => {
      expect(usesGlp1({ medicamentos: medicamentos as Profile['medicamentos'] })).toBe(false);
    });
  });

  test('a explicação começa pelo gasto, em qualquer objetivo', () => {
    for (const objetivo of ['hipertrofia', 'forca', 'emagrecimento', 'manutencao'] as const) {
      const t = computeTargets({ ...perfil, objetivo });
      expect(t.explicacao[0]).toContain(`${t.gasto} kcal`);
      expect(t.explicacao.length).toBeGreaterThanOrEqual(3);
    }
  });
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
