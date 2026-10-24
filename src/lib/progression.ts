import { EXERCISE_MAP } from '../data/exercises';
import { SessionExercise, SessionRecord, SetLog, Settings } from './trainingTypes';

export interface LastPerformance {
  data: string;
  sets: SetLog[];
}

/** Última vez que o exercício foi feito (histórico ordenado do mais recente para o mais antigo). */
export function lastPerformance(history: SessionRecord[], exerciseId: string): LastPerformance | undefined {
  for (const s of history) {
    const ex = s.exercicios.find((e) => e.exerciseId === exerciseId && e.sets.some((x) => x.feito));
    if (ex) return { data: s.fim, sets: ex.sets.filter((x) => x.feito && x.tipo !== 'aquecimento') };
  }
  return undefined;
}

export function workingSets(ex: SessionExercise): SetLog[] {
  return ex.sets.filter((s) => s.feito && s.tipo !== 'aquecimento');
}

/** 1RM estimado (Epley) */
export function e1rm(peso: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return peso;
  return peso * (1 + reps / 30);
}

export function round(n: number, step = 0.5): number {
  return Math.round(n / step) * step;
}

export interface Suggestion {
  peso: number | null;
  texto: string;
  subir: boolean;
}

/**
 * Dupla progressão: se em todas as séries válidas da última vez você bateu o topo da faixa de repetições,
 * sobe a carga; senão mantém a carga e tenta mais repetições.
 */
export function suggest(
  last: LastPerformance | undefined,
  repMin: number,
  repMax: number,
  exerciseId: string,
  settings: Settings,
): Suggestion | undefined {
  if (!last || !last.sets.length) return undefined;
  const comPeso = last.sets.filter((s) => s.peso != null && s.reps != null);
  if (!comPeso.length) return undefined;
  const pesoTop = Math.max(...comPeso.map((s) => s.peso ?? 0));
  const topSets = comPeso.filter((s) => s.peso === pesoTop);
  const todasNoTopo = topSets.every((s) => (s.reps ?? 0) >= repMax);
  const abaixo = topSets.filter((s) => (s.reps ?? 0) < repMin).length > topSets.length / 2;
  const ex = EXERCISE_MAP[exerciseId];
  const inc = ex?.equipamento === 'halteres' ? settings.incrementoHalterKg : settings.incrementoBarraKg;
  if (pesoTop <= 0) {
    return todasNoTopo
      ? { peso: null, texto: `Bateu ${repMax} reps em todas: tente adicionar carga.`, subir: true }
      : { peso: null, texto: `Tente mais repetições que da última vez.`, subir: false };
  }
  if (todasNoTopo) return { peso: pesoTop + inc, texto: `Bateu o topo da faixa: suba para ${fmtKg(pesoTop + inc)}.`, subir: true };
  if (abaixo) return { peso: pesoTop, texto: `Ficou abaixo de ${repMin} reps: mantenha ${fmtKg(pesoTop)} (ou reduza um pouco).`, subir: false };
  return { peso: pesoTop, texto: `Mantenha ${fmtKg(pesoTop)} e busque mais repetições.`, subir: false };
}

export function fmtKg(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${Number.isInteger(n) ? n : n.toFixed(1).replace('.', ',')} kg`;
}

export function sessionVolume(ex: SessionExercise[]): number {
  let v = 0;
  for (const e of ex) for (const s of workingSets(e)) v += (s.peso ?? 0) * (s.reps ?? 0);
  return Math.round(v);
}

export interface PR {
  exerciseId: string;
  pesoMax: number;
  repsNoMax: number;
  e1rm: number;
  data: string;
}

export function personalRecords(history: SessionRecord[]): Record<string, PR> {
  const out: Record<string, PR> = {};
  for (const s of history) {
    for (const e of s.exercicios) {
      for (const set of workingSets(e)) {
        if (set.peso == null || set.reps == null || set.reps <= 0) continue;
        const est = e1rm(set.peso, set.reps);
        const cur = out[e.exerciseId];
        if (!cur || est > cur.e1rm) {
          out[e.exerciseId] = {
            exerciseId: e.exerciseId,
            pesoMax: Math.max(set.peso, cur?.pesoMax ?? 0),
            repsNoMax: set.reps,
            e1rm: est,
            data: s.fim,
          };
        } else if (set.peso > cur.pesoMax) {
          cur.pesoMax = set.peso;
        }
      }
    }
  }
  return out;
}

/** Série histórica do melhor 1RM estimado por sessão, do mais antigo para o mais recente. */
export function e1rmSeries(history: SessionRecord[], exerciseId: string): { data: string; valor: number }[] {
  const pts: { data: string; valor: number }[] = [];
  for (const s of history) {
    const e = s.exercicios.find((x) => x.exerciseId === exerciseId);
    if (!e) continue;
    let best = 0;
    for (const set of workingSets(e)) if (set.peso != null && set.reps) best = Math.max(best, e1rm(set.peso, set.reps));
    if (best > 0) pts.push({ data: s.fim, valor: round(best, 0.5) });
  }
  return pts.reverse();
}
