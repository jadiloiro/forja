import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { RestSoundId } from './restSounds';

const SOURCES = {
  sino: require('../../assets/sounds/sino.wav'),
  bipes: require('../../assets/sounds/bipes.wav'),
  gongo: require('../../assets/sounds/gongo.wav'),
  aviso: require('../../assets/sounds/aviso.wav'),
} as const;

const players: Partial<Record<keyof typeof SOURCES, AudioPlayer>> = {};
let modeSet = false;

/** Toca o som do descanso com o app aberto, por cima da música e respeitando o modo silencioso. */
export function playRestSound(id: RestSoundId | 'aviso'): void {
  try {
    if (!modeSet) {
      modeSet = true;
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    }
    const player = (players[id] ??= createAudioPlayer(SOURCES[id]));
    player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // Som é só um reforço: a contagem na tela e a vibração continuam funcionando.
  }
}
