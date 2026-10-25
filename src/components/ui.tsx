import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ComponentProps, ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, font, radius, space } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// Curva de saída forte: começa rápido, que é quando o usuário está olhando.
export const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function tap() {
  Haptics.selectionAsync().catch(() => {});
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['top'],
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ('top' | 'bottom')[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const inner = padded ? { padding: space.lg, paddingBottom: 48 } : undefined;
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={[inner, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function T({
  v = 'body',
  style,
  children,
  numberOfLines,
}: {
  v?: keyof typeof font;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
}) {
  return (
    <Text style={[font[v] as TextStyle, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  small,
}: {
  title: string;
  onPress: () => void;
  variant?: BtnVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const bg = { primary: colors.accent, secondary: colors.surface3, ghost: 'transparent', danger: colors.dangerSoft }[variant];
  const fg = { primary: colors.accentText, secondary: colors.text, ghost: colors.accent, danger: colors.danger }[variant];
  const [pressed, setPressed] = useState(false);
  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[
        styles.btn,
        small && styles.btnSmall,
        {
          backgroundColor: bg,
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: 120,
          transitionTimingFunction: EASE_OUT,
        },
        variant === 'ghost' && { paddingHorizontal: space.sm },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 16 : 18} color={fg} />}
          <Text style={[styles.btnText, small && { fontSize: 14 }, { color: fg }]}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.textDim,
  size = 22,
  style,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: colors.surface3 }, style]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[styles.chip, selected && styles.chipOn, style]}
    >
      {icon && <Ionicons name={icon} size={14} color={selected ? colors.accent : colors.textDim} />}
      <Text style={[styles.chipText, selected && { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm, paddingVertical: 2 }}>
      {children}
    </ScrollView>
  );
}

export function OptionList<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string; hint?: string }[];
  value: K;
  onChange: (k: K) => void;
}) {
  return (
    <View style={{ gap: space.sm }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => {
              tap();
              onChange(o.key);
            }}
            style={[styles.option, on && styles.optionOn]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[font.h3, on && { color: colors.accent }]}>{o.label}</Text>
              {o.hint ? <Text style={[font.small, { marginTop: 2 }]}>{o.hint}</Text> : null}
            </View>
            <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? colors.accent : colors.textMute} />
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, suffix, style, ...props }: TextInputProps & { label?: string; suffix?: string }) {
  return (
    <View style={[{ gap: 6 }, style as StyleProp<ViewStyle>]}>
      {label ? <Text style={font.tiny}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        <TextInput placeholderTextColor={colors.textMute} selectionColor={colors.accent} style={styles.input} {...props} />
        {suffix ? <Text style={[font.small, { marginRight: space.md }]}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  label,
  suffix,
}: {
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
  label?: string;
  suffix?: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 100) / 100));
  return (
    <View style={{ gap: 6, flex: 1 }}>
      {label ? <Text style={font.tiny}>{label}</Text> : null}
      <View style={styles.stepper}>
        <IconButton icon="remove" size={18} onPress={() => onChange(clamp(value - step))} label="Diminuir" />
        <Text style={[font.h3, font.num, { flex: 1, textAlign: 'center' }]}>
          {value}
          {suffix ? <Text style={font.small}> {suffix}</Text> : null}
        </Text>
        <IconButton icon="add" size={18} onPress={() => onChange(clamp(value + step))} label="Aumentar" />
      </View>
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={font.tiny}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[font.small, { color: colors.accent, fontWeight: '600' }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ProgressBar({ value, color = colors.accent, height = 6, animated = true }: { value: number; color?: string; height?: number; animated?: boolean }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.surface3, overflow: 'hidden' }}>
      {/* Preenchimento absoluto e sem filhos: animar width aqui não reflui o layout. */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${pct * 100}%`,
          backgroundColor: value > 1.05 ? colors.danger : color,
          borderRadius: height,
          transitionProperty: ['width', 'backgroundColor'],
          transitionDuration: animated ? 350 : 0,
          transitionTimingFunction: EASE_OUT,
        }}
      />
    </View>
  );
}

export function Empty({ icon, title, text, children }: { icon: IconName; title: string; text?: string; children?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.accent} />
      </View>
      <Text style={[font.h2, { textAlign: 'center' }]}>{title}</Text>
      {text ? <Text style={[font.small, { textAlign: 'center', maxWidth: 300 }]}>{text}</Text> : null}
      {children}
    </View>
  );
}

export function Badge({ label, color = colors.accent, soft }: { label: string; color?: string; soft?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: soft ?? colors.surface3 }]}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: space.md }} />;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
  },
  btnSmall: { minHeight: 38, paddingHorizontal: space.md, borderRadius: radius.sm },
  btnText: { fontSize: 16, fontWeight: '700' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontSize: 16, paddingHorizontal: space.md, paddingVertical: 12 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 4,
    height: 46,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.xl, marginBottom: space.sm },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.lg },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
