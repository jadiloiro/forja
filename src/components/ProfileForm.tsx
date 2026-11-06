import { View } from 'react-native';

import { ALL_GROUPS, GROUP_LABEL, MuscleGroup } from '../data/types';
import { ProfileDraft } from '../lib/profileDraft';
import {
  APETITE_LABEL,
  Apetite,
  ATIVIDADE_LABEL,
  Atividade,
  Medicamento,
  MEDICAMENTO_ATALHO_LABEL,
  MedicamentoAtalho,
  NIVEL_LABEL,
  Nivel,
  OBJETIVO_LABEL,
  Objetivo,
  REGIAO_LABEL,
  RegiaoCorporal,
  RITMO_LABEL,
  Ritmo,
} from '../lib/trainingTypes';
import { space } from '../theme';
import { Card, Chip, Field, IconButton, OptionList, T } from './ui';

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

/** Chips de escolha única, que desmarcam ao tocar de novo: o campo é opcional. */
function OptionalChoice<K extends string>({ label, labels, value, onChange }: { label: string; labels: Record<K, string>; value?: K; onChange: (k?: K) => void }) {
  return (
    <View style={{ gap: space.sm }}>
      <T v="tiny">{label}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {(Object.keys(labels) as K[]).map((k) => (
          <Chip key={k} label={labels[k]} selected={value === k} onPress={() => onChange(value === k ? undefined : k)} />
        ))}
      </View>
    </View>
  );
}

export function TargetStep({ d, set }: { d: ProfileDraft; set: Set }) {
  return (
    <View style={{ gap: space.lg }}>
      <T v="small">Opcional. Deixe em branco o que não souber.</T>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Field style={{ flex: 1 }} label="Meta de peso" keyboardType="decimal-pad" value={d.pesoMetaKg} onChangeText={(pesoMetaKg) => set({ pesoMetaKg })} suffix="kg" />
        <Field style={{ flex: 1 }} label="Prazo desejado" keyboardType="number-pad" value={d.prazoSemanas} onChangeText={(prazoSemanas) => set({ prazoSemanas })} suffix="semanas" />
      </View>
      <OptionalChoice<Ritmo> label="Ritmo para chegar lá" labels={RITMO_LABEL} value={d.ritmo} onChange={(ritmo) => set({ ritmo })} />
    </View>
  );
}

export function HealthStep({ d, set }: { d: ProfileDraft; set: Set }) {
  const update = (i: number, patch: Partial<Medicamento>) => set({ medicamentos: d.medicamentos.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
  const remove = (i: number) => set({ medicamentos: d.medicamentos.filter((_, j) => j !== i) });
  const toggleAtalho = (atalho: MedicamentoAtalho) => {
    const i = d.medicamentos.findIndex((m) => m.atalho === atalho);
    if (i >= 0) remove(i);
    else set({ medicamentos: [...d.medicamentos, { nome: MEDICAMENTO_ATALHO_LABEL[atalho], atalho }] });
  };
  return (
    <View style={{ gap: space.lg }}>
      <T v="small">Opcional. Fica salvo só neste aparelho e também vai no arquivo de backup.</T>
      <View style={{ gap: space.sm }}>
        <T v="tiny">Medicamentos em uso</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {(Object.keys(MEDICAMENTO_ATALHO_LABEL) as MedicamentoAtalho[]).map((k) => (
            <Chip key={k} label={MEDICAMENTO_ATALHO_LABEL[k]} selected={d.medicamentos.some((m) => m.atalho === k)} onPress={() => toggleAtalho(k)} />
          ))}
          <Chip label="Outro" icon="add" onPress={() => set({ medicamentos: [...d.medicamentos, { nome: '' }] })} />
        </View>
      </View>
      {d.medicamentos.map((m, i) => (
        <Card key={i} style={{ gap: space.md, padding: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm }}>
            <Field style={{ flex: 1 }} label="Nome" value={m.nome} onChangeText={(nome) => update(i, { nome })} />
            <IconButton icon="close" label="Remover medicamento" onPress={() => remove(i)} style={{ marginBottom: 6 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Field style={{ flex: 1 }} label="Dose" value={m.dose ?? ''} onChangeText={(dose) => update(i, { dose })} />
            <Field style={{ flex: 1 }} label="Frequência" value={m.frequencia ?? ''} onChangeText={(frequencia) => update(i, { frequencia })} />
          </View>
        </Card>
      ))}
      <Field label="Condições de saúde relevantes" value={d.condicoes} onChangeText={(condicoes) => set({ condicoes })} multiline placeholder="Ex.: hipertensão, diabetes" />
    </View>
  );
}

export function BodyStep({ d, set }: { d: ProfileDraft; set: Set }) {
  const toggle = (r: RegiaoCorporal) => set({ lesoes: d.lesoes.includes(r) ? d.lesoes.filter((x) => x !== r) : [...d.lesoes, r] });
  return (
    <View style={{ gap: space.xl }}>
      <View style={{ gap: space.sm }}>
        <T v="tiny">Lesões ou limitações</T>
        <T v="small">Opcional. O plano gerado evita exercícios que costumam sobrecarregar as regiões marcadas. Isso não substitui a orientação de um profissional.</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {(Object.keys(REGIAO_LABEL) as RegiaoCorporal[]).map((r) => (
            <Chip key={r} label={REGIAO_LABEL[r]} selected={d.lesoes.includes(r)} onPress={() => toggle(r)} />
          ))}
        </View>
      </View>
      <Field label="Horas de sono por noite" keyboardType="decimal-pad" value={d.sonoHoras} onChangeText={(sonoHoras) => set({ sonoHoras })} suffix="horas" />
      <OptionalChoice<Apetite> label="Fome e apetite no dia a dia" labels={APETITE_LABEL} value={d.apetite} onChange={(apetite) => set({ apetite })} />
    </View>
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
