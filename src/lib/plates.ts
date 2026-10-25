/** Anilhas olímpicas comuns em academia, da maior para a menor, com a cor do padrão IWF. */
export const PLATES: { kg: number; color: string; h: number }[] = [
  { kg: 25, color: '#D9453B', h: 1 },
  { kg: 20, color: '#2F6FD6', h: 1 },
  { kg: 15, color: '#E5B93A', h: 0.9 },
  { kg: 10, color: '#3AA569', h: 0.8 },
  { kg: 5, color: '#E8E6E1', h: 0.62 },
  { kg: 2.5, color: '#D9453B', h: 0.5 },
  { kg: 1.25, color: '#A3A8B0', h: 0.42 },
];

export interface PlateLoad {
  /** Anilhas de um lado, da mais pesada (perto do centro) para a mais leve. */
  perSide: number[];
  /** Peso que dá para montar de fato (pode ser menor que o pedido). */
  total: number;
  /** Quanto faltou para chegar no pedido, somando os dois lados. */
  sobra: number;
}

/** Monta a barra de forma gulosa: sempre a maior anilha que cabe de cada lado. */
export function loadBar(target: number, bar: number): PlateLoad {
  let side = Math.max(0, (target - bar) / 2);
  const perSide: number[] = [];
  for (const p of PLATES) {
    while (side >= p.kg - 1e-9) {
      perSide.push(p.kg);
      side -= p.kg;
    }
  }
  const total = bar + perSide.reduce((a, b) => a + b, 0) * 2;
  return { perSide, total, sobra: Math.round((Math.max(target, bar) - total) * 100) / 100 };
}

export function usesBar(equipamento: string | undefined): boolean {
  return equipamento === 'barra' || equipamento === 'barra_w';
}

export function defaultBar(equipamento: string | undefined, pesoBarraKg = 20): number {
  return equipamento === 'barra_w' ? 10 : pesoBarraKg;
}
