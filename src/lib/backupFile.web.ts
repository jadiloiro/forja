import * as DocumentPicker from 'expo-document-picker';

import { dateKey } from './date';

// Na web o expo-file-system não existe: baixa o arquivo direto pelo navegador.

export const backupFileName = () => `forja-backup-${dateKey()}.json`;

export async function saveBackupFile(json: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName();
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function pickBackupFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'] });
  if (res.canceled) return null;
  const asset = res.assets[0];
  return asset.file ? asset.file.text() : (await fetch(asset.uri)).text();
}
