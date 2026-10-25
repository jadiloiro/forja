import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { showDialog } from '../../components/Dialog';
import { ExerciseThumb } from '../../components/ExerciseMedia';
import { Badge, Button, Card, Empty, IconButton, Screen, SectionHeader, T } from '../../components/ui';
import { formatDateTime, formatDuration } from '../../lib/date';
import { e1rm, personalRecords, workingSets } from '../../lib/progression';
import { SessionExercise } from '../../lib/trainingTypes';
import { useExercise, useStore } from '../../store/useStore';
import { colors, space } from '../../theme';

export default function HistoricoDetalhe() {
  const { id, novo } = useLocalSearchParams<{ id: string; novo?: string }>();
  const history = useStore((s) => s.history);
  const del = useStore((s) => s.deleteRecord);
  const rec = history.find((h) => h.id === id);

  const prs = useMemo(() => {
    if (!rec) return new Set<string>();
    const idx = history.findIndex((h) => h.id === rec.id);
    const before = personalRecords(history.slice(idx + 1));
    const out = new Set<string>();
    for (const e of rec.exercicios) {
      const best = Math.max(0, ...workingSets(e).map((s) => (s.peso != null && s.reps ? e1rm(s.peso, s.reps) : 0)));
      const prev = before[e.exerciseId]?.e1rm ?? 0;
      if (best > 0 && best > prev + 0.01 && before[e.exerciseId]) out.add(e.exerciseId);
    }
    return out;
  }, [history, rec]);

  if (!rec) {
    return (
      <Screen edges={[]}>
        <Empty icon="alert-circle-outline" title="Treino não encontrado" />
      </Screen>
    );
  }

  const sets = rec.exercicios.reduce((a, e) => a + workingSets(e).length, 0);
  const dur = new Date(rec.fim).getTime() - new Date(rec.inicio).getTime();

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen
        options={{
          headerLeft: novo ? () => <IconButton icon="close" label="Fechar" onPress={() => router.dismissTo('/(tabs)')} /> : undefined,
          headerRight: () => (
            <IconButton
              icon="trash-outline"
              color={colors.danger}
              label="Excluir registro"
              onPress={() =>
                showDialog('Excluir este treino do histórico?', undefined, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => {
                      del(rec.id);
                      router.back();
                    },
                  },
                ])
              }
            />
          ),
        }}
      />
      {novo ? (
        <View style={{ alignItems: 'center', gap: space.sm, marginBottom: space.lg }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="trophy" size={30} color={colors.accent} />
          </View>
          <T v="h1">Treino concluído!</T>
          {prs.size > 0 && <T style={{ color: colors.success }}>{prs.size} novo{prs.size > 1 ? 's' : ''} recorde{prs.size > 1 ? 's' : ''} pessoal{prs.size > 1 ? 'is' : ''} 🔥</T>}
        </View>
      ) : null}

      <T v="h2">{rec.nome}</T>
      <T v="small">{formatDateTime(rec.inicio)}</T>

      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
        <Stat label="Duração" value={formatDuration(dur)} />
        <Stat label="Séries" value={String(sets)} />
        <Stat label="Volume" value={`${rec.volumeKg.toLocaleString('pt-BR')} kg`} />
      </View>

      {rec.nota ? (
        <Card style={{ marginTop: space.md }}>
          <T v="small">“{rec.nota}”</T>
        </Card>
      ) : null}

      <SectionHeader title="Exercícios" />
      <View style={{ gap: space.sm }}>
        {rec.exercicios.map((e) => (
          <ExerciseSummary key={e.uid} item={e} pr={prs.has(e.exerciseId)} />
        ))}
      </View>

      {novo ? <Button title="Concluir" style={{ marginTop: space.xl }} onPress={() => router.dismissTo('/(tabs)')} /> : null}
    </Screen>
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

function ExerciseSummary({ item, pr }: { item: SessionExercise; pr: boolean }) {
  const ex = useExercise(item.exerciseId);
  return (
    <Card style={{ padding: space.md }} onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: item.exerciseId } })}>
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <ExerciseThumb exercise={ex} size={44} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <T v="h3" numberOfLines={1} style={{ flexShrink: 1 }}>
              {ex?.nome ?? 'Exercício'}
            </T>
            {pr && <Badge label="RECORDE" color={colors.success} soft={colors.successSoft} />}
          </View>
          <T v="small">
            {item.sets.map((s) => `${s.peso ?? 0}×${s.reps ?? 0}${s.tipo !== 'normal' ? ` (${s.tipo[0].toUpperCase()})` : ''}`).join('  ·  ')}
          </T>
        </View>
      </View>
    </Card>
  );
}
