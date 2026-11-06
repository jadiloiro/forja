import { uid } from '../id';
import { estimateMinutes, fmtRest, muscleSummary, repRange, totalSets } from '../planUtils';
import { PlanExercise } from '../trainingTypes';

function ex(exerciseId: string, series: number, descansoSeg = 60): PlanExercise {
  return { uid: exerciseId, exerciseId, series, repMin: 8, repMax: 12, descansoSeg };
}

test('estimateMinutes soma execução, descanso entre séries e troca de exercício', () => {
  expect(estimateMinutes([])).toBe(0);
  expect(estimateMinutes([ex('a', 3)])).toBe(5);
  expect(estimateMinutes([ex('a', 1, 300)])).toBe(2);
});

test('totalSets soma as séries', () => {
  expect(totalSets([ex('a', 3), ex('b', 4)])).toBe(7);
});

test('muscleSummary lista cada grupo uma vez e ignora exercício desconhecido', () => {
  const day = {
    id: 'd',
    nome: 'A',
    foco: '',
    exercicios: [ex('supino_reto_barra', 3), ex('crossover', 3), ex('remada_curvada', 3), ex('nao_existe', 3)],
  };
  expect(muscleSummary(day)).toBe('Peito · Costas');
});

test('repRange formata a faixa', () => {
  expect(repRange(8, 12)).toBe('8–12');
  expect(repRange(10, 10)).toBe('10');
  expect(repRange(30, 60, true)).toBe('30–60s');
});

test('fmtRest formata o descanso', () => {
  expect(fmtRest(45)).toBe('45s');
  expect(fmtRest(60)).toBe('1min');
  expect(fmtRest(90)).toBe('1min30s');
});

test('uid não se repete', () => {
  const ids = Array.from({ length: 1000 }, () => uid());
  expect(new Set(ids).size).toBe(1000);
});
