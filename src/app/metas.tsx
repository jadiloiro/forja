import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Field, Screen, SectionHeader, T } from '../components/ui';
import { computeTargets } from '../lib/nutrition';
import { OBJETIVO_LABEL } from '../lib/trainingTypes';
import { useStore } from '../store/useStore';
import { colors, space } from '../theme';

const n = (s: string) => Math.round(Number(s.replace(',', '.')) || 0);

export default function Metas() {
  const targets = useStore((s) => s.targets)!;
  const profile = useStore((s) => s.profile)!;
  const setTargets = useStore((s) => s.setTargets);
  const resetAuto = useStore((s) => s.resetTargetsAuto);
  const auto = computeTargets(profile);

  const [p, setP] = useState(String(targets.p));
  const [c, setC] = useState(String(targets.c));
  const [g, setG] = useState(String(targets.g));
  const [agua, setAgua] = useState(String(targets.aguaMl));
  const kcal = n(p) * 4 + n(c) * 4 + n(g) * 9;

  return (
    <Screen edges={['bottom']}>
      <Card style={{ gap: 4 }}>
        <T v="tiny">{targets.manual ? 'Metas manuais' : 'Metas automáticas'}</T>
        <T v="small">
          Objetivo: {OBJETIVO_LABEL[profile.objetivo]} · {profile.pesoKg} kg
        </T>
        <T v="small">
          Gasto estimado {auto.gasto} kcal/dia → sugestão de {auto.kcal} kcal com P {auto.p} g ({(auto.p / profile.pesoKg).toFixed(1)} g/kg), C {auto.c} g,
          G {auto.g} g.
        </T>
        <T v="small" style={{ color: colors.textMute, marginTop: 4 }}>
          As metas automáticas se ajustam sozinhas quando você registra um novo peso.
        </T>
      </Card>

      <SectionHeader title="Ajustar manualmente" />
      <View style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Field style={{ flex: 1 }} label="Proteína" value={p} onChangeText={setP} keyboardType="number-pad" suffix="g" />
          <Field style={{ flex: 1 }} label="Carbo" value={c} onChangeText={setC} keyboardType="number-pad" suffix="g" />
          <Field style={{ flex: 1 }} label="Gordura" value={g} onChangeText={setG} keyboardType="number-pad" suffix="g" />
        </View>
        <Card style={{ alignItems: 'center' }}>
          <T v="tiny">Calorias resultantes</T>
          <T v="display">{kcal}</T>
          <T v="small">kcal/dia</T>
        </Card>
        <Field label="Água" value={agua} onChangeText={setAgua} keyboardType="number-pad" suffix="ml" />
        <Button
          title="Salvar metas"
          onPress={() => {
            setTargets({ kcal, p: n(p), c: n(c), g: n(g), aguaMl: n(agua) });
            router.back();
          }}
        />
        {targets.manual && (
          <Button
            title="Voltar para metas automáticas"
            variant="secondary"
            onPress={() => {
              resetAuto();
              router.back();
            }}
          />
        )}
      </View>
    </Screen>
  );
}
