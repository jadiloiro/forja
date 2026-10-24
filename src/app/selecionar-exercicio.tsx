import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseBrowser } from '../components/ExerciseBrowser';
import { Button, T } from '../components/ui';
import { alternativesFor } from '../lib/generator';
import { useAllExercises, useExercise, useStore } from '../store/useStore';
import { colors, space } from '../theme';

type Params = {
  target: 'plan' | 'session';
  mode: 'add' | 'swap';
  planId?: string;
  dayId?: string;
  exUid?: string;
  current?: string;
};

export default function SelecionarExercicio() {
  const p = useLocalSearchParams<Params>();
  const all = useAllExercises();
  const current = useExercise(p.current);
  const addPlanExercise = useStore((s) => s.addPlanExercise);
  const replacePlanExercise = useStore((s) => s.replacePlanExercise);
  const addSessionExercise = useStore((s) => s.addSessionExercise);
  const replaceSessionExercise = useStore((s) => s.replaceSessionExercise);
  const [selected, setSelected] = useState<string[]>([]);

  const { mode, current: currentId } = p;
  const recommended = useMemo(
    () => (mode === 'swap' && currentId ? alternativesFor(currentId, all).slice(0, 15) : undefined),
    [mode, currentId, all],
  );

  const confirmAdd = () => {
    for (const id of selected) {
      if (p.target === 'plan' && p.planId && p.dayId) addPlanExercise(p.planId, p.dayId, id);
      else if (p.target === 'session') addSessionExercise(id);
    }
    router.back();
  };

  if (p.mode === 'swap') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
        <ExerciseBrowser
          recommended={recommended}
          header={current ? <T v="small">Trocando: <T v="h3">{current.nome}</T></T> : undefined}
          onPress={(e) => {
            if (p.target === 'plan' && p.planId && p.dayId && p.exUid) replacePlanExercise(p.planId, p.dayId, p.exUid, e.id);
            else if (p.target === 'session' && p.exUid) replaceSessionExercise(p.exUid, e.id);
            router.back();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ExerciseBrowser
        selected={selected}
        footerSpace={100}
        onPress={(e) => setSelected((s) => (s.includes(e.id) ? s.filter((x) => x !== e.id) : [...s, e.id]))}
      />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.lg, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
        <SafeAreaView edges={['bottom']}>
          <Button
            title={selected.length ? `Adicionar ${selected.length} exercício${selected.length > 1 ? 's' : ''}` : 'Selecione exercícios'}
            disabled={!selected.length}
            onPress={confirmAdd}
          />
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}
