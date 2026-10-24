import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { EXERCISE_MAP, EXERCISES } from '../data/exercises';
import { Exercise } from '../data/types';
import { dateKey } from '../lib/date';
import { generatePlan } from '../lib/generator';
import { uid } from '../lib/id';
import { computeTargets } from '../lib/nutrition';
import { DayLog, Food, FoodEntry, NutritionTargets } from '../lib/nutritionTypes';
import { lastPerformance, sessionVolume, suggest } from '../lib/progression';
import {
  ActiveSession,
  BodyWeight,
  Plan,
  PlanExercise,
  Profile,
  SessionExercise,
  SessionRecord,
  SetLog,
  Settings,
  WorkoutDay,
} from '../lib/trainingTypes';

export interface State {
  profile?: Profile;
  plans: Plan[];
  activePlanId?: string;
  session?: ActiveSession;
  history: SessionRecord[];
  customExercises: Exercise[];
  bodyWeights: BodyWeight[];
  targets?: NutritionTargets;
  nutrition: Record<string, DayLog>;
  customFoods: Food[];
  recentFoodIds: string[];
  settings: Settings;
}

interface Actions {
  // perfil
  saveProfile: (p: Profile, opts?: { regenerate?: boolean }) => void;
  // planos
  generateNewPlan: () => string | undefined;
  setActivePlan: (id: string) => void;
  createEmptyPlan: (nome: string) => string;
  renamePlan: (id: string, nome: string) => void;
  deletePlan: (id: string) => void;
  duplicatePlan: (id: string) => void;
  setNextDay: (planId: string, index: number) => void;
  addDay: (planId: string) => string;
  updateDay: (planId: string, dayId: string, patch: Partial<Pick<WorkoutDay, 'nome' | 'foco'>>) => void;
  removeDay: (planId: string, dayId: string) => void;
  moveDay: (planId: string, dayId: string, dir: -1 | 1) => void;
  duplicateDay: (planId: string, dayId: string) => void;
  addPlanExercise: (planId: string, dayId: string, exerciseId: string) => void;
  updatePlanExercise: (planId: string, dayId: string, exUid: string, patch: Partial<PlanExercise>) => void;
  removePlanExercise: (planId: string, dayId: string, exUid: string) => void;
  movePlanExercise: (planId: string, dayId: string, exUid: string, dir: -1 | 1) => void;
  replacePlanExercise: (planId: string, dayId: string, exUid: string, exerciseId: string) => void;
  // sessão
  startSession: (planId?: string, dayId?: string) => void;
  updateSet: (exUid: string, idx: number, patch: Partial<SetLog>) => void;
  completeSet: (exUid: string, idx: number) => void;
  addSet: (exUid: string) => void;
  removeSet: (exUid: string, idx: number) => void;
  addSessionExercise: (exerciseId: string) => void;
  removeSessionExercise: (exUid: string) => void;
  moveSessionExercise: (exUid: string, dir: -1 | 1) => void;
  replaceSessionExercise: (exUid: string, exerciseId: string) => void;
  updateSessionExercise: (exUid: string, patch: Partial<Pick<SessionExercise, 'notas' | 'descansoSeg'>>) => void;
  startRest: (seconds: number) => void;
  adjustRest: (delta: number) => void;
  clearRest: () => void;
  finishSession: (nota?: string) => string | undefined;
  discardSession: () => void;
  deleteRecord: (id: string) => void;
  // exercícios
  saveCustomExercise: (e: Exercise) => void;
  deleteCustomExercise: (id: string) => void;
  // corpo
  logBodyWeight: (data: string, pesoKg: number) => void;
  removeBodyWeight: (data: string) => void;
  // nutrição
  setTargets: (t: Omit<NutritionTargets, 'manual'>) => void;
  resetTargetsAuto: () => void;
  addFood: (data: string, entry: Omit<FoodEntry, 'id'>) => void;
  updateFoodEntry: (data: string, id: string, gramas: number) => void;
  removeFoodEntry: (data: string, id: string) => void;
  copyMeal: (from: string, to: string, refeicao: FoodEntry['refeicao']) => void;
  addWater: (data: string, ml: number) => void;
  saveCustomFood: (f: Food) => void;
  deleteCustomFood: (id: string) => void;
  // configurações
  updateSettings: (patch: Partial<Settings>) => void;
  importBackup: (json: string) => void;
  resetAll: () => void;
}

export type Store = State & Actions;

const initial: State = {
  plans: [],
  history: [],
  customExercises: [],
  bodyWeights: [],
  nutrition: {},
  customFoods: [],
  recentFoodIds: [],
  settings: { incrementoBarraKg: 2.5, incrementoHalterKg: 2, vibrarDescanso: true },
};

function mapPlan(plans: Plan[], planId: string, fn: (p: Plan) => Plan): Plan[] {
  return plans.map((p) => (p.id === planId ? fn(p) : p));
}

function mapDay(plans: Plan[], planId: string, dayId: string, fn: (d: WorkoutDay) => WorkoutDay): Plan[] {
  return mapPlan(plans, planId, (p) => ({ ...p, dias: p.dias.map((d) => (d.id === dayId ? fn(d) : d)) }));
}

function move<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir;
  if (index < 0 || j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[index], out[j]] = [out[j], out[index]];
  return out;
}

function findEx(id: string, customs: Exercise[]): Exercise | undefined {
  return EXERCISE_MAP[id] ?? customs.find((e) => e.id === id);
}

function buildSessionExercise(
  state: State,
  exerciseId: string,
  series: number,
  repMin: number,
  repMax: number,
  descansoSeg: number,
  notas?: string,
): SessionExercise {
  const last = lastPerformance(state.history, exerciseId);
  const sug = suggest(last, repMin, repMax, exerciseId, state.settings);
  const sets: SetLog[] = Array.from({ length: Math.max(1, series) }, (_, i) => {
    const prev = last?.sets[i] ?? last?.sets[last.sets.length - 1];
    return {
      peso: sug?.peso ?? prev?.peso ?? null,
      reps: null,
      feito: false,
      tipo: 'normal',
    };
  });
  return { uid: uid(), exerciseId, repMin, repMax, descansoSeg, notas, sets };
}

function mapSessionEx(s: ActiveSession, exUid: string, fn: (e: SessionExercise) => SessionExercise): ActiveSession {
  return { ...s, exercicios: s.exercicios.map((e) => (e.uid === exUid ? fn(e) : e)) };
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial,

      saveProfile: (p, opts) => {
        const st = get();
        const targets = !st.targets || !st.targets.manual ? computeTargets(p) : st.targets;
        set({
          profile: p,
          targets: { kcal: targets.kcal, p: targets.p, c: targets.c, g: targets.g, aguaMl: targets.aguaMl, manual: targets.manual },
        });
        const today = dateKey();
        if (!st.bodyWeights.some((b) => b.data === today) || st.profile?.pesoKg !== p.pesoKg) {
          get().logBodyWeight(today, p.pesoKg);
        }
        if (opts?.regenerate || !st.plans.length) get().generateNewPlan();
      },

      generateNewPlan: () => {
        const p = get().profile;
        if (!p) return undefined;
        const plan = generatePlan(p);
        set((s) => ({ plans: [plan, ...s.plans], activePlanId: plan.id }));
        return plan.id;
      },
      setActivePlan: (id) => set({ activePlanId: id }),
      createEmptyPlan: (nome) => {
        const plan: Plan = {
          id: uid(),
          nome: nome || 'Meu plano',
          descricao: 'Plano montado manualmente.',
          criadoEm: new Date().toISOString(),
          dias: [{ id: uid(), nome: 'A · Treino A', foco: '', exercicios: [] }],
          proximo: 0,
        };
        set((s) => ({ plans: [plan, ...s.plans], activePlanId: plan.id }));
        return plan.id;
      },
      renamePlan: (id, nome) => set((s) => ({ plans: mapPlan(s.plans, id, (p) => ({ ...p, nome })) })),
      deletePlan: (id) =>
        set((s) => {
          const plans = s.plans.filter((p) => p.id !== id);
          return { plans, activePlanId: s.activePlanId === id ? plans[0]?.id : s.activePlanId };
        }),
      duplicatePlan: (id) =>
        set((s) => {
          const src = s.plans.find((p) => p.id === id);
          if (!src) return {};
          const copy: Plan = {
            ...src,
            id: uid(),
            nome: `${src.nome} (cópia)`,
            criadoEm: new Date().toISOString(),
            dias: src.dias.map((d) => ({ ...d, id: uid(), exercicios: d.exercicios.map((e) => ({ ...e, uid: uid() })) })),
          };
          return { plans: [copy, ...s.plans] };
        }),
      setNextDay: (planId, index) => set((s) => ({ plans: mapPlan(s.plans, planId, (p) => ({ ...p, proximo: index })) })),
      addDay: (planId) => {
        const id = uid();
        set((s) => ({
          plans: mapPlan(s.plans, planId, (p) => ({
            ...p,
            dias: [...p.dias, { id, nome: `${String.fromCharCode(65 + p.dias.length)} · Novo treino`, foco: '', exercicios: [] }],
          })),
        }));
        return id;
      },
      updateDay: (planId, dayId, patch) => set((s) => ({ plans: mapDay(s.plans, planId, dayId, (d) => ({ ...d, ...patch })) })),
      removeDay: (planId, dayId) =>
        set((s) => ({
          plans: mapPlan(s.plans, planId, (p) => {
            const dias = p.dias.filter((d) => d.id !== dayId);
            return { ...p, dias, proximo: Math.min(p.proximo, Math.max(0, dias.length - 1)) };
          }),
        })),
      moveDay: (planId, dayId, dir) =>
        set((s) => ({
          plans: mapPlan(s.plans, planId, (p) => ({ ...p, dias: move(p.dias, p.dias.findIndex((d) => d.id === dayId), dir) })),
        })),
      duplicateDay: (planId, dayId) =>
        set((s) => ({
          plans: mapPlan(s.plans, planId, (p) => {
            const i = p.dias.findIndex((d) => d.id === dayId);
            if (i < 0) return p;
            const d = p.dias[i];
            const copy = { ...d, id: uid(), nome: `${d.nome} (cópia)`, exercicios: d.exercicios.map((e) => ({ ...e, uid: uid() })) };
            const dias = [...p.dias];
            dias.splice(i + 1, 0, copy);
            return { ...p, dias };
          }),
        })),
      addPlanExercise: (planId, dayId, exerciseId) =>
        set((s) => {
          const ex = findEx(exerciseId, s.customExercises);
          const composto = ex?.tipo === 'composto';
          const item: PlanExercise = {
            uid: uid(),
            exerciseId,
            series: 3,
            repMin: ex?.porTempo ? 30 : composto ? 8 : 10,
            repMax: ex?.porTempo ? 60 : composto ? 12 : 15,
            descansoSeg: composto ? 120 : 75,
          };
          return { plans: mapDay(s.plans, planId, dayId, (d) => ({ ...d, exercicios: [...d.exercicios, item] })) };
        }),
      updatePlanExercise: (planId, dayId, exUid, patch) =>
        set((s) => ({
          plans: mapDay(s.plans, planId, dayId, (d) => ({
            ...d,
            exercicios: d.exercicios.map((e) => (e.uid === exUid ? { ...e, ...patch } : e)),
          })),
        })),
      removePlanExercise: (planId, dayId, exUid) =>
        set((s) => ({
          plans: mapDay(s.plans, planId, dayId, (d) => ({ ...d, exercicios: d.exercicios.filter((e) => e.uid !== exUid) })),
        })),
      movePlanExercise: (planId, dayId, exUid, dir) =>
        set((s) => ({
          plans: mapDay(s.plans, planId, dayId, (d) => ({
            ...d,
            exercicios: move(d.exercicios, d.exercicios.findIndex((e) => e.uid === exUid), dir),
          })),
        })),
      replacePlanExercise: (planId, dayId, exUid, exerciseId) =>
        set((s) => ({
          plans: mapDay(s.plans, planId, dayId, (d) => ({
            ...d,
            exercicios: d.exercicios.map((e) => (e.uid === exUid ? { ...e, exerciseId } : e)),
          })),
        })),

      startSession: (planId, dayId) => {
        const st = get();
        const plan = st.plans.find((p) => p.id === planId);
        const day = plan?.dias.find((d) => d.id === dayId);
        const session: ActiveSession = {
          id: uid(),
          planId: plan?.id,
          dayId: day?.id,
          nome: day?.nome ?? 'Treino livre',
          inicio: new Date().toISOString(),
          exercicios: (day?.exercicios ?? []).map((e) =>
            buildSessionExercise(st, e.exerciseId, e.series, e.repMin, e.repMax, e.descansoSeg, e.notas),
          ),
        };
        set({ session });
      },
      updateSet: (exUid, idx, patch) =>
        set((s) =>
          s.session
            ? { session: mapSessionEx(s.session, exUid, (e) => ({ ...e, sets: e.sets.map((x, i) => (i === idx ? { ...x, ...patch } : x)) })) }
            : {},
        ),
      completeSet: (exUid, idx) => {
        const s = get().session;
        if (!s) return;
        const ex = s.exercicios.find((e) => e.uid === exUid);
        const target = ex?.sets[idx];
        if (!ex || !target) return;
        const feito = !target.feito;
        const sets = ex.sets.map((x, i) => {
          if (i !== idx) return x;
          // Se marcou sem digitar reps, assume o mínimo da faixa.
          return { ...x, feito, reps: feito && x.reps == null ? ex.repMin : x.reps };
        });
        // Propaga a carga para as próximas séries vazias.
        if (feito && target.peso != null) {
          for (let i = idx + 1; i < sets.length; i++) if (!sets[i].feito && sets[i].peso == null) sets[i] = { ...sets[i], peso: target.peso };
        }
        set({ session: mapSessionEx(s, exUid, (e) => ({ ...e, sets })) });
        if (feito) get().startRest(ex.descansoSeg);
      },
      addSet: (exUid) =>
        set((s) =>
          s.session
            ? {
                session: mapSessionEx(s.session, exUid, (e) => {
                  const last = e.sets[e.sets.length - 1];
                  return { ...e, sets: [...e.sets, { peso: last?.peso ?? null, reps: null, feito: false, tipo: 'normal' }] };
                }),
              }
            : {},
        ),
      removeSet: (exUid, idx) =>
        set((s) =>
          s.session ? { session: mapSessionEx(s.session, exUid, (e) => ({ ...e, sets: e.sets.filter((_, i) => i !== idx) })) } : {},
        ),
      addSessionExercise: (exerciseId) =>
        set((s) => {
          if (!s.session) return {};
          const ex = findEx(exerciseId, s.customExercises);
          const composto = ex?.tipo === 'composto';
          const item = buildSessionExercise(
            s,
            exerciseId,
            3,
            ex?.porTempo ? 30 : composto ? 8 : 10,
            ex?.porTempo ? 60 : composto ? 12 : 15,
            composto ? 120 : 75,
          );
          return { session: { ...s.session, exercicios: [...s.session.exercicios, item] } };
        }),
      removeSessionExercise: (exUid) =>
        set((s) => (s.session ? { session: { ...s.session, exercicios: s.session.exercicios.filter((e) => e.uid !== exUid) } } : {})),
      moveSessionExercise: (exUid, dir) =>
        set((s) =>
          s.session
            ? {
                session: {
                  ...s.session,
                  exercicios: move(s.session.exercicios, s.session.exercicios.findIndex((e) => e.uid === exUid), dir),
                },
              }
            : {},
        ),
      replaceSessionExercise: (exUid, exerciseId) =>
        set((s) => {
          if (!s.session) return {};
          return {
            session: mapSessionEx(s.session, exUid, (e) => {
              const fresh = buildSessionExercise(s, exerciseId, e.sets.length, e.repMin, e.repMax, e.descansoSeg, e.notas);
              return { ...fresh, uid: e.uid };
            }),
          };
        }),
      updateSessionExercise: (exUid, patch) =>
        set((s) => (s.session ? { session: mapSessionEx(s.session, exUid, (e) => ({ ...e, ...patch })) } : {})),
      startRest: (seconds) =>
        set((s) => (s.session ? { session: { ...s.session, descansoAte: Date.now() + seconds * 1000, descansoTotal: seconds } } : {})),
      adjustRest: (delta) =>
        set((s) =>
          s.session?.descansoAte
            ? {
                session: {
                  ...s.session,
                  descansoAte: Math.max(Date.now(), s.session.descansoAte + delta * 1000),
                  descansoTotal: Math.max(0, (s.session.descansoTotal ?? 0) + delta),
                },
              }
            : {},
        ),
      clearRest: () => set((s) => (s.session ? { session: { ...s.session, descansoAte: undefined, descansoTotal: undefined } } : {})),
      finishSession: (nota) => {
        const s = get().session;
        if (!s) return undefined;
        const exercicios = s.exercicios
          .map((e) => ({ ...e, sets: e.sets.filter((x) => x.feito) }))
          .filter((e) => e.sets.length);
        const record: SessionRecord = {
          ...s,
          descansoAte: undefined,
          descansoTotal: undefined,
          exercicios,
          fim: new Date().toISOString(),
          volumeKg: sessionVolume(exercicios),
          nota: nota?.trim() || undefined,
        };
        set((st) => {
          let plans = st.plans;
          if (s.planId && s.dayId) {
            plans = mapPlan(plans, s.planId, (p) => {
              const i = p.dias.findIndex((d) => d.id === s.dayId);
              return i >= 0 ? { ...p, proximo: (i + 1) % p.dias.length } : p;
            });
          }
          return { session: undefined, history: [record, ...st.history], plans };
        });
        return record.id;
      },
      discardSession: () => set({ session: undefined }),
      deleteRecord: (id) => set((s) => ({ history: s.history.filter((h) => h.id !== id) })),

      saveCustomExercise: (e) =>
        set((s) => {
          const exists = s.customExercises.some((x) => x.id === e.id);
          return {
            customExercises: exists ? s.customExercises.map((x) => (x.id === e.id ? e : x)) : [...s.customExercises, { ...e, custom: true }],
          };
        }),
      deleteCustomExercise: (id) => set((s) => ({ customExercises: s.customExercises.filter((e) => e.id !== id) })),

      logBodyWeight: (data, pesoKg) =>
        set((s) => {
          const list = [...s.bodyWeights.filter((b) => b.data !== data), { data, pesoKg }].sort((a, b) => a.data.localeCompare(b.data));
          const latest = list[list.length - 1];
          const profile = s.profile && latest?.data === data ? { ...s.profile, pesoKg } : s.profile;
          let targets = s.targets;
          if (profile && targets && !targets.manual) {
            const t = computeTargets(profile);
            targets = { kcal: t.kcal, p: t.p, c: t.c, g: t.g, aguaMl: t.aguaMl, manual: false };
          }
          return { bodyWeights: list, profile, targets };
        }),
      removeBodyWeight: (data) => set((s) => ({ bodyWeights: s.bodyWeights.filter((b) => b.data !== data) })),

      setTargets: (t) => set({ targets: { ...t, manual: true } }),
      resetTargetsAuto: () => {
        const p = get().profile;
        if (!p) return;
        const t = computeTargets(p);
        set({ targets: { kcal: t.kcal, p: t.p, c: t.c, g: t.g, aguaMl: t.aguaMl, manual: false } });
      },
      addFood: (data, entry) =>
        set((s) => {
          const day = s.nutrition[data] ?? { entries: [], aguaMl: 0 };
          return {
            nutrition: { ...s.nutrition, [data]: { ...day, entries: [...day.entries, { ...entry, id: uid() }] } },
            recentFoodIds: [entry.foodId, ...s.recentFoodIds.filter((x) => x !== entry.foodId)].slice(0, 30),
          };
        }),
      updateFoodEntry: (data, id, gramas) =>
        set((s) => {
          const day = s.nutrition[data];
          if (!day) return {};
          return { nutrition: { ...s.nutrition, [data]: { ...day, entries: day.entries.map((e) => (e.id === id ? { ...e, gramas } : e)) } } };
        }),
      removeFoodEntry: (data, id) =>
        set((s) => {
          const day = s.nutrition[data];
          if (!day) return {};
          return { nutrition: { ...s.nutrition, [data]: { ...day, entries: day.entries.filter((e) => e.id !== id) } } };
        }),
      copyMeal: (from, to, refeicao) =>
        set((s) => {
          const src = s.nutrition[from]?.entries.filter((e) => e.refeicao === refeicao) ?? [];
          if (!src.length) return {};
          const day = s.nutrition[to] ?? { entries: [], aguaMl: 0 };
          return {
            nutrition: { ...s.nutrition, [to]: { ...day, entries: [...day.entries, ...src.map((e) => ({ ...e, id: uid() }))] } },
          };
        }),
      addWater: (data, ml) =>
        set((s) => {
          const day = s.nutrition[data] ?? { entries: [], aguaMl: 0 };
          return { nutrition: { ...s.nutrition, [data]: { ...day, aguaMl: Math.max(0, day.aguaMl + ml) } } };
        }),
      saveCustomFood: (f) =>
        set((s) => {
          const exists = s.customFoods.some((x) => x.id === f.id);
          return { customFoods: exists ? s.customFoods.map((x) => (x.id === f.id ? f : x)) : [{ ...f, custom: true }, ...s.customFoods] };
        }),
      deleteCustomFood: (id) => set((s) => ({ customFoods: s.customFoods.filter((f) => f.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      importBackup: (json) => {
        const data = JSON.parse(json) as Partial<State> & { app?: string };
        if (data.app !== 'forja' || !Array.isArray(data.plans)) throw new Error('Arquivo de backup inválido.');
        const { app: _app, ...rest } = data;
        set({ ...initial, ...rest, session: undefined });
      },
      resetAll: () => set({ ...initial, profile: undefined, targets: undefined, activePlanId: undefined, session: undefined }),
    }),
    {
      name: 'forja-store',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function exportBackup(): string {
  const { profile, plans, activePlanId, history, customExercises, bodyWeights, targets, nutrition, customFoods, recentFoodIds, settings } =
    useStore.getState();
  return JSON.stringify({
    app: 'forja',
    exportadoEm: new Date().toISOString(),
    profile,
    plans,
    activePlanId,
    history,
    customExercises,
    bodyWeights,
    targets,
    nutrition,
    customFoods,
    recentFoodIds,
    settings,
  });
}

/** Lista completa de exercícios (padrão + personalizados) */
export function useAllExercises(): Exercise[] {
  const customs = useStore((s) => s.customExercises);
  return customs.length ? [...EXERCISES, ...customs] : EXERCISES;
}

export function getExercise(id: string): Exercise | undefined {
  return findEx(id, useStore.getState().customExercises);
}

export function useExercise(id: string | undefined): Exercise | undefined {
  const customs = useStore((s) => s.customExercises);
  return id ? findEx(id, customs) : undefined;
}

export function useActivePlan(): Plan | undefined {
  return useStore((s) => s.plans.find((p) => p.id === s.activePlanId) ?? s.plans[0]);
}

/** Espera o AsyncStorage carregar antes de decidir rotas. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
  );
}
