import {
  e1rm,
  e1rmSeries,
  fmtKg,
  lastPerformance,
  personalRecords,
  round,
  sessionVolume,
  suggest,
  workingSets,
} from '../progression';
import { SessionExercise, SessionRecord, SetLog, Settings } from '../trainingTypes';

const settings: Settings = { incrementoBarraKg: 2.5, incrementoHalterKg: 2, vibrarDescanso: true };

function set(peso: number | null, reps: number | null, patch: Partial<SetLog> = {}): SetLog {
  return { peso, reps, feito: true, tipo: 'normal', ...patch };
}

function exercise(exerciseId: string, sets: SetLog[]): SessionExercise {
  return { uid: exerciseId, exerciseId, repMin: 8, repMax: 12, descansoSeg: 90, sets };
}

function record(fim: string, exercicios: SessionExercise[]): SessionRecord {
  return { id: fim, nome: 'Treino', inicio: fim, fim, volumeKg: 0, exercicios };
}

describe('lastPerformance', () => {
  test('pega a sessão mais recente e ignora aquecimento e séries não feitas', () => {
    const history = [
      record('2026-02-01', [exercise('supino', [set(40, 10, { tipo: 'aquecimento' }), set(60, 10), set(60, 8, { feito: false })])]),
      record('2026-01-01', [exercise('supino', [set(50, 10)])]),
    ];
    expect(lastPerformance(history, 'supino')).toEqual({ data: '2026-02-01', sets: [set(60, 10)] });
  });

  test('pula sessões em que o exercício não foi feito', () => {
    const history = [
      record('2026-02-01', [exercise('supino', [set(60, 10, { feito: false })])]),
      record('2026-01-01', [exercise('supino', [set(50, 10)])]),
    ];
    expect(lastPerformance(history, 'supino')?.data).toBe('2026-01-01');
  });

  test('sem histórico devolve undefined', () => {
    expect(lastPerformance([], 'supino')).toBeUndefined();
  });
});

test('workingSets mantém só as séries válidas', () => {
  const ex = exercise('supino', [set(40, 10, { tipo: 'aquecimento' }), set(60, 10), set(60, 8, { feito: false }), set(50, 12, { tipo: 'dropset' })]);
  expect(workingSets(ex)).toEqual([set(60, 10), set(50, 12, { tipo: 'dropset' })]);
});

test('e1rm usa a fórmula de Epley', () => {
  expect(e1rm(100, 0)).toBe(0);
  expect(e1rm(100, 1)).toBe(100);
  expect(e1rm(100, 10)).toBeCloseTo(133.33, 2);
});

test('round arredonda para o passo', () => {
  expect(round(61.3)).toBe(61.5);
  expect(round(61.2)).toBe(61);
  expect(round(61.3, 2.5)).toBe(62.5);
});

describe('suggest', () => {
  const last = (sets: SetLog[]) => ({ data: '2026-01-01', sets });

  test('sem dados não há sugestão', () => {
    expect(suggest(undefined, 8, 12, 'supino_reto_barra', settings)).toBeUndefined();
    expect(suggest(last([]), 8, 12, 'supino_reto_barra', settings)).toBeUndefined();
    expect(suggest(last([set(null, null)]), 8, 12, 'supino_reto_barra', settings)).toBeUndefined();
  });

  test('bateu o topo em todas: sobe o incremento da barra', () => {
    const s = suggest(last([set(60, 12), set(60, 12)]), 8, 12, 'supino_reto_barra', settings);
    expect(s).toMatchObject({ peso: 62.5, subir: true });
  });

  test('halteres usam o incremento próprio', () => {
    const s = suggest(last([set(20, 12)]), 8, 12, 'supino_reto_halter', settings);
    expect(s).toMatchObject({ peso: 22, subir: true });
  });

  test('não bateu o topo em todas: mantém a carga', () => {
    const s = suggest(last([set(60, 12), set(60, 10)]), 8, 12, 'supino_reto_barra', settings);
    expect(s).toMatchObject({ peso: 60, subir: false });
    expect(s?.texto).toContain('busque mais repetições');
  });

  test('a maioria abaixo do mínimo: avisa para manter ou reduzir', () => {
    const s = suggest(last([set(60, 6), set(60, 6), set(60, 9)]), 8, 12, 'supino_reto_barra', settings);
    expect(s).toMatchObject({ peso: 60, subir: false });
    expect(s?.texto).toContain('abaixo de 8 reps');
  });

  test('só conta as séries com a maior carga', () => {
    const s = suggest(last([set(60, 12), set(50, 5)]), 8, 12, 'supino_reto_barra', settings);
    expect(s).toMatchObject({ peso: 62.5, subir: true });
  });

  test('peso corporal sugere carga ou repetições, sem número', () => {
    expect(suggest(last([set(0, 12)]), 8, 12, 'flexao', settings)).toMatchObject({ peso: null, subir: true });
    expect(suggest(last([set(0, 10)]), 8, 12, 'flexao', settings)).toMatchObject({ peso: null, subir: false });
  });
});

test('fmtKg formata para exibição', () => {
  expect(fmtKg(null)).toBe('—');
  expect(fmtKg(undefined)).toBe('—');
  expect(fmtKg(60)).toBe('60 kg');
  expect(fmtKg(62.5)).toBe('62,5 kg');
});

test('sessionVolume soma só as séries válidas', () => {
  const ex = [
    exercise('supino', [set(60, 10), set(40, 10, { tipo: 'aquecimento' }), set(60, 10, { feito: false })]),
    exercise('remada', [set(50, 8), set(null, 8)]),
  ];
  expect(sessionVolume(ex)).toBe(1000);
});

describe('personalRecords', () => {
  test('guarda o melhor 1RM e a maior carga, de qualquer sessão', () => {
    const history = [
      record('2026-02-01', [exercise('supino', [set(70, 3)])]),
      record('2026-01-01', [exercise('supino', [set(60, 12)])]),
    ];
    const pr = personalRecords(history).supino;
    expect(pr.pesoMax).toBe(70);
    expect(pr.e1rm).toBeCloseTo(84, 5);
    expect(pr.data).toBe('2026-01-01');
  });

  test('ignora aquecimento e séries sem repetições', () => {
    const history = [record('2026-01-01', [exercise('supino', [set(100, 5, { tipo: 'aquecimento' }), set(100, 0), set(50, 10)])])];
    expect(personalRecords(history).supino.pesoMax).toBe(50);
  });

  test('sem histórico não há recordes', () => {
    expect(personalRecords([])).toEqual({});
  });

  // Bug conhecido: quando o melhor 1RM vem de uma carga menor, repsNoMax fica com as reps dessa carga,
  // não as da carga máxima. O campo ainda não aparece em nenhuma tela. Ao corrigir, troque por test().
  test.failing('repsNoMax são as repetições feitas com a carga máxima', () => {
    const history = [record('2026-01-01', [exercise('supino', [set(100, 5), set(90, 10)])])];
    expect(personalRecords(history).supino).toMatchObject({ pesoMax: 100, repsNoMax: 5 });
  });
});

describe('e1rmSeries', () => {
  test('vai do mais antigo ao mais recente, com o melhor valor de cada sessão', () => {
    const history = [
      record('2026-02-01', [exercise('supino', [set(60, 10), set(100, 1)])]),
      record('2026-01-01', [exercise('supino', [set(60, 10)])]),
      record('2025-12-01', [exercise('remada', [set(60, 10)])]),
    ];
    expect(e1rmSeries(history, 'supino')).toEqual([
      { data: '2026-01-01', valor: 80 },
      { data: '2026-02-01', valor: 100 },
    ]);
  });

  test('ignora sessões sem série válida', () => {
    const history = [record('2026-01-01', [exercise('supino', [set(60, 10, { feito: false })])])];
    expect(e1rmSeries(history, 'supino')).toEqual([]);
  });
});
