import { Platform } from 'react-native';

import {
  deleteSession,
  hcGranted,
  hcOpenSettings,
  hcRequest,
  hcStatus,
  heartRateSummary,
  mealClientId,
  mealRecords,
  readHeartRate,
  readToday,
  readWeights,
  resetHealthConnectForTests,
  sessionClientId,
  sessionRecord,
  sleepMinutes,
  weightsByDay,
  writeDiaryDay,
  writeSession,
} from '../healthConnect';
import { DayLog, FoodEntry } from '../nutritionTypes';
import { SessionRecord } from '../trainingTypes';

const entry = (refeicao: FoodEntry['refeicao'], nome: string, gramas: number, kcal: number, p: number, c = 0, g = 0): FoodEntry => ({
  id: nome,
  foodId: nome,
  gramas,
  refeicao,
  snapshot: { nome, kcal, p, c, g },
});

const sessao: SessionRecord = {
  id: 's1',
  nome: 'A · Peito',
  inicio: '2026-11-07T10:00:00.000Z',
  fim: '2026-11-07T11:00:00.000Z',
  volumeKg: 3200,
  nota: 'Bom treino',
  exercicios: [
    {
      uid: 'u1',
      exerciseId: 'supino_reto_barra',
      repMin: 8,
      repMax: 12,
      descansoSeg: 90,
      sets: [
        { peso: 60, reps: 10, feito: true, tipo: 'normal' },
        { peso: 60, reps: 9, feito: true, tipo: 'normal' },
      ],
    },
  ],
};

describe('sessionRecord', () => {
  it('monta um treino de força com ID próprio do Forja', () => {
    const r = sessionRecord(sessao, (id) => (id === 'supino_reto_barra' ? 'Supino reto' : undefined));
    expect(r).toMatchObject({
      recordType: 'ExerciseSession',
      exerciseType: 70,
      startTime: sessao.inicio,
      endTime: sessao.fim,
      title: 'A · Peito',
      metadata: { clientRecordId: 'forja-treino-s1', clientRecordVersion: 1 },
    });
    expect(r.notes).toContain('2 séries');
    expect(r.notes).toContain('Supino reto: 2×');
    expect(r.notes).toContain('Bom treino');
  });

  it('usa um nome genérico para exercício desconhecido', () => {
    expect(sessionRecord({ ...sessao, nota: undefined }, () => undefined).notes).toContain('Exercício: 2×');
  });
});

const DEPOIS = new Date(2026, 10, 8).getTime();

describe('mealRecords', () => {
  const day: DayLog = {
    aguaMl: 500,
    entries: [entry('cafe', 'Pão', 50, 300, 8, 58, 3), entry('cafe', 'Ovo', 100, 146, 13, 1, 10), entry('jantar', 'Frango', 150, 160, 32)],
  };

  it('gera um registro por refeição com os totais e o horário típico', () => {
    const { records } = mealRecords('2026-11-07', day, 5, DEPOIS);
    expect(records).toHaveLength(2);
    const cafe = records[0];
    expect(cafe.mealType).toBe(1);
    expect(cafe.energy).toEqual({ value: 296, unit: 'kilocalories' });
    expect(cafe.protein).toEqual({ value: 17, unit: 'grams' });
    expect(cafe.totalCarbohydrate).toEqual({ value: 30, unit: 'grams' });
    expect(cafe.totalFat).toEqual({ value: 11.5, unit: 'grams' });
    expect(cafe.name).toBe('Café da manhã: Pão, Ovo');
    expect(cafe.metadata).toEqual({ clientRecordId: mealClientId('2026-11-07', 'cafe'), clientRecordVersion: 5 });
    const ini = new Date(cafe.startTime);
    expect([ini.getHours(), ini.getMinutes(), ini.getDate()]).toEqual([7, 0, 7]);
    expect(Date.parse(cafe.endTime) - ini.getTime()).toBe(15 * 60_000);
    expect(records[1].mealType).toBe(3);
  });

  it('lista as refeições vazias para apagar lá', () => {
    const { vazias } = mealRecords('2026-11-07', day, 1, DEPOIS);
    expect(vazias).toHaveLength(4);
    expect(vazias).toContain('forja-refeicao-2026-11-07-almoco');
    expect(vazias).not.toContain('forja-refeicao-2026-11-07-cafe');
  });

  it('dia sem registro apaga todas as refeições', () => {
    expect(mealRecords('2026-11-07', undefined, 1)).toEqual({ records: [], vazias: expect.arrayContaining([mealClientId('2026-11-07', 'ceia')]) });
  });

  it('refeição cujo horário ainda não chegou vai com o horário de agora', () => {
    const agora = new Date(2026, 10, 7, 15, 41).getTime();
    const { records } = mealRecords('2026-11-07', day, 1, agora);
    expect(new Date(records[0].startTime).getHours()).toBe(7);
    expect(records[1].endTime).toBe(new Date(agora).toISOString());
    expect(Date.parse(records[1].endTime) - Date.parse(records[1].startTime)).toBe(15 * 60_000);
  });

  it('limita o tamanho do nome', () => {
    const muitos: DayLog = { aguaMl: 0, entries: Array.from({ length: 20 }, (_, i) => entry('lanche_tarde', `Alimento ${i}`, 10, 100, 1)) };
    const r = mealRecords('2026-11-07', muitos, 1).records[0];
    expect(r.name!.length).toBe(100);
    expect(r.mealType).toBe(4);
  });
});

describe('weightsByDay', () => {
  const kg = (inKilograms: number) => ({ inKilograms });

  it('fica com a última medição de cada dia, em ordem', () => {
    const out = weightsByDay([
      { time: new Date(2026, 10, 6, 20).toISOString(), weight: kg(80.04) },
      { time: new Date(2026, 10, 5, 8).toISOString(), weight: kg(81) },
      { time: new Date(2026, 10, 6, 7).toISOString(), weight: kg(79.5) },
    ]);
    expect(out.map((w) => [w.data, w.pesoKg])).toEqual([
      ['2026-11-05', 81],
      ['2026-11-06', 80],
    ]);
  });

  it('ignora o que já foi importado, mesmo com formato de horário diferente', () => {
    const out = weightsByDay(
      [
        { time: '2026-11-06T10:00:00Z', weight: kg(80) },
        { time: '2026-11-07T10:00:00Z', weight: kg(79) },
      ],
      '2026-11-06T10:00:00.000Z',
    );
    expect(out).toEqual([{ data: dateOf('2026-11-07T10:00:00Z'), pesoKg: 79, time: '2026-11-07T10:00:00.000Z' }]);
  });

  it('descarta valores impossíveis', () => {
    expect(weightsByDay([{ time: '2026-11-06T10:00:00Z', weight: kg(0) }, { time: '2026-11-06T11:00:00Z', weight: kg(900) }])).toEqual([]);
  });
});

function dateOf(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('sleepMinutes', () => {
  it('soma sessões sem contar duas vezes a sobreposição', () => {
    expect(
      sleepMinutes([
        { startTime: '2026-11-06T23:00:00Z', endTime: '2026-11-07T03:00:00Z' },
        { startTime: '2026-11-07T02:00:00Z', endTime: '2026-11-07T06:30:00Z' },
        { startTime: '2026-11-07T04:00:00Z', endTime: '2026-11-07T05:00:00Z' },
        { startTime: '2026-11-07T13:00:00Z', endTime: '2026-11-07T13:30:00Z' },
      ]),
    ).toBe(7 * 60 + 30 + 30);
  });

  it('ignora intervalos inválidos', () => {
    expect(sleepMinutes([{ startTime: '2026-11-07T05:00:00Z', endTime: '2026-11-07T04:00:00Z' }])).toBe(0);
  });
});

describe('heartRateSummary', () => {
  it('arredonda média e pico', () => {
    expect(heartRateSummary({ BPM_AVG: 121.6, BPM_MAX: 168 })).toEqual({ media: 122, pico: 168 });
  });

  it('sem dados do relógio não mostra nada', () => {
    expect(heartRateSummary({ BPM_AVG: 0, BPM_MAX: 0 })).toBeUndefined();
    expect(heartRateSummary(undefined)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------

function fakeLib(over: Record<string, unknown> = {}) {
  return {
    SdkAvailabilityStatus: { SDK_UNAVAILABLE: 1, SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: 2, SDK_AVAILABLE: 3 },
    getSdkStatus: jest.fn().mockResolvedValue(3),
    initialize: jest.fn().mockResolvedValue(true),
    getGrantedPermissions: jest.fn().mockResolvedValue([{ accessType: 'read', recordType: 'Weight' }]),
    requestPermission: jest.fn().mockResolvedValue([{ accessType: 'write', recordType: 'Nutrition' }]),
    openHealthConnectSettings: jest.fn(),
    readRecords: jest.fn().mockResolvedValue({ records: [] }),
    aggregateRecord: jest.fn().mockResolvedValue({}),
    insertRecords: jest.fn().mockResolvedValue(['id']),
    deleteRecordsByUuids: jest.fn().mockResolvedValue(undefined),
    ...over,
  };
}

const use = (l: ReturnType<typeof fakeLib> | null) => resetHealthConnectForTests(l as never);

afterEach(() => resetHealthConnectForTests(undefined));

describe('sem o módulo nativo', () => {
  beforeEach(() => use(null));

  it('fica indisponível e não faz nada', async () => {
    expect(await hcStatus()).toBe('indisponivel');
    expect(await hcGranted()).toEqual(new Set());
    await expect(hcRequest()).rejects.toThrow('não está disponível');
    expect(() => hcOpenSettings()).not.toThrow();
    expect(await readWeights()).toEqual([]);
    expect(await readHeartRate('a', 'b')).toBeUndefined();
    expect(await readToday()).toEqual({});
    await expect(writeSession(sessao, () => undefined)).resolves.toBeUndefined();
    await expect(deleteSession('s1')).resolves.toBeUndefined();
    await expect(writeDiaryDay('2026-11-07', undefined)).resolves.toBeUndefined();
  });

  it('fora do Android nem tenta carregar', async () => {
    resetHealthConnectForTests(undefined);
    expect(Platform.OS).not.toBe('android');
    expect(await hcStatus()).toBe('indisponivel');
  });

  it('no Android sem o módulo (Expo Go) também fica indisponível', async () => {
    resetHealthConnectForTests(undefined);
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.doMock('react-native-health-connect', () => {
      throw new Error('not linked');
    });
    expect(await hcStatus()).toBe('indisponivel');
    jest.dontMock('react-native-health-connect');
    jest.restoreAllMocks();
  });
});

describe('com o Health Connect', () => {
  it('traduz o status do SDK', async () => {
    const l = fakeLib();
    use(l);
    expect(await hcStatus()).toBe('disponivel');
    l.getSdkStatus.mockResolvedValue(2);
    expect(await hcStatus()).toBe('atualizar');
    l.getSdkStatus.mockResolvedValue(1);
    expect(await hcStatus()).toBe('indisponivel');
    l.getSdkStatus.mockRejectedValue(new Error('x'));
    expect(await hcStatus()).toBe('indisponivel');
  });

  it('pede as permissões e lista as concedidas', async () => {
    const l = fakeLib();
    use(l);
    expect(await hcRequest()).toEqual(new Set(['write:Nutrition']));
    expect(l.requestPermission.mock.calls[0][0]).toHaveLength(6);
    expect(await hcGranted()).toEqual(new Set(['read:Weight']));
    expect(l.initialize).toHaveBeenCalledTimes(1);
    hcOpenSettings();
    expect(l.openHealthConnectSettings).toHaveBeenCalled();
  });

  it('não usa o cliente se o SDK estiver indisponível', async () => {
    const l = fakeLib({ getSdkStatus: jest.fn().mockResolvedValue(1) });
    use(l);
    expect(await hcGranted()).toEqual(new Set());
    expect(l.initialize).not.toHaveBeenCalled();
  });

  it('erro ao listar permissões vira lista vazia', async () => {
    use(fakeLib({ getGrantedPermissions: jest.fn().mockRejectedValue(new Error('x')) }));
    expect(await hcGranted()).toEqual(new Set());
  });

  it('lê pesos de todas as páginas, desde a última importação', async () => {
    const readRecords = jest
      .fn()
      .mockResolvedValueOnce({ records: [{ time: '2026-11-06T10:00:00Z', weight: { inKilograms: 80 } }], pageToken: 'p2' })
      .mockResolvedValueOnce({ records: [{ time: '2026-11-07T10:00:00Z', weight: { inKilograms: 79.4 } }], pageToken: '' });
    use(fakeLib({ readRecords }));
    const out = await readWeights('2026-11-01T00:00:00.000Z');
    expect(out.map((w) => w.pesoKg)).toEqual([80, 79.4]);
    expect(readRecords).toHaveBeenCalledTimes(2);
    expect(readRecords.mock.calls[0][1].timeRangeFilter).toEqual({ operator: 'after', startTime: '2026-11-01T00:00:00.000Z' });
    expect(readRecords.mock.calls[1][1].pageToken).toBe('p2');
  });

  it('na primeira leitura busca os últimos 30 dias', async () => {
    const readRecords = jest.fn().mockResolvedValue({ records: [] });
    use(fakeLib({ readRecords }));
    await readWeights();
    const desde = Date.parse(readRecords.mock.calls[0][1].timeRangeFilter.startTime);
    const dias = (Date.now() - desde) / 86_400_000;
    expect(dias).toBeGreaterThan(29.9);
    expect(dias).toBeLessThan(31.1);
  });

  it('lê a frequência cardíaca no intervalo do treino', async () => {
    const aggregateRecord = jest.fn().mockResolvedValue({ BPM_AVG: 130.2, BPM_MAX: 171 });
    use(fakeLib({ aggregateRecord }));
    expect(await readHeartRate(sessao.inicio, sessao.fim)).toEqual({ media: 130, pico: 171 });
    expect(aggregateRecord.mock.calls[0][0]).toEqual({
      recordType: 'HeartRate',
      timeRangeFilter: { operator: 'between', startTime: sessao.inicio, endTime: sessao.fim },
    });
  });

  it('lê passos de hoje e sono da noite', async () => {
    const now = new Date(2026, 10, 7, 15);
    const aggregateRecord = jest.fn().mockResolvedValue({ COUNT_TOTAL: 6532 });
    const readRecords = jest.fn().mockResolvedValue({
      records: [{ startTime: new Date(2026, 10, 6, 23).toISOString(), endTime: new Date(2026, 10, 7, 6, 15).toISOString() }],
    });
    use(fakeLib({ aggregateRecord, readRecords }));
    expect(await readToday(now)).toEqual({ passos: 6532, sonoMin: 435 });
    expect(aggregateRecord.mock.calls[0][0].timeRangeFilter.startTime).toBe(new Date(2026, 10, 7).toISOString());
    expect(readRecords.mock.calls[0][1].timeRangeFilter.startTime).toBe(new Date(2026, 10, 6, 18).toISOString());
  });

  it('sem passos ou sono, ou sem permissão, deixa o cartão de fora', async () => {
    use(
      fakeLib({
        aggregateRecord: jest.fn().mockRejectedValue(new Error('SecurityException')),
        readRecords: jest.fn().mockResolvedValue({ records: [] }),
      }),
    );
    expect(await readToday()).toEqual({ passos: undefined, sonoMin: undefined });
  });

  it('grava e apaga o treino pelo ID do Forja', async () => {
    const l = fakeLib();
    use(l);
    await writeSession(sessao, () => 'Supino');
    expect(l.insertRecords.mock.calls[0][0][0].metadata.clientRecordId).toBe(sessionClientId('s1'));
    await deleteSession('s1');
    expect(l.deleteRecordsByUuids).toHaveBeenCalledWith('ExerciseSession', [], ['forja-treino-s1']);
  });

  it('grava as refeições do dia e apaga as que ficaram vazias', async () => {
    const l = fakeLib();
    use(l);
    await writeDiaryDay('2026-11-07', { aguaMl: 0, entries: [entry('almoco', 'Arroz', 100, 128, 2.5, 28, 0.2)] }, 9);
    expect(l.insertRecords.mock.calls[0][0]).toHaveLength(1);
    expect(l.insertRecords.mock.calls[0][0][0].metadata.clientRecordVersion).toBe(9);
    expect(l.deleteRecordsByUuids.mock.calls[0][2]).toHaveLength(5);

    l.insertRecords.mockClear();
    await writeDiaryDay('2026-11-07', undefined);
    expect(l.insertRecords).not.toHaveBeenCalled();
    expect(l.deleteRecordsByUuids.mock.calls[1][2]).toHaveLength(6);
  });
});
