import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import { EXERCISE_MAP } from '../../data/exercises';
import { exportBackup, startPersistFlush, State, useStore } from '../useStore';

// Dados como estão salvos nos aparelhos na versão 1 do persist. Não edite para fazer um teste passar:
// se mudar o formato, suba a versão e escreva um `migrate` que continue carregando este conteúdo.
const SALVO_NA_V1 = {
  version: 1,
  state: {
    profile: {
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
      prioridades: ['peito'],
    },
    plans: [
      {
        id: 'p1',
        nome: 'Meu plano',
        descricao: '',
        criadoEm: '2026-01-01T12:00:00.000Z',
        proximo: 0,
        dias: [
          {
            id: 'd1',
            nome: 'A · Peito',
            foco: 'Peito',
            exercicios: [{ uid: 'e1', exerciseId: 'supino_reto_barra', series: 3, repMin: 8, repMax: 12, descansoSeg: 90 }],
          },
        ],
      },
    ],
    activePlanId: 'p1',
    history: [
      {
        id: 'h1',
        nome: 'A · Peito',
        inicio: '2026-01-01T12:00:00.000Z',
        fim: '2026-01-01T13:00:00.000Z',
        volumeKg: 600,
        exercicios: [
          {
            uid: 'x1',
            exerciseId: 'supino_reto_barra',
            repMin: 8,
            repMax: 12,
            descansoSeg: 90,
            sets: [{ peso: 60, reps: 10, feito: true, tipo: 'normal' }],
          },
        ],
      },
    ],
    bodyWeights: [{ data: '2026-01-01', pesoKg: 80 }],
    targets: { kcal: 3000, p: 160, c: 400, g: 80, aguaMl: 2800, manual: true },
    nutrition: {},
    // Salvo antes da calculadora de anilhas e do aviso de descanso: sem pesoBarraKg e notificarDescanso.
    settings: { incrementoBarraKg: 5, incrementoHalterKg: 2, vibrarDescanso: false },
  },
};

const STORE_KEY = 'forja-store';

async function carregar(salvo: unknown) {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(salvo));
  await useStore.persist.rehydrate();
}

beforeEach(async () => {
  useStore.getState().resetAll();
  await AsyncStorage.clear();
});

describe('dados já salvos no aparelho', () => {
  test('continuam carregando', async () => {
    await carregar(SALVO_NA_V1);
    const s = useStore.getState();

    expect(s.profile?.nome).toBe('Teste');
    expect(s.plans.map((p) => p.id)).toEqual(['p1']);
    expect(s.activePlanId).toBe('p1');
    expect(s.history.map((h) => h.id)).toEqual(['h1']);
    expect(s.bodyWeights).toEqual([{ data: '2026-01-01', pesoKg: 80 }]);
    expect(s.targets).toMatchObject({ kcal: 3000, manual: true });
    expect(s.settings).toMatchObject({ incrementoBarraKg: 5, vibrarDescanso: false });
  });

  test('campos que ainda não existiam ficam com o valor padrão', async () => {
    await carregar(SALVO_NA_V1);
    const s = useStore.getState();

    expect(s.customFoods).toEqual([]);
    expect(s.customExercises).toEqual([]);
    expect(s.recentFoodIds).toEqual([]);
  });

  test('o perfil salvo antes dos campos de saúde e meta carrega sem eles e ainda gera plano', async () => {
    await carregar(SALVO_NA_V1);
    const s = useStore.getState();

    expect(s.profile?.lesoes).toBeUndefined();
    expect(s.profile?.medicamentos).toBeUndefined();
    expect(s.generateNewPlan()).toBeDefined();
  });

  test('um treino pode começar a partir deles', async () => {
    await carregar(SALVO_NA_V1);
    useStore.getState().startSession('p1', 'd1');
    const ex = useStore.getState().session?.exercicios[0];

    expect(ex?.exerciseId).toBe('supino_reto_barra');
    expect(ex?.sets).toHaveLength(3);
    expect(ex?.sets[0].peso).toBe(60);
  });
});

describe('gravação no aparelho', () => {
  const lerSalvo = async () => JSON.parse((await AsyncStorage.getItem(STORE_KEY)) ?? 'null');
  const esperarFila = () => new Promise<void>((r) => setTimeout(r, 0));

  beforeEach(async () => {
    await carregar(SALVO_NA_V1);
    (AsyncStorage.setItem as jest.Mock).mockClear();
  });

  test('digitar no treino não grava a cada dígito', async () => {
    const { startSession, updateSet } = useStore.getState();
    startSession('p1', 'd1');
    const uid = useStore.getState().session!.exercicios[0].uid;
    for (let peso = 1; peso <= 30; peso++) updateSet(uid, 0, { peso });
    await esperarFila();

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  test('sair do app grava na hora, no formato de sempre', async () => {
    let aoMudar: (st: string) => void = () => {};
    const remover = jest.fn();
    const espia = jest.spyOn(AppState, 'addEventListener').mockImplementation((_tipo, fn) => {
      aoMudar = fn as (st: string) => void;
      return { remove: remover } as never;
    });
    const parar = startPersistFlush();

    useStore.getState().renamePlan('p1', 'Plano novo');
    aoMudar('active');
    await esperarFila();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    aoMudar('background');
    await esperarFila();
    const salvo = await lerSalvo();
    expect(salvo.version).toBe(1);
    expect(salvo.state.plans[0].nome).toBe('Plano novo');
    expect(salvo.state.history.map((h: { id: string }) => h.id)).toEqual(['h1']);

    parar();
    expect(remover).toHaveBeenCalled();
    espia.mockRestore();
  });

  test('finalizar o treino grava na hora', async () => {
    const { startSession, completeSet, finishSession } = useStore.getState();
    startSession('p1', 'd1');
    completeSet(useStore.getState().session!.exercicios[0].uid, 0);
    const id = finishSession();
    await esperarFila();

    const salvo = await lerSalvo();
    expect(salvo.state.history[0].id).toBe(id);
    expect(salvo.state.session).toBeUndefined();
  });

  test('o que foi gravado volta igual ao reabrir o app', async () => {
    useStore.getState().renamePlan('p1', 'Plano novo');
    useStore.getState().importBackup(exportBackup());
    await esperarFila();

    useStore.setState({ plans: [] }, false);
    await useStore.persist.rehydrate();
    expect(useStore.getState().plans[0].nome).toBe('Plano novo');
  });

  test.each([
    ['importar um backup', () => useStore.getState().importBackup(JSON.stringify({ app: 'forja', plans: [] }))],
    ['apagar tudo', () => useStore.getState().resetAll()],
  ])('%s grava na hora', async (_nome, acao) => {
    acao();
    await esperarFila();
    expect((await lerSalvo()).state.plans).toEqual([]);
  });
});

describe('aplicar cardápio ao diário', () => {
  const DATA = '2026-01-02';
  const entrada = (foodId: string) => ({ foodId, gramas: 100, refeicao: 'almoco' as const, snapshot: { nome: foodId, kcal: 100, p: 10, c: 10, g: 1 } });

  beforeEach(() => {
    useStore.setState({ nutrition: { [DATA]: { aguaMl: 500, entries: [{ ...entrada('antigo'), id: 'a1' }] } }, recentFoodIds: ['r1'] });
  });

  test('somar mantém o que já estava registrado e a água', () => {
    useStore.getState().applyMealPlan(DATA, [entrada('novo')], false);
    const dia = useStore.getState().nutrition[DATA];
    expect(dia.entries.map((e) => e.foodId)).toEqual(['antigo', 'novo']);
    expect(dia.aguaMl).toBe(500);
  });

  test('substituir troca os registros, mas mantém a água', () => {
    useStore.getState().applyMealPlan(DATA, [entrada('novo')], true);
    const dia = useStore.getState().nutrition[DATA];
    expect(dia.entries.map((e) => e.foodId)).toEqual(['novo']);
    expect(dia.aguaMl).toBe(500);
  });

  test('funciona em um dia sem registros, com ids únicos e sem mexer nos recentes', () => {
    useStore.getState().applyMealPlan('2026-01-03', [entrada('a'), entrada('b')], false);
    const s = useStore.getState();
    const ids = s.nutrition['2026-01-03'].entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(2);
    expect(s.nutrition['2026-01-03'].aguaMl).toBe(0);
    expect(s.recentFoodIds).toEqual(['r1']);
  });
});

describe('alterações na sessão', () => {
  test('mudar uma série mantém os outros exercícios e séries iguais, para não renderizá-los de novo', async () => {
    await carregar(SALVO_NA_V1);
    const { startSession, addSessionExercise, updateSet } = useStore.getState();
    startSession('p1', 'd1');
    addSessionExercise('supino_reto_barra');
    const antes = useStore.getState().session!.exercicios;

    updateSet(antes[0].uid, 1, { peso: 70 });
    const depois = useStore.getState().session!.exercicios;

    expect(depois[1]).toBe(antes[1]);
    expect(depois[0].sets[0]).toBe(antes[0].sets[0]);
    expect(depois[0].sets[2]).toBe(antes[0].sets[2]);
    expect(depois[0].sets[1].peso).toBe(70);
  });
});

describe('backup', () => {
  test('exportar e importar devolve os mesmos dados', async () => {
    await carregar(SALVO_NA_V1);
    const backup = exportBackup();

    useStore.getState().resetAll();
    expect(useStore.getState().plans).toEqual([]);

    useStore.getState().importBackup(backup);
    const s = useStore.getState();
    expect(s.plans.map((p) => p.id)).toEqual(['p1']);
    expect(s.history.map((h) => h.id)).toEqual(['h1']);
    expect(s.settings.incrementoBarraKg).toBe(5);
  });

  test('o backup restaura todos os dados e não guarda metadados do arquivo', () => {
    // O tipo obriga a incluir aqui todo campo novo do estado; o teste garante que ele entre no backup.
    const completo: Required<Omit<State, 'session'>> = {
      profile: {
        ...(SALVO_NA_V1.state.profile as Required<State>['profile']),
        pesoMetaKg: 72,
        prazoSemanas: 20,
        ritmo: 'moderado',
        medicamentos: [{ nome: 'Tirzepatida (Mounjaro)', dose: '5 mg', frequencia: 'Semanal', atalho: 'tirzepatida' }],
        condicoes: 'Hipertensão',
        lesoes: ['joelho'],
        sonoHoras: 7,
        apetite: 'baixo',
        alimentosExcluidos: ['peixe'],
      },
      plans: SALVO_NA_V1.state.plans,
      activePlanId: 'p1',
      history: SALVO_NA_V1.state.history as State['history'],
      customExercises: [{ ...EXERCISE_MAP.supino_reto_barra, id: 'meu_supino', custom: true }],
      bodyWeights: [{ data: '2026-01-01', pesoKg: 80 }],
      targets: { kcal: 3000, p: 160, c: 400, g: 80, aguaMl: 2800, manual: true },
      nutrition: {
        '2026-01-01': {
          aguaMl: 500,
          entries: [{ id: 'n1', foodId: 'f1', gramas: 100, refeicao: 'almoco', snapshot: { nome: 'Arroz', kcal: 128, p: 2.5, c: 28, g: 0.2 } }],
        },
      },
      customFoods: [{ id: 'f1', nome: 'Meu arroz', cat: 'teste', kcal: 128, p: 2.5, c: 28, g: 0.2, f: 1.6, custom: true }],
      recentFoodIds: ['f1'],
      settings: {
        incrementoBarraKg: 5,
        incrementoHalterKg: 1,
        vibrarDescanso: false,
        pesoBarraKg: 15,
        notificarDescanso: false,
        somDescanso: false,
        somDescansoId: 'gongo',
        avisoDezSeg: true,
      },
    };
    useStore.setState(completo);
    const backup = exportBackup();

    useStore.getState().resetAll();
    useStore.getState().importBackup(backup);

    const s = useStore.getState();
    for (const campo of Object.keys(completo) as (keyof typeof completo)[]) {
      expect(s[campo]).toEqual(completo[campo]);
    }
    expect(s).not.toHaveProperty('app');
    expect(s).not.toHaveProperty('exportadoEm');
  });

  test('importar não traz um treino em andamento', () => {
    useStore.setState({ session: { id: 's', nome: 'Treino', inicio: '', exercicios: [] } });
    useStore.getState().importBackup(JSON.stringify({ app: 'forja', plans: [] }));
    expect(useStore.getState().session).toBeUndefined();
  });

  test('backup antigo, sem campos novos, recebe os valores padrão', () => {
    useStore.getState().importBackup(JSON.stringify({ app: 'forja', plans: [] }));
    expect(useStore.getState().customFoods).toEqual([]);
    expect(useStore.getState().settings.incrementoBarraKg).toBe(2.5);
  });

  test.each([
    ['de outro app', JSON.stringify({ app: 'outro', plans: [] })],
    ['sem planos', JSON.stringify({ app: 'forja' })],
  ])('recusa arquivo %s e mantém os dados', async (_nome, json) => {
    await carregar(SALVO_NA_V1);
    expect(() => useStore.getState().importBackup(json)).toThrow('Arquivo de backup inválido');
    expect(useStore.getState().plans.map((p) => p.id)).toEqual(['p1']);
  });

  test('recusa arquivo que não é JSON', () => {
    expect(() => useStore.getState().importBackup('isto não é json')).toThrow();
  });
});
