import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

import { useStore } from '../store/useStore';
import { formatTime } from './date';
import { AVISO_SEG, REST_SOUNDS, restSoundOf, RestSoundId } from './restSounds';
import { Settings } from './trainingTypes';

// Avisa o fim do descanso com o app minimizado ou com a tela bloqueada.
// O agendamento segue `session.descansoAte` no store: iniciar, ajustar (±15 s),
// pular ou finalizar o treino reagenda ou cancela as mesmas notificações.

const ID = 'forja-descanso';
const ID_AVISO = 'forja-descanso-aviso';
const LEGACY_CHANNEL = 'descanso';
const CHANNEL_AVISO = 'descanso-aviso';
const CHANNEL_CONTAGEM = 'descanso-contagem';
const VIBRATION = [0, 350, 150, 350];

/** O Android não muda som nem vibração de um canal já criado: cada combinação tem o seu. */
export function restChannelId(som: RestSoundId | null, vibrar: boolean): string {
  return `descanso-${som ?? 'mudo'}-${vibrar ? 'vibra' : 'quieto'}`;
}

interface Config {
  enabled: boolean;
  som: RestSoundId | null;
  vibrar: boolean;
  aviso: boolean;
}

function configOf(settings: Settings): Config {
  return {
    enabled: settings.notificarDescanso ?? true,
    som: restSoundOf(settings),
    vibrar: settings.vibrarDescanso,
    aviso: settings.avisoDezSeg ?? false,
  };
}

/** Com o timer na tela, ele mesmo toca e vibra; a notificação só aparece fora dele. */
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

async function setupChannels(cfg: Config) {
  if (Platform.OS !== 'android') return;
  const current = restChannelId(cfg.som, cfg.vibrar);
  const others = [null, ...REST_SOUNDS.map((s) => s.id)]
    .flatMap((som) => [restChannelId(som, true), restChannelId(som, false)])
    .filter((id) => id !== current);
  await Promise.all([LEGACY_CHANNEL, ...others].map((id) => Notifications.deleteNotificationChannelAsync(id)));
  await Notifications.setNotificationChannelAsync(current, {
    name: 'Fim do descanso',
    importance: AndroidImportance.HIGH,
    lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
    sound: cfg.som ? `${cfg.som}.wav` : null,
    enableVibrate: cfg.vibrar,
    vibrationPattern: cfg.vibrar ? VIBRATION : null,
  });
  await Notifications.setNotificationChannelAsync(CHANNEL_AVISO, {
    name: `Aviso de ${AVISO_SEG} segundos`,
    importance: AndroidImportance.HIGH,
    sound: 'aviso.wav',
    enableVibrate: false,
    vibrationPattern: null,
  });
  await Notifications.setNotificationChannelAsync(CHANNEL_CONTAGEM, {
    name: 'Descanso em andamento',
    importance: AndroidImportance.LOW,
    sound: null,
    enableVibrate: false,
    vibrationPattern: null,
  });
}

async function sync(ate: number | undefined, cfg: Config) {
  await Notifications.cancelScheduledNotificationAsync(ID);
  await Notifications.cancelScheduledNotificationAsync(ID_AVISO);
  await Notifications.dismissNotificationAsync(ID);
  await Notifications.dismissNotificationAsync(ID_AVISO);
  if (!cfg.enabled || !ate || ate - Date.now() < 1000) return;
  if (!(await ensurePermission())) return;

  // A notificação do fim usa o mesmo ID da contagem: o Android troca uma pela outra na barra de status.
  // O Forja não tem como atualizar um contador com o app minimizado, por isso mostra o horário do fim.
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title: 'Descansando', body: `Próxima série às ${formatTime(ate)}.`, sound: false, data: { contagem: true } },
    trigger: { channelId: CHANNEL_CONTAGEM },
  });
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title: 'Descanso concluído', body: 'Hora da próxima série.', sound: cfg.som ? `${cfg.som}.wav` : false },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: ate, channelId: restChannelId(cfg.som, cfg.vibrar) },
  });
  if (cfg.aviso && ate - Date.now() > (AVISO_SEG + 1) * 1000) {
    await Notifications.scheduleNotificationAsync({
      identifier: ID_AVISO,
      content: { title: `Faltam ${AVISO_SEG} segundos`, body: 'Prepare-se para a próxima série.', sound: 'aviso.wav' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: ate - AVISO_SEG * 1000, channelId: CHANNEL_AVISO },
    });
  }
}

export function startRestNotifications(): () => void {
  Notifications.setNotificationHandler({
    handleNotification: async (n) => {
      if (n.request.content.data?.contagem) {
        // Fica só na barra de status: precisa estar lá quando o app for minimizado.
        return { shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false };
      }
      const hide = (n.request.identifier === ID || n.request.identifier === ID_AVISO) && timerOnScreen;
      return { shouldShowBanner: !hide, shouldShowList: !hide, shouldPlaySound: !hide, shouldSetBadge: false };
    },
  });

  const state = useStore.getState();
  const initialCfg = configOf(state.settings);
  run(() => setupChannels(initialCfg));
  run(() => sync(state.session?.descansoAte, initialCfg));

  return useStore.subscribe((s, prev) => {
    const cfg = configOf(s.settings);
    const prevCfg = configOf(prev.settings);
    const cfgChanged = JSON.stringify(cfg) !== JSON.stringify(prevCfg);
    if (cfg.enabled && s.session && !prev.session) run(ensurePermission);
    if (cfgChanged) run(() => setupChannels(cfg));
    const ate = s.session?.descansoAte;
    if (cfgChanged || ate !== prev.session?.descansoAte) run(() => sync(ate, cfg));
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
