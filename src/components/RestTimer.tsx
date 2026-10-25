import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOut } from 'react-native-reanimated';

import { formatClock } from '../lib/date';
import { setRestTimerOnScreen } from '../lib/restNotifications';
import { useStore } from '../store/useStore';
import { colors, family, radius, space } from '../theme';
import { ProgressBar } from './ui';

export function RestTimer() {
  const ate = useStore((s) => s.session?.descansoAte);
  const total = useStore((s) => s.session?.descansoTotal ?? 0);
  const vibrar = useStore((s) => s.settings.vibrarDescanso);
  const adjust = useStore((s) => s.adjustRest);
  const clear = useStore((s) => s.clearRest);
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef<number | undefined>(undefined);

  useEffect(() => {
    setRestTimerOnScreen(true);
    return () => setRestTimerOnScreen(false);
  }, []);

  useEffect(() => {
    if (!ate) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [ate]);

  const remaining = ate ? (ate - now) / 1000 : 0;

  useEffect(() => {
    if (ate && remaining <= 0 && fired.current !== ate) {
      fired.current = ate;
      if (vibrar) {
        Vibration.vibrate([0, 350, 150, 350]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      const t = setTimeout(clear, 2500);
      return () => clearTimeout(t);
    }
  }, [ate, remaining, vibrar, clear]);

  if (!ate) return null;
  const done = remaining <= 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(260).easing(Easing.bezier(0.23, 1, 0.32, 1))}
      exiting={FadeOut.duration(160)}
      style={[styles.bar, done && { borderColor: colors.success }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{done ? 'Descanso concluído — bora!' : 'Descanso'}</Text>
          <Text style={[styles.clock, done && { color: colors.success }]}>{done ? '0:00' : formatClock(remaining)}</Text>
        </View>
        <Pressable style={styles.btn} onPress={() => adjust(-15)} hitSlop={6}>
          <Text style={styles.btnText}>−15</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => adjust(15)} hitSlop={6}>
          <Text style={styles.btnText}>+15</Text>
        </Pressable>
        <Pressable style={[styles.btn, { backgroundColor: colors.accent }]} onPress={clear} hitSlop={6}>
          <Text style={[styles.btnText, { color: colors.accentText }]}>Pular</Text>
        </Pressable>
      </View>
      <View style={{ marginTop: space.sm }}>
        <ProgressBar value={total > 0 ? 1 - Math.max(0, remaining) / total : 1} color={done ? colors.success : colors.accent} animated={false} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    bottom: space.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  label: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  clock: { color: colors.text, fontSize: 36, lineHeight: 40, fontFamily: family.display, fontVariant: ['tabular-nums'] },
  btn: { height: 40, minWidth: 48, paddingHorizontal: 10, borderRadius: radius.md, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.text, fontWeight: '700' },
});
