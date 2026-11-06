import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { useStore } from '../../store/useStore';
import { exactAlarmGranted, requestExactAlarm, restChannelId, setRestTimerOnScreen, startRestNotifications } from '../restNotifications';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { LOW: 2, HIGH: 4 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  deleteNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  dismissNotificationAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
  getExactAlarmPermissionsAsync: jest.fn(),
  requestExactAlarmPermissionsAsync: jest.fn(),
}));

const mocked = jest.mocked(Notifications);
// Os retornos reais têm muitos campos; aqui só importam estes.
const permission = (p: { granted: boolean; canAskAgain?: boolean }) => ({ canAskAgain: true, ...p }) as never;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

type Agendada = { identifier: string; content: { sound?: unknown; body?: string; data?: { contagem?: boolean } }; trigger: { type?: string; date?: number; channelId?: string } };
const agendadas = () => mocked.scheduleNotificationAsync.mock.calls.map((c) => c[0] as unknown as Agendada);
const fins = () => agendadas().filter((n) => n.identifier === 'forja-descanso' && n.trigger.type === 'date');
const avisos = () => agendadas().filter((n) => n.identifier === 'forja-descanso-aviso');
const contagens = () => agendadas().filter((n) => n.content.data?.contagem);

function setRest(descansoAte: number | undefined) {
  useStore.setState({ session: { id: 's', nome: 'Treino', inicio: '', exercicios: [], descansoAte } });
}

let stop: () => void;

beforeEach(async () => {
  jest.clearAllMocks();
  mocked.getPermissionsAsync.mockResolvedValue(permission({ granted: true }));
  useStore.getState().resetAll();
  stop = startRestNotifications();
  await flush();
  jest.clearAllMocks();
  mocked.getPermissionsAsync.mockResolvedValue(permission({ granted: true }));
});
afterEach(() => {
  stop();
  jest.restoreAllMocks();
});

describe('agendamento do fim do descanso', () => {
  test('iniciar o descanso agenda para o horário em que ele acaba, no canal do som escolhido', async () => {
    const ate = Date.now() + 60_000;
    setRest(ate);
    await flush();

    expect(fins()).toHaveLength(1);
    expect(fins()[0]).toMatchObject({
      content: { sound: 'bipes.wav' },
      trigger: { date: ate, channelId: restChannelId('bipes', true) },
    });
  });

  test('ajustar o descanso troca o agendamento, sem deixar dois vivos', async () => {
    const ate = Date.now() + 60_000;
    setRest(ate);
    setRest(ate + 15_000);
    await flush();

    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(4);
    expect(fins().at(-1)).toMatchObject({ trigger: { date: ate + 15_000 } });
    const ordem = [
      ...mocked.cancelScheduledNotificationAsync.mock.invocationCallOrder.slice(-1),
      ...mocked.scheduleNotificationAsync.mock.invocationCallOrder.slice(-2),
    ];
    expect(ordem).toEqual([...ordem].sort((a, b) => a - b));
  });

  test('pular o descanso cancela, tira da barra de status e não agenda', async () => {
    setRest(Date.now() + 60_000);
    await flush();
    jest.clearAllMocks();

    setRest(undefined);
    await flush();

    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('forja-descanso');
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('forja-descanso-aviso');
    expect(mocked.dismissNotificationAsync).toHaveBeenCalledWith('forja-descanso');
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('descanso que já acabou não agenda', async () => {
    setRest(Date.now() + 500);
    await flush();
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('com o aviso desligado nas configurações, não agenda', async () => {
    useStore.getState().updateSettings({ notificarDescanso: false });
    setRest(Date.now() + 60_000);
    await flush();
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('mudança sem relação com o descanso não mexe no agendamento', async () => {
    useStore.getState().updateSettings({ incrementoBarraKg: 5 });
    await flush();
    expect(mocked.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  test('uma falha não impede os próximos agendamentos', async () => {
    mocked.scheduleNotificationAsync.mockRejectedValueOnce(new Error('falhou'));
    setRest(Date.now() + 60_000);
    await flush();
    setRest(Date.now() + 90_000);
    await flush();
    expect(fins()).toHaveLength(1);
  });
});

describe('contagem na barra de status', () => {
  test('mostra o horário do fim, sem som, com o mesmo ID do alarme que vai substituí-la', async () => {
    const ate = new Date(2030, 0, 1, 14, 32).getTime();
    setRest(ate);
    await flush();

    expect(contagens()).toHaveLength(1);
    expect(contagens()[0]).toMatchObject({
      identifier: fins()[0].identifier,
      content: { sound: false, body: 'Próxima série às 14:32.' },
      trigger: { channelId: 'descanso-contagem' },
    });
  });
});

describe('aviso antes do fim', () => {
  test('desligado por padrão', async () => {
    setRest(Date.now() + 60_000);
    await flush();
    expect(avisos()).toHaveLength(0);
  });

  test('ligado, agenda 10 s antes do fim', async () => {
    useStore.getState().updateSettings({ avisoDezSeg: true });
    const ate = Date.now() + 60_000;
    setRest(ate);
    await flush();
    expect(avisos()).toHaveLength(1);
    expect(avisos()[0].trigger.date).toBe(ate - 10_000);
  });

  test('descanso curto demais não tem aviso', async () => {
    useStore.getState().updateSettings({ avisoDezSeg: true });
    setRest(Date.now() + 9_000);
    await flush();
    expect(avisos()).toHaveLength(0);
    expect(fins()).toHaveLength(1);
  });
});

describe('opções de som e vibração', () => {
  test('sem som e sem vibração usa o canal mudo', async () => {
    useStore.getState().updateSettings({ somDescanso: false, vibrarDescanso: false });
    setRest(Date.now() + 60_000);
    await flush();
    expect(fins()[0]).toMatchObject({ content: { sound: false }, trigger: { channelId: restChannelId(null, false) } });
  });

  test('trocar o som durante o descanso reagenda no canal novo', async () => {
    setRest(Date.now() + 60_000);
    await flush();
    useStore.getState().updateSettings({ somDescansoId: 'gongo' });
    await flush();
    expect(fins().at(-1)).toMatchObject({ trigger: { channelId: restChannelId('gongo', true) } });
  });
});

describe('permissão', () => {
  test('pede ao iniciar o treino', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(permission({ granted: false }));
    mocked.requestPermissionsAsync.mockResolvedValue(permission({ granted: true }));
    useStore.setState({ session: undefined });
    setRest(undefined);
    await flush();
    expect(mocked.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  test('não pede ao iniciar o treino com o aviso desligado', async () => {
    useStore.getState().updateSettings({ notificarDescanso: false });
    mocked.getPermissionsAsync.mockResolvedValue(permission({ granted: false }));
    setRest(undefined);
    await flush();
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test('não agenda se o usuário recusar', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(permission({ granted: false }));
    mocked.requestPermissionsAsync.mockResolvedValue(permission({ granted: false }));
    setRest(Date.now() + 60_000);
    await flush();
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('não insiste quando o sistema não deixa pedir de novo', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(permission({ granted: false, canAskAgain: false }));
    setRest(Date.now() + 60_000);
    await flush();
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('exibição com o app aberto', () => {
  async function comportamento(identifier: string, data: Record<string, unknown> = {}) {
    stop();
    stop = startRestNotifications();
    await flush();
    const { handleNotification } = mocked.setNotificationHandler.mock.lastCall![0]!;
    return handleNotification({ request: { identifier, content: { data } } } as never);
  }

  afterEach(() => setRestTimerOnScreen(false));

  test.each(['forja-descanso', 'forja-descanso-aviso'])('com o timer na tela, %s não aparece nem toca: o som sai só uma vez', async (id) => {
    setRestTimerOnScreen(true);
    expect(await comportamento(id)).toMatchObject({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false });
  });

  test('fora da tela do timer, o alarme aparece e toca', async () => {
    expect(await comportamento('forja-descanso')).toMatchObject({ shouldShowBanner: true, shouldPlaySound: true });
  });

  test('a contagem fica na barra de status, sem banner, mesmo com o timer na tela', async () => {
    setRestTimerOnScreen(true);
    expect(await comportamento('forja-descanso', { contagem: true })).toMatchObject({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false });
  });
});

describe('Android', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
  });

  async function reiniciar() {
    stop();
    stop = startRestNotifications();
    await flush();
  }

  test('cria o canal do som escolhido, com importância alta e vibração', async () => {
    await reiniciar();
    expect(mocked.setNotificationChannelAsync).toHaveBeenCalledWith(
      restChannelId('bipes', true),
      expect.objectContaining({ importance: 4, sound: 'bipes.wav', enableVibrate: true }),
    );
  });

  test('canal sem som e sem vibração fica mudo de verdade', async () => {
    useStore.getState().updateSettings({ somDescanso: false, vibrarDescanso: false });
    await flush();
    expect(mocked.setNotificationChannelAsync).toHaveBeenCalledWith(
      restChannelId(null, false),
      expect.objectContaining({ sound: null, enableVibrate: false, vibrationPattern: null }),
    );
  });

  test('a contagem usa um canal discreto, sem som', async () => {
    await reiniciar();
    expect(mocked.setNotificationChannelAsync).toHaveBeenCalledWith('descanso-contagem', expect.objectContaining({ importance: 2, sound: null }));
  });

  test('apaga o canal antigo e os das outras combinações', async () => {
    await reiniciar();
    const apagados = mocked.deleteNotificationChannelAsync.mock.calls.map((c) => c[0]);
    expect(apagados).toContain('descanso');
    expect(apagados).toContain(restChannelId('gongo', false));
    expect(apagados).not.toContain(restChannelId('bipes', true));
  });

  test('consulta e pede a permissão de alarme exato', async () => {
    mocked.getExactAlarmPermissionsAsync.mockResolvedValue(permission({ granted: false }));
    mocked.requestExactAlarmPermissionsAsync.mockResolvedValue(permission({ granted: true }));
    await expect(exactAlarmGranted()).resolves.toBe(false);
    await expect(requestExactAlarm()).resolves.toBe(true);
  });
});

test('fora do Android o alarme exato não é necessário e não há canais', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  await expect(exactAlarmGranted()).resolves.toBe(true);
  await expect(requestExactAlarm()).resolves.toBe(true);
  expect(mocked.getExactAlarmPermissionsAsync).not.toHaveBeenCalled();
  expect(mocked.setNotificationChannelAsync).not.toHaveBeenCalled();
});
