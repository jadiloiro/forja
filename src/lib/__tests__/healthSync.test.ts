import { AppState } from 'react-native';

import { useStore } from '../../store/useStore';
import { dateKey } from '../date';
import * as hc from '../healthConnect';
import { pullWeights, startHealthSync } from '../healthSync';
import { SessionRecord } from '../trainingTypes';

jest.mock('../healthConnect', () => ({
  readWeights: jest.fn().mockResolvedValue([]),
  writeSession: jest.fn().mockResolvedValue(undefined),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  writeDiaryDay: jest.fn().mockResolvedValue(undefined),
}));

const mocked = jest.mocked(hc);
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const rec = (id: string, fim: string): SessionRecord => ({ id, nome: 'Treino', inicio: fim, fim, volumeKg: 0, exercicios: [] });

const profile = {
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
} as never;

let listeners: ((st: string) => void)[];
let stop: () => void;

beforeEach(() => {
  jest.clearAllMocks();
  useStore.getState().resetAll();
  listeners = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, fn) => {
    listeners.push(fn as (st: string) => void);
    return { remove: jest.fn() } as never;
  });
});

afterEach(() => {
  stop?.();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const ligar = () => useStore.getState().updateSettings({ healthConnect: true });

describe('pullWeights', () => {
  it('importa os pesos e guarda até onde leu', async () => {
    useStore.setState({ profile, targets: { kcal: 2000, p: 150, c: 200, g: 60, aguaMl: 2500, manual: false } });
    mocked.readWeights.mockResolvedValueOnce([
      { data: '2026-11-05', pesoKg: 81, time: '2026-11-05T08:00:00.000Z' },
      { data: '2026-11-06', pesoKg: 79.6, time: '2026-11-06T08:00:00.000Z' },
    ]);
    expect(await pullWeights()).toBe(2);
    const st = useStore.getState();
    expect(st.bodyWeights).toEqual([
      { data: '2026-11-05', pesoKg: 81 },
      { data: '2026-11-06', pesoKg: 79.6 },
    ]);
    expect(st.profile?.pesoKg).toBe(79.6);
    expect(st.settings.hcPesoAte).toBe('2026-11-06T08:00:00.000Z');

    await pullWeights();
    expect(mocked.readWeights).toHaveBeenLastCalledWith('2026-11-06T08:00:00.000Z');
  });

  it('sem pesos novos não mexe em nada', async () => {
    expect(await pullWeights()).toBe(0);
    expect(useStore.getState().settings.hcPesoAte).toBeUndefined();
  });

  it('chamadas simultâneas fazem uma leitura só', async () => {
    await Promise.all([pullWeights(), pullWeights()]);
    expect(mocked.readWeights).toHaveBeenCalledTimes(1);
  });
});

describe('startHealthSync', () => {
  it('desligado não lê nem grava nada', async () => {
    stop = startHealthSync();
    useStore.setState({ history: [rec('a', new Date().toISOString())] });
    useStore.getState().addWater(dateKey(), 250);
    listeners.forEach((l) => l('active'));
    await flush();
    expect(mocked.readWeights).not.toHaveBeenCalled();
    expect(mocked.writeSession).not.toHaveBeenCalled();
  });

  it('lê o peso ao abrir o app, ao ligar e ao voltar ao primeiro plano', async () => {
    ligar();
    stop = startHealthSync();
    await flush();
    expect(mocked.readWeights).toHaveBeenCalledTimes(1);
    listeners.forEach((l) => l('active'));
    await flush();
    expect(mocked.readWeights).toHaveBeenCalledTimes(2);

    stop();
    useStore.getState().updateSettings({ healthConnect: false });
    stop = startHealthSync();
    ligar();
    await flush();
    expect(mocked.readWeights).toHaveBeenCalledTimes(3);
  });

  it('grava o treino recém-terminado, mas não os antigos de um backup', async () => {
    ligar();
    stop = startHealthSync();
    const novo = rec('novo', new Date().toISOString());
    const antigo = rec('antigo', '2026-01-01T10:00:00.000Z');
    useStore.setState({ history: [novo, antigo] });
    await flush();
    expect(mocked.writeSession).toHaveBeenCalledTimes(1);
    expect(mocked.writeSession.mock.calls[0][0].id).toBe('novo');
    // os nomes dos exercícios vêm da base
    expect(mocked.writeSession.mock.calls[0][1]('supino_reto_barra')).toBeTruthy();
  });

  it('apaga lá o treino excluído aqui, mas não quando o histórico inteiro muda', async () => {
    useStore.setState({ history: [rec('a', '2026-01-01T10:00:00.000Z'), rec('b', '2026-01-02T10:00:00.000Z')] });
    ligar();
    stop = startHealthSync();
    useStore.getState().deleteRecord('a');
    await flush();
    expect(mocked.deleteSession).toHaveBeenCalledWith('a');

    // Backup com um treino a menos e a integração ligada.
    useStore.getState().importBackup(JSON.stringify({ app: 'forja', plans: [], history: [], settings: { ...useStore.getState().settings } }));
    await flush();
    expect(useStore.getState().settings.healthConnect).toBe(true);
    expect(mocked.deleteSession).toHaveBeenCalledTimes(1);
  });

  it('envia o diário alguns segundos depois da última mudança, e na hora ao sair do app', async () => {
    jest.useFakeTimers();
    ligar();
    stop = startHealthSync();
    const hoje = dateKey();
    useStore.getState().addWater(hoje, 250);
    useStore.getState().addWater(hoje, 250);
    expect(mocked.writeDiaryDay).not.toHaveBeenCalled();
    jest.advanceTimersByTime(3000);
    expect(mocked.writeDiaryDay).toHaveBeenCalledTimes(1);
    expect(mocked.writeDiaryDay.mock.calls[0][0]).toBe(hoje);
    expect(mocked.writeDiaryDay.mock.calls[0][1]?.aguaMl).toBe(500);

    useStore.getState().addWater(hoje, 100);
    listeners.forEach((l) => l('background'));
    expect(mocked.writeDiaryDay).toHaveBeenCalledTimes(2);
  });

  it('não reenvia dias antigos do diário', async () => {
    jest.useFakeTimers();
    ligar();
    stop = startHealthSync();
    useStore.getState().addWater('2020-01-01', 250);
    jest.advanceTimersByTime(5000);
    expect(mocked.writeDiaryDay).not.toHaveBeenCalled();
  });

  it('desligar antes do envio cancela o diário pendente', async () => {
    jest.useFakeTimers();
    ligar();
    stop = startHealthSync();
    useStore.getState().addWater(dateKey(), 250);
    useStore.getState().updateSettings({ healthConnect: false });
    jest.advanceTimersByTime(5000);
    expect(mocked.writeDiaryDay).not.toHaveBeenCalled();
  });
});
