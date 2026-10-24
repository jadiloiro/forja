import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { ALL_GROUPS, EQUIP_LABEL, Equipment, Exercise, GROUP_LABEL, MuscleGroup } from '../data/types';
import { normalize } from '../lib/nutrition';
import { useAllExercises } from '../store/useStore';
import { colors, space } from '../theme';
import { ExerciseThumb } from './ExerciseMedia';
import { Chip, ChipRow, Field, T, tap } from './ui';

export function ExerciseBrowser({
  onPress,
  selected,
  header,
  recommended,
  footerSpace = 24,
}: {
  onPress: (e: Exercise) => void;
  selected?: string[];
  header?: ReactNode;
  recommended?: Exercise[];
  footerSpace?: number;
}) {
  const all = useAllExercises();
  const [q, setQ] = useState('');
  const [grupo, setGrupo] = useState<MuscleGroup | null>(null);
  const [equip, setEquip] = useState<Equipment | null>(null);

  const list = useMemo(() => {
    const nq = normalize(q.trim());
    const base = !nq && !grupo && !equip && recommended?.length ? recommended : all;
    return base
      .filter((e) => (!grupo || e.grupo === grupo) && (!equip || e.equipamento === equip))
      .filter((e) => !nq || normalize(e.nome).includes(nq) || normalize(GROUP_LABEL[e.grupo]).includes(nq))
      .sort((a, b) => (base === recommended ? 0 : a.grupo.localeCompare(b.grupo) || a.nome.localeCompare(b.nome)));
  }, [all, q, grupo, equip, recommended]);

  const showingRecommended = !q.trim() && !grupo && !equip && !!recommended?.length;

  return (
    <FlatList
      data={list}
      keyExtractor={(e) => e.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: space.lg, paddingBottom: footerSpace, gap: space.sm }}
      ListHeaderComponent={
        <View style={{ gap: space.md, marginBottom: space.sm }}>
          {header}
          <Field placeholder="Buscar exercício…" value={q} onChangeText={setQ} autoCorrect={false} />
          <ChipRow>
            <Chip label="Todos" selected={!grupo} onPress={() => setGrupo(null)} />
            {ALL_GROUPS.map((g) => (
              <Chip key={g} label={GROUP_LABEL[g]} selected={grupo === g} onPress={() => setGrupo(grupo === g ? null : g)} />
            ))}
          </ChipRow>
          <ChipRow>
            {(Object.keys(EQUIP_LABEL) as Equipment[]).map((k) => (
              <Chip key={k} label={EQUIP_LABEL[k]} selected={equip === k} onPress={() => setEquip(equip === k ? null : k)} />
            ))}
          </ChipRow>
          <T v="tiny">{showingRecommended ? 'Alternativas recomendadas' : `${list.length} exercícios`}</T>
        </View>
      }
      ListEmptyComponent={<T v="small">Nenhum exercício encontrado.</T>}
      renderItem={({ item }) => {
        const on = selected?.includes(item.id);
        return (
          <Pressable
            onPress={() => {
              tap();
              onPress(item);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              padding: space.sm,
              borderRadius: 14,
              backgroundColor: on ? colors.accentSoft : pressed ? colors.surface2 : colors.surface,
              borderWidth: 1,
              borderColor: on ? colors.accent : colors.border,
            })}
          >
            <ExerciseThumb exercise={item} size={56} />
            <View style={{ flex: 1, gap: 2 }}>
              <T v="h3" numberOfLines={1}>
                {item.nome}
              </T>
              <T v="small" numberOfLines={1}>
                {GROUP_LABEL[item.grupo]} · {EQUIP_LABEL[item.equipamento]}
                {item.custom ? ' · personalizado' : ''}
              </T>
            </View>
            {selected ? (
              <Ionicons name={on ? 'checkmark-circle' : 'add-circle-outline'} size={24} color={on ? colors.accent : colors.textMute} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textMute} />
            )}
          </Pressable>
        );
      }}
    />
  );
}
