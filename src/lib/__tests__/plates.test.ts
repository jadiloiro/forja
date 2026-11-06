import { defaultBar, loadBar, usesBar } from '../plates';

describe('loadBar', () => {
  test('monta com as maiores anilhas que cabem', () => {
    expect(loadBar(82.5, 20)).toEqual({ perSide: [25, 5, 1.25], total: 82.5, sobra: 0 });
    expect(loadBar(140, 20)).toEqual({ perSide: [25, 25, 10], total: 140, sobra: 0 });
  });

  test('peso igual ou menor que a barra fica só com a barra', () => {
    expect(loadBar(20, 20)).toEqual({ perSide: [], total: 20, sobra: 0 });
    expect(loadBar(10, 20)).toEqual({ perSide: [], total: 20, sobra: 0 });
  });

  test('informa o que faltou quando não dá para montar o peso exato', () => {
    expect(loadBar(21, 20)).toEqual({ perSide: [], total: 20, sobra: 1 });
    expect(loadBar(23.5, 20)).toEqual({ perSide: [1.25], total: 22.5, sobra: 1 });
  });

  test('funciona com barra W', () => {
    expect(loadBar(30, 10)).toEqual({ perSide: [10], total: 30, sobra: 0 });
  });
});

test('usesBar reconhece só os equipamentos com barra', () => {
  expect(usesBar('barra')).toBe(true);
  expect(usesBar('barra_w')).toBe(true);
  expect(usesBar('halteres')).toBe(false);
  expect(usesBar(undefined)).toBe(false);
});

test('defaultBar: barra W tem 10 kg, as outras seguem a configuração', () => {
  expect(defaultBar('barra_w', 15)).toBe(10);
  expect(defaultBar('barra')).toBe(20);
  expect(defaultBar('barra', 15)).toBe(15);
});
