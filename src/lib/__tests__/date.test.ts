import { addDays, dateKey, formatClock, formatDateTime, formatDayLabel, formatDuration, formatShortDate, fromKey, weekStart } from '../date';

describe('chaves de data', () => {
  test('dateKey usa o dia local, com zeros à esquerda', () => {
    expect(dateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  test('fromKey é o inverso de dateKey', () => {
    expect(dateKey(fromKey('2026-11-06'))).toBe('2026-11-06');
  });

  test.each([
    ['2026-01-31', 1, '2026-02-01'],
    ['2026-01-01', -1, '2025-12-31'],
    ['2024-02-28', 1, '2024-02-29'],
    ['2026-02-28', 1, '2026-03-01'],
    ['2026-11-06', 0, '2026-11-06'],
  ])('addDays(%s, %i) = %s', (key, delta, esperado) => {
    expect(addDays(key, delta)).toBe(esperado);
  });
});

describe('formatDayLabel', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 6, 12));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('usa nomes relativos perto de hoje', () => {
    expect(formatDayLabel('2026-11-06')).toBe('Hoje');
    expect(formatDayLabel('2026-11-05')).toBe('Ontem');
    expect(formatDayLabel('2026-11-07')).toBe('Amanhã');
  });

  test('longe de hoje mostra dia da semana e data', () => {
    expect(formatDayLabel('2026-01-05')).toBe('segunda, 5 jan');
  });
});

describe('formatação', () => {
  const iso = new Date(2026, 0, 5, 9, 7).toISOString();

  test('formatShortDate', () => {
    expect(formatShortDate(iso)).toBe('5 jan');
  });

  test('formatDateTime', () => {
    expect(formatDateTime(iso)).toBe('segunda, 5 jan · 09:07');
  });

  test.each([
    [0, '0:00'],
    [65_000, '1:05'],
    [3_661_000, '1h01'],
    [-5_000, '0:00'],
  ])('formatDuration(%i) = %s', (ms, esperado) => {
    expect(formatDuration(ms)).toBe(esperado);
  });

  test.each([
    [0, '0:00'],
    [59.2, '1:00'],
    [90, '1:30'],
    [-3, '0:00'],
  ])('formatClock(%d) = %s', (sec, esperado) => {
    expect(formatClock(sec)).toBe(esperado);
  });
});

describe('weekStart', () => {
  test.each([
    ['segunda continua na segunda', new Date(2026, 10, 2), '2026-11-02'],
    ['sexta volta para a segunda', new Date(2026, 10, 6), '2026-11-02'],
    ['domingo é o fim da semana, não o começo', new Date(2026, 10, 8), '2026-11-02'],
    ['atravessa o mês', new Date(2026, 10, 1), '2026-10-26'],
  ])('%s', (_nome, data, esperado) => {
    expect(dateKey(weekStart(data))).toBe(esperado);
  });
});
