import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, ChipRow, Field, IconButton, T, tap } from '../components/ui';
import { FOODS } from '../data/foods';
import { macrosFor, searchFoods } from '../lib/nutrition';
import { Food, MealKey, MEALS } from '../lib/nutritionTypes';
import { useStore } from '../store/useStore';
import { colors, radius, space } from '../theme';

export default function Alimento() {
  const params = useLocalSearchParams<{ meal: MealKey; date: string }>();
  const customFoods = useStore((s) => s.customFoods);
  const recentIds = useStore((s) => s.recentFoodIds);
  const addFood = useStore((s) => s.addFood);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Food | null>(null);
  const [meal, setMeal] = useState<MealKey>(params.meal ?? 'almoco');

  const all = useMemo(() => [...customFoods, ...FOODS], [customFoods]);
  const byId = useMemo(() => new Map(all.map((f) => [f.id, f])), [all]);

  const results = useMemo(() => {
    if (q.trim().length >= 2) return searchFoods(all, q);
    const recents = recentIds.map((id) => byId.get(id)).filter((f): f is Food => !!f);
    const rest = customFoods.filter((f) => !recentIds.includes(f.id));
    return [...recents, ...rest];
  }, [q, all, byId, recentIds, customFoods]);

  if (picked) {
    return (
      <QuantityPanel
        food={picked}
        meal={meal}
        setMeal={setMeal}
        onBack={() => setPicked(null)}
        onAdd={(gramas) => {
          addFood(params.date, {
            foodId: picked.id,
            gramas,
            refeicao: meal,
            snapshot: { nome: picked.nome, kcal: picked.kcal, p: picked.p, c: picked.c, g: picked.g },
          });
          router.back();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <FlatList
        data={results}
        keyExtractor={(f) => f.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space.lg, gap: 6 }}
        ListHeaderComponent={
          <View style={{ gap: space.md, marginBottom: space.sm }}>
            <Field placeholder="Buscar alimento (ex.: arroz cozido, frango grelhado)" value={q} onChangeText={setQ} autoFocus autoCorrect={false} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T v="tiny">{q.trim().length >= 2 ? `${results.length} resultados` : results.length ? 'Recentes e personalizados' : 'Digite para buscar'}</T>
              <Pressable onPress={() => router.push('/novo-alimento')} hitSlop={8}>
                <T v="small" style={{ color: colors.accent, fontWeight: '700' }}>
                  + Criar alimento
                </T>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          q.trim().length >= 2 ? (
            <T v="small">Nada encontrado. Tente outro termo ou crie um alimento personalizado (ex.: a partir do rótulo).</T>
          ) : (
            <T v="small">A base tem cerca de 600 alimentos da Tabela TACO, além de suplementos comuns. Os valores são por 100 g.</T>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              tap();
              setPicked(item);
            }}
            style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.surface2 }]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <T style={{ fontSize: 14 }} numberOfLines={2}>
                {item.nome}
              </T>
              <T v="small" style={{ fontSize: 12 }}>
                100 g · P {item.p} · C {item.c} · G {item.g}
                {item.custom ? ' · personalizado' : ''}
              </T>
            </View>
            <T v="h3">{Math.round(item.kcal)}</T>
            <T v="small" style={{ fontSize: 11 }}>
              kcal
            </T>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

function QuantityPanel({
  food,
  meal,
  setMeal,
  onBack,
  onAdd,
}: {
  food: Food;
  meal: MealKey;
  setMeal: (m: MealKey) => void;
  onBack: () => void;
  onAdd: (g: number) => void;
}) {
  const [g, setG] = useState(String(food.porcoes?.[0]?.g ?? 100));
  const grams = Number(g.replace(',', '.')) || 0;
  const m = macrosFor(food, grams);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ padding: space.lg, gap: space.lg, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <IconButton icon="chevron-back" label="Voltar à busca" onPress={onBack} />
            <T v="h2" style={{ flex: 1 }}>
              {food.nome}
            </T>
          </View>

          <View style={styles.gramsWrap}>
            <TextInput value={g} onChangeText={setG} keyboardType="decimal-pad" selectTextOnFocus style={styles.grams} />
            <T v="h2" style={{ color: colors.textDim }}>
              g
            </T>
          </View>

          <ChipRow>
            {(food.porcoes ?? []).map((p) => (
              <Chip key={p.nome} label={`${p.nome} (${p.g} g)`} selected={grams === p.g} onPress={() => setG(String(p.g))} />
            ))}
            {[50, 100, 150, 200, 250].map((n) => (
              <Chip key={n} label={`${n} g`} selected={grams === n} onPress={() => setG(String(n))} />
            ))}
          </ChipRow>

          <View style={styles.macros}>
            <MacroBox label="kcal" value={m.kcal} color={colors.accent} />
            <MacroBox label="Proteína" value={m.p} color={colors.protein} unit="g" />
            <MacroBox label="Carbo" value={m.c} color={colors.carb} unit="g" />
            <MacroBox label="Gordura" value={m.g} color={colors.fat} unit="g" />
          </View>

          <View style={{ gap: space.sm }}>
            <T v="tiny">Refeição</T>
            <ChipRow>
              {MEALS.map((x) => (
                <Chip key={x.key} label={x.nome} selected={meal === x.key} onPress={() => setMeal(x.key)} />
              ))}
            </ChipRow>
          </View>

          <View style={{ flex: 1 }} />
          <Button title="Adicionar" icon="add" disabled={!(grams > 0)} onPress={() => onAdd(Math.round(grams))} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MacroBox({ label, value, color, unit = '' }: { label: string; value: number; color: string; unit?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <T v="h2" style={{ color }}>
        {value < 10 && unit ? value.toFixed(1).replace('.', ',') : Math.round(value)}
        {unit}
      </T>
      <T v="small" style={{ fontSize: 11 }}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  gramsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
  },
  grams: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
    paddingVertical: space.sm,
    fontVariant: ['tabular-nums'],
  },
  macros: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
