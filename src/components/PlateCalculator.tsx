import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { defaultBar, loadBar, PLATES } from '../lib/plates';
import { fmtKg } from '../lib/progression';
import { useStore } from '../store/useStore';
import { colors, radius, space } from '../theme';
import { Button, Chip, Stepper, T } from './ui';

const BARS = [20, 15, 10];
const PLATE_MAX_H = 84;

export function PlateCalculator({
  visible,
  initialKg,
  equipamento,
  onClose,
  onApply,
}: {
  visible: boolean;
  initialKg: number;
  equipamento?: string;
  onClose: () => void;
  onApply?: (kg: number) => void;
}) {
  const pesoBarraKg = useStore((s) => s.settings.pesoBarraKg);
  const [bar, setBar] = useState(20);
  const [kg, setKg] = useState(initialKg);
  const load = loadBar(kg, bar);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => {
        const b = defaultBar(equipamento, pesoBarraKg);
        setBar(b);
        setKg(Math.max(initialKg, b));
      }}
    >
      <Pressable style={styles.bg} onPress={onClose}>
        <Pressable style={styles.box} onPress={() => {}}>
          <T v="h2">Montar a barra</T>

          <Stepper label="Peso total" value={kg} step={2.5} min={bar} max={500} suffix="kg" onChange={setKg} />

          <View style={{ gap: 6 }}>
            <T v="tiny">Barra</T>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {BARS.map((b) => (
                <Chip key={b} label={`${b} kg`} selected={bar === b} onPress={() => { setBar(b); setKg((k) => Math.max(k, b)); }} />
              ))}
            </View>
          </View>

          <View style={styles.stage} accessibilityLabel={`Cada lado: ${load.perSide.join(' + ') || 'sem anilhas'}`}>
            <View style={styles.collar} />
            {load.perSide.map((p, i) => {
              const plate = PLATES.find((x) => x.kg === p)!;
              return (
                <View
                  key={i}
                  style={[styles.plate, { height: PLATE_MAX_H * plate.h, backgroundColor: plate.color, width: p >= 10 ? 16 : 11 }]}
                />
              );
            })}
            <View style={styles.sleeve} />
          </View>

          <T v="h3" style={{ textAlign: 'center' }}>
            {load.perSide.length ? `Cada lado: ${load.perSide.map((p) => String(p).replace('.', ',')).join(' + ')}` : 'Só a barra'}
          </T>
          {load.sobra > 0 ? (
            <T v="small" style={{ textAlign: 'center', color: colors.warn }}>
              Não fecha exato: dá para montar {fmtKg(load.total)}.
            </T>
          ) : null}

          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
            <Button title="Fechar" variant="secondary" style={{ flex: 1 }} onPress={onClose} />
            {onApply ? (
              <Button
                title="Usar nas séries"
                style={{ flex: 1.4 }}
                onPress={() => {
                  onApply(load.total);
                  onClose();
                }}
              />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: space.lg },
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.xl,
    gap: space.md,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  stage: {
    height: PLATE_MAX_H + 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
  },
  collar: { width: 10, height: 30, borderRadius: 3, backgroundColor: colors.textMute },
  plate: { borderRadius: 4 },
  sleeve: { width: 36, height: 12, borderRadius: 3, backgroundColor: colors.textMute },
});
