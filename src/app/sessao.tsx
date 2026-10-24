import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseThumb } from '../components/ExerciseMedia';
import { RestTimer } from '../components/RestTimer';
import { Button, Card, Empty, IconButton, Stepper, T, tap } from '../components/ui';
import { formatDuration } from '../lib/date';
import { fmtRest, repRange } from '../lib/planUtils';
import { fmtKg, LastPerformance, lastPerformance, sessionVolume, suggest } from '../lib/progression';
import { SessionExercise, SET_TIPO_LABEL, SetLog, SetTipo } from '../lib/trainingTypes';
import { useExercise, useStore } from '../store/useStore';
import { colors, radius, space } from '../theme';

function useKeepScreenOn() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    activateKeepAwakeAsync('sessao').catch(() => {});
    return () => {
      deactivateKeepAwake('sessao').catch(() => {});
    };
  }, []);
}

export default function Sessao() {
  useKeepScreenOn();
  const session = useStore((s) => s.session);
  const finish = useStore((s) => s.finishSession);
  const discard = useStore((s) => s.discardSession);
  const [finishing, setFinishing] = useState(false);

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <Empty icon="checkmark-done-outline" title="Nenhum treino em andamento">
          <Button title="Voltar" onPress={() => router.back()} />
        </Empty>
      </SafeAreaView>
    );
  }

  const done = session.exercicios.reduce((a, e) => a + e.sets.filter((s) => s.feito).length, 0);
  const total = session.exercicios.reduce((a, e) => a + e.sets.length, 0);

  const askDiscard = () =>
    Alert.alert('Descartar treino?', 'Nada deste treino será salvo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          discard();
          router.back();
        },
      },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <IconButton icon="chevron-down" label="Minimizar treino" onPress={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T v="h3" numberOfLines={1}>
            {session.nome}
          </T>
          <Elapsed inicio={session.inicio} />
        </View>
        <Button small title="Finalizar" onPress={() => setFinishing(true)} disabled={!done} />
      </View>
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm, flexDirection: 'row', gap: space.lg }}>
        <T v="small">
          <Text style={{ color: colors.text, fontWeight: '700' }}>{done}</Text>/{total} séries
        </T>
        <T v="small">
          Volume <Text style={{ color: colors.text, fontWeight: '700' }}>{sessionVolume(session.exercicios).toLocaleString('pt-BR')} kg</Text>
        </T>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 160, gap: space.lg }} keyboardShouldPersistTaps="handled">
          {session.exercicios.map((e, i) => (
            <ExerciseBlock key={e.uid} item={e} index={i} count={session.exercicios.length} />
          ))}
          <Button
            title="Adicionar exercício"
            icon="add"
            variant="secondary"
            onPress={() => router.push({ pathname: '/selecionar-exercicio', params: { target: 'session', mode: 'add' } })}
          />
          <Button title="Descartar treino" variant="ghost" onPress={askDiscard} style={{ alignSelf: 'center' }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <RestTimer />

      <FinishModal
        visible={finishing}
        onClose={() => setFinishing(false)}
        done={done}
        total={total}
        onConfirm={(nota) => {
          setFinishing(false);
          const id = finish(nota);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          if (id) router.replace({ pathname: '/historico/[id]', params: { id, novo: '1' } });
        }}
      />
    </SafeAreaView>
  );
}

function Elapsed({ inicio }: { inicio: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return <T v="small">{formatDuration(now - new Date(inicio).getTime())}</T>;
}

const TIPO_ORDER: SetTipo[] = ['normal', 'aquecimento', 'dropset', 'falha'];
const TIPO_SHORT: Record<SetTipo, string> = { normal: '', aquecimento: 'A', dropset: 'D', falha: 'F' };
const TIPO_COLOR: Record<SetTipo, string> = { normal: colors.text, aquecimento: colors.warn, dropset: colors.protein, falha: colors.danger };

function ExerciseBlock({ item, index, count }: { item: SessionExercise; index: number; count: number }) {
  const ex = useExercise(item.exerciseId);
  const history = useStore((s) => s.history);
  const settings = useStore((s) => s.settings);
  const addSet = useStore((s) => s.addSet);
  const removeEx = useStore((s) => s.removeSessionExercise);
  const moveEx = useStore((s) => s.moveSessionExercise);
  const updateEx = useStore((s) => s.updateSessionExercise);
  const [menu, setMenu] = useState(false);

  const last = useMemo(() => lastPerformance(history, item.exerciseId), [history, item.exerciseId]);
  const sug = useMemo(() => suggest(last, item.repMin, item.repMax, item.exerciseId, settings), [last, item.repMin, item.repMax, item.exerciseId, settings]);
  const allDone = item.sets.length > 0 && item.sets.every((s) => s.feito);
  let workIdx = 0;

  return (
    <Card style={[{ padding: space.md }, allDone && { borderColor: colors.success }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Pressable onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: item.exerciseId } })}>
          <ExerciseThumb exercise={ex} size={52} />
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: item.exerciseId } })}>
          <T v="h3" numberOfLines={2}>
            {ex?.nome ?? 'Exercício'}
          </T>
          <T v="small">
            Meta {repRange(item.repMin, item.repMax, ex?.porTempo)} {ex?.porTempo ? '' : 'reps'} · descanso {fmtRest(item.descansoSeg)}
          </T>
        </Pressable>
        <IconButton icon="ellipsis-horizontal" label="Opções do exercício" onPress={() => setMenu((m) => !m)} />
      </View>

      {menu && (
        <View style={styles.menu}>
          <Button small variant="secondary" icon="play-circle-outline" title="Como fazer" onPress={() => router.push({ pathname: '/exercicio/[id]', params: { id: item.exerciseId } })} />
          <Button
            small
            variant="secondary"
            icon="swap-horizontal"
            title="Trocar"
            onPress={() => {
              setMenu(false);
              router.push({ pathname: '/selecionar-exercicio', params: { target: 'session', mode: 'swap', exUid: item.uid, current: item.exerciseId } });
            }}
          />
          <IconButton icon="arrow-up" label="Subir" onPress={() => moveEx(item.uid, -1)} color={index > 0 ? colors.textDim : colors.surface3} />
          <IconButton icon="arrow-down" label="Descer" onPress={() => moveEx(item.uid, 1)} color={index < count - 1 ? colors.textDim : colors.surface3} />
          <IconButton
            icon="trash-outline"
            label="Remover"
            color={colors.danger}
            onPress={() =>
              Alert.alert('Remover exercício?', ex?.nome, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Remover', style: 'destructive', onPress: () => removeEx(item.uid) },
              ])
            }
          />
          <View style={{ width: '100%', marginTop: space.sm }}>
            <Stepper label="Descanso deste exercício" value={item.descansoSeg} step={15} min={0} max={600} suffix="s" onChange={(descansoSeg) => updateEx(item.uid, { descansoSeg })} />
          </View>
        </View>
      )}

      {(sug || item.notas) && (
        <View style={{ marginTop: space.sm, gap: 4 }}>
          {sug && (
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
              <Ionicons name={sug.subir ? 'trending-up' : 'repeat'} size={15} color={sug.subir ? colors.success : colors.textDim} style={{ marginTop: 2 }} />
              <T v="small" style={{ flex: 1, color: sug.subir ? colors.success : colors.textDim }}>
                {sug.texto}
              </T>
            </View>
          )}
          {item.notas ? (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Ionicons name="document-text-outline" size={15} color={colors.textMute} style={{ marginTop: 2 }} />
              <T v="small" style={{ flex: 1 }}>
                {item.notas}
              </T>
            </View>
          ) : null}
        </View>
      )}

      <View style={[styles.row, { marginTop: space.md }]}>
        <Text style={[styles.th, { width: 36 }]}>SÉRIE</Text>
        <Text style={[styles.th, { flex: 1.3 }]}>ANTERIOR</Text>
        <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>KG</Text>
        <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>{ex?.porTempo ? 'SEG' : 'REPS'}</Text>
        <View style={{ width: 44 }} />
      </View>
      {item.sets.map((s, i) => {
        const label = s.tipo === 'normal' ? String(++workIdx) : TIPO_SHORT[s.tipo];
        return <SetRow key={i} exUid={item.uid} idx={i} set={s} label={label} last={last} repMin={item.repMin} repMax={item.repMax} />;
      })}
      <Pressable style={styles.addSet} onPress={() => { tap(); addSet(item.uid); }}>
        <Ionicons name="add" size={16} color={colors.textDim} />
        <T v="small" style={{ fontWeight: '600' }}>
          Série
        </T>
      </Pressable>
    </Card>
  );
}

function parseNum(t: string): number | null {
  const n = Number(t.replace(',', '.'));
  return t.trim() === '' || Number.isNaN(n) ? null : n;
}

function NumInput({ value, onChange, placeholder, decimal }: { value: number | null; onChange: (n: number | null) => void; placeholder?: string; decimal?: boolean }) {
  const formatted = value == null ? '' : String(value).replace('.', ',');
  const [text, setText] = useState(formatted);
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={focused ? text : formatted}
      onChangeText={(t) => {
        setText(t);
        onChange(parseNum(t));
      }}
      onFocus={() => {
        setText(formatted);
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      placeholder={placeholder}
      placeholderTextColor={colors.textMute}
      selectTextOnFocus
      style={styles.input}
    />
  );
}

function SetRow({
  exUid,
  idx,
  set,
  label,
  last,
  repMin,
  repMax,
}: {
  exUid: string;
  idx: number;
  set: SetLog;
  label: string;
  last?: LastPerformance;
  repMin: number;
  repMax: number;
}) {
  const update = useStore((s) => s.updateSet);
  const complete = useStore((s) => s.completeSet);
  const remove = useStore((s) => s.removeSet);
  const prev = last?.sets[idx];

  const cycleTipo = () => {
    tap();
    const next = TIPO_ORDER[(TIPO_ORDER.indexOf(set.tipo) + 1) % TIPO_ORDER.length];
    update(exUid, idx, { tipo: next });
  };

  return (
    <Pressable
      onLongPress={() =>
        Alert.alert('Remover série?', undefined, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Remover', style: 'destructive', onPress: () => remove(exUid, idx) },
        ])
      }
      style={[styles.row, styles.setRow, set.feito && { backgroundColor: colors.successSoft }]}
    >
      <Pressable onPress={cycleTipo} style={styles.setNum} accessibilityLabel={`Tipo da série: ${SET_TIPO_LABEL[set.tipo]}. Toque para mudar.`}>
        <Text style={{ color: TIPO_COLOR[set.tipo], fontWeight: '800' }}>{label}</Text>
      </Pressable>
      <Pressable
        style={{ flex: 1.3 }}
        onPress={() => {
          if (!prev) return;
          tap();
          update(exUid, idx, { peso: prev.peso, reps: prev.reps });
        }}
      >
        <Text style={{ color: colors.textMute, fontSize: 13, fontVariant: ['tabular-nums'] }} numberOfLines={1}>
          {!prev ? '—' : prev.peso == null || prev.peso === 0 ? `${prev.reps ?? '-'} reps` : `${fmtKg(prev.peso).replace(' kg', '')} × ${prev.reps ?? '-'}`}
        </Text>
      </Pressable>
      <View style={{ flex: 1, paddingHorizontal: 3 }}>
        <NumInput decimal value={set.peso} onChange={(peso) => update(exUid, idx, { peso })} placeholder="0" />
      </View>
      <View style={{ flex: 1, paddingHorizontal: 3 }}>
        <NumInput value={set.reps} onChange={(reps) => update(exUid, idx, { reps })} placeholder={repRange(repMin, repMax)} />
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          complete(exUid, idx);
        }}
        style={[styles.check, set.feito && { backgroundColor: colors.success }]}
        accessibilityLabel={set.feito ? 'Desmarcar série' : 'Concluir série'}
      >
        <Ionicons name="checkmark" size={20} color={set.feito ? '#062915' : colors.textMute} />
      </Pressable>
    </Pressable>
  );
}

function FinishModal({
  visible,
  onClose,
  onConfirm,
  done,
  total,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (nota: string) => void;
  done: number;
  total: number;
}) {
  const [nota, setNota] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modal}>
          <T v="h1">Finalizar treino?</T>
          <T v="small">
            {done} de {total} séries concluídas.{done < total ? ' Séries não marcadas não serão salvas.' : ''}
          </T>
          <TextInput
            value={nota}
            onChangeText={setNota}
            placeholder="Como foi o treino? (opcional)"
            placeholderTextColor={colors.textMute}
            multiline
            style={[styles.input, { textAlign: 'left', minHeight: 70, padding: space.md, marginTop: space.md }]}
          />
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
            <Button title="Voltar" variant="secondary" style={{ flex: 1 }} onPress={onClose} />
            <Button title="Salvar treino" style={{ flex: 1 }} onPress={() => onConfirm(nota)} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm },
  menu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
    padding: space.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  th: { color: colors.textMute, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  setRow: { marginTop: 6, paddingVertical: 4, borderRadius: radius.sm },
  setNum: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  input: {
    backgroundColor: colors.surface2,
    color: colors.text,
    borderRadius: radius.sm,
    height: 38,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    borderWidth: 1,
    borderColor: colors.border,
  },
  check: {
    width: 38,
    height: 38,
    marginLeft: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSet: {
    marginTop: space.sm,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: space.lg },
  modal: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.xl, gap: space.xs },
});
