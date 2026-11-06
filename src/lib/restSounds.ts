import { Settings } from './trainingTypes';

// Os arquivos ficam em assets/sounds, gerados por scripts/build_rest_sounds.py e listados em app.json.

export type RestSoundId = 'sino' | 'bipes' | 'gongo';

export const REST_SOUNDS: { id: RestSoundId; nome: string }[] = [
  { id: 'sino', nome: 'Sino' },
  { id: 'bipes', nome: 'Bipes' },
  { id: 'gongo', nome: 'Gongo' },
];

export const DEFAULT_REST_SOUND: RestSoundId = 'bipes';

/** Segundos antes do fim em que o aviso curto toca. */
export const AVISO_SEG = 10;

/** Som escolhido, ou null se o som estiver desligado. Dados salvos antes destas opções ficam com o padrão. */
export function restSoundOf(settings: Settings): RestSoundId | null {
  return (settings.somDescanso ?? true) ? (settings.somDescansoId ?? DEFAULT_REST_SOUND) : null;
}

/**
 * Só toca com o app aberto e na hora certa. Se o app volta do segundo plano com o descanso já
 * vencido, a notificação já avisou: tocar de novo duplicaria o alarme.
 */
export function shouldAlertNow(alvo: number, agora: number, appState: string | null | undefined): boolean {
  return appState === 'active' && agora >= alvo && agora - alvo < 1500;
}
