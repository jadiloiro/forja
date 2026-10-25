import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

import { showDialog } from '../../components/Dialog';
import { ExerciseThumb } from '../../components/ExerciseMedia';
import { Badge, Button, Card, Empty, IconButton, Screen, SectionHeader, T } from '../../components/ui';
import { formatDateTime, formatDuration } from '../../lib/date';
import { e1rm, fmtKg, personalRecords, round, workingSets } from '../../lib/progression';
import { SessionExercise } from '../../lib/trainingTypes';
import { useExercise, useStore } from '../../store/useStore';
import { colors, space } from '../../theme';

export default function HistoricoDetalhe() {
  const { id, novo } = useLocalSearchParams<{ id: string; novo?: string }>();
  const history = useStore((s) => s.history);
  const del = useStore((s) => s.deleteRecord);
  const rec = history.find((h) => h.id === id);

  const prs = useMemo(() => {
    const out = new Map<string, NewPR>();
    if (!rec) return out;
    const idx = history.findIndex((h) => h.id === rec.id);
    const before = personalRecords(history.slice(idx + 1));
    for (const e of rec.exercicios) {
      let top: NewPR | undefined;
      for (const s of workingSets(e)) {
        if (s.peso == null || !s.reps) continue;
        const est = e1rm(s.peso, s.reps);
        if (!top || est > top.e1rm) top = { exerciseId: e.exerciseId, peso: s.peso, reps: s.reps, e1rm: est, ganho: 0 };
      }
      const prev = before[e.exerciseId]?.e1rm;
      // Primeira vez no exercício não conta como recorde: não há com o que comparar.
      if (top && prev != null && top.e1rm > prev + 0.01) out.set(e.exerciseId, { ...top, ganho: top.e1rm - prev });
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
        <Animated.View entering={FadeInDown.duration(400).easing(EASE_OUT_FN)} style={{ alignItems: 'center', gap: space.sm, marginBottom: space.lg }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="trophy" size={30} color={colors.accent} />
          </View>
          <T v="display">Treino concluído!</T>
          {prs.size > 0 && (
            <T style={{ color: colors.success }}>
              {prs.size} novo{prs.size > 1 ? 's' : ''} recorde{prs.size > 1 ? 's' : ''} pessoa{prs.size > 1 ? 'is' : 'l'}
            </T>
          )}
        </Animated.View>
      ) : null}

      {novo && prs.size > 0 ? (
        <Card style={{ marginBottom: space.lg, borderColor: colors.success, gap: space.md }}>
          {[...prs.values()].map((pr, i) => (
            <Animated.View key={pr.exerciseId} entering={FadeInDown.delay(250 + i * 90).duration(350).easing(EASE_OUT_FN)}>
              <PRRow pr={pr} />
            </Animated.View>
          ))}
        </Card>
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

interface NewPR {
  exerciseId: string;
  peso: number;
  reps: number;
  e1rm: number;
  /** Quanto o 1RM estimado subiu em relação ao recorde anterior. */
  ganho: number;
}

const EASE_OUT_FN = Easing.bezier(0.23, 1, 0.32, 1);

function PRRow({ pr }: { pr: NewPR }) {
  const ex = useExercise(pr.exerciseId);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <Ionicons name="trending-up" size={20} color={colors.success} />
      <View style={{ flex: 1 }}>
        <T v="h3" numberOfLines={1}>
          {ex?.nome ?? 'Exercício'}
        </T>
        <T v="small">
          {fmtKg(pr.peso)} × {pr.reps} · 1RM est. {fmtKg(round(pr.e1rm, 0.5))}
        </T>
      </View>
      <T v="h2" style={{ color: colors.success }}>
        +{fmtKg(round(pr.ganho, 0.5))}
      </T>
    </View>
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
