import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { showDialog } from '../../../components/Dialog';
import { ExerciseThumb } from '../../../components/ExerciseMedia';
import { Button, Card, Empty, Field, IconButton, Screen, SectionHeader, Stepper, T, tap } from '../../../components/ui';
import { GROUP_LABEL } from '../../../data/types';
import { estimateMinutes, fmtRest, repRange, totalSets } from '../../../lib/planUtils';
import { PlanExercise } from '../../../lib/trainingTypes';
import { useExercise, useStore } from '../../../store/useStore';
import { colors, radius, space } from '../../../theme';

export default function DayEditor() {
  const { planId, dayId } = useLocalSearchParams<{ planId: string; dayId: string }>();
  const plan = useStore((s) => s.plans.find((p) => p.id === planId));
  const day = plan?.dias.find((d) => d.id === dayId);
  const updateDay = useStore((s) => s.updateDay);
  const removeDay = useStore((s) => s.removeDay);
  const duplicateDay = useStore((s) => s.duplicateDay);
  const moveDay = useStore((s) => s.moveDay);
  const session = useStore((s) => s.session);
  const startSession = useStore((s) => s.startSession);
  const [open, setOpen] = useState<string | null>(null);

  if (!plan || !day) {
    return (
      <Screen edges={[]}>
        <Empty icon="alert-circle-outline" title="Treino não encontrado" />
      </Screen>
    );
  }

  const del = () =>
    showDialog('Excluir treino?', `"${day.nome}" será removido do plano.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          removeDay(plan.id, day.id);
          router.back();
        },
      },
    ]);

  const start = () => {
    if (session) {
      showDialog('Treino em andamento', 'Finalize ou descarte o treino aberto antes de iniciar outro.', [
        { text: 'OK', style: 'cancel' },
        { text: 'Abrir treino atual', onPress: () => router.push('/sessao') },
      ]);
      return;
    }
    startSession(plan.id, day.id);
    router.push('/sessao');
  };

  const idx = plan.dias.findIndex((d) => d.id === day.id);

  return (
    <Screen edges={[]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <IconButton icon="copy-outline" label="Duplicar treino" onPress={() => duplicateDay(plan.id, day.id)} />
              <IconButton icon="trash-outline" label="Excluir treino" color={colors.danger} onPress={del} />
            </View>
          ),
        }}
      />
      <View style={{ gap: space.md }}>
        <Field label="Nome do treino" value={day.nome} onChangeText={(nome) => updateDay(plan.id, day.id, { nome })} />
        <Field label="Foco / observação" value={day.foco} placeholder="Ex.: peito e tríceps" onChangeText={(foco) => updateDay(plan.id, day.id, { foco })} />
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <T v="small" style={{ flex: 1 }}>
            {day.exercicios.length} exercícios · {totalSets(day.exercicios)} séries · ~{estimateMinutes(day.exercicios)} min
          </T>
          <IconButton icon="arrow-up" label="Mover treino para cima" onPress={() => moveDay(plan.id, day.id, -1)} color={idx > 0 ? colors.textDim : colors.surface3} />
          <IconButton
            icon="arrow-down"
            label="Mover treino para baixo"
            onPress={() => moveDay(plan.id, day.id, 1)}
            color={idx < plan.dias.length - 1 ? colors.textDim : colors.surface3}
          />
        </View>
      </View>

      <SectionHeader title="Exercícios · toque para editar" />

      {!day.exercicios.length && <Empty icon="add-circle-outline" title="Treino vazio" text="Adicione exercícios da biblioteca." />}

      <View style={{ gap: space.sm }}>
        {day.exercicios.map((e, i) => (
          <PlanExerciseRow
            key={e.uid}
            planId={plan.id}
            dayId={day.id}
            item={e}
            index={i}
            count={day.exercicios.length}
            open={open === e.uid}
            onToggle={() => setOpen(open === e.uid ? null : e.uid)}
          />
        ))}
      </View>

      <View style={{ gap: space.sm, marginTop: space.xl }}>
        <Button
          title="Adicionar exercícios"
          icon="add"
          variant="secondary"
          onPress={() => router.push({ pathname: '/selecionar-exercicio', params: { target: 'plan', mode: 'add', planId: plan.id, dayId: day.id } })}
        />
        <Button title="Iniciar este treino" icon="play" onPress={start} disabled={!day.exercicios.length} />
      </View>
    </Screen>
  );
}

function PlanExerciseRow({
  planId,
  dayId,
  item,
  index,
  count,
  open,
  onToggle,
}: {
  planId: string;
  dayId: string;
  item: PlanExercise;
  index: number;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  const ex = useExercise(item.exerciseId);
  const update = useStore((s) => s.updatePlanExercise);
  const remove = useStore((s) => s.removePlanExercise);
  const moveEx = useStore((s) => s.movePlanExercise);
  const set = (patch: Partial<PlanExercise>) => update(planId, dayId, item.uid, patch);

  return (
    <Card style={{ padding: space.md }}>
      <Pressable
        onPress={() => {
          tap();
          onToggle();
        }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}
      >
        <T v="h3" style={{ width: 18, color: colors.textMute }}>
          {index + 1}
        </T>
        <ExerciseThumb exercise={ex} size={48} />
        <View style={{ flex: 1 }}>
          <T v="h3" numberOfLines={1}>
            {ex?.nome ?? 'Exercício removido'}
          </T>
          <T v="small">
            {item.series} × {repRange(item.repMin, item.repMax, ex?.porTempo)} · descanso {fmtRest(item.descansoSeg)}
          </T>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMute} />
      </Pressable>

      {open && (
        <View style={{ gap: space.md, marginTop: space.md }}>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Stepper label="Séries" value={item.series} min={1} max={10} onChange={(series) => set({ series })} />
            <Stepper label="Descanso" value={item.descansoSeg} step={15} min={0} max={600} suffix="s" onChange={(descansoSeg) => set({ descansoSeg })} />
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Stepper
              label={ex?.porTempo ? 'Tempo mín.' : 'Reps mín.'}
              value={item.repMin}
              step={ex?.porTempo ? 5 : 1}
              min={1}
              max={300}
              onChange={(repMin) => set({ repMin, repMax: Math.max(repMin, item.repMax) })}
            />
            <Stepper
              label={ex?.porTempo ? 'Tempo máx.' : 'Reps máx.'}
              value={item.repMax}
              step={ex?.porTempo ? 5 : 1}
              min={1}
              max={300}
              onChange={(repMax) => set({ repMax, repMin: Math.min(repMax, item.repMin) })}
            />
          </View>
          <TextInput
            placeholder="Notas (ex.: banco no furo 4, pegada fechada…)"
            placeholderTextColor={colors.textMute}
            value={item.notas ?? ''}
            onChangeText={(notas) => set({ notas })}
            multiline
            style={{
              color: colors.text,
              backgroundColor: colors.surface2,
              borderRadius: radius.md,
              padding: space.md,
              minHeight: 44,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
          {ex && (
            <T v="small">
              {GROUP_LABEL[ex.grupo]}
              {ex.secundarios.length ? ` + ${ex.secundarios.map((g) => GROUP_LABEL[g]).join(', ')}` : ''}
            </T>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            <Button small variant="secondary" icon="play-circle-outline" title="Como fazer" onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: item.exerciseId } })} />
            <Button
              small
              variant="secondary"
              icon="swap-horizontal"
              title="Trocar"
              onPress={() =>
                router.push({ pathname: '/selecionar-exercicio', params: { target: 'plan', mode: 'swap', planId, dayId, exUid: item.uid, current: item.exerciseId } })
              }
            />
            <IconButton icon="arrow-up" label="Subir" onPress={() => moveEx(planId, dayId, item.uid, -1)} color={index > 0 ? colors.textDim : colors.surface3} />
            <IconButton icon="arrow-down" label="Descer" onPress={() => moveEx(planId, dayId, item.uid, 1)} color={index < count - 1 ? colors.textDim : colors.surface3} />
            <IconButton icon="trash-outline" label="Remover" color={colors.danger} onPress={() => remove(planId, dayId, item.uid)} />
          </View>
        </View>
      )}
    </Card>
  );
}
