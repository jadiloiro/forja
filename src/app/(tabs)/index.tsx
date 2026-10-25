import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Ring } from '../../components/charts';
import { MacroBars, WaterCard } from '../../components/nutrition';
import { Button, Card, Field, IconButton, Screen, SectionHeader, T } from '../../components/ui';
import { dateKey, weekStart } from '../../lib/date';
import { dayTotals } from '../../lib/nutrition';
import { estimateMinutes, muscleSummary } from '../../lib/planUtils';
import { fmtKg } from '../../lib/progression';
import { useActivePlan, useStore } from '../../store/useStore';
import { colors, space } from '../../theme';

const DIAS_CURTOS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export default function Hoje() {
  const profile = useStore((s) => s.profile)!;
  const plan = useActivePlan();
  const session = useStore((s) => s.session);
  const history = useStore((s) => s.history);
  const startSession = useStore((s) => s.startSession);
  const targets = useStore((s) => s.targets);
  const today = dateKey();
  const log = useStore((s) => s.nutrition[today]);
  const bodyWeights = useStore((s) => s.bodyWeights);
  const logBodyWeight = useStore((s) => s.logBodyWeight);
  const [peso, setPeso] = useState('');

  const next = plan?.dias[plan.proximo] ?? plan?.dias[0];
  const totals = dayTotals(log);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const week = useMemo(() => {
    const start = weekStart(new Date());
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return dateKey(d);
    });
    const trained = new Set(history.map((h) => dateKey(new Date(h.fim))));
    return days.map((k) => ({ key: k, done: trained.has(k), today: k === today }));
  }, [history, today]);
  const doneCount = week.filter((d) => d.done).length;
  const lastWeight = bodyWeights[bodyWeights.length - 1];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <T v="small">{greet}{profile.nome ? `, ${profile.nome}` : ''}</T>
          <T v="display">Hoje</T>
        </View>
        <IconButton icon="settings-outline" label="Perfil e configurações" onPress={() => router.push('/perfil')} />
      </View>

      {session ? (
        <Card style={{ marginTop: space.lg, borderColor: colors.accent, borderWidth: 1, gap: space.sm }}>
          <T v="tiny">Treino em andamento</T>
          <T v="h1">{session.nome}</T>
          <Button title="Continuar treino" icon="play" onPress={() => router.push('/sessao')} />
        </Card>
      ) : next ? (
        <Card style={{ marginTop: space.lg, gap: space.sm }}>
          <T v="tiny">Próximo treino</T>
          <T v="h1">{next.nome}</T>
          <T v="small">{muscleSummary(next) || next.foco}</T>
          <T v="small">
            {next.exercicios.length} exercícios · ~{estimateMinutes(next.exercicios)} min
          </T>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
            <Button
              title="Começar"
              icon="play"
              style={{ flex: 1 }}
              disabled={!next.exercicios.length}
              onPress={() => {
                startSession(plan!.id, next.id);
                router.push('/sessao');
              }}
            />
            <Button
              title="Ver"
              variant="secondary"
              onPress={() => router.push({ pathname: '/dia/[planId]/[dayId]', params: { planId: plan!.id, dayId: next.id } })}
            />
          </View>
        </Card>
      ) : (
        <Card style={{ marginTop: space.lg, gap: space.sm }}>
          <T v="h2">Sem plano ativo</T>
          <Button title="Ir para Treinos" onPress={() => router.push('/(tabs)/treinos')} />
        </Card>
      )}

      <SectionHeader title={`Semana · ${doneCount}/${profile.diasSemana} treinos`} />
      <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {week.map((d, i) => (
          <View key={d.key} style={{ alignItems: 'center', gap: 6 }}>
            <T v="small" style={{ color: d.today ? colors.accent : colors.textMute, fontWeight: '700' }}>
              {DIAS_CURTOS[i]}
            </T>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: d.done ? colors.accent : colors.surface3,
                borderWidth: d.today ? 2 : 0,
                borderColor: colors.accent,
              }}
            >
              {d.done && <Ionicons name="flame" size={16} color={colors.accentText} />}
            </View>
          </View>
        ))}
      </Card>

      {targets && (
        <>
          <SectionHeader title="Nutrição de hoje" action="Abrir diário" onAction={() => router.push('/(tabs)/nutricao')} />
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <Ring value={totals.kcal / targets.kcal} size={110} stroke={11}>
              <T v="h2">{Math.round(Math.max(0, targets.kcal - totals.kcal))}</T>
              <T v="small" style={{ fontSize: 11 }}>
                kcal restantes
              </T>
            </Ring>
                <MacroBars totals={totals} targets={targets} />
          </Card>
          <WaterCard date={today} style={{ marginTop: space.md }} />
        </>
      )}

      <SectionHeader title="Peso corporal" action="Ver evolução" onAction={() => router.push('/(tabs)/progresso')} />
      <Card style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <T v="small">Último registro: {fmtKg(lastWeight?.pesoKg)}</T>
          <Field placeholder="Peso de hoje" keyboardType="decimal-pad" value={peso} onChangeText={setPeso} suffix="kg" style={{ marginTop: 6 }} />
        </View>
        <Button
          title="Salvar"
          disabled={!(Number(peso.replace(',', '.')) > 30)}
          onPress={() => {
            logBodyWeight(today, Math.round(Number(peso.replace(',', '.')) * 10) / 10);
            setPeso('');
          }}
        />
      </Card>
    </Screen>
  );
}

