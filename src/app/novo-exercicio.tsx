import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Chip, Field, Screen, T } from '../components/ui';
import { ALL_GROUPS, EQUIP_LABEL, Equipment, Exercise, GROUP_LABEL, MuscleGroup } from '../data/types';
import { uid } from '../lib/id';
import { useExercise, useStore } from '../store/useStore';
import { colors, space } from '../theme';

export default function NovoExercicio() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useExercise(id);
  const save = useStore((s) => s.saveCustomExercise);

  const [nome, setNome] = useState(existing?.nome ?? '');
  const [grupo, setGrupo] = useState<MuscleGroup>(existing?.grupo ?? 'peito');
  const [sec, setSec] = useState<MuscleGroup[]>(existing?.secundarios ?? []);
  const [equip, setEquip] = useState<Equipment>(existing?.equipamento ?? 'maquina');
  const [tipo, setTipo] = useState<Exercise['tipo']>(existing?.tipo ?? 'isolado');
  const [porTempo, setPorTempo] = useState(!!existing?.porTempo);
  const [passos, setPassos] = useState((existing?.passos ?? []).join('\n'));
  const [dicas, setDicas] = useState((existing?.dicas ?? []).join('\n'));

  const lines = (s: string) =>
    s
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);

  const submit = () => {
    save({
      id: existing?.id ?? `custom_${uid()}`,
      nome: nome.trim(),
      grupo,
      secundarios: sec.filter((g) => g !== grupo),
      equipamento: equip,
      tipo,
      nivel: 1,
      porTempo,
      passos: lines(passos),
      dicas: lines(dicas),
      custom: true,
    });
    router.back();
  };

  return (
    <Screen edges={['bottom']}>
      <View style={{ gap: space.lg }}>
        <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Remada no Smith" />

        <View style={{ gap: space.sm }}>
          <T v="tiny">Músculo principal</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {ALL_GROUPS.map((g) => (
              <Chip key={g} label={GROUP_LABEL[g]} selected={grupo === g} onPress={() => setGrupo(g)} />
            ))}
          </View>
        </View>

        <View style={{ gap: space.sm }}>
          <T v="tiny">Músculos secundários</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {ALL_GROUPS.filter((g) => g !== grupo).map((g) => (
              <Chip
                key={g}
                label={GROUP_LABEL[g]}
                selected={sec.includes(g)}
                onPress={() => setSec((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]))}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: space.sm }}>
          <T v="tiny">Equipamento</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {(Object.keys(EQUIP_LABEL) as Equipment[]).map((k) => (
              <Chip key={k} label={EQUIP_LABEL[k]} selected={equip === k} onPress={() => setEquip(k)} />
            ))}
          </View>
        </View>

        <View style={{ gap: space.sm }}>
          <T v="tiny">Tipo</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            <Chip label="Multiarticular" selected={tipo === 'composto'} onPress={() => setTipo('composto')} />
            <Chip label="Isolado" selected={tipo === 'isolado'} onPress={() => setTipo('isolado')} />
            <Chip label="Medido em segundos" icon="timer-outline" selected={porTempo} onPress={() => setPorTempo((v) => !v)} />
          </View>
        </View>

        <Field label="Como executar (um passo por linha)" value={passos} onChangeText={setPassos} multiline style={{ minHeight: 100 }} />
        <Field label="Dicas (uma por linha)" value={dicas} onChangeText={setDicas} multiline />

        <T v="small" style={{ color: colors.textMute }}>
          Exercícios personalizados não têm demonstração em imagem.
        </T>
        <Button title={existing ? 'Salvar alterações' : 'Criar exercício'} onPress={submit} disabled={!nome.trim()} />
      </View>
    </Screen>
  );
}
