import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button, Card, Field, IconButton, Screen, SectionHeader, T } from '../components/ui';
import { uid } from '../lib/id';
import { useStore } from '../store/useStore';
import { colors, space } from '../theme';

const n = (s: string) => Number(s.replace(',', '.')) || 0;

export default function NovoAlimento() {
  const save = useStore((s) => s.saveCustomFood);
  const customs = useStore((s) => s.customFoods);
  const del = useStore((s) => s.deleteCustomFood);
  const [nome, setNome] = useState('');
  const [porcao, setPorcao] = useState('100');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [g, setG] = useState('');
  const [nomePorcao, setNomePorcao] = useState('');

  const submit = () => {
    const base = n(porcao) || 100;
    const f = 100 / base;
    const r = (x: number) => Math.round(x * f * 10) / 10;
    save({
      id: `c_${uid()}`,
      nome: nome.trim(),
      cat: 'Personalizados',
      kcal: r(n(kcal)),
      p: r(n(p)),
      c: r(n(c)),
      g: r(n(g)),
      f: 0,
      porcoes: nomePorcao.trim() ? [{ nome: nomePorcao.trim(), g: base }] : base !== 100 ? [{ nome: 'Porção do rótulo', g: base }] : undefined,
      custom: true,
    });
    router.back();
  };

  return (
    <Screen edges={['bottom']}>
      <View style={{ gap: space.md }}>
        <T v="small">Copie os valores da tabela nutricional do rótulo. O app converte para 100 g automaticamente.</T>
        <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Iogurte proteico 15 g" />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Field style={{ flex: 1 }} label="Porção do rótulo" value={porcao} onChangeText={setPorcao} keyboardType="decimal-pad" suffix="g" />
          <Field style={{ flex: 1.3 }} label="Nome da porção (opcional)" value={nomePorcao} onChangeText={setNomePorcao} placeholder="1 pote" />
        </View>
        <Field label="Calorias por porção" value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" suffix="kcal" />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Field style={{ flex: 1 }} label="Proteína" value={p} onChangeText={setP} keyboardType="decimal-pad" suffix="g" />
          <Field style={{ flex: 1 }} label="Carbo" value={c} onChangeText={setC} keyboardType="decimal-pad" suffix="g" />
          <Field style={{ flex: 1 }} label="Gordura" value={g} onChangeText={setG} keyboardType="decimal-pad" suffix="g" />
        </View>
        <Button title="Salvar alimento" onPress={submit} disabled={!nome.trim() || !(n(porcao) > 0)} />
      </View>

      {customs.length > 0 && (
        <>
          <SectionHeader title="Seus alimentos" />
          <View style={{ gap: 6 }}>
            {customs.map((f) => (
              <Card key={f.id} style={{ flexDirection: 'row', alignItems: 'center', padding: space.md }}>
                <View style={{ flex: 1 }}>
                  <T style={{ fontSize: 14 }}>{f.nome}</T>
                  <T v="small" style={{ fontSize: 12 }}>
                    100 g · {f.kcal} kcal · P {f.p} · C {f.c} · G {f.g}
                  </T>
                </View>
                <IconButton
                  icon="trash-outline"
                  color={colors.danger}
                  label="Excluir alimento"
                  onPress={() =>
                    Alert.alert('Excluir alimento?', f.nome, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Excluir', style: 'destructive', onPress: () => del(f.id) },
                    ])
                  }
                />
              </Card>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
