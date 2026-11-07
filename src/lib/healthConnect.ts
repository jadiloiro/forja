import { Platform } from 'react-native';
import type * as HC from 'react-native-health-connect';

import { addDays, dateKey, fromKey } from './date';
import { DayLog, MEALS, MealKey } from './nutritionTypes';
import { SessionRecord } from './trainingTypes';

/**
 * Health Connect: o Galaxy Fit3 sincroniza com o Samsung Health, que grava no Health Connect,
 * de onde o Forja lê. Tudo aqui falha em silêncio fora do Android ou sem o módulo nativo
 * (Expo Go, web, testes): a integração é opcional e o app precisa funcionar sem ela.
 */

type Lib = typeof HC;

let lib: Lib | null | undefined;

/** Carrega o módulo só quando preciso: no Expo Go ele não existe e quebraria o app inteiro na importação. */
function load(): Lib | null {
  if (lib !== undefined) return lib;
  if (Platform.OS !== 'android') return (lib = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- import sob demanda, ver acima
    lib = require('react-native-health-connect') as Lib;
  } catch {
    lib = null;
  }
  return lib;
}

/** Só para testes: troca o módulo nativo (undefined = carregar de novo) e esquece a inicialização. */
export function resetHealthConnectForTests(lib_?: Lib | null) {
  lib = lib_;
  initialized = false;
}

export const PERMISSIONS: HC.Permission[] = [
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'write', recordType: 'ExerciseSession' },
  { accessType: 'write', recordType: 'Nutrition' },
];

export type HcStatus = 'indisponivel' | 'atualizar' | 'disponivel';

let initialized = false;

async function client(): Promise<Lib | null> {
  const m = load();
  if (!m) return null;
  if (!initialized) {
    if ((await m.getSdkStatus()) !== m.SdkAvailabilityStatus.SDK_AVAILABLE) return null;
    initialized = await m.initialize();
  }
  return initialized ? m : null;
}

export async function hcStatus(): Promise<HcStatus> {
  const m = load();
  if (!m) return 'indisponivel';
  try {
    const st = await m.getSdkStatus();
    if (st === m.SdkAvailabilityStatus.SDK_AVAILABLE) return 'disponivel';
    if (st === m.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'atualizar';
  } catch {}
  return 'indisponivel';
}

const key = (p: { accessType: string; recordType: string }) => `${p.accessType}:${p.recordType}`;

/** Quais das permissões do Forja estão concedidas, como "read:Weight". */
export async function hcGranted(): Promise<Set<string>> {
  try {
    const m = await client();
    if (!m) return new Set();
    return new Set((await m.getGrantedPermissions()).map(key));
  } catch {
    return new Set();
  }
}

/** Abre a tela de permissões do Health Connect. Devolve as concedidas. */
export async function hcRequest(): Promise<Set<string>> {
  const m = await client();
  if (!m) throw new Error('O Health Connect não está disponível neste aparelho.');
  return new Set((await m.requestPermission(PERMISSIONS)).map(key));
}

/** Configurações do Health Connect, onde a pessoa revoga as permissões e apaga os dados. */
export function hcOpenSettings(): void {
  try {
    load()?.openHealthConnectSettings();
  } catch {}
}

// ---------------------------------------------------------------------------
// Funções puras: montam e resumem registros. Testadas sem o módulo nativo.

const PREFIX = 'forja';

export const sessionClientId = (id: string) => `${PREFIX}-treino-${id}`;
export const mealClientId = (data: string, refeicao: MealKey) => `${PREFIX}-refeicao-${data}-${refeicao}`;

/** Exercício de força. Constante `ExerciseType.STRENGTH_TRAINING` da biblioteca. */
const STRENGTH_TRAINING = 70;

export function sessionRecord(rec: SessionRecord, nomes: (exerciseId: string) => string | undefined): HC.ExerciseSessionRecord {
  const series = rec.exercicios.reduce((a, e) => a + e.sets.length, 0);
  const lista = rec.exercicios.map((e) => `${nomes(e.exerciseId) ?? 'Exercício'}: ${e.sets.length}×`).join('\n');
  return {
    recordType: 'ExerciseSession',
    exerciseType: STRENGTH_TRAINING,
    startTime: rec.inicio,
    endTime: rec.fim,
    title: rec.nome,
    notes: [`${series} séries · ${rec.volumeKg.toLocaleString('pt-BR')} kg de volume`, lista, rec.nota].filter(Boolean).join('\n\n'),
    metadata: { clientRecordId: sessionClientId(rec.id), clientRecordVersion: 1 },
  };
}

/** O diário não guarda horário; cada refeição vai num horário típico do dia. */
const MEAL_TIME: Record<MealKey, [number, number]> = {
  cafe: [7, 0],
  lanche_manha: [10, 0],
  almoco: [12, 30],
  lanche_tarde: [16, 0],
  jantar: [19, 30],
  ceia: [22, 0],
};

/** Constantes `MealType` da biblioteca: café 1, almoço 2, jantar 3, lanche 4. */
const MEAL_TYPE: Record<MealKey, number> = { cafe: 1, lanche_manha: 4, almoco: 2, lanche_tarde: 4, jantar: 3, ceia: 4 };

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Um registro de nutrição por refeição do dia. `version` precisa crescer a cada envio:
 * o Health Connect só substitui um registro do mesmo `clientRecordId` por um de versão maior.
 * Devolve também as refeições vazias, que precisam ser apagadas de lá.
 */
export function mealRecords(data: string, day: DayLog | undefined, version: number) {
  const records: HC.NutritionRecord[] = [];
  const vazias: string[] = [];
  for (const { key: refeicao, nome } of MEALS) {
    const entries = day?.entries.filter((e) => e.refeicao === refeicao) ?? [];
    if (!entries.length) {
      vazias.push(mealClientId(data, refeicao));
      continue;
    }
    const tot = entries.reduce(
      (a, e) => {
        const f = e.gramas / 100;
        return { kcal: a.kcal + e.snapshot.kcal * f, p: a.p + e.snapshot.p * f, c: a.c + e.snapshot.c * f, g: a.g + e.snapshot.g * f };
      },
      { kcal: 0, p: 0, c: 0, g: 0 },
    );
    const [h, m] = MEAL_TIME[refeicao];
    const start = fromKey(data);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + 15 * 60_000);
    const alimentos = entries.map((e) => e.snapshot.nome).join(', ');
    records.push({
      recordType: 'Nutrition',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      mealType: MEAL_TYPE[refeicao],
      // O Health Connect limita o nome; o Samsung Health mostra só o começo.
      name: `${nome}: ${alimentos}`.slice(0, 100),
      energy: { value: Math.round(tot.kcal), unit: 'kilocalories' },
      protein: { value: r1(tot.p), unit: 'grams' },
      totalCarbohydrate: { value: r1(tot.c), unit: 'grams' },
      totalFat: { value: r1(tot.g), unit: 'grams' },
      metadata: { clientRecordId: mealClientId(data, refeicao), clientRecordVersion: version },
    });
  }
  return { records, vazias };
}

export interface ImportedWeight {
  data: string;
  pesoKg: number;
  /** horário da medição, ISO */
  time: string;
}

/**
 * Último peso de cada dia, só das medições depois de `after`: assim um peso corrigido à mão
 * no Forja não volta a ser trocado pelo do relógio na próxima leitura.
 */
export function weightsByDay(records: { time: string; weight: { inKilograms: number } }[], after?: string): ImportedWeight[] {
  const limite = after ? Date.parse(after) : -Infinity;
  const dias = new Map<string, ImportedWeight & { t: number }>();
  for (const r of records) {
    const t = Date.parse(r.time);
    if (!(t > limite)) continue;
    const kg = r.weight.inKilograms;
    if (!(kg > 20 && kg < 400)) continue;
    const data = dateKey(new Date(t));
    const atual = dias.get(data);
    if (!atual || t > atual.t) dias.set(data, { data, pesoKg: Math.round(kg * 10) / 10, time: new Date(t).toISOString(), t });
  }
  return [...dias.values()].sort((a, b) => a.t - b.t).map(({ t: _t, ...w }) => w);
}

/** Minutos de sono somando as sessões, sem contar duas vezes o trecho em que se sobrepõem. */
export function sleepMinutes(records: Pick<HC.SleepSessionRecord, 'startTime' | 'endTime'>[]): number {
  const iv = records
    .map((r) => [new Date(r.startTime).getTime(), new Date(r.endTime).getTime()] as const)
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);
  let total = 0;
  let fim = -Infinity;
  for (const [a, b] of iv) {
    if (b <= fim) continue;
    total += b - Math.max(a, fim);
    fim = b;
  }
  return Math.round(total / 60_000);
}

export interface HeartRateSummary {
  media: number;
  pico: number;
}

export function heartRateSummary(agg: { BPM_AVG?: number; BPM_MAX?: number } | undefined): HeartRateSummary | undefined {
  if (!agg?.BPM_AVG || !agg.BPM_MAX) return undefined;
  return { media: Math.round(agg.BPM_AVG), pico: Math.round(agg.BPM_MAX) };
}

// ---------------------------------------------------------------------------
// Leitura e escrita. O Health Connect só deixa ler com o app em primeiro plano.

const DIAS_PESO_INICIAL = 30;

export async function readWeights(after?: string): Promise<ImportedWeight[]> {
  const m = await client();
  if (!m) return [];
  const desde = after ?? new Date(fromKey(addDays(dateKey(), -DIAS_PESO_INICIAL))).toISOString();
  const records: { time: string; weight: { inKilograms: number } }[] = [];
  let pageToken: string | undefined;
  do {
    const res = await m.readRecords('Weight', { timeRangeFilter: { operator: 'after', startTime: desde }, pageToken });
    records.push(...res.records);
    pageToken = res.pageToken || undefined;
  } while (pageToken);
  return weightsByDay(records, after);
}

export async function readHeartRate(inicio: string, fim: string): Promise<HeartRateSummary | undefined> {
  const m = await client();
  if (!m) return undefined;
  const agg = await m.aggregateRecord({ recordType: 'HeartRate', timeRangeFilter: { operator: 'between', startTime: inicio, endTime: fim } });
  return heartRateSummary(agg);
}

export interface TodayHealth {
  passos?: number;
  sonoMin?: number;
}

/** Passos de hoje e sono da última noite (sessões que terminaram desde as 18h de ontem). */
export async function readToday(now = new Date()): Promise<TodayHealth> {
  const m = await client();
  if (!m) return {};
  const meiaNoite = fromKey(dateKey(now));
  const ontem18 = new Date(meiaNoite.getTime() - 6 * 3_600_000);
  const [passos, sono] = await Promise.all([
    m
      .aggregateRecord({ recordType: 'Steps', timeRangeFilter: { operator: 'between', startTime: meiaNoite.toISOString(), endTime: now.toISOString() } })
      .then((a) => a.COUNT_TOTAL)
      .catch(() => undefined),
    m
      .readRecords('SleepSession', { timeRangeFilter: { operator: 'between', startTime: ontem18.toISOString(), endTime: now.toISOString() } })
      .then((r) => sleepMinutes(r.records))
      .catch(() => undefined),
  ]);
  return { passos: passos || undefined, sonoMin: sono || undefined };
}

export async function writeSession(rec: SessionRecord, nomes: (exerciseId: string) => string | undefined): Promise<void> {
  const m = await client();
  if (!m) return;
  await m.insertRecords([sessionRecord(rec, nomes)]);
}

export async function deleteSession(id: string): Promise<void> {
  const m = await client();
  if (!m) return;
  await m.deleteRecordsByUuids('ExerciseSession', [], [sessionClientId(id)]);
}

export async function writeDiaryDay(data: string, day: DayLog | undefined, version = Date.now()): Promise<void> {
  const m = await client();
  if (!m) return;
  const { records, vazias } = mealRecords(data, day, version);
  if (records.length) await m.insertRecords(records);
  if (vazias.length) await m.deleteRecordsByUuids('Nutrition', [], vazias);
}
