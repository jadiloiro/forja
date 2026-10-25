import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { showDialog } from '../../components/Dialog';
import { BarChart, LineChart } from '../../components/charts';
import { ExerciseThumb } from '../../components/ExerciseMedia';
import { Card, Chip, Empty, Screen, SectionHeader, T } from '../../components/ui';
import { GROUP_LABEL, MuscleGroup } from '../../data/types';
import { dateKey, formatDateTime, formatDuration, formatShortDate, fromKey, weekStart } from '../../lib/date';
import { fmtKg, personalRecords, workingSets } from '../../lib/progression';
import { getExercise, useStore } from '../../store/useStore';
import { colors, space } from '../../theme';

type Tab = 'resumo' | 'historico' | 'recordes' | 'corpo';

export default function Progresso() {
  const [tab, setTab] = useState<Tab>('resumo');
  return (
    <Screen>
      <T v="display">Progresso</T>
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md, flexWrap: 'wrap' }}>
        <Chip label="Resumo" selected={tab === 'resumo'} onPress={() => setTab('resumo')} />
        <Chip label="Histórico" selected={tab === 'historico'} onPress={() => setTab('historico')} />
        <Chip label="Recordes" selected={tab === 'recordes'} onPress={() => setTab('recordes')} />
        <Chip label="Corpo" selected={tab === 'corpo'} onPress={() => setTab('corpo')} />
      </View>
      {tab === 'resumo' && <Resumo />}
      {tab === 'historico' && <Historico />}
      {tab === 'recordes' && <Recordes />}
      {tab === 'corpo' && <Corpo />}
    </Screen>
  );
}

function Resumo() {
  const history = useStore((s) => s.history);
  const [nowMs] = useState(() => Date.now());
  const data = useMemo(() => {
    const now = new Date(nowMs);
    const thisWeek = weekStart(now).getTime();
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(thisWeek);
      d.setDate(d.getDate() - (7 - i) * 7);
      return { start: d.getTime(), label: `${d.getDate()}/${d.getMonth() + 1}`, volume: 0, treinos: 0 };
    });
    const sets: Partial<Record<MuscleGroup, number>> = {};
    const weekAgo = nowMs - 7 * 864e5;
    for (const h of history) {
      const t = new Date(h.fim).getTime();
      for (let i = weeks.length - 1; i >= 0; i--) {
        if (t >= weeks[i].start) {
          weeks[i].volume += h.volumeKg;
          weeks[i].treinos += 1;
          break;
        }
      }
      if (t >= weekAgo) {
        for (const e of h.exercicios) {
          const ex = getExercise(e.exerciseId);
          if (ex) sets[ex.grupo] = (sets[ex.grupo] ?? 0) + workingSets(e).length;
        }
      }
    }
    const month = history.filter((h) => {
      const d = new Date(h.fim);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const avgMin = history.length
      ? history.slice(0, 10).reduce((a, h) => a + (new Date(h.fim).getTime() - new Date(h.inicio).getTime()), 0) / Math.min(10, history.length)
      : 0;
    return { weeks, sets, month, avgMin };
  }, [history, nowMs]);

  if (!history.length) {
    return <Empty icon="stats-chart-outline" title="Sem dados ainda" text="Conclua seu primeiro treino para ver estatísticas, recordes e evolução." />;
  }

  const groupSets = (Object.entries(data.sets) as [MuscleGroup, number][]).sort((a, b) => b[1] - a[1]);
  const maxSets = Math.max(1, ...groupSets.map((g) => g[1]));

  return (
    <>
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
        <Stat label="Treinos" value={String(history.length)} />
        <Stat label="Este mês" value={String(data.month)} />
        <Stat label="Média" value={formatDuration(data.avgMin)} />
      </View>
      <SectionHeader title="Volume por semana (kg)" />
      <Card>
        <BarChart data={data.weeks.map((w) => ({ label: w.label, value: w.volume }))} />
      </Card>
      <SectionHeader title="Séries por músculo · últimos 7 dias" />
      <Card style={{ gap: space.sm }}>
        {!groupSets.length && <T v="small">Nenhum treino nos últimos 7 dias.</T>}
        {groupSets.map(([g, n]) => (
          <View key={g} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <T v="small" style={{ width: 110 }}>
              {GROUP_LABEL[g]}
            </T>
            <View style={{ flex: 1, height: 10, backgroundColor: colors.surface3, borderRadius: 5, overflow: 'hidden' }}>
              <View style={{ width: `${(n / maxSets) * 100}%`, height: '100%', backgroundColor: n >= 10 ? colors.success : colors.accent, borderRadius: 5 }} />
            </View>
            <T v="small" style={{ width: 24, textAlign: 'right', color: colors.text }}>
              {n}
            </T>
          </View>
        ))}
        <T v="small" style={{ fontSize: 11, color: colors.textMute, marginTop: 4 }}>
          Referência para hipertrofia: cerca de 10 a 20 séries semanais por músculo.
        </T>
      </Card>
    </>
  );
}

function Historico() {
  const history = useStore((s) => s.history);
  if (!history.length) return <Empty icon="time-outline" title="Nenhum treino registrado" />;
  return (
    <View style={{ gap: space.sm, marginTop: space.lg }}>
      {history.map((h) => {
        const sets = h.exercicios.reduce((a, e) => a + workingSets(e).length, 0);
        return (
          <Card key={h.id} onPress={() => router.push({ pathname: '/historico/[id]', params: { id: h.id } })} style={{ padding: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <T v="h3">{h.nome}</T>
                <T v="small">{formatDateTime(h.inicio)}</T>
                <T v="small">
                  {formatDuration(new Date(h.fim).getTime() - new Date(h.inicio).getTime())} · {sets} séries · {h.volumeKg.toLocaleString('pt-BR')} kg
                </T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMute} />
            </View>
          </Card>
        );
      })}
    </View>
  );
}

function Recordes() {
  const history = useStore((s) => s.history);
  const prs = useMemo(() => Object.values(personalRecords(history)).sort((a, b) => b.e1rm - a.e1rm), [history]);
  if (!prs.length) return <Empty icon="trophy-outline" title="Nenhum recorde ainda" text="Registre cargas nos treinos para acompanhar seus recordes." />;
  return (
    <View style={{ gap: space.sm, marginTop: space.lg }}>
      {prs.map((p) => {
        const ex = getExercise(p.exerciseId);
        return (
          <Card key={p.exerciseId} style={{ padding: space.md }} onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: p.exerciseId } })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <ExerciseThumb exercise={ex} size={44} />
              <View style={{ flex: 1 }}>
                <T v="h3" numberOfLines={1}>
                  {ex?.nome ?? p.exerciseId}
                </T>
                <T v="small">
                  Máx. {fmtKg(p.pesoMax)} · {formatShortDate(p.data)}
                </T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T v="tiny">1RM est.</T>
                <T v="h3">{fmtKg(Math.round(p.e1rm))}</T>
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

function Corpo() {
  const bw = useStore((s) => s.bodyWeights);
  const remove = useStore((s) => s.removeBodyWeight);
  const profile = useStore((s) => s.profile);
  const last = bw[bw.length - 1];
  const first = bw[0];
  const diff = last && first ? last.pesoKg - first.pesoKg : 0;
  const imc = last && profile ? last.pesoKg / (profile.alturaCm / 100) ** 2 : undefined;

  return (
    <>
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
        <Stat label="Atual" value={fmtKg(last?.pesoKg)} />
        <Stat label="Variação" value={`${diff > 0 ? '+' : ''}${diff.toFixed(1).replace('.', ',')} kg`} />
        <Stat label="IMC" value={imc ? imc.toFixed(1).replace('.', ',') : '—'} />
      </View>
      <SectionHeader title="Evolução do peso" />
      <Card>
        <LineChart data={bw.slice(-20).map((b) => ({ label: formatShortDate(fromKey(b.data).toISOString()), value: b.pesoKg }))} unit="kg" />
      </Card>
      <SectionHeader title="Registros" />
      <T v="small" style={{ marginBottom: space.sm }}>
        Registre o peso na tela Hoje. Toque e segure um registro para apagar.
      </T>
      <View style={{ gap: 6 }}>
        {[...bw].reverse().map((b) => (
          <Pressable
            key={b.data}
            onLongPress={() =>
              showDialog('Apagar registro?', `${formatShortDate(fromKey(b.data).toISOString())}: ${fmtKg(b.pesoKg)}`, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Apagar', style: 'destructive', onPress: () => remove(b.data) },
              ])
            }
          >
            <Card style={{ flexDirection: 'row', justifyContent: 'space-between', padding: space.md }}>
              <T>{b.data === dateKey() ? 'Hoje' : formatShortDate(fromKey(b.data).toISOString())}</T>
              <T v="h3">{fmtKg(b.pesoKg)}</T>
            </Card>
          </Pressable>
        ))}
      </View>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, padding: space.md, gap: 2 }}>
      <T v="tiny">{label}</T>
      <T v="h3">{value}</T>
    </Card>
  );
}
