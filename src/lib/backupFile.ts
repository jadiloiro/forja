import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { dateKey } from './date';

export const backupFileName = () => `forja-backup-${dateKey()}.json`;

/** Grava o backup num arquivo temporário e abre a folha de compartilhamento (Drive, WhatsApp, Arquivos…). */
export async function saveBackupFile(json: string): Promise<void> {
  const file = new File(Paths.cache, backupFileName());
  file.create({ overwrite: true });
  await file.write(json);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartilhamento indisponível neste aparelho.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Salvar backup do Forja' });
}

/** Abre o seletor de arquivos e devolve o conteúdo do backup, ou null se o usuário cancelar. */
export async function pickBackupFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (res.canceled) return null;
  return new File(res.assets[0].uri).text();
}
