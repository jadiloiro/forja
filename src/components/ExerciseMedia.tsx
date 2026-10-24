import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EXERCISE_IMAGES } from '../data/exerciseImages';
import { Exercise, GROUP_LABEL } from '../data/types';
import { colors, radius } from '../theme';

/**
 * Demonstração do movimento: alterna as posições inicial e final em loop,
 * com transição suave, como um GIF.
 */
export function ExerciseAnimation({ exercise, height = 240 }: { exercise: Exercise; height?: number }) {
  const frames = exercise.img ? EXERCISE_IMAGES[exercise.img] : undefined;
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<'lento' | 'normal'>('normal');

  useEffect(() => {
    if (!frames || !playing) return;
    const ms = speed === 'lento' ? 1800 : 1000;
    const t = setInterval(() => setFrame((f) => (f + 1) % 2), ms);
    return () => clearInterval(t);
  }, [frames, playing, speed]);

  if (!frames) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Ionicons name="barbell-outline" size={48} color={colors.textMute} />
        <Text style={{ color: colors.textMute, marginTop: 8 }}>{GROUP_LABEL[exercise.grupo]}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <Image source={frames[frame]} style={StyleSheet.absoluteFill} contentFit="cover" transition={350} />
      <View style={styles.overlay}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{frame === 0 ? 'Posição inicial' : 'Posição final'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={styles.ctrl} onPress={() => setSpeed((s) => (s === 'lento' ? 'normal' : 'lento'))} hitSlop={6}>
            <Text style={styles.pillText}>{speed === 'lento' ? '0.5×' : '1×'}</Text>
          </Pressable>
          <Pressable
            style={styles.ctrl}
            onPress={() => setPlaying((p) => !p)}
            accessibilityLabel={playing ? 'Pausar demonstração' : 'Reproduzir demonstração'}
            hitSlop={6}
          >
            <Ionicons name={playing ? 'pause' : 'play'} size={16} color="#fff" />
          </Pressable>
          {!playing && (
            <Pressable style={styles.ctrl} onPress={() => setFrame((f) => (f + 1) % 2)} hitSlop={6} accessibilityLabel="Próximo quadro">
              <Ionicons name="swap-horizontal" size={16} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export function ExerciseThumb({ exercise, size = 52 }: { exercise?: Exercise; size?: number }) {
  const frames = exercise?.img ? EXERCISE_IMAGES[exercise.img] : undefined;
  return (
    <View style={[styles.thumb, { width: size, height: size }]}>
      {frames ? (
        <Image source={frames[1]} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Ionicons name="barbell-outline" size={size * 0.45} color={colors.textMute} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#fff' },
  placeholder: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pill: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  ctrl: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    height: 30,
    minWidth: 30,
    paddingHorizontal: 8,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  thumb: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
