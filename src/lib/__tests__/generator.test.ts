import { EXERCISE_MAP, EXERCISES } from '../../data/exercises';
import { Exercise } from '../../data/types';
import { alternativesFor, generatePlan, prescribe } from '../generator';
import { Nivel, Objetivo, Profile } from '../trainingTypes';

const NIVEIS: Nivel[] = ['iniciante', 'intermediario', 'avancado'];
const OBJETIVOS: Objetivo[] = ['hipertrofia', 'forca', 'emagrecimento', 'manutencao'];
const DIAS = [2, 3, 4, 5, 6];
const DURACOES = [30, 45, 60, 75, 90];
const MAX_EXERCICIOS: Record<number, number> = { 30: 4, 45: 5, 60: 6, 75: 7, 90: 8 };
const MAX_NIVEL: Record<Nivel, number> = { iniciante: 2, intermediario: 3, avancado: 3 };

function profile(patch: Partial<Profile> = {}): Profile {
  return {
    nome: 'Teste',
    sexo: 'M',
    idade: 30,
    alturaCm: 180,
    pesoKg: 80,
    nivel: 'intermediario',
    objetivo: 'hipertrofia',
    diasSemana: 4,
    duracaoMin: 60,
    atividade: 'moderado',
    prioridades: [],
    ...patch,
  };
}

const COMBINACOES = NIVEIS.flatMap((nivel) =>
  OBJETIVOS.flatMap((objetivo) =>
    DIAS.flatMap((diasSemana) => DURACOES.map((duracaoMin) => ({ nivel, objetivo, diasSemana, duracaoMin }))),
  ),
);

describe('generatePlan', () => {
  test.each(COMBINACOES)('$nivel, $objetivo, $diasSemana dias, $duracaoMin min', (combo) => {
    const plan = generatePlan(profile(combo));

    expect(plan.dias).toHaveLength(combo.diasSemana);
    expect(plan.proximo).toBe(0);

    for (const dia of plan.dias) {
      const ids = dia.exercicios.map((e) => e.exerciseId);
      expect(ids.length).toBeGreaterThan(0);
      expect(ids.length).toBeLessThanOrEqual(MAX_EXERCICIOS[combo.duracaoMin]);
      expect(new Set(ids).size).toBe(ids.length);

      for (const e of dia.exercicios) {
        const ex = EXERCISE_MAP[e.exerciseId];
        expect(ex).toBeDefined();
        expect(ex.nivel).toBeLessThanOrEqual(MAX_NIVEL[combo.nivel]);
        expect(e.series).toBeGreaterThan(0);
        expect(e.repMin).toBeLessThanOrEqual(e.repMax);
      }
    }
  });

  test.each([
    [2, 'iniciante', 'Full body 2x'],
    [3, 'iniciante', 'Full body 3x'],
    [3, 'intermediario', 'Push / Pull / Legs'],
    [4, 'intermediario', 'Superior / Inferior'],
    [5, 'intermediario', 'Superior / Inferior + PPL'],
    [5, 'avancado', 'ABCDE'],
    [6, 'avancado', 'Push / Pull / Legs 2x'],
  ] as const)('%i dias para %s usa a divisão %s', (diasSemana, nivel, nome) => {
    expect(generatePlan(profile({ diasSemana, nivel })).nome).toBe(nome);
  });

  test('nomeia os treinos em ordem alfabética', () => {
    const nomes = generatePlan(profile({ diasSemana: 3 })).dias.map((d) => d.nome[0]);
    expect(nomes).toEqual(['A', 'B', 'C']);
  });

  test('só inclui levantamento terra para força em quem não é iniciante', () => {
    const idsDe = (patch: Partial<Profile>) =>
      generatePlan(profile({ diasSemana: 4, duracaoMin: 90, ...patch })).dias.flatMap((d) => d.exercicios.map((e) => e.exerciseId));

    expect(idsDe({ objetivo: 'forca', nivel: 'intermediario' })).toContain('levantamento_terra');
    expect(idsDe({ objetivo: 'forca', nivel: 'iniciante' })).not.toContain('levantamento_terra');
    expect(idsDe({ objetivo: 'hipertrofia', nivel: 'intermediario' })).not.toContain('levantamento_terra');
  });

  test('o grupo prioritário ganha uma série a mais', () => {
    const seriesDePeito = (prioridades: Profile['prioridades']) =>
      generatePlan(profile({ prioridades }))
        .dias.flatMap((d) => d.exercicios)
        .filter((e) => EXERCISE_MAP[e.exerciseId].grupo === 'peito')
        .map((e) => e.series);

    const sem = seriesDePeito([]);
    expect(sem.length).toBeGreaterThan(0);
    expect(seriesDePeito(['peito'])).toEqual(sem.map((n) => n + 1));
  });

  test.todo('respeita lesões e limitações do perfil (entra com o M006)');
});

describe('prescribe', () => {
  const composto = { tipo: 'composto' } as Exercise;
  const isolado = { tipo: 'isolado' } as Exercise;

  test('exercício por tempo é medido em segundos, para qualquer objetivo', () => {
    const prancha = { tipo: 'isolado', porTempo: true } as Exercise;
    expect(prescribe(prancha, 'forca', 'avancado', false)).toEqual({ series: 3, repMin: 30, repMax: 60, descansoSeg: 45 });
  });

  test('força: principal pesado, depende do nível', () => {
    expect(prescribe(composto, 'forca', 'iniciante', true)).toEqual({ series: 4, repMin: 3, repMax: 5, descansoSeg: 180 });
    expect(prescribe(composto, 'forca', 'avancado', true)).toEqual({ series: 5, repMin: 3, repMax: 5, descansoSeg: 180 });
    expect(prescribe(composto, 'forca', 'avancado', false)).toEqual({ series: 3, repMin: 6, repMax: 8, descansoSeg: 150 });
    expect(prescribe(isolado, 'forca', 'avancado', false)).toEqual({ series: 3, repMin: 8, repMax: 12, descansoSeg: 90 });
  });

  test('emagrecimento e manutenção usam mais repetições e menos descanso', () => {
    expect(prescribe(composto, 'emagrecimento', 'avancado', true)).toEqual({ series: 3, repMin: 8, repMax: 12, descansoSeg: 90 });
    expect(prescribe(isolado, 'emagrecimento', 'avancado', false)).toEqual({ series: 3, repMin: 12, repMax: 15, descansoSeg: 60 });
    expect(prescribe(composto, 'manutencao', 'avancado', true)).toEqual({ series: 3, repMin: 8, repMax: 12, descansoSeg: 90 });
    expect(prescribe(isolado, 'manutencao', 'avancado', false)).toEqual({ series: 2, repMin: 10, repMax: 15, descansoSeg: 60 });
  });

  test('hipertrofia: compostos têm menos séries para iniciante', () => {
    expect(prescribe(composto, 'hipertrofia', 'iniciante', true).series).toBe(3);
    expect(prescribe(composto, 'hipertrofia', 'avancado', true).series).toBe(4);
    expect(prescribe(isolado, 'hipertrofia', 'avancado', false)).toEqual({ series: 3, repMin: 10, repMax: 15, descansoSeg: 75 });
  });
});

describe('alternativesFor', () => {
  test('não sugere o próprio exercício e prioriza o mesmo grupo', () => {
    const alt = alternativesFor('supino_reto_barra', EXERCISES);
    expect(alt.length).toBeGreaterThan(0);
    expect(alt.map((e) => e.id)).not.toContain('supino_reto_barra');
    expect(alt[0].grupo).toBe('peito');
  });

  test('todo sugerido trabalha o grupo do exercício original', () => {
    for (const e of alternativesFor('supino_reto_barra', EXERCISES)) {
      expect(e.grupo === 'peito' || e.secundarios.includes('peito')).toBe(true);
    }
  });

  test('aceita exercício personalizado', () => {
    const custom = { ...EXERCISE_MAP.supino_reto_barra, id: 'meu_supino', custom: true };
    const alt = alternativesFor('meu_supino', [...EXERCISES, custom]);
    expect(alt.map((e) => e.id)).toContain('supino_reto_barra');
  });

  test('exercício desconhecido não tem alternativas', () => {
    expect(alternativesFor('nao_existe', EXERCISES)).toEqual([]);
  });
});
