import { RegiaoCorporal } from './trainingTypes';

/**
 * Exercícios que costumam sobrecarregar cada região. É uma precaução geral, não uma avaliação:
 * o que incomoda varia de pessoa para pessoa, e quem tem lesão deve seguir a orientação de um profissional.
 */
export const EVITAR_POR_REGIAO: Record<RegiaoCorporal, readonly string[]> = {
  pescoco: ['encolhimento_barra', 'encolhimento_halter', 'desenvolvimento_barra', 'remada_alta', 'agachamento_livre', 'abdominal_supra', 'abdominal_cabo'],
  ombro: [
    'supino_reto_barra',
    'supino_inclinado_barra',
    'supino_declinado_barra',
    'supino_inclinado_smith',
    'crucifixo_halter',
    'crucifixo_inclinado',
    'paralelas_peito',
    'paralelas_triceps',
    'mergulho_banco',
    'pullover',
    'desenvolvimento_barra',
    'desenvolvimento_halter',
    'desenvolvimento_maquina',
    'arnold',
    'elevacao_frontal',
    'remada_alta',
    'triceps_frances',
    'triceps_overhead_corda',
  ],
  cotovelo: ['triceps_testa', 'triceps_frances', 'triceps_overhead_corda', 'paralelas_peito', 'paralelas_triceps', 'mergulho_banco', 'supino_fechado', 'rosca_scott', 'rosca_direta'],
  punho: ['flexao', 'agachamento_frontal', 'rosca_direta', 'rosca_punho', 'rosca_inversa', 'triceps_testa', 'paralelas_peito', 'paralelas_triceps', 'mergulho_banco', 'prancha_lateral', 'roda_abdominal'],
  lombar: [
    'levantamento_terra',
    'terra_sumo',
    'terra_romeno',
    'stiff',
    'stiff_halter',
    'bom_dia',
    'hiperextensao',
    'remada_curvada',
    'remada_cavalinho',
    'agachamento_livre',
    'agachamento_frontal',
    'desenvolvimento_barra',
    'elevacao_pernas',
    'abdominal_infra',
    'roda_abdominal',
  ],
  quadril: ['agachamento_livre', 'agachamento_frontal', 'afundo', 'agachamento_dividido', 'passada', 'step_up', 'terra_sumo', 'bom_dia', 'abdutora', 'adutora', 'elevacao_pernas', 'abdominal_infra'],
  joelho: ['agachamento_livre', 'agachamento_frontal', 'agachamento_smith', 'hack', 'cadeira_extensora', 'afundo', 'agachamento_dividido', 'passada', 'step_up'],
  tornozelo: ['panturrilha_em_pe', 'panturrilha_sentado', 'panturrilha_leg', 'agachamento_frontal', 'afundo', 'passada', 'step_up'],
};

export function exercisesToAvoid(lesoes: readonly RegiaoCorporal[] = []): Set<string> {
  return new Set(lesoes.flatMap((r) => EVITAR_POR_REGIAO[r]));
}
