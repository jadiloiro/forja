import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

import { backupFileName, pickBackupFile, saveBackupFile } from '../backupFile';

const mockCreate = jest.fn();
const mockWrite = jest.fn();
const mockText = jest.fn();

jest.mock('expo-file-system', () => ({
  Paths: { cache: 'cache:' },
  File: jest.fn().mockImplementation((...partes: string[]) => ({
    uri: partes.join('/'),
    create: mockCreate,
    write: mockWrite,
    text: mockText,
  })),
}));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));

const isAvailable = jest.mocked(Sharing.isAvailableAsync);
const share = jest.mocked(Sharing.shareAsync);
const getDocument = jest.mocked(DocumentPicker.getDocumentAsync);

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }).setSystemTime(new Date(2026, 10, 6, 12));
});
afterEach(() => {
  jest.useRealTimers();
});

test('o nome do arquivo leva a data do dia', () => {
  expect(backupFileName()).toBe('forja-backup-2026-11-06.json');
});

describe('saveBackupFile', () => {
  test('grava o conteúdo e abre o compartilhamento', async () => {
    isAvailable.mockResolvedValue(true);
    await saveBackupFile('{"app":"forja"}');

    expect(mockCreate).toHaveBeenCalledWith({ overwrite: true });
    expect(mockWrite).toHaveBeenCalledWith('{"app":"forja"}');
    expect(share).toHaveBeenCalledWith('cache:/forja-backup-2026-11-06.json', expect.objectContaining({ mimeType: 'application/json' }));
  });

  test('avisa quando o aparelho não compartilha', async () => {
    isAvailable.mockResolvedValue(false);
    await expect(saveBackupFile('{}')).rejects.toThrow('Compartilhamento indisponível');
    expect(share).not.toHaveBeenCalled();
  });
});

describe('pickBackupFile', () => {
  test('devolve o conteúdo do arquivo escolhido', async () => {
    getDocument.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///b.json', name: 'b.json', lastModified: 0 }] });
    mockText.mockResolvedValue('{"app":"forja"}');
    await expect(pickBackupFile()).resolves.toBe('{"app":"forja"}');
  });

  test('devolve null se o usuário cancelar', async () => {
    getDocument.mockResolvedValue({ canceled: true, assets: null });
    await expect(pickBackupFile()).resolves.toBeNull();
  });
});
