import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { showDialog } from '../../components/Dialog';
import { Ring } from '../../components/charts';
import { MacroBars, WaterCard } from '../../components/nutrition';
import { Button, Card, IconButton, Screen, T, tap } from '../../components/ui';
import { addDays, dateKey, formatDayLabel } from '../../lib/date';
import { dayTotals, macrosFor, sumMacros } from '../../lib/nutrition';
import { FoodEntry, MEALS } from '../../lib/nutritionTypes';
import { useStore } from '../../store/useStore';
import { colors, family, radius, space } from '../../theme';

export default function Nutricao() {
  const [date, setDate] = useState(dateKey());
  const log = useStore((s) => s.nutrition[date]);
  const prevLog = useStore((s) => s.nutrition[addDays(date, -1)]);
  const targets = useStore((s) => s.targets);
  const copyMeal = useStore((s) => s.copyMeal);
  const removeEntry = useStore((s) => s.removeFoodEntry);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const totals = dayTotals(log);

  if (!targets) return null;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T v="display">Nutrição</T>
        <IconButton icon="options-outline" label="Metas" onPress={() => router.push('/metas')} />
      </View>

      <View style={styles.dateNav}>
        <IconButton icon="chevron-back" label="Dia anterior" onPress={() => setDate(addDays(date, -1))} />
        <Pressable onPress={() => setDate(dateKey())} style={{ flex: 1, alignItems: 'center' }}>
          <T v="h3" style={{ textTransform: 'capitalize' }}>
            {formatDayLabel(date)}
          </T>
        </Pressable>
        <IconButton icon="chevron-forward" label="Próximo dia" onPress={() => setDate(addDays(date, 1))} />
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
        <Ring value={totals.kcal / targets.kcal} size={120} stroke={12}>
          <T v="h1">{Math.round(totals.kcal)}</T>
          <T v="small" style={{ fontSize: 11 }}>
            de {targets.kcal} kcal
          </T>
        </Ring>
        <MacroBars totals={totals} targets={targets} />
      </Card>

      <View style={{ gap: space.md, marginTop: space.lg }}>
        {MEALS.map((m) => {
          const entries = log?.entries.filter((e) => e.refeicao === m.key) ?? [];
          const mt = sumMacros(entries.map((e) => macrosFor(e.snapshot, e.gramas)));
          const canCopy = !entries.length && (prevLog?.entries.some((e) => e.refeicao === m.key) ?? false);
          return (
            <Card key={m.key} style={{ padding: space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <T v="h3">{m.nome}</T>
                  <T v="small">
                    {Math.round(mt.kcal)} kcal · P {Math.round(mt.p)} · C {Math.round(mt.c)} · G {Math.round(mt.g)}
                  </T>
                </View>
                <IconButton
                  icon="add-circle"
                  color={colors.accent}
                  size={28}
                  label={`Adicionar em ${m.nome}`}
                  onPress={() => router.push({ pathname: '/alimento', params: { meal: m.key, date } })}
                />
              </View>
              {entries.map((e) => (
                <Pressable
                  key={e.id}
                  onPress={() => {
                    tap();
                    setEditing(e);
                  }}
                  onLongPress={() =>
                    showDialog('Remover alimento?', e.snapshot.nome, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Remover', style: 'destructive', onPress: () => removeEntry(date, e.id) },
                    ])
                  }
                  style={styles.entry}
                >
                  <View style={{ flex: 1 }}>
                    <T numberOfLines={1} style={{ fontSize: 14 }}>
                      {e.snapshot.nome}
                    </T>
                    <T v="small" style={{ fontSize: 12 }}>
                      {e.gramas} g
                    </T>
                  </View>
                  <T v="small" style={{ color: colors.text }}>
                    {Math.round(macrosFor(e.snapshot, e.gramas).kcal)} kcal
                  </T>
                </Pressable>
              ))}
              {canCopy && (
                <Pressable onPress={() => copyMeal(addDays(date, -1), date, m.key)} style={{ marginTop: space.sm }}>
                  <T v="small" style={{ color: colors.accent, fontWeight: '600' }}>
                    Repetir de ontem
                  </T>
                </Pressable>
              )}
            </Card>
          );
        })}
      </View>

      <WaterCard date={date} style={{ marginTop: space.md }} />

      <T v="small" style={{ marginTop: space.md, textAlign: 'center', fontSize: 12 }}>
        Toque num alimento para ajustar a quantidade · segure para remover
      </T>

      <EditEntryModal entry={editing} date={date} onClose={() => setEditing(null)} />
    </Screen>
  );
}


function EditEntryModal({ entry, date, onClose }: { entry: FoodEntry | null; date: string; onClose: () => void }) {
  const update = useStore((s) => s.updateFoodEntry);
  const remove = useStore((s) => s.removeFoodEntry);
  const [g, setG] = useState('');
  const grams = Number(g.replace(',', '.'));
  const m = entry ? macrosFor(entry.snapshot, grams || 0) : undefined;
  return (
    <Modal visible={!!entry} transparent animationType="fade" onRequestClose={onClose} onShow={() => setG(String(entry?.gramas ?? ''))}>
      <View style={styles.modalBg}>
        <View style={styles.modal}>
          <T v="h2">{entry?.snapshot.nome}</T>
          <TextInput
            value={g}
            onChangeText={setG}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
            style={styles.gramInput}
            placeholderTextColor={colors.textMute}
          />
          <T v="small" style={{ textAlign: 'center' }}>
            gramas · {Math.round(m?.kcal ?? 0)} kcal · P {Math.round(m?.p ?? 0)} · C {Math.round(m?.c ?? 0)} · G {Math.round(m?.g ?? 0)}
          </T>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
            <Button
              title="Remover"
              variant="danger"
              onPress={() => {
                if (entry) remove(date, entry.id);
                onClose();
              }}
            />
            <Button
              title="Salvar"
              style={{ flex: 1 }}
              disabled={!(grams > 0)}
              onPress={() => {
                if (entry) update(date, entry.id, Math.round(grams));
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
  dateNav: { flexDirection: 'row', alignItems: 'center', marginVertical: space.md },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
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
});
