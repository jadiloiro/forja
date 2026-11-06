import app from '../../../app.json';
import { DEFAULT_REST_SOUND, REST_SOUNDS, restSoundOf, shouldAlertNow } from '../restSounds';
import { Settings } from '../trainingTypes';

const base: Settings = { incrementoBarraKg: 2.5, incrementoHalterKg: 2, vibrarDescanso: true };

describe('restSoundOf', () => {
  test('dados salvos antes da opção ficam com o som padrão', () => {
    expect(restSoundOf(base)).toBe(DEFAULT_REST_SOUND);
  });

  test('usa o som escolhido', () => {
    expect(restSoundOf({ ...base, somDescansoId: 'gongo' })).toBe('gongo');
  });

  test('com o som desligado não há som, mesmo com um escolhido', () => {
    expect(restSoundOf({ ...base, somDescanso: false, somDescansoId: 'gongo' })).toBeNull();
  });
});

describe('shouldAlertNow', () => {
  test('toca na hora, com o app aberto', () => {
    expect(shouldAlertNow(1000, 1000, 'active')).toBe(true);
    expect(shouldAlertNow(1000, 2000, 'active')).toBe(true);
  });

  test('não toca antes da hora', () => {
    expect(shouldAlertNow(1000, 999, 'active')).toBe(false);
  });

  test('não toca ao voltar do segundo plano com o descanso já vencido: a notificação já avisou', () => {
    expect(shouldAlertNow(1000, 60_000, 'active')).toBe(false);
  });

  test('não toca com o app fora de primeiro plano: quem avisa é a notificação', () => {
    expect(shouldAlertNow(1000, 1000, 'background')).toBe(false);
    expect(shouldAlertNow(1000, 1000, 'inactive')).toBe(false);
    expect(shouldAlertNow(1000, 1000, null)).toBe(false);
  });
});

test('todo som do Perfil está no build do app', () => {
  const plugin = app.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-notifications') as [string, { sounds: string[] }];

  for (const nome of [...REST_SOUNDS.map((s) => s.id), 'aviso']) {
    expect(plugin[1].sounds).toContain(`./assets/sounds/${nome}.wav`);
  }
});
