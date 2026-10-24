import { GROUP_LABEL, MuscleGroup } from '../data/types';
import { getExercise } from '../store/useStore';
import { PlanExercise, WorkoutDay } from './trainingTypes';

export function estimateMinutes(exs: PlanExercise[]): number {
  let sec = 0;
  for (const e of exs) sec += e.series * 40 + Math.max(0, e.series - 1) * e.descansoSeg + 60;
  return Math.round(sec / 60);
}

export function totalSets(exs: PlanExercise[]): number {
  return exs.reduce((a, e) => a + e.series, 0);
}

export function muscleSummary(day: WorkoutDay): string {
  const groups: MuscleGroup[] = [];
  for (const e of day.exercicios) {
    const ex = getExercise(e.exerciseId);
    if (ex && !groups.includes(ex.grupo)) groups.push(ex.grupo);
  }
  return groups.map((g) => GROUP_LABEL[g]).join(' · ');
}

export function repRange(min: number, max: number, porTempo?: boolean): string {
  const u = porTempo ? 's' : '';
  return min === max ? `${min}${u}` : `${min}–${max}${u}`;
}

export function fmtRest(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}min${s}s` : `${m}min`;
}
