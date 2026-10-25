import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

import { useStore } from '../store/useStore';

// Avisa o fim do descanso com o app minimizado ou com a tela bloqueada.
// O agendamento segue `session.descansoAte` no store: iniciar, ajustar (±15 s),
// pular ou finalizar o treino reagenda ou cancela a mesma notificação.

const ID = 'forja-descanso';
const CHANNEL = 'descanso';

/** Com o timer na tela, ele mesmo vibra e mostra o aviso; a notificação só aparece fora dele. */
let timerOnScreen = false;
export function setRestTimerOnScreen(v: boolean) {
  timerOnScreen = v;
}

// Encadeia as operações: ±15 s em sequência não pode deixar dois agendamentos vivos.
let queue: Promise<unknown> = Promise.resolve();
const run = (fn: () => Promise<unknown>) => {
  queue = queue.then(fn).catch(() => {});
};

async function ensurePermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted || cur.ios?.status === IosAuthorizationStatus.PROVISIONAL) return true;
  if (!cur.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function sync(ate: number | undefined, enabled: boolean) {
  await Notifications.cancelScheduledNotificationAsync(ID);
  if (!enabled || !ate || ate - Date.now() < 1000) return;
  // Pede a permissão só aqui, no primeiro descanso: o pedido faz sentido nesse momento.
  if (!(await ensurePermission())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title: 'Descanso concluído', body: 'Hora da próxima série.', sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: ate, channelId: CHANNEL },
  });
}

export function startRestNotifications(): () => void {
  Notifications.setNotificationHandler({
    handleNotification: async (n) => {
      const hide = n.request.identifier === ID && timerOnScreen;
      return { shouldShowBanner: !hide, shouldShowList: !hide, shouldPlaySound: !hide, shouldSetBadge: false };
    },
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Fim do descanso',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 350, 150, 350],
    }).catch(() => {});
  }

  const enabledOf = (s: ReturnType<typeof useStore.getState>) => s.settings.notificarDescanso ?? true;
  const initial = useStore.getState();
  run(() => sync(initial.session?.descansoAte, enabledOf(initial)));

  return useStore.subscribe((s, prev) => {
    const ate = s.session?.descansoAte;
    if (ate !== prev.session?.descansoAte || enabledOf(s) !== enabledOf(prev)) run(() => sync(ate, enabledOf(s)));
  });
}

/** Android 12+: sem "alarmes exatos" o aviso pode chegar alguns minutos atrasado. */
export async function exactAlarmGranted(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  return (await Notifications.getExactAlarmPermissionsAsync()).granted;
}

export async function requestExactAlarm(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  return (await Notifications.requestExactAlarmPermissionsAsync()).granted;
}
