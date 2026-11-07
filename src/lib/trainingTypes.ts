import { MuscleGroup } from '../data/types';
import type { RestSoundId } from './restSounds';

export type Sexo = 'M' | 'F';
export type Nivel = 'iniciante' | 'intermediario' | 'avancado';
export type Objetivo = 'hipertrofia' | 'forca' | 'emagrecimento' | 'manutencao';
export type Atividade = 'sedentario' | 'leve' | 'moderado' | 'alto' | 'muito_alto';
export type Ritmo = 'leve' | 'moderado' | 'acelerado';
export type Apetite = 'baixo' | 'normal' | 'alto';
export type RegiaoCorporal = 'pescoco' | 'ombro' | 'cotovelo' | 'punho' | 'lombar' | 'quadril' | 'joelho' | 'tornozelo';
/** Medicamentos que afetam apetite e peso, marcados por atalho. */
export type MedicamentoAtalho = 'tirzepatida' | 'semaglutida';

export interface Medicamento {
  nome: string;
  dose?: string;
  frequencia?: string;
  atalho?: MedicamentoAtalho;
}

export interface Profile {
  nome: string;
  sexo: Sexo;
  idade: number;
  alturaCm: number;
  pesoKg: number;
  nivel: Nivel;
  objetivo: Objetivo;
  diasSemana: number;
  duracaoMin: number;
  atividade: Atividade;
  prioridades: MuscleGroup[];
  // Opcionais: perfis salvos antes destes campos não os têm.
  pesoMetaKg?: number;
  prazoSemanas?: number;
  ritmo?: Ritmo;
  medicamentos?: Medicamento[];
  condicoes?: string;
  lesoes?: RegiaoCorporal[];
  sonoHoras?: number;
  apetite?: Apetite;
  /** O que a pessoa não come, em texto livre. O cardápio sugerido respeita. */
  alimentosExcluidos?: string[];
}

export const RITMO_LABEL: Record<Ritmo, string> = { leve: 'Leve', moderado: 'Moderado', acelerado: 'Acelerado' };

export const APETITE_LABEL: Record<Apetite, string> = { baixo: 'Pouca fome', normal: 'Normal', alto: 'Muita fome' };

export const REGIAO_LABEL: Record<RegiaoCorporal, string> = {
  pescoco: 'Pescoço',
  ombro: 'Ombro',
  cotovelo: 'Cotovelo',
  punho: 'Punho',
  lombar: 'Lombar',
  quadril: 'Quadril',
  joelho: 'Joelho',
  tornozelo: 'Tornozelo',
};

export const MEDICAMENTO_ATALHO_LABEL: Record<MedicamentoAtalho, string> = {
  tirzepatida: 'Tirzepatida (Mounjaro)',
  semaglutida: 'Semaglutida (Ozempic/Wegovy)',
};

export const NIVEL_LABEL: Record<Nivel, string> = {
  iniciante: 'Iniciante (até 6 meses)',
  intermediario: 'Intermediário (6 meses a 2 anos)',
  avancado: 'Avançado (mais de 2 anos)',
};

export const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia: 'Ganhar massa muscular',
  forca: 'Ganhar força',
  emagrecimento: 'Perder gordura',
  manutencao: 'Manter a forma',
};

export const ATIVIDADE_LABEL: Record<Atividade, string> = {
  sedentario: 'Sedentário (trabalho sentado, pouco movimento)',
  leve: 'Leve (anda um pouco no dia a dia)',
  moderado: 'Moderado (em pé boa parte do dia)',
  alto: 'Alto (trabalho físico)',
  muito_alto: 'Muito alto (trabalho físico pesado)',
};

export type SetTipo = 'normal' | 'aquecimento' | 'dropset' | 'falha';

export const SET_TIPO_LABEL: Record<SetTipo, string> = {
  normal: 'Normal',
  aquecimento: 'Aquecimento',
  dropset: 'Drop-set',
  falha: 'Até a falha',
};

export interface PlanExercise {
  uid: string;
  exerciseId: string;
  series: number;
  repMin: number;
  repMax: number;
  descansoSeg: number;
  notas?: string;
}

export interface WorkoutDay {
  id: string;
  nome: string;
  foco: string;
  exercicios: PlanExercise[];
}

export interface Plan {
  id: string;
  nome: string;
  descricao: string;
  criadoEm: string;
  dias: WorkoutDay[];
  /** índice do próximo treino a fazer na rotação */
  proximo: number;
}

export interface SetLog {
  peso: number | null;
  reps: number | null;
  feito: boolean;
  tipo: SetTipo;
}

export interface SessionExercise {
  uid: string;
  exerciseId: string;
  repMin: number;
  repMax: number;
  descansoSeg: number;
  notas?: string;
  sets: SetLog[];
}

export interface ActiveSession {
  id: string;
  dayId?: string;
  planId?: string;
  nome: string;
  inicio: string;
  exercicios: SessionExercise[];
  /** fim do descanso em ms epoch (sobrevive ao app ir para segundo plano) */
  descansoAte?: number;
  descansoTotal?: number;
}

export interface SessionRecord extends ActiveSession {
  fim: string;
  volumeKg: number;
  nota?: string;
}

export interface BodyWeight {
  data: string; // YYYY-MM-DD
  pesoKg: number;
}

export interface Settings {
  incrementoBarraKg: number;
  incrementoHalterKg: number;
  vibrarDescanso: boolean;
  /** Opcional: backups e dados salvos antes da calculadora de anilhas não têm o campo. */
  pesoBarraKg?: number;
  /** Notificação no fim do descanso com o app minimizado. Ausente = ligado. */
  notificarDescanso?: boolean;
  /** Tocar som no fim do descanso. Ausente = ligado. */
  somDescanso?: boolean;
  /** Som escolhido no Perfil. Ausente = padrão. */
  somDescansoId?: RestSoundId;
  /** Toque curto 10 s antes do fim. Ausente = desligado. */
  avisoDezSeg?: boolean;
  /** Integração com o Health Connect (Samsung Health e relógio). Ausente = desligada. */
  healthConnect?: boolean;
  /** Horário (ISO) da última medição de peso importada do Health Connect. */
  hcPesoAte?: string;
}
