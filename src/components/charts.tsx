import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors, font } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function Ring({
  value,
  size = 120,
  stroke = 12,
  color = colors.accent,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const over = value > 1.05;
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withTiming(pct, { duration: 600, easing: Easing.bezier(0.23, 1, 0.32, 1), reduceMotion: ReduceMotion.System }));
  }, [pct, progress]);
  const arc = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - progress.get()) }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surface3} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={over ? colors.danger : color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          animatedProps={arc}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export interface Point {
  label: string;
  value: number;
}

function useWidth() {
  const [w, setW] = useState(0);
  return [w, (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)] as const;
}

function niceRange(values: number[]): [number, number] {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.15;
  return [Math.max(0, min - pad), max + pad];
}

export function LineChart({
  data,
  height = 170,
  color = colors.accent,
  unit = '',
}: {
  data: Point[];
  height?: number;
  color?: string;
  unit?: string;
}) {
  const [w, onLayout] = useWidth();
  if (data.length < 2) {
    return (
      <View style={{ height: 80, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={font.small}>Registre pelo menos 2 vezes para ver o gráfico.</Text>
      </View>
    );
  }
  const padL = 40;
  const padB = 22;
  const padT = 10;
  const [lo, hi] = niceRange(data.map((d) => d.value));
  const innerW = Math.max(1, w - padL - 8);
  const innerH = height - padB - padT;
  const x = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const y = (v: number) => padT + innerH - ((v - lo) / (hi - lo)) * innerH;
  const d = data.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const ticks = [lo, (lo + hi) / 2, hi];
  const labelEvery = Math.ceil(data.length / 5);
  return (
    <View onLayout={onLayout} style={{ height }}>
      {w > 0 && (
        <Svg width={w} height={height}>
          {ticks.map((t, i) => (
            <Line key={i} x1={padL} x2={w - 8} y1={y(t)} y2={y(t)} stroke={colors.border} strokeWidth={1} strokeDasharray="3 4" />
          ))}
          {ticks.map((t, i) => (
            <SvgText key={`t${i}`} x={padL - 6} y={y(t) + 4} fontSize={10} fill={colors.textMute} textAnchor="end">
              {t >= 100 ? Math.round(t) : t.toFixed(1)}
            </SvgText>
          ))}
          <Path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {data.map((p, i) => (
            <Circle key={i} cx={x(i)} cy={y(p.value)} r={i === data.length - 1 ? 4.5 : 3} fill={i === data.length - 1 ? color : colors.surface} stroke={color} strokeWidth={2} />
          ))}
          {data.map((p, i) =>
            i % labelEvery === 0 || i === data.length - 1 ? (
              <SvgText key={`l${i}`} x={x(i)} y={height - 6} fontSize={10} fill={colors.textMute} textAnchor="middle">
                {p.label}
              </SvgText>
            ) : null,
          )}
        </Svg>
      )}
      <Text style={{ position: 'absolute', right: 8, top: 0, color: colors.textMute, fontSize: 10 }}>{unit}</Text>
    </View>
  );
}

export function BarChart({ data, height = 150, color = colors.accent }: { data: Point[]; height?: number; color?: string }) {
  const [w, onLayout] = useWidth();
  const max = Math.max(1, ...data.map((d) => d.value));
  const padB = 22;
  const gap = 8;
  const bw = data.length ? (w - gap * (data.length - 1)) / data.length : 0;
  return (
    <View onLayout={onLayout} style={{ height }}>
      {w > 0 && (
        <Svg width={w} height={height}>
          {data.map((p, i) => {
            const h = ((height - padB - 14) * p.value) / max;
            const bx = i * (bw + gap);
            return (
              <Rect
                key={i}
                x={bx}
                y={height - padB - h}
                width={bw}
                height={Math.max(h, 2)}
                rx={4}
                fill={i === data.length - 1 ? color : colors.surface3}
              />
            );
          })}
          {data.map((p, i) => (
            <SvgText key={`l${i}`} x={i * (bw + gap) + bw / 2} y={height - 6} fontSize={10} fill={colors.textMute} textAnchor="middle">
              {p.label}
            </SvgText>
          ))}
          {data.map((p, i) =>
            p.value > 0 ? (
              <SvgText
                key={`v${i}`}
                x={i * (bw + gap) + bw / 2}
                y={height - padB - ((height - padB - 14) * p.value) / max - 4}
                fontSize={10}
                fill={colors.textDim}
                textAnchor="middle"
              >
                {p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}k` : Math.round(p.value)}
              </SvgText>
            ) : null,
          )}
        </Svg>
      )}
    </View>
  );
}
