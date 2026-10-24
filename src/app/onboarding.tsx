import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ActivityStep,
  BasicsStep,
  draftErrors,
  fromDraft,
  GoalStep,
  LevelStep,
  PriorityStep,
  ProfileDraft,
  ScheduleStep,
  toDraft,
} from '../components/ProfileForm';
import { Button, IconButton, ProgressBar, T } from '../components/ui';
import { useStore } from '../store/useStore';
import { colors, space } from '../theme';

const STEPS = [
  { title: 'Vamos montar seu treino', sub: 'Primeiro, alguns dados básicos.', C: BasicsStep },
  { title: 'Qual é o seu objetivo?', sub: 'Isso define séries, repetições e calorias.', C: GoalStep },
  { title: 'Qual sua experiência?', sub: 'Escolhemos exercícios adequados ao seu nível.', C: LevelStep },
  { title: 'Sua rotina de treino', sub: 'Usamos para escolher a divisão ideal.', C: ScheduleStep },
  { title: 'E fora da academia?', sub: 'Seu nível de atividade no dia a dia.', C: ActivityStep },
  { title: 'Alguma prioridade?', sub: 'Músculos que você quer desenvolver mais.', C: PriorityStep },
];

export default function Onboarding() {
  const existing = useStore((s) => s.profile);
  const saveProfile = useStore((s) => s.saveProfile);
  const [d, setD] = useState<ProfileDraft>(toDraft(existing));
  const [step, setStep] = useState(0);
  const [err, setErr] = useState<string>();
  const S = STEPS[step];
  const last = step === STEPS.length - 1;

  const next = () => {
    if (step === 0) {
      const e = draftErrors(d);
      setErr(e);
      if (e) return;
    }
    if (last) {
      saveProfile(fromDraft(d), { regenerate: true });
      router.replace('/(tabs)/treinos');
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 36 }}>
            {step > 0 ? <IconButton icon="chevron-back" onPress={() => setStep((s) => s - 1)} label="Voltar" /> : null}
            <View style={{ flex: 1 }}>
              <ProgressBar value={(step + 1) / STEPS.length} />
            </View>
            <T v="small" style={{ marginLeft: space.sm }}>
              {step + 1}/{STEPS.length}
            </T>
          </View>
          <T v="display">{S.title}</T>
          <T v="small">{S.sub}</T>
        </View>
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <S.C d={d} set={(patch) => setD((x) => ({ ...x, ...patch }))} />
          {err ? <T style={{ color: colors.danger, marginTop: space.md }}>{err}</T> : null}
        </ScrollView>
        <View style={{ padding: space.lg }}>
          <Button title={last ? 'Gerar meu plano' : 'Continuar'} icon={last ? 'flash' : undefined} onPress={next} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
