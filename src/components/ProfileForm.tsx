import { View } from 'react-native';

import { ALL_GROUPS, GROUP_LABEL, MuscleGroup } from '../data/types';
import { ATIVIDADE_LABEL, Atividade, NIVEL_LABEL, Nivel, OBJETIVO_LABEL, Objetivo, Profile } from '../lib/trainingTypes';
import { space } from '../theme';
import { Chip, Field, OptionList, T } from './ui';

export type ProfileDraft = Omit<Profile, 'idade' | 'alturaCm' | 'pesoKg'> & { idade: string; alturaCm: string; pesoKg: string };

export function toDraft(p?: Profile): ProfileDraft {
  return {
    nome: p?.nome ?? '',
    sexo: p?.sexo ?? 'M',
    idade: p ? String(p.idade) : '',
    alturaCm: p ? String(p.alturaCm) : '',
    pesoKg: p ? String(p.pesoKg).replace('.', ',') : '',
    nivel: p?.nivel ?? 'iniciante',
    objetivo: p?.objetivo ?? 'hipertrofia',
    diasSemana: p?.diasSemana ?? 4,
    duracaoMin: p?.duracaoMin ?? 60,
    atividade: p?.atividade ?? 'leve',
    prioridades: p?.prioridades ?? [],
  };
}

const parse = (s: string) => Number(s.replace(',', '.'));

export function draftErrors(d: ProfileDraft): string | undefined {
  const idade = parse(d.idade);
  const altura = parse(d.alturaCm);
  const peso = parse(d.pesoKg);
  if (!(idade >= 14 && idade <= 90)) return 'Informe uma idade entre 14 e 90 anos.';
  if (!(altura >= 120 && altura <= 230)) return 'Informe a altura em centímetros (ex.: 175).';
  if (!(peso >= 35 && peso <= 250)) return 'Informe o peso em kg (ex.: 78,5).';
  return undefined;
}

export function fromDraft(d: ProfileDraft): Profile {
  return {
    ...d,
    nome: d.nome.trim(),
    idade: Math.round(parse(d.idade)),
    alturaCm: Math.round(parse(d.alturaCm)),
    pesoKg: Math.round(parse(d.pesoKg) * 10) / 10,
  };
}

type Set = (patch: Partial<ProfileDraft>) => void;

export function BasicsStep({ d, set }: { d: ProfileDraft; set: Set }) {
  return (
    <View style={{ gap: space.lg }}>
      <Field label="Como quer ser chamado?" value={d.nome} onChangeText={(nome) => set({ nome })} placeholder="Seu nome" />
      <View style={{ gap: 6 }}>
        <T v="tiny">Sexo biológico (para o cálculo calórico)</T>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Chip label="Masculino" selected={d.sexo === 'M'} onPress={() => set({ sexo: 'M' })} />
          <Chip label="Feminino" selected={d.sexo === 'F'} onPress={() => set({ sexo: 'F' })} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Field style={{ flex: 1 }} label="Idade" keyboardType="number-pad" value={d.idade} onChangeText={(idade) => set({ idade })} suffix="anos" />
        <Field style={{ flex: 1 }} label="Altura" keyboardType="number-pad" value={d.alturaCm} onChangeText={(alturaCm) => set({ alturaCm })} suffix="cm" />
      </View>
      <Field label="Peso atual" keyboardType="decimal-pad" value={d.pesoKg} onChangeText={(pesoKg) => set({ pesoKg })} suffix="kg" />
    </View>
  );
}

export function GoalStep({ d, set }: { d: ProfileDraft; set: Set }) {
  return (
    <OptionList<Objetivo>
      value={d.objetivo}
      onChange={(objetivo) => set({ objetivo })}
      options={[
        { key: 'hipertrofia', label: OBJETIVO_LABEL.hipertrofia, hint: 'Volume moderado-alto, 6–15 repetições, leve superávit calórico.' },
        { key: 'forca', label: OBJETIVO_LABEL.forca, hint: 'Cargas altas nos básicos, 3–6 repetições, descansos longos.' },
        { key: 'emagrecimento', label: OBJETIVO_LABEL.emagrecimento, hint: 'Mantém a força com déficit calórico e proteína alta.' },
        { key: 'manutencao', label: OBJETIVO_LABEL.manutencao, hint: 'Treino eficiente e calorias de manutenção.' },
      ]}
    />
  );
}

export function LevelStep({ d, set }: { d: ProfileDraft; set: Set }) {
  return (
    <OptionList<Nivel>
      value={d.nivel}
      onChange={(nivel) => set({ nivel })}
      options={(Object.keys(NIVEL_LABEL) as Nivel[]).map((k) => ({
        key: k,
        label: NIVEL_LABEL[k],
        hint:
          k === 'iniciante'
            ? 'Exercícios mais fáceis de aprender e máquinas.'
            : k === 'intermediario'
              ? 'Inclui básicos com barra livre e mais volume.'
              : 'Todos os exercícios, divisões com mais volume.',
      }))}
    />
  );
}

export function ScheduleStep({ d, set }: { d: ProfileDraft; set: Set }) {
  return (
    <View style={{ gap: space.xl }}>
      <View style={{ gap: space.sm }}>
        <T v="tiny">Dias de treino por semana</T>
        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          {[2, 3, 4, 5, 6].map((n) => (
            <Chip key={n} label={`${n} dias`} selected={d.diasSemana === n} onPress={() => set({ diasSemana: n })} />
          ))}
        </View>
      </View>
      <View style={{ gap: space.sm }}>
        <T v="tiny">Tempo por treino</T>
        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          {[40, 50, 60, 75, 90].map((n) => (
            <Chip key={n} label={`${n} min`} selected={d.duracaoMin === n} onPress={() => set({ duracaoMin: n })} />
          ))}
        </View>
        <T v="small">Define quantos exercícios entram em cada treino.</T>
      </View>
    </View>
  );
}

export function ActivityStep({ d, set }: { d: ProfileDraft; set: Set }) {
  return (
    <OptionList<Atividade>
      value={d.atividade}
      onChange={(atividade) => set({ atividade })}
      options={(Object.keys(ATIVIDADE_LABEL) as Atividade[]).map((k) => ({ key: k, label: ATIVIDADE_LABEL[k] }))}
    />
  );
}

export function PriorityStep({ d, set }: { d: ProfileDraft; set: Set }) {
  const toggle = (g: MuscleGroup) =>
    set({ prioridades: d.prioridades.includes(g) ? d.prioridades.filter((x) => x !== g) : [...d.prioridades, g] });
  return (
    <View style={{ gap: space.md }}>
      <T v="small">Opcional. Músculos marcados ganham uma série extra em cada exercício.</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {ALL_GROUPS.map((g) => (
          <Chip key={g} label={GROUP_LABEL[g]} selected={d.prioridades.includes(g)} onPress={() => toggle(g)} />
        ))}
      </View>
    </View>
  );
}
