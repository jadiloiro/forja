import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { showDialog } from '../components/Dialog';
import { MacroBars } from '../components/nutrition';
import { Button, Card, Empty, Screen, T, tap } from '../components/ui';
import { dateKey, formatDayLabel } from '../lib/date';
import {
  generateMealPlan,
  MealPlan,
  PlanInput,
  PlanItem,
  planEntries,
  planOnTarget,
  planTotals,
  portionHint,
  removeItem,
  setItemGrams,
  swapItem,
  swapOptions,
} from '../lib/mealPlanner';
import { macrosFor, usesGlp1 } from '../lib/nutrition';
import { useStore } from '../store/useStore';
import { colors, family, radius, space } from '../theme';

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

export default function Cardapio() {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? dateKey();
  const targets = useStore((s) => s.targets);
  const profile = useStore((s) => s.profile);
  const hasEntries = useStore((s) => (s.nutrition[date]?.entries.length ?? 0) > 0);
  const apply = useStore((s) => s.applyMealPlan);

  const glp1 = !!profile && usesGlp1(profile);
  const excluidos = profile?.alimentosExcluidos;
  const input = useMemo<PlanInput | undefined>(() => (targets ? { targets, glp1, excluidos } : undefined), [targets, glp1, excluidos]);

  const [plan, setPlan] = useState<MealPlan>(() => (input ? generateMealPlan(input, newSeed()) : []));
  const [editing, setEditing] = useState<PlanItem | null>(null);

  if (!targets || !input) {
    return (
      <Screen edges={['bottom']}>
        <Empty icon="restaurant-outline" title="Sem metas de nutrição" text="Preencha o perfil para calcular suas metas." />
      </Screen>
    );
  }

  const totals = planTotals(plan);
  const onTarget = planOnTarget(totals, targets);

  const finish = (replace: boolean) => {
    apply(date, planEntries(plan), replace);
    router.back();
  };

  const onApply = () => {
    if (!hasEntries) return finish(false);
    showDialog('Este dia já tem registros', 'Quer somar o cardápio ao que já foi registrado ou substituir tudo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Somar', onPress: () => finish(false) },
      { text: 'Substituir', style: 'destructive', onPress: () => finish(true) },
    ]);
  };

  return (
    <Screen edges={['bottom']}>
      <Card style={{ gap: space.md }}>
        <View>
          <T v="tiny">Sugestão para {formatDayLabel(date)}</T>
          <T v="h1">
            {Math.round(totals.kcal)} <T v="small">de {targets.kcal} kcal</T>
          </T>
        </View>
        <MacroBars totals={totals} targets={targets} />
        {(!onTarget.kcal || !onTarget.p) && (
          <T v="small" style={{ color: colors.warn }}>
            {!onTarget.kcal && !onTarget.p ? 'Calorias e proteína estão' : !onTarget.kcal ? 'As calorias estão' : 'A proteína está'} a mais de 5% da meta. Ajuste as quantidades ou gere outro cardápio.
          </T>
        )}
      </Card>

      {glp1 && (
        <T v="small" style={{ marginTop: space.md }}>
          Refeições menores e mais frequentes, com proteína em todas e opções de fácil digestão. Alinhe a alimentação com o médico ou nutricionista que acompanha o seu tratamento.
        </T>
      )}

      <View style={{ gap: space.md, marginTop: space.lg }}>
        {plan.map((m) => {
          const mt = planTotals([m]);
          return (
            <Card key={m.refeicao} style={{ padding: space.md }}>
              <T v="h3">{m.nome}</T>
              <T v="small">
                {Math.round(mt.kcal)} kcal · P {Math.round(mt.p)} · C {Math.round(mt.c)} · G {Math.round(mt.g)}
              </T>
              {m.itens.map((i) => {
                const hint = portionHint(i.food, i.gramas);
                return (
                  <Pressable
                    key={i.key}
                    onPress={() => {
                      tap();
                      setEditing(i);
                    }}
                    style={styles.item}
                    accessibilityLabel={`Editar ${i.food.nome}`}
                  >
                    <View style={{ flex: 1 }}>
                      <T numberOfLines={2} style={{ fontSize: 14 }}>
                        {i.food.nome}
                      </T>
                      <T v="small" style={{ fontSize: 12 }}>
                        {i.gramas} g{hint ? ` ${hint}` : ''}
                      </T>
                    </View>
                    <T v="small" style={{ color: colors.text }}>
                      {Math.round(macrosFor(i.food, i.gramas).kcal)} kcal
                    </T>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMute} />
                  </Pressable>
                );
              })}
            </Card>
          );
        })}
      </View>

      <View style={{ gap: space.sm, marginTop: space.lg }}>
        <Button title="Aplicar ao diário" icon="checkmark" disabled={!plan.length} onPress={onApply} />
        <Button title="Gerar outro cardápio" icon="refresh" variant="secondary" onPress={() => setPlan(generateMealPlan(input, newSeed()))} />
      </View>

      <T v="small" style={{ marginTop: space.lg, fontSize: 11, color: colors.textMute, textAlign: 'center' }}>
        Toque em um alimento para trocar ou ajustar. Esta é uma sugestão automática baseada nas suas metas e na Tabela TACO, e não substitui a orientação de um nutricionista. A lista de alimentos que você não come é só um filtro por nome: em caso de alergia, confira sempre os ingredientes.
      </T>

      <ItemModal
        item={editing}
        options={editing ? swapOptions(plan, editing.key, { excluidos }) : []}
        onClose={() => setEditing(null)}
        onSave={(g) => editing && setPlan(setItemGrams(plan, editing.key, g))}
        onSwap={(foodId) => editing && setPlan(swapItem(plan, editing.key, foodId))}
        onRemove={() => editing && setPlan(removeItem(plan, editing.key))}
      />
    </Screen>
  );
}

function ItemModal({
  item,
  options,
  onClose,
  onSave,
  onSwap,
  onRemove,
}: {
  item: PlanItem | null;
  options: { id: string; nome: string }[];
  onClose: () => void;
  onSave: (g: number) => void;
  onSwap: (foodId: string) => void;
  onRemove: () => void;
}) {
  const [g, setG] = useState('');
  const grams = Number(g.replace(',', '.'));
  const m = item ? macrosFor(item.food, grams || 0) : undefined;
  return (
    <Modal visible={!!item} transparent animationType="fade" onRequestClose={onClose} onShow={() => setG(String(item?.gramas ?? ''))}>
      <View style={styles.modalBg}>
        <View style={styles.modal}>
          <T v="h2">{item?.food.nome}</T>
          <TextInput value={g} onChangeText={setG} keyboardType="decimal-pad" selectTextOnFocus style={styles.gramInput} placeholderTextColor={colors.textMute} />
          <T v="small" style={{ textAlign: 'center' }}>
            gramas · {Math.round(m?.kcal ?? 0)} kcal · P {Math.round(m?.p ?? 0)} · C {Math.round(m?.c ?? 0)} · G {Math.round(m?.g ?? 0)}
          </T>
          {options.length > 0 && (
            <View style={{ marginTop: space.md, gap: space.xs }}>
              <T v="tiny">Trocar por equivalente</T>
              <ScrollView style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                {options.map((f) => (
                  <Pressable
                    key={f.id}
                    onPress={() => {
                      tap();
                      onSwap(f.id);
                      onClose();
                    }}
                    style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.surface2 }]}
                  >
                    <T style={{ flex: 1, fontSize: 14 }} numberOfLines={2}>
                      {f.nome}
                    </T>
                    <Ionicons name="swap-horizontal" size={16} color={colors.textDim} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
            <Button
              title="Remover"
              variant="danger"
              onPress={() => {
                onRemove();
                onClose();
              }}
            />
            <Button title="Voltar" variant="secondary" onPress={onClose} />
            <Button
              title="Salvar"
              style={{ flex: 1 }}
              disabled={!(grams > 0)}
              onPress={() => {
                onSave(grams);
                onClose();
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 48,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: 6,
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: space.lg },
  modal: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.xl, gap: space.sm },
  gramInput: {
    color: colors.text,
    fontSize: 44,
    fontFamily: family.display,
    textAlign: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingVertical: space.md,
    marginTop: space.sm,
  },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44, paddingVertical: space.sm, paddingHorizontal: space.xs, borderRadius: radius.sm },
});
