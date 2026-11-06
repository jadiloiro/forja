import { createThrottledStorage } from '../throttledStorage';

type Dados = { n: number };

function memoria() {
  const dados = new Map<string, string>();
  return {
    dados,
    getItem: jest.fn(async (k: string) => dados.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string): Promise<void> => {
      dados.set(k, v);
    }),
    removeItem: jest.fn(async (k: string): Promise<void> => {
      dados.delete(k);
    }),
  };
}

const salvo = (n: number) => ({ state: { n }, version: 1 });

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('createThrottledStorage', () => {
  test('várias alterações seguidas viram uma gravação só, com o estado mais recente', async () => {
    const m = memoria();
    const s = createThrottledStorage<Dados>(m, 1000);

    for (let n = 1; n <= 50; n++) s.setItem('k', salvo(n));
    expect(m.setItem).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1000);
    expect(m.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(m.dados.get('k')!)).toEqual(salvo(50));
  });

  test('só serializa ao gravar, não a cada alteração', async () => {
    const stringify = jest.spyOn(JSON, 'stringify');
    const s = createThrottledStorage<Dados>(memoria(), 1000);

    for (let n = 1; n <= 50; n++) s.setItem('k', salvo(n));
    expect(stringify).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1000);
    expect(stringify).toHaveBeenCalledTimes(1);
    stringify.mockRestore();
  });

  test('o intervalo não adia para sempre: digitar sem parar ainda grava', async () => {
    const m = memoria();
    const s = createThrottledStorage<Dados>(m, 1000);

    for (let n = 1; n <= 25; n++) {
      s.setItem('k', salvo(n));
      await jest.advanceTimersByTimeAsync(100);
    }
    expect(m.setItem).toHaveBeenCalledTimes(2);
  });

  test('flush grava na hora e não repete a gravação depois', async () => {
    const m = memoria();
    const s = createThrottledStorage<Dados>(m, 1000);

    s.setItem('k', salvo(1));
    await s.flush();
    expect(JSON.parse(m.dados.get('k')!)).toEqual(salvo(1));

    await jest.advanceTimersByTimeAsync(5000);
    expect(m.setItem).toHaveBeenCalledTimes(1);
  });

  test('flush sem nada pendente não grava', async () => {
    const m = memoria();
    await createThrottledStorage<Dados>(m, 1000).flush();
    expect(m.setItem).not.toHaveBeenCalled();
  });

  test('uma gravação lenta não sobrescreve a seguinte', async () => {
    const m = memoria();
    let liberar = () => {};
    m.setItem.mockImplementationOnce(
      (k, v) =>
        new Promise<void>((r) => {
          liberar = () => {
            m.dados.set(k, v);
            r();
          };
        }),
    );
    const s = createThrottledStorage<Dados>(m, 1000);

    s.setItem('k', salvo(1));
    s.flush();
    await jest.advanceTimersByTimeAsync(0);
    s.setItem('k', salvo(2));
    const fim = s.flush();
    await jest.advanceTimersByTimeAsync(0);
    liberar();
    await fim;

    expect(JSON.parse(m.dados.get('k')!)).toEqual(salvo(2));
  });

  test('uma falha ao gravar não impede as próximas', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const m = memoria();
    m.setItem.mockRejectedValueOnce(new Error('disco cheio'));
    const s = createThrottledStorage<Dados>(m, 1000);

    s.setItem('k', salvo(1));
    await s.flush();
    expect(aviso).toHaveBeenCalled();

    s.setItem('k', salvo(2));
    await s.flush();
    expect(JSON.parse(m.dados.get('k')!)).toEqual(salvo(2));
    aviso.mockRestore();
  });

  test('getItem devolve o que foi gravado, e null quando não há nada', async () => {
    const m = memoria();
    const s = createThrottledStorage<Dados>(m, 1000);
    expect(await s.getItem('k')).toBeNull();

    s.setItem('k', salvo(7));
    await s.flush();
    expect(await s.getItem('k')).toEqual(salvo(7));
  });

  test('removeItem descarta a gravação pendente', async () => {
    const m = memoria();
    const s = createThrottledStorage<Dados>(m, 1000);
    m.dados.set('k', 'antigo');

    s.setItem('k', salvo(1));
    await s.removeItem('k');
    await jest.advanceTimersByTimeAsync(5000);

    expect(m.dados.has('k')).toBe(false);
    expect(m.setItem).not.toHaveBeenCalled();
  });
});
