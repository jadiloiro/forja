import { MuscleGroup } from '../data/types';

export type Sexo = 'M' | 'F';
export type Nivel = 'iniciante' | 'intermediario' | 'avancado';
export type Objetivo = 'hipertrofia' | 'forca' | 'emagrecimento' | 'manutencao';
export type Atividade = 'sedentario' | 'leve' | 'moderado' | 'alto' | 'muito_alto';

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
}

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
}
