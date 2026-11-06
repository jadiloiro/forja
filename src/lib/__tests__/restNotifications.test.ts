import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { useStore } from '../../store/useStore';
import { exactAlarmGranted, requestExactAlarm, setRestTimerOnScreen, startRestNotifications } from '../restNotifications';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
  getExactAlarmPermissionsAsync: jest.fn(),
  requestExactAlarmPermissionsAsync: jest.fn(),
}));

const mocked = jest.mocked(Notifications);
// Os retornos reais têm muitos campos; aqui só importam estes.
const permission = (p: { granted: boolean; canAskAgain?: boolean }) => ({ canAskAgain: true, ...p }) as never;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

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
  test('iniciar o descanso agenda para o horário em que ele acaba', async () => {
    const ate = Date.now() + 60_000;
    setRest(ate);
    await flush();

    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mocked.scheduleNotificationAsync.mock.calls[0][0]).toMatchObject({
      identifier: 'forja-descanso',
      trigger: { date: ate, channelId: 'descanso' },
    });
  });

  test('ajustar o descanso troca o agendamento, sem deixar dois vivos', async () => {
    const ate = Date.now() + 60_000;
    setRest(ate);
    setRest(ate + 15_000);
    await flush();

    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(mocked.scheduleNotificationAsync.mock.lastCall?.[0]).toMatchObject({ trigger: { date: ate + 15_000 } });
  });

  test('pular o descanso cancela e não agenda', async () => {
    setRest(Date.now() + 60_000);
    await flush();
    mocked.scheduleNotificationAsync.mockClear();
    mocked.cancelScheduledNotificationAsync.mockClear();

    setRest(undefined);
    await flush();

    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('forja-descanso');
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
    useStore.getState().updateSettings({ vibrarDescanso: false });
    await flush();
    expect(mocked.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  test('uma falha não impede os próximos agendamentos', async () => {
    mocked.scheduleNotificationAsync.mockRejectedValueOnce(new Error('falhou'));
    setRest(Date.now() + 60_000);
    await flush();
    setRest(Date.now() + 90_000);
    await flush();
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  });
});

describe('permissão', () => {
  test('pede a permissão no primeiro descanso e agenda se o usuário aceitar', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(permission({ granted: false }));
    mocked.requestPermissionsAsync.mockResolvedValue(permission({ granted: true }));
    setRest(Date.now() + 60_000);
    await flush();
    expect(mocked.requestPermissionsAsync).toHaveBeenCalled();
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalled();
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

describe('exibição', () => {
  async function comportamento(identifier: string) {
    stop();
    stop = startRestNotifications();
    await flush();
    const { handleNotification } = mocked.setNotificationHandler.mock.lastCall![0]!;
    return handleNotification({ request: { identifier } } as never);
  }

  test('com o timer na tela, o aviso do descanso fica escondido', async () => {
    setRestTimerOnScreen(true);
    expect(await comportamento('forja-descanso')).toMatchObject({ shouldShowBanner: false, shouldPlaySound: false });
    setRestTimerOnScreen(false);
  });

  test('fora da tela do timer, o aviso aparece', async () => {
    setRestTimerOnScreen(false);
    expect(await comportamento('forja-descanso')).toMatchObject({ shouldShowBanner: true, shouldPlaySound: true });
  });
});

describe('Android', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
  });

  test('cria o canal do descanso com importância alta', async () => {
    stop();
    stop = startRestNotifications();
    await flush();
    expect(mocked.setNotificationChannelAsync).toHaveBeenCalledWith('descanso', expect.objectContaining({ importance: 4 }));
  });

  test('consulta e pede a permissão de alarme exato', async () => {
    mocked.getExactAlarmPermissionsAsync.mockResolvedValue(permission({ granted: false }));
    mocked.requestExactAlarmPermissionsAsync.mockResolvedValue(permission({ granted: true }));
    await expect(exactAlarmGranted()).resolves.toBe(false);
    await expect(requestExactAlarm()).resolves.toBe(true);
  });
});

test('fora do Android o alarme exato não é necessário', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  await expect(exactAlarmGranted()).resolves.toBe(true);
  await expect(requestExactAlarm()).resolves.toBe(true);
  expect(mocked.getExactAlarmPermissionsAsync).not.toHaveBeenCalled();
});
