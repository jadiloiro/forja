import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { ComponentProps, useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';

import { HeartRateSummary, readHeartRate, readToday, TodayHealth } from '../lib/healthConnect';
import { useStore } from '../store/useStore';
import { colors, space } from '../theme';
import { Card, T } from './ui';

const useLigado = () => useStore((s) => !!s.settings.healthConnect);

/** Passos e sono vindos do Health Connect. Relê ao voltar para a tela e ao reabrir o app. */
export function useTodayHealth(): TodayHealth {
  const ligado = useLigado();
  const [data, setData] = useState<TodayHealth>({});
  const load = useCallback(() => {
    if (!ligado) return setData({});
    readToday().then(setData).catch(() => {});
  }, [ligado]);
  useFocusEffect(load);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => st === 'active' && load());
    return () => sub.remove();
  }, [load]);
  return data;
}

export function formatSleep(min: number): string {
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;
}

type IconName = ComponentProps<typeof Ionicons>['name'];

function Metric({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <Card style={{ flex: 1, padding: space.md, gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={14} color={colors.textMute} />
        <T v="tiny">{label}</T>
      </View>
      <T v="h3">{value}</T>
    </Card>
  );
}

/** Cartões da tela Hoje. Passos são só informação: não entram na meta de calorias. */
export function TodayHealthCards() {
  const { passos, sonoMin } = useTodayHealth();
  if (passos == null && sonoMin == null) return null;
  return (
    <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
      {passos != null && <Metric icon="footsteps-outline" label="Passos hoje" value={passos.toLocaleString('pt-BR')} />}
      {sonoMin != null && <Metric icon="moon-outline" label="Sono" value={formatSleep(sonoMin)} />}
    </View>
  );
}

/** Frequência cardíaca média e pico no intervalo do treino, se o relógio registrou. */
export function useHeartRate(inicio: string | undefined, fim: string | undefined): HeartRateSummary | undefined {
  const ligado = useLigado();
  const [hr, setHr] = useState<HeartRateSummary>();
  const load = useCallback(() => {
    if (!ligado || !inicio || !fim) return setHr(undefined);
    readHeartRate(inicio, fim).then(setHr).catch(() => {});
  }, [ligado, inicio, fim]);
  // O relógio pode sincronizar só depois que o treino acabou: relê ao voltar para o app.
  useFocusEffect(load);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => st === 'active' && load());
    return () => sub.remove();
  }, [load]);
  return hr;
}

export function HeartRateStats({ inicio, fim }: { inicio: string; fim: string }) {
  const hr = useHeartRate(inicio, fim);
  if (!hr) return null;
  return (
    <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
      <Metric icon="heart-outline" label="FC média" value={`${hr.media} bpm`} />
      <Metric icon="pulse-outline" label="FC pico" value={`${hr.pico} bpm`} />
    </View>
  );
}
