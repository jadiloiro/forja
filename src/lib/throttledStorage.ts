import { PersistStorage, StorageValue } from 'zustand/middleware';

interface KeyValueStore {
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
}

export type ThrottledStorage<S> = PersistStorage<S> & { flush: () => Promise<void> };

/**
 * Storage do persist que grava no máximo uma vez por intervalo, sempre o estado mais recente.
 * Substitui o createJSONStorage porque ele serializa a cada alteração, e o custo está aí:
 * o JSON.stringify inclui todo o histórico e roda na mesma thread da interface.
 * O conteúdo gravado é igual ao do createJSONStorage.
 */
export function createThrottledStorage<S>(store: KeyValueStore, intervalMs = 1000): ThrottledStorage<S> {
  let pending: { name: string; value: StorageValue<S> } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Fila: uma gravação lenta não pode terminar depois da seguinte e deixar o estado antigo no disco.
  let writes: Promise<void> = Promise.resolve();

  const enqueue = (op: () => Promise<void>) => {
    writes = writes.then(op).catch((e) => console.warn('Falha ao salvar os dados', e));
    return writes;
  };

  const flush = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    if (pending) {
      const { name, value } = pending;
      pending = undefined;
      const json = JSON.stringify(value);
      enqueue(() => store.setItem(name, json));
    }
    return writes;
  };

  return {
    flush,
    getItem: async (name) => {
      const json = await store.getItem(name);
      return json === null ? null : (JSON.parse(json) as StorageValue<S>);
    },
    setItem: (name, value) => {
      pending = { name, value };
      if (timer === undefined) timer = setTimeout(flush, intervalMs);
    },
    removeItem: (name) => {
      if (pending?.name === name) pending = undefined;
      return enqueue(() => store.removeItem(name));
    },
  };
}
