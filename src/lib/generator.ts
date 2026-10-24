import { EXERCISE_MAP } from '../data/exercises';
import { Exercise, MuscleGroup } from '../data/types';
import { uid } from './id';
import { Nivel, Objetivo, Plan, PlanExercise, Profile, WorkoutDay } from './trainingTypes';

/** Pools ordenados por preferência. O gerador pega o primeiro permitido para o nível e ainda não usado no plano. */
const POOLS = {
  peito: ['supino_reto_barra', 'supino_reto_halter', 'supino_maquina', 'paralelas_peito', 'flexao'],
  peitoInc: ['supino_inclinado_halter', 'supino_inclinado_barra', 'supino_inclinado_smith'],
  peitoIso: ['crossover', 'crucifixo_halter', 'peck_deck', 'crucifixo_inclinado'],
  costasV: ['puxada_frente', 'barra_fixa', 'puxada_triangulo', 'puxada_supinada', 'barra_fixa_supinada'],
  costasH: ['remada_curvada', 'remada_baixa', 'remada_unilateral', 'remada_cavalinho', 'remada_maquina'],
  costasIso: ['pulldown_braco_reto', 'pullover'],
  terra: ['levantamento_terra', 'terra_sumo'],
  ombroPress: ['desenvolvimento_halter', 'desenvolvimento_barra', 'desenvolvimento_maquina', 'arnold'],
  lateral: ['elevacao_lateral', 'elevacao_lateral_cabo'],
  posteriorOmbro: ['face_pull', 'crucifixo_inverso', 'crucifixo_inverso_maquina'],
  trap: ['encolhimento_halter', 'encolhimento_barra'],
  biceps: ['rosca_direta', 'rosca_alternada', 'rosca_martelo', 'rosca_scott', 'rosca_inclinada', 'rosca_w', 'rosca_cabo', 'rosca_concentrada'],
  triceps: ['triceps_corda', 'triceps_testa', 'triceps_pulley', 'triceps_overhead_corda', 'triceps_frances', 'paralelas_triceps', 'triceps_coice'],
  quad: ['agachamento_livre', 'leg_press', 'hack', 'agachamento_smith', 'agachamento_frontal'],
  quadUni: ['agachamento_dividido', 'afundo', 'passada', 'step_up'],
  quadIso: ['cadeira_extensora'],
  post: ['terra_romeno', 'stiff', 'stiff_halter', 'bom_dia'],
  postIso: ['mesa_flexora', 'cadeira_flexora', 'flexora_em_pe'],
  gluteo: ['hip_thrust', 'ponte_gluteo', 'gluteo_cabo', 'abdutora'],
  panturrilha: ['panturrilha_em_pe', 'panturrilha_sentado', 'panturrilha_leg'],
  abdomen: ['abdominal_cabo', 'elevacao_pernas', 'prancha', 'abdominal_infra', 'abdominal_maquina', 'pallof'],
  antebraco: ['rosca_inversa', 'rosca_punho'],
} as const;

type PoolKey = keyof typeof POOLS;

interface Slot {
  pool: PoolKey;
  /** 1 = essencial … 4 = só entra em treinos longos */
  pri: 1 | 2 | 3 | 4;
  /** só para objetivo força e nível não iniciante */
  forca?: boolean;
}

interface DayTemplate {
  nome: string;
  foco: string;
  slots: Slot[];
}

const s = (pool: PoolKey, pri: Slot['pri'], forca?: boolean): Slot => ({ pool, pri, forca });

const T = {
  fullA: { nome: 'Full body A', foco: 'Corpo inteiro', slots: [s('quad', 1), s('peito', 1), s('costasH', 1), s('ombroPress', 2), s('post', 2), s('biceps', 3), s('triceps', 3), s('abdomen', 4)] },
  fullB: { nome: 'Full body B', foco: 'Corpo inteiro', slots: [s('terra', 1, true), s('quad', 1), s('costasV', 1), s('peitoInc', 1), s('postIso', 2), s('lateral', 2), s('triceps', 3), s('biceps', 3), s('panturrilha', 4)] },
  fullC: { nome: 'Full body C', foco: 'Corpo inteiro', slots: [s('quadUni', 1), s('peito', 1), s('costasV', 1), s('gluteo', 2), s('posteriorOmbro', 2), s('biceps', 3), s('triceps', 3), s('abdomen', 4)] },
  push: { nome: 'Push', foco: 'Peito, ombros e tríceps', slots: [s('peito', 1), s('ombroPress', 1), s('peitoInc', 2), s('lateral', 2), s('triceps', 2), s('peitoIso', 3), s('triceps', 3), s('lateral', 4)] },
  pull: { nome: 'Pull', foco: 'Costas, bíceps e posterior de ombro', slots: [s('terra', 1, true), s('costasV', 1), s('costasH', 1), s('posteriorOmbro', 2), s('biceps', 2), s('costasH', 3), s('biceps', 3), s('trap', 4), s('costasIso', 4)] },
  legs: { nome: 'Legs', foco: 'Pernas e abdômen', slots: [s('quad', 1), s('post', 1), s('quad', 2), s('postIso', 2), s('quadIso', 3), s('panturrilha', 3), s('quadUni', 4), s('abdomen', 4)] },
  upperA: { nome: 'Superior A', foco: 'Peito, costas, ombros e braços', slots: [s('peito', 1), s('costasH', 1), s('ombroPress', 2), s('costasV', 2), s('lateral', 3), s('biceps', 3), s('triceps', 3), s('posteriorOmbro', 4)] },
  upperB: { nome: 'Superior B', foco: 'Costas, peito, ombros e braços', slots: [s('costasV', 1), s('peitoInc', 1), s('costasH', 2), s('lateral', 2), s('peitoIso', 3), s('triceps', 3), s('biceps', 3), s('abdomen', 4)] },
  lowerA: { nome: 'Inferior A', foco: 'Quadríceps, posterior e panturrilha', slots: [s('quad', 1), s('post', 1), s('quadUni', 2), s('postIso', 2), s('quadIso', 3), s('panturrilha', 3), s('abdomen', 4), s('gluteo', 4)] },
  lowerB: { nome: 'Inferior B', foco: 'Posterior, glúteos e quadríceps', slots: [s('terra', 1, true), s('quad', 1), s('gluteo', 1), s('postIso', 2), s('quadIso', 2), s('quadUni', 3), s('panturrilha', 3), s('abdomen', 4)] },
  peitoDia: { nome: 'Peito', foco: 'Peito e abdômen', slots: [s('peito', 1), s('peitoInc', 1), s('peitoIso', 2), s('peito', 3), s('peitoIso', 3), s('abdomen', 4)] },
  costasDia: { nome: 'Costas', foco: 'Costas e trapézio', slots: [s('terra', 1, true), s('costasV', 1), s('costasH', 1), s('costasH', 2), s('costasV', 3), s('costasIso', 3), s('trap', 4)] },
  pernasDia: { nome: 'Pernas', foco: 'Pernas completas', slots: [s('quad', 1), s('post', 1), s('quad', 2), s('postIso', 2), s('quadIso', 3), s('gluteo', 3), s('panturrilha', 3), s('quadUni', 4)] },
  ombrosDia: { nome: 'Ombros', foco: 'Ombros e abdômen', slots: [s('ombroPress', 1), s('lateral', 1), s('posteriorOmbro', 2), s('ombroPress', 3), s('lateral', 3), s('trap', 3), s('abdomen', 4)] },
  bracosDia: { nome: 'Braços', foco: 'Bíceps, tríceps e antebraço', slots: [s('biceps', 1), s('triceps', 1), s('biceps', 2), s('triceps', 2), s('biceps', 3), s('triceps', 3), s('antebraco', 4)] },
} satisfies Record<string, DayTemplate>;

function chooseSplit(dias: number, nivel: Nivel): { nome: string; descricao: string; dias: DayTemplate[] } {
  switch (dias) {
    case 2:
      return { nome: 'Full body 2x', descricao: 'Dois treinos de corpo inteiro alternados.', dias: [T.fullA, T.fullB] };
    case 3:
      return nivel === 'iniciante'
        ? { nome: 'Full body 3x', descricao: 'Três treinos de corpo inteiro: ideal para aprender os movimentos e treinar cada músculo 3x por semana.', dias: [T.fullA, T.fullB, T.fullC] }
        : { nome: 'Push / Pull / Legs', descricao: 'Empurrar, puxar e pernas: cada grupo uma vez por semana com bom volume.', dias: [T.push, T.pull, T.legs] };
    case 4:
      return { nome: 'Superior / Inferior', descricao: 'Cada músculo treinado 2x por semana, com boa recuperação.', dias: [T.upperA, T.lowerA, T.upperB, T.lowerB] };
    case 5:
      return nivel === 'avancado'
        ? { nome: 'ABCDE', descricao: 'Um grupo muscular por dia com alto volume por sessão.', dias: [T.peitoDia, T.costasDia, T.pernasDia, T.ombrosDia, T.bracosDia] }
        : { nome: 'Superior / Inferior + PPL', descricao: 'Híbrido: frequência 2x para a maioria dos músculos em 5 dias.', dias: [T.upperA, T.lowerA, T.push, T.pull, T.legs] };
    default:
      return {
        nome: 'Push / Pull / Legs 2x',
        descricao: 'PPL duas vezes por semana: alta frequência e volume.',
        dias: [T.push, T.pull, T.legs, { ...T.push, nome: 'Push B' }, { ...T.pull, nome: 'Pull B' }, { ...T.legs, nome: 'Legs B' }],
      };
  }
}

const MAX_NIVEL: Record<Nivel, number> = { iniciante: 2, intermediario: 3, avancado: 3 };

function exercisesForDuration(min: number): number {
  if (min <= 40) return 4;
  if (min <= 50) return 5;
  if (min <= 65) return 6;
  if (min <= 80) return 7;
  return 8;
}

interface Prescription {
  series: number;
  repMin: number;
  repMax: number;
  descansoSeg: number;
}

export function prescribe(ex: Exercise, objetivo: Objetivo, nivel: Nivel, principal: boolean): Prescription {
  const composto = ex.tipo === 'composto';
  if (ex.porTempo) return { series: 3, repMin: 30, repMax: 60, descansoSeg: 45 };
  const baseSeries = nivel === 'iniciante' ? 3 : composto ? 4 : 3;
  switch (objetivo) {
    case 'forca':
      if (composto && principal) return { series: nivel === 'iniciante' ? 4 : 5, repMin: 3, repMax: 5, descansoSeg: 180 };
      if (composto) return { series: 3, repMin: 6, repMax: 8, descansoSeg: 150 };
      return { series: 3, repMin: 8, repMax: 12, descansoSeg: 90 };
    case 'emagrecimento':
      return composto
        ? { series: 3, repMin: 8, repMax: 12, descansoSeg: 90 }
        : { series: 3, repMin: 12, repMax: 15, descansoSeg: 60 };
    case 'manutencao':
      return composto
        ? { series: 3, repMin: 8, repMax: 12, descansoSeg: 90 }
        : { series: 2, repMin: 10, repMax: 15, descansoSeg: 60 };
    default:
      return composto
        ? { series: baseSeries, repMin: 6, repMax: 10, descansoSeg: 120 }
        : { series: 3, repMin: 10, repMax: 15, descansoSeg: 75 };
  }
}

function pick(
  pool: PoolKey,
  nivel: Nivel,
  usedDay: Set<string>,
  usedPlan: Map<string, number>,
  preferBarra = false,
): Exercise | undefined {
  const allowed = POOLS[pool]
    .map((id) => EXERCISE_MAP[id])
    .filter((e): e is Exercise => !!e && e.nivel <= MAX_NIVEL[nivel] && !usedDay.has(e.id));
  if (!allowed.length) return undefined;
  if (preferBarra) {
    // No treino de força, o primeiro básico do dia deve ser com barra (melhor para cargas altas).
    const barra = allowed.find((e) => e.equipamento === 'barra' && e.tipo === 'composto');
    if (barra) return barra;
  }
  // Prefere o menos usado no plano, mantendo a ordem de preferência como desempate.
  let best = allowed[0];
  for (const e of allowed) if ((usedPlan.get(e.id) ?? 0) < (usedPlan.get(best.id) ?? 0)) best = e;
  return best;
}

export function generatePlan(profile: Profile): Plan {
  const split = chooseSplit(profile.diasSemana, profile.nivel);
  const n = exercisesForDuration(profile.duracaoMin);
  const usedPlan = new Map<string, number>();
  const prioridades = new Set<MuscleGroup>(profile.prioridades);

  const dias: WorkoutDay[] = split.dias.map((tpl, idx) => {
    const usedDay = new Set<string>();
    const forcaOk = profile.objetivo === 'forca' && profile.nivel !== 'iniciante';
    const slots = tpl.slots
      .map((slot, order) => ({ ...slot, order }))
      .filter((slot) => !slot.forca || forcaOk);
    // Mantém os N slots mais importantes, preservando a ordem de execução.
    const keep = [...slots].sort((a, b) => a.pri - b.pri || a.order - b.order).slice(0, n);
    keep.sort((a, b) => a.order - b.order);

    const exercicios: PlanExercise[] = [];
    let principalUsado = false;
    for (const slot of keep) {
      const ex = pick(slot.pool, profile.nivel, usedDay, usedPlan, forcaOk && !principalUsado);
      if (!ex) continue;
      usedDay.add(ex.id);
      usedPlan.set(ex.id, (usedPlan.get(ex.id) ?? 0) + 1);
      const principal = !principalUsado && ex.tipo === 'composto';
      if (principal) principalUsado = true;
      const pr = prescribe(ex, profile.objetivo, profile.nivel, principal);
      const bonus = prioridades.has(ex.grupo) ? 1 : 0;
      exercicios.push({ uid: uid(), exerciseId: ex.id, ...pr, series: pr.series + bonus });
    }
    const letra = String.fromCharCode(65 + idx);
    return { id: uid(), nome: `${letra} · ${tpl.nome}`, foco: tpl.foco, exercicios };
  });

  return {
    id: uid(),
    nome: split.nome,
    descricao: split.descricao,
    criadoEm: new Date().toISOString(),
    dias,
    proximo: 0,
  };
}

/** Exercícios alternativos para troca: mesmo grupo principal, compostos primeiro se o original for composto. */
export function alternativesFor(exerciseId: string, all: Exercise[]): Exercise[] {
  const base = EXERCISE_MAP[exerciseId] ?? all.find((e) => e.id === exerciseId);
  if (!base) return [];
  return all
    .filter((e) => e.id !== base.id && (e.grupo === base.grupo || e.secundarios.includes(base.grupo)))
    .sort((a, b) => score(a) - score(b) || a.nome.localeCompare(b.nome));

  function score(e: Exercise): number {
    return (
      (e.grupo === base!.grupo ? 0 : 8) +
      (e.tipo === base!.tipo ? 0 : 4) +
      (e.equipamento === 'peso_corporal' && base!.equipamento !== 'peso_corporal' ? 2 : 0) +
      Math.abs(e.nivel - base!.nivel) * 0.5
    );
  }
}
