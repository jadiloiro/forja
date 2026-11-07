import { AppState } from 'react-native';

import { getExercise, State, useStore } from '../store/useStore';
import { addDays, dateKey } from './date';
import { deleteSession, readWeights, writeDiaryDay, writeSession } from './healthConnect';

/** Dias para trás que o diário ainda é enviado: um backup restaurado não reenvia meses de refeições. */
const DIAS_DIARIO = 30;
/** Só treinos que acabaram há pouco vão para o Health Connect; um backup antigo restaurado não. */
const TREINO_RECENTE_MS = 6 * 3_600_000;
const ESPERA_DIARIO_MS = 3000;

const run = (fn: () => Promise<unknown>) => {
  fn().catch(() => {});
};

const nomeExercicio = (id: string) => getExercise(id)?.nome;

let lendoPeso: Promise<number> | undefined;

/**
 * Traz para o Forja os pesos registrados no Samsung Health (ou na balança) desde a última leitura.
 * Devolve quantos dias foram atualizados.
 */
export function pullWeights(): Promise<number> {
  lendoPeso ??= (async () => {
    try {
      const ws = await readWeights(useStore.getState().settings.hcPesoAte);
      if (!ws.length) return 0;
      for (const w of ws) useStore.getState().logBodyWeight(w.data, w.pesoKg);
      useStore.getState().updateSettings({ hcPesoAte: ws[ws.length - 1].time });
      return ws.length;
    } finally {
      lendoPeso = undefined;
    }
  })();
  return lendoPeso;
}

const ligado = (s: Pick<State, 'settings'>) => !!s.settings.healthConnect;

export function startHealthSync(): () => void {
  const pendentes = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const enviarDiario = () => {
    clearTimeout(timer);
    timer = undefined;
    const st = useStore.getState();
    const dias = [...pendentes];
    pendentes.clear();
    if (!ligado(st)) return;
    for (const d of dias) run(() => writeDiaryDay(d, st.nutrition[d]));
  };

  if (ligado(useStore.getState())) run(pullWeights);

  const appSub = AppState.addEventListener('change', (st) => {
    if (st === 'active') {
      if (ligado(useStore.getState())) run(pullWeights);
    } else if (pendentes.size) {
      enviarDiario();
    }
  });

  const unsub = useStore.subscribe((s, prev) => {
    if (!ligado(s)) return;
    if (!ligado(prev)) {
      run(pullWeights);
      return;
    }

    if (s.history !== prev.history) {
      const antes = new Set(prev.history.map((h) => h.id));
      for (const rec of s.history) {
        if (!antes.has(rec.id) && Date.now() - Date.parse(rec.fim) < TREINO_RECENTE_MS) run(() => writeSession(rec, nomeExercicio));
      }
      // Só a exclusão de um treino pela tela. Restaurar um backup troca também os planos e não apaga nada lá.
      if (s.history.length === prev.history.length - 1 && s.plans === prev.plans) {
        const agora = new Set(s.history.map((h) => h.id));
        const removido = prev.history.find((h) => !agora.has(h.id));
        if (removido) run(() => deleteSession(removido.id));
      }
    }

    if (s.nutrition !== prev.nutrition) {
      const limite = addDays(dateKey(), -DIAS_DIARIO);
      for (const d of new Set([...Object.keys(s.nutrition), ...Object.keys(prev.nutrition)])) {
        if (d >= limite && s.nutrition[d] !== prev.nutrition[d]) pendentes.add(d);
      }
      if (pendentes.size) {
        clearTimeout(timer);
        timer = setTimeout(enviarDiario, ESPERA_DIARIO_MS);
      }
    }
  });

  return () => {
    unsub();
    appSub.remove();
    clearTimeout(timer);
  };
}
