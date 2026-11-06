import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, Vibration, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOut, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { formatClock } from '../lib/date';
import { playRestSound } from '../lib/restAlarm';
import { setRestTimerOnScreen } from '../lib/restNotifications';
import { AVISO_SEG, restSoundOf, shouldAlertNow } from '../lib/restSounds';
import { useStore } from '../store/useStore';
import { colors, family, radius, space } from '../theme';
import { AnimatedPressable, EASE_OUT, tap } from './ui';

/**
 * Anda sozinha na thread nativa, do ponto atual até o fim do descanso: continua lisa mesmo com o JS ocupado.
 * É a informação do tempo restante, não um enfeite, por isso não para com "reduzir animações".
 */
function RestProgress({ ate, total, color }: { ate: number; total: number; color: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    const left = Math.max(0, ate - Date.now());
    progress.set(total > 0 ? Math.max(0, 1 - left / (total * 1000)) : 1);
    progress.set(withTiming(1, { duration: left, easing: Easing.linear, reduceMotion: ReduceMotion.Never }));
  }, [ate, total, progress]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
  return (
    <View style={styles.track}>
      {/* Preenchimento absoluto e sem filhos: animar width aqui não reflui o layout. */}
      <Animated.View style={[styles.fill, { backgroundColor: color }, fill]} />
    </View>
  );
}

function RestButton({ title, onPress, primary }: { title: string; onPress: () => void; primary?: boolean }) {
  return (
    <AnimatedPressable
      scaleTo={0.94}
      style={[styles.btn, primary && { backgroundColor: colors.accentFill }]}
      hitSlop={6}
      onPress={() => {
        tap();
        onPress();
      }}
    >
      <Text style={[styles.btnText, primary && { color: colors.accentText }]}>{title}</Text>
    </AnimatedPressable>
  );
}

export function RestTimer() {
  const ate = useStore((s) => s.session?.descansoAte);
  const total = useStore((s) => s.session?.descansoTotal ?? 0);
  const vibrar = useStore((s) => s.settings.vibrarDescanso);
  const som = useStore((s) => restSoundOf(s.settings));
  const aviso = useStore((s) => s.settings.avisoDezSeg ?? false);
  const adjust = useStore((s) => s.adjustRest);
  const clear = useStore((s) => s.clearRest);
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef<number | undefined>(undefined);
  const warned = useRef<number | undefined>(undefined);

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
    if (!aviso || !ate || warned.current === ate || total <= AVISO_SEG) return;
    if (shouldAlertNow(ate - AVISO_SEG * 1000, Date.now(), AppState.currentState)) {
      warned.current = ate;
      if (som) playRestSound('aviso');
    }
  }, [ate, now, aviso, som, total]);

  useEffect(() => {
    if (ate && remaining <= 0 && fired.current !== ate) {
      fired.current = ate;
      if (shouldAlertNow(ate, Date.now(), AppState.currentState)) {
        if (som) playRestSound(som);
        if (vibrar) {
          Vibration.vibrate([0, 350, 150, 350]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      }
      const t = setTimeout(clear, 2500);
      return () => clearTimeout(t);
    }
  }, [ate, remaining, vibrar, som, clear]);

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
          <Animated.Text
            style={[
              styles.clock,
              { color: done ? colors.success : colors.text, transitionProperty: 'color', transitionDuration: 200, transitionTimingFunction: EASE_OUT },
            ]}
          >
            {done ? '0:00' : formatClock(remaining)}
          </Animated.Text>
        </View>
        <RestButton title="−15" onPress={() => adjust(-15)} />
        <RestButton title="+15" onPress={() => adjust(15)} />
        <RestButton title="Pular" onPress={clear} primary />
      </View>
      <View style={{ marginTop: space.sm }}>
        <RestProgress ate={ate} total={total} color={done ? colors.success : colors.accent} />
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
  track: { height: 6, borderRadius: 6, backgroundColor: colors.surface3, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 6 },
  label: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  clock: { fontSize: 36, lineHeight: 40, fontFamily: family.display, fontVariant: ['tabular-nums'] },
  btn: { height: 40, minWidth: 48, paddingHorizontal: 10, borderRadius: radius.md, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.text, fontWeight: '700' },
});
