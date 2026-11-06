import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { playRestSound } from '../restAlarm';

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));

const create = jest.mocked(createAudioPlayer);
const setMode = jest.mocked(setAudioModeAsync);

const seekTo = jest.fn().mockResolvedValue(undefined);
const play = jest.fn();

beforeAll(() => {
  create.mockReturnValue({ seekTo, play } as never);
});
beforeEach(() => {
  seekTo.mockClear();
  play.mockClear();
});

test('toca do começo, por cima da música e respeitando o modo silencioso', () => {
  playRestSound('sino');
  expect(setMode).toHaveBeenCalledWith({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
  expect(seekTo).toHaveBeenCalledWith(0);
  expect(play).toHaveBeenCalledTimes(1);
});

test('reaproveita o player de cada som e só configura o áudio uma vez', () => {
  playRestSound('gongo');
  const criados = create.mock.calls.length;
  playRestSound('gongo');
  expect(create.mock.calls.length).toBe(criados);
  expect(setMode).toHaveBeenCalledTimes(1);
  expect(play).toHaveBeenCalledTimes(2);
});

test('uma falha no áudio não derruba o treino', () => {
  play.mockImplementationOnce(() => {
    throw new Error('sem áudio');
  });
  expect(() => playRestSound('bipes')).not.toThrow();
});
