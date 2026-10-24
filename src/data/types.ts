export type MuscleGroup =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'trapezio'
  | 'biceps'
  | 'triceps'
  | 'antebraco'
  | 'quadriceps'
  | 'posterior'
  | 'gluteos'
  | 'panturrilhas'
  | 'abdomen'
  | 'lombar';

export type Equipment = 'barra' | 'halteres' | 'cabo' | 'maquina' | 'smith' | 'peso_corporal' | 'barra_w';

export type ExerciseKind = 'composto' | 'isolado';

export interface Exercise {
  id: string;
  nome: string;
  grupo: MuscleGroup;
  secundarios: MuscleGroup[];
  equipamento: Equipment;
  tipo: ExerciseKind;
  /** 1 = fácil de aprender, 3 = técnica exigente */
  nivel: 1 | 2 | 3;
  /** pasta da imagem no free-exercise-db (domínio público) */
  img?: string;
  passos: string[];
  dicas: string[];
  /** criado pelo usuário */
  custom?: boolean;
  /** exercício medido em segundos (prancha etc.) */
  porTempo?: boolean;
}

export const GROUP_LABEL: Record<MuscleGroup, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  trapezio: 'Trapézio',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebraco: 'Antebraço',
  quadriceps: 'Quadríceps',
  posterior: 'Posterior de coxa',
  gluteos: 'Glúteos',
  panturrilhas: 'Panturrilhas',
  abdomen: 'Abdômen',
  lombar: 'Lombar',
};

export const EQUIP_LABEL: Record<Equipment, string> = {
  barra: 'Barra',
  halteres: 'Halteres',
  cabo: 'Cabo / polia',
  maquina: 'Máquina',
  smith: 'Smith',
  peso_corporal: 'Peso corporal',
  barra_w: 'Barra W',
};

export const ALL_GROUPS = Object.keys(GROUP_LABEL) as MuscleGroup[];
