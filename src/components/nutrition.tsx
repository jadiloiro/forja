import { Ionicons } from '@expo/vector-icons';
import { StyleProp, View, ViewStyle } from 'react-native';

import { Macros } from '../lib/nutritionTypes';
import { useStore } from '../store/useStore';
import { colors, space } from '../theme';
import { Button, Card, ProgressBar, T } from './ui';

const litros = (ml: number, casas: number) => (ml / 1000).toFixed(casas).replace('.', ',');

export function MacroBars({ totals, targets }: { totals: Pick<Macros, 'p' | 'c' | 'g'>; targets: Pick<Macros, 'p' | 'c' | 'g'> }) {
  return (
    <View style={{ flex: 1, gap: space.sm }}>
      <MacroBar label="Proteína" v={totals.p} t={targets.p} color={colors.protein} />
      <MacroBar label="Carboidrato" v={totals.c} t={targets.c} color={colors.carb} />
      <MacroBar label="Gordura" v={totals.g} t={targets.g} color={colors.fat} />
    </View>
  );
}

function MacroBar({ label, v, t, color }: { label: string; v: number; t: number; color: string }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T v="small" style={{ fontSize: 12 }}>
          {label}
        </T>
        <T v="small" style={{ fontSize: 12, color: colors.text }}>
          {Math.round(v)}/{t} g
        </T>
      </View>
      <ProgressBar value={t ? v / t : 0} color={color} />
    </View>
  );
}

export function WaterCard({ date, style }: { date: string; style?: StyleProp<ViewStyle> }) {
  const ml = useStore((s) => s.nutrition[date]?.aguaMl ?? 0);
  const meta = useStore((s) => s.targets?.aguaMl ?? 0);
  const addWater = useStore((s) => s.addWater);
  return (
    <Card style={[{ gap: space.sm }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Ionicons name="water" size={18} color={colors.water} />
        <T v="h3" style={{ flex: 1 }}>
          Água · {litros(ml, 2)} / {litros(meta, 1)} L
        </T>
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button small variant="secondary" title="−250 ml" style={{ flex: 1 }} disabled={ml <= 0} onPress={() => addWater(date, -250)} />
        <Button small variant="secondary" title="+250 ml" style={{ flex: 1 }} onPress={() => addWater(date, 250)} />
        <Button small variant="secondary" title="+500 ml" style={{ flex: 1 }} onPress={() => addWater(date, 500)} />
      </View>
      <ProgressBar value={meta ? ml / meta : 0} color={colors.water} />
    </Card>
  );
}
